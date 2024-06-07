# -*- coding: utf-8 -*-

import sys
import pandas as pd
import numpy as np
import librosa
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score,
    confusion_matrix,
    precision_score,
    recall_score,
    ConfusionMatrixDisplay,
)

import numpy as np
import pandas as pd
from ast import literal_eval

from concurrent.futures import ThreadPoolExecutor, as_completed


def extract_features(file_path):
    """
    Extract features from audio file using librosa.

    Args:
        file_path (str): Path to the audio file.

    Returns:
        np.array: Extracted features.
    """
    audio, sr = librosa.load(file_path)
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


def process_data():
    """Read Csv with fileanme and generate spectrogram for each sample

    Returns:
        DataFrame: dataframe with all data
    """
    data_csv_path = sys.argv[1]

    df = pd.read_csv(data_csv_path)

    # Initialize a list to store the results
    spectrograms = []

    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(extract_features, row["filename"])
            for _, row in df.iterrows()
        ]

        for future in as_completed(futures):
            try:
                spectrogram = future.result()
                print("Processed Row")
                spectrograms.append(spectrogram)
            except Exception as exc:
                print(f"Generated an exception: {exc}")

    # Convert the list of spectrograms into a DataFrame
    spectrogram_df = pd.DataFrame(spectrograms)

    # Concatenate the original DataFrame with the new DataFrame containing spectrograms
    df = pd.concat([df, spectrogram_df], axis=1)

    return df


def createModel(df):

    x = df.drop(
        columns=["filename", "species"]
    )  # Adjust this to include only feature columns
    # Convert all column names to strings
    x.columns = x.columns.astype(str)
    y = df["species"]

    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2)

    classifier = RandomForestClassifier(
        n_estimators=600, max_depth=18, min_samples_leaf=3
    )

    classifier.fit(x_train, y_train)

    y_pred = classifier.predict(
        x_test,
    )

    accuracy = roc_auc_score(y_test, y_pred)
    print("Accuracy (ROC AUC):", accuracy)

    print(np.count_nonzero(y_test == y_pred))


def main():

    df = process_data()
    createModel(df)


if __name__ == "__main__":
    main()
