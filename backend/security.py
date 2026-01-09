"""
Soul Food Security Module
=========================
Implements comprehensive security features:
- Login lockout with escalating timeouts
- Role-based lockout sensitivity
- Password reset rate limiting
- Secure reset tokens
- Audit logging
- Session security
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import hashlib
import secrets
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'soul_food_db')]

# =============================================================================
# SECURITY CONSTANTS
# =============================================================================

# Login lockout settings
LOGIN_ATTEMPT_WINDOW_MINUTES = 15  # Window to track failed attempts
BASE_LOCKOUT_MINUTES = 30  # Initial lockout duration
MAX_FAILED_ATTEMPTS = 5  # Attempts before lockout
LOCKOUT_ESCALATION_FACTOR = 2  # Each lockout doubles duration

# Password reset rate limits
RESET_REQUESTS_PER_HOUR_PER_EMAIL = 3
RESET_REQUESTS_PER_HOUR_PER_IP = 10
RESET_TOKEN_EXPIRY_MINUTES = 60  # 1 hour

# Session timeouts by role
SESSION_TIMEOUT_BY_ROLE = {
    "admin": 30,  # 30 min inactivity
    "instructor": 30,  # 30 min inactivity
    "student": 60,  # 60 min inactivity
    "adult": 60,  # 60 min inactivity
    "beta": 90,  # 90 min inactivity
    "default": 60
}

# High-security roles (stricter policies)
HIGH_SECURITY_ROLES = ["admin", "instructor"]

# =============================================================================
# AUDIT EVENT TYPES
# =============================================================================

class AuditEventType:
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOCKOUT_TRIGGERED = "lockout_triggered"
    LOCKOUT_EXPIRED = "lockout_expired"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET_COMPLETED = "password_reset_completed"
    PASSWORD_CHANGED = "password_changed"
    ROLE_CHANGED = "role_changed"
    ACCOUNT_DISABLED = "account_disabled"
    ACCOUNT_ENABLED = "account_enabled"
    SESSION_EXPIRED = "session_expired"
    ACCOUNT_CREATED = "account_created"
    INSTRUCTOR_INVITE_SENT = "instructor_invite_sent"
    INSTRUCTOR_INVITE_ACCEPTED = "instructor_invite_accepted"


# =============================================================================
# AUDIT LOGGING
# =============================================================================

async def log_audit_event(
    event_type: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[dict] = None,
    success: bool = True
):
    """
    Log a security audit event
    """
    event = {
        "id": secrets.token_hex(16),
        "event_type": event_type,
        "user_id": user_id,
        "user_email": user_email,
        "ip_address": ip_address,
        "details": details or {},
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.audit_logs.insert_one(event)
    
    # Print to console for debugging
    print(f"[AUDIT] {event_type} | User: {user_email or user_id} | IP: {ip_address} | Success: {success}")
    
    return event


# =============================================================================
# LOGIN LOCKOUT SYSTEM
# =============================================================================

async def get_failed_attempts_in_window(identifier: str, ip_address: str = None) -> int:
    """
    Get the number of failed login attempts within the tracking window
    """
    window_start = datetime.now(timezone.utc) - timedelta(minutes=LOGIN_ATTEMPT_WINDOW_MINUTES)
    
    # Count attempts by identifier (email/username)
    count = await db.login_attempts.count_documents({
        "identifier": identifier.lower(),
        "success": False,
        "timestamp": {"$gte": window_start}
    })
    
    return count


async def record_login_attempt(
    identifier: str,
    success: bool,
    ip_address: str,
    user_id: Optional[str] = None,
    role: Optional[str] = None
):
    """
    Record a login attempt for tracking and rate limiting
    """
    attempt = {
        "id": secrets.token_hex(16),
        "identifier": identifier.lower(),
        "user_id": user_id,
        "ip_address": ip_address,
        "success": success,
        "role": role,
        "timestamp": datetime.now(timezone.utc)
    }
    
    await db.login_attempts.insert_one(attempt)
    
    # Log to audit trail
    await log_audit_event(
        event_type=AuditEventType.LOGIN_SUCCESS if success else AuditEventType.LOGIN_FAILED,
        user_id=user_id,
        user_email=identifier,
        ip_address=ip_address,
        success=success
    )


async def check_lockout_status(identifier: str) -> Tuple[bool, int, str]:
    """
    Check if an account is locked out
    Returns: (is_locked, remaining_minutes, message)
    """
    # Find user to check role
    user = await db.users.find_one({
        "$or": [
            {"email": identifier.lower()},
            {"username": identifier.lower()}
        ]
    }, {"_id": 0})
    
    # Check for active lockout in lockouts collection
    lockout = await db.lockouts.find_one({
        "identifier": identifier.lower(),
        "locked_until": {"$gt": datetime.now(timezone.utc)}
    })
    
    if lockout:
        remaining = (lockout["locked_until"] - datetime.now(timezone.utc)).total_seconds() / 60
        return True, int(remaining), "Please try again later"
    
    # Count failed attempts in window
    failed_count = await get_failed_attempts_in_window(identifier)
    
    if failed_count >= MAX_FAILED_ATTEMPTS:
        # Calculate escalating lockout duration
        lockout_count = await db.lockouts.count_documents({
            "identifier": identifier.lower(),
            "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(hours=24)}
        })
        
        # Escalate lockout duration
        lockout_minutes = BASE_LOCKOUT_MINUTES * (LOCKOUT_ESCALATION_FACTOR ** lockout_count)
        locked_until = datetime.now(timezone.utc) + timedelta(minutes=lockout_minutes)
        
        # Create lockout record
        await db.lockouts.insert_one({
            "id": secrets.token_hex(16),
            "identifier": identifier.lower(),
            "user_id": user["id"] if user else None,
            "locked_until": locked_until,
            "lockout_count": lockout_count + 1,
            "lockout_minutes": lockout_minutes,
            "reason": "exceeded_failed_attempts",
            "created_at": datetime.now(timezone.utc)
        })
        
        # Log lockout event
        await log_audit_event(
            event_type=AuditEventType.LOCKOUT_TRIGGERED,
            user_id=user["id"] if user else None,
            user_email=identifier,
            details={
                "lockout_minutes": lockout_minutes,
                "lockout_count": lockout_count + 1,
                "failed_attempts": failed_count
            }
        )
        
        return True, lockout_minutes, "Please try again later"
    
    return False, 0, ""


async def clear_lockout(identifier: str):
    """
    Clear lockout and failed attempts for a user (after successful login or admin override)
    """
    await db.lockouts.delete_many({"identifier": identifier.lower()})
    
    # Also reset the failed attempts counter on the user record
    await db.users.update_one(
        {"$or": [{"email": identifier.lower()}, {"username": identifier.lower()}]},
        {"$set": {"failed_login_attempts": 0, "last_failed_login": None}}
    )


# =============================================================================
# PASSWORD RESET RATE LIMITING
# =============================================================================

async def check_reset_rate_limit(email: str, ip_address: str) -> Tuple[bool, str]:
    """
    Check if password reset request is within rate limits
    Returns: (is_allowed, message)
    """
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    
    # Check per-email limit
    email_count = await db.password_reset_requests.count_documents({
        "email": email.lower(),
        "timestamp": {"$gte": one_hour_ago}
    })
    
    if email_count >= RESET_REQUESTS_PER_HOUR_PER_EMAIL:
        return False, "Too many reset requests. Please wait before trying again."
    
    # Check per-IP limit
    ip_count = await db.password_reset_requests.count_documents({
        "ip_address": ip_address,
        "timestamp": {"$gte": one_hour_ago}
    })
    
    if ip_count >= RESET_REQUESTS_PER_HOUR_PER_IP:
        return False, "Too many reset requests from this location. Please wait."
    
    return True, ""


async def record_reset_request(email: str, ip_address: str):
    """
    Record a password reset request for rate limiting
    """
    await db.password_reset_requests.insert_one({
        "id": secrets.token_hex(16),
        "email": email.lower(),
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc)
    })


# =============================================================================
# SECURE PASSWORD RESET TOKENS
# =============================================================================

def generate_reset_token() -> str:
    """Generate a secure random reset token"""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()


async def create_reset_token(user_id: str, email: str) -> str:
    """
    Create a new password reset token
    - Single use
    - Expires in 60 minutes
    - Stored hashed
    """
    # Invalidate any existing tokens for this user
    await db.password_reset_tokens.update_many(
        {"user_id": user_id, "used": False},
        {"$set": {"used": True, "invalidated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Generate new token
    raw_token = generate_reset_token()
    token_hash = hash_token(raw_token)
    
    # Store hashed token
    await db.password_reset_tokens.insert_one({
        "id": secrets.token_hex(16),
        "user_id": user_id,
        "email": email.lower(),
        "token_hash": token_hash,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES),
        "used": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Return the raw token (to be sent via email)
    return raw_token


async def verify_reset_token(token: str) -> Tuple[bool, Optional[str], str]:
    """
    Verify a password reset token
    Returns: (is_valid, user_id, message)
    """
    token_hash = hash_token(token)
    
    # Find the token
    token_doc = await db.password_reset_tokens.find_one({
        "token_hash": token_hash
    })
    
    if not token_doc:
        return False, None, "Invalid reset link"
    
    # Check if already used
    if token_doc.get("used"):
        return False, None, "This reset link has already been used"
    
    # Check if expired
    if datetime.now(timezone.utc) > token_doc["expires_at"]:
        return False, None, "This reset link has expired"
    
    return True, token_doc["user_id"], ""


async def mark_token_used(token: str):
    """Mark a reset token as used"""
    token_hash = hash_token(token)
    await db.password_reset_tokens.update_one(
        {"token_hash": token_hash},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
    )


# =============================================================================
# SESSION MANAGEMENT
# =============================================================================

async def update_last_activity(user_id: str):
    """Update user's last activity timestamp"""
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"last_activity": datetime.now(timezone.utc).isoformat()}}
    )


