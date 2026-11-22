"""Eden sprite cleanup.

  python scripts/cleanup.py palette                 # build out/palette.png from reference/cottage.png
  python scripts/cleanup.py clean a.png b.png ...   # writes a_clean.png next to each input
  python scripts/cleanup.py clean sheet.png --frames 8x1   # clean each cell of a sprite sheet

Steps per sprite: hard alpha (no semi-transparent pixels), drop tiny stray
islands, snap every colour to the ~24-colour reference palette (nearest
colour, no dithering), then add a uniform 1-px dark outline around the shape.
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "reference", "cottage.png")
PAL_PNG = os.path.join(ROOT, "out", "palette.png")
PAL_JSON = os.path.join(ROOT, "out", "palette.json")
N_COLOURS = 24


def build_palette(ref=REF, n=N_COLOURS):
    im = Image.open(ref).convert("RGB")
    # work at a modest size so UI chrome / gradients don't dominate
    im.thumbnail((512, 512), Image.NEAREST)
    # Over-quantize, then pick n colours by farthest-point sampling so small but
    # important hues (the green door, plants, pale highlights) survive next to
    # the big orange/teal areas instead of being averaged away.
    q = im.quantize(colors=128, method=Image.Quantize.MEDIANCUT, kmeans=2, dither=Image.Dither.NONE)
    cand = np.array(q.getpalette()[: 128 * 3], dtype=np.float64).reshape(-1, 3)
    counts = np.bincount(np.array(q).ravel(), minlength=128).astype(np.float64)
    keep = counts > counts.sum() * 0.0008           # ignore JPEG-noise colours
    cand, counts = cand[keep], counts[keep]
    chosen = [int(np.argmax(counts))]
    dmin = np.linalg.norm(cand - cand[chosen[0]], axis=1)
    while len(chosen) < min(n, len(cand)):
        score = dmin * (counts / counts.max()) ** 0.15   # mild bias to common colours
        i = int(np.argmax(score))
        chosen.append(i)
        dmin = np.minimum(dmin, np.linalg.norm(cand - cand[i], axis=1))
    pal = cand[chosen].round().astype(np.uint8)
    pal = np.unique(pal, axis=0)
    # sort dark -> light for a readable swatch
    lum = pal @ np.array([0.299, 0.587, 0.114])
    pal = pal[np.argsort(lum)]
    os.makedirs(os.path.dirname(PAL_PNG), exist_ok=True)
    Image.fromarray(pal[None, :, :], "RGB").save(PAL_PNG)
    json.dump(["#%02x%02x%02x" % tuple(c) for c in pal], open(PAL_JSON, "w"), indent=1)
    return pal


def load_palette():
    if not os.path.exists(PAL_JSON):
        return build_palette()
    cols = json.load(open(PAL_JSON))
    return np.array([[int(c[i:i + 2], 16) for i in (1, 3, 5)] for c in cols], dtype=np.uint8)


def outline_colour(pal):
    """Darkest palette entry, used for every outline."""
    lum = pal @ np.array([0.299, 0.587, 0.114])
    return pal[int(np.argmin(lum))]


def snap(rgb, pal):
    """Nearest palette colour with the 'redmean' perceptual weighting."""
    px = rgb.reshape(-1, 1, 3).astype(np.int32)
    p = pal.reshape(1, -1, 3).astype(np.int32)
    rm = (px[..., 0] + p[..., 0]) / 2
    d = px - p
    dist = ((2 + rm / 256) * d[..., 0] ** 2 + 4 * d[..., 1] ** 2 + (2 + (255 - rm) / 256) * d[..., 2] ** 2)
    return pal[np.argmin(dist, axis=1)].reshape(rgb.shape)


def drop_islands(mask, min_px=3):
    """Remove 8-connected opaque blobs smaller than min_px."""
    h, w = mask.shape
    seen = np.zeros_like(mask, bool)
    out = mask.copy()
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        stack, blob = [(y0, x0)], []
        seen[y0, x0] = True
        while stack:
            y, x = stack.pop()
            blob.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not seen[yy, xx]:
                        seen[yy, xx] = True
                        stack.append((yy, xx))
        if len(blob) < min_px:
            for y, x in blob:
                out[y, x] = False
    return out


def clean_array(a, pal, pad=True):
    """a: HxWx4 uint8. Returns cleaned HxWx4 (2 px larger each way if pad)."""
    if pad:
        a = np.pad(a, ((1, 1), (1, 1), (0, 0)))
    mask = drop_islands(a[..., 3] >= 128)
    rgb = snap(a[..., :3], pal)
    # Uniform 1-px outline without doubling up: edge pixels that are already
    # dark are recoloured to the one outline colour; where the edge is not
    # dark, an outline pixel is added just outside it.
    oc = outline_colour(pal)
    lum = rgb.astype(np.float64) @ np.array([0.299, 0.587, 0.114])

    def neighbours(m):
        q = np.pad(m, 1)
        return q[:-2, 1:-1] | q[2:, 1:-1] | q[1:-1, :-2] | q[1:-1, 2:]

    edge = mask & neighbours(~mask)
    dark_edge = edge & (lum < 75)
    ring = neighbours(edge & ~dark_edge) & ~mask
    out = np.zeros_like(a)
    out[mask, :3] = rgb[mask]
    out[mask, 3] = 255
    out[dark_edge, :3] = oc
    out[ring, :3] = oc
    out[ring, 3] = 255
    return out


def clean_file(path, pal, frames=None):
    a = np.array(Image.open(path).convert("RGBA"))
    if frames:
        cols, rows = frames
        fh, fw = a.shape[0] // rows, a.shape[1] // cols
        out = np.zeros_like(a)
        for r in range(rows):
            for c in range(cols):
                cell = a[r * fh:(r + 1) * fh, c * fw:(c + 1) * fw]
                # keep cell size: outline is drawn inside the cell bounds
                out[r * fh:(r + 1) * fh, c * fw:(c + 1) * fw] = clean_array(cell, pal, pad=False)
    else:
        out = clean_array(a, pal)
    dst = os.path.splitext(path)[0] + "_clean.png"
    Image.fromarray(out, "RGBA").save(dst)
    return dst


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["palette", "clean"])
    ap.add_argument("files", nargs="*")
    ap.add_argument("--frames", help="COLSxROWS for sprite sheets, e.g. 8x1")
    args = ap.parse_args()
    if args.cmd == "palette":
        p = build_palette()
        print(f"{len(p)} colours -> {PAL_PNG}")
        sys.exit()
    pal = load_palette()
    fr = tuple(int(v) for v in args.frames.lower().split("x")) if args.frames else None
    for f in args.files:
        print(clean_file(f, pal, fr))
