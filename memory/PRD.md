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

### Auth — Instructor 2FA Removed (Apr 26, 2026)
- [x] `ROLES_REQUIRING_2FA` in `/app/backend/auth_routes_v2.py` reduced from `['instructor','instructor_tester','admin','owner']` → `['admin','owner']`. Instructors and instructor_tester roles no longer trigger `requires_2fa_setup` / `requires_2fa_verification` flags at login (Google OAuth + password flows). Admin/owner 2FA enforcement unchanged.
- [x] Verified: instructor login returns clean access_token with no 2FA flags; admin login still emits `requires_2fa_setup: True`.
- [x] No DB-side cleanup needed: 0 instructor users had `tfa_enabled=True` at the time of the change. The runtime gate `requires_2fa(role)` makes legacy `tfa_enabled` flags inert for instructors.
- [x] Test credentials updated in `/app/memory/test_credentials.md` with non-2FA instructor account.

### Backend P1 Fixes (Apr 26, 2026)
- [x] **Password-reset auto-login JWT now embeds `access_level` claim** (`auth_routes_v2.py` line ~1250). Verified end-to-end: created a real reset token via `security.create_reset_token`, called `/api/auth/reset-password`, decoded returned JWT → `{role:'admin', access_level:'admin'}`. Hit `/api/admin/codes-redemptions/batches` with the reset-flow JWT → 200 (was 403).
- [x] **`/api/health/version` endpoint live** (server.py near `app.include_router(api_router)`). Captures `git_sha`, `version`, `booted_at`, `now`. Public, no PII. Curl: `curl https://kingdom-soul.com/api/health/version` to instantly verify whether prod is running stale code.

### Post-Deploy Triage — Code Bugs Fixed (Apr 27, 2026)
- [x] **DEMOSOFU* + BETADOLLAR* now wired into checkout coupon validation** (`/app/backend/coupon_routes.py`).
  - `validate_coupon` falls through to `db.redemption_codes` after a `db.coupons` miss via new `_validate_redemption_code_as_coupon` helper.
  - DEMOSOFU codes: 100% off, valid only when ALL cart product_ids start with `holiday`/`breakfast`/`hol`/`bkft`. Honors max_uses (5) and status. Non-BKFT/HOL items return friendly rejection.
  - BETADOLLAR codes: `override_total = $1`. Auto-rejects if past expires_at (Apr 28 2026 11:59 PM ET).
  - `/api/coupons/use/{code}` now also increments `redemption_codes.uses_used` as a fallback when no `db.coupons` match.
- [x] **Admin Orders intermittent zero rows fixed** (`/app/backend/routes/admin_routes.py` + `/app/frontend/src/AdminOrders.js`).
  - Removed duplicate `@router.get('/orders')` and `/orders/{order_number}/send-email` routes at line 2060+ (response shape `{orders}`) which had been shadowing the canonical line-952 endpoint (response shape `{items}`).
  - Rewrote `AdminOrders.js fetchOrders/fetchRefundRequests` to use `fetch()` with Bearer auth and correctly destructure `{ ok, data }` from `safeJson` (previously was raw XHR with no auth and reading `data.orders`).
  - Verified: /admin/orders now renders all 77 preview orders.
- [x] **Tricky Testaments wrong-answer score deduction restored** (`/app/frontend/src/TrickyTestamentGame.js`).
  - 'Missed it!' button (~line 755) now deducts `selectedQuestion.points` for regular wrong answers in addition to the existing `wager` deduction for Daily Double. Label updated to `Missed it -<points>`.

