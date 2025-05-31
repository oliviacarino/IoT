import time
import firebase_admin
from firebase_admin import credentials, db
from PIL import Image
from io import BytesIO
import os
import logging
import base64
from waveshare_epd import epd7in5_V2 # if this gives you a ModuleNotFoundError... best of luck, notes will be added in time on how I figured this out. It sucked.

logging.basicConfig(level=logging.INFO)

# Firebase setup
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': '<your-realtime-db-url-here>'
})

if not os.path.exists("images"):
    os.mkdir("images")

def fetch_latest_image():
    ref = db.reference("images")
    images_dict = ref.get()

    if not images_dict:
        logging.info("No images found in Firebase.")
        return None

    # Find the image entry with the latest timestamp
    latest_image_entry = max(images_dict.values(), key=lambda x: x.get("timestamp", 0))
    base64_img_str = latest_image_entry.get("image")

    return base64_img_str

def fetch_and_display_image():
    base64_img_str = fetch_latest_image()
    if not base64_img_str:
        logging.info("No image data to display.")
        return

    # Remove data URL prefix if it exists
    if base64_img_str.startswith("data:image"):
        base64_img_str = base64_img_str.split(",")[1]

    try:
        image_bytes = base64.b64decode(base64_img_str)
        image = Image.open(BytesIO(image_bytes))

        local_path = "images/latest.png"
        image.save(local_path)
        logging.info(f"Saved decoded image to {local_path}")

        image = image.convert("1")  # Convert to 1-bit black/white
        image = image.resize((800, 480))

        epd = epd7in5_V2.EPD()
        epd.init()
        epd.Clear()
        epd.display(epd.getbuffer(image))
        epd.sleep()

        logging.info("Displayed image on e-paper.")
    except Exception as e:
        logging.error(f"Failed to decode/display image: {e}")

while True:
    try:
        fetch_and_display_image()
    except Exception as e:
        logging.error(f"Error in main loop: {e}")
    time.sleep(60)
