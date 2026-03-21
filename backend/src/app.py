from typing import Annotated
from fastapi import FastAPI, File, UploadFile, staticfiles, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
from dbutil import DBTransactionDependency, init_connection_pool, kill_connection_pool
from mlutil import get_model, classify_audio_file
from Spectrogram import sendMelSpectrogram, sendBasicSpectrogram
from routers.security import get_current_user, LightWeightUser
from routers.security import router as security_router
from Requests.RecordToBeDeleted import RecordTimestampIndex
from contextlib import asynccontextmanager
import dao
import os
import io
import asyncio
import dotenv
import ssl
import json

from datetime import datetime, timedelta

dotenv.load_dotenv(dotenv_path="backend/src/.env")

@asynccontextmanager
async def lifespan(instance: FastAPI):
    await init_connection_pool()
    yield
    await kill_connection_pool()

app = FastAPI(lifespan=lifespan)

origins = [
    "https://localhost:5173",
    "https://localhost:8080",
]

# Safely handle environment variable
web_url = os.getenv("WEB_URL")
if web_url:
    origins.append(web_url)

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

app.include_router(security_router)


@app.get("/api/node/all")
async def node_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.Node.get_all(current_user.auid, transaction.connection)


@app.get("/api/node/{nid}")
async def node_get(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    nid: int,
    transaction: DBTransactionDependency,
):
    return await dao.Node.get(current_user.auid, nid, transaction.connection)


@app.get("/api/timestamp/all")
async def timestamp_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.TimestampIndex.get_all(current_user.auid, transaction.connection)


@app.get("/api/timestamp/{tid}")
async def timestamp_get(
    tid: int,
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.TimestampIndex.get(current_user.auid, tid, transaction.connection)


@app.get("/api/weather/all")
async def weather_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.WeatherData.get_all(current_user.auid, transaction.connection)


@app.get("/api/weather/{wdid}")
async def weather_get(
    wdid: int,
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.WeatherData.get(current_user.auid, wdid, transaction.connection)


@app.get("/api/audio/all")
async def audio_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.AudioFile.get_all(current_user.auid, transaction.connection)


@app.post(path="/api/audio", response_class=Response)
async def audio_get(
    afid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    audio_file = await dao.AudioFile.get(current_user.auid, afid, transaction.connection)
    if audio_file is None:
        raise HTTPException(status_code=404, detail="Audio file not found")
    data = audio_file.data

    return Response(content=bytes(data), media_type="audio/mpeg")  # type: ignore


@app.get("/api/audioslices/all")
async def audio_slice_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.AudioSlice.get_all(current_user.auid, transaction.connection)


@app.get(path="/api/audioslices/{asid}")
async def audio_slice_get(
    asid: int,
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.AudioSlice.get(current_user.auid, asid, transaction.connection)


# TODO: Sort this out as a service(?)
async def classify_and_save(audio, audio_file_id, db, model):
    classifier_output = classify_audio_file(audio, model)
    slice_insert_tasks = []
    for classified_slice_name, classified_slice in classifier_output.items():
        classified_slice["starttime"] = classified_slice.pop("start_time")
        classified_slice["endtime"] = classified_slice.pop("end_time")
        slice_insert_tasks.append(
            asyncio.create_task(
                dao.AudioSlice.insert(db, audio_file_id, **classified_slice),  # type: ignore
                name=classified_slice_name,
            )
        )

    done, pending = await asyncio.wait(slice_insert_tasks)
    results = map(lambda task: task.result(), done)
    return results


@app.post(path="/api/audio/insert")
async def audio_post(
    nid: Annotated[int, Form()],
    timestamp: Annotated[datetime, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
    file: UploadFile = File(...),
    classify: Annotated[bool, Form()] = True,
    model=Depends(get_model),
):
    audio_file_id = await dao.AudioFile.insert(
        transaction.connection, current_user.auid, file, nid, timestamp
    )

    if classify:
        file.file.seek(0)
        await classify_and_save(file.file, audio_file_id, transaction.connection, model)

    return audio_file_id


@app.get(path="/api/classify/by-id/{afid}")
async def classify_by_afid(
    afid: int,
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
    override: Annotated[bool, Form()] = False,
    model=Depends(get_model),
):

    if not await dao.AudioFile.exists(afid, current_user.auid, transaction.connection):
        raise HTTPException(status_code=404, detail="Audio file does not exist")

    if override or not await dao.AudioFile.is_classified(afid, transaction.connection):
        audio = await dao.AudioFile.get(current_user.auid, afid, transaction.connection)
        if audio is None or audio.data is None:
            raise HTTPException(status_code=404, detail="Audio file does not exist")

        await classify_and_save(io.BytesIO(audio.data), afid, transaction.connection, model)

    return await dao.AudioSlice.get_classified(afid, transaction.connection)


@app.post(path="/api/node/insert")
async def node_insert(
    ntype: Annotated[str, Form()],
    nlatitude: Annotated[float, Form()],
    nlongitude: Annotated[float, Form()],
    ndescription: Annotated[str, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    ownerid = current_user.auid
    newNode = dao.Node.insert(transaction.connection, ownerid, ntype, nlatitude, nlongitude, ndescription)
    return newNode


@app.delete(path="/api/node/delete/{nid}")
async def node_delete(
    nid: int,
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return dao.Node.delete(current_user.auid, nid, transaction.connection)


@app.post(path="/api/classifier/classify")
async def classify(file: UploadFile = File(...), model=Depends(get_model)):
    report = classify_audio_file(file.file, model)
    return report


@app.get(path="/api/dashboard/week-species-summary")
async def week_species_summary(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return dao.Dashboard.week_species_summary(current_user.auid, transaction.connection)


@app.get(path="/api/dashboard/node-health-check")
async def node_health_check(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return dao.Dashboard.node_health_check(current_user.auid, transaction.connection)


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
    return dao.Dashboard.recent_reports(
        **locals() | {"db": transaction.connection}
    )  # pass all keyword args as unpacked dictionary, special case for db connection


@app.post(path="/api/dashboard/recent-data")
async def recent_data(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    minTimestamp: Annotated[datetime, Form()],  # default to yesterday
    maxTimestamp: Annotated[datetime, Form()],  # default to present
    transaction: DBTransactionDependency,
):

    return dao.Dashboard.recent_data(current_user.auid, minTimestamp, maxTimestamp, transaction.connection)


@app.delete(path="/api/dashboard/delete")
async def delete_record(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    list_of_records_to_be_deleted: list[RecordTimestampIndex],
    transaction: DBTransactionDependency,
):

    return dao.Dashboard.delete_records(
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
