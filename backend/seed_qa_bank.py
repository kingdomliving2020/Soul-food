"""
SOFU Master Question Bank Seeder
Seeds all questions from the Master QA Bank documents into MongoDB.
Run: python3 seed_qa_bank.py
"""
import os
from pymongo import MongoClient
from datetime import datetime, timezone

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'soul_food_db')

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# ============================================================================
# HELPER: Insert questions into MongoDB
# ============================================================================
def seed_questions(questions, clear_existing=True):
    coll = db.trivia_questions
    if clear_existing:
        old_count = coll.count_documents({})
        coll.delete_many({})
        print(f"  Cleared {old_count} existing questions")
    
    if questions:
        coll.insert_many(questions)
    print(f"  Inserted {len(questions)} questions")
    
    # Create indexes
    coll.create_index("character")
    coll.create_index("game_type")
    coll.create_index("age_group")
    coll.create_index("difficulty")
    coll.create_index([("character", 1), ("game_type", 1)])
    print("  Indexes created")

def seed_word_studies(studies, clear_existing=True):
    coll = db.word_studies
    if clear_existing:
        coll.delete_many({})
    if studies:
        coll.insert_many(studies)
    print(f"  Inserted {len(studies)} word studies")
    coll.create_index("character")

def seed_reference_sources(sources, clear_existing=True):
    coll = db.reference_sources
    if clear_existing:
        coll.delete_many({})
    if sources:
        coll.insert_many(sources)
    print(f"  Inserted {len(sources)} reference sources")

