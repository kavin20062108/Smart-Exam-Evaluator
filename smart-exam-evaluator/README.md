# 🎓 Smart Exam Evaluator

A production-ready full-stack web application for creating, administering, and auto-evaluating objective-type exams with role-based access for admins and students.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | MySQL 8+ |
| ORM | Sequelize |
| Auth | JWT + bcrypt |
| Charts | Recharts |
| Styling | Vanilla CSS (dark theme) |

---

## 📁 Project Structure

```
smart-exam-evaluator/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── api/         # Axios instance with JWT interceptor
│   │   ├── components/  # Navbar, ProtectedRoute, Timer
│   │   ├── context/     # AuthContext (global auth state)
│   │   └── pages/
│   │       ├── auth/    # Login, Register
│   │       ├── admin/   # Dashboard, ExamManager, QuestionManager, Results, Analytics
│   │       └── student/ # Dashboard, ExamList, TakeExam, Result, History, Leaderboard
│   └── vercel.json      # Vercel SPA routing config
└── server/               # Node.js + Express backend
    ├── config/          # Sequelize DB connection
    ├── models/          # User, Exam, Question, Attempt, Answer
    ├── middleware/      # JWT auth, role-based access
    ├── routes/          # Auth, Exams, Questions, Attempts, Analytics
    ├── controllers/     # Business logic
    └── validators/      # Joi schemas
```

---

## ⚙️ Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MySQL 8+](https://dev.mysql.com/downloads/mysql/)

### Step 1 — Create MySQL Database

Open MySQL Workbench or MySQL shell and run:
```sql
CREATE DATABASE smart_exam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2 — Configure Backend

```bash
cd smart-exam-evaluator/server
```

Edit `.env` and fill in your values:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_exam_db
DB_USER=root
DB_PASS=your_mysql_password   # ← CHANGE THIS

JWT_SECRET=your_super_secret_key_here  # ← CHANGE THIS (use a long random string)
JWT_EXPIRES_IN=7d

NEGATIVE_MARKS_FRACTION=0.25
CLIENT_URL=http://localhost:5173
```

Install dependencies:
```bash
npm install
```

Start the backend (auto-syncs DB tables on first run):
```bash
npm run dev
```

✅ You should see:
```
✅ MySQL connected
✅ All models synchronized
🚀 Server running on port 5000
```

### Step 3 — Configure Frontend

```bash
cd smart-exam-evaluator/client
```

The `.env` file is pre-configured:
```env
VITE_API_URL=http://localhost:5000/api
```

Install dependencies:
```bash
npm install
```

Start the frontend:
```bash
npm run dev
```

✅ App runs at: **http://localhost:5173**

---

## 👥 User Roles & Features

### 🔑 Admin
| Feature | Description |
|---------|------------|
| Dashboard | Stats overview, attempts chart |
| Exam Manager | Create / Edit / Delete exams |
| Question Manager | Add / Edit / Delete questions per exam |
| Results | View all student submissions, filter by exam |
| Analytics | Pass/fail pie, difficulty radar, bar charts |

### 🎓 Student
| Feature | Description |
|---------|------------|
| Dashboard | Available exams, recent scores |
| Exam List | Browse all exams, see your score if attempted |
| Take Exam | ⏱️ Countdown timer, 1 question per page, auto-submit |
| Result | Score, rank, correct/wrong/negative, answer review |
| History | All your attempts with ranks |
| Leaderboard | Per-exam rankings with trophy icons |

---

## 🔐 Security Features

- ✅ **JWT authentication** — tokens stored in `localStorage`, sent as `Bearer` header
- ✅ **bcrypt** — 12 salt rounds for password hashing
- ✅ **Helmet** — sets secure HTTP headers
- ✅ **Rate Limiting** — 100 req/15min per IP via `express-rate-limit`
- ✅ **CORS** — configured to allow only `CLIENT_URL`
- ✅ **Joi validation** — all route inputs validated server-side
- ✅ **Role middleware** — admin-only and student-only routes enforced
- ✅ **Unique constraint** on `(student_id, exam_id)` prevents duplicate attempts
- ✅ **Sequelize transactions** — exam evaluation is fully atomic

