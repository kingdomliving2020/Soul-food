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
- Game routes: /gaming-central, /game/tricky-testament, /game/mixup

## What's Implemented

### Question Structure Refinement — P0 Complete (Apr 11, 2026)
- [x] Tricky Testaments: recall-only self-scoring (Reveal Answer → Got it!/Missed it!) — NO multiple choice
- [x] Trivia Mix-Up: MCQ-only with generated distractors for questions lacking options
- [x] Backend: `trivia_testament` strips options, `tricky_trivia` ensures MCQ options exist
- [x] Dead code removed: unused `handleAnswer`, `selectedAnswer`, fallback option generation
- [x] Tested: 13/13 features, 100% (iteration 22)

### Resend Download Link Wiring — P1 Complete (Apr 11, 2026)
- [x] My Library "Resend Download Link" buttons wired to POST /api/downloads/resend-links
- [x] Loading spinner during request, "Link resent!" after success, button disabled after
- [x] Toast notifications for success/failure
- [x] Tested: 8/8 features, 100% (iteration 23)

### Storefront Cart/Checkout Navigation Fix (Apr 11, 2026)
- [x] Bug 1 fixed: ProductSelectionModal was passing string IDs to addToCart that didn't exist in PRODUCTS lookup — now passes item objects
- [x] Bug 2 fixed: ShoppingCart dual-instance mousedown race condition killed Checkout navigation — removed redundant document handler
- [x] Full flow verified: Front page → Add to Cart → Modal → Cart auto-opens → Checkout → Sign In/Guest
- [x] Tested: 13/13 features, 100% (iteration 24)

### Checkout & Fulfillment Pipeline Fixes (Apr 11, 2026)
- [x] Stripe email binding: customer_email passed to stripe.checkout.Session.create() — pre-fills buyer email on payment page
- [x] Product identity: items stored with both raw product_id and normalized_product_id for reliable PRODUCT_FILES lookup
- [x] Account linking: JWT user_id extracted from Authorization header, stored as user_id + claimed_by_user_id in transaction
- [x] Webhook mapping: fulfillment uses stored user_id from transaction record, never falls back to session_id
- [x] Tested: 13/13 backend tests passed (iteration 25)

### Production Polling Fix + Code Quality (Apr 11, 2026)
- [x] CartContext: stabilized clearCart/removeFromCart/updateQuantity with useCallback to prevent re-render cascades
- [x] PaymentSuccess: added completedRef guard to stop polling after payment confirmed — fixes 60+ download-links calls
- [x] Test files: hardcoded credentials replaced with os.environ.get() (7 files)
- [x] Console cleanup: all console.log/warn removed from 20 production frontend files

### Full 5x5 Jeopardy Board + Content Entitlements (Apr 11, 2026)
- [x] Tricky Testaments: true 5x5 grid (categories across top, 100-500 vertically) for paid users
- [x] Demo users: 5x2 board (100-200 only), demo badge, purchase prompts at game over
- [x] Full users: 5x5 board (25 tiles), "Full Board" badge, no upsell prompts
- [x] Questions grouped by character/category into proper columns with escalating difficulty
- [x] Game Center: "Your Game Access" section showing Question Bank, Game Duration, Lesson Audio cards
- [x] Game duration labeling: Free=30min, Standard=1hr, Instructor=3hr
- [x] Audio access tracked separately from trivia access
- [x] Content-specific: 4C AE/YE → 4C bank, BKFT AE/YE → BKFT bank, bundle → combined
- [x] Tested: 11/11 features, 100% (iteration 21)

### Content-Specific Entitlement Engine (Apr 10, 2026)
- [x] /api/trivia/entitlements/me — user's unlocked series, editions, audio, instructor flags
- [x] /api/trivia/questions/for-game — content-gated question delivery
- [x] Product classification: parses names for series + edition
- [x] Question series mapping: Q1=holiday_4c, Q2/Q3=breakfast, empty=shared

### Bundle IE Upgrade + Game Access (Apr 10, 2026)
- [x] Edition selector: AE/YE, instructor upgrade (+$7)
- [x] Standard: 1hr game pass, Instructor: 3hr + offline pack

### Admin UI + Redeem + Resend (Apr 9-10, 2026)
- [x] Admin Orders: search, detail, resend email, grant access
- [x] Admin Submitted Codes: list view
- [x] Redeem Code: UI + backend capture, post-claim → Game Center link
- [x] Public resend-access: rate-limited
- [x] My Library: status labels, resend link UI, redeem code input

### Earlier Work
- Purchase Flow, Conversion Layer, Auth Fixes, Email Fixes, Store, Games, Coupons

## Prioritized Backlog (ON HOLD per user)
- Full redeem code validation logic (P2 — deferred, using manual capture workflow)
- Force password change on first login (NIST)
- Security: httpOnly cookies
- SMS OTP, Word Search Game, Video Integration
- Gift Certificates, Subscription billing
