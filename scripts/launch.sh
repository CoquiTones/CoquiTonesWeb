#!/bin/bash

mkdir log
cwd=$(pwd)
backend_logfile=${cwd}/log/backend.log
frontend_logfile=${cwd}/log/frontend.log
echo "backend log: ${backend_logfile}"
touch ${backend_logfile}
touch ${frontend_logfile}
## Database
docker compose down &
docker compose up -d -build &
echo "Database Started"
## Backend 
uvicorn --app-dir Backend/src app:app --host 0.0.0.0 --port 8080 > ${backend_logfile} 2>&1 &
backend_pid=$!

echo "Backend Started. PID: ${backend_pid} To monitor use tail -f log/backend.log or opening them up in vscode"

## Frontend
cd Frontend/
npm run start > ${frontend_logfile} 2>&1 &
frontend_pid=$! 
echo "Frontend Started.  PID: ${frontend_pid}To monitor use tail -f log/frontend.log or opening them up in vscode" 

cleanup () {
    kill backend_pid
    kill frontend_pid
}

trap cleanup SIGINT 
