from weather.repository import WeatherData

from dbutil import DBTransactionDependency
from routers.security import LightWeightUser, get_current_user
from typing import Annotated
from fastapi import Depends, Form, APIRouter

router = APIRouter()

@router.get("/api/weather/all")
async def weather_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await WeatherData.get_all(current_user.auid, transaction.connection)


@router.get("/api/weather/")
async def weather_get(
    wdid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await WeatherData.get(current_user.auid, wdid, transaction.connection)
