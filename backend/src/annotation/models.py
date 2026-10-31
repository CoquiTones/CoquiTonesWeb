from datetime import datetime, timedelta
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


SPECIES_FIELDS = (
    "coqui",
    "wightmanae",
    "gryllus",
    "portoricensis",
    "unicolor",
    "hedricki",
    "locustus",
    "richmondi",
)


class AnnotationSource(str, Enum):
    manual = "Manual"
    classifier = "Classifier"
    none = "None"


class AnnotationSlice(BaseModel):
    """One ten-second annotation window in API form."""

    window_index: int = Field(ge=0)
    start_time: float = Field(ge=0)
    end_time: float = Field(gt=0)
    coqui: bool
    wightmanae: bool
    gryllus: bool
    portoricensis: bool
    unicolor: bool
    hedricki: bool
    locustus: bool
    richmondi: bool


class AnnotationReportResponse(BaseModel):
    """Authoritative report for one recording and the current user."""

    afid: int
    source: AnnotationSource
    report_id: int | None = None
    saved_at: datetime | None = None
    slices: list[AnnotationSlice] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class AnnotationSaveRequest(BaseModel):
    """Complete manual report save request."""

    afid: int = Field(ge=1)
    base_report_id: int | None = None
    overwrite: bool = False
    slices: list[AnnotationSlice] = Field(min_length=1)


class AnnotationSaveResponse(BaseModel):
    """Result of a successful manual report save."""

    report_id: int
    saved_at: datetime
    source: Literal["Manual"] = "Manual"


class AnnotationConflictDetail(BaseModel):
    """Structured detail for a stale-save conflict."""

    message: str
    latest_report_id: int


class AnnotationConflictResponse(BaseModel):
    """FastAPI-compatible 409 response envelope."""

    detail: AnnotationConflictDetail


class AnnotationReportRecord(BaseModel):
    """Database row for a persisted manual report."""

    model_config = ConfigDict(from_attributes=True)

    arid: int
    afid: int
    ownerid: int
    savedat: datetime


class AnnotationSliceRecord(BaseModel):
    """Database row for one persisted manual annotation window."""

    model_config = ConfigDict(from_attributes=True)

    anid: int
    arid: int
    windowindex: int
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
