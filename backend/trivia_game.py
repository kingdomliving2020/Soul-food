# Soul Food: Trivia Mix-up Game System
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import random
import uuid

router = APIRouter(prefix="/trivia", tags=["trivia"])

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

# Question Bank Structure
QUESTIONS_DB = [
    # Q1 M1 - Prayer, the First Resort
    {
        "id": 1,
        "quarter": "Q1",
        "month": "M1",
        "theme": "Prayer, the First Resort",
        "lesson": "Esther: Second Is the Best",
        "category": "Series Structure",
        "type": "multiple_choice",
        "difficulty": "easy",
        "question": "In the Soul Food 'Prayer, the First Resort' quarter, which lesson focuses on Esther's story of being a 'second' queen used by God?",
        "options": ["Esther: Second Is the Best", "Solomon: The Question That Unlocked a Legacy", "Jesus: Prayer as First Resort", "Paul & Silas: Faith in the Dark"],
        "correct_answer": "Esther: Second Is the Best",
        "explanation": "Esther's position as second queen became her divine assignment.",
        "scripture_hint": "Esther 4:14 - 'For such a time as this'"
    },
    {
        "id": 2,
        "quarter": "Q1",
        "month": "M1",
        "theme": "Prayer, the First Resort",
        "lesson": "Solomon: The Question That Unlocked a Legacy",
        "category": "Series Structure",
        "type": "multiple_choice",
        "difficulty": "easy",
        "question": "Which lesson in the 'Prayer, the First Resort' theme centers on Solomon's request for wisdom?",
        "options": ["Esther: Second Is the Best", "Solomon: The Question That Unlocked a Legacy", "Paul & Silas: Faith in the Dark", "Joseph: The Young Dreamer"],
        "correct_answer": "Solomon: The Question That Unlocked a Legacy",
        "explanation": "Solomon's wise request pleased God and unlocked a legacy.",
        "scripture_hint": "1 Kings 3:9 - 'Give your servant a discerning heart'"
    },
    {
        "id": 81,
        "quarter": "Q1",
        "month": "M1",
        "theme": "Prayer, the First Resort",
        "lesson": "Esther: Second Is the Best",
        "category": "Biblical Knowledge",
        "type": "multiple_choice",
        "difficulty": "easy",
        "question": "In the Esther lesson, who challenges her not to stay silent in the palace?",
        "options": ["Haman", "Mordecai", "King Ahasuerus", "Vashti"],
        "correct_answer": "Mordecai",
        "explanation": "Mordecai urged Esther to speak up for her people.",
        "scripture_hint": "Esther 4:13-14"
    },
    {
        "id": 82,
        "quarter": "Q1",
        "month": "M1",
        "theme": "Prayer, the First Resort",
        "lesson": "Esther: Second Is the Best",
        "category": "Biblical Knowledge",
        "type": "multiple_choice",
        "difficulty": "medium",
        "question": "What risk did Esther take when she approached the king uninvited?",
        "options": ["Losing her crown only", "Being publicly embarrassed", "Facing possible death", "Being sent back to Mordecai's house"],
        "correct_answer": "Facing possible death",
        "explanation": "Approaching the king uninvited could result in death unless he extended his scepter.",
        "scripture_hint": "Esther 4:11"
    },
    {
        "id": 83,
        "quarter": "Q1",
        "month": "M1",
        "theme": "Prayer, the First Resort",
        "lesson": "Esther: Second Is the Best",
        "category": "Application",
        "type": "true_false",
        "difficulty": "easy",
        "question": "True or False: In the Soul Food lesson, Esther's position is described as both privilege and assignment.",
        "options": ["True", "False"],
        "correct_answer": "True",
        "explanation": "Her royal position was both a privilege and a divine assignment.",
        "scripture_hint": "Esther 4:14"
    },
    {
        "id": 84,
        "quarter": "Q1",
        "month": "M1",
        "theme": "Prayer, the First Resort",
        "lesson": "Esther: Second Is the Best",
        "category": "Biblical Knowledge",
        "type": "fill_in",
        "difficulty": "medium",
        "question": "Fill in the blank: Before going to the king, Esther called the people to ______ and pray for three days.",
        "correct_answer": "fast",
        "explanation": "Esther asked for a three-day fast before her dangerous mission.",
        "scripture_hint": "Esther 4:16"
    }
    # NOTE: I'll create an endpoint to bulk load all 180 questions from a JSON file
    # This keeps the code cleaner
]

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
    theme: Optional[str] = None
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
    
    # Select questions based on filters
    filtered_questions = QUESTIONS_DB.copy()
    
    if quarter:
        filtered_questions = [q for q in filtered_questions if q["quarter"] == quarter]
    if theme:
        filtered_questions = [q for q in filtered_questions if q["theme"] == theme]
    
    # Apply difficulty progression if needed
    num_questions = mode_config["questions"]
    
    if mode_config.get("difficulty") == "progressive":
        # Sort by difficulty: easy, medium, hard
        easy = [q for q in filtered_questions if q["difficulty"] == "easy"]
        medium = [q for q in filtered_questions if q["difficulty"] == "medium"]
        hard = [q for q in filtered_questions if q["difficulty"] == "hard"]
        
        selected = []
        selected += random.sample(easy, min(5, len(easy)))
        selected += random.sample(medium, min(7, len(medium)))
        selected += random.sample(hard, min(3, len(hard)))
    else:
        selected = random.sample(filtered_questions, min(num_questions, len(filtered_questions)))
    
    question_ids = [q["id"] for q in selected]
    
    # Create session
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
        "first_question": selected[0] if selected else None
    }

@router.get("/question/{question_id}")
async def get_question(question_id: int):
    """Get a specific question"""
    question = next((q for q in QUESTIONS_DB if q["id"] == question_id), None)
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
    # Find question
    question = next((q for q in QUESTIONS_DB if q["id"] == answer.question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if correct
    is_correct = answer.user_answer.strip().lower() == question["correct_answer"].strip().lower()
    
    # Calculate points based on difficulty and time
    points = 0
    if is_correct:
        base_points = {"easy": 100, "medium": 250, "hard": 500}
        points = base_points.get(question["difficulty"], 100)
        
        # Time bonus (faster = more points)
        if answer.time_taken < 10:
            points += 50
        elif answer.time_taken < 20:
            points += 25
    
    return {
        "correct": is_correct,
        "correct_answer": question["correct_answer"],
        "explanation": question["explanation"],
        "scripture_hint": question.get("scripture_hint"),
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
    
    question = next((q for q in QUESTIONS_DB if q["id"] == question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    result = {"lifeline": lifeline, "question_id": question_id}
    
    if lifeline == "fifty_fifty":
        # Remove 2 wrong answers
        correct = question["correct_answer"]
        wrong_answers = [opt for opt in question["options"] if opt != correct]
        remaining_wrong = random.choice(wrong_answers)
        result["remaining_options"] = [correct, remaining_wrong]
        
    elif lifeline == "ask_congregation":
        # Simulate poll results (weighted toward correct answer)
        correct = question["correct_answer"]
        options = question["options"]
        poll = {}
        for opt in options:
            if opt == correct:
                poll[opt] = random.randint(40, 70)
            else:
                poll[opt] = random.randint(5, 20)
        # Normalize to 100%
        total = sum(poll.values())
        poll = {k: round((v/total)*100) for k, v in poll.items()}
        result["poll_results"] = poll
        
    elif lifeline == "scripture_hint":
        result["hint"] = question.get("scripture_hint", "Trust in the Lord!")
        
    elif lifeline == "prayer_pause":
        result["time_added"] = 30  # seconds
    
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
