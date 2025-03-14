# Deploy Local Development Environment

## Backend

To start the backend, simply launch a debug session in vscode using the launch.json configuration in .vscode

## Database

In local development, the database is created using a docker container. You can spin up this container using docker compose and our docker-compose.yml file.

There is yet another vs code extension that facilitates this but you can execute it manually using the following commands

`docker compose up` -> creates the container/s for database initallized with dummy sql data from our init.sql file
`docker compose restart`
`docker compose down`-> stops the containers

Important note: Currently, it is up to you to clean up images, containers that may be used during development.

monitor docker usage using `docker images`, `docker prune` etc.

## Frontend

Prepare environment variables. Modify the `Frontend/.env.template` file and remove the ".template"

`cd Frontend/` -> root of frontend
`npm install` -> first time only
`npm run start` -> deploys local server running web app

## Work in progress
