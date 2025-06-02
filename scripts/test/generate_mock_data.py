import psycopg2
import json
import random
import string
import tempfile
import os
import datetime
import psycopg2.extras

"""
Python Program to populate existing database with mocked data
"""
MAX_BATCH_SIZE = 1000


def get_connection_from_development_config(config_file_path):
    """
    Uses config hardcoded config file to connect to database.

    Returns:
        connection: psycopg2 connection
    """
    print("defaulting to local config for db connection in ", config_file_path)
    with open(config_file_path, "r") as f:
        db_config = json.loads(f.read())
        try:
            connection = psycopg2.connect(**db_config)
            return connection
        except psycopg2.Error as e:
            print("Error connecting to database:", e)
            return None


def random_integer(min, max) -> int:
    return random.randint(min, max)


def random_bool():
    choices = [True, False]
    return random.choice(choices)


def prepare_database(connection):

    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM classifierreport")
        cursor.execute("DELETE FROM weatherdata")
        cursor.execute("DELETE FROM audiofile")
        cursor.execute("DELETE FROM timestampindex")
        cursor.execute("DELETE FROM node")
        cursor.execute("ALTER SEQUENCE node_nid_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE timestampindex_tid_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE weatherdata_wdid_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE classifierreport_crid_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE audiofile_afid_seq RESTART WITH 1")

    connection.commit()


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


def populate_node(connection, number_of_inserts):

    latitude_range = (-90, 90)
    longitude_range = (-90, 90)
    description_length = 10
    prepared_statement = "INSERT INTO node (ntype, nlatitude, nlongitude, ndescription) VALUES (%s, %s, %s, %s)"

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
    prepared_statement = "INSERT INTO timestampindex (nid, ttime) VALUES (%s, %s)"
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
                    random_integer(1, number_of_nodes),
                    datetime.datetime.now(datetime.timezone.utc),
                )
                for i in range(number_of_rows_to_insert)
            ]
            psycopg2.extras.execute_batch(
                cursor, prepared_statement, batch_values, page_size=MAX_BATCH_SIZE
            )
            number_of_inserts_left -= number_of_rows_to_insert
    connection.commit()


def populate_audio(connection, number_of_nodes, number_of_inserts):

    prepared_statement = "INSERT INTO audiofile (tid, nid, data) VALUES (%s, %s, %s)"
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
                    random_integer(1, number_of_inserts),
                    random_integer(1, number_of_nodes),
                    random_binary_data(),
                )
                for i in range(number_of_rows_to_insert)
            ]
            psycopg2.extras.execute_batch(
                cursor, prepared_statement, batch_values, page_size=MAX_BATCH_SIZE
            )
            number_of_inserts_left -= number_of_rows_to_insert

    connection.commit()


def populate_classifierreport(connection, number_of_inserts):
    prepared_statement = "INSERT INTO classifierreport (tid, afid, cr_common_coqui_detected, cr_coqui_gryllus_detected, cr_coqui_locustus_detected, cr_coqui_portoricensis_detected, cr_coqui_unicolor_detected, cr_coqui_hedricki_detected, cr_coqui_richmondi_detected, cr_coqui_wightmanae_detected) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
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
                    random_integer(1, number_of_inserts),  # tid
                    random_integer(1, number_of_inserts),  # afid
                    random_integer(1, 50),
                    random_integer(1, 50),
                    random_integer(1, 50),
                    random_integer(1, 50),
                    random_integer(1, 50),
                    random_integer(1, 50),
                    random_integer(1, 50),
                    random_integer(1, 50),
                )
                for i in range(number_of_rows_to_insert)
            ]
            psycopg2.extras.execute_batch(
                cursor, prepared_statement, batch_values, page_size=MAX_BATCH_SIZE
            )
            number_of_inserts_left -= number_of_rows_to_insert

    connection.commit()


def populate_weatherdata(connection, number_of_nodes, number_of_inserts):

    prepared_statement = "INSERT INTO weatherdata (tid, nid, wdtemperature, wdhumidity, wdpressure, wddid_rain) VALUES(%s,%s,%s,%s,%s,%s)"
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
                    random_integer(1, number_of_inserts),
                    random_integer(1, number_of_nodes),
                    random_float(40, 115),  # temp
                    random_float(20, 100),  # humidity
                    random_float(40, 115),  # pressure
                    random_bool(),
                )
                for i in range(number_of_rows_to_insert)
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
    number_of_records = 1_000
    try:
        prepare_database(connection)
        populate_node(connection, number_of_nodes)
        populate_timestamp(connection, number_of_records, number_of_nodes)
        populate_audio(connection, number_of_nodes, number_of_records)
        populate_classifierreport(connection, number_of_records)
        populate_weatherdata(connection, number_of_nodes, number_of_records)

    except psycopg2.Error as e:
        print("Error With Generation of Mock Data\n", e)


if __name__ == "__main__":
    main()