### Paid iPDF Viewer — INLINE entitlement gate (Apr 27, 2026)
- [x] **Root cause**: `InteractiveLesson.js` had a `hasPurchased` state that was initialized to `false` and never updated. Free lessons bypassed via `isFreelesson()`; paid lessons hit the "Preview Ends Here / Purchase Full Lesson" lock screen even when the user had bought it. The component never queried the user's entitlement.
- [x] **Fix per user policy ("Treat all iPDFs as delivery_type = INLINE; bypass fulfillment/download-link logic; depend only on active entitlement")**:
  - Backend: new `GET /api/interactive-lessons/entitlement/{nibble_id}` (auth optional). Free nibbles always pass. Authed users: scans `payment_transactions.payment_status='paid'` for matching items, expanding bundles via `BUNDLE_EXPANSIONS`. Grant set per nibble derived from the nibble_id (direct interactive product, any-nibble-pass, full-series interactive, series digital/print, breakfast snack-pack passes).
  - Frontend: `InteractiveLesson.js` now calls the entitlement endpoint on mount alongside `fetchNibble`, and sets `hasPurchased=true` when `has_access=true`.
  - Verified end-to-end: anon paid nibble → locked; authed-no-purchase → locked; authed + holiday_ae purchase → fully unlocked (Bites, Reflection Question, To-Go Box, Activity all rendered); bundle purchase (`holiday-table-bundle-ae`) also unlocks via expansion; free nibbles always render.

### Webhook-Independent Order Recovery (Apr 28, 2026)
- [x] User reported: Stripe says webhook is blocking delivery; needs the admin console to actually push orders through manually.
- [x] **Backend `POST /api/admin/orders/{order_number}/sync-stripe`** — calls Stripe Checkout Session API directly with the stored `session_id`, flips the order to paid if Stripe confirms, creates download links via `create_download_link`, and stamps `synced_from_stripe_by/at` on the transaction. Idempotent. Returns Stripe's actual `payment_status` if not yet paid (so admin sees the truth).
- [x] **Backend `POST /api/admin/orders/{order_number}/mark-paid`** — manual override that bypasses Stripe entirely. Requires a `reason` for audit trail. Flips status, creates download links, stamps `manual_paid_by/reason/at`. For cases where Stripe is unreachable but funds are confirmed via Dashboard.
- [x] **Frontend (`AdminOrders.js` + `AdminConsole.js`)** — both order surfaces now render two extra row-level buttons ONLY on pending orders:
  - 🔄 **Sync from Stripe** (indigo) — calls the sync endpoint, success toast on flip, warning toast if Stripe still says unpaid, error toast on transport failure.
  - ✅ **Mark as Paid** (green) — prompts for reason via window.prompt, calls mark-paid endpoint.
- [x] Webhook is no longer required for MVP fulfillment. Admin can push every order manually with full visibility into customer email + items + amount + status + Stripe session id (already in the existing detail expander). The Stripe webhook becomes a nice-to-have automation rather than a hard dependency.
- [x] Verified end-to-end on preview: sync-stripe correctly reported `payment_status='unpaid', session_status='expired'` for the live test order; mark-paid with empty reason returns 400; mark-paid with a real reason flips the status and surfaces in the audit log.

### Content Manager v2 — Durable Storage (Apr 28, 2026)
- [x] **User pain**: Production missing `/app/backend/content/` after redeploys. Pod filesystem isn't durable. Existing Content Manager / Instructor Content / Media Library / Products tabs were metadata-only with no actual upload. Admin needed a real ops tool.
- [x] **Integration**: Emergent Object Storage via `EMERGENT_LLM_KEY` (per playbook). Added `EMERGENT_LLM_KEY` to `/app/backend/.env`. New `storage_service.py` wraps init/put/get with auto-retry on 403. Init at server startup; non-fatal if storage unreachable (per-request retry).
- [x] **New backend routes** (`/app/backend/routes/admin_files_routes.py`, prefix `/api/admin/files`):
  - `POST /upload` (multipart) — uploads to durable storage + records in `db.files`. Caps: 50 MB per file, allow-list of safe extensions (pdf, png, jpg/jpeg, webp, gif, svg, docx, doc, csv, txt, md, json, mp3, m4a, wav).
  - `GET ` — paginated list (skip/limit, default 50, max 500). Filters: search, category, include_deleted. **No 6-7 cap.** Returns total + items.
  - `DELETE /{file_id}` — soft-delete (Emergent Object Storage has no delete API; blob remains, DB record hidden).
  - `POST /{file_id}/restore`
  - `POST /{file_id}/replace` (multipart) — uploads new path, updates DB pointer; previous_storage_path retained.
  - `POST /{file_id}/attach` — link file to product or order with optional role; `db.files.attachments[]`.
  - `DELETE /{file_id}/attach/{attach_id}` — detach.
  - `GET /{file_id}/download` — admin-only stream from storage.
