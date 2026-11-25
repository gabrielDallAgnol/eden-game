# Health, sickness and how many children people have

Written 2026-11-25 after the owner's note: early people died young and had many children; families shrank as children lived. Disease and plagues come later, and people must find out how to treat them. This note says what is built now and how sickness should plug in, so the next step does not have to rework births and deaths.

## Built now

- **Family size is learned at home.** Every person carries `norm`: how many children they think a family should have. A child takes its mother's norm, moved 30% toward what the place showed while she raised it. That is 2 plus 8 times the share of children who died before they were grown, plus her own dead children, up to 3. The first people bring a norm of 6 (`FIRST_NORM`, planned).
- **A couple has children** while their living children are fewer than the mother's norm, plus each child of theirs that died (up to 3), plus one while their fields need more hands than the house has. Food, the mother's health, the season and spacing between births still decide whether a child comes.
- **The place remembers** children born (`T.kidBorn`) and children dead before they were grown (`T.kidDied`), both fading by 15% a year.
- **Result today:** children rarely die in Eden, so the norm falls from 6 to about 3 over a hundred years, and births slow down. Nothing sets that number. It follows from children living.

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

- A wolf keeps away from people it hears working or shouting, unless it is hungry.
- It goes for a lone person or a child once its energy is below 0.45, and for a band of grown people only below 0.25. These are planned numbers.
- Two grown people who see a wolf within 4 tiles go at it together with shouts. It is driven off and fears people for a while; if it stands, it may be killed.
- Someone alone backs away and shouts. Grown people within hearing come to the shout.
- When a wolf kills someone, their partner, kin and friends go after that wolf together for about a third of a year, and kill it if they catch it.
- Result in the five standard lands (seed 1, 100 life-years):
  - wolves within 3 tiles of a person, sampled once a year: 0.25–0.53 before, 0–0.11 now;
  - people taken by wolves: 5–19 a run before, 0–5 now;
  - wolves driven off: 4–194 times a run; wolves killed: 0–66.
