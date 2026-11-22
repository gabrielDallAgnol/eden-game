# The living ground: how the environment grows and reacts

Design note, 2026-11-22. Not yet built. It plans phase M in `docs/PLAN.md`. Function names are given, not line numbers.

## The idea in one paragraph

The ground is a handful of numbers per tile (water, warmth, nutrients, plants, seed) that change only by flows: rain in, water out, warmth on, nutrients taken and returned, seed carried. Plants, animals and people all act on the ground through those same numbers, and the ground acts back on them through the same numbers. So the environment never needs an event table. A drought, a famine, a flood after clear-felling, a meadow that stays open because deer graze it, a forest that returns over a ruined village: each is what the flows add up to.

This is rule 1 applied to the land: **nothing in the environment changes because a timer or a count was reached.** It changes because water, warmth, light, nutrients or seed arrived or left.

## What exists today

| Part | Where | What it does | What is missing |
|---|---|---|---|
| Sun and air | `sunHeight()`, `airNow()`, `tempAt()` | Seasons from the sun; trees soften heat and cold; snow cools. | Every year is the same year. |
| Rain | `weather()` | 60% of ticks wet, amount `S.rainY` (fixed at 1). | No wet or dry years, no storms, no memory. Droughts exist only through the god powers. |
| Soil water | `land()` | Rain and melt in, seepage from water (`bank`), evaporation out. Flood when the river is high or soil saturated. | Runoff does not depend on what covers the ground. No ground water to draw down. |
| Nutrients | `fert` | Set at world start; ash adds 0.04. | Harvests never take anything out. Floods leave nothing behind. Fields never wear out. |
| Plants | `grass`, `tree`, `fruit` | Logistic grass under a canopy cap; trees grow and spread to neighbours; fruit from warmth since dormancy. | No scrub stage between meadow and wood, no seed, no standing timber apart from cover. A felled tile and a burnt tile recover the same way. |
| Fire | `burn` | Spreads to dry neighbours, stopped by rain and snow, leaves ash. | Starts only from the god's strike. No fuel build-up, so every forest burns alike. |
| Fish | `fish` | Logistic in water, falls when the river is low. | Fine for now. |
| Animals on the land | `forage()` | Graze grass, browse young trees, eat fruit and fish. | No dung, no trampling, no seed carried. |
| People on the land | `walk()` / `tread`, `choosePlot()`, `farm()`, household firewood (B2) | Paths, cleared lots, fields; trees thin round each hearth first. | Clearing and farming cost the land nothing lasting except the missing trees. |
| Drawing | `view.js` `colorAt()`, props | Grass, flowers, bushes, reeds, snow, flood, fields. | Bushes and reeds are decoration chosen by hash, not state. |

The base is sound: one closure, one loop over tiles, physical constants. The plan keeps that shape and adds a few fields and flows.

## Target: six layers, each a few numbers per tile

### 1. Weather with memory

- **Wet and dry years.** `S.rainY` stops being a constant. It follows a slow swing drawn once from the seed at world creation (a smoothed series, wavelengths of 3 to 15 years), the same way the sun is given. This is the one new thing given from outside and goes under "Planned on purpose".
- **Rain made on the land.** A share of each tick's rain comes from what the land breathed out: `rain = swing * (0.8 + 0.2 * transpiration)`, where transpiration is the mean of `tree * soil` over the map. Clear the woods and the summers get a little drier. Small, slow, real.
- **Storms.** A wet tick on hot air (`S.air > 22`) is a storm: heavier rain and a chance of lightning on a tall, dry tile. This replaces the god's strike as the only natural fire start.
- **Snowpack matters.** A heavy winter's snow melts into a spring flood; a thin one into a dry early summer. Already in `land()`; it becomes visible once years differ.

### 2. Water that moves

