"""
Soul Food Gift Certificate Routes
=================================
Handles gift certificate purchases with Stripe payment.
Redemption creates a one-time discount code for checkout.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import os
import stripe
import uuid
import secrets
import string

# Database
from motor.motor_asyncio import AsyncIOMotorClient
client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
db = client[os.environ.get('DB_NAME', 'soul_food')]

router = APIRouter(prefix="/api/gift-certificates", tags=["gift-certificates"])

# Stripe configuration
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://kingdom-soul.com')


class GiftCertificateRequest(BaseModel):
    """Request model for creating a gift certificate"""
    certificate_type: str  # book, mixup, tricky, subscription
    amount: float
    recipient_name: str
    recipient_email: EmailStr
    sender_name: str
    sender_email: Optional[EmailStr] = None
    message: Optional[str] = None


class GiftCertificateRedeemRequest(BaseModel):
    """Request model for redeeming a gift certificate"""
    code: str
    user_email: EmailStr


class GiftCertificateLookupRequest(BaseModel):
    """Request model for looking up a gift certificate"""
    code: str


# Certificate type configurations
CERTIFICATE_TYPES = {
    "book": {
        "name": "Book Selection Gift Certificate",
        "description": "Redeemable for any Soul Food series book",
        "valid_amounts": [25, 50, 75, 100]
    },
    "mixup": {
        "name": "Mix-Up Game Pass",
        "description": "8-hour game access pass",
        "valid_amounts": [10, 20, 30]
    },
    "tricky": {
        "name": "Tricky Testament Game Pass",
        "description": "8-hour game access pass",
        "valid_amounts": [10, 20, 30]
    },
    "subscription": {
        "name": "Subscription Gift",
        "description": "Gift a Soul Food subscription",
        "valid_amounts": [9.99, 29.97, 109.89]
    }
}


def generate_certificate_code() -> str:
    """
    Generate a unique, trackable gift certificate code.
    Format: SF-GC-XXXXX-XXXX (e.g., SF-GC-K7M9P-2B4N)
    - SF = Soul Food
    - GC = Gift Certificate
    - 5 alphanumeric chars
    - 4 alphanumeric chars
    """
    chars = string.ascii_uppercase + string.digits
    # Remove confusing characters (0, O, I, L, 1)
    chars = chars.replace('0', '').replace('O', '').replace('I', '').replace('L', '').replace('1', '')
    
    part1 = ''.join(secrets.choice(chars) for _ in range(5))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    
    return f"SF-GC-{part1}-{part2}"


def generate_discount_code() -> str:
    """
    Generate a one-time discount code for redemption.
    Format: SFGIFT-XXXXXXXX (e.g., SFGIFT-K7M9P2B4)
    """
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('0', '').replace('O', '').replace('I', '').replace('L', '').replace('1', '')
    
    random_part = ''.join(secrets.choice(chars) for _ in range(8))
    return f"SFGIFT-{random_part}"


@router.post("/create-checkout")
async def create_gift_certificate_checkout(request: GiftCertificateRequest):
    """
    Create a Stripe checkout session for purchasing a gift certificate.
    The certificate is NOT sent until payment succeeds (handled by webhook).
    """
    # Validate certificate type
    if request.certificate_type not in CERTIFICATE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid certificate type")
    
    cert_config = CERTIFICATE_TYPES[request.certificate_type]
    
    # Validate amount (allow small floating point differences)
    valid_amount = False
    for valid_amt in cert_config["valid_amounts"]:
        if abs(request.amount - valid_amt) < 0.01:
            valid_amount = True
            break
    
    if not valid_amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid amount. Valid amounts are: {cert_config['valid_amounts']}"
        )
    
    # Generate a pending certificate ID
    pending_cert_id = f"PENDING-{uuid.uuid4().hex[:12].upper()}"
    
    # Store pending certificate (will be activated by webhook)
    pending_certificate = {
        "pending_id": pending_cert_id,
        "certificate_type": request.certificate_type,
        "amount": request.amount,
        "recipient_name": request.recipient_name,
        "recipient_email": request.recipient_email,
        "sender_name": request.sender_name,
        "sender_email": request.sender_email,
        "message": request.message,
        "status": "pending_payment",
        "created_at": datetime.utcnow()
    }
    
    await db.gift_certificates_pending.insert_one(pending_certificate)
    
    try:
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f"Soul Food {cert_config['name']}",
                        'description': f"Gift for {request.recipient_name} - {cert_config['description']}",
                    },
                    'unit_amount': int(request.amount * 100),  # Stripe uses cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{FRONTEND_URL}/gift-certificate-success?session_id={{CHECKOUT_SESSION_ID}}&pending_id={pending_cert_id}",
            cancel_url=f"{FRONTEND_URL}/gift-certificates?cancelled=true",
            metadata={
                'type': 'gift_certificate',
                'pending_cert_id': pending_cert_id,
                'certificate_type': request.certificate_type,
                'recipient_email': request.recipient_email,
                'recipient_name': request.recipient_name,
                'sender_name': request.sender_name
            },
            customer_email=request.sender_email  # Pre-fill purchaser's email in Stripe
        )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "pending_cert_id": pending_cert_id
        }
        
    except stripe.error.StripeError as e:
        # Clean up pending certificate on error
        await db.gift_certificates_pending.delete_one({"pending_id": pending_cert_id})
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")


@router.post("/activate/{pending_id}")
async def activate_gift_certificate(pending_id: str, session_id: str = None):
    """
    Activate a gift certificate after successful payment.
    Called by webhook or success page verification.
    Uses atomic update to prevent duplicate activations.
    """
    from email_service import send_email, get_base_template, SUPPORT_EMAIL
    
    # Find the pending certificate
    pending = await db.gift_certificates_pending.find_one({"pending_id": pending_id})
    
    if not pending:
        raise HTTPException(status_code=404, detail="Pending certificate not found")
    
    # Check if already activated
    if pending.get("status") == "activated":
        # Already activated, return existing certificate
        existing = await db.gift_certificates.find_one({"pending_id": pending_id})
        if existing:
            return {
                "success": True,
                "already_activated": True,
                "code": existing.get("code"),
                "recipient_email": existing.get("recipient_email"),
                "amount": existing.get("amount"),
                "expires_at": existing.get("expires_at").isoformat() if existing.get("expires_at") else None
            }
    
    # Use atomic update to prevent race condition (double activation)
    # Only update if status is still "pending_payment"
    update_result = await db.gift_certificates_pending.update_one(
        {"pending_id": pending_id, "status": "pending_payment"},
        {"$set": {"status": "activating"}}
    )
    
    # If no documents matched, someone else already started activation
    if update_result.modified_count == 0:
        # Wait a moment and check for existing certificate
        import asyncio
        await asyncio.sleep(0.5)
        existing = await db.gift_certificates.find_one({"pending_id": pending_id})
        if existing:
            return {
                "success": True,
                "already_activated": True,
                "code": existing.get("code"),
                "recipient_email": existing.get("recipient_email"),
                "amount": existing.get("amount"),
                "expires_at": existing.get("expires_at").isoformat() if existing.get("expires_at") else None
            }
        raise HTTPException(status_code=409, detail="Certificate activation already in progress")
    
    # Verify payment with Stripe if session_id provided
    if session_id:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status != 'paid':
                raise HTTPException(status_code=400, detail="Payment not completed")
        except stripe.error.StripeError:
            raise HTTPException(status_code=400, detail="Could not verify payment")
    
    # Generate the actual certificate code
    certificate_code = generate_certificate_code()
    
    # Ensure code is unique
    while await db.gift_certificates.find_one({"code": certificate_code}):
        certificate_code = generate_certificate_code()
    
    cert_config = CERTIFICATE_TYPES.get(pending["certificate_type"], {})
    
    certificate = {
        "code": certificate_code,
        "pending_id": pending_id,
        "certificate_type": pending["certificate_type"],
        "certificate_name": cert_config.get("name", "Gift Certificate"),
        "amount": pending["amount"],
        "balance": pending["amount"],  # Remaining balance
        "recipient_name": pending["recipient_name"],
        "recipient_email": pending["recipient_email"],
        "sender_name": pending["sender_name"],
        "sender_email": pending.get("sender_email"),
        "message": pending.get("message"),
        "status": "active",
        "expires_at": datetime.utcnow() + timedelta(days=365),  # 1 year validity
        "created_at": datetime.utcnow(),
        "redeemed_at": None,
        "discount_code": None,  # Will be set when redeemed
        "redemptions": []
    }
    
    # Save the certificate
    await db.gift_certificates.insert_one(certificate)
    
    # Update pending status
    await db.gift_certificates_pending.update_one(
        {"pending_id": pending_id},
        {"$set": {"status": "activated", "activated_at": datetime.utcnow()}}
    )
    
    # Send email to recipient
    recipient_html = f"""
    <div style="text-align: center; padding: 20px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">🎁 You've Received a Gift!</h2>
        
        <div style="background: linear-gradient(135deg, #fed7aa 0%, #fef3c7 100%); padding: 30px; border-radius: 12px; margin: 20px 0;">
            <p style="color: #92400e; margin-bottom: 10px;">From: <strong>{pending['sender_name']}</strong></p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #ea580c; margin: 0 0 10px 0;">{cert_config.get('name', 'Gift Certificate')}</h3>
                <p style="font-size: 36px; font-weight: bold; color: #c2410c; margin: 15px 0;">${pending['amount']:.2f}</p>
                <p style="color: #78716c; font-size: 14px;">{cert_config.get('description', '')}</p>
            </div>
            
            {f'<p style="color: #57534e; font-style: italic; margin-top: 15px;">"{pending.get("message")}"</p>' if pending.get('message') else ''}
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #64748b; margin-bottom: 10px;">Your Gift Certificate Code:</p>
            <p style="font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: 2px; font-family: monospace;">{certificate_code}</p>
            <a href="{FRONTEND_URL}/api/gift-certificates/download/{certificate_code}" 
               style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #1a472a; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
                📄 Download Certificate PDF
            </a>
        </div>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #a7f3d0;">
            <h4 style="color: #065f46; margin: 0 0 10px 0;">How to Redeem:</h4>
            <ol style="color: #047857; text-align: left; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Visit <a href="{FRONTEND_URL}/redeem-gift" style="color: #059669;">kingdom-soul.com/redeem-gift</a></li>
                <li>Enter your certificate code: <strong>{certificate_code}</strong></li>
                <li>Receive your one-time discount code within 1 business day</li>
                <li>Apply the discount code at checkout!</li>
            </ol>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
            Valid until {certificate['expires_at'].strftime('%B %d, %Y')}<br/>
            Questions? Contact <a href="mailto:{SUPPORT_EMAIL}" style="color: #ea580c;">{SUPPORT_EMAIL}</a>
        </p>
    </div>
    """
    
    recipient_email_html = get_base_template(recipient_html, f"🎁 {pending['sender_name']} sent you a Soul Food gift!")
    
    await send_email(
        to=pending["recipient_email"],
        subject=f"🎁 {pending['sender_name']} sent you a ${pending['amount']:.2f} Soul Food Gift Certificate!",
        html=recipient_email_html
    )
    
    # Send confirmation to sender
    if pending.get("sender_email"):
        sender_html = f"""
        <div style="padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">✅ Gift Certificate Sent!</h2>
            
            <p style="color: #4b5563;">Your gift certificate has been sent to <strong>{pending['recipient_name']}</strong> at <strong>{pending['recipient_email']}</strong>.</p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #64748b; margin: 0;">Certificate Details:</p>
                <ul style="color: #1f2937; margin-top: 10px;">
                    <li>Type: {cert_config.get('name', 'Gift Certificate')}</li>
                    <li>Amount: ${pending['amount']:.2f}</li>
                    <li>Code: <strong>{certificate_code}</strong></li>
                    <li>Valid until: {certificate['expires_at'].strftime('%B %d, %Y')}</li>
                </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">Thank you for sharing the gift of spiritual nourishment!</p>
        </div>
        """
        
        sender_email_html = get_base_template(sender_html, "Your Soul Food gift has been delivered!")
        
        await send_email(
            to=pending["sender_email"],
            subject="✅ Your Soul Food Gift Certificate Has Been Sent!",
            html=sender_email_html
        )
    
    return {
        "success": True,
        "code": certificate_code,
        "recipient_email": pending["recipient_email"],
        "amount": pending["amount"],
        "expires_at": certificate["expires_at"].isoformat()
    }


@router.get("/verify/{code}")
async def verify_gift_certificate(code: str):
    """Verify a gift certificate is valid and check its balance"""
    certificate = await db.gift_certificates.find_one(
        {"code": code.upper().strip()},
        {"_id": 0}
    )
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Gift certificate not found. Please check the code and try again.")
    
    # Check expiration
    if certificate.get("expires_at") and datetime.utcnow() > certificate["expires_at"]:
        return {
            "valid": False,
            "reason": "expired",
            "message": "This gift certificate has expired",
            "expired_at": certificate["expires_at"].isoformat()
        }
    
    # Check status
    if certificate.get("status") == "redeemed":
        return {
            "valid": False,
            "reason": "already_redeemed",
            "message": "This gift certificate has already been redeemed",
            "redeemed_at": certificate.get("redeemed_at").isoformat() if certificate.get("redeemed_at") else None,
            "discount_code": certificate.get("discount_code")  # Show them their discount code
        }
    
    if certificate.get("status") != "active":
        return {
            "valid": False,
            "reason": certificate.get("status", "invalid"),
            "message": "This gift certificate is no longer active"
        }
    
    return {
        "valid": True,
        "code": certificate.get("code"),
        "certificate_type": certificate.get("certificate_type"),
        "certificate_name": certificate.get("certificate_name"),
        "amount": certificate.get("amount"),
        "balance": certificate.get("balance"),
        "recipient_name": certificate.get("recipient_name"),
        "sender_name": certificate.get("sender_name"),
        "message": certificate.get("message"),
        "expires_at": certificate.get("expires_at").isoformat() if certificate.get("expires_at") else None,
        "created_at": certificate.get("created_at").isoformat() if certificate.get("created_at") else None
    }


@router.post("/redeem")
async def redeem_gift_certificate(request: GiftCertificateRedeemRequest):
    """
    Redeem a gift certificate.
    Creates a one-time discount code that can be used at checkout.
    Processing time: Within 1 business day (but usually instant).
    """
    from email_service import send_email, get_base_template, SUPPORT_EMAIL
    
    code = request.code.upper().strip()
    certificate = await db.gift_certificates.find_one({"code": code})
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Gift certificate not found. Please check the code and try again.")
    
    # Check validity
    if certificate.get("status") == "redeemed":
        # Already redeemed - return the existing discount code
        return {
            "success": True,
            "already_redeemed": True,
            "message": "This gift certificate was already redeemed.",
            "discount_code": certificate.get("discount_code"),
            "amount": certificate.get("amount"),
            "redeemed_at": certificate.get("redeemed_at").isoformat() if certificate.get("redeemed_at") else None
        }
    
    if certificate.get("status") != "active":
        raise HTTPException(status_code=400, detail="This gift certificate is not active")
    
    if certificate.get("expires_at") and datetime.utcnow() > certificate["expires_at"]:
        raise HTTPException(status_code=400, detail="This gift certificate has expired")
    
    # Generate a unique one-time discount code
    discount_code = generate_discount_code()
    
    # Ensure discount code is unique
    while await db.discount_codes.find_one({"code": discount_code}):
        discount_code = generate_discount_code()
    
    # Create the discount code in the database
    discount_record = {
        "code": discount_code,
        "type": "gift_certificate_redemption",
        "source_certificate": code,
        "amount_dollars": certificate["amount"],  # Fixed dollar amount, not percentage
        "max_uses": 1,
        "times_used": 0,
        "created_by_email": request.user_email,
        "valid_until": datetime.utcnow() + timedelta(days=90),  # 90 days to use the discount
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    
    await db.discount_codes.insert_one(discount_record)
    
    # Update the gift certificate as redeemed
    await db.gift_certificates.update_one(
        {"code": code},
        {
            "$set": {
                "status": "redeemed",
                "balance": 0,
                "redeemed_at": datetime.utcnow(),
                "redeemed_by": request.user_email,
                "discount_code": discount_code
            },
            "$push": {
                "redemptions": {
                    "discount_code": discount_code,
                    "amount": certificate["amount"],
                    "user_email": request.user_email,
                    "redeemed_at": datetime.utcnow()
                }
            }
        }
    )
    
    # Send confirmation email with the discount code
    redemption_html = f"""
    <div style="text-align: center; padding: 20px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">🎉 Gift Certificate Redeemed!</h2>
        
        <p style="color: #4b5563; margin-bottom: 20px;">
            Your gift certificate has been successfully redeemed. Use the discount code below at checkout.
        </p>
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; margin: 20px 0;">
            <p style="color: #d1fae5; margin-bottom: 10px; font-size: 14px;">Your One-Time Discount Code:</p>
            <p style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 3px; font-family: monospace; margin: 0;">
                {discount_code}
            </p>
            <p style="color: #a7f3d0; margin-top: 15px; font-size: 18px;">
                Value: <strong>${certificate['amount']:.2f} OFF</strong>
            </p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fcd34d;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>⚠️ Important:</strong> This code can only be used <strong>once</strong> and expires in 90 days.
            </p>
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #334155; margin: 0 0 10px 0;">How to Use:</h4>
            <ol style="color: #64748b; text-align: left; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Add items to your cart at <a href="{FRONTEND_URL}/quick-order" style="color: #6366f1;">kingdom-soul.com</a></li>
                <li>Go to checkout</li>
                <li>Enter discount code: <strong>{discount_code}</strong></li>
                <li>Your ${certificate['amount']:.2f} discount will be applied!</li>
            </ol>
        </div>
        
        <a href="{FRONTEND_URL}/quick-order" 
           style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 10px;">
            Start Shopping →
        </a>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            Original Gift Certificate: {code}<br/>
            Questions? Contact <a href="mailto:{SUPPORT_EMAIL}" style="color: #6366f1;">{SUPPORT_EMAIL}</a>
        </p>
    </div>
    """
    
    redemption_email_html = get_base_template(redemption_html, f"Your ${certificate['amount']:.2f} discount code is ready!")
    
    await send_email(
        to=request.user_email,
        subject=f"🎉 Your ${certificate['amount']:.2f} Soul Food Discount Code is Ready!",
        html=redemption_email_html
    )
    
    return {
        "success": True,
        "message": f"Gift certificate redeemed! Your discount code has been sent to {request.user_email}",
        "discount_code": discount_code,
        "amount": certificate["amount"],
        "valid_until": discount_record["valid_until"].isoformat(),
        "instructions": f"Enter code {discount_code} at checkout to receive ${certificate['amount']:.2f} off your order."
    }


@router.get("/lookup/{code}")
async def lookup_gift_certificate(code: str):
    """
    Public lookup for gift certificate status.
    Used by the redemption page to show certificate details before redeeming.
    """
    return await verify_gift_certificate(code)


@router.get("/admin/list")
async def list_all_certificates(status: str = None, limit: int = 50):
    """Admin endpoint to list all gift certificates"""
    query = {}
    if status:
        query["status"] = status
    
    certificates = await db.gift_certificates.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "count": len(certificates),
        "certificates": certificates
    }


@router.get("/admin/stats")
async def get_certificate_stats():
    """Admin endpoint for gift certificate statistics"""
    total = await db.gift_certificates.count_documents({})
    active = await db.gift_certificates.count_documents({"status": "active"})
    redeemed = await db.gift_certificates.count_documents({"status": "redeemed"})
    expired = await db.gift_certificates.count_documents({
        "status": "active",
        "expires_at": {"$lt": datetime.utcnow()}
    })
    
    # Calculate total value
    pipeline = [
        {"$group": {
            "_id": "$status",
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    by_status = await db.gift_certificates.aggregate(pipeline).to_list(10)
    
    return {
        "total_certificates": total,
        "active": active,
        "redeemed": redeemed,
        "expired": expired,
        "by_status": by_status
    }


@router.get("/download/{code}")
async def download_gift_certificate_pdf(code: str):
    """
    Download a gift certificate as a beautiful PDF.
    """
    from utils.gift_certificate_pdf import generate_gift_certificate_pdf
    
    # Find the certificate
    certificate = await db.gift_certificates.find_one({"code": code.upper()})
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Gift certificate not found")
    
    # Generate PDF
    pdf_buffer = generate_gift_certificate_pdf(
        recipient_name=certificate.get("recipient_name", ""),
        amount=certificate.get("amount", 0),
        certificate_code=certificate.get("code", ""),
        sender_name=certificate.get("sender_name", ""),
        issue_date=certificate.get("created_at"),
        expires_at=certificate.get("expires_at"),
        message=certificate.get("message")
    )
    
    # Return as downloadable PDF
    filename = f"SoulFood_GiftCertificate_{code}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/preview-pdf")
async def preview_gift_certificate_pdf(
    recipient: str = "John Doe",
    amount: float = 50.00,
    sender: str = "Jane Smith",
    message: str = "Enjoy your Soul Food journey!"
):
    """
    Preview/test endpoint to generate a sample gift certificate PDF.
    """
    from utils.gift_certificate_pdf import generate_gift_certificate_pdf
    
    # Generate sample PDF
    pdf_buffer = generate_gift_certificate_pdf(
        recipient_name=recipient,
        amount=amount,
        certificate_code="SF-GC-SAMPLE-TEST",
        sender_name=sender,
        issue_date=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=365),
        message=message
    )
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "inline; filename=sample_gift_certificate.pdf"
        }
    )
