from dao import DAO, LOGGER
from psycopg.connection_async import AsyncConnection
from dbutil import default_HTTP_exception
from datetime import datetime, timedelta
from psycopg import sql, errors
from psycopg.connection_async import AsyncConnection
from psycopg.rows import class_row, scalar_row
from psycopg import Error as PGError


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

    @staticmethod
    def table(): return sql.Identifier("audioslice")
    @staticmethod
    def id_column(): return sql.Identifier("asid")
    @staticmethod
    def owner_table(): return sql.SQL("audioslice NATURAL INNER JOIN audiofile")

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
    ) -> int:
        async with db.cursor(row_factory=scalar_row) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
                        INSERT INTO audioslice (afid, starttime, endtime, coqui, wightmanae, gryllus, portoricensis, unicolor, hedricki, locustus, richmondi)
                        VALUES (%(afid)s, %(starttime)s, %(endtime)s, %(coqui)s, %(wightmanae)s, %(gryllus)s, %(portoricensis)s, %(unicolor)s, %(hedricki)s, %(locustus)s, %(richmondi)s)
                        RETURNING asid
                    """
                    ),
                    {
                        "afid": afid,
                        "starttime": starttime,
                        "endtime": endtime,
                        "coqui": coqui,
                        "wightmanae": wightmanae,
                        "gryllus": gryllus,
                        "portoricensis": portoricensis,
                        "unicolor": unicolor,
                        "hedricki": hedricki,
                        "locustus": locustus,
                        "richmondi": richmondi,
                    },
                )
                asid = await curs.fetchone()
                assert(asid is not None)
                return asid
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


class AudioFile(DAO):
    """Audio File DAO"""

    afid: int
    tid: int
    ownerid: int | None = None
    data: bytes | None = None

    @staticmethod
    def table(): return sql.Identifier("audiofile")
    @staticmethod
    def id_column(): return sql.Identifier("afid")

    @staticmethod
    def owner_table() -> sql.SQL:
        """
        Ownership is derived through timestampindex -> node instead of relying
        on audiofile.ownerid, which is NULL for rows written before ownership
        was persisted.
        """
        return sql.SQL(
            """
            (
                SELECT af.afid, n.ownerid
                FROM audiofile af
                INNER JOIN timestampindex ti ON ti.tid = af.tid
                INNER JOIN node n ON n.nid = ti.nid
            )
            """
        )

    @classmethod
    async def get_all(cls, owner: int, db: AsyncConnection) -> list:
        """Get audio file objects without audio"""
        async with db.cursor(row_factory=class_row(cls)) as curs:
            try:
                await curs.execute(
                    """
                    SELECT af.afid, af.tid, n.ownerid
                    FROM audiofile af
                    INNER JOIN timestampindex ti ON ti.tid = af.tid
                    INNER JOIN node n ON n.nid = ti.nid
                    WHERE n.ownerid = %s
                    ORDER BY af.afid
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
INSERT INTO {my_table} (tid, data, ownerid)
SELECT %s, %s, n.ownerid
FROM node n
WHERE n.nid = %s
RETURNING afid
"""
                    ).format(my_table=cls.table()),
                    (tid, data, nid),
                )

                db_response = await curs.fetchone()
                if db_response is None:
                    raise ValueError(f"Node {nid} does not exist; cannot store its audio file.")
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
                        SELECT 1
                        FROM audiofile af
                        INNER JOIN timestampindex ti ON ti.tid = af.tid
                        INNER JOIN node n ON n.nid = ti.nid
                        WHERE af.afid = %s AND n.ownerid = %s
                        )
                """
                    ),
                    (afid, owner),
                )
                return await curs.fetchone() or False
        except PGError as e:
            LOGGER.error("Error executing SQL query:", e)
            raise default_HTTP_exception(e, "verify file exists query")
