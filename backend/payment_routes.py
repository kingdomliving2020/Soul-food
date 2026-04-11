from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest
)
from datetime import datetime, timedelta

load_dotenv()

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'soul_food_db')]

# PDF files directory
PDF_DIR = "/app/content/downloads"

# Product ID to PDF file mapping
PRODUCT_FILES = {
    # =============== HOLIDAY SERIES ===============
    # Full Workbooks - Holiday
    "holiday_ae": "holiday-ae-full.pdf",
    "holiday_ye": "holiday-ye-full.pdf",
    "holiday_ie": "holiday-ie-full.pdf",
    # Holiday - with dash format (frontend sends these)
    "holiday-full-ae-digital": "holiday-ae-full.pdf",
    "holiday-full-ye-digital": "holiday-ye-full.pdf",
    "holiday-full-ie-digital": "holiday-ie-full.pdf",
    "holiday-ae-full-digital": "holiday-ae-full.pdf",
    "holiday-ye-full-digital": "holiday-ye-full.pdf",
    "holiday-ie-full-digital": "holiday-ie-full.pdf",
    "holiday-full-adult-digital": "holiday-ae-full.pdf",
    "holiday-full-youth-digital": "holiday-ye-full.pdf",
    "holiday-full-instructor-digital": "holiday-ie-full.pdf",
    # Holiday print versions (map to same PDF for download)
    "holiday-full-ae-print": "holiday-ae-full.pdf",
    "holiday-full-ye-print": "holiday-ye-full.pdf",
    "holiday-full-ie-print": "holiday-ie-full.pdf",
    "holiday-full-adult-print": "holiday-ae-full.pdf",
    "holiday-full-youth-print": "holiday-ye-full.pdf",
    "holiday-full-instructor-print": "holiday-ie-full.pdf",
    # =============== BREAKFAST SERIES ===============
    # Snack Packs
    "snack_pack_ae_m1": "breakfast-ae-month1-snackpack.pdf",
    "snack_pack_ae_m2": "breakfast-ae-month2-snackpack.pdf",
    "snack_pack_ae_m3": "breakfast-ae-month3-snackpack.pdf",
    "snack_pack_ye_m1": "breakfast-ye-month1-snackpack.pdf",
    "snack_pack_ye_m2": "breakfast-ye-month2-snackpack.pdf",
    "snack_pack_ye_m3": "breakfast-ye-month3-snackpack.pdf",
    # Full Workbooks - with underscore format
    "breakfast_ae_digital": "breakfast-ae-full.pdf",
    "breakfast_ye_digital": "breakfast-ye-full.pdf",
    "breakfast_ie_digital": "breakfast-ie-full.pdf",
    # Full Workbooks - with dash format (frontend sends these)
    "breakfast-full-ae-digital": "breakfast-ae-full.pdf",
    "breakfast-full-ye-digital": "breakfast-ye-full.pdf",
    "breakfast-full-ie-digital": "breakfast-ie-full.pdf",
    "breakfast-ae-full-digital": "breakfast-ae-full.pdf",
    "breakfast-ye-full-digital": "breakfast-ye-full.pdf",
    "breakfast-ie-full-digital": "breakfast-ie-full.pdf",
    "breakfast-full-adult-digital": "breakfast-ae-full.pdf",
    "breakfast-full-youth-digital": "breakfast-ye-full.pdf",
    "breakfast-full-instructor-digital": "breakfast-ie-full.pdf",
    # Breakfast print versions
    "breakfast-full-ae-print": "breakfast-ae-full.pdf",
    "breakfast-full-ye-print": "breakfast-ye-full.pdf",
    "breakfast-full-ie-print": "breakfast-ie-full.pdf",
    "breakfast-full-adult-print": "breakfast-ae-full.pdf",
    "breakfast-full-youth-print": "breakfast-ye-full.pdf",
    "breakfast-full-instructor-print": "breakfast-ie-full.pdf",
    # Snack Packs - with dash format
    "breakfast-snack-ae-m1-digital": "breakfast-ae-month1-snackpack.pdf",
    "breakfast-snack-ae-m2-digital": "breakfast-ae-month2-snackpack.pdf",
    "breakfast-snack-ae-m3-digital": "breakfast-ae-month3-snackpack.pdf",
    "breakfast-snack-ye-m1-digital": "breakfast-ye-month1-snackpack.pdf",
    "breakfast-snack-ye-m2-digital": "breakfast-ye-month2-snackpack.pdf",
    "breakfast-snack-ye-m3-digital": "breakfast-ye-month3-snackpack.pdf",
    # Breakfast Snack Packs by Theme
    "breakfast-snack-month-1-adult-interactive": "breakfast-ae-month1-snackpack.pdf",
    "breakfast-snack-month-2-adult-interactive": "breakfast-ae-month2-snackpack.pdf",
    "breakfast-snack-month-3-adult-interactive": "breakfast-ae-month3-snackpack.pdf",
    "breakfast-snack-month-1-youth-interactive": "breakfast-ye-month1-snackpack.pdf",
    "breakfast-snack-month-2-youth-interactive": "breakfast-ye-month2-snackpack.pdf",
    "breakfast-snack-month-3-youth-interactive": "breakfast-ye-month3-snackpack.pdf",
    # Nibbles (single lessons) - old format
    "nibble_ae": "breakfast-ae-esther.pdf",
    "nibble_ye": "breakfast-ye-esther.pdf",
    # Breakfast Nibbles - Month 1 (Prayer) - Individual lessons extracted
    "breakfast-nibble-prayer-1-adult-interactive": "breakfast-ae-prayer-lesson1.pdf",
    "breakfast-nibble-prayer-2-adult-interactive": "breakfast-ae-prayer-lesson2.pdf",
    "breakfast-nibble-prayer-3-adult-interactive": "breakfast-ae-prayer-lesson3.pdf",
    "breakfast-nibble-prayer-4-adult-interactive": "breakfast-ae-prayer-lesson4.pdf",
    "breakfast-nibble-prayer-1-youth-interactive": "breakfast-ye-prayer-lesson1.pdf",
    "breakfast-nibble-prayer-2-youth-interactive": "breakfast-ye-prayer-lesson2.pdf",
    "breakfast-nibble-prayer-3-youth-interactive": "breakfast-ye-prayer-lesson3.pdf",
    "breakfast-nibble-prayer-4-youth-interactive": "breakfast-ye-prayer-lesson4.pdf",
    # Breakfast Nibbles - Month 2 (Through) - Individual lessons extracted
    "breakfast-nibble-through-1-adult-interactive": "breakfast-ae-through-lesson1.pdf",
    "breakfast-nibble-through-2-adult-interactive": "breakfast-ae-through-lesson2.pdf",
    "breakfast-nibble-through-3-adult-interactive": "breakfast-ae-through-lesson3.pdf",
    "breakfast-nibble-through-4-adult-interactive": "breakfast-ae-through-lesson4.pdf",
    "breakfast-nibble-through-1-youth-interactive": "breakfast-ye-through-lesson1.pdf",
    "breakfast-nibble-through-2-youth-interactive": "breakfast-ye-through-lesson2.pdf",
    "breakfast-nibble-through-3-youth-interactive": "breakfast-ye-through-lesson3.pdf",
    "breakfast-nibble-through-4-youth-interactive": "breakfast-ye-through-lesson4.pdf",
    # Breakfast Nibbles - Month 3 (Faith) - Individual lessons extracted
    "breakfast-nibble-faith-1-adult-interactive": "breakfast-ae-faith-lesson1.pdf",
    "breakfast-nibble-faith-2-adult-interactive": "breakfast-ae-faith-lesson2.pdf",
    "breakfast-nibble-faith-3-adult-interactive": "breakfast-ae-faith-lesson3.pdf",
    "breakfast-nibble-faith-4-adult-interactive": "breakfast-ae-faith-lesson4.pdf",
    "breakfast-nibble-faith-1-youth-interactive": "breakfast-ye-faith-lesson1.pdf",
    "breakfast-nibble-faith-2-youth-interactive": "breakfast-ye-faith-lesson2.pdf",
    "breakfast-nibble-faith-3-youth-interactive": "breakfast-ye-faith-lesson3.pdf",
    "breakfast-nibble-faith-4-youth-interactive": "breakfast-ye-faith-lesson4.pdf",
    # Holiday Nibbles
    "holiday-nibble-ae-covenant-digital": "holiday-ae-full.pdf",
    "holiday-nibble-ae-cradle-digital": "holiday-ae-full.pdf",
    "holiday-nibble-ae-cross-digital": "holiday-ae-full.pdf",
    "holiday-nibble-ae-comforter-digital": "holiday-ae-full.pdf",
    "holiday-nibble-ye-covenant-digital": "holiday-ye-full.pdf",
    "holiday-nibble-ye-cradle-digital": "holiday-ye-full.pdf",
    "holiday-nibble-ye-cross-digital": "holiday-ye-full.pdf",
    "holiday-nibble-ye-comforter-digital": "holiday-ye-full.pdf",
    "holiday-nibble-holiday-ae-covenant-adult-interactive": "holiday-ae-full.pdf",
    "holiday-nibble-holiday-ae-cradle-adult-interactive": "holiday-ae-full.pdf",
    "holiday-nibble-holiday-ae-cross-adult-interactive": "holiday-ae-full.pdf",
    "holiday-nibble-holiday-ae-comforter-adult-interactive": "holiday-ae-full.pdf",
    "holiday-nibble-holiday-ye-covenant-youth-interactive": "holiday-ye-full.pdf",
    "holiday-nibble-holiday-ye-cradle-youth-interactive": "holiday-ye-full.pdf",
    "holiday-nibble-holiday-ye-cross-youth-interactive": "holiday-ye-full.pdf",
    "holiday-nibble-holiday-ye-comforter-youth-interactive": "holiday-ye-full.pdf",
    # Breakfast Nibbles from nibbles/ directory (individual lessons)
    "breakfast-nibble-l1-ae": "nibbles/breakfast-ae-l1-nibble.pdf",
    "breakfast-nibble-l2-ae": "nibbles/breakfast-ae-l2-nibble.pdf",
    "breakfast-nibble-l3-ae": "nibbles/breakfast-ae-l3-nibble.pdf",
    "breakfast-nibble-l4-ae": "nibbles/breakfast-ae-l4-nibble.pdf",
    "breakfast-nibble-l5-ae": "nibbles/breakfast-ae-l5-nibble.pdf",
    "breakfast-nibble-l6-ae": "nibbles/breakfast-ae-l6-nibble.pdf",
    "breakfast-nibble-l7-ae": "nibbles/breakfast-ae-l7-nibble.pdf",
    "breakfast-nibble-l8-ae": "nibbles/breakfast-ae-l8-nibble.pdf",
    "breakfast-nibble-l9-ae": "nibbles/breakfast-ae-l9-nibble.pdf",
    "breakfast-nibble-l10-ae": "nibbles/breakfast-ae-l10-nibble.pdf",
    "breakfast-nibble-l11-ae": "nibbles/breakfast-ae-l11-nibble.pdf",
    "breakfast-nibble-l12-ae": "nibbles/breakfast-ae-l12-nibble.pdf",
    "breakfast-nibble-l1-ye": "nibbles/breakfast-ye-l1-nibble.pdf",
    "breakfast-nibble-l2-ye": "nibbles/breakfast-ye-l2-nibble.pdf",
    "breakfast-nibble-l3-ye": "nibbles/breakfast-ye-l3-nibble.pdf",
    "breakfast-nibble-l4-ye": "nibbles/breakfast-ye-l4-nibble.pdf",
    "breakfast-nibble-l5-ye": "nibbles/breakfast-ye-l5-nibble.pdf",
    "breakfast-nibble-l6-ye": "nibbles/breakfast-ye-l6-nibble.pdf",
    "breakfast-nibble-l7-ye": "nibbles/breakfast-ye-l7-nibble.pdf",
    "breakfast-nibble-l8-ye": "nibbles/breakfast-ye-l8-nibble.pdf",
    "breakfast-nibble-l9-ye": "nibbles/breakfast-ye-l9-nibble.pdf",
    "breakfast-nibble-l10-ye": "nibbles/breakfast-ye-l10-nibble.pdf",
    "breakfast-nibble-l11-ye": "nibbles/breakfast-ye-l11-nibble.pdf",
    "breakfast-nibble-l12-ye": "nibbles/breakfast-ye-l12-nibble.pdf",
    # Free bonus lessons - Adult Edition (FREE)
    "bonus_names_of_god": "holiday-bonus-names-seasons.pdf",
    "bonus_times_seasons": "holiday-bonus-names-seasons.pdf",
    "bonus_in_his_image": "in-his-image-adult-full.pdf",
    # Holiday Bonus Lessons - by edition
    "bonus-ae-holiday": "bonus-ae-holiday.pdf",
    "bonus-ye-holiday": "bonus-ye-holiday.pdf",
    "bonus-ie-holiday": "bonus-ie-holiday.pdf",
    "holiday-bonus-ae": "bonus-ae-holiday.pdf",
    "holiday-bonus-ye": "bonus-ye-holiday.pdf",
    "holiday-bonus-ie": "bonus-ie-holiday.pdf",
    # In His Image series
    "in-his-image-full-ae-digital": "in-his-image-adult-full.pdf",
    "in-his-image-full-ye-digital": "in-his-image-youth-full.pdf",
    "in-his-image-ae-digital": "in-his-image-adult-full.pdf",
    "in-his-image-ye-digital": "in-his-image-youth-full.pdf",
    # =============== FRONTEND CART ID MAPPINGS ===============
    # Featured Section direct addToCart IDs
    "holiday-ae-digital": "holiday-ae-full.pdf",
    "holiday-ye-digital": "holiday-ye-full.pdf",
    "holiday-ie-digital": "holiday-ie-full.pdf",
    "holiday-ae-paperback": "holiday-ae-full.pdf",
    "holiday-ye-paperback": "holiday-ye-full.pdf",
    "holiday-ie-paperback": "holiday-ie-full.pdf",
    # Featured Bundles
    "holiday-table-bundle": "holiday-ae-full.pdf",
    "full-table-experience": "holiday-ae-full.pdf",
    # Workbooks section (prefixed with "workbooks-")
    "workbooks-holiday-ae-digital-adult-digital": "holiday-ae-full.pdf",
    "workbooks-holiday-ae-paperback-adult-physical": "holiday-ae-full.pdf",
    "workbooks-holiday-ye-digital-youth-digital": "holiday-ye-full.pdf",
    "workbooks-holiday-ye-paperback-youth-physical": "holiday-ye-full.pdf",
    "workbooks-holiday-ie-digital-instructor-digital": "holiday-ie-full.pdf",
    "workbooks-holiday-ie-paperback-instructor-physical": "holiday-ie-full.pdf",
    "workbooks-breakfast-ae-digital-adult-digital": "breakfast-ae-full.pdf",
    "workbooks-breakfast-ae-paperback-adult-physical": "breakfast-ae-full.pdf",
    "workbooks-breakfast-ye-digital-youth-digital": "breakfast-ye-full.pdf",
    "workbooks-breakfast-ye-paperback-youth-physical": "breakfast-ye-full.pdf",
    # Breakfast series (nibble/snack/meal sections)
    "breakfast-nibble-adult-interactive": "breakfast-ae-esther.pdf",
    "breakfast-nibble-youth-interactive": "breakfast-ye-esther.pdf",
    "breakfast-snack-adult-interactive": "breakfast-ae-month1-snackpack.pdf",
    "breakfast-snack-youth-interactive": "breakfast-ye-month1-snackpack.pdf",
    "breakfast-meal-adult-digital": "breakfast-ae-full.pdf",
    "breakfast-meal-youth-digital": "breakfast-ye-full.pdf",
    "breakfast-meal-adult-physical": "breakfast-ae-full.pdf",
    "breakfast-meal-youth-physical": "breakfast-ye-full.pdf",
    # Holiday series (nibble/full sections)
    "holiday-nibble-adult-interactive": "holiday-ae-full.pdf",
    "holiday-nibble-youth-interactive": "holiday-ye-full.pdf",
    "holiday-full-adult-interactive": "holiday-ae-full.pdf",
    "holiday-full-youth-interactive": "holiday-ye-full.pdf",
    "holiday-full-instructor-interactive": "holiday-ie-full.pdf",
    # Lunch series workbooks (pre-order, map to placeholder or same PDF)
    "lunch-workbook-adult-physical": "holiday-ae-full.pdf",
    "lunch-workbook-youth-physical": "holiday-ye-full.pdf",
    "lunch-workbook-instructor-physical": "holiday-ie-full.pdf",
    # Instructor edition section (prefixed with "instructor-")
    "instructor-holiday-ie-instructor-physical": "holiday-ie-full.pdf",
    "instructor-breakfast-digital-instructor-digital": "breakfast-ie-full.pdf",
    "instructor-breakfast-paperback-instructor-physical": "breakfast-ie-full.pdf",
    "instructor-lunch-ie-preorder-instructor-physical": "holiday-ie-full.pdf",
    # Direct product IDs (from handleAddToCart for gaming/products grid)
    "gaming-pass-30-adult-digital": "holiday-ae-full.pdf",
    "gaming-pass-30-youth-digital": "holiday-ye-full.pdf",
    "gaming-pass-90-adult-digital": "holiday-ae-full.pdf",
    "gaming-pass-90-youth-digital": "holiday-ye-full.pdf",
    "gaming-pass-90-instructor-digital": "holiday-ie-full.pdf",
    # Breakfast direct IDs
    "breakfast-ae-digital": "breakfast-ae-full.pdf",
    "breakfast-ye-digital": "breakfast-ye-full.pdf",
    "breakfast-ie-digital": "breakfast-ie-full.pdf",
    "breakfast-ae-paperback": "breakfast-ae-full.pdf",
    "breakfast-ye-paperback": "breakfast-ye-full.pdf",
    "breakfast-ie-paperback": "breakfast-ie-full.pdf",
    # =============== EPUB FORMAT MAPPINGS ===============
    # Frontend sends "-epub" for ebook format selections
    "breakfast-snack-month-1-adult-epub": "breakfast-ae-month1-snackpack.pdf",
    "breakfast-snack-month-2-adult-epub": "breakfast-ae-month2-snackpack.pdf",
    "breakfast-snack-month-3-adult-epub": "breakfast-ae-month3-snackpack.pdf",
    "breakfast-snack-month-1-youth-epub": "breakfast-ye-month1-snackpack.pdf",
    "breakfast-snack-month-2-youth-epub": "breakfast-ye-month2-snackpack.pdf",
    "breakfast-snack-month-3-youth-epub": "breakfast-ye-month3-snackpack.pdf",
    "breakfast-nibble-prayer-1-adult-epub": "breakfast-ae-prayer-lesson1.pdf",
    "breakfast-nibble-prayer-2-adult-epub": "breakfast-ae-prayer-lesson2.pdf",
    "breakfast-nibble-prayer-3-adult-epub": "breakfast-ae-prayer-lesson3.pdf",
    "breakfast-nibble-prayer-4-adult-epub": "breakfast-ae-prayer-lesson4.pdf",
    "breakfast-nibble-prayer-1-youth-epub": "breakfast-ye-prayer-lesson1.pdf",
    "breakfast-nibble-prayer-2-youth-epub": "breakfast-ye-prayer-lesson2.pdf",
    "breakfast-nibble-prayer-3-youth-epub": "breakfast-ye-prayer-lesson3.pdf",
    "breakfast-nibble-prayer-4-youth-epub": "breakfast-ye-prayer-lesson4.pdf",
    "breakfast-nibble-through-1-adult-epub": "breakfast-ae-through-lesson1.pdf",
    "breakfast-nibble-through-2-adult-epub": "breakfast-ae-through-lesson2.pdf",
    "breakfast-nibble-through-3-adult-epub": "breakfast-ae-through-lesson3.pdf",
    "breakfast-nibble-through-4-adult-epub": "breakfast-ae-through-lesson4.pdf",
    "breakfast-nibble-through-1-youth-epub": "breakfast-ye-through-lesson1.pdf",
    "breakfast-nibble-through-2-youth-epub": "breakfast-ye-through-lesson2.pdf",
    "breakfast-nibble-through-3-youth-epub": "breakfast-ye-through-lesson3.pdf",
    "breakfast-nibble-through-4-youth-epub": "breakfast-ye-through-lesson4.pdf",
    "breakfast-nibble-faith-1-adult-epub": "breakfast-ae-faith-lesson1.pdf",
    "breakfast-nibble-faith-2-adult-epub": "breakfast-ae-faith-lesson2.pdf",
    "breakfast-nibble-faith-3-adult-epub": "breakfast-ae-faith-lesson3.pdf",
    "breakfast-nibble-faith-4-adult-epub": "breakfast-ae-faith-lesson4.pdf",
    "breakfast-nibble-faith-1-youth-epub": "breakfast-ye-faith-lesson1.pdf",
    "breakfast-nibble-faith-2-youth-epub": "breakfast-ye-faith-lesson2.pdf",
    "breakfast-nibble-faith-3-youth-epub": "breakfast-ye-faith-lesson3.pdf",
    "breakfast-nibble-faith-4-youth-epub": "breakfast-ye-faith-lesson4.pdf",
    "breakfast-meal-adult-epub": "breakfast-ae-full.pdf",
    "breakfast-meal-youth-epub": "breakfast-ye-full.pdf",
    # Holiday epub format
    "holiday-nibble-holiday-ae-covenant-adult-epub": "holiday-ae-full.pdf",
    "holiday-nibble-holiday-ae-cradle-adult-epub": "holiday-ae-full.pdf",
    "holiday-nibble-holiday-ae-cross-adult-epub": "holiday-ae-full.pdf",
    "holiday-nibble-holiday-ae-comforter-adult-epub": "holiday-ae-full.pdf",
    "holiday-nibble-holiday-ye-covenant-youth-epub": "holiday-ye-full.pdf",
    "holiday-nibble-holiday-ye-cradle-youth-epub": "holiday-ye-full.pdf",
    "holiday-nibble-holiday-ye-cross-youth-epub": "holiday-ye-full.pdf",
    "holiday-nibble-holiday-ye-comforter-youth-epub": "holiday-ye-full.pdf",
    "holiday-full-adult-epub": "holiday-ae-full.pdf",
    "holiday-full-youth-epub": "holiday-ye-full.pdf",
    "holiday-full-instructor-epub": "holiday-ie-full.pdf",
    # Workbooks epub format
    "workbooks-holiday-ae-digital-adult-epub": "holiday-ae-full.pdf",
    "workbooks-holiday-ye-digital-youth-epub": "holiday-ye-full.pdf",
    "workbooks-holiday-ie-digital-instructor-epub": "holiday-ie-full.pdf",
    "workbooks-breakfast-ae-digital-adult-epub": "breakfast-ae-full.pdf",
    "workbooks-breakfast-ye-digital-youth-epub": "breakfast-ye-full.pdf",
}

