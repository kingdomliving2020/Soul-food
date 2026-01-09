"""
Soul Food Gaming Session Manager
================================
Manages gaming session limits, idle timeouts, and resource allocation
to ensure smooth experience for all users.

Tier Structure:
- 30-Day Pass ($7.99): 4 hrs/day, 20 min idle timeout
- 90-Day Pass ($24.99): 5 hrs/day, 30 min idle timeout  
- Ministry/Small Group ($24.99/mo): 6 hrs/day, 40 min idle timeout, category selection
- All-Day Pass: Unlimited, high priority
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Tuple, List
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import secrets

load_dotenv()

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'soul_food_db')]


def ensure_utc_datetime(dt) -> Optional[datetime]:
    """Ensure a datetime object is timezone-aware (UTC)."""
    if dt is None:
        return None
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

# =============================================================================
# GAMING TIER CONFIGURATION
# =============================================================================

GAMING_TIERS = {
    "all_day_pass": {
        "name": "All-Day Pass",
        "daily_limit_minutes": None,  # Unlimited
        "idle_timeout_minutes": None,  # No timeout
        "priority": 10,  # Highest priority
        "category_selection": True,
        "description": "Single-use all-day access with highest priority"
    },
    "ministry_group": {
        "name": "Ministry/Small Group",
        "daily_limit_minutes": 360,  # 6 hours
        "idle_timeout_minutes": 40,
        "priority": 5,
        "category_selection": True,
        "description": "Monthly subscription with category selection perk"
    },
    "game_pass_90": {
        "name": "90-Day Game Pass",
        "daily_limit_minutes": 300,  # 5 hours
        "idle_timeout_minutes": 30,
        "priority": 3,
        "category_selection": False,
        "description": "Quarterly pass with 5hr daily limit"
    },
    "game_pass_30": {
        "name": "30-Day Game Pass",
        "daily_limit_minutes": 240,  # 4 hours
        "idle_timeout_minutes": 20,
        "priority": 2,
        "category_selection": False,
        "description": "Monthly pass with 4hr daily limit"
    },
    "free_beta": {
        "name": "Free/Beta Access",
        "daily_limit_minutes": 30,  # 30 minutes for testing
        "idle_timeout_minutes": 10,
        "priority": 1,  # Lowest priority
        "category_selection": False,
        "description": "Limited beta testing access"
    }
}

# Game categories for Ministry/All-Day pass holders
GAME_CATEGORIES = [
    {"id": "jeopardy", "name": "Kingdom Jeopardy", "description": "Bible trivia game show style"},
    {"id": "word_search", "name": "Word Search", "description": "Find biblical words and themes"},
    {"id": "crossword", "name": "Kingdom Crosses", "description": "Scripture-based crossword puzzles"},
    {"id": "matching", "name": "Memory Match", "description": "Match verses and concepts"},
    {"id": "quiz", "name": "Quick Quiz", "description": "Rapid-fire Bible questions"},
    {"id": "group_challenge", "name": "Group Challenge", "description": "Team-based activities"}
]


# =============================================================================
# SESSION MANAGEMENT
# =============================================================================

async def get_user_gaming_tier(user_id: str) -> str:
    """
    Determine user's gaming tier based on their subscriptions/passes.
    Returns the highest tier the user has access to.
    """
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return "free_beta"
    
    # Check for active all-day pass (highest priority)
    all_day_pass = await db.gaming_passes.find_one({
        "user_id": user_id,
        "pass_type": "all_day",
        "used_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "status": "active"
    })
    if all_day_pass:
        return "all_day_pass"
    
    # Check for Ministry/Small Group subscription
    ministry_sub = await db.subscriptions.find_one({
        "user_id": user_id,
        "subscription_type": "ministry_group",
        "status": "active",
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    if ministry_sub:
        return "ministry_group"
    
    # Check for 90-day game pass
    pass_90 = await db.gaming_passes.find_one({
        "user_id": user_id,
        "pass_type": "game_pass_90",
        "status": "active",
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    if pass_90:
        return "game_pass_90"
    
    # Check for 30-day game pass
    pass_30 = await db.gaming_passes.find_one({
        "user_id": user_id,
        "pass_type": "game_pass_30",
        "status": "active",
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    if pass_30:
        return "game_pass_30"
    
    # Default to free/beta
    return "free_beta"


async def get_daily_usage(user_id: str) -> int:
    """
    Get total minutes used today by the user.
    Returns cumulative minutes played today.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get all completed sessions for today
    sessions = await db.gaming_sessions.find({
        "user_id": user_id,
        "date": today,
        "status": {"$in": ["completed", "active"]}
    }).to_list(100)
    
    total_minutes = 0
    for session in sessions:
        if session["status"] == "completed":
            total_minutes += session.get("duration_minutes", 0)
        elif session["status"] == "active":
            # Calculate ongoing session time
            start_time = ensure_utc_datetime(session.get("started_at"))
            if start_time:
                elapsed = (datetime.now(timezone.utc) - start_time).total_seconds() / 60
                total_minutes += int(elapsed)
    
    return total_minutes


