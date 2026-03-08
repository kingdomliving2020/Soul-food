# Soul Food - Product Requirements Document

## Original Problem Statement
Build a full-stack e-commerce and learning platform called "Soul Food" for spiritual education content.

## Tech Stack
- **Frontend**: React with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB
- **Payments**: Stripe integration (Live mode)
- **Email Service**: Resend (kingdom-soul.com)

---

## March 8, 2026 - Bug Fixes Session

### Bugs Fixed ✅

**1. Dynamic Thumbnails Fixed:**
- Product images now dynamically change when Edition dropdown is changed (Adult/Youth/Instructor)
- Added `key` prop with `selectedEdition` to force React re-render
- Cover images correctly mapped:
  - Holiday Adult: `/covers/holiday-ae-front-new.png`
  - Holiday Youth: `/covers/holiday-ye-front.jpg`  
  - Holiday Instructor: `/covers/holiday-ie-front.jpg`
  - Breakfast Adult: `/covers/breakfast-adult-front.jpg`
  - Breakfast Youth: `/covers/breakfast-youth-front.jpg`
  - Breakfast Instructor: `/covers/breakfast-instructor-front.jpg`

**2. Login Persistence After 2FA Fixed:**
- Backend 2FA verify endpoint now returns `user` and `token` data
- Frontend properly handles user data after OTP verification
- Fixed localStorage key mismatch (checking all possible keys: token, soul_food_token, soulFoodToken)
- Users stay logged in when navigating to checkout after registration

### Testing Results (iteration_6.json)
- ✅ Dynamic thumbnails working - all editions correctly displayed
- ✅ Registration creates account and redirects correctly  
- ✅ Login persistence working after registration
- ✅ Cart functionality working

---

## Auth Flow (Implemented)
1. Username/Email + Password → Login
2. If 2FA enabled: Show OTP screen with method selection
   - 📧 Email Code (default)
   - 📱 Authenticator App (TOTP)
   - 📱 SMS (future - needs Twilio)
3. Enter 6-digit code → Verify → Complete login

---

## Prioritized Backlog

### P0 - Critical
- ✅ Login Bug - **FIXED**
- ✅ Auth Flow (Username → OTP) - **IMPLEMENTED**
- ✅ Shipping Dates - **ADDED**
- ✅ Dynamic Thumbnails - **FIXED**
- ✅ Login Persistence - **FIXED**

### P1 - High Priority
- [ ] Map Nibble PDFs to products in payment_routes.py
- [ ] Update Nibble cards with new covers
- [ ] SMS OTP via Twilio (when credentials provided)
- [ ] License Management UI
- [ ] Referral System UI

### P2 - Medium Priority
- [ ] Word Search Game
- [ ] Video Integration
- [ ] Product Catalog Migration to MongoDB

---

## Files Modified This Session
- `/app/frontend/src/QuickOrder.js` - Dynamic thumbnail logic with key prop for re-rendering
- `/app/frontend/src/CheckoutPage.js` - Login persistence fix, OTP user data handling
- `/app/backend/auth_routes_v2.py` - 2FA verify endpoint now returns user data and token

---

## Nibble Content Ready
- 24 PDFs extracted (12 YE + 12 AE) at `/app/content/downloads/`
- New cover images downloaded at `/app/frontend/public/covers/`
