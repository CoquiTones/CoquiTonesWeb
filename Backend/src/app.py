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


app = FastAPI()
origins = [
    "http://localhost:3000",
    "localhost:3000",
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

app.mount(
    "/static",
    staticfiles.StaticFiles(directory="./Frontend/build/static"),
    name="static",
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


@app.get(path="/api/dashboard/recent_entries")
async def dashboard_recent(db=Depends(get_db_connection)):
    return dao.JointReportDAO.get_recent_entries(db)


@app.get("/", response_class=HTMLResponse)
@app.get("/{path}", response_class=HTMLResponse)
async def root():

    try:
        with open("./Frontend/build/index.html", "r") as f:
            return f.read()
    except Exception as e:
        print(e)
