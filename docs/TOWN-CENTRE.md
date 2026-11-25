# From a cluster of houses to a town with a centre

Written 2026-11-25 for the owner's question: how does a village become a town with a centre, squares and green places, and what would make that happen in Eden without a timer or a head count.

## How it happened in real places

1. **A cluster round what everyone needs.** The first houses sit near water, a fire, a good bank or a ford. Paths run from each door to those few places, so the paths meet there.
2. **The meeting point stays open.** Where many paths cross, nobody builds, because everybody walks through it every day. That trodden open ground is the first square or green. In English villages, the green was also common grazing that belonged to no single household.
3. **Things that serve everyone move to the open ground.** The well, the shrine or church, the granary, the chief's or council's house. Each is put where most people can reach it, so they end up next to each other.
4. **The market comes to the busiest crossing.** Markets grew where routes met: a crossroads, a ford, a bridge, a church door on a feast day. At first it is held now and then on open ground. Once it is held often, traders build next to it.
5. **Land by the market becomes dear.** Everyone wants to be close, so plots there are split, built in rows with shared walls and then built upward. Farmers and the poor move out to the edge. This is the centre and the outskirts.
6. **Someone keeps order over shared ground.** When the shared ground gets crowded and argued over (market stalls blocking a way, a midden by the well, a house built onto the green), the village gives someone the job of settling it. A headman or council becomes a mayor once the town gets a charter. The mayor's people (market warden, night watch, street cleaners, surveyor) exist because of those quarrels.
7. **Disasters reshape it.** Great fires and plagues led to wider streets, stone instead of timber, squares opened up and rules about building (London after 1666 is an example). Planned public parks are late, mostly 19th century, made by city governments because crowded streets had no air.

Planned towns (Roman grids, medieval new towns) skipped steps 1 to 3 by laying out the square first. Eden's lattice already does the "how": lots, ways and footprints. What is missing is the "why" for open ground.

## What Eden has already

- A fire at the origin that everyone walks to. A market at the fire once there is coin (H4). Shop-homes on the market lots (I4).
- The hall, shrine, church, well, granary and storehouse choose lots near the fire.
- Rows, then upper floors, where lots are scarce (I1, I5). Rent (I3).
- An elder chosen to sit in the hall and settle quarrels and debts (the mayor).
- Worn ways (`tread`) that record where people actually walk, and friends who sit together in the evening.

So the centre already forms by accident. What does not exist yet is any reason to **keep** ground open, and nothing for people to do on it.

## Proposed causes, in the order they would be built

| Step | Cause (felt want) | What appears | Who does it |
|---|---|---|---|
| N1 Square | The lot where most worn ways meet, next to the fire, is crossed by many people every day. A plot chosen there costs more in other people's walking than it gives its builder. | The lot stays open and is paved over time by wear, then laid with stone once masonry is known. It becomes where people sit, children play and music is heard in the evening. | Nobody at first: it simply stays open because building there is refused (the same lot test as now, with the crossing traffic counted). |
| N2 Market square | Market trips (H4) crowd the square. | Stalls on the square's edge, then shop-homes facing it (I4 already). | Traders. |
| N3 Green | Households with children and no open ground within a few lots feel it (children play in the ways, get hurt, quarrel). Commons for grazing tame beasts. | A lot kept as a green: grass, a tree or two, a bench. | The elder in the hall, when that want is brought there, sets the lot aside. Without an elder, nothing is kept. |
| N4 Civic ground | Quarrels over shared ground: a house built against the well, a midden on the square, stalls blocking a way. | Rules for the square and green; the market warden. | The elder (mayor) with a warden. A new job from the quarrels, not from size. |
| N5 Fire and rebuilding | A fire spreading along a timber row. | After it, rebuilt in stone with the way widened. | Masons, paid by the households. |
| N6 Second centres | A district far from the market with enough walking to it. | A second, smaller square at the busiest crossing out there. | Same rule as N1. |

New jobs that would come out of these: market warden (N4), street sweeper or scavenger (a midden on the square), watchman (theft at the market). Each would appear only when its want is felt, the way the elder, scribe and healer do now.

## What it needs that does not exist yet

- A count of how many people cross each lot per year. The `tread` field almost gives this; it would need to be per lot.
- An "open" lot type on the lattice (square or green) that `choosePlot()` refuses to build on.
- Art: paving, a bench, stalls (code-drawn first), a tree for the green.
- A reason to go there: evening hobbies (`hobby()`) and children's play would choose the square or green over the fire once it exists.

## Rule-1 check

Nothing here is gated on population or level. A square exists because many people walk across a lot. A green exists because households felt the lack of one and someone with the standing to do it (the elder) set ground aside. A warden exists because quarrels over shared ground happened. N3 needs an elder, and an elder needs a hall: a chain of causes, not a threshold.
