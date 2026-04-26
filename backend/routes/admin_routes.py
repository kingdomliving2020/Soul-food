"""
Soul Food Admin Console Routes
==============================
Protected admin-only routes for the DevOps back office.

Modules:
- Content Manager: Create/edit lessons with workflow states
- Instructor Content: Answer keys, facilitation notes
- Media Library: PDFs, images, thumbnails
- Products + Inventory: SKUs, pricing, stock
- Orders: View purchases, resend download links
- Users + Roles: User management, role assignment
- Logs: Audit trail
"""

from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets
import hashlib
import json
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'soul_food_db')]

# =============================================================================
# ROLE DEFINITIONS
# =============================================================================

ROLES = {
    "admin": {
        "name": "Admin/Owner",
        "level": 100,
        "permissions": ["*"],  # Full access
        "description": "Full administrative access to all features"
    },
    "instructor": {
        "name": "Instructor",
        "level": 50,
        "permissions": [
            "view_lessons", "view_instructor_content", "view_answer_keys",
            "view_facilitation_notes", "view_roster", "manage_own_roster"
        ],
        "description": "Access to instructor tools and content"
    },
    "student": {
        "name": "Student/Youth",
        "level": 10,
        "permissions": ["view_lessons", "submit_activities"],
        "description": "Access to student lessons and activities"
    },
    "adult": {
        "name": "Adult Reader",
        "level": 10,
        "permissions": ["view_lessons", "view_adult_content"],
        "description": "Access to adult edition content"
    }
}

# =============================================================================
# CONTENT STATES
# =============================================================================

CONTENT_STATES = {
    "draft": {"name": "Draft", "color": "gray", "icon": "📝"},
    "scheduled": {"name": "Scheduled", "color": "blue", "icon": "📅"},
    "published": {"name": "Published", "color": "green", "icon": "✅"},
    "archived": {"name": "Archived", "color": "red", "icon": "📦"}
}

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class AdminUser(BaseModel):
    id: str
    email: str
    role: str
    permissions: List[str] = []

class ContentItem(BaseModel):
    id: Optional[str] = None
    title: str
    type: str  # "lesson", "page", "announcement"
    status: str = "draft"  # draft, scheduled, published, archived
    content: Dict[str, Any] = {}
    series: Optional[str] = None
    lesson_number: Optional[int] = None
    edition: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    version: int = 1
    version_history: List[Dict] = []

class ProductItem(BaseModel):
    id: Optional[str] = None
    sku: str
    name: str
    description: str = ""
    price: float
    compare_price: Optional[float] = None
    type: str  # "digital", "physical", "subscription"
    status: str = "active"  # active, inactive, sold_out
    inventory_count: Optional[int] = None
    low_stock_threshold: int = 10
    series: Optional[str] = None
    edition: Optional[str] = None
    files: List[str] = []
    metadata: Dict[str, Any] = {}

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str = "adult"
    password: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    disabled: Optional[bool] = None

class InstructorContent(BaseModel):
    id: Optional[str] = None
    lesson_id: str
    type: str  # "answer_key", "facilitation_notes", "faith_nuggets"
    content: Dict[str, Any]
    created_by: Optional[str] = None

class MediaItem(BaseModel):
    id: Optional[str] = None
    filename: str
    original_filename: str
    file_type: str  # "pdf", "image", "video"
    file_size: int
    file_path: str
    series: Optional[str] = None
    quarter: Optional[str] = None
    month: Optional[str] = None
    lesson: Optional[str] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}

# =============================================================================
# AUTHENTICATION & AUTHORIZATION HELPERS
# =============================================================================

from jose import JWTError, jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "soul-food-secret-key-change-in-production-2024")
ALGORITHM = "HS256"

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT and ensure user has admin role"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role", "")
        access_level: str = payload.get("access_level", "")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
            
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Check if user is admin
    # Accept both 'admin' role and 'instructor_tester' for development
    admin_roles = ["admin", "owner", "instructor_tester", "beta_tester"]
    if role not in admin_roles and access_level not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get user from database
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    # For beta testers, create a mock admin user
    if not user:
        user = {
            "id": user_id,
            "email": f"{role}@beta.soulfood.com",
            "name": f"Beta Admin ({role})",
            "role": role,
            "access_level": access_level
        }
    
    return AdminUser(
        id=user.get("id", user_id),
        email=user.get("email", ""),
        role=user.get("role", role),
        permissions=ROLES.get(role, {}).get("permissions", [])
    )

async def log_admin_action(
    action: str,
    admin_id: str,
    resource_type: str,
    resource_id: str = None,
    details: Dict = None
):
    """Log admin actions for audit trail"""
    log_entry = {
        "id": secrets.token_hex(16),
        "action": action,
        "admin_id": admin_id,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc),
        "ip_address": None  # Will be populated from request
    }
    await db.admin_audit_logs.insert_one(log_entry)
    print(f"[ADMIN AUDIT] {action} | Resource: {resource_type}/{resource_id} | By: {admin_id}")

# =============================================================================
# DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def get_admin_dashboard(admin: AdminUser = Depends(get_current_admin)):
    """Get admin dashboard summary"""

    # Counts (orders + revenue come from payment_transactions — the actual Stripe source of truth)
    total_users = await db.users.count_documents({})
    total_lessons = await db.lessons.count_documents({})
    total_orders = await db.payment_transactions.count_documents({})
    total_products = await db.products.count_documents({})

    # Recent activity (last 5 paid orders, normalized to the shape the frontend expects)
    recent_txns = await db.payment_transactions.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    recent_orders = []
    for tx in recent_txns:
        created = tx.get("created_at")
        recent_orders.append({
            "order_number": tx.get("order_number", ""),
            "customer_email": tx.get("customer_email", ""),
            "customer_name": tx.get("customer_name", ""),
            "total": tx.get("total_amount", 0),
            "total_amount": tx.get("total_amount", 0),
            "status": tx.get("payment_status", ""),
            "payment_status": tx.get("payment_status", ""),
            "items_count": len(tx.get("items", [])),
            "created_at": created.isoformat() if hasattr(created, "isoformat") else str(created or ""),
        })
    recent_users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(5).to_list(5)

    # Content stats
    published_lessons = await db.lessons.count_documents({"status": "published"})
    draft_lessons = await db.lessons.count_documents({"status": "draft"})

    # Revenue: sum total_amount on PAID payment_transactions only
    revenue_cursor = db.payment_transactions.find(
        {"payment_status": "paid"},
        {"_id": 0, "total_amount": 1},
    )
    total_revenue = 0.0
    async for tx in revenue_cursor:
        try:
            total_revenue += float(tx.get("total_amount", 0) or 0)
        except (TypeError, ValueError):
            continue

    return {
        "summary": {
            "total_users": total_users,
            "total_lessons": total_lessons,
            "total_orders": total_orders,
            "total_products": total_products,
            "total_revenue": round(total_revenue, 2),
            "published_lessons": published_lessons,
            "draft_lessons": draft_lessons
        },
        "recent_orders": recent_orders,
        "recent_users": recent_users,
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "role": admin.role
        }
    }

# =============================================================================
# CONTENT MANAGEMENT
# =============================================================================

