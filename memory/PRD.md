# Soul Food - Product Requirements Document

## Original Problem Statement
Full-stack e-commerce and learning platform "Soul Food" for kingdom-soul.com. Digital/physical Bible study workbooks via Stripe, guest checkout, My Library, interactive games, instructor toolbox.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, MongoDB
- Payments: Stripe Checkout Sessions + Webhooks (LIVE keys)
- Email: Resend (kingdom-soul.com verified)

## Critical Architecture Notes
- NEVER hardcode DB name — always use `os.environ.get('DB_NAME')`
- SITE_URL=https://kingdom-soul.com (ALL email links)
- Auth state: SoulFoodApp.js polls localStorage via `auth-changed` event
- Guest checkout intentional — no account gating
- Game routes: /gaming-central, /game/tricky-testament, /game/mixup

## What's Implemented

### Question Structure Refinement — P0 Complete (Apr 11, 2026)
- [x] Tricky Testaments: recall-only self-scoring (Reveal Answer → Got it!/Missed it!) — NO multiple choice
- [x] Trivia Mix-Up: MCQ-only with generated distractors for questions lacking options
- [x] Backend: `trivia_testament` strips options, `tricky_trivia` ensures MCQ options exist
- [x] Dead code removed: unused `handleAnswer`, `selectedAnswer`, fallback option generation
- [x] Tested: 13/13 features, 100% (iteration 22)

### Resend Download Link Wiring — P1 Complete (Apr 11, 2026)
- [x] My Library "Resend Download Link" buttons wired to POST /api/downloads/resend-links
- [x] Loading spinner during request, "Link resent!" after success, button disabled after
- [x] Toast notifications for success/failure
- [x] Tested: 8/8 features, 100% (iteration 23)

### Storefront Cart/Checkout Navigation Fix (Apr 11, 2026)
- [x] Bug 1 fixed: ProductSelectionModal was passing string IDs to addToCart that didn't exist in PRODUCTS lookup — now passes item objects
- [x] Bug 2 fixed: ShoppingCart dual-instance mousedown race condition killed Checkout navigation — removed redundant document handler
- [x] Full flow verified: Front page → Add to Cart → Modal → Cart auto-opens → Checkout → Sign In/Guest
- [x] Tested: 13/13 features, 100% (iteration 24)

### Checkout & Fulfillment Pipeline Fixes (Apr 11, 2026)
- [x] Stripe email binding: customer_email passed to stripe.checkout.Session.create() — pre-fills buyer email on payment page
- [x] Product identity: items stored with both raw product_id and normalized_product_id for reliable PRODUCT_FILES lookup
- [x] Account linking: JWT user_id extracted from Authorization header, stored as user_id + claimed_by_user_id in transaction
- [x] Webhook mapping: fulfillment uses stored user_id from transaction record, never falls back to session_id
- [x] Tested: 13/13 backend tests passed (iteration 25)

### Production Polling Fix + Code Quality (Apr 11, 2026)
- [x] CartContext: stabilized clearCart/removeFromCart/updateQuantity with useCallback to prevent re-render cascades
- [x] PaymentSuccess: added completedRef guard to stop polling after payment confirmed — fixes 60+ download-links calls
- [x] Test files: hardcoded credentials replaced with os.environ.get() (7 files)
- [x] Console cleanup: all console.log/warn removed from 20 production frontend files

### Post-Purchase Fulfillment Fix (Apr 11, 2026)
- [x] Root cause: product IDs stored as Stripe display names (e.g., "Holiday Series - The Covenant - ADULT (99% off)") — normalizer couldn't resolve them
- [x] Added resolve_display_name_to_product_id(): strips discount text, parses series/edition/format from human-readable names
- [x] Added resolve_item_to_file_entries(): unified resolver for all fulfillment paths — handles display names, internal IDs, and bundle expansion
- [x] Added BUNDLE_EXPANSIONS: starter bundles expand to individual product entitlements (holiday_ae + breakfast_ae_digital)
- [x] Fixed series_map false positive: "series" containing "ie" substring no longer matches instructor edition
- [x] Updated all 3 fulfillment paths (webhook, status-check, admin manual) to use resolve_item_to_file_entries()
- [x] Tested: 32/32 backend tests passed (iteration 26)

