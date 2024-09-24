---
title: "Enhancing My Daughter's Mupibox Media Server with Cover Art"
path: "enhancing_mupibox_with_cover_art"
template: "enhancing_mupibox_with_cover_art.html"
date: 2024-09-24T01:53:34+08:00
lastmod: 2024-09-24T01:53:34+08:00
tags: ["python", "MuPiBox", "mp3", "media"]
categories: ["code", "mp3"]
description: "Discover how I enhanced my daughter's Mupibox media server experience by adding cover art to her favorite audiobooks and music."
keywords: ["Mupibox", "cover art", "Python script", "media server", "audiobooks", "mp3", "album cover"]
---

# Enhancing My Daughter's MuPiBox Media Server with Cover Art

My daughter loves her MuPiBox media server, which is packed with her favorite audiobooks and music. Recently, I decided to enhance her experience by adding cover art to each album. It’s a small touch, but seeing the album covers makes her browsing more enjoyable and visually appealing. Here’s how I added cover.jpg files to her MuPiBox media server.

## Tools and Libraries Used

To achieve this, I used Python along with some handy libraries:

- **os** for interacting with the operating system.
- **glob** for pattern matching of file names.
- **mutagen** for handling audio metadata, including cover art extraction.

I wrote a Python script to automate the extraction and saving of cover art from the MP3 files present in the Mupibox library.

## Step-by-Step Process

### Step 1: Setting Up the Script

Firstly, I installed the necessary libraries using pip:

```sh
pip install mutagen
```

Then, I created a Python script named `add_cover_art.py`:

```python
import os
import glob
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, APIC

def extract_and_save_cover_art(mp3_file, output_file):
    audio = MP3(mp3_file, ID3=ID3)
    
    # Check if the MP3 file contains an image
    for tag in audio.tags.values():
        if isinstance(tag, APIC):
            with open(output_file, 'wb') as img:
                img.write(tag.data)
            print(f'Cover artwork successfully saved to {output_file}.')
            return
    
    print('No cover artwork found in the MP3 file.')

def delete_existing_images(album_dir):
    image_files = glob.glob(os.path.join(album_dir, "*.[jJpP][pPnNgG]*"))  # Common image file extensions (jpg, png, etc.)
    for image_file in image_files:
        os.remove(image_file)
        print(f'{image_file} has been deleted.')

def process_artist_directory(artist_dir):
    for album_dir in os.listdir(artist_dir):
        full_album_path = os.path.join(artist_dir, album_dir)
        
        if os.path.isdir(full_album_path):
            cover_file = os.path.join(full_album_path, "cover.jpg")
            
            # Skip if cover.jpg already exists
            if os.path.exists(cover_file):
                print(f'Skipping {full_album_path}, cover.jpg already exists.')
                continue
            
            mp3_files = sorted(glob.glob(os.path.join(full_album_path, "*.mp3")))
            
            if mp3_files:
                first_mp3_file = mp3_files[0]
                
                # Delete other existing images
                delete_existing_images(full_album_path)
                
                # Extract and save cover art
                extract_and_save_cover_art(first_mp3_file, cover_file)

def process_music_library(base_dir):
    for artist_dir in os.listdir(base_dir):
        if not "Pippi" in artist_dir:
            continue
        full_artist_path = os.path.join(base_dir, artist_dir)
        
        if os.path.isdir(full_artist_path):
            process_artist_directory(full_artist_path)

# Example call
music_library_path = '/Volumes/media/music/Hörbücher'  # Base directory
process_music_library(music_library_path)
```

### Step 2: Running the Script

Once the script was ready, I ran it, pointing it to the base directory of the MuPiBox media library. The script searched through the directories, identified MP3 files, and extracted their cover art to save as cover.jpg in their respective folders.

### Step 3: Verifying the Results

After the script completed, I browsed through the MuPiBox media server. It was gratifying to see the new cover.jpg files next to each album, providing a more immersive and visually appealing browsing experience for my daughter.

## Conclusion

Adding cover art to the MuPiBox media server was a straightforward yet impactful enhancement. The Python script made the process efficient and automated, saving me a significant amount of time. If you manage a media server and want to add a bit of polish to the user experience, I highly recommend giving this method a try.

Happy listening!
