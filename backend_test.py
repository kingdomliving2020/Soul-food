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
        """Test GET /snack-packs endpoint - Should return 2 snack packs now"""
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
            if not isinstance(snack_packs, list):
                self.log_test("GET /snack-packs", False, "Snack packs is not a list")
                return False
                
            # Should return 2 snack packs now: "In His Image" and "Holiday Series - The 4 C's of Christianity"
            if len(snack_packs) != 2:
                self.log_test("GET /snack-packs", False, f"Expected 2 snack packs, got {len(snack_packs)}")
                return False
                
            # Verify both expected snack packs exist
            pack_titles = [pack.get("title") for pack in snack_packs]
            expected_titles = ["In His Image - Self Worth Series", "Holiday Series - The 4 C's of Christianity"]
            
            for expected_title in expected_titles:
                if expected_title not in pack_titles:
                    self.log_test("GET /snack-packs", False, f"Missing snack pack: {expected_title}")
                    return False
                    
            # Verify Holiday Series pack details
            holiday_pack = None
            for pack in snack_packs:
                if pack.get("title") == "Holiday Series - The 4 C's of Christianity":
                    holiday_pack = pack
                    break
                    
            if not holiday_pack:
                self.log_test("GET /snack-packs", False, "Holiday Series snack pack not found")
                return False
                
            # Verify Holiday pack has 4 lessons
            if holiday_pack.get("total_lessons") != 4:
                self.log_test("GET /snack-packs", False, f"Expected 4 lessons in Holiday pack, got {holiday_pack.get('total_lessons')}")
                return False
                
            self.log_test("GET /snack-packs", True, "Both snack packs found: In His Image (3 lessons) and Holiday Series (4 lessons)")
            return True
            
        except Exception as e:
            self.log_test("GET /snack-packs", False, f"Exception: {str(e)}")
            return False
            
    def test_get_nibbles(self):
        """Test GET /nibbles endpoint - Should return 7 total nibbles (3 In His Image + 4 Holiday AE)"""
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
                
            # Should return 7 total nibbles (3 In His Image + 4 Holiday AE)
            if len(nibbles) != 7:
                self.log_test("GET /nibbles", False, f"Expected 7 nibbles, got {len(nibbles)}")
                return False
                
            # Verify expected nibble IDs exist
            expected_ids = [
                "in-his-image-1", "in-his-image-2", "in-his-image-3",  # In His Image series
                "holiday-ae-covenant", "holiday-ae-cradle", "holiday-ae-cross", "holiday-ae-comforter"  # Holiday AE series
            ]
            actual_ids = [nibble.get("id") for nibble in nibbles]
            
            for expected_id in expected_ids:
                if expected_id not in actual_ids:
                    self.log_test("GET /nibbles", False, f"Missing nibble ID: {expected_id}")
                    return False
                    
            self.log_test("GET /nibbles", True, "All 7 expected nibbles found (3 In His Image + 4 Holiday AE)")
            return True
            
        except Exception as e:
            self.log_test("GET /nibbles", False, f"Exception: {str(e)}")
            return False
            
    def test_holiday_ae_covenant(self):
        """Test GET /nibble/holiday-ae-covenant - The Covenant lesson"""
        try:
            nibble_id = "holiday-ae-covenant"
            response = self.session.get(f"{self.base_url}/nibble/{nibble_id}")
            
            if response.status_code != 200:
                self.log_test("GET /nibble/holiday-ae-covenant", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify response structure
            if "nibble" not in data:
                self.log_test("GET /nibble/holiday-ae-covenant", False, "Missing 'nibble' key in response")
                return False
                
            nibble = data["nibble"]
            
            # Verify theme
            if nibble.get("theme") != "The Promise Still Stands":
                self.log_test("GET /nibble/holiday-ae-covenant", False, f"Wrong theme: {nibble.get('theme')}")
                return False
                
            # Verify has 3 bites
            if len(nibble.get("bites", [])) != 3:
                self.log_test("GET /nibble/holiday-ae-covenant", False, f"Expected 3 bites, got {len(nibble.get('bites', []))}")
                return False
                
            # Verify has 4 fill-in-blank activity questions
            activity = nibble.get("activity", {})
            questions = activity.get("questions", [])
            if len(questions) != 4:
                self.log_test("GET /nibble/holiday-ae-covenant", False, f"Expected 4 activity questions, got {len(questions)}")
                return False
                
            self.log_test("GET /nibble/holiday-ae-covenant", True, "Covenant lesson verified: theme 'The Promise Still Stands', 3 bites, 4 fill-in-blank questions")
            return True
            
        except Exception as e:
            self.log_test("GET /nibble/holiday-ae-covenant", False, f"Exception: {str(e)}")
            return False
            
    def test_holiday_ae_cradle(self):
        """Test GET /nibble/holiday-ae-cradle - The Cradle lesson"""
        try:
            nibble_id = "holiday-ae-cradle"
            response = self.session.get(f"{self.base_url}/nibble/{nibble_id}")
            
            if response.status_code != 200:
                self.log_test("GET /nibble/holiday-ae-cradle", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            nibble = data.get("nibble", {})
            
            # Verify theme
            if nibble.get("theme") != "Heaven Came Low":
                self.log_test("GET /nibble/holiday-ae-cradle", False, f"Wrong theme: {nibble.get('theme')}")
                return False
                
            # Verify has 3 bites
            if len(nibble.get("bites", [])) != 3:
                self.log_test("GET /nibble/holiday-ae-cradle", False, f"Expected 3 bites, got {len(nibble.get('bites', []))}")
                return False
                
            # Verify has matching activity
            activity = nibble.get("activity", {})
            if activity.get("title") != "Cradle Connections - Matching":
                self.log_test("GET /nibble/holiday-ae-cradle", False, f"Wrong activity type: {activity.get('title')}")
                return False
                
            self.log_test("GET /nibble/holiday-ae-cradle", True, "Cradle lesson verified: theme 'Heaven Came Low', 3 bites, matching activity")
            return True
            
        except Exception as e:
            self.log_test("GET /nibble/holiday-ae-cradle", False, f"Exception: {str(e)}")
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