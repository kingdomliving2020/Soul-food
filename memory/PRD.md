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

## March 7, 2026 - Shopping Cart Bug Fixes

### Status: COMPLETED ✅

**Issues Fixed:**
1. **Items disappearing from cart** - Cart items would vanish when adding new items
2. **Quantity adjustment not working** - +/- buttons for game passes weren't functional
3. **Items not combinable** - Game passes couldn't be combined with other cart items

**Root Cause:**
When the cart auto-opened after adding an item, click events were propagating through to the delete button, causing the newly added item to be immediately removed.

**Fixes Implemented:**
1. Added `e.stopPropagation()` to delete buttons in:
   - `/app/frontend/src/QuickOrder.js` (line 862-867)
   - `/app/frontend/src/ShoppingCart.js` (line 106-112)
2. Added 50ms delay before opening cart in `/app/frontend/src/CartContext.js` (line 176) to prevent race conditions

**Testing Results:** 100% pass rate (7/7 cart features working)
- ✅ Add game pass to cart
- ✅ Increase quantity with + button
- ✅ Decrease quantity with - button
- ✅ Add multiple different items
- ✅ Remove single item with trash icon
- ✅ Multiple items show correct total
- ✅ Cart persists after page refresh

**Content Update:**
- Replaced corrected PDF: `/app/content/downloads/breakfast-ye-month3-snackpack.pdf`

---

## February 27, 2026 - Audio System & UI Updates

### Status: COMPLETED

**Audio Pricing & Code System:**
- Pricing: $2.49/lesson, $7.99/4-lesson bundle (20% savings)
- Trackable Code Format: `YMMDD-PHONE5-ELV`
- Backend endpoints: generate, redeem, decode, search codes
- Webhook integration for physical book purchases
- Email integration for order confirmations

**My Audio Library:**
- New section in MyLibrary.js for unlocked audio content
- Play/pause functionality for each lesson

---

## Key Technical Concepts

**Cart State Management (React Context):**
- CartProvider wraps entire app in App.js
- localStorage used for persistence with `soulFoodCart` key
- Synchronous initialization to prevent race conditions
- useEffect saves cart changes to localStorage

**PDF Manipulation (pypdf):**
- Used to combine multi-part PDFs
- Split larger files into individual lessons ("Nibble" extraction)

---

## Prioritized Backlog

### P0 - Critical
- ~~Shopping Cart Bug~~ **FIXED March 7, 2026**
- ~~Audio Pricing & Trackable Code System~~ **DONE Feb 27, 2026**

### P1 - High Priority
- [ ] Process IE Breakfast PDF files (waiting on user upload)
- [ ] License Management UI for instructors
- [ ] Frontend for Referral System
- [ ] Verify AE HOL thumbnail is correct (user reported as "outdated")

### P2 - Medium Priority
- [ ] Word Search Game (replace placeholder)
- [ ] Custom Domain Linking
- [ ] Video Integration in My Library dashboard

### P3 - Tech Debt
- [ ] Migrate hardcoded product catalog to MongoDB `products` collection
- [ ] Paginate unbounded database queries (server.py ~line 375)

---

## Files Reference

**Cart System:**
- `/app/frontend/src/CartContext.js` - Central cart state management
- `/app/frontend/src/ShoppingCart.js` - Cart dropdown component (SoulFoodApp)
- `/app/frontend/src/QuickOrder.js` - Quick order page with inline cart

**Content Downloads:**
- `/app/content/downloads/` - All PDF workbooks and lesson files

**Backend Routes:**
- `/app/backend/payment_routes.py` - Stripe checkout and webhooks
- `/app/backend/audio_routes.py` - Audio code system

---

## Test Reports
- `/app/test_reports/iteration_5.json` - Cart bug fix verification (100% pass)
