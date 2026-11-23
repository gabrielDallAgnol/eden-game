# Wants, not points, carry Eden to orbit

Every game in this research sells technology for a counter (science points, knowledge points, a timer or a paid "age up"), and not one makes a single felt want the trigger of a single advance. So Eden's rule has no direct model to copy, and no direct failure to learn from. The big history games agree on size and shape: one tree of **68 to about 90 technologies** in **7 to 9 ages**, 7 to 12 technologies per age, 3 to 7 lanes, and a space race of 3 to 6 costly projects that always starts at one technology called Rocketry. The choice of path is real for a few ages and false at the end: Civilization VI lets you launch the first satellite with 25 of 67 technologies, but finishing its race needs 60 of 67. Players punished the same four things again and again: a checklist that is the same every game (Civ VI Eurekas), events made only to earn points (Dawn of Man), waiting on research timers in a town that runs itself (The Universim), and a long last third that fewer than half of Civ VI players finished. Real history supports Eden's rule better than it supports the games: the want is almost always old, the date is set by the last missing means or by a local shortage, and the last steps to orbit were paid for by states afraid of each other. On that basis this report proposes **nine ages used only as names, six branches that follow the people's wants, 67 advances from fire to a person in orbit (27 that no land can skip), ten new wants taken mostly from Eden's own documents, and a four-step race that ends the game at the first person in orbit.** One limit applies to every number here: page fetching was blocked during the research, so the notes rest on web-search extracts and not on full page reads; only the Civilization data, read directly from public data files, is exact.

## How far to trust the evidence

The research notes were written without being able to open web pages. Every statement about reviews, forums, designer interviews, wikis and history comes from the short extracts that a web search returns, not from reading the page. Quotations are the wording the search tool gave and should be treated as close paraphrase. Where a note was marked "unverified" or "recalled, not verified", this report keeps that mark.

