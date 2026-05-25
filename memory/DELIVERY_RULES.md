# Soul Food — Delivery Rules (May 2026 Spec)

## Product positioning (PRIORITY 0)

**We are not selling files or formats — we are selling outcomes and usage value.**

Customers are buying:
- Lessons, guided experiences, structured learning
- Convenience and accessibility
- Targeted access to content

Customers are **not** buying PDFs, IPDFs, file fragments, or storage units.

### Implementation implications

1. **Nibbles / SP / Bundles** feel like *targeted access*, not file fragments.
2. **Full workbook delivery** is just one form of access — not the product itself.
3. **Product structure** must prioritize:
   - Ease of use
   - Clarity at purchase (cart copy, receipt language, library labels)
   - Correct content delivery
   - NOT file-level complexity (IPDF vs PDF vs naming convention)
4. **Fulfillment logic serves experience first**, storage structure second.

> When in doubt: ask "what does the customer expect to receive, how quickly and
> clearly do they get it, and how is the product understood in the cart + library?"
> Optimize for that. Do not optimize file mechanics.

---

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

## Format-specific rules (May 2026 clarification)

| Product type            | Delivery format                                          |
|-------------------------|----------------------------------------------------------|
| Full workbook — POD     | Print only. No digital file in email.                    |
| Full workbook — Digital | Single full-PDF download. ✓ ALLOWED                      |
| Snack Pack (SP) — Digital | Per-month PDF.                                         |
| Snack Pack — Print bundle | Included with POD; no separate digital file.           |
| Nibble (single lesson)  | Falls back to the full workbook PDF for MVP. Per-lesson IPDF splitting is **not required** at this stage. |
| Game Pass / Subscription | No file. Entitlement only.                              |
| Gift Certificate        | Generates a code; no file.                              |

**IPDF / per-lesson splitting is deferred** — at MVP, digital Nibble SKUs deliver
the full workbook PDF. The framework remains in place (per-lesson product_ids,
attachment slots) for later activation without code change.

## Holiday Nibbles (4C framework)

Holiday is the SOFU **brand**; HOL (Covenant / Cradle / Cross / Comforter) is the
**framework**. Do not flatten or rename in product IDs or files.

Per-chapter Nibble SKUs (e.g. `holiday-nibble-ae-covenant-digital`):
- **Current MVP behavior**: legacy mapping points each chapter to the full
  Holiday PDF, and `is_deliverable()` allows it. Customer receives the full
  Holiday workbook regardless of which chapter they bought.
- **Future (post-MVP)**: when you upload 12 per-chapter PDFs (AE/YE/IE ×
  Covenant/Cradle/Cross/Comforter) and attach them in File Manager, the resolver
  will pick those up automatically (attachment beats legacy PRODUCT_FILES).
  No code deploy required.

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
