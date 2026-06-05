"""Celery tasks for pipeline execution."""
from tasks.celery_app import celery_app


@celery_app.task
def run_pipeline_task(lecture_id: str) -> None:
    # TODO: chain agent tasks for lecture pipeline
    pass
