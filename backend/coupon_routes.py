"""
Coupon Routes - Refactored to use MongoDB
==========================================
- All coupons stored in MongoDB `coupons` collection
- Admin endpoints for CRUD operations
- Migration script to seed initial coupons
- Gift certificate discount codes handled separately
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List
from datetime import datetime, timezone
from jose import JWTError, jwt
import os
import secrets

router = APIRouter(prefix="/api/coupons", tags=["coupons"])

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "soul-food-secret-key-change-in-production-2024")
ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

# =============================================================================
# Models
# =============================================================================

class CouponValidateRequest(BaseModel):
    code: str
    product_ids: list[str] = []
    cart_total: float = 0
    quantity: int = 1

class CouponValidateResponse(BaseModel):
    valid: bool
    discount_percent: int = 0
    discount_dollars: float = 0
    override_total: Optional[float] = None  # If set, this becomes the cart total
    message: str
    code: str
    is_gift_certificate: bool = False

class CouponCreate(BaseModel):
    code: str
    discount_percent: int = Field(ge=0, le=100)
    max_uses: int = Field(default=100, ge=1)
    min_quantity: Optional[int] = None
    contributor: Optional[str] = None
    conditions: Optional[str] = None
    role: Optional[str] = None
    session_limit_mins: Optional[int] = None
    applies_to: Optional[List[str]] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    active: bool = True

class CouponUpdate(BaseModel):
    discount_percent: Optional[int] = Field(default=None, ge=0, le=100)
    max_uses: Optional[int] = Field(default=None, ge=1)
    min_quantity: Optional[int] = None
    conditions: Optional[str] = None
    active: Optional[bool] = None
    valid_until: Optional[datetime] = None

# =============================================================================
# Default Coupons (for seeding)
# =============================================================================

DEFAULT_COUPONS = [
    # Contributor Coupons
    {"code": "SoulX1079", "contributor": "Dee", "max_uses": 50, "discount_percent": 15, "conditions": "All items, single purchase transaction"},
    {"code": "SoulZ1003", "contributor": "Jafari", "max_uses": 50, "discount_percent": 15, "conditions": "All items, single purchase transaction"},
    {"code": "SoulX1060", "contributor": "Rose", "max_uses": 50, "discount_percent": 10, "conditions": "All items, single purchase transaction"},
    {"code": "SoulX1072", "contributor": "Temia", "max_uses": 50, "discount_percent": 10, "conditions": "All items, single purchase transaction"},
    {"code": "SoulX1080", "contributor": "Mike", "max_uses": 50, "discount_percent": 10, "conditions": "All items, single purchase transaction"},
    {"code": "SoulX1059", "contributor": "Vicky", "max_uses": 50, "discount_percent": 10, "conditions": "All items, single purchase transaction"},
    {"code": "SoulX1073", "contributor": "Lee", "max_uses": 50, "discount_percent": 10, "conditions": "All items, single purchase transaction"},
    
    # Beta Test Coupons - TESTII DISABLED
    {"code": "Beta1!2!3!", "max_uses": 20, "discount_percent": 100, "conditions": "Games, holiday, breakfast set 24hr pass, single login session"},
    {"code": "Beta123abc", "max_uses": 20, "discount_percent": 100, "conditions": "Games, holiday, breakfast set 24hr pass, single login session"},
    {"code": "Beta123abcd", "max_uses": 20, "discount_percent": 100, "conditions": "Games, holiday, breakfast set 24hr pass, single login session"},
    {"code": "BETATEST", "max_uses": 100, "discount_percent": 100, "conditions": "Beta tester full access - all items"},
    # {"code": "TESTII", "max_uses": 100, "discount_percent": 99, "conditions": "DISABLED - Live testing"},
    
    # $1 Cart Override Coupon - For testing checkout flow
    {"code": "DOLLARTEST", "max_uses": 50, "discount_type": "fixed_cart", "discount_amount": 0, "override_total": 1.00, "conditions": "Sets entire cart to $1 for checkout testing"},
    
    # RBAC Test Accounts
    {"code": "test12345", "role": "instructor", "max_uses": 100, "discount_percent": 100, "session_limit_mins": 120, "conditions": "IE test - can select game categories, users and lessons to unlock, 2hr session limit"},
    {"code": "test1234", "role": "youth", "max_uses": 3, "discount_percent": 100, "session_limit_mins": 45, "conditions": "YE test - single or one month download, access to current youth game content, 45min session"},
    {"code": "test123", "role": "adult", "max_uses": 5, "discount_percent": 100, "session_limit_mins": 90, "conditions": "AE test - single or one month download, access to current adult game content, 90min session"},
    
    # Bulk Purchase Discount Codes
    {"code": "BOOK10", "max_uses": 1000, "discount_percent": 10, "min_quantity": 5, "conditions": "Book Club Special - 10% off for 5+ items"},
    {"code": "BULK15", "max_uses": 1000, "discount_percent": 15, "min_quantity": 10, "conditions": "Small Bulk Order - 15% off for 10+ items"},
    {"code": "MEGA30", "max_uses": 500, "discount_percent": 30, "min_quantity": 25, "conditions": "Mega Bulk Order - 30% off for 25+ items"},
    
    # Launch Coupons (New - April 2026)
    {"code": "WELCOME10", "max_uses": 500, "discount_percent": 10, "conditions": "Welcome - 10% off all products"},
    {"code": "SOFU5", "max_uses": 300, "discount_type": "fixed_cart", "discount_amount": 5.00, "conditions": "$5 off bundles"},
    {"code": "GAMENIGHT", "max_uses": 200, "discount_type": "fixed_cart", "discount_amount": 10.00, "conditions": "$10 off Game Pass"},
]

# =============================================================================
# Helper Functions
# =============================================================================

async def seed_coupons_if_empty():
    """Seed default coupons if the collection is empty"""
    count = await db.coupons.count_documents({})
    if count == 0:
        now = datetime.now(timezone.utc)
        for coupon in DEFAULT_COUPONS:
            coupon_doc = {
                **coupon,
                "times_used": 0,
                "active": True,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            await db.coupons.insert_one(coupon_doc)
        print(f"✅ Seeded {len(DEFAULT_COUPONS)} default coupons to MongoDB")
        return True
    return False

async def get_current_admin(
    authorization: HTTPAuthorizationCredentials = Depends(security)
):
    """Verify JWT and ensure user has admin access"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        payload = jwt.decode(authorization.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role", "")
        admin_roles = ["admin", "owner", "instructor_tester", "beta_tester"]
        if role not in admin_roles:
            raise HTTPException(status_code=403, detail="Admin access required")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================================
