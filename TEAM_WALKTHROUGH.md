# 🚗 DriveSense AI — Team Project Walkthrough & Architecture Guide

Welcome to the **DriveSense AI** project! This document serves as a complete technical and functional guide for all team members and hackathon judges to understand what was built, how the architecture operates, and how to perform a demo.

---

## 📌 Executive Summary

**DriveSense AI** is an AI-assisted driving license assessment ecosystem designed to make driving tests transparent, standardized, auditable, and resistant to corruption.

It replaces subjective paper-based testing with a **60:40 Score Fusion Model**:
- **60% AI Evaluation**: Computer Vision analytics for objective metric scoring (Lane discipline, Traffic compliance, Speed, Braking, Steering, Safety).
- **40% RTO Evaluation**: Physical vehicle inspection by Motor Vehicle Inspectors.

> ⚖️ **Legal Safeguard**: The AI system does NOT issue government licenses directly. It provides automated scoring recommendations, leaving the final licensing decision with authorized authorities.

---

## 🛠️ Technology Stack & Architecture

```
                       ┌──────────────────────────────────────────┐
                       │          DriveSense AI Web Client        │
                       │    (React 18 + TS + Tailwind + Vite)    │
                       └────────────────────┬─────────────────────┘
                                            │ HTTP / REST
                                            ▼
                       ┌──────────────────────────────────────────┐
                       │           Node.js Express Server         │
                       │    (JWT Auth + RBAC + REST Services)    │
                       └──────────┬────────────────────┬──────────┘
                                  │                    │
                ┌─────────────────┴──────┐      ┌──────┴────────────────┐
                │ SQLite Database (WAL)  │      │ Modular AI Analysis   │
                │   (15 Relational Tables)│      │  (Video Validation +  │
                └────────────────────────┘      │   Inference Pipeline) │
                                                └───────────────────────┘
```

| Layer | Technologies Used | Key Responsibilities |
|-------|-------------------|----------------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS v3, Recharts, Lucide Icons, jsPDF, Vite | Responsive UI, Role-Based Dashboards, Charts, PDF Generation |
| **Backend** | Node.js, Express.js, TypeScript, JWT, Multer | REST APIs, Authentication, RBAC, File Uploads |
| **Database** | SQLite via `better-sqlite3` (WAL mode) | 15 relational tables, transactional seeding & cascading deletes |
| **AI Module** | Modular TypeScript service with OpenCV/YOLO pluggable interface | Driving video validation, metric calculation, violation timestamps |

---

## 🚀 Module-by-Module Breakdown

### 1. Landing Page (`/`)
- **Hero Section**: Value proposition ("Transparent. Intelligent. Fair Driving Assessment.").
- **Visual Workflow**: 9-step interactive flow diagram from login to appeal.
- **Why DriveSense AI?**: Key feature cards (AI Evaluation, Transparent Scoring, Anti-Corruption, Human Review).
- **60:40 Score Fusion Visualizer**: Breakdowns for AI (60%) and RTO (40%).
- **Quick Demo Access Grid**: 1-click login buttons for all 4 roles.

### 2. Secure Applicant Login & DigiLocker (`/login`)
- Email/Password login & registration.
- **DigiLocker Mock Integration**: OAuth-style identity verification simulation with prototype disclaimers.
- **Quick Demo Selectors**: One-click login for Applicant, RTO Officer, Review Officer, and Admin.

### 3. Applicant Dashboard (`/applicant`)
- Profile card with Application ID (`DS-2026-001`) and DigiLocker verification badge.
- **E-Licence View**: Digital driving licence card display for existing licence holders.
- **Status Cards**: Learner Licence status, E-Test results, Driving Test booking, and Final Score badge.
- **Official Portal Guidance**: Prototype link to Parivahan Sewa external portal.

### 4. Learner Licence E-Test (`/applicant/learner-test`)
- 10 multiple-choice questions covering traffic signs, rules, and etiquette.
- Live 15-minute countdown timer, category badges, progress bar, and question grid navigator.
- Auto-calculated score requiring **7/10 to pass** to unlock driving test booking.

### 5. Driving Test Slot Booking (`/applicant/book-slot`)
- BookMyShow-style slot picker: RTO Test Center selection, Date selector, and Time slots with live status badges (*Available*, *Almost Full*, *Full*).
- Generates Candidate ID, Booking ID, and a scannable **QR code visual**.

### 6. RTO Officer Dashboard (`/rto`)
- Overview stats: Today's Tests, Pending AI, Pending RTO, Completed, Pass Rate.
- Filterable candidate table by status (`Scheduled`, `Video Uploaded`, `AI Analyzed`, `RTO Evaluated`, `Completed`).

### 7. Video Upload & AI Driving Validation (`/rto/candidate/:testId`)
- Video uploader supporting MP4, MOV, WebM, AVI (up to 500MB).
- **AI Driving Scene Validation Engine**: Automatically detects non-driving videos (movies, Spider-Man trailers, entertainment clips, black screens, or corrupt files <500KB) and rejects them:
  > *"Invalid Driving Video — Please upload a valid dashboard driving-test video."*
