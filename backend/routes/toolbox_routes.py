"""
Instructor Toolbox — data-driven, admin-managed content sections.
=================================================================
Two content lanes:
  - publisher : core resources provided by Overflow Harvest / Admin (ship with product)
  - instructor: class-specific resources uploaded by the IE purchaser (private to them)

Sections are admin-manageable (create / rename / enable-disable / reorder). Files
are stored in the existing File Manager (db.files + Emergent Object Storage) and
linked to a section via db.toolbox_assets. Nothing here re-implements storage.
"""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from routes.admin_routes import AdminUser, get_current_admin
from routes.instructor_routes import InstructorUser, get_current_instructor
from routes.admin_files_routes import _ext, _content_type_for, MAX_UPLOAD_BYTES
from server import db
import storage_service as ss

admin_router = APIRouter(prefix="/api/admin/toolbox", tags=["admin-toolbox"])
instr_router = APIRouter(prefix="/api/instructor/toolbox", tags=["instructor-toolbox"])

# Default sections seeded on first use. special_view preserves the existing rich
# interactive renders (maps gallery, question bank) on the instructor side.
DEFAULT_SECTIONS = [
    {"key": "maps", "title": "Maps & Visual Aids", "description": "Biblical maps for bonus rounds, daily doubles, and classroom use", "icon": "Map", "special_view": "maps_gallery"},
    {"key": "answer-keys", "title": "Answer Keys", "description": "Answer guides for the lessons", "icon": "Key", "special_view": None},
    {"key": "question-banks", "title": "Question Banks", "description": "Trivia & Jeopardy-style questions parsed from the lessons", "icon": "BookMarked", "special_view": "question_bank"},
    {"key": "offline-game-packs", "title": "Offline Game Packs", "description": "Printable Grid Iron bingo cards, Passport Trek sheets & game packs", "icon": "Gamepad2", "special_view": "offline_games"},
    {"key": "teaching-resources", "title": "Teaching Resources", "description": "Printables, slides, and supplementary teaching materials", "icon": "FileText", "special_view": None},
    {"key": "facilitation-notes", "title": "Facilitation Notes", "description": "Teaching tips, discussion prompts, and group activity guides", "icon": "Lightbulb", "special_view": None},
]


def _slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").strip().lower()).strip("-")
    return s or f"section-{uuid.uuid4().hex[:6]}"


def _iso(v):
    return v.isoformat() if hasattr(v, "isoformat") else v


async def _ensure_seeded():
    if await db.toolbox_sections.count_documents({}) == 0:
        now = datetime.now(timezone.utc)
        docs = []
        for i, s in enumerate(DEFAULT_SECTIONS):
            docs.append({
                "id": str(uuid.uuid4()),
                "key": s["key"],
                "title": s["title"],
                "description": s["description"],
                "icon": s["icon"],
                "special_view": s["special_view"],
                "order": i,
                "enabled": True,
                "is_default": True,
                "created_at": now,
                "updated_at": now,
            })
        if docs:
            await db.toolbox_sections.insert_many(docs)


def _section_public(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "key": doc["key"],
        "title": doc["title"],
        "description": doc.get("description", ""),
        "icon": doc.get("icon", "Folder"),
        "special_view": doc.get("special_view"),
        "order": doc.get("order", 0),
        "enabled": bool(doc.get("enabled", True)),
        "is_default": bool(doc.get("is_default", False)),
    }


async def _asset_public(asset: dict) -> Optional[dict]:
    f = await db.files.find_one({"id": asset["file_id"], "is_deleted": False}, {"_id": 0})
    if not f:
        return None
    return {
        "id": asset["id"],
        "section_key": asset["section_key"],
        "lane": asset.get("lane", "publisher"),
        "owner_id": asset.get("owner_id"),
        "label": asset.get("label") or f.get("original_filename"),
        "description": asset.get("description") or f.get("description", ""),
        "file_id": asset["file_id"],
        "filename": f.get("original_filename"),
        "content_type": f.get("content_type"),
        "size_bytes": f.get("size_bytes", 0),
        "order": asset.get("order", 0),
        "created_at": _iso(asset.get("created_at")),
    }


# =============================================================================
# Models
# =============================================================================

class SectionCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    icon: Optional[str] = "Folder"
    key: Optional[str] = None


class SectionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    enabled: Optional[bool] = None


class ReorderRequest(BaseModel):
    ordered_ids: list[str]


class AssignRequest(BaseModel):
    section_key: str
    file_id: str
    label: Optional[str] = None
    description: Optional[str] = None


