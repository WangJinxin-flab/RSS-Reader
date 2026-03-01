from PIL import Image
import os

# Create a simple 32x32 blue icon
img = Image.new('RGB', (32, 32), color=(14, 165, 233))
img.save('32x32.png')
print("Created 32x32.png")

# Create other sizes
img_128 = Image.new('RGB', (128, 128), color=(14, 165, 233))
img_128.save('128x128.png')
print("Created 128x128.png")

img_256 = Image.new('RGB', (256, 256), color=(14, 165, 233))
img_256.save('128x128@2x.png')
print("Created 128x128@2x.png")

img_512 = Image.new('RGB', (512, 512), color=(14, 165, 233))
img_512.save('icon.png')
print("Created icon.png")

print("All icons created successfully!")
