import sensor, image, time
from pyb import UART

# Initialize UART on OpenMV cam, adjust baud rate if needed
# Using UART 1 for the P0/P1 pins on the cam
uart = UART(1, 115200)

sensor.reset()
sensor.set_pixformat(sensor.RGB565)
sensor.set_framesize(sensor.QVGA)
sensor.skip_frames(time=2000)

while(True):
    img = sensor.snapshot()
    uart.write("Image Captured\n")  # Send simple message to check communication
    time.sleep(1000)
