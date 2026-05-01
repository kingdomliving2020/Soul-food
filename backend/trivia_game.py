# Soul Food: Trivia Mix-up Game System
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import random
import secrets
import uuid
import os

from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/trivia", tags=["trivia"])

# MongoDB connection for trivia
MONGO_URL = os.environ.get('MONGO_URL')
_trivia_client = AsyncIOMotorClient(MONGO_URL)
_trivia_db = _trivia_client[os.environ['DB_NAME']]

# Game Access Tiers
ACCESS_TIERS = {
    "free": {
        "name": "Preview Mode",
        "questions_limit": 5,
        "game_modes": ["practice"],
        "lifelines": 1,
        "leaderboard": False
    },
    "day_pass": {
        "name": "Day Pass",
        "price": 40.00,
        "questions_limit": None,  # Unlimited for 24 hours
        "game_modes": ["practice", "quarter_challenge", "series_challenge"],
        "lifelines": 3,
        "leaderboard": True,
        "duration_hours": 24
    },
    "ebook_courtesy": {
        "name": "eBook Courtesy Access",
        "questions_limit": 50,
        "game_modes": ["practice", "quarter_challenge"],
        "lifelines": 2,
        "leaderboard": True,
        "note": "Access to questions from purchased series only"
    },
    "subscription": {
        "name": "Full Subscription Access",
        "questions_limit": None,
        "game_modes": ["practice", "quarter_challenge", "series_challenge", "4cs_special", "millionaire_mode"],
        "lifelines": 3,
        "leaderboard": True,
        "special_features": ["custom_quiz", "multiplayer"]
    },
    "instructor": {
        "name": "Instructor/Admin",
        "questions_limit": None,
        "game_modes": ["all", "custom_builder"],
        "lifelines": 3,
        "leaderboard": True,
        "special_features": ["create_custom_quiz", "class_mode", "progress_tracking", "unlock_greater_modes"]
    }
}

# Game Modes
GAME_MODES = {
    "practice": {
        "name": "Practice Mode",
        "description": "Casual play with 10 random questions",
        "questions": 10,
        "timer": False,
        "difficulty": "mixed"
    },
    "quarter_challenge": {
        "name": "Quarter Challenge",
        "description": "Master a specific quarter (Q1, Q2, Q3, Q4)",
        "questions": 15,
        "timer": True,
        "difficulty": "progressive"
    },
    "series_challenge": {
        "name": "Series Challenge",
        "description": "Focus on one theme (Prayer, Friends, etc.)",
        "questions": 12,
        "timer": True,
        "difficulty": "mixed"
    },
    "4cs_special": {
        "name": "4C's Holiday Special",
        "description": "Master the Covenant, Cradle, Cross, Comforter",
        "questions": 10,
        "timer": True,
        "difficulty": "progressive"
    },
    "millionaire_mode": {
        "name": "Soul Food Millionaire",
        "description": "Classic 15-question climb to victory!",
        "questions": 15,
        "timer": True,
        "difficulty": "progressive",
        "prize_ladder": [100, 200, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 750000, 1000000]
    }
}

# Lifelines
LIFELINES = {
    "fifty_fifty": {
        "name": "50/50",
        "description": "Remove two wrong answers",
        "icon": "50:50",
        "uses": 1
    },
    "ask_congregation": {
        "name": "Ask the Congregation",
        "description": "See poll results from other players",
        "icon": "👥",
        "uses": 1
    },
    "scripture_hint": {
        "name": "Scripture Hint",
        "description": "Get a related Bible verse",
        "icon": "📖",
        "uses": 1
    },
    "prayer_pause": {
        "name": "Prayer Pause",
        "description": "Freeze timer for 30 seconds",
        "icon": "🙏",
        "uses": 1
    }
}

# Question Bank now lives in MongoDB (trivia_questions collection)
# Seeded by seed_qa_bank.py - ~383 questions across 20+ characters
# Legacy in-memory list kept empty for backwards compatibility
QUESTIONS_DB = []


