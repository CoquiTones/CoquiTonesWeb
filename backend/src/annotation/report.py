"""Source resolution for the authoritative annotation report.

Kept free of FastAPI and database imports so the resolution rules can be
unit-tested without a running server or database driver.
"""

from annotation.models import (
    SPECIES_FIELDS,
    AnnotationReportRecord,
    AnnotationReportResponse,
    AnnotationSlice,
    AnnotationSliceRecord,
    AnnotationSource,
)
from annotation.windows import (
    normalize_classifier_slices,
    timedelta_to_seconds,
    window_index_for,
)


def manual_slice_to_annotation(
    record: AnnotationSliceRecord,
) -> tuple[AnnotationSlice | None, str | None]:
    """Convert one persisted manual window to API form.

    A row that is not aligned with the ten-second grid is skipped with a
    warning instead of being silently shifted.
    """
    try:
        start = timedelta_to_seconds(record.starttime)
        end = timedelta_to_seconds(record.endtime)
    except (AttributeError, TypeError):
        return None, "Skipped a saved manual window with invalid start or end times."

    if not isinstance(record.windowindex, int) or record.windowindex < 0:
        return None, "Skipped a saved manual window with an invalid window index."

    index = window_index_for(start, end)
    if index is None or index != record.windowindex:
        return None, (
            f"Skipped saved manual window {record.windowindex + 1} because it "
            "does not match the ten-second grid."
        )

    missing = [field for field in SPECIES_FIELDS if not hasattr(record, field)]
    if missing:
        return None, "Skipped a saved manual window with missing species values."

    return (
        AnnotationSlice(
            window_index=index,
            start_time=start,
            end_time=end,
            **{
                field: bool(getattr(record, field))
                for field in SPECIES_FIELDS
            },
        ),
        None,
    )


def normalize_manual_slices(
    records: list[AnnotationSliceRecord],
) -> tuple[list[AnnotationSlice], list[str]]:
    """Normalize saved manual windows and collect compatibility warnings."""
    normalized: list[AnnotationSlice] = []
    warnings: list[str] = []
    seen: set[int] = set()

    for record in records:
        annotation_slice, warning = manual_slice_to_annotation(record)
        if warning:
            warnings.append(warning)
        if annotation_slice is None:
            continue
        if annotation_slice.window_index in seen:
            warnings.append(
                f"Ignored duplicate saved manual window {annotation_slice.window_index + 1}."
            )
            continue
        seen.add(annotation_slice.window_index)
        normalized.append(annotation_slice)

    normalized.sort(key=lambda item: item.window_index)
    return normalized, warnings


def build_report(
    afid: int,
    manual_report: AnnotationReportRecord | None = None,
    manual_slices: list[AnnotationSliceRecord] | None = None,
    classifier_slices: list | None = None,
) -> AnnotationReportResponse:
    """Resolve the authoritative report: manual, then classifier, then none."""
    warnings: list[str] = []

    if manual_report is not None:
        manual, manual_warnings = normalize_manual_slices(manual_slices or [])
        warnings.extend(manual_warnings)
        if manual:
            return AnnotationReportResponse(
                afid=afid,
                source=AnnotationSource.manual,
                report_id=manual_report.arid,
                saved_at=manual_report.savedat,
                slices=manual,
                warnings=warnings,
            )
        warnings.append(
            "The saved manual report has no usable windows; showing classifier values instead."
        )

    classifier, classifier_warnings = normalize_classifier_slices(
        classifier_slices or []
    )
    warnings.extend(classifier_warnings)
    if classifier:
        return AnnotationReportResponse(
            afid=afid,
            source=AnnotationSource.classifier,
            report_id=None,
            saved_at=None,
            slices=classifier,
            warnings=warnings,
        )

    return AnnotationReportResponse(
        afid=afid,
        source=AnnotationSource.none,
        report_id=None,
        saved_at=None,
        slices=[],
        warnings=warnings,
    )
