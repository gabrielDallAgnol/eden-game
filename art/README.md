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

## Third-party art (free packs, recoloured)

Free art can be used when its license allows it: CC0, or CC-BY with credit. Every file is listed in `third_party/CREDITS.md`, and CC-BY art is credited on the opening card in `index.html`. Its own colours are not used: `gradientMap` in `src/sprites.js` keeps each pixel's lightness, maps it onto one of Eden's ramps (`RAMP`: spring, plain, dry, gold, red, frost, rock, wet) and adds Eden's 1 px outline. One drawing so gives every season, and packs by different artists match each other.

What matters when picking a pack is therefore the angle (true 2:1 isometric, 64x32 tiles), the scale (a person about 36 px), light from the upper left, and the license, not the colours.

### In use: Yar's isometric outside tileset (CC-BY 3.0)

`third_party/yar_iso_64x64_outside.png`, a 10 x 16 grid of 64 px cells (row, column from 0):

| Cells | What | Used |
|---|---|---|
| 5,0 to 5,9; 6,7 to 6,9; 7,0 | rocks and outcrops, small to large | 6,7  6,8  6,9 as `yar_rock_a/b/c` |
| 6,0 to 6,5 | rock blocks with water and waterfalls | no |
| 7,1 to 7,9 | grass-topped cliff blocks | no |
| 8,0 to 10,2 | water tiles with muddy edges, a rock in water, an islet | no (Eden's painted water looks better) |
| 11,0 to 11,8 | tall grass, single and joined clumps | 11,8  11,0 as `yar_grass_a/b` |
| 11,9 | dead thorny bush | no |
| 12,0 12,1 12,6 to 12,9 | bushes, small to large | 12,8  12,7  12,0 as `yar_bush_a/b/c` |
| 12,2 12,3 | pines | no |
| 12,4 12,5 | fallen logs | no |
| 13,0 to 15,3 | tall trees, green and bare | no |
| 14,4 to 15,6; 13,7 to 15,9 | large dead tree; large oak | no |

### Adding a cell from a sheet

1. Add the key and its (row, column) to `CELLS` in `scripts/export_yar.py` (or copy that script for a new sheet), then run `.venv/bin/python scripts/export_yar.py`. It writes `assets/sprites/<key>.png` and its entry in `manifest.json`.
2. In `src/sprites.js`, `yarProps()`: load it with `raw(key, scale)` and recolour with `leafy(...)` (all leaf seasons), `stone(...)` (dry, wet, snow) or `gradientMap(src, RAMP.x, mk)` for one ramp. Put it on `A`.
3. In `src/view.js`, `wantProps()`: decide where it stands from the world's state, never a timer (rule 1). `leafState(i, T, falling)` gives the season of a leafy plant from the same causes as trees.
4. Run `python3 tools/build_single.py` so the phone build carries the new sprite.

Reference sheets: `out/yar/seasons.png` (every season from one drawing), `out/yar/in_game_seasons.png` (autumn and winter in the game), `out/compare_photos.png` (why photos converted to pixel art do not work as sprites: wrong angle, backgrounds, mush at 40 px; only top-down ground textures came out usable).