# ============================================================================
# QUESTION DATA
# ============================================================================
def build_all_questions():
    questions = []
    qid = 1
    
    def q(character, game_type, age_group, difficulty, tier, question_text, 
          answer, options=None, scripture=None, themes=None, category_title=None,
          explanation=None, lesson_node=None):
        nonlocal qid
        entry = {
            "qid": qid,
            "character": character,
            "game_type": game_type,
            "age_group": age_group,
            "difficulty": difficulty,
            "tier": tier,
            "question": question_text,
            "correct_answer": answer,
            "options": options or [],
            "scripture": scripture or "",
            "themes": themes or [],
            "category_title": category_title or "",
            "explanation": explanation or "",
            "lesson_node": lesson_node or "",
            "type": "multiple_choice" if options else ("true_false" if answer in ["True","False"] else "open_ended"),
            "seeded_at": datetime.now(timezone.utc)
        }
        questions.append(entry)
        qid += 1
        return entry

    # ========================================================================
    # RAHAB — Jeopardy (Single)
    # ========================================================================
    q("Rahab", "trivia_testament", "adult", "easy", 100,
      "What city did Rahab live in when she hid the Israelite spies?",
      "Jericho", ["Ai", "Jericho", "Hebron", "Moab"],
      "Joshua 2:1", ["Strategy", "Courage"], "Women of Faith & Fire: Rahab", lesson_node="Q1M3")
    
    q("Rahab", "trivia_testament", "adult", "easy", 200,
      "What item did Rahab use as the sign of her covenant with Israel?",
      "A scarlet cord", ["A gold bracelet", "A scarlet cord", "A silver coin", "A clay jar"],
      "Joshua 2:18", ["Covenant", "Symbolism"], "Women of Faith & Fire: Rahab", lesson_node="Q1M3")
    
    q("Rahab", "trivia_testament", "adult", "medium", 300,
      'What made Rahab confess, "Your God is God in heaven above and on earth below"?',
      "Israel's victories", ["The spies' bravery", "Israel's victories", "Joshua's leadership", "A prophetic dream"],
      "Joshua 2:10-11", ["Faith", "Revelation"], "Women of Faith & Fire: Rahab", lesson_node="Q1M3")
    
    q("Rahab", "trivia_testament", "adult", "medium", 400,
      "Who did Rahab secure safety for when Jericho fell?",
      "Herself and her extended family", ["Only herself", "Herself and her husband", "Herself and her extended family", "Only the spies"],
      "Joshua 6:23", ["Family", "Protection"], "Women of Faith & Fire: Rahab", lesson_node="Q1M3")
    
    q("Rahab", "trivia_testament", "adult", "hard", 500,
      "How did Rahab help the spies avoid capture?",
      "Hid them under flax on her roof", ["Hid them in a cave", "Sent them out another gate", "Hid them under flax on her roof", "Dressed them like merchants"],
      "Joshua 2:6", ["Strategy", "Courage under pressure"], "Women of Faith & Fire: Rahab", lesson_node="Q1M3")

    # Rahab — Double Jeopardy
    q("Rahab", "trivia_testament", "adult", "medium", 200,
      "Rahab became the mother of which important man in the genealogy of Jesus?",
      "Boaz", ["Jesse", "Boaz", "Obed", "Salmon"],
      "Matthew 1:5", ["Lineage", "Redemption"], "Daughters of Destiny: Rahab's Redemption", lesson_node="Q1M3")
    
    q("Rahab", "trivia_testament", "adult", "medium", 400,
      "According to Hebrews 11:31, Rahab was commended for her faith because she...",
      "Hid the spies", ["Sang a prophetic song", "Hid the spies", "Fought in battle", "Interpreted dreams"],
      "Hebrews 11:31", ["Faith", "Works"], "Daughters of Destiny: Rahab's Redemption", lesson_node="Q1M3")
    
    q("Rahab", "trivia_testament", "adult", "hard", 600,
      "What TWO conditions did the spies require for Rahab's family to be saved?",
      "They must stay inside Rahab's house; The scarlet cord must remain visible",
      None, "Joshua 2:18-20", ["Covenant", "Obedience"], "Daughters of Destiny: Rahab's Redemption", lesson_node="Q1M3")
    
    q("Rahab", "trivia_testament", "adult", "hard", 800,
      'According to James 2:25, Rahab was "justified by works" when she:',
      "Received the spies and sent them out another way",
      ["Left Jericho", "Offered sacrifices", "Received the spies and sent them out another way", "Gave money to the poor"],
      "James 2:25", ["Identity", "Transformation"], "Daughters of Destiny: Rahab's Redemption", lesson_node="Q1M3")
    
    q("Rahab", "trivia_testament", "adult", "expert", 1000,
      "Rahab overcame THREE barriers to become part of God's people. Name EACH of these barriers:",
      "Prostitute, Canaanite/Gentile, Citizen of Jericho (a condemned city)",
      None, "Joshua 2; 6", ["Redemption", "Cultural barriers", "God's sovereignty"], "Daughters of Destiny: Rahab's Redemption", lesson_node="Q1M3")

    # Rahab — Final Jeopardy
    q("Rahab", "trivia_testament", "adult", "expert", 0,
      "Rahab ties her scarlet cord in the window as a sign of covenant. What TWO major biblical themes does the scarlet cord symbolize?",
      "Redemption and Blood-covering/Deliverance (Same themes seen in Passover and Christ's sacrifice)",
      None, "Joshua 2; Exodus 12; Hebrews 9", ["Typology", "Covenant", "Christ foreshadow"], "Women of Wisdom: Redemption Stories", lesson_node="Q1M3")

    # ========================================================================
    # RAHAB — Millionaire Trail (Tricky Trivia)
    # ========================================================================
    rahab_mill = [
        (100, "Where did Rahab live?", "Jericho", ["Bethlehem", "Jericho", "Sinai", "Shiloh"]),
        (200, "Rahab hid the spies under...", "Flax", ["Wool", "Sand", "Flax", "Stone"]),
        (300, "What color was the cord?", "Scarlet", ["Blue", "Gold", "Scarlet", "Purple"]),
        (500, "Rahab acted out of...", "Faith", ["Fear alone", "Love", "Faith", "Confusion"]),
        (1000, "Rahab's agreement required the spies to...", "Swear an oath", ["Leave immediately", "Come back at night", "Swear an oath", "Pay her in silver"]),
        (2000, "Rahab's son Boaz later married...", "Ruth", ["Esther", "Ruth", "Naomi", "Hannah"]),
        (4000, "Rahab appears in the NT books of Matthew, Hebrews, and...", "James", ["Luke", "Mark", "James", "John"]),
        (8000, "Her confession revealed she believed in...", "YHWH", ["Baal", "Molech", "YHWH", "Dagon"]),
        (16000, "The scarlet cord parallels which symbol in Exodus?", "Passover blood", ["Serpent", "Passover blood", "Manna", "Staff of Moses"]),
        (32000, "Rahab became an ancestor of...", "David", ["Solomon", "Samuel", "David", "Isaiah"]),
        (64000, "Rahab's transformation is emphasized most in...", "James", ["Proverbs", "James", "Esther", "Romans"]),
        (125000, "What did Rahab risk by hiding the spies?", "Her life", ["Her family's wealth", "Her life", "Her property", "Her citizenship"]),
        (250000, "The Hebrew word hesed (kindness/covenant loyalty) describes...", "God's treatment of Rahab", ["Rahab's fear", "Rahab's hospitality", "Rahab's negotiation", "God's treatment of Rahab"]),
        (500000, "Tikvah (hope/cord) symbolizes Rahab's...", "Future in Israel", ["Escape plan", "Future in Israel", "Judgment", "Fear of kings"]),
        (1000000, "Rahab's redemption foreshadows what NT truth?", "God chooses the unlikely for His purposes", ["Gentiles will be destroyed", "Only Israel can receive grace", "God chooses the unlikely for His purposes", "Good works replace faith"]),
    ]
    for tier, quest, ans, opts in rahab_mill:
        q("Rahab", "tricky_trivia", "adult", "easy" if tier < 1000 else ("medium" if tier < 16000 else "hard"),
          tier, quest, ans, opts, lesson_node="Q1M3")

    # Rahab — Youth Edition
    rahab_youth = [
        ("What city did Rahab live in?", "Jericho"),
        ("What color cord did she tie in her window?", "Scarlet"),
        ("Rahab hid the spies because she had...", "Faith"),
        ("Who was Rahab's famous son?", "Boaz"),
        ("Rahab's whole _______ was saved.", "Family"),
        ("Rahab appears in the New Testament in...", "Matthew, Hebrews, James"),
        ("The scarlet cord represents...", "Hope and protection"),
        ("Rahab helped God's people by...", "Hiding the spies"),
        ("Rahab became part of...", "Jesus' family line"),
    ]
    for quest, ans in rahab_youth:
        q("Rahab", "trivia_testament", "youth", "easy", 200, quest, ans, lesson_node="Q1M3")

    # ========================================================================
    # RUTH — Jeopardy (Single)
    # ========================================================================
    q("Ruth", "trivia_testament", "adult", "easy", 100,
      "What was the name of Ruth's mother-in-law?",
      "Naomi", ["Hannah", "Abigail", "Naomi", "Miriam"],
      "Ruth 1:2", ["Relationship", "Loyalty"], "Daughters of Destiny: Ruth", lesson_node="Q2M4")
    
    q("Ruth", "trivia_testament", "adult", "easy", 200,
      'Ruth\'s famous declaration was, "Your people will be my people, and your ________ my ________."',
      "God...God", ["King...kingdom", "Home...home", "God...God", "Land...land"],
      "Ruth 1:16", ["Covenant", "Conversion"], "Daughters of Destiny: Ruth", lesson_node="Q2M4")
    
    q("Ruth", "trivia_testament", "adult", "medium", 300,
      'Whose field did Ruth "just happen" to glean in?',
      "Boaz", ["Boaz", "Jesse", "David", "Salmon"],
      "Ruth 2:3", ["Providence", "Divine timing"], "Daughters of Destiny: Ruth", lesson_node="Q2M4")
    
    q("Ruth", "trivia_testament", "adult", "medium", 400,
      "Why did Boaz show Ruth extraordinary kindness?",
      "He admired her loyalty to Naomi",
      ["He was wealthy", "He admired her loyalty to Naomi", "He owed Naomi money", "Ruth demanded it"],
      "Ruth 2:11-12", ["Character", "Integrity"], "Daughters of Destiny: Ruth", lesson_node="Q2M4")
    
    q("Ruth", "trivia_testament", "adult", "hard", 500,
      "What role did Boaz fulfill for Ruth?",
      "Kinsman-Redeemer", ["Prophet", "Servant", "Kinsman-Redeemer", "Judge"],
      "Ruth 3:12; 4:1-6", ["Redemption", "Covenant law"], "Daughters of Destiny: Ruth", lesson_node="Q2M4")

    # Ruth — Double Jeopardy
    q("Ruth", "trivia_testament", "adult", "medium", 200,
      "What country was Ruth originally from?",
      "Moab", ["Egypt", "Moab", "Philistia", "Assyria"],
      "Ruth 1:4", ["Outsider to Insider"], "Legacy Builders: Ruth & Naomi", lesson_node="Q2M4")
    
    q("Ruth", "trivia_testament", "adult", "medium", 400,
      "Ruth and Naomi returned to Bethlehem during what season?",
      "Wheat harvest", ["Planting", "Wheat harvest", "Olive harvest", "Grapevine pruning"],
      "Ruth 1:22", ["Timing", "Provision"], "Legacy Builders: Ruth & Naomi", lesson_node="Q2M4")
    
    q("Ruth", "trivia_testament", "adult", "hard", 600,
      'On the threshing floor, Ruth asked Boaz to "spread the corner of your garment over me." Name the two meanings of this phrase in Hebrew culture:',
      "Covenant covering/protection; Request for redemption/marriage",
      None, "Ruth 3:9", ["Covenant", "Symbolism", "Marriage"], "Legacy Builders: Ruth & Naomi", lesson_node="Q2M4")
    
    q("Ruth", "trivia_testament", "adult", "hard", 800,
      "Naomi instructed Ruth to do three things before approaching Boaz. Which of the following was NOT one of them?",
      "Bring a dowry", ["Wash", "Anoint", "Put on her best clothes", "Bring a dowry"],
      "Ruth 3:3", ["Preparation", "Wisdom"], "Legacy Builders: Ruth & Naomi", lesson_node="Q2M4")
    
    q("Ruth", "trivia_testament", "adult", "expert", 1000,
      "Ruth became the great-grandmother of which future king AND what is that king's connection to Jesus?",
      "King David; Jesus is born through David's royal line",
      None, "Ruth 4:17-22; Matthew 1", ["Lineage", "Messianic connection"], "Legacy Builders: Ruth & Naomi", lesson_node="Q2M4")

    # Ruth — Final Jeopardy
    q("Ruth", "trivia_testament", "adult", "expert", 0,
      "Ruth made one decision that changed the course of biblical history. What was the decision, and why was it spiritually significant?",
      "Ruth chose to stay with Naomi and follow the God of Israel - this aligned her with the covenant people and placed her in the Messianic lineage leading to Jesus.",
      None, "Ruth 1:16-17; Ruth 4; Matthew 1", ["Covenant choice", "Destiny"], "Women of Wisdom: Redemption Stories", lesson_node="Q2M4")

    # Ruth — Millionaire Trail
    ruth_mill = [
        (100, "Ruth was from which country?", "Moab", ["Moab", "Israel", "Egypt", "Tyre"]),
        (200, "Who was Ruth's mother-in-law?", "Naomi", ["Naomi", "Esther", "Deborah", "Hannah"]),
        (300, "Ruth gleaned in the field of...", "Boaz", ["Saul", "Samuel", "Boaz", "David"]),
        (500, "Boaz praised Ruth's...", "Loyalty", ["Singing", "Loyalty", "Wealth", "Clothing"]),
        (1000, "What term describes Boaz's legal role?", "Kinsman-Redeemer", ["Prophet", "Judge", "Kinsman-Redeemer", "Priest"]),
        (2000, "Ruth approached Boaz on...", "The threshing floor", ["Mount Carmel", "The temple steps", "The threshing floor", "The city gate"]),
        (4000, "Ruth was a...", "Moabitess", ["Levite", "Canaanite", "Moabitess", "Philistine"]),
        (8000, "Ruth and Naomi returned during which harvest?", "Wheat", ["Olive", "Grapes", "Wheat", "Barley only"]),
        (16000, "Boaz redeemed Ruth before...", "Elders at the gate", ["Elders at the gate", "Priests at Shiloh", "Kings of Israel", "Naomi's family only"]),
        (32000, "Ruth's son was...", "Obed", ["Obed", "Eliab", "Jesse", "Nathan"]),
        (64000, "Obed was the father of...", "Jesse", ["Solomon", "Jesse", "Samuel", "Abigail"]),
        (125000, "Ruth's story highlights what key biblical theme?", "Covenant loyalty", ["War", "Covenant loyalty", "Prophecy", "Ritual purity"]),
        (250000, "Ruth's decision to stay with Naomi is an example of...", "Faith and covenant love", ["Fear", "Hesitation", "Faith and covenant love", "Pride"]),
        (500000, 'The phrase "spread your garment over me" means...', "Take responsibility for me as redeemer", ["Become my servant", "Give me money", "Take responsibility for me as redeemer", "Defend me in battle"]),
        (1000000, "Ruth's presence in Jesus' genealogy teaches:", "God weaves outsiders into His redemption plan", ["Only Israelites were chosen", "God excludes foreigners", "God weaves outsiders into His redemption plan", "Lineage doesn't matter"]),
    ]
    for tier, quest, ans, opts in ruth_mill:
        q("Ruth", "tricky_trivia", "adult", "easy" if tier < 1000 else ("medium" if tier < 16000 else "hard"),
          tier, quest, ans, opts, lesson_node="Q2M4")

    # Ruth — Youth Edition
    ruth_youth = [
        ("Who did Ruth stay with after her husband died?", "Naomi"),
        ('What did Ruth say? "Your people will be my ______."', "People"),
        ("Where did Ruth work?", "Boaz's field"),
        ("Ruth showed great...", "Loyalty"),
        ("Ruth married...", "Boaz"),
        ("Their son was...", "Obed"),
        ("Obed became the father of...", "Jesse"),
        ("Jesse became the father of...", "David"),
        ("Ruth's choice showed she trusted...", "God"),
        ("Ruth was from...", "Moab"),
    ]
    for quest, ans in ruth_youth:
        q("Ruth", "trivia_testament", "youth", "easy", 200, quest, ans, lesson_node="Q2M4")

    # ========================================================================
    # NAOMI — Jeopardy
    # ========================================================================
    q("Naomi", "trivia_testament", "adult", "easy", 100, "Naomi returned to Bethlehem from what country?", "Moab", ["Egypt", "Moab", "Edom", "Tyre"], "Ruth 1:6-7", ["Return", "Obedience"], "Women of Wisdom: Naomi")
    q("Naomi", "trivia_testament", "adult", "easy", 200, "What name did Naomi ask the people of Bethlehem to call her?", "Mara", ["Mira", "Mara", "Marah", "Myra"], "Ruth 1:20", ["Identity", "Honest grief"], "Women of Wisdom: Naomi")
    q("Naomi", "trivia_testament", "adult", "medium", 300, "Who returned to Bethlehem with Naomi?", "Ruth", ["Orpah", "Ruth", "Hannah", "Deborah"], "Ruth 1:16-18", ["Loyalty", "Covenant love"], "Women of Wisdom: Naomi")
    q("Naomi", "trivia_testament", "adult", "medium", 400, "Who instructed Ruth on how to approach Boaz at the threshing floor?", "Naomi", ["The priest", "A servant", "Naomi", "Boaz's mother"], "Ruth 3:1-4", ["Wisdom", "Mentorship"], "Women of Wisdom: Naomi")
    q("Naomi", "trivia_testament", "adult", "hard", 500, "Naomi cared for the child Obed. Obed became the father of:", "Jesse", ["Saul", "Jesse", "Jonathan", "Nathan"], "Ruth 4:17", ["Restoration", "Royal lineage"], "Women of Wisdom: Naomi")
    
    # Naomi — Double Jeopardy
    q("Naomi", "trivia_testament", "adult", "medium", 200, "Naomi left Bethlehem originally because of...", "Famine", ["War", "Plague", "Famine", "Taxes"], "Ruth 1:1", ["Survival", "Providence"], "Daughters of Destiny: Naomi's Redemption")
    q("Naomi", "trivia_testament", "adult", "medium", 400, "Naomi lost her husband and two sons in Moab. True or False?", "True", ["True", "False"], "Ruth 1:3-5", ["Loss", "Sorrow"], "Daughters of Destiny: Naomi's Redemption")
    q("Naomi", "trivia_testament", "adult", "hard", 600, "Naomi told Ruth two things before she approached Boaz. Name BOTH.", "Wash and prepare yourself; Wait until Boaz had finished eating and drinking", None, "Ruth 3:3-4", ["Strategy", "Timing"], "Daughters of Destiny: Naomi's Redemption")
    q("Naomi", "trivia_testament", "adult", "hard", 800, "Why did the women of Bethlehem bless Naomi after Obed's birth?", "God gave her a redeemer through Obed", ["She became wealthy", "She adopted Ruth", "God gave her a redeemer through Obed", "She became a prophetess"], "Ruth 4:14-15", ["Restoration", "Blessing"], "Daughters of Destiny: Naomi's Redemption")
    q("Naomi", "trivia_testament", "adult", "expert", 1000, "Naomi never performed a miracle. She never preached a sermon. List ANY TWO ways her leadership shaped biblical history:", "Guided Ruth into covenant alignment; Positioned Ruth for redemption through Boaz; Became caretaker of Obed; Helped establish the lineage leading to King David and Jesus", None, "Ruth 2-4", ["Influence", "Legacy-building"], "Daughters of Destiny: Naomi's Redemption")

    # Naomi — Millionaire
    naomi_mill = [
        (100, "Naomi was from...", "Bethlehem", ["Jericho", "Bethlehem", "Jerusalem", "Hebron"]),
        (200, "Naomi traveled to Moab because of...", "A famine", ["A wedding", "A famine", "A war", "A festival"]),
        (300, "Ruth stayed with Naomi out of...", "Loyalty and covenant love", ["Fear", "Obligation", "Loyalty and covenant love", "Confusion"]),
        (500, "Naomi advised Ruth to meet Boaz at...", "The threshing floor", ["The well", "The threshing floor", "The palace courts", "The city gate"]),
        (1000, "Naomi held Obed as if he were her...", "Son", ["Servant", "Prophet", "Son", "Judge"]),
        (2000, "Naomi's grief changed when...", "A redeemer was born", ["Ruth became wealthy", "A redeemer was born", "Boaz sent her grain", "She returned to Moab"]),
        (4000, "Naomi's story teaches:", "God restores through unexpected people", ["God forgets the broken", "Bitterness never heals", "God restores through unexpected people", "Loss is permanent"]),
        (8000, "Naomi's lineage contribution leads to...", "David", ["Samson", "David", "Saul", "Solomon only"]),
        (16000, "Naomi's strategy honored which law?", "Kinsman-redeemer law", ["Nazarite vow", "Jubilee", "Kinsman-redeemer law", "Passover law"]),
    ]
    for tier, quest, ans, opts in naomi_mill:
        q("Naomi", "tricky_trivia", "adult", "easy" if tier < 1000 else "medium", tier, quest, ans, opts)

    # Naomi Youth
    naomi_youth = [
        ("Naomi lived in ________.", "Bethlehem"),
        ("She moved to ______ because of a famine.", "Moab"),
        ("Naomi lost her ______ in Moab.", "Husband and sons"),
        ("Ruth stayed with Naomi out of ______.", "Love and loyalty"),
        ("Naomi helped Ruth marry ______.", "Boaz"),
        ("Naomi cared for baby ______.", "Obed"),
        ("Obed became grandfather of ______.", "David"),
        ("Naomi's sadness turned to ______.", "Joy"),
        ("Naomi taught us that God can ______.", "Restore what we lost"),
        ('Naomi\'s new name "Mara" meant...', "Bitter"),
    ]
    for quest, ans in naomi_youth:
        q("Naomi", "trivia_testament", "youth", "easy", 200, quest, ans)

    # ========================================================================
    # ABIGAIL — Jeopardy
    # ========================================================================
    q("Abigail", "trivia_testament", "adult", "easy", 100, 'What was the name of Abigail\'s husband, described as "harsh and evil in his doings"?', "Nabal", ["Shimei", "Nabal", "Abner", "Nahash"], "1 Samuel 25:3", ["Contrast", "Character study"], "Women of Wisdom: Abigail", lesson_node="Q1M3")
    q("Abigail", "trivia_testament", "adult", "easy", 200, "What did Abigail bring to David to prevent him from avenging himself?", "Meat, bread, raisins, and wine", ["Gold and silver", "Meat, bread, raisins, and wine", "Horses and armor", "Scrolls and incense"], "1 Samuel 25:18", ["Peacemaking", "Provision"], "Women of Wisdom: Abigail", lesson_node="Q1M3")
    q("Abigail", "trivia_testament", "adult", "medium", 300, "What happened to Nabal after Abigail told him what she had done?", "His heart failed, and he died", ["He repented", "He blessed David", "His heart failed, and he died", "He banished Abigail"], "1 Samuel 25:37-38", ["Judgment", "Consequence"], "Women of Wisdom: Abigail", lesson_node="Q1M3")
    q("Abigail", "trivia_testament", "adult", "medium", 400, "What posture did Abigail take when she met David?", "She bowed with her face to the ground", ["She stood tall", "She bowed with her face to the ground", "She hid behind servants", "She sent her maid instead"], "1 Samuel 25:23", ["Humility", "Honor"], "Women of Wisdom: Abigail", lesson_node="Q1M3")
    q("Abigail", "trivia_testament", "adult", "hard", 500, "Abigail told David that God would establish him as ______.", "Ruler over Israel", ["Chief priest", "A judge", "Ruler over Israel", "Captain of the guard"], "1 Samuel 25:30", ["Prophetic accuracy", "Destiny"], "Women of Wisdom: Abigail", lesson_node="Q1M3")

    # Abigail — Millionaire
    abigail_mill = [
        (100, "Abigail was married to...", "Nabal", ["David", "Saul", "Nabal", "Abner"]),
        (200, "Nabal's name means...", "Fool", ["Wise", "Fool", "Warrior", "Shepherd"]),
        (300, "David asked Nabal for...", "Food", ["Money", "Food", "Land", "Weapons"]),
        (500, "Abigail acted quickly because Nabal...", "Rejected David", ["Slept", "Was wicked", "Rejected David", "Was celebrating drunkenly"]),
        (1000, "Abigail met David with...", "Food and humility", ["Soldiers", "Food and humility", "A rebuke", "A sword"]),
        (2000, "David blessed Abigail for keeping him from...", "Bloodshed", ["Fighting Saul", "Bloodshed", "Taking more wives", "Leaving Israel"]),
        (4000, "Which quality best describes Abigail?", "Wisdom", ["Deceit", "Anger", "Wisdom", "Envy"]),
        (8000, "Abigail prophesied David would become...", "King of Israel", ["A priest", "King of Israel", "A prophet", "A judge"]),
        (16000, "Nabal died after...", "A stroke caused by shock", ["Falling from a wall", "A stroke caused by shock", "Being attacked", "Being poisoned"]),
        (32000, "David married Abigail after...", "Nabal's death", ["A battle", "Nabal's death", "A festival", "Saul's pursuit"]),
    ]
    for tier, quest, ans, opts in abigail_mill:
        q("Abigail", "tricky_trivia", "adult", "easy" if tier < 1000 else "medium", tier, quest, ans, opts, lesson_node="Q1M3")

    # Abigail Youth
    abigail_youth = [
        ("Abigail's husband was...", "Nabal"), ("Abigail stopped David from...", "Fighting and hurting people"),
        ("Abigail brought David...", "Food and peace"), ("Abigail was known for...", "Wisdom"),
        ("Nabal was...", "Rude and foolish"), ("Abigail bowed to David as a sign of...", "Respect"),
        ("After Nabal died, Abigail...", "Married David"), ("Abigail teaches us to use...", "Wisdom, not anger"),
        ("God blessed Abigail for being...", "A peacemaker"),
    ]
    for quest, ans in abigail_youth:
        q("Abigail", "trivia_testament", "youth", "easy", 200, quest, ans, lesson_node="Q1M3")

    # ========================================================================
    # HANNAH — Jeopardy
    # ========================================================================
    q("Hannah", "trivia_testament", "adult", "easy", 100, "Who provoked Hannah because the Lord had closed her womb?", "Peninnah", ["Peninnah", "Miriam", "Naomi", "Leah"], "1 Samuel 1:6", ["Pressure", "Emotional conflict"], "Women of Faith: Hannah")
    q("Hannah", "trivia_testament", "adult", "easy", 200, "Where did Hannah go yearly with her husband to worship and sacrifice?", "Shiloh", ["Jerusalem", "Bethlehem", "Shiloh", "Hebron"], "1 Samuel 1:3", ["Worship", "Consistency"], "Women of Faith: Hannah")
    q("Hannah", "trivia_testament", "adult", "medium", 300, "Why did Eli the priest think Hannah was drunk?", "Her lips were moving, but no words came out", ["She was yelling", "Her lips were moving, but no words came out", "She was dancing", "She fainted"], "1 Samuel 1:12-14", ["Deep prayer", "Misinterpretation"], "Women of Faith: Hannah")
    q("Hannah", "trivia_testament", "adult", "medium", 400, "What vow did Hannah make to the Lord?", "To give her son to the Lord for all his life", ["To build a temple", "To give her son to the Lord for all his life", "To fast for a year", "To never cut her hair"], "1 Samuel 1:11", ["Sacrifice", "Dedication"], "Women of Faith: Hannah")
    q("Hannah", "trivia_testament", "adult", "hard", 500, "Hannah's son Samuel grew up to be...", "A prophet and judge", ["A king", "A priest only", "A prophet and judge", "A warrior"], "1 Samuel 3:20; 7:15", ["Destiny", "Calling"], "Women of Faith: Hannah")

    # Hannah Millionaire
    hannah_mill = [
        (100, "Hannah prayed for a...", "Son", ["Daughter", "Son", "Temple", "Miracle"]),
        (200, "Hannah was provoked by...", "Peninnah", ["Eli", "Peninnah", "Elkanah", "Samuel"]),
        (300, "Hannah prayed so deeply Eli thought she was...", "Drunk", ["Sleeping", "Singing", "Drunk", "Fasting"]),
        (500, "Hannah made a vow to...", "Give her son to the Lord", ["Build a temple", "Give her son to the Lord", "Never marry again", "Leave Shiloh"]),
        (1000, 'Hannah named her son Samuel because...', '"Asked of God"', ['"Gift of Grace"', '"Asked of God"', '"Promised One"', '"Strength of the Lord"']),
        (2000, "Hannah's husband was...", "Elkanah", ["Eli", "Elkanah", "Samuel", "Nathan"]),
        (4000, "Where did Samuel serve as a child?", "The tabernacle", ["The palace", "The temple", "The tabernacle", "A school"]),
        (8000, "Hannah kept her vow by...", "Bringing Samuel to Eli after he was weaned", ["Running away", "Bringing Samuel to Eli after he was weaned", "Building an altar", "Sending gifts"]),
        (16000, "Hannah's prayer in 1 Samuel 2 is a prophetic foreshadow of...", "Mary's Magnificat", ["David's Psalms", "Mary's Magnificat", "Solomon's prayer", "Moses' blessing"]),
    ]
    for tier, quest, ans, opts in hannah_mill:
        q("Hannah", "tricky_trivia", "adult", "easy" if tier < 1000 else "medium", tier, quest, ans, opts)

    # Hannah Youth
    hannah_youth = [
        ("Hannah wanted a...", "Son"), ("She prayed in the house of...", "God"),
        ("The priest who saw her was...", "Eli"), ("Hannah kept her...", "Promise to God"),
        ("Her son's name was...", "Samuel"), ("Samuel grew up serving...", "God in the tabernacle"),
        ("God heard Hannah because she prayed with her...", "Whole heart"),
        ("Hannah's enemy was...", "Peninnah"), ("Hannah trusted God even when she felt...", "Sad"),
    ]
    for quest, ans in hannah_youth:
        q("Hannah", "trivia_testament", "youth", "easy", 200, quest, ans)

    # ========================================================================
    # ESTHER — Jeopardy
    # ========================================================================
    q("Esther", "trivia_testament", "adult", "easy", 200, "This woman rose from obscurity to royalty and used her influence to protect her people.", "Esther", None, None, ["Courage", "Providence"], "Queens of Courage", lesson_node="Q2")
    q("Esther", "trivia_testament", "adult", "medium", 400, "This family member advised Esther not to reveal her background right away.", "Mordecai", None, None, ["Identity", "Strategy"], "Queens of Courage", lesson_node="Q2")
    q("Esther", "trivia_testament", "adult", "medium", 600, "This official plotted against the Jews, unaware that the queen herself was one of them.", "Haman", None, None, ["Providence", "Irony"], "Queens of Courage", lesson_node="Q2")
    q("Esther", "trivia_testament", "adult", "hard", 800, "Before presenting her request to the king, Esther invited him to what?", "A banquet", None, None, ["Wisdom", "Timing"], "Queens of Courage", lesson_node="Q2")
    q("Esther", "trivia_testament", "adult", "hard", 1000, "Approaching the king without an invitation could have cost Esther what?", "Her life", None, None, ["Courage", "Risk"], "Queens of Courage", lesson_node="Q2")

    # Esther Double Jeopardy
    q("Esther", "trivia_testament", "adult", "medium", 400, "What did Esther request of her people before she approached the king?", "A fast", None, None, ["Preparation"], "Divine Timing & Strategy", lesson_node="Q2")
    q("Esther", "trivia_testament", "adult", "hard", 800, "What event exposed Haman's intentions and reversed the threat against the Jews?", "Esther's revelation of her identity at the banquet", None, None, ["Providence"], "Divine Timing & Strategy", lesson_node="Q2")
    q("Esther", "trivia_testament", "adult", "hard", 1200, "Why did Esther host not one, but two banquets?", "Strategic timing / waiting for the right moment", None, None, ["Strategy"], "Divine Timing & Strategy", lesson_node="Q2")
    q("Esther", "trivia_testament", "adult", "hard", 1600, "What object did Haman build for Mordecai that ultimately became his own downfall?", "A gallows", None, None, ["Irony", "Justice"], "Divine Timing & Strategy", lesson_node="Q2")
    q("Esther", "trivia_testament", "adult", "expert", 2000, "Though God is never directly mentioned in the book, which major theme reveals His presence?", "Providence / divine orchestration / unseen guidance", None, None, ["Theology"], "Divine Timing & Strategy", lesson_node="Q2")

    # Esther Millionaire
    esther_mill = [
        (300, "Who became queen and saved her people from destruction?", "Esther", None),
        (600, "Who raised Esther and advised her with discernment?", "Mordecai", None),
        (1000, "What dangerous act did Esther perform for the sake of her people?", "Approached the king uninvited", None),
        (2000, "Why did Esther ask her people to fast?", "To prepare spiritually for the challenge ahead", None),
        (5000, "What phrase summarizes Esther's divine assignment?", "For such a time as this", None),
    ]
    for tier, quest, ans, opts in esther_mill:
        q("Esther", "tricky_trivia", "adult", "easy" if tier < 1000 else "medium", tier, quest, ans, opts, lesson_node="Q2")

    # ========================================================================
    # HOSEA — Jeopardy
    # ========================================================================
    q("Hosea", "trivia_testament", "adult", "easy", 200, "This prophet's marriage served as a real-life example of God's faithful love toward unfaithful people.", "Hosea", None, None, ["Covenant", "Faithfulness"], "Love That Teaches", lesson_node="Q2M6")
    q("Hosea", "trivia_testament", "adult", "medium", 400, "God instructed this prophet to enter a difficult marriage to illustrate Israel's spiritual drifting.", "Hosea", None, None, ["Calling"], "Love That Teaches", lesson_node="Q2M6")
    q("Hosea", "trivia_testament", "adult", "medium", 600, 'This woman repeatedly left her home, symbolizing Israel chasing other "loves" (false gods).', "Gomer", None, None, ["Symbolism"], "Love That Teaches", lesson_node="Q2M6")
    q("Hosea", "trivia_testament", "adult", "hard", 800, "Hosea's children bore symbolic names. What did at least one of those names represent?", "Judgment, Separation, Future restoration", None, None, ["Prophecy"], "Love That Teaches", lesson_node="Q2M6")
    q("Hosea", "trivia_testament", "adult", "hard", 1000, "Hosea demonstrated covenant loyalty by doing this for his wife when she could not return on her own.", "He redeemed her / bought her back", None, None, ["Redemption"], "Love That Teaches", lesson_node="Q2M6")

    # Hosea Millionaire
    hosea_mill = [
        (300, "Whose marriage symbolized God's relationship with Israel?", "Hosea", None),
        (600, "What did Hosea do when his wife could not return home?", "He redeemed her / purchased her back", None),
        (1000, "Gomer leaving home represented what spiritual reality?", "Israel's unfaithfulness / chasing other gods", None),
        (2000, "Which theme appears throughout Hosea's prophecy?", "God's faithful love despite human wandering", None),
        (5000, "Hosea's children's symbolic names pointed to what truth?", "Consequences now, restoration later", None),
        (10000, "What response does God seek in Hosea 14?", "Repentance and sincere return", None),
    ]
    for tier, quest, ans, opts in hosea_mill:
        q("Hosea", "tricky_trivia", "adult", "easy" if tier < 1000 else "medium", tier, quest, ans, opts, lesson_node="Q2M6")

    # ========================================================================
    # ABRAHAM & SARAH — Jeopardy
    # ========================================================================
    q("Abraham", "trivia_testament", "adult", "easy", 200, "This man left his home country without knowing exactly where God was leading him.", "Abraham", None, None, ["Faith"], "Faith in Motion", lesson_node="Q1M2")
    q("Sarah", "trivia_testament", "adult", "medium", 400, "This woman laughed when she overheard God's promise because it didn't match her reality at the time.", "Sarah", None, None, ["Faith", "Doubt"], "Faith in Motion", lesson_node="Q1M2")
    q("Abraham & Sarah", "trivia_testament", "adult", "medium", 600, "This couple both received new names as a sign of covenant identity.", "Abraham & Sarah", None, None, ["Covenant", "Identity"], "Faith in Motion", lesson_node="Q1M2")
    q("Abraham & Sarah", "trivia_testament", "adult", "hard", 800, 'This couple learned the hard way that trying to "help God out" creates long-term complications.', "Abraham & Sarah", None, None, ["Patience", "Trust"], "Faith in Motion", lesson_node="Q1M2")
    q("Abraham", "trivia_testament", "adult", "hard", 1000, "God used this visual to illustrate the future size of Abraham's legacy.", "The stars", None, None, ["Promise", "Legacy"], "Faith in Motion", lesson_node="Q1M2")

    # Abraham Millionaire
    ab_mill = [
        (300, "Who journeyed to an unknown land at God's command?", "Abraham", None),
        (600, "Who laughed when she heard God's promise of a son?", "Sarah", None),
        (1000, 'What did the name "Isaac" reflect?', "Laughter / joy / God turning disbelief into joy", None),
        (2000, "What did Abraham repeatedly build during his travels that marked his relationship with God?", "Altars", None),
        (5000, 'Why are Abraham & Sarah considered "anchors of faith"?', "They trusted God's promise despite delay", None),
    ]
    for tier, quest, ans, opts in ab_mill:
        q("Abraham & Sarah", "tricky_trivia", "adult", "easy" if tier < 1000 else "medium", tier, quest, ans, opts, lesson_node="Q1M2")

    # ========================================================================
    # JACOB, RACHEL & LEAH — Jeopardy
    # ========================================================================
    q("Jacob", "trivia_testament", "adult", "easy", 200, "This man traveled far from home and fell in love almost immediately when he met a shepherdess at a well.", "Jacob", None, None, ["Love", "Journey"], "Complicated Blessings", lesson_node="Q3M8")
    q("Rachel", "trivia_testament", "adult", "medium", 400, "This woman was Jacob's first love and the one he worked many years to marry.", "Rachel", None, None, ["Love", "Patience"], "Complicated Blessings", lesson_node="Q3M8")
    q("Leah", "trivia_testament", "adult", "medium", 600, "This woman often felt overlooked but was blessed with several children early in marriage.", "Leah", None, None, ["Identity", "Blessing"], "Complicated Blessings", lesson_node="Q3M8")
    q("Jacob", "trivia_testament", "adult", "hard", 800, "Which event on Jacob's wedding night altered the entire family dynamic?", "He married the wrong sister first", None, None, ["Deception", "Consequence"], "Complicated Blessings", lesson_node="Q3M8")
    q("Leah", "trivia_testament", "adult", "hard", 1000, "Despite the tension in their household, God built the nation of Israel through this woman's sons.", "Leah", None, None, ["Legacy", "Providence"], "Complicated Blessings", lesson_node="Q3M8")

    # ========================================================================
    # SAUL & JONATHAN — Jeopardy
    # ========================================================================
    q("Saul", "trivia_testament", "adult", "easy", 200, "This man was Israel's first king, chosen for his stature but troubled by insecurity.", "Saul", None, None, ["Leadership", "Insecurity"], "Leadership Under Pressure")
    q("Jonathan", "trivia_testament", "adult", "medium", 400, "This prince remained faithful to his father while also protecting the friend God had chosen to lead next.", "Jonathan", None, None, ["Loyalty", "Integrity"], "Leadership Under Pressure")
    q("Saul", "trivia_testament", "adult", "medium", 600, "Which king repeatedly tried to harm someone who had only ever served him well?", "Saul", None, None, ["Jealousy", "Conflict"], "Leadership Under Pressure")
    q("David & Jonathan", "trivia_testament", "adult", "hard", 800, "This relationship became one of the strongest examples of loyalty in the Bible.", "David & Jonathan", None, None, ["Friendship", "Covenant"], "Leadership Under Pressure")
    q("Jonathan", "trivia_testament", "adult", "hard", 1000, "Which man recognized God's anointing on David even before David became king?", "Jonathan", None, None, ["Discernment", "Faith"], "Leadership Under Pressure")

    # Saul & Jonathan Millionaire
    sj_mill = [
        (300, "Who was Israel's first king?", "Saul", None),
        (600, "Who formed a covenant friendship with David?", "Jonathan", None),
        (1000, "What weapon symbolizes Saul's declining control?", "A spear", None),
        (2000, "Why did Saul become jealous of David?", "Fear of losing power / Comparison / Insecurity", None),
        (5000, "Why is Jonathan's loyalty so significant?", "He supported God's plan even when it meant he wouldn't be king", None),
    ]
    for tier, quest, ans, opts in sj_mill:
        q("Saul & Jonathan", "tricky_trivia", "adult", "easy" if tier < 1000 else "medium", tier, quest, ans, opts)

    # ========================================================================
    # SAMARITAN WOMAN — Jeopardy
    # ========================================================================
    q("Samaritan Woman", "trivia_testament", "adult", "easy", 100, "This woman met someone at a time of day when most avoided the heat - but she found more than water waiting for her.", "The Samaritan Woman", None, None, ["Identity", "Encounter"], "A Conversation That Changed a City")
    q("Samaritan Woman", "trivia_testament", "adult", "easy", 200, "A Jewish man asked her for something simple, crossing cultural, ethnic, and gender boundaries in a single sentence. Who was she?", "The Samaritan Woman", None, None, ["Boundaries", "Grace"], "A Conversation That Changed a City")
    q("Samaritan Woman", "trivia_testament", "adult", "medium", 300, "This woman raised a theological debate that revealed something deeper: thirst for truth, not just water.", "The Samaritan Woman", None, None, ["Theology", "Truth"], "A Conversation That Changed a City")
    q("Samaritan Woman", "trivia_testament", "adult", "medium", 400, "This woman heard details about her private life from someone she'd never met - not to shame her but to open her understanding.", "The Samaritan Woman", None, None, ["Revelation", "Compassion"], "A Conversation That Changed a City")
    q("Samaritan Woman", "trivia_testament", "adult", "hard", 500, "Her testimony was so compelling that many in her region believed before they ever heard the man she spoke of.", "The Samaritan Woman", None, None, ["Testimony", "Evangelism"], "A Conversation That Changed a City")

    # ========================================================================
    # SHUNAMMITE WOMAN
    # ========================================================================
    q("Shunammite Woman", "trivia_testament", "adult", "easy", 200, "Who showed kindness to a traveling prophet by offering hospitality?", "Shunammite Woman", None, None, ["Hospitality", "Faith"])
    q("Shunammite Woman", "trivia_testament", "adult", "medium", 400, "The Shunammite Woman made a small upstairs room for which prophet?", "Elisha", None, None, ["Generosity", "Service"])
    q("Shunammite Woman", "trivia_testament", "adult", "hard", 600, "After building a room for Elisha, what blessing did the Shunammite Woman receive?", "A son", None, None, ["Blessing", "Providence"])

    # ========================================================================
    # YOUTH PACK — 150 QUESTIONS (Batches 1-3)
    # ========================================================================
    # Batch 1: 1-50
    youth_b1 = [
        # 1-10 Identity & Recognition
        ("Rahab", "Who hid Israelite spies under flax on her rooftop to protect them?", "Rahab"),
        ("Ruth", "Who followed her mother-in-law into a new land even though it meant starting over?", "Ruth"),
        ("Samaritan Woman", "Which woman had a life-changing conversation with Jesus at a well?", "Samaritan Woman"),
        ("Shunammite Woman", "Who showed kindness to a traveling prophet by offering hospitality?", "Shunammite Woman"),
        ("Abraham", "Which man trusted God enough to leave home without knowing the destination?", "Abraham"),
        ("Sarah", "Which woman laughed when she heard God's promise?", "Sarah"),
        ("Jacob", "Who worked years for the woman he loved?", "Jacob"),
        ("Jonathan", "Who stood between his father and his best friend during a dangerous time?", "Jonathan"),
        ("Abigail", "Who tried to calm an angry future king with wisdom and a peace offering?", "Abigail"),
        ("Esther", "Who used her royal position to protect her people?", "Esther"),
        # 11-20 Fill-in-the-Blank
        ("Rahab", "Rahab lived in the city of ________.", "Jericho"),
        ("Ruth", 'Ruth told Naomi, "Your people will be my ________."', "People"),
        ("Samaritan Woman", 'Jesus offered the Samaritan Woman "living ________."', "Water"),
        ("Shunammite Woman", "The Shunammite Woman made a small upstairs ________ for Elisha.", "Room"),
        ("Abraham", "Abraham's promised son was named ________.", "Isaac"),
        ("Sarah", "Sarah's first reaction to God's promise was to ________.", "Laugh"),
        ("Jacob", "Jacob dreamed of a ladder reaching to ________.", "Heaven"),
        ("Saul", "Saul tried to hurt David with a ________.", "Spear"),
        ("Abigail", "Abigail stopped David from acting out of ________.", "Anger"),
        ("Esther", "Esther asked her people to ________ before she went to the king.", "Fast"),
        # 21-30 Multiple Choice
        ("Rahab", "Which woman hid spies? A) Deborah B) Rahab C) Ruth", "Rahab"),
        ("Ruth", "Who married Boaz? A) Ruth B) Naomi C) Esther", "Ruth"),
        ("Samaritan Woman", "Who asked Jesus hard questions at a well? A) Samaritan Woman B) Martha C) Mary", "Samaritan Woman"),
        ("Abraham & Sarah", "Which couple waited many years for a promised child? A) Jacob & Rachel B) Abraham & Sarah C) Elkanah & Hannah", "Abraham & Sarah"),
        ("Leah", "Who was switched into the wedding ceremony unexpectedly? A) Rachel B) Hannah C) Leah", "Leah"),
        ("Jonathan", "Who warned David about Saul? A) Jonathan B) Samuel C) Joab", "Jonathan"),
        ("Abigail", "Who calmed David with wise words? A) Bathsheba B) Abigail C) Michal", "Abigail"),
        ("Esther", "Which woman became queen? A) Ruth B) Abigail C) Esther", "Esther"),
        ("David", "Who ran from danger but stayed faithful to God's calling? A) Jonah B) David C) Gideon", "David"),
        ("Shunammite Woman", "Which woman experienced a miracle for her son after showing hospitality? A) Shunammite Woman B) Widow of Zarephath C) Mary Magdalene", "Shunammite Woman"),
        # 31-40 Who Said/Did It
        ("Ruth", 'Who declared, "Where you go, I will go"?', "Ruth"),
        ("Samaritan Woman", 'Who asked Jesus for the "living water"?', "Samaritan Woman"),
        ("Abigail", "Who bowed before David to stop him from reacting in anger?", "Abigail"),
        ("Mordecai", "Who refused to bow to Haman?", "Mordecai"),
        ("Jonathan", "Who promised to protect David even when his father didn't?", "Jonathan"),
        ("Rahab", "Who believed the spies' God was the true God?", "Rahab"),
        ("Hannah", "Who prayed for a child and dedicated him to God?", "Hannah"),
        ("Shunammite Woman", "Who welcomed a prophet repeatedly without expecting reward?", "Shunammite Woman"),
        ("Leah", "Who waited years for Jacob's love to be fully returned?", "Leah"),
        ("Abraham", "Who trusted God's voice enough to travel to a new land?", "Abraham"),
        # 41-50 Scene Interpretation
        ("Samaritan Woman", "A woman meets a stranger at a well who knows her whole story - who is she?", "Samaritan Woman"),
        ("Shunammite Woman", "A prophet stays in a woman's home so often they build him a room - who is she?", "Shunammite Woman"),
        ("Saul", "A king throws a spear at the person who plays music for him - who is he?", "Saul"),
        ("Jonathan", "A young man and a prince form a covenant friendship - name the prince.", "Jonathan"),
        ("Rachel & Leah", "Two sisters are married to the same man - name either sister.", "Rachel or Leah"),
        ("Esther", "A woman risks her life to speak up for her people - who is she?", "Esther"),
        ("Ruth", "A woman gathers leftovers from a field to help her family - who is she?", "Ruth"),
        ("Hosea", "Someone redeems his wife after she goes missing - who is he?", "Hosea"),
        ("Abraham", "God tells a man to count the stars as a picture of his future - who is he?", "Abraham"),
        ("Abigail", "A wise woman brings gifts to stop a future king from acting rashly - who is she?", "Abigail"),
    ]
    
    tier_counter = 200
    for char, quest, ans in youth_b1:
        q(char, "trivia_testament", "youth", "easy", tier_counter, quest, ans)
        tier_counter = 200 if tier_counter >= 1000 else tier_counter + 200

    # Batch 2: 51-100
    youth_b2 = [
        ("Rahab", "Which woman trusted God enough to help strangers from another nation?", "Rahab"),
        ("Ruth", "Which woman moved to a new land even though she didn't know anyone?", "Ruth"),
        ("Samaritan Woman", "Who had a respectful but honest conversation with Jesus that changed her identity?", "Samaritan Woman"),
        ("Shunammite Woman", "Which woman received a miracle for her son after showing hospitality?", "Shunammite Woman"),
        ("Abraham & Sarah", "Who learned that God's timing is ALWAYS better than rushing a plan?", "Abraham & Sarah"),
        ("Abigail", "Who had a husband that made reckless choices she had to help fix?", "Abigail"),
        ("Jonathan", "Which prince learned to stand for what was right even when his father disagreed?", "Jonathan"),
        ("Jacob", "Who had a vision that showed angels on a ladder?", "Jacob"),
        ("Esther", "Which woman found favor with a king because of her courage and humility?", "Esther"),
        ("Jonathan", "Who protected David when jealousy tried to destroy him?", "Jonathan"),
        # Fill in blank
        ("Rahab", "Rahab used a ______ rope to help the spies escape.", "Red"),
        ("Ruth", "Ruth gleaned grain in the fields of a man named ______.", "Boaz"),
        ("Samaritan Woman", "Jesus told the Samaritan Woman that true worshippers worship in ______ and truth.", "Spirit"),
        ("Shunammite Woman", "The Shunammite Woman showed ______ to Elisha.", "Hospitality"),
        ("Abraham & Sarah", "God promised Abraham a son even when he and Sarah were very ______.", "Old"),
        ("Jacob", "Jacob worked for Rachel for ______ years.", "Seven"),
        ("Abigail", "Abigail brought ______ to calm David.", "Food"),
        ("Esther", "Esther asked the people to ______ for three days.", "Fast"),
        ("Hosea", "Hosea's story teaches that God's love ______ even when people wander.", "Continues"),
        ("David", "David was known for his ______ and his _______.", "Courage / Worship"),
        # Who Am I riddles
        ("Rahab", '"I lived in a city with tall walls, but faith brought those walls down."', "Rahab"),
        ("Ruth", '"I left what I knew and followed someone who needed family."', "Ruth"),
        ("Samaritan Woman", '"I met Jesus at a well and left changed."', "Samaritan Woman"),
        ("Shunammite Woman", '"I built a room for a prophet because I wanted to support God\'s work."', "Shunammite Woman"),
        ("Sarah", '"I became a mother long after I stopped expecting it."', "Sarah"),
        ("Jacob", '"I wrestled until God gave me a new name."', "Jacob"),
        ("Jonathan", '"I warned my friend because danger was coming."', "Jonathan"),
        ("David", '"I almost caused trouble, but someone wise stopped me."', "David"),
        ("Abigail", '"My wise words kept a future king from making a big mistake."', "Abigail"),
        ("Esther", '"I stood before a king even though I could\'ve died for it."', "Esther"),
        # Matching
        ("Esther", 'Match the character to the word "Courage":', "Esther"),
        ("Ruth", 'Match the character to the word "Kindness":', "Ruth"),
        ("Hosea", 'Match the character to the word "Faithfulness":', "Hosea"),
        ("Shunammite Woman", 'Match the character to the word "Hospitality":', "Shunammite Woman"),
        ("Jacob", 'Match the character to "New Identity":', "Jacob (Israel)"),
        ("Abigail", 'Match the character to "Intercession / Peacemaker":', "Abigail"),
        ("Abraham", 'Match the character to "Obedience":', "Abraham"),
        ("Rahab", 'Match the character to "Trust restored":', "Rahab"),
        ("Jonathan", 'Match the character to "Friendship":', "Jonathan"),
        ("Samaritan Woman", 'Match the character to "Worship in spirit and truth":', "Samaritan Woman"),
        # Scene Based
        ("Rahab", "After hiding the spies, what did Rahab ask for?", "Protection for her family"),
        ("Ruth", "After arriving in Bethlehem, what did Ruth start doing?", "Gleaning grain in the fields"),
        ("Samaritan Woman", "After meeting Jesus, what did the Samaritan Woman do in her town?", "Told people about Him"),
        ("Shunammite Woman", "After building a room for Elisha, what blessing did the Shunammite Woman receive?", "A son"),
        ("Sarah", "After Isaac was promised, what did Sarah eventually become?", "A mother"),
        ("Jacob", "After wrestling with God, what name did Jacob receive?", "Israel"),
        ("Jonathan", "After Saul grew jealous, who protected David?", "Jonathan"),
        ("Abigail", "After Abigail stopped David, how did David respond?", "He thanked her for her wisdom"),
        ("Esther", "After hearing of the danger to her people, what did Esther prepare to do?", "Approach the king"),
        ("Abraham", "After God told Abraham to look at the stars, what did Abraham do?", "He believed God"),
    ]
    for char, quest, ans in youth_b2:
        q(char, "trivia_testament", "youth", "easy", 400, quest, ans)

    # Batch 3: 101-150
    youth_b3 = [
        ("Rahab", "What key lesson does Rahab teach us about trusting God even when you feel unqualified?", "Faith can start anywhere."),
        ("Ruth", "What does Ruth's devotion to Naomi show us about family and loyalty?", "Commitment matters."),
        ("Samaritan Woman", "What did the Samaritan Woman learn about worship from Jesus?", "God wants true, sincere worship."),
        ("Shunammite Woman", "What does the Shunammite Woman teach about generosity?", "Blessings often flow from kindness."),
        ("Abraham", "What does Abraham show about following God?", "Sometimes obedience comes before details."),
        ("Sarah", "What does Sarah's story teach about waiting on God?", "Delay doesn't cancel destiny."),
        ("Jacob", "What does Jacob's name change teach youth about identity?", "God can transform your story."),
        ("Jonathan", "What does Jonathan's friendship teach?", "Real friends stand for truth."),
        ("Abigail", "What does Abigail show about handling conflict?", "Wisdom can calm storms."),
        ("Esther", "What lesson does Esther teach about courage?", "Purpose sometimes requires risk."),
        # Scene ID
        ("Rahab", "What symbol shows Rahab's faith?", "Scarlet rope"),
        ("Ruth", "What attitude shows Ruth's heart for God?", "Loyalty"),
        ("Samaritan Woman", "What gift did Jesus offer the Samaritan Woman?", "Living water"),
        ("Shunammite Woman", "What did the Shunammite Woman provide that was special?", "A room for Elisha"),
        ("Abraham", "What did Abraham trust even without seeing the outcome?", "God's promise"),
        ("Sarah", "What emotion changed Sarah's laughter from disbelief to joy?", "Faith"),
        ("Jacob", "What did Jacob learn after wrestling with God?", "New identity"),
        ("Jonathan", "What made Jonathan a true friend?", "Loyalty + honesty"),
        ("Abigail", "What made Abigail stand out in a crisis?", "Wisdom"),
        ("Esther", "What made Esther's moment unforgettable?", "Courage at the right time"),
        # Multiple Choice
        ("Rahab", "Rahab saved the spies by: A) Hiding them B) Running away C) Pretending she didn't see them", "Hiding them"),
        ("Ruth", "Ruth met Boaz while: A) Traveling B) Gleaning in fields C) Praying in the temple", "Gleaning in fields"),
        ("Samaritan Woman", "The Samaritan Woman realized Jesus was the Messiah after He: A) Performed a miracle B) Knew her story C) Spoke to the crowds", "Knew her story"),
        ("Shunammite Woman", "The Shunammite Woman's blessing came after she: A) Gave money B) Offered her home C) Made a sacrifice", "Offered her home"),
        ("Abraham", 'Abraham traveled because God said: A) "Stay here" B) "Go to the land I will show you" C) "Wait for a sign"', "Go to the land I will show you"),
        ("Sarah", "Sarah doubted the promise because she was: A) Too young B) Too old C) Afraid", "Too old"),
        ("Jacob", "Jacob first met Rachel at a: A) Market B) Field C) Well", "Well"),
        ("Jonathan", "Jonathan protected David because: A) He wanted to be king B) He knew David was chosen C) He feared Saul", "He knew David was chosen"),
        ("Abigail", "Abigail calmed David by offering: A) Weapons B) Food and wisdom C) Gold", "Food and wisdom"),
        ("Esther", "Esther saved her people by: A) Leaving the palace B) Speaking to the king C) Starting a battle", "Speaking to the king"),
        # Who Did God Use
        ("Rahab", "Who did God use in Jericho to show that anyone can change?", "Rahab"),
        ("Ruth", "Who did God use to bless Naomi when everything seemed lost?", "Ruth"),
        ("Samaritan Woman", "Who did Jesus use to show that He knows our hearts?", "Samaritan Woman"),
        ("Shunammite Woman", "Who did God use to bless Elisha's ministry?", "Shunammite Woman"),
        ("Abraham", "Who did God use to begin a nation with a promise?", "Abraham"),
        ("Sarah", "Who did God use to show that laughter can turn into joy?", "Sarah"),
        ("Jacob", "Who did God use to create the tribes of Israel through unexpected paths?", "Jacob"),
        ("Jonathan", "Who did God use to model true friendship?", "Jonathan"),
        ("Abigail", "Who did God use to stop a king from hurting his future?", "Abigail"),
        ("Esther", "Who did God use to protect an entire nation through bold timing?", "Esther"),
        # Advanced Reflection
        ("Rahab", "What symbol shows Rahab's faith?", "Scarlet rope"),
        ("Ruth", "What attitude shows Ruth's heart for God?", "Loyalty"),
        ("Samaritan Woman", "What gift did Jesus offer the Samaritan Woman?", "Living water"),
        ("Shunammite Woman", "What did the Shunammite Woman provide that was special?", "A room for Elisha"),
        ("Abraham", "What did Abraham trust even without seeing the outcome?", "God's promise"),
        ("Sarah", "What emotion changed Sarah's laughter from disbelief to joy?", "Faith"),
        ("Jacob", "What did Jacob learn after wrestling with God?", "New identity"),
        ("Jonathan", "What made Jonathan a true friend?", "Loyalty"),
        ("Abigail", "What made Abigail stand out in a crisis?", "Wisdom"),
        ("Esther", "What made Esther's moment unforgettable?", "Courage at the right time"),
    ]
    for char, quest, ans in youth_b3:
        q(char, "trivia_testament", "youth", "medium", 600, quest, ans)

    # ========================================================================
    # WHO AM I — Adult Guessing Game (all characters)
    # ========================================================================
    who_am_i = [
        ("Abigail", '"I stepped into a conflict I didn\'t create to save people I loved."'),
        ("Nabal", '"My decisions almost cost my entire household everything."'),
        ("David", '"I listened to wise counsel that kept me from making a lasting mistake."'),
        ("Abigail", '"I used a gift to open the door for reconciliation."'),
        ("Abigail", '"I prevented a king from acting outside of his character."'),
        ("Esther", '"I hid my identity until the moment God said speak."'),
        ("Mordecai", '"I refused to bow to evil, even when it cost my comfort."'),
        ("Haman", '"I planned harm but fell into my own trap."'),
        ("Esther", '"I waited for the right moment instead of rushing purpose."'),
        ("King Xerxes", '"I elevated someone who later reversed an entire nation\'s fate."'),
        ("Hosea", '"My love story was a sermon, not a romance."'),
        ("Gomer", '"My wandering symbolized a whole nation\'s heart."'),
        ("Abraham", '"I moved before I had all the details."'),
        ("Sarah", '"I laughed before I believed - then laughed again after the promise came true."'),
        ("Jacob", '"I fell in love at a well, and worked years to earn my bride."'),
        ("Rachel", '"I longed for what came easily to my sister."'),
        ("Leah", '"I felt unseen, but God saw my heart."'),
        ("Saul", '"Insecurity caused me to pursue someone I should have protected."'),
        ("Jonathan", '"My destiny was second place, but my integrity was first class."'),
    ]
    for char, clue in who_am_i:
        q(char, "who_am_i", "adult", "medium", 0, clue, char)

    # ========================================================================
    # DEEP CUT QUESTIONS
    # ========================================================================
    deep_cuts = [
        ("Abigail", "What does Abigail teach about conflict resolution?", "Move quickly, wisely, and humbly - and protect long-term impact over short-term emotion."),
        ("Esther", "What does Esther teach about timing?", "Spiritual preparation must precede strategic action."),
        ("Esther", "Why is Esther's identity reveal significant?", "It tied her personal story to her people's destiny."),
        ("Hosea", "What did Hosea's redemption of Gomer foreshadow in the New Testament?", "Christ's redeeming work / buying us back"),
        ("Abraham & Sarah", "What does Abraham's journey teach about obedience before clarity?", "Trust leads the way; clarity follows obedience."),
        ("Jacob", "Why is Jacob's name change critical to the story?", "It reflects inner transformation from striving to surrender."),
        ("Saul & Jonathan", "What does the relationship between Saul and David teach about comparison?", "It creates unnecessary enemies and derails purpose."),
        ("Jonathan", "Why is Jonathan's loyalty so rare?", "He chose righteousness over personal advancement."),
    ]
    for char, quest, ans in deep_cuts:
        q(char, "deep_cut", "adult", "expert", 0, quest, ans)

    return questions


