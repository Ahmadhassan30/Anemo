"""Celery application initialization."""
from celery import Celery

from config import settings

celery_app = Celery(
    "lectureos",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,  # one task at a time per worker
)

celery_app.autodiscover_tasks(["tasks"])