---

## 📊 Evaluation Logic

When a student submits an exam, the server:
1. Compares each submitted answer to `correct_answer` in the DB
2. Awards full `marks` for correct, deducts `marks × NEGATIVE_MARKS_FRACTION` for wrong
3. Skipped answers score 0 (no penalty)
4. Calculates `total_score`, `percentage`, `correct_count`, `wrong_count`, `negative_marks`
5. Runs `RANK() OVER (PARTITION BY exam_id ORDER BY total_score DESC)` to compute rank

---

## 🌐 Production Deployment

### Frontend → Vercel

1. Push `client/` to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Set **Root Directory** to `client`
4. Add environment variable:
   ```
   VITE_API_URL = https://your-render-backend.onrender.com/api
   ```
5. Deploy — `vercel.json` handles SPA routing automatically ✅

### Backend → Render

1. Push `server/` to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add all environment variables from `server/.env` (use a cloud MySQL like **PlanetScale** or **Aiven**)
5. Deploy ✅

### Cloud MySQL Options (Free Tier)
| Provider | Free Tier | Notes |
|----------|-----------|-------|
| [Aiven](https://aiven.io) | 1 month free | MySQL 8, SSL |
| [Railway](https://railway.app) | $5 credit | MySQL, easy setup |
| [PlanetScale](https://planetscale.com) | Free hobby | MySQL-compatible |

---

## 🔑 Environment Variables Reference

### Backend (`server/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `smart_exam_db` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASS` | MySQL password | `yourpassword` |
| `JWT_SECRET` | JWT signing key | `a-long-random-string` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `NEGATIVE_MARKS_FRACTION` | Penalty fraction | `0.25` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |

### Frontend (`client/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## 📈 Progress Tracker

| Day | Module | Status |
|-----|--------|--------|
| Day 1 | Project Setup & DB Models | ✅ Complete |
| Day 2 | Auth Module (Backend + Frontend) | ✅ Complete |
| Day 3 | Admin Backend APIs | ✅ Complete |
| Day 4 | Admin Frontend UI | ✅ Complete |
| Day 5 | Student Backend APIs | ✅ Complete |
| Day 6 | Student Frontend UI | ✅ Complete |
| Day 7 | Smart Features & Analytics | ✅ Complete |
| Day 8 | Security Hardening | ✅ Complete |
| Day 9 | Deployment Documentation | ✅ Complete |

---

## 📜 Available API Routes

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login, returns JWT |

### Exams
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/exams` | Auth | List all exams |
| GET | `/api/exams/:id` | Auth | Get exam by ID |
| POST | `/api/exams` | Admin | Create exam |
| PUT | `/api/exams/:id` | Admin | Update exam |
| DELETE | `/api/exams/:id` | Admin | Delete exam |

### Questions
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/questions/exam/:id` | Auth | Get questions (shuffled for students) |
| POST | `/api/questions` | Admin | Add question |
| PUT | `/api/questions/:id` | Admin | Update question |
| DELETE | `/api/questions/:id` | Admin | Delete question |

### Attempts
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/attempts/start` | Student | Start exam |
| POST | `/api/attempts/:id/submit` | Student | Submit + evaluate |
| GET | `/api/attempts/my` | Student | My attempt history |
| GET | `/api/attempts/:id/result` | Student | View result |
| GET | `/api/attempts/admin/results` | Admin | All results |
| GET | `/api/attempts/leaderboard/:examId` | Auth | Leaderboard |

### Analytics
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/analytics/exam/:id` | Admin | Exam stats |
| GET | `/api/analytics/difficulty/:id` | Auth | Difficulty breakdown |