Three sets of numbers are stronger, because the researcher read the data files directly from public GitHub repositories: Civilization VI (base game plus Rise and Fall, March 2018) ([Civ6Scripts](https://github.com/kebnoa/Civ6Scripts)); Civilization V Gods & Kings as copied by the open-source game Unciv ([Unciv ruleset](https://github.com/yairm210/Unciv/blob/master/android/assets/jsons/Civ%20V%20-%20Gods%20%26%20Kings/Techs.json)); and Civilization VII as of October 2026, after its patches ([Civ7 data](https://github.com/mateicanavra/civ7-official-resources)). A fourth file, a fan-made copy of Humankind, was also read directly ([Humankind Cultures](https://github.com/Kurwizimi/Humankind-Cultures)), but it has low authority: its technology names follow the game, and its prerequisites and costs do not. Humankind's own data could not be read, so its total of "about 90" technologies is unverified.

The evidence on what "worked" is mostly forum opinion, small-outlet reviews and one designer's claim about playtests. No measured comparison of tech systems was found. The proposal at the end is design work built on this evidence; none of it has been run in Eden.

### Added 2026-11-23: Humankind's tree checked against an image

After this report was written, tech tree images were fetched from the public file listings of the Humankind and Civilization wikis (Google Images itself answered with a "prove you are human" check and was not used). One of them, `File:Tech tree-Victor.png` on humankind.fandom.com, is a fan-drawn chart of the whole tree in the pre-release "Victor" test build, from the Ancient to the Industrial age. Read box by box, it shows:

| Age | Technologies in the chart | Fan ruleset used above |
|---|---|---|
| Ancient | 12 | 12 |
| Classical | 12 | 12 |
| Medieval | 10 | 10 |
| Early Modern | 11 | 11 |
| Industrial | 17 | 18 |
| Contemporary | not in the chart | 28 |

So the first four counts are now confirmed by a second source, for a pre-release build; the Industrial count differs by one, and the Contemporary count and the released game's exact total stay unverified. The chart also shows the prerequisite links the fan ruleset lacked: three loose lanes run the whole width (knowledge at the top: Calendar, Writing, Philosophy, Rhetoric, Theology, Alchemy, Movable Typeface, Encyclopedia; trade and sea in the middle; war at the bottom), and they cross at a few technologies (Wheel, Guilds, Centralized Power, Steam Engine, Scientific Method). About 30 of the 62 boxes are about armies, forts or rule, which Eden has no use for as they stand.

Other images fetched the same way and used only for viewing: the full trees of Civilization I, IV, V (Brave New World) and VI, the Civilization VI civics screen, two in-game Humankind research screens, and the science victory screens of Civilization V and VII. They are game screenshots owned by their publishers, so they are not stored in this repository; their file names on civilization.fandom.com are `Official tech tree (Civ1).jpg`, `Tech Tree for Civ 4 & Warlords (Civ4).png`, `Tech Tree (BNW).png`, `Tech Tree (Civ6).jpg`, `Civics tree screenshot (Civ6).png`, `Science victory (Civ5).png` and `Modern Science Victory Screen (Civ7).png`.

## The big games sell 68 to 90 technologies for points, in 7 to 9 ages

The shape is very stable across the series. One tree runs left to right. A technology needs one to three earlier ones. Science points pay for it. Civilization VI has 68 technologies in 8 ages and 90 links between them, about 1.3 prerequisites each ([Civ6Scripts](https://github.com/kebnoa/Civ6Scripts)). Civilization V has 80 in 9 ages, tied together more tightly ([Unciv ruleset](https://github.com/yairm210/Unciv/blob/master/android/assets/jsons/Civ%20V%20-%20Gods%20%26%20Kings/Techs.json)). The count per age is flat: Civ V has 12, 9, 10, 10, 10, 9, 8 and 11; Civ VI has 11, 8, 7, 9, 8, 7, 8 and 10. Humankind is the exception. In the fan copy it has 12, 12, 10 and 11 in its first four research ages, then 18 and 28, so most of its content sits at the end ([Humankind Cultures](https://github.com/Kurwizimi/Humankind-Cultures)). Cost is set by column, not by content, and rises steeply: the last column of Civ V costs 440 times the first, and Civ VI's about 86 times.

| Game | Trees | Ages | Technologies | What pays for an advance | Gate between ages | Source |
|---|---|---|---|---|---|---|
| Civilization V (Gods & Kings) | 1 | 9 | 80 (81 with Brave New World) | Science points | Prerequisites only (recalled, not verified) | [Unciv ruleset](https://github.com/yairm210/Unciv/blob/master/android/assets/jsons/Civ%20V%20-%20Gods%20%26%20Kings/Techs.json), [Well of Souls](https://well-of-souls.com/civ/civ5_systems.html) |
| Civilization VI (Rise and Fall) | 2: technologies and civics | 8 | 68 technologies and 51 civics | Science and culture points; a deed in the world pays 40% of the cost | Prerequisites only (recalled, not verified) | [Civ6Scripts](https://github.com/kebnoa/Civ6Scripts) |
| Civilization VII (October 2026 data) | 3, one per age | 3 | 15, 14 and 16, plus one repeatable in each | Science points | The age ends and its tree is thrown away | [Civ7 data](https://github.com/mateicanavra/civ7-official-resources) |
| Humankind | 1 | 7 (the first has no research) | About 90; exact total unverified | Science points | 7 Era Stars earned by deeds; 1 star to leave the Neolithic | [Humankind wiki](https://humankind.fandom.com/wiki/Era_Star), [Gamepressure](https://www.gamepressure.com/humankind/ancient-era-how-to-advance/z0ec35) |
| Age of Empires II | None between ages | 4 | Bought one by one at buildings | 500 food, then 800 food and 200 gold, then 1,000 food and 800 gold | Two buildings of the present age, then the payment | [ageofempires.com](https://www.ageofempires.com/learn-to-play/advancing-aoe2/) |
| Empire Earth | None between ages | 14 (15 with the expansion) | Bought one by one | Resources, rising each epoch | Two buildings of the present epoch, then the payment | [Wikipedia](https://en.wikipedia.org/wiki/Empire_Earth_(video_game)), [Empire Earth wiki](https://empireearth.fandom.com/wiki/Epoch) |
| Empire Earth II | 1 per epoch | Not retrieved | 12 per epoch | Research | Any 6 of the 12 | [Empire Earth wiki](https://empireearth.fandom.com/wiki/Technology_(Empire_Earth_II)) |
| Dawn of Man | 1 | 6, ending at the Iron Age | Count not found; each costs 5 to 20 knowledge points | Points earned by deeds (hunting, winters survived, things built) | An "Era Tech" bought first | [Dawn of Man wiki](https://dawnofman.fandom.com/wiki/Research), [Lostnoob](https://www.lostnoob.com/dawn-of-man/knowledge-points/) |
| The Universim | 1 | 4 named in the sources | 210 "perks" after a later update | A fixed time for each perk | Not found | [Universim wiki](https://theuniversim.fandom.com/wiki/Research), [patch notes mirror](https://tuxdb.com/game/959&gamenews=1) |
| Victoria 3 | 3 | One century | About 175 planned | Innovation from universities, capped by literacy, plus spread from other countries | Not applicable | [Victoria 3 Dev Diary 27](https://admin-forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-27-technology.1502428) |

### What triggers an advance: a counter everywhere, and the world gives only a discount

In almost every game the player picks the next technology and a counter pays for it. Only the source of the counter differs. Civilization VI goes furthest toward Eden's idea. **64 of its 68 technologies have a "Eureka"**: do one named thing in the world and 40% of the cost is paid (50% when the game was first released) ([Civ6Scripts](https://github.com/kebnoa/Civ6Scripts); [CivFanatics](https://civfanatics.com/civ6/info/technology/)). The triggers are often the practical first step of the knowledge: build a quarry for Masonry, found a city on the coast for Sailing, build an iron mine for Iron Working, an oil well for Plastics. About twenty kinds of observation ("own three of X", "built X beside Y", "met someone") cover more than a hundred boosts. But it stays a discount on a menu. And the six technologies that matter most at the end (Rocketry, Nuclear Fission, Satellites, Lasers, Stealth, Nuclear Fusion) have no trigger in the world at all ([Civ6Scripts](https://github.com/kebnoa/Civ6Scripts)).

Humankind does something different and important. It separates what you may research (the age you have reached), when you reach the next age (Era Stars, earned by deeds such as population, districts, money and battles) and who wins (Fame). Its first age, the Neolithic, has no research at all; the tribe leaves it by finding food, hunting or finding knowledge on the map ([PC Invasion](https://www.pcinvasion.com/humankind-beginners-guide-neolithic-era/2/); [PC Gamer](https://www.pcgamer.com/uk/humankind-fame-era-stars)). The real-time games are simpler still: an age is one purchase, allowed once two ordinary buildings stand.

Resources follow one rule in all three series, and it is the reverse of Eden's. A deposit is invisible until a "reveal" technology is known; a later technology opens the thing that uses it. In Civ VI iron is seen at Bronze Working and used at Iron Working; in Civ V oil is revealed by Biology ([Civ6Scripts](https://github.com/kebnoa/Civ6Scripts); [Unciv resources](https://github.com/yairm210/Unciv/blob/master/android/assets/jsons/Civ%20V%20-%20Gods%20%26%20Kings/TileResources.json)). Knowledge comes first and the land second. In none of these games does finding or handling a material reveal it.

Games with people who act by themselves do not change this. The Universim, the only game found that takes self-acting villagers from the stone age to space, uses a fixed time per research item ([Universim wiki](https://theuniversim.fandom.com/wiki/Research)). The few games where the simulation chooses the advance (WorldBox before version 0.50, the world history of Dwarf Fortress) give that choice no consequence for the player, and WorldBox removed its system ([WorldBox wiki](https://the-official-worldbox-wiki.fandom.com/wiki/Culture_Development); [Steam](https://steamcommunity.com/app/1206560/discussions/0/594031317713236425/)). Five other ways tie an advance to the world: a place someone must reach (Before We Leave, Kainga, From Dust), deeds (Dawn of Man), felt needs (Anno 1800, where a house upgrades only when its needs are met), surroundings (Reus) and power made by the people themselves (Populous, Black & White). All but From Dust and Reus still turn the event into a number that the player spends ([Before We Leave wiki](https://beforeweleave.fandom.com/wiki/Ancient_Technology); [Anno 1800 wiki](https://anno1800.fandom.com/wiki/Population); [Engadget](https://www.engadget.com/2011-07-26-from-dust-review.html)).

### The choice of path is real early and false late

A Civ VI player can ignore a whole root for most of the game. The first satellite needs **25 of 67 technologies and 25% of the tree's science cost**, and none of them is Mining, Bronze Working, Iron Working, The Wheel or Masonry. But the full race needs **60 of 67, or 89% of the cost**, because its last three parts sit at the ends of three unrelated rows (computed from [Civ6Scripts](https://github.com/kebnoa/Civ6Scripts)). Civ V is the same: Rocketry needs 46 of 79 technologies, and all the spaceship parts need 75 of 80 (computed from the [Unciv ruleset](https://github.com/yairm210/Unciv/blob/master/android/assets/jsons/Civ%20V%20-%20Gods%20%26%20Kings/Techs.json)). So "skipping" a branch in Civilization really means "doing it later". The lattice also overrides the land: a Civ VI people with no coast must still research Sailing, Shipbuilding, Cartography and Square Rigging before it can industrialise.

Humankind and Civ VII stop a branch from running ahead. In Humankind the technologies of a later age are closed until the empire reaches it ([Humankind wiki](https://humankind.fandom.com/wiki/Technology)). In Civ VII each age has its own small tree, and the Modern one narrows fully: Rocketry needs 14 of the 15 other Modern technologies, and only Nuclear Fission is off the path ([Civ7 data](https://github.com/mateicanavra/civ7-official-resources)).

### The space race is a short ladder of costly projects

The pattern is the same everywhere. One technology named Rocketry opens a special, very costly launch site. Three to six projects follow in a fixed order, each needing one more late technology. The projects cost production, not science, so a people needs industry as well as knowledge.

| Game | What opens the race | The steps | Where it ends | Source |
|---|---|---|---|---|
| Civilization V | Apollo Program: 750 production, needs Rocketry | Six parts: three boosters, a cockpit, a stasis chamber, an engine, each behind one late technology | The ship is put together in the capital | [Unciv victory data](https://github.com/yairm210/Unciv/blob/master/android/assets/jsons/Civ%20V%20-%20Gods%20%26%20Kings/VictoryTypes.json) |
| Civilization VI | Spaceport district: 1,800 production, where an ordinary district costs 54 | Satellite 900, Moon landing 1,500, three Mars modules at 1,800 each | A Mars colony | [Civ6Scripts](https://github.com/kebnoa/Civ6Scripts) |
| Civilization VI, Gathering Storm | The same | Satellite, Moon, Mars colony, then a ship to another star | Arrival after 50 light years | [Civ VI wiki](https://civilization.fandom.com/wiki/Victory_(Civ6)) |
| Civilization VII at launch | Launch Pad, from Rocketry | Flight across the ocean, breaking the sound barrier, a satellite | The first person in space | [PC Gamer](https://pcgamer.com/games/strategy/civilization-7-victory-legacy-paths-win-conditions-guide) |
| Humankind | "Mars Colony" national project | Earlier steps not sourced | The game ends; Fame decides who won | [GamerTweak](https://gamertweak.com/end-game-humankind) |
| Factorio | The rocket silo | 100 rocket parts, each made from three goods the factory already makes | One launch wins | [Factorio wiki](https://wiki.factorio.com/Rocket_silo) |
| The Universim | The Observatory | Satellites, then the Cosmodrome, one rocket per planet | The game goes on, on the Moon and other planets | [Crytivo devlog](https://crytivo.com/en/the-universim-news/the-universim-space-age-devlog-part-1) |

Firaxis kept making the tail longer (a launch in Civ V, Mars in Civ VI, another star in Gathering Storm) and then cut it in Civ VII to the first person in space. After release, Civ VII was changed again so that projects in every age feed the science victory ([2K dev diary](https://civilization.2k.com/ko-KR/civ-vii/game-guide/dev-diary/victories-post-launch)).

## Players punished checklists, waiting and a long last third

**The same list every game.** Designers who left the fixed tree name one fault: the whole tree is visible and identical each game, so skilled players make the same choices every time. Soren Johnson, designer of Civ IV and Old World, calls the classic tree a model of clarity whose cost was determinism ([Designer Notes](https://www.designer-notes.com/?p=1703)). Eurekas were meant to fix this, and players split. Defenders say the boosts reward playing the map. Critics call them tasks to do every game, in more or less the same order; one proposed three or four possible triggers per technology, with only two shown in any one game ([CivFanatics](https://forums.civfanatics.com/threads/are-eurekas-making-every-game-the-same.600804/); [CivFanatics](https://forums.civfanatics.com/threads/eureka-system-anyone-else-started-to-dislike-it.625210/page-2)). This is forum opinion, not a survey. Designs that use chance (Stellaris cards, Old World's deck) are praised for variety and blamed when they feel like luck ([Stellaris Dev Diary 11](https://forum.paradoxplaza.com/forum/developer-diary/stellaris-dev-diary-11-research-technology.893377/)). Johnson's test joins the two complaints: the player should always be able to see why another option is not open ([Designer Notes](https://www.designer-notes.com/2021/08/)).

**Events made for points.** Dawn of Man gives knowledge points for what the village does. Guides tell players to build structures in sets of five to earn a point and then tear the extras down ([Steamah](https://steamah.com/dawn-of-man-advanced-tips-and-tricks/)). The cause is the shared pool: a deed about huts can pay for a technology about metal. Every pooled-points system in the notes has a known way to farm it or to run past it. In Kerbal Space Program a few percent of the available science unlocks the whole tree ([Steam](https://steamcommunity.com/app/220200/discussions/0/3044985412476903598)), and WorldBox cultures reached full development after about an hour ([Steam](https://steamcommunity.com/app/1206560/discussions/0/4033600999077871981)).

**A long last third.** Ed Beach, lead designer of Civ VI and VII, said fewer than half of players finished a game of Civ VI, and that breaking Civ VII into ages was the main answer ([Game Developer](https://gamedeveloper.com/design/firaxis-big-swing-with-civilization-vii-convincing-players-to-actually-finish-their-games)). Humankind players disliked the rule that researching every technology ends the game enough to make a mod that removes it ([Nexus Mods](https://www.nexusmods.com/humankind/mods/4)). What players liked in Humankind was the short race inside each age that Era Stars give ([Amplitude forum](https://community.amplitude-studios.com/amplitude-studios/humankind/forums/210-victor-opendev/threads/40064-on-era-star-fame-yields?page=1)).

**A quiet or sudden finish.** Civ VI's space race is described by players as mostly a production queue, and the game does not tell you when a rival reaches a step ([Civ VI wiki](https://civilization.fandom.com/wiki/Victory_(Civ6)); [CivFanatics](https://forums.civfanatics.com/threads/tedious-science-victory.647171)). In Civ VII the last projects take long and then the game simply ends, with no warning ([GamerMatters](https://gamermatters.com/civilization-vii-please-one-more-turn)). Beyond Earth was praised for the opposite: every victory path gives rivals clear warning and time to answer ([Destructoid](https://destructoid.com/reviews/review-sid-meiers-civilization-beyond-earth)). Factorio's launch works as an ending because it needs a quantity of made things that every earlier system feeds, and the player can see how far along it is ([Factorio wiki](https://wiki.factorio.com/Rocket_silo)).

**The player with nothing to do.** This is the finding closest to Eden. The Universim's town runs itself and its research runs on fixed times. An early preview said every town reached the point where the only thing left was more research, with nothing to do in between ([Christ Centered Gamer](https://www.christcenteredgamer.com/reviews/pc-mac/the-universim-preview-pc)). GameStar's summary on Metacritic says the game starts well and then goes flat to the point of boredom ([Metacritic](https://www.metacritic.com/game/the-universim/)), and a digest of Steam reviews calls the middle and late game repetitive and slow ([Vaporlens](https://vaporlens.app/app/352720/the_universim)). The same sources praise the god powers. In The Universim the people need the god only for speed and rescue, and they never push back. Reus shows the opposite design: the god's gifts are the villages' only source of resources, and giving more than a village can absorb makes it greedy, then violent ([Reus wiki](https://wiki.reusgame.com/index.php?title=Greed)). In Populous the people cannot build without flat land that only the god can make ([Giant Bomb](https://giantbomb.com/populous/3030-6210/)). In Black & White the miracles a god has depend on which villages it holds ([Black & White wiki](https://blackandwhite.wiki.gg/wiki/Miracles)). With free powers and no goal, WorldBox held one professional reviewer for about four hours ([Wikipedia](https://en.wikipedia.org/wiki/WorldBox)). With no progress at all, Banished was criticised for giving no sense of advancement ([NPR](https://www.npr.org/sections/alltechconsidered/2014/02/21/280776282/banished-is-like-simcity-without-the-city-but-with-cholera)).

**Unreadable people.** When self-acting people fail in plain sight, players blame the game. From Dust's villagers walk into danger ([Trusted Reviews](https://www.trustedreviews.com/reviews/from-dust)), and players of Crest complained that they could not see why followers acted as they did ([Wasdland](https://www.wasdland.com/game/crest-an-indirect-god-sim-341710/)).

**One road for everyone.** Scholars object to the meaning of the tree: one fixed, Western road that every people must walk. Their examples are chains with no cause behind them: in Civ IV you cannot research Robotics without Mysticism, and in Civ V chivalry is a step toward particle physics ([University of Liverpool thesis](https://livrepository.liverpool.ac.uk/3027693/1/Playing%20Games%20with%20Technology.pdf); [Game Studies, Ford](https://gamestudies.org/1602/articles/ford)). Real peoples were ahead in some things and behind in others ([Sam Badger](https://sambadger.substack.com/p/no-tech-trees-arent-real)).

## In real history the want was old and the last missing means set the date

No serious scholar in the notes holds that need alone produces invention. George Basalla rejects the idea that people invent to meet basic needs; every new thing comes from an earlier thing ([Cambridge University Press](https://www.cambridge.org/core/books/evolution-of-technology/72D7695EE9A2BAFB75EFE648D4222A03)). W. Brian Arthur says technologies are fresh combinations of what already exists ([Santa Fe Institute](https://sites.santafe.edu/~wbarthur/Papers/NewSci%20Essay.pdf)). Ester Boserup shows the other half: farmers take up the hoe, the plough and irrigation only when land runs short, because each step costs more work per unit of food ([EH.net](https://eh.net/book_reviews/the-conditions-of-agricultural-growth-the-economics-of-agrarian-change-under-population-pressure/)). Robert Allen argues that steam and spinning machines were taken up in Britain because labour was dear and coal was cheap, a view that others dispute ([Allen](https://assets.cambridge.org/97805218/68273/excerpt/9780521868273_excerpt.pdf)). These views fit together, and they fit Eden's rule almost word for word: pressure chooses from a shelf of known things, and earlier things fill the shelf. Want decides when and where. Means decide whether it can exist at all.

Three kinds of trigger come back again and again. The first is an old want answered when the last means arrives: aluminium was found by two men within weeks of each other in 1886, once cheap electric current existed ([ACS](https://www.acs.org/education/whatischemistry/landmarks/aluminumprocess.html)), and the telescope had several makers within weeks in 1608, out of the trade in spectacles ([Oxford History of Science Museum](https://www.cabinet.ox.ac.uk/telescope)). The second is a local shortage that makes a known but worse thing worth using: coal for wood, iron for bronze, kerosene for whale oil, made nitrate for mined nitrate. The third is a state at war, or afraid of war, paying for what no market would: radar, the electronic computer, the large rocket.

| Advance | What history credits as the cause | What it needed first, and from the land | When and where | Source |
|---|---|---|---|---|
| Fire | Warmth, cooking, safety, light (unverified) | Fuel and the habit of tending it | Burnt bone 1.07 to 1.79 million years ago; hearth-like evidence about 790,000 years ago | [Wikipedia](https://en.wikipedia.org/wiki/Control_of_fire_by_early_humans), [Science 2004](https://ui.adsabs.harvard.edu/abs/2004Sci...304..725G/abstract) |
| Stone point on a shaft | The first thing made by joining earlier things | Stone points, shafts, binding (unverified) | About 500,000 years ago, South Africa | [Science 2012](https://pubmed.ncbi.nlm.nih.gov/23161998/) |
| Clothing | Cold (unverified) | Hide tools | By 83,000 to 170,000 years ago | [Toups et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3002236) |
| Pottery | Cooking | Clay and fuel; it does not need farming | 20,000 to 19,000 years ago, China, made by foragers | [Science 2012](https://ui.adsabs.harvard.edu/abs/2012Sci...336.1696W/abstract), [Boston University](https://www.bu.edu/articles/2012/a-prehistoric-pottery-barn/) |
| Granary | Wild grain worth keeping from damp and rodents | A harvest, a settled season | About 11,300 years ago, Jordan, roughly 1,000 years before domesticated crops | [ScienceDaily](https://www.sciencedaily.com/releases/2009/06/090623150619.htm) |
| Farming | Debated; Boserup: more people on the same land | Plants that can be domesticated | At least 11 separate places | [World History Encyclopedia](https://www.worldhistory.org/article/1886/origins-of-world-agriculture/) |
| Plough | Land short, fallows short | Tame oxen | Near East, 6th millennium BC | [Wikipedia: Ard](https://en.wikipedia.org/wiki/Ard_(plough)), [Wikipedia: Plough](https://en.wikipedia.org/wiki/Plough), [EH.net](https://eh.net/book_reviews/the-conditions-of-agricultural-growth-the-economics-of-agrarian-change-under-population-pressure/) |
| Irrigation | More food from the same land (inference) | A river beside dry, flat land | About 6000 BC, Iraq | [Wikipedia](https://en.wikipedia.org/wiki/Choga_Mami) |
| Wheel | An old want; it waited for its means | Cast copper chisels for fine carpentry; draught animals; open country | About 3500 BC | [Scientific American](https://www.scientificamerican.com/article/why-it-took-so-long-to-inv/) |
| Copper | Not stated in the notes | Hot kilns and charcoal (unverified); ore nearby | About 5000 BC, Serbia | [Radivojević](https://discovery.ucl.ac.uk/id/eprint/10134145/7/Radivojevic_Ch11_The%20Rise%20of%20Metallurgy%20in%20Eurasia.pdf) |
| Bronze | Not stated in the notes | Tin, which is rare and was traded over very long distances | Britain's change complete about 2200 to 2100 BC | [Wikipedia](https://en.wikipedia.org/wiki/Tin_sources_and_trade_during_antiquity), [Antiquity 2025](https://www.cambridge.org/core/journals/antiquity/article/from-lands-end-to-the-levant-did-britains-tin-sources-transform-the-bronze-age-in-europe-and-the-mediterranean/2330F3B6498B210DA61B89026A1F38EA) |
| Iron | Known for 800 years before it was common; one view is that lost copper and tin trade pushed smiths to it; now seen as a result of the Bronze Age collapse | Hot furnaces; iron ore | Known a little after 2000 BC; general 1200 to 1000 BC | [Erb-Satullo 2019](https://link.springer.com/article/10.1007/s10814-019-09129-6) |
| Writing and number | Keeping count of stored goods and debts | A stored surplus, a body that collects it, clay | Tokens from about 7500 BC; tablets about 3200 BC | [Schmandt-Besserat](https://sites.utexas.edu/dsb/tokens/from-accounting-to-writing/), [Joseph](https://www.ms.uky.edu/~dhje223/CrestOfThePeacockCh4-pages-2-21.pdf) |
| Coin | Not settled | Metal working, weights, a trusted stamp (inference) | Lydia, late 7th century BC | [Velde](https://www.atlantafed.org/-/media/documents/news/conferences/2012/monetary-economics/papers/velde.pdf) |
| Water mill, windmill | Grinding grain (unverified) | A stream with fall; or steady wind where streams are weak | Described 40 to 10 BC; about 6,000 water mills in England in 1086; windmills in Persia by the 9th to 10th centuries | [Wikipedia](https://en.wikipedia.org/wiki/Watermill), [Britannica](https://britannica.com/technology/windmill) |
| Paper | Not stated in the notes | Plant fibre; in Europe, linen rags | China, by 179 to 141 BCE | [Oxford](https://www.cabinet.ox.ac.uk/node/7013), [Clemson](https://opentextbooks.clemson.edu/sciencetechnologyandsociety/chapter/the-first-moveable-type-printing-press/) |
| Printing with cast type | A joining of five older things; the demand side was not retrieved | Rag paper, a low-melting alloy, a hand mould, oily ink, a screw press | 1450s (place and date unverified) | [Britannica](https://britannica.com/topic/printing-publishing/The-invention-of-printing) |
| Lenses, then the telescope | Spectacles, then an idea that was ripe | Glass making and grinding | Spectacles from about 1300; telescope 1608 | [Oxford History of Science Museum](https://www.cabinet.ox.ac.uk/telescope) |
| Science as a habit | A community across borders that tests claims (Mokyr) | Printing, paper, instruments (inference) | Early modern Europe | [Econlib](https://www.econlib.org/library/enc/bios/mokyr.html) |
| Coal as fuel | London's demand made wood dear; a national "timber crisis" is disputed | Coal seams near water transport (inference) | England, 16th to 18th centuries | [Berkeley Economic Review](https://econreview.studentorg.berkeley.edu/the-roots-of-modernity-energy-crises-industrialization-and-technological-change/) |
| Steam pump | Deeper pits filled with water | It wasted fuel, so it paid only at a coal pit | Newcomen, 1712 | [Britannica](https://www.britannica.com/biography/Thomas-Newcomen), [Wikipedia](https://en.wikipedia.org/wiki/Newcomen_atmospheric_engine) |
| Iron made with coke | Cost of fuel; the shortage motive was not sourced | Coking coal near iron ore | Darby, 1709 | [Britannica](https://www.britannica.com/biography/Abraham-Darby) |
| Machine tools | Cylinders true enough for engines | Iron; the craft of clock and instrument makers (inference) | Wilkinson 1775; Maudslay about 1800 | [Science Museum Group](https://collection.sciencemuseumgroup.org.uk/objects/co46284/) |
| Factory | Dear labour (Allen; disputed) | A river with fall: the first factories ran on water, not steam | Cromford, 1771, 200 workers | [Wikipedia](https://en.wikipedia.org/wiki/Cromford_Mill), [Allen 2013](https://www.nuff.ox.ac.uk/Economics/History/Paper115/allen115.pdf) |
| Telegraph | Railway signalling | Batteries, copper wire (unverified) | 1837, on a London railway | [Science Museum Group Journal](https://journal.sciencemuseum.ac.uk/article/cooke-and-wheatstones) |
| Electric power | Light | Fifty years passed between the principle (1831) and a public supply (1882); steam or falling water to turn it | Pearl Street 1882; Niagara 1895 | [APS News](https://www.aps.org/apsnews/2001/08/faraday-electromagnetism), [National Geographic](https://www.nationalgeographic.com/history/history-magazine/article/edison-tesla-current-war-ushered-electric-age) |
| Oil | Lamp oil: the United States burned more than 10 million gallons of whale oil a year | Petroleum in the ground | First well 1859 | [ASME](https://www.asme.org/topics-resources/content/drake’s-oil-well-started-a-revolution) |
| Nitrogen from the air | A warning in 1898 that mined nitrate would run out; then war | High-pressure steel vessels, cheap hydrogen (unverified) | Plant at Oppau, 1913 | [RSC](https://www.rsc.org/globalassets/03-membership-community/connect-with-others/through-interests/interest-groups/historical/other-publications/occasional-paper-7.pdf), [Wikipedia](https://en.wikipedia.org/wiki/History_of_the_Haber_process) |
| Liquid oxygen | Oxygen for industry; Linde came to it from refrigeration (unverified) | Air, and power for compressors | 1895 to 1902 | [Science History Institute](https://sciencehistory.org/historical-profile/carl-von-linde) |
| Powered flight | An old want; it waited for a light engine | A petrol engine with an aluminium case | 1903 | [Aircraft Engine Historical Society](https://enginehistory.org/Piston/Before1925/AcEngHx/AcEngHx.shtml) |
| Radar, computer | War | The magnetron; an army's backlog of firing tables | 1940; 1943 to 1946 | [IEEE Spectrum](https://spectrum.ieee.org/tech-history/dawn-of-electronics/from-world-war-ii-radar-to-microwave-popcorn-the-cavity-magnetron-was-there), [US Army Research Lab](https://ftp.arl.mil/mike/comphist/eniac-story.html) |
| Liquid-fuel rocket | A few enthusiasts | Petrol and liquid oxygen | Goddard, 1926: 41 feet up | [NASA](https://www.nasa.gov/history/95-years-ago-goddards-first-liquid-fueled-rocket/) |
| Large rocket | A state at war | Alcohol and liquid oxygen, a turbine-driven pump, gyroscopes | V-2, Germany | [US Air Force Museum](https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/195894/v-2-rocket/), [Wikipedia](https://en.wikipedia.org/wiki/V-2_rocket) |
| Satellite | A by-product of a weapon: the rocket was ordered in 1954 to carry a heavy bomb | A large rocket with lift to spare | Sputnik, 4 October 1957 | [NASA, Siddiqi](https://www.nasa.gov/history/sputnik/siddiqi.html), [Britannica](https://britannica.com/science/space-exploration/From-Sputnik-to-Apollo) |
| A person in orbit | Rivalry between two powers | The same rocket, plus a cabin, a way back and recovery | Gagarin, 12 April 1961, 108 minutes | [Wikipedia](https://en.wikipedia.org/wiki/Vostok_1) |

Four further findings shape the plan.

**History's order is not the designer's order.** Pottery came before farming. Granaries came before domesticated crops. The first factories ran on water, not steam. Oil was first wanted for light, not for engines. The wheel waited for copper tools. A tree built on "what sounds earlier" gets these wrong.

**Each step used the workshop of the step before.** Potters' kilns led to smelting. Cannon boring gave true cylinders for steam (unverified). Clock and instrument makers led to machine tools (inference). Coalbrookdale's iron cast the cylinders for Newcomen engines ([Sorbonne](https://18thc-cities.sorbonne-universite.fr/Ironbridge.html)). Linde's company supplied oxygen to the German rockets ([Wikipedia](https://en.wikipedia.org/wiki/Linde_plc)). These are real, local dependencies, unlike "chivalry before particle physics".

**Some steps cannot be skipped, and some can.** The notes build the shortest chain to a satellite from the single histories; no source lays it out as one graph. What cannot be skipped: stored food, hot furnaces, iron and steel, precise metal cutting, number and written records, a cheap way to copy knowledge, the habit of testing claims, electricity, the separation of gases from air, and a body able to spend like a great power at war. What a land could skip (all inference): tin bronze, coin, gunpowder, windmills and sails, the piston steam engine where falling water can drive mills and then generators, aircraft, aluminium, transistors and nuclear power. From the first liquid-fuel flight in 1926 to orbit in 1957 took 31 years.

**Late advances remove the limits of place.** Before about 1700 most steps were limited by living things and water: plants and animals that can be tamed, rivers, clay, wood. After that they were limited by rock and energy: coal near ore, falling water, oil, bauxite with cheap current. Then the late technologies dissolved earlier limits: fertiliser from air in place of a desert in Chile, oxygen from air, power carried away from the river. And once an industrial base exists, the same thing is often invented twice at once, which says the next step is then close to certain.

On scale, the notes found no source that gives a smallest population for any technology. The sourced facts are few. Pre-industrial societies kept most people on the land. In England the share of working men in farming fell from 68% in 1522 to 46% about 1700, before steam mattered ([LSE](https://researchonline.lse.ac.uk/id/eprint/84510)). The final step used programmes of the order of 100,000 workers (about 129,000 at the peak of the Manhattan Project); that figure reached the notes through a weak source and is approximate ([Wikipedia talk page](https://en.wikipedia.com/wiki/Talk:V-2)). The researcher's reading is that the share of people off the land, and the size of the network in contact, matter more than the number of heads.

## What this means for Eden: one want, several means, and a god who holds what the people cannot reach

Eden's first rule is closer to the historians than any game in the notes. That is the main good news. It also means there is no proven design to lean on; Eden will have to measure its own. Nine conclusions follow from the evidence. They are inferences and design judgements, not findings.

First, keep one want per advance, but let the means differ by land. This is the answer to the Eureka failure. If "flood plus clay" gives the same result on every map, the player will learn a recipe list. History offers the way out: the same want was answered by a water mill where a stream fell and by a windmill where it did not. PLAYER.md already does this for mills. The proposal extends it to energy (coal or falling water) and to rocket fuel (spirit distilled from crops, or kerosene from oil).

Second, give every advance three states: unknown, known, and in use. History's shortages almost never created a technique; they made a known one worth its trouble. Iron was known for 800 years before it was common. ARCHITECTURE.md already says that an idea only enables and that only a standing, staffed building has an effect. The tree should use that fully. A side effect, seen in Songs of Syx, is that knowledge can be lost when the building or the people are gone ([Songs of Syx wiki](https://songsofsyx.com/wiki/index.php/Lab)).

Third, let the land show its materials. Civilization hides iron until a technology reveals it. Eden should do the reverse: a deposit becomes a means when someone has seen it, by digging a well into a seam or because the god opened the ground. This fits rule 1, and it gives the god a job that lasts into the late ages, because coal, oil and bauxite lie hidden.

Fourth, use only prerequisites that history shows as a workshop passed on. A kiln for smelting. Gearing from the mill for the clock. The clockmaker's skill for the lathe. Cold-making for liquid oxygen. Avoid any chain that crosses from one kind of life to another without such a link.

Fifth, treat contact as a means. Paradox's games show three working parts: a thing can spread only if someone has it, it spreads through contact, and the receiver needs the capacity to take it up ([Victoria 3 Dev Diary 27](https://admin-forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-27-technology.1502428); [CK3 Dev Diary 27](https://forum.paradoxplaza.com/forum/threads/ckiii-dev-diary-27-cultures-cultural-innovations.1391886/)). In Eden a neighbour who knows a craft is a means at hand. The want must still be felt.

Sixth, never pool. Dawn of Man's exploit exists because one deed can pay for an unrelated technology. Eden's wants already point at one thing each. Keep it so.

Seventh, the rocket needs a want that the present list does not hold. Cold, hunger and toil do not lead to orbit. In history the last steps were driven by fear of, and pride against, another people. The proposal calls this want **Rivalry**. ARCHITECTURE.md already plans it under step 7 as "danger from people".

Eighth, the god's late work must change. Early on the god gives materials. Late technology removes the limits of place, so material gifts matter less and less; this is how The Universim's player became a manager. In the late ages the god's work should be to show hidden ground, to bring distant things together (a way, a low river, contact between places) and to cause or calm Rivalry.

Ninth, end at one launch. The games that go on after the launch are the ones called slow and repetitive. Factorio and Civ VII end at one event.

## Proposed foundation for Eden's plan

This section is a proposal. Nothing in it is built or measured. Rows marked "built" are copied from Matrix 1 of `docs/PLAYER.md`.

### Nine ages, used as names and never as gates

Rule 1 forbids gating on a settlement level, so Eden cannot use Humankind's Era Stars or the paid "age up" of Age of Empires. An age in Eden is a name read from what the people have. It is useful for three things: choosing sprites (`docs/AGES.md`), telling the player where each people stands, and giving a short race inside each age ("first people to smelt metal") that gates nothing. The eight ages of `docs/AGES.md` are kept, and a ninth is added for the race. The numbers per age stay flat, as in Civilization, and do not swell at the end, as in Humankind.

| Age | The advance that gives it its name | Advances in this proposal |
|---|---|---|
| 1. Camp | Fire | 7 |
| 2. Village | Farming | 13 |
| 3. Bronze town | The first smelted metal | 7 |
| 4. Classical city | Iron | 7 |
| 5. Medieval town | Paper | 7 |
| 6. Early modern city | The testing habit | 5 |
| 7. Industrial city | An engine that turns a wheel | 7 |
| 8. Modern city | Electric light | 10 |
| 9. Rocket age | The first liquid-fuel rocket | 4 |

That is 67 advances: 21 rows built today (20 ideas and the tamed animal), 7 that develop the rows proposed in `docs/PLAYER.md`, and 39 new. For comparison, Civ VI has 68 technologies and Humankind about 90.

### The wants: eleven today, ten more

Each advance has one want as its trigger, so the list of wants is the real base of the tree. Almost all the new wants are already named in Eden's documents.

| Want | Status | Where it comes from | Felt when |
|---|---|---|---|
| Cold, Hunger, Rot, Water, Toil, Danger, Deaths, Reckoning, Quarrels, River, Flood | Built | `src/sim.js`, PLAYER.md Matrix 2 | As today |
| Wear | New | AGES.md "blunt tools"; PLAYER.md "tools wearing out" | Tools break or go blunt faster than they can be remade |
| Fuel | New | AGES.md "fuel short"; PLAYER.md coal row | Wood must be fetched from far away |
| Dark | New | PLAYER.md "fuel short and dark" | Work stops at dusk; lamp fuel is dear |
| Haul | New | AGES.md "heavy loads", "mud" | Loads are too heavy or too slow for carts |
| News | New, not in any Eden document | Printing, telegraph and radio in history | Word arrives too late, or too few copies exist |
| Crowding | New | AGES.md "dear land", "queues at the well" | Too many people for the lots, the well, the street |
| Town fire | New | AGES.md "fires" | Houses burn |
| Barter failing | New | ARCHITECTURE.md step 5 | An exchange fails for want of a matching good |
| Hands short | New | ARCHITECTURE.md step 8, "more goods than hands" | More is wanted than the hands can make |
| Rivalry | New | ARCHITECTURE.md step 7, "danger from people" | Another people threatens us, or is seen to be ahead of us |

One existing want is widened: "River in the way" becomes "Barrier in the way" (a river, then a sea or mountains), so that the bridge and, much later, flight answer the same want.

### Six branches that follow the wants

The surveyed games use 3 to 7 lanes. Eden's lanes should be the families of wants, so that a branch means "the kind of hardship that drives it". The power table in PLAYER.md (Matrix 2) then also tells the player which branch a power pushes or holds back. The rocket needs the tip of every branch, which is how Civilization makes its last step need the whole tree.

| Branch | Wants that drive it | Advances, in order | What it gives the rocket |
|---|---|---|---|
| Food and water | Hunger, Rot, Water, Flood | Pottery, granary, farming, the tamed animal (an event), plough, well, irrigation, cheese, concrete, steam pump, nitrogen from the air, cold-making and liquid air | Stored food; high-pressure plant; liquid oxygen |
| Shelter and town | Cold, Dark, Crowding, Town fire | Fire, hut, house, weaving, masonry, aqueduct and drain, glass, brick and tile, lamp oil, electric power | Glass; electric power; cloth for the parachute |
| Materials and fuel | Wear, Fuel | Copper, mine, bronze, iron, coal, coke iron, machine tools, steel | Steel and parts that fit |
| Power and motion | Toil, Haul, Barrier, Hands short | Tools, cart, bridge, sail, water mill, windmill, paved way, compass, factory, turning steam engine, railway, oil engine, aluminium, flight | Turbines and pumps |
| Records and knowledge | Reckoning, News | Writing, number and calendar, paper, lenses, printing, telegraph, radio, calculating machine | Number; radio |
| People and rivals | Deaths, Danger, Quarrels, Barter failing, Rivalry | Rites, medicine, palisade, council, stone wall, coin, clock, gunpowder, the testing habit, clean water, radar, the four steps of the race | The testing habit; the will to pay for it |

Because a branch follows a want, some advances sit where a tree sorted by subject would not put them. The steam pump is under Food and water because its want is a flood in the pit. The clock is under People and rivals because its want is a quarrel over the hour.

### Advance by advance, from fire to orbit

Marks: ● no land can skip it; ◐ one of two routes; ○ side branch. Status: B built today, P develops a row proposed in PLAYER.md, N new. "Player:" is the power the advance unlocks; those on B and P rows are from PLAYER.md. By law 2 of PLAYER.md (the god gives only what the people already make), every material advance also unlocks the gift of that material; that is not repeated in each row.

| # | Advance | The one want | Means that must be at hand | What it opens | Note from history |
|---|---|---|---|---|---|
| | **Age 1: Camp** | | | | |
| 1 | Fire ● B | Cold | Nothing but fuel | Cooking and every craft that uses heat. Player: Warmth | Kept and carried before it could be made (inference) |
| 2 | Tools ● B | Toil | Fire; stone that can be worked | Masonry, mine. Player: Give stone, Open the ground | |
| 3 | Hut B | Cold | A tent built | House. Player: Give timber | |
| 4 | Pottery ● B | Rot | Fire; clay | Kiln heat, later the granary and smelting. Player: Give clay | Correct as built: pottery came before farming |
| 5 | Rites B | Deaths | Fire | Council, a second settlement. Player: Call strangers | |
| 6 | Medicine B | Deaths | A skilled gatherer | Player: Heal | |
| 7 | Palisade B | Danger | Huts | Later walls. Player: Call or hold the wolves | |
| | **Age 2: Village** | | | | |
| 8 | Granary ● B | Rot | Today: farming, pottery, a hut | Writing. Player: Plenty | Stores came about 1,000 years before crops. Consider: a harvest of wild grain and a hut are enough |
| 9 | Farming ● B | Hunger | A hut | Surplus; everything after. Player: Give grain, Grow | Taken up only under pressure (Boserup) |
| 10 | House B | Cold | A hut built | Masonry. Player: Frost | |
| 11 | A tamed animal (an event) B | None | A herd in reach | Plough, cart, cheese. Player: Drive a herd | |
| 12 | Plough B | Hunger | Farming; a tame beast | Player: Drought | Worth it only when land is short |
| 13 | Well B | Water | A hut | Irrigation. Player: Spring | |
| 14 | Irrigation B | Water | Farming; a well | Player: Heavy rain | Needs a river beside flat, dry land |
| 15 | Cheese B | Rot (milk) | Enough milking | | |
| 16 | Weaving ○ N | Cold | Flax, or the fleece of tame sheep | Cloth, sails, rags for paper, the parachute | No source in the notes (unverified) |
| 17 | Cart B | Toil | A tame beast | Reach, trade. Player: Smooth a way | The wheel waited for copper tools. Consider adding metal tools to the means |
| 18 | Bridge B | Barrier (river) | Huts | The far bank. Player: Low water | |
| 19 | Council B | Quarrels | Someone widely trusted | Shared works. Player: Speak to the speaker | |
| 20 | Masonry B | Cold | Tools; a house | Tall houses, concrete. Player: Give cut stone | |
| | **Age 3: Bronze town** | | | | |
| 21 | Copper ● N | Wear | The potter's kiln; charcoal; copper ore seen at the surface | Metal tools, and so fine carpentry | About 5000 BC; kiln and charcoal link unverified |
| 22 | Mine ● P | Wear | Metal tools; ore shown below ground | Ore in quantity, later coal. Player: Give metal | |
| 23 | Writing ● B | Reckoning | More food than people | Bridges, founding, ore. Player: A sign | Began as accounts, not as stories |
| 24 | Number and calendar ● N | Reckoning | Writing; a shared store to count | Weights, measures, surveying | Arose with writing, for accounts |
| 25 | Bronze ○ N | Wear | Copper; tin, which is rare and usually comes by trade | Harder tools; the first long trade | A land may skip it and go from copper to iron (inference) |
| 26 | Sail ○ N | Haul | Cloth; metal tools; water that can be sailed | Far trade, fishing, tin | Needed things unverified |
| 27 | Stone wall ○ N | Rivalry | Masonry; another settlement near | | ARCHITECTURE.md step 7 |
| | **Age 4: Classical city** | | | | |
| 28 | Iron ● N | Wear | Copper smelting known; charcoal; iron ore | Cheap tools for every household, nails, the iron ploughshare | Known long before it was used: keep it "known" until metal is short |
| 29 | Coin ○ N | Barter failing | Metal; weights; a trusted council | Prices, wages, markets | Cause not settled; ARCHITECTURE.md step 5 |
| 30 | Water mill ◐ P | Toil (at the quern) | Fine carpentry (metal tools); a steady river with fall | Gearing; later bellows, hammers, factories. Player: Wind | |
| 31 | Windmill ◐ P | Toil (at the quern) | Fine carpentry; steady wind; no river in reach | The same. Player: Give flour | Made where streams were weak |
| 32 | Concrete B | Flood | Masonry; fire | Dams, later water power. Player: Hold the river | Rome's used lime and volcanic ash |
| 33 | Paved way ○ N | Haul | Masonry; cart | Faster ways | AGES.md "mud" |
| 34 | Aqueduct and drain ○ N | Crowding | Masonry or concrete; water higher than the town | A larger town | AGES.md "queues at the well" |
| | **Age 5: Medieval town** | | | | |
| 35 | Paper ● P | Reckoning | Writing; reeds or rags; a mill | Cheap records. Player: Give paper | |
| 36 | Glass ● N | Dark | A hot kiln; sand; wood ash | Windows, lenses, later the lamp and the radio valve | Not covered in the notes: a design choice |
| 37 | Lenses ● N | Reckoning (old eyes cannot read the marks) | Glass | Instruments: the telescope followed quickly | Spectacles from about 1300 |
| 38 | Clock ● N | Quarrels (whose turn, what hour) | Gearing from the mill; metal | Fine metal work | Origin weakly sourced; the want is a design choice |
| 39 | Printing ● N | News | Paper; cast metal type; a press; oily ink | Cheap copies; knowledge that adds up | A joining of five older things |
| 40 | Gunpowder ○ N | Rivalry | Saltpetre, sulphur, charcoal (unverified) | Cannon, and the boring of cannon | In history a by-product of alchemy. Depends on question 1 below |
| 41 | Compass ○ N | Haul (lost at sea) | Lodestone; sail | Trade across open sea | |
| | **Age 6: Early modern city** | | | | |
| 42 | Brick and tile ○ N | Town fire | Kiln; clay | Rows that do not burn | AGES.md "fires" |
| 43 | The testing habit (science) ● N | Deaths (healers and rites fail) | Printing; lenses and clocks; a second settlement in contact | Knowing why: steam, chemistry, electricity | History names no single want here. The trigger is a design choice |
| 44 | Coal ◐ P | Fuel | A mine; a seam shown; a way or water to carry it | Heat in quantity. Player: Give coal | Known earlier, used when wood grew dear |
| 45 | Steam pump ◐ P | Flood (in the pit) | Coal at the pit head; a cast metal cylinder; the testing habit | Deeper mines; the engine | It wasted fuel, so it paid only on a coal mine |
| 46 | Coke iron ◐ N | Fuel | Coal; iron ore near; bellows driven by water or steam | Iron in quantity | On the water route, iron made with charcoal and water-driven bellows must serve instead (inference) |
| | **Age 7: Industrial city** | | | | |
| 47 | Machine tools ● N | Wear (parts made by hand do not fit) | Iron in quantity; clockmakers; power from a mill or an engine | Parts that fit: every later machine | |
| 48 | Factory ○ N | Hands short | Weaving; gearing; a river with fall, later steam | Factory work, workers' rows | The first factories ran on water |
| 49 | Turning steam engine ◐ N | Toil (no river with fall in reach) | Steam pump; bored cylinders; coal | Power anywhere | A land rich in falling water may skip it (inference) |
| 50 | Railway ○ N | Haul | Iron in quantity; a turning steam engine | Coal brought to ore | No source retrieved (unverified) |
| 51 | Telegraph ○ N | News | Railway; copper wire; a battery (unverified) | Electrical craft | First used for railway signals |
| 52 | Steel ● N | Wear | Iron in quantity; a converter that blows air through it | Pressure vessels, turbines, tall frames | Price figures in the notes are uncertain |
| 53 | Clean water and sewers ○ N | Deaths | The testing habit; iron pipe | A larger, healthier town | |
| | **Age 8: Modern city** | | | | |
| 54 | Lamp oil from the ground ◐ N | Dark | An oil seep shown; drilling with steel pipe | Kerosene: one of two rocket fuels | Oil was first wanted for light |
| 55 | Electric power ● P | Dark | The testing habit; copper wire; a turning engine, or a concrete dam on a strong river | Light; power far from the river. Player: Light | Fifty years from principle to supply |
| 56 | Oil engine ○ N | Haul | Lamp oil; machine tools | A light engine | |
| 57 | Nitrogen from the air ● N | Hunger (the soil is spent) | Steel pressure vessels; coal or electric power; the testing habit | High-pressure plant, the ancestor of the rocket's pumps (inference) | Needed things unverified |
| 58 | Cold-making and liquid air ● N | Rot (food for a large town spoils) | Electric power; steel; machine tools | Liquid oxygen | Linde's start in refrigeration is unverified |
| 59 | Aluminium ○ N | Haul (iron is heavy) | Bauxite shown; very cheap electric power | Light frames | Steel tanks may do instead (unverified) |
| 60 | Radio ● N | News | Electric power; glass | Tracking; the satellite's voice | No source retrieved (unverified) |
| 61 | Flight ○ N | Barrier (sea, mountains) | An oil engine; a light frame | Knowledge of air flow | It waited for a light engine |
| 62 | Radar ○ N | Rivalry | Radio | | Driven by war |
| 63 | Calculating machine ○ N | Reckoning | Electric power; radio valves | Fast tables | Driven by war; orbits can be worked by hand, slowly (unverified) |
| | **Age 9: Rocket age** | | | | |
| 64 | Liquid-fuel rocket ● N | Rivalry | Liquid oxygen; a fuel (spirit distilled from crops, or kerosene); steel; machine tools | Step 1 of the race | Goddard, 1926 |
| 65 | Great rocket ● N | Rivalry | A rocket flown; high-pressure pumps; a gyroscope (the clockmaker's skill); a launch works | Step 2 | In history a weapon paid for by a state |
| 66 | Satellite ● N | Rivalry | A great rocket flown; radio | Step 3 | 1957: a by-product of a weapon |
| 67 | A person in orbit ● N | Rivalry | A satellite flown; a sealed cabin; a heat shield; a parachute | The game ends | 1961 |

About half of the tree lies on the road to orbit: 27 advances that every land needs (the 26 marked ● and one mill of either kind), plus one of two energy routes (coal, steam pump, coke iron and the turning engine; or falling water through the mill and the dam) and one of two fuels. The other half is side branches that a land may never feel the want for. This is close to Civilization's proportions for the first launch, but in Eden the unused half stays truly unused.

Nuclear power is left out. History shows it is not on the road to orbit, though the heavy bomb is the reason the Soviet rocket was large enough to carry a satellite.

### The race in four visible steps

The last four advances are the race. Each should be a thing built on a lot in fixed stages from goods the people already make, like any other building under rule 2, so that the whole chain feeds it, as in Factorio. Each completed step should be announced to every people on the map and visible on the ground, because the quiet race is the named weakness of Civ VI. Seeing a rival's step should raise Rivalry in the people who are behind; Humankind does something similar when a rival enters a new age first ([PC Gamer](https://pcgamer.com/humankind-fame-era-stars)). Between steps the god should have work that only the god can do: show the oil, hold the river for the dam, open a way to the ore, or turn the people's eyes to the rival's launch works. The game should end at step 4 with a scene. Reviewers of Civ VII noticed when the payoff was missing ([Aftermath](https://aftermath.site/civilization-vii-review/)).

### Pitfalls to design against

| Pitfall | Evidence | Guard for Eden |
|---|---|---|
| Checklist triggers | Civ VI Eurekas: the same tasks in the same order every game | One want, several means. The land decides which means exists. Measure wants where they are felt; never count deeds |
| Manufactured events | Dawn of Man: build five, tear down, collect the point | No shared pool. A want caused by the god must really be felt: a frost kills, and the dead are in the score. Law 3 of PLAYER.md (every power feeds one want and starves another) is the main guard |
| Late-game drag | Fewer than half finished Civ VI; The Universim "flattens out"; Humankind has 28 technologies in its last age | Flat numbers per age, only 4 in the last. End at the first person in orbit, with nothing after. A short "first people to" race in every age |
| The player feels unnecessary | The Universim: the god is optional. Eden's own test in PLAYER.md: a helping god gave lower mean populations (66, 146 and 179 against 249), on only nine worlds | The god holds means the people cannot reach alone: hidden deposits, barriers, contact between places. Powers grow with the people (law 2). Over-giving has a cost, as in Reus |
| The reason cannot be seen | Crest; From Dust; the "feels random" complaint against EU4 and Stellaris | Johnson's test: for every advance not yet made, the Town panel shows which want is too low or which means is missing |
| Chains without a cause | Mysticism before Robotics; chivalry before particle physics; a landlocked Civ VI people forced to learn sailing | A means must be a material, a place, or a workshop passed on |
| A hidden head count | Anno's population thresholds; Dawn of Man's population steps; the population ladder in the history notes, which is the researcher's estimate and not from a source | Never write "needs N people". Write the cause: a household that can be fed without farming; a second settlement in contact |
| A quiet or sudden finish | Civ VI gives no notice of rivals' steps; Civ VII ends without warning | Four named steps, each announced, each leaving time to answer |
| Running out early | WorldBox reached full development in about an hour; KSP's tree falls to a few percent of the science | Measure the year each advance arrives with no player, as PLAYER.md already asks, before fixing any threshold |
| One road for everyone | The scholars' objection to every fixed tree | Different lands give different orders. Some peoples never arrive. Side branches stay unused |

### Planned rules this proposal would add

`CLAUDE.md` asks that planned rules be named plainly. If this proposal is adopted, these would go under "Planned on purpose" in `docs/ARCHITECTURE.md`: the nine age names and the advance that names each (a display label, gating nothing); the stages and material costs of the launch works and of each rocket (rule 2); the amount of each new want that an advance takes (`IDEAS[k].at`); which deposits lie hidden until seen; the pairing of each advance with a player power (law 2 of PLAYER.md); and, if adopted, any rule that lets game time run faster when little is changing. Nothing has been added to that file.

### Open questions for the owner

| # | Question | Why it matters | Suggested answer |
|---|---|---|---|
| 1 | Are there other peoples on the same map, and is there fighting between them? | "First to space" and the Rivalry want both need someone to be first against. Gunpowder, the stone wall and radar depend on the answer | At least one other people, run by the same simulation. Rivalry can come from being outdone as well as from raids, so the race works even without war |
| 2 | Is "one want, several possible means" acceptable under law 1? | It is the main guard against a recipe list | Yes |
| 3 | May one want trigger several advances at rising levels? | In the table Reckoning triggers five, Wear six and Rivalry seven | Yes, as PLAYER.md already does for paper. Otherwise the list of wants must grow |
| 4 | Which of the ten new wants are accepted? | They are the base of the late tree. "News" is the only one not already in an Eden document | All ten; at the least Wear, Fuel, Dark, Haul and Rivalry |
| 5 | Where does the game end? | Games that go on after the launch are called slow | At the first person in orbit, and nothing after |
| 6 | Can a people learn an advance from a neighbour, and must it still feel the want? | Decides whether the peoples drift apart or pull level | Contact counts as a means. The want is still needed |
| 7 | Can an advance be known but unused, and can it be lost? | History's shortages worked on known things. Loss gives setbacks | Three states. Loss only when no person who can do it is left alive |
| 8 | Must every land be able to finish? | A land with no river has no flood, so no concrete today (PLAYER.md) | No, but every land should have at least one route, by trade or by the god if need be |
| 9 | Should the built rows follow history's order? | Granary before farming; metal tools before the cart | Change the granary. Leave the cart as it is |
| 10 | What stands in for the size of a great power? | Eden has hundreds of people; history needed about 100,000 workers | Households fed without farming, and settlements in contact; never a head count |
| 11 | Are gunpowder, flight and nuclear power in the tree? | All three can be skipped on the road to orbit | Flight in, as a side branch. The other two only if question 1 brings war |
| 12 | What does the god give in the late ages? | Material gifts matter less once the people make steel and power | Showing hidden ground, joining distant things, and causing or calming Rivalry |
| 13 | How are nine ages of buildings to be drawn? | Sprite spending is at $7.48 of the $8.00 cap | Recolours and code-drawn buildings, as AGES.md already plans |

## Conclusion

The research changes the question. It began as "how should Eden's tree be laid out", and the games answer that with graphs and prices. History and the reviews answer something else: what matters is not the layout but who holds the last missing means. In history it was the land, the workshop next door, or a frightened state. In the god games that kept their players it was the god. Eden's tree will work if, at every step from fire to orbit, the people supply the want and the player still holds something the people cannot reach alone.

The first step is not to build any of the 39 new rows. It is the measurement that `docs/PLAYER.md` already asks for: the year each of the 20 built advances arrives with no player, on ten worlds. If gifts and trials cannot move those years by more than the spread between worlds, a longer tree will only make a longer wait, which is the one failure the evidence shows most clearly.
