# Scripts

       ____________________
      |\                   \      l____
      | \___________________\     |\   \
      | |                    |    |\l___\___
 [__]_[ |      Scripts       |[\\]| |__|_\__\
/\[__]\ |                    |\[\\]\|. | |===\
\ \[__]\[____________________] \[__]|__|..___]
 \/.-.\_______________________\/.-.\____\/.-.\
  ( @ )                        ( @ )  =  ( @ )
   `-'                          `-'       `-'


## Update MP3 Files with Correct Title/Artist in Apple Music
- [I followed the general plan from this article:](https://methodmatters.github.io/editing-id3-tags-mp3-meta-data-in-python/)
- [More on ID3 Tags here:](https://dougscripts.com/itunes/itinfo/id3tags00.php)
- [The Python ~mutagen~ library](https://mutagen.readthedocs.io/en/latest/api/index.html)

### Step 1 - Gather Playlist CSV files
Go to [https://exportify.net/](Exportify) to export and download your Spotify playlists as CSV files.
*Btw, this will prompt you to login with your Spotify account and it's technically a third-party app. Use that
info and make your best judgement!*

### Step 2 - Download Media
I wrote a Python script that uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) to parse the CSV files and then download them. I haven't included that script here because I don't want Github assuming the worse here. I'm sure you can figure out how to include your CSV files and legal media. 🤡


### Step 3  - Embed ID3 Tags with Metadata
Run `/Scripts/apple_title_updater.py` to format MP3 files in such a way that Itunes recognizes. This script embeds the appropriate ID3 tags into each MP3 file of a given directory. Itunes/Apple Music relies on these tags as metadata to be correctly imported into Itunes/Apple Music, e.g., correctly displays the title, artist, ablum cover art, etc. within Itunes/Apple Music. The values used for each field are pulled from the Itunes API. 

### Notes
I ran into some rate limiting issues and Apple has 0 documentation on how many requests you're limited to. **This script takes some time to run (~17 minutes for ~400 songs/MP3 files).** I navigated this by added `sleep()` timers and waiting periods (`wait_seconds(60)`).