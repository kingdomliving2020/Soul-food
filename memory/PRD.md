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
- **Email notifications for orders and contact forms**
- **Order lookup and refund system**
- **Gift certificates with professional PDF generation**
- **Shipping address collection for physical items**

## Tech Stack
- **Frontend**: React with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB
- **Payments**: Stripe integration
- **PDF Generation**: reportlab library
- **Email Service**: Resend (kingdom-soul.com)

## User Personas
1. **Individual Learners** - Purchase digital or print workbooks for personal study
2. **Group Leaders** - Buy instructor editions and group subscriptions
3. **Youth Ministers** - Need youth-specific content and gaming features
4. **Book Club Organizers** - Bulk ordering for study groups

---

## What's Been Implemented

### January 10, 2026 - Session 2 Updates
**Status: COMPLETED**

**1. Coupon Discount Bug Fix**
- Fixed: Discounts now correctly transfer to Stripe checkout
- Line items show "(X% off)" label when discount applied
- Verified: $10 item with 50% coupon shows $5.00 in Stripe

**2. Amazon-Style Popup Login**
- Modal login/register form appears on checkout page
- No more redirect to broken `/login` page
- Includes email/password fields, "Create Account" option
- User stays on checkout page throughout flow

**3. Cart Persistence Fix**
- Fixed recurring bug where cart was lost on navigation
- Changed from async localStorage load to synchronous initialization
- Cart now persists across page reloads and navigation

**4. Shipping Address for Physical Items**
- New form section appears when cart contains physical items
- Fields: Street, City, State, ZIP, Country
- Validation prevents checkout without complete address
- Stored with order for fulfillment

**5. Professional Gift Certificate PDF**
- Check-style design matching user's mockup
- Includes: recipient name, amount, voucher #, date, sender
- Green/gold color scheme with decorative borders
- Download link in email + direct endpoint

**6. Spam Folder Note**
- All emails now include yellow banner: "Didn't see this in inbox? Check spam folder!"

**7. Duplicate Email Prevention**
- Atomic database update prevents race condition double-activation

**Files Modified/Created:**
- `payment_routes.py` - Coupon discount to Stripe, shipping address
- `CheckoutPage.js` - Login modal, shipping form, validation
- `CartContext.js` - Synchronous localStorage initialization
- `gift_certificate_routes.py` - PDF download endpoint
- `utils/gift_certificate_pdf.py` - NEW: PDF generator

---

### January 10, 2026 - Order Lookup & Refund System
**Status: COMPLETED**

**Feature**: Complete refund system with customer order lookup and admin refund processing.

**Customer-Facing Features**:
- `/orders/lookup` - Order lookup page (order number + email verification)
- Shows order details, items, download links, and refund eligibility
- "Request Refund" flow with reason selection and item condition
- Pre-order cancellation with automatic Stripe refund
- 30-day return window tracking

**Admin Features**:
- `/admin/orders` - Orders dashboard with search/filter
- View all orders with refund status badges
- Process refunds via Stripe (full, 15% restocking, custom amount)
- Pending refund requests alert

**Refund Policy Page**:
- `/refund-policy` - Complete policy with quick summary
- Digital items: Non-refundable after access/download
- Physical items: 100% unopened, 85% opened (15% restocking)
- Pre-orders: 100% refundable before shipping
- Subscriptions: Cancel 3 days before renewal

**Friendly Order Numbers**:
- New format: `SF-2026-XXXXX` (e.g., SF-2026-ABC12)
- Easier for customers to reference

**Files Created**:
- `/app/backend/routes/order_routes.py` - Order management API
- `/app/frontend/src/OrderLookup.js` - Customer order lookup
- `/app/frontend/src/RefundPolicy.js` - Refund policy page
- `/app/frontend/src/AdminOrders.js` - Admin orders dashboard

**Files Modified**:
- `/app/backend/payment_routes.py` - Added friendly order numbers
- `/app/backend/server.py` - Added order routes
- `/app/frontend/src/App.js` - Added new routes

---

### January 10, 2026 - Gift Certificate Success Page Fix
**Status: COMPLETED**

**Problem**: After completing a Stripe payment for a gift certificate, users were redirected to a blank page.

