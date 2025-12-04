# Soul Food Stripe Integration Guide

## 🎯 Current Status

**What's Ready:**
- ✅ Product catalog with all pricing
- ✅ Shopping cart with full fulfillment details
- ✅ Backend payment routes configured
- ✅ Stripe SDK already installed (`emergentintegrations`)

**What's Needed from Stripe:**
- [ ] Stripe Account fully verified
- [ ] Website URL added to Stripe dashboard
- [ ] API keys (Test & Live)

---

## 📋 Step-by-Step Stripe Setup

### Step 1: Complete Stripe Account Setup

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Complete business verification:
   - Business name: **Kingdom Living Project**  
   - Business type: Religious/Educational
   - Tax ID (EIN or SSN)
   - Bank account for payouts

3. Add your website:
   - Settings → Account → Business settings
   - Add domain: `your-soul-food-domain.com`

### Step 2: Get Your API Keys

**For Testing (Use these first):**
1. Dashboard → Developers → API keys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)

**Add to `/app/backend/.env`:**
```
STRIPE_API_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### Step 3: Create Products in Stripe Dashboard

You can either:

**Option A: Manual Creation (Recommended for first time)**
1. Dashboard → Products → Add product
2. Create each product:

```
Product 1: Nibble (Single Lesson)
- Price: $1.99 one-time
- Description: Single lesson PDF download

Product 2: Snack Pack (4 Lessons) - PDF
- Price: $5.99 one-time
- Description: 4 lessons PDF download

Product 3: Snack Pack (4 Lessons) - Paperback
- Price: $7.99 one-time
- Description: 4 lessons printed book

Product 4: Mealtime Bundle (12 Lessons) - PDF
- Price: $12.99 one-time
- Description: Complete series (12 lessons) PDF

Product 5: Mealtime Bundle (12 Lessons) - Paperback
- Price: $14.99 one-time
- Description: Complete series (12 lessons) printed

Product 6: Combo Bundle (24 Lessons)
- Price: $22.99 one-time

Product 7: Instructor Set (36 Lessons)
- Price: $39.99 one-time

Product 8: Gaming Day Pass
- Price: $29.99 one-time
- Duration: 24 hours access
```

**Option B: API Creation (Automated)**
- Backend can auto-create products using Stripe API
- I can add this script if you prefer

### Step 4: Configure Webhooks (For Order Notifications)

1. Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

4. Copy **Webhook signing secret** (starts with `whsec_`)

**Add to `/app/backend/.env`:**
```
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

---

## 💳 Checkout Flow

**Current Implementation:**

1. Customer adds items to cart with full details:
   - Series (Breakfast, Lunch, etc.)
   - Edition (Adult, Youth, Instructor)
   - Format (PDF, Paperback, Online)
   - Quantity

2. Clicks "Proceed to Checkout"

3. Backend creates Stripe Checkout Session with:
   - Line items (all products + metadata)
   - Customer email
   - Success URL
   - Cancel URL

4. Customer redirected to Stripe hosted checkout page

5. After payment:
   - **Success** → Redirect to `/payment-success`
   - **Cancel** → Redirect to `/payment-cancel`

6. Webhook receives confirmation → Database updated

---

## 📧 Email Receipts Configuration

### Current Setup:
- Email endpoint: `/api/contact/message`
- Target email: `kingdomlivingproject2020@gmail.com`

### To Enable Email Receipts:

**Option 1: Stripe Native Receipts (Easiest)**
1. Dashboard → Settings → Emails
2. Enable "Successful payments"
3. Customize email template with your branding
4. Stripe automatically sends to customer + BCC to you

**Option 2: Custom Email Integration (Full Control)**

**Use SendGrid (Recommended):**
```bash
pip install sendgrid
```

**Add to `/app/backend/.env`:**
```
SENDGRID_API_KEY=your_sendgrid_api_key
RECEIPT_EMAIL=kingdomlivingproject2020@gmail.com
```

**Add email function:**
```python
# In payment_routes.py after successful payment

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_order_receipt(order_details):
    message = Mail(
        from_email='orders@soulfood.com',
        to_emails=[order_details['customer_email'], 'kingdomlivingproject2020@gmail.com'],
        subject=f'Order Confirmation - #{order_details["order_id"]}',
        html_content=f'''
        <h2>Thank you for your order!</h2>
        <p>Order Details:</p>
        <ul>
          <li>Series: {order_details["series"]}</li>
          <li>Edition: {order_details["edition"]}</li>
          <li>Format: {order_details["medium"]}</li>
          <li>Quantity: {order_details["quantity"]}</li>
          <li>Total: ${order_details["total"]}</li>
        </ul>
        <p>Download link (for digital): {order_details["download_url"]}</p>
        '''
    )
    
    sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    response = sg.send(message)
    return response
```

---

## 🔐 Fulfillment Logic

