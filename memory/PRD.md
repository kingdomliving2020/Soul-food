# Soul Food - Product Requirements Document

## Original Problem Statement
Full-stack e-commerce and learning platform "Soul Food" for kingdom-soul.com. Digital/physical Bible study workbooks via Stripe, guest checkout, My Library, interactive games, instructor toolbox.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, MongoDB
- Payments: Stripe Checkout Sessions + Webhooks (LIVE keys)
- Email: Resend (kingdom-soul.com verified)

## Critical Architecture Notes
- NEVER hardcode DB name — always use `os.environ.get('DB_NAME')`
- SITE_URL=https://kingdom-soul.com (ALL email links)
- Auth state: SoulFoodApp.js polls localStorage via `auth-changed` event
- Guest checkout intentional — no account gating

## What's Implemented

### Admin UI MVP + Resend Access Link (Apr 9, 2026)
- [x] Admin Orders page: search by email/name/order#, paginated list from payment_transactions
- [x] Admin Order Detail: expand row to see items, download links (active/revoked), delivery logs, claimed status
- [x] Admin Resend Email: one-click resend order confirmation emails with download + redeem links
- [x] Admin Grant Access: manually create/recreate download links for any order
- [x] Admin Refund: full/partial/custom refund processing (existing)
- [x] Public Resend Access: POST /api/orders/resend-access — rate-limited (3/hour), validates email match
- [x] Order Success page: "Resend Access Link" section with email input + "Redeem Now" link
- [x] Tested: 19/19 backend, all frontend flows verified (iteration 18)

### Redeem Code Flow (Apr 9, 2026)
- [x] Backend: verify-claim + claim endpoints
- [x] Frontend: /redeem page with auto-verify from URL param
- [x] Email templates include "Redeem Your Purchase" section
- [x] Tested: 12/12 tests passed (iteration 17)

### Purchase Flow & Exit-Intent (Apr 8, 2026)
- [x] Guest checkout, post-purchase page, My Library empty state, exit-intent popup

### Conversion Layer (Apr 8, 2026)
- [x] Homepage hero, bundle section, post-game conversion prompts

### Auth & Email Fixes (Apr 8, 2026)
- [x] Password reset, header state sync, SITE_URL for emails, webhook download links

### Earlier Work
- Offline game files (4 PDFs), 383 trivia questions, maps
- 230 product-file mappings, admin fulfillment endpoints
- Store launch, coupons, Pentecost countdown

## Prioritized Backlog

### P2 (ON HOLD per user — paused for deployment)
- Force password change on first login (NIST)
- Security: httpOnly cookies
- SMS OTP, Word Search Game, Video Integration
- Gift Certificates, Subscription billing
