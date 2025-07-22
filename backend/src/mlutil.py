import pickle
import numpy as np
import librosa
import concurrent.futures
import itertools
from fastapi import HTTPException

species_schema = ('E. coqui - co',
    'E. coqui - qui',
    'E. wightmanae',
    'E. gryllus',
    'E. portoricensis - co',
    'E. portoricensis - qui',
    'E. unicolor',
    'E. hedricki',
    'E. locustus',
    'E. richmondi'
)
SLICE_SECONDS = 10 # Length of input slices for model.
FFT_HOP_LENGTH = 512 # How many time domain samples per spectrogram frame
SAMPLE_RATE = 22050
Y_RESOLUTION = 20
slice_width = SAMPLE_RATE // FFT_HOP_LENGTH * SLICE_SECONDS
n_model_input_parameters = SAMPLE_RATE // FFT_HOP_LENGTH * SLICE_SECONDS * Y_RESOLUTION

# TODO standardize and import this version in train_model notebook


def extract_features(file_path, resample_to=SAMPLE_RATE):
    """
    Extract spectrogram from audio file using librosa. Resamples to a standardized sample rate.

    Args:
        file_path (str): Path to the audio file.
        resample_to (int): Sample rate to resample to. Defaults to SAMPLE_RATE

    Returns:
        np.array: Extracted features.
    """
    audio, sr = librosa.load(file_path)

    # MFCC
    spectrogram = librosa.feature.mfcc(y=audio, sr=sr, hop_length = FFT_HOP_LENGTH)
    return librosa.resample(y=spectrogram, orig_sr=sr, target_sr=resample_to)


def initialize_predictor():
    with open("backend/trainedRF.pkl", 'rb') as f:
        return pickle.load(f)

def classify_slice(spectrogram, model):
    return model.predict(spectrogram.reshape(1, -1))

def classify_audio_file(f, model):
    all_samples = extract_features(f)
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
            "start_time": start_time,
            "end_time": start_time + SLICE_SECONDS
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