import json
import os
import sys
import csv
import pandas as pd


def import_suffix_map(path: str) -> dict[str, str]:
    with open(path, "r") as f:
        return json.load(f)


def readAveragesData(path: str):

    data = []
    # Read the CSV file and store the data in a list of dictionaries
    with open(path, "r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            data.append(row)

    return data


def filterById(averagesData):
    pass


# def main() -> None:
#     target_folder = os.path.abspath(sys.argv[1])
#     suffix_map = import_suffix_map(os.path.join(target_folder, "suffixmap.json"))
#     species_map = {v: k for k, v in suffix_map.items()}

#     files = []

#     for filename in os.listdir(target_folder):
#         name, ext = os.path.splitext(filename)
#         if ext.lower() == ".wav":
#             suffix = name[-3:]
#             species = species_map[suffix]
#             files.append(
#                 {"filename": os.path.join(target_folder, filename), "species": species}
#             )

#     with open(
#         os.path.join(target_folder, "samples.csv"), "w", newline=""
#     ) as output_file:
#         keys = files[0].keys()
#         dict_writer = csv.DictWriter(output_file, keys)
#         dict_writer.writeheader()
#         dict_writer.writerows(files)


def main() -> None:

    data_dir = sys.argv[1]
    averagesData = readAveragesData(
        os.path.join(data_dir, "FrequencyRange_by_species_and_site_Averages.csv")
    )

    data = []

    # Iterate through each subfolder
    for siteDataSet in os.listdir(data_dir):
        site_folder = os.path.join(data_dir, siteDataSet)
        if os.path.isdir(site_folder):
            # example siteId  "Site01-1" such that the 4-6 index represents the site id; in this case 01
            siteId = int(siteDataSet[4:6])
            SiteData = [
                averageClassification
                for averageClassification in averagesData
                if int(averageClassification["SiteID"]) == siteId
            ]

            classifications = ", ".join(
                [classification["Species"] for classification in SiteData]
            )
            for audio_recording in os.listdir(site_folder):
                if audio_recording.endswith(".wav"):
                    audio_recording_abs_path = os.path.abspath(
                        os.path.join(site_folder, audio_recording)
                    )

                    data.append([siteId, audio_recording_abs_path, classifications])

    # Create DataFrame
    df = pd.DataFrame(
        data,
        columns=[
            "siteId",
            "filename",
            "species",
        ],
    )

    df.to_csv("./ML/RAW.csv", index=False)


if __name__ == "__main__":
    main()
