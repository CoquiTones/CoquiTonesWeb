import psycopg2
from psycopg2 import sql
from psycopg2.extensions import connection
from dataclasses import dataclass
from datetime import datetime, timedelta
from fastapi import HTTPException
from time import time
from dbutil import default_HTTP_exception

from itertools import starmap

node_type = str


class DAO:
    @classmethod
    def get_all(cls, db: connection) -> list:
        """Get all entities in a list."""
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                    SELECT * FROM {}
                    """
                    ).format(sql.Identifier(cls.table))
                )
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "get all query")

            # Unpack the tuples into constructor
            return [cls(*row) for row in curs.fetchall()]

    @classmethod
    def get(cls, id: int, db: connection):
        """Get one entity by its ID."""
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                    SELECT * FROM {}
                    WHERE {} = %s
                    """
                    ).format(sql.Identifier(cls.table), sql.Identifier(cls.id_column)),
                    (id,),
                )
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "get query")

            # Unpack the tuple into constructor
            return cls(*curs.fetchone())

    @classmethod
    def delete(cls, id: int, db: connection):
        """
        deletes element by id

        Args:
            id (int):
            db (connection)

        Raises:
            HTTPException

        Returns:
            id of deleted node
        """
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                    DELETE FROM {}
                    WHERE {} = %s
                    """
                    ).format(sql.Identifier(cls.table), sql.Identifier(cls.id_column)),
                    (id),
                )
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "delete query")

            # Unpack the tuple into constructor

            return "success"


@dataclass
class Node(DAO):
    """Node DAO"""

    nid: int
    ntype: node_type
    nlatitude: float
    nlongitude: float
    ndescription: str

    table = "node"
    id_column = "nid"

    @classmethod
    def insert(
        cls,
        db: connection,
        ntype: str,
        nlatitude: str,
        nlongitude: str,
        ndescription: str,
    ):
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                            INSERT INTO {} (ntype, nlatitude, nlongitude, ndescription)
                            VALUES (%s, %s, %s, %s)
                            RETURNING nid
                            """
                    ).format(sql.Identifier(cls.table)),
                    (ntype, nlatitude, nlongitude, ndescription),
                )

                db.commit()
                nid = curs.fetchone()[0]
                return cls(nid, ntype, nlatitude, nlongitude, ndescription)
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "insert node query")


