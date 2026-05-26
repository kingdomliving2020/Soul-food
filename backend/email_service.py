"""
Soul Food Email Service
=======================
Transactional email handling using Resend API.

Email Configuration (kingdom-soul.com):
- From: noreply@kingdom-soul.com
- Reply-To: support@kingdom-soul.com
- Footer: "This inbox isn't monitored. For help, contact support@kingdom-soul.com"
"""

import os
import asyncio
import logging
import resend
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Email Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@kingdom-soul.com')
SUPPORT_EMAIL = os.environ.get('SUPPORT_EMAIL', 'support@kingdom-soul.com')
SITE_URL = os.environ.get('SITE_URL', os.environ.get('FRONTEND_URL', 'https://kingdom-soul.com'))

def get_site_url(request_origin: str = None) -> str:
    """Get the correct site URL, preferring request origin for production correctness"""
    if request_origin:
        if 'kingdom-soul.com' in request_origin:
            return 'https://kingdom-soul.com'
        if request_origin.startswith('http'):
            return request_origin.rstrip('/')
    return SITE_URL

# Initialize Resend
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
else:
    logger.warning("RESEND_API_KEY not configured - emails will not be sent")


# =============================================================================
# EMAIL FOOTER (Required for all transactional emails)
# =============================================================================

EMAIL_FOOTER = f"""
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
    <p style="margin: 0 0 8px 0; padding: 10px; background-color: #fef3c7; border-radius: 6px; color: #92400e;">
        📥 <strong>Didn't see this email in your inbox?</strong> Please check your spam or junk folder!
    </p>
    <p style="margin: 0 0 8px 0;">This inbox isn't monitored. For help, contact <a href="mailto:{SUPPORT_EMAIL}" style="color: #6366f1;">{SUPPORT_EMAIL}</a></p>
    <p style="margin: 0;">© {datetime.now().year} Soul Food - Kingdom Living Project</p>
</div>
"""


# =============================================================================
# BASE EMAIL TEMPLATE
# =============================================================================

def get_base_template(content: str, preheader: str = "") -> str:
    """Wrap content in base email template with inline styles"""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soul Food</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <!-- Preheader text (hidden but shows in email preview) -->
    <div style="display: none; max-height: 0; overflow: hidden;">{preheader}</div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Soul Food</h1>
                            <p style="margin: 5px 0 0 0; color: #e0e7ff; font-size: 14px;">Kingdom Living Project</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            {content}
                            {EMAIL_FOOTER}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


# =============================================================================
# EMAIL TEMPLATES
# =============================================================================

