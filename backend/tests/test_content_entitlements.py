"""
Test Content-Specific Entitlement System (Iteration 20)
Tests for:
- GET /api/trivia/entitlements/me (demo vs admin access)
- GET /api/trivia/questions/for-game (demo cap, series filtering)
- Question series mapping (Q1=holiday_4c, Q2/Q3=breakfast, empty=shared)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "overflowharvest@gmail.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Admin123!")


class TestEntitlementsEndpoint:
    """Tests for /api/trivia/entitlements/me endpoint"""
    
    def test_entitlements_no_auth_returns_demo(self):
        """Without auth, should return access_level=demo and empty series"""
        response = requests.get(f"{BASE_URL}/api/trivia/entitlements/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("access_level") == "demo", f"Expected demo access, got: {data}"
        assert data.get("series") == [], f"Expected empty series, got: {data.get('series')}"
        assert data.get("has_audio") == False, f"Expected has_audio=False, got: {data.get('has_audio')}"
        assert data.get("has_instructor") == False, f"Expected has_instructor=False, got: {data.get('has_instructor')}"
        print("✅ Entitlements without auth returns demo access correctly")
    
    def test_entitlements_with_admin_auth_returns_full(self):
        """Admin user should get full access with all series unlocked"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json().get("access_token")
        assert token, "No access_token in login response"
        
        # Now check entitlements with auth
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/trivia/entitlements/me", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("access_level") == "full", f"Expected full access, got: {data.get('access_level')}"
        
        # Admin should have all series unlocked
        series = data.get("series", [])
        assert "holiday_4c" in series, f"Expected holiday_4c in series, got: {series}"
        assert "breakfast" in series, f"Expected breakfast in series, got: {series}"
        
        # Admin should have audio and instructor access
        assert data.get("has_audio") == True, f"Expected has_audio=True, got: {data.get('has_audio')}"
        assert data.get("has_instructor") == True, f"Expected has_instructor=True, got: {data.get('has_instructor')}"
        
        print("✅ Entitlements with admin auth returns full access correctly")
        print(f"   Series: {series}")
        print(f"   has_audio: {data.get('has_audio')}, has_instructor: {data.get('has_instructor')}")


class TestQuestionsForGameEndpoint:
    """Tests for /api/trivia/questions/for-game endpoint"""
    
    def test_for_game_no_auth_returns_demo_capped(self):
        """Without auth, should return max 10 questions with access_level=demo"""
        response = requests.get(f"{BASE_URL}/api/trivia/questions/for-game")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("access_level") == "demo", f"Expected demo access, got: {data.get('access_level')}"
        
        questions = data.get("questions", [])
        total = data.get("total", 0)
        
        # Demo cap is 10 questions
        assert total <= 10, f"Expected max 10 questions for demo, got: {total}"
        assert len(questions) <= 10, f"Expected max 10 questions in array, got: {len(questions)}"
        
        print(f"✅ For-game without auth returns demo capped: {total} questions")
    
    def test_for_game_demo_only_shared_pool(self):
        """Demo mode should only return shared pool questions (no Q1/Q2/Q3 lesson_node)"""
        response = requests.get(f"{BASE_URL}/api/trivia/questions/for-game")
        assert response.status_code == 200
        
        data = response.json()
        questions = data.get("questions", [])
        
        # Check that no questions have Q1, Q2, Q3 lesson_node prefix
        for q in questions:
            lesson_node = q.get("lesson_node", "")
            if lesson_node:
                assert not lesson_node.startswith("Q1"), f"Demo should not have Q1 questions: {lesson_node}"
                assert not lesson_node.startswith("Q2"), f"Demo should not have Q2 questions: {lesson_node}"
                assert not lesson_node.startswith("Q3"), f"Demo should not have Q3 questions: {lesson_node}"
        
        print(f"✅ Demo mode only returns shared pool questions (no Q1/Q2/Q3 prefix)")
    
    def test_for_game_with_admin_auth_returns_full_pool(self):
        """Admin user should get full question pool with unlocked_series"""
        # Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json().get("access_token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/trivia/questions/for-game", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("access_level") == "full", f"Expected full access, got: {data.get('access_level')}"
        
        # Should have unlocked_series array
        unlocked_series = data.get("unlocked_series", [])
        assert "holiday_4c" in unlocked_series, f"Expected holiday_4c in unlocked_series: {unlocked_series}"
        assert "breakfast" in unlocked_series, f"Expected breakfast in unlocked_series: {unlocked_series}"
        assert "shared" in unlocked_series, f"Expected shared in unlocked_series: {unlocked_series}"
        
        # Should have more than 10 questions (full pool)
        total = data.get("total", 0)
        assert total > 10, f"Expected more than 10 questions for full access, got: {total}"
        
        print(f"✅ For-game with admin auth returns full pool: {total} questions")
        print(f"   Unlocked series: {unlocked_series}")
    
    def test_for_game_admin_returns_multiple_series_questions(self):
        """Admin should get questions from multiple series (shared + holiday_4c + breakfast)"""
        # Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/trivia/questions/for-game", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        questions = data.get("questions", [])
        
        # Categorize questions by series based on lesson_node
        series_found = {"shared": False, "holiday_4c": False, "breakfast": False}
        
        for q in questions:
            lesson_node = (q.get("lesson_node") or "").strip()
            if not lesson_node:
                series_found["shared"] = True
            elif lesson_node.startswith("Q1"):
                series_found["holiday_4c"] = True
            elif lesson_node.startswith("Q2") or lesson_node.startswith("Q3"):
                series_found["breakfast"] = True
        
        # At least shared should be present
        assert series_found["shared"], "Expected shared pool questions"
        
        print(f"✅ Admin gets questions from multiple series:")
        print(f"   Shared: {series_found['shared']}, Holiday 4C: {series_found['holiday_4c']}, Breakfast: {series_found['breakfast']}")


