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

### Redeem Code Flow (Apr 9, 2026)
- [x] Backend: GET /api/orders/verify-claim?code=ORDER — looks up order, masks email, returns items & claimable status
- [x] Backend: POST /api/orders/claim — requires auth, verifies email match, links download_links + payment_transactions to user_id, prevents duplicates
- [x] Frontend: /redeem page with auto-verify from URL param (?code=), order info card, Sign In/Create Account for guests, Claim button for logged-in users, success state with "Go to My Library"
- [x] Email: Order confirmation template includes "Redeem Your Purchase" section with link to /redeem?code=ORDER_ID
- [x] Email: Download delivery template includes redeem link
- [x] Route registered in server.py and App.js
- [x] Tested: 12/12 tests passed (backend + frontend E2E)

### Purchase Flow & Exit-Intent (Apr 8, 2026)
- [x] Guest checkout (no login required, Continue as Guest)
- [x] Post-purchase page: "Access Your Content" banner + "Create Account to Save Your Library" (guests only)
- [x] My Library empty state: "You don't have any content yet" + "Browse Lessons" + "Get Starter Bundle"
- [x] Exit-intent popup: "Before you go..." + bundle offer ($21.99)

### Conversion Layer (Apr 8, 2026)
- [x] Homepage hero: "Bible Study That Sticks" + 3 benefits + "Get Bundle"/"Start Free Lesson"
- [x] Bundle section: "4C's + Break*fast Starter Bundle" $21.99 (save $4.99), Best Value badge
- [x] Post-game conversion prompts in MixUp + Tricky Testament games
- [x] Jump-to nav: Bundle Deal | Holiday | Breakfast | Games | About

### Auth & Email Fixes (Apr 8, 2026)
- [x] Password reset: writes to correct field, auto-login after reset, timezone fix
- [x] Header: My Library/Admin/Sign Out when logged in
- [x] SITE_URL for production email links
- [x] Webhook includes download_links in confirmation email
- [x] Admin can skip 2FA

### Earlier Work
- Offline game files (4 PDFs), 383 trivia questions, maps
- 230 product-file mappings, admin fulfillment endpoints
- Store launch, coupons, Pentecost countdown

## Prioritized Backlog

### P1
- Admin UI frontend for fulfillment management (MVP: search orders, view details, resend emails, manually grant access)

### P2 (ON HOLD per user)
- Force password change on first login (NIST)
- Security: httpOnly cookies
- SMS OTP, Word Search Game, Video Integration
- Gift Certificates, Subscription billing
