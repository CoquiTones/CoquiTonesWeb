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

    #TODO: Make a testcase for HTTP exception that verifies that it only gets the code of the exception without leaking execution details.
    # def test_default_HTTP_exception(self):
    #     e = default_HTTP_exception('42P01', 'test')
    #     with self.assertRaises(HTTPException, msg="raises HTTPException"):
    #         raise e
        
    #     with self.assertRaisesRegex(HTTPException, r'42P01', msg="raises exception with code"):
    #         raise e

if __name__ == '__main__':
    unittest.main()