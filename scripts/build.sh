#!/bin/bash

## Backend 
setup_backend () {
    echo "Setting up backend..."
    python3 -m venv .venv 
    source .venv/bin/activate
    pip3 install -r backend/requirements.txt
}

## Frontend
build_frontend () {
    echo "Building frontend..."
    cd frontend/
    npm install
    npm run build
    cd ..
}

## Help message
usage () {
    echo "Usage: $0 [-b] [-f]"
    echo "  -b    Setup backend"
    echo "  -f    Build frontend"
    echo "  -bf or -fb    Do both"
    exit 1
}

## Parse flags
if [ $# -eq 0 ]; then
    usage
fi

while getopts "bf" opt; do
    case $opt in
        b) setup_backend ;;
        f) build_frontend ;;
        *) usage ;;
    esac
done
