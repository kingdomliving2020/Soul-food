# Soul Food - Product Requirements Document

## Original Problem Statement
Full-stack e-commerce and learning platform "Soul Food" for kingdom-soul.com. Supports digital/physical sales via Stripe, guest checkout, "My Library" for downloads, and comprehensive Bible study content.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, MongoDB
- Payments: Stripe Checkout Sessions + Webhooks (dynamic pricing)
- Email: Resend (kingdom-soul.com verified)

## What's Implemented

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
