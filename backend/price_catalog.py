"""Server-authoritative price catalog (launch-critical revenue integrity).

Mirrors the frontend storefront pricing so the checkout can floor any
client-submitted price to the real catalog price. Source of truth =
frontend config (QuickOrder.js, CartContext.js, SmallGroupBundle.js) as of
July 2026. Snack packs / nibbles are already server-priced via the backend
PRODUCTS catalog and the interactive-lessons routes, so they are resolved by
payment_routes' PRODUCTS fallback, not here.

Rollout is two-phase (see payment_routes): phase 1 floors when resolved and
LOGS anything unresolved without blocking; phase 2 (PRICING_FAIL_CLOSED=true)
rejects any priced item that cannot be resolved.
"""

# ---- Flat cart-id -> effective (sale) price -------------------------------
FLAT_PRICES = {
    # Full Workbooks (Quick Order "workbooks" series — flat ids)
    "holiday-ae-digital": 9.99, "holiday-ae-paperback": 19.99,
    "holiday-ye-digital": 9.99, "holiday-ye-paperback": 19.99,
    "holiday-ie-digital": 34.99, "holiday-ie-paperback": 34.99,
    "breakfast-ae-digital": 14.99, "breakfast-ae-paperback": 29.99,
    "breakfast-ye-digital": 14.99, "breakfast-ye-paperback": 29.99,

    # eBook (ePub) full-workbook SKUs — direct exact-attachment cart ids
    # (deliver the real .epub, priced $1.50 under the Digital Workbook).
    "holiday-ae-full-epub": 9.99, "holiday-ye-full-epub": 9.99, "holiday-ie-full-epub": 33.49,
    "breakfast-ae-full-epub": 13.49, "breakfast-ye-full-epub": 13.49,
    "breakfast-meal-adult-physical": 29.99, "breakfast-meal-youth-physical": 29.99,

    # Instructor Edition packages
    "holiday-ie": 34.99, "breakfast-digital": 49.99,
    "breakfast-paperback": 49.99, "lunch-ie-preorder": 26.99,

    # In His Image booklets + AE-Pro variants
    "ihi-ae-booklet": 7.99, "ihi-ye-booklet": 7.99,
    "ihi-ae-pro-ipdf": 11.99, "ihi-ae-pro-epub": 10.49,
    "ihi-ae-pro-pod": 17.99, "ihi-ae-pro-bundle": 19.99,

    # Achievement Medallions
    "medallion-grinch-ae": 9.99, "medallion-grinch-ye": 9.99, "medallion-grinch-ie": 9.99,
    "medallion-passport-ae": 9.99, "medallion-passport-ye": 9.99, "medallion-passport-ie": 9.99,
    "medallion-teacher-pack": 24.99, "medallion-ministry-pack": 69.99, "medallion-church-bundle": 149.99,

    # Game / Day passes (access entitlements)
    "gaming-pass-30": 7.99, "gaming-pass-90": 75.00, "gaming_day_pass": 29.99,

    # Merchandise (base ids; a color suffix like "-black" is stripped in resolver)
    "study-kit": 9.99, "pen-lighted": 9.99, "pen-standard": 7.99,
    "bookmarks-set": 6.99, "bookmark-leather": 4.99,

    # Game Store (offline game content — base + expansions)
    "base-4cs": 19.99, "exp-foundation": 9.99, "exp-kingdom": 9.99,
    "game-grinch-bingo-base-4cs": 19.99, "game-passport-trek-base": 19.99, "game-bundle-bundle": 29.99,

    # Book Club per-set tiers (price is per set; qty = number of sets)
    "club-5": 64.95, "small-bulk": 62.95, "mega-bulk": 60.95,

    # Quick "Featured" bundles
    "holiday-table-bundle-ae": 19.99, "holiday-table-bundle-ye": 19.99,
    "full-table-experience-ae": 34.99, "full-table-experience-ye": 34.99,

    # Small Group Bundle tiers (flat per-bundle)
    "sgb-4": 44.0, "sgb-starter": 55.0, "sgb-small": 88.0, "sgb-medium": 132.0,

    # CartContext legacy lesson bundles
    "single_lesson": 1.99, "monthly_pack": 5.99, "mealtime_bundle": 12.99,
    "combo_bundle": 22.99, "instructor_set": 39.99,
}

