# 🚀 LibraAI Enterprise Deployment & Cloud Database Guide

This guide details the complete production deployment process for **LibraAI**, including migrating to Cloud PostgreSQL (Supabase, Neon, Railway, RDS), configuring production authentication security, and hosting frontend and backend services.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Cloud PostgreSQL Setup (Supabase / Neon / Railway)](#2-cloud-postgresql-setup)
3. [Switching Prisma from SQLite to PostgreSQL](#3-switching-prisma-from-sqlite-to-postgresql)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Backend Deployment (Render / Railway / VPS / Docker)](#5-backend-deployment)
6. [Frontend Deployment (Vercel / Netlify / Cloudflare)](#6-frontend-deployment)
7. [Batch Catalog Import (8,000+ Records)](#7-batch-catalog-import)
8. [Security Hardening & Production Verification](#8-security-hardening--production-verification)

---

## 1. Architecture Overview

```
[ Clients (Browser / PWA / Mobile) ]
                │
         HTTPS / WSS
                ▼
[ Vercel / Netlify Frontend (React + Vite + Tailwind) ]
                │
         REST API (JSON + SameSite Cookies)
                ▼
[ Cloud Backend (Node.js + Express + Prisma ORM) ]
                ├── OpenRouter AI (Gemini 2.5 Flash / Semantic Vector Search)
                └── Cloud PostgreSQL (Supabase / Neon / AWS RDS)
```

---

## 2. Cloud PostgreSQL Setup

LibraAI works out-of-the-box with any standard PostgreSQL 14+ database. Recommended providers:

### Option A: Supabase (Recommended)
1. Sign in to [Supabase](https://supabase.com) and create a new project.
2. Go to **Project Settings** -> **Database**.
3. Under **Connection Pooling**, copy the `Session` or `Transaction` connection string (Port `5432` or `6543`).
4. Example format:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

### Option B: Neon Serverless Postgres
1. Create a database project on [Neon.tech](https://neon.tech).
2. Copy the pooled connection string provided in the Neon console.
   ```env
   DATABASE_URL="postgresql://[USER]:[PASSWORD]@[ENDPOINT].neon.tech/neondb?sslmode=require"
   ```

### Option C: Railway PostgreSQL
1. Add a PostgreSQL service to your project on [Railway.app](https://railway.app).
2. Copy the `DATABASE_URL` variable automatically exposed by Railway.

---

## 3. Switching Prisma from SQLite to PostgreSQL

Switching from SQLite to Cloud PostgreSQL takes less than 2 minutes:

### Step 1: Update `server/prisma/schema.prisma`
Change the `datasource db` block from `sqlite` to `postgresql`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional, for Supabase migrations
}

generator client {
  provider = "prisma-client-js"
}
```

### Step 2: Push Schema & Generate Client
Run in the `server` directory:

```bash
cd server
npm run build
npx prisma db push
npx prisma generate
```

### Step 3: Seed Initial Admin & Roles
```bash
npm run seed
```
> The default admin specified in `.env` (`ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`) will be safely created with bcrypt cost 12 and `mustChangePassword: true`.

---

## 4. Environment Variables Reference

### Backend (`server/.env`)
| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Backend listening port | `5000` |
| `DATABASE_URL` | PostgreSQL or SQLite URI | `postgresql://user:pass@host:5432/libraai?sslmode=require` |
| `JWT_SECRET` | 64+ char random secret key | `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | Session token lifespan | `7d` |
| `COOKIE_DOMAIN` | Top-level cookie domain | `.yourcollege.edu` (or omit for same-origin) |
| `CORS_ORIGIN` | Allowed Frontend URL | `https://library.yourcollege.edu` |
| `ADMIN_EMAIL` | Initial Admin Email | `admin@college.edu` |
| `ADMIN_INITIAL_PASSWORD` | Initial Admin Password | `ComplexSecurePassword!2026` |
| `OPENROUTER_API_KEY` | OpenRouter API Key for AI | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | Default AI model | `google/gemini-2.5-flash` |

### Frontend (`client/.env.production`)
| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Full URL to Backend API | `https://api.library.yourcollege.edu` |

---

## 5. Backend Deployment

### Deploying to Render / Railway
1. Connect your GitHub repository.
2. Set Root Directory to `server`.
3. Configure Build & Start commands:
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
4. Add all environment variables listed in [Section 4](#4-environment-variables-reference).
5. Ensure Health Check endpoint is set to `/api/health`.

### Running on Ubuntu / Debian VPS with PM2
```bash
# Clone and enter server
git clone https://github.com/your-org/libraai.git
cd libraai/server

# Install dependencies & build
npm install
npx prisma db push
npm run seed
npm run build

# Start with PM2
pm2 start dist/index.js --name libraai-api -i max
pm2 save
pm2 startup
```

---

## 6. Frontend Deployment (Vercel / Netlify)

### Deploying to Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `client`.
3. Framework Preset: `Vite`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-backend-api.com`
5. Deploy!

### Deploying to Netlify
Ensure `client/public/_redirects` contains:
```
/*    /index.html   200
```
Build Command: `npm run build`
Publish Directory: `dist`

---

## 7. Batch Catalog Import (8,000+ Records)

LibraAI provides two methods to load large catalog datasets:

### Method 1: Web Interface (UI with Column Mapping & Progress)
1. Sign in as Admin.
2. Navigate to **Admin** -> **Import Books** (`/admin/import`).
3. Upload `.xlsx` / `.csv` file (or select preloaded `books.xlsx`).
4. Review column mapping (Title, Author, ISBN, Department, Accession Series).
5. Click **Start Batch Import**. Live progress and error summaries will be reported.

### Method 2: High-Speed CLI Script
To import millions or thousands of records directly into PostgreSQL:
```bash
cd server
npm run import-catalog
```

---

## 8. Security Hardening & Production Verification

- [x] **Rate Limiting:** Protects `/api/auth/login` (10 requests/15m) and AI endpoints.
- [x] **Password Hashing:** Bcrypt (Cost 12) with mandatory password change flag on first admin login.
- [x] **Session Handling:** HTTP-only, `SameSite=Strict` (or `Lax`), `Secure=true` in production cookies.
- [x] **RBAC Protected Routes:** Granular role middleware enforces `STUDENT`, `FACULTY`, `LIBRARIAN`, and `ADMIN` boundaries on all API routes.
- [x] **No Mock Data:** 100% of charts, analytics, and circulation metrics compute directly against Prisma tables.
- [x] **Audit Hash Chaining:** Immutable SHA-256 logs track every financial, administrative, and circulation action.
