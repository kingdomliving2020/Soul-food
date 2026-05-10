"""
Iteration 35 — Customer self-serve auto-fulfill of stuck paid orders,
abuse protection, rate limiting, admin resend auto-refulfill, db-diagnostic.

Tests against PREVIEW URL using REACT_APP_BACKEND_URL.
Resets DB state for SF-2026-9PX7Q between tests; restores at the end.
"""
import os
import time
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "soul_food_db")

ORDER_OK = "SF-2026-9PX7Q"
ORDER_OK_EMAIL = "moonlite79@ymail.com"
ORDER_ADMIN_STUCK = "SF-2026-7QQ54"

ADMIN_EMAIL = "overflowharvest@gmail.com"
ADMIN_PASSWORD = "Admin123!"


@pytest.fixture(scope="module")
def db():
    return MongoClient(MONGO_URL)[DB_NAME]


def _reset_order_stuck(db, order_number):
    """Hard-delete download_links and clear fulfillment flags for an order to simulate a stuck state."""
    db.download_links.delete_many({"order_id": order_number})
    db.payment_transactions.update_one(
        {"order_number": order_number},
        {"$unset": {
            "download_links_generated": "",
            "status": "",
            "fulfillment_status": "",
            "downloads_count": "",
            "refulfilled_at": "",
            "fulfillment_verification_failures": "",
        }}
    )
    # Also clear rate-limit records so tests aren't polluted by prior runs
    db.download_link_requests.delete_many({"order_id": order_number})


@pytest.fixture(scope="module")
def saved_tx_9px7q(db):
    """Snapshot original SF-2026-9PX7Q state to restore after the suite."""
    snap = db.payment_transactions.find_one({"order_number": ORDER_OK}, {"_id": 0})
    links = list(db.download_links.find({"order_id": ORDER_OK}, {"_id": 0}))
    yield snap, links
    # Teardown: try to leave the order healthy. Easiest path is to call the
    # internal refulfill helper via the public endpoint after reset.
    try:
        _reset_order_stuck(db, ORDER_OK)
        # Trigger auto-fulfill via the public endpoint with the correct email
        # so the order has fresh, working links again.
        requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": ORDER_OK, "email": ORDER_OK_EMAIL},
            timeout=30,
        )
    except Exception as e:
        print(f"[teardown] could not restore {ORDER_OK}: {e}")


# ---------------------------------------------------------------------------
# 1. Customer self-serve auto-fulfill of stuck paid order
# ---------------------------------------------------------------------------
class TestAutoFulfillStuckOrder:
    def test_stuck_order_auto_fulfills_on_resend(self, db, saved_tx_9px7q):
        # Arrange: force order to "stuck" state
        _reset_order_stuck(db, ORDER_OK)
        assert db.download_links.count_documents({"order_id": ORDER_OK}) == 0

        # Act
        r = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": ORDER_OK, "email": ORDER_OK_EMAIL},
            timeout=45,
        )
        # Assert
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        body = r.json()
        assert body.get("success") is True, body
        assert body.get("auto_fulfilled") is True, f"auto_fulfilled missing/false: {body}"
        assert body.get("links_count") == 2, f"links_count expected 2, got {body.get('links_count')}"

        # DB assertions: 2 active download_links rows exist
        active = db.download_links.count_documents(
            {"order_id": ORDER_OK, "revoked": {"$ne": True}}
        )
        # Auto-fulfill creates 2, the resend then revokes those and creates 2 fresh.
        # Either way, exactly 2 active rows should exist after the dust settles.
        assert active == 2, f"expected 2 active links, got {active}"

        # payment_transactions doc reflects fulfilled state
        tx = db.payment_transactions.find_one({"order_number": ORDER_OK}, {"_id": 0})
        assert tx.get("fulfillment_status") == "fulfilled", tx.get("fulfillment_status")
        assert tx.get("download_links_generated") is True, tx.get("download_links_generated")
        assert tx.get("downloads_count") == 2, tx.get("downloads_count")