# ============================================================================
# WORD STUDIES
# ============================================================================
def build_word_studies():
    studies = []
    
    entries = [
        # Rahab
        ("Rahab", "tikvah", "hope, cord, expectation", "Rahab's scarlet cord"),
        ("Rahab", "hesed", "covenant kindness/loyalty", "God's treatment of Rahab"),
        ("Rahab", "zanah", "prostitute/outsider", "Identity before transformation"),
        ("Rahab", "YHWH", "name Rahab invokes in her confession", "Joshua 2:11"),
        ("Rahab", "emunah", "faith that acts", "Rahab's defining trait"),
        # Ruth
        ("Ruth", "ga'al", "Redeem, act as kinsman-redeemer", "Ruth 3-4"),
        ("Ruth", "hesed", "Loyal love, covenant kindness", "Ruth 1, 2"),
        ("Ruth", "goren", "Threshing floor (symbol of decision + covering)", "Ruth 3"),
        ("Ruth", "Mo'av", "Moabite identity transformed", "Ruth 1"),
        # Naomi
        ("Naomi", "Mara", "bitterness", "Naomi's self-description during grief"),
        ("Naomi", "shuv", "return/turn back", "Key theme: Naomi returned physically and spiritually"),
        # Abigail
        ("Abigail", "sakal", "prudence, insight, understanding", "Used to describe Abigail"),
        ("Abigail", "shalom", "peace, wholeness", "Abigail's goal in her intervention"),
        ("Abigail", "nabal", "foolish, senseless", "Name that shows contrast with Abigail's wisdom"),
        ("Abigail", "hokmah", "wisdom, skillful judgment", "Abigail embodied this"),
        # Hannah
        ("Hannah", "shama", "to hear", "Connected to Samuel's name - heard by God"),
        ("Hannah", "neder", "vow, promise", "Hannah vowed Samuel to the Lord"),
        ("Hannah", "Shiloh", "place of rest/worship", "Where Hannah prayed and God answered"),
        ("Hannah", "eved", "servant", "Samuel's posture - your servant is listening"),
        # Esther
        ("Esther", "pur", "lot (origin of Purim)", "The lots cast to determine the date"),
        ("Esther", "Hadassah", "myrtle (Esther's Hebrew name)", "Her hidden identity"),
        ("Esther", "tzom", "fast", "Esther's spiritual preparation"),
        ("Esther", "goral", "destiny, portion", "Linked to Pur"),
        # Hosea
        ("Hosea", "hesed", "covenant loyalty, steadfast love", "God's love despite Israel's unfaithfulness"),
        ("Hosea", "rachamim", "compassion, tender mercy", "God's response to repentance"),
        ("Hosea", "shuv", "return, turn back, repent", "Central call of Hosea's prophecy"),
        ("Hosea", "padah", "redeem, buy back", "Hosea buying Gomer back"),
        # Abraham & Sarah
        ("Abraham & Sarah", "emunah", "faithfulness, trust", "Abraham's defining quality"),
        ("Abraham & Sarah", "brit", "covenant", "God's agreement with Abraham"),
        ("Abraham & Sarah", "tzachaq", "laugh", "Root behind Isaac's name"),
        ("Abraham & Sarah", "zera", "seed / offspring", "God's promise of descendants"),
        # Jacob
        ("Jacob", "Yisrael", "God fights / God prevails", "Jacob's new name"),
        ("Jacob", "sane", "to feel unloved or less favored", "Leah's experience"),
        ("Jacob", "tikvah", "hope", "Rachel's longing"),
        # Saul & Jonathan
        ("Saul & Jonathan", "ruach", "spirit, breath", "God's presence leaving Saul"),
        ("Saul & Jonathan", "qinah", "jealousy", "Saul's downfall"),
        ("Saul & Jonathan", "chesed", "covenant loyalty", "Jonathan's actions"),
        ("Saul & Jonathan", "mashiach", "anointed one", "David recognized as God's selection"),
    ]
    
    for char, term, meaning, context in entries:
        studies.append({
            "character": char,
            "term": term,
            "meaning": meaning,
            "context": context,
            "seeded_at": datetime.now(timezone.utc)
        })
    
    return studies


