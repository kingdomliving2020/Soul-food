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
    App.js, QuickOrder.js, CheckoutPage.js, PaymentSuccess.js, MyLibrary.js, RefundRequest.js
  content/downloads/ (PDFs + nibbles/ subdirectory)
```

## Key DB Schema
- `users`: email, name, hashed_password, two_factor_enabled
- `payment_transactions`: session_id, amount_total, items, customer_email, payment_status
- `download_links`: order_id, token, file_path, expires_at
- `coupons`: code, active, discount_percent, override_total

## What's Been Implemented (as of Apr 5, 2026)

### Soft Launch (Apr 5, 2026)
- [x] "He Is Risen! Soul Food Is LIVE!" launch banner
- [x] Holiday Series: Available NOW (all 3 editions, current pricing)
- [x] Break*fast pre-order: $3 off full workbooks (AE Digital $11.99, AE Print $24.99, etc.)
- [x] Lunch pre-order: $3 off until Pentecost (AE $24.99, YE $21.99, IE $26.99)
- [x] Break*fast Snack Pack Month 1 (Prayer the First Resort): Available NOW
- [x] Break*fast Nibbles Month 1: Available NOW, no discount
- [x] Holiday Nibbles: Available NOW
- [x] Merchandise: Only bookmarks available, pens/study kit/game packs pre-order
- [x] Single coupon enforcement ("one per order" note on checkout)
- [x] Fixed PaymentSuccess.js webhook race condition (robust polling with useRef)
- [x] 24 breakfast nibble PDFs mapped to product catalog
- [x] Updated marketing copy for soft launch

### Previously Completed
- [x] Dynamic thumbnails in QuickOrder.js
- [x] Login persistence during checkout
- [x] Stripe Webhook configuration
- [x] Guest checkout (no account required)
- [x] Quantity selectors on order page
- [x] Game Packs in merchandise
- [x] My Library with thumbnails and download buttons
- [x] Removed Emergent branding from OG tags
- [x] Refund/Return Request page
- [x] "In His Image" free downloads fixed
- [x] DOLLARTEST $1 coupon for testing

## Prioritized Backlog

### P0
- Process "BKFT IE" (Breakfast Instructor Edition) files — BLOCKED on user upload

### P1
- Build "Redeem Code" flow for guest purchases (buy now, register later)
- Add SMS OTP option (blocked on Twilio credentials)
- Add comprehensive registration fields
- License Management UI
- Referral System UI

### P2
- Word Search Game
- Video Integration into My Library
- Product Catalog migration to MongoDB (payment_routes.py is 1800+ lines)

## Key API Endpoints
- `POST /api/payments/checkout/cart` — Cart checkout via Stripe
- `POST /api/payments/webhook/stripe` — Stripe webhook handler
- `GET /api/payments/checkout/status/{session_id}` — Payment status polling
- `GET /api/payments/download-links/{order_id}` — Download links for order
- `POST /api/coupons/validate` — Coupon validation (one per order)
- `GET /api/downloads/file/{token}` — Secure PDF file download

## Critical Notes
- GUEST CHECKOUT IS INTENTIONAL — do not re-add account requirements
- Stripe minimum is $0.50 — DOLLARTEST coupon sets cart to $1.00
- Can't combine coupons — one per order enforced
