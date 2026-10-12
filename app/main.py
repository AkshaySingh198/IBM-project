from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.api.v1 import auth, roles, cases, reveal_requests, audit, reports, overrides

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication & Registration"])
app.include_router(roles.router, prefix=f"{settings.API_V1_STR}", tags=["RBAC & Permissions"])
app.include_router(cases.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Fraud Cases"])
app.include_router(reveal_requests.router, prefix=f"{settings.API_V1_STR}", tags=["Gated Identity Reveal Lifecycle"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit-logs", tags=["Audit & Cryptographic Verification"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Compliance Reports"])
app.include_router(overrides.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Analyst AI Overrides"])

@app.get("/")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "use_ml_stubs": settings.USE_ML_STUBS
    }
