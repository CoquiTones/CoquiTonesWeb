from aiomqtt import Client, ProtocolVersion
import asyncio
import threading
import dao
from dbutil import get_db_connection
from pydantic import BaseModel, ValidationError
from datetime import datetime
from app import classify_and_save
from mlutil import get_model

MQTT_BROKER_HOSTNAME = "localhost"
MQTT_BROKER_PORT = 2043

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    pressure: float
    did_rain: bool

class AudioData(BaseModel):
    data: bytes

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
    async with Client(hostname=MQTT_BROKER_HOSTNAME, port=MQTT_BROKER_PORT) as client:
        await client.subscribe("temperature/#")
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
    db = next(get_db_connection())
    print(f"INFO: New report from node {report.node_id}")
    timestamp_index = await dao.TimestampIndex.insert(db, report.node_id, report.timestamp)
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
    await classify_and_save(report.audio.data, afid, db, model)
    
    