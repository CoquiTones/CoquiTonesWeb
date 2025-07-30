import numpy as np
import requests
import unittest

host_url = 'http://localhost:8080/'

class SpectrogramTests(unittest.TestCase):
    def test_basic(self):
        url = host_url + 'api/basic-spectrogram/'
        with open('backend/src/test_audio.wav', 'rb') as file:
            files = {
                'file': file
            }
            response = requests.post(url, files=files)
        
        res = response.json()
        self.assertIn('x', res.keys())
        self.assertIn('y', res.keys())
        self.assertIn('z', res.keys())

    def test_mel(self):
        url = host_url + 'api/mel-spectrogram/'
        with open('backend/src/test_audio.wav', 'rb') as file:
            files = {
                'file': file
            }
            response = requests.post(url, files=files)
        
        res = response.json()
        self.assertIn('x', res.keys())
        self.assertIn('y', res.keys())
        self.assertIn('z', res.keys())

if __name__ == '__main__':
    unittest.main()