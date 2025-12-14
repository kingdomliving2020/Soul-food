from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/api/lessons", tags=["lessons"])

# In His Image Series - 5th Week Snack Pack
IN_HIS_IMAGE_NIBBLES = [
    {
        "id": "in-his-image-1",
        "lesson_number": 1,
        "title": "Made in His Image",
        "series_name": "In His Image",
        "background_text": "Genesis 1:1–5; 1:26–27; Psalm 139:13–16; Matthew 6:21; John 1:1–3; Colossians 1:15–20",
        "appetizer": "As the world and social pressures place emphasis on material things—what you can obtain—or temporal things—how you look, how you compare, or how you are perceived—it becomes increasingly important to pause and reassess what the Bible says about us and what truly matters most. Many of us were raised in survival-focused environments. Parents did the best they could to provide necessities. Some of us grew up in single-parent households, blended families, foster care, adoption, or with extended family stepping in. These early dynamics quietly shape how we see ourselves and what we believe we're worth. Because of this, our sense of identity—and sometimes our sense of belonging—could use a wellness check.",
        "opening_prayer": "God, thank You for the opportunity to pull back the veil of eternity and peer into what You have prepared for us. Open our understanding. We declare that our minds are fertile ground for truth and revelation. Help us see ourselves as You intended from the beginning. In Jesus' name, amen.",
        "key_verse_ref": "Genesis 1:27 (WEB)",
        "key_verse_text": "So God created man in his own image. In the image of God he created him; male and female he created them.",
        "bites": [
            {
                "id": "bite-1-1",
                "title": "God's Original Intent",
                "scripture_ref": "Genesis 1:1, 26 (WEB)",
                "scripture_text": "\"In the beginning God created the heavens and the earth.\" \"Then God said, 'Let's make man in our image, after our likeness.'\"",
                "teaching": "Creation begins with order, intention, and purpose. Everything God makes follows a cadence—light, land, life. When God reaches humanity, He pauses. This shift signals that humanity is not just another created thing, but a reflection of God Himself. Being made in God's image means value was established before performance, behavior, or failure. Identity was given, not earned.",
                "question": {
                    "id": "q-1-1",
                    "type": "reflection",
                    "prompt": "What does it mean to you to know that God was intentional when He created humanity—and you?"
                }
            },
            {
                "id": "bite-1-2",
                "title": "The Image Was Distorted, Not Destroyed",
                "scripture_ref": "John 1:1, 3; Col 1:17 (WEB)",
                "scripture_text": "\"In the beginning was the Word… All things were made through him.\" \"He is before all things, and in him all things are held together.\"",
                "teaching": "Sin entered the garden and distorted what was once whole, much like good code becoming corrupted. But distortion is not deletion. Jesus was present at creation and remains central to restoration. God did not abandon His original design—He made a way to restore it. Through Christ, broken identity can be realigned with original intent.",
                "question": {
                    "id": "q-1-2",
                    "type": "reflection",
                    "prompt": "How does knowing Christ holds all things together change how you view your broken or unfinished areas?"
                }
            },
            {
                "id": "bite-1-3",
                "title": "You Are God's Treasure",
                "scripture_ref": "Matthew 6:21 (WEB)",
                "scripture_text": "\"For where your treasure is, there your heart will be also.\"",
                "teaching": "God's actions reveal His priorities. He sent His Son because humanity mattered deeply to Him. You don't send what is most valuable unless what you are redeeming is worth the cost. God put eternity where His heart was.",
                "question": {
                    "id": "q-1-3",
                    "type": "reflection",
                    "prompt": "What does God's willingness to send His Son reveal about how He values you?"
                }
            }
        ],
        "shared_truth": "God does not make mistakes. The image was damaged, not erased. You are not disqualified from restoration.",
        "to_go_box": [
            "God created humanity with intention",
            "Identity came before performance",
            "Christ restores what was distorted",
            "You matter deeply to God"
        ],
        "activity": {
            "id": "activity-1",
            "title": "Complete the Statements",
            "instructions": "Complete the statements below:",
            "questions": [
                {
                    "id": "a-1-1",
                    "type": "fill_in_blank",
                    "prompt": "One belief about myself that needs healing is __________."
                },
                {
                    "id": "a-1-2",
                    "type": "fill_in_blank",
                    "prompt": "Knowing I was created in God's image helps me see myself as __________."
                },
                {
                    "id": "a-1-3",
                    "type": "fill_in_blank",
                    "prompt": "One area where I desire restoration is __________."
                }
            ]
        },
        "closing_prayer": "God, thank You for seeing me as worth restoring. Help me walk toward the wholeness You intended from the beginning.",
        "your_prayer_prompt": "Take a moment and write a prayer for yourself or loved one that may need divine support with coming into wholeness and embracing their purpose as they walk in or discover Heaven's view of them."
    },
    {
        "id": "in-his-image-2",
        "lesson_number": 2,
        "title": "Accepted and Loved",
        "series_name": "In His Image",
        "background_text": "Luke 19:1–10, Luke 5:31–32",
        "appetizer": "Zacchaeus lived with money and power, yet carried the weight of rejection. Though wealthy, he was isolated. His curiosity about Jesus was real, but his posture revealed distance—close enough to see, far enough to stay hidden. Many of us recognize that tension: wanting to be seen by God, but unsure if we will be accepted once we are. This lesson explores how Jesus responds to people who live on the margins—those carrying shame, reputation, or unresolved pasts—and what acceptance truly produces.",
        "opening_prayer": "Lord, as we come to Your Word, quiet every voice that has spoken rejection, limitation, or shame over our lives. Prepare our hearts to receive truth—not as information, but as healing. Help us recognize Your invitation and respond without fear. In Jesus' name, amen.",
        "key_verse_ref": "Luke 5:31 (WEB)",
        "key_verse_text": "Those who are healthy have no need for a physician, but those who are sick.",
        "bites": [
            {
                "id": "bite-2-1",
                "title": "Jesus Initiates Acceptance",
                "scripture_ref": "Luke 19:5 (WEB)",
                "scripture_text": "\"Zacchaeus, hurry and come down, for today I must stay at your house.\"",
                "teaching": "Jesus does not wait for Zacchaeus to repent publicly or explain his past. He calls him by name and invites Himself into Zacchaeus' personal space. Acceptance is initiated by Christ, not earned by behavior.",
                "question": {
                    "id": "q-2-1",
                    "type": "reflection",
                    "prompt": "What does it reveal about Jesus that He initiated the relationship instead of waiting for Zacchaeus to change first?"
                },
                "cst": "Acceptance begins with Jesus, not with me."
            },
            {
                "id": "bite-2-2",
                "title": "Grace Is Not Delayed by Opinion",
                "scripture_ref": "Luke 19:7 (WEB)",
                "scripture_text": "\"They all murmured, saying, 'He has gone in to lodge with a man who is a sinner.'\"",
                "teaching": "The crowd focused on Zacchaeus' reputation; Jesus focused on restoration. Public judgment did not alter divine intention. Grace moves even when people disagree.",
                "question": {
                    "id": "q-2-2",
                    "type": "reflection",
                    "prompt": "Where have other people's opinions caused you to hesitate in responding to God?"
                },
                "cst": "God's acceptance outweighs public judgment."
            },
            {
                "id": "bite-2-3",
                "title": "Acceptance Produces Change",
                "scripture_ref": "Luke 19:8 (WEB)",
                "scripture_text": "\"Behold, Lord, half of my goods I give to the poor… I restore four times as much.\"",
                "teaching": "Zacchaeus' response is immediate and tangible. Grace does not leave him passive; it produces action, integrity, and restitution.",
                "question": {
                    "id": "q-2-3",
                    "type": "reflection",
                    "prompt": "What kind of change should acceptance by Christ produce in a person's life?"
                },
                "cst": "Grace moves me toward transformation."
            }
        ],
        "word_study": {
            "Accepted (dechomai)": "To receive willingly; to welcome without reservation. In this passage, acceptance is not tolerance—it is intentional reception that leads to relationship and change.",
            "Tselem (צֶלֶם)": "'image'; representation, likeness, reflection",
            "Demuth (דְּמוּת)": "'likeness'; resemblance, pattern. Together these words show that humans were created to reflect God's nature, not replace it."
        },
        "to_go_box": [
            "Jesus initiates relationship with the overlooked",
            "Acceptance comes before approval",
            "Grace leads to visible, practical change"
        ],
        "activity": {
            "id": "activity-2",
            "title": "Word Scramble",
            "instructions": "Unscramble the words below related to today's lesson (Hint: all words describe what Christ offers and produces):",
            "questions": [
                {
                    "id": "ws-2-1",
                    "type": "word_scramble",
                    "prompt": "EECCATNPA",
                    "scrambled_letters": "EECCATNPA",
                    "correct_answer": "ACCEPTANCE"
                },
                {
                    "id": "ws-2-2",
                    "type": "word_scramble",
                    "prompt": "EORETRS",
                    "scrambled_letters": "EORETRS",
                    "correct_answer": "RESTORE"
                },
                {
                    "id": "ws-2-3",
                    "type": "word_scramble",
                    "prompt": "ECARG",
                    "scrambled_letters": "ECARG",
                    "correct_answer": "GRACE"
                }
            ]
        },
        "closing_prayer": "Lord, thank You for creating me with intention and care. Help me release every false identity I've carried and receive the truth of who You say I am. Restore what has been distorted and let my life reflect Your image. Amen."
    },
    {
        "id": "in-his-image-3",
        "lesson_number": 3,
        "title": "Chosen of God",
        "series_name": "In His Image",
        "background_text": "Ephesians 1:1–14, Job 1:1, 6–8, Luke 5:31–32",
        "appetizer": "Job 1:1, 6, 8 (WEB) - \"There was a man in the land of Uz, whose name was Job; and that man was blameless and upright, and one who feared God, and turned away from evil.\" Before any trial unfolds, God publicly names Job's character. The challenge does not define Job; God's declaration does. Scripture establishes identity before circumstance attempts to redefine it. Being chosen by God does not remove testing, but it does clarify who has authority to name worth.",
        "opening_prayer": "Father, as we study Your Word today, help us understand the depth of what it means to be chosen by You. Remove any voice of rejection or comparison. Let Your truth settle in our hearts. In Jesus' name, amen.",
        "key_verse_ref": "Luke 5:31–32 (KJV)",
        "key_verse_text": "And Jesus answering said unto them, They that are whole need not a physician; but they that are sick. I came not to call the righteous, but sinners to repentance.",
        "bites": [
            {
                "id": "bite-3-1",
                "title": "Chosen Before History Began",
                "scripture_ref": "Ephesians 1:1, 3–4 (WEB)",
                "scripture_text": "\"Paul, an apostle of Christ Jesus through the will of God… Blessed be the God and Father of our Lord Jesus Christ, who has blessed us with every spiritual blessing in the heavenly places in Christ, even as he chose us in him before the foundation of the world, that we would be holy and without blame before him in love.\"",
                "teaching": "Paul grounds identity in God's will, not human qualification. God's choosing occurs before the foundation of the world, which removes performance as the basis for worth. This passage teaches that holiness and blamelessness are outcomes of God's choice, not prerequisites for it. Identity is settled prior to history; formation follows within history.",
                "question": {
                    "id": "q-3-1",
                    "type": "reflection",
                    "prompt": "How does knowing God chose you before time began reshape how you judge your present worth?"
                },
                "cst": "God's choice of me predates my performance."
            },
            {
                "id": "bite-3-2",
                "title": "Chosen for Adoption and Acceptance",
                "scripture_ref": "Ephesians 1:5–6 (WEB)",
                "scripture_text": "\"Having predestined us for adoption as children through Jesus Christ to himself, according to the good pleasure of his desire, to the praise of the glory of his grace, by which he freely gave us favor in the Beloved.\"",
                "teaching": "Adoption speaks to placement and permanence. God's choosing is not merely functional; it is relational. Acceptance is granted in Christ, not negotiated through comparison or sustained by ongoing evaluation. The text emphasizes God's pleasure and grace as the source of belonging.",
                "question": {
                    "id": "q-3-2",
                    "type": "reflection",
                    "prompt": "What changes when you understand you were chosen for belonging rather than evaluation?"
                },
                "cst": "I was chosen to belong, not to compete."
            },
            {
                "id": "bite-3-3",
                "title": "Chosen With Redemption, Purpose, and Inheritance",
                "scripture_ref": "Ephesians 1:7, 11–12 (WEB)",
                "scripture_text": "\"In him we have redemption through his blood, the forgiveness of our trespasses, according to the riches of his grace… In him we were also assigned an inheritance… so that we would be for the praise of his glory.\"",
                "teaching": "God's choosing includes redemption and forgiveness, establishing freedom from guilt. It also assigns inheritance, indicating continuity and responsibility. Purpose flows from identity; it is not pressure to perform but placement to participate in God's redemptive work.",
                "question": {
                    "id": "q-3-3",
                    "type": "reflection",
                    "prompt": "What responsibility comes with being chosen as part of God's redemptive plan?"
                },
                "cst": "God's choice of me includes purpose."
            }
        ],
        "word_study": {
            "Eklegomai (ἐκλέγομαι)": "'to choose out; to select deliberately'",
            "Huiothesia (υἱοθεσία)": "'adoption'; placement as a son with full rights. Together these words show that God's choosing is intentional and permanent—selection with secure placement, identity, and inheritance."
        },
        "dessert": "God's choosing was never about who measured up; it was about who He determined to redeem and restore.",
        "to_go_box": [
            "God chose before time began",
            "Adoption establishes identity and belonging",
            "Purpose flows from redemption, not pressure"
        ],
        "activity": {
            "id": "activity-3",
            "title": "Scripture Facts (Fill-in-the-Blank)",
            "instructions": "Fill in the blanks with answers from today's lesson:",
            "questions": [
                {
                    "id": "fib-3-1",
                    "type": "fill_in_blank",
                    "prompt": "God chose us before the __________.",
                    "correct_answer": "foundation of the world",
                    "hint": "Ephesians 1:4"
                },
                {
                    "id": "fib-3-2",
                    "type": "fill_in_blank",
                    "prompt": "We were predestined for __________ through Jesus Christ.",
                    "correct_answer": "adoption",
                    "hint": "Ephesians 1:5"
                },
                {
                    "id": "fib-3-3",
                    "type": "fill_in_blank",
                    "prompt": "In Christ, we have obtained an __________.",
                    "correct_answer": "inheritance",
                    "hint": "Ephesians 1:11"
                }
            ]
        },
        "closing_prayer": "Father God, thank You for choosing me with intention and wisdom. Help me see myself through Your Word rather than comparison or rejection. Teach me to live as one who belongs to You—secure in identity, grounded in purpose, and faithful in calling. Amen."
    }
]

