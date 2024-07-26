import pickle
import numpy as np
import librosa
from fastapi import HTTPException

species_schema = ('Coqui', 'Antillensis', 'Cochranae', 'Monensis', 'Gryllus',
                  'Hedricki', 'Locustus', 'Portoricensis', 'Richmondi', 'Wightmanae')

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


def initialize_predictor():
    with open("Backend/trainedRF.pkl", 'rb') as f:
        return pickle.load(f)


def classify_audio_file(f, model):
    spectrogram = extract_features(f)
    if spectrogram.shape[0] < 161:
        spectrogram = np.pad(
            spectrogram, (0, 161 - spectrogram.shape[0]), 'edge')
    else:
        spectrogram = spectrogram[0:161]

    results = model.predict_proba(spectrogram.reshape(-1, 161))
    return {name: prob for name, prob in zip(species_schema, results)}


# Injectable dependency


def get_model():
    predictor = initialize_predictor()
    if predictor is None:
        raise HTTPException(
            status_code=500, detail="ML model error")
    yield predictor
