"""
Soul Food Authentication Routes - Enhanced with Google OAuth, 2FA & Rewards
============================================================================
- Username + Email + Password login
- Google OAuth (optional one-click signup/login)
- 2FA mandatory for instructors/admins (Email code or TOTP)
- Rewards points system (1pt per $10 spent)
- Session security with role-based timeouts
"""

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, validator
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import os
import uuid
import re
import httpx
import secrets
import pyotp
import qrcode
import io
import base64
from dotenv import load_dotenv

# Import security module
from security import (
    check_lockout_status, record_login_attempt, clear_lockout,
    check_reset_rate_limit, record_reset_request,
    create_reset_token, verify_reset_token, mark_token_used,
    update_last_activity, check_session_timeout, get_session_timeout_for_role,
    check_account_disabled, log_audit_event, AuditEventType,
    ensure_security_indexes
)

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "soul-food-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
PASSWORD_EXPIRY_DAYS = 120
SESSION_TIMEOUT_MINUTES = 60  # Default session timeout

# Database
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'soul_food_db')]

# Email service (Resend)
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@kingdom-soul.com")

# Emergent OAuth endpoint
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# Common passwords to reject
COMMON_PASSWORDS = {
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
    'dragon', 'letmein', 'welcome', 'admin123', 'login123', 'soulfood', 'jesus123'
}

# Roles requiring 2FA
ROLES_REQUIRING_2FA = ['instructor', 'instructor_tester', 'admin', 'owner']

# Beta users for testing
BETA_USERS = {
    "instructor": {
        "password": "test123",
        "role": "instructor_tester",
        "session_timeout_mins": 120,
        "access_level": "instructor",
        "restrictions": ["no_physical_merchandise", "digital_only"],
        "description": "Instructor Edition Access"
    },
    "youth": {
        "password": "test1234",
        "role": "youth_tester", 
        "session_timeout_mins": 90,
        "access_level": "youth",
        "restrictions": ["no_physical_merchandise", "digital_only"],
        "description": "Youth Edition Access"
    },
    "adult": {
        "password": "test12345",
        "role": "adult_tester",
        "session_timeout_mins": 90,
        "access_level": "adult",
        "restrictions": ["no_physical_merchandise", "digital_only"],
        "description": "Adult Edition Access"
    },
    "beta": {
        "password": "Beta1!2!3!",
        "role": "beta_tester",
        "session_timeout_mins": 90,
        "access_level": "beta",
        "restrictions": ["no_physical_merchandise", "limited_content"],
        "description": "Beta Preview Access"
    }
}

# =============================================================================
# Models
# =============================================================================

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    name: str
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower()

class UserLogin(BaseModel):
    identifier: str  # Email or username
    password: str

class BetaLogin(BaseModel):
    username: str
    password: str

class GoogleAuthCallback(BaseModel):
    session_id: str

class TwoFactorSetup(BaseModel):
    method: str  # 'email', 'totp'

class TwoFactorVerify(BaseModel):
    code: str
    user_id: Optional[str] = None

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# =============================================================================
# Helper Functions
# =============================================================================

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=60))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password meets requirements"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    if password.lower() in COMMON_PASSWORDS:
        return False, "Password is too common. Please choose a stronger password."
    
    criteria_met = 0
    if re.search(r'[A-Z]', password): criteria_met += 1
    if re.search(r'[a-z]', password): criteria_met += 1
    if re.search(r'\d', password): criteria_met += 1
    if re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]', password): criteria_met += 1
    
    if criteria_met < 3:
        return False, "Password must contain at least 3 of: uppercase, lowercase, number, special character"
    
    return True, "Password is strong"

def generate_2fa_code() -> str:
    """Generate a 6-digit 2FA code"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

async def send_2fa_email(email: str, code: str, name: str = "User"):
    """Send 2FA code via email"""
    if not RESEND_API_KEY:
        print(f"[DEV] 2FA code for {email}: {code}")
        return
    
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={
                    "from": FROM_EMAIL,
                    "to": [email],
                    "subject": "Soul Food - Your Verification Code",
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                        <h2 style="color: #6366f1;">🔐 Verification Code</h2>
                        <p>Hi {name},</p>
                        <p>Your Soul Food verification code is:</p>
                        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">{code}</span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
                        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                    </div>
                    """
                },
                timeout=10.0
            )
    except Exception as e:
        print(f"Error sending 2FA email: {e}")

