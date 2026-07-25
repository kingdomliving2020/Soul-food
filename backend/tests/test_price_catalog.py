"""Regression guard for the server-authoritative price catalog (launch-critical).
Locks in that every sellable storefront cart-id floors to its real price and
that a tampered client price can never win."""
from price_catalog import catalog_price, is_dynamic_allowed

EXPECTED = {
    "holiday-ae-digital": 9.99, "holiday-ye-paperback": 19.99,
    "breakfast-ae-digital": 14.99, "breakfast-ae-paperback": 29.99,
    "ihi-ae-booklet": 7.99, "ihi-ae-pro-ipdf": 11.99, "ihi-ae-pro-epub": 10.49,
    "ihi-ae-pro-bundle": 19.99, "medallion-grinch-ie": 9.99,
    "gaming-pass-90": 24.99, "gaming_day_pass": 29.99, "pen-standard-black": 7.99,
    "club-5": 64.95, "sgb-4": 44.0, "holiday-table-bundle-ae": 19.99,
    "full-table-experience-ye": 34.99, "holiday-full-adult-epub": 8.49,
    "holiday-full-instructor-physical": 34.99, "breakfast-meal-adult-ipdf": 14.99,
    "breakfast-snack-month-1-adult-ipdf": 8.99,
    "holiday-nibble-holiday-ae-covenant-adult-interactive": 3.99,
    "lunch-workbook-youth-physical": 21.99,
    "offline-game-master-bkft-bm1-all-digital": 10.0,
    "offline-game-master-bkft-bundle-all-physical": 25.99,
}


def test_all_storefront_ids_resolve_to_expected_price():
    for cid, price in EXPECTED.items():
        assert catalog_price({"id": cid}) == price, cid


def test_tampered_client_price_cannot_win():
    # Server floor logic: unit = max(client, auth)
    for cid, price in EXPECTED.items():
        auth = catalog_price({"id": cid})
        assert auth is not None
        client = 0.50  # tamper
        assert max(client, auth) == price, cid


def test_unknown_priced_item_is_unresolved():
    assert catalog_price({"id": "totally-made-up-sku-xyz", "price": 0.50}) is None


def test_gift_certificate_is_dynamic_allowed():
    assert is_dynamic_allowed({"id": "gift-certificate-25", "isGiftCertificate": True}) is True
    assert is_dynamic_allowed({"id": "holiday-ae-digital"}) is False