def get_order_confirmation_template(
    order_id: str,
    items: List[Dict],
    total: float,
    is_free_order: bool = False,
    coupon_code: str = None,
    download_links: List[Dict] = None,
    customer_name: str = "Valued Customer",
    audio_codes: List[Dict] = None
) -> str:
    """Generate order confirmation email HTML"""

    # Build items list (with bundle expansion + expected-delivery hints)
    try:
        from payment_routes import expand_items_for_receipt
        expanded = expand_items_for_receipt(items)
    except Exception:
        expanded = []

    items_html = ""
    for idx, item in enumerate(items):
        price = item.get('price', 0) or item.get('salePrice', 0)
        qty = item.get('quantity', 1)
        # Sub-deliverables for this row (bundle expansion or single)
        sub_html = ""
        row = expanded[idx] if idx < len(expanded) else None
        if row and (row.get("is_bundle") or len(row.get("deliverables", [])) > 1):
            sub_html = '<ul style="margin: 8px 0 0 18px; padding: 0; color: #4b5563; font-size: 13px;">'
            for d in row.get("deliverables", []):
                pending_tag = (
                    f' <span style="color:#b45309;font-weight:600;">— Pending ({d.get("expected_by","")})</span>'
                    if d.get("status") == "pending" else ""
                )
                sub_html += f'<li>{d.get("label","")}{pending_tag}</li>'
            sub_html += '</ul>'
        elif row and row.get("deliverables") and row["deliverables"][0].get("status") == "pending":
            d = row["deliverables"][0]
            sub_html = (
                f'<div style="margin-top:6px;color:#b45309;font-size:13px;font-weight:600;">'
                f'Pending — {d.get("expected_by","")}</div>'
            )
        items_html += f"""
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #1f2937;">{item.get('name', 'Product')}</strong>
                <div style="color: #6b7280; font-size: 14px;">Qty: {qty}</div>
                {sub_html}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">
                ${price * qty:.2f}
            </td>
        </tr>
        """
    
    # Build download links section if available
    downloads_html = ""
    if download_links and len(download_links) > 0:
        downloads_html = """
        <div style="margin-top: 30px; padding: 20px; background-color: #ecfdf5; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px;">📥 Your Downloads Are Ready!</h3>
            <p style="margin: 0 0 15px 0; color: #047857; font-size: 14px;">Click the buttons below to download your files. Downloads are limited to 3 per file and expire in 72 hours.</p>
        """
        for link in download_links:
            token = link.get('token', '')
            product_name = link.get('product_name', 'Download')
            downloads_html += f"""
            <a href="{SITE_URL}/api/downloads/file/{token}" 
               style="display: inline-block; margin: 5px 5px 5px 0; padding: 10px 20px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                ⬇️ {product_name}
            </a>
            """
        downloads_html += "</div>"
    
    # Build audio codes section if available (for physical book purchases)
    audio_codes_html = ""
    if audio_codes and len(audio_codes) > 0:
        audio_codes_html = """
        <div style="margin-top: 30px; padding: 20px; background-color: #faf5ff; border-radius: 8px; border-left: 4px solid #8b5cf6;">
            <h3 style="margin: 0 0 15px 0; color: #6b21a8; font-size: 18px;">🎧 Bonus: Audio Access Included!</h3>
            <p style="margin: 0 0 15px 0; color: #7c3aed; font-size: 14px;">Your physical book purchase includes free audio teachings! Use the code(s) below to unlock your audio content:</p>
        """
        for code_info in audio_codes:
            code = code_info.get('code', '')
            series_name = code_info.get('series_name', 'Audio Series')
            audio_codes_html += f"""
            <div style="margin: 10px 0; padding: 15px; background-color: #ffffff; border: 2px dashed #8b5cf6; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">{series_name}</p>
                <p style="margin: 0; color: #1f2937; font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 2px;">{code}</p>
            </div>
            """
        audio_codes_html += f"""
            <p style="margin: 15px 0 0 0; color: #7c3aed; font-size: 14px;">
                <strong>How to redeem:</strong> Visit <a href="{SITE_URL}/multimedia" style="color: #6366f1; font-weight: 600;">our multimedia page</a> and enter your code to unlock your audio lessons!
            </p>
        </div>
        """
    
    # Coupon badge
    coupon_html = ""
    if coupon_code:
        coupon_html = f"""
        <div style="margin-bottom: 20px; padding: 10px 15px; background-color: #fef3c7; border-radius: 6px; display: inline-block;">
            <span style="color: #92400e; font-weight: 600;">🎉 Coupon Applied: {coupon_code}</span>
        </div>
        """
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
        {"🎁 Free Order Confirmed!" if is_free_order else "✅ Order Confirmed!"}
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Hi {customer_name},<br><br>
        Thank you for your order! {"Your promotional access has been activated." if is_free_order else "We're processing your order now."}
    </p>
    
    {coupon_html}
    
    <div style="margin: 25px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Order ID</p>
        <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 18px; font-weight: bold;">{order_id}</p>
    </div>
    
    <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px;">Order Summary</h3>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        {items_html}
        <tr>
            <td style="padding: 15px 0; font-weight: bold; color: #1f2937; font-size: 18px;">Total</td>
            <td style="padding: 15px 0; text-align: right; font-weight: bold; color: #6366f1; font-size: 18px;">
                {"$0.00 (FREE)" if is_free_order else f"${total:.2f}"}
            </td>
        </tr>
    </table>
    
    {downloads_html}
    
    {audio_codes_html}
    
    <div style="margin-top: 30px; padding: 24px; background-color: #ffffff; border-radius: 10px; border: 2px solid #4338ca; text-align: center;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px; font-weight: 700;">Save Your Purchase to Your Account</h3>
        <p style="margin: 0 0 6px 0; color: #374151; font-size: 14px;">Create a free account and redeem your order to access content anytime from <strong>My Library</strong>.</p>
        <p style="margin: 0 0 18px 0; color: #4b5563; font-size: 13px;">Your order number: <strong style="font-family: monospace; font-size: 15px; color: #111827;">{order_id}</strong></p>
        <a href="{SITE_URL}/redeem?code={order_id}"
           style="display: inline-block; padding: 16px 36px; background-color: #4338ca; background-image: linear-gradient(135deg, #4338ca 0%, #3730a3 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; letter-spacing: 0.3px; border: 2px solid #312e81; box-shadow: 0 2px 6px rgba(67,56,202,0.35);">
            Redeem Your Purchase &rarr;
        </a>
    </div>

    <div style="margin-top: 15px; text-align: center;">
        <a href="{SITE_URL}/order-success?order={order_id}" 
           style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Your Order
        </a>
    </div>
    """
    
    preheader = f"Order {order_id} confirmed! " + ("Your downloads are ready." if download_links else "Thank you for your purchase.")
    return get_base_template(content, preheader)


def get_download_delivery_template(
    order_id: str,
    download_links: List[Dict],
    customer_name: str = "Valued Customer"
) -> str:
    """Generate download link delivery email HTML"""
    
    downloads_html = ""
    for link in download_links:
        token = link.get('token', '')
        product_name = link.get('product_name', 'Download')
        expires_at = link.get('expires_at', '')
        downloads_html += f"""
        <div style="margin-bottom: 15px; padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #6366f1;">
            <strong style="color: #1f2937;">{product_name}</strong>
            <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">Expires: {expires_at[:10] if expires_at else '72 hours'}</p>
            <a href="{SITE_URL}/api/downloads/file/{token}" 
               style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                ⬇️ Download PDF
            </a>
        </div>
        """
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">📥 Your Downloads Are Ready!</h2>
    
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Hi {customer_name},<br><br>
        Your digital content is ready to download. Click the buttons below to get your files.
    </p>
    
    <div style="margin: 25px 0; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Important:</strong> Download links expire in 72 hours and are limited to 3 downloads per file.
        </p>
    </div>
    
    <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px;">Your Downloads</h3>
    
    {downloads_html}
    
    <div style="margin-top: 25px; padding: 15px; background-color: #faf5ff; border-radius: 8px; border: 1px dashed #8b5cf6; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #6b21a8; font-size: 14px; font-weight: 600;">Want permanent access? Save to your account!</p>
        <a href="{SITE_URL}/redeem?code={order_id}" 
           style="color: #7c3aed; font-weight: 600; text-decoration: underline; font-size: 14px;">
            Redeem order {order_id} &rarr;
        </a>
    </div>

    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
        Order ID: <strong>{order_id}</strong>
    </p>
    """
    
    return get_base_template(content, f"Your downloads for order {order_id} are ready!")


