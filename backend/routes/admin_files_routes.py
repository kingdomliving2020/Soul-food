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

# Per-file cap: 500 MB. Big enough for full instructor workbooks, large audio
# masters, video clips, and zip bundles. Object Storage handles the durability;
# this number just bounds memory in the API process.
MAX_UPLOAD_BYTES = 500 * 1024 * 1024

# Open allowlist — accept any extension. The original closed-set bias was a
# soft-launch guardrail; the admin owns the content and shouldn't be gated by
# the platform on file type. Empty extensions still upload (stored as 'bin').
# If you ever want to block something, edit BLOCKED_EXT instead.
BLOCKED_EXT: set = set()


def _ext(filename: str) -> str:
    if not filename or "." not in filename:
        return "bin"
    return filename.rsplit(".", 1)[-1].lower()


def _content_type_for(ext: str) -> str:
    return {
        "pdf": "application/pdf",
        "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "webp": "image/webp", "gif": "image/gif", "svg": "image/svg+xml",
        "bmp": "image/bmp", "tif": "image/tiff", "tiff": "image/tiff", "ico": "image/x-icon",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc": "application/msword",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xls": "application/vnd.ms-excel",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "ppt": "application/vnd.ms-powerpoint",
        "csv": "text/csv", "txt": "text/plain", "md": "text/markdown",
        "json": "application/json", "xml": "application/xml",
        "yaml": "application/x-yaml", "yml": "application/x-yaml",
        "html": "text/html", "htm": "text/html",
        "mp3": "audio/mpeg", "m4a": "audio/mp4", "wav": "audio/wav",
        "ogg": "audio/ogg", "oga": "audio/ogg", "opus": "audio/opus", "aac": "audio/aac", "flac": "audio/flac",
        "mp4": "video/mp4", "m4v": "video/mp4", "mov": "video/quicktime",
        "webm": "video/webm", "avi": "video/x-msvideo", "mkv": "video/x-matroska",
        "zip": "application/zip", "rar": "application/vnd.rar", "7z": "application/x-7z-compressed",
        "tar": "application/x-tar", "gz": "application/gzip",
        "epub": "application/epub+zip", "mobi": "application/x-mobipocket-ebook",
        "ttf": "font/ttf", "otf": "font/otf", "woff": "font/woff", "woff2": "font/woff2",
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
    """Upload a file to durable Emergent Object Storage and record in db.files.

    No file-type or amount cap. Per-file size cap is 500 MB. Use multi-select in
    the UI or call this endpoint repeatedly to upload in bulk.
    """
    ext = _ext(file.filename or "")
    if ext in BLOCKED_EXT:
        raise HTTPException(status_code=400, detail=f"Extension '.{ext}' is blocked")
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
    if ext in BLOCKED_EXT:
        raise HTTPException(status_code=400, detail=f"Extension '.{ext}' is blocked")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large ({len(data)/1024/1024:.1f} MB > {MAX_UPLOAD_BYTES/1024/1024:.0f} MB)")

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


@router.get("/export-manifest")
async def export_manifest(admin: AdminUser = Depends(get_current_admin)):
    """Export every active db.files record as a JSON manifest. Use this to
    sync preview → production: download here, then POST the JSON to
    /api/admin/files/import-manifest in the target environment.

    The blobs themselves live in Emergent Object Storage (keyed by your
    EMERGENT_LLM_KEY) and are typically reachable from any environment that
    shares the same key — so importing the manifest is enough to make every
    file appear in production's File Manager and become attachable to
    products."""
    items = []
    async for f in db.files.find({"is_deleted": False}, {"_id": 0}):
        for k in ("created_at", "updated_at", "migrated_at", "replaced_at",
                  "deleted_at", "restored_at"):
            v = f.get(k)
            if hasattr(v, "isoformat"):
                f[k] = v.isoformat()
        for a in f.get("attachments") or []:
            v = a.get("attached_at")
            if hasattr(v, "isoformat"):
                a["attached_at"] = v.isoformat()
        items.append(f)
    return {
        "ok": True,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "exported_by": getattr(admin, "email", admin.id),
        "count": len(items),
        "items": items,
    }


class ImportManifestRequest(BaseModel):
    items: list
    overwrite_attachments: bool = False  # if True, replace existing attachments on dedup


@router.post("/import-manifest")
async def import_manifest(
    payload: ImportManifestRequest,
    verify_storage: bool = Query(True, description="HEAD each storage_path; report unreachable blobs"),
    admin: AdminUser = Depends(get_current_admin),
):
    """Restore db.files records from a manifest exported elsewhere. Idempotent
    — dedup is by ``storage_path``. Existing attachments are merged unless
    ``overwrite_attachments=true``. If ``verify_storage`` is on (default), each
    blob is HEAD-ed via Emergent Object Storage and unreachable paths are
    surfaced in the response so you can re-upload them.

    This is the production-recovery path: after a redeploy where /content
    didn't ship, paste the preview's exported manifest here and every file
    re-appears, with attachments intact."""
    if not payload.items:
        raise HTTPException(status_code=400, detail="manifest 'items' is empty")

    now = datetime.now(timezone.utc)
    actor = getattr(admin, "email", admin.id)

    inserted = 0
    updated = 0
    skipped = 0
    unreachable: list = []
    errors: list = []

    for raw in payload.items:
        if not isinstance(raw, dict):
            continue
        storage_path = (raw.get("storage_path") or "").strip()
        if not storage_path:
            skipped += 1
            continue
        if verify_storage:
            try:
                if not ss.head_object(storage_path):
                    unreachable.append({
                        "storage_path": storage_path,
                        "original_filename": raw.get("original_filename"),
                    })
                    # We still write the index so the admin can fix the bytes
                    # via Replace later; but mark it for visibility.
            except Exception as e:
                errors.append({"storage_path": storage_path, "error": str(e)})

        existing = await db.files.find_one({"storage_path": storage_path}, {"_id": 0, "id": 1, "attachments": 1})
        # Build a clean record (don't trust raw _id, etc.)
        record = {
            "id": existing.get("id") if existing else (raw.get("id") or str(uuid.uuid4())),
            "storage_path": storage_path,
            "category": raw.get("category", "uploads"),
            "original_filename": raw.get("original_filename") or "manifest-import",
            "content_type": raw.get("content_type") or "application/octet-stream",
            "size_bytes": int(raw.get("size_bytes") or 0),
            "etag": raw.get("etag"),
            "description": raw.get("description") or f"Imported from manifest by {actor}",
            "is_deleted": False,
            "uploaded_by_admin": raw.get("uploaded_by_admin") or "system-manifest-import",
            "uploaded_by_email": raw.get("uploaded_by_email") or actor,
            "created_at": _to_dt(raw.get("created_at")) or now,
            "updated_at": now,
            "manifest_imported_at": now,
            "manifest_imported_by": actor,
            "legacy_path": raw.get("legacy_path"),
            "legacy_sha256": raw.get("legacy_sha256"),
        }

        # Merge attachments
        incoming = list(raw.get("attachments") or [])
        for a in incoming:
            if isinstance(a.get("attached_at"), str):
                a["attached_at"] = _to_dt(a["attached_at"]) or now

        if existing and not payload.overwrite_attachments:
            existing_keys = {(a.get("target_type"), a.get("target_id")) for a in (existing.get("attachments") or [])}
            merged = list(existing.get("attachments") or [])
            for a in incoming:
                key = (a.get("target_type"), a.get("target_id"))
                if key not in existing_keys:
                    merged.append({**a, "id": a.get("id") or str(uuid.uuid4())})
            record["attachments"] = merged
        else:
            record["attachments"] = [{**a, "id": a.get("id") or str(uuid.uuid4())} for a in incoming]

        try:
            if existing:
                await db.files.update_one({"storage_path": storage_path}, {"$set": record})
                updated += 1
            else:
                await db.files.insert_one(record)
                inserted += 1
        except Exception as e:
            errors.append({"storage_path": storage_path, "error": str(e)})

    return {
        "ok": True,
        "imported_at": now.isoformat(),
        "imported_by": actor,
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
        "unreachable_count": len(unreachable),
        "unreachable": unreachable[:50],  # cap response size
    }


@router.post("/verify-storage")
async def verify_storage(
    limit: int = Query(500, ge=1, le=5000),
    admin: AdminUser = Depends(get_current_admin),
):
    """For each active db.files record, HEAD the Object Storage path and
    report any blob that's unreachable. Use this on production after an
    import-manifest to confirm every file is actually retrievable."""
    total = 0
    reachable = 0
    unreachable: list = []
    async for f in db.files.find({"is_deleted": False}, {"_id": 0, "id": 1, "storage_path": 1, "original_filename": 1}).limit(limit):
        total += 1
        try:
            ok = ss.head_object(f.get("storage_path", ""))
        except Exception:
            ok = False
        if ok:
            reachable += 1
        else:
            unreachable.append({
                "id": f.get("id"),
                "storage_path": f.get("storage_path"),
                "original_filename": f.get("original_filename"),
            })
    return {
        "ok": True,
        "checked": total,
        "reachable": reachable,
        "unreachable_count": len(unreachable),
        "unreachable": unreachable[:200],
    }


def _to_dt(s):
    """Best-effort parse ISO datetime string → datetime. Returns None on failure."""
    if not s:
        return None
    if hasattr(s, "isoformat"):
        return s
    try:
        # python's fromisoformat handles "+00:00" but not "Z"
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except Exception:
        return None


@router.post("/repair-product-mappings")
async def repair_product_mappings(
    apply: bool = Query(False, description="If false, returns a dry-run plan"),
    admin: AdminUser = Depends(get_current_admin),
):
    """Repair or deprecate legacy db.product_file_mappings rows. Entries with a
    matching db.files product attachment are rewritten to ``objstore:<path>``;
    rows with no match are marked ``active=False`` and stamped with a reason.
    Idempotent. Set ``?apply=true`` to actually write."""
    try:
        from scripts.repair_product_mappings import run_repair
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"repair module unavailable: {e}")
    try:
        summary = await run_repair(apply=apply, actor=getattr(admin, "email", admin.id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"repair failed: {e}")
    return summary


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