def requires_2fa(role: str) -> bool:
    """Check if role requires 2FA"""
    return role in ROLES_REQUIRING_2FA

# =============================================================================
# Google OAuth Routes
# =============================================================================

@router.post("/google/callback")
async def google_auth_callback(data: GoogleAuthCallback, response: Response):
    """
    Process Google OAuth callback from Emergent Auth
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    """
    try:
        # Exchange session_id for user data from Emergent Auth
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": data.session_id},
                timeout=10.0
            )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session ID")
        
        google_user = auth_response.json()
        email = google_user.get("email", "").lower()
        name = google_user.get("name", "")
        picture = google_user.get("picture", "")
        session_token = google_user.get("session_token", "")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        now = datetime.now(timezone.utc)
        
        if existing_user:
            # Update existing user with Google link
            await db.users.update_one(
                {"email": email},
                {
                    "$set": {
                        "google_linked": True,
                        "google_picture": picture,
                        "last_login": now.isoformat(),
                        "updated_at": now.isoformat()
                    }
                }
            )
            user_id = existing_user["id"]
            role = existing_user.get("role", "member")
            access_level = existing_user.get("access_level", "free")
            user_name = existing_user.get("name", name)
            rewards_points = existing_user.get("rewards_points", 0)
            tfa_enabled = existing_user.get("tfa_enabled", False)
        else:
            # Create new user from Google
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            username = email.split("@")[0] + "_" + secrets.token_hex(4)
            
            new_user = {
                "id": user_id,
                "email": email,
                "username": username,
                "name": name,
                "google_linked": True,
                "google_picture": picture,
                "role": "member",
                "access_level": "free",
                "session_timeout_mins": SESSION_TIMEOUT_MINUTES,
                "restrictions": [],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
                "last_login": now.isoformat(),
                "rewards_points": 0,
                "tfa_enabled": False,
                "tfa_method": None,
                "subscription_status": "none"
            }
            await db.users.insert_one(new_user)
            role = "member"
            access_level = "free"
            user_name = name
            rewards_points = 0
            tfa_enabled = False
        
        # Store session
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": (now + timedelta(days=7)).isoformat(),
            "created_at": now.isoformat()
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        # Create JWT for API calls
        access_token = create_access_token(
            data={"sub": user_id, "role": role, "access_level": access_level},
            expires_delta=timedelta(days=7)
        )
        
        # Check if 2FA is required
        needs_2fa = requires_2fa(role) and not tfa_enabled
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": email,
                "name": user_name,
                "role": role,
                "access_level": access_level,
                "rewards_points": rewards_points,
                "google_linked": True,
                "tfa_enabled": tfa_enabled
            },
            "requires_2fa_setup": needs_2fa,
            "message": f"Welcome back, {user_name}!" if existing_user else f"Welcome to Soul Food, {user_name}!"
        }
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify Google auth: {str(e)}")

