FROM node:24

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

EXPOSE 5173
