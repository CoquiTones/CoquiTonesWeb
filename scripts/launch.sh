#!/bin/bash

mkdir log
backend_logfile=`$(pwd)/log/backend.log`
frontend_logfile=`$(pwd)/log/frontend.log`

## Database
docker compose up
echo "Database Started"
## Backend 
uvicorn --app-dir Backend/src app:app --host 0.0.0.0 --port 8080 > ${backend_logfile}
echo "Backend Started. To monitor use tail -f log/backend.log"

## Frontend
cd Frontend/
npm run start > ${frontend_logfile}
echo "Frontend Started. To monitor use tail -f log/frontend.log" 
