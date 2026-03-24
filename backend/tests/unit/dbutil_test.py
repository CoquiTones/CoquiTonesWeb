import unittest
from unittest import IsolatedAsyncioTestCase

from dbutil import *


class TestDBUtil(IsolatedAsyncioTestCase):    
    def test_get_connection_from_environment(self):
        # TODO: Mock database network connection so this method can work in the test environment
        # conn = get_connection_from_environment()
        # self.assertIsNotNone(conn, "get connection gets something")
        pass

    def test_get_connection_from_development_config(self):
        # This is the fallback method so it always resolves
        conn = get_connection_from_development_config()
        self.assertIsNotNone(conn, "db config returns and doesn't cause validation exceptions")

    async def test_make_connection_pool(self):
        # This should always resolve if the database is running, so we'll only test the happy path
        await init_connection_pool()

        conn = await anext(db_dep())
        self.assertIsNotNone(conn, "pool can connect")
        self.assertIsNotNone(conn.cursor(), "can get cursor")
        await conn.close()

    #TODO: Make a testcase for HTTP exception that verifies that it only gets the code of the exception without leaking execution details.
    # def test_default_HTTP_exception(self):
    #     e = default_HTTP_exception('42P01', 'test')
    #     with self.assertRaises(HTTPException, msg="raises HTTPException"):
    #         raise e
        
    #     with self.assertRaisesRegex(HTTPException, r'42P01', msg="raises exception with code"):
    #         raise e

if __name__ == '__main__':
    unittest.main()