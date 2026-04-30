"""
Emergent Object Storage wrapper.
Durable file storage that survives container redeploys — pod filesystem is not
durable, so all admin-uploaded content (PDFs, images, docx) goes through here.
Per Emergent integration playbook (Apr 2026):
  - One init call returns a session-scoped storage_key
  - PUT /objects/{path} for upload, GET /objects/{path} for download
  - No delete API → soft-delete in DB (db.files)
  - No rename API → upload new path, update DB reference
  - All access via backend (no presigned URLs)
"""
from __future__ import annotations

import logging
import os
import uuid
from typing import Optional, Tuple

import requests

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "soul-food"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

_storage_key: Optional[str] = None


def init_storage() -> str:
    """Init once at startup; safe to call repeatedly. Returns the session-scoped
    storage_key. Raises on failure."""
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY not set in backend env — cannot init Emergent Object Storage")
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    logger.info("Emergent Object Storage initialized")
    return _storage_key


def _refresh_key() -> str:
    """Force-rotate the storage key (called on 403)."""
    global _storage_key
    _storage_key = None
    return init_storage()


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload bytes. Returns the storage response dict (includes 'path', 'size', 'etag').
    Auto-retries once on a 403 (key expired)."""
    key = init_storage()
    for attempt in range(2):
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
        if resp.status_code == 403 and attempt == 0:
            key = _refresh_key()
            continue
        resp.raise_for_status()
        return resp.json()
    resp.raise_for_status()  # type: ignore
    return {}


def get_object(path: str) -> Tuple[bytes, str]:
    """Download bytes. Returns (content_bytes, content_type)."""
    key = init_storage()
    for attempt in range(2):
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=120,
        )
        if resp.status_code == 403 and attempt == 0:
            key = _refresh_key()
            continue
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
    resp.raise_for_status()  # type: ignore
    return b"", "application/octet-stream"


def head_object(path: str) -> bool:
    """Lightweight existence check. Tries HEAD first; falls back to a 1-byte
    range GET if HEAD is unsupported by the storage backend. Returns True/False.
    Never raises — use this for pre-fulfillment verification where network
    errors should be treated as 'not retrievable' rather than fatal."""
    if not path:
        return False
    try:
        key = init_storage()
    except Exception as e:
        logger.warning("head_object init failed for %s: %s", path, e)
        return False
    for attempt in range(2):
        try:
            resp = requests.head(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key},
                timeout=15,
                allow_redirects=True,
            )
        except Exception as e:
            logger.warning("head_object HEAD failed for %s: %s", path, e)
            return False
        if resp.status_code == 200:
            return True
        if resp.status_code == 404:
            return False
        if resp.status_code == 403 and attempt == 0:
            try:
                key = _refresh_key()
            except Exception as e:
                logger.warning("head_object refresh key failed: %s", e)
                return False
            continue
        # HEAD may be unsupported (405) — try a 1-byte range GET
        if resp.status_code in (405, 501):
            try:
                gr = requests.get(
                    f"{STORAGE_URL}/objects/{path}",
                    headers={"X-Storage-Key": key, "Range": "bytes=0-0"},
                    timeout=15,
                    stream=True,
                )
                return gr.status_code in (200, 206)
            except Exception as e:
                logger.warning("head_object range-get fallback failed for %s: %s", path, e)
                return False
        logger.warning("head_object unexpected status %s for %s", resp.status_code, path)
        return False
    return False


def make_storage_path(category: str, ext: str) -> str:
    """Generate a UUID-based storage path with app + category prefix."""
    safe_ext = (ext or "bin").lstrip(".").lower()[:8] or "bin"
    return f"{APP_NAME}/{category}/{uuid.uuid4()}.{safe_ext}"
