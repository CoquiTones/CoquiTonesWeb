from aiomqtt import Client
import asyncio
import dao
import os
import re
import dotenv
from io import BytesIO
from dbutil import get_transaction
from typing import Any, List, Union
from dataclasses import dataclass
from pydantic import (
    BaseModel,
    ValidationError,
    Base64Bytes,
    SecretStr,
    Field,
)
from enum import Enum
from datetime import datetime
from standaloneops import classify_and_save
from mlutil import get_model
from queue import Queue
from random import randint
from Logger import Logger
from constants import MQTT_LISTENER_PASSWORD_ENV, MQTT_ADMIN_PASSWORD_ENV, MQTT_BROKER_HOSTNAME_ENV

LOGGER = Logger.getInstance("MQTT Service Component")

dotenv.load_dotenv(dotenv_path="backend/src/.env")
ADMIN_PASSWORD = os.environ[MQTT_ADMIN_PASSWORD_ENV]
LISTENER_PASSWORD = os.environ[MQTT_LISTENER_PASSWORD_ENV]

MQTT_BROKER_HOSTNAME = os.environ[MQTT_BROKER_HOSTNAME_ENV]
MQTT_BROKER_PORT = 2043
CONTROL_TOPIC = "$CONTROL/dynamic-security/v1"
CONTROL_RESPONSE_TOPIC = "$CONTROL/dynamic-security/v1/response"

MAX_COMMAND_QUEUE_SIZE = 10
COMMAND_CHECK_PERIOD = 0.1  # seconds


# ---Report Data Types---
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


# ---MQTT Management Types---
class MQTTGroup(BaseModel):
    groupname: str
    priority: int


class MQTTRoleShort(BaseModel):
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


class MQTTRoleDescription(BaseModel):
    rolename: str


class MQTTRoleDescriptionVerbose(BaseModel):
    rolename: str
    textname: str | None = None
    textdescription: str | None = None
    allowwildcardsubs: bool = False
    acls: list[MQTTAcl] = []


class MQTTClientDescription(BaseModel):
    username: str


class SuccessfulResponse(BaseModel):
    command: str
    data: Any | None = None


class ErrorResponse(BaseModel):
    command: str
    error: str


class MQTTCommandResponses(BaseModel):
    # If this file is ever extended to implement batching up commands, this will break.
    # It assumes that the responses to a group of commands either all succeed or all fail.
    # This was written this way because List[Union[...]] cannot be made to prioritize left to right,
    # which is a problem since any ErrorResponse could actually match as a SuccessfulReponse.
    # It's therefore necessary to match ErrorResponse first and then SuccessfulReponse.
    responses: Union[List[ErrorResponse], List[SuccessfulResponse]] = Field(
        ..., union_mode="left_to_right"
    )


# ---Command types---
class MQTTArgs(BaseModel):
    command: str


class CreateClientArgs(MQTTArgs):
    command: str = "createClient"
    username: str
    password: str  # If we use SecretStr here it will send as an actual '*****' string.
    groups: list[MQTTGroup]
    roles: list[MQTTRoleShort]


class ListClientsArgs(MQTTArgs):
    command: str = "listClients"
    verbose: bool = False
    count: int = -1
    offset: int = 0


class ListRolesArgs(MQTTArgs):
    command: str = "listRoles"
    verbose: bool = False
    count: int = -1
    offset: int = 0


class GetRoleArgs(MQTTArgs):
    command: str = "getRole"
    rolename: str


class CreateRoleArgs(MQTTArgs):
    command: str = "createRole"
    rolename: str
    textname: str | None = None
    textdescription: str | None = None
    acls: list[MQTTAcl] | None


class AddRoleACLArgs(MQTTArgs):
    command: str = "addRoleACL"
    rolename: str
    acltype: AclType
    topic: str
    priority: int
    allow: bool


class MQTTCommands(BaseModel):
    commands: list[
        MQTTArgs
        | CreateClientArgs
        | CreateRoleArgs
        | ListClientsArgs
        | ListRolesArgs
        | AddRoleACLArgs
    ]


class ListClientResponse(BaseModel):
    totalCount: int
    clients: list[str]


class ListRolesReponse(BaseModel):
    totalCount: int
    roles: list[MQTTRoleDescriptionVerbose]


# ---Misc Types---


class CommandHandle(BaseModel, frozen=True):
    time: datetime
    id: int