### Full 5x5 Jeopardy Board + Content Entitlements (Apr 11, 2026)
- [x] Tricky Testaments: true 5x5 grid (categories across top, 100-500 vertically) for paid users
- [x] Demo users: 5x2 board (100-200 only), demo badge, purchase prompts at game over
- [x] Full users: 5x5 board (25 tiles), "Full Board" badge, no upsell prompts
- [x] Questions grouped by character/category into proper columns with escalating difficulty
- [x] Game Center: "Your Game Access" section showing Question Bank, Game Duration, Lesson Audio cards
- [x] Game duration labeling: Free=30min, Standard=1hr, Instructor=3hr
- [x] Audio access tracked separately from trivia access
- [x] Content-specific: 4C AE/YE → 4C bank, BKFT AE/YE → BKFT bank, bundle → combined
- [x] Tested: 11/11 features, 100% (iteration 21)

### Content-Specific Entitlement Engine (Apr 10, 2026)
- [x] /api/trivia/entitlements/me — user's unlocked series, editions, audio, instructor flags
- [x] /api/trivia/questions/for-game — content-gated question delivery
- [x] Product classification: parses names for series + edition
- [x] Question series mapping: Q1=holiday_4c, Q2/Q3=breakfast, empty=shared

### Bundle IE Upgrade + Game Access (Apr 10, 2026)
- [x] Edition selector: AE/YE, instructor upgrade (+$7)
- [x] Standard: 1hr game pass, Instructor: 3hr + offline pack

### Admin UI + Redeem + Resend (Apr 9-10, 2026)
- [x] Admin Orders: search, detail, resend email, grant access
- [x] Admin Submitted Codes: list view
- [x] Redeem Code: UI + backend capture, post-claim → Game Center link
- [x] Public resend-access: rate-limited
- [x] My Library: status labels, resend link UI, redeem code input

### Guest Checkout 404 Diagnosis (Feb 2026)
- [x] Root cause: Emergent static-preview shim was returning 404 when preview pod was paused — NOT a real route mismatch
- [x] Verified `/api/payments/checkout/cart` registered correctly: `payment_router` has `prefix="/api/payments"`, route is `@router.post("/checkout/cart")`, `server.py` includes via `app.include_router(payment_router)`
- [x] Validated active preview backend with 4 curl scenarios (all returned 200 + Stripe URL):
  - Single PDF (Snack Pack AE M1): order_number SF-2026-2E5VK
  - Starter Bundle (Holiday Table Bundle)
  - Multiple cart items (mixed AE/YE + bundle)
  - Guest checkout (no auth header, full customer info)
- [x] Frontend-to-backend flow confirmed by user reaching Stripe payment step in active preview
- [x] Production likely stale — recommend redeploy of kingdom-soul.com

### Production /api/api/ Double-Prefix 404 — FIXED (Apr 25, 2026)
- [x] Root cause identified: production deployment env var `REACT_APP_BACKEND_URL` was set to `https://kingdom-soul.com/api` (with trailing `/api`). Frontend code already adds `/api/...` to every call, producing `https://kingdom-soul.com/api/api/...` → 404 on every endpoint (checkout, auth, signup).
- [x] Confirmed by extracting production JS bundle: `Mo = "https://kingdom-soul.com/api"` and `fetch("".concat(Mo, "/api/payments/checkout/cart"))`
- [x] Defensive fix in `/app/frontend/src/index.js`: global `window.fetch` wrapper that collapses any `/api/api/` → `/api/` transparently. Works for plain string URLs and Request objects.
- [x] Verified in preview via Playwright eval: `fetch('/api/api/payments/catalog')` → finalUrl is `/api/payments/catalog`, status 200, real catalog returned.
- [x] Once production is redeployed with this code, all 31 files that read `REACT_APP_BACKEND_URL` are protected — even if env var is left misconfigured. Recommended: also fix the env var to `https://kingdom-soul.com` (no trailing /api).

### Bundle + File Delivery Policy Aligned (Apr 25, 2026)
- [x] Holiday: AE/YE/IE deliver as separate files; never merged across editions (all 3 PDFs verified on disk)
- [x] Breakfast SP1/SP2/SP3: deliver per edition; AE+YE files exist, IE gated until uploaded
- [x] Full Breakfast (`breakfast_*_digital`, `breakfast-full-*`): GATED as personal-study, never auto-fulfilled
- [x] Holiday per-chapter nibbles (`holiday-nibble-*`): GATED — no substitution to full workbook PDF allowed
- [x] All deliverable items must physically exist on disk; missing files gate (no substitution)
- [x] New `is_deliverable(product_id)` gate function in `payment_routes.py` enforces all rules at the resolution boundary
- [x] `BUNDLE_EXPANSIONS` updated: starter bundles now deliver Holiday + SP1 (was Holiday + Full Breakfast)
- [x] `resolve_item_to_file_entries` filters via the gate; gated/missing items log clear reasons for admin
- [x] Regression test `tests/test_bundle_rules.py`: 31/31 pass, including all bundle expansions, single-item paths, and gating cases
- [x] Lint clean, backend healthy, no behavioral changes to the 5 fulfillment call sites