# Public Endpoints
# =============================================================================

async def _validate_redemption_code_as_coupon(input_code: str, request) -> Optional[CouponValidateResponse]:
    """Treat DEMOSOFU* (demo) and BETADOLLAR* (test) redemption codes as checkout
    coupons. Returns a CouponValidateResponse if the code matches a redemption
    code, else None to let the caller continue with its existing fallthrough."""
    rc = await db.redemption_codes.find_one(
        {"code": {"$regex": f"^{input_code}$", "$options": "i"},
         "code_type": {"$in": ["demo", "test"]}},
        {"_id": 0}
    )
    if not rc:
        return None

    # Status / expiry / uses gates (mirrors auto-expire-on-read semantics)
    now = datetime.now(timezone.utc)
    expires_at = rc.get("expires_at")
    if expires_at and isinstance(expires_at, str):
        try:
            expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        except Exception:
            expires_at = None
    if expires_at and getattr(expires_at, "tzinfo", None) is None:
        # Naive datetime stored — assume UTC
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < now:
        # mark expired (cheap on-read sweep, same pattern as code_admin_routes)
        await db.redemption_codes.update_one(
            {"code": rc["code"]},
            {"$set": {"status": "EXPIRED", "updated_at": now}}
        )
        return CouponValidateResponse(valid=False, message="This code has expired", code=rc["code"])

    if rc.get("status") not in ("ACTIVE", None):
        return CouponValidateResponse(
            valid=False,
            message=f"Code is {rc.get('status','inactive').lower()} and cannot be used",
            code=rc["code"]
        )

    max_uses = int(rc.get("max_uses", 0) or 0)
    uses_used = int(rc.get("uses_used", 0) or 0)
    if max_uses > 0 and uses_used >= max_uses:
        return CouponValidateResponse(
            valid=False,
            message=f"This code has reached its maximum usage limit ({max_uses} uses)",
            code=rc["code"]
        )

    code_type = rc.get("code_type")
    if code_type == "demo":
        # Demo codes only apply to BKFT + HOL series products
        product_ids = request.product_ids or []
        if not product_ids:
            return CouponValidateResponse(
                valid=False,
                message="Add an item to your cart before applying this code",
                code=rc["code"]
            )
        allowed_prefixes = ("holiday", "breakfast", "bkft", "hol")
        not_allowed = [p for p in product_ids if not str(p).lower().startswith(allowed_prefixes)]
        if not_allowed:
            return CouponValidateResponse(
                valid=False,
                message="Demo codes are valid for Holiday + Break*fast products only",
                code=rc["code"]
            )
        return CouponValidateResponse(
            valid=True,
            discount_percent=100,
            discount_dollars=0.0,
            message="Demo code applied — 100% off (preview mode, BKFT + HOL only)",
            code=rc["code"]
        )

    if code_type == "test":
        # $1-checkout test codes: override total to $1 regardless of cart
        return CouponValidateResponse(
            valid=True,
            discount_percent=0,
            discount_dollars=0.0,
            override_total=1.0,
            message="Test code applied — cart total set to $1.00",
            code=rc["code"]
        )

    return None


