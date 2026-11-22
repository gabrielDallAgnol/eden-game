# Eden

A cozy isometric pixel-art valley sim.

## Style rules

- 2:1 isometric, ground tile 64x32 px, light from upper left
- Dark 1-px outline, 3-4 shades per colour, cozy palette
- Real proportions: adult ~36 px tall, deer ~44 px long, rabbit ~11 px, big tree ~104 px, small cottage ~80 px
- Transparent sprite backgrounds

## Layout

- `art/` — art pipeline: reference images, generation and cleanup scripts, test outputs (see `art/README.md`)

The game code will live alongside `art/` at the top level.
