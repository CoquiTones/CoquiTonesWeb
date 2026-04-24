from dao import DAO, LOGGER
from psycopg.connection_async import AsyncConnection
from dataclasses import dataclass
from dbutil import default_HTTP_exception
from datetime import datetime, timedelta
from psycopg import sql, errors
from psycopg.connection_async import AsyncConnection
from psycopg.rows import class_row, scalar_row
from psycopg import Error as PGError


@dataclass
class AudioSlice(DAO):
    """Audio slice DAO"""

    asid: int
    afid: int
    starttime: timedelta
    endtime: timedelta
    coqui: bool
    wightmanae: bool
    gryllus: bool
    portoricensis: bool
    unicolor: bool
    hedricki: bool
    locustus: bool
    richmondi: bool

    table = sql.Identifier("audioslice")
    id_column = sql.Identifier("asid")
    owner_table = sql.SQL("audioslice NATURAL INNER JOIN audiofile")

    @classmethod
    async def insert(
        cls,
        db: AsyncConnection,
        afid: int,
        starttime: timedelta,
        endtime: timedelta,
        coqui: bool,
        wightmanae: bool,
        gryllus: bool,
        portoricensis: bool,
        unicolor: bool,
        hedricki: bool,
        locustus: bool,
        richmondi: bool,
    ):
        async with db.cursor(row_factory=class_row(cls)) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
                        INSERT INTO audioslice (afid, starttime, endtime, coqui, wightmanae, gryllus, portoricensis, unicolor, hedricki, locustus, richmondi)
                        VALUES (%(afid)s, %(starttime)s, %(endtime)s, %(coqui)s, %(wightmanae)s, %(gryllus)s, %(portoricensis)s, %(unicolor)s, %(hedricki)s, %(locustus)s, %(richmondi)s)
                        RETURNING asid
                    """
                    ),
                    locals(),
                )
                return await curs.fetchone()
            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "insert audio slice query")

    @classmethod
    async def get_classified(cls, afid: int, db: AsyncConnection):
        async with db.cursor(row_factory=class_row(cls)) as curs:
            await curs.execute(
                sql.SQL(
                    """
                SELECT * FROM audioslice a 
                WHERE a.afid = %s
                """
                ),
                (afid,),
            )
            return await curs.fetchall()


@dataclass
class AudioFile(DAO):
    """Audio File DAO"""

    afid: int
    tid: int
    ownerid: int
    data: bytes | None = None

    table = sql.Identifier("audiofile")
    id_column = sql.Identifier("afid")
    owner_table = sql.SQL("audiofile")

    @classmethod
    async def get_all(cls, owner: int, db: AsyncConnection) -> list:
        """Get audio file objects without audio"""
        async with db.cursor(row_factory=class_row(cls)) as curs:
            try:
                await curs.execute(
                    """
                    SELECT afid, tid, ownerid
                    FROM audiofile
                    WHERE ownerid = %s
                    """,
                    (owner,),
                )
            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "get audio file query")

            # Not pulling the audio data.
            return await curs.fetchall()

    @classmethod
    async def insert(cls, db: AsyncConnection, file, nid: int, tid: int) -> int:
        async with db.cursor(row_factory=scalar_row) as curs:
            try:
                if isinstance(file, bytes):
                    data = file
                else:
                    data = await file.read()

                await curs.execute(
                    sql.SQL(
                        """
INSERT INTO {} (tid, data)
VALUES (%s, %s)
RETURNING afid
"""
                    ).format(cls.table),
                    (tid, data),
                )

                db_response = await curs.fetchone()
                assert(db_response is not None)
                return db_response

            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "insert audio file query")

    @classmethod
    async def is_classified(cls, afid: int, db: AsyncConnection) -> bool:
        try:
            async with db.cursor(row_factory=scalar_row) as curs:
                await curs.execute(
                    sql.SQL(
                        """
                    SELECT EXISTS (
                        SELECT asid 
                        FROM audioslice 
                        WHERE afid = %s
                        )
                """
                    ),
                    (afid,),
                )
                return await curs.fetchone() or False
        except PGError as e:
            LOGGER.error("Error executing SQL query:", e)
            raise default_HTTP_exception(e, "verify file is classified query")

    @classmethod
    async def exists(cls, afid: int, owner: int, db: AsyncConnection) -> bool:
        try:
            async with db.cursor(row_factory=scalar_row) as curs:
                await curs.execute(
                    sql.SQL(
                        """
                    SELECT EXISTS (
                        SELECT afid 
                        FROM audiofile 
                        WHERE afid = %s AND ownerid = %s
                        )
                """
                    ),
                    (afid, owner),
                )
                return await curs.fetchone() or False
        except PGError as e:
            LOGGER.error("Error executing SQL query:", e)
            raise default_HTTP_exception(e, "verify file exists query")
