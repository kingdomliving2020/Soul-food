# MVP Sales-Readiness Audit & Fixes (June 2026)

Cross-checked storefront + admin against the pastor-facing BULK PRICING SHEET (source of truth).

## DONE this batch (verified iteration_58.json)
- **Game-pass value ladder standardized** (user's canonical ladder):
  - Free = "5 questions · 1 game"
  - Instructor-included = **3-Hour Online Game Pass**
  - Certificate/Gift = **4-Hour Online Game Pass** ($9.99)  ← was "8-Hour Game Pass"
  - Day Pass = **24-Hour Access, $29.99** (removed unexplained ~~$40~~ strikethrough)
  - 90-Day Pass = **$75.00** (QuickOrder now shows ONE 90-Day pass; removed 30-Day "Game Night Lite"; catalog gaming-pass-90 24.99→75.00)
  - GamingCentral tier cards + duration card aligned; removed "1-Hour Pass", "Ministry $24.99/mo", "30 min/day".
- **eBook price corrected to non-discounted $9.99** (4 C's Adult eBook tile: display=cart=checkout=catalog `holiday-ae-full-epub` all $9.99; the earlier $8.49 was a config sale-price artifact). Aligns with sheet "Digital Editions — Starting at $9.99".
- **Stale wording removed:** all "Ships Easter / Resurrection Sunday" replaced with "Ships in 5–10 Business Days".
  - NOTE: App.js "Bonus & Seasonal Content → Easter: Victory Through Blood" KEPT — legitimate seasonal LESSON title, not stale campaign copy.

## DEFERRED (approved by user, next batch — copy/config only, no redesign)
- **C. Curriculum naming:** relabel customer-facing "Holiday" → "4 C's of Christianity" and "Break*fast" → "Foundation in Christ" (flat workbooks list, bundle names, IE package labels, homepage copy). Internal SKUs/keys unchanged. MANY strings — do carefully as a dedicated pass.
- **E. Foundation in Christ PRINT ($29.99) in the PRIMARY flow:** currently only in the flat `workbooks` list; add physical format + $29.99 to the main Foundation card (verify catalog + delivery).

## OPEN / needs verification (report-only so far)
- **Bulk-sheet discount tiers (5%/10%/15%)** for Church Starter / Ministry / 50+ Custom — verify they're actually applied on-site for BUNDLE-CHURCH-STARTER ($49.99) / BUNDLE-MINISTRY ($89.99) and that bundle CONTENTS match the sheet.
- **IE included-benefits completeness:** user suspects the Instructor Edition workbook offering isn't showing its full intended inclusions — needs a benefits-list audit.
- **eBook/Digital price matrix uniformity:** config has varying epub prices per curriculum (Foundation epub $13.49, etc.) — confirm intended vs a uniform digital price.
- **SKU attachments:** Family/Church/Ministry bundle "no file" = FALSE ALARM (bundles expand to components). `IHI-AE-PRO` base "no file" = FALSE ALARM (delivers via ihi-ae-pro-ipdf/epub). Only `bkft-sp-ae-m1` snack pack had no attachment — confirm delivery path.
- **GamingCentral guest tier grid:** the priced tier chips ($29.99/$75.00) don't render for guests (entitlements branch takes precedence); ladder WORDING is correct on the visible card and prices live in the store — low priority.

## Pastor sheet is a distributed IMAGE — cannot be edited in code
Where the sheet conflicts with the site (e.g. "Digital ePub" vs "eBook", "Starting at $9.99"), the sheet art must be updated by the owner; site is now the accurate source.
