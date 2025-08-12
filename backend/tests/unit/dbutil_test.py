import unittest

from dbutil import *


class TestDBUtil(unittest.TestCase):    
    def test_get_connection_from_environment(self):
        # TODO: Mock database network connection so this method can work in the test environment
        # conn = get_connection_from_environment()
        # self.assertIsNotNone(conn, "get connection gets something")
        pass

    def test_get_connection_from_development_config(self):
        # This is the fallback method so it always resolves
        conn = get_connection_from_development_config()
        self.assertIsNotNone(conn, "get connection gets something")

    def test_get_database_connection(self):
        # This should always resolve if the database is running, so we'll only test the happy path
        conn = get_database_connection()
        self.assertIsNotNone(conn, "get connection gets something")

    def test_get_db_connection(self):
        # Same as above, let's just test that it works as a generator correctly
        conn = next(get_db_connection())
        self.assertIsNotNone(conn, "connection generator yields something")

    def test_default_HTTP_exception(self):
        e = default_HTTP_exception('42P01', 'test')
        with self.assertRaises(HTTPException, msg="raises HTTPException"):
            raise e
        
        with self.assertRaisesRegex(HTTPException, r'42P01', msg="raises exception with code"):
            raise e

if __name__ == '__main__':
    unittest.main()