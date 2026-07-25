# Launch-Critical Review — July 24, 2026

## 1. SERVER-SIDE PRICING VALIDATION — ❌ LAUNCH-CRITICAL GAP (needs decision)
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
