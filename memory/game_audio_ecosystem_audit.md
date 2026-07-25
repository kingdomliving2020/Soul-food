# Game Ecosystem + Audio Companion Classification (July 24, 2026)

## GAME PRODUCT FAMILIES — three distinct categories (must NOT be conflated)

### A. Offline / Fellowship Games (game CONTENT + achievement MERCH)
| SKU | Category | Entitlement | Library | Delivery | Fulfillment |
|---|---|---|---|---|---|
| GRinCH Bingo — offline pack (`offline-game-master-...` / GM content) | Offline game content | Game content download OR printed pack | Buyer/recipient (digital) | Digital PDF instant OR physical pack (pre-order) | AUTO (digital) / PHYSICAL ship (pack) |
| GRinCH Champion Medallion (`MEDAL-GRINCH-AE/YE/IE`) | Achievement merch | Physical medallion ownership | n/a | Physical ship | PHYSICAL (IE medallion NOT manual review) |
| Passport Trek — offline pack | Offline game content | download / pack | Buyer/recipient | Digital / physical pack | AUTO / PHYSICAL |
| Passport Trek Medallion (`MEDAL-PASSPORT-AE/YE/IE`) | Achievement merch | medallion ownership | n/a | Physical ship | PHYSICAL |
| Kingdom Tic Tac Toe (IHI) | Offline game *within IHI* | Delivered as part of IHI AE-Pro | Buyer (IHI AE-Pro) | Digital w/ AE-Pro or POD | Follows IHI AE-Pro path (NOT standalone) |

### B. Online Games (gameplay experiences — NOT sold as SKUs; unlocked by a pass)
| Experience | Category | Entitlement source | Notes |
|---|---|---|---|
| Trivia Mix-Up (Millionaire) | Online game experience | Unlocked by Game Pass / Day Pass | No SKU, no price, no library line |
| Tricky Testaments (Jeopardy) | Online game experience | Unlocked by Game Pass / Day Pass | Expansion content = `BKFT-EXP-GAME` (pre-order, separate) |

### C. Access Products (ENTITLEMENTS — NOT games; fulfilled separately)
| SKU | Category | Entitlement | Library | Delivery | Fulfillment |
|---|---|---|---|---|---|
| 1-Hour Game Pass (`game_pass_30`) | Access entitlement | 1 hr cumulative online-game access | Buyer (game pass) | Entitlement grant (no file) | AUTO |
| 90-Day Game Pass (`game_pass_90`) | Access entitlement | 3 hrs cumulative access | Buyer | Entitlement grant | AUTO |
| Gaming Day Pass (`gaming_day_pass`, $29.99 sale / $40 list) | Access entitlement | 24-hr access to all modes | Buyer | Entitlement grant | AUTO |
> RULE: passes are entitlements — never classified/fulfilled as game content or merch.

## IHI FORMAT CLARIFICATION
Physical/POD: IHI AE (`ihi_ae_core`/IHI-AE), IHI YE (`ihi_ye_core`/IHI-YE), IHI AE POD, IHI YE POD,
IHI AE-Pro POD (`ihi_pro_pod`/IHI-AE-PRO-POD) — all `no_digital_fulfillment` → PHYSICAL ship.
Digital: IHI AE-Pro iPDF (`ihi_pro`/`ihi-ae-pro-ipdf`/IHI-AE-PRO), IHI AE-Pro ePub (`ihi-ae-pro-epub`) → AUTO digital.
Hybrid: IHI AE-Pro Bundle (`ihi_ae_pro_bundle`/IHI-AE-PRO-BUNDLE) → MIXED (digital + physical lanes; can't close on digital alone — FIXED in this session).
Kingdom Tic Tac Toe → belongs to IHI ecosystem; delivered inside IHI AE-Pro (digital) / POD.

## AUDIO COMPANION STRATEGY (launch)
- Audio Companion = INCLUDED ENTITLEMENT, not a product. NOT priced, NOT a cart line item.
- At launch: NO standalone Holiday audio sales. Included with every Holiday paperback/POD purchase.
- Fulfillment: audio access code auto-generated on physical purchase (webhook audio-code generator,
  audio_routes.AUDIO_CONTENT); emailed + redeemable in My Library (MultimediaPage). Library target = buyer
  (db.audio_access keyed by email). Delivery method = access code / redemption. Fulfillment = AUTO.
- Messaging FIXED: removed "Free Audio" / "Bonus Audio". Now uses "Exclusive Audio Companion Included/Access"
  (CheckoutPage.js physical-book banner + SoulFoodApp.js snack-pack note).
- Content: 7-10 min lesson audio, highlights, key takeaways, closing prayer, faith-leader presentation.
- FUTURE (NOT launch, do not build): individual $2.99, 4-lesson $9.99, complete course $24.99.