def normalize_product_id(product_id: str) -> str:
    """Normalize product ID to match PRODUCT_FILES keys"""
    if not product_id:
        return product_id
    
    # Already in PRODUCT_FILES, return as-is
    if product_id in PRODUCT_FILES:
        return product_id
    
    # Try common transformations
    normalized = product_id.lower().strip()
    
    # Check if normalized version exists
    if normalized in PRODUCT_FILES:
        return normalized
    
    # Try replacing dashes with underscores
    underscore_version = normalized.replace('-', '_')
    if underscore_version in PRODUCT_FILES:
        return underscore_version
    
    # Smart extraction: cart IDs are often like "workbooks-holiday-ae-digital-adult-digital"
    # or "breakfast-snack-month-1-adult-interactive"
    # Try progressively shorter prefixes
    parts = normalized.split('-')
    for end in range(len(parts), 1, -1):
        candidate = '-'.join(parts[:end])
        if candidate in PRODUCT_FILES:
            return candidate
        # Also try underscore version
        candidate_us = '_'.join(parts[:end])
        if candidate_us in PRODUCT_FILES:
            return candidate_us
    
    # Try extracting known series + edition patterns
    series_map = {
        'holiday': {'ae': 'holiday_ae', 'ye': 'holiday_ye', 'ie': 'holiday_ie', 'adult': 'holiday_ae', 'youth': 'holiday_ye', 'instructor': 'holiday_ie'},
        'breakfast': {'ae': 'breakfast_ae_digital', 'ye': 'breakfast_ye_digital', 'ie': 'breakfast_ie_digital', 'adult': 'breakfast_ae_digital', 'youth': 'breakfast_ye_digital', 'instructor': 'breakfast_ie_digital'},
    }
    
    # Try with epub/ebook -> interactive/digital substitution
    for old_fmt, new_fmt in [('epub', 'interactive'), ('epub', 'digital'), ('ebook', 'interactive'), ('ebook', 'digital')]:
        swapped = normalized.replace(f'-{old_fmt}', f'-{new_fmt}')
        if swapped in PRODUCT_FILES:
            return swapped
    
    for series_key, editions in series_map.items():
        if series_key in normalized:
            for ed_key, file_key in editions.items():
                if ed_key in normalized:
                    if file_key in PRODUCT_FILES:
                        return file_key
    
    # Try extracting just the package portion (skip section prefix)
    # e.g., "workbooks-holiday-ae-digital-adult-digital" -> "holiday-ae-digital"
    known_sections = ['workbooks', 'instructor', 'bookclub']
    for section in known_sections:
        if normalized.startswith(section + '-'):
            remainder = normalized[len(section) + 1:]
            if remainder in PRODUCT_FILES:
                return remainder
            # Try trimming trailing edition-format
            remainder_parts = remainder.split('-')
            for end in range(len(remainder_parts), 1, -1):
                sub = '-'.join(remainder_parts[:end])
                if sub in PRODUCT_FILES:
                    return sub
    
    return product_id  # Return original if no match found

