# Soul Food - Product Requirements Document

## Original Problem Statement
Full-stack e-commerce and learning platform "Soul Food" for kingdom-soul.com. Supports digital/physical sales via Stripe, guest checkout, "My Library" for downloads, and comprehensive Bible study content.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, MongoDB
- Payments: Stripe Checkout Sessions + Webhooks (dynamic pricing, LIVE keys)
- Email: Resend (kingdom-soul.com verified)

## Critical Architecture Notes
- **NEVER** hardcode DB name — always use `os.environ.get('DB_NAME')`
- SITE_URL env var = `https://kingdom-soul.com` (used for ALL email links)
- FRONTEND_URL = preview URL (used only for CORS/internal, NOT emails)
- Product-file mappings: MongoDB `product_file_mappings` (primary) → hardcoded PRODUCT_FILES (fallback)
- Guest checkout is intentional — no account gating
- Auth state: SoulFoodApp.js reads localStorage + polls every 1s via `auth-changed` event

## What's Implemented

### Auth & Header Fix (Apr 8, 2026 — Session 2)
- [x] Header now shows My Library / Admin / Sign Out when logged in
- [x] Auth state syncs via `auth-changed` custom event + 1s polling interval
- [x] Password reset writes to `password_hash` (was writing to wrong `password` field — login always failed after reset!)
- [x] Password reset auto-logs user in (returns token + session_config + user data)
- [x] Reset frontend auto-redirects to /my-library after success
- [x] Timezone comparison bug in reset token verification fixed
- [x] Admin/instructor can skip 2FA via "Continue without 2FA" link
- [x] Login response now includes `session_config` field

### Email & Delivery Fix (Apr 8, 2026 — Session 2)
- [x] Added `SITE_URL=https://kingdom-soul.com` env var
- [x] All email links (reset, order, download) now use SITE_URL → production domain
- [x] Webhook `send_order_confirmation` now includes `download_links=` parameter (was missing!)
- [x] `send_email()` parameter names fixed (`to=` not `to_email=`, `html=` not `html_content=`)
- [x] Gift cert email uses SITE_URL instead of FRONTEND_URL

### Offline Game Files (Apr 6-8, 2026)
- [x] 4 game files stored at `/app/content/downloads/games/`
- [x] Static file endpoint at `/api/content/games/`
- [x] "Offline Game Files" tab in InstructorToolbox with download buttons
- [x] Removed fake "383 Q&A Cards" products from QuickOrder

### Earlier Completed Work
- Fixed 500 error on downloads (hardcoded DB name)
- 383 trivia questions seeded, games connected to real DB
- Maps & Visual Aids with credits
- Guest checkout leak fix
- 230 product-file mappings, admin fulfillment endpoints
- Store launch layout, coupons, Pentecost countdown

## Prioritized Backlog

### P1
- "Redeem Code" flow for guest post-purchase account linking
- Admin UI frontend for fulfillment management
- Force password change on first login with temp password (NIST compliance)

### P2
- Security: Move auth tokens from localStorage to httpOnly cookies
- SMS OTP (blocked on Twilio credentials)
- Word Search Game, Video Integration
- Gift Certificates, Subscription billing
