"""End-to-end fulfillment verification for Game Master — Breakfast Edition.

Creates download tokens for each of the 4 cart_ids (bm1/bm2/bm3/bundle) using
the SAME code path production uses on post-payment (payment_routes.py line
~2874: resolve_item_to_file_entries_async -> create_download_link). Then hits
the actual /api/downloads/file/{token} public endpoint and verifies the served
bytes match the correct module's PDF (size + %PDF header).

This proves the full pipeline resolver -> file_path resolution -> download
endpoint -> Object Storage streaming without depending on Stripe.
"""
import asyncio
import os
import sys
import uuid
import requests
import pytest

sys.path.insert(0, "/app/backend")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://entitlement-hub-8.preview.emergentagent.com").rstrip("/")

CASES = [
    ("offline-game-master-bkft-bm1-all-digital",    "SOFU_BKFT_BM1_GM_v9.pdf",  4055139),
    ("offline-game-master-bkft-bm2-all-digital",    "SOFU_BKFT_BM2_GM_v9.pdf",  4123112),
    ("offline-game-master-bkft-bm3-all-digital",    "SOFU_BKFT_BM3_GM_v9.pdf",  4063857),
    ("offline-game-master-bkft-bundle-all-digital", "SOFU_BKFT_MAIN_GM_v9.pdf", 4868510),
]


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
def download_tokens(event_loop):
    """Create real download tokens using the production fulfillment code path."""
    from payment_routes import resolve_item_to_file_entries_async, get_pdf_path_async
    from download_protection import create_download_link

    tokens = {}

    async def _mint():
        order_id = f"TEST_ORDER_GM_{uuid.uuid4().hex[:8]}"
        for cart_id, filename, size in CASES:
            item = {
                "id": cart_id,
                "name": f"Offline Game Master — Breakfast Edition ({cart_id})",
                "format": "digital",
                "quantity": 1,
                "price": 10.0,
            }
            entries = await resolve_item_to_file_entries_async(item)
            assert entries, f"Resolver returned empty for {cart_id}"
            entry = entries[0]
            file_path = await get_pdf_path_async(entry["file_key"])
            assert file_path, f"No storage path resolved for {cart_id}"
            token, _exp = await create_download_link(
                order_id=order_id,
                user_id="TEST_USER_GM",
                user_email="test+gm@example.com",
                product_id=entry["file_key"],
                product_name=entry["name"],
                file_path=file_path,
                payment_verified=True,
            )
            tokens[cart_id] = (token, file_path, filename, size)
            print(f"[mint] {cart_id} -> token={token[:12]}... file_path={file_path}")
        return tokens

    event_loop.run_until_complete(_mint())
    yield tokens

    # Teardown: delete created download_links + log rows
    async def _cleanup():
        from server import db
        await db.download_links.delete_many({"user_id": "TEST_USER_GM"})
        await db.download_events.delete_many({"user_id": "TEST_USER_GM"})

    event_loop.run_until_complete(_cleanup())


@pytest.mark.parametrize("cart_id,filename,size", CASES)
def test_download_endpoint_serves_correct_pdf(download_tokens, cart_id, filename, size):
    token, file_path, expected_filename, expected_size = download_tokens[cart_id]
    url = f"{BASE_URL}/api/downloads/file/{token}"
    r = requests.get(url, timeout=90, stream=True)
    assert r.status_code == 200, f"HTTP {r.status_code} for {cart_id}: {r.text[:300]}"
    data = r.content
    # Verify actual PDF served
    assert data[:4] == b"%PDF", f"Not a PDF ({cart_id}): first bytes={data[:20]}"
    assert len(data) == expected_size, (
        f"Size mismatch for {cart_id}: got {len(data)}, expected {expected_size} "
        f"({expected_filename}). Content-Disposition={r.headers.get('Content-Disposition')}"
    )
    cd = r.headers.get("Content-Disposition", "")
    # Note: Content-Disposition filename is sanitized from product display-name,
    # not the original filename. Correctness of served file is proven by size +
    # PDF magic bytes above. We still assert Content-Disposition mentions the
    # cart_id (proves the download record is bound to the correct product).
    assert cart_id in cd, f"cart_id not in Content-Disposition '{cd}' for {cart_id}"


def test_all_four_downloads_are_distinct(download_tokens):
    """Fetch content-length via HEAD-like GET and confirm all 4 are different files."""
    sizes = {}
    for cart_id, filename, expected_size in CASES:
        token, _, _, _ = download_tokens[cart_id]
        r = requests.get(f"{BASE_URL}/api/downloads/file/{token}", timeout=60)
        sizes[cart_id] = len(r.content)
    unique = set(sizes.values())
    assert len(unique) == 4, f"Expected 4 distinct file sizes, got {sizes}"
    # BM1/BM2/BM3 must NOT equal the Break*fast full workbook size (very different files)
    # Bundle (MAIN, 198 pages) is largest, and clearly different from BM* (70-76 pages)
    bundle_size = sizes["offline-game-master-bkft-bundle-all-digital"]
    for k in ["offline-game-master-bkft-bm1-all-digital",
              "offline-game-master-bkft-bm2-all-digital",
              "offline-game-master-bkft-bm3-all-digital"]:
        assert sizes[k] != bundle_size, f"{k} incorrectly serving the bundle PDF"