# ============================================================================
# REFERENCE SOURCES
# ============================================================================
def build_reference_sources():
    sources = [
        {"name": "Encyclopaedia Britannica (Online Academic Edition)", "description": "General historical and geopolitical background for biblical eras", "status": "approved", "citation": 'Encyclopaedia Britannica Online Academic Edition (accessed YYYY).'},
        {"name": "Baker's Evangelical Dictionary of Biblical Theology", "description": "Key theological terms and cross-references; excellent for Word Study sections", "status": "approved", "citation": "Approved theological source via BibleStudyTools / Studylight."},
        {"name": "Holman Bible Dictionary", "description": "Broad background topics (cultural, geographical, linguistic) in easy-to-read format", "status": "approved", "citation": "Useful for Instructor context blurbs and Faith Nugget notes."},
        {"name": "Easton's Bible Dictionary (1897)", "description": "Public-domain classic source; good for open-distribution lessons", "status": "approved", "citation": "Public Domain - Thomas Nelson & Sons (1897)."},
        {"name": "Smith's Bible Dictionary (1863)", "description": "Public-domain, detailed entries on people/places", "status": "approved", "citation": "Public domain. Often paired with Easton's for cross-validation."},
        {"name": "The IVP Bible Background Commentary (OT & NT)", "description": "Scholarly cultural and historical context of biblical passages", "status": "approved", "citation": "Recommended secondary source. Cite standard reference line."},
        {"name": "Strong's Concordance / Brown-Driver-Briggs (BDB) / Thayer's Greek Lexicon", "description": "Original-language analysis for Word Study sections", "status": "approved", "citation": "Core linguistic reference. Public domain."},
        {"name": "Bible Atlas / Logos / OpenBible.info Maps", "description": "Visual geography for Instructor illustrations", "status": "approved", "citation": 'Map courtesy of OpenBible.info (CC BY license) or via Logos Bible Atlas.'},
        {"name": "Jewish Virtual Library (JVL)", "description": "Historical and cultural context for TLV-linked material", "status": "approved", "citation": "Supplementary source. Cite individual article author and JVL."},
        {"name": "Early Christian Writings / Perseus Digital Library / Fordham Internet History Sourcebooks", "description": "Ancient primary text excerpts (Josephus, Tacitus, etc.)", "status": "approved", "citation": "Reference-only. Use brief quotations under Fair Use."},
        {"name": "Tree of Life Version (TLV)", "description": "Reflects Hebraic roots; great for Word Study or contextual enrichment", "status": "approved", "citation": "2014 Tree of Life Bible Society. Use with attribution."},
        {"name": "Names of God Bible (NOG)", "description": "Highlights divine names and attributes. Excellent for Faith Nuggets and Attention Grabbers.", "status": "approved", "citation": "2011 Baker Publishing Group."},
    ]
    
    for s in sources:
        s["seeded_at"] = datetime.now(timezone.utc)
    
    return sources


