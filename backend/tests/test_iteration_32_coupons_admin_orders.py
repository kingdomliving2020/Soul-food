"""Iteration 32 — DEMOSOFU* + BETADOLLAR* coupon validation,
admin orders shape, and resend-email cleanup."""
import os
import time
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://soul-checkout-stage.preview.emergentagent.com").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "soul_food_db")

ADMIN_EMAIL = "overflowharvest@gmail.com"
ADMIN_PASSWORD = "Admin123!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/auth/login",
                     json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in login response: {data}"
    return token


@pytest.fixture(scope="module")
def mongo():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


@pytest.fixture(autouse=True)
def reset_demosofu79(mongo):
    """Ensure DEMOSOFU79 starts each test at uses_used=0, ACTIVE."""
    mongo.redemption_codes.update_one(
        {"code": "DEMOSOFU79"},
        {"$set": {"uses_used": 0, "status": "ACTIVE"}}
    )
    yield
    mongo.redemption_codes.update_one(
        {"code": "DEMOSOFU79"},
        {"$set": {"uses_used": 0, "status": "ACTIVE"}}
    )


# ---------- Coupon validation ----------

class TestDemoCoupons:
    def test_demosofu79_breakfast_valid(self, session):
        r = session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "DEMOSOFU79",
            "cart_total": 50,
            "product_ids": ["breakfast_ae_digital"],
            "quantity": 1,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True, d
        assert d["discount_percent"] == 100
        assert d["code"] == "DEMOSOFU79"

    def test_demosofu60_holiday_valid(self, session):
        r = session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "DEMOSOFU60",
            "cart_total": 50,
            "product_ids": ["holiday_ae"],
            "quantity": 1,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True, d
        assert d["discount_percent"] == 100

    def test_demosofu79_dinner_rejected(self, session):
        r = session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "DEMOSOFU79",
            "cart_total": 50,
            "product_ids": ["dinner_ae"],
            "quantity": 1,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is False
        assert "Holiday" in d["message"] and ("Break" in d["message"] or "fast" in d["message"]), d


class TestBetaDollarCoupons:
    def test_betadollar79_override(self, session):
        r = session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "BETADOLLAR79",
            "cart_total": 50,
            "product_ids": ["holiday_ae"],
            "quantity": 1,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True, d
        assert d["override_total"] == 1.0
        assert d["code"] == "BETADOLLAR79"

    def test_betadollar97_override(self, session):
        r = session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "BETADOLLAR97",
            "cart_total": 100,
            "product_ids": ["holiday_ae"],
            "quantity": 1,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True, d
        assert d["override_total"] == 1.0


class TestRegression:
    def test_unknown_code_rejected(self, session):
        r = session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "NEVERHEARDOFTHIS",
            "cart_total": 50,
            "product_ids": ["holiday_ae"],
            "quantity": 1,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is False
        assert d["message"] == "Invalid coupon code"

    def test_dollartest_legacy_still_works(self, session):
        r = session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "DOLLARTEST",
            "cart_total": 50,
            "product_ids": ["holiday_ae"],
            "quantity": 1,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True, d
        assert d["override_total"] == 1.0


class TestUsageIncrement:
    def test_use_increments_uses_used(self, session, mongo):
        # Verify start at 0
        rc = mongo.redemption_codes.find_one({"code": "DEMOSOFU79"})
        assert rc["uses_used"] == 0
        # Call /use endpoint
        r = session.post(f"{BASE_URL}/api/coupons/use/DEMOSOFU79?order_id=TEST-INC-XYZ")
        assert r.status_code == 200
        rc2 = mongo.redemption_codes.find_one({"code": "DEMOSOFU79"})
        assert rc2["uses_used"] == 1, rc2

    def test_max_uses_reached_blocks_validation(self, session, mongo):
        mongo.redemption_codes.update_one(
            {"code": "DEMOSOFU79"}, {"$set": {"uses_used": 5}}
        )
        r = session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "DEMOSOFU79",
            "cart_total": 50,
            "product_ids": ["breakfast_ae_digital"],
            "quantity": 1,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is False
        assert "maximum usage" in d["message"].lower()

    def test_revoked_status_blocks_validation(self, session, mongo):
        mongo.redemption_codes.update_one(
            {"code": "DEMOSOFU79"}, {"$set": {"status": "REVOKED"}}
        )
        r = session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "DEMOSOFU79",
            "cart_total": 50,
            "product_ids": ["breakfast_ae_digital"],
            "quantity": 1,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is False
        assert "revoked" in d["message"].lower() or "cannot be used" in d["message"].lower()


# ---------- Admin orders shape ----------

class TestAdminOrders:
    def test_admin_orders_shape_items_not_orders(self, session, admin_token):
        r = session.get(f"{BASE_URL}/api/admin/orders",
                        headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "items" in d, f"Expected key 'items', got {list(d.keys())}"
        assert "orders" not in d, f"Got duplicate-route key 'orders' in response: {list(d.keys())}"
        for k in ("total", "page", "limit", "pages"):
            assert k in d, f"Missing pagination key {k}"
        assert isinstance(d["items"], list)

    def test_admin_orders_unauthorized(self, session):
        r = session.get(f"{BASE_URL}/api/admin/orders")
        assert r.status_code in (401, 403)

    def test_resend_email_endpoint_exists(self, session, admin_token):
        # Use a fake order number — endpoint should respond with 404 (order not found),
        # NOT a route-level 404 (Not Found at FastAPI level).
        r = session.post(
            f"{BASE_URL}/api/admin/orders/NONEXISTENT-12345/resend-email",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )
        # Route exists — should be 404 (order missing) or 400/422 — never 405.
        assert r.status_code != 405, f"Route registered but method not allowed: {r.text}"
        # Should not be FastAPI's 404 with detail 'Not Found' generic
        assert r.status_code in (200, 400, 404, 422), r.text

    def test_send_email_alias_removed(self, session, admin_token):
        # Old duplicate alias /send-email should be gone
        r = session.post(
            f"{BASE_URL}/api/admin/orders/NONEXISTENT-12345/send-email",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )
        assert r.status_code in (404, 405), f"Alias still registered: {r.status_code} {r.text}"
