#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LectureOS — Teardown"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Stopping all containers..."
docker compose -f infra/docker-compose.yml down
echo "  ✓ Containers stopped"

echo ""
read -p "Delete all data volumes? This wipes the database. (y/N): " confirm
if [ "$confirm" = "y" ]; then
  docker compose -f infra/docker-compose.yml down -v
  echo "  ✓ Volumes deleted — database wiped clean"
  echo "  Run pnpm setup to start fresh"
else
  echo "  ✓ Volumes kept — your data is preserved"
  echo "  Run: docker compose -f infra/docker-compose.yml up -d to restart"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
