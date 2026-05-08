import audio.repository as repository

from timestamp.repository import TimestampIndex
from node.repository import Node

from psycopg import AsyncConnection
from mlutil import classify_audio_file
from datetime import datetime
from asyncio import TaskGroup

from Logger import Logger

LOGGER = Logger.getInstance("Basic Audio Service")

async def classify_and_save(audio, audio_file_id, db, model):
    classifier_output = classify_audio_file(audio, model)
    slice_insert_tasks = []
    async with TaskGroup() as task_group:
        for classified_slice_name, classified_slice in classifier_output.items():
            classified_slice["starttime"] = classified_slice.pop("start_time")
            classified_slice["endtime"] = classified_slice.pop("end_time")
            slice_insert_tasks.append(
                task_group.create_task(
                    repository.AudioSlice.insert(db, audio_file_id, **classified_slice),  # type: ignore
                    name=classified_slice_name,
                )
            )

    results = map(lambda task: task.result(), slice_insert_tasks)
    return list(results)

async def insert_audio_and_timestamp(
        db: AsyncConnection,
        owner: int,
        file,
        nid: int,
        timestamp: datetime
):
    async with db.transaction(): 
        async with TaskGroup() as setup_group:
            # Check that nid is actually owned by the ownerid.
            node = setup_group.create_task(Node.get(owner, nid, db))
            tid = setup_group.create_task(TimestampIndex.insert(db, nid, timestamp))
            data = setup_group.create_task(file.read())

        if node.result() is None:
            LOGGER.error(f"Attempted to save audio file created by node {nid} but that node does not belong to user {owner} or does not exist.")
            raise ValueError # this rolls back the transaction.
    
    audio_file_id = await repository.AudioFile.insert(db, data.result(), nid, tid.result())
    return audio_file_id
    
