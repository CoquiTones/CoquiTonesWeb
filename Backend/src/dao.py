import psycopg2
from psycopg2 import sql
from psycopg2.extensions import connection
from dataclasses import dataclass
from datetime import datetime
from fastapi import HTTPException

node_type = str


class DAO:
    @classmethod
    def get_all(cls, db: connection) -> list:
        """Get all entities in a list."""
        with db.cursor() as curs:
            try:
                curs.execute(
                    sql.SQL("""
                    SELECT * FROM {}
                    """).format(sql.Identifier(cls.table))
                )
            except psycopg2.Error as e:
                print("Error executing SQL query:", e)
                raise HTTPException(status_code=500, detail="Database error")

            # Unpack the tuples into constructor
            return [cls(*row) for row in curs.fetchall()]


@dataclass
class Node(DAO):
    """Node DAO"""
    nid: int
    ntype: node_type
    nlatitude: float
    nlongitude: float
    ndescription: str

    table = "node"


@dataclass
class TimestampIndex(DAO):
    """Timestamp index DAO"""
    tid: int
    nid: int
    ttime: datetime

    table = "timestampindex"
