#!/usr/bin/env python3
"""
Frontend E2E Testing for Soul Food Authentication
Tests the beta login flow and redirection to snack-packs page
"""

import requests
import json
import sys
from typing import Dict, Any

# Frontend URL from .env
FRONTEND_URL = "https://soft-launch-preview.preview.emergentagent.com"
BACKEND_URL = "https://soft-launch-preview.preview.emergentagent.com/api"

class FrontendE2ETester:
    def __init__(self):
        self.frontend_url = FRONTEND_URL
        self.backend_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        
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
        
    def test_auth_page_accessibility(self):
        """Test that auth page is accessible"""
        try:
            response = self.session.get(f"{self.frontend_url}/auth")
            
            if response.status_code != 200:
                self.log_test("Auth Page Accessibility", False, f"Status code: {response.status_code}")
                return False
            
            # Check if page contains React app structure (since it's a SPA)
            content = response.text
            if '<div id="root"></div>' not in content or 'bundle.js' not in content:
                self.log_test("Auth Page Accessibility", False, "Missing React app structure")
                return False
            
            self.log_test("Auth Page Accessibility", True, "Auth page loads correctly with React app structure")
            return True
            
        except Exception as e:
            self.log_test("Auth Page Accessibility", False, f"Exception: {str(e)}")
            return False
    
    def test_snack_packs_page_accessibility(self):
        """Test that snack-packs page is accessible"""
        try:
            response = self.session.get(f"{self.frontend_url}/snack-packs")
            
            if response.status_code != 200:
                self.log_test("Snack Packs Page Accessibility", False, f"Status code: {response.status_code}")
                return False
            
            self.log_test("Snack Packs Page Accessibility", True, "Snack packs page is accessible")
            return True
            
        except Exception as e:
            self.log_test("Snack Packs Page Accessibility", False, f"Exception: {str(e)}")
            return False
    
    def test_beta_login_api_integration(self):
        """Test that beta login API works and returns proper session data"""
        try:
            # Test instructor beta login
            test_data = {
                "username": "instructor",
                "password": "test123"
            }
            
            response = self.session.post(
                f"{self.backend_url}/auth/beta-login",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Beta Login API Integration", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify session data that frontend would use
            if "access_token" not in data:
                self.log_test("Beta Login API Integration", False, "Missing access_token")
                return False
            
            if "user" not in data or "session_config" not in data:
                self.log_test("Beta Login API Integration", False, "Missing user or session_config")
                return False
            
            user = data["user"]
            session_config = data["session_config"]
            
            # Verify data frontend needs for redirection and display
            if user.get("access_level") != "instructor":
                self.log_test("Beta Login API Integration", False, f"Wrong access_level: {user.get('access_level')}")
                return False
            
            if "message" not in session_config:
                self.log_test("Beta Login API Integration", False, "Missing session message")
                return False
            
            self.log_test("Beta Login API Integration", True, "Beta login API returns proper session data for frontend")
            return True
            
        except Exception as e:
            self.log_test("Beta Login API Integration", False, f"Exception: {str(e)}")
            return False
    
    def test_interactive_lessons_api_access(self):
        """Test that interactive lessons API is accessible for authenticated users"""
        try:
            # First get a beta token
            login_data = {
                "username": "instructor",
                "password": "test123"
            }
            
            login_response = self.session.post(
                f"{self.backend_url}/auth/beta-login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if login_response.status_code != 200:
                self.log_test("Interactive Lessons API Access", False, "Failed to get beta token")
                return False
            
            token_data = login_response.json()
            access_token = token_data["access_token"]
            
            # Test accessing snack-packs API with token
            response = self.session.get(
                f"{self.backend_url}/interactive-lessons/snack-packs",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code != 200:
                self.log_test("Interactive Lessons API Access", False, f"Snack-packs API status: {response.status_code}")
                return False
            
            data = response.json()
            if "snack_packs" not in data:
                self.log_test("Interactive Lessons API Access", False, "Missing snack_packs in response")
                return False
            
            self.log_test("Interactive Lessons API Access", True, "Authenticated user can access interactive lessons API")
            return True
            
        except Exception as e:
            self.log_test("Interactive Lessons API Access", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all frontend E2E tests"""
        print("🧪 Starting Soul Food Frontend E2E Tests")
        print(f"🌐 Testing against: {self.frontend_url}")
        print("=" * 60)
        
        tests = [
            self.test_auth_page_accessibility,
            self.test_snack_packs_page_accessibility,
            self.test_beta_login_api_integration,
            self.test_interactive_lessons_api_access
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
                
        print("=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All Frontend E2E tests PASSED!")
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
    tester = FrontendE2ETester()
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