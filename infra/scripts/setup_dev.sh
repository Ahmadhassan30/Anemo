#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Anemo — Local Dev Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1 — Check Docker is running
echo "[1/8] Checking Docker..."
docker info > /dev/null 2>&1 || {
  echo "ERROR: Docker is not running. Start Docker Desktop first."
  exit 1
}
echo "  ✓ Docker is running"

# Step 2 — Copy env files if they don't exist
echo "[2/8] Setting up environment files..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  ✓ Created .env (root)"
fi

if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env
  echo "  ✓ Created apps/api/.env"
  echo "  ⚠ ACTION REQUIRED: Open apps/api/.env and fill in:"
  echo "      DEEPSEEK_API_KEY"
  echo "      JWT_SECRET (run: openssl rand -hex 32)"
fi

if [ ! -f apps/web/.env.local ]; then
  cp apps/web/.env.local.example apps/web/.env.local
  echo "  ✓ Created apps/web/.env.local"
  echo "  ⚠ ACTION REQUIRED: Open apps/web/.env.local and fill in:"
  echo "      UPLOADTHING_TOKEN"
  echo "      NEXTAUTH_SECRET (run: openssl rand -hex 32)"
fi

# Step 3 — Install Node dependencies
echo "[3/8] Installing Node dependencies..."
pnpm install
echo "  ✓ Node dependencies installed"

# Step 4 — Start Postgres and Redis first
echo "[4/8] Starting Postgres and Redis..."
docker compose -f infra/docker-compose.yml up -d postgres redis
echo "  ✓ Postgres and Redis containers started"

# Step 5 — Wait for Postgres to be ready
echo "[5/8] Waiting for Postgres to be ready..."
attempt=0
until docker compose -f infra/docker-compose.yml exec postgres \
  pg_isready -U anemo > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -gt 30 ]; then
    echo "ERROR: Postgres did not become ready in 60 seconds"
    echo "Run: docker compose -f infra/docker-compose.yml logs postgres"
    exit 1
  fi
  echo "  ...waiting (${attempt}/30)"
  sleep 2
done
echo "  ✓ Postgres is ready"

# Step 6 — Run Alembic migrations
echo "[6/8] Running database migrations..."
docker compose -f infra/docker-compose.yml run --rm api \
  alembic upgrade head
echo "  ✓ Migrations complete"

# Step 7 — Seed demo data (idempotent — deletes and re-inserts demo users)
echo "[7/8] Seeding demo data..."
docker compose -f infra/docker-compose.yml run --rm api \
  python -m db.seed
echo "  ✓ Demo data seeded"

# Step 8 — Start all remaining services
echo "[8/8] Starting all services..."
docker compose -f infra/docker-compose.yml up -d
echo "  ✓ All services started"

# Make all scripts executable
chmod +x infra/scripts/setup_dev.sh
chmod +x infra/scripts/health_check.sh
chmod +x infra/scripts/teardown.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Anemo is running!"
echo ""
echo "  App:      http://localhost"
echo "  API:      http://localhost/api/v1"
echo "  API Docs: http://localhost/api/v1/docs"
echo ""
echo "  Demo Professor: professor@demo.com / demo1234"
echo "  Demo Student:   student@demo.com / demo1234"
echo ""
echo "  NOTE: First pipeline run will download Whisper large-v3"
echo "  (~3GB). Watch progress with: pnpm logs:worker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