- [x] **New frontend page** `/admin/files` (`AdminFileManager.js`): upload button, search + category filter + show-deleted toggle, paginated table with icon-by-content-type, per-row actions (Download / Attach / Replace / Delete + Restore for deleted), inline attachment chips (click to detach), Replace dialog, Attach dialog with type+id+role.
- [x] **Sidebar nav**: "File Manager" added to AdminConsole sidebar above Content Manager so it's first-class.
- [x] **Verified end-to-end**: upload → list → download (round-trip identical) → attach product:holiday_ae + order:SF-2026-TEST → list shows 2 attachments → soft-delete → list excluded by default → include_deleted=true shows it → Restore.
- [x] **Persistence**: All blobs live in Emergent Object Storage, completely outside the deploy artifact. **Files now survive every redeploy** by design — that's the whole point.

### Production-Only Issues — Awaiting Deploy Bundle Fix (NOT CODE)
- [x] **`/app/content/` directory missing from production deploy bundle** — RESOLVED Apr 27 2026 by moving `/app/content/` → `/app/backend/content/` via `git mv` (preserves history + 129 files / 299 MB). The Emergent deploy artifact only ships `/app/backend/` and `/app/frontend/`; top-level siblings like `/app/content/` were silently dropped. Code paths swept: `server.py` static mounts, `payment_routes.PDF_DIR`, `routes/admin_routes.py` fulfillment seeds + content-health, `routes/download_routes.py CONTENT_DIRS`, `routes/lessons.py possible_paths`, `seed_qa_bank.py`. Legacy `/app/content/*` paths kept as fallback in `CONTENT_DIRS` so existing `download_links` DB rows auto-heal via `resolve_file_path` (preview shows `legacy_paths_auto_resolved=17, broken_link_count=0`). 3 dangling symlinks in `lesson_pdfs/` converted to real file copies for deploy safety. Deploy agent: PASS, no blockers.

### Lifelines for Tricky Testaments (clarification needed)
- TrickyTestamentGame is a Jeopardy-style game and has never had Millionaire-style lifelines (50/50, ask audience, etc.). Lifelines belong to MixUpGame (the Trivia Mix-up game). Asked user to confirm whether they wanted lifelines added as a new feature or if they were looking at the wrong game.

### Production deploy bundle drops `/app/backend/content/` — manifest sync fix (May 1, 2026)
- [x] **Root cause confirmed**: production's deploy bundle excludes `/app/backend/content/` (300 MB across 129 files). All files ARE committed to git (verified via `git ls-files`), so this is an Emergent platform-side artifact size limit. Production's filesystem only contains code + the 8 manually-uploaded files via Admin UI. Migration scripts walking the local filesystem find nothing.
- [x] **Object Storage is shared across environments** (keyed by `EMERGENT_LLM_KEY`). The 102 unique blobs uploaded from preview ARE accessible from production. What's missing in production is the `db.files` index that points to them.
- [x] **New endpoints** in `/app/backend/routes/admin_files_routes.py`:
  - `GET /api/admin/files/export-manifest` — exports every active `db.files` record (id, storage_path, attachments, metadata) as a JSON manifest.
  - `POST /api/admin/files/import-manifest` — accepts that JSON, idempotently re-creates `db.files` records (dedup by storage_path), merges or overwrites attachments. Each blob's reachability is HEAD-checked via `head_object`; unreachable blobs are surfaced in the response.
  - `POST /api/admin/files/verify-storage` — HEADs every active `db.files.storage_path` and reports unreachable blobs.
