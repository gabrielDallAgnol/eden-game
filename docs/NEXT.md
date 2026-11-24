# Eden: what to build next (propositions)

Written 2026-11-24, after "Lean years". It proposes the next steps, with the measurements behind them, for the owner to choose from. Nothing here is built. Steps keep the form of `docs/PLAN.md`: do, check, trap.

## What was measured

One large world (plains, seed 2, 96 tiles, 100 years) was run under a profiler, outside the browser. The other numbers are from the last table in `docs/RUNS.md`.

| Finding | Number |
|---|---|
| People who leave the map | 807 per run on average, equal to the mean population at year 100 |
| When they leave (plains 2) | 0 before year 60, 7 by year 70, 1,017 by year 100. Leaving starts at about 700 people |
| Who holds a trade at year 100 (plains 2, 1,378 people) | 361 farmers, 224 fishers, 67 gatherers, 23 hunters, 60 builders, and one each of smith, potter, healer, scribe, mason, woodcutter, mayor. 7 specialists among 742 with work |
| Time for that world | 190 s under the profiler. Years 1 to 50 take 12 s; years 81 to 100 take 113 s |
| Where the time goes | Finding routes 23%; walking distances from a door 12%; the yearly household pass (`society()`) 21%; yearly ties and quarrels 6% |
| Lots passed over because someone else held them | 12,283 in that world |

Two causes found in the code:

- **One worker per place.** `placeJobs()` gives each smithy, kiln, workshop and so on exactly one pair of hands ("one pair of hands to a place"), and only one of each kind is ever needed, so a town of 1,400 has the same seven specialists as a village of 60. It is also gated on the village's average food per head (`T.plenty`), which is a village-wide number, not a want felt by anyone.
- **Whole-map searches per door.** `walkField()` runs a search over the whole map for each starting tile and throws away all 256 remembered results when the 257th is asked for. `society()` filters every person for every household.

**Not explained:** this run ended at 1,378 people; the table in `docs/RUNS.md` has 1,578 for the same world. The run here was in Node on Linux, the table in a browser. It may be the engine's arithmetic or a difference in the table's commit. Proposition 0 settles it.

## The propositions

### 0. One history on every machine (small, first)

**Why:** if the same seed gives different histories in two engines, the table cannot be checked by anyone but the machine that made it, and the tests cannot run unattended.

| Step | Do | Check |
|---|---|---|
| P0.1 | Run the standard table here in a headless browser and in Node, and compare the log hash per world with the owner's last table. Find the first tick at which they part. | Either the same hashes, or the cause named (a `Math` function, object key order, a timing call). |
| P0.2 | If it is the engine: replace the offending call with a fixed one. Add `tools/table.js` so the table runs from a command line. | The table is identical in Node and in a browser. |

**Cost:** half a day. Changes no behaviour unless a `Math` call is replaced, which re-baselines every world once.

### 1. A year that costs less (do before anything that adds people or places)

**Why:** a tuning round is 20 worlds (5 lands by 4 seeds). At 109 s a world that is 36 minutes, and the big worlds take four minutes each. More than one settlement multiplies it.

None of these steps may change a history: each is checked by the log hash of every test world being the same before and after.

