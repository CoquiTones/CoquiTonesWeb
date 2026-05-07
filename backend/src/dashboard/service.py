import dashboard.repository as repository

from Requests.RecordToBeDeleted import RecordTimestampIndex
from dbutil import DBTransactionDependency
from user.service import LightWeightUser, get_current_user

from datetime import datetime
from typing import Annotated, List
from fastapi import APIRouter, Depends, Form

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get(path="/week-species-summary")
async def week_species_summary(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> repository.WeeklySummaryTable:
    return await repository.Dashboard.week_species_summary(
        current_user.auid, transaction.connection
    )


@router.get(path="/node-health-check")
async def node_health_check(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> List[repository.NodeReport]:
    return await repository.Dashboard.node_health_check(
        current_user.auid, transaction.connection
    )


@router.get(path="/recent-reports")
async def recent_reports(
    transaction: DBTransactionDependency,
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    low_temp: float = float("-inf"),
    high_temp: float = float("inf"),
    low_humidity: float = float("-inf"),
    high_humidity: float = float("inf"),
    low_pressure: float = float("-inf"),
    high_pressure: float = float("inf"),
    low_coqui: int = 0,
    high_coqui: int = 1 << 31 - 1,  # int max for PostgresSQL integer data type
    low_wightmanae: int = 0,
    high_wightmanae: int = 1 << 31 - 1,
    low_gryllus: int = 0,
    high_gryllus: int = 1 << 31 - 1,
    low_portoricensis: int = 0,
    high_portoricensis: int = 1 << 31 - 1,
    low_unicolor: int = 0,
    high_unicolor: int = 1 << 31 - 1,
    low_hedricki: int = 0,
    high_hedricki: int = 1 << 31 - 1,
    low_locustus: int = 0,
    high_locustus: int = 1 << 31 - 1,
    low_richmondi: int = 0,
    high_richmondi: int = 1 << 31 - 1,
    description_filter: str = "%",
    skip: int = 0,
    limit: int = 10,
    orderby: int = 1,  # This could be changed to an enum, but passing through the query might be weird.
) -> List[repository.ReportTableEntry]:
    arguments = locals() | {
        "db": transaction.connection
    }  # pass all keyword args as unpacked dictionary, special case for db connection
    arguments.pop("transaction")
    return await repository.Dashboard.recent_reports(**arguments)


@router.post(path="/recent-data")
async def recent_data(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    minTimestamp: Annotated[datetime, Form()],  # default to yesterday
    maxTimestamp: Annotated[datetime, Form()],  # default to present
    transaction: DBTransactionDependency,
) -> List[repository.RecentData]:

    return await repository.Dashboard.recent_data(
        current_user.auid, minTimestamp, maxTimestamp, transaction.connection
    )


@router.delete(path="/delete")
async def delete_record(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    list_of_records_to_be_deleted: list[RecordTimestampIndex],
    transaction: DBTransactionDependency,
) -> int:

    return await repository.Dashboard.delete_records(
        current_user.auid, list_of_records_to_be_deleted, transaction.connection
    )

