"""
Soul Food - Critical Bug Fixes Test Suite (Iteration 14)
=========================================================
Tests for:
1. Login returns session_config field
2. Password reset email sends successfully
3. SITE_URL resolves to production domain
4. All 4 game files accessible
"""

import pytest
import requests
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment
load_dotenv(Path('/app/backend/.env'))

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-checkout-stage.preview.emergentagent.com').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "overflowharvest@gmail.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Admin123!")


class TestLoginSessionConfig:
    """Test that login returns session_config field"""
    
    def test_login_returns_session_config(self):
        """POST /api/auth/login should return session_config object"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "identifier": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            },
            timeout=15
        )
        
        # Status assertion
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        
        # Verify session_config exists
        assert "session_config" in data, f"session_config missing from response: {data.keys()}"
        
        session_config = data["session_config"]
        
        # Verify session_config has required keys
        assert "timeout_mins" in session_config, f"timeout_mins missing from session_config: {session_config}"
        assert "role" in session_config, f"role missing from session_config: {session_config}"
        assert "message" in session_config, f"message missing from session_config: {session_config}"
        
        # Verify values are correct types
        assert isinstance(session_config["timeout_mins"], int), "timeout_mins should be int"
        assert isinstance(session_config["role"], str), "role should be string"
        assert isinstance(session_config["message"], str), "message should be string"
        
        print(f"✅ Login session_config: {session_config}")
        
        # Also verify user object exists
        assert "user" in data, "user object missing from response"
        assert "access_token" in data, "access_token missing from response"


class TestPasswordReset:
    """Test password reset email functionality"""
    
    def test_forgot_password_returns_200(self):
        """POST /api/auth/forgot-password should return 200 OK"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": ADMIN_EMAIL},
            timeout=15
        )
        
        # Status assertion
        assert response.status_code == 200, f"Forgot password failed: {response.text}"
        
        data = response.json()
        
        # Verify response message
        assert "message" in data, f"message missing from response: {data}"
        assert "reset link" in data["message"].lower() or "email" in data["message"].lower(), \
            f"Unexpected message: {data['message']}"
        
        print(f"✅ Password reset response: {data['message']}")


class TestSiteURLConfig:
    """Test that SITE_URL is configured for production"""
    
    def test_site_url_env_var(self):
        """SITE_URL should be https://kingdom-soul.com"""
        site_url = os.environ.get('SITE_URL', '')
        
        assert site_url == 'https://kingdom-soul.com', \
            f"SITE_URL should be 'https://kingdom-soul.com', got '{site_url}'"
        
        print(f"✅ SITE_URL correctly set to: {site_url}")
    
    def test_site_url_not_preview(self):
        """SITE_URL should NOT be the preview URL"""
        site_url = os.environ.get('SITE_URL', '')
        
        assert 'preview.emergentagent.com' not in site_url, \
            f"SITE_URL should not contain preview URL, got '{site_url}'"
        
        print(f"✅ SITE_URL does not contain preview URL")


class TestGameFilesAccessibility:
    """Test all 4 game files are accessible via /api/content/games/"""
    
    GAME_FILES = [
        ("ie-grinch-bingo-game-pk.pdf", "application/pdf"),
        ("ie-grinch-bingo-card-pk.pdf", "application/pdf"),
        ("ie-passport-trek-game.pdf", "application/pdf"),
        ("map-journey-reference-index.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ]
    
    @pytest.mark.parametrize("filename,expected_content_type", GAME_FILES)
    def test_game_file_accessible(self, filename, expected_content_type):
        """Each game file should return HTTP 200"""
        response = requests.get(
            f"{BASE_URL}/api/content/games/{filename}",
            timeout=30,
            stream=True  # Don't download full file
        )
        
        # Status assertion
        assert response.status_code == 200, \
            f"Game file {filename} not accessible: {response.status_code}"
        
        # Content-Type assertion
        content_type = response.headers.get('Content-Type', '')
        assert expected_content_type in content_type or 'octet-stream' in content_type, \
            f"Unexpected content-type for {filename}: {content_type}"
        
        # Verify file has content
        content_length = response.headers.get('Content-Length', '0')
        assert int(content_length) > 0, f"File {filename} appears empty"
        
        print(f"✅ Game file accessible: {filename} ({content_length} bytes)")


class TestOrderSuccessPage:
    """Test order success page endpoint"""
    
    def test_order_lookup_endpoint(self):
        """GET /api/orders/{order_id} should handle fake order gracefully"""
        # Test with a fake order ID - should return 404 or empty
        response = requests.get(
            f"{BASE_URL}/api/orders/TEST-FAKE-ORDER",
            timeout=15
        )
        
        # Either 404 (not found) or 200 with empty/error response is acceptable
        assert response.status_code in [200, 404], \
            f"Unexpected status for fake order: {response.status_code}"
        
        print(f"✅ Order lookup endpoint responds correctly: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
