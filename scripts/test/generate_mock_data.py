import psycopg2
import json
import random
import string
import tempfile
import os
import datetime
import psycopg2.extras
import io
import hashlib
import logging

"""
Python Program to populate existing database with mocked data
"""
MAX_BATCH_SIZE = 5
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - [%(funcName)s]: %(levelname)s - %(message)s",
)
LOGGER = logging.getLogger("Mock Data Generator Logger")


def get_connection_from_development_config(config_file_path):
    """
    Uses config hardcoded config file to connect to database.

    Returns:
        connection: psycopg2 connection
    """
    LOGGER.info("defaulting to local config for db connection in " + config_file_path)
    with open(config_file_path, "r") as f:
        db_config = json.loads(f.read())
        try:
            connection = psycopg2.connect(**db_config)
            return connection
        except psycopg2.Error as e:
            LOGGER.error("Error connecting to database:", e)
            return None


def random_integer(min, max) -> int:
    return random.randint(min, max)


def random_bool():
    choices = [True, False]
    return random.choice(choices)


def hash_pw(password: bytes, salt: bytes) -> bytes:
    return hashlib.scrypt(password, salt=salt, n=16384, r=8, p=1)


def prepare_database(connection):

    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM weatherdata")
        cursor.execute("DELETE FROM audiofile")
        cursor.execute("DELETE FROM audioslice")
        cursor.execute("DELETE FROM timestampindex")
        cursor.execute("DELETE FROM node")
        cursor.execute("DELETE FROM appuser")
        cursor.execute("ALTER SEQUENCE node_nid_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE appuser_auid_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE timestampindex_tid_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE weatherdata_wdid_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE audioslice_asid_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE audiofile_afid_seq RESTART WITH 1")


def random_string(length: int) -> str:
    random_string = "".join(
        random.choices(string.ascii_letters + string.digits, k=length)
    )
    return random_string


def random_node_type() -> str:
    choices = ["primary", "secondary"]
    return random.choice(choices)


def random_binary_data(size=10) -> bytes:
    with tempfile.NamedTemporaryFile() as tmp_file:
        tmp_file.write(os.urandom(size))
        return tmp_file.read()  # might need to change this; test


def random_float(min, max) -> float:
    return random.uniform(min, max)


# Hardcode in the users so it's easier to test
def populate_appusers(connection):
    with connection.cursor() as cursor:
        username = "testuser"
        salt = os.urandom(16)
        password = b"testuserpw"
        pwhash = hash_pw(password, salt)
        cursor.execute(
            """
        INSERT INTO appuser (username, salt, pwhash) 
        VALUES (%s, %s, %s)
        """,
            (username, salt, pwhash),
        )

    connection.commit()


