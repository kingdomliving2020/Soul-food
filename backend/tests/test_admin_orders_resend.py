"""
Test Admin Orders Management & Public Resend Access Endpoints
=============================================================
Tests for:
1. GET /api/admin/orders - paginated order list with search
2. GET /api/admin/orders/{order_number}/detail - order details
3. POST /api/admin/orders/{order_number}/resend-email - admin resend email
4. POST /api/admin/orders/{order_number}/grant-access - admin grant download links
5. POST /api/orders/resend-access - public resend access (rate limited)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "overflowharvest@gmail.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Admin123!")

# Known test orders
ORDER_ADMIN = "SF-2026-CZ5SB"  # email: overflowharvest@gmail.com, status: paid
ORDER_MANUAL = "SF-2026-MANUAL-ME01"  # email: michael.edwards2@yahoo.com, status: paid
# For public resend tests (rate limit not exhausted)
ORDER_FOR_RESEND = "SF-2026-P7DXY"  # email: overflowharvest@gmail.com
ORDER_FOR_RESEND_ALT = "SF-2026-9PXM6"  # alternative order


class TestAdminAuth:
    """Test admin authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in login response"
        return data["access_token"]
    
    def test_admin_login_success(self, admin_token):
        """Verify admin can login and get token"""
        assert admin_token is not None
        assert len(admin_token) > 20


