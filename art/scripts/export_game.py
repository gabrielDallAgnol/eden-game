"""Export sprites from art/out into the game's assets/sprites folder.

  art/.venv/bin/python art/scripts/export_game.py

Animation sheets are cut into frames, cropped to one shared box per animal
(so the feet stay on the same ground line in every frame) and written as
horizontal strips. Trees are re-centred on their trunk. A manifest.json tells
the game how many frames each strip has. Sprites face right; the game flips them.
"""
import json, os
import numpy as np
from PIL import Image

ART = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ART, "out")
DST = os.path.join(os.path.dirname(ART), "assets", "sprites")
os.makedirs(DST, exist_ok=True)
manifest = {}


def load(name):
    return np.array(Image.open(os.path.join(OUT, name)).convert("RGBA"))


def hard_alpha(a):
    a = a.copy()
    a[a[..., 3] < 128] = 0
    a[a[..., 3] >= 128, 3] = 255
    return a


def despeckle_white(a):
    """Drop near-white pixels hanging off the silhouette (left over from background removal)."""
    op = a[..., 3] > 0
    white = op & (a[..., :3].min(-1) > 215)
    p = np.pad(op, 1)
    open_sides = (~p[:-2, 1:-1]).astype(int) + (~p[2:, 1:-1]) + (~p[1:-1, :-2]) + (~p[1:-1, 2:])
    a = a.copy()
    a[white & (open_sides >= 2)] = 0
    return a


def cells(sheet, cols, rows):
    fh, fw = sheet.shape[0] // rows, sheet.shape[1] // cols
    return [sheet[r * fh:(r + 1) * fh, c * fw:(c + 1) * fw] for r in range(rows) for c in range(cols)]


def bbox(frames):
    m = np.zeros(frames[0].shape[:2], bool)
    for f in frames:
        m |= f[..., 3] > 0
    ys, xs = np.nonzero(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def animal(name, sheets, clean=lambda a: a):
    sets = {k: [clean(hard_alpha(f)) for f in cells(load(fn), c, r)] for k, (fn, c, r) in sheets.items()}
    x0, y0, x1, y1 = bbox([f for fs in sets.values() for f in fs])
    y1 = bbox(sets["walk"])[3]                      # ground line = lowest foot in the walk
    for k, fs in sets.items():
        strip = np.concatenate([f[y0:y1, x0:x1] for f in fs], axis=1)
        fn = f"{name}_{k}.png"
        Image.fromarray(strip).save(os.path.join(DST, fn))
        manifest[f"{name}_{k}"] = {"file": fn, "frames": len(fs), "w": int(x1 - x0), "h": int(y1 - y0)}


def tree(key, src):
    a = hard_alpha(load(src))
    x0, y0, x1, y1 = bbox([a])
    a = a[y0:y1, x0:x1]
    foot = np.nonzero(a[-6:, :, 3].any(0))[0]
    cx = int(round((foot.min() + foot.max() + 1) / 2))            # trunk centre
    half = max(cx, a.shape[1] - cx)
    canvas = np.zeros((a.shape[0], half * 2, 4), np.uint8)
    canvas[:, half - cx:half - cx + a.shape[1]] = a
    Image.fromarray(canvas).save(os.path.join(DST, key + ".png"))
    manifest[key] = {"file": key + ".png", "frames": 1, "w": int(canvas.shape[1]), "h": int(canvas.shape[0])}


def strip_backdrop(a):
    """Background removal sometimes leaves the flat white backdrop: flood it away from the image border."""
    h, w = a.shape[:2]
    near = (a[..., 3] > 0) & (a[..., :3].min(-1) > 235)
    seen = np.zeros((h, w), bool)
    stack = [(y, x) for y in range(h) for x in (0, w - 1) if near[y, x]] + [(y, x) for x in range(w) for y in (0, h - 1) if near[y, x]]
    for y, x in stack:
        seen[y, x] = True
    while stack:
        y, x = stack.pop()
        for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= yy < h and 0 <= xx < w and near[yy, xx] and not seen[yy, xx]:
                seen[yy, xx] = True
                stack.append((yy, xx))
    a = a.copy()
    a[seen] = 0
    return a


def still(key, src):
    a = strip_backdrop(hard_alpha(load(src)))
    x0, y0, x1, y1 = bbox([a])
    Image.fromarray(a[y0:y1, x0:x1]).save(os.path.join(DST, key + ".png"))
    manifest[key] = {"file": key + ".png", "frames": 1, "w": int(x1 - x0), "h": int(y1 - y0)}


animal("deer", {"walk": ("rd_deer_walk2_raw.png", 4, 2), "graze": ("rd_deer_graze_raw.png", 3, 2),
                "lie": ("rd_deer_lie_raw.png", 3, 2)}, despeckle_white)
animal("fawn", {"walk": ("rd_fawn_walk_raw.png", 4, 2), "graze": ("rd_fawn_graze_raw.png", 3, 2),
                "lie": ("rd_fawn_lie_raw.png", 3, 2)})
# people are drawn in key colours (red top, blue legs, brown hair, tan skin); the game recolours them per person
for who in ("man", "woman", "child"):
    animal(who, {"walk": (f"rd_{who}_walk_raw.png", 4, 2), "up": (f"rd_{who}_up_raw.png", 3, 2), "sit": (f"rd_{who}_sit_raw.png", 3, 2)})
tree("tree_green", "rd_tree_base_raw.png")
tree("tree_gold", "rd_tree_autumn_raw.png")
tree("tree_bare_snow", "rd_tree_winter_raw.png")
tree("tree_blossom", "rd_tree_spring_raw.png")
still("cottage", "rd_cottage_iso_1_raw.png")
for key in ("tent", "hut", "lakehouse", "well", "cart"):
    if os.path.exists(os.path.join(OUT, f"rd_{key}_raw.png")):
        still(key, f"rd_{key}_raw.png")
json.dump(manifest, open(os.path.join(DST, "manifest.json"), "w"), indent=1)
for k, v in manifest.items():
    print(k, v)
