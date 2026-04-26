"""
Codes & Redemptions — system of record for batch redemption codes.

Schema (db.redemption_codes):
  code              str (unique)
  series            str | None      e.g. HOL, BKFT — None for pure game/edition codes
  edition           str             AE | YE | IE
  delivery_type     str             DIG | GAME | HOUR | SUB
  batch_id          str             logical batch identifier
  batch_size        int | None      DIG only
  sequence          int | None      DIG only
  total_hours       int | None      GAME / HOUR
  pacing            str | None      SUB
  duration_days     int | None      SUB
  max_uses          int             default 1
  uses_used         int             default 0
  status            str             ACTIVE | REDEEMED | REVOKED | EXPIRED | OVERRIDE_<...>
  expires_at        datetime | None
  notes             str
  redeemed_by_user_id   str | None
  redeemed_by_email     str | None
  redeemed_at           datetime | None
  override_status       str | None
  override_reason       str | None
  override_by_admin     str | None
  override_at           datetime | None
  imported_from_filename str
  imported_at           datetime
  created_at, updated_at
"""
import csv
import io
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

# Import the same admin auth dependency used by the rest of admin_routes
from routes.admin_routes import get_current_admin, AdminUser, log_admin_action

router = APIRouter(prefix="/api/admin/codes-redemptions", tags=["admin", "codes"])

MONGO_URL = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get("DB_NAME", "soul_food_db")]


# ---------------------------------------------------------------------------
# CSV schema auto-detection
# ---------------------------------------------------------------------------
def _detect_schema(headers: set) -> str:
    """Identify which of the 4 known CSV shapes this file is."""
    if "batch_id" in headers and "sequence" in headers:
        return "student_batch"
    if "duration_days" in headers and "pacing" in headers:
        return "subscription"
    if "total_hours" in headers and "series" in headers:
        return "hour_seasonal"
    if "total_hours" in headers and "series" not in headers:
        return "game_only"
    return "unknown"


def _row_to_doc(row: dict, schema: str, filename: str, now: datetime) -> dict:
    """Map a CSV row into the redemption_codes shape based on detected schema."""
    def _i(val, default=None):
        try:
            return int(val) if val not in (None, "") else default
        except (TypeError, ValueError):
            return default

    code = (row.get("code") or "").strip()
    if not code:
        return None

    base = {
        "code": code,
        "series": (row.get("series") or "").strip() or None,
        "edition": (row.get("edition") or "").strip().upper() or None,
        "delivery_type": (row.get("delivery_type") or "").strip().upper() or None,
        "max_uses": _i(row.get("max_uses"), 1),
        "uses_used": _i(row.get("uses_used"), 0),
        "status": (row.get("status") or "ACTIVE").strip().upper(),
        "expires_at": (row.get("expires_at") or "").strip() or None,
        "notes": (row.get("notes") or "").strip(),
        "imported_from_filename": filename,
        "imported_at": now,
        "created_at": now,
        "updated_at": now,
        "schema_kind": schema,
    }

    if schema == "student_batch":
        base["batch_id"] = (row.get("batch_id") or "").strip() or None
        base["batch_size"] = _i(row.get("batch_size"))
        base["sequence"] = _i(row.get("sequence"))
    elif schema in ("game_only", "hour_seasonal"):
        base["total_hours"] = _i(row.get("total_hours"))
        # synthesize a batch_id when missing so aggregation buckets correctly
        base.setdefault(
            "batch_id",
            f"{base.get('series') or 'GENERIC'}-{base.get('edition')}-{base.get('delivery_type')}-H{base.get('total_hours')}",
        )
    elif schema == "subscription":
        base["pacing"] = (row.get("pacing") or "").strip() or None
        base["duration_days"] = _i(row.get("duration_days"))
        base.setdefault(
            "batch_id",
            f"{base.get('series') or 'GENERIC'}-{base.get('edition')}-SUB-{base.get('pacing')}-D{base.get('duration_days')}",
        )

    return base


# ---------------------------------------------------------------------------
# POST /import-csv  — multipart upload, idempotent dedupe by code
# ---------------------------------------------------------------------------
@router.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...),
    admin: AdminUser = Depends(get_current_admin),
):
    """Import a redemption-code CSV. Auto-detects which of the 4 schemas it is.
    Idempotent: existing codes are skipped (not overwritten)."""
    raw = (await file.read()).decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(raw))
    headers = set(reader.fieldnames or [])
    if "code" not in headers:
        raise HTTPException(400, "CSV missing required 'code' column")

    schema = _detect_schema(headers)
    if schema == "unknown":
        raise HTTPException(400, f"Unable to detect schema. Headers: {sorted(headers)}")

    now = datetime.now(timezone.utc)
    inserted = 0
    skipped = 0
    invalid = 0

    for row in reader:
        doc = _row_to_doc(row, schema, file.filename or "uploaded.csv", now)
        if not doc:
            invalid += 1
            continue
        existing = await db.redemption_codes.find_one({"code": doc["code"]}, {"_id": 0, "code": 1})
        if existing:
            skipped += 1
            continue
        await db.redemption_codes.insert_one(doc)
        inserted += 1

    summary = {
        "filename": file.filename,
        "schema_detected": schema,
        "inserted": inserted,
        "skipped_duplicates": skipped,
        "invalid_rows": invalid,
    }
    await log_admin_action("import_redemption_codes", admin.id, "redemption_codes", file.filename, summary)
    return {"message": "Import complete", **summary}


