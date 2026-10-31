import math
from datetime import timedelta

from annotation.models import (
    SPECIES_FIELDS,
    AnnotationSlice,
)


WINDOW_SECONDS = 10.0
_EPSILON = 1e-6


def timedelta_to_seconds(value: timedelta) -> float:
    """Convert a database interval to seconds."""
    if not isinstance(value, timedelta):
        raise TypeError("Expected a datetime.timedelta value")
    return float(value.total_seconds())


def build_window_grid(duration_seconds: float, window_seconds: float = WINDOW_SECONDS) -> list[tuple[int, float, float]]:
    """Return (index, start, end) tuples covering a recording duration."""
    duration = float(duration_seconds)
    if not math.isfinite(duration) or duration <= 0 or window_seconds <= 0:
        return []

    count = math.ceil(duration / window_seconds)
    return [
        (index, index * window_seconds, min(duration, (index + 1) * window_seconds))
        for index in range(count)
    ]


def window_index_for(
    start_seconds: float,
    end_seconds: float,
    window_seconds: float = WINDOW_SECONDS,
) -> int | None:
    """Return the grid index for an aligned slice, or None when it is invalid."""
    start = float(start_seconds)
    end = float(end_seconds)
    if not math.isfinite(start) or not math.isfinite(end) or start < 0:
        return None
    if not math.isclose(start % window_seconds, 0.0, abs_tol=_EPSILON):
        return None
    if end <= start or end - start > window_seconds + _EPSILON:
        return None
    return int(round(start / window_seconds))


def validate_slices(
    slices: list[AnnotationSlice],
    window_seconds: float = WINDOW_SECONDS,
) -> None:
    """Validate a complete, contiguous annotation report.

    Raises:
        ValueError: when the report is empty, has duplicate or non-contiguous
            indexes, uses wrong start boundaries, has an invalid duration, or
            omits species flags.
    """
    if not slices:
        raise ValueError("At least one annotation window is required")

    seen: set[int] = set()
    for expected_index, item in enumerate(slices):
        if item.window_index != expected_index:
            raise ValueError(
                "Annotation windows must be contiguous and start at index 0"
            )
        if item.window_index in seen:
            raise ValueError("Annotation window indexes must be unique")
        seen.add(item.window_index)

        expected_start = expected_index * window_seconds
        if not math.isclose(item.start_time, expected_start, abs_tol=_EPSILON):
            raise ValueError(
                f"Window {expected_index} must start at {expected_start:g} seconds"
            )
        if item.end_time <= item.start_time:
            raise ValueError(
                f"Window {expected_index} must end after it starts"
            )
        if item.end_time - item.start_time > window_seconds + _EPSILON:
            raise ValueError(
                f"Window {expected_index} cannot be longer than {window_seconds:g} seconds"
            )

        for field in SPECIES_FIELDS:
            if not isinstance(getattr(item, field), bool):
                raise ValueError(
                    f"Window {expected_index} is missing the {field} species flag"
                )


def classifier_slice_to_annotation(
    classifier_slice,
    window_seconds: float = WINDOW_SECONDS,
) -> tuple[AnnotationSlice | None, str | None]:
    """Normalize an existing audioslice row to an annotation window.

    Returns a warning instead of silently shifting a row that does not align
    with the ten-second grid.
    """
    missing = [field for field in SPECIES_FIELDS if not hasattr(classifier_slice, field)]
    if missing:
        return None, "Skipped a classifier slice with missing species values."

    try:
        start = timedelta_to_seconds(classifier_slice.starttime)
        end = timedelta_to_seconds(classifier_slice.endtime)
    except TypeError:
        return None, "Skipped a classifier slice with invalid start or end times."

    index = window_index_for(start, end, window_seconds)
    if index is None:
        return None, (
            f"Skipped classifier slice {start:g}-{end:g}s because it does not "
            "match a ten-second window."
        )

    return (
        AnnotationSlice(
            window_index=index,
            start_time=start,
            end_time=end,
            **{field: bool(getattr(classifier_slice, field)) for field in SPECIES_FIELDS},
        ),
        None,
    )


def normalize_classifier_slices(
    classifier_slices: list,
    window_seconds: float = WINDOW_SECONDS,
) -> tuple[list[AnnotationSlice], list[str]]:
    """Normalize a classifier report and collect compatibility warnings."""
    normalized: list[AnnotationSlice] = []
    warnings: list[str] = []

    for classifier_slice in classifier_slices:
        annotation_slice, warning = classifier_slice_to_annotation(
            classifier_slice, window_seconds
        )
        if warning:
            warnings.append(warning)
        if annotation_slice is not None:
            normalized.append(annotation_slice)

    normalized.sort(key=lambda item: item.window_index)
    return normalized, warnings
