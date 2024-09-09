FROM node:latest as builder

WORKDIR /app
COPY Frontend/ ./Frontend
RUN cd Frontend && npm install && npm run build

CMD ["npm", "run", "start"]