def get_contact_form_template(
    name: str,
    email: str,
    topic: str,
    message: str,
    page_url: str = None
) -> str:
    """Generate contact form submission email for support team"""
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">📬 New Contact Form Submission</h2>
    
    <div style="margin: 20px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">{name}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:{email}" style="color: #6366f1;">{email}</a></td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Topic:</td>
                <td style="padding: 8px 0; color: #1f2937;">{topic}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Submitted:</td>
                <td style="padding: 8px 0; color: #1f2937;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</td>
            </tr>
            {f'<tr><td style="padding: 8px 0; color: #6b7280;">Page URL:</td><td style="padding: 8px 0; color: #1f2937;">{page_url}</td></tr>' if page_url else ''}
        </table>
    </div>
    
    <h3 style="margin: 25px 0 15px 0; color: #1f2937; font-size: 18px;">Message</h3>
    <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">{message}</p>
    </div>
    
    <div style="margin-top: 25px;">
        <a href="mailto:{email}?subject=Re: {topic} - Soul Food Support" 
           style="display: inline-block; padding: 12px 25px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Reply to {name}
        </a>
    </div>
    """
    
    return get_base_template(content, f"New contact from {name}: {topic}")


def get_bulk_order_notification_template(
    quantity: int,
    product_name: str,
    customer_email: str,
    selections: Dict,
    bundle_type: str = None,
    total_price: float = None
) -> str:
    """Generate bulk order notification email for support team"""
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">📦 Large Bulk Order Alert!</h2>
    
    <div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ This order requires manual review and processing</p>
    </div>
    
    <div style="margin: 20px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Order Details</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 150px;">Quantity:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 18px;">{quantity} items</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Product:</td>
                <td style="padding: 8px 0; color: #1f2937;">{product_name}</td>
            </tr>
            {f'<tr><td style="padding: 8px 0; color: #6b7280;">Bundle Type:</td><td style="padding: 8px 0; color: #1f2937;">{bundle_type}</td></tr>' if bundle_type else ''}
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Customer Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:{customer_email}" style="color: #6366f1;">{customer_email}</a></td>
            </tr>
            {f'<tr><td style="padding: 8px 0; color: #6b7280;">Estimated Total:</td><td style="padding: 8px 0; color: #10b981; font-weight: 600;">${total_price:.2f}</td></tr>' if total_price else ''}
        </table>
    </div>
    
    <h3 style="margin: 25px 0 15px 0; color: #1f2937; font-size: 18px;">Selections</h3>
    <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Mealtime:</td>
                <td style="padding: 8px 0; color: #1f2937;">{selections.get('mealtime', 'N/A')}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Edition:</td>
                <td style="padding: 8px 0; color: #1f2937;">{selections.get('edition', 'N/A')}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Medium:</td>
                <td style="padding: 8px 0; color: #1f2937;">{selections.get('medium', 'N/A')}</td>
            </tr>
        </table>
    </div>
    
    <div style="margin-top: 25px;">
        <a href="mailto:{customer_email}?subject=Your Soul Food Bulk Order" 
           style="display: inline-block; padding: 12px 25px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Contact Customer
        </a>
    </div>
    
    <p style="margin: 25px 0 0 0; color: #6b7280; font-size: 14px;">
        Submitted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
    </p>
    """
    
    return get_base_template(content, f"🚨 Bulk Order: {quantity} items from {customer_email}")


