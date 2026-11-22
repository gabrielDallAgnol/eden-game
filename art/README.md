# Eden art pipeline

Experiments for producing Eden's sprites. Run everything from this `art/` folder.

- `out/README.md` — results of the first test (Retro Diffusion vs Blender) and the recommended approach
- `out/compare.png` — side-by-side sheet
- `scripts/` — Blender cottage, sprite cleanup, Retro Diffusion client, comparison builder
- `reference/` — style reference screenshots (third-party artwork, for private reference only)

## Setup

    uv venv .venv && uv pip install -p .venv -r requirements.txt

Put your Retro Diffusion API key in `art/.rd_key` (ignored by git), then e.g.

    blender -b -P scripts/blender_cottage.py
    .venv/bin/python scripts/cleanup.py palette
    .venv/bin/python scripts/cleanup.py clean out/some_sprite_raw.png
    .venv/bin/python scripts/compare.py
