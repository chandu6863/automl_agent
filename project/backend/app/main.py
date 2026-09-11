from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router, users_router
from app.api.datasets import router as datasets_router
from app.api.agent import router as agent_router
from app.api.automl import router as automl_router
from app.api.analytics import router as analytics_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.database.base import Base
from app.database.session import engine

configure_logging()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # For local dev/demo. Production uses Alembic migrations (see /alembic).
    import app.models  # noqa: F401 - ensures all models are registered on Base

    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check() -> dict:
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.ENV}


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(datasets_router)
app.include_router(agent_router)
app.include_router(automl_router)
app.include_router(analytics_router)

# Phase 5/6/7/8/9 routers (agent, experiments, models, blockchain) are added
# incrementally as those phases are implemented.
