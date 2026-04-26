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

## Beta Test Coupons
- `BETATEST` — 100% off all items
- `Beta1!2!3!` — 100% off
- `Beta123abc` — 100% off
- `Beta123abcd` — 100% off

## $1 Test Coupon
- `DOLLARTEST` — Overrides entire cart to $1.00 for live Stripe testing

## Bulk Discount Codes
- `BOOK10` — 10% off (5+ items)
- `BULK15` — 15% off (10+ items)
- `MEGA30` — 30% off (25+ items)

## RBAC Test Codes
- `test123` — Adult role, 90-min session
- `test1234` — Youth role, 45-min session
- `test12345` — Instructor role, 120-min session

## Integrations
- Stripe: Live mode, API key in backend/.env
- Resend: Configured, kingdom-soul.com verified
- MongoDB: Connection string in backend/.env
- SITE_URL: https://kingdom-soul.com (used for all email links)
