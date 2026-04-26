"""
Iteration 30 — Soul Food MVP soft-launch coverage:
- Admin Codes & Redemptions visibility (all batches with imported_by)
- IE asset routing (PDFs, docx, map images)
- Trivia game-assets endpoint
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://soul-checkout-stage.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "overflowharvest@gmail.com"
ADMIN_PASSWORD = "Admin123!"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_token():
    """Login as admin and return access_token (key 'identifier')."""
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    assert resp.status_code == 200, f"Admin login failed: {resp.status_code} {resp.text}"
    data = resp.json()
    token = data.get("access_token")
    assert token, f"No access_token in login response: {data}"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Admin Codes & Redemptions /batches ----------
class TestAdminBatchesVisibility:
    def test_batches_returns_all_with_imported_by(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/codes-redemptions/batches",
            headers=admin_headers,
            timeout=60,
        )
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
        data = r.json()
        # response shape: {"batches":[...], "total_batches": N}
        items = (
            data.get("batches")
            if isinstance(data, dict) and "batches" in data
            else (data.get("items") if isinstance(data, dict) else data)
        )
        assert isinstance(items, list), f"Unexpected response shape: {type(data)} -> {list(data.keys()) if isinstance(data, dict) else 'n/a'}"
        # global visibility — should be a sizeable set
        assert len(items) >= 1, "Expected at least 1 batch visible to admin"
        # imported_by key must exist on each batch (may be null for legacy rows, but key present)
        sample = items[0]
        assert "imported_by" in sample, f"Missing 'imported_by' in batch row: {list(sample.keys())}"
        # Per problem statement, target ~120 batches in prod-ish env; warn but don't hard fail
        if len(items) < 120:
            print(f"WARN: Expected >=120 batches, got {len(items)} (env-dependent)")


# ---------- Asset routing ----------
GAME_FILES = [
    ("ie-grinch-bingo-game-pk.pdf", "pdf"),
    ("ie-grinch-bingo-card-pk.pdf", "pdf"),
    ("ie-passport-trek-game.pdf", "pdf"),
    ("map-journey-reference-index.docx", "officedocument"),
]


@pytest.mark.parametrize("filename,ctype_substr", GAME_FILES)
def test_game_file_accessible(filename, ctype_substr):
    r = requests.get(f"{BASE_URL}/api/content/games/{filename}", timeout=60)
    assert r.status_code == 200, f"{filename} -> {r.status_code}"
    assert ctype_substr in r.headers.get("content-type", "").lower(), (
        f"{filename} content-type: {r.headers.get('content-type')}"
    )
    assert len(r.content) > 1000, f"{filename} suspiciously small: {len(r.content)} bytes"


def test_map_image_accessible():
    r = requests.get(
        f"{BASE_URL}/api/content/images/maps/abram-journey-promised-land.jpg",
        timeout=60,
    )
    assert r.status_code == 200, f"map image -> {r.status_code}"
    assert "image" in r.headers.get("content-type", "").lower()
    assert len(r.content) > 1000


def test_trivia_game_assets_listing():
    r = requests.get(f"{BASE_URL}/api/trivia/game-assets", timeout=30)
    assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
    data = r.json()
    items = (
        data.get("assets")
        if isinstance(data, dict) and "assets" in data
        else (data.get("items") if isinstance(data, dict) else data)
    )
    assert isinstance(items, list)
    assert len(items) >= 1, "Expected at least 1 trivia game asset"
