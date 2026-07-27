# DriveSense AI — Implementation Plan

A full-stack, demo-ready hackathon prototype for an AI-Assisted Automated Driving License Assessment Ecosystem.

## Technology Decisions

> [!IMPORTANT]
> **Single-stack Node.js approach chosen** over FastAPI/Python for these reasons:
> - Zero-config local setup (no Python venv + Node.js + PostgreSQL)
> - Single `npm install && npm run dev` to start everything
> - SQLite (file-based) instead of PostgreSQL — no database server needed
> - AI analysis module structured as a separate service interface, ready to plug in a Python microservice later
>
> **If you prefer FastAPI + PostgreSQL, let me know and I'll revise.**

### Final Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Vite + React 18 + TypeScript | Fast dev, modern tooling |
| Styling | Tailwind CSS v3 + Radix UI primitives | shadcn/ui-style components, professional look |
| Charts | Recharts | As specified |
| Backend | Express.js + TypeScript | Single language, fast iteration |
| Database | SQLite via better-sqlite3 | Zero config, file-based, perfect for hackathon |
| Auth | JWT tokens + bcrypt | Simple, self-contained, role-based |
| File Storage | Local filesystem (`uploads/`) | No external service needed |
| AI Module | Separate service interface with mock implementation | Pluggable for real OpenCV/YOLO later |
| PDF Generation | jsPDF (client-side) | Result report download |

---

## Project Structure

```
Drivesense/
├── README.md
├── .env.example
├── docker-compose.yml
├── Dockerfile
│
├── server/                          # Backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                 # Express app entry
│   │   ├── config.ts                # Environment config
│   │   ├── database/
│   │   │   ├── schema.ts            # SQLite schema & migrations
│   │   │   ├── seed.ts              # Demo data seeding
│   │   │   └── connection.ts        # DB connection
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT auth middleware
│   │   │   └── rbac.ts              # Role-based access control
│   │   ├── routes/
│   │   │   ├── auth.routes.ts       # Login, register, OTP mock
│   │   │   ├── applicant.routes.ts  # Applicant APIs
│   │   │   ├── learnerTest.routes.ts# E-test APIs
│   │   │   ├── booking.routes.ts    # Slot booking APIs
│   │   │   ├── rto.routes.ts        # RTO officer APIs
│   │   │   ├── video.routes.ts      # Video upload APIs
│   │   │   ├── aiAnalysis.routes.ts # AI analysis APIs
│   │   │   ├── evaluation.routes.ts # RTO eval + score fusion
│   │   │   ├── result.routes.ts     # Result generation
│   │   │   ├── review.routes.ts     # Human review APIs
│   │   │   └── audit.routes.ts      # Audit trail APIs
│   │   ├── services/
│   │   │   ├── ai-analysis.service.ts  # AI analysis interface + mock
│   │   │   ├── scoring.service.ts      # 60:40 score fusion
│   │   │   └── audit.service.ts        # Audit logging
│   │   └── types/
│   │       └── index.ts             # Shared TypeScript types
│   └── uploads/                     # Video file storage
│
├── client/                          # Frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css                # Tailwind + global styles
│       ├── lib/
│       │   ├── api.ts               # API client
│       │   ├── auth.ts              # Auth context + hooks
│       │   └── utils.ts             # Utilities
│       ├── components/
│       │   ├── ui/                   # Reusable UI primitives
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Table.tsx
│       │   │   ├── Progress.tsx
│       │   │   ├── Tabs.tsx
│       │   │   └── Select.tsx
│       │   ├── layout/
│       │   │   ├── Navbar.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── DashboardLayout.tsx
│       │   ├── ScoreGauge.tsx        # Circular score display
│       │   ├── AuditTimeline.tsx     # Audit trail timeline
│       │   ├── WorkflowSteps.tsx     # Visual workflow
│       │   └── PrototypeLabel.tsx    # "Prototype" badge
│       ├── pages/
│       │   ├── Landing.tsx           # Module 1
│       │   ├── Login.tsx             # Module 2
│       │   ├── DigiLockerMock.tsx    # Module 2 mock OAuth
│       │   ├── applicant/
│       │   │   ├── Dashboard.tsx     # Module 3
│       │   │   ├── ELicence.tsx      # Module 3
│       │   │   ├── LearnerTest.tsx   # Module 4
│       │   │   ├── BookSlot.tsx      # Module 5
│       │   │   ├── Result.tsx        # Module 12
│       │   │   └── ReviewRequest.tsx # Module 13
│       │   ├── rto/
│       │   │   ├── Dashboard.tsx     # Module 6
│       │   │   ├── CandidateView.tsx # Module 6 detail
│       │   │   ├── VideoUpload.tsx   # Module 7
│       │   │   ├── AIAnalysis.tsx    # Module 8
│       │   │   └── RTOEvaluation.tsx # Module 9
│       │   └── review/
│       │       ├── Dashboard.tsx     # Module 13
│       │       └── ReviewCase.tsx    # Module 13 detail
│       └── router.tsx               # React Router config
```

