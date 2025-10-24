import aiomqtt
import unittest
import datetime
import base64
from mqtt import Report, WeatherData, AudioData

MQTT_BROKER_HOSTNAME = "localhost"
MQTT_BROKER_PORT = 2043
class MqttTest(unittest.IsolatedAsyncioTestCase):
    async def test_hello(self):
        with open("./backend/tests/reg/test_audio.wav", "rb") as file:
            audio = file.read()
            encoded_audio = base64.b64encode(audio)

        async with aiomqtt.Client(hostname=MQTT_BROKER_HOSTNAME, port=MQTT_BROKER_PORT) as client:
            weather_data = WeatherData(
                temperature = 80.2,
                humidity = 20.0,
                pressure = 40054.3,
                did_rain = False
            )
            audio_data = AudioData(data = encoded_audio)
            report = Report(
                timestamp = datetime.datetime.now(),
                node_id = 1,
                audio = audio_data,
                weather_data = weather_data
            )
            json_payload = report.model_dump_json()
            await client.publish("reports/a", payload=json_payload)

if __name__ == '__main__':
    unittest.main()