import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_OUTPUT_PATH = r"D:\libarr\Industrial_Training_Report_Complete.docx"
PDF_OUTPUT_PATH = r"D:\libarr\Industrial_Training_Report_Complete.pdf"

def set_cell_margins(cell, top=35, bottom=35, left=60, right=60):
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

def add_chapter_heading(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(text)
    r.font.name = "Times New Roman"
    r.font.size = Pt(15)
    r.font.bold = True
    return p

def add_section_heading(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run(text)
    r.font.name = "Times New Roman"
    r.font.size = Pt(12.5)
    r.font.bold = True
    return p

def add_body_paragraph(doc, text, bold_prefix=None, space_after=3.5, left_indent=0):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if left_indent > 0:
        p.paragraph_format.left_indent = Inches(left_indent)
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Times New Roman"
        r_pre.font.bold = True
        r_pre.font.size = Pt(11)
    r = p.add_run(text)
    r.font.name = "Times New Roman"
    r.font.size = Pt(11)
    return p

def add_table_with_caption(doc, headers, rows_data, widths, caption):
    t = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False

    hdr_cells = t.rows[0].cells
    for idx, (title, w) in enumerate(zip(headers, widths)):
        hdr_cells[idx].width = w
        p = hdr_cells[idx].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.bold = True
        r.font.size = Pt(9.5)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="E5E7EB"/>')
        hdr_cells[idx]._tc.get_or_add_tcPr().append(shd)
        set_cell_margins(hdr_cells[idx], top=35, bottom=35, left=50, right=50)
        set_cell_border(hdr_cells[idx], color="9CA3AF", sz="4")

    for r_idx, row_data in enumerate(rows_data):
        row = t.rows[r_idx + 1]
        for c_idx, (val, w) in enumerate(zip(row_data, widths)):
            c = row.cells[c_idx]
            c.width = w
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(1.5)
            p.paragraph_format.space_after = Pt(1.5)
            p.paragraph_format.line_spacing = 1.1
            r = p.add_run(val)
            r.font.name = "Times New Roman"
            r.font.size = Pt(8.5)
            if c_idx == 0:
                r.font.bold = True
            set_cell_margins(c, top=25, bottom=25, left=45, right=45)
            set_cell_border(c, color="D1D5DB", sz="4")

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(2)
    p_cap.paragraph_format.space_after = Pt(6)
    r_c = p_cap.add_run(caption)
    r_c.font.name = "Times New Roman"
    r_c.font.italic = True
    r_c.font.size = Pt(9.5)

def add_code_listing(doc, code_str, caption):
    t_code = doc.add_table(rows=1, cols=1)
    t_code.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_code.autofit = False
    c_code = t_code.rows[0].cells[0]
    c_code.width = Cm(16.2)
    shd_code = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F3F4F6"/>')
    c_code._tc.get_or_add_tcPr().append(shd_code)
    set_cell_margins(c_code, top=35, bottom=35, left=70, right=70)
    set_cell_border(c_code, color="CBD5E1", sz="4")

    p_code = c_code.paragraphs[0]
    p_code.paragraph_format.space_before = Pt(0)
    p_code.paragraph_format.space_after = Pt(0)
    p_code.paragraph_format.line_spacing = 1.05
    r_code = p_code.add_run(code_str)
    r_code.font.name = "Courier New"
    r_code.font.size = Pt(8.5)
    r_code.font.color.rgb = RGBColor(17, 24, 39)

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(2)
    p_cap.paragraph_format.space_after = Pt(6)
    r_c = p_cap.add_run(caption)
    r_c.font.name = "Times New Roman"
    r_c.font.italic = True
    r_c.font.size = Pt(9.5)

def build_complete_report():
    doc = Document()

    # Page Margins: A4, standard bound format (Left 2.8cm, Right 2.0cm, Top 2.0cm, Bottom 2.0cm)
    for section in doc.sections:
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(2.8)
        section.right_margin = Cm(2.0)

        footer = section.footer
        p_foot = footer.paragraphs[0]
        p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_foot_label = p_foot.add_run("Page ")
        r_foot_label.font.name = "Times New Roman"
        r_foot_label.font.size = Pt(10)
        add_footer_page_number(p_foot.add_run())

    # =============================================================
    # REPORT TITLE HEADER & INDEX
    # =============================================================
    p_main_title = doc.add_paragraph()
    p_main_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_main_title.paragraph_format.space_before = Pt(8)
    p_main_title.paragraph_format.space_after = Pt(2)
    r_mt = p_main_title.add_run("Industrial Training Report")
    r_mt.font.name = "Times New Roman"
    r_mt.font.size = Pt(18)
    r_mt.font.bold = True

    p_sub_title = doc.add_paragraph()
    p_sub_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub_title.paragraph_format.space_after = Pt(12)
    r_st = p_sub_title.add_run("Full-Stack Web Application Development & AI Integration Industrial Training at\nNEXONICA SYSTEMS PRIVATE LIMITED")
    r_st.font.name = "Times New Roman"
    r_st.font.size = Pt(13)
    r_st.font.bold = True
    r_st.font.color.rgb = RGBColor(51, 65, 85)

    p_idx = doc.add_paragraph()
    p_idx.paragraph_format.space_before = Pt(8)
    p_idx.paragraph_format.space_after = Pt(4)
    r_idx = p_idx.add_run("Index")
    r_idx.font.name = "Times New Roman"
    r_idx.font.size = Pt(14)
    r_idx.font.bold = True

    index_data = [
        ("01", "Organization Structure of Industry and General Layout", "1-3"),
        ("02", "Introduction to Industry / Organization", "4-5"),
        ("03", "Types of Major Equipment, Hardware, Software, Instruments and Raw Materials Used in Industry", "6-7"),
        ("04", "Processes, Development Methodologies and Material Handling Procedures", "8-9"),
        ("05", "Testing of Hardware, Software and Material Handling Procedures", "10-11"),
        ("06", "Safety Procedures Followed and Safety Gears Used", "12"),
        ("07", "Particulars of Practical Experiences in Industry / Organization", "13-15"),
        ("08", "Detailed Report of the Tasks Undertaken During the Internship", "16-18"),
        ("09", "Special / Challenging Experiences Encountered During the Internship", "19"),
        ("10", "Assignments", "20-21"),
        ("11", "Short report / Description of the project", "22-24"),
        ("12", "Experience and working in industry photos", "25-26"),
        ("13", "Conclusion", "27"),
        ("14", "References", "28-29")
    ]

    t_idx = doc.add_table(rows=len(index_data) + 1, cols=3)
    t_idx.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_idx.autofit = False

    t_idx_widths = [Cm(2.0), Cm(11.8), Cm(2.4)]
    hdr_idx = t_idx.rows[0].cells
    hdr_titles = ["Sr. No", "TITLE", "Page. No"]
    for idx, (title, w) in enumerate(zip(hdr_titles, t_idx_widths)):
        hdr_idx[idx].width = w
        p = hdr_idx[idx].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.bold = True
        r.font.size = Pt(9.5)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="E5E7EB"/>')
        hdr_idx[idx]._tc.get_or_add_tcPr().append(shd)
        set_cell_margins(hdr_idx[idx], top=35, bottom=35, left=50, right=50)
        set_cell_border(hdr_idx[idx], color="9CA3AF", sz="4")

    for r_idx, row_data in enumerate(index_data):
        row = t_idx.rows[r_idx + 1]
        for c_idx, (val, w) in enumerate(zip(row_data, t_idx_widths)):
            c = row.cells[c_idx]
            c.width = w
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(1.5)
            p.paragraph_format.space_after = Pt(1.5)
            r = p.add_run(val)
            r.font.name = "Times New Roman"
            r.font.size = Pt(9.0)
            if c_idx == 0 or c_idx == 2:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            set_cell_margins(c, top=25, bottom=25, left=45, right=45)
            set_cell_border(c, color="D1D5DB", sz="4")

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_after = Pt(12)

    # =============================================================
    # CHAPTER 1
    # =============================================================
    add_chapter_heading(doc, "Chapter 1: Organization Structure of Industry and General Layout")
    add_section_heading(doc, "1.1 Organization Structure of Nexonica Systems Private Limited")
    add_body_paragraph(doc, "Nexonica Systems Private Limited is an information technology company headquartered in Nashik, Maharashtra. The company offers software development, website and mobile application engineering, IoT, AI/ML solutions and cloud computing services, and also runs dedicated industrial internship and training programs for engineering and diploma students. Because the company works across product development and training, interns get to see both the engineering side (real client-style projects) and the mentoring side (structured learning plans).")

    t1_1_data = [
        ("Organization Name", "Nexonica Systems Private Limited"),
        ("Business Domain", "Information Technology - Software Development & Technology Solutions"),
        ("Registered Office", "F-5, Ashtvinayak Park, Thatte Nagar, College Road, Nashik, Maharashtra - 422005"),
        ("Official Website", "www.nexonica.com"),
        ("Core Focus Areas", "Full-Stack Web Development, Mobile App Development, IoT, AI/ML, Cloud Computing, R&D and Student Internship Training"),
        ("Technology Orientation", "Java, React.js, Python, Flask, Android, Angular.js, Flutter, .NET, IoT, AI/ML, Data Science")
    ]
    add_table_with_caption(doc, ["Particular", "Details"], t1_1_data, [Cm(5.0), Cm(11.2)], "Table 1.1 - Company profile")

    add_body_paragraph(doc, "Each vertical is handled by specialists, but projects frequently combine more than one vertical - for example, a web portal with an AI-based recommendation module or an IoT dashboard backed by a cloud database.", bold_prefix="Major Business Verticals of Nexonica Systems: ")

    t1_2_data = [
        ("Web Development", "Responsive websites, enterprise portals, dashboards and single-page applications.", "HTML5, CSS3, React.js, Angular.js, Flask, Java"),
        ("Mobile App Development", "Native and cross-platform applications for Android and other platforms.", "Android, Flutter"),
        ("IoT Solutions", "Connecting sensors and devices to cloud platforms and dashboards for monitoring and control.", "Embedded programming, MQTT/REST, cloud DB"),
        ("AI / ML & Data Science", "Data analysis, prediction models, and integration of intelligent features into applications.", "Python, ML libraries, REST APIs"),
        ("Cloud Computing", "Deployment, hosting and scaling of applications on cloud infrastructure.", "Cloud VMs, containers, managed databases"),
        ("Training & Internship", "Industrial training, mini-projects and capstone projects for students.", "Full-stack curriculum, Git workflows")
    ]
    add_table_with_caption(doc, ["Vertical", "Description", "Typical Technologies"], t1_2_data, [Cm(3.8), Cm(7.6), Cm(4.8)], "Table 1.2 - Business verticals of Nexonica Systems")

    add_section_heading(doc, "1.2 Leadership")
    add_body_paragraph(doc, "As per official company records, Nexonica Systems Private Limited is led by its Directors and Co-Founders, including Mr. Kanchan Prakash Ekhande. The leadership team oversees the organisation’s technical direction, client engagement, and internship and training programs. They are also involved in selecting the technology stack for new projects and shaping the internship curriculum to ensure that it reflects the skills and technologies currently demanded by the industry.")

    add_section_heading(doc, "1.3 Corporate Hierarchy & Teams")
    add_body_paragraph(doc, "The organisation follows a structured hierarchy in which strategic decisions flow from the leadership team to the project management level and then to the respective execution teams. Interns are attached to the Training & Internship Cell and work closely with developers and testers under the guidance and supervision of a technical lead. This structure ensures effective coordination, proper task allocation, technical guidance, and smooth execution of projects.")

    t1_3_data = [
        ("1", "Directors / Founding Leadership", "Provide strategic direction, oversee the overall technology vision and manage client relations."),
        ("2", "Project Management & Technical Lead", "Sprint planning, code reviews, architectural oversight and mentoring of interns."),
        ("3", "Development Team", "Full-Stack Engineers, Frontend Specialists (React/UI) and Backend Developers (Python/Flask/PostgreSQL)."),
        ("3", "Quality Assurance & Testing Team", "API testing, functional validation and deployment pipeline integrity."),
        ("4", "Training & Internship Cell", "Coordinates onboarding, task allocation and academic documentation support for student interns.")
    ]
    add_table_with_caption(doc, ["Level", "Team / Role", "Responsibility"], t1_3_data, [Cm(1.8), Cm(5.6), Cm(8.8)], "Table 1.3 - Organisational layers and responsibilities")

    add_section_heading(doc, "1.4 Training & Internship Cell")
    add_body_paragraph(doc, "The Training & Internship Cell is the unit that interacts most closely with students and interns. Its responsibilities include onboarding interns, providing a structured learning roadmap, allocating mini-tasks of increasing difficulty, scheduling review sessions with mentors, and assisting students in preparing the documentation required by their respective institutes. The cell encourages interns to follow professional work practices similar to those followed by employees, including attending stand-up meetings, committing code regularly, participating in code reviews, and responding to review comments.")

    add_section_heading(doc, "1.5 General Layout and Work Culture")
    add_body_paragraph(doc, "Interns work on developer laptops with stable broadband connectivity and use tools such as Visual Studio Code, web browsers with developer tools, PostgreSQL, pgAdmin, and Postman for development, database management, API testing, and debugging. The organisation follows an agile work routine consisting of stand-up meetings, sprint planning, reviews, and retrospectives. The following professional practices are observed:")
    
    culture_bullets = [
        ("Learning-Oriented Environment: ", "Mistakes in code are treated as learning opportunities and are discussed constructively during reviews."),
        ("Documentation Habit: ", "Each module is documented with its purpose, endpoints, functionality, and sample requests wherever required."),
        ("Transparency: ", "Progress and challenges are discussed openly during stand-up meetings so that blockers can be identified and resolved at an early stage."),
        ("Confidentiality: ", "Credentials, client information, project data, and source code are handled in accordance with company policies and security practices."),
        ("Punctuality and Ownership: ", "Each intern is expected to take responsibility for assigned tasks from understanding the requirements through development, testing, documentation, and final submission.")
    ]
    for lbl, txt in culture_bullets:
        add_body_paragraph(doc, txt, bold_prefix=lbl, space_after=2, left_indent=0.25)

    # =============================================================
    # CHAPTER 2
    # =============================================================
    add_chapter_heading(doc, "Chapter 2: Introduction to Industry / Organization")
    add_section_heading(doc, "2.1 Introduction")
    add_body_paragraph(doc, "This report documents the industrial internship undertaken at Nexonica Systems Private Limited (www.nexonica.com), Nashik, an IT company offering services in IoT, AI/ML, full-stack development, cloud services, and structured internship programs for students. The internship was designed to bridge the gap between theoretical classroom learning in diploma engineering and practical, industry-standard software development methodologies. During the internship tenure, active participation was maintained across full-stack application modules, database schema design, RESTful API development, frontend interactivity using modern component libraries, and software testing. The training exposed the intern to real-world project workflows, professional tools, and collaborative development practices followed by the organisation's engineering teams.")

    add_section_heading(doc, "2.2 Background")
    add_body_paragraph(doc, "A diploma curriculum in Computer Engineering or Information Technology covers programming fundamentals, database management, web technologies, and software engineering. However, classroom exercises are usually small, single-developer programs with limited exposure to deployment, version control, and formal testing. Industry projects, on the other hand, involve multiple layers such as the user interface, server-side logic, and database, along with multiple developers, deadlines, and strict quality expectations. The internship was therefore planned to expose the student to this complete software development environment.")

    add_section_heading(doc, "2.3 Objectives of the Internship")
    add_body_paragraph(doc, "The major objectives of the internship were:")
    objs = [
        "To understand the structure and working culture of a software company.",
        "To learn the full-stack development workflow, from requirement analysis to documentation.",
        "To design responsive user interfaces using HTML5, CSS3, and React.js.",
        "To build REST APIs using Python and Flask and connect them to a PostgreSQL database.",
        "To practise software testing using unittest for unit testing and Postman for API testing.",
        "To use Git and GitHub for branching, pull requests, and conflict resolution.",
        "To develop a capstone project that integrates the technologies and concepts learned during the internship."
    ]
    for o in objs:
        add_body_paragraph(doc, o, bold_prefix="• ", space_after=2, left_indent=0.25)

    add_section_heading(doc, "2.4 Scope of the Training")
    add_body_paragraph(doc, "The scope of the training covered the three major tiers of a typical web application. In the presentation tier, the intern worked on static pages, responsive landing pages, and React components. In the application tier, the intern developed Flask routes, blueprints, validation logic, and error-handling mechanisms. In the data tier, the intern designed PostgreSQL database schemas, used pgAdmin 4 for database inspection and management, and used Flask-SQLAlchemy for ORM-based database queries. Cross-cutting concerns such as CORS configuration, environment variables, logging, and software testing were also included in the scope of the training.")

    add_section_heading(doc, "2.5 Why Full-Stack Development?")
    add_body_paragraph(doc, "A full-stack developer understands how data moves from a user's browser to the backend and database and then returns to the user interface. This end-to-end understanding makes it easier to debug problems, design efficient APIs, and communicate effectively with both frontend and backend development teams. Python with Flask was selected for backend development because of its simplicity, flexibility, and extensive library support. Its strong ecosystem also provides a suitable foundation for future AI and machine-learning integration.")

    t2_1_data = [
        ("Frontend", "HTML5, CSS3, React.js", "Component reuse, fast UI updates, and strong community support"),
        ("Backend", "Python, Flask", "Lightweight framework, easy to learn, and extensive library support"),
        ("ORM", "Flask-SQLAlchemy", "Maps Python classes to database tables and reduces the need for raw SQL"),
        ("Database", "PostgreSQL", "ACID-compliant database supporting relationships, constraints, and JSON data"),
        ("Tools", "Postman, pgAdmin, Git", "Industry-standard tools for API testing, database management, and version control")
    ]
    add_table_with_caption(doc, ["Layer", "Technology", "Reason for Selection"], t2_1_data, [Cm(2.8), Cm(5.2), Cm(8.2)], "Table 2.1 – Technology Stack and Rationale")

    add_section_heading(doc, "2.6 Expected Learning Outcomes")
    add_body_paragraph(doc, "At the completion of the internship, the expected learning outcomes were:")
    outcomes = [
        "Ability to build a complete web application with separate frontend and backend components.",
        "Ability to design normalized database tables and write basic to intermediate SQL queries.",
        "Ability to document and test REST APIs using appropriate HTTP status codes and JSON responses.",
        "Familiarity with agile ceremonies, code reviews, and feature-branch workflows.",
        "Improved communication, time management, problem-solving, and teamwork skills."
    ]
    for oc in outcomes:
        add_body_paragraph(doc, oc, bold_prefix="• ", space_after=2, left_indent=0.25)

    add_section_heading(doc, "2.7 Internship Details")
    t2_2_data = [
        ("Company", "Nexonica Systems Private Limited, Nashik"),
        ("Domain", "Full-Stack Development (Python, Flask, React.js, PostgreSQL)"),
        ("Duration", "[1 June 2026] to [End Date]"),
        ("Mode", "Offline"),
        ("Mentor / Guide", "[Mentor Name]"),
        ("Academic Year", "2025–2026")
    ]
    add_table_with_caption(doc, ["Item", "Details"], t2_2_data, [Cm(5.0), Cm(11.2)], "Table 2.2 – Internship Particulars")

    # =============================================================
    # CHAPTER 3
    # =============================================================
    add_chapter_heading(doc, "Chapter 3: Types of Major Equipment, Hardware, Software, Instruments and Raw Materials Used in Industry")
    add_body_paragraph(doc, "Professional software development at Nexonica Systems Private Limited requires a combination of capable developer hardware and an ecosystem of industry-standard software tools, code editors, database management systems, and development utilities. The following hardware and software tools were used during the internship.")

    add_section_heading(doc, "3.1 Major Hardware and Equipment Used")
    t3_1_data = [
        ("1", "High-performance developer laptop (Intel Core i5/i7, 8–16 GB RAM, SSD storage)", "Running local development servers, IDEs, databases, and development tools smoothly"),
        ("2", "Stable broadband internet connection", "Version control using Git/GitHub, package installation, documentation access, and API testing"),
        ("3", "Dual / extended display (where available)", "Parallel viewing of the code editor, browser, database tools, and API testing applications")
    ]
    add_table_with_caption(doc, ["Sr. No.", "Equipment / Hardware", "Purpose / Application"], t3_1_data, [Cm(1.8), Cm(7.4), Cm(7.0)], "Table 3.1 – Hardware Used")

    add_body_paragraph(doc, "A solid-state drive (SSD) reduces the startup time of IDEs and databases, while 8 GB or more of RAM allows developers to keep Visual Studio Code, a browser with developer tools, PostgreSQL, pgAdmin, and Postman open simultaneously with minimal slowdown. A reliable internet connection is essential because package managers such as pip and npm download required libraries and dependencies. It is also required for pushing and pulling code from GitHub and accessing online development resources.")

    add_section_heading(doc, "3.2 Major Software and Tools Used")
    t3_2_data = [
        ("IDE / Editor", "Visual Studio Code", "Primary code editing, debugging, extensions, and integrated terminal"),
        ("Frontend", "HTML5, CSS3, React.js", "Building responsive user interfaces and single-page applications"),
        ("Backend", "Python, Flask, Flask-SQLAlchemy", "Developing REST API routes, controllers, database operations, and business logic"),
        ("Database", "PostgreSQL, pgAdmin 4", "Designing database schemas, managing tables, running SQL queries, and inspecting database records"),
        ("API Testing", "Postman", "Testing REST endpoints such as GET, POST, PUT, and DELETE and validating JSON responses"),
        ("Version Control", "Git & GitHub", "Tracking code changes, creating branches, and managing collaborative development and merging"),
        ("Mobile / Preview", "Android Studio / Device Preview", "Testing responsive layouts and application interfaces across mobile screen sizes")
    ]
    add_table_with_caption(doc, ["Category", "Tool", "Purpose in Internship"], t3_2_data, [Cm(3.4), Cm(5.0), Cm(7.8)], "Table 3.2 – Software and Tools Used")

    add_section_heading(doc, "3.3 Tool-wise Description")
    add_body_paragraph(doc, "Visual Studio Code (VS Code) is a lightweight and extensible source-code editor used as the primary development environment. Its integrated terminal allows developers to run the Flask backend server, React development server, Git commands, and other utilities without leaving the editor. Useful extensions include the Python extension for IntelliSense, linting, and debugging; ES7+ React snippets for faster React development; Prettier for code formatting; ESLint for identifying JavaScript and React coding issues; and GitLens for enhanced Git integration.", bold_prefix="Visual Studio Code: ")
    add_body_paragraph(doc, "Python was used for backend development during the internship. A separate virtual environment was created for each project to prevent dependency and library-version conflicts between projects. Project dependencies were recorded in a requirements.txt file. This allows other team members or developers to recreate the project environment with the required packages and versions.", bold_prefix="Python and Virtual Environments: ")
    add_body_paragraph(doc, "Flask is a lightweight Python web framework that provides routing, request and response handling, and a development server while allowing developers to select additional components according to project requirements. Flask-SQLAlchemy provides an Object-Relational Mapping (ORM) layer. Database tables can be represented as Python classes, and database operations can be performed using ORM methods. This simplifies database interaction and reduces the need to write repetitive raw SQL queries.", bold_prefix="Flask and Flask-SQLAlchemy: ")
    add_body_paragraph(doc, "React.js is a JavaScript library used for building modern and interactive user interfaces using reusable components. During the internship, functional components, the useState hook for managing local state, and the useEffect hook for handling side effects such as API calls were used. Data was passed between components using props, allowing the application to maintain a structured and reusable component architecture.", bold_prefix="React.js: ")
    add_body_paragraph(doc, "PostgreSQL is an open-source relational database management system known for reliability, scalability, and strong compliance with SQL standards. It was used to store and manage structured application data. pgAdmin 4 is a graphical administration and management tool for PostgreSQL. It was used to create databases and tables, view records, execute SQL queries through the Query Tool, and inspect relationships between database tables.", bold_prefix="PostgreSQL and pgAdmin 4: ")
    add_body_paragraph(doc, "Postman is an API development and testing tool used to send HTTP requests to the Flask server and inspect response status codes, headers, and JSON data. API requests were organized into collections for systematic testing. Git is a distributed version-control system used to track source-code changes. GitHub provides remote repository hosting and collaboration features. During development, tasks were organized using separate branches, and completed work could be merged after review.", bold_prefix="Postman, Git and GitHub: ")

    add_section_heading(doc, "3.4 Raw Materials (Digital Inputs)")
    add_body_paragraph(doc, "In a software development company, the concept of raw materials refers primarily to digital inputs and resources required for developing software applications. These include requirement documents, source code, database contents, third-party libraries and packages downloaded through pip and npm, configuration files, and authorized access credentials. These digital assets are important components of the development process and must be handled securely according to the organisation's policies. Sensitive information such as credentials, client data, and source code must be protected from unauthorized access.")

    add_section_heading(doc, "3.5 Environment Setup Commands")
    add_body_paragraph(doc, "The following commands summarize the basic environment setup performed during the initial stage of the internship (Task 01).")
    
    code_3_1 = (
        "# 1. Create a Python virtual environment\n"
        "python -m venv venv\n"
        "# Activate the virtual environment on Windows\n"
        "venv\\Scripts\\activate\n"
        "# Activate the virtual environment on Linux / macOS\n"
        "source venv/bin/activate\n"
        "# 2. Install backend dependencies\n"
        "pip install flask flask-sqlalchemy flask-cors psycopg2-binary python-dotenv\n"
        "# Save installed dependencies\n"
        "pip freeze > requirements.txt\n"
        "# 3. Configure Git identity\n"
        "git config --global user.name \"Your Name\"\n"
        "git config --global user.email \"you@example.com\"\n"
        "# 4. Create a React application\n"
        "npx create-react-app client\n"
        "# Alternative: Create a React application using Vite\n"
        "npm create vite@latest client\n"
        "# Install Axios\n"
        "cd client\n"
        "npm install axios"
    )
    add_code_listing(doc, code_3_1, "Listing 3.1 – Environment Setup Commands")

    # =============================================================
    # CHAPTER 4
    # =============================================================
    add_chapter_heading(doc, "Chapter 4: Processes, Development Methodologies and Material Handling Procedures")
    add_body_paragraph(doc, "Nexonica Systems follows structured and agile development workflows to ensure code quality, maintainability, and timely delivery of project modules.")

    add_section_heading(doc, "4.1 Agile & Scrum Methodology")
    add_body_paragraph(doc, "Work is divided into short iterations called sprints. Requirements are written as small user stories. For example: “As a user, I want to create a service request so that the support team can act on it.” Each story is estimated, assigned, developed, tested, and tracked until completion.")

    t4_1_data = [
        ("Daily Stand-up", "Short meeting to discuss completed work, planned work, and blockers", "Reported task status daily"),
        ("Sprint Planning", "Selecting and planning stories for the upcoming sprint", "Received and clarified assigned tasks"),
        ("Sprint Review / Demo", "Demonstrating completed work to mentors and stakeholders", "Demonstrated working APIs and UI screens"),
        ("Retrospective", "Discussing what went well and what can be improved", "Shared difficulties, observations, and learnings")
    ]
    add_table_with_caption(doc, ["Scrum Ceremony", "Purpose", "Intern's Participation"], t4_1_data, [Cm(3.8), Cm(7.6), Cm(4.8)], "Table 4.1 – Scrum Ceremonies")

    add_section_heading(doc, "4.2 Standard Development Cycle")
    add_body_paragraph(doc, "The standard development cycle followed during the internship was: Requirement Analysis → Planning → Architecture & Database Design → Implementation → API Testing → Debugging → Documentation.")

    t4_2_data = [
        ("Requirement Analysis", "Reading the task description, identifying inputs and outputs, and clarifying doubts with the mentor"),
        ("Planning", "Breaking the task into smaller steps, estimating effort, and creating a feature branch"),
        ("Architecture & Database Design", "Deciding tables, columns, keys, and relationships and defining API endpoints"),
        ("Implementation", "Writing Flask routes and models, building React components, and connecting them to APIs"),
        ("API Testing", "Sending requests using Postman and verifying status codes and response payloads"),
        ("Debugging", "Reading stack traces and logs and fixing validation, application, and database errors"),
        ("Documentation", "Updating the README, API endpoint tables, and internship documentation")
    ]
    add_table_with_caption(doc, ["Stage", "Activities Performed"], t4_2_data, [Cm(5.0), Cm(11.2)], "Table 4.2 – Activities in Each Development Stage")

    add_section_heading(doc, "4.3 Feature-Branch Git Workflow")
    add_body_paragraph(doc, "The main branch contains stable and reviewed code. For each task, a new branch is created from the main branch. The developer works on the task, commits changes in small increments, and raises a pull request when the task is ready. After review and approval, the branch is merged into the main branch and can be deleted.")

    code_4_1 = (
        "git checkout main\n"
        "git pull origin main\n"
        "# Create a task branch\n"
        "git checkout -b feature/flask-crud\n"
        "git add .\n"
        "git commit -m \"feat: add create and list endpoints for items\"\n"
        "git push origin feature/flask-crud\n"
        "# After review and merge\n"
        "git checkout main\n"
        "git pull origin main\n"
        "git branch -d feature/flask-crud"
    )
    add_code_listing(doc, code_4_1, "Listing 4.1 – Typical Git Workflow for One Task")

    t4_3_data = [
        ("feat", "A new feature", "feat: add status filter to request list"),
        ("fix", "A bug fix", "fix: return 404 for unknown request id"),
        ("docs", "Documentation changes only", "docs: add API endpoint table to README"),
        ("test", "Adding or fixing tests", "test: add unit tests for item model"),
        ("refactor", "Code restructuring without behaviour change", "refactor: move routes into blueprint")
    ]
    add_table_with_caption(doc, ["Prefix", "Meaning", "Example Commit Message"], t4_3_data, [Cm(2.6), Cm(6.0), Cm(7.6)], "Table 4.3 – Commit Message Convention")

    add_section_heading(doc, "4.4 Code Review & Coding Standards")
    add_body_paragraph(doc, "Peer code review is performed before merging changes into the main branch. The following coding and quality standards are followed:")
    standards = [
        ("Meaningful Naming: ", "Names should be clear and follow PEP 8 conventions for Python and camelCase/PascalCase conventions for JavaScript and React."),
        ("Credential Security: ", "Credentials, passwords, and API keys must not be hard-coded. Environment variables are used instead."),
        ("Input Validation: ", "User inputs are validated, and appropriate HTTP status codes are returned for errors."),
        ("Database Safety: ", "Database operations are handled using appropriate exception handling and rollback mechanisms when failures occur."),
        ("Code Reusability: ", "Functions should be short and focused on a single purpose, and unnecessary code duplication should be avoided."),
        ("Documentation: ", "Comments and docstrings should explain the purpose or reasoning behind the code where necessary."),
        ("Python Standards: ", "PEP 8 style, snake_case naming, docstrings, and four-space indentation are followed."),
        ("JavaScript / React Standards: ", "Functional components, ES6 syntax, const/let, and organized component files are preferred."),
        ("SQL Standards: ", "Lowercase snake_case naming and explicit primary and foreign keys are used."),
        ("API Design: ", "Plural nouns are used in URLs, HTTP methods represent operations, and JSON responses follow a consistent structure.")
    ]
    for lbl, txt in standards:
        add_body_paragraph(doc, txt, bold_prefix=lbl, space_after=2, left_indent=0.25)

    add_section_heading(doc, "4.5 Handling Procedure for Each Request")
    add_body_paragraph(doc, "Every API request handled by the Flask backend passes through a standard sequence of steps. Following a fixed request-handling pipeline makes system behaviour predictable and simplifies debugging and maintenance.")

    t4_4_data = [
        ("1. Reception", "Flask matches the requested URL and HTTP method with the appropriate route function", "POST /api/items"),
        ("2. Validation", "Mandatory fields, data types, and input lengths are checked", "name must not be empty"),
        ("3. Business Rules", "Application-specific logic and default values are applied", "Default status = Open"),
        ("4. Database Transaction", "Data is added or modified and changes are committed using SQLAlchemy", "db.session.add(item) → commit()"),
        ("5. Exception Handling", "Errors are caught, transactions are rolled back, and appropriate error responses are generated", "400 / 404 / 500 with an error message"),
        ("6. Response", "A JSON response is returned with the appropriate HTTP status code", "{\"id\": 5} with 201 Created")
    ]
    add_table_with_caption(doc, ["Step", "Description", "Example"], t4_4_data, [Cm(3.8), Cm(8.6), Cm(3.8)], "Table 4.4 – Request Handling Pipeline")

    # =============================================================
    # CHAPTER 5
    # =============================================================
    add_chapter_heading(doc, "Chapter 5: Testing of Hardware, Software and Material Handling Procedures")
    add_body_paragraph(doc, "Software reliability was ensured through structured testing covering unit-level logic, cross-layer integration, and complete API validation. Testing was treated as an integral part of development rather than a separate activity performed at the end. Every API route developed was tested using Postman and then covered by automated tests wherever applicable.")

    add_section_heading(doc, "5.1 Levels of Testing")
    t5_1_data = [
        ("Unit Testing", "Individual Python functions, model methods, and Flask route controllers tested independently", "Python unittest"),
        ("Integration Testing", "Communication between the React frontend, Flask backend, and PostgreSQL database", "Browser DevTools, Postman"),
        ("API End-to-End Testing", "HTTP GET, POST, PUT, and DELETE requests, including status codes and JSON payloads", "Postman"),
        ("UI / Responsive Testing", "Layout behaviour across desktop and mobile viewports", "Browser Device Mode, Android Studio Preview")
    ]
    add_table_with_caption(doc, ["Level", "What Is Tested", "Tool Used"], t5_1_data, [Cm(3.8), Cm(8.6), Cm(3.8)], "Table 5.1 – Testing Levels")

    add_section_heading(doc, "5.2 Integration Testing")
    add_body_paragraph(doc, "Integration testing verifies that the different layers of the application work together correctly. A typical test involved filling the New Request form in React, submitting the form, confirming that Axios sends a POST request, verifying that Flask returns an appropriate response such as 201 Created, and finally checking PostgreSQL through pgAdmin to confirm that the new record exists. Common issues identified during integration testing included incorrect CORS configuration, mismatched JSON field names, and data-type mismatches between the frontend and backend.")

    add_section_heading(doc, "5.3 API End-to-End Testing with Postman")
    add_body_paragraph(doc, "Postman was used to validate the API endpoints. For each request, the HTTP status code, response headers such as Content-Type: application/json, JSON response structure, and response time were checked. Postman's Tests tab was used to create JavaScript-based assertions. This allowed API collections to be executed repeatedly and verified automatically.")

    code_5_2 = (
        "// Postman \"Tests\" tab for POST /api/items\n"
        "pm.test(\"Status code is 201\", function () {\n"
        "    pm.response.to.have.status(201);\n"
        "});\n"
        "pm.test(\"Response has id\", function () {\n"
        "    var json = pm.response.json();\n"
        "    pm.expect(json).to.have.property(\"id\");\n"
        "    pm.environment.set(\"item_id\", json.id);\n"
        "});"
    )
    add_code_listing(doc, code_5_2, "Listing 5.2 – Postman Assertions")

    add_section_heading(doc, "5.4 Functional Test Cases")
    t5_2_data = [
        ("TC-01", "Create a new record with valid parameters", "Record stored – HTTP 201 Created", "Pass"),
        ("TC-02", "Retrieve all records", "JSON list returned – HTTP 200 OK", "Pass"),
        ("TC-03", "Retrieve a specific record using a valid ID", "Correct record details returned", "Pass"),
        ("TC-04", "Update an existing record", "Record updated in the database", "Pass"),
        ("TC-05", "Delete a specific record", "Record removed from the database", "Pass"),
        ("TC-06", "Submit a request with missing mandatory fields", "Validation error – HTTP 400", "Pass"),
        ("TC-07", "Query using a non-existent record ID", "Controlled “Not Found” response – HTTP 404", "Pass"),
        ("TC-08", "Create a record with an incorrect data type", "Validation error – HTTP 400", "Pass"),
        ("TC-09", "Update a record that does not exist", "Controlled “Not Found” response – HTTP 404", "Pass"),
        ("TC-10", "Delete a record that has already been deleted", "Controlled “Not Found” response – HTTP 404", "Pass"),
        ("TC-11", "Call the API from the React frontend using a different origin", "Request succeeds because CORS is enabled", "Pass"),
        ("TC-12", "Filter requests by status “Open”", "Only records with status “Open” are returned", "Pass"),
        ("TC-13", "Open the dashboard on a mobile viewport", "Layout adapts correctly without horizontal scrolling", "Pass")
    ]
    add_table_with_caption(doc, ["Test ID", "Test Case", "Expected Result", "Result"], t5_2_data, [Cm(2.0), Cm(6.4), Cm(6.2), Cm(1.6)], "Table 5.2 – Functional Test Cases")

    add_section_heading(doc, "5.6 Defect Handling")
    add_body_paragraph(doc, "When a test fails, the defect is recorded along with the steps to reproduce it, the expected result, and the actual result. The developer then reproduces the issue, fixes it on the same feature branch, adds or updates a test to prevent the issue from recurring, and re-runs the complete test suite before requesting another review.")
    add_body_paragraph(doc, "Detect → Report → Reproduce → Fix → Re-test → Close", bold_prefix="Defect Handling Flow: ")

    add_section_heading(doc, "5.7 Digital Asset & Material Handling")
    add_body_paragraph(doc, "In a software development company, the most sensitive materials include source code, database contents, configuration files, and access credentials. These digital assets must be handled securely and according to organisational policies. The detailed procedures for handling sensitive digital assets, credentials, and project materials are described in Chapter 6.")

    # =============================================================
    # CHAPTER 6
    # =============================================================
    add_chapter_heading(doc, "Chapter 6: Safety Procedures Followed and Safety Gears Used")
    add_body_paragraph(doc, "For a software organisation, safety primarily involves protecting employee work, client data, source code, credentials, and system availability. Nexonica Systems follows defined safety and security procedures, and interns are expected to follow these practices from the beginning of their internship.")

    add_section_heading(doc, "6.1 Professional Workplace Practices")
    add_body_paragraph(doc, "The following professional safety practices were followed during the internship:")
    safe_bullets = [
        ("Confidentiality: ", "Credentials, client data, and source code were handled according to company policies."),
        ("Clean Workstation: ", "Passwords and confidential information were not included in screenshots, chats, or shared documents."),
        ("Access Control: ", "Repository and database access was provided only to authorised personnel who required it."),
        ("Transparency: ", "Technical blockers, security concerns, and project risks were communicated at an early stage during discussions and daily updates.")
    ]
    for lbl, txt in safe_bullets:
        add_body_paragraph(doc, txt, bold_prefix=lbl, space_after=2, left_indent=0.25)

    add_section_heading(doc, "6.2 Cyber Security and Information Safety")
    add_body_paragraph(doc, "The following practices were used to protect applications, databases, and development environments:")
    cyber_bullets = [
        ("Environment Variables: ", "Database URLs, secret keys, and passwords were stored in a .env file. The file was added to .gitignore and was not committed to GitHub."),
        ("Password Security: ", "User passwords were stored as salted hashes rather than plain-text passwords."),
        ("SQL Injection Protection: ", "SQL queries were not manually constructed using untrusted user input. ORM-based database operations were used to reduce SQL injection risks."),
        ("Input Validation and Controlled CORS: ", "User input was validated before database operations, and Cross-Origin Resource Sharing (CORS) was configured according to application requirements."),
        ("Token-Based Authentication: ", "Protected routes verified authentication tokens before processing authorised requests."),
        ("Code Review: ", "Code was reviewed before merging. Hard-coded credentials were avoided, errors were handled properly, and database operations used exception handling and rollback mechanisms.")
    ]
    for lbl, txt in cyber_bullets:
        add_body_paragraph(doc, txt, bold_prefix=lbl, space_after=2, left_indent=0.25)

    code_6_1 = (
        "# .env (never committed)\n"
        "DATABASE_URL=postgresql://postgres:password@localhost:5432/service_portal\n"
        "SECRET_KEY=change-this-in-production"
    )
    add_code_listing(doc, code_6_1, "Listing 6.1 – Environment File (Placeholder Values)")
    add_body_paragraph(doc, "Note: The values shown above are placeholders and should not contain real production credentials.")

    add_section_heading(doc, "6.3 Data Backup and Recovery")
    add_body_paragraph(doc, "Regular database backups can be created using PostgreSQL's pg_dump utility and stored in a protected location. Source code was maintained and backed up through Git and GitHub. Feature branches were used for individual tasks until the changes were reviewed and merged.")

    code_6_2 = (
        "pg_dump -U postgres -d service_portal -F c -f backup_service_portal.dump\n"
        "pg_restore -U postgres -d service_portal_restore backup_service_portal.dump"
    )
    add_code_listing(doc, code_6_2, "Listing 6.2 – Backup and Restore Commands")
    add_body_paragraph(doc, "These procedures help reduce the risk of data loss and provide a method for restoring database information when required.")

    add_section_heading(doc, "6.4 Safety Gears (Digital Safeguards) Used")
    add_body_paragraph(doc, "In a software development environment, safety gears are mainly implemented as digital security controls and development practices.")

    t6_1_data = [
        (".env file + .gitignore", "Prevents accidental exposure of passwords and secret keys"),
        ("Password hashing (Werkzeug)", "Protects passwords from being stored in readable form"),
        ("ORM / Parameterised Queries", "Reduces the risk of SQL injection"),
        ("Git Feature Branches + Pull Requests", "Prevents unreviewed or unstable code from directly reaching the main branch"),
        ("pg_dump Backups", "Protects against database data loss"),
        ("Separate Test Database / In-Memory SQLite", "Reduces the risk of tests affecting production data"),
        ("Role-Based Access", "Restricts users from accessing features that are not permitted for their role")
    ]
    add_table_with_caption(doc, ["Safety Gear / Safeguard", "Protection Provided"], t6_1_data, [Cm(6.2), Cm(10.0)], "Table 6.1 – Digital Safeguards Used")

    add_body_paragraph(doc, "The above safety procedures and digital safeguards helped maintain confidentiality, integrity, availability, and controlled access throughout the software development process.")

    # =============================================================
    # CHAPTER 7
    # =============================================================
    add_chapter_heading(doc, "Chapter 7: Particulars of Practical Experiences in Industry / Organization")
    add_body_paragraph(doc, "The internship provided progressive hands-on experience, beginning with fundamental UI development and progressing to backend development, database integration, API testing, and complete application workflows. The major technologies and practices learned during the internship include:")
    learn_items = [
        "HTML5, CSS3 and Responsive Design – semantic structure, styling, Flexbox, CSS Grid and media queries.",
        "React.js – functional components, props, useState and useEffect.",
        "Python and Flask – route handling, blueprints and application structuring.",
        "PostgreSQL and Flask-SQLAlchemy – database schema design, relationships and ORM queries.",
        "REST APIs – API design and frontend consumption using Axios/fetch.",
        "Postman – endpoint testing, environment variables and collections.",
        "pgAdmin 4 – table design, query execution and database inspection.",
        "Git and GitHub – branching, commits, pull requests and merge conflict resolution."
    ]
    for li in learn_items:
        add_body_paragraph(doc, li, bold_prefix="• ", space_after=2, left_indent=0.25)

    add_section_heading(doc, "7.1 Frontend Experience: HTML5, CSS3 and Responsive Design")
    add_body_paragraph(doc, "The first phase of the internship focused on developing static web pages using semantic HTML5 elements such as <header>, <nav>, <main>, <section>, and <footer>. CSS3 was then used to style the pages and create responsive layouts. Flexbox and CSS Grid were used to arrange page elements, while media queries were applied to adapt layouts for smaller screens.")

    code_7_1 = (
        ".cards {\n"
        "    display: grid;\n"
        "    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));\n"
        "    gap: 16px;\n"
        "}\n"
        "@media (max-width: 600px) {\n"
        "    .navbar {\n"
        "        flex-direction: column;\n"
        "    }\n"
        "}"
    )
    add_code_listing(doc, code_7_1, "Listing 7.1 – Responsive Card Grid Using CSS Grid")
    add_body_paragraph(doc, "This practical work helped in understanding how a website can maintain usability and visual consistency across different screen sizes.")

    add_section_heading(doc, "7.2 React.js Experience")
    add_body_paragraph(doc, "React.js introduced a component-based approach to frontend development. The interface was divided into reusable components such as Navbar, RequestCard, RequestForm, and StatusBadge. Data was passed between components using props. An important learning area was handling asynchronous data. The application displayed a loading state while waiting for the API response and then displayed either the received data or an error message.")

    add_section_heading(doc, "7.3 Backend Experience: Python and Flask")
    add_body_paragraph(doc, "On the backend, practical experience was gained in understanding how Flask maps URLs to Python functions, reads JSON request bodies using request.get_json(), and returns JSON responses using jsonify(). As the number of routes increased, Flask Blueprints were used to organise related routes into separate modules. The Application Factory Pattern was also introduced to create the Flask application with different configurations for development and testing. This approach improved understanding of backend application structure, modularity, and maintainability.")

    add_section_heading(doc, "7.4 Database Experience: PostgreSQL and SQLAlchemy")
    add_body_paragraph(doc, "Working with PostgreSQL provided practical knowledge of database design and data integrity. Primary keys, foreign keys, unique constraints, and NOT NULL constraints were used to maintain consistent data. Relationships such as one category having many requests were modelled using foreign keys and SQLAlchemy's relationship() functionality. SQL queries were first practised using the pgAdmin Query Tool and were then implemented as ORM queries using SQLAlchemy.")

    code_7_3 = (
        "SELECT\n"
        "    r.id,\n"
        "    r.title,\n"
        "    c.name AS category,\n"
        "    r.status\n"
        "FROM requests r\n"
        "JOIN categories c ON c.id = r.category_id\n"
        "WHERE r.status = 'Open'\n"
        "ORDER BY r.created_at DESC;"
    )
    add_code_listing(doc, code_7_3, "Listing 7.3 – Example JOIN Query Run in pgAdmin 4")
    add_body_paragraph(doc, "This practical work helped in understanding how related records can be retrieved and filtered from multiple database tables.")

    add_section_heading(doc, "7.5 Integration Experience: CORS and Axios")
    add_body_paragraph(doc, "During frontend-backend integration, the React application running on one port attempted to communicate with the Flask API running on another port. The browser initially blocked the request because of the same-origin policy. The issue was resolved by configuring Flask-CORS on the backend and sending the appropriate headers. This provided practical understanding of browser security, Cross-Origin Resource Sharing, and frontend-backend communication.")

    add_section_heading(doc, "7.6 Flask & Database CRUD Operations")
    add_body_paragraph(doc, "A core competency developed during the internship was implementing complete CRUD (Create, Read, Update, Delete) operations using Python Flask and PostgreSQL. These four operations form the foundation of many business applications.")

    t7_1_data = [
        ("Create", "POST", "Insert a new record", "/api/items", "INSERT"),
        ("Read", "GET", "Fetch one or multiple records", "/api/items or /api/items/{id}", "SELECT"),
        ("Update", "PUT / PATCH", "Modify an existing record", "/api/items/{id}", "UPDATE"),
        ("Delete", "DELETE", "Remove a record", "/api/items/{id}", "DELETE")
    ]
    add_table_with_caption(doc, ["Operation", "HTTP Method", "Purpose", "Example Route", "SQL"], t7_1_data, [Cm(2.2), Cm(2.4), Cm(4.8), Cm(4.6), Cm(2.2)], "Table 7.1 – CRUD Operations Mapped to HTTP Methods and SQL")

    add_body_paragraph(doc, "A recommended Flask project structure used for organising the application is shown below.")
    code_7_4 = (
        "app.py                 # Application factory, CORS, blueprint registration\n"
        "config.py              # Reads settings from environment variables\n"
        "models.py              # SQLAlchemy models\n"
        "routes/\n"
        "├── __init__.py\n"
        "└── items.py           # Blueprint with CRUD routes\n"
        "tests/\n"
        "└── test_items.py\n"
        "requirements.txt\n"
        ".env"
    )
    add_code_listing(doc, code_7_4, "Listing 7.4 – Recommended Flask Project Structure")

    add_body_paragraph(doc, "The database model was created using Flask-SQLAlchemy.")
    code_7_5 = (
        "from flask_sqlalchemy import SQLAlchemy\n"
        "from datetime import datetime\n"
        "db = SQLAlchemy()\n\n"
        "class ItemModel(db.Model):\n"
        "    __tablename__ = \"items\"\n"
        "    id = db.Column(db.Integer, primary_key=True)\n"
        "    name = db.Column(db.String(100), nullable=False)\n"
        "    description = db.Column(db.Text)\n"
        "    created_at = db.Column(db.DateTime, default=datetime.utcnow)\n\n"
        "    def to_dict(self):\n"
        "        return {\n"
        "            \"id\": self.id,\n"
        "            \"name\": self.name,\n"
        "            \"description\": self.description,\n"
        "            \"created_at\": self.created_at.isoformat()\n"
        "        }"
    )
    add_code_listing(doc, code_7_5, "Listing 7.5 – SQLAlchemy ORM Model")
    add_body_paragraph(doc, "The ORM model demonstrated how Python classes can represent database tables and how SQLAlchemy can be used to perform database operations without writing every SQL statement manually.")

    add_section_heading(doc, "7.7 Challenges Faced and Solutions")
    add_body_paragraph(doc, "During practical development, several technical challenges were encountered. These issues helped develop debugging, problem-solving, and integration skills.")

    t7_2_data = [
        ("CORS error in browser console", "Frontend and backend were running on different ports", "Enabled Flask-CORS for the API"),
        ("psycopg2 installation failed", "Missing build dependencies", "Used the psycopg2-binary package"),
        ("400 error on POST from React", "JSON field names differed from backend fields", "Aligned field names and verified the request in Postman"),
        ("Merge conflict in shared file", "Two branches modified the same lines", "Resolved the conflict manually, re-tested, and committed the merge"),
        ("Data not updating on screen", "React state was not updated after the API call", "Updated the state or re-fetched the list after a successful request"),
        ("Table not found error", "Database tables had not been created", "Created tables using db.create_all() and verified them in pgAdmin")
    ]
    add_table_with_caption(doc, ["Challenge", "Cause", "Solution"], t7_2_data, [Cm(4.6), Cm(5.6), Cm(6.0)], "Table 7.2 – Challenges Faced and Solutions")

    add_body_paragraph(doc, "These challenges provided practical experience in identifying errors, analysing their causes, applying appropriate solutions, and verifying the results after fixing them.")

    # =============================================================
    # CHAPTER 8
    # =============================================================
    add_chapter_heading(doc, "Chapter 8: Detailed Report of the Tasks Undertaken During the Internship")
    add_body_paragraph(doc, "Throughout the internship, multiple structured tasks and mini-projects were completed under mentor guidance. These included daily programming exercises, technology-specific activities, database and API development, frontend-backend integration, testing, version control, and documentation.")

    t8_1_data = [
        ("Task 01", "Company onboarding; setup of VS Code, Python virtual environment, and Git", "VS Code, Git", "Completed"),
        ("Task 02", "Designed static HTML/CSS pages and practised responsive grid layouts", "HTML5, CSS3", "Completed"),
        ("Task 03", "Built small React UI components such as buttons, cards, and forms", "React.js", "Completed"),
        ("Task 04", "Designed a responsive landing page with modern styling and typography", "HTML5, CSS3", "Completed"),
        ("Task 05", "Developed interactive SPA features using React hooks and props", "React.js, JavaScript", "Completed"),
        ("Task 06", "Configured PostgreSQL schemas and managed relational tables using pgAdmin 4", "PostgreSQL, pgAdmin 4", "Completed"),
        ("Task 07", "Built RESTful Flask API endpoints supporting CRUD operations", "Python, Flask, SQLAlchemy", "Completed"),
        ("Task 08", "Wrote unit tests for Flask routes and model functions", "Python, unittest", "Completed"),
        ("Task 09", "Conducted API testing and validated headers, payloads, and error handling", "Postman", "Completed"),
        ("Task 10", "Integrated the React frontend with Flask APIs using CORS and Axios", "React.js, Flask, Axios", "Completed"),
        ("Task 11", "Practised Git branching, commits, pull requests, and merge conflict resolution", "Git, GitHub", "Completed"),
        ("Task 12", "Prepared technical documentation and the final capstone project report", "MS Word, Markdown", "Completed")
    ]
    add_table_with_caption(doc, ["Task ID", "Task Name & Description", "Tools / Technology Used", "Status"], t8_1_data, [Cm(2.0), Cm(7.4), Cm(4.6), Cm(2.2)], "Table 8.1 – Summary of Tasks")

    task_details = [
        ("8.1 Task 01 – Onboarding and Environment Setup",
         "Objective: To prepare a working development environment and understand the organisation's development processes.\n"
         "Activities: Attended the orientation session, installed VS Code with the required extensions, created a Python virtual environment, installed and configured Git, configured the Git user identity, and cloned the initial practice repository from GitHub.\n"
         "Outcome: A functional development workstation was prepared, along with an understanding of stand-up timings, task reporting procedures, and basic coding standards."),
        
        ("8.2 Task 02 – Static HTML/CSS Pages",
         "Objective: To revise web development fundamentals and practise responsive layouts.\n"
         "Activities: Created multi-section web pages using semantic HTML5 elements and styled them using external CSS. Flexbox, CSS Grid, and media queries were used to make layouts adaptable to mobile phones, tablets, and desktop screens.\n"
         "Outcome: Developed clean and responsive static web pages that were reviewed by the mentor and later used as a foundation for subsequent tasks."),
        
        ("8.3 Task 03 – React UI Warm-up Components",
         "Objective: To understand component-based frontend development.\n"
         "Activities: Built reusable Button, Card, and Form components. Practised passing data through props, handling input fields and form submission events, using JSX syntax, and implementing conditional rendering.\n"
         "Outcome: Created a small collection of reusable React components that could be integrated into later frontend tasks."),
        
        ("8.4 Task 04 – Responsive Landing Page",
         "Objective: To apply modern web design principles to a complete webpage.\n"
         "Activities: Designed a landing page containing a hero section, feature cards, call-to-action section, and footer. Selected suitable colours and typography, maintained readable contrast, and tested the design across different screen widths.\n"
         "Outcome: Developed a polished and mobile-friendly landing page with a consistent visual design."),
        
        ("8.5 Task 05 – Interactive SPA with React Hooks",
         "Objective: To develop interactive features using React state and side effects.\n"
         "Activities: Used useState for form fields, counters, and filters and useEffect for loading data when components were mounted. Search and filter controls were implemented along with a modal form for adding items.\n"
         "Outcome: Developed a single-page application with dynamic behaviour, interactive controls, and data updates without requiring full-page reloads."),
        
        ("8.6 Task 06 – PostgreSQL Schema Design in pgAdmin 4",
         "Objective: To design relational database tables for the application.\n"
         "Activities: Created the database and defined tables using primary keys, foreign keys, NOT NULL, and UNIQUE constraints. Sample records were inserted, and SQL queries using JOIN, WHERE, ORDER BY, and GROUP BY were practised in the pgAdmin Query Tool.\n"
         "Outcome: Developed a structured and normalised database schema for users, categories, requests, and status history."),
        
        ("8.7 Task 07 – Flask REST API with CRUD",
         "Objective: To develop the backend service for the application.\n"
         "Activities: Created database models using Flask-SQLAlchemy, organised routes using Flask Blueprints, and implemented POST, GET, PUT, and DELETE endpoints. Input validation and consistent JSON error responses were also implemented.\n"
         "Outcome: Developed functional REST API endpoints connected to the PostgreSQL database."),
        
        ("8.8 Task 08 – Unit Testing",
         "Objective: To verify application functionality through automated testing.\n"
         "Activities: Created unittest test cases using the Flask test client for both successful and failure scenarios. A temporary test database was used, and tests were executed before submitting changes for review.\n"
         "Outcome: Developed a repeatable test suite that helped identify errors and prevent regressions during development."),
        
        ("8.9 Task 09 – API Testing with Postman",
         "Objective: To verify API behaviour and endpoint functionality.\n"
         "Activities: Created a Postman collection with environment variables and tested CRUD requests. Response headers, JSON request and response bodies, status codes, and error cases were validated. Assertions were also written using the Postman Tests tab.\n"
         "Outcome: Prepared a reusable Postman collection that provided structured testing and documentation for the API endpoints."),
        
        ("8.10 Task 10 – Frontend-Backend Integration",
         "Objective: To connect the React frontend with the Flask backend API.\n"
         "Activities: Configured CORS in Flask and used Axios for GET, POST, PUT, and DELETE requests. Loading and error states were managed in React, and the UI state was refreshed after successful operations.\n"
         "Outcome: Established a complete full-stack workflow in which user actions were processed by the React interface, sent to the Flask API, stored in PostgreSQL, and reflected back on the screen."),
        
        ("8.11 Task 11 – Git Branching and Merge Conflicts",
         "Objective: To understand safe collaboration and version control using Git.\n"
         "Activities: Created feature branches, made small and meaningful commits, opened pull requests, responded to review comments, and resolved merge conflicts by analysing conflict markers and re-testing the affected code.\n"
         "Outcome: Developed practical confidence in team-based version control, branch management, code review, and conflict resolution."),
        
        ("8.12 Task 12 – Documentation and Final Report",
         "Objective: To document the technical work in a professional and structured manner.\n"
         "Activities: Prepared README files, API endpoint tables, relevant screenshots, project documentation, and the final internship report according to the format required by the institute.\n"
         "Outcome: Completed the technical documentation for the project and prepared the final internship report for academic submission.")
    ]

    for title, desc in task_details:
        add_section_heading(doc, title)
        add_body_paragraph(doc, desc)

    # =============================================================
    # CHAPTER 9
    # =============================================================
    add_chapter_heading(doc, "Chapter 9: Special / Challenging Experiences Encountered During the Internship")
    add_section_heading(doc, "9.1 Moving from Classroom Programs to Layered Applications")
    add_body_paragraph(doc, "One of the initial challenges was understanding how a real application differs from classroom exercises. A real application has a user interface, server-side logic, and a database that must work together, along with version control and formal testing.")

    add_section_heading(doc, "9.2 Technical Challenges and How They Were Solved")
    t9_1_data = [
        ("CORS error in browser console", "Frontend (port 3000) and backend (port 5000) ran on different origins", "Enabled Flask-CORS for the API"),
        ("psycopg2 installation failed", "Missing build dependencies", "Installed psycopg2-binary package"),
        ("400 error on POST from React", "JSON keys differed from backend fields", "Aligned field names and checked the request in Postman first"),
        ("Merge conflict in shared file", "Two branches edited the same lines", "Resolved manually, re-tested, and committed the merge"),
        ("Data not updating on screen", "State was not updated after the API call", "Refreshed state or re-fetched the list after success"),
        ("Table not found error", "Migrations / create_all had not been run", "Created tables using db.create_all() and verified them in pgAdmin")
    ]
    add_table_with_caption(doc, ["Challenge", "Cause", "Solution"], t9_1_data, [Cm(4.6), Cm(5.6), Cm(6.0)], "Table 9.1 – Challenges and Solutions")

    add_section_heading(doc, "9.3 Asynchronous State in React")
    add_body_paragraph(doc, "Handling asynchronous state by showing a Loading message, followed by the received data or an error message, was an important learning experience. Refreshing the screen correctly after every successful create, update, or delete operation was also practised.")

    add_section_heading(doc, "9.4 Frontend-Backend Integration")
    add_body_paragraph(doc, "Incorrect JSON field names, data-type mismatches, and CORS settings were common causes of integration failures. Testing each endpoint in Postman first and then connecting it to React made these problems easier to isolate and resolve.")

    add_section_heading(doc, "9.5 Team Workflow")
    add_body_paragraph(doc, "Working with feature branches, pull requests, and code review required adapting to structured team practices. Feedback was incorporated carefully, and merge conflicts were resolved and tested before completing the merge. Small, frequent commits and short-lived feature branches made collaboration easier and reduced the risk of integration problems.")

    add_section_heading(doc, "9.6 Time Management")
    add_body_paragraph(doc, "Tasks had to be completed within sprint timelines while still allowing sufficient time for debugging, testing, and documentation. Proper task prioritisation helped maintain steady progress throughout the internship.")

    add_section_heading(doc, "9.7 Soft Skills Developed")
    add_body_paragraph(doc, "The internship helped develop the following professional skills:")
    soft_skills = [
        ("Communication: ", "Explaining progress and problems clearly during stand-ups."),
        ("Time Management: ", "Completing tasks within planned timelines."),
        ("Teamwork: ", "Working with reviewers and accepting feedback positively."),
        ("Problem Solving: ", "Reading error messages, referring to documentation, and testing possible solutions."),
        ("Professional Discipline: ", "Maintaining regular commits, documentation, and testing habits.")
    ]
    for lbl, txt in soft_skills:
        add_body_paragraph(doc, txt, bold_prefix=lbl, space_after=2, left_indent=0.25)

    # =============================================================
    # CHAPTER 10
    # =============================================================
    add_chapter_heading(doc, "Chapter 10: Assignments")
    add_section_heading(doc, "10.1 Assignments")
    add_body_paragraph(doc, "The practical assignments completed during the internship are summarised below along with their key code and implementation details. Screenshots of the outputs are provided in Chapter 12.")

    add_body_paragraph(doc, "A Python virtual environment was created, Flask and related packages were installed, Git was configured, and a React application was created. The environment setup commands are provided in Listing 3.1.", bold_prefix="Assignment 1 – Environment Setup and Git Configuration: ")
    add_body_paragraph(doc, "A responsive card grid was developed using CSS Grid. The layout automatically rearranged itself according to the available screen width. The implementation is provided in Listing 7.1.", bold_prefix="Assignment 2 – Responsive Layout with CSS Grid: ")
    add_body_paragraph(doc, "A RequestList component was developed using useState, useEffect, and Axios to retrieve data from the Flask API and display it in the React interface. The implementation is provided in Listing 7.2.", bold_prefix="Assignment 3 – React Component for Fetching API Data: ")
    add_body_paragraph(doc, "A SQL JOIN query was written to connect the requests and categories tables. The records were filtered according to status and sorted by creation date. The query is provided in Listing 7.3.", bold_prefix="Assignment 4 – SQL JOIN Query in pgAdmin 4: ")
    
    add_body_paragraph(doc, "Flask REST API routes were implemented for GET, POST, PUT, and DELETE operations. Input validation, database rollback on failure, and consistent JSON error responses were included.", bold_prefix="Assignment 5 – Flask CRUD Routes: ")

    code_10_1 = (
        "@api_blueprint.route('/items/<int:item_id>', methods=['GET'])\n"
        "def get_item(item_id):\n"
        "    item = db.session.get(ItemModel, item_id)\n"
        "    if not item:\n"
        "        return jsonify({\"error\": \"Item not found\"}), 404\n"
        "    return jsonify(item.to_dict()), 200\n\n"
        "@api_blueprint.route('/items', methods=['POST'])\n"
        "def create_item():\n"
        "    data = request.get_json(silent=True) or {}\n"
        "    if not data.get(\"name\"):\n"
        "        return jsonify({\"error\": \"'name' is required\"}), 400\n"
        "    item = ItemModel(\n"
        "        name=data[\"name\"],\n"
        "        description=data.get(\"description\")\n"
        "    )\n"
        "    try:\n"
        "        db.session.add(item)\n"
        "        db.session.commit()\n"
        "    except Exception:\n"
        "        db.session.rollback()\n"
        "        return jsonify({\"error\": \"Database error\"}), 500\n"
        "    return jsonify(item.to_dict()), 201\n\n"
        "@api_blueprint.route('/items/<int:item_id>', methods=['PUT'])\n"
        "def update_item(item_id):\n"
        "    item = db.session.get(ItemModel, item_id)\n"
        "    if not item:\n"
        "        return jsonify({\"error\": \"Item not found\"}), 404\n"
        "    data = request.get_json(silent=True) or {}\n"
        "    item.name = data.get(\"name\", item.name)\n"
        "    item.description = data.get(\"description\", item.description)\n"
        "    db.session.commit()\n"
        "    return jsonify(item.to_dict()), 200\n\n"
        "@api_blueprint.route('/items/<int:item_id>', methods=['DELETE'])\n"
        "def delete_item(item_id):\n"
        "    item = db.session.get(ItemModel, item_id)\n"
        "    if not item:\n"
        "        return jsonify({\"error\": \"Item not found\"}), 404\n"
        "    db.session.delete(item)\n"
        "    db.session.commit()\n"
        "    return jsonify({\"message\": \"Item deleted\"}), 200"
    )
    add_code_listing(doc, code_10_1, "Listing 10.1 – Get, Create, Update, and Delete API Routes")

    t10_1_data = [
        ("Create", "POST /api/items\n{\"name\": \"Laptop\", \"description\": \"Not booting\"}", "201 Created\n{\"id\": 1, \"name\": \"Laptop\", ...}"),
        ("Read All", "GET /api/items", "200 OK\n[{\"id\": 1, ...}, {\"id\": 2, ...}]"),
        ("Read One", "GET /api/items/1", "200 OK\n{\"id\": 1, \"name\": \"Laptop\", ...}"),
        ("Update", "PUT /api/items/1\n{\"name\": \"Laptop - repaired\"}", "200 OK\nUpdated record"),
        ("Delete", "DELETE /api/items/1", "200 OK\n{\"message\": \"Item deleted\"}"),
        ("Invalid POST", "POST /api/items\n{}", "400 Bad Request\n{\"error\": \"'name' is required\"}")
    ]
    add_table_with_caption(doc, ["Operation", "Request", "Response"], t10_1_data, [Cm(2.6), Cm(7.2), Cm(6.4)], "Table 10.1 – Sample API Requests and Responses")

    add_body_paragraph(doc, "Unit tests were written for both successful and failure scenarios using the Flask test client. The test implementation is provided in Listing 5.1.", bold_prefix="Assignment 6 – Unit Testing with unittest: ")
    add_body_paragraph(doc, "A Postman collection was created with environment variables and assertions. CRUD endpoints, response status codes, headers, JSON payloads, and error cases were tested. The testing script is provided in Listing 5.2.", bold_prefix="Assignment 7 – API Testing with Postman: ")
    add_body_paragraph(doc, "Password hashing was implemented using Werkzeug security functions. Passwords were stored as hashes rather than plain text.", bold_prefix="Assignment 8 – Password Hashing: ")

    code_10_2 = (
        "from werkzeug.security import generate_password_hash, check_password_hash\n"
        "# At registration\n"
        "user.password_hash = generate_password_hash(data[\"password\"])\n"
        "# At login\n"
        "ok = check_password_hash(\n"
        "    user.password_hash,\n"
        "    data[\"password\"]\n"
        ")"
    )
    add_code_listing(doc, code_10_2, "Listing 10.2 – Password Hashing")

    add_body_paragraph(doc, "A feature branch was created for development, changes were committed using the feat, fix, and docs commit conventions, and a pull request was raised for review. A merge conflict was also resolved and the affected code was re-tested. The workflow is provided in Listing 4.1.", bold_prefix="Assignment 9 – Git Feature-Branch Workflow: ")
    add_body_paragraph(doc, "SQL statements were written to perform database table creation and CRUD operations.", bold_prefix="Assignment 10 – SQL Statements for CRUD: ")

    code_10_3 = (
        "CREATE TABLE items (\n"
        "    id SERIAL PRIMARY KEY,\n"
        "    name VARCHAR(100) NOT NULL,\n"
        "    description TEXT,\n"
        "    created_at TIMESTAMP DEFAULT NOW()\n"
        ");\n"
        "-- Create\n"
        "INSERT INTO items (name, description)\n"
        "VALUES ('Laptop', 'Not booting');\n"
        "-- Read all\n"
        "SELECT * FROM items;\n"
        "-- Read one\n"
        "SELECT * FROM items\n"
        "WHERE id = 1;\n"
        "-- Update\n"
        "UPDATE items\n"
        "SET name = 'Laptop - repaired'\n"
        "WHERE id = 1;\n"
        "-- Delete\n"
        "DELETE FROM items\n"
        "WHERE id = 1;"
    )
    add_code_listing(doc, code_10_3, "Listing 10.3 – SQL Statements for CRUD Operations")
    add_body_paragraph(doc, "These assignments provided practical experience in frontend development, backend API development, database operations, testing, security, version control, and full-stack application integration.")

    # =============================================================
    # CHAPTER 11
    # =============================================================
    add_chapter_heading(doc, "Chapter 11: Short Report / Description of the Project")
    add_section_heading(doc, "11.1 Project Title")
    add_body_paragraph(doc, "LibraAI – AI-Based Institutional Library Management System", bold_prefix="Project Name: ")
    add_body_paragraph(doc, "", bold_prefix="Languages / Technologies Used:")

    tech_c11 = [
        "Frontend Tier: React 19, TypeScript 5.7, Vite 6.2, Tailwind CSS 3.4, Lucide React icons, Axios HTTP client, HTML5-QRCode optical scanner library.",
        "Backend Tier: Node.js runtime environment, Express 4.21 web framework, TypeScript 5.7, Prisma ORM 6.4,",
        "Database Infrastructure: PostgreSQL 15 relational database hosted on Supabase Cloud,",
        "AI & Intelligence Services: OpenRouter API integrating Google Gemini 2.5 Flash"
    ]
    for idx, item in enumerate(tech_c11, 1):
        add_body_paragraph(doc, item, bold_prefix=f"{idx}. ", space_after=1.5, left_indent=0.2)

    add_section_heading(doc, "11.2 Project Overview")
    ov_c11 = [
        ("Objective: ", "To modernize and centralize higher education library operations by replacing error-prone manual ledgers and isolated spreadsheets with an automated, role-based cloud platform integrated with conversational AI study assistants and real-time business intelligence analytics."),
        ("System Architecture: ", "A decoupled three-tier client-server architecture. The presentation layer (React SPA) dispatches authenticated HTTPS/JSON requests with Bearer JWT headers to the Express application server, which executes business logic and interfaces with a Supabase-managed PostgreSQL database via Prisma ORM."),
        ("Key Features: ", "Granular 4-tier Role-Based Access Control (Student, Faculty, Librarian, Administrator); an institutional catalog holding 2,299 normalized titles and 8,246 physical copies imported via Excel; barcode-driven rapid circulation (issue, return, renewal, reservation); automated overdue fine calculation (₹5/day); interactive 22-chart Recharts analytics dashboard; LibraBot LLM study assistant; syllabus-to-book matcher; real-time reading hall seat reservation; and cryptographic SHA-256 activity audit logging."),
        ("Functional Modules: ", "Guest & Student Discovery Portal, Faculty Curriculum Shelf, Librarian Circulation Desk, Administrative Control Hub, AI Semantic Services & Study Assistant, and Executive Analytics & Reporting Module.")
    ]
    for lbl, txt in ov_c11:
        add_body_paragraph(doc, txt, bold_prefix=f"• {lbl}", space_after=2, left_indent=0.2)

    add_section_heading(doc, "11.3 Problem Statement")
    add_body_paragraph(doc, "Academic institutions frequently struggle with outdated, manual library administration systems or fragmented spreadsheet trackers. In such legacy environments, locating physical textbooks across vast campus collections requires laborious physical searches, while manual record-keeping leads to unrecorded loans, misplaced inventory, and overlooked overdue fines. Library administrators lack real-time visibility into collection turnover, seat occupancy, and department-wise demand trends. Furthermore, students receive no intelligent study support, personalized reading recommendations, or rapid syllabus alignment. A centralized, cloud-hosted, and AI-enabled library management system is required to eliminate operational inefficiencies, enforce strict audit trails, and elevate academic research capabilities.")

    add_section_heading(doc, "11.4 Existing System vs Proposed System")
    t11_1_data = [
        ("Catalog Discovery", "Paper index cards or static Excel files; slow manual keyword lookups.", "Instant multi-attribute & semantic vector search across 8,246 physical copies."),
        ("Circulation Processing", "Handwritten ledger entries prone to human transcription errors.", "Barcode-driven rapid circulation with automated status and inventory validation."),
        ("Due Dates & Fines", "Manual date calculation; overdue returns frequently missed.", "Automated 14-day tracking with programmatic fine calculation (₹5/day)."),
        ("Reports & Analytics", "Tedious end-of-semester tallying; no graphical trend charts.", "Live 22-chart Recharts dashboard showing footfall and category distributions."),
        ("Security & RBAC", "Shared spreadsheets with zero access restrictions or audit logs.", "Secure JWT tokens, bcrypt password hashing, and 4-tier granular RBAC."),
        ("Accessibility", "Restricted strictly to on-premise physical library hours.", "24/7 web access across desktop and mobile devices via cloud PostgreSQL."),
        ("Student Assistance", "Dependent on staff availability; no study guidance tools.", "24/7 LibraBot AI chatbot, syllabus matcher, and PDF study summaries."),
        ("Facility Management", "Unmonitored reading halls; no seat reservation records.", "Interactive digital seat booking with live zone occupancy tracking.")
    ]
    add_table_with_caption(doc, ["Aspect", "Existing (Manual / Spreadsheet) Approach", "Proposed System (LibraAI)"], t11_1_data, [Cm(3.2), Cm(6.4), Cm(6.6)], "Table 11.1 - Comparison of systems")

    add_section_heading(doc, "11.5 System Architecture")
    add_body_paragraph(doc, "LibraAI is built upon a layered three-tier architectural paradigm designed for scalability, security, and high maintainability. The client-side Single Page Application (SPA) dispatches asynchronous HTTPS requests carrying JSON payloads and Bearer JWT authorization tokens to the Express application tier. The backend router layer enforces strict authentication and role-based authorization filters before delegating requests to controller services. Data access operations are executed through Prisma ORM, which generates type-safe SQL queries against the cloud PostgreSQL database. For intelligent services, the backend dispatches contextual prompts to OpenRouter LLM endpoints, utilizing SHA-256 database caching to minimize latency and API overhead.")

    t11_2_data = [
        ("Presentation Layer", "User interfaces, responsive Recharts visualization, barcode scanning, client routing.", "React 19, TypeScript, Vite 6, Tailwind CSS, Axios"),
        ("Application Tier", "RESTful routing, JWT authentication, RBAC middleware, business logic, fine engine.", "Node.js, Express 4.21, TypeScript, Zod, bcryptjs"),
        ("Data Access Layer", "Type-safe database abstraction, connection pooling, schema migrations.", "Prisma ORM 6.4 Client & Query Engine"),
        ("Data Storage Tier", "Relational persistence, ACID transactions, foreign keys, B-tree indexes.", "PostgreSQL 15 (Supabase Cloud Database)"),
        ("AI & Intelligence", "Conversational Q&A, semantic search, syllabus matching, Ask-the-Book RAG.", "OpenRouter API (Gemini 2.5 Flash), SHA-256 AICache")
    ]
    add_table_with_caption(doc, ["Architecture Layer", "Primary Responsibilities", "Technologies Used"], t11_2_data, [Cm(3.4), Cm(7.8), Cm(5.0)], "Table 11.2 - Three-tier breakdown")

    add_section_heading(doc, "11.6 Module Description")
    mod_c11 = [
        ("Authentication & Access Control Module: ", "Manages user registration, credential verification, bcrypt password hashing, and JWT session lifecycle. Enforces 4-tier Role-Based Access Control (Student, Faculty, Librarian, Administrator) across all protected frontend routes and backend REST endpoints."),
        ("Catalog & Inventory Management Module: ", "Maintains the institutional repository of 2,299 normalized titles and 8,246 physical copies with unique barcodes (e.g. D-1 to D-8246) and physical rack locators (A1–C4). Supports bulk Excel inventory ingestion, multi-attribute filtering, and real-time copy availability tracking."),
        ("Circulation & Fine Management Module: ", "Handles automated checkout, return, renewal, and reservation workflows. Automatically computes 14-day due dates, tracks overdue loans, applies programmatic penalties at ₹5/day upon return validation, and supports librarian fee waivers with audit logs."),
        ("AI Study Assistant & Semantic Search Module: ", "Integrates Google Gemini 2.5 Flash via OpenRouter for conversational academic Q&A, TF-IDF semantic book search, automated syllabus-to-textbook matching, and PDF study summary generation with SHA-256 response caching."),
        ("Analytics & Business Intelligence Module: ", "Aggregates transactional database records into 22 interactive Recharts visualizations, displaying 30-day footfall curves, category holding donuts, top borrowed titles, peak hourly traffic heatmaps, and reading hall seat occupancy."),
        ("Administrative Governance & Cryptographic Audit Module: ", "Provides administrators with account provisioning tools, privilege assignment, 99.98% SLA telemetry monitoring, and a tamper-evident SHA-256 hash-chained activity ledger recording every critical system action.")
    ]
    for lbl, txt in mod_c11:
        add_body_paragraph(doc, txt, bold_prefix=f"• {lbl}", space_after=2, left_indent=0.2)

    add_section_heading(doc, "11.7 Database Design")
    add_body_paragraph(doc, "The relational database schema is normalized to Third Normal Form (3NF) to eliminate data redundancy and preserve referential integrity. Deployed on Supabase PostgreSQL, it features foreign key cascading, unique constraints, and B-tree indexes on frequently queried search attributes.")

    t11_3_data = [
        ("User", "id (PK), memberId (UQ), email (UQ), passwordHash, role, department, status", "Stores member credentials and 4-tier RBAC authorization flags."),
        ("Book", "id (PK), title, author, isbn, department, resourceType, embedding", "Maintains normalized academic title records and vector embeddings."),
        ("BookCopy", "id (PK), bookId (FK), barcode (UQ), location, shelfNumber, status", "Tracks physical copy inventory mapped to library rack coordinates."),
        ("IssueRecord", "id (PK), bookCopyId (FK), userId (FK), issuedDate, dueDate, status", "Records active loans, return timestamps, and renewal counters."),
        ("Fine", "id (PK), issueRecordId (FK), userId (FK), amount, daysOverdue, status", "Audits overdue financial penalties assessed during book return."),
        ("Reservation", "id (PK), bookId (FK), userId (FK), queuePosition, status", "Manages patron book hold queues with priority scoring."),
        ("SeatBooking", "id (PK), userId (FK), seatCode, roomType, startTime, endTime, status", "Tracks reading hall and digital lab reservations in real time."),
        ("ActivityLog", "id (PK), userId (FK), action, details, currentHash, previousHash", "Provides a tamper-evident SHA-256 cryptographic audit trail.")
    ]
    add_table_with_caption(doc, ["Table Name", "Important Columns & Constraints", "Functional Purpose"], t11_3_data, [Cm(2.6), Cm(8.6), Cm(5.0)], "Table 11.3 - Database tables")

    code_11_1 = (
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
    add_code_listing(doc, code_11_1, "Listing 11.1 - IssueRecord table definition")

    add_body_paragraph(doc, "User (1:N) IssueRecord, Book (1:N) BookCopy, BookCopy (1:N) IssueRecord, IssueRecord (1:N) Fine, User (1:N) Reservation, User (1:N) SeatBooking.", bold_prefix="Key Entity Relationships: ")

    add_section_heading(doc, "11.8 REST API Endpoints & Integration")
    add_body_paragraph(doc, "The Express backend exposes a comprehensive suite of RESTful endpoints adhering to standard HTTP verbs and JSON serialization. Every endpoint is protected by JWT authentication middleware and validated against declarative Zod schemas.")

    t11_4_data = [
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
    add_table_with_caption(doc, ["API Endpoint & Method", "Access Authorization", "Functional Description"], t11_4_data, [Cm(5.0), Cm(3.2), Cm(8.0)], "Table 11.4 - Core REST API endpoints")

    add_section_heading(doc, "11.9 Security, Auditability & Performance Optimization")
    sec_c11 = [
        ("Authentication & Password Hashing: ", "User credentials are protected using bcryptjs with 10 salt rounds. Client sessions rely on HMAC-SHA256 signed JWT tokens containing member ID, expiration timestamps, and authorized role claims."),
        ("Cryptographic Audit Ledger: ", "Sensitive transactions (book checkouts, catalog imports, fee waivers) append immutable records to the ActivityLog table using SHA-256 hash chaining (currentHash = SHA256(previousHash + userId + action + timestamp)), ensuring complete non-repudiation."),
        ("Database Connection Pooling: ", "Backend services utilize PgBouncer on Supabase Cloud to maintain persistent pool connections, eliminating connection starvation during concurrent query bursts."),
        ("AI Inference Caching: ", "Prompt-response pairs are cached in the AICache table using SHA-256 prompt hashing with a 24-hour TTL, slashing redundant API calls and maintaining instantaneous sub-100ms response times.")
    ]
    for lbl, txt in sec_c11:
        add_body_paragraph(doc, txt, bold_prefix=f"• {lbl}", space_after=2, left_indent=0.2)

    add_section_heading(doc, "11.10 Project Conclusion")
    add_body_paragraph(doc, "LibraAI successfully achieves its primary objective of modernizing institutional library management through a robust, cloud-native web architecture combined with state-of-the-art generative artificial intelligence. By automating circulation desks, providing real-time Recharts visualization, and integrating conversational study assistants, the system eliminates manual administrative burdens, enforces stringent audit compliance, and elevates the academic learning experience for campus scholars.")

    doc.save(DOCX_OUTPUT_PATH)
    print(f"Successfully created complete document: {DOCX_OUTPUT_PATH}")

if __name__ == "__main__":
    build_complete_report()
