"""
Admin File Manager — durable file storage backed by Emergent Object Storage.
All admin-uploaded files persist across redeploys (pod filesystem doesn't).
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from routes.admin_routes import AdminUser, get_current_admin
from server import db
import storage_service as ss

router = APIRouter(prefix="/api/admin/files", tags=["admin-files"])

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB cap per file
ALLOWED_EXT = {
    "pdf", "png", "jpg", "jpeg", "webp", "gif", "svg",
    "docx", "doc", "csv", "txt", "md", "json", "mp3", "m4a", "wav",
}


def _ext(filename: str) -> str:
    if not filename or "." not in filename:
        return "bin"
    return filename.rsplit(".", 1)[-1].lower()


def _content_type_for(ext: str) -> str:
    return {
        "pdf": "application/pdf",
        "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "webp": "image/webp", "gif": "image/gif", "svg": "image/svg+xml",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc": "application/msword",
        "csv": "text/csv", "txt": "text/plain", "md": "text/markdown",
        "json": "application/json",
        "mp3": "audio/mpeg", "m4a": "audio/mp4", "wav": "audio/wav",
    }.get(ext, "application/octet-stream")


class AttachRequest(BaseModel):
    target_type: str  # "product" | "order"
    target_id: str
    role: Optional[str] = None  # e.g. "primary", "preview", "bonus"


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("uploads"),
    description: str = Form(""),
    admin: AdminUser = Depends(get_current_admin),
):
    """Upload a file to durable Emergent Object Storage and record in db.files."""
    ext = _ext(file.filename or "")
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Extension '.{ext}' not allowed. Allowed: {sorted(ALLOWED_EXT)}")
    safe_category = "".join(c for c in category if c.isalnum() or c in ("-", "_")).strip("-_") or "uploads"

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large ({len(data)/1024/1024:.1f} MB > {MAX_UPLOAD_BYTES/1024/1024:.0f} MB)")

    storage_path = ss.make_storage_path(safe_category, ext)
    content_type = file.content_type or _content_type_for(ext)
    try:
        result = ss.put_object(storage_path, data, content_type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {e}")

    file_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    record = {
        "id": file_id,
        "storage_path": result.get("path", storage_path),
        "category": safe_category,
        "original_filename": file.filename or "upload",
        "content_type": content_type,
        "size_bytes": int(result.get("size", len(data))),
        "etag": result.get("etag"),
        "description": (description or "").strip(),
        "is_deleted": False,
        "uploaded_by_admin": admin.id,
        "uploaded_by_email": getattr(admin, "email", None),
        "created_at": now,
        "updated_at": now,
        "attachments": [],
    }
    await db.files.insert_one(record)
    record.pop("_id", None)
    record["created_at"] = record["created_at"].isoformat()
    record["updated_at"] = record["updated_at"].isoformat()
    return {"success": True, "file": record}


@router.get("")
@router.get("/")
async def list_files(
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
    search: Optional[str] = None,
    category: Optional[str] = None,
    include_deleted: bool = False,
    admin: AdminUser = Depends(get_current_admin),
):
    """List ALL admin-uploaded files (no 6-7 cap). Pagination via skip/limit
    so the full set is reachable, search is case-insensitive on filename."""
    q: dict = {}
    if not include_deleted:
        q["is_deleted"] = False
    if category:
        q["category"] = category
    if search:
        q["original_filename"] = {"$regex": search, "$options": "i"}
    total = await db.files.count_documents(q)
    cur = db.files.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for f in cur:
        for k in ("created_at", "updated_at"):
            v = f.get(k)
            if hasattr(v, "isoformat"):
                f[k] = v.isoformat()
        items.append(f)
    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.delete("/{file_id}")
async def soft_delete_file(file_id: str, admin: AdminUser = Depends(get_current_admin)):
    """Soft-delete (Emergent Object Storage has no delete API). The blob stays
    in storage but the DB record is hidden from list/download."""
    res = await db.files.update_one(
        {"id": file_id, "is_deleted": False},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc), "deleted_by_admin": admin.id}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="File not found or already deleted")
    return {"success": True, "id": file_id}


@router.post("/{file_id}/restore")
async def restore_file(file_id: str, admin: AdminUser = Depends(get_current_admin)):
    res = await db.files.update_one(
        {"id": file_id, "is_deleted": True},
        {"$set": {"is_deleted": False, "restored_at": datetime.now(timezone.utc), "restored_by_admin": admin.id}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="File not found or not deleted")
    return {"success": True, "id": file_id}


@router.post("/{file_id}/replace")
async def replace_file(
    file_id: str,
    file: UploadFile = File(...),
    admin: AdminUser = Depends(get_current_admin),
):
    """Upload a new version. Storage has no rename — we put a new path and
    update the DB pointer. Old blob stays as orphaned data (cheap)."""
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    ext = _ext(file.filename or "")
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Extension '.{ext}' not allowed")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large")

    new_path = ss.make_storage_path(record.get("category", "uploads"), ext)
    content_type = file.content_type or _content_type_for(ext)
    try:
        result = ss.put_object(new_path, data, content_type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {e}")

    now = datetime.now(timezone.utc)
    await db.files.update_one(
        {"id": file_id},
        {
            "$set": {
                "storage_path": result.get("path", new_path),
                "previous_storage_path": record["storage_path"],
                "original_filename": file.filename or record.get("original_filename"),
                "content_type": content_type,
                "size_bytes": int(result.get("size", len(data))),
                "etag": result.get("etag"),
                "replaced_by_admin": admin.id,
                "replaced_at": now,
                "updated_at": now,
            }
        }
    )
    return {"success": True, "id": file_id}


@router.post("/{file_id}/attach")
async def attach_file(
    file_id: str,
    req: AttachRequest,
    admin: AdminUser = Depends(get_current_admin),
):
    """Link this file to a product or order. Stored in db.files.attachments[]
    so admins can see/manage attachments per file. Independent of fulfillment,
    webhooks, or order status (per soft-launch spec)."""
    if req.target_type not in ("product", "order"):
        raise HTTPException(status_code=400, detail="target_type must be 'product' or 'order'")
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0, "id": 1})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    attach = {
        "id": str(uuid.uuid4()),
        "target_type": req.target_type,
        "target_id": req.target_id,
        "role": (req.role or "").strip() or None,
        "attached_by_admin": admin.id,
        "attached_at": datetime.now(timezone.utc),
    }
    await db.files.update_one({"id": file_id}, {"$push": {"attachments": attach}})
    return {"success": True, "attachment": {**attach, "attached_at": attach["attached_at"].isoformat()}}


@router.delete("/{file_id}/attach/{attach_id}")
async def detach_file(file_id: str, attach_id: str, admin: AdminUser = Depends(get_current_admin)):
    res = await db.files.update_one(
        {"id": file_id},
        {"$pull": {"attachments": {"id": attach_id}}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return {"success": True}


@router.post("/migrate-legacy")
async def migrate_legacy_files(
    apply: bool = Query(False, description="If false, returns a dry-run plan"),
    attach: bool = Query(True, description="Auto-attach migrated files to products via PRODUCT_FILES heuristic"),
    admin: AdminUser = Depends(get_current_admin),
):
    """One-shot migration of legacy files in /app/backend/content/ to durable
    Emergent Object Storage. Idempotent — already-migrated files are skipped
    via sha256 dedup. Set ?apply=true to actually upload."""
    try:
        from scripts.migrate_legacy_files import run_migration
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"migration module unavailable: {e}")
    try:
        summary = await run_migration(apply=apply, attach=attach)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"migration failed: {e}")
    return summary


@router.get("/{file_id}/download")
async def download_file(file_id: str, admin: AdminUser = Depends(get_current_admin)):
    """Admin-only file download. Streams from Emergent Object Storage."""
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, ctype = ss.get_object(record["storage_path"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storage read failed: {e}")
    headers = {
        "Content-Disposition": f'attachment; filename="{record.get("original_filename","download")}"'
    }
    return Response(content=data, media_type=record.get("content_type") or ctype, headers=headers)
