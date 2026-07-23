"""Admin lifecycle (3-axis payment/fulfillment/order) API tests for QA-FUL seeded orders."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://soul-food-mvp.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "overflowharvest@gmail.com"
ADMIN_PASSWORD = "Admin123!"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    assert tok, f"No token returned: {data}"
    return tok


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


def _get_orders(headers):
    r = requests.get(f"{BASE_URL}/api/admin/orders?search=QA-FUL&limit=50", headers=headers, timeout=30)
    assert r.status_code == 200, f"list failed {r.status_code} {r.text[:300]}"
    data = r.json()
    if isinstance(data, dict):
        orders = data.get("items") or data.get("orders") or []
    else:
        orders = data
    return {o["order_number"]: o for o in orders}


def _reset_seed():
    # Reset via seed script
    import subprocess
    subprocess.run(["python3", "-m", "scripts.seed_qa_orders"], cwd="/app/backend",
                   capture_output=True, timeout=60)


@pytest.fixture(scope="module", autouse=True)
def seed_reset():
    _reset_seed()
    yield
    _reset_seed()


def test_login_and_list_qa_orders(auth_headers):
    orders = _get_orders(auth_headers)
    expected = {"QA-FUL-DIGITAL", "QA-FUL-PHYSICAL", "QA-FUL-MIXED",
                "QA-FUL-GIFT", "QA-FUL-IE", "QA-FUL-SGB", "QA-FUL-BULK"}
    missing = expected - set(orders.keys())
    assert not missing, f"Missing seeded orders: {missing}"


def _lifecycle(o):
    return o.get("lifecycle") or {}


def test_digital_only_is_complete(auth_headers):
    orders = _get_orders(auth_headers)
    lc = _lifecycle(orders["QA-FUL-DIGITAL"])
    assert lc.get("payment_status") == "paid"
    assert lc.get("order_status") == "complete", f"DIGITAL not complete: {lc}"
    assert lc.get("fulfillment", {}).get("digital", {}).get("status") == "delivered"


def test_physical_pending_is_open(auth_headers):
    orders = _get_orders(auth_headers)
    lc = _lifecycle(orders["QA-FUL-PHYSICAL"])
    assert lc.get("order_status") != "complete"
    assert lc.get("fulfillment", {}).get("physical", {}).get("status") == "pending"


def test_mixed_has_all_three_lanes_open(auth_headers):
    orders = _get_orders(auth_headers)
    lc = _lifecycle(orders["QA-FUL-MIXED"])
    f = lc.get("fulfillment", {})
    assert f.get("digital", {}).get("status") == "delivered"
    assert f.get("physical", {}).get("status") == "pending"
    assert f.get("manual", {}).get("applicable") is True
    assert lc.get("order_status") != "complete"


def test_gift_recipient_pending(auth_headers):
    orders = _get_orders(auth_headers)
    lc = _lifecycle(orders["QA-FUL-GIFT"])
    assert lc.get("fulfillment", {}).get("recipient", {}).get("status") == "pending"
    assert lc.get("order_status") != "complete"


def test_ie_has_manual_review(auth_headers):
    orders = _get_orders(auth_headers)
    lc = _lifecycle(orders["QA-FUL-IE"])
    assert lc.get("fulfillment", {}).get("manual", {}).get("applicable") is True
    assert lc.get("fulfillment", {}).get("manual", {}).get("status") == "pending_review"
    assert lc.get("order_status") != "complete"


# ---------- Transition tests ----------

def _post(url, headers, payload):
    r = requests.post(url, headers=headers, json=payload, timeout=30)
    return r


def test_physical_only_completion_flow(auth_headers):
    ordn = "QA-FUL-PHYSICAL"
    url = f"{BASE_URL}/api/admin/orders/{ordn}/fulfillment"
    for status in ("packed", "shipped", "delivered"):
        r = _post(url, auth_headers, {"fulfillment_status": status, "tracking_number": "TRACK123",
                                       "carrier": "UPS", "notify": False})
        assert r.status_code == 200, f"physical {status} failed: {r.status_code} {r.text[:300]}"
    orders = _get_orders(auth_headers)
    lc = _lifecycle(orders[ordn])
    assert lc.get("order_status") == "complete", f"After physical delivered not complete: {lc}"


def test_mixed_does_not_autocomplete(auth_headers):
    ordn = "QA-FUL-MIXED"
    url = f"{BASE_URL}/api/admin/orders/{ordn}/fulfillment"
    for status in ("packed", "shipped", "delivered"):
        r = _post(url, auth_headers, {"fulfillment_status": status, "notify": False})
        assert r.status_code == 200
    orders = _get_orders(auth_headers)
    lc = _lifecycle(orders[ordn])
    assert lc.get("order_status") != "complete", f"MIXED wrongly auto-completed after physical: {lc}"
    # Now mark manual fulfilled
    r = _post(f"{BASE_URL}/api/admin/orders/{ordn}/manual-fulfillment", auth_headers,
              {"status": "fulfilled"})
    assert r.status_code == 200, r.text[:300]
    orders = _get_orders(auth_headers)
    lc = _lifecycle(orders[ordn])
    assert lc.get("order_status") == "complete", f"MIXED not complete after manual fulfilled: {lc}"


def test_gift_recipient_completion(auth_headers):
    ordn = "QA-FUL-GIFT"
    r = _post(f"{BASE_URL}/api/admin/orders/{ordn}/recipient-access", auth_headers,
              {"confirmed": True})
    assert r.status_code == 200, r.text[:300]
    orders = _get_orders(auth_headers)
    lc = _lifecycle(orders[ordn])
    assert lc.get("order_status") == "complete", f"GIFT not complete after recipient confirm: {lc}"


def test_manual_ie_completion(auth_headers):
    ordn = "QA-FUL-IE"
    r = _post(f"{BASE_URL}/api/admin/orders/{ordn}/manual-fulfillment", auth_headers,
              {"status": "fulfilled"})
    assert r.status_code == 200
    lc = _lifecycle(_get_orders(auth_headers)[ordn])
    assert lc.get("order_status") == "complete"


def test_manual_bulk_completion(auth_headers):
    ordn = "QA-FUL-BULK"
    r = _post(f"{BASE_URL}/api/admin/orders/{ordn}/manual-fulfillment", auth_headers,
              {"status": "fulfilled"})
    assert r.status_code == 200
    lc = _lifecycle(_get_orders(auth_headers)[ordn])
    assert lc.get("order_status") == "complete"


def test_manual_sgb_completion_and_reopen(auth_headers):
    ordn = "QA-FUL-SGB"
    r = _post(f"{BASE_URL}/api/admin/orders/{ordn}/manual-fulfillment", auth_headers,
              {"status": "fulfilled"})
    assert r.status_code == 200
    lc = _lifecycle(_get_orders(auth_headers)[ordn])
    assert lc.get("order_status") == "complete"
    # Reopen
    r = _post(f"{BASE_URL}/api/admin/orders/{ordn}/manual-fulfillment", auth_headers,
              {"status": "pending_review"})
    assert r.status_code == 200
    lc = _lifecycle(_get_orders(auth_headers)[ordn])
    assert lc.get("order_status") != "complete", f"SGB should reopen: {lc}"