def get_pdf_path(product_id: str) -> Optional[str]:
    """Get the full path to a product's PDF file (hardcoded fallback)"""
    normalized_id = normalize_product_id(product_id)
    
    filename = PRODUCT_FILES.get(normalized_id)
    if not filename:
        print(f"[PDF Path] No mapping found for product_id: {product_id} (normalized: {normalized_id})")
        return None
    
    full_path = os.path.join(PDF_DIR, filename)
    if os.path.exists(full_path):
        print(f"[PDF Path] Found file for {product_id}: {full_path}")
        return full_path
    
    print(f"[PDF Path] File not found: {full_path}")
    return None


async def get_pdf_path_async(product_id: str) -> Optional[str]:
    """Get PDF path — checks MongoDB product_file_mappings first, then hardcoded fallback.
    Use this in async contexts (webhooks, fulfillment) for no-redeploy mapping support."""
    normalized_id = normalize_product_id(product_id)
    
    # 1. Check MongoDB mapping first
    mapping = await db.product_file_mappings.find_one(
        {"product_id": {"$in": [product_id, normalized_id]}, "active": True},
        {"_id": 0, "file_path": 1, "filename": 1}
    )
    if mapping:
        path = mapping.get("file_path") or os.path.join(PDF_DIR, mapping.get("filename", ""))
        if os.path.exists(path):
            return path
    
    # 2. Fall back to hardcoded PRODUCT_FILES
    return get_pdf_path(product_id)

