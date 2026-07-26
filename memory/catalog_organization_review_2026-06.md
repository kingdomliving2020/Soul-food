# Catalog Organization & Marketing-Clarity Review (June 2026)

**Scope:** CLARITY REVIEW ONLY (no redesign, no catalog expansion). Identifies duplication,
overlap, and confusing format presentation on `/quick-order` and the homepage.

## Current storefront structure (as-is)
Quick Order is organized loosely by **section/format**, not by curriculum:
- **Featured** — Holiday Table Bundle, Full Table Experience, "4 C's Adult eBook" (single eBook tile)
- **Instant Access** — flat digital SKUs (holiday-ae-digital, breakfast-ae-digital, …)
- **Main product grid** — per-curriculum cards WITH edition + format dropdowns (this is the good, consolidated pattern)
- **Gaming Passes / Game Store** — access + offline games
- **Pre-Order** — Lunch
- **Merch / Medallions**

## Duplication & confusion found
1. **Same curriculum surfaced 3+ ways.** "4 C's of Christianity" appears as: (a) a Featured eBook tile, (b) an Instant Access digital SKU, (c) a full product card with all formats, (d) inside the Holiday Table Bundle / Full Table Experience. A shopper sees the same curriculum repeatedly at different prices/labels → looks like different products.
2. **Format looks product-specific.** Highlighting ONE eBook (Holiday AE) in Featured implies "eBook" is a Holiday-only thing, when eBook is a **format available across curricula** (4 C's, Foundation, IHI/AE-Pro). This is the exact concern the user raised.
3. **Instant Access ≈ duplicate of the product grid.** The flat Instant Access digital SKUs overlap the digital format already selectable in the main product cards.
4. **Mixed terminology (pre-cleanup).** interactive / i-PDF / iPDF / ePub / "Digital" all appear — being addressed by the Terminology pass (Workbook · Digital Workbook · eLesson · eBook).

## Recommended model (launch-safe — labels/grouping copy only, NOT a rebuild)
Adopt **Curriculum → Format → Extras** as the mental model, expressed through labels and section order (no structural rebuild):
- Lead each curriculum with ONE card: **4 C's of Christianity**, **Foundation in Christ**, then **In His Image / AE-Pro**.
- Under each: the 4 formats as options — **Workbook (Print/POD) · Digital Workbook · eLesson · eBook** (already how the main product cards work).
- Present **Extras** separately and clearly labelled: **Snack Packs · Nibbles · Games (Offline / Online) · Access Passes · Medallions/Merch**.
- **Reduce Featured/Instant-Access duplication:** either (a) make Featured promote *bundles/collections* only (not a single-format single-curriculum tile), or (b) relabel the eBook tile as an example of a *format available across curricula* ("eBooks — available for every curriculum") linking into the curriculum cards. (Chosen quick fix this pass: the single Holiday eBook tile was corrected for price/name consistency; broader Featured/Instant-Access de-duplication is a copy task in the Clarity pass.)

## Distinct classifications to preserve (per user)
- **Offline Fellowship Games:** GRinCH Bingo · Passport Trek · Kingdom Tic Tac Toe
- **Online Games:** Trivia Mix-Up · Tricky Testaments
- **Access Entitlements (NOT games, NOT curriculum):** Day Pass ($29.99) · 90-Day Game Pass
  - Backend now enforces this: game-pass → workbook file mappings REMOVED (2026-06); passes only grant timed access via `_grant_game_pass_for_items`.

## Status
- Correctness fixes done this pass: eBook tile price/name consistency; game-pass file mappings removed.
- Terminology + Featured/Instant-Access de-duplication = next (Clarity) pass — copy/labels only, no redesign.
