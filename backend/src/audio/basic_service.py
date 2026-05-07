import audio.repository as repository

from timestamp.repository import TimestampIndex

from psycopg import AsyncConnection
from mlutil import classify_audio_file
from datetime import datetime
from asyncio import TaskGroup

async def classify_and_save(audio, audio_file_id, db, model):
    classifier_output = classify_audio_file(audio, model)
    slice_insert_tasks = []
    async with TaskGroup() as task_group:
        for slice_ in classifier_output.slices:
            slice_insert_tasks.append(
                task_group.create_task(
                    repository.AudioSlice.insert(
                        db, 
                        audio_file_id, 
                        slice_.start_time, 
                        slice_.end_time, 
                        slice_.coqui,
                        slice_.wightmanae,
                        slice_.gryllus,
                        slice_.portoricensis,
                        slice_.unicolor,
                        slice_.hedricki,
                        slice_.locustus,
                        slice_.richmondi,)
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
    async with TaskGroup() as setup_group:
        tid = setup_group.create_task(TimestampIndex.insert(db, nid, timestamp))
        data = setup_group.create_task(file.read())

    audio_file_id = await repository.AudioFile.insert(db, data.result(), nid, tid.result())
    return audio_file_id
    