# =============================================================================
# ADMIN — section management (publisher lane)
# =============================================================================

@admin_router.get("/sections")
async def admin_list_sections(admin: AdminUser = Depends(get_current_admin)):
    await _ensure_seeded()
    out = []
    async for doc in db.toolbox_sections.find({}, {"_id": 0}).sort("order", 1):
        s = _section_public(doc)
        s["publisher_count"] = await db.toolbox_assets.count_documents({"section_key": doc["key"], "lane": "publisher"})
        s["instructor_count"] = await db.toolbox_assets.count_documents({"section_key": doc["key"], "lane": "instructor"})
        out.append(s)
    return {"sections": out}


@admin_router.post("/sections")
async def admin_create_section(body: SectionCreate, admin: AdminUser = Depends(get_current_admin)):
    await _ensure_seeded()
    key = _slugify(body.key or body.title)
    if await db.toolbox_sections.find_one({"key": key}):
        raise HTTPException(status_code=400, detail=f"Section key '{key}' already exists")
    last = await db.toolbox_sections.find_one({}, sort=[("order", -1)])
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()), "key": key, "title": body.title.strip(),
        "description": (body.description or "").strip(), "icon": body.icon or "Folder",
        "special_view": None, "order": (last.get("order", 0) + 1) if last else 0,
        "enabled": True, "is_default": False, "created_at": now, "updated_at": now,
    }
    await db.toolbox_sections.insert_one(doc)
    return {"success": True, "section": _section_public(doc)}


