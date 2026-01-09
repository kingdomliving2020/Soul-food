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
db = client[os.environ.get('DB_NAME', 'soul_food_db')]

# Product catalog with list and sale prices
# Cost = wholesale/production cost, List Price = MSRP, Sale Price = current selling price
# Updated: January 2026 per SOFU_Full_Catalog_Pricing
PRODUCTS = {
    # ==================== SNACK PACKS (MODULES) ====================
    "snack_pack_m1": {
        "name": "Snack Pack Module 1 (4 Lessons)",
        "sku": "BKFT-SP-M1-DIG",
        "description": "Module 1 Digital for quick-start study—lesson content, journaling space, and activities. Theme: Prayer is the first resort",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "options": {
            "edition": ["adult", "youth"],
            "medium": ["pdf"]
        }
    },
    "snack_pack_m2": {
        "name": "Snack Pack Module 2 (4 Lessons)",
        "sku": "BKFT-SP-M2-DIG",
        "description": "Module 2 PDF—guided prompts, reflection space, and group-ready activities. Theme: Art of Through",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "options": {
            "edition": ["adult", "youth"],
            "medium": ["pdf"]
        }
    },
    "snack_pack_m3": {
        "name": "Snack Pack Module 3 (4 Lessons)",
        "sku": "BKFT-SP-M3-DIG",
        "description": "Module 3 PDF for continued growth—structured lessons with journaling space. Theme: Faith & Foresight",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "options": {
            "edition": ["adult", "youth"],
            "medium": ["pdf"]
        }
    },
    "snack_pack_bundle": {
        "name": "Snack Pack Bundle (M1+M2+M3)",
        "sku": "BKFT-SP-BUNDLE-DIG",
        "description": "Best value for groups—all 3 modules (12 lessons) in digital format",
        "list_price": 26.97,
        "sale_price": 21.99,
        "currency": "usd",
        "unit": "set",
        "options": {
            "edition": ["adult", "youth"],
            "medium": ["pdf"]
        },
        "note": "Best value for groups or readers who want the full sequence"
    },
    
    # ==================== FULL WORKBOOKS ====================
    "breakfast_instructor": {
        "name": "Break*fast Instructor Edition",
        "sku": "BKFT-IE-PB-COL",
        "stripe_id": "prod_TkyiFSioq2XGD3",
        "description": "Leader-focused edition with teaching support, discussion guidance, and answer helps. Includes maps plus cultural/historical notes.",
        "list_price": {"paperback": 29.99, "digital": 19.99},
        "sale_price": {"paperback": 26.99, "digital": 19.99},
        "preorder_discount": 10,
        "currency": "usd",
        "unit": "ea",
        "options": {
            "medium": ["paperback", "digital"]
        },
        "edition": "IE"
    },
    "breakfast_adult": {
        "name": "Break*fast Adult Edition",
        "sku": "BKFT-AE-PB-COL",
        "stripe_id": "prod_TkyWMfuMLXq0je",
        "description": "Adult workbook centered on Foundation in Christ. Journal-style space with reflective prompts and group-ready activities.",
        "list_price": {"paperback": 27.99, "digital": 14.99},
        "sale_price": {"paperback": 23.99, "digital": 14.99},
        "preorder_discount": 15,
        "currency": "usd",
        "unit": "ea",
        "options": {
            "medium": ["paperback", "digital"]
        },
        "edition": "AE"
    },
    "breakfast_youth": {
        "name": "Break*fast Youth Edition",
        "sku": "BKFT-YE-PB-COL",
        "stripe_id": "prod_TkySkHdyBvH3jp",
        "description": "Youth workbook built to strengthen identity and growth in Christ. Guided prompts, journaling space, and engaging activities for teens.",
        "list_price": {"paperback": 24.99, "digital": 12.99},
        "sale_price": {"paperback": 21.99, "digital": 12.99},
        "preorder_discount": 15,
        "currency": "usd",
        "unit": "ea",
        "options": {
            "medium": ["paperback", "digital"]
        },
        "edition": "YE"
    },
    
    # ==================== HOLIDAY SERIES ====================
    "holiday_adult": {
        "name": "Holiday: 4 C's of Christianity (AE)",
        "sku": "HOL-AE-PB-COL",
        "stripe_id": "prod_TkyqsEGwOalBcj",
        "description": "Seasonal workbook exploring Covenant, Cradle, Cross, and Comforter. Reflection space and group-friendly activities.",
        "list_price": {"paperback": 24.99, "digital": 12.99},
        "sale_price": {"paperback": 21.99, "digital": 12.99},
        "preorder_discount": 15,
        "currency": "usd",
        "unit": "ea",
        "options": {
            "medium": ["paperback", "digital"]
        },
        "edition": "AE"
    },
    "holiday_instructor": {
        "name": "Holiday: 4 C's of Christianity (IE)",
        "sku": "HOL-IE-EPUB",
        "stripe_id": "prod_TkynA6cc3JztEw",
        "description": "Leader-focused edition with teaching support, discussion guidance, answer helps, maps and cultural/historical notes.",
        "list_price": {"epub": 19.99},
        "sale_price": {"epub": 19.99},
        "currency": "usd",
        "unit": "ea",
        "options": {
            "medium": ["epub"]
        },
        "edition": "IE"
    },
    
    # ==================== NIBBLES (SINGLE LESSONS) ====================
    "nibble_adult": {
        "name": "Nibble - Adult Edition",
        "sku": "BKFT-NIB-AE-DIG",
        "stripe_id": "prod_Tl6dXzvc89fzpU",
        "description": "Single lesson PDF - explore a taste of the Foundation in Christ Modules",
        "list_price": 3.99,
        "sale_price": 3.99,
        "currency": "usd",
        "unit": "ea",
        "options": {
            "medium": ["pdf"]
        },
        "edition": "AE"
    },
    "nibble_youth": {
        "name": "Nibble - Youth Edition",
        "sku": "BKFT-NIB-YE-DIG",
        "stripe_id": "prod_Tl6hePoHzLo5pi",
        "description": "Breakfast Series Foundation in Christ, Single Lesson PDF",
        "list_price": 3.99,
        "sale_price": 3.99,
        "currency": "usd",
        "unit": "ea",
        "options": {
            "medium": ["pdf"]
        },
        "edition": "YE"
    },
    
    # ==================== GAME PASSES ====================
    "game_pass_30": {
        "name": "Game Pass (30-Day Access)",
        "sku": "GAMEPASS-30D",
        "stripe_id": "prod_Tl1WjpGERc2Jss",
        "description": "30-day access to Soul Food game content (Jeopardy-style, group activities, and review challenges)",
        "list_price": 7.99,
        "sale_price": 7.99,
        "currency": "usd",
        "unit": "ea"
    },
    "game_pass_90": {
        "name": "Game Pass (90-Day Access)",
        "sku": "GAMEPASS-90D",
        "stripe_id": "prod_Tl7mje38Mzyynu",
        "description": "90-day access to Soul Food game content for churches, small groups, and quarterly study cycles",
        "list_price": 24.99,
        "sale_price": 24.99,
        "currency": "usd",
        "unit": "ea"
    },
    
    # ==================== SUBSCRIPTIONS ====================
    "subscription_monthly": {
        "name": "Digital Subscriber (Monthly)",
        "sku": "SUB-DIG-MO",
        "stripe_id": "prod_Tl0kH2PyhK9CQX",
        "description": "Monthly membership—subscriber-only content and access to game tools while active",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly",
        "coupon_eligible": False
    },
    "subscription_annual": {
        "name": "Digital Subscriber (Annual)",
        "sku": "SUB-DIG-YR",
        "stripe_id": "prod_Tl1Ew8ARYBTaJE",
        "description": "Annual membership—Best value! 2 months free + subscriber-only content and game tools",
        "list_price": 99.00,
        "sale_price": 99.00,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "annual",
        "coupon_eligible": False,
        "note": "Best value (2 months free)"
    },
    "subscription_instructor": {
        "name": "Instructor Edition Subscription",
        "sku": "SUB-DIG-IE",
        "stripe_id": "prod_Tl16PJLWwiDwYD",
        "description": "Instructor edition—includes group-use game tools and leader resources",
        "list_price": 14.99,
        "sale_price": 14.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly",
        "coupon_eligible": False
    },
    "subscription_group": {
        "name": "Ministry/Small Group Subscription",
        "sku": "SUB-GROUP-MO",
        "stripe_id": "prod_Tl14UhRAbaJ8vC",
        "description": "Group plan for leaders—includes group-use game tools and leader resources",
        "list_price": 24.99,
        "sale_price": 24.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly",
        "coupon_eligible": False
    },
    
    # ==================== MERCH ====================
    "pen_lighted": {
        "name": "SOFU Journal Pen - Lighted",
        "sku": "MERCH-PEN-01",
        "description": "Branded lighted journal pen",
        "list_price": 9.99,
        "sale_price": 9.09,
        "currency": "usd",
        "unit": "ea",
        "note": "10% launch offer"
    },
    "pen_standard": {
        "name": "SOFU Journal Pen",
        "sku": "MERCH-PEN-02",
        "description": "Branded journal pen",
        "list_price": 7.99,
        "sale_price": 7.29,
        "currency": "usd",
        "unit": "ea",
        "note": "10% launch offer"
    },
    "bookmarks_melamine": {
        "name": "Magnetic Bookmarks (Set of 3)",
        "sku": "MAG-MEL-3PK",
        "description": "Set of 3 magnetic bookmarks",
        "list_price": 6.99,
        "sale_price": 6.29,
        "currency": "usd",
        "unit": "set",
        "note": "10% launch offer"
    },
    "bookmarks_leather": {
        "name": "Magnetic Leather Bookmarks",
        "sku": "MAG-LEA-BMK",
        "description": "Premium magnetic leather bookmarks",
        "list_price": 6.99,
        "sale_price": 6.29,
        "currency": "usd",
        "unit": "ea",
        "note": "10% launch offer"
    },
    "study_kit": {
        "name": "Study Kit Add-On",
        "sku": "MERCH-STUDYKIT-ADDON",
        "description": "Pen + Magnetic Bookmark Set bundle",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "unit": "set"
    },
    
    # ==================== FREE / BONUS ====================
    "bonus_free": {
        "name": "Bonus Lessons (Free)",
        "description": "Names of God & Times and Seasons - Free download with no restrictions",
        "list_price": 0.00,
        "sale_price": 0.00,
        "currency": "usd",
        "unit": "set",
        "options": {
            "edition": ["adult", "youth", "instructor"],
            "medium": ["pdf"]
        },
        "note": "Free to download and distribute - no restrictions"
    }
}

