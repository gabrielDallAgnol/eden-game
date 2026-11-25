# Eden: how it is built and how it grows

This is the technical plan for taking Eden from a camp of a few dozen people to a city, without rewriting it each time. It records decisions, not wishes: each section says what exists today, what the target is, and what has to change.

## Two rules

1. **Causes decide what, where and when.** Nothing happens because a timer, a head count or a settlement level was reached. A thing is made because a want was felt (cold, hunger, danger, toil, loss) and the means were at hand. In code: wants are measured where they occur and stored in `need`; `IDEAS` and `townLife` read them.
2. **Fixed forms decide how it sits on the ground.** So that a place looks good and not random, geometry is constrained: land is taken in lots on a lattice (`PITCH` tiles apart), ways run between lots, a building has a footprint, a door and a fixed set of construction stages. Wants choose the lot; the lattice chooses the shape.

Anything that must stay a planned rule is listed in "Planned on purpose" at the end, so it is never mistaken for emergent behaviour.

## Where it stands (2026-11)

| Part | File | State |
|---|---|---|
| World: weather, soil, plants, fire, flood | `src/sim.js` `land()`, `weather()` | Solid. One closure per world. |
| Animals: rows of traits, one behaviour | `SPECIES`, `animal()` | Solid. A new animal is a new row. |
| People: named, kin, couples, crafts, looks | `soul()`, `society()`, `person()` | Individuals exist, but act as one camp. |
| Settlement: one `S.tribe` with one store, one set of wants | `T.*` everywhere | The main limit. See below. |
| Building: `DWELL` tiers, stages, materials, lots | `choosePlot()`, `construct()` | Works for dwellings, a well and a fence only. |
| Ideas and trades from wants | `IDEAS`, `reckonYear()`, `townLife()` | Ideas are global switches; trades are job labels with multipliers. |
| View | `src/view.js` | Reads state and invents the walking. One full-map ground bitmap. |
| Art | `src/art.js`, `src/sprites.js`, `art/` | Code-drawn and generated sprites, recoloured per person. |

### The main limit

Everything hangs off one point (`T.x, T.y`), one shared `T.store` and one shared `T.need`. A person has a house, a partner and children, but no larder, no field and nothing of their own. That is why towns stay small and why barter, wealth, rent, flats and markets cannot exist yet: there is nobody to own, owe or want anything.

## Target model

Plain data, no classes, so the whole world can be saved as JSON.

```
World       { land fields, agents[], settlements[], rng state, t }
Settlement  { id, origin (lattice anchor), lots{}, buildings[], households[], ways (tread, road), wants (derived), ideas known }
Household   { id, members[], lot, larder{food, wood, ...}, fields[], wants{cold, hunger, ...}, wealth }
Person      { id, name, kin, household, craft skills, job, bonds{id: warmth}, carrying, position }
Lot         { x, y, owner household, building, value }
Building    { id, type, lot, stage, materials on site, workers[], stock{} }
```

Registries are data rows, like `SPECIES` today. A new thing is a new row plus, if needed, a sprite:

- `BUILDINGS`: footprint in lots, stages with materials, capacity (people or goods), what work happens there, which idea makes it possible.
- `GOODS`: food kinds, timber, stone, tools, cloth, later coin. Each has weight, how it spoils, what makes it.
- `IDEAS`: the want that prompts it, how much of it, the means, and what it enables. An idea enables; only a standing, staffed building has an effect.
- `JOBS`: the building a job is done in and the skill it uses.

## Roadmap

Each step is useful on its own and unlocks the next. "Check" is how to know it worked.

### 1. Households are real (built 2026-11-22)
- Food, firewood and tools are carried to the household's lot and kept in its larder. The common store becomes what is left over (later: the granary).
- Cold and hunger are felt per household. `need` for the settlement is the sum of what households feel.
- Fields are cleared, sown and reaped by the household beside its lot. `farm()`'s population formula goes.
- People sleep, eat and warm themselves at home (started: nights and shelter already use the house).
- **Check:** a hungry household can stand next to a full one; evening lights spread down the street; removing a family's field makes that family go short, not the village.