# ---------------------------------------------------------------------------
# 2. Abuse protection — wrong email must NOT trigger refulfill
# ---------------------------------------------------------------------------
class TestAbuseProtection:
    def test_wrong_email_does_not_refulfill(self, db):
        # Arrange: reset to stuck state again
        _reset_order_stuck(db, ORDER_OK)
        assert db.download_links.count_documents({"order_id": ORDER_OK}) == 0

        r = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": ORDER_OK, "email": "attacker@evil.com"},
            timeout=30,
        )
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"
        detail = (r.json() or {}).get("detail", "")
        assert "support" in detail.lower(), f"detail should mention support: {detail!r}"

        # NO links were created
        assert db.download_links.count_documents({"order_id": ORDER_OK}) == 0, \
            "refulfill must not run for wrong email"


# ---------------------------------------------------------------------------
# 3. Rate limiting still works after a successful auto-fulfilled resend
# ---------------------------------------------------------------------------
class TestRateLimit:
    def test_rate_limit_after_three_calls(self, db):
        # Arrange: reset and let one auto-fulfill succeed
        _reset_order_stuck(db, ORDER_OK)
        r1 = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": ORDER_OK, "email": ORDER_OK_EMAIL},
            timeout=45,
        )
        assert r1.status_code == 200, r1.text

        # Two more allowed calls
        statuses = [r1.status_code]
        for _ in range(2):
            time.sleep(0.4)
            rr = requests.post(
                f"{BASE_URL}/api/downloads/resend-links",
                json={"order_id": ORDER_OK, "email": ORDER_OK_EMAIL},
                timeout=30,
            )
            statuses.append(rr.status_code)
        # 4th call should hit the rate limit (3/hour)
        time.sleep(0.4)
        r4 = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": ORDER_OK, "email": ORDER_OK_EMAIL},
            timeout=30,
        )
        statuses.append(r4.status_code)
        assert r4.status_code == 429, f"Expected 429 on 4th call, statuses: {statuses}, body: {r4.text}"
        detail = (r4.json() or {}).get("detail", "")
        assert "too many" in detail.lower(), detail


# ---------------------------------------------------------------------------
# 4. Admin /api/admin/orders/{order_number}/resend-email auto-refulfill works
# ---------------------------------------------------------------------------
class TestAdminResendEmailRefulfill:
    @pytest.fixture(scope="class")
    def admin_token(self):
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=30,
        )
        if r.status_code != 200:
            pytest.skip(f"admin login failed: {r.status_code} {r.text}")
        tok = r.json().get("access_token")
        if not tok:
            pytest.skip(f"no access_token in admin login response: {r.json()}")
        return tok

    def test_admin_resend_does_not_silently_500(self, admin_token, db):
        # Ensure target order has no active links so auto-refulfill is the path under test
        active_before = db.download_links.count_documents(
            {"order_id": ORDER_ADMIN_STUCK, "revoked": {"$ne": True}}
        )
        # If it happens to have active links, blow them away to force the refulfill path
        if active_before > 0:
            db.download_links.update_many(
                {"order_id": ORDER_ADMIN_STUCK},
                {"$set": {"revoked": True}}
            )

        r = requests.post(
            f"{BASE_URL}/api/admin/orders/{ORDER_ADMIN_STUCK}/resend-email",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=60,
        )
        # Spec: 200 with auto_refulfilled:true OR 409 with clear file-not-attached message
        assert r.status_code in (200, 409), f"unexpected status {r.status_code}: {r.text}"
        body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        if r.status_code == 200:
            # Should NOT be silent success — must indicate something happened.
            # Either explicit auto_refulfilled flag, or links/email_sent indicator.
            assert (
                body.get("auto_refulfilled") is True
                or body.get("email_sent") is True
                or body.get("links_count", 0) > 0
            ), f"silent success without action: {body}"
        else:  # 409
            detail = (body.get("detail") or "").lower()
            assert ("file" in detail or "attach" in detail or "support" in detail), \
                f"409 detail should describe the file/attach problem: {detail!r}"


