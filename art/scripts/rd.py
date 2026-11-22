"""Tiny Retro Diffusion client for the Eden art test.

Every paid call is logged to out/cost_log.json and refused once the running
total would pass CAP_USD. Key is read from ~/eden-game/art/.rd_key.
"""
import base64, io, json, os, time
import requests
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
LOG = os.path.join(OUT, "cost_log.json")
URL = "https://api.retrodiffusion.ai/v1/inferences"
CAP_USD = 5.00
KEY = open(os.path.join(ROOT, ".rd_key")).read().strip()


def b64_image(path_or_img, rgb=True, size=None, bg=(255, 255, 255)):
    im = Image.open(path_or_img) if isinstance(path_or_img, str) else path_or_img
    if size:
        im = im.resize(size, Image.NEAREST)
    if rgb and im.mode == "RGBA":
        base = Image.new("RGB", im.size, bg)
        base.paste(im, mask=im.split()[3])
        im = base
    elif rgb:
        im = im.convert("RGB")
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _log():
    return json.load(open(LOG)) if os.path.exists(LOG) else []


def spent():
    return round(sum(e["cost"] for e in _log()), 4)


def call(payload):
    r = requests.post(URL, headers={"X-RD-Token": KEY}, json=payload, timeout=600)
    try:
        return r.status_code, r.json()
    except Exception:
        return r.status_code, {"raw": r.text[:500]}


def generate(test, name, payload, dry=False):
    """Returns list of saved file paths. Files: out/<name>_raw.png (or _raw_N.png / .gif)."""
    code, chk = call({**payload, "check_cost": True})
    if code != 200:
        raise RuntimeError(f"cost check failed {code}: {json.dumps(chk)[:400]}")
    cost = chk["balance_cost"]
    print(f"[{test}] {name}: ${cost:.2f} (spent so far ${spent():.2f})")
    if dry:
        return []
    if spent() + cost > CAP_USD:
        raise RuntimeError(f"budget cap: {spent()} + {cost} > {CAP_USD}")
    for attempt in range(3):
        code, res = call(payload)
        if code == 200 and (res.get("base64_images") or res.get("output_urls")):
            break
        print("  retry:", code, json.dumps(res)[:300])
        time.sleep(8)
    else:
        raise RuntimeError(f"generation failed: {code} {json.dumps(res)[:400]}")
    blobs = [base64.b64decode(b) for b in res.get("base64_images") or []]
    if not blobs:
        blobs = [requests.get(u, timeout=120).content for u in res["output_urls"]]
    paths = []
    for i, blob in enumerate(blobs):
        ext = "gif" if blob[:3] == b"GIF" else "png"
        suffix = "" if len(blobs) == 1 else f"_{i + 1}"
        p = os.path.join(OUT, f"{name}{suffix}_raw.{ext}")
        open(p, "wb").write(blob)
        paths.append(p)
    log = _log()
    log.append({"test": test, "name": name, "cost": res.get("balance_cost", cost),
                "style": payload.get("prompt_style"), "size": [payload.get("width"), payload.get("height")],
                "n": payload.get("num_images"), "prompt": payload.get("prompt"),
                "files": [os.path.basename(p) for p in paths], "time": int(time.time())})
    json.dump(log, open(LOG, "w"), indent=1)
    for p in paths:
        im = Image.open(p)
        print("  saved", os.path.basename(p), im.size, im.mode, getattr(im, "n_frames", 1))
    return paths
