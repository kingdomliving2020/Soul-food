"""
Buyer vs Recipient (purchase_type) backend tests — iteration 38.

NOTE: The Stripe secret key in backend/.env was rotated to a placeholder
("ROTATE_M****...26_22") at the time of this run. Any path that reaches
stripe.checkout.Session.create() will return 500 with "Invalid API Key".

The tests below are written to verify the feature logic WITHOUT requiring a
working Stripe key:

  1. Recipient validation (400 paths) — runs BEFORE Stripe; fully testable.
  2. Verification gate REMOVAL — the gate (if present) would return 403 BEFORE
     the Stripe call. So a response that is NOT 403/email_not_verified
     (even if it's a 500 stripe error) proves the gate is gone.
  3. GET /api/payments/order/{order_number} field presence — we directly seed
     a payment_transactions doc with purchase_type/digital_recipient_email
     and assert the GET endpoint surfaces them.
  4. Admin /orders/admin/list field presence — same: seed transactions and
     assert the listing payload includes the new fields.
"""

import os
import uuid
import asyncio
import pytest
import requests
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://gifting-checkout.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "soul_food_db")

DIGITAL_ITEM = {
    "product_id": "sofu_digital_test",
    "name": "Soul Food Digital Devotional",
    "salePrice": 4.99,
    "price": 4.99,
    "quantity": 1,
    "edition": "digital",
}

ADMIN_EMAIL = "overflowharvest@gmail.com"
ADMIN_PASSWORD = "Admin123!"


# --------------------------------------------------------------------------
# Fixtures
# --------------------------------------------------------------------------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    body = r.json()
    token = body.get("access_token") or body.get("token")
    if not token:
        pytest.skip(f"Admin login did not return token (2FA?): {body}")
    return token