async def check_session_timeout(user_id: str, role: str) -> Tuple[bool, str]:
    """
    Check if user's session has timed out due to inactivity
    Returns: (is_timed_out, message)
    """
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user:
        return True, "User not found"
    
    last_activity = user.get("last_activity")
    if not last_activity:
        return False, ""  # No activity recorded yet
    
    # Get timeout for this role
    timeout_minutes = SESSION_TIMEOUT_BY_ROLE.get(role, SESSION_TIMEOUT_BY_ROLE["default"])
    
    last_activity_dt = datetime.fromisoformat(last_activity)
    timeout_threshold = last_activity_dt + timedelta(minutes=timeout_minutes)
    
    if datetime.now(timezone.utc) > timeout_threshold:
        # Log session expiry
        await log_audit_event(
            event_type=AuditEventType.SESSION_EXPIRED,
            user_id=user_id,
            details={"timeout_minutes": timeout_minutes}
        )
        return True, f"Session expired due to {timeout_minutes} minutes of inactivity"
    
    return False, ""


def get_session_timeout_for_role(role: str) -> int:
    """Get the session timeout in minutes for a given role"""
    return SESSION_TIMEOUT_BY_ROLE.get(role, SESSION_TIMEOUT_BY_ROLE["default"])


# =============================================================================
# ADMIN ACCOUNT MANAGEMENT
# =============================================================================

