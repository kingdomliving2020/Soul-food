"""Unit tests for _send_order_emails fail-safe orchestration (payment_routes).

Verifies:
  1. Buyer + recipient emails are sent INDEPENDENTLY — a failure in one never
     blocks the other.
  2. Per-email sent flags are persisted so unsent emails can be retried.
  3. only_unsent=True skips already-sent emails and re-attempts just the failed one.

Runs without Stripe / real Resend by monkeypatching email_service + the db.
"""
import asyncio
import types
import pytest

import payment_routes as pr


class _FakeUpdateResult:
    pass


class _FakeCollection:
    def __init__(self, store):
        self.store = store

    async def update_one(self, flt, update):
        self.store.update(update.get("$set", {}))
        return _FakeUpdateResult()

    async def find_one(self, flt, proj=None):
        return dict(self.store)


def _install_fake_db(monkeypatch, initial):
    store = dict(initial)
    fake_txns = _FakeCollection(store)
    fake_db = types.SimpleNamespace(payment_transactions=fake_txns)
    monkeypatch.setattr(pr, "db", fake_db)
    return store


def _install_email_stub(monkeypatch, fail_for=()):
    """Stub email_service.send_order_confirmation. `fail_for` = set of recipient
    emails that should raise on send (simulating a transient Resend failure)."""
    calls = []

    async def _stub(**kwargs):
        to = kwargs.get("to_email")
        calls.append(kwargs)
        if to in fail_for:
            raise RuntimeError(f"simulated send failure for {to}")

    import email_service
    monkeypatch.setattr(email_service, "send_order_confirmation", _stub)
    return calls


def _gift_txn():
    return {
        "session_id": "sess_test_1",
        "order_number": "SF-TEST-1",
        "customer_email": "buyer@example.com",
        "customer_name": "Buyer One",
        "purchase_type": "gift",
        "digital_recipient_email": "recipient@example.com",
        "items": [{"name": "4 C's Adult eBook", "id": "holiday-ae-full-epub"}],
        "total_amount": 8.49,
    }


def test_buyer_failure_does_not_block_recipient(monkeypatch):
    store = _install_fake_db(monkeypatch, _gift_txn())
    calls = _install_email_stub(monkeypatch, fail_for={"buyer@example.com"})

    res = asyncio.get_event_loop().run_until_complete(
        pr._send_order_emails(_gift_txn(), [{"token": "t1", "name": "eBook"}])
    )
    tos = [c["to_email"] for c in calls]
    assert "buyer@example.com" in tos and "recipient@example.com" in tos
    # Recipient still delivered even though buyer send raised
    assert res["recipient_email_sent"] is True
    assert res["buyer_email_sent"] is False
    assert store.get("recipient_email_sent") is True
    assert "buyer_email_error" in store


def test_recipient_failure_does_not_block_buyer(monkeypatch):
    store = _install_fake_db(monkeypatch, _gift_txn())
    calls = _install_email_stub(monkeypatch, fail_for={"recipient@example.com"})

    res = asyncio.get_event_loop().run_until_complete(
        pr._send_order_emails(_gift_txn(), [{"token": "t1", "name": "eBook"}])
    )
    assert res["buyer_email_sent"] is True
    assert res["recipient_email_sent"] is False
    assert store.get("buyer_email_sent") is True
    assert "recipient_email_error" in store


def test_retry_only_resends_unsent(monkeypatch):
    # Simulate a transaction where buyer already sent, recipient failed first time.
    txn = _gift_txn()
    txn["buyer_email_sent"] = True
    txn["recipient_email_sent"] = False
    store = _install_fake_db(monkeypatch, txn)
    calls = _install_email_stub(monkeypatch, fail_for=set())  # both succeed now

    res = asyncio.get_event_loop().run_until_complete(
        pr._send_order_emails(dict(txn), [{"token": "t1", "name": "eBook"}], only_unsent=True)
    )
    tos = [c["to_email"] for c in calls]
    # Buyer already sent → skipped; only recipient re-attempted
    assert tos == ["recipient@example.com"]
    assert res["recipient_email_sent"] is True
    assert store.get("recipient_email_sent") is True


def test_self_purchase_marks_recipient_satisfied(monkeypatch):
    txn = {
        "session_id": "sess_self",
        "order_number": "SF-SELF",
        "customer_email": "me@example.com",
        "customer_name": "Solo",
        "purchase_type": "self",
        "items": [{"name": "eBook"}],
        "total_amount": 8.49,
    }
    store = _install_fake_db(monkeypatch, txn)
    calls = _install_email_stub(monkeypatch, fail_for=set())

    res = asyncio.get_event_loop().run_until_complete(
        pr._send_order_emails(dict(txn), [{"token": "t1", "name": "eBook"}])
    )
    assert [c["to_email"] for c in calls] == ["me@example.com"]
    assert res["buyer_email_sent"] is True
    assert res["recipient_email_sent"] is True  # n/a for self → satisfied
