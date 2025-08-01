# Testing

Steps for running tests:
1. Make sure docker containers are running and functional.
2. Populate the database with command `python ./scripts/test/generate_mock_data.py`
3. Run the tests with command `python -m unittest discover -s "./backend/tests/" -p "*_test.py"`