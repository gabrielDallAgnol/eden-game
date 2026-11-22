# Eden art-pipeline test — results

Run on 2026-11-22. Everything is in `~/eden-game/art`; the side-by-side sheet is `out/compare.png` (all tiles 3x nearest-neighbour).

## Verdict

**Use Retro Diffusion (RD Pro) for organic things — trees, animals, props — and Blender for buildings.** Then run every sprite through `scripts/cleanup.py` with a palette built for Eden, not one pulled from a single autumn screenshot.

- RD is far better at anything hand-drawn-looking: the tree, the deer and the fawn were usable on the first or second try and read as real pixel art.
- RD cottages look nicer than the Blender one, but each of the four has a different footprint, roof pitch and camera angle. That is fine for one hero building and a problem for a tile-grid game where buildings must sit on 64x32 tiles and match each other.
- Blender gives exact 2:1 geometry, exact light direction and exact size every time, and a variant (new roof colour, longer porch, snow) is a one-line change. It looks plain: flat faces with no hand-placed texture.
- The practical combination for buildings: block the shape in Blender for footprint and angle, then either pass that render to RD as the img2img input to get the texture, or paint over it by hand. I did not test the Blender-to-RD img2img step.

## What worked

| Test | Result |
|---|---|
| A. RD cottage, isolated | 4 clean isometric cottages, 70-78 px wide and 71-76 px tall, transparent background, dark outline, about 20 colours each. Teal roof, porch, chimney all present. |
| B. RD tree + seasons | Base tree is 84x94 px. img2img kept the same trunk and silhouette for summer, autumn and spring; winter (strength 0.8) redrew it as a bare snowy tree with the same trunk base. Raw results are the strongest output of the whole test. |
| C. RD deer + fawn | Adult is 41 px long, fawn 29 px. Graze and lie-down (6 frames each) read clearly for both. Fawn walk was good first time. |
| D. Blender cottage | 77x80 px at the correct tile scale (1 unit = one tile edge, 64 px per tile), 20 flat colours, no anti-aliasing, light from upper left. Fully scripted: `blender -b -P scripts/blender_cottage.py`. |
| Cleanup | Hard alpha, stray-island removal, palette snap and outline all run per sprite or per sheet cell. No output has semi-transparent pixels. |

## What didn't

- **Reference image made scenes, not sprites.** With the ArtStation crop passed as `reference_images`, all 4 cottages came back as full scenes with ground and autumn trees, and background removal could not isolate them. The style match was excellent, so this is useful for mood pieces, not assets. The second batch dropped the reference image and kept only the palette.
- **My first reference crop was wrong.** The crop sent to RD for that batch included a strip of the browser header and missed the right side of the picture. The files in `reference/` are now correct; the RD scene batch was not rerun with the corrected crop.
- **RD's palette input darkened the roofs.** The isolated cottages have slate-teal roofs, not the bright teal of the reference.
- **Background removal is unreliable when a palette is passed.** Cottage #4 kept a tan patch behind it, and the fawn and all three fawn animations came back on a pale backdrop. I removed the fawn backdrop locally (originals kept as `*_api.png`); cottage #4 is left as returned.
- **Deer walk needed a second try.** A few white specks left by background removal on the base sprite turned into large white blobs in the first walk cycle. Removing the specks and regenerating fixed it (`rd_deer_walk2`). The legs move, but it is a subtle walk.
- **Sizes are not controllable.** The deer is 51 px tall against a 36 px person target, the fawn is 29 px long against a rabbit at 11 px, and the tree is 94 px, not 104. RD draws to fill the canvas, so scale has to be set by canvas size per asset and checked by eye.
- **Snapping to the reference palette hurts off-palette subjects.** The reference is an autumn scene, so its 24 colours have one olive green, no pink, no near-white and no near-black. After cleanup the summer tree goes olive, spring blossom goes beige and blue, snow goes pale blue, and the outline is dark maroon. Autumn tree, cottages and deer survive well. Eden needs its own master palette (around 32-48 colours covering four seasons) before this step is worth applying to everything.
- **Blender cottage is plain.** No roof tiles, plank lines or stone texture, and the porch reads as a flat slab. Fixable with more geometry or a paint-over pass.

## Cost

| Test | Calls | Spent |
|---|---|---|
| A. Cottage (4 with reference image, 4 isolated) | 2 | $1.44 |
| B. Tree (base + 4 seasons) | 5 | $0.90 |
| C. Deer + fawn (2 bases, 7 animations incl. one retry) | 9 | $1.78 |
| D. Blender | – | $0.00 |
| **Total** | 16 | **$4.12** |

Approved budget was $5.00 (hard cap $8.00). Per-call detail is in `out/cost_log.json`. Unit prices: RD Pro still $0.18, walk animation $0.14, custom-action animation $0.25.

## Files

- `reference/cottage.png` — the ArtStation crop used for the palette. The other five screenshots are saved next to it as extra style references and were not used.
- `out/palette.png`, `out/palette.json` — the 24 extracted colours.
- `out/*_raw.png` — outputs as generated; `out/*_raw_clean.png` — after cleanup; `out/*_api.png` — fawn files before local backdrop removal.
- `out/blender_cottage.blend` — the model.
- Animation sheets: walk is 4x2 cells, graze and lie-down are 3x2 cells; deer cells are 64 px, fawn cells 48 px.
- `scripts/` — `blender_cottage.py`, `cleanup.py`, `rd.py` (API client with cost log and cap), `compare.py`, `preview.py`.
- The Retro Diffusion key is in `.rd_key` (chmod 600).

## How the outline step behaves

Edge pixels that are already dark are recoloured to the single outline colour; where the edge is light, one outline pixel is added outside it. This keeps the outline at 1 px on sprites RD already outlined, at the cost of single sprites growing by up to 1 px per side (the clean stills are 2 px larger than the raw ones).

## Later: people for the game

Man, woman and child were generated after the first test, drawn in key colours (red top, blue legs, brown hair, tan skin) so the game can recolour them per person: 3 base sprites ($0.54) and a walk, arms-up and sitting sheet for each ($1.92). Spend on people: $2.46. Running total: $6.58 of the $8.00 hard cap.

## Later: the village

Tent, hut, lake house on stilts, well and cart: 5 stills, $0.90. Running total: $7.48 of the $8.00 hard cap.
