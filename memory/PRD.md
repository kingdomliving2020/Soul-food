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

## Tech Stack
- **Frontend**: React with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB
- **Payments**: Stripe integration
- **PDF Generation**: reportlab library

## User Personas
1. **Individual Learners** - Purchase digital or print workbooks for personal study
2. **Group Leaders** - Buy instructor editions and group subscriptions
3. **Youth Ministers** - Need youth-specific content and gaming features
4. **Book Club Organizers** - Bulk ordering for study groups

---

## What's Been Implemented

### January 10, 2026 - P0 Bug Fix: 100% Discount Free Order Flow
**Status: COMPLETED & TESTED**

**Problem**: When users applied a 100% discount coupon, the cart emptied but users couldn't access their purchased downloads.

**Solution Implemented**:
1. Updated `/api/payments/free-order` endpoint to generate download links for digital products
2. Created `/api/payments/order/{order_id}` endpoint to fetch order details with download info
3. Updated `OrderSuccess.js` to display download links with working download buttons
4. Fixed datetime timezone comparison bug in `download_protection.py`

**Files Modified**:
- `/app/backend/payment_routes.py` - Added download link generation to free-order endpoint
- `/app/backend/download_protection.py` - Fixed timezone comparison bug
- `/app/frontend/src/OrderSuccess.js` - Complete rewrite for proper download display
- `/app/frontend/src/CheckoutPage.js` - Store download links in sessionStorage

**Test Results**: 100% pass rate (13 backend tests, 11 frontend tests)

### Previous Session Work (Already Complete)
- Product Catalog & UI Sync
- Download Protection Implementation
- Gaming Session Management Backend
- Checkout Enhancements (coupon minimum, gift options, order notes)
- Referral System API
- Book Club Bulk Ordering
- Major UI/UX Overhaul

---

## Prioritized Backlog

### P0 - Critical (Blocking Users)
- ~~100% discount checkout bug~~ ✅ FIXED

### P1 - High Priority
- [ ] Amazon-like checkout flow (login/guest prompt before payment)
- [ ] PDF Table of Contents quality improvement
- [ ] Frontend for Gaming Session Management
- [ ] Frontend for Referral System

### P2 - Medium Priority
- [ ] Cart persistence across browser sessions (localStorage)
- [ ] Add gaming pass restriction disclosures to QuickOrder page
- [ ] Implement Word Search Game
- [ ] RBAC rules for test users

### P3 - Low Priority / Future
- [ ] Migrate hardcoded product catalog to MongoDB
- [ ] Email notifications for orders
- [ ] User dashboard with purchase history
- [ ] Mobile app strategy (PWA)

---

## Known Issues

### Cart Persistence
- **Status**: Recurring
- **Impact**: Medium - users lose cart items on refresh
- **Root Cause**: Cart stored in React state only, not persisted

### PDF TOC Quality
- **Status**: Not Started
- **Impact**: Medium - auto-generated PDFs have poor formatting
- **Root Cause**: Basic reportlab TOC implementation

---

## Architecture Notes

### Product Catalog
Products are currently hardcoded in two places:
- `/app/frontend/src/QuickOrder.js` - Frontend product display
- `/app/backend/payment_routes.py` - Backend pricing (PRODUCTS dict)

**Technical Debt**: Should migrate to MongoDB `products` collection

### Download Protection
- Tokens expire after 72 hours
- Max 3 downloads per file per order
- Tokens are hashed before storage (SHA256)
- Files stored in `/app/backend/lesson_pdfs/`

### Gaming Session Management
- Backend complete in `/app/backend/gaming_session_manager.py`
- Tiers: basic (4hr/day), premium (8hr/day), unlimited
- Idle timeout: 10 minutes
- Frontend UI not yet connected

---

## API Endpoints Reference

### Payments
- `POST /api/payments/free-order` - Process 100% discount orders with download links
- `POST /api/payments/checkout/cart` - Create Stripe checkout session
- `GET /api/payments/order/{order_id}` - Get order details with downloads
- `GET /api/payments/products` - Get product catalog

### Downloads
- `GET /api/downloads/file/{token}` - Download file with token verification
- `GET /api/downloads/remaining/{token}` - Check download token status
- `POST /api/downloads/resend-links` - Regenerate expired download links

### Gaming
- `POST /api/gaming/start` - Start gaming session
- `POST /api/gaming/heartbeat` - Keep session alive
- `POST /api/gaming/end` - End gaming session
- `GET /api/gaming/status` - Get current session status

### Referrals
- `POST /api/referrals/create` - Create referral code
- `GET /api/referrals/validate/{code}` - Validate referral code
