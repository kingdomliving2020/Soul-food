"""One-shot: replace the 4 existing Full-Workbook ePubs (overwrite same blob
storage_path so shared Object Storage serves new bytes in preview AND prod) and
attach the newly-added Holiday IE ePub to `holiday-ie-full-epub`.

Run:  cd /app/backend && python3 -m scripts.replace_attach_epubs
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

EPUB_CT = "application/epub+zip"
MANIFEST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "seed_files_manifest.json")

# key -> (download url, existing storage_path or None for new)
JOBS = {
    "breakfast-ae-full-epub": (
        "https://customer-assets-cm19k8pv.emergentagent.net/job_6c5176de-7072-4dca-9123-bc2e146a4fe6/artifacts/dq8wwpb8_BKFT_AE_FullWorkbook-0d551164.epub",
        "soul-food/downloads/0fd1bca6-d1f2-48e5-a3f7-574e34a4dcf4.epub",
        "BKFT_AE_FullWorkbook.epub",
    ),
    "breakfast-ye-full-epub": (
        "https://customer-assets-cm19k8pv.emergentagent.net/job_6c5176de-7072-4dca-9123-bc2e146a4fe6/artifacts/gw191sxf_BKFT_YE_FullWorkbook.epub",
        "soul-food/downloads/bd3b95e4-70bf-45bd-8337-c96e84661562.epub",
        "BKFT_YE_FullWorkbook.epub",
    ),
    "holiday-ae-full-epub": (
        "https://customer-assets-cm19k8pv.emergentagent.net/job_6c5176de-7072-4dca-9123-bc2e146a4fe6/artifacts/z0rmjjxz_HOL_4C_AE_FullWorkbook.epub",
        "soul-food/downloads/cfc4ea62-0f84-4550-a63d-5791df054cb9.epub",
        "HOL_4C_AE_FullWorkbook.epub",
    ),
    "holiday-ye-full-epub": (
        "https://customer-assets-cm19k8pv.emergentagent.net/job_6c5176de-7072-4dca-9123-bc2e146a4fe6/artifacts/cewax7py_HOL_4C_YE_FullWorkbook.epub",
        "soul-food/downloads/d164dfca-9efa-443b-a783-70534dc67ae8.epub",
        "HOL_4C_YE_FullWorkbook.epub",
    ),
    "holiday-ie-full-epub": (
        "https://customer-assets-cm19k8pv.emergentagent.net/job_6c5176de-7072-4dca-9123-bc2e146a4fe6/artifacts/2083recg_HOL_4C_IE_FullWorkbook.epub",
        None,  # new
        "HOL_4C_IE_FullWorkbook.epub",
    ),
}


def download(url: str) -> bytes:
    r = requests.get(url, timeout=180)
    r.raise_for_status()
    data = r.content
    if data[:2] != b"PK":
        raise RuntimeError(f"downloaded file is not a zip/epub (bad signature): {url}")
    return data


def main():
    client = MongoClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    with open(MANIFEST) as f:
        manifest = json.load(f)
    man_items = manifest["items"]

    def man_by_target(key):
        for it in man_items:
            for a in it.get("attachments", []):
                if a.get("target_id") == key:
                    return it
        return None

    summary = []
    for key, (url, existing_path, fname) in JOBS.items():
        data = download(url)
        size = len(data)
        if existing_path:
            storage_path = existing_path
            resp = ss.put_object(storage_path, data, EPUB_CT)
        else:
            storage_path = ss.make_storage_path("downloads", "epub")
            resp = ss.put_object(storage_path, data, EPUB_CT)
        etag = (resp or {}).get("etag") or (resp or {}).get("ETag")

        doc = db.files.find_one({"attachments.target_id": key})
        if doc:
            db.files.update_one(
                {"_id": doc["_id"]},
                {"$set": {
                    "storage_path": storage_path,
                    "original_filename": fname,
                    "content_type": EPUB_CT,
                    "size_bytes": size,
                    "etag": etag,
                    "is_deleted": False,
                    "updated_at": now,
                    "description": f"Full-workbook EPUB (ebook, non-fillable) for {key}",
                }},
            )
            file_id = doc.get("id")
            action = "updated"
        else:
            file_id = str(uuid.uuid4())
            att_id = str(uuid.uuid4())
            db.files.insert_one({
                "id": file_id,
                "storage_path": storage_path,
                "category": "downloads",
                "original_filename": fname,
                "content_type": EPUB_CT,
                "size_bytes": size,
                "etag": etag,
                "description": f"Full-workbook EPUB (ebook, non-fillable) for {key}",
                "is_deleted": False,
                "uploaded_by_admin": "epub-batch-2026-07",
                "uploaded_by_email": "system@migration",
                "created_at": now,
                "updated_at": now,
                "attachments": [{
                    "id": att_id,
                    "target_type": "product",
                    "target_id": key,
                    "role": "epub",
                    "attached_at": now,
                    "attached_by_admin": "epub-batch-2026-07",
                }],
            })
            action = "inserted"

        # --- manifest ---
        m = man_by_target(key)
        if m:
            m["storage_path"] = storage_path
            m["original_filename"] = fname
            m["content_type"] = EPUB_CT
            m["size_bytes"] = size
            m["etag"] = etag
            m["updated_at"] = now_iso
            m["is_deleted"] = False
            m["description"] = f"Full-workbook EPUB (ebook, non-fillable) for {key}"
        else:
            man_items.append({
                "id": file_id,
                "storage_path": storage_path,
                "category": "downloads",
                "original_filename": fname,
                "content_type": EPUB_CT,
                "size_bytes": size,
                "etag": etag,
                "description": f"Full-workbook EPUB (ebook, non-fillable) for {key}",
                "is_deleted": False,
                "uploaded_by_admin": "epub-batch-2026-07",
                "uploaded_by_email": "system@migration",
                "created_at": now_iso,
                "updated_at": now_iso,
                "attachments": [{
                    "id": str(uuid.uuid4()),
                    "target_type": "product",
                    "target_id": key,
                    "role": "epub",
                    "attached_at": now_iso,
                    "attached_by_admin": "epub-batch-2026-07",
                }],
            })
        summary.append((key, action, storage_path, size))

    manifest["count"] = len(man_items)
    manifest["generated_at"] = now_iso
    with open(MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2)

    print("=== DONE ===")
    for key, action, path, size in summary:
        print(f"{action:9} {key:26} {size:>12,} bytes  {path}")
    print(f"manifest count -> {manifest['count']}")


if __name__ == "__main__":
    main()
