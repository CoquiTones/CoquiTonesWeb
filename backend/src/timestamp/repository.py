from dao import DAO, LOGGER
from psycopg.connection_async import AsyncConnection
from dbutil import default_HTTP_exception
from datetime import datetime
from psycopg import sql
from psycopg.connection_async import AsyncConnection
from psycopg.rows import scalar_row
from psycopg import Error as PGError


class TimestampIndex(DAO):
    """Timestamp index DAO"""

    tid: int
    nid: int
    ttime: datetime

    @staticmethod
    def table(): return sql.Identifier("timestampindex")
    @staticmethod
    def id_column(): return sql.Identifier("tid")
    @staticmethod
    def owner_table(): return sql.SQL("timestampindex NATURAL INNER JOIN node")

    @classmethod
    async def insert(cls, db: AsyncConnection, nid: int, timestamp: datetime) -> int:

        async with db.cursor(row_factory=scalar_row) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
                        INSERT INTO {} (nid, ttime)
                        VALUES (%s, %s)
                        RETURNING tid
                        """
                    ).format(cls.table),
                    (nid, timestamp),
                )

                result = await curs.fetchone()
                assert(result is not None)
                return result 

            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "insert timestamp query")
