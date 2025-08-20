# Testing

Steps for running tests:
1. cd into project root
2. Make sure docker containers are running and functional.
3. Populate the database with command `python ./scripts/test/generate_mock_data.py`
4. [For unit tests] Set your `PYTHONPATH` environment variable to `./backend/src`.
    - On NixOS, this can be done with `PYTHONPATH = "${toString ./backend/src}"` in mkshell.
    - Other operating systems may use direnv or other tools to automatically set environment variables before running tests.

5. Run the tests with command `python -m unittest discover -s "./backend/tests/" -p "*_test.py"`