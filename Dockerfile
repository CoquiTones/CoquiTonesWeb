FROM node:latest as builder

WORKDIR /app

COPY Frontend/ ./Frontend

RUN cd Frontend && npm install && npm run build


FROM python:latest

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY Backend/src ./src

# Copy the built frontend assets from the builder stage
COPY --from=builder /app/Frontend/build /app/Frontend/build

# Command to start the backend server
# CMD ["uvicorn", "--reload", "src.app:app", "--host", "0.0.0.0"]
