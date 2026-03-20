from typing import AsyncGenerator
from fastapi import HTTPException
from urllib.parse import urlparse
from constants import ENVIRONMENT_DATABASE_CONFIG
from pydantic import BaseModel, SecretStr, ValidationError
from functools import cache
import psycopg
import json
import os

from psycopg.conninfo import make_conninfo

class Conn(BaseModel):
    username: str
    password: SecretStr
    database: str
    hostname: str
    port: str

    def __str__(self) -> str:
        return make_conninfo(**self.model_dump())

async def get_connection_from_environment() -> psycopg.AsyncConnection:
    """
    Uses Environment variable database url for getting database parameters.
    See docker-compose.yml for example of what this looks like

    Returns:
        connection: psycopg connection object
    """


    try:
        result = urlparse(os.getenv("DATABASE_URL"))
        assert(type(result.username) is str)
        assert(type(result.password) is str)
        assert(type(result.path) is str)
        assert(type(result.hostname) is str)
        assert(type(result.port) is str)
    except AssertionError as e:
        print("ERROR: Couldn't parse database url")
        raise e

    try:
        conn = Conn(
            username = result.username,
            password = SecretStr(result.password),
            database = result.path[1:],
            hostname = result.hostname,
            port = result.port,
        )
        connection = await psycopg.AsyncConnection.connect(str(conn))
        return connection
    except psycopg.Error as e:
        print("ERROR: Couldn't create connection to database:\n", e)
        raise e


async def get_connection_from_development_config() -> psycopg.AsyncConnection:
    """
    Uses hardcoded config file to connect to database.

    Returns:
        connection: psycopg connection
    """
    config_file_path = "backend/src/testdbconfig.json"
    print("defaulting to local config for db connection in ", config_file_path)
    with open(config_file_path, "r") as f:
        db_config = json.loads(f.read())
        try:
            conn = Conn.model_validate(db_config)
        except ValidationError as e:
            print("ERROR: Couldn't load db connection config:\n", e)
            raise e
        try:
            connection = await psycopg.AsyncConnection.connect(str(conn))
            return connection
        
        except psycopg.Error as e:
            print("ERROR: Couldn't create connection to database:\n", e)
            raise e

@cache
async def get_database_connection() -> psycopg.AsyncConnection:
    """
    Returns psycopg async connection object based on current configuration.
    Uses Environment variables or hardcoded development config json

    Returns:
        connection: psycopg2 connection object or None
    """
    if os.getenv(ENVIRONMENT_DATABASE_CONFIG):
        return await get_connection_from_environment()
    return await get_connection_from_development_config()


async def get_db_connection() -> AsyncGenerator[psycopg.AsyncConnection]:
    """
    Generator Function to provide database connection object.

    Raises:
        HTTPException: When psycopg2 fails to create connection

    Yields:
        connection: psycopg2 connection object
    """
    connection = await get_database_connection()
    try:
        yield connection
    finally:
        await connection.close()


def default_HTTP_exception(code: str | None, additional_info: str) -> HTTPException:
    if code is None:
        return HTTPException(status_code=500, detail="Unknown database error while doing " + additional_info)
    else:
        return HTTPException(status_code=500, detail=f"Database error {code}: {psycopg.errors.lookup(code)}\n While doing " + additional_info)