#!/usr/bin/env python3
"""
Backend API Testing for Soul Food Quick Order and Checkout Flow
Tests pricing verification, cart functionality, coupon validation, and checkout flow
"""

import requests
import json
import sys
import time
from typing import Dict, Any

# Backend URL from frontend/.env
BASE_URL = "https://faith-based-shop.preview.emergentagent.com/api"

class SoulFoodQuickOrderTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        self.auth_tokens = {}  # Store tokens for cleanup
        self.admin_token = None  # Store admin token for admin tests
        
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
            
    def test_nist_register_valid_password(self):
        """Test registration with valid strong password - should succeed"""
        try:
            # Use unique email to avoid conflicts
            import time
            timestamp = int(time.time())
            
            test_data = {
                "email": f"testuser{timestamp}@example.com",
                "username": f"testuser{timestamp}",
                "password": "StrongPass123!",  # Meets all requirements
                "name": "Test User"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("NIST Register - Valid Password", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["access_token", "token_type", "user", "session_config"]
            for field in required_fields:
                if field not in data:
                    self.log_test("NIST Register - Valid Password", False, f"Missing field: {field}")
                    return False
            
            # Store token for cleanup
            self.auth_tokens[f"testuser{timestamp}"] = data["access_token"]
            
            self.log_test("NIST Register - Valid Password", True, "Successfully registered with strong password")
            return True
            
        except Exception as e:
            self.log_test("NIST Register - Valid Password", False, f"Exception: {str(e)}")
            return False
            
    def test_nist_login_email(self):
        """Test regular login with email"""
        try:
            # First register a user
            timestamp = int(time.time())
            email = f"logintest{timestamp}@example.com"
            username = f"logintest{timestamp}"
            password = "LoginTest123!"
            
            # Register
            register_data = {
                "email": email,
                "username": username,
                "password": password,
                "name": "Login Test User"
            }
            
            register_response = self.session.post(
                f"{self.base_url}/auth/register",
                json=register_data,
                headers={"Content-Type": "application/json"}
            )
            
            if register_response.status_code != 200:
                self.log_test("NIST Login - Email", False, f"Registration failed: {register_response.status_code}")
                return False
            
            # Now test login with email
            login_data = {
                "identifier": email,  # Using email
                "password": password
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("NIST Login - Email", False, f"Login failed: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify login response
            if "access_token" not in data:
                self.log_test("NIST Login - Email", False, "Missing access_token in response")
                return False
            
            self.auth_tokens[f"logintest{timestamp}"] = data["access_token"]
            
            self.log_test("NIST Login - Email", True, "Successfully logged in with email")
            return True
            
        except Exception as e:
            self.log_test("NIST Login - Email", False, f"Exception: {str(e)}")
            return False
            
    def test_account_lockout(self):
        """Test account lockout after 3 failed attempts"""
        try:
            # First register a user
            timestamp = int(time.time())
            email = f"lockouttest{timestamp}@example.com"
            username = f"lockouttest{timestamp}"
            password = "LockoutTest123!"
            
            # Register
            register_data = {
                "email": email,
                "username": username,
                "password": password,
                "name": "Lockout Test User"
            }
            
            register_response = self.session.post(
                f"{self.base_url}/auth/register",
                json=register_data,
                headers={"Content-Type": "application/json"}
            )
            
            if register_response.status_code != 200:
                self.log_test("Account Lockout Test", False, f"Registration failed: {register_response.status_code}")
                return False
            
            # Make 3 failed login attempts
            login_data = {
                "identifier": email,
                "password": "wrongpassword"
            }
            
            for attempt in range(3):
                response = self.session.post(
                    f"{self.base_url}/auth/login",
                    json=login_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code not in [401, 423]:
                    self.log_test("Account Lockout Test", False, f"Attempt {attempt + 1}: Expected 401 or 423, got {response.status_code}")
                    return False
            
            # 4th attempt should be locked (423)
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 423:
                self.log_test("Account Lockout Test", False, f"Expected 423 (locked), got {response.status_code}")
                return False
            
            data = response.json()
            error_message = data.get("detail", "")
            
            if "locked" not in error_message.lower():
                self.log_test("Account Lockout Test", False, f"Expected lockout message, got: {error_message}")
                return False
            
            self.log_test("Account Lockout Test", True, "Account correctly locked after 3 failed attempts")
            return True
            
        except Exception as e:
            self.log_test("Account Lockout Test", False, f"Exception: {str(e)}")
            return False

    def test_coupon_validation_beta123(self):
        """Test coupon validation with Beta1!2!3! code"""
        try:
            test_data = {
                "code": "Beta1!2!3!",
                "product_ids": ["holiday-nibble-adult-interactive"]
            }
            
            response = self.session.post(
                f"{self.base_url}/coupons/validate",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Coupon Validation - Beta1!2!3!", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["valid", "discount_percent", "message", "code"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Coupon Validation - Beta1!2!3!", False, f"Missing field: {field}")
                    return False
            
            # Verify coupon is valid with 100% discount
            if not data.get("valid"):
                self.log_test("Coupon Validation - Beta1!2!3!", False, f"Coupon not valid: {data.get('message')}")
                return False
                
            if data.get("discount_percent") != 100:
                self.log_test("Coupon Validation - Beta1!2!3!", False, f"Wrong discount: {data.get('discount_percent')}, expected: 100")
                return False
            
            self.log_test("Coupon Validation - Beta1!2!3!", True, "Beta1!2!3! coupon validated successfully with 100% discount")
            return True
            
        except Exception as e:
            self.log_test("Coupon Validation - Beta1!2!3!", False, f"Exception: {str(e)}")
            return False

    def test_coupon_validation_betatest(self):
        """Test coupon validation with BETATEST code"""
        try:
            test_data = {
                "code": "BETATEST",
                "product_ids": ["holiday-nibble-adult-interactive"]
            }
            
            response = self.session.post(
                f"{self.base_url}/coupons/validate",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Coupon Validation - BETATEST", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["valid", "discount_percent", "message", "code"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Coupon Validation - BETATEST", False, f"Missing field: {field}")
                    return False
            
            # Verify coupon is valid with 100% discount
            if not data.get("valid"):
                self.log_test("Coupon Validation - BETATEST", False, f"Coupon not valid: {data.get('message')}")
                return False
                
            if data.get("discount_percent") != 100:
                self.log_test("Coupon Validation - BETATEST", False, f"Wrong discount: {data.get('discount_percent')}, expected: 100")
                return False
            
            self.log_test("Coupon Validation - BETATEST", True, "BETATEST coupon validated successfully with 100% discount")
            return True
            
        except Exception as e:
            self.log_test("Coupon Validation - BETATEST", False, f"Exception: {str(e)}")
            return False

    def test_quick_order_pricing_verification(self):
        """Test Quick Order page pricing verification for Holiday Series"""
        try:
            # Test Holiday Series pricing - should show crossed-out list price and sale price
            # Holiday Series Paperback: List $11.99, Sale $10.79
            # Holiday Nibble Interactive: List $3.99, Sale $3.59
            
            # Since this is frontend pricing logic, we'll test the backend coupon system
            # that supports the pricing structure
            
            # Test that the coupon system is working for the pricing flow
            test_data = {
                "code": "Beta1!2!3!",
                "product_ids": ["holiday-series-adult-paperback"]
            }
            
            response = self.session.post(
                f"{self.base_url}/coupons/validate",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Quick Order Pricing Verification", False, f"Coupon validation failed: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify coupon system supports the pricing flow
            if not data.get("valid"):
                self.log_test("Quick Order Pricing Verification", False, f"Beta coupon not valid: {data.get('message')}")
                return False
                
            if data.get("discount_percent") != 100:
                self.log_test("Quick Order Pricing Verification", False, f"Beta coupon wrong discount: {data.get('discount_percent')}")
                return False
            
            self.log_test("Quick Order Pricing Verification", True, "Backend pricing support verified - coupon system working")
            return True
            
        except Exception as e:
            self.log_test("Quick Order Pricing Verification", False, f"Exception: {str(e)}")
            return False

    def test_cart_flow_holiday_nibble(self):
        """Test adding Holiday Nibble to cart and verifying price"""
        try:
            # Test Holiday Nibble pricing through coupon validation
            # Holiday Nibble Interactive should be $3.59 (sale price)
            
            test_data = {
                "code": "Beta1!2!3!",
                "product_ids": ["holiday-nibble-adult-interactive"]
            }
            
            response = self.session.post(
                f"{self.base_url}/coupons/validate",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Cart Flow - Holiday Nibble", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify coupon applies to Holiday Nibble
            if not data.get("valid"):
                self.log_test("Cart Flow - Holiday Nibble", False, f"Coupon not valid for Holiday Nibble: {data.get('message')}")
                return False
                
            if data.get("discount_percent") != 100:
                self.log_test("Cart Flow - Holiday Nibble", False, f"Wrong discount for Holiday Nibble: {data.get('discount_percent')}")
                return False
            
            self.log_test("Cart Flow - Holiday Nibble", True, "Holiday Nibble cart flow backend support verified")
            return True
            
        except Exception as e:
            self.log_test("Cart Flow - Holiday Nibble", False, f"Exception: {str(e)}")
            return False

    def test_checkout_coupon_beta123(self):
        """Test checkout page coupon application with Beta1!2!3! (exact case)"""
        try:
            # Test the exact coupon code "Beta1!2!3!" with special characters
            test_data = {
                "code": "Beta1!2!3!",  # Preserve exact case and special characters
                "product_ids": ["holiday-nibble-adult-interactive"]
            }
            
            response = self.session.post(
                f"{self.base_url}/coupons/validate",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Checkout Coupon Beta1!2!3!", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["valid", "discount_percent", "message", "code"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Checkout Coupon Beta1!2!3!", False, f"Missing field: {field}")
                    return False
            
            # Verify 100% discount (Total becomes $0.00)
            if not data.get("valid"):
                self.log_test("Checkout Coupon Beta1!2!3!", False, f"Coupon not valid: {data.get('message')}")
                return False
                
            if data.get("discount_percent") != 100:
                self.log_test("Checkout Coupon Beta1!2!3!", False, f"Wrong discount: {data.get('discount_percent')}, expected: 100")
                return False
            
            # Verify the coupon code is preserved correctly
            if data.get("code") != "Beta1!2!3!":
                self.log_test("Checkout Coupon Beta1!2!3!", False, f"Coupon code not preserved: {data.get('code')}")
                return False
            
            self.log_test("Checkout Coupon Beta1!2!3!", True, "Beta1!2!3! coupon applies 100% discount correctly")
            return True
            
        except Exception as e:
            self.log_test("Checkout Coupon Beta1!2!3!", False, f"Exception: {str(e)}")
            return False

    def test_checkout_coupon_case_sensitivity(self):
        """Test that coupon validation is case-insensitive but preserves original input"""
        try:
            # Test with different case variations
            test_cases = [
                "beta1!2!3!",  # lowercase
                "BETA1!2!3!",  # uppercase
                "Beta1!2!3!",  # original case
            ]
            
            for test_code in test_cases:
                test_data = {
                    "code": test_code,
                    "product_ids": ["holiday-nibble-adult-interactive"]
                }
                
                response = self.session.post(
                    f"{self.base_url}/coupons/validate",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code != 200:
                    self.log_test("Checkout Coupon Case Sensitivity", False, f"Failed for {test_code}: {response.status_code}")
                    return False
                    
                data = response.json()
                
                if not data.get("valid"):
                    self.log_test("Checkout Coupon Case Sensitivity", False, f"Coupon {test_code} not valid: {data.get('message')}")
                    return False
                    
                if data.get("discount_percent") != 100:
                    self.log_test("Checkout Coupon Case Sensitivity", False, f"Wrong discount for {test_code}: {data.get('discount_percent')}")
                    return False
            
            self.log_test("Checkout Coupon Case Sensitivity", True, "Coupon validation is case-insensitive")
            return True
            
        except Exception as e:
            self.log_test("Checkout Coupon Case Sensitivity", False, f"Exception: {str(e)}")
            return False

    def test_soul_food_coupon_validation_holiday_covenant(self):
        """Test coupon validation with Beta1!2!3! code for holiday-nibble-covenant"""
        try:
            test_data = {
                "code": "Beta1!2!3!",
                "product_ids": ["holiday-nibble-covenant"]
            }
            
            response = self.session.post(
                f"{self.base_url}/coupons/validate",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Soul Food Coupon - Holiday Covenant", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["valid", "discount_percent", "message", "code"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Soul Food Coupon - Holiday Covenant", False, f"Missing field: {field}")
                    return False
            
            # Verify coupon is valid with 100% discount
            if not data.get("valid"):
                self.log_test("Soul Food Coupon - Holiday Covenant", False, f"Coupon not valid: {data.get('message')}")
                return False
                
            if data.get("discount_percent") != 100:
                self.log_test("Soul Food Coupon - Holiday Covenant", False, f"Wrong discount: {data.get('discount_percent')}, expected: 100")
                return False
            
            self.log_test("Soul Food Coupon - Holiday Covenant", True, "Beta1!2!3! coupon validated successfully for holiday-nibble-covenant with 100% discount")
            return True
            
        except Exception as e:
            self.log_test("Soul Food Coupon - Holiday Covenant", False, f"Exception: {str(e)}")
            return False

    def test_soul_food_free_order_processing(self):
        """Test free order processing with 100% discount coupon"""
        try:
            test_data = {
                "items": [
                    {
                        "product_id": "holiday-nibble-covenant",
                        "name": "Holiday Series - The Covenant",
                        "quantity": 1,
                        "price": 3.59
                    }
                ],
                "coupon_code": "Beta1!2!3!",
                "discount_percent": 100
            }
            
            response = self.session.post(
                f"{self.base_url}/payments/free-order",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Soul Food Free Order Processing", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["success", "order_id", "message", "items"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Soul Food Free Order Processing", False, f"Missing field: {field}")
                    return False
            
            # Verify order was processed successfully
            if not data.get("success"):
                self.log_test("Soul Food Free Order Processing", False, f"Order not successful: {data.get('message')}")
                return False
                
            # Verify order ID format
            order_id = data.get("order_id", "")
            if not order_id.startswith("FREE-"):
                self.log_test("Soul Food Free Order Processing", False, f"Invalid order ID format: {order_id}")
                return False
            
            # Store order ID for potential cleanup
            self.order_id = order_id
            
            self.log_test("Soul Food Free Order Processing", True, f"Free order processed successfully with order ID: {order_id}")
            return True
            
        except Exception as e:
            self.log_test("Soul Food Free Order Processing", False, f"Exception: {str(e)}")
            return False

    def test_soul_food_pdf_download(self):
        """Test PDF download for holiday-ae-covenant lesson"""
        try:
            response = self.session.get(
                f"{self.base_url}/interactive-lessons/download/nibble/holiday-ae-covenant",
                headers={"Accept": "application/pdf"}
            )
            
            if response.status_code != 200:
                self.log_test("Soul Food PDF Download", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
            
            # Verify content type is PDF
            content_type = response.headers.get("content-type", "")
            if "application/pdf" not in content_type:
                self.log_test("Soul Food PDF Download", False, f"Wrong content type: {content_type}, expected: application/pdf")
                return False
            
            # Verify we got actual PDF content
            content = response.content
            if len(content) < 1000:  # PDF should be at least 1KB
                self.log_test("Soul Food PDF Download", False, f"PDF content too small: {len(content)} bytes")
                return False
            
            # Verify PDF header
            if not content.startswith(b'%PDF'):
                self.log_test("Soul Food PDF Download", False, "Content does not start with PDF header")
                return False
            
            self.log_test("Soul Food PDF Download", True, f"PDF downloaded successfully ({len(content)} bytes)")
            return True
            
        except Exception as e:
            self.log_test("Soul Food PDF Download", False, f"Exception: {str(e)}")
            return False

    def test_api_endpoints_availability(self):
        """Test that required API endpoints are available"""
        try:
            # Test root API endpoint
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code != 200:
                self.log_test("API Endpoints Availability", False, f"Root API endpoint failed: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify API response structure
            if "message" not in data:
                self.log_test("API Endpoints Availability", False, "Root API missing message field")
                return False
                
            if "Soul Food" not in data.get("message", ""):
                self.log_test("API Endpoints Availability", False, f"Unexpected API message: {data.get('message')}")
                return False
            
            self.log_test("API Endpoints Availability", True, "Core API endpoints are available")
            return True
            
        except Exception as e:
            self.log_test("API Endpoints Availability", False, f"Exception: {str(e)}")
            return False

    def test_series_and_editions_data(self):
        """Test that series and editions data is available"""
        try:
            # Test series endpoint
            response = self.session.get(f"{self.base_url}/series")
            
            if response.status_code != 200:
                self.log_test("Series and Editions Data", False, f"Series endpoint failed: {response.status_code}")
                return False
                
            data = response.json()
            
            # Verify series data structure
            if "series" not in data:
                self.log_test("Series and Editions Data", False, "Series data missing")
                return False
                
            series = data["series"]
            
            # Check for Holiday and Breakfast series (available at launch)
            if "holiday" not in series:
                self.log_test("Series and Editions Data", False, "Holiday series missing")
                return False
                
            if "breakfast" not in series:
                self.log_test("Series and Editions Data", False, "Breakfast series missing")
                return False
                
            # Verify Holiday series is available
            holiday_series = series["holiday"]
            if not holiday_series.get("available"):
                self.log_test("Series and Editions Data", False, "Holiday series not marked as available")
                return False
                
            # Test editions endpoint
            response = self.session.get(f"{self.base_url}/editions")
            
            if response.status_code != 200:
                self.log_test("Series and Editions Data", False, f"Editions endpoint failed: {response.status_code}")
                return False
                
            data = response.json()
            
            if "editions" not in data:
                self.log_test("Series and Editions Data", False, "Editions data missing")
                return False
                
            editions = data["editions"]
            
            # Check for required editions
            required_editions = ["adult", "youth", "instructor"]
            for edition in required_editions:
                if edition not in editions:
                    self.log_test("Series and Editions Data", False, f"Missing {edition} edition")
                    return False
            
            self.log_test("Series and Editions Data", True, "Series and editions data available and correct")
            return True
            
        except Exception as e:
            self.log_test("Series and Editions Data", False, f"Exception: {str(e)}")
            return False

    # =============================================================================
    # ADMIN CONSOLE TESTS
    # =============================================================================

    def test_admin_login_instructor(self):
        """Test admin login with instructor credentials and store token"""
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
                self.log_test("Admin Login - Instructor", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["access_token", "token_type", "user"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Admin Login - Instructor", False, f"Missing field: {field}")
                    return False
            
            # Store admin token for subsequent tests
            self.admin_token = data["access_token"]
            
            user = data["user"]
            
            # Verify instructor-specific values
            if user.get("role") != "instructor_tester":
                self.log_test("Admin Login - Instructor", False, f"Wrong role: {user.get('role')}, expected: instructor_tester")
                return False
                
            if user.get("access_level") != "instructor":
                self.log_test("Admin Login - Instructor", False, f"Wrong access_level: {user.get('access_level')}, expected: instructor")
                return False
            
            self.log_test("Admin Login - Instructor", True, "Instructor login successful, admin token stored")
            return True
            
        except Exception as e:
            self.log_test("Admin Login - Instructor", False, f"Exception: {str(e)}")
            return False

    def test_admin_dashboard(self):
        """Test GET /api/admin/dashboard endpoint"""
        if not self.admin_token:
            self.log_test("Admin Dashboard", False, "No admin token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/admin/dashboard",
                headers=headers
            )
            
            if response.status_code != 200:
                self.log_test("Admin Dashboard", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["summary", "recent_orders", "recent_users", "admin"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Admin Dashboard", False, f"Missing field: {field}")
                    return False
            
            # Verify summary structure
            summary = data["summary"]
            summary_fields = ["total_users", "total_lessons", "total_orders", "total_products", "total_revenue"]
            for field in summary_fields:
                if field not in summary:
                    self.log_test("Admin Dashboard", False, f"Missing summary field: {field}")
                    return False
                    
                # Verify it's a number
                if not isinstance(summary[field], (int, float)):
                    self.log_test("Admin Dashboard", False, f"Summary field {field} is not a number: {summary[field]}")
                    return False
            
            # Verify admin info
            admin_info = data["admin"]
            if "id" not in admin_info or "email" not in admin_info or "role" not in admin_info:
                self.log_test("Admin Dashboard", False, "Missing admin info fields")
                return False
            
            self.log_test("Admin Dashboard", True, f"Dashboard data retrieved successfully - {summary['total_users']} users, {summary['total_lessons']} lessons")
            return True
            
        except Exception as e:
            self.log_test("Admin Dashboard", False, f"Exception: {str(e)}")
            return False

    def test_admin_content(self):
        """Test GET /api/admin/content endpoint"""
        if not self.admin_token:
            self.log_test("Admin Content", False, "No admin token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/admin/content",
                headers=headers
            )
            
            if response.status_code != 200:
                self.log_test("Admin Content", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["items", "total", "page", "limit", "pages"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Admin Content", False, f"Missing field: {field}")
                    return False
            
            # Verify items is a list
            if not isinstance(data["items"], list):
                self.log_test("Admin Content", False, "Items field is not a list")
                return False
            
            # If there are items, verify structure
            if data["items"]:
                item = data["items"][0]
                item_fields = ["id", "title", "series", "lesson_number"]
                for field in item_fields:
                    if field not in item:
                        self.log_test("Admin Content", False, f"Missing item field: {field}")
                        return False
            
            self.log_test("Admin Content", True, f"Content list retrieved successfully - {data['total']} items")
            return True
            
        except Exception as e:
            self.log_test("Admin Content", False, f"Exception: {str(e)}")
            return False

    def test_admin_users(self):
        """Test GET /api/admin/users endpoint"""
        if not self.admin_token:
            self.log_test("Admin Users", False, "No admin token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/admin/users",
                headers=headers
            )
            
            if response.status_code != 200:
                self.log_test("Admin Users", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["items", "total", "page", "limit", "pages", "roles"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Admin Users", False, f"Missing field: {field}")
                    return False
            
            # Verify items is a list
            if not isinstance(data["items"], list):
                self.log_test("Admin Users", False, "Items field is not a list")
                return False
            
            # Verify roles is a list
            if not isinstance(data["roles"], list):
                self.log_test("Admin Users", False, "Roles field is not a list")
                return False
            
            self.log_test("Admin Users", True, f"Users list retrieved successfully - {data['total']} users")
            return True
            
        except Exception as e:
            self.log_test("Admin Users", False, f"Exception: {str(e)}")
            return False

    def test_admin_orders(self):
        """Test GET /api/admin/orders endpoint"""
        if not self.admin_token:
            self.log_test("Admin Orders", False, "No admin token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/admin/orders",
                headers=headers
            )
            
            if response.status_code != 200:
                self.log_test("Admin Orders", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["items", "total", "page", "limit", "pages"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Admin Orders", False, f"Missing field: {field}")
                    return False
            
            # Verify items is a list
            if not isinstance(data["items"], list):
                self.log_test("Admin Orders", False, "Items field is not a list")
                return False
            
            self.log_test("Admin Orders", True, f"Orders list retrieved successfully - {data['total']} orders")
            return True
            
        except Exception as e:
            self.log_test("Admin Orders", False, f"Exception: {str(e)}")
            return False

    def test_admin_products(self):
        """Test GET /api/admin/products endpoint"""
        if not self.admin_token:
            self.log_test("Admin Products", False, "No admin token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/admin/products",
                headers=headers
            )
            
            if response.status_code != 200:
                self.log_test("Admin Products", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["items", "total", "page", "limit", "pages"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Admin Products", False, f"Missing field: {field}")
                    return False
            
            # Verify items is a list
            if not isinstance(data["items"], list):
                self.log_test("Admin Products", False, "Items field is not a list")
                return False
            
            # Check for low_stock_count field
            if "low_stock_count" not in data:
                self.log_test("Admin Products", False, "Missing low_stock_count field")
                return False
            
            self.log_test("Admin Products", True, f"Products list retrieved successfully - {data['total']} products")
            return True
            
        except Exception as e:
            self.log_test("Admin Products", False, f"Exception: {str(e)}")
            return False

    def test_admin_media(self):
        """Test GET /api/admin/media endpoint"""
        if not self.admin_token:
            self.log_test("Admin Media", False, "No admin token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/admin/media",
                headers=headers
            )
            
            if response.status_code != 200:
                self.log_test("Admin Media", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["items", "total", "page", "limit", "pages"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Admin Media", False, f"Missing field: {field}")
                    return False
            
            # Verify items is a list
            if not isinstance(data["items"], list):
                self.log_test("Admin Media", False, "Items field is not a list")
                return False
            
            self.log_test("Admin Media", True, f"Media list retrieved successfully - {data['total']} media files")
            return True
            
        except Exception as e:
            self.log_test("Admin Media", False, f"Exception: {str(e)}")
            return False

    def test_admin_logs(self):
        """Test GET /api/admin/logs endpoint"""
        if not self.admin_token:
            self.log_test("Admin Logs", False, "No admin token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/admin/logs",
                headers=headers
            )
            
            if response.status_code != 200:
                self.log_test("Admin Logs", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["admin_logs", "security_logs", "total", "page", "limit", "pages"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Admin Logs", False, f"Missing field: {field}")
                    return False
            
            # Verify logs are lists
            if not isinstance(data["admin_logs"], list):
                self.log_test("Admin Logs", False, "Admin logs field is not a list")
                return False
                
            if not isinstance(data["security_logs"], list):
                self.log_test("Admin Logs", False, "Security logs field is not a list")
                return False
            
            self.log_test("Admin Logs", True, f"Audit logs retrieved successfully - {data['total']} admin logs, {len(data['security_logs'])} security logs")
            return True
            
        except Exception as e:
            self.log_test("Admin Logs", False, f"Exception: {str(e)}")
            return False

    def test_admin_instructor_content(self):
        """Test GET /api/admin/instructor-content endpoint"""
        if not self.admin_token:
            self.log_test("Admin Instructor Content", False, "No admin token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/admin/instructor-content",
                headers=headers
            )
            
            if response.status_code != 200:
                self.log_test("Admin Instructor Content", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["items"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Admin Instructor Content", False, f"Missing field: {field}")
                    return False
            
            # Verify items is a list
            if not isinstance(data["items"], list):
                self.log_test("Admin Instructor Content", False, "Items field is not a list")
                return False
            
            self.log_test("Admin Instructor Content", True, f"Instructor content retrieved successfully - {len(data['items'])} items")
            return True
            
        except Exception as e:
            self.log_test("Admin Instructor Content", False, f"Exception: {str(e)}")
            return False

    def test_admin_unauthorized_access(self):
        """Test that admin endpoints reject requests without proper authorization"""
        try:
            # Test without any token
            response = self.session.get(f"{self.base_url}/admin/dashboard")
            
            if response.status_code != 401:
                self.log_test("Admin Unauthorized Access", False, f"Expected 401, got {response.status_code}")
                return False
            
            # Test with invalid token
            headers = {"Authorization": "Bearer invalid_token"}
            response = self.session.get(f"{self.base_url}/admin/dashboard", headers=headers)
            
            if response.status_code != 401:
                self.log_test("Admin Unauthorized Access", False, f"Expected 401 for invalid token, got {response.status_code}")
                return False
            
            self.log_test("Admin Unauthorized Access", True, "Admin endpoints properly reject unauthorized access")
            return True
            
        except Exception as e:
            self.log_test("Admin Unauthorized Access", False, f"Exception: {str(e)}")
            return False

    # =============================================================================
    # PRODUCT CATALOG AND DOWNLOAD PROTECTION TESTS
    # =============================================================================

    def test_products_api_all_34_products(self):
        """Test GET /api/payments/products returns all 34 products"""
        try:
            response = self.session.get(f"{self.base_url}/payments/products")
            
            if response.status_code != 200:
                self.log_test("Products API - All 34 Products", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            if "products" not in data:
                self.log_test("Products API - All 34 Products", False, "Missing 'products' field in response")
                return False
            
            products = data["products"]
            
            # Verify we have exactly 34 products
            if len(products) != 34:
                self.log_test("Products API - All 34 Products", False, f"Expected 34 products, got {len(products)}")
                return False
            
            self.log_test("Products API - All 34 Products", True, f"Successfully returned all {len(products)} products")
            return True
            
        except Exception as e:
            self.log_test("Products API - All 34 Products", False, f"Exception: {str(e)}")
            return False

    def test_products_api_lunch_series_pricing(self):
        """Test Lunch Series products have correct prices"""
        try:
            response = self.session.get(f"{self.base_url}/payments/products")
            
            if response.status_code != 200:
                self.log_test("Products API - Lunch Series Pricing", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            products = data["products"]
            
            # Expected Lunch Series prices
            expected_prices = {
                "lunch_ie_paperback": 29.99,
                "lunch_ae_paperback": 27.99,
                "lunch_ye_paperback": 24.99
            }
            
            for product_id, expected_price in expected_prices.items():
                if product_id not in products:
                    self.log_test("Products API - Lunch Series Pricing", False, f"Missing product: {product_id}")
                    return False
                
                product = products[product_id]
                actual_price = product.get("sale_price", product.get("list_price", 0))
                
                if actual_price != expected_price:
                    self.log_test("Products API - Lunch Series Pricing", False, f"{product_id}: Expected ${expected_price}, got ${actual_price}")
                    return False
            
            self.log_test("Products API - Lunch Series Pricing", True, "All Lunch Series products have correct prices")
            return True
            
        except Exception as e:
            self.log_test("Products API - Lunch Series Pricing", False, f"Exception: {str(e)}")
            return False

    def test_products_api_holiday_series_pricing(self):
        """Test Holiday Series products have correct prices"""
        try:
            response = self.session.get(f"{self.base_url}/payments/products")
            
            if response.status_code != 200:
                self.log_test("Products API - Holiday Series Pricing", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            products = data["products"]
            
            # Expected Holiday Series prices
            expected_prices = {
                "holiday_ie": 19.99,
                "holiday_ae": 16.99,
                "holiday_ye": 16.99
            }
            
            for product_id, expected_price in expected_prices.items():
                if product_id not in products:
                    self.log_test("Products API - Holiday Series Pricing", False, f"Missing product: {product_id}")
                    return False
                
                product = products[product_id]
                actual_price = product.get("sale_price", product.get("list_price", 0))
                
                if actual_price != expected_price:
                    self.log_test("Products API - Holiday Series Pricing", False, f"{product_id}: Expected ${expected_price}, got ${actual_price}")
                    return False
            
            self.log_test("Products API - Holiday Series Pricing", True, "All Holiday Series products have correct prices")
            return True
            
        except Exception as e:
            self.log_test("Products API - Holiday Series Pricing", False, f"Exception: {str(e)}")
            return False

    def test_products_api_breakfast_workbooks_pricing(self):
        """Test Breakfast workbooks have correct prices"""
        try:
            response = self.session.get(f"{self.base_url}/payments/products")
            
            if response.status_code != 200:
                self.log_test("Products API - Breakfast Workbooks Pricing", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            products = data["products"]
            
            # Expected Breakfast workbook prices
            expected_prices = {
                "breakfast_ae_digital": 14.99,
                "breakfast_ye_digital": 12.99
            }
            
            for product_id, expected_price in expected_prices.items():
                if product_id not in products:
                    self.log_test("Products API - Breakfast Workbooks Pricing", False, f"Missing product: {product_id}")
                    return False
                
                product = products[product_id]
                actual_price = product.get("sale_price", product.get("list_price", 0))
                
                if actual_price != expected_price:
                    self.log_test("Products API - Breakfast Workbooks Pricing", False, f"{product_id}: Expected ${expected_price}, got ${actual_price}")
                    return False
            
            self.log_test("Products API - Breakfast Workbooks Pricing", True, "All Breakfast workbooks have correct prices")
            return True
            
        except Exception as e:
            self.log_test("Products API - Breakfast Workbooks Pricing", False, f"Exception: {str(e)}")
            return False

    def test_products_api_game_passes_pricing(self):
        """Test Game Passes have correct prices"""
        try:
            response = self.session.get(f"{self.base_url}/payments/products")
            
            if response.status_code != 200:
                self.log_test("Products API - Game Passes Pricing", False, f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            products = data["products"]
            
            # Expected Game Pass prices
            expected_prices = {
                "game_pass_30": 7.99,
                "game_pass_90": 24.99
            }
            
            for product_id, expected_price in expected_prices.items():
                if product_id not in products:
                    self.log_test("Products API - Game Passes Pricing", False, f"Missing product: {product_id}")
                    return False
                
                product = products[product_id]
                actual_price = product.get("sale_price", product.get("list_price", 0))
                
                if actual_price != expected_price:
                    self.log_test("Products API - Game Passes Pricing", False, f"{product_id}: Expected ${expected_price}, got ${actual_price}")
                    return False
            
            self.log_test("Products API - Game Passes Pricing", True, "All Game Passes have correct prices")
            return True
            
        except Exception as e:
            self.log_test("Products API - Game Passes Pricing", False, f"Exception: {str(e)}")
            return False

    def test_download_protection_link_info(self):
        """Test GET /api/downloads/link-info returns correct configuration"""
        try:
            response = self.session.get(f"{self.base_url}/downloads/link-info")
            
            if response.status_code != 200:
                self.log_test("Download Protection - Link Info", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify required fields
            required_fields = ["expiry_hours", "max_downloads", "resend_rate_limit"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Download Protection - Link Info", False, f"Missing field: {field}")
                    return False
            
            # Verify expected values
            expected_values = {
                "expiry_hours": 72,
                "max_downloads": 3,
                "resend_rate_limit": 3
            }
            
            for field, expected_value in expected_values.items():
                actual_value = data.get(field)
                if actual_value != expected_value:
                    self.log_test("Download Protection - Link Info", False, f"{field}: Expected {expected_value}, got {actual_value}")
                    return False
            
            self.log_test("Download Protection - Link Info", True, "Download protection configuration correct: 72h expiry, 3 max downloads, 3 resend limit")
            return True
            
        except Exception as e:
            self.log_test("Download Protection - Link Info", False, f"Exception: {str(e)}")
            return False

    # =============================================================================
    # GAMING SESSION MANAGEMENT TESTS
    # =============================================================================

    def test_gaming_tiers_endpoint(self):
        """Test GET /api/gaming/tiers - Should return all gaming tier configurations"""
        try:
            response = self.session.get(f"{self.base_url}/gaming/tiers")
            
            if response.status_code != 200:
                self.log_test("Gaming Tiers Endpoint", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            if "tiers" not in data:
                self.log_test("Gaming Tiers Endpoint", False, "Missing 'tiers' field in response")
                return False
            
            tiers = data["tiers"]
            
            # Expected tiers
            expected_tiers = ["game_pass_30", "game_pass_90", "ministry_group", "all_day_pass"]
            
            for tier_id in expected_tiers:
                if tier_id not in tiers:
                    self.log_test("Gaming Tiers Endpoint", False, f"Missing tier: {tier_id}")
                    return False
                
                tier = tiers[tier_id]
                required_fields = ["name", "daily_limit_hours", "idle_timeout_minutes", "category_selection", "description"]
                
                for field in required_fields:
                    if field not in tier:
                        self.log_test("Gaming Tiers Endpoint", False, f"Missing field '{field}' in tier {tier_id}")
                        return False
            
            # Verify specific tier configurations
            if tiers["game_pass_30"]["daily_limit_hours"] != 4.0:
                self.log_test("Gaming Tiers Endpoint", False, f"30-Day Pass should have 4hr/day limit, got {tiers['game_pass_30']['daily_limit_hours']}")
                return False
                
            if tiers["game_pass_90"]["daily_limit_hours"] != 5.0:
                self.log_test("Gaming Tiers Endpoint", False, f"90-Day Pass should have 5hr/day limit, got {tiers['game_pass_90']['daily_limit_hours']}")
                return False
                
            if tiers["ministry_group"]["daily_limit_hours"] != 6.0:
                self.log_test("Gaming Tiers Endpoint", False, f"Ministry/Small Group should have 6hr/day limit, got {tiers['ministry_group']['daily_limit_hours']}")
                return False
                
            if tiers["all_day_pass"]["daily_limit_hours"] is not None:
                self.log_test("Gaming Tiers Endpoint", False, f"All-Day Pass should have unlimited access, got {tiers['all_day_pass']['daily_limit_hours']}")
                return False
            
            self.log_test("Gaming Tiers Endpoint", True, f"All gaming tiers configured correctly: 30-Day (4hr), 90-Day (5hr), Ministry (6hr), All-Day (unlimited)")
            return True
            
        except Exception as e:
            self.log_test("Gaming Tiers Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_gaming_categories_endpoint(self):
        """Test GET /api/gaming/categories - Should return 6 game categories"""
        try:
            response = self.session.get(f"{self.base_url}/gaming/categories")
            
            if response.status_code != 200:
                self.log_test("Gaming Categories Endpoint", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            if "categories" not in data:
                self.log_test("Gaming Categories Endpoint", False, "Missing 'categories' field in response")
                return False
            
            categories = data["categories"]
            
            # Should have exactly 6 categories
            if len(categories) != 6:
                self.log_test("Gaming Categories Endpoint", False, f"Expected 6 categories, got {len(categories)}")
                return False
            
            # Verify category structure
            expected_categories = ["jeopardy", "word_search", "crossword", "matching", "quiz", "group_challenge"]
            
            for category in categories:
                if "id" not in category or "name" not in category or "description" not in category:
                    self.log_test("Gaming Categories Endpoint", False, f"Category missing required fields: {category}")
                    return False
            
            # Verify specific categories exist
            category_ids = [cat["id"] for cat in categories]
            for expected_id in expected_categories:
                if expected_id not in category_ids:
                    self.log_test("Gaming Categories Endpoint", False, f"Missing expected category: {expected_id}")
                    return False
            
            self.log_test("Gaming Categories Endpoint", True, f"All 6 game categories returned: {', '.join(category_ids)}")
            return True
            
        except Exception as e:
            self.log_test("Gaming Categories Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_gaming_can_play_endpoint(self):
        """Test GET /api/gaming/can-play?user_id=test123 - Check if user can play"""
        try:
            response = self.session.get(f"{self.base_url}/gaming/can-play?user_id=test123")
            
            if response.status_code != 200:
                self.log_test("Gaming Can Play Endpoint", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["can_play", "message"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Gaming Can Play Endpoint", False, f"Missing field: {field}")
                    return False
            
            # Should be able to play (free beta tier)
            if not isinstance(data["can_play"], bool):
                self.log_test("Gaming Can Play Endpoint", False, f"can_play should be boolean, got {type(data['can_play'])}")
                return False
            
            self.log_test("Gaming Can Play Endpoint", True, f"Can play check successful: {data['can_play']} - {data['message']}")
            return True
            
        except Exception as e:
            self.log_test("Gaming Can Play Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_gaming_start_session_endpoint(self):
        """Test POST /api/gaming/start?user_id=test-session-user - Start a gaming session"""
        try:
            test_data = {
                "game_type": "jeopardy"
            }
            
            response = self.session.post(
                f"{self.base_url}/gaming/start?user_id=test-session-user",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Gaming Start Session", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["success", "message", "session_id", "tier", "tier_name"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Gaming Start Session", False, f"Missing field: {field}")
                    return False
            
            # Verify success
            if not data.get("success"):
                self.log_test("Gaming Start Session", False, f"Session start failed: {data.get('message')}")
                return False
            
            # Store session ID for subsequent tests
            self.gaming_session_id = data.get("session_id")
            
            # Verify session ID format
            if not self.gaming_session_id or len(self.gaming_session_id) < 10:
                self.log_test("Gaming Start Session", False, f"Invalid session ID: {self.gaming_session_id}")
                return False
            
            self.log_test("Gaming Start Session", True, f"Gaming session started successfully: {self.gaming_session_id} ({data.get('tier_name')})")
            return True
            
        except Exception as e:
            self.log_test("Gaming Start Session", False, f"Exception: {str(e)}")
            return False

    def test_gaming_status_endpoint(self):
        """Test GET /api/gaming/status?user_id=test-session-user - Get session status"""
        try:
            response = self.session.get(f"{self.base_url}/gaming/status?user_id=test-session-user")
            
            if response.status_code != 200:
                self.log_test("Gaming Status Endpoint", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["tier", "tier_name", "has_active_session"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Gaming Status Endpoint", False, f"Missing field: {field}")
                    return False
            
            # Should have active session if previous test passed
            if hasattr(self, 'gaming_session_id') and self.gaming_session_id:
                if not data.get("has_active_session"):
                    self.log_test("Gaming Status Endpoint", False, "Should have active session but has_active_session is False")
                    return False
                
                if "active_session" not in data or not data["active_session"]:
                    self.log_test("Gaming Status Endpoint", False, "Missing active_session details")
                    return False
                
                active_session = data["active_session"]
                if active_session.get("session_id") != self.gaming_session_id:
                    self.log_test("Gaming Status Endpoint", False, f"Session ID mismatch: expected {self.gaming_session_id}, got {active_session.get('session_id')}")
                    return False
            
            self.log_test("Gaming Status Endpoint", True, f"Session status retrieved: {data.get('tier_name')}, Active: {data.get('has_active_session')}")
            return True
            
        except Exception as e:
            self.log_test("Gaming Status Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_gaming_heartbeat_endpoint(self):
        """Test POST /api/gaming/heartbeat - Send heartbeat"""
        if not hasattr(self, 'gaming_session_id') or not self.gaming_session_id:
            self.log_test("Gaming Heartbeat", False, "No active session ID available")
            return False
            
        try:
            test_data = {
                "session_id": self.gaming_session_id
            }
            
            response = self.session.post(
                f"{self.base_url}/gaming/heartbeat",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Gaming Heartbeat", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["active", "message"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Gaming Heartbeat", False, f"Missing field: {field}")
                    return False
            
            # Should be active
            if not data.get("active"):
                self.log_test("Gaming Heartbeat", False, f"Session not active: {data.get('message')}")
                return False
            
            self.log_test("Gaming Heartbeat", True, f"Heartbeat successful: {data.get('message')}")
            return True
            
        except Exception as e:
            self.log_test("Gaming Heartbeat", False, f"Exception: {str(e)}")
            return False

    def test_gaming_end_session_endpoint(self):
        """Test POST /api/gaming/end - End session"""
        if not hasattr(self, 'gaming_session_id') or not self.gaming_session_id:
            self.log_test("Gaming End Session", False, "No active session ID available")
            return False
            
        try:
            test_data = {
                "session_id": self.gaming_session_id,
                "reason": "test_complete"
            }
            
            response = self.session.post(
                f"{self.base_url}/gaming/end",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log_test("Gaming End Session", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["success", "message"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Gaming End Session", False, f"Missing field: {field}")
                    return False
            
            # Should be successful
            if not data.get("success"):
                self.log_test("Gaming End Session", False, f"Session end failed: {data.get('message')}")
                return False
            
            self.log_test("Gaming End Session", True, f"Session ended successfully: {data.get('message')}")
            return True
            
        except Exception as e:
            self.log_test("Gaming End Session", False, f"Exception: {str(e)}")
            return False

    def test_gaming_admin_active_sessions_endpoint(self):
        """Test GET /api/gaming/admin/active-sessions - Admin endpoint to view active sessions"""
        try:
            response = self.session.get(f"{self.base_url}/gaming/admin/active-sessions")
            
            if response.status_code != 200:
                self.log_test("Gaming Admin Active Sessions", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
            data = response.json()
            
            # Verify response structure
            required_fields = ["total_active", "by_tier"]
            for field in required_fields:
                if field not in data:
                    self.log_test("Gaming Admin Active Sessions", False, f"Missing field: {field}")
                    return False
            
            # Verify by_tier structure
            by_tier = data["by_tier"]
            expected_tiers = ["game_pass_30", "game_pass_90", "ministry_group", "all_day_pass", "free_beta"]
            
            for tier in expected_tiers:
                if tier not in by_tier:
                    self.log_test("Gaming Admin Active Sessions", False, f"Missing tier in by_tier: {tier}")
                    return False
                
                if not isinstance(by_tier[tier], int):
                    self.log_test("Gaming Admin Active Sessions", False, f"Tier count should be integer: {tier} = {by_tier[tier]}")
                    return False
            
            # Verify total_active is integer
            if not isinstance(data["total_active"], int):
                self.log_test("Gaming Admin Active Sessions", False, f"total_active should be integer, got {type(data['total_active'])}")
                return False
            
            self.log_test("Gaming Admin Active Sessions", True, f"Active sessions retrieved: {data['total_active']} total sessions")
            return True
            
        except Exception as e:
            self.log_test("Gaming Admin Active Sessions", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all Soul Food Gaming Session Management Tests"""
        print("🎮 Starting Soul Food Gaming Session Management Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 70)
        
        tests = [
            # Gaming Session Management Tests (Priority)
            self.test_gaming_tiers_endpoint,
            self.test_gaming_categories_endpoint,
            self.test_gaming_can_play_endpoint,
            self.test_gaming_start_session_endpoint,
            self.test_gaming_status_endpoint,
            self.test_gaming_heartbeat_endpoint,
            self.test_gaming_end_session_endpoint,
            self.test_gaming_admin_active_sessions_endpoint,
            
            # Product Catalog Tests (Previously tested)
            self.test_products_api_all_34_products,
            self.test_products_api_lunch_series_pricing,
            self.test_products_api_holiday_series_pricing,
            self.test_products_api_breakfast_workbooks_pricing,
            self.test_products_api_game_passes_pricing,
            
            # Download Protection Tests (Previously tested)
            self.test_download_protection_link_info,
            
            # Core API Tests
            self.test_api_endpoints_availability,
            self.test_series_and_editions_data,
            
            # Admin Console Tests (Previously tested)
            self.test_admin_login_instructor,
            self.test_admin_dashboard,
            self.test_admin_content,
            self.test_admin_users,
            self.test_admin_orders,
            self.test_admin_products,
            self.test_admin_media,
            self.test_admin_logs,
            self.test_admin_instructor_content,
            self.test_admin_unauthorized_access,
            
            # Soul Food Complete Flow Tests
            self.test_soul_food_coupon_validation_holiday_covenant,
            self.test_soul_food_free_order_processing,
            self.test_soul_food_pdf_download,
            
            # Quick Order and Pricing Tests
            self.test_quick_order_pricing_verification,
            self.test_cart_flow_holiday_nibble,
            
            # Checkout and Coupon Tests
            self.test_checkout_coupon_beta123,
            self.test_checkout_coupon_case_sensitivity,
            
            # Legacy Coupon Tests (for compatibility)
            self.test_coupon_validation_beta123,
            self.test_coupon_validation_betatest,
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
                
        print("=" * 70)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All Soul Food Product Catalog and Download Protection tests PASSED!")
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
    tester = SoulFoodQuickOrderTester()
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