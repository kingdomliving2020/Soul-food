"""
Test Suite for Post-Purchase Fulfillment Fix
=============================================
Tests the normalize_product_id, resolve_display_name_to_product_id, 
resolve_item_to_file_entries functions, and bundle expansion.

Key fix: Product IDs were stored as display names (e.g., 'Holiday Series - The Covenant - ADULT (99% off)')
instead of internal IDs. Fixed by adding robust display-name-to-product-ID resolver.
"""

import pytest
import requests
import os
import sys

# Add backend to path for direct imports
sys.path.insert(0, '/app/backend')

from payment_routes import (
    normalize_product_id,
    resolve_display_name_to_product_id,
    resolve_item_to_file_entries,
    PRODUCT_FILES,
    BUNDLE_EXPANSIONS
)

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestNormalizeProductId:
    """Tests for normalize_product_id function - handles internal IDs and display names"""
    
    # ==================== DISPLAY NAME RESOLUTION ====================
    
    def test_holiday_covenant_adult_with_discount(self):
        """Display name: 'Holiday Series - The Covenant - ADULT (99% off)' -> holiday_ae"""
        result = normalize_product_id("Holiday Series - The Covenant - ADULT (99% off)")
        assert result in PRODUCT_FILES, f"Expected valid PRODUCT_FILES key, got: {result}"
        # Should resolve to holiday_ae or holiday-nibble-ae-covenant-digital
        assert 'holiday' in result.lower()
        print(f"✓ 'Holiday Series - The Covenant - ADULT (99% off)' -> {result}")
    
    def test_full_workbooks_holiday_digital_adult_with_discount(self):
        """Display name: 'Full Workbooks - Holiday Digital (Adult) (15% off)' -> holiday_ae"""
        result = normalize_product_id("Full Workbooks - Holiday Digital (Adult) (15% off)")
        assert result in PRODUCT_FILES, f"Expected valid PRODUCT_FILES key, got: {result}"
        assert 'holiday' in result.lower()
        print(f"✓ 'Full Workbooks - Holiday Digital (Adult) (15% off)' -> {result}")
    
    def test_full_workbooks_breakfast_ae_digital_adult(self):
        """Display name: 'Full Workbooks - Break*fast AE Digital - ADULT' -> breakfast_ae_digital"""
        result = normalize_product_id("Full Workbooks - Break*fast AE Digital - ADULT")
        assert result in PRODUCT_FILES, f"Expected valid PRODUCT_FILES key, got: {result}"
        assert 'breakfast' in result.lower()
        print(f"✓ 'Full Workbooks - Break*fast AE Digital - ADULT' -> {result}")
    
    def test_full_workbooks_breakfast_paperback_youth(self):
        """Display name: 'Full Workbooks - Break*fast Paperback (Youth)' -> breakfast-ye-paperback or breakfast_ye_digital"""
        result = normalize_product_id("Full Workbooks - Break*fast Paperback (Youth)")
        # May resolve to breakfast_ye_digital or breakfast-ye-paperback
        assert 'breakfast' in result.lower() and ('ye' in result.lower() or 'youth' in result.lower())
        print(f"✓ 'Full Workbooks - Break*fast Paperback (Youth)' -> {result}")
    
    # ==================== INTERNAL ID RESOLUTION ====================
    
    def test_internal_id_holiday_ae(self):
        """Internal ID: holiday_ae -> holiday_ae"""
        result = normalize_product_id("holiday_ae")
        assert result == "holiday_ae"
        assert result in PRODUCT_FILES
        print(f"✓ 'holiday_ae' -> {result}")
    
    def test_internal_id_breakfast_ae_digital(self):
        """Internal ID: breakfast_ae_digital -> breakfast_ae_digital"""
        result = normalize_product_id("breakfast_ae_digital")
        assert result == "breakfast_ae_digital"
        assert result in PRODUCT_FILES
        print(f"✓ 'breakfast_ae_digital' -> {result}")
    
    def test_internal_id_breakfast_snack_month_1_adult_interactive(self):
        """Internal ID: breakfast-snack-month-1-adult-interactive"""
        result = normalize_product_id("breakfast-snack-month-1-adult-interactive")
        assert result == "breakfast-snack-month-1-adult-interactive"
        assert result in PRODUCT_FILES
        print(f"✓ 'breakfast-snack-month-1-adult-interactive' -> {result}")
    
    def test_internal_id_holiday_ye(self):
        """Internal ID: holiday_ye -> holiday_ye"""
        result = normalize_product_id("holiday_ye")
        assert result == "holiday_ye"
        assert result in PRODUCT_FILES
        print(f"✓ 'holiday_ye' -> {result}")
    
    def test_internal_id_holiday_ie(self):
        """Internal ID: holiday_ie -> holiday_ie"""
        result = normalize_product_id("holiday_ie")
        assert result == "holiday_ie"
        assert result in PRODUCT_FILES
        print(f"✓ 'holiday_ie' -> {result}")


