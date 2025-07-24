from typing import Annotated
from fastapi import FastAPI, File, UploadFile, staticfiles, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
from dbutil import get_db_connection
from mlutil import get_model, classify_audio_file
from Spectrogram import sendMelSpectrogram, sendBasicSpectrogram
import json
import psycopg2
import dao as dao
import os
import io
import asyncio

from datetime import datetime, timedelta


app = FastAPI()
origins = [
    "http://localhost:5173",
    "localhost:5173",
    "http://localhost:8080",
    "localhost:8080",
    "http://0.0.0.0:8080",
    os.getenv("WEB_URL"),
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


@app.get("/api/node/all")
async def node_all(db=Depends(get_db_connection)):
    return dao.Node.get_all(db)


@app.get("/api/node/{nid}")
async def node_get(nid: int, db=Depends(get_db_connection)):
    return dao.Node.get(nid, db)


@app.get("/api/timestamp/all")
async def timestamp_all(db=Depends(get_db_connection)):
    return dao.TimestampIndex.get_all(db)


@app.get("/api/timestamp/{tid}")
async def timestamp_get(tid: int, db=Depends(get_db_connection)):
    return dao.TimestampIndex.get(tid, db)


@app.get("/api/report/all")
async def report_all(db=Depends(get_db_connection)):
    return dao.ClassifierReport.get_all(db)


@app.get("/api/report/{crid}")
async def report_get(crid: int, db=Depends(get_db_connection)):
    return dao.ClassifierReport.get(crid, db)


@app.get("/api/weather/all")
async def weather_all(db=Depends(get_db_connection)):
    return dao.WeatherData.get_all(db)


@app.get("/api/report/{wdid}")
async def weather_get(wdid: int, db=Depends(get_db_connection)):
    return dao.WeatherData.get(wdid, db)


@app.get("/api/audio/all")
async def audio_all(db=Depends(get_db_connection)):
    return dao.AudioFile.get_all(db)


@app.get(path="/api/audio/{afid}", response_class=Response)
async def audio_get(afid: int, db=Depends(get_db_connection)):
    audio_file = dao.AudioFile.get(afid, db)
    data = audio_file.data

    return Response(content=data, media_type="audio/mpeg")

@app.get("/api/audioslices/all")
async def audio_all(db=Depends(get_db_connection)):
    return dao.AudioSlice.get_all(db)


@app.get(path="/api/audioslices/{asid}")
async def audio_get(asid: int, db=Depends(get_db_connection)):
    return dao.AudioSlice.get(asid, db)

@app.post(path="/api/audio/insert", response_class=Response)
async def audio_post(
    nid: Annotated[int, Form()],
    timestamp: Annotated[datetime, Form()],
    file: UploadFile = File(...),
    db=Depends(get_db_connection),
    model=Depends(get_model)
):
    print(file.filename)
    audio_file_id = await dao.AudioFile.insert(db, file, nid, timestamp)
    print("audio file id: ", audio_file_id)

    # Classify file
    file.file.seek(0)
    classifier_output = classify_audio_file(file.file, model)
    slice_insert_tasks = []
    for classified_slice_name, classified_slice in classifier_output.items():
        classified_slice['starttime'] = classified_slice.pop('start_time')
        classified_slice['endtime'] = classified_slice.pop('end_time')
        slice_insert_tasks.append(asyncio.create_task(dao.AudioSlice.insert(db, audio_file_id, **classified_slice), name=classified_slice_name))

    done, pending = await asyncio.wait(slice_insert_tasks)

    print(done)
    db.commit()
    return audio_file_id


@app.post(path="/api/mel-spectrogram/", response_class=Response)
async def mel_spectrogram_get(file: UploadFile = File(...)):
    specData = sendMelSpectrogram(file.file)
    return specData


@app.post(path="/api/basic-spectrogram/", response_class=Response)
async def basic_spectrogram_get(file: UploadFile = File(...)):
    specData = sendBasicSpectrogram(file.file)
    return specData


@app.post(path="/api/node/insert")
async def node_insert(
    ntype: Annotated[str, Form()],
    nlatitude: Annotated[str, Form()],
    nlongitude: Annotated[str, Form()],
    ndescription: Annotated[str, Form()],
    db=Depends(get_db_connection),
):
    newNode = dao.Node.insert(db, ntype, nlatitude, nlongitude, ndescription)
    print(newNode)
    return newNode


@app.delete(path="/api/node/delete")
async def node_delete(nid: int, db=Depends(get_db_connection)):
    return dao.Node.delete(nid, db)


@app.post(path="/api/ml/classify")
async def classify(file: UploadFile = File(...), model=Depends(get_model)):
    r = classify_audio_file(file.file, model)
    return r

@app.get(path="/api/dashboard/week-species-summary")
async def week_species_summary(db=Depends(get_db_connection)):
    return dao.Dashboard.week_species_summary(db)

@app.get(path="/api/dashboard/node-health-check")
async def node_health_check(db=Depends(get_db_connection)):
    return dao.Dashboard.node_health_check(db)

@app.get(path="/api/dashboard/recent-reports/")
async def recent_reports(
    low_temp: float = float('-inf'), high_temp: float = float('inf'),
    low_humidity: float = float('-inf'), high_humidity: float = float('inf'),
    low_pressure: float = float('-inf'), high_pressure: float = float('inf'),
    low_coqui:          int = 0, high_coqui:            int = 1 << 31 - 1, # int max for PostgresSQL integer data type
    low_wightmanae:     int = 0, high_wightmanae:       int = 1 << 31 - 1,
    low_gryllus:        int = 0, high_gryllus:          int = 1 << 31 - 1,
    low_portoricensis:  int = 0, high_portoricensis:    int = 1 << 31 - 1,
    low_unicolor:       int = 0, high_unicolor:         int = 1 << 31 - 1,
    low_hedricki:       int = 0, high_hedricki:         int = 1 << 31 - 1,
    low_locustus:       int = 0, high_locustus:         int = 1 << 31 - 1,
    low_richmondi:      int = 0, high_richmondi:        int = 1 << 31 - 1,   
    description_filter: str = '%',
    skip: int = 0, limit: int = 10, 
    orderby: int = 1, # This could be changed to an enum, but passing through the query might be weird.
    db=Depends(get_db_connection)):
    return dao.Dashboard.recent_reports(**locals()) # pass all keyword args as unpacked dictionary

@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_frontend():
    index_path = os.path.join(frontend_dist, "index.html")
    try:
        with open(index_path, "r") as f:
            return f.read()
    except Exception as e:
        return f"Error: {str(e)}"
