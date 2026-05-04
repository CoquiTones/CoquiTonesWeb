from weather.repository import WeatherData

from dbutil import DBTransactionDependency
from routers.security import LightWeightUser, get_current_user
from typing import Annotated, List
from fastapi import Depends, Form, APIRouter

router = APIRouter(prefix="/weather", tags=["Weather"])

@router.get("/all")
async def weather_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> List[WeatherData]:
    return await WeatherData.get_all(current_user.auid, transaction.connection)


@router.get("/")
async def weather_get(
    wdid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> WeatherData | None:
    return await WeatherData.get(current_user.auid, wdid, transaction.connection)
