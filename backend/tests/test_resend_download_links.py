"""
Test suite for P1: Resend Download Link API
Tests POST /api/downloads/resend-links endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-durability.preview.emergentagent.com')


class TestResendDownloadLinksAPI:
    """Tests for POST /api/downloads/resend-links endpoint"""
    
    def test_resend_links_valid_request_no_links(self):
        """Test resend with valid request but no download links exist for order"""
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={
                "order_id": "test-order-nonexistent",
                "email": "test@example.com"
            },
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 429 with "No download links found" message
        assert response.status_code == 429
        data = response.json()
        assert "detail" in data
        assert "No download links found" in data["detail"]
    
    def test_resend_links_invalid_email_format(self):
        """Test resend with invalid email format"""
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={
                "order_id": "test-order-123",
                "email": "invalid-email"
            },
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 422 validation error
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        # Check that email validation error is present
        errors = data["detail"]
        assert any("email" in str(err).lower() for err in errors)
    
    def test_resend_links_missing_order_id(self):
        """Test resend with missing order_id"""
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={
                "email": "test@example.com"
            },
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 422 validation error
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    def test_resend_links_missing_email(self):
        """Test resend with missing email"""
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={
                "order_id": "test-order-123"
            },
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 422 validation error
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    def test_resend_links_empty_order_id(self):
        """Test resend with empty order_id"""
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={
                "order_id": "",
                "email": "test@example.com"
            },
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 429 (no links found) since empty order won't match
        assert response.status_code == 429
        data = response.json()
        assert "detail" in data
    
    def test_resend_links_response_structure(self):
        """Test that error response has correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/downloads/resend-links",
            json={
                "order_id": "SF-2026-TEST123",
                "email": "test@example.com"
            },
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 429 with detail message
        assert response.status_code == 429
        data = response.json()
        
        # Verify response structure
        assert "detail" in data
        assert isinstance(data["detail"], str)


class TestDownloadLinkInfo:
    """Tests for GET /api/downloads/link-info endpoint"""
    
    def test_link_info_returns_config(self):
        """Test that link-info endpoint returns configuration"""
        response = requests.get(f"{BASE_URL}/api/downloads/link-info")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        assert "expiry_hours" in data
        assert "max_downloads" in data
        assert "resend_rate_limit" in data
        assert "resend_rate_window" in data
        
        # Verify values are reasonable
        assert data["expiry_hours"] > 0
        assert data["max_downloads"] > 0
        assert data["resend_rate_limit"] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
