"""
Instructor Routes - Gated content for instructors
=================================================
- Answer Keys
- Facilitation Notes
- Group Roster Management
- Teaching Resources
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from jose import JWTError, jwt
import os
import secrets

router = APIRouter(prefix="/api/instructor", tags=["instructor"])

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ['DB_NAME']]

# JWT Settings - Must match auth_routes.py and admin_routes.py
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "soul-food-secret-key-change-in-production-2024")
ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

# Roles with instructor access
INSTRUCTOR_ROLES = ["instructor", "instructor_tester", "admin", "owner", "beta_tester"]

# =============================================================================
# Models
# =============================================================================

class InstructorUser(BaseModel):
    id: str
    email: str
    name: str
    role: str
    access_level: Optional[str] = None

class RosterMember(BaseModel):
    name: str
    email: Optional[str] = None
    notes: Optional[str] = None

class RosterMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    progress: Optional[int] = None

# =============================================================================
# Auth Helper
# =============================================================================

async def get_current_instructor(
    authorization: HTTPAuthorizationCredentials = Depends(security)
) -> InstructorUser:
    """Verify JWT and ensure user has instructor access"""
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = authorization.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub") or payload.get("user_id")
        role = payload.get("role", "")
        access_level = payload.get("access_level", "")
        
        # Check if user has instructor access
        has_access = (
            role in INSTRUCTOR_ROLES or 
            access_level in ["instructor", "admin"]
        )
        
        if not has_access:
            raise HTTPException(
                status_code=403, 
                detail="Instructor access required"
            )
        
        return InstructorUser(
            id=user_id or "instructor",
            email=payload.get("email", f"{role}@soulfood.com"),
            name=payload.get("name", "Instructor"),
            role=role,
            access_level=access_level
        )
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================================
# Answer Keys
# =============================================================================

@router.get("/answer-keys")
async def get_answer_keys(
    series: Optional[str] = None,
    lesson_id: Optional[str] = None,
    instructor: InstructorUser = Depends(get_current_instructor)
):
    """Get answer keys for lessons"""
    
    # Build query
    query = {"type": "answer_key"}
    if series:
        query["series"] = series
    if lesson_id:
        query["lesson_id"] = lesson_id
    
    # Fetch from database
    items = await db.instructor_content.find(query, {"_id": 0}).to_list(100)
    
    # If no items in DB, return sample data for demo
    if not items:
        items = [
            {"id": "ak-bkft-m1-l1", "lesson_id": "bkft-m1-l1", "series": "Breakfast", "module": "Month 1", "title": "Hannah - Prayer", "available": True},
            {"id": "ak-bkft-m1-l2", "lesson_id": "bkft-m1-l2", "series": "Breakfast", "module": "Month 1", "title": "Solomon - Wisdom", "available": True},
            {"id": "ak-bkft-m1-l3", "lesson_id": "bkft-m1-l3", "series": "Breakfast", "module": "Month 1", "title": "Centurion - Authority", "available": True},
            {"id": "ak-bkft-m1-l4", "lesson_id": "bkft-m1-l4", "series": "Breakfast", "module": "Month 1", "title": "Chronic Woman - Persistence", "available": True},
            {"id": "ak-hol-l1", "lesson_id": "hol-l1", "series": "Holiday", "module": "4Cs", "title": "Covenant - Abraham", "available": True},
            {"id": "ak-hol-l2", "lesson_id": "hol-l2", "series": "Holiday", "module": "4Cs", "title": "Cradle - Nativity", "available": True},
            {"id": "ak-hol-l3", "lesson_id": "hol-l3", "series": "Holiday", "module": "4Cs", "title": "Cross - Redemption", "available": True},
            {"id": "ak-hol-l4", "lesson_id": "hol-l4", "series": "Holiday", "module": "4Cs", "title": "Comforter - Holy Spirit", "available": True}
        ]
    
    return {"items": items, "count": len(items)}

@router.get("/answer-keys/{key_id}")
async def get_answer_key_detail(
    key_id: str,
    instructor: InstructorUser = Depends(get_current_instructor)
):
    """Get detailed answer key content"""
    
    item = await db.instructor_content.find_one(
        {"id": key_id, "type": "answer_key"},
        {"_id": 0}
    )
    
    if not item:
        # Return sample data for demo
        return {
            "id": key_id,
            "title": "Sample Answer Key",
            "content": {
                "questions": [
                    {"q": "What is the main theme of this lesson?", "a": "Sample answer"},
                    {"q": "How does this apply to daily life?", "a": "Sample application"}
                ]
            },
            "notes": "Teaching note: Encourage discussion around personal experiences."
        }
    
    return item

# =============================================================================
# Facilitation Notes
# =============================================================================

@router.get("/facilitation-notes")
async def get_facilitation_notes(
    type: Optional[str] = None,
    instructor: InstructorUser = Depends(get_current_instructor)
):
    """Get facilitation notes and teaching guides"""
    
    query = {"type": "facilitation_note"}
    if type:
        query["note_type"] = type
    
    items = await db.instructor_content.find(query, {"_id": 0}).to_list(100)
    
    # If no items in DB, return sample data
    if not items:
        items = [
            {"id": "fn-opening", "title": "Opening Your Session", "note_type": "general", "description": "Ice breakers and prayer starters"},
            {"id": "fn-discussion", "title": "Leading Discussions", "note_type": "general", "description": "Encouraging participation without lectures"},
            {"id": "fn-activities", "title": "Group Activities Guide", "note_type": "general", "description": "Interactive exercises for each lesson"},
            {"id": "fn-prayer", "title": "Prayer Module Tips", "note_type": "breakfast-m1", "description": "Month 1 - Prayer theme teaching notes"},
            {"id": "fn-through", "title": "Through Module Tips", "note_type": "breakfast-m2", "description": "Month 2 - Perseverance theme notes"},
            {"id": "fn-closing", "title": "Closing Strong", "note_type": "general", "description": "Recap and takeaway assignments"}
        ]
    
    return {"items": items, "count": len(items)}

@router.get("/facilitation-notes/{note_id}")
async def get_facilitation_note_detail(
    note_id: str,
    instructor: InstructorUser = Depends(get_current_instructor)
):
    """Get detailed facilitation note"""
    
    item = await db.instructor_content.find_one(
        {"id": note_id, "type": "facilitation_note"},
        {"_id": 0}
    )
    
    if not item:
        return {
            "id": note_id,
            "title": "Teaching Guide",
            "content": "Sample facilitation content...",
            "tips": ["Tip 1: Engage all participants", "Tip 2: Use open-ended questions"]
        }
    
    return item

# =============================================================================
# Group Roster
# =============================================================================

@router.get("/roster")
async def get_roster(
    instructor: InstructorUser = Depends(get_current_instructor)
):
    """Get instructor's group roster"""
    
    # Fetch roster for this instructor
    roster_doc = await db.instructor_rosters.find_one(
        {"instructor_id": instructor.id},
        {"_id": 0}
    )
    
    if not roster_doc:
        return {"members": [], "count": 0}
    
    return {
        "members": roster_doc.get("members", []),
        "count": len(roster_doc.get("members", [])),
        "group_name": roster_doc.get("group_name", "My Study Group")
    }

