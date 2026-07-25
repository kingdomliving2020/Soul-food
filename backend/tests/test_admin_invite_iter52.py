"""
Backend tests for Admin Invite flow (iteration 52):
- POST /api/admin/users with no password => sends invite email, returns invite:true
- GET /api/admin/users?invite_pending=true filter
- POST /api/admin/users/{user_id}/resend-invite (success + 400 for already-accepted)
- POST /api/auth/reset-password with invite token => auto-login + clears invite_pending
"""
import os
import asyncio
import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://entitlement-hub-8.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "overflowharvest@gmail.com"
ADMIN_PASSWORD = "Admin123!"

INVITE_EMAIL = "delivered@resend.dev"
MANUAL_EMAIL = "qa_manual@resend.dev"

env = dotenv_values("/app/backend/.env")
mongo = MongoClient(env["MONGO_URL"])
db = mongo[env["DB_NAME"]]


def _cleanup():
    db.users.delete_many({"email": {"$in": [INVITE_EMAIL, MANUAL_EMAIL]}})
    db.password_reset_tokens.delete_many({"email": {"$in": [INVITE_EMAIL, MANUAL_EMAIL]}})


@pytest.fixture(scope="module", autouse=True)
def clean_before_after():
    _cleanup()
    yield
    _cleanup()


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD
    })
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def hdr(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Origin": BASE_URL}


class TestAdminInviteFlow:
    invited_user_id = None
    manual_user_id = None

    def test_1_create_invite_no_password(self, hdr):
        r = requests.post(f"{BASE_URL}/api/admin/users", headers=hdr, json={
            "email": INVITE_EMAIL, "name": "QA Invitee", "role": "instructor"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("invite") is True
        assert data.get("temporary_password") is None
        assert data.get("invite_email_sent") is True, f"expected invite_email_sent=true (Resend). Got: {data}"
        TestAdminInviteFlow.invited_user_id = data["id"]

        # Verify persistence
        u = db.users.find_one({"email": INVITE_EMAIL})
        assert u is not None
        assert u.get("invite_pending") is True
        assert u.get("invited_by_email") == ADMIN_EMAIL
        assert u.get("role") == "instructor"

        # Reset token exists w/ ~7-day expiry
        toks = list(db.password_reset_tokens.find({"user_id": u["id"]}))
        assert len(toks) >= 1

    def test_2_list_pending_invites(self, hdr):
        r = requests.get(f"{BASE_URL}/api/admin/users?invite_pending=true", headers=hdr)
        assert r.status_code == 200
        emails = [u["email"] for u in r.json().get("items", [])]
        assert INVITE_EMAIL in emails

    def test_3_resend_invite_pending(self, hdr):
        uid = TestAdminInviteFlow.invited_user_id
        assert uid
        r = requests.post(f"{BASE_URL}/api/admin/users/{uid}/resend-invite", headers=hdr)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert data.get("invite_email_sent") is True

    def test_4_accept_invite_via_reset_password(self, hdr):
        # Generate a token programmatically
        import sys
        sys.path.insert(0, "/app/backend")
        from security import create_reset_token

        u = db.users.find_one({"email": INVITE_EMAIL})
        assert u
        raw_token = asyncio.run(create_reset_token(u["id"], u["email"], expiry_minutes=10080))
        new_password = "AcceptedPass123!"
        r = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": raw_token, "new_password": new_password
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("access_token")
        # role preserved
        user_obj = data.get("user") or {}
        assert user_obj.get("role") == "instructor"

        # invite_pending cleared
        u2 = db.users.find_one({"email": INVITE_EMAIL})
        assert u2.get("invite_pending") is False

        # login with new password
        r2 = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": INVITE_EMAIL, "password": new_password
        })
        assert r2.status_code == 200, r2.text

    def test_5_resend_invite_after_accept_returns_400(self, hdr):
        uid = TestAdminInviteFlow.invited_user_id
        r = requests.post(f"{BASE_URL}/api/admin/users/{uid}/resend-invite", headers=hdr)
        assert r.status_code == 400, r.text
        assert "already accepted" in r.text.lower()

    def test_6_create_user_with_password_not_invite(self, hdr):
        r = requests.post(f"{BASE_URL}/api/admin/users", headers=hdr, json={
            "email": MANUAL_EMAIL, "name": "QA Manual", "role": "instructor",
            "password": "ManualPass123!"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("invite") is False
        assert data.get("temporary_password") == "ManualPass123!"
        TestAdminInviteFlow.manual_user_id = data["id"]

        u = db.users.find_one({"email": MANUAL_EMAIL})
        assert u.get("invite_pending") is False

        # Not in pending list
        r2 = requests.get(f"{BASE_URL}/api/admin/users?invite_pending=true", headers=hdr)
        emails = [u["email"] for u in r2.json().get("items", [])]
        assert MANUAL_EMAIL not in emails
