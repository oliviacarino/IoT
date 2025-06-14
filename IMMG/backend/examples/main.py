from firebase_admin import db

last_handled_timestamp = 0

def on_firebase_change(event):
    global last_handled_timestamp
    logging.info("Firebase data changed!")

    ref = db.reference("images")
    images_dict = ref.get()
    if not images_dict:
        logging.info("No entries found in Firebase.")
        return

    latest_entry = max(images_dict.values(), key=lambda x: x.get("timestamp", 0))
    timestamp = latest_entry.get("timestamp", 0)

    # Only handle if this is a new entry
    if timestamp <= last_handled_timestamp:
        logging.info("Duplicate or old event, skipping.")
        return

    last_handled_timestamp = timestamp

    try:
        epd = epd7in5_V2.EPD()
        epd.init()

        if latest_entry.get("clear"):
            logging.info("Received clear command. Clearing e-paper display.")
            epd.Clear()
        elif "image" in latest_entry:
            base64_img_str = latest_entry["image"]

            if base64_img_str.startswith("data:image"):
                base64_img_str = base64_img_str.split(",")[1]

            image_bytes = base64.b64decode(base64_img_str)
            image = Image.open(BytesIO(image_bytes))

            local_path = "images/latest.png"
            image.save(local_path)
            logging.info(f"Saved decoded image to {local_path}")

            image = image.convert("1")
            image = image.resize((800, 480))
            epd.display(epd.getbuffer(image))
            logging.info("Displayed image on e-paper.")
        else:
            logging.info("Latest entry has neither image nor clear flag.")

        epd.sleep()
    except Exception as e:
        logging.error(f"Failed to process display update: {e}")

# Attach the listener to the Firebase "images" node
image_ref = db.reference("images")
image_ref.listen(on_firebase_change)
