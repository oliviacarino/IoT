import time
import firebase_admin
from firebase_admin import credentials, db
from PIL import Image
from io import BytesIO
import os
import logging
import base64
from waveshare_epd import epd7in5_V2

# --------------------------
# Logging Setup
# --------------------------
logging.basicConfig(
    filename='/home/olivia/e-Paper/RaspberryPi_JetsonNano/python/examples/epaper_log.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# --------------------------
# Firebase Setup
# --------------------------
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://immg-eb767-default-rtdb.firebaseio.com/'
})

# --------------------------
# Ensure image save directory
# --------------------------
if not os.path.exists("images"):
    os.mkdir("images")

last_timestamp = 0

def fetch_latest_entry():
    ref = db.reference("images")
    images_dict = ref.get()

    if not images_dict:
        logging.info("No entries found in Firebase.")
        return None

    return max(images_dict.values(), key=lambda x: x.get("timestamp", 0))

def fetch_and_display_image():
    global last_timestamp
    entry = fetch_latest_entry()
    if not entry:
        return

    timestamp = entry.get("timestamp", 0)

    if timestamp <= last_timestamp:
        return

    last_timestamp = timestamp

    if entry.get("clear", False):
        try:
            epd = epd7in5_V2.EPD()
            epd.init()
            epd.Clear()
            epd.sleep()
            logging.info("E-paper display cleared.")
        except Exception as e:
            logging.error(f"Failed to clear display: {e}")
        return

    base64_img_str = entry.get("image")
    if not base64_img_str:
        logging.warning("Image entry missing 'image' field.")
        return

    if base64_img_str.startswith("data:image"):
        base64_img_str = base64_img_str.split(",")[1]

    try:
        image_bytes = base64.b64decode(base64_img_str)
        image = Image.open(BytesIO(image_bytes))

        local_path = "images/latest.png"
        image.save(local_path)
        logging.info(f"Saved decoded image to {local_path}")

        image = image.convert("1")
        image = image.resize((800, 480))

        epd = epd7in5_V2.EPD()
        epd.init()
        epd.Clear()
        epd.display(epd.getbuffer(image))
        epd.sleep()

        logging.info("Displayed image on e-paper.")
    except Exception as e:
        logging.error(f"Failed to decode/display image: {e}")

if __name__ == "__main__":
    try:
        logging.info("Starting E-paper listener...")
        while True:
            fetch_and_display_image()
            time.sleep(1)
    except Exception as e:
        logging.critical(f"Fatal error in main loop: {e}")