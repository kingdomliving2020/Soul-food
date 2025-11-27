from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Soul Food - Kingdom Living Project API")
api_router = APIRouter(prefix="/api")

# Import trivia game routes
try:
    from trivia_game import router as trivia_router
    api_router.include_router(trivia_router)
    print("✅ Trivia game routes loaded")
except Exception as e:
    print(f"⚠️ Could not load trivia game routes: {e}")
security = HTTPBearer(auto_error=False)

# Soul Food Series Definitions
SOUL_FOOD_SERIES = {
    "breakfast": {
        "name": "Break*fast",
        "theme": "Foundation in Christ",
        "description": "Start your spiritual journey with a strong foundation in Christ",
        "available": True,  # Available at launch
        "order": 1
    },
    "lunch": {
        "name": "Lunch",
        "theme": "Kingdom Relationships",
        "description": "Build meaningful relationships in the Kingdom of God",
        "available": False,  # Locked until Q1 2026
        "unlock_date": "2026-03-01",  # Q1 2026
        "unlock_quarter": "Q1 2026",
        "order": 2
    },
    "dinner": {
        "name": "Dinner",
        "theme": "Finding Your Purpose",
        "description": "Discover your calling and purpose in God's Kingdom",
        "available": False,  # Locked until Q2 2026
        "unlock_date": "2026-06-01",  # Q2 2026
        "unlock_quarter": "Q2 2026",
        "order": 3
    },
    "supper": {
        "name": "Supper",
        "theme": "Maturity in the Faith",
        "description": "Grow into spiritual maturity and wisdom",
        "available": False,  # Locked until Q3 2026
        "unlock_date": "2026-09-01",  # Q3 2026
        "unlock_quarter": "Q3 2026",
        "order": 4
    },
    "holiday": {
        "name": "Holiday Series",
        "theme": "4 C's of Christianity",
        "description": "The Covenant, The Cradle, The Cross, and The Comforter",
        "available": True,  # Available at launch
        "order": 5
    },
    "leap_of_faith": {
        "name": "Leap of Faith",
        "theme": "Mini-Series",
        "description": "Platform exclusive marketing content",
        "available": True,  # Always available for marketing
        "order": 6
    },
    "bonus": {
        "name": "Bonus Content",
        "theme": "Special Lessons",
        "description": "Names of God, Times & Seasons, and more",
        "available": True,
        "order": 7
    }
}

# Edition/Tier Definitions
EDITIONS = {
    "adult": {
        "name": "Adult Edition (AE)", 
        "code": "AE", 
        "price_monthly": 9.99,  # Raised 25% for Black Friday discount room
        "price_ebook": 31.99,  # Raised 25% for Black Friday discount room
        "price_physical": 39.99,  # Physical book pricing
        "description": "Core lessons using WEB (World English Bible) for clarity. Includes interactive workbooks, monthly audible prayers, theme videos, and meal series audio files.",
        "features": [
            "All Soul Food series lessons",
            "WEB Bible for modern clarity",
            "Interactive workbook format",
            "Monthly audible prayers (adult-targeted)",
            "Theme-based teaching videos",
            "General audio per meal series",
            "Community discussion access"
        ]
    },
    "youth": {
        "name": "Youth Edition (YE)", 
        "code": "YE", 
        "age_range": "12-20", 
        "price_monthly": 9.99,  # Raised 25% for Black Friday discount room
        "price_ebook": 31.99,  # Raised 25% for Black Friday discount room
        "price_physical": 39.99,  # Physical book pricing
        "description": "Age-appropriate content with WEB Bible, designed for young believers ages 12-20. Includes engaging activities, youth-targeted prayers, videos, and audio content.",
        "features": [
            "Youth-focused lessons (WEB Bible)",
            "Engaging interactive activities",
            "Monthly youth-targeted prayers",
            "Youth-specific teaching videos",
            "Audio content per meal theme",
            "Peer community access",
            "Parent resources"
        ]
    },
    "instructor": {
        "name": "Instructor Edition (IE)", 
        "code": "IE", 
        "price_monthly": 14.99,  # Raised 25% for Black Friday discount room
        "price_ebook": 68.99,  # Raised 25% for Black Friday discount room
        "price_physical": 79.99,  # Physical book pricing
        "description": "Complete teaching toolkit for facilitating Adult or Youth classes. Includes math connections, dual scripture view, historical references, teaching guides, and all multimedia content.",
        "features": [
            "All Adult & Youth content",
            "Math connections to biblical concepts",
            "Dual scripture view for comparison",
            "Historical reference connections",
            "Teaching guides & answer keys",
            "Discussion prompts & facilitation tips",
            "All multimedia (audio & video)",
            "Downloadable teaching materials"
        ]
    }
}