**Root Causes**:
1. The Emergent script (`emergent-main.js`) was intercepting `fetch` requests and consuming the response body before our code could read it, causing "body stream already read" errors.
2. The `FRONTEND_URL` environment variable was not set, so Stripe redirected to the wrong URL.

**Fixes Implemented**:
1. Switched from `fetch` API to `XMLHttpRequest` in `GiftCertificateSuccess.js` to bypass fetch interception
2. Added `FRONTEND_URL` to backend `.env` file
3. Added "Continue Shopping" and "Proceed to Checkout" buttons as requested

**Files Modified**:
- `/app/frontend/src/GiftCertificateSuccess.js` - XHR-based API calls, new navigation buttons
- `/app/backend/.env` - Added FRONTEND_URL

---

### January 10, 2026 - Gaming Session Frontend
**Status: COMPLETED**

**Feature**: Connected Gaming Central UI to backend session management APIs

**Implementation**:
- **Session Status Panel**: Shows current tier, active session status, and time remaining
- **Time Progress Bar**: Visual display of daily usage vs limit
- **Session Controls**: Start session on game launch, end session button, automatic heartbeat
- **Tier Display**: Shows all tier options with limits (Free/Beta, 30-Day, 90-Day, Ministry)
- **Upgrade Prompts**: Shown when user is low on remaining time
- **Heartbeat System**: Sends keepalive every 60 seconds to prevent idle timeout

**APIs Integrated**:
- `GET /api/gaming/status` - Get current session status
- `POST /api/gaming/start` - Start new gaming session  
- `POST /api/gaming/heartbeat` - Keep session alive
- `POST /api/gaming/end` - End session manually
- `GET /api/gaming/tiers` - Get tier configurations

**Files Modified**:
- `/app/frontend/src/GamingCentral.js` - Complete rewrite with session management

### January 10, 2026 - Critical Bug Fix: Product ID Mismatch & Email Required
**Status: COMPLETED**

**Problem**: Users reported only receiving 1 download (Covenant) instead of all items they ordered ($100+ worth). Email wasn't collected before checkout.

**Root Cause**: Frontend product IDs like `breakfast-full-ae-digital` didn't match backend's `PRODUCT_FILES` mapping which expected `breakfast_ae_digital`.

**Fixes Implemented**:
1. **Expanded PRODUCT_FILES mapping** - Added all frontend-style product IDs with dashes
2. **Created `normalize_product_id()` function** - Attempts multiple transformations to find matching file
3. **Made email required** - Checkout button disabled until email is entered
4. **Added email warning** - Clear message telling users to enter email for download links

**Files Modified**:
- `/app/backend/payment_routes.py` - Expanded PRODUCT_FILES, added normalize_product_id()
- `/app/frontend/src/CheckoutPage.js` - Email required validation, warning message

### January 10, 2026 - Amazon-like Checkout Flow
**Status: COMPLETED & TESTED**

**Feature**: Sign In / Continue as Guest prompt before payment (like Amazon)

**Implementation**:
- New checkout step: `guest-prompt` shows before the main checkout form
- **Sign In** option: Lists benefits (track orders, download history, faster checkout next time)
- **Continue as Guest** option: Proceeds directly to checkout with email collection
- Auto-skips prompt if user is already logged in
- Proper redirect handling: `/login?redirect=/checkout?returning=true`

**Files Modified**:
- `/app/frontend/src/CheckoutPage.js` - Complete rewrite with guest prompt flow

**Test Results**: 100% pass rate (26 backend tests, all frontend UI tests)

### January 10, 2026 - PDF Table of Contents Improvement
**Status: COMPLETED**

**Feature**: Professional TOC with dotted leader lines connecting titles to page numbers

**Implementation**:
- Created custom `TOCEntryWithLeader` Flowable class using reportlab
- Draws dotted leader lines between entry title and page number
- Supports chapter headers (bold, colored) and sub-entries (indented)
- Clean, professional appearance similar to published books

**Files Modified**:
- `/app/backend/utils/pdf_generator.py` - Custom TOC flowable implementation

**Features Implemented**:
1. Resend email service integration with kingdom-soul.com
2. Order confirmation emails (with download links for digital products)
3. Contact form → support@kingdom-soul.com
4. Bulk order notifications → support@kingdom-soul.com (replaced kingdomlivingproject@gmail.com)
5. Customer email collection on checkout page

