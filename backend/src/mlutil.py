import pickle
import numpy as np
import librosa
import concurrent.futures
import itertools
import soundfile as sf
from datetime import timedelta
from fastapi import HTTPException

species_schema = (
    'coqui',
    'wightmanae',
    'gryllus',
    'portoricensis',
    'unicolor',
    'hedricki',
    'locustus',
    'richmondi',
)
SLICE_SECONDS = 10 # Length of input slices for model.
FFT_HOP_LENGTH = 512 # How many time domain samples per spectrogram frame
SAMPLE_RATE = 22050
Y_RESOLUTION = 20
slice_width = SAMPLE_RATE // FFT_HOP_LENGTH * SLICE_SECONDS
n_model_input_parameters = SAMPLE_RATE // FFT_HOP_LENGTH * SLICE_SECONDS * Y_RESOLUTION

# TODO standardize and import this version in train_model notebook


def extract_features(audio_data, sr, resample_to=SAMPLE_RATE):
    """
    Extract spectrogram from audio file using librosa. Resamples to a standardized sample rate.

    Args:
        audio_data: Path to the audio file.
        sr (int): audio_data's sample rate
        resample_to (int): Sample rate to resample to. Defaults to SAMPLE_RATE

    Returns:
        np.array: Extracted features.
    """
    if sr != resample_to:
        audio_data = librosa.resample(y=audio_data, orig_sr=sr, target_sr=resample_to)
    # MFCC
    return librosa.feature.mfcc(y=audio_data, sr=SAMPLE_RATE, hop_length=FFT_HOP_LENGTH)



def initialize_predictor():
    with open("backend/trainedRF.pkl", 'rb') as f:
        return pickle.load(f)

def classify_slice(spectrogram, model):
    return model.predict(spectrogram.reshape(1, -1))

def classify_audio_file(f, model):
    audio_data, sr = sf.read(f)
    all_samples = extract_features(audio_data, sr)
    n_slices = all_samples.shape[1] // slice_width
    slices = np.reshape(
        all_samples[:, 0: slice_width * n_slices], (n_slices, 20, slice_width))

    with concurrent.futures.ThreadPoolExecutor() as executor:
        prob_matrix = executor.map(
            classify_slice, slices, itertools.repeat(model))

    return {
        f"slice{i}": {
            species_name: bool(prediction) for species_name, prediction in zip(species_schema, slice_classification[0])
        } | {
            "start_time": timedelta(seconds=start_time),
            "end_time": timedelta(seconds=start_time + SLICE_SECONDS)
        }
        for i, (slice_classification, start_time) in enumerate(zip(prob_matrix, itertools.count(0, SLICE_SECONDS)))
    }


# Injectable dependency


def get_model():
    predictor = initialize_predictor()
    if predictor is None:
        raise HTTPException(
            status_code=500, detail="ML model error")
    yield predictor