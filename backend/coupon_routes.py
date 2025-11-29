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
db = client.soul_food_db

# Coupon definitions
COUPONS = {
    "SoulX1079": {
        "code": "SoulX1079",
        "max_uses": 50,
        "discount_percent": 15,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1003": {
        "code": "SoulX1003",
        "max_uses": 50,
        "discount_percent": 15,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1060": {
        "code": "SoulX1060",
        "max_uses": 50,
        "discount_percent": 10,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1072": {
        "code": "SoulX1072",
        "max_uses": 50,
        "discount_percent": 10,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1080": {
        "code": "SoulX1080",
        "max_uses": 50,
        "discount_percent": 10,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1059": {
        "code": "SoulX1059",
        "max_uses": 50,
        "discount_percent": 10,
        "conditions": "All items, single purchase transaction"
    },
    "SoulX1073": {
        "code": "SoulX1073",
        "max_uses": 50,
        "discount_percent": 10,
        "conditions": "All items, single purchase transaction"
    },
    "Beta1!2!3!": {
        "code": "Beta1!2!3!",
        "max_uses": 20,
        "discount_percent": 100,
        "conditions": "Games, holiday, breakfast set 24hr pass, single login session",
        "applies_to": ["gaming_day_pass", "mealtime_bundle", "combo_bundle", "instructor_set"]
    }
}


class CouponValidateRequest(BaseModel):
    code: str
    product_ids: list[str]


class CouponValidateResponse(BaseModel):
    valid: bool
    discount_percent: int
    message: str
    code: str


@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(request: CouponValidateRequest):
    """Validate a coupon code and return discount information"""
    
    code = request.code.strip().upper()
    
    # Check if coupon exists
    if code not in COUPONS:
        return CouponValidateResponse(
            valid=False,
            discount_percent=0,
            message="Invalid coupon code",
            code=code
        )
    
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
