from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.database import engine
from app import models
from app.models import user, project, week, report
from app.database import Base
from app.routers import auth, users, projects, weeks, reports
from app import seed

Base.metadata.create_all(bind=engine)
seed.run()

app = FastAPI(title="AI Weekly Hub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(users.router, prefix="/api/v1/users")
app.include_router(projects.router, prefix="/api/v1/projects")
app.include_router(weeks.router, prefix="/api/v1/weeks")
app.include_router(reports.router, prefix="/api/v1/reports")


@app.get("/")
def root():
    return {"message": "AI Weekly Hub API"}
