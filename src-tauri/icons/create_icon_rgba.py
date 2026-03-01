from PIL import Image

# Create RGBA icons with alpha channel
color = (14, 165, 233, 255)  # RGBA

img_32 = Image.new('RGBA', (32, 32), color=color)
img_32.save('32x32.png')

img_128 = Image.new('RGBA', (128, 128), color=color)
img_128.save('128x128.png')

img_256 = Image.new('RGBA', (256, 256), color=color)
img_256.save('128x128@2x.png')

img_512 = Image.new('RGBA', (512, 512), color=color)
img_512.save('icon.png')

print("Created RGBA icons successfully!")
