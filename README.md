# Eden

A cozy isometric pixel-art valley sim.

## Style rules

- 2:1 isometric, ground tile 64x32 px, light from upper left
- Dark 1-px outline, 3-4 shades per colour, cozy palette
- Real proportions: adult ~36 px tall, deer ~44 px long, rabbit ~11 px, big tree ~104 px, small cottage ~80 px
- Transparent sprite backgrounds

## Run it

No build step and no dependencies: it is plain JavaScript served as static files.

    python3 -m http.server 8765

Then open http://localhost:8765 (add `?seed=7` for a fixed valley). It has to be served, not opened as a file, because the sprites are fetched.

## Layout

- `index.html` — page, styles and the loader
- `src/sim.js` — the valley itself: weather, soil, plants, animals, people, the god powers. No drawing; runs without a browser
- `src/art.js` — built-in hand-placed pixel sprites and painted-by-rule props
- `src/sprites.js` — swaps in art made outside the game (deer, fawn, leaf tree in every season, cottage) from `assets/sprites/`
- `src/view.js` — the isometric view (64x32 tiles), animation, camera, tools
- `assets/sprites/` — game-ready strips plus `manifest.json`, written by `art/scripts/export_game.py`
- `art/` — art pipeline: reference images, generation and cleanup scripts, test outputs (see `art/README.md`)
- `legacy/eden.html` — the original single-file version this was split from

## Adding art

1. Generate and review sprites in `art/` (see `art/out/README.md` for what works).
2. Add them to `art/scripts/export_game.py` and run it; it writes strips and the manifest into `assets/sprites/`.
3. Map the new strip to a creature or prop in `src/sprites.js`. Anything not mapped keeps its built-in look.
