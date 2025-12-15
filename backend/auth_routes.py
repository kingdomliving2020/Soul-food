"""
Soul Food Authentication Routes
================================
Handles user registration, login, and RBAC role assignment
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import uuid
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
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client.soul_food_db

# MailerLite API
MAILERLITE_API_KEY = os.getenv('MAILERLITE_API_KEY')

# =============================================================================
# RBAC TEST CODES - Assign roles based on registration codes
# =============================================================================
RBAC_TEST_CODES = {
    "test_ie": {
        "codes": ["test123"],
        "role": "instructor_tester",
        "session_timeout_mins": 120,
        "warning_mins": [15, 5],
        "access_level": "instructor",
        "restrictions": ["no_physical_merchandise", "digital_only"],
        "description": "Full digital access",
        "max_registrations": 20
    },
    "test_ye": {
        "codes": ["test1234"],
        "role": "youth_tester",
        "session_timeout_mins": 90,
        "warning_mins": [15, 5],
        "access_level": "youth",
        "restrictions": ["no_physical_merchandise", "digital_only"],
        "description": "Youth content access",
        "max_registrations": 20
    },
    "test_ae": {
        "codes": ["test12345"],
        "role": "adult_tester",
        "session_timeout_mins": 90,
        "warning_mins": [15, 5],
        "access_level": "adult",
        "restrictions": ["no_physical_merchandise", "digital_only"],
        "description": "Adult content access",
        "max_registrations": 20
    },
    "beta": {
        "codes": ["Beta1!2!3!"],
        "role": "beta_tester",
        "session_timeout_mins": 45,
        "warning_mins": [15, 5],
        "access_level": "beta",
        "restrictions": ["no_physical_merchandise", "limited_content"],
        "description": "Beta preview access",
        "max_registrations": 20
    }
}

# =============================================================================
# Pydantic Models
# =============================================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    test_code: Optional[str] = None  # Optional RBAC test code

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    access_level: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    session_config: dict

class GuestCheckout(BaseModel):
    email: EmailStr
    name: str
    cart_items: list

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
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_role_from_test_code(test_code: str) -> Optional[dict]:
    """Check if test code matches any RBAC role"""
    if not test_code:
        return None
    
    test_code = test_code.strip()
    for role_key, role_config in RBAC_TEST_CODES.items():
        if test_code in role_config["codes"]:
            return {
                "role": role_config["role"],
                "access_level": role_config["access_level"],
                "session_timeout_mins": role_config["session_timeout_mins"],
                "warning_mins": role_config["warning_mins"],
                "restrictions": role_config["restrictions"],
                "description": role_config["description"]
            }
    return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return current user"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def send_welcome_email(email: str, name: str):
    """Send welcome email via MailerLite"""
    if not MAILERLITE_API_KEY:
        print(f"MailerLite API key not configured. Would send welcome email to {email}")
        return
    
    try:
        async with httpx.AsyncClient() as client:
            # Add subscriber to MailerLite
            response = await client.post(
                "https://connect.mailerlite.com/api/subscribers",
                headers={
                    "Authorization": f"Bearer {MAILERLITE_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "email": email,
                    "fields": {
                        "name": name
                    },
                    "groups": ["welcome"]  # Add to welcome group for automation
                }
            )
            print(f"MailerLite response: {response.status_code}")
    except Exception as e:
        print(f"Error sending welcome email: {e}")

# =============================================================================
# Authentication Routes
# =============================================================================

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    """Register a new user with optional RBAC test code"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check for RBAC test code
    role_config = get_role_from_test_code(user_data.test_code)
    
    if role_config:
        role = role_config["role"]
        access_level = role_config["access_level"]
        session_timeout = role_config["session_timeout_mins"]
        restrictions = role_config["restrictions"]
    else:
        role = "guest"
        access_level = "free"
        session_timeout = 60  # 1 hour for guests
        restrictions = []
    
    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    user = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password_hash": get_password_hash(user_data.password),
        "name": user_data.name,
        "role": role,
        "access_level": access_level,
        "session_timeout_mins": session_timeout,
        "restrictions": restrictions,
        "test_code_used": user_data.test_code if role_config else None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "last_login": now.isoformat(),
        "subscription_status": "none",
        "subscription_rate": None,
        "subscription_start_date": None
    }
    
    await db.users.insert_one(user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_id, "role": role, "access_level": access_level},
        expires_delta=timedelta(minutes=session_timeout)
    )
    
    # Send welcome email (async)
    await send_welcome_email(user_data.email, user_data.name)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=user["email"],
            name=user["name"],
            role=role,
            access_level=access_level,
            created_at=user["created_at"]
        ),
        session_config={
            "timeout_mins": session_timeout,
            "warning_mins": role_config["warning_mins"] if role_config else [10, 5],
            "restrictions": restrictions,
            "message": role_config["description"] if role_config else "Welcome to Soul Food!"
        }
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    
    user = await db.users.find_one({"email": credentials.email.lower()}, {"_id": 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Get session timeout based on role
    session_timeout = user.get("session_timeout_mins", 60)
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": user["id"],
            "role": user["role"],
            "access_level": user["access_level"]
        },
        expires_delta=timedelta(minutes=session_timeout)
    )
    
    # Get role config for warnings
    role_config = None
    for key, config in RBAC_TEST_CODES.items():
        if config["role"] == user["role"]:
            role_config = config
            break
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            access_level=user["access_level"],
            created_at=user["created_at"]
        ),
        session_config={
            "timeout_mins": session_timeout,
            "warning_mins": role_config["warning_mins"] if role_config else [10, 5],
            "restrictions": user.get("restrictions", []),
            "message": f"Welcome back, {user['name']}!"
        }
    )

