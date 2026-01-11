from mutagen.mp3 import MP3  
from mutagen.easyid3 import EasyID3  
import mutagen.id3  
from mutagen.id3 import ID3, TIT2, TIT3, TALB, TPE1, TRCK, TYER  
  
import glob  

import numpy as np  

import os

files = glob.glob("../temp/*.mp3")

for path in files:
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

    print(f"Tagged: {artist} - {title}")

# mp3file = MP3(files[0], ID3=EasyID3)
# print(mp3file)

