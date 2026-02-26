from aiomqtt import Client
import asyncio
import threading
import dao
from io import BytesIO
from dbutil import get_database_connection
from typing import Annotated
from pydantic import BaseModel, ValidationError, PlainSerializer, Base64Bytes
from datetime import datetime
from standaloneops import classify_and_save
from mlutil import get_model

MQTT_BROKER_HOSTNAME = "localhost"
MQTT_BROKER_PORT = 2043

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    pressure: float
    did_rain: bool

class AudioData(BaseModel):
    data: Base64Bytes

class Report(BaseModel):
    timestamp: datetime
    node_id: int
    audio: AudioData
    weather_data: WeatherData


thread = None

def start():
    """
    Creates a thread where the mqtt operations will run.
    """
    thread = threading.Thread(target=main)
    thread.start()

def end():
    """
    Join the thread if it exists
    """
    if thread is None:
        return
    thread.join()

def main():
    asyncio.run(listen())

async def listen():
    model = next(get_model())
    async with Client(hostname=MQTT_BROKER_HOSTNAME, port=MQTT_BROKER_PORT, identifier="coquitones-app") as client:
        await client.subscribe("reports/#")
        async for message in client.messages:
            if not isinstance(message.payload, bytes):
                print("ERROR: Bad message received", message)
                continue
            try:
                report = parse_report(message.payload)
                await handle_report(report, model)
            
            except ValidationError:
                print("ERROR: Bad message received", message)


def parse_report(report_raw: bytes) -> Report:
    return Report.model_validate_json(report_raw)

async def handle_report(report: Report, model):
    print(f"INFO: New report from node {report.node_id}")
    db = get_database_connection()
    if db is None:
        print("ERROR: Couldn't save report\n\tFailed to connect to database")
        return
    timestamp_index = await dao.TimestampIndex.insert(db, report.node_id, report.timestamp)
    if timestamp_index is None:
        print(f"ERROR: Couldn't save report\n\tFailed to save timestamp {report.timestamp}")
        return
    f1 = dao.AudioFile.insert(db, report.audio.data, report.node_id, timestamp_index)
    f2 = dao.WeatherData.insert(
        db, 
        timestamp_index, 
        report.weather_data.temperature, 
        report.weather_data.humidity, 
        report.weather_data.pressure, 
        report.weather_data.did_rain
    )
    afid, wdid = await asyncio.gather(f1, f2)
    print(f"INFO: Created new audiofile {afid}")
    print(f"INFO: Created new weatherdata {wdid}")

    # We need an object that exposes a file-like interface to give to the classify function
    fake_file = BytesIO(report.audio.data)
    fake_file.seek(0)

    await classify_and_save(fake_file, afid, db, model)
    
    