# Soul Food - Product Requirements Document

## Original Problem Statement
Full-stack e-commerce and learning platform "Soul Food" for kingdom-soul.com. Supports digital/physical sales via Stripe, guest checkout, "My Library" for downloads, and comprehensive Bible study content.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, MongoDB
- Payments: Stripe Checkout Sessions + Webhooks
- Email: Resend (configured, needs RESEND_API_KEY for live sending)

## Store Structure (Launch Configuration)
| Section | Products | Status |
|---------|----------|--------|
| Featured | Holiday Table Bundle ($19.99), Full Table Experience ($34.99), Holiday ePub ($14.99) | LIVE |
| Instant Access | HOL ePub AE/YE/IE, BKFT Snack Pack M1, Game Passes (20% off) | LIVE |
| Pre-Order | HOL Physical Books, BKFT Full Book ($3 off) | LIVE |
| Free Resources | Interactive lessons, samples | LIVE |
| Games | Game Night Lite (30-Day, $6.39), Game Pass Full (90-Day, $19.99) | LIVE |
| Merchandise | Bookmarks only; pens/study kit/game packs = pre-order | LIVE |

## Active Coupons
| Code | Type | Discount |
|------|------|----------|
| WELCOME10 | Percentage | 10% off all |
| SOFU5 | Fixed dollar | $5 off bundles |
| GAMENIGHT | Fixed dollar | $10 off game pass |
| DOLLARTEST | Override | Cart = $1.00 |
| BETATEST | Percentage | 100% off |

## Content Availability
- Holiday AE/YE/IE: AVAILABLE NOW
- BKFT Month 1 (Prayer): Nibbles + Snack Pack available NOW
- BKFT Months 2-3: COMING SOON (content being finalized)
- BKFT Full Workbook: PRE-ORDER ($3 off)
- Lunch: PRE-ORDER ($3 off until Pentecost, ships May-Jun 2026)
- Game Passes: 20% off until Pentecost (May 24, 2026)

## What's Implemented

### Store Launch (Apr 5, 2026)
- [x] Featured section with 3 bundle/product cards
- [x] Holiday Table Bundle ($19.99) and Full Table Experience ($34.99)
- [x] Store organized: Featured → Instant Access → Pre-Order → Free Resources
- [x] 3 new coupons (WELCOME10, SOFU5, GAMENIGHT) with fixed dollar support
- [x] Gift certificates disabled for launch
- [x] Game Night Lite (30-day) option added
- [x] Thank You page: "Check your email for access" + support contact
- [x] Global message: "Start now. Grow with us. Full releases coming soon."
- [x] BKFT Snack Pack clarification: "Includes Prayer Month 1..."
- [x] Pre-order messaging: "Includes 2 months complimentary digital access"
- [x] Email templates: digital delivery, preorder confirmation, game pass access
- [x] About Us page with real team photos (Dr. Brown, Dr. Temia, Pastor Edwards, Evang. Rose Doctor)
- [x] BKFT IE PDF uploaded and mapped to product catalog
- [x] Fixed dollar coupon support in frontend checkout

### Previously Completed
- [x] Payment success webhook race condition fixed
- [x] 20% off game passes (no coupon, until Pentecost)
- [x] Pentecost countdown timer
- [x] Landing page launch messaging
- [x] All soft launch pricing updates

## Email Service Status
- Templates ready: Digital delivery, Preorder confirmation, Game pass access
- **RESEND_API_KEY needed** for live email sending
- Currently logs emails but doesn't send in preview

## Prioritized Backlog
### P0
- Get RESEND_API_KEY configured for live emails
- Run live $1 test purchase to verify end-to-end flow

### P1
- Build "Redeem Code" flow for guest purchases
- BKFT Months 2-3 content (when user finalizes)

### P2
- SMS OTP, License Management, Referral System
- Word Search Game, Video Integration
- Product Catalog migration to MongoDB

## Critical Notes
- GUEST CHECKOUT IS INTENTIONAL
- Stripe minimum $0.50
- Can't combine coupons (one per order)
- Game pass 20% off auto-expires May 24, 2026
- Gift certificates DISABLED for launch
- Landing page is SoulFoodApp.js
- Apple Pay/Google Pay enabled via Stripe Checkout
