"""Backend fulfillment tests for Offline Game Master — Breakfast Edition.

Verifies the resolver-level bug fix: each of the 4 cart ids (bm1/bm2/bm3/bundle)
must resolve to its OWN distinct PDF (not the Break*fast full workbook).

Uses direct DB + resolver calls (no Stripe) since the bug was in the resolver.
"""
import asyncio
import os
import sys
import pytest

sys.path.insert(0, "/app/backend")

EXPECTED = {
    "offline-game-master-bkft-bm1-all-digital": {
        "filename": "SOFU_BKFT_BM1_GM_v9.pdf",
        "size": 4055139,
    },
    "offline-game-master-bkft-bm2-all-digital": {
        "filename": "SOFU_BKFT_BM2_GM_v9.pdf",
        "size": 4123112,
    },
    "offline-game-master-bkft-bm3-all-digital": {
        "filename": "SOFU_BKFT_BM3_GM_v9.pdf",
        "size": 4063857,
    },
    "offline-game-master-bkft-bundle-all-digital": {
        "filename": "SOFU_BKFT_MAIN_GM_v9.pdf",
        "size": 4868510,
    },
}


def _cart_item(cart_id: str) -> dict:
    """Simulate the storefront cart item shape from QuickOrder.js line ~1659."""
    return {
        "id": cart_id,
        "product_id": None,
        "name": "Offline Game Master — Breakfast Edition",
        "format": "digital",
        "quantity": 1,
        "price": 39.99,
    }


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.mark.parametrize("cart_id,expected", list(EXPECTED.items()))
def test_resolver_returns_correct_file_key(event_loop, cart_id, expected):
    from payment_routes import resolve_item_to_file_entries_async

    entries = event_loop.run_until_complete(
        resolve_item_to_file_entries_async(_cart_item(cart_id))
    )
    assert entries, f"Resolver returned NO entries for {cart_id}"
    assert len(entries) == 1, f"Expected 1 entry for {cart_id}, got {len(entries)}: {entries}"
    file_key = entries[0]["file_key"]
    assert file_key == cart_id, (
        f"BUG: cart_id '{cart_id}' resolved to file_key '{file_key}' "
        f"(should be self, not aliased to breakfast_ae_digital)"
    )


@pytest.mark.parametrize("cart_id,expected", list(EXPECTED.items()))
def test_get_pdf_path_returns_correct_storage(event_loop, cart_id, expected):
    from payment_routes import get_pdf_path_async

    path = event_loop.run_until_complete(get_pdf_path_async(cart_id))
    assert path, f"No storage path for {cart_id}"
    assert path.startswith("objstore:"), f"Expected objstore: prefix, got {path}"


@pytest.mark.parametrize("cart_id,expected", list(EXPECTED.items()))
def test_object_storage_serves_correct_file(event_loop, cart_id, expected):
    """Fetch the actual bytes from Object Storage and verify size."""
    from server import db
    import storage_service as storage_service

    async def _fetch():
        doc = await db.files.find_one(
            {"is_deleted": False,
             "attachments": {"$elemMatch": {"target_type": "product", "target_id": cart_id}}},
            {"_id": 0, "storage_path": 1, "original_filename": 1, "size_bytes": 1},
        )
        assert doc, f"No db.files attachment for {cart_id}"
        assert doc["original_filename"] == expected["filename"], (
            f"Filename mismatch for {cart_id}: got {doc['original_filename']}"
        )
        assert doc["size_bytes"] == expected["size"], (
            f"Size mismatch for {cart_id}: got {doc['size_bytes']}, expected {expected['size']}"
        )
        # get_object is sync and returns (bytes, content_type)
        data, ctype = storage_service.get_object(doc["storage_path"])
        assert data[:4] == b"%PDF", f"Not a PDF for {cart_id}: {data[:20]}"
        assert len(data) == expected["size"], (
            f"Downloaded size {len(data)} != expected {expected['size']} for {cart_id}"
        )
        return doc

    event_loop.run_until_complete(_fetch())


def test_all_four_files_are_distinct(event_loop):
    """Regression: BM1/BM2/BM3/bundle must serve 4 DIFFERENT files."""
    from server import db

    async def _fetch_all():
        paths = {}
        for cart_id in EXPECTED:
            doc = await db.files.find_one(
                {"is_deleted": False,
                 "attachments": {"$elemMatch": {"target_type": "product", "target_id": cart_id}}},
                {"_id": 0, "storage_path": 1, "original_filename": 1},
            )
            paths[cart_id] = (doc["storage_path"], doc["original_filename"])
        return paths

    paths = event_loop.run_until_complete(_fetch_all())
    storage_paths = [p[0] for p in paths.values()]
    filenames = [p[1] for p in paths.values()]
    assert len(set(storage_paths)) == 4, f"Non-distinct storage_paths: {paths}"
    assert len(set(filenames)) == 4, f"Non-distinct filenames: {paths}"
    # Explicit anti-regression: none should be the Break*fast full workbook
    for cart_id, (_, fname) in paths.items():
        assert "breakfast-ae-full" not in fname.lower(), (
            f"BUG REGRESSION: {cart_id} is serving the Break*fast workbook ({fname})"
        )
