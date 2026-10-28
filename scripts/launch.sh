#!/usr/bin/env bash
#
# Launch the full CoquiTones stack with Docker Compose.
#
# This is the supported development startup: frontend, backend, PostgreSQL and
# the MQTT broker all run as containers on the compose network, so the backend
# can resolve `database` and `mqtt-broker` and serves HTTPS with the local certs.
#
# Usage:
#   ./scripts/launch.sh              # rebuild images, start, follow logs
#   ./scripts/launch.sh --no-build   # restart using existing images
#   Ctrl+C                           # stop and remove the containers
#
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

BUILD=1
usage() {
  cat <<'EOF'
Usage: ./scripts/launch.sh [--no-build]

  --no-build   Skip `docker compose build` and reuse existing images.
  -h, --help   Show this help.

The stack is reachable at:
  https://localhost:5173  Frontend dev server
  https://localhost:8080  Backend API + built frontend

On the first run, open https://localhost:8080 once and accept the self-signed
certificate, otherwise the browser will block API requests from the frontend.
EOF
}

for arg in "$@"; do
  case "${arg}" in
    --no-build) BUILD=0 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: ${arg}" >&2; usage >&2; exit 2 ;;
  esac
done

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "Missing $1. Copy $1.template (or restore the file) before starting." >&2
    exit 1
  fi
}

command -v docker >/dev/null 2>&1 || { echo "Docker is not installed or not on PATH." >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "The Docker Compose plugin is required." >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required to wait for backend readiness." >&2; exit 1; }

require_file "backend/src/.env"
require_file "frontend/.env"

if [[ ! -f "localhost.crt" || ! -f "localhost.key" ]]; then
  cat >&2 <<'EOF'
Missing localhost.crt / localhost.key.
Generate them from the project root with the openssl command in docs/README.md.
EOF
  exit 1
fi

cleanup() {
  echo
  echo "Stopping CoquiTones containers..."
  docker compose down --remove-orphans
  exit 0
}
trap cleanup INT TERM

echo "Starting CoquiTones (frontend, backend, database, mqtt-broker)..."
compose_args=(up -d --remove-orphans)
if (( BUILD )); then
  compose_args+=(--build)
fi
docker compose "${compose_args[@]}"

echo "Waiting for the backend to answer..."
backend_ready=0
for _ in $(seq 1 60); do
  if curl -ksf --max-time 2 https://localhost:8080/openapi.json >/dev/null 2>&1; then
    backend_ready=1
    break
  fi
  sleep 1
done

if (( ! backend_ready )); then
  echo "The backend did not become ready within 60 seconds." >&2
  docker compose ps >&2
  docker compose logs --tail=80 backend >&2
  
  exit 1
fi

docker compose ps

cat <<'EOF'

CoquiTones is running.

  Frontend: https://localhost:5173
  Backend:  https://localhost:8080  (also serves the built frontend)

First run only: open https://localhost:8080 and accept the self-signed
certificate, or the frontend's API calls will fail.

Streaming logs. Press Ctrl+C to stop and remove the containers.
EOF

# Follow all container logs in the foreground so Ctrl+C triggers cleanup.
docker compose logs -f --tail=20