### For PDF Downloads (Digital):
```python
# After payment confirmed
if order['medium'] == 'pdf':
    # Generate secure download link
    download_token = generate_secure_token(order_id, user_email)
    download_url = f"https://yourdomain.com/download/{download_token}"
    
    # Store in database
    db.licenses.insert_one({
        "order_id": order_id,
        "user_email": user_email,
        "product": order['product_name'],
        "series": order['series'],
        "edition": order['edition'],
        "download_token": download_token,
        "downloads_remaining": 3,  # Allow 3 downloads
        "expires_at": datetime.now() + timedelta(days=30),
        "license_type": "personal_use_only"
    })
    
    # Send email with download link
    send_download_email(user_email, download_url)
```

### For Paperback (Physical):
```python
# After payment confirmed
if order['medium'] == 'paperback':
    # Send fulfillment email to you
    send_print_order_notification(
        to='kingdomlivingproject2020@gmail.com',
        order_details={
            "customer_name": order['customer_name'],
            "customer_address": order['shipping_address'],
            "product": f"{order['series']} {order['edition']} Edition",
            "quantity": order['quantity'],
            "format": "Paperback"
        }
    )
    
    # Update order status
    db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": "pending_fulfillment"}}
    )
```

### For Online Access (Subscribers):
```python
# After subscription payment
if order['medium'] == 'online':
    # Grant access in database
    db.users.update_one(
        {"email": user_email},
        {"$set": {
            "subscription_tier": order['edition'],
            "subscription_start": datetime.now(),
            "subscription_end": datetime.now() + timedelta(days=30),
            "status": "active"
        }}
    )
```

---

## 🛡️ License Protection for PDFs

### Watermarking:
```python
from PyPDF2 import PdfWriter, PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

def watermark_pdf(original_pdf, user_email, order_id):
    # Create watermark
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    can.setFont("Helvetica", 8)
    can.setFillColorRGB(0.7, 0.7, 0.7)
    can.drawString(10, 10, f"Licensed to: {user_email} | Order: {order_id} | Personal Use Only")
    can.save()
    
    # Merge watermark with PDF
    packet.seek(0)
    watermark = PdfReader(packet)
    original = PdfReader(original_pdf)
    output = PdfWriter()
    
    for page_num in range(len(original.pages)):
        page = original.pages[page_num]
        page.merge_page(watermark.pages[0])
        output.add_page(page)
    
    return output
```

### Download Tracking:
```python
@router.get("/download/{token}")
async def download_content(token: str):
    # Verify token
    license = await db.licenses.find_one({"download_token": token})
    
    if not license:
        raise HTTPException(404, "Invalid download link")
    
    if license['downloads_remaining'] <= 0:
        raise HTTPException(403, "Download limit exceeded")
    
    # Decrement downloads
    await db.licenses.update_one(
        {"download_token": token},
        {"$inc": {"downloads_remaining": -1}}
    )
    
    # Log download
    await db.download_logs.insert_one({
        "token": token,
        "user_email": license['user_email'],
        "downloaded_at": datetime.now(),
        "ip_address": request.client.host
    })
    
    # Serve file
    return FileResponse(
        path=f"/content/{license['series']}/{license['edition']}.pdf",
        filename=f"{license['product']}.pdf"
    )
```

---

## ✅ Testing Checklist

**Before Going Live:**

1. **Test Mode Checkout:**
   - [ ] Add product to cart
   - [ ] Verify all details show correctly
   - [ ] Complete test checkout with card: `4242 4242 4242 4242`
   - [ ] Verify email receipt received
   - [ ] For PDF: Verify download link works
   - [ ] For Print: Verify you receive fulfillment email

2. **Webhook Testing:**
   - [ ] Use Stripe CLI to test webhook locally
   - [ ] Verify database updates after payment
   - [ ] Check order status changes correctly

3. **Email Testing:**
   - [ ] Test customer receipt
   - [ ] Test your fulfillment notification
   - [ ] Verify download links in emails work

4. **License Protection:**
   - [ ] Test download limits work
   - [ ] Test watermarking (if implemented)
   - [ ] Test token expiration

**Switch to Live Mode:**
1. Get live API keys (starts with `pk_live_` and `sk_live_`)
2. Update `.env` with live keys
3. Test one real transaction ($1.99 Nibble)
4. Monitor first few orders closely

---

## 📊 Order Management Dashboard (Future)

You'll want to build an admin panel to:
- View all orders
- Track fulfillment status
- Generate shipping labels
- Monitor download usage
- Handle refunds/cancellations

**I can build this for you once Stripe is connected!**

---

## 🚀 Next Steps

**Priority Order:**
1. ✅ Complete Stripe account verification
2. ✅ Add test API keys to `.env`
3. ✅ Test checkout with test card
4. ✅ Set up email notifications (Stripe native or SendGrid)
5. ✅ Test full flow: Cart → Checkout → Receipt → Download
6. ⏳ Switch to live mode
7. ⏳ Build admin dashboard

**Ready to proceed, Dee! Let me know when you have your Stripe keys and I'll help integrate them!** 🎉