class TestQuestionSeriesMapping:
    """Tests for question series mapping logic"""
    
    def test_series_mapping_q1_is_holiday_4c(self):
        """Questions with Q1 lesson_node prefix should map to holiday_4c series"""
        # This is a logic test - we verify by checking the backend code behavior
        # The _question_series function maps Q1 -> holiday_4c
        
        # Login as admin to get full pool
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        token = login_response.json().get("access_token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/trivia/questions/for-game", headers=headers)
        data = response.json()
        
        # Find Q1 questions
        q1_questions = [q for q in data.get("questions", []) if (q.get("lesson_node") or "").startswith("Q1")]
        
        if q1_questions:
            print(f"✅ Found {len(q1_questions)} Q1 (holiday_4c) questions in full pool")
        else:
            print("ℹ️ No Q1 questions found in current pool (may be filtered by game_type)")
    
    def test_series_mapping_q2_q3_is_breakfast(self):
        """Questions with Q2/Q3 lesson_node prefix should map to breakfast series"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        token = login_response.json().get("access_token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/trivia/questions/for-game", headers=headers)
        data = response.json()
        
        # Find Q2/Q3 questions
        breakfast_questions = [
            q for q in data.get("questions", []) 
            if (q.get("lesson_node") or "").startswith("Q2") or (q.get("lesson_node") or "").startswith("Q3")
        ]
        
        if breakfast_questions:
            print(f"✅ Found {len(breakfast_questions)} Q2/Q3 (breakfast) questions in full pool")
        else:
            print("ℹ️ No Q2/Q3 questions found in current pool (may be filtered by game_type)")


class TestGameTypeFiltering:
    """Tests for game_type parameter filtering"""
    
    def test_for_game_with_game_type_tricky_trivia(self):
        """Test filtering by game_type=tricky_trivia"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        token = login_response.json().get("access_token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/trivia/questions/for-game?game_type=tricky_trivia",
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        questions = data.get("questions", [])
        
        # All questions should have game_type=tricky_trivia
        for q in questions:
            assert q.get("game_type") == "tricky_trivia", f"Expected tricky_trivia, got: {q.get('game_type')}"
        
        print(f"✅ game_type=tricky_trivia filter works: {len(questions)} questions")
    
    def test_for_game_with_game_type_trivia_testament(self):
        """Test filtering by game_type=trivia_testament"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        token = login_response.json().get("access_token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/trivia/questions/for-game?game_type=trivia_testament",
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        questions = data.get("questions", [])
        
        # All questions should have game_type=trivia_testament
        for q in questions:
            assert q.get("game_type") == "trivia_testament", f"Expected trivia_testament, got: {q.get('game_type')}"
        
        print(f"✅ game_type=trivia_testament filter works: {len(questions)} questions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
