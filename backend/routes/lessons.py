from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorDatabase

# Import PDF generator
from utils.pdf_generator import LessonPDFGenerator

router = APIRouter(prefix="/interactive-lessons", tags=["interactive-lessons"])

# Initialize PDF generator
pdf_generator = LessonPDFGenerator()

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
        "your_prayer_prompt": "Take a moment and write a prayer for yourself or loved one that may need divine support with coming into wholeness and embracing their purpose as they walk in or discover Heaven's view of them.",
        "price_download": 0,
        "price_interactive": 0,
        "is_free": True
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
        "closing_prayer": "Lord, thank You for creating me with intention and care. Help me release every false identity I've carried and receive the truth of who You say I am. Restore what has been distorted and let my life reflect Your image. Amen.",
        "price_download": 0,
        "price_interactive": 0,
        "is_free": True
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
        "closing_prayer": "Father God, thank You for choosing me with intention and wisdom. Help me see myself through Your Word rather than comparison or rejection. Teach me to live as one who belongs to You—secure in identity, grounded in purpose, and faithful in calling. Amen.",
        "price_download": 0,
        "price_interactive": 0,
        "is_free": True
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
    "price_download": 0,
    "price_interactive": 0,
    "is_free": True,
    "is_free_sample": True
}

# =============================================================================
# HOLIDAY SERIES - Adult Edition (AE) - The 4 C's of Christianity
# Theme: The Covenant, The Cradle, The Cross, and The Comforter
# =============================================================================