async def disable_account(user_id: str, admin_id: str, reason: str = ""):
    """Disable a user account (admin function)"""
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "disabled": True,
            "disabled_at": datetime.now(timezone.utc).isoformat(),
            "disabled_by": admin_id,
            "disable_reason": reason
        }}
    )
    
    # Clear any active sessions
    await db.sessions.delete_many({"user_id": user_id})
    
    # Log the event
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    await log_audit_event(
        event_type=AuditEventType.ACCOUNT_DISABLED,
        user_id=user_id,
        user_email=user.get("email") if user else None,
        details={"admin_id": admin_id, "reason": reason}
    )


async def enable_account(user_id: str, admin_id: str):
    """Enable a disabled user account (admin function)"""
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "disabled": False,
            "enabled_at": datetime.now(timezone.utc).isoformat(),
            "enabled_by": admin_id
        },
        "$unset": {
            "disabled_at": "",
            "disabled_by": "",
            "disable_reason": ""
        }}
    )
    
    # Clear any lockouts
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user:
        await clear_lockout(user.get("email", ""))
    
    # Log the event
    await log_audit_event(
        event_type=AuditEventType.ACCOUNT_ENABLED,
        user_id=user_id,
        user_email=user.get("email") if user else None,
        details={"admin_id": admin_id}
    )