- Halts scoring until a valid driving video is provided.

### 8. AI Driving Analysis (`/rto/candidate/:testId`)
- Calculates scores across 6 criteria (Lane Discipline, Traffic Compliance, Speed, Braking, Steering, Safety).
- Generates timestamped violation events (e.g. `00:02:31 — Lane departure`).
- Visualized with custom Bar Charts and confidence ratings.

### 9. RTO Human Evaluation (`/rto/candidate/:testId`)
- 4 interactive score sliders (10 marks each) for Practical Vehicle Control, Manoeuvring, Observation, and Overall Performance.
- Inspector comment field and total score calculation (/40).

### 10. 60:40 Score Fusion Engine
- Automatically fuses scores: `Final Score = AI Score (60) + RTO Score (40)`.
- Evaluates against configurable pass threshold (default 70/100).

### 11. Results & Client PDF Generation (`/applicant/result/:testId`)
- Donut composition chart with centered score indicator (`86 / out of 100`).
- Structured legend cards showing AI and RTO score contributions.
- **Client-Side PDF Generator**: Exports an official assessment report PDF.

### 12. Human Review / Appeal Workflow (`/applicant/review-request/:resultId` & `/review`)
- Applicants can submit review requests with reasons and descriptions.
- Review Officer workspace (`/review/case/:reviewId`) allows reviewing video evidence, AI score logs, RTO comments, and submitting decisions: **Uphold Result**, **Modify Result**, or **Request Reassessment**.

### 13. System Admin Panel (`/admin`)
- Accessible via `/admin` for `admin` role (`admin@drivesense.com` / `demo123`).
- **User Management Table**: Filter by role, search by name/email/app ID.
- **Edit User Modal**: Edit name, email, role, phone, and licence statuses.
- **Delete User Modal**: Safe cascading deletion of user accounts and dependent test records.

### 14. Anti-Corruption Audit Trail (`/audit`)
- Immutable action log recording every operation with timestamp, user ID, role, action, and IP address.

---

## 👥 Seeded Teammate Demo Accounts

| Role | Email | Password | User Name | Initial State |
|------|-------|----------|-----------|---------------|
| **Applicant** | `aarav@demo.com` | `demo123` | Aarav Kumar | Scheduled driving test |
| **Applicant** | `meera@demo.com` | `demo123` | Meera Patel | Active licence holder (E-Licence view) |
| **Applicant** | `ananya@demo.com` | `demo123` | Ananya Reddy | Failed test with active review appeal |
| **RTO Officer** | `priya@rto.com` | `demo123` | Priya Sharma | Inspector at Chennai Central RTO |
| **Review Officer** | `reviewer@drivesense.com` | `demo123` | Review Officer | Appeals & Review Officer |
| **System Admin** | `admin@drivesense.com` | `demo123` | System Admin | Full access to `/admin` panel |

---

## 🎬 25-Step Live Presentation Guide for Teammates

Follow this sequence when presenting to judges:

1. **Open Landing Page** (`http://localhost:5173`) — Show Hero, 9-step workflow, 60:40 model explanation.
2. **Login as Applicant** — Click **Quick Demo Login → Applicant** (`aarav@demo.com`).
3. **Show Dashboard** — Point out Application ID (`DS-2026-001`) and status cards.
4. **Take E-Test** — Click **Start E-Test**, complete 10 MCQs, and pass (≥7/10).
5. **Book Slot** — Select **Chennai Central RTO**, pick a date/time slot, and generate QR confirmation.
6. **Logout & Login as RTO Officer** — Click **Quick Demo Login → RTO Officer** (`priya@rto.com`).
7. **Open Candidate Workspace** — Select candidate **Aarav Kumar**.
8. **Test Video Validation** — Upload an unrelated file or movie clip; click **Run AI Analysis** to demonstrate the red rejection banner (*"Invalid Driving Video"*).
9. **Upload Valid Driving Video** — Upload a valid driving clip and click **Run AI Analysis**.
10. **View AI Results** — Show AI score (/60), bar chart breakdown, and timestamped road events.
11. **RTO Evaluation** — Adjust 4 sliders (/40 marks), enter inspector comments, and click **Submit**.
12. **60:40 Score Fusion** — Show auto-fused Final Score (/100) and PASS/FAIL result.
13. **Applicant Result View** — Log back in as `aarav@demo.com`, view the donut chart, and click **Download Report** for the PDF certificate.
14. **Submit Appeal** — Click **Request Human Review**, select reason, and submit.
15. **Review Officer Decision** — Log in as `reviewer@drivesense.com`, review complaint and evidence, then uphold or modify the result.
16. **Admin Panel** — Log in as `admin@drivesense.com`, open `/admin`, edit a user profile, and demonstrate search/filter/deletion features.

---

## 🏃 Setup & Run Commands

```bash
# 1. Start Server
cd server
npm install
npm run dev

# 2. Start Client (in a separate terminal)
cd client
npm install
npm run dev
```

### Docker Run:
```bash
docker-compose up --build
```
