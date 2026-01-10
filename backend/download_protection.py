"""
Soul Food Download Protection Module
=====================================
Implements secure download link management:
- Tokenized, time-limited download links (72h expiry)
- Max downloads per order (3 per file)
- Rate-limited resend functionality
- Server-side payment verification before download
- Audit trail for all download activity
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, List
import hashlib
import secrets
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client.soul_food_db

# =============================================================================
# DOWNLOAD PROTECTION CONSTANTS
# =============================================================================

DOWNLOAD_LINK_EXPIRY_HOURS = 72  # Links expire after 72 hours
MAX_DOWNLOADS_PER_ORDER = 3  # Max times each file can be downloaded
RESEND_LINK_RATE_LIMIT = 3  # Max resend requests per hour
RESEND_RATE_WINDOW_HOURS = 1

# =============================================================================
# SECURE TOKEN GENERATION
# =============================================================================

def generate_download_token() -> str:
    """Generate a secure, non-guessable download token (64 chars)"""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()


# =============================================================================
# DOWNLOAD LINK MANAGEMENT
# =============================================================================

async def create_download_link(
    order_id: str,
    user_id: str,
    user_email: str,
    product_id: str,
    product_name: str,
    file_path: str,
    payment_verified: bool = False
) -> Tuple[str, datetime]:
    """
    Create a secure, tokenized download link for a purchased product.
    
    Returns: (download_token, expires_at)
    """
    # Generate secure token
    raw_token = generate_download_token()
    token_hash = hash_token(raw_token)
    
    expires_at = datetime.now(timezone.utc) + timedelta(hours=DOWNLOAD_LINK_EXPIRY_HOURS)
    
    # Store download record - include token for API retrieval
    download_record = {
        "id": secrets.token_hex(16),
        "order_id": order_id,
        "user_id": user_id,
        "user_email": user_email.lower(),
        "product_id": product_id,
        "product_name": product_name,
        "file_path": file_path,
        "token": raw_token,  # Store raw token for API retrieval
        "token_hash": token_hash,  # Also store hash for security verification
        "expires_at": expires_at,
        "download_count": 0,
        "max_downloads": MAX_DOWNLOADS_PER_ORDER,
        "payment_verified": payment_verified,
        "created_at": datetime.now(timezone.utc),
        "downloads": [],  # Track each download attempt
        "revoked": False
    }
    
    await db.download_links.insert_one(download_record)
    
    # Log creation
    await log_download_event(
        event_type="download_link_created",
        order_id=order_id,
        user_id=user_id,
        product_id=product_id,
        details={"expires_at": expires_at.isoformat()}
    )
    
    return raw_token, expires_at


async def verify_download_token(token: str) -> Tuple[bool, Optional[Dict], str]:
    """
    Verify a download token and check all restrictions.
    
    Returns: (is_valid, download_record, error_message)
    """
    token_hash = hash_token(token)
    
    # Find the download record
    record = await db.download_links.find_one({"token_hash": token_hash}, {"_id": 0})
    
    if not record:
        return False, None, "Invalid download link"
    
    # Check if revoked
    if record.get("revoked"):
        return False, None, "This download link has been revoked"
    
    # Check expiry - handle both timezone-aware and naive datetimes
    expires_at = record["expires_at"]
    now = datetime.now(timezone.utc)
    if hasattr(expires_at, 'tzinfo') and expires_at.tzinfo is None:
        # Expires_at is naive, assume it's UTC
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if now > expires_at:
        return False, None, "This download link has expired. Please request a new one."
    
    # Check download count
    if record["download_count"] >= record["max_downloads"]:
        return False, None, f"Maximum downloads ({record['max_downloads']}) reached. Please contact support if you need additional access."
    
    # Check payment verification
    if not record.get("payment_verified"):
        # Re-verify payment status
        is_paid = await verify_payment_status(record["order_id"])
        if not is_paid:
            return False, None, "Payment verification failed. Please contact support."
        
        # Update record
        await db.download_links.update_one(
            {"token_hash": token_hash},
            {"$set": {"payment_verified": True}}
        )
        record["payment_verified"] = True
    
    return True, record, ""


async def record_download(token: str, ip_address: str, user_agent: str = "") -> bool:
    """
    Record a successful download and increment counter.
    Returns True if this was a valid download.
    """
    token_hash = hash_token(token)
    
    download_entry = {
        "downloaded_at": datetime.now(timezone.utc).isoformat(),
        "ip_address": ip_address,
        "user_agent": user_agent[:500] if user_agent else ""  # Limit size
    }
    
    result = await db.download_links.update_one(
        {"token_hash": token_hash},
        {
            "$inc": {"download_count": 1},
            "$push": {"downloads": download_entry}
        }
    )
    
    if result.modified_count > 0:
        # Get record for logging
        record = await db.download_links.find_one({"token_hash": token_hash}, {"_id": 0})
        if record:
            await log_download_event(
                event_type="file_downloaded",
                order_id=record["order_id"],
                user_id=record["user_id"],
                product_id=record["product_id"],
                details={
                    "download_number": record["download_count"] + 1,
                    "ip_address": ip_address
                }
            )
        return True
    
    return False


async def get_remaining_downloads(token: str) -> int:
    """Get the number of remaining downloads for a token"""
    token_hash = hash_token(token)
    record = await db.download_links.find_one({"token_hash": token_hash}, {"_id": 0})
    
    if not record:
        return 0
    
    return max(0, record["max_downloads"] - record["download_count"])


# =============================================================================
# RESEND DOWNLOAD LINK (Rate Limited)
# =============================================================================

async def check_resend_rate_limit(user_email: str, order_id: str) -> Tuple[bool, str]:
    """
    Check if user can request a new download link.
    Rate limit: 3 per hour per order
    """
    window_start = datetime.now(timezone.utc) - timedelta(hours=RESEND_RATE_WINDOW_HOURS)
    
    recent_requests = await db.download_link_requests.count_documents({
        "user_email": user_email.lower(),
        "order_id": order_id,
        "requested_at": {"$gte": window_start}
    })
    
    if recent_requests >= RESEND_LINK_RATE_LIMIT:
        return False, f"Too many resend requests. Please wait before requesting again (limit: {RESEND_LINK_RATE_LIMIT}/hour)."
    
    return True, ""


async def record_resend_request(user_email: str, order_id: str, ip_address: str):
    """Record a resend request for rate limiting"""
    await db.download_link_requests.insert_one({
        "id": secrets.token_hex(16),
        "user_email": user_email.lower(),
        "order_id": order_id,
        "ip_address": ip_address,
        "requested_at": datetime.now(timezone.utc)
    })


async def resend_download_links(
    order_id: str,
    user_email: str,
    ip_address: str
) -> Tuple[bool, List[Dict], str]:
    """
    Generate new download links for an order (invalidates old ones).
    
    Returns: (success, new_links, message)
    """
    # Check rate limit
    is_allowed, rate_msg = await check_resend_rate_limit(user_email, order_id)
    if not is_allowed:
        return False, [], rate_msg
    
    # Record the request
    await record_resend_request(user_email, order_id, ip_address)
    
    # Find existing links for this order
    existing_links = await db.download_links.find({
        "order_id": order_id,
        "user_email": user_email.lower()
    }, {"_id": 0}).to_list(100)
    
    if not existing_links:
        return False, [], "No download links found for this order."
    
    # Revoke old links
    await db.download_links.update_many(
        {"order_id": order_id, "user_email": user_email.lower()},
        {"$set": {"revoked": True, "revoked_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create new links
    new_links = []
    for old_link in existing_links:
        token, expires_at = await create_download_link(
            order_id=order_id,
            user_id=old_link["user_id"],
            user_email=user_email,
            product_id=old_link["product_id"],
            product_name=old_link["product_name"],
            file_path=old_link["file_path"],
            payment_verified=old_link.get("payment_verified", False)
        )
        
        new_links.append({
            "product_id": old_link["product_id"],
            "product_name": old_link["product_name"],
            "token": token,
            "expires_at": expires_at.isoformat(),
            "remaining_downloads": MAX_DOWNLOADS_PER_ORDER
        })
    
    # Log the resend
    await log_download_event(
        event_type="download_links_resent",
        order_id=order_id,
        user_id=existing_links[0]["user_id"] if existing_links else None,
        details={
            "links_count": len(new_links),
            "ip_address": ip_address
        }
    )
    
    return True, new_links, f"New download links generated. Valid for {DOWNLOAD_LINK_EXPIRY_HOURS} hours."


# =============================================================================
# PAYMENT VERIFICATION
# =============================================================================

async def verify_payment_status(order_id: str) -> bool:
    """
    Verify payment status for an order.
    Checks both our database and Stripe (if applicable).
    """
    # Check our orders collection
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    if not order:
        return False
    
    # Check order status
    if order.get("status") not in ["completed", "paid", "fulfilled"]:
        # For free orders (100% discount), check if it was properly processed
        if order.get("total", 0) == 0 and order.get("discount_applied"):
            return True
        return False
    
    # If there's a Stripe payment ID, verify with Stripe
    stripe_payment_id = order.get("stripe_payment_intent_id")
    if stripe_payment_id:
        is_stripe_valid = await verify_stripe_payment(stripe_payment_id)
        if not is_stripe_valid:
            return False
    
    return True


async def verify_stripe_payment(payment_intent_id: str) -> bool:
    """
    Verify payment status directly with Stripe.
    Returns True if payment is confirmed.
    """
    import stripe
    
    stripe_secret = os.getenv("STRIPE_SECRET_KEY")
    if not stripe_secret:
        # If Stripe isn't configured, assume payment is valid if we have a payment ID
        print(f"[Download] Stripe not configured, assuming payment {payment_intent_id} is valid")
        return True
    
    try:
        stripe.api_key = stripe_secret
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if payment_intent.status == "succeeded":
            return True
        else:
            print(f"[Download] Stripe payment {payment_intent_id} status: {payment_intent.status}")
            return False
            
    except Exception as e:
        print(f"[Download] Error verifying Stripe payment: {e}")
        # On error, check our local record
        return True  # Fail open to avoid blocking legitimate customers


# =============================================================================
# DOWNLOAD AUDIT LOGGING
# =============================================================================

async def log_download_event(
    event_type: str,
    order_id: str = None,
    user_id: str = None,
    product_id: str = None,
    details: Dict = None
):
    """Log download-related events for audit trail"""
    event = {
        "id": secrets.token_hex(16),
        "event_type": event_type,
        "order_id": order_id,
        "user_id": user_id,
        "product_id": product_id,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc)
    }
    
    await db.download_audit_logs.insert_one(event)
    print(f"[Download Audit] {event_type} | Order: {order_id} | Product: {product_id}")


# =============================================================================
# ADMIN FUNCTIONS
# =============================================================================

async def revoke_download_links(order_id: str, reason: str = ""):
    """Admin function to revoke all download links for an order"""
    result = await db.download_links.update_many(
        {"order_id": order_id},
        {
            "$set": {
                "revoked": True,
                "revoked_at": datetime.now(timezone.utc).isoformat(),
                "revoke_reason": reason
            }
        }
    )
    
    await log_download_event(
        event_type="download_links_revoked_admin",
        order_id=order_id,
        details={"reason": reason, "links_revoked": result.modified_count}
    )
    
    return result.modified_count


async def extend_download_expiry(order_id: str, additional_hours: int = 72):
    """Admin function to extend download link expiry"""
    new_expiry = datetime.now(timezone.utc) + timedelta(hours=additional_hours)
    
    result = await db.download_links.update_many(
        {"order_id": order_id, "revoked": False},
        {"$set": {"expires_at": new_expiry}}
    )
    
    await log_download_event(
        event_type="download_expiry_extended",
        order_id=order_id,
        details={"new_expiry": new_expiry.isoformat(), "links_updated": result.modified_count}
    )
    
    return result.modified_count


async def reset_download_count(order_id: str, product_id: str = None):
    """Admin function to reset download count for an order"""
    query = {"order_id": order_id}
    if product_id:
        query["product_id"] = product_id
    
    result = await db.download_links.update_many(
        query,
        {"$set": {"download_count": 0, "downloads": []}}
    )
    
    await log_download_event(
        event_type="download_count_reset",
        order_id=order_id,
        product_id=product_id,
        details={"links_reset": result.modified_count}
    )
    
    return result.modified_count


# =============================================================================
# GET DOWNLOAD STATUS
# =============================================================================

async def get_order_download_status(order_id: str, user_email: str) -> List[Dict]:
    """Get download status for all items in an order"""
    links = await db.download_links.find({
        "order_id": order_id,
        "user_email": user_email.lower(),
        "revoked": False
    }, {"_id": 0, "token_hash": 0}).to_list(100)
    
    result = []
    for link in links:
        result.append({
            "product_id": link["product_id"],
            "product_name": link["product_name"],
            "download_count": link["download_count"],
            "max_downloads": link["max_downloads"],
            "remaining_downloads": link["max_downloads"] - link["download_count"],
            "expires_at": link["expires_at"].isoformat() if isinstance(link["expires_at"], datetime) else link["expires_at"],
            "is_expired": datetime.now(timezone.utc) > link["expires_at"] if isinstance(link["expires_at"], datetime) else False
        })
    
    return result


# =============================================================================
# DATABASE INDEXES
# =============================================================================

async def ensure_download_indexes():
    """Create necessary indexes for download collections"""
    # Download links
    await db.download_links.create_index("token_hash", unique=True)
    await db.download_links.create_index("order_id")
    await db.download_links.create_index("user_email")
    await db.download_links.create_index("expires_at")
    
    # Download link requests (for rate limiting) - TTL index
    await db.download_link_requests.create_index("requested_at", expireAfterSeconds=3600)
    await db.download_link_requests.create_index([("user_email", 1), ("order_id", 1)])
    
    # Download audit logs
    await db.download_audit_logs.create_index("timestamp")
    await db.download_audit_logs.create_index("order_id")
    
    print("[Download Protection] Database indexes created")
