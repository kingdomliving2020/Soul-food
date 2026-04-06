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
from fastapi.responses import FileResponse, JSONResponse
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
CONTENT_DIRS = [
    "/app/content/downloads",
    "/app/content/bonus",
    "/app/content/holiday",
    "/app/backend/lesson_pdfs",
]


def resolve_file_path(stored_path: str) -> str:
    """
    Resolve a file path, trying multiple strategies:
    1. Use stored path as-is (absolute paths)
    2. Try basename in known content directories (for relative paths)
    3. Try the path as relative to each content directory
    Returns the resolved path if found, else empty string.
    """
    if not stored_path:
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
        resolved_path = resolve_file_path(file_path)
        
        if not resolved_path:
            print(f"[Download] FILE NOT FOUND for token. Stored path: {file_path}")
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
    """
    ip_address = request.client.host if request.client else "unknown"
    
    success, new_links, message = await resend_download_links(
        order_id=data.order_id,
        user_email=data.email,
        ip_address=ip_address
    )
    
    if not success:
        raise HTTPException(status_code=429, detail=message)
    
    # Don't return actual tokens in response (send via email instead)
    return {
        "success": True,
        "message": message,
        "links_count": len(new_links),
        "expiry_hours": DOWNLOAD_LINK_EXPIRY_HOURS,
        "max_downloads_per_file": MAX_DOWNLOADS_PER_ORDER
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
    
    return {
        "status": "ok",
        "token_found": True,
        "order_id": record.get("order_id"),
        "product_name": record.get("product_name"),
        "stored_file_path": stored_path,
        "resolved_file_path": resolved,
        "file_exists": bool(resolved),
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
    db = client[os.environ.get('DB_NAME', 'soul_food_db')]
    return await db.download_links.find_one({"token_hash": token_hash}, {"_id": 0})
