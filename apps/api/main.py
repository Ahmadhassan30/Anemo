"""FastAPI application entrypoint and router registration."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from db.session import init_db
from middleware.logging_middleware import LoggingMiddleware
from routers import auth, chat, lectures, pipeline, students, youtube


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="LectureOS API", version="1.0.0", lifespan=lifespan)

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
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "lectureos-api"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    detail = str(exc) if settings.APP_ENV == "development" else "Internal server error"
    return JSONResponse(status_code=500, content={"detail": detail})
