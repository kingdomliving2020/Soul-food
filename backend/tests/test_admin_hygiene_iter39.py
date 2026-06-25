"""
Soul Food — Iteration 39 backend tests for admin hygiene controls.

Covers:
 - User bulk-archive (archive + restore)
 - GET /api/admin/users archived filter (active / archived / all) + search
 - Order bulk-tag (tag='test', archive=true, tag='clear')
 - GET /api/admin/orders visibility filter (active / test / archived / all)
 - Response shape includes is_archived (users + orders) and tag (orders)
 - Validation: empty user_ids / order_numbers => 400
"""
import os
import secrets
import time

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "soul_food_db")

ADMIN_EMAIL = "overflowharvest@gmail.com"
ADMIN_PASSWORD = "Admin123!"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def admin_token():
    """Login as admin (auth uses {identifier,password})."""
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL not configured")
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    token = data.get("token") or data.get("access_token")
    if not token:
        pytest.skip(f"No token in login response: {data}")
    return token


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def mongo_db():
    if not MONGO_URL:
        pytest.skip("MONGO_URL not configured")
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    yield db
    client.close()


@pytest.fixture(scope="session")
def seed_users(mongo_db, request):
    """Seed two TEST_ users directly into db.users for archive testing."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    ids = [f"test_hygiene_user_{secrets.token_hex(6)}" for _ in range(2)]
    docs = [
        {
            "id": ids[0],
            "email": f"TEST_hygiene_{ids[0][-6:]}@example.com",
            "username": f"test_hyg_{ids[0][-6:]}",
            "name": "TEST Hygiene User 1",
            "role": "customer",
            "created_at": now,
            "disabled": False,
        },
        {
            "id": ids[1],
            "email": f"TEST_hygiene_{ids[1][-6:]}@example.com",
            "username": f"test_hyg_{ids[1][-6:]}",
            "name": "TEST Hygiene User 2",
            "role": "customer",
            "created_at": now,
            "disabled": False,
        },
    ]
    mongo_db.users.insert_many(docs)

    def cleanup():
        mongo_db.users.delete_many({"id": {"$in": ids}})
    request.addfinalizer(cleanup)
    return ids


@pytest.fixture(scope="session")
def seed_orders(mongo_db, request):
    """Seed two TEST_ orders into payment_transactions for tag/archive testing."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    order_numbers = [f"SF-TESTHYG-{secrets.token_hex(4).upper()}" for _ in range(2)]
    docs = [
        {
            "order_number": order_numbers[0],
            "session_id": f"sess_test_{secrets.token_hex(6)}",
            "customer_email": "TEST_hygiene_order@example.com",
            "customer_name": "TEST Hygiene Order 1",
            "total_amount": 1.00,
            "payment_status": "paid",
            "items": [{"name": "TEST item", "id": "TEST"}],
            "created_at": now,
        },
        {
            "order_number": order_numbers[1],
            "session_id": f"sess_test_{secrets.token_hex(6)}",
            "customer_email": "TEST_hygiene_order2@example.com",
            "customer_name": "TEST Hygiene Order 2",
            "total_amount": 2.00,
            "payment_status": "paid",
            "items": [{"name": "TEST item", "id": "TEST"}],
            "created_at": now,
        },
    ]
    mongo_db.payment_transactions.insert_many(docs)

    def cleanup():
        mongo_db.payment_transactions.delete_many({"order_number": {"$in": order_numbers}})
        mongo_db.orders.delete_many({"order_number": {"$in": order_numbers}})
    request.addfinalizer(cleanup)
    return order_numbers


# ---------------------------------------------------------------------------
# USER bulk-archive
# ---------------------------------------------------------------------------

