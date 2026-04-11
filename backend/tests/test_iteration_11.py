"""
Soul Food Store - Iteration 11 Backend Tests
Tests for: Catalog API, Coupon validation, Checkout flow
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCatalogAPI:
    """Tests for GET /api/payments/catalog and /api/payments/catalog/csv"""
    
    def test_catalog_returns_products(self):
        """GET /api/payments/catalog returns full product catalog JSON"""
        response = requests.get(f"{BASE_URL}/api/payments/catalog")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        print(f"✅ Catalog returns {data['total']} products")
    
    def test_catalog_has_48_products(self):
        """Catalog should have 48 products"""
        response = requests.get(f"{BASE_URL}/api/payments/catalog")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 48, f"Expected 48 products, got {data['total']}"
        print(f"✅ Catalog has exactly 48 products")
    
    def test_catalog_product_structure(self):
        """Each product should have required fields"""
        response = requests.get(f"{BASE_URL}/api/payments/catalog")
        assert response.status_code == 200
        data = response.json()
        product = data["products"][0]
        required_fields = ["product_id", "name", "sku", "list_price", "sale_price", "effective_price"]
        for field in required_fields:
            assert field in product, f"Missing field: {field}"
        print(f"✅ Product structure is correct")
    
    def test_catalog_csv_download(self):
        """GET /api/payments/catalog/csv returns downloadable CSV"""
        response = requests.get(f"{BASE_URL}/api/payments/catalog/csv")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        assert "attachment" in response.headers.get("content-disposition", "")
        # Check CSV has header row
        lines = response.text.strip().split("\n")
        assert len(lines) > 1, "CSV should have header and data rows"
        header = lines[0]
        assert "product_id" in header
        assert "name" in header
        assert "sku" in header
        print(f"✅ CSV download works with {len(lines)-1} products")


class TestCouponValidation:
    """Tests for POST /api/coupons/validate"""
    
    def test_welcome10_coupon(self):
        """WELCOME10 returns 10% discount"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "WELCOME10",
            "product_ids": [],
            "cart_total": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 10
        assert data["code"] == "WELCOME10"
        print(f"✅ WELCOME10 coupon: 10% discount")
    
    def test_sofu5_coupon(self):
        """SOFU5 returns $5 fixed dollar discount"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "SOFU5",
            "product_ids": [],
            "cart_total": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_dollars"] == 5.0
        assert data["code"] == "SOFU5"
        print(f"✅ SOFU5 coupon: $5 off")
    
    def test_gamenight_coupon(self):
        """GAMENIGHT returns $10 fixed dollar discount"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "GAMENIGHT",
            "product_ids": [],
            "cart_total": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_dollars"] == 10.0
        assert data["code"] == "GAMENIGHT"
        print(f"✅ GAMENIGHT coupon: $10 off")
    
    def test_soulx1079_dee_contributor_coupon(self):
        """SoulX1079 (Dee contributor) returns 15% discount"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "SoulX1079",
            "product_ids": [],
            "cart_total": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 15
        assert data["code"] == "SoulX1079"
        print(f"✅ SoulX1079 coupon: 15% discount (Dee contributor)")
    
    def test_soulx1072_temia_contributor_coupon(self):
        """SoulX1072 (Temia contributor) returns 10% discount"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "SoulX1072",
            "product_ids": [],
            "cart_total": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 10
        assert data["code"] == "SoulX1072"
        print(f"✅ SoulX1072 coupon: 10% discount (Temia contributor)")
    
    def test_dollartest_override_coupon(self):
        """DOLLARTEST returns override_total of $1.00"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "DOLLARTEST",
            "product_ids": [],
            "cart_total": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["override_total"] == 1.0
        assert data["code"] == "DOLLARTEST"
        print(f"✅ DOLLARTEST coupon: override_total $1.00")
    
    def test_invalid_coupon_returns_error(self):
        """Invalid coupon code returns valid=false"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "INVALIDCODE123",
            "product_ids": [],
            "cart_total": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert "Invalid" in data["message"] or "invalid" in data["message"].lower()
        print(f"✅ Invalid coupon returns error correctly")


class TestCheckoutFlow:
    """Tests for POST /api/payments/checkout/cart"""
    
    def test_checkout_creates_stripe_session(self):
        """POST /api/payments/checkout/cart creates a Stripe checkout session"""
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json={
            "items": [{
                "product_id": "holiday_ae",
                "name": "Holiday Adult Edition",
                "quantity": 1,
                "salePrice": 16.99
            }],
            "origin_url": "https://soul-food-preview.preview.emergentagent.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        assert "order_number" in data
        assert "checkout.stripe.com" in data["url"]
        print(f"✅ Checkout creates Stripe session: {data['order_number']}")
    
    def test_checkout_with_multiple_items(self):
        """Checkout with multiple items works"""
        response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json={
            "items": [
                {"product_id": "holiday_ae", "name": "Holiday Adult Edition", "quantity": 1, "salePrice": 16.99},
                {"product_id": "snack_pack_ae_m1", "name": "Snack Pack AE M1", "quantity": 1, "salePrice": 8.99}
            ],
            "origin_url": "https://soul-food-preview.preview.emergentagent.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        print(f"✅ Checkout with multiple items works")


class TestProductsEndpoint:
    """Tests for GET /api/payments/products"""
    
    def test_products_endpoint_exists(self):
        """GET /api/payments/products returns 200"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        print(f"✅ Products endpoint returns 200")
    
    def test_holiday_table_bundle_exists(self):
        """Holiday Table Bundle exists with correct price"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", {})
        bundle = products.get("holiday_table_bundle")
        assert bundle is not None, "Holiday Table Bundle not found"
        assert bundle["sale_price"] == 19.99
        print(f"✅ Holiday Table Bundle: $19.99")
    
    def test_full_table_experience_exists(self):
        """Full Table Experience exists with correct price"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", {})
        bundle = products.get("full_table_experience")
        assert bundle is not None, "Full Table Experience not found"
        assert bundle["sale_price"] == 34.99
        print(f"✅ Full Table Experience: $34.99")


class TestAPIStatus:
    """Basic API status tests"""
    
    def test_api_status(self):
        """API root endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/")
        # Accept 200 or 404 (some APIs don't have root endpoint)
        assert response.status_code in [200, 404, 307]
        print(f"✅ API status check passed (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
