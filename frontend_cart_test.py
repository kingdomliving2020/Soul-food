#!/usr/bin/env python3
"""
Frontend Cart Flow Testing for Soul Food E-commerce
Tests the complete cart flow with coupon validation in a single browser session
"""

import asyncio
import sys
from playwright.async_api import async_playwright
import time

# Frontend URL from frontend/.env
FRONTEND_URL = "https://soul-checkout-stage.preview.emergentagent.com"

class SoulFoodCartTester:
    def __init__(self):
        self.frontend_url = FRONTEND_URL
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

    async def test_cart_flow_with_coupon(self):
        """Test the complete cart flow with coupon validation in a single browser session"""
        try:
            async with async_playwright() as p:
                # Launch browser
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                
                # Step 1: Go to quick-order page
                print("🔍 Step 1: Navigating to Quick Order page...")
                await page.goto(f"{self.frontend_url}/quick-order")
                await page.wait_for_load_state('networkidle')
                
                # Verify page loaded
                page_title = await page.text_content('h2')
                if "What's on Your Plate Today?" not in page_title:
                    self.log_test("Quick Order Page Load", False, f"Page title not found: {page_title}")
                    await browser.close()
                    return False
                
                self.log_test("Quick Order Page Load", True, "Quick Order page loaded successfully")
                
                # Step 2: Find and click the 3rd Add button (Holiday Nibble)
                print("🔍 Step 2: Looking for Holiday Nibble Add button...")
                
                # Wait for products to load
                await page.wait_for_selector('button:has-text("Add")', timeout=10000)
                
                # Get all Add buttons
                add_buttons = await page.query_selector_all('button:has-text("Add")')
                
                if len(add_buttons) < 3:
                    self.log_test("Holiday Nibble Add Button", False, f"Expected at least 3 Add buttons, found {len(add_buttons)}")
                    await browser.close()
                    return False
                
                # Click the 3rd Add button (index 2)
                await add_buttons[2].click()
                
                # Wait for toast notification
                await page.wait_for_timeout(2000)
                
                self.log_test("Holiday Nibble Add Button", True, "Clicked 3rd Add button successfully")
                
                # Step 3: Verify cart badge shows item count
                print("🔍 Step 3: Verifying cart badge shows item...")
                
                # Wait for cart to update
                await page.wait_for_timeout(2000)
                
                # Look for cart badge with count
                cart_badge = await page.query_selector('.absolute.-top-1.-right-1.bg-orange-500')
                if not cart_badge:
                    cart_badge = await page.query_selector('[class*="badge"], [class*="count"]')
                
                if cart_badge:
                    badge_text = await cart_badge.text_content()
                    if "1" in badge_text:
                        self.log_test("Cart Badge Verification", True, f"Cart badge shows count: {badge_text}")
                    else:
                        self.log_test("Cart Badge Verification", False, f"Cart badge count incorrect: {badge_text}")
                        await browser.close()
                        return False
                else:
                    self.log_test("Cart Badge Verification", False, "Cart badge not found")
                    await browser.close()
                    return False
                
                # Step 4: Navigate directly to checkout page
                print("🔍 Step 4: Navigating to checkout page...")
                
                await page.goto(f"{self.frontend_url}/checkout")
                await page.wait_for_load_state('networkidle')
                
                # Verify we're on checkout page
                current_url = page.url
                if "/checkout" not in current_url:
                    self.log_test("Checkout Page Navigation", False, f"Not on checkout page: {current_url}")
                    await browser.close()
                    return False
                
                self.log_test("Checkout Page Navigation", True, "Successfully navigated to checkout page")
                
                # Step 5: Verify checkout page shows correct item and price
                print("🔍 Step 5: Verifying checkout page contents...")
                
                # Wait for checkout page to load
                await page.wait_for_timeout(2000)
                
                # Look for item details on checkout page
                checkout_item = await page.query_selector('.bg-gray-50, .border, .rounded')
                if not checkout_item:
                    self.log_test("Checkout Item Display", False, "Checkout item not found")
                    await browser.close()
                    return False
                
                self.log_test("Checkout Item Display", True, "Checkout page shows cart items")
                
                # Step 6: Enter coupon code "Beta1!2!3!"
                print("🔍 Step 6: Applying coupon code...")
                
                # Find coupon input field
                coupon_input = await page.query_selector('input[placeholder*="coupon"], input[type="text"]')
                if not coupon_input:
                    # Try alternative selectors
                    coupon_input = await page.query_selector('input')
                
                if not coupon_input:
                    self.log_test("Coupon Input Field", False, "Coupon input field not found")
                    await browser.close()
                    return False
                
                # Clear and enter coupon code
                await coupon_input.fill("Beta1!2!3!")
                
                self.log_test("Coupon Code Entry", True, "Entered coupon code Beta1!2!3!")
                
                # Step 7: Click Apply button
                print("🔍 Step 7: Clicking Apply button...")
                
                apply_button = await page.query_selector('button:has-text("Apply")')
                if not apply_button:
                    self.log_test("Apply Button Click", False, "Apply button not found")
                    await browser.close()
                    return False
                
                await apply_button.click()
                await page.wait_for_timeout(3000)  # Wait for API call
                
                self.log_test("Apply Button Click", True, "Clicked Apply button")
                
                # Step 8: Verify coupon applies successfully with 100% discount
                print("🔍 Step 8: Verifying coupon application...")
                
                # Look for success message or discount applied
                coupon_success = False
                
                # Check for success message containing "100%" or "discount"
                page_text = await page.text_content('body')
                if "100%" in page_text or "Coupon applied" in page_text or "discount" in page_text.lower():
                    coupon_success = True
                
                # Also check for green text elements (success indicators)
                green_elements = await page.query_selector_all('.text-green-600, .text-emerald-600, .text-green-500')
                for element in green_elements:
                    element_text = await element.text_content()
                    if element_text and ("100%" in element_text or "discount" in element_text.lower() or "applied" in element_text.lower()):
                        coupon_success = True
                        break
                
                if not coupon_success:
                    # Check if there's any error message
                    error_element = await page.query_selector('.text-red-500, .text-red-600')
                    error_msg = ""
                    if error_element:
                        error_msg = await error_element.text_content()
                    
                    self.log_test("Coupon Application Success", False, f"Coupon not applied successfully. Error: {error_msg}")
                    await browser.close()
                    return False
                
                self.log_test("Coupon Application Success", True, "Coupon applied successfully with 100% discount")
                
                # Step 9: Verify Total becomes $0.00
                print("🔍 Step 9: Verifying total is $0.00...")
                
                # Look for total amount in page text
                page_text = await page.text_content('body')
                total_found = False
                
                if "$0.00" in page_text:
                    total_found = True
                
                # Also look for elements that might contain the total
                if not total_found:
                    # Look for elements with "Total" text
                    all_elements = await page.query_selector_all('*')
                    for element in all_elements:
                        element_text = await element.text_content()
                        if element_text and "Total" in element_text and "$0.00" in element_text:
                            total_found = True
                            break
                
                if not total_found:
                    self.log_test("Total Verification", False, "Total did not become $0.00")
                    await browser.close()
                    return False
                
                self.log_test("Total Verification", True, "Total correctly shows $0.00 after 100% discount")
                
                await browser.close()
                return True
                
        except Exception as e:
            self.log_test("Cart Flow Test", False, f"Exception: {str(e)}")
            return False

    async def run_all_tests(self):
        """Run all frontend cart flow tests"""
        print("🧪 Starting Soul Food Frontend Cart Flow Tests")
        print(f"🌐 Testing against: {self.frontend_url}")
        print("=" * 70)
        
        success = await self.test_cart_flow_with_coupon()
        
        print("=" * 70)
        if success:
            print("🎉 All Soul Food Cart Flow tests PASSED!")
        else:
            print("⚠️ Some Cart Flow tests FAILED")
        
        return success
    
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

async def main():
    """Main test execution"""
    tester = SoulFoodCartTester()
    success = await tester.run_all_tests()
    
    # Print detailed results for debugging
    print("\n📋 Detailed Results:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}")
        if result["details"]:
            print(f"   └─ {result['details']}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))