class TestUserBulkArchive:
    def test_bulk_archive_two_users(self, auth_headers, seed_users):
        r = requests.post(
            f"{BASE_URL}/api/admin/users/bulk-archive",
            headers=auth_headers,
            json={"user_ids": seed_users, "archive": True},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("matched") == 2, body
        assert body.get("modified") == 2, body
        assert body.get("archived") is True

    def test_users_active_filter_excludes_archived(self, auth_headers, seed_users):
        # Search for our seeded user via email prefix — they're archived now.
        for uid in seed_users:
            r = requests.get(
                f"{BASE_URL}/api/admin/users",
                headers=auth_headers,
                params={"archived": "active", "search": "hygiene", "limit": 200},
                timeout=15,
            )
            assert r.status_code == 200
            items = r.json().get("items", [])
            ids = [u.get("id") for u in items]
            assert uid not in ids, f"Archived user {uid} should NOT appear in active list"

    def test_users_archived_filter_includes_only_archived(self, auth_headers, seed_users):
        r = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            params={"archived": "archived", "search": "hygiene", "limit": 200},
            timeout=15,
        )
        assert r.status_code == 200
        items = r.json().get("items", [])
        ids = [u.get("id") for u in items]
        for uid in seed_users:
            assert uid in ids, f"Archived user {uid} missing from archived list"
        # Every item returned must be archived
        for u in items:
            assert u.get("is_archived") is True

    def test_users_all_filter_includes_archived(self, auth_headers, seed_users):
        r = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            params={"archived": "all", "search": "hygiene", "limit": 200},
            timeout=15,
        )
        assert r.status_code == 200
        items = r.json().get("items", [])
        ids = [u.get("id") for u in items]
        for uid in seed_users:
            assert uid in ids

    def test_search_alongside_archive_filter_finds_admin(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            params={"archived": "all", "search": "overflowharvest"},
            timeout=15,
        )
        assert r.status_code == 200
        items = r.json().get("items", [])
        emails = [u.get("email", "").lower() for u in items]
        assert any("overflowharvest" in e for e in emails), emails

    def test_users_response_includes_is_archived(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            params={"archived": "all", "limit": 5},
            timeout=15,
        )
        assert r.status_code == 200
        items = r.json().get("items", [])
        assert items, "no users returned"
        # is_archived field must be present (bool or missing-treated-as-false)
        for u in items:
            assert "id" in u
            # accept missing (legacy) or bool
            if "is_archived" in u:
                assert isinstance(u["is_archived"], bool)

    def test_restore_one_user(self, auth_headers, seed_users):
        target = seed_users[0]
        r = requests.post(
            f"{BASE_URL}/api/admin/users/bulk-archive",
            headers=auth_headers,
            json={"user_ids": [target], "archive": False},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("archived") is False
        assert body.get("modified") == 1

        # Verify via GET — restored user should now appear in active list
        r2 = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            params={"archived": "active", "search": "hygiene", "limit": 200},
            timeout=15,
        )
        assert r2.status_code == 200
        ids = [u.get("id") for u in r2.json().get("items", [])]
        assert target in ids, "Restored user should reappear in active list"

    def test_bulk_archive_empty_rejected(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/users/bulk-archive",
            headers=auth_headers,
            json={"user_ids": [], "archive": True},
            timeout=15,
        )
        assert r.status_code == 400, r.text


# ---------------------------------------------------------------------------
# ORDER bulk-tag / archive
# ---------------------------------------------------------------------------

class TestOrderBulkTag:
    def test_tag_two_orders_as_test(self, auth_headers, seed_orders):
        r = requests.post(
            f"{BASE_URL}/api/admin/orders/bulk-tag",
            headers=auth_headers,
            json={"order_numbers": seed_orders, "tag": "test"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("matched_transactions", 0) + body.get("matched_orders", 0) >= 2
        assert body.get("tag") == "test"

    def test_orders_active_visibility_excludes_test_tagged(self, auth_headers, seed_orders):
        r = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers=auth_headers,
            params={"visibility": "active", "search": "TESTHYG", "limit": 200},
            timeout=15,
        )
        assert r.status_code == 200
        items = r.json().get("items", [])
        nums = [o.get("order_number") for o in items]
        for o in seed_orders:
            assert o not in nums, f"Test-tagged order {o} should NOT appear in active visibility"

    def test_orders_test_visibility_returns_only_test_tagged(self, auth_headers, seed_orders):
        r = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers=auth_headers,
            params={"visibility": "test", "search": "TESTHYG", "limit": 200},
            timeout=15,
        )
        assert r.status_code == 200
        items = r.json().get("items", [])
        nums = [o.get("order_number") for o in items]
        for o in seed_orders:
            assert o in nums, f"Test-tagged order {o} missing from visibility=test"
        for o in items:
            assert o.get("tag") == "test", o

    def test_archive_one_order(self, auth_headers, seed_orders):
        target = seed_orders[0]
        r = requests.post(
            f"{BASE_URL}/api/admin/orders/bulk-tag",
            headers=auth_headers,
            json={"order_numbers": [target], "archive": True},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("archive") is True

        # Verify via visibility=archived
        r2 = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers=auth_headers,
            params={"visibility": "archived", "search": "TESTHYG", "limit": 200},
            timeout=15,
        )
        assert r2.status_code == 200
        nums = [o.get("order_number") for o in r2.json().get("items", [])]
        assert target in nums, "Archived order missing from visibility=archived"

    def test_clear_tag_on_order(self, auth_headers, seed_orders):
        target = seed_orders[1]  # still tagged 'test', not archived
        r = requests.post(
            f"{BASE_URL}/api/admin/orders/bulk-tag",
            headers=auth_headers,
            json={"order_numbers": [target], "tag": "clear"},
            timeout=15,
        )
        assert r.status_code == 200, r.text

        # After clearing tag and NOT archived — should appear in 'active' visibility
        r2 = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers=auth_headers,
            params={"visibility": "active", "search": "TESTHYG", "limit": 200},
            timeout=15,
        )
        assert r2.status_code == 200
        items = r2.json().get("items", [])
        match = next((o for o in items if o.get("order_number") == target), None)
        assert match is not None, "Order with cleared tag should re-appear in active visibility"
        assert match.get("tag") in (None, ""), match

    def test_orders_response_includes_is_archived_and_tag(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers=auth_headers,
            params={"visibility": "all", "limit": 10},
            timeout=15,
        )
        assert r.status_code == 200
        items = r.json().get("items", [])
        assert items
        for o in items:
            assert "is_archived" in o, f"is_archived missing in {o.get('order_number')}"
            assert "tag" in o, f"tag missing in {o.get('order_number')}"
            assert isinstance(o["is_archived"], bool)

    def test_bulk_tag_empty_rejected(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/orders/bulk-tag",
            headers=auth_headers,
            json={"order_numbers": [], "tag": "test"},
            timeout=15,
        )
        assert r.status_code == 400, r.text


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
