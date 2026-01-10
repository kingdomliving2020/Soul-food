from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

router = APIRouter(prefix="/api/coupons", tags=["coupons"])

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'soul_food_db')]

# Coupon definitions
COUPONS = {
    # ==================== CONTRIBUTOR COUPONS ====================
    "SoulX1079": {
        "code": "SoulX1079",
        "contributor": "Dee",
        "max_uses": 50,
        "discount_percent": 15,
        "conditions": "All items, single purchase transaction"
    },
    "SoulZ1003": {
        "code": "SoulZ1003",
        "contributor": "Jafari",
        "max_uses": 50,
        "discount_percent": 15,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1060": {
        "code": "SoulX1060",
        "contributor": "Rose",
        "max_uses": 50,
        "discount_percent": 10,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1072": {
        "code": "SoulX1072",
        "contributor": "Temia",
        "max_uses": 50,
        "discount_percent": 10,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1080": {
        "code": "SoulX1080",
        "contributor": "Mike",
        "max_uses": 50,
        "discount_percent": 10,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1059": {
        "code": "SoulX1059",
        "contributor": "Vicky",
        "max_uses": 50,
        "discount_percent": 10,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1073": {
        "code": "SoulX1073",
        "contributor": "Lee",
        "max_uses": 50,
        "discount_percent": 10,
        "conditions": "All items, single purchase transaction"
    },
    
    # ==================== BETA TEST COUPONS ====================
    "Beta1!2!3!": {
        "code": "Beta1!2!3!",
        "max_uses": 20,
        "discount_percent": 100,
        "conditions": "Games, holiday, breakfast set 24hr pass, single login session"
    },
    "Beta123abc": {
        "code": "Beta123abc",
        "max_uses": 20,
        "discount_percent": 100,
        "conditions": "Games, holiday, breakfast set 24hr pass, single login session"
    },
    "Beta123abcd": {
        "code": "Beta123abcd",
        "max_uses": 20,
        "discount_percent": 100,
        "conditions": "Games, holiday, breakfast set 24hr pass, single login session"
    },
    "BETATEST": {
        "code": "BETATEST",
        "max_uses": 100,
        "discount_percent": 100,
        "conditions": "Beta tester full access - all items"
    },
    
    # ==================== RBAC TEST ACCOUNTS ====================
    # test_ie (Instructor): 2wk access, can select game categories, users, lessons
    "test12345": {
        "code": "test12345",
        "role": "instructor",
        "max_uses": 100,
        "discount_percent": 100,
        "session_limit_mins": 120,
        "conditions": "IE test - can select game categories, users and lessons to unlock, 2hr session limit"
    },
    "test1234": {
        "code": "test1234",
        "role": "youth",
        "max_uses": 3,
        "discount_percent": 100,
        "session_limit_mins": 45,
        "conditions": "YE test - single or one month download, access to current youth game content, 45min session"
    },
    "test123": {
        "code": "test123",
        "role": "adult",
        "max_uses": 5,
        "discount_percent": 100,
        "session_limit_mins": 90,
        "conditions": "AE test - single or one month download, access to current adult game content, 90min session"
    },
    
    # ==================== BULK PURCHASE DISCOUNT CODES ====================
    "BOOK10": {
        "code": "BOOK10",
        "max_uses": 1000,
        "discount_percent": 10,
        "min_quantity": 5,
        "conditions": "Book Club Special - 10% off for 5+ items"
    },
    "BULK15": {
        "code": "BULK15",
        "max_uses": 1000,
        "discount_percent": 15,
        "min_quantity": 10,
        "conditions": "Small Bulk Order - 15% off for 10+ items"
    },
    "MEGA30": {
        "code": "MEGA30",
        "max_uses": 500,
        "discount_percent": 30,
        "min_quantity": 25,
        "conditions": "Mega Bulk Order - 30% off for 25+ items"
    }
}


class CouponValidateRequest(BaseModel):
    code: str
    product_ids: list[str]
    cart_total: float = 0  # For gift certificate dollar-off calculation


class CouponValidateResponse(BaseModel):
    valid: bool
    discount_percent: int
    discount_dollars: float = 0  # For fixed dollar discounts
    message: str
    code: str


