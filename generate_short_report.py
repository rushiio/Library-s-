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

def set_cell_margins(cell, top=30, bottom=30, left=60, right=60):
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

def generate_short_report():
    doc = Document()

    # Page Setup: A4, bound margins (Left 2.5cm, Right 1.8cm, Top 1.8cm, Bottom 1.8cm)
    for section in doc.sections:
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
        section.top_margin = Cm(1.6)
        section.bottom_margin = Cm(1.6)
        section.left_margin = Cm(2.4)
        section.right_margin = Cm(1.8)

        # Footer with centered page number
        footer = section.footer
        p_foot = footer.paragraphs[0]
        p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_foot_label = p_foot.add_run("Page ")
        r_foot_label.font.name = "Times New Roman"
        r_foot_label.font.size = Pt(9.5)
        add_footer_page_number(p_foot.add_run())

    # Default Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.1
    normal_style.paragraph_format.space_after = Pt(2.5)

    # -------------------------------------------------------------
    # CHAPTER HEADING
    # -------------------------------------------------------------
    p_chap = doc.add_paragraph()
    p_chap.paragraph_format.space_before = Pt(0)
    p_chap.paragraph_format.space_after = Pt(4)
    p_chap.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r_chap = p_chap.add_run("Chapter 11: Short Report / Description of the Project")
    r_chap.font.name = "Times New Roman"
    r_chap.font.size = Pt(14)
    r_chap.font.bold = True

    # -------------------------------------------------------------
    # 11.1 PROJECT TITLE
    # -------------------------------------------------------------
    p_s1 = doc.add_paragraph()
    p_s1.paragraph_format.space_before = Pt(4)
    p_s1.paragraph_format.space_after = Pt(1.5)
    r_s1 = p_s1.add_run("11.1 Project Title")
    r_s1.font.name = "Times New Roman"
    r_s1.font.size = Pt(11.5)
    r_s1.font.bold = True

    p_t = doc.add_paragraph()
    p_t.paragraph_format.space_after = Pt(1.5)
    r_tb = p_t.add_run("Project Name: ")
    r_tb.font.bold = True
    p_t.add_run("LibraAI – AI-Based Institutional Library Management System")

    p_tech_hdr = doc.add_paragraph()
    p_tech_hdr.paragraph_format.space_after = Pt(1.5)
    r_th = p_tech_hdr.add_run("Languages / Technologies Used:")
    r_th.font.bold = True

    tech_items = [
        "Frontend: React 19, TypeScript 5.7, Vite 6.2, Tailwind CSS 3.4, Lucide React, Recharts 2.15, Zustand, Axios, HTML5-QRCode.",
        "Backend: Node.js, Express 4.21, TypeScript 5.7, Prisma ORM 6.4, Zod, JWT (jsonwebtoken 9.0), bcryptjs, Multer, xlsx, pdf-parse.",
        "Database: PostgreSQL (hosted on Supabase Cloud) with relational connection pooling and B-tree indexes.",
        "AI / Cloud Services: OpenRouter API (Google Gemini 2.5 Flash), TF-IDF semantic embeddings, SHA-256 audit ledger."
    ]

    for idx, item in enumerate(tech_items, 1):
        p_item = doc.add_paragraph()
        p_item.paragraph_format.left_indent = Inches(0.2)
        p_item.paragraph_format.space_after = Pt(1)
        r_num = p_item.add_run(f"{idx}. ")
        r_num.font.bold = True
        p_item.add_run(item)

    # -------------------------------------------------------------
    # 11.2 PROJECT OVERVIEW
    # -------------------------------------------------------------
    p_s2 = doc.add_paragraph()
    p_s2.paragraph_format.space_before = Pt(4)
    p_s2.paragraph_format.space_after = Pt(1.5)
    r_s2 = p_s2.add_run("11.2 Project Overview")
    r_s2.font.name = "Times New Roman"
    r_s2.font.size = Pt(11.5)
    r_s2.font.bold = True

    overview_bullets = [
        ("Objective: ", "To automate and centralize institutional library operations, replacing manual registers with a unified, role-based cloud platform offering AI-driven study assistance."),
        ("Architecture: ", "Three-tier client-server model where a React SPA interacts via HTTPS REST APIs with an Express backend, querying a Supabase PostgreSQL database via Prisma ORM."),
        ("Key Features: ", "Role-based JWT authentication (Student, Faculty, Librarian, Admin), searchable catalog of 2,299 titles (8,246 physical volumes) imported from Excel, barcode issue/return/renewal, automated ₹5/day fine calculations, real-time seat reservation, 22-chart Recharts analytics, and LibraBot AI assistant."),
        ("Modules: ", "Guest/Student Portal, Faculty Curriculum Shelf, Librarian Circulation Desk, Administrative Control Hub, AI Semantic Services, and Executive Analytics.")
    ]

    for label, text in overview_bullets:
        p_b = doc.add_paragraph()
        p_b.paragraph_format.left_indent = Inches(0.2)
        p_b.paragraph_format.space_after = Pt(1.5)
        p_b.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_lbl = p_b.add_run(f"• {label}")
        r_lbl.font.bold = True
        p_b.add_run(text)

    # -------------------------------------------------------------
    # 11.3 PROBLEM STATEMENT
    # -------------------------------------------------------------
    p_s3 = doc.add_paragraph()
    p_s3.paragraph_format.space_before = Pt(4)
    p_s3.paragraph_format.space_after = Pt(1.5)
    r_s3 = p_s3.add_run("11.3 Problem Statement")
    r_s3.font.name = "Times New Roman"
    r_s3.font.size = Pt(11.5)
    r_s3.font.bold = True

    p_prob = doc.add_paragraph()
    p_prob.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_prob.paragraph_format.space_after = Pt(3)
    p_prob.add_run(
        "Traditional library workflows relying on paper logbooks or static spreadsheets create severe operational bottlenecks in collegiate libraries. Manual book lookups are slow, physical copies are frequently untracked or misplaced, overdue fines are inconsistently calculated, and administrators lack real-time visibility into collection utilization. Furthermore, students receive no automated study guidance or syllabus-aligned recommendations. A secure, cloud-hosted, AI-assisted library management system is required to automate circulation, ensure audit compliance, and enhance academic productivity."
    )

    # -------------------------------------------------------------
    # 11.4 EXISTING SYSTEM VS PROPOSED SYSTEM
    # -------------------------------------------------------------
    p_s4 = doc.add_paragraph()
    p_s4.paragraph_format.space_before = Pt(4)
    p_s4.paragraph_format.space_after = Pt(2)
    r_s4 = p_s4.add_run("11.4 Existing System vs Proposed System")
    r_s4.font.name = "Times New Roman"
    r_s4.font.size = Pt(11.5)
    r_s4.font.bold = True

    t1_data = [
        ("Book Search", "Manual registers / spreadsheets; slow keyword lookup.", "Instant multi-attribute & semantic vector search across 8,246 copies."),
        ("Issue & Return", "Handwritten ledger entries prone to recording errors.", "Barcode-driven rapid circulation with live copy status updates."),
        ("Due Dates & Fines", "Manual date calculation; frequent missed collections.", "Automated 14-day tracking with programmatic fine calculation (₹5/day)."),
        ("Reports & Analytics", "Tedious manual tallying; no visual trend charts.", "Live 22-chart Recharts dashboard showing footfall and holding distributions."),
        ("Security & RBAC", "Shared spreadsheet files without privilege control.", "JWT session tokens, bcrypt password hashing, and 4-tier granular RBAC."),
        ("Accessibility", "Restricted strictly to physical counter library hours.", "24/7 web access across desktop and mobile devices via cloud database."),
        ("Student Assistance", "Dependent on staff availability; no study tools.", "24/7 LibraBot AI assistant, syllabus matcher, and PDF study summaries.")
    ]

    t1 = doc.add_table(rows=len(t1_data) + 1, cols=3)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    t1.autofit = False

    t1_widths = [Cm(3.0), Cm(6.5), Cm(7.3)]
    hdr1 = t1.rows[0].cells
    hdr1_titles = ["Aspect", "Existing (Manual) System", "Proposed System (LibraAI)"]
    for idx, (title, w) in enumerate(zip(hdr1_titles, t1_widths)):
        hdr1[idx].width = w
        p = hdr1[idx].paragraphs[0]
        p.paragraph_format.space_before = Pt(1.5)
        p.paragraph_format.space_after = Pt(1.5)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.0)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="E5E7EB"/>')
        hdr1[idx]._tc.get_or_add_tcPr().append(shd)
        set_cell_margins(hdr1[idx], top=25, bottom=25, left=40, right=40)
        set_cell_border(hdr1[idx], color="9CA3AF", sz="4")

    for r_idx, (asp, ext, prp) in enumerate(t1_data):
        row = t1.rows[r_idx + 1]
        for c_idx, (val, w) in enumerate(zip([asp, ext, prp], t1_widths)):
            c = row.cells[c_idx]
            c.width = w
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            if c_idx == 0:
                r.font.bold = True
            set_cell_margins(c, top=20, bottom=20, left=35, right=35)
            set_cell_border(c, color="D1D5DB", sz="4")

    p_cap1 = doc.add_paragraph()
    p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap1.paragraph_format.space_before = Pt(1.5)
    p_cap1.paragraph_format.space_after = Pt(5)
    r_c1 = p_cap1.add_run("Table 11.1 - Comparison of systems")
    r_c1.font.italic = True
    r_c1.font.size = Pt(9.0)

    # -------------------------------------------------------------
    # 11.5 SYSTEM ARCHITECTURE
    # -------------------------------------------------------------
    p_s5 = doc.add_paragraph()
    p_s5.paragraph_format.space_before = Pt(4)
    p_s5.paragraph_format.space_after = Pt(1.5)
    r_s5 = p_s5.add_run("11.5 System Architecture")
    r_s5.font.name = "Times New Roman"
    r_s5.font.size = Pt(11.5)
    r_s5.font.bold = True

    p_arch = doc.add_paragraph()
    p_arch.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_arch.paragraph_format.space_after = Pt(2.5)
    p_arch.add_run(
        "LibraAI employs a three-tier client-server architecture: Browser (React SPA) > HTTPS/JSON REST API > Express Application Server > Prisma ORM > Supabase PostgreSQL Database, with OpenRouter AI models invoked asynchronously from backend services."
    )

    t2_data = [
        ("Presentation Tier", "User interfaces, responsive Recharts visualization, barcode scanner.", "React 19, Vite 6, Tailwind CSS, Axios"),
        ("Application Tier", "REST API endpoints, JWT auth, RBAC middleware, fine computation.", "Node.js, Express 4.21, TypeScript, Zod"),
        ("Data Access Tier", "Type-safe database abstraction, migrations, query pooling.", "Prisma ORM 6.4 Client"),
        ("Database Tier", "Relational persistence, ACID transactions, foreign key constraints.", "PostgreSQL 15 (Supabase Cloud)"),
        ("AI & Intelligence", "Conversational Q&A, syllabus matching, Ask-the-Book RAG.", "OpenRouter API (Gemini 2.5 Flash), AICache")
    ]

    t2 = doc.add_table(rows=len(t2_data) + 1, cols=3)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t2.autofit = False

    t2_widths = [Cm(3.2), Cm(8.6), Cm(5.0)]
    hdr2 = t2.rows[0].cells
    hdr2_titles = ["Layer", "Key Responsibilities", "Technologies Used"]
    for idx, (title, w) in enumerate(zip(hdr2_titles, t2_widths)):
        hdr2[idx].width = w
        p = hdr2[idx].paragraphs[0]
        p.paragraph_format.space_before = Pt(1.5)
        p.paragraph_format.space_after = Pt(1.5)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.0)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="E5E7EB"/>')
        hdr2[idx]._tc.get_or_add_tcPr().append(shd)
        set_cell_margins(hdr2[idx], top=25, bottom=25, left=40, right=40)
        set_cell_border(hdr2[idx], color="9CA3AF", sz="4")

    for r_idx, (lay, resp, tech) in enumerate(t2_data):
        row = t2.rows[r_idx + 1]
        for c_idx, (val, w) in enumerate(zip([lay, resp, tech], t2_widths)):
            c = row.cells[c_idx]
            c.width = w
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            if c_idx == 0:
                r.font.bold = True
            set_cell_margins(c, top=20, bottom=20, left=35, right=35)
            set_cell_border(c, color="D1D5DB", sz="4")

    p_cap2 = doc.add_paragraph()
    p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap2.paragraph_format.space_before = Pt(1.5)
    p_cap2.paragraph_format.space_after = Pt(5)
    r_c2 = p_cap2.add_run("Table 11.2 - Three-tier breakdown")
    r_c2.font.italic = True
    r_c2.font.size = Pt(9.0)

    # -------------------------------------------------------------
    # 11.6 MODULE DESCRIPTION
    # -------------------------------------------------------------
    p_s6 = doc.add_paragraph()
    p_s6.paragraph_format.space_before = Pt(4)
    p_s6.paragraph_format.space_after = Pt(1.5)
    r_s6 = p_s6.add_run("11.6 Module Description")
    r_s6.font.name = "Times New Roman"
    r_s6.font.size = Pt(11.5)
    r_s6.font.bold = True

    modules = [
        ("Authentication & User Module: ", "Manages user registration, bcrypt password hashing, and role gating (Student, Faculty, Librarian, Admin) using signed JWT tokens."),
        ("Catalog & Inventory Module: ", "Maintains 2,299 normalized titles and 8,246 physical copies with barcode identifiers (D-1 to D-8246), rack locators (A1–C4), and Excel batch import."),
        ("Circulation & Fine Module: ", "Executes checkouts, returns, and renewals with automatic 14-day due date scheduling, copy status transitions, and ₹5/day fine auditing."),
        ("AI Study Assistant Module: ", "Delivers LibraBot Q&A, semantic search, syllabus matching, and PDF study summaries via Google Gemini 2.5 Flash with SHA-256 caching."),
        ("Analytics & Reporting Module: ", "Visualizes 22 Recharts graphics covering footfall curves, category holding donuts, top borrowed books, and reading hall occupancy."),
        ("Administration & Audit Module: ", "Controls user provisioning, privilege assignment, SLA telemetry monitoring, and tamper-evident SHA-256 hash-chained activity ledgers.")
    ]

    for mod_title, mod_desc in modules:
        p_m = doc.add_paragraph()
        p_m.paragraph_format.left_indent = Inches(0.2)
        p_m.paragraph_format.space_after = Pt(1.5)
        p_m.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_mt = p_m.add_run(f"• {mod_title}")
        r_mt.font.bold = True
        p_m.add_run(mod_desc)

    # -------------------------------------------------------------
    # 11.7 DATABASE DESIGN
    # -------------------------------------------------------------
    p_s7 = doc.add_paragraph()
    p_s7.paragraph_format.space_before = Pt(4)
    p_s7.paragraph_format.space_after = Pt(1.5)
    r_s7 = p_s7.add_run("11.7 Database Design")
    r_s7.font.name = "Times New Roman"
    r_s7.font.size = Pt(11.5)
    r_s7.font.bold = True

    p_db_desc = doc.add_paragraph()
    p_db_desc.paragraph_format.space_after = Pt(2.5)
    p_db_desc.add_run(
        "The relational schema is normalized to Third Normal Form (3NF) and deployed on a PostgreSQL instance on Supabase Cloud."
    )

    t3_data = [
        ("User", "id (PK), memberId (UQ), email (UQ), passwordHash, role, department, status", "Campus member accounts with RBAC flags."),
        ("Book", "id (PK), title, author, isbn, department, resourceType, embedding", "Normalized catalog title records."),
        ("BookCopy", "id (PK), bookId (FK), barcode (UQ), location, shelfNumber, status", "Physical copies mapped to library racks."),
        ("IssueRecord", "id (PK), bookCopyId (FK), userId (FK), issuedDate, dueDate, status", "Active and historical book loan records."),
        ("Fine", "id (PK), issueRecordId (FK), userId (FK), amount, daysOverdue, status", "Overdue penalties assessed at return validation."),
        ("Reservation", "id (PK), bookId (FK), userId (FK), queuePosition, status", "Patron book hold reservations queue."),
        ("SeatBooking", "id (PK), userId (FK), seatCode, roomType, startTime, endTime, status", "Reading hall and digital lab seat bookings."),
        ("ActivityLog", "id (PK), userId (FK), action, details, currentHash, previousHash", "SHA-256 cryptographic audit trail.")
    ]

    t3 = doc.add_table(rows=len(t3_data) + 1, cols=3)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    t3.autofit = False

    t3_widths = [Cm(2.5), Cm(8.8), Cm(5.5)]
    hdr3 = t3.rows[0].cells
    hdr3_titles = ["Table Name", "Important Columns & Constraints", "Functional Purpose"]
    for idx, (title, w) in enumerate(zip(hdr3_titles, t3_widths)):
        hdr3[idx].width = w
        p = hdr3[idx].paragraphs[0]
        p.paragraph_format.space_before = Pt(1.5)
        p.paragraph_format.space_after = Pt(1.5)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.0)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="E5E7EB"/>')
        hdr3[idx]._tc.get_or_add_tcPr().append(shd)
        set_cell_margins(hdr3[idx], top=25, bottom=25, left=40, right=40)
        set_cell_border(hdr3[idx], color="9CA3AF", sz="4")

    for r_idx, (tbl, cols, purp) in enumerate(t3_data):
        row = t3.rows[r_idx + 1]
        for c_idx, (val, w) in enumerate(zip([tbl, cols, purp], t3_widths)):
            c = row.cells[c_idx]
            c.width = w
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.size = Pt(7.5)
            if c_idx == 0:
                r.font.bold = True
            set_cell_margins(c, top=18, bottom=18, left=35, right=35)
            set_cell_border(c, color="D1D5DB", sz="4")

    p_cap3 = doc.add_paragraph()
    p_cap3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap3.paragraph_format.space_before = Pt(1.5)
    p_cap3.paragraph_format.space_after = Pt(3.5)
    r_c3 = p_cap3.add_run("Table 11.3 - Database tables")
    r_c3.font.italic = True
    r_c3.font.size = Pt(9.0)

    # Listing Code block
    code_sql = (
        "CREATE TABLE \"IssueRecord\" (\n"
        "    \"id\"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),\n"
        "    \"bookCopyId\"   TEXT NOT NULL REFERENCES \"BookCopy\"(\"id\"),\n"
        "    \"userId\"       TEXT NOT NULL REFERENCES \"User\"(\"id\"),\n"
        "    \"issuedDate\"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n"
        "    \"dueDate\"      TIMESTAMP(3) NOT NULL,\n"
        "    \"returnedDate\" TIMESTAMP(3),\n"
        "    \"renewCount\"   INTEGER NOT NULL DEFAULT 0,\n"
        "    \"status\"       TEXT NOT NULL DEFAULT 'ACTIVE',\n"
        "    \"issuedBy\"     TEXT,\n"
        "    \"createdAt\"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP\n"
        ");"
    )

    t_code = doc.add_table(rows=1, cols=1)
    t_code.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_code.autofit = False
    c_code = t_code.rows[0].cells[0]
    c_code.width = Cm(16.8)
    shd_code = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F3F4F6"/>')
    c_code._tc.get_or_add_tcPr().append(shd_code)
    set_cell_margins(c_code, top=25, bottom=25, left=60, right=60)
    set_cell_border(c_code, color="CBD5E1", sz="4")

    p_code = c_code.paragraphs[0]
    p_code.paragraph_format.space_before = Pt(0)
    p_code.paragraph_format.space_after = Pt(0)
    p_code.paragraph_format.line_spacing = 1.0
    r_code = p_code.add_run(code_sql)
    r_code.font.name = "Courier New"
    r_code.font.size = Pt(7.5)
    r_code.font.color.rgb = RGBColor(17, 24, 39)

    p_cap_lst = doc.add_paragraph()
    p_cap_lst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap_lst.paragraph_format.space_before = Pt(1.5)
    p_cap_lst.paragraph_format.space_after = Pt(3)
    r_cl = p_cap_lst.add_run("Listing 11.1 - IssueRecord table definition")
    r_cl.font.italic = True
    r_cl.font.size = Pt(9.0)

    # Relationships line
    p_rel = doc.add_paragraph()
    p_rel.paragraph_format.space_before = Pt(1.5)
    p_rel.paragraph_format.space_after = Pt(0)
    r_rel_lbl = p_rel.add_run("Key Entity Relationships: ")
    r_rel_lbl.font.bold = True
    r_rel_lbl.font.size = Pt(9.0)
    r_rel = p_rel.add_run(
        "User (1:N) IssueRecord, Book (1:N) BookCopy, BookCopy (1:N) IssueRecord, IssueRecord (1:N) Fine, User (1:N) Reservation, User (1:N) SeatBooking."
    )
    r_rel.font.size = Pt(9.0)

    doc.save(DOCX_OUTPUT_PATH)
    print("Report generated successfully.")

if __name__ == "__main__":
    generate_short_report()
