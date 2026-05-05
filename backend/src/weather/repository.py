from dao import DAO, LOGGER
from psycopg.connection_async import AsyncConnection
from dataclasses import dataclass
from dbutil import default_HTTP_exception
from datetime import datetime
from psycopg import sql
from psycopg.connection_async import AsyncConnection
from psycopg.rows import scalar_row
from psycopg import Error as PGError


@dataclass
class WeatherData(DAO):
    """Weather Data DAO"""

    wdid: int
    tid: int
    wdtemperature: float
    wdhumidity: float
    wdpressure: float
    wddid_rain: bool

    @staticmethod
    def table(): return sql.Identifier("weatherdata")
    @staticmethod
    def id_column(): return sql.Identifier("wdid")
    @staticmethod
    def owner_table(): 
        return sql.SQL(
        "weatherdata NATURAL INNER JOIN timestampindex NATURAL INNER JOIN node"
    )

    @classmethod
    async def insert(
        cls,
        db: AsyncConnection,
        tid: int,
        wdtemperature: float,
        wdhumidity: float,
        wdpressure: float,
        wddid_rain: bool,
    ) -> int:
        async with db.cursor(row_factory=scalar_row) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
INSERT INTO {table} (tid, wdtemperature, wdhumidity, wdpressure, wddid_rain)
VALUES (%(tid)s, %(wdtemperature)s, %(wdhumidity)s, %(wdpressure)s, %(wddid_rain)s)
RETURNING {id_column}
"""
                    ).format(table=cls.table(), id_column=cls.id_column),
                    {
                        "tid": tid,
                        "wdtemperature": wdtemperature,
                        "wdhumidity": wdhumidity,
                        "wdpressure": wdpressure,
                        "wddid_rain": wddid_rain,
                    },
                )

                db_response = await curs.fetchone()
                assert(db_response is not None)
                return db_response

            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "insert weather data query")