# Snack Pack definition
IN_HIS_IMAGE_SNACK_PACK = {
    "id": "in-his-image-snack-pack",
    "title": "In His Image - Self Worth Series",
    "series_name": "In His Image",
    "description": "A 3-lesson journey exploring your God-given identity, acceptance, and purpose. Discover what it means to be made in God's image, accepted and loved by Christ, and chosen for a divine purpose.",
    "nibbles": ["in-his-image-1", "in-his-image-2", "in-his-image-3"],
    "total_lessons": 3,
    "available_in": ["holiday", "breakfast"],
    "price_download": 7.99,
    "price_interactive": 9.99,
    "is_free_sample": False
}

@router.get("/snack-packs")
async def get_snack_packs():
    """Get all available snack packs"""
    return {
        "snack_packs": [IN_HIS_IMAGE_SNACK_PACK]
    }

@router.get("/snack-pack/{pack_id}")
async def get_snack_pack(pack_id: str):
    """Get a specific snack pack with its nibbles"""
    if pack_id == "in-his-image-snack-pack":
        return {
            "snack_pack": IN_HIS_IMAGE_SNACK_PACK,
            "nibbles": IN_HIS_IMAGE_NIBBLES
        }
    raise HTTPException(status_code=404, detail="Snack pack not found")