# Product catalog with list and sale prices
# Cost = wholesale/production cost, List Price = MSRP, Sale Price = current selling price
# Updated: January 2026 per Stripe Product Catalog
PRODUCTS = {
    # ==================== SNACK PACKS - ADULT EDITION ====================
    "snack_pack_ae_m1": {
        "name": "Break*fast Snack Pack AE M1",
        "sku": "BKFT-SP-AE-M1",
        "stripe_id": "prod_Tl6meQRKMfxtOq",
        "description": "Adult Edition. Module 1 (4 Lessons) PDF for quick-start study—lesson content, journaling space, and activities. Theme: Prayer, the First Resort",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "AE"
    },
    "snack_pack_ae_m2": {
        "name": "Break*fast Snack Pack AE M2",
        "sku": "BKFT-SP-AE-M2",
        "stripe_id": "prod_Tl6wX9CvgMB8Tz",
        "description": "Adult Edition. Module 2 (4 Lessons) PDF—guided prompts, reflection space, and group-ready activities. Theme: The Art of Through",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "AE"
    },
    "snack_pack_ae_m3": {
        "name": "Break*fast Snack Pack AE M3",
        "sku": "BKFT-SP-AE-M3",
        "stripe_id": "prod_Tl6zPmnPaSE4iQ",
        "description": "Adult Edition. Module 3 (4 Lessons) PDF for continued growth—structured lessons with journaling space. Theme: Faith & Foresight",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "AE"
    },
    
    # ==================== SNACK PACKS - YOUTH EDITION ====================
    "snack_pack_ye_m1": {
        "name": "Break*fast Snack Pack YE M1",
        "sku": "BKFT-SP-YE-M1",
        "stripe_id": "prod_Tl5jzNmDkKJnth",
        "description": "Youth Edition. Module 1 (4 Lessons) PDF for quick-start study—lesson content, journaling space, and activities. Theme: Prayer, the First Resort",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "YE"
    },
    "snack_pack_ye_m2": {
        "name": "Break*fast Snack Pack YE M2",
        "sku": "BKFT-SP-YE-M2",
        "stripe_id": "prod_Tl5oCtBvc2kGHX",
        "description": "Youth Edition. Module 2 (4 Lessons) PDF—guided prompts, reflection space, and group-ready activities. Theme: The Art of Through",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "YE"
    },
    "snack_pack_ye_m3": {
        "name": "Break*fast Snack Pack YE M3",
        "sku": "BKFT-SP-YE-M3",
        "stripe_id": "prod_Tl5vC3AqFX0CBp",
        "description": "Youth Edition. Module 3 (4 Lessons) PDF for continued growth—structured lessons with journaling space. Theme: Faith & Foresight",
        "list_price": 8.99,
        "sale_price": 8.99,
        "currency": "usd",
        "unit": "set",
        "edition": "YE"
    },
    
    # ==================== BREAKFAST WORKBOOKS ====================
    "breakfast_ie_digital": {
        "name": "Break*fast IE (Digital) — Pre-Order",
        "sku": "BKFT-IE-DIG",
        "stripe_id": "prod_Tl5P17AYZd8eAR",
        "description": "Leader-focused edition with teaching support, discussion guidance, and answer helps. Includes maps plus cultural/historical notes.",
        "list_price": 19.99,
        "sale_price": 16.99,
        "currency": "usd",
        "edition": "IE",
        "medium": "digital",
        "preorder": True
    },
    "breakfast_ie_paperback": {
        "name": "Break*fast Instructor Edition (WBK) — Pre-Order",
        "sku": "BKFT-IE-PB",
        "stripe_id": "prod_Tl5DmbgIRsGRbR",
        "description": "Leader-focused edition with teaching support, discussion guidance, and answer helps. Includes maps plus cultural/historical notes.",
        "list_price": 29.99,
        "sale_price": 26.99,
        "currency": "usd",
        "edition": "IE",
        "medium": "paperback",
        "preorder": True
    },
    "breakfast_ae_digital": {
        "name": "Break*fast AE (Digital) — Pre-Order",
        "sku": "BKFT-AE-DIG",
        "stripe_id": "prod_Tl5TzIALgCR5AX",
        "description": "Adult workbook centered on Foundation in Christ. Journal-style space with reflective prompts and group-ready activities.",
        "list_price": 14.99,
        "sale_price": 11.99,
        "currency": "usd",
        "edition": "AE",
        "medium": "digital",
        "preorder": True
    },
    "breakfast_ae_paperback": {
        "name": "Break*fast Adult Edition (WBK) — Pre-Order",
        "sku": "BKFT-AE-PB",
        "stripe_id": "prod_Tl5GHVPeUEeqRH",
        "description": "Adult workbook centered on Foundation in Christ. Journal-style space with reflective prompts and group-ready activities.",
        "list_price": 27.99,
        "sale_price": 24.99,
        "currency": "usd",
        "edition": "AE",
        "medium": "paperback",
        "preorder": True
    },
    "breakfast_ye_digital": {
        "name": "Break*fast YE (Digital) — Pre-Order",
        "sku": "BKFT-YE-DIG",
        "stripe_id": "prod_Tl5WM3aZcWrBB1",
        "description": "Youth workbook built to strengthen identity and growth in Christ. Guided prompts, journaling space, and engaging activities for teens.",
        "list_price": 12.99,
        "sale_price": 9.99,
        "currency": "usd",
        "edition": "YE",
        "medium": "digital",
        "preorder": True
    },
    "breakfast_ye_paperback": {
        "name": "Break*fast Youth Edition (WBK) — Pre-Order",
        "sku": "BKFT-YE-PB",
        "stripe_id": "prod_Tl5KYUQVq7fgKd",
        "description": "Youth workbook built to strengthen identity and growth in Christ. Guided prompts, journaling space, and engaging activities for teens.",
        "list_price": 24.99,
        "sale_price": 21.99,
        "currency": "usd",
        "edition": "YE",
        "medium": "paperback",
        "preorder": True
    },
    
    # ==================== LUNCH WORKBOOKS (PRE-ORDER — $3 off until Pentecost) ====================
    "lunch_ie_paperback": {
        "name": "Lunch Instructor Edition (WBK) — Pre-Order",
        "sku": "LNCH-IE-PB",
        "stripe_id": "prod_Tl5bF463nMytFx",
        "description": "Instructor workbook built to provide kingdom relationship examples. Guided prompts, journaling space, and engaging activities designed for leading various types of groups.",
        "list_price": 29.99,
        "sale_price": 26.99,
        "currency": "usd",
        "edition": "IE",
        "medium": "paperback",
        "preorder": True
    },
    "lunch_ae_paperback": {
        "name": "Lunch Adult Edition (WBK) — Pre-Order",
        "sku": "LNCH-AE-PB",
        "stripe_id": "prod_Tl5dMEyGFDitEf",
        "description": "Adult workbook built to show Kingdom Relationship in the bible. Guided prompts, journaling space, and engaging activities designed for mature groups and family study.",
        "list_price": 27.99,
        "sale_price": 24.99,
        "currency": "usd",
        "edition": "AE",
        "medium": "paperback",
        "preorder": True
    },
    "lunch_ye_paperback": {
        "name": "Lunch Youth Edition (WBK) — Pre-Order",
        "sku": "LNCH-YE-PB",
        "stripe_id": "prod_Tl5hAx8RL8Vvjh",
        "description": "Youth workbook built to provide inspiring examples about Kingdom Relationships. Guided prompts, journaling space, and engaging activities designed for teens, youth groups, and family study.",
        "list_price": 24.99,
        "sale_price": 21.99,
        "currency": "usd",
        "edition": "YE",
        "medium": "paperback",
        "preorder": True
    },
    
    # ==================== HOLIDAY WORKBOOKS ====================
    "holiday_ie": {
        "name": "Holiday Instructor Edition (WBK)",
        "sku": "HOL-IE-WBK",
        "stripe_id": "prod_Tl6IOtuiMAgrwC",
        "description": "Instructor. Seasonal workbook exploring the 4Cs—Covenant, Cradle, Cross, and Comforter. Reflection space and group-friendly activities.",
        "list_price": 19.99,
        "sale_price": 19.99,
        "currency": "usd",
        "edition": "IE"
    },
    "holiday_ae": {
        "name": "Holiday Adult Edition (WBK)",
        "sku": "HOL-AE-WBK",
        "stripe_id": "prod_Tl6LmJkJxDrzLA",
        "description": "Adult. Seasonal workbook exploring the 4Cs—Covenant, Cradle, Cross, and Comforter. Reflection space and group-friendly activities.",
        "list_price": 16.99,
        "sale_price": 16.99,
        "currency": "usd",
        "edition": "AE"
    },
    "holiday_ye": {
        "name": "Holiday Youth Edition (WBK)",
        "sku": "HOL-YE-WBK",
        "stripe_id": "prod_Tl6WIl0O7XFFgg",
        "description": "Youth Edition. Seasonal workbook exploring the 4Cs—Covenant, Cradle, Cross, and Comforter. Reflection space and group-friendly activities.",
        "list_price": 16.99,
        "sale_price": 16.99,
        "currency": "usd",
        "edition": "YE"
    },
    
    # ==================== NIBBLES (SINGLE LESSONS) ====================
    "nibble_ae": {
        "name": "Break*fast Nibble AE",
        "sku": "BKFT-NIB-AE-DIG",
        "stripe_id": "prod_Tl6dXzvc89fzpU",
        "description": "Single lesson from the Foundation in Christ series. A great sampler with Journal-style space with reflective prompts and group-ready activities.",
        "list_price": 3.99,
        "sale_price": 3.99,
        "currency": "usd",
        "edition": "AE"
    },
    "nibble_ye": {
        "name": "Break*fast Nibble YE",
        "sku": "BKFT-NIB-YE-DIG",
        "stripe_id": "prod_Tl6hePoHzLo5pi",
        "description": "Single lesson from the Foundation in Christ series. A great sampler with Journal-style space with reflective prompts and group-ready activities for youth.",
        "list_price": 3.99,
        "sale_price": 3.99,
        "currency": "usd",
        "edition": "YE"
    },
    
    # ==================== GAME PASSES (20% OFF until Pentecost May 24, 2026 — no coupon needed) ====================
    "game_pass_30": {
        "name": "Digital Games Subscription (30-Day)",
        "sku": "GAMEPASS-30D",
        "stripe_id": "prod_Tl7ZEakAImOyVc",
        "description": "30-day access to SOFU game content (Jeopardy-style, group activities, and review challenges) for study groups and family nights.",
        "list_price": 7.99,
        "sale_price": 7.99,
        "currency": "usd",
        "promo_sale_price": 6.39,
        "promo_until": "2026-05-24"
    },
    "game_pass_90": {
        "name": "Game Pass (90-Day Access)",
        "sku": "GAMEPASS-90D",
        "stripe_id": "prod_Tl7mje38Mzyynu",
        "description": "90-day access to SOFU game content—best for churches, small groups, and quarterly study cycles.",
        "list_price": 24.99,
        "sale_price": 24.99,
        "currency": "usd",
        "promo_sale_price": 19.99,
        "promo_until": "2026-05-24"
    },
    
    # ==================== SUBSCRIPTIONS ====================
    "subscription_ye_monthly": {
        "name": "Digital Subscriber Youth (Monthly)",
        "sku": "SUB-DIG-YE-MO",
        "stripe_id": "prod_Tl7prlu7F5iyEO",
        "description": "Monthly membership for ongoing digital study support—includes subscriber-only content and access to game tools while active.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly"
    },
    "subscription_ae_monthly": {
        "name": "Digital Subscriber Adult (Monthly)",
        "sku": "SUB-DIG-AE-MO",
        "stripe_id": "prod_Tl7rxDr2e2mEJD",
        "description": "Monthly membership for ongoing digital study support—includes subscriber-only content and access to game tools while active.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly"
    },
    "subscription_annual": {
        "name": "Digital Subscriber (Annual)",
        "sku": "SUB-DIG-YR",
        "stripe_id": "prod_Tl7u6eq2D4eq2l",
        "description": "Annual membership (best value)—subscriber-only digital content plus game tools access while active.",
        "list_price": 99.00,
        "sale_price": 99.00,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "annual",
        "note": "Best value (2 months free)"
    },
    "subscription_group": {
        "name": "Ministry/Small Group (Monthly)",
        "sku": "SUB-GROUP-MO",
        "stripe_id": "prod_Tl7xoZNf3clBV7",
        "description": "Instructor Edition. Group plan for leaders—includes group-use game tools and leader resources to support one active study group.",
        "list_price": 24.99,
        "sale_price": 24.99,
        "currency": "usd",
        "type": "subscription",
        "billing_cycle": "monthly"
    },
    
    # ==================== PRODUCT BUNDLES ====================
    "holiday_table_bundle": {
        "name": "Holiday Table Bundle",
        "sku": "BUNDLE-HOL-TABLE",
        "stripe_id": "prod_bundle_hol_table",
        "description": "Holiday ePub + Break*fast Snack Pack Month 1 (Prayer). Get started with both series at a bundle discount!",
        "list_price": 23.98,
        "sale_price": 19.99,
        "currency": "usd",
        "is_bundle": True,
        "bundle_items": ["holiday_ae_digital", "breakfast_sp_prayer_ae"]
    },
    "full_table_experience": {
        "name": "Full Table Experience",
        "sku": "BUNDLE-FULL-TABLE",
        "stripe_id": "prod_bundle_full_table",
        "description": "Holiday ePub + Break*fast Snack Pack Month 1 + 90-Day Game Pass. The complete Soul Food experience!",
        "list_price": 43.97,
        "sale_price": 34.99,
        "currency": "usd",
        "is_bundle": True,
        "bundle_items": ["holiday_ae_digital", "breakfast_sp_prayer_ae", "game_pass_90"]
    },

    # ==================== MERCHANDISE ====================
    "pen_lighted": {
        "name": "SOFU Journal Pen - Lighted",
        "sku": "MERCH-PEN-LIT",
        "stripe_id": "prod_Tl7Opou94EsuJ5",
        "description": "Smooth-write pen for journaling and workbook activities—perfect companion for daily study and note-taking. Stylus with light.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd"
    },
    "pen_standard": {
        "name": "SOFU Journal Pen (Branded)",
        "sku": "MERCH-PEN-STD",
        "stripe_id": "prod_Tl7P1p5sTgCvlS",
        "description": "Smooth-write pen for journaling and workbook activities—perfect companion for daily study and note-taking.",
        "list_price": 7.99,
        "sale_price": 7.99,
        "currency": "usd"
    },
    "bookmarks_set": {
        "name": "Magnetic Bookmarks (Set of 3)",
        "sku": "MAG-BMK-3PK",
        "stripe_id": "prod_Tl7RVhKKT4hXht",
        "description": "Magnetic page markers to keep your place—durable, gift-able, and ideal for quick returns to key verses and activities.",
        "list_price": 6.99,
        "sale_price": 6.99,
        "currency": "usd"
    },
    "bookmark_leather": {
        "name": "Magnetic Leather Bookmarks",
        "sku": "MAG-LEA-BMK",
        "stripe_id": "prod_Tl7VKMwhaPnq8t",
        "description": "Magnetic page markers to keep your place—durable, giftable, and ideal for quick returns to key verses and activities.",
        "list_price": 4.99,
        "sale_price": 4.99,
        "currency": "usd"
    },
    "study_kit": {
        "name": "Study Kit Add-On (Pen + Bookmark Set)",
        "sku": "MERCH-STUDYKIT",
        "stripe_id": "prod_Tl7Xhx1eHZIomZ",
        "description": "Quick study add-on for your workbook—includes one journal pen plus a 3-pack of magnetic bookmarks.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd"
    },
    
    # ==================== FREE / BONUS LESSONS ====================
    "bonus_names_of_god": {
        "name": "Bonus Lessons: Names of God",
        "sku": "BONUS-NOG",
        "stripe_id": "prod_Tl7I5X9MoZQt1S",
        "description": "These lessons are great to help readers understand the attributes of God and the importance of how God has ordained seasons and times.",
        "list_price": 0.00,
        "sale_price": 0.00,
        "currency": "usd",
        "free": True
    },
    "bonus_times_seasons": {
        "name": "Bonus Lessons: Times and Seasons",
        "sku": "BONUS-TAS",
        "stripe_id": "prod_Tl7J55jWsk72EY",
        "description": "These lessons are great to help readers understand the attributes of God and the importance of how God has ordained seasons and times.",
        "list_price": 0.00,
        "sale_price": 0.00,
        "currency": "usd",
        "free": True
    },
    "bonus_in_his_image": {
        "name": "Bonus Lesson: In His Image",
        "sku": "BONUS-IHI",
        "stripe_id": "prod_Tl7LiH0xsvjnHp",
        "description": "With everything going on and the narrative of the world, it is important to know what God says about you and how he views you.",
        "list_price": 0.00,
        "sale_price": 0.00,
        "currency": "usd",
        "free": True
    },
    # Holiday Bonus Lessons - AE and YE are FREE, IE is PAID
    "bonus-ae-holiday": {
        "name": "Holiday Bonus Lessons (Adult Edition)",
        "sku": "BONUS-HOL-AE",
        "description": "Names of God & Times and Seasons bonus lessons for adults. FREE download.",
        "list_price": 0.00,
        "sale_price": 0.00,
        "currency": "usd",
        "edition": "AE",
        "free": True
    },
    "bonus-ye-holiday": {
        "name": "Holiday Bonus Lessons (Youth Edition)",
        "sku": "BONUS-HOL-YE",
        "description": "Names of God & Times and Seasons bonus lessons for youth. FREE download.",
        "list_price": 0.00,
        "sale_price": 0.00,
        "currency": "usd",
        "edition": "YE",
        "free": True
    },
    "bonus-ie-holiday": {
        "name": "Holiday Bonus Lessons (Instructor Edition)",
        "sku": "BONUS-HOL-IE",
        "description": "Names of God & Times and Seasons bonus lessons with game content for instructors.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "edition": "IE",
        "free": False
    },
    
    # ==================== ACHIEVEMENT MEDALLIONS ====================
    # GRinCH (Grid Iron Challenge) Medallions
    "medallion-grinch-ae": {
        "name": "GRinCH Champion Medallion (Adult)",
        "sku": "MEDAL-GRINCH-AE",
        "description": "Metal achievement medallion for GRinCH game champions. Adult Edition design.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "unit": "medallion",
        "edition": "AE",
        "physical": True
    },
    "medallion-grinch-ye": {
        "name": "GRinCH Champion Medallion (Youth)",
        "sku": "MEDAL-GRINCH-YE",
        "description": "Metal achievement medallion for GRinCH game champions. Youth Edition design.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "unit": "medallion",
        "edition": "YE",
        "physical": True
    },
    "medallion-grinch-ie": {
        "name": "GRinCH Iron vs Iron Medallion (Instructor)",
        "sku": "MEDAL-GRINCH-IE",
        "description": "Metal achievement medallion for outstanding instructors. Prov. 27:17 - Iron sharpens iron.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "unit": "medallion",
        "edition": "IE",
        "physical": True
    },
    # Passport Trek Medallions
    "medallion-passport-ae": {
        "name": "Passport Trek Medallion (Adult)",
        "sku": "MEDAL-PASSPORT-AE",
        "description": "Metal achievement medallion for completing the Passport Trek journey. Adult Edition design.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "unit": "medallion",
        "edition": "AE",
        "physical": True
    },
    "medallion-passport-ye": {
        "name": "Passport Trek Medallion (Youth)",
        "sku": "MEDAL-PASSPORT-YE",
        "description": "Metal achievement medallion for completing the Passport Trek journey. Youth Edition design.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "unit": "medallion",
        "edition": "YE",
        "physical": True
    },
    "medallion-passport-ie": {
        "name": "Passport Trek Medallion (Instructor)",
        "sku": "MEDAL-PASSPORT-IE",
        "description": "Metal achievement medallion for instructors who led groups through the full Passport Trek journey.",
        "list_price": 9.99,
        "sale_price": 9.99,
        "currency": "usd",
        "unit": "medallion",
        "edition": "IE",
        "physical": True
    },
    # Bulk Medallion Packs
    "medallion-teacher-pack": {
        "name": "Teacher Pack (3 Medallions)",
        "sku": "MEDAL-PACK-3",
        "description": "Pack of 3 medallions for classroom recognition. Mix and match any editions/games.",
        "list_price": 29.97,
        "sale_price": 24.99,
        "currency": "usd",
        "unit": "pack",
        "physical": True,
        "quantity": 3
    },
    "medallion-ministry-pack": {
        "name": "Ministry Pack (10 Medallions)",
        "sku": "MEDAL-PACK-10",
        "description": "Pack of 10 medallions for small group and ministry recognition. Mix and match any editions/games.",
        "list_price": 99.90,
        "sale_price": 69.99,
        "currency": "usd",
        "unit": "pack",
        "physical": True,
        "quantity": 10
    },
    "medallion-church-bundle": {
        "name": "Church Bundle (25 Medallions)",
        "sku": "MEDAL-PACK-25",
        "description": "Bundle of 25 medallions for church-wide recognition programs. Mix and match any editions/games.",
        "list_price": 249.75,
        "sale_price": 149.99,
        "currency": "usd",
        "unit": "bundle",
        "physical": True,
        "quantity": 25
    }
}

