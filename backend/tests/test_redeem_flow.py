"""
Redeem Code Flow Tests
======================
Tests for the order verification and claim endpoints.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-checkout-stage.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "overflowharvest@gmail.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Admin123!")

# Test order numbers
VALID_ORDER_ADMIN = "SF-2026-CZ5SB"  # Order for admin email (already claimed)
VALID_ORDER_OTHER = "SF-2026-WVEE9"  # Order for different email
INVALID_ORDER = "INVALID-CODE-123"


class TestVerifyClaim:
    """Tests for GET /api/orders/verify-claim endpoint"""
    
    def test_verify_valid_order(self):
        """Test verifying a valid order returns order info"""
        response = requests.get(f"{BASE_URL}/api/orders/verify-claim?code={VALID_ORDER_ADMIN}")
        assert response.status_code == 200
        
        data = response.json()
        assert "order_number" in data
        assert data["order_number"] == VALID_ORDER_ADMIN
        assert "masked_email" in data
        assert "items" in data
        assert isinstance(data["items"], list)
        assert "already_claimed" in data
        assert "claimable" in data
        print(f"✅ Valid order verified: {data['order_number']}, claimed: {data['already_claimed']}")
    
    def test_verify_invalid_order_returns_404(self):
        """Test verifying an invalid order returns 404"""
        response = requests.get(f"{BASE_URL}/api/orders/verify-claim?code={INVALID_ORDER}")
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
        print(f"✅ Invalid order correctly returns 404: {data['detail']}")
    
    def test_verify_order_shows_masked_email(self):
        """Test that email is properly masked for privacy"""
        response = requests.get(f"{BASE_URL}/api/orders/verify-claim?code={VALID_ORDER_OTHER}")
        assert response.status_code == 200
        
        data = response.json()
        masked_email = data.get("masked_email", "")
        # Email should be masked like "ki***@gmail.com"
        assert "***" in masked_email
        assert "@" in masked_email
        print(f"✅ Email properly masked: {masked_email}")
    
    def test_verify_order_shows_items(self):
        """Test that order items are returned"""
        response = requests.get(f"{BASE_URL}/api/orders/verify-claim?code={VALID_ORDER_OTHER}")
        assert response.status_code == 200
        
        data = response.json()
        items = data.get("items", [])
        assert len(items) > 0
        for item in items:
            assert "name" in item
            assert "quantity" in item
        print(f"✅ Order has {len(items)} items")


class TestClaimOrder:
    """Tests for POST /api/orders/claim endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_claim_without_auth_returns_401(self):
        """Test claiming without authentication returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/orders/claim",
            json={"order_number": VALID_ORDER_ADMIN}
        )
        assert response.status_code == 401
        
        data = response.json()
        assert "detail" in data
        print(f"✅ Claim without auth correctly returns 401: {data['detail']}")
    
    def test_claim_already_claimed_order(self, auth_token):
        """Test claiming an already claimed order returns appropriate message"""
        response = requests.post(
            f"{BASE_URL}/api/orders/claim",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"order_number": VALID_ORDER_ADMIN}
        )
        # Should return 200 with already_claimed message or 409 if claimed by another user
        assert response.status_code in [200, 409]
        
        data = response.json()
        if response.status_code == 200:
            assert data.get("already_claimed") == True or "already claimed" in data.get("message", "").lower()
            print(f"✅ Already claimed order handled: {data.get('message', data)}")
        else:
            assert "already been claimed" in data.get("detail", "").lower()
            print(f"✅ Already claimed by another user: {data['detail']}")
    
    def test_claim_wrong_email_returns_403(self, auth_token):
        """Test claiming an order with wrong email returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/orders/claim",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"order_number": VALID_ORDER_OTHER}
        )
        assert response.status_code == 403
        
        data = response.json()
        assert "detail" in data
        assert "different email" in data["detail"].lower()
        print(f"✅ Wrong email correctly returns 403: {data['detail']}")
    
    def test_claim_invalid_order_returns_404(self, auth_token):
        """Test claiming an invalid order returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/orders/claim",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"order_number": INVALID_ORDER}
        )
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data
        print(f"✅ Invalid order claim correctly returns 404: {data['detail']}")


class TestRedeemPageRoute:
    """Tests for /redeem page accessibility"""
    
    def test_redeem_page_loads(self):
        """Test that the redeem page is accessible"""
        response = requests.get(f"{BASE_URL}/redeem?code=TEST")
        # Should return 200 (React app serves the page)
        assert response.status_code == 200
        print("✅ Redeem page is accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
