"""Celery task package exports."""
from .celery_app import celery_app

# TODO: expose task modules
__all__ = ["celery_app"]
