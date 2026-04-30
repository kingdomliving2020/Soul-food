"""
Repair legacy db.product_file_mappings entries.

As of Apr 30, 2026 this collection is DEPRECATED — the single source of
truth for product↔file bindings is now ``db.files.attachments[]`` (written
via the Admin File Manager / migration script). ``get_pdf_path_async()``
no longer reads it.

This script cleans up the stale rows so admins inspecting MongoDB don't
see misleading ``/app/content/...`` paths that haven't existed since the
content directory was relocated.

For each row:
  1. Look up a matching file in ``db.files`` by product attachment.
  2. If match → set ``file_path = objstore:<storage_path>`` and refresh
     ``filename`` to the Object Storage original_filename. Stamp
     ``repaired_at`` + ``repaired_by``.
  3. If no match → mark ``active = False`` and stamp ``deprecated_at``
     so the broken local path is no longer advertised anywhere.

Idempotent. Modes:
  python repair_product_mappings.py                # dry-run
  python repair_product_mappings.py --apply        # actually write

Also exposes ``run_repair(apply: bool) -> dict`` for the admin endpoint.
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("repair_product_mappings")


async def _find_objstore_for_product(db, product_id: str) -> Optional[dict]:
    """Find the most recent db.files doc attached to product:product_id."""
    if not product_id:
        return None
    return await db.files.find_one(
        {
            "is_deleted": False,
            "attachments": {
                "$elemMatch": {"target_type": "product", "target_id": product_id}
            },
        },
        {"_id": 0, "id": 1, "storage_path": 1, "original_filename": 1, "content_type": 1},
        sort=[("created_at", -1)],
    )


async def run_repair(apply: bool = False, actor: str = "system-repair") -> dict:
    """Programmatic entry-point. Returns a summary dict."""
    from motor.motor_asyncio import AsyncIOMotorClient

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        raise RuntimeError("MONGO_URL or DB_NAME missing from environment")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    now = datetime.now(timezone.utc)
    results: list[dict] = []

    async for row in db.product_file_mappings.find({}, {"_id": 0}):
        pid = row.get("product_id") or ""
        existing_path = row.get("file_path") or ""

        # Already repaired? Skip cleanly.
        if existing_path.startswith("objstore:"):
            results.append({"product_id": pid, "status": "already_objstore", "file_path": existing_path})
            continue

        obj = await _find_objstore_for_product(db, pid)
        if obj and obj.get("storage_path"):
            new_path = f"objstore:{obj['storage_path']}"
            new_filename = obj.get("original_filename") or row.get("filename", "")
            if apply:
                await db.product_file_mappings.update_one(
                    {"product_id": pid},
                    {
                        "$set": {
                            "file_path": new_path,
                            "filename": new_filename,
                            "active": True,
                            "updated_at": now,
                            "repaired_at": now,
                            "repaired_by": actor,
                            "repaired_from": existing_path,
                        }
                    },
                )
            results.append({
                "product_id": pid,
                "status": "repaired",
                "from": existing_path,
                "to": new_path,
                "filename": new_filename,
            })
        else:
            if apply:
                await db.product_file_mappings.update_one(
                    {"product_id": pid},
                    {
                        "$set": {
                            "active": False,
                            "updated_at": now,
                            "deprecated_at": now,
                            "deprecated_reason": "no matching db.files attachment; legacy /app/content/ path no longer valid",
                            "deprecated_by": actor,
                        }
                    },
                )
            results.append({
                "product_id": pid,
                "status": "deprecated_no_match",
                "from": existing_path,
            })

    summary = {
        "ok": True,
        "apply": apply,
        "total": len(results),
        "repaired": sum(1 for r in results if r["status"] == "repaired"),
        "deprecated_no_match": sum(1 for r in results if r["status"] == "deprecated_no_match"),
        "already_objstore": sum(1 for r in results if r["status"] == "already_objstore"),
        "results": results,
    }
    return summary


def _print_summary(s: dict) -> None:
    logger.info("=== Repair summary ===")
    for k in ("apply", "total", "repaired", "deprecated_no_match", "already_objstore"):
        logger.info("  %-20s %s", k, s.get(k))
    no_match = [r for r in s["results"] if r["status"] == "deprecated_no_match"]
    if no_match:
        logger.info("--- rows deprecated (no db.files attachment) ---")
        for r in no_match[:25]:
            logger.info("  %s  (was: %s)", r["product_id"], r.get("from"))
        if len(no_match) > 25:
            logger.info("  ... %d more", len(no_match) - 25)


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Actually write to the DB (default is dry-run)")
    args = ap.parse_args(argv)
    summary = asyncio.run(run_repair(apply=args.apply))
    _print_summary(summary)
    return 0 if summary.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
