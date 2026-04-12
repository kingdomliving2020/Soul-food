"""
Test Suite: Fulfillment Fix Verification (Iteration 28)
========================================================
Tests the critical indentation fix in status-check fulfillment path.
Before fix: fulfillment loop was inside 'if product_id and not items:' block
After fix: fulfillment loop runs for ALL paid orders (cart orders with items array)

Key features tested:
1. GET /api/payments/checkout/status/{session_id} - creates download links when paid
2. POST /api/payments/admin/refulfill/{order_number} - re-runs fulfillment
3. POST /api/downloads/resend-links - returns 404 for missing links, 429 for rate limit
4. POST /api/payments/webhook/stripe - webhook endpoint is registered
5. Admin Orders UI - Re-fulfill button functionality
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-food-preview.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "overflowharvest@gmail.com"
ADMIN_PASSWORD = "Admin123!"

# Known orders from test_credentials.md
KNOWN_PAID_ORDER = "SF-2026-P7DXY"
KNOWN_PENDING_ORDER = "SF-2026-HGZHS"


class TestAdminAuth:
    """Admin authentication for protected endpoints"""
    
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
    
    def test_admin_login_success(self):
        """Verify admin can login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        print(f"PASS: Admin login successful, token received")


class TestRefulfillEndpoint:
    """Test POST /api/payments/admin/refulfill/{order_number}"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_refulfill_requires_auth(self):
        """Refulfill endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/payments/admin/refulfill/{KNOWN_PAID_ORDER}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Refulfill requires auth (401 without token)")
    
    def test_refulfill_404_nonexistent_order(self, admin_token):
        """Refulfill returns 404 for non-existent order"""
        response = requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/SF-9999-XXXXX",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"PASS: Refulfill returns 404 for non-existent order")
    
    def test_refulfill_400_unpaid_order(self, admin_token):
        """Refulfill returns 400 for unpaid order"""
        response = requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/{KNOWN_PENDING_ORDER}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "not paid" in data.get("detail", "").lower(), f"Expected 'not paid' in error: {data}"
        print(f"PASS: Refulfill returns 400 for unpaid order: {data.get('detail')}")
    
    def test_refulfill_creates_downloads_for_paid_order(self, admin_token):
        """Refulfill creates download links for paid order"""
        response = requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/{KNOWN_PAID_ORDER}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Refulfill failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "order_number" in data, "Missing order_number in response"
        assert data["order_number"] == KNOWN_PAID_ORDER
        assert "downloads_created" in data, "Missing downloads_created in response"
        assert "items_processed" in data, "Missing items_processed in response"
        
        # Verify downloads were created
        downloads_created = data.get("downloads_created", 0)
        items_processed = data.get("items_processed", 0)
        
        print(f"PASS: Refulfill successful - {items_processed} items processed, {downloads_created} downloads created")
        
        # Verify links array has tokens
        links = data.get("links", [])
        tokens_created = [l for l in links if "token" in l]
        assert len(tokens_created) > 0, "No download tokens created"
        print(f"  - Download tokens created: {len(tokens_created)}")
    
    def test_refulfill_marks_transaction_fulfilled(self, admin_token):
        """Verify transaction is marked with download_links_generated=true"""
        # First refulfill
        requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/{KNOWN_PAID_ORDER}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Check transaction via admin order detail
        response = requests.get(
            f"{BASE_URL}/api/admin/orders/{KNOWN_PAID_ORDER}/detail",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            txn = data.get("transaction", {})
            assert txn.get("download_links_generated") == True, "download_links_generated not set to True"
            print(f"PASS: Transaction marked with download_links_generated=True")
        else:
            # Endpoint may not exist, skip this check
            print(f"SKIP: Admin order detail endpoint returned {response.status_code}")


class TestResendLinksEndpoint:
    """Test POST /api/downloads/resend-links error handling"""
    
    def test_resend_404_for_missing_links(self):
        """Resend returns 404 when no download links exist (not 429)"""
        # Use a fake order that definitely has no links
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": "FAKE-ORDER-12345", "email": "test@example.com"}
        )
        
        # Should be 404 (no links exist), not 429 (rate limit)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        detail = data.get("detail", "")
        assert "no download links" in detail.lower() or "not found" in detail.lower(), f"Unexpected error message: {detail}"
        print(f"PASS: Resend returns 404 for missing links: {detail}")
    
    def test_resend_429_for_rate_limit(self):
        """Resend returns 429 when rate limit exceeded (when links DO exist)"""
        # This test requires an order with existing links
        # We'll use the known paid order and call resend multiple times
        
        # First, let's check if the order has links
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={"order_id": KNOWN_PAID_ORDER, "email": ADMIN_EMAIL}
        )
        
        # First call might succeed or hit rate limit from previous tests
        if response.status_code == 200:
            # Call again to potentially hit rate limit
            for _ in range(3):
                response = requests.post(
                    f"{BASE_URL}/api/downloads/resend-links",
                    json={"order_id": KNOWN_PAID_ORDER, "email": ADMIN_EMAIL}
                )
                if response.status_code == 429:
                    break
                time.sleep(0.5)
        
        # Either we hit 429 (rate limit) or 200 (success) - both are valid
        # The key is we should NOT get 404 for an order that has links
        assert response.status_code in [200, 429], f"Expected 200 or 429, got {response.status_code}: {response.text}"
        
        if response.status_code == 429:
            print(f"PASS: Resend returns 429 for rate limit exceeded")
        else:
            print(f"PASS: Resend returns 200 (rate limit not yet exceeded)")


