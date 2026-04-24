import audio.repository as repository

from timestamp.repository import TimestampIndex

from mlutil import get_model, classify_audio_file
from dbutil import DBTransactionDependency
from routers.security import LightWeightUser, get_current_user
from datetime import datetime
from typing import Annotated
from fastapi import Depends, Form, UploadFile, File, HTTPException, Response, APIRouter
from psycopg import AsyncConnection
from asyncio import TaskGroup
import io

router = APIRouter()

# --- SERVICES PER SE ---

async def classify_and_save(audio, audio_file_id, db, model):
    classifier_output = classify_audio_file(audio, model)
    slice_insert_tasks = []
    async with TaskGroup() as task_group:
        for classified_slice_name, classified_slice in classifier_output.items():
            classified_slice["starttime"] = classified_slice.pop("start_time")
            classified_slice["endtime"] = classified_slice.pop("end_time")
            slice_insert_tasks.append(
                task_group.create_task(
                    dao.AudioSlice.insert(db, audio_file_id, **classified_slice),  # type: ignore
                    name=classified_slice_name,
                )
            )

    results = map(lambda task: task.result(), slice_insert_tasks)
    return results

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
    

# Path operations

@router.get("/api/audio/all")
async def audio_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await repository.AudioFile.get_all(current_user.auid, transaction.connection)


@router.post(path="/api/audio", response_class=Response)
async def audio_get(
    afid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    audio_file: repository.AudioFile | None = await repository.AudioFile.get(
        current_user.auid, afid, transaction.connection
    )
    if audio_file is None:
        raise HTTPException(status_code=404, detail="Audio file not found")
    data = audio_file.data
    assert data is not None
    return Response(content=bytes(data), media_type="audio/mpeg")


@router.get("/api/audioslices/all")
async def audio_slice_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await repository.AudioSlice.get_all(current_user.auid, transaction.connection)


@router.get(path="/api/audioslices")
async def audio_slice_get(
    asid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await repository.AudioSlice.get(current_user.auid, asid, transaction.connection)


@router.post(path="/api/audio/insert")
async def audio_post(
    nid: Annotated[int, Form()],
    timestamp: Annotated[datetime, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
    file: UploadFile = File(...),
    classify: Annotated[bool, Form()] = True,
    model=Depends(get_model),
):
    audio_file_id = await insert_audio_and_timestamp(
        transaction.connection, current_user.auid, file, nid, timestamp
    )

    if classify:
        file.file.seek(0)
        await classify_and_save(file.file, audio_file_id, transaction.connection, model)

    return audio_file_id


@router.get(path="/api/classify/by-id")
async def classify_by_afid(
    afid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
    override: Annotated[bool, Form()] = False,
    model=Depends(get_model),
):

    if not await repository.AudioFile.exists(afid, current_user.auid, transaction.connection):
        raise HTTPException(status_code=404, detail="Audio file does not exist")

    if override or not await repository.AudioFile.is_classified(afid, transaction.connection):
        audio = await repository.AudioFile.get(current_user.auid, afid, transaction.connection)
        if audio is None or audio.data is None:
            raise HTTPException(status_code=404, detail="Audio file does not exist")

        await classify_and_save(
            io.BytesIO(audio.data), afid, transaction.connection, model
        )

    return await repository.AudioSlice.get_classified(afid, transaction.connection)


@router.post(path="/api/classifier/classify")
async def classify(file: UploadFile = File(...), model=Depends(get_model)):
    report = classify_audio_file(file.file, model)
    return report

