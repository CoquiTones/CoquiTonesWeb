from asyncio import TaskGroup
from psycopg import sql, errors
from psycopg.connection_async import AsyncConnection
from psycopg import Error as PGError
from psycopg.rows import class_row, scalar_row
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from dbutil import default_HTTP_exception
from Requests.RecordToBeDeleted import RecordTimestampIndex
from pydantic import Field
from itertools import repeat
import logging

node_type = str

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - [%(funcName)s]: %(levelname)s - %(message)s",
)
LOGGER = logging.getLogger("DAO Service Component")


class DAO:
    table: sql.Identifier  # name of the table that contains this type's data
    id_column: sql.Identifier  # name of the column that contains the type's id
    owner_table: (
        sql.SQL
    )  # SQL statement that produces table with column ownerid and id column for this type
    # Example for timestampindex: timestampindex NATURAL INNER JOIN node
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
                        my_id=cls.id_column,
                        my_table=cls.table,
                        owner_table=cls.owner_table,
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
                        my_table=cls.table,
                        my_id=cls.id_column,
                        owner_table=cls.owner_table,
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
                        my_table=cls.table,
                        my_id=cls.id_column,
                        owner_table=cls.owner_table,
                    ),
                    {"my_id": id, "owner_id": owner},
                )
            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "delete query") 
            db_response: int | None = await curs.fetchone()

            return db_response


@dataclass
class User(DAO):
    """App user DAO"""

    auid: int
    username: str
    salt: bytes
    pwhash: bytes

    table = sql.Identifier("appuser")
    id_column = sql.Identifier("auid")
    owner_table = sql.SQL("(SELECT auid, auid as ownerid FROM appuser)")

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


@dataclass
class Node(DAO):
    """Node DAO"""

    nid: int
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
                            INSERT INTO {} (ownerid, ntype, nlatitude, nlongitude, ndescription)
                            VALUES (%s, %s, %s, %s, %s)
                            RETURNING nid
                            """
                    ).format(cls.table),
                    (ownerid, ntype, nlatitude, nlongitude, ndescription),
                )
                nid = await curs.fetchone()
                if nid is None:
                    return None
                return cls(nid, ownerid, ntype, nlatitude, nlongitude, ndescription)
            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "insert node query")


@dataclass
class TimestampIndex(DAO):
    """Timestamp index DAO"""

    tid: int
    nid: int
    ttime: datetime

    table = sql.Identifier("timestampindex")
    id_column = sql.Identifier("tid")
    owner_table = sql.SQL("timestampindex NATURAL INNER JOIN node")

    @classmethod
    async def insert(cls, db: AsyncConnection, nid: int, timestamp: datetime):

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

                return await curs.fetchone()

            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "insert timestamp query")


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
class WeatherData(DAO):
    """Weather Data DAO"""

    wdid: int
    tid: int
    wdtemperature: float
    wdhumidity: float
    wdpressure: float
    wddid_rain: bool

    table = sql.Identifier("weatherdata")
    id_column = sql.Identifier("wdid")
    owner_table = sql.SQL(
        "weatherdata NATURAL INNER JOIN timestampindex NATURAL INNER JOIN node"
    )


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
    async def insert(
        cls, db: AsyncConnection, owner: int, file, nid: int, timestamp: datetime
    ):
        # First check that the node being referenced belongs to the owner of this new audio file
        node = await Node.get(owner, nid, db)
        if node is None or node.ownerid != owner:
            return None

        async with db.cursor(row_factory=scalar_row) as curs:
            try:
                async with TaskGroup() as setup_group:
                    tid = setup_group.create_task(TimestampIndex.insert(db, nid, timestamp))
                    data = setup_group.create_task(file.read())

                await curs.execute(
                    sql.SQL(
                        """
