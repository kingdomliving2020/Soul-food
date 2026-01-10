"""
Soul Food Gift Certificate PDF Generator
=========================================
Creates beautiful, check-style gift certificates
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from datetime import datetime
import os


def generate_gift_certificate_pdf(
    recipient_name: str,
    amount: float,
    certificate_code: str,
    sender_name: str,
    issue_date: datetime = None,
    expires_at: datetime = None,
    message: str = None
) -> BytesIO:
    """
    Generate a professional gift certificate PDF that looks like a check.
    
    Returns:
        BytesIO: PDF file buffer
    """
    buffer = BytesIO()
    
    # Use landscape letter size (11" x 8.5")
    width, height = landscape(letter)
    c = canvas.Canvas(buffer, pagesize=landscape(letter))
    
    # Set default date
    if issue_date is None:
        issue_date = datetime.utcnow()
    
    # === BACKGROUND AND BORDERS ===
    
    # Outer border - dark green
    c.setStrokeColor(colors.HexColor('#1a472a'))
    c.setLineWidth(3)
    c.rect(20, 20, width - 40, height - 40)
    
    # Inner decorative border - gold
    c.setStrokeColor(colors.HexColor('#c9a227'))
    c.setLineWidth(1.5)
    c.rect(30, 30, width - 60, height - 60)
    
    # Dotted perforation line (left side)
    c.setStrokeColor(colors.HexColor('#666666'))
    c.setDash(3, 3)
    c.setLineWidth(0.5)
    c.line(50, 40, 50, height - 40)
    c.setDash()  # Reset dash
    
    # Light background pattern area
    c.setFillColor(colors.HexColor('#faf7f0'))
    c.rect(35, 35, width - 70, height - 70, fill=True, stroke=False)
    
    # Guilloche-style decorative lines (simplified)
    c.setStrokeColor(colors.HexColor('#e8dcc8'))
    c.setLineWidth(0.3)
    for i in range(0, int(width), 20):
        c.line(i, 35, i + 100, height - 35)
    
    # === HEADER SECTION ===
    
    # Title: GIFT CERTIFICATE
    c.setFont("Helvetica-Bold", 32)
    c.setFillColor(colors.HexColor('#1a472a'))
    c.drawCentredString(width / 2, height - 80, "GIFT CERTIFICATE")
    
    # Subtitle: Kingdom Soul
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(colors.HexColor('#c9a227'))
    c.drawCentredString(width / 2, height - 105, "Soul Food - Kingdom Living Project")
    
    # === DATE (Top Right) ===
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor('#333333'))
    c.drawRightString(width - 60, height - 80, f"Date: {issue_date.strftime('%B %d, %Y')}")
    
    if expires_at:
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.HexColor('#666666'))
        c.drawRightString(width - 60, height - 95, f"Valid until: {expires_at.strftime('%B %d, %Y')}")
    
    # === LOGO PLACEHOLDER (Top Left) ===
    # Draw a decorative circle for logo
    c.setStrokeColor(colors.HexColor('#c9a227'))
    c.setFillColor(colors.HexColor('#1a472a'))
    c.setLineWidth(2)
    c.circle(130, height - 130, 55, fill=True, stroke=True)
    
    # Inner logo circle
    c.setFillColor(colors.HexColor('#c9a227'))
    c.circle(130, height - 130, 45, fill=True, stroke=False)
    
    # Logo text
    c.setFillColor(colors.HexColor('#1a472a'))
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(130, height - 120, "SOUL")
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(130, height - 138, "FOOD")
    
    # Cross symbol
    c.setStrokeColor(colors.HexColor('#1a472a'))
    c.setLineWidth(3)
    c.line(130, height - 165, 130, height - 150)
    c.line(122, height - 157, 138, height - 157)
    
    # === MAIN CONTENT AREA ===
    
    # "Pay to the Order of" line
    y_pos = height - 200
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.HexColor('#333333'))
    c.drawString(80, y_pos, "Pay to the")
    c.drawString(80, y_pos - 18, "Order of:")
    
    # Recipient name
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(colors.HexColor('#1a472a'))
    c.drawString(180, y_pos - 10, recipient_name or "_" * 40)
    
    # Line under recipient name
    c.setStrokeColor(colors.HexColor('#333333'))
    c.setLineWidth(0.5)
    c.line(180, y_pos - 20, width - 200, y_pos - 20)
    
    # === AMOUNT BOX (Right side) ===
    amount_box_x = width - 180
    amount_box_y = y_pos - 30
    
    # Draw amount box with green border
    c.setStrokeColor(colors.HexColor('#1a472a'))
    c.setFillColor(colors.HexColor('#ffffff'))
    c.setLineWidth(2)
    c.rect(amount_box_x, amount_box_y, 120, 45, fill=True, stroke=True)
    
    # Dollar sign
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(colors.HexColor('#1a472a'))
    c.drawString(amount_box_x + 8, amount_box_y + 12, "$")
    
    # Amount value
    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(colors.HexColor('#1a472a'))
    c.drawString(amount_box_x + 35, amount_box_y + 10, f"{amount:.2f}")
    
    # "Given to" line (From)
    y_pos -= 70
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.HexColor('#333333'))
    c.drawString(80, y_pos, "Given by:")
    
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.HexColor('#1a472a'))
    c.drawString(180, y_pos, sender_name or "_" * 40)
    
    c.setStrokeColor(colors.HexColor('#333333'))
    c.line(180, y_pos - 8, width - 200, y_pos - 8)
    
    # Amount in words
    y_pos -= 50
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.HexColor('#333333'))
    c.drawString(80, y_pos, "Amount:")
    
    amount_words = number_to_words(amount)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.HexColor('#1a472a'))
    c.drawString(160, y_pos, f"{amount_words} Dollars")
    
    c.setStrokeColor(colors.HexColor('#333333'))
    c.line(160, y_pos - 8, width - 200, y_pos - 8)
    c.drawString(width - 195, y_pos, "DOLLARS")
    
    # === MEMO LINE (Certificate Number) ===
    y_pos -= 60
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor('#333333'))
    c.drawString(80, y_pos, "Memo:")
    
    # Certificate code in memo
    c.setFont("Courier-Bold", 14)
    c.setFillColor(colors.HexColor('#1a472a'))
    c.drawString(140, y_pos, f"Voucher #{certificate_code}")
    
    c.setStrokeColor(colors.HexColor('#333333'))
    c.line(140, y_pos - 8, 400, y_pos - 8)
    
    # === SIGNATURE AREA (Right side) ===
    signature_y = y_pos - 5
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor('#333333'))
    c.drawRightString(width - 80, signature_y + 25, "Authorized Signature")
    
    # Signature line
    c.setStrokeColor(colors.HexColor('#333333'))
    c.line(width - 280, signature_y, width - 80, signature_y)
    
    # Script signature
    c.setFont("Helvetica-Oblique", 20)
    c.setFillColor(colors.HexColor('#1a472a'))
    c.drawCentredString(width - 180, signature_y + 8, "Kingdom Soul")
    
    # === BOTTOM SECTION ===
    
    # Check-style numbers at bottom
    y_pos -= 50
    c.setFont("Courier", 12)
    c.setFillColor(colors.HexColor('#666666'))
    
    # Generate check-style routing numbers
    routing_style = f"⑆{certificate_code[-5:]}⑆ ⑈0301790371⑈"
    c.drawString(80, y_pos, routing_style)
    
    # For line
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor('#333333'))
    c.drawString(80, y_pos - 20, "For: Jehovah Jirreh Savings & Trust")
    
    # === FOOTER - Tagline ===
    c.setFont("Helvetica-Oblique", 14)
    c.setFillColor(colors.HexColor('#c9a227'))
    c.drawCentredString(width / 2, 55, "~ Truth Served Daily ~")
    
    # Website
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor('#666666'))
    c.drawCentredString(width / 2, 40, "Redeem at kingdom-soul.com/redeem-gift")
    
    # === OPTIONAL MESSAGE ===
    if message:
        # Message box on the right side
        msg_x = width - 300
        msg_y = height - 230
        
        c.setStrokeColor(colors.HexColor('#e8dcc8'))
        c.setFillColor(colors.HexColor('#fefefe'))
        c.rect(msg_x, msg_y - 60, 230, 70, fill=True, stroke=True)
        
        c.setFont("Helvetica-Oblique", 10)
        c.setFillColor(colors.HexColor('#666666'))
        c.drawString(msg_x + 10, msg_y, "Personal Message:")
        
        c.setFont("Helvetica", 11)
        c.setFillColor(colors.HexColor('#333333'))
        
        # Wrap message text
        message_lines = wrap_text(message, 30)
        for i, line in enumerate(message_lines[:3]):
            c.drawString(msg_x + 10, msg_y - 18 - (i * 14), line)
    
    c.save()
    buffer.seek(0)
    return buffer


def number_to_words(n: float) -> str:
    """Convert a number to words for check writing."""
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    whole = int(n)
    cents = int(round((n - whole) * 100))
    
    if whole == 0:
        whole_words = "Zero"
    elif whole < 20:
        whole_words = ones[whole]
    elif whole < 100:
        whole_words = tens[whole // 10] + ('' if whole % 10 == 0 else '-' + ones[whole % 10])
    elif whole < 1000:
        whole_words = ones[whole // 100] + ' Hundred' + ('' if whole % 100 == 0 else ' ' + number_to_words(whole % 100))
    else:
        whole_words = str(whole)
    
    if cents > 0:
        return f"{whole_words} and {cents}/100"
    return whole_words


def wrap_text(text: str, max_chars: int) -> list:
    """Simple text wrapper."""
    words = text.split()
    lines = []
    current_line = ""
    
    for word in words:
        if len(current_line) + len(word) + 1 <= max_chars:
            current_line += (" " if current_line else "") + word
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    
    if current_line:
        lines.append(current_line)
    
    return lines
