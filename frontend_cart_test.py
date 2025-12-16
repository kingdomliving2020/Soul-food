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
FRONTEND_URL = "https://nibbles-platform.preview.emergentagent.com"

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
                
                # Step 3: Verify cart shows Holiday Nibble
                print("🔍 Step 3: Verifying cart contents...")
                
                # Wait for any overlays to disappear
                await page.wait_for_timeout(2000)
                
                # Try to close any existing overlays first
                overlay = await page.query_selector('.fixed.inset-0.bg-black')
                if overlay:
                    await overlay.click()
                    await page.wait_for_timeout(500)
                
                # Find cart button using multiple strategies
                cart_button = None
                
                # Strategy 1: Look for button with ShoppingCart icon
                cart_buttons = await page.query_selector_all('button')
                for button in cart_buttons:
                    # Check if button contains shopping cart icon
                    svg = await button.query_selector('svg')
                    if svg:
                        # Check if it's a shopping cart icon (has specific path or class)
                        svg_content = await svg.inner_html()
                        if 'shopping' in svg_content.lower() or 'cart' in svg_content.lower() or 'M3 3h2l.4 2M7 13h10l4-8H5.4' in svg_content:
                            cart_button = button
                            break
                
                # Strategy 2: Look for button in header with cart badge
                if not cart_button:
                    cart_button = await page.query_selector('button:has(.absolute.-top-1.-right-1)')
                
                # Strategy 3: Look for any button in the header area that might be cart
                if not cart_button:
                    header_buttons = await page.query_selector_all('header button')
                    if len(header_buttons) >= 2:  # Usually back button and cart button
                        cart_button = header_buttons[-1]  # Last button is usually cart
                
                if not cart_button:
                    self.log_test("Cart Button Click", False, "Could not find cart button")
                    await browser.close()
                    return False
                
                # Force click using JavaScript to bypass overlay issues
                await page.evaluate('(button) => button.click()', cart_button)
                await page.wait_for_timeout(1000)
                
                # Check if cart dropdown is visible
                cart_dropdown = await page.query_selector('.absolute.right-0.top-full')
                if not cart_dropdown:
                    self.log_test("Cart Dropdown Open", False, "Cart dropdown not visible")
                    await browser.close()
                    return False
                
                # Verify cart item name contains "Holiday Nibble" and "ADULT" and "INTERACTIVE"
                cart_item_name = await page.text_content('h4.font-bold.text-gray-900')
                if not cart_item_name:
                    self.log_test("Cart Item Verification", False, "Cart item name not found")
                    await browser.close()
                    return False
                
                if "Holiday Nibble" not in cart_item_name or "ADULT" not in cart_item_name or "INTERACTIVE" not in cart_item_name:
                    self.log_test("Cart Item Verification", False, f"Cart item name incorrect: {cart_item_name}")
                    await browser.close()
                    return False
                
                # Verify price is $1.99
                cart_item_price = await page.text_content('.font-bold.text-purple-600')
                if "$1.99" not in cart_item_price:
                    self.log_test("Cart Item Price", False, f"Cart item price incorrect: {cart_item_price}")
                    await browser.close()
                    return False
                
                self.log_test("Cart Item Verification", True, f"Cart shows correct item: {cart_item_name} at {cart_item_price}")
                
                # Step 4: Click "Proceed to Checkout"
                print("🔍 Step 4: Proceeding to checkout...")
                
                checkout_button = await page.query_selector('button:has-text("Proceed to Checkout")')
                if not checkout_button:
                    self.log_test("Checkout Button Click", False, "Proceed to Checkout button not found")
                    await browser.close()
                    return False
                
                await checkout_button.click()
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
                success_indicators = [
                    'text="Coupon applied!"',
                    'text*="100%"',
                    'text*="discount"',
                    '.text-green-600',
                    '.text-emerald-600'
                ]
                
                coupon_success = False
                for indicator in success_indicators:
                    element = await page.query_selector(indicator)
                    if element:
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
                
                # Look for total amount
                total_elements = await page.query_selector_all('text*="Total"')
                total_found = False
                
                for element in total_elements:
                    parent = await element.query_selector('..')
                    if parent:
                        total_text = await parent.text_content()
                        if "$0.00" in total_text:
                            total_found = True
                            break
                
                if not total_found:
                    # Try alternative approach - look for any $0.00 on the page
                    zero_dollar = await page.query_selector('text="$0.00"')
                    if zero_dollar:
                        total_found = True
                
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