- **Runoff depends on cover.** The share of rain that runs off instead of soaking in rises on bare and trodden ground: `runoff share = 0.3 + 0.4 * (1 - cover) + 0.3 * tread`. Forest holds water; paths, fields and yards shed it. The river already answers to runoff, so **clear-felling the catchment makes floods higher and summers lower** without any new flood rule.
- **Ground water.** New field `deep` (0 to 1): slow store under each tile, filled by soaking, emptied into the river and into springs at the banks. Soil draws from it in dry spells (so trees survive a dry month that kills grass). A well draws it down around itself; many wells in one place lower it, and nearby trees and fields feel that first. This gives the well a cost and the want `water` a real source.
- **Springs.** A tile where `deep` stays full on low ground seeps; it becomes marsh (soil above 1.1 for most of the year), which grows reeds, not grass, and breeds midges in summer (people near it are slower to recover from sickness once sickness exists).

### 3. Soil that is spent and fed

`fert` becomes the nutrient stock of a tile, not a fixed trait:

| Out | In |
|---|---|
| Every harvest takes what it carries away (grain from a field, fruit picked, grass grazed down). | Leaves and dead plants return slowly (more under wood). |
| Rain on bare ground washes a little away (erosion), worse on trodden ground. | Ash after fire (exists). |
| | Dung where animals stand and sleep; more in a pen. |
| | Middens: food waste and ash dumped beside a dwelling. |
| | Silt: a flood leaves fertility on the tiles it covered. |

Consequences that need no extra rule:

- **Fields wear out.** After 10 to 20 harvests without return, yields fall. The household feels hunger. It clears a new field (sprawl) or the idea of resting land and spreading dung comes from that want (rows in `IDEAS`: fallow, manure). Manure needs animals, so herding gains a second reason.
- **River banks are the best farmland** because floods feed them, and the worst place to live because floods drown them. People must choose; the choice shows on the map.
- **Old house sites are fertile.** Middens make the ground round a ruin rich; it greens first and draws the next village back.

### 4. Plants that succeed one another

Replace the jump from grass to tree with stages, each a field:

```
bare  →  grass  →  scrub  →  young wood  →  old wood
          ↑ grazing, mowing   ↑ browsing     ↑ felling, fire, flood
          └──────────── all knock it back down ─┘
```

- `scrub` (0 to 1): bushes and brambles. Grows where grass is tall and seed has arrived; shades grass a little; carries berries in late summer (fruit no longer only from trees); browsed by deer; cleared by hand slowly. It is the stage a field left alone becomes within a few years.
- `tree` keeps its meaning as canopy cover. New field `wood`: standing timber, which grows only as long as the canopy stands. A young wood has cover but little timber; an old one has both. Felling takes `wood`; `tree` falls with it. Timber searches in `construct()` look for `wood`, not cover, so people learn to go to the old wood.
- `seed` (0 to 1): how much tree seed lies in a tile. Spread by wind from mature trees to a few tiles downwind, by birds (to any tile near trees and scrub, a long tail), and by deer and rabbits (droppings along where they walk). Without seed, no new trees: a big clearing heals from its edges inward and a lone field in the plain stays open. This replaces `0.006 * nb` in `land()`.
- **Light.** Grass under closed canopy is capped already; add the reverse: seedlings need light, so old woods renew only in gaps (a fallen or felled tree, a burn). That gives woods a patchy, natural look.
- **Reeds** become state: they grow on marsh and shallow banks and are a material (thatch, baskets). The view draws them from the field, not from a hash.
- **Herbs** (later, phase F medicine): a small field on woodland edges, gathered by a healer.

Why this matters for play: a meadow stays a meadow only while something grazes it. Remove the deer and it goes to scrub, then wood, in about 15 to 40 years. Wolves that frighten deer off a valley floor grow a wood there. All of this falls out of existing `forage()` and fear behaviour once scrub exists.

### 5. Fire that depends on fuel