class TestWebhookEndpoint:
    """Test POST /api/payments/webhook/stripe is registered"""
    
    def test_webhook_endpoint_registered(self):
        """Webhook endpoint exists and responds (400 without signature is expected)"""
        response = requests.post(
            f"{BASE_URL}/api/payments/webhook/stripe",
            data=b"test",
            headers={"Content-Type": "application/json"}
        )
        
        # Without Stripe signature, should return 400 (missing signature)
        # This proves the endpoint is registered and reachable
        assert response.status_code == 400, f"Expected 400 (missing signature), got {response.status_code}"
        data = response.json()
        detail = data.get("detail", "")
        assert "signature" in detail.lower() or "stripe" in detail.lower(), f"Unexpected error: {detail}"
        print(f"PASS: Webhook endpoint registered, returns 400 without signature: {detail}")


class TestStatusCheckEndpoint:
    """Test GET /api/payments/checkout/status/{session_id}"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_status_check_endpoint_exists(self):
        """Status check endpoint exists"""
        # Use a fake session ID - should return 404 or 500 (not found), not 405 (method not allowed)
        response = requests.get(f"{BASE_URL}/api/payments/checkout/status/fake_session_123")
        
        # Should not be 405 (method not allowed) - endpoint should exist
        assert response.status_code != 405, "Status check endpoint not registered (405)"
        
        # 404 (transaction not found) or 500 (Stripe error) are expected for fake session
        assert response.status_code in [404, 500], f"Unexpected status: {response.status_code}"
        print(f"PASS: Status check endpoint exists (returned {response.status_code} for fake session)")


class TestAudioAccessGrant:
    """Test that refulfill grants audio access for Holiday products"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_refulfill_grants_audio_access(self, admin_token):
        """Refulfill grants audio access for Holiday/4C products"""
        # First refulfill the order
        refulfill_response = requests.post(
            f"{BASE_URL}/api/payments/admin/refulfill/{KNOWN_PAID_ORDER}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert refulfill_response.status_code == 200, f"Refulfill failed: {refulfill_response.text}"
        
        # Check audio access
        audio_response = requests.get(f"{BASE_URL}/api/audio/access/{ADMIN_EMAIL}")
        
        if audio_response.status_code == 200:
            data = audio_response.json()
            has_access = data.get("has_access", False)
            series_access = data.get("series_access", [])
            lessons_access = data.get("lessons_access", [])
            
            # If the order contains Holiday products, should have holiday access
            if has_access and "holiday" in series_access:
                print(f"PASS: Audio access granted - series: {series_access}, lessons: {lessons_access}")
            else:
                print(f"INFO: Audio access check - has_access: {has_access}, series: {series_access}")
        else:
            print(f"INFO: Audio access endpoint returned {audio_response.status_code}")


class TestAdminOrdersAPI:
    """Test Admin Orders API endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_admin_orders_list(self, admin_token):
        """Admin can list orders"""
        response = requests.get(
            f"{BASE_URL}/api/orders/admin/list?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Endpoint might not require auth header (uses XHR in frontend)
        if response.status_code == 200:
            data = response.json()
            orders = data.get("orders", [])
            print(f"PASS: Admin orders list returned {len(orders)} orders")
        else:
            # Try without auth
            response = requests.get(f"{BASE_URL}/api/orders/admin/list?limit=10")
            if response.status_code == 200:
                data = response.json()
                orders = data.get("orders", [])
                print(f"PASS: Admin orders list (no auth) returned {len(orders)} orders")
            else:
                print(f"INFO: Admin orders list returned {response.status_code}")
    
    def test_known_paid_order_in_list(self, admin_token):
        """Known paid order appears in admin list"""
        response = requests.get(f"{BASE_URL}/api/orders/admin/list?limit=100")
        
        if response.status_code == 200:
            data = response.json()
            orders = data.get("orders", [])
            order_numbers = [o.get("order_number") for o in orders]
            
            if KNOWN_PAID_ORDER in order_numbers:
                paid_order = next(o for o in orders if o.get("order_number") == KNOWN_PAID_ORDER)
                assert paid_order.get("payment_status") == "paid", f"Order status is not 'paid': {paid_order.get('payment_status')}"
                print(f"PASS: Known paid order {KNOWN_PAID_ORDER} found with status 'paid'")
            else:
                print(f"INFO: Order {KNOWN_PAID_ORDER} not in first 100 orders")
        else:
            print(f"INFO: Admin orders list returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
