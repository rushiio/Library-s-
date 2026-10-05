# 📚 LibraAI — Next-Gen AI-Powered College Library Management System

LibraAI is an enterprise-grade, full-stack Library Management System designed specifically for college and university libraries. It pairs high-speed institutional cataloging and barcode circulation with an advanced AI suite powered by OpenRouter LLMs, semantic vector search, syllabus matching, learning path generation, and real-time study seat booking.

---

## 🌟 Key Highlights & Feature Matrix

### 1. Data Ingestion & Catalog Engine
- **Excel Batch Importer (`/admin/import`):**
  - Ingests complex multi-sheet `.xlsx` workbooks (preloaded with `data/books.xlsx` containing **8,246 records** across **2,299 distinct titles**).
  - Fuzzy header auto-detection, column mapping studio, 20-row live preview, and duplicate merge engine.
  - Generates individual `BookCopy` accession barcodes (`D-1` through `D-8246`).
  - One-click `.xlsx` catalog export.
- **Amazon / Goodreads Style Catalog (`/catalog`):**
  - Dynamic subject-themed book cover generator ([CoverGenerator.tsx](file:///d:/libarr/client/src/components/books/CoverGenerator.tsx)).
  - Live availability badges (*"Available - 4 copies"* in green vs *"All issued - join waitlist"* in orange).
  - Multi-faceted filtering by Academic Department, Difficulty (*Beginner / Intermediate / Advanced*), and Availability.
  - Responsive Grid and List views with virtual pagination.
- **Book Detail & Physical Copy Inspector (`/book/:id`):**
  - Inventory table showing every physical copy, accession barcode, condition, price, and status.
  - **Interactive 2D Shelf Locator** with visual floor rack highlights.
  - Review & rating system with student XP rewards.

### 2. Complete Circulation Engine
- **Issue, Return, Renew, and Reserve:**
  - Dynamic loan periods (14 days student / 30 days faculty) with automatic due date computation.
  - One-click loan renewal with max 3-renewal limit and reservation locks.
  - Exam-aware priority waitlist scoring.
  - Automatic overdue fine calculation (₹5/day).
- **Fine Management & Waivers (`/librarian` & `/admin`):**
  - Member fine tracking, cash/UPI payment recording, and Librarian waiver approvals with mandatory audit reasons.
- **Mobile Camera QR/Barcode Scanner (`/scan`):**
  - In-browser live camera viewfinder scanner + USB barcode gun support.
  - Instant copy lookup and rapid one-tap Issue/Return with audio beep confirmation.

### 3. Advanced AI Suite (OpenRouter Gateway)
- **Floating AI Chatbot Librarian:** WhatsApp/ChatGPT-style floating assistant with live DB integration (checks active loans, due dates, renewal limits, catalog availability, and institutional rules) and speech-to-text voice input.
- **Smart Semantic Search:** 64-dimensional feature vector cosine similarity matching supporting English, Hindi, and Marathi queries.
- **Ask-the-Book (Interactive Book Q&A):** Interactive chat tab on every book page providing chapter and page citations for exam prep.
- **AI Learning Path Generator (`/learning-path`):** Multi-stage skill roadmaps (Full Stack, Data Science, VLSI, Robotics) mapped directly to library titles in our catalog.
- **Syllabus Matcher (`/syllabus-matcher`):** University syllabus unit parser that maps curriculum topics to library textbooks and reference books.
- **Interactive Knowledge Graph (`/knowledge-graph`):** 2D visual graph network exploring relationships between departments, topics, authors, and books.
- **Natural Language Admin BI Assistant (`/admin`):** Generates instant charts and statistics from queries like *"Which department has the lowest usage?"*.

### 4. Extra Smart Features & UX
- **Live Study Seat & Room Booking (`/seats`):** Visual interactive floor map with live occupancy indicators across *Silent Study*, *Group Discussion*, and *Digital Lab* zones.
- **Gamified Reading Streaks & Badges (`/my-shelf`):** Daily streaks, student XP points, and achievement badges (*'Bookworm'*, *'Speed Reader'*, *'Top Reviewer'*).
- **Tamper-Evident SHA-256 Audit Ledger (`/admin`):** Cryptographically hash-chained audit log with live 1-click integrity verification.
- **Accessibility & Multilingual Support:** Dark/Light mode, High Contrast mode, Dyslexia-friendly font toggle, and full English / Hindi (हिन्दी) / Marathi (मराठी) localization.
- **Progressive Web App (PWA):** Mobile-first design installable directly to mobile home screens with offline caching manifest.

---

## 🔐 Enterprise Authentication & Role-Based Access Control

LibraAI features a unified, secure login system designed for institutional campus environments:

- **Single Sign-In for All Roles:** A clean, branded login screen (`/login`) with no exposed role tabs, dropdowns, or credential hints. Upon verification, the user is automatically redirected to their specific dashboard (`/student`, `/faculty`, `/librarian`, or `/admin`).
- **Student Self-Registration:** Students can register at `/signup` with real-time password strength validation, department selection, and student roll number tracking. Self sign-up is strictly enforced on the server to `STUDENT` role only.
- **Admin Account Initialization:** The initial administrative user is provisioned via environment variables (`ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`) hashed with `bcryptjs` (cost factor 12) with `mustChangePassword: true` enforcing an immediate password change upon first login.
- **Session Security:** JWT access tokens transmitted via HTTP-only, `SameSite` cookies with fallback to Bearer tokens for mobile clients.
- **Defense in Depth:** Protected with Helmet security headers, rate limiting (10 attempts / 15m), and cryptographic SHA-256 audit logging.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, `@zxing/browser`, `canvas-confetti`, `axios`.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, JWT, `bcryptjs`, `helmet`, `cookie-parser`, `xlsx`, `pdf-parse`.
- **Database:** SQLite for development (`dev.db`), architected for instant deployment to Cloud PostgreSQL (Supabase / Neon / Railway / AWS RDS). See [DEPLOYMENT.md](file:///d:/libarr/DEPLOYMENT.md).
- **AI Integration:** OpenRouter API (`google/gemini-2.5-flash` / `anthropic/claude-3.5-haiku`) with local semantic embeddings and DB response caching.

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js:** v18+ (Tested on v24.16.0)
- **npm:** v9+

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd libarr

# Install backend & frontend packages
npm run install:all
```

### 3. Database Initialization & Seed
```bash
# Generate Prisma Client and initialize SQLite database
npm run prisma:generate
npm run prisma:push

# Seed base demo accounts (Admin, Librarian, Faculty, Student)
npm run prisma:seed

# (Optional) Seed rich demo circulation loans, overdue fines, and seat bookings
cd server && npx tsx prisma/seed_demo_circulation.ts
```

### 4. Running the Development Servers
In the project root, start both backend and frontend:
```bash
# Run backend (Port 5000)
npm run server:dev

# In a separate terminal, run frontend (Port 5173)
npm run client:dev
```

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 🧪 Automated Testing

Run the automated circulation and fine logic test suite:
```bash
cd server
npx tsx tests/circulation.test.ts
```
*Output:*
```
🧪 Running LibraAI Circulation & Fines Automated Logic Tests...
  ✅ PASS: Student demo user exists and has memberId STU001
  ✅ PASS: Librarian demo user exists with role LIBRARIAN
  ✅ PASS: Catalog contains 2,000+ distinct titles (actual: 2299)
  ✅ PASS: Catalog inventory contains 8,000+ physical copies (actual: 8246)
  ✅ PASS: Active loan correctly marks physical copy status as ISSUED
  ✅ PASS: Overdue issue calculates ₹5/day fine correctly (4 days = ₹20.00)
  ✅ PASS: Seat booking created in Silent Study zone
  ✅ PASS: Audit logs recorded with cryptographic SHA-256 hash
========================================
Test Results: 8 Passed, 0 Failed
========================================
```

---

## 📄 License & Institutional Usage
Developed for institutional academic library automation. Open-source under the MIT License.
