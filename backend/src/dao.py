import psycopg2
from psycopg2 import sql
from psycopg2.extensions import connection
from dataclasses import dataclass
from datetime import datetime
from fastapi import HTTPException
from time import time

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
                raise HTTPException(status_code=500, detail="Database error")

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
                raise HTTPException(status_code=500, detail="Database error")

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
                raise HTTPException(status_code=500, detail="Database error")

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
                raise HTTPException(status_code=500, detail="Database error")


@dataclass
class TimestampIndex(DAO):
    """Timestamp index DAO"""

    tid: int
    nid: int
    ttime: datetime

    table = "timestampindex"
    id_column = "tid"

    async def insert(cls, db: connection, nid: str, timestamp: str):

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
                raise HTTPException(status_code=500, detail="Database error")


@dataclass
class ClassifierReport(DAO):
    """Classifier report DAO"""

    crid: int
    tid: int
    crsamples: int
    crcoqui: int
    crantillensis: int
    crcochranae: int
    cre_monensis: int
    crgryllus: int
    crhedricki: int
    crlocustus: int
    crportoricensis: int
    crrichmondi: int
    crwightmanae: int
    crno_hit: int

    table = "classifierreport"
    id_column = "crid"


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
                raise HTTPException(status_code=500, detail="Database error")

            # Not pulling the audio data.
            return [cls(row[0], row[1], None) for row in curs.fetchall()]

    @classmethod
    async def insert(cls, db: connection, file, nid: str, timestamp: str):

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
                raise HTTPException(status_code=500, detail="Database error")

class Dashboard:
    """Collection of queries for dashboard endpoints"""
    @staticmethod
    def week_species_summary(db: connection) -> dict[str, list]:
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                        select sum(crcoqui_antillensis) as total_coqui_antillensis, 
                            sum(crcoqui_common) as total_common_coqui,
                            sum(crcoqui_e_monensis) as total_coqui_e_monensis, 
                            sum(crsamples) as total_samples, 
                            sum(crno_hit) as total_no_hit, 
                            date_bin('1 day', ttime at local, CURRENT_TIMESTAMP) as bin
                        from classifierreport natural inner join timestampindex
                        where ttime > (CURRENT_TIMESTAMP - interval '7 days')
                        group by "bin" 
                        order by "bin"
                        """
                    )
                )
                db_output = curs.fetchall()
                column_transposed = list(map(list, zip(*db_output)))
                return {
                    "total_coqui_antillensis": column_transposed[0],
                    "total_common_coqui": column_transposed[1],
                    "total_coqui_e_monensis": column_transposed[2],
                    "total_samples": column_transposed[3],
                    "total_no_hit": column_transposed[4],
                    "date_bin": column_transposed[5]
                }
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise HTTPException(status_code=500, detail="Database error")
        
    @staticmethod
    def recent_reports(
        low_temp: float, high_temp: float,
        low_humidity: float, high_humidity: float,
        low_pressure: float, high_pressure: float,
        low_coqui_common: int, high_coqui_common: int,
        low_coqui_e_monensis: int, high_coqui_e_monensis: int,
        low_coqui_antillensis: int, high_coqui_antillensis: int,
        skip: int, limit: int,
        db: connection) -> list:

        @dataclass
        class ReportTableEntry:
            ttime: datetime
            crcoqui_common: int
            crcoqui_e_monensis: int
            crcoqui_antillensis: int
            wdhumidity: float
            wdtemperature: float
            wdpressure: float
            wddid_rain: bool
            afid: int # Front end should generate URL to audio file by using get audio file endpoint
        
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL(
                        """
                        select t.ttime, c.crcoqui_common, c.crcoqui_e_monensis, c.crcoqui_antillensis, w.wdhumidity, w.wdtemperature, w.wdpressure, w.wddid_rain, a.afid
                        from timestampindex t natural inner join classifierreport c natural inner join weatherdata w natural inner join audiofile a 
                        where 
                        %(lowhum)s <= w.wdhumidity and w.wdhumidity <= %(highhum)s and
                        %(lowtemp)s <= w.wdtemperature and w.wdtemperature <= %(hightemp)s and
                        %(lowpress)s <= w.wdpressure and w.wdpressure <= %(highpress)s and
                        %(lowcommon)s <= c.crcoqui_common and c.crcoqui_common <= %(highcommon)s and
                        %(lowmonensis)s <= c.crcoqui_e_monensis and c.crcoqui_e_monensis <= %(highmonensis)s and
                        %(lowantillensis)s <= c.crcoqui_antillensis and c.crcoqui_antillensis <= %(highantillensis)s
                        order by t.ttime
                        offset %(offset)s
                        limit %(limit)s
                        """
                    ),
                    {
                        'lowhum': low_humidity,
                        'highhum': high_humidity,
                        'lowtemp': low_temp,
                        'hightemp': high_temp,
                        'lowpress': low_pressure,
                        'highpress': high_pressure,
                        'lowcommon': low_coqui_common,
                        'highcommon': high_coqui_common,
                        'lowmonensis': low_coqui_e_monensis,
                        'highmonensis': high_coqui_e_monensis,
                        'lowantillensis': low_coqui_antillensis,
                        'highantillensis': high_coqui_antillensis,
                        'offset': skip,
                        'limit': limit
                    }
                )

                return list(starmap(ReportTableEntry, curs.fetchall()))

            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise HTTPException(status_code=500, detail="Database error")