- New field `deadwood`: dead wood and leaves (not `litter`, which `SPECIES` already uses for young per birth), rising slowly under wood and scrub, falling with rot (faster when warm and wet).
- Fire starts from storms (layer 1), from a hearth or a cooking fire when the camp edge is dry and littered (`T.fireT` already marks a hearth in use), and later from deliberate burning.
- Spread chance uses `deadwood` and dryness instead of the present `tree > 0.25 || grass > 0.6`. A wood that has not burned for 50 years burns hot and kills the canopy; one that burns often has light ground fires that kill scrub and leave the big trees.
- **Burning to clear** is an idea from the want `toil` (clearing a field by axe is hard) once fire is known. It is cheaper than axe work and may get away. The village that burns its field edges will one day lose a hut to it.

### 6. Animals and people as forces on the ground

| Who | Takes | Leaves | Changes |
|---|---|---|---|
| Rabbits | Grass, close to the root | Dung, burrows | Keep grass short; too many make bare patches that erode. |
| Deer | Grass, scrub, young trees | Dung, seed | Hold back woods; open glades; carry seed. |
| Wolves | Deer | Carcasses (nutrients) | Move deer away from where they hunt, so plants recover there. |
| People | Wood, fruit, grass via fields, stone | Middens, ash, paths, pits, rubble | Clearings, worn soil, faster runoff, fire. |
| Tame herds (phase F) | Pasture | Dung in pens | Pasture stays open; manure for fields. |

**Trampling.** `walk()` already wears `tread` for people. Animals wear it too, more lightly, so game trails appear between water and grazing; people find them and the first paths often follow them. Tread compacts soil: less soaking, more runoff, less grass.

## How it reacts: worked chains

These are the scenarios to test. Times are expected ranges, to be confirmed by runs.

| Cause | Within a year | Within ten years | Over decades |
|---|---|---|---|
| Fell every tree within 10 tiles | Timber and firewood trips longer (phase B). Grass up. | Spring floods higher, summer river lower; fish fewer in dry summers. Scrub on the clearing's edges. | Wood returns from the edges inward if seed trees survive; never if none do. |
| Farm the same field every year | Nothing. | Yields fall; household hunger; new fields cleared. | Worn fields go to scrub, then wood, then are rich again. |
| A run of dry years | Grass thin, rabbits starve first, deer move. | Fruit poor, river low, wells draw `deep` down; fires larger. | Woods thin at their dry edges; recover when wet years come. |
| Wolves gone | Deer multiply. | Scrub and young trees eaten down; meadows wider; then deer starve back. | Oscillation that settles lower than before. |
| Deer gone | Grass and scrub thicken. | Meadow goes to scrub. | Wood. |
| A village empties | Fields go to grass. | Scrub over lots and fields; middens make that ground richest. | Wood with a rich, open heart; a newcomer settles there first. |
| A big fire | Bare, ash, hot. | Rich grass, rabbits and deer boom, seedlings in the light. | A young wood that will not carry a big fire again for decades. |

## Order of work: phase M

Phase A is done, so M can start now; B1 to B3 are in. It should land **before phase D** retunes the ecology at 128x128, so the retune happens once. Each step follows the definition of done in `docs/PLAN.md` and adds its columns to the standard table.

