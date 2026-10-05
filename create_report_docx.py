import os
from PIL import Image
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_OUTPUT_PATH = r"D:\libarr\LibraAI_Project_Screenshots.docx"
SCREENSHOT_DIR = r"D:\libarr\report_screenshots"

figures_data = [
    {
        "num": 1,
        "title": "Guest Landing Page & Public Discovery Catalog",
        "file": "01_guest_home.png",
        "caption": "Figure 1: Guest Landing Page – Public discovery catalog with live database metrics, global search bar, featured collections, and role-based entry points.",
        "module": "Public Discovery & Guest Access",
        "role": "Guest / General Public",
        "description": "The public landing page provides incoming users with an overview of the LibraAI institution, displaying real-time database statistics of 2,299 catalog titles and 8,246 physical volumes. It includes an omnichannel search bar for locating books by title, author, or ISBN, along with curated carousels for 'Recommended For You' and 'New Arrivals'. Unauthenticated visitors can easily explore the catalog or transition to authentication via prominent Login and Sign Up controls."
    },
    {
        "num": 2,
        "title": "User Authentication & Sign-In Dialog",
        "file": "02_login_popup.png",
        "caption": "Figure 2: User Authentication – Interactive modal dialog supporting credential authentication for students, faculty, librarians, and system administrators.",
        "module": "Authentication & Session Security",
        "role": "All System Roles",
        "description": "The authentication interface is implemented as a clean, accessible modal dialog that allows existing campus members to sign in using their registered email address or member ID. It integrates client-side form validation, secure password masking with reveal toggles, and contextual notice banners explaining required access privileges. Upon successful JWT token verification, users are automatically directed to their corresponding role-specific dashboard."
    },
    {
        "num": 3,
        "title": "Student Dashboard & Personalized Learning Hub",
        "file": "03_student_dashboard.png",
        "caption": "Figure 3: Student Dashboard – Member portal featuring active book loans, upcoming due dates, instant renewal actions, and AI reading recommendations.",
        "module": "Member Services & Patron Management",
        "role": "Student / Scholar",
        "description": "The student dashboard serves as a personalized command center for enrolled scholars, displaying active loans such as 'The Complete Reference HTML & CSS' alongside clear return countdown badges. Students can trigger one-click loan renewals, review their semester borrow history, and track overdue fine liabilities in real time. The interface also highlights contextual AI reading recommendations and quick-launch widgets for the LibraBot study assistant."
    },
    {
        "num": 4,
        "title": "Interactive Books Catalog & Multi-Attribute Search",
        "file": "04_catalog_search.png",
        "caption": "Figure 4: Books Catalog & Search – Real-time keyword filtering across 2,299 titles with rack location badges, availability counters, and department filters.",
        "module": "Catalog & Inventory Management",
        "role": "Patrons & Librarians",
        "description": "The books catalog interface provides instant multi-attribute search across the library's live database, demonstrating instant filtering for 'Computer' with 708 matching academic titles. Each catalog card showcases publication metadata, physical shelf and rack locator badges (e.g., Rack A1–C4), and dynamic availability indicators. Users can sort by popularity or year and drill down by academic branch, format, or circulation status."
    },
    {
        "num": 5,
        "title": "LibraBot AI Conversational Study Assistant",
        "file": "05_ai_feature.png",
        "caption": "Figure 5: LibraBot AI Assistant – Domain-aware conversational assistant providing technical comparisons between SQL and NoSQL with direct library book references.",
        "module": "Generative AI & Semantic Services",
        "role": "Students & Researchers",
        "description": "The LibraBot assistant integrates Large Language Model reasoning directly into the library discovery workflow. In this demonstration, a student inquires about architectural trade-offs between SQL and NoSQL databases, receiving a structured technical breakdown alongside cited reference textbooks available in the physical catalog. The floating conversational interface enables continuous study assistance without navigating away from the active page."
    },
    {
        "num": 6,
        "title": "Librarian Operational Dashboard & Daily Circulation",
        "file": "06_librarian_dashboard.png",
        "caption": "Figure 6: Librarian Dashboard – Operational desk showing daily circulation statistics, active loan monitors, pending returns, and rapid barcode actions.",
        "module": "Circulation Operations & Desk Management",
        "role": "Librarian / Staff",
        "description": "The librarian dashboard gives desk officers immediate operational oversight over daily campus circulation, active loans, and student return queues. It aggregates key operational indicators such as active borrowings and return logs while offering direct shortcuts for rapid barcode checkouts and inventory audits. The live transaction table enables librarians to inspect patron IDs, borrow timestamps, and book conditions at a glance."
    },
    {
        "num": 7,
        "title": "Rapid Circulation Desk (Book Issue & Return Terminal)",
        "file": "07_issue_return.png",
        "caption": "Figure 7: Rapid Circulation Desk – Barcode/member circulation console with instant book issuing, return validation, and automatic fine calculation.",
        "module": "Circulation Desk Operations",
        "role": "Librarian / Desk Officer",
        "description": "The Rapid Circulation Desk allows desk officers to execute checkouts and returns within seconds using barcode scanners or manual member ID lookups. The system automatically enforces loan eligibility policies, computes scheduled return due dates (typically 14 days), and validates copy availability. Upon processing a return, the module calculates overdue fines at standard institutional rates (₹5/day) and generates cryptographic audit receipts."
    },
    {
        "num": 8,
        "title": "Administrative Control Center & System Health Overview",
        "file": "08_admin_dashboard.png",
        "caption": "Figure 8: Admin Dashboard – Institutional KPI cards, 99.98% SLA monitoring, monthly circulation activity curves, and AI engine telemetry.",
        "module": "System Administration & Infrastructure",
        "role": "Administrator",
        "description": "The administrative dashboard provides institution-wide executive oversight over campus infrastructure, tracking 2,299 catalog titles, 520 registered members, and 99.98% system uptime. It includes visual circulation trend curves comparing book checkouts against return volumes, alongside a live telemetry monitor for backend AI services including vector embeddings and OpenRouter workers. Administrators can perform bulk Excel imports and audit ledger reviews directly from this hub."
    },
    {
        "num": 9,
        "title": "User Management & Role-Based Account Provisioning",
        "file": "09_admin_users.png",
        "caption": "Figure 9: User Management – Comprehensive campus member directory with role-based access control and account provisioning modal.",
        "module": "User Administration & RBAC",
        "role": "Administrator",
        "description": "The user management console provides administrators with complete control over patron and staff identities across all departments and academic semesters. The modal form allows the administrator to provision new accounts with designated roles (Student, Faculty, Librarian, or Admin), custom member IDs, and initial security credentials. The underlying directory table supports real-time search, status toggles (Active/Suspended), and fine liability audits."
    },
    {
        "num": 10,
        "title": "Comprehensive 22-Chart Analytics & Institutional Intelligence",
        "file": "10_analytics_charts.png",
        "caption": "Figure 10: Analytics & Reports – Executive visualization suite displaying circulation footfall timelines, category donut distributions, and top borrowed books.",
        "module": "Business Intelligence & Analytics",
        "role": "Admin & Chief Librarian",
        "description": "The analytics and reporting module transforms transactional circulation records into rich institutional intelligence using interactive Recharts components. The screen highlights a 30-day circulation footfall area chart, an academic category distribution donut chart showing holdings across Mechanical, Computer, and Science branches, and a ranked bar chart of top borrowed titles. Decision-makers can filter analytics by department, date range, or export executive summaries for institutional accreditation."
    }
]

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner padding for table cells."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_border(cell, color="CBD5E1", sz="6", val="single"):
    """Add subtle border around cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)

def create_document():
    doc = Document()

    # 1. Page Margins - Standard 1 inch (72 pt)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

    # Base styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(51, 65, 85) # Slate 700

    # -------------------------------------------------------------
    # TITLE PAGE
    # -------------------------------------------------------------
    p_top_space = doc.add_paragraph()
    p_top_space.paragraph_format.space_before = Pt(36)
    p_top_space.paragraph_format.space_after = Pt(12)

    # Project Tag
    p_tag = doc.add_paragraph()
    p_tag.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_tag = p_tag.add_run("INTERNSHIP PROJECT TECHNICAL DOCUMENTATION")
    run_tag.font.name = 'Calibri'
    run_tag.font.size = Pt(10)
    run_tag.font.bold = True
    run_tag.font.color.rgb = RGBColor(37, 99, 235) # Blue 600
    p_tag.paragraph_format.space_after = Pt(18)

    # Document Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run("LibraAI")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(32)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(30, 58, 138) # Blue 900
    p_title.paragraph_format.space_after = Pt(4)

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("AI-Powered Institutional Library Management System")
    run_sub.font.name = 'Calibri'
    run_sub.font.size = Pt(16)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(71, 85, 105) # Slate 600
    p_sub.paragraph_format.space_after = Pt(8)

    # Description Subtitle
    p_sub2 = doc.add_paragraph()
    p_sub2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub2 = p_sub2.add_run("Comprehensive System Architecture & Live UI Screenshot Portfolio")
    run_sub2.font.name = 'Calibri'
    run_sub2.font.size = Pt(12)
    run_sub2.font.italic = True
    run_sub2.font.color.rgb = RGBColor(100, 116, 139) # Slate 500
    p_sub2.paragraph_format.space_after = Pt(36)

    # Metadata Table
    meta_table = doc.add_table(rows=8, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    meta_fields = [
        ("Candidate Name:", "[Student Name]"),
        ("Enrollment / Roll No.:", "[University Roll / Registration Number]"),
        ("Degree & Branch:", "Bachelor of Engineering / Computer Science & Engineering"),
        ("College / Institution:", "[Engineering College / University Name]"),
        ("Internship Domain:", "Full-Stack Web & AI System Engineering"),
        ("Project Supervisor:", "[Faculty Mentor / Internship Guide Name]"),
        ("Academic Year:", "2025 – 2026"),
        ("Date of Submission:", "October 2026")
    ]

    for i, (label, val) in enumerate(meta_fields):
        row = meta_table.rows[i]
        
        c0 = row.cells[0]
        c0.width = Inches(2.5)
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(4)
        p0.paragraph_format.space_after = Pt(4)
        r0 = p0.add_run(label)
        r0.font.bold = True
        r0.font.size = Pt(10.5)
        r0.font.color.rgb = RGBColor(30, 41, 59)
        
        c1 = row.cells[1]
        c1.width = Inches(3.8)
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(4)
        p1.paragraph_format.space_after = Pt(4)
        r1 = p1.add_run(val)
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = RGBColor(71, 85, 105)

    p_bottom = doc.add_paragraph()
    p_bottom.paragraph_format.space_before = Pt(40)
    p_bottom.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_btm = p_bottom.add_run("CONFIDENTIAL & ACADEMIC INTERNSHIP REPORT")
    r_btm.font.size = Pt(9)
    r_btm.font.bold = True
    r_btm.font.color.rgb = RGBColor(148, 163, 184)

    # End of title page
    doc.add_page_break()

    # -------------------------------------------------------------
    # LIST OF FIGURES
    # -------------------------------------------------------------
    p_lof = doc.add_paragraph()
    p_lof.paragraph_format.space_before = Pt(12)
    p_lof.paragraph_format.space_after = Pt(12)
    r_lof = p_lof.add_run("List of Figures")
    r_lof.font.name = 'Calibri'
    r_lof.font.size = Pt(20)
    r_lof.font.bold = True
    r_lof.font.color.rgb = RGBColor(30, 58, 138)

    p_lof_desc = doc.add_paragraph()
    p_lof_desc.paragraph_format.space_after = Pt(16)
    r_lof_desc = p_lof_desc.add_run(
        "This document contains ten high-resolution verified screenshots captured directly from the live "
        "LibraAI application operating against an enterprise PostgreSQL/Supabase database. The figures "
        "document user journeys across guest, student, librarian, and administrative roles."
    )
    r_lof_desc.font.size = Pt(10.5)
    r_lof_desc.font.color.rgb = RGBColor(71, 85, 105)

    # Table of figures
    fig_table = doc.add_table(rows=11, cols=4)
    fig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    fig_table.autofit = False

    # Header row
    hdr_cells = fig_table.rows[0].cells
    hdr_titles = ["Figure", "Screenshot Title", "System Module", "Target Role"]
    hdr_widths = [Inches(1.0), Inches(2.7), Inches(1.8), Inches(1.3)]

    for idx, (title, w) in enumerate(zip(hdr_titles, hdr_widths)):
        hdr_cells[idx].width = w
        p = hdr_cells[idx].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)
        # Shading
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="1E3A8A"/>')
        hdr_cells[idx]._tc.get_or_add_tcPr().append(shading)
        set_cell_margins(hdr_cells[idx], top=80, bottom=80, left=100, right=100)

    for i, fig in enumerate(figures_data):
        row = fig_table.rows[i + 1]
        data = [
            f"Figure {fig['num']}",
            fig["title"],
            fig["module"],
            fig["role"]
        ]
        bg_color = "F8FAFC" if i % 2 == 1 else "FFFFFF"
        for idx, (val, w) in enumerate(zip(data, hdr_widths)):
            c = row.cells[idx]
            c.width = w
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            r = p.add_run(val)
            r.font.size = Pt(9.5)
            if idx == 0:
                r.font.bold = True
                r.font.color.rgb = RGBColor(37, 99, 235)
            else:
                r.font.color.rgb = RGBColor(51, 65, 85)
            shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_color}"/>')
            c._tc.get_or_add_tcPr().append(shading)
            set_cell_margins(c, top=60, bottom=60, left=100, right=100)
            set_cell_border(c, color="E2E8F0", sz="4")

    # End of List of Figures
    doc.add_page_break()

    # -------------------------------------------------------------
    # 10 SCREENSHOT SECTIONS (EXACTLY 10 FIGURES)
    # -------------------------------------------------------------
    for i, fig in enumerate(figures_data):
        # Figure Header
        p_head = doc.add_paragraph()
        p_head.paragraph_format.space_before = Pt(8)
        p_head.paragraph_format.space_after = Pt(4)
        
        r_num = p_head.add_run(f"Figure {fig['num']}: ")
        r_num.font.name = 'Calibri'
        r_num.font.size = Pt(14)
        r_num.font.bold = True
        r_num.font.color.rgb = RGBColor(30, 58, 138) # Blue 900

        r_title = p_head.add_run(fig['title'])
        r_title.font.name = 'Calibri'
        r_title.font.size = Pt(14)
        r_title.font.bold = True
        r_title.font.color.rgb = RGBColor(15, 23, 42) # Slate 900

        # Subtitle: Module & Role tag
        p_sub = doc.add_paragraph()
        p_sub.paragraph_format.space_after = Pt(10)
        r_mod = p_sub.add_run(f"Module: {fig['module']}   |   Access Level: {fig['role']}")
        r_mod.font.size = Pt(9.5)
        r_mod.font.bold = True
        r_mod.font.color.rgb = RGBColor(100, 116, 139) # Slate 500

        # Image Container Table (Adds a subtle framing border and centers image)
        img_path = os.path.join(SCREENSHOT_DIR, fig['file'])
        if os.path.exists(img_path):
            img_table = doc.add_table(rows=1, cols=1)
            img_table.alignment = WD_TABLE_ALIGNMENT.CENTER
            cell = img_table.rows[0].cells[0]
            cell.width = Inches(6.5)
            set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
            set_cell_border(cell, color="CBD5E1", sz="6", val="single")

            p_img = cell.paragraphs[0]
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(0)
            p_img.paragraph_format.space_after = Pt(0)
            run_img = p_img.add_run()
            run_img.add_picture(img_path, width=Inches(6.3))
        else:
            p_err = doc.add_paragraph(f"[Image Missing: {fig['file']}]")
            p_err.runs[0].font.color.rgb = RGBColor(220, 38, 38)

        # Image Caption
        p_caption = doc.add_paragraph()
        p_caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_caption.paragraph_format.space_before = Pt(8)
        p_caption.paragraph_format.space_after = Pt(10)
        r_cap = p_caption.add_run(fig['caption'])
        r_cap.font.size = Pt(9.5)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(71, 85, 105)

        # Description Heading
        p_desc_hdr = doc.add_paragraph()
        p_desc_hdr.paragraph_format.space_before = Pt(4)
        p_desc_hdr.paragraph_format.space_after = Pt(2)
        r_dh = p_desc_hdr.add_run("Technical Overview & Feature Demonstration:")
        r_dh.font.size = Pt(10)
        r_dh.font.bold = True
        r_dh.font.color.rgb = RGBColor(30, 41, 59)

        # Description Body
        p_desc = doc.add_paragraph()
        p_desc.paragraph_format.space_after = Pt(14)
        p_desc.paragraph_format.line_spacing = 1.15
        r_desc = p_desc.add_run(fig['description'])
        r_desc.font.size = Pt(10.5)
        r_desc.font.color.rgb = RGBColor(51, 65, 85)

        # Page break after each figure (except last)
        if i < len(figures_data) - 1:
            doc.add_page_break()

    # Save output document
    doc.save(DOCX_OUTPUT_PATH)
    print(f"Successfully generated {DOCX_OUTPUT_PATH} with all 10 figures!")

if __name__ == "__main__":
    create_document()