async def check_account_disabled(identifier: str) -> Tuple[bool, str]:
    """Check if an account is disabled"""
    user = await db.users.find_one({
        "$or": [
            {"email": identifier.lower()},
            {"username": identifier.lower()}
        ]
    }, {"_id": 0})
    
    if user and user.get("disabled"):
        return True, "Account is disabled. Please contact support."
    
    return False, ""


# =============================================================================
# INSTRUCTOR INVITE SYSTEM
# =============================================================================

async def create_instructor_invite(email: str, admin_id: str) -> str:
    """Create an instructor invite (admin only)"""
    invite_token = secrets.token_urlsafe(32)
    
    await db.instructor_invites.insert_one({
        "id": secrets.token_hex(16),
        "email": email.lower(),
        "token_hash": hash_token(invite_token),
        "created_by": admin_id,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "used": False
    })
    
    await log_audit_event(
        event_type=AuditEventType.INSTRUCTOR_INVITE_SENT,
        user_email=email,
        details={"admin_id": admin_id}
    )
    
    return invite_token


async def verify_instructor_invite(token: str, email: str) -> Tuple[bool, str]:
    """Verify an instructor invite token"""
    token_hash = hash_token(token)
    
    invite = await db.instructor_invites.find_one({
        "token_hash": token_hash,
        "email": email.lower()
    })
    
    if not invite:
        return False, "Invalid invite"
    
    if invite.get("used"):
        return False, "This invite has already been used"
    
    if datetime.now(timezone.utc) > invite["expires_at"]:
        return False, "This invite has expired"
    
    return True, ""


async def use_instructor_invite(token: str, user_id: str):
    """Mark an instructor invite as used and upgrade user role"""
    token_hash = hash_token(token)
    
    await db.instructor_invites.update_one(
        {"token_hash": token_hash},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat(), "used_by": user_id}}
    )
    
    # Upgrade user to instructor
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": "instructor", "access_level": "instructor"}}
    )
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    await log_audit_event(
        event_type=AuditEventType.INSTRUCTOR_INVITE_ACCEPTED,
        user_id=user_id,
        user_email=user.get("email") if user else None
    )
    
    await log_audit_event(
        event_type=AuditEventType.ROLE_CHANGED,
        user_id=user_id,
        user_email=user.get("email") if user else None,
        details={"old_role": "user", "new_role": "instructor"}
    )


# =============================================================================
# DATABASE INDEXES (run once on startup)
# =============================================================================

async def ensure_security_indexes():
    """Create necessary indexes for security collections"""
    # Login attempts - TTL index to auto-delete old records after 24 hours
    await db.login_attempts.create_index("timestamp", expireAfterSeconds=86400)
    await db.login_attempts.create_index("identifier")
    await db.login_attempts.create_index("ip_address")
    
    # Lockouts - TTL index
    await db.lockouts.create_index("locked_until", expireAfterSeconds=0)
    await db.lockouts.create_index("identifier")
    
    # Password reset requests - TTL index
    await db.password_reset_requests.create_index("timestamp", expireAfterSeconds=3600)
    
    # Password reset tokens - TTL index
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.password_reset_tokens.create_index("token_hash")
    
    # Audit logs - index for querying
    await db.audit_logs.create_index("timestamp")
    await db.audit_logs.create_index("event_type")
    await db.audit_logs.create_index("user_id")
    
    print("[Security] Database indexes created")
