"""FastAPI application entrypoint and router registration."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import Settings
from routers import auth, chat, lectures, pipeline, students, youtube

settings = Settings()

app = FastAPI(title="LectureOS API")

# TODO: tune CORS and middleware options for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO: register routers and versioning
app.include_router(auth.router)
app.include_router(lectures.router)
app.include_router(pipeline.router)
app.include_router(students.router)
app.include_router(chat.router)
app.include_router(youtube.router)
