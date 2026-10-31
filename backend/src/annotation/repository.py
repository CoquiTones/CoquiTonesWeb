from psycopg import Error as PGError
from psycopg.connection_async import AsyncConnection
from psycopg.rows import class_row

from annotation.models import (
    AnnotationReportRecord,
    AnnotationSaveRequest,
    AnnotationSliceRecord,
)
from annotation.save import check_conflict, slice_rows
from audio.repository import AudioFile, AudioSlice
from dbutil import default_HTTP_exception
from logger import Logger


LOGGER = Logger.getInstance("Annotation Repository")


async def latest_manual_report(
    owner: int,
    afid: int,
    db: AsyncConnection,
) -> AnnotationReportRecord | None:
    """Return the latest manual report for one recording and annotator."""
    async with db.cursor(row_factory=class_row(AnnotationReportRecord)) as curs:
        try:
            await curs.execute(
                """
                SELECT arid, afid, ownerid, savedat
                FROM annotationreport
                WHERE afid = %s AND ownerid = %s
                ORDER BY savedat DESC, arid DESC
                LIMIT 1
                """,
                (afid, owner),
            )
        except PGError as error:
            LOGGER.error("Error loading latest annotation report:", error)
            raise default_HTTP_exception(error, "get latest annotation report query")

        return await curs.fetchone()


async def report_slices(
    arid: int,
    db: AsyncConnection,
) -> list[AnnotationSliceRecord]:
    """Return all windows for a manual annotation report."""
    async with db.cursor(row_factory=class_row(AnnotationSliceRecord)) as curs:
        try:
            await curs.execute(
                """
                SELECT anid, arid, windowindex, starttime, endtime,
                       coqui, wightmanae, gryllus, portoricensis,
                       unicolor, hedricki, locustus, richmondi
                FROM annotationslice
                WHERE arid = %s
                ORDER BY windowindex
                """,
                (arid,),
            )
        except PGError as error:
            LOGGER.error("Error loading annotation report slices:", error)
            raise default_HTTP_exception(error, "get annotation report slices query")

        return await curs.fetchall()


async def classifier_slices(
    afid: int,
    db: AsyncConnection,
) -> list[AudioSlice]:
    """Return the existing classifier rows for a recording."""
    return await AudioSlice.get_classified(afid, db)


async def recording_owned(
    owner: int,
    afid: int,
    db: AsyncConnection,
) -> bool:
    """Check recording ownership through the existing audio ownership chain."""
    return bool(await AudioFile.exists(afid, owner, db))


async def save_manual_report(
    owner: int,
    afid: int,
    request: AnnotationSaveRequest,
    db: AsyncConnection,
) -> AnnotationReportRecord:
    """Append a complete manual report and its windows atomically.

    A transaction-scoped advisory lock serializes concurrent saves for the same
    recording and annotator, so the stale-base check and insert cannot race.
    """
    async with db.cursor() as curs:
        try:
            await curs.execute(
                "SELECT pg_advisory_xact_lock(%s, %s)",
                (afid, owner),
            )
            await curs.execute(
                """
                SELECT arid
                FROM annotationreport
                WHERE afid = %s AND ownerid = %s
                ORDER BY savedat DESC, arid DESC
                LIMIT 1
                """,
                (afid, owner),
            )
            latest = await curs.fetchone()
            check_conflict(
                latest[0] if latest else None,
                request.base_report_id,
                request.overwrite,
            )

            await curs.execute(
                """
                INSERT INTO annotationreport (afid, ownerid)
                VALUES (%s, %s)
                RETURNING arid, afid, ownerid, savedat
                """,
                (afid, owner),
            )
            arid, record_afid, record_owner, savedat = await curs.fetchone()

            await curs.executemany(
                """
                INSERT INTO annotationslice (
                    arid, windowindex, starttime, endtime,
                    coqui, wightmanae, gryllus, portoricensis,
                    unicolor, hedricki, locustus, richmondi
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                slice_rows(arid, request.slices),
            )
        except PGError as error:
            LOGGER.error("Error saving annotation report:", error)
            raise default_HTTP_exception(error, "save annotation report query")

    return AnnotationReportRecord(
        arid=arid,
        afid=record_afid,
        ownerid=record_owner,
        savedat=savedat,
    )
