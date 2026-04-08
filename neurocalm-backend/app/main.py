import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.models import *  # noqa: F401,F403 - ensure all models registered with Base
from app.routers import auth, users, analysis, history, reports, admin
from app.services.server_service import setup_log_capture
from app.utils.eeg_processor import load_model

settings = get_settings()
logger = logging.getLogger(__name__)


def _log_model_load_result(task: asyncio.Task):
    try:
        task.result()
    except Exception:
        logger.exception("Background ML model loading failed")


def _load_model_in_background(app: FastAPI) -> None:
    app.state.model_load_task = asyncio.create_task(asyncio.to_thread(load_model))
    app.state.model_load_task.add_done_callback(_log_model_load_result)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    await init_db()
    # Start capturing application logs for the admin server page
    setup_log_capture()
    model_load_mode = settings.MODEL_LOAD_MODE.lower()
    if model_load_mode == "sync":
        # Local/dev option: wait for the model before accepting requests.
        load_model()
    elif model_load_mode == "background":
        # Render/free-host option: keep auth/health responsive during cold starts.
        _load_model_in_background(app)
    else:
        logger.info("MODEL_LOAD_MODE=%s - model will load on first cache miss", settings.MODEL_LOAD_MODE)
    yield


app = FastAPI(
    title="NeuroCalm API",
    description="AI-Powered fNIRS Cognitive Workload Analysis Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api/v1
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(history.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": "NeuroCalm API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
