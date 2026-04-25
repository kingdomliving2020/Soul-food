"""
Seed the `products` collection from the canonical PRODUCTS catalog
defined in payment_routes.py.

Idempotent: upserts by SKU. Re-running will refresh prices/descriptions
without duplicating documents and without touching any other collection
(orders, users, codes, transactions are all untouched).

Usage:
  - As an admin endpoint: POST /api/admin/products/seed-from-catalog
  - Manually:             python -m scripts.seed_admin_products
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone


def _series_from_id(pid: str) -> str:
    """Derive a series tag from the product_id prefix."""
    p = pid.lower()
    if p.startswith("snack_pack") or p.startswith("nibble") or p.startswith("breakfast") or p.startswith("bkft"):
        return "breakfast"
    if p.startswith("holiday") or "4c" in p or "covenant" in p or "cradle" in p or "cross" in p or "comforter" in p:
        return "holiday"
    if "lunch" in p:
        return "lunch"
    if "dinner" in p:
        return "dinner"
    if "supper" in p:
        return "supper"
    if "leap" in p or "loff" in p:
        return "leap_of_faith"
    if "bundle" in p or "starter" in p or "table_experience" in p:
        return "bundle"
    if "game" in p or "trivia" in p:
        return "game"
    return "other"


def _build_doc(pid: str, p: dict, file_map: dict) -> dict:
    """Map a PRODUCTS entry into the admin ProductItem shape."""
    list_price = float(p.get("list_price") or 0)
    sale_price = float(p.get("sale_price") or list_price or 0)
    is_bundle = bool(p.get("is_bundle"))
    is_physical = bool(p.get("physical"))
    is_free = bool(p.get("free"))

    if is_bundle:
        ptype = "bundle"
    elif is_physical:
        ptype = "physical"
    else:
        ptype = "digital"

    files = []
    fname = file_map.get(pid)
    if fname:
        files.append(fname)

    return {
        "id": pid,
        "sku": p.get("sku") or pid.upper(),
        "name": p.get("name", pid),
        "description": p.get("description", ""),
        "price": sale_price,
        "compare_price": list_price if list_price and list_price != sale_price else None,
        "type": ptype,
        "status": "active" if not p.get("preorder") else "preorder",
        "inventory_count": None,
        "low_stock_threshold": 10,
        "series": _series_from_id(pid),
        "edition": p.get("edition") or None,
        "files": files,
        "metadata": {
            "product_id": pid,
            "stripe_id": p.get("stripe_id"),
            "currency": p.get("currency", "usd"),
            "unit": p.get("unit"),
            "medium": p.get("medium"),
            "is_bundle": is_bundle,
            "is_physical": is_physical,
            "is_free": is_free,
            "preorder": bool(p.get("preorder")),
            "promo_sale_price": p.get("promo_sale_price"),
            "promo_until": p.get("promo_until"),
        },
    }


async def seed_products_from_catalog(db) -> dict:
    """Upsert the canonical PRODUCTS catalog into db.products.

    Returns a summary dict with counts. Safe to call repeatedly.
    """
    from payment_routes import PRODUCTS, PRODUCT_FILES

    inserted = 0
    updated = 0
    skipped = 0
    now = datetime.now(timezone.utc)

    for pid, p in PRODUCTS.items():
        doc = _build_doc(pid, p, PRODUCT_FILES)
        sku = doc["sku"]
        existing = await db.products.find_one({"sku": sku}, {"_id": 0, "id": 1, "created_at": 1})
        if existing:
            doc["id"] = existing.get("id") or doc["id"]
            doc["created_at"] = existing.get("created_at") or now
            doc["updated_at"] = now
            res = await db.products.update_one({"sku": sku}, {"$set": doc})
            if res.modified_count:
                updated += 1
            else:
                skipped += 1
        else:
            doc["id"] = doc.get("id") or uuid.uuid4().hex
            doc["created_at"] = now
            doc["updated_at"] = now
            await db.products.insert_one(doc)
            inserted += 1

    total = await db.products.count_documents({})
    return {
        "inserted": inserted,
        "updated": updated,
        "unchanged": skipped,
        "total_in_db": total,
        "source_catalog_size": len(PRODUCTS),
    }


async def _main():
    from motor.motor_asyncio import AsyncIOMotorClient
    from dotenv import load_dotenv
    load_dotenv()
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    summary = await seed_products_from_catalog(db)
    print("Seed summary:", summary)


if __name__ == "__main__":
    asyncio.run(_main())