async def can_start_session(user_id: str) -> Tuple[bool, str, Dict]:
    """
    Check if user can start a new gaming session.
    Returns: (can_start, message, session_info)
    """
    tier = await get_user_gaming_tier(user_id)
    tier_config = GAMING_TIERS.get(tier, GAMING_TIERS["free_beta"])
    
    # Check for existing active session
    active_session = await db.gaming_sessions.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    if active_session:
        return False, "You already have an active gaming session.", {
            "session_id": active_session.get("session_id"),
            "tier": tier
        }
    
    # Check daily limit (None = unlimited)
    daily_limit = tier_config.get("daily_limit_minutes")
    if daily_limit is not None:
        used_today = await get_daily_usage(user_id)
        remaining = daily_limit - used_today
        
        if remaining <= 0:
            return False, f"Daily limit reached ({daily_limit} minutes). Resets at midnight UTC.", {
                "tier": tier,
                "daily_limit": daily_limit,
                "used_today": used_today,
                "remaining": 0
            }
        
        return True, f"Session allowed. {remaining} minutes remaining today.", {
            "tier": tier,
            "daily_limit": daily_limit,
            "used_today": used_today,
            "remaining": remaining,
            "idle_timeout": tier_config.get("idle_timeout_minutes"),
            "category_selection": tier_config.get("category_selection", False)
        }
    
    # Unlimited access (all-day pass)
    return True, "Unlimited access granted.", {
        "tier": tier,
        "daily_limit": None,
        "remaining": None,
        "idle_timeout": None,
        "category_selection": True
    }


async def start_gaming_session(
    user_id: str, 
    game_type: str = "jeopardy",
    category: Optional[str] = None
) -> Tuple[bool, str, Optional[Dict]]:
    """
    Start a new gaming session for the user.
    Returns: (success, message, session_data)
    """
    can_start, message, info = await can_start_session(user_id)
    
    if not can_start:
        return False, message, info
    
    tier = info.get("tier", "free_beta")
    tier_config = GAMING_TIERS.get(tier, GAMING_TIERS["free_beta"])
    
    # Validate category selection
    if category and not tier_config.get("category_selection"):
        category = None  # Reset if not allowed
    
    session_id = secrets.token_hex(16)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    session = {
        "session_id": session_id,
        "user_id": user_id,
        "tier": tier,
        "game_type": game_type,
        "category": category,
        "date": today,
        "started_at": datetime.now(timezone.utc),
        "last_activity": datetime.now(timezone.utc),
        "status": "active",
        "duration_minutes": 0,
        "idle_timeout_minutes": tier_config.get("idle_timeout_minutes"),
        "daily_limit_minutes": tier_config.get("daily_limit_minutes"),
        "priority": tier_config.get("priority", 1)
    }
    
    await db.gaming_sessions.insert_one(session)
    
    return True, "Gaming session started!", {
        "session_id": session_id,
        "tier": tier,
        "tier_name": tier_config.get("name"),
        "idle_timeout_minutes": tier_config.get("idle_timeout_minutes"),
        "remaining_minutes": info.get("remaining"),
        "category_selection": tier_config.get("category_selection", False),
        "categories": GAME_CATEGORIES if tier_config.get("category_selection") else None
    }


async def update_session_activity(session_id: str) -> Tuple[bool, str, Optional[Dict]]:
    """
    Update last activity timestamp for a session (heartbeat).
    Also checks if session should be terminated due to limits.
    Returns: (is_active, message, session_info)
    """
    session = await db.gaming_sessions.find_one({"session_id": session_id}, {"_id": 0})
    
    if not session:
        return False, "Session not found.", None
    
    if session["status"] != "active":
        return False, "Session is no longer active.", session
    
    user_id = session["user_id"]
    tier_config = GAMING_TIERS.get(session.get("tier", "free_beta"), GAMING_TIERS["free_beta"])
    
    # Calculate elapsed time
    start_time = session.get("started_at")
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    
    elapsed_minutes = int((datetime.now(timezone.utc) - start_time).total_seconds() / 60)
    
    # Check daily limit
    daily_limit = tier_config.get("daily_limit_minutes")
    if daily_limit is not None:
        used_today = await get_daily_usage(user_id)
        if used_today >= daily_limit:
            await end_gaming_session(session_id, "daily_limit_reached")
            return False, f"Daily limit of {daily_limit} minutes reached.", {
                "reason": "daily_limit",
                "used_today": used_today,
                "limit": daily_limit
            }
    
    # Check idle timeout
    idle_timeout = tier_config.get("idle_timeout_minutes")
    if idle_timeout is not None:
        last_activity = session.get("last_activity")
        if isinstance(last_activity, str):
            last_activity = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
        
        idle_minutes = (datetime.now(timezone.utc) - last_activity).total_seconds() / 60
        if idle_minutes >= idle_timeout:
            await end_gaming_session(session_id, "idle_timeout")
            return False, f"Session ended due to {idle_timeout} minute idle timeout.", {
                "reason": "idle_timeout",
                "idle_minutes": int(idle_minutes)
            }
    
    # Update activity timestamp
    await db.gaming_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "last_activity": datetime.now(timezone.utc),
                "duration_minutes": elapsed_minutes
            }
        }
    )
    
    remaining = None
    if daily_limit:
        used_today = await get_daily_usage(user_id)
        remaining = max(0, daily_limit - used_today)
    
    return True, "Session active.", {
        "session_id": session_id,
        "elapsed_minutes": elapsed_minutes,
        "remaining_minutes": remaining,
        "idle_timeout_minutes": idle_timeout
    }