**Email Configuration**:
- From: noreply@kingdom-soul.com
- Reply-To: support@kingdom-soul.com
- Footer: "This inbox isn't monitored. For help, contact support@kingdom-soul.com"

**Files Created**:
- `/app/backend/email_service.py` - Email templates and sending functions
- `/app/backend/routes/email_routes.py` - Contact form API endpoint
- `/app/frontend/src/ContactForm.js` - Contact form component

**Files Modified**:
- `/app/backend/.env` - Added Resend API key and email config
- `/app/backend/payment_routes.py` - Added email sending to free orders and bulk notifications
- `/app/frontend/src/CheckoutPage.js` - Added email/name inputs for order confirmations

**ACTION REQUIRED**: Verify domain in Resend dashboard to enable email sending

### January 10, 2026 - P0 Bug Fix: 100% Discount Free Order Flow
**Status: COMPLETED & TESTED**

**Problem**: When users applied a 100% discount coupon, the cart emptied but users couldn't access their purchased downloads.

**Solution Implemented**:
1. Updated `/api/payments/free-order` endpoint to generate download links for digital products
2. Created `/api/payments/order/{order_id}` endpoint to fetch order details with download info
3. Updated `OrderSuccess.js` to display download links with working download buttons
4. Fixed datetime timezone comparison bug in `download_protection.py`

**Test Results**: 100% pass rate (13 backend tests, 11 frontend tests)

---

## Prioritized Backlog

### P0 - Critical (Blocking Users)
- ~~100% discount checkout bug~~ ✅ FIXED
- ~~Email notifications for orders~~ ✅ IMPLEMENTED
- ~~Amazon-like checkout flow~~ ✅ IMPLEMENTED
- ~~PDF Table of Contents quality~~ ✅ IMPROVED
- ~~Gift certificate blank success page~~ ✅ FIXED
- ~~Order lookup and refund system~~ ✅ IMPLEMENTED

### P1 - High Priority
- [x] Gift certificates added to main cart (completed in previous session)
- [x] Instructor Toolbox gated area ✅ COMPLETED Feb 2026
- [ ] Frontend for Referral System

### P2 - Medium Priority
- [x] Add gaming pass restriction disclosures to QuickOrder page ✅ COMPLETED Feb 2026
- [ ] Cart persistence across browser sessions (localStorage)
- [ ] Implement Word Search Game
- [ ] RBAC rules for test users
- [ ] Coupon System Refactor - Migrate from hardcoded to MongoDB

### P3 - Low Priority / Future
- [ ] Migrate hardcoded product catalog to MongoDB
- [ ] User dashboard with purchase history
- [ ] Mobile app strategy (PWA)
- [ ] Individual Breakfast lesson PDFs (need page ranges from user)

---

## February 22, 2026 - Holiday Bonus Lessons & Game Pass Disclosures

### Status: COMPLETED

**1. Holiday Bonus Lessons Implementation**
- **AE (Adult Edition)**: FREE - Available in Free Lessons section with download button
- **YE (Youth Edition)**: FREE - Available in Free Lessons section with download button  
- **IE (Instructor Edition)**: $9.99 PAID - Available in Merchandise section
- PDF files uploaded: `bonus-ae-holiday.pdf`, `bonus-ye-holiday.pdf`, `bonus-ie-holiday.pdf`
- Downloads served from `/app/content/downloads/` via lesson download endpoint

**2. Game Pass Restriction Disclosures**
- New "Gaming Access" section added to QuickOrder page
- 30-Day Game Pass: Shows "⚠️ 4 hrs/day limit • 20 min idle timeout"
- 90-Day Game Pass: Shows "⚠️ 5 hrs/day limit • 30 min idle timeout"
- Edition badges (Adult/Youth/Instructor) displayed for each pass
- "Best Value" badge on 90-day pass

**3. Instructor Toolbox (Gated Area)**
- New `/instructor-toolbox` route - requires instructor role to access
- **Answer Keys**: Browse and download lesson answer guides (8 Breakfast + 4 Holiday)
- **Facilitation Notes**: Teaching tips and discussion guides
- **Group Roster**: Manage study group members and track progress (CRUD API ready)
- **Game Setup**: GRinCH and Passport Trek configuration guides
- **Teaching Resources**: Printables, slides, attendance sheets
- **Achievement Awards**: Certificate printing and medallion ordering links

