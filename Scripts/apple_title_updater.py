from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3, APIC, ID3NoHeaderError

import os
import requests
import time
from tqdm import tqdm

ROOT = "/xyz"  # location of the MP3's we want to fix, change appropriately

IGNORE_DIRS = {
    "Ignore these directories..", # optional
}

def get_with_retry(url, params=None, timeout=10, retries=3, wait_seconds=60):
    """
    GET request with retry + cooldown on rate limit or network errors.
    """
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, params=params, timeout=timeout)

            # Handle iTunes API (free) rate limiting
            if resp.status_code == 429:
                raise requests.RequestException("Rate limited (429)")

            resp.raise_for_status()
            return resp

        except requests.RequestException as e:
            if attempt < retries:
                tqdm.write(
                    f"Network / rate-limit error ({e}). "
                    f"Waiting {wait_seconds}s before retry {attempt}/{retries}..."
                )
                time.sleep(wait_seconds)
            else:
                raise

# Collect mp3 files grouped by folder
# I had mutliple playlists saved as directories
folders = {}

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

    # TODO remove this & update logic within folder crawl 
    # a bit redundant if we ignore directories that include non-MP3 files
    # can definitely clean this up more
    mp3s = [
        os.path.join(root, f)
        for f in files
        if f.lower().endswith(".mp3")
    ]

    if mp3s:
        folders[root] = mp3s

print(f"\nFound {len(folders)} folders containing MP3 files.")

# Update/add artist, title, and album cover for each song
# TODO optimize this b/c we're doing O(n^2) for what could eventually be LARGE data batches
# Concurrency would be neat but my 2017 mac struggles
for folder, mp3_files in folders.items():
    print(f"\nProcessing folder: {folder}")

    for path in tqdm(mp3_files, desc="Tagging MP3s", unit="file"):
        filename = os.path.basename(path)

        # download_from_csv.py formats MP3 files as: "Title - Artist.mp3"
        artist, title = filename[:-4].split(" - ", 1)

        # load or create ID3 tags
        try:
            mp3file = MP3(path, ID3=EasyID3)
        except ID3NoHeaderError:
            mp3file = MP3(path)
            mp3file.add_tags()
            mp3file = MP3(path, ID3=EasyID3)

        mp3file["artist"] = artist
        mp3file["title"] = title
        mp3file.save() # overwrites existing file

        # fetch album art via iTunes API
        query = f"{artist} {title}"
        try:
            resp = get_with_retry(
                "https://itunes.apple.com/search",
                params={"term": query, "media": "music", "limit": 1},
                timeout=10,
                retries=3,
                wait_seconds=60,
            )
            time.sleep(1.5)

        except requests.RequestException:
            tqdm.write(f"Giving up fetching art: {artist} - {title}")
            continue

        results = resp.json().get("results")
        if not results:
            tqdm.write(f"No art found: {artist} - {title}")
            continue

        art_url = results[0]["artworkUrl100"].replace("100x100", "600x600")

        # download artwork
        try:
            image_resp = get_with_retry(
                art_url,
                timeout=10,
                retries=3,
                wait_seconds=60,
            )
            image_bytes = image_resp.content
            time.sleep(1.5)
        except requests.RequestException:
            tqdm.write(f"Giving up downloading artwork: {artist} - {title}")
            continue

        # embed album art
        tags = ID3(path)
        tags.delall("APIC")  # remove existing tags

        tags.add(
            APIC(
                encoding=3,        # UTF-8
                mime="image/jpeg",
                type=3,            # front cover
                desc="Cover",
                data=image_bytes,
            )
        )
        tags.save(path)

    # pause before next folder, prompt user to continue
    input(
        f"\nFinished folder '{os.path.basename(folder)}'. "
        "Press ENTER to continue to the next folder..."
    )

print("\nFinished!")
