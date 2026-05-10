"""
Soul Food Secure Download Routes
================================
Protected download endpoints with:
- Token verification
- Download counting
- Payment verification
- Rate-limited resend
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel, EmailStr
from typing import Optional
import os

from download_protection import (
    verify_download_token, record_download, get_remaining_downloads,
    resend_download_links, get_order_download_status,
    create_download_link, DOWNLOAD_LINK_EXPIRY_HOURS, MAX_DOWNLOADS_PER_ORDER
)

router = APIRouter(prefix="/api/downloads", tags=["downloads"])

# Known content directories to search for PDF files
# Primary: /app/backend/content/* (ships with backend deploy bundle).
# Legacy: /app/content/* kept for any DB rows whose file_path was stored before the move.
CONTENT_DIRS = [
    "/app/backend/content/downloads",
    "/app/backend/content/bonus",
    "/app/backend/content/holiday",
    "/app/backend/lesson_pdfs",
    "/app/content/downloads",
    "/app/content/bonus",
    "/app/content/holiday",
]


def resolve_file_path(stored_path: str) -> str:
    """
    Resolve a file path, trying multiple strategies:
    1. Use stored path as-is (absolute paths)
    2. Try basename in known content directories (for relative paths)
    3. Try the path as relative to each content directory
    Returns the resolved path if found, else empty string.

    Note: Object Storage references (``objstore:<storage_path>``) are NOT
    resolved here — the download endpoint handles those before calling.
    """
    if not stored_path:
        return ""
    if stored_path.startswith("objstore:"):
        # Durable Object Storage reference — not a local path. Caller handles.
        return ""
    
    # 1. Direct path check
    if os.path.isabs(stored_path) and os.path.exists(stored_path):
        return stored_path
    
    # 2. Get just the filename
    basename = os.path.basename(stored_path)
    
    # 3. Try each content directory
    for content_dir in CONTENT_DIRS:
        candidate = os.path.join(content_dir, basename)
        if os.path.exists(candidate):
            return candidate
        # Also try with subdirectories preserved (e.g., "nibbles/file.pdf")
        candidate_full = os.path.join(content_dir, stored_path)
        if os.path.exists(candidate_full):
            return candidate_full
    
    # 4. Relative path from current working directory (fallback)
    if os.path.exists(stored_path):
        return os.path.abspath(stored_path)
    
    print(f"[Download] Could not resolve path: {stored_path} (tried {len(CONTENT_DIRS)} directories)")
    return ""


async def find_object_storage_file(product_id: str, stored_path: str = "") -> Optional[dict]:
    """
    Fallback resolver: look up the file in db.files by product attachment.

    Returns the db.files record (with id, storage_path, original_filename,
    content_type) if a matching, non-deleted file is found.

    Match strategy:
      1. Filter db.files for an active attachment to product:product_id.
      2. Prefer the record whose original_filename matches the basename of
         stored_path (so multiple attachments per product disambiguate to the
         exact file the link was minted against).
      3. Otherwise fall back to the most recently uploaded match.
    """
    if not product_id:
        return None
    try:
        # lazy import to avoid circular with server.py at module load time
        from server import db
    except Exception as e:
        print(f"[Download] Object storage fallback unavailable (db import failed): {e}")
        return None

    query = {
        "is_deleted": False,
        "attachments": {
            "$elemMatch": {"target_type": "product", "target_id": product_id}
        },
    }
    basename = os.path.basename(stored_path or "").lower()
    if basename:
        # Try exact filename match first — disambiguates aliased products
        exact = await db.files.find_one(
            {**query, "original_filename": {"$regex": f"^{basename}$", "$options": "i"}},
            {"_id": 0, "id": 1, "storage_path": 1, "original_filename": 1, "content_type": 1},
        )
        if exact:
            return exact
    return await db.files.find_one(
        query,
        {"_id": 0, "id": 1, "storage_path": 1, "original_filename": 1, "content_type": 1},
        sort=[("created_at", -1)],
    )


async def _stream_from_object_storage(
    storage_path: str,
    record: dict,
    token: str,
    ip_address: str,
    user_agent: str,
    original_filename: Optional[str] = None,
    content_type: Optional[str] = None,
) -> Response:
    """Stream a file from Emergent Object Storage as the response body. Records
    the download against the link token and surfaces the same X-* headers
    used by local-disk downloads. Common helper used by both the
    ``objstore:<path>`` branch and the db.files product-attachment fallback."""
    try:
        import storage_service as ss
        data, fetched_ct = ss.get_object(storage_path)
    except Exception as storage_err:
        # If the storage backend reported a missing object, surface 404 so the
        # frontend can show "file not found" rather than "try again later".
        # 5xx (timeouts, key issues, etc.) stay as 502.
        status_code = 502
        try:
            import requests
            if isinstance(storage_err, requests.HTTPError) and storage_err.response is not None:
                if storage_err.response.status_code == 404:
                    status_code = 404
        except Exception:
            pass
        print(f"[Download] Object Storage read failed for {storage_path}: {storage_err} (returning {status_code})")
        if status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="File no longer available. Please contact support@kingdom-soul.com to have it re-uploaded."
            )
        raise HTTPException(
            status_code=502,
            detail="Storage temporarily unavailable. Please try again or contact support@kingdom-soul.com."
        )

    # Record the download (same accounting as the local path)
    await record_download(token, ip_address, user_agent)
    remaining = await get_remaining_downloads(token)

    # Generate safe download filename
    product_name = record.get("product_name", "Download")
    safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in product_name)
    safe_name = safe_name.strip().replace(" ", "_")[:100]
    ext = os.path.splitext(original_filename or "file.pdf")[1] or ".pdf"
    filename = f"SoulFood_{safe_name}{ext}"

    headers = {"X-Downloads-Remaining": str(remaining), "X-Source": "object-storage"}
    try:
        expires_at = record.get("expires_at")
        if expires_at and hasattr(expires_at, "isoformat"):
            headers["X-Download-Expires"] = expires_at.isoformat()
        elif expires_at:
            headers["X-Download-Expires"] = str(expires_at)
    except Exception:
        pass
    headers["Content-Disposition"] = f'attachment; filename="{filename}"'

    media_type = content_type or fetched_ct or "application/octet-stream"
    return Response(content=data, media_type=media_type, headers=headers)


# =============================================================================
# REQUEST MODELS
# =============================================================================

class ResendLinkRequest(BaseModel):
    order_id: str
    email: EmailStr


class DownloadStatusRequest(BaseModel):
    order_id: str
    email: EmailStr


# =============================================================================
# SECURE DOWNLOAD ENDPOINT
# =============================================================================

@router.get("/file/{token}")
async def download_file(token: str, request: Request):
    """
    Secure file download with token verification.
    
    Checks:
    - Token validity
    - Link expiry (72h)
    - Download count (max 3)
    - Payment verification
    """
    try:
        ip_address = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        # Verify token and all restrictions
        is_valid, record, error_msg = await verify_download_token(token)
        
        if not is_valid:
            raise HTTPException(status_code=403, detail=error_msg)
        
        # Get the file path and resolve it
        file_path = record["file_path"]

        # Object Storage reference (preferred for new fulfillments).
        # Format: ``objstore:<storage_path>``. Stream directly without disk lookup.
        if isinstance(file_path, str) and file_path.startswith("objstore:"):
            storage_path = file_path[len("objstore:"):]
            obj_meta = None
            try:
                # lazy db lookup for original filename + content type
                from server import db as _db
                obj_meta = await _db.files.find_one(
                    {"storage_path": storage_path},
                    {"_id": 0, "original_filename": 1, "content_type": 1},
                )
            except Exception:
                pass
            return await _stream_from_object_storage(
                storage_path, record, token, ip_address, user_agent,
                original_filename=(obj_meta or {}).get("original_filename"),
                content_type=(obj_meta or {}).get("content_type"),
            )

        resolved_path = resolve_file_path(file_path)

        if not resolved_path:
            # Fallback: look up the file in db.files by product attachment and
            # stream from durable Emergent Object Storage. This is the path the
            # legacy-files migration enabled — even after a redeploy that drops
            # /app/backend/content/, paid downloads keep working.
            product_id = record.get("product_id") or record.get("normalized_product_id") or ""
            obj_record = await find_object_storage_file(product_id, file_path)
            if obj_record:
                return await _stream_from_object_storage(
                    obj_record["storage_path"], record, token, ip_address, user_agent,
                    original_filename=obj_record.get("original_filename"),
                    content_type=obj_record.get("content_type"),
                )

            print(f"[Download] FILE NOT FOUND for token. Stored path: {file_path}; "
                  f"no Object Storage attachment for product {product_id}")
            raise HTTPException(
                status_code=404,
                detail="File not found on server. Please contact support@kingdom-soul.com for assistance."
            )
        
        # Record the download
        await record_download(token, ip_address, user_agent)
        
        # Get remaining downloads for response header
        remaining = await get_remaining_downloads(token)
        
        # Generate safe download filename
        product_name = record.get("product_name", "Download")
        safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in product_name)
        safe_name = safe_name.strip().replace(" ", "_")[:100]
        filename = f"SoulFood_{safe_name}.pdf"
        
        # Build response headers safely
        headers = {"X-Downloads-Remaining": str(remaining)}
        try:
            expires_at = record.get("expires_at")
            if expires_at and hasattr(expires_at, "isoformat"):
                headers["X-Download-Expires"] = expires_at.isoformat()
            elif expires_at:
                headers["X-Download-Expires"] = str(expires_at)
        except Exception:
            pass
        
        return FileResponse(
            resolved_path,
            media_type="application/pdf",
            filename=filename,
            headers=headers
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Download] UNEXPECTED ERROR serving file: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Download failed. Please try again or contact support@kingdom-soul.com."
        )


@router.get("/remaining/{token}")
async def get_download_info(token: str):
    """Get remaining downloads and expiry info for a token"""
    
    is_valid, record, error_msg = await verify_download_token(token)
    
    if not is_valid:
        return {
            "valid": False,
            "error": error_msg,
            "remaining_downloads": 0
        }
    
    remaining = await get_remaining_downloads(token)
    
    return {
        "valid": True,
        "product_name": record["product_name"],
        "remaining_downloads": remaining,
        "max_downloads": record["max_downloads"],
        "expires_at": record["expires_at"].isoformat() if hasattr(record["expires_at"], "isoformat") else str(record["expires_at"]),
        "download_count": record["download_count"]
    }


# =============================================================================
# RESEND DOWNLOAD LINK
# =============================================================================

@router.post("/resend-links")
async def resend_download_link(data: ResendLinkRequest, request: Request):
    """
    Request new download links for an order.

    Rate limited: 3 requests per hour per order.
    Old links are invalidated.

    Auto-fulfillment: if no download links exist yet (order is stuck in
    "Processing"), we attempt to fulfill the order on demand using the
    same logic the admin Refulfill button uses. The order email + identity
    are verified against the payment_transactions record to prevent abuse.
    """
    ip_address = request.client.host if request.client else "unknown"

    success, new_links, message = await resend_download_links(
        order_id=data.order_id,
        user_email=data.email,
        ip_address=ip_address
    )

    auto_fulfilled = False
    if not success and "No download links found" in message:
        # Stuck-order recovery: verify the order belongs to this email AND is paid,
        # then run the SAME refulfill logic the admin uses. After that, retry the
        # resend. This is the customer self-serve path for "Processing" forever orders.
        from motor.motor_asyncio import AsyncIOMotorClient as _Cli
        _db = _Cli(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
        tx = await _db.payment_transactions.find_one(
            {"order_number": data.order_id.strip().upper()},
            {"_id": 0, "customer_email": 1, "payment_status": 1}
        )
        if tx and tx.get("payment_status") == "paid":
            tx_email = (tx.get("customer_email") or "").lower().strip()
            req_email = (data.email or "").lower().strip()
            if tx_email and tx_email == req_email:
                try:
                    from payment_routes import _do_refulfill_order
                    refulfill_result = await _do_refulfill_order(data.order_id.strip().upper())
                    if refulfill_result.get("downloads_created", 0) > 0:
                        auto_fulfilled = True
                        # Retry the resend now that links exist
                        success, new_links, message = await resend_download_links(
                            order_id=data.order_id,
                            user_email=data.email,
                            ip_address=ip_address
                        )
                except HTTPException:
                    # Order not paid / not found — fall through to the original error
                    pass
                except Exception as e:
                    print(f"[Resend self-serve refulfill] failed for {data.order_id}: {e}")

    if not success:
        # Distinguish between "no links exist" (fulfillment never ran AND auto-refulfill
        # couldn't produce any either, e.g., file missing/unattached) vs rate limit
        if "No download links found" in message:
            raise HTTPException(
                status_code=404,
                detail=(
                    "We couldn't generate a download link for this order. The file "
                    "may not be attached to the product yet. Please contact "
                    "support@kingdom-soul.com with your order number and we'll fix "
                    "it within one business day."
                )
            )
        raise HTTPException(status_code=429, detail=message)
    
    # Don't return actual tokens in public response — send via email
    try:
        from email_service import send_email, get_base_template
        SITE_URL = os.environ.get('SITE_URL', 'https://kingdom-soul.com')
        
        links_html = ""
        for link in new_links:
            download_url = f"{SITE_URL}/api/downloads/file/{link['token']}"
            links_html += f"""
            <div style="background: #f9fafb; padding: 12px 16px; border-radius: 8px; margin: 8px 0; border-left: 4px solid #ea580c;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937;">{link.get('product_name', link['product_id'])}</p>
                <a href="{download_url}" style="color: #ea580c; text-decoration: none; font-size: 14px;">Download Now</a>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Expires: {link['expires_at'][:10]} | {MAX_DOWNLOADS_PER_ORDER} downloads allowed</p>
            </div>
            """
        
        email_html = get_base_template(f"""
            <div style="padding: 20px;">
                <h2 style="color: #1f2937; margin-bottom: 8px;">Your Download Links</h2>
                <p style="color: #6b7280;">Order: {data.order_id}</p>
                {links_html}
                <p style="margin-top: 20px; font-size: 13px; color: #9ca3af;">
                    Links expire in {DOWNLOAD_LINK_EXPIRY_HOURS} hours. If you need new links, visit My Library or contact support.
                </p>
            </div>
        """, "Your Soul Food Download Links")
        
        await send_email(
            to=data.email,
            subject=f"Soul Food — Your Download Links ({data.order_id})",
            html=email_html
        )
        print(f"[Resend] Email sent to {data.email} with {len(new_links)} download links")
    except Exception as email_err:
        print(f"[Resend] Email send failed: {email_err}")
    
    return {
        "success": True,
        "message": message,
        "links_count": len(new_links),
        "expiry_hours": DOWNLOAD_LINK_EXPIRY_HOURS,
        "max_downloads_per_file": MAX_DOWNLOADS_PER_ORDER,
        "auto_fulfilled": auto_fulfilled,
    }


# =============================================================================
# ORDER DOWNLOAD STATUS
# =============================================================================

@router.post("/status")
async def get_download_status(data: DownloadStatusRequest):
    """Get download status for all items in an order"""
    
    status = await get_order_download_status(data.order_id, data.email)
    
    if not status:
        return {
            "found": False,
            "message": "No download links found for this order.",
            "items": []
        }
    
    return {
        "found": True,
        "order_id": data.order_id,
        "items": status,
        "config": {
            "max_downloads_per_file": MAX_DOWNLOADS_PER_ORDER,
            "link_expiry_hours": DOWNLOAD_LINK_EXPIRY_HOURS
        }
    }


# =============================================================================
# DOWNLOAD LINK INFO (for email templates)
# =============================================================================

@router.get("/link-info")
async def get_link_info():
    """Get download link configuration (for display purposes)"""
    return {
        "expiry_hours": DOWNLOAD_LINK_EXPIRY_HOURS,
        "max_downloads": MAX_DOWNLOADS_PER_ORDER,
        "resend_rate_limit": 3,
        "resend_rate_window": "1 hour"
    }



# =============================================================================
# ADMIN DIAGNOSTICS (helps debug production file serving issues)
# =============================================================================

@router.get("/diagnose/{token}")
async def diagnose_download(token: str):
    """
    Admin diagnostic: check token validity and file path resolution
    without consuming a download. Returns details about what would happen.
    """
    from download_protection import verify_download_token as _verify
    import hashlib
    
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Check if token exists at all
    record = await verify_download_token_raw(token_hash)
    
    if not record:
        return {"status": "error", "detail": "Token not found in database"}
    
    # Check file path resolution
    stored_path = record.get("file_path", "")
    resolved = resolve_file_path(stored_path)

    # Check Object Storage fallback availability
    product_id = record.get("product_id") or record.get("normalized_product_id") or ""
    obj_record = await find_object_storage_file(product_id, stored_path) if product_id else None

    return {
        "status": "ok",
        "token_found": True,
        "order_id": record.get("order_id"),
        "product_name": record.get("product_name"),
        "stored_file_path": stored_path,
        "resolved_file_path": resolved,
        "file_exists": bool(resolved),
        "object_storage_fallback": {
            "available": bool(obj_record),
            "file_id": obj_record.get("id") if obj_record else None,
            "storage_path": obj_record.get("storage_path") if obj_record else None,
            "original_filename": obj_record.get("original_filename") if obj_record else None,
        },
        "download_count": record.get("download_count", 0),
        "max_downloads": record.get("max_downloads", 3),
        "revoked": record.get("revoked", False),
        "expires_at": str(record.get("expires_at", "")),
        "payment_verified": record.get("payment_verified", False),
        "content_dirs_checked": CONTENT_DIRS
    }


async def verify_download_token_raw(token_hash: str):
    """Raw DB lookup for diagnostic purposes"""
    from motor.motor_asyncio import AsyncIOMotorClient
    MONGO_URL = os.getenv('MONGO_URL')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[os.environ['DB_NAME']]
    return await db.download_links.find_one({"token_hash": token_hash}, {"_id": 0})
