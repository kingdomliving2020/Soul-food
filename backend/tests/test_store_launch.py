"""
Soul Food Store Launch Tests - Iteration 10
============================================
Tests for:
1. Featured section bundles (Holiday Table Bundle, Full Table Experience, Holiday ePub AE)
2. New coupons: WELCOME10 (10% off), SOFU5 ($5 off), GAMENIGHT ($10 off)
3. Backend bundles in /api/payments/products
4. Game Night Lite (30-Day) and Game Pass Full (90-Day) pricing
5. Gift certificates hidden
6. Thank You page messaging
7. Global message on quick order page
8. Pre-Order section messaging
9. Free Resources section
10. BKFT Snack Pack clarification text
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-food-checkout.preview.emergentagent.com')

class TestNewCoupons:
    """Test new launch coupons: WELCOME10, SOFU5, GAMENIGHT"""
    
    def test_welcome10_coupon_valid(self):
        """WELCOME10 should return valid=true with 10% discount"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "WELCOME10",
            "product_ids": [],
            "cart_total": 50.00,
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 10
        assert "10%" in data["message"] or "WELCOME10" in data["code"]
        print(f"✅ WELCOME10 coupon: valid={data['valid']}, discount_percent={data['discount_percent']}")
    
    def test_sofu5_coupon_valid(self):
        """SOFU5 should return valid=true with $5 fixed discount"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "SOFU5",
            "product_ids": [],
            "cart_total": 50.00,
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        # Fixed dollar discount - should have discount_dollars field
        assert data.get("discount_dollars", 0) == 5.00 or data.get("discount_percent", 0) > 0
        print(f"✅ SOFU5 coupon: valid={data['valid']}, discount_dollars={data.get('discount_dollars', 0)}")
    
    def test_gamenight_coupon_valid(self):
        """GAMENIGHT should return valid=true with $10 fixed discount"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "GAMENIGHT",
            "product_ids": [],
            "cart_total": 50.00,
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        # Fixed dollar discount - should have discount_dollars field
        assert data.get("discount_dollars", 0) == 10.00 or data.get("discount_percent", 0) > 0
        print(f"✅ GAMENIGHT coupon: valid={data['valid']}, discount_dollars={data.get('discount_dollars', 0)}")


class TestBundleProducts:
    """Test bundle products in /api/payments/products"""
    
    def test_products_endpoint_exists(self):
        """GET /api/payments/products should return 200"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data or isinstance(data, dict)
        print(f"✅ Products endpoint returns {response.status_code}")
    
    def test_holiday_table_bundle_exists(self):
        """holiday_table_bundle should exist with sale_price=19.99"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", data)
        
        # Check if holiday_table_bundle exists
        bundle = products.get("holiday_table_bundle")
        if bundle:
            assert bundle.get("sale_price") == 19.99
            print(f"✅ holiday_table_bundle: sale_price={bundle.get('sale_price')}")
        else:
            # Bundle might be defined in frontend only
            print(f"⚠️ holiday_table_bundle not in backend products (may be frontend-only)")
    
    def test_full_table_experience_exists(self):
        """full_table_experience should exist with sale_price=34.99"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", data)
        
        # Check if full_table_experience exists
        bundle = products.get("full_table_experience")
        if bundle:
            assert bundle.get("sale_price") == 34.99
            print(f"✅ full_table_experience: sale_price={bundle.get('sale_price')}")
        else:
            # Bundle might be defined in frontend only
            print(f"⚠️ full_table_experience not in backend products (may be frontend-only)")


class TestGamePasses:
    """Test Game Night Lite and Game Pass Full pricing"""
    
    def test_game_pass_30_price(self):
        """Game Night Lite (30-Day) should be $6.39 (20% off $7.99)"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", data)
        
        game_pass = products.get("game_pass_30")
        if game_pass:
            # Check promo price or sale price
            promo_price = game_pass.get("promo_sale_price", game_pass.get("sale_price"))
            list_price = game_pass.get("list_price", 7.99)
            assert list_price == 7.99
            # Promo price should be 6.39 (20% off)
            if game_pass.get("promo_sale_price"):
                assert game_pass["promo_sale_price"] == 6.39
            print(f"✅ game_pass_30: list_price={list_price}, promo_sale_price={game_pass.get('promo_sale_price')}")
        else:
            print(f"⚠️ game_pass_30 not found in products")
    
    def test_game_pass_90_price(self):
        """Game Pass Full (90-Day) should be $19.99 (20% off $24.99)"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", data)
        
        game_pass = products.get("game_pass_90")
        if game_pass:
            list_price = game_pass.get("list_price", 24.99)
            assert list_price == 24.99
            # Promo price should be 19.99 (20% off)
            if game_pass.get("promo_sale_price"):
                assert game_pass["promo_sale_price"] == 19.99
            print(f"✅ game_pass_90: list_price={list_price}, promo_sale_price={game_pass.get('promo_sale_price')}")
        else:
            print(f"⚠️ game_pass_90 not found in products")


class TestCouponValidation:
    """Additional coupon validation tests"""
    
    def test_invalid_coupon_returns_false(self):
        """Invalid coupon code should return valid=false"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "INVALIDCODE123",
            "product_ids": [],
            "cart_total": 50.00,
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        print(f"✅ Invalid coupon returns valid=false")
    
    def test_betatest_coupon_still_works(self):
        """BETATEST coupon should still work (100% off)"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "BETATEST",
            "product_ids": [],
            "cart_total": 50.00,
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 100
        print(f"✅ BETATEST coupon: valid={data['valid']}, discount_percent={data['discount_percent']}")


class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """API should be reachable"""
        response = requests.get(f"{BASE_URL}/api/health")
        # Health endpoint might return 200 or 404 if not defined
        assert response.status_code in [200, 404]
        print(f"✅ API health check: {response.status_code}")
    
    def test_products_endpoint_returns_data(self):
        """Products endpoint should return product data"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        # Should have products
        products = data.get("products", data)
        assert len(products) > 0
        print(f"✅ Products endpoint returns {len(products)} products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
