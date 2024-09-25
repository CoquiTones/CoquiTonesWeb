# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np

import io

import librosa
import soundfile as sf
import os


# Compute recipe outputs from inputs
# TODO: Replace this part by your actual code that computes the output, as a Pandas dataframe
# NB: DSS also supports other kinds of APIs for reading and writing data. Please see doc.

# Write recipe outputs

sliced_audio_df = pd.DataFrame(columns=["filename", "species"])


def split_audio(file_path, species, outputDir, segmentLengthInSeconds=5):

    # First load the file
    audio, sr = librosa.load(file_path)

    filename = file_path.split("/")[-1]
    # Get number of samples for segmentLengthInSeconds seconds;
    buffer = segmentLengthInSeconds * sr
    samples_total = len(audio)

    samples_wrote = 0
    counter = 1
    while samples_wrote < samples_total:

        # check if the buffer is not exceeding total samples
        if buffer > (samples_total - samples_wrote):
            buffer = samples_total - samples_wrote

        block = audio[samples_wrote: (samples_wrote + buffer)]

        if not os.path.exists(outputDir):
            os.makedirs(outputDir)

        out_filename = os.path.join(
            outputDir, filename + "split_" + str(counter) + "_" + "test.wav"
        )

        # Write n second segment
        sf.write(out_filename, block, sr)
        row = {"filename": out_filename, "species": species}

        counter += 1
        samples_wrote += buffer


def split_audio_buffer(file_path, segmentLengthInSeconds=5, keep_last_segment=True):
    audio, sr = librosa.load(file_path)
    samples_per_segment = sr * segmentLengthInSeconds
    n_segments = int(np.ceil(audio.shape[0] / samples_per_segment))
    desired_samples = samples_per_segment * n_segments
    if audio.shape[0] != desired_samples and keep_last_segment:
        samples_to_pad = desired_samples - audio.shape[0]
        audio = np.pad(audio, (0, samples_to_pad), 'wrap')
    elif not keep_last_segment:
        n_segments = int(np.floor(audio.shape[0] / samples_per_segment))
        desired_samples = samples_per_segment * n_segments
        audio = audio[:desired_samples]

    segments = audio.reshape((samples_per_segment, n_segments))
    output_buffers = [
        io.BytesIO() for _ in range(n_segments)
    ]
    for virtual_file, segment in zip(output_buffers, segments):
        sf.write(virtual_file, segment, sr)
    return output_buffers


def main():

    split_audio_buffer(
        "/home/edwin/Music/TENET_Official_Soundtrack___FREEPORT_-_Ludwig_Goransson___WaterTower-yywzQbZcDL0.mp3")

    # # Read recipe inputs
    # samples = dataiku.Dataset("samples")
    # samples_df = samples.get_dataframe()

    # sliced_audio = dataiku.Dataset("sliced_audio")
    # # Apply split_audio function to each row of samples_df
    # for index, row in samples_df.iterrows():
    #     file_path = row["filename"]
    #     species = row["species"]
    #     outputDir = "/home/alo/Downloads/datos/Sliced"

    #     row = split_audio(file_path, species, outputDir, sliced_audio_df)

    #     sliced_audio_df.loc[len(sliced_audio_df)] = row
    #     sliced_audio_df.append(row, igonre_index=True)
    # sliced_audio.write_with_schema(sliced_audio_df)


if __name__ == '__main__':
    main()