async def get_questions_from_db(filters=None, limit=None):
    """Fetch questions from MongoDB with optional filters"""
    query = filters or {}
    cursor = _trivia_db.trivia_questions.find(query, {"_id": 0})
    if limit:
        cursor = cursor.limit(limit)
    return await cursor.to_list(length=limit or 1000)


async def get_question_by_id(qid):
    """Fetch a single question by its qid"""
    return await _trivia_db.trivia_questions.find_one({"qid": qid}, {"_id": 0})

# Pydantic Models
class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    game_mode: str
    access_tier: str
    questions: List[int]  # Question IDs
    current_question_index: int = 0
    score: int = 0
    lifelines_used: Dict[str, int] = Field(default_factory=dict)
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    completed: bool = False

class GameAnswer(BaseModel):
    session_id: str
    question_id: int
    user_answer: str
    time_taken: int  # seconds
    lifeline_used: Optional[str] = None

class DayPassPurchase(BaseModel):
    user_id: str
    payment_method: str
    amount: float = 40.00
    purchased_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=24))

# Routes
@router.get("/access-tiers")
async def get_access_tiers():
    """Get all available access tiers"""
    return {"access_tiers": ACCESS_TIERS}

@router.get("/game-modes")
async def get_game_modes(access_tier: str = "free"):
    """Get available game modes for user's access tier"""
    tier = ACCESS_TIERS.get(access_tier, ACCESS_TIERS["free"])
    available_modes = tier["game_modes"]
    
    if "all" in available_modes:
        return {"game_modes": GAME_MODES}
    
    filtered_modes = {k: v for k, v in GAME_MODES.items() if k in available_modes}
    return {"game_modes": filtered_modes, "access_tier": tier["name"]}

@router.post("/day-pass/purchase")
async def purchase_day_pass(purchase: DayPassPurchase):
    """Purchase 24-hour day pass for $40"""
    # In production, integrate with Stripe or payment processor
    # For now, just store the purchase
    pass_data = {
        "pass_id": str(uuid.uuid4()),
        "user_id": purchase.user_id,
        "purchased_at": purchase.purchased_at.isoformat(),
        "expires_at": purchase.expires_at.isoformat(),
        "access_tier": "day_pass",
        "active": True
    }
    
    return {
        "success": True,
        "message": "Day Pass purchased successfully!",
        "pass": pass_data,
        "access": ACCESS_TIERS["day_pass"]
    }

@router.post("/session/start")
async def start_game_session(
    user_id: str,
    game_mode: str,
    access_tier: str = "free",
    quarter: Optional[str] = None,
    theme: Optional[str] = None,
    character: Optional[str] = None,
    age_group: Optional[str] = None
):
    """Start a new game session"""
    # Validate access
    tier = ACCESS_TIERS.get(access_tier, ACCESS_TIERS["free"])
    if game_mode not in tier["game_modes"] and "all" not in tier["game_modes"]:
        raise HTTPException(status_code=403, detail=f"Game mode '{game_mode}' not available for {tier['name']}")
    
    # Get game mode config
    mode_config = GAME_MODES.get(game_mode)
    if not mode_config:
        raise HTTPException(status_code=404, detail="Game mode not found")
    
    # Build MongoDB query filters
    query = {}
    if character:
        query["character"] = character
    if age_group:
        query["age_group"] = age_group
    
    # Map game modes to game_type
    game_type_map = {
        "practice": None,  # any type
        "quarter_challenge": "trivia_testament",
        "series_challenge": "trivia_testament",
        "4cs_special": "trivia_testament",
        "millionaire_mode": "tricky_trivia",
    }
    game_type = game_type_map.get(game_mode)
    if game_type:
        query["game_type"] = game_type
    
    # Fetch questions from MongoDB
    all_questions = await get_questions_from_db(query)
    
    if not all_questions:
        raise HTTPException(status_code=404, detail="No questions found for the selected filters")
    
    # Apply difficulty progression if needed
    num_questions = mode_config["questions"]
    
    if mode_config.get("difficulty") == "progressive":
        easy = [q for q in all_questions if q["difficulty"] == "easy"]
        medium = [q for q in all_questions if q["difficulty"] == "medium"]
        hard = [q for q in all_questions if q["difficulty"] == "hard"]
        
        selected = []
        selected += random.sample(easy, min(5, len(easy)))
        selected += random.sample(medium, min(7, len(medium)))
        selected += random.sample(hard, min(3, len(hard)))
    else:
        selected = random.sample(all_questions, min(num_questions, len(all_questions)))
    
    question_ids = [q["qid"] for q in selected]
    
    session = GameSession(
        user_id=user_id,
        game_mode=game_mode,
        access_tier=access_tier,
        questions=question_ids
    )
    
    return {
        "session": session.dict(),
        "mode_config": mode_config,
        "lifelines": LIFELINES,
        "first_question": selected[0] if selected else None,
        "total_available": len(all_questions)
    }