### 2. Buildings do the work
- Granary, storehouse, smithy, workshop, pen, bridge become `BUILDINGS` rows that take a lot, materials and labour.
- Pottery, granary, tools, masonry and medicine stop being global multipliers. Their effect applies to goods that pass through the building and to the households that use it.
- Carts are built from timber in a workshop and stand somewhere.
- **Check:** burning the granary brings spoilage back; killing the smith stops new tools.

### 3. One truth about where people are
- People move cell by cell along the ways in the simulation; the view only smooths it. `route()` moves from the view into the sim, with made roads cheaper.
- Hunts, wolf attacks and meetings happen where the player sees them.
- **Check:** a person shown by the river is at the river in the state.

### 4. Friends, rivals, exchange
- `bond` grows between any two people who worked, ate or mourned together, and falls after a refused share, a rival suitor or a taken plot. Bonds pull plot choice and who helps whom build.
- A household with more than it needs and a neighbour in want: giving first (kin and friends), then barter, with the rate set by how badly each wants what the other has.
- The want "too much to keep track of" rises with the number of open debts, not households. Writing answers it.
- **Check:** two households that never deal with each other; a family moving to the far end of the street after a quarrel.

### 5. Coin, prices and wages
- When barter fails often enough for want of a matching good, the good most often accepted (grain, then metal) becomes the measure. That is coin.
- Each settlement has a price per good that moves with what is offered and wanted. Jobs are taken for what they pay, replacing `townLife`'s shares.
- **Check:** a bad harvest raises the price of grain and pulls hands into farming the next year.

### 6. Land, rent and density
- A lot has an owner and a value: what households have paid or would pay to be there (near the square, the well, the market, off the flood line).
- When the value of a lot exceeds the cost of building on it again, the owner builds for others: a second roof on the lot, then an upper storey, then flats. Capacity per lot rises; the household pays rent.
- Those priced out build at the edge. That is the suburb, and the reason the settlement spreads.
- **Check:** the centre grows taller while the edge grows wider; rents fall when a new district opens.

### 7. More than one place
- `S.tribe` becomes `settlements[]`. A household with no affordable lot in reach founds or joins another place. Ways between places carry trade.
- Rival places are the cause of walls in stone, a keep, a castle: the want is "danger from people", which does not exist until there is someone else.
- **Check:** a second hamlet across the river with carts going between.

### 8. Later ages
- Each age is the same mechanism with new rows: a want (fuel running short, more goods than hands, too many people for the water), a means, a building. Mills, mines, factories, rail, power, modern flats and offices are rows in `BUILDINGS`, `GOODS` and `IDEAS`, not new systems.

## Engineering that makes this possible

| Need | Decision |
|---|---|
| Bigger world | Map size becomes a parameter (64, 96, 128). The ground is painted in chunks (16x16 tiles) and only dirty chunks are repainted, instead of one bitmap for the whole map. |
| Hundreds, then thousands of people | Per-step indexes (people, by household, by lot); no `filter` over all agents inside per-person code. Started: `folk()` is cached. Distant settlements tick at a lower rate. |
| Long games | Built (A5): `W.save()` / `Eden.load()`; the world is plain data plus the RNG state; typed arrays are stored base64. Autosave to `localStorage` once a game year. |
| Changing it safely | `src/sim.js` is split into ES modules (`world`, `animals`, `people`, `households`, `building`, `ideas`, `economy`), loaded natively with no build step. Long lines are broken up as each part moves. |
| Knowing it still works | A `tests.html` page that runs fixed-seed worlds for N years and checks invariants (nobody in water, no dwelling on a way, food conserved, no settlement extinct on easy land). It runs in the browser, so it does not depend on Node (the Node on the dev machine is broken; `brew reinstall node` fixes it and would allow the same file to run in CI). |
| Art for many buildings | Every `BUILDINGS` row names a sprite and a tint. New buildings start as a recolour of an existing sprite or are drawn in code (`art.js`), and get a generated sprite only when the building has proved worth keeping. |
| Resetting a settlement | Built (A3): one `newSettlement()` constructor used for the first camp and for resettling, so new fields cannot be forgotten in a hand-written reset. |

## Related notes

