# backend.Dockerfile
FROM python:3.11-slim

# Set working dir to the project root, like VSCode does
WORKDIR /app

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy entire backend directory to match VSCode structure
COPY backend/ ./backend/

# Expose port (optional, for clarity)
EXPOSE 8080

# # Run Uvicorn just like in your VSCode setup
# CMD ["uvicorn", "--app-dir", "backend/src", "backend.src.app:app", "--reload", "--host", "0.0.0.0", "--port", "8080"]
