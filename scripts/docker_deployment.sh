#!/bin/bash
#catch ctrl+c to stop all containers
trap cleanup SIGINT


## Help message
usage () {
    echo "Usage: $0"
    exit 1
}
#start docker containers 
start_coquitones() {
    docker compose up -d
}

#redirect log output to files
tail_logs() {
    LOG_DIR="log"
    mkdir -p $LOG_DIR
    for name in $(docker compose ps -q | xargs docker inspect --format '{{.Name}}' | sed 's|/||'); 
    do
        docker logs -f "$name" > "${LOG_DIR}/${name}.log" 2>&1 &
    done
    docker compose logs -f frontend
}

# === Cleanup handler ===
cleanup() {
    docker compose stop
    exit 0
}

# MAIN:
if [$# -ne 0 ]; then
    usage
fi

start_coquitones

# === Instructions ===
echo
echo "🌐 App is running!"
echo "🛑 Press Ctrl+C to stop all services."

tail_logs

