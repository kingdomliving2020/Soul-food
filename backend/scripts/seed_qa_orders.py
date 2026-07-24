"""Seed representative QA orders for the 3-axis fulfillment model.
Order numbers prefixed QA-FUL- so they're easy to find and delete.
Run:  cd /app/backend && python3 -m scripts.seed_qa_orders
Clean: cd /app/backend && python3 -m scripts.seed_qa_orders --clean
"""
import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
PREFIX = "QA-FUL-"


def base(order_number, **extra):
    now = datetime.now(timezone.utc)
    doc = {
        "order_number": order_number,
        "order_id": order_number,
        "session_id": order_number,
        "customer_email": "buyer@example.com",
        "customer_name": "QA Buyer",
        "total_amount": 19.99,
        "payment_status": "paid",
        "status": "completed",
        "purchase_type": "self",
        "download_links_generated": True,
        "created_at": now,
    }
    doc.update(extra)
    return doc


ORDERS = [
    base(f"{PREFIX}DIGITAL", items=[{"id": "holiday-ae-digital", "name": "Holiday AE (ePub)", "format": "digital", "quantity": 1}]),
    base(f"{PREFIX}PHYSICAL", download_links_generated=False,
         items=[{"id": "ihi-ae-pro-pod", "name": "AE-Pro Leader Guide (Print)", "format": "physical", "quantity": 1}]),
    base(f"{PREFIX}MIXED",
         items=[{"id": "holiday-ae-digital", "name": "Holiday AE (ePub)", "format": "digital", "quantity": 1},
                {"id": "ihi-ae-pro-pod", "name": "AE-Pro Leader Guide (Print)", "format": "physical", "quantity": 1}]),
    base(f"{PREFIX}GIFT", purchase_type="gift", digital_recipient_email="recipient@example.com",
         items=[{"id": "holiday-ae-digital", "name": "Holiday AE (ePub)", "format": "digital", "quantity": 1}]),
    base(f"{PREFIX}IE",
         items=[{"id": "holiday-ie-digital", "name": "Holiday IE (Instructor)", "edition": "instructor", "format": "digital", "quantity": 1}]),
    base(f"{PREFIX}SGB", physical_fulfillment="delivered",
         items=[{"id": "sgb-4", "name": "Small Group Bundle (1 IE + 4)", "isSmallGroupBundle": True, "format": "physical", "quantity": 1}]),
    base(f"{PREFIX}BULK", total_amount=69.93,
         items=[{"id": "holiday-ae-digital", "name": "Holiday AE (ePub)", "format": "digital", "quantity": 10}]),
    base(f"{PREFIX}HYBRID",
         items=[{"id": "ihi_ae_pro_bundle", "sku": "IHI-AE-PRO-BUNDLE", "name": "AE-Pro Bundle (Print + Digital)",
                 "physical": True, "hybrid_fulfillment": True, "format": "physical", "quantity": 1}]),
]


def clean():
    r = db.payment_transactions.delete_many({"order_number": {"$regex": f"^{PREFIX}"}})
    print(f"deleted {r.deleted_count} QA orders")


def seed():
    clean()
    db.payment_transactions.insert_many(ORDERS)
    print(f"inserted {len(ORDERS)} QA orders:")
    for o in ORDERS:
        print("  ", o["order_number"], "-", o["purchase_type"], "-", [i["name"] for i in o["items"]])


if __name__ == "__main__":
    if "--clean" in sys.argv:
        clean()
    else:
        seed()
