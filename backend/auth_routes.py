"""
Soul Food Authentication Routes - Enhanced Security
====================================================
- Username + Email login
- Strong password requirements
- Password expiry (120 days)
- Account lockout (3 failed attempts)
- Password reset via email
- Beta user login (username/password, relaxed rules)
"""

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
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
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "soul-food-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
SESSION_TIMEOUT_MINUTES = 60  # Logout after 60 mins inactivity
PASSWORD_EXPIRY_DAYS = 120
MAX_FAILED_ATTEMPTS = 3
LOCKOUT_DURATION_MINUTES = 30
RESET_TOKEN_EXPIRY_HOURS = 1

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client.soul_food_db

# MailerLite API
MAILERLITE_API_KEY = os.getenv('MAILERLITE_API_KEY')

# Common dictionary passwords to reject
COMMON_PASSWORDS = {
    'password', 'password1', 'password123', '12345678', '123456789', 
    'qwerty123', 'letmein', 'welcome', 'admin123', 'login123',
    'abc12345', 'iloveyou', 'monkey123', 'dragon123', 'master123',
    'soulfood', 'soulfood1', 'jesus123', 'church123', 'bible123',
    'faith123', 'blessed1', 'kingdom1'
}

# =============================================================================
# BETA/TEST USER CREDENTIALS (username + password, no strict rules)
# =============================================================================
BETA_USERS = {
    "instructor_beta": {
        "password": "test123",
        "role": "instructor_tester",
        "session_timeout_mins": 120,
        "access_level": "instructor",
        "restrictions": ["no_physical_merchandise", "digital_only"],
        "description": "Instructor Edition Access"
    },
    "youth_beta": {
        "password": "test1234",
        "role": "youth_tester", 
        "session_timeout_mins": 90,
        "access_level": "youth",
        "restrictions": ["no_physical_merchandise", "digital_only"],
        "description": "Youth Edition Access"
    },
    "adult_beta": {
        "password": "test12345",
        "role": "adult_tester",
        "session_timeout_mins": 90,
        "access_level": "adult",
        "restrictions": ["no_physical_merchandise", "digital_only"],
        "description": "Adult Edition Access"
    },
    "beta_tester": {
        "password": "Beta1!2!3!",
        "role": "beta_tester",
        "session_timeout_mins": 45,
        "access_level": "beta",
        "restrictions": ["no_physical_merchandise", "limited_content"],
        "description": "Beta Preview Access"
    }
}

# =============================================================================
# Password Validation
# =============================================================================

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets requirements:
    - Minimum 8 characters
    - At least 3 of 4: uppercase, lowercase, number, special char
    - Not a common dictionary password
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    # Check for common passwords
    if password.lower() in COMMON_PASSWORDS:
        return False, "Password is too common. Please choose a stronger password."
    
    # Count criteria met
    criteria_met = 0
    has_upper = bool(re.search(r'[A-Z]', password))
    has_lower = bool(re.search(r'[a-z]', password))
    has_digit = bool(re.search(r'\d', password))
    has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]', password))
    
    if has_upper: criteria_met += 1
    if has_lower: criteria_met += 1
    if has_digit: criteria_met += 1
    if has_special: criteria_met += 1
    
    if criteria_met < 3:
        missing = []
        if not has_upper: missing.append("uppercase letter")
        if not has_lower: missing.append("lowercase letter")
        if not has_digit: missing.append("number")
        if not has_special: missing.append("special character")
        return False, f"Password must include at least 3 of: uppercase, lowercase, number, special character. Missing: {', '.join(missing)}"
    
    return True, "Password meets requirements"

# =============================================================================
# Pydantic Models
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
        if len(v) > 30:
            raise ValueError('Username must be 30 characters or less')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower()

class UserLogin(BaseModel):
    identifier: str  # Can be email or username
    password: str

class BetaLogin(BaseModel):
    username: str
    password: str

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    name: str
    role: str
    access_level: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    session_config: dict

# =============================================================================
# Helper Functions
# =============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=SESSION_TIMEOUT_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return current user"""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def check_account_lockout(identifier: str) -> tuple[bool, int]:
    """Check if account is locked due to failed attempts"""
    # Find by email or username
    user = await db.users.find_one({
        "$or": [
            {"email": identifier.lower()},
            {"username": identifier.lower()}
        ]
    }, {"_id": 0})
    
    if not user:
        return False, 0
    
    failed_attempts = user.get("failed_login_attempts", 0)
    last_failed = user.get("last_failed_login")
    
    if failed_attempts >= MAX_FAILED_ATTEMPTS and last_failed:
        last_failed_dt = datetime.fromisoformat(last_failed)
        lockout_end = last_failed_dt + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        
        if datetime.now(timezone.utc) < lockout_end:
            remaining_mins = int((lockout_end - datetime.now(timezone.utc)).total_seconds() / 60)
            return True, remaining_mins
        else:
            # Lockout expired, reset counter
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"failed_login_attempts": 0}}
            )
    
    return False, 0