@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(request: CouponValidateRequest):
    """Validate a coupon code and return discount information"""
    
    input_code = request.code.strip()
    
    # FIRST: Check if this is a gift certificate discount code (SFGIFT-XXXXXXXX)
    if input_code.upper().startswith("SFGIFT-"):
        discount_record = await db.discount_codes.find_one({
            "code": input_code.upper(),
            "status": "active"
        })
        
        if discount_record:
            # Check if already used
            if discount_record.get("times_used", 0) >= discount_record.get("max_uses", 1):
                return CouponValidateResponse(
                    valid=False,
                    message="This discount code has already been used",
                    code=input_code
                )
            
            # Check expiration
            if discount_record.get("valid_until"):
                valid_until = discount_record["valid_until"]
                if isinstance(valid_until, str):
                    valid_until = datetime.fromisoformat(valid_until.replace('Z', '+00:00'))
                if datetime.now(timezone.utc) > valid_until:
                    return CouponValidateResponse(
                        valid=False,
                        message="This discount code has expired",
                        code=input_code
                    )
            
            # Valid gift certificate discount!
            amount = discount_record.get("amount_dollars", 0)
            
            # Calculate effective discount percentage for the cart
            effective_percent = 0
            if request.cart_total > 0:
                effective_percent = min(100, int((amount / request.cart_total) * 100))
            
            return CouponValidateResponse(
                valid=True,
                discount_percent=effective_percent,
                discount_dollars=amount,
                message=f"Gift certificate discount: ${amount:.2f} off!",
                code=input_code,
                is_gift_certificate=True
            )
        else:
            return CouponValidateResponse(
                valid=False,
                message="Invalid or expired discount code",
                code=input_code
            )
    
    # SECOND: Check MongoDB coupons collection (case-insensitive)
    coupon = await db.coupons.find_one({
        "code": {"$regex": f"^{input_code}$", "$options": "i"},
        "active": True
    })
    
    if not coupon:
        # THIRD: fall through to redemption_codes (DEMOSOFU* / BETADOLLAR* etc.)
        rc_response = await _validate_redemption_code_as_coupon(input_code, request)
        if rc_response is not None:
            return rc_response
        return CouponValidateResponse(
            valid=False,
            message="Invalid coupon code",
            code=input_code
        )
    
    # Check usage count
    times_used = coupon.get("times_used", 0)
    max_uses = coupon.get("max_uses", 100)
    
    if times_used >= max_uses:
        return CouponValidateResponse(
            valid=False,
            message=f"This coupon has reached its maximum usage limit ({max_uses} uses)",
            code=coupon["code"]
        )
    
    # Check minimum quantity requirement
    min_qty = coupon.get("min_quantity")
    if min_qty and request.quantity < min_qty:
        return CouponValidateResponse(
            valid=False,
            message=f"This coupon requires a minimum of {min_qty} items",
            code=coupon["code"]
        )
    
    # Check validity dates
    now = datetime.now(timezone.utc)
    
    if coupon.get("valid_from"):
        valid_from = coupon["valid_from"]
        if isinstance(valid_from, str):
            valid_from = datetime.fromisoformat(valid_from.replace('Z', '+00:00'))
        if now < valid_from:
            return CouponValidateResponse(
                valid=False,
                message="This coupon is not yet active",
                code=coupon["code"]
            )
    
    if coupon.get("valid_until"):
        valid_until = coupon["valid_until"]
        if isinstance(valid_until, str):
            valid_until = datetime.fromisoformat(valid_until.replace('Z', '+00:00'))
        if now > valid_until:
            return CouponValidateResponse(
                valid=False,
                message="This coupon has expired",
                code=coupon["code"]
            )
    
    # Check if coupon applies to specific products
    if coupon.get("applies_to"):
        applicable = any(pid in coupon["applies_to"] for pid in request.product_ids)
        if not applicable:
            return CouponValidateResponse(
                valid=False,
                message="This coupon does not apply to the items in your cart",
                code=coupon["code"]
            )
    
    # Coupon is valid!
    discount_percent = coupon.get("discount_percent", 0)
    override_total = coupon.get("override_total")  # For $1 test coupon
    discount_amount = coupon.get("discount_amount", 0)  # Fixed dollar discount
    discount_type = coupon.get("discount_type", "percent")
    
    # Calculate discount_dollars for fixed amount coupons
    discount_dollars = 0.0
    if discount_type == "fixed_cart" and discount_amount > 0:
        discount_dollars = min(discount_amount, request.cart_total)  # Don't exceed cart
    
    # Build response message
    if override_total is not None:
        message = f"Coupon applied! Cart total set to ${override_total:.2f}"
    elif discount_type == "fixed_cart" and discount_amount > 0:
        message = f"Coupon applied! ${discount_amount:.2f} off your order"
    else:
        message = f"Coupon applied! You get {discount_percent}% off"
    
    return CouponValidateResponse(
        valid=True,
        discount_percent=discount_percent,
        discount_dollars=discount_dollars,
        override_total=override_total,
        message=message,
        code=coupon["code"]
    )

