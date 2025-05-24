#!/bin/bash

## Help message
usage () {
    echo "Usage: $0"
    exit 1
}

start_coquitones() {
    docker compose up -d --build
}

tail_logs() {
    LOG_DIR="log"
    mkdir $LOG_DIR
    for name in $(docker compose ps -q | xargs docker inspect --format '{{.Name}}' | sed 's|/||'); 
    do
        docker logs -f "$name" > "${LOG_DIR}/${name}.log" 2>&1 &
    done

    docker compose logs -f frontend
}


if [$# -ne 0 ]; then
    usage
fi

start_coquitones
tail_logs