class CommandExcept(BaseException):
    detail: ErrorResponse

    def __init__(self, response: ErrorResponse, *args):
        super().__init__(*args)
        self.detail = response

    def __repr__(self) -> str:
        return self.detail.error

    def __str__(self) -> str:
        return self.detail.error
    
@dataclass
class TaskHandles:
    command_listener_task: asyncio.Task
    report_listener_task: asyncio.Task

command_sender_info_queue: Queue[tuple[CommandHandle, asyncio.Event]] = Queue(
    MAX_COMMAND_QUEUE_SIZE
)
receive_command_output_channel: dict[CommandHandle, bytes] = {}
global_command_lock = asyncio.Lock()
listener_ready = asyncio.Event()


async def start() -> TaskHandles:
    """
    Syncs broker with DB then creates a task where the mqtt operations will run.
    Returns a handle which will be necessary to call end()
    """
    command_listener_task = asyncio.create_task(listen_for_commands())
    await broker_sync()
    report_listener_task = asyncio.create_task(listen_for_reports())
    return TaskHandles(
        command_listener_task=command_listener_task,
        report_listener_task=report_listener_task,
        )


def end(handles: TaskHandles):
    """
    Cleans up tasks.
    """
    handles.report_listener_task.cancel()
    handles.command_listener_task.cancel()


async def listen_for_commands():
    LOGGER.info("Listening for commands")
    async with Client(
        hostname=MQTT_BROKER_HOSTNAME,
        port=MQTT_BROKER_PORT,
        identifier="commands-listener",
        username="admin",
        password=ADMIN_PASSWORD,
    ) as client:
        # Don't start sending commands until they can be received
        listener_ready.set()
        await client.subscribe(CONTROL_RESPONSE_TOPIC)
        async for message in client.messages:
            assert isinstance(message.payload, bytes)
            handle_command_output(message.payload)


def handle_command_output(command_output: bytes):
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
        username="reports-listener",
        password=LISTENER_PASSWORD,
    ) as client:
        await client.subscribe("reports/#")
        async for message in client.messages:
            if not isinstance(message.payload, bytes):
                LOGGER.error("ERROR: Bad message received", message)
                continue
            try:
                report = parse_report(message.payload)
                await handle_report(report, model)

            except ValidationError:
                LOGGER.error("ERROR: Bad message received", message)


def parse_report(report_raw: bytes) -> Report:
    return Report.model_validate_json(report_raw)


async def handle_report(report: Report, model):
    LOGGER.info(f"INFO: New report from node {report.node_id}")
    async with get_transaction() as transaction:
        db = transaction.connection
        if db is None:
            LOGGER.error("Failed to connect to database")
            return
        timestamp_index = await dao.TimestampIndex.insert(
            db, report.node_id, report.timestamp
        )
        if timestamp_index is None:
            LOGGER.error(f"Failed to save timestamp {report.timestamp}")
            return
        f1 = dao.AudioFile.insert(
            db, report.audio.data, report.node_id, timestamp_index
        )
        f2 = dao.WeatherData.insert(
            db,
            timestamp_index,
            report.weather_data.temperature,
            report.weather_data.humidity,
            report.weather_data.pressure,
            report.weather_data.did_rain,
        )
        afid, wdid = await asyncio.gather(f1, f2)
        LOGGER.info(f"INFO: Created new audiofile {afid}")
        LOGGER.info(f"INFO: Created new weatherdata {wdid}")

        # We need an object that exposes a file-like interface to give to the classify function
        fake_file = BytesIO(report.audio.data)
        fake_file.seek(0)

        await classify_and_save(fake_file, afid, db, model)


def clients_from_command(
    command_output: SuccessfulResponse,
) -> dict[str, MQTTClientDescription]:
    """
    Parses the output of a listClients command.
    Args:
        command_output: output of listClients command

    Returns dict from name of each client to its description.
    """
    command_response = ListClientResponse.model_validate(command_output.data)
    return {
        username: MQTTClientDescription(username=username)
        for username in command_response.clients
    }


def roles_from_command(
    command_output: SuccessfulResponse,
) -> dict[str, MQTTRoleDescriptionVerbose]:
    """
    Parses the output of a listRoles command.
    Args:
        command_output: output of listRoles command

    Returns dict from name of each role to its description.
    """
    command_response = ListRolesReponse.model_validate(command_output.data)
    return {role.rolename: role for role in command_response.roles}


