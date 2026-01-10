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
- **Email notifications for orders and contact forms (NEW)**

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

### P1 - High Priority
- [ ] Frontend for Gaming Session Management
- [ ] Frontend for Referral System

### P2 - Medium Priority
- [ ] Cart persistence across browser sessions (localStorage)
- [ ] Add gaming pass restriction disclosures to QuickOrder page
- [ ] Implement Word Search Game
- [ ] RBAC rules for test users

### P3 - Low Priority / Future
- [ ] Migrate hardcoded product catalog to MongoDB
- [ ] User dashboard with purchase history
- [ ] Mobile app strategy (PWA)

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
- **Status**: Not started
- **Impact**: Medium - users lose cart items on refresh

