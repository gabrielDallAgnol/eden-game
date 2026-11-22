# A world that grows with its people

Design note from a parallel review (2026-11-22). Not yet built. Line numbers in the original review will have drifted; function names are given instead.

## Decision

One fixed array set at 128x128 tiles plus a `known` mask, rather than chunks generated on demand or separate regions.

- Chunked storage would mean rewriting most of `src/sim.js`: every field is indexed `y * N + x` and spread rules use `i +- 1`, `i +- N`.
- Separate regions leave seams nobody can walk across, and contradict a second hamlet on the same ground.
- 128x128 costs under 1 MB of field memory and leaves the code shape alone. Terrain is already a pure function of seed and position, so on-demand chunks remain possible later.

## The cause

`known` only records what has been seen: each step, tiles within sight of a person become known (less far under trees). It gates nothing. What changes is how far people go:

- Each person has a `reach`, replacing the fixed forage ranges in `person()`.
- Reach rises when a search comes back empty while the want is felt: forage too thin while hungry; no timber or stone found in `construct()`; no lot left in `choosePlot()`; a fed young person with nothing to do.
- Reach falls back when the person is fed and supplied.
- The means is physical: out and back before night, stretched by carts, tame beasts and made roads.

## What has to change

**Simulation**
- `land()` over 16,384 tiles is roughly 1 ms per step (a step is 20 s of real time), so it can run over the whole map at first.
- Loops that scan every tile each step (well watering, harvest) should walk a list of field tiles.
- The real cost is creatures: animal numbers must scale with area, and three places are quadratic (pack filter in `hunt()`, the adults filter in `person()`, the territory count at birth). Use the per-tile `cells` lists there.
- Water is currently one river and one pond at fixed fractions of `N`; at 128 it must come from noise.
- Newcomers should arrive at the edge of the known land, not the edge of the map.

**View**
- Chunked ground is mandatory: today's single bitmap would need about 430 MB at 128x128 and exceeds mobile canvas limits.
- 16x16-tile chunks (1024x512 px), one canvas per known chunk, a small pool for crossfades. Sixteen known chunks cost about 34 MB, less than today.
- Blur buffers become chunk-sized scratch buffers; the per-pixel noise becomes a 512x512 repeating tile.
- Only stale chunks in view are repainted, about one per frame.
- Unknown land: `colorAt` fades toward mist using a blurred `known`; chunks with nothing known get no canvas.
- Camera limits follow the known area.

## Order of work (the game keeps working after each step)

1. View: chunked ground at 40x40; must look the same.
2. View: scratch blur buffers and noise tile.
3. Sim: remove quadratic creature loops and per-step full-map loops; fix test baselines after.
4. Sim and view: `known` mask, mist, camera on the known box, still at 40.
5. Sim: `reach` replaces fixed radii.
6. Sim: noise-based water, a size parameter, animal numbers scaled; default 96, then 128.
7. Optional: slower stepping for far land; save and load.

## Risks

- Ten times the animals changes the ecological balance and needs retuning.
- Seams or flicker at chunk edges during crossfades.
- Step 6 changes every existing seed's world.
- Reach tuning could empty the camp.
- Any added or removed random call shifts every later event, so seeded histories change at steps 3 and 5.