async def end_gaming_session(session_id: str, reason: str = "user_ended") -> bool:
    """
    End a gaming session and record final duration.
    """
    session = await db.gaming_sessions.find_one({"session_id": session_id}, {"_id": 0})
    
    if not session:
        return False
    
    # Calculate final duration
    start_time = session.get("started_at")
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    elif start_time and start_time.tzinfo is None:
        # Make naive datetime timezone-aware (assume UTC)
        start_time = start_time.replace(tzinfo=timezone.utc)
    
    if start_time:
        duration_minutes = int((datetime.now(timezone.utc) - start_time).total_seconds() / 60)
    else:
        duration_minutes = 0
    
    await db.gaming_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "status": "completed",
                "ended_at": datetime.now(timezone.utc),
                "duration_minutes": duration_minutes,
                "end_reason": reason
            }
        }
    )
    
    # Log session end
    print(f"[Gaming] Session {session_id} ended: {reason}, duration: {duration_minutes} min")
    
    return True


async def get_session_status(user_id: str) -> Dict:
    """
    Get current gaming session status for a user.
    """
    tier = await get_user_gaming_tier(user_id)
    tier_config = GAMING_TIERS.get(tier, GAMING_TIERS["free_beta"])
    
    # Check for active session
    active_session = await db.gaming_sessions.find_one({
        "user_id": user_id,
        "status": "active"
    }, {"_id": 0})
    
    used_today = await get_daily_usage(user_id)
    daily_limit = tier_config.get("daily_limit_minutes")
    remaining = None
    if daily_limit:
        remaining = max(0, daily_limit - used_today)
    
    return {
        "tier": tier,
        "tier_name": tier_config.get("name"),
        "daily_limit_minutes": daily_limit,
        "used_today_minutes": used_today,
        "remaining_minutes": remaining,
        "idle_timeout_minutes": tier_config.get("idle_timeout_minutes"),
        "category_selection": tier_config.get("category_selection", False),
        "has_active_session": active_session is not None,
        "active_session": {
            "session_id": active_session.get("session_id"),
            "game_type": active_session.get("game_type"),
            "started_at": active_session.get("started_at").isoformat() if active_session and hasattr(active_session.get("started_at"), "isoformat") else active_session.get("started_at") if active_session else None
        } if active_session else None
    }


# =============================================================================
# CLEANUP & MAINTENANCE
# =============================================================================

async def cleanup_idle_sessions():
    """
    Background task to clean up idle sessions.
    Should be run periodically (e.g., every 5 minutes).
    """
    # Find all active sessions
    active_sessions = await db.gaming_sessions.find({"status": "active"}).to_list(1000)
    
    cleaned = 0
    for session in active_sessions:
        tier = session.get("tier", "free_beta")
        tier_config = GAMING_TIERS.get(tier, GAMING_TIERS["free_beta"])
        idle_timeout = tier_config.get("idle_timeout_minutes")
        
        if idle_timeout is None:
            continue  # No timeout for this tier
        
        last_activity = session.get("last_activity")
        if isinstance(last_activity, str):
            last_activity = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
        
        idle_minutes = (datetime.now(timezone.utc) - last_activity).total_seconds() / 60
        
        if idle_minutes >= idle_timeout:
            await end_gaming_session(session["session_id"], "idle_timeout_cleanup")
            cleaned += 1
    
    if cleaned > 0:
        print(f"[Gaming Cleanup] Ended {cleaned} idle sessions")
    
    return cleaned


async def get_active_session_count() -> Dict:
    """
    Get count of active sessions by tier (for monitoring).
    """
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$tier", "count": {"$sum": 1}}}
    ]
    
    results = await db.gaming_sessions.aggregate(pipeline).to_list(100)
    
    counts = {tier: 0 for tier in GAMING_TIERS.keys()}
    total = 0
    for result in results:
        tier = result["_id"]
        count = result["count"]
        counts[tier] = count
        total += count
    
    return {
        "total_active": total,
        "by_tier": counts
    }
