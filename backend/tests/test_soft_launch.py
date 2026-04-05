"""
Test Suite for Soul Food Soft Launch Features
Tests: Pricing, Pre-order flags, Banner, Merchandise, Instructor section
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soulfood-go-live.preview.emergentagent.com')

class TestBackendProductPricing:
    """Test backend API returns correct pricing and preorder flags"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get products from API"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200, f"Products API failed: {response.status_code}"
        self.products = response.json().get('products', {})
    
    # === BREAKFAST WORKBOOKS - $3 OFF PRE-ORDER ===
    def test_breakfast_ae_digital_price(self):
        """Break*fast AE Digital should be $11.99 (was $14.99, $3 off)"""
        product = self.products.get('breakfast_ae_digital', {})
        assert product.get('sale_price') == 11.99, f"Expected 11.99, got {product.get('sale_price')}"
    
    def test_breakfast_ae_digital_preorder(self):
        """Break*fast AE Digital should have preorder=True"""
        product = self.products.get('breakfast_ae_digital', {})
        assert product.get('preorder') == True, f"Expected preorder=True, got {product.get('preorder')}"
    
    def test_breakfast_ae_paperback_price(self):
        """Break*fast AE Paperback should be $24.99 (was $27.99, $3 off)"""
        product = self.products.get('breakfast_ae_paperback', {})
        assert product.get('sale_price') == 24.99, f"Expected 24.99, got {product.get('sale_price')}"
    
    def test_breakfast_ae_paperback_preorder(self):
        """Break*fast AE Paperback should have preorder=True"""
        product = self.products.get('breakfast_ae_paperback', {})
        assert product.get('preorder') == True
    
    def test_breakfast_ye_digital_price(self):
        """Break*fast YE Digital should be $9.99 (was $12.99, $3 off)"""
        product = self.products.get('breakfast_ye_digital', {})
        assert product.get('sale_price') == 9.99, f"Expected 9.99, got {product.get('sale_price')}"
    
    def test_breakfast_ye_digital_preorder(self):
        """Break*fast YE Digital should have preorder=True"""
        product = self.products.get('breakfast_ye_digital', {})
        assert product.get('preorder') == True
    
    def test_breakfast_ye_paperback_price(self):
        """Break*fast YE Paperback should be $21.99 (was $24.99, $3 off)"""
        product = self.products.get('breakfast_ye_paperback', {})
        assert product.get('sale_price') == 21.99, f"Expected 21.99, got {product.get('sale_price')}"
    
    def test_breakfast_ye_paperback_preorder(self):
        """Break*fast YE Paperback should have preorder=True"""
        product = self.products.get('breakfast_ye_paperback', {})
        assert product.get('preorder') == True
    
    # === LUNCH WORKBOOKS - $3 OFF PRE-ORDER ===
    def test_lunch_ae_paperback_price(self):
        """Lunch AE Paperback should be $24.99 (was $27.99, $3 off)"""
        product = self.products.get('lunch_ae_paperback', {})
        assert product.get('sale_price') == 24.99, f"Expected 24.99, got {product.get('sale_price')}"
    
    def test_lunch_ae_paperback_preorder(self):
        """Lunch AE Paperback should have preorder=True"""
        product = self.products.get('lunch_ae_paperback', {})
        assert product.get('preorder') == True
    
    def test_lunch_ye_paperback_price(self):
        """Lunch YE Paperback should be $21.99 (was $24.99, $3 off)"""
        product = self.products.get('lunch_ye_paperback', {})
        assert product.get('sale_price') == 21.99, f"Expected 21.99, got {product.get('sale_price')}"
    
    def test_lunch_ye_paperback_preorder(self):
        """Lunch YE Paperback should have preorder=True"""
        product = self.products.get('lunch_ye_paperback', {})
        assert product.get('preorder') == True
    
    def test_lunch_ie_paperback_price(self):
        """Lunch IE Paperback should be $26.99 (was $29.99, $3 off)"""
        product = self.products.get('lunch_ie_paperback', {})
        assert product.get('sale_price') == 26.99, f"Expected 26.99, got {product.get('sale_price')}"
    
    def test_lunch_ie_paperback_preorder(self):
        """Lunch IE Paperback should have preorder=True"""
        product = self.products.get('lunch_ie_paperback', {})
        assert product.get('preorder') == True
    
    # === HOLIDAY WORKBOOKS - NO CHANGE, AVAILABLE NOW ===
    def test_holiday_ae_price(self):
        """Holiday AE should be $16.99 (no change)"""
        product = self.products.get('holiday_ae', {})
        assert product.get('sale_price') == 16.99, f"Expected 16.99, got {product.get('sale_price')}"
    
    def test_holiday_ae_not_preorder(self):
        """Holiday AE should NOT have preorder flag (available now)"""
        product = self.products.get('holiday_ae', {})
        assert product.get('preorder') is None or product.get('preorder') == False
    
    def test_holiday_ie_price(self):
        """Holiday IE should be $19.99 (no change)"""
        product = self.products.get('holiday_ie', {})
        assert product.get('sale_price') == 19.99, f"Expected 19.99, got {product.get('sale_price')}"
    
    def test_holiday_ie_not_preorder(self):
        """Holiday IE should NOT have preorder flag (available now)"""
        product = self.products.get('holiday_ie', {})
        assert product.get('preorder') is None or product.get('preorder') == False
    
    # === SNACK PACKS - AVAILABLE NOW ===
    def test_snack_pack_ae_m1_price(self):
        """Snack Pack AE M1 should be $8.99"""
        product = self.products.get('snack_pack_ae_m1', {})
        assert product.get('sale_price') == 8.99
    
    def test_snack_pack_not_preorder(self):
        """Snack Packs should NOT have preorder flag"""
        product = self.products.get('snack_pack_ae_m1', {})
        assert product.get('preorder') is None or product.get('preorder') == False
    
    # === NIBBLES - AVAILABLE NOW ===
    def test_nibble_ae_price(self):
        """Nibble AE should be $3.99"""
        product = self.products.get('nibble_ae', {})
        assert product.get('sale_price') == 3.99
    
    def test_nibble_not_preorder(self):
        """Nibbles should NOT have preorder flag"""
        product = self.products.get('nibble_ae', {})
        assert product.get('preorder') is None or product.get('preorder') == False
    
    # === MERCHANDISE ===
    def test_bookmarks_set_price(self):
        """Bookmarks Set should be $6.99"""
        product = self.products.get('bookmarks_set', {})
        assert product.get('sale_price') == 6.99
    
    def test_bookmark_leather_price(self):
        """Leather Bookmark should be $4.99"""
        product = self.products.get('bookmark_leather', {})
        assert product.get('sale_price') == 4.99


class TestPaymentSuccessPage:
    """Test PaymentSuccess page loads without errors"""
    
    def test_payment_success_no_session_returns_error(self):
        """PaymentSuccess without session_id should show 'No payment session found'"""
        # This tests the API endpoint that the page calls
        response = requests.get(f"{BASE_URL}/api/payments/checkout/status/invalid-session-id")
        # Should return 404 or 500 for invalid session
        assert response.status_code in [404, 500], f"Expected 404/500, got {response.status_code}"


class TestCheckoutCouponNote:
    """Test checkout page coupon section"""
    
    def test_coupon_validation_endpoint_exists(self):
        """Coupon validation endpoint should exist"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "TESTCODE",
            "product_ids": [],
            "cart_total": 10.00
        })
        # Should return 200 even for invalid coupon (with valid=false)
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