# Bulk discount coupon codes
BULK_COUPONS = {
    "BOOK10": {
        "name": "Book Club Special",
        "discount_percent": 10,
        "min_quantity": 5,
        "description": "10% off for book clubs (5+ items)"
    },
    "BULK15": {
        "name": "Small Bulk Order",
        "discount_percent": 15,
        "min_quantity": 10,
        "description": "15% off for bulk orders (10+ items)"
    },
    "MEGA30": {
        "name": "Mega Bulk Order",
        "discount_percent": 30,
        "min_quantity": 25,
        "description": "30% off for mega orders (25+ items)"
    }
}


@router.get("/catalog")
async def get_product_catalog():
    """Public endpoint: returns the full product catalog with current prices"""
    from datetime import date
    today = date.today().isoformat()
    catalog = []
    for pid, p in PRODUCTS.items():
        effective_price = p.get("sale_price", p.get("list_price", 0))
        promo_until = p.get("promo_until")
        if promo_until and today <= promo_until and p.get("promo_sale_price") is not None:
            effective_price = p["promo_sale_price"]
        catalog.append({
            "product_id": pid,
            "name": p.get("name", ""),
            "sku": p.get("sku", ""),
            "list_price": p.get("list_price", 0),
            "sale_price": p.get("sale_price", 0),
            "effective_price": effective_price,
            "promo_sale_price": p.get("promo_sale_price"),
            "promo_until": promo_until,
            "edition": p.get("edition", ""),
            "medium": p.get("medium", ""),
            "type": p.get("type", ""),
            "preorder": p.get("preorder", False),
            "free": p.get("free", False),
            "physical": p.get("physical", False),
            "is_bundle": p.get("is_bundle", False),
            "description": p.get("description", ""),
        })
    return {"products": catalog, "total": len(catalog)}


@router.get("/catalog/csv")
async def download_catalog_csv():
    """Download the product catalog as a CSV file"""
    import csv as csv_mod
    import io as io_mod
    from datetime import date
    today = date.today().isoformat()

    output = io_mod.StringIO()
    fields = ['product_id', 'name', 'sku', 'list_price', 'sale_price', 'effective_price',
              'promo_sale_price', 'promo_until', 'edition', 'medium', 'type',
              'preorder', 'free', 'physical', 'is_bundle']
    writer = csv_mod.DictWriter(output, fieldnames=fields)
    writer.writeheader()

    for pid, p in PRODUCTS.items():
        effective = p.get("sale_price", p.get("list_price", 0))
        promo_until = p.get("promo_until")
        if promo_until and today <= promo_until and p.get("promo_sale_price") is not None:
            effective = p["promo_sale_price"]
        writer.writerow({
            'product_id': pid,
            'name': p.get('name', ''),
            'sku': p.get('sku', ''),
            'list_price': p.get('list_price', ''),
            'sale_price': p.get('sale_price', ''),
            'effective_price': effective,
            'promo_sale_price': p.get('promo_sale_price', ''),
            'promo_until': promo_until or '',
            'edition': p.get('edition', ''),
            'medium': p.get('medium', ''),
            'type': p.get('type', ''),
            'preorder': p.get('preorder', False),
            'free': p.get('free', False),
            'physical': p.get('physical', False),
            'is_bundle': p.get('is_bundle', False),
        })

    csv_bytes = io_mod.BytesIO(output.getvalue().encode('utf-8'))
    return StreamingResponse(
        csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sofu_product_catalog.csv"}
    )


class CheckoutRequest(BaseModel):
    product_id: str
    quantity: int = 1
    origin_url: str


class StatusRequest(BaseModel):
    session_id: str


class FreeOrderItem(BaseModel):
    product_id: str
    name: str
    quantity: int
    price: float


class FreeOrderRequest(BaseModel):
    items: list[FreeOrderItem]
    coupon_code: str
    discount_percent: int
    customer_email: Optional[str] = None  # Optional email for order confirmation
    customer_name: Optional[str] = None


