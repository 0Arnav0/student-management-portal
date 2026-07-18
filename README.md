# 🎓 Student Management System — Full-Stack Monorepo

A production-ready, full-stack Student Management System built as a unified web service. The Express backend handles the API routes and serves the compiled React single-page app as static files, resulting in a single deployable service with zero CORS configuration required.

This repository is a modern rebuild of a legacy codebase, migrating from **Angular + Prisma** to a high-performance **React 19 + TypeScript + Drizzle ORM** architecture inside a type-safe npm workspaces monorepo.

Project link:- https://student-management-portal.up.railway.app/login

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React 19 + Vite (TypeScript) | Fast Hot Module Replacement (HMR), optimized production builds, and component composition |
| **Styling** | Tailwind CSS v4 | Utility-first styling with high performance and zero configuration |
| **Icons** | Lucide React | Modern, clean vector icon pack |
| **Form Handling** | React Hook Form + Zod resolver | High-performance forms with client-side Zod validation |
| **Server State** | TanStack Query (React Query) | Dedicated server-state manager with automatic caching, background updating, and mutations |
| **Client State** | React Context API (`useContext`) | Built-in React primitive for simple, lightweight client-side state (user session, theme) |
| **Routing** | React Router v7 | Declarative routing with loaders, layouts, and route guards |
| **Toast Popups** | Sonner | Clean, modern, rich notification popups |
| **Backend** | Node.js + Express (TypeScript) | Lightweight, standard HTTP server framework |
| **Database** | PostgreSQL | Enterprise-grade relational database |
| **ORM** | Drizzle ORM | Lightest-weight TypeScript ORM. SQL-first, type-safe, and generates clean SQL |
| **Validation** | Zod (Shared) | Strict runtime schema validation sharing identical rules between frontend and backend |
| **Rate Limiting** | `express-rate-limit` | Protects auth and API endpoints from brute-force attacks and abuse |
| **Photos** | Multer (Memory) + Cloudinary | Streams image uploads from memory straight to Cloudinary (no local disk dependency) |
| **Logging** | Pino | Structured JSON logging for performance and searchability in production |

---

## 🏗️ Monorepo Architecture

The project is structured as an **npm Workspaces Monorepo** containing three sub-packages:

```text
student-portal/
├── packages/
│   └── shared/       # ⭐ Zod schemas, validation helpers, and TypeScript types
├── backend/          # Express API server + Drizzle ORM + Migrations
├── frontend/         # React SPA (Vite + Tailwind)
└── scripts/
    └── copy-dist.js  # Build helper: copies compiled frontend dist to backend/public/
```

### Key Advantages of this Monorepo:
1. **Single Source of Truth:** Zod schemas (e.g. `studentSchema`) are defined once in `packages/shared/` and imported by both the React form validation and the Express API request validation. Validation rules can never go out of sync.
2. **End-to-End Type Safety:** Database types and input payloads are exported across workspaces. Changing a database constraint or schema property immediately triggers TypeScript compile-time errors in both the backend and frontend components.

---

## ⚡ Key Production-Ready Features