@router.get("/me")
async def get_current_user_info(user = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "access_level": user["access_level"],
        "restrictions": user.get("restrictions", []),
        "subscription_status": user.get("subscription_status", "none")
    }

@router.post("/extend-session")
async def extend_session(user = Depends(get_current_user)):
    """Extend user session by creating a new token"""
    
    session_timeout = user.get("session_timeout_mins", 60)
    
    access_token = create_access_token(
        data={
            "sub": user["id"],
            "role": user["role"],
            "access_level": user["access_level"]
        },
        expires_delta=timedelta(minutes=session_timeout)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in_mins": session_timeout
    }

@router.post("/guest-checkout")
async def guest_checkout(data: GuestCheckout):
    """Process guest checkout - create account or link to existing"""
    
    # Check if email exists
    existing_user = await db.users.find_one({"email": data.email.lower()})
    
    if existing_user:
        # Return message to login instead
        return {
            "status": "existing_user",
            "message": "An account with this email exists. Please sign in for better order tracking.",
            "needs_login": True
        }
    
    # Create order without account
    order_id = str(uuid.uuid4())
    order = {
        "id": order_id,
        "guest_email": data.email.lower(),
        "guest_name": data.name,
        "cart_items": data.cart_items,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.guest_orders.insert_one(order)
    
    return {
        "status": "success",
        "message": "Order created. You can create an account anytime to track your orders!",
        "order_id": order_id,
        "offer_registration": True
    }

@router.get("/validate-test-code/{code}")
async def validate_test_code(code: str):
    """Validate a beta code and return the role it grants"""
    
    role_config = get_role_from_test_code(code)
    
    if role_config:
        # Check remaining slots
        role_name = role_config["role"]
        max_regs = role_config.get("max_registrations", 20)
        current_count = await db.users.count_documents({"role": role_name})
        remaining = max(0, max_regs - current_count)
        
        if remaining == 0:
            return {
                "valid": False,
                "message": "This code has reached its limit. Please contact support."
            }
        
        return {
            "valid": True,
            "access_level": role_config["access_level"],
            "description": role_config["description"],
            "remaining_slots": remaining
        }
    
    return {
        "valid": False,
        "message": "Code not recognized"
    }

@router.get("/admin/beta-stats")
async def get_beta_stats():
    """Get registration stats for all beta/test codes (admin use)"""
    
    stats = []
    for role_key, config in RBAC_TEST_CODES.items():
        role_name = config["role"]
        max_regs = config.get("max_registrations", 20)
        current_count = await db.users.count_documents({"role": role_name})
        
        stats.append({
            "role_key": role_key,
            "role": role_name,
            "access_level": config["access_level"],
            "max_registrations": max_regs,
            "current_registrations": current_count,
            "remaining": max(0, max_regs - current_count),
            "session_timeout_mins": config["session_timeout_mins"]
        })
    
    return {
        "stats": stats,
        "total_beta_users": sum(s["current_registrations"] for s in stats)
    }

@router.post("/logout")
async def logout(user = Depends(get_current_user)):
    """Logout user (client should discard token)"""
    
    # Log the logout
    await db.user_sessions.insert_one({
        "user_id": user["id"],
        "action": "logout",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Logged out successfully"}
