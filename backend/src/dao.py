import psycopg2
from psycopg2 import sql
from psycopg2.extensions import connection
from dataclasses import dataclass
from datetime import datetime, timedelta
from dbutil import default_HTTP_exception

from itertools import starmap

node_type = str


class DAO:
    table: sql.Identifier  # name of the table that contains this type's data
    id_column: sql.Identifier  # name of the column that contains the type's id
    owner_table: (
        sql.SQL
    )  # SQL statement that produces table with column ownerid and id column for this type
    # Example for timestampindex: timestampindex NATURAL INNER JOIN node
    # timestampindex contains the id column, then node has an ownerid column.

    @classmethod
    async def get_all(cls, owner: int, db: connection) -> list:
        """Get all owned entities in a list."""
        with db.cursor() as curs:
            try:
                curs.execute(
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
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "get all query")  # type: ignore

            # Unpack the tuples into constructor
            return [cls(*row) for row in curs.fetchall()]

    @classmethod
    async def get(cls, owner: int, id: int, db: connection):
        """Get one owned entity by its ID."""
        with db.cursor() as curs:
            try:
                curs.execute(
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
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "get query")  # type: ignore

            entity = curs.fetchone()
            # Unpack the tuple into constructor
            if entity is not None:
                return cls(*entity)
            else:
                return None

    @classmethod
    def delete(cls, owner: int, id: int, db: connection) -> int | None:
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
        with db.cursor() as curs:
            try:
                curs.execute(
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
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "delete query")  # type: ignore
            db_response = curs.fetchone()

            if db_response is not None:
                return db_response[0]


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
    async def get_by_username(db: connection, username: str):

        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                        SELECT auid, username, salt, pwhash FROM appuser
                        WHERE username = %s
                        """
                    ),
                    (username,),
                )
                db_response = curs.fetchone()
                if db_response is not None:
                    user = User(*db_response)
                    return user
                else:
                    return None
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "Get user query")  # type: ignore

    @staticmethod
    async def insert(
        db: connection, username: str, pwhash: bytes, salt: bytes
    ) -> int | None:
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
INSERT INTO appuser (username, pwhash, salt)
VALUES (%s, %s, %s)
RETURNING auid
"""
                    ),
                    (username, pwhash, salt),
                )
                curs.connection.commit()
                db_response = curs.fetchone()
                if db_response is None:
                    raise ValueError
                return db_response[0]
            except psycopg2.Error as e:
                if isinstance(e, psycopg2.errors.UniqueViolation):
                    return None
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "Insert user query")  # type: ignore


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
    def insert(
        cls,
        db: connection,
        ownerid: int,
        ntype: str,
        nlatitude: float,
        nlongitude: float,
        ndescription: str,
    ):
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                            INSERT INTO {} (ownerid, ntype, nlatitude, nlongitude, ndescription)
                            VALUES (%s, %s, %s, %s, %s)
                            RETURNING nid
                            """
                    ).format(cls.table),
                    (ownerid, ntype, nlatitude, nlongitude, ndescription),
                )

                db.commit()
                db_response = curs.fetchone()
                if db_response is not None:
                    nid = db_response[0]
                    return cls(nid, ownerid, ntype, nlatitude, nlongitude, ndescription)
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "insert node query")  # type: ignore


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
    async def insert(cls, db: connection, nid: int, timestamp: datetime) -> int | None:

        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                        INSERT INTO {} (nid, ttime)
                        VALUES (%s, %s)
                        RETURNING tid
                        """
                    ).format(cls.table),
                    (nid, timestamp),
                )

                db.commit()
                db_response = curs.fetchone()
                if db_response is not None:
                    tid = db_response[0]
                    return tid
                else:
                    return None
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "insert timestamp query")  # type: ignore


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
        db: connection,
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
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                        INSERT INTO audioslice (afid, starttime, endtime, coqui, wightmanae, gryllus, portoricensis, unicolor, hedricki, locustus, richmondi)
                        VALUES (%(afid)s, %(starttime)s, %(endtime)s, %(coqui)s, %(wightmanae)s, %(gryllus)s, %(portoricensis)s, %(unicolor)s, %(hedricki)s, %(locustus)s, %(richmondi)s)
                        RETURNING asid
                    """
                    ),
                    locals(),
                )
                return curs.fetchone()
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "inser audio slice query")  # type: ignore

    @classmethod
    async def get_classified(cls, afid: int, db: connection):
        with db.cursor() as curs:
            curs.execute(
                sql.SQL(
                    """
                SELECT * FROM audioslice a 
                WHERE a.afid = %s
                """
                ),
                (afid,),
            )
            return list(starmap(cls, curs.fetchall()))


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
    @classmethod
    async def insert(cls, db: connection, tid: int, wdtemperature: float, wdhumidity: float, wdpressure: float, wddid_rain: bool):
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
"""
INSERT INTO {table} (tid, wdtemperature, wdhumidity, wdpressure, wddid_rain)
VALUES (%(tid)s, %(wdtemperature)s, %(wdhumidity)s, %(wdpressure)s, %(wddid_rain)s)
RETURNING {id_column}
"""
                    ).format(
                        table=cls.table,
                        id_column=cls.id_column
                    ), {
                        "tid": tid,
                        "wdtemperature": wdtemperature,
                        "wdhumidity": wdhumidity,
                        "wdpressure": wdpressure,
                        "wddid_rain": wddid_rain
                    }
                )

                db_response = curs.fetchone()

                if db_response is not None:
                    return db_response[0]

            except psycopg2.Error as e:

                print("Error executing SQL query: e")

                raise default_HTTP_exception(e.pgcode, "insert weather data query")


@dataclass
class AudioFile(DAO):
    """Audio File DAO"""

    afid: int
    tid: int
    ownerid: int
    data: bytes | None

    table = sql.Identifier("audiofile")
    id_column = sql.Identifier("afid")
    owner_table = sql.SQL("audiofile")

    @classmethod
    async def get_all(cls, owner: int, db: connection) -> list:
        """Get IDs of audio files, but not audio"""
        with db.cursor() as curs:
            try:
                curs.execute(
                    """
                    SELECT afid, tid, ownerid
                    FROM audiofile
                    WHERE ownerid = %s
                    """,
                    (owner,),
                )
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "get audio file query")  # type: ignore

            # Not pulling the audio data.
            return [cls(row[0], row[1], row[2], None) for row in curs.fetchall()]

    @classmethod
    async def insert(cls, db:connection, file, nid: int, tid: int):
        with db.cursor() as curs:
            try:
                if isinstance(file, bytes):
                    data = file
                else:
                    data = await file.read()
                    
                curs.execute(sql.SQL(
"""
INSERT INTO {} (tid, data)
VALUES (%s, %s)
RETURNING afid
"""
                ).format(cls.table), (tid, data))

                db_response = curs.fetchone()
                if db_response is not None:
                    return db_response[0]
            
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "insert audio file query")
        
    @classmethod
    async def insert_and_timestamp(cls, db: connection, owner: int, file, nid: int, timestamp: datetime):

        with db.cursor() as curs:
            try:
                tid = await TimestampIndex.insert(db, nid, timestamp)
                data = await file.read()
                curs.execute(
                    sql.SQL(
                        """
