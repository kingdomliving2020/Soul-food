"""
Soul Food Contact/Feedback Routes with MailerLite Integration
=============================================================
Handles feedback submission and sends notifications via MailerLite
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from typing import Optional
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/contact", tags=["contact"])

# MailerLite API
MAILERLITE_API_KEY = os.getenv('MAILERLITE_API_KEY')
ADMIN_EMAIL = "kingdomlivingproject@gmail.com"


class ContactMessage(BaseModel):
    email: str
    message: str
    timestamp: str
    page: str = "/"
    name: Optional[str] = None
    subject: Optional[str] = None


class FeedbackMessage(BaseModel):
    email: EmailStr
    name: str
    feedback_type: str  # 'bug', 'suggestion', 'question', 'praise', 'other'
    message: str
    page_url: Optional[str] = None
    browser_info: Optional[str] = None


async def send_email_via_mailerlite(to_email: str, subject: str, content: str, from_name: str = "Soul Food"):
    """Send email notification via MailerLite API"""
    if not MAILERLITE_API_KEY:
        print(f"MailerLite API key not configured. Would send to {to_email}: {subject}")
        return False
    
    # Note: MailerLite is primarily for email marketing/subscribers
    # For transactional emails, we'd typically use their transactional service
    # For now, we'll add the feedback to a subscriber group for tracking
    try:
        async with httpx.AsyncClient() as client:
            # Add feedback as a subscriber with custom fields
            response = await client.post(
                "https://connect.mailerlite.com/api/subscribers",
                headers={
                    "Authorization": f"Bearer {MAILERLITE_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "email": to_email,
                    "fields": {
                        "last_feedback": content[:250],  # Store truncated feedback
                        "feedback_subject": subject
                    },
                    "groups": ["feedback"]  # Add to feedback group
                },
                timeout=10.0
            )
            print(f"MailerLite feedback response: {response.status_code}")
            return response.status_code in [200, 201]
    except Exception as e:
        print(f"Error with MailerLite: {e}")
        return False


@router.post("/message")
async def send_contact_message(message: ContactMessage):
    """
    Receive contact messages from chatbot widget
    Stores in log and notifies admin via MailerLite
    """
    try:
        # Log the message
        log_entry = f"""
=====================================
NEW CONTACT MESSAGE
=====================================
From: {message.email}
Name: {message.name or 'Not provided'}
Time: {message.timestamp}
Page: {message.page}

Message:
{message.message}

TO: {ADMIN_EMAIL}
=====================================
"""
        print(log_entry)
        
        # Send notification via MailerLite
        await send_email_via_mailerlite(
            to_email=message.email,
            subject=f"Contact from {message.email}",
            content=message.message,
            from_name=message.name or "Website Visitor"
        )
        
        return {
            "status": "success",
            "message": f"Your message has been received. We'll respond shortly at {ADMIN_EMAIL}"
        }
        
    except Exception as e:
        print(f"Error sending contact message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")


@router.post("/feedback")
async def submit_feedback(feedback: FeedbackMessage):
    """
    Receive structured feedback from users
    """
    try:
        # Create feedback record
        feedback_record = {
            "email": feedback.email,
            "name": feedback.name,
            "type": feedback.feedback_type,
            "message": feedback.message,
            "page_url": feedback.page_url,
            "browser_info": feedback.browser_info,
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Log feedback
        print(f"""
=====================================
NEW FEEDBACK SUBMISSION
=====================================
Type: {feedback.feedback_type.upper()}
From: {feedback.name} ({feedback.email})
Page: {feedback.page_url or 'Not specified'}
Browser: {feedback.browser_info or 'Not specified'}
Time: {feedback_record['submitted_at']}

Message:
{feedback.message}

TO: {ADMIN_EMAIL}
=====================================
""")
        
        # Add to MailerLite for tracking
        await send_email_via_mailerlite(
            to_email=feedback.email,
            subject=f"[{feedback.feedback_type.upper()}] Feedback from {feedback.name}",
            content=feedback.message,
            from_name=feedback.name
        )
        
        # Create response based on feedback type
        response_messages = {
            "bug": "Thank you for reporting this issue! Our team will investigate and work on a fix.",
            "suggestion": "Thank you for your suggestion! We value your input and will consider it for future updates.",
            "question": "Thank you for your question! We'll get back to you soon.",
            "praise": "Thank you so much for the kind words! It means a lot to us.",
            "other": "Thank you for reaching out! We've received your message."
        }
        
        return {
            "status": "success",
            "message": response_messages.get(feedback.feedback_type, response_messages["other"]),
            "feedback_id": f"FB-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        }
        
    except Exception as e:
        print(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")


@router.get("/health")
async def contact_health():
    """Health check for contact routes"""
    return {
        "status": "healthy",
        "mailerlite_configured": bool(MAILERLITE_API_KEY),
        "admin_email": ADMIN_EMAIL
    }
