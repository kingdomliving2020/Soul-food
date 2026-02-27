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
    customer_phone: Optional[str] = None
    edition: Optional[str] = "adult"  # adult, youth, instructor
    lesson_number: Optional[int] = 0  # 0 = full bundle, 1-12 = specific lesson
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


# Series code mapping
SERIES_CODES = {
    "breakfast": "B",
    "lunch": "L", 
    "dinner": "D",
    "supper": "S",
    "holiday": "H"
}

# Edition code mapping
EDITION_CODES = {
    "adult": "1",
    "youth": "2",
    "instructor": "3",
    "ae": "1",
    "ye": "2",
    "ie": "3"
}


def generate_audio_code(
    series_id: str,
    edition: str = "adult",
    lesson_number: int = 0,
    phone: str = None
) -> str:
    """
    Generate a trackable audio access code
    Format: YMMDD-PHONE5-ELV
    - Y = last digit of year
    - MM = 2-digit month  
    - DD = 2-digit day
    - PHONE5 = last 5 digits of phone (or random if not provided)
    - E = Series code (B/L/D/S/H)
    - L = Lesson number (00-12, 00 = full bundle)
    - V = Version/Edition (1=Adult, 2=Youth, 3=Instructor)
    
    Example: 60227-12345-H011 = Feb 27 2026, phone 12345, Holiday, Lesson 01, Adult
    """
    now = datetime.now(timezone.utc)
    
    # Date part: YMMDD
    year_digit = str(now.year)[-1]  # Last digit of year
    date_part = f"{year_digit}{now.month:02d}{now.day:02d}"
    
    # Phone part: last 5 digits or random
    if phone and len(phone) >= 5:
        # Extract digits only
        digits = ''.join(c for c in phone if c.isdigit())
        phone_part = digits[-5:] if len(digits) >= 5 else digits.zfill(5)
    else:
        # Generate random 5 digits
        phone_part = ''.join(secrets.choice(string.digits) for _ in range(5))
    
    # Series code
    series_code = SERIES_CODES.get(series_id.lower(), "X")
    
    # Lesson number (00 = full bundle)
    lesson_part = f"{lesson_number:02d}"
    
    # Edition code
    edition_code = EDITION_CODES.get(edition.lower(), "1")
    
    # Combine: YMMDD-PHONE5-ELV
    code = f"{date_part}-{phone_part}-{series_code}{lesson_part}{edition_code}"
    
    return code


@router.post("/codes/generate")
async def generate_access_code(data: AudioCodeGenerate):
    """Generate an audio access code for a physical book purchase"""
    
    if data.series_id not in AUDIO_CONTENT:
        raise HTTPException(status_code=400, detail=f"Unknown series: {data.series_id}")
    
    series_info = AUDIO_CONTENT[data.series_id]
    
    # Generate trackable code with new format
    code = generate_audio_code(
        series_id=data.series_id,
        edition=data.edition or "adult",
        lesson_number=data.lesson_number or 0,
        phone=data.customer_phone
    )
    
    # Check for uniqueness (very unlikely with this format, but be safe)
    existing = await db.audio_codes.find_one({"code": code})
    attempt = 0
    while existing and attempt < 10:
        # Add random suffix if collision
        code = code + secrets.choice(string.ascii_uppercase)
        existing = await db.audio_codes.find_one({"code": code})
        attempt += 1
    
    # Parse code for tracking info
    code_parts = code.split("-")
    date_part = code_parts[0] if len(code_parts) > 0 else ""
    phone_part = code_parts[1] if len(code_parts) > 1 else ""
    product_part = code_parts[2] if len(code_parts) > 2 else ""
    
    # Create the code record with tracking metadata
    code_record = {
        "code": code,
        "series_id": data.series_id,
        "series_name": series_info["name"],
        "order_id": data.order_id,
        "customer_email": data.customer_email.lower(),
        "customer_phone_last5": phone_part,
        "edition": data.edition or "adult",
        "lesson_number": data.lesson_number or 0,
        "is_physical_purchase": data.is_physical_purchase,
        "lessons_included": [l["id"] for l in series_info["lessons"]],
        "redeemed": False,
        "redeemed_at": None,
        "redeemed_by_email": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": None,  # Physical purchase codes don't expire
        # Tracking metadata
        "code_date": date_part,
        "code_product": product_part
    }
    
    await db.audio_codes.insert_one(code_record)
    
    return {
        "code": code,
        "series_id": data.series_id,
        "series_name": series_info["name"],
        "edition": data.edition or "adult",
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



# Reverse mappings for code parsing
SERIES_NAMES = {v: k for k, v in SERIES_CODES.items()}
EDITION_NAMES = {"1": "adult", "2": "youth", "3": "instructor"}


@router.get("/codes/decode/{code}")
async def decode_audio_code(code: str):
    """
    Decode an audio code to see its embedded information
    Useful for admin tracking and customer service
    
    Code format: YMMDD-PHONE5-ELV
    """
    code = code.upper().strip()
    parts = code.split("-")
    
    if len(parts) != 3:
        raise HTTPException(status_code=400, detail="Invalid code format. Expected: YMMDD-PHONE5-ELV")
    
    date_part, phone_part, product_part = parts
    
    # Parse date
    try:
        year_digit = date_part[0]
        month = int(date_part[1:3])
        day = int(date_part[3:5])
        # Assume 2020s decade
        year = 2020 + int(year_digit)
        created_date = f"{year}-{month:02d}-{day:02d}"
    except (ValueError, IndexError):
        created_date = "Unknown"
    
    # Parse product info
    try:
        series_code = product_part[0]
        lesson_num = int(product_part[1:3])
        edition_code = product_part[3] if len(product_part) > 3 else "1"
    except (ValueError, IndexError):
        series_code = "?"
        lesson_num = 0
        edition_code = "1"
    
    series_name = SERIES_NAMES.get(series_code, "Unknown")
    edition_name = EDITION_NAMES.get(edition_code, "adult")
    
    # Look up code in database
    code_record = await db.audio_codes.find_one({"code": code}, {"_id": 0})
    
    return {
        "code": code,
        "decoded": {
            "created_date": created_date,
            "phone_last5": phone_part,
            "series": series_name,
            "series_code": series_code,
            "lesson_number": lesson_num,
            "lesson_type": "Full Bundle" if lesson_num == 0 else f"Lesson {lesson_num}",
            "edition": edition_name,
            "edition_code": edition_code
        },
        "database_record": code_record,
        "is_valid": code_record is not None,
        "is_redeemed": code_record.get("redeemed", False) if code_record else None
    }


@router.get("/codes/search")
async def search_audio_codes(
    phone: str = None,
    email: str = None,
    series: str = None,
    redeemed: bool = None
):
    """Search audio codes with filters for admin tracking"""
    
    query = {}
    
    if phone:
        # Search by last 5 digits of phone
        digits = ''.join(c for c in phone if c.isdigit())
        phone_search = digits[-5:] if len(digits) >= 5 else digits
        query["customer_phone_last5"] = phone_search
    
    if email:
        query["$or"] = [
            {"customer_email": email.lower()},
            {"redeemed_by_email": email.lower()}
        ]
    
    if series:
        query["series_id"] = series.lower()
    
    if redeemed is not None:
        query["redeemed"] = redeemed
    
    codes = await db.audio_codes.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    
    return {
        "count": len(codes),
        "codes": codes
    }