INSERT INTO {} (tid, ownerid, data)
VALUES (%s, %s, %s)
RETURNING afid
                        """
                    ).format(cls.table),
                    (tid.result(), owner, data.result()),
                )
                return await curs.fetchone()
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

@dataclass
class RecentData:
    """Recent reports dashboard operation response object"""
    nid: int
    afid: int
    humidity: float
    temperature: float
    pressure: float
    rain: float
    time: float
    tid: int

@dataclass
class ReportTableEntry:
    """Recent reports table entry"""
    ndescription: str
    ttime: datetime
    coqui: int
    wightmanae: int
    gryllus: int
    portoricensis: int
    unicolor: int
    hedricki: int
    locustus: int
    richmondi: int
    wdhumidity: float
    wdtemperature: float
    wdpressure: float
    wddid_rain: bool
    afid: int  # Front end should generate URL to audio file by using get audio file endpoint

@dataclass
class WeeklySummaryEntry:
    """Row of weekly summary table"""
    total_coqui: int
    total_wightmanae: int
    total_gryllus: int
    total_portoricensis: int
    total_unicolor: int
    total_hedricki: int
    total_locustus: int
    total_richmondi: int
    bin: datetime
@dataclass
class WeeklySummaryTable:
    """All the time series of the weekly summary"""
    total_coqui: list[int] = Field(default_factory=lambda: list())
    total_wightmanae: list[int] = Field(default_factory=lambda: list())
    total_gryllus: list[int] = Field(default_factory=lambda: list())
    total_portoricensis: list[int] = Field(default_factory=lambda: list())
    total_unicolor: list[int] = Field(default_factory=lambda: list())
    total_hedricki: list[int] = Field(default_factory=lambda: list())
    total_locustus: list[int] = Field(default_factory=lambda: list())
    total_richmondi: list[int] = Field(default_factory=lambda: list())
    date_bin: list[datetime] = Field(default_factory=lambda: list())

@dataclass
class NodeReport:
    """Node health report response object"""

    latest_time: datetime
    ndescription: str
    ntype: str

class Dashboard:
    """Collection of queries for dashboard endpoints"""

    @staticmethod
    async def recent_data(
        owner: int, minTimestamp: datetime, maxTimestamp: datetime, db: AsyncConnection
    ) -> list[RecentData]:
        """Returns Recent Data form DB, [nid, afid, ...weatherdata]"""
        async with db.cursor(row_factory=class_row(RecentData)) as curs:
            try:
                # Ensure timestamps are timezone-aware UTC
                if minTimestamp.tzinfo is None:
                    minTimestamp = minTimestamp.replace(tzinfo=timezone.utc)
                if maxTimestamp.tzinfo is None:
                    maxTimestamp = maxTimestamp.replace(tzinfo=timezone.utc)

                await curs.execute(
                    sql.SQL(
                        """
                    SELECT n.nid, af.afid, wd.wdhumidity AS humidity, wd.wdtemperature AS temperature, 
                        wd.wdpressure AS pressure, wd.wddid_rain AS rain, ti.ttime AS time, ti.tid as tid
                    FROM node n 
                    INNER JOIN timestampindex ti ON ti.nid = n.nid
                    INNER JOIN audiofile af ON af.tid = ti.tid
                    INNER JOIN weatherdata wd ON wd.tid = ti.tid
                    WHERE n.ownerid = %s AND ti.ttime > %s AND ti.ttime < %s
                    ORDER BY ti.ttime DESC
                    LIMIT 1000
                    """
                    ),
                    (owner, minTimestamp, maxTimestamp),
                )
                return await curs.fetchall()

            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "dashboard recent data query")

    @staticmethod
    async def delete_records(owner: int, records: list[RecordTimestampIndex], db: AsyncConnection):
        """Deletes a list of records based on join from @recent_data record

        Args:
            list including: [
                owner (int)
                timetsamp (datetime)
                node_id (int)
                db (connection) ]
        """

        MAX_BATCH_SIZE = 1000
        number_of_records = len(records)
        necessary_statements = (number_of_records // MAX_BATCH_SIZE) + 1
        number_of_records_left = number_of_records
        record_index = 0

        async with db.cursor() as curs:
            try:
                for _ in range(necessary_statements):
                    number_of_rows_to_insert = (
                        number_of_records_left
                        if (number_of_records_left < MAX_BATCH_SIZE)
                        else MAX_BATCH_SIZE
                    )
                    batch_values = [
                        records[j].timestamp_index_id
                        for j in range(
                            record_index, number_of_rows_to_insert + record_index, 1
                        )
                    ]
                    await curs.executemany(
                        """
                        DELETE FROM timestampindex WHERE tid = %s 
                        AND 
                        nid IN (SELECT nid FROM node  WHERE ownerid = %s)
                            """,
                        zip(batch_values, repeat(owner)),
                    )
                    number_of_records_left -= number_of_rows_to_insert
                    record_index += number_of_rows_to_insert

                return curs.rowcount
            except PGError as e:
                LOGGER.error("Error Executing SQL Query to delete rows: ", e)
                raise default_HTTP_exception(e, "Dashboard Delete Record query")

    @staticmethod
    async def week_species_summary(owner: int, db: AsyncConnection) -> WeeklySummaryTable:
        """Returns time series with sums of classifier hits of each species from all nodes, binned into days"""
        async with db.cursor(row_factory=class_row(WeeklySummaryEntry)) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
WITH owner_matches AS (
    SELECT asid FROM audioslice NATURAL INNER JOIN audiofile
    WHERE ownerid = %s
),
classifierreport AS (
    SELECT afid, 
        SUM(coqui::int) AS coqui_hits,
        SUM(wightmanae::int) AS wightmanae_hits,
        SUM(gryllus::int) AS gryllus_hits,
        SUM(portoricensis::int) AS portoricensis_hits,
        SUM(unicolor::int) AS unicolor_hits,
        SUM(hedricki::int) AS hedricki_hits,
        SUM(locustus::int) AS locustus_hits,
        SUM(richmondi::int) AS richmondi_hits
    FROM audioslice a NATURAL INNER JOIN owner_matches
    GROUP BY afid 
)
SELECT 
    SUM(coqui_hits) AS total_coqui,
    SUM(wightmanae_hits) AS total_wightmanae,
    SUM(gryllus_hits) AS total_gryllus,
    SUM(portoricensis_hits) AS total_portoricensis,
    SUM(unicolor_hits) AS total_unicolor,
    SUM(hedricki_hits) AS total_hedricki,
    SUM(locustus_hits) AS total_locustus,
    SUM(richmondi_hits) AS total_richmondi, 
    DATE_BIN('1 day', ttime AT LOCAL, CURRENT_TIMESTAMP) AS bin
FROM classifierreport NATURAL INNER JOIN timestampindex
WHERE ttime > (CURRENT_TIMESTAMP - '7 days'::INTERVAL)
GROUP BY "bin" 
ORDER BY "bin"
                        """
                    ),
                    (owner,),
                )
                db_output = await curs.fetchall()
                if len(db_output) == 0:
                    # If there are no afids to group by the query will just turn up empty, so we should respond with an empty dict.
                    return WeeklySummaryTable()

                # Transpose the rows into time series (which are effectively "columns").
                return WeeklySummaryTable(
                    total_coqui=[row.total_coqui for row in db_output],
                    total_wightmanae=[row.total_wightmanae for row in db_output],
                    total_gryllus=[row.total_gryllus for row in db_output],
                    total_hedricki=[row.total_hedricki for row in db_output],
                    total_locustus=[row.total_locustus for row in db_output],
                    total_portoricensis=[row.total_portoricensis for row in db_output],
                    total_richmondi=[row.total_richmondi for row in db_output],
                    total_unicolor=[row.total_unicolor for row in db_output],
                    date_bin=[row.bin for row in db_output]
                )
            
            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(
                    e, "dashboard species weekly summary query"
                )

    @staticmethod
    async def node_health_check(owner: int, db: AsyncConnection) -> list[NodeReport]:
        """Returns the time of the last message from each node along with the type of node"""

        async with db.cursor(row_factory=class_row(NodeReport)) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