async def all_clients() -> dict[str, MQTTClientDescription]:
    """Returns dict from name of each client to their description."""
    args = ListClientsArgs()
    async with Client(
        hostname=MQTT_BROKER_HOSTNAME,
        port=MQTT_BROKER_PORT,
        identifier="admin",
        username="admin",
        password=ADMIN_PASSWORD,
    ) as client:
        return clients_from_command(await _execute_command(client, args))


async def broker_sync():
    """
    Ensures there is a client set up for the report listener.
    Ensures a role is set up for each user.
    Note that this *cannot set up a client for each node* as the user must supply the passwords themselves.
    """

    async with Client(
        hostname=MQTT_BROKER_HOSTNAME,
        port=MQTT_BROKER_PORT,
        identifier="admin",
        username="admin",
        password=ADMIN_PASSWORD,
    ) as client:
        async with get_transaction() as transaction:
            db = transaction.connection
            async with asyncio.TaskGroup() as get_tasks:
                list_clients_task = get_tasks.create_task(
                    _execute_command(client, ListClientsArgs())
                )
                list_roles_task = get_tasks.create_task(
                    _execute_command(client, ListRolesArgs(verbose=True))
                )
                get_users_task = get_tasks.create_task(dao.User.get_all_no_owner(db=db))
            # Get clients from broker
            clients = clients_from_command(list_clients_task.result())

            # Get roles from broker
            roles = roles_from_command(list_roles_task.result())

            # Get users from DB
            users = get_users_task.result()

            async with asyncio.TaskGroup() as command_tasks:

                # Create listener client if necessary.
                if "reports-listener" not in clients.keys():
                    LOGGER.info("INFO: Creating listener client")
                    command_tasks.create_task(_create_listener(client))

                # Create roles for each user that doesn't have one.
                role_creation_tasks = []
                for user in users:
                    # Each user may or may not have a role before this part of the code runs.
                    # Since we need to know that the role exists before we start adding permissions to it,
                    # we will use this event to let the task that adds the permissions know when the role is created.
                    role_exists = asyncio.Event()
                    role_name = f"user{user.auid}"
                    if role_name not in roles.keys():
                        LOGGER.info(f"INFO: Creating role {role_name}")
                        role_creation_tasks.append(
                            command_tasks.create_task(
                                _create_user_role(client, user.auid)
                            ).add_done_callback(lambda _: role_exists.set())
                        )
                    else:
                        # If the role already exists we mark it as such.
                        role_exists.set()

                    # Until we know the role exists we can't proceed.
                    await role_exists.wait()
                    # Check to see what nodes are allowed by the role.
                    try:
                        allowed_node_ids = {
                            _node_id_from_topic(acl.topic)
                            for acl in roles[role_name].acls
                            if acl.acltype == AclType.publish_client_send and acl.allow
                        }
                    except KeyError:
                        # If the role isn't in roles that means it has no acls but we created it right now so we may proceed.
                        allowed_node_ids = {}
                    # Modify roles by getting all nodes owned by each user and ensuring user's role has permission to send to all nodes' topics.
                    for node in filter(
                        lambda node: node.nid not in allowed_node_ids,
                        await dao.Node.get_all(user.auid, db),
                    ):
                        LOGGER.info(
                            f"INFO: adding topic access to node {node.nid} for user {user.username}"
                        )
                        command_tasks.create_task(
                            _add_topic_access(client, user.auid, node.nid)
                        )


def _node_id_from_topic(topic: str) -> int:
    """Extracts the node id from the topic"""
    pattern = re.compile(r"\d+")
    results = pattern.findall(topic)
    if len(results) != 1:
        raise ValueError
    else:
        return int(results[0])


# This function is for consumers elsewhere to be able to make a new node
async def create_node(user_id: int, node_username: str, node_password: SecretStr):
    """
    Creates a new node and sets it up with the MQTT broker

    Args:
        user_id: id of owner
        node_username: name for the new node's client
        node_password: password for the new node's client

    Raises:
        CommandExcept: if command fails
    """
    role = MQTTRoleShort(rolename=f"user{user_id}", priority=0)
    args = CreateClientArgs(
        username=node_username,
        password=node_password.get_secret_value(),
        groups=[],
        roles=[role],
    )
    async with Client(
        hostname=MQTT_BROKER_HOSTNAME,
        port=MQTT_BROKER_PORT,
        identifier="admin",
        username="admin",
        password=ADMIN_PASSWORD,
    ) as client:
        await _execute_command(client, args)


