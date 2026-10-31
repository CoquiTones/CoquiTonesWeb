import datetime
import time
import unittest

import requests
from tests.reg.util import host_url, login

TEST_AUDIO_PATH = "./backend/tests/reg/test_audio.wav"
MISSING_AFID = 2_147_483_647


def owned_afid(session) -> int:
    """Return an afid owned by the test user, inserting audio when needed."""
    response = session.get(host_url + "api/audio/all")
    if response.status_code == 200 and response.json():
        return int(response.json()[0]["afid"])

    with open(TEST_AUDIO_PATH, "rb") as file:
        response = session.post(
            host_url + "api/audio/insert",
            files={"file": file},
            data={"nid": 1, "timestamp": datetime.datetime.now()},
        )
    if response.status_code != 200:
        raise unittest.SkipTest("Could not create a recording for the report test")
    afid = int(response.text)

    deadline = time.monotonic() + 2.0
    while time.monotonic() < deadline:
        if session.get(f"{host_url}api/annotations/report/{afid}").status_code == 200:
            break
        time.sleep(0.05)
    return afid


class AnnotationReportEndpointTest(unittest.TestCase):
    def test_authenticated_report_returns_the_contract_shape(self):
        session = login()
        afid = owned_afid(session)

        response = session.get(f"{host_url}api/annotations/report/{afid}")

        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body["afid"], afid)
        self.assertIn(body["source"], {"Manual", "Classifier", "None"})
        self.assertIsInstance(body["slices"], list)
        self.assertIsInstance(body["warnings"], list)
        self.assertIn("report_id", body)
        self.assertIn("saved_at", body)
        for slice_value in body["slices"]:
            self.assertIn("window_index", slice_value)
            self.assertIn("start_time", slice_value)
            self.assertIn("end_time", slice_value)

    def test_missing_recording_returns_not_found(self):
        session = login()

        response = session.get(
            f"{host_url}api/annotations/report/{MISSING_AFID}"
        )

        self.assertEqual(response.status_code, 404, response.text)

    def test_unauthenticated_report_is_rejected(self):
        response = requests.get(
            f"{host_url}api/annotations/report/1",
            verify="./localhost.crt",
        )

        self.assertEqual(response.status_code, 401, response.text)

    def test_non_positive_identifier_is_rejected(self):
        session = login()

        response = session.get(f"{host_url}api/annotations/report/0")

        self.assertEqual(response.status_code, 422, response.text)


if __name__ == "__main__":
    unittest.main()
