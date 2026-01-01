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
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    
    # Verify token and all restrictions
    is_valid, record, error_msg = await verify_download_token(token)
    
    if not is_valid:
        raise HTTPException(status_code=403, detail=error_msg)
    
    # Get the file path
    file_path = record["file_path"]
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found. Please contact support.")
    
    # Record the download
    await record_download(token, ip_address, user_agent)
    
    # Get remaining downloads for response header
    remaining = await get_remaining_downloads(token)
    
    # Generate download filename
    product_name = record["product_name"].replace(" ", "_").replace("/", "-")
    filename = f"SoulFood_{product_name}.pdf"
    
    # Return file with custom headers
    response = FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename,
        headers={
            "X-Downloads-Remaining": str(remaining),
            "X-Download-Expires": record["expires_at"].isoformat() if hasattr(record["expires_at"], "isoformat") else str(record["expires_at"])
        }
    )
    
    return response


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