@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user from session cookie or Authorization header"""
    
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check session in database
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        # Try JWT decode as fallback
        try:
            payload = jwt.decode(session_token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password_history": 0})
            if user:
                return {
                    "id": user["id"],
                    "email": user.get("email"),
                    "name": user.get("name"),
                    "role": user.get("role", "member"),
                    "access_level": user.get("access_level", "free"),
                    "rewards_points": user.get("rewards_points", 0),
                    "tfa_enabled": user.get("tfa_enabled", False)
                }
        except JWTError:
            pass
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one(
        {"id": session["user_id"]},
        {"_id": 0, "password_hash": 0, "password_history": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "email": user.get("email"),
        "name": user.get("name"),
        "username": user.get("username"),
        "role": user.get("role", "member"),
        "access_level": user.get("access_level", "free"),
        "rewards_points": user.get("rewards_points", 0),
        "tfa_enabled": user.get("tfa_enabled", False),
        "google_linked": user.get("google_linked", False),
        "subscription_status": user.get("subscription_status", "none")
    }

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout user - clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    
    return {"message": "Logged out successfully"}

# =============================================================================
# 2FA Routes
# =============================================================================

@router.post("/2fa/setup")
async def setup_2fa(setup: TwoFactorSetup, request: Request):
    """Setup 2FA for user - mandatory for instructors/admins"""
    
    # Get current user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if setup.method == "email":
        # Generate and send code
        code = generate_2fa_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        await db.tfa_codes.insert_one({
            "user_id": user_id,
            "code": code,
            "method": "email",
            "expires_at": expires_at.isoformat(),
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        await send_2fa_email(user["email"], code, user.get("name", "User"))
        
        return {
            "method": "email",
            "message": "Verification code sent to your email",
            "expires_in_minutes": 10
        }
    
    elif setup.method == "totp":
        # Generate TOTP secret
        secret = pyotp.random_base32()
        
        # Store temporarily until verified
        await db.tfa_pending.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "totp_secret": secret,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        # Generate QR code
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user["email"],
            issuer_name="Soul Food"
        )
        
        # Create QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            "method": "totp",
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_base64}",
            "message": "Scan this QR code with your authenticator app"
        }
    
    else:
        raise HTTPException(status_code=400, detail="Invalid 2FA method. Use 'email' or 'totp'")

@router.post("/2fa/verify")
async def verify_2fa(verify: TwoFactorVerify, request: Request):
    """Verify 2FA code and enable 2FA for user"""
    
    # Get user from token or provided user_id
    user_id = verify.user_id
    if not user_id:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_id = payload.get("sub")
            except JWTError:
                pass
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    # Check for email code first
    code_doc = await db.tfa_codes.find_one({
        "user_id": user_id,
        "code": verify.code,
        "used": False
    }, {"_id": 0})
    
    if code_doc:
        # Verify expiry
        expires_at = datetime.fromisoformat(code_doc["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Code expired")
        
        # Mark code as used
        await db.tfa_codes.update_one(
            {"user_id": user_id, "code": verify.code},
            {"$set": {"used": True}}
        )
        
        # Enable 2FA for user
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"tfa_enabled": True, "tfa_method": "email"}}
        )
        
        return {"verified": True, "method": "email", "message": "2FA enabled successfully"}
    
    # Check for TOTP
    pending = await db.tfa_pending.find_one({"user_id": user_id}, {"_id": 0})
    if pending and pending.get("totp_secret"):
        totp = pyotp.TOTP(pending["totp_secret"])
        if totp.verify(verify.code):
            # Enable TOTP 2FA
            await db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "tfa_enabled": True,
                    "tfa_method": "totp",
                    "totp_secret": pending["totp_secret"]
                }}
            )
            
            # Clean up pending
            await db.tfa_pending.delete_one({"user_id": user_id})
            
            return {"verified": True, "method": "totp", "message": "Authenticator app enabled successfully"}
    
    raise HTTPException(status_code=400, detail="Invalid verification code")

@router.post("/2fa/send-code")
async def send_2fa_code(request: Request):
    """Send 2FA code for login verification"""
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate and send code
    code = generate_2fa_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await db.tfa_codes.insert_one({
        "user_id": user_id,
        "code": code,
        "method": "email",
        "expires_at": expires_at.isoformat(),
        "used": False,
        "purpose": "login",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await send_2fa_email(user["email"], code, user.get("name", "User"))
    
    return {"message": "Verification code sent", "expires_in_minutes": 10}

class TwoFactorResend(BaseModel):
    user_id: str

@router.post("/2fa/resend")
async def resend_2fa_code(data: TwoFactorResend):
    """Resend 2FA verification code during login"""
    
    user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate and send new code
    code = generate_2fa_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Remove any existing pending codes for this user
    await db.tfa_codes.delete_many({"user_id": data.user_id, "purpose": "login"})
    
    await db.tfa_codes.insert_one({
        "user_id": data.user_id,
        "code": code,
        "method": "email",
        "expires_at": expires_at.isoformat(),
        "used": False,
        "purpose": "login",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await send_2fa_email(user["email"], code, user.get("name", "User"))
    
    return {"message": "New verification code sent to your email", "expires_in_minutes": 10}

# =============================================================================
# Rewards Points Routes
# =============================================================================

@router.get("/rewards/balance")
async def get_rewards_balance(request: Request):
    """Get user's rewards points balance"""
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "rewards_points": 1, "name": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    points = user.get("rewards_points", 0)
    
    # Calculate available rewards
    # Example: 100 points = $5 off, 200 points = $10 off
    available_rewards = []
    if points >= 50:
        available_rewards.append({"points": 50, "discount": 2.50, "description": "$2.50 off"})
    if points >= 100:
        available_rewards.append({"points": 100, "discount": 5.00, "description": "$5.00 off"})
    if points >= 200:
        available_rewards.append({"points": 200, "discount": 12.00, "description": "$12.00 off (Best Value!)"})
    
    return {
        "points": points,
        "points_value": points * 0.05,  # $0.05 per point
        "available_rewards": available_rewards,
        "earn_rate": "1 point per $10 spent"
    }