**Files Created**:
- `/app/frontend/src/InstructorToolbox.js` - Instructor portal UI
- `/app/backend/routes/instructor_routes.py` - API endpoints for instructor content

**Files Modified**:
- `/app/backend/payment_routes.py` - Added bonus lesson products and file mappings
- `/app/frontend/src/QuickOrder.js` - Updated Free Lessons, added Gaming Access section
- `/app/frontend/src/App.js` - Added InstructorToolbox route
- `/app/backend/server.py` - Registered instructor routes
- `/app/backend/.env` - Added JWT_SECRET_KEY for consistent auth

**Test Credentials**:
- Username: `instructor` / Password: `test123` (Beta login tab)

---

## Email System Configuration

### Email Addresses (kingdom-soul.com)
| Address | Purpose |
|---------|---------|
| noreply@kingdom-soul.com | FROM address for transactional emails |
| support@kingdom-soul.com | Customer support (Reply-To) |
| billing@kingdom-soul.com | Billing inquiries (forwards to Gmail) |
| admin@kingdom-soul.com | Admin/security notices (forwards to Gmail) |

### Email Types Implemented
1. **Order Confirmation** - Sent to customer after successful order
2. **Download Delivery** - Contains download links for digital products
3. **Contact Form** - Notifications to support@kingdom-soul.com
4. **Bulk Order Alert** - Notifications for orders >25 items

### DNS Requirements (Add to kingdom-soul.com)
- SPF record
- DKIM record (from Resend dashboard)
- DMARC record (start with p=none)

---

## API Endpoints Reference

### Email
- `POST /api/email/contact` - Submit contact form
- `GET /api/email/config` - Get email configuration (topics list)

### Payments
- `POST /api/payments/free-order` - Process 100% discount orders (now sends email)
- `POST /api/payments/checkout/cart` - Create Stripe checkout session
- `GET /api/payments/order/{order_id}` - Get order details with downloads
- `POST /api/payments/notify-large-order` - Send bulk order notification (now emails support@)

### Downloads
- `GET /api/downloads/file/{token}` - Download file with token verification
- `GET /api/downloads/remaining/{token}` - Check download token status

---

## Known Issues

### Domain Not Verified in Resend
- **Status**: Pending user action
- **Impact**: Emails will not be sent until domain is verified
- **Solution**: User must verify kingdom-soul.com in Resend dashboard and add DNS records

### Cart Persistence
- **Status**: FIXED (January 10, 2026)
- **Impact**: None - issue resolved
- **Solution**: Changed to synchronous localStorage initialization

---

## January 11, 2026 - Session 3 Updates

### 1. Gift Certificate Coupon Code Field
**Status: COMPLETED**

**Feature**: Added coupon code input field to the Gift Certificate purchase page.

**Implementation**:
- New "Have a coupon code?" section with input field and Apply button
- Validates coupons via `/api/coupons/validate` endpoint
- Shows discount percentage and updated price summary
- Price breakdown: Certificate Value, Discount, Total to Pay
- Backend modified to apply discount to Stripe checkout amount
- Supports 100% discount (free gift certificate checkout flow)

**Files Modified**:
- `/app/frontend/src/GiftCertificate.js` - Coupon state, validation, UI
- `/app/backend/routes/gift_certificate_routes.py` - Accept coupon_code, apply discount

---

### 2. Interactive Lessons Navigation Bug Fix
**Status: COMPLETED**

**Problem**: Users reported that clicking on interactive lessons always redirected to the "covenant" lesson regardless of which lesson was selected.

**Root Cause**: The `holidayLessons` array in QuickOrder.js used short IDs (`covenant`, `cradle`, `cross`, `comforter`) that didn't match the backend's expected full IDs (`holiday-ae-covenant`, etc.).

**Fix Implemented**:
- Changed holiday lesson IDs from short names to full IDs:
  - `covenant` → `holiday-ae-covenant`
  - `cradle` → `holiday-ae-cradle`
  - `cross` → `holiday-ae-cross`
  - `comforter` → `holiday-ae-comforter`
