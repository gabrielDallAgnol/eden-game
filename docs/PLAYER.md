# The player: goal, powers and the matrix of causes

Design note, 2026-11-23. **Not built.** A proposal from a conversation with the owner about what the player is for. Every effect in the tables below is read from the rules in `src/sim.js` (`IDEAS`, `G`) or proposed; none is measured yet. "What to measure first" at the end says how to check it.

## The problem

The town runs itself, so the player speeds time up and watches. A test (9 worlds, 100 years, 64-tile map) of a god who warms the camp every winter step and greens it every summer step gave lower mean populations than no god at all (year 100: 249 with no god; 66, 146 and 179 with sun, grow and both). Nine worlds is too few to say help harms, but it shows no benefit. The present powers are not a role.

## The game in one sentence

**Bring a people from a tent to a chosen advancement, by choosing which hardships to spare them and which to let them learn from.**

- The goal is an advancement (today the far end of the tree is concrete; later ones are listed below).
- The score is the years it took and the dead it cost. Speed costs lives, because hardship is what teaches.
- Each land makes a different path the best one.

## Three laws

1. **One trigger for each advancement.** A want felt enough, with the means at hand. This is already how `IDEAS` works and it is rule 1 of the game.
2. **The god gives only what the people already make.** No stone from the sky before someone has quarried; no paper before someone writes. So each advancement unlocks the matching power, and the player's powers grow alongside the people.
3. **Every power feeds one want and starves another.** Food ends hunger, and hunger is what teaches sowing. There is no power that only helps.

Law 2 is a planned rule on the player's side (it gates powers, not anything the people do). If built, it goes under "Planned on purpose" in `docs/ARCHITECTURE.md`.

## Matrix 1: advancements, their trigger, and what they unlock

Built today (from `IDEAS`). The "unlocks" column is proposed.

| Advancement | The one trigger (want) | Means that must be at hand | Unlocks for the player | That power is the lever for |
|---|---|---|---|---|
| (start) | | | Hand (carry a pile), Strike, light Rain | Everything early |
| Fire | Cold | Nothing | **Warmth** on a spot | Surviving winters; delays hut and house |
| Hut | Cold | A tent built | **Give timber** | Faster building; delays cart and tools |
| House | Cold | A hut built | **Frost**: a hard winter (trial) | Masonry |
| Farming | Hunger | A hut | **Give grain**, **Grow** | Pottery, granary, writing; delays plough |
| A tamed animal (an event, not an idea) | | | **Drive a herd** toward the camp | Plough, cart, cheese |
| Plough | Hunger | Farming, a tame beast | **Drought** (trial) | Well, irrigation |
| Pottery | Food rotting | Fire | **Give clay** | Kiln work, granary |
| Granary | Food rotting | Farming, pottery, a hut | **Plenty**: a bumper harvest | Writing |
| Cheese | Milk rotting | Enough milking | none (small) | |
| Well | Water carried far | A hut | **Spring**: raise ground water at a spot | Irrigation; new places to settle |
| Irrigation | Water | Farming, a well | **Heavy rain** (trial: high river, flood) | Bridge, concrete, later water power |
| Cart | Hard labour | A tame beast | **Smooth a way** | Reach, trade |
| Tools | Hard labour | Fire, worked stone | **Give stone**, **Open the ground** (show ore) | Masonry, later mines and metal |
| Masonry | Cold | Tools, a house | **Give cut stone** | Tall houses, concrete |
| Palisade | Wolves in camp | Huts | **Call or hold the wolves** | Danger, later walls |
| Rites | Deaths | Fire | **Call strangers** (more people) | Council, writing, a second settlement |
| Medicine | Deaths | A skilled gatherer | **Heal** one person | Keeping a key person alive |
| Writing | Too much to keep track of | More food than people | **A sign**: mark a place they will go and look at | Bridges, founding, ore |
| Council | Quarrels | Someone widely trusted | **Speak to the speaker**: one request a year | Shared works |
| Bridge | River in the way | Huts | **Low water** | The far bank |
| Concrete | Floods | Masonry, fire | **Hold the river**: a place a dam can stand | Water power |

