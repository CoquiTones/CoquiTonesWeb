# Stage 1: Build frontend static assets
FROM node:latest AS frontend-builder

WORKDIR /frontend

COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install

COPY ./frontend ./
RUN npm run build


# Stage 2: backend with static assets
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY ./backend/src ./backend/src

# Copy frontend build from previous stage
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# Expose the port (optional, in case you use docker run directly)
EXPOSE 8080