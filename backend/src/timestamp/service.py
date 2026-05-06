import timestamp.repository as repository
from dbutil import DBTransactionDependency
from user.service import LightWeightUser, get_current_user
from typing import Annotated, List
from fastapi import Depends, Form, APIRouter

router = APIRouter(prefix="/timestamp", tags=["Timestamp"])

@router.get("/all")
async def timestamp_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> List[repository.TimestampIndex]:
    return await repository.TimestampIndex.get_all(current_user.auid, transaction.connection)


@router.get("/")
async def timestamp_get(
    tid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> repository.TimestampIndex | None:
    return await repository.TimestampIndex.get(current_user.auid, tid, transaction.connection)
