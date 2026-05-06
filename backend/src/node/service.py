import node.repository as repository

import mqtt
from dbutil import DBTransactionDependency
from user.service import LightWeightUser, get_current_user
import asyncio
from typing import Annotated, List
from pydantic import SecretStr
from fastapi import Depends, Form, APIRouter, HTTPException, status

from Logger import Logger

router = APIRouter(prefix="/node", tags=["Node"])

LOGGER = Logger.getInstance("Node services")

@router.get("/all")
async def node_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> List[repository.Node]:
    return await repository.Node.get_all(current_user.auid, transaction.connection)


@router.get("/")
async def node_get(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    nid: Annotated[int, Form()],
    transaction: DBTransactionDependency,
) -> repository.Node | None:
    return await repository.Node.get(current_user.auid, nid, transaction.connection)


@router.post("/mqtt")
async def create_node_client(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    nid: Annotated[int, Form()],
    password: Annotated[SecretStr, Form()],
    transaction: DBTransactionDependency,
):
    """Creates an MQTT client for a node that doesn't have one."""
    node = await repository.Node.get(current_user.auid, nid, transaction.connection)
    if node is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Node doesn't exist")
    try:
        await mqtt.create_node(current_user.auid, node.nname, password)
        return {"nodeCreationStatus": True}
    except mqtt.CommandExcept:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to create client"
        )


@router.get("/noclient")
async def nodes_with_no_client(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> List[repository.Node]:
    """
    Lists which of the user's primary nodes are missing a client.
    """
    async with asyncio.TaskGroup() as tg:
        all_mqtt_clients = tg.create_task(mqtt.all_clients())
        user_nodes = tg.create_task(
            repository.Node.get_all(current_user.auid, transaction.connection)
        )
    primary_nodes: list[repository.Node] = list(
        filter(lambda node: node.ntype == "primary", user_nodes.result())
    )
    client_names = all_mqtt_clients.result().keys()
    missing_nodes = filter(lambda node: node.nname not in client_names, primary_nodes)
    return list(missing_nodes)

@router.post(path="/insert")
async def node_insert(
    ntype: Annotated[str, Form()],
    nname: Annotated[str, Form()],
    nlatitude: Annotated[float, Form()],
    nlongitude: Annotated[float, Form()],
    ndescription: Annotated[str, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
    node_client_password: Annotated[SecretStr | None, Form()] = None,
) -> repository.Node:
    # Primary node must have a client with the broker
    # We'll do this as a task so it can be concurrent with creating the entry in the database.
    # If an exception is raised it will return False, otherwise it will cause everything to break.
    async def mqtt_client_creation() -> bool:
        assert node_client_password is not None
        try:
            await mqtt.create_node(current_user.auid, nname, node_client_password)
            return True
        except mqtt.CommandExcept as e:
            LOGGER.error(
                f"ERROR: Failed to create client: \n\t{e.detail.error}\n\tCommand: {e.detail.command}"
            )
            return False

    async def database_operation() -> repository.Node | None:
        ownerid = current_user.auid
        try:
            new_node = await repository.Node.insert(
                transaction.connection,
                ownerid,
                nname,
                ntype,
                nlatitude,
                nlongitude,
                ndescription,
            )
        except HTTPException:
            return None
        return new_node

    async def mqtt_topic_access(new_node: repository.Node) -> bool:
        # All the user's primary nodes must have access to a topic corresponding to the new node
        # This allows them to upload reports from the new node into the appropriate topic
        try:
            await mqtt.add_topic_access(current_user.auid, new_node.nid)
        except mqtt.CommandExcept as e:
            LOGGER.error(
                f"ERROR: Failed to add topic access: \n\t{e.detail.error}\n\tCommand: {e.detail.command}"
            )
            return False

        return True

    async with asyncio.TaskGroup() as group:
        client_task = None
        client_error = None
        if ntype == "primary":
            if node_client_password is None:
                client_error = HTTPException(
                    status_code=400,
                    detail="Must provide password for new primary nodes",
                )
            else:
                client_task = group.create_task(mqtt_client_creation())

        node_task = group.create_task(database_operation())
        await node_task
        new_node = node_task.result()
        if new_node is None:
            topic_task = None
        else:
            topic_task = group.create_task(mqtt_topic_access(new_node))

    if client_error is not None:
        raise client_error
    if client_task is None or not client_task.result():
        raise HTTPException(
            status_code=500,
            detail="Failed to create MQTT client for primary node.",
        )
    if topic_task is None or not topic_task.result():
        raise HTTPException(
            status_code=500,
            detail="Failed to give access to the node's MQTT topic.",
        )
    final_node = node_task.result()
    if final_node is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to create node.",
        )
    else:
        return final_node


@router.delete(path="/delete")
async def node_delete(
    nid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> int | None:
    return await repository.Node.delete(current_user.auid, nid, transaction.connection)