---

## Proposed Changes — Implementation Order

I'll build this in 6 phases, each producing a working increment:

---

### Phase 1: Project Scaffolding + Database + Auth (Foundation)

Everything depends on this. Get both apps running, database initialized, and auth working.

#### [NEW] Server Foundation
- `server/package.json` — Express, better-sqlite3, JWT, bcrypt, multer, cors, uuid
- `server/tsconfig.json` — TypeScript config
- `server/src/index.ts` — Express app with CORS, JSON parsing, route mounting
- `server/src/config.ts` — Environment variables
- `server/src/database/connection.ts` — SQLite connection
- `server/src/database/schema.ts` — All 15 tables (Module 15)
- `server/src/database/seed.ts` — Demo data (5 applicants, 5 bookings, etc.)
- `server/src/middleware/auth.ts` — JWT verification
- `server/src/middleware/rbac.ts` — Role checking middleware
- `server/src/routes/auth.routes.ts` — Login, register, demo login, DigiLocker mock
- `server/src/types/index.ts` — Shared types
- `server/src/services/audit.service.ts` — Audit logging service

#### [NEW] Client Foundation
- `client/package.json` — React, React Router, Tailwind, Recharts, Axios, Lucide icons, jsPDF
- `client/vite.config.ts` — Vite config with API proxy
- `client/tailwind.config.js` — Custom DriveSense theme (deep blue, cyan accents)
- `client/src/index.css` — Global styles, Tailwind directives
- `client/src/main.tsx` — React entry
- `client/src/App.tsx` — Router + Auth provider
- `client/src/router.tsx` — All routes with role guards
- `client/src/lib/api.ts` — Axios instance with auth interceptor
- `client/src/lib/auth.ts` — AuthContext, useAuth hook
- `client/src/lib/utils.ts` — Utility functions
- `client/src/components/ui/*` — All UI primitives (Button, Card, Input, Badge, Modal, Table, etc.)
- `client/src/components/layout/*` — Navbar, Sidebar, DashboardLayout
- `client/src/components/PrototypeLabel.tsx` — Reusable prototype badge

---

### Phase 2: Landing Page + Login + Applicant Dashboard (Modules 1-3)

#### [NEW] Pages
- `client/src/pages/Landing.tsx` — Hero, workflow visualization, features sections
- `client/src/pages/Login.tsx` — Email/password, OTP mock, DigiLocker button, role selector for demo
- `client/src/pages/DigiLockerMock.tsx` — Mock OAuth flow with prototype label
- `client/src/pages/applicant/Dashboard.tsx` — Profile, status cards, e-licence view
- `client/src/pages/applicant/ELicence.tsx` — E-licence details or "Apply" redirect

#### [NEW] API Routes
- `server/src/routes/applicant.routes.ts` — GET profile, GET dashboard data

---

