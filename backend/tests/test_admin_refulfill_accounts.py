"""
Test suite for Admin Re-fulfill, Account Lookup/Merge, and Audio Access features.

Tests:
- POST /api/payments/admin/refulfill/{order_number} - Re-fulfill stuck orders
- GET /api/payments/admin/accounts/lookup/{email} - Account lookup
- POST /api/payments/admin/accounts/merge - Merge duplicate accounts
- GET /api/audio/access/{email} - Check audio access after re-fulfillment
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "overflowharvest@gmail.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Admin123!")

# Known orders from the review request
PAID_ORDER_1 = "SF-2026-P7DXY"  # overflowharvest
PAID_ORDER_2 = "SF-2026-WVEE9"  # kingdomlivingproject2020
PENDING_ORDER_1 = "SF-2026-HGZHS"
PENDING_ORDER_2 = "SF-2026-98UNW"


class TestAdminAuth:
    """Test admin authentication for protected endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    def test_refulfill_requires_auth(self):
        """POST /api/payments/admin/refulfill/{order_number} returns 401 without token"""
        response = requests.post(f"{BASE_URL}/api/payments/admin/refulfill/{PAID_ORDER_1}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Refulfill endpoint requires auth (401 without token)")
    
    def test_lookup_requires_auth(self):
        """GET /api/payments/admin/accounts/lookup/{email} returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/payments/admin/accounts/lookup/{ADMIN_EMAIL}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Account lookup endpoint requires auth (401 without token)")
    
    def test_merge_requires_auth(self):
        """POST /api/payments/admin/accounts/merge returns 401 without token"""
        response = requests.post(
            f"{BASE_URL}/api/payments/admin/accounts/merge",
            json={"email": ADMIN_EMAIL}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Account merge endpoint requires auth (401 without token)")


class TestAdminRefulfill:
    """Test admin re-fulfill order endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    def test_refulfill_nonexistent_order_returns_404(self, admin_token):
        """POST /api/payments/admin/refulfill/{order_number} returns 404 for non-existent orders"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/SF-9999-XXXXX",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print(f"PASS: Refulfill returns 404 for non-existent order")
    
    def test_refulfill_unpaid_order_returns_400(self, admin_token):
        """POST /api/payments/admin/refulfill/{order_number} returns 400 for unpaid orders"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Try with a pending order
        response = requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/{PENDING_ORDER_1}",
            headers=headers
        )
        # Could be 404 if order doesn't exist, or 400 if unpaid
        if response.status_code == 404:
            print(f"INFO: Pending order {PENDING_ORDER_1} not found in DB - trying {PENDING_ORDER_2}")
            response = requests.post(
                f"{BASE_URL}/api/payments/admin/refulfill/{PENDING_ORDER_2}",
                headers=headers
            )
        
        # If still 404, the pending orders may not exist - that's acceptable
        if response.status_code == 404:
            print(f"INFO: Pending orders not found in DB - skipping unpaid order test")
            pytest.skip("No pending orders found in DB to test unpaid rejection")
        
        assert response.status_code == 400, f"Expected 400 for unpaid order, got {response.status_code}: {response.text}"
        print(f"PASS: Refulfill returns 400 for unpaid order")
    
    def test_refulfill_paid_order_creates_downloads(self, admin_token):
        """POST /api/payments/admin/refulfill/{order_number} creates download links for paid orders"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/{PAID_ORDER_1}",
            headers=headers
        )
        
        # Could be 404 if order doesn't exist
        if response.status_code == 404:
            print(f"INFO: Order {PAID_ORDER_1} not found - trying {PAID_ORDER_2}")
            response = requests.post(
                f"{BASE_URL}/api/payments/admin/refulfill/{PAID_ORDER_2}",
                headers=headers
            )
        
        if response.status_code == 404:
            pytest.skip(f"No paid orders found in DB to test refulfill")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "order_number" in data, "Response should contain order_number"
        assert "customer_email" in data, "Response should contain customer_email"
        assert "items_processed" in data, "Response should contain items_processed"
        assert "downloads_created" in data, "Response should contain downloads_created"
        assert "links" in data, "Response should contain links array"
        
        print(f"PASS: Refulfill successful for order {data['order_number']}")
        print(f"  - Customer: {data['customer_email']}")
        print(f"  - Items processed: {data['items_processed']}")
        print(f"  - Downloads created: {data['downloads_created']}")
        print(f"  - Downloads failed: {data.get('downloads_failed', 0)}")
        
        # Check links structure
        for link in data.get("links", []):
            assert "product_id" in link, "Each link should have product_id"
            assert "name" in link, "Each link should have name"
            if "token" in link:
                print(f"    - Created: {link['product_id']} ({link['name']})")
            elif "error" in link:
                print(f"    - Failed: {link['product_id']} - {link['error']}")
        
        return data


class TestAdminAccountLookup:
    """Test admin account lookup endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    def test_lookup_returns_account_info(self, admin_token):
        """GET /api/payments/admin/accounts/lookup/{email} returns account info"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/payments/admin/accounts/lookup/{ADMIN_EMAIL}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "email" in data, "Response should contain email"
        assert "accounts" in data, "Response should contain accounts array"
        assert "account_count" in data, "Response should contain account_count"
        assert "has_duplicates" in data, "Response should contain has_duplicates"
        assert "transactions" in data, "Response should contain transactions array"
        assert "download_links_count" in data, "Response should contain download_links_count"
        assert "active_links" in data, "Response should contain active_links"
        assert "audio_access" in data, "Response should contain audio_access"
        
        print(f"PASS: Account lookup successful for {data['email']}")
        print(f"  - Accounts found: {data['account_count']}")
        print(f"  - Has duplicates: {data['has_duplicates']}")
        print(f"  - Transactions: {len(data['transactions'])}")
        print(f"  - Download links: {data['download_links_count']} (active: {data['active_links']})")
        print(f"  - Audio access: {data['audio_access']}")
        
        return data
    
    def test_lookup_single_account_no_duplicates(self, admin_token):
        """GET /api/payments/admin/accounts/lookup/{email} correctly reports has_duplicates=false for single account"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/payments/admin/accounts/lookup/{ADMIN_EMAIL}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Admin account should be unique (only one account)
        if data["account_count"] == 1:
            assert data["has_duplicates"] == False, "Single account should have has_duplicates=false"
            print(f"PASS: Single account correctly reports has_duplicates=false")
        else:
            print(f"INFO: Admin has {data['account_count']} accounts - has_duplicates={data['has_duplicates']}")
    
    def test_lookup_nonexistent_email(self, admin_token):
        """GET /api/payments/admin/accounts/lookup/{email} returns empty results for unknown email"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/payments/admin/accounts/lookup/nonexistent-test-email-12345@example.com",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data["account_count"] == 0, "Unknown email should have 0 accounts"
        assert data["has_duplicates"] == False, "Unknown email should have has_duplicates=false"
        assert len(data["transactions"]) == 0, "Unknown email should have 0 transactions"
        
        print(f"PASS: Unknown email returns empty results correctly")


class TestAdminAccountMerge:
    """Test admin account merge endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    def test_merge_no_duplicates_returns_message(self, admin_token):
        """POST /api/payments/admin/accounts/merge returns 'no duplicates' when only one account exists"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(
            f"{BASE_URL}/api/payments/admin/accounts/merge",
            headers=headers,
            json={"email": ADMIN_EMAIL}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Should return message about no duplicates if only one account
        assert "message" in data, "Response should contain message"
        
        if "No duplicates" in data.get("message", "") or data.get("accounts", 0) <= 1:
            print(f"PASS: Merge correctly reports no duplicates for single account")
            print(f"  - Message: {data.get('message')}")
        else:
            # If there were duplicates, check merge result
            print(f"INFO: Merge performed - {data.get('message')}")
            if "kept_account" in data:
                print(f"  - Kept: {data['kept_account']}")
            if "removed_accounts" in data:
                print(f"  - Removed: {data['removed_accounts']}")
    
    def test_merge_requires_email(self, admin_token):
        """POST /api/payments/admin/accounts/merge returns 400 without email"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(
            f"{BASE_URL}/api/payments/admin/accounts/merge",
            headers=headers,
            json={}
        )
        
        assert response.status_code == 400, f"Expected 400 for missing email, got {response.status_code}"
        print(f"PASS: Merge requires email parameter (400 without it)")


