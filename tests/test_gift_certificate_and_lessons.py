"""
Soul Food Gift Certificate and Interactive Lessons API Tests
============================================================
Tests for:
1. Gift Certificate coupon code validation
2. Gift Certificate create-checkout endpoint
3. Interactive lessons navigation (holiday-ae-* IDs)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://learn-shop-soul.preview.emergentagent.com')


class TestCouponValidation:
    """Test coupon validation for gift certificates"""
    
    def test_validate_coupon_betatest(self):
        """Test BETATEST coupon gives 100% discount"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            json={
                "code": "BETATEST",
                "product_ids": ["gift_certificate_book"],
                "cart_total": 50
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 100
        assert data["code"] == "BETATEST"
        print(f"✅ BETATEST coupon validated: {data['discount_percent']}% off")
    
    def test_validate_invalid_coupon(self):
        """Test invalid coupon returns valid=false"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            json={
                "code": "INVALIDCODE123",
                "product_ids": ["gift_certificate_book"],
                "cart_total": 50
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        print(f"✅ Invalid coupon correctly rejected")


class TestGiftCertificateEndpoints:
    """Test gift certificate API endpoints"""
    
    def test_gift_certificate_types(self):
        """Test that gift certificate types are properly configured"""
        # The create-checkout endpoint validates certificate types
        # Valid types: book, mixup, tricky, subscription
        valid_types = ["book", "mixup", "tricky", "subscription"]
        
        for cert_type in valid_types:
            # Get valid amount for this type
            amounts = {
                "book": 50,
                "mixup": 10,
                "tricky": 10,
                "subscription": 9.99
            }
            
            response = requests.post(
                f"{BASE_URL}/api/gift-certificates/create-checkout",
                json={
                    "certificate_type": cert_type,
                    "amount": amounts[cert_type],
                    "recipient_name": "Test Recipient",
                    "recipient_email": "test@example.com",
                    "sender_name": "Test Sender",
                    "sender_email": "sender@example.com"
                }
            )
            # Should return 200 with checkout_url (Stripe is in live mode, so we just check it doesn't error)
            assert response.status_code == 200, f"Failed for type {cert_type}: {response.text}"
            data = response.json()
            assert "checkout_url" in data or "pending_cert_id" in data
            print(f"✅ Gift certificate type '{cert_type}' validated")
    
    def test_gift_certificate_invalid_type(self):
        """Test invalid certificate type returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/gift-certificates/create-checkout",
            json={
                "certificate_type": "invalid_type",
                "amount": 50,
                "recipient_name": "Test",
                "recipient_email": "test@example.com",
                "sender_name": "Sender",
                "sender_email": "sender@example.com"
            }
        )
        assert response.status_code == 400
        print(f"✅ Invalid certificate type correctly rejected")
    
    def test_gift_certificate_invalid_amount(self):
        """Test invalid amount returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/gift-certificates/create-checkout",
            json={
                "certificate_type": "book",
                "amount": 999,  # Invalid amount for book type
                "recipient_name": "Test",
                "recipient_email": "test@example.com",
                "sender_name": "Sender",
                "sender_email": "sender@example.com"
            }
        )
        assert response.status_code == 400
        print(f"✅ Invalid amount correctly rejected")


class TestInteractiveLessons:
    """Test interactive lessons API endpoints"""
    
    def test_nibbles_list(self):
        """Test nibbles list endpoint returns holiday lessons"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/nibbles")
        assert response.status_code == 200
        data = response.json()
        
        # Check for nibbles key
        assert "nibbles" in data
        nibbles = data["nibbles"]
        
        # Check for holiday lessons with correct IDs
        holiday_ids = ["holiday-ae-covenant", "holiday-ae-cradle", "holiday-ae-cross", "holiday-ae-comforter"]
        found_ids = [n["id"] for n in nibbles]
        
        for hid in holiday_ids:
            assert hid in found_ids, f"Holiday lesson {hid} not found in nibbles"
        
        print(f"✅ All holiday lesson IDs found: {holiday_ids}")
    
    def test_holiday_ae_covenant_lesson(self):
        """Test holiday-ae-covenant lesson loads correctly"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/nibble/holiday-ae-covenant")
        assert response.status_code == 200
        data = response.json()
        
        # Check for nibble key
        assert "nibble" in data
        nibble = data["nibble"]
        
        # Verify lesson data
        assert nibble["id"] == "holiday-ae-covenant"
        assert nibble["title"] == "The Covenant"
        assert nibble["series_name"] == "Holiday Series AE"
        assert "key_verse_ref" in nibble
        assert "bites" in nibble
        
        print(f"✅ holiday-ae-covenant lesson loaded: {nibble['title']}")
    
    def test_holiday_ae_cradle_lesson(self):
        """Test holiday-ae-cradle lesson loads correctly"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/nibble/holiday-ae-cradle")
        assert response.status_code == 200
        data = response.json()
        
        assert "nibble" in data
        nibble = data["nibble"]
        assert nibble["id"] == "holiday-ae-cradle"
        assert nibble["title"] == "The Cradle"
        
        print(f"✅ holiday-ae-cradle lesson loaded: {nibble['title']}")
    
    def test_holiday_ae_cross_lesson(self):
        """Test holiday-ae-cross lesson loads correctly"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/nibble/holiday-ae-cross")
        assert response.status_code == 200
        data = response.json()
        
        assert "nibble" in data
        nibble = data["nibble"]
        assert nibble["id"] == "holiday-ae-cross"
        assert nibble["title"] == "The Cross"
        
        print(f"✅ holiday-ae-cross lesson loaded: {nibble['title']}")
    
    def test_holiday_ae_comforter_lesson(self):
        """Test holiday-ae-comforter lesson loads correctly"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/nibble/holiday-ae-comforter")
        assert response.status_code == 200
        data = response.json()
        
        assert "nibble" in data
        nibble = data["nibble"]
        assert nibble["id"] == "holiday-ae-comforter"
        assert nibble["title"] == "The Comforter"
        
        print(f"✅ holiday-ae-comforter lesson loaded: {nibble['title']}")
    
    def test_invalid_lesson_returns_404(self):
        """Test invalid lesson ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/interactive-lessons/nibble/invalid-lesson-id")
        assert response.status_code == 404
        print(f"✅ Invalid lesson ID correctly returns 404")


class TestAPIHealth:
    """Test API health and basic endpoints"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Soul Food" in data["message"]
        print(f"✅ API root endpoint working")
    
    def test_products_endpoint(self):
        """Test products endpoint"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✅ Products endpoint working: {len(data['products'])} products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
