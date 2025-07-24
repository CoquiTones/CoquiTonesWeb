import requests
import unittest
import datetime

class TestClassifyEndpoint(unittest.TestCase):

    def test1(self):
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

if __name__ == '__main__':
    unittest.main()