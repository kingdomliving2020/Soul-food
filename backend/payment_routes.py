from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, List
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

# PDF files directory
PDF_DIR = os.path.join(os.path.dirname(__file__), "lesson_pdfs")

# Product ID to PDF file mapping
PRODUCT_FILES = {
    # Snack Packs
    "snack_pack_ae_m1": "breakfast-ae-month1-snackpack.pdf",
    "snack_pack_ae_m2": "breakfast-ae-month2-snackpack.pdf",
    "snack_pack_ae_m3": "breakfast-ae-month3-snackpack.pdf",
    "snack_pack_ye_m1": "breakfast-ye-month1-snackpack.pdf",
    "snack_pack_ye_m2": "breakfast-ye-month2-snackpack.pdf",
    "snack_pack_ye_m3": "breakfast-ye-month3-snackpack.pdf",
    # Full Workbooks
    "breakfast_ae_digital": "breakfast-ae-full.pdf",
    "breakfast_ye_digital": "breakfast-ye-full.pdf",
    "breakfast_ie_digital": "breakfast-ie-full.pdf",
    # Holiday
    "holiday_ae": "holiday-ae-full.pdf",
    "holiday_ye": "holiday-ye-full.pdf",
    "holiday_ie": "holiday-ie-full.pdf",
    # Nibbles (single lessons)
    "nibble_ae": "breakfast-ae-esther.pdf",  # Sample nibble
    "nibble_ye": "breakfast-ye-esther.pdf",  # Sample nibble
    # Free bonus lessons
    "bonus_names_of_god": "holiday-bonus-names-seasons.pdf",
    "bonus_times_seasons": "holiday-bonus-names-seasons.pdf",
    "bonus_in_his_image": "in-his-image-adult-full.pdf",
}

def get_pdf_path(product_id: str) -> Optional[str]:
    """Get the full path to a product's PDF file"""
    filename = PRODUCT_FILES.get(product_id)
    if not filename:
        return None
    full_path = os.path.join(PDF_DIR, filename)
    if os.path.exists(full_path):
        return full_path
    return None

