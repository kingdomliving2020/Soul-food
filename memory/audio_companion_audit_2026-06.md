# Audio Companion — Visibility & Fulfillment Audit (June 2026)

**Scope:** AUDIT ONLY (no build). Reports current implementation, wording, and where it appears.

## Which products grant Audio Companion access (backend truth)
Source: `payment_routes.py :: _grant_audio_access_for_items` (runs on BOTH webhook + status-check fulfillment).
Grants `series_access: "holiday"` + 4 lessons (covenant/cradle/cross/comforter) when a purchase resolves to:
- **Holiday full workbook** — file_key `holiday_ae` / `holiday_ye` / `holiday_ie` (this is the **digital workbook** delivery key — see note).
- **Holiday nibble** (single lesson) → that lesson's audio only.
- **Holiday Table Bundle / Full Table Experience** → all 4 lessons.
- Name-based fallback: item name containing holiday/4c/covenant/cradle/cross/comforter + full/workbook/bundle.

## Complimentary vs paid
- **Complimentary (included):** Holiday full workbook purchases (per above) + Holiday bundles + IE. No separate charge.
- **Paid standalone audio:** Homepage Holiday card advertises audio teachings at **$2.49/lesson · $7.99 all-4** (Pastor Mike Edwards) — a separate purchasable audio product, distinct from the included Companion.

## Customer-facing wording (where it appears)
1. **Homepage** (`SoulFoodApp.js` ~948–955), inside the Holiday series card:
   - "🎧 Audio Teachings by Pastor Mike Edwards" (paid tiers $2.49 / $7.99)
   - "📦 Paperbacks include Exclusive Audio Companion Access"
   - "IE includes the Audio Companion at no extra cost"
2. **Checkout** (`CheckoutPage.js` ~1702–1711), shown ONLY when the cart has physical items (inside shipping section):
   - "Exclusive Audio Companion Included — Your paperback purchase includes Exclusive Audio Companion Access — lesson highlights, key takeaways, and a closing prayer…"
3. **Multimedia page** — "Redeem Audio Access Code" (redemption UI, not a purchase-decision surface).

Wording already uses the approved phrases ("Exclusive Audio Companion Included/Access", "Included with Your Paperback Purchase"). **No banned phrases** ("Free Audio" / "Bonus Audio") found in customer-facing code.

## GAPS / RECOMMENDATIONS (report only — not built)
- **G1 — Missing from Quick Order.** The Audio Companion is NOT surfaced anywhere on `/quick-order`, the primary purchase-decision page. Recommend a small line on the Holiday paperback format + the Holiday bundles (e.g. "🎧 Exclusive Audio Companion Included with your Paperback"). Placement: under the Holiday paperback price and on the Holiday Table Bundle / Full Table Experience feature lists.
- **G2 — Policy vs behavior mismatch.** Wording says the Companion is included with **paperback**, but the backend also grants it for **Holiday full-workbook DIGITAL** purchases (file_key `holiday_ae/ye/ie`). Either (a) update wording to "included with any Holiday full workbook (paperback or digital)", or (b) tighten the backend to grant only on physical Holiday purchases. Needs a product decision — NOT changed in this pass.
- **G3 — eBook tile (new).** The re-labeled "4 C's of Christianity – Adult eBook" (`holiday-ae-full-epub`) does NOT grant audio (correct if Companion is paperback-only). Consistent with G2 option (a) only if digital-workbook still grants — confirm intended behavior.