INSERT INTO {} (tid, ownerid, data)
VALUES (%s, %s, %s)
RETURNING afid
                        """
                    ).format(cls.table),
                    (tid, owner, data),
                )
                db.commit()
                db_response = curs.fetchone()
                if db_response is not None:
                    afid = db_response[0]
                    return afid
                else:
                    return None
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "insert audio file query")  # type: ignore

    @classmethod
    async def is_classified(cls, afid: int, db: connection):
        try:
            with db.cursor() as curs:
                curs.execute(
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
                db_response = curs.fetchone()
                if db_response is not None:
                    return db_response[0]
        except psycopg2.Error as e:
            print("Error executing SQL query:", e)
            raise default_HTTP_exception(e.pgcode, "verify file is classified query")  # type: ignore

    @classmethod
    async def exists(cls, afid: int, owner: int, db: connection):
        try:
            with db.cursor() as curs:
                curs.execute(
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
                return curs.fetchone()[0]  # type: ignore
        except psycopg2.Error as e:
            print("Error executing SQL query:", e)
            raise default_HTTP_exception(e.pgcode, "verify file exists query")  # type: ignore


class Dashboard:
    """Collection of queries for dashboard endpoints"""

    @staticmethod
    def week_species_summary(owner: int, db: connection) -> dict[str, list]:
        """Returns time series with sums of classifier hits of each species from all nodes, binned into days"""
        with db.cursor() as curs:
            try:
                curs.execute(
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
    sum(coqui_hits) AS total_coqui,
    sum(wightmanae_hits) AS total_wightmanae,
    sum(gryllus_hits) AS total_gryllus,
    sum(portoricensis_hits) AS total_portoricensis,
    sum(unicolor_hits) AS total_unicolor,
    sum(hedricki_hits) AS total_hedricki,
    sum(locustus_hits) AS total_locustus,
    sum(richmondi_hits) AS total_richmondi, 
    date_bin('1 day', ttime AT LOCAL, CURRENT_TIMESTAMP) as bin
FROM classifierreport NATURAL INNER JOIN timestampindex
WHERE ttime > (CURRENT_TIMESTAMP - '7 days'::INTERVAL)
GROUP BY "bin" 
ORDER BY "bin"
                        """
                    ),
                    (owner,),
                )
                db_output = curs.fetchall()
                if len(db_output) == 0:
                    # If there are no afids to group by the query will just turn up empty, so we should respond with an empty dict.
                    return {}
                column_transposed = list(map(list, zip(*db_output)))
                return {
                    "total_coqui": column_transposed[0],
                    "total_wightmanae": column_transposed[1],
                    "total_gryllus": column_transposed[2],
                    "total_portoricensis": column_transposed[3],
                    "total_unicolor": column_transposed[4],
                    "total_hedricki": column_transposed[5],
                    "total_locustus": column_transposed[6],
                    "total_richmondi": column_transposed[7],
                    "date_bin": column_transposed[8],
                }
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(
                    e.pgcode, "dashboard species weekly summary query"
                )

    @staticmethod
    def node_health_check(owner: int, db: connection) -> list:
        """Returns the time of the last message from each node along with the type of node"""

        @dataclass
        class NodeReport:
            """Node health report query object"""

            latest_time: datetime
            ndescription: str
            ntype: str
        with db.cursor() as curs:
            try:
                curs.execute(
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

                return list(starmap(NodeReport, curs.fetchall()))

            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "dashboard node health check query")  # type: ignore

    @staticmethod
    def recent_reports(
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
        db: connection,
    ) -> list:

        @dataclass
        class ReportTableEntry:
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

        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