@dataclass
class TimestampIndex(DAO):
    """Timestamp index DAO"""

    tid: int
    nid: int
    ttime: datetime

    table = "timestampindex"
    id_column = "tid"

    async def insert(cls, db: connection, nid: str, timestamp: datetime):

        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                            INSERT INTO {} (nid, ttime)
                            VALUES (%s, %s)
                            RETURNING tid
                            """
                    ).format(sql.Identifier(cls.table)),
                    (nid, timestamp),
                )

                db.commit()
                tid = curs.fetchone()[0]
                return tid
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "insert timestamp query")


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

    table = "audioslice"
    id_column = "asid"

    @classmethod
    async def insert(cls, db: connection, 
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
        richmondi: bool
        ):
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL("""
                        INSERT INTO audioslice (afid, starttime, endtime, coqui, wightmanae, gryllus, portoricensis, unicolor, hedricki, locustus, richmondi)
                        VALUES (%(afid)s, %(starttime)s, %(endtime)s, %(coqui)s, %(wightmanae)s, %(gryllus)s, %(portoricensis)s, %(unicolor)s, %(hedricki)s, %(locustus)s, %(richmondi)s)
                        RETURNING asid
                    """), locals()
                    )
                return curs.fetchone()
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "inser audio slice query")   


@dataclass
class WeatherData(DAO):
    """Weather Data DAO"""

    wdid: int
    tid: int
    wdtemperature: float
    wdhumidity: float
    wdpressure: float
    wddid_rain: bool

    table = "weatherdata"
    id_colummn = "wdid"


@dataclass
class AudioFile(DAO):
    """Audio File DAO"""

    afid: int
    tid: int
    data: bytes

    table = "audiofile"
    id_column = "afid"

    @classmethod
    def get_all(cls, db: connection) -> list:
        """Get IDs of audio files, but not audio"""
        with db.cursor() as curs:
            try:
                curs.execute(
                    """
                    SELECT afid, tid
                    FROM audiofile
                    """
                )
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "get audio file query")

            # Not pulling the audio data.
            return [cls(row[0], row[1], None) for row in curs.fetchall()]

    @classmethod
    async def insert(cls, db: connection, file, nid: str, timestamp: datetime):

        with db.cursor() as curs:
            try:
                tid = await TimestampIndex.insert(TimestampIndex, db, nid, timestamp)
                data = await file.read()
                curs.execute(
                    sql.SQL(
                        """
                            INSERT INTO {} (tid, data)
                            VALUES (%s, %s)
                            RETURNING afid
                            """
                    ).format(sql.Identifier(cls.table)),
                    (tid, data),
                )
                db.commit()
                afid = curs.fetchone()[0]
                return str(afid)
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "insert audio file query")

class Dashboard:
    """Collection of queries for dashboard endpoints"""
    @staticmethod
    def week_species_summary(db: connection) -> dict[str, list]:
        """Returns time series with sums of classifier hits of each species from all nodes, binned into days"""
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                        WITH classifierreport AS (
                            SELECT afid, 
                                SUM(coqui::int) AS coqui_hits,
                                SUM(wightmanae::int) AS wightmanae_hits,
                                SUM(gryllus::int) AS gryllus_hits,
                                SUM(portoricensis::int) AS portoricensis_hits,
                                SUM(unicolor::int) AS unicolor_hits,
                                SUM(hedricki::int) AS hedricki_hits,
                                SUM(locustus::int) AS locustus_hits,
                                SUM(richmondi::int) AS richmondi_hits
                            FROM audioslice a  
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
                    )
                )
                db_output = curs.fetchall()
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
                    "date_bin": column_transposed[8]
                }
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "dashboard species weekly summary query")


    
    @staticmethod
    def node_health_check(db: connection) -> list:
        """Returns the time of the last message from each node along with the type of node"""
        @dataclass

        class NodeReport:
            """Node health report query object"""
            latest_time: datetime
            ndescription: str
            ntype: str
        with db.cursor() as curs:
            try:
                curs.execute(sql.SQL(
                    """
                    SELECT latest_time, n.ndescription, n.ntype FROM  (
                        SELECT max(ttime) as latest_time, nid FROM timestampindex
                        GROUP by  nid
                    )
                    NATURAL INNER JOIN node n
                    ORDER by n.ntype 
                    """
                ))

                return list(starmap(NodeReport, curs.fetchall()))
                
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "dashboard node health check query")
       
        
    @staticmethod
    def recent_reports(
        low_temp: float, high_temp: float,
        low_humidity: float, high_humidity: float,
        low_pressure: float, high_pressure: float,
        low_coqui:          int, high_coqui:            int,
        low_wightmanae:     int, high_wightmanae:       int,
        low_gryllus:        int, high_gryllus:          int,
        low_portoricensis:  int, high_portoricensis:    int,
        low_unicolor:       int, high_unicolor:         int,
        low_hedricki:       int, high_hedricki:         int,
        low_locustus:       int, high_locustus:         int,
        low_richmondi:      int, high_richmondi:        int,        
        description_filter: str,
        skip: int, limit: int, 
        orderby: int,
        db: connection) -> list:

        @dataclass
        class ReportTableEntry:
            ndescription:   str
            ttime:          datetime
            coqui:          int
            wightmanae:     int
            gryllus:        int
            portoricensis:  int
            unicolor:       int
            hedricki:       int
            locustus:       int
            richmondi:      int
            wdhumidity:     float
            wdtemperature:  float
            wdpressure:     float
            wddid_rain:     bool
            afid:           int # Front end should generate URL to audio file by using get audio file endpoint
        
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                        WITH cr AS (
                            SELECT afid, 
                                SUM(coqui::int) AS coqui_hits,
                                SUM(wightmanae::int) AS wightmanae_hits,
                                SUM(gryllus::int) AS gryllus_hits,
                                SUM(portoricensis::int) AS portoricensis_hits,
                                SUM(unicolor::int) AS unicolor_hits,
                                SUM(hedricki::int) AS hedricki_hits,
                                SUM(locustus::int) AS locustus_hits,
                                SUM(richmondi::int) AS richmondi_hits
                            FROM audioslice a  
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
                        'lowhum': low_humidity,
                        'highhum': high_humidity,
                        'lowtemp': low_temp,
                        'hightemp': high_temp,
                        'lowpress': low_pressure,
                        'highpress': high_pressure,
                        'lowcoqui': low_coqui,
                        'highcoqui': high_coqui,
                        'lowwightmanae': low_wightmanae,
                        'highwightmanae': high_wightmanae,
                        'lowgryllus': low_gryllus,
                        'highgryllus': high_gryllus,
                        'lowportoricensis': low_portoricensis,
                        'highportoricensis': high_portoricensis,
                        'lowunicolor': low_unicolor,
                        'highunicolor': high_unicolor,
                        'lowhedricki': low_hedricki,
                        'highhedricki': high_hedricki,
                        'lowlocustus': low_locustus,
                        'highlocustus': high_locustus,
                        'lowrichmondi': low_richmondi,
                        'highrichmondi': high_richmondi,
                        'descriptionfilter': description_filter,
                        'offset': skip,
                        'limit': limit,
                        'orderby': orderby,
                    }
                )

                return list(starmap(ReportTableEntry, curs.fetchall()))

            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise default_HTTP_exception(e.pgcode, "dashboard recent reports query")


