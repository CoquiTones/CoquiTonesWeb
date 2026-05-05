from abc import ABC, abstractmethod
from psycopg import sql, errors
from psycopg.connection_async import AsyncConnection
from psycopg import Error as PGError
from psycopg.rows import class_row, scalar_row
from dbutil import default_HTTP_exception
from Logger import Logger
from pydantic import Field, BaseModel, ConfigDict

LOGGER = Logger.getInstance("DAO Service Component")


class DAO(BaseModel):
    """
    Data Access Object

    table: name of the table that contains this type's data  
    id_column: name of the column that contains the type's id  
    owner_table: SQL statement that produces table with column ownerid and id column for this type
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    @staticmethod
    @abstractmethod
    def table() -> sql.Identifier: pass
    
    @staticmethod
    @abstractmethod
    def id_column() -> sql.Identifier: pass

    @staticmethod
    @abstractmethod
    def owner_table() -> sql.SQL: pass

    # Example owner_table for timestampindex: timestampindex NATURAL INNER JOIN node
    # timestampindex contains the id column, then node has an ownerid column.

    @classmethod
    async def get_all(cls, owner: int, db: AsyncConnection) -> list:
        """Get all owned entities in a list."""
        async with db.cursor(row_factory=class_row(cls)) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
WITH owner_matches as (
    SELECT {my_id} FROM {owner_table}
    WHERE ownerid = %s
)
SELECT * FROM {my_table} NATURAL INNER JOIN owner_matches
                    """
                    ).format(
                        my_id=cls.id_column(),
                        my_table=cls.table(),
                        owner_table=cls.owner_table(),
                    ),
                    (owner,),
                )
            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "get all query") 

            # Unpack the tuples into constructor
            return await curs.fetchall()

    @classmethod
    async def get(cls, owner: int, id: int, db: AsyncConnection):
        """Get one owned entity by its ID."""
        async with db.cursor(row_factory=class_row(cls)) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
WITH owner_matches as (
    SELECT {my_id} FROM {owner_table}
    WHERE ownerid = %s
)
SELECT * FROM {my_table} NATURAL INNER JOIN owner_matches 
WHERE {my_id} = %s
                    """
                    ).format(
                        my_table=cls.table(),
                        my_id=cls.id_column(),
                        owner_table=cls.owner_table(),
                    ),
                    (
                        owner,
                        id,
                    ),
                )
            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "get query")

            return await curs.fetchone()
            
            

    @classmethod
    async def delete(cls, owner: int, id: int, db: AsyncConnection) -> int | None:
        """
        deletes element by id

        Args:
            id (int):
            db (connection)

        Raises:
            HTTPException

        Returns:
            id of deleted entity
        """
        async with db.cursor(row_factory=scalar_row) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
WITH owner_matches as (
    SELECT {my_id} FROM {owner_table}
    WHERE ownerid = %(owner_id)s
)
DELETE FROM {my_table}
WHERE {my_id} = %(my_id)s AND ownerid = %(owner_id)s
RETURNING {my_id}
                    """
                    ).format(
                        my_table=cls.table(),
                        my_id=cls.id_column(),
                        owner_table=cls.owner_table(),
                    ),
                    {"my_id": id, "owner_id": owner},
                )
            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "delete query") 
            db_response: int | None = await curs.fetchone()

            return db_response


class User(DAO):
    """App user DAO"""

    auid: int
    username: str
    salt: bytes
    pwhash: bytes

    @staticmethod
    def table(): return sql.Identifier("appuser")
    @staticmethod
    def id_column(): return sql.Identifier("auid")
    @staticmethod
    def owner_table(): return sql.SQL("(SELECT auid, auid as ownerid FROM appuser)")

    @classmethod
    async def get_all_no_owner(cls, db: AsyncConnection):
        async with db.cursor(row_factory=class_row(User)) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
SELECT auid, username, salt, pwhash
FROM appuser
"""
                    )
                )

                return await curs.fetchall()

            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "Get user query")

    @staticmethod
    async def get_by_username(db: AsyncConnection, username: str):

        async with db.cursor(row_factory=class_row(User)) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
                        SELECT auid, username, salt, pwhash FROM appuser
                        WHERE username = %s
                        """
                    ),
                    (username,),
                )
                return await curs.fetchone()

            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "Get user query")

    @staticmethod
    async def insert(
        db: AsyncConnection, username: str, pwhash: bytes, salt: bytes
    ) -> int:
        async with db.cursor(row_factory=scalar_row) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
INSERT INTO appuser (username, pwhash, salt)
VALUES (%s, %s, %s)
RETURNING auid
"""
                    ),
                    (username, pwhash, salt),
                )
                db_response = await curs.fetchone()
                if db_response is None:
                    raise ValueError
                return db_response
            except PGError as e:
                if isinstance(e, errors.UniqueViolation):
                    raise ValueError
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "Insert user query")
