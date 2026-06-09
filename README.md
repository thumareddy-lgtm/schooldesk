# SchoolDesk — School Management SaaS

A complete, multi-tenant School Management platform built with **FastAPI + React + PostgreSQL**.

## Features

- **Multi-tenant** — each school has isolated data
- **JWT Authentication** — secure school-level login
- **Dashboard** — live metrics (students, attendance, fees, exams)
- **Students** — add/edit/search students, manage classes
- **Attendance** — mark present/absent/leave by class per day
- **Fees** — create fee records, collect payments, auto-generate receipts
- **Exams** — schedule exams, enter marks, auto-calculate grades
- **Notices** — post pinnable announcements by audience
- **Settings** — school profile + Razorpay subscription plans
- **Fully mobile responsive** — works on any device

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL 15+ |
| Frontend | React 18, Vite, Tailwind CSS |
| Auth | JWT (python-jose + passlib bcrypt) |
| Payments | Razorpay |
| Deployment | Render.com |

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

---

### 1. Clone & setup backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` from the example:
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/schooldesk
SECRET_KEY=your-random-secret-key-at-least-32-chars
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
FRONTEND_URL=http://localhost:5173
```

Create the database:
```bash
psql -U postgres -c "CREATE DATABASE schooldesk;"
```

Run the backend (tables auto-created on first start):
```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

### 2. Setup frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

Run the frontend:
```bash
npm run dev
```

App available at: http://localhost:5173

---

## Deploy to Render.com

### Option A — One-click with render.yaml

1. Push code to GitHub
2. Go to https://dashboard.render.com → **New → Blueprint**
3. Connect your repo — Render reads `render.yaml` automatically
4. Add your Razorpay keys in the environment variable section
5. Click **Apply** — database + backend + frontend deploy together

### Option B — Manual

**Database:**
- New → PostgreSQL → Name: `schooldesk-db` → Region: Singapore → Free

**Backend (Web Service):**
- New → Web Service → connect repo
- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add env vars from `.env.example` (use the DB's Internal Connection String)

**Frontend (Static Site):**
- New → Static Site → connect repo
- Root directory: `frontend`
- Build: `npm install && npm run build`
- Publish: `dist`
- Add `VITE_API_URL` = your backend URL

---

## Razorpay Setup

1. Create account at https://razorpay.com
2. Get API keys from Dashboard → Settings → API Keys
3. Create subscription plans in Razorpay Dashboard
4. Update plan IDs in `backend/app/routers/settings.py`
5. Add keys to `.env` or Render environment variables

---

## Project Structure

```
SchoolDesk/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── config.py          # Settings from .env
│   │   ├── database.py        # SQLAlchemy engine & session
│   │   ├── models/
│   │   │   └── models.py      # All DB models
│   │   ├── schemas/
│   │   │   └── schemas.py     # Pydantic request/response schemas
│   │   ├── auth/
│   │   │   └── auth.py        # JWT auth utilities
│   │   └── routers/
│   │       ├── auth.py        # /auth/login, /auth/register
│   │       ├── dashboard.py   # /dashboard/metrics
│   │       ├── students.py    # /students, /classes
│   │       ├── attendance.py  # /attendance
│   │       ├── fees.py        # /fees
│   │       ├── exams.py       # /exams
│   │       ├── notices.py     # /notices
│   │       └── settings.py    # /settings
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Routes + protected routes
│   │   ├── main.jsx           # React entry point
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── api.js         # Axios instance with JWT
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Modal.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Students.jsx
│   │       ├── Attendance.jsx
│   │       ├── Fees.jsx
│   │       ├── Exams.jsx
│   │       ├── Notices.jsx
│   │       └── Settings.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
│
├── render.yaml                # One-click Render deployment
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new school |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Get current user info |
| GET | `/dashboard/metrics` | Dashboard stats |
| GET/POST | `/students` | List / create students |
| GET/PUT/DELETE | `/students/{id}` | Get / update / deactivate student |
| GET/POST | `/classes` | List / create classes |
| POST | `/attendance/bulk` | Mark attendance for a class |
| GET | `/attendance/class/{id}` | Get attendance for a class on a date |
| GET/POST | `/fees` | List / create fee records |
| PUT | `/fees/{id}/collect` | Mark fee as paid |
| GET/POST | `/exams` | List / create exams |
| POST | `/exams/{id}/results` | Submit exam results |
| GET | `/exams/{id}/results` | Get exam results |
| GET/POST | `/notices` | List / create notices |
| GET/PUT | `/settings/school` | Get / update school profile |

---

## License

MIT — free for personal and commercial use.