- `docs/PLAN.md`: the ordered implementation plan (phases A to L), with steps, checks and traps. Start there when building.
- `docs/LAND-AND-DENSITY.md`: how sprawl, upper storeys, flats, quarries, prices and rent come from land being finite and distance costing time. This is the design for roadmap step 6.
- `docs/WORLD-GROWTH.md`: a 128x128 world that becomes known as people have reason to go further, and the chunked ground drawing it needs.
- `docs/ENVIRONMENT.md`: how the land grows and reacts: wet and dry years, runoff and ground water, soil that is spent and fed, plant succession with seed, fire from fuel, animals and people as forces on the ground. Phase M.
- `docs/AGES.md`: what drove each historical age and which buildings to draw for it.

## Planned on purpose

These are rules, not outcomes, and are meant to stay that way:

- The lattice: lots `PITCH` tiles apart, ways between them, one building footprint per lot until density (step 6).
- Construction stages and what each building costs.
- How much of a want an idea takes (`IDEAS[k].at`). These are tuning numbers, like an animal's metabolism.
- The fence is a rectangle round the outermost lots.
- Where a camp is made (the first one, and again after a valley has emptied): a fixed score of water close by, fruiting trees, fertility and the size of the bank that can be walked without wading.
- How people search for food: places nearer the door are looked at more often (distance drawn from an exponential with mean `WALK` tiles). The choice among them is by value and walking cost.
- Walking across open ground costs 1.5 times a way. Water cannot be crossed except on a bridge, and a bridge can only span a narrow place (up to 4 tiles of water). These are physical tuning numbers.
- People build only when fed (energy above 0.6): a tuning threshold on a want, like `IDEAS[k].at`.
- The shape of each kind of country (D4/H1): the noise wavelengths (48, 16, 6 tiles), the valley's trough, the plains' low relief, the lakeland's basins, the highland's plateaus with steep edges, the valley's rocky knolls; how much must drain through a tile for a stream (`riverA`) and how deep a hollow holds a lake (`lake`); the tree line (level 7).
- The guaranteed pass (H1): where a cliff cuts a piece of dry land in two, the lowest crossing is cut down to a bank, until every piece can be walked by banks of one level.
- The ages of a life (owner's choice, 2026-11-22): grown at 8, may pair off at 10, small children by the fire until 4. A day's felling takes 0.3 of a stand.
- Unseen land is drawn like the rest (owner's choice): the view's fade is switched off; the simulation still records `known`.
- The map is 96 tiles a side in the game (`?size=` changes it); tests also run at 40 and 128.
- A stranger arrives when a grown person has only kin to choose from. To be replaced by step 7 (people moving between places).
- A wolves' den is not dug within 12 tiles of the camp or 8 of a household (the fire's smell and noise, as a fixed distance). Market stalls are not drawn until there is trade.
- Food: a sown tile gives `FIELD_YIELD` (7.8 per unit of growth), and households sow half the tiles they did (owner's request that a person grows more than they eat). A floor must be 10% cheaper than a free lot to be chosen. A council needs someone with four friends.
- Wild animals: the timid big ones keep away from a radius of 10 tiles (plus 2 per square root of the buildings) round the fire, (the wild are no longer kept off sown fields by a rule: since 2026-11-25 they graze the crop, and people chase them off, kill them or fence their fields).
- Animals: a wolf goes for a person only below 0.25 energy; no burrow within 8 tiles of the fire or 3 of a building; cattle crop to 0.1. A hunting party may take a wild calf it comes within two tiles of (30% a step). Lean-season hunting needs farming known, fields resting, a ration a head put by and meat under 5% of food.
- Lean years (2026-11-23): the common store is rationed (a meal from it fills to 0.6) when it is lower than at the same time last year and holds less than 2.2 per person (about a year's eating). A household sows at most 6 tiles per working hand plus 3 per farmer, and looks for field lots up to 4 lots from its door. A household that went short and finds less than half the ground it wants leaves (2026-11-25; before, only one with no ground at all). These are tuning numbers on felt causes: the store seen emptying, hunger remembered from the last year.
- Two clocks (owner's request, 2026-11-25): a tick is the same stretch of a life as before (24 ticks make a year of growing up, eating and working), but the sun goes round more slowly. At midsummer it moves `yearK` times slower (3 in the game), in deep winter `winterK` times (1: winter keeps its old length), and in between by the height of the sun. A turn of the seasons is 48 ticks instead of 24, and a child grows up in about 4 years shown instead of 8. Winter was kept short on purpose: when it stretched as well, the first camps starved or were taken by starving wolves in every land.
- In a long summer the fields are sown again after a full harvest while the sun stands high (above 0.62) and the ground is above 8 degrees.
- Building work (2026-11-25): once a stage's materials are on the plot, putting it up takes `STAGE_WORK` (1) steps of a middling builder's work, plus a quarter for each log and a third for each stone in the stage. The builder stands beside the plot while doing it; a builder who has begun goes back to it the next step.
- Family size (2026-11-25): the first people think six children a family (`FIRST_NORM`); a child takes its mother's norm moved 20% toward 2 (3 where the place farms: children are hands) plus 8 times the share of the place's children who died young (memory fading 15% a year). The norm stays between 1.5 and 9. A couple wants the mother's norm, plus their dead children (up to 3), plus one while their fields want hands. See `docs/HEALTH.md`.
- Wolves and people (2026-11-25, owner's direction): with sticks and stones a wolf is stronger than a person. A hungry wolf (below 0.6) goes for a child or a lone person, and for a band only below 0.3. Three grown people together stand and fight (two once the place knows wolves, `T.lore` 0.5). In a fight the wolf dies with chance 0.2 a person (up to 0.85) and, while it lives, kills one of them with chance 0.35 (half that once wolves are known). Fewer than that back away and shout, and the grown within hearing come. Kin hunt a wolf that killed one of theirs for 0.3 of a year. Lore grows from every meeting (0.01 to 0.1). These are tuning numbers on felt causes. Weapons are not built yet; they would raise the people's odds.
- Animals in groups (2026-11-25): herds start six together, packs four round a den, rabbits five; a den holds a pack of up to seven (`PACK_MAX`), and a grown young wolf of a bigger pack goes off to dig a den off every other pack's ground (14 tiles). Young of herds and packs follow their mother until grown; a fed wolf turns back from another pack's ground.
- Crops (2026-11-25): grazers eat a standing crop like any grass. A household that has seen 3 food's worth eaten from its fields (`RAID_FENCE`, half forgotten each sowing) puts stakes round them.
- Wood (2026-11-25): a full stand of trees on a tile is 4 timber (`WOOD_PER_STAND`), however it is felled. A woodcutter fells half as fast again and an axe a third, but get no more out of a tree. One person carries home 2 timber a trip, 4 with a cart. A timber split for the hearth is 4 days' fires (`FUEL_PER_WOOD`). Before this, skill and tools multiplied the wood in a tree, and clearing a plot gave three to six times what a timber trip gave for the same tree, so piles of over a thousand timber built up.
- Fields (2026-11-25): a field lot is taken only where all nine tiles are dry (before, up to three could be water and were sown round). Ditches run beside fields, never through them, and nothing is sown on a ditch.
- Bridges over a bend (2026-11-25): a narrow place (up to 4 tiles of water) between two banks of the same ground is a place a bridge can go, as one between two separate pieces of land always was. A lot is judged by the walk to it round the water, not the straight line. Each year every household whose walk from the fire goes round the water (more than 1.5 times the open-ground walk plus 4 tiles) feels the want of a crossing at the narrow place that would cut it to under 0.6 of the walk, weighted by the people in it and the tiles saved; trips that go round add to it. The bridge idea and the bridge itself come from that want as before.
- Grazers' young (2026-11-25): a wild beast's time between litters runs on the season clock, not the life clock, so a long summer is not extra breeding seasons. A grazing mother bears young only where the grass on her ground (a square 3.9 x sqrt(mass) tiles out: rabbit 3, deer 8, cattle 10) is at least `CROWD` (1) times the grazing need of the mouths already there plus her litter (mass x metabolism each).
- Snares (2026-11-25): each morning a household with someone aged 8 to 60 not starving takes each wild small beast (under 1 mass, not a meat-eater) within `SNARE_R` (12) tiles of its door with chance `SNARE_P` (0.05). Meat to its larder.
