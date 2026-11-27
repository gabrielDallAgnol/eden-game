# Eden: implementation plan

Written 2026-11-22 for whoever builds the next stages. It is meant to be enough on its own: read this, then `docs/ARCHITECTURE.md` (rules and target model), then the three design notes it points to. The owner will review results, not steps, so each phase ends with things that can be checked.

## 0. What you are working on

Eden is an isometric pixel-art settlement sim that runs in the browser. Plain JavaScript, classic scripts, no build step, no dependencies.

| File | Lines | What it is |
|---|---|---|
| `src/sim.js` | 970 | The whole simulation, one closure per world inside `create(seed, opt)`. No drawing. |
| `src/view.js` | 844 | Isometric renderer, animation plans, camera, tools, Town panel. Reads state only. |
| `src/art.js` | 587 | Built-in pixel sprites and code-drawn props. |
| `src/sprites.js` | 136 | Swaps in generated sprites from `assets/sprites/` and recolours people. |
| `tests.html`, `tests/invariants.js` | 411 | Fixed-seed worlds checked against 18 invariants, in the browser. |
| `art/` | | Sprite pipeline (Retro Diffusion API, cleanup, export to `assets/sprites/`). |
| `legacy/eden.html` | | The original single file. Do not edit. |

### The two rules (non-negotiable)

1. **Causes decide what, where and when.** Nothing may happen because a timer, a head count or a settlement level was reached. A thing is made because a want was actually felt by someone (cold, hunger, danger, toil, loss) and the means were at hand. The owner has rejected threshold-driven designs twice.
2. **Fixed forms decide how it sits on the ground.** Lots on a lattice (`PITCH` = 4), ways between lots, building footprints, construction stages. This is what keeps towns from looking random. The owner asked for this explicitly.

If a rule you add is a plan rather than an outcome, list it under "Planned on purpose" in `docs/ARCHITECTURE.md` and say so in your report.

### What exists today in the simulation

- **World:** `weather()`, `land()` (soil, snow, flood, fire, plants), five land types in `LANDS`.
- **Creatures:** `SPECIES` rows, one `animal()` behaviour, `hunt()`, `forage()`, fear, herds, sound (`sound()`, `hear()`).
- **People:** `soul()` (name, sex, skills, looks), `society()` (couples, kin, housing, sharing), `person()` (eat, shelter, hunt, gather, build), `describe()`.
- **Households:** a dwelling site with `members`, `larder`, `fields`, `cold`, `hunger`. Helpers `homeSite()`, `bring()`, `allFood()`, tile `owner` for fields.
- **Building:** `DWELL` (tent, hut, house, well), `choosePlot()` on the lot lattice, `plotFor()`, `construct()`, `planWall()` (stake fence).
- **Ways:** `tread` worn by `walk()`, `onWay()`, `T.road`.
- **Wants and ideas:** `T.need`, `IDEAS`, `reckonYear()`; trades in `townLife()`; fields in `farm()`.
- **One settlement:** everything hangs off `S.tribe` (called `T`), with one origin `T.x, T.y`.

### Known limits

- Towns reach 12 to 42 people at year 100 on a 40x40 map, peaking around 30 to 60.
- People are moved in one jump by the simulation; the view invents the walking.
- Ideas are global switches; only dwellings, a well and a fence are real buildings.
- No friends, rivals, exchange, money, rent, second settlement, save or load.

## Progress (updated as steps land)

