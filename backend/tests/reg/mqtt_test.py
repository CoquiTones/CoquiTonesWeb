import aiomqtt
import asyncio
import requests
import unittest
import datetime
import base64
import dotenv
dotenv.load_dotenv("backend/src/.env")
from mqtt import Report, WeatherData, AudioData
import tests.reg.util as util

host_url = 'https://localhost:8080/'

MQTT_BROKER_HOSTNAME = "localhost"
MQTT_BROKER_PORT = 2043
NODE_CLIENT_PASSWORD = "stunseed"

def create_node(name: str) -> dict:
    session = util.login()
    new_node = {
        "ntype": "primary",
        "nname": name,
        "nlatitude": 50,
        "nlongitude": 50,
        "ndescription": "for mqtt tests",
        "node_client_password": NODE_CLIENT_PASSWORD
    }
    res = session.post(url=host_url + "api/node/insert", data=new_node).json()
    return res
    

class MqttTest(unittest.IsolatedAsyncioTestCase):
    async def test_hello(self):
        """
        Test that after we upload something via mqtt, the number of timestamps goes up.
        """
        node_name = f"test{datetime.datetime.now()}"
        nid = create_node(node_name)['nid']
        with open("./backend/tests/reg/test_audio.mp3", "rb") as file:
            audio = file.read()
            encoded_audio = base64.b64encode(audio)

        url = host_url + f'api/timestamp/all'
        
        session = util.login()
        response = session.get(url)
        timestamps = response.json()
        n_timestamps_before = len(timestamps)

        async with aiomqtt.Client(
            hostname=MQTT_BROKER_HOSTNAME, 
            port=MQTT_BROKER_PORT,
            username=node_name,
            password=NODE_CLIENT_PASSWORD,
            identifier="testnode"
            ) as client:
            weather_data = WeatherData(
                temperature = 80.2,
                humidity = 20.0,
                pressure = 40054.3,
                did_rain = False
            )
            audio_data = AudioData(data = encoded_audio)
            report = Report(
                timestamp = datetime.datetime.now(),
                node_id = nid,
                audio = audio_data,
                weather_data = weather_data
            )
            json_payload = report.model_dump_json()
            await client.publish(f"reports/{nid}", payload=json_payload)

        # We don't have a way to know that the server handled the message so we'll wait, then have to check that our new report is the last one
        # TODO: Figure out a better way to do this for the test
        await asyncio.sleep(3)

        response = session.get(url)
        timestamps = response.json()
        n_timestamps_after = len(timestamps)

        self.assertEqual(n_timestamps_after, n_timestamps_before + 1)
        

if __name__ == '__main__':
    unittest.main()