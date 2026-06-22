"""Celery application initialization."""
from celery import Celery

from config import settings

celery_app = Celery(
    "lectureos",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "tasks.pipeline_tasks",
        "tasks.quiz_tasks"
    ]
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
    # Whole-pipeline time limits so a stuck render can't pin a worker forever.
    # Scaled for longer (input-matched) videos with more scenes.
    task_soft_time_limit=settings.CELERY_SOFT_TIME_LIMIT,
    task_time_limit=settings.CELERY_HARD_TIME_LIMIT,
)


@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    pass


from celery.signals import worker_process_init

@worker_process_init.connect
def on_worker_init(**kwargs):
    """Dispose SQLAlchemy engine pool on Celery worker fork."""
    try:
        from db.session import engine
        # Dispose the sync engine (which underlies the AsyncEngine)
        engine.sync_engine.dispose()
        import logging
        logging.getLogger("celery").info("Disposed SQLAlchemy engine connection pool on worker process start.")
    except Exception as e:
        import logging
        logging.getLogger("celery").exception("Failed to dispose engine connection pool: %s", e)