*   **Atomic Sequence Generation:** Student admission numbers (e.g. `PU-2026-0001`) are generated atomically on database inserts using a PostgreSQL `SEQUENCE` (`student_admission_seq`) inside transactional queries to prevent race conditions.
*   **Secure Authentication:** User authentication is managed using stateless JWT tokens signed on the server and stored in secure, **httpOnly, sameSite=strict cookies**, preventing access from JavaScript (immune to XSS token theft).
*   **Dual-Layer Validation:** Inputs are checked instantly on the client using React Hook Form, and re-validated on the server with Zod. Server-side validation errors (422) are mapped back to input fields in the user interface automatically.
*   **Rate Limiting:** Protects `/api/auth/login` from brute-force scripts by restricting IP attempts (5 requests per 15 minutes) and limits standard API traffic to 100 requests per 15 minutes.
*   **Safe environment handling:** Startup config checks validate `process.env` keys with Zod immediately on startup, failing fast with informative messages if configs are wrong.
*   **No local filesystem dependencies:** Files uploaded using Multer are cached as buffers in memory and streamed directly to Cloudinary, ensuring compatibility with ephemeral systems (like Render's free tier).

---

## 🔌 API Endpoints Map

All API requests are prefixed with `/api` and return standard JSON payloads.

### Authentication (`/api/auth`)
*   `POST /api/auth/login` - Sign in user and set secure cookie (Rate limited: max 5 requests per 15 min).
*   `POST /api/auth/logout` - Clear JWT authentication cookie and log logout event.
*   `GET /api/auth/me` - Retrieve current logged-in staff session details.

### Student Registry (`/api/students`)
*   `GET /api/students` - Fetch paginated student records with dynamic search, sorting, and filters.
*   `GET /api/students/stats` - Fetch database aggregates for the analytics cards (Total count, Course count, Year breakdown, Gender ratio).
*   `GET /api/students/:id` - Fetch details of a single student by ID.
*   `POST /api/students` - Enroll a new student (accepts `multipart/form-data` for photo uploads).
*   `PUT /api/students/:id` - Update existing student record details.
*   `DELETE /api/students/:id` - Drop/Delete a student record from the system.

### User/Staff Administration (`/api/users`)
*   `GET /api/users` - List all staff users (Principal only).
*   `POST /api/users` - Create a new staff account (Principal only).
*   `PATCH /api/users/:id/active` - Toggle a staff user's active status (Principal only).

### Metadata (`/api`)
*   `GET /api/health` - Check API server system uptime and health check state.
*   `GET /api/meta` - Fetch static dropdown metadata constants (COURSES, GENDERS, YEARS) and Cloudinary status.

---

## 🚀 Local Setup & Configuration

### Prerequisites
*   Node.js 20+ and npm
*   A local or cloud PostgreSQL database instance
*   A Cloudinary account (optional — photo uploads disable gracefully if not configured)

### 1. Install Dependencies
Run the install command from the root folder. We use `--legacy-peer-deps` due to React 19 peer constraints on certain libraries:
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Copy the environment template from the original task or create a `.env` file under `backend/.env`:
```bash
cp ../Task/.env.example backend/.env
```
Open `backend/.env` and update the following configuration options:
*   `DATABASE_URL`: Your PostgreSQL connection string.
*   `JWT_SECRET`: A long random string.
*   `PRINCIPAL_EMAIL` & `PRINCIPAL_PASSWORD`: Initial credentials for the system administrator seeded on startup.
*   `CLOUDINARY_URL` (Optional): Cloudinary configuration string.

### 3. Generate and Run Migrations
Run the Drizzle Kit command to create the tables, enums, indexes, and admission number sequence in your PostgreSQL database, then run the seed script to create initial mockup students:
```bash
# Generate SQL migrations
npm run db:generate -w backend

# Apply migrations on your database
npm run db:migrate -w backend

# Seed 5 mockup students and logs (idempotent)
npm run seed -w backend
```

### 4. Start in Development Mode
To run the project in development mode, open two terminal windows and execute:

```bash
# Terminal 1: Starts Express API on http://localhost:3000
npm run dev:backend

# Terminal 2: Starts Vite dev server on http://localhost:4200 (proxies /api to 3000)
npm run dev:frontend
```

Open `http://localhost:4200` in your web browser. You can log in using the email and password you set for `PRINCIPAL_EMAIL` and `PRINCIPAL_PASSWORD` in your `.env` file.

### 5. Running the Unified Production Build Locally
To test the production behavior where Express serves the static React application:
```bash
# Builds shared, compiles React, copies output to backend/public, compiles Express TS
npm run build

# Runs database migrations and starts the Express production server
npm run start -w backend
```
Open `http://localhost:3000` in your browser.

---
