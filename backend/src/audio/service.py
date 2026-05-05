import audio.repository as repository
from audio.basic_service import insert_audio_and_timestamp, classify_and_save

from timestamp.repository import TimestampIndex

from mlutil import get_model, classify_audio_file
from dbutil import DBTransactionDependency
from user.service import LightWeightUser, get_current_user
from datetime import datetime
from typing import Annotated, List
from fastapi import Depends, Form, UploadFile, File, HTTPException, Response, APIRouter
import io

router = APIRouter(tags=["Audio"])

file_router = APIRouter(prefix="/audio", tags=["File"])
audio_slices_router = APIRouter(prefix="/audioslices", tags=["Audio Slices"])
classify_router = APIRouter(tags=["Classification"])

@file_router.get("/all")
async def audio_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await repository.AudioFile.get_all(current_user.auid, transaction.connection)


@file_router.post(path="/", response_class=Response)
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

@file_router.post(path="/insert")
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

    audio_slice_ids = []
    if classify:
        file.file.seek(0)
        audio_slice_ids = await classify_and_save(file.file, audio_file_id, transaction.connection, model)

    return {"afid": audio_file_id, "audio_slice_ids": audio_slice_ids}

router.include_router(file_router)

@audio_slices_router.get(path="/all")
async def audio_slice_all(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
) -> List[repository.AudioSlice]:
    return await repository.AudioSlice.get_all(current_user.auid, transaction.connection)


@audio_slices_router.get(path="/")
async def audio_slice_get(
    asid: Annotated[int, Form()],
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
    transaction: DBTransactionDependency,
):
    return await repository.AudioSlice.get(current_user.auid, asid, transaction.connection)

router.include_router(audio_slices_router)

@classify_router.get(path="/classify/by-id")
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


@classify_router.post(path="/classifier/classify")
async def classify(file: UploadFile = File(...), model=Depends(get_model)):
    report = classify_audio_file(file.file, model)
    return report

router.include_router(classify_router)