# 🚗 DriveSense AI — AI-Assisted Automated Driving License Assessment Ecosystem

> **Transparent. Intelligent. Fair Driving Assessment.**
> An AI-assisted driving assessment ecosystem combining computer vision and standardized RTO evaluation to create transparent and auditable driving test results.

---

## 🌟 Concept & Vision

DriveSense AI aims to make driving license assessment more transparent, standardized, auditable, and resistant to corruption.
The system combines automated video analysis with human RTO evaluation using a **60:40 Score Fusion Model**:
- **60% AI Evaluation**: Computer Vision analytics for objective metric scoring (Lane discipline, Traffic compliance, Speed, Braking, Steering, Safety).
- **40% RTO Evaluation**: Physical driving inspection and vehicle handling checks by authorized Motor Vehicle Inspectors.

> ⚠️ **Government Disclaimer**: The AI system does NOT directly issue a government driving license. It generates an AI-assisted assessment score and recommendation. The final licensing authority remains with the authorized RTO officer.

---

## 🚀 Key Modules & Capabilities

1. **Landing Page & Public Portal**: Highlighting transparent scoring, 60:40 score fusion, and interactive workflow diagrams.
2. **Secure Applicant Portal**: Simulated DigiLocker OAuth identity verification and applicant dashboard.
3. **Learner Licence E-Test**: Interactive 10-MCQ test with real-time timer, category tagging, and automatic qualification logic.
4. **BookMyShow-Style Driving Slot Booking**: Interactive slot availability, RTO center picker, and QR code confirmation generation.
5. **RTO Officer Assessment Workspace**: Multi-candidate dashboard, driving video uploader, one-click AI computer vision runner, interactive 40-mark RTO evaluation sliders, and automatic 60:40 score fusion calculation.
6. **Result Generation & PDF Export**: Instant result calculation (PASS/FAIL at 70% threshold) with breakdown charts and client-side PDF certificate generator.
7. **Human Appeal / Review Mechanism**: Applicants can challenge results with reasons and descriptions; Review Officers examine video evidence, AI score logs, RTO comments, and uphold, modify, or re-assess the candidate.
8. **Admin Panel (`/admin`)**: Complete system administration dashboard to view all registered users, inspect application & licence statuses, edit user details/roles, and safely delete accounts with cascading cleanup.
9. **Anti-Corruption Audit Trail**: Immutable system action logging for all operations (login, test completion, slot booking, video upload, score calculation, review decision, admin modifications).

---

## 👥 Seeded Demo Accounts

To quickly test and showcase the hackathon prototype, use these pre-configured accounts:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| **Applicant** | `aarav@demo.com` | `demo123` | Active applicant with scheduled test |
| **Applicant** | `meera@demo.com` | `demo123` | Licence holder with e-licence |
| **Applicant** | `ananya@demo.com` | `demo123` | Failed candidate who submitted a review appeal |
| **RTO Officer** | `priya@rto.com` | `demo123` | Inspector at Chennai Central RTO |
| **Review Officer** | `admin@drivesense.com` | `demo123` | Appeals Officer |
| **System Admin** | `admin@drivesense.com` | `demo123` | Full access to `/admin` panel |

*Note: Quick demo login buttons are also provided directly on the Login page for one-click access.*

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v3, Recharts, Lucide React icons, jsPDF, Vite
- **Backend**: Express.js, TypeScript, better-sqlite3 (SQLite WAL mode), JWT, Multer (Video handling), Bcrypt
- **Database**: SQLite (Zero-config local database with 15 interconnected relational tables)
- **AI Service**: Modular computer vision pipeline (current prototype simulated inference engine with pluggable interface for Python/OpenCV/YOLO integration)

---

## ⚡ Quick Start & Run Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Install & Start Backend
```bash
cd server
npm install
npm run dev
```
*The server automatically initializes `drivesense.db` and populates realistic seed data on startup at `http://localhost:3001`.*

### 2. Install & Start Frontend
In a separate terminal window:
```bash
cd client
npm install
npm run dev
```
*Access the application at `http://localhost:5173`.*

---

## 🐳 Docker Setup

Run the entire ecosystem in containerized mode:

```bash
docker-compose up --build
```
Access the unified application at `http://localhost:3001`.

---

## 🎬 End-to-End Demo Walkthrough

1. Open `http://localhost:5173`
2. Click **"Applicant Login"** or use **"Quick Demo Login → Applicant"** (Aarav Kumar)
3. Take the **Learner E-Test** (10 MCQs) & pass
4. Book a driving test slot at **Chennai Central RTO**
5. Logout and click **"RTO Officer Login"** (Priya Sharma)
6. Open candidate **Aarav Kumar** from the scheduled candidates list
7. Click **"Upload Driving Test Video"** (Upload any test `.mp4` video)
8. Click **"Run AI Analysis"** to execute computer vision evaluation (generates /60 score and event timestamps)
9. Complete the **RTO Evaluation Form** (adjust 4 sliders for /40 marks & add inspector comments)
10. Click **"Submit RTO Evaluation"** → System automatically fuses scores (60:40) and publishes result
11. Logout and log back in as **Aarav Kumar** to view result report and download PDF
12. Click **"Request Human Review"** to appeal the result
13. Login as **Review Officer** (`admin@drivesense.com`) to inspect video, audit trail, and resolve appeal!
