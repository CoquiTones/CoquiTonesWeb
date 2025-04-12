#!/bin/bash

echo "Cleaning project files..."

# Define paths
FRONTEND_DIR="frontend"
VENV_DIR=".venv"
LOG_DIR="log"

# Clean Frontend artifacts
if [ -d "${FRONTEND_DIR}/node_modules" ]; then
    rm -rf "${FRONTEND_DIR}/node_modules"
    echo "Removed ${FRONTEND_DIR}/node_modules"
fi

if [ -d "${FRONTEND_DIR}/dist" ]; then
    rm -rf "${FRONTEND_DIR}/dist"
    echo "Removed ${FRONTEND_DIR}/dist"
fi

# Clean Python virtual environment
if [ -d "$VENV_DIR" ]; then
    rm -rf "$VENV_DIR"
    echo "Removed virtual environment: ${VENV_DIR}"
fi

# Clean logs
if [ -d "$LOG_DIR" ]; then
    rm -rf "$LOG_DIR"
    echo "Removed log directory: ${LOG_DIR}"
fi

echo "✅ Cleanup complete."
