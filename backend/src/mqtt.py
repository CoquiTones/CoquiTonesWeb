from aiomqtt import Client
import asyncio
import threading
import dao
import os
from io import BytesIO
from dbutil import get_database_connection
from typing import Annotated
from pydantic import BaseModel, ValidationError, PlainSerializer, Base64Bytes, SecretStr
from enum import Enum
from datetime import datetime
from standaloneops import classify_and_save
from mlutil import get_model
from queue import Queue
from random import randint

MQTT_BROKER_HOSTNAME = "localhost"
MQTT_BROKER_PORT = 2043
CONTROL_TOPIC = "$CONTROL/dynamic-security/v1"
MAX_COMMAND_QUEUE_SIZE = 10

#---Report Data Types---
class WeatherData(BaseModel):
    temperature: float
    humidity: float
    pressure: float
    did_rain: bool

class AudioData(BaseModel):
    data: Base64Bytes

class Report(BaseModel):
    timestamp: datetime
    node_id: int
    audio: AudioData
    weather_data: WeatherData

#---MQTT Management Types---
class MQTTGroup(BaseModel):
    groupname: str
    priority: int

class MQTTRoleDescription(BaseModel):
    rolename: str
    priority: int

class AclType(str, Enum):
    publish_client_send = "publishClientSend"
    publish_client_receive = "publishClientReceive"
    subscribe_literal = "subscribeLiteral"
    subscribe_pattern = "subscribePattern"
    unsubscribe_literal = "unsubscribeLiteral"
    unsubscribe_pattern = "unsubscribePattern"

class MQTTAcl(BaseModel):
    acltype: AclType
    topic: str
    priority: int
    allow: bool
class MQTTRole(BaseModel):
    rolename: str
    acls: list[MQTTAcl]

class MQTTClientDescription(BaseModel):
    username: str

# ---Command types---
class MQTTArgs(BaseModel):
    command: str

class CreateClientArgs(MQTTArgs):
    command: str = "createClient"
    username: str
    password: SecretStr
    groups: list[MQTTGroup]
    roles: list[MQTTRoleDescription]

class ListClientsArgs(MQTTArgs):
    command: str = "listClients"
    verbose: bool = False
    count: int = -1
    offset: int = 0

class ListRolesArgs(MQTTArgs):
    command: str = "listRoles"

class CreateRoleArgs(MQTTArgs):
    command: str = "createRole"
    rolename: str
    textname: str | None = None
    textdescription: str | None = None
    acls: list[MQTTAcl] | None

class AddRoleACLArgs(MQTTArgs):
    command: str = "addRoleACL"
    rolename: str
    actltype: AclType
    topic: str
    priority: int
    allow: bool

#---Misc Types---

class CommandHandle(BaseModel):
    time: datetime
    id: int

report_listener_thread = None
command_listener_thread = None
command_sender_info_queue: Queue[tuple[CommandHandle, asyncio.Event]] = Queue(MAX_COMMAND_QUEUE_SIZE)
receive_command_output_channel: dict[CommandHandle, str] = {}
global_command_lock = asyncio.Lock()

def start():
    """
    Syncs broker with DB then creates a thread where the mqtt operations will run.
    """
    command_listener_thread = threading.Thread(target=lambda: asyncio.run(listen_for_commands()))
    command_listener_thread.start()
    syncing_thread = threading.Thread(target=lambda: asyncio.run(broker_sync()))
    syncing_thread.start()
    syncing_thread.join()
    report_listener_thread = threading.Thread(target=reports_main)
    report_listener_thread.start()

def end():
    """
    Join the thread if it exists
    """
    if report_listener_thread is None:
        return
    report_listener_thread.join()

async def listen_for_commands():
    async with Client(
        hostname=MQTT_BROKER_HOSTNAME,
        port=MQTT_BROKER_PORT,
        identifier="commands-listener",
        username="admin",
        password=os.environ["MOSQUITTO_DYNSEC_PASSWORD"]
    ) as client:
        await client.subscribe(CONTROL_TOPIC)
        async for message in client.messages:
            handle_command_output(str(message.payload))