# ---------------------------------------------------------------------------
# 5. /api/health/db-diagnostic schema + secret leak check
# ---------------------------------------------------------------------------
class TestHealthDbDiagnostic:
    def test_schema_and_no_secret_leak(self):
        r = requests.get(f"{BASE_URL}/api/health/db-diagnostic", timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        # Required top-level keys
        for k in ("status", "connected_db_name", "mongo_host", "collection_counts",
                  "all_databases_on_cluster", "git_sha", "now"):
            assert k in body, f"missing key in response: {k} — body: {body}"
        assert body["status"] == "ok"
        assert isinstance(body["connected_db_name"], str) and body["connected_db_name"]
        assert isinstance(body["mongo_host"], str)
        assert isinstance(body["collection_counts"], dict)
        for col in ("payment_transactions", "files", "users", "orders", "interactive_lessons"):
            assert col in body["collection_counts"], f"missing collection count: {col}"
        assert isinstance(body["all_databases_on_cluster"], dict)
        assert isinstance(body["git_sha"], str)
        assert isinstance(body["now"], str) and "T" in body["now"]

        # Secret leak guard: no full credentials, password chars, or "mongodb://user:pass@"
        s = r.text
        assert "Admin123!" not in s
        assert "password" not in s.lower() or '"password"' not in s.lower()
        # Look for unmasked credential patterns
        import re
        assert not re.search(r"mongodb(\+srv)?://[^:\s/]+:[^@\s]+@", s), \
            "MONGO_URL credentials leaked in diagnostic response"


# ---------------------------------------------------------------------------
# 6. Backward compatibility — REVOKED links case
# ---------------------------------------------------------------------------
class TestBackwardCompatRevokedLinks:
    def test_revoked_links_resend_no_auto_fulfill(self, db):
        """Find a paid order with active links, revoke them, then resend should
        NOT report auto_fulfilled (rate-limit-safe with a different order_id).

        NOTE: existing resend_download_links() only re-creates links from links
        matching the order's user_email — even revoked ones — so this should work
        without entering the auto-fulfill branch.
        """
        # Find a paid order with at least 2 active links (not the one we just rate-limited)
        candidate = db.payment_transactions.find_one(
            {
                "payment_status": "paid",
                "order_number": {"$nin": [ORDER_OK, ORDER_ADMIN_STUCK]},
            },
            {"_id": 0, "order_number": 1, "customer_email": 1},
        )
        if not candidate:
            pytest.skip("no other paid order available")
        order_number = candidate["order_number"]
        email = candidate["customer_email"]
        active_count = db.download_links.count_documents(
            {"order_id": order_number, "revoked": {"$ne": True}}
        )
        if active_count == 0:
            pytest.skip(f"order {order_number} has no active links to revoke for this test")

        # Clear rate limit on this new order
        db.download_link_requests.delete_many({"order_id": order_number})

        # Revoke all current links (simulate "expired" state)
        db.download_links.update_many(
            {"order_id": order_number},
            {"$set": {"revoked": True}}
        )

        r = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": order_number, "email": email},
            timeout=45,
        )
        assert r.status_code == 200, f"got {r.status_code}: {r.text}"
        body = r.json()
        assert body.get("success") is True, body
        # auto_fulfilled MUST be False — links exist (even if revoked)
        assert body.get("auto_fulfilled") is False, \
            f"revoked links case should NOT trigger auto-fulfill: {body}"
        assert body.get("links_count", 0) >= 1, body
        # New active links exist
        new_active = db.download_links.count_documents(
            {"order_id": order_number, "revoked": {"$ne": True}}
        )
        assert new_active >= 1, f"no fresh active links created: {new_active}"