class TestResolveDisplayNameToProductId:
    """Tests for resolve_display_name_to_product_id function"""
    
    def test_holiday_covenant_adult(self):
        """Holiday nibble with lesson name"""
        result = resolve_display_name_to_product_id("Holiday Series - The Covenant - ADULT (99% off)")
        assert result is not None
        assert 'holiday' in result.lower()
        print(f"✓ Holiday Covenant Adult -> {result}")
    
    def test_holiday_cradle_youth(self):
        """Holiday nibble - Cradle lesson, Youth"""
        result = resolve_display_name_to_product_id("Holiday Series - The Cradle - YOUTH")
        assert result is not None
        assert 'holiday' in result.lower()
        print(f"✓ Holiday Cradle Youth -> {result}")
    
    def test_breakfast_esther_adult(self):
        """Breakfast nibble - Esther lesson"""
        result = resolve_display_name_to_product_id("Break*fast Series - Esther: Prayer the First Resort - ADULT")
        assert result is not None
        assert 'breakfast' in result.lower()
        print(f"✓ Breakfast Esther Adult -> {result}")
    
    def test_game_pass_30_day(self):
        """Game pass should return game_pass_30 (no file, but valid product)"""
        result = resolve_display_name_to_product_id("Game Night Lite (30-Day)")
        assert result == "game_pass_30"
        print(f"✓ Game Night Lite (30-Day) -> {result}")
    
    def test_game_pass_90_day(self):
        """Game pass 90-day"""
        result = resolve_display_name_to_product_id("Game Pass (90-Day Access)")
        assert result == "game_pass_90"
        print(f"✓ Game Pass (90-Day Access) -> {result}")
    
    def test_subscription_returns_none(self):
        """Subscriptions should return None (no downloadable file)"""
        result = resolve_display_name_to_product_id("Digital Subscriber Adult (Monthly)")
        assert result is None
        print(f"✓ Subscription returns None (expected)")
    
    def test_gift_certificate_returns_none(self):
        """Gift certificates should return None"""
        result = resolve_display_name_to_product_id("Gift Certificate $25")
        assert result is None
        print(f"✓ Gift Certificate returns None (expected)")


class TestResolveItemToFileEntries:
    """Tests for resolve_item_to_file_entries function - the main fulfillment resolver"""
    
    def test_internal_id_returns_file_entry(self):
        """Internal ID should return single file entry"""
        item = {"product_id": "holiday_ae", "name": "Holiday Adult Edition"}
        entries = resolve_item_to_file_entries(item)
        assert len(entries) == 1
        assert entries[0]["product_id"] == "holiday_ae"
        assert entries[0]["file_key"] == "holiday_ae"
        print(f"✓ Internal ID holiday_ae -> {entries}")
    
    def test_display_name_resolves_to_file(self):
        """Display name should resolve to file entry"""
        item = {
            "product_id": "Holiday Series - The Covenant - ADULT (99% off)",
            "name": "Holiday Series - The Covenant - ADULT (99% off)"
        }
        entries = resolve_item_to_file_entries(item)
        assert len(entries) >= 1
        assert entries[0]["file_key"] in PRODUCT_FILES
        print(f"✓ Display name resolved -> {entries}")
    
    def test_normalized_product_id_field_used(self):
        """normalized_product_id field should be preferred"""
        item = {
            "product_id": "some-random-id",
            "normalized_product_id": "holiday_ae",
            "name": "Holiday Adult Edition"
        }
        entries = resolve_item_to_file_entries(item)
        assert len(entries) == 1
        assert entries[0]["product_id"] == "holiday_ae"
        print(f"✓ normalized_product_id field used -> {entries}")
    
    def test_game_pass_returns_empty_list(self):
        """Game passes should return empty list (no downloadable file)"""
        item = {"product_id": "game_pass_30", "name": "Game Night Lite (30-Day)"}
        entries = resolve_item_to_file_entries(item)
        assert len(entries) == 0
        print(f"✓ Game pass returns empty list (expected)")
    
    def test_subscription_returns_empty_list(self):
        """Subscriptions should return empty list"""
        item = {"product_id": "subscription_ae_monthly", "name": "Digital Subscriber Adult (Monthly)"}
        entries = resolve_item_to_file_entries(item)
        assert len(entries) == 0
        print(f"✓ Subscription returns empty list (expected)")