def handle_command_output(command_output: str):
    handle, event = command_sender_info_queue.get()
    receive_command_output_channel[handle] = command_output
    event.set()

def reports_main():
    asyncio.run(listen_for_reports())

async def listen_for_reports():
    model = next(get_model())
    async with Client(
            hostname=MQTT_BROKER_HOSTNAME, 
            port=MQTT_BROKER_PORT, 
            identifier="coquitones-app", 
            username="reports-listener", 
            password=os.environ["SECRET_KEY"]
        ) as client:
        await client.subscribe("reports/#")
        async for message in client.messages:
            if not isinstance(message.payload, bytes):
                print("ERROR: Bad message received", message)
                continue
            try:
                report = parse_report(message.payload)
                await handle_report(report, model)
            
            except ValidationError:
                print("ERROR: Bad message received", message)


def parse_report(report_raw: bytes) -> Report:
    return Report.model_validate_json(report_raw)

async def handle_report(report: Report, model):
    print(f"INFO: New report from node {report.node_id}")
    db = get_database_connection()
    if db is None:
        print("ERROR: Couldn't save report\n\tFailed to connect to database")
        return
    timestamp_index = await dao.TimestampIndex.insert(db, report.node_id, report.timestamp)
    if timestamp_index is None:
        print(f"ERROR: Couldn't save report\n\tFailed to save timestamp {report.timestamp}")
        return
    f1 = dao.AudioFile.insert(db, report.audio.data, report.node_id, timestamp_index)
    f2 = dao.WeatherData.insert(
        db, 
        timestamp_index, 
        report.weather_data.temperature, 
        report.weather_data.humidity, 
        report.weather_data.pressure, 
        report.weather_data.did_rain
    )
    afid, wdid = await asyncio.gather(f1, f2)
    print(f"INFO: Created new audiofile {afid}")
    print(f"INFO: Created new weatherdata {wdid}")

    # We need an object that exposes a file-like interface to give to the classify function
    fake_file = BytesIO(report.audio.data)
    fake_file.seek(0)

    await classify_and_save(fake_file, afid, db, model)

def clients_from_command(command_output: str) -> dict[str, MQTTClientDescription]:

    #TODO: parser
    return {}

def roles_from_command(command_output: str) -> dict[str, MQTTRole]:
    #TODO: parser
    return {}

async def broker_sync():
    """
    Ensures there is a client set up for the report listener
    Ensures a role is set up for each user
    """

    async with Client(
            hostname=MQTT_BROKER_HOSTNAME, 
            port=MQTT_BROKER_PORT, 
            identifier="admin", 
            username="admin", 
            password=os.environ["MOSQUITTO_DYNSEC_PASSWORD"]
        ) as client:
        # Get clients from broker
        clients = clients_from_command(await _execute_command(client, ListClientsArgs()))

        # Get roles from broker
        roles = roles_from_command(await _execute_command(client, ListRolesArgs()))

        # Get users from DB
        db = get_database_connection()
        assert(db is not None)
        users = await dao.User.get_all_no_owner(db=db)

        async with asyncio.TaskGroup() as command_tasks:

            # Create listener client if necessary
            if clients.get("reports-listener") is None:
                command_tasks.create_task(_create_listener(client))

            # Create roles if necessary
            role_creation_tasks = []
            for user in users:
                role_name = f"user{user.auid}"
                if roles.get(role_name) is None:
                    role_creation_tasks.append(
                        _create_user_role(client, user.auid)
                    )


            # Modify roles by getting all nodes owned by each user and ensuring user's role has permission to send to all nodes' topics


# This function is for consumers elsewhere to be able to make a new node
async def create_node(user_id: int, node_username: str, node_password: SecretStr) -> bool:
    """
    Creates a new node and sets it up with the MQTT broker

    Args:
        user_id: id of owner
        node_username: name for the new node's client
        node_password: password for the new node's client
    
    Returns: ok
    """
    role = MQTTRoleDescription(rolename= f"user{user_id}", priority=0)
    args = CreateClientArgs(username=node_username, password=node_password, groups=[], roles=[role])
    async with Client(
            hostname=MQTT_BROKER_HOSTNAME, 
            port=MQTT_BROKER_PORT, 
            identifier="admin", 
            username="admin", 
            password=os.environ["MOSQUITTO_DYNSEC_PASSWORD"]
        ) as client:
        await _execute_command(client, args)
        return True
    