| Step | Do | Check | Table columns |
|---|---|---|---|
| M1 | **Measure first.** Add to the standard table: mean grass, tree, fert on land; river level min and max of the last 10 years; fires per century. No behaviour change. | Same histories as before. | grass / tree / fert / river range / fires |
| M2 | **Wet and dry years.** Seeded slow swing for `S.rainY`; storms; lightning replaces nothing yet but starts fires. List the swing under "Planned on purpose". | Years differ: river range widens. Existing scenario `drought` still recovers when lifted. Populations dip in dry runs and recover. No land empties more often than baseline on easy land. | rain min/max, storms |
| M3 | **Runoff by cover and tread; ground water `deep`.** Wells draw from `deep`. | Existing scenario `deforest` (tests/scenarios.js): peak river higher within 5 years. Scenario "many wells": `deep` falls around them. | flood ticks |
| M4 | **Nutrients flow.** Harvest, grazing and erosion take `fert`; litter, ash, dung, middens, silt return it. | A field farmed 20 years without return yields at least 30% less. Banks are richest after floods. Total `fert` on land does not drift to 0 or 1 over 200 years without people. | mean field yield y10 vs y90 |
| M5 | **Scrub, seed and standing wood.** `scrub`, `seed`, `wood`; regrowth needs seed; timber taken from `wood`; berries on scrub. View draws bushes from `scrub` and stumps where `wood` was felled. | Scenario "abandon": lots and fields go to scrub within 10 years, wood within 40. New scenario `nodeer`: meadow area falls. A cleared tile with no seed tree in 8 tiles stays open. | scrub, old-wood share |
| M6 | **Fuel and fire.** `deadwood`; fire spread from litter and dryness; hearth sparks; burning to clear as an idea from toil. | Fires per century in a wild run settle (not 0, not every year). A village with burning loses at least one structure to fire in some seeds. | fires, burnt huts |
| M7 | **Animals on the ground.** Dung, animal tread, seed carried. | Game trails visible between water and grazing; animal tread alone never turns a tile into `T.road`. Existing scenario `nowolves`: tree cover near former dens lower than with wolves. | |
| M8 | **Ideas from the land's wants.** `IDEAS` rows: fallow and manure (from hunger on worn fields), clearing by fire (from toil), coppicing (from timber trips long while young wood is near). Each takes effect only through what people do on tiles. | Each idea appears only in runs where its want was felt. | ideas known |

**View work** goes with each step, code-drawn first: stumps, ash and charred ground, scrub density, marsh tint, silt sheen after a flood, worn-field colour from low `fert`. Reeds and bushes switch from hash to state. No sprite generation without asking (budget at $7.48 of $8.00).

## Engineering

- **Cost.** `land()` is one loop over tiles; each new field adds a few multiply-adds. Slow layers (`deep`, `fert`, `seed`, `deadwood`, `wood`) may integrate every 4th tick with `dt * 4`. That is numerical step size, not a gameplay timer, and it keeps 128x128 well under the 30 s per 100 years target in D4.
- **Memory.** Five new `Float32Array(N * N)` fields: 320 KB at 128x128.
- **Save and load.** Every new field must be added to `FIELDS` in `sim.js`, or save and load silently drop it. Add a test that every typed array the world allocates is in `FIELDS`.
- **Determinism.** Seed spread and lightning call `rnd()`. Expect every history to change at M2 and M5; compare distributions over seeds, not one history.
- **Long lines.** A6 broke lines up to under 200 characters; keep it so. Never a `//` mid-line.
- **God powers.** Keep each a physical act: `rain`, `sun`, `grow` and `strike` work unchanged on the new fields. Add `seed(x, y, r)` (scatter seed) and `dry(years)` for scenarios.

## What to tune, in order

1. Runoff shares (cover, tread). Too strong and every clearing floods the valley.
2. Nutrient removal per harvest against return from dung and litter. Too strong and farming collapses before manure can be invented.
3. Seed spread distance. Too short and forests never return; too long and nothing stays open.
4. Scrub growth against grazing. Too fast and the whole map becomes thicket.
5. Deadwood build-up and rot. Too fast and the map burns every summer.
6. Amplitude of the wet and dry swing. Too strong and the village empties in the first dry decade.

## Failure modes to watch

- The whole map turns to forest or to bare ground over 200 years with no people (run a wild world with `species` but no humans as a test).
- A single drought empties easy land. Lower the swing before touching yields.
- Fertility drifts to a wall (0 or 1) everywhere.
- Fire every year, or never.
- The view drawing scrub so thickly that people and paths disappear.

## Planned on purpose (to add to `docs/ARCHITECTURE.md` when built)

- The slow swing of wet and dry years, drawn once from the seed. Like the sun, it is given from outside.
- The physical constants of each flow (growth, rot, runoff shares, seed distances). These are tuning numbers, like an animal's metabolism.