| Phase | State |
|---|---|
| A | Done: A1 to A6. A7 (ES modules) not done: optional, and it would break `tools/build_single.py` and the `new Function` loaders the tests and docs use. |
| B | Done: B1 to B8, plus a water step the owner asked for (fords, bridges from wading toil, fishing from the bank). B7's check (a pond in a 100-year lakeland run) is not met: stone demand is too low to work pits out. |
| C | Done: C1, C2 and C3 (one commit). Ground memory 27.7 MB at 40x40. |
| D | Done: D1 to D5 (D4 with height H1; game map 96 tiles). D5: all three animal kinds alive at year 100 in 7 of 10 standard worlds (8 of 10 at 128, 1 of 10 at the old 40). Also done on the owner's request: no crossing without a bridge, timber only from chopping, faster speeds (up to 48x). Next: E. |
| E | E1 done (routes). E2 done: gathering, fishing, felling, firewood and quarrying are real trips (pace 20 tiles a step, home before dark); hunting moves 3 tiles a step toward the game. E3, E4 done: the view walks each creature along the tiles the simulation moved it through and keeps its work within 1.4 tiles of its state position. |
| F | F1 done (BUILDINGS registry; DWELL derived from it). F2 done (GOODS; larders and the store hold food by kind, each spoiling at its own rate). F3 done (storehouse and granary built when food rots; only a standing one keeps the common store). F4 done (kiln, smithy, workshop; tools, pots and carts are made, held and worn). F5 done (pen; a herder feeds tame beasts hay at the pen; the old feeding rules are gone). F6 done (jobs are places; workshop trades taken up where the work is short; Town panel lists places of work). F7 done (mason's yard, healer's house, lime kiln, tally house, ditches; every idea names the thing it works through). Phase F complete. |
| G | G1 done (ties beyond kin from doing things together; friends help build, settle near, sit together, are named). G2 done (grievances from suitors, refused shares and blamed deaths; rivals build apart; a quarrel can move a household). G3 done (gifts to kin, then friends; debts kept, repaid, forgiven). G4 done (barter between neighbours by want; a varied larder goes further). G5 done (reckoning grows with open debts; a scribe at the tally house keeps the marks). Phase G complete. |
| H | H1 done (coin: the most-traded food becomes payment where trade is busy and failing). H2 done (seasonal prices from want against holdings; barter at price ratios). H3 done (food work weighed by expected earnings; households sow more when grain is dear; builders paid). H4 done (a market at the fire once there is coin; trades are made there, on real trips). Phase H complete. |
| I | I1 done (one cost for every option: free lot or an upper floor on one's own or kin's house; floors drawn as a taller house). I2's height caps (2 / 4 / 6 by means) are in; a second ground roof on a lot is not possible on the lattice. I3 done in part (rented floors above strangers' houses, rent weighed yearly and paid); its check (rents fall when a street or bridge opens) is not shown in these worlds. I4 in part (work trips weighed; tradespeople may build shop-homes on the market lots); its check is not met: few households hold a trade late in a run. I5 done (a lot in line with a standing house shares a wall: rows before floors); terraces are not drawn joined. |
| J | J2 begun (2026-11-23): the landless leave the valley after a lean year (no ground to sow near the door, or a couple with no roof who went short), so famines no longer kill hundreds at once. They leave the map for now; founding a hamlet on it needs J1 (`S.settlements[]`). |
| Owner's requests 2026-11-25 | Done: two clocks (a longer summer, lives at the old pace, `yearK` 3 in the game). Done: buildings rise only under builders standing at the plot, a stage over about two steps. Done: animals live in herds and packs with their own ground, young keep to their mothers; grazers eat unfenced crops, people chase or kill them and fence their fields; wolves take the weak, three people can kill a wolf at a cost, and what is learned of wolves changes the odds. Done: family size learned from the mother and from children seen dying (`docs/HEALTH.md`), which is where sickness will plug in. Designed, not built: a town centre from causes (`docs/TOWN-CENTRE.md`, steps N1 to N6); sickness and cures. |
| Owner's requests 2026-11-27 | Done: the game stops at the Wood Age (`age: 'wood'`, a planned cap). Done: a ledger in the Town panel and `W.ledger()` (people, homes, buildings, food by kind, goods, beasts, land, faith). Done: grass drawn with tufts and soft patches, water with clean depth bands, a ripple line and strokes of light. Measured and planned, not built: knowledge that comes from doing (`docs/PERIODS.md`). Done: light runs down the rivers toward where they leave the land and the wind passes through the grass in bands (`drawFlow`). Not done: weapons; the art still drawn in code. |
| The hand (2026-11-27) | Done: the Rain, Sun, Grow and Strike buttons are gone; the hand lifts and sets down anything (people, beasts, piles, trees, stone, fire, water, buildings). Stone on stone makes fire; fire takes timber buildings. Those near see it. Next: signs of want over heads; what people make of what they saw (faith); faces; the first question. Not done: the old powers' drawing code is still in `src/view.js`, unreachable. |
| Growth and speed (2026-11-27) | Done: timber reaches building sites (own reach, not burned as kindling, a bridge where timber stands round a bend), so the small worlds grow. Done: fever from fouled, crowded ground; deaths at birth; fewer childbearing years (`docs/HEALTH.md`). Done: a sign over each person for what they want most. Done: the picture is drawn less finely when frames come slowly. Done: what people make of the hand (belief, trust, fear; told at home; in the ledger and in each person's description). Done: the first question (who is there; a name kept and told), offerings left out, the opening card rewritten for the hand. Done: later questions (flood, fever, vanishing trees) with the answer kept as counsel; people differ in height, build and beard, inherited; the game starts with a band of eight; the view glides to the one who asks. Not done: built answers to sickness (latrines, a second well); building toward the hand; faces drawn feature by feature; whether counsel turned out well is not yet remembered. |
| The wide country, herbs (2026-11-28) | Done: `wide` land at 192 tiles (lowland to mountains), far beasts in coarse steps, scenery only where seen. Done: four herbs by place; their uses found, held, taught and lost by people (`docs/HEALTH.md`). Not done: ground drawn with true height; more plants than four. |
| Several bands (2026-11-28) | Done (J1 by another road): `S.tribes`, each band taking its turn as `S.tribe`; 1 to 4 bands chosen on the opening card; leavers found a new fire on a wide map (J2); bands meet, marry across, exchange food, copy each other's ways and herbs, begrudge, raid and pay back (J3, J4 in outline). Not done: carts and roads between places; walls from raids are only what the old `danger` want already gives; the player can watch only the first band's panel; wanting to be rich. |
| Wealth, faces (2026-11-28) | Done: holding tight (inherited, raised by a hungry childhood) changes sharing; curiosity changes who finds herbs; a step a band at a time; the panel and news follow the band in view; a face for each person from inherited features; the tightest house in each band carries what is exchanged between peoples and keeps a tenth. Next, in the order that would matter most: the `IDEAS` as knowledge held by people (see `docs/PERIODS.md`); ground drawn with true height; clay, flint and ore as places; made roads and carts between bands; the square. |

## 1. How to work on it

### Running and looking

- Serve the folder: `python3 serve.py` (sends no-cache headers, port 8765). Plain `python3 -m http.server` lets the browser cache `src/*.js`, which silently tests old code.
- Game: `http://localhost:8765/index.html?seed=7&land=forest`. Tests: `http://localhost:8765/tests.html`.
- Node.js on the owner's machine is broken (`brew reinstall node` would fix it; ask before running it). Do not rely on Node.

### Test pages (phase A)

- `/tests.html`: invariants over fixed-seed worlds plus unit checks (save/load identity, resettle, water). Must show 0 failed.
- `/scenarios.html`: named situations with expectations; soft ones that fail are warnings meant for later phases.
- `/table.html`: the standard 100-year table for `docs/RUNS.md`.

### Running the simulation without watching it

In the page console (or a browser tool's JavaScript call):

```js
// a fresh copy of the sim from disk, independent of the page's own
const load = async f => { const t = await (await fetch(f + '?' + Date.now(), { cache: 'no-store' })).text(); const w = {}; new Function('window', 'globalThis', t)(w, w); return w.Eden; };
const E = await load('src/sim.js');
const W = E.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley' });
for (let i = 0; i < 24 * 100; i++) W.tick();      // 24 ticks = 1 year
W.S.pop, W.S.tribe.sites, W.S.log.slice(-10)
```

To compare against the last commit: `git show HEAD:src/sim.js > .base_sim.js`, load both, run the same seeds, delete the file afterwards.

To exercise the view's planning code without frames: `for (...) { EdenGame.W.tick(); EdenGame.sync(); }`. The browser pane throttles animation when hidden, so this is the reliable way to catch view errors. To see a late state, run ticks, then `for (const h of EdenGame.huts) if (h) h.p = h.target;`, wait a few seconds, screenshot.

### Traps that have already cost time

- **Long lines.** `sim.js` and `view.js` have about ten lines each over 400 characters with several statements. Never add a `//` comment in the middle of one: it comments out the rest of the line and the failure appears far away. Put comments on their own line or use `/* */`.
- **One random stream.** All sim randomness is `rnd()`. Adding or removing a call shifts every later event for that seed. This is fine, but compare distributions over several seeds, not one history.
- **`S.pop` is one tick stale** after `tick()`; the tests allow for it.
- **Resettling** uses `newSettlement()` (phase A3). A field you add to the settlement goes in that constructor, with a default that is not `undefined` (save files compare by key order).
- **Save and load** (A5): any new closure-level state in `create()` (a `let` outside `S`) must be added to `save()`/`restore()`, or a loaded game will drift from an unbroken one. The unit check in `tests.html` catches this.
- **A stale console error** (`Identifier 'act' has already been declared`) can linger in a browser console from an earlier broken load. Check `typeof EdenGame` before believing it.

### Definition of done, for every step

1. `tests.html` shows 0 failed. New behaviour has at least one new check.
2. The standard table is run and pasted into `docs/RUNS.md`: 5 lands x seeds 1 and 2, 100 years, with population at years 25, 50, 100, peak, dwellings, hunger deaths, and whatever the step is about. Compare with the previous table and explain any large change.
3. The game loads with no console errors and you have looked at a still of the thing you built.
4. One commit per step, pushed to `main`. Update `docs/ARCHITECTURE.md` when a roadmap step lands or a planned rule is added or removed.
5. Report to the owner in plain language: what changed, what was checked, what is not done. Say plainly when something is still a planned rule.

### Money

The owner set a hard cap of $8.00 on Retro Diffusion sprite generation; $7.48 is spent (`art/out/cost_log.json`). Do not generate sprites without asking first and showing the cost. Prefer recolours and code-drawn art (`art.js` has `tentSprite`, `wellSprite`, `fenceSprite`, `onStilts` as models). `docs/AGES.md` lists which sprites each age needs and which can be recolours.

Free third-party art may be used when its license allows (CC0, or CC-BY with credit on the opening card) and it is listed in `art/third_party/CREDITS.md`. Bring it into Eden's look by gradient-mapping onto Eden's own ramps (`gradientMap` in `src/sprites.js`) rather than using its colours; one drawing then gives every season. Rocks, bushes and tall grass come from Yar's CC-BY 3.0 tileset this way.

## 2. Order of work

```
A  Safety net          ─┐
B  Distance and land   ─┼─ can start in any order after A
C  Chunked ground      ─┘      (C is view-only, good to run alongside B)
D  A world that grows          needs C
E  One truth about position    needs B
F  Buildings do the work       needs B; much better after E
G  Friends, rivals, exchange   needs F
H  Coin, prices, wages         needs G
I  Land value, rent, density   needs B, F, H
J  More than one settlement    needs D, E
K  Ages and their buildings    rows added from F onward; landmarks need I and J
L  Seeing and hearing it       any time after A
M  The living ground           after A; land before D's ecology retune
```

Phases A to D are the foundation the owner asked for. Phase M (the environment) is planned in `docs/ENVIRONMENT.md`. Do not start G or later before F is solid.

---

## Phase A. Safety net

**Goal:** make large changes safe before making them.

| Step | Do | Check |
|---|---|---|
| A1 | `serve.py`: static server with `Cache-Control: no-store`. Update README. | Editing `sim.js` and reloading always runs the new code. |
| A2 | Fix the two flagged defects: `free()` can return a water tile after 60 tries (search outward in rings until land is found); `raised()` crashes on a site kind missing from `DWELL` (guard and report). | New test: no creature ever on water over 100 years on lakeland. |
| A3 | `newSettlement(x, y)` builds the tribe object; used at world start and when resettling. Remove the hand-written reset. | Test: after a forced wipe-out and resettle, every tribe field equals a fresh one's defaults. |
| A4 | Scenario tests in `tests/scenarios.js`, each a short named run with an expectation: "held at 30 people" (cull births), "deforest within 10 tiles", "permanent drought", "wolves removed", "no stone". These become the acceptance tests for later phases. Add helper hooks in `G` (the god powers) rather than poking state. | Each scenario runs and reports; expectations can start as warnings. |
| A5 | Save and load: `W.save()` returns JSON (seed, size, RNG state `rs`, `S`, typed arrays as base64, `tread`, `owner`); `Eden.load(json)` restores. Autosave to `localStorage` every game year; a "Continue" button on the opening card. Agents reference species rows by name on save and are re-linked on load. | Test: run 20 years, save, load, run 20 more; identical end state to an unbroken 40-year run. |
| A6 | Break up lines over 200 characters in `sim.js` and `view.js`. Formatting only. | Determinism: every seed in the test set ends with the same log hash as before the change. |
| A7 | Optional but recommended before F: split `sim.js` into native ES modules (`world`, `creatures`, `people`, `households`, `building`, `ideas`, `settlement`), each exporting `install(ctx)` that adds its functions to one shared context object. `create()` builds `ctx` and calls each. No behaviour change. | Same determinism check as A6. |

**Trap:** A6 and A7 must not be mixed with behaviour changes in the same commit, or the determinism check proves nothing.

---

## Phase B. Distance and land

**Design note:** `docs/LAND-AND-DENSITY.md`, sections "Walking cost", "Land use", "Stone". Read it first; the formulas and constants are there.

**Goal:** land is finite with competing uses, and distance from your own door costs working time. This is the mechanism behind sprawl, density and scarcity. Nothing here needs money.

**Cause chain:** far from the fields, water or timber → less of the day left for work → less food and fuel → hunger and cold felt by that household → it moves closer, or later shares a lot.

| Step | Do | Check |
|---|---|---|
| B1 | **Work from your own door.** In `person()`, forage candidates are sampled around the household's door (the camp centre for the unhoused); efficiency is `1 / (1 + d / (6 * v))` with `d` the distance along the ways (`snapWay`), `v` = 1, 1.5 on `T.road`, 2 with a cart. Remove the fixed `range`. Apply the same factor to timber and stone trips in `construct()` and drop the fixed search radii there. | Table: mean door-to-work distance per household is under 8 tiles; populations do not collapse. Scenario "held at 30" unchanged. |
| B2 | **Firewood is a household trip.** Each household with fire known fetches wood for its own hearth; no wood in reach means that household is colder. Trees thin around houses first. | Scenario "deforest within 10 tiles": that village's `need.cold` rises within 2 years. |
| B3 | **Eat at home.** People eat only from their own larder or, when at the fire, the common store. Carrying food home is part of the trip cost. | Hungry-next-to-full households still occur; no mass starvation at the edge. |
| B4 | **Lots have owners.** `owner` covers lot tiles as well as fields. A household may build or sow only on common land, its own or its kin's. Remove the `crops * 0.4` penalty in `choosePlot()`; ownership does that job. | Test: no field tile is owned by one household and built on by another. |
| B5 | **Stone leaves pits.** New `pit` array (0 to 1). Each quarry trip lowers `rock` and deepens `pit` on that tile; choose the tile minimising trips x walking factor / (1 - 0.5 * pit). Pits cannot be lots or fields. View: draw pits (code-drawn, darker stepped ground). | Mean pit distance grows with houses built. No lot or field on a pit. |
| B6 | **Rubble.** Rebuilding and floods leave about 70% of stone and 30% of timber on the site. | Rebuilds after a flood take fewer quarry trips than first builds. |
| B7 | **Exhausted pits.** On wet ground a deep pit fills and becomes water with slow fish; elsewhere it is a dump that slowly becomes buildable poor ground. | At least one pit becomes a pond in a 100-year lakeland run. |
| B8 | **Trip counting.** Each household counts last year's trips by destination kind (fields, forage, water, store, timber, stone, kin). Nothing uses it yet; phase I needs it. | Counts are plausible and sum to the household's work days. |

**Traps:** B1 changes the food balance more than anything else in this plan. Tune only the constant 6 and road speed, in that order, and re-run the table after each change. If populations fall by more than a third, the walking factor is too harsh; do not compensate by raising yields.

**Out of scope:** more than one dwelling per lot (phase I).

---

## Phase C. Chunked ground (view only)

**Design note:** `docs/WORLD-GROWTH.md`, "View".

**Goal:** the ground no longer lives in one map-sized bitmap, so the map can grow. No visible change at 40x40.

| Step | Do | Check |
|---|---|---|
| C1 | Replace `gcv`/`img`/`px32` with 16x16-tile chunk canvases and one shared `ImageData`. `colorAt()` keeps world pixel coordinates. `paintSome()` paints stale chunks that intersect the view, about one per frame. `repaintCells()` maps its rectangle to chunks. Keep the crossfade with a small canvas pool. | Screenshots before and after at the same seed and tick look the same. No seams at chunk edges, including during a crossfade and under the rain and sun tools. |
| C2 | Replace the map-sized blur buffers (`BN = N * 8`) with chunk-sized scratch buffers filled per chunk; replace `noise`/`noise2` with a 512x512 repeating tile. | Memory for ground is under 40 MB at 40x40. |
| C3 | Skip repainting a chunk whose quantised sum of grass, snow, soil, tree and road is unchanged. | A quiet winter repaints almost nothing. |

**Trap:** `colorAt()` has many special cases (cliff edge, fields, paths, roads, snow, flood). Keep its logic identical and change only where pixels are written.

---

## Phase D. A world that grows

**Design note:** `docs/WORLD-GROWTH.md`.

**Goal:** a 128x128 world of which only the seen part is shown, and people who go further when they have a reason and the means.

**Cause chain:** forage too thin while hungry, or no timber, stone or free lot found in reach → that person's reach grows → they see more land → the known world grows. Reach shrinks again when they are supplied. The limit is physical: out and back before night, stretched by carts, tame animals and made roads.

| Step | Do | Check |
|---|---|---|
| D1 | Remove the quadratic creature loops (pack filter in `hunt()`, the adults filter in `person()`, the territory count at birth) and the per-tick full-map loops (well watering, harvest) by using `cells` and a list of field tiles. | 100-year run time per world drops; histories change, so re-baseline. |
| D2 | `known` mask in the sim, written only by where creatures of the settlement stand (sight shorter under trees). View: `colorAt()` fades toward mist with a blurred `known`; chunks with nothing known get no canvas; props and animals fade; camera limits follow the known area. Still 40x40. | Early game shows a small lit area that grows. `known` never depends on the camera. |
| D3 | `a.reach` per person replaces the fixed forage radius; it rises on an empty search while the want is felt and falls when supplied, capped by daylight and means. Same for timber, stone and lot searches. | Scenario "held at 30": reach stays small. A growing village's known area grows. |
| D4 | Map size becomes `opt.size`. **Height comes in the same commit (step H1 of M9, owner approved 2026-11-22, design in `docs/ENVIRONMENT.md` "Height: design for M9"):** a `height` field from noise with fixed wavelengths, lakes filled to their spill point and rivers where enough land drains, so water follows the land instead of fractions of `N`; the view stays flat but is tinted by height. Animal starting numbers scale with area. Newcomers arrive at the edge of the known land. Default 96, then 128. | Tests pass at 40, 96 and 128. A 100-year run at 128 takes under 30 s. |
| D5 | Retune the ecology at the new density if needed (only animal start numbers and the wander-in rule). | Deer, rabbits and wolves all present at year 100 in most seeds. |

**Trap:** D4 changes every seed's world. Do it in one commit and re-baseline everything.

---

## Phase E. One truth about where people are

**Goal:** the simulation moves people along the ways; the view only smooths it.

**Cause chain:** unchanged behaviour, but hunts, attacks and meetings now happen where the player sees them, and time spent walking is real.

| Step | Do | Check |
|---|---|---|
| E1 | Move `route()` from the view into the sim: a path over tiles avoiding water and closed fences, with made roads cheaper. | Unit check: path exists between any two land tiles in the same land mass. |
| E2 | A person has a task with a destination and carries a load. Each tick they advance along the path at their speed; work happens on arrival. `walk()` wear comes from actual steps. Phase B's walking factor is replaced by the real time taken. | Table: populations within 15% of the end of phase B. |
| E3 | The view's `planPerson()` animates from the sim's previous to next position and task, instead of inventing trips. Remove `Plan.go`'s own street routing. | A person drawn by the river is at the river in the state. Scenario: wolves kill only people whose state position is near the wolf. |
| E4 | Animals already move tile by tile; make their view plans follow state the same way. | No creature is drawn more than 1.5 tiles from its state position. |

**Trap:** this is the largest change to `person()`. Keep the decision logic (what to do) and replace only how it is carried out. Do E2 for one activity first (gathering), compare, then the rest.

---

## Phase F. Buildings do the work

**Goal:** an idea makes a building possible; only a standing, staffed building has an effect. Technologies stop being global switches.

**Cause chain:** want felt → idea → someone takes a lot and builds → someone works there → goods pass through → the households that use it are better off.

**Data:** a `BUILDINGS` registry replacing `DWELL`:

```
kind: { lots, stages:[{wood, stone, ...}], roof, room, work, makes, needsIdea, sprite, tint }
```

| Step | Do | Check |
|---|---|---|
| F1 | `BUILDINGS` rows for tent, hut, house, well, fence. `construct()`, `choosePlot()`, `raised()`, `live()` read the registry. No behaviour change. | Determinism unchanged. |
| F2 | `GOODS`: food kinds (grain, meat, fish, fruit) with their own spoilage, plus timber, stone, firewood, tools. Larders hold goods by kind. | Meat and fish spoil faster than grain; diets vary by household. |
| F3 | **Storehouse and granary.** Built when a household's or the village's food is actually rotting and the idea is known. Food kept there spoils more slowly; spoilage multipliers for `pottery` and `granary` are removed from the global formula. Burning or flooding it brings spoilage back. | Scenario: destroy the granary; spoilage rises the same year. |
| F4 | **Kiln, smithy, workshop.** Pots, tools and carts are goods made by a person working in the building from clay, ore (found while quarrying) and timber. A household without tools works at the old rate. Carts cost timber and stand somewhere. | Scenario: remove the smith; no new tools; work rates decay as tools wear out. |
| F5 | **Pen** for tame animals (reuses the fence sprite); a herder works there. Removes the rule that a herder sets the deer's energy. | Tame deer survive winters only with a pen and a herder. |
| F6 | **Jobs are places.** A trade is working in a building or on land (`JOBS` row names it). `townLife()`'s shares are replaced by people taking the work that is short. | The Town panel lists buildings with who works there. |
| F7 | Masonry, medicine, irrigation, concrete become buildings or works too (mason's yard, healer's house with herb garden, ditches as tiles, lime kiln). | No idea in `IDEAS` has an effect without a built thing. Add a test that asserts this. |

**Art:** code-drawn or recoloured first (see `docs/AGES.md`). Ask before generating.

---

## Phase G. Friends, rivals, exchange

**Goal:** people have ties beyond kin, and goods move between households for reasons.

| Step | Do | Check |
|---|---|---|
| G1 | `bond` between any two people rises when they hunted, hauled, built, ate or mourned together, and fades slowly. Friends sit together in the evening, help build each other's houses, and pull plot choice like kin. | Describe a person: names their friends. |
| G2 | Negative bond from felt events: a refused share, two suitors for one person, a plot or field taken, a death blamed. Rivals avoid each other and build apart. | A household moving to the far end of the street after a quarrel appears in the log. |
| G3 | **Giving.** A household with more than it needs gives to kin and friends in want, and remembers it (a debt in both directions). | Debts exist in state; kin are helped before strangers. |
| G4 | **Barter.** A household in want of one good and holding spare of another offers a trade to a neighbour; the rate is how badly each wants what the other has. Failed trades are counted. | Fishers' and farmers' households exchange fish for grain. |
| G5 | The want `reckon` ("too much to keep track of") rises with open debts, not household count. Writing answers it and needs a scribe's place. | Writing appears only in villages with many open debts. |

---

## Phase H. Coin, prices, wages

**Goal:** exchange gets a measure, and work is taken for what it pays.

**Cause chain:** barter often fails for want of a matching good → the good most often accepted becomes the measure (grain, then metal once a smithy exists) → prices exist → work is chosen by what it earns.

| Step | Do | Check |
|---|---|---|
| H1 | Count failed barters; when frequent, households start accepting the most-traded good as payment. That good is coin. | Coin appears only where trade is busy. |
| H2 | Each settlement keeps a price per good that moves with offers and wants each season. | A bad harvest raises the price of grain. |
| H3 | Work is paid: a builder, smith or carter earns from the household that wants the work. People choose work by expected earnings and their skill. | After a bad harvest more hands farm the next year. |
| H4 | A market place: the lots round the first fire stay open; stalls are code-drawn. Trade happens there, which makes it a destination. | Trips to the market show up in phase B's trip counts. |

---

## Phase I. Land value, rent, density

**Design note:** `docs/LAND-AND-DENSITY.md`, "Where to put a roof" and "Prices and rent".

**Goal:** taller and denser buildings appear at the centre when, and only when, land there is scarce enough to be worth it.

**Cause chain:** many people whose work is in the centre → free lots only far out → walking from a far lot costs more than building upward → a second roof on a lot, then storeys, then flats. People priced out build at the edge.

| Step | Do | Check |
|---|---|---|
| I1 | `units` per lot. `choosePlot()` compares one cost for every option (free lot, second roof on kin's lot, upper storey): build work over 10 years plus yearly work lost to walking from that door, using the household's own trip counts. | Scenario "held at 30 for 100 years": no lot has more than one dwelling. |
| I2 | Storeys are capped by means: timber 2, masonry 4, concrete more. Drawn by stacking the house sprite's wall band in code. | No tall building in a village without masonry. |
| I3 | Rent: a lot's owner may build for others when what a household would pay (cost of its next best option minus this one) over 10 years exceeds the build cost. The tenant pays yearly in coin or goods. | Rents fall the year a new street or bridge opens. |
| I4 | Shop below, home above on the market lots. | Tradespeople's doors are nearer the centre than farmers'. |
| I5 | Rows: dwellings on neighbouring lots with a shared way join into terraces before anyone builds upward. | Centre lots show rows, then height. |

**Checks for the whole phase:** population rising to 400: dwellings per lot fall with distance from the centre; the edge is one storey. A lone tower in a field never occurs.

---

## Phase J. More than one settlement

**Goal:** places, not a place.

**Cause chain:** a household with no affordable lot in reach, or a group of friends at odds with the rest → they found a hamlet where land is free → ways between places carry trade → rivalry and raids → stone walls, a keep.

| Step | Do | Check |
|---|---|---|
| J1 | `S.tribe` becomes `S.settlements[]`; every use of `T` takes the settlement of the person or site concerned. Each has its own origin and lattice. | One-settlement worlds behave as before. |
| J2 | Founding: an unhoused household with no lot it can afford settles at the best free ground within its reach. Replaces the rule that a stranger arrives when someone lacks a partner; partners now come from other places. | A second hamlet appears in large-population runs. |
| J3 | Ways and trade between places; carts carry goods where prices differ. | Prices in two linked places converge. |
| J4 | Conflict from felt causes (raided stores in a famine, a boundary field taken). Danger from people is a new want; it leads to walls in stone, a gate, a keep. | Stone walls appear only where there has been a raid. |

---

## Phase K. Ages and their buildings

**Design note:** `docs/AGES.md`.

Each age is the same mechanism with new rows in `BUILDINGS`, `GOODS`, `IDEAS`: a want, a means, a building. Add rows as the phases above create the wants that call for them:

- After F: granary, kiln, smithy, pen (Neolithic and Bronze).
- After H: temple-storehouse, market stalls, fountain (Bronze and Classical).
- After I: shop-house, jettied townhouse, terrace, apartment block.
- After J: stone wall and gate, keep or castle, church, mill.
- Later: brick terrace, warehouse, mill with chimney, station, tower.

Rules from the research: never restyle an old building (its lot keeps it until a need rebuilds it); one tall landmark per age on a square; ordinary houses from recolours.

---

## Phase L. Seeing and hearing it

Can be done at any time after A; each item is small.

- **Household inspector:** tapping a house shows who lives there, the larder, fields, what they are short of.
- **Overlays:** toggles for ownership, wear on the ways, known land, sound.
- **Sound:** visible rings for loud sounds; optional audio.
- **The Town panel:** buildings and who works there; prices once they exist.
- **Graves** that kin visit; friends sitting together.
- **Speed and time:** a clear year and season display.

---

## Phase M. The living ground

**Design note:** `docs/ENVIRONMENT.md`. Steps M1 to M8 (the core: weather, water, soil, succession, fire, animals on the ground) and M9 to M18 (height, wind, mast years, hedges, new creatures, health, seasons, the land remembering), with checks and tuning order. M9 (height) is a decision for the owner and goes with D4.

**Goal:** the land grows, wears out, burns and heals from flows of water, warmth, nutrients and seed, and reacts to people and animals through the same numbers.

**Cause chain (example):** fields farmed year after year → nutrients carried away in the harvest → yields fall → that household feels hunger → it clears new ground, or the idea of fallow and manure comes from that want.

**Trap:** M2 and M5 add `rnd()` calls and change every history. Re-baseline the table in the same commit.

## 3. Tuning method

1. Change one constant at a time.
2. Run 5 lands x seeds 1 to 4 for 100 years. Look at the spread, not one seed.
3. Prefer fixing the cause (yields, distances, costs) over adding a rule.
4. The numbers that matter most, in order: the 6 in the walking factor; road speed; field yield per tile; spoilage; how much want an idea takes (`IDEAS[k].at`); tree regrowth.
5. Failure modes to look for after every change: extinction on easy land; a village that never builds; everyone starving at the edge; oscillating populations; a single dominant household holding all the food.

## 4. What the owner cares about

- People who feel alive: family, friends, work, protection, things happening to named people.
- A place that grows from a tent to a real, good-looking town and, in time, a city with flats, because people needed it.
- Causes, not thresholds. Structure where it makes the place look good.
- Honest reports: what was checked, what was not, what is still a planned rule.
