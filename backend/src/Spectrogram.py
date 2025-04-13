import json
import librosa
import numpy as np


def sendMelSpectrogram(file):
    """
    Sends axis for Mel Spectrogram

    Args:
        file : audio file


    """
    # this is the number of samples in a window per fft
    n_fft = 2048
    # The amount of samples we are shifting after each fft
    hop_length = 512

    signal, sampleRate = librosa.load(file)
    mel_signal = librosa.feature.melspectrogram(
        y=signal, sr=sampleRate, hop_length=hop_length, n_fft=n_fft, n_mels=90
    )

    # spectrogram = np.abs(mel_signal)
    power_to_db = librosa.power_to_db(
        mel_signal,
    )

    mel = power_to_db.tolist()
    x_coords = None
    y_coords = None
    x_coords = librosa.display.__mesh_coords(
        "time", x_coords, power_to_db.shape[1]
    ).tolist()
    y_coords = librosa.display.__mesh_coords(
        "mel", y_coords, power_to_db.shape[0]
    ).tolist()

    output = {"x": x_coords, "y": y_coords, "z": mel}
    return json.dumps(output)


def sendBasicSpectrogram(file):
    """
    Sends axis for Basic Spectrogram

    Args:
        file : audio file
    """

    # this is the number of samples in a window per fft
    n_fft = 2048
    # The amount of samples we are shifting after each fft
    hop_length = 512
    signal, sampleRate = librosa.load(file)

    ft = np.abs(librosa.stft(signal, n_fft=n_fft, hop_length=hop_length))
    ft_dB = librosa.amplitude_to_db(ft)
    x_coords = None
    y_coords = None
    x_coords = librosa.display.__mesh_coords("time", x_coords, ft_dB.shape[1]).tolist()
    y_coords = librosa.display.__mesh_coords("log", y_coords, ft_dB.shape[0]).tolist()

    ft_dB = ft_dB.tolist()
    output = {"x": x_coords, "y": y_coords, "z": ft_dB}
    return json.dumps(output)
