from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, dashboard, students, attendance, fees, exams, notices, settings as settings_router

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SchoolDesk API",
    description="Multi-tenant School Management SaaS API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "capacitor://localhost",
        "ionic://localhost",
        "http://localhost",
        "https://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(fees.router)
app.include_router(exams.router)
app.include_router(notices.router)
app.include_router(settings_router.router)


@app.get("/")
def root():
    return {"message": "SchoolDesk API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