async def add_topic_access(user_id: int, node_id: int):
    """
    Gives user's primary nodes permission to post in a node's topic

    Args:
        user_id: user whose nodes will gain permission
        node_id: new node

    Raises:
        CommandExcept: if command fails
    """
    async with Client(
        hostname=MQTT_BROKER_HOSTNAME,
        port=MQTT_BROKER_PORT,
        identifier="admin",
        username="admin",
        password=ADMIN_PASSWORD,
    ) as client:
        await _add_topic_access(client, user_id, node_id)


async def _add_topic_access(admin_client: Client, user_id: int, node_id: int):
    """
    AS ADMIN
    Gives user's primary nodes permission to post in a node's topic

    Args:
        admin_client: MQTT client with controls publish access
        user_id: user whose nodes will gain permission
        node_id: new node

    Raises:
        CommandExcept: if command fails
    """
    args1 = AddRoleACLArgs(
        rolename=f"user{user_id}",
        acltype=AclType.publish_client_send,
        topic=f"reports/{node_id}",
        priority=0,
        allow=True,
    )
    args2 = AddRoleACLArgs(
        rolename=f"user{user_id}",
        acltype=AclType.publish_client_receive,
        topic=f"reports/{node_id}",
        priority=0,
        allow=True,
    )

    async with asyncio.TaskGroup() as command_tasks:
        command1 = command_tasks.create_task(_execute_command(admin_client, args1))
        command2 = command_tasks.create_task(_execute_command(admin_client, args2))


async def create_user_role(user_id: int):
    """
    Creates a role for a user's nodes.

    Args:
        user_id: user

    Raises:
        CommandExcept: if command fails
    """

    async with Client(
        hostname=MQTT_BROKER_HOSTNAME,
        port=MQTT_BROKER_PORT,
        identifier="admin",
        username="admin",
        password=ADMIN_PASSWORD,
    ) as client:
        await _create_user_role(client, user_id)


async def _create_user_role(admin_client: Client, user_id: int):
    """
    AS ADMIN
    Creates a role for a user's nodes.

    Args:
        admin_client: MQTT client with controls publish access
        user_id: user

    Raises:
        CommandExcept: if command fails
    """
    args = CreateRoleArgs(
        rolename=f"user{user_id}",
        textname=f"User {user_id}'s nodes",
        textdescription=None,
        acls=None,
    )
    await _execute_command(admin_client, args)


async def _execute_command(admin_client: Client, args: MQTTArgs) -> SuccessfulResponse:
    """
    AS ADMIN
    Executes command in broker

    Args:
        admin_client: MQTT client with controls publish access
        args: Command to send to the control topic

    Return:
        Command output (only if successful)

    Raises:
        CommandExcept when command fails
    """
    await global_command_lock.acquire()
    await listener_ready.wait()
    message = MQTTCommands(commands=[args]).model_dump_json(exclude_none=True)
    await admin_client.publish(CONTROL_TOPIC, message)

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
    assert output is not None
    raw_command_output = MQTTCommandResponses.model_validate_json(output.decode())
    # We get exactly 1 response.
    response = raw_command_output.responses[0]

    if isinstance(response, SuccessfulResponse):
        return response
    else:
        raise CommandExcept(response)


async def _create_listener(admin_client: Client):
    """
    AS ADMIN
    Makes a new MQTT client for listening to reports.
    Assumes the role and the client don't already exist.

    Args:
        admin_client: MQTT client with controls publish access

    Raises:
        CommandExcept: if command fails
    """

    # First create the role
    acl = MQTTAcl(
        acltype=AclType.subscribe_pattern, topic="reports/#", priority=0, allow=True
    )
    args1 = CreateRoleArgs(
        rolename="listen-to-reports",
        textname="Listen to reports",
        textdescription="Role for coquitones-app to be able to read all reports",
        acls=[acl],
    )

    await _execute_command(admin_client, args1)

    # Then use the role to make the client
    role_description = MQTTRoleShort(rolename="listen-to-reports", priority=0)
    args2 = CreateClientArgs(
        username="reports-listener",
        password=LISTENER_PASSWORD,
        groups=[],
        roles=[role_description],
    )

    await _execute_command(admin_client, args2)


def command_handle() -> CommandHandle:
    """
    Returns a command handle for a command scheduled right now.
    """
    return CommandHandle(time=datetime.now(), id=randint(0, 1 << 31))
