"""
Soul Food Gift Certificate Routes
=================================
Handles gift certificate purchases with Stripe payment.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import os
import stripe
import uuid

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
    """Generate a unique gift certificate code"""
    return f"SF-{uuid.uuid4().hex[:8].upper()}"


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
    """
    from email_service import send_email, get_base_template, SUPPORT_EMAIL
    
    # Find the pending certificate
    pending = await db.gift_certificates_pending.find_one({"pending_id": pending_id})
    
    if not pending:
        raise HTTPException(status_code=404, detail="Pending certificate not found")
    
    if pending.get("status") == "activated":
        # Already activated, return existing certificate
        existing = await db.gift_certificates.find_one({"pending_id": pending_id})
        if existing:
            return {
                "success": True,
                "already_activated": True,
                "code": existing.get("code"),
                "recipient_email": existing.get("recipient_email")
            }
    
    # Verify payment with Stripe if session_id provided
    if session_id:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status != 'paid':
                raise HTTPException(status_code=400, detail="Payment not completed")
        except stripe.error.StripeError:
            raise HTTPException(status_code=400, detail="Could not verify payment")
    
    # Generate the actual certificate
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
            <p style="color: #64748b; margin-bottom: 10px;">Your Gift Code:</p>
            <p style="font-size: 28px; font-weight: bold; color: #0f172a; letter-spacing: 2px; font-family: monospace;">{certificate_code}</p>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
            Valid until {certificate['expires_at'].strftime('%B %d, %Y')}<br/>
            Use at checkout or visit <a href="{FRONTEND_URL}" style="color: #ea580c;">kingdom-soul.com</a>
        </p>
    </div>
    """
    
    recipient_email_html = get_base_template(recipient_html, f"🎁 {pending['sender_name']} sent you a Soul Food gift!")
    
    await send_email(
        to=pending["recipient_email"],
        subject=f"🎁 {pending['sender_name']} sent you a Soul Food Gift Certificate!",
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
                    <li>Code: {certificate_code}</li>
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
        {"code": code.upper()},
        {"_id": 0}
    )
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Gift certificate not found")
    
    # Check expiration
    if certificate.get("expires_at") and datetime.utcnow() > certificate["expires_at"]:
        return {
            "valid": False,
            "reason": "expired",
            "message": "This gift certificate has expired"
        }
    
    # Check status
    if certificate.get("status") != "active":
        return {
            "valid": False,
            "reason": certificate.get("status", "invalid"),
            "message": "This gift certificate is no longer active"
        }
    
    return {
        "valid": True,
        "certificate_type": certificate.get("certificate_type"),
        "certificate_name": certificate.get("certificate_name"),
        "original_amount": certificate.get("amount"),
        "balance": certificate.get("balance"),
        "expires_at": certificate.get("expires_at").isoformat() if certificate.get("expires_at") else None,
        "recipient_name": certificate.get("recipient_name")
    }


@router.post("/redeem")
async def redeem_gift_certificate(request: GiftCertificateRedeemRequest):
    """Redeem a gift certificate (partial or full)"""
    certificate = await db.gift_certificates.find_one({"code": request.code.upper()})
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Gift certificate not found")
    
    # Check validity
    if certificate.get("status") != "active":
        raise HTTPException(status_code=400, detail="This gift certificate is not active")
    
    if certificate.get("expires_at") and datetime.utcnow() > certificate["expires_at"]:
        raise HTTPException(status_code=400, detail="This gift certificate has expired")
    
    if certificate.get("balance", 0) <= 0:
        raise HTTPException(status_code=400, detail="This gift certificate has no remaining balance")
    
    # For now, mark as redeemed (full redemption)
    # TODO: Integrate with checkout to apply partial balance
    await db.gift_certificates.update_one(
        {"code": request.code.upper()},
        {
            "$set": {
                "status": "redeemed",
                "balance": 0,
                "redeemed_at": datetime.utcnow(),
                "redeemed_by": request.user_email
            },
            "$push": {
                "redemptions": {
                    "amount": certificate["balance"],
                    "user_email": request.user_email,
                    "redeemed_at": datetime.utcnow()
                }
            }
        }
    )
    
    return {
        "success": True,
        "redeemed_amount": certificate["balance"],
        "message": f"Gift certificate redeemed for ${certificate['balance']:.2f}"
    }
