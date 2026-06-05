"""Celery application initialization."""
from celery import Celery

celery_app = Celery("lectureos")

# TODO: configure broker, backend, and task routes
