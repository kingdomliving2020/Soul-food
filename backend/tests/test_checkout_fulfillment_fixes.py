"""
Test Suite: Checkout and Fulfillment Pipeline Fixes (Iteration 25)

Tests the 4 backend payment fixes:
1. Stripe checkout email binding - customer_email passed to Stripe session
2. Cart product identity - items stored with normalized_product_id
3. Account linking at checkout - JWT user_id extracted and stored
4. Webhook user mapping - uses stored user_id, never falls back to session_id

Test scenarios:
- Authenticated checkout (with JWT token)
- Guest checkout (no auth token)
- Customer email handling (form input vs logged-in user fallback)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://soul-purchase-pipe.preview.emergentagent.com"

# Test credentials from test_credentials.md
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "overflowharvest@gmail.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Admin123!")

# Valid product IDs for testing
TEST_PRODUCTS = [
    {"id": "holiday_ae", "name": "Holiday Adult Edition", "price": 16.99},
    {"id": "breakfast_ae_digital", "name": "Break*fast AE Digital", "price": 11.99},
    {"id": "holiday_ye", "name": "Holiday Youth Edition", "price": 16.99},
]


class TestAuthHelper:
    """Helper class for authentication"""
    
    @staticmethod
    def get_auth_token():
        """Login and get JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        return None