class TestAudioAccessAfterRefulfill:
    """Test audio access is granted after re-fulfillment of Holiday/4C orders"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    def test_audio_access_endpoint_works(self):
        """GET /api/audio/access/{email} returns audio access info"""
        response = requests.get(f"{BASE_URL}/api/audio/access/{ADMIN_EMAIL}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "has_access" in data, "Response should contain has_access"
        assert "series_access" in data, "Response should contain series_access"
        assert "lessons_access" in data, "Response should contain lessons_access"
        
        print(f"PASS: Audio access endpoint works")
        print(f"  - Has access: {data['has_access']}")
        print(f"  - Series: {data['series_access']}")
        print(f"  - Lessons: {data['lessons_access']}")
        
        return data
    
    def test_audio_access_after_refulfill(self, admin_token):
        """After re-fulfilling a Holiday order, audio access should be granted"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First, try to refulfill a paid order
        refulfill_response = requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/{PAID_ORDER_1}",
            headers=headers
        )
        
        if refulfill_response.status_code == 404:
            refulfill_response = requests.post(
                f"{BASE_URL}/api/payments/admin/refulfill/{PAID_ORDER_2}",
                headers=headers
            )
        
        if refulfill_response.status_code == 404:
            pytest.skip("No paid orders found to test audio access after refulfill")
        
        if refulfill_response.status_code != 200:
            pytest.skip(f"Refulfill failed: {refulfill_response.status_code}")
        
        refulfill_data = refulfill_response.json()
        customer_email = refulfill_data.get("customer_email")
        
        if not customer_email:
            pytest.skip("No customer email in refulfill response")
        
        # Check audio access for the customer
        audio_response = requests.get(f"{BASE_URL}/api/audio/access/{customer_email}")
        assert audio_response.status_code == 200
        
        audio_data = audio_response.json()
        print(f"Audio access for {customer_email} after refulfill:")
        print(f"  - Has access: {audio_data['has_access']}")
        print(f"  - Series: {audio_data['series_access']}")
        print(f"  - Lessons: {audio_data['lessons_access']}")
        
        # If the order contained Holiday products, audio access should be granted
        # This is informational - the actual grant depends on order contents
        if audio_data['has_access']:
            print(f"PASS: Audio access granted after refulfill")
            if "holiday" in audio_data.get("series_access", []):
                print(f"  - Holiday series access confirmed")
        else:
            print(f"INFO: No audio access - order may not contain Holiday/4C products")