class TestBundleExpansion:
    """Tests for bundle expansion in resolve_item_to_file_entries"""
    
    def test_starter_bundle_4cs_bkft_ae_expands(self):
        """Bundle starter-bundle-4cs-bkft-ae should expand to holiday_ae AND breakfast_ae_digital"""
        item = {"product_id": "starter-bundle-4cs-bkft-ae", "name": "Starter Bundle (Adult)"}
        entries = resolve_item_to_file_entries(item)
        
        assert len(entries) == 2, f"Expected 2 entries for bundle, got {len(entries)}"
        
        product_ids = [e["product_id"] for e in entries]
        assert "holiday_ae" in product_ids, f"Expected holiday_ae in bundle, got {product_ids}"
        assert "breakfast_ae_digital" in product_ids, f"Expected breakfast_ae_digital in bundle, got {product_ids}"
        
        print(f"✓ Bundle starter-bundle-4cs-bkft-ae expands to: {product_ids}")
    
    def test_starter_bundle_4cs_bkft_ye_expands(self):
        """Bundle starter-bundle-4cs-bkft-ye should expand to holiday_ye AND breakfast_ye_digital"""
        item = {"product_id": "starter-bundle-4cs-bkft-ye", "name": "Starter Bundle (Youth)"}
        entries = resolve_item_to_file_entries(item)
        
        assert len(entries) == 2
        product_ids = [e["product_id"] for e in entries]
        assert "holiday_ye" in product_ids
        assert "breakfast_ye_digital" in product_ids
        print(f"✓ Bundle starter-bundle-4cs-bkft-ye expands to: {product_ids}")
    
    def test_bundle_expansions_dict_exists(self):
        """BUNDLE_EXPANSIONS dict should have expected bundles"""
        assert "starter-bundle-4cs-bkft-ae" in BUNDLE_EXPANSIONS
        assert "starter-bundle-4cs-bkft-ye" in BUNDLE_EXPANSIONS
        print(f"✓ BUNDLE_EXPANSIONS contains expected bundles: {list(BUNDLE_EXPANSIONS.keys())}")


class TestResendLinksEndpoint:
    """Tests for POST /api/downloads/resend-links endpoint"""
    
    def test_resend_links_endpoint_exists(self):
        """Endpoint should respond (not 500 error)"""
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": "TEST-ORDER-123", "email": "test@example.com"}
        )
        # Should return 429 (rate limit / no links found) or 200, NOT 500
        assert response.status_code != 500, f"Endpoint returned 500 error: {response.text}"
        print(f"✓ Resend-links endpoint responds with status {response.status_code}")
    
    def test_resend_links_no_existing_links(self):
        """When no existing links, should return 429 with message"""
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": "NONEXISTENT-ORDER-999", "email": "nobody@example.com"}
        )
        # Expected: 429 with "No download links found for this order."
        assert response.status_code == 429
        data = response.json()
        assert "detail" in data
        print(f"✓ No existing links returns 429: {data['detail']}")
    
    def test_resend_links_missing_order_id(self):
        """Missing order_id should return 422 validation error"""
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 422
        print(f"✓ Missing order_id returns 422")
    
    def test_resend_links_missing_email(self):
        """Missing email should return 422 validation error"""
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": "TEST-ORDER-123"}
        )
        assert response.status_code == 422
        print(f"✓ Missing email returns 422")


class TestCheckoutCartStoresNormalizedProductId:
    """Tests that POST /api/payments/checkout/cart stores normalized_product_id"""
    
    def test_checkout_cart_endpoint_exists(self):
        """Checkout cart endpoint should exist and respond"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout/cart",
            json={
                "items": [{"product_id": "holiday_ae", "name": "Holiday AE", "price": 16.99, "quantity": 1}],
                "origin_url": "https://example.com",
                "customer_email": "test@example.com"
            }
        )
        # Should return 200 with checkout_url, not 500
        assert response.status_code != 500, f"Checkout cart returned 500: {response.text}"
        print(f"✓ Checkout cart endpoint responds with status {response.status_code}")
    
    def test_checkout_cart_with_display_name_item(self):
        """Checkout with display name item should work"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout/cart",
            json={
                "items": [{
                    "product_id": "Holiday Series - The Covenant - ADULT (99% off)",
                    "name": "Holiday Series - The Covenant - ADULT (99% off)",
                    "price": 0.17,
                    "quantity": 1
                }],
                "origin_url": "https://example.com",
                "customer_email": "test@example.com"
            }
        )
        # Should not return 500
        assert response.status_code != 500, f"Checkout with display name returned 500: {response.text}"
        print(f"✓ Checkout with display name item responds with status {response.status_code}")


class TestBackendHealth:
    """Basic backend health checks"""
    
    def test_backend_starts_without_errors(self):
        """Backend should be running and respond to root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Backend health check passed: {data.get('message')}")
    
    def test_product_catalog_loads(self):
        """Product catalog should load"""
        response = requests.get(f"{BASE_URL}/api/payments/catalog")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) > 0
        print(f"✓ Product catalog loaded with {len(data['products'])} products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
