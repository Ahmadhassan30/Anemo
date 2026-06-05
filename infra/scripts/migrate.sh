#!/usr/bin/env bash
set -euo pipefail

# TODO: run Alembic migrations in the API container

docker compose -f ../docker-compose.yml exec api alembic upgrade head
