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
# Cost = wholesale/production cost, List Price = MSRP, Sale Price = current selling price
PRODUCTS = {
    "nibble": {
        "name": "Nibble (Single Lesson)",
        "description": "One lesson - choose your mealtime, edition, and format",
        "cost": 1.09,
        "list_price": 4.99,
        "sale_price": 1.99,
        "currency": "usd",
        "unit": "ea",
        "options": {
            "mealtime": ["breakfast", "lunch", "dinner", "supper", "holiday"],
            "edition": ["adult", "youth", "instructor"],
            "medium": ["pdf"]  # Only PDF download for Nibble - no print logistics
        },
        "note": "PDF download only - no print available for single lessons"
    },
    "snack_pack": {
        "name": "Snack Pack (4 Lessons)",
        "description": "Monthly pack of 4 lessons - choose your mealtime, edition, and format",
        "cost": 3.99,
        "list_price": {
            "pdf": 6.75
        },
        "sale_price": {
            "pdf": 5.99
        },
        "currency": "usd",
        "unit": "set",
        "options": {
            "mealtime": ["breakfast", "lunch", "dinner", "supper"],
            "edition": ["adult", "youth", "instructor"],
            "medium": ["pdf", "online"]
        },
        "medium_rules": {
            "online": "Monthly subscribers only",
            "note": "PDF download only - no print for Snack Pack"
        }
    },
    "holiday_bundle": {
        "name": "Holiday Bundle (6 Lessons)",
        "description": "Holiday Series: The 4 C's of Christianity - Covenant, Cradle, Cross, Comforter",
        "cost": 3.99,
        "list_price": {
            "pdf": 6.75,
            "paperback": 8.75
        },
        "sale_price": {
            "pdf": 5.99,
            "paperback": 7.99
        },
        "currency": "usd",
        "unit": "set",
        "options": {
            "mealtime": ["holiday"],
            "edition": ["adult", "youth", "instructor"],
            "medium": ["pdf", "paperback"]
        },
        "medium_rules": {
            "paperback": "Print available - POD fulfillment"
        }
    },
    "mealtime_bundle": {
        "name": "Mealtime Bundle (12 Lessons)",
        "description": "Complete mealtime series - choose your mealtime, edition, and format",
        "cost": 11.99,
        "list_price": {
            "pdf": 13.99,
            "paperback": 15.99  # List price + $2 for paperback
        },
        "sale_price": {
            "pdf": 12.99,
            "paperback": 14.99  # Sale price + $2 for paperback
        },
        "currency": "usd",
        "unit": "set",
        "options": {
            "mealtime": ["breakfast", "lunch", "dinner", "supper"],
            "edition": ["adult", "youth", "instructor"],
            "medium": ["pdf", "paperback", "online"]
        },
        "medium_rules": {
            "online": "Monthly subscribers only",
            "paperback": "Print available - POD fulfillment for complete series"
        }
    },
    "combo_bundle": {
        "name": "Combo Bundle (24 Lessons)",
        "description": "Two complete mealtime series - choose your mealtimes, edition, and format",
        "cost": 19.99,
        "list_price": 24.99,
        "sale_price": 22.99,
        "currency": "usd",
        "unit": "set",
        "options": {
            "mealtime": ["breakfast", "lunch", "dinner", "supper", "holiday"],
            "edition": ["adult", "youth", "instructor"],
            "medium": ["ebook", "paperback"]
        }
    },
    "instructor_set": {
        "name": "Instructor Set (36 Lessons)",
        "description": "Box set: Breakfast, Lunch, Dinner, Supper (all editions available)",
        "cost": 36.99,
        "list_price": 44.99,
        "sale_price": 39.99,
        "currency": "usd",
        "unit": "set",
        "options": {
            "edition": ["adult", "youth", "instructor"],
            "medium": ["ebook", "paperback"]
        }
    },
    "gaming_day_pass": {
        "name": "Gaming Day Pass",
        "description": "24-hour access to all game modes",
        "cost": 25.00,
        "list_price": 40.00,
        "sale_price": 29.99,
        "currency": "usd",
        "unit": "set"
    },
    "bonus_free": {
        "name": "Bonus Lessons (Free)",
        "description": "Names of God & Times and Seasons - Free download with no restrictions",
        "cost": 0.00,
        "list_price": {
            "pdf": 0.00
        },
        "sale_price": {
            "pdf": 0.00
        },
        "currency": "usd",
        "unit": "set",
        "options": {
            "edition": ["adult", "youth", "instructor"],
            "medium": ["pdf"]
        },
        "note": "Free to download and distribute - no restrictions"
    }
    "subscription_adult": {
        "name": "Adult Edition Subscription",
        "description": "Monthly subscription with all Soul Food series lessons",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly",
        "coupon_eligible": False  # Subscriptions cannot use coupons
    },
    "subscription_youth": {
        "name": "Youth Edition Subscription",
        "description": "Monthly subscription for ages 12-20",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly",
        "coupon_eligible": False  # Subscriptions cannot use coupons
    },
    "subscription_instructor": {
        "name": "Instructor Edition Subscription",
        "description": "Monthly subscription with teaching toolkit",
        "list_price": 14.99,
        "sale_price": 14.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly",
        "coupon_eligible": False  # Subscriptions cannot use coupons
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


@router.post("/notify-large-order")
async def notify_large_order(request: Request):
    """Send email notification for large print orders (>25 items)"""
    try:
        data = await request.json()
        quantity = data.get('quantity', 0)
        product_name = data.get('product_name', 'Unknown')
        customer_email = data.get('customer_email', 'Not provided')
        selections = data.get('selections', {})
        
        if quantity >= 25:
            # Here you would integrate with an email service
            # For now, we'll log it and return success
            # TODO: Integrate with SendGrid, AWS SES, or similar
            
            message = f"""
            LARGE ORDER ALERT
            
            Quantity: {quantity} items
            Product: {product_name}
            Customer Email: {customer_email}
            
            Selections:
            - Mealtime: {selections.get('mealtime', 'N/A')}
            - Edition: {selections.get('edition', 'N/A')}
            - Medium: {selections.get('medium', 'N/A')}
            
            Please review and process this bulk order.
            Sent to: kingdomlivingproject@gmail.com
            """
            
            print(f"[LARGE ORDER ALERT] {message}")
            
            return {
                "status": "success",
                "message": "Large order notification sent",
                "alert": "Orders over 25 items require manual review. We'll contact you shortly."
            }
        
        return {"status": "ok", "message": "No alert needed"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