# ---- Composite series pricing: series -> pkg -> edition -> format -> price -
# Composite cart ids are built as `{series}-{pkg}[-{month|lesson}]-{edition}-{format}`.
# Editions use full words (adult/youth/instructor); formats interactive/ipdf/epub/physical.
_ALL_FMT_399 = {"interactive": 3.99, "ipdf": 3.99, "epub": 3.99, "pdf": 3.99}
SERIES_PRICING = {
    "holiday": {
        "nibble": {"adult": dict(_ALL_FMT_399), "youth": dict(_ALL_FMT_399), "instructor": dict(_ALL_FMT_399)},
        "full": {
            "adult": {"physical": 19.99, "interactive": 9.99, "ipdf": 9.99, "epub": 8.49},
            "youth": {"physical": 19.99, "interactive": 9.99, "ipdf": 9.99, "epub": 8.49},
            "instructor": {"physical": 34.99, "interactive": 34.99, "ipdf": 34.99, "epub": 33.49},
        },
    },
    "breakfast": {
        "nibble": {"adult": dict(_ALL_FMT_399), "youth": dict(_ALL_FMT_399)},
        "snack": {"adult": {"interactive": 8.99, "ipdf": 8.99, "epub": 8.99},
                  "youth": {"interactive": 8.99, "ipdf": 8.99, "epub": 8.99}},
        "meal": {"adult": {"interactive": 14.99, "ipdf": 14.99, "epub": 13.49},
                 "youth": {"interactive": 14.99, "ipdf": 14.99, "epub": 13.49}},
    },
    "lunch": {
        "workbook": {"adult": {"physical": 24.99}, "youth": {"physical": 21.99},
                     "instructor": {"physical": 26.99}},
    },
    # Offline Game Master — flat per module/bundle regardless of edition/format ("all")
    "offline-game-master-bkft": {
        "bm1": 10.0, "bm2": 10.0, "bm3": 10.0, "bundle": 25.99,
    },
}

_EDITION_ALIAS = {"ae": "adult", "ye": "youth", "ie": "instructor",
                  "adult": "adult", "youth": "youth", "instructor": "instructor",
                  "pro": "pro", "all": "all"}
_FORMATS = {"interactive", "ipdf", "epub", "physical", "digital", "pdf", "ebook"}
_COLOR_SUFFIXES = {"black", "blue", "red", "green", "purple"}
_DYNAMIC_ALLOWED_TOKENS = ("gift-certificate", "gift_certificate")


def is_dynamic_allowed(item) -> bool:
    """Gift certificates carry a buyer-chosen amount — client price is legitimate."""
    blob = " ".join(str(item.get(k) or "") for k in ("id", "product_id", "uniqueKey", "sku", "name")).lower()
    if item.get("isGiftCertificate"):
        return True
    return any(tok in blob for tok in _DYNAMIC_ALLOWED_TOKENS)


def _candidate_ids(item):
    ids = []
    for k in ("product_id", "id", "uniqueKey", "sku"):
        v = str(item.get(k) or "").strip()
        if v:
            ids.append(v)
    return ids


def _composite_lookup(cid: str):
    for series, pkgs in SERIES_PRICING.items():
        if not cid.startswith(series + "-"):
            continue
        rest = cid[len(series) + 1:]
        tokens = rest.split("-")
        if len(tokens) < 2:
            # e.g. offline-game-master-bkft-bm1 has pkg as remainder w/ possible fmt
            pass
        pkg = tokens[0]
        pkg_val = pkgs.get(pkg)
        if pkg_val is None:
            continue
        # Flat per-pkg price (e.g. Game Master modules)
        if isinstance(pkg_val, (int, float)):
            return float(pkg_val)
        # edition/format matrix: edition + format are the final two tokens
        if len(tokens) >= 3:
            fmt = tokens[-1]
            ed = _EDITION_ALIAS.get(tokens[-2], tokens[-2])
            ed_map = pkg_val.get(ed)
            if ed_map and fmt in ed_map:
                return float(ed_map[fmt])
    return None


def catalog_price(item):
    """Authoritative effective price for a cart item, or None if unresolved."""
    ids = _candidate_ids(item)
    # 1. exact flat match
    for cid in ids:
        if cid in FLAT_PRICES:
            return float(FLAT_PRICES[cid])
    # 2. flat match after stripping a trailing color suffix (merch: pen-standard-black)
    for cid in ids:
        parts = cid.rsplit("-", 1)
        if len(parts) == 2 and parts[1] in _COLOR_SUFFIXES and parts[0] in FLAT_PRICES:
            return float(FLAT_PRICES[parts[0]])
    # 3. composite series lookup
    for cid in ids:
        p = _composite_lookup(cid)
        if p is not None:
            return p
    return None
