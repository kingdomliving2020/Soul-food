"""
Critical Features Test Suite for Soul Food E-commerce Platform
Tests: Free downloads, Coupon validation, Checkout flow
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soft-launch-preview.preview.emergentagent.com')

class TestFreeDownloads:
    """Test free 'In His Image' PDF downloads"""
    
    def test_download_in_his_image_adult_returns_200(self):
        """GET /api/interactive-lessons/download/in-his-image/adult should return HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/download/in-his-image/adult", stream=True)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_download_in_his_image_adult_is_pdf(self):
        """Adult download should return a valid PDF (starts with %PDF)"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/download/in-his-image/adult", stream=True)
        content_start = response.raw.read(10)
        assert content_start.startswith(b'%PDF'), f"Expected PDF, got: {content_start}"
    
    def test_download_in_his_image_adult_size_over_1mb(self):
        """Adult PDF should be > 1MB"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/download/in-his-image/adult")
        size_bytes = len(response.content)
        size_mb = size_bytes / (1024 * 1024)
        assert size_mb > 1, f"Expected > 1MB, got {size_mb:.2f}MB"
        print(f"Adult PDF size: {size_mb:.2f}MB")
    
    def test_download_in_his_image_youth_returns_200(self):
        """GET /api/interactive-lessons/download/in-his-image/youth should return HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/download/in-his-image/youth", stream=True)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_download_in_his_image_youth_is_pdf(self):
        """Youth download should return a valid PDF (starts with %PDF)"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/download/in-his-image/youth", stream=True)
        content_start = response.raw.read(10)
        assert content_start.startswith(b'%PDF'), f"Expected PDF, got: {content_start}"
    
    def test_download_in_his_image_youth_size_over_1mb(self):
        """Youth PDF should be > 1MB"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/download/in-his-image/youth")
        size_bytes = len(response.content)
        size_mb = size_bytes / (1024 * 1024)
        assert size_mb > 1, f"Expected > 1MB, got {size_mb:.2f}MB"
        print(f"Youth PDF size: {size_mb:.2f}MB")
    
    def test_download_invalid_edition_returns_400(self):
        """Invalid edition should return 400"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/download/in-his-image/invalid")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestCouponValidation:
    """Test coupon validation endpoints"""
    
    def test_testii_coupon_is_disabled(self):
        """TESTII coupon should return valid=false (disabled)"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            json={"code": "TESTII", "product_ids": [], "cart_total": 50}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False, f"TESTII should be invalid, got: {data}"
        assert "Invalid coupon code" in data["message"] or "disabled" in data["message"].lower()
        print(f"TESTII response: {data}")
    
    def test_dollartest_coupon_is_valid(self):
        """DOLLARTEST coupon should return valid=true"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            json={"code": "DOLLARTEST", "product_ids": [], "cart_total": 50}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True, f"DOLLARTEST should be valid, got: {data}"
        print(f"DOLLARTEST response: {data}")
    
    def test_dollartest_coupon_has_override_total(self):
        """DOLLARTEST coupon should have override_total=1.0"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            json={"code": "DOLLARTEST", "product_ids": [], "cart_total": 50}
        )
        data = response.json()
        assert data["override_total"] == 1.0, f"Expected override_total=1.0, got: {data['override_total']}"
    
    def test_dollartest_message_shows_dollar_amount(self):
        """DOLLARTEST message should mention $1.00"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            json={"code": "DOLLARTEST", "product_ids": [], "cart_total": 50}
        )
        data = response.json()
        assert "$1.00" in data["message"], f"Expected '$1.00' in message, got: {data['message']}"
    
    def test_invalid_coupon_returns_invalid(self):
        """Random invalid coupon should return valid=false"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            json={"code": "NOTAREALCODE123", "product_ids": [], "cart_total": 50}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
    
    def test_betatest_coupon_is_valid(self):
        """BETATEST coupon should be valid with 100% discount"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            json={"code": "BETATEST", "product_ids": [], "cart_total": 50}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True, f"BETATEST should be valid, got: {data}"
        assert data["discount_percent"] == 100, f"Expected 100% discount, got: {data['discount_percent']}"


class TestCheckoutEndpoints:
    """Test checkout-related endpoints"""
    
    def test_health_check(self):
        """Basic health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
    
    def test_products_endpoint(self):
        """Products endpoint should return data"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data or isinstance(data, list)


class TestMyLibraryEndpoints:
    """Test My Library related endpoints (requires auth)"""
    
    def test_my_purchases_requires_auth(self):
        """My purchases endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/payments/my-purchases")
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
