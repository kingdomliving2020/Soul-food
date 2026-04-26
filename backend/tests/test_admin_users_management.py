"""
Admin User Management API Tests
================================
Tests for:
- GET /api/admin/users - List registered users
- POST /api/admin/users - Create/invite new user
- PUT /api/admin/users/{user_id} - Update user role
- POST /api/admin/users/{user_id}/lock - Lock user account
- POST /api/admin/users/{user_id}/unlock - Unlock user account
- POST /api/admin/users/{user_id}/reset-password - Reset user password
"""

import pytest
import requests
import os
import secrets

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-checkout-stage.preview.emergentagent.com')

# Test credentials from test_credentials.md
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "overflowharvest@gmail.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Admin123!")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    token = data.get("access_token")
    assert token, f"No access_token in response: {data}"
    return token


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    """Headers with admin auth token"""
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


class TestGetUsersList:
    """Tests for GET /api/admin/users endpoint"""
    
    def test_get_users_requires_auth(self):
        """GET /api/admin/users returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_get_users_returns_list(self, auth_headers):
        """GET /api/admin/users returns users list with correct structure"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "items" in data, f"Response missing 'items': {data}"
        assert "total" in data, f"Response missing 'total': {data}"
        assert "roles" in data, f"Response missing 'roles': {data}"
        
        # Verify items is a list
        assert isinstance(data["items"], list), f"items should be a list: {type(data['items'])}"
        
        # Verify roles list contains expected roles
        expected_roles = ["admin", "instructor", "student", "adult"]
        for role in expected_roles:
            assert role in data["roles"], f"Missing role '{role}' in roles list: {data['roles']}"
    
    def test_get_users_has_user_fields(self, auth_headers):
        """GET /api/admin/users returns users with required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        if data["items"]:
            user = data["items"][0]
            # Check required fields
            assert "id" in user, f"User missing 'id': {user}"
            assert "email" in user, f"User missing 'email': {user}"
            # Role may be present or default to 'member'
            # Check that password_hash is NOT exposed
            assert "password_hash" not in user, f"password_hash should not be exposed: {user.keys()}"
    
    def test_get_users_filter_by_role(self, auth_headers):
        """GET /api/admin/users?role=admin filters by role"""
        response = requests.get(f"{BASE_URL}/api/admin/users?role=admin", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        # All returned users should have admin role
        for user in data["items"]:
            assert user.get("role") == "admin", f"User has wrong role: {user.get('role')}"
    
    def test_get_users_search(self, auth_headers):
        """GET /api/admin/users?search=overflow filters by search term"""
        response = requests.get(f"{BASE_URL}/api/admin/users?search=overflow", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        # Should find the admin user
        emails = [u.get("email", "") for u in data["items"]]
        assert any("overflow" in e.lower() for e in emails), f"Search should find overflow user: {emails}"


class TestCreateUser:
    """Tests for POST /api/admin/users endpoint"""
    
    def test_create_user_requires_auth(self):
        """POST /api/admin/users returns 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users",
            json={"email": "test@example.com", "name": "Test User", "role": "member"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_create_user_success(self, auth_headers):
        """POST /api/admin/users creates a new user and returns id + temp password"""
        unique_email = f"TEST_user_{secrets.token_hex(4)}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            json={
                "email": unique_email,
                "name": "Test User Created",
                "role": "member"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, f"Response missing 'id': {data}"
        assert "temporary_password" in data, f"Response missing 'temporary_password': {data}"
        assert data["temporary_password"] is not None, f"temporary_password should not be None when no password provided"
        
        # Verify user was created by fetching users list
        list_response = requests.get(
            f"{BASE_URL}/api/admin/users?search={unique_email}",
            headers=auth_headers
        )
        assert list_response.status_code == 200
        list_data = list_response.json()
        found = any(u.get("email") == unique_email.lower() for u in list_data["items"])
        assert found, f"Created user not found in list: {unique_email}"
    
    def test_create_user_with_password(self, auth_headers):
        """POST /api/admin/users with password does not return temp password"""
        unique_email = f"TEST_user_{secrets.token_hex(4)}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            json={
                "email": unique_email,
                "name": "Test User With Password",
                "role": "member",
                "password": "TestPassword123!"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, f"Response missing 'id': {data}"
        # When password is provided, temporary_password should be None
        assert data.get("temporary_password") is None, f"temporary_password should be None when password provided: {data}"
    
    def test_create_user_duplicate_email(self, auth_headers):
        """POST /api/admin/users with existing email returns 400"""
        # Try to create user with admin email
        response = requests.post(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            json={
                "email": ADMIN_EMAIL,
                "name": "Duplicate User",
                "role": "member"
            }
        )
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "already exists" in data.get("detail", "").lower(), f"Error should mention 'already exists': {data}"
    
    def test_create_user_with_role(self, auth_headers):
        """POST /api/admin/users creates user with specified role"""
        unique_email = f"TEST_instructor_{secrets.token_hex(4)}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            json={
                "email": unique_email,
                "name": "Test Instructor",
                "role": "instructor"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify role was set
        list_response = requests.get(
            f"{BASE_URL}/api/admin/users?search={unique_email}",
            headers=auth_headers
        )
        assert list_response.status_code == 200
        list_data = list_response.json()
        user = next((u for u in list_data["items"] if u.get("email") == unique_email.lower()), None)
        assert user is not None, f"Created user not found"
        assert user.get("role") == "instructor", f"User role should be 'instructor': {user.get('role')}"


class TestUpdateUserRole:
    """Tests for PUT /api/admin/users/{user_id} endpoint"""
    
    def test_update_user_requires_auth(self):
        """PUT /api/admin/users/{user_id} returns 401 without auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/users/fake-user-id",
            json={"role": "admin"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_update_user_role_success(self, auth_headers):
        """PUT /api/admin/users/{user_id} updates user role"""
        # First create a test user
        unique_email = f"TEST_rolechange_{secrets.token_hex(4)}@example.com"
        create_response = requests.post(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            json={"email": unique_email, "name": "Role Change Test", "role": "member"}
        )
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Update role to instructor
        update_response = requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            headers=auth_headers,
            json={"role": "instructor"}
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        # Verify role was updated
        list_response = requests.get(
            f"{BASE_URL}/api/admin/users?search={unique_email}",
            headers=auth_headers
        )
        assert list_response.status_code == 200
        list_data = list_response.json()
        user = next((u for u in list_data["items"] if u.get("email") == unique_email.lower()), None)
        assert user is not None, f"User not found after update"
        assert user.get("role") == "instructor", f"Role should be 'instructor' after update: {user.get('role')}"
    
    def test_update_nonexistent_user(self, auth_headers):
        """PUT /api/admin/users/{user_id} returns 404 for non-existent user"""
        response = requests.put(
            f"{BASE_URL}/api/admin/users/nonexistent-user-id-12345",
            headers=auth_headers,
            json={"role": "admin"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestLockUnlockUser:
    """Tests for lock/unlock user endpoints"""
    
    def test_lock_user_success(self, auth_headers):
        """POST /api/admin/users/{user_id}/lock locks user account"""
        # First create a test user
        unique_email = f"TEST_lock_{secrets.token_hex(4)}@example.com"
        create_response = requests.post(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            json={"email": unique_email, "name": "Lock Test", "role": "member"}
        )
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Lock the user
        lock_response = requests.post(
            f"{BASE_URL}/api/admin/users/{user_id}/lock",
            headers=auth_headers
        )
        assert lock_response.status_code == 200, f"Expected 200, got {lock_response.status_code}: {lock_response.text}"
        
        # Verify user is locked
        list_response = requests.get(
            f"{BASE_URL}/api/admin/users?search={unique_email}",
            headers=auth_headers
        )
        assert list_response.status_code == 200
        list_data = list_response.json()
        user = next((u for u in list_data["items"] if u.get("email") == unique_email.lower()), None)
        assert user is not None
        assert user.get("disabled") == True, f"User should be disabled after lock: {user.get('disabled')}"
    
    def test_unlock_user_success(self, auth_headers):
        """POST /api/admin/users/{user_id}/unlock unlocks user account"""
        # First create and lock a test user
        unique_email = f"TEST_unlock_{secrets.token_hex(4)}@example.com"
        create_response = requests.post(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            json={"email": unique_email, "name": "Unlock Test", "role": "member"}
        )
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Lock the user first
        requests.post(f"{BASE_URL}/api/admin/users/{user_id}/lock", headers=auth_headers)
        
        # Unlock the user
        unlock_response = requests.post(
            f"{BASE_URL}/api/admin/users/{user_id}/unlock",
            headers=auth_headers
        )
        assert unlock_response.status_code == 200, f"Expected 200, got {unlock_response.status_code}: {unlock_response.text}"
        
        # Verify user is unlocked
        list_response = requests.get(
            f"{BASE_URL}/api/admin/users?search={unique_email}",
            headers=auth_headers
        )
        assert list_response.status_code == 200
        list_data = list_response.json()
        user = next((u for u in list_data["items"] if u.get("email") == unique_email.lower()), None)
        assert user is not None
        assert user.get("disabled") == False, f"User should not be disabled after unlock: {user.get('disabled')}"


class TestResetPassword:
    """Tests for POST /api/admin/users/{user_id}/reset-password endpoint"""
    
    def test_reset_password_success(self, auth_headers):
        """POST /api/admin/users/{user_id}/reset-password returns temp password"""
        # First create a test user
        unique_email = f"TEST_reset_{secrets.token_hex(4)}@example.com"
        create_response = requests.post(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            json={"email": unique_email, "name": "Reset Test", "role": "member"}
        )
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Reset password
        reset_response = requests.post(
            f"{BASE_URL}/api/admin/users/{user_id}/reset-password",
            headers=auth_headers
        )
        assert reset_response.status_code == 200, f"Expected 200, got {reset_response.status_code}: {reset_response.text}"
        
        data = reset_response.json()
        assert "temporary_password" in data, f"Response missing 'temporary_password': {data}"
        assert data["temporary_password"] is not None, f"temporary_password should not be None"
        assert len(data["temporary_password"]) > 8, f"temporary_password should be reasonably long"
    
    def test_reset_password_nonexistent_user(self, auth_headers):
        """POST /api/admin/users/{user_id}/reset-password returns 404 for non-existent user"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/nonexistent-user-id-12345/reset-password",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
