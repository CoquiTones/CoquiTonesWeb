import requests
import unittest
from tests.reg.util import login

host_url = 'https://localhost:8080/'

class DashboardTest(unittest.TestCase):
    def test_week_species_summary(self):
        session = login()
        url = host_url + 'api/dashboard/week-species-summary'

        response = session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()

        self.assertIn('total_coqui', res.keys())
        self.assertIn('total_wightmanae', res.keys())
        self.assertIn('total_gryllus', res.keys())
        self.assertIn('total_portoricensis', res.keys())
        self.assertIn('total_unicolor', res.keys())
        self.assertIn('total_hedricki', res.keys())
        self.assertIn('total_locustus', res.keys())
        self.assertIn('total_richmondi', res.keys())
        self.assertIn('date_bin', res.keys())
    
    def test_recent_reports(self):
        session = login()
        url = host_url + 'api/dashboard/recent-reports/'

        response = session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()
        report = res[0]

        self.assertEqual(len(res), 10)

        self.assertIn('ttime', report.keys())
        self.assertIn('coqui', report.keys())
        self.assertIn('wightmanae', report.keys())
        self.assertIn('gryllus', report.keys())
        self.assertIn('portoricensis', report.keys())
        self.assertIn('unicolor', report.keys())
        self.assertIn('hedricki', report.keys())
        self.assertIn('locustus', report.keys())
        self.assertIn('richmondi', report.keys())
        self.assertIn('wdhumidity', report.keys())
        self.assertIn('wdtemperature', report.keys())
        self.assertIn('wdpressure', report.keys())
        self.assertIn('wddid_rain', report.keys())
        self.assertIn('afid', report.keys())

    def test_node_health_check(self):
        session = login()
        url = host_url + 'api/dashboard/node-health-check'

        response = session.get(url)
        self.assertEqual(response.status_code, 200, 'response OK')
        res = response.json()
        
        first_node_report = res[0]

        self.assertIn('latest_time', first_node_report.keys())
        self.assertIn('ntype', first_node_report.keys())
        self.assertIn('ndescription', first_node_report.keys())

        
        
if __name__ == '__main__':
    unittest.main()
