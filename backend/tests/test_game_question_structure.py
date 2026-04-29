"""
Test Game Question Structure - Iteration 22
Focus: Tricky Testaments (Jeopardy) vs Trivia Mix-Up (Millionaire) question formats

P0 Requirements:
1. trivia_testament (Jeopardy): Questions WITHOUT 'options' field - recall-based
2. tricky_trivia (Millionaire): Questions WITH 'options' field - MCQ format
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-durability.preview.emergentagent.com')

class TestGameQuestionStructure:
    """Test that backend correctly filters questions by game_type"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get admin token for full access tests
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "overflowharvest@gmail.com",
            "password": "Admin123!"
        })
        if login_resp.status_code == 200:
            self.admin_token = login_resp.json().get("access_token")
        else:
            self.admin_token = None
    
    def test_trivia_testament_no_options(self):
        """trivia_testament (Jeopardy) should return questions WITHOUT options field"""
        headers = {"Authorization": f"Bearer {self.admin_token}"} if self.admin_token else {}
        
        resp = self.session.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "trivia_testament", "age_group": "adult"},
            headers=headers
        )
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        questions = data.get("questions", [])
        assert len(questions) > 0, "Expected at least 1 question for trivia_testament"
        
        # CRITICAL: No question should have 'options' field for Jeopardy
        questions_with_options = [q for q in questions if q.get("options")]
        assert len(questions_with_options) == 0, f"Found {len(questions_with_options)} questions with options - Jeopardy should have NONE"
        
        # Verify questions have required fields for recall-based play
        for q in questions[:5]:  # Check first 5
            assert "question" in q, "Question missing 'question' field"
            assert "correct_answer" in q, "Question missing 'correct_answer' field"
            assert "options" not in q, f"Question {q.get('qid')} has options - should be stripped for Jeopardy"
        
        print(f"✓ trivia_testament: {len(questions)} questions, 0 with options (correct)")
    
    def test_tricky_trivia_has_options(self):
        """tricky_trivia (Millionaire) should return questions WITH options field"""
        headers = {"Authorization": f"Bearer {self.admin_token}"} if self.admin_token else {}
        
        resp = self.session.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "tricky_trivia", "age_group": "adult"},
            headers=headers
        )
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        questions = data.get("questions", [])
        assert len(questions) > 0, "Expected at least 1 question for tricky_trivia"
        
        # CRITICAL: ALL questions should have 'options' field for Millionaire
        questions_without_options = [q for q in questions if not q.get("options")]
        assert len(questions_without_options) == 0, f"Found {len(questions_without_options)} questions without options - Millionaire needs MCQ"
        
        # Verify options have at least 2 choices
        for q in questions[:5]:  # Check first 5
            assert "question" in q, "Question missing 'question' field"
            assert "correct_answer" in q, "Question missing 'correct_answer' field"
            assert "options" in q, f"Question {q.get('qid')} missing options - Millionaire needs MCQ"
            assert len(q["options"]) >= 2, f"Question {q.get('qid')} has only {len(q['options'])} options - need at least 2"
        
        print(f"✓ tricky_trivia: {len(questions)} questions, all with options (correct)")
    
    def test_demo_access_limited_questions(self):
        """Unauthenticated users should get limited demo questions"""
        # No auth header = demo access
        resp = self.session.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "trivia_testament", "age_group": "adult"}
        )
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert data.get("access_level") == "demo", f"Expected demo access, got {data.get('access_level')}"
        questions = data.get("questions", [])
        assert len(questions) <= 10, f"Demo should cap at 10 questions, got {len(questions)}"
        
        print(f"✓ Demo access: {len(questions)} questions, access_level={data.get('access_level')}")
    
    def test_admin_full_access(self):
        """Admin users should get full access to all questions"""
        if not self.admin_token:
            pytest.skip("Admin token not available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        resp = self.session.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "trivia_testament", "age_group": "adult"},
            headers=headers
        )
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert data.get("access_level") == "full", f"Expected full access, got {data.get('access_level')}"
        questions = data.get("questions", [])
        assert len(questions) > 10, f"Admin should get more than 10 questions, got {len(questions)}"
        
        unlocked = data.get("unlocked_series", [])
        assert "holiday_4c" in unlocked or "breakfast" in unlocked, f"Admin should have series unlocked: {unlocked}"
        
        print(f"✓ Admin access: {len(questions)} questions, access_level={data.get('access_level')}, series={unlocked}")


class TestTrickyTestamentSelfScoring:
    """Test that Tricky Testament game has self-scoring UI elements"""
    
    def test_game_endpoint_returns_questions(self):
        """Verify the game endpoint returns valid questions for Tricky Testament"""
        session = requests.Session()
        
        # Login as admin
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "overflowharvest@gmail.com",
            "password": "Admin123!"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not login as admin")
        
        token = login_resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = session.get(
            f"{BASE_URL}/api/trivia/questions/for-game",
            params={"game_type": "trivia_testament", "age_group": "adult"},
            headers=headers
        )
        
        assert resp.status_code == 200
        data = resp.json()
        
        questions = data.get("questions", [])
        assert len(questions) >= 10, f"Need at least 10 questions for Jeopardy board, got {len(questions)}"
        
        # Verify question structure for self-scoring
        for q in questions[:3]:
            assert "question" in q, "Missing question text"
            assert "correct_answer" in q, "Missing correct_answer for reveal"
            # Options should NOT be present for Jeopardy
            assert "options" not in q, "Jeopardy questions should not have options"
        
        print(f"✓ Tricky Testament questions ready: {len(questions)} questions, no MCQ options")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
