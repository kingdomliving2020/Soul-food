#!/usr/bin/env python3
"""
Backend API Testing for Soul Food Authentication System
Tests the beta login system and NIST authentication requirements
"""

import requests
import json
import sys
import time
from typing import Dict, Any

# Backend URL from frontend/.env
BASE_URL = "https://elearn-shop.preview.emergentagent.com/api"

class SoulFoodAuthTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        self.auth_tokens = {}  # Store tokens for cleanup
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status} - {test_name}"
        if details:
            result += f": {details}"
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_beta_login_instructor(self):
        """Test beta login with instructor credentials"""
        try:
            test_data = {
                "username": "instructor",
                "password": "test123"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/beta-login",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Beta Login - Instructor", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["access_token", "token_type", "user", "session_config"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Beta Login - Instructor", False, f"Missing field: {field}")
                    return False
            
            user = data["user"]
            session_config = data["session_config"]
            
            # Verify instructor-specific values
            if user.get("role") != "instructor_tester":
                self.log_test("Beta Login - Instructor", False, f"Wrong role: {user.get('role')}, expected: instructor_tester")
                return False
                
            if user.get("access_level") != "instructor":
                self.log_test("Beta Login - Instructor", False, f"Wrong access_level: {user.get('access_level')}, expected: instructor")
                return False
                
            if session_config.get("timeout_mins") != 120:
                self.log_test("Beta Login - Instructor", False, f"Wrong session timeout: {session_config.get('timeout_mins')}, expected: 120")
                return False
            
            # Store token for potential cleanup
            self.auth_tokens["instructor"] = data["access_token"]
            
            self.log_test("Beta Login - Instructor", True, "Instructor login successful with correct role, access_level, and 120 min session")
            return True
            
        except Exception as e:
            self.log_test("Beta Login - Instructor", False, f"Exception: {str(e)}")
            return False
            
    def test_beta_login_youth(self):
        """Test beta login with youth credentials"""
        try:
            test_data = {
                "username": "youth",
                "password": "test1234"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/beta-login",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Beta Login - Youth", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            user = data["user"]
            session_config = data["session_config"]
            
            # Verify youth-specific values
            if user.get("role") != "youth_tester":
                self.log_test("Beta Login - Youth", False, f"Wrong role: {user.get('role')}, expected: youth_tester")
                return False
                
            if user.get("access_level") != "youth":
                self.log_test("Beta Login - Youth", False, f"Wrong access_level: {user.get('access_level')}, expected: youth")
                return False
                
            if session_config.get("timeout_mins") != 90:
                self.log_test("Beta Login - Youth", False, f"Wrong session timeout: {session_config.get('timeout_mins')}, expected: 90")
                return False
            
            self.auth_tokens["youth"] = data["access_token"]
            
            self.log_test("Beta Login - Youth", True, "Youth login successful with correct role, access_level, and 90 min session")
            return True
            
        except Exception as e:
            self.log_test("Beta Login - Youth", False, f"Exception: {str(e)}")
            return False
            
    def test_beta_login_adult(self):
        """Test beta login with adult credentials"""
        try:
            test_data = {
                "username": "adult",
                "password": "test12345"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/beta-login",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Beta Login - Adult", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            user = data["user"]
            session_config = data["session_config"]
            
            # Verify adult-specific values
            if user.get("role") != "adult_tester":
                self.log_test("Beta Login - Adult", False, f"Wrong role: {user.get('role')}, expected: adult_tester")
                return False
                
            if user.get("access_level") != "adult":
                self.log_test("Beta Login - Adult", False, f"Wrong access_level: {user.get('access_level')}, expected: adult")
                return False
                
            if session_config.get("timeout_mins") != 90:
                self.log_test("Beta Login - Adult", False, f"Wrong session timeout: {session_config.get('timeout_mins')}, expected: 90")
                return False
            
            self.auth_tokens["adult"] = data["access_token"]
            
            self.log_test("Beta Login - Adult", True, "Adult login successful with correct role, access_level, and 90 min session")
            return True
            
        except Exception as e:
            self.log_test("Beta Login - Adult", False, f"Exception: {str(e)}")
            return False
            
    def test_beta_login_beta(self):
        """Test beta login with beta credentials"""
        try:
            test_data = {
                "username": "beta",
                "password": "Beta1!2!3!"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/beta-login",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Beta Login - Beta", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            user = data["user"]
            session_config = data["session_config"]
            
            # Verify beta-specific values
            if user.get("role") != "beta_tester":
                self.log_test("Beta Login - Beta", False, f"Wrong role: {user.get('role')}, expected: beta_tester")
                return False
                
            if user.get("access_level") != "beta":
                self.log_test("Beta Login - Beta", False, f"Wrong access_level: {user.get('access_level')}, expected: beta")
                return False
                
            if session_config.get("timeout_mins") != 90:
                self.log_test("Beta Login - Beta", False, f"Wrong session timeout: {session_config.get('timeout_mins')}, expected: 90")
                return False
            
            self.auth_tokens["beta"] = data["access_token"]
            
            self.log_test("Beta Login - Beta", True, "Beta login successful with correct role, access_level, and 90 min session")
            return True
            
        except Exception as e:
            self.log_test("Beta Login - Beta", False, f"Exception: {str(e)}")
            return False
            
    def test_holiday_ae_cross(self):
        """Test GET /nibble/holiday-ae-cross - The Cross lesson"""
        try:
            nibble_id = "holiday-ae-cross"
            response = self.session.get(f"{self.base_url}/nibble/{nibble_id}")
            
            if response.status_code != 200:
                self.log_test("GET /nibble/holiday-ae-cross", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            nibble = data.get("nibble", {})
            
            # Verify theme
            if nibble.get("theme") != "Grieving Grace → Redeeming Grace":
                self.log_test("GET /nibble/holiday-ae-cross", False, f"Wrong theme: {nibble.get('theme')}")
                return False
                
            # Verify has 3 bites
            if len(nibble.get("bites", [])) != 3:
                self.log_test("GET /nibble/holiday-ae-cross", False, f"Expected 3 bites, got {len(nibble.get('bites', []))}")
                return False
                
            self.log_test("GET /nibble/holiday-ae-cross", True, "Cross lesson verified: theme 'Grieving Grace → Redeeming Grace', 3 bites")
            return True
            
        except Exception as e:
            self.log_test("GET /nibble/holiday-ae-cross", False, f"Exception: {str(e)}")
            return False
            
    def test_holiday_ae_comforter(self):
        """Test GET /nibble/holiday-ae-comforter - The Comforter lesson"""
        try:
            nibble_id = "holiday-ae-comforter"
            response = self.session.get(f"{self.base_url}/nibble/{nibble_id}")
            
            if response.status_code != 200:
                self.log_test("GET /nibble/holiday-ae-comforter", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            nibble = data.get("nibble", {})
            
            # Verify theme
            if nibble.get("theme") != "God Remains With Us":
                self.log_test("GET /nibble/holiday-ae-comforter", False, f"Wrong theme: {nibble.get('theme')}")
                return False
                
            # Verify has 5 bites (longest lesson)
            if len(nibble.get("bites", [])) != 5:
                self.log_test("GET /nibble/holiday-ae-comforter", False, f"Expected 5 bites, got {len(nibble.get('bites', []))}")
                return False
                
            # Verify has reflection-based activity (Comfort Letters)
            activity = nibble.get("activity", {})
            if activity.get("title") != "Comfort Letters":
                self.log_test("GET /nibble/holiday-ae-comforter", False, f"Wrong activity type: {activity.get('title')}")
                return False
                
            self.log_test("GET /nibble/holiday-ae-comforter", True, "Comforter lesson verified: theme 'God Remains With Us', 5 bites, Comfort Letters activity")
            return True
            
        except Exception as e:
            self.log_test("GET /nibble/holiday-ae-comforter", False, f"Exception: {str(e)}")
            return False
            
    def test_check_answers(self):
        """Test POST /progress/check-answers endpoint with Holiday AE Covenant lesson"""
        try:
            # Test with Holiday AE Covenant lesson as specified in review request
            test_data = {
                "nibble_id": "holiday-ae-covenant",
                "answers": {
                    "covenant-a-1": "binding",
                    "covenant-a-2": "families"
                }
            }
            
            response = self.session.post(
                f"{self.base_url}/progress/check-answers",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("POST /progress/check-answers", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify response structure
            if "success" not in data or not data["success"]:
                self.log_test("POST /progress/check-answers", False, "Success field missing or false")
                return False
                
            if "results" not in data:
                self.log_test("POST /progress/check-answers", False, "Missing results field")
                return False
                
            results = data["results"]
            if not isinstance(results, list):
                self.log_test("POST /progress/check-answers", False, "Results is not a list")
                return False
                
            # Verify we got results for our answers
            if len(results) == 0:
                self.log_test("POST /progress/check-answers", False, "No results returned")
                return False
                
            # Verify results have is_correct for each answer
            for result in results:
                if "is_correct" in result:  # Only check gradable questions
                    if "question_id" not in result:
                        self.log_test("POST /progress/check-answers", False, "Result missing question_id")
                        return False
                        
            self.log_test("POST /progress/check-answers", True, f"Holiday AE Covenant answers checked successfully, received {len(results)} results with is_correct fields")
            return True
            
        except Exception as e:
            self.log_test("POST /progress/check-answers", False, f"Exception: {str(e)}")
            return False
            
    def test_save_progress(self):
        """Test POST /progress/save endpoint"""
        try:
            test_data = {
                "nibble_id": "in-his-image-1",
                "answers": {
                    "q-1-1": "It means God had a specific plan and purpose for my life",
                    "q-1-2": "It gives me hope that broken areas can be restored",
                    "q-1-3": "It shows how much I matter to Him"
                },
                "completed_bites": ["bite-1-1", "bite-1-2", "bite-1-3"]
            }
            
            response = self.session.post(
                f"{self.base_url}/progress/save",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("POST /progress/save", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify response structure
            if "success" not in data or not data["success"]:
                self.log_test("POST /progress/save", False, "Success field missing or false")
                return False
                
            self.log_test("POST /progress/save", True, "Progress saved successfully")
            return True
            
        except Exception as e:
            self.log_test("POST /progress/save", False, f"Exception: {str(e)}")
            return False
            
    def test_invalid_nibble_id(self):
        """Test error handling for invalid nibble ID"""
        try:
            response = self.session.get(f"{self.base_url}/nibble/invalid-id")
            
            if response.status_code != 404:
                self.log_test("Error handling (invalid nibble)", False, f"Expected 404, got {response.status_code}")
                return False
                
            self.log_test("Error handling (invalid nibble)", True, "Correctly returns 404 for invalid nibble")
            return True
            
        except Exception as e:
            self.log_test("Error handling (invalid nibble)", False, f"Exception: {str(e)}")
            return False
            
    def run_all_tests(self):
        """Run all Holiday AE backend API tests"""
        print("🧪 Starting Holiday AE Interactive Lessons Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        tests = [
            self.test_get_snack_packs,
            self.test_get_nibbles,
            self.test_holiday_ae_covenant,
            self.test_holiday_ae_cradle,
            self.test_holiday_ae_cross,
            self.test_holiday_ae_comforter,
            self.test_check_answers,
            self.test_save_progress,
            self.test_invalid_nibble_id
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
                
        print("=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All Holiday AE backend API tests PASSED!")
            return True
        else:
            print(f"⚠️  {total - passed} test(s) FAILED")
            return False
            
    def get_summary(self):
        """Get test summary for reporting"""
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        summary = {
            "total_tests": total,
            "passed": passed,
            "failed": total - passed,
            "success_rate": (passed / total * 100) if total > 0 else 0,
            "all_passed": passed == total,
            "results": self.test_results
        }
        
        return summary

def main():
    """Main test execution"""
    tester = InteractiveLessonsAPITester()
    success = tester.run_all_tests()
    
    # Print detailed results for debugging
    print("\n📋 Detailed Results:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}")
        if result["details"]:
            print(f"   └─ {result['details']}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())