@router.post("/validate")
async def validate_coupon(request: CouponValidateRequest):
    """Validate a coupon code and return discount information"""
    
    input_code = request.code.strip().upper()
    
    # FIRST: Check if this is a gift certificate discount code (SFGIFT-XXXXXXXX)
    if input_code.startswith("SFGIFT-"):
        discount_record = await db.discount_codes.find_one({
            "code": input_code,
            "status": "active"
        })
        
        if discount_record:
            # Check if already used
            if discount_record.get("times_used", 0) >= discount_record.get("max_uses", 1):
                return {
                    "valid": False,
                    "discount_percent": 0,
                    "discount_dollars": 0,
                    "message": "This discount code has already been used",
                    "code": input_code
                }
            
            # Check expiration
            if discount_record.get("valid_until") and datetime.utcnow() > discount_record["valid_until"]:
                return {
                    "valid": False,
                    "discount_percent": 0,
                    "discount_dollars": 0,
                    "message": "This discount code has expired",
                    "code": input_code
                }
            
            # Valid gift certificate discount!
            amount = discount_record.get("amount_dollars", 0)
            
            # Calculate effective discount percentage for the cart
            effective_percent = 0
            if request.cart_total > 0:
                effective_percent = min(100, int((amount / request.cart_total) * 100))
            
            return {
                "valid": True,
                "discount_percent": effective_percent,
                "discount_dollars": amount,
                "message": f"Gift certificate discount: ${amount:.2f} off!",
                "code": input_code,
                "is_gift_certificate": True
            }
        else:
            return {
                "valid": False,
                "discount_percent": 0,
                "discount_dollars": 0,
                "message": "Invalid or expired discount code",
                "code": input_code
            }
    
    # SECOND: Check hardcoded coupons (case-insensitive lookup)
    code = None
    for coupon_code in COUPONS.keys():
        if coupon_code.lower() == input_code.lower():
            code = coupon_code
            break
    
    # Check if coupon exists
    if code is None:
        return {
            "valid": False,
            "discount_percent": 0,
            "discount_dollars": 0,
            "message": "Invalid coupon code",
            "code": input_code
        }
    
    coupon = COUPONS[code]
    
    # Check usage count
    usage_count = await db.coupon_usage.count_documents({"code": code})
    
    if usage_count >= coupon["max_uses"]:
        return CouponValidateResponse(
            valid=False,
            discount_percent=0,
            message=f"This coupon has reached its maximum usage limit ({coupon['max_uses']} uses)",
            code=code
        )
    
    # Check if coupon applies to the products
    if "applies_to" in coupon:
        # Beta coupon - only applies to specific products
        applicable = any(pid in coupon["applies_to"] for pid in request.product_ids)
        if not applicable:
            return CouponValidateResponse(
                valid=False,
                discount_percent=0,
                message="This coupon does not apply to the items in your cart",
                code=code
            )
    
    # Coupon is valid
    return CouponValidateResponse(
        valid=True,
        discount_percent=coupon["discount_percent"],
        message=f"Coupon applied! You get {coupon['discount_percent']}% off",
        code=code
    )


@router.post("/apply")
async def apply_coupon(code: str, session_id: str):
    """Record coupon usage after successful payment"""
    
    code = code.strip().upper()
    
    if code not in COUPONS:
        raise HTTPException(status_code=400, detail="Invalid coupon code")
    
    # Check if already used for this session
    existing = await db.coupon_usage.find_one({"code": code, "session_id": session_id})
    if existing:
        return {"message": "Coupon already recorded for this session"}
    
    # Record usage
    usage_record = {
        "code": code,
        "session_id": session_id,
        "used_at": datetime.utcnow(),
        "discount_percent": COUPONS[code]["discount_percent"]
    }
    
    await db.coupon_usage.insert_one(usage_record)
    
    return {"message": "Coupon usage recorded", "code": code}


@router.get("/stats/{code}")
async def get_coupon_stats(code: str):
    """Get usage statistics for a coupon"""
    
    code = code.strip().upper()
    
    if code not in COUPONS:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    coupon = COUPONS[code]
    usage_count = await db.coupon_usage.count_documents({"code": code})
    
    return {
        "code": code,
        "max_uses": coupon["max_uses"],
        "current_uses": usage_count,
        "remaining_uses": coupon["max_uses"] - usage_count,
        "discount_percent": coupon["discount_percent"],
        "conditions": coupon["conditions"]
    }
