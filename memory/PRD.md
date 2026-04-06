# Soul Food - Product Requirements Document

## Original Problem Statement
Full-stack e-commerce and learning platform "Soul Food" for kingdom-soul.com. Supports digital/physical sales via Stripe, guest checkout, "My Library" for downloads, and comprehensive Bible study content.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, MongoDB
- Payments: Stripe Checkout Sessions + Webhooks (dynamic pricing)
- Email: Resend (kingdom-soul.com verified)

## What's Implemented

### Download Fix & 2FA Simplification (Apr 6, 2026)
- [x] Fixed critical hardcoded DB name bug in `download_protection.py` (was `client.soul_food_db`, now uses `DB_NAME` env var)
- [x] Added `resolve_file_path()` to download endpoint — tries multiple directories for PDF files
- [x] Added try-catch error handling to download endpoint — no more generic "Internal Server Error"
- [x] Fixed 2 download links with relative file paths in DB
- [x] Added `/api/downloads/diagnose/<token>` diagnostic endpoint
- [x] Added `/api/admin/content-health` endpoint to verify PDF files on server
- [x] Created Account Settings page (`/account-settings`) with email-based 2FA setup
- [x] Simplified 2FA setup to email-only (removed confusing authenticator app option)
- [x] Fixed QR code double-prefix display bug in TOTP setup

### Question Bank & Game Content (Apr 6, 2026)
- [x] Seeded 383 questions from SOFU Master QA Banks I & II into MongoDB
- [x] Characters: Rahab, Ruth, Naomi, Abigail, Hannah, Esther, Samaritan Woman, Shunammite Woman, Abraham/Sarah, Jacob/Rachel/Leah, Saul/Jonathan, Hosea/Gomer
- [x] Game types: Trivia Testament (Jeopardy), Tricky Trivia (Millionaire), Who Am I, Deep Cut
- [x] 197 Youth + 186 Adult questions across all difficulty levels
- [x] 38 Hebrew/Greek word studies (tikvah, hesed, ga'al, etc.)
- [x] 12 Reference & Historical Sources from Instructor Edition
- [x] 6 biblical maps stored with credit footnotes (Joe Anderson / headwatersresources.org CC BY-NC-SA 4.0)
- [x] Passion Week map + 5 bonus maps: Abram's Journey, Abraham Offers Isaac, Joseph Sold, Brothers to Egypt, Mary & Joseph to Bethlehem
- [x] Connected TrickyTestamentGame to real question bank (was mock/hardcoded)
- [x] Connected MixUpGame (Millionaire) to real question bank (was mock/hardcoded)
- [x] Added "Table Talk Games" offline section to GamingCentral (GRinCH Cards + Passport Trek)
- [x] Added "Maps & Visual Aids" tab to InstructorToolbox with credit footnotes
- [x] Added "Game Card Packs" tab to InstructorToolbox organized by section (Holiday 4Cs, Break*fast, Full Bank)
- [x] Auto-seed on production startup if trivia_questions collection is empty
- [x] Static file serving for maps at `/api/content/images/`

### Admin Content Management (Apr 5, 2026) — NO REDEPLOY NEEDED
- [x] Product-file mappings stored in MongoDB (230 mappings seeded)
- [x] Admin "Grant Access" — manually drop digital content into any user's library
- [x] Admin "Retry Fulfillment" — re-process failed orders
- [x] Admin "Resend Email" — resend download links to customer
- [x] Admin "Add Mapping" — map new product IDs to PDF files
- [x] Admin "List Files" — see all available PDFs on server
- [x] Admin "Orders" — view/filter all orders with download counts
- [x] ADMIN_GUIDE.md — full README for content management
- [x] overflowharvest@gmail.com elevated to admin role
- [x] All fulfillment paths (webhook, status-check, manual) use MongoDB-first lookup

### Easter Day Fixes (Apr 5, 2026)
- [x] Fixed landing page crash (selectedSeries null reference)
- [x] Updated banner: "HE IS RISEN! Soul Food Is LIVE!"
- [x] Countdown targets Pentecost (May 24, 2026)
- [x] All shipping timelines updated (no more March/Easter dates)
- [x] Amazon-style +/- quantity controls in checkout
- [x] Removed account-required gate (guest checkout for all)
- [x] PaymentCancel page with navigation buttons
- [x] Product naming fix (no more "YE Paperback - ADULT" double-label)

### Download/Fulfillment Fixes (Apr 5, 2026)
- [x] 60+ new product ID → PDF file mappings
- [x] Smart normalizer with epub/ebook format support
- [x] My Library downloads now use fuzzy matching by order + name
- [x] DOLLARTEST coupon override_total + discount_dollars in checkout API
- [x] Retroactively fulfilled 5 paid orders with download links
- [x] Sent confirmation emails with download links
- [x] Reward points dynamically calculated from purchase history

### Store Launch (Apr 5, 2026)
- [x] Featured > Instant Access > Pre-Order > Free Resources layout
- [x] 6 contributor coupons + 5 launch coupons
- [x] Resend email integration (digital, preorder, game pass templates)
- [x] About Us page with team photos
- [x] Pentecost countdown + $3 off pre-orders + 20% off game passes
- [x] Product catalog CSV download + JSON API

## Prioritized Backlog
### P0
- Live $1 test purchase through the UI (recommended)

### P1
- "Redeem Code" flow for guest post-purchase account linking
- Admin UI frontend for fulfillment management
- BKFT Months 2-3 content (when finalized)

### P2
- SMS OTP, License Management, Referral System
- Word Search Game, Video Integration
- Product Catalog migration to MongoDB (prices)
- Gift Certificates, Subscription billing

## Critical Architecture Notes
- Product-file mappings: MongoDB `product_file_mappings` collection (primary) → hardcoded PRODUCT_FILES (fallback)
- Admin endpoints: `/api/admin/fulfillment/*` for content management
- No redeploy needed for: new file mappings, granting access, retrying orders, resending emails
- Stripe uses dynamic pricing (unit_amount) — catalog in code is source of truth for PRICES
- Guest checkout is intentional — no account gating
