import datetime
import time
import unittest
import uuid

import requests
from requests_oauthlib import OAuth2Session
from tests.reg.util import certfile, host_url, login

TEST_AUDIO_PATH = "./backend/tests/reg/test_audio.wav"


def fresh_afid(session) -> int:
    """Insert a new recording owned by the test user."""
    with open(TEST_AUDIO_PATH, "rb") as file:
        response = session.post(
            host_url + "api/audio/insert",
            files={"file": file},
            data={
                "nid": 1,
                "timestamp": datetime.datetime.now(),
                "classify": False,
            },
        )
    if response.status_code != 200:
        raise unittest.SkipTest("Could not create a recording for the save test")
    return int(response.json()["afid"])


def make_slices(count=2, coqui=False):
    return [
        {
            "window_index": index,
            "start_time": index * 10,
            "end_time": index * 10 + 10,
            "coqui": coqui and index == 0,
            "wightmanae": False,
            "gryllus": False,
            "portoricensis": False,
            "unicolor": False,
            "hedricki": False,
            "locustus": False,
            "richmondi": False,
        }
        for index in range(count)
    ]


def save(session, afid, slices, base_report_id=None, overwrite=False):
    return session.post(
        host_url + "api/annotations/save",
        json={
            "afid": afid,
            "base_report_id": base_report_id,
            "overwrite": overwrite,
            "slices": slices,
        },
    )


def login_as(username, password):
    response = requests.post(
        host_url + "api/token",
        data={
            "grant_type": "password",
            "username": username,
            "password": password,
        },
        verify=certfile,
    )
    oauth = OAuth2Session(client_id=username, token=response.json())
    oauth.verify = certfile
    return oauth


class AnnotationSaveEndpointTest(unittest.TestCase):
    def test_saved_report_reloads_with_manual_source(self):
        session = login()
        afid = fresh_afid(session)

        response = save(session, afid, make_slices(2, coqui=True))
        self.assertEqual(response.status_code, 200, response.text)
        report_id = response.json()["report_id"]

        report = session.get(f"{host_url}api/annotations/report/{afid}").json()
        self.assertEqual(report["source"], "Manual")
        self.assertEqual(report["report_id"], report_id)
        self.assertEqual(len(report["slices"]), 2)
        self.assertTrue(report["slices"][0]["coqui"])
        self.assertFalse(report["slices"][1]["coqui"])

    def test_stale_save_conflicts_and_overwrite_succeeds(self):
        session = login()
        afid = fresh_afid(session)

        first = save(session, afid, make_slices(2, coqui=True))
        self.assertEqual(first.status_code, 200, first.text)
        first_id = first.json()["report_id"]

        second = save(session, afid, make_slices(2), base_report_id=first_id)
        self.assertEqual(second.status_code, 200, second.text)
        second_id = second.json()["report_id"]

        stale = save(session, afid, make_slices(1), base_report_id=first_id)
        self.assertEqual(stale.status_code, 409, stale.text)
        self.assertEqual(stale.json()["detail"]["latest_report_id"], second_id)

        overwritten = save(
            session,
            afid,
            make_slices(1, coqui=True),
            base_report_id=first_id,
            overwrite=True,
        )
        self.assertEqual(overwritten.status_code, 200, overwritten.text)

        report = session.get(f"{host_url}api/annotations/report/{afid}").json()
        self.assertEqual(report["source"], "Manual")
        self.assertEqual(report["report_id"], overwritten.json()["report_id"])
        self.assertEqual(len(report["slices"]), 1)
        self.assertTrue(report["slices"][0]["coqui"])

    def test_classifier_rows_are_not_modified_by_a_manual_save(self):
        session = login()
        afid = fresh_afid(session)

        before = [
            item for item in session.get(
                f"{host_url}api/audioslices/all"
            ).json()
            if item["afid"] == afid
        ]
        save(session, afid, make_slices(2, coqui=True))
        after = [
            item for item in session.get(
                f"{host_url}api/audioslices/all"
            ).json()
            if item["afid"] == afid
        ]

        self.assertEqual(before, after)
        report = session.get(f"{host_url}api/annotations/report/{afid}").json()
        self.assertEqual(report["source"], "Manual")

    def test_another_user_cannot_read_or_save_the_report(self):
        owner = login()
        afid = fresh_afid(owner)

        username = f"anno{uuid.uuid4().hex[:12]}"
        password = "annotation-test-pw"
        created = requests.post(
            host_url + "api/user/createuser",
            data={"username": username, "password": password},
            verify=certfile,
        )
        if created.status_code != 200:
            self.skipTest("Could not create a second user for the ownership test")
        other = login_as(username, password)

        read = other.get(f"{host_url}api/annotations/report/{afid}")
        self.assertEqual(read.status_code, 404, read.text)

        write = save(other, afid, make_slices(2))
        self.assertEqual(write.status_code, 404, write.text)

    def test_sixty_window_save_finishes_under_three_seconds(self):
        session = login()
        afid = fresh_afid(session)
        slices = make_slices(60, coqui=True)

        started = time.perf_counter()
        response = save(session, afid, slices)
        elapsed = time.perf_counter() - started

        self.assertEqual(response.status_code, 200, response.text)
        self.assertLess(elapsed, 3.0, f"Save took {elapsed:.2f}s")

        report = session.get(f"{host_url}api/annotations/report/{afid}").json()
        self.assertEqual(report["source"], "Manual")
        self.assertEqual(len(report["slices"]), 60)


if __name__ == "__main__":
    unittest.main()