@router.post("/rewards/redeem")
async def redeem_rewards(points_to_redeem: int, request: Request):
    """Redeem rewards points for discount"""
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_points = user.get("rewards_points", 0)
    
    if points_to_redeem > current_points:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    if points_to_redeem < 50:
        raise HTTPException(status_code=400, detail="Minimum 50 points required to redeem")
    
    # Calculate discount
    discount = points_to_redeem * 0.05  # $0.05 per point
    
    # Create discount code
    discount_code = f"REWARD-{secrets.token_hex(6).upper()}"
    
    await db.discount_codes.insert_one({
        "code": discount_code,
        "amount_dollars": discount,
        "user_id": user_id,
        "source": "rewards_redemption",
        "points_redeemed": points_to_redeem,
        "status": "active",
        "max_uses": 1,
        "times_used": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "valid_until": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    })
    
    # Deduct points
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"rewards_points": -points_to_redeem}}
    )
    
    # Log redemption
    await db.rewards_history.insert_one({
        "user_id": user_id,
        "type": "redemption",
        "points": -points_to_redeem,
        "discount_code": discount_code,
        "discount_amount": discount,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "discount_code": discount_code,
        "discount_amount": discount,
        "points_redeemed": points_to_redeem,
        "remaining_points": current_points - points_to_redeem,
        "valid_for_days": 30
    }

@router.get("/rewards/history")
async def get_rewards_history(request: Request):
    """Get user's rewards points history"""
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    history = await db.rewards_history.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {"history": history}

# =============================================================================
# Standard Auth Routes (Username/Password)
# =============================================================================

@router.post("/register")
async def register(user_data: UserRegister):
    """Register a new user with username and email"""
    
    # Validate password strength
    is_valid, message = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    # Check if email already exists
    existing_email = await db.users.find_one({"email": user_data.email.lower()})
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username.lower()})
    if existing_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    password_hash = get_password_hash(user_data.password)
    
    user = {
        "id": user_id,
        "email": user_data.email.lower(),
        "username": user_data.username.lower(),
        "password_hash": password_hash,
        "password_history": [password_hash],
        "password_changed_at": now.isoformat(),
        "name": user_data.name,
        "role": "member",
        "access_level": "free",
        "session_timeout_mins": SESSION_TIMEOUT_MINUTES,
        "restrictions": [],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "last_login": now.isoformat(),
        "failed_login_attempts": 0,
        "last_failed_login": None,
        "subscription_status": "none",
        "rewards_points": 0,
        "tfa_enabled": False,
        "tfa_method": None
    }
    
    await db.users.insert_one(user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_id, "role": "member", "access_level": "free"},
        expires_delta=timedelta(minutes=SESSION_TIMEOUT_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user["email"],
            "username": user["username"],
            "name": user["name"],
            "role": "member",
            "access_level": "free",
            "rewards_points": 0,
            "tfa_enabled": False
        },
        "session_config": {
            "timeout_mins": SESSION_TIMEOUT_MINUTES,
            "message": f"Welcome to Soul Food, {user_data.name}!"
        }
    }

