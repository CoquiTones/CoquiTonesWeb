import aiomqtt
import unittest

class MqttTest(unittest.IsolatedAsyncioTestCase):
    async def test_hello(self):
        async with aiomqtt.Client("test.mosquitto.org") as client:
            await client.publish("temperature/outside", payload=28.4)

if __name__ == '__main__':
    unittest.main()