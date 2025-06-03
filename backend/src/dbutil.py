from fastapi import HTTPException
from urllib.parse import urlparse
from constants import ENVIRONMENT_DATABASE_CONFIG
import psycopg2
import json
import os


def get_connection_from_environment():
    """
    Uses Environment variable database url for getting database parameters.
    See docker-compose.yml for example of what this looks like

    Returns:
        connection: psycopg2 connection object
    """

    try:
        result = urlparse(os.getenv("DATABASE_URL"))
        username = result.username
        password = result.password
        database = result.path[1:]
        hostname = result.hostname
        port = result.port

        print("Connecting using Environment Variables: ", result)
        connection = psycopg2.connect(
            database=database,
            user=username,
            password=password,
            host=hostname,
            port=port,
        )
        return connection
    except psycopg2.Error as e:
        print("Error Creating Connection Object to database:", e)
        return None


def get_connection_from_development_config():
    """
    Uses config hardcoded config file to connect to database.

    Returns:
        connection: psycopg2 connection
    """
    config_file_path = "backend/src/testdbconfig.json"
    print("defaulting to local config for db connection in ", config_file_path)
    with open(config_file_path, "r") as f:
        db_config = json.loads(f.read())
        try:
            connection = psycopg2.connect(**db_config)
            return connection
        except psycopg2.Error as e:
            print("Error connecting to database:", e)
            return None


def get_database_connection():
    """Returns psycopg2 connection object based on current configuration.
    Uses Environment variables or hardcoded development config json

    Returns:
        connection: psycopg2 connection object or None
    """
    if os.getenv(ENVIRONMENT_DATABASE_CONFIG):
        return get_connection_from_environment()
    return get_connection_from_development_config()


def get_db_connection():
    """
    Generator Function to provide database connection object.

    Raises:
        HTTPException: When psycopg2 fails to create connection

    Yields:
        connection: psycopg2 connection object
    """
    connection = get_database_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    try:
        yield connection
    finally:
        connection.close()
