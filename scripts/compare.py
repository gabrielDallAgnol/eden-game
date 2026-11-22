"""Build out/compare.png: labelled tiles, everything 3x nearest-neighbour."""
import os, json
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
O = os.path.join(ROOT, "out")
SC, PAD, LAB = 3, 14, 22
BG, TILE_BG, INK, SUB = (38, 42, 48), (112, 150, 104), (236, 232, 220), (160, 170, 180)


def font(sz):
    for p in ("/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Helvetica.ttc"):
        try:
            return ImageFont.truetype(p, sz)
        except Exception:
            pass
    return ImageFont.load_default()


F, FH = font(13), font(20)


def tile(label, path, scale=SC, first_frame=False):
    im = Image.open(os.path.join(O, path) if not os.path.isabs(path) else path)
    if first_frame:
        im.seek(0)
    im = im.convert("RGBA")
    im = im.resize((im.width * scale, im.height * scale), Image.NEAREST) if scale != 1 else im
    w = max(im.width, int(F.getlength(label)) + 4)
    t = Image.new("RGBA", (w, im.height + LAB), BG + (255,))
    t.paste(Image.new("RGBA", im.size, TILE_BG + (255,)), (0, LAB))
    t.alpha_composite(im, (0, LAB))
    ImageDraw.Draw(t).text((1, 3), label, font=F, fill=INK)
    return t


def row(title, tiles, max_w):
    """Lay tiles left to right, wrapping at max_w. Returns an image."""
    lines, cur, x = [], [], 0
    for t in tiles:
        if cur and x + t.width > max_w:
            lines.append(cur); cur, x = [], 0
        cur.append(t); x += t.width + PAD
    lines.append(cur)
    h = 34 + sum(max(t.height for t in ln) + PAD for ln in lines)
    r = Image.new("RGBA", (max_w, h), BG + (255,))
    d = ImageDraw.Draw(r)
    d.text((0, 4), title, font=FH, fill=INK)
    y = 34
    for ln in lines:
        x = 0
        for t in ln:
            r.alpha_composite(t, (x, y)); x += t.width + PAD
        y += max(t.height for t in ln) + PAD
    return r


def build(rows, dst=os.path.join(O, "compare.png"), max_w=2700):
    imgs = [row(title, tiles, max_w) for title, tiles in rows]
    W = Image.new("RGBA", (max_w + 2 * PAD, sum(i.height for i in imgs) + PAD * (len(imgs) + 1)), BG + (255,))
    y = PAD
    for i in imgs:
        W.alpha_composite(i, (PAD, y)); y += i.height + PAD
    W.convert("RGB").save(dst)
    print(dst, W.size)


if __name__ == "__main__":
    ref = Image.open(os.path.join(ROOT, "reference", "cottage.png"))
    ref_small = os.path.join(ROOT, ".tmp", "ref_row.png")
    os.makedirs(os.path.dirname(ref_small), exist_ok=True)
    ref.resize((ref.width * 2 // 3, ref.height * 2 // 3), Image.LANCZOS).save(ref_small)
    pal = Image.open(os.path.join(O, "palette.png"))
    pal_big = os.path.join(ROOT, ".tmp", "pal_row.png")
    pal.resize((pal.width * 30, 60), Image.NEAREST).save(pal_big)

    r1 = [tile("reference/cottage.png (ArtStation crop, screen res)", ref_small, 1),
          tile("24-colour palette extracted from it", pal_big, 1)]
    r2a = ([tile(f"RD Pro + ref image #{i} raw", f"rd_cottage_{i}_raw.png") for i in range(1, 5)]
           + [tile("Blender raw", "blender_cottage_raw.png"), tile("Blender clean", "blender_cottage_raw_clean.png")])
    r2b = ([tile(f"RD Pro isolated #{i} raw", f"rd_cottage_iso_{i}_raw.png") for i in range(1, 5)]
           + [tile(f"RD isolated #{i} clean", f"rd_cottage_iso_{i}_raw_clean.png") for i in range(1, 5)])
    S = ("summer", "autumn", "winter", "spring")
    r3a = [tile("base tree raw", "rd_tree_base_raw.png")] + [tile(f"{s} raw", f"rd_tree_{s}_raw.png") for s in S]
    r3b = [tile(f"{s} clean (snapped to palette)", f"rd_tree_{s}_raw_clean.png") for s in S]
    r4 = json.load(open(os.path.join(O, "deer_tiles.json")))
    r4 = [tile(l, p) for l, p in r4]
    build([("1  Reference", r1),
           ("2  Cottage: Retro Diffusion with reference image (came back as scenes) and Blender", r2a),
           ("2  Cottage: Retro Diffusion isolated sprites, raw then clean", r2b),
           ("3  Tree seasons, raw (img2img from the base tree)", r3a),
           ("3  Tree seasons, clean", r3b),
           ("4  Deer + fawn frames", r4)], max_w=2480)
