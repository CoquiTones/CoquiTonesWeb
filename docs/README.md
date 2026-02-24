# Deploy Local Development Environment

## Requirements

- Docker CLI and Docker compose
- Python: tested with: [3.11.14 (docker version), 3.11.9]
- mapbox api key
- openssl (linux or wsl for windows)
- Recommendation: Use VScode Docker Extension to use docker compose commands

## Step 1: Configure Environment Variables

- modify the [.env environment file in FRONTEND](../frontend/.env.template) accordingly and save a copy without the ".template" extension.
- modify the [.env environment file in BACKEND](../backend/src/.env.template) accordingly and save a copy without the ".template" extension.
- generate localhost.crt and localhost.key in root of project running this command in root of project:

    ```bash
    openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
  ```

## Optional Step: [Run Machine Learning notebook to generate model](../machine_learning/prepare_data_and_train_model.ipynb)

Note: This step requires you have jupyter dependancies installed

## Step 2: Development Deployment using Docker Compose

Simply `docker compose up -d --build`

## [Scripts](../scripts/)

**Scripts but only for based unix users.**
**Make sure to run this in root of project!!**

Example: `./scripts/build.sh`

[build.sh](../scripts/build.sh): setup backend installation, and frontend installation

[launch.sh](../scripts/launch.sh): deploy database, start backend server, start frontend server

[clean.sh](../scripts/clean.sh): removed all build files

[docker_deployment.sh](../scripts/docker_deployment.sh): deploy  docker using docker compose but also create logs for each container that can be found in ./logs/ \n

## Known Issues and Fixes

1. **Issue**: since we use development certificates for ssl connections, some browsers don't trust it. This leads to failed requests from frontend to backend. **To fix this:** you have to boot up docker container or local coquitones instance -> open localhost:8080 first -> proceed after warning (this creates an exception for this ip / certificate) -> restart browser -> open localhost:5173 should work
