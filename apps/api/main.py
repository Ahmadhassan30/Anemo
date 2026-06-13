"""FastAPI application entrypoint and router registration."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import os
from fastapi.staticfiles import StaticFiles
from config import settings
from db.session import init_db
from middleware.logging_middleware import LoggingMiddleware
from routers import auth, chat, lectures, pipeline, students, youtube


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="LectureOS API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json"
)

# Ensure the static files directory exists
os.makedirs(settings.MANIM_OUTPUT_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.MANIM_OUTPUT_DIR), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(lectures.router, prefix="/api/v1")
app.include_router(pipeline.router, prefix="/api/v1")
app.include_router(students.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(youtube.router, prefix="/api/v1")


@app.get("/health")
@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "lectureos-api"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    detail = str(exc) if settings.APP_ENV == "development" else "Internal server error"
    return JSONResponse(status_code=500, content={"detail": detail})
