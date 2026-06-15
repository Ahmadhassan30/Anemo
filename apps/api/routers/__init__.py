"""API router package exports."""
from . import auth, chat, lectures, pipeline, students, video, youtube

# TODO: expose router modules for centralized access
__all__ = ["auth", "chat", "lectures", "pipeline", "students", "video", "youtube"]

