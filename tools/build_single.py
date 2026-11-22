#!/usr/bin/env python3
"""Build dist/eden.html: the whole game in one file (scripts and sprites inside it).

    python3 tools/build_single.py

The result has no <html>, <head> or <body> tags of its own, so it can be published as a page or
opened directly in a browser. Use it to put the game on a phone.
"""
import base64, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
read = lambda p: open(os.path.join(ROOT, p), encoding="utf-8").read()

html = read("index.html")
style = re.search(r"<style>(.*?)</style>", html, re.S).group(1)
body = re.search(r"<body>(.*?)<script", html, re.S).group(1)

meta = json.loads(read("assets/sprites/manifest.json"))
img = {}
for key, m in meta.items():
    raw = open(os.path.join(ROOT, "assets", "sprites", m["file"]), "rb").read()
    img[key] = "data:image/png;base64," + base64.b64encode(raw).decode()

safe = lambda js: js.replace("</script", "<\\/script")
out = f"""<title>Eden</title>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<style>{style}</style>
{body}
<script>window.EDEN_EMBED = {json.dumps({"meta": meta, "img": img})};</script>
<script>{safe(read("src/sim.js"))}</script>
<script>{safe(read("src/art.js"))}</script>
<script>{safe(read("src/sprites.js"))}</script>
<script>window.__edenView = function () {{
{safe(read("src/view.js"))}
}};</script>
<script>
EdenSprites.load('').catch(e => console.warn('sprites not loaded, using built-in art', e)).then(() => window.__edenView());
</script>
"""
dst = os.path.join(ROOT, "dist", "eden.html")
open(dst, "w", encoding="utf-8").write(out)
print(dst, f"{len(out) / 1024:.0f} KB")
