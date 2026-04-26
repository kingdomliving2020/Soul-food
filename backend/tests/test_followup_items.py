"""Regression tests for follow-up items 2 (receipt itemization),
3 (expected delivery framing), and 4 (game pass cumulative runtime)."""
import sys
sys.path.insert(0, "/app/backend")

failures = 0
def expect(label, cond):
    global failures
    status = "PASS" if cond else "FAIL"
    if not cond:
        failures += 1
    print(f"  [{status}] {label}")
    return cond

# =============================================================================
# Item 2 — Receipt itemization (expand_items_for_receipt)
# =============================================================================
from payment_routes import (
    expand_items_for_receipt,
    expected_delivery_for,
    display_label_for,
    EXPECTED_DELIVERY_DEFAULT,
    _detect_game_pass_in_item,
)

print("\n=== Item 2: expand_items_for_receipt ===")
# Bundle gets expanded to its sub-deliverables
rows = expand_items_for_receipt([{"product_id": "starter-bundle-4cs-bkft-ae", "name": "Starter Bundle (AE)", "quantity": 1}])
expect("Starter AE bundle expands to 2 deliverables", len(rows) == 1 and len(rows[0]["deliverables"]) == 2)
expect("Bundle marked is_bundle=True", rows[0]["is_bundle"] is True)
expect("Both Starter AE sub-items deliverable", all(d["status"] == "deliverable" for d in rows[0]["deliverables"]))
labels = [d["label"] for d in rows[0]["deliverables"]]
expect(f"Label for holiday_ae correct (got: {labels[0]})", "Holiday 4C's — Adult Edition" == labels[0])
expect(f"Label for SP1 AE correct (got: {labels[1]})", "Break*fast — Month 1 Snack Pack (Adult Edition)" == labels[1])

# Bundle with a pending sub-item (AE-IE bundle: holiday_ie has file but breakfast IE SP1 doesn't exist; here test ye-ie which includes holiday_ie)
rows = expand_items_for_receipt([{"product_id": "starter-bundle-4cs-bkft-ye-ie", "name": "Starter Bundle (YE+IE)", "quantity": 1}])
deliverables = rows[0]["deliverables"]
expect("YE-IE bundle expands to 3 deliverables", len(deliverables) == 3)
ie_entry = next((d for d in deliverables if d["product_id"] == "holiday_ie"), None)
expect("holiday_ie entry exists", ie_entry is not None)
expect("holiday_ie status deliverable (file exists on disk)", ie_entry and ie_entry["status"] == "deliverable")

# Single gated item (full Breakfast) shows pending + expected_by
rows = expand_items_for_receipt([{"product_id": "breakfast_ae_digital", "name": "Full Breakfast AE"}])
expect("Full Breakfast AE single item: 1 deliverable row, status=pending",
       len(rows[0]["deliverables"]) == 1 and rows[0]["deliverables"][0]["status"] == "pending")
expect("expected_by populated for gated item",
       rows[0]["deliverables"][0]["expected_by"] == EXPECTED_DELIVERY_DEFAULT)

# Holiday nibble (gated, no substitution)
rows = expand_items_for_receipt([{"product_id": "holiday-nibble-ae-covenant-digital", "name": "Holiday Nibble Covenant"}])
expect("Holiday nibble gated → status=pending", rows[0]["deliverables"][0]["status"] == "pending")
expect("Holiday nibble expected_by populated", rows[0]["deliverables"][0]["expected_by"] == EXPECTED_DELIVERY_DEFAULT)

# =============================================================================
# Item 3 — Expected delivery framing
# =============================================================================
print("\n=== Item 3: expected_delivery_for() ===")
expect("holiday_ae deliverable → no expected_by string", expected_delivery_for("holiday_ae") == "")
expect("snack_pack_ae_m1 deliverable → no expected_by", expected_delivery_for("snack_pack_ae_m1") == "")
expect("breakfast_ae_digital gated → expected_by present", expected_delivery_for("breakfast_ae_digital") == EXPECTED_DELIVERY_DEFAULT)
expect("holiday-nibble-* gated → expected_by present", expected_delivery_for("holiday-nibble-ae-covenant-digital") == EXPECTED_DELIVERY_DEFAULT)

# =============================================================================
# Item 4 — Game pass detection
# =============================================================================
print("\n=== Item 4: _detect_game_pass_in_item() ===")
expect("game_pass_30 sku → (game_pass_30, 60, 30)",
       _detect_game_pass_in_item({"product_id": "game_pass_30"}) == ("game_pass_30", 60, 30))
expect("game_pass_90 sku → (game_pass_90, 180, 90)",
       _detect_game_pass_in_item({"product_id": "game_pass_90"}) == ("game_pass_90", 180, 90))
expect("'1-Hour Game Pass' name → (game_pass_30, 60, 30)",
       _detect_game_pass_in_item({"name": "1-Hour Game Pass"}) == ("game_pass_30", 60, 30))
expect("'3-Hour Game Pass' name → (game_pass_90, 180, 90)",
       _detect_game_pass_in_item({"name": "3-Hour Game Pass"}) == ("game_pass_90", 180, 90))
expect("'30-Day Game Pass' legacy name → (game_pass_30, 60, 30)",
       _detect_game_pass_in_item({"name": "Digital Games Subscription (30-Day)"}) == ("game_pass_30", 60, 30))
expect("'90-Day Game Pass' legacy name → (game_pass_90, 180, 90)",
       _detect_game_pass_in_item({"name": "Game Pass (90-Day Access)"}) == ("game_pass_90", 180, 90))
expect("Non-game item → None",
       _detect_game_pass_in_item({"product_id": "holiday_ae", "name": "Holiday AE"}) is None)

print("\n=== Item 4: GAMING_TIERS reflect cumulative model ===")
import gaming_session_manager as g
expect("game_pass_30 total_minutes=60", g.GAMING_TIERS["game_pass_30"]["total_minutes"] == 60)
expect("game_pass_90 total_minutes=180", g.GAMING_TIERS["game_pass_90"]["total_minutes"] == 180)
expect("game_pass_30 daily_limit_minutes=None", g.GAMING_TIERS["game_pass_30"]["daily_limit_minutes"] is None)
expect("game_pass_90 daily_limit_minutes=None", g.GAMING_TIERS["game_pass_90"]["daily_limit_minutes"] is None)
expect("game_pass_30 name='1-Hour Game Pass'", g.GAMING_TIERS["game_pass_30"]["name"] == "1-Hour Game Pass")
expect("game_pass_90 name='3-Hour Game Pass'", g.GAMING_TIERS["game_pass_90"]["name"] == "3-Hour Game Pass")
# free_beta retains daily 30-min limit (unchanged)
expect("free_beta daily_limit_minutes=30", g.GAMING_TIERS["free_beta"]["daily_limit_minutes"] == 30)
expect("ministry_group still has daily limit", g.GAMING_TIERS["ministry_group"]["daily_limit_minutes"] == 360)

# =============================================================================
# Helper functions exported
# =============================================================================
print("\n=== Helper exports ===")
expect("get_pass_minutes_remaining exists", hasattr(g, "get_pass_minutes_remaining"))
expect("deduct_pass_minutes exists", hasattr(g, "deduct_pass_minutes"))
import payment_routes as p
expect("_grant_game_pass_for_items exists", hasattr(p, "_grant_game_pass_for_items"))
expect("expand_items_for_receipt exists", hasattr(p, "expand_items_for_receipt"))
expect("expected_delivery_for exists", hasattr(p, "expected_delivery_for"))

print(f"\n=== {failures} failures ===")
sys.exit(1 if failures else 0)