def _run(coro):
    """Run an async coroutine synchronously from a sync test."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError("closed")
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@pytest.fixture(scope="module")
def seeded_orders():
    """Seed a 'self' and a 'gift' payment_transactions doc directly into mongo.

    These bypass Stripe (since key is rotated) but exercise the same GET and
    admin-list code paths.
    """
    self_order_number = f"SF-TEST-SELF-{uuid.uuid4().hex[:6].upper()}"
    gift_order_number = f"SF-TEST-GIFT-{uuid.uuid4().hex[:6].upper()}"

    async def _seed():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        common = {
            "items": [
                {
                    "product_id": "sofu_digital_test",
                    "normalized_product_id": "sofu_digital_test",
                    "name": "Soul Food Digital Devotional",
                    "quantity": 1,
                    "salePrice": 4.99,
                    "edition": "digital",
                }
            ],
            "total_amount": 4.99,
            "original_subtotal": 4.99,
            "currency": "usd",
            "payment_status": "paid",
            "status": "completed",
            "customer_name": "Test Buyer",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await db.payment_transactions.insert_one({
            **common,
            "session_id": f"cs_test_self_{uuid.uuid4().hex[:8]}",
            "order_number": self_order_number,
            "customer_email": "buyer_self@test.com",
            "purchase_type": "self",
            "digital_recipient_email": None,
        })
        await db.payment_transactions.insert_one({
            **common,
            "session_id": f"cs_test_gift_{uuid.uuid4().hex[:8]}",
            "order_number": gift_order_number,
            "customer_email": "buyer@test.com",
            "purchase_type": "gift",
            "digital_recipient_email": "recipient@test.com",
        })
        client.close()

    _run(_seed())

    yield {"self": self_order_number, "gift": gift_order_number}

    async def _cleanup():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        await db.payment_transactions.delete_many({
            "order_number": {"$in": [self_order_number, gift_order_number]}
        })
        client.close()
    try:
        _run(_cleanup())
    except Exception:
        pass


# --------------------------------------------------------------------------
# 1. Validation paths (do NOT hit Stripe) — fully testable
# --------------------------------------------------------------------------
class TestGiftRecipientValidation:
    def test_gift_missing_recipient_returns_400(self, session):
        payload = {
            "items": [DIGITAL_ITEM],
            "origin_url": BASE_URL,
            "purchase_type": "gift",
            "digital_recipient_email": "",
            "customer_email": "buyer@test.com",
        }
        r = session.post(f"{API}/payments/checkout/cart", json=payload)
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text[:300]}"
        detail = (r.json().get("detail") or "").lower()
        assert "recipient" in detail or "email" in detail, r.json()

    def test_gift_invalid_email_returns_400(self, session):
        payload = {
            "items": [DIGITAL_ITEM],
            "origin_url": BASE_URL,
            "purchase_type": "gift",
            "digital_recipient_email": "not-an-email",
            "customer_email": "buyer@test.com",
        }
        r = session.post(f"{API}/payments/checkout/cart", json=payload)
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text[:300]}"

    def test_gift_recipient_missing_at_symbol_returns_400(self, session):
        payload = {
            "items": [DIGITAL_ITEM],
            "origin_url": BASE_URL,
            "purchase_type": "gift",
            "digital_recipient_email": "userathost.com",
            "customer_email": "buyer@test.com",
        }
        r = session.post(f"{API}/payments/checkout/cart", json=payload)
        assert r.status_code == 400


# --------------------------------------------------------------------------
# 2. Self/Gift checkout — Stripe key blocked; verify validation passes through
# --------------------------------------------------------------------------
class TestCheckoutPassesValidation:
    """If Stripe key were live, these would return 200. With the rotated
    placeholder key they return 500 'Invalid API Key' — but crucially NOT 400
    (recipient validation) and NOT 403 (no verification gate). That proves
    the request payload was accepted and the request reached Stripe."""

    def test_self_payload_accepted_by_validation(self, session):
        payload = {
            "items": [DIGITAL_ITEM],
            "origin_url": BASE_URL,
            "purchase_type": "self",
            "customer_email": f"TEST_buyer_self_{uuid.uuid4().hex[:6]}@example.com",
            "customer_name": "Self Buyer",
        }
        r = session.post(f"{API}/payments/checkout/cart", json=payload)
        # Acceptable: 200 (live stripe) or 500 with stripe error (rotated key)
        if r.status_code == 200:
            assert "url" in r.json()
        else:
            assert r.status_code == 500, f"Unexpected status {r.status_code}: {r.text[:300]}"
            assert "stripe" in r.text.lower() or "api key" in r.text.lower(), r.text[:300]

    def test_gift_payload_accepted_by_validation(self, session):
        payload = {
            "items": [DIGITAL_ITEM],
            "origin_url": BASE_URL,
            "purchase_type": "gift",
            "digital_recipient_email": "recipient@test.com",
            "customer_email": "buyer@test.com",
            "customer_name": "Gift Buyer",
        }
        r = session.post(f"{API}/payments/checkout/cart", json=payload)
        if r.status_code == 200:
            assert "url" in r.json()
        else:
            assert r.status_code == 500, f"Unexpected {r.status_code}: {r.text[:300]}"
            assert "stripe" in r.text.lower() or "api key" in r.text.lower()


# --------------------------------------------------------------------------
# 3. VERIFICATION GATE REMOVED — must NOT return 403 email_not_verified
# --------------------------------------------------------------------------
class TestVerificationGateRemoved:
    @pytest.fixture(scope="class")
    def unverified_user(self):
        unique = uuid.uuid4().hex[:8]
        email = f"TEST_unverified_{unique}@example.com"
        username = f"test_unv_{unique}"
        reg_payload = {
            "email": email,
            "username": username,
            "password": "UnvTest123!",
            "name": "Unverified Tester",
        }
        r = requests.post(f"{API}/auth/register", json=reg_payload)
        if r.status_code != 200:
            pytest.skip(f"Register failed: {r.status_code} {r.text[:200]}")
        body = r.json()
        token = body.get("access_token")
        user_id = body.get("user", {}).get("id")
        assert token and user_id, body

        async def _set_unverified():
            client = AsyncIOMotorClient(MONGO_URL)
            db = client[DB_NAME]
            await db.users.update_one({"id": user_id}, {"$set": {"email_verified": False}})
            doc = await db.users.find_one({"id": user_id}, {"_id": 0, "email_verified": 1, "role": 1})
            client.close()
            return doc

        doc = _run(_set_unverified())
        assert doc is not None, f"User {user_id} not found in {DB_NAME}.users after register"
        assert doc.get("email_verified") is False, doc

        yield {"email": email, "user_id": user_id, "token": token}

        async def _cleanup():
            client = AsyncIOMotorClient(MONGO_URL)
            db = client[DB_NAME]
            await db.users.delete_one({"id": user_id})
            client.close()
        try:
            _run(_cleanup())
        except Exception:
            pass

    def test_unverified_user_is_not_blocked_by_verification_gate(self, unverified_user):
        """Critical: must NOT return 403 with email_not_verified."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {unverified_user['token']}",
        }
        payload = {
            "items": [DIGITAL_ITEM],
            "origin_url": BASE_URL,
            "purchase_type": "self",
            "customer_email": unverified_user["email"],
            "customer_name": "Unverified Tester",
        }
        r = requests.post(f"{API}/payments/checkout/cart", json=payload, headers=headers)

        # The critical assertion: gate is removed → must NOT be 403
        assert r.status_code != 403, (
            f"VERIFICATION GATE STILL PRESENT — got 403: {r.text[:400]}"
        )
        # And must NOT mention email_not_verified
        assert "email_not_verified" not in r.text, (
            f"Verification gate marker still present in response: {r.text[:400]}"
        )
        # Acceptable outcomes: 200 (live stripe) or 500 (rotated key) — either
        # proves the request passed the gate and reached the Stripe call.
        assert r.status_code in (200, 500), f"Unexpected status {r.status_code}: {r.text[:300]}"
        if r.status_code == 500:
            assert "stripe" in r.text.lower() or "api key" in r.text.lower(), r.text[:300]