@router.get("/question/{question_id}")
async def get_question(question_id: int):
    """Get a specific question"""
    question = await get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Return question without correct answer (for game play)
    question_data = question.copy()
    question_data.pop("correct_answer", None)
    question_data.pop("explanation", None)
    
    return {"question": question_data}

@router.post("/answer/submit")
async def submit_answer(answer: GameAnswer):
    """Submit an answer and get result"""
    question = await get_question_by_id(answer.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if correct
    is_correct = answer.user_answer.strip().lower() == question["correct_answer"].strip().lower()
    
    # Calculate points based on difficulty and time
    points = 0
    if is_correct:
        base_points = {"easy": 100, "medium": 250, "hard": 500, "expert": 1000}
        points = base_points.get(question["difficulty"], 100)
        
        # Time bonus (faster = more points)
        if answer.time_taken < 10:
            points += 50
        elif answer.time_taken < 20:
            points += 25
    
    return {
        "correct": is_correct,
        "correct_answer": question["correct_answer"],
        "explanation": question.get("explanation", ""),
        "scripture": question.get("scripture", ""),
        "points_earned": points,
        "difficulty": question["difficulty"]
    }

@router.post("/lifeline/use")
async def use_lifeline(
    session_id: str,
    lifeline: str,
    question_id: int
):
    """Use a lifeline"""
    if lifeline not in LIFELINES:
        raise HTTPException(status_code=400, detail="Invalid lifeline")
    
    question = await get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    result = {"lifeline": lifeline, "question_id": question_id}
    
    if lifeline == "fifty_fifty":
        correct = question["correct_answer"]
        options = question.get("options", [])
        if options:
            wrong_answers = [opt for opt in options if opt != correct]
            if wrong_answers:
                remaining_wrong = secrets.choice(wrong_answers)
                result["remaining_options"] = [correct, remaining_wrong]
            else:
                result["remaining_options"] = options
        
    elif lifeline == "ask_congregation":
        correct = question["correct_answer"]
        options = question.get("options", [])
        if options:
            poll = {}
            for opt in options:
                if opt == correct:
                    poll[opt] = secrets.randbelow(31) + 40
                else:
                    poll[opt] = secrets.randbelow(16) + 5
            total = sum(poll.values())
            poll = {k: round((v/total)*100) for k, v in poll.items()}
            result["poll_results"] = poll
        
    elif lifeline == "scripture_hint":
        result["hint"] = question.get("scripture", "Trust in the Lord!")
        
    elif lifeline == "prayer_pause":
        result["time_added"] = 30
    
    return result

@router.get("/leaderboard")
async def get_leaderboard(
    game_mode: Optional[str] = None,
    timeframe: str = "all_time"  # "today", "week", "month", "all_time"
):
    """Get leaderboard rankings"""
    # This would query actual game sessions from database
    # For now, return mock data
    mock_leaders = [
        {"rank": 1, "username": "FaithWarrior", "score": 15000, "games_played": 45, "accuracy": 92},
        {"rank": 2, "username": "BibleScholar", "score": 14500, "games_played": 38, "accuracy": 89},
        {"rank": 3, "username": "PrayerChampion", "score": 13800, "games_played": 42, "accuracy": 87},
        {"rank": 4, "username": "YoungGifted", "score": 12900, "games_played": 35, "accuracy": 85},
        {"rank": 5, "username": "KingdomSeeker", "score": 12100, "games_played": 40, "accuracy": 83}
    ]
    
    return {
        "leaderboard": mock_leaders,
        "timeframe": timeframe,
        "game_mode": game_mode or "all_modes"
    }

@router.get("/badges")
async def get_available_badges():
    """Get all available badges/achievements"""
    badges = {
        "prayer_warrior": {"name": "Prayer Warrior", "icon": "🙏", "requirement": "Complete Prayer quarter"},
        "faithful_friend": {"name": "Faithful Friend", "icon": "🤝", "requirement": "Complete Friends & Friction"},
        "purpose_finder": {"name": "Purpose Finder", "icon": "🎯", "requirement": "Complete ID in Christ"},
        "persistent_soul": {"name": "Persistent Soul", "icon": "💪", "requirement": "Complete Persistent Pursuit"},
        "4cs_master": {"name": "4C's Master", "icon": "✡️", "requirement": "Perfect score on Holiday Series"},
        "millionaire": {"name": "Soul Food Millionaire", "icon": "💎", "requirement": "Reach 1M in Millionaire Mode"},
        "speed_demon": {"name": "Speed Demon", "icon": "⚡", "requirement": "Answer 10 correct in under 60 seconds"},
        "perfect_game": {"name": "Perfect Game", "icon": "🌟", "requirement": "15/15 correct answers"},
        "comeback_kid": {"name": "Comeback Kid", "icon": "🔥", "requirement": "Win after using all lifelines"}
    }
    
    return {"badges": badges}

# Instructor/Admin Routes
@router.post("/admin/unlock-mode")
async def unlock_game_mode(
    instructor_id: str,
    user_id: str,
    game_mode: str
):
    """Instructor unlocks special game mode for student"""
    # Verify instructor permissions
    # Store unlock in database
    return {
        "success": True,
        "message": f"Game mode '{game_mode}' unlocked for user",
        "unlocked_mode": GAME_MODES.get(game_mode)
    }

@router.post("/admin/create-custom-quiz")
async def create_custom_quiz(
    instructor_id: str,
    quiz_name: str,
    question_ids: List[int],
    time_limit: Optional[int] = None
):
    """Instructor creates custom quiz for class"""
    custom_quiz = {
        "quiz_id": str(uuid.uuid4()),
        "name": quiz_name,
        "created_by": instructor_id,
        "question_ids": question_ids,
        "time_limit": time_limit,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    return {
        "success": True,
        "custom_quiz": custom_quiz
    }

@router.get("/stats/user/{user_id}")
async def get_user_stats(user_id: str):
    """Get user's game statistics"""
    # This would query actual database
    mock_stats = {
        "total_games": 23,
        "total_questions": 345,
        "correct_answers": 289,
        "accuracy": 83.8,
        "total_points": 45600,
        "favorite_mode": "quarter_challenge",
        "badges_earned": 5,
        "current_streak": 7,
        "longest_streak": 12,
        "quarters_mastered": ["Q1"],
        "average_time_per_question": 18  # seconds
    }
    
    return {"stats": mock_stats}



# =============================================================================
# CONTENT-SPECIFIC ENTITLEMENT SYSTEM
# =============================================================================

import re
import random as _rand

DEMO_QUESTION_CAP = 10

# Map lesson_node prefix → series key
SERIES_MAP = {
    "Q1": "holiday_4c",
    "Q2": "breakfast",
    "Q3": "breakfast",  # Q3 content is future/extended Break*fast
}


def _classify_product(name: str) -> dict:
    """Parse a product name/id into series + edition."""
    nl = name.lower()
    series = set()
    edition = None

    if any(k in nl for k in ["holiday", "4c", "covenant", "cradle", "cross", "comforter"]):
        series.add("holiday_4c")
    if any(k in nl for k in ["break*fast", "breakfast", "bkft", "nibble", "snack"]):
        series.add("breakfast")
    if "bundle" in nl:
        series.add("holiday_4c")
        series.add("breakfast")
    if "game pass" in nl or "game night" in nl or "mix-up" in nl or "grinch" in nl:
        series.add("holiday_4c")
        series.add("breakfast")

    if any(k in nl for k in ["adult", "- ae", "(ae)", " ae "]):
        edition = "adult"
    elif any(k in nl for k in ["youth", "- ye", "(ye)", " ye "]):
        edition = "youth"

    return {"series": series, "edition": edition}


async def _get_user_entitlements(user_id: str, user_email: str) -> dict:
    """Determine which content series + editions a user has unlocked."""
    if not user_id and not user_email:
        return {"series": set(), "editions": set(), "has_audio": False, "has_instructor": False}

    or_clauses = []
    if user_id:
        or_clauses.append({"claimed_by_user_id": user_id})
    if user_email:
        or_clauses.append({"customer_email": {"$regex": f"^{re.escape(user_email)}$", "$options": "i"}})

    txs = await _trivia_db.payment_transactions.find(
        {"$or": or_clauses, "payment_status": {"$in": ["paid", "completed"]}},
        {"_id": 0, "items": 1},
    ).to_list(100)

    unlocked_series = set()
    unlocked_editions = set()
    has_audio = False
    has_instructor = False

    for tx in txs:
        for item in tx.get("items", []):
            name = item.get("name", "") or item.get("product_id", "")
            classified = _classify_product(name)
            unlocked_series.update(classified["series"])
            if classified["edition"]:
                unlocked_editions.add(classified["edition"])
            nl = name.lower()
            if "full workbook" in nl or "subscription" in nl or "all access" in nl:
                has_audio = True
            if "instructor" in nl or "ie " in nl or " ie" in nl:
                has_instructor = True

    # Also check redeemed submitted_codes with status=processed
    codes = await _trivia_db.submitted_codes.find(
        {"user_id": user_id, "status": "processed"},
        {"_id": 0, "code": 1},
    ).to_list(50)
    for code_doc in codes:
        c = _classify_product(code_doc.get("code", ""))
        unlocked_series.update(c["series"])
        if c["edition"]:
            unlocked_editions.add(c["edition"])

    return {
        "series": unlocked_series,
        "editions": unlocked_editions,
        "has_audio": has_audio,
        "has_instructor": has_instructor,
    }


def _question_series(q: dict) -> str:
    """Return the series key for a question based on lesson_node."""
    node = (q.get("lesson_node") or "").strip()
    if not node:
        return "shared"
    for prefix, series in SERIES_MAP.items():
        if node.startswith(prefix):
            return series
    return "shared"


def _generate_distractors(correct: str, pool: list) -> list:
    """Generate plausible MCQ options for a question that lacks them."""
    # Collect unique correct_answers from other questions as distractors
    candidates = list({q.get("correct_answer", "") for q in pool if q.get("correct_answer", "") != correct and q.get("correct_answer")})
    _rand.shuffle(candidates)
    distractors = candidates[:3]
    # If not enough distractors, add generic ones
    fallbacks = ["None of these", "Not mentioned in Scripture", "All of the above"]
    while len(distractors) < 3:
        fb = fallbacks.pop(0) if fallbacks else f"Option {len(distractors) + 1}"
        if fb != correct:
            distractors.append(fb)
    options = distractors + [correct]
    _rand.shuffle(options)
    return options


@router.get("/entitlements/me")
async def get_my_entitlements(request: Request):
    """Return the caller's unlocked content series and editions."""
    user_id, user_email, role = None, None, None

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ", 1)[1]
        try:
            from jose import jwt
            payload = jwt.decode(token_str, os.environ.get("JWT_SECRET_KEY"), algorithms=["HS256"])
            uid = payload.get("sub")
            if uid:
                user = await _trivia_db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "email": 1, "role": 1})
                if user:
                    user_id = user.get("id")
                    user_email = user.get("email")
                    role = user.get("role")
        except Exception:
            pass

    if not user_id:
        return {"series": [], "editions": [], "has_audio": False, "has_instructor": False, "access_level": "demo"}

    if role in ("admin", "instructor"):
        return {
            "series": ["holiday_4c", "breakfast"],
            "editions": ["adult", "youth"],
            "has_audio": True,
            "has_instructor": True,
            "access_level": "full",
        }

    ent = await _get_user_entitlements(user_id, user_email)
    return {
        "series": sorted(ent["series"]),
        "editions": sorted(ent["editions"]),
        "has_audio": ent["has_audio"],
        "has_instructor": ent["has_instructor"],
        "access_level": "full" if ent["series"] else "demo",
    }


