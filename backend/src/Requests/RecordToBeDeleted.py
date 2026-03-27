from pydantic import BaseModel


class RecordTimestampIndex(BaseModel):
    """
    Encapsulation of Record which is captured by timestamp.
    Since we can delete audiom, weather data based on timestamp, all that is needed is the timestamp index id
    """

    timestamp_index_id: int