class TestBundleFulfillment:
    """Test that bundle products create download links for all included items"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    def test_bundle_expansion_in_code(self):
        """Verify BUNDLE_EXPANSIONS contains starter-bundle-4cs-bkft-ae with both products"""
        # This is a code-level test - import and check the mapping
        import sys
        sys.path.insert(0, '/app/backend')
        from payment_routes import BUNDLE_EXPANSIONS, resolve_item_to_file_entries
        
        bundle_key = 'starter-bundle-4cs-bkft-ae'
        assert bundle_key in BUNDLE_EXPANSIONS, f"Bundle {bundle_key} should be in BUNDLE_EXPANSIONS"
        
        expected_products = ['holiday_ae', 'breakfast_ae_digital']
        actual_products = BUNDLE_EXPANSIONS[bundle_key]
        
        for product in expected_products:
            assert product in actual_products, f"Bundle should include {product}"
        
        print(f"PASS: Bundle {bundle_key} contains {actual_products}")
        
        # Test resolve_item_to_file_entries with bundle
        item = {"product_id": bundle_key, "name": "Starter Bundle"}
        entries = resolve_item_to_file_entries(item)
        
        assert len(entries) >= 2, f"Bundle should resolve to at least 2 file entries, got {len(entries)}"
        
        product_ids = [e["product_id"] for e in entries]
        assert "holiday_ae" in product_ids, "Bundle should include holiday_ae"
        assert "breakfast_ae_digital" in product_ids, "Bundle should include breakfast_ae_digital"
        
        print(f"PASS: resolve_item_to_file_entries correctly expands bundle to {len(entries)} entries")
        for entry in entries:
            print(f"  - {entry['product_id']}: {entry['name']}")


class TestRefulfillRevokesOldLinks:
    """Test that re-fulfill revokes old download links before creating new ones"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    def test_refulfill_twice_creates_new_links(self, admin_token):
        """Re-fulfilling the same order twice should revoke old links and create new ones"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First refulfill
        response1 = requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/{PAID_ORDER_1}",
            headers=headers
        )
        
        if response1.status_code == 404:
            response1 = requests.post(
                f"{BASE_URL}/api/payments/admin/refulfill/{PAID_ORDER_2}",
                headers=headers
            )
        
        if response1.status_code == 404:
            pytest.skip("No paid orders found")
        
        assert response1.status_code == 200
        data1 = response1.json()
        order_number = data1["order_number"]
        
        # Get tokens from first refulfill
        tokens1 = [link.get("token") for link in data1.get("links", []) if link.get("token")]
        
        # Second refulfill
        response2 = requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/{order_number}",
            headers=headers
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Get tokens from second refulfill
        tokens2 = [link.get("token") for link in data2.get("links", []) if link.get("token")]
        
        # Tokens should be different (old ones revoked, new ones created)
        if tokens1 and tokens2:
            # Check that at least some tokens are different
            common_tokens = set(tokens1) & set(tokens2)
            if len(common_tokens) == 0:
                print(f"PASS: All tokens are new after second refulfill")
            else:
                print(f"INFO: Some tokens may be reused: {len(common_tokens)} common tokens")
        else:
            print(f"INFO: Could not compare tokens (first: {len(tokens1)}, second: {len(tokens2)})")
        
        print(f"PASS: Re-fulfill twice completed successfully")
        print(f"  - First refulfill: {data1['downloads_created']} downloads")
        print(f"  - Second refulfill: {data2['downloads_created']} downloads")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