def get_preorder_confirmation_template(
    order_id: str,
    items: List[Dict],
    total: float,
    delivery_month: str,
    courtesy_links: List[Dict] = None,
    customer_name: str = "Valued Customer",
    coupon_code: str = None
) -> str:
    """Generate preorder confirmation email with courtesy digital access"""
    
    items_html = ""
    for item in items:
        price = item.get('price', 0) or item.get('salePrice', 0)
        qty = item.get('quantity', 1)
        items_html += f"""
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #1f2937;">{item.get('name', 'Product')}</strong>
                <div style="color: #6b7280; font-size: 14px;">Qty: {qty}</div>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">
                ${price * qty:.2f}
            </td>
        </tr>
        """
    
    courtesy_html = ""
    if courtesy_links and len(courtesy_links) > 0:
        courtesy_html = """
        <div style="margin-top: 25px; padding: 20px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 18px;">🎁 Your Complimentary Digital Access</h3>
            <p style="margin: 0 0 15px 0; color: #1d4ed8; font-size: 14px;">While your physical book is being prepared, enjoy 2 months of complimentary digital access:</p>
        """
        for link in courtesy_links:
            token = link.get('token', '')
            product_name = link.get('product_name', 'Content')
            courtesy_html += f"""
            <a href="{SITE_URL}/api/downloads/file/{token}" 
               style="display: inline-block; margin: 5px 5px 5px 0; padding: 10px 20px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                📖 {product_name}
            </a>
            """
        courtesy_html += "</div>"
    
    coupon_html = ""
    if coupon_code:
        coupon_html = f'<div style="margin-bottom: 20px; padding: 10px 15px; background-color: #fef3c7; border-radius: 6px; display: inline-block;"><span style="color: #92400e; font-weight: 600;">🎉 Coupon Applied: {coupon_code}</span></div>'
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">📦 Pre-Order Confirmed!</h2>
    
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Hi {customer_name},<br><br>
        Thank you for your pre-order! Your purchase has been confirmed.
    </p>
    
    {coupon_html}
    
    <div style="margin: 20px 0; padding: 20px; background-color: #fefce8; border-radius: 8px; border: 1px solid #fde68a;">
        <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;">📅 Estimated Delivery: {delivery_month}</h3>
        <p style="margin: 0; color: #a16207; font-size: 14px;">
            While your physical book is being prepared, you will receive 2 months of complimentary digital access.
        </p>
    </div>
    
    {courtesy_html}
    
    <div style="margin: 25px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Order ID</p>
        <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 18px; font-weight: bold;">{order_id}</p>
    </div>
    
    <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px;">Order Summary</h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        {items_html}
        <tr>
            <td style="padding: 15px 0; font-weight: bold; color: #1f2937; font-size: 18px;">Total</td>
            <td style="padding: 15px 0; text-align: right; font-weight: bold; color: #6366f1; font-size: 18px;">${total:.2f}</td>
        </tr>
    </table>
    
    <div style="margin-top: 30px; padding: 20px; background-color: #faf5ff; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #6b21a8; font-weight: bold; font-size: 16px;">Start now. Grow with us. Full releases coming soon.</p>
        <a href="{SITE_URL}/my-library" 
           style="display: inline-block; margin-top: 8px; padding: 14px 30px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Go to My Library
        </a>
    </div>
    """
    
    return get_base_template(content, f"Pre-order confirmed! #{order_id} — Estimated delivery: {delivery_month}")


def get_game_pass_template(
    order_id: str,
    pass_type: str,
    customer_name: str = "Valued Customer"
) -> str:
    """Generate game pass access delivery email"""
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">🎮 Game On! Your Pass Is Ready</h2>
    
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Hi {customer_name},<br><br>
        Your {pass_type} Game Pass has been activated! Here's how to get started:
    </p>
    
    <div style="margin: 25px 0; padding: 25px; background: linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%); border-radius: 12px; text-align: center; border: 2px solid #c4b5fd;">
        <p style="margin: 0 0 15px 0; color: #7c3aed; font-size: 20px; font-weight: bold;">Your Game Pass</p>
        <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">{pass_type} Access — Holiday + Break*fast Content</p>
        <a href="{SITE_URL}/my-library" 
           style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            🎮 Start Playing
        </a>
    </div>
    
    <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px;">How to Play</h3>
    <ol style="color: #4b5563; line-height: 2; font-size: 15px;">
        <li>Click "Start Playing" above or visit your My Library</li>
        <li>Select a game mode (Jeopardy-style, Group Review, etc.)</li>
        <li>Choose your content (Holiday or Break*fast lessons)</li>
        <li>Play solo or with your study group!</li>
    </ol>
    
    <div style="margin-top: 25px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">
            <strong>Note:</strong> Game content includes Holiday series and Art of Through. 
            Session limits apply per your pass type.
        </p>
    </div>
    
    <div style="margin: 25px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Order ID: <strong>{order_id}</strong></p>
    </div>
    """
    
    return get_base_template(content, f"Your {pass_type} Game Pass is ready! Order #{order_id}")