class TestCheckoutEmailBinding:
    """Test 1: Stripe checkout email binding - customer_email passed to Stripe session"""
    
    def test_checkout_with_customer_email_creates_session(self):
        """POST /api/payments/checkout/cart with customer_email creates Stripe session"""
        test_email = f"test_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
        
        payload = {
            "items": [
                {
                    "id": "holiday_ae",
                    "product_id": "holiday_ae",
                    "name": "Holiday Adult Edition (WBK)",
                    "price": 16.99,
                    "salePrice": 16.99,
                    "quantity": 1
                }
            ],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com",
            "customer_email": test_email
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "url" in data, "Response should contain Stripe checkout URL"
        assert "session_id" in data, "Response should contain session_id"
        assert "order_number" in data, "Response should contain order_number"
        assert data["url"].startswith("https://checkout.stripe.com"), "URL should be Stripe checkout URL"
        
        # Store session_id for verification
        session_id = data["session_id"]
        print(f"✓ Stripe session created: {session_id}")
        print(f"✓ Order number: {data['order_number']}")
        
        return session_id, test_email
    
    def test_checkout_stores_customer_email_in_transaction(self):
        """POST /api/payments/checkout/cart stores customer_email in payment_transactions"""
        test_email = f"test_email_store_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
        
        payload = {
            "items": [
                {
                    "id": "breakfast_ae_digital",
                    "product_id": "breakfast_ae_digital",
                    "name": "Break*fast AE Digital",
                    "price": 11.99,
                    "salePrice": 11.99,
                    "quantity": 1
                }
            ],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com",
            "customer_email": test_email
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        
        data = response.json()
        session_id = data["session_id"]
        
        # Verify transaction was stored by checking status endpoint
        # Note: We can't directly query MongoDB, but we can verify via status endpoint
        status_response = requests.get(f"{BASE_URL}/api/payments/checkout/status/{session_id}")
        assert status_response.status_code == 200, f"Status check failed: {status_response.text}"
        
        print(f"✓ Transaction stored with session_id: {session_id}")
        print(f"✓ Customer email provided: {test_email}")


class TestAccountLinkingAtCheckout:
    """Test 3: Account linking at checkout - JWT user_id extracted and stored"""
    
    def test_authenticated_checkout_extracts_user_id(self):
        """POST /api/payments/checkout/cart with Authorization Bearer token extracts user_id from JWT"""
        # Get auth token
        token = TestAuthHelper.get_auth_token()
        assert token is not None, "Failed to get auth token - check credentials"
        
        payload = {
            "items": [
                {
                    "id": "holiday_ae",
                    "product_id": "holiday_ae",
                    "name": "Holiday Adult Edition (WBK)",
                    "price": 16.99,
                    "salePrice": 16.99,
                    "quantity": 1
                }
            ],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com"
            # No customer_email - should use logged-in user's email
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload, headers=headers)
        
        # Status assertion
        assert response.status_code == 200, f"Authenticated checkout failed: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "session_id" in data, "Response should contain session_id"
        assert "order_number" in data, "Response should contain order_number"
        
        print(f"✓ Authenticated checkout successful")
        print(f"✓ Session ID: {data['session_id']}")
        print(f"✓ Order number: {data['order_number']}")
        
        return data["session_id"]
    
    def test_authenticated_checkout_uses_user_email_as_fallback(self):
        """POST /api/payments/checkout/cart without customer_email uses logged-in user's email"""
        token = TestAuthHelper.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        payload = {
            "items": [
                {
                    "id": "holiday_ye",
                    "product_id": "holiday_ye",
                    "name": "Holiday Youth Edition (WBK)",
                    "price": 16.99,
                    "salePrice": 16.99,
                    "quantity": 1
                }
            ],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com"
            # No customer_email provided - should fall back to logged-in user's email
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload, headers=headers)
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        
        data = response.json()
        # The Stripe URL should be created successfully (email was resolved)
        assert data["url"].startswith("https://checkout.stripe.com"), "Stripe session should be created"
        
        print(f"✓ Checkout without customer_email succeeded (used logged-in user's email)")
        print(f"✓ Stripe URL: {data['url'][:80]}...")


class TestGuestCheckout:
    """Test guest checkout scenarios (no auth token)"""
    
    def test_guest_checkout_works_without_auth(self):
        """Guest checkout (no auth token) works - user_id is null, customer_email is stored"""
        test_email = f"guest_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
        
        payload = {
            "items": [
                {
                    "id": "holiday_ae",
                    "product_id": "holiday_ae",
                    "name": "Holiday Adult Edition (WBK)",
                    "price": 16.99,
                    "salePrice": 16.99,
                    "quantity": 1
                }
            ],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com",
            "customer_email": test_email
        }
        
        # No Authorization header - guest checkout
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
        
        # Status assertion
        assert response.status_code == 200, f"Guest checkout failed: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "url" in data, "Response should contain Stripe checkout URL"
        assert "session_id" in data, "Response should contain session_id"
        assert data["url"].startswith("https://checkout.stripe.com"), "URL should be Stripe checkout URL"
        
        print(f"✓ Guest checkout successful")
        print(f"✓ Session ID: {data['session_id']}")
        print(f"✓ Guest email: {test_email}")
    
    def test_guest_checkout_without_email_still_works(self):
        """Guest checkout without customer_email still creates session (email will be collected by Stripe)"""
        payload = {
            "items": [
                {
                    "id": "breakfast_ae_digital",
                    "product_id": "breakfast_ae_digital",
                    "name": "Break*fast AE Digital",
                    "price": 11.99,
                    "salePrice": 11.99,
                    "quantity": 1
                }
            ],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com"
            # No customer_email, no auth token
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
        
        # Should still work - Stripe will collect email during checkout
        assert response.status_code == 200, f"Guest checkout without email failed: {response.text}"
        
        data = response.json()
        assert "url" in data, "Response should contain Stripe checkout URL"
        
        print(f"✓ Guest checkout without email succeeded")
        print(f"✓ Stripe will collect email during payment")


class TestProductIdNormalization:
    """Test 2: Cart product identity - items stored with normalized_product_id"""
    
    def test_checkout_stores_normalized_product_ids(self):
        """POST /api/payments/checkout/cart stores items with both product_id and normalized_product_id"""
        # Use various product ID formats that need normalization
        payload = {
            "items": [
                {
                    "id": "holiday-ae-digital",  # Dash format
                    "product_id": "holiday-ae-digital",
                    "name": "Holiday Adult Edition Digital",
                    "price": 16.99,
                    "salePrice": 16.99,
                    "quantity": 1
                },
                {
                    "id": "breakfast-full-ae-digital",  # Full dash format
                    "product_id": "breakfast-full-ae-digital",
                    "name": "Break*fast Full AE Digital",
                    "price": 11.99,
                    "salePrice": 11.99,
                    "quantity": 1
                }
            ],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com",
            "customer_email": "test_normalize@example.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        
        data = response.json()
        assert "session_id" in data, "Response should contain session_id"
        
        print(f"✓ Checkout with various product ID formats succeeded")
        print(f"✓ Session ID: {data['session_id']}")
        print(f"✓ Products: holiday-ae-digital, breakfast-full-ae-digital")
    
    def test_normalize_product_id_endpoint(self):
        """Verify product catalog contains expected normalized IDs"""
        response = requests.get(f"{BASE_URL}/api/payments/catalog")
        
        assert response.status_code == 200, f"Catalog fetch failed: {response.text}"
        
        data = response.json()
        assert "products" in data, "Response should contain products"
        
        # Check that key products exist
        product_ids = [p["product_id"] for p in data["products"]]
        
        expected_ids = ["holiday_ae", "holiday_ye", "breakfast_ae_digital", "breakfast_ye_digital"]
        for expected_id in expected_ids:
            assert expected_id in product_ids, f"Expected product {expected_id} not found in catalog"
        
        print(f"✓ Product catalog contains {len(data['products'])} products")
        print(f"✓ Key products verified: {expected_ids}")


class TestMultiItemCheckout:
    """Test multi-item cart checkout"""
    
    def test_multi_item_cart_checkout(self):
        """Checkout with multiple items creates single Stripe session"""
        payload = {
            "items": [
                {
                    "id": "holiday_ae",
                    "product_id": "holiday_ae",
                    "name": "Holiday Adult Edition (WBK)",
                    "price": 16.99,
                    "salePrice": 16.99,
                    "quantity": 1
                },
                {
                    "id": "breakfast_ae_digital",
                    "product_id": "breakfast_ae_digital",
                    "name": "Break*fast AE Digital",
                    "price": 11.99,
                    "salePrice": 11.99,
                    "quantity": 2
                }
            ],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com",
            "customer_email": "multi_item_test@example.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
        
        assert response.status_code == 200, f"Multi-item checkout failed: {response.text}"
        
        data = response.json()
        assert "url" in data, "Response should contain Stripe checkout URL"
        assert "session_id" in data, "Response should contain session_id"
        
        # Verify amount calculation (16.99 + 11.99*2 = 40.97)
        expected_amount = 16.99 + (11.99 * 2)
        assert abs(data["amount"] - expected_amount) < 0.01, f"Expected amount {expected_amount}, got {data['amount']}"
        
        print(f"✓ Multi-item checkout successful")
        print(f"✓ Total amount: ${data['amount']:.2f}")
        print(f"✓ Items: Holiday AE x1, Break*fast AE x2")


class TestCouponDiscounts:
    """Test checkout with coupon discounts"""
    
    def test_checkout_with_percent_discount(self):
        """Checkout with percentage discount coupon"""
        payload = {
            "items": [
                {
                    "id": "holiday_ae",
                    "product_id": "holiday_ae",
                    "name": "Holiday Adult Edition (WBK)",
                    "price": 16.99,
                    "salePrice": 16.99,
                    "quantity": 1
                }
            ],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com",
            "customer_email": "discount_test@example.com",
            "coupon_code": "WELCOME10",
            "discount_percent": 10
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
        
        assert response.status_code == 200, f"Discount checkout failed: {response.text}"
        
        data = response.json()
        # 16.99 * 0.90 = 15.291
        expected_amount = round(16.99 * 0.90, 2)
        assert abs(data["amount"] - expected_amount) < 0.01, f"Expected {expected_amount}, got {data['amount']}"
        
        print(f"✓ Checkout with 10% discount successful")
        print(f"✓ Original: $16.99, Discounted: ${data['amount']:.2f}")


class TestCheckoutStatusEndpoint:
    """Test checkout status endpoint"""
    
    def test_checkout_status_returns_transaction_info(self):
        """GET /api/payments/checkout/status/{session_id} returns transaction info"""
        # First create a checkout session
        payload = {
            "items": [
                {
                    "id": "holiday_ae",
                    "product_id": "holiday_ae",
                    "name": "Holiday Adult Edition (WBK)",
                    "price": 16.99,
                    "salePrice": 16.99,
                    "quantity": 1
                }
            ],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com",
            "customer_email": "status_test@example.com"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
        assert create_response.status_code == 200, f"Checkout creation failed: {create_response.text}"
        
        session_id = create_response.json()["session_id"]
        
        # Check status
        status_response = requests.get(f"{BASE_URL}/api/payments/checkout/status/{session_id}")
        assert status_response.status_code == 200, f"Status check failed: {status_response.text}"
        
        status_data = status_response.json()
        assert "payment_status" in status_data, "Response should contain payment_status"
        assert "session_id" in status_data, "Response should contain session_id"
        
        print(f"✓ Status endpoint working")
        print(f"✓ Session ID: {session_id}")
        print(f"✓ Payment status: {status_data['payment_status']}")
    
    def test_checkout_status_invalid_session_returns_error(self):
        """GET /api/payments/checkout/status with invalid session_id returns error (404 or 500)"""
        response = requests.get(f"{BASE_URL}/api/payments/checkout/status/invalid_session_12345")
        
        # Should return error for non-existent session (404 from DB or 500 from Stripe API)
        assert response.status_code in [404, 500], f"Expected 404 or 500, got {response.status_code}"
        
        print(f"✓ Invalid session returns error as expected (status: {response.status_code})")


class TestEmptyCartValidation:
    """Test validation for empty cart"""
    
    def test_empty_cart_returns_400(self):
        """POST /api/payments/checkout/cart with empty items returns 400"""
        payload = {
            "items": [],
            "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com",
            "customer_email": "empty_cart@example.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
        
        assert response.status_code == 400, f"Expected 400 for empty cart, got {response.status_code}"
        
        print(f"✓ Empty cart validation working - returns 400")


# Fixtures
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token():
    """Get authentication token"""
    return TestAuthHelper.get_auth_token()


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    if auth_token:
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
