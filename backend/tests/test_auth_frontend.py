"""
Soul Food Auth Frontend Tests
Tests for authentication pages: Login, Registration, Beta Login, 2FA Setup, My Library
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-food-preview.preview.emergentagent.com')
TEST_PASSWORD = os.environ.get('TEST_PASSWORD', 'TestPass123!')

class TestBetaLogin:
    """Beta login endpoint tests"""
    
    def test_beta_login_instructor_success(self):
        """Test beta login with instructor credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/beta-login", json={
            "username": "instructor",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "instructor_tester"
        assert data["user"]["is_beta"] is True
        assert data["user"]["tfa_enabled"] is True
        assert data["session_config"]["message"] == "Beta access granted: Instructor Edition Access"
    
    def test_beta_login_invalid_username(self):
        """Test beta login with invalid username"""
        response = requests.post(f"{BASE_URL}/api/auth/beta-login", json={
            "username": "invalid_user",
            "password": "test123"
        })
        assert response.status_code == 401
    
    def test_beta_login_invalid_password(self):
        """Test beta login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/beta-login", json={
            "username": "instructor",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestUserRegistration:
    """User registration endpoint tests"""
    
    def test_registration_success(self):
        """Test successful user registration"""
        timestamp = str(int(time.time() * 1000))
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"test_reg_{timestamp}@example.com",
            "username": f"testreg{timestamp[-8:]}",
            "password": TEST_PASSWORD,
            "name": "Test Registration User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "member"
        assert data["user"]["tfa_enabled"] is False
        assert data["user"]["rewards_points"] == 0
    
    def test_registration_duplicate_email(self):
        """Test registration with duplicate email"""
        # First registration
        timestamp = str(int(time.time() * 1000))
        email = f"test_dup_{timestamp}@example.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "username": f"testdup{timestamp[-8:]}",
            "password": TEST_PASSWORD,
            "name": "Test User"
        })
        
        # Second registration with same email
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "username": f"testdup2{timestamp[-8:]}",
            "password": TEST_PASSWORD,
            "name": "Test User 2"
        })
        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()
    
    def test_registration_weak_password(self):
        """Test registration with weak password"""
        timestamp = str(int(time.time() * 1000))
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"test_weak_{timestamp}@example.com",
            "username": f"testweak{timestamp[-8:]}",
            "password": "weak",
            "name": "Test User"
        })
        assert response.status_code == 400


class TestUserLogin:
    """User login endpoint tests"""
    
    @pytest.fixture
    def test_user(self):
        """Create a test user for login tests"""
        timestamp = str(int(time.time() * 1000))
        email = f"test_login_{timestamp}@example.com"
        username = f"testlogin{timestamp[-8:]}"
        password = TEST_PASSWORD
        
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "username": username,
            "password": password,
            "name": "Test Login User"
        })
        
        return {"email": email, "username": username, "password": password}
    
    def test_login_with_email(self, test_user):
        """Test login with email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": test_user["email"],
            "password": test_user["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == test_user["email"]
    
    def test_login_with_username(self, test_user):
        """Test login with username"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": test_user["username"],
            "password": test_user["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestRewardsSystem:
    """Rewards system endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for rewards tests"""
        timestamp = str(int(time.time() * 1000))
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"test_rewards_{timestamp}@example.com",
            "username": f"testrewards{timestamp[-8:]}",
            "password": "TestPass123!",
            "name": "Test Rewards User"
        })
        return response.json().get("access_token")
    
    def test_rewards_balance(self, auth_token):
        """Test getting rewards balance"""
        response = requests.get(
            f"{BASE_URL}/api/auth/rewards/balance",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "points" in data
        assert "points_value" in data
        assert "available_rewards" in data
        assert data["earn_rate"] == "1 point per $10 spent"
    
    def test_rewards_balance_unauthorized(self):
        """Test rewards balance without auth"""
        response = requests.get(f"{BASE_URL}/api/auth/rewards/balance")
        assert response.status_code == 401


class TestAuthMe:
    """Current user endpoint tests"""
    
    def test_get_current_user(self):
        """Test getting current user with valid token"""
        # Register a new user first (regular users work with /me endpoint)
        timestamp = str(int(time.time() * 1000))
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"test_me_{timestamp}@example.com",
            "username": f"testme{timestamp[-8:]}",
            "password": "TestPass123!",
            "name": "Test Me User"
        })
        token = response.json().get("access_token")
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "role" in data
    
    def test_get_current_user_unauthorized(self):
        """Test getting current user without auth"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