# Bulk discount coupon codes
BULK_COUPONS = {
    "BOOK10": {
        "name": "Book Club Special",
        "discount_percent": 10,
        "min_quantity": 5,
        "description": "10% off for book clubs (5+ items)"
    },
    "BULK15": {
        "name": "Small Bulk Order",
        "discount_percent": 15,
        "min_quantity": 10,
        "description": "15% off for bulk orders (10+ items)"
    },
    "MEGA30": {
        "name": "Mega Bulk Order",
        "discount_percent": 30,
        "min_quantity": 25,
        "description": "30% off for mega orders (25+ items)"
    }
}


class CheckoutRequest(BaseModel):
    product_id: str
    quantity: int = 1
    origin_url: str


class StatusRequest(BaseModel):
    session_id: str


class FreeOrderItem(BaseModel):
    product_id: str
    name: str
    quantity: int
    price: float


class FreeOrderRequest(BaseModel):
    items: list[FreeOrderItem]
    coupon_code: str
    discount_percent: int


@router.post("/free-order")
async def process_free_order(request: FreeOrderRequest):
    """Process a free order (100% discount coupon)"""
    import uuid
    
    # Validate coupon
    if request.discount_percent != 100:
        raise HTTPException(status_code=400, detail="This endpoint is for free orders only (100% discount)")
    
    # Generate order ID
    order_id = f"FREE-{str(uuid.uuid4())[:8].upper()}"
    
    # Store the order
    order = {
        "order_id": order_id,
        "items": [item.dict() for item in request.items],
        "coupon_code": request.coupon_code,
        "discount_percent": request.discount_percent,
        "total_amount": 0.00,
        "payment_status": "completed",
        "order_type": "free_beta",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.orders.insert_one(order)
    
    return {
        "success": True,
        "order_id": order_id,
        "message": "Free order processed successfully",
        "items": [item.dict() for item in request.items]
    }


class CartCheckoutRequest(BaseModel):
    items: list
    origin_url: str
    coupon_code: Optional[str] = None
    discount_percent: int = 0


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
    api_key = os.getenv('STRIPE_SECRET_KEY')
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


@router.post("/checkout/cart")
async def create_cart_checkout_session(request: CartCheckoutRequest, http_request: Request):
    """Create a Stripe checkout session for cart items (flexible product IDs)"""
    import stripe
    
    if not request.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Get Stripe API key
    api_key = os.getenv('STRIPE_SECRET_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    stripe.api_key = api_key
    
    # Calculate total from cart items
    line_items = []
    total_amount = 0
    item_names = []
    
    for item in request.items:
        item_price = item.get('salePrice', item.get('price', 0))
        item_qty = item.get('quantity', 1)
        item_name = item.get('name', 'Soul Food Product')
        
        total_amount += item_price * item_qty
        item_names.append(f"{item_name} x{item_qty}")
        
        # Create line item for Stripe
        line_items.append({
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': item_name,
                    'description': item.get('description', 'Soul Food Digital Content'),
                },
                'unit_amount': int(item_price * 100),  # Stripe uses cents
            },
            'quantity': item_qty,
        })
    
    # Apply discount if coupon provided
    if request.discount_percent > 0:
        discount_amount = total_amount * (request.discount_percent / 100)
        total_amount -= discount_amount
    
    # Build URLs
    origin_url = request.origin_url.rstrip('/')
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment-cancel"
    
    try:
        # Create Stripe Checkout Session directly
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'source': 'soul_food_cart',
                'items': ', '.join(item_names)[:500],  # Stripe metadata limit
                'coupon': request.coupon_code or '',
                'discount': str(request.discount_percent)
            }
        )
        
        # Store pending transaction
        transaction = {
            "session_id": session.id,
            "items": request.items,
            "total_amount": total_amount,
            "currency": "usd",
            "payment_status": "pending",
            "status": "initiated",
            "coupon_code": request.coupon_code,
            "discount_percent": request.discount_percent,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.payment_transactions.insert_one(transaction)
        
        return {
            "url": session.url,
            "session_id": session.id,
            "amount": total_amount
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Check the status of a checkout session"""
    
    # Get Stripe API key
    api_key = os.getenv('STRIPE_SECRET_KEY')
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
    api_key = os.getenv('STRIPE_SECRET_KEY')
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
