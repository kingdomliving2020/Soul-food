# Soul Food Pricing Update - Complete

## 🎯 Updated Pricing Structure

**Effective Date:** November 30, 2024

---

## 📊 Product Pricing Table

| Product | Cost | List Price | Sale Price | Unit |
|---------|------|------------|------------|------|
| **Nibble** (Single Lesson) | $1.09 | $4.99 | $1.99 | ea |
| **Snack Pack** (4 Lessons) | $3.99 | $6.75 | $5.99 | set |
| **Mealtime Bundle** (12 Lessons) | $11.99 | $13.99 | $12.99 | set |
| **Combo Bundle** (24 Lessons) | $19.99 | $24.99 | $22.99 | set |
| **Instructor Set** (36 Lessons) | $36.99 | $44.99 | $39.99 | set |
| **Gaming Day Pass** | $25.00 | $40.00 | $29.99 | set |

---

## 🏷️ Naming Changes

**OLD → NEW:**
- ❌ "Single Lesson" → ✅ **"Nibble"** (Single Lesson)
- ❌ "Monthly Pack" → ✅ **"Snack Pack"** (4 Lessons)

---

## 🎨 Customer Selection Flow

When customers purchase, they follow this selection process:

### **Step 1: Choose Mealtime Series**
- Breakfast (Foundation in Christ)
- Lunch (Kingdom Relationships) 
- Dinner (Finding Your Purpose)
- Supper (Maturity in the Faith)
- Holiday (4 C's of Christianity)

### **Step 2: Choose Edition**
- **Adult Edition** - For mature audiences
- **Youth Edition** - Ages 12-20
- **Instructor Edition** - Teaching toolkit included

### **Step 3: Choose Medium/Format**
- **eBook** - Digital download (PDF/ePub)
- **Paperback** - Physical printed book
- **Online** - Digital access via web platform

---

## 📦 Medium Availability Rules

### **By Product Type:**

**Nibble (Single Lesson):**
- ✅ eBook - Available
- ✅ Paperback - Available
- ❌ Online - Not available for single purchases

**Snack Pack (4 Lessons - Monthly):**
- ✅ eBook - Available
- ✅ Paperback - Available
- ✅ Online - **Monthly subscribers only**

**Mealtime Bundle (12 Lessons):**
- ✅ eBook - Available
- ✅ Paperback - Available
- ✅ Online - **Monthly subscribers only**

**Combo Bundle (24 Lessons):**
- ✅ eBook - Available
- ✅ Paperback - Available
- ❌ Online - Not available

**Instructor Set (36 Lessons):**
- ✅ eBook - Available
- ✅ Paperback - Available
- ❌ Online - Not available

**Gaming Day Pass:**
- ✅ Digital access only (no physical or download option)

---

## 💡 Key Business Logic

### **Online Access:**
- Only available for **monthly subscribers**
- Applies to: Snack Pack, Mealtime Bundle
- Requires active subscription to access

### **Print (Paperback) Availability:**
- Available for: Nibble, Snack Pack, Mealtime Bundle, Combo Bundle, Instructor Set
- Physical books require POD (Print on Demand) fulfillment

### **eBook Availability:**
- Available for all lesson-based products
- Instant download after purchase
- Multiple formats supported (PDF, ePub)

---

## 🔢 Profit Margins

| Product | Cost | Sale Price | Margin | Margin % |
|---------|------|------------|--------|----------|
| Nibble | $1.09 | $1.99 | $0.90 | 45% |
| Snack Pack | $3.99 | $5.99 | $2.00 | 33% |
| Mealtime Bundle | $11.99 | $12.99 | $1.00 | 8% |
| Combo Bundle | $19.99 | $22.99 | $3.00 | 13% |
| Instructor Set | $36.99 | $39.99 | $3.00 | 8% |
| Gaming Pass | $25.00 | $29.99 | $4.99 | 17% |

---

## 🛒 Shopping Cart Integration

### **Frontend Display:**
Products now show:
1. Product name with new branding (Nibble/Snack Pack)
2. Dropdown for Mealtime selection
3. Dropdown for Edition selection
4. Dropdown/Radio buttons for Medium selection
5. Price display (showing both list price and sale price)
6. "Add to Cart" button

### **Backend API Response:**
```json
{
  "name": "Nibble (Single Lesson)",
  "cost": 1.09,
  "list_price": 4.99,
  "sale_price": 1.99,
  "currency": "usd",
  "unit": "ea",
  "options": {
    "mealtime": ["breakfast", "lunch", "dinner", "supper", "holiday"],
    "edition": ["adult", "youth", "instructor"],
    "medium": ["ebook", "paperback"]
  }
}
```

---

## 📚 ISBN Assignment Guide

**Remember: Different ISBNs needed for:**
- Different **editions** (Adult vs Youth vs Instructor)
- Different **formats** (Paperback vs eBook)
- Different **series** (Breakfast vs Lunch, etc.)

**Example for Breakfast:**
- ISBN 979-8-9940733-0-8 = Holiday Adult Edition Paperback
- Need separate ISBNs for Holiday Youth, Holiday Instructor, etc.

---

## ✅ Implementation Status

**Backend:**
- ✅ Pricing updated in payment_routes.py
- ✅ New product names (Nibble, Snack Pack)
- ✅ Cost tracking added
- ✅ Selection options configured
- ✅ Medium availability rules defined
- ✅ API endpoint returning new structure

**Frontend:**
- ⏳ Cart buttons already in place
- ⏳ Need to add selection dropdowns (mealtime, edition, medium)
- ⏳ Need to implement medium availability logic
- ⏳ Need to update product display names

**Next Steps:**
1. Update frontend shopping UI with selection dropdowns
2. Add validation for medium availability (online = subscribers only)
3. Test cart flow with new pricing
4. Update checkout page to show customer selections
5. Configure Stripe products with new pricing

---

## 🎓 Example Purchase Flow

**Customer wants: Breakfast Adult Edition Paperback Bundle**

1. Clicks "Add to Cart" on Mealtime Bundle card
2. Modal/Dropdown appears:
   - Select Mealtime: **Breakfast** ✓
   - Select Edition: **Adult** ✓
   - Select Medium: **Paperback** ✓
3. Price shown: ~~$13.99~~ **$12.99**
4. Adds to cart
5. Checkout processes: Mealtime Bundle (12 Lessons) - Breakfast Adult Paperback - $12.99

---

**All pricing updated and active!** 🎉
