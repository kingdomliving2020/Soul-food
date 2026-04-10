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

### Content-Specific Game Entitlements (Apr 10, 2026)
- [x] Backend: /api/trivia/entitlements/me — returns user's unlocked series, editions, audio, instructor flags
- [x] Backend: /api/trivia/questions/for-game — content-gated: demo=10 shared questions, paid=full pool for unlocked series
- [x] Series mapping: Q1 lesson_node → holiday_4c, Q2/Q3 → breakfast, empty → shared
- [x] Product classification: parses purchase names for series (holiday/4c/breakfast/bundle) + edition (adult/youth)
- [x] Audio access tracked separately (has_audio flag, not tied to trivia)
- [x] Instructor access tracked separately (has_instructor flag)
- [x] Game Center: shows unlock badges per series + Lesson Audio badge
- [x] Game cards: "Full question bank — 4C's, Break*fast" vs "Demo questions — purchase to unlock"
- [x] Offline games section: shows instructor-only lock message
- [x] Redeem success: "Go to Game Center" button added alongside "Go to My Library"
- [x] Tested: 10/10 backend, all frontend verified (iteration 20)

### Bundle IE Upgrade Tier (Apr 10, 2026)
- [x] Edition selector: AE/YE with instructor upgrade checkbox (+$7)
- [x] Game access by tier: Standard=1hr Online Game Pass, Instructor=3hr+Offline Pack
- [x] Order summary shows content-specific line items

### Admin UI + Resend Access (Apr 9, 2026)
- [x] Admin Orders: search, detail, resend email, grant access
- [x] Admin Submitted Codes: list view
- [x] Public resend-access: rate-limited (3/hr)

### Redeem Code Flow (Apr 9, 2026)
- [x] Backend verify-claim + claim, frontend /redeem page, email templates

### Earlier Work
- Purchase Flow, Conversion Layer, Auth Fixes, Games, Store Launch

## Prioritized Backlog

### P2 (ON HOLD per user — paused for deployment)
- Wire Resend Download Link to backend
- Full redeem code validation logic
- Force password change on first login (NIST)
- Security: httpOnly cookies
- SMS OTP, Word Search Game, Video Integration
- Gift Certificates, Subscription billing