@router.post("/free-order")
async def process_free_order(request: FreeOrderRequest):
    """Process a free order (100% discount coupon)"""
    import uuid
    import secrets
    import string
    from download_protection import create_download_link
    from email_service import send_order_confirmation
    
    # Validate coupon
    if request.discount_percent != 100:
        raise HTTPException(status_code=400, detail="This endpoint is for free orders only (100% discount)")
    
    # Generate friendly order number: SF-2026-XXXXX
    year = datetime.utcnow().year
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('0', '').replace('O', '').replace('I', '').replace('L', '').replace('1', '')
    random_part = ''.join(secrets.choice(chars) for _ in range(5))
    order_number = f"SF-{year}-{random_part}"
    order_id = order_number  # Use order_number as order_id for consistency
    
    # Store the order
    order = {
        "order_id": order_id,
        "order_number": order_number,
        "items": [item.dict() for item in request.items],
        "coupon_code": request.coupon_code,
        "discount_percent": request.discount_percent,
        "total_amount": 0.00,
        "payment_status": "completed",
        "order_type": "free_beta",
        "customer_email": request.customer_email,
        "customer_name": request.customer_name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.orders.insert_one(order)
    
    # Create download links for digital products in the free order
    download_links = []
    user_email = request.customer_email or "guest@soulfood.com"
    for item in request.items:
        product_id = item.product_id
        # Try to get PDF path for this product
        pdf_path = await get_pdf_path_async(product_id)        
        if pdf_path:
            try:
                token, expires_at = await create_download_link(
                    order_id=order_id,
                    user_id=order_id,  # Use order_id as user_id for guests
                    user_email=user_email,
                    product_id=product_id,
                    product_name=item.name,
                    file_path=pdf_path,
                    payment_verified=True  # Free order is auto-verified
                )
                download_links.append({
                    "product_id": product_id,
                    "product_name": item.name,
                    "token": token,
                    "expires_at": expires_at.isoformat()
                })
                print(f"[Free Order] Download link created for {product_id}")
            except Exception as dl_error:
                print(f"[Free Order] Error creating download link for {product_id}: {dl_error}")
    
    # Send order confirmation email if customer email provided
    if request.customer_email:
        try:
            await send_order_confirmation(
                to_email=request.customer_email,
                order_id=order_id,
                items=[item.dict() for item in request.items],
                total=0.00,
                is_free_order=True,
                coupon_code=request.coupon_code,
                download_links=download_links,
                customer_name=request.customer_name or "Valued Customer"
            )
            print(f"[Free Order] Confirmation email sent to {request.customer_email}")
        except Exception as email_error:
            print(f"[Free Order] Email send failed: {email_error}")
    
    return {
        "success": True,
        "order_id": order_id,
        "message": "Free order processed successfully",
        "items": [item.dict() for item in request.items],
        "download_links": download_links
    }


class CartCheckoutRequest(BaseModel):
    items: list
    origin_url: str
    coupon_code: Optional[str] = None
    discount_percent: int = 0
    discount_dollars: float = 0
    override_total: Optional[float] = None
    is_gift: bool = False
    order_notes: Optional[str] = None
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    shipping_address: Optional[dict] = None


@router.post("/checkout/session")
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    """Create a Stripe checkout session for a product"""
    
    # Validate product exists
    if request.product_id not in PRODUCTS:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    # Get product details (always use sale price)
    product = PRODUCTS[request.product_id]
    amount = product["sale_price"] * request.quantity
    currency = product["currency"]
    
    # Get Stripe API key
    api_key = os.getenv('STRIPE_SECRET_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    # Initialize Stripe Checkout
    host_url = str(http_request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/payments/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    # Build success and cancel URLs
    origin_url = request.origin_url.rstrip('/')
    success_url = f"{origin_url}/payment-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{origin_url}/payment-cancel"
    
    # Create metadata
    metadata = {
        "product_id": request.product_id,
        "product_name": product["name"],
        "quantity": str(request.quantity),
        "source": "soul_food_web"
    }
    
    try:
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store pending transaction in database
        transaction = {
            "session_id": session.session_id,
            "product_id": request.product_id,
            "product_name": product["name"],
            "quantity": request.quantity,
            "amount": amount,
            "currency": currency,
            "payment_status": "pending",
            "status": "initiated",
            "metadata": metadata,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.payment_transactions.insert_one(transaction)
        
        return {
            "url": session.url,
            "session_id": session.session_id,
            "product": product["name"],
            "amount": amount
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/checkout/cart")
async def create_cart_checkout_session(request: CartCheckoutRequest, http_request: Request):
    """Create a Stripe checkout session for cart items (flexible product IDs)"""
    import stripe
    from jose import jwt, JWTError
    
    if not request.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # ============================================================
    # EXTRACT LOGGED-IN USER FROM JWT (account linking)
    # ============================================================
    logged_in_user_id = None
    logged_in_user_email = None
    auth_header = http_request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ", 1)[1]
        try:
            SECRET_KEY = os.getenv("JWT_SECRET_KEY", "soul-food-secret-key-change-in-production-2024")
            payload = jwt.decode(token_str, SECRET_KEY, algorithms=["HS256"])
            uid = payload.get("sub")
            if uid:
                user = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "email": 1})
                if user:
                    logged_in_user_id = user.get("id")
                    logged_in_user_email = user.get("email")
                    print(f"[Checkout] Authenticated user: {logged_in_user_id} ({logged_in_user_email})")
        except (JWTError, Exception) as e:
            print(f"[Checkout] JWT decode failed (guest checkout): {e}")
    
    # Resolve the customer email: prefer form input, fall back to logged-in user
    resolved_email = request.customer_email or logged_in_user_email
    
    # Get Stripe API key
    api_key = os.getenv('STRIPE_SECRET_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    stripe.api_key = api_key
    
    # Calculate total from cart items
    line_items = []
    total_amount = 0
    item_names = []
    
    for item in request.items:
        item_price = item.get('salePrice', item.get('price', 0))
        item_qty = item.get('quantity', 1)
        item_name = item.get('name', 'Soul Food Product')
        
        total_amount += item_price * item_qty
        item_names.append(f"{item_name} x{item_qty}")
    
    # Apply discount if coupon provided
    discount_multiplier = 1.0
    override_total_cents = None
    
    if request.override_total is not None and request.override_total > 0:
        # Override total: set the entire cart to this fixed amount
        override_total_cents = max(50, int(request.override_total * 100))  # min $0.50
    elif request.discount_percent > 0:
        discount_multiplier = (100 - request.discount_percent) / 100
        total_amount = total_amount * discount_multiplier
    elif request.discount_dollars > 0:
        total_amount = round(max(0.50, total_amount - request.discount_dollars), 2)
    
    # Build line items with discount applied to each item
    if override_total_cents:
        # For override_total: create a single line item with the override amount
        line_items.append({
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': f"Soul Food Order ({len(request.items)} items)" + (f" — Coupon: {request.coupon_code}" if request.coupon_code else ""),
                    'description': ', '.join(item_names)[:500],
                },
                'unit_amount': override_total_cents,
            },
            'quantity': 1,
        })
    else:
        for item in request.items:
            item_price = item.get('salePrice', item.get('price', 0))
            item_qty = item.get('quantity', 1)
            item_name = item.get('name', 'Soul Food Product')
            
            # Apply discount to item price
            discounted_price = item_price * discount_multiplier
            if request.discount_dollars > 0 and len(request.items) == 1:
                discounted_price = max(0.50, item_price - request.discount_dollars)
            
            # Add discount indicator to name if coupon applied
            display_name = item_name
            if request.discount_percent > 0:
                display_name = f"{item_name} ({request.discount_percent}% off)"
            elif request.discount_dollars > 0:
                display_name = f"{item_name} (${request.discount_dollars:.0f} off)"
            
            # Create line item for Stripe with discounted price
            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': display_name,
                        'description': item.get('description', 'Soul Food Digital Content'),
                    },
                    'unit_amount': max(1, int(discounted_price * 100)),  # Stripe uses cents, min 1 cent
                },
                'quantity': item_qty,
            })
    
    # Build URLs
    origin_url = request.origin_url.rstrip('/')
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment-cancel"
    
    # Calculate total and check Stripe minimum ($0.50)
    calculated_total = sum(item['price_data']['unit_amount'] * item['quantity'] for item in line_items)
    if calculated_total < 50:  # 50 cents minimum
        raise HTTPException(
            status_code=400,
            detail={
                "error": "amount_too_small",
                "message": f"Order total (${calculated_total/100:.2f}) is below Stripe's minimum of $0.50. Please add more items or use a smaller discount.",
                "minimum_required": 0.50,
                "current_total": calculated_total / 100
            }
        )
    
    try:
        # Build Stripe session kwargs
        session_kwargs = {
            'payment_method_types': ['card'],
            'line_items': line_items,
            'mode': 'payment',
            'success_url': success_url,
            'cancel_url': cancel_url,
            'metadata': {
                'source': 'soul_food_cart',
                'items': ', '.join(item_names)[:500],
                'coupon': request.coupon_code or '',
                'discount': str(request.discount_percent),
                'is_gift': 'true' if request.is_gift else 'false',
                'order_notes': (request.order_notes or '')[:500],
                'user_id': logged_in_user_id or '',
                'customer_email': resolved_email or '',
            }
        }
        # Pre-fill buyer email on the Stripe payment page
        if resolved_email:
            session_kwargs['customer_email'] = resolved_email

        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(**session_kwargs)
        
        # Generate friendly order number: SF-2026-XXXXX
        import secrets
        import string
        year = datetime.utcnow().year
        chars = string.ascii_uppercase + string.digits
        chars = chars.replace('0', '').replace('O', '').replace('I', '').replace('L', '').replace('1', '')
        random_part = ''.join(secrets.choice(chars) for _ in range(5))
        order_number = f"SF-{year}-{random_part}"
        
        # Actual charged amount (accounts for override)
        actual_amount = request.override_total if request.override_total is not None else total_amount
        
        # Normalize product IDs in stored items for reliable fulfillment
        stored_items = []
        for item in request.items:
            raw_id = item.get('product_id') or item.get('id') or item.get('uniqueKey', '')
            stored_items.append({
                "product_id": raw_id,
                "normalized_product_id": normalize_product_id(raw_id),
                "name": item.get('name', 'Soul Food Product'),
                "quantity": item.get('quantity', 1),
                "salePrice": item.get('salePrice', item.get('price', 0)),
            })
        
        # Store pending transaction with order number + account linking
        transaction = {
            "session_id": session.id,
            "order_number": order_number,
            "items": stored_items,
            "total_amount": actual_amount,
            "original_subtotal": sum(item.get('salePrice', item.get('price', 0)) * item.get('quantity', 1) for item in request.items),
            "currency": "usd",
            "payment_status": "pending",
            "status": "initiated",
            "coupon_code": request.coupon_code,
            "discount_percent": request.discount_percent,
            "discount_dollars": request.discount_dollars,
            "override_total": request.override_total,
            "is_gift": request.is_gift,
            "order_notes": request.order_notes,
            "customer_email": resolved_email,
            "customer_name": request.customer_name,
            "user_id": logged_in_user_id,
            "claimed_by_user_id": logged_in_user_id,
            "shipping_address": request.shipping_address,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.payment_transactions.insert_one(transaction)
        
        return {
            "url": session.url,
            "session_id": session.id,
            "order_number": order_number,
            "amount": actual_amount
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Check the status of a checkout session"""
    
    # Get Stripe API key
    api_key = os.getenv('STRIPE_SECRET_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    # Initialize Stripe Checkout
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    try:
        # Get checkout status from Stripe
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Find transaction in database
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Update transaction status if payment is complete and not already processed
        if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
            from download_protection import create_download_link
            
            # Get customer email and order info
            customer_email = transaction.get("customer_email", "")
            # Use stored user_id, never fall back to session_id
            user_id = transaction.get("user_id") or transaction.get("claimed_by_user_id") or ""
            order_number = transaction.get("order_number", session_id)
            
            await db.payment_transactions.update_one(
                {"session_id": session_id, "payment_status": {"$ne": "paid"}},  # Only update if not already paid
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": "completed",
                        "stripe_status": checkout_status.status,
                        "stripe_amount_total": checkout_status.amount_total,
                        "customer_email": customer_email or checkout_status.metadata.get("customer_email", ""),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Create download links for ALL items in the cart
            items = transaction.get("items", [])
            
            # If single product (old format), convert to items list  
            product_id = transaction.get("product_id")
            if product_id and not items:
                items = [{"product_id": product_id, "name": PRODUCTS.get(product_id, {}).get("name", product_id)}]
            
            download_links_created = []
            for item in items:
                item_product_id = item.get("normalized_product_id") or item.get("product_id") or item.get("id") or item.get("uniqueKey", "")
                item_name = item.get("name", item_product_id)
                
                # Check if this is a gift certificate item
                if item_product_id.startswith('gift_certificate_') or item.get("isGiftCertificate"):
                    # Process gift certificate
                    try:
                        metadata = item.get("metadata", {})
                        from routes.gift_certificate_routes import generate_certificate_code, CERTIFICATE_TYPES
                        from email_service import send_email, get_base_template, SUPPORT_EMAIL
                        
                        cert_type = metadata.get("certificateType", "book")
                        cert_config = CERTIFICATE_TYPES.get(cert_type, {"name": "Gift Certificate"})
                        cert_code = generate_certificate_code()
                        
                        # Ensure code is unique
                        while await db.gift_certificates.find_one({"code": cert_code}):
                            cert_code = generate_certificate_code()
                        
                        # Create the gift certificate
                        gift_cert = {
                            "code": cert_code,
                            "order_id": order_number,
                            "certificate_type": cert_type,
                            "certificate_name": cert_config.get("name", "Gift Certificate"),
                            "amount": metadata.get("amount", item.get("salePrice", 0)),
                            "balance": metadata.get("amount", item.get("salePrice", 0)),
                            "recipient_name": metadata.get("recipientName", ""),
                            "recipient_email": metadata.get("recipientEmail", ""),
                            "sender_name": metadata.get("senderName", ""),
                            "sender_email": metadata.get("senderEmail", ""),
                            "message": metadata.get("message", ""),
                            "status": "active",
                            "expires_at": datetime.utcnow() + timedelta(days=365),
                            "created_at": datetime.utcnow()
                        }
                        
                        await db.gift_certificates.insert_one(gift_cert)
                        
                        # Send email to recipient
                        FRONTEND_URL = os.environ.get('SITE_URL', os.environ.get('FRONTEND_URL', 'https://kingdom-soul.com'))
                        recipient_html = f"""
                        <div style="text-align: center; padding: 20px;">
                            <h2 style="color: #1f2937;">🎁 You've Received a Gift!</h2>
                            <p>From: <strong>{gift_cert['sender_name']}</strong></p>
                            <div style="background: linear-gradient(135deg, #fed7aa 0%, #fef3c7 100%); padding: 30px; border-radius: 12px; margin: 20px 0;">
                                <h3 style="color: #ea580c;">{cert_config.get('name', 'Gift Certificate')}</h3>
                                <p style="font-size: 36px; font-weight: bold; color: #c2410c;">${gift_cert['amount']:.2f}</p>
                            </div>
                            {f'<p style="font-style: italic;">"{gift_cert["message"]}"</p>' if gift_cert.get('message') else ''}
                            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">{cert_code}</p>
                            <p>Redeem at <a href="{FRONTEND_URL}/redeem-gift">{FRONTEND_URL}/redeem-gift</a></p>
                        </div>
                        """
                        
                        email_html = get_base_template(recipient_html, f"🎁 {gift_cert['sender_name']} sent you a Soul Food gift!")
                        
                        await send_email(
                            to=gift_cert["recipient_email"],
                            subject=f"🎁 {gift_cert['sender_name']} sent you a ${gift_cert['amount']:.2f} Soul Food Gift Certificate!",
                            html=email_html
                        )
                        
                        print(f"[Status Check] Gift certificate created and sent: {cert_code}")
                    except Exception as gc_error:
                        print(f"[Status Check] Error creating gift certificate: {gc_error}")
                    continue
                
                normalized_id = normalize_product_id(item_product_id)
                pdf_path = await get_pdf_path_async(normalized_id) or await get_pdf_path_async(item_product_id)
                
                if pdf_path:
                    try:
                        token, expires_at = await create_download_link(
                            order_id=order_number,
                            user_id=user_id,
                            user_email=customer_email or "no-email@placeholder.com",
                            product_id=normalized_id,
                            product_name=item_name,
                            file_path=pdf_path,
                            payment_verified=True
                        )
                        download_links_created.append({
                            "product_id": normalized_id,
                            "name": item_name,
                            "token": token
                        })
                        print(f"[Status Check] Download link created for {item_name} ({normalized_id})")
                    except Exception as dl_error:
                        print(f"[Status Check] Error creating download link for {item_name}: {dl_error}")
                else:
                    print(f"[Status Check] No PDF found for {item_name} ({normalized_id})")
            
            # Store download links info
            if download_links_created:
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"download_links_generated": True, "downloads_count": len(download_links_created)}}
                )
            
            # Send order confirmation email  
            if customer_email:
                try:
                    from email_service import send_order_confirmation, send_preorder_confirmation, send_game_pass_access
                    
                    # Classify items by type
                    has_preorder = any(item.get("preorder") or "Pre-Order" in item.get("name", "") or "preorder" in item.get("id", "").lower() for item in items)
                    has_game_pass = any("gaming-pass" in item.get("id", "").lower() or "game" in item.get("name", "").lower() for item in items)
                    customer_name = transaction.get("customer_name", "")
                    total = transaction.get("total_amount", 0)
                    
                    # Send order confirmation for digital items
                    await send_order_confirmation(
                        to_email=customer_email,
                        order_id=order_number,
                        items=items,
                        total=total,
                        download_links=[{"token": dl["token"], "product_name": dl["name"]} for dl in download_links_created] if download_links_created else None,
                        customer_name=customer_name
                    )
                    
                    # Send preorder confirmation if applicable
                    if has_preorder:
                        preorder_items = [i for i in items if i.get("preorder") or "Pre-Order" in i.get("name", "")]
                        try:
                            await send_preorder_confirmation(
                                to_email=customer_email,
                                order_id=order_number,
                                items=preorder_items,
                                total=total,
                                delivery_month="Spring 2026",
                                courtesy_links=[{"token": dl["token"], "product_name": dl["name"]} for dl in download_links_created[:2]] if download_links_created else None,
                                customer_name=customer_name
                            )
                        except Exception as pe:
                            print(f"[Status Check] Error sending preorder email: {pe}")
                    
                    # Send game pass email if applicable
                    if has_game_pass:
                        pass_type = "90-Day" if any("90" in i.get("name", "") for i in items if "game" in i.get("name", "").lower()) else "30-Day"
                        try:
                            await send_game_pass_access(
                                to_email=customer_email,
                                order_id=order_number,
                                pass_type=pass_type,
                                customer_name=customer_name
                            )
                        except Exception as ge:
                            print(f"[Status Check] Error sending game pass email: {ge}")
                    
                    print(f"[Status Check] Order confirmation email(s) sent to {customer_email}")
                except Exception as email_error:
                    print(f"[Status Check] Error sending email: {email_error}")
        
        elif checkout_status.status == "expired" and transaction["status"] != "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "status": "expired",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        return {
            "session_id": session_id,
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency,
            "metadata": checkout_status.metadata,
            "transaction": transaction
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check payment status: {str(e)}")


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    from download_protection import create_download_link
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("=== STRIPE WEBHOOK RECEIVED ===")
    print("=== STRIPE WEBHOOK RECEIVED ===")
    
    # Get Stripe API key and webhook secret
    api_key = os.getenv('STRIPE_SECRET_KEY')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    if not api_key:
        logger.error("Stripe API key not configured")
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    # Initialize Stripe Checkout with webhook secret for signature verification
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/payments/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_secret=webhook_secret, webhook_url=webhook_url)
    
    try:
        # Get request body and signature
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        logger.info(f"Webhook signature present: {bool(signature)}")
        print(f"Webhook signature present: {bool(signature)}")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Webhook event type: {webhook_response.event_type}")
        print(f"Webhook event type: {webhook_response.event_type}")
        
        # Process the webhook event
        if webhook_response.event_type == "checkout.session.completed":
            # Get session ID and find transaction
            session_id = webhook_response.session_id
            logger.info(f"Processing checkout.session.completed for session: {session_id}")
            print(f"Processing checkout.session.completed for session: {session_id}")
            
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            
            if transaction:
                logger.info(f"Found transaction for session {session_id}: order {transaction.get('order_number')}")
                print(f"Found transaction for session {session_id}: order {transaction.get('order_number')}")
                # Update transaction status
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {
                        "$set": {
                            "payment_status": "paid",
                            "status": "completed",
                            "webhook_processed": True,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                # Get customer email and user identity for fulfillment
                customer_email = transaction.get("customer_email") or webhook_response.metadata.get("customer_email", "")
                # User ID resolution: transaction record (set at checkout) > Stripe metadata > empty string
                # NEVER fall back to session_id — it is not a user identity
                user_id = transaction.get("user_id") or transaction.get("claimed_by_user_id") or webhook_response.metadata.get("user_id", "") or ""
                order_number = transaction.get("order_number", session_id)
                
                if user_id:
                    print(f"[Webhook] Fulfilling for authenticated user: {user_id}")
                else:
                    print(f"[Webhook] Guest purchase — no user_id, email: {customer_email}")
                
                # Create download links for ALL items in the cart
                items = transaction.get("items", [])
                
                # If single product (old format), convert to items list
                product_id = transaction.get("product_id")
                if product_id and not items:
                    items = [{"product_id": product_id, "name": PRODUCTS.get(product_id, {}).get("name", product_id)}]
                
                download_links_created = []
                for item in items:
                    # Prefer pre-normalized ID (set at checkout), fall back to raw + normalize
                    item_product_id = item.get("normalized_product_id") or item.get("product_id") or item.get("id") or item.get("uniqueKey", "")
                    item_name = item.get("name", item_product_id)
                    
                    normalized_id = normalize_product_id(item_product_id)
                    pdf_path = await get_pdf_path_async(normalized_id) or await get_pdf_path_async(item_product_id)
                    
                    if pdf_path:
                        try:
                            token, expires_at = await create_download_link(
                                order_id=order_number,
                                user_id=user_id,
                                user_email=customer_email or "no-email@placeholder.com",
                                product_id=normalized_id,
                                product_name=item_name,
                                file_path=pdf_path,
                                payment_verified=True
                            )
                            download_links_created.append({
                                "product_id": normalized_id,
                                "name": item_name,
                                "token": token
                            })
                            print(f"[Webhook] Download link created for {item_name} ({normalized_id})")
                        except Exception as dl_error:
                            print(f"[Webhook] Error creating download link for {item_name}: {dl_error}")
                    else:
                        print(f"[Webhook] No PDF found for {item_name} ({normalized_id})")
                
                # Store download links with the order
                if download_links_created:
                    await db.payment_transactions.update_one(
                        {"session_id": session_id},
                        {"$set": {"download_links_generated": True, "downloads_count": len(download_links_created)}}
                    )
                
                # Send order confirmation email
                if customer_email:
                    try:
                        from email_service import send_order_confirmation
                        
                        # Get customer phone from transaction
                        customer_phone = transaction.get("customer_phone", "")
                        
                        # Check for physical book purchases and generate audio codes
                        audio_codes_generated = []
                        for item in items:
                            item_product_id = item.get("product_id") or item.get("id") or item.get("uniqueKey", "")
                            # Check if this is a physical book (print version)
                            if "print" in item_product_id.lower() or item.get("format") == "print":
                                # Determine which series this belongs to
                                series_id = None
                                if "holiday" in item_product_id.lower():
                                    series_id = "holiday"
                                elif "breakfast" in item_product_id.lower():
                                    series_id = "breakfast"
                                elif "lunch" in item_product_id.lower():
                                    series_id = "lunch"
                                elif "dinner" in item_product_id.lower():
                                    series_id = "dinner"
                                elif "supper" in item_product_id.lower():
                                    series_id = "supper"
                                
                                # Determine edition from product ID
                                edition = "adult"
                                if "-ye-" in item_product_id.lower() or "youth" in item_product_id.lower():
                                    edition = "youth"
                                elif "-ie-" in item_product_id.lower() or "instructor" in item_product_id.lower():
                                    edition = "instructor"
                                
                                if series_id:
                                    try:
                                        # Import and call audio code generator
                                        from audio_routes import generate_audio_code, AUDIO_CONTENT
                                        
                                        # Only generate if series has audio content
                                        if series_id in AUDIO_CONTENT and AUDIO_CONTENT[series_id].get("lessons"):
                                            # Generate trackable code with new format
                                            code = generate_audio_code(
                                                series_id=series_id,
                                                edition=edition,
                                                lesson_number=0,  # 0 = full bundle
                                                phone=customer_phone
                                            )
                                            series_info = AUDIO_CONTENT[series_id]
                                            
                                            # Parse code for tracking
                                            code_parts = code.split("-")
                                            phone_part = code_parts[1] if len(code_parts) > 1 else ""
                                            
                                            # Store the code with tracking metadata
                                            code_record = {
                                                "code": code,
                                                "series_id": series_id,
                                                "series_name": series_info["name"],
                                                "order_id": order_number,
                                                "customer_email": customer_email.lower(),
                                                "customer_phone_last5": phone_part,
                                                "edition": edition,
                                                "lesson_number": 0,
                                                "is_physical_purchase": True,
                                                "lessons_included": [lesson["id"] for lesson in series_info["lessons"]],
                                                "redeemed": False,
                                                "redeemed_at": None,
                                                "redeemed_by_email": None,
                                                "created_at": datetime.utcnow().isoformat(),
                                                "expires_at": None
                                            }
                                            await db.audio_codes.insert_one(code_record)
                                            
                                            audio_codes_generated.append({
                                                "code": code,
                                                "series_name": series_info["name"],
                                                "series_id": series_id,
                                                "edition": edition
                                            })
                                            print(f"[Webhook] Audio code {code} generated for {series_info['name']} ({edition} edition)")
                                    except Exception as audio_error:
                                        print(f"[Webhook] Error generating audio code: {audio_error}")
                        
                        await send_order_confirmation(
                            to_email=customer_email,
                            order_id=order_number,
                            items=items,
                            total=transaction.get("total_amount", 0),
                            download_links=[{"token": dl["token"], "product_name": dl["name"]} for dl in download_links_created] if download_links_created else None,
                            customer_name=transaction.get("customer_name"),
                            audio_codes=audio_codes_generated if audio_codes_generated else None
                        )
                        print(f"[Webhook] Order confirmation email sent to {customer_email}")
                    except Exception as email_error:
                        print(f"[Webhook] Error sending email: {email_error}")
                
                # Award rewards points (1 point per $10 spent)
                try:
                    from auth_routes_v2 import award_rewards_points
                    total_spent = transaction.get("total_amount", 0)
                    points_awarded = await award_rewards_points(user_id, total_spent, order_number)
                    if points_awarded > 0:
                        print(f"[Webhook] Awarded {points_awarded} rewards points to {user_id}")
                except Exception as points_error:
                    print(f"[Webhook] Error awarding points: {points_error}")
            else:
                # Transaction not found - log this critical issue
                logger.error(f"CRITICAL: Transaction not found for session {session_id}")
                print(f"CRITICAL: Transaction not found for session {session_id}")
                # Still return success to prevent Stripe retries, but log the issue
        
        return {"status": "success", "event_type": webhook_response.event_type}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")


@router.get("/products")
async def get_products():
    """Get list of available products with pricing - applies time-limited promos"""
    from datetime import date
    today = date.today()
    
    products_with_promos = {}
    for key, product in PRODUCTS.items():
        p = dict(product)
        # Apply promo pricing if within promo window
        promo_until = p.get("promo_until")
        if promo_until and today <= date.fromisoformat(promo_until):
            p["original_sale_price"] = p["sale_price"]
            p["sale_price"] = p["promo_sale_price"]
            p["promo_active"] = True
        products_with_promos[key] = p
    
    return {"products": products_with_promos}


@router.get("/download-links/{order_id}")
async def get_download_links(order_id: str):
    """Get download links for an order - returns tokens for actual file downloads"""
    
    # Find download links for this order
    links = await db.download_links.find(
        {"order_id": order_id, "revoked": False},
        {"_id": 0, "token_hash": 0, "file_path": 0}  # Don't expose sensitive data
    ).to_list(100)
    
    if not links:
        # Try to find by session_id as well
        transaction = await db.payment_transactions.find_one({
            "$or": [
                {"order_number": order_id},
                {"session_id": order_id}
            ]
        })
        
        if transaction:
            order_number = transaction.get("order_number", order_id)
            links = await db.download_links.find(
                {"order_id": order_number, "revoked": False},
                {"_id": 0, "token_hash": 0, "file_path": 0}
            ).to_list(100)
    
    return {
        "order_id": order_id,
        "links": [{
            "product_id": link.get("product_id"),
            "product_name": link.get("product_name"),
            "token": link.get("token"),
            "download_count": link.get("download_count", 0),
            "max_downloads": link.get("max_downloads", 3),
            "expires_at": link.get("expires_at").isoformat() if link.get("expires_at") else None
        } for link in links],
        "count": len(links)
    }


@router.post("/admin/generate-downloads/{order_number}")
async def admin_generate_downloads(order_number: str, request: Request):
    """Admin endpoint to manually generate download links for an order"""
    from download_protection import create_download_link
    
    # Get items from request body
    try:
        body = await request.json()
        items = body.get("items", [])
        customer_email = body.get("customer_email", "admin@kingdom-soul.com")
    except Exception:
        items = []
        customer_email = "admin@kingdom-soul.com"
    
    if not items:
        return {"error": "No items provided. Send JSON body with 'items' array containing product_id and name for each item"}
    
    download_links_created = []
    
    for item in items:
        item_product_id = item.get("product_id", "")
        item_name = item.get("name", item_product_id)
        
        normalized_id = normalize_product_id(item_product_id)
        pdf_path = await get_pdf_path_async(normalized_id) or await get_pdf_path_async(item_product_id)
        
        if pdf_path:
            try:
                token, expires_at = await create_download_link(
                    order_id=order_number,
                    user_id=order_number,
                    user_email=customer_email,
                    product_id=normalized_id,
                    product_name=item_name,
                    file_path=pdf_path,
                    payment_verified=True
                )
                download_links_created.append({
                    "product_id": normalized_id,
                    "name": item_name,
                    "token": token,
                    "pdf_path": pdf_path
                })
                print(f"[Admin] Download link created for {item_name} ({normalized_id})")
            except Exception as dl_error:
                download_links_created.append({
                    "product_id": normalized_id,
                    "name": item_name,
                    "error": str(dl_error)
                })
        else:
            download_links_created.append({
                "product_id": item_product_id,
                "name": item_name,
                "error": f"No PDF found for product ID: {normalized_id}"
            })
    
    return {
        "order_number": order_number,
        "downloads_created": len([d for d in download_links_created if "token" in d]),
        "links": download_links_created
    }


@router.post("/notify-large-order")
async def notify_large_order(request: Request):
    """Send email notification for large print orders (>25 items)"""
    from email_service import send_bulk_order_notification
    
    try:
        data = await request.json()
        quantity = data.get('quantity', 0)
        product_name = data.get('product_name', 'Unknown')
        customer_email = data.get('customer_email', 'Not provided')
        selections = data.get('selections', {})
        bundle_type = data.get('bundle_type')
        total_price = data.get('total_price')
        
        if quantity >= 25:
            # Send email notification to support@kingdom-soul.com
            result = await send_bulk_order_notification(
                quantity=quantity,
                product_name=product_name,
                customer_email=customer_email,
                selections=selections,
                bundle_type=bundle_type,
                total_price=total_price
            )
            
            if result.get("success"):
                print(f"[BULK ORDER] Email sent to support for {quantity} items from {customer_email}")
            else:
                print(f"[BULK ORDER] Email failed: {result.get('error')}")
            
            return {
                "status": "success",
                "message": "Large order notification sent to support@kingdom-soul.com",
                "alert": "Orders over 25 items require manual review. We'll contact you within 24 hours."
            }
        
        return {"status": "ok", "message": "No alert needed"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/order/{order_id}")
async def get_order_details(order_id: str):
    """Get order details including download links for the confirmation page"""
    
    # First check orders collection
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if not order:
        # Also check payment_transactions for paid orders
        transaction = await db.payment_transactions.find_one(
            {"session_id": order_id},
            {"_id": 0}
        )
        if transaction:
            order = {
                "order_id": order_id,
                "items": transaction.get("items", []),
                "payment_status": transaction.get("payment_status", "unknown"),
                "order_type": "paid",
                "created_at": transaction.get("created_at")
            }
        else:
            raise HTTPException(status_code=404, detail="Order not found")
    
    # Get download links for this order
    download_links = await db.download_links.find(
        {"order_id": order_id, "revoked": False},
        {"_id": 0, "token_hash": 0}
    ).to_list(100)
    
    # Format download links for frontend
    formatted_links = []
    for link in download_links:
        formatted_links.append({
            "product_id": link.get("product_id"),
            "product_name": link.get("product_name"),
            "download_count": link.get("download_count", 0),
            "max_downloads": link.get("max_downloads", 3),
            "expires_at": link.get("expires_at").isoformat() if hasattr(link.get("expires_at"), 'isoformat') else str(link.get("expires_at", "")),
        })
    
    return {
        "order_id": order.get("order_id", order_id),
        "items": order.get("items", []),
        "payment_status": order.get("payment_status", "unknown"),
        "order_type": order.get("order_type", "unknown"),
        "coupon_code": order.get("coupon_code"),
        "discount_percent": order.get("discount_percent", 0),
        "download_links": formatted_links,
        "created_at": order.get("created_at").isoformat() if hasattr(order.get("created_at"), 'isoformat') else str(order.get("created_at", ""))
    }


@router.get("/order/{order_id}/downloads")
async def get_order_downloads(order_id: str):
    """Get download links for an order - returns tokens for actual file downloads"""
    
    # Verify order exists
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        transaction = await db.payment_transactions.find_one(
            {"session_id": order_id, "payment_status": "paid"},
            {"_id": 0}
        )
        if not transaction:
            raise HTTPException(status_code=404, detail="Order not found or not paid")
    
    # Get download links with tokens
    download_links = await db.download_links.find(
        {"order_id": order_id, "revoked": False},
        {"_id": 0}
    ).to_list(100)
    
    # Return links with tokens for downloading
    result = []
    for link in download_links:
        # We need to return the actual token for downloads
        # Note: For security, we generate new tokens or use the stored raw token
        result.append({
            "product_id": link.get("product_id"),
            "product_name": link.get("product_name"),
            "download_count": link.get("download_count", 0),
            "max_downloads": link.get("max_downloads", 3),
            "remaining": link.get("max_downloads", 3) - link.get("download_count", 0),
            "expires_at": link.get("expires_at").isoformat() if hasattr(link.get("expires_at"), 'isoformat') else str(link.get("expires_at", ""))
        })
    
    return {
        "order_id": order_id,
        "downloads": result
    }



@router.get("/my-purchases")
async def get_my_purchases(request: Request):
    """Get all purchases for the logged-in user"""
    from jose import jwt, JWTError
    
    # Get auth token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = auth_header.split(" ")[1]
    
    try:
        SECRET_KEY = os.getenv("JWT_SECRET_KEY", "soul-food-secret-key-change-in-production-2024")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        user_email = payload.get("email")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")
    
    # Get user by ID to find their email
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1})
    if user:
        user_email = user.get("email")
    
    # Find orders for this user (by user_id or email)
    query = {"payment_status": "paid"}
    if user_email:
        query["$or"] = [
            {"user_id": user_id},
            {"customer_email": user_email}
        ]
    else:
        query["user_id"] = user_id
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    
    # Also check payment_transactions
    transactions = await db.payment_transactions.find(
        {"payment_status": "paid", "$or": [{"user_id": user_id}, {"customer_email": user_email}] if user_email else {"user_id": user_id}},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    # Combine and format purchases
    purchases = []
    seen_orders = set()
    
    for order in orders:
        order_id = order.get("order_id")
        if order_id in seen_orders:
            continue
        seen_orders.add(order_id)
        
        for item in order.get("items", []):
            purchases.append({
                "order_id": order_id,
                "product_id": item.get("product_id") or item.get("id"),
                "product_name": item.get("name", "Soul Food Product"),
                "purchased_at": order.get("created_at"),
                "download_url": f"{os.getenv('REACT_APP_BACKEND_URL', '')}/api/payments/order/{order_id}/downloads" if order.get("has_digital") else None
            })
    
    for txn in transactions:
        order_id = txn.get("order_number") or txn.get("order_id") or txn.get("session_id")
        if order_id in seen_orders:
            continue
        seen_orders.add(order_id)
        
        # Get ALL download links for this order
        order_downloads = await db.download_links.find(
            {"order_id": order_id, "revoked": False},
            {"_id": 0, "token": 1, "product_name": 1, "product_id": 1}
        ).to_list(50)
        
        # Build a lookup by product name keywords
        download_tokens_by_name = {}
        for dl in order_downloads:
            download_tokens_by_name[dl.get("product_id", "")] = dl.get("token")
            download_tokens_by_name[dl.get("product_name", "")] = dl.get("token")
        
        for item in txn.get("items", []):
            item_product_id = item.get("product_id") or item.get("id") or item.get("uniqueKey", "")
            item_name = item.get("name", "Soul Food Product")
            
            # Try to find a matching download token
            download_token = None
            
            # 1. Direct match by product_id
            if item_product_id in download_tokens_by_name:
                download_token = download_tokens_by_name[item_product_id]
            
            # 2. Try normalized match
            if not download_token:
                normalized = normalize_product_id(item_product_id)
                if normalized in download_tokens_by_name:
                    download_token = download_tokens_by_name[normalized]
            
            # 3. Fuzzy match by name keywords
            if not download_token and order_downloads:
                item_lower = item_name.lower()
                for dl in order_downloads:
                    dl_name = (dl.get("product_name") or "").lower()
                    # Match if significant words overlap
                    item_words = set(w for w in item_lower.split() if len(w) > 3)
                    dl_words = set(w for w in dl_name.split() if len(w) > 3)
                    if item_words and dl_words and len(item_words & dl_words) >= 2:
                        download_token = dl.get("token")
                        break
            
            # 4. If only one download link for the order, just use it
            if not download_token and len(order_downloads) == 1:
                download_token = order_downloads[0].get("token")
            
            purchases.append({
                "order_id": order_id,
                "product_id": item_product_id,
                "product_name": item_name,
                "purchased_at": txn.get("created_at"),
                "download_url": f"/api/downloads/file/{download_token}" if download_token else None,
                "has_download": bool(download_token)
            })
    
    return {"purchases": purchases}