HOLIDAY_AE_NIBBLES = [
    # LESSON 1: THE COVENANT
    {
        "id": "holiday-ae-covenant",
        "lesson_number": 1,
        "title": "The Covenant",
        "series_name": "Holiday Series AE",
        "edition": "adult",
        "theme": "The Promise Still Stands",
        "background_text": "Genesis 12:1–3; Gen 15; Jer 31:31–34; Luke 1:67–75 (WEB)",
        "appetizer": "Genesis 12:1–3 (WEB) \"Now Yahweh said to Abram, 'Leave your country… and I will make of you a great nation… and in you all the families of the earth will be blessed.'\" God initiated the covenant — not because Abram deserved it, but because God desired a relationship with humanity. The Covenant reveals the heart of a God who moves toward His people even after the fall.",
        "opening_prayer": "Lord, thank You for being a promise-keeping God. Help us trust Your covenant faithfulness in every season of life. Amen.",
        "key_verse_ref": "2 Corinthians 1:20 (WEB)",
        "key_verse_text": "For however many are the promises of God, in him is the 'Yes.' Therefore also through him is the 'Amen,' to the glory of God through us.",
        "bites": [
            {
                "id": "covenant-bite-1",
                "title": "God Starts the Story",
                "scripture_ref": "Genesis 15:5–6 (WEB)",
                "scripture_text": "Yahweh brought him outside, and said, 'Look now toward the sky… so shall your offspring be.' Abram believed Yahweh…",
                "teaching": "God's promises are built on His character, not human perfection. Even when Abram doubted, God remained committed. The Covenant says: 'My Word is stronger than your weakness.'",
                "question": {
                    "id": "covenant-q-1",
                    "type": "reflection",
                    "prompt": "Where in your life have you seen God make the first move toward you?"
                }
            },
            {
                "id": "covenant-bite-2",
                "title": "The Covenant Expands",
                "scripture_ref": "Jeremiah 31:33 (WEB)",
                "scripture_text": "I will put my law in their inward parts… and I will be their God, and they shall be my people.",
                "teaching": "This prophecy points directly to Jesus, the New Covenant, where God no longer writes on stone but on human hearts.",
                "question": {
                    "id": "covenant-q-2",
                    "type": "reflection",
                    "prompt": "Which promise of God do you struggle to trust, and why?"
                }
            },
            {
                "id": "covenant-bite-3",
                "title": "The Promise Arrives in Christ",
                "scripture_ref": "Luke 1:72–73 (WEB)",
                "scripture_text": "To show mercy… and to remember his holy covenant, the oath which he swore to Abraham our father.",
                "teaching": "The birth of Jesus is not just a moment in a manger — it is the visible fulfillment of a promise made thousands of years earlier. Christmas is proof that God keeps His Word."
            }
        ],
        "dessert": "Galatians 3:16 (WEB) \"The promises were spoken to Abraham… 'to your offspring,' which is Christ.\" Jesus is the 'Yes' to every promise God ever made. In Him, we see God's reliability — steady, unfailing, unchanging.",
        "shared_truth": "God made a promise. God kept a promise. God still keeps His promises.",
        "to_go_box": [
            "God made a promise",
            "God kept a promise",
            "God still keeps His promises",
            "When you cannot see the way forward, look backward at His faithfulness"
        ],
        "word_study": {
            "Covenant (Berit)": "A binding, relational promise initiated by God",
            "Yahweh": "The covenant name of God revealed to Moses; meaning 'I AM,' the self-existent, eternal One"
        },
        "activity": {
            "id": "covenant-activity",
            "title": "Fill in the Blanks",
            "instructions": "Complete the statements below:",
            "questions": [
                {
                    "id": "covenant-a-1",
                    "type": "fill_in_blank",
                    "prompt": "A covenant is a sacred, __________ agreement God initiated.",
                    "correct_answer": "binding"
                },
                {
                    "id": "covenant-a-2",
                    "type": "fill_in_blank",
                    "prompt": "God promised Abraham that all __________ on earth would be blessed.",
                    "correct_answer": "families"
                },
                {
                    "id": "covenant-a-3",
                    "type": "fill_in_blank",
                    "prompt": "Jesus' birth is the __________ of God's ancient promise.",
                    "correct_answer": "fulfillment"
                },
                {
                    "id": "covenant-a-4",
                    "type": "fill_in_blank",
                    "prompt": "God's promises stand because of His __________, not our perfection.",
                    "correct_answer": "character"
                }
            ]
        },
        "closing_prayer": "Lord, thank You for being a promise-keeping God. Help us trust Your covenant faithfulness in every season of life. Amen.",
        "your_prayer_prompt": "Write your own short prayer about trusting God's promises:",
        "scripture_disclosure": "Scripture quotations are from the World English Bible (WEB), public domain."
    },
    
    # LESSON 2: THE CRADLE
    {
        "id": "holiday-ae-cradle",
        "lesson_number": 2,
        "title": "The Cradle",
        "series_name": "Holiday Series AE",
        "edition": "adult",
        "theme": "Heaven Came Low",
        "background_text": "Luke 1:26–38; Matthew 1:18–25; Luke 2:1–20; Isaiah 7:14",
        "appetizer": "Luke 2:6–7 (WEB) \"While they were there, the time came for her to give birth. She gave birth to her firstborn son… and laid him in a manger because there was no room for them in the inn.\" The cradle is more than a baby bed — it is the place where eternity stepped into time. Jesus did not arrive with parades, soldiers, palaces, or political might. He came the way most of us came: in vulnerability, wrapped in cloth, placed in a feeding trough.",
        "opening_prayer": "Lord, thank You for sending Jesus to dwell among us. Help us embrace Your presence and share Your love with others. Amen.",
        "key_verse_ref": "John 1:14 (WEB)",
        "key_verse_text": "The Word became flesh, and lived among us. We saw his glory… full of grace and truth.",
        "bites": [
            {
                "id": "cradle-bite-1",
                "title": "Joseph: Trusting God in Confusion",
                "scripture_ref": "Matthew 1:20–21 (WEB)",
                "scripture_text": "An angel of the Lord appeared to him in a dream, saying, 'Joseph… don't be afraid to take Mary as your wife, for that which is conceived in her is of the Holy Spirit. She shall give birth to a son. You shall call his name Jesus…'",
                "teaching": "Joseph's faith is underrated. God didn't just speak to Mary — He also spoke to Joseph, confirming the divine plan. Joseph had to trust: a message he didn't expect, a situation he didn't control, a purpose he couldn't yet see. Obedience often begins when understanding is still catching up.",
                "question": {
                    "id": "cradle-q-1",
                    "type": "reflection",
                    "prompt": "What does Joseph's obedience teach you about trusting God in the unknown?"
                }
            },
            {
                "id": "cradle-bite-2",
                "title": "Emmanuel: God With Us",
                "scripture_ref": "Isaiah 7:14 (WEB)",
                "scripture_text": "Behold, the virgin shall conceive, and bear a son, and shall call his name Immanuel.",
                "teaching": "Immanuel = God With Us. The manger was not a random scene — it was a prophecy fulfilled. God with us in: our fear, our uncertainty, our waiting, our joy, our brokenness. The cradle tells us: God is not distant. He is present, near, and intentional.",
                "cst": "God is not distant. He is present, near, and intentional.",
                "question": {
                    "id": "cradle-q-2",
                    "type": "reflection",
                    "prompt": "Where has God met you in a 'low place' and revealed Himself unexpectedly?"
                }
            },
            {
                "id": "cradle-bite-3",
                "title": "The Humble King",
                "scripture_ref": "Philippians 2:6–7 (WEB)",
                "scripture_text": "…though existing in the form of God… emptied himself… taking the form of a servant…",
                "teaching": "The Creator chose the crib before the crown. Before He carried the cross, He rested in a manger. This is the humility of Jesus — the King who starts His earthly story at the bottom, so no one can say He cannot relate to their struggle.",
                "question": {
                    "id": "cradle-q-3",
                    "type": "reflection",
                    "prompt": "How does the birth of Jesus change the way you see your own worth or your own story?"
                }
            }
        ],
        "dessert": "Luke 2:10–11 (WEB) \"Don't be afraid, for behold, I bring you good news of great joy… For there is born to you today, in David's city, a Savior, who is Christ the Lord.\" His birth was personal — born to you. The cradle reminds us that hope is not an idea; hope is a person.",
        "shared_truth": "Jesus didn't wait for the world to be perfect — He stepped into it as it was.",
        "to_go_box": [
            "Jesus didn't wait for the world to be perfect — He stepped into it as it was",
            "The cradle reminds us: God shows up in ordinary places to do extraordinary things",
            "Obedience often begins when understanding is still catching up",
            "Hope is not an idea; hope is a person"
        ],
        "word_study": {
            "Immanuel": "God with us — God choosing closeness, not distance",
            "Cradle/Manger": "A feeding trough — symbolizing humility, provision, and God meeting us where we are"
        },
        "activity": {
            "id": "cradle-activity",
            "title": "Cradle Connections - Matching",
            "instructions": "Match the truth to the scripture:",
            "questions": [
                {
                    "id": "cradle-a-1",
                    "type": "fill_in_blank",
                    "prompt": "John 1:14 → ________ (A. God with us, B. Jesus' humble birth, C. Joseph trusts God, D. The Word became flesh)",
                    "correct_answer": "D"
                },
                {
                    "id": "cradle-a-2",
                    "type": "fill_in_blank",
                    "prompt": "Matthew 1:20–21 → ________ (A. God with us, B. Jesus' humble birth, C. Joseph trusts God, D. The Word became flesh)",
                    "correct_answer": "C"
                },
                {
                    "id": "cradle-a-3",
                    "type": "fill_in_blank",
                    "prompt": "Isaiah 7:14 → ________ (A. God with us, B. Jesus' humble birth, C. Joseph trusts God, D. The Word became flesh)",
                    "correct_answer": "A"
                },
                {
                    "id": "cradle-a-4",
                    "type": "fill_in_blank",
                    "prompt": "Luke 2:7 → ________ (A. God with us, B. Jesus' humble birth, C. Joseph trusts God, D. The Word became flesh)",
                    "correct_answer": "B"
                }
            ]
        },
        "closing_prayer": "Lord, thank You for sending Jesus to dwell among us. Help us embrace Your presence and share Your love with others. Amen.",
        "your_prayer_prompt": "Write your own prayer about God being with you:",
        "scripture_disclosure": "Scripture quotations are from the World English Bible (WEB), public domain."
    },
    
    # LESSON 3: THE CROSS
    {
        "id": "holiday-ae-cross",
        "lesson_number": 3,
        "title": "The Cross",
        "series_name": "Holiday Series AE",
        "edition": "adult",
        "theme": "Grieving Grace → Redeeming Grace",
        "background_text": "Isaiah 53:4–6; John 3:16; John 19:17–30; 1 Peter 2:24; Romans 5:8",
        "appetizer": "John 3:16 (WEB) \"For God so loved the world, that He gave His one and only Son, that whoever believes in Him should not perish, but have eternal life.\" When most people see a cross during the holidays, they think of Easter, not Christmas. But the truth is this: The cradle only matters because of the cross. Before Mary ever held the baby, Heaven already saw the sacrifice. Jesus came with a mission — not only to be born, but to save.",
        "opening_prayer": "Lord Jesus, thank You for the cross and for loving us enough to lay down Your life. Thank You for carrying every burden, healing every wound, and opening the door to salvation. Help us walk in gratitude, humility, and obedience as we reflect on Your sacrifice. Amen.",
        "key_verse_ref": "John 19:30 (WEB)",
        "key_verse_text": "When Jesus therefore had received the vinegar, He said, 'It is finished.' He bowed His head, and gave up His spirit.",
        "bites": [
            {
                "id": "cross-bite-1",
                "title": "He Carried Our Suffering",
                "scripture_ref": "Isaiah 53:4–6 (WEB)",
                "scripture_text": "Surely he has borne our sickness and carried our suffering; yet we considered him plagued, struck by God, and afflicted. But he was pierced for our transgressions. He was crushed for our iniquities. The punishment that brought our peace was on him; and by his wounds we are healed.",
                "teaching": "Isaiah saw Calvary long before it happened. He saw the beating, the piercing, the grief, and the glory. Christ went through the unmentionables so he could provide for us a way back to God the Father. Atonement means Jesus carried what should've been carried by us. He took the full weight of sin so we wouldn't have to.",
                "cst": "Atonement means Jesus carried what should've been carried by us.",
                "question": {
                    "id": "cross-q-1",
                    "type": "reflection",
                    "prompt": "Write one area in your life where you need to remember that 'He carried it.'"
                }
            },
            {
                "id": "cross-bite-2",
                "title": "Grace Pays for Sin",
                "scripture_ref": "1 Peter 2:24 (WEB)",
                "scripture_text": "He Himself bore our sins in His body on the tree… by whose stripes you were healed.",
                "teaching": "The cross shows both: the seriousness of sin, and the magnitude of God's love. Jesus didn't die because we were behaving well… He died because we needed Him. Grace does not ignore sin — Grace pays for it.",
                "cst": "Grace does not ignore sin — Grace pays for it.",
                "question": {
                    "id": "cross-q-2",
                    "type": "reflection",
                    "prompt": "What does Jesus' sacrifice teach you about your value to God?"
                }
            },
            {
                "id": "cross-bite-3",
                "title": "It Is Finished",
                "scripture_ref": "John 19:28–30 (WEB)",
                "scripture_text": "Jesus said, 'I am thirsty' … Then He said, 'It is finished.'",
                "teaching": "\"It is finished\" is not a sigh of defeat — It is Heaven's victory shout. ✔️ The debt is paid. ✔️ The curse is broken. ✔️ The Redeemer has won. ✔️ Salvation is secured. The cross is the turning point of all humanity.",
                "cst": "\"It is finished\" is Heaven's victory shout.",
                "question": {
                    "id": "cross-q-3",
                    "type": "reflection",
                    "prompt": "How does 'It is finished' strengthen you in the battles you still face today?"
                }
            }
        ],
        "dessert": "Romans 5:8 (WEB) \"But God commends His own love toward us, in that while we were yet sinners, Christ died for us.\" He didn't wait for us to be perfect. He didn't wait for us to 'get it together.' He loved first — fully, fiercely, and forever.",
        "shared_truth": "The cradle introduced Jesus. The cross fulfilled His mission. Salvation is a gift, not wages.",
        "to_go_box": [
            "The cradle introduced Jesus. The cross fulfilled His mission.",
            "Salvation is a gift, not wages",
            "Grace is not earned — it is received",
            "The cross proves you are loved more deeply than you know",
            "Carry this truth into every season: Jesus paid it all… joyfully"
        ],
        "activity": {
            "id": "cross-activity",
            "title": "Cross Connection - Matching",
            "instructions": "Match the term to its meaning:",
            "questions": [
                {
                    "id": "cross-a-1",
                    "type": "fill_in_blank",
                    "prompt": "Atonement → ________ (1. Paid in full, 2. Being bought back, 3. Jesus paying for our sins, 4. God's motivation)",
                    "correct_answer": "3"
                },
                {
                    "id": "cross-a-2",
                    "type": "fill_in_blank",
                    "prompt": "Redemption → ________ (1. Paid in full, 2. Being bought back, 3. Jesus paying for our sins, 4. God's motivation)",
                    "correct_answer": "2"
                },
                {
                    "id": "cross-a-3",
                    "type": "fill_in_blank",
                    "prompt": "Love → ________ (1. Paid in full, 2. Being bought back, 3. Jesus paying for our sins, 4. God's motivation)",
                    "correct_answer": "4"
                },
                {
                    "id": "cross-a-4",
                    "type": "fill_in_blank",
                    "prompt": "'It is finished' → ________ (1. Paid in full, 2. Being bought back, 3. Jesus paying for our sins, 4. God's motivation)",
                    "correct_answer": "1"
                }
            ]
        },
        "closing_prayer": "Lord Jesus, thank You for the cross and for loving us enough to lay down Your life. Thank You for carrying every burden, healing every wound, and opening the door to salvation. Help us walk in gratitude, humility, and obedience as we reflect on Your sacrifice. Amen.",
        "your_prayer_prompt": "Write your own reflection or prayer to God about the cross:",
        "scripture_disclosure": "Scripture quotations are from the World English Bible (WEB), public domain."
    },
    
    # LESSON 4: THE COMFORTER
    {
        "id": "holiday-ae-comforter",
        "lesson_number": 4,
        "title": "The Comforter",
        "series_name": "Holiday Series AE",
        "edition": "adult",
        "theme": "God Remains With Us",
        "background_text": "John 14:15–27; Acts 1:1–8; Romans 8:18–27; Galatians 5:16–25; John 16:7–15",
        "appetizer": "John 14:18 (WEB) \"I will not leave you orphans. I will come to you.\" Holidays and quiet seasons can magnify loneliness. People move, loved ones pass away, families change, and routines shift, but Jesus' promise doesn't shift with them. He promises that we will never be spiritual orphans—the Holy Spirit is God's abiding presence within us.",
        "opening_prayer": "Holy Spirit, we welcome You. Lead us, comfort us, and guide us today. Help us recognize Your presence in every moment. In Jesus' name, amen.",
        "key_verse_ref": "John 14:16–17 (WEB)",
        "key_verse_text": "I will pray to the Father, and he will give you another Counselor, that he may be with you forever: the Spirit of truth, whom the world can't receive; for it doesn't see him and doesn't know him. You know him, for he lives with you, and will be in you.",
        "bites": [
            {
                "id": "comforter-bite-1",
                "title": "Another Counselor, Not a Temporary Visitor",
                "scripture_ref": "John 14:16–17 (WEB)",
                "scripture_text": "I will pray to the Father, and he will give you another Counselor, that he may be with you forever: the Spirit of truth, whom the world can't receive; for it doesn't see him and doesn't know him. You know him, for he lives with you, and will be in you.",
                "teaching": "Jesus prepares the disciples for His physical departure but promises \"another Counselor.\" \"Another\" means one of the same kind—someone who will continue His ministry, not cancel it. The Holy Spirit is not a lesser substitute; He is God's presence with and in believers, forever.",
                "cst": "The Holy Spirit is God's presence with and in believers, forever.",
                "question": {
                    "id": "comforter-q-1",
                    "type": "reflection",
                    "prompt": "How does knowing the Spirit is 'with you and in you' shift the way you see hard seasons?"
                }
            },
            {
                "id": "comforter-bite-2",
                "title": "Power in Our Witness",
                "scripture_ref": "Acts 1:8 (WEB)",
                "scripture_text": "But you will receive power when the Holy Spirit has come upon you. You will be witnesses to me in Jerusalem, in all Judea and Samaria, and to the uttermost parts of the earth.",
                "teaching": "The Spirit's presence is not just to comfort us in private; it empowers us in public. When the Holy Spirit comes, timid believers become bold witnesses. Comfort doesn't mean an escape from assignment—often it means strength for the assignment.",
                "cst": "Comfort doesn't mean escape from assignment—it means strength for the assignment.",
                "question": {
                    "id": "comforter-q-2",
                    "type": "fill_in_blank",
                    "prompt": "If the Holy Spirit is my power, then I don't have to rely on ______ when God asks me to speak or serve."
                }
            },
            {
                "id": "comforter-bite-3",
                "title": "Help in Our Weakness",
                "scripture_ref": "Romans 8:26 (WEB)",
                "scripture_text": "In the same way, the Spirit also helps our weaknesses, for we don't know how to pray as we ought. But the Spirit himself makes intercession for us with groanings which can't be uttered.",
                "teaching": "There are times when pain, grief, or confusion leave us speechless. The Holy Spirit steps into that silence and prays for us and with us. Our weakness is not a barrier to God's work—it is often the very place where the Comforter works most deeply.",
                "question": {
                    "id": "comforter-q-3",
                    "type": "reflection",
                    "prompt": "Recall a time when you didn't know what to say to God. How does this verse comfort you now?"
                }
            },
            {
                "id": "comforter-bite-4",
                "title": "Fruit That Proves He's Present",
                "scripture_ref": "Galatians 5:22–23 (WEB)",
                "scripture_text": "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faith, gentleness, and self-control. Against such things there is no law.",
                "teaching": "The Spirit doesn't just give goosebumps; He grows fruit. Over time, His presence shows up as love instead of bitterness, peace instead of panic, and self-control instead of out-of-control reactions. The real evidence that the Comforter is with us is not just how we feel but how we live.",
                "question": {
                    "id": "comforter-q-4",
                    "type": "reflection",
                    "prompt": "Which one fruit from this list do you most need to grow in right now? Why?"
                }
            },
            {
                "id": "comforter-bite-5",
                "title": "Guided Into Truth",
                "scripture_ref": "John 16:13 (WEB)",
                "scripture_text": "However when he, the Spirit of truth, has come, he will guide you into all truth; for he will not speak from himself; but whatever he hears, he will speak. He will declare to you things that are coming.",
                "teaching": "The Holy Spirit doesn't confuse us; He clarifies. He points us back to what Jesus said, reveals what honors God, and gives discernment in a world full of noise. When we slow down to listen, He guides us away from deception and into truth.",
                "question": {
                    "id": "comforter-q-5",
                    "type": "reflection",
                    "prompt": "Where in your life do you most need the Spirit's guidance right now—relationships, decisions, habits, or healing?"
                }
            }
        ],
        "dessert": "The same Jesus who walked beside His disciples sent the Spirit to walk inside us. We may sit at empty tables, move into new cities, or face seasons where people let us down—but we are never spiritually abandoned. The Comforter makes 'God with us' a daily reality, not just a Christmas slogan.",
        "shared_truth": "We are never spiritually abandoned. The Comforter makes 'God with us' a daily reality.",
        "to_go_box": [
            "Talk to Him Daily: Start each morning with 'Holy Spirit, I welcome You. Lead me, comfort me, and guide me today.'",
            "Pause Before Reacting: When triggered, whisper 'Comforter, help me respond in the Spirit, not in my flesh.'",
            "Fruit Check: Pick one fruit of the Spirit and intentionally practice it in a difficult relationship or setting"
        ],
        "word_study": {
            "Paraklētos": "Comforter / Counselor / Helper / Advocate — One called alongside to help, defend, strengthen, and guide",
            "Indwelling": "The Holy Spirit actually living in believers, not just visiting",
            "Fruit of the Spirit": "The visible evidence of the Holy Spirit's work in a believer's character and behavior",
            "Ruach HaKodesh": "Holy Spirit; 'Breath of God'"
        },
        "activity": {
            "id": "comforter-activity",
            "title": "Comfort Letters",
            "instructions": "On one side, write a short letter to God thanking Him for the ways the Holy Spirit has comforted you. On the other side, write a short letter to someone who might feel alone. Include at least one scripture from this lesson.",
            "questions": [
                {
                    "id": "comforter-a-1",
                    "type": "reflection",
                    "prompt": "Write a short letter to God thanking Him for how the Holy Spirit has comforted you:"
                },
                {
                    "id": "comforter-a-2",
                    "type": "reflection",
                    "prompt": "Write a short letter to someone who might feel alone (include a scripture):"
                },
                {
                    "id": "comforter-a-3",
                    "type": "reflection",
                    "prompt": "Write one practical way you could encourage or support a person like that this week:"
                }
            ]
        },
        "closing_prayer": "Father God, thank You for not leaving us as orphans. Thank You for the Holy Spirit who comforts, guides, empowers, and walks with us daily. Help us to be sensitive to His leading and to bear fruit that brings glory to Your name. In Jesus' name, amen.",
        "your_prayer_prompt": "Write your own prayer inviting the Holy Spirit to guide you this week:",
        "scripture_disclosure": "Scripture quotations are from the World English Bible (WEB), public domain.",
        "price_download": 7.99,
        "price_interactive": 9.99,
        "is_free": False
    },
    
    # =============================================================================
    # BONUS LESSON 1: THE NAMES OF GOD
    # =============================================================================
    {
        "id": "holiday-ae-bonus-names",
        "lesson_number": 5,
        "title": "The Names of God",
        "series_name": "Holiday Series AE",
        "edition": "adult",
        "theme": "Foundations of Faith",
        "is_bonus": True,
        "appetizer": "Throughout Scripture, God reveals Himself through His names. Each name reflects an aspect of His character, His relationship with us, and His work in the world. Understanding these names deepens our worship and trust.",
        "opening_prayer": "Father, reveal Yourself to us through Your names. Help us know You more deeply and trust You more fully. In Jesus' name, amen.",
        "key_verse_ref": "Proverbs 18:10 (WEB)",
        "key_verse_text": "Yahweh's name is a strong tower; the righteous run to him and are safe.",
        "bites": [
            {
                "id": "names-bite-1",
                "title": "Yahweh – I AM",
                "scripture_ref": "Exodus 3:14 (WEB)",
                "scripture_text": "God said to Moses, 'I AM WHO I AM.' He said, 'You shall tell the children of Israel this: I AM has sent me to you.'",
                "teaching": "Yahweh is the covenant name of God, meaning 'I AM' – the self-existent, eternal One. He is not dependent on anyone or anything. He simply IS. This name assures us that God is constant, unchanging, and always present.",
                "question": {
                    "id": "names-q-1",
                    "type": "reflection",
                    "prompt": "How does knowing God as 'I AM' give you confidence in uncertain times?"
                }
            },
            {
                "id": "names-bite-2",
                "title": "Elohim – The Creator God",
                "scripture_ref": "Genesis 1:1 (WEB)",
                "scripture_text": "In the beginning, God (Elohim) created the heavens and the earth.",
                "teaching": "Elohim is the plural form of El (God), used to describe God's majesty and power. It appears in the very first verse of the Bible, establishing God as the all-powerful Creator of everything.",
                "question": {
                    "id": "names-q-2",
                    "type": "reflection",
                    "prompt": "What does it mean to you that the same God who created the universe knows you personally?"
                }
            },
            {
                "id": "names-bite-3",
                "title": "Adonai – Lord and Master",
                "scripture_ref": "Psalm 8:1 (WEB)",
                "scripture_text": "Yahweh, our Lord (Adonai), how majestic is your name in all the earth!",
                "teaching": "Adonai means 'Lord' or 'Master.' It speaks of God's authority and our submission to Him. When we call God 'Adonai,' we acknowledge His right to rule over our lives.",
                "question": {
                    "id": "names-q-3",
                    "type": "reflection",
                    "prompt": "In what area of your life do you need to surrender more fully to God as your Adonai?"
                }
            },
            {
                "id": "names-bite-4",
                "title": "Jehovah Compound Names",
                "scripture_ref": "Various",
                "scripture_text": "Jehovah-Jireh (The Lord Will Provide), Jehovah-Rapha (The Lord Who Heals), Jehovah-Shalom (The Lord Is Peace), Jehovah-Nissi (The Lord Is My Banner)",
                "teaching": "God reveals Himself through compound names that describe His provision for every need: He provides, heals, gives peace, and fights our battles. Whatever you need, there is a name of God that speaks to your situation.",
                "question": {
                    "id": "names-q-4",
                    "type": "reflection",
                    "prompt": "Which of these Jehovah names speaks most to your current season? Why?"
                }
            }
        ],
        "to_go_box": [
            "Yahweh – I AM: God is eternal and unchanging",
            "Elohim – Creator: God is all-powerful",
            "Adonai – Lord: God has authority over our lives",
            "Jehovah compound names reveal God's provision for every need"
        ],
        "word_study": {
            "Yahweh": "I AM – the covenant name of God",
            "Elohim": "God (plural) – emphasizing majesty and power",
            "Adonai": "Lord, Master – emphasizing authority",
            "El Shaddai": "God Almighty – emphasizing sufficiency"
        },
        "activity": {
            "id": "names-activity",
            "title": "Name That Need",
            "instructions": "Match a name of God to a need in your life. Write a short prayer using that name.",
            "questions": [
                {
                    "id": "names-a-1",
                    "type": "reflection",
                    "prompt": "What is a current need in your life, and which name of God speaks to it?"
                },
                {
                    "id": "names-a-2",
                    "type": "reflection",
                    "prompt": "Write a short prayer addressing God by that name:"
                }
            ]
        },
        "closing_prayer": "Lord, thank You for revealing Yourself through Your names. Help us to know You more deeply and trust You more fully in every area of our lives. In Jesus' name, amen.",
        "your_prayer_prompt": "Write your own prayer using one of God's names:",
        "scripture_disclosure": "Scripture quotations are from the World English Bible (WEB), public domain.",
        "price_download": 0,
        "price_interactive": 0,
        "is_free": True
    },
    
    # =============================================================================
    # BONUS LESSON 10: TIMES AND SEASONS
    # =============================================================================
    {
        "id": "holiday-ae-bonus-times",
        "lesson_number": 6,
        "title": "Times and Seasons",
        "series_name": "Holiday Series AE",
        "edition": "adult",
        "theme": "God's Order in Days and Numbers",
        "is_bonus": True,
        "appetizer": "God is a God of order. From the beginning, He established times, seasons, and patterns. Understanding biblical numbers and their significance helps us see God's intentionality woven throughout Scripture.",
        "opening_prayer": "Lord, open our eyes to see Your divine order in creation and in our lives. Help us discern the times and seasons You have appointed. In Jesus' name, amen.",
        "key_verse_ref": "Ecclesiastes 3:1 (WEB)",
        "key_verse_text": "For everything there is a season, and a time for every purpose under heaven.",
        "bites": [
            {
                "id": "times-bite-1",
                "title": "The Significance of Seven",
                "scripture_ref": "Genesis 2:2-3 (WEB)",
                "scripture_text": "On the seventh day God finished his work which he had done; and he rested on the seventh day from all his work.",
                "teaching": "Seven represents completion and perfection in Scripture. God rested on the seventh day, establishing the Sabbath pattern. Seven appears throughout the Bible: seven churches, seven seals, seven trumpets – all pointing to God's complete work.",
                "question": {
                    "id": "times-q-1",
                    "type": "reflection",
                    "prompt": "How does understanding 'seven' as completion change how you view God's work in your life?"
                }
            },
            {
                "id": "times-bite-2",
                "title": "Forty – A Time of Testing",
                "scripture_ref": "Matthew 4:1-2 (WEB)",
                "scripture_text": "Then Jesus was led up by the Spirit into the wilderness to be tempted by the devil. When he had fasted forty days and forty nights, he was hungry.",
                "teaching": "Forty often represents a period of testing, trial, or transformation. Israel wandered 40 years. Moses spent 40 days on the mountain. Jesus fasted 40 days. These 'forty seasons' prepare us for what's next.",
                "question": {
                    "id": "times-q-2",
                    "type": "reflection",
                    "prompt": "Have you experienced a 'forty season' of testing? What did God teach you through it?"
                }
            },
            {
                "id": "times-bite-3",
                "title": "Twelve – Divine Government",
                "scripture_ref": "Revelation 21:12-14 (WEB)",
                "scripture_text": "It had a great and high wall with twelve gates... and names written on them, which are the names of the twelve tribes... The wall of the city had twelve foundations, and on them twelve names of the twelve Apostles.",
                "teaching": "Twelve represents divine government and authority: 12 tribes, 12 apostles, 12 gates in the New Jerusalem. God establishes order and structure in His kingdom.",
                "question": {
                    "id": "times-q-3",
                    "type": "reflection",
                    "prompt": "How do you see God's order and authority displayed in your life or church community?"
                }
            },
            {
                "id": "times-bite-4",
                "title": "Appointed Times (Moedim)",
                "scripture_ref": "Leviticus 23:2 (WEB)",
                "scripture_text": "The appointed feasts of Yahweh, which you shall proclaim to be holy convocations, even these are my appointed feasts.",
                "teaching": "God appointed specific times (moedim) for His people to gather and remember His faithfulness. These feasts point to Christ and remind us that God works within time to accomplish His eternal purposes.",
                "question": {
                    "id": "times-q-4",
                    "type": "reflection",
                    "prompt": "What 'appointed times' do you set aside to remember God's faithfulness in your life?"
                }
            }
        ],
        "to_go_box": [
            "Seven = Completion and perfection",
            "Forty = Testing and preparation",
            "Twelve = Divine government and authority",
            "God works within time to accomplish eternal purposes",
            "Every season has a purpose under heaven"
        ],
        "word_study": {
            "Moedim": "Appointed times; divine appointments set by God",
            "Shabbat": "Sabbath; the seventh day of rest",
            "Kairos": "Greek for 'opportune time' – God's appointed moment"
        },
        "activity": {
            "id": "times-activity",
            "title": "Season Reflection",
            "instructions": "Reflect on the current season of your life and what God may be doing in it.",
            "questions": [
                {
                    "id": "times-a-1",
                    "type": "reflection",
                    "prompt": "What season are you currently in (waiting, testing, growing, harvesting)?"
                },
                {
                    "id": "times-a-2",
                    "type": "reflection",
                    "prompt": "What do you sense God is teaching you or preparing you for in this season?"
                },
                {
                    "id": "times-a-3",
                    "type": "reflection",
                    "prompt": "Write a prayer surrendering this season to God's timing:"
                }
            ]
        },
        "closing_prayer": "Father, thank You for being a God of order and purpose. Help us trust Your timing, even when we don't understand. Give us wisdom to discern the seasons and grace to walk faithfully through each one. In Jesus' name, amen.",
        "your_prayer_prompt": "Write your own prayer about the season you're in:",
        "scripture_disclosure": "Scripture quotations are from the World English Bible (WEB), public domain.",
        "price_download": 0,
        "price_interactive": 0,
        "is_free": True
    }
]

