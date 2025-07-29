import unittest
import requests
import datetime

host_url = 'http://localhost:8080/'

class NodeCRUDTest(unittest.TestCase):

    def setUp(self):
        url = host_url + 'api/node/insert'

        response = requests.post(url, data={
            "ntype": "primary",
            "nlatitude": 20.8879728,
            "nlongitude": -76.2718481,
            "ndescription": "hospital"
        })
        self.nid = int(response.json()['nid'])

    def tearDown(self):
        url = host_url + f'api/node/delete/{self.nid}'
        requests.delete(url)

    def test_insert(self):
        self.assertIsNotNone(self.nid)

    def test_get(self):
        url = host_url + f'api/node/{self.nid}'

        response = requests.get(url)

        res: dict = response.json()

        self.assertIsInstance(res, dict, 'returns dict')
        self.assertEqual(res['nid'], self.nid)
        self.assertEqual(res['ntype'], 'primary')
        self.assertEqual(res['ndescription'], 'hospital')
        self.assertAlmostEqual(res['nlatitude'], 20.887972),
        self.assertAlmostEqual(res['nlongitude'], -76.27185)
    
    def test_get_all(self):
        url = host_url + f'api/node/all'
        response = requests.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        
        res: list[dict] = response.json()

        self.assertIsInstance(res, list, 'returns list')
        self.assertIn('nid', res[0].keys(), 'objects have nid')

class TimeStampCRUDTest(unittest.TestCase):

    def setUp(self):
        # There's no direct timestamp creation endpoint, must upload audio file instead
        url = host_url + 'api/audio/insert'

        with open("./backend/src/test_audio.wav", 'rb') as file:
            files = {
                'file': file
            }
            response = requests.post(url, files=files, data={
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

        response = requests.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()
        self.assertIsInstance(res, list, 'returns list')
        self.assertIs(type(res[0]['tid']), int, 'dicts have tid')

    def test_get(self):
        pass

class AudioSlicesCRUDTest(unittest.TestCase):

    def setUp(self):
        # There's no direct audio slice creation endpoint, must upload audio file instead
        url = host_url + 'api/audio/insert'

        with open("./backend/src/test_audio.wav", 'rb') as file:
            files = {
                'file': file
            }
            response = requests.post(url, files=files, data={
                "nid": 1,
                "timestamp": datetime.datetime.now(),
            })
            
            self.afid = int(response.json())
        
    def tearDown(self):
        pass # no deletion methods yet
        # TODO: delete operation for audioslices and audio
    
    def test_get_all(self):
        url = host_url + 'api/audioslices/all'

        response = requests.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()
        self.assertIsInstance(res, list, 'returns list')
        self.assertIs(type(res[0]['asid']), int, 'dicts have asid')

    def test_get(self):
        pass

class AudioCRUDTest(unittest.TestCase):

    def setUp(self):
        url = host_url + 'api/audio/insert'

        with open("./backend/src/test_audio.wav", 'rb') as file:
            files = {
                'file': file
            }
            response = requests.post(url, files=files, data={
                "nid": 1,
                "timestamp": datetime.datetime.now(),
            })
            
            self.afid = int(response.json())
        
    def tearDown(self):
        pass # no deletion methods yet
        # TODO: delete operation for audioslices and audio
    
    def test_get_all(self):
        url = host_url + 'api/audio/all'

        response = requests.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()
        self.assertIsInstance(res, list, 'returns list')
        self.assertIs(type(res[0]['afid']), int, 'dicts have afid')

    def test_get(self):
        url = host_url + f'api/audio/{self.afid}'
        response = requests.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()

if __name__ == '__main__':
    unittest.main()