async def record_failed_login(identifier: str):
    """Record a failed login attempt"""
    await db.users.update_one(
        {"$or": [{"email": identifier.lower()}, {"username": identifier.lower()}]},
        {
            "$inc": {"failed_login_attempts": 1},
            "$set": {"last_failed_login": datetime.now(timezone.utc).isoformat()}
        }
    )

async def reset_failed_attempts(user_id: str):
    """Reset failed login counter on successful login"""
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"failed_login_attempts": 0, "last_failed_login": None}}
    )

def check_password_expiry(password_changed_at: str) -> tuple[bool, int]:
    """Check if password has expired"""
    if not password_changed_at:
        return True, 0
    
    changed_dt = datetime.fromisoformat(password_changed_at)
    expiry_dt = changed_dt + timedelta(days=PASSWORD_EXPIRY_DAYS)
    
    if datetime.now(timezone.utc) > expiry_dt:
        return True, 0
    
    days_remaining = (expiry_dt - datetime.now(timezone.utc)).days
    return False, days_remaining

async def send_password_reset_email(email: str, reset_token: str, name: str):
    """Send password reset email via MailerLite"""
    reset_link = f"https://interactive-lessons-2.preview.emergentagent.com/reset-password?token={reset_token}"
    
    print(f"""
    ========================================
    PASSWORD RESET EMAIL
    ========================================
    To: {email}
    Name: {name}
    Reset Link: {reset_link}
    Expires: 1 hour
    ========================================
    """)
    
    if MAILERLITE_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    "https://connect.mailerlite.com/api/subscribers",
                    headers={
                        "Authorization": f"Bearer {MAILERLITE_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "email": email,
                        "fields": {
                            "name": name,
                            "reset_link": reset_link
                        },
                        "groups": ["password_reset"]
                    },
                    timeout=10.0
                )
        except Exception as e:
            print(f"Error sending reset email: {e}")

# =============================================================================
# Authentication Routes
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
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    password_hash = get_password_hash(user_data.password)
    
    user = {
        "id": user_id,
        "email": user_data.email.lower(),
        "username": user_data.username.lower(),
        "password_hash": password_hash,
        "password_history": [password_hash],  # Track password history
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
        "subscription_status": "none"
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
            "created_at": user["created_at"]
        },
        "session_config": {
            "timeout_mins": SESSION_TIMEOUT_MINUTES,
            "password_expires_in_days": PASSWORD_EXPIRY_DAYS,
            "message": f"Welcome to Soul Food, {user_data.name}!"
        }
    }

@router.post("/login")
async def login(credentials: UserLogin):
    """Login with email or username"""
    
    identifier = credentials.identifier.lower()
    
    # Check for account lockout
    is_locked, remaining_mins = await check_account_lockout(identifier)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked due to too many failed attempts. Try again in {remaining_mins} minutes."
        )
    
    # Find user by email or username
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"username": identifier}
        ]
    }, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        await record_failed_login(identifier)
        remaining_attempts = MAX_FAILED_ATTEMPTS - user.get("failed_login_attempts", 0) - 1
        
        if remaining_attempts <= 0:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked due to too many failed attempts. Try again in {LOCKOUT_DURATION_MINUTES} minutes."
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials. {remaining_attempts} attempts remaining."
        )
    
    # Reset failed attempts on successful login
    await reset_failed_attempts(user["id"])
    
    # Check password expiry
    is_expired, days_remaining = check_password_expiry(user.get("password_changed_at"))
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    session_timeout = user.get("session_timeout_mins", SESSION_TIMEOUT_MINUTES)
    
    access_token = create_access_token(
        data={
            "sub": user["id"],
            "role": user["role"],
            "access_level": user["access_level"]
        },
        expires_delta=timedelta(minutes=session_timeout)
    )
    
    response = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "name": user["name"],
            "role": user["role"],
            "access_level": user["access_level"],
            "created_at": user["created_at"]
        },
        "session_config": {
            "timeout_mins": session_timeout,
            "message": f"Welcome back, {user['name']}!"
        }
    }
    
    if is_expired:
        response["password_expired"] = True
        response["session_config"]["message"] = "Your password has expired. Please change it."
    elif days_remaining <= 14:
        response["password_expiring_soon"] = True
        response["password_expires_in_days"] = days_remaining
        response["session_config"]["message"] = f"Welcome back! Your password expires in {days_remaining} days."
    
    return response