# Add pricing to the main 4 Holiday AE lessons
for nibble in HOLIDAY_AE_NIBBLES[:4]:
    if "price_download" not in nibble:
        nibble["price_download"] = 7.99
        nibble["price_interactive"] = 9.99
        nibble["is_free"] = False

# BREAKFAST SERIES - Adult Edition (All 12 Lessons)
# Structure: 3 Months x 4 Lessons = 12 Lessons Total
# Month 1: Prayer, the First Resort (Esther, Solomon, Jesus, Paul & Silas)
# Month 2: The Art of Through (Joseph - all 4 lessons)
# Month 3: Faith & Foresight (Rahab, Abigail, Centurion, Joseph of Arimathea)

BREAKFAST_AE_NIBBLES = [
    # ========== MONTH 1: PRAYER, THE FIRST RESORT ==========
    # Lesson 1: Esther
    {
        "id": "breakfast-ae-prayer-1",
        "lesson_number": 1,
        "title": "Esther: Second Is the Best",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 1,
        "theme": "Prayer, the First Resort",
        "background_text": "Esther 1-4 (focus on chapters 2-4)",
        "appetizer": "In the Persian Empire, Queen Esther faced an impossible choice: remain silent and survive, or speak up and risk death. Her people's fate hung in the balance. Through fasting, prayer, and courage, Esther discovered that sometimes being second in position means being first in purpose. God had placed her 'for such a time as this.'",
        "opening_prayer": "Lord, give us the courage of Esther to stand for what is right even when the cost is high. Help us see that Your timing is perfect and Your positioning is purposeful. In Jesus' name, amen.",
        "key_verse_ref": "Esther 4:14 (WEB)",
        "key_verse_text": "For if you remain silent now, relief and deliverance will come to the Jews from another place, but you and your father's house will perish. Who knows if you haven't come to the kingdom for such a time as this?",
        "bites": [
            {
                "id": "bkft-ae-prayer-1-1",
                "title": "For Such a Time",
                "scripture_ref": "Esther 4:14 (WEB)",
                "scripture_text": "Who knows if you haven't come to the kingdom for such a time as this?",
                "teaching": "Mordecai's question to Esther wasn't just about her moment—it's about all of us. Every position we hold, every relationship we have, every skill we've developed may be preparation for a divine appointment we haven't yet recognized.",
                "question": {"id": "q-bkft-ae-prayer-1-1", "type": "reflection", "prompt": "What 'position' has God placed you in that might be 'for such a time as this'?"}
            }
        ],
        "to_go_box": ["God's timing is purposeful", "Position comes with responsibility", "Prayer precedes breakthrough"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 2: Solomon
    {
        "id": "breakfast-ae-prayer-2",
        "lesson_number": 2,
        "title": "Solomon: The Question That Unlocked a Legacy",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 1,
        "theme": "Prayer, the First Resort",
        "background_text": "1 Kings 3:5-14; 2 Chronicles 1:7-12",
        "appetizer": "When God offered Solomon anything he wanted, Solomon didn't ask for wealth, fame, or long life. He asked for wisdom—an understanding heart to discern between good and evil. That single prayer unlocked a legacy that still speaks today. What we ask for reveals what we value most.",
        "opening_prayer": "Father, like Solomon, we come asking for wisdom. Give us understanding hearts to lead well, discern clearly, and honor You in our decisions. In Jesus' name, amen.",
        "key_verse_ref": "1 Kings 3:9 (WEB)",
        "key_verse_text": "Give your servant therefore an understanding heart to judge your people, that I may discern between good and evil; for who is able to judge this great people of yours?",
        "bites": [
            {
                "id": "bkft-ae-prayer-2-1",
                "title": "The Wisdom Request",
                "scripture_ref": "1 Kings 3:9 (WEB)",
                "scripture_text": "Give your servant therefore an understanding heart to judge your people.",
                "teaching": "Solomon could have asked for anything—riches, revenge on enemies, endless life. Instead, he recognized his inadequacy and asked for what he truly needed. Wisdom isn't just knowledge; it's the ability to apply knowledge rightly. It starts with acknowledging we need God's help.",
                "question": {"id": "q-bkft-ae-prayer-2-1", "type": "reflection", "prompt": "If God offered you one thing today, what would you ask for and why?"}
            }
        ],
        "to_go_box": ["What you ask for reveals what you value", "Wisdom begins with humility", "God honors hearts that seek Him"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 3: Jesus
    {
        "id": "breakfast-ae-prayer-3",
        "lesson_number": 3,
        "title": "Jesus: Prayer the First Resort",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 1,
        "theme": "Prayer, the First Resort",
        "background_text": "Luke 5:15-16; Luke 11:1-4; Luke 22:39-46",
        "appetizer": "If anyone could have skipped prayer, it was Jesus. He was God in flesh. Yet He consistently withdrew to pray. Before major decisions, after great victories, in moments of crisis—prayer was His first resort, not His last. If Jesus needed to pray, how much more do we?",
        "opening_prayer": "Jesus, teach us to pray as You prayed—not out of obligation but out of intimacy. Help us make prayer our first response, not our last resort. In Your name, amen.",
        "key_verse_ref": "Luke 5:16 (WEB)",
        "key_verse_text": "But he withdrew himself into the desert, and prayed.",
        "bites": [
            {
                "id": "bkft-ae-prayer-3-1",
                "title": "The Practice of Withdrawal",
                "scripture_ref": "Luke 5:16 (WEB)",
                "scripture_text": "But he withdrew himself into the desert, and prayed.",
                "teaching": "Notice the pattern: Jesus withdrew AND prayed. Sometimes we try to pray while staying connected to everything demanding our attention. Jesus physically separated Himself. The withdrawal wasn't weakness—it was wisdom. Disconnecting from distractions deepens our connection to God.",
                "question": {"id": "q-bkft-ae-prayer-3-1", "type": "reflection", "prompt": "What do you need to withdraw from to deepen your prayer life?"}
            }
        ],
        "to_go_box": ["Withdrawal is not weakness", "Even Jesus prioritized prayer", "Intimacy requires intentionality"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 4: Paul & Silas
    {
        "id": "breakfast-ae-prayer-4",
        "lesson_number": 4,
        "title": "Paul & Silas: Faith in the Dark",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 1,
        "theme": "Prayer, the First Resort",
        "background_text": "Acts 16:16-34",
        "appetizer": "Beaten, bleeding, and locked in the innermost cell with their feet in stocks—Paul and Silas did the unthinkable. At midnight, they prayed and sang hymns. Their praise in the prison became the key that unlocked not just their chains, but an entire household's salvation.",
        "opening_prayer": "Lord, give us midnight faith—the kind that praises before the breakthrough, that worships in the waiting, that trusts when circumstances say otherwise. In Jesus' name, amen.",
        "key_verse_ref": "Acts 16:25 (WEB)",
        "key_verse_text": "But about midnight Paul and Silas were praying and singing hymns to God, and the prisoners were listening to them.",
        "bites": [
            {
                "id": "bkft-ae-prayer-4-1",
                "title": "Midnight Praise",
                "scripture_ref": "Acts 16:25 (WEB)",
                "scripture_text": "But about midnight Paul and Silas were praying and singing hymns to God.",
                "teaching": "Midnight represents our darkest moments—when hope seems gone and circumstances feel hopeless. Yet Paul and Silas chose worship over worry. Their praise wasn't denial of their pain; it was declaration of God's power. Sometimes the breakthrough comes not when circumstances change, but when our response does.",
                "question": {"id": "q-bkft-ae-prayer-4-1", "type": "reflection", "prompt": "What 'midnight moment' are you facing that needs a praise response?"}
            }
        ],
        "to_go_box": ["Praise is a weapon", "Your worship affects others watching", "God moves at midnight"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    
    # ========== MONTH 2: THE ART OF THROUGH ==========
    # All 4 lessons focus on Joseph's journey
    # Lesson 5: Joseph - The Young Dreamer
    {
        "id": "breakfast-ae-through-1",
        "lesson_number": 5,
        "title": "Joseph – The Young Dreamer",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 2,
        "theme": "The Art of Through",
        "background_text": "Genesis 37:1-36",
        "appetizer": "Joseph was seventeen when God gave him dreams of greatness. His father's favorite, he wore a coat that set him apart. But favor often attracts friction. His brothers' jealousy would throw him into a pit, but even pits can't bury God's purpose. The dreamer's journey had just begun.",
        "opening_prayer": "Father, when the path seems long and the wait feels endless, remind us of Joseph. Help us trust that You are working even in the waiting. In Jesus' name, amen.",
        "key_verse_ref": "Genesis 37:19-20 (WEB)",
        "key_verse_text": "They said to one another, 'Behold, this dreamer comes. Come now therefore, and let's kill him.'",
        "bites": [
            {
                "id": "bkft-ae-through-1-1",
                "title": "The Dreamer's Target",
                "scripture_ref": "Genesis 37:19-20 (WEB)",
                "scripture_text": "They said to one another, 'Behold, this dreamer comes.'",
                "teaching": "Joseph's brothers saw his dreams as arrogance, but God saw them as prophecy. The very thing that made Joseph a target was the same thing that would eventually save his family. Your God-given vision may be misunderstood by others, but it's still valid. Don't let others' rejection make you abandon God's revelation.",
                "question": {"id": "q-bkft-ae-through-1-1", "type": "reflection", "prompt": "What dream has God given you that others may not understand?"}
            }
        ],
        "to_go_box": ["Dreams attract opposition", "Favor can create friction", "God's purpose survives pits"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 6: Hannah
    {
        "id": "breakfast-ae-through-2",
        "lesson_number": 6,
        "title": "Hannah – Barren but Not Lifeless",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 2,
        "theme": "The Art of Through",
        "background_text": "1 Samuel 1:1-28",
        "appetizer": "Hannah's womb was closed, but her heart was open. Year after year, she endured the mockery of Peninnah and the silence of heaven. But Hannah didn't let barrenness make her bitter—she let it make her bold. Her tears became her prayer, and her prayer became a prophet.",
        "opening_prayer": "Lord, in our seasons of waiting and wanting, keep our hearts soft toward You. Like Hannah, let our pain push us into Your presence, not away from it. In Jesus' name, amen.",
        "key_verse_ref": "1 Samuel 1:27 (WEB)",
        "key_verse_text": "For this child I prayed. Yahweh has given me my petition which I asked of him.",
        "bites": [
            {
                "id": "bkft-ae-through-2-1",
                "title": "Prayer in the Pain",
                "scripture_ref": "1 Samuel 1:10 (WEB)",
                "scripture_text": "She was in bitterness of soul, and prayed to Yahweh, and wept bitterly.",
                "teaching": "Hannah didn't hide her pain from God—she poured it out before Him. Her prayer wasn't polished or pretty; it was raw and real. God isn't intimidated by our honest emotions. Sometimes the most powerful prayers come from the most broken places.",
                "question": {"id": "q-bkft-ae-through-2-1", "type": "reflection", "prompt": "What pain have you been hiding from God that needs to become a prayer?"}
            }
        ],
        "to_go_box": ["Barrenness isn't the end", "Pain can fuel prayer", "God hears desperate cries"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 7: Abram
    {
        "id": "breakfast-ae-through-3",
        "lesson_number": 7,
        "title": "Abram – No Heir, Wait Here",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 2,
        "theme": "The Art of Through",
        "background_text": "Genesis 15:1-6; Genesis 17:1-8",
        "appetizer": "God promised Abram descendants as numerous as the stars, but years passed with no child. The promise seemed impossible—Sarah was barren, and time was running out. Yet Abram believed God, and it was credited to him as righteousness. Sometimes the wait IS the work.",
        "opening_prayer": "Father, strengthen our faith in the waiting seasons. When Your promises seem delayed, help us remember that Your timing is always perfect. In Jesus' name, amen.",
        "key_verse_ref": "Genesis 15:6 (WEB)",
        "key_verse_text": "He believed in Yahweh, and he credited it to him for righteousness.",
        "bites": [
            {
                "id": "bkft-ae-through-3-1",
                "title": "Faith in the Wait",
                "scripture_ref": "Genesis 15:5-6 (WEB)",
                "scripture_text": "Look now toward the sky, and count the stars... He believed in Yahweh.",
                "teaching": "God showed Abram the stars—a visual promise of what seemed impossible. Abram's faith wasn't blind; it was built on what God showed him. When we can't see the promise fulfilled, we can still see the Promise-Keeper. Faith doesn't deny reality; it trusts a greater reality.",
                "question": {"id": "q-bkft-ae-through-3-1", "type": "reflection", "prompt": "What promise from God are you waiting on, and how can you 'look at the stars' today?"}
            }
        ],
        "to_go_box": ["The wait is part of the work", "Belief is credited as righteousness", "God's delays aren't denials"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 8: Victory Through the Blood
    {
        "id": "breakfast-ae-through-4",
        "lesson_number": 8,
        "title": "Victory Through the Blood",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 2,
        "theme": "The Art of Through",
        "background_text": "Exodus 12:1-13; Revelation 12:11",
        "appetizer": "The Israelites were trapped—slaves in Egypt with Pharaoh's heart hardened against them. But God made a way through the blood of a lamb. The same blood that marked their doors marked their deliverance. Centuries later, another Lamb's blood would mark our eternal freedom.",
        "opening_prayer": "Thank You, Lord, for the blood that covers, protects, and delivers us. Help us never forget the price of our freedom and the power of the cross. In Jesus' name, amen.",
        "key_verse_ref": "Revelation 12:11 (WEB)",
        "key_verse_text": "They overcame him because of the Lamb's blood, and because of the word of their testimony.",
        "bites": [
            {
                "id": "bkft-ae-through-4-1",
                "title": "The Power of the Blood",
                "scripture_ref": "Exodus 12:13 (WEB)",
                "scripture_text": "The blood shall be to you for a token... when I see the blood, I will pass over you.",
                "teaching": "The blood wasn't just a sign to the Israelites—it was a signal to the destroyer. When death saw the blood, it had to pass over. The blood of Jesus works the same way. It's not just a symbol; it's our protection, our victory, our way through.",
                "question": {"id": "q-bkft-ae-through-4-1", "type": "reflection", "prompt": "How has the blood of Jesus been your 'way through' a difficult situation?"}
            }
        ],
        "to_go_box": ["The blood is our covering", "Victory comes through surrender", "What's marked is protected"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    
    # ========== MONTH 3: FAITH & FORESIGHT ==========
    # Lesson 9: Rahab
    {
        "id": "breakfast-ae-faith-1",
        "lesson_number": 9,
        "title": "Rahab: Faith That Took Action",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 3,
        "theme": "Faith & Foresight",
        "background_text": "Joshua 2:1-21; 6:22-25; Hebrews 11:31",
        "appetizer": "Rahab was a Canaanite woman with a questionable past, yet she appears in the lineage of Jesus. Her story proves that faith isn't about where you've been—it's about who you're reaching for. When she hid the Israelite spies, she wasn't just saving them; she was stepping into her destiny.",
        "opening_prayer": "God of second chances, thank You for Rahab's story. Remind us that our past doesn't disqualify us from Your purpose. Give us faith that takes action. In Jesus' name, amen.",
        "key_verse_ref": "Hebrews 11:31 (WEB)",
        "key_verse_text": "By faith, Rahab the prostitute didn't perish with those who were disobedient, having received the spies in peace.",
        "bites": [
            {
                "id": "bkft-ae-faith-1-1",
                "title": "Faith in Action",
                "scripture_ref": "James 2:25 (WEB)",
                "scripture_text": "In the same way, wasn't Rahab the prostitute also justified by works, in that she received the messengers?",
                "teaching": "Rahab's faith wasn't passive. She heard about God's power, believed in His sovereignty, and then acted. True faith always produces movement. She risked everything—her safety, her reputation, her life—because she believed God was who He said He was.",
                "question": {"id": "q-bkft-ae-faith-1-1", "type": "reflection", "prompt": "What action is your faith calling you to take right now?"}
            }
        ],
        "to_go_box": ["Faith requires action", "Your past doesn't define your future", "God uses the unlikely"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 10: Abigail
    {
        "id": "breakfast-ae-faith-2",
        "lesson_number": 10,
        "title": "Abigail: Wisdom on the Move",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 3,
        "theme": "Faith & Foresight",
        "background_text": "1 Samuel 25:2-35",
        "appetizer": "Abigail was married to a fool named Nabal. When his arrogance nearly got their entire household killed, Abigail moved with wisdom, speed, and grace. She intercepted David's wrath with humility and provision. Her foresight saved lives and changed her future.",
        "opening_prayer": "Lord, give us the wisdom of Abigail—to see trouble coming and move with grace and speed. Help us be peacemakers who intercept disaster with discernment. In Jesus' name, amen.",
        "key_verse_ref": "1 Samuel 25:32-33 (WEB)",
        "key_verse_text": "Blessed is your discretion, and blessed are you, who have kept me today from blood guiltiness.",
        "bites": [
            {
                "id": "bkft-ae-faith-2-1",
                "title": "Wisdom That Protects",
                "scripture_ref": "1 Samuel 25:18 (WEB)",
                "scripture_text": "Then Abigail hurried and took two hundred loaves of bread...",
                "teaching": "Abigail didn't wait for permission or waste time in panic. She assessed the situation, gathered resources, and moved. Wisdom isn't just knowing what's right—it's doing what's right at the right time. Her quick action protected her household from destruction.",
                "question": {"id": "q-bkft-ae-faith-2-1", "type": "reflection", "prompt": "Is there a situation where you need to move with wisdom before it escalates?"}
            }
        ],
        "to_go_box": ["Wisdom moves quickly", "Humility disarms anger", "Foresight prevents disaster"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 11: The Centurion
    {
        "id": "breakfast-ae-faith-3",
        "lesson_number": 11,
        "title": "The Centurion: Faith That Commands Results",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 3,
        "theme": "Faith & Foresight",
        "background_text": "Matthew 8:5-13; Luke 7:1-10",
        "appetizer": "A Roman centurion—a man of military authority—came to Jesus not with demands but with desperate faith. He understood authority: if Jesus spoke a word, disease had to obey. His faith amazed even Jesus. Sometimes the greatest faith comes from unexpected places.",
        "opening_prayer": "Lord, increase our faith to trust Your word alone. Help us understand that when You speak, circumstances must obey. We don't need to see to believe. In Jesus' name, amen.",
        "key_verse_ref": "Matthew 8:10 (WEB)",
        "key_verse_text": "When Jesus heard it, he marveled, and said to those who followed, 'Most certainly I tell you, I haven't found so great a faith, not even in Israel.'",
        "bites": [
            {
                "id": "bkft-ae-faith-3-1",
                "title": "Faith That Understands Authority",
                "scripture_ref": "Matthew 8:8-9 (WEB)",
                "scripture_text": "Just say the word, and my servant will be healed. For I am also a man under authority...",
                "teaching": "The centurion understood chain of command. He knew that Jesus' word carried divine authority—sickness had to respond to His command just as soldiers responded to the centurion's. Faith is trusting that Jesus' word is enough, even without physical evidence.",
                "question": {"id": "q-bkft-ae-faith-3-1", "type": "reflection", "prompt": "What situation in your life needs you to simply trust Jesus' word?"}
            }
        ],
        "to_go_box": ["Faith trusts the Word", "Authority flows through submission", "Great faith amazes Jesus"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 12: Joseph of Arimathea
    {
        "id": "breakfast-ae-faith-4",
        "lesson_number": 12,
        "title": "Joseph of Arimathea: Trust the Process",
        "series_name": "Breakfast Series (Adult)",
        "edition": "Adult",
        "month": 3,
        "theme": "Faith & Foresight",
        "background_text": "Matthew 27:57-61; John 19:38-42",
        "appetizer": "Joseph of Arimathea was a secret disciple—wealthy, influential, but quiet about his faith. When Jesus died, something shifted. Joseph boldly asked Pilate for the body and placed Jesus in his own new tomb. His moment came not in Jesus' ministry, but in Jesus' burial.",
        "opening_prayer": "Lord, prepare us for our moment. Even when our faith has been quiet, give us boldness when it counts. Help us trust Your process and timing. In Jesus' name, amen.",
        "key_verse_ref": "Matthew 27:57-58 (WEB)",
        "key_verse_text": "He went to Pilate and asked for Jesus' body. Then Pilate commanded it to be given up.",
        "bites": [
            {
                "id": "bkft-ae-faith-4-1",
                "title": "Prepared for the Moment",
                "scripture_ref": "John 19:38 (WEB)",
                "scripture_text": "Joseph of Arimathea, being a disciple of Jesus, but secretly for fear of the Jews, asked...",
                "teaching": "Joseph's tomb wasn't an accident—it was preparation. His wealth, his position, even his secrecy positioned him for a moment no one expected. God uses our preparation, even when we don't understand the purpose. Trust the process; your moment is coming.",
                "question": {"id": "q-bkft-ae-faith-4-1", "type": "reflection", "prompt": "What has God been preparing in your life that might be for an unexpected purpose?"}
            }
        ],
        "to_go_box": ["Quiet faith can become bold action", "God prepares us for moments we don't expect", "Trust the process"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    }
]

# BREAKFAST SERIES - Youth Edition (All 12 Lessons)
BREAKFAST_YE_NIBBLES = [
    # ========== MONTH 1: PRAYER, THE FIRST RESORT ==========
    # Lesson 1: Esther
    {
        "id": "breakfast-ye-prayer-1",
        "lesson_number": 1,
        "title": "Esther: Second Is the Best",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 1,
        "theme": "Prayer, the First Resort",
        "background_text": "Esther 1-4",
        "appetizer": "Queen Esther was young, beautiful, and living in a palace—but she had a big secret and an even bigger choice to make. Would she stay quiet and safe, or speak up and risk everything? Her story shows us that God puts us in the right place at the right time for a reason!",
        "opening_prayer": "God, help us be brave like Esther. When we feel scared to speak up or stand out, remind us that You're with us. In Jesus' name, amen.",
        "key_verse_ref": "Esther 4:14 (WEB)",
        "key_verse_text": "Who knows if you haven't come to the kingdom for such a time as this?",
        "bites": [
            {
                "id": "bkft-ye-prayer-1-1",
                "title": "Right Place, Right Time",
                "scripture_ref": "Esther 4:14 (WEB)",
                "scripture_text": "Who knows if you haven't come to the kingdom for such a time as this?",
                "teaching": "Esther didn't become queen by accident. God had a plan! And guess what? God has a plan for you too. The school you're at, the family you're in, the friends you have—God is using all of it to prepare you for something amazing.",
                "question": {"id": "q-bkft-ye-prayer-1-1", "type": "reflection", "prompt": "Where has God placed you? How might He want to use you there?"}
            }
        ],
        "to_go_box": ["God has a plan for you", "Being brave means trusting God", "You're where you are for a reason"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 2: Solomon
    {
        "id": "breakfast-ye-prayer-2",
        "lesson_number": 2,
        "title": "Solomon: Wisdom in Response",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 1,
        "theme": "Prayer, the First Resort",
        "background_text": "1 Kings 3:5-14; 2 Chronicles 1:7-12",
        "appetizer": "Imagine God showing up and saying, 'Ask for anything you want.' That's what happened to Solomon! He could have asked for a million dollars, superpowers, or to be the most popular kid ever. But Solomon asked for wisdom. And God was so happy with that answer, He gave Solomon bonus gifts too!",
        "opening_prayer": "God, give us wisdom like Solomon. Help us make good choices and know what's right. In Jesus' name, amen.",
        "key_verse_ref": "1 Kings 3:9 (WEB)",
        "key_verse_text": "Give your servant therefore an understanding heart to judge your people, that I may discern between good and evil.",
        "bites": [
            {
                "id": "bkft-ye-prayer-2-1",
                "title": "The Best Request",
                "scripture_ref": "1 Kings 3:9 (WEB)",
                "scripture_text": "Give your servant therefore an understanding heart.",
                "teaching": "Solomon didn't ask for stuff—he asked for wisdom. Wisdom is knowing the right thing to do and doing it. When you ask God for wisdom, He's always happy to give it. It's like having a superpower for making good decisions!",
                "question": {"id": "q-bkft-ye-prayer-2-1", "type": "reflection", "prompt": "If God said you could have anything, what would you ask for?"}
            }
        ],
        "to_go_box": ["Wisdom is better than stuff", "God loves when we ask for wisdom", "Smart choices = blessed life"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 3: Jesus
    {
        "id": "breakfast-ye-prayer-3",
        "lesson_number": 3,
        "title": "Jesus",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 1,
        "theme": "Prayer, the First Resort",
        "background_text": "Luke 5:15-16; Luke 11:1-4; Luke 18:1-8",
        "appetizer": "Jesus was God's Son—He could do anything! But here's the cool part: He still made time to pray. A lot. If Jesus needed to pray, we definitely do! Jesus shows us that talking to God isn't just for emergencies—it's for every day.",
        "opening_prayer": "Jesus, teach us to pray like You did. Help us want to talk to God every day, not just when things go wrong. In Your name, amen.",
        "key_verse_ref": "Luke 18:1 (WEB)",
        "key_verse_text": "He also spoke a parable to them that they must always pray and not give up.",
        "bites": [
            {
                "id": "bkft-ye-prayer-3-1",
                "title": "Never Give Up Praying",
                "scripture_ref": "Luke 18:1 (WEB)",
                "scripture_text": "They must always pray and not give up.",
                "teaching": "Jesus told His followers to keep praying and never quit. Sometimes it feels like God isn't listening, but He always is. Keep talking to Him—about everything! The big stuff, the small stuff, the happy stuff, the hard stuff.",
                "question": {"id": "q-bkft-ye-prayer-3-1", "type": "reflection", "prompt": "What's something you've stopped praying about that you should start again?"}
            }
        ],
        "to_go_box": ["Prayer is for every day", "Don't give up praying", "Jesus prayed—so should we"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 4: Paul & Silas
    {
        "id": "breakfast-ye-prayer-4",
        "lesson_number": 4,
        "title": "Paul & Silas",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 1,
        "theme": "Prayer, the First Resort",
        "background_text": "Acts 16:16-34",
        "appetizer": "Paul and Silas were thrown in jail for doing the right thing. Beaten up. Locked in chains. Stuck in the darkest part of the prison. So what did they do? They started singing worship songs! At midnight! And God showed up in a major way.",
        "opening_prayer": "Lord, give us faith like Paul and Silas. Help us praise You even when things are hard. In Jesus' name, amen.",
        "key_verse_ref": "Acts 16:25 (WEB)",
        "key_verse_text": "But about midnight Paul and Silas were praying and singing hymns to God, and the prisoners were listening to them.",
        "bites": [
            {
                "id": "bkft-ye-prayer-4-1",
                "title": "Praise in the Prison",
                "scripture_ref": "Acts 16:25 (WEB)",
                "scripture_text": "About midnight Paul and Silas were praying and singing hymns to God.",
                "teaching": "Paul and Silas didn't wait until they felt happy to worship. They praised God in the middle of their worst moment. And guess what? An earthquake shook the prison and set them free! Sometimes worship is the key that unlocks our chains.",
                "question": {"id": "q-bkft-ye-prayer-4-1", "type": "reflection", "prompt": "What's something hard you're going through that you could praise God in?"}
            }
        ],
        "to_go_box": ["Praise even when it's hard", "Worship unlocks chains", "God hears midnight prayers"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    
    # ========== MONTH 2: THE ART OF THROUGH ==========
    # Lesson 5: Joseph
    {
        "id": "breakfast-ye-through-1",
        "lesson_number": 5,
        "title": "Joseph: The Young Dreamer",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 2,
        "theme": "The Art of Through",
        "background_text": "Genesis 37:1-36",
        "appetizer": "Joseph was his dad's favorite—and his brothers hated him for it. They threw him in a pit, sold him as a slave, and told their dad he was dead! But Joseph's story didn't end there. God took all the bad stuff and turned it into something incredible.",
        "opening_prayer": "Lord, when things aren't fair and life gets hard, help us trust You like Joseph did. You can turn our messes into miracles. In Jesus' name, amen.",
        "key_verse_ref": "Genesis 50:20 (WEB)",
        "key_verse_text": "You meant evil against me, but God meant it for good.",
        "bites": [
            {
                "id": "bkft-ye-through-1-1",
                "title": "From Pit to Palace",
                "scripture_ref": "Genesis 50:20 (WEB)",
                "scripture_text": "You meant evil against me, but God meant it for good.",
                "teaching": "Joseph's brothers did something terrible. But years later, Joseph was in charge of all of Egypt and saved his whole family from starving! God didn't waste Joseph's pain—He used it. God can do the same with the hard things you go through.",
                "question": {"id": "q-bkft-ye-through-1-1", "type": "reflection", "prompt": "Have you ever seen something bad turn into something good?"}
            }
        ],
        "to_go_box": ["God doesn't waste your pain", "Keep dreaming even when it's hard", "What others mean for bad, God can use for good"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 6: Hannah
    {
        "id": "breakfast-ye-through-2",
        "lesson_number": 6,
        "title": "Hannah: Barren but Not Lifeless",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 2,
        "theme": "The Art of Through",
        "background_text": "1 Samuel 1:1-28",
        "appetizer": "Hannah wanted a baby more than anything, but year after year, nothing happened. People made fun of her. She cried a lot. But instead of giving up on God, she kept praying. And when God finally answered, she gave her son back to God to serve Him forever.",
        "opening_prayer": "God, when we're waiting for something and it feels like forever, help us keep trusting You like Hannah did. In Jesus' name, amen.",
        "key_verse_ref": "1 Samuel 1:27 (WEB)",
        "key_verse_text": "For this child I prayed. Yahweh has given me my petition which I asked of him.",
        "bites": [
            {
                "id": "bkft-ye-through-2-1",
                "title": "Pray Through the Pain",
                "scripture_ref": "1 Samuel 1:10 (WEB)",
                "scripture_text": "She was in bitterness of soul, and prayed to Yahweh, and wept bitterly.",
                "teaching": "Hannah didn't pretend everything was fine. She told God exactly how she felt—even when she was crying her eyes out. God can handle your real emotions. Don't hide your feelings from Him. Pray through the pain!",
                "question": {"id": "q-bkft-ye-through-2-1", "type": "reflection", "prompt": "What's something you've been feeling that you need to be honest with God about?"}
            }
        ],
        "to_go_box": ["It's okay to cry to God", "Keep praying even when waiting", "God hears honest prayers"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 7: Abram
    {
        "id": "breakfast-ye-through-3",
        "lesson_number": 7,
        "title": "Abram: No Heir, Wait Here",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 2,
        "theme": "The Art of Through",
        "background_text": "Genesis 15:1-6; Genesis 17:1-8",
        "appetizer": "God promised Abram he'd have more grandkids than he could count. Just one problem: Abram didn't even have ONE kid yet. And he was really, really old. But Abram believed God anyway, and that faith made him one of the greatest heroes in the Bible.",
        "opening_prayer": "Father, help us trust Your promises even when they seem impossible. Give us faith like Abram. In Jesus' name, amen.",
        "key_verse_ref": "Genesis 15:6 (WEB)",
        "key_verse_text": "He believed in Yahweh, and he credited it to him for righteousness.",
        "bites": [
            {
                "id": "bkft-ye-through-3-1",
                "title": "Believe the Impossible",
                "scripture_ref": "Genesis 15:5 (WEB)",
                "scripture_text": "Look now toward the sky, and count the stars... So will your offspring be.",
                "teaching": "God told old Abram to count the stars—that's how many grandkids he'd have. Impossible? Yep! But Abram believed anyway. Faith isn't about understanding everything. It's about trusting that God can do what He says, even when it makes zero sense.",
                "question": {"id": "q-bkft-ye-through-3-1", "type": "reflection", "prompt": "What 'impossible' thing do you need to trust God for?"}
            }
        ],
        "to_go_box": ["Faith believes the impossible", "God keeps His promises", "Waiting is part of the journey"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 8: Chronic Conditions (Woman with issue of blood)
    {
        "id": "breakfast-ye-through-4",
        "lesson_number": 8,
        "title": "Chronic Conditions",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 2,
        "theme": "The Art of Through",
        "background_text": "Luke 8:43-48",
        "appetizer": "She'd been sick for 12 years. Spent all her money on doctors. Nothing worked. Everyone called her 'unclean' and wouldn't come near her. But one day, she heard Jesus was passing by. She thought, 'If I can just touch His clothes...' And that one touch changed everything.",
        "opening_prayer": "Jesus, give us faith to reach for You no matter what. Even when we feel broken or forgotten, You can make us whole. In Your name, amen.",
        "key_verse_ref": "Luke 8:48 (WEB)",
        "key_verse_text": "He said to her, 'Daughter, cheer up. Your faith has made you well. Go in peace.'",
        "bites": [
            {
                "id": "bkft-ye-through-4-1",
                "title": "The Touch That Changed Everything",
                "scripture_ref": "Luke 8:44 (WEB)",
                "scripture_text": "She came behind him and touched the fringe of his cloak, and immediately her bleeding stopped.",
                "teaching": "This woman didn't let 12 years of disappointment stop her. She pushed through the crowd, reached out in faith, and touched Jesus. That one moment of brave faith ended 12 years of suffering. Jesus can do the same for you.",
                "question": {"id": "q-bkft-ye-through-4-1", "type": "reflection", "prompt": "What do you need to 'push through' to get closer to Jesus?"}
            }
        ],
        "to_go_box": ["One touch can change everything", "Don't let your past stop you", "Jesus makes you whole"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    
    # ========== MONTH 3: FAITH & FORESIGHT ==========
    # Lesson 9: Rahab
    {
        "id": "breakfast-ye-faith-1",
        "lesson_number": 9,
        "title": "Rahab: Faith That Took Action",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 3,
        "theme": "Faith & Foresight",
        "background_text": "Joshua 2:1-21; 6:22-25",
        "appetizer": "Rahab wasn't one of 'God's people'—but she believed in God anyway! When Israelite spies came to her city, she made a brave choice. She hid them and asked them to save her family. That one brave decision changed everything for Rahab and her family forever.",
        "opening_prayer": "God, help us be brave like Rahab. Even when we feel like we don't fit in or belong, remind us that You see us and have a plan for us. In Jesus' name, amen.",
        "key_verse_ref": "Joshua 2:11 (WEB)",
        "key_verse_text": "For Yahweh your God, he is God in heaven above, and on earth beneath.",
        "bites": [
            {
                "id": "bkft-ye-faith-1-1",
                "title": "Brave Belief",
                "scripture_ref": "Joshua 2:11 (WEB)",
                "scripture_text": "For Yahweh your God, he is God in heaven above, and on earth beneath.",
                "teaching": "Rahab had heard stories about God. She chose to believe those stories were true—even though everyone around her worshipped fake gods. Her belief led her to action, and that action saved her whole family!",
                "question": {"id": "q-bkft-ye-faith-1-1", "type": "reflection", "prompt": "What's one brave thing you can do this week to show your faith?"}
            }
        ],
        "to_go_box": ["It's never too late to believe", "Faith leads to action", "God can use anyone—including you!"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 10: Abigail
    {
        "id": "breakfast-ye-faith-2",
        "lesson_number": 10,
        "title": "Abigail: Wisdom on the Move",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 3,
        "theme": "Faith & Foresight",
        "background_text": "1 Samuel 25:2-35",
        "appetizer": "Abigail's husband was a fool (seriously, that's what his name means!). He made a powerful guy named David really angry. Abigail knew disaster was coming, so she moved fast with wisdom and stopped a battle before it started. Smart move, Abigail!",
        "opening_prayer": "Lord, give us wisdom like Abigail. Help us see problems coming and do something smart about it. In Jesus' name, amen.",
        "key_verse_ref": "1 Samuel 25:33 (WEB)",
        "key_verse_text": "Blessed is your discretion, and blessed are you, who have kept me today from blood guiltiness.",
        "bites": [
            {
                "id": "bkft-ye-faith-2-1",
                "title": "Smart and Quick",
                "scripture_ref": "1 Samuel 25:18 (WEB)",
                "scripture_text": "Then Abigail hurried...",
                "teaching": "Abigail didn't sit around worrying. She saw the problem, made a plan, and moved fast. Wisdom isn't just knowing stuff—it's doing the right thing at the right time. Sometimes you've got to move quick!",
                "question": {"id": "q-bkft-ye-faith-2-1", "type": "reflection", "prompt": "Is there a problem you need to deal with before it gets worse?"}
            }
        ],
        "to_go_box": ["Wisdom takes action", "Don't wait for disaster", "Quick thinking saves the day"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 11: The Centurion
    {
        "id": "breakfast-ye-faith-3",
        "lesson_number": 11,
        "title": "The Centurion: Faith That Commands Results",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 3,
        "theme": "Faith & Foresight",
        "background_text": "Matthew 8:5-13; Luke 7:1-10",
        "appetizer": "A Roman soldier came to Jesus asking for help. His servant was sick. But here's the wild part—he told Jesus He didn't even need to come over. Just say the word and it's done! Jesus was amazed by this guy's faith. Even Jesus can be impressed!",
        "opening_prayer": "Lord, grow our faith to trust Your word completely. Help us believe that when You speak, things happen! In Jesus' name, amen.",
        "key_verse_ref": "Matthew 8:10 (WEB)",
        "key_verse_text": "When Jesus heard it, he marveled... 'I haven't found so great a faith, not even in Israel.'",
        "bites": [
            {
                "id": "bkft-ye-faith-3-1",
                "title": "Just Say the Word",
                "scripture_ref": "Matthew 8:8 (WEB)",
                "scripture_text": "Just say the word, and my servant will be healed.",
                "teaching": "The centurion understood authority. When he gave orders, soldiers obeyed. He knew Jesus had that same authority over sickness. He didn't need Jesus to show up physically—he just needed Jesus to speak. That's next-level faith!",
                "question": {"id": "q-bkft-ye-faith-3-1", "type": "reflection", "prompt": "Do you trust that Jesus' word is enough?"}
            }
        ],
        "to_go_box": ["Jesus' word is powerful", "Faith trusts without seeing", "You can amaze Jesus with your faith"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    },
    # Lesson 12: Joseph of Arimathea
    {
        "id": "breakfast-ye-faith-4",
        "lesson_number": 12,
        "title": "Joseph of Arimathea: Trust the Process",
        "series_name": "Breakfast Series (Youth)",
        "edition": "Youth",
        "month": 3,
        "theme": "Faith & Foresight",
        "background_text": "Matthew 27:57-61; John 19:38-42",
        "appetizer": "Joseph of Arimathea was a secret follower of Jesus. He was rich and important, but he kept his faith quiet. Then Jesus died, and Joseph did something bold—he asked for Jesus' body and buried Him in his own tomb. Sometimes quiet faith becomes loud action at just the right moment.",
        "opening_prayer": "Lord, prepare us for our moment. Even if our faith has been quiet, make us bold when it matters. In Jesus' name, amen.",
        "key_verse_ref": "Matthew 27:58 (WEB)",
        "key_verse_text": "He went to Pilate and asked for Jesus' body.",
        "bites": [
            {
                "id": "bkft-ye-faith-4-1",
                "title": "The Right Moment",
                "scripture_ref": "John 19:38 (WEB)",
                "scripture_text": "Joseph of Arimathea, being a disciple of Jesus, but secretly for fear of the Jews, asked...",
                "teaching": "Joseph's tomb wasn't random—God had it ready. Joseph's wealth and position weren't accidents either. God was preparing him for a moment no one expected. God might be preparing you for something right now that you don't even know about yet!",
                "question": {"id": "q-bkft-ye-faith-4-1", "type": "reflection", "prompt": "What might God be preparing you for that you can't see yet?"}
            }
        ],
        "to_go_box": ["God prepares you for your moment", "Quiet faith can become bold action", "Trust the process"],
        "price_download": 3.59,
        "price_interactive": 4.59,
        "is_free": False
    }
]

# Combine all nibbles for lookup
ALL_NIBBLES = IN_HIS_IMAGE_NIBBLES + HOLIDAY_AE_NIBBLES + BREAKFAST_AE_NIBBLES + BREAKFAST_YE_NIBBLES

# Snack Pack definitions - 4 lessons per pack
IN_HIS_IMAGE_SNACK_PACK_DEF = IN_HIS_IMAGE_SNACK_PACK  # Already defined above

# Breakfast AE Snack Packs
BREAKFAST_AE_PRAYER_SNACK_PACK = {
    "id": "breakfast-ae-prayer-snack-pack",
    "name": "Prayer, the First Resort (Adult)",
    "series": "Breakfast",
    "edition": "Adult",
    "month": 1,
    "description": "4-lesson snack pack exploring prayer through the stories of Esther, Solomon, Jesus, and Paul & Silas.",
    "nibbles": ["breakfast-ae-prayer-1", "breakfast-ae-prayer-2", "breakfast-ae-prayer-3", "breakfast-ae-prayer-4"],
    "price": 12.99,
    "lesson_count": 4
}

BREAKFAST_AE_THROUGH_SNACK_PACK = {
    "id": "breakfast-ae-through-snack-pack",
    "name": "The Art of Through (Adult)",
    "series": "Breakfast",
    "edition": "Adult",
    "month": 2,
    "description": "4-lesson snack pack on perseverance through the stories of Joseph, Hannah, Abram, and Victory Through the Blood.",
    "nibbles": ["breakfast-ae-through-1", "breakfast-ae-through-2", "breakfast-ae-through-3", "breakfast-ae-through-4"],
    "price": 12.99,
    "lesson_count": 4
}

BREAKFAST_AE_FAITH_SNACK_PACK = {
    "id": "breakfast-ae-faith-snack-pack",
    "name": "Faith & Foresight (Adult)",
    "series": "Breakfast",
    "edition": "Adult",
    "month": 3,
    "description": "4-lesson snack pack on faith in action through the stories of Rahab, Abigail, the Centurion, and Joseph of Arimathea.",
    "nibbles": ["breakfast-ae-faith-1", "breakfast-ae-faith-2", "breakfast-ae-faith-3", "breakfast-ae-faith-4"],
    "price": 12.99,
    "lesson_count": 4
}

# Breakfast YE Snack Packs
BREAKFAST_YE_PRAYER_SNACK_PACK = {
    "id": "breakfast-ye-prayer-snack-pack",
    "name": "Prayer, the First Resort (Youth)",
    "series": "Breakfast",
    "edition": "Youth",
    "month": 1,
    "description": "4-lesson snack pack exploring prayer through the stories of Esther, Solomon, Jesus, and Paul & Silas.",
    "nibbles": ["breakfast-ye-prayer-1", "breakfast-ye-prayer-2", "breakfast-ye-prayer-3", "breakfast-ye-prayer-4"],
    "price": 10.99,
    "lesson_count": 4
}

BREAKFAST_YE_THROUGH_SNACK_PACK = {
    "id": "breakfast-ye-through-snack-pack",
    "name": "The Art of Through (Youth)",
    "series": "Breakfast",
    "edition": "Youth",
    "month": 2,
    "description": "4-lesson snack pack on perseverance through the stories of Joseph, Hannah, Abram, and the woman with the issue of blood.",
    "nibbles": ["breakfast-ye-through-1", "breakfast-ye-through-2", "breakfast-ye-through-3", "breakfast-ye-through-4"],
    "price": 10.99,
    "lesson_count": 4
}

BREAKFAST_YE_FAITH_SNACK_PACK = {
    "id": "breakfast-ye-faith-snack-pack",
    "name": "Faith & Foresight (Youth)",
    "series": "Breakfast",
    "edition": "Youth",
    "month": 3,
    "description": "4-lesson snack pack on faith in action through the stories of Rahab, Abigail, the Centurion, and Joseph of Arimathea.",
    "nibbles": ["breakfast-ye-faith-1", "breakfast-ye-faith-2", "breakfast-ye-faith-3", "breakfast-ye-faith-4"],
    "price": 10.99,
    "lesson_count": 4
}

# All Snack Packs
ALL_SNACK_PACKS = [
    IN_HIS_IMAGE_SNACK_PACK,
    BREAKFAST_AE_PRAYER_SNACK_PACK,
    BREAKFAST_AE_THROUGH_SNACK_PACK,
    BREAKFAST_AE_FAITH_SNACK_PACK,
    BREAKFAST_YE_PRAYER_SNACK_PACK,
    BREAKFAST_YE_THROUGH_SNACK_PACK,
    BREAKFAST_YE_FAITH_SNACK_PACK
]

@router.get("/snack-packs")
async def get_snack_packs():
    """Get all available snack packs"""
    return {
        "snack_packs": ALL_SNACK_PACKS
    }

@router.get("/snack-pack/{pack_id}")
async def get_snack_pack(pack_id: str):
    """Get a specific snack pack with its nibbles"""
    for pack in ALL_SNACK_PACKS:
        if pack["id"] == pack_id:
            pack_nibbles = [n for n in ALL_NIBBLES if n["id"] in pack["nibbles"]]
            return {
                "snack_pack": pack,
                "nibbles": pack_nibbles
            }
    raise HTTPException(status_code=404, detail="Snack pack not found")

@router.get("/nibbles")
async def get_all_nibbles():
    """Get all available nibbles (individual lessons)"""
    return {
        "nibbles": [
            {
                "id": n["id"],
                "lesson_number": n["lesson_number"],
                "title": n["title"],
                "series_name": n["series_name"],
                "key_verse_ref": n["key_verse_ref"],
                "theme": n.get("theme", ""),
                "is_bonus": n.get("is_bonus", False),
                "is_free": n.get("is_free", False),
                "price_download": n.get("price_download", 0),
                "price_interactive": n.get("price_interactive", 0)
            } for n in ALL_NIBBLES
        ]
    }

@router.get("/nibble/{nibble_id}")
async def get_nibble(nibble_id: str):
    """Get a specific nibble (lesson)"""
    for nibble in ALL_NIBBLES:
        if nibble["id"] == nibble_id:
            return {"nibble": nibble}
    raise HTTPException(status_code=404, detail="Nibble not found")


# ---------------------------------------------------------------------------
# Entitlement check — INLINE viewer access (bypasses fulfillment / download_link
# logic entirely per soft-launch policy: if a user has an active entitlement —
# either the lesson is free OR they have a paid order whose items expand to a
# product covering this nibble — they may render the iPDF in the browser viewer.
# ---------------------------------------------------------------------------
def _grants_for_nibble(nibble_id: str) -> set:
    """Set of product_ids whose ownership grants viewer access to this nibble."""
    parts = nibble_id.split("-") if nibble_id else []
    grants: set = set()
    if len(parts) < 3:
        return grants
    series = parts[0]
    edition_code = parts[1]
    edition_word = {"ae": "adult", "ye": "youth", "ie": "instructor"}.get(edition_code, "adult")
    # 1. Direct interactive nibble product
    grants.add(f"{series}-nibble-{nibble_id}-{edition_word}-interactive")
    # 2. Any-nibble pass for this edition
    grants.add(f"{series}-nibble-{edition_word}-interactive")
    # 3. Full series interactive
    grants.add(f"{series}-full-{edition_word}-interactive")
    grants.add(f"{series}-full-{edition_code}-interactive")
    # 4. Series digital / print
    grants.add(f"{series}_{edition_code}")
    grants.add(f"{series}_{edition_code}_digital")
    grants.add(f"{series}_{edition_code}_print")
    # 5. Breakfast snack packs cover their lessons (broad pass — narrows below if needed)
    if series == "breakfast":
        for m in (1, 2, 3):
            grants.add(f"breakfast-snack-month-{m}-{edition_word}-interactive")
            grants.add(f"breakfast-snack-month-{m}-{edition_word}-digital")
    return grants


def _expand_purchased_product_ids(items: list) -> set:
    """Given the items array on a paid order, return the full set of effective
    product_ids the buyer owns — including bundle expansions."""
    try:
        from payment_routes import BUNDLE_EXPANSIONS
    except Exception:
        BUNDLE_EXPANSIONS = {}
    owned: set = set()
    for it in items or []:
        pid = it.get("product_id") or it.get("id") or it.get("uniqueKey")
        if not pid:
            continue
        owned.add(pid)
        # Expand if bundle
        if pid in BUNDLE_EXPANSIONS:
            for sub in BUNDLE_EXPANSIONS[pid]:
                owned.add(sub)
    return owned


@router.get("/entitlement/{nibble_id}")
async def check_nibble_entitlement(nibble_id: str, request: Request):
    """Return {has_access, reason} for the current user against a given nibble.
    Free nibbles always return has_access=true. For paid nibbles, scans the
    user's paid orders (payment_transactions) and matches against bundle-aware
    grant set. Auth optional — unauthenticated requests get has_access=false
    unless the nibble is free."""
    # Locate the nibble first to read its is_free flag
    nibble = next((n for n in ALL_NIBBLES if n["id"] == nibble_id), None)
    if not nibble:
        raise HTTPException(status_code=404, detail="Nibble not found")

    if nibble.get("is_free") is True:
        return {"has_access": True, "reason": "free", "nibble_id": nibble_id}

    # Auth optional — peek at the bearer token if present.
    user_id, user_email = None, None
    auth_header = request.headers.get("Authorization") or ""
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            from jose import jwt
            secret = os.getenv("JWT_SECRET_KEY", "soul-food-secret-key-change-in-production-2024")
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            user_id = payload.get("sub")
            user_email = payload.get("email")
        except Exception:
            pass  # fall through to anon

    if not user_id and not user_email:
        return {"has_access": False, "reason": "not_authenticated", "nibble_id": nibble_id}

    # Resolve email if missing
    if user_id and not user_email:
        from server import db
        u = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1})
        if u:
            user_email = u.get("email")

    # Scan paid transactions for this user
    from server import db
    or_clauses = []
    if user_id:
        or_clauses.append({"user_id": user_id})
    if user_email:
        or_clauses.append({"customer_email": user_email})
    query = {"payment_status": "paid", "$or": or_clauses} if or_clauses else None
    if not query:
        return {"has_access": False, "reason": "not_authenticated", "nibble_id": nibble_id}

    grants = _grants_for_nibble(nibble_id)
    cursor = db.payment_transactions.find(query, {"_id": 0, "items": 1, "order_number": 1, "session_id": 1})
    async for txn in cursor:
        owned = _expand_purchased_product_ids(txn.get("items"))
        if owned & grants:
            return {
                "has_access": True,
                "reason": "purchased",
                "nibble_id": nibble_id,
                "order_number": txn.get("order_number") or txn.get("session_id"),
            }

    return {"has_access": False, "reason": "no_matching_purchase", "nibble_id": nibble_id}


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
    for n in ALL_NIBBLES:
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

@router.get("/download/nibble/{nibble_id}")
async def download_nibble_pdf(nibble_id: str):
    """Download a single lesson as PDF - serves uploaded PDFs first, falls back to generated"""
    import os
    from fastapi.responses import FileResponse
    
    # Check multiple possible locations for uploaded PDFs
    possible_paths = [
        f"/app/backend/content/downloads/{nibble_id}.pdf",
        f"/app/backend/lesson_pdfs/{nibble_id}.pdf",
        f"/app/backend/content/{nibble_id}.pdf",
        f"/app/content/downloads/{nibble_id}.pdf",
        f"/app/content/{nibble_id}.pdf"
    ]
    
    for uploaded_pdf_path in possible_paths:
        if os.path.exists(uploaded_pdf_path):
            return FileResponse(
                uploaded_pdf_path,
                media_type="application/pdf",
                filename=f"SoulFood_{nibble_id}.pdf"
            )
    
    # Find the nibble for fallback generation
    nibble = None
    for n in ALL_NIBBLES:
        if n["id"] == nibble_id:
            nibble = n
            break
    
    if not nibble:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Fallback: Generate PDF (basic quality)
    pdf_buffer = pdf_generator.generate_lesson_pdf(nibble)
    
    # Create filename
    filename = f"SoulFood_{nibble['series_name'].replace(' ', '_')}_{nibble['title'].replace(' ', '_')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/download/snackpack/{series}/{edition}/{month}")
async def download_snackpack_pdf(series: str, edition: str, month: int):
    """
    Download a Snack Pack PDF (4 lessons for a month)
    
    Args:
        series: 'breakfast' or 'holiday'
        edition: 'ae' (adult) or 'ye' (youth)
        month: Month number (1, 2, 3, etc.)
    """
    import os
    from fastapi.responses import FileResponse
    
    # Map to file naming convention
    pdf_folder = "/app/backend/lesson_pdfs"
    filename = f"{series}-{edition}-month{month}-snackpack.pdf"
    pdf_path = os.path.join(pdf_folder, filename)
    
    if os.path.exists(pdf_path):
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"SoulFood_{series.title()}_{edition.upper()}_Month{month}_SnackPack.pdf"
        )
    
    raise HTTPException(
        status_code=404, 
        detail=f"Snack Pack not found. Expected file: {filename}"
    )


# Nibble (individual lesson) ID mapping
NIBBLE_FILES = {
    # Adult Breakfast - Month 1: Prayer
    "breakfast-ae-esther": "breakfast-ae-esther.pdf",
    "breakfast-ae-solomon": "breakfast-ae-solomon.pdf",
    "breakfast-ae-jesus": "breakfast-ae-jesus.pdf",
    "breakfast-ae-paul-silas": "breakfast-ae-paul-silas.pdf",
    # Adult Breakfast - Month 2: Art of Through
    "breakfast-ae-joseph": "breakfast-ae-joseph.pdf",
    "breakfast-ae-hannah": "breakfast-ae-hannah.pdf",
    "breakfast-ae-abram": "breakfast-ae-abram.pdf",
    "breakfast-ae-chronic": "breakfast-ae-chronic.pdf",
    # Adult Breakfast - Month 3: Faith & Foresight
    "breakfast-ae-rahab": "breakfast-ae-rahab.pdf",
    "breakfast-ae-abigail": "breakfast-ae-abigail.pdf",
    "breakfast-ae-centurion": "breakfast-ae-centurion.pdf",
    "breakfast-ae-joseph-arimathea": "breakfast-ae-joseph-arimathea.pdf",
}

# Friendly names for download filenames
NIBBLE_NAMES = {
    "breakfast-ae-esther": "Esther_Second_Is_Best",
    "breakfast-ae-solomon": "Solomon_Wisdom_In_Response",
    "breakfast-ae-jesus": "Jesus_Prayer_First_Resort",
    "breakfast-ae-paul-silas": "Paul_Silas_Faith_In_Dark",
    "breakfast-ae-joseph": "Joseph_Young_Dreamer",
    "breakfast-ae-hannah": "Hannah_Barren_Not_Lifeless",
    "breakfast-ae-abram": "Abram_No_Heir_Wait_Here",
    "breakfast-ae-chronic": "Chronic_Conditions",
    "breakfast-ae-rahab": "Rahab_Faith_That_Took_Action",
    "breakfast-ae-abigail": "Abigail_Wisdom_On_Move",
    "breakfast-ae-centurion": "Centurion_Faith_Commands_Results",
    "breakfast-ae-joseph-arimathea": "Joseph_Arimathea_Trust_Process",
}


@router.get("/download/nibble-file/{nibble_id}")
async def download_nibble_file(nibble_id: str):
    """
    Download an individual lesson (Nibble) PDF
    
    Args:
        nibble_id: e.g., 'breakfast-ae-esther', 'breakfast-ae-joseph'
    """
    import os
    from fastapi.responses import FileResponse
    
    pdf_folder = "/app/backend/lesson_pdfs"
    
    # Check if nibble_id is in our mapping
    if nibble_id in NIBBLE_FILES:
        filename = NIBBLE_FILES[nibble_id]
        pdf_path = os.path.join(pdf_folder, filename)
        
        if os.path.exists(pdf_path):
            friendly_name = NIBBLE_NAMES.get(nibble_id, nibble_id)
            return FileResponse(
                pdf_path,
                media_type="application/pdf",
                filename=f"SoulFood_{friendly_name}.pdf"
            )
    
    # Fallback: try direct file match
    direct_path = os.path.join(pdf_folder, f"{nibble_id}.pdf")
    if os.path.exists(direct_path):
        return FileResponse(
            direct_path,
            media_type="application/pdf",
            filename=f"SoulFood_{nibble_id}.pdf"
        )
    
    raise HTTPException(
        status_code=404, 
        detail=f"Nibble not found: {nibble_id}"
    )


@router.get("/download/full/{series}/{edition}")
async def download_full_series_pdf(series: str, edition: str):
    """
    Download the full series PDF (all lessons)
    
    Args:
        series: 'breakfast' or 'holiday'
        edition: 'ae' (adult) or 'ye' (youth)
    """
    import os
    from fastapi.responses import FileResponse
    
    pdf_folder = "/app/backend/lesson_pdfs"
    filename = f"{series}-{edition}-full.pdf"
    pdf_path = os.path.join(pdf_folder, filename)
    
    if os.path.exists(pdf_path):
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"SoulFood_{series.title()}_{edition.upper()}_Complete.pdf"
        )
    
    raise HTTPException(
        status_code=404, 
        detail=f"Full series not found. Expected file: {filename}"
    )


@router.get("/download/in-his-image/{edition}")
async def download_in_his_image(edition: str):
    """
    Download the FREE In His Image (Self-Worth) series
    
    Args:
        edition: 'adult' or 'youth' (or 'ae'/'ye')
    """
    import os
    from fastapi.responses import FileResponse
    
    # Normalize edition
    if edition.lower() in ['adult', 'ae']:
        filename = "in-his-image-adult-full.pdf"
        edition_label = "Adult"
    elif edition.lower() in ['youth', 'ye']:
        filename = "in-his-image-youth-full.pdf"
        edition_label = "Youth"
    else:
        raise HTTPException(status_code=400, detail="Invalid edition. Use 'adult' or 'youth'")
    
    # Check multiple possible locations
    possible_paths = [
        f"/app/backend/content/downloads/{filename}",
        f"/app/backend/lesson_pdfs/{filename}",
        f"/app/backend/content/{filename}",
        f"/app/content/downloads/{filename}",
        f"/app/content/{filename}"
    ]
    
    for pdf_path in possible_paths:
        if os.path.exists(pdf_path):
            return FileResponse(
                pdf_path,
                media_type="application/pdf",
                filename=f"SoulFood_InHisImage_{edition_label}_FREE.pdf"
            )
    
    raise HTTPException(status_code=404, detail=f"In His Image {edition_label} Edition not found. Please contact support.")


@router.get("/download/series/{series_name}")
async def download_series_pdf(series_name: str):
    """Download all lessons in a series as a single PDF"""
    # Find all nibbles in the series
    series_nibbles = [n for n in ALL_NIBBLES if n["series_name"] == series_name]
    
    if not series_nibbles:
        raise HTTPException(status_code=404, detail="Series not found")
    
    # Sort by lesson number
    series_nibbles.sort(key=lambda x: x.get("lesson_number", 0))
    
    # Generate PDF
    pdf_buffer = pdf_generator.generate_series_pdf(series_nibbles, series_name)
    
    # Create filename
    filename = f"SoulFood_{series_name.replace(' ', '_')}_Complete.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
