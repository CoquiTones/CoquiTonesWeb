from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import FastAPI, File, UploadFile, staticfiles, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
from fastapi import status
from dbutil import DBTransactionDependency, init_connection_pool, kill_connection_pool
from mlutil import get_model, classify_audio_file
from pydantic import SecretStr
from routers.security import get_current_user, LightWeightUser
from routers.security import router as security_router
from standaloneops import classify_and_save
from Requests.RecordToBeDeleted import RecordTimestampIndex
from contextlib import asynccontextmanager
import dao
import mqtt
import dao as dao
import os
import io
import asyncio
import dotenv
import ssl
import json

from datetime import datetime, timedelta
from Logger import Logger

dotenv.load_dotenv(dotenv_path="backend/src/.env")


# Define our lifespan so we can start the mqtt client together with the server
@asynccontextmanager
async def lifespan(app: FastAPI):
    # MQTT client startup
    await init_connection_pool()
    mqtt.start()
    yield
    mqtt.end()
    await kill_connection_pool()


LOGGER = Logger.getInstance("Main App Component")
app = FastAPI(lifespan=lifespan)
origins = [
    "https://localhost:5173",
    "https://localhost:8080",
]

# Safely handle environment variable
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


@app.get("/api/node")
async def node_get(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    nid: Annotated[int, Form()],
    transaction: DBTransactionDependency,
):
    return await dao.Node.get(current_user.auid, nid, transaction.connection)


@app.post("api/node/mqtt")
async def create_node_client(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    nid: Annotated[int, Form()],
    password: Annotated[SecretStr, Form()],
    transaction: DBTransactionDependency,
):
    """Creates an MQTT client for a node that doesn't have one."""
    node = await dao.Node.get(current_user.auid, nid, transaction.connection)
    if node is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Node doesn't exist")
    if not await mqtt.create_node(current_user.auid, node.nname, password):
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to create client"
        )


@app.get("/api/node/noclient")
async def nodes_with_no_client(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> list[dao.Node]:
    """
    Lists which of the user's primary nodes are missing a client.
    """
    async with asyncio.TaskGroup() as tg:
        all_mqtt_clients = tg.create_task(mqtt.all_clients())
        user_nodes = tg.create_task(
            dao.Node.get_all(current_user.auid, transaction.connection)
        )
    primary_nodes: list[dao.Node] = list(
        filter(lambda node: node.ntype == "primary", user_nodes.result())
    )
    client_names = all_mqtt_clients.result().keys()
    missing_nodes = filter(lambda node: node.nname in client_names, primary_nodes)
    return list(missing_nodes)


@app.get("/api/timestamp/all")
async def timestamp_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.TimestampIndex.get_all(current_user.auid, transaction.connection)


@app.get("/api/timestamp")
async def timestamp_get(
    tid: Annotated[int, Form()],
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


@app.get("/api/weather")
async def weather_get(
    wdid: Annotated[int, Form()],
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
    audio_file: dao.AudioFile | None = await dao.AudioFile.get(
        current_user.auid, afid, transaction.connection
    )
    if audio_file is None:
        raise HTTPException(status_code=404, detail="Audio file not found")
    data = audio_file.data
    assert data is not None
    return Response(content=bytes(data), media_type="audio/mpeg")


@app.get("/api/audioslices/all")
async def audio_slice_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.AudioSlice.get_all(current_user.auid, transaction.connection)


@app.get(path="/api/audioslices")
async def audio_slice_get(
    asid: Annotated[int, Form()],
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
    audio_file_id = await dao.AudioFile.insert_and_timestamp(
        transaction.connection, current_user.auid, file, nid, timestamp
    )

    if classify:
        file.file.seek(0)
        await classify_and_save(file.file, audio_file_id, transaction.connection, model)

    return audio_file_id


@app.get(path="/api/classify/by-id")
async def classify_by_afid(
    afid: Annotated[int, Form()],
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

        await classify_and_save(
            io.BytesIO(audio.data), afid, transaction.connection, model
        )

    return await dao.AudioSlice.get_classified(afid, transaction.connection)


@app.post(path="/api/node/insert")
async def node_insert(
    ntype: Annotated[str, Form()],
    nname: Annotated[str, Form()],
    nlatitude: Annotated[float, Form()],
    nlongitude: Annotated[float, Form()],
    ndescription: Annotated[str, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
    node_client_password: Annotated[SecretStr | None, Form()] = None,
):
    async with asyncio.TaskGroup() as group:
        if ntype == "primary":
            if node_client_password is None:
                raise HTTPException(
                    status_code=400,
                    detail="Must provide password for new primary nodes",
                )

            # Primary node must have a client with the broker
            # We'll do this as a task so it can be concurrent with creating the entry in the database.
            # If an exception is raised it will cancel the transaction and nothing will happen.
            async def mqtt_client_creation():
                try:
                    await mqtt.create_node(
                        current_user.auid, nname, node_client_password
                    )
                except mqtt.CommandExcept as e:
                    LOGGER.error(
                        f"ERROR: Failed to create client: \n\t{e.detail.error}\n\tCommand: {e.detail.command}"
                    )
                    raise HTTPException(500, "Failed to set up node's MQTT client")

            group.create_task(mqtt_client_creation())

        async def database_operation() -> dao.Node:
            ownerid = current_user.auid
            newNode = await dao.Node.insert(
                transaction.connection,
                ownerid,
                nname,
                ntype,
                nlatitude,
                nlongitude,
                ndescription,
            )
            if newNode is None:
                raise HTTPException(500, "Failed to create new node")

            # All the user's primary nodes must have access to a topic corresponding to the new node
            # This allows them to upload reports from the new node into the appropriate topic
            try:
                await mqtt.add_topic_access(current_user.auid, newNode.nid)
            except mqtt.CommandExcept as e:
                LOGGER.error(
                    f"ERROR: Failed to add topic access: \n\t{e.detail.error}\n\tCommand: {e.detail.command}"
                )
                raise HTTPException(500, "Failed to set up MQTT permissions for node")

            return newNode

        node_task = group.create_task(database_operation())

    return node_task.result()


@app.delete(path="/api/node/delete")
async def node_delete(
    nid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await dao.Node.delete(current_user.auid, nid, transaction.connection)


@app.post(path="/api/classifier/classify")
async def classify(file: UploadFile = File(...), model=Depends(get_model)):
    report = classify_audio_file(file.file, model)
    return report


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
