# Soul Food - Test Credentials

## Admin Account
- Email: `overflowharvest@gmail.com`
- Password: `Admin123!`
- Role: admin (full access to admin panel)
- Note: Requires 2FA setup on login, but can be skipped via "Continue without 2FA" link

## Instructor Test Account (no 2FA — Apr 26, 2026)
- Email: `test_instructor_a54bf3e1@example.com`
- Password: `Inst123!`
- Role: instructor
- Note: 2FA is now Admin-only. Instructors log in with no 2FA friction.

## Registration
Use `/register` to create new test accounts.

## Launch Coupons (Active)
- `WELCOME10` — 10% off all products
- `SOFU5` — $5 off bundles (fixed dollar)
- `GAMENIGHT` — $10 off Game Pass (fixed dollar)

## Contributor Coupons (50 uses each)
- `SoulX1079` (Dee) — 15% off
- `SoulZ1003` (Jafari) — 15% off
- `SoulX1060` (Rose) — 10% off
- `SoulX1072` (Temia) — 10% off
- `SoulX1080` (Mike) — 10% off
- `SoulX1059` (Vicky) — 10% off

## Beta Test Coupons (DISABLED May 26, 2026 — pre-launch hardening)
- `BETATEST`, `Beta1!2!3!`, `Beta123abc`, `Beta123abcd`, `TESTII`, `DOLLARTEST`,
  `test123`, `test1234`, `test12345` — all set `active=false` (reversible via
  `POST /api/coupons/admin/{code}/toggle`).

## Internal Test Coupon (HIDDEN — admin/ops use only — May 26, 2026)
- `OFH_INTERNAL_$1` — overrides cart total to **$1.00** for safe live Stripe
  verification. `hidden=true`, `internal_only=true`, `max_uses=20`. **Do NOT
  share publicly.** Re-creatable any time via `POST /api/coupons/admin/harden-test-coupons`.

## Bulk Discount Codes
- `BOOK10` — 10% off (5+ items)
- `BULK15` — 15% off (10+ items)
- `MEGA30` — 30% off (25+ items)

## RBAC Test Codes (DISABLED May 26, 2026 — pre-launch hardening)
- `test123` — was Adult role, 90-min session (now `active=false`)
- `test1234` — was Youth role, 45-min session (now `active=false`)
- `test12345` — was Instructor role, 120-min session (now `active=false`)
- Re-enable individually via `POST /api/coupons/admin/{code}/toggle` `{"active": true}`.

## Integrations
- Stripe: Live mode, API key in backend/.env
- Resend: Configured, kingdom-soul.com verified
- MongoDB: Connection string in backend/.env
- SITE_URL: https://kingdom-soul.com (used for all email links)

## DOLLARTEST2 (HIDDEN — preview-only test coupon — June 21, 2026)
- `DOLLARTEST2` — sets EACH item to **$2.00** (cart total = qty × $2)
- `max_uses=3`, expires 24h from creation, `hidden=true`
- Use for live Stripe checkout testing without spending real money

## FREEDOM10 — Independence Day Campaign Coupon (June 21, 2026)
- `FREEDOM10` — 10% off all products
- Max 1000 uses, expires July 7 04:00 UTC (end of July 6 ET)
- Shareable link: `https://kingdom-soul.com/?promo=FREEDOM10`
- Auto-applies on landing — customer never has to type the code

## FREEDOM25 — Independence Day 25% off (June 22, 2026)
- `FREEDOM25` — 25% off when **cart total ≥ $100**
- `min_cart_total=100` (enforced server-side by `coupon_routes.py`)
- Display message: "July 4 — 25% off orders $100+"
- ⚠️ **Preview only** — must be created/updated in **production** Admin Coupons UI:
  - Code: `FREEDOM25`
  - Discount: 25%
  - Minimum cart: $100
  - Max uses: 10000 (or your campaign cap)
  - Active: ON

