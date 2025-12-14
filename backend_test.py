#!/usr/bin/env python3
"""
Backend API Testing for Holiday AE Interactive Lessons System
Tests the new Holiday AE (Adult Edition) interactive lessons system
"""

import requests
import json
import sys
from typing import Dict, Any

# Backend URL from frontend/.env
BASE_URL = "https://interactive-lessons-2.preview.emergentagent.com/api/interactive-lessons"

class InteractiveLessonsAPITester:
    def __init__(self):
        self.base_url = BASE_URL
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
        
    def test_get_snack_packs(self):
        """Test GET /snack-packs endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/snack-packs")
            
            if response.status_code != 200:
                self.log_test("GET /snack-packs", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify response structure
            if "snack_packs" not in data:
                self.log_test("GET /snack-packs", False, "Missing 'snack_packs' key in response")
                return False
                
            snack_packs = data["snack_packs"]
            if not isinstance(snack_packs, list) or len(snack_packs) == 0:
                self.log_test("GET /snack-packs", False, "No snack packs returned")
                return False
                
            # Verify "In His Image" snack pack exists
            in_his_image_pack = None
            for pack in snack_packs:
                if pack.get("title") == "In His Image - Self Worth Series":
                    in_his_image_pack = pack
                    break
                    
            if not in_his_image_pack:
                self.log_test("GET /snack-packs", False, "In His Image snack pack not found")
                return False
                
            # Verify pack has 3 nibbles
            if in_his_image_pack.get("total_lessons") != 3:
                self.log_test("GET /snack-packs", False, f"Expected 3 lessons, got {in_his_image_pack.get('total_lessons')}")
                return False
                
            self.log_test("GET /snack-packs", True, "In His Image pack found with 3 lessons")
            return True
            
        except Exception as e:
            self.log_test("GET /snack-packs", False, f"Exception: {str(e)}")
            return False
            
    def test_get_nibbles(self):
        """Test GET /nibbles endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/nibbles")
            
            if response.status_code != 200:
                self.log_test("GET /nibbles", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify response structure
            if "nibbles" not in data:
                self.log_test("GET /nibbles", False, "Missing 'nibbles' key in response")
                return False
                
            nibbles = data["nibbles"]
            if not isinstance(nibbles, list):
                self.log_test("GET /nibbles", False, "Nibbles is not a list")
                return False
                
            # Verify we have 3 nibbles
            if len(nibbles) != 3:
                self.log_test("GET /nibbles", False, f"Expected 3 nibbles, got {len(nibbles)}")
                return False
                
            # Verify expected nibble IDs exist
            expected_ids = ["in-his-image-1", "in-his-image-2", "in-his-image-3"]
            actual_ids = [nibble.get("id") for nibble in nibbles]
            
            for expected_id in expected_ids:
                if expected_id not in actual_ids:
                    self.log_test("GET /nibbles", False, f"Missing nibble ID: {expected_id}")
                    return False
                    
            self.log_test("GET /nibbles", True, "All 3 expected nibbles found")
            return True
            
        except Exception as e:
            self.log_test("GET /nibbles", False, f"Exception: {str(e)}")
            return False
            
    def test_get_single_nibble(self):
        """Test GET /nibble/{nibble_id} endpoint"""
        try:
            nibble_id = "in-his-image-1"
            response = self.session.get(f"{self.base_url}/nibble/{nibble_id}")
            
            if response.status_code != 200:
                self.log_test("GET /nibble/{nibble_id}", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify response structure
            if "nibble" not in data:
                self.log_test("GET /nibble/{nibble_id}", False, "Missing 'nibble' key in response")
                return False
                
            nibble = data["nibble"]
            
            # Verify required fields
            required_fields = ["id", "title", "bites", "activity", "key_verse_text", 
                             "opening_prayer", "closing_prayer", "to_go_box"]
            
            for field in required_fields:
                if field not in nibble:
                    self.log_test("GET /nibble/{nibble_id}", False, f"Missing required field: {field}")
                    return False
                    
            # Verify nibble has correct ID and title
            if nibble["id"] != nibble_id:
                self.log_test("GET /nibble/{nibble_id}", False, f"Wrong nibble ID returned: {nibble['id']}")
                return False
                
            if nibble["title"] != "Made in His Image":
                self.log_test("GET /nibble/{nibble_id}", False, f"Wrong title: {nibble['title']}")
                return False
                
            # Verify bites array has 3 items
            if len(nibble["bites"]) != 3:
                self.log_test("GET /nibble/{nibble_id}", False, f"Expected 3 bites, got {len(nibble['bites'])}")
                return False
                
            # Verify activity has questions
            if "questions" not in nibble["activity"]:
                self.log_test("GET /nibble/{nibble_id}", False, "Activity missing questions")
                return False
                
            self.log_test("GET /nibble/{nibble_id}", True, "Nibble structure and content verified")
            return True
            
        except Exception as e:
            self.log_test("GET /nibble/{nibble_id}", False, f"Exception: {str(e)}")
            return False
            
    def test_check_answers(self):
        """Test POST /progress/check-answers endpoint"""
        try:
            test_data = {
                "nibble_id": "in-his-image-1",
                "answers": {
                    "a-1-1": "I need healing in my self-worth and confidence",
                    "a-1-2": "valuable and loved by God",
                    "a-1-3": "my relationship with God and others"
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
                
            self.log_test("POST /progress/check-answers", True, f"Received {len(results)} answer results")
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
        """Run all backend API tests"""
        print("🧪 Starting Interactive Lessons Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        tests = [
            self.test_get_snack_packs,
            self.test_get_nibbles,
            self.test_get_single_nibble,
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
            print("🎉 All backend API tests PASSED!")
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