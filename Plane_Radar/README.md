# Plane Radar 

## Summary
~in-progress~

A live ADS-B plane radar built with an ESP32-C3 Super Mini and a 1.28" round GC9A01 display (240x240). It shows nearby aircraft on a sonar-style circular radar using data from [adsb.fi](https://opendata.adsb.fi/). On first boot, the device creates a WiFi captive portal for configuration (network credentials, home location, and display units). Once set up, it reconnects automatically and polls for aircraft every ~5 seconds.

## Notes
*The following steps assume no code changes are desired.*
1. Using a data USB-C cable, flash the ESP32 using [ESP Tool](https://espressif.github.io/esptool-js/) and the `plane-radar-v1.1.2.bin` file located in this repo.
2. Wire the GC9A01 display to the ESP32-C3 Super Mini on a breadboard:

   ![ESP32-C3 Super Mini Pinout](esp32c3_pinout.jpg)

   | Display | ESP32-C3 |
   |---------|----------|
   | VCC | 3V3 |
   | GND | GND |
   | RST | GPIO 0 |
   | CS | GPIO 1 |
   | DC | GPIO 10 |
   | SDA (MOSI) | GPIO 3 |
   | SCL (SCLK) | GPIO 4 |
3. Power the board via USB-C. On first boot the display will show a setup screen.
4. Connect to the **PlaneRadar-Setup** WiFi network from your phone or computer.
5. Open **http://plane-radar.local** or **http://192.168.4.1** and enter your home WiFi credentials, latitude/longitude, and preferred units (km or miles).
6. After saving, the device reboots and the radar begins showing live aircraft.

### Controls
- **Short press** the BOOT button to cycle radar range (5 → 10 → 15 → 25 km).
- **Hold BOOT for 3 seconds** to clear all settings and reboot into the setup portal.

## References
1. Use `.bin` file from latest release [here](https://github.com/MatixYo/ESP32-Plane-Radar) if
no desire to modify code. (fastest setup)
2. https://makerworld.com/en/models/2872376-esp32-plane-radar-live-ads-b-on-a-round-display#profileId-3207083