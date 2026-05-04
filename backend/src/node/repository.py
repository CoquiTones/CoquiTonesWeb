from dao import DAO, LOGGER
from psycopg.connection_async import AsyncConnection
from dataclasses import dataclass
from dbutil import default_HTTP_exception
from datetime import datetime
from psycopg import sql, errors
from psycopg.connection_async import AsyncConnection
from psycopg.rows import class_row, scalar_row
from psycopg import Error as PGError


node_type = str

@dataclass
class Node(DAO):
    """Node DAO"""

    nid: int
    nname: str
    ownerid: int
    ntype: node_type
    nlatitude: float
    nlongitude: float
    ndescription: str

    table = sql.Identifier("node")
    id_column = sql.Identifier("nid")
    owner_table = sql.SQL("node")

    @classmethod
    async def insert(
        cls,
        db: AsyncConnection,
        ownerid: int,
        nname: str,
        ntype: str,
        nlatitude: float,
        nlongitude: float,
        ndescription: str,
    ):
        async with db.cursor(row_factory=scalar_row) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
                            INSERT INTO {} (nname, ownerid, ntype, nlatitude, nlongitude, ndescription)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            RETURNING nid
                            """
                    ).format(cls.table),
                    (nname, ownerid, ntype, nlatitude, nlongitude, ndescription),
                )
                nid = await curs.fetchone()
                if nid is None:
                    return None
                return cls(nid, nname, ownerid, ntype, nlatitude, nlongitude, ndescription)
            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "insert node query")
