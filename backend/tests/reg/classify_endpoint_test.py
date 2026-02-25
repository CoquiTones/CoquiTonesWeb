import requests
import unittest
import datetime
from tests.reg.util import *

class TestClassifyEndpoint(unittest.TestCase):

    def test_audio_insert(self):
        session = login()
        with open("./backend/tests/reg/test_audio.wav", 'rb') as file:
            url = 'https://localhost:8080/api/audio/insert'
            files = {
                'file': file
            }
            response = session.post(url, files=files, data={
                'nid': 1,
                'timestamp': datetime.datetime.now()
            })

            self.assertEqual(response.status_code, 200)

    def test_classify_no_override(self):
        session = login()
        with open("./backend/tests/reg/test_audio.wav", 'rb') as file:
            url = 'https://localhost:8080/api/audio/insert'
            files = {
                'file': file
            }
            response = session.post(url, files=files, data={
                'nid': 1,
                'timestamp': datetime.datetime.now()
            })

            self.assertEqual(response.status_code, 200)
            afid = int(response.text)

            url = f'https://localhost:8080/api/classify/by-id/{afid}'
            response = session.get(url)

            self.assertEqual(response.status_code, 200)
    
    def test_classify_no_classify(self):
        session = login()
        with open("./backend/tests/reg/test_audio.wav", 'rb') as file:
            url = 'https://localhost:8080/api/audio/insert'
            files = {
                'file': file
            }
            response = session.post(url, files=files, data={
                'nid': 1,
                'timestamp': datetime.datetime.now(),
                'classify': False
            })

            self.assertEqual(response.status_code, 200)
            afid = int(response.text)

            url = f'https://localhost:8080/api/classify/by-id/{afid}'
            response = session.get(url)

            self.assertEqual(response.status_code, 200)
    
    def test_classify_override(self):
        session = login()
        with open("./backend/tests/reg/test_audio.wav", 'rb') as file:
            url = 'https://localhost:8080/api/audio/insert'
            files = {
                'file': file
            }
            response = session.post(url, files=files, data={
                'nid': 1,
                'timestamp': datetime.datetime.now()
            })

            self.assertEqual(response.status_code, 200)
            afid = int(response.text)

            url = f'https://localhost:8080/api/classify/by-id/{afid}'
            response = session.get(url, params={
                'override': True
            })

            self.assertEqual(response.status_code, 200)

    def test_404(self):
        session = login()
        afid = -1917
        url = f'https://localhost:8080/api/classify/by-id/{afid}'
        response = session.get(url)
        self.assertEqual(response.status_code, 404)

if __name__ == '__main__':
    unittest.main()