# Periods: what should cause what, and when

Written 2026-11-27 after measuring the ten standard worlds (5 lands, seeds 1 and 2, size 96, 100 years). It answers three questions: does each thing in the game arrive for a believable reason at a believable time, what must change in the code so that it does, and what is missing from each period. Nothing here is built yet; the order of work is at the end.

## What was measured

Year of first arrival, median over the ten worlds, with the number of people alive at that moment.

| Thing | Worlds (of 10) | Median year | Range | People then |
|---|---|---|---|---|
| Fire | 10 | 2 | 2 to 2 | 5 |
| Pottery (idea) | 10 | 2 | 2 to 2 | 5 |
| Hut (idea) | 10 | 5 | 5 to 5 | 6 |
| Kiln built | 10 | 5 | 2 to 7 | 6 |
| Tools and a smithy | 10 | 12 | 5 to 26 | 9 |
| Timber house on a stone footing | 10 | 12 | 7 to 22 | 14 |
| Farming | 10 | 14 | 5 to 36 | 13 |
| Granary built | 9 | 14 | 10 to 36 | 15 |
| Masonry | 10 | 19 | 10 to 26 | 19 |
| Well built | 10 | 22 | 5 to 34 | 18 |
| Coin and a market | 8 | 31 | 26 to 43 | 39 |
| Herding | 9 | 31 | 0 to 89 | 40 |
| Shrine | 8 | 34 | 31 to 46 | 48 |
| Cart | 8 | 36 | 29 to 91 | 72 |
| Church | 7 | 43 | 31 to 48 | 66 |
| Concrete | 5 | 60 | 36 to 84 | 179 |
| Writing | 8 | 62 | 46 to 84 | 225 |
| Plough | 4 | 65 | 29 to 94 | 360 |
| Council and hall | 8 | 67 | 50 to 94 | 289 |

## What is wrong with this

1. **The early ideas are a timer in disguise.** Fire comes in year 2, pottery in year 2 and the hut in year 5 in all ten worlds, whatever the land. A want is added up at a steady rate per person and the idea fires when the sum passes a fixed number (`IDEAS[k].at`). The cause is named, but the moment is fixed. That breaks rule 1 in spirit.
2. **The order and the pace are not believable.** Five people have pottery in year 2. Nine people have a smithy in year 12, before anyone farms, with no ore in the ground. Nineteen people lay masonry. Thirty-nine people use coin. A church stands in year 43 and concrete is poured in year 60. In life these steps took tens of thousands of years and needed thousands of people in touch with each other.
3. **Nobody knows anything; the village does.** An idea is one switch for the whole place (`T.skills[k] = true`). No person discovers it, holds it, teaches it or takes it to the grave. So knowledge cannot spread unevenly, cannot be lost, and a specialist is only a label.
4. **Means are missing from the ground.** Pottery needs no clay, tools need no ore or flint, the kiln needs no fuel beyond the common wood. An idea's `can()` test mostly asks whether an earlier idea exists.
5. **Some things are a particular culture's story.** A church after a shrine, and the fixed sentences that announce each idea ("a tame beast standing idle"), are written in advance. The sentence should be made from what actually happened.

What already works by cause and should be kept: herding (a calf actually caught), bridges (walks actually made longer), coin (trades actually failing), fences (crops actually eaten), family size, wolves, leaving in a lean year, prices.

## The proposal: knowledge comes from doing, lives in people

Replace the idea switch with three parts.

- **Noticing.** Each idea has an *occasion*: something that really happens in the world and could teach it. Clay under a hearth bakes hard. Spilled grain sprouts by the store. A green stone in a hot kiln runs bright. A log lies across the stream after a flood. Each time the occasion happens in front of a person who has the want, there is a small chance they notice. So the pace depends on how often the occasion happens and how many minds see it. More people and more practice mean faster discovery, with no head count anywhere.
- **Holding.** What is noticed belongs to that person as know-how, with a level that rises with practice. Others learn it by working beside them or as their children. If everyone who holds it dies, it is lost and must be found again. Something practised by many is safe; something one old potter knows is not.
- **Means.** Each craft needs its real materials at hand: clay near water, flint or good stone, ore outcrops in rock, fuel. A land without ore has no metal until it trades for it.

