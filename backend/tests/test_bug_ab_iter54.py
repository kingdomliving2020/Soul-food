"""
Iteration 54 — Independent verification of two RECURRING bugs.

BUG A: Youth bundle must deliver Youth files (resolver + normalizer).
BUG B: Gift order confirmation must hide buyer's download links
       (GET /api/payments/download-links/{order}).

Public preview URL (no auth needed for /download-links).
"""
import asyncio
from datetime import datetime, timedelta, timezone
import os
import sys

import pytest
import requests
from dotenv import dotenv_values
from motor.motor_asyncio import AsyncIOMotorClient

# Make backend importable
sys.path.insert(0, "/app/backend")

from payment_routes import (  # noqa: E402
    BUNDLE_EXPANSIONS,
    normalize_product_id,
    resolve_item_to_file_entries_async,
)

ENV = dotenv_values("/app/backend/.env")
MONGO_URL = ENV["MONGO_URL"]
DB_NAME = ENV["DB_NAME"]

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://soul-food-mvp.preview.emergentagent.com",
).rstrip("/")

GIFT_ORDER = "QA-GIFT-DL2"
SELF_ORDER = "QA-SELF-DL2"


# ---------------- BUG A ------------------------------------------------------

class TestBugA_YouthBundleResolver:
    """Youth bundle must resolve to youth files only; adult to adult only."""

    def test_normalize_preserves_edition_specific_bundle_keys(self):
        # These edition-specific bundle keys must NEVER collapse.
        for key in [
            "full-table-experience-ye",
            "full-table-experience-ae",
            "starter-bundle-4cs-bkft-ae",
            "starter-bundle-4cs-bkft-ye",
            "holiday-table-bundle-ae",
            "holiday-table-bundle-ye",
        ]:
            assert key in BUNDLE_EXPANSIONS, f"{key} missing from BUNDLE_EXPANSIONS"
            assert normalize_product_id(key) == key, (
                f"normalize_product_id collapsed {key!r} to "
                f"{normalize_product_id(key)!r}"
            )

    def test_normalize_regression_non_bundle_ipdf_variants(self):
        # Non-bundle -ipdf variants should still normalize to base sku.
        assert normalize_product_id("holiday-ae-ipdf") == "holiday_ae"
        assert (
            normalize_product_id("breakfast-snack-month-1-adult-interactive-ipdf")
            == "breakfast-snack-month-1-adult-interactive"
        )
        assert normalize_product_id("holiday_ae") == "holiday_ae"

    def test_full_table_experience_ye_resolves_youth_only(self, event_loop):
        async def _run():
            it = {
                "product_id": "full-table-experience-ye",
                "normalized_product_id": normalize_product_id(
                    "full-table-experience-ye"
                ),
                "name": "Full Table Experience",
                "format": "epub",
                "quantity": 1,
                "isBundle": True,
                "edition": "ye",
            }
            return await resolve_item_to_file_entries_async(it)

        entries = event_loop.run_until_complete(_run())
        keys = [x["file_key"] for x in entries]
        assert keys == [
            "holiday_ye",
            "breakfast-snack-month-1-youth-interactive",
        ], f"YE resolved to {keys}"
        # Guardrail: nothing adult-y anywhere.
        joined = " ".join(keys).lower()
        assert "holiday_ae" not in joined
        assert "adult" not in joined

    def test_full_table_experience_ae_resolves_adult_only(self, event_loop):
        async def _run():
            it = {
                "product_id": "full-table-experience-ae",
                "normalized_product_id": normalize_product_id(
                    "full-table-experience-ae"
                ),
                "name": "Full Table Experience",
                "format": "epub",
                "quantity": 1,
                "isBundle": True,
                "edition": "ae",
            }
            return await resolve_item_to_file_entries_async(it)

        entries = event_loop.run_until_complete(_run())
        keys = [x["file_key"] for x in entries]
        assert keys == [
            "holiday_ae",
            "breakfast-snack-month-1-adult-interactive",
        ], f"AE resolved to {keys}"
        joined = " ".join(keys).lower()
        assert "holiday_ye" not in joined
        assert "youth" not in joined


# ---------------- BUG B ------------------------------------------------------

@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
def seeded(event_loop):
    """Seed gift + self orders with matching download_link rows. Clean up after."""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=7)

    async def _setup():
        # Ensure clean slate
        await db.payment_transactions.delete_many(
            {"order_number": {"$in": [GIFT_ORDER, SELF_ORDER]}}
        )
        await db.download_links.delete_many(
            {"order_id": {"$in": [GIFT_ORDER, SELF_ORDER]}}
        )

        await db.payment_transactions.insert_one({
            "order_number": GIFT_ORDER,
            "customer_email": "buyer@x.com",
            "purchase_type": "gift",
            "digital_recipient_email": "friend@y.com",
            "payment_status": "paid",
            "created_at": now,
        })
        await db.download_links.insert_one({
            "order_id": GIFT_ORDER,
            "product_id": "holiday_ye",
            "product_name": "Holiday YE",
            "token": "tok_g2",
            "token_hash": "hash_g2",
            "revoked": False,
            "download_count": 0,
            "max_downloads": 3,
            "expires_at": expires,
            "created_at": now,
        })

        await db.payment_transactions.insert_one({
            "order_number": SELF_ORDER,
            "customer_email": "buyer@x.com",
            "purchase_type": "self",
            "payment_status": "paid",
            "created_at": now,
        })
        await db.download_links.insert_one({
            "order_id": SELF_ORDER,
            "product_id": "holiday_ae",
            "product_name": "Holiday AE",
            "token": "tok_s2",
            "token_hash": "hash_s2",
            "revoked": False,
            "download_count": 0,
            "max_downloads": 3,
            "expires_at": expires,
            "created_at": now,
        })

    async def _teardown():
        await db.payment_transactions.delete_many(
            {"order_number": {"$in": [GIFT_ORDER, SELF_ORDER]}}
        )
        await db.download_links.delete_many(
            {"order_id": {"$in": [GIFT_ORDER, SELF_ORDER]}}
        )
        client.close()

    event_loop.run_until_complete(_setup())
    yield
    event_loop.run_until_complete(_teardown())


class TestBugB_GiftDownloadLinks:
    """GET /api/payments/download-links/{order} contract for gift vs self."""

    def test_gift_order_returns_empty_links_with_gift_flag(self, seeded):
        r = requests.get(f"{BASE_URL}/api/payments/download-links/{GIFT_ORDER}", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("is_gift") is True, data
        assert data.get("count") == 0, data
        assert data.get("links") == [], data
        assert data.get("recipient_email") == "friend@y.com", data

    def test_self_order_returns_actual_links(self, seeded):
        r = requests.get(f"{BASE_URL}/api/payments/download-links/{SELF_ORDER}", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("is_gift") is False, data
        links = data.get("links") or []
        assert len(links) == 1, data
        link = links[0]
        assert link.get("product_id") == "holiday_ae"
        assert link.get("token") == "tok_s2"
        assert link.get("max_downloads") == 3
        assert link.get("download_count") == 0
