"""Regression guard for the June 2026 fulfillment-classification audit fixes.

Locks in:
  1. Hybrid bundles register BOTH physical + digital obligations (order can't
     close on digital delivery alone).
  2. Small Group / Book Club bundles expose a PHYSICAL lane (+ manual review).
  3. Quantity alone never forces manual review (pure-digital bulk stays auto).
  4. Merch / medallions with an 'IE' tag are NOT pulled into IE review.
"""
import routes.admin_routes as a


def _classify(items):
    hp = a._order_has_physical(items)
    hd = a._order_has_digital(items)
    mr = a._order_requires_manual_review(items, hp, hd)
    return hp, hd, mr


def test_digital_self_any_quantity_is_auto():
    for qty in (1, 8, 25):
        hp, hd, mr = _classify([{"product_id": "snack_pack_ae_m1", "format": "ipdf", "quantity": qty}])
        assert (hp, hd, mr) == (False, True, False), f"qty={qty}"


def test_physical_any_quantity_no_manual():
    hp, hd, mr = _classify([{"sku": "BKFT-AE-PB", "physical": True, "quantity": 20}])
    assert (hp, hd, mr) == (True, False, False)


def test_ie_curriculum_is_manual():
    hp, hd, mr = _classify([{"sku": "HOL-IE-WBK", "edition": "IE", "format": "digital", "quantity": 1}])
    assert mr is True


def test_ie_medallion_is_not_manual():
    hp, hd, mr = _classify([{"sku": "MEDAL-GRINCH-IE", "name": "GRinCH Iron vs Iron Medallion (Instructor)",
                             "edition": "IE", "physical": True, "quantity": 1}])
    assert (hp, hd, mr) == (True, False, False)


def test_hybrid_bundle_is_mixed_and_manual():
    hp, hd, mr = _classify([{"sku": "IHI-AE-PRO-BUNDLE", "physical": True,
                             "hybrid_fulfillment": True, "quantity": 1}])
    assert (hp, hd, mr) == (True, True, True)


def test_hybrid_not_complete_on_digital_alone():
    doc = {"payment_status": "paid", "download_links_generated": True,
           "items": [{"sku": "IHI-AE-PRO-BUNDLE", "physical": True, "hybrid_fulfillment": True, "quantity": 1}]}
    lc = a._compute_lifecycle(doc)
    assert lc["order_status"] == "open"
    doc2 = {**doc, "physical_fulfillment": "delivered", "manual_fulfillment_status": "fulfilled"}
    assert a._compute_lifecycle(doc2)["order_status"] == "complete"


def test_small_group_bundle_has_physical_lane_and_manual():
    items = [{"id": "sgb-4", "name": "Small Group Bundle — 1 IE + 4 Participant Seats",
              "isSmallGroupBundle": True, "metadata": {"medium": "bundle"}, "quantity": 1}]
    hp, hd, mr = _classify(items)
    assert hp is True and mr is True
    lc = a._compute_lifecycle({"payment_status": "paid", "items": items})
    assert lc["fulfillment"]["physical"]["applicable"] is True


def test_book_club_bundle_is_manual():
    hp, hd, mr = _classify([{"id": "club-5", "name": "Book Club (5-9 sets)", "quantity": 5}])
    assert mr is True