# --------------------------------------------------------------------------
# 4. GET /api/payments/order/{order_number} returns new fields
# --------------------------------------------------------------------------
class TestOrderDetailsIncludesPurchaseTypeFields:
    def test_self_order_get_returns_purchase_type_fields(self, session, seeded_orders):
        order_number = seeded_orders["self"]
        r = session.get(f"{API}/payments/order/{order_number}")
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert data.get("purchase_type") == "self", data
        assert data.get("digital_recipient_email") in (None, "", "null"), data

    def test_gift_order_get_returns_recipient_email(self, session, seeded_orders):
        order_number = seeded_orders["gift"]
        r = session.get(f"{API}/payments/order/{order_number}")
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert data.get("purchase_type") == "gift", data
        assert data.get("digital_recipient_email") == "recipient@test.com", data
        assert data.get("customer_email") == "buyer@test.com", data


# --------------------------------------------------------------------------
# 5. Admin /orders/admin/list returns purchase_type + digital_recipient_email
# --------------------------------------------------------------------------
class TestAdminListIncludesPurchaseTypeFields:
    def test_admin_list_includes_purchase_type_fields(self, admin_token, seeded_orders):
        gift_order_number = seeded_orders["gift"]
        self_order_number = seeded_orders["self"]
        r = requests.get(
            f"{API}/orders/admin/list",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"limit": 200},
        )
        assert r.status_code == 200, f"admin list failed: {r.status_code} {r.text[:400]}"
        body = r.json()
        orders = body.get("orders") if isinstance(body, dict) else body
        if orders is None and isinstance(body, dict):
            orders = body.get("data") or body.get("items") or []
        assert isinstance(orders, list) and len(orders) > 0, f"No orders: {str(body)[:300]}"

        # Key presence on any order
        sample = orders[0]
        assert "purchase_type" in sample, (
            f"purchase_type missing from admin list. Keys: {list(sample.keys())}"
        )
        assert "digital_recipient_email" in sample, (
            f"digital_recipient_email missing. Keys: {list(sample.keys())}"
        )

        # Find our seeded gift order and verify values
        def _matches(o, num):
            return (o.get("order_number") == num or o.get("order_id") == num)

        gift = next((o for o in orders if _matches(o, gift_order_number)), None)
        self_ord = next((o for o in orders if _matches(o, self_order_number)), None)
        assert gift is not None, f"Seeded gift order {gift_order_number} not found in admin list"
        assert gift.get("purchase_type") == "gift", gift
        assert gift.get("digital_recipient_email") == "recipient@test.com", gift
        if self_ord is not None:
            assert self_ord.get("purchase_type") == "self", self_ord