- [x] **UI** in `AdminFileManager.js`: "Sync prod" button opens a dialog with Export manifest / Import manifest / Verify storage actions. The dialog shows preview→prod sync instructions inline.
- [x] **Verified end-to-end on preview**: export returns 102 items, verify-storage returns checked=102/reachable=102/unreachable=0. Sync UI dialog renders results correctly (toast: "All 102 blob(s) reachable in Object Storage").
- [x] **Inventory report** generated at `/app/MANUSCRIPT_INVENTORY.md` — full file → product → bundle mapping for the 102 blobs + all 10 BUNDLE_EXPANSIONS.

### Fulfillment gated on retrievability verification (Apr 30, 2026)
- [x] **Bytes-level verification before `status='fulfilled'`**: new helper `_verify_file_retrievable()` in `payment_routes.py` — for `objstore:<path>` it calls `storage_service.head_object()` (HEAD with range-GET fallback); for local paths it calls `os.path.exists`. Never raises, returns False on any error.
- [x] **New `storage_service.head_object(path)`** — lightweight existence probe against Emergent Object Storage. Tries HEAD first; falls back to a 1-byte `Range: bytes=0-0` GET if HEAD is unsupported (405/501). 403 triggers a single key refresh + retry. Never raises.
- [x] **New `_verified_entries_for_fulfillment()`** helper — resolves + verifies each file entry. Returns `(verified, failures)` where failures carry a reason (`no_path` / `not_retrievable`).
- [x] **All 3 fulfillment sites updated** (webhook, status-check, admin refulfill) to:
  1. Gather file entries via `resolve_item_to_file_entries`
  2. Verify retrievability before creating download links
  3. Set `status='fulfilled'` ONLY if at least one verified link was created
  4. If nothing verified → set `fulfillment_status='pending_verification'` instead of fulfilled
  5. Persist `fulfillment_verification_failures[]` on the transaction (product_id, name, pdf_path, reason) for admin visibility
- [x] **Frontend already correct**: `MyLibrary.js` only renders the "Download PDF" button when `purchase.download_url` exists (line 441). Since we no longer create download_links for failed verifications, the button naturally doesn't render; the status badge shows "Processing" instead.
- [x] **Verified**: `_verify_file_retrievable` returns correct booleans for all 5 cases (obj-exists, obj-missing, local-exists, local-missing, empty). `_verified_entries_for_fulfillment` correctly splits a mixed entry list into 1 verified + 1 failure. Lint clean, backend healthy.

### `product_file_mappings` deprecated + repaired (Apr 30, 2026)
- [x] **`db.product_file_mappings` is now legacy**. The single source of truth for product↔file bindings is `db.files.attachments[]` (written via File Manager / migration script). The lookup branch was removed from `get_pdf_path_async()` — priority is now: (1) Object Storage via `db.files`, (2) local `PRODUCT_FILES` (legacy), (3) expected path.
- [x] **Repair script** `/app/backend/scripts/repair_product_mappings.py` + admin endpoint `POST /api/admin/files/repair-product-mappings?apply=`. For each row:
  - Match to `db.files` attachment → rewrite `file_path` to `objstore:<storage_path>`, refresh `filename`, stamp `repaired_at`/`repaired_by`/`repaired_from`.
  - No match → set `active=False`, stamp `deprecated_at`/`deprecated_reason`. Stale `/app/content/` paths no longer advertised.
