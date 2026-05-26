"""
Pre-launch P0 hardening tests:
- Coupon hardening: leaked codes disabled, OFH_INTERNAL_$1 hidden coupon, admin endpoints
- Regression: WELCOME10, SoulX1079, BOOK10 min_quantity, spend_cap
- PWA: /manifest.json + /service-worker.js + index.html meta tags
"""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://content-durability.preview.emergentagent.com").rstrip("/")

ADMIN_EMAIL = "overflowharvest@gmail.com"
ADMIN_PASSWORD = "Admin123!"

LEAKED_CODES = [
    "BETATEST", "DOLLARTEST", "Beta1!2!3!", "Beta123abc", "Beta123abcd",
    "TESTII", "test123", "test1234", "test12345",
]


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={
        "identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD
    })
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_api(api, admin_token):
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}",
    })
    return s


# ---------------------------------------------------------------------------
# Leaked coupon hardening — should all be invalid
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("code", LEAKED_CODES)
def test_leaked_codes_rejected(api, code):
    r = api.post(f"{BASE_URL}/api/coupons/validate", json={
        "code": code, "cart_total": 50.0, "quantity": 1
    })
    assert r.status_code == 200, f"HTTP {r.status_code}: {r.text[:200]}"
    data = r.json()
    assert data.get("valid") is False, f"Leaked code {code} unexpectedly valid: {data}"
    msg = (data.get("message") or "").lower()
    assert "invalid" in msg or "not" in msg or "disabled" in msg, f"Unexpected msg for {code}: {data}"


# ---------------------------------------------------------------------------
# Hidden internal $1 override
# ---------------------------------------------------------------------------
def test_internal_test_coupon_overrides_cart_to_one_dollar(api):
    r = api.post(f"{BASE_URL}/api/coupons/validate", json={
        "code": "OFH_INTERNAL_$1", "cart_total": 15.99, "quantity": 1
    })
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    assert data.get("valid") is True, f"Internal coupon invalid: {data}"
    assert data.get("override_total") == 1.0, f"override_total mismatch: {data}"
    assert "$1.00" in (data.get("message") or ""), f"$1.00 missing from message: {data}"


# ---------------------------------------------------------------------------
# Regression — WELCOME10 still valid (10% off)
# ---------------------------------------------------------------------------
def test_welcome10_still_valid(api):
    r = api.post(f"{BASE_URL}/api/coupons/validate", json={
        "code": "WELCOME10", "cart_total": 50.0, "quantity": 1
    })
    assert r.status_code == 200
    data = r.json()
    assert data.get("valid") is True, f"WELCOME10 should still be valid: {data}"
    assert data.get("discount_percent") == 10, f"discount_percent mismatch: {data}"


def test_welcome10_no_spend_cap_on_large_cart(api):
    """WELCOME10 has no spend_cap — full 10% should apply on $1000 cart."""
    r = api.post(f"{BASE_URL}/api/coupons/validate", json={
        "code": "WELCOME10", "cart_total": 1000.0, "quantity": 1
    })
    assert r.status_code == 200
    data = r.json()
    assert data.get("valid") is True, f"WELCOME10 invalid on large cart: {data}"
    assert data.get("discount_percent") == 10
    # If a spend_cap were applied, the discount_amount would be capped below 100.
    # Allow either explicit discount_amount or computed from percent.
    discount_amount = data.get("discount_amount")
    if discount_amount is not None:
        assert abs(float(discount_amount) - 100.0) < 0.01, f"Spend cap unexpectedly applied: {data}"


# ---------------------------------------------------------------------------
# Regression — SoulX1079 contributor 15%
# ---------------------------------------------------------------------------
def test_contributor_coupon_soulx1079(api):
    r = api.post(f"{BASE_URL}/api/coupons/validate", json={
        "code": "SoulX1079", "cart_total": 50.0, "quantity": 1
    })
    assert r.status_code == 200
    data = r.json()
    assert data.get("valid") is True, f"SoulX1079 should be valid: {data}"
    assert data.get("discount_percent") == 15, f"discount_percent mismatch: {data}"