# Pydantic Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(alias="_id")
    email: str
    name: str
    picture: Optional[str] = None
    edition: str = "adult"  # "adult", "youth", "instructor"
    subscription_type: str = "none"  # "none", "ebook", "subscription"
    subscription_expires: Optional[datetime] = None
    ebook_purchased: bool = False
    is_beta_user: bool = True  # All users are beta users until official launch
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Lesson(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    content: str
    series: str  # "breakfast", "lunch", "dinner", "supper", "holiday", "leap_of_faith", "bonus"
    lesson_number: int
    edition_access: List[str] = ["adult", "youth", "instructor"]  # Which editions can access
    tier_required: str = "free"  # "free", "subscription", "ebook"
    
    # Multimedia Content
    audio_prayer_url: Optional[str] = None  # Monthly audible prayer (target group specific)
    audio_theme_url: Optional[str] = None  # General audio for meal theme
    video_adult_url: Optional[str] = None  # Video for adult edition
    video_youth_url: Optional[str] = None  # Video for youth edition
    
    # Interactive Content
    activities: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Instructor-specific Content
    instructor_notes: Optional[str] = None
    math_connections: Optional[str] = None  # Math connections to biblical concepts
    dual_scripture: Optional[Dict[str, str]] = None  # {"WEB": "text", "KJV": "text", etc.}
    historical_references: Optional[List[str]] = None  # Historical context connections
    discussion_prompts: Optional[List[str]] = None  # For group facilitation
    
    author: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
async def get_current_user(authorization: Optional[HTTPAuthorizationCredentials] = Depends(security), session_token: Optional[str] = None) -> Optional[User]:
    token = None
    
    if session_token:
        token = session_token
    elif authorization:
        token = authorization.credentials
    
    if not token:
        return None
    
    # Find session
    session_doc = await db.user_sessions.find_one({
        "session_token": token,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not session_doc:
        return None
    
    # Find user
    user_doc = await db.users.find_one({"_id": session_doc["user_id"]})
    if not user_doc:
        return None
    
    # Convert datetime strings back to datetime objects
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    if isinstance(user_doc.get('subscription_expires'), str):
        user_doc['subscription_expires'] = datetime.fromisoformat(user_doc['subscription_expires'])
    
    return User(**user_doc)

# Routes
@api_router.get("/")
async def root():
    return {
        "message": "Soul Food - Kingdom Living Project API",
        "tagline": "Spiritual nourishment for every season of life",
        "series": list(SOUL_FOOD_SERIES.keys())
    }

@api_router.get("/series")
async def get_series():
    """Get all Soul Food series with availability status"""
    return {"series": SOUL_FOOD_SERIES}

@api_router.get("/editions")
async def get_editions():
    """Get all available editions"""
    return {"editions": EDITIONS}

@api_router.get("/lessons")
async def get_lessons(
    series: Optional[str] = None,
    edition: Optional[str] = None
):
    """Get lessons filtered by series and edition"""
    query = {}
    if series:
        query["series"] = series
    if edition:
        query["edition_access"] = edition
    
    lessons = await db.lessons.find(query).sort([("series", 1), ("lesson_number", 1)]).to_list(length=None)
    
    # Convert _id to string for JSON serialization
    for lesson in lessons:
        if '_id' in lesson:
            lesson['_id'] = str(lesson['_id'])
        # Add series availability info
        if 'series' in lesson:
            lesson['series_info'] = SOUL_FOOD_SERIES.get(lesson['series'], {})
    
    return {"lessons": lessons}

@api_router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str):
    """Get a single lesson by ID"""
    lesson = await db.lessons.find_one({"id": lesson_id})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Convert _id to string for JSON serialization
    if '_id' in lesson:
        lesson['_id'] = str(lesson['_id'])
    
    # Add series info
    if 'series' in lesson:
        lesson['series_info'] = SOUL_FOOD_SERIES.get(lesson['series'], {})
    
    return lesson

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Initialize Soul Food curriculum
@app.on_event("startup")
async def initialize_data():
    # Check if lessons exist
    lesson_count = await db.lessons.count_documents({})
    if lesson_count == 0:
        # Create Soul Food curriculum
        soul_food_lessons = [
            # LEAP OF FAITH - FREE SAMPLE (Marketing)
            {
                "id": "leap-of-faith-sample",
                "title": "Leap of Faith - My Brother's Keeper & Consistency Pays",
                "description": "A free sample lesson exploring faith through the examples of Abel and Enoch.",
                "content": "# My Brother's Keeper & Consistency Pays\n\n**Key Verse:** \"Now faith is the substance of things hoped for, the evidence of things not seen.\" (Heb 11:1)\n\n**Background Scriptures:** Gen 4:1-11; Gen 5:21-24; Heb 11\n\n---\n\n## Introduction\n\nIn Hebrews 11, it details many people throughout the Bible that showed a variety of examples of faith, some of those examples seem very \"obvious\" or simple to show while others are a little more obscure or take more time to understand how they made it into the chapter.\n\n---\n\n## My Brother's Keeper (Gen 4:1-11)\n\nAbel and Cain's story teaches us about faithful worship and responsibility to our brothers and sisters in Christ.\n\n**Questions:**\n\n1. What was Abel's occupation?\n2. Why was Cain's offering not accepted?\n3. How did Cain complicate his mistake?\n4. What were the consequences for what he did?\n5. How come you think Abel made the list in Heb 11?\n\n---\n\n## Consistency Pays (Gen 5:21-24)\n\nEnoch walked with God for 300 years! His consistency was so pleasing to God that he was translated to heaven without seeing death.\n\n---\n\n## Conclusion\n\nAbel and Enoch showed us that being faithful and serving God consistently doesn't go unrewarded. God is looking for men and women from ALL nations who understand that faith lies just beyond their natural abilities.",
                "series": "leap_of_faith",
                "lesson_number": 1,
                "edition_access": ["adult", "youth", "instructor"],
                "tier_required": "free",
                "author": "Ministry Team",
                "activities": [
                    {
                        "type": "crossword",
                        "title": "Kingdom Crosses",
                        "clues": {
                            "across": {
                                "3": "Abel's sacrifice was more _______",
                                "4": "Type of offering Abel brought",
                                "6": "My brother's _______",
                                "7": "Enoch _______ with God"
                            },
                            "down": {
                                "1": "Substance of things hoped for",
                                "2": "Abel's brother",
                                "5": "Enoch was _______ to heaven",
                                "8": "Who offered the better sacrifice"
                            }
                        }
                    }
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            
            # BREAKFAST SERIES - Foundation in Christ
            {
                "id": "breakfast-1-esther",
                "title": "Esther - Courage in Crisis",
                "description": "Learn how Esther used prayer and fasting to approach an impossible situation with faith and courage.",
                "content": "# Esther - Courage in Crisis\n\n## Foundation of Prayer\n\nEsther's story teaches us that prayer is the first resort, not the last. When faced with impossible odds, she didn't panic - she prayed and fasted.\n\n## Key Lessons:\n\n1. **God uses people from all backgrounds** - Esther's heritage didn't disqualify her\n2. **Community prayer matters** - She asked others to join her in fasting\n3. **Courage transcends culture** - Faith gives boldness regardless of background\n\n## Reflection Questions:\n\n1. How has your cultural background been used by God?\n2. When have you needed courage to stand up for what's right?\n3. How can diverse communities strengthen each other through prayer?",
                "series": "breakfast",
                "lesson_number": 1,
                "edition_access": ["adult", "youth", "instructor"],
                "tier_required": "subscription",
                "author": "Dee",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            
            # HOLIDAY SERIES - 4 C's of Christianity
            {
                "id": "holiday-cradle",
                "title": "The Cradle: Christ's Birth",
                "description": "Celebrate the miraculous birth of our Savior and what it means for all nations.",
                "content": "# The Cradle: Christ's Birth\n\n**Key Verse:** \"For unto you is born this day in the city of David a Saviour, which is Christ the Lord.\" (Luke 2:11)\n\n## The 4 C's of Christianity: The Cradle\n\nThe Cradle represents the humble beginning of our Savior's earthly journey. Born in a manger, Jesus came for ALL people - every nation, tribe, and tongue.\n\n## The Universal Gift\n\nThe shepherds, the wise men from the East, and people from every walk of life were invited to witness the birth of our Savior. This wasn't just for one nation - it was God's gift to the entire world.\n\n## Reflection Questions:\n1. How does Christ's humble birth teach us about God's character?\n2. Why is it significant that Jesus was born in a manger, not a palace?\n3. How can you share the gift of Christ's birth with people from different backgrounds?",
                "series": "holiday",
                "lesson_number": 1,
                "edition_access": ["adult", "youth", "instructor"],
                "tier_required": "subscription",
                "author": "Dee",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            
            {
                "id": "holiday-cross",
                "title": "The Cross: Sacrifice and Victory",
                "description": "Understand the power of Christ's sacrifice and the victory of His resurrection.",
                "content": "# The Cross: Sacrifice and Victory\n\n**Key Verse:** \"But he was wounded for our transgressions, he was bruised for our iniquities.\" (Isaiah 53:5)\n\n## The 4 C's of Christianity: The Cross\n\nThe Cross represents the ultimate sacrifice of love. Jesus died for all humanity - not just one nation, but for every race, culture, and background.\n\n## The Cross for All Nations\n\nChrist's sacrifice wasn't limited to one group of people. His blood was shed for the sins of the whole world. The Cross is the great equalizer - at the foot of the Cross, we are all sinners in need of a Savior.\n\n## Victory Through Death\n\nThe resurrection proves that death has been defeated. All who believe, regardless of their origin, can have eternal life through Jesus Christ.\n\n## Reflection Questions:\n1. What does the Cross mean to you personally?\n2. How does understanding that Christ died for ALL people impact your view of others?\n3. How can you share the message of the Cross with those who don't know Jesus?",
                "series": "holiday",
                "lesson_number": 2,
                "edition_access": ["adult", "youth", "instructor"],
                "tier_required": "subscription",
                "author": "Rose",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            
            {
                "id": "holiday-covenant",
                "title": "The Covenant: God's Eternal Promise",
                "description": "Explore God's covenant relationship with His people throughout history.",
                "content": "# The Covenant: God's Eternal Promise\n\n**Key Verse:** \"And I will establish my covenant between me and thee and thy seed after thee in their generations for an everlasting covenant.\" (Genesis 17:7)\n\n## The 4 C's of Christianity: The Covenant\n\nFrom the beginning, God has been a covenant-making God. He established covenants with Noah, Abraham, Moses, David, and ultimately through Jesus Christ - the New Covenant for all who believe.\n\n## A Promise for All Nations\n\nGod's covenant with Abraham included the promise that \"all nations shall be blessed through you.\" This wasn't just for the Jewish people - it was always God's plan to include all peoples in His covenant family.\n\n## The New Covenant\n\nThrough Christ's blood, we enter into a new covenant - not based on our works, but on His grace. This covenant is available to everyone who believes.\n\n## Reflection Questions:\n1. What does it mean to be in covenant relationship with God?\n2. How does understanding God's faithfulness to His covenants strengthen your faith?\n3. How can you live as a covenant keeper in your daily life?",
                "series": "holiday",
                "lesson_number": 3,
                "edition_access": ["adult", "youth", "instructor"],
                "tier_required": "subscription",
                "author": "Ministry Team",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            
            {
                "id": "holiday-comforter",
                "title": "The Comforter: The Holy Spirit",
                "description": "Discover the role of the Holy Spirit as our Comforter, Guide, and Power.",
                "content": "# The Comforter: The Holy Spirit\n\n**Key Verse:** \"But the Comforter, which is the Holy Ghost, whom the Father will send in my name, he shall teach you all things.\" (John 14:26)\n\n## The 4 C's of Christianity: The Comforter\n\nJesus promised that He would not leave us alone. He sent the Holy Spirit - the Comforter - to be with us always, to guide us, teach us, and empower us for service.\n\n## The Spirit for All Believers\n\nOn the day of Pentecost, the Holy Spirit fell on believers from many nations, speaking through them in different languages. This demonstrated that the Spirit is given to all who believe - regardless of background or ethnicity.\n\n## Living in the Spirit\n\nThe Holy Spirit empowers us to live the Christian life. He convicts us of sin, guides us into truth, and produces fruit in our lives - love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.\n\n## Reflection Questions:\n1. How have you experienced the Holy Spirit's comfort in your life?\n2. What does it mean to be filled with the Spirit?\n3. How can you be more sensitive to the Spirit's leading in your daily decisions?",
                "series": "holiday",
                "lesson_number": 4,
                "edition_access": ["adult", "youth", "instructor"],
                "tier_required": "subscription",
                "author": "Joel",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            
            # BONUS CONTENT
            {
                "id": "bonus-names-of-god",
                "title": "Names of God",
                "description": "Explore the powerful names of God and what they reveal about His character.",
                "content": "# Names of God\n\n## Jehovah Jireh - The Lord Will Provide\n\nGod is our provider in every season of life.\n\n## El Shaddai - God Almighty\n\nNo challenge is too great for our God.\n\n## Jehovah Shalom - The Lord is Peace\n\nIn the midst of chaos, God brings peace.\n\n## Reflection\n\nWhich name of God speaks to your current season? How can understanding God's names strengthen your faith?",
                "series": "bonus",
                "lesson_number": 1,
                "edition_access": ["adult", "youth", "instructor"],
                "tier_required": "subscription",
                "author": "Ministry Team",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            
            {
                "id": "bonus-times-seasons",
                "title": "Times & Seasons",
                "description": "Understanding God's timing in our lives and the seasons of faith.",
                "content": "# Times & Seasons\n\n**Key Verse:** \"To everything there is a season, and a time to every purpose under the heaven.\" (Ecclesiastes 3:1)\n\n## Seasons of Life\n\nJust as nature has seasons, so does our spiritual walk. There are seasons of planting, growing, harvesting, and resting.\n\n## God's Perfect Timing\n\nGod's timing is never early and never late. Learning to trust His timing is a crucial part of spiritual maturity.\n\n## Reflection Questions:\n\n1. What season are you in right now?\n2. How can you embrace this season rather than rush through it?\n3. What is God teaching you in this time?",
                "series": "bonus",
                "lesson_number": 2,
                "edition_access": ["adult", "youth", "instructor"],
                "tier_required": "subscription",
                "author": "Temia",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        await db.lessons.insert_many(soul_food_lessons)
        logger.info(f"Soul Food curriculum initialized: {len(soul_food_lessons)} lessons created")
        logger.info("Available at launch: Break*fast Series, Holiday Series (4 C's), Leap of Faith")
        logger.info("Coming Q1 2026: Lunch, Dinner, Supper series")