### Follow-Up Items 1-4 Aligned (Apr 25, 2026)
- [x] **Item 1 — Bundle labeling**: SoulFoodApp.js storefront copy now reads "Break*fast Series — Month 1 Snack Pack (SP1)" (was "Full Digital Workbook"). Reflects actual delivery.
- [x] **Item 2 — Receipt itemization**: New `expand_items_for_receipt()` helper plus `PRODUCT_DISPLAY_LABELS` map. Surfaced via `/api/payments/order/{id}` (added `expanded_items`) and `/api/admin/orders/{order_number}/detail`. Email confirmation template now lists per-bundle sub-deliverables with friendly labels.
- [x] **Item 3 — Expected delivery**: New `EXPECTED_DELIVERY_DEFAULT` ("Expected by Mother's Day (May 10, 2026)") and `expected_delivery_for(product_id)` helper. Receipt rows for gated items now show "Pending — Expected by …" instead of silent absence.
- [x] **Item 4 — Game Pass cumulative runtime**: GAMING_TIERS re-scoped: `game_pass_30` → "1-Hour Game Pass" (60 min total cumulative, 30-day window); `game_pass_90` → "3-Hour Game Pass" (180 min total cumulative, 90-day window). Daily-limit removed for these tiers. New helpers `get_pass_minutes_remaining`, `deduct_pass_minutes`. `can_start_session`, `end_gaming_session`, `get_session_status` all honor cumulative model. Webhook now creates `gaming_passes` record at purchase time (was missing — root cause of "30 min regardless of SKU"). Idempotent grant on (user_id, order_number, pass_type).
- [x] Regression tests `tests/test_followup_items.py`: **38/38 PASS**, plus original `tests/test_bundle_rules.py` still **38/38 PASS** (no regressions to existing fulfillment).
- [x] Lint clean (Python ruff + JS eslint), backend healthy, frontend healthy.

### Phase 1 — Codes & Redemptions Admin (Apr 26, 2026)
- [x] System of record established: new `db.redemption_codes` collection with full schema (code, series, edition, delivery_type, batch_id, batch_size, sequence, total_hours, pacing, duration_days, max_uses, uses_used, status, expires_at, notes, redemption + override audit fields)
- [x] CSV importer with auto-detection of 4 schemas: `student_batch`, `game_only`, `hour_seasonal`, `subscription`
- [x] `POST /api/admin/codes-redemptions/import-csv` — multipart upload, idempotent (dedupe by `code`)
- [x] `GET /api/admin/codes-redemptions/batches` — aggregated batches with total/redeemed/remaining/active/revoked counts
- [x] `GET /api/admin/codes-redemptions/batches/{batch_id}/codes?series&edition&delivery_type` — drill-down with proper scoping (fixed bug where unscoped query returned codes from sibling batches sharing batch_id)
- [x] `PATCH /api/admin/codes-redemptions/codes/{code}/override` — admin override with status (REVOKED/EXPIRED/RESTORED/ACTIVE) + required reason; full audit trail (override_by_admin, override_at, override_reason)
- [x] `GET /api/admin/codes-redemptions/codes/{code}` — single-code detail
- [x] All admin actions logged via existing `log_admin_action` to `admin_audit_logs`
- [x] Frontend: new `AdminCodesRedemptions.js` component wired into AdminConsole sidebar as "Codes & Redemptions" (Tag icon)
- [x] "Submitted Codes" sidebar item kept as read-only history per directive
- [x] E2E verified on preview: imported 2,170 codes across all 4 CSV schemas; 136 batches aggregated; drill-down + override + restore + idempotent re-import all pass
- [x] Lint clean (Python ruff + JS ESLint)
- [ ] **Phase 2 deferred** (per user): user redemption surface in My Library + entitlement-grant logic per delivery_type. Demo-coupon mechanics (preview-only IE, 5h/25h presenter caps, 90-min session cap) noted for alignment.