@router.get("/nibbles")
async def get_all_nibbles():
    """Get all available nibbles"""
    return {
        "nibbles": [
            {
                "id": n["id"],
                "lesson_number": n["lesson_number"],
                "title": n["title"],
                "series_name": n["series_name"],
                "key_verse_ref": n["key_verse_ref"]
            } for n in IN_HIS_IMAGE_NIBBLES
        ]
    }

@router.get("/nibble/{nibble_id}")
async def get_nibble(nibble_id: str):
    """Get a specific nibble (lesson)"""
    for nibble in IN_HIS_IMAGE_NIBBLES:
        if nibble["id"] == nibble_id:
            return {"nibble": nibble}
    raise HTTPException(status_code=404, detail="Nibble not found")

@router.post("/progress/save")
async def save_progress(data: dict):
    """Save user's lesson progress and answers"""
    # In production, this would save to MongoDB
    return {
        "success": True,
        "message": "Progress saved",
        "data": data
    }

@router.post("/progress/check-answers")
async def check_answers(data: dict):
    """Check user's answers against correct answers"""
    nibble_id = data.get("nibble_id")
    user_answers = data.get("answers", {})
    
    # Find the nibble
    nibble = None
    for n in IN_HIS_IMAGE_NIBBLES:
        if n["id"] == nibble_id:
            nibble = n
            break
    
    if not nibble:
        raise HTTPException(status_code=404, detail="Nibble not found")
    
    # Get correct answers from activity
    results = []
    correct_count = 0
    total_gradable = 0
    
    if nibble.get("activity"):
        for q in nibble["activity"]["questions"]:
            q_id = q["id"]
            user_answer = user_answers.get(q_id, "").strip().lower()
            correct_answer = q.get("correct_answer", "").strip().lower()
            
            if correct_answer:  # Only grade if there's a correct answer
                total_gradable += 1
                is_correct = user_answer == correct_answer
                if is_correct:
                    correct_count += 1
                results.append({
                    "question_id": q_id,
                    "user_answer": user_answers.get(q_id, ""),
                    "correct_answer": q.get("correct_answer"),
                    "is_correct": is_correct,
                    "hint": q.get("hint")
                })
            else:
                # Reflection questions - no grading, just acknowledge
                results.append({
                    "question_id": q_id,
                    "user_answer": user_answers.get(q_id, ""),
                    "type": "reflection",
                    "acknowledged": True
                })
    
    score = (correct_count / total_gradable * 100) if total_gradable > 0 else None
    
    return {
        "success": True,
        "results": results,
        "score": score,
        "correct_count": correct_count,
        "total_gradable": total_gradable
    }
