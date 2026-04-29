"""
Legacy Files → Emergent Object Storage migration.

Walks /app/backend/content/ recursively, uploads each file to durable
Emergent Object Storage via storage_service.put_object, and writes a
record into db.files using the same schema as the Admin File Manager.

Idempotent — re-runs are safe. Dedup key is sha256 of file bytes
stamped onto the record as `legacy_sha256`. Files already migrated are
skipped.

Auto-attach policy (per user choice "c — skip anything ambiguous"):
  * For files under /content/downloads/, look up the relative path in
    payment_routes.PRODUCT_FILES (inverse index).
  * If exactly one unique relative-path → ≥1 product_ids, attach to all
    those product_ids with role="legacy".
  * Anything outside /downloads/ (holiday/, bonus/, images/, etc.) is
    left unattached — admin can wire those manually in the File Manager.

Run modes:
  python migrate_legacy_files.py             # dry-run, prints plan
  python migrate_legacy_files.py --apply     # actually migrate
  python migrate_legacy_files.py --apply --no-attach   # skip auto-attach

Also exposes `run_migration(apply: bool, attach: bool) -> dict` so the
admin endpoint can call it without spawning a subprocess.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# allow running both as `python migrate_legacy_files.py` and as a module
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("migrate_legacy_files")

CONTENT_ROOT = BACKEND_DIR / "content"
DOWNLOADS_ROOT = CONTENT_ROOT / "downloads"

ALLOWED_EXT = {
    "pdf", "png", "jpg", "jpeg", "webp", "gif", "svg",
    "docx", "doc", "csv", "txt", "md", "json", "mp3", "m4a", "wav",
}

CONTENT_TYPE_MAP = {
    "pdf": "application/pdf",
    "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "webp": "image/webp", "gif": "image/gif", "svg": "image/svg+xml",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc": "application/msword",
    "csv": "text/csv", "txt": "text/plain", "md": "text/markdown",
    "json": "application/json",
    "mp3": "audio/mpeg", "m4a": "audio/mp4", "wav": "audio/wav",
}


def _ext(name: str) -> str:
    return name.rsplit(".", 1)[-1].lower() if "." in name else "bin"


def _category_for(rel_path: Path) -> str:
    """Folder-derived category, e.g. holiday, bonus, downloads-games, images-maps."""
    parts = list(rel_path.parts[:-1])
    if not parts:
        return "uploads"
    # Slug-ify parts so it stays alnum/dash
    slug = "-".join("".join(c if c.isalnum() or c in ("-", "_") else "-" for c in p) for p in parts)
    return slug or "uploads"


def _build_product_inverse_index() -> dict[str, list[str]]:
    """{ relative_path_under_downloads.lower(): [product_id, ...] }."""
    try:
        from payment_routes import PRODUCT_FILES  # type: ignore
    except Exception as e:
        logger.warning("Could not import PRODUCT_FILES (%s) — auto-attach disabled", e)
        return {}
    inv: dict[str, list[str]] = {}
    for pid, rel in PRODUCT_FILES.items():
        if not isinstance(rel, str):
            continue
        key = rel.lower().lstrip("/")
        inv.setdefault(key, []).append(pid)
    return inv


async def _migrate_one(
    db,
    abs_path: Path,
    rel_path: Path,
    product_inverse: dict[str, list[str]],
    apply: bool,
    attach: bool,
) -> dict:
    """Return a per-file result dict. Does NOT raise; logs and reports."""
    import storage_service as ss  # local import: needs env loaded first

    name = abs_path.name
    ext = _ext(name)
    if ext not in ALLOWED_EXT:
        return {"path": str(rel_path), "status": "skipped_ext", "reason": f".{ext} not allowed"}

    try:
        data = abs_path.read_bytes()
    except Exception as e:
        return {"path": str(rel_path), "status": "error", "reason": f"read failed: {e}"}

    sha = hashlib.sha256(data).hexdigest()

    # Idempotency: same file already migrated?
    existing = await db.files.find_one(
        {"legacy_sha256": sha, "is_deleted": False},
        {"_id": 0, "id": 1, "storage_path": 1, "attachments": 1, "original_filename": 1},
    )
    if existing:
        # Optionally back-fill missing auto-attachments on prior migrated record.
        attachments_added = []
        if attach:
            attachments_added = await _maybe_attach(
                db, existing["id"], rel_path, product_inverse, existing.get("attachments") or [], apply
            )
        return {
            "path": str(rel_path),
            "status": "already_migrated",
            "file_id": existing["id"],
            "auto_attached": attachments_added,
        }

    if not apply:
        return {"path": str(rel_path), "status": "would_migrate", "size": len(data)}

    # Upload bytes
    storage_path = ss.make_storage_path(_category_for(rel_path), ext)
    content_type = CONTENT_TYPE_MAP.get(ext, "application/octet-stream")
    try:
        result = ss.put_object(storage_path, data, content_type)
    except Exception as e:
        return {"path": str(rel_path), "status": "upload_failed", "reason": str(e)}

    file_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    record = {
        "id": file_id,
        "storage_path": result.get("path", storage_path),
        "category": _category_for(rel_path),
        "original_filename": name,
        "content_type": content_type,
        "size_bytes": int(result.get("size", len(data))),
        "etag": result.get("etag"),
        "description": f"Migrated from /app/backend/content/{rel_path}",
        "is_deleted": False,
        "uploaded_by_admin": "system-migration",
        "uploaded_by_email": "system@migration",
        "created_at": now,
        "updated_at": now,
        "attachments": [],
        # migration provenance
        "legacy_path": str(rel_path),
        "legacy_sha256": sha,
        "migrated_at": now,
    }
    await db.files.insert_one(record)

    attachments_added = []
    if attach:
        attachments_added = await _maybe_attach(db, file_id, rel_path, product_inverse, [], apply)

    return {
        "path": str(rel_path),
        "status": "migrated",
        "file_id": file_id,
        "size": len(data),
        "auto_attached": attachments_added,
    }


async def _maybe_attach(
    db, file_id: str, rel_path: Path, inverse: dict[str, list[str]],
    existing_attachments: list, apply: bool,
) -> list[str]:
    """Auto-attach if the legacy path is unambiguously a product file.

    Strategy:
      * Only files under content/downloads/ are eligible.
      * Lookup key = path relative to downloads/, lowercased.
      * If found, attach to every product_id mapped to that exact key (these
        are aliases for the same file, so it's safe — no ambiguity).
      * Anything else → skip.
    """
    if not inverse:
        return []
    # Need path relative to /content/downloads/
    parts = rel_path.parts
    if not parts or parts[0] != "downloads":
        return []
    key = "/".join(parts[1:]).lower()
    candidates = inverse.get(key)
    if not candidates:
        return []
    existing_targets = {(a.get("target_type"), a.get("target_id")) for a in (existing_attachments or [])}
    added: list[str] = []
    for pid in candidates:
        if ("product", pid) in existing_targets:
            continue
        attach = {
            "id": str(uuid.uuid4()),
            "target_type": "product",
            "target_id": pid,
            "role": "legacy",
            "attached_by_admin": "system-migration",
            "attached_at": datetime.now(timezone.utc),
        }
        if apply:
            await db.files.update_one({"id": file_id}, {"$push": {"attachments": attach}})
        added.append(pid)
    return added


async def run_migration(apply: bool = False, attach: bool = True) -> dict:
    """Programmatic entry-point. Returns a summary dict."""
    # Lazy DB import so the script can run before server.py is loaded
    from motor.motor_asyncio import AsyncIOMotorClient

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        raise RuntimeError("MONGO_URL or DB_NAME missing from environment")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    if not CONTENT_ROOT.exists():
        return {"ok": False, "error": f"content root {CONTENT_ROOT} does not exist", "results": []}

    inverse = _build_product_inverse_index() if attach else {}
    logger.info("Auto-attach inverse index: %d entries", len(inverse))

    files = sorted(p for p in CONTENT_ROOT.rglob("*") if p.is_file())
    logger.info("Found %d files under %s", len(files), CONTENT_ROOT)

    results: list[dict] = []
    for abs_path in files:
        rel_path = abs_path.relative_to(CONTENT_ROOT)
        try:
            r = await _migrate_one(db, abs_path, rel_path, inverse, apply=apply, attach=attach)
        except Exception as e:
            r = {"path": str(rel_path), "status": "error", "reason": str(e)}
        results.append(r)

    summary = {
        "ok": True,
        "apply": apply,
        "attach": attach,
        "total": len(results),
        "migrated": sum(1 for r in results if r["status"] == "migrated"),
        "already_migrated": sum(1 for r in results if r["status"] == "already_migrated"),
        "would_migrate": sum(1 for r in results if r["status"] == "would_migrate"),
        "skipped_ext": sum(1 for r in results if r["status"] == "skipped_ext"),
        "errors": sum(1 for r in results if r["status"] in ("error", "upload_failed")),
        "auto_attached_count": sum(len(r.get("auto_attached") or []) for r in results),
        "results": results,
    }
    return summary


def _print_summary(s: dict) -> None:
    logger.info("=== Migration summary ===")
    for k in ("apply", "attach", "total", "migrated", "already_migrated",
              "would_migrate", "skipped_ext", "errors", "auto_attached_count"):
        logger.info("  %-20s %s", k, s.get(k))
    errs = [r for r in s["results"] if r["status"] in ("error", "upload_failed")]
    if errs:
        logger.info("--- error rows ---")
        for r in errs:
            logger.info("  %s — %s — %s", r["path"], r["status"], r.get("reason"))


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Actually upload + insert records (default is dry-run)")
    ap.add_argument("--no-attach", action="store_true", help="Disable product auto-attach heuristic")
    args = ap.parse_args(argv)

    summary = asyncio.run(run_migration(apply=args.apply, attach=not args.no_attach))
    _print_summary(summary)
    return 0 if summary.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
