import psycopg2
from fastapi import HTTPException
import json
import os

config_file_path = "backend/src/testdbconfig.json"


# Connect to the PostgreSQL database
def connect_to_database():

    if os.getenv("DATABASE_URL"):

        try:
            from urllib.parse import (
                urlparse,
            )  # for python 3+ use: from urllib.parse import urlparse

            result = urlparse(os.getenv("DATABASE_URL"))
            username = result.username
            password = result.password
            database = result.path[1:]
            hostname = result.hostname
            port = result.port

            print(
                "using database environement variables",
                username,
            )
            connection = psycopg2.connect(
                database=database,
                user=username,
                password=password,
                host=hostname,
                port=port,
            )
            return connection
        except psycopg2.Error as e:
            print("Error connecting to database:", e)
            return None

    else:
        print("defaulting to local config for db connection")
        with open(config_file_path, "r") as f:
            db_config = json.loads(f.read())

            try:
                connection = psycopg2.connect(**db_config)
                return connection
            except psycopg2.Error as e:
                print("Error connecting to database:", e)
                return None


# Injectable dependency
def get_db_connection():
    connection = connect_to_database()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    try:
        yield connection
    finally:
        connection.close()
