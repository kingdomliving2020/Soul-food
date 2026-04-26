"""
Test suite for Demo & $1 Test codes admin endpoints.
Covers: seed idempotency, list demo/test, auto-expire, /batches scoping, override.
"""
import os
import time
from datetime import datetime, timezone, timedelta

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://soul-checkout-stage.preview.emergentagent.com").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "soul_food_db")

ADMIN_EMAIL = "overflowharvest@gmail.com"
ADMIN_PASSWORD = "Admin123!"

DEMO_CODES = ["DEMOSOFU79", "DEMOSOFU77", "DEMOSOFU80", "DEMOSOFU97", "DEMOSOFU60", "DEMOSOFU55"]
TEST_CODES = ["BETADOLLAR79", "BETADOLLAR97"]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok, "No access_token in login response"
    return tok


@pytest.fixture(scope="module")
def headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def mongo_db():
    cli = MongoClient(MONGO_URL)
    yield cli[DB_NAME]
    cli.close()


# ---------- Seed ----------
class TestSeedDemoTest:
    def test_seed_first_call(self, headers):
        r = requests.post(f"{BASE_URL}/api/admin/codes-redemptions/seed-demo-test",
                          headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "message" in d
        assert "inserted" in d and "refreshed" in d
        assert d.get("demo_codes") and len(d["demo_codes"]) == 6
        assert d.get("test_codes") and len(d["test_codes"]) == 2
        assert set(d["demo_codes"]) == set(DEMO_CODES)
        assert set(d["test_codes"]) == set(TEST_CODES)

    def test_seed_idempotent_second_call(self, headers):
        r = requests.post(f"{BASE_URL}/api/admin/codes-redemptions/seed-demo-test",
                          headers=headers, timeout=30)
        assert r.status_code == 200
        d = r.json()
        # On 2nd call, all 8 should be refreshed, none inserted
        assert d["inserted"] == 0, f"Expected inserted=0 on 2nd call, got {d['inserted']}"
        assert d["refreshed"] == 8, f"Expected refreshed=8, got {d['refreshed']}"


# ---------- List demo ----------
class TestListDemo:
    def test_list_demo_returns_six(self, headers):
        r = requests.get(f"{BASE_URL}/api/admin/codes-redemptions/list",
                         params={"code_type": "demo"}, headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["code_type"] == "demo"
        assert d["count"] == 6, f"Expected 6 demo codes, got {d['count']}"
        codes = d["codes"]
        assert {c["code"] for c in codes} == set(DEMO_CODES)
        for c in codes:
            assert c["code_type"] == "demo"
            assert c["edition"] == "IE"
            assert c["delivery_type"] == "DEMO"
            assert c["batch_id"] == "DEMO-INTERNAL"
            assert c["series_allowed"] == ["BKFT", "HOL"]
            assert c["session_cap_minutes"] == 90
            assert c["max_uses"] == 5
            assert c["uses_used"] == 0
            assert c["status"] == "ACTIVE"
            assert c["preview_only"] is True
            unlocks = c.get("unlocks") or []
            for need in ["preview_answer_keys", "preview_one_map",
                         "preview_offline_cards", "presenter_games_enabled"]:
                assert need in unlocks, f"missing unlock {need} in {c['code']}"

    def test_demo_total_hours_25_and_5(self, headers):
        r = requests.get(f"{BASE_URL}/api/admin/codes-redemptions/list",
                         params={"code_type": "demo"}, headers=headers, timeout=30)
        codes = {c["code"]: c for c in r.json()["codes"]}
        assert codes["DEMOSOFU79"]["total_hours"] == 25
        assert codes["DEMOSOFU77"]["total_hours"] == 25
        for c in ["DEMOSOFU80", "DEMOSOFU97", "DEMOSOFU60", "DEMOSOFU55"]:
            assert codes[c]["total_hours"] == 5, f"{c} should have 5 hours"


# ---------- List test ----------
class TestListTest:
    def test_list_test_returns_two(self, headers):
        r = requests.get(f"{BASE_URL}/api/admin/codes-redemptions/list",
                         params={"code_type": "test"}, headers=headers, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["count"] == 2
        codes = {c["code"]: c for c in d["codes"]}
        assert set(codes.keys()) == set(TEST_CODES)
        for c in codes.values():
            assert c["code_type"] == "test"
            assert c["delivery_type"] == "DOLLAR_TEST"
            assert c["max_uses"] == 0
            exp = c.get("expires_at")
            assert exp and "2026-04-29T03:59:00" in exp, f"unexpected expires_at: {exp}"


# ---------- Auto expire on read ----------
class TestAutoExpire:
    def test_auto_expire_flips_status_then_restore(self, headers, mongo_db):
        col = mongo_db["redemption_codes"]
        # Set BETADOLLAR79 expires_at to past
        past = datetime.now(timezone.utc) - timedelta(days=1)
        upd = col.update_one(
            {"code": "BETADOLLAR79"},
            {"$set": {"expires_at": past, "status": "ACTIVE"}},
        )
        assert upd.modified_count >= 0  # could be 0 if already past, but doc exists

        # Hit /list?code_type=test → should auto-expire
        r = requests.get(f"{BASE_URL}/api/admin/codes-redemptions/list",
                         params={"code_type": "test"}, headers=headers, timeout=30)
        assert r.status_code == 200
        codes = {c["code"]: c for c in r.json()["codes"]}
        assert codes["BETADOLLAR79"]["status"] == "EXPIRED", \
            f"Expected EXPIRED, got {codes['BETADOLLAR79']['status']}"

        # Restore expires_at + status
        future = datetime(2026, 4, 29, 3, 59, 0, tzinfo=timezone.utc)
        col.update_one(
            {"code": "BETADOLLAR79"},
            {"$set": {"expires_at": future, "status": "ACTIVE"}},
        )
        # Confirm restored on next read
        r2 = requests.get(f"{BASE_URL}/api/admin/codes-redemptions/list",
                          params={"code_type": "test"}, headers=headers, timeout=30)
        codes2 = {c["code"]: c for c in r2.json()["codes"]}
        assert codes2["BETADOLLAR79"]["status"] == "ACTIVE", \
            f"Restore failed: {codes2['BETADOLLAR79']['status']}"


# ---------- Batches scoping ----------
class TestBatchesScoping:
    def test_batches_excludes_demo_and_test(self, headers):
        r = requests.get(f"{BASE_URL}/api/admin/codes-redemptions/batches",
                         headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "batches" in d and "total_batches" in d
        for b in d["batches"]:
            assert b.get("batch_id") not in ("DEMO-INTERNAL", "TEST-DOLLAR"), \
                f"DEMO/TEST batch leaked into /batches: {b}"
            assert b.get("delivery_type") not in ("DEMO", "DOLLAR_TEST"), \
                f"Wrong delivery_type leaked: {b}"
        # total_batches should still be ~136 (problem statement)
        assert d["total_batches"] >= 100, \
            f"total_batches dropped unexpectedly: {d['total_batches']}"

    def test_batches_includes_imported_by(self, headers):
        r = requests.get(f"{BASE_URL}/api/admin/codes-redemptions/batches",
                         headers=headers, timeout=30)
        d = r.json()
        # at least one batch should have imported_by key (may be None for legacy)
        assert any("imported_by" in b for b in d["batches"]), \
            "imported_by field missing from /batches response"


# ---------- Override ----------
class TestOverride:
    def test_override_revoke_then_restore(self, headers):
        # Revoke
        r = requests.patch(
            f"{BASE_URL}/api/admin/codes-redemptions/codes/DEMOSOFU55/override",
            headers=headers,
            json={"status": "REVOKED", "reason": "qa override test"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["code"] == "DEMOSOFU55"
        assert d["status"] == "REVOKED"

        # Verify via GET
        g = requests.get(f"{BASE_URL}/api/admin/codes-redemptions/codes/DEMOSOFU55",
                         headers=headers, timeout=30)
        assert g.status_code == 200
        gd = g.json()
        assert gd["status"] == "REVOKED"
        assert gd.get("override_reason") == "qa override test"
        assert gd.get("override_status") == "REVOKED"
        assert gd.get("override_by_admin")
        assert gd.get("override_at")

        # Restore
        r2 = requests.patch(
            f"{BASE_URL}/api/admin/codes-redemptions/codes/DEMOSOFU55/override",
            headers=headers,
            json={"status": "RESTORED", "reason": "qa restore"},
            timeout=30,
        )
        assert r2.status_code == 200
        assert r2.json()["status"] == "ACTIVE"

        g2 = requests.get(f"{BASE_URL}/api/admin/codes-redemptions/codes/DEMOSOFU55",
                          headers=headers, timeout=30)
        assert g2.json()["status"] == "ACTIVE"
