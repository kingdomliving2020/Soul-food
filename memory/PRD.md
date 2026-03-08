# Soul Food - Product Requirements Document

## Original Problem Statement
Build a full-stack e-commerce and learning platform called "Soul Food" for spiritual education content. The platform sells digital workbooks, physical workbooks, game passes, and subscriptions for Bible study curriculum.

## Core Requirements
- Product catalog with multiple editions (Adult, Youth, Instructor)
- Shopping cart and checkout with Stripe integration
- Digital download protection for purchased content
- 100% discount coupon support for promotional access
- Gaming center with session management
- Referral system for user growth
- Email notifications for orders and contact forms
- Order lookup and refund system
- Gift certificates with professional PDF generation
- Shipping address collection for physical items
- Audio code system for trackable access codes

## Tech Stack
- **Frontend**: React with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB
- **Payments**: Stripe integration (Live mode)
- **PDF Generation**: reportlab library
- **Email Service**: Resend (kingdom-soul.com)

---

## March 8, 2026 - Multiple Bug Fixes

### Status: COMPLETED ✅

**Issues Fixed:**

1. **Checkout Error Handling (Improved)**
   - Added proper error message display for `account_required` errors
   - Shows which items require an account
   - Prompts login modal when account is needed
   - Added Authorization header when user is logged in

2. **Game Pass Icons Fixed**
   - Replaced broken `/images/bounty-stack-token.png` with 🎮 emoji
   - Updated both 30-Day and 90-Day pass cards
   - Icons now display in a gradient purple/indigo box

3. **2FA/OTP Verification Setup**
   - Created `/app/frontend/src/TwoFactorVerify.js` for login verification
   - Added `/2fa-verify` route to App.js
   - Added `/api/auth/2fa/resend` backend endpoint for resending codes
   - Complete flow: Login → 2FA prompt → Verify code → Continue

**Files Modified:**
- `/app/frontend/src/CheckoutPage.js` - Better error handling, auth headers
- `/app/frontend/src/QuickOrder.js` - Game pass icons to emoji
- `/app/frontend/src/App.js` - Added TwoFactorVerify route
- `/app/frontend/src/TwoFactorVerify.js` - NEW: 2FA verification page
- `/app/backend/auth_routes_v2.py` - Added 2FA resend endpoint

---

## March 7, 2026 - Shopping Cart & Image Updates

### Status: COMPLETED ✅

**Shopping Cart Bug Fixes:**
- Items no longer disappear when adding to cart
- Quantity +/- buttons work correctly
- Game passes combinable with other items
- Added `e.stopPropagation()` to delete buttons
- Added 50ms delay to cart opening

**Image Updates:**
- Holiday AE cover updated in both locations:
  - `/app/frontend/public/covers/holiday-ae-front.jpg`
  - `/app/frontend/public/images/holiday-cover-ae.png`

**Performance Fix:**
- Fixed unbounded query in server.py (added limit=500)

---

## Key Technical Concepts

**Cart State Management (React Context):**
- CartProvider wraps entire app in App.js
- localStorage used for persistence with `soulFoodCart` key
- Synchronous initialization to prevent race conditions
- useEffect saves cart changes to localStorage

**2FA Authentication Flow:**
1. User logs in with email/password
2. If 2FA enabled, backend returns `requires_2fa_verification: true`
3. Frontend redirects to `/2fa-verify`
4. User enters code from email or authenticator app
5. Backend verifies and returns full auth token
6. User continues to original destination

---

## Prioritized Backlog

### P0 - Critical
- ~~Shopping Cart Bug~~ **FIXED March 7, 2026**
- ~~Checkout Error Handling~~ **FIXED March 8, 2026**
- ~~Game Pass Icons~~ **FIXED March 8, 2026**
- ~~2FA Verification Page~~ **FIXED March 8, 2026**

### P1 - High Priority
- [ ] Process IE Breakfast PDF files (waiting on user upload)
- [ ] License Management UI for instructors
- [ ] Frontend for Referral System

### P2 - Medium Priority
- [ ] Word Search Game (replace placeholder)
- [ ] Custom Domain Linking
- [ ] Video Integration in My Library dashboard

### P3 - Tech Debt
- [ ] Migrate hardcoded product catalog to MongoDB `products` collection
- [ ] Add more pagination to database queries

---

## Files Reference

**Authentication:**
- `/app/frontend/src/AuthPage.js` - Login/Register
- `/app/frontend/src/TwoFactorSetup.js` - 2FA setup
- `/app/frontend/src/TwoFactorVerify.js` - 2FA login verification
- `/app/backend/auth_routes_v2.py` - Auth API endpoints

**Cart System:**
- `/app/frontend/src/CartContext.js` - Central cart state management
- `/app/frontend/src/ShoppingCart.js` - Cart dropdown component
- `/app/frontend/src/QuickOrder.js` - Quick order page with inline cart
- `/app/frontend/src/CheckoutPage.js` - Checkout flow

**Content Downloads:**
- `/app/content/downloads/` - All PDF workbooks and lesson files

---

## Test Reports
- `/app/test_reports/iteration_5.json` - Cart bug fix verification (100% pass)
