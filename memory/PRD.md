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
- FRONTEND_URL = preview URL (used only for CORS/internal purposes, NOT emails)
- Product-file mappings: MongoDB `product_file_mappings` collection (primary) -> hardcoded PRODUCT_FILES (fallback)
- Guest checkout is intentional — no account gating
- Game files served via `/api/content/games/` static mount

## What's Implemented

### Critical Bug Fixes (Apr 8, 2026)
- [x] Fixed password reset email: `send_email()` was called with wrong params (`to_email=` → `to=`, `html_content=` → `html=`)
- [x] Fixed email URLs: Added `SITE_URL=https://kingdom-soul.com` env var so ALL emails (reset, order, download) point to production, not preview
- [x] Fixed webhook email: Order confirmation from Stripe webhook now includes download links (was missing `download_links=` parameter)
- [x] Fixed login response: Added `session_config` field to prevent frontend JSON parse errors
- [x] Fixed 2FA blocker: Admin/instructor users can now skip 2FA setup via "Continue without 2FA" link
- [x] Fixed gift cert email URL: Uses SITE_URL instead of FRONTEND_URL

### Offline Game Files (Apr 6-8, 2026)
- [x] Stored 4 user-uploaded game files at `/app/content/downloads/games/`
- [x] GRinCH Bingo Game Pack (23 pages), GRinCH Bingo Cards (4 pages)
- [x] Passport Trek Game (10 pages), Map & Journey Reference Index (DOCX)
- [x] Backend: `/api/content/games/` static file endpoint
- [x] Frontend: "Offline Game Files" tab in InstructorToolbox with download buttons
- [x] Removed incorrect "383 Q&A Cards" digital products from QuickOrder.js

### Earlier Completed Work
- Fixed critical 500 error on production downloads (hardcoded DB name)
- Email-only 2FA, Forgot/Reset Password flow
- 383 trivia questions seeded, games connected to real DB
- Maps & Visual Aids with credits, guest checkout leak fix
- 230 product-file mappings, admin fulfillment endpoints
- Store launch layout, coupons, Pentecost countdown

## Prioritized Backlog

### P1
- Investigate & fulfill missing orders `SF-2026-TWSRN` and `SF-2026-G8AS2` (PRODUCTION DB)
- Refund test purchase Order `SF-2026-WVEE9` ($43.64)
- "Redeem Code" flow for guest post-purchase account linking
- Admin UI frontend for fulfillment management

### P2
- Security: Move auth tokens from localStorage to httpOnly cookies
- SMS OTP (blocked on Twilio credentials)
- Word Search Game, Video Integration
- Gift Certificates, Subscription billing
