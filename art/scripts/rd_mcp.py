"""Generate sprites through the Retro Diffusion MCP endpoint (https://mcp.retrodiffusion.ai/mcp).

The key never appears here: in a Claude cloud session it is added to requests to that host by the environment's network
secret (Authorization: Bearer ...). Every paid call is priced first (free), logged to out/cost_log.json, and refused once
the running total would pass CAP_USD (the owner's cap: $10 in all, raised from $8 on 2026-11-22).

    python3 scripts/rd_mcp.py one <name> <style> <w> <h> "<prompt>"
"""
import base64, json, os, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
LOG = os.path.join(OUT, "cost_log.json")
URL = "https://mcp.retrodiffusion.ai/mcp"
CAP_USD = 10.0


def call(name, args, _id=[100]):
    _id[0] += 1
    body = json.dumps({"jsonrpc": "2.0", "id": _id[0], "method": "tools/call", "params": {"name": name, "arguments": args}}).encode()
    req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json", "Accept": "application/json, text/event-stream"})
    raw = urllib.request.urlopen(req, timeout=900).read().decode()
    data = [l[5:] for l in raw.splitlines() if l.startswith("data:")]
    msg = json.loads(data[-1] if data else raw)
    if "error" in msg:
        raise RuntimeError(json.dumps(msg["error"])[:500])
    out = []
    for c in msg["result"].get("content", []):
        if c.get("type") == "text":
            try:
                out.append(json.loads(c["text"]))
            except Exception:
                out.append(c["text"])
        elif c.get("type") == "image":
            out.append({"image_b64": c.get("data")})
    return out


def spent():
    return round(sum(e["cost"] for e in json.load(open(LOG))), 4)


def generate(name, style, w, h, prompt, n=1):
    args = {"prompt": prompt, "prompt_style": style, "width": w, "height": h, "num_images": n}
    est = call("estimate_inference_cost", args)[0]
    cost = est.get("balance_cost", est.get("cost")) if isinstance(est, dict) else float(est)
    if spent() + cost > CAP_USD:
        raise RuntimeError(f"budget cap: {spent()} + {cost} > {CAP_USD}")
    res = call("create_inference", {**args, "remove_bg": True})
    imgs = []
    for r in res:
        if isinstance(r, dict):
            for k in ("base64_images", "images"):
                for im in r.get(k, []) or []:
                    imgs.append(im if isinstance(im, str) else im.get("b64") or im.get("data"))
            for u in r.get("output_urls", []) or []:
                imgs.append(u)
            if r.get("image_b64"):
                imgs.append(r["image_b64"])
    files = []
    for i, b in enumerate(imgs):
        if not b:
            continue
        if b.startswith("http"):
            data = urllib.request.urlopen(b, timeout=120).read()
        else:
            data = base64.b64decode(b.split(",")[-1])
        fn = f"{name}{'' if len(imgs) == 1 else '_' + str(i + 1)}_raw.png"
        open(os.path.join(OUT, fn), "wb").write(data)
        files.append(fn)
    log = json.load(open(LOG))
    log.append({"test": "M", "name": name, "cost": cost, "style": style, "size": [w, h], "n": n, "prompt": prompt, "files": files, "time": int(time.time()), "via": "mcp"})
    json.dump(log, open(LOG, "w"), indent=1)
    print(f"{name}: ${cost:.2f} (spent ${spent():.2f} of ${CAP_USD:.2f}) -> {files}")
    if not files:
        print(json.dumps(res)[:1500])
    return files


if __name__ == "__main__":
    if sys.argv[1] == "one":
        generate(sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), sys.argv[6])