@router.get("/content")
async def get_content_list(
    type: Optional[str] = None,
    status: Optional[str] = None,
    series: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    admin: AdminUser = Depends(get_current_admin)
):
    """Get list of content items with filters"""
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    if series:
        query["series"] = series
    
    skip = (page - 1) * limit
    
    # Get content from lessons collection
    content = await db.lessons.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.lessons.count_documents(query)
    
    return {
        "items": content,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@router.get("/content/{content_id}")
async def get_content_item(content_id: str, admin: AdminUser = Depends(get_current_admin)):
    """Get a single content item with version history"""
    content = await db.lessons.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Get version history
    versions = await db.content_versions.find(
        {"content_id": content_id}, {"_id": 0}
    ).sort("version", -1).to_list(50)
    
    content["version_history"] = versions
    return content

@router.post("/content")
async def create_content(
    item: ContentItem,
    admin: AdminUser = Depends(get_current_admin)
):
    """Create new content item"""
    content_id = secrets.token_hex(12)
    now = datetime.now(timezone.utc)
    
    content_doc = {
        "id": content_id,
        "title": item.title,
        "type": item.type,
        "status": item.status,
        "content": item.content,
        "series": item.series,
        "lesson_number": item.lesson_number,
        "edition": item.edition,
        "scheduled_at": item.scheduled_at.isoformat() if item.scheduled_at else None,
        "published_at": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "created_by": admin.id,
        "updated_by": admin.id,
        "version": 1
    }
    
    await db.lessons.insert_one(content_doc)
    
    # Create initial version
    await db.content_versions.insert_one({
        "id": secrets.token_hex(8),
        "content_id": content_id,
        "version": 1,
        "content": item.content,
        "created_at": now.isoformat(),
        "created_by": admin.id,
        "change_summary": "Initial creation"
    })
    
    await log_admin_action("create_content", admin.id, "content", content_id, {"title": item.title})
    
    return {"id": content_id, "message": "Content created successfully"}

@router.put("/content/{content_id}")
async def update_content(
    content_id: str,
    item: ContentItem,
    admin: AdminUser = Depends(get_current_admin)
):
    """Update content item and create new version"""
    existing = await db.lessons.find_one({"id": content_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Content not found")
    
    now = datetime.now(timezone.utc)
    new_version = existing.get("version", 1) + 1
    
    # Save current version to history
    await db.content_versions.insert_one({
        "id": secrets.token_hex(8),
        "content_id": content_id,
        "version": new_version,
        "content": item.content,
        "previous_content": existing.get("content"),
        "created_at": now.isoformat(),
        "created_by": admin.id,
        "change_summary": f"Update by {admin.email}"
    })
    
    # Update content
    update_doc = {
        "title": item.title,
        "type": item.type,
        "status": item.status,
        "content": item.content,
        "series": item.series,
        "lesson_number": item.lesson_number,
        "edition": item.edition,
        "scheduled_at": item.scheduled_at.isoformat() if item.scheduled_at else None,
        "updated_at": now.isoformat(),
        "updated_by": admin.id,
        "version": new_version
    }
    
    if item.status == "published" and existing.get("status") != "published":
        update_doc["published_at"] = now.isoformat()
    
    await db.lessons.update_one({"id": content_id}, {"$set": update_doc})
    
    await log_admin_action("update_content", admin.id, "content", content_id, {"version": new_version})
    
    return {"message": "Content updated successfully", "version": new_version}

@router.post("/content/{content_id}/rollback/{version}")
async def rollback_content(
    content_id: str,
    version: int,
    admin: AdminUser = Depends(get_current_admin)
):
    """Rollback content to a specific version"""
    # Get the version to restore
    version_doc = await db.content_versions.find_one(
        {"content_id": content_id, "version": version}, {"_id": 0}
    )
    if not version_doc:
        raise HTTPException(status_code=404, detail="Version not found")
    
    existing = await db.lessons.find_one({"id": content_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Content not found")
    
    now = datetime.now(timezone.utc)
    new_version = existing.get("version", 1) + 1
    
    # Create rollback version entry
    await db.content_versions.insert_one({
        "id": secrets.token_hex(8),
        "content_id": content_id,
        "version": new_version,
        "content": version_doc.get("content"),
        "previous_content": existing.get("content"),
        "created_at": now.isoformat(),
        "created_by": admin.id,
        "change_summary": f"Rollback to version {version}",
        "is_rollback": True,
        "rollback_from_version": version
    })
    
    # Update content with rolled back version
    await db.lessons.update_one(
        {"id": content_id},
        {"$set": {
            "content": version_doc.get("content"),
            "updated_at": now.isoformat(),
            "updated_by": admin.id,
            "version": new_version
        }}
    )
    
    await log_admin_action("rollback_content", admin.id, "content", content_id, 
                          {"to_version": version, "new_version": new_version})
    
    return {"message": f"Content rolled back to version {version}", "new_version": new_version}

@router.patch("/content/{content_id}/status")
async def update_content_status(
    content_id: str,
    status: str,
    scheduled_at: Optional[datetime] = None,
    admin: AdminUser = Depends(get_current_admin)
):
    """Update content status (draft, scheduled, published, archived)"""
    if status not in CONTENT_STATES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {list(CONTENT_STATES.keys())}")
    
    existing = await db.lessons.find_one({"id": content_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Content not found")
    
    now = datetime.now(timezone.utc)
    update_doc = {
        "status": status,
        "updated_at": now.isoformat(),
        "updated_by": admin.id
    }
    
    if status == "published":
        update_doc["published_at"] = now.isoformat()
    elif status == "scheduled" and scheduled_at:
        update_doc["scheduled_at"] = scheduled_at.isoformat()
    
    await db.lessons.update_one({"id": content_id}, {"$set": update_doc})
    
    await log_admin_action("update_content_status", admin.id, "content", content_id, 
                          {"old_status": existing.get("status"), "new_status": status})
    
    return {"message": f"Content status updated to {status}"}

# =============================================================================
# INSTRUCTOR CONTENT MANAGEMENT
# =============================================================================

@router.get("/instructor-content")
async def get_instructor_content_list(
    lesson_id: Optional[str] = None,
    type: Optional[str] = None,
    admin: AdminUser = Depends(get_current_admin)
):
    """Get instructor-only content (answer keys, notes, etc.)"""
    query = {}
    if lesson_id:
        query["lesson_id"] = lesson_id
    if type:
        query["type"] = type
    
    items = await db.instructor_content.find(query, {"_id": 0}).to_list(1000)
    return {"items": items}

@router.post("/instructor-content")
async def create_instructor_content(
    item: InstructorContent,
    admin: AdminUser = Depends(get_current_admin)
):
    """Create instructor-only content for a lesson"""
    content_id = secrets.token_hex(12)
    now = datetime.now(timezone.utc)
    
    doc = {
        "id": content_id,
        "lesson_id": item.lesson_id,
        "type": item.type,
        "content": item.content,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "created_by": admin.id
    }
    
    await db.instructor_content.insert_one(doc)
    
    await log_admin_action("create_instructor_content", admin.id, "instructor_content", content_id,
                          {"lesson_id": item.lesson_id, "type": item.type})
    
    return {"id": content_id, "message": "Instructor content created successfully"}

@router.put("/instructor-content/{content_id}")
async def update_instructor_content(
    content_id: str,
    item: InstructorContent,
    admin: AdminUser = Depends(get_current_admin)
):
    """Update instructor-only content"""
    existing = await db.instructor_content.find_one({"id": content_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Content not found")
    
    now = datetime.now(timezone.utc)
    
    await db.instructor_content.update_one(
        {"id": content_id},
        {"$set": {
            "content": item.content,
            "updated_at": now.isoformat(),
            "updated_by": admin.id
        }}
    )
    
    await log_admin_action("update_instructor_content", admin.id, "instructor_content", content_id)
    
    return {"message": "Instructor content updated successfully"}

@router.delete("/instructor-content/{content_id}")
async def delete_instructor_content(
    content_id: str,
    admin: AdminUser = Depends(get_current_admin)
):
    """Delete instructor-only content"""
    result = await db.instructor_content.delete_one({"id": content_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    
    await log_admin_action("delete_instructor_content", admin.id, "instructor_content", content_id)
    
    return {"message": "Instructor content deleted successfully"}

# =============================================================================
# MEDIA LIBRARY
# =============================================================================

@router.get("/media")
async def get_media_list(
    file_type: Optional[str] = None,
    series: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: AdminUser = Depends(get_current_admin)
):
    """Get media library items"""
    query = {}
    if file_type:
        query["file_type"] = file_type
    if series:
        query["series"] = series
    
    skip = (page - 1) * limit
    
    items = await db.media.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.media.count_documents(query)
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@router.post("/media/upload")
async def upload_media(
    file: UploadFile = File(...),
    series: Optional[str] = Form(None),
    quarter: Optional[str] = Form(None),
    month: Optional[str] = Form(None),
    lesson: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    admin: AdminUser = Depends(get_current_admin)
):
    """Upload a media file"""
    # Determine file type
    content_type = file.content_type or ""
    if "pdf" in content_type:
        file_type = "pdf"
    elif "image" in content_type:
        file_type = "image"
    elif "video" in content_type:
        file_type = "video"
    else:
        file_type = "other"
    
    # Generate unique filename
    unique_filename = f"{secrets.token_hex(8)}_{file.filename}"
    
    # Save file
    upload_dir = "/app/backend/media_uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create media record
    media_id = secrets.token_hex(12)
    now = datetime.now(timezone.utc)
    
    media_doc = {
        "id": media_id,
        "filename": unique_filename,
        "original_filename": file.filename,
        "file_type": file_type,
        "file_size": len(content),
        "file_path": file_path,
        "series": series,
        "quarter": quarter,
        "month": month,
        "lesson": lesson,
        "tags": tags.split(",") if tags else [],
        "created_at": now.isoformat(),
        "uploaded_by": admin.id,
        "metadata": {
            "content_type": content_type
        }
    }
    
    await db.media.insert_one(media_doc)
    
    await log_admin_action("upload_media", admin.id, "media", media_id, 
                          {"filename": file.filename, "size": len(content)})
    
    return {"id": media_id, "filename": unique_filename, "message": "File uploaded successfully"}

@router.delete("/media/{media_id}")
async def delete_media(media_id: str, admin: AdminUser = Depends(get_current_admin)):
    """Delete a media file"""
    media = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Delete physical file
    if os.path.exists(media.get("file_path", "")):
        os.remove(media["file_path"])
    
    # Delete record
    await db.media.delete_one({"id": media_id})
    
    await log_admin_action("delete_media", admin.id, "media", media_id)
    
    return {"message": "Media deleted successfully"}

@router.put("/media/{media_id}/replace")
async def replace_media(
    media_id: str,
    file: UploadFile = File(...),
    admin: AdminUser = Depends(get_current_admin)
):
    """Replace a media file while preserving its ID (for safe updates)"""
    existing = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Backup old file path
    old_file_path = existing.get("file_path")
    
    # Save new file with same filename pattern
    content = await file.read()
    new_filename = f"{secrets.token_hex(8)}_{file.filename}"
    file_path = os.path.join("/app/backend/media_uploads", new_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Update record with version tracking
    now = datetime.now(timezone.utc)
    version_history = existing.get("version_history", [])
    version_history.append({
        "filename": existing.get("filename"),
        "file_path": old_file_path,
        "replaced_at": now.isoformat(),
        "replaced_by": admin.id
    })
    
    await db.media.update_one(
        {"id": media_id},
        {"$set": {
            "filename": new_filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "file_size": len(content),
            "updated_at": now.isoformat(),
            "updated_by": admin.id,
            "version_history": version_history
        }}
    )
    
    # Optionally keep old file for rollback, or delete it
    # For now, we'll keep it
    
    await log_admin_action("replace_media", admin.id, "media", media_id,
                          {"old_filename": existing.get("filename"), "new_filename": new_filename})
    
    return {"message": "Media replaced successfully", "new_filename": new_filename}

# =============================================================================
# PRODUCTS + INVENTORY
# =============================================================================

@router.get("/products")
async def get_products_list(
    status: Optional[str] = None,
    type: Optional[str] = None,
    series: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: AdminUser = Depends(get_current_admin)
):
    """Get products list"""
    query = {}
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    if series:
        query["series"] = series
    
    skip = (page - 1) * limit
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.products.count_documents(query)
    
    # Check for low stock alerts
    low_stock_items = await db.products.count_documents({
        "inventory_count": {"$ne": None, "$lte": 10},
        "status": "active"
    })
    
    return {
        "items": products,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "low_stock_count": low_stock_items
    }

@router.post("/products")
async def create_product(item: ProductItem, admin: AdminUser = Depends(get_current_admin)):
    """Create a new product"""
    # Check if SKU exists
    existing = await db.products.find_one({"sku": item.sku})
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    product_id = secrets.token_hex(12)
    now = datetime.now(timezone.utc)
    
    product_doc = {
        "id": product_id,
        "sku": item.sku,
        "name": item.name,
        "description": item.description,
        "price": item.price,
        "compare_price": item.compare_price,
        "type": item.type,
        "status": item.status,
        "inventory_count": item.inventory_count,
        "low_stock_threshold": item.low_stock_threshold,
        "series": item.series,
        "edition": item.edition,
        "files": item.files,
        "metadata": item.metadata,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "created_by": admin.id
    }
    
    await db.products.insert_one(product_doc)
    
    await log_admin_action("create_product", admin.id, "product", product_id, {"sku": item.sku})
    
    return {"id": product_id, "message": "Product created successfully"}


@router.post("/products/seed-from-catalog")
async def seed_products_from_catalog_endpoint(admin: AdminUser = Depends(get_current_admin)):
    """One-time / idempotent: seed db.products from the canonical PRODUCTS
    catalog defined in payment_routes.py. Upserts by SKU, never deletes,
    and does not touch any other collection. Safe to re-run."""
    from scripts.seed_admin_products import seed_products_from_catalog
    summary = await seed_products_from_catalog(db)
    await log_admin_action(
        "seed_products_from_catalog", admin.id, "products", "catalog", summary
    )
    return {"message": "Catalog seeded into db.products", **summary}

@router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    item: ProductItem,
    admin: AdminUser = Depends(get_current_admin)
):
    """Update a product"""
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    now = datetime.now(timezone.utc)
    
    update_doc = {
        "name": item.name,
        "description": item.description,
        "price": item.price,
        "compare_price": item.compare_price,
        "type": item.type,
        "status": item.status,
        "inventory_count": item.inventory_count,
        "low_stock_threshold": item.low_stock_threshold,
        "series": item.series,
        "edition": item.edition,
        "files": item.files,
        "metadata": item.metadata,
        "updated_at": now.isoformat(),
        "updated_by": admin.id
    }
    
    await db.products.update_one({"id": product_id}, {"$set": update_doc})
    
    await log_admin_action("update_product", admin.id, "product", product_id)
    
    return {"message": "Product updated successfully"}

@router.patch("/products/{product_id}/inventory")
async def update_inventory(
    product_id: str,
    count: int,
    admin: AdminUser = Depends(get_current_admin)
):
    """Update product inventory"""
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    now = datetime.now(timezone.utc)
    old_count = existing.get("inventory_count", 0)
    
    # Determine if status should change
    status = existing.get("status", "active")
    if count <= 0:
        status = "sold_out"
    elif count > 0 and status == "sold_out":
        status = "active"
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {
            "inventory_count": count,
            "status": status,
            "updated_at": now.isoformat(),
            "updated_by": admin.id
        }}
    )
    
    await log_admin_action("update_inventory", admin.id, "product", product_id,
                          {"old_count": old_count, "new_count": count})
    
    return {"message": "Inventory updated", "new_count": count, "status": status}

# =============================================================================
# ORDERS MANAGEMENT
# =============================================================================

@router.get("/orders")
async def get_orders_list(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: AdminUser = Depends(get_current_admin)
):
    """Get orders list from both orders and payment_transactions, with search"""
    skip = (page - 1) * limit

    # Build base query for payment_transactions (the primary source of paid orders)
    tx_query = {}
    if status:
        tx_query["payment_status"] = status

    if search:
        search_re = {"$regex": search.strip(), "$options": "i"}
        tx_query["$or"] = [
            {"order_number": search_re},
            {"customer_email": search_re},
            {"customer_name": search_re},
        ]

    # Query payment_transactions first (most reliable for Stripe orders)
    txns = await db.payment_transactions.find(tx_query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.payment_transactions.count_documents(tx_query)

    items = []
    for tx in txns:
        items.append({
            "order_number": tx.get("order_number", ""),
            "customer_email": tx.get("customer_email", ""),
            "customer_name": tx.get("customer_name", ""),
            "total_amount": tx.get("total_amount", 0),
            "payment_status": tx.get("payment_status", ""),
            "items": tx.get("items", []),
            "items_count": len(tx.get("items", [])),
            "claimed_by_user_id": tx.get("claimed_by_user_id"),
            "created_at": tx.get("created_at").isoformat() if hasattr(tx.get("created_at"), "isoformat") else str(tx.get("created_at", "")),
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/orders/{order_number}/detail")
async def get_order_detail(order_number: str, admin: AdminUser = Depends(get_current_admin)):
    """Get full order detail by order_number (checks both collections)"""
    order_number = order_number.strip().upper()

    transaction = await db.payment_transactions.find_one(
        {"order_number": order_number}, {"_id": 0}
    )
    order = await db.orders.find_one(
        {"$or": [{"order_number": order_number}, {"order_id": order_number}]},
        {"_id": 0},
    )

    if not transaction and not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Download links keyed by order_number
    download_links = await db.download_links.find(
        {"order_id": order_number}, {"_id": 0, "token_hash": 0}
    ).to_list(100)

    # Also check if keyed by session_id
    if not download_links and transaction:
        sid = transaction.get("session_id", "")
        if sid:
            download_links = await db.download_links.find(
                {"order_id": sid}, {"_id": 0, "token_hash": 0}
            ).to_list(100)

    delivery_logs = await db.delivery_logs.find(
        {"order_id": order_number}, {"_id": 0}
    ).sort("timestamp", -1).to_list(50)

    # Build expanded deliverables view (handles bundles, gating, expected delivery)
    src_items = (transaction or {}).get("items", []) or (order or {}).get("items", [])
    try:
        from payment_routes import expand_items_for_receipt
        expanded_items = expand_items_for_receipt(src_items)
    except Exception:
        expanded_items = []

    return {
        "transaction": transaction,
        "order": order,
        "download_links": download_links,
        "delivery_logs": delivery_logs,
        "expanded_items": expanded_items,
    }


@router.post("/orders/{order_number}/resend-email")
async def admin_resend_order_email(order_number: str, admin: AdminUser = Depends(get_current_admin)):
    """Resend order confirmation email with download links and redeem link"""
    from email_service import send_order_confirmation
    order_number = order_number.strip().upper()

    tx = await db.payment_transactions.find_one({"order_number": order_number}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Order not found")

    email = tx.get("customer_email")
    if not email:
        raise HTTPException(status_code=400, detail="No email on this order")

    # Gather download links
    download_links = await db.download_links.find(
        {"order_id": order_number, "revoked": {"$ne": True}},
        {"_id": 0, "token_hash": 0},
    ).to_list(100)

    result = await send_order_confirmation(
        to_email=email,
        order_id=order_number,
        items=tx.get("items", []),
        total=tx.get("total_amount", 0),
        download_links=download_links,
        customer_name=tx.get("customer_name", "Valued Customer"),
    )

    await db.delivery_logs.insert_one({
        "id": secrets.token_hex(8),
        "order_id": order_number,
        "type": "admin_resend_email",
        "recipient": email,
        "status": "success" if result.get("success") else "failed",
        "triggered_by": admin.id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    await log_admin_action("resend_order_email", admin.id, "order", order_number)

    if result.get("success"):
        return {"success": True, "message": f"Email resent to {email}"}
    raise HTTPException(status_code=500, detail=result.get("error", "Email send failed"))


@router.post("/orders/{order_number}/grant-access")
async def admin_grant_access(order_number: str, admin: AdminUser = Depends(get_current_admin)):
    """Manually (re)create download links for an order"""
    from download_protection import create_download_link
    order_number = order_number.strip().upper()

    tx = await db.payment_transactions.find_one({"order_number": order_number}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Order not found")

    email = tx.get("customer_email", "")
    items = tx.get("items", [])

    if not items:
        raise HTTPException(status_code=400, detail="No items in this order")

    # Get product -> file mappings
    created = 0
    for item in items:
        product_id = item.get("product_id", item.get("id", ""))
        if not product_id:
            continue
        mapping = await db.product_files.find_one({"product_id": product_id}, {"_id": 0})
        if not mapping:
            continue
        for f in mapping.get("files", []):
            token, expires = await create_download_link(
                order_id=order_number,
                user_id=tx.get("claimed_by_user_id", order_number),
                user_email=email,
                product_id=product_id,
                product_name=item.get("name", product_id),
                file_path=f.get("path", ""),
                payment_verified=True,
            )
            created += 1

    await log_admin_action("grant_access", admin.id, "order", order_number, {"links_created": created})

    return {"success": True, "message": f"{created} download link(s) created for {order_number}", "links_created": created}

# =============================================================================
# USER MANAGEMENT
# =============================================================================

@router.get("/users")
async def get_users_list(
    role: Optional[str] = None,
    disabled: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: AdminUser = Depends(get_current_admin)
):
    """Get users list"""
    query = {}
    if role:
        query["role"] = role
    if disabled is not None:
        query["disabled"] = disabled
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"username": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    
    users = await db.users.find(
        query, {"_id": 0, "password_hash": 0, "password_history": 0}
    ).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    total = await db.users.count_documents(query)
    
    return {
        "items": users,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "roles": list(ROLES.keys())
    }

@router.post("/users")
async def create_user(user_data: UserCreate, admin: AdminUser = Depends(get_current_admin)):
    """Create a new user (admin invite)"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_id = secrets.token_hex(16)
    now = datetime.now(timezone.utc)
    
    # Generate password if not provided
    password = user_data.password or secrets.token_urlsafe(12)
    password_hash = pwd_context.hash(password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email.lower(),
        "username": user_data.email.split("@")[0].lower(),
        "name": user_data.name,
        "password_hash": password_hash,
        "password_history": [password_hash],
        "password_changed_at": now.isoformat(),
        "role": user_data.role,
        "access_level": user_data.role,
        "created_at": now.isoformat(),
        "created_by": admin.id,
        "disabled": False,
        "invite_pending": True if not user_data.password else False
    }
    
    await db.users.insert_one(user_doc)
    
    await log_admin_action("create_user", admin.id, "user", user_id, 
                          {"email": user_data.email, "role": user_data.role})
    
    return {
        "id": user_id,
        "message": "User created successfully",
        "temporary_password": password if not user_data.password else None
    }

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    admin: AdminUser = Depends(get_current_admin)
):
    """Update user details"""
    existing = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.now(timezone.utc)
    update_doc = {"updated_at": now.isoformat(), "updated_by": admin.id}
    
    if user_data.name is not None:
        update_doc["name"] = user_data.name
    if user_data.role is not None:
        update_doc["role"] = user_data.role
        update_doc["access_level"] = user_data.role
    if user_data.disabled is not None:
        update_doc["disabled"] = user_data.disabled
        if user_data.disabled:
            update_doc["disabled_at"] = now.isoformat()
            update_doc["disabled_by"] = admin.id
    
    await db.users.update_one({"id": user_id}, {"$set": update_doc})
    
    await log_admin_action("update_user", admin.id, "user", user_id, update_doc)
    
    return {"message": "User updated successfully"}

@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, admin: AdminUser = Depends(get_current_admin)):
    """Admin reset user password"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    existing = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate new temporary password
    new_password = secrets.token_urlsafe(12)
    password_hash = pwd_context.hash(new_password)
    now = datetime.now(timezone.utc)
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "password_hash": password_hash,
            "password_changed_at": now.isoformat(),
            "must_change_password": True,
            "password_reset_by": admin.id,
            "password_reset_at": now.isoformat()
        }}
    )
    
    await log_admin_action("reset_password", admin.id, "user", user_id)
    
    return {
        "message": "Password reset successfully",
        "temporary_password": new_password,
        "user_email": existing.get("email")
    }

@router.post("/users/{user_id}/lock")
async def lock_user_account(user_id: str, admin: AdminUser = Depends(get_current_admin)):
    """Lock a user account"""
    existing = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.now(timezone.utc)
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "disabled": True,
            "disabled_at": now.isoformat(),
            "disabled_by": admin.id,
            "lock_reason": "admin_lock"
        }}
    )
    
    await log_admin_action("lock_account", admin.id, "user", user_id)
    
    return {"message": "Account locked successfully"}

@router.post("/users/{user_id}/unlock")
async def unlock_user_account(user_id: str, admin: AdminUser = Depends(get_current_admin)):
    """Unlock a user account"""
    existing = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.now(timezone.utc)
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "disabled": False,
            "unlocked_at": now.isoformat(),
            "unlocked_by": admin.id
        },
        "$unset": {
            "disabled_at": "",
            "disabled_by": "",
            "lock_reason": ""
        }}
    )
    
    # Clear any lockouts
    from security import clear_lockout
    await clear_lockout(existing.get("email", ""))
    
    await log_admin_action("unlock_account", admin.id, "user", user_id)
    
    return {"message": "Account unlocked successfully"}


# =============================================================================
# SUBMITTED CODES
# =============================================================================

@router.get("/submitted-codes")
async def get_submitted_codes(admin: AdminUser = Depends(get_current_admin)):
    """List all user-submitted redeem codes for admin review"""
    codes = await db.submitted_codes.find(
        {}, {"_id": 0}
    ).sort("submitted_at", -1).to_list(500)
    return {"items": codes}


# =============================================================================
# AUDIT LOGS
# =============================================================================

@router.get("/logs")
async def get_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    admin_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    limit: int = 100,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get audit logs"""
    query = {}
    if action:
        query["action"] = action
    if resource_type:
        query["resource_type"] = resource_type
    if admin_id:
        query["admin_id"] = admin_id
    if start_date:
        query.setdefault("timestamp", {})["$gte"] = start_date
    if end_date:
        query.setdefault("timestamp", {})["$lte"] = end_date
    
    skip = (page - 1) * limit
    
    logs = await db.admin_audit_logs.find(query, {"_id": 0}).skip(skip).limit(limit).sort("timestamp", -1).to_list(limit)
    total = await db.admin_audit_logs.count_documents(query)
    
    # Also get security audit logs
    security_logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)
    
    return {
        "admin_logs": logs,
        "security_logs": security_logs,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

# =============================================================================
# VIDEO MANAGEMENT
# =============================================================================

@router.get("/videos")
async def get_videos_list(
    lesson_id: Optional[str] = None,
    admin: AdminUser = Depends(get_current_admin)
):
    """Get video links/embeds"""
    query = {}
    if lesson_id:
        query["lesson_id"] = lesson_id
    
    videos = await db.lesson_videos.find(query, {"_id": 0}).to_list(1000)
    return {"items": videos}

@router.post("/videos")
async def add_video(
    lesson_id: str = Form(...),
    title: str = Form(...),
    url: str = Form(...),
    platform: str = Form(...),  # youtube, vimeo
    role_visibility: str = Form("all"),  # all, instructor, adult, youth
    admin: AdminUser = Depends(get_current_admin)
):
    """Add video link/embed to a lesson"""
    video_id = secrets.token_hex(12)
    now = datetime.now(timezone.utc)
    
    video_doc = {
        "id": video_id,
        "lesson_id": lesson_id,
        "title": title,
        "url": url,
        "platform": platform,
        "role_visibility": role_visibility.split(",") if "," in role_visibility else [role_visibility],
        "created_at": now.isoformat(),
        "created_by": admin.id
    }
    
    await db.lesson_videos.insert_one(video_doc)
    
    await log_admin_action("add_video", admin.id, "video", video_id, {"lesson_id": lesson_id})
    
    return {"id": video_id, "message": "Video added successfully"}

@router.delete("/videos/{video_id}")
async def delete_video(video_id: str, admin: AdminUser = Depends(get_current_admin)):
    """Delete a video"""
    result = await db.lesson_videos.delete_one({"id": video_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    
    await log_admin_action("delete_video", admin.id, "video", video_id)
    
    return {"message": "Video deleted successfully"}

# =============================================================================
# EXPORT FUNCTIONS
# =============================================================================

@router.get("/export/content")
async def export_content(admin: AdminUser = Depends(get_current_admin)):
    """Export all content as JSON"""
    lessons = await db.lessons.find({}, {"_id": 0}).to_list(10000)
    instructor_content = await db.instructor_content.find({}, {"_id": 0}).to_list(10000)
    
    export_data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "exported_by": admin.id,
        "lessons": lessons,
        "instructor_content": instructor_content
    }
    
    await log_admin_action("export_content", admin.id, "export", None)
    
    return JSONResponse(content=export_data)

@router.get("/export/orders")
async def export_orders(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    admin: AdminUser = Depends(get_current_admin)
):
    """Export orders as JSON"""
    query = {}
    if start_date:
        query.setdefault("created_at", {})["$gte"] = start_date.isoformat()
    if end_date:
        query.setdefault("created_at", {})["$lte"] = end_date.isoformat()
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(10000)
    
    export_data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "exported_by": admin.id,
        "orders": orders
    }
    
    await log_admin_action("export_orders", admin.id, "export", None)
    
    return JSONResponse(content=export_data)

@router.get("/export/users")
async def export_users(admin: AdminUser = Depends(get_current_admin)):
    """Export users (without passwords) as JSON"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0, "password_history": 0}).to_list(10000)
    
    export_data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "exported_by": admin.id,
        "users": users
    }
    
    await log_admin_action("export_users", admin.id, "export", None)
    
    return JSONResponse(content=export_data)

# =============================================================================
# SYSTEM HEALTH / BACKUP STATUS
# =============================================================================

@router.get("/system/health")
async def get_system_health(admin: AdminUser = Depends(get_current_admin)):
    """Get system health and stats"""
    # Get database stats
    db_stats = await db.command("dbStats")
    
    # Get collection counts
    collections = {
        "users": await db.users.count_documents({}),
        "lessons": await db.lessons.count_documents({}),
        "orders": await db.orders.count_documents({}),
        "products": await db.products.count_documents({}),
        "media": await db.media.count_documents({}),
        "audit_logs": await db.admin_audit_logs.count_documents({})
    }
    
    return {
        "status": "healthy",
        "database": {
            "size_bytes": db_stats.get("dataSize", 0),
            "storage_bytes": db_stats.get("storageSize", 0),
            "collections": db_stats.get("collections", 0)
        },
        "collection_counts": collections,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }



# ==================== CATALOG CSV MANAGEMENT ====================

@router.get("/catalog/csv")
async def download_catalog_csv(admin: AdminUser = Depends(get_current_admin)):
    """Download the current hardcoded product catalog as CSV"""
    import csv as csv_mod
    import ast
    
    catalog_path = "/app/backend/payment_routes.py"
    with open(catalog_path, "r") as f:
        content = f.read()
    
    start = content.find("PRODUCTS = {")
    if start == -1:
        raise HTTPException(status_code=500, detail="Could not locate PRODUCTS dict")
    
    depth = 0
    i = start + len("PRODUCTS = ")
    end = i
    for j in range(i, len(content)):
        if content[j] == '{':
            depth += 1
        elif content[j] == '}':
            depth -= 1
        if depth == 0:
            end = j + 1
            break
    
    products = ast.literal_eval(content[i:end])
    
    output = BytesIO()
    import io as io_mod
    text_output = io_mod.TextIOWrapper(output, encoding='utf-8', newline='')
    
    fields = ['product_id', 'name', 'sku', 'stripe_id', 'list_price', 'sale_price',
              'promo_sale_price', 'promo_until', 'currency', 'edition', 'medium',
              'type', 'preorder', 'free', 'physical', 'is_bundle', 'description']
    
    writer = csv_mod.DictWriter(text_output, fieldnames=fields)
    writer.writeheader()
    
    for pid, p in products.items():
        writer.writerow({
            'product_id': pid,
            'name': p.get('name', ''),
            'sku': p.get('sku', ''),
            'stripe_id': p.get('stripe_id', ''),
            'list_price': p.get('list_price', ''),
            'sale_price': p.get('sale_price', ''),
            'promo_sale_price': p.get('promo_sale_price', ''),
            'promo_until': p.get('promo_until', ''),
            'currency': p.get('currency', 'usd'),
            'edition': p.get('edition', ''),
            'medium': p.get('medium', ''),
            'type': p.get('type', ''),
            'preorder': p.get('preorder', False),
            'free': p.get('free', False),
            'physical': p.get('physical', False),
            'is_bundle': p.get('is_bundle', False),
            'description': p.get('description', ''),
        })
    
    text_output.flush()
    text_output.detach()
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sofu_product_catalog.csv"}
    )


@router.post("/catalog/csv")
async def upload_catalog_csv(
    file: UploadFile = File(...),
    admin: AdminUser = Depends(get_current_admin)
):
    """Upload a CSV to update product prices. Only list_price and sale_price columns are updated.
    The CSV must have a 'product_id' column matching existing products."""
    import csv as csv_mod
    import ast
    import io as io_mod
    
    contents = await file.read()
    text = contents.decode('utf-8-sig')
    reader = csv_mod.DictReader(io_mod.StringIO(text))
    
    catalog_path = "/app/backend/payment_routes.py"
    with open(catalog_path, "r") as f:
        file_content = f.read()
    
    start = file_content.find("PRODUCTS = {")
    if start == -1:
        raise HTTPException(status_code=500, detail="Could not locate PRODUCTS dict")
    
    depth = 0
    i = start + len("PRODUCTS = ")
    end = i
    for j in range(i, len(file_content)):
        if file_content[j] == '{':
            depth += 1
        elif file_content[j] == '}':
            depth -= 1
        if depth == 0:
            end = j + 1
            break
    
    products = ast.literal_eval(file_content[i:end])
    
    updated = []
    skipped = []
    errors = []
    
    for row in reader:
        pid = row.get('product_id', '').strip()
        if not pid:
            continue
        
        if pid not in products:
            skipped.append(pid)
            continue
        
        try:
            changes = {}
            if row.get('list_price', '').strip():
                new_list = float(row['list_price'])
                if new_list != products[pid].get('list_price'):
                    products[pid]['list_price'] = new_list
                    changes['list_price'] = new_list
            
            if row.get('sale_price', '').strip():
                new_sale = float(row['sale_price'])
                if new_sale != products[pid].get('sale_price'):
                    products[pid]['sale_price'] = new_sale
                    changes['sale_price'] = new_sale
            
            if row.get('promo_sale_price', '').strip():
                new_promo = float(row['promo_sale_price'])
                if new_promo != products[pid].get('promo_sale_price'):
                    products[pid]['promo_sale_price'] = new_promo
                    changes['promo_sale_price'] = new_promo
            
            if row.get('name', '').strip():
                new_name = row['name'].strip()
                if new_name != products[pid].get('name'):
                    products[pid]['name'] = new_name
                    changes['name'] = new_name
            
            if row.get('description', '').strip():
                new_desc = row['description'].strip()
                if new_desc != products[pid].get('description'):
                    products[pid]['description'] = new_desc
                    changes['description'] = new_desc
            
            if changes:
                updated.append({"product_id": pid, "changes": changes})
        except ValueError as e:
            errors.append({"product_id": pid, "error": str(e)})
    
    if updated:
        # Rebuild the PRODUCTS dict in the file
        import textwrap
        lines = ["PRODUCTS = {"]
        for pid, p in products.items():
            lines.append(f'    "{pid}": {{')
            for k, v in p.items():
                if isinstance(v, str):
                    escaped = v.replace('\\', '\\\\').replace('"', '\\"')
                    lines.append(f'        "{k}": "{escaped}",')
                elif isinstance(v, bool):
                    lines.append(f'        "{k}": {v},')
                elif isinstance(v, (int, float)):
                    lines.append(f'        "{k}": {v},')
                elif isinstance(v, list):
                    lines.append(f'        "{k}": {v},')
            lines.append("    },")
        lines.append("}")
        
        new_products_text = "\n".join(lines)
        new_content = file_content[:start] + new_products_text + file_content[end:]
        
        with open(catalog_path, "w") as f:
            f.write(new_content)
    
    await log_admin_action("catalog_csv_upload", admin.id, "catalog", None, {
        "updated_count": len(updated),
        "skipped_count": len(skipped),
        "error_count": len(errors)
    })
    
    return {
        "message": f"Catalog updated: {len(updated)} products changed",
        "updated": updated,
        "skipped": skipped,
        "errors": errors
    }


# ==================== CONTENT FULFILLMENT MANAGEMENT ====================

@router.post("/fulfillment/seed-mappings")
async def seed_product_file_mappings(admin: AdminUser = Depends(get_current_admin)):
    """Seed the product_file_mappings collection from the hardcoded PRODUCT_FILES dict.
    This is a one-time migration — after this, all mappings live in MongoDB."""
    from payment_routes import PRODUCT_FILES
    
    count = 0
    for product_id, filename in PRODUCT_FILES.items():
        existing = await db.product_file_mappings.find_one({"product_id": product_id})
        if not existing:
            await db.product_file_mappings.insert_one({
                "product_id": product_id,
                "filename": filename,
                "file_path": f"/app/content/downloads/{filename}",
                "active": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
            count += 1
    
    total = await db.product_file_mappings.count_documents({})
    return {"message": f"Seeded {count} new mappings. Total: {total}"}


@router.get("/fulfillment/mappings")
async def list_product_file_mappings(
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: AdminUser = Depends(get_current_admin)
):
    """List all product-to-file mappings (from MongoDB, not code)"""
    query = {}
    if search:
        query["$or"] = [
            {"product_id": {"$regex": search, "$options": "i"}},
            {"filename": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    total = await db.product_file_mappings.count_documents(query)
    mappings = await db.product_file_mappings.find(
        query, {"_id": 0}
    ).sort("product_id", 1).skip(skip).limit(limit).to_list(limit)
    
    return {"mappings": mappings, "total": total, "page": page, "limit": limit}


@router.post("/fulfillment/mappings")
async def add_product_file_mapping(
    request: Request,
    admin: AdminUser = Depends(get_current_admin)
):
    """Add a new product-to-file mapping. No redeploy needed."""
    body = await request.json()
    product_id = body.get("product_id", "").strip()
    filename = body.get("filename", "").strip()
    
    if not product_id or not filename:
        raise HTTPException(status_code=400, detail="product_id and filename are required")
    
    # Verify file exists
    file_path = f"/app/content/downloads/{filename}"
    if not os.path.exists(file_path):
        # List available files for convenience
        available = [f for f in os.listdir("/app/content/downloads") if f.endswith('.pdf')]
        raise HTTPException(status_code=400, detail=f"File not found: {filename}. Available: {available[:20]}")
    
    existing = await db.product_file_mappings.find_one({"product_id": product_id})
    if existing:
        await db.product_file_mappings.update_one(
            {"product_id": product_id},
            {"$set": {"filename": filename, "file_path": file_path, "active": True, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"message": f"Updated mapping: {product_id} → {filename}"}
    else:
        await db.product_file_mappings.insert_one({
            "product_id": product_id,
            "filename": filename,
            "file_path": file_path,
            "active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
        return {"message": f"Created mapping: {product_id} → {filename}"}


@router.delete("/fulfillment/mappings/{product_id}")
async def delete_product_file_mapping(
    product_id: str,
    admin: AdminUser = Depends(get_current_admin)
):
    """Deactivate a product-to-file mapping"""
    result = await db.product_file_mappings.update_one(
        {"product_id": product_id},
        {"$set": {"active": False, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return {"message": f"Deactivated mapping: {product_id}"}


@router.get("/fulfillment/files")
async def list_available_files(admin: AdminUser = Depends(get_current_admin)):
    """List all PDF/content files available in the downloads directory"""
    download_dir = "/app/content/downloads"
    files = []
    for root, dirs, filenames in os.walk(download_dir):
        for f in sorted(filenames):
            if f.endswith(('.pdf', '.epub', '.zip')):
                full_path = os.path.join(root, f)
                size = os.path.getsize(full_path)
                rel_path = os.path.relpath(full_path, download_dir)
                files.append({
                    "filename": rel_path,
                    "size_bytes": size,
                    "size_mb": round(size / (1024*1024), 2)
                })
    return {"files": files, "total": len(files), "directory": download_dir}


# ==================== MANUAL ACCESS GRANT (File Drop) ====================

@router.post("/fulfillment/grant-access")
async def grant_digital_access(
    request: Request,
    admin: AdminUser = Depends(get_current_admin)
):
    """Manually grant digital content access to a user by email.
    This is the 'file drop' — adds download links to someone's library without needing a purchase."""
    from download_protection import create_download_link
    
    body = await request.json()
    email = body.get("email", "").strip().lower()
    product_ids = body.get("product_ids", [])  # List of product_id strings
    reason = body.get("reason", "Manual admin grant")
    
    if not email:
        raise HTTPException(status_code=400, detail="email is required")
    if not product_ids:
        raise HTTPException(status_code=400, detail="product_ids list is required")
    
    granted = []
    errors = []
    
    for pid in product_ids:
        # Look up file mapping from MongoDB first, then fall back to hardcoded
        mapping = await db.product_file_mappings.find_one({"product_id": pid, "active": True}, {"_id": 0})
        
        if mapping:
            file_path = mapping["file_path"]
        else:
            from payment_routes import get_pdf_path, normalize_product_id
            normalized = normalize_product_id(pid)
            file_path = get_pdf_path(normalized)
        
        if not file_path or not os.path.exists(file_path):
            errors.append({"product_id": pid, "error": "File not found"})
            continue
        
        # Create the download link
        order_id = f"ADMIN-GRANT-{secrets.token_hex(4).upper()}"
        token, expires_at = await create_download_link(
            order_id=order_id,
            user_id=email,
            user_email=email,
            product_id=pid,
            product_name=pid.replace("-", " ").replace("_", " ").title(),
            file_path=file_path,
            payment_verified=True
        )
        
        # Also create a fake "paid" transaction so it shows in My Library
        await db.payment_transactions.update_one(
            {"order_number": order_id},
            {"$set": {
                "session_id": order_id,
                "order_number": order_id,
                "items": [{"product_id": pid, "name": pid.replace("-", " ").replace("_", " ").title(), "quantity": 1}],
                "total_amount": 0,
                "currency": "usd",
                "payment_status": "paid",
                "status": "admin_grant",
                "customer_email": email,
                "download_links_generated": True,
                "admin_granted_by": admin.id,
                "admin_grant_reason": reason,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
        
        granted.append({"product_id": pid, "token": token[:20] + "...", "expires": expires_at.isoformat()})
    
    await log_admin_action("grant_access", admin.id, "fulfillment", None, {
        "email": email,
        "granted_count": len(granted),
        "error_count": len(errors),
        "reason": reason
    })
    
    return {
        "message": f"Granted {len(granted)} items to {email}",
        "granted": granted,
        "errors": errors
    }


# ==================== RETRY FULFILLMENT ====================

@router.post("/fulfillment/retry/{order_number}")
async def retry_order_fulfillment(
    order_number: str,
    admin: AdminUser = Depends(get_current_admin)
):
    """Retry generating download links for a paid order that failed fulfillment.
    No redeploy needed — uses MongoDB mappings + hardcoded fallback."""
    from download_protection import create_download_link
    from payment_routes import get_pdf_path, normalize_product_id
    
    order = await db.payment_transactions.find_one(
        {"order_number": order_number},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_number} not found")
    
    if order.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail=f"Order is not paid (status: {order.get('payment_status')})")
    
    email = order.get("customer_email", "")
    items = order.get("items", [])
    
    # Get existing download links
    existing = await db.download_links.find(
        {"order_id": order_number, "revoked": False},
        {"_id": 0, "product_id": 1}
    ).to_list(50)
    existing_pids = {dl.get("product_id") for dl in existing}
    
    created = []
    skipped = []
    errors = []
    
    for item in items:
        pid = item.get("product_id") or item.get("id") or item.get("uniqueKey", "")
        name = item.get("name", pid)
        
        # Check MongoDB mapping first
        mapping = await db.product_file_mappings.find_one(
            {"product_id": pid, "active": True}, {"_id": 0}
        )
        
        if mapping:
            file_path = mapping["file_path"]
            matched_pid = pid
        else:
            # Fall back to hardcoded
            normalized = normalize_product_id(pid)
            file_path = get_pdf_path(normalized)
            matched_pid = normalized
        
        if not file_path:
            errors.append({"product_id": pid, "name": name, "error": "No file mapping found"})
            continue
        
        if matched_pid in existing_pids or pid in existing_pids:
            skipped.append({"product_id": pid, "name": name, "reason": "Already has download link"})
            continue
        
        token, expires_at = await create_download_link(
            order_id=order_number,
            user_id=email,
            user_email=email,
            product_id=matched_pid,
            product_name=name,
            file_path=file_path,
            payment_verified=True
        )
        created.append({"product_id": pid, "name": name, "token": token[:20] + "..."})
    
    if created:
        await db.payment_transactions.update_one(
            {"order_number": order_number},
            {"$set": {"download_links_generated": True, "updated_at": datetime.now(timezone.utc)}}
        )
    
    await log_admin_action("retry_fulfillment", admin.id, "order", order_number, {
        "created": len(created), "skipped": len(skipped), "errors": len(errors)
    })
    
    return {
        "message": f"Retry complete for {order_number}",
        "created": created,
        "skipped": skipped,
        "errors": errors
    }


# ==================== ORDER MANAGEMENT ====================

@router.get("/orders")
async def list_orders(
    status: Optional[str] = None,
    email: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    admin: AdminUser = Depends(get_current_admin)
):
    """List all orders with filtering"""
    query = {}
    if status:
        query["payment_status"] = status
    if email:
        query["customer_email"] = {"$regex": email, "$options": "i"}
    
    skip = (page - 1) * limit
    total = await db.payment_transactions.count_documents(query)
    orders = await db.payment_transactions.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Add download link count for each
    for order in orders:
        order_num = order.get("order_number")
        if order_num:
            dl_count = await db.download_links.count_documents({"order_id": order_num})
            order["download_link_count"] = dl_count
    
    return {"orders": orders, "total": total, "page": page}


@router.post("/orders/{order_number}/send-email")
async def resend_order_email(
    order_number: str,
    admin: AdminUser = Depends(get_current_admin)
):
    """Resend the order confirmation + download links email"""
    from email_service import send_order_confirmation
    
    order = await db.payment_transactions.find_one(
        {"order_number": order_number}, {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    email = order.get("customer_email")
    if not email:
        raise HTTPException(status_code=400, detail="No customer email on order")
    
    links = await db.download_links.find(
        {"order_id": order_number, "revoked": False},
        {"_id": 0, "token": 1, "product_name": 1}
    ).to_list(50)
    
    download_links = [{"token": link["token"], "product_name": link.get("product_name", "Digital Content")} for link in links]
    
    result = await send_order_confirmation(
        to_email=email,
        order_id=order_number,
        items=order.get("items", []),
        total=order.get("total_amount", 0),
        download_links=download_links,
        customer_name=order.get("customer_name", "")
    )
    
    await log_admin_action("resend_email", admin.id, "order", order_number, {"email": email})
    
    return {"message": f"Email sent to {email}", "result": result}


# =============================================================================
# CONTENT HEALTH CHECK
# =============================================================================

@router.get("/content-health")
async def check_content_health():
    """Check if content/download files exist on this server (no auth required for diagnostics)"""
    content_dirs = {
        "/app/content/downloads": [],
        "/app/content/bonus": [],
        "/app/content/holiday": [],
        "/app/backend/lesson_pdfs": [],
    }
    
    results = {}
    total_files = 0
    total_size = 0
    
    for directory in content_dirs:
        if os.path.exists(directory):
            files = []
            for f in os.listdir(directory):
                if f.endswith('.pdf'):
                    full = os.path.join(directory, f)
                    size = os.path.getsize(full)
                    files.append({"name": f, "size_bytes": size})
                    total_size += size
                    total_files += 1
            results[directory] = {"exists": True, "pdf_count": len(files), "files": files[:10]}
        else:
            results[directory] = {"exists": False, "pdf_count": 0, "files": []}
    
    # Check download_links with broken file paths
    broken_links = []
    async for link in db.download_links.find({"revoked": False}, {"_id": 0, "file_path": 1, "order_id": 1, "product_name": 1}).limit(100):
        fp = link.get("file_path", "")
        if fp and not os.path.exists(fp):
            # Try resolve
            from routes.download_routes import resolve_file_path
            resolved = resolve_file_path(fp)
            broken_links.append({
                "order_id": link.get("order_id"),
                "product_name": link.get("product_name"),
                "stored_path": fp,
                "resolved": resolved or "NOT FOUND"
            })
    
    return {
        "server_time": datetime.now(timezone.utc).isoformat(),
        "total_pdf_files": total_files,
        "total_size_mb": round(total_size / (1024 * 1024), 1),
        "directories": results,
        "broken_download_links": broken_links[:20],
        "broken_link_count": len(broken_links)
    }
