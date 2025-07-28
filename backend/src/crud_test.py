import unittest
import requests

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

        self.assertTrue(type(res) is dict, 'returns dict')
        self.assertEqual(res['nid'], self.nid)
        self.assertEqual(res['ntype'], 'primary')
        self.assertEqual(res['ndescription'], 'hospital')
        self.assertAlmostEqual(res['nlatitude'], 20.887972),
        self.assertAlmostEqual(res['nlongitude'], -76.27185)
    
    def test_get_all(self):
        url = host_url + f'api/node/all'
        response = requests.get(url)
        
        res: list[dict] = response.json()

        self.assertTrue(type(res) is list, 'returns list')
        self.assertIn('nid', res[0].keys(), 'objects have nid')

        

if __name__ == '__main__':
    unittest.main()