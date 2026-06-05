#!/usr/bin/env bash
set -euo pipefail

# TODO: run the Celery worker for local development

docker compose -f ../docker-compose.yml up celery-worker
