"""
Codes & Redemptions — system of record for batch redemption codes.

Schema (db.redemption_codes):
  code              str (unique)
  code_type         str             batch | demo | test  (default: batch)
  series            str | None      e.g. HOL, BKFT — None for pure game/edition codes
  edition           str             AE | YE | IE
  delivery_type     str             DIG | GAME | HOUR | SUB | DEMO | DOLLAR_TEST
  batch_id          str             logical batch identifier
  batch_size        int | None      DIG only
  sequence          int | None      DIG only
  total_hours       int | None      GAME / HOUR / demo
  session_cap_minutes int | None    demo (per-session cap)
  series_allowed    list[str] | None demo (e.g. ["BKFT","HOL"])
  preview_only      bool | None     demo (true → no full downloads, no fulfillment)
  unlocks           list[str] | None demo (preview-mode flags)
  pacing            str | None      SUB
  duration_days     int | None      SUB
  max_uses          int             default 1; 0 means unlimited
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
  imported_by_admin_email str | None
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
db = client[os.environ["DB_NAME"]]


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
        "code_type": "batch",
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

    importer_email = getattr(admin, "email", None) or getattr(admin, "id", None)
    for row in reader:
        doc = _row_to_doc(row, schema, file.filename or "uploaded.csv", now)
        if not doc:
            invalid += 1
            continue
        doc["imported_by_admin_email"] = importer_email
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


async def _auto_expire_due_codes() -> int:
    """Cheap expire-on-read sweep: any ACTIVE code whose expires_at is in the past
    is flipped to EXPIRED. No cron — runs at the top of each list endpoint."""
    now = datetime.now(timezone.utc)
    res = await db.redemption_codes.update_many(
        {"status": "ACTIVE", "expires_at": {"$ne": None, "$lt": now}},
        {"$set": {"status": "EXPIRED", "updated_at": now}},
    )
    return res.modified_count


# ---------------------------------------------------------------------------
# GET /batches — aggregated batch list
# ---------------------------------------------------------------------------
@router.get("/batches")
async def list_batches(admin: AdminUser = Depends(get_current_admin)):
    """Aggregate codes into batches with totals. Scoped to code_type=batch
    (and legacy docs without code_type, treated as batch)."""
    await _auto_expire_due_codes()
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"code_type": "batch"},
                    {"code_type": {"$exists": False}},
                    {"code_type": None},
                ]
            }
        },
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
                "imported_by": {"$first": "$imported_by_admin_email"},
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
            "imported_by": r.get("imported_by"),
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



# ---------------------------------------------------------------------------
# Demo & Test code seed + listing
# ---------------------------------------------------------------------------
# April 28, 2026 11:59 PM Eastern (EDT, UTC-4) → 2026-04-29 03:59:00 UTC
DOLLAR_TEST_EXPIRES_UTC = datetime(2026, 4, 29, 3, 59, 0, tzinfo=timezone.utc)

DEMO_CODES_DEF = [
    {"code": "DEMOSOFU79", "total_hours": 25},
    {"code": "DEMOSOFU77", "total_hours": 25},
    {"code": "DEMOSOFU80", "total_hours": 5},
    {"code": "DEMOSOFU97", "total_hours": 5},
    {"code": "DEMOSOFU60", "total_hours": 5},
    {"code": "DEMOSOFU55", "total_hours": 5},
]

TEST_CODES_DEF = [
    {"code": "BETADOLLAR79"},
    {"code": "BETADOLLAR97"},
]

DEMO_UNLOCKS = [
    "preview_answer_keys",
    "preview_one_map",
    "preview_offline_cards",
    "presenter_games_enabled",
]


def _build_demo_doc(code: str, total_hours: int, now: datetime, admin_email: Optional[str]) -> dict:
    return {
        "code": code,
        "code_type": "demo",
        "series": None,
        "edition": "IE",
        "delivery_type": "DEMO",
        "batch_id": "DEMO-INTERNAL",
        "total_hours": total_hours,
        "session_cap_minutes": 90,
        "series_allowed": ["BKFT", "HOL"],
        "preview_only": True,
        "unlocks": DEMO_UNLOCKS,
        "max_uses": 5,
        "uses_used": 0,
        "status": "ACTIVE",
        "expires_at": None,
        "notes": "Internal preview — IE in preview mode only; no full downloads; no fulfillment.",
        "imported_from_filename": "seed:demo",
        "imported_at": now,
        "imported_by_admin_email": admin_email,
        "created_at": now,
        "updated_at": now,
        "schema_kind": "demo",
    }


def _build_test_doc(code: str, now: datetime, admin_email: Optional[str]) -> dict:
    return {
        "code": code,
        "code_type": "test",
        "series": None,
        "edition": None,
        "delivery_type": "DOLLAR_TEST",
        "batch_id": "TEST-DOLLAR",
        "max_uses": 0,  # 0 = unlimited until expiry
        "uses_used": 0,
        "status": "ACTIVE",
        "expires_at": DOLLAR_TEST_EXPIRES_UTC,
        "notes": "Admin QA only — $1 checkout. Auto-expires Apr 28 2026 11:59 PM ET. No fulfillment.",
        "imported_from_filename": "seed:test",
        "imported_at": now,
        "imported_by_admin_email": admin_email,
        "created_at": now,
        "updated_at": now,
        "schema_kind": "dollar_test",
    }


@router.post("/seed-demo-test")
async def seed_demo_test(admin: AdminUser = Depends(get_current_admin)):
    """Idempotently insert/refresh the 6 internal DEMO codes and 2 BETADOLLAR test codes.
    Existing codes are NOT overwritten on uses_used / status — only the static
    config fields (rules) are kept in sync. Safe to re-run."""
    now = datetime.now(timezone.utc)
    admin_email = getattr(admin, "email", None) or getattr(admin, "id", None)
    inserted, refreshed = 0, 0

    for d in DEMO_CODES_DEF:
        doc = _build_demo_doc(d["code"], d["total_hours"], now, admin_email)
        existing = await db.redemption_codes.find_one({"code": doc["code"]}, {"_id": 0, "uses_used": 1, "status": 1})
        if existing:
            # Preserve runtime state, refresh rules
            update = {k: v for k, v in doc.items() if k not in ("uses_used", "status", "created_at")}
            update["updated_at"] = now
            await db.redemption_codes.update_one({"code": doc["code"]}, {"$set": update})
            refreshed += 1
        else:
            await db.redemption_codes.insert_one(doc)
            inserted += 1

    for d in TEST_CODES_DEF:
        doc = _build_test_doc(d["code"], now, admin_email)
        existing = await db.redemption_codes.find_one({"code": doc["code"]}, {"_id": 0, "uses_used": 1, "status": 1})
        if existing:
            update = {k: v for k, v in doc.items() if k not in ("uses_used", "status", "created_at")}
            update["updated_at"] = now
            await db.redemption_codes.update_one({"code": doc["code"]}, {"$set": update})
            refreshed += 1
        else:
            await db.redemption_codes.insert_one(doc)
            inserted += 1

    summary = {"inserted": inserted, "refreshed": refreshed,
               "demo_codes": [d["code"] for d in DEMO_CODES_DEF],
               "test_codes": [d["code"] for d in TEST_CODES_DEF]}
    await log_admin_action("seed_demo_test_codes", admin.id, "redemption_codes", "seed:demo+test", summary)
    return {"message": "Seed complete", **summary}


@router.get("/list")
async def list_codes_by_type(
    code_type: str = Query(..., pattern="^(demo|test)$"),
    admin: AdminUser = Depends(get_current_admin),
):
    """Flat list of demo OR test codes. Auto-expires past-due codes on read."""
    await _auto_expire_due_codes()
    docs = await db.redemption_codes.find({"code_type": code_type}, {"_id": 0}).sort("code", 1).to_list(200)
    for d in docs:
        for k in ("imported_at", "redeemed_at", "override_at", "created_at", "updated_at", "expires_at"):
            v = d.get(k)
            if hasattr(v, "isoformat"):
                d[k] = v.isoformat()
    return {"code_type": code_type, "count": len(docs), "codes": docs}
