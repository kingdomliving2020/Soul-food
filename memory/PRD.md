# Soul Food - Product Requirements Document

## Original Problem Statement
Full-stack e-commerce and learning platform "Soul Food" for kingdom-soul.com. Supports digital/physical sales via Stripe, guest checkout, "My Library" for downloads, and comprehensive Bible study content.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, MongoDB
- Payments: Stripe Checkout Sessions + Webhooks (dynamic pricing via unit_amount)
- Email: Resend (configured, kingdom-soul.com domain verified)

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
### Launch Coupons
| Code | Type | Discount |
|------|------|----------|
| WELCOME10 | Percentage | 10% off all |
| SOFU5 | Fixed dollar | $5 off bundles |
| GAMENIGHT | Fixed dollar | $10 off game pass |
| DOLLARTEST | Override | Cart = $1.00 |
| BETATEST | Percentage | 100% off |

### Contributor Coupons (50 uses each)
| Contributor | Code | Discount |
|-------------|------|----------|
| Dee | SoulX1079 | 15% |
| Jafari | SoulZ1003 | 15% |
| Rose | SoulX1060 | 10% |
| Temia | SoulX1072 | 10% |
| Mike | SoulX1080 | 10% |
| Vicky | SoulX1059 | 10% |

## What's Implemented

### Easter Day Fixes (Apr 5, 2026)
- [x] Fixed landing page crash: selectedSeries?.available null reference
- [x] Updated landing page banner: "HE IS RISEN! Soul Food Is LIVE!" (post-Easter messaging)
- [x] Changed countdown from Easter → Pentecost (May 24, 2026) — shows ~49 days
- [x] Updated ALL shipping timelines: "Digital instantly / Physical 2-3 weeks" (removed March/Easter dates)
- [x] Added Amazon-style +/- quantity controls in checkout
- [x] Removed "Account Required" gate from checkout (guest checkout for all items)
- [x] Improved PaymentCancel page: "No Worries!" with Return to Checkout / Continue Shopping / Back to Home
- [x] Added product catalog API (GET /api/payments/catalog JSON + CSV download)
- [x] Added admin catalog CSV upload endpoint

### Store Launch (Apr 5, 2026)
- [x] Featured section with 3 bundle/product cards
- [x] Store organized: Featured > Instant Access > Pre-Order > Free Resources
- [x] 3 launch coupons + 6 contributor coupons with max_uses enforcement
- [x] Gift certificates disabled for launch
- [x] Email templates: digital delivery, preorder confirmation, game pass access
- [x] About Us page with real team photos
- [x] Fixed dollar coupon support in frontend checkout
- [x] Pentecost countdown timer (sale ends May 24, 2026)

### Previously Completed
- [x] 20% off game passes (no coupon, until Pentecost)
- [x] Payment success webhook race condition fixed (polling)
- [x] Stripe dynamic pricing (no dashboard sync needed)
- [x] Resend email integration (kingdom-soul.com verified)

## Prioritized Backlog
### P0
- Run live $1 test purchase through the UI (recommended)

### P1
- Build "Redeem Code" flow for guest purchases
- BKFT Months 2-3 content (when user finalizes)

### P2
- SMS OTP, License Management, Referral System
- Word Search Game, Video Integration
- Product Catalog migration to MongoDB
- Gift Certificates, Subscription billing

## Critical Notes
- GUEST CHECKOUT IS INTENTIONAL — no account gating at checkout
- Stripe minimum $0.50
- Can't combine coupons (one per order)
- Game pass 20% off auto-expires May 24, 2026
- Gift certificates DISABLED for launch
- Subscriptions DEFERRED (Coming Soon sign on landing page)
- Stripe uses dynamic pricing — catalog is source of truth, no dashboard sync needed