@admin_router.put("/sections/{section_id}")
async def admin_update_section(section_id: str, body: SectionUpdate, admin: AdminUser = Depends(get_current_admin)):
    update = {k: v for k, v in body.dict(exclude_unset=True).items() if v is not None}
    if "title" in update:
        update["title"] = update["title"].strip()
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    update["updated_at"] = datetime.now(timezone.utc)
    res = await db.toolbox_sections.update_one({"id": section_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    doc = await db.toolbox_sections.find_one({"id": section_id}, {"_id": 0})
    return {"success": True, "section": _section_public(doc)}


@admin_router.post("/sections/reorder")
async def admin_reorder_sections(body: ReorderRequest, admin: AdminUser = Depends(get_current_admin)):
    for i, sid in enumerate(body.ordered_ids):
        await db.toolbox_sections.update_one({"id": sid}, {"$set": {"order": i}})
    return {"success": True}


@admin_router.delete("/sections/{section_id}")
async def admin_delete_section(section_id: str, admin: AdminUser = Depends(get_current_admin)):
    doc = await db.toolbox_sections.find_one({"id": section_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Section not found")
    if doc.get("is_default"):
        raise HTTPException(status_code=400, detail="Default sections cannot be deleted — disable it instead")
    await db.toolbox_assets.delete_many({"section_key": doc["key"]})
    await db.toolbox_sections.delete_one({"id": section_id})
    return {"success": True}


@admin_router.get("/sections/{section_key}/assets")
async def admin_list_assets(section_key: str, admin: AdminUser = Depends(get_current_admin)):
    out = []
    async for a in db.toolbox_assets.find({"section_key": section_key}, {"_id": 0}).sort("created_at", -1):
        pub = await _asset_public(a)
        if pub:
            out.append(pub)
    return {"assets": out}


@admin_router.post("/assets")
async def admin_assign_existing(body: AssignRequest, admin: AdminUser = Depends(get_current_admin)):
    section = await db.toolbox_sections.find_one({"key": body.section_key})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    f = await db.files.find_one({"id": body.file_id, "is_deleted": False}, {"_id": 0, "id": 1})
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    existing = await db.toolbox_assets.find_one({"section_key": body.section_key, "file_id": body.file_id, "lane": "publisher"})
    if existing:
        raise HTTPException(status_code=400, detail="This file is already assigned to the section")
    now = datetime.now(timezone.utc)
    asset = {
        "id": str(uuid.uuid4()), "section_key": body.section_key, "file_id": body.file_id,
        "lane": "publisher", "owner_id": None, "label": body.label, "description": body.description,
        "order": 0, "created_at": now, "created_by": admin.id,
    }
    await db.toolbox_assets.insert_one(asset)
    return {"success": True, "asset": await _asset_public(asset)}


async def _upload_and_assign(file: UploadFile, section_key: str, lane: str, owner_id, created_by, label, description):
    section = await db.toolbox_sections.find_one({"key": section_key})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    ext = _ext(file.filename or "")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large (> {MAX_UPLOAD_BYTES/1024/1024:.0f} MB)")
    category = f"toolbox-{section_key}"
    storage_path = ss.make_storage_path(category, ext)
    content_type = file.content_type or _content_type_for(ext)
    try:
        result = ss.put_object(storage_path, data, content_type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {e}")
    now = datetime.now(timezone.utc)
    file_id = str(uuid.uuid4())
    await db.files.insert_one({
        "id": file_id, "storage_path": result.get("path", storage_path), "category": category,
        "original_filename": file.filename or "upload", "content_type": content_type,
        "size_bytes": int(result.get("size", len(data))), "etag": result.get("etag"),
        "description": (description or "").strip(), "is_deleted": False,
        "uploaded_by_admin": created_by if lane == "publisher" else None,
        "uploaded_by_instructor": created_by if lane == "instructor" else None,
        "created_at": now, "updated_at": now, "attachments": [],
    })
    asset = {
        "id": str(uuid.uuid4()), "section_key": section_key, "file_id": file_id,
        "lane": lane, "owner_id": owner_id, "label": label, "description": description,
        "order": 0, "created_at": now, "created_by": created_by,
    }
    await db.toolbox_assets.insert_one(asset)
    return await _asset_public(asset)


@admin_router.post("/assets/upload")
async def admin_upload_asset(
    section_key: str = Form(...),
    file: UploadFile = File(...),
    label: str = Form(""),
    description: str = Form(""),
    admin: AdminUser = Depends(get_current_admin),
):
    asset = await _upload_and_assign(file, section_key, "publisher", None, admin.id, label or None, description or None)
    return {"success": True, "asset": asset}


@admin_router.delete("/assets/{asset_id}")
async def admin_delete_asset(asset_id: str, admin: AdminUser = Depends(get_current_admin)):
    res = await db.toolbox_assets.delete_one({"id": asset_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"success": True}


# =============================================================================
# INSTRUCTOR — read sections + manage own instructor-lane resources
# =============================================================================

@instr_router.get("/sections")
async def instr_list_sections(instructor: InstructorUser = Depends(get_current_instructor)):
    await _ensure_seeded()
    out = []
    async for doc in db.toolbox_sections.find({"enabled": True}, {"_id": 0}).sort("order", 1):
        out.append(_section_public(doc))
    return {"sections": out}


@instr_router.get("/sections/{section_key}/assets")
async def instr_list_assets(section_key: str, instructor: InstructorUser = Depends(get_current_instructor)):
    """Publisher assets (shared) + this instructor's OWN instructor-lane assets."""
    out = []
    query = {"section_key": section_key, "$or": [
        {"lane": "publisher"},
        {"lane": "instructor", "owner_id": instructor.id},
    ]}
    async for a in db.toolbox_assets.find(query, {"_id": 0}).sort("created_at", -1):
        pub = await _asset_public(a)
        if pub:
            pub["is_mine"] = a.get("lane") == "instructor" and a.get("owner_id") == instructor.id
            out.append(pub)
    return {"assets": out}


@instr_router.post("/assets/upload")
async def instr_upload_asset(
    section_key: str = Form(...),
    file: UploadFile = File(...),
    label: str = Form(""),
    description: str = Form(""),
    instructor: InstructorUser = Depends(get_current_instructor),
):
    asset = await _upload_and_assign(file, section_key, "instructor", instructor.id, instructor.id, label or None, description or None)
    return {"success": True, "asset": asset}


@instr_router.delete("/assets/{asset_id}")
async def instr_delete_asset(asset_id: str, instructor: InstructorUser = Depends(get_current_instructor)):
    asset = await db.toolbox_assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.get("lane") != "instructor" or asset.get("owner_id") != instructor.id:
        raise HTTPException(status_code=403, detail="You can only remove your own uploaded resources")
    await db.toolbox_assets.delete_one({"id": asset_id})
    return {"success": True}


@instr_router.get("/assets/{asset_id}/download")
async def instr_download_asset(asset_id: str, instructor: InstructorUser = Depends(get_current_instructor)):
    """Stream a toolbox file. Allowed if publisher lane OR owned by this instructor."""
    asset = await db.toolbox_assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.get("lane") == "instructor" and asset.get("owner_id") != instructor.id:
        raise HTTPException(status_code=403, detail="Not authorized for this resource")
    record = await db.files.find_one({"id": asset["file_id"], "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, ctype = ss.get_object(record["storage_path"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storage read failed: {e}")
    headers = {"Content-Disposition": f'attachment; filename="{record.get("original_filename", "download")}"'}
    return Response(content=data, media_type=record.get("content_type") or ctype, headers=headers)
