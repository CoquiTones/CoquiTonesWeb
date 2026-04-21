import timestamp.repository as repository
from timestamp.router import router
from dbutil import DBTransactionDependency
from routers.security import LightWeightUser, get_current_user
from typing import Annotated
from fastapi import Depends, Form

@router.get("/api/timestamp/all")
async def timestamp_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await repository.TimestampIndex.get_all(current_user.auid, transaction.connection)


@router.get("/api/timestamp")
async def timestamp_get(
    tid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await repository.TimestampIndex.get(current_user.auid, tid, transaction.connection)
