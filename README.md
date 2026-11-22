# Eden

A cozy isometric pixel-art valley sim.

## Style rules

- 2:1 isometric, ground tile 64x32 px, light from upper left
- Dark 1-px outline, 3-4 shades per colour, cozy palette
- Real proportions: adult ~36 px tall, deer ~44 px long, rabbit ~11 px, big tree ~104 px, small cottage ~80 px
- Transparent sprite backgrounds

## Run it

No build step and no dependencies: it is plain JavaScript served as static files.

    python3 serve.py

Then open http://localhost:8765 (add `?seed=7` for a fixed valley). It has to be served, not opened as a file, because the sprites are fetched. `serve.py` also stops the browser caching the scripts, so edits always load.

## What is in it

- **Lands:** valley, plains, forest, lakeland, highland. Pick one on the opening card or with `?land=forest`. Same rules everywhere; only water, timber, stone and cold differ.
- **People:** named individuals with parents, partners, children, households and crafts they improve at (see `src/sim.js`, "people are someone").
- **Village:** a tent of hides first, then huts once a winter has been spent under hides, then timber-and-stone houses when the camp is large. Each goes up in stages that wait for timber and stone carried to the plot. Dwellings near water stand on posts; a well is dug once there are several roofs; paths wear between the fire, the doors and the water.

## One file, for a phone

    python3 tools/build_single.py

writes `dist/eden.html`, the whole game with its scripts and sprites inside one file. Open it directly, or publish it as a page.

## Checking it still works

Open http://localhost:8765/tests.html while the folder is being served. It runs fixed-seed worlds for 40 years each and checks invariants (nobody in water, no two buildings on one tile, stocks never negative, the same seed gives the same history, and so on). Options go in the address, e.g. `?years=10&seeds=1,2&lands=valley,highland`.

- `/scenarios.html` runs named situations (population held at 30, the forest felled round the village, a permanent drought, no wolves, no stone) and says whether each expectation holds. These are the acceptance tests for the phases in `docs/PLAN.md`.
- `/table.html` runs the standard 100-year table (5 lands x 2 seeds) that every step records in `docs/RUNS.md`.

## Building it further

`docs/PLAN.md` is the ordered implementation plan, with how to work on the code and how each step is checked. `CLAUDE.md` holds the working rules.

## Where it is going

`docs/ARCHITECTURE.md` has the two design rules (causes decide what, where and when; fixed forms decide how it sits on the ground), the target data model and the roadmap from camp to city.

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
