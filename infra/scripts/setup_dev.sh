#!/usr/bin/env bash
set -euo pipefail

# Determine repository root relative to this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
cd "$REPO_ROOT"

echo "=== Setting up LectureOS Local Development ==="

# 1. Copy env files idempotently
if [ ! -f apps/api/.env ]; then
  echo "Copying .env.example to apps/api/.env..."
  cp .env.example apps/api/.env
else
  echo "apps/api/.env already exists."
fi

# 2. Copy web env files idempotently
if [ ! -f apps/web/.env.local ]; then
  echo "Copying .env.example to apps/web/.env.local..."
  cp .env.example apps/web/.env.local
else
  echo "apps/web/.env.local already exists."
fi

# 3. Start database and cache services
echo "Starting postgres and redis..."
docker compose -f infra/docker-compose.yml up -d postgres redis

# 4. Wait for database readiness
echo "Waiting for postgres to initialize..."
sleep 5

# 5. Run Alembic migrations
echo "Running alembic migrations..."
cd apps/api
DATABASE_URL=postgresql+asyncpg://lectureos:secret@localhost:5432/lectureos alembic upgrade head

# 6. Seed the database with demo accounts and lectures
echo "Running database seed..."
DATABASE_URL=postgresql+asyncpg://lectureos:secret@localhost:5432/lectureos python -m db.seed

# Return to root and run remaining containers
cd "$REPO_ROOT"


# 7. Start remaining services (api, worker, web, nginx)
echo "Starting all remaining LectureOS services..."
docker compose -f infra/docker-compose.yml up -d

# 8. Success message
echo "===================================================="
echo "LectureOS running at http://localhost"
echo "===================================================="

