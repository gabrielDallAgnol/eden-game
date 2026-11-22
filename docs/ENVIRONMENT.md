# The living ground: how the environment grows and reacts

Design note, 2026-11-22. Not yet built. Layers 1 to 6 are the core; layers 7 to 12 (added the same day) are more life and beauty on top. It plans phase M in `docs/PLAN.md`. Function names are given, not line numbers.

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

## More life and more beauty: layers 7 to 12

Added 2026-11-22 at the owner's request: everything that makes the world more interesting to watch and better to look at, under the same two rules. Each idea says what causes it, what it makes happen, and what the player sees.

### 7. Lie of the land: height and slope

Today the map is flat; water sits where world creation put it. A `height` field (from seeded noise at fixed wavelengths, the same pass that D4 needs for water) changes most things at once:

- **Water runs downhill.** Rivers are found by flowing from high ground to the edge, not placed at `N * 0.62`. Lakes fill hollows. Runoff (layer 2) collects into the lowest tiles first, so floods come down valleys.
- **Erosion and silt.** Rain on bare slopes carries `fert` down to the valley floor and the banks. A cleared hillside gets poorer and the bottom land richer.
- **Frost hollows and warm slopes.** Cold air settles in low ground on still nights (lower `tempAt` in hollows); slopes facing the sun warm sooner. Fruit trees do best on slopes, first snow lies longest in hollows.
- **Terraces.** Farming a slope loses soil; the want shows as falling yields, and terracing is the idea that answers it. Terraces are a fixed form (rule 2): steps along the contour, code-drawn.
- **Later:** the fall of a river is what a watermill needs.
- **Seen:** the isometric view gets real relief: raised tiles, cliffs inside the map (the map edge already draws a cliff), shading by slope. This is the biggest visual win in the whole note and the biggest change to `view.js`.

**Decision for the owner:** height touches world creation, `colorAt()`, props and routing. It is best done together with D4 (water from noise, map size), in one commit that re-baselines every seed.

### 8. Wind

- One wind for the map: a direction and a strength that drift slowly (given from outside, like the sun; a planned rule), stronger in storms and in winter.
- **Fire** spreads faster downwind and hardly upwind. A village downwind of a dry wood is in danger; one upwind is safe. People who lost huts to fire build upwind of woods next time, because the loss is felt (rule 1).
- **Seed** (layer 4) drifts downwind, so woods creep in the wind's direction.
- **Smoke** from hearths and fires leans with the wind (view). **Sound** carries further downwind, so wolves smell and hear the camp from one side.
- **Shelter:** a wood or a hedge upwind of a house makes it warmer in winter wind, so the cold felt by that household is less. People who feel the wind keep, plant or grow shelter.
- **Later:** windmills on exposed high ground.
- **Seen:** grass and crops ripple, smoke leans, snow drifts against the lee side of houses and hedges, leaves blow off in autumn gales.

### 9. Mast years and the cascade

- Oaks, beech and hazel (a kind tag on `tree` tiles, from noise at world creation) set a heavy crop of nuts when spring was warm and had no late frost, the same warmth count `warmSum` already keeps for fruit. Trees that cropped heavily rest the next year (their stored strength is spent: a per-tile reserve, not a timer).
- **Cascade:** a mast autumn feeds deer, boar and rabbits through winter → more young in spring → wolves breed better the year after → deer fall the year after that. People gather nuts and store them; a mast year fills larders and a lean one empties them.
- **Seen:** the ground under oaks brown with acorns, squirrels, deer gathered in the woods in autumn, a log line ("The oaks dropped a heavy crop this year").

### 10. Living edges: hedges, coppice, old marks on the land

- **Hedges grow on their own.** Under a fence line nothing grazes, so once scrub exists (M5) a hedge grows there in a few years. Field edges and lot boundaries become green lines with no extra rule. Hedges give shelter (layer 8), berries, nesting birds and a barrier to deer.
- **Coppice.** A woodcutter who cuts young wood near home instead of walking to the old wood (the idea comes from long timber trips) leaves stools that regrow fast. A coppiced wood looks like rows of bushy stumps in rotation.
- **The land remembers.** Old ploughed fields keep ridges that show in low sun for decades; ruined houses leave mounds and nettles (rich middens); graves stay as mounds; tracks no longer used fade slowly. The view reads these from state (`fert`, an old-use field, `tread` history), so a player can read the history of a valley from its ground.
- **Seen:** green field boundaries, rows of coppice, humps and ridges under grass.

### 11. More creatures that shape the land

Each is a row in `SPECIES` plus, where needed, one behaviour, like the three animals today.