### MVP Soft-Launch Hardening (Apr 26, 2026)
- [x] **Codes & Redemptions visibility** — confirmed `/api/admin/codes-redemptions/batches` returns ALL batches to any admin (no scoping). Added `imported_by_admin_email` to imported docs and surfaced as `imported_by` column in batch list. UI now shows "All admins see every batch — visibility is global." note.
- [x] **IE Toolbox honesty** — every toast-only action in InstructorToolbox now disabled with "Preview only" banner: Answer Keys (View/PDF buttons), Facilitation Notes (read-only cards), Group Roster (Add Member disabled), Teaching Resources (read-only), Achievement Certificates (3 buttons disabled). Order Medallions remains live (navigates to /quick-order).
- [x] **IE asset routing** — Verified all asset URLs resolve 200 in preview: `/api/content/games/*.pdf|.docx`, `/api/content/images/maps/*.jpg`, `/api/trivia/game-assets`, `/api/trivia/bank/stats`. Game Setup "Start GRinCH/Passport Trek" buttons no longer redirect to wrong page (`/gaming`); now route to `game-packs` tab so users get the correct print materials. Renamed GRinCH → Grid Iron Challenge consistently in toolbox UI.
- [x] **Tricky Testaments single-player cleanup** — Daily Double wager screen replaced 4 free-form-ish buttons (100, 200, Half, All-In) with exactly 3 required options: All / Half / $1 (data-testids: `wager-all-btn`, `wager-half-btn`, `wager-one-btn`, container `daily-double-wager-options`). Game state remains single `score` value (no multiplayer logic).
- [x] **UI polish — game thumbnails** — Grid Iron Challenge AE/YE and Passport Trek AE/YE thumbnails (`/covers/game-gridiron-{ae,ye}.png`, `/covers/game-passport-{ae,ye}.png`) now render in InstructorToolbox `offlineGameFiles` cards and Game Setup tile cards. Trivia Mix-up & Tricky Testaments retained existing storefront logos.
- [x] Health Check: 7/7 backend pytest pass (batches w/ imported_by, 4 game files, map image, game assets). Frontend live-verified: 8 toolbox tiles, Answer Keys preview banner + all View/PDF buttons disabled. iteration_30.json clean.

### Codes & Redemptions — Demo + $1 Test Code Types (Apr 26, 2026)
- [x] Schema extended: `code_type` field on `db.redemption_codes` with values `batch | demo | test`. Legacy CSV-imported codes default to `batch` and are also matched in /batches via $or on missing/null code_type.
- [x] Demo codes (6): DEMOSOFU79, DEMOSOFU77 → 25 total hours · DEMOSOFU80, DEMOSOFU97, DEMOSOFU60, DEMOSOFU55 → 5 total hours. All share: edition=IE, delivery_type=DEMO, batch_id=DEMO-INTERNAL, series_allowed=[BKFT,HOL], session_cap_minutes=90, max_uses=5, preview_only=true, unlocks=[preview_answer_keys, preview_one_map, preview_offline_cards, presenter_games_enabled].
- [x] $1 Test codes (2): BETADOLLAR79, BETADOLLAR97 — code_type=test, delivery_type=DOLLAR_TEST, max_uses=0 (unlimited), expires_at=2026-04-29T03:59:00Z (= 11:59 PM ET Apr 28, 2026).
- [x] Auto-expire-on-read: `_auto_expire_due_codes()` sweeps ACTIVE+past-due codes → EXPIRED at the top of every `/batches` and `/list` endpoint. No cron required (per user choice 3c).
- [x] New endpoints: POST `/api/admin/codes-redemptions/seed-demo-test` (idempotent — preserves uses_used/status, refreshes rules), GET `/api/admin/codes-redemptions/list?code_type=demo|test`.
- [x] /batches scoping: now matches only code_type=batch (or missing/null), so demo/test codes never appear in batch aggregation. total_batches stays at 136.
- [x] Frontend: AdminCodesRedemptions tabs (Batches | Demo | $1 Test) with DemoTable + TestTable subcomponents. Seed/refresh button on demo & test tabs. Override dialog reused for flat lists. Tooltips, "Past due" warning badge on test rows where expires_at < now.
- [x] Test report iteration_31.json: 9/9 backend pytest pass + full frontend Playwright pass.
- [ ] Phase 2 (user-facing redemption flow) STILL BLOCKED per user (4a).

### Earlier Work
- Purchase Flow, Conversion Layer, Auth Fixes, Email Fixes, Store, Games, Coupons

## Prioritized Backlog (ON HOLD per user)
- Full redeem code validation logic (P2 — deferred, using manual capture workflow)
- Force password change on first login (NIST)
- Security: httpOnly cookies
- SMS OTP, Word Search Game, Video Integration
- Gift Certificates, Subscription billing