# ============================================================================
# PASSION WEEK MAP
# ============================================================================
def seed_passion_week_image():
    """Store reference to the Passion Week image"""
    db.game_assets.delete_many({"asset_type": "passion_week_map"})
    db.game_assets.insert_one({
        "asset_type": "passion_week_map",
        "name": "The Passion Week in Jerusalem",
        "description": "Map showing the movements of Jesus during Passion Week, including Sunday through Friday locations",
        "file_path": "/app/backend/content/images/passion-week-jesus.png",
        "source_url": "https://customer-assets.emergentagent.com/job_64d80310-cc07-4e65-acc3-6144c54ee276/artifacts/ts6ftdbn_Passion%20Week%20-%20Jesus.png",
        "seeded_at": datetime.now(timezone.utc)
    })
    print("  Stored Passion Week map reference")


# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("SOFU Master Question Bank Seeder")
    print("=" * 60)
    
    print("\n[1/5] Building questions...")
    questions = build_all_questions()
    
    print(f"\n[2/5] Seeding {len(questions)} questions to MongoDB...")
    seed_questions(questions)
    
    print("\n[3/5] Seeding word studies...")
    studies = build_word_studies()
    seed_word_studies(studies)
    
    print("\n[4/5] Seeding reference sources...")
    sources = build_reference_sources()
    seed_reference_sources(sources)
    
    print("\n[5/5] Storing Passion Week image reference...")
    seed_passion_week_image()
    
    # Summary
    print("\n" + "=" * 60)
    print("SEED COMPLETE")
    print("=" * 60)
    
    # Character breakdown
    pipeline = [{"$group": {"_id": "$character", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    print("\nQuestions by Character:")
    for doc in db.trivia_questions.aggregate(pipeline):
        print(f"  {doc['_id']}: {doc['count']}")
    
    # Game type breakdown
    pipeline = [{"$group": {"_id": "$game_type", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    print("\nQuestions by Game Type:")
    for doc in db.trivia_questions.aggregate(pipeline):
        print(f"  {doc['_id']}: {doc['count']}")
    
    # Age group breakdown
    pipeline = [{"$group": {"_id": "$age_group", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    print("\nQuestions by Age Group:")
    for doc in db.trivia_questions.aggregate(pipeline):
        print(f"  {doc['_id']}: {doc['count']}")
    
    print(f"\nWord Studies: {db.word_studies.count_documents({})}")
    print(f"Reference Sources: {db.reference_sources.count_documents({})}")
    print(f"Game Assets: {db.game_assets.count_documents({})}")
    print("\nDone!")
