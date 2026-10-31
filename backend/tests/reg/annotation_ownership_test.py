import unittest
import uuid

import requests
from tests.reg.annotation_save_test import (
    fresh_afid,
    login_as,
    make_slices,
    save,
)
from tests.reg.util import host_url, login


class AnnotationOwnershipTest(unittest.TestCase):
    def test_unauthenticated_read_and_write_are_rejected(self):
        afid = 1
        read = requests.get(
            f"{host_url}api/annotations/report/{afid}",
            verify="./localhost.crt",
        )
        write = requests.post(
            f"{host_url}api/annotations/save",
            json={"afid": afid, "slices": make_slices(1)},
            verify="./localhost.crt",
        )

        self.assertEqual(read.status_code, 401, read.text)
        self.assertEqual(write.status_code, 401, write.text)

    def test_another_user_cannot_read_or_save_an_owned_recording(self):
        owner = login()
        afid = fresh_afid(owner)

        username = f"own{uuid.uuid4().hex[:12]}"
        password = "ownership-test-pw"
        created = requests.post(
            f"{host_url}api/user/createuser",
            data={"username": username, "password": password},
            verify="./localhost.crt",
        )
        if created.status_code != 200:
            self.skipTest("Could not create a second user for the ownership test")
        other = login_as(username, password)

        self.assertEqual(
            other.get(f"{host_url}api/annotations/report/{afid}").status_code,
            404,
        )
        self.assertEqual(save(other, afid, make_slices(1)).status_code, 404)

    def test_stale_save_is_rejected_even_for_the_owner(self):
        session = login()
        afid = fresh_afid(session)

        first = save(session, afid, make_slices(1, coqui=True))
        self.assertEqual(first.status_code, 200, first.text)
        second = save(
            session,
            afid,
            make_slices(1),
            base_report_id=first.json()["report_id"],
        )
        self.assertEqual(second.status_code, 200, second.text)

        stale = save(
            session,
            afid,
            make_slices(1, coqui=True),
            base_report_id=first.json()["report_id"],
        )

        self.assertEqual(stale.status_code, 409, stale.text)
        self.assertEqual(
            stale.json()["detail"]["latest_report_id"],
            second.json()["report_id"],
        )


if __name__ == "__main__":
    unittest.main()