| Step | Do | Check |
|---|---|---|
| P1.1 | Each household keeps its list of members (kept up on birth, death, moving, leaving). `society()`, `townLife()`, quarrels and gifts read the list instead of filtering everyone. | Same hashes. `society()` under 5% of the time. |
| P1.2 | Walking distances: remember them per door (a lot's door, not any tile), drop the oldest instead of all, and stop the search at the distance asked for. The heap in `route()` and `walkField()` becomes two typed arrays. | Same hashes. Routes and distances under 15% of the time together. |
| P1.3 | Lot search: a household remembers which lots it was refused and does not ask again until that ground changes hands. | Same lots chosen (same hashes). "Lots refused" falls by more than half. |
| P1.4 | Yearly ties and quarrels look only at pairs that met this year (a list written when they do something together), not all pairs. | Same hashes. |

**Target:** plains 2 in under 70 s, the mean world under 45 s.
**Trap:** P1.2 can change the order in which equal-cost tiles are taken, which changes histories. Keep the tie-break identical, or do it as its own commit and re-baseline.

### 2. The people who leave stay on the map

**Why:** this is the largest gap between what the simulation computes and what the player sees. A thousand people walk off the edge in the last 30 years.

**Cause chain (already in the code):** no ground to sow within 4 lots of the door, and a lean year behind → the household goes. Today it goes off the map. Two ways to keep it, which can be done one after the other:

#### 2A. Farmsteads (one step, no refactor)

The household that would leave looks for the nearest known free ground where it could sow what it wants, and builds there, still part of the place: it uses the same market, well and store, at the cost of the walk.

| Step | Do | Check |
|---|---|---|
| P2A.1 | At sowing, a household with no ground near its door takes a lot beside free ground within a day's walk of the fire and moves there (its old roof passes on, as in a quarrel move). Only those who find none leave the map. | "Left" falls from 807 to under 300 per run. Outlying houses with fields appear from about year 60. Hunger deaths stay under 20. |
| P2A.2 | Ways wear between farmsteads and the market from real trips; nothing new to write, but check it. | Tracks to the outlying houses are visible; their food trips are longer than the village mean. |

**What it does not give:** a second market, a second store, partners from elsewhere, rivalry.
**Risk:** people a day's walk out may starve at the edge (a failure mode named in the plan). The check is the "starved out/avg" column staying near 1.

#### 2B. Real second places (J1, then J2)

| Step | Do | Check |
|---|---|---|
| P2B.1 | `S.settlements = [T]`, and one function that gives the settlement of a person or a site. `S.tribe` stays as a name for the first. No behaviour change. | Same hashes. |
| P2B.2 | The 680 uses of `T.` are sorted into three: the place's own (store, wants, prices, coin, market, wall, origin and lattice, about 55 fields), the household's (already there), and the map's (`road`, `tread`, `known`). Each function takes the settlement it is acting for. | Same hashes with one settlement. |
| P2B.3 | Founding: households that leave in the same spring and are kin or friends go together to the best free ground they know (the camp score already in "Planned on purpose"), and light a fire there. Farmsteads from 2A that have neighbours and are far from the market do the same. | A second place in at least 8 of 10 standard worlds by year 100. "Left" under 100 per run. |
| P2B.4 | Partners come from the other place when there is one; the planned rule "a stranger arrives" applies only while the valley holds one place. | Marriages between places are told in the log. The planned rule is marked as temporary in `docs/ARCHITECTURE.md`. |
| P2B.5 | View: camera limits, the Town panel and the fence work per place. | Tapping a house in the second place shows its own place's panel. |

**Cost:** the largest refactor left. P2B.1 and P2B.2 are mechanical but touch most of `sim.js`; save and load, `newSettlement()` and the tests all change.
**Trap:** ideas. A new place should start with what its founders know, not with nothing. That makes "ideas known" a thing people carry. Decide before P2B.2.

### 3. A town that is not all farmers

**Why:** 742 working people, 7 specialists. The owner's aim is "a real, good-looking town"; a town has smiths in the plural. I4's check (tradespeople live nearer the centre) cannot pass while there are seven of them.

**Cause chain proposed:** a household goes without (its tools wore out and the smith had none; no pot for the larder; nobody to mend the cart) → that lack is counted where it is felt → the smith takes a second pair of hands, or someone builds a second smithy nearer those who went without → they are paid by those who buy, and eat from that.

| Step | Do | Check |
|---|---|---|
| P3.1 | Measure first: a table column for households that wanted a tool, pot or cart this year and got none, and for able people with no work. | The lack is large in big towns (expected), or the proposition is wrong and stops here. |
| P3.2 | Hands at a place follow its unmet orders, not "one to a place". The gate on the village's average food goes; what holds a person back is their own household's larder (`fed()` already does this). | Specialists grow with the town: over 5% of working people at 1,000. Scenario "remove the smith" still holds. |
| P3.3 | A second place of the same kind is built when those who went without live far from the first (their trips to it are counted in B8). | Two smithies only in towns where the far side went without. None in a village of 60. |
| P3.4 | Buyers pay (coin, or food before coin), as builders already are in H3. A craftsperson whose trade does not feed the household goes back to the fields. | Tradespeople's larders are filled by purchase. I4's check: their doors are nearer the centre than farmers'. |

**Trap:** food. Every hand taken from the fields must be fed by the others; `FIELD_YIELD` already lets a farmer feed more than one. If hunger deaths rise, the cause is P3.2 moving too fast, not yields.
**Planned rules removed:** "one pair of hands to a place" and the `T.plenty` gate, both of which are thresholds on a village number.

### 4. Checks that have never passed

Each is a short investigation with a table column, not a feature.

| Step | Question | First thing to measure |
|---|---|---|
| P4.1 | B7: why does no pit become a pond? | Deepest pit per world and stone used per person. If towns of 1,000 still build in timber, the cause is in what a house is built of, not in the pits. |
| P4.2 | Bridges: 0.2 per run, no homes across water. | How often wading toil or "something better seen across" is felt, and what stops the build (means, span over 4 tiles, or the idea). |
| P4.3 | I3: rents never shown to fall. | Rent per floor by year, around the year a bridge or a new row opens. Depends on P4.2. |
| P4.4 | Highland stops at 160 to 220 people. | What the households that leave lacked: sowing ground, warmth or water. It may be right as it is. |

### 5. Soil that wears out and recovers (phase M, step 3)

**Why:** lean years now come from the store's trend. With soil, they would come from the ground: fields farmed every year give less, which is the felt cause of fallow, manure and clearing new land, and a second reason to found a farmstead.

**Order:** after 2A at least, since it changes every history and moves the food balance. Design is in `docs/ENVIRONMENT.md`, "Soil that is spent and fed".

## Order proposed

| Order | Proposition | Size | Why here |
|---|---|---|---|
| 1 | 0: one history everywhere | half a day | Everything after is checked by hashes and tables |
| 2 | 1: speed | 4 commits | No behaviour change; makes every later tuning round cheaper |
| 3 | 2A: farmsteads | 1 or 2 commits | The biggest visible gain for the least code |
| 4 | 3: trades | 4 commits | Makes the large towns towns |
| 5 | 4: open checks | 4 small commits | Can be slotted between the others |
| 6 | 2B: second places | 5 commits | Best done once 1 has made it affordable and 2A has shown where people go |
| 7 | 5: soil | per `ENVIRONMENT.md` | Re-baselines everything; last |

## For the owner to decide

1. **2A before 2B, or straight to 2B?** 2A is quick and keeps people in view, but its outlying houses are not a second place. 2B is what the plan calls J and is several times the work.
2. **Ideas in a new place (2B):** carried by its founders (proposed), or known to the whole valley?
3. **Proposition 3 removes two existing rules** (one worker per place, the village-food gate). Agreed?
4. **Running the table outside the browser** (proposition 0): this adds a small Node script under `tools/`. Node is broken on the owner's machine, so it would run here and in the browser page as now.