### Phase 3: Learner E-Test + Slot Booking (Modules 4-5)

#### [NEW] Pages
- `client/src/pages/applicant/LearnerTest.tsx` — 10 MCQ questions, timer, progress bar, score
- `client/src/pages/applicant/BookSlot.tsx` — BookMyShow-style slot picker, confirmation

#### [NEW] API Routes
- `server/src/routes/learnerTest.routes.ts` — GET questions, POST submit, GET result
- `server/src/routes/booking.routes.ts` — GET centers, GET slots, POST book, GET booking

---

### Phase 4: RTO Dashboard + Video + AI Analysis + RTO Eval (Modules 6-9)

#### [NEW] Pages
- `client/src/pages/rto/Dashboard.tsx` — Metrics, scheduled candidates table
- `client/src/pages/rto/CandidateView.tsx` — Full assessment workspace
- `client/src/pages/rto/VideoUpload.tsx` — Upload widget, video player
- `client/src/pages/rto/AIAnalysis.tsx` — AI analysis results display
- `client/src/pages/rto/RTOEvaluation.tsx` — RTO scoring form

#### [NEW] API Routes & Services
- `server/src/routes/rto.routes.ts` — Dashboard data, candidates
- `server/src/routes/video.routes.ts` — Upload with multer, GET video
- `server/src/routes/aiAnalysis.routes.ts` — Trigger analysis, GET results
- `server/src/services/ai-analysis.service.ts` — Mock AI analysis with realistic scores/events
- `server/src/routes/evaluation.routes.ts` — RTO eval submission

---

### Phase 5: Score Fusion + Results + PDF (Modules 10-12)

#### [NEW] Services & Pages
- `server/src/services/scoring.service.ts` — 60:40 fusion logic
- `server/src/routes/result.routes.ts` — Generate result, GET result
- `client/src/pages/applicant/Result.tsx` — Score visualization, charts, PDF download
- `client/src/components/ScoreGauge.tsx` — Circular gauge component

---

### Phase 6: Human Review + Audit Trail (Modules 13-14)

#### [NEW] Pages & Routes
- `client/src/pages/applicant/ReviewRequest.tsx` — Review request form
- `client/src/pages/review/Dashboard.tsx` — Review officer dashboard
- `client/src/pages/review/ReviewCase.tsx` — Full case review workspace
- `client/src/components/AuditTimeline.tsx` — Timeline component
- `server/src/routes/review.routes.ts` — CRUD review requests
- `server/src/routes/audit.routes.ts` — GET audit logs

---

### Phase 7: Polish + Documentation

#### [NEW] Project Files
- `README.md` — Setup instructions, architecture, demo walkthrough
- `.env.example` — Environment variable template
- `Dockerfile` + `docker-compose.yml` — Containerization
- `client/src/components/WorkflowSteps.tsx` — Visual workflow component

---

## Database Schema (Module 15)

```sql
-- Core tables
users (id, email, password_hash, name, role, phone, created_at)
applicants (id, user_id, application_id, identity_verified, learner_licence_status, 
           driving_licence_status, licence_number, licence_class, issue_date, expiry_date)
rto_officers (id, user_id, officer_id, rto_center, designation)

-- Learner test
learner_tests (id, applicant_id, score, total, status, answers_json, started_at, completed_at)

-- Booking
test_centers (id, name, address, city, capacity)
test_slots (id, center_id, date, time, max_candidates, booked_count, status)
bookings (id, applicant_id, slot_id, booking_id, candidate_id, status, created_at)

-- Driving test
driving_tests (id, booking_id, applicant_id, officer_id, status, created_at)
videos (id, driving_test_id, filename, original_name, size, duration, uploaded_at)
ai_evaluations (id, driving_test_id, video_id, lane_discipline, traffic_compliance, 
               speed_management, braking_acceleration, steering_control, safe_behaviour,
               total_score, violations_json, confidence, status, analyzed_at)
rto_evaluations (id, driving_test_id, officer_id, vehicle_control, manoeuvring, 
                observation_awareness, overall_performance, total_score, comments, submitted_at)

-- Results
final_results (id, driving_test_id, ai_score, rto_score, final_score, 
              pass_threshold, status, generated_at)

-- Review
review_requests (id, final_result_id, applicant_id, reason, description, 
                status, reviewer_id, decision, reviewer_comments, created_at, resolved_at)

-- Audit
audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
```

