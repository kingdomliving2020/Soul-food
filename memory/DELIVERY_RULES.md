# Soul Food — Delivery Rules (May 2026 Spec)

This document is the **canonical product → file delivery contract**. The fulfillment
code (`/app/backend/payment_routes.py:resolve_item_to_file_entries_async`) implements
exactly these rules. Anything not in this doc is undefined behavior — fix the code
or the doc, never the customer's expectations.

## Source of truth

**`db.files.attachments[]` is the only durable mapping** between product_id and the
file customers receive. The `PRODUCT_FILES` dict in `payment_routes.py` is now a
**legacy fallback** — every new SKU must be attached via Admin → File Manager and
left alone in PRODUCT_FILES.

When a customer pays for product X:
1. Resolver checks `db.files` for any non-deleted file with
   `attachments.target_type == "product"` and `attachments.target_id == X`.
2. If found → that file is delivered.
3. If not found → legacy `PRODUCT_FILES[X]` is consulted (with the existing
   deliverability gate).
4. If neither → order falls to `pending_verification` and admin must attach.

**No filename heuristics. No display-name regex. No pattern logic.**
The resolver only speaks in `product_id` strings.

## POD vs Digital

| Format detection            | Delivery                                       |
|-----------------------------|------------------------------------------------|
| `item.format == "physical"` | ZERO digital files. Ships physically.          |
| `item.format == "paperback"`| ZERO digital files. Ships physically.          |
| `item.format == "print"`    | ZERO digital files. Ships physically.          |
| `item.format == "pod"`      | ZERO digital files. Ships physically.          |
| `product_id` ends in `-paperback`, `-print`, `-physical`, `-pod`, `-hardcopy` | ZERO digital files. |
| Any other digital format    | Resolve via attachment → fallback to legacy.   |

> **Rule**: A POD purchase delivers a printed product via the shipping pipeline.
> The customer receives a packing slip / shipping confirmation, **not** a download
> link. Even if a matching attached file exists, the digital file is suppressed.

## Bundle expansion

Bundles (`BUNDLE_EXPANSIONS` in `payment_routes.py`) expand to per-edition sub-items.
For each sub-item:
- POD-suffixed sub-items are skipped (logged).
- Sub-items with a `db.files` attachment are included.
- Sub-items without an attachment fall back to legacy `PRODUCT_FILES`.

Bundles **never** merge files across editions. AE/YE/IE remain separate downloads
inside a bundle.

## Format-specific rules (May 2026 spec)

| Product type           | Delivery format                                         |
|------------------------|----------------------------------------------------------|
| Full workbook (POD)    | Print only. No digital file in email.                    |
| Full workbook (digital)| Single full-PDF download. (Existing entitlements honored.) |
| Snack Pack (SP)        | Digital PDF default. Print only if bundled with POD.     |
| Nibble (single lesson) | Segmented per-lesson PDF only. **Never** the full book.  |
| Game Pass / Subscription| No file. Entitlement only.                              |
| Gift Certificate       | Generates a code; no file.                              |

## Holiday Nibbles (4C framework)

Holiday is the SOFU **brand**; HOL (Covenant / Cradle / Cross / Comforter) is the
**framework**. Do not flatten or rename in product IDs or files.

Per-chapter Nibble SKUs (e.g. `holiday-nibble-ae-covenant-digital`):
- **Today**: legacy mapping points the chapter to the full Holiday PDF — that
  violates the no-substitution rule, so the legacy resolver gates these via
  `is_deliverable()` returning `gated_no_substitution_holiday_nibble`.
- **Required**: 12 per-chapter PDFs (AE/YE/IE × Covenant/Cradle/Cross/Comforter)
  uploaded to Object Storage and attached to the corresponding SKUs.
- Once attached, the new resolver will deliver them automatically with no code
  change.

## How to add a new file (admin workflow)

1. Admin → File Manager → Upload Files → drag/drop PDF.
2. Click **Attach to Product** on the file row.
3. Enter the `product_id` (e.g. `breakfast-snack-month-1-instructor-interactive`).
4. Done. Next paid order for that product_id will deliver the attached file.

No code deploy, no config change, no PRODUCT_FILES edit.

## Migration plan (legacy → attachment)

The legacy `PRODUCT_FILES` dict still resolves orders for SKUs that haven't been
attached yet. To complete the cutover:

1. Pull the legacy mapping: `grep "^    \"" /app/backend/payment_routes.py | head -300`
2. For each entry, upload the corresponding file (or attach an existing storage
   object) via File Manager.
3. Verify by hitting the test resolver:
   ```python
   from payment_routes import _has_product_attachment
   await _has_product_attachment("<product_id>")  # must return True
   ```
4. Once every SKU is attached, the `PRODUCT_FILES` dict can be deleted entirely.
