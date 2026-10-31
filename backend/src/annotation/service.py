from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path

import annotation.repository as repository
from annotation.models import (
    AnnotationReportResponse,
    AnnotationSaveRequest,
    AnnotationSaveResponse,
)
from annotation.report import build_report
from annotation.save import AnnotationConflictError, validate_save_request
from dbutil import DBTransactionDependency
from logger import Logger
from user.service import LightWeightUser, get_current_user


LOGGER = Logger.getInstance("Annotation Service")
router = APIRouter(prefix="/annotations", tags=["Annotations"])


@router.get(
    "/report/{afid}",
    response_model=AnnotationReportResponse,
    summary="Get the authoritative annotation report for a recording",
)
async def get_annotation_report(
    afid: Annotated[int, Path(ge=1)],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> AnnotationReportResponse:
    """Return the current user's manual report, classifier fallback, or none.

    Manual reports are private: the recording must belong to the authenticated
    user, and the manual lookup is scoped to that user.
    """
    connection = transaction.connection

    if not await repository.recording_owned(current_user.auid, afid, connection):
        raise HTTPException(status_code=404, detail="Audio file not found")

    manual = await repository.latest_manual_report(
        current_user.auid, afid, connection
    )
    manual_slices = (
        await repository.report_slices(manual.arid, connection)
        if manual is not None
        else []
    )
    classifier_slices = await repository.classifier_slices(afid, connection)

    return build_report(
        afid=afid,
        manual_report=manual,
        manual_slices=manual_slices,
        classifier_slices=classifier_slices,
    )


@router.post(
    "/save",
    response_model=AnnotationSaveResponse,
    summary="Save a complete manual annotation report",
)
async def save_annotation_report(
    request: AnnotationSaveRequest,
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> AnnotationSaveResponse:
    """Persist a private append-only manual report without touching classifier rows."""
    connection = transaction.connection

    if not await repository.recording_owned(current_user.auid, request.afid, connection):
        raise HTTPException(status_code=404, detail="Audio file not found")

    try:
        validate_save_request(request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    try:
        record = await repository.save_manual_report(
            current_user.auid,
            request.afid,
            request,
            connection,
        )
    except AnnotationConflictError as error:
        LOGGER.info(
            f"Rejected stale annotation save for recording {request.afid}: "
            f"latest report {error.latest_report_id}"
        )
        raise HTTPException(
            status_code=409,
            detail={
                "message": "A newer manual report exists for this recording.",
                "latest_report_id": error.latest_report_id,
            },
        )

    LOGGER.info(
        f"Saved annotation report {record.arid} for recording {request.afid} "
        f"with {len(request.slices)} windows"
    )
    return AnnotationSaveResponse(
        report_id=record.arid,
        saved_at=record.savedat,
        source="Manual",
    )