# ---------------------------------------------------------------------------
# GET /batches — aggregated batch list
# ---------------------------------------------------------------------------
@router.get("/batches")
async def list_batches(admin: AdminUser = Depends(get_current_admin)):
    """Aggregate codes into batches with totals."""
    pipeline = [
        {
            "$group": {
                "_id": {
                    "batch_id": "$batch_id",
                    "series": "$series",
                    "edition": "$edition",
                    "delivery_type": "$delivery_type",
                    "schema_kind": "$schema_kind",
                },
                "total": {"$sum": 1},
                "redeemed": {
                    "$sum": {"$cond": [{"$eq": ["$status", "REDEEMED"]}, 1, 0]}
                },
                "active": {
                    "$sum": {"$cond": [{"$eq": ["$status", "ACTIVE"]}, 1, 0]}
                },
                "revoked": {
                    "$sum": {"$cond": [{"$eq": ["$status", "REVOKED"]}, 1, 0]}
                },
                "imported_from": {"$first": "$imported_from_filename"},
                "imported_at": {"$first": "$imported_at"},
                "total_hours": {"$first": "$total_hours"},
                "duration_days": {"$first": "$duration_days"},
                "pacing": {"$first": "$pacing"},
            }
        },
        {"$sort": {"_id.delivery_type": 1, "_id.series": 1, "_id.edition": 1, "_id.batch_id": 1}},
    ]
    rows = []
    async for r in db.redemption_codes.aggregate(pipeline):
        meta = r["_id"]
        total = r["total"]
        redeemed = r["redeemed"]
        rows.append({
            "batch_id": meta.get("batch_id") or "(no-batch)",
            "series": meta.get("series"),
            "edition": meta.get("edition"),
            "delivery_type": meta.get("delivery_type"),
            "schema_kind": meta.get("schema_kind"),
            "total": total,
            "redeemed": redeemed,
            "remaining": total - redeemed - r.get("revoked", 0),
            "active": r.get("active", 0),
            "revoked": r.get("revoked", 0),
            "total_hours": r.get("total_hours"),
            "duration_days": r.get("duration_days"),
            "pacing": r.get("pacing"),
            "imported_from": r.get("imported_from"),
            "imported_at": r.get("imported_at").isoformat() if hasattr(r.get("imported_at"), "isoformat") else r.get("imported_at"),
        })
    return {"batches": rows, "total_batches": len(rows)}


# ---------------------------------------------------------------------------
# GET /batches/{batch_id}/codes — codes within a batch
# ---------------------------------------------------------------------------
@router.get("/batches/{batch_id}/codes")
async def list_batch_codes(
    batch_id: str,
    series: Optional[str] = Query(None),
    edition: Optional[str] = Query(None),
    delivery_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(500, le=2000),
    admin: AdminUser = Depends(get_current_admin),
):
    """List individual codes within a batch, scoped to the same
    (series, edition, delivery_type) tuple shown on the batch row."""
    q = {"batch_id": batch_id}
    if series is not None:
        q["series"] = series if series else None
    if edition:
        q["edition"] = edition.upper()
    if delivery_type:
        q["delivery_type"] = delivery_type.upper()
    if status:
        q["status"] = status.upper()
    docs = await db.redemption_codes.find(q, {"_id": 0}).sort("sequence", 1).limit(limit).to_list(limit)
    for d in docs:
        for k in ("imported_at", "redeemed_at", "override_at", "created_at", "updated_at", "expires_at"):
            v = d.get(k)
            if hasattr(v, "isoformat"):
                d[k] = v.isoformat()
    return {"batch_id": batch_id, "filter": {"series": series, "edition": edition, "delivery_type": delivery_type, "status": status}, "count": len(docs), "codes": docs}


# ---------------------------------------------------------------------------
# PATCH /codes/{code}/override — admin override (status + reason)
# ---------------------------------------------------------------------------
class OverrideRequest(BaseModel):
    status: str = Field(..., pattern="^(ACTIVE|REVOKED|EXPIRED|RESTORED)$")
    reason: str = Field(..., min_length=2, max_length=500)


@router.patch("/codes/{code}/override")
async def override_code(
    code: str,
    req: OverrideRequest,
    admin: AdminUser = Depends(get_current_admin),
):
    existing = await db.redemption_codes.find_one({"code": code}, {"_id": 0, "code": 1, "status": 1})
    if not existing:
        raise HTTPException(404, f"Code not found: {code}")

    # RESTORED is a synthetic action that flips status back to ACTIVE while keeping audit
    target_status = "ACTIVE" if req.status == "RESTORED" else req.status

    update = {
        "status": target_status,
        "override_status": req.status,
        "override_reason": req.reason,
        "override_by_admin": admin.id,
        "override_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    res = await db.redemption_codes.update_one({"code": code}, {"$set": update})
    await log_admin_action(
        "override_redemption_code", admin.id, "redemption_codes", code,
        {"from_status": existing.get("status"), "to_status": target_status, "reason": req.reason},
    )
    return {"code": code, "status": target_status, "override_reason": req.reason, "modified": res.modified_count}


# ---------------------------------------------------------------------------
# GET /codes/{code} — single code detail
# ---------------------------------------------------------------------------
@router.get("/codes/{code}")
async def get_code(code: str, admin: AdminUser = Depends(get_current_admin)):
    doc = await db.redemption_codes.find_one({"code": code}, {"_id": 0})
    if not doc:
        raise HTTPException(404, f"Code not found: {code}")
    for k in ("imported_at", "redeemed_at", "override_at", "created_at", "updated_at", "expires_at"):
        v = doc.get(k)
        if hasattr(v, "isoformat"):
            doc[k] = v.isoformat()
    return doc
