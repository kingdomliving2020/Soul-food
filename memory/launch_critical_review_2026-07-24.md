# Launch-Critical Review — July 24, 2026

## 1. SERVER-SIDE PRICING VALIDATION — ✅ FIXED (two-phase, July 24 2026)
- Built `backend/price_catalog.py` = server-authoritative price catalog mirroring the frontend
  storefront (FLAT_PRICES + composite SERIES_PRICING). Wired into `/api/payments/checkout/cart`
  via `_catalog_price_for` (catalog first, then PRODUCTS fallback). Floor = `max(client, auth)`.
- Coupons unchanged & server-validated; floor applies to pre-discount base (discounts can't stack below catalog).
- Rollout flag `PRICING_FAIL_CLOSED` (env, default false):
  * PHASE 1 (now): floors when resolved; logs any unresolved priced item to `db.pricing_unresolved`
    + logger WARNING; never blocks (gift certificates whitelisted as dynamic).
  * PHASE 2: set `PRICING_FAIL_CLOSED=true` to reject checkout for any unresolved priced item.
- Verified: 24/24 storefront cart-ids floor to exact price; tampered $0.50 for a $19.99 item floored to
  $19.99 (live, only failing at Stripe revoked-key step — pricing NOT bypassed); fake SKU logged to
  pricing_unresolved. Tests: `tests/test_price_catalog.py` (all pass).
- ⚠️ ACTION before flipping PHASE 2: run real preview/prod traffic, review `db.pricing_unresolved` for gaps,
  add any missing SKUs, THEN set PRICING_FAIL_CLOSED=true. Full checkout can only be validated with a live
  Stripe key (revoked in preview).

## 1. (superseded) — original finding below

## 1b. SERVER-SIDE PRICING VALIDATION — original gap (now fixed above)
- `/api/payments/checkout/cart` (the ONLY path the storefront uses — CheckoutPage.js:1016) computes
  `unit_price = max(client_price, _catalog_price_for(item))`. But `_catalog_price_for` only matches when
  the cart item carries an EXACT `PRODUCTS` key or SKU. The storefront sends composite hyphenated ids
  (`holiday-ae-digital`, `breakfast-ae-full-epub`, `ihi-ae-pro-ipdf`, `sgb-4`, `offline-game-master-...`,
  `club-5`) with NO sku and NO canonical product_id → floor returns None → **client price is trusted**.
- Empirical: of representative real cart items, only those keyed by canonical id/sku matched; ALL storefront
  ids MISSED. `normalize_product_id` does NOT rescue and MIS-maps some (GM module → breakfast_ae_digital).
- Exploit: a tampered request can set salePrice as low as $0.50 (Stripe 50c min is the only guard) for almost
  any product/bundle. Coupons ARE server-validated (good), but the BASE prices they discount are client-supplied.
- `/api/payments/checkout/session` (single-item, legacy) IS secure (uses `PRODUCTS[id].sale_price`, rejects
  unknown) but is not used by the cart flow.
- FIX REQUIRED: server-authoritative price catalog covering EVERY sellable variant (edition×format×package,
  snack/nibble/holiday, IHI booklets + AE-Pro ipdf/epub/pod/bundle, GM modules+bundle ×digital/physical,
  SGB tiers, Book Club per-set tiers, merch, medallions, subs, game passes, product bundles), resolved by
  cart-id, floor client price to it, and FAIL-CLOSED (reject) on any unrecognized priced SKU. Source of truth =
  frontend pricing config. CANNOT be fully verified in preview (Stripe key revoked) — needs a live post-deploy test.

## 2. eval() FINDINGS — ✅ FALSE POSITIVE (closed)
- No executable `eval(` anywhere in backend. Only `ast.literal_eval` at admin_routes.py:3001/3087 (parses
  Python literals only — lists/dicts/strings/numbers; cannot execute code). Safe. Finding closed.

## 3/4. FULFILLMENT + LIBRARY/RECIPIENT INTEGRITY — ✅ VERIFIED
- Classification matrix + completion: 12/12 lifecycle + 8/8 classification + 8 live admin UI scenarios.
- Edition delivery AE≠YE≠IE (BUG A regression): 6/6 (test_bug_ab_iter54.py). No cross-edition contamination.
- Entitlement/Library/Order-History/gift: 17/17 (validate_entitlements.py) — refunded/cancelled/test excluded
  from Library; gift owned by recipient only; buyer download-links return is_gift/no tokens; digital delivery
  does NOT close a mixed/hybrid order (verified open→complete transitions).

## 5. ADMIN VISIBILITY — ✅ NO PER-ACCOUNT DIVERGENCE
- Preview has 1 admin (overflowharvest@gmail.com). The 2 prod admins that showed "blank" (temiajoy…, jafari…)
  exist only in PRODUCTION. `get_current_admin` authorizes purely on JWT role/access_level; ALL admins get
  identical ROLES['admin'] perms (['*']). No feature-flag/profile difference. The blank-console cause was a
  STALE/expired JWT role (403 swallowed) — already fixed via the AdminConsole role-probe gate. Resolution for
  the prod admins: sign out + sign in again to refresh their token's role → full tools appear.
