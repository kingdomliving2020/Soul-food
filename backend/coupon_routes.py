"""
Coupon Routes - Refactored to use MongoDB
==========================================
- All coupons stored in MongoDB `coupons` collection
- Admin endpoints for CRUD operations
- Migration script to seed initial coupons
- Gift certificate discount codes handled separately
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List
from datetime import datetime, timezone
from jose import JWTError, jwt
import os
import secrets

router = APIRouter(prefix="/api/coupons", tags=["coupons"])

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'soul_food_db')]

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "soul-food-secret-key-change-in-production-2024")
ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

# =============================================================================
# Models
# =============================================================================

class CouponValidateRequest(BaseModel):
    code: str
    product_ids: list[str] = []
    cart_total: float = 0
    quantity: int = 1

class CouponValidateResponse(BaseModel):
    valid: bool
    discount_percent: int = 0
    discount_dollars: float = 0
    message: str
    code: str
    is_gift_certificate: bool = False

class CouponCreate(BaseModel):
    code: str
    discount_percent: int = Field(ge=0, le=100)
    max_uses: int = Field(default=100, ge=1)
    min_quantity: Optional[int] = None
    contributor: Optional[str] = None
    conditions: Optional[str] = None
    role: Optional[str] = None
    session_limit_mins: Optional[int] = None
    applies_to: Optional[List[str]] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    active: bool = True

class CouponUpdate(BaseModel):
    discount_percent: Optional[int] = Field(default=None, ge=0, le=100)
    max_uses: Optional[int] = Field(default=None, ge=1)
    min_quantity: Optional[int] = None
    conditions: Optional[str] = None
    active: Optional[bool] = None
    valid_until: Optional[datetime] = None

# =============================================================================
# Default Coupons (for seeding)
# =============================================================================

DEFAULT_COUPONS = [
    # Contributor Coupons
    {"code": "SoulX1079", "contributor": "Dee", "max_uses": 50, "discount_percent": 15, "conditions": "All items, single purchase transaction"},
    {"code": "SoulZ1003", "contributor": "Jafari", "max_uses": 50, "discount_percent": 15, "conditions": "All items, single purchase transaction"},
    {"code": "SoulX1060", "contributor": "Rose", "max_uses": 50, "discount_percent": 10, "conditions": "All items, single purchase transaction"},
    {"code": "SoulX1072", "contributor": "Temia", "max_uses": 50, "discount_percent": 10, "conditions": "All items, single purchase transaction"},
    {"code": "SoulX1080", "contributor": "Mike", "max_uses": 50, "discount_percent": 10, "conditions": "All items, single purchase transaction"},
    {"code": "SoulX1059", "contributor": "Vicky", "max_uses": 50, "discount_percent": 10, "conditions": "All items, single purchase transaction"},
    {"code": "SoulX1073", "contributor": "Lee", "max_uses": 50, "discount_percent": 10, "conditions": "All items, single purchase transaction"},
    
    # Beta Test Coupons - TESTII DISABLED
    {"code": "Beta1!2!3!", "max_uses": 20, "discount_percent": 100, "conditions": "Games, holiday, breakfast set 24hr pass, single login session"},
    {"code": "Beta123abc", "max_uses": 20, "discount_percent": 100, "conditions": "Games, holiday, breakfast set 24hr pass, single login session"},
    {"code": "Beta123abcd", "max_uses": 20, "discount_percent": 100, "conditions": "Games, holiday, breakfast set 24hr pass, single login session"},
    {"code": "BETATEST", "max_uses": 100, "discount_percent": 100, "conditions": "Beta tester full access - all items"},
    # {"code": "TESTII", "max_uses": 100, "discount_percent": 99, "conditions": "DISABLED - Live testing"},
    
    # $1 Cart Override Coupon - For testing checkout flow
    {"code": "DOLLARTEST", "max_uses": 50, "discount_type": "fixed_cart", "discount_amount": 0, "override_total": 1.00, "conditions": "Sets entire cart to $1 for checkout testing"},
    
    # RBAC Test Accounts
    {"code": "test12345", "role": "instructor", "max_uses": 100, "discount_percent": 100, "session_limit_mins": 120, "conditions": "IE test - can select game categories, users and lessons to unlock, 2hr session limit"},
    {"code": "test1234", "role": "youth", "max_uses": 3, "discount_percent": 100, "session_limit_mins": 45, "conditions": "YE test - single or one month download, access to current youth game content, 45min session"},
    {"code": "test123", "role": "adult", "max_uses": 5, "discount_percent": 100, "session_limit_mins": 90, "conditions": "AE test - single or one month download, access to current adult game content, 90min session"},
    
    # Bulk Purchase Discount Codes
    {"code": "BOOK10", "max_uses": 1000, "discount_percent": 10, "min_quantity": 5, "conditions": "Book Club Special - 10% off for 5+ items"},
    {"code": "BULK15", "max_uses": 1000, "discount_percent": 15, "min_quantity": 10, "conditions": "Small Bulk Order - 15% off for 10+ items"},
    {"code": "MEGA30", "max_uses": 500, "discount_percent": 30, "min_quantity": 25, "conditions": "Mega Bulk Order - 30% off for 25+ items"},
]

# =============================================================================
# Helper Functions
# =============================================================================

async def seed_coupons_if_empty():
    """Seed default coupons if the collection is empty"""
    count = await db.coupons.count_documents({})
    if count == 0:
        now = datetime.now(timezone.utc)
        for coupon in DEFAULT_COUPONS:
            coupon_doc = {
                **coupon,
                "times_used": 0,
                "active": True,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            await db.coupons.insert_one(coupon_doc)
        print(f"✅ Seeded {len(DEFAULT_COUPONS)} default coupons to MongoDB")
        return True
    return False

async def get_current_admin(
    authorization: HTTPAuthorizationCredentials = Depends(security)
):
    """Verify JWT and ensure user has admin access"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        payload = jwt.decode(authorization.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role", "")
        admin_roles = ["admin", "owner", "instructor_tester", "beta_tester"]
        if role not in admin_roles:
            raise HTTPException(status_code=403, detail="Admin access required")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================================
