"""Celery tasks for quiz generation."""
from tasks.celery_app import celery_app


@celery_app.task
def generate_quiz_task(lecture_id: str) -> None:
    # TODO: run LLM quiz generation
    pass
