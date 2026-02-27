"""
Audio Access Code System for Soul Food
- Auto-generates codes for physical book purchases
- Tracks redemptions and access
- Links audio content to purchased series
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import secrets
import string
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/api/audio", tags=["audio"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "soulfood")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Audio content mapping - which series has which audio lessons
AUDIO_CONTENT = {
    "holiday": {
        "name": "Holiday Series - The 4 C's",
        "lessons": [
            {"id": "covenant", "title": "The Covenant", "speaker": "Pastor Mike Edwards", "duration": "8:45"},
            {"id": "cradle", "title": "The Cradle", "speaker": "Pastor Mike Edwards", "duration": "11:30"},
            {"id": "cross", "title": "The Cross", "speaker": "Pastor Mike Edwards", "duration": "4:30"},
            {"id": "comforter", "title": "The Comforter", "speaker": "Pastor Mike Edwards", "duration": "4:30"},
        ],
        "single_price": 2.49,
        "bundle_price": 7.99,
        "bundle_savings": "20%"
    },
    "breakfast": {
        "name": "Break*fast Series",
        "lessons": [],  # Will be populated as audio becomes available
        "single_price": 2.49,
        "bundle_price": None,  # TBD when all lessons available
        "bundle_savings": None
    }
}

# Pydantic models
class AudioCodeGenerate(BaseModel):
    order_id: str
    series_id: str
    customer_email: str
    is_physical_purchase: bool = True

class AudioCodeRedeem(BaseModel):
    code: str
    email: str

class AudioCodeResponse(BaseModel):
    code: str
    series_id: str
    series_name: str
    lessons_included: List[str]
    expires_at: Optional[str] = None


def generate_audio_code(prefix: str = "SF") -> str:
    """Generate a unique audio access code like SF-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    return f"{prefix}-{part1}-{part2}"


@router.post("/codes/generate")
async def generate_access_code(data: AudioCodeGenerate):
    """Generate an audio access code for a physical book purchase"""
    
    if data.series_id not in AUDIO_CONTENT:
        raise HTTPException(status_code=400, detail=f"Unknown series: {data.series_id}")
    
    series_info = AUDIO_CONTENT[data.series_id]
    
    # Generate unique code
    code = generate_audio_code()
    
    # Check for uniqueness
    existing = await db.audio_codes.find_one({"code": code})
    while existing:
        code = generate_audio_code()
        existing = await db.audio_codes.find_one({"code": code})
    
    # Create the code record
    code_record = {
        "code": code,
        "series_id": data.series_id,
        "series_name": series_info["name"],
        "order_id": data.order_id,
        "customer_email": data.customer_email.lower(),
        "is_physical_purchase": data.is_physical_purchase,
        "lessons_included": [l["id"] for l in series_info["lessons"]],
        "redeemed": False,
        "redeemed_at": None,
        "redeemed_by_email": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": None  # Physical purchase codes don't expire
    }
    
    await db.audio_codes.insert_one(code_record)
    
    return {
        "code": code,
        "series_id": data.series_id,
        "series_name": series_info["name"],
        "lessons_included": code_record["lessons_included"],
        "message": f"Audio access code generated for {series_info['name']}"
    }


@router.post("/codes/redeem")
async def redeem_access_code(data: AudioCodeRedeem):
    """Redeem an audio access code"""
    
    code_record = await db.audio_codes.find_one({"code": data.code.upper()})
    
    if not code_record:
        raise HTTPException(status_code=404, detail="Invalid audio access code")
    
    if code_record.get("redeemed"):
        # Allow same email to re-access
        if code_record.get("redeemed_by_email", "").lower() == data.email.lower():
            return {
                "success": True,
                "message": "Welcome back! Your audio access is still active.",
                "series_id": code_record["series_id"],
                "series_name": code_record["series_name"],
                "lessons_included": code_record["lessons_included"],
                "already_redeemed": True
            }
        raise HTTPException(status_code=400, detail="This code has already been redeemed by another email")
    
    # Check expiration
    if code_record.get("expires_at"):
        expires = datetime.fromisoformat(code_record["expires_at"])
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="This code has expired")
    
    # Redeem the code
    await db.audio_codes.update_one(
        {"code": data.code.upper()},
        {
            "$set": {
                "redeemed": True,
                "redeemed_at": datetime.now(timezone.utc).isoformat(),
                "redeemed_by_email": data.email.lower()
            }
        }
    )
    
    # Add audio access to user's account (or create guest record)
    await db.audio_access.update_one(
        {"email": data.email.lower()},
        {
            "$addToSet": {
                "series_access": code_record["series_id"],
                "lessons_access": {"$each": code_record["lessons_included"]}
            },
            "$set": {
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$setOnInsert": {
                "email": data.email.lower(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {
        "success": True,
        "message": f"🎉 Audio access unlocked for {code_record['series_name']}!",
        "series_id": code_record["series_id"],
        "series_name": code_record["series_name"],
        "lessons_included": code_record["lessons_included"]
    }


@router.get("/access/{email}")
async def check_audio_access(email: str):
    """Check what audio content a user has access to"""
    
    access_record = await db.audio_access.find_one(
        {"email": email.lower()},
        {"_id": 0}
    )
    
    if not access_record:
        return {
            "has_access": False,
            "series_access": [],
            "lessons_access": []
        }
    
    return {
        "has_access": True,
        "series_access": access_record.get("series_access", []),
        "lessons_access": access_record.get("lessons_access", []),
        "audio_content": {
            series_id: AUDIO_CONTENT.get(series_id, {})
            for series_id in access_record.get("series_access", [])
        }
    }


@router.get("/content/{series_id}")
async def get_audio_content(series_id: str):
    """Get audio content info for a series"""
    
    if series_id not in AUDIO_CONTENT:
        raise HTTPException(status_code=404, detail=f"Unknown series: {series_id}")
    
    return AUDIO_CONTENT[series_id]


@router.get("/pricing")
async def get_audio_pricing():
    """Get current audio pricing"""
    
    return {
        "single_lesson_price": 2.49,
        "holiday_bundle": {
            "price": 7.99,
            "lessons": 4,
            "savings": "20%",
            "per_lesson": 2.00
        },
        "physical_book_bonus": "Audio access code included with physical book purchases",
        "ie_bonus": "Instructor Edition includes all audio at no extra cost"
    }
