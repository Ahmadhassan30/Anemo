#!/usr/bin/env bash
set -euo pipefail

# TODO: initialize local infrastructure dependencies

docker compose -f ../docker-compose.yml up -d postgres redis