# Public Endpoints
# =============================================================================

@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(request: CouponValidateRequest):
    """Validate a coupon code and return discount information"""
    
    input_code = request.code.strip()
    
    # FIRST: Check if this is a gift certificate discount code (SFGIFT-XXXXXXXX)
    if input_code.upper().startswith("SFGIFT-"):
        discount_record = await db.discount_codes.find_one({
            "code": input_code.upper(),
            "status": "active"
        })
        
        if discount_record:
            # Check if already used
            if discount_record.get("times_used", 0) >= discount_record.get("max_uses", 1):
                return CouponValidateResponse(
                    valid=False,
                    message="This discount code has already been used",
                    code=input_code
                )
            
            # Check expiration
            if discount_record.get("valid_until"):
                valid_until = discount_record["valid_until"]
                if isinstance(valid_until, str):
                    valid_until = datetime.fromisoformat(valid_until.replace('Z', '+00:00'))
                if datetime.now(timezone.utc) > valid_until:
                    return CouponValidateResponse(
                        valid=False,
                        message="This discount code has expired",
                        code=input_code
                    )
            
            # Valid gift certificate discount!
            amount = discount_record.get("amount_dollars", 0)
            
            # Calculate effective discount percentage for the cart
            effective_percent = 0
            if request.cart_total > 0:
                effective_percent = min(100, int((amount / request.cart_total) * 100))
            
            return CouponValidateResponse(
                valid=True,
                discount_percent=effective_percent,
                discount_dollars=amount,
                message=f"Gift certificate discount: ${amount:.2f} off!",
                code=input_code,
                is_gift_certificate=True
            )
        else:
            return CouponValidateResponse(
                valid=False,
                message="Invalid or expired discount code",
                code=input_code
            )
    
    # SECOND: Check MongoDB coupons collection (case-insensitive)
    coupon = await db.coupons.find_one({
        "code": {"$regex": f"^{input_code}$", "$options": "i"},
        "active": True
    })
    
    if not coupon:
        return CouponValidateResponse(
            valid=False,
            message="Invalid coupon code",
            code=input_code
        )
    
    # Check usage count
    times_used = coupon.get("times_used", 0)
    max_uses = coupon.get("max_uses", 100)
    
    if times_used >= max_uses:
        return CouponValidateResponse(
            valid=False,
            message=f"This coupon has reached its maximum usage limit ({max_uses} uses)",
            code=coupon["code"]
        )
    
    # Check minimum quantity requirement
    min_qty = coupon.get("min_quantity")
    if min_qty and request.quantity < min_qty:
        return CouponValidateResponse(
            valid=False,
            message=f"This coupon requires a minimum of {min_qty} items",
            code=coupon["code"]
        )
    
    # Check validity dates
    now = datetime.now(timezone.utc)
    
    if coupon.get("valid_from"):
        valid_from = coupon["valid_from"]
        if isinstance(valid_from, str):
            valid_from = datetime.fromisoformat(valid_from.replace('Z', '+00:00'))
        if now < valid_from:
            return CouponValidateResponse(
                valid=False,
                message="This coupon is not yet active",
                code=coupon["code"]
            )
    
    if coupon.get("valid_until"):
        valid_until = coupon["valid_until"]
        if isinstance(valid_until, str):
            valid_until = datetime.fromisoformat(valid_until.replace('Z', '+00:00'))
        if now > valid_until:
            return CouponValidateResponse(
                valid=False,
                message="This coupon has expired",
                code=coupon["code"]
            )
    
    # Check if coupon applies to specific products
    if coupon.get("applies_to"):
        applicable = any(pid in coupon["applies_to"] for pid in request.product_ids)
        if not applicable:
            return CouponValidateResponse(
                valid=False,
                message="This coupon does not apply to the items in your cart",
                code=coupon["code"]
            )
    
    # Coupon is valid!
    discount_percent = coupon.get("discount_percent", 0)
    return CouponValidateResponse(
        valid=True,
        discount_percent=discount_percent,
        message=f"Coupon applied! You get {discount_percent}% off",
        code=coupon["code"]
    )