- [x] **Verified end-to-end** on preview: 230 rows total → 228 rewritten to `objstore:` paths, 2 deprecated (`bonus_names_of_god`, `bonus_times_seasons` — no corresponding legacy file existed). Idempotent re-run = 0 new repairs, 228 `already_objstore`. Zero rows remain with stale active `/app/content/` paths.

### Fulfillment now writes Object Storage refs, not local paths (Apr 30, 2026)
- [x] **`get_pdf_path_async()` rewritten** (`/app/backend/payment_routes.py`) with new priority order:
  1. `db.files` Object Storage attachment (preferred for ALL new fulfillments) → returns `objstore:<storage_path>`
  2. `db.product_file_mappings` admin override (returns local path if file exists)
  3. Local `/app/backend/content/downloads/` via `PRODUCT_FILES` — legacy only, logs a redeploy-fragility warning
  4. Expected local path even if missing — last-resort guess
- [x] All 5 fulfillment call sites (webhook, status-check, admin manual sync, admin re-fulfill, admin grant) now persist `objstore:`-prefixed `file_path` values into `download_links` for migrated products. New orders survive every redeploy without re-fulfillment.
- [x] **`download_routes.py` updated** to handle the new format:
  - `resolve_file_path()` ignores `objstore:` paths (returns "")
  - `download_file()` recognizes `objstore:<path>` early and streams via `_stream_from_object_storage()` helper without disk lookup
  - Existing local-disk + db.files-fallback branches preserved as legacy compat
  - Helper extracted so all three Object Storage paths (early `objstore:`, db.files product fallback) share one streaming implementation
- [x] **Verified end-to-end**: `get_pdf_path_async('holiday_ae')` → `objstore:soul-food/downloads/...pdf`. Synthetic download_link with `objstore:` path → HTTP 200, 13.3 MB PDF byte-identical to source, `X-Source: object-storage`, counter increments correctly.
- [x] Lint clean (Python ruff).

### Legacy Files Migration → Object Storage (Apr 29, 2026)
- [x] **New script** `/app/backend/scripts/migrate_legacy_files.py` walks `/app/backend/content/` recursively, hashes each file (sha256), uploads to Emergent Object Storage via `storage_service.put_object`, and inserts a `db.files` record using the same schema as the Admin File Manager. Idempotent — re-runs are safe (`legacy_sha256` dedup; identical bytes are merged into one record).
- [x] **Auto-attach (option c — skip ambiguous)**: For files under `content/downloads/`, the script builds an inverse index of `payment_routes.PRODUCT_FILES` and attaches each migrated file to every product_id that aliases it (role=`legacy`). Files outside downloads/ (holiday/, bonus/, images/, etc.) are left unattached for manual wiring.
- [x] **Admin endpoint** `POST /api/admin/files/migrate-legacy?apply=&attach=` runs the migration in-process. Dry-run by default; `apply=true` actually writes. Returns full summary (`total / migrated / already_migrated / would_migrate / auto_attached_count / errors / results`).
- [x] **UI**: "Migrate legacy" button in `AdminFileManager.js` opens a dialog with Dry-run + Apply actions and a summary panel showing the per-status counts (and per-file error rows when present).
- [x] **Verified end-to-end**: 129 source files → 102 unique blobs in storage (27 duplicates merged), 228 product auto-attachments, round-trip download of 13.3 MB `holiday-ae-full.pdf` byte-identical, idempotent re-run = 0 new / 129 already_migrated / 0 new attachments.
- [x] All blobs now durable across redeploys. Local `/app/backend/content/` becomes a deploy-time seed only — DB pointers carry users forward.

### Earlier Work
- Purchase Flow, Conversion Layer, Auth Fixes, Email Fixes, Store, Games, Coupons

## Prioritized Backlog (ON HOLD per user)
- Full redeem code validation logic (P2 — deferred, using manual capture workflow)
- Force password change on first login (NIST)
- Security: httpOnly cookies
- SMS OTP, Word Search Game, Video Integration
- Gift Certificates, Subscription billing