- Updated default fallback lesson ID

**Files Modified**:
- `/app/frontend/src/QuickOrder.js` - Lines 172-177 (holidayLessons array)

---

### 3. Gift Certificate Cart Integration
**Status: COMPLETED**

**Feature**: Allow customers to add gift certificates to their main cart and pay for everything at once.

**Implementation**:
- New `addGiftCertificateToCart()` function in CartContext
- "Add to Cart" button on Gift Certificate page alongside "Purchase Now"
- Gift certificate items stored with full metadata (recipient, sender, amount, message)
- Backend payment_routes.py processes gift certificates in cart checkout
- Gift certificate automatically created and emailed to recipient after successful payment
- Unique key per gift certificate to allow multiple in cart

**Files Modified**:
- `/app/frontend/src/GiftCertificate.js` - Add to Cart button, form validation
- `/app/frontend/src/CartContext.js` - addGiftCertificateToCart, hasGiftCertificates functions
- `/app/backend/payment_routes.py` - Gift certificate processing in checkout status handler

---

## January 11, 2026 - Breakfast Series Full Lesson Structure
**Status: COMPLETED**

**Feature**: Added all 24 Breakfast lessons (12 AE + 12 YE) with correct IDs and exact titles from curriculum.

**Lesson ID Format**: `breakfast-{ae|ye}-{theme}-{lesson#}`
- Month 1 (Prayer): `breakfast-ae-prayer-1` through `breakfast-ae-prayer-4`
- Month 2 (Through): `breakfast-ae-through-1` through `breakfast-ae-through-4`
- Month 3 (Faith): `breakfast-ae-faith-1` through `breakfast-ae-faith-4`

**All 12 Lessons per Edition**:

| # | Theme | AE Title | YE Title (where different) |
|---|-------|----------|---------------------------|
| 1 | Prayer | Esther: Second Is the Best | Same |
| 2 | Prayer | Solomon: The Question That Unlocked a Legacy | Solomon: Wisdom in Response |
| 3 | Prayer | Jesus: Prayer the First Resort | Jesus |
| 4 | Prayer | Paul & Silas: Faith in the Dark | Paul & Silas |
| 5 | Through | Joseph – The Young Dreamer | Same |
| 6 | Through | Hannah – Barren but Not Lifeless | Same |
| 7 | Through | Abram – No Heir, Wait Here | Same |
| 8 | Through | Victory Through the Blood | Chronic Conditions |
| 9 | Faith | Rahab: Faith That Took Action | Same |
| 10 | Faith | Abigail: Wisdom on the Move | Same |
| 11 | Faith | The Centurion: Faith That Commands Results | Same |
| 12 | Faith | Joseph of Arimathea: Trust the Process | Same |

**Snack Packs Created** (7 total):
- In His Image (FREE)
- Breakfast AE: Prayer, Through, Faith ($12.99 each)
- Breakfast YE: Prayer, Through, Faith ($10.99 each)

**Files Modified**:
- `/app/backend/routes/lessons.py` - Full BREAKFAST_AE_NIBBLES and BREAKFAST_YE_NIBBLES arrays
- `/app/backend/payment_routes.py` - Product file mappings for all 24 nibbles
- `/app/frontend/src/QuickOrder.js` - Updated breakfastLessons with correct IDs and titles

---

## Prioritized Backlog

### P0 - Critical
- ~~Gift Certificate Coupon Field~~ **DONE**
- ~~Interactive Lessons Navigation Bug~~ **DONE**
- ~~Gift Certificate Cart Integration~~ **DONE**
- ~~Breakfast Series Full Lesson Structure~~ **DONE**

### P1 - High Priority
- Game Pass Restriction Disclosures (add "4 hrs/day" to QuickOrder game passes)
- Frontend for Referral System
- Full Instructor Role Functionality (per INSTRUCTOR_BUILD_SPEC.md)
- RBAC Rules for Test Users (test_ie, test_ye, test_ae)

### P2 - Medium Priority
- Word Search Game (replace placeholder)
- Custom Domain Linking (blocked on Emergent Support)

### P3 - Tech Debt
- Migrate hardcoded product catalog to MongoDB `products` collection
- Mobile app strategy (PWA)

