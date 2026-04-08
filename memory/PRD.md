# Soul Food - Product Requirements Document

## Original Problem Statement
Full-stack e-commerce and learning platform "Soul Food" for kingdom-soul.com. Supports digital/physical sales via Stripe, guest checkout, "My Library" for downloads, and comprehensive Bible study content.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, MongoDB
- Payments: Stripe Checkout Sessions + Webhooks (LIVE keys)
- Email: Resend (kingdom-soul.com verified)

## Critical Architecture Notes
- **NEVER** hardcode DB name — always use `os.environ.get('DB_NAME')`
- SITE_URL env var = `https://kingdom-soul.com` (used for ALL email links)
- FRONTEND_URL = preview URL (CORS/internal only, NOT emails)
- Auth state: SoulFoodApp.js reads localStorage + polls via `auth-changed` event
- Guest checkout is intentional — no account gating

## What's Implemented

### Conversion Layer (Apr 8, 2026)
- [x] Homepage hero: "Bible Study That Sticks" headline, 3 benefit bullets, "Get Bundle" + "Start Free Lesson" CTAs, non-denominational note, Pentecost countdown
- [x] Bundle offer section: "4C's + Break*fast Starter Bundle" at $21.99 (save $4.99), Best Value badge, what's included, who it's for, Buy Now button with cart integration
- [x] Post-game conversion prompts: MixUpGame + TrickyTestamentGame show "Enjoyed this? Unlock full lessons..." with "Get Full Access" + "View Bundle" buttons after game completion
- [x] Jump-to nav bar: Bundle Deal | Holiday | Breakfast | Games | About

### Auth & Header Fix (Apr 8, 2026)
- [x] Header shows My Library / Admin / Sign Out when logged in
- [x] Password reset writes to `password_hash` (was writing to wrong field!)
- [x] Password reset auto-logs user in + redirects to My Library
- [x] Timezone comparison bug in reset tokens fixed
- [x] Admin can skip 2FA via "Continue without 2FA" link
- [x] Login response includes `session_config` field
- [x] Mobile menu auth-aware (shows library/admin/sign out when logged in)

### Email & Delivery Fix (Apr 8, 2026)
- [x] SITE_URL=https://kingdom-soul.com for all email links
- [x] Webhook includes download_links in confirmation email
- [x] send_email() parameter names fixed
- [x] Manual fulfillment: michael.edwards2@yahoo.com order + email sent

### Offline Game Files (Apr 6-8, 2026)
- [x] 4 game files at /api/content/games/
- [x] "Offline Game Files" tab in InstructorToolbox

### Earlier Work
- 500 error fix, 383 trivia questions, maps, guest checkout fix
- 230 product-file mappings, admin fulfillment endpoints
- Store launch, coupons, Pentecost countdown

## Prioritized Backlog

### P1
- "Redeem Code" flow for guest post-purchase account linking
- Admin UI frontend for fulfillment management
- Force password change on first login (NIST compliance)

### P2
- Security: httpOnly cookies for auth tokens
- SMS OTP (blocked on Twilio)
- Word Search Game, Video Integration
- Gift Certificates, Subscription billing