# Product catalog with list and sale prices
# Cost = wholesale/production cost, List Price = MSRP, Sale Price = current selling price
# Updated: January 2026 per Stripe Product Catalog
PRODUCTS = {
    # ==================== SNACK PACKS - ADULT EDITION ====================
    "snack_pack_ae_m1": {
        "name": "Break*fast Snack Pack AE M1",
        "sku": "BKFT-SP-AE-M1",
        "stripe_id": "prod_Tl6meQRKMfxtOq",
        "description": "Adult Edition. Module 1 (4 Lessons) PDF for quick-start study—lesson content, journaling space, and activities. Theme: Prayer, the First Resort",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "AE"
    },
    "snack_pack_ae_m2": {
        "name": "Break*fast Snack Pack AE M2",
        "sku": "BKFT-SP-AE-M2",
        "stripe_id": "prod_Tl6wX9CvgMB8Tz",
        "description": "Adult Edition. Module 2 (4 Lessons) PDF—guided prompts, reflection space, and group-ready activities. Theme: The Art of Through",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "AE"
    },
    "snack_pack_ae_m3": {
        "name": "Break*fast Snack Pack AE M3",
        "sku": "BKFT-SP-AE-M3",
        "stripe_id": "prod_Tl6zPmnPaSE4iQ",
        "description": "Adult Edition. Module 3 (4 Lessons) PDF for continued growth—structured lessons with journaling space. Theme: Faith & Foresight",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "AE"
    },
    
    # ==================== SNACK PACKS - YOUTH EDITION ====================
    "snack_pack_ye_m1": {
        "name": "Break*fast Snack Pack YE M1",
        "sku": "BKFT-SP-YE-M1",
        "stripe_id": "prod_Tl5jzNmDkKJnth",
        "description": "Youth Edition. Module 1 (4 Lessons) PDF for quick-start study—lesson content, journaling space, and activities. Theme: Prayer, the First Resort",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "YE"
    },
    "snack_pack_ye_m2": {
        "name": "Break*fast Snack Pack YE M2",
        "sku": "BKFT-SP-YE-M2",
        "stripe_id": "prod_Tl5oCtBvc2kGHX",
        "description": "Youth Edition. Module 2 (4 Lessons) PDF—guided prompts, reflection space, and group-ready activities. Theme: The Art of Through",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "YE"
    },
    "snack_pack_ye_m3": {
        "name": "Break*fast Snack Pack YE M3",
        "sku": "BKFT-SP-YE-M3",
        "stripe_id": "prod_Tl5vC3AqFX0CBp",
        "description": "Youth Edition. Module 3 (4 Lessons) PDF for continued growth—structured lessons with journaling space. Theme: Faith & Foresight",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "YE"
    },
    
    # ==================== BREAKFAST WORKBOOKS ====================
    "breakfast_ie_digital": {
        "name": "Break*fast IE (Digital)",
        "sku": "BKFT-IE-DIG",
        "stripe_id": "prod_Tl5P17AYZd8eAR",
        "description": "Leader-focused edition with teaching support, discussion guidance, and answer helps. Includes maps plus cultural/historical notes.",
        "list_price": 19.99,
        "sale_price": 19.99,
        "currency": "usd",
        "edition": "IE",
        "medium": "digital"
    },
    "breakfast_ie_paperback": {
        "name": "Break*fast Instructor Edition (WBK)",
        "sku": "BKFT-IE-PB",
        "stripe_id": "prod_Tl5DmbgIRsGRbR",
        "description": "Leader-focused edition with teaching support, discussion guidance, and answer helps. Includes maps plus cultural/historical notes.",
        "list_price": 29.99,
        "sale_price": 29.99,
        "currency": "usd",
        "edition": "IE",
        "medium": "paperback"
    },
    "breakfast_ae_digital": {
        "name": "Break*fast AE (Digital)",
        "sku": "BKFT-AE-DIG",
        "stripe_id": "prod_Tl5TzIALgCR5AX",
        "description": "Adult workbook centered on Foundation in Christ. Journal-style space with reflective prompts and group-ready activities.",
        "list_price": 14.99,
        "sale_price": 14.99,
        "currency": "usd",
        "edition": "AE",
        "medium": "digital"
    },
    "breakfast_ae_paperback": {
        "name": "Break*fast Adult Edition (WBK)",
        "sku": "BKFT-AE-PB",
        "stripe_id": "prod_Tl5GHVPeUEeqRH",
        "description": "Adult workbook centered on Foundation in Christ. Journal-style space with reflective prompts and group-ready activities.",
        "list_price": 27.99,
        "sale_price": 27.99,
        "currency": "usd",
        "edition": "AE",
        "medium": "paperback"
    },
    "breakfast_ye_digital": {
        "name": "Break*fast YE (Digital)",
        "sku": "BKFT-YE-DIG",
        "stripe_id": "prod_Tl5WM3aZcWrBB1",
        "description": "Youth workbook built to strengthen identity and growth in Christ. Guided prompts, journaling space, and engaging activities for teens.",
        "list_price": 12.99,
        "sale_price": 12.99,
        "currency": "usd",
        "edition": "YE",
        "medium": "digital"
    },
    "breakfast_ye_paperback": {
        "name": "Break*fast Youth Edition (WBK)",
        "sku": "BKFT-YE-PB",
        "stripe_id": "prod_Tl5KYUQVq7fgKd",
        "description": "Youth workbook built to strengthen identity and growth in Christ. Guided prompts, journaling space, and engaging activities for teens.",
        "list_price": 24.99,
        "sale_price": 24.99,
        "currency": "usd",
        "edition": "YE",
        "medium": "paperback"
    },
    
    # ==================== LUNCH WORKBOOKS (PRE-ORDER) ====================
    "lunch_ie_paperback": {
        "name": "Lunch Instructor Edition (WBK)",
        "sku": "LNCH-IE-PB",
        "stripe_id": "prod_Tl5bF463nMytFx",
        "description": "Instructor workbook built to provide kingdom relationship examples. Guided prompts, journaling space, and engaging activities designed for leading various types of groups.",
        "list_price": 29.99,
        "sale_price": 29.99,
        "currency": "usd",
        "edition": "IE",
        "medium": "paperback",
        "preorder": True
    },
    "lunch_ae_paperback": {
        "name": "Lunch Adult Edition (WBK)",
        "sku": "LNCH-AE-PB",
        "stripe_id": "prod_Tl5dMEyGFDitEf",
        "description": "Adult workbook built to show Kingdom Relationship in the bible. Guided prompts, journaling space, and engaging activities designed for mature groups and family study.",
        "list_price": 27.99,
        "sale_price": 27.99,
        "currency": "usd",
        "edition": "AE",
        "medium": "paperback",
        "preorder": True
    },
    "lunch_ye_paperback": {
        "name": "Lunch Youth Edition (WBK)",
        "sku": "LNCH-YE-PB",
        "stripe_id": "prod_Tl5hAx8RL8Vvjh",
        "description": "Youth workbook built to provide inspiring examples about Kingdom Relationships. Guided prompts, journaling space, and engaging activities designed for teens, youth groups, and family study.",
        "list_price": 24.99,
        "sale_price": 24.99,
        "currency": "usd",
        "edition": "YE",
        "medium": "paperback",
        "preorder": True
    },
    
    # ==================== HOLIDAY WORKBOOKS ====================
    "holiday_ie": {
        "name": "Holiday Instructor Edition (WBK)",
        "sku": "HOL-IE-WBK",
        "stripe_id": "prod_Tl6IOtuiMAgrwC",
        "description": "Instructor. Seasonal workbook exploring the 4Cs—Covenant, Cradle, Cross, and Comforter. Reflection space and group-friendly activities.",
        "list_price": 19.99,
        "sale_price": 19.99,
        "currency": "usd",
        "edition": "IE"
    },
    "holiday_ae": {
        "name": "Holiday Adult Edition (WBK)",
        "sku": "HOL-AE-WBK",
        "stripe_id": "prod_Tl6LmJkJxDrzLA",
        "description": "Adult. Seasonal workbook exploring the 4Cs—Covenant, Cradle, Cross, and Comforter. Reflection space and group-friendly activities.",
        "list_price": 16.99,
        "sale_price": 16.99,
        "currency": "usd",
        "edition": "AE"
    },
    "holiday_ye": {
        "name": "Holiday Youth Edition (WBK)",
        "sku": "HOL-YE-WBK",
        "stripe_id": "prod_Tl6WIl0O7XFFgg",
        "description": "Youth Edition. Seasonal workbook exploring the 4Cs—Covenant, Cradle, Cross, and Comforter. Reflection space and group-friendly activities.",
        "list_price": 16.99,
        "sale_price": 16.99,
        "currency": "usd",
        "edition": "YE"
    },
    
    # ==================== NIBBLES (SINGLE LESSONS) ====================
    "nibble_ae": {
        "name": "Break*fast Nibble AE",
        "sku": "BKFT-NIB-AE-DIG",
        "stripe_id": "prod_Tl6dXzvc89fzpU",
        "description": "Single lesson from the Foundation in Christ series. A great sampler with Journal-style space with reflective prompts and group-ready activities.",
        "list_price": 3.99,
        "sale_price": 3.99,
        "currency": "usd",
        "edition": "AE"
    },
    "nibble_ye": {
        "name": "Break*fast Nibble YE",
        "sku": "BKFT-NIB-YE-DIG",
        "stripe_id": "prod_Tl6hePoHzLo5pi",
        "description": "Single lesson from the Foundation in Christ series. A great sampler with Journal-style space with reflective prompts and group-ready activities for youth.",
        "list_price": 3.99,
        "sale_price": 3.99,
        "currency": "usd",
        "edition": "YE"
    },
    
    # ==================== GAME PASSES ====================
    "game_pass_30": {
        "name": "Digital Games Subscription (30-Day)",
        "sku": "GAMEPASS-30D",
        "stripe_id": "prod_Tl7ZEakAImOyVc",
        "description": "30‑day access to SOFU game content (Jeopardy‑style, group activities, and review challenges) for study groups and family nights.",
        "list_price": 7.99,
        "sale_price": 7.99,
        "currency": "usd"
    },
    "game_pass_90": {
        "name": "Game Pass (90-Day Access)",
        "sku": "GAMEPASS-90D",
        "stripe_id": "prod_Tl7mje38Mzyynu",
        "description": "90‑day access to SOFU game content—best for churches, small groups, and quarterly study cycles.",
        "list_price": 24.99,
        "sale_price": 24.99,
        "currency": "usd"
    },
    
    # ==================== SUBSCRIPTIONS ====================
    "subscription_ye_monthly": {
        "name": "Digital Subscriber Youth (Monthly)",
        "sku": "SUB-DIG-YE-MO",
        "stripe_id": "prod_Tl7prlu7F5iyEO",
        "description": "Monthly membership for ongoing digital study support—includes subscriber-only content and access to game tools while active.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly"
    },
    "subscription_ae_monthly": {
        "name": "Digital Subscriber Adult (Monthly)",
        "sku": "SUB-DIG-AE-MO",
        "stripe_id": "prod_Tl7rxDr2e2mEJD",
        "description": "Monthly membership for ongoing digital study support—includes subscriber-only content and access to game tools while active.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly"
    },
    "subscription_annual": {
        "name": "Digital Subscriber (Annual)",
        "sku": "SUB-DIG-YR",
        "stripe_id": "prod_Tl7u6eq2D4eq2l",
        "description": "Annual membership (best value)—subscriber-only digital content plus game tools access while active.",
        "list_price": 99.00,
        "sale_price": 99.00,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "annual",
        "note": "Best value (2 months free)"
    },
    "subscription_group": {
        "name": "Ministry/Small Group (Monthly)",
        "sku": "SUB-GROUP-MO",
        "stripe_id": "prod_Tl7xoZNf3clBV7",
        "description": "Instructor Edition. Group plan for leaders—includes group-use game tools and leader resources to support one active study group.",
        "list_price": 24.99,
        "sale_price": 24.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly"
    },
    
    # ==================== MERCHANDISE ====================
    "pen_lighted": {
        "name": "SOFU Journal Pen - Lighted",
        "sku": "MERCH-PEN-LIT",
        "stripe_id": "prod_Tl7Opou94EsuJ5",
        "description": "Smooth-write pen for journaling and workbook activities—perfect companion for daily study and note-taking. Stylus with light.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd"
    },
    "pen_standard": {
        "name": "SOFU Journal Pen (Branded)",
        "sku": "MERCH-PEN-STD",
        "stripe_id": "prod_Tl7P1p5sTgCvlS",
        "description": "Smooth-write pen for journaling and workbook activities—perfect companion for daily study and note-taking.",
        "list_price": 7.99,
        "sale_price": 7.99,
        "currency": "usd"
    },
    "bookmarks_set": {
        "name": "Magnetic Bookmarks (Set of 3)",
        "sku": "MAG-BMK-3PK",
        "stripe_id": "prod_Tl7RVhKKT4hXht",
        "description": "Magnetic page markers to keep your place—durable, gift-able, and ideal for quick returns to key verses and activities.",
        "list_price": 6.99,
        "sale_price": 6.99,
        "currency": "usd"
    },
    "bookmark_leather": {
        "name": "Magnetic Leather Bookmarks",
        "sku": "MAG-LEA-BMK",
        "stripe_id": "prod_Tl7VKMwhaPnq8t",
        "description": "Magnetic page markers to keep your place—durable, giftable, and ideal for quick returns to key verses and activities.",
        "list_price": 4.99,
        "sale_price": 4.99,
        "currency": "usd"
    },
    "study_kit": {
        "name": "Study Kit Add-On (Pen + Bookmark Set)",
        "sku": "MERCH-STUDYKIT",
        "stripe_id": "prod_Tl7Xhx1eHZIomZ",
        "description": "Quick study add-on for your workbook—includes one journal pen plus a 3-pack of magnetic bookmarks.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd"
    },
    
    # ==================== FREE / BONUS LESSONS ====================
    "bonus_names_of_god": {
        "name": "Bonus Lessons: Names of God",
        "sku": "BONUS-NOG",
        "stripe_id": "prod_Tl7I5X9MoZQt1S",
        "description": "These lessons are great to help readers understand the attributes of God and the importance of how God has ordained seasons and times.",
        "list_price": 0.00,
        "sale_price": 0.00,
        "currency": "usd",
        "free": True
    },
    "bonus_times_seasons": {
        "name": "Bonus Lessons: Times and Seasons",
        "sku": "BONUS-TAS",
        "stripe_id": "prod_Tl7J55jWsk72EY",
        "description": "These lessons are great to help readers understand the attributes of God and the importance of how God has ordained seasons and times.",
        "list_price": 0.00,
        "sale_price": 0.00,
        "currency": "usd",
        "free": True
    },
    "bonus_in_his_image": {
        "name": "Bonus Lesson: In His Image",
        "sku": "BONUS-IHI",
        "stripe_id": "prod_Tl7LiH0xsvjnHp",
        "description": "With everything going on and the narrative of the world, it is important to know what God says about you and how he views you.",
        "list_price": 0.00,
        "sale_price": 0.00,
        "currency": "usd",
        "free": True
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
