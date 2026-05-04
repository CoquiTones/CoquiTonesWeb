from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import FastAPI, staticfiles, Depends, APIRouter, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from dbutil import DBTransactionDependency
from routers.security import get_current_user, LightWeightUser
from routers.security import router as security_router
from timestamp.router import router as timestamp_router
from audio.router import router as audio_router
from weather.router import router as weather_router
from node.router import router as node_router
from Requests.RecordToBeDeleted import RecordTimestampIndex
import dao
import mqtt
import os
import dotenv

from datetime import datetime, timedelta
from Logger import Logger

dotenv.load_dotenv(dotenv_path="backend/src/.env")


# Define our lifespan so we can start the mqtt client together with the server
@asynccontextmanager
async def lifespan(app: FastAPI):
    handles = await mqtt.start()
    yield
    mqtt.end(handles)


LOGGER = Logger.getInstance("Main App Component")
app = FastAPI(lifespan=lifespan)
origins = [
    "https://localhost:5173",
    "https://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the absolute path to the frontend dist directory
frontend_dist = os.path.abspath("./frontend/dist")

# Mount the dist directory to serve static assets (CSS, JS, images)
app.mount(
    "/assets",
    staticfiles.StaticFiles(directory=os.path.join(frontend_dist, "assets")),
    name="assets",
)

api = APIRouter(prefix="/api")

api.include_router(security_router)
api.include_router(timestamp_router)
api.include_router(audio_router)
api.include_router(weather_router)
api.include_router(node_router)

app.include_router(api)

@app.get(path="/api/dashboard/week-species-summary")
async def week_species_summary(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> dao.WeeklySummaryTable:
    return await dao.Dashboard.week_species_summary(
        current_user.auid, transaction.connection
    )


@app.get(path="/api/dashboard/node-health-check")
async def node_health_check(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.Dashboard.node_health_check(
        current_user.auid, transaction.connection
    )


@app.get(path="/api/dashboard/recent-reports")
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
):
    arguments = locals() | {
        "db": transaction.connection
    }  # pass all keyword args as unpacked dictionary, special case for db connection
    arguments.pop("transaction")
    return await dao.Dashboard.recent_reports(**arguments)


@app.post(path="/api/dashboard/recent-data")
async def recent_data(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    minTimestamp: Annotated[datetime, Form()],  # default to yesterday
    maxTimestamp: Annotated[datetime, Form()],  # default to present
    transaction: DBTransactionDependency,
):

    return await dao.Dashboard.recent_data(
        current_user.auid, minTimestamp, maxTimestamp, transaction.connection
    )


@app.delete(path="/api/dashboard/delete")
async def delete_record(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    list_of_records_to_be_deleted: list[RecordTimestampIndex],
    transaction: DBTransactionDependency,
):

    return await dao.Dashboard.delete_records(
        current_user.auid, list_of_records_to_be_deleted, transaction.connection
    )


@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_frontend():
    index_path = os.path.join(frontend_dist, "index.html")
    try:
        with open(index_path, "r") as f:
            return f.read()
    except Exception as e:
        return f"Error: {str(e)}"
