#!/bin/bash

set -e  # Exit on errors

# === Setup ===
mkdir -p log
cwd=$(pwd)
backend_logfile="${cwd}/log/backend.log"
frontend_logfile="${cwd}/log/frontend.log"
db_log="${cwd}/log/db_log.log"

echo "Logging to:"
echo "  Backend:  ${backend_logfile}"
echo "  Frontend: ${frontend_logfile}"
echo "  Database: ${db_log}"
touch "${backend_logfile}" "${frontend_logfile}" "${db_log}"

# === Cleanup handler ===
cleanup() {
    echo -e "\nShutting down processes..."
    [[ -n "$backend_pid" ]] && kill "$backend_pid" && echo "Backend stopped"
    [[ -n "$frontend_pid" ]] && kill "$frontend_pid" && echo "Frontend stopped"
    docker compose down && echo "Database stopped"
    exit 0
}

trap cleanup SIGINT

# === Start Database ===
echo "Starting database..."
docker compose down >> "${db_log}" 2>&1
docker compose up -d --build >> "${db_log}" 2>&1
echo "Database started"

# === Start Backend ===
echo "Starting backend..."
uvicorn --app-dir Backend/src app:app --host 0.0.0.0 --port 8080 > "${backend_logfile}" 2>&1 &
backend_pid=$!
echo "Backend started [PID: $backend_pid]"

# === Start Frontend ===
echo "Starting frontend..."
cd Frontend
npm run start > "${frontend_logfile}" 2>&1 &
frontend_pid=$!
cd ..
echo "Frontend started [PID: $frontend_pid]"

# === Instructions ===
echo
echo "🌐 App is running!"
echo "👉 Backend logs:  tail -f log/backend.log"
echo "👉 Frontend logs: tail -f log/frontend.log"
echo "👉 DB logs:       tail -f log/db_log.log"
echo "🛑 Press Ctrl+C to stop all services."

# === Wait until frontend exits (usually stays up unless dev server is stopped) ===
wait "$frontend_pid"
