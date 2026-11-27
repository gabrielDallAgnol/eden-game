# Health, sickness and how many children people have

Written 2026-11-25 after the owner's note: early people died young and had many children; families shrank as children lived. Disease and plagues come later, and people must find out how to treat them. This note says what is built now and how sickness should plug in, so the next step does not have to rework births and deaths.

## Built now

- **Family size is learned at home.** Every person carries `norm`: how many children they think a family should have. A child takes its mother's norm, moved 20% toward what the place showed while she raised it. That is 2 (3 once the place farms, because children are hands on the land) plus 8 times the share of children who died before they were grown, plus her own dead children, up to 3. The first people bring a norm of 6 (`FIRST_NORM`, planned).
- **A couple has children** while their living children are fewer than the mother's norm, plus each child of theirs that died (up to 3), plus one while their fields need more hands than the house has. Food, the mother's health, the season and spacing between births still decide whether a child comes.
- **The place remembers** children born (`T.kidBorn`) and children dead before they were grown (`T.kidDied`), both fading by 15% a year.
- **Result today:** children rarely die in Eden, so the norm falls from 6 toward 3 to 4 over a hundred years. Nothing sets these numbers. They follow from children living and land to farm. (A rule giving more children where food piled up was tried and taken out: once houses were no longer a bottleneck it drove boom and famine.)

## Built 2026-11-27: sickness, birth, and what holds a place's numbers down

Measured before: in valley seed 1 over 60 years, 234 children were born and 13 people died. The place doubled every ten years (about 7% a year); real peoples before medicine grew by well under 1% a year. What was missing was death.

- **Fever.** People foul the ground they live on. What a household is exposed to is its own foulness and its neighbours', so one house alone is nearly safe and houses packed in rows and floors are not. The youngest die first. A well and a working healer help. The numbers are in `docs/ARCHITECTURE.md` under "Planned on purpose".
- **Birth** kills some children and a few mothers.
- **Childbearing** runs from 10 to 30, about three years apart.
- **What people do about it:** once fever has killed, households choosing a lot keep away from crowded, fouled ground (`need.sick`). Nothing else answers it yet: no latrines, no keeping the sick apart, no second well. Those are the next ideas.
- **Result** (five worlds): 21 to 73 people at year 50 and 76 to 325 at year 100, where it was up to 1,651. About a third of children die before they are grown.
- **For the tests:** `demog: 'old'` gives the earlier demography, for checks that need a large place within a few decades.

## Built 2026-11-28: herbs and medicine

Medicine is no longer a switch. Four herbs grow each on its own kind of ground, so a band by a marsh has meadowsweet for fever and a band on the heights has gentian for its children, and neither has the other's. A use is found by a grown person trying what grows near when someone at home is ill; it is held by that person, grows with use, is shown to grown housemates and to the healer, and is gone when the last who knew it dies. Numbers are under "Planned on purpose" in `docs/ARCHITECTURE.md`.

Seen in runs of 100 years: a highland band ended knowing gentian and garlic (and meadowsweet, from homes by a stream); a forest band meadowsweet and garlic; a valley band three of the four; yarrow was known only on the wide map, by 21 of 392.

## Where sickness plugs in

Sickness is the main thing that killed children in the past, and it is what Eden lacks. When it comes, it only has to kill people; the rest follows:

1. Children dying of a sickness raise `kidDied`. The next generation's norm rises and families grow again. After a plague, there is a baby boom.
2. A new death cause, for example `'fever'`, goes through `die()` like the others. The town's wants already rise with loss (`T.need.loss`).
3. **Proposed model:**
   - A sickness is a row in a `SICKNESS` registry: how it spreads (touch, water, bad food, crowding), how long it lasts, how deadly it is by age, and what eases it.
   - A person carries `ill: { kind, days }`. It spreads through the same cells used for meeting people, so crowded houses, a shared well and a busy market spread it faster.
4. **Cures and means come from wants, like every other idea:**
   - Deaths from sickness raise a new want, `sick`.
   - Ideas answer it: herbs (the healer's house already exists), keeping the sick apart, clean water (a well away from middens), boiling water, and burying the dead outside the village.
   - Each idea works only through something built or someone at work: the healer, a separate hut for the sick, a second well.
5. Longer lives also come from this: `healing()` already lets old people live 15% longer while a healer works in the healer's house.

## Wolves and people (built now)

See "Wolves and people" in `docs/ARCHITECTURE.md` under "Planned on purpose". In short: wolves do not shy from people. A hungry wolf takes the weak and the lone. Three grown people can kill a wolf but may lose one of their own. What the place learns of wolves (`T.lore`) lets two stand together and makes the fights less deadly. Weapons would come next, from the want of danger.