WITH
owner_matches AS (
    SELECT asid FROM audioslice NATURAL INNER JOIN audiofile
    WHERE ownerid = %(owner)s
),
cr AS (
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
SELECT n.ndescription,
        t.ttime, 
        c.coqui_hits, 
        c.wightmanae_hits, 
        c.gryllus_hits, 
        c.portoricensis_hits, 
        c.unicolor_hits, 
        c.hedricki_hits, 
        c.locustus_hits, 
        c.richmondi_hits, 
        w.wdhumidity, w.wdtemperature, w.wdpressure, w.wddid_rain, 
        a.afid
FROM timestampindex t NATURAL INNER JOIN cr c NATURAL INNER JOIN weatherdata w NATURAL INNER JOIN audiofile a NATURAL INNER JOIN node n
WHERE 
%(lowhum)s <= w.wdhumidity AND w.wdhumidity <= %(highhum)s AND 
%(lowtemp)s <= w.wdtemperature AND w.wdtemperature <= %(hightemp)s AND 
%(lowpress)s <= w.wdpressure AND w.wdpressure <= %(highpress)s AND 
%(lowcoqui)s <= c.coqui_hits AND c.coqui_hits <= %(highcoqui)s and
%(lowwightmanae)s <= c.wightmanae_hits AND c.wightmanae_hits <= %(highwightmanae)s AND
%(lowgryllus)s <= c.gryllus_hits AND c.gryllus_hits <= %(highgryllus)s AND
%(lowportoricensis)s <= c.portoricensis_hits AND c.portoricensis_hits <= %(highportoricensis)s AND
%(lowunicolor)s <= c.unicolor_hits AND c.unicolor_hits <= %(highunicolor)s AND
%(lowhedricki)s <= c.hedricki_hits AND c.hedricki_hits <= %(highhedricki)s AND
%(lowlocustus)s <= c.locustus_hits AND c.locustus_hits <= %(highlocustus)s AND
%(lowrichmondi)s <= c.richmondi_hits AND c.richmondi_hits <= %(highrichmondi)s AND
n.ndescription LIKE %(descriptionfilter)s
ORDER BY 
    CASE %(orderby)s
        WHEN 1 THEN t.ttime
        ELSE NULL
    END,
    CASE %(orderby)s
        WHEN 2 THEN c.coqui_hits
        WHEN 3 THEN c.wightmanae_hits
        WHEN 4 THEN c.gryllus_hits
        WHEN 5 THEN c.portoricensis_hits
        WHEN 6 THEN c.unicolor_hits
        WHEN 7 THEN c.hedricki_hits
        WHEN 8 THEN c.locustus_hits
        WHEN 9 THEN c.richmondi_hits
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

                return list(starmap(ReportTableEntry, curs.fetchall()))

            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "dashboard recent reports query")
