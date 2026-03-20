from typing import AsyncGenerator, Annotated
from fastapi import HTTPException, Depends
from urllib.parse import urlparse
from constants import ENVIRONMENT_DATABASE_CONFIG
from pydantic import BaseModel, ValidationError
from aiocache import cached
from psycopg_pool import AsyncConnectionPool
from psycopg import AsyncConnection, Error, errors
import json
import os

from psycopg.conninfo import make_conninfo

class Conn(BaseModel):
    dbname: str
    user: str
    password: str # Has to be a str or else it won't dump
    host: str
    port: int

    def __str__(self) -> str:
        return make_conninfo(**self.model_dump())
    
type ConnInfo = str

def get_connection_from_environment() -> ConnInfo:
    """
    Uses Environment variable database url for getting database parameters.
    See docker-compose.yml for example of what this looks like

    Returns:
        ConnInfo: configuration for a new connection
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
            user = result.username,
            password = result.password,
            dbname = result.path[1:],
            host = result.hostname,
            port = result.port,
        )
        return str(conn)
    except Error as e:
        print("ERROR: Couldn't create connection to database:\n", e)
        raise e

def get_connection_from_development_config() -> ConnInfo:
    """
    Uses hardcoded config file to get database parameters.

    Returns:
        ConnInfo: configuration for a new connection
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
            return str(conn)
        
        except Error as e:
            print("ERROR: Couldn't create connection to database:\n", e)
            raise e

@cached()
async def make_connection_pool() -> AsyncConnectionPool:
    """
    Returns psycopg async connection pool based on current configuration.
    Uses Environment variables or hardcoded development config json.
    Also opens the pool.

    Returns:
        Async connection pool
    """
    if os.getenv(ENVIRONMENT_DATABASE_CONFIG):
        conninfo = get_connection_from_environment()
    else:
        conninfo = get_connection_from_development_config()

    pool: AsyncConnectionPool = AsyncConnectionPool(conninfo, open=False)
    await pool.open()
    return pool


async def db_dep() -> AsyncGenerator[AsyncConnection]:
    """
    Generator Function to provide database connection object.

    Raises:
        HTTPException: When psycopg2 fails to create connection

    Yields:
        connection: psycopg2 connection object
    """
    pool = await make_connection_pool()
    async with pool.connection() as connection:
        try:
            yield connection
        finally:
            await connection.close()

type DependsOnDB = Annotated[AsyncConnection, Depends(db_dep)] 


def default_HTTP_exception(error: Error | None, additional_info: str) -> HTTPException:
    """
    Creates a HTTP exception that gives the general idea of why an error occured without exposing the diagnostics.

    Args:
        - error: psycopg Error
        - additional_info: description of what operation triggered the error

    Returns HTTPException that has the sqlstate and small description of what caused the error, safe to display to the user.
    """
    if error is None or error.sqlstate is None:
        return HTTPException(status_code=500, detail="Unknown database error while doing " + additional_info)
    else:
        return HTTPException(status_code=500, detail=f"Database error {error.sqlstate}: {errors.lookup(error.sqlstate)}\n While doing " + additional_info)