async def add_topic_access(user_id: int, node_id: int) -> bool:
    """
    Gives user's primary nodes permission to post in a node's topic

    Args:
        user_id: user whose nodes will gain permission
        node_id: new node

    Returns: ok
    """
    args = AddRoleACLArgs(rolename=f"user{user_id}", actltype=AclType.publish_client_send, topic=f"reports/{node_id}", priority=0, allow=True)
    async with Client(
            hostname=MQTT_BROKER_HOSTNAME, 
            port=MQTT_BROKER_PORT, 
            identifier="admin", 
            username="admin", 
            password=os.environ["MOSQUITTO_DYNSEC_PASSWORD"]
        ) as client:
        await _execute_command(client, args)
        return True

async def create_user_role(user_id: int) -> bool:
    """
    Creates a role for a user's nodes.

    Args:
        user_id: user

    Returns: ok
    """

    async with Client(
            hostname=MQTT_BROKER_HOSTNAME, 
            port=MQTT_BROKER_PORT, 
            identifier="admin", 
            username="admin", 
            password=os.environ["MOSQUITTO_DYNSEC_PASSWORD"]
        ) as client:
        return await _create_user_role(client, user_id)

async def _create_user_role(admin_client: Client, user_id: int) -> bool:
    """
    AS ADMIN
    Creates a role for a user's nodes.

    Args:
        admin_client: MQTT client with controls publish access
        user_id: user

    Returns: ok
    """
    args = CreateRoleArgs(
        rolename=f"user{user_id}", 
        textname=f"User {user_id}'s nodes", 
        textdescription=None,
        acls = None
    )
    await _execute_command(admin_client, args)
    return True

async def _execute_command(admin_client: Client, args: MQTTArgs) -> str:
    """
    AS ADMIN
    Executes command in broker

    Args:
        admin_client: MQTT client with controls publish access
        args: Command to send to the control topic

    Returns: Command output
    """
    await global_command_lock.acquire()
    await admin_client.publish(CONTROL_TOPIC, args.model_dump_json())

    handle = command_handle()
    # Create an event to let us know when our command's output will be ready for us to read
    # Note that the asyncio event primitive isn't thread safe; however, due to the 1 producer-1 consumer nature of how 
    # we are executing and reading the output of commands, no race conditions can occur.
    output_received = asyncio.Event()
    # Send the command listener thread a message telling it we want to receive the output for the command we sent out
    command_sender_info_queue.put((handle, output_received))
    # Wait until the output from that command is available
    await output_received.wait()
    # Retreive output
    output = receive_command_output_channel.get(handle)
    global_command_lock.release()
    assert(output is not None)
    return output

async def _create_listener(admin_client: Client) -> bool:
    """
    AS ADMIN
    Makes a new MQTT client for listening to reports.
    Assumes the role and the client don't already exist.

    Args:
        admin_client: MQTT client with controls publish access
    """

    # First create the role
    acl = MQTTAcl(
        acltype=AclType.subscribe_pattern,
        topic="reports/#",
        priority=0,
        allow=True
    )
    args = CreateRoleArgs(
        rolename="listen-to-reports",
        textname="Listen to reports",
        textdescription="Role for coquitones-app to be able to read all reports",
        acls=[acl]
    )

    await _execute_command(admin_client, args)

    role_description = MQTTRoleDescription(rolename="listen-to-reports", priority=0)
    args = CreateClientArgs(
        username="reports-listener",
        password=SecretStr(os.environ["SECRET_KEY"]),
        groups=[],
        roles=[role_description]
    )

    await _execute_command(admin_client, args)

    return True

def command_handle() -> CommandHandle:
    """
    Returns a command handle for a command scheduled right now.
    """
    return CommandHandle(time=datetime.now(), id=randint(0, 1 << 31))