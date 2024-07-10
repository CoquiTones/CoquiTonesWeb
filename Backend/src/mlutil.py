import pickle
from fastapi import HTTPException


def initialize_predictor():
    with open("Backend/trainedRF.pkl", 'rb') as f:
        return pickle.load(f)

# Injectable dependency


def get_model():
    predictor = initialize_predictor()
    if predictor is None:
        raise HTTPException(
            status_code=500, detail="ML model error")
    yield predictor
