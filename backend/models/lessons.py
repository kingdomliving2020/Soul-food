from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    FILL_IN_BLANK = "fill_in_blank"
    REFLECTION = "reflection"
    WORD_SCRAMBLE = "word_scramble"
    MULTIPLE_CHOICE = "multiple_choice"

class Question(BaseModel):
    id: str
    type: QuestionType
    prompt: str
    correct_answer: Optional[str] = None  # Hidden until "Check Answers"
    hint: Optional[str] = None
    scrambled_letters: Optional[str] = None  # For word scrambles

class Bite(BaseModel):
    id: str
    title: str
    scripture_ref: str
    scripture_text: str
    teaching: str
    question: Optional[Question] = None
    cst: Optional[str] = None  # Core Shared Truth

class Activity(BaseModel):
    id: str
    title: str
    instructions: str
    questions: List[Question]

class Nibble(BaseModel):
    id: str
    lesson_number: int
    title: str
    series_name: str
    background_text: str
    appetizer: str
    opening_prayer: str
    key_verse_ref: str
    key_verse_text: str
    bites: List[Bite]
    shared_truth: Optional[str] = None
    to_go_box: List[str]
    activity: Optional[Activity] = None
    word_study: Optional[Dict[str, str]] = None
    dessert: Optional[str] = None
    closing_prayer: str
    your_prayer_prompt: Optional[str] = None
    scripture_disclosure: str = "Scripture quotations are from the World English Bible (WEB), public domain."

class SnackPack(BaseModel):
    id: str
    title: str
    series_name: str
    description: str
    nibbles: List[str]  # List of nibble IDs
    total_lessons: int = 4  # Default 4, can be 3 for special packs
    available_in: List[str] = []  # e.g., ["holiday", "breakfast"]
    price_download: float = 7.99
    price_interactive: float = 9.99
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_free_sample: bool = False

class UserLessonProgress(BaseModel):
    user_id: str
    nibble_id: str
    answers: Dict[str, str] = {}  # question_id -> user's answer
    completed_bites: List[str] = []
    answers_checked: bool = False
    score: Optional[int] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    time_spent_seconds: int = 0