@router.post("/use/{code}")
async def record_coupon_use(code: str, order_id: Optional[str] = None):
    """Record that a coupon was used (increment usage counter)"""
    
    result = await db.coupons.update_one(
        {"code": {"$regex": f"^{code}$", "$options": "i"}},
        {
            "$inc": {"times_used": 1},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.modified_count == 0:
        # Coupon might not exist in DB yet, that's OK for legacy codes
        pass
    
    # Also record in coupon_usage collection for history
    await db.coupon_usage.insert_one({
        "code": code,
        "order_id": order_id,
        "used_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Usage recorded"}

# =============================================================================
# Admin Endpoints
# =============================================================================

@router.get("/admin/list")
async def list_all_coupons(admin = Depends(get_current_admin)):
    """List all coupons (admin only)"""
    
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(1000)
    return {"coupons": coupons, "count": len(coupons)}

@router.get("/admin/{code}")
async def get_coupon_details(code: str, admin = Depends(get_current_admin)):
    """Get details for a specific coupon (admin only)"""
    
    coupon = await db.coupons.find_one(
        {"code": {"$regex": f"^{code}$", "$options": "i"}},
        {"_id": 0}
    )
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Get usage history
    usage = await db.coupon_usage.find(
        {"code": {"$regex": f"^{code}$", "$options": "i"}},
        {"_id": 0}
    ).to_list(100)
    
    return {"coupon": coupon, "usage_history": usage}

@router.post("/admin/create")
async def create_coupon(coupon: CouponCreate, admin = Depends(get_current_admin)):
    """Create a new coupon (admin only)"""
    
    # Check if coupon already exists
    existing = await db.coupons.find_one({
        "code": {"$regex": f"^{coupon.code}$", "$options": "i"}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    now = datetime.now(timezone.utc)
    coupon_doc = {
        **coupon.dict(exclude_none=True),
        "times_used": 0,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.coupons.insert_one(coupon_doc)
    
    return {"message": "Coupon created successfully", "code": coupon.code}

@router.put("/admin/{code}")
async def update_coupon(code: str, update: CouponUpdate, admin = Depends(get_current_admin)):
    """Update an existing coupon (admin only)"""
    
    update_fields = {k: v for k, v in update.dict().items() if v is not None}
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No update fields provided")
    
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.coupons.update_one(
        {"code": {"$regex": f"^{code}$", "$options": "i"}},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return {"message": "Coupon updated successfully"}

@router.delete("/admin/{code}")
async def delete_coupon(code: str, admin = Depends(get_current_admin)):
    """Delete a coupon (admin only) - actually just deactivates it"""
    
    result = await db.coupons.update_one(
        {"code": {"$regex": f"^{code}$", "$options": "i"}},
        {"$set": {"active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return {"message": "Coupon deactivated successfully"}

@router.post("/admin/seed")
async def seed_default_coupons(admin = Depends(get_current_admin)):
    """Manually seed default coupons (admin only)"""
    
    seeded = await seed_coupons_if_empty()
    
    if seeded:
        return {"message": f"Seeded {len(DEFAULT_COUPONS)} default coupons"}
    else:
        return {"message": "Coupons collection already has data, no seeding performed"}

# =============================================================================
# Startup Event - Seed coupons on first load
# =============================================================================

async def initialize_coupons():
    """Called on app startup to ensure coupons are seeded"""
    await seed_coupons_if_empty()
