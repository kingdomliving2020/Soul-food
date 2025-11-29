from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest
)
from datetime import datetime

load_dotenv()

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client.soul_food_db

# Product catalog with list and sale prices
PRODUCTS = {
    "single_lesson": {
        "name": "Single Lesson",
        "description": "Download or online access to one lesson",
        "list_price": 4.99,
        "sale_price": 1.99,
        "currency": "usd"
    },
    "monthly_pack": {
        "name": "Monthly Pack (4 Lessons)",
        "description": "Download or online access to 4 lessons",
        "list_price": 6.75,
        "sale_price": 5.99,
        "currency": "usd"
    },
    "mealtime_bundle": {
        "name": "Mealtime Bundle (12 Lessons)",
        "description": "One of each edition per mealtime package",
        "list_price": 13.99,
        "sale_price": 12.99,
        "currency": "usd"
    },
    "combo_bundle": {
        "name": "Combo Bundle (24 Lessons)",
        "description": "Multiple books of a single type",
        "list_price": 24.99,
        "sale_price": 22.99,
        "currency": "usd"
    },
    "instructor_set": {
        "name": "Instructor Set (36 Lessons)",
        "description": "Box set: Breakfast, Lunch, Dinner, Supper (Youth, Adult, Instructor)",
        "list_price": 44.99,
        "sale_price": 39.99,
        "currency": "usd"
    },
    "gaming_day_pass": {
        "name": "Gaming Day Pass",
        "description": "24-hour access to all game modes",
        "list_price": 40.00,
        "sale_price": 29.99,
        "currency": "usd"
    }
}


class CheckoutRequest(BaseModel):
    product_id: str
    quantity: int = 1
    origin_url: str


class StatusRequest(BaseModel):
    session_id: str


@router.post("/checkout/session")
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    """Create a Stripe checkout session for a product"""
    
    # Validate product exists
    if request.product_id not in PRODUCTS:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    # Get product details (always use sale price)
    product = PRODUCTS[request.product_id]
    amount = product["sale_price"] * request.quantity
    currency = product["currency"]
    
    # Get Stripe API key
    api_key = os.getenv('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    # Initialize Stripe Checkout
    host_url = str(http_request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/payments/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    # Build success and cancel URLs
    origin_url = request.origin_url.rstrip('/')
    success_url = f"{origin_url}/payment-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{origin_url}/payment-cancel"
    
    # Create metadata
    metadata = {
        "product_id": request.product_id,
        "product_name": product["name"],
        "quantity": str(request.quantity),
        "source": "soul_food_web"
    }
    
    try:
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store pending transaction in database
        transaction = {
            "session_id": session.session_id,
            "product_id": request.product_id,
            "product_name": product["name"],
            "quantity": request.quantity,
            "amount": amount,
            "currency": currency,
            "payment_status": "pending",
            "status": "initiated",
            "metadata": metadata,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.payment_transactions.insert_one(transaction)
        
        return {
            "url": session.url,
            "session_id": session.session_id,
            "product": product["name"],
            "amount": amount
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Check the status of a checkout session"""
    
    # Get Stripe API key
    api_key = os.getenv('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    # Initialize Stripe Checkout
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    try:
        # Get checkout status from Stripe
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Find transaction in database
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Update transaction status if payment is complete and not already processed
        if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id, "payment_status": {"$ne": "paid"}},  # Only update if not already paid
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": "completed",
                        "stripe_status": checkout_status.status,
                        "stripe_amount_total": checkout_status.amount_total,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # TODO: Grant access to purchased content here
            # For example: update user's purchased_products, extend gaming_access, etc.
        
        elif checkout_status.status == "expired" and transaction["status"] != "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "status": "expired",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        return {
            "session_id": session_id,
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency,
            "metadata": checkout_status.metadata,
            "transaction": transaction
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check payment status: {str(e)}")


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    
    # Get Stripe API key
    api_key = os.getenv('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    # Initialize Stripe Checkout
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/payments/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    try:
        # Get request body and signature
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Process the webhook event
        if webhook_response.event_type == "checkout.session.completed":
            # Update transaction in database
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id, "payment_status": {"$ne": "paid"}},
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": "completed",
                        "webhook_processed": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # TODO: Grant access to purchased content
        
        return {"status": "success", "event_type": webhook_response.event_type}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")


@router.get("/products")
async def get_products():
    """Get list of available products with pricing"""
    return {"products": PRODUCTS}