| Creature | Lives by | Changes | Brings to people |
|---|---|---|---|
| **Beaver** | Young trees by streams | Fells bank trees and dams narrow water: a pond and a marsh grow behind the dam; fish and reeds follow; a dam can flood a field. | Ponds and marsh made for them; pelts; a dammed ford. |
| **Boar** | Roots, nuts, crops | Roots up ground (bare patches that grow back rich); raids fields at night. | Want for fences and hunting; meat in mast years. |
| **Birds** (as state, not decoration) | Seed, fruit, insects | Carry tree seed far (layer 4); flocks raid ripe crops; return in spring when the days lengthen and leave when they shorten, like `lateLight`. | Want to guard fields (scarecrows, children sent out); eggs; the first sign of spring. |
| **Rats and mice** | Middens and stores | Eat stored food; breed where food is lying about. | Real spoilage cause for the granary (F3) and for keeping a cat or dog. |
| **Bees** | Flowers | More fruit where they are (pollination); live in old hollow trees. | Honey and wax gathered from wild hives, later hives kept. |
| **Geese, ducks, herons** | Water and marsh | Graze banks, fish the shallows. | Fowling; feathers; life on the water. |

### 12. The land and people's health, and the seasons that draw people

**Health** (ties into medicine and the healer's house in F7):

- **Foul water.** Middens, latrines, tanneries and pens near water raise a `foul` value on water tiles, carried downstream by the river. People drinking foul water fall sick; sickness is felt as the want `loss` and, once enough is lost, as a want for clean water. Answers: a well away from the river, a latrine downhill, the tannery downstream. Settlements arrange themselves along the river by this.
- **Marsh fever.** Marsh (layer 2) breeds biting flies in warm months; those living near it sicken more. People drain it (an idea) or build away from it, so the driest ground fills first.

**Seasons that draw people:**

- **Fish run.** When the spring river rises and the water warms, fish crowd into the shallows and fords for a few weeks. People who notice it gather at the river: a seasonal camp, drying racks, a feast. Caused by water and warmth, not a date.
- **Frozen river.** When water stays below about -3 long enough, the ice holds: fords and rivers become walkable in `wayDist`, for people and for wolves. Winter visits across the river and wolves at the gate both follow. Builds on the fords and bridges already in the code.
- **Rut and calving.** Deer gather and are bold in autumn (easy to hunt, dangerous to meet); in spring, calves hide in long grass and gatherers find them.
- **Autumn gathering.** Nuts, mushrooms after warm rain in old woods, berries on scrub: a short rich season that sends whole households into the woods.

### Seeing it (view only, any time)

- **Props from state.** Bushes from `scrub`, reeds from marsh, flowers from meadow, stumps where wood was felled, rocks from `rock`. Nothing important drawn from a random hash.
- **Atmosphere.** Morning fog in low ground on still cold mornings; mist over water; heat shimmer on dry summer days; puddles after rain; frost on roofs; rainbows after a storm with sun; long shadows in low sun.
- **Seasons in colour.** Autumn colour by tree kind (oak brown, birch yellow, maple red) driven by the cold, not a date; spring green coming in from the warm slopes; flowers in waves (spring white and yellow, summer pink and red).
- **Small life from the simulation.** Fish jump where `fish` is high; butterflies where flowers are; birds over fields at harvest and over water; frogs calling at marsh on spring nights (sound).
- **Overlays** (phase L): fertility, ground water, wind, foul water, known land.
- **A nature log.** Short lines for things worth noticing: the first geese back, the river frozen hard enough to walk, a heavy mast, a fire on the hill, the beavers' new pond.

### How the new layers react: more worked chains

| Cause | Within a year | Within ten years | Over decades |
|---|---|---|---|
| Hillside cleared for fields | Grass up, timber trips shorter. | Yields fall on the slope, rise on the valley floor; floods muddier. | Terraces, or the slope goes back to scrub. |
| Village built downwind of a dry wood | Nothing. | A summer fire reaches the huts in some seeds. | Next houses built upwind or with a cleared gap. |
| Warm spring, no late frost | Mast autumn; full larders. | Deer and boar boom, then wolves, then deer fall. | Repeats with the weather, never on a schedule. |
| Fence left standing | Nothing. | Hedge along it; birds nest; deer kept out. | A patchwork of hedged fields. |
| Midden by the river | Rats. | Foul water downstream; sickness; a well dug away from the river. | Tanneries and pens moved downstream. |
| Beavers move into a stream | A few bank trees felled. | Pond and marsh; more fish and reeds; a field drowned. | A wetland that outlives the beavers. |
| A hard winter | River freezes; people cross; wolves cross. | — | — |

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

### Phase M, second part: life and beauty (M9 to M18)

After M1 to M8. Order by value and risk; M9 is a decision, not a step.

| Step | Do | Check | Table columns |
|---|---|---|---|
| M9 | **Decide on height** with the owner. If yes, do it with D4 in one commit: `height`, rivers and lakes by flow, frost hollows, erosion downhill, relief drawn in the view. | Rivers reach the edge; no water uphill; tests pass at 40, 96, 128. Screenshot before and after. | mean slope farmed |
| M10 | **Wind.** Direction and strength; fire, seed, smoke, sound and shelter use it. List under "Planned on purpose". | Fire spreads mostly downwind across seeds. Houses with a wood upwind feel less cold. | fires downwind share |
| M11 | **Tree kinds and mast.** Kind per tree tile; nut crop from spring warmth and a per-tile reserve; nuts eaten by deer, boar, people. | Mast years vary with weather; deer peak follows a mast; wolves a year later. | mast years |
| M12 | **Hedges and coppice.** Scrub under fence lines (falls out of M5; check it); coppicing as an idea from long timber trips. | Hedges along every fence older than 10 years in most seeds. | hedge tiles |
| M13 | **Boar and birds** as `SPECIES` rows; birds carry seed and raid crops; migration by day length. | Crop losses to birds in some years; boar rooting visible. | boar, birds |
| M14 | **Beavers.** Dams on narrow water make ponds and marsh. | At least one pond made by beavers in most lakeland and valley runs. | beaver ponds |
| M15 | **Rats, foul water, sickness.** Middens and stores feed rats; `foul` on water carried downstream; sickness from foul water and marsh. | Sickness higher downstream of middens; a well away from the river follows in some seeds. | sick, foul |
| M16 | **Seasons that draw people.** Fish run; frozen river walkable in `wayDist`; rut; autumn gathering. | People at the river in fish-run weeks; crossings on ice in hard winters only. | ice crossings |
| M17 | **Bees and fowl.** Pollination raises fruit near hives; honey; waterfowl on marsh. | Fruit higher near hollow-tree hives. | |
| M18 | **The land remembers.** Old-use field for ridges, mounds, faded tracks; drawn in low sun. | A 200-year run shows old field ridges where fields were abandoned. | |

**View work for this part,** code-drawn and recoloured first: relief and slope shading, leaning smoke, rippling grass, snow drifts, autumn colour by kind, fog and mist, puddles, hedges, coppice stools, beaver dams, boar rooting, flocks, nature log lines. Generated sprites only for the new animals (boar, beaver, birds) and only after asking, with the cost shown; the sprite budget has $0.52 left, so likely recolours and code-drawn animals.


## Engineering

- **Cost.** `land()` is one loop over tiles; each new field adds a few multiply-adds. Slow layers (`deep`, `fert`, `seed`, `deadwood`, `wood`) may integrate every 4th tick with `dt * 4`. That is numerical step size, not a gameplay timer, and it keeps 128x128 well under the 30 s per 100 years target in D4.
- **Memory.** Five new `Float32Array(N * N)` fields for M1 to M8: 320 KB at 128x128. The second part adds about six more (`height`, tree kind, nut reserve, `foul`, old use, hedge age): under 1 MB in all.
- **Animals.** Four new species multiply creature cost; phase D1's removal of the quadratic loops must come first.
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
7. Wind strength on fire spread. Too strong and every fire crosses the map.
8. Erosion on slopes (with height). Too strong and the hills go bare in a century.
9. Sickness from foul water. Too strong and every riverside village dies; it should steer where people live, not empty places.

## Failure modes to watch

- The whole map turns to forest or to bare ground over 200 years with no people (run a wild world with `species` but no humans as a test).
- A single drought empties easy land. Lower the swing before touching yields.
- Fertility drifts to a wall (0 or 1) everywhere.
- Fire every year, or never.
- The view drawing scrub so thickly that people and paths disappear.
- Fog, smoke and weather effects hiding the town. Keep them light and short.
- New species wiping one another out (boar eating all nuts, beavers drowning every stream). Each needs a check across seeds like deer and wolves have.

## Planned on purpose (to add to `docs/ARCHITECTURE.md` when built)

- The slow swing of wet and dry years, drawn once from the seed. Like the sun, it is given from outside.
- The slow drift of the wind's direction and strength. Given from outside, like the sun.
- Tree kinds and the height map, drawn from the seed at world creation, like the rock and water are today.
- The physical constants of each flow (growth, rot, runoff shares, seed distances). These are tuning numbers, like an animal's metabolism.