@router.post("/use/{code}")
async def record_coupon_use(code: str, order_id: Optional[str] = None):
    """Record that a coupon was used (increment usage counter)"""
    
    result = await db.coupons.update_one(
        {"code": {"$regex": f"^{code}$", "$options": "i"}},
        {
            "$inc": {"times_used": 1},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.modified_count == 0:
        # Coupon might not exist in coupons collection — try redemption_codes
        # (DEMOSOFU* / BETADOLLAR* live there)
        rc_result = await db.redemption_codes.update_one(
            {"code": {"$regex": f"^{code}$", "$options": "i"},
             "code_type": {"$in": ["demo", "test"]}},
            {
                "$inc": {"uses_used": 1},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        if rc_result.modified_count == 0:
            # Legacy / unknown — that's still OK, log silently
            pass
    
    # Also record in coupon_usage collection for history
    await db.coupon_usage.insert_one({
        "code": code,
        "order_id": order_id,
        "used_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Usage recorded"}

# =============================================================================
# Admin Endpoints
# =============================================================================

@router.get("/admin/list")
async def list_all_coupons(admin = Depends(get_current_admin)):
    """List all coupons (admin only)"""
    
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(1000)
    return {"coupons": coupons, "count": len(coupons)}

@router.get("/admin/{code}")
async def get_coupon_details(code: str, admin = Depends(get_current_admin)):
    """Get details for a specific coupon (admin only)"""
    
    coupon = await db.coupons.find_one(
        {"code": {"$regex": f"^{code}$", "$options": "i"}},
        {"_id": 0}
    )
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Get usage history
    usage = await db.coupon_usage.find(
        {"code": {"$regex": f"^{code}$", "$options": "i"}},
        {"_id": 0}
    ).to_list(100)
    
    return {"coupon": coupon, "usage_history": usage}

@router.post("/admin/create")
async def create_coupon(coupon: CouponCreate, admin = Depends(get_current_admin)):
    """Create a new coupon (admin only)"""
    
    # Check if coupon already exists
    existing = await db.coupons.find_one({
        "code": {"$regex": f"^{coupon.code}$", "$options": "i"}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    now = datetime.now(timezone.utc)
    coupon_doc = {
        **coupon.dict(exclude_none=True),
        "times_used": 0,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.coupons.insert_one(coupon_doc)
    
    return {"message": "Coupon created successfully", "code": coupon.code}

@router.put("/admin/{code}")
async def update_coupon(code: str, update: CouponUpdate, admin = Depends(get_current_admin)):
    """Update an existing coupon (admin only)"""
    
    update_fields = {k: v for k, v in update.dict().items() if v is not None}
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No update fields provided")
    
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.coupons.update_one(
        {"code": {"$regex": f"^{code}$", "$options": "i"}},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return {"message": "Coupon updated successfully"}

@router.delete("/admin/{code}")
async def delete_coupon(code: str, admin = Depends(get_current_admin)):
    """Delete a coupon (admin only) - actually just deactivates it"""
    
    result = await db.coupons.update_one(
        {"code": {"$regex": f"^{code}$", "$options": "i"}},
        {"$set": {"active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return {"message": "Coupon deactivated successfully"}

@router.post("/admin/seed")
async def seed_default_coupons(admin = Depends(get_current_admin)):
    """Manually seed default coupons (admin only)"""
    
    seeded = await seed_coupons_if_empty()
    
    if seeded:
        return {"message": f"Seeded {len(DEFAULT_COUPONS)} default coupons"}
    else:
        return {"message": "Coupons collection already has data, no seeding performed"}

# =============================================================================
# Startup Event - Seed coupons on first load
# =============================================================================

async def initialize_coupons():
    """Called on app startup to ensure coupons are seeded"""
    await seed_coupons_if_empty()
