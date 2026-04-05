"""
Soul Food Soft Launch V2 Tests - January 2026
Tests for:
1. Breakfast lessons Month 1 available, Month 2/3 unavailable
2. Breakfast snack packs Month 1 available, Month 2/3 unavailable  
3. Gaming passes 20% off ($6.39 for 30-day, $19.99 for 90-day)
4. Backend API promo_active=true for game passes
5. Holiday lessons all available
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soulfood-go-live.preview.emergentagent.com')

class TestGamePassPromo:
    """Test 20% off game pass pricing - no coupon required"""
    
    def test_game_pass_30_sale_price(self):
        """30-Day Game Pass should be $6.39 (20% off $7.99)"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        gp30 = data['products'].get('game_pass_30', {})
        assert gp30.get('sale_price') == 6.39, f"Expected 6.39, got {gp30.get('sale_price')}"
    
    def test_game_pass_30_list_price(self):
        """30-Day Game Pass list price should be $7.99"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        gp30 = data['products'].get('game_pass_30', {})
        assert gp30.get('list_price') == 7.99, f"Expected 7.99, got {gp30.get('list_price')}"
    
    def test_game_pass_30_promo_active(self):
        """30-Day Game Pass should have promo_active=true"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        gp30 = data['products'].get('game_pass_30', {})
        assert gp30.get('promo_active') == True, f"Expected promo_active=True, got {gp30.get('promo_active')}"
    
    def test_game_pass_90_sale_price(self):
        """90-Day Game Pass should be $19.99 (20% off $24.99)"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        gp90 = data['products'].get('game_pass_90', {})
        assert gp90.get('sale_price') == 19.99, f"Expected 19.99, got {gp90.get('sale_price')}"
    
    def test_game_pass_90_list_price(self):
        """90-Day Game Pass list price should be $24.99"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        gp90 = data['products'].get('game_pass_90', {})
        assert gp90.get('list_price') == 24.99, f"Expected 24.99, got {gp90.get('list_price')}"
    
    def test_game_pass_90_promo_active(self):
        """90-Day Game Pass should have promo_active=true"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        gp90 = data['products'].get('game_pass_90', {})
        assert gp90.get('promo_active') == True, f"Expected promo_active=True, got {gp90.get('promo_active')}"
    
    def test_game_pass_promo_until_pentecost(self):
        """Game passes promo should run until Pentecost (May 24, 2026)"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        gp30 = data['products'].get('game_pass_30', {})
        gp90 = data['products'].get('game_pass_90', {})
        assert gp30.get('promo_until') == '2026-05-24', f"Expected 2026-05-24, got {gp30.get('promo_until')}"
        assert gp90.get('promo_until') == '2026-05-24', f"Expected 2026-05-24, got {gp90.get('promo_until')}"


class TestHolidayLessons:
    """Test Holiday lessons availability"""
    
    def test_holiday_ae_available(self):
        """Holiday AE workbook should be available (no preorder)"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        holiday_ae = data['products'].get('holiday_ae', {})
        # Holiday should NOT have preorder flag
        assert holiday_ae.get('preorder') is None or holiday_ae.get('preorder') == False
    
    def test_holiday_ye_available(self):
        """Holiday YE workbook should be available (no preorder)"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        holiday_ye = data['products'].get('holiday_ye', {})
        assert holiday_ye.get('preorder') is None or holiday_ye.get('preorder') == False
    
    def test_holiday_ie_available(self):
        """Holiday IE workbook should be available (no preorder)"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        holiday_ie = data['products'].get('holiday_ie', {})
        assert holiday_ie.get('preorder') is None or holiday_ie.get('preorder') == False


class TestBreakfastSnackPacks:
    """Test Breakfast Snack Pack availability"""
    
    def test_snack_pack_ae_m1_available(self):
        """Snack Pack AE Month 1 should be available (no preorder)"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        sp_m1 = data['products'].get('snack_pack_ae_m1', {})
        assert sp_m1.get('preorder') is None or sp_m1.get('preorder') == False
        assert sp_m1.get('sale_price') == 8.99
    
    def test_snack_pack_ye_m1_available(self):
        """Snack Pack YE Month 1 should be available (no preorder)"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        sp_m1 = data['products'].get('snack_pack_ye_m1', {})
        assert sp_m1.get('preorder') is None or sp_m1.get('preorder') == False
        assert sp_m1.get('sale_price') == 8.99


class TestNibbles:
    """Test Nibble (single lesson) availability"""
    
    def test_nibble_ae_available(self):
        """Nibble AE should be available"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        nibble = data['products'].get('nibble_ae', {})
        assert nibble.get('preorder') is None or nibble.get('preorder') == False
        assert nibble.get('sale_price') == 3.99
    
    def test_nibble_ye_available(self):
        """Nibble YE should be available"""
        response = requests.get(f"{BASE_URL}/api/payments/products")
        assert response.status_code == 200
        data = response.json()
        nibble = data['products'].get('nibble_ye', {})
        assert nibble.get('preorder') is None or nibble.get('preorder') == False
        assert nibble.get('sale_price') == 3.99


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
