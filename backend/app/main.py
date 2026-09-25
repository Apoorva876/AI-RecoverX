from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.cases import router as cases_router
from app.api.artifacts import router as artifacts_router
from app.api.chat import router as chat_router
from app.api.reports import router as reports_router
from app.core.config import settings
from app.db.mongo import ensure_db_ready

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Forensic Recovery Copilot API",
)


@app.on_event("startup")
async def startup_event():
    await ensure_db_ready()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(cases_router, prefix="/api/cases", tags=["cases"])
app.include_router(artifacts_router, prefix="/api", tags=["artifacts"])
app.include_router(chat_router, prefix="/api/cases", tags=["chat"])
app.include_router(reports_router, prefix="/api/cases", tags=["reports"])


@app.get("/")
def root():
    return {"app": settings.app_name, "status": "online"}


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name}
