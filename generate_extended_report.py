import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_OUTPUT_PATH = r"D:\libarr\LibraAI_Short_Report.docx"
PDF_OUTPUT_PATH = r"D:\libarr\LibraAI_Short_Report.pdf"

def set_cell_margins(cell, top=40, bottom=40, left=70, right=70):
    """Set inner cell padding in dxa."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_border(cell, color="9CA3AF", sz="4", val="single"):
    """Set subtle border around table cells."""
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

def add_footer_page_number(run):
    """Add dynamic page number field to footer."""
    fldSimple = OxmlElement('w:fldSimple')
    fldSimple.set(qn('w:instr'), 'PAGE')
    run._r.append(fldSimple)

def generate_extended_report():
    doc = Document()

    # Page Setup: A4 standard bound margins (Left 2.8cm, Right 2.0cm, Top 2.0cm, Bottom 2.0cm)
    for section in doc.sections:
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(2.8)
        section.right_margin = Cm(2.0)

        # Footer with centered page number
        footer = section.footer
        p_foot = footer.paragraphs[0]
        p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_foot_label = p_foot.add_run("Page ")
        r_foot_label.font.name = "Times New Roman"
        r_foot_label.font.size = Pt(10)
        add_footer_page_number(p_foot.add_run())

    # Default Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(3)

    # -------------------------------------------------------------
    # CHAPTER HEADING
    # -------------------------------------------------------------
    p_chap = doc.add_paragraph()
    p_chap.paragraph_format.space_before = Pt(0)
    p_chap.paragraph_format.space_after = Pt(6)
    p_chap.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r_chap = p_chap.add_run("Chapter 11: Short Report / Description of the Project")
    r_chap.font.name = "Times New Roman"
    r_chap.font.size = Pt(15)
    r_chap.font.bold = True

    # -------------------------------------------------------------
    # 11.1 PROJECT TITLE & TECHNOLOGICAL STACK
    # -------------------------------------------------------------
    p_s1 = doc.add_paragraph()
    p_s1.paragraph_format.space_before = Pt(6)
    p_s1.paragraph_format.space_after = Pt(2)
    r_s1 = p_s1.add_run("11.1 Project Title")
    r_s1.font.name = "Times New Roman"
    r_s1.font.size = Pt(12.5)
    r_s1.font.bold = True

    p_t = doc.add_paragraph()
    p_t.paragraph_format.space_after = Pt(3)
    r_tb = p_t.add_run("Project Name: ")
    r_tb.font.bold = True
    p_t.add_run("LibraAI – AI-Based Institutional Library Management System")

    p_tech_hdr = doc.add_paragraph()
    p_tech_hdr.paragraph_format.space_after = Pt(2)
    r_th = p_tech_hdr.add_run("Languages / Technologies Used:")
    r_th.font.bold = True

    tech_items = [
        "Frontend Tier: React 19, TypeScript 5.7, Vite 6.2, Tailwind CSS 3.4, Lucide React icons, Recharts 2.15 data visualization suite, Zustand state management, Axios HTTP client, HTML5-QRCode optical scanner library.",
        "Backend Tier: Node.js runtime environment, Express 4.21 web framework, TypeScript 5.7, Prisma ORM 6.4, Zod schema validation, JSON Web Tokens (jsonwebtoken 9.0), bcryptjs password hashing, Multer multipart handler, xlsx spreadsheet parser, pdf-parse text extraction engine.",
        "Database Infrastructure: PostgreSQL 15 relational database hosted on Supabase Cloud, featuring PgBouncer connection pooling, foreign key constraints, composite unique indexes, and B-tree index optimizations.",
        "AI & Intelligence Services: OpenRouter API integrating Google Gemini 2.5 Flash / Flash Lite Large Language Models, custom TF-IDF semantic vector similarity matching, and SHA-256 prompt response caching (AICache)."
    ]

    for idx, item in enumerate(tech_items, 1):
        p_item = doc.add_paragraph()
        p_item.paragraph_format.left_indent = Inches(0.25)
        p_item.paragraph_format.space_after = Pt(2)
        r_num = p_item.add_run(f"{idx}. ")
        r_num.font.bold = True
        p_item.add_run(item)

    # -------------------------------------------------------------
    # 11.2 PROJECT OVERVIEW
    # -------------------------------------------------------------
    p_s2 = doc.add_paragraph()
    p_s2.paragraph_format.space_before = Pt(6)
    p_s2.paragraph_format.space_after = Pt(2)
    r_s2 = p_s2.add_run("11.2 Project Overview")
    r_s2.font.name = "Times New Roman"
    r_s2.font.size = Pt(12.5)
    r_s2.font.bold = True

    overview_bullets = [
        ("Objective: ", "To modernize and centralize higher education library operations by replacing error-prone manual ledgers and isolated spreadsheets with an automated, role-based cloud platform integrated with conversational AI study assistants and real-time business intelligence analytics."),
        ("System Architecture: ", "A decoupled three-tier client-server architecture. The presentation layer (React SPA) dispatches authenticated HTTPS/JSON requests with Bearer JWT headers to the Express application server, which executes business logic and interfaces with a Supabase-managed PostgreSQL database via Prisma ORM."),
        ("Key Features: ", "Granular 4-tier Role-Based Access Control (Student, Faculty, Librarian, Administrator); an institutional catalog holding 2,299 normalized titles and 8,246 physical copies imported via Excel; barcode-driven rapid circulation (issue, return, renewal, reservation); automated overdue fine calculation (₹5/day); interactive 22-chart Recharts analytics dashboard; LibraBot LLM study assistant; syllabus-to-book matcher; real-time reading hall seat reservation; and cryptographic SHA-256 activity audit logging."),
        ("Functional Modules: ", "Guest & Student Discovery Portal, Faculty Curriculum Shelf, Librarian Circulation Desk, Administrative Control Hub, AI Semantic Services & Study Assistant, and Executive Analytics & Reporting Module.")
    ]

    for label, text in overview_bullets:
        p_b = doc.add_paragraph()
        p_b.paragraph_format.left_indent = Inches(0.25)
        p_b.paragraph_format.space_after = Pt(2.5)
        p_b.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_lbl = p_b.add_run(f"• {label}")
        r_lbl.font.bold = True
        p_b.add_run(text)

    # -------------------------------------------------------------
    # 11.3 PROBLEM STATEMENT
    # -------------------------------------------------------------
    p_s3 = doc.add_paragraph()
    p_s3.paragraph_format.space_before = Pt(6)
    p_s3.paragraph_format.space_after = Pt(2)
    r_s3 = p_s3.add_run("11.3 Problem Statement")
    r_s3.font.name = "Times New Roman"
    r_s3.font.size = Pt(12.5)
    r_s3.font.bold = True

    p_prob = doc.add_paragraph()
    p_prob.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_prob.paragraph_format.space_after = Pt(4)
    p_prob.add_run(
        "Academic institutions frequently struggle with outdated, manual library administration systems or fragmented spreadsheet trackers. In such legacy environments, locating physical textbooks across vast campus collections requires laborious physical searches, while manual record-keeping leads to unrecorded loans, misplaced inventory, and overlooked overdue fines. Library administrators lack real-time visibility into collection turnover, seat occupancy, and department-wise demand trends. Furthermore, students receive no intelligent study support, personalized reading recommendations, or rapid syllabus alignment. A centralized, cloud-hosted, and AI-enabled library management system is required to eliminate operational inefficiencies, enforce strict audit trails, and elevate academic research capabilities."
    )

    # -------------------------------------------------------------
    # 11.4 EXISTING SYSTEM VS PROPOSED SYSTEM
    # -------------------------------------------------------------
    p_s4 = doc.add_paragraph()
    p_s4.paragraph_format.space_before = Pt(6)
    p_s4.paragraph_format.space_after = Pt(3)
    r_s4 = p_s4.add_run("11.4 Existing System vs Proposed System")
    r_s4.font.name = "Times New Roman"
    r_s4.font.size = Pt(12.5)
    r_s4.font.bold = True

    t1_data = [
        ("Catalog Discovery", "Paper index cards or static Excel files; slow manual keyword lookups.", "Instant multi-attribute & semantic vector search across 8,246 physical copies."),
        ("Circulation Processing", "Handwritten ledger entries prone to human transcription errors.", "Barcode-driven rapid circulation with automated status and inventory validation."),
        ("Due Dates & Fines", "Manual date calculation; overdue returns frequently missed.", "Automated 14-day tracking with programmatic fine calculation (₹5/day)."),
        ("Reports & Analytics", "Tedious end-of-semester tallying; no graphical trend charts.", "Live 22-chart Recharts dashboard showing footfall and category distributions."),
        ("Security & RBAC", "Shared spreadsheets with zero access restrictions or audit logs.", "Secure JWT tokens, bcrypt password hashing, and 4-tier granular RBAC."),
        ("Accessibility", "Restricted strictly to on-premise physical library hours.", "24/7 web access across desktop and mobile devices via cloud PostgreSQL."),
        ("Student Assistance", "Dependent on staff availability; no study guidance tools.", "24/7 LibraBot AI chatbot, syllabus matcher, and PDF study summaries."),
        ("Facility Management", "Unmonitored reading halls; no seat reservation records.", "Interactive digital seat booking with live zone occupancy tracking.")
    ]

    t1 = doc.add_table(rows=len(t1_data) + 1, cols=3)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    t1.autofit = False

    t1_widths = [Cm(3.2), Cm(6.4), Cm(6.6)]
    hdr1 = t1.rows[0].cells
    hdr1_titles = ["Aspect", "Existing (Manual / Spreadsheet) Approach", "Proposed System (LibraAI)"]
    for idx, (title, w) in enumerate(zip(hdr1_titles, t1_widths)):
        hdr1[idx].width = w
        p = hdr1[idx].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.5)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="E5E7EB"/>')
        hdr1[idx]._tc.get_or_add_tcPr().append(shd)
        set_cell_margins(hdr1[idx], top=30, bottom=30, left=50, right=50)
        set_cell_border(hdr1[idx], color="9CA3AF", sz="4")

    for r_idx, (asp, ext, prp) in enumerate(t1_data):
        row = t1.rows[r_idx + 1]
        for c_idx, (val, w) in enumerate(zip([asp, ext, prp], t1_widths)):
            c = row.cells[c_idx]
            c.width = w
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(1.5)
            p.paragraph_format.space_after = Pt(1.5)
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if c_idx == 0:
                r.font.bold = True
            set_cell_margins(c, top=25, bottom=25, left=45, right=45)
            set_cell_border(c, color="D1D5DB", sz="4")

    p_cap1 = doc.add_paragraph()
    p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap1.paragraph_format.space_before = Pt(2)
    p_cap1.paragraph_format.space_after = Pt(6)
    r_c1 = p_cap1.add_run("Table 11.1 - Comparison of systems")
    r_c1.font.italic = True
    r_c1.font.size = Pt(9.5)

    # -------------------------------------------------------------
    # 11.5 SYSTEM ARCHITECTURE & DATA FLOW
    # -------------------------------------------------------------
    p_s5 = doc.add_paragraph()
    p_s5.paragraph_format.space_before = Pt(6)
    p_s5.paragraph_format.space_after = Pt(2)
    r_s5 = p_s5.add_run("11.5 System Architecture")
    r_s5.font.name = "Times New Roman"
    r_s5.font.size = Pt(12.5)
    r_s5.font.bold = True

    p_arch = doc.add_paragraph()
    p_arch.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_arch.paragraph_format.space_after = Pt(3)
    p_arch.add_run(
        "LibraAI is built upon a layered three-tier architectural paradigm designed for scalability, security, and high maintainability. The client-side Single Page Application (SPA) dispatches asynchronous HTTPS requests carrying JSON payloads and Bearer JWT authorization tokens to the Express application tier. The backend router layer enforces strict authentication and role-based authorization filters before delegating requests to controller services. Data access operations are executed through Prisma ORM, which generates type-safe SQL queries against the cloud PostgreSQL database. For intelligent services, the backend dispatches contextual prompts to OpenRouter LLM endpoints, utilizing SHA-256 database caching to minimize latency and API overhead."
    )

    t2_data = [
        ("Presentation Layer", "User interfaces, responsive Recharts visualization, barcode scanning, client routing.", "React 19, TypeScript, Vite 6, Tailwind CSS, Axios"),
        ("Application Tier", "RESTful routing, JWT authentication, RBAC middleware, business logic, fine engine.", "Node.js, Express 4.21, TypeScript, Zod, bcryptjs"),
        ("Data Access Layer", "Type-safe database abstraction, connection pooling, schema migrations.", "Prisma ORM 6.4 Client & Query Engine"),
        ("Data Storage Tier", "Relational persistence, ACID transactions, foreign keys, B-tree indexes.", "PostgreSQL 15 (Supabase Cloud Database)"),
        ("AI & Intelligence", "Conversational Q&A, semantic search, syllabus matching, Ask-the-Book RAG.", "OpenRouter API (Gemini 2.5 Flash), SHA-256 AICache")
    ]

    t2 = doc.add_table(rows=len(t2_data) + 1, cols=3)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t2.autofit = False

    t2_widths = [Cm(3.4), Cm(7.8), Cm(5.0)]
    hdr2 = t2.rows[0].cells
    hdr2_titles = ["Architecture Layer", "Primary Responsibilities", "Technologies Used"]
    for idx, (title, w) in enumerate(zip(hdr2_titles, t2_widths)):
        hdr2[idx].width = w
        p = hdr2[idx].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.5)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="E5E7EB"/>')
        hdr2[idx]._tc.get_or_add_tcPr().append(shd)
        set_cell_margins(hdr2[idx], top=30, bottom=30, left=50, right=50)
        set_cell_border(hdr2[idx], color="9CA3AF", sz="4")

    for r_idx, (lay, resp, tech) in enumerate(t2_data):
        row = t2.rows[r_idx + 1]
        for c_idx, (val, w) in enumerate(zip([lay, resp, tech], t2_widths)):
            c = row.cells[c_idx]
            c.width = w
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(1.5)
            p.paragraph_format.space_after = Pt(1.5)
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if c_idx == 0:
                r.font.bold = True
            set_cell_margins(c, top=25, bottom=25, left=45, right=45)
            set_cell_border(c, color="D1D5DB", sz="4")

    p_cap2 = doc.add_paragraph()
    p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap2.paragraph_format.space_before = Pt(2)
    p_cap2.paragraph_format.space_after = Pt(6)
    r_c2 = p_cap2.add_run("Table 11.2 - Three-tier breakdown")
    r_c2.font.italic = True
    r_c2.font.size = Pt(9.5)

    # -------------------------------------------------------------
    # 11.6 MODULE DESCRIPTION
    # -------------------------------------------------------------
    p_s6 = doc.add_paragraph()
    p_s6.paragraph_format.space_before = Pt(6)
    p_s6.paragraph_format.space_after = Pt(2)
    r_s6 = p_s6.add_run("11.6 Module Description")
    r_s6.font.name = "Times New Roman"
    r_s6.font.size = Pt(12.5)
    r_s6.font.bold = True

    modules = [
        ("Authentication & Access Control Module: ", "Manages user registration, credential verification, bcrypt password hashing, and JWT session lifecycle. Enforces 4-tier Role-Based Access Control (Student, Faculty, Librarian, Administrator) across all protected frontend routes and backend REST endpoints."),
        ("Catalog & Inventory Management Module: ", "Maintains the institutional repository of 2,299 normalized titles and 8,246 physical copies with unique barcodes (e.g. D-1 to D-8246) and physical rack locators (A1–C4). Supports bulk Excel inventory ingestion, multi-attribute filtering, and real-time copy availability tracking."),
        ("Circulation & Fine Management Module: ", "Handles automated checkout, return, renewal, and reservation workflows. Automatically computes 14-day due dates, tracks overdue loans, applies programmatic penalties at ₹5/day upon return validation, and supports librarian fee waivers with audit logs."),
        ("AI Study Assistant & Semantic Search Module: ", "Integrates Google Gemini 2.5 Flash via OpenRouter for conversational academic Q&A, TF-IDF semantic book search, automated syllabus-to-textbook matching, and PDF study summary generation with SHA-256 response caching."),
        ("Analytics & Business Intelligence Module: ", "Aggregates transactional database records into 22 interactive Recharts visualizations, displaying 30-day footfall curves, category holding donuts, top borrowed titles, peak hourly traffic heatmaps, and reading hall seat occupancy."),
        ("Administrative Governance & Cryptographic Audit Module: ", "Provides administrators with account provisioning tools, privilege assignment, 99.98% SLA telemetry monitoring, and a tamper-evident SHA-256 hash-chained activity ledger recording every critical system action.")
    ]

    for mod_title, mod_desc in modules:
        p_m = doc.add_paragraph()
        p_m.paragraph_format.left_indent = Inches(0.2)
        p_m.paragraph_format.space_after = Pt(2)
        p_m.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_mt = p_m.add_run(f"• {mod_title}")
        r_mt.font.bold = True
        p_m.add_run(mod_desc)

    # -------------------------------------------------------------
    # 11.7 DATABASE DESIGN & DATA MODELING
    # -------------------------------------------------------------
    p_s7 = doc.add_paragraph()
    p_s7.paragraph_format.space_before = Pt(6)
    p_s7.paragraph_format.space_after = Pt(2)
    r_s7 = p_s7.add_run("11.7 Database Design")
    r_s7.font.name = "Times New Roman"
    r_s7.font.size = Pt(12.5)
    r_s7.font.bold = True

    p_db_desc = doc.add_paragraph()
    p_db_desc.paragraph_format.space_after = Pt(3)
    p_db_desc.add_run(
        "The relational database schema is normalized to Third Normal Form (3NF) to eliminate data redundancy and preserve referential integrity. Deployed on Supabase PostgreSQL, it features foreign key cascading, unique constraints, and B-tree indexes on frequently queried search attributes."
    )

    t3_data = [
        ("User", "id (PK), memberId (UQ), email (UQ), passwordHash, role, department, status", "Stores member credentials and 4-tier RBAC authorization flags."),
        ("Book", "id (PK), title, author, isbn, department, resourceType, embedding", "Maintains normalized academic title records and vector embeddings."),
        ("BookCopy", "id (PK), bookId (FK), barcode (UQ), location, shelfNumber, status", "Tracks physical copy inventory mapped to library rack coordinates."),
        ("IssueRecord", "id (PK), bookCopyId (FK), userId (FK), issuedDate, dueDate, status", "Records active loans, return timestamps, and renewal counters."),
        ("Fine", "id (PK), issueRecordId (FK), userId (FK), amount, daysOverdue, status", "Audits overdue financial penalties assessed during book return."),
        ("Reservation", "id (PK), bookId (FK), userId (FK), queuePosition, status", "Manages patron book hold queues with priority scoring."),
        ("SeatBooking", "id (PK), userId (FK), seatCode, roomType, startTime, endTime, status", "Tracks reading hall and digital lab reservations in real time."),
        ("ActivityLog", "id (PK), userId (FK), action, details, currentHash, previousHash", "Provides a tamper-evident SHA-256 cryptographic audit trail.")
    ]

    t3 = doc.add_table(rows=len(t3_data) + 1, cols=3)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    t3.autofit = False

    t3_widths = [Cm(2.6), Cm(8.6), Cm(5.0)]
    hdr3 = t3.rows[0].cells
    hdr3_titles = ["Table Name", "Important Columns & Constraints", "Functional Purpose"]
    for idx, (title, w) in enumerate(zip(hdr3_titles, t3_widths)):
        hdr3[idx].width = w
        p = hdr3[idx].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.5)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="E5E7EB"/>')
        hdr3[idx]._tc.get_or_add_tcPr().append(shd)
        set_cell_margins(hdr3[idx], top=30, bottom=30, left=50, right=50)
        set_cell_border(hdr3[idx], color="9CA3AF", sz="4")

    for r_idx, (tbl, cols, purp) in enumerate(t3_data):
        row = t3.rows[r_idx + 1]
        for c_idx, (val, w) in enumerate(zip([tbl, cols, purp], t3_widths)):
            c = row.cells[c_idx]
            c.width = w
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(1.5)
            p.paragraph_format.space_after = Pt(1.5)
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            if c_idx == 0:
                r.font.bold = True
            set_cell_margins(c, top=20, bottom=20, left=45, right=45)
            set_cell_border(c, color="D1D5DB", sz="4")

    p_cap3 = doc.add_paragraph()
    p_cap3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap3.paragraph_format.space_before = Pt(2)
    p_cap3.paragraph_format.space_after = Pt(4)
    r_c3 = p_cap3.add_run("Table 11.3 - Database tables")
    r_c3.font.italic = True
    r_c3.font.size = Pt(9.5)

    # Listing Code block
    code_sql = (
        "CREATE TABLE \"IssueRecord\" (\n"
        "    \"id\"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),\n"
        "    \"bookCopyId\"   TEXT NOT NULL REFERENCES \"BookCopy\"(\"id\") ON DELETE RESTRICT,\n"
        "    \"userId\"       TEXT NOT NULL REFERENCES \"User\"(\"id\") ON DELETE CASCADE,\n"
        "    \"issuedDate\"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n"
        "    \"dueDate\"      TIMESTAMP(3) NOT NULL,\n"
        "    \"returnedDate\" TIMESTAMP(3),\n"
        "    \"renewCount\"   INTEGER NOT NULL DEFAULT 0,\n"
        "    \"status\"       TEXT NOT NULL DEFAULT 'ACTIVE',\n"
        "    \"issuedBy\"     TEXT,\n"
        "    \"createdAt\"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n"
        "    \"updatedAt\"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP\n"
        ");"
    )

    t_code = doc.add_table(rows=1, cols=1)
    t_code.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_code.autofit = False
    c_code = t_code.rows[0].cells[0]
    c_code.width = Cm(16.2)
    shd_code = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F3F4F6"/>')
    c_code._tc.get_or_add_tcPr().append(shd_code)
    set_cell_margins(c_code, top=30, bottom=30, left=70, right=70)
    set_cell_border(c_code, color="CBD5E1", sz="4")

    p_code = c_code.paragraphs[0]
    p_code.paragraph_format.space_before = Pt(0)
    p_code.paragraph_format.space_after = Pt(0)
    p_code.paragraph_format.line_spacing = 1.0
    r_code = p_code.add_run(code_sql)
    r_code.font.name = "Courier New"
    r_code.font.size = Pt(8.0)
    r_code.font.color.rgb = RGBColor(17, 24, 39)

    p_cap_lst = doc.add_paragraph()
    p_cap_lst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap_lst.paragraph_format.space_before = Pt(2)
    p_cap_lst.paragraph_format.space_after = Pt(4)
    r_cl = p_cap_lst.add_run("Listing 11.1 - IssueRecord table definition")
    r_cl.font.italic = True
    r_cl.font.size = Pt(9.5)

    # Relationships line
    p_rel = doc.add_paragraph()
    p_rel.paragraph_format.space_before = Pt(2)
    p_rel.paragraph_format.space_after = Pt(4)
    r_rel_lbl = p_rel.add_run("Key Entity Relationships: ")
    r_rel_lbl.font.bold = True
    r_rel_lbl.font.size = Pt(9.5)
    r_rel = p_rel.add_run(
        "User (1:N) IssueRecord, Book (1:N) BookCopy, BookCopy (1:N) IssueRecord, IssueRecord (1:N) Fine, User (1:N) Reservation, User (1:N) SeatBooking."
    )
    r_rel.font.size = Pt(9.5)

    # -------------------------------------------------------------
    # 11.8 REST API ENDPOINTS & INTEGRATION
    # -------------------------------------------------------------
    p_s8 = doc.add_paragraph()
    p_s8.paragraph_format.space_before = Pt(6)
    p_s8.paragraph_format.space_after = Pt(2)
    r_s8 = p_s8.add_run("11.8 REST API Endpoints & Integration")
    r_s8.font.name = "Times New Roman"
    r_s8.font.size = Pt(12.5)
    r_s8.font.bold = True

    p_api_desc = doc.add_paragraph()
    p_api_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_api_desc.paragraph_format.space_after = Pt(3)
    p_api_desc.add_run(
        "The Express backend exposes a comprehensive suite of RESTful endpoints adhering to standard HTTP verbs and JSON serialization. Every endpoint is protected by JWT authentication middleware and validated against declarative Zod schemas."
    )

    t4_data = [
        ("POST /api/auth/login", "Public", "Authenticates member credentials and issues signed JWT bearer tokens."),
        ("GET /api/auth/me", "All Roles", "Fetches authenticated profile, active loans count, and reading streak metrics."),
        ("GET /api/books", "Public", "Retrieves paginated catalog titles with multi-filter and keyword parameters."),
        ("POST /api/books/import-excel", "Admin", "Parses multipart Excel workbook to bulk insert titles and physical copies."),
        ("POST /api/issues/issue", "Librarian / Admin", "Executes book checkout, verifies eligibility, and assigns 14-day due date."),
        ("POST /api/issues/return", "Librarian / Admin", "Validates book return, updates copy status, and assesses ₹5/day fine if overdue."),
        ("POST /api/ai/chat", "Authenticated", "Processes conversational queries with catalog-aware prompt context."),
        ("POST /api/ai/semantic-search", "Public", "Performs hybrid vector similarity and keyword search across book records."),
        ("GET /api/analytics/comprehensive", "Admin / Librarian", "Generates consolidated data series for 22 Recharts visualization components.")
    ]

    t4 = doc.add_table(rows=len(t4_data) + 1, cols=3)
    t4.alignment = WD_TABLE_ALIGNMENT.CENTER
    t4.autofit = False

    t4_widths = [Cm(5.0), Cm(3.2), Cm(8.0)]
    hdr4 = t4.rows[0].cells
    hdr4_titles = ["API Endpoint & Method", "Access Authorization", "Functional Description"]
    for idx, (title, w) in enumerate(zip(hdr4_titles, t4_widths)):
        hdr4[idx].width = w
        p = hdr4[idx].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.5)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="E5E7EB"/>')
        hdr4[idx]._tc.get_or_add_tcPr().append(shd)
        set_cell_margins(hdr4[idx], top=30, bottom=30, left=50, right=50)
        set_cell_border(hdr4[idx], color="9CA3AF", sz="4")

    for r_idx, (ep, auth, desc) in enumerate(t4_data):
        row = t4.rows[r_idx + 1]
        for c_idx, (val, w) in enumerate(zip([ep, auth, desc], t4_widths)):
            c = row.cells[c_idx]
            c.width = w
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(1.5)
            p.paragraph_format.space_after = Pt(1.5)
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            if c_idx == 0:
                r.font.bold = True
                r.font.name = "Courier New"
            set_cell_margins(c, top=20, bottom=20, left=45, right=45)
            set_cell_border(c, color="D1D5DB", sz="4")

    p_cap4 = doc.add_paragraph()
    p_cap4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap4.paragraph_format.space_before = Pt(2)
    p_cap4.paragraph_format.space_after = Pt(6)
    r_c4 = p_cap4.add_run("Table 11.4 - Core REST API endpoints")
    r_c4.font.italic = True
    r_c4.font.size = Pt(9.5)

    # -------------------------------------------------------------
    # 11.9 SECURITY, AUDITABILITY & OPTIMIZATION
    # -------------------------------------------------------------
    p_s9 = doc.add_paragraph()
    p_s9.paragraph_format.space_before = Pt(6)
    p_s9.paragraph_format.space_after = Pt(2)
    r_s9 = p_s9.add_run("11.9 Security, Auditability & Performance Optimization")
    r_s9.font.name = "Times New Roman"
    r_s9.font.size = Pt(12.5)
    r_s9.font.bold = True

    sec_bullets = [
        ("Authentication & Password Hashing: ", "User credentials are protected using bcryptjs with 10 salt rounds. Client sessions rely on HMAC-SHA256 signed JWT tokens containing member ID, expiration timestamps, and authorized role claims."),
        ("Cryptographic Audit Ledger: ", "Sensitive transactions (book checkouts, catalog imports, fee waivers) append immutable records to the ActivityLog table using SHA-256 hash chaining (currentHash = SHA256(previousHash + userId + action + timestamp)), ensuring complete non-repudiation."),
        ("Database Connection Pooling: ", "Backend services utilize PgBouncer on Supabase Cloud to maintain persistent pool connections, eliminating connection starvation during concurrent query bursts."),
        ("AI Inference Caching: ", "Prompt-response pairs are cached in the AICache table using SHA-256 prompt hashing with a 24-hour TTL, slashing redundant API calls and maintaining instantaneous sub-100ms response times.")
    ]

    for label, text in sec_bullets:
        p_b = doc.add_paragraph()
        p_b.paragraph_format.left_indent = Inches(0.2)
        p_b.paragraph_format.space_after = Pt(2)
        p_b.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_lbl = p_b.add_run(f"• {label}")
        r_lbl.font.bold = True
        p_b.add_run(text)

    # -------------------------------------------------------------
    # 11.10 CONCLUSION & PROJECT SUMMARY
    # -------------------------------------------------------------
    p_s10 = doc.add_paragraph()
    p_s10.paragraph_format.space_before = Pt(6)
    p_s10.paragraph_format.space_after = Pt(2)
    r_s10 = p_s10.add_run("11.10 Project Conclusion")
    r_s10.font.name = "Times New Roman"
    r_s10.font.size = Pt(12.5)
    r_s10.font.bold = True

    p_conc = doc.add_paragraph()
    p_conc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_conc.paragraph_format.space_after = Pt(2)
    p_conc.add_run(
        "LibraAI successfully achieves its primary objective of modernizing institutional library management through a robust, cloud-native web architecture combined with state-of-the-art generative artificial intelligence. By automating circulation desks, providing real-time Recharts visualization, and integrating conversational study assistants, the system eliminates manual administrative burdens, enforces stringent audit compliance, and elevates the academic learning experience for campus scholars."
    )

    doc.save(DOCX_OUTPUT_PATH)
    print("Extended report generated successfully.")

if __name__ == "__main__":
    generate_extended_report()
