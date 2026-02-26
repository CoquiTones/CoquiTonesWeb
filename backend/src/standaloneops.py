import asyncio
import dao
from mlutil import classify_audio_file

async def classify_and_save(audio, audio_file_id, db, model):
    classifier_output = classify_audio_file(audio, model)
    slice_insert_tasks = []
    for classified_slice_name, classified_slice in classifier_output.items():
        classified_slice["starttime"] = classified_slice.pop("start_time")
        classified_slice["endtime"] = classified_slice.pop("end_time")
        slice_insert_tasks.append(
            asyncio.create_task(
                dao.AudioSlice.insert(db, audio_file_id, **classified_slice), #type:ignore
                name=classified_slice_name,
            )
        )

    done, _ = await asyncio.wait(slice_insert_tasks)
    results = map(lambda task: task.result(), done)
    db.commit()
    return results