SELECT latest_time, n.ndescription, n.ntype FROM  (
    SELECT max(ttime) as latest_time, nid FROM timestampindex
    GROUP by  nid
)
NATURAL INNER JOIN node n
WHERE n.ownerid = %s
ORDER by n.ntype 
                    """
                    ),
                    (owner,),
                )

                return await curs.fetchall()

            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "dashboard node health check query")

    @staticmethod
    async def recent_reports(
        current_user,
        low_temp: float,
        high_temp: float,
        low_humidity: float,
        high_humidity: float,
        low_pressure: float,
        high_pressure: float,
        low_coqui: int,
        high_coqui: int,
        low_wightmanae: int,
        high_wightmanae: int,
        low_gryllus: int,
        high_gryllus: int,
        low_portoricensis: int,
        high_portoricensis: int,
        low_unicolor: int,
        high_unicolor: int,
        low_hedricki: int,
        high_hedricki: int,
        low_locustus: int,
        high_locustus: int,
        low_richmondi: int,
        high_richmondi: int,
        description_filter: str,
        skip: int,
        limit: int,
        orderby: int,
        db: AsyncConnection,
    ) -> list:

        async with db.cursor(row_factory=class_row(ReportTableEntry)) as curs:
            try:
                await curs.execute(
                    sql.SQL(
                        """
WITH
owner_matches AS (
    SELECT asid FROM audioslice NATURAL INNER JOIN audiofile
    WHERE ownerid = %(owner)s
),
cr AS (
    SELECT afid, 
        SUM(coqui::int) AS coqui,
        SUM(wightmanae::int) AS wightmanae,
        SUM(gryllus::int) AS gryllus,
        SUM(portoricensis::int) AS portoricensis,
        SUM(unicolor::int) AS unicolor,
        SUM(hedricki::int) AS hedricki,
        SUM(locustus::int) AS locustus,
        SUM(richmondi::int) AS richmondi
    FROM audioslice a NATURAL INNER JOIN owner_matches
    GROUP BY afid 
)
SELECT n.ndescription,
        t.ttime, 
        c.coqui, 
        c.wightmanae, 
        c.gryllus, 
        c.portoricensis, 
        c.unicolor, 
        c.hedricki, 
        c.locustus, 
        c.richmondi, 
        w.wdhumidity, w.wdtemperature, w.wdpressure, w.wddid_rain, 
        a.afid
FROM timestampindex t NATURAL INNER JOIN cr c NATURAL INNER JOIN weatherdata w NATURAL INNER JOIN audiofile a NATURAL INNER JOIN node n
WHERE 
%(lowhum)s <= w.wdhumidity AND w.wdhumidity <= %(highhum)s AND 
%(lowtemp)s <= w.wdtemperature AND w.wdtemperature <= %(hightemp)s AND 
%(lowpress)s <= w.wdpressure AND w.wdpressure <= %(highpress)s AND 
%(lowcoqui)s <= c.coqui AND c.coqui <= %(highcoqui)s and
%(lowwightmanae)s <= c.wightmanae AND c.wightmanae <= %(highwightmanae)s AND
%(lowgryllus)s <= c.gryllus AND c.gryllus <= %(highgryllus)s AND
%(lowportoricensis)s <= c.portoricensis AND c.portoricensis <= %(highportoricensis)s AND
%(lowunicolor)s <= c.unicolor AND c.unicolor <= %(highunicolor)s AND
%(lowhedricki)s <= c.hedricki AND c.hedricki <= %(highhedricki)s AND
%(lowlocustus)s <= c.locustus AND c.locustus <= %(highlocustus)s AND
%(lowrichmondi)s <= c.richmondi AND c.richmondi <= %(highrichmondi)s AND
n.ndescription LIKE %(descriptionfilter)s
ORDER BY 
    CASE %(orderby)s
        WHEN 1 THEN t.ttime
        ELSE NULL
    END,
    CASE %(orderby)s
        WHEN 2 THEN c.coqui
        WHEN 3 THEN c.wightmanae
        WHEN 4 THEN c.gryllus
        WHEN 5 THEN c.portoricensis
        WHEN 6 THEN c.unicolor
        WHEN 7 THEN c.hedricki
        WHEN 8 THEN c.locustus
        WHEN 9 THEN c.richmondi
        ELSE NULL
    END,
    CASE %(orderby)s
        WHEN 10 THEN w.wdhumidity
        WHEN 11 THEN w.wdtemperature
        WHEN 12 THEN w.wdpressure
        ELSE NULL
    END
OFFSET %(offset)s
LIMIT %(limit)s
                        """
                    ),
                    {
                        "owner": current_user.auid,
                        "lowhum": low_humidity,
                        "highhum": high_humidity,
                        "lowtemp": low_temp,
                        "hightemp": high_temp,
                        "lowpress": low_pressure,
                        "highpress": high_pressure,
                        "lowcoqui": low_coqui,
                        "highcoqui": high_coqui,
                        "lowwightmanae": low_wightmanae,
                        "highwightmanae": high_wightmanae,
                        "lowgryllus": low_gryllus,
                        "highgryllus": high_gryllus,
                        "lowportoricensis": low_portoricensis,
                        "highportoricensis": high_portoricensis,
                        "lowunicolor": low_unicolor,
                        "highunicolor": high_unicolor,
                        "lowhedricki": low_hedricki,
                        "highhedricki": high_hedricki,
                        "lowlocustus": low_locustus,
                        "highlocustus": high_locustus,
                        "lowrichmondi": low_richmondi,
                        "highrichmondi": high_richmondi,
                        "descriptionfilter": description_filter,
                        "offset": skip,
                        "limit": limit,
                        "orderby": orderby,
                    },
                )

                return await curs.fetchall()

            except PGError as e:
                LOGGER.error("Error executing SQL query:", e)
                raise default_HTTP_exception(e, "dashboard recent reports query")