@router.post("/login")
async def login(credentials: UserLogin, request: Request):
    """Login with username/email and password"""
    
    identifier = credentials.identifier.lower()
    ip_address = request.client.host if request.client else "unknown"
    
    # Check lockout
    is_locked, remaining_mins, lockout_msg = await check_lockout_status(identifier)
    if is_locked:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=lockout_msg)
    
    # Find user by email or username
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"username": identifier}
        ]
    }, {"_id": 0})
    
    if not user:
        await record_login_attempt(identifier, False, ip_address)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(credentials.password, user.get("password_hash", "")):
        await record_login_attempt(identifier, False, ip_address, user["id"], user.get("role"))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Successful login
    await clear_lockout(identifier)
    await record_login_attempt(identifier, True, ip_address, user["id"], user.get("role"))
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Check if 2FA is required
    role = user.get("role", "member")
    tfa_enabled = user.get("tfa_enabled", False)
    needs_2fa = requires_2fa(role)
    
    # Create access token
    session_timeout = user.get("session_timeout_mins", SESSION_TIMEOUT_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"], "role": role, "access_level": user.get("access_level", "free")},
        expires_delta=timedelta(minutes=session_timeout)
    )
    
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user.get("email"),
            "username": user.get("username"),
            "name": user.get("name"),
            "role": role,
            "access_level": user.get("access_level", "free"),
            "rewards_points": user.get("rewards_points", 0),
            "tfa_enabled": tfa_enabled
        }
    }
    
    # If 2FA required but not set up, flag it
    if needs_2fa and not tfa_enabled:
        response_data["requires_2fa_setup"] = True
        response_data["message"] = "Please set up 2-factor authentication to continue"
    elif needs_2fa and tfa_enabled:
        response_data["requires_2fa_verification"] = True
        response_data["message"] = "Please verify with your 2FA code"
    else:
        response_data["message"] = f"Welcome back, {user.get('name', 'User')}!"
    
    return response_data

@router.post("/beta-login")
async def beta_login(credentials: BetaLogin):
    """Login with beta test credentials"""
    
    username = credentials.username.lower()
    
    if username not in BETA_USERS:
        valid_usernames = list(BETA_USERS.keys())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid beta username. Valid: {valid_usernames}"
        )
    
    beta_user = BETA_USERS[username]
    
    if credentials.password != beta_user["password"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
    
    # Create session
    user_id = f"beta-{username}-{uuid.uuid4().hex[:8]}"
    session_timeout = beta_user.get("session_timeout_mins", 90)
    
    access_token = create_access_token(
        data={
            "sub": user_id,
            "role": beta_user["role"],
            "access_level": beta_user["access_level"],
            "is_beta": True
        },
        expires_delta=timedelta(minutes=session_timeout)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": f"{username}@beta.soulfood.com",
            "name": f"Beta Tester ({beta_user['description']})",
            "role": beta_user["role"],
            "access_level": beta_user["access_level"],
            "restrictions": beta_user.get("restrictions", []),
            "is_beta": True,
            "tfa_enabled": True  # Beta users skip 2FA
        },
        "session_config": {
            "timeout_mins": session_timeout,
            "restrictions": beta_user.get("restrictions", []),
            "message": f"Beta access granted: {beta_user['description']}"
        }
    }

# =============================================================================
# Helper function to award points (called from payment routes)
# =============================================================================

async def award_rewards_points(user_id: str, amount_spent: float, order_id: str):
    """Award rewards points for a purchase - 1 point per $10 spent + first purchase bonus"""
    
    if not user_id or user_id.startswith("guest"):
        return 0
    
    points_earned = int(amount_spent / 10)  # 1 point per $10
    first_purchase_bonus = 0
    
    # Check if this is the user's first purchase
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "first_purchase_bonus_awarded": 1})
    if user and not user.get("first_purchase_bonus_awarded"):
        first_purchase_bonus = 10  # 10 bonus points for first purchase!
        points_earned += first_purchase_bonus
        
        # Mark that bonus has been awarded
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"first_purchase_bonus_awarded": True}}
        )
    
    if points_earned > 0:
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"rewards_points": points_earned}}
        )
        
        # Record regular points earned
        base_points = points_earned - first_purchase_bonus
        if base_points > 0:
            await db.rewards_history.insert_one({
                "user_id": user_id,
                "type": "earned",
                "points": base_points,
                "order_id": order_id,
                "amount_spent": amount_spent,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Record first purchase bonus separately
        if first_purchase_bonus > 0:
            await db.rewards_history.insert_one({
                "user_id": user_id,
                "type": "bonus",
                "points": first_purchase_bonus,
                "order_id": order_id,
                "description": "🎉 First Purchase Bonus!",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    return points_earned
