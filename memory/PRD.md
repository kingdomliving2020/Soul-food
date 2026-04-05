# Soul Food - Product Requirements Document

## Original Problem Statement
Build and refine a full-stack e-commerce and learning platform, "Soul Food." Supports physical and digital sales via Stripe, guest checkout with post-purchase redemption, "My Library" for digital downloads, and comprehensive UI/UX refinements.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, LocalStorage cart
- **Backend**: FastAPI, MongoDB
- **Payments**: Stripe Checkout Sessions + Webhooks
- **File Delivery**: PDF delivery via secure download tokens

## Core Architecture
```
/app/
  backend/
    server.py, payment_routes.py, coupon_routes.py
    routes/ (auth_routes_v2.py, lessons.py, admin_routes.py)
  frontend/src/
    App.js, SoulFoodApp.js (landing page), QuickOrder.js, CheckoutPage.js
    PaymentSuccess.js, MyLibrary.js, RefundRequest.js
  content/downloads/ (PDFs + nibbles/ subdirectory)
```

## Key DB Schema
- `users`: email, name, hashed_password, two_factor_enabled
- `payment_transactions`: session_id, amount_total, items, customer_email, payment_status
- `download_links`: order_id, token, file_path, expires_at
- `coupons`: code, active, discount_percent, override_total

## What's Been Implemented

### Soft Launch Update #2 (Apr 5, 2026)
- [x] Only Holiday + Breakfast Month 1 (Prayer the First Resort) content available
- [x] Breakfast Months 2 (Through) & 3 (Faith) marked as "Coming Soon" / disabled
- [x] Game Passes 20% off — NO COUPON REQUIRED until Pentecost (May 24, 2026)
  - 30-Day: $7.99 → $6.39
  - 90-Day: $24.99 → $19.99
- [x] Backend promo_sale_price + promo_until fields for auto-expiry
- [x] Early Bird Pentecost countdown timer in banner
- [x] SoulFoodApp.js landing page updated: "HE IS RISEN! SOUL FOOD IS LIVE!"
- [x] Launch status badges on landing page (Holiday available, pre-orders open, game pass 20% off)
- [x] Lunch pre-order dates updated to "Ships May-Jun 2026"
- [x] Preview modal shows "Coming Soon" for Breakfast Month 2/3 themes
- [x] Mobile responsiveness verified at 375px

### Soft Launch Update #1 (Apr 5, 2026)
- [x] "He Is Risen! Soul Food Is LIVE!" banner on Quick Order
- [x] Holiday Series: Available NOW (all editions, current pricing)
- [x] Break*fast pre-order: $3 off full workbooks
- [x] Lunch pre-order: $3 off until Pentecost
- [x] Break*fast Snack Pack Month 1 + Nibbles: Available NOW
- [x] Holiday Nibbles: Available NOW
- [x] Merchandise: Only bookmarks available, rest pre-order
- [x] Single coupon enforcement ("one per order")
- [x] Fixed PaymentSuccess.js webhook race condition (useRef polling)
- [x] 24 breakfast nibble PDFs mapped to backend catalog

### Previously Completed
- [x] Dynamic thumbnails, login persistence, guest checkout, qty selectors
- [x] Game Packs, My Library, Refund page, branding updates
- [x] DOLLARTEST $1 coupon, free "In His Image" downloads

## Content Availability Status
| Content | Status | Notes |
|---------|--------|-------|
| Holiday AE/YE/IE | AVAILABLE NOW | All digital + physical |
| BKFT Month 1: Prayer | AVAILABLE NOW | Nibbles + Snack Pack |
| BKFT Month 2: Through | COMING SOON | Content being finalized |
| BKFT Month 3: Faith | COMING SOON | Content being finalized |
| BKFT Full Workbook | PRE-ORDER | $3 off, ships ~2 weeks |
| Lunch All Editions | PRE-ORDER | $3 off until Pentecost, ships May-Jun 2026 |
| Game Passes | 20% OFF | No coupon needed, expires Pentecost |
| Bookmarks | AVAILABLE NOW | |
| Pens/Study Kit/Game Packs | PRE-ORDER | |

## Prioritized Backlog

### P0
- Process "BKFT IE" (Breakfast Instructor Edition) files — BLOCKED on user upload

### P1
- Build "Redeem Code" flow for guest purchases
- SMS OTP (needs Twilio credentials)
- Comprehensive registration fields
- License Management UI
- Referral System UI

### P2
- Word Search Game
- Video Integration into My Library
- Product Catalog migration to MongoDB

## Critical Notes
- GUEST CHECKOUT IS INTENTIONAL
- Stripe minimum $0.50 — DOLLARTEST coupon sets cart to $1.00
- Can't combine coupons — one per order
- Game pass 20% off auto-expires May 24, 2026 (Pentecost)
- Landing page is SoulFoodApp.js (NOT App.js LandingPage component)