@router.post("/roster/member")
async def add_roster_member(
    member: RosterMember,
    instructor: InstructorUser = Depends(get_current_instructor)
):
    """Add a member to the instructor's roster"""
    
    member_id = secrets.token_hex(8)
    now = datetime.now(timezone.utc)
    
    new_member = {
        "id": member_id,
        "name": member.name,
        "email": member.email,
        "notes": member.notes,
        "progress": 0,
        "added_at": now.isoformat()
    }
    
    # Update or create roster document
    result = await db.instructor_rosters.update_one(
        {"instructor_id": instructor.id},
        {
            "$push": {"members": new_member},
            "$setOnInsert": {
                "instructor_id": instructor.id,
                "created_at": now.isoformat()
            },
            "$set": {"updated_at": now.isoformat()}
        },
        upsert=True
    )
    
    return {"id": member_id, "message": "Member added successfully"}

@router.put("/roster/member/{member_id}")
async def update_roster_member(
    member_id: str,
    update: RosterMemberUpdate,
    instructor: InstructorUser = Depends(get_current_instructor)
):
    """Update a roster member's information"""
    
    update_fields = {}
    if update.name is not None:
        update_fields["members.$.name"] = update.name
    if update.email is not None:
        update_fields["members.$.email"] = update.email
    if update.notes is not None:
        update_fields["members.$.notes"] = update.notes
    if update.progress is not None:
        update_fields["members.$.progress"] = update.progress
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No update fields provided")
    
    result = await db.instructor_rosters.update_one(
        {"instructor_id": instructor.id, "members.id": member_id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member updated successfully"}

@router.delete("/roster/member/{member_id}")
async def remove_roster_member(
    member_id: str,
    instructor: InstructorUser = Depends(get_current_instructor)
):
    """Remove a member from the roster"""
    
    result = await db.instructor_rosters.update_one(
        {"instructor_id": instructor.id},
        {"$pull": {"members": {"id": member_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member removed successfully"}

# =============================================================================
# Teaching Resources
# =============================================================================

@router.get("/resources")
async def get_teaching_resources(
    category: Optional[str] = None,
    instructor: InstructorUser = Depends(get_current_instructor)
):
    """Get downloadable teaching resources"""
    
    query = {"type": "resource"}
    if category:
        query["category"] = category
    
    items = await db.instructor_content.find(query, {"_id": 0}).to_list(100)
    
    # Return sample data if empty
    if not items:
        items = [
            {"id": "res-slides", "title": "Lesson Slides Template", "category": "presentation", "format": "pptx"},
            {"id": "res-attendance", "title": "Attendance Sheet", "category": "printable", "format": "pdf"},
            {"id": "res-prayer", "title": "Prayer Request Cards", "category": "printable", "format": "pdf"},
            {"id": "res-discussion", "title": "Discussion Question Cards", "category": "printable", "format": "pdf"},
            {"id": "res-memory", "title": "Scripture Memory Verses", "category": "printable", "format": "pdf"},
            {"id": "res-handouts", "title": "Group Activity Handouts", "category": "printable", "format": "pdf"}
        ]
    
    return {"items": items, "count": len(items)}
