"""
Soul Food Email Routes
======================
API endpoints for email functionality.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import os

from email_service import (
    send_email,
    send_order_confirmation,
    send_download_links,
    send_contact_form_notification,
    send_bulk_order_notification,
    SUPPORT_EMAIL
)

router = APIRouter(prefix="/api/email", tags=["email"])


# =============================================================================
# REQUEST MODELS
# =============================================================================

class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    topic: str  # Support, Billing, Technical, Prayer Request, etc.
    message: str
    page_url: Optional[str] = None
    honeypot: Optional[str] = None  # Anti-spam honeypot field


class ResendDownloadLinksRequest(BaseModel):
    order_id: str
    email: EmailStr


class TestEmailRequest(BaseModel):
    to_email: EmailStr
    subject: str = "Test Email from Soul Food"
    message: str = "This is a test email."


# =============================================================================
# RATE LIMITING (Simple in-memory)
# =============================================================================

# Track submissions per IP for rate limiting
_submission_tracker = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 3  # max submissions per window


def check_rate_limit(ip_address: str) -> bool:
    """Check if IP is rate limited. Returns True if allowed."""
    now = datetime.utcnow().timestamp()
    
    if ip_address not in _submission_tracker:
        _submission_tracker[ip_address] = []
    
    # Clean old entries
    _submission_tracker[ip_address] = [
        ts for ts in _submission_tracker[ip_address] 
        if now - ts < RATE_LIMIT_WINDOW
    ]
    
    # Check limit
    if len(_submission_tracker[ip_address]) >= RATE_LIMIT_MAX:
        return False
    
    # Record this submission
    _submission_tracker[ip_address].append(now)
    return True


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/contact")
async def submit_contact_form(request: ContactFormRequest, http_request: Request):
    """
    Handle contact form submissions.
    Sends notification to support@kingdom-soul.com
    """
    # Anti-spam: Check honeypot field
    if request.honeypot:
        # Honeypot filled = bot submission, silently succeed
        return {"success": True, "message": "Thank you for your message!"}
    
    # Rate limiting
    ip_address = http_request.client.host if http_request.client else "unknown"
    if not check_rate_limit(ip_address):
        raise HTTPException(
            status_code=429, 
            detail="Too many submissions. Please wait a minute before trying again."
        )
    
    # Validate topic
    valid_topics = ["Support", "Billing", "Technical", "Prayer Request", "Feedback", "Partnership", "Other"]
    if request.topic not in valid_topics:
        request.topic = "Other"
    
    # Send notification to support
    result = await send_contact_form_notification(
        name=request.name,
        email=request.email,
        topic=request.topic,
        message=request.message,
        page_url=request.page_url
    )
    
    if result.get("success"):
        return {
            "success": True,
            "message": "Thank you for your message! We'll respond within 24-48 hours."
        }
    else:
        # Log error but still thank user
        print(f"[Email Error] Contact form send failed: {result.get('error')}")
        return {
            "success": True,
            "message": "Thank you for your message! We'll respond within 24-48 hours."
        }


@router.post("/test")
async def send_test_email(request: TestEmailRequest):
    """Send a test email (for development/testing)"""
    
    # Only allow in development
    if os.environ.get("ENVIRONMENT") == "production":
        raise HTTPException(status_code=403, detail="Test emails disabled in production")
    
    html = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Test Email from Soul Food</h2>
        <p>{request.message}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
            This inbox isn't monitored. For help, contact {SUPPORT_EMAIL}
        </p>
    </div>
    """
    
    result = await send_email(
        to=request.to_email,
        subject=request.subject,
        html=html
    )
    
    if result.get("success"):
        return {"success": True, "email_id": result.get("email_id")}
    else:
        raise HTTPException(status_code=500, detail=result.get("error"))


@router.get("/config")
async def get_email_config():
    """Get email configuration (for frontend display)"""
    return {
        "support_email": SUPPORT_EMAIL,
        "topics": ["Support", "Billing", "Technical", "Prayer Request", "Feedback", "Partnership", "Other"]
    }