# =============================================================================
# EMAIL SENDING FUNCTIONS
# =============================================================================

async def send_email(
    to: str,
    subject: str,
    html: str,
    reply_to: str = None
) -> Dict:
    """
    Send an email using Resend API.
    Non-blocking async implementation.
    """
    if not RESEND_API_KEY:
        logger.warning(f"Email not sent (no API key): {subject} -> {to}")
        return {"success": False, "error": "RESEND_API_KEY not configured"}
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to] if isinstance(to, str) else to,
        "subject": subject,
        "html": html,
        "reply_to": reply_to or SUPPORT_EMAIL
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully: {subject} -> {to}")
        return {"success": True, "email_id": result.get("id"), "to": to}
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_order_confirmation(
    to_email: str,
    order_id: str,
    items: List[Dict],
    total: float,
    is_free_order: bool = False,
    coupon_code: str = None,
    download_links: List[Dict] = None,
    customer_name: str = "Valued Customer",
    audio_codes: List[Dict] = None
) -> Dict:
    """Send order confirmation email with optional audio access codes"""
    subject = f"Order Confirmed! #{order_id}" if not is_free_order else f"🎁 Free Order Activated! #{order_id}"
    html = get_order_confirmation_template(
        order_id=order_id,
        items=items,
        total=total,
        is_free_order=is_free_order,
        coupon_code=coupon_code,
        download_links=download_links,
        customer_name=customer_name,
        audio_codes=audio_codes
    )
    return await send_email(to_email, subject, html)


