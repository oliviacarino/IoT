### Test connection between Pi and Waveshare display
####################################################

from waveshare_epd import epd7in5_V2
import time
from PIL import Image, ImageDraw, ImageFont

def main():
    epd = epd7in5_V2.EPD()
    epd.init()
    epd.Clear()

    # Create a blank image for drawing
    image = Image.new('1', (epd.width, epd.height), 255)  # 255: clear the frame
    draw = ImageDraw.Draw(image)

    # Draw some text
    font = ImageFont.load_default()
    draw.text((10, 10), 'Hello Waveshare 7.5" V2!', font=font, fill=0)

    # Display the image
    epd.display(epd.getbuffer(image))
    
    time.sleep(10)
    epd.sleep()

if __name__ == '__main__':
    main()
