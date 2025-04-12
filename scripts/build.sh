#!/bin/bash

## Backend 
python3 -m venv .venv 
source .venv/bin/activate
pip3 install -r Backend/requirements.txt

## Frontend
cd Frontend/
npm install
npm run build