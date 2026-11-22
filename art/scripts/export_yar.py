"""Cut the cells Eden uses from Yar's CC-BY 3.0 outside tileset into assets/sprites (one still each).

    .venv/bin/python scripts/export_yar.py      (from art/)

The colours are left as drawn; the game maps them onto its own ramps per season (src/sprites.js).
"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "art", "third_party", "yar_iso_64x64_outside.png")
DST = os.path.join(ROOT, "assets", "sprites")
# key -> (row, col) of the 64 px cell
CELLS = {
    "yar_bush_a": (12, 8), "yar_bush_b": (12, 7), "yar_bush_c": (12, 0),
    "yar_grass_a": (11, 8), "yar_grass_b": (11, 0),
    "yar_rock_a": (6, 7), "yar_rock_b": (6, 8), "yar_rock_c": (6, 9),
}
sheet = np.array(Image.open(SRC).convert("RGBA"))
man_path = os.path.join(DST, "manifest.json")
man = json.load(open(man_path))
for key, (r, c) in CELLS.items():
    a = sheet[r * 64:(r + 1) * 64, c * 64:(c + 1) * 64].copy()
    a[a[..., 3] < 128] = 0; a[..., 3][a[..., 3] > 0] = 255          # hard alpha
    ys, xs = np.nonzero(a[..., 3]); a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(a).save(os.path.join(DST, key + ".png"))
    man[key] = {"file": key + ".png", "frames": 1, "w": int(a.shape[1]), "h": int(a.shape[0])}
    print(key, a.shape[1], "x", a.shape[0])
json.dump(man, open(man_path, "w"), indent=1)
