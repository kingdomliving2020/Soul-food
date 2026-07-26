# IE Inclusions Matrix + Bulk-Discount + Snack-Pack Audit (June 2026)
Report-only reconciliation of what is CURRENTLY REPRESENTED vs the pastor bulk sheet.
No benefits added or removed; no fulfillment changed.

## A. INCLUDED-BENEFITS MATRIX (as currently displayed on the storefront)

### 4 C's of Christianity (internal: Holiday)
| Edition | Price (digital / print) | Currently DISPLAYED inclusions |
|---|---|---|
| AE (Adult) | $9.99 / $19.99 | 4 C's lessons (Covenant·Cradle·Cross·Comforter), reflection space, group activities; **Exclusive Audio Companion Access** (stated: "every 4 C's full workbook, Print or Digital") |
| YE (Youth) | $9.99 / $19.99 | Same, youth-oriented; **Audio Companion** (per same statement) |
| IE (Instructor) | $34.99 | Instructor teaching support, discussion guidance, answer helps, maps + cultural/historical notes; **"IE includes the Exclusive Audio Companion at no extra cost"** |

### Foundation in Christ (internal: Break*fast)
| Edition | Price (digital / print) | Currently DISPLAYED inclusions |
|---|---|---|
| AE (Adult) | $14.99 / $29.99 | Adult workbook, journal space, reflective prompts, group activities. **Audio Companion NOT displayed** |
| YE (Youth) | $14.99 / $29.99 | Same, youth. **Audio Companion NOT displayed** |
| IE (Instructor) | $49.99 | Instructor teaching support, answer helps, maps + notes. **Audio Companion NOT displayed; "Full Game Suite" NOT displayed** |

## B. IE / benefit DISCREPANCIES vs the bulk sheet (user suspicion CONFIRMED)
1. **Audio Companion is only advertised for 4 C's.** Foundation (all editions) shows NO Audio Companion. If Foundation is meant to include it, the display UNDER-represents it. (Backend `_grant_audio_access_for_items` currently grants audio for **holiday/4 C's** keys only — so behavior matches the 4 C's-only wording, NOT the sheet if the sheet implies all curricula.)
2. **"Full Game Suite (4 Games)" per the sheet** is listed as included with each curriculum's IE. On the storefront, games are sold **separately** (offline packs + online passes) or via the **Instructor Bundle upgrade** (3-Hour Online Game Pass + Offline Game Pack). So the standalone **IE workbook does NOT display "Full Game Suite included"** → under-representation vs the sheet.
3. **Instructor Bundle upgrade** (homepage) DOES include: IE content + 3-Hour Online Game Pass + Offline Game Pack — but this is the *bundle*, not the plain IE workbook SKU.
→ ACTION for user: decide the intended IE inclusion set (Audio? Game Suite?) then we reconcile DISPLAY to match. Not changed per "do not add/remove benefits."

## C. BULK DISCOUNT TIERS — sheet vs site (MISMATCH — do not change pricing yet)
- **Sheet ladder:** Church Starter (10 booklets + Facilitator, **5% off**); Ministry (20+ booklets + Facilitator Guides, **10% off**); 50+ Custom (**15% off**); Family Bundle (2 AE + 2 YE + Facilitator).
- **Site reality:** named bundles are **FLAT-PRICED** — `BUNDLE-FAMILY $24.99`, `BUNDLE-CHURCH-STARTER $49.99`, `BUNDLE-MINISTRY $89.99`. There is **no percentage-off tier logic** tied to these. Separate bulk models exist (`sgb-*` Small-Group flat bundles; `club-*` per-set Book-Club tiers) that don't map to the sheet's %-off ladder.
- **Mismatch:** churches reading "5/10/15% off" on the sheet will not see those percentages on the site (they see flat bundle prices). Also verify Family Bundle contents ($24.99 seems low for "2 AE + 2 YE + Facilitator" if print). RECONCILE before any pricing change.

## D. SNACK PACK FILE ATTACHMENT — traced (real mapping bug, not missing file)
- `breakfast-snack-month-1-adult-interactive` → resolves to its OWN key ✅ (correct online snack-pack).
- **`bkft-sp-ae-m1` (admin SKU, $8.99) → resolves to `breakfast_ae_digital` = the FULL Foundation Adult digital workbook** ❌ OVER-DELIVERY. It is NOT a missing file — it resolves THROUGH the full-workbook asset mapping. A $8.99 snack pack would deliver the full $14.99 workbook.
- RECOMMENDATION (not applied — report first): remap `bkft-sp-ae-m1` to the snack-pack asset (or the month-1 lesson set) so it delivers only the 4-lesson snack pack. Awaiting user go-ahead before changing fulfillment.

## Done in this batch (naming + Foundation print) — see sales_readiness audit
- Relabeled customer-facing "Holiday"→"4 C's of Christianity" and "Break*fast"→"Foundation in Christ" (package selectors, bundles, taglines, homepage copy). Internal SKUs/keys unchanged.
- Foundation in Christ PRINT ($29.99) added to the PRIMARY Foundation card (physical shows on the full Meal Bundle only, not Nibble/Snack Pack); catalog price added; resolves as a POD/shippable item (pending-fulfillment path).