def populate_node(connection, number_of_inserts):

    latitude_range = (-90, 90)
    longitude_range = (-90, 90)
    description_length = 10
    prepared_statement = "INSERT INTO node (ntype, ownerid, nlatitude, nlongitude, ndescription) VALUES (%s, %s, %s, %s, %s)"

    necessary_statements = (number_of_inserts // MAX_BATCH_SIZE) + 1
    number_of_inserts_left = number_of_inserts
    with connection.cursor() as cursor:
        for i in range(necessary_statements):
            number_of_rows_to_insert = (
                number_of_inserts_left
                if (number_of_inserts_left < MAX_BATCH_SIZE)
                else MAX_BATCH_SIZE
            )
            batch_values = [
                (
                    random_node_type(),
                    1,  # owner id
                    random_float(*latitude_range),  # asterisk means unpacking
                    random_float(*longitude_range),
                    random_string(description_length),
                )
                for i in range(number_of_rows_to_insert)
            ]
            psycopg2.extras.execute_batch(
                cursor, prepared_statement, batch_values, page_size=MAX_BATCH_SIZE
            )
            number_of_inserts_left -= number_of_rows_to_insert

    connection.commit()


def populate_timestamp(connection, number_of_inserts, number_of_nodes):
    """
    Populate timestamps with a mix of recent (last 7 days) and older data.
    Returns list of (tid, ttime) tuples for recent records.
    """
    prepared_statement = "INSERT INTO timestampindex (nid, ttime) VALUES (%s, %s)"
    necessary_statements = (number_of_inserts // MAX_BATCH_SIZE) + 1
    number_of_inserts_left = number_of_inserts

    # Calculate split: 40% recent data, 60% older data
    recent_count = int(number_of_inserts * 0.4)
    older_count = number_of_inserts - recent_count

    recent_records = []

    with connection.cursor() as cursor:
        # Insert recent records (last 7 days)
        remaining_recent = recent_count
        for i in range((recent_count // MAX_BATCH_SIZE) + 1):
            if remaining_recent <= 0:
                break
            number_of_rows_to_insert = (
                remaining_recent
                if (remaining_recent < MAX_BATCH_SIZE)
                else MAX_BATCH_SIZE
            )
            batch_values = [
                (
                    random_integer(1, number_of_nodes),
                    datetime.datetime.now(datetime.timezone.utc)
                    - datetime.timedelta(
                        days=random_integer(0, 7),
                        seconds=random_integer(0, 60 * 60 * 24),
                    ),
                )
                for j in range(number_of_rows_to_insert)
            ]
            psycopg2.extras.execute_batch(
                cursor, prepared_statement, batch_values, page_size=MAX_BATCH_SIZE
            )
            remaining_recent -= number_of_rows_to_insert

        # Insert older records (8-30 days ago)
        remaining_older = older_count
        for i in range((older_count // MAX_BATCH_SIZE) + 1):
            if remaining_older <= 0:
                break
            number_of_rows_to_insert = (
                remaining_older
                if (remaining_older < MAX_BATCH_SIZE)
                else MAX_BATCH_SIZE
            )
            batch_values = [
                (
                    random_integer(1, number_of_nodes),
                    datetime.datetime.now(datetime.timezone.utc)
                    - datetime.timedelta(
                        days=random_integer(8, 30),
                        seconds=random_integer(0, 60 * 60 * 24),
                    ),
                )
                for j in range(number_of_rows_to_insert)
            ]
            psycopg2.extras.execute_batch(
                cursor, prepared_statement, batch_values, page_size=MAX_BATCH_SIZE
            )
            remaining_older -= number_of_rows_to_insert

    connection.commit()


def populate_audio(connection, number_of_inserts):

    prepared_statement = (
        "INSERT INTO audiofile (ownerid, tid, data) VALUES (%s, %s, %s)"
    )
    necessary_statements = (number_of_inserts // MAX_BATCH_SIZE) + 1
    number_of_inserts_left = number_of_inserts

    with connection.cursor() as cursor:
        with open("backend/tests/reg/test_audio.wav", "rb") as audio_file:
            file_bytes = audio_file.read()

            # Get all valid timestamp IDs
            cursor.execute("SELECT tid FROM timestampindex ORDER BY tid")
            all_tids = [row[0] for row in cursor.fetchall()]

            if not all_tids:
                LOGGER.warning("No timestamps available for audio file insertion")
                return

            for i in range(necessary_statements):
                number_of_rows_to_insert = (
                    number_of_inserts_left
                    if (number_of_inserts_left < MAX_BATCH_SIZE)
                    else MAX_BATCH_SIZE
                )
                batch_values = [
                    (
                        1,  # owner id
                        random.choice(all_tids),  # Use actual tid from timestampindex
                        file_bytes,
                    )
                    for j in range(number_of_rows_to_insert)
                ]
                psycopg2.extras.execute_batch(
                    cursor, prepared_statement, batch_values, page_size=MAX_BATCH_SIZE
                )
                number_of_inserts_left -= number_of_rows_to_insert

    LOGGER.info(
        "Successfully Populated Audiofile data. Proceeding to Generate audioslices "
    )
    for afid in range(1, number_of_inserts + 1):
        populate_audioslice(connection, afid, 6)

    connection.commit()


def populate_audioslice(connection, audio_file_id, number_of_inserts):
    prepared_statement = "INSERT INTO audioslice (afid, starttime, endtime, coqui, wightmanae, gryllus, portoricensis, unicolor, hedricki, locustus, richmondi) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
    necessary_statements = (number_of_inserts // MAX_BATCH_SIZE) + 1
    number_of_inserts_left = number_of_inserts

    with connection.cursor() as cursor:
        for i in range(necessary_statements):
            number_of_rows_to_insert = (
                number_of_inserts_left
                if (number_of_inserts_left < MAX_BATCH_SIZE)
                else MAX_BATCH_SIZE
            )
            batch_values = [
                (
                    audio_file_id,  # afid
                    f"00:00:{random_integer(1, 50):02d}",  # start time
                    f"00:00:{random_integer(1, 50):02d}",  # end time
                    random.choice((True, False)),  # coqui
                    random.choice((True, False)),  # wightmanae
                    random.choice((True, False)),  # gryllus
                    random.choice((True, False)),  # portoricensis
                    random.choice((True, False)),  # unicolor
                    random.choice((True, False)),  # hedricki
                    random.choice((True, False)),  # locustus
                    random.choice((True, False)),  # richmondi
                )
                for j in range(number_of_rows_to_insert)
            ]
            psycopg2.extras.execute_batch(
                cursor, prepared_statement, batch_values, page_size=MAX_BATCH_SIZE
            )
            number_of_inserts_left -= number_of_rows_to_insert


def populate_weatherdata(connection, number_of_inserts):
    """
    Populate weather data using actual timestamp IDs from timestampindex.
    Ensures every timestamp has corresponding audio and weather data for proper JOINs.
    """
    prepared_statement = "INSERT INTO weatherdata (tid, wdtemperature, wdhumidity, wdpressure, wddid_rain) VALUES(%s,%s,%s,%s,%s)"

    with connection.cursor() as cursor:
        # Get all valid timestamp IDs
        cursor.execute("SELECT tid FROM timestampindex ORDER BY tid")
        all_tids = [row[0] for row in cursor.fetchall()]

        if not all_tids:
            LOGGER.warning("No timestamps available for weather data insertion")
            return

        # Get audio file tids to ensure we only insert weather data for timestamps that have audio
        cursor.execute("SELECT DISTINCT tid FROM audiofile")
        audio_tids = set([row[0] for row in cursor.fetchall()])

        # Filter to only tids that have audio files
        valid_tids = [tid for tid in all_tids if tid in audio_tids]

        if not valid_tids:
            LOGGER.warning(
                "No timestamps with audio files available for weather data insertion"
            )
            return

        number_of_inserts_left = len(valid_tids)
        necessary_statements = (len(valid_tids) // MAX_BATCH_SIZE) + 1

        for i in range(necessary_statements):
            if number_of_inserts_left <= 0:
                break

            number_of_rows_to_insert = (
                number_of_inserts_left
                if (number_of_inserts_left < MAX_BATCH_SIZE)
                else MAX_BATCH_SIZE
            )

            # Use the valid tids sequentially to ensure coverage
            batch_tids = valid_tids[
                i * MAX_BATCH_SIZE : i * MAX_BATCH_SIZE + number_of_rows_to_insert
            ]

            batch_values = [
                (
                    tid,  # Use actual tid that has audio file
                    random_float(40, 115),  # temp
                    random_float(20, 100),  # humidity
                    random_float(40, 115),  # pressure
                    random_bool(),
                )
                for tid in batch_tids
            ]
            psycopg2.extras.execute_batch(
                cursor, prepared_statement, batch_values, page_size=MAX_BATCH_SIZE
            )
            number_of_inserts_left -= number_of_rows_to_insert

    connection.commit()


def main():
    config_file_path = "backend/src/testdbconfig.json"
    connection = get_connection_from_development_config(config_file_path)
    number_of_nodes = 5
    number_of_records = 100
    try:
        LOGGER.info("Beggining of Resetting Database Data. ")
        prepare_database(connection)
        LOGGER.info("Successfully Deleted Existing Table Contents.")
        populate_appusers(connection)
        LOGGER.info("Successfullly Populated appuser Table. ")
        populate_node(connection, number_of_nodes)
        LOGGER.info("Successfully Populated Node Table. ")
        populate_timestamp(connection, number_of_records, number_of_nodes)
        LOGGER.info("Successfully Populated Timestamp Table. ")
        populate_audio(connection, number_of_records)
        LOGGER.info("Successfully Populated AudioFile and AudioSlice Tables. ")
        populate_weatherdata(connection, number_of_records)
        LOGGER.info("Done!")

    except psycopg2.Error as e:
        LOGGER.error("Error With Generation of Mock Data\n", e)


if __name__ == "__main__":
    main()
