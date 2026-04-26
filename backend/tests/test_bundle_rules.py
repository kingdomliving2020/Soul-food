"""Smoke test for new bundle/fulfillment rules."""
import sys
sys.path.insert(0, "/app/backend")
from payment_routes import (
    resolve_item_to_file_entries,
    is_deliverable,
    BUNDLE_EXPANSIONS,
    PRODUCT_FILES,
)

def expect(label, cond):
    status = "PASS" if cond else "FAIL"
    print(f"  [{status}] {label}")
    return cond

print("\n=== A) Holiday — each edition delivers as separate file (no merge) ===")
all_ok = True
for ed_id, expect_file in [
    ("holiday_ae", "holiday-ae-full.pdf"),
    ("holiday_ye", "holiday-ye-full.pdf"),
    ("holiday_ie", "holiday-ie-full.pdf"),
]:
    ok, reason = is_deliverable(ed_id)
    all_ok &= expect(f"{ed_id} deliverable={ok} ({reason}); maps to {PRODUCT_FILES.get(ed_id)} (expected {expect_file})",
                    ok and PRODUCT_FILES.get(ed_id) == expect_file)

print("\n=== B) Full Breakfast (personal-study) is GATED ===")
for pid in ["breakfast_ae_digital", "breakfast_ye_digital", "breakfast_ie_digital",
            "breakfast-full-adult-digital", "breakfast-full-youth-print",
            "breakfast-full-instructor-epub"]:
    ok, reason = is_deliverable(pid)
    expect(f"{pid} → deliverable={ok} reason={reason} (expect gated)",
           not ok and "gated" in reason)

print("\n=== C) Holiday per-chapter nibbles do NOT substitute — GATED ===")
for pid in ["holiday-nibble-ae-covenant-digital", "holiday-nibble-ye-cradle-digital",
            "holiday-nibble-holiday-ae-cross-adult-interactive"]:
    ok, reason = is_deliverable(pid)
    expect(f"{pid} → deliverable={ok} reason={reason} (expect gated)",
           not ok and "gated" in reason)

print("\n=== D) Breakfast SP1/2/3 AE+YE deliverable; IE SP files don't exist → gated ===")
for pid, should_deliver in [
    ("breakfast-snack-month-1-adult-interactive", True),
    ("breakfast-snack-month-2-adult-interactive", True),
    ("breakfast-snack-month-3-adult-interactive", True),
    ("breakfast-snack-month-1-youth-interactive", True),
    ("breakfast-snack-month-2-youth-interactive", True),
    ("breakfast-snack-month-3-youth-interactive", True),
    ("snack_pack_ae_m1", True),
    ("snack_pack_ye_m1", True),
]:
    ok, reason = is_deliverable(pid)
    expect(f"{pid} → deliverable={ok} reason={reason} (expect={should_deliver})",
           ok == should_deliver)

print("\n=== E) Breakfast per-lesson nibbles deliverable when file exists ===")
for pid in ["breakfast-nibble-prayer-1-adult-interactive",
            "breakfast-nibble-through-2-youth-interactive",
            "breakfast-nibble-faith-4-adult-interactive"]:
    ok, reason = is_deliverable(pid)
    expect(f"{pid} → deliverable={ok} reason={reason} (expect deliverable)", ok)

print("\n=== F) Bundle expansions deliver only deliverable sub-items ===")
test_bundles = [
    ("starter-bundle-4cs-bkft-ae",    ["holiday_ae", "breakfast-snack-month-1-adult-interactive"]),
    ("starter-bundle-4cs-bkft-ye",    ["holiday_ye", "breakfast-snack-month-1-youth-interactive"]),
    ("starter-bundle-4cs-bkft-ae-ie", ["holiday_ae", "breakfast-snack-month-1-adult-interactive", "holiday_ie"]),
    ("starter-bundle-4cs-bkft-ye-ie", ["holiday_ye", "breakfast-snack-month-1-youth-interactive", "holiday_ie"]),
    ("holiday-table-bundle",          ["holiday_ae"]),
    ("holiday-table-bundle-ae",       ["holiday_ae", "breakfast-snack-month-1-adult-interactive"]),
    ("holiday-table-bundle-ye",       ["holiday_ye", "breakfast-snack-month-1-youth-interactive"]),
    ("full-table-experience-ae",      ["holiday_ae", "breakfast-snack-month-1-adult-interactive"]),
    ("full-table-experience-ye",      ["holiday_ye", "breakfast-snack-month-1-youth-interactive"]),
]
for bkey, expected in test_bundles:
    item = {"product_id": bkey, "name": f"Test bundle {bkey}"}
    entries = resolve_item_to_file_entries(item)
    got = [e["product_id"] for e in entries]
    expect(f"{bkey}: {got}", got == expected)

print("\n=== G) Existing simple purchases still work (regression check) ===")
for pid in ["holiday_ae", "snack_pack_ae_m1", "snack_pack_ye_m2",
            "breakfast-nibble-prayer-1-adult-interactive"]:
    item = {"product_id": pid, "name": pid}
    entries = resolve_item_to_file_entries(item)
    expect(f"single-item '{pid}' → {[e['product_id'] for e in entries]} (expect [{pid}])",
           len(entries) == 1 and entries[0]["product_id"] == pid)

print("\n=== H) Old/dropped bundle paths return [] cleanly (no crashes) ===")
for pid_dropped in ["breakfast_ae_digital", "holiday-nibble-ae-covenant-digital"]:
    item = {"product_id": pid_dropped, "name": pid_dropped}
    entries = resolve_item_to_file_entries(item)
    expect(f"gated '{pid_dropped}' → {entries} (expect [])", entries == [])

print("\n=== Done. ===")
