"""
PDF Generation for Soul Food Interactive Lessons
Creates downloadable PDFs with interactive Table of Contents
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, 
    Table, TableStyle, ListFlowable, ListItem, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from io import BytesIO
from datetime import datetime


class LessonPDFGenerator:
    """Generates interactive PDFs for Soul Food lessons"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        self.bookmarks = []
        self.page_numbers = {}
        
    def _setup_custom_styles(self):
        """Setup custom paragraph styles for the PDF"""
        
        # Title style
        self.styles.add(ParagraphStyle(
            name='LessonTitle',
            parent=self.styles['Heading1'],
            fontSize=28,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#4F46E5')
        ))
        
        # Subtitle/Theme style
        self.styles.add(ParagraphStyle(
            name='Theme',
            parent=self.styles['Normal'],
            fontSize=16,
            spaceAfter=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#7C3AED'),
            fontName='Helvetica-Oblique'
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceBefore=16,
            spaceAfter=8,
            textColor=colors.HexColor('#1E293B'),
            borderPadding=4
        ))
        
        # Bite header style
        self.styles.add(ParagraphStyle(
            name='BiteHeader',
            parent=self.styles['Heading3'],
            fontSize=12,
            spaceBefore=12,
            spaceAfter=6,
            textColor=colors.HexColor('#4F46E5')
        ))
        
        # Scripture style - increased leading for readability
        self.styles.add(ParagraphStyle(
            name='Scripture',
            parent=self.styles['Normal'],
            fontSize=11,
            leftIndent=20,
            rightIndent=20,
            spaceBefore=6,
            spaceAfter=6,
            fontName='Helvetica-Oblique',
            textColor=colors.HexColor('#374151'),
            borderColor=colors.HexColor('#4F46E5'),
            borderWidth=0,
            borderPadding=8,
            backColor=colors.HexColor('#F1F5F9'),
            leading=17  # 1.5x line height
        ))
        
        # Body text style - increased leading for better readability (1.5x line height)
        self.styles.add(ParagraphStyle(
            name='LessonBodyText',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceBefore=4,
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            leading=18  # Increased from 16 to 18 (1.5x line height for 11pt font)
        ))
        
        # Prayer style - increased leading for readability
        self.styles.add(ParagraphStyle(
            name='Prayer',
            parent=self.styles['Normal'],
            fontSize=11,
            leftIndent=15,
            rightIndent=15,
            spaceBefore=6,
            spaceAfter=10,
            fontName='Helvetica-Oblique',
            textColor=colors.HexColor('#059669'),
            backColor=colors.HexColor('#ECFDF5'),
            borderPadding=10,
            leading=17  # 1.5x line height
        ))
        
        # Question/Prompt style
        self.styles.add(ParagraphStyle(
            name='Question',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceBefore=8,
            spaceAfter=4,
            textColor=colors.HexColor('#B45309'),
            fontName='Helvetica-Bold'
        ))
        
        # Answer line style
        self.styles.add(ParagraphStyle(
            name='AnswerLine',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceBefore=4,
            spaceAfter=12,
            textColor=colors.HexColor('#9CA3AF')
        ))
        
        # TOC Title - Amazon-style elegant header
        self.styles.add(ParagraphStyle(
            name='TOCTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceBefore=0,
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#1F2937')
        ))
        
        # TOC entry style - Clean, professional like Amazon books
        self.styles.add(ParagraphStyle(
            name='TOCEntry',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceBefore=8,
            spaceAfter=8,
            leftIndent=0,
            fontName='Helvetica',
            leading=18
        ))
        
        # TOC Chapter style - Bold section headers
        self.styles.add(ParagraphStyle(
            name='TOCChapter',
            parent=self.styles['Normal'],
            fontSize=14,
            spaceBefore=16,
            spaceAfter=6,
            leftIndent=0,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#4F46E5')
        ))
        
        # TOC sub-entry style - Indented lesson items
        self.styles.add(ParagraphStyle(
            name='TOCSubEntry',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceBefore=4,
            spaceAfter=4,
            leftIndent=24,
            textColor=colors.HexColor('#4B5563'),
            leading=16
        ))
        
        # TOC page number style
        self.styles.add(ParagraphStyle(
            name='TOCPageNum',
            parent=self.styles['Normal'],
            fontSize=11,
            alignment=TA_RIGHT,
            textColor=colors.HexColor('#6B7280')
        ))
        
        # Copyright style
        self.styles.add(ParagraphStyle(
            name='Copyright',
            parent=self.styles['Normal'],
            fontSize=9,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#6B7280'),
            spaceBefore=4,
            spaceAfter=4
        ))
        
        # Key verse style
        self.styles.add(ParagraphStyle(
            name='KeyVerse',
            parent=self.styles['Normal'],
            fontSize=12,
            alignment=TA_CENTER,
            spaceBefore=10,
            spaceAfter=10,
            fontName='Helvetica-Oblique',
            textColor=colors.HexColor('#4F46E5'),
            backColor=colors.HexColor('#EEF2FF'),
            borderPadding=15
        ))

    def generate_lesson_pdf(self, nibble: dict, series_info: dict = None) -> BytesIO:
        """Generate a PDF for a single lesson (nibble)"""
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        story = []
        toc_entries = []
        
        # === TITLE PAGE ===
        story.append(Spacer(1, 1.5*inch))
        
        # Series name
        if nibble.get('series_name'):
            story.append(Paragraph(
                f"Soul Food • {nibble['series_name']}",
                self.styles['Theme']
            ))
            story.append(Spacer(1, 0.3*inch))
        
        # Main title
        story.append(Paragraph(nibble['title'], self.styles['LessonTitle']))
        
        # Theme
        if nibble.get('theme'):
            story.append(Paragraph(f'"{nibble["theme"]}"', self.styles['Theme']))
        
        story.append(Spacer(1, 0.5*inch))
        
        # Key verse on title page
        if nibble.get('key_verse_text'):
            verse_text = f'"{nibble["key_verse_text"]}"<br/><br/>— {nibble.get("key_verse_ref", "")}'
            story.append(Paragraph(verse_text, self.styles['KeyVerse']))
        
        story.append(Spacer(1, 1*inch))
        
        # Edition info
        edition = nibble.get('edition', 'Adult').title()
        story.append(Paragraph(
            f"Lesson {nibble.get('lesson_number', '')} • {edition} Edition",
            self.styles['Copyright']
        ))
        
        toc_entries.append(("Title Page", 1))
        story.append(PageBreak())
        
        # === COPYRIGHT PAGE ===
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Soul Food", self.styles['LessonTitle']))
        story.append(Paragraph("Kingdom Living Project", self.styles['Theme']))
        story.append(Spacer(1, 0.5*inch))
        
        copyright_text = f"""
        © {datetime.now().year} Soul Food Kingdom Living Project<br/><br/>
        All rights reserved. No part of this publication may be reproduced, 
        distributed, or transmitted in any form or by any means without prior 
        written permission.<br/><br/>
        {nibble.get('scripture_disclosure', 'Scripture quotations are from the World English Bible (WEB), public domain.')}<br/><br/>
        For more information, visit our website or contact us.
        """
        story.append(Paragraph(copyright_text, self.styles['Copyright']))
        
        toc_entries.append(("Copyright", 2))
        story.append(PageBreak())
        
        # === DEDICATION PAGE ===
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Dedication", self.styles['SectionHeader']))
        story.append(Spacer(1, 0.3*inch))
        
        dedication_text = """
        <i>To all who hunger and thirst for righteousness,<br/>
        may you be filled.<br/><br/>
        To the Body of Christ,<br/>
        may we grow together in wisdom and love.<br/><br/>
        "Blessed are those who hunger and thirst for righteousness,<br/>
        for they will be filled."<br/>
        — Matthew 5:6</i>
        """
        story.append(Paragraph(dedication_text, ParagraphStyle(
            'Dedication',
            parent=self.styles['LessonBodyText'],
            alignment=TA_CENTER,
            fontSize=12,
            leading=20
        )))
        
        toc_entries.append(("Dedication", 3))
        story.append(PageBreak())
        
        # === QUICK START PAGE ===
        story.append(Paragraph("Quick Start Guide", self.styles['SectionHeader']))
        story.append(Spacer(1, 0.2*inch))
        
        quick_start_items = [
            "<b>🙏 Begin with Prayer</b> – Start each lesson with the Opening Prayer to center your heart.",
            "<b>📖 Read the Scripture</b> – Each 'Bite' includes Scripture. Read it slowly and thoughtfully.",
            "<b>💡 Study the Teaching</b> – Reflect on the teaching section and how it applies to your life.",
            "<b>✍️ Answer the Questions</b> – Use the reflection questions for personal journaling or group discussion.",
            "<b>🎯 Complete the Activity</b> – Reinforce your learning with the fill-in-blank or matching activities.",
            "<b>🥡 Take It To-Go</b> – Review the To-Go Box for key takeaways to remember throughout the week.",
            "<b>🙏 Close in Prayer</b> – End with the Closing Prayer and add your own personal prayer."
        ]
        
        for item in quick_start_items:
            story.append(Paragraph(item, self.styles['LessonBodyText']))
            story.append(Spacer(1, 0.1*inch))
        
        toc_entries.append(("Quick Start Guide", 4))
        story.append(PageBreak())
        
        # === TABLE OF CONTENTS (Amazon-style) ===
        story.append(Paragraph("Contents", self.styles['TOCTitle']))
        
        # Decorative line under title
        story.append(HRFlowable(width="50%", thickness=1, color=colors.HexColor('#E5E7EB'), spaceBefore=0, spaceAfter=20))
        
        # Build TOC entries with professional dotted leaders
        toc_data = [
            ("Title Page", "i"),
            ("Copyright & Dedication", "ii"),
            ("How to Use This Study", "iii"),
        ]
        
        # Calculate page numbers for lesson content
        current_page = 1
        
        # Main lesson entry
        lesson_title = f"{nibble['title']}"
        toc_data.append((lesson_title, str(current_page)))
        
        # Create professional TOC with dotted leaders
        from reportlab.platypus import Table, TableStyle
        
        toc_table_data = []
        
        # Front matter section
        toc_table_data.append([Paragraph("<b>FRONT MATTER</b>", self.styles['TOCChapter']), ""])
        for entry, page in toc_data[:3]:
            # Create dotted leader effect
            entry_text = f"<font color='#374151'>{entry}</font>"
            toc_table_data.append([
                Paragraph(entry_text, self.styles['TOCSubEntry']),
                Paragraph(f"<font color='#6B7280'>{page}</font>", self.styles['TOCPageNum'])
            ])
        
        # Lesson section
        toc_table_data.append([Paragraph("", self.styles['TOCEntry']), ""])  # Spacer row
        toc_table_data.append([Paragraph("<b>THE LESSON</b>", self.styles['TOCChapter']), ""])
        
        # Lesson title
        toc_table_data.append([
            Paragraph(f"<b>{nibble['title']}</b>", self.styles['TOCEntry']),
            Paragraph("<font color='#4F46E5'><b>1</b></font>", self.styles['TOCPageNum'])
        ])
        
        # Sub-entries for the lesson
        sub_entries = [
            ("🙏 Opening Prayer", "1"),
            ("🍽️ Appetizer (Background)", "1"),
            ("📖 Key Verse", "2"),
        ]
        
        # Add bites with page estimates
        page_num = 2
        for i, bite in enumerate(nibble.get('bites', []), 1):
            sub_entries.append((f"📚 Bite {i}: {bite.get('title', '')}", str(page_num)))
            page_num += 1
        
        # Add remaining sections
        sub_entries.extend([
            ("🥡 To-Go Box (Key Takeaways)", str(page_num)),
            ("✏️ Activity", str(page_num)),
            ("🙏 Your Personal Prayer", str(page_num + 1)),
            ("🙏 Closing Prayer", str(page_num + 1))
        ])
        
        # Add word study if present
        if nibble.get('word_study'):
            sub_entries.append(("📝 Word Study", str(page_num + 2)))
        
        for entry, page in sub_entries:
            toc_table_data.append([
                Paragraph(entry, self.styles['TOCSubEntry']),
                Paragraph(f"<font color='#6B7280'>{page}</font>", self.styles['TOCPageNum'])
            ])
        
        # Create the TOC table with proper column widths
        toc_table = Table(toc_table_data, colWidths=[5.5*inch, 0.75*inch])
        toc_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        story.append(toc_table)
        
        story.append(PageBreak())
        
        # === LESSON CONTENT ===
        
        # Opening Prayer
        story.append(Paragraph("🙏 Opening Prayer", self.styles['SectionHeader']))
        if nibble.get('opening_prayer'):
            story.append(Paragraph(nibble['opening_prayer'], self.styles['Prayer']))
        story.append(Spacer(1, 0.2*inch))
        
        # Appetizer
        story.append(Paragraph("🍽️ Appetizer", self.styles['SectionHeader']))
        if nibble.get('appetizer'):
            story.append(Paragraph(nibble['appetizer'], self.styles['LessonBodyText']))
        story.append(Spacer(1, 0.2*inch))
        
        # Key Verse
        story.append(Paragraph("📖 Key Verse", self.styles['SectionHeader']))
        if nibble.get('key_verse_text'):
            verse_box = f'"{nibble["key_verse_text"]}"<br/>— {nibble.get("key_verse_ref", "")}'
            story.append(Paragraph(verse_box, self.styles['Scripture']))
        story.append(Spacer(1, 0.3*inch))
        
        # Bites
        for i, bite in enumerate(nibble.get('bites', []), 1):
            story.append(Paragraph(
                f"Bite {i}: {bite.get('title', '')}",
                self.styles['BiteHeader']
            ))
            
            # Scripture
            if bite.get('scripture_ref') and bite.get('scripture_text'):
                scripture = f"<b>{bite['scripture_ref']}</b><br/>\"{bite['scripture_text']}\""
                story.append(Paragraph(scripture, self.styles['Scripture']))
            
            # Teaching
            if bite.get('teaching'):
                story.append(Paragraph("<b>Teaching:</b>", self.styles['LessonBodyText']))
                story.append(Paragraph(bite['teaching'], self.styles['LessonBodyText']))
            
            # CST (Core Shared Truth)
            if bite.get('cst'):
                story.append(Paragraph(
                    f"<b>Core Shared Truth:</b> {bite['cst']}",
                    ParagraphStyle(
                        'CST',
                        parent=self.styles['LessonBodyText'],
                        backColor=colors.HexColor('#F3E8FF'),
                        borderPadding=8,
                        textColor=colors.HexColor('#7C3AED')
                    )
                ))
            
            # Reflection Question
            if bite.get('question'):
                q = bite['question']
                story.append(Paragraph(
                    f"💭 Reflection: {q.get('prompt', '')}",
                    self.styles['Question']
                ))
                story.append(Paragraph(
                    "_" * 70 + "<br/>" + "_" * 70 + "<br/>" + "_" * 70,
                    self.styles['AnswerLine']
                ))
            
            story.append(Spacer(1, 0.2*inch))
        
        # To-Go Box
        story.append(Paragraph("🥡 To-Go Box (Key Takeaways)", self.styles['SectionHeader']))
        if nibble.get('to_go_box'):
            for item in nibble['to_go_box']:
                story.append(Paragraph(f"✓ {item}", self.styles['LessonBodyText']))
        story.append(Spacer(1, 0.2*inch))
        
        # Word Study
        if nibble.get('word_study'):
            story.append(Paragraph("📚 Word Study", self.styles['SectionHeader']))
            for term, definition in nibble['word_study'].items():
                story.append(Paragraph(
                    f"<b>{term}:</b> {definition}",
                    self.styles['LessonBodyText']
                ))
            story.append(Spacer(1, 0.2*inch))
        
        # Activity
        if nibble.get('activity'):
            activity = nibble['activity']
            story.append(Paragraph(
                f"✏️ Activity: {activity.get('title', '')}",
                self.styles['SectionHeader']
            ))
            
            if activity.get('instructions'):
                story.append(Paragraph(activity['instructions'], self.styles['LessonBodyText']))
            
            story.append(Spacer(1, 0.1*inch))
            
            for i, q in enumerate(activity.get('questions', []), 1):
                prompt = q.get('prompt', '')
                q_type = q.get('type', '')
                
                if q_type == 'fill_in_blank':
                    story.append(Paragraph(f"{i}. {prompt}", self.styles['Question']))
                    story.append(Paragraph("Answer: _______________________", self.styles['AnswerLine']))
                elif q_type == 'word_scramble':
                    scrambled = q.get('scrambled_letters', '')
                    story.append(Paragraph(f"{i}. {prompt}", self.styles['Question']))
                    story.append(Paragraph(f"Unscramble: {scrambled}", self.styles['LessonBodyText']))
                    story.append(Paragraph("Answer: _______________________", self.styles['AnswerLine']))
                else:  # reflection
                    story.append(Paragraph(f"{i}. {prompt}", self.styles['Question']))
                    story.append(Paragraph(
                        "_" * 70 + "<br/>" + "_" * 70 + "<br/>" + "_" * 70,
                        self.styles['AnswerLine']
                    ))
            
            story.append(Spacer(1, 0.2*inch))
        
        # Your Prayer
        story.append(Paragraph("✍️ Your Prayer", self.styles['SectionHeader']))
        if nibble.get('your_prayer_prompt'):
            story.append(Paragraph(nibble['your_prayer_prompt'], self.styles['LessonBodyText']))
        story.append(Paragraph(
            "_" * 70 + "<br/>" + "_" * 70 + "<br/>" + "_" * 70 + "<br/>" + "_" * 70,
            self.styles['AnswerLine']
        ))
        story.append(Spacer(1, 0.2*inch))
        
        # Closing Prayer
        story.append(Paragraph("🙏 Closing Prayer", self.styles['SectionHeader']))
        if nibble.get('closing_prayer'):
            story.append(Paragraph(nibble['closing_prayer'], self.styles['Prayer']))
        
        # Scripture Disclosure
        story.append(Spacer(1, 0.3*inch))
        if nibble.get('scripture_disclosure'):
            story.append(Paragraph(
                nibble['scripture_disclosure'],
                self.styles['Copyright']
            ))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    def generate_series_pdf(self, nibbles: list, series_name: str, series_info: dict = None) -> BytesIO:
        """Generate a PDF for an entire series of lessons"""
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        story = []
        
        # === TITLE PAGE ===
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Soul Food", self.styles['LessonTitle']))
        story.append(Paragraph(series_name, self.styles['Theme']))
        story.append(Spacer(1, 0.5*inch))
        
        if series_info and series_info.get('theme_verse'):
            story.append(Paragraph(
                f"<i>{series_info['theme_verse']}</i>",
                self.styles['KeyVerse']
            ))
        
        story.append(Spacer(1, 1*inch))
        story.append(Paragraph(
            f"{len(nibbles)} Lessons • Adult Edition",
            self.styles['Copyright']
        ))
        story.append(PageBreak())
        
        # === COPYRIGHT ===
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Soul Food", self.styles['LessonTitle']))
        story.append(Paragraph("Kingdom Living Project", self.styles['Theme']))
        story.append(Spacer(1, 0.5*inch))
        
        copyright_text = f"""
        © {datetime.now().year} Soul Food Kingdom Living Project<br/><br/>
        All rights reserved.<br/><br/>
        Scripture quotations are from the World English Bible (WEB), public domain.
        """
        story.append(Paragraph(copyright_text, self.styles['Copyright']))
        story.append(PageBreak())
        
        # === DEDICATION ===
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Dedication", self.styles['SectionHeader']))
        story.append(Spacer(1, 0.3*inch))
        
        dedication_text = """
        <i>To all who hunger and thirst for righteousness,<br/>
        may you be filled.<br/><br/>
        "Blessed are those who hunger and thirst for righteousness,<br/>
        for they will be filled."<br/>
        — Matthew 5:6</i>
        """
        story.append(Paragraph(dedication_text, ParagraphStyle(
            'Dedication',
            parent=self.styles['LessonBodyText'],
            alignment=TA_CENTER,
            fontSize=12,
            leading=20
        )))
        story.append(PageBreak())
        
        # === QUICK START ===
        story.append(Paragraph("Quick Start Guide", self.styles['SectionHeader']))
        story.append(Spacer(1, 0.2*inch))
        
        quick_start_items = [
            "<b>🙏 Begin with Prayer</b> – Start each lesson with the Opening Prayer.",
            "<b>📖 Read the Scripture</b> – Read each Scripture slowly and thoughtfully.",
            "<b>💡 Study the Teaching</b> – Reflect on how it applies to your life.",
            "<b>✍️ Answer the Questions</b> – Use for personal journaling or group discussion.",
            "<b>🎯 Complete the Activity</b> – Reinforce your learning.",
            "<b>🥡 Take It To-Go</b> – Remember the key takeaways throughout the week.",
            "<b>🙏 Close in Prayer</b> – End with prayer."
        ]
        
        for item in quick_start_items:
            story.append(Paragraph(item, self.styles['LessonBodyText']))
        story.append(PageBreak())
        
        # === TABLE OF CONTENTS ===
        story.append(Paragraph("Table of Contents", self.styles['SectionHeader']))
        story.append(Spacer(1, 0.3*inch))
        
        # Front matter
        story.append(Paragraph("Title Page .......................... 1", self.styles['TOCEntry']))
        story.append(Paragraph("Copyright ........................... 2", self.styles['TOCEntry']))
        story.append(Paragraph("Dedication .......................... 3", self.styles['TOCEntry']))
        story.append(Paragraph("Quick Start Guide ................... 4", self.styles['TOCEntry']))
        story.append(Spacer(1, 0.2*inch))
        
        # Lessons
        current_page = 6
        for nibble in nibbles:
            story.append(Paragraph(
                f"Lesson {nibble.get('lesson_number', '')}: {nibble['title']}",
                self.styles['TOCEntry']
            ))
            
            # Sub-entries
            sub_entries = ["Opening Prayer", "Appetizer", "Key Verse"]
            for i, bite in enumerate(nibble.get('bites', []), 1):
                sub_entries.append(f"Bite {i}: {bite.get('title', '')}")
            sub_entries.extend(["To-Go Box", "Activity", "Closing Prayer"])
            
            for sub in sub_entries:
                story.append(Paragraph(f"    • {sub}", self.styles['TOCSubEntry']))
            
            story.append(Spacer(1, 0.1*inch))
        
        story.append(PageBreak())
        
        # === LESSON CONTENT ===
        for nibble in nibbles:
            # Lesson title page
            story.append(Spacer(1, 1*inch))
            story.append(Paragraph(
                f"Lesson {nibble.get('lesson_number', '')}",
                self.styles['Theme']
            ))
            story.append(Paragraph(nibble['title'], self.styles['LessonTitle']))
            if nibble.get('theme'):
                story.append(Paragraph(f'"{nibble["theme"]}"', self.styles['Theme']))
            
            if nibble.get('key_verse_text'):
                story.append(Spacer(1, 0.3*inch))
                verse_box = f'"{nibble["key_verse_text"]}"<br/>— {nibble.get("key_verse_ref", "")}'
                story.append(Paragraph(verse_box, self.styles['KeyVerse']))
            
            story.append(PageBreak())
            
            # Opening Prayer
            story.append(Paragraph("🙏 Opening Prayer", self.styles['SectionHeader']))
            if nibble.get('opening_prayer'):
                story.append(Paragraph(nibble['opening_prayer'], self.styles['Prayer']))
            story.append(Spacer(1, 0.2*inch))
            
            # Appetizer
            story.append(Paragraph("🍽️ Appetizer", self.styles['SectionHeader']))
            if nibble.get('appetizer'):
                story.append(Paragraph(nibble['appetizer'], self.styles['LessonBodyText']))
            story.append(Spacer(1, 0.2*inch))
            
            # Bites
            for i, bite in enumerate(nibble.get('bites', []), 1):
                story.append(Paragraph(
                    f"Bite {i}: {bite.get('title', '')}",
                    self.styles['BiteHeader']
                ))
                
                if bite.get('scripture_ref') and bite.get('scripture_text'):
                    scripture = f"<b>{bite['scripture_ref']}</b><br/>\"{bite['scripture_text']}\""
                    story.append(Paragraph(scripture, self.styles['Scripture']))
                
                if bite.get('teaching'):
                    story.append(Paragraph("<b>Teaching:</b>", self.styles['LessonBodyText']))
                    story.append(Paragraph(bite['teaching'], self.styles['LessonBodyText']))
                
                if bite.get('cst'):
                    story.append(Paragraph(
                        f"<b>Core Shared Truth:</b> {bite['cst']}",
                        ParagraphStyle(
                            'CST',
                            parent=self.styles['LessonBodyText'],
                            backColor=colors.HexColor('#F3E8FF'),
                            borderPadding=8,
                            textColor=colors.HexColor('#7C3AED')
                        )
                    ))
                
                if bite.get('question'):
                    q = bite['question']
                    story.append(Paragraph(
                        f"💭 Reflection: {q.get('prompt', '')}",
                        self.styles['Question']
                    ))
                    story.append(Paragraph(
                        "_" * 70 + "<br/>" + "_" * 70 + "<br/>" + "_" * 70,
                        self.styles['AnswerLine']
                    ))
                
                story.append(Spacer(1, 0.15*inch))
            
            # To-Go Box
            story.append(Paragraph("🥡 To-Go Box", self.styles['SectionHeader']))
            if nibble.get('to_go_box'):
                for item in nibble['to_go_box']:
                    story.append(Paragraph(f"✓ {item}", self.styles['LessonBodyText']))
            story.append(Spacer(1, 0.2*inch))
            
            # Word Study
            if nibble.get('word_study'):
                story.append(Paragraph("📚 Word Study", self.styles['SectionHeader']))
                for term, definition in nibble['word_study'].items():
                    story.append(Paragraph(f"<b>{term}:</b> {definition}", self.styles['LessonBodyText']))
                story.append(Spacer(1, 0.2*inch))
            
            # Activity
            if nibble.get('activity'):
                activity = nibble['activity']
                story.append(Paragraph(
                    f"✏️ Activity: {activity.get('title', '')}",
                    self.styles['SectionHeader']
                ))
                
                if activity.get('instructions'):
                    story.append(Paragraph(activity['instructions'], self.styles['LessonBodyText']))
                
                for i, q in enumerate(activity.get('questions', []), 1):
                    prompt = q.get('prompt', '')
                    q_type = q.get('type', '')
                    
                    if q_type == 'fill_in_blank':
                        story.append(Paragraph(f"{i}. {prompt}", self.styles['Question']))
                        story.append(Paragraph("Answer: _______________________", self.styles['AnswerLine']))
                    elif q_type == 'word_scramble':
                        scrambled = q.get('scrambled_letters', '')
                        story.append(Paragraph(f"{i}. {prompt}", self.styles['Question']))
                        story.append(Paragraph(f"Unscramble: {scrambled}", self.styles['LessonBodyText']))
                        story.append(Paragraph("Answer: _______________________", self.styles['AnswerLine']))
                    else:
                        story.append(Paragraph(f"{i}. {prompt}", self.styles['Question']))
                        story.append(Paragraph(
                            "_" * 70 + "<br/>" + "_" * 70 + "<br/>" + "_" * 70,
                            self.styles['AnswerLine']
                        ))
                
                story.append(Spacer(1, 0.2*inch))
            
            # Your Prayer
            story.append(Paragraph("✍️ Your Prayer", self.styles['SectionHeader']))
            if nibble.get('your_prayer_prompt'):
                story.append(Paragraph(nibble['your_prayer_prompt'], self.styles['LessonBodyText']))
            story.append(Paragraph(
                "_" * 70 + "<br/>" + "_" * 70 + "<br/>" + "_" * 70,
                self.styles['AnswerLine']
            ))
            story.append(Spacer(1, 0.2*inch))
            
            # Closing Prayer
            story.append(Paragraph("🙏 Closing Prayer", self.styles['SectionHeader']))
            if nibble.get('closing_prayer'):
                story.append(Paragraph(nibble['closing_prayer'], self.styles['Prayer']))
            
            story.append(PageBreak())
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
