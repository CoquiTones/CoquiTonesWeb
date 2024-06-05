import os
import zipfile
import sys
from concurrent.futures import ThreadPoolExecutor


"""
Script for extracting data from https://figshare.com/articles/dataset/Sounds_of_the_Eleutherodactylus_frog_community_from_Puerto_Rico/806302?file=3104183
Unzips all the zips from root
Simply Unzip downloaded file and provide path root of folder
"""


def extract_zip_file(file_path, extract_to):
    """
    Extracts a single zip file to a specified directory.

    Args:
        file_path (str): Path to the zip file.
        extract_to (str): Path to the directory where the zip file will be extracted.
    """
    with zipfile.ZipFile(file_path, "r") as zip_ref:
        zip_ref.extractall(extract_to)
        print(f"{os.path.basename(file_path)} extracted to {extract_to}")


def extract_zip_files(zip_folder, extract_to):
    """
    Extracts all zip files from a folder to a specified directory using threading.

    Args:
        zip_folder (str): Path to the folder containing zip files.
        extract_to (str): Path to the directory where zip files will be extracted.
    """
    # Make sure the extraction directory exists
    os.makedirs(extract_to, exist_ok=True)

    # List all zip files in the folder
    zip_files = [
        os.path.join(zip_folder, item)
        for item in os.listdir(zip_folder)
        if item.endswith(".zip")
    ]

    # Use ThreadPoolExecutor to extract zip files concurrently
    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(extract_zip_file, zip_file, extract_to)
            for zip_file in zip_files
        ]

        # Wait for all futures to complete
        for future in futures:
            future.result()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python extractSet.py <zip_folder>")
    else:
        zip_folder = sys.argv[1]
        extract_zip_files(zip_folder, os.path.join(zip_folder, "Extracted"))
