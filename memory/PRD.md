# Soul Food - Product Requirements Document

## Original Problem Statement
Full-stack e-commerce and learning platform "Soul Food" for kingdom-soul.com. Supports digital/physical sales via Stripe, guest checkout, "My Library" for downloads, and comprehensive Bible study content.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, MongoDB
- Payments: Stripe Checkout Sessions + Webhooks (dynamic pricing)
- Email: Resend (kingdom-soul.com verified)

## What's Implemented

### Offline Game Files Integration (Apr 6, 2026)
- [x] Downloaded and stored 4 user-uploaded game files to `/app/content/downloads/games/`
- [x] GRinCH Bingo Game Pack (23 pages) — instructions, question banks, 6 Grid Iron bingo card variants
- [x] GRinCH Bingo Cards (4 pages) — printable Grid Iron Cards A-1, A-2, B-1 + tracker templates
- [x] Passport Trek Game (10 pages) — stamp collection game, challenge boxes, leader key
- [x] Map & Journey Reference Index (DOCX) — biblical map reference for Instructor Series
- [x] Backend: Mounted `/api/content/games/` static file endpoint
- [x] Frontend: Replaced fake "Game Card Packs" tab with "Offline Game Files" tab in InstructorToolbox
- [x] Frontend: Removed incorrect "383 Q&A Cards" digital products from QuickOrder.js
- [x] All 4 files verified downloadable (HTTP 200, correct content-types)

### Download Fix & 2FA Simplification (Apr 6, 2026)
- [x] Fixed critical hardcoded DB name bug in `download_protection.py`
- [x] Added `resolve_file_path()` to download endpoint
- [x] Added `/api/downloads/diagnose/<token>` diagnostic endpoint
- [x] Added `/api/admin/content-health` endpoint
- [x] Created Account Settings page (`/account-settings`) with email-based 2FA setup
- [x] Simplified 2FA setup to email-only

### Question Bank & Game Content (Apr 6, 2026)
- [x] Seeded 383 questions from SOFU Master QA Banks I & II into MongoDB
- [x] Connected TrickyTestamentGame and MixUpGame to real question bank
- [x] Added "Maps & Visual Aids" tab to InstructorToolbox with credit footnotes
- [x] Auto-seed on production startup if trivia_questions collection is empty

### Admin Content Management (Apr 5, 2026)
- [x] Product-file mappings stored in MongoDB (230 mappings seeded)
- [x] Admin "Grant Access", "Retry Fulfillment", "Resend Email", "Add Mapping", "List Files", "Orders"

### Store Launch (Apr 5, 2026)
- [x] Featured > Instant Access > Pre-Order > Free Resources layout
- [x] 6 contributor coupons + 5 launch coupons
- [x] Resend email integration, About Us page, Pentecost countdown

## Prioritized Backlog

### P1
- Investigate & fulfill missing orders `SF-2026-TWSRN` and `SF-2026-G8AS2` (PRODUCTION DB — not in preview)
- Refund test purchase Order `SF-2026-WVEE9` ($43.64)
- "Redeem Code" flow for guest post-purchase account linking
- Admin UI frontend for fulfillment management

### P2
- Security: Move auth tokens from localStorage to httpOnly cookies
- SMS OTP (blocked on Twilio credentials)
- Word Search Game, Video Integration
- Gift Certificates, Subscription billing
- Product Catalog migration to MongoDB (prices)

## Critical Architecture Notes
- Product-file mappings: MongoDB `product_file_mappings` collection (primary) -> hardcoded PRODUCT_FILES (fallback)
- Admin endpoints: `/api/admin/fulfillment/*` for content management
- Stripe uses dynamic pricing — catalog in code is source of truth for PRICES
- Guest checkout is intentional — no account gating
- **NEVER** hardcode DB name — always use `os.environ.get('DB_NAME')`
- Game files served via `/api/content/games/` static mount
