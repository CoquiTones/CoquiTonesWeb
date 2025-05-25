# Deploy Local Development Environment

## Requirements

Docker CLI and Docker compose

Recommendation: Use VScode Docker Extension to use docker compose commands

## Local Deployment

Simply `docker compose up -d --build`

## [Scripts](../scripts/)

**Scripts but only for based unix users.**
**Make sure to run this in root of project!!**

Example: `./scripts/build.sh`
[build.sh](../scripts/build.sh): setup backend installation, and frontend installation
[launch.sh](../scripts/launch.sh): deploy database, start backend server, start frontend server
[clean.sh](../scripts/clean.sh): removed all build files
[docker_deployment.sh]: deploy docker using docker compose but also create logs for each container
