# Soul Food — Admin Content & Access Management Guide

## Quick Reference

| Task | How To |
|------|--------|
| Grant someone digital access | Admin Panel → Grant Access (or API below) |
| Fix missing downloads for an order | Admin Panel → Retry Fulfillment |
| Resend download email | Admin Panel → Resend Email |
| Add new product-file mapping | Admin Panel → Add Mapping (no redeploy!) |
| See all available PDF files | Admin Panel → List Files |
| View/manage orders | Admin Panel → Orders |

---

## 1. Granting Digital Access (Manual File Drop)

When you need to give someone access to content — whether it's a courtesy copy, 
a replacement, or a comp — you don't need to process a payment.

**API Endpoint:** `POST /api/admin/fulfillment/grant-access`

**Example (via curl):**
```bash
curl -X POST https://kingdom-soul.com/api/admin/fulfillment/grant-access \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@email.com",
    "product_ids": ["holiday_ae", "breakfast_ae_digital"],
    "reason": "Complimentary access - contributor"
  }'
```

**What happens:**
- Creates download links for each product
- Adds entries to their My Library
- No payment required
- Logged in admin audit trail

**Common product IDs for granting:**
| Product | ID to use |
|---------|-----------|
| Holiday Adult ePub | `holiday_ae` |
| Holiday Youth ePub | `holiday_ye` |
| Holiday Instructor ePub | `holiday_ie` |
| Breakfast Adult Digital | `breakfast_ae_digital` |
| Breakfast Youth Digital | `breakfast_ye_digital` |
| Breakfast AE Snack Pack M1 | `breakfast-ae-month1-snackpack` |
| Breakfast AE Snack Pack M2 | `breakfast-ae-month2-snackpack` |
| Breakfast AE Snack Pack M3 | `breakfast-ae-month3-snackpack` |

To see ALL available product IDs: `GET /api/admin/fulfillment/mappings`

---

## 2. Fixing Failed Downloads (Retry Fulfillment)

If a customer paid but their downloads are showing "Processing..." in My Library:

**API Endpoint:** `POST /api/admin/fulfillment/retry/{order_number}`

```bash
curl -X POST https://kingdom-soul.com/api/admin/fulfillment/retry/SF-2026-XXXXX \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**What happens:**
- Re-scans the order items
- Checks MongoDB mappings first, then hardcoded fallback
- Creates any missing download links
- Skips items that already have links
- Reports what was created/skipped/failed

---

## 3. Resending Order Emails

**API Endpoint:** `POST /api/admin/orders/{order_number}/send-email`

```bash
curl -X POST https://kingdom-soul.com/api/admin/orders/SF-2026-XXXXX/send-email \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 4. Adding New Product-File Mappings (No Redeploy!)

When you add new content files to the server, map them to product IDs via the admin API:

**Step 1: Upload the PDF** to `/app/content/downloads/` on the server

**Step 2: See what files are available:**
```bash
curl https://kingdom-soul.com/api/admin/fulfillment/files \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Step 3: Create the mapping:**
```bash
curl -X POST https://kingdom-soul.com/api/admin/fulfillment/mappings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "lunch-ae-digital",
    "filename": "lunch-ae-full.pdf"
  }'
```

Now when someone buys "lunch-ae-digital", they'll automatically get that PDF. **No code change. No redeploy.**

---

## 5. Viewing Orders

**List all orders:**
```bash
curl "https://kingdom-soul.com/api/admin/orders?status=paid&page=1" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Filter by email:**
```bash
curl "https://kingdom-soul.com/api/admin/orders?email=customer@email.com" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 6. Understanding Roles (RBAC)

| Role | Level | What They Can Do |
|------|-------|-----------------|
| **admin** | 100 | Everything — orders, users, content, fulfillment, settings |
| **instructor** | 50 | View lessons, answer keys, facilitation notes, manage own roster |
| **student** | 10 | View purchased content, take quizzes, My Library |
| **guest** | 0 | Browse store, purchase (no account needed), view free content |

**Your account (overflowharvest@gmail.com) = admin**

### How roles affect the experience:
- **Guest checkout**: Anyone can buy without an account. They get email with download links.
- **Registered user**: Can see My Library, Rewards, order history. Digital content appears automatically.
- **Instructor**: Gets access to answer keys and facilitation notes (when available).
- **Admin**: Full admin panel access at `/api/admin/*`

---

## 7. How Digital Fulfillment Works (The Flow)

```
Customer clicks "Add to Cart" → Cart stores product_id
    ↓
Checkout → Stripe processes payment
    ↓
Stripe webhook fires → Our server receives confirmation
    ↓
For each item in the order:
  1. Look up product_id in MongoDB product_file_mappings
  2. If not found → fall back to hardcoded PRODUCT_FILES
  3. If PDF found → create secure download link (token-based, expires in 30 days)
  4. Store download link in database
    ↓
Send confirmation email with download links
    ↓
Customer sees "Download PDF" button in:
  - PaymentSuccess page (immediately after purchase)
  - My Library (if they have an account)
  - Their email
```

**If something goes wrong** at any step, you can:
- **Retry fulfillment**: `POST /api/admin/fulfillment/retry/ORDER_NUMBER`
- **Manually grant access**: `POST /api/admin/fulfillment/grant-access`
- **Resend email**: `POST /api/admin/orders/ORDER_NUMBER/send-email`

---

## 8. Reward Points System

- **Earn rate**: 1 point per $10 spent
- **First purchase bonus**: 10 extra points
- **Redemption**: 50 pts = $2.50, 100 pts = $5.00, 200 pts = $12.00

Points are calculated dynamically from purchase history — no manual management needed.

---

## Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| Customer says "no download" | Retry fulfillment for their order |
| Wrong file delivered | Add correct mapping in admin, then retry |
| Customer lost their email | Resend order email |
| Need to give someone free access | Use grant-access endpoint |
| New product/PDF needs mapping | Add mapping via admin API |
| Reward points wrong | Points auto-calculate from orders |