@router.post("/beta-login")
async def beta_login(credentials: BetaLogin):
    """Login with beta test credentials (username + password)"""
    
    username = credentials.username.lower()
    
    # Check if username exists in beta users
    if username not in BETA_USERS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid beta credentials")
    
    beta_user = BETA_USERS[username]
    
    # Verify password (simple comparison for beta users)
    if credentials.password != beta_user["password"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid beta credentials")
    
    # Create session
    session_id = str(uuid.uuid4())
    session_timeout = beta_user["session_timeout_mins"]
    
    # Log beta session
    await db.beta_sessions.insert_one({
        "id": session_id,
        "username": username,
        "role": beta_user["role"],
        "access_level": beta_user["access_level"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    access_token = create_access_token(
        data={
            "sub": session_id,
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
            "id": session_id,
            "email": f"{username}@beta.soulfood.com",
            "username": username,
            "name": f"Beta Tester ({beta_user['access_level'].title()})",
            "role": beta_user["role"],
            "access_level": beta_user["access_level"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        "session_config": {
            "timeout_mins": session_timeout,
            "restrictions": beta_user["restrictions"],
            "message": f"{beta_user['description']} - Session: {session_timeout} mins"
        }
    }

@router.post("/request-password-reset")
async def request_password_reset(data: PasswordReset, background_tasks: BackgroundTasks):
    """Request a password reset link"""
    
    user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If an account exists with that email, a reset link has been sent."}
    
    # Create reset token
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRY_HOURS)
    
    # Store reset token
    await db.password_resets.insert_one({
        "token": reset_token,
        "user_id": user["id"],
        "email": user["email"],
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send email in background
    background_tasks.add_task(send_password_reset_email, user["email"], reset_token, user["name"])
    
    return {"message": "If an account exists with that email, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm):
    """Reset password using token"""
    
    # Find valid reset token
    reset_record = await db.password_resets.find_one({
        "token": data.token,
        "used": False
    }, {"_id": 0})
    
    if not reset_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")
    
    # Check expiry
    expires_at = datetime.fromisoformat(reset_record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired")
    
    # Validate new password
    is_valid, message = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    # Get user
    user = await db.users.find_one({"id": reset_record["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    
    # Check password isn't same as last one
    new_hash = get_password_hash(data.new_password)
    if user.get("password_history"):
        last_password = user["password_history"][-1] if user["password_history"] else None
        if last_password and verify_password(data.new_password, last_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password cannot be the same as your previous password"
            )
    
    # Update password
    password_history = user.get("password_history", [])
    password_history.append(new_hash)
    # Keep only last 2 passwords in history
    if len(password_history) > 2:
        password_history = password_history[-2:]
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "password_hash": new_hash,
                "password_history": password_history,
                "password_changed_at": datetime.now(timezone.utc).isoformat(),
                "failed_login_attempts": 0
            }
        }
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password has been reset successfully. You can now log in."}

@router.post("/change-password")
async def change_password(data: ChangePassword, user = Depends(get_current_user)):
    """Change password for logged-in user"""
    
    # Verify current password
    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    
    # Validate new password
    is_valid, message = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    # Check password isn't same as last one
    if user.get("password_history"):
        last_password = user["password_history"][-1] if user["password_history"] else None
        if last_password and verify_password(data.new_password, last_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password cannot be the same as your previous password"
            )
    
    # Update password
    new_hash = get_password_hash(data.new_password)
    password_history = user.get("password_history", [])
    password_history.append(new_hash)
    if len(password_history) > 2:
        password_history = password_history[-2:]
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "password_hash": new_hash,
                "password_history": password_history,
                "password_changed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Password changed successfully"}

@router.get("/me")
async def get_current_user_info(user = Depends(get_current_user)):
    """Get current user information"""
    
    is_expired, days_remaining = check_password_expiry(user.get("password_changed_at"))
    
    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "name": user["name"],
        "role": user["role"],
        "access_level": user["access_level"],
        "restrictions": user.get("restrictions", []),
        "password_expired": is_expired,
        "password_expires_in_days": days_remaining if not is_expired else 0
    }

@router.post("/logout")
async def logout(user = Depends(get_current_user)):
    """Logout user"""
    
    await db.user_sessions.insert_one({
        "user_id": user["id"],
        "action": "logout",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Logged out successfully"}

@router.get("/admin/beta-stats")
async def get_beta_stats():
    """Get beta session statistics"""
    
    stats = []
    for username, config in BETA_USERS.items():
        session_count = await db.beta_sessions.count_documents({"username": username})
        stats.append({
            "username": username,
            "role": config["role"],
            "access_level": config["access_level"],
            "session_count": session_count,
            "session_timeout_mins": config["session_timeout_mins"]
        })
    
    return {"stats": stats}
