# Ages and assets

Research notes for planning Eden's buildings by age (gathered 2026-11-22). Read with `docs/ARCHITECTURE.md`. Items marked (source) were checked against the links at the end; the rest is general knowledge and should be verified before it is relied on.

## What drove each age, and what to draw

| Age | Felt need that causes the change | New sprites worth making | Recolour or code-drawn |
|---|---|---|---|
| Camp | Cold; meat spoiling | (tent exists) | Drying rack, hearth |
| Neolithic village | Grain rotting or stolen; nowhere to store or cook | Granary on posts; kiln | Hut exists; pen from the stake fence |
| Bronze Age town | Too much to count (source: writing began as accounting); raids; blunt tools | Temple-storehouse (tall); smithy; gate | Stone wall from the fence; flat-roof house from the cottage |
| Classical city | Dear land; queues at the well; mud | Two-storey shop-house; fountain | Paved street; red tile roof by palette swap |
| Medieval town | Scarce street frontage (source: burgage plots); deaths; grinding by hand | Jettied timber townhouse; church; mill | Guildhall from a wide townhouse; market stalls |
| Early modern city | Fires; debts; goods piling up | Brick terrace; warehouse with crane | Town hall from the church body; bank from the terrace |
| Industrial city | Fuel short; heavy loads; work far from home (source: back-to-back rows by the mills) | Mill with chimney; station | Worker rows from the terrace, darkened; gas lamps |
| Modern city | Land too dear (source: height follows land value) | Apartment block; tower | Tower from the block stacked in code; tram from the cart |

## Rules real towns followed that make a generated town look good

1. Narrow frontage, deep lot, house at the street edge, yard behind (source: burgage plots).
2. Shared-wall rows before height; build upward only where land is dear, near the market or inside the wall (source: Roman insulae).
3. Shop below, home above on market streets (source: insulae).
4. Height limits appear only after a collapse or fire (source: Roman rules after fires).
5. One landmark per district on a square, with houses gathered round it (source: Anno 1800 developers).
6. Smelly and smoky trades at the edge, downwind or downstream; height falls from centre to edge.
7. An old lot keeps its old building until a need rebuilds it.

## Lessons from other games

- **Humankind:** seven eras (Neolithic to Contemporary), advanced by earning era stars; each era's culture brings one emblematic district. Players' main complaint about its look: old districts restyle when the culture changes, so a city's history cannot be read from it. Eden should never restyle old buildings.
- **Anno 1800:** every resident tier lives on the same 3x3 lot; the house upgrades when its needs are met. Low tiers look looser, order increases with each tier, and public buildings are focal points.
- **Manor Lords:** the burgage plot is the unit; it upgrades when church, well, food, fuel and clothing are available.

Both support Eden's lot lattice: keep one lot, upgrade the building on it.

## Sources

- https://humankind.fandom.com/wiki/Culture and https://humankind.fandom.com/wiki/District
- https://www.pcgamer.com/humankind-culture-guide
- https://community.amplitude-studios.com/amplitude-studios/humankind/ideas/2811-old-town-district-cosmetics-from-previous-ages
- https://www.anno-union.com/en/devblog-residential-tiers/
- https://www.pcgamer.com/games/city-builder/manor-lords-burgage-plot
- https://en.wikipedia.org/wiki/Burgage and https://en.wikipedia.org/wiki/Jettying
- https://smarthistory.org/roman-domestic-architecture-insula
- https://www.metmuseum.org/essays/the-origins-of-writing
- https://www.worldhistory.org/Catalhoyuk/
- https://www.designingbuildings.co.uk/wiki/Back-to-back_housing
- https://cepr.org/voxeu/columns/economics-skyscrapers-synthesis
