"""python scripts/preview.py out.png scale file1 file2 ... -> contact sheet on a grass-green background."""
import sys
from PIL import Image
dst, sc, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert("RGBA") for f in files]
ims = [i.resize((i.width * sc, i.height * sc), Image.NEAREST) for i in ims]
W = Image.new("RGBA", (sum(i.width + 8 for i in ims), max(i.height for i in ims)), (120, 160, 110, 255))
x = 0
for i in ims:
    W.alpha_composite(i, (x, 0)); x += i.width + 8
W.save(dst)
