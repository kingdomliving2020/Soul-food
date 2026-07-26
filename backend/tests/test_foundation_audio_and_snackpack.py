"""Regression tests for Foundation Month-1 Audio Companion auto-grant + Snack Pack
delivery remap (payment_routes). Run against the real dev Mongo (read/temp write,
self-cleaning). These cover fulfillment logic that cannot complete an e2e Stripe
checkout in preview (revoked key).
"""
import asyncio
import pytest
import payment_routes as pr

TEST_EMAIL = "pytest_fnd_audio@example.com"


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


async def _grant_and_read(item):
    await pr.db.audio_access.delete_one({"email": TEST_EMAIL})
    await pr._grant_audio_access_for_items([item], TEST_EMAIL)
    doc = await pr.db.audio_access.find_one({"email": TEST_EMAIL}, {"_id": 0})
    await pr.db.audio_access.delete_one({"email": TEST_EMAIL})
    return (doc or {}).get("series_access", []) or []


def test_foundation_print_grants_month1():
    s = _run(_grant_and_read({"id": "breakfast-meal-adult-physical", "name": "Foundation in Christ - Meal Bundle", "format": "physical", "quantity": 1}))
    assert "foundation-month1" in s and "holiday" not in s


def test_foundation_digital_workbook_grants_month1():
    s = _run(_grant_and_read({"id": "breakfast-ae-digital", "name": "Foundation in Christ Digital Workbook", "format": "digital", "quantity": 1}))
    assert "foundation-month1" in s


def test_foundation_ebook_does_not_grant():
    s = _run(_grant_and_read({"id": "breakfast-meal-adult-epub", "name": "Foundation eBook", "format": "epub", "quantity": 1}))
    assert "foundation-month1" not in s


def test_foundation_snackpack_does_not_grant():
    s = _run(_grant_and_read({"id": "bkft-sp-ae-m1", "name": "Break*fast Snack Pack AE M1", "format": "", "quantity": 1}))
    assert "foundation-month1" not in s


def test_snackpack_delivers_own_asset_not_full_workbook():
    async def check():
        for cid in ["bkft-sp-ae-m1", "bkft-sp-ye-m1", "bkft-sp-ae-m3"]:
            entries = await pr.resolve_item_to_file_entries_async({"id": cid, "name": cid, "quantity": 1})
            keys = [e["file_key"] for e in entries]
            # must NOT resolve to the full workbook digital asset
            assert "breakfast_ae_digital" not in keys and "breakfast_ye_digital" not in keys, f"{cid} over-delivers: {keys}"
            ver, fail = await pr._verified_entries_for_fulfillment(entries, caller="pytest")
            assert not fail, f"{cid} delivery failed: {fail}"
    _run(check())
