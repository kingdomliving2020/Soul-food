"""Launch validation: entitlement / library / buyer-vs-recipient accuracy.
Seeds VAL- transactions, hits the LIVE endpoints, asserts, cleans up.
Run: cd /app/backend && python3 -m scripts.validate_entitlements
"""
import os, sys, requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
API = "http://localhost:8001/api"
PREFIX = "VAL-"

BUYER = {"identifier": "qa_member@example.com", "password": "MemberTest123!"}
RECIP = {"email": "qa_recipient@example.com", "username": "qa_recipient",
         "password": "RecipTest123!", "name": "QA Recipient"}


def login(identifier, password):
    r = requests.post(f"{API}/auth/login", json={"identifier": identifier, "password": password})
    d = r.json()
    return d.get("access_token"), (d.get("user") or {})


def ensure_recipient():
    # register (ignore 'already exists'), then login
    requests.post(f"{API}/auth/register", json=RECIP)
    return login(RECIP["email"], RECIP["password"])


def seed(buyer_id, buyer_email, recip_email):
    db.payment_transactions.delete_many({"order_number": {"$regex": f"^{PREFIX}"}})
    now = datetime.now(timezone.utc)
    def base(n, **x):
        d = {"order_number": PREFIX+n, "order_id": PREFIX+n, "session_id": PREFIX+n,
             "customer_email": buyer_email, "customer_name": "QA Buyer", "user_id": buyer_id,
             "total_amount": 9.99, "payment_status": "paid", "status": "completed",
             "purchase_type": "self", "download_links_generated": True, "created_at": now,
             "items": [{"id": "holiday_ae", "name": "Holiday AE (ePub)", "format": "epub", "quantity": 1}]}
        d.update(x); return d
    docs = [
        base("SELF-DIGITAL"),
        base("SELF-REFUND", refund_status="refunded"),
        base("SELF-CANCEL", status="cancelled"),
        base("TEST", tag="test"),
        base("GIFT", purchase_type="gift", digital_recipient_email=recip_email),
    ]
    db.payment_transactions.insert_many(docs)
    # A real download link for the self order + the gift order (recipient's tokens)
    db.download_links.delete_many({"order_id": {"$regex": f"^{PREFIX}"}})
    db.download_links.insert_many([
        {"order_id": PREFIX+"SELF-DIGITAL", "product_id": "holiday_ae", "product_name": "Holiday AE",
         "token": "valtok-self", "revoked": False, "download_count": 0, "max_downloads": 3},
        {"order_id": PREFIX+"GIFT", "product_id": "holiday_ae", "product_name": "Holiday AE",
         "token": "valtok-gift", "revoked": False, "download_count": 0, "max_downloads": 3},
    ])


def lib_ids(token):
    r = requests.get(f"{API}/payments/my-purchases", headers={"Authorization": f"Bearer {token}"})
    return {p["order_id"] for p in r.json().get("purchases", [])}


def order_ids(token):
    r = requests.get(f"{API}/payments/my-orders", headers={"Authorization": f"Bearer {token}"})
    data = r.json()
    orders = data.get("orders") or data.get("items") or data
    ids = set()
    if isinstance(orders, list):
        for o in orders:
            ids.add(o.get("order_number") or o.get("order_id"))
    return ids


def dl(order):
    return requests.get(f"{API}/payments/download-links/{PREFIX}{order}").json()


def main():
    bt, bu = login(**BUYER)
    if not bt:
        print("BUYER LOGIN FAILED:", bu); sys.exit(1)
    rt, ru = ensure_recipient()
    buyer_email = bu.get("email"); recip_email = ru.get("email") or RECIP["email"]
    print(f"buyer={buyer_email} id={bu.get('id')}  recipient={recip_email}")
    seed(bu.get("id"), buyer_email, recip_email)

    blib = {o.replace(PREFIX, "") for o in lib_ids(bt) if o and o.startswith(PREFIX)}
    bord = {o.replace(PREFIX, "") for o in order_ids(bt) if o and str(o).startswith(PREFIX)}
    rlib = {o.replace(PREFIX, "") for o in lib_ids(rt) if o and o.startswith(PREFIX)}
    rord = {o.replace(PREFIX, "") for o in order_ids(rt) if o and str(o).startswith(PREFIX)}

    results = []
    def check(name, cond):
        results.append((name, cond)); print(("PASS " if cond else "FAIL ")+name)

    print("\n-- BUYER LIBRARY:", sorted(blib))
    check("buyer library has self-digital", "SELF-DIGITAL" in blib)
    check("buyer library EXCLUDES refunded", "SELF-REFUND" not in blib)
    check("buyer library EXCLUDES cancelled", "SELF-CANCEL" not in blib)
    check("buyer library EXCLUDES test-tagged", "TEST" not in blib)
    check("buyer library EXCLUDES gift-sent", "GIFT" not in blib)

    print("-- BUYER ORDER HISTORY:", sorted(bord))
    check("buyer history has self-digital", "SELF-DIGITAL" in bord)
    check("buyer history has refunded (record kept)", "SELF-REFUND" in bord)
    check("buyer history has gift-sent", "GIFT" in bord)
    check("buyer history EXCLUDES test-tagged", "TEST" not in bord)

    print("-- RECIPIENT LIBRARY:", sorted(rlib))
    check("recipient library HAS gift-received", "GIFT" in rlib)
    check("recipient library EXCLUDES buyer self order", "SELF-DIGITAL" not in rlib)

    print("-- RECIPIENT ORDER HISTORY:", sorted(rord))
    check("recipient history EXCLUDES received gift (lives in library)", "GIFT" not in rord)

    g = dl("GIFT"); s = dl("SELF-DIGITAL")
    print("-- DOWNLOAD-LINKS gift:", {k: g.get(k) for k in ("is_gift", "count", "recipient_email")})
    print("-- DOWNLOAD-LINKS self:", {k: s.get(k) for k in ("is_gift", "count")})
    check("gift download-links is_gift=True", g.get("is_gift") is True)
    check("gift download-links exposes NO tokens", g.get("count") == 0)
    check("gift download-links shows recipient", (g.get("recipient_email") or "").lower() == recip_email.lower())
    check("self download-links is_gift=False", s.get("is_gift") is False)
    check("self download-links returns token(s)", s.get("count", 0) >= 1)

    db.payment_transactions.delete_many({"order_number": {"$regex": f"^{PREFIX}"}})
    db.download_links.delete_many({"order_id": {"$regex": f"^{PREFIX}"}})
    print("\ncleaned up VAL- data")

    failed = [n for n, c in results if not c]
    print(f"\n==== {len(results)-len(failed)}/{len(results)} PASS ====")
    if failed:
        print("FAILURES:", failed); sys.exit(1)


if __name__ == "__main__":
    main()
