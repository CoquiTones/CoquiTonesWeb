FROM node:latest

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

# Do NOT build in dev mode; use Vite dev server
# COPY frontend/ ./frontend
# RUN npm run build

EXPOSE 5173