@router.get("/questions/for-game")
async def get_questions_for_game(
    request: Request,
    game_type: Optional[str] = None,
    age_group: Optional[str] = None,
):
    """Return questions gated by content-specific entitlement.
    - Free users → demo cap (10 questions from shared pool).
    - Paid users → full question bank for their unlocked series + shared pool.
    - Admin/instructor → everything.
    """
    user_id, user_email, role = None, None, None
    unlocked_series = set()
    access_level = "demo"

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ", 1)[1]
        try:
            from jose import jwt
            payload = jwt.decode(token_str, os.environ.get("JWT_SECRET_KEY"), algorithms=["HS256"])
            uid = payload.get("sub")
            if uid:
                user = await _trivia_db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "email": 1, "role": 1})
                if user:
                    user_id = user.get("id")
                    user_email = user.get("email")
                    role = user.get("role")
        except Exception:
            pass

    if role in ("admin", "instructor"):
        access_level = "full"
        unlocked_series = {"holiday_4c", "breakfast", "shared"}
    elif user_id:
        ent = await _get_user_entitlements(user_id, user_email)
        unlocked_series = ent["series"]
        if unlocked_series:
            unlocked_series.add("shared")  # shared pool available to any purchaser
            access_level = "full"

    # Build base query
    query = {}
    if game_type:
        query["game_type"] = game_type
    if age_group:
        query["age_group"] = age_group

    all_questions = await _trivia_db.trivia_questions.find(query, {"_id": 0}).to_list(1000)

    if access_level == "demo":
        # Demo: capped set from shared pool only
        shared = [q for q in all_questions if _question_series(q) == "shared"]
        shared.sort(key=lambda q: q.get("qid", 0))
        filtered = shared[:DEMO_QUESTION_CAP]
    else:
        # Full: only questions matching unlocked series
        filtered = [q for q in all_questions if _question_series(q) in unlocked_series]

    _rand.shuffle(filtered)

    # Game-type-specific quality filtering
    if game_type == "trivia_testament":
        # Jeopardy: recall-based. Prefer questions without options. Strip options from all.
        # Prioritize questions that are recall-based (no options or open-ended answers)
        recall = [q for q in filtered if not q.get("options")]
        mcq = [q for q in filtered if q.get("options")]
        # Use recall first, then supplement with MCQ (stripped)
        ordered = recall + mcq
        # Strip options — Jeopardy is prompt + reveal, not MCQ
        for q in ordered:
            q.pop("options", None)
        filtered = ordered

    elif game_type == "tricky_trivia":
        # Millionaire: MCQ only. Must have 3+ options.
        mcq_only = [q for q in filtered if q.get("options") and len(q["options"]) >= 3]
        # Supplement: for questions without options, generate plausible distractors
        no_opts = [q for q in filtered if not q.get("options") or len(q.get("options", [])) < 3]
        for q in no_opts:
            # Create basic distractors from the correct answer
            ans = q.get("correct_answer", "")
            q["options"] = _generate_distractors(ans, filtered)
        filtered = mcq_only + no_opts
        _rand.shuffle(filtered)

    return {
        "questions": filtered,
        "total": len(filtered),
        "access_level": access_level,
        "unlocked_series": sorted(unlocked_series) if unlocked_series else [],
    }