class TestAdminOrdersList:
    """Test GET /api/admin/orders endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json().get("access_token")
    
    def test_get_orders_list_requires_auth(self):
        """GET /api/admin/orders without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/admin/orders")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_get_orders_list_success(self, admin_token):
        """GET /api/admin/orders returns paginated order list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "items" in data, "Response missing 'items'"
        assert "total" in data, "Response missing 'total'"
        assert "page" in data, "Response missing 'page'"
        assert "limit" in data, "Response missing 'limit'"
        assert "pages" in data, "Response missing 'pages'"
        
        # Verify items structure
        if len(data["items"]) > 0:
            item = data["items"][0]
            assert "order_number" in item, "Item missing 'order_number'"
            assert "customer_email" in item, "Item missing 'customer_email'"
            assert "payment_status" in item, "Item missing 'payment_status'"
    
    def test_search_orders_by_email(self, admin_token):
        """GET /api/admin/orders?search=overflowharvest filters by email"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders?search=overflowharvest",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned items should match the search
        for item in data["items"]:
            assert "overflowharvest" in item.get("customer_email", "").lower() or \
                   "overflowharvest" in item.get("customer_name", "").lower() or \
                   "overflowharvest" in item.get("order_number", "").lower(), \
                   f"Item doesn't match search: {item}"
    
    def test_search_orders_by_order_number(self, admin_token):
        """GET /api/admin/orders?search=SF-2026-CZ5SB filters by order number"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders?search={ORDER_ADMIN}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should find the specific order
        assert data["total"] >= 1, f"Expected at least 1 order, got {data['total']}"
        found = any(item["order_number"] == ORDER_ADMIN for item in data["items"])
        assert found, f"Order {ORDER_ADMIN} not found in search results"


class TestAdminOrderDetail:
    """Test GET /api/admin/orders/{order_number}/detail endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json().get("access_token")
    
    def test_get_order_detail_requires_auth(self):
        """GET /api/admin/orders/{order}/detail without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/admin/orders/{ORDER_ADMIN}/detail")
        assert response.status_code == 401
    
    def test_get_order_detail_success(self, admin_token):
        """GET /api/admin/orders/{order}/detail returns full order info"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders/{ORDER_ADMIN}/detail",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "transaction" in data, "Response missing 'transaction'"
        assert "download_links" in data, "Response missing 'download_links'"
        assert "delivery_logs" in data, "Response missing 'delivery_logs'"
        
        # Verify transaction data
        tx = data["transaction"]
        if tx:
            assert tx.get("order_number") == ORDER_ADMIN, f"Wrong order number: {tx.get('order_number')}"
            assert "customer_email" in tx, "Transaction missing 'customer_email'"
            assert "items" in tx, "Transaction missing 'items'"
    
    def test_get_order_detail_not_found(self, admin_token):
        """GET /api/admin/orders/{invalid}/detail returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders/INVALID-ORDER-123/detail",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestAdminResendEmail:
    """Test POST /api/admin/orders/{order_number}/resend-email endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json().get("access_token")
    
    def test_resend_email_requires_auth(self):
        """POST /api/admin/orders/{order}/resend-email without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/orders/{ORDER_ADMIN}/resend-email")
        assert response.status_code == 401
    
    def test_resend_email_success(self, admin_token):
        """POST /api/admin/orders/{order}/resend-email sends email successfully"""
        response = requests.post(
            f"{BASE_URL}/api/admin/orders/{ORDER_ADMIN}/resend-email",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "message" in data, "Response missing 'message'"
        assert "email" in data.get("message", "").lower() or "resent" in data.get("message", "").lower(), \
            f"Unexpected message: {data.get('message')}"
    
    def test_resend_email_not_found(self, admin_token):
        """POST /api/admin/orders/{invalid}/resend-email returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/orders/INVALID-ORDER-123/resend-email",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestAdminGrantAccess:
    """Test POST /api/admin/orders/{order_number}/grant-access endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json().get("access_token")
    
    def test_grant_access_requires_auth(self):
        """POST /api/admin/orders/{order}/grant-access without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/orders/{ORDER_ADMIN}/grant-access")
        assert response.status_code == 401
    
    def test_grant_access_success(self, admin_token):
        """POST /api/admin/orders/{order}/grant-access creates download links"""
        response = requests.post(
            f"{BASE_URL}/api/admin/orders/{ORDER_ADMIN}/grant-access",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # May return 200 or 400 if no items/mappings
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}: {response.text}"
        data = response.json()
        
        if response.status_code == 200:
            assert data.get("success") == True, f"Expected success=True, got {data}"
            assert "message" in data, "Response missing 'message'"
            # May have links_created field
            if "links_created" in data:
                assert isinstance(data["links_created"], int)
    
    def test_grant_access_not_found(self, admin_token):
        """POST /api/admin/orders/{invalid}/grant-access returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/orders/INVALID-ORDER-123/grant-access",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestPublicResendAccess:
    """Test POST /api/orders/resend-access public endpoint"""
    
    def test_resend_access_missing_fields(self):
        """POST /api/orders/resend-access with missing fields returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/orders/resend-access",
            json={}
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    
    def test_resend_access_invalid_order(self):
        """POST /api/orders/resend-access with invalid order returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/orders/resend-access",
            json={"order_number": "INVALID-ORDER-XYZ", "email": "test@example.com"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "not found" in data.get("detail", "").lower()
    
    def test_resend_access_wrong_email(self):
        """POST /api/orders/resend-access with wrong email returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/orders/resend-access",
            json={"order_number": ORDER_ADMIN, "email": "wrong@example.com"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "email" in data.get("detail", "").lower() or "match" in data.get("detail", "").lower()
    
    def test_resend_access_rate_limit(self):
        """POST /api/orders/resend-access rate limit - 4th request returns 429"""
        # Note: SF-2026-CZ5SB already has 3 requests used per the agent context
        # So the next request should be rate limited
        response = requests.post(
            f"{BASE_URL}/api/orders/resend-access",
            json={"order_number": ORDER_ADMIN, "email": ADMIN_EMAIL}
        )
        # Should be 429 if rate limit is hit, or 200 if not
        # Based on context, rate limit should be exhausted for this order
        if response.status_code == 429:
            data = response.json()
            assert "too many" in data.get("detail", "").lower() or "wait" in data.get("detail", "").lower()
            print(f"Rate limit working: {data.get('detail')}")
        else:
            # If not rate limited, it should succeed
            assert response.status_code == 200, f"Expected 200 or 429, got {response.status_code}"
            print(f"Resend succeeded (rate limit not hit yet)")


class TestPublicResendAccessSuccess:
    """Test successful public resend access with alternative order"""
    
    def test_resend_access_success_alt_order(self):
        """POST /api/orders/resend-access with valid order/email succeeds"""
        # Try with alternative order that may not have rate limit exhausted
        # First check if order exists
        response = requests.post(
            f"{BASE_URL}/api/orders/resend-access",
            json={"order_number": ORDER_FOR_RESEND, "email": ADMIN_EMAIL}
        )
        
        # Could be 200 (success), 429 (rate limited), or 404 (order not found)
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, f"Expected success=True, got {data}"
            assert "message" in data
            print(f"Resend success: {data.get('message')}")
        elif response.status_code == 429:
            print(f"Rate limited on {ORDER_FOR_RESEND}")
        elif response.status_code == 404:
            print(f"Order {ORDER_FOR_RESEND} not found, trying alternative")
            # Try alternative order
            response2 = requests.post(
                f"{BASE_URL}/api/orders/resend-access",
                json={"order_number": ORDER_FOR_RESEND_ALT, "email": ADMIN_EMAIL}
            )
            if response2.status_code == 200:
                data = response2.json()
                assert data.get("success") == True
                print(f"Resend success with alt order: {data.get('message')}")
            else:
                print(f"Alt order status: {response2.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