---

## Demo Data (Module: Demo)

| Role | Email | Password | Name |
|------|-------|----------|------|
| Applicant | aarav@demo.com | demo123 | Aarav Kumar |
| Applicant | meera@demo.com | demo123 | Meera Patel |
| Applicant | rohit@demo.com | demo123 | Rohit Singh |
| Applicant | ananya@demo.com | demo123 | Ananya Reddy |
| Applicant | vikram@demo.com | demo123 | Vikram Joshi |
| RTO Officer | priya@rto.com | demo123 | Priya Sharma |
| RTO Officer | rajesh@rto.com | demo123 | Rajesh Menon |
| Review Officer | admin@drivesense.com | demo123 | Kavitha Nair |

Pre-seeded data:
- 3 test centers (Chennai Central RTO, Chennai South RTO, Chennai West RTO)
- 10 test slots across dates
- 5 bookings (3 completed assessments, 2 pending)
- 3 AI evaluations with violation data
- 3 RTO evaluations
- 3 final results (2 PASS, 1 FAIL)
- 1 human review request (on the FAIL result)
- 20+ audit log entries

---

## Demo Flow Verification

The complete 25-step demo flow will be verified:

1. ✅ Landing page loads with hero, workflow, features
2. ✅ Login as Aarav Kumar (applicant)
3. ✅ Dashboard shows profile, status cards
4. ✅ Take learner e-test (10 MCQ, timer, submit)
5. ✅ Pass with score ≥ 7/10
6. ✅ Book driving test slot
7. ✅ Logout
8. ✅ Login as Priya Sharma (RTO officer)
9. ✅ See Aarav in scheduled candidates
10. ✅ Open Aarav's assessment workspace
11. ✅ Upload driving test video
12. ✅ Run AI Analysis → get simulated score /60
13. ✅ View AI analysis breakdown
14. ✅ Enter RTO scores /40
15. ✅ Submit RTO evaluation
16. ✅ System auto-calculates final /100
17. ✅ Result generated (PASS/FAIL)
18. ✅ Logout
19. ✅ Login as Aarav Kumar
20. ✅ View final result with breakdown
21. ✅ Request human review
22. ✅ Login as Kavitha Nair (review officer)
23. ✅ See review request
24. ✅ Review full case (video, AI, RTO, audit)
25. ✅ Approve/modify review decision

---

## Open Questions

> [!IMPORTANT]
> **Stack confirmation**: I'm proposing Node.js (Express) + SQLite for the easiest possible local setup. The user mentioned FastAPI/Python as an option. Should I proceed with Node.js, or do you prefer a Python backend?

> [!IMPORTANT]
> **Tailwind CSS version**: You mentioned Tailwind CSS. I'll use **Tailwind CSS v3** (stable, well-supported). Tailwind v4 is newer but has breaking changes. Confirm v3 is acceptable?

> [!NOTE]
> **shadcn/ui**: Rather than installing the full shadcn/ui CLI (which requires specific Next.js/Vite setup), I'll build equivalent components using **Radix UI primitives + Tailwind** — this gives the same look and quality with simpler setup.

---

## Verification Plan

### Automated Tests
- `npm run build` — Both client and server must compile without errors
- Database schema creation + seeding runs without errors
- All API endpoints return expected responses

### Manual Verification
- Walk through the complete 25-step demo flow
- Verify role-based access (applicant can't access RTO routes)
- Verify score fusion calculation (AI + RTO = correct final)
- Verify audit trail captures all actions
- Test on different screen sizes (responsive)
