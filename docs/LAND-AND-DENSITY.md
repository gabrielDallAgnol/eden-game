# Land, distance and density from one mechanism

Design note from a parallel review (2026-11-22). Not yet built. The worked numbers are hand arithmetic from constants in the code, not results of runs.

## The mechanism

Land is the one finite thing, each tile has one use at a time, and distance costs working time. Everything else follows.

## Land use

Use stays derived from the existing arrays (water, road, lot, field, forest or pasture by `tree` and `grass`). Add only:

- `owner` per tile (exists for fields since households; extend to lots). A household may build or sow only on common land or its own or kin's.
- `pit` per tile, 0 to 1 depth. `rock` is reused as stone remaining.
- `units` per lot: dwellings on the lot, replacing "one roof to a lot".

Exhaustion needs no new rule: a clear-cut tile takes about 40 years to be fellable again, and a tile with no wooded neighbour never reseeds.

## Walking cost

Keep moving people in one step, but charge the time from the household's own door:

    work done = day's work / (1 + d / (6 * v))

`d` is the distance along the ways from door to the place of work; `v` is 1 on open ground, 1.5 on a made road, 2 with a cart. The 6 is already in `person()` as the forage efficiency; it is only anchored on the camp centre today. Apply the same factor to timber, stone and firewood trips, and remove the fixed search radii.

With two workers this gives about 14 food a year at the door against a need of about 6, breaking even at an average distance of about 8 tiles. That reproduces today's forage range of 7 as an outcome instead of a rule.

## Where to put a roof

One cost, in food per year, for every option:

    cost = y * ( build work / H  +  yearly work lost to walking from that door )

- `y` is food per unit of work, already measured in `T.rate`.
- `H` is how far ahead people think: 10 years.
- An upper storey costs 1.6 times the build work, flats 2.2 times; each floor adds 1.5 tiles of "distance" for the stairs.
- The walking term uses the household's own trips from last year (fields, water, store, workplace, kin), counted, not assumed.

Worked examples:

- A farmer spends most trips at the fields, so a free lot beside a field always beats a storey in the centre. Farmers sprawl until the walk to the centre eats the surplus, at about 30 tiles. That is the natural edge of a settlement and the cause of a second one.
- Someone whose work is in the centre: a free lot wins while the nearest one is within about 6 tiles; beyond that a second storey wins; a third floor from about 9 tiles; a fourth from about 11.5.
- A population held at 30 never stacks, for two reasons: free lots stay within 4 to 8 tiles, and there are no spare hands for centre trades.

Caveat: density only appears where people spend their days in the centre. With everyone farming the model correctly gives a wide, low village. Stacking needs work done in buildings (roadmap step 2).

## Stone

- Quarry the tile that minimises trips x walking factor / (1 - half the pit depth). Each trip lowers `rock` and deepens `pit`; about 50 stone per tile.
- Deeper and farther both make stone dearer. Pits cannot be lots or fields.
- Rebuilding and floods should leave about 70% of the stone and 30% of the timber on site as rubble.
- An exhausted pit on wet ground fills and becomes a pond; under a lot it is a cellar; elsewhere a dump that can later be built on.

## Prices and rent, with no new model

- Wage = `y`.
- Price of stone or timber at a site = `y` x trips.
- Rent a household would pay for a lot = cost of its next best option minus cost of this one. Lot value = rent x `H`.
- An owner builds another unit when rent x `H` exceeds the build cost.
- A road, bridge or new district shortens trips, so rents fall by themselves.

## What to tune, in order

The 6 in the walking factor; stairs per floor (1.5); `H` (10); storey factors (1.6, 2.2); road speed (1.5); tree regrowth; pit step.

## Checks for the test page

- Population held near 30 for 100 years: no lot has more than one dwelling.
- Population rising to 400 on a 40x40 map: dwellings per lot fall with distance from the centre; farmers live further out than tradespeople.
- Fell every tree within 10 tiles: cold and timber trips rise within 2 years, building stalls, then recovery over decades, no extinction on easy land.
- Mean pit distance grows with houses built; at least one pit becomes a pond.

## Failure modes

- A single tower in a field: cap floors by means (timber 2, masonry 4, concrete more).
- Starving at the edge: reject options where income is below need.
- Oscillation: decide only when a roof is needed, never re-evaluate yearly.
- Forest never recovering: check a seed source survives.
