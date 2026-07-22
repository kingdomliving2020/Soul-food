"""Attach deliverables batch 3: AE full-workbook iPDF, AE SP M1/M2/M3 iPDFs,
YE full-workbook iPDF.
Run:  cd /app/backend && python3 -m scripts.attach_batch3
"""
import json
import os
import sys
import uuid
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import storage_service as ss  # noqa: E402

MANIFEST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "seed_files_manifest.json")
BASE = "https://customer-assets-cm19k8pv.emergentagent.net/job_6c5176de-7072-4dca-9123-bc2e146a4fe6/artifacts"

# (url, target_key, filename, content_type, ext)
JOBS = [
    (f"{BASE}/ineyndo3_BKFT_AE_FullWorkbook.pdf", "breakfast-ae-full-ipdf", "BKFT_AE_FullWorkbook.pdf", "application/pdf", "pdf"),
    (f"{BASE}/5j3rjk1w_BKFT_AE_SnackPack_Month1.pdf", "breakfast-ae-month1-snackpack-ipdf", "BKFT_AE_SnackPack_Month1.pdf", "application/pdf", "pdf"),
    (f"{BASE}/irqeu2ty_BKFT_AE_SnackPack_Month2.pdf", "breakfast-ae-month2-snackpack-ipdf", "BKFT_AE_SnackPack_Month2.pdf", "application/pdf", "pdf"),
    (f"{BASE}/qxdg4xt5_BKFT_AE_SnackPack_Month3.pdf", "breakfast-ae-month3-snackpack-ipdf", "BKFT_AE_SnackPack_Month3.pdf", "application/pdf", "pdf"),
    (f"{BASE}/3cm0666c_BKFT_YE_FullWorkbook.pdf", "breakfast-ye-full-ipdf", "BKFT_YE_FullWorkbook.pdf", "application/pdf", "pdf"),
]

SIG = {"application/epub+zip": b"PK", "application/pdf": b"%PDF"}


def download(url, ct):
    r = requests.get(url, timeout=180)
    r.raise_for_status()
    data = r.content
    if not data.startswith(SIG[ct]):
        raise RuntimeError(f"bad signature for {url}: {data[:6]!r}")
    return data


def main():
    db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    with open(MANIFEST) as f:
        manifest = json.load(f)
    items = manifest["items"]

    def man_by_target(key):
        for it in items:
            for a in it.get("attachments", []):
                if a.get("target_id") == key:
                    return it
        return None

    summary = []
    for url, key, fname, ct, ext in JOBS:
        data = download(url, ct)
        size = len(data)
        role = "ipdf" if ct == "application/pdf" else "epub"
        label = "iPDF" if role == "ipdf" else "ePub"

        doc = db.files.find_one({"attachments.target_id": key})
        if doc:
            storage_path = doc["storage_path"]
            resp = ss.put_object(storage_path, data, ct)
            etag = (resp or {}).get("etag")
            db.files.update_one({"_id": doc["_id"]}, {"$set": {
                "original_filename": fname, "content_type": ct, "size_bytes": size,
                "etag": etag, "is_deleted": False, "updated_at": now,
                "description": f"{label} deliverable for {key}"}})
            file_id, action = doc.get("id"), "updated"
        else:
            storage_path = ss.make_storage_path("downloads", ext)
            resp = ss.put_object(storage_path, data, ct)
            etag = (resp or {}).get("etag")
            file_id = str(uuid.uuid4())
            db.files.insert_one({
                "id": file_id, "storage_path": storage_path, "category": "downloads",
                "original_filename": fname, "content_type": ct, "size_bytes": size,
                "etag": etag, "description": f"{label} deliverable for {key}",
                "is_deleted": False, "uploaded_by_admin": "deliverable-batch-2026-07",
                "uploaded_by_email": "system@migration", "created_at": now, "updated_at": now,
                "attachments": [{"id": str(uuid.uuid4()), "target_type": "product",
                                 "target_id": key, "role": role, "attached_at": now,
                                 "attached_by_admin": "deliverable-batch-2026-07"}]})
            action = "inserted"

        entry = {"id": file_id, "storage_path": storage_path, "category": "downloads",
                 "original_filename": fname, "content_type": ct, "size_bytes": size,
                 "etag": etag, "description": f"{label} deliverable for {key}",
                 "is_deleted": False, "uploaded_by_admin": "deliverable-batch-2026-07",
                 "uploaded_by_email": "system@migration", "created_at": now_iso,
                 "updated_at": now_iso,
                 "attachments": [{"id": str(uuid.uuid4()), "target_type": "product",
                                  "target_id": key, "role": role, "attached_at": now_iso,
                                  "attached_by_admin": "deliverable-batch-2026-07"}]}
        m = man_by_target(key)
        if m:
            m.update({k: entry[k] for k in ("storage_path", "original_filename", "content_type",
                                            "size_bytes", "etag", "updated_at", "is_deleted", "description")})
        else:
            items.append(entry)
        summary.append((action, key, size, storage_path))

    manifest["count"] = len(items)
    manifest["generated_at"] = now_iso
    with open(MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2)

    print("=== DONE ===")
    for action, key, size, path in summary:
        print(f"{action:9} {key:38} {size:>12,}  {path}")
    print(f"manifest count -> {manifest['count']}")


if __name__ == "__main__":
    main()
