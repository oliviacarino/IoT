from mutagen.mp3 import MP3  
from mutagen.easyid3 import EasyID3  
import mutagen.id3  
from mutagen.id3 import ID3, TIT2, TIT3, TALB, TPE1, TRCK, TYER, APIC, ID3NoHeaderError
  
import glob  
import os
import requests
from tqdm import tqdm 

files = glob.glob("../temp/*.mp3") # update with directory 

for path in tqdm(files, desc="Tagging MP3s", unit="file"):
    filename = os.path.basename(path)

    # extract each artist and  title name
    artist, title = filename[:-4].split(" - ", 1)

    # load or create ID3 tags
    try:
        mp3file = MP3(path, ID3=EasyID3)
    except ID3NoHeaderError:
        mp3file = MP3(path)
        mp3file.add_tags()
        mp3file = MP3(path, ID3=EasyID3)

    # assign tags
    mp3file["artist"] = artist
    mp3file["title"] = title

    # save changes
    mp3file.save()

    # fetch album art
    query = f"{artist} {title}"
    resp = requests.get(
        "https://itunes.apple.com/search",
        params={"term": query, "media": "music", "limit": 1},
        timeout=10,
    )

    results = resp.json().get("results")
    if not results:
        tqdm.write(f"No art found: {artist} - {title}")
        continue

    # Use higher-res image
    art_url = results[0]["artworkUrl100"].replace("100x100", "600x600")
    image_bytes = requests.get(art_url, timeout=10).content

    # ---- embed art ----
    tags = ID3(path)

    # Remove existing art if present
    tags.delall("APIC")

    tags.add(
        APIC(
            encoding=3,
            mime="image/jpeg",
            type=3,
            desc="Cover",
            data=image_bytes,
        )
    )

    tags.save(path)