Not built (rows to add; wants taken from `docs/AGES.md`):

| Advancement | Trigger (want) | Means | Player power that supplies the means or the trial | Unlocks |
|---|---|---|---|---|
| Water mill | Grinding by hand (toil at the quern) | Carpentry, a steady river | Heavy rain keeps the river up | **Wind** |
| Windmill | Grinding by hand, no river in reach | Carpentry, wind | Wind | **Give flour** |
| Mine | Tools wearing out, surface ore gone | Tools, ore shown | Open the ground | **Give metal** |
| Paper | Marks outgrow clay and bark (reckoning, again) | Writing, reeds or rags, a mill | Give reeds; plenty | **Give paper** |
| Coal and steam | Fuel short: forests cut back far from town | Mines, metal | Open the ground (coal seam); hold back tree growth | **Give coal** |
| Water power (hydroelectric) | Fuel short and dark; work far from fuel | Concrete (a dam), a strong river | Heavy rain; hold the river | **Light** |
| Wind power | Fuel short, no river | Metal, wind | Wind | |

## Matrix 2: what each power does to each want

`+` the want is felt more (ideas that need it come sooner), `-` felt less (they come later), blank no direct effect. Predicted from the rules, not measured.

| Power | Kind | Cold | Hunger | Rot | Water | Toil | Danger | Deaths | Reckoning | Quarrels | River | Flood |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Warmth | gift | - | | | | | | - | | | | |
| Give timber | gift | - | | | | - | | | | | | |
| Give grain / Plenty | gift | | - | + | | | | - | + | | | |
| Grow | gift | | - | + | | | | | | | | |
| Give stone / cut stone | gift | | | | | - | | | | | | |
| Spring | gift | | - | | - | | | | | | | |
| Drive a herd | gift | | - | + | | | + (wolves follow) | | | | | |
| Call strangers | gift | | + | | + | | | + | + | + | | |
| Heal | gift | | | | | | | - | | | | |
| Low water | gift | | | | + | | | | | | - | - |
| Frost | trial | + | + | | | + (firewood) | | + | | | | |
| Drought | trial | | + | | + | | | + | | | - | - |
| Heavy rain | trial | | | + | - | | | | | | + | + |
| Call the wolves | trial | | | | | | + | + | | | | |
| Strike | either | | | | | - (logs, loose stone) | | + | | | | |
| Open the ground | means | | | | | | | | | | | |
| A sign | means | | | | | | | | | | | |

Reading it: to reach **writing** you want reckoning up, so give grain and call strangers, and accept that hunger falls and the plough comes late. To reach **concrete** you need cold (house, masonry), toil (tools) and then floods, so timber and stone gifts early work against you.

## What keeps the choices hard

- **Power is scarce.** Proposed: each use spends from a small store that refills slowly, and refills faster while a shrine is kept (rites). Open: whether trials cost anything.
- **The cost is shown.** The Town panel shows each want as a bar with the idea it is leading to, so the player sees a gift push a bar down.
- **Pleas point at the moment.** A household in want with no means shows it over its door, and the game slows itself for it.

## What to measure first (before building anything)

1. **Baseline:** 10 worlds, 100 years, no player: the year each advancement arrives, and how often concrete arrives at all. This is the par a player must beat.
2. **Do gifts move the timing as Matrix 2 predicts?** Same worlds with a yearly gift of grain, of timber, and of 4 strangers.
3. **Can every land finish?** Which advancements never arrive on which land (no river means no flood, so no concrete).

If gifts shift arrival years by less than the seed-to-seed spread, the matrix needs stronger levers before any power is built.

## Open decisions for the owner

- The goal: a fixed end (concrete today), or chosen per run?
- Score: years, dead, or both?
- Do the weather powers (Rain, Sun, Grow) stay from the start, or are they earned as above?
- The length of the year and the two-clock idea (seasons long, lives short) is separate and comes after this is proven.
