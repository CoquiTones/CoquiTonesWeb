import requests
import unittest
import datetime

class TestClassifyEndpoint(unittest.TestCase):

    def test_audio_insert(self):
        with open("./backend/src/test_audio.wav", 'rb') as file:
            url = 'http://localhost:8080/api/audio/insert'
            files = {
                'file': file
            }
            response = requests.post(url, files=files, data={
                'nid': 1,
                'timestamp': datetime.datetime.now()
            })

            self.assertEqual(response.status_code, 200)

    def test_classify_no_override(self):
        with open("./backend/src/test_audio.wav", 'rb') as file:
            url = 'http://localhost:8080/api/audio/insert'
            files = {
                'file': file
            }
            response = requests.post(url, files=files, data={
                'nid': 1,
                'timestamp': datetime.datetime.now()
            })

            self.assertEqual(response.status_code, 200)
            afid = int(response.text)

            url = f'http://localhost:8080/api/classify/by-id/{afid}'
            response = requests.get(url)

            self.assertEqual(response.status_code, 200)
    
    # TODO: Additional tests

if __name__ == '__main__':
    unittest.main()