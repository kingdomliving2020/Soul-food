"""
Soul Food Referral Code System
==============================
Auto-generate referral codes that give both sender and receiver 15% off.
60-day expiry on all referral codes.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
import secrets
import string

router = APIRouter(prefix="/api/referrals", tags=["referrals"])

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ['DB_NAME']]

# Referral configuration
REFERRAL_DISCOUNT_PERCENT = 15
REFERRAL_EXPIRY_DAYS = 60


def generate_referral_code() -> str:
    """Generate a unique referral code like SOUL-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    return f"SOUL-{part1}-{part2}"


class CreateReferralRequest(BaseModel):
    user_id: str
    user_email: str
    user_name: Optional[str] = None


class UseReferralRequest(BaseModel):
    referral_code: str
    new_user_id: str
    new_user_email: str


@router.post("/create")
async def create_referral_code(request: CreateReferralRequest):
    """
    Create a new referral code for a user.
    Each user can have one active referral code at a time.
    """
    # Check if user already has an active referral code
    existing = await db.referral_codes.find_one({
        "owner_id": request.user_id,
        "status": "active",
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    }, {"_id": 0})
    
    if existing:
        return {
            "success": True,
            "code": existing["code"],
            "expires_at": existing["expires_at"].isoformat(),
            "uses": existing.get("use_count", 0),
            "message": "Your existing referral code is still active"
        }
    
    # Generate new code
    code = generate_referral_code()
    
    # Ensure uniqueness
    while await db.referral_codes.find_one({"code": code}):
        code = generate_referral_code()
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFERRAL_EXPIRY_DAYS)
    
    referral = {
        "code": code,
        "owner_id": request.user_id,
        "owner_email": request.user_email,
        "owner_name": request.user_name,
        "discount_percent": REFERRAL_DISCOUNT_PERCENT,
        "status": "active",
        "use_count": 0,
        "max_uses": None,  # Unlimited uses
        "created_at": datetime.now(timezone.utc),
        "expires_at": expires_at,
        "used_by": []  # Track who used this code
    }
    
    await db.referral_codes.insert_one(referral)
    
    return {
        "success": True,
        "code": code,
        "discount_percent": REFERRAL_DISCOUNT_PERCENT,
        "expires_at": expires_at.isoformat(),
        "expiry_days": REFERRAL_EXPIRY_DAYS,
        "message": f"Share this code! Both you and your friend get {REFERRAL_DISCOUNT_PERCENT}% off."
    }


@router.get("/validate/{code}")
async def validate_referral_code(code: str, user_id: Optional[str] = None):
    """
    Validate a referral code.
    Returns discount info if valid.
    """
    referral = await db.referral_codes.find_one({"code": code.upper()}, {"_id": 0})
    
    if not referral:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    if referral["status"] != "active":
        raise HTTPException(status_code=400, detail="This referral code is no longer active")
    
    if referral["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This referral code has expired")
    
    # Check if user is trying to use their own code
    if user_id and referral["owner_id"] == user_id:
        raise HTTPException(status_code=400, detail="You cannot use your own referral code")
    
    # Check if user already used this code
    if user_id and user_id in [u.get("user_id") for u in referral.get("used_by", [])]:
        raise HTTPException(status_code=400, detail="You have already used this referral code")
    
    days_remaining = (referral["expires_at"] - datetime.now(timezone.utc)).days
    
    return {
        "valid": True,
        "code": referral["code"],
        "discount_percent": referral["discount_percent"],
        "referrer_name": referral.get("owner_name", "A friend"),
        "expires_in_days": max(0, days_remaining),
        "message": f"You get {referral['discount_percent']}% off! Your friend will also get {referral['discount_percent']}% off their next purchase."
    }


