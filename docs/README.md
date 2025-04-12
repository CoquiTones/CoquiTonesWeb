# Deploy Local Development Environment

## Database

In local development, the database is created using a docker container. You can spin up this container using docker compose and our docker-compose.yml file.

There is yet another vs code extension that facilitates this but you can execute it manually using the following commands

`docker compose up` -> creates the container/s for database initallized with dummy sql data from our init.sql file
`docker compose restart`
`docker compose down`-> stops the containers

Important note: Currently, it is up to you to clean up images, containers that may be used during development.

monitor docker usage using `docker images`, `docker prune` etc.

## Backend

#### Installation

1. Use python3 virtual env
   `python3 -m venv .venv`
2. Activate venv in terminal
   Linux: `source .venv/bin/activate`
   Windows: `.venv\Scripts\activate.bat`
3. Install dependencies
   `pip3 install -r backend/requirements.txt`

#### Launching Backend Server

Simply launch a debug session in vscode using the [launch.json](../.vscode/launch.json) configuration in .vscode

Another method would be to use the python and uvicorn cli commands similar to this

## Frontend

Prepare environment variables. Modify the `frontend/.env.template` file and remove the ".template"

`cd frontend/` -> root of frontend
`npm install` -> first time only
`npm run start` -> deploys local server running web app

## [Scripts](../scripts/)

**Scripts but only for based unix users.**
**Make sure to run this in root of project!!**

Example: `./scripts/build.sh`
[build.sh](../scripts/build.sh): setup backend installation, and frontend installation
[launch.sh](../scripts/launch.sh): deploy database, start backend server, start frontend server
[clean.sh](../scripts/clean.sh): removed all build files