# ---------------------------------------------------------------------------
# Regression — BOOK10 min_quantity
# ---------------------------------------------------------------------------
def test_book10_min_quantity_blocked(api):
    r = api.post(f"{BASE_URL}/api/coupons/validate", json={
        "code": "BOOK10", "cart_total": 60.0, "quantity": 3
    })
    assert r.status_code == 200
    data = r.json()
    assert data.get("valid") is False, f"BOOK10 should be blocked at qty=3: {data}"


def test_book10_min_quantity_allowed(api):
    r = api.post(f"{BASE_URL}/api/coupons/validate", json={
        "code": "BOOK10", "cart_total": 100.0, "quantity": 5
    })
    assert r.status_code == 200
    data = r.json()
    assert data.get("valid") is True, f"BOOK10 should be valid at qty=5: {data}"
    assert data.get("discount_percent") == 10


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------
def test_admin_harden_endpoint(admin_api):
    r = admin_api.post(f"{BASE_URL}/api/coupons/admin/harden-test-coupons", json={})
    assert r.status_code == 200, r.text[:300]
    body = r.json()
    summary = body.get("summary") or {}
    # disabled_count >= 9
    disabled_count = summary.get("disabled_count")
    assert disabled_count is not None, f"summary missing disabled_count: {body}"
    assert int(disabled_count) >= 9, f"disabled_count too low: {body}"
    assert summary.get("internal_test_coupon_code") == "OFH_INTERNAL_$1", f"Internal code mismatch: {body}"


def test_admin_toggle_non_test_coupon(admin_api, api):
    """Toggle WELCOME10 off then back on. Verify validate reflects state."""
    code = "WELCOME10"

    # Disable
    r = admin_api.post(f"{BASE_URL}/api/coupons/admin/{code}/toggle", json={"active": False})
    assert r.status_code == 200, r.text[:300]
    assert r.json().get("active") is False

    try:
        # Verify validate now returns invalid
        v = api.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": code, "cart_total": 50.0, "quantity": 1
        })
        assert v.status_code == 200
        assert v.json().get("valid") is False, f"Expected invalid after toggle off: {v.json()}"
    finally:
        # Re-enable (always restore)
        r2 = admin_api.post(f"{BASE_URL}/api/coupons/admin/{code}/toggle", json={"active": True})
        assert r2.status_code == 200
        assert r2.json().get("active") is True

    # Verify back to valid
    v2 = api.post(f"{BASE_URL}/api/coupons/validate", json={
        "code": code, "cart_total": 50.0, "quantity": 1
    })
    assert v2.status_code == 200
    assert v2.json().get("valid") is True, f"Expected valid after re-enable: {v2.json()}"


# ---------------------------------------------------------------------------
# PWA assets
# ---------------------------------------------------------------------------
def test_manifest_json():
    r = requests.get(f"{BASE_URL}/manifest.json")
    assert r.status_code == 200, r.text[:300]
    assert "application/json" in r.headers.get("content-type", "").lower()
    m = r.json()
    assert m.get("name") == "Soul Food", f"name mismatch: {m.get('name')}"
    assert m.get("short_name") == "SOFU", f"short_name mismatch: {m.get('short_name')}"
    assert m.get("display") == "standalone", f"display mismatch: {m.get('display')}"
    icons = m.get("icons") or []
    assert len(icons) >= 6, f"icons count too low ({len(icons)}): {icons}"


def test_service_worker_js():
    r = requests.get(f"{BASE_URL}/service-worker.js")
    assert r.status_code == 200, r.text[:300]
    assert "application/javascript" in r.headers.get("content-type", "").lower()
    body = r.text
    assert len(body) > 0


def test_index_html_pwa_tags():
    r = requests.get(f"{BASE_URL}/")
    assert r.status_code == 200
    html = r.text
    assert re.search(r'<link\s+rel="manifest"\s+href="/manifest\.json', html), \
        "manifest <link> missing in index.html"
    assert "apple-mobile-web-app" in html, "apple-mobile-web-app meta tags missing"
