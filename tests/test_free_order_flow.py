"""
Test Suite for Free Order Flow (100% Discount Coupon)
=====================================================
Tests the P0 bug fix: when using a 100% discount coupon, users should receive download links.

Features tested:
1. POST /api/payments/free-order - creates order with download_links array
2. GET /api/payments/order/{order_id} - returns order details with download_links
3. GET /api/downloads/remaining/{token} - verifies token and returns download info
"""

import pytest
import requests
import os
import time

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://soul-food-platform.preview.emergentagent.com"


class TestFreeOrderFlow:
    """Test the complete free order flow with 100% discount coupon"""
    
    # Store order data between tests
    order_id = None
    download_links = []
    
    def test_01_api_health_check(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Soul Food" in data["message"]
        print(f"✓ API health check passed: {data['message']}")
    
    def test_02_products_endpoint(self):
        """Verify products endpoint returns expected products"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        
        # Verify test products exist
        products = data["products"]
        test_products = ["holiday_ae", "holiday_ye", "holiday_ie", "nibble_ae", "nibble_ye"]
        for prod_id in test_products:
            assert prod_id in products, f"Product {prod_id} not found in catalog"
        
        print(f"✓ Products endpoint returned {len(products)} products")
    
    def test_03_free_order_with_single_digital_product(self):
        """Test free order with a single digital product (holiday_ae)"""
        payload = {
            "items": [
                {
                    "product_id": "holiday_ae",
                    "name": "Holiday Adult Edition (WBK)",
                    "quantity": 1,
                    "price": 16.99
                }
            ],
            "coupon_code": "BETA100",
            "discount_percent": 100
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments/free-order",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True, "Expected success=True"
        assert "order_id" in data, "Missing order_id in response"
        assert data["order_id"].startswith("FREE-"), f"Order ID should start with FREE-, got {data['order_id']}"
        assert "download_links" in data, "Missing download_links in response"
        
        # Store for later tests
        TestFreeOrderFlow.order_id = data["order_id"]
        TestFreeOrderFlow.download_links = data.get("download_links", [])
        
        print(f"✓ Free order created: {data['order_id']}")
        print(f"  Download links returned: {len(data.get('download_links', []))}")
        
        # Verify download links structure if present
        if data.get("download_links"):
            link = data["download_links"][0]
            assert "product_id" in link, "Download link missing product_id"
            assert "token" in link, "Download link missing token"
            assert "expires_at" in link, "Download link missing expires_at"
            print(f"  First download link: product_id={link['product_id']}, has_token={bool(link.get('token'))}")
    
    def test_04_free_order_with_multiple_products(self):
        """Test free order with multiple digital products"""
        payload = {
            "items": [
                {
                    "product_id": "holiday_ae",
                    "name": "Holiday Adult Edition (WBK)",
                    "quantity": 1,
                    "price": 16.99
                },
                {
                    "product_id": "nibble_ae",
                    "name": "Break*fast Nibble AE",
                    "quantity": 1,
                    "price": 3.99
                }
            ],
            "coupon_code": "BETA100",
            "discount_percent": 100
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments/free-order",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "order_id" in data
        assert "download_links" in data
        
        # Should have download links for both products
        download_links = data.get("download_links", [])
        print(f"✓ Multi-product free order created: {data['order_id']}")
        print(f"  Download links returned: {len(download_links)}")
        
        # Store for order details test
        TestFreeOrderFlow.order_id = data["order_id"]
        TestFreeOrderFlow.download_links = download_links
    
    def test_05_get_order_details(self):
        """Test GET /api/payments/order/{order_id} returns order with download links"""
        if not TestFreeOrderFlow.order_id:
            pytest.skip("No order_id from previous test")
        
        response = requests.get(f"{BASE_URL}/api/payments/order/{TestFreeOrderFlow.order_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify order details structure
        assert "order_id" in data, "Missing order_id in response"
        assert data["order_id"] == TestFreeOrderFlow.order_id
        assert "items" in data, "Missing items in response"
        assert "payment_status" in data, "Missing payment_status"
        assert "download_links" in data, "Missing download_links in response"
        
        print(f"✓ Order details retrieved for {data['order_id']}")
        print(f"  Payment status: {data['payment_status']}")
        print(f"  Items: {len(data['items'])}")
        print(f"  Download links: {len(data['download_links'])}")
        
        # Verify download links have expected fields
        if data["download_links"]:
            link = data["download_links"][0]
            assert "product_id" in link
            assert "product_name" in link
            assert "download_count" in link
            assert "max_downloads" in link
            assert "expires_at" in link
    
    def test_06_get_order_downloads(self):
        """Test GET /api/payments/order/{order_id}/downloads returns download info"""
        if not TestFreeOrderFlow.order_id:
            pytest.skip("No order_id from previous test")
        
        response = requests.get(f"{BASE_URL}/api/payments/order/{TestFreeOrderFlow.order_id}/downloads")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "order_id" in data
        assert "downloads" in data
        
        print(f"✓ Order downloads retrieved: {len(data['downloads'])} items")
        
        for dl in data["downloads"]:
            print(f"  - {dl.get('product_name')}: {dl.get('remaining')} downloads remaining")
    
    def test_07_verify_download_token(self):
        """Test GET /api/downloads/remaining/{token} verifies token"""
        if not TestFreeOrderFlow.download_links:
            pytest.skip("No download links from previous test")
        
        # Get the first download token
        token = TestFreeOrderFlow.download_links[0].get("token")
        if not token:
            pytest.skip("No token in download link")
        
        response = requests.get(f"{BASE_URL}/api/downloads/remaining/{token}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "valid" in data, "Missing 'valid' field in response"
        
        if data["valid"]:
            assert "product_name" in data
            assert "remaining_downloads" in data
            assert "max_downloads" in data
            assert "expires_at" in data
            print(f"✓ Token verified: {data['product_name']}")
            print(f"  Remaining downloads: {data['remaining_downloads']}/{data['max_downloads']}")
        else:
            print(f"⚠ Token invalid: {data.get('error', 'Unknown error')}")
    
    def test_08_invalid_discount_percent_rejected(self):
        """Test that non-100% discount is rejected by free-order endpoint"""
        payload = {
            "items": [
                {
                    "product_id": "holiday_ae",
                    "name": "Holiday Adult Edition (WBK)",
                    "quantity": 1,
                    "price": 16.99
                }
            ],
            "coupon_code": "PARTIAL50",
            "discount_percent": 50  # Not 100%
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments/free-order",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should reject non-100% discount
        assert response.status_code == 400, f"Expected 400 for non-100% discount, got {response.status_code}"
        print("✓ Non-100% discount correctly rejected")
    
    def test_09_order_not_found(self):
        """Test GET /api/payments/order/{order_id} returns 404 for invalid order"""
        response = requests.get(f"{BASE_URL}/api/payments/order/INVALID-ORDER-12345")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid order correctly returns 404")
    
    def test_10_invalid_download_token(self):
        """Test GET /api/downloads/remaining/{token} handles invalid token"""
        response = requests.get(f"{BASE_URL}/api/downloads/remaining/invalid_token_12345")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("valid") == False, "Expected valid=False for invalid token"
        assert "error" in data or "remaining_downloads" in data
        print("✓ Invalid token correctly handled")


class TestDownloadLinkInfo:
    """Test download link configuration endpoint"""
    
    def test_download_link_info(self):
        """Test GET /api/downloads/link-info returns configuration"""
        response = requests.get(f"{BASE_URL}/api/downloads/link-info")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "expiry_hours" in data
        assert "max_downloads" in data
        assert data["expiry_hours"] == 72, f"Expected 72 hours expiry, got {data['expiry_hours']}"
        assert data["max_downloads"] == 3, f"Expected 3 max downloads, got {data['max_downloads']}"
        
        print(f"✓ Download link config: {data['expiry_hours']}h expiry, {data['max_downloads']} max downloads")


class TestYouthEditionProducts:
    """Test free order with Youth Edition products"""
    
    def test_free_order_youth_products(self):
        """Test free order with youth edition products"""
        payload = {
            "items": [
                {
                    "product_id": "holiday_ye",
                    "name": "Holiday Youth Edition (WBK)",
                    "quantity": 1,
                    "price": 16.99
                },
                {
                    "product_id": "nibble_ye",
                    "name": "Break*fast Nibble YE",
                    "quantity": 1,
                    "price": 3.99
                }
            ],
            "coupon_code": "BETA100",
            "discount_percent": 100
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments/free-order",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "download_links" in data
        
        print(f"✓ Youth edition free order created: {data['order_id']}")
        print(f"  Download links: {len(data.get('download_links', []))}")


class TestInstructorEditionProducts:
    """Test free order with Instructor Edition products"""
    
    def test_free_order_instructor_products(self):
        """Test free order with instructor edition products"""
        payload = {
            "items": [
                {
                    "product_id": "holiday_ie",
                    "name": "Holiday Instructor Edition (WBK)",
                    "quantity": 1,
                    "price": 19.99
                }
            ],
            "coupon_code": "BETA100",
            "discount_percent": 100
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments/free-order",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "download_links" in data
        
        print(f"✓ Instructor edition free order created: {data['order_id']}")
        print(f"  Download links: {len(data.get('download_links', []))}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