@router.post("/use")
async def use_referral_code(request: UseReferralRequest):
    """
    Mark a referral code as used by a new customer.
    Creates a reward credit for the referrer.
    """
    code = request.referral_code.upper()
    
    referral = await db.referral_codes.find_one({"code": code}, {"_id": 0})
    
    if not referral:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    if referral["status"] != "active":
        raise HTTPException(status_code=400, detail="This referral code is no longer active")
    
    if referral["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This referral code has expired")
    
    # Check if user is trying to use their own code
    if referral["owner_id"] == request.new_user_id:
        raise HTTPException(status_code=400, detail="You cannot use your own referral code")
    
    # Check if user already used this code
    used_by_ids = [u.get("user_id") for u in referral.get("used_by", [])]
    if request.new_user_id in used_by_ids:
        raise HTTPException(status_code=400, detail="You have already used this referral code")
    
    # Record the use
    await db.referral_codes.update_one(
        {"code": code},
        {
            "$inc": {"use_count": 1},
            "$push": {
                "used_by": {
                    "user_id": request.new_user_id,
                    "user_email": request.new_user_email,
                    "used_at": datetime.now(timezone.utc)
                }
            }
        }
    )
    
    # Create a reward credit for the referrer (15% off their next purchase)
    reward_expires = datetime.now(timezone.utc) + timedelta(days=REFERRAL_EXPIRY_DAYS)
    reward_code = f"REWARD-{secrets.token_hex(4).upper()}"
    
    reward = {
        "code": reward_code,
        "type": "referral_reward",
        "owner_id": referral["owner_id"],
        "owner_email": referral["owner_email"],
        "discount_percent": REFERRAL_DISCOUNT_PERCENT,
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "expires_at": reward_expires,
        "source_referral": code,
        "referred_user": request.new_user_email
    }
    
    await db.referral_rewards.insert_one(reward)
    
    return {
        "success": True,
        "discount_applied": referral["discount_percent"],
        "message": f"Referral code applied! You get {referral['discount_percent']}% off this order.",
        "referrer_rewarded": True
    }


@router.get("/my-codes/{user_id}")
async def get_user_referral_codes(user_id: str):
    """
    Get all referral codes and rewards for a user.
    """
    # Get user's referral code
    referral = await db.referral_codes.find_one({
        "owner_id": user_id,
        "status": "active"
    }, {"_id": 0})
    
    # Get user's reward codes
    rewards = await db.referral_rewards.find({
        "owner_id": user_id,
        "status": "active",
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    }, {"_id": 0}).to_list(100)
    
    return {
        "referral_code": {
            "code": referral["code"] if referral else None,
            "uses": referral.get("use_count", 0) if referral else 0,
            "expires_at": referral["expires_at"].isoformat() if referral else None,
            "is_expired": referral["expires_at"] < datetime.now(timezone.utc) if referral else True
        } if referral else None,
        "reward_codes": [
            {
                "code": r["code"],
                "discount_percent": r["discount_percent"],
                "expires_at": r["expires_at"].isoformat(),
                "from_referral": r.get("referred_user", "Unknown")
            }
            for r in rewards
        ],
        "total_referrals": referral.get("use_count", 0) if referral else 0,
        "pending_rewards": len(rewards)
    }


@router.get("/stats/{user_id}")
async def get_referral_stats(user_id: str):
    """
    Get referral statistics for a user (for dashboard).
    """
    # Count total successful referrals
    referral = await db.referral_codes.find_one({"owner_id": user_id}, {"_id": 0})
    
    # Count total rewards earned
    rewards_count = await db.referral_rewards.count_documents({"owner_id": user_id})
    
    # Count used rewards
    used_rewards = await db.referral_rewards.count_documents({
        "owner_id": user_id,
        "status": "used"
    })
    
    return {
        "total_referrals": referral.get("use_count", 0) if referral else 0,
        "total_rewards_earned": rewards_count,
        "rewards_used": used_rewards,
        "active_rewards": rewards_count - used_rewards,
        "referral_code": referral["code"] if referral else None
    }