Consequences that then need no rules: big, long-settled places know more; a famine or a plague can set a place back; a specialist only exists where others can feed them (already true through H3 wages); lands differ in what they find first.

## Time

A band of four cannot stand for all of humankind in 100 years, and it should not try. Two decisions are the owner's:

- **Where the story starts.** Proposal: the people arrive as foragers who already have fire, hides, cord, stone flakes and spears, as every band of our species did. Fire is then lit on purpose from the start, and the first real change is settling down.
- **How far one game goes.** Proposal: the first 100 to 150 years reach a farming village (huts, fields, pots, pens, a well, a shrine, a bridge). Metal, writing, coin, masonry and councils belong to a town of many hundreds in touch with other places, so they wait for more than one settlement (phase J) and come centuries in, not decades.

## Each period: what should cause it, and what is missing

| Period | Reached when (cause, not date) | In the game today | Missing |
|---|---|---|---|
| Foraging band | Start | Gathering, hunting, fishing, tents, a common store, snares | Moving camp with the seasons and the game; drying and smoking meat; baskets and skins to carry; a visible daily round; storytelling at the fire that passes know-how to children |
| Settling down | Food close enough all year that moving costs more than staying; things too heavy to carry | Huts follow cold nights under hides | The choice to stay as a weighed cost; middens and their smell; graves near home |
| First farmers | Wild grain gathered and spilled year after year at one place; a caught young animal | Fields, fences, pens, hay, cull, granary, pottery, well, ditches | Clay as a place; grinding stones and the toil of them; seed kept back from eating; fallow and tired soil; dogs from wolf pups; weaving and clothes for cold; sickness from crowding and beasts (designed in `docs/HEALTH.md`) |
| Village | Enough households that sharing by kinship stops working | Friends, grudges, gifts, debts, barter, quarrels, shrine | Inheritance of house and field; marriage between groups; an elder listened to because of ties, before any hall; feasts that settle debts; the square (N1 to N3) |
| Town | Surplus that feeds people who do not farm; other places to trade with | Coin, market, smithy, workshop, tally house, hall, rent, floors | More than one settlement (J1 to J3); ore and mining; roads between places; raids and walls from real raids (J4); law after real disputes (N4); fires and rebuilding (N5) |
| Later ages | See `docs/AGES.md` | Not started | Phase K |

## What the code needs

| Change | Why | Size |
|---|---|---|
| K1. Know-how held by people: `a.know{}`, occasions, teaching, loss. `T.skills[k]` becomes "someone here knows it", so the rest of the code keeps working | Fixes points 1 to 3 | Large, but contained: `IDEAS`, `reckonYear`, births, deaths, the Town panel, about 25 tests |
| K2. Means on the ground: clay, flint, ore as map layers like stone | Fixes point 4 | Medium |
| K3. Start with fire and the forager's kit; move coin, writing, masonry, concrete, church behind town-scale causes | Believable pace | Small after K1 |
| K4. Announcements built from the event (who, where, what they saw) | Fixes point 5; gives the chronicle of firsts for free | Small |
| K5. `S.settlements[]` in place of the single `S.tribe` (J1) | Towns, trade, raids, founding a hamlet | Large and mechanical: `T` is used about 2,000 times |
| K6. Split `src/sim.js` (258 KB, one closure) into files by subject | Each later step gets cheaper and safer | Medium; needs the single-file builder and test loaders adapted |
| Bugs first: plains seed 1 stuck at 6 homes; building sites stalled beside the fire | They make the early village look broken | Small |

Order proposed: bugs, K1, K3, K4, K2, then the readable start (signs over heads, a "why" line, the chronicle), then the square (N1 to N3), then K5 and the town period.
