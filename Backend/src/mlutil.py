import pickle
import numpy as np
import librosa
import concurrent.futures
import itertools
from fastapi import HTTPException

species_schema = (
    "E. coqui - 'co', E. coqui - qui",
    "E. coqui - co, E. coqui - qui, E. gryllus, E. locustus",
    "E. coqui - co, E. coqui - qui, E. gryllus, E. portoricensis - co, E. portoricensis - qui, E. unicolor",
    "E. coqui - co, E. coqui - qui, E. hedricki",
    "E. coqui - co, E. coqui - qui, E. hedricki, E. portoricensis - co, E. portoricensis - qui",
    "E. coqui - co, E. coqui - qui, E. hedricki, E. portoricensis - co, E. portoricensis - qui, E. unicolor",
    "E. coqui - co, E. coqui - qui, E. portoricensis - co, E. portoricensis - qui, E. richmondi",
    "E. coqui - co, E. coqui - qui, E. portoricensis - co, E. portoricensis - qui, E. unicolor",
    "E. coqui - co, E. coqui - qui, E. richmondi",
    "E. coqui - co, E. coqui - qui, E. richmondi, E. wightmanae",
    "E. coqui - co, E. coqui - qui, E. wightmanae",
)

SAMPLES_PER_SLICE = 22050 * 5  # 22050Hz sample rate * 5 seconds per slice

# TODO standardize and import this version in train_model notebook


def extract_features(file):
    """
    Extract features from audio file using librosa.

    Args:
        file: file object.

    Returns:
        np.array: Extracted features.
    """
    audio, sr = librosa.load(file)
    result = np.array([])

    # MFCC
    mfccs = np.mean(librosa.feature.mfcc(y=audio, sr=sr).T, axis=0)
    result = np.hstack((result, mfccs))

    # Chroma
    stft = np.abs(librosa.stft(audio))
    chroma = np.mean(librosa.feature.chroma_stft(S=stft, sr=sr).T, axis=0)
    result = np.hstack((result, chroma))

    # Mel-scaled spectrogram
    mel = np.mean(librosa.feature.melspectrogram(y=audio, sr=sr).T, axis=0)
    result = np.hstack((result, mel))

    return result


def extract_features_samples(audio, sr):
    """
    Extract features from audio samples.

    Args:
        audio: np.array containing audio samples.
        sr: sample rate

    Returns:
        np.array: Extracted features.
    """
    result = np.array([])

    # MFCC
    mfccs = np.mean(librosa.feature.mfcc(y=audio, sr=sr).T, axis=0)
    result = np.hstack((result, mfccs))

    # Chroma
    stft = np.abs(librosa.stft(audio))
    chroma = np.mean(librosa.feature.chroma_stft(S=stft, sr=sr).T, axis=0)
    result = np.hstack((result, chroma))

    # Mel-scaled spectrogram
    mel = np.mean(librosa.feature.melspectrogram(y=audio, sr=sr).T, axis=0)
    result = np.hstack((result, mel))

    return result


def initialize_predictor():
    with open("Backend/trainedRF.pkl", "rb") as f:
        return pickle.load(f)


def classify_slice(slice: np.array, model):
    global species_schema
    # hard coded sample rate because that's what the model is trained on
    spectrogram = extract_features_samples(slice, 22050)
    if spectrogram.shape[0] < 161:
        spectrogram = np.pad(spectrogram, (0, 161 - spectrogram.shape[0]), "edge")
    else:
        spectrogram = spectrogram[0:161]

    results = model.predict_proba(spectrogram.reshape(-1, 161))
    results = results.T
    return results


def classify_audio_file(f, model):
    all_samples, sr = librosa.load(f)
    assert (sr == 22050)
    n_slices = all_samples.shape[0] // SAMPLES_PER_SLICE
    slices = np.reshape(
        all_samples[0:SAMPLES_PER_SLICE * n_slices], (n_slices, SAMPLES_PER_SLICE))

    with concurrent.futures.ThreadPoolExecutor() as executor:
        prob_matrix = executor.map(
            classify_slice, slices, itertools.repeat(model))

    return {"data": list(map(list, prob_matrix)), "species_schema": species_schema}


# Injectable dependency


def get_model():
    predictor = initialize_predictor()
    if predictor is None:
        raise HTTPException(status_code=500, detail="ML model error")
    yield predictor
