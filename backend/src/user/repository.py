from dao import DAO, LOGGER
from psycopg import sql, errors, AsyncConnection
from psycopg.rows import class_row, scalar_row
from psycopg import Error as PGError

from dbutil import default_HTTP_exception

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