# =============================================================================
# QUESTION BANK BROWSING ENDPOINTS
# =============================================================================

@router.get("/characters")
async def get_available_characters():
    """Get all characters with question counts"""
    pipeline = [
        {"$group": {"_id": "$character", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    results = await _trivia_db.trivia_questions.aggregate(pipeline).to_list(100)
    characters = [{"name": r["_id"], "question_count": r["count"]} for r in results]
    return {"characters": characters, "total": len(characters)}


@router.get("/questions/browse")
async def browse_questions(
    character: Optional[str] = None,
    game_type: Optional[str] = None,
    age_group: Optional[str] = None,
    difficulty: Optional[str] = None,
    page: int = 1,
    per_page: int = 20
):
    """Browse questions with filters"""
    query = {}
    if character:
        query["character"] = character
    if game_type:
        query["game_type"] = game_type
    if age_group:
        query["age_group"] = age_group
    if difficulty:
        query["difficulty"] = difficulty
    
    total = await _trivia_db.trivia_questions.count_documents(query)
    skip = (page - 1) * per_page
    
    questions = await _trivia_db.trivia_questions.find(
        query, {"_id": 0}
    ).skip(skip).limit(per_page).to_list(per_page)
    
    return {
        "questions": questions,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }


@router.get("/word-studies")
async def get_word_studies(character: Optional[str] = None):
    """Get Hebrew/Greek word studies, optionally filtered by character"""
    query = {}
    if character:
        query["character"] = character
    studies = await _trivia_db.word_studies.find(query, {"_id": 0}).to_list(200)
    return {"word_studies": studies, "total": len(studies)}


@router.get("/reference-sources")
async def get_reference_sources():
    """Get all approved reference sources for the curriculum"""
    sources = await _trivia_db.reference_sources.find({}, {"_id": 0}).to_list(50)
    return {"sources": sources, "total": len(sources)}


@router.get("/game-assets")
async def get_game_assets(asset_type: Optional[str] = None):
    """Get game assets like maps and images"""
    query = {}
    if asset_type:
        query["asset_type"] = asset_type
    assets = await _trivia_db.game_assets.find(query, {"_id": 0}).to_list(50)
    return {"assets": assets, "total": len(assets)}


@router.get("/bank/stats")
async def get_question_bank_stats():
    """Get overall stats about the question bank"""
    total = await _trivia_db.trivia_questions.count_documents({})
    
    by_character = await _trivia_db.trivia_questions.aggregate([
        {"$group": {"_id": "$character", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(100)
    
    by_game_type = await _trivia_db.trivia_questions.aggregate([
        {"$group": {"_id": "$game_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(20)
    
    by_age = await _trivia_db.trivia_questions.aggregate([
        {"$group": {"_id": "$age_group", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(10)
    
    by_difficulty = await _trivia_db.trivia_questions.aggregate([
        {"$group": {"_id": "$difficulty", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(10)
    
    word_studies = await _trivia_db.word_studies.count_documents({})
    references = await _trivia_db.reference_sources.count_documents({})
    
    return {
        "total_questions": total,
        "by_character": {r["_id"]: r["count"] for r in by_character},
        "by_game_type": {r["_id"]: r["count"] for r in by_game_type},
        "by_age_group": {r["_id"]: r["count"] for r in by_age},
        "by_difficulty": {r["_id"]: r["count"] for r in by_difficulty},
        "word_studies": word_studies,
        "reference_sources": references
    }
