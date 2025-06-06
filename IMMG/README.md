# I Miss My Girlfriend (IMMG)™  
<p align="center"><img alt="IMMG Hardware" src="kit.jpeg" width="400"></p>  
<p align="center"><em>⭐~star~⭐ if you cry every tim</em></p>

## 💌 Purpose  
A cute, minimalistic device that lets you send messages to a loved one from anywhere in the world. Displays messages or drawings on an e-paper screen for a cozy, always-on experience.

---

## 🧰 Hardware  
- Waveshare 7.5" V2 e-paper display (800x480)
- Raspberry Pi (Zero / 3 / 4 all work)
- MicroSD card (with Raspberry Pi OS Lite)
- Power supply (USB power adapter + cable, or a battery pack for portability)
- Optional: [3D-printed enclosure](https://www.printables.com/model/288612-housing-for-75-inch-waveshare-e-ink)

### Pin Connection
```
Waveshare EPD Pin   =>   Raspberry Pi (3 A+)
-----------------------------------------------
VCC       ->   3.3V
GND       ->   GND
DIN       ->   GPIO 10 (SPI0_MOSI)
CLK       ->   GPIO 11 (SPI0_SCK)
CS        ->   GPIO 8  (SPI0_CS0)
DC        ->   GPIO 25
RST       ->   GPIO 17
BUSY      ->   GPIO 24
```
---

## 🖥️ Software  

### Architecture  
- A frontend web app (hosted via GitHub Pages) allows users to draw or write a message  
- Firebase Realtime Database is used as the message-passing middleware  
- A Python script running on the Raspberry Pi fetches and displays the latest image on the e-paper display  

### Dependencies  
- `firebase-admin`  
- `requests`  
- `Pillow`  
- `waveshare_epd` (clone from the [official Waveshare e-Paper repo](https://github.com/waveshareteam/e-Paper.git))  

---

### Notes
#### FYI
* If you're having any issues with connecting the Pi to your Firebase Realtime DB, ensure in the DB's rules that the read/write rules have not expired.

#### Upcoming Updates, Bug Fixes, etc.
- [UPDATE] add better UI for adding text
- [UPDATE] make canvas bigger (7.5in, responsive)
- [UPDATE] add notes on overcoming any errors / bugs (e.g, waveshare_epd ModuleNoteFoundError, etc.)
- [UPDATE] add image/gif of final product (include in next release)
- [FIX] scale cursor on mobile (not aligned/calibrated correctly)