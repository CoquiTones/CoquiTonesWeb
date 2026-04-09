from typing import AsyncGenerator, Annotated
from fastapi import HTTPException, Depends
from urllib.parse import urlparse
from constants import ENVIRONMENT_CONFIG_DATABASE_URL
from pydantic import BaseModel, ValidationError
from psycopg import AsyncConnection, AsyncTransaction, Error, errors
from contextlib import asynccontextmanager
import json
import os
from Logger import Logger


LOGGER = Logger.getInstance("Database Util Component")

from psycopg.conninfo import make_conninfo

class Conn(BaseModel):
    dbname: str
    user: str
    password: str  # Has to be a str or else it won't dump
    host: str
    port: int

    def __str__(self) -> str:
        return make_conninfo(**self.model_dump())


def get_connection_from_environment() -> str:
    """
    Uses Environment variable database url for getting database parameters.
    See docker-compose.yml for example of what this looks like

    Returns:
        ConnInfo: configuration for a new connection
    """

    try:
        result = urlparse(os.environ[ENVIRONMENT_CONFIG_DATABASE_URL])
        assert type(result.username) is str
        assert type(result.password) is str
        assert type(result.path) is str
        assert type(result.hostname) is str
        assert type(result.port) is int
    except AssertionError as e:
        LOGGER.error("Couldn't parse database url")
        raise e

    try:
        conn = Conn(
            user=result.username,
            password=result.password,
            dbname=result.path[1:],
            host=result.hostname,
            port=result.port,
        )
        return str(conn)
    except Error as e:
        LOGGER.error("Couldn't create connection to database:\n", e)
        raise e


def get_connection_from_development_config() -> str:
    """
    Uses hardcoded config file to get database parameters.

    Returns:
        ConnInfo: configuration for a new connection
    """
    config_file_path = "backend/src/testdbconfig.json"
    LOGGER.info("defaulting to local config for db connection in ", config_file_path)
    with open(config_file_path, "r") as f:
        db_config = json.loads(f.read())
        try:
            conn = Conn.model_validate(db_config)
        except ValidationError as e:
            LOGGER.error("Couldn't load DB connection config:\n", e)
            raise e
        try:
            return str(conn)

        except Error as e:
            LOGGER.error("Couldn't create connection to database:\n", e)
            raise e


async def get_connection() -> AsyncConnection:
    """
    Starts the psycopg async connection based on current configuration.
    Uses Environment variables or hardcoded development config json.
    """
    if os.environ[ENVIRONMENT_CONFIG_DATABASE_URL]:
        conninfo = get_connection_from_environment()
    else:
        conninfo = get_connection_from_development_config()
    
    return await AsyncConnection.connect(conninfo=conninfo)

async def db_dep() -> AsyncGenerator[AsyncConnection, None]:
    """
    Generator Function to provide database connection object.

    Raises:
        HTTPException: When connection fails

    Yields:
        connection: psycopg connection object
    """
    connection = await get_connection()
    yield connection
    await connection.close()


async def transaction_dep(
    database_connection: Annotated[AsyncConnection, Depends(db_dep)],
):
    """
    Injectable transaction dependency.

    Raises:
        HTTPException: When connection fails

    Yields:
        transaction: psycopg transaction
    """
    async with database_connection.transaction() as transaction:
        yield transaction


@asynccontextmanager
async def get_transaction() -> AsyncGenerator[AsyncTransaction, None]:
    """
    Simply gets a transaction context.
    Returns:
        AsyncTransaction: psycopg transaction
    """
   
    connection = await get_connection()
    try:
        async with connection.transaction() as transaction:
            yield transaction
    finally:
        # cleanup
        await connection.close()


DBConnectionDependency = Annotated[AsyncConnection, Depends(db_dep)]
DBTransactionDependency = Annotated[AsyncTransaction, Depends(transaction_dep)]


def default_HTTP_exception(error: Error | None, additional_info: str) -> HTTPException:
    """
    Creates a HTTP exception that gives the general idea of why an error occured without exposing the diagnostics.

    Args:
        - error: psycopg Error
        - additional_info: description of what operation triggered the error

    Returns HTTPException that has the sqlstate and small description of what caused the error, safe to display to the user.
    """
    if error is None or error.sqlstate is None:
        return HTTPException(
            status_code=500,
            detail="Unknown database error while doing " + additional_info,
        )
    else:
        return HTTPException(
            status_code=500,
            detail=f"Database error {error.sqlstate}: {errors.lookup(error.sqlstate)}\n While doing "
            + additional_info,
        )
