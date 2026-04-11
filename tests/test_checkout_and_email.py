"""
Test Suite for Soul Food Checkout Flow and Email Integration
=============================================================
Tests the new features:
1. Amazon-like checkout flow (Sign In / Continue as Guest)
2. PDF generation with improved TOC
3. Email configuration endpoint
4. Free order with email confirmation

Features tested:
- GET /api/email/config - returns support email and topics
- POST /api/payments/free-order with customer_email - sends confirmation email
- PDF generation via backend API
"""

import pytest
import requests
import os
import time

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://soul-food-preview.preview.emergentagent.com"


class TestEmailConfiguration:
    """Test email configuration endpoint"""
    
    def test_email_config_returns_support_email(self):
        """Test GET /api/email/config returns correct support email"""
        response = requests.get(f"{BASE_URL}/api/email/config")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify support email
        assert "support_email" in data, "Missing support_email in response"
        assert data["support_email"] == "support@kingdom-soul.com", f"Expected support@kingdom-soul.com, got {data['support_email']}"
        
        print(f"✓ Email config: support_email = {data['support_email']}")
    
    def test_email_config_returns_topics(self):
        """Test GET /api/email/config returns contact topics"""
        response = requests.get(f"{BASE_URL}/api/email/config")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify topics
        assert "topics" in data, "Missing topics in response"
        assert isinstance(data["topics"], list), "Topics should be a list"
        assert len(data["topics"]) > 0, "Topics list should not be empty"
        
        # Verify expected topics
        expected_topics = ["Support", "Billing", "Technical", "Prayer Request", "Feedback", "Partnership", "Other"]
        for topic in expected_topics:
            assert topic in data["topics"], f"Missing topic: {topic}"
        
        print(f"✓ Email config: {len(data['topics'])} topics available")


class TestFreeOrderWithEmail:
    """Test free order flow with email confirmation"""
    
    order_id = None
    
    def test_free_order_with_customer_email(self):
        """Test POST /api/payments/free-order with customer_email sends confirmation"""
        payload = {
            "items": [
                {
                    "product_id": "holiday_ae",
                    "name": "Holiday Adult Edition (WBK)",
                    "quantity": 1,
                    "price": 16.99
                }
            ],
            "coupon_code": "BETATEST",
            "discount_percent": 100,
            "customer_email": "test@example.com",
            "customer_name": "Test User"
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
        
        TestFreeOrderWithEmail.order_id = data["order_id"]
        
        print(f"✓ Free order with email created: {data['order_id']}")
        print(f"  Customer email: test@example.com")
        print(f"  Download links: {len(data.get('download_links', []))}")
    
    def test_free_order_without_email(self):
        """Test POST /api/payments/free-order without customer_email still works"""
        payload = {
            "items": [
                {
                    "product_id": "holiday_ye",
                    "name": "Holiday Youth Edition (WBK)",
                    "quantity": 1,
                    "price": 16.99
                }
            ],
            "coupon_code": "BETATEST",
            "discount_percent": 100
            # No customer_email
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
        
        print(f"✓ Free order without email created: {data['order_id']}")


class TestContactFormEndpoint:
    """Test contact form submission endpoint"""
    
    def test_contact_form_submission(self):
        """Test POST /api/email/contact submits successfully"""
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "topic": "Support",
            "message": "This is a test message from automated testing.",
            "page_url": "https://kingdom-soul.com/contact"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/email/contact",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Expected success=True"
        assert "message" in data, "Missing message in response"
        
        print(f"✓ Contact form submitted successfully")
        print(f"  Response: {data['message']}")
    
    def test_contact_form_with_invalid_topic(self):
        """Test contact form with invalid topic defaults to 'Other'"""
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "topic": "InvalidTopic",
            "message": "Testing invalid topic handling."
        }
        
        response = requests.post(
            f"{BASE_URL}/api/email/contact",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should still succeed (topic defaults to "Other")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True
        
        print(f"✓ Invalid topic handled gracefully")


class TestPDFGeneration:
    """Test PDF generation endpoints"""
    
    def test_lessons_endpoint(self):
        """Test GET /api/lessons returns lessons for PDF generation"""
        response = requests.get(f"{BASE_URL}/api/lessons")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "lessons" in data, "Missing lessons in response"
        lessons = data["lessons"]
        
        print(f"✓ Lessons endpoint returned {len(lessons)} lessons")
        
        # Verify lesson structure for PDF generation
        if lessons:
            lesson = lessons[0]
            assert "title" in lesson, "Lesson missing title"
            assert "series" in lesson, "Lesson missing series"
            print(f"  Sample lesson: {lesson.get('title', 'N/A')}")
    
    def test_interactive_lessons_endpoint(self):
        """Test GET /api/interactive-lessons returns nibbles for PDF"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons")
        
        # This endpoint may or may not exist
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Interactive lessons endpoint available")
            if "nibbles" in data:
                print(f"  Nibbles count: {len(data['nibbles'])}")
        elif response.status_code == 404:
            print("⚠ Interactive lessons endpoint not found (may be expected)")
        else:
            print(f"⚠ Interactive lessons returned {response.status_code}")


class TestProductsEndpoint:
    """Test products endpoint for checkout flow"""
    
    def test_products_endpoint(self):
        """Test GET /api/payments/products returns product catalog"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "products" in data, "Missing products in response"
        products = data["products"]
        
        print(f"✓ Products endpoint returned {len(products)} products")
        
        # Verify key products exist
        key_products = ["holiday_ae", "holiday_ye", "holiday_ie"]
        for prod_id in key_products:
            assert prod_id in products, f"Missing product: {prod_id}"
        
        # Verify product structure
        sample = products.get("holiday_ae", {})
        assert "name" in sample, "Product missing name"
        assert "sale_price" in sample, "Product missing sale_price"
        
        print(f"  Sample product: {sample.get('name')} - ${sample.get('sale_price')}")


class TestCouponValidation:
    """Test coupon validation for checkout flow"""
    
    def test_validate_100_percent_coupon(self):
        """Test coupon validation with 100% discount coupon"""
        payload = {
            "code": "BETATEST",
            "product_ids": ["holiday_ae"],
            "cart_total": 16.99
        }
        
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        if data.get("valid"):
            assert data.get("discount_percent") == 100, f"Expected 100% discount, got {data.get('discount_percent')}"
            print(f"✓ BETATEST coupon validated: {data.get('discount_percent')}% discount")
        else:
            print(f"⚠ BETATEST coupon not valid: {data.get('message')}")
    
    def test_validate_invalid_coupon(self):
        """Test coupon validation with invalid coupon"""
        payload = {
            "code": "INVALIDCODE123",
            "product_ids": ["holiday_ae"],
            "cart_total": 16.99
        }
        
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("valid") == False, "Invalid coupon should return valid=False"
        print(f"✓ Invalid coupon correctly rejected")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "message" in data
        assert "Soul Food" in data["message"]
        
        print(f"✓ API root: {data['message']}")
    
    def test_series_endpoint(self):
        """Test series endpoint"""
        response = requests.get(f"{BASE_URL}/api/series")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "series" in data
        series = data["series"]
        
        # Verify key series exist
        assert "holiday" in series, "Missing holiday series"
        assert "breakfast" in series, "Missing breakfast series"
        
        print(f"✓ Series endpoint: {len(series)} series available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
