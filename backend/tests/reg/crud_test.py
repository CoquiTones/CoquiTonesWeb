import unittest
import requests
import datetime
from requests_oauthlib import OAuth2Session

host_url = 'http://localhost:8080/'

def login():
    url = host_url + 'api/token'
    response = requests.post(
        url=url,
        data={
            "grant_type": "password",
            "username": "testuser",
            "password": "testuserpw"
        }
    )

    oauth = OAuth2Session(client_id="testuser", token=response.json()['access_token'])

    return oauth

class NodeCRUDTest(unittest.TestCase):

    def setUp(self):
        self.session = login()
        url = host_url + 'api/node/insert'

        response = self.session.post(url, data={
            "ntype": "primary",
            "nlatitude": 20.8879728,
            "nlongitude": -76.2718481,
            "ndescription": "hospital"
        })
        self.nid = int(response.json()['nid'])

    def tearDown(self):
        url = host_url + f'api/node/delete/{self.nid}'
        self.session.delete(url)

    def test_insert(self):
        self.assertIsNotNone(self.nid)

    def test_get(self):
        url = host_url + f'api/node/{self.nid}'

        response = self.session.get(url)

        res: dict = response.json()

        self.assertIsInstance(res, dict, 'returns dict')
        self.assertEqual(res['nid'], self.nid)
        self.assertEqual(res['ntype'], 'primary')
        self.assertEqual(res['ndescription'], 'hospital')
        self.assertAlmostEqual(res['nlatitude'], 20.887972)
        self.assertAlmostEqual(res['nlongitude'], -76.27185)
    
    def test_get_all(self):
        url = host_url + f'api/node/all'
        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        
        res: list[dict] = response.json()

        self.assertIsInstance(res, list, 'returns list')
        self.assertIn('nid', res[0].keys(), 'objects have nid')

class TimeStampCRUDTest(unittest.TestCase):

    def setUp(self):
        self.session = login()
        # There's no direct timestamp creation endpoint, must upload audio file instead
        url = host_url + 'api/audio/insert'

        with open("./backend/tests/reg/test_audio.wav", 'rb') as file:
            files = {
                'file': file
            }
            response = self.session.post(url, files=files, data={
                "nid": 1,
                "timestamp": datetime.datetime.now(),
                "classify": False
            })
            
            self.afid = int(response.json())
        
    def tearDown(self):
        pass # no deletion methods yet
        # TODO: delete operation for timestamp and audio
    
    def test_get_all(self):
        url = host_url + 'api/timestamp/all'

        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()
        self.assertIsInstance(res, list, 'returns list')
        self.assertIs(type(res[0]['tid']), int, 'dicts have tid')

    def test_get(self):
        url = host_url + 'api/timestamp/all'

        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()

        tid = res[0]['tid']

        url = host_url + f'api/timestamp/{tid}'

        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()

        self.assertIsInstance(res, dict)

class AudioSlicesCRUDTest(unittest.TestCase):

    def setUp(self):
        self.session = login()
        # There's no direct audio slice creation endpoint, must upload audio file instead
        url = host_url + 'api/audio/insert'

        with open("./backend/tests/reg/test_audio.wav", 'rb') as file:
            files = {
                'file': file
            }
            response = self.session.post(url, files=files, data={
                "nid": 1,
                "timestamp": datetime.datetime.now(),
            })
            
            self.afid = int(response.json())
        
    def tearDown(self):
        pass # no deletion methods yet
        # TODO: delete operation for audioslices and audio
    
    def test_get_all(self):
        url = host_url + 'api/audioslices/all'

        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()
        self.assertIsInstance(res, list, 'returns list')
        self.assertIs(type(res[0]['asid']), int, 'dicts have asid')

    def test_get(self):
        url = host_url + 'api/audioslices/all'

        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()

        asid = res[0]['asid']

        url = host_url + f'api/audioslices/{asid}'

        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()

        self.assertIsInstance(res, dict)

class AudioCRUDTest(unittest.TestCase):

    def setUp(self):
        self.session = login()
        url = host_url + 'api/audio/insert'

        with open("./backend/tests/reg/test_audio.wav", 'rb') as file:
            files = {
                'file': file
            }
            response = self.session.post(url, files=files, data={
                "nid": 1,
                "timestamp": datetime.datetime.now(),
            })
            
            self.afid = int(response.json())
        
    def tearDown(self):
        pass # no deletion methods yet
        # TODO: delete operation for audioslices and audio
    
    def test_get_all(self):
        url = host_url + 'api/audio/all'

        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()
        self.assertIsInstance(res, list, 'returns list')
        self.assertIs(type(res[0]['afid']), int, 'dicts have afid')

    def test_get(self):
        url = host_url + f'api/audio/{self.afid}'
        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')

class WeatherDataCRUDTest(unittest.TestCase):

    def test_get_all(self):
        self.session = login()
        url = host_url + 'api/weather/all'

        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()
        self.assertIsInstance(res, list, 'returns list')
        self.assertIsInstance(res[0]['wdid'], int, 'dicts have wid')

    def test_get(self):
        url = host_url + 'api/weather/all'

        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()

        wdid = res[0]['wdid']

        url = host_url + f'api/weather/{wdid}'

        response = self.session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()

        self.assertIsInstance(res, dict)


if __name__ == '__main__':
    unittest.main()