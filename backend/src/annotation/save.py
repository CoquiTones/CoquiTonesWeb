"""Save rules for manual annotation reports.

Pure functions kept separate from the database and HTTP layers so validation
and conflict decisions can be unit-tested without a server.
"""

from datetime import timedelta

from annotation.models import (
    SPECIES_FIELDS,
    AnnotationSaveRequest,
    AnnotationSlice,
)
from annotation.windows import validate_slices


class AnnotationConflictError(Exception):
    """Raised when a save is based on a stale manual report."""

    def __init__(self, latest_report_id: int):
        self.latest_report_id = latest_report_id
        super().__init__(
            f"A newer manual report exists for this recording ({latest_report_id})."
        )


def check_conflict(
    latest_report_id: int | None,
    base_report_id: int | None,
    overwrite: bool = False,
) -> None:
    """Raise when the client's base report is no longer the latest one.

    Explicit overwrite is the only way to save over newer work. When no report
    exists any more, the save is not treated as a conflict.
    """
    if overwrite:
        return
    if latest_report_id is None:
        return
    if base_report_id != latest_report_id:
        raise AnnotationConflictError(latest_report_id)


def validate_save_request(request: AnnotationSaveRequest) -> None:
    """Validate the complete window set, raising ValueError for bad input."""
    validate_slices(request.slices)


def slice_rows(
    arid: int,
    slices: list[AnnotationSlice],
) -> list[tuple]:
    """Build batch-insert tuples for annotationslice rows."""
    return [
        (
            arid,
            item.window_index,
            timedelta(seconds=item.start_time),
            timedelta(seconds=item.end_time),
            *(getattr(item, field) for field in SPECIES_FIELDS),
        )
        for item in slices
    ]
