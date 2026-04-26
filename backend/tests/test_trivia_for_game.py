"""
Test suite for /api/trivia/questions/for-game endpoint
Tests entitlement-based question access gating:
- Demo users (no auth) get max 10 questions
- Purchasers/admins get full question pool
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-checkout-stage.preview.emergentagent.com')

# Test credentials from test_credentials.md
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "overflowharvest@gmail.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Admin123!")


class TestTriviaForGameEndpoint:
    """Tests for /api/trivia/questions/for-game endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_demo_access_tricky_trivia_adult_no_auth(self):
        """Without auth, should return demo access with max 10 questions"""
        response = requests.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "tricky_trivia", "age_group": "adult"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["access_level"] == "demo"
        assert data["total"] <= 10
        assert "questions" in data
        assert len(data["questions"]) <= 10
    
    def test_demo_access_trivia_testament_youth_no_auth(self):
        """Without auth, trivia_testament youth should return demo access with max 10 questions"""
        response = requests.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "trivia_testament", "age_group": "youth"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["access_level"] == "demo"
        assert data["total"] <= 10
    
    def test_full_access_tricky_trivia_adult_with_auth(self, auth_token):
        """With auth (purchaser), should return full access with 79 questions"""
        response = requests.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "tricky_trivia", "age_group": "adult"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["access_level"] == "full"
        assert data["total"] == 79, f"Expected 79 questions, got {data['total']}"
        assert len(data["questions"]) == 79
    
    def test_full_access_trivia_testament_youth_with_auth(self, auth_token):
        """With auth (purchaser), trivia_testament youth should return 197 questions"""
        response = requests.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "trivia_testament", "age_group": "youth"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["access_level"] == "full"
        assert data["total"] == 197, f"Expected 197 questions, got {data['total']}"
    
    def test_questions_have_required_fields(self, auth_token):
        """Questions should have required fields for game play"""
        response = requests.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "tricky_trivia", "age_group": "adult"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check first question has required fields
        if data["questions"]:
            q = data["questions"][0]
            assert "question" in q
            assert "correct_answer" in q
            # Options may or may not be present depending on question type
    
    def test_invalid_token_returns_demo(self):
        """Invalid token should fall back to demo access"""
        response = requests.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "tricky_trivia", "age_group": "adult"},
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["access_level"] == "demo"
        assert data["total"] <= 10
    
    def test_no_filters_returns_questions(self):
        """Endpoint should work without game_type/age_group filters"""
        response = requests.get(f"{BASE_URL}/api/trivia/questions/for-game")
        assert response.status_code == 200
        data = response.json()
        
        assert "questions" in data
        assert "total" in data
        assert "access_level" in data


class TestTriviaQuestionBankStats:
    """Verify question bank has expected counts"""
    
    def test_bank_stats_endpoint(self):
        """Check overall question bank statistics"""
        response = requests.get(f"{BASE_URL}/api/trivia/bank/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Should have questions in the bank
        assert data["total_questions"] > 0
        assert "by_game_type" in data
        assert "by_age_group" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
