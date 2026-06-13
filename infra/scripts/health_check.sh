#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LectureOS — Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

all_healthy=true

check_container() {
  local name=$1
  status=$(docker compose -f infra/docker-compose.yml ps \
    --format json $name 2>/dev/null | \
    python3 -c "import sys,json; d=json.load(sys.stdin); \
    data = d if isinstance(d, list) else [d] if d else []; \
    print(data[0]['State'] if data else 'missing')" 2>/dev/null || echo "missing")
  if [ "$status" = "running" ]; then
    echo "  ✓ $name is running"
  else
    echo "  ✗ $name is $status"
    all_healthy=false
  fi
}

echo ""
echo "Containers:"
check_container "postgres"
check_container "redis"
check_container "api"
check_container "worker"
check_container "web"
check_container "nginx"

echo ""
echo "Endpoints:"

# API health
api_status=$(curl -s -o /dev/null -w "%{http_code}" \
  --connect-timeout 5 http://localhost/api/v1/health 2>/dev/null || echo "000")
if [ "$api_status" = "200" ]; then
  echo "  ✓ API health endpoint: 200 OK"
else
  echo "  ✗ API health endpoint: $api_status (not reachable)"
  all_healthy=false
fi

# Frontend
web_status=$(curl -s -o /dev/null -w "%{http_code}" \
  --connect-timeout 5 http://localhost 2>/dev/null || echo "000")
if [ "$web_status" = "200" ]; then
  echo "  ✓ Frontend: 200 OK"
else
  echo "  ✗ Frontend: $web_status (not reachable)"
  all_healthy=false
fi

# UploadThing check (just verify env var is set in web container)
echo ""
echo "UploadThing config:"
ut_set=$(docker compose -f infra/docker-compose.yml exec web \
  sh -c 'echo ${UPLOADTHING_TOKEN}' 2>/dev/null || echo "")
if [[ "$ut_set" == eyJ* ]]; then
  echo "  ✓ UPLOADTHING_TOKEN is configured"
else
  echo "  ✗ UPLOADTHING_TOKEN is not set or still a placeholder"
  echo "    → Open apps/web/.env.local and add your UploadThing token"
  all_healthy=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if $all_healthy; then
  echo "  All systems operational"
else
  echo "  Issues found — check output above"
  echo ""
  echo "  Debug commands:"
  echo "  pnpm logs:api      → FastAPI logs"
  echo "  pnpm logs:worker   → Celery worker logs"
  echo "  pnpm logs          → All logs"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
