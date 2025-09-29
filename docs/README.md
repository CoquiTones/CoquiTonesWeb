# Deploy Local Development Environment

## Requirements

Docker CLI and Docker compose

Recommendation: Use VScode Docker Extension to use docker compose commands

## Step 1: Configure Environment Variables
modify the frontend/.env.template accordingly and save a copy without the ".template" extension. 

## Optional Step: Run Machine Learning notebook to generate model

## Step 2: Development Deployment using Docker Compose

Simply `docker compose up -d --build`

## [Scripts](../scripts/)

**Scripts but only for based unix users.**
**Make sure to run this in root of project!!**

Example: `./scripts/build.sh`
[build.sh](../scripts/build.sh): setup backend installation, and frontend installation
[launch.sh](../scripts/launch.sh): deploy database, start backend server, start frontend server
[clean.sh](../scripts/clean.sh): removed all build files
[docker_deployment.sh](../scripts/docker_deployment.sh): deploy  docker using docker compose but also create logs for each container that can be found in ./logs/
