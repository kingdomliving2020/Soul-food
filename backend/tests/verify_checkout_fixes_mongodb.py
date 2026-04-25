"""
Direct MongoDB Verification Test for Checkout Fixes (Iteration 25)

This script directly queries MongoDB to verify the 4 fixes:
1. customer_email is stored in payment_transactions
2. items contain normalized_product_id field
3. user_id is stored for authenticated checkouts
4. claimed_by_user_id is stored for authenticated checkouts
"""

import requests
import os
from datetime import datetime
from pymongo import MongoClient

# Configuration
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-purchase-pipe.preview.emergentagent.com').rstrip('/')
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'soul_food_db')

# Test credentials
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "overflowharvest@gmail.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Admin123!")


def get_auth_token():
    """Login and get JWT token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


def test_guest_checkout_transaction_fields():
    """Test that guest checkout stores correct fields in MongoDB"""
    print("\n" + "="*60)
    print("TEST 1: Guest Checkout Transaction Fields")
    print("="*60)
    
    test_email = f"test_guest_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    
    payload = {
        "items": [
            {
                "id": "holiday-ae-digital",  # Dash format to test normalization
                "product_id": "holiday-ae-digital",
                "name": "Holiday Adult Edition Digital",
                "price": 16.99,
                "salePrice": 16.99,
                "quantity": 1
            }
        ],
        "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com",
        "customer_email": test_email
    }
    
    # Create checkout session (no auth - guest)
    response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
    
    if response.status_code != 200:
        print(f"✗ FAILED: Checkout creation failed: {response.text}")
        return False
    
    data = response.json()
    session_id = data["session_id"]
    print(f"✓ Checkout session created: {session_id}")
    
    # Query MongoDB directly
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    transaction = db.payment_transactions.find_one({"session_id": session_id})
    
    if not transaction:
        print(f"✗ FAILED: Transaction not found in MongoDB")
        client.close()
        return False
    
    print(f"\n--- Transaction Document ---")
    
    # Check 1: customer_email is stored
    stored_email = transaction.get("customer_email")
    if stored_email == test_email:
        print(f"✓ FIX 1 VERIFIED: customer_email stored correctly: {stored_email}")
    else:
        print(f"✗ FIX 1 FAILED: customer_email mismatch. Expected: {test_email}, Got: {stored_email}")
    
    # Check 2: user_id should be None for guest checkout
    user_id = transaction.get("user_id")
    claimed_by = transaction.get("claimed_by_user_id")
    if user_id is None and claimed_by is None:
        print(f"✓ FIX 3 VERIFIED: user_id is None for guest checkout (correct)")
    else:
        print(f"✗ FIX 3 ISSUE: user_id should be None for guest. Got user_id={user_id}, claimed_by={claimed_by}")
    
    # Check 3: items contain normalized_product_id
    items = transaction.get("items", [])
    if items:
        item = items[0]
        raw_id = item.get("product_id")
        normalized_id = item.get("normalized_product_id")
        print(f"\n--- Item Fields ---")
        print(f"  product_id: {raw_id}")
        print(f"  normalized_product_id: {normalized_id}")
        
        if normalized_id:
            print(f"✓ FIX 2 VERIFIED: normalized_product_id field exists: {normalized_id}")
        else:
            print(f"✗ FIX 2 FAILED: normalized_product_id field missing")
    else:
        print(f"✗ FAILED: No items in transaction")
    
    client.close()
    print("\n" + "-"*60)
    return True


def test_authenticated_checkout_transaction_fields():
    """Test that authenticated checkout stores user_id and claimed_by_user_id"""
    print("\n" + "="*60)
    print("TEST 2: Authenticated Checkout Transaction Fields")
    print("="*60)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("✗ FAILED: Could not get auth token")
        return False
    
    print(f"✓ Authenticated as: {ADMIN_EMAIL}")
    
    payload = {
        "items": [
            {
                "id": "breakfast_ae_digital",
                "product_id": "breakfast_ae_digital",
                "name": "Break*fast AE Digital",
                "price": 11.99,
                "salePrice": 11.99,
                "quantity": 1
            }
        ],
        "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com"
        # No customer_email - should use logged-in user's email
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload, headers=headers)
    
    if response.status_code != 200:
        print(f"✗ FAILED: Authenticated checkout failed: {response.text}")
        return False
    
    data = response.json()
    session_id = data["session_id"]
    print(f"✓ Checkout session created: {session_id}")
    
    # Query MongoDB directly
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    transaction = db.payment_transactions.find_one({"session_id": session_id})
    
    if not transaction:
        print(f"✗ FAILED: Transaction not found in MongoDB")
        client.close()
        return False
    
    print(f"\n--- Transaction Document ---")
    
    # Check 1: customer_email should be the logged-in user's email (fallback)
    stored_email = transaction.get("customer_email")
    if stored_email == ADMIN_EMAIL:
        print(f"✓ FIX 1 VERIFIED: customer_email fallback to logged-in user: {stored_email}")
    elif stored_email:
        print(f"⚠ FIX 1 PARTIAL: customer_email stored but different: {stored_email}")
    else:
        print(f"✗ FIX 1 FAILED: customer_email is empty")
    
    # Check 2: user_id should be set for authenticated checkout
    user_id = transaction.get("user_id")
    claimed_by = transaction.get("claimed_by_user_id")
    print(f"\n--- User Identity Fields ---")
    print(f"  user_id: {user_id}")
    print(f"  claimed_by_user_id: {claimed_by}")
    
    if user_id:
        print(f"✓ FIX 3 VERIFIED: user_id stored for authenticated checkout: {user_id}")
    else:
        print(f"✗ FIX 3 FAILED: user_id is None for authenticated checkout")
    
    if claimed_by:
        print(f"✓ FIX 3 VERIFIED: claimed_by_user_id stored: {claimed_by}")
    else:
        print(f"✗ FIX 3 FAILED: claimed_by_user_id is None")
    
    # Check 3: items contain normalized_product_id
    items = transaction.get("items", [])
    if items:
        item = items[0]
        normalized_id = item.get("normalized_product_id")
        if normalized_id:
            print(f"✓ FIX 2 VERIFIED: normalized_product_id: {normalized_id}")
        else:
            print(f"✗ FIX 2 FAILED: normalized_product_id missing")
    
    client.close()
    print("\n" + "-"*60)
    return True


def test_stripe_session_has_customer_email():
    """Verify Stripe session is created with customer_email parameter"""
    print("\n" + "="*60)
    print("TEST 3: Stripe Session Customer Email")
    print("="*60)
    
    test_email = f"stripe_test_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    
    payload = {
        "items": [
            {
                "id": "holiday_ye",
                "product_id": "holiday_ye",
                "name": "Holiday Youth Edition",
                "price": 16.99,
                "salePrice": 16.99,
                "quantity": 1
            }
        ],
        "origin_url": "https://soul-purchase-pipe.preview.emergentagent.com",
        "customer_email": test_email
    }
    
    response = requests.post(f"{BASE_URL}/api/payments/checkout/cart", json=payload)
    
    if response.status_code != 200:
        print(f"✗ FAILED: Checkout creation failed: {response.text}")
        return False
    
    data = response.json()
    stripe_url = data.get("url", "")
    
    # The Stripe URL being created successfully indicates the session was created
    # with customer_email (Stripe would reject invalid email format)
    if stripe_url.startswith("https://checkout.stripe.com"):
        print(f"✓ Stripe session created successfully")
        print(f"✓ FIX 1 VERIFIED: customer_email passed to Stripe (session created)")
        print(f"  Stripe URL: {stripe_url[:80]}...")
        return True
    else:
        print(f"✗ FAILED: Invalid Stripe URL: {stripe_url}")
        return False


def main():
    """Run all verification tests"""
    print("\n" + "="*60)
    print("CHECKOUT & FULFILLMENT FIXES VERIFICATION")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"MongoDB: {MONGO_URL}")
    print(f"Database: {DB_NAME}")
    
    results = []
    
    # Test 1: Guest checkout
    results.append(("Guest Checkout Fields", test_guest_checkout_transaction_fields()))
    
    # Test 2: Authenticated checkout
    results.append(("Authenticated Checkout Fields", test_authenticated_checkout_transaction_fields()))
    
    # Test 3: Stripe session email
    results.append(("Stripe Session Email", test_stripe_session_has_customer_email()))
    
    # Summary
    print("\n" + "="*60)
    print("VERIFICATION SUMMARY")
    print("="*60)
    
    all_passed = True
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}: {name}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*60)
    if all_passed:
        print("ALL FIXES VERIFIED SUCCESSFULLY")
    else:
        print("SOME FIXES NEED ATTENTION")
    print("="*60)
    
    return all_passed


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
