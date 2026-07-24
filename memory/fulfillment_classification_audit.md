# Fulfillment Classification Audit (June 2026 — pre-launch)

Validated against live code in `payment_routes.py` (PRODUCTS, BUNDLE_EXPANSIONS, is_deliverable)
and `routes/admin_routes.py` (`_item_is_physical`, `_item_is_digital`,
`_order_requires_manual_review`, `_compute_lifecycle`).

## Classifier rules (as implemented)
- MANUAL if ANY: mixed (has_physical AND has_digital) · edition==IE/"instructor" ·
  Small Group / Book Club bundle (isSmallGroupBundle/isBookClub or name blob) · any line qty>=5.
- AUTO = digital obligation only, no manual trigger.
- PHYSICAL = physical only, no digital, no manual trigger.
- Completion: order closes ONLY when every applicable lane satisfied (digital/physical/manual/recipient).
  VERIFIED CORRECT: digital delivery alone never closes a mixed order.

## Matrix — see chat message (2026 audit). Groups:
- AUTO: snack packs, holiday AE/YE, bkft AE/YE digital (via format keys), nibbles, free bonus,
  game passes, subscriptions, all-digital product bundles (holiday-table, full-table),
  IHI-AE-PRO (digital), Game Master digital format.
- MANUAL: any IE (BKFT-IE, HOL-IE, LNCH-IE), Small Group Bundles (sgb-*), Book Club (club-*).
- PHYSICAL: paperbacks (bkft/hol/lunch PB), IHI core POD booklets, IHI-AE-PRO-POD, merch,
  medallions (single+packs), Game Master physical (pre-order).
- PENDING: BKFT-EXP-GAME (pre-order), full breakfast digital (gated personal-study).

## FINDINGS / GAPS (launch risks) — #1-#4 RESOLVED July 24, 2026; #5 kept as-is per user
1. HYBRID bundles classified physical-only → digital half untracked; order auto-completes on
   physical delivery without confirming digital. `_item_is_digital` ignores hybrid_fulfillment &
   bundle_contents.digital. Affects IHI-AE-PRO-BUNDLE (LIVE), BUNDLE-FAMILY/CHURCH-STARTER/MINISTRY
   (latent — not in storefront).
2. Small Group Bundle physical shipping invisible: medium='bundle' -> has_physical=False. Manual
   review keeps open, but no ship/track lane for IE + participant booklets.
3. qty>=5 alone can force manual review even for pure-digital self-purchase (violates
   "quantity alone must not decide").
4. `_is_ie_item` over-matches: IE medallions/merch (edition=IE) forced to manual review.
5. Full Break*fast digital workbooks (breakfast_*_digital) hard-gated in is_deliverable ->
   don't auto-deliver -> pending/manual email. Confirm still intended.

## Deferred (still parked): automated fulfillment/reminder emails (APScheduler 7-day job,
   delivery-confirmation + gift-opened wiring). Templates exist in email_service.py.
