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
            
    def test_beta_login_invalid_username(self):
        """Test beta login with invalid username - should return actionable error"""
        try:
            test_data = {
                "username": "wronguser",
                "password": "test123"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/beta-login",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 401:
                self.log_test("Beta Login - Invalid Username", False, f"Expected 401, got {response.status_code}")
                return False
                
            data = response.json()
            error_message = data.get("detail", "")
            
            # Verify error message contains username and valid options
            expected_message = "Username 'wronguser' not found. Valid beta usernames: instructor, youth, adult, beta"
            if error_message != expected_message:
                self.log_test("Beta Login - Invalid Username", False, f"Wrong error message: {error_message}")
                return False
            
            self.log_test("Beta Login - Invalid Username", True, "Correct actionable error message for invalid username")
            return True
            
        except Exception as e:
            self.log_test("Beta Login - Invalid Username", False, f"Exception: {str(e)}")
            return False
            
    def test_beta_login_wrong_password(self):
        """Test beta login with wrong password - should return actionable error"""
        try:
            test_data = {
                "username": "instructor",
                "password": "wrongpassword"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/beta-login",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 401:
                self.log_test("Beta Login - Wrong Password", False, f"Expected 401, got {response.status_code}")
                return False
                
            data = response.json()
            error_message = data.get("detail", "")
            
            # Verify error message is actionable
            expected_message = "Incorrect password for 'instructor'. Please check your password and try again."
            if error_message != expected_message:
                self.log_test("Beta Login - Wrong Password", False, f"Wrong error message: {error_message}")
                return False
            
            self.log_test("Beta Login - Wrong Password", True, "Correct actionable error message for wrong password")
            return True
            
        except Exception as e:
            self.log_test("Beta Login - Wrong Password", False, f"Exception: {str(e)}")
            return False
            
    def test_nist_register_weak_password(self):
        """Test registration with weak password - should fail"""
        try:
            test_data = {
                "email": "testuser@example.com",
                "username": "testuser",
                "password": "weak",  # Too short, fails requirements
                "name": "Test User"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 400:
                self.log_test("NIST Register - Weak Password", False, f"Expected 400, got {response.status_code}")
                return False
                
            data = response.json()
            error_message = data.get("detail", "")
            
            # Should reject password that's too short
            if "Password must be at least 8 characters" not in error_message:
                self.log_test("NIST Register - Weak Password", False, f"Wrong error message: {error_message}")
                return False
            
            self.log_test("NIST Register - Weak Password", True, "Correctly rejected weak password")
            return True
            
        except Exception as e:
            self.log_test("NIST Register - Weak Password", False, f"Exception: {str(e)}")
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