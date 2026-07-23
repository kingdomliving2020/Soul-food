"""Server-authoritative checkout pricing regression tests (HIGH fix).

Mocks Stripe + Mongo insert so we can assert the amount the server would charge
WITHOUT a live Stripe key. Verifies:
  - client-sent discount_percent / discount_dollars / override_total are IGNORED
  - a catalogued SKU is floored to its catalog price (can't underpay)
  - an invalid coupon is rejected (400)
  - a valid override coupon ($1) is honored server-side
Run: cd /app/backend && python3 -m pytest tests/test_checkout_pricing.py -q
"""
import asyncio
from unittest.mock import patch, AsyncMock

import stripe

import payment_routes
from payment_routes import create_cart_checkout_session, CartCheckoutRequest

# Motor's async client binds to the first running loop, so reuse ONE loop for
# every test (repeated asyncio.run() would close the loop and break db calls).
_LOOP = asyncio.new_event_loop()


class _FakeReq:
    headers = {}  # no Authorization -> guest checkout


class _FakeSession:
    id = "cs_test_fake"
    url = "https://stripe.test/session"


def _run(cart_kwargs):
    """Invoke the checkout endpoint with Stripe + Mongo mocked; return charged cents."""
    captured = {}

    def _fake_create(**kwargs):
        captured["line_items"] = kwargs["line_items"]
        return _FakeSession()

    req = CartCheckoutRequest(origin_url="https://soul-food-mvp.preview.emergentagent.com", **cart_kwargs)
    with patch.object(stripe.checkout.Session, "create", _fake_create), \
         patch.object(payment_routes.db.payment_transactions, "insert_one", new=AsyncMock()):
        _LOOP.run_until_complete(create_cart_checkout_session(req, _FakeReq()))
    return sum(li["price_data"]["unit_amount"] * li["quantity"] for li in captured["line_items"])


def test_client_discount_and_override_ignored_without_coupon():
    # A dynamic (non-catalogued) digital item priced 8.99; attacker sends 99% off + $1 override.
    cents = _run({
        "items": [{"id": "holiday-ae-digital", "name": "Holiday AE (ePub)", "format": "digital",
                   "salePrice": 8.99, "quantity": 1}],
        "discount_percent": 99, "discount_dollars": 8.0, "override_total": 1.0,
    })
    assert cents == 899, f"expected 899 (no client discount honored), got {cents}"


def test_catalogued_sku_price_floored():
    # Attacker sets salePrice 0.01 on a catalogued SKU -> must be floored to catalog price.
    catalog_price = payment_routes.PRODUCTS["snack_pack_ae_m1"]["sale_price"]
    cents = _run({
        "items": [{"product_id": "snack_pack_ae_m1", "name": "Snack Pack AE M1", "format": "digital",
                   "salePrice": 0.01, "quantity": 1}],
    })
    assert cents == int(round(catalog_price * 100)), f"expected floor {catalog_price}, got {cents/100}"


def test_invalid_coupon_rejected():
    from fastapi import HTTPException
    try:
        _run({
            "items": [{"id": "holiday-ae-digital", "format": "digital", "salePrice": 8.99, "quantity": 1}],
            "coupon_code": "TOTALLYNOTAREALCOUPON_XYZ",
        })
        assert False, "expected HTTPException for invalid coupon"
    except HTTPException as e:
        assert e.status_code == 400


def test_valid_override_coupon_honored():
    # OFH_INTERNAL_$1 sets the whole cart to $1.00 server-side.
    cents = _run({
        "items": [{"id": "holiday-ae-digital", "format": "digital", "salePrice": 8.99, "quantity": 1}],
        "coupon_code": "OFH_INTERNAL_$1",
    })
    assert cents == 100, f"expected 100 (server $1 override), got {cents}"
