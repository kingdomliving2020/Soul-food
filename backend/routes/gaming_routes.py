"""
Soul Food Gaming Session API Routes
====================================
Endpoints for managing gaming sessions with tier-based limits.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import os

from gaming_session_manager import (
    GAMING_TIERS,
    GAME_CATEGORIES,
    get_user_gaming_tier,
    get_daily_usage,
    can_start_session,
    start_gaming_session,
    update_session_activity,
    end_gaming_session,
    get_session_status,
    cleanup_idle_sessions,
    get_active_session_count
)

router = APIRouter(prefix="/api/gaming", tags=["gaming"])
security = HTTPBearer(auto_error=False)


# =============================================================================
# REQUEST MODELS
# =============================================================================

class StartSessionRequest(BaseModel):
    game_type: str = "jeopardy"
    category: Optional[str] = None


class HeartbeatRequest(BaseModel):
    session_id: str


class EndSessionRequest(BaseModel):
    session_id: str
    reason: str = "user_ended"


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def get_user_from_token(authorization: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """Extract user ID from JWT token"""
    if not authorization:
        return None
    
    try:
        from jose import jwt
        token = authorization.credentials
        secret = os.getenv("JWT_SECRET", "soul-food-secret-key-2024")
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload.get("user_id") or payload.get("sub")
    except Exception:
        return None


# =============================================================================
# PUBLIC ENDPOINTS
# =============================================================================

@router.get("/tiers")
async def get_gaming_tiers():
    """Get all gaming tier configurations"""
    return {
        "tiers": {
            tier_id: {
                "name": config["name"],
                "daily_limit_minutes": config["daily_limit_minutes"],
                "daily_limit_hours": config["daily_limit_minutes"] / 60 if config["daily_limit_minutes"] else None,
                "idle_timeout_minutes": config["idle_timeout_minutes"],
                "category_selection": config["category_selection"],
                "description": config["description"]
            }
            for tier_id, config in GAMING_TIERS.items()
        }
    }


@router.get("/categories")
async def get_game_categories():
    """Get available game categories (for eligible tiers)"""
    return {"categories": GAME_CATEGORIES}


# =============================================================================
# SESSION MANAGEMENT ENDPOINTS
# =============================================================================

@router.get("/status")
async def get_user_session_status(
    user_id: Optional[str] = None,
    authorization: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Get current gaming session status for a user.
    Shows tier, daily usage, remaining time, and active session info.
    """
    # Get user ID from token or parameter
    auth_user_id = await get_user_from_token(authorization)
    effective_user_id = user_id or auth_user_id
    
    if not effective_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    status = await get_session_status(effective_user_id)
    return status


@router.post("/start")
async def start_session(
    request: StartSessionRequest,
    user_id: Optional[str] = None,
    authorization: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Start a new gaming session.
    Checks daily limits and creates session with appropriate timeout.
    """
    auth_user_id = await get_user_from_token(authorization)
    effective_user_id = user_id or auth_user_id
    
    if not effective_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    success, message, data = await start_gaming_session(
        user_id=effective_user_id,
        game_type=request.game_type,
        category=request.category
    )
    
    if not success:
        raise HTTPException(status_code=429, detail=message)
    
    return {
        "success": True,
        "message": message,
        **data
    }


@router.post("/heartbeat")
async def session_heartbeat(request: HeartbeatRequest):
    """
    Send heartbeat to keep session active.
    Should be called every 1-2 minutes from the frontend.
    Returns remaining time and session status.
    """
    is_active, message, data = await update_session_activity(request.session_id)
    
    if not is_active:
        return {
            "active": False,
            "message": message,
            "data": data
        }
    
    return {
        "active": True,
        "message": message,
        **data
    }


@router.post("/end")
async def end_session(request: EndSessionRequest):
    """
    End a gaming session manually.
    """
    success = await end_gaming_session(request.session_id, request.reason)
    
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "success": True,
        "message": "Session ended successfully"
    }


@router.get("/can-play")
async def check_can_play(
    user_id: Optional[str] = None,
    authorization: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Quick check if user can start a gaming session.
    Returns eligibility and remaining time.
    """
    auth_user_id = await get_user_from_token(authorization)
    effective_user_id = user_id or auth_user_id
    
    if not effective_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    can_start, message, info = await can_start_session(effective_user_id)
    
    return {
        "can_play": can_start,
        "message": message,
        **info
    }


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================

@router.get("/admin/active-sessions")
async def get_active_sessions(
    authorization: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Admin endpoint to view active session counts by tier.
    """
    # In production, add admin role check here
    counts = await get_active_session_count()
    return counts


@router.post("/admin/cleanup")
async def run_cleanup(
    authorization: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Admin endpoint to manually trigger idle session cleanup.
    """
    # In production, add admin role check here
    cleaned = await cleanup_idle_sessions()
    return {
        "success": True,
        "sessions_cleaned": cleaned
    }