async def send_download_links(
    to_email: str,
    order_id: str,
    download_links: List[Dict],
    customer_name: str = "Valued Customer"
) -> Dict:
    """Send download links email"""
    subject = f"📥 Your Downloads Are Ready - Order #{order_id}"
    html = get_download_delivery_template(
        order_id=order_id,
        download_links=download_links,
        customer_name=customer_name
    )
    return await send_email(to_email, subject, html)


async def send_contact_form_notification(
    name: str,
    email: str,
    topic: str,
    message: str,
    page_url: str = None
) -> Dict:
    """Send contact form submission to support"""
    subject = f"[Contact Form] {topic} - from {name}"
    html = get_contact_form_template(
        name=name,
        email=email,
        topic=topic,
        message=message,
        page_url=page_url
    )
    # Send to support email
    return await send_email(SUPPORT_EMAIL, subject, html, reply_to=email)


async def send_bulk_order_notification(
    quantity: int,
    product_name: str,
    customer_email: str,
    selections: Dict,
    bundle_type: str = None,
    total_price: float = None
) -> Dict:
    """Send bulk order notification to support"""
    subject = f"🚨 Large Bulk Order Alert: {quantity} items"
    html = get_bulk_order_notification_template(
        quantity=quantity,
        product_name=product_name,
        customer_email=customer_email,
        selections=selections,
        bundle_type=bundle_type,
        total_price=total_price
    )
    # Send to support email
    return await send_email(SUPPORT_EMAIL, subject, html, reply_to=customer_email)


async def send_preorder_confirmation(
    to_email: str,
    order_id: str,
    items: List[Dict],
    total: float,
    delivery_month: str = "Coming Soon",
    courtesy_links: List[Dict] = None,
    customer_name: str = "Valued Customer",
    coupon_code: str = None
) -> Dict:
    """Send preorder confirmation email with courtesy digital access"""
    subject = f"📦 Pre-Order Confirmed! #{order_id}"
    html = get_preorder_confirmation_template(
        order_id=order_id,
        items=items,
        total=total,
        delivery_month=delivery_month,
        courtesy_links=courtesy_links,
        customer_name=customer_name,
        coupon_code=coupon_code
    )
    return await send_email(to_email, subject, html)


async def send_game_pass_access(
    to_email: str,
    order_id: str,
    pass_type: str = "90-Day",
    customer_name: str = "Valued Customer"
) -> Dict:
    """Send game pass access email"""
    subject = f"🎮 Your {pass_type} Game Pass Is Ready! #{order_id}"
    html = get_game_pass_template(
        order_id=order_id,
        pass_type=pass_type,
        customer_name=customer_name
    )
    return await send_email(to_email, subject, html)
