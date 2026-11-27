# Eden: run tables

Every step records the standard table here: 5 lands x seeds 1 and 2, 100 years, the game's own world options
(`resettle`, `startT 0.3`, `dayCycle 4`, `family`). Produce it by serving the folder and opening `/table.html`;
the markdown at the bottom of that page is what is pasted here.

Columns: population at years 25, 50 and 100; peak population; dwellings standing at year 100; deaths from hunger
(including cold and hunger); times the valley emptied and was resettled; ideas known at year 100; deer/rabbits/wolves
alive at year 100; milliseconds for the run. Steps add their own columns after these.

## Baseline (commit f6edd2f, before phase A)

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 10 | 17 | 12 | 34 | 5 | 75 | 0 | 11 | 20/1/0 | 1154 |
| valley | 2 | 14 | 12 | 19 | 31 | 7 | 54 | 0 | 10 | 14/1/2 | 1012 |
| plains | 1 | 15 | 13 | 15 | 19 | 5 | 48 | 0 | 9 | 0/10/0 | 1008 |
| plains | 2 | 8 | 8 | 33 | 37 | 8 | 60 | 0 | 11 | 2/19/0 | 906 |
| forest | 1 | 15 | 20 | 35 | 56 | 12 | 86 | 0 | 10 | 1/45/0 | 827 |
| forest | 2 | 19 | 20 | 42 | 42 | 13 | 29 | 0 | 12 | 1/3/0 | 877 |
| lakeland | 1 | 21 | 22 | 13 | 32 | 6 | 62 | 0 | 10 | 0/26/0 | 746 |
| lakeland | 2 | 20 | 19 | 37 | 51 | 11 | 87 | 0 | 12 | 9/8/2 | 838 |
| highland | 1 | 17 | 36 | 28 | 39 | 14 | 72 | 0 | 13 | 1/36/0 | 766 |
| highland | 2 | 11 | 16 | 18 | 28 | 8 | 56 | 0 | 10 | 0/1/0 | 636 |
| mean |  | 15 | 18.3 | 25.2 | 36.9 | 8.9 | 62.9 | 0 | 10.8 |  | 877 |

Tests at baseline: 212 passed, 0 failed, 1 warning (forest #3 emptied once and was resettled), 3 skipped.

## A2: free() searches in rings, raised() guarded

| valley | 1 | 10 | 17 | 12 | 34 | 5 | 75 | 0 | 11 | 20/1/0 | 1153 |
| valley | 2 | 14 | 12 | 19 | 31 | 7 | 54 | 0 | 10 | 14/1/2 | 1047 |
| plains | 1 | 15 | 13 | 15 | 19 | 5 | 48 | 0 | 9 | 0/10/0 | 927 |
| plains | 2 | 8 | 8 | 33 | 37 | 8 | 60 | 0 | 11 | 2/19/0 | 866 |
| forest | 1 | 15 | 20 | 35 | 56 | 12 | 86 | 0 | 10 | 1/45/0 | 823 |
| forest | 2 | 19 | 20 | 42 | 42 | 13 | 29 | 0 | 12 | 1/3/0 | 922 |
| lakeland | 1 | 21 | 22 | 13 | 32 | 6 | 62 | 0 | 10 | 0/26/0 | 795 |
| lakeland | 2 | 20 | 19 | 37 | 51 | 11 | 87 | 0 | 12 | 9/8/2 | 843 |
| highland | 1 | 17 | 36 | 28 | 39 | 14 | 72 | 0 | 13 | 1/36/0 | 751 |
| highland | 2 | 11 | 16 | 18 | 28 | 8 | 56 | 0 | 10 | 0/1/0 | 789 |
| mean |  | 15 | 18.3 | 25.2 | 36.9 | 8.9 | 62.9 | 0 | 10.8 |  | 891.6 |

Identical to the baseline, as expected: the ring search only runs after 60 failed random tries, which never happens at 40x40, and the guard adds no random calls. Tests: 257 passed, 0 failed, 1 warning (forest #3 resettled once, as before), 4 skipped. New: per-tick 'nobody on water' check over 100 years on lakeland #1, S.problems must stay empty, two unit checks (unknown site kind is reported, not a crash; moveTo into deep water lands on dry ground).

## A3: newSettlement() constructor

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 10 | 17 | 12 | 34 | 5 | 75 | 0 | 11 | 20/1/0 | 1339 |
| valley | 2 | 14 | 12 | 19 | 31 | 7 | 54 | 0 | 10 | 14/1/2 | 1009 |
| plains | 1 | 15 | 13 | 15 | 19 | 5 | 48 | 0 | 9 | 0/10/0 | 1090 |
| plains | 2 | 8 | 8 | 33 | 37 | 8 | 60 | 0 | 11 | 2/19/0 | 834 |
| forest | 1 | 15 | 20 | 35 | 56 | 12 | 86 | 0 | 10 | 1/45/0 | 905 |
| forest | 2 | 19 | 20 | 42 | 42 | 13 | 29 | 0 | 12 | 1/3/0 | 803 |
| lakeland | 1 | 21 | 22 | 13 | 32 | 6 | 62 | 0 | 10 | 0/26/0 | 866 |
| lakeland | 2 | 20 | 19 | 37 | 51 | 11 | 87 | 0 | 12 | 9/8/2 | 922 |
| highland | 1 | 17 | 36 | 28 | 39 | 14 | 72 | 0 | 13 | 1/36/0 | 761 |
| highland | 2 | 11 | 16 | 18 | 28 | 8 | 56 | 0 | 10 | 0/1/0 | 700 |
| mean |  | 15 | 18.3 | 25.2 | 36.9 | 8.9 | 62.9 | 0 | 10.8 |  | 922.9 |

Identical to A2 in every row: no world in the table empties, so the resettle path is not exercised here. It is exercised by forest #3 in the test grid, which now forgets more on resettling (trades, births and deaths counters, hunt timers) and ends differently (no animals left at year 40: a soft warning). New unit check: after a forced wipe-out and resettle, every settlement field equals a fresh one's, and the object is the same one the view holds. Tests: 257 passed, 0 failed, 2 warnings (both forest #3), 4 skipped.

## A4: scenarios

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 10 | 17 | 12 | 34 | 5 | 75 | 0 | 11 | 20/1/0 | 1237 |
| valley | 2 | 14 | 12 | 19 | 31 | 7 | 54 | 0 | 10 | 14/1/2 | 1175 |
| plains | 1 | 15 | 13 | 15 | 19 | 5 | 48 | 0 | 9 | 0/10/0 | 1070 |
| plains | 2 | 8 | 8 | 33 | 37 | 8 | 60 | 0 | 11 | 2/19/0 | 874 |
| forest | 1 | 15 | 20 | 35 | 56 | 12 | 86 | 0 | 10 | 1/45/0 | 862 |
| forest | 2 | 19 | 20 | 42 | 42 | 13 | 29 | 0 | 12 | 1/3/0 | 1287 |
| lakeland | 1 | 21 | 22 | 13 | 32 | 6 | 62 | 0 | 10 | 0/26/0 | 686 |
| lakeland | 2 | 20 | 19 | 37 | 51 | 11 | 87 | 0 | 12 | 9/8/2 | 884 |
| highland | 1 | 17 | 36 | 28 | 39 | 14 | 72 | 0 | 13 | 1/36/0 | 713 |
| highland | 2 | 11 | 16 | 18 | 28 | 8 | 56 | 0 | 10 | 0/1/0 | 588 |
| mean |  | 15 | 18.3 | 25.2 | 36.9 | 8.9 | 62.9 | 0 | 10.8 |  | 937.6 |

Identical to A3: the levers add no random calls and are off in normal play. Scenarios (/scenarios.html, seeds 1 and 2): 20 passed, 0 failed, 0 warnings. held30: peaks 27 and 19 people at year 100. Deforest (forest, year 10): need.cold rises in both seeds already today, because the fire's wood comes from trees within 5 tiles of the camp. Drought: 7 and 9 people at year 50. No wolves: no wolf returns, nobody taken. No stone (highland): 11 and 7 dwellings, stone carried up from the water's edge instead.

## A5: save and load

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 10 | 17 | 12 | 34 | 5 | 75 | 0 | 11 | 20/1/0 | 1144 |
| valley | 2 | 14 | 12 | 19 | 31 | 7 | 54 | 0 | 10 | 14/1/2 | 1020 |
| plains | 1 | 15 | 13 | 15 | 19 | 5 | 48 | 0 | 9 | 0/10/0 | 939 |
| plains | 2 | 8 | 8 | 33 | 37 | 8 | 60 | 0 | 11 | 2/19/0 | 932 |
| forest | 1 | 15 | 20 | 35 | 56 | 12 | 86 | 0 | 10 | 1/45/0 | 868 |
| forest | 2 | 19 | 20 | 42 | 42 | 13 | 29 | 0 | 12 | 1/3/0 | 814 |
| lakeland | 1 | 21 | 22 | 13 | 32 | 6 | 62 | 0 | 10 | 0/26/0 | 747 |
| lakeland | 2 | 20 | 19 | 37 | 51 | 11 | 87 | 0 | 12 | 9/8/2 | 851 |
| highland | 1 | 17 | 36 | 28 | 39 | 14 | 72 | 0 | 13 | 1/36/0 | 761 |
| highland | 2 | 11 | 16 | 18 | 28 | 8 | 56 | 0 | 10 | 0/1/0 | 625 |
| mean |  | 15 | 18.3 | 25.2 | 36.9 | 8.9 | 62.9 | 0 | 10.8 |  | 870.1 |

Identical to A4. Two settlement defaults changed from undefined to a value with the same meaning (lastCampT -1e9, waterDist null) so that a saved world's key order matches an unbroken one's. Unit check: save at year 20, load, run 20 more, and the whole saved state is byte-for-byte identical to an unbroken 40-year run (lakeland seeds 1 and 2; also checked by hand on valley, forest and lakeland seeds 1 to 3). A save is 200 to 330 KB at 40x40. In the browser: autosave once a game year to localStorage; the opening card shows 'Continue the saved valley' when a save exists; continuing restored tick 288 exactly and ran on with a clean console. Tests: 258 passed, 0 failed, 2 warnings (forest #3), 4 skipped. Scenarios: 20 passed.

## A6: long lines broken up (formatting only)

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 10 | 17 | 12 | 34 | 5 | 75 | 0 | 11 | 20/1/0 | 1187 |
| valley | 2 | 14 | 12 | 19 | 31 | 7 | 54 | 0 | 10 | 14/1/2 | 972 |
| plains | 1 | 15 | 13 | 15 | 19 | 5 | 48 | 0 | 9 | 0/10/0 | 908 |
| plains | 2 | 8 | 8 | 33 | 37 | 8 | 60 | 0 | 11 | 2/19/0 | 872 |
| forest | 1 | 15 | 20 | 35 | 56 | 12 | 86 | 0 | 10 | 1/45/0 | 951 |
| forest | 2 | 19 | 20 | 42 | 42 | 13 | 29 | 0 | 12 | 1/3/0 | 1038 |
| lakeland | 1 | 21 | 22 | 13 | 32 | 6 | 62 | 0 | 10 | 0/26/0 | 734 |
| lakeland | 2 | 20 | 19 | 37 | 51 | 11 | 87 | 0 | 12 | 9/8/2 | 956 |
| highland | 1 | 17 | 36 | 28 | 39 | 14 | 72 | 0 | 13 | 1/36/0 | 859 |
| highland | 2 | 11 | 16 | 18 | 28 | 8 | 56 | 0 | 10 | 0/1/0 | 675 |
| mean |  | 15 | 18.3 | 25.2 | 36.9 | 8.9 | 62.9 | 0 | 10.8 |  | 915.2 |

Identical to A5 in every row and every log. The change was made by a parser-driven tool that only inserts line breaks and indentation, and the syntax trees of sim.js and view.js (positions removed) were compared before and after: identical. No line in either file is now over 200 characters (sim.js 90 such lines before, view.js 110). Tests: 258 passed, 0 failed, 2 warnings, 4 skipped (determinism rerun included).

## B1: work from your own door

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 5 | 28 | 44 | 55 | 14 | 51 | 0 | 12 | 7/0/0 | 6.8 | 15.5 | 5.4 | 1638 |
| valley | 2 | 20 | 19 | 52 | 52 | 16 | 56 | 0 | 12 | 1/26/0 | 6.7 | 3.2 | 6.6 | 1663 |
| plains | 1 | 13 | 46 | 30 | 51 | 11 | 82 | 0 | 14 | 0/21/0 | 4.9 | 22.9 | 12.3 | 1866 |
| plains | 2 | 10 | 37 | 44 | 53 | 15 | 58 | 1 | 12 | 9/0/0 | 5.3 | 17.4 | 8.4 | 1728 |
| forest | 1 | 6 | 27 | 62 | 65 | 20 | 40 | 1 | 12 | 2/1/0 | 6.6 | 4.6 | 7.2 | 1363 |
| forest | 2 | 19 | 42 | 62 | 65 | 18 | 53 | 0 | 11 | 0/24/0 | 6.7 | 3.7 | 7.2 | 1155 |
| lakeland | 1 | 15 | 55 | 90 | 92 | 22 | 45 | 0 | 13 | 0/0/0 | 8.6 | 14.9 | 6.2 | 1376 |
| lakeland | 2 | 22 | 69 | 144 | 145 | 41 | 51 | 0 | 14 | 1/4/0 | 7.8 | 9 | 7.3 | 1814 |
| highland | 1 | 11 | 24 | 26 | 39 | 10 | 62 | 0 | 13 | 0/0/0 | 6.3 | 13.1 | 4.7 | 842 |
| highland | 2 | 7 | 25 | 25 | 40 | 9 | 56 | 0 | 14 | 1/18/0 | 6.3 | 0 | 3.1 | 847 |
| mean |  | 12.8 | 37.2 | 57.9 | 65.7 | 17.6 | 55.4 | 0.2 | 12.7 |  | 6.6 | 10.4 | 6.8 | 1429.2 |

Large change, upward. Mean population at year 100 is 57.9 against 25.2 (peak 65.7 against 36.9); hunger deaths fall slightly (55.4 against 62.9). The cause: food was gathered within 7 tiles of the one fire; now each household searches from its own door, so a village of many roofs works much more ground. Nothing compensates by raising yields. Food trips average 6.6 tiles along the ways (plan's check: under 8); only lakeland #1, the 100-year 90-person town, averages 8.6. Distance is along the ways, or straight across open ground at 1.5 times the cost per tile when that is shorter (without this, a tile beside one's own door counted 8 tiles away). WALK = 6 kept as designed: WALK 4 gave mean year-100 population 37 and trips 8.8, WALK 3 gave 28 and 7.9 with year-25 populations of 4.5. Timber and stone are taken from the nearest tile along the ways anywhere on the map (no radius), and a trip brings back less the further it goes. Lakeland #1 has no animals left at year 100 (hunted out by 90 people); ecology is phase D5. Scenarios: 20 passed; held30 now sits at its cap of 30 with 3 hunger deaths in 100 years (60 and 70 before). Tests: 266 passed, 0 failed, 4 warnings (two resettled worlds, lakeland 100-year animals and trip 8.6), 4 skipped.

## B2: firewood is a household trip

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 5 | 30 | 43 | 53 | 13 | 39 | 0 | 14 | 5/23/0 | 6.2 | 19.5 | 5.4 | 28.3 | 1520 |
| valley | 2 | 18 | 36 | 40 | 66 | 14 | 76 | 0 | 12 | 4/3/0 | 6.6 | 3.2 | 6.6 | 13.8 | 1591 |
| plains | 1 | 18 | 27 | 34 | 34 | 6 | 49 | 0 | 13 | 2/8/0 | 5.4 | 5.3 | 12.8 | 25.1 | 1321 |
| plains | 2 | 10 | 31 | 50 | 51 | 11 | 50 | 1 | 12 | 0/56/0 | 5.6 | 39.6 | 6.9 | 22.4 | 1522 |
| forest | 1 | 9 | 32 | 56 | 64 | 17 | 49 | 0 | 13 | 1/1/0 | 7 | 0 | 6.3 | 14.9 | 1515 |
| forest | 2 | 18 | 52 | 46 | 58 | 20 | 44 | 0 | 12 | 4/13/0 | 6.5 | 4.1 | 7.8 | 13.7 | 1517 |
| lakeland | 1 | 21 | 43 | 83 | 83 | 20 | 77 | 0 | 14 | 0/9/0 | 8 | 21.1 | 7.4 | 31.1 | 1296 |
| lakeland | 2 | 24 | 72 | 84 | 112 | 24 | 95 | 0 | 13 | 1/8/0 | 7.9 | 0 | 6.4 | 24.7 | 1825 |
| highland | 1 | 9 | 26 | 25 | 33 | 11 | 42 | 1 | 12 | 3/0/0 | 6.1 | 6.5 | 4.3 | 21.4 | 936 |
| highland | 2 | 7 | 33 | 27 | 35 | 12 | 46 | 0 | 13 | 2/13/0 | 6.4 | 0 | 2.8 | 25.4 | 780 |
| mean |  | 13.9 | 38.2 | 48.8 | 58.9 | 14.8 | 56.7 | 0.2 | 12.8 |  | 6.6 | 9.9 | 6.7 | 22.1 | 1382.3 |

Population a little below B1 (year 100 mean 48.8 against 57.9, peak 58.9 against 65.7) and still about twice the baseline; hunger deaths about the same (56.7 against 55.4). Each household now fetches wood for its own hearth from the nearest trees along the ways, and the fire only warms while that hearth has wood. A wood trip brings back less the further it goes, and a long one takes the day that would have gone to food. Firewood trips average 22 tiles by year 100 (new column 'wood trip'): the trees round the houses are gone first, as intended. In 100-year runs, hearths are lit on about 43% of cold steps in valley #1, 56% in forest #1 and under 5% in plains #1 after year 60, where the few trees have been burned. Scenarios: 21 passed, 1 warning. The deforest scenario's need.cold rises in both seeds; its new check 'hearths are lit less often once the wood round them is gone' holds in seed 2 (96% to 85%) but not seed 1 (48% to 59%, fire still being taken up in years 7-9). Tests: 268 passed, 0 failed, 2 warnings, 4 skipped; a new check that every larder and hearth's fuel stays finite and non-negative.

## B3: eat at home

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 5 | 25 | 43 | 48 | 16 | 40 | 0 | 13 | 2/9/0 | 6.3 | 19 | 6.1 | 25.3 | 16 | 1.2 | 1654 |
| valley | 2 | 23 | 63 | 68 | 77 | 18 | 70 | 0 | 12 | 3/12/0 | 6.1 | 3.2 | 6.5 | 18.4 | 43 | 1.1 | 2126 |
| plains | 1 | 18 | 35 | 33 | 45 | 8 | 64 | 0 | 13 | 2/71/0 | 5.1 | 19.8 | 11.5 | 23.4 | 18 | 0.9 | 1422 |
| plains | 2 | 10 | 36 | 42 | 48 | 11 | 58 | 1 | 12 | 4/36/0 | 5.6 | 37.7 | 6.9 | 24.5 | 17 | 0.8 | 1717 |
| forest | 1 | 16 | 53 | 56 | 80 | 25 | 69 | 0 | 13 | 0/8/0 | 6.7 | 0 | 6.9 | 16.4 | 66 | 0.9 | 1660 |
| forest | 2 | 19 | 56 | 63 | 63 | 19 | 37 | 0 | 14 | 0/1/0 | 6.8 | 4.2 | 7.2 | 13.2 | 34 | 1 | 1624 |
| lakeland | 1 | 19 | 33 | 68 | 80 | 21 | 55 | 0 | 12 | 4/19/2 | 8.1 | 37.3 | 7.4 | 30.3 | 26 | 0.8 | 1283 |
| lakeland | 2 | 26 | 65 | 122 | 124 | 34 | 82 | 0 | 13 | 0/1/0 | 7.9 | 0 | 7.3 | 24 | 27 | 1.1 | 1870 |
| highland | 1 | 10 | 23 | 29 | 30 | 7 | 53 | 1 | 12 | 0/30/0 | 6.5 | 6.5 | 4.9 | 19.4 | 18 | 1 | 923 |
| highland | 2 | 11 | 24 | 24 | 32 | 11 | 55 | 0 | 13 | 0/9/0 | 5.9 | 12.3 | 2.7 | 24.6 | 13 | 0.9 | 890 |
| mean |  | 15.7 | 41.3 | 54.8 | 62.7 | 17 | 58.3 | 0.2 | 12.7 |  | 6.5 | 14 | 6.7 | 22 | 27.8 | 1 | 1516.9 |

About the same as B2 (year 100 mean 54.8 against 48.8; seeds shift because the random stream changed). The common store is now eaten only beside the fire: someone whose own larder is empty walks to the fire to eat, and that is their day. Hungry next to full: in every world some household with an empty larder had a full one on the next lot (mean 27.8 household-years per 100-year run; new column 'hungry by full'). No starvation at the edge: the starved lived on average as far from the fire as households in general (new column 'starved out/avg', mean 1.0, range 0.6 to 1.2). Moving small children to their own door as well cost about 5 people at year 100 on highland and valley (4 seeds) and is not done; they still play by the fire. Tests: 268 passed (new unit: everyone who ate from the store was beside the fire), 0 failed, 3 warnings (food trips 8.1 and 8.2 in two big towns; one resettle), 4 skipped. Scenarios: 22 passed.

## Water: fords, bridges, fishing from the bank (owner's report: the town ignored water)

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 20 | 45 | 58 | 68 | 21 | 47 | 0 | 13 | 3/36/0 | 6 | 13.8 | 7.1 | 20.9 | 39 | 0.9 | 5 | 2 | 2042 |
| valley | 2 | 16 | 33 | 66 | 69 | 18 | 57 | 0 | 14 | 0/11/0 | 6.7 | 8.1 | 7.2 | 16.4 | 27 | 1 | 2 | 0 | 1929 |
| plains | 1 | 7 | 15 | 26 | 33 | 9 | 47 | 1 | 13 | 2/13/0 | 5.6 | 24.6 | 11.4 | 24.3 | 2 | 0.8 | 1 | 4 | 1558 |
| plains | 2 | 2 | 19 | 32 | 44 | 11 | 35 | 1 | 13 | 2/122/2 | 5.9 | 26.4 | 8.3 | 31.3 | 22 | 1 | 3 | 1 | 1681 |
| forest | 1 | 7 | 26 | 80 | 90 | 24 | 31 | 0 | 14 | 2/0/0 | 6.9 | 0 | 5.5 | 10.6 | 26 | 0.9 | 5 | 0 | 1337 |
| forest | 2 | 17 | 58 | 67 | 75 | 20 | 54 | 0 | 14 | 1/1/0 | 6.6 | 4 | 7.9 | 13.8 | 20 | 0.9 | 2 | 0 | 1811 |
| lakeland | 1 | 8 | 36 | 47 | 62 | 6 | 44 | 1 | 13 | 0/29/0 | 5.9 | 0 | 2.8 | 19.8 | 34 | 0.4 | 3 | 0 | 1359 |
| lakeland | 2 | 13 | 42 | 54 | 90 | 10 | 73 | 0 | 14 | 13/9/2 | 6.3 | 0 | 5.3 | 19.5 | 12 | 0.9 | 3 | 7 | 1781 |
| highland | 1 | 5 | 27 | 28 | 38 | 13 | 47 | 0 | 13 | 1/0/0 | 6.3 | 13.3 | 3.8 | 21.9 | 14 | 1.2 | 2 | 0 | 876 |
| highland | 2 | 8 | 17 | 25 | 27 | 7 | 37 | 0 | 13 | 0/0/0 | 6.2 | 0 | 3.2 | 20 | 2 | 0.9 | 3 | 0 | 1096 |
| mean |  | 10.3 | 31.8 | 48.3 | 59.6 | 13.9 | 47.2 | 0.3 | 13.4 |  | 6.2 | 9 | 6.2 | 19.9 | 19.8 | 0.9 | 2.9 | 1.4 | 1547 |

Year 100 mean 48.3 against 54.8 at B3 in this table; over 4 seeds x 5 lands the year-100 means are 52.6 against 50.9 at B3, and over 6 seeds x 5 lands 52.8 against 53.3. What changed: dry ground is split into masses by water; distance to the other bank goes by a ford (3 + 3 tiles per tile of water waded) and only while the river is below 1.4 (about two thirds of the time in valley #1); a lot or field across water is as far as the way round, and fields are never sown across water. Fish are caught only from the bank, and fish now swim between water tiles (without that, shore-only fishing cut year-100 population to 31). Each wading trip is remembered at its ford and felt as the want 'cross'; once that want is felt enough (and huts are known) the idea 'bridge' comes, and a bridge is laid where the wading was worst that year: 2.9 bridges per 100-year run on average, the first by year 10 to 36 in valley seeds 1 to 8. Dwellings on another bank than the fire: 1.4 per run. Camp choice now also weighs room to range on foot (the size of the bank), and newcomers to an emptied valley choose their spot afresh: without this, valley #1 and plains #1 emptied 7 and 6 times on a small bank cut off by high water. The view walks people over fords only in low water and over bridges, and draws bridges (code-drawn logs, no generated art). Tests: 278 passed, 0 failed (new: fields on their household's bank; ford, high-water and bridge distances), 4 warnings, 4 skipped. Scenarios: 21 passed, 1 warning (deforest #2 hearths stay lit, 100% to 100%).

## B4: lots have owners

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 20 | 52 | 68 | 77 | 18 | 46 | 0 | 13 | 1/43/0 | 5.8 | 5.4 | 7.8 | 20.6 | 41 | 0.9 | 51469 | 5 | 2 | 2518 |
| valley | 2 | 16 | 20 | 83 | 83 | 21 | 32 | 0 | 14 | 6/9/0 | 6.5 | 4.3 | 6.9 | 14 | 14 | 1 | 32031 | 5 | 0 | 1914 |
| plains | 1 | 7 | 30 | 45 | 46 | 10 | 36 | 1 | 13 | 0/17/0 | 5.4 | 14.2 | 10.3 | 22.7 | 7 | 0.9 | 65 | 2 | 3 | 1895 |
| plains | 2 | 5 | 25 | 31 | 48 | 12 | 52 | 1 | 14 | 0/30/0 | 5.8 | 27.8 | 6.7 | 28.9 | 6 | 1.1 | 69 | 4 | 2 | 1466 |
| forest | 1 | 6 | 29 | 90 | 93 | 21 | 26 | 0 | 13 | 1/1/0 | 7 | 0 | 6.3 | 9.5 | 14 | 0.7 | 54530 | 5 | 2 | 1434 |
| forest | 2 | 17 | 52 | 96 | 96 | 30 | 35 | 0 | 13 | 2/31/0 | 6.1 | 4 | 8.2 | 13.3 | 36 | 0.9 | 8605 | 5 | 3 | 1514 |
| lakeland | 1 | 8 | 36 | 47 | 62 | 6 | 44 | 1 | 13 | 0/29/0 | 5.9 | 0 | 2.8 | 19.8 | 34 | 0.4 | 7819 | 3 | 0 | 1402 |
| lakeland | 2 | 13 | 42 | 64 | 96 | 10 | 81 | 0 | 14 | 4/66/2 | 6.3 | 0 | 5.1 | 19.3 | 17 | 1 | 5045 | 4 | 7 | 1918 |
| highland | 1 | 5 | 30 | 14 | 42 | 11 | 69 | 0 | 13 | 1/17/0 | 6.5 | 12.9 | 4 | 21.9 | 7 | 1 | 63 | 3 | 2 | 972 |
| highland | 2 | 9 | 14 | 16 | 22 | 9 | 44 | 0 | 13 | 4/7/0 | 6.6 | 20.4 | 3.5 | 17.3 | 8 | 1.2 | 21 | 2 | 0 | 713 |
| mean |  | 10.6 | 33 | 55.4 | 66.5 | 14.8 | 46.5 | 0.3 | 13.3 |  | 6.2 | 8.9 | 6.2 | 18.7 | 18.4 | 0.9 | 15971.7 | 3.8 | 2.1 | 1574.6 |

Year 100 mean 55.4 against 48.3 at the water step (seed-to-seed spread; same random stream). A new lot's 3x3 tiles belong to its household (a well's stay common); a household may build only where every lot tile is common, its own, its partner's or its kin's, and fields are never sown on another's lot. The old crops x 0.4 penalty in choosePlot is gone: ownership does that job. 'lots refused' counts lot evaluations passed over because another household held the ground (choosePlot looks at every lot each time it is asked, so this is a count of looks, not of decisions: about 16,000 per run). Tests: 288 passed, 0 failed (new: every lot tile belongs to its own household and is not sown by another), 4 warnings, 4 skipped. Scenarios: 21 passed, 1 warning.

## B5: stone leaves pits

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 19 | 64 | 59 | 71 | 16 | 56 | 0 | 12 | 5/0/2 | 6.2 | 5.4 | 8.2 | 20.1 | 19 | 1.2 | 172732 | 38 | 14.7 | 5 | 2 | 2483 |
| valley | 2 | 15 | 31 | 85 | 93 | 22 | 28 | 0 | 14 | 2/20/0 | 6.7 | 5.7 | 10.1 | 14.2 | 53 | 0.9 | 38093 | 52 | 16.8 | 2 | 0 | 2182 |
| plains | 1 | 7 | 18 | 40 | 40 | 9 | 46 | 1 | 11 | 0/55/0 | 5.7 | 17.1 | 9.1 | 24.6 | 0 | 0.7 | 43 | 20 | 18.2 | 1 | 2 | 1583 |
| plains | 2 | 5 | 23 | 53 | 71 | 16 | 47 | 1 | 13 | 0/4/0 | 5.3 | 24.1 | 7.8 | 27.6 | 16 | 1 | 157 | 19 | 14 | 5 | 6 | 1849 |
| forest | 1 | 6 | 27 | 87 | 87 | 19 | 5 | 0 | 13 | 3/0/0 | 7.2 | 0 | 6.5 | 9.2 | 16 | 1.2 | 195 | 39 | 11 | 5 | 0 | 1220 |
| forest | 2 | 18 | 47 | 77 | 81 | 22 | 34 | 0 | 15 | 5/0/0 | 6.5 | 4 | 12.1 | 13.4 | 46 | 1 | 214 | 59 | 17.5 | 5 | 1 | 1548 |
| lakeland | 1 | 8 | 36 | 47 | 62 | 6 | 44 | 1 | 13 | 0/29/0 | 5.9 | 0 | 2.9 | 19.8 | 34 | 0.4 | 7820 | 0 |  | 3 | 0 | 1510 |
| lakeland | 2 | 15 | 33 | 55 | 81 | 10 | 65 | 0 | 14 | 2/16/0 | 6.3 | 0 | 6.9 | 19.5 | 7 | 1 | 0 | 23 | 16.8 | 4 | 7 | 2069 |
| highland | 1 | 5 | 29 | 31 | 40 | 12 | 42 | 0 | 14 | 3/5/0 | 6.4 | 15.1 | 4.3 | 20.3 | 7 | 1.1 | 90 | 25 | 12.2 | 2 | 2 | 1030 |
| highland | 2 | 9 | 19 | 22 | 22 | 8 | 32 | 0 | 13 | 3/5/0 | 6.7 | 0 | 3.6 | 16.6 | 4 | 1.1 | 30 | 19 | 10.1 | 2 | 0 | 780 |
| mean |  | 10.7 | 32.7 | 55.6 | 64.8 | 14 | 39.9 | 0.3 | 13.2 |  | 6.3 | 7.1 | 7.1 | 18.5 | 20.2 | 1 | 21937.4 | 29.4 | 14.6 | 3.4 | 2 | 1625.4 |

Year 100 mean 55.6 (B4 55.4). Each quarry trip now takes stone out of the ground (rock falls by what was brought / 50) and deepens a pit on that tile; the quarry chosen is the stone on common ground that gives most for a day's walk, a deep pit giving less. Lots and fields never go on a pit. Stone from rock outcrops is a minority of stone trips (about 30 per 100-year run; the rest is cobbles from the water's edge), so pits stay shallow. Pit distance grows with houses built: valley #2 averaged 7.6 tiles in years 1-20 and 26 in years 61-80 (5 houses then 19); highland #1 8.3 then 10.4 (1 then 5 houses). Mean pit distance per run 14.6 tiles ('pit dist'). The view draws pits as stepped terraces (code-drawn). Tests: 298 passed, 0 failed (new: no lot or field on a pit), 4 warnings, 4 skipped. Scenarios: 21 passed, 1 warning.

## B6: rubble

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 17 | 48 | 69 | 83 | 17 | 55 | 0 | 14 | 1/8/0 | 5.9 | 5.2 | 8.2 | 20.2 | 22 | 1.1 | 20181 | 39 | 14.9 | 2.2 | 1 (1) | 5 | 2 | 2272 |
| valley | 2 | 13 | 55 | 80 | 99 | 21 | 78 | 0 | 15 | 0/9/0 | 6.2 | 7.2 | 11.4 | 20.2 | 65 | 0.8 | 30434 | 53 | 16 | 2.4 | 1 (1) | 7 | 0 | 2424 |
| plains | 1 | 7 | 26 | 47 | 47 | 9 | 33 | 1 | 12 | 0/128/0 | 5.2 | 17.2 | 9.2 | 22.5 | 1 | 0.9 | 40 | 17 | 17.4 | 2.9 |  | 2 | 3 | 2151 |
| plains | 2 | 4 | 21 | 47 | 47 | 8 | 39 | 1 | 14 | 19/31/0 | 5.8 | 25.1 | 6.1 | 28.8 | 15 | 0.9 | 44 | 15 | 11.6 | 2.4 |  | 3 | 0 | 1594 |
| forest | 1 | 7 | 28 | 91 | 91 | 26 | 13 | 0 | 13 | 1/16/0 | 6.5 | 0 | 7.2 | 10 | 7 | 0.9 | 322 | 53 | 11.3 | 2 |  | 6 | 2 | 1472 |
| forest | 2 | 19 | 53 | 73 | 82 | 23 | 24 | 0 | 14 | 2/23/0 | 6.5 | 3.8 | 10.9 | 14 | 74 | 1.1 | 110806 | 53 | 17 | 2.6 |  | 6 | 1 | 1963 |
| lakeland | 1 | 8 | 36 | 47 | 62 | 6 | 44 | 1 | 13 | 0/29/0 | 5.9 | 0 | 2.9 | 19.8 | 34 | 0.4 | 7819 | 0 |  | 2.6 | 1 (1) | 3 | 0 | 1250 |
| lakeland | 2 | 15 | 41 | 67 | 79 | 9 | 74 | 0 | 14 | 3/15/0 | 6.3 | 0 | 6.7 | 18.3 | 30 | 1.1 | 9211 | 20 | 16.8 | 2.6 | 0.5 (2) | 4 | 6 | 1717 |
| highland | 1 | 5 | 25 | 16 | 40 | 9 | 56 | 0 | 14 | 2/0/0 | 6.5 | 8.9 | 4.8 | 20.7 | 9 | 1 | 42 | 20 | 10.8 | 1.8 | 1 (1) | 2 | 0 | 1012 |
| highland | 2 | 9 | 17 | 26 | 26 | 9 | 37 | 0 | 13 | 1/0/0 | 6.5 | 0 | 4 | 19.9 | 3 | 1.2 | 28 | 20 | 9.6 | 1.9 |  | 2 | 0 | 783 |
| mean |  | 10.4 | 35 | 56.3 | 65.6 | 13.7 | 45.3 | 0.3 | 13.6 |  | 6.1 | 6.7 | 7.1 | 19.4 | 26 | 0.9 | 17892.7 | 29 | 13.9 | 2.3 |  | 4 | 1.4 | 1663.8 |

Year 100 mean 56.3 (B5 55.6). A dwelling taken by a flood, or pulled down to be rebuilt as something better, leaves 70% of its stone and 30% of its timber on the lot, counted toward the new stages. Over 4 seeds x 5 lands: 312 first raisings of stone dwellings took 2.18 quarry trips each; 13 raisings after a flood took 0.77 each. In this table only one run had a flooded stone house rebuilt (column 'quarry/flooded' blank elsewhere): floods that take houses are rare at 40x40. Tests: 299 passed, 0 failed, 4 warnings, 13 skipped (the new soft rubble check skips in worlds where no stone house was flooded and rebuilt). Scenarios: 21 passed, 1 warning.

## B7: worked-out pits

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 17 | 48 | 69 | 83 | 17 | 55 | 0 | 14 | 1/8/0 | 5.9 | 5.2 | 8.2 | 20.2 | 22 | 1.1 | 20181 | 39 | 14.9 | 2.2 | 1 (1) | 5 | 2 | 2378 |
| valley | 2 | 13 | 55 | 80 | 99 | 21 | 78 | 0 | 15 | 0/9/0 | 6.2 | 7.2 | 11.4 | 20.2 | 65 | 0.8 | 30434 | 53 | 16 | 2.4 | 1 (1) | 7 | 0 | 2220 |
| plains | 1 | 7 | 26 | 47 | 47 | 9 | 33 | 1 | 12 | 0/128/0 | 5.2 | 17.2 | 9.2 | 22.5 | 1 | 0.9 | 40 | 17 | 17.4 | 2.9 |  | 2 | 3 | 1903 |
| plains | 2 | 4 | 21 | 47 | 47 | 8 | 39 | 1 | 14 | 19/31/0 | 5.8 | 25.1 | 6.1 | 28.8 | 15 | 0.9 | 44 | 15 | 11.6 | 2.4 |  | 3 | 0 | 1497 |
| forest | 1 | 7 | 28 | 91 | 91 | 26 | 13 | 0 | 13 | 1/16/0 | 6.5 | 0 | 7.2 | 10 | 7 | 0.9 | 322 | 53 | 11.3 | 2 |  | 6 | 2 | 1486 |
| forest | 2 | 19 | 53 | 74 | 89 | 22 | 31 | 0 | 14 | 1/25/0 | 6.5 | 3.8 | 10.4 | 14.2 | 56 | 1.1 | 93788 | 50 | 17.3 | 2.5 |  | 7 | 1 | 2013 |
| lakeland | 1 | 8 | 36 | 47 | 62 | 6 | 44 | 1 | 13 | 0/29/0 | 5.9 | 0 | 2.9 | 19.8 | 34 | 0.4 | 7819 | 0 |  | 2.6 | 1 (1) | 3 | 0 | 1266 |
| lakeland | 2 | 15 | 41 | 67 | 79 | 9 | 74 | 0 | 14 | 3/15/0 | 6.3 | 0 | 6.7 | 18.3 | 30 | 1.1 | 9211 | 20 | 16.8 | 2.6 | 0.5 (2) | 4 | 6 | 1768 |
| highland | 1 | 5 | 25 | 16 | 40 | 9 | 56 | 0 | 14 | 2/0/0 | 6.5 | 8.9 | 4.8 | 20.7 | 9 | 1 | 42 | 20 | 10.8 | 1.8 | 1 (1) | 2 | 0 | 954 |
| highland | 2 | 9 | 17 | 26 | 26 | 9 | 37 | 0 | 13 | 1/0/0 | 6.5 | 0 | 4 | 19.9 | 3 | 1.2 | 28 | 20 | 9.6 | 1.9 |  | 2 | 0 | 885 |
| mean |  | 10.4 | 35 | 56.4 | 66.3 | 13.6 | 46 | 0.3 | 13.6 |  | 6.1 | 6.7 | 7.1 | 19.5 | 24.2 | 0.9 | 16190.9 | 28.7 | 14 | 2.3 |  | 4.1 | 1.4 | 1637 |

Year 100 mean 56.4 (B6 56.3). A pit whose stone is worked out (rock below 0.15) fills with water and becomes a pond with a few fish if it lies on wet ground (near water or waterlogged); elsewhere it is filled with spoil and settles over about 20 years into poor ground (fertility at most 0.35) that can be built on. A new pond changes the land masses and fords, and the view repaints the water. The plan's check, a pond in a 100-year lakeland run, is NOT met: 0 ponds in lakeland seeds 1 to 4, 1 in 12 runs overall (highland #3). Stone demand is low (a house takes about 3 stone, mostly cobbles from the water's edge), so few pits are ever worked out; I did not raise stone demand to force it. A unit check confirms the mechanism on a prepared pit (wet pit fills, dry pit settles, the pond counts as water). Tests: 300 passed, 0 failed, 4 warnings, 13 skipped.

## B8: trip counting

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 17 | 48 | 69 | 83 | 17 | 55 | 0 | 14 | 1/8/0 | 5.9 | 5.2 | 8.2 | 20.2 | 22 | 1.1 | 20181 | 39 | 14.9 | 2.2 | 1 (1) | 96/1/0/0/3 | 5 | 2 | 2320 |
| valley | 2 | 13 | 55 | 80 | 99 | 21 | 78 | 0 | 15 | 0/9/0 | 6.2 | 7.2 | 11.4 | 20.2 | 65 | 0.8 | 30434 | 53 | 16 | 2.4 | 1 (1) | 83/0/5/0/12 | 7 | 0 | 2351 |
| plains | 1 | 7 | 26 | 47 | 47 | 9 | 33 | 1 | 12 | 0/128/0 | 5.2 | 17.2 | 9.2 | 22.5 | 1 | 0.9 | 40 | 17 | 17.4 | 2.9 |  | 87/8/0/0/3 | 2 | 3 | 2066 |
| plains | 2 | 4 | 21 | 47 | 47 | 8 | 39 | 1 | 14 | 19/31/0 | 5.8 | 25.1 | 6.1 | 28.8 | 15 | 0.9 | 44 | 15 | 11.6 | 2.4 |  | 92/0/0/0/8 | 3 | 0 | 1612 |
| forest | 1 | 7 | 28 | 91 | 91 | 26 | 13 | 0 | 13 | 1/16/0 | 6.5 | 0 | 7.2 | 10 | 7 | 0.9 | 322 | 53 | 11.3 | 2 |  | 78/0/4/3/16 | 6 | 2 | 1435 |
| forest | 2 | 19 | 53 | 74 | 89 | 22 | 31 | 0 | 14 | 1/25/0 | 6.5 | 3.8 | 10.4 | 14.2 | 56 | 1.1 | 93788 | 50 | 17.3 | 2.5 |  | 84/1/5/0/10 | 7 | 1 | 2058 |
| lakeland | 1 | 8 | 36 | 47 | 62 | 6 | 44 | 1 | 13 | 0/29/0 | 5.9 | 0 | 2.9 | 19.8 | 34 | 0.4 | 7819 | 0 |  | 2.6 | 1 (1) | 82/0/5/0/13 | 3 | 0 | 1244 |
| lakeland | 2 | 15 | 41 | 67 | 79 | 9 | 74 | 0 | 14 | 3/15/0 | 6.3 | 0 | 6.7 | 18.3 | 30 | 1.1 | 9211 | 20 | 16.8 | 2.6 | 0.5 (2) | 69/0/5/0/26 | 4 | 6 | 1780 |
| highland | 1 | 5 | 25 | 16 | 40 | 9 | 56 | 0 | 14 | 2/0/0 | 6.5 | 8.9 | 4.8 | 20.7 | 9 | 1 | 42 | 20 | 10.8 | 1.8 | 1 (1) | 81/0/8/0/11 | 2 | 0 | 966 |
| highland | 2 | 9 | 17 | 26 | 26 | 9 | 37 | 0 | 13 | 1/0/0 | 6.5 | 0 | 4 | 19.9 | 3 | 1.2 | 28 | 20 | 9.6 | 1.9 |  | 71/3/8/0/17 | 2 | 0 | 815 |
| mean |  | 10.4 | 35 | 56.4 | 66.3 | 13.6 | 46 | 0.3 | 13.6 |  | 6.1 | 6.7 | 7.1 | 19.5 | 24.2 | 0.9 | 16190.9 | 28.7 | 14 | 2.3 |  |  | 4.1 | 1.4 | 1664.7 |

Identical populations to B7 (counting adds no random calls). Each household counts, per year, every working step of its grown members by destination kind (forage, hunt, wood, timber, stone, build, store, guard, home) and the distance walked; last year's counts are kept on the site (tripsLast, tripDLast, workDaysLast) for phase I. Plausibility: a two-adult household logs 36 working steps a year (18 daytime steps each), food trips average 4 to 7 tiles. At year 100 the working days went 69 to 96% to food, 0 to 8% to hunting, 0 to 8% to firewood, 0 to 3% to building, 3 to 26% at home (new column). Tests: 310 passed, 0 failed (new: every household's trips add up to its working days), 4 warnings, 13 skipped.

## C1: chunked ground (view only)

No simulation change: the table is identical to B8's. Checked instead: the ground laid together from the chunk canvases equals colorAt() at every sampled pixel (every third pixel each way, about 440,000) right after load and after 3 years of repaints (forest #7 and lakeland #4); stills before and after at the same seed, tick and camera differ in 0.6% of pixels, all of them animals and people in other poses (view randomness), none on the ground. 9 chunks at 40x40.

## C2 and C3: chunk-sized buffers, noise tile, skipping unchanged chunks (view only)

No simulation change: the table is identical to B8's. C2: the smoothed fields are now held for one chunk at a time (10 buffers of 128 x 128 samples instead of 320 x 320 at 40x40, and 1024 x 1024 at 128x128), and the ground speckle is a 512 x 512 tile repeated. Ground memory at 40x40, counted in the page: 27.7 MB (9 chunk canvases, fade pool, scratch, buffers, noise tile); the plan's limit is 40 MB. Before, the two full-map canvases alone were about 32 MB. Still pixel-exact against colorAt() after load and after 3 years (lakeland #4, forest #7). Stills look the same; the speckle sits at other places (6.8% of pixels differ, all by small amounts). C3: a chunk is repainted only when its averages of grass, snow, soil, trees, flood, burn scars and paths (in steps of 1/24) or any of its ways, fields, pits or water tiles have changed. Over one year of forest #7: in mid-summer, 3 to 9 of the 9 chunks were skipped per step; in winter every chunk repainted on every step, because snow fell on most steps. A dry winter step changes nothing and is skipped. Done together in one commit (C2 and C3 touch the same lines).

## D1: no whole-world loops inside per-creature code

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 14 | 40 | 53 | 73 | 16 | 57 | 0 | 13 | 9/18/0 | 6.2 | 5.5 | 7.3 | 21.8 | 40 | 1 | 67703 | 33 | 14.8 | 2.3 |  | 77/0/3/0/20 | 5 | 2 | 2305 |
| valley | 2 | 13 | 55 | 80 | 99 | 21 | 78 | 0 | 15 | 0/9/0 | 6.2 | 7.2 | 11.4 | 20.2 | 65 | 0.8 | 30434 | 53 | 16 | 2.4 | 1 (1) | 83/0/5/0/12 | 7 | 0 | 2602 |
| plains | 1 | 1 | 8 | 41 | 49 | 8 | 35 | 1 | 13 | 0/35/0 | 6 | 21.3 | 10.9 | 24.6 | 10 | 0.7 | 53 | 20 | 18.8 | 3.3 |  | 89/2/0/0/9 | 1 | 2 | 1596 |
| plains | 2 | 18 | 34 | 40 | 51 | 11 | 58 | 0 | 14 | 0/5/0 | 6 | 30.2 | 9.4 | 25.7 | 54 | 0.8 | 106 | 19 | 20 | 2.8 |  | 88/8/0/0/3 | 3 | 4 | 1927 |
| forest | 1 | 7 | 28 | 91 | 91 | 26 | 13 | 0 | 13 | 1/16/0 | 6.5 | 0 | 7.2 | 10 | 7 | 0.9 | 322 | 53 | 11.3 | 2 |  | 78/0/4/3/16 | 6 | 2 | 1344 |
| forest | 2 | 16 | 50 | 84 | 98 | 22 | 38 | 0 | 15 | 0/8/0 | 6.8 | 4.5 | 10.4 | 13.1 | 21 | 0.9 | 7751 | 48 | 17.4 | 2.4 | 1 (1) | 87/1/4/0/8 | 6 | 1 | 1755 |
| lakeland | 1 | 18 | 44 | 32 | 60 | 9 | 44 | 0 | 12 | 13/0/0 | 5.7 | 0 | 5.3 | 24.9 | 6 | 1.2 | 9868 | 10 | 18.4 | 2.5 |  | 84/1/0/6/9 | 2 | 0 | 1378 |
| lakeland | 2 | 16 | 54 | 69 | 69 | 9 | 41 | 0 | 14 | 0/16/0 | 6.4 | 0 | 6.6 | 20 | 15 | 1.2 | 8973 | 20 | 15.9 | 2.5 | 1 (2) | 80/0/5/0/15 | 3 | 6 | 1953 |
| highland | 1 | 5 | 26 | 17 | 35 | 10 | 46 | 0 | 14 | 4/1/0 | 7.4 | 6.3 | 4.4 | 16.1 | 17 | 1.2 | 74 | 23 | 12.6 | 1.9 | 0.5 (2) | 65/3/3/0/30 | 3 | 1 | 1090 |
| highland | 2 | 12 | 23 | 37 | 38 | 12 | 44 | 0 | 15 | 3/9/0 | 6.6 | 28.8 | 3.5 | 23 | 7 | 1 | 58 | 23 | 9.9 | 1.6 | 0 (1) | 82/0/9/0/9 | 5 | 2 | 1151 |
| mean |  | 12 | 36.2 | 54.4 | 66.3 | 14.4 | 45.4 | 0.1 | 13.8 |  | 6.4 | 10.4 | 7.6 | 19.9 | 24.2 | 1 | 12534.2 | 30.2 | 15.5 | 2.4 |  |  | 4.1 | 2 | 1710.1 |

Re-baseline, as the plan expects: histories shift because counts are now taken from the per-tile lists at the start of a step. Year 100 mean 54.4 (B8 56.4), peak 66.3, hunger deaths 45.4. Replaced: the pack filter at a kill and the territory count at birth (now around(), from the per-tile lists), the count of grown people in person() (counted once a step), and the harvest and well-watering loops over every tile (now the list of field tiles made at sowing). Time per 100-year run, 6 worlds in Node: 1925 ms before, 1847 after (4%): at 40x40 these loops are not what costs most; the walking-distance searches are (profiled: about 30% of the time). The gain grows with the map. Tests: 312 passed, 0 failed (new: around() finds exactly what a scan of every tile's list finds), 2 warnings, 14 skipped. Scenarios: 21 passed, 1 warning.

## No crossing without a bridge; timber only by chopping (owner's request)

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 18 | 26 | 65 | 71 | 17 | 16 | 0 | 13 | 8/24/0 | 6.9 | 5.8 | 7.6 | 23.2 | 16 | 1.4 | 68512 | 38 | 16 | 2.2 |  | 74/0/5/0/21 | 1 | 1 | 2015 |
| valley | 2 | 9 | 41 | 64 | 80 | 21 | 25 | 0 | 14 | 3/43/0 | 6.7 | 0 | 9.4 | 12.7 | 9 | 0.9 | 44494 | 50 | 16.3 | 2.4 |  | 79/0/6/0/15 | 1 | 0 | 1768 |
| plains | 1 | 3 | 14 | 36 | 39 | 7 | 39 | 0 | 13 | 0/77/0 | 5.5 | 17.7 | 12.9 | 17.3 | 10 | 0.8 | 42 | 24 | 17.1 | 3.4 |  | 86/8/1/0/4 | 0 | 0 | 1283 |
| plains | 2 | 5 | 28 | 62 | 71 | 17 | 41 | 0 | 14 | 2/35/0 | 6.1 | 40.4 | 9 | 25.8 | 17 | 1 | 214 | 26 | 22.5 | 2.9 | 1 (1) | 79/0/0/0/20 | 1 | 10 | 1624 |
| forest | 1 | 15 | 44 | 76 | 90 | 27 | 35 | 0 | 14 | 0/0/0 | 7.4 | 0 | 7.2 | 9.1 | 46 | 0.9 | 267 | 52 | 10.7 | 2 | 1 (1) | 88/0/4/0/8 | 1 | 0 | 1588 |
| forest | 2 | 11 | 39 | 89 | 90 | 25 | 38 | 0 | 14 | 0/24/0 | 6.3 | 4.1 | 12.4 | 12.3 | 33 | 1.1 | 222 | 53 | 18.1 | 2.7 | 1 (1) | 83/0/6/0/11 | 1 | 0 | 1478 |
| lakeland | 1 | 17 | 42 | 39 | 64 | 8 | 50 | 0 | 12 | 3/5/0 | 6 | 0 | 4.9 | 27.4 | 4 | 1 | 25076 | 8 | 18.3 | 2.6 |  | 79/6/0/0/15 | 2 | 0 | 1311 |
| lakeland | 2 | 20 | 53 | 41 | 76 | 10 | 59 | 0 | 12 | 11/0/0 | 6.8 | 0 | 6.2 | 19.2 | 4 | 0.8 | 104 | 18 | 16.1 | 2.6 |  | 72/0/5/0/23 | 1 | 7 | 1404 |
| highland | 1 | 15 | 19 | 18 | 33 | 10 | 44 | 0 | 14 | 2/0/0 | 6.6 | 12.5 | 4.2 | 20.1 | 3 | 1.2 | 55 | 22 | 12 | 1.9 | 0.5 (2) | 65/0/0/0/34 | 2 | 0 | 937 |
| highland | 2 | 8 | 19 | 22 | 28 | 11 | 35 | 0 | 14 | 0/4/2 | 7.1 | 0 | 3.4 | 18.2 | 14 | 1.1 | 39 | 23 | 10.5 | 1.8 |  | 69/1/12/0/13 | 1 | 1 | 938 |
| mean |  | 12.1 | 32.5 | 51.2 | 64.2 | 15.3 | 38.2 | 0 | 13.4 |  | 6.5 | 8.1 | 7.7 | 18.5 | 15.6 | 1 | 13902.5 | 31.4 | 15.8 | 2.5 |  |  | 1.1 | 1.9 | 1434.6 |

Year 100 mean 51.2 (D1 54.4), peak 64.2, hunger deaths 38.2 (D1 45.4), no resettles in this table. Over 6 seeds x 5 lands: year 100 mean 60.3, 11 resettles in 5 of 30 worlds (D1: 61.7, 8 in 7). Water: nobody wades any more; a bank is out of reach until a bridge joins it. The want of a bridge comes from what is seen across the water and cannot be had: food that would be worth the walk if there were a way over, or, when no lot is left on this side, a free lot over the water (counted at the narrow place where it would be crossed). Bridges per run: 1.1 (0 to 2), first built between year 16 and 94 in the runs checked. Strangers now walk in on land joined to the camp. The view never draws anyone across water: where the far side cannot be reached they go to the water's edge and no further. New bridge art (code-drawn): plank deck with edge beams, piles into the water with ripples, posted rails; while it is being built the span stands on bare piles, decked from the near bank outward; carrying logs to it is its own animation. Timber: clearing a lot, a field or a way no longer yields free wood. Trees on a building plot are felled by the builders first (and are its first timber); fields are not sown under standing trees (tree above 0.3). Building, felling and hauling now take the person's whole step, so the work is seen; the hungry look for food first (building only above energy 0.6), which keeps early camps alive (without it, resettles rose to 22). First dwellings come later in some worlds (year 7 and 9 in two test worlds: soft warnings). Tests: 332 passed, 0 failed (new: nobody is ever on a cut-off bank; timber only rises when someone chopped; no crossing without a bridge), 3 warnings, 13 skipped. Scenarios: 22 passed.

## Pace (owner's report: nothing happens for 15 minutes at 8x)

View only; the simulation and its table are unchanged. At 8x a game year took a minute, so a child (13 years to grow up) took 13 minutes even at full speed, and a valley has on average 1.6 dwellings and 6 to 7 people at year 15 (20 worlds, measured both before and after the timber change: it is the founding family growing, not a slowdown). Speeds are now 1x, 4x, 16x and 48x (a year in 10 s). A slow frame now catches up on up to 6 missed steps instead of dropping time: with the CPU slowed 6 times (12 frames a second) 48x still gives exactly 3 game years in 30 s; the old code lost about 8% at 8x on the same setting. Children are drawn a little bigger each year (80% to 100% of their sprite size across each age band), and a label at the top right shows the year and season.

## D2: known land

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 18 | 26 | 65 | 71 | 17 | 16 | 0 | 13 | 8/24/0 | 6.9 | 5.8 | 7.6 | 23.2 | 16 | 1.4 | 68512 | 38 | 16 | 2.2 |  | 74/0/5/0/21 | 81 | 1 | 1 | 2517 |
| valley | 2 | 9 | 41 | 64 | 80 | 21 | 25 | 0 | 14 | 3/43/0 | 6.7 | 0 | 9.4 | 12.7 | 9 | 0.9 | 44494 | 50 | 16.3 | 2.4 |  | 79/0/6/0/15 | 85 | 1 | 0 | 2325 |
| plains | 1 | 3 | 14 | 36 | 39 | 7 | 39 | 0 | 13 | 0/77/0 | 5.5 | 17.7 | 12.9 | 17.3 | 10 | 0.8 | 42 | 24 | 17.1 | 3.4 |  | 86/8/1/0/4 | 49 | 0 | 0 | 1521 |
| plains | 2 | 5 | 28 | 62 | 71 | 17 | 41 | 0 | 14 | 2/35/0 | 6.1 | 40.4 | 9 | 25.8 | 17 | 1 | 214 | 26 | 22.5 | 2.9 | 1 (1) | 79/0/0/0/20 | 82 | 1 | 10 | 1947 |
| forest | 1 | 15 | 44 | 76 | 90 | 27 | 35 | 0 | 14 | 0/0/0 | 7.4 | 0 | 7.2 | 9.1 | 46 | 0.9 | 267 | 52 | 10.7 | 2 | 1 (1) | 88/0/4/0/8 | 84 | 1 | 0 | 1965 |
| forest | 2 | 11 | 39 | 89 | 90 | 25 | 38 | 0 | 14 | 0/24/0 | 6.3 | 4.1 | 12.4 | 12.3 | 33 | 1.1 | 222 | 53 | 18.1 | 2.7 | 1 (1) | 83/0/6/0/11 | 91 | 1 | 0 | 1882 |
| lakeland | 1 | 17 | 42 | 39 | 64 | 8 | 50 | 0 | 12 | 3/5/0 | 6 | 0 | 4.9 | 27.4 | 4 | 1 | 25076 | 8 | 18.3 | 2.6 |  | 79/6/0/0/15 | 74 | 2 | 0 | 1492 |
| lakeland | 2 | 20 | 53 | 41 | 76 | 10 | 59 | 0 | 12 | 11/0/0 | 6.8 | 0 | 6.2 | 19.2 | 4 | 0.8 | 104 | 18 | 16.1 | 2.6 |  | 72/0/5/0/23 | 90 | 1 | 7 | 1817 |
| highland | 1 | 15 | 19 | 18 | 33 | 10 | 44 | 0 | 14 | 2/0/0 | 6.6 | 12.5 | 4.2 | 20.1 | 3 | 1.2 | 55 | 22 | 12 | 1.9 | 0.5 (2) | 65/0/0/0/34 | 73 | 2 | 0 | 1158 |
| highland | 2 | 8 | 19 | 22 | 28 | 11 | 35 | 0 | 14 | 0/4/2 | 7.1 | 0 | 3.4 | 18.2 | 14 | 1.1 | 39 | 23 | 10.5 | 1.8 |  | 69/1/12/0/13 | 79 | 1 | 1 | 916 |
| mean |  | 12.1 | 32.5 | 51.2 | 64.2 | 15.3 | 38.2 | 0 | 13.4 |  | 6.5 | 8.1 | 7.7 | 18.5 | 15.6 | 1 | 13902.5 | 31.4 | 15.8 | 2.5 |  |  | 78.8 | 1.1 | 1.9 | 1754 |

Populations identical to the previous table (the record adds no random calls and nothing reads it). The settlement's known land is every tile one of its people has stood within sight of (5 tiles, 3 under trees). It starts at 8 to 16% of the map in year 1, reaches about 40% by year 20 and 74 to 91% by year 100 (column 'known %'); strangers to an emptied valley start knowing nothing. The view thins unseen land out pixel by pixel into the dark, dims the last of the seen land, gives chunks with nothing seen no canvas at all, fades trees, props and creatures by how much of their ground is known, and keeps the camera to the seen land. known lives only in the simulation and is saved; the camera never writes it. Ground still pixel-exact against colorAt() (forest #7). Tests: 333 passed, 0 failed (new unit: known starts small, grows, and is forgotten on resettling), 3 warnings, 13 skipped.

## D3: reach

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 18 | 44 | 72 | 75 | 21 | 13 | 0 | 14 | 5/15/2 | 5.5 | 5.9 | 6.3 | 6.1 | 20 | 0.8 | 249 | 38 | 16.9 | 2 | 1 (1) | 79/0/0/0/21 | 79 | 4.2 | 17 | 2 | 3 | 1992 |
| valley | 2 | 9 | 36 | 70 | 76 | 22 | 24 | 0 | 14 | 0/11/0 | 5.3 | 0 | 9.3 | 6.5 | 21 | 1 | 200 | 46 | 18 | 2.5 | 0 (1) | 94/0/2/0/3 | 79 | 6 | 17 | 1 | 0 | 2104 |
| plains | 1 | 7 | 11 | 20 | 32 | 4 | 42 | 0 | 12 | 0/10/0 | 5.7 | 12.5 | 8.4 | 18.6 | 25 | 1.2 | 8 | 6 | 16.5 | 4.7 |  | 97/0/1/0/2 | 56 | 10.9 | 8 | 0 | 0 | 1659 |
| plains | 2 | 17 | 21 | 20 | 41 | 12 | 72 | 0 | 13 | 0/63/0 | 6.6 | 0 | 7.8 | 11 | 13 | 0.7 | 74 | 10 | 19.7 | 3 |  | 77/0/0/0/23 | 81 | 3.9 | 9 | 1 | 1 | 1968 |
| forest | 1 | 10 | 32 | 43 | 43 | 15 | 21 | 0 | 13 | 8/8/0 | 5.1 | 0 | 4.8 | 5.2 | 10 | 1.4 | 83 | 30 | 9.6 | 2.1 | 0 (1) | 86/0/1/0/13 | 65 | 3.7 | 9 | 0 | 0 | 1628 |
| forest | 2 | 13 | 45 | 112 | 112 | 29 | 33 | 0 | 14 | 9/0/0 | 5.3 | 4.1 | 8.5 | 5.5 | 19 | 1.1 | 566 | 44 | 19.1 | 2.6 |  | 81/0/1/0/18 | 87 | 3.7 | 21 | 1 | 5 | 2158 |
| lakeland | 1 | 13 | 38 | 101 | 102 | 26 | 11 | 0 | 14 | 1/0/0 | 6 | 0 | 5.2 | 9.2 | 14 | 1.2 | 494 | 36 | 26.1 | 2.2 |  | 90/1/1/0/8 | 91 | 6.9 | 25 | 1 | 7 | 1822 |
| lakeland | 2 | 17 | 33 | 78 | 79 | 15 | 2 | 0 | 14 | 8/11/0 | 6.3 | 0 | 5.6 | 6.5 | 59 | 1 | 8 | 25 | 18.4 | 2.4 | 0.5 (2) | 93/0/1/0/6 | 88 | 6 | 13 | 1 | 7 | 1634 |
| highland | 1 | 9 | 12 | 25 | 27 | 9 | 42 | 0 | 12 | 0/36/0 | 5.7 | 6.1 | 4.9 | 8.3 | 2 | 0.9 | 37 | 22 | 10.3 | 2.1 | 1 (1) | 94/0/2/0/4 | 57 | 6.3 | 9 | 1 | 0 | 1113 |
| highland | 2 | 9 | 11 | 16 | 23 | 7 | 56 | 0 | 12 | 0/28/0 | 5.8 | 0 | 4.7 | 8.1 | 7 | 1.1 | 8 | 16 | 7.3 | 1.9 |  | 99/0/1/0/0 | 75 | 11.9 | 8 | 1 | 0 | 771 |
| mean |  | 12.2 | 28.3 | 55.7 | 61 | 16 | 31.6 | 0 | 13.2 |  | 5.7 | 2.9 | 6.6 | 8.5 | 19 | 1 | 172.7 | 27.3 | 16.2 | 2.6 |  |  | 75.8 | 6.4 | 13.6 | 0.9 | 2.3 | 1684.9 |

Year 100 mean 55.7 (D2 51.2), peak 61, hunger deaths 31.6 (D2 38.2), no resettles in this table; over 6 seeds x 5 lands: year 100 mean 66.7, 9 resettles in 6 of 30 worlds (before D3: 60.3, 11 in 5). Each person has a reach, how far they are minded to go: food is sought at distances drawn with that reach as their mean, firewood, timber and stone within twice the reach. It grows by a quarter (plus half a tile) when a search comes back with nothing worth the walk while the person is still hungry, or finds no wood or stone at all; it shrinks by 4% a step once they are fed, never below 3 tiles; it cannot exceed what can be walked out and back in a day (12 tiles, 30% more on made roads, 50% more with a cart). A newcomer starts at 6 (a first try at 3 gave 15 resettles in 30 worlds). The lot search no longer grows with the number of buildings (that was a head-count rule): it starts at 8 tiles from the fire and widens by a tile each time a household finds no lot. At year 100 the grown average 6.4 tiles of reach (3.7 in well-fed forest worlds, 10.9 and 11.9 in hungry plains #1 and highland #2), lot reach 8 to 25 tiles; held at 30, reach stays at 3.2 (new scenario check). Known land is largest in the biggest villages (87 to 91% with 78 to 112 people, 56% in plains #1 with 20). Tests: 333 passed, 0 failed, 2 warnings, 14 skipped. Scenarios: 24 passed.

## D4 with H1: map size, height, water by flow (new baseline, at 96 tiles)

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 18 | 66 | 204 | 204 | 51 | 1 | 0 | 14 | 7/208/0 | 6.2 | 6.1 | 4.3 | 6.9 | 19 | 1.5 | 1801 | 83 | 23.2 | 1.6 | 0.6666666666666666 (3) | 86/0/1/0/13 | 44 | 4.4 | 21 | 3 | 0 | 6331 |
| valley | 2 | 21 | 61 | 145 | 146 | 40 | 9 | 0 | 12 | 0/225/0 | 6.2 | 0 | 4.6 | 5.5 | 40 | 1.2 | 851 | 70 | 16.9 | 1.7 | 0.5 (2) | 88/1/1/0/10 | 44 | 3.8 | 17 | 0 | 0 | 6245 |
| plains | 1 | 20 | 35 | 108 | 124 | 32 | 72 | 0 | 11 | 0/541/0 | 5.7 | 8.2 | 7 | 7.4 | 33 | 0.8 | 1390 | 38 | 19.9 | 2.4 |  | 78/0/1/1/20 | 28 | 4 | 17 | 0 | 0 | 5622 |
| plains | 2 | 9 | 27 | 127 | 127 | 37 | 8 | 0 | 12 | 2/226/0 | 5.6 | 7.7 | 7.4 | 7.5 | 18 | 1.1 | 840 | 50 | 19.4 | 2.4 |  | 83/1/1/4/11 | 29 | 5 | 17 | 0 | 0 | 5594 |
| forest | 1 | 15 | 49 | 105 | 110 | 32 | 28 | 0 | 14 | 4/153/0 | 5.4 | 0 | 6.3 | 5 | 32 | 1.2 | 442 | 44 | 18.8 | 2.3 | 0.5 (2) | 87/0/1/0/11 | 33 | 4 | 13 | 0 | 0 | 5084 |
| forest | 2 | 19 | 54 | 92 | 97 | 23 | 13 | 0 | 14 | 4/91/2 | 4.9 | 0 | 4.8 | 5 | 9 | 0.9 | 366 | 27 | 16.9 | 2 | 1 (1) | 82/1/1/3/13 | 22 | 3.5 | 13 | 0 | 0 | 5137 |
| lakeland | 1 | 14 | 60 | 152 | 156 | 48 | 12 | 0 | 14 | 4/188/2 | 5.5 | 0 | 7 | 5.6 | 46 | 1.1 | 1144 | 67 | 23.2 | 2.3 | 1 (1) | 82/0/1/0/17 | 38 | 3.7 | 17 | 0 | 0 | 5594 |
| lakeland | 2 | 5 | 25 | 129 | 129 | 32 | 2 | 0 | 13 | 7/322/2 | 5.6 | 0 | 6.2 | 6.5 | 10 |  | 577 | 44 | 23 | 2.3 | 1 (1) | 87/1/1/0/10 | 27 | 4.7 | 21 | 0 | 0 | 4649 |
| highland | 1 | 12 | 22 | 34 | 36 | 16 | 31 | 0 | 12 | 0/24/0 | 6.7 | 4.7 | 2.9 | 8.2 | 16 | 1.2 | 102 | 29 | 10.3 | 1.6 | 1 (1) | 75/0/1/0/22 | 27 | 5.7 | 9 | 0 | 0 | 2740 |
| highland | 2 | 7 | 23 | 56 | 57 | 15 | 17 | 0 | 12 | 2/9/0 | 7 | 5.7 | 3.5 | 8.6 | 3 | 1 | 136 | 29 | 11.6 | 1.7 | 0 (1) | 79/2/1/0/18 | 25 | 4.9 | 9 | 0 | 0 | 3122 |
| mean |  | 14 | 42.2 | 115.2 | 118.6 | 32.6 | 19.3 | 0 | 12.8 |  | 5.9 | 3.2 | 5.4 | 6.6 | 22.6 | 1.1 | 764.9 | 48.1 | 18.3 | 2 |  |  | 31.7 | 4.4 | 15.4 | 0.3 | 0 | 5011.8 |

Every world is new, as the plan expects; this table is now run at the game's own size, 96 tiles a side (/table.html?size=40 for the old size). Year 100 mean 115.2, peak 118.6, dwellings 32.6, hunger deaths 19.3, no resettles; 100-year runs take 2.7 to 6.3 s in the browser (Node: 6.1 s at 96, 8.2 s at 128; the plan's limit at 128 is 30 s). The land: height from noise at fixed wavelengths in tiles, shaped by the kind of country; lakes where hollows fill to their spill point, streams where enough land drains (wider for big ones), all draining to the map edge; bare rock on steep and high ground, a tree line at level 7; where a cliff cuts dry land in two, the lowest crossing is cut to a bank. Water at 96: 6 to 17% of the map (valley 8 to 13%, lakeland 14%); at 128 up to 18% (lakeland 23%). Cliffs (two levels or more between neighbours) only in valley knolls and highland plateaus; plains, forest and lakeland roll gently. Animal start numbers scale with area, and newcomers walk in at the edge of the known land. The view is still flat but tinted by height. Problems for D5: wolves 0 to 2 and deer 0 to 7 at year 100 in every world (rabbits plenty); the bigger map has room, so few bridges are needed (0.3 per run). Tests: 399 passed, 0 failed (new: water drains to the edge or a lake, never uphill, and every dry piece is joined by banks, at 40, 96 and 128 for all five lands; test worlds at 96 and 128), 3 warnings, 16 skipped. Scenarios (still at 40): 22 passed, 2 warnings.

## D5: ecology at the new size

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 17 | 59 | 167 | 168 | 44 | 2 | 0 | 14 | 8/169/0 | 6.3 | 3.2 | 4.5 | 7.8 | 21 | 0.9 | 1342 | 75 | 20.1 | 1.6 | 1 (1) | 87/1/1/0/11 | 44 | 5.1 | 21 | 3 | 0 | 6508 |
| valley | 2 | 19 | 61 | 139 | 148 | 45 | 29 | 0 | 12 | 8/126/0 | 6.2 | 0 | 3.9 | 6.1 | 35 | 1.1 | 901 | 71 | 17.5 | 1.6 |  | 86/1/1/1/10 | 38 | 4.4 | 17 | 0 | 0 | 6432 |
| plains | 1 | 17 | 49 | 145 | 146 | 37 | 24 | 0 | 12 | 1/200/5 | 5.8 | 7.9 | 7.9 | 9 | 12 | 1 | 897 | 48 | 21.3 | 2.5 |  | 85/0/1/0/14 | 35 | 6 | 17 | 0 | 0 | 6319 |
| plains | 2 | 4 | 11 | 138 | 138 | 28 | 3 | 0 | 13 | 7/321/0 | 5.2 | 7.6 | 6.9 | 5.7 | 7 |  | 498 | 35 | 18.8 | 2.5 |  | 85/0/0/1/13 | 25 | 4.4 | 13 | 0 | 0 | 5398 |
| forest | 1 | 12 | 46 | 124 | 124 | 32 | 35 | 0 | 14 | 13/93/5 | 5.5 | 0 | 6 | 5.3 | 33 | 1.1 | 543 | 42 | 19.2 | 2.2 | 1 (1) | 89/1/1/0/9 | 30 | 4 | 17 | 0 | 0 | 5785 |
| forest | 2 | 20 | 61 | 108 | 109 | 34 | 25 | 0 | 12 | 9/179/5 | 4.9 | 0 | 6 | 5.2 | 30 | 1 | 466 | 40 | 22 | 2.2 |  | 84/0/1/0/14 | 23 | 4 | 13 | 0 | 0 | 5546 |
| lakeland | 1 | 18 | 59 | 101 | 107 | 31 | 26 | 0 | 13 | 40/100/8 | 6.1 | 0 | 6.4 | 6.6 | 11 | 1 | 617 | 44 | 20.4 | 2.3 | 0.5 (2) | 88/1/1/0/10 | 41 | 4.2 | 17 | 0 | 0 | 5445 |
| lakeland | 2 | 9 | 28 | 163 | 163 | 46 | 4 | 1 | 13 | 5/126/4 | 5.8 | 0 | 7.9 | 5.4 | 11 | 1 | 856 | 64 | 27.6 | 2.6 | 0.5 (2) | 86/1/1/0/12 | 30 | 4 | 25 | 0 | 0 | 5340 |
| highland | 1 | 4 | 17 | 36 | 36 | 12 | 27 | 0 | 12 | 2/63/5 | 6.9 | 4.3 | 2.9 | 7.6 | 3 | 1 | 78 | 24 | 9.3 | 1.8 |  | 87/0/2/0/9 | 21 | 6 | 9 | 0 | 0 | 3058 |
| highland | 2 | 8 | 24 | 39 | 41 | 12 | 23 | 0 | 13 | 6/122/5 | 6.9 | 5.5 | 3.3 | 8.8 | 4 | 0.9 | 93 | 24 | 9.3 | 1.7 | 0.3333333333333333 (3) | 83/0/1/0/16 | 22 | 5.4 | 9 | 0 | 0 | 3480 |
| mean |  | 12.8 | 41.5 | 116 | 118 | 32.1 | 19.8 | 0.1 | 12.8 |  | 6 | 2.9 | 5.6 | 6.8 | 16.7 | 1 | 629.1 | 46.7 | 18.6 | 2.1 |  |  | 30.9 | 4.8 | 15.8 | 0.3 | 0 | 5331.1 |

Only the wander-in rule changed (start numbers were already scaled with area in D4). Year 100 mean 116, hunger deaths 19.8, one resettle. Deer, rabbits and wolves are all alive at year 100 in 7 of 10 worlds in this table (deer and rabbits in all 10; before D5: 2 of 10, deer gone in 6). The fixed thresholds (fewer than 3 of a plant eater counts as nearly gone, fewer than 16 wolves) now scale with the area of the map, and groups wandering in with its square root; a nearly-gone plant eater comes back in 60% of years (was 30%) below 8 per 40x40 of land (was 3), wolves in 80% of years (was 50%) while prey per wolf is plentiful. The tries: thresholds scaled alone gave 2 of 10 at 96; 5 per 40x40 with 50% and 70% gave 6 of 10; the chosen setting 7 of 10. At 128: 8 of 10. At the old 40x40 only 1 of 10: villages of 30 to 160 people on that little land hunt everything out, which the plan's D5 check does not cover (the game is now 96). The early crash of every kind in years 1 to 3 (most animals start in autumn and starve) was already in the original code at 40 and is left for phase M's living ground. Tests: 398 passed, 0 failed, 4 warnings, 16 skipped. Scenarios (at 40): 21 passed, 3 warnings.

## Owner's requests: no dark fade, children grow up sooner, felling clears ground (table at 96)

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 36 | 106 | 300 | 301 | 89 | 129 | 0 | 14 | 15/138/5 | 6.1 | 0 | 4.3 | 8.3 | 102 | 1.1 | 4946 | 139 | 28.7 | 1.6 | 1 (1) | 85/0/1/0/13 | 56 | 5.6 | 29 | 3 | 0 | 8734 |
| valley | 2 | 37 | 125 | 201 | 204 | 65 | 109 | 0 | 13 | 2/111/12 | 5.9 | 0 | 4.6 | 7.1 | 55 | 1.1 | 2185 | 105 | 21.1 | 1.6 | 0 (1) | 89/1/1/0/8 | 58 | 5.4 | 25 | 0 | 0 | 8547 |
| plains | 1 | 18 | 72 | 233 | 236 | 58 | 124 | 0 | 12 | 9/101/5 | 6.1 | 10.3 | 8.1 | 13 | 71 | 1 | 2402 | 70 | 29.2 | 2.4 |  | 88/0/2/0/8 | 57 | 8.3 | 25 | 0 | 0 | 6958 |
| plains | 2 | 23 | 57 | 103 | 106 | 33 | 104 | 0 | 12 | 6/204/0 | 5.4 | 17.7 | 6.8 | 12.9 | 24 | 1 | 731 | 42 | 19.7 | 2.4 |  | 82/0/1/1/15 | 39 | 7.2 | 17 | 0 | 0 | 6489 |
| forest | 1 | 20 | 89 | 94 | 116 | 35 | 107 | 0 | 13 | 15/239/6 | 5.4 | 0 | 6.9 | 6.3 | 70 | 1.1 | 571 | 54 | 19.4 | 2.2 | 1 (1) | 84/2/1/3/10 | 39 | 4.2 | 17 | 0 | 0 | 6209 |
| forest | 2 | 24 | 50 | 89 | 94 | 28 | 98 | 0 | 14 | 21/230/5 | 5.2 | 0 | 5.1 | 5.8 | 13 | 1.1 | 405 | 28 | 19.4 | 2.1 | 0.5 (2) | 90/0/1/0/8 | 28 | 4 | 13 | 0 | 0 | 5846 |
| lakeland | 1 | 24 | 64 | 243 | 244 | 77 | 49 | 0 | 13 | 29/108/2 | 6 | 0 | 6.9 | 7.4 | 24 | 1.2 | 3257 | 106 | 26.6 | 2.1 |  | 84/0/1/4/10 | 54 | 5.5 | 25 | 0 | 0 | 6575 |
| lakeland | 2 | 8 | 36 | 121 | 121 | 38 | 47 | 0 | 13 | 9/121/5 | 5.8 | 0 | 6.8 | 7.6 | 33 | 1.2 | 785 | 59 | 25.7 | 2.3 |  | 90/0/1/1/8 | 30 | 5.1 | 21 | 0 | 0 | 5357 |
| highland | 1 | 14 | 25 | 38 | 38 | 13 | 39 | 0 | 10 | 8/39/5 | 7 | 4.3 | 3.5 | 10.1 | 2 | 1.3 | 86 | 26 | 9.9 | 1.8 | 0.5 (2) | 86/0/0/0/13 | 27 | 7.6 | 9 | 0 | 0 | 3424 |
| highland | 2 | 8 | 14 | 34 | 34 | 11 | 46 | 1 | 12 | 11/76/5 | 8.2 | 15 | 3.1 | 17.8 | 12 | 1.4 | 118 | 22 | 10.3 | 1.7 | 0 (1) | 86/0/4/0/10 | 33 | 13.8 | 9 | 0 | 0 | 4245 |
| mean |  | 21.2 | 63.8 | 145.6 | 149.4 | 44.7 | 85.2 | 0.1 | 12.6 |  | 6.1 | 4.7 | 5.6 | 9.6 | 40.6 | 1.2 | 1548.6 | 65.1 | 21 | 2 |  |  | 42.1 | 6.7 | 19 | 0.3 | 0 | 6238.4 |

Year 25 mean 21.2 (D5 14), year 50 63.8 (42.2), year 100 145.6 (116), dwellings at year 100 44.7 (32.6); hunger deaths rise to 85.2 (19.8), the cost of villages growing faster than the food round them. All three animal kinds alive at year 100 in 9 of 10 worlds. Children are grown at 8 instead of 13 and may pair off at 10 instead of 16 (small children stay by the fire until 4); every hard-coded 13, 6, 16 and 17 in sim.js and view.js now reads these ages. Over 20 worlds at 96: dwellings standing at years 5/10/15/25 are 1.1/1.8/2.7/5.3 (before: 0.9/1.1/1.6/3.3), worlds with only one dwelling at year 15 fall from 9 to 2. Felling: a stand once begun (marked in a new saved field, cut) is worked until it is down before a new one is started, a day's felling takes 0.3 of a stand instead of 0.16, and what is left below 0.08 is cleared; firewood comes from begun stands first. Within 10 tiles of the fire the share of tiles with a tree fell from 53% to 39% (valley) and 73% to 54% (forest) in 30 years, measured before the faster felling. The dark fade of unseen land is off (SHOW_ALL in view.js; the sim still keeps known). Fixed along the way: a quarry could dig into a field (the check had a misplaced negation); someone walking to the fire to eat could be stopped by water and still eat from the store; worked-out pits only settled while people lived in the valley. Tests: 402 passed, 0 failed, 1 warning, 15 skipped. Scenarios: 23 passed, 1 warning.

## Strike leaves something to use (owner's request)

The standard table is identical to the previous one: nothing in it uses the god powers. Strike still kills what stands on the tile, but what it breaks is left lying there as a pile: an animal's body as meat (0.9 of its body mass), a tree as logs (12 wood for a full tree, the same as felling it), bare rock as loose stone (and a little pit). Only dry grass with nothing standing on it still catches fire. Piles are used for the same reasons as before: a grown member of a household short of food fetches meat in reach before looking for other food; builders carry logs or stone from a pile in reach before felling or quarrying; a hearth takes logs before a stand is cut. Meat rots within a few months, logs burn in a fire. Reach still limits it: in the check run, logs struck by the village were used within two years, while meat struck 41 tiles out lay and rotted. View: piles are drawn with the existing meat, log and stone sprites, and fetching is its own walk out and back. Tests: 403 passed, 0 failed (new unit: meat, logs and stone are left, and logs near the village get used), 1 warning, 15 skipped.

## E1: routes in the simulation

No change in behaviour yet (nothing in the simulation walks by route until E2): the table at 96 is identical to the previous one. route(x0, y0, x1, y1, who) is an A* search over tiles: dry ground and bridges only, round a closed fence for animals not led, made roads at two thirds of the cost, diagonal steps only where both sides are open; if the goal cannot be reached it returns the way to the reachable tile nearest it. 200 random pairs on the same piece of land at 96 tiles (all five lands): all found, none over water, 0.9 to 1.4 ms on average, 9 ms at most. The view now draws people along these routes instead of its own search. View cost per step in a forest world: 7 to 16 ms (at 48x a step comes every 0.4 s). A first version stored costs as 32-bit floats and could loop for ever on some pairs (a rounded-up cost always looked improvable); costs are 64-bit now. Tests: 405 passed, 0 failed (new unit: a route between land tiles on the same piece of land at 40 and 96, never over water), 1 warning, 15 skipped.

## Strike aims at what is drawn; piles can be carried by hand (owner's report)

No change to the table (god powers only). Strike missed animals because it hit only what stood on the simulation's tile at the start of the step, while the view draws animals between tiles as they walk: it now hits the creature under the pointer, wherever the simulation has it, and otherwise the tile. The Hand picks up a pile of meat, logs or stone; set down within two tiles of the fire it goes into the common store, the timber or the stone, anywhere else it lies there to be fetched. Checked in the browser with real mouse input: a deer clicked where it was drawn died and left meat; the meat dragged to the fire raised the store from 0.8 to 4.8. Tests: 406 passed, 0 failed (new unit for both), 1 warning, 15 skipped.

## E2 (gathering and fishing): real trips

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 27 | 61 | 195 | 205 | 53 | 154 | 0 | 14 | 7/98/5 | 3 | 4 | 4.4 | 7.4 | 36 | 1 | 1800 | 86 | 22.5 | 1.6 | 0 (1) | 84/0/2/0/13 | 63 | 5.5 | 21 | 3 | 0 | 11614 |
| valley | 2 | 8 | 70 | 178 | 194 | 62 | 161 | 0 | 13 | 10/244/5 | 3.2 | 0 | 4.6 | 6.1 | 75 | 1.2 | 2165 | 98 | 21.7 | 1.7 | 0.5 (2) | 77/1/3/4/15 | 58 | 5.1 | 25 | 0 | 0 | 13248 |
| plains | 1 | 41 | 176 | 440 | 578 | 106 | 449 | 0 | 14 | 0/147/5 | 3.3 | 15.7 | 9.7 | 18.4 | 111 | 0.9 | 7197 | 152 | 37.5 | 2.5 | 0.5 (4) | 74/0/2/0/23 | 94 | 15 | 37 | 0 | 0 | 68638 |
| plains | 2 | 28 | 84 | 139 | 148 | 38 | 165 | 0 | 12 | 5/169/0 | 3.1 | 13.5 | 6.5 | 22.2 | 54 | 1 | 875 | 47 | 18.6 | 2.4 |  | 76/1/2/0/21 | 78 | 13 | 17 | 0 | 0 | 15792 |
| forest | 1 | 6 | 58 | 134 | 134 | 44 | 99 | 0 | 13 | 21/179/2 | 3 | 0 | 6.8 | 6.2 | 37 | 1 | 1645 | 62 | 21.1 | 2.3 |  | 84/0/1/0/14 | 51 | 4.3 | 17 | 0 | 0 | 10199 |
| forest | 2 | 14 | 83 | 118 | 128 | 44 | 137 | 0 | 13 | 5/209/5 | 2.9 | 0 | 6.1 | 5.8 | 76 | 1.2 | 855 | 64 | 21.6 | 2.1 | 1 (1) | 88/0/2/0/10 | 35 | 4.9 | 17 | 0 | 0 | 10813 |
| lakeland | 1 | 8 | 44 | 173 | 175 | 47 | 83 | 1 | 12 | 5/132/5 | 3.1 | 14 | 6.5 | 9.1 | 33 | 1.2 | 1502 | 67 | 23 | 2.3 |  | 81/0/1/3/15 | 43 | 4.9 | 21 | 3 | 0 | 13258 |
| lakeland | 2 | 23 | 67 | 152 | 154 | 50 | 128 | 0 | 14 | 2/141/5 | 3.1 | 0 | 6.2 | 7.4 | 85 | 1.1 | 1209 | 79 | 25.7 | 2 | 0 (1) | 84/0/1/0/14 | 43 | 4.8 | 25 | 0 | 0 | 13155 |
| highland | 1 | 13 | 19 | 21 | 29 | 11 | 61 | 0 | 12 | 6/64/5 | 3.3 | 5.8 | 3 | 7.4 | 20 | 1 | 97 | 23 | 10.1 | 1.9 | 0 (1) | 77/0/1/0/21 | 41 | 4.7 | 9 | 0 | 0 | 5031 |
| highland | 2 | 12 | 46 | 50 | 74 | 20 | 106 | 0 | 13 | 3/97/4 | 3.1 | 4.4 | 3.3 | 10.8 | 55 | 1.1 | 282 | 35 | 11 | 1.6 | 0 (1) | 72/0/1/0/28 | 40 | 4.7 | 13 | 0 | 0 | 13635 |
| mean |  | 18 | 70.8 | 160 | 181.9 | 47.5 | 154.3 | 0.1 | 13 |  | 3.1 | 5.7 | 5.7 | 10.1 | 58.2 | 1.1 | 1762.7 | 71.3 | 21.3 | 2 |  |  | 54.6 | 6.7 | 20.2 | 0.6 | 0 | 17538.3 |

Gathering and fishing are journeys along the routes of E1: out, the work with the time left in the step, home with the load, which goes into the larder on arrival; a step that ends at the door can start the next trip. This replaces phase B's walking factor for food with real time taken. Year 100 mean 160 (previous table 145.6, +10%; the plan's check is within 15%), year 25 18 (21.2), year 50 70.8 (63.8), dwellings 47.5 (44.7); hunger deaths 154.3 (85.2): more people live further out, and a load out on the way home is not yet in the larder. Food trips average 3.1 tiles each way. The pace was the one number tuned, over 15 worlds of 100 years against the code before E2 (year 100 mean 132.8): 12 tiles a step gave 86.7, 16 gave 180.6, 20 gave 149.9 with year 25 matching (19.0 against 19.4); 20 it is. Four things the old shortcut had hidden came out on the way and were fixed by cause: a place that looks near can lie 157 tiles round a lake (the real route now decides, and the next best of three places is tried); people now walk home by dusk wherever the day ended (they were sleeping out in the cold); a birth needed the couple within 3 tiles at that moment (now: under one roof); courting needed the two within 4 tiles that evening (now: living within 12 tiles). The urge to build is weighed over the steps spent away. Runs are slower: 17.5 s per 100-year run on average in the browser, 69 s for plains #1 with 440 people. Hunting, felling, hauling and quarrying still happen in one step (the rest of E2). Tests: 408 passed, 0 failed (new unit: people stand where they gather, beside the water they fish, at their door when they bring food home), 1 warning, 13 skipped. Scenarios: 23 passed, 1 warning.

## Owner's report round: fields as plots, fence grows, yards, wear follows real ways, house facing, hunting

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 38 | 199 | 248 | 252 | 97 | 267 | 0 | 15 | 15/59/0 | 3 | 11.9 | 4.3 | 10.3 | 229 | 1 | 2942 | 155 | 26.4 | 1.6 | 0.5 (2) | 85/1/1/0/10 | 75 | 7.8 | 25 | 3 | 0 | 22492 |
| valley | 2 | 12 | 92 | 136 | 137 | 45 | 113 | 0 | 12 | 8/151/5 | 3.4 | 0 | 3.9 | 6.7 | 17 | 1.1 | 397 | 72 | 15.5 | 1.6 | 0 (1) | 85/1/1/0/13 | 52 | 4.4 | 17 | 0 | 0 | 11839 |
| plains | 1 | 28 | 113 | 196 | 225 | 76 | 230 | 0 | 12 | 5/112/5 | 2.9 | 8 | 9.5 | 11.6 | 154 | 1 | 2388 | 91 | 28.9 | 2.7 |  | 88/1/0/0/10 | 60 | 7.4 | 25 | 0 | 0 | 22081 |
| plains | 2 | 8 | 63 | 233 | 233 | 56 | 182 | 0 | 12 | 7/208/5 | 2.8 | 6.5 | 7.2 | 11.7 | 109 | 0.9 | 1700 | 60 | 21.2 | 2.5 |  | 83/1/1/0/12 | 55 | 8.6 | 25 | 0 | 0 | 10847 |
| forest | 1 | 26 | 133 | 133 | 145 | 45 | 176 | 0 | 12 | 32/65/1 | 2.9 | 0 | 7.3 | 7.5 | 141 | 1 | 551 | 69 | 21.7 | 2.3 |  | 84/1/1/0/12 | 54 | 5.7 | 17 | 0 | 0 | 12153 |
| forest | 2 | 34 | 167 | 106 | 167 | 51 | 220 | 0 | 14 | 9/131/0 | 2.8 | 0 | 6.4 | 6.2 | 53 | 1.1 | 574 | 63 | 22.2 | 2.3 | 0.5 (2) | 87/0/1/0/12 | 40 | 4.4 | 17 | 0 | 0 | 12111 |
| lakeland | 1 | 6 | 64 | 210 | 210 | 74 | 145 | 0 | 12 | 8/82/0 | 3.2 | 0 | 7.1 | 8.4 | 98 | 0.9 | 1664 | 93 | 22.1 | 2.3 | 1 (1) | 82/0/1/2/13 | 67 | 7 | 21 | 0 | 0 | 13563 |
| lakeland | 2 | 35 | 92 | 143 | 145 | 51 | 181 | 0 | 13 | 3/157/1 | 3.1 | 0 | 6.8 | 9 | 170 | 1 | 873 | 78 | 25 | 2.3 |  | 86/0/1/0/11 | 48 | 4.8 | 25 | 0 | 0 | 11563 |
| highland | 1 | 29 | 55 | 56 | 94 | 28 | 118 | 0 | 13 | 9/20/5 | 3.3 | 0 | 3.2 | 13.2 | 78 | 1.1 | 190 | 47 | 11.9 | 1.6 | 0.5 (2) | 76/0/4/0/18 | 59 | 11 | 13 | 0 | 0 | 10799 |
| highland | 2 | 9 | 39 | 75 | 81 | 28 | 87 | 0 | 13 | 6/82/5 | 3.5 | 8 | 3.3 | 12.2 | 96 | 1.1 | 185 | 47 | 12.7 | 1.6 | 0 (1) | 78/0/4/0/16 | 37 | 8.8 | 13 | 0 | 0 | 10150 |
| mean |  | 22.5 | 101.7 | 153.6 | 168.9 | 55.1 | 171.9 | 0 | 12.8 |  | 3.1 | 3.4 | 5.9 | 9.7 | 114.5 | 1 | 1146.4 | 77.5 | 20.8 | 2.1 |  |  | 54.7 | 7 | 19.8 | 0.3 | 0 | 13759.8 |

Year 100 mean 153.6 (E2 160), year 25 22.5, year 50 101.7, dwellings 55.1 (47.5), hunger deaths 171.9 (154.3), no resettles; deer, rabbits and wolves all alive in 5 of 10 worlds at year 100 (wolves 0 or 1 in five). Changes: fields are whole lots of the lattice next to the household's own (fixed form, like houses); the fence grows (old stakes stay while the new line is driven, the ones left inside come down when the new ring closes: in valley #4 never fewer than 155 stakes stood during an expansion); every building's lot is drawn as a trodden yard, the floor under the roof bare earth; where water stands across the lattice, wear follows the real way round or over a bridge (no street runs into a river from both banks); food trips wear the route they walked; no trees or bushes on made roads or sown fields; houses are mirrored so the door faces the fire; hunters hunt as their trade and a group hunt looks as far as the hunters' reach (people killed 63 rabbits and 5 deer in 25 years over 6 worlds, against 40 and 3); a struck animal's body fades within about a second. Fixed on the way, found by the checks: a diagonal step could squeeze between two water tiles (a newcomer crossed a river that way); someone stopped by water on the way to the fire kept the 'home' mark; remembered routes depended on the road map at the time, which broke save/load identity (now tied to the version of roads, bridges and water). Speed: 100-year runs average 13.8 s at 96 in the browser; route searches stop once they cannot beat the limit, the way home is the way out reversed, straight walks skip the search. Tests: 405 passed, 0 failed, 0 warnings, 17 skipped. Scenarios: 24 passed.

## People with character, and 31 village objects

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 41 | 122 | 274 | 302 | 99 | 259 | 0 | 15 | 19/58/5 | 3.1 | 7.7 | 4.5 | 9.5 | 215 | 1 | 3139 | 162 | 26.7 | 1.6 | 1 (1) | 84/1/1/0/12 | 71 | 7.9 | 25 | 3 | 0 | 21824 |
| valley | 2 | 31 | 127 | 186 | 239 | 71 | 217 | 0 | 13 | 0/188/0 | 3.2 | 0 | 4.6 | 7.3 | 99 | 1 | 1645 | 114 | 19.2 | 1.7 | 0 (1) | 80/1/3/0/16 | 63 | 6.2 | 21 | 0 | 0 | 16284 |
| plains | 1 | 34 | 138 | 237 | 283 | 90 | 257 | 0 | 13 | 7/263/0 | 2.8 | 7.8 | 8.8 | 11.8 | 159 | 1.1 | 3517 | 109 | 31.4 | 2.5 |  | 83/1/1/0/12 | 63 | 10.2 | 29 | 0 | 0 | 22133 |
| plains | 2 | 26 | 116 | 179 | 214 | 73 | 260 | 0 | 12 | 19/195/1 | 2.8 | 8.2 | 7 | 12.8 | 246 | 0.9 | 2554 | 78 | 23.8 | 2.4 |  | 86/0/1/0/10 | 57 | 8.1 | 29 | 0 | 0 | 12278 |
| forest | 1 | 27 | 107 | 119 | 131 | 49 | 157 | 0 | 13 | 5/254/5 | 3 | 5.6 | 7.4 | 8.9 | 121 | 1.1 | 634 | 76 | 22.4 | 2.3 | 1 (1) | 83/0/1/0/13 | 54 | 6 | 17 | 0 | 0 | 12430 |
| forest | 2 | 32 | 146 | 86 | 154 | 45 | 212 | 0 | 14 | 7/153/0 | 2.7 | 3.2 | 5.8 | 6.7 | 85 | 1.1 | 403 | 45 | 22.2 | 2.3 | 1 (1) | 85/1/2/0/12 | 42 | 5.9 | 13 | 0 | 0 | 10522 |
| lakeland | 1 | 30 | 140 | 240 | 284 | 87 | 256 | 0 | 13 | 41/75/6 | 3 | 0 | 7.2 | 8.5 | 160 | 0.9 | 2129 | 109 | 24.6 | 2.4 | 1 (1) | 83/0/1/0/16 | 66 | 5.8 | 21 | 0 | 0 | 16579 |
| lakeland | 2 | 17 | 99 | 223 | 223 | 74 | 138 | 0 | 13 | 27/165/5 | 3.1 | 5.4 | 7.1 | 7.7 | 65 | 1 | 1610 | 124 | 30.3 | 2.2 |  | 87/1/1/0/11 | 53 | 5.9 | 29 | 0 | 0 | 12203 |
| highland | 1 | 24 | 50 | 64 | 65 | 18 | 108 | 0 | 13 | 2/36/0 | 3.4 | 0 | 3.2 | 12.8 | 50 | 1 | 74 | 31 | 10 | 1.6 | 0 (1) | 72/1/2/0/25 | 55 | 7 | 9 | 0 | 0 | 7306 |
| highland | 2 | 19 | 67 | 77 | 90 | 36 | 137 | 0 | 13 | 10/45/5 | 3.3 | 12.9 | 3.3 | 13.4 | 83 | 1 | 257 | 58 | 14.5 | 1.5 | 0.5 (2) | 75/0/1/0/23 | 41 | 6.2 | 13 | 0 | 0 | 10988 |
| mean |  | 28.1 | 111.2 | 168.5 | 198.5 | 64.2 | 200.1 | 0 | 13.2 |  | 3 | 5.1 | 5.9 | 9.9 | 128.3 | 1 | 1596.2 | 90.6 | 22.5 | 2.1 |  |  | 56.5 | 6.9 | 20.6 | 0.3 | 0 | 14254.7 |

Year 100 mean 168.5 (previous 153.6), year 25 28.1, year 50 111.2, dwellings 64.2 (55.1), hunger deaths 200.1 (171.9), no resettles in this table; over 30 worlds at 96: year 100 mean 195.8 against 176.6 before hobbies, with 3 worlds emptying once or twice (6 resettles) against 1 (2). Each person loves one to three things (music, singing, tales, dancing, gardening, carving, weaving), taken from a parent more often than not or learned from daily work; free evenings (fed, with food put by at home) go to them, and gladness (joy) follows from them, food, warmth and a partner and helps grief pass. 31 objects generated with Retro Diffusion's Lite isometric style at $0.05 each ($1.55; all art so far $9.03 of the owner's $10), cleaned, scaled to Eden's proportions and placed by cause at fixed places in each yard (never on a street or field), plus stalls, spit, music corner, signpost, trough, lanterns, scarecrows and stumps by the fire and fields. Code-drawn: gardens, benches, woodpiles, log seats. Tests: 402 passed, 0 failed, 3 warnings, 17 skipped. Scenarios: 23 passed, 1 warning.


## E2 (the rest): timber, stone and firewood as trips

Felling, fetching firewood and quarrying now walk the real route out, work there, and carry the load home (logs, stones, sticks). Timber reaches the store when the carrier arrives, not when the axe falls. Two fixes came with it:
- `wayDist` measured straight across a river bend when both ends were on the same land. When open water lies on the straight line it now uses the real walk around (or over a bridge), cached until water, bridges or roads change.
- Nobody sets out on a haul they cannot walk there and back before dark. Before this, a builder who slept by the fire with their house site across a river (95 tiles' walk) set out every morning and was turned home by night empty-handed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 41 | 199 | 213 | 277 | 103 | 319 | 0 | 15 | 8/76/5 | 2.7 | 27.4 | 18.3 | 6.1 | 273 | 1 | 3530 | 197 | 42.1 | 8.8 | 33.5 (2) | 79/0/2/0/17 | 72 | 7.7 | 29 | 3 | 0 | 27194 |
| valley | 2 | 30 | 74 | 107 | 116 | 39 | 154 | 0 | 12 | 6/254/5 | 2.8 | 0 | 16.1 | 4.4 | 109 | 1.1 | 320 | 100 | 21.1 | 4.1 | 0 (1) | 85/2/2/0/10 | 51 | 4.4 | 13 | 0 | 0 | 14108 |
| plains | 1 | 9 | 51 | 178 | 235 | 60 | 184 | 0 | 12 | 3/198/5 | 2.5 | 22.4 | 21.5 | 5.7 | 57 | 0.9 | 1628 | 47 | 34.8 | 5.1 |  | 87/0/1/0/10 | 46 | 6 | 21 | 0 | 0 | 14441 |
| plains | 2 | 29 | 148 | 253 | 276 | 77 | 344 | 0 | 12 | 0/138/2 | 2.6 | 3.6 | 21.2 | 6.4 | 144 | 0.9 | 2903 | 121 | 25.8 | 5.1 |  | 80/0/1/0/17 | 53 | 6.7 | 29 | 0 | 0 | 16848 |
| forest | 1 | 8 | 50 | 212 | 266 | 80 | 181 | 2 | 13 | 3/131/5 | 2.4 | 14.3 | 15.8 | 3.5 | 132 | 1.1 | 701 | 81 | 89.3 | 27.2 | 12 (1) | 83/1/3/0/12 | 60 | 4.5 | 25 | 2 | 0 | 30363 |
| forest | 2 | 32 | 98 | 91 | 126 | 44 | 188 | 0 | 12 | 14/260/0 | 2.3 | 2 | 13.6 | 3.7 | 37 | 1.1 | 353 | 21 | 20.2 | 4.4 | 0 (1) | 83/1/2/0/13 | 34 | 5.1 | 13 | 0 | 0 | 13111 |
| lakeland | 1 | 20 | 103 | 236 | 249 | 94 | 226 | 0 | 14 | 34/135/0 | 2.7 | 0 | 18.9 | 5.8 | 97 | 1 | 2410 | 89 | 28.5 | 5.3 | 5 (1) | 80/1/2/1/15 | 69 | 6.8 | 25 | 0 | 0 | 20617 |
| lakeland | 2 | 19 | 104 | 143 | 150 | 59 | 143 | 0 | 13 | 18/190/5 | 2.4 | 4 | 14.6 | 5.2 | 60 | 1.1 | 1015 | 76 | 27.6 | 4.9 | 0 (1) | 87/0/4/2/7 | 43 | 5.1 | 25 | 0 | 0 | 13630 |
| highland | 1 | 10 | 57 | 77 | 81 | 28 | 105 | 0 | 14 | 5/65/5 | 2.9 | 0 | 16.4 | 6.7 | 76 | 1.1 | 193 | 67 | 15 | 2.7 | 0 (1) | 76/0/3/0/19 | 53 | 6.5 | 13 | 0 | 0 | 8753 |
| highland | 2 | 2 | 24 | 23 | 52 | 18 | 52 | 2 | 13 | 10/70/0 | 2.8 | 9.8 | 14.2 | 6 | 51 | 1.1 | 76 | 42 | 17.3 | 2.8 | 1 (1) | 80/2/2/0/16 | 34 | 9.5 | 9 | 0 | 0 | 5993 |
| mean |  | 20 | 90.8 | 153.3 | 182.8 | 60.2 | 189.6 | 0.4 | 13 |  | 2.6 | 8.4 | 17.1 | 5.4 | 103.6 | 1 | 1312.9 | 84.1 | 32.2 | 7 |  |  | 51.5 | 6.2 | 20.2 | 0.5 | 0 | 16505.8 |

Year 100 mean 153.3 (before this step 168.5 in the table; 172.5 in a direct run with the same options), year 25 20.0 (28.1), dwellings 60.2 (64.2), hunger deaths 189.6 (200.1), 2 resettles (forest 1, highland 2). Stone trips are now measured as the real route walked from where the person stands: 17.1 tiles against 5.9 straight-line from the site before; timber trips 8.4, firewood 5.4. Without the before-dark check, year 100 was 112.6. Speed: 16.5 s per world (14.3). Tests 413 passed, 0 failed; scenarios 22 passed.

## Rocks, bushes and tall grass from Yar's tileset, recoloured per season (view only)

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 41 | 199 | 213 | 277 | 103 | 319 | 0 | 15 | 8/76/5 | 2.7 | 27.4 | 18.3 | 6.1 | 273 | 1 | 3530 | 197 | 42.1 | 8.8 | 33.5 (2) | 79/0/2/0/17 | 72 | 7.7 | 29 | 3 | 0 | 31365 |
| valley | 2 | 30 | 74 | 107 | 116 | 39 | 154 | 0 | 12 | 6/254/5 | 2.8 | 0 | 16.1 | 4.4 | 109 | 1.1 | 320 | 100 | 21.1 | 4.1 | 0 (1) | 85/2/2/0/10 | 51 | 4.4 | 13 | 0 | 0 | 12683 |
| plains | 1 | 9 | 51 | 178 | 235 | 60 | 184 | 0 | 12 | 3/198/5 | 2.5 | 22.4 | 21.5 | 5.7 | 57 | 0.9 | 1628 | 47 | 34.8 | 5.1 |  | 87/0/1/0/10 | 46 | 6 | 21 | 0 | 0 | 13725 |
| plains | 2 | 29 | 148 | 253 | 276 | 77 | 344 | 0 | 12 | 0/138/2 | 2.6 | 3.6 | 21.2 | 6.4 | 144 | 0.9 | 2903 | 121 | 25.8 | 5.1 |  | 80/0/1/0/17 | 53 | 6.7 | 29 | 0 | 0 | 17071 |
| forest | 1 | 8 | 50 | 212 | 266 | 80 | 181 | 2 | 13 | 3/131/5 | 2.4 | 14.3 | 15.8 | 3.5 | 132 | 1.1 | 701 | 81 | 89.3 | 27.2 | 12 (1) | 83/1/3/0/12 | 60 | 4.5 | 25 | 2 | 0 | 27210 |
| forest | 2 | 32 | 98 | 91 | 126 | 44 | 188 | 0 | 12 | 14/260/0 | 2.3 | 2 | 13.6 | 3.7 | 37 | 1.1 | 353 | 21 | 20.2 | 4.4 | 0 (1) | 83/1/2/0/13 | 34 | 5.1 | 13 | 0 | 0 | 11225 |
| lakeland | 1 | 20 | 103 | 236 | 249 | 94 | 226 | 0 | 14 | 34/135/0 | 2.7 | 0 | 18.9 | 5.8 | 97 | 1 | 2410 | 89 | 28.5 | 5.3 | 5 (1) | 80/1/2/1/15 | 69 | 6.8 | 25 | 0 | 0 | 18868 |
| lakeland | 2 | 19 | 104 | 143 | 150 | 59 | 143 | 0 | 13 | 18/190/5 | 2.4 | 4 | 14.6 | 5.2 | 60 | 1.1 | 1015 | 76 | 27.6 | 4.9 | 0 (1) | 87/0/4/2/7 | 43 | 5.1 | 25 | 0 | 0 | 12230 |
| highland | 1 | 10 | 57 | 77 | 81 | 28 | 105 | 0 | 14 | 5/65/5 | 2.9 | 0 | 16.4 | 6.7 | 76 | 1.1 | 193 | 67 | 15 | 2.7 | 0 (1) | 76/0/3/0/19 | 53 | 6.5 | 13 | 0 | 0 | 7878 |
| highland | 2 | 2 | 24 | 23 | 52 | 18 | 52 | 2 | 13 | 10/70/0 | 2.8 | 9.8 | 14.2 | 6 | 51 | 1.1 | 76 | 42 | 17.3 | 2.8 | 1 (1) | 80/2/2/0/16 | 34 | 9.5 | 9 | 0 | 0 | 5450 |
| mean |  | 20 | 90.8 | 153.3 | 182.8 | 60.2 | 189.6 | 0.4 | 13 |  | 2.6 | 8.4 | 17.1 | 5.4 | 103.6 | 1 | 1312.9 | 84.1 | 32.2 | 7 |  |  | 51.5 | 6.2 | 20.2 | 0.5 | 0 | 15770.5 |

Identical to the E2 entry above in every simulated column (only the ms column, the run time, differs), as expected: the change is in drawing only (`src/sprites.js`, `src/view.js`). Tests: 413 passed, 0 failed, 3 warnings, 18 skipped. In seed 7 (valley, size 96) the view shows about 735 bushes, 770 rocks (105 of them wet by water) and, once grass has grown long, 100 to 160 tufts of tall grass; in Year 2 autumn 198 bushes and 60 tufts had turned gold or red, and in Year 3 winter 705 bushes and tufts carried snow.

## Owner's report: wolves' den by the camp, furniture too early, yard under a tent, floating sleepers

- A pack does not dig a den within 12 tiles of the camp or 8 of a household; a resettling camp avoids existing dens. Strike breaks a den or burrow.
- Furniture follows what the people can make: nothing round a tent; joinery (table, crates, coop, racks, toys) once there is a timber roof; barrels, rocking chair, loom, workbench, hives and barrow need the tools idea (the barrow also the wheel); market stalls wait for trade (phase G/H), so none show yet; a haystack needs farming.
- A tent leaves the ground as it is (no yard square); huts and houses still mark theirs. Stumps are not drawn on household plots.
- Lying people are trimmed to their painted rows, so a sleeper lies on the ground, not on the empty margin of the standing sprite.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 41 | 199 | 314 | 356 | 118 | 296 | 0 | 15 | 7/144/0 | 2.5 | 27.4 | 20.5 | 5.7 | 251 | 1 | 4546 | 194 | 50.5 | 8.3 | 33.5 (2) | 85/0/3/0/10 | 73 | 6.8 | 33 | 3 | 0 | 30781 |
| valley | 2 | 30 | 74 | 107 | 116 | 39 | 154 | 0 | 12 | 6/254/5 | 2.8 | 0 | 16.1 | 4.4 | 109 | 1.1 | 320 | 100 | 21.1 | 4.1 | 0 (1) | 85/2/2/0/10 | 51 | 4.4 | 13 | 0 | 0 | 14754 |
| plains | 1 | 23 | 134 | 249 | 269 | 91 | 291 | 0 | 13 | 4/265/3 | 2.5 | 19.9 | 22.4 | 8.7 | 230 | 1 | 3460 | 69 | 31.3 | 4.4 |  | 86/0/1/0/9 | 68 | 9.6 | 29 | 0 | 0 | 22419 |
| plains | 2 | 17 | 116 | 194 | 255 | 82 | 260 | 0 | 12 | 9/149/5 | 2.4 | 10.8 | 22.3 | 6.4 | 131 | 1 | 3271 | 77 | 29.5 | 6.3 |  | 83/0/1/0/15 | 56 | 5.1 | 33 | 0 | 0 | 17472 |
| forest | 1 | 4 | 4 | 7 | 7 | 3 | 7 | 1 | 8 | 30/282/11 | 2.6 | 27.9 | 5.9 | 2.9 | 9 | 1.5 | 3 | 5 | 6.2 | 3.5 |  | 32/0/1/21/46 | 7 | 3.2 | 8 | 0 | 0 | 5154 |
| forest | 2 | 32 | 98 | 95 | 126 | 44 | 190 | 0 | 13 | 12/139/4 | 2.3 | 2 | 13.6 | 3.8 | 46 | 1.1 | 353 | 21 | 20.2 | 4.4 | 0 (2) | 85/1/2/1/9 | 32 | 5.5 | 13 | 0 | 0 | 13520 |
| lakeland | 1 | 20 | 103 | 240 | 249 | 90 | 222 | 0 | 14 | 34/95/0 | 2.7 | 0 | 19.3 | 5.7 | 100 | 1 | 2226 | 87 | 27.9 | 4.2 | 5 (1) | 84/0/1/0/13 | 67 | 6.6 | 25 | 0 | 0 | 20881 |
| lakeland | 2 | 37 | 111 | 175 | 192 | 63 | 199 | 0 | 14 | 27/99/7 | 2.5 | 3 | 21.6 | 5 | 107 | 1.1 | 1019 | 66 | 24.8 | 5 | 0 (1) | 82/1/2/2/13 | 50 | 5.7 | 25 | 0 | 0 | 17210 |
| highland | 1 | 10 | 57 | 77 | 81 | 28 | 105 | 0 | 14 | 5/65/5 | 2.9 | 0 | 16.4 | 6.7 | 76 | 1.1 | 193 | 67 | 15 | 2.7 | 0 (1) | 76/0/3/0/19 | 53 | 6.5 | 13 | 0 | 0 | 9111 |
| highland | 2 | 22 | 49 | 64 | 83 | 23 | 145 | 0 | 13 | 9/106/5 | 2.9 | 21.2 | 6.5 | 8.6 | 55 | 1 | 91 | 53 | 26.7 | 4.7 | 0 (1) | 79/1/3/0/16 | 33 | 9.2 | 9 | 0 | 0 | 8893 |
| mean |  | 23.6 | 94.5 | 152.2 | 173.4 | 58.1 | 186.9 | 0.1 | 12.8 |  | 2.6 | 11.2 | 16.5 | 5.8 | 111.4 | 1.1 | 1548.2 | 73.9 | 25.3 | 4.8 |  |  | 49 | 6.3 | 20.1 | 0.3 | 0 | 16019.5 |

Year 100 mean 152.2 (153.3 before), one resettle (forest 1 emptied at year 25 against none there before). Tests 417 passed, 0 failed, with a new check that no den lies within 12 tiles of the camp in 9 worlds over 12 years and that a struck den is broken.

## Owner's report: ground squares left in an old season

At fast speeds the ground chunks go stale again every step, and the painter always took the first stale chunk in list order, so the early chunks were repainted again and again and a late one could keep its winter picture for good (the white square in the owner's screenshot). Now the visible chunk that has waited longest goes first, and the ground gets a time slice of each frame (9 ms when fast, 4 ms at 1x) instead of a fixed number of rows. Checked in the browser at 48x, zoomed out, valley seed 2: the longest any visible chunk waited for its repaint was 31.5 s and growing before, 0.46 to 0.76 s after; 38 to 49 frames a second both ways. Simulation unchanged (tests 417 passed, 0 failed; table as in the previous entry).

## Owner's request: the leafy Yar bush is what people sow

`yar_bush_a` is no longer a wild bush; it is the crop. On every sown field tile a plant stands as far on as the season's warmth has brought the harvest (`cropWarm`): a small spring-green sprout, a larger one, a full plant (dry-coloured on parched soil), then ripe, gold and hung with fruit; after the harvest the field is bare stubble again. Each plant is a little ahead or behind its neighbours. Wild bushes keep the other two Yar drawings. View only: the 100-year table is identical to the entry before (year 100 mean 152.2, dwellings 58.1, hunger deaths 186.9). Tests 417 passed, 0 failed. Checked by stills of valley seed 1 at year 15 with the harvest half grown and ripe.


## E3 and E4: the view draws what the simulation did

- The simulation keeps, for each creature, the tiles it passed through in the last step (`W.trailOf(id)`; beside the state, not in it, so saves are unchanged). A move made in one jump (home by dusk, to the fire to eat) is filled in along the route it would be walked.
- The view walks people and animals along that trail, then plays the work where the step left them. Anything a plan asks farther than 1.4 tiles from that place is drawn at the edge of that reach, so the old invented trips (carrying logs to the plot, meat to the store, a random field across the valley, a fawn trotting after a mother tiles away) are gone. `Plan.go`'s own street-snapping is removed.
- A bug the new kill check found: `nearest()` searched the cells filled at the start of the step, so a wolf that had moved since could be "within 3" while standing 5 away, and was killed from there. It now measures from where each creature is now.
- The water checks now count a finished bridge as dry ground (trips end a step mid-bridge).

Checks. New invariant: every kill is made by a creature standing within 3 tiles of its victim at the moment of the kill (it failed twice before the `nearest()` fix). In the browser, sampled just before every step for 40 s at 4x after 8 years (EdenGame.drift()): people more than 1.5 tiles from their state position, before → after: valley 1: 9 of 44 → 0 of 44; lakeland 2: 16 of 44 → 0 of 44; forest 1 and highland 3: 0 after. Animals: 35 of 1813 and 31 of 1782 → 0. At 1x: 0 of 12 people, 0 of 221 animals. At 16x, 2 of 143 people samples lag (several steps run inside one frame before the drawing catches up); animals 0 of 2870. Tests 428 passed, 0 failed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 33 | 145 | 254 | 254 | 99 | 233 | 0 | 15 | 11/110/5 | 2.6 | 0 | 17 | 5.7 | 263 | 1.1 | 3452 | 248 | 49.4 | 6.4 | 0 (2) | 76/0/3/4/15 | 61 | 6 | 29 | 3 | 0 | 27470 |
| valley | 2 | 30 | 107 | 131 | 132 | 45 | 177 | 0 | 12 | 15/139/5 | 2.6 | 0 | 18.7 | 4.5 | 93 | 1.1 | 470 | 118 | 42 | 4.4 | 0 (1) | 84/1/2/0/12 | 57 | 5.2 | 17 | 0 | 0 | 19153 |
| plains | 1 | 4 | 3 | 14 | 14 | 4 | 6 | 1 | 11 | 6/330/5 | 2.6 | 18.2 | 8.8 | 2.7 | 1 | 1 | 15 | 6 | 17.1 | 4.2 |  | 48/7/6/5/26 | 12 | 3.1 | 8 | 0 | 0 | 5723 |
| plains | 2 | 16 | 85 | 187 | 214 | 77 | 226 | 0 | 12 | 5/109/5 | 2.4 | 8 | 18.5 | 6.5 | 162 | 1 | 2854 | 77 | 23 | 6 |  | 88/1/1/0/7 | 52 | 8 | 29 | 0 | 0 | 18087 |
| forest | 1 | 11 | 73 | 166 | 195 | 65 | 154 | 1 | 12 | 3/179/5 | 2.6 | 26 | 15.9 | 4.1 | 58 | 1.1 | 910 | 63 | 20 | 5.4 |  | 87/1/3/0/8 | 43 | 4.5 | 17 | 0 | 0 | 14086 |
| forest | 2 | 32 | 155 | 105 | 162 | 43 | 210 | 0 | 14 | 8/287/0 | 2.3 | 2 | 18.8 | 3.9 | 63 | 1.1 | 395 | 28 | 27 | 4 | 0 (1) | 90/0/3/0/7 | 37 | 4.7 | 13 | 0 | 0 | 15311 |
| lakeland | 1 | 6 | 63 | 312 | 312 | 97 | 169 | 0 | 14 | 1/205/1 | 2.7 | 0 | 21.1 | 4.8 | 128 | 0.9 | 2882 | 74 | 30.9 | 6.3 | 0 (1) | 84/0/3/1/10 | 63 | 5.5 | 25 | 0 | 0 | 20916 |
| lakeland | 2 | 22 | 67 | 166 | 174 | 59 | 136 | 0 | 12 | 10/109/5 | 2.4 | 4.6 | 16.4 | 4.7 | 124 | 1 | 1153 | 68 | 28.3 | 3.6 |  | 85/1/3/1/9 | 47 | 5.2 | 25 | 0 | 0 | 14463 |
| highland | 1 | 15 | 60 | 56 | 98 | 30 | 134 | 0 | 14 | 5/84/0 | 3 | 0 | 15.1 | 7.5 | 118 | 1 | 243 | 53 | 19.6 | 1.8 | 0 (1) | 78/1/4/0/16 | 53 | 6.7 | 13 | 0 | 0 | 12053 |
| highland | 2 | 4 | 8 | 37 | 39 | 12 | 34 | 1 | 13 | 8/60/0 | 2.6 | 0 | 16.6 | 7.8 | 19 | 1.2 | 75 | 31 | 16.5 | 2.9 | 0 (1) | 70/0/1/0/28 | 33 | 5.1 | 9 | 0 | 0 | 5190 |
| mean |  | 17.3 | 76.6 | 142.8 | 159.4 | 53.1 | 147.9 | 0.3 | 12.9 |  | 2.6 | 5.9 | 16.7 | 5.2 | 102.9 | 1.1 | 1244.9 | 76.6 | 27.4 | 4.5 |  |  | 45.8 | 5.4 | 18.5 | 0.3 | 0 | 15245.2 |

Year 100 mean 142.8 (152.2 before), year 25 17.3 (23.6), dwellings 53.1 (58.1), hunger deaths 147.9 (186.9), 3 resettles (plains 1, forest 1, highland 2) against 1. Wolves are alive at year 100 in all 10 worlds (before: none left in 1 of 10); people no longer kill them from across the camp.

## F1: a BUILDINGS registry

Tent, hut, house, well and fence are rows of `BUILDINGS` (stages with the wood and stone each needs, roof, whether people sleep in it, the idea it needs, what it is rebuilt into, lots). `raised()`, `live()`, the choice of what to raise, what is carried to a plot before each stage and the settlement's roof read the rows; `DWELL` is now derived from them for the view and the tests. New unit check: every row has stages with finite costs, a roof, an idea that exists and a known rebuild. Determinism: the 100-year table is identical to the E3 entry in every column but run time (year 100 mean 142.8), and four 40-year worlds at sizes 40 and 96 end with the same people, creatures, log and sites. Tests 429 passed, 0 failed.


## F2: goods, and food of four kinds

`GOODS` rows: grain (loses 0.12 of itself a year before any pot or granary), fruit and roots (0.4), meat (0.6), fish (0.7); timber, stone, firewood and tools as rows that do not rot (kept where they were). Before, all food lost 0.35 a year. Each larder and the common store keep their total as before and, beside it, how much of each kind (`mix`). Food is marked where it comes in (gathering: fruit; fishing: fish; hunting and meat piles: meat; the harvest: grain); food moved between larders and the store goes as it is mixed; food eaten comes out of every kind alike.

New checks: every holder's kinds add up to its total and none is negative (yearly, every world); a store of 30 of each kind keeps more grain than meat or fish after three steps; at year 30 in lakeland seed 1 the households' grain shares differ by more than 0.1 (they range 0.45 to 0.82 there). Tests 440 passed, 0 failed; scenarios 24 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 16 | 107 | 261 | 310 | 93 | 251 | 0 | 14 | 6/128/5 | 2.9 | 10.7 | 19.7 | 6.1 | 267 | 1 | 2547 | 168 | 37.7 | 6.2 |  | 83/0/3/1/12 | 65 | 6.6 | 25 | 3 | 0 | 25199 |
| valley | 2 | 29 | 115 | 163 | 167 | 65 | 122 | 0 | 12 | 6/214/0 | 2.7 | 0 | 19.7 | 4.4 | 92 | 1.1 | 969 | 142 | 29.8 | 3.7 |  | 78/1/3/1/14 | 59 | 6.2 | 21 | 0 | 0 | 19799 |
| plains | 1 | 4 | 3 | 52 | 52 | 12 | 4 | 1 | 11 | 5/270/5 | 2.4 | 2.7 | 10.2 | 3.1 | 5 |  | 94 | 14 | 14.3 | 3.1 |  | 65/3/1/0/31 | 20 | 3.3 | 9 | 0 | 0 | 6513 |
| plains | 2 | 16 | 108 | 222 | 312 | 82 | 311 | 0 | 12 | 0/154/5 | 2.7 | 3.5 | 19.8 | 7.3 | 114 | 0.9 | 3157 | 52 | 19.3 | 3.8 |  | 76/0/1/0/20 | 62 | 5.9 | 33 | 0 | 0 | 18579 |
| forest | 1 | 9 | 77 | 97 | 131 | 39 | 138 | 0 | 13 | 27/134/0 | 2.5 | 20.7 | 16 | 4.3 | 137 | 1 | 221 | 34 | 23.9 | 4.5 |  | 83/1/1/0/13 | 41 | 4.5 | 13 | 0 | 0 | 13877 |
| forest | 2 | 31 | 146 | 117 | 149 | 43 | 188 | 0 | 12 | 5/62/5 | 2.3 | 2 | 19.6 | 3.8 | 145 | 1 | 385 | 26 | 19.7 | 2.9 | 0 (1) | 88/0/1/0/9 | 36 | 4.5 | 13 | 0 | 0 | 14306 |
| lakeland | 1 | 9 | 69 | 280 | 374 | 99 | 289 | 0 | 15 | 5/141/5 | 2.9 | 0 | 20 | 5.6 | 141 | 0.9 | 2856 | 82 | 33.2 | 5.3 | 0 (1) | 76/0/3/0/19 | 69 | 6.2 | 25 | 1 | 0 | 21199 |
| lakeland | 2 | 26 | 96 | 103 | 130 | 36 | 153 | 0 | 13 | 7/149/5 | 2.4 | 0 | 15.1 | 5.4 | 92 | 1.1 | 464 | 58 | 19.6 | 4.6 | 0 (2) | 88/1/1/1/6 | 34 | 6.1 | 21 | 0 | 0 | 12117 |
| highland | 1 | 18 | 66 | 65 | 66 | 27 | 79 | 0 | 13 | 11/88/0 | 2.8 | 0 | 14.9 | 6.9 | 78 | 1.1 | 110 | 53 | 17.6 | 2.1 | 0 (1) | 71/1/4/0/18 | 51 | 8.9 | 13 | 0 | 0 | 9938 |
| highland | 2 | 7 | 69 | 54 | 94 | 20 | 109 | 0 | 12 | 5/90/0 | 2.9 | 2.4 | 7.7 | 9.2 | 20 | 0.9 | 69 | 47 | 14.1 | 3.5 |  | 82/1/3/0/10 | 34 | 9.6 | 9 | 0 | 0 | 9095 |
| mean |  | 16.5 | 85.6 | 141.4 | 178.5 | 51.6 | 164.4 | 0.1 | 12.7 |  | 2.6 | 4.2 | 16.3 | 5.6 | 109.1 | 1 | 1087.2 | 67.6 | 22.9 | 4 |  |  | 47.1 | 6.2 | 18.2 | 0.4 | 0 | 15062.2 |

Year 100 mean 141.4 (142.8 before), year 25 16.5 (17.3), dwellings 51.6 (53.1), hunger deaths 164.4 (147.9), 1 resettle (plains 1) against 3.


## F3: storehouse and granary

Pottery and the granary are no longer global switches. `BUILDINGS` has a storehouse (needs pottery; 2 stages, 5 timber and 1 stone) and a granary (needs the granary idea; 2 stages, 6 timber and 2 stone). They go up, on common ground where the households can all reach them, only when food has actually been rotting (what was lost over about the last year, `T.rotYear`, is more than half a ration a head) and the idea is known. While one stands, the common store rots more slowly: in a storehouse every kind at 0.7 of its rate; in a granary grain at 0.35, fruit at 0.6, meat and fish at 0.7. A flood or a fire on its tile ruins it and the store rots at the full rate again. Household larders keep only what their own roof gives (a tent 1, anything better 0.75); the old global pottery and granary factors on them are gone (pots in each house come with F4's kiln).

Also: the code that meant "a home" by "not a well" now asks the row whether people sleep there (`isHome`), so a store is not counted as a household's roof; the first-roof message is only for homes; no rock or bush is drawn on any building's 3x3 plot. Code-drawn sprites: a granary on posts with staddle stones and thatch, a storehouse with pots by the door.

Checks. Unit: with nobody to eat from it, a store of 60 grain loses more in a step once the granary is ruined than while it stands (a direct test of "destroy the granary; spoilage rises the same year"). In 60-year runs of valley 1, lakeland 1 and plains 2 a storehouse and a granary are built in each. Tests 440 passed, 0 failed; scenarios 24 passed. Stills of valley 1 at year 60 show both.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 17 | 84 | 183 | 204 | 67 | 185 | 0 | 14 | 15/77/5 | 2.6 | 17.2 | 15 | 5.1 | 121 | 1.1 | 1653 | 112 | 45.2 | 5.8 | 0 (1) | 86/0/3/0/11 | 57 | 6.2 | 21 | 3 | 0 | 18785 |
| valley | 2 | 8 | 6 | 26 | 26 | 5 | 6 | 1 | 8 | 28/235/6 | 2.7 | 0 | 5.2 | 2.9 | 1 | 1.3 | 39 | 28 | 11 | 2.4 |  | 63/2/2/0/34 | 11 | 3 | 8 | 0 | 0 | 6202 |
| plains | 1 | 8 | 63 | 330 | 330 | 77 | 261 | 0 | 13 | 6/116/5 | 2.5 | 24.4 | 24.2 | 7.5 | 76 | 1 | 2788 | 66 | 35.3 | 3.9 |  | 83/0/1/0/10 | 57 | 10 | 29 | 0 | 0 | 20625 |
| plains | 2 | 25 | 162 | 206 | 289 | 75 | 310 | 0 | 12 | 9/247/5 | 2.4 | 3.5 | 23.7 | 6.2 | 123 | 0.9 | 2753 | 47 | 25.4 | 5.4 |  | 84/1/1/0/11 | 58 | 6.2 | 29 | 0 | 0 | 20377 |
| forest | 1 | 8 | 72 | 107 | 171 | 50 | 167 | 0 | 14 | 41/71/5 | 2.5 | 27.7 | 14.3 | 4.1 | 26 | 1 | 595 | 55 | 24.8 | 4.3 | 0 (1) | 85/0/3/0/11 | 45 | 5.6 | 17 | 0 | 0 | 15848 |
| forest | 2 | 33 | 131 | 88 | 132 | 38 | 167 | 0 | 14 | 1/95/0 | 2.4 | 0 | 18.6 | 3.9 | 44 | 1.1 | 264 | 29 | 21.9 | 3.6 | 0 (3) | 87/0/2/0/11 | 30 | 4.7 | 13 | 0 | 0 | 13879 |
| lakeland | 1 | 9 | 75 | 225 | 270 | 89 | 225 | 0 | 14 | 25/93/5 | 2.7 | 0 | 26.1 | 4.8 | 97 | 0.9 | 2739 | 82 | 34.2 | 6.2 |  | 82/0/2/0/15 | 62 | 4.8 | 25 | 1 | 0 | 20083 |
| lakeland | 2 | 27 | 88 | 159 | 159 | 51 | 145 | 0 | 13 | 8/163/5 | 2.5 | 4 | 21 | 5 | 129 | 1.1 | 800 | 84 | 23.5 | 5.1 |  | 77/0/2/8/11 | 45 | 4.6 | 25 | 0 | 0 | 13866 |
| highland | 1 | 11 | 56 | 38 | 60 | 16 | 91 | 0 | 13 | 10/59/0 | 2.8 | 0 | 12.5 | 6.5 | 35 | 1.1 | 44 | 50 | 20 | 2.4 | 0 (2) | 76/1/5/0/17 | 47 | 8.6 | 9 | 0 | 0 | 7834 |
| highland | 2 | 13 | 33 | 101 | 101 | 26 | 100 | 0 | 13 | 12/44/5 | 3.1 | 11.2 | 7.7 | 6.7 | 45 | 1 | 255 | 58 | 21.8 | 47.6 | 0 (1) | 73/0/4/0/22 | 31 | 5.5 | 13 | 0 | 0 | 9885 |
| mean |  | 15.9 | 77 | 146.3 | 174.2 | 49.4 | 165.7 | 0.1 | 12.8 |  | 2.6 | 8.8 | 16.8 | 5.3 | 69.7 | 1.1 | 1193 | 61.1 | 26.3 | 8.7 |  |  | 44.3 | 5.9 | 18.9 | 0.4 | 0 | 14738.4 |

Year 100 mean 146.3 (141.4 before), year 25 15.9 (16.5), dwellings 49.4 (51.6), hunger deaths 165.7 (164.4), 1 resettle (valley 2).


## F4: kiln, smithy, workshop

Tools, pots and carts are made things. Three `BUILDINGS` rows: a kiln (needs pottery; a potter makes pots, 0.3 timber of firing each), a smithy (needs the tools idea; a smith makes tools, 0.25 ore and 0.3 timber each) and a workshop (needs the wheel; a wright makes carts, 4 timber each). Ore is found while quarrying stone (0.12 of what is broken). Each is raised when its good is short (pots fewer than households, tools fewer than grown hands, carts fewer than grown tame beasts) and the idea is known. A smith, potter or wright walks to the place on a real trip and makes what a day there and the materials allow. Things wear: tools by a quarter a year, pots a tenth, carts 8%.

Effects that used to come from knowing an idea now come from having the thing: a grown worker holding a tool (tools go to the longest in the place first) fells, quarries and builds at the old tool rate, others at the plain rate; a household with pots (oldest roofs first) loses 0.7 of the food its roof would lose; the number of carts in use is the carts made, up to the beasts to draw them (before: one per point of felt toil, up to the beasts).

Two fixes found on the way: a haul that cannot be walked before dark now looks for its way only as far as can be walked today (the route search had no limit and swept the whole map), and a plot whose haul failed waits for the next morning instead of trying every step (plains 1 had 13 133 stone-haul attempts in its last 20 years; 100 years now take 23 s, not 97).

Checks. Unit: with the smithy ruined, tools never rise and 10 tools wear below 7 in two years. In valley 1 a potter takes up the kiln at year 18 and a smith the smithy at year 20. Tools stay few (often under 2): a smith is only appointed when the food supply can spare hands; F6 changes that. Tests 445 passed, 0 failed; scenarios 23 passed (one warning: in a deforest run people died out). Code-drawn sprites for the three.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 7 | 53 | 289 | 318 | 77 | 199 | 0 | 15 | 10/140/0 | 2.8 | 20.8 | 23.2 | 5.9 | 69 | 1 | 2654 | 200 | 39.6 | 4.8 | 0.5 (2) | 83/0/3/2/10 | 64 | 6.4 | 25 | 5 | 0 | 21352 |
| valley | 2 | 26 | 87 | 208 | 212 | 74 | 170 | 0 | 14 | 17/198/5 | 2.8 | 0 | 25.3 | 4.7 | 168 | 1 | 1300 | 228 | 33.4 | 5.4 | 4 (1) | 85/0/3/0/11 | 70 | 5.6 | 21 | 0 | 0 | 23715 |
| plains | 1 | 9 | 78 | 351 | 351 | 76 | 311 | 0 | 14 | 7/281/5 | 2.6 | 21.4 | 22.5 | 7.7 | 89 | 0.9 | 2459 | 88 | 33.5 | 5.7 | 0 (4) | 81/0/1/0/12 | 56 | 10.9 | 29 | 0 | 0 | 22979 |
| plains | 2 | 3 | 17 | 91 | 152 | 37 | 126 | 2 | 12 | 2/214/5 | 2.4 | 3.5 | 16.6 | 6 | 13 | 0.9 | 580 | 44 | 29.9 | 5.3 |  | 87/1/1/0/10 | 36 | 7.1 | 21 | 0 | 0 | 12411 |
| forest | 1 | 9 | 55 | 77 | 126 | 37 | 115 | 0 | 13 | 39/90/5 | 2.6 | 27.7 | 20.9 | 3.7 | 39 | 1.1 | 191 | 78 | 20.7 | 5 | 0 (4) | 84/0/2/0/13 | 37 | 3.9 | 13 | 0 | 0 | 14146 |
| forest | 2 | 32 | 104 | 87 | 143 | 40 | 170 | 0 | 13 | 2/95/0 | 2.4 | 0 | 23.2 | 4 | 144 | 1 | 321 | 66 | 19 | 5.7 | 0 (3) | 91/0/2/0/6 | 31 | 5.1 | 13 | 0 | 0 | 14762 |
| lakeland | 1 | 10 | 67 | 232 | 233 | 75 | 157 | 0 | 13 | 14/65/5 | 2.8 | 0 | 21.6 | 5 | 182 | 1 | 1858 | 99 | 28.3 | 5.1 |  | 83/0/2/0/12 | 62 | 5.6 | 25 | 0 | 0 | 17884 |
| lakeland | 2 | 23 | 93 | 102 | 119 | 37 | 143 | 0 | 12 | 8/195/5 | 2.4 | 0 | 14.4 | 4.7 | 50 | 1.1 | 605 | 68 | 22.1 | 3.8 |  | 87/0/1/0/11 | 36 | 4.9 | 21 | 0 | 0 | 12350 |
| highland | 1 | 18 | 56 | 57 | 63 | 23 | 93 | 0 | 13 | 7/75/5 | 2.8 | 0 | 16.5 | 6.4 | 107 | 1.1 | 81 | 65 | 21.3 | 2.9 | 0 (2) | 76/0/3/0/21 | 54 | 5.6 | 13 | 0 | 0 | 9000 |
| highland | 2 | 13 | 53 | 65 | 74 | 22 | 101 | 0 | 13 | 6/60/0 | 3 | 13.7 | 8.8 | 8 | 18 | 1.1 | 125 | 67 | 25.7 | 5.5 | 6 (1) | 82/0/4/0/13 | 37 | 10.4 | 13 | 0 | 0 | 10584 |
| mean |  | 15 | 66.3 | 155.9 | 179.1 | 49.8 | 158.5 | 0.2 | 13.2 |  | 2.7 | 8.7 | 19.3 | 5.6 | 87.9 | 1 | 1017.4 | 100.3 | 27.4 | 4.9 |  |  | 48.3 | 6.6 | 19.4 | 0.5 | 0 | 15918.3 |

Year 100 mean 155.9 (146.3 before), year 25 15.0 (15.9), dwellings 49.8 (49.4), hunger deaths 158.5 (165.7), 2 resettles (plains 2).

## F5: the pen

A `pen` row in `BUILDINGS` (3 timber; needs herding, which is learned by raising an orphaned fawn). It is raised once there are tame beasts. Tame beasts keep to the pen if one stands (else to the camp, as before), sleep there, and graze within 3 tiles of it, or 6 when someone herds them. The two old rules are gone: the store no longer feeds tame beasts by itself whenever it holds plenty, and a herder no longer sets a deer's energy to 0.6. Feeding is now the herder's work: the herder walks to the pen and gives the hungry beasts hay (0.3 of every harvest is put by as straw, and it rots by 0.3 a year), or, with no hay, food from the store when it holds more than 0.8 a head. A herder is only asked for while a pen stands and there are tame beasts. Code-drawn sprite: a square of stakes and rails with a gate and a trough of hay.

Check (unit, the plan's): the same world twice from autumn with six grown deer tamed by the camp, run through 14 steps of winter; once with no pen and no herder, once with a pen beside the camp, 8 hay and a herder. Valley 1: 0 of 3 survive without, 3 of 3 with. Forest 3: 2 of 4 without, 4 of 4 with. (Highland 2, not in the test: 2 of 3 without, 3 of 3 with.)

The 100-year table is identical to F4's in every column but run time (year 100 mean 155.9): none of the ten standard worlds tames an animal in 100 years, so neither pens nor hay change anything there. Tests 445 passed, 0 failed.


## F6: jobs are places

Every trade names its place (`JOB_PLACE`): the fields, the water, the wild, the plots, the woods, the quarry, the camp, or a building (pen, smithy, kiln, workshop). The trades of a building are no longer shares of the hands the food supply can spare: once a year, a place that stands and whose work is short (tools fewer than grown hands and ore to make them, pots fewer than households and timber to fire them, carts fewer than beasts and timber, tame beasts to keep) is taken up by the best builder among the grown people whose household is not going hungry, from no trade or from food work. Whoever has it keeps it while the work is short, one pair of hands to a place. It is not taken while the place has fewer than four grown hands or less than a ration a head, and it is given up when food falls below 0.6 a head. The Town panel has a new list, "Places of work": each standing workshop, kiln, smithy and pen with who works there (or nobody), and the land trades with their people. Fixed on the way: quarrying could dig under a granary or other common building (they own no lot); now nothing is quarried within a building's plot. The well's row no longer claims a trade. The panel's list of wants had no words for the want to cross water ("from undefined"); it now says "rivers to wade".

Checks. New yearly invariant: every standing workshop, kiln, smithy and pen is in the panel's list, with exactly the people whose trade is there. Tests 457 passed, 0 failed. Town panel checked in the game (lakeland 1, year 50): kiln and smithy listed (nobody at them that year), 12 farmers at the fields, 12 fishers at the water, and so on.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 7 | 40 | 219 | 224 | 62 | 132 | 0 | 15 | 11/96/5 | 2.9 | 18.3 | 24 | 5.7 | 55 | 1 | 1499 | 172 | 36.6 | 6 | 0 (1) | 84/0/1/0/13 | 47 | 4.3 | 21 | 4 | 0 | 16525 |
| valley | 2 | 4 | 33 | 48 | 94 | 26 | 117 | 2 | 12 | 0/114/0 | 2.4 | 0 | 11.7 | 3.7 | 44 | 1.1 | 163 | 73 | 15.9 | 3.4 |  | 84/0/4/0/11 | 32 | 4.2 | 13 | 0 | 0 | 9635 |
| plains | 1 | 8 | 64 | 273 | 356 | 88 | 355 | 0 | 13 | 26/140/5 | 2.5 | 23.6 | 23.2 | 7 | 93 | 0.9 | 3282 | 111 | 34.5 | 4.8 |  | 78/0/0/0/19 | 58 | 6.6 | 29 | 0 | 0 | 27967 |
| plains | 2 | 3 | 17 | 72 | 139 | 36 | 128 | 2 | 13 | 5/237/5 | 2.2 | 3.5 | 19 | 5.4 | 8 | 1 | 403 | 52 | 32.4 | 6.1 | 5 (1) | 79/1/1/0/18 | 32 | 8.4 | 17 | 0 | 0 | 11817 |
| forest | 1 | 8 | 49 | 95 | 96 | 30 | 113 | 0 | 12 | 29/83/5 | 2.6 | 27.7 | 21.2 | 4 | 29 | 1.1 | 158 | 67 | 24.3 | 5 | 0 (1) | 80/1/4/0/13 | 36 | 4 | 13 | 0 | 0 | 12020 |
| forest | 2 | 33 | 155 | 76 | 155 | 45 | 159 | 0 | 14 | 16/144/9 | 2.4 | 0 | 21.7 | 4 | 144 | 1.1 | 372 | 90 | 23.4 | 4.9 | 0 (1) | 86/0/2/0/11 | 35 | 4.6 | 13 | 0 | 0 | 14680 |
| lakeland | 1 | 9 | 68 | 253 | 260 | 78 | 130 | 0 | 13 | 6/194/8 | 2.7 | 0 | 22.5 | 4.6 | 23 | 1.1 | 2676 | 141 | 29.1 | 5 | 0 (1) | 82/0/2/1/14 | 67 | 7 | 25 | 0 | 0 | 16578 |
| lakeland | 2 | 26 | 159 | 158 | 168 | 55 | 183 | 0 | 14 | 19/81/5 | 2.5 | 0 | 19.8 | 5 | 101 | 1 | 939 | 104 | 27.8 | 4.9 | 7 (2) | 84/1/3/0/11 | 39 | 6 | 25 | 0 | 0 | 15532 |
| highland | 1 | 14 | 59 | 49 | 82 | 24 | 105 | 0 | 13 | 6/11/0 | 2.8 | 0 | 19.2 | 5.8 | 59 | 1 | 189 | 76 | 24.1 | 3.5 | 0 (1) | 73/3/2/0/21 | 51 | 5.6 | 13 | 0 | 0 | 10416 |
| highland | 2 | 13 | 18 | 49 | 63 | 17 | 58 | 0 | 13 | 12/64/5 | 2.7 | 12.5 | 8.6 | 6.3 | 7 | 1.1 | 59 | 64 | 27.4 | 11.6 | 0 (1) | 77/0/3/4/15 | 30 | 6.2 | 9 | 0 | 0 | 6849 |
| mean |  | 12.5 | 66.2 | 129.2 | 163.7 | 46.1 | 148 | 0.4 | 13.2 |  | 2.6 | 8.6 | 19.1 | 5.1 | 56.3 | 1 | 974 | 95 | 27.6 | 5.5 |  |  | 42.7 | 5.7 | 17.8 | 0.4 | 0 | 14201.9 |

Year 100 mean 129.2 (155.9 before), year 25 12.5 (15.0), dwellings 46.1 (49.8), hunger deaths 148.0 (158.5), 4 resettles (valley 2 and plains 2) against 2. These worlds swing hard on small changes, so 15 more (seeds 3 to 5 of each land, 100 years) were run on both versions: year 100 mean 120.3 against 126.4, 9 wipe-outs against 10. Over all 25 the drop is about 10%.


## F7: no idea works without a built thing

The last ideas that acted as switches now act through places and works:
- Masonry: a mason's yard (2 timber, 3 stone). Only while it stands are walls 0.05 warmer and the streets set with stone.
- Medicine: a healer's house with its herb garden; a healer takes up the place (F6 rules) while there are old people. Lives run 15% longer only while a healer works there.
- Concrete: a lime kiln (2 timber, 4 stone), raised once a flood has been seen. A house finished while it stands is set in concrete and stands the flood; before, knowing concrete protected every house.
- Writing: a tally house. The want of reckoning stops growing only while it stands.
- Irrigation: ditch tiles (`T.ditch`). Grown people of households with dry fields dig from the well, a few tiles a day, toward their own driest field; water seeps two tiles out from a ditch. Before, every field by a well was watered once irrigation was known.
- Plough: the share is made at the workshop; the plough's help with the harvest needs one standing.

`IDEA_VIA` names, for every idea, the building or the work it acts through (`WORKS`: hearth, fields, ditches, bridge). Code-drawn sprites for the four new places; ditches are drawn as a water-filled cut in the ground; a 'dig' pose.

Checks. New units: every idea names a row of `BUILDINGS` or a work. In a world that knows masonry, medicine, concrete and writing with their places kept ruined for two years, roofs are only as warm as their kinds and the streets are not paved. Once irrigation is known (lakeland 1, from year 40) ditches are dug from the well and run beside fields within four years. F2's diet check was too fragile; it now takes the widest spread between households in any kind of food at years 20, 30 and 40. Tests 459 passed, 0 failed; scenarios 23 passed.

Balance. The first version cut year 100 by about 22% (93.9 against 120.3 on the extra 15 worlds). Trying the parts one at a time: watering only along ditches was the main cost (making it global again gave 106.9); the plough change made no difference; not building the new places at all was worse (80.9). After letting a day's digging go a few tiles, any grown person of a household with dry fields dig, and water seep two tiles: 111.6 on the extra 15 worlds (7 wipe-outs against 9), and the table below.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 7 | 9 | 193 | 194 | 45 | 18 | 0 | 14 | 17/86/2 | 2.8 | 17.9 | 25.1 | 4.8 | 1 |  | 980 | 141 | 33.5 | 8.3 |  | 86/0/3/0/9 | 43 | 5.1 | 21 | 3 | 0 | 12913 |
| valley | 2 | 4 | 29 | 80 | 111 | 32 | 99 | 2 | 12 | 7/206/12 | 2.4 | 0 | 12.4 | 4 | 12 | 1.1 | 345 | 102 | 15.9 | 3.2 |  | 93/0/2/0/4 | 38 | 5.1 | 15 | 0 | 0 | 11186 |
| plains | 1 | 9 | 81 | 209 | 278 | 72 | 251 | 0 | 13 | 4/90/1 | 2.7 | 26.8 | 22.7 | 8 | 122 | 1 | 2343 | 117 | 34.5 | 4.7 |  | 86/0/0/0/12 | 55 | 8.9 | 25 | 0 | 0 | 27242 |
| plains | 2 | 18 | 103 | 140 | 206 | 39 | 217 | 0 | 12 | 0/238/5 | 3.1 | 12.8 | 17.2 | 10.5 | 71 | 0.9 | 883 | 33 | 19.4 | 5.1 |  | 77/1/3/0/16 | 66 | 15.2 | 21 | 0 | 0 | 20838 |
| forest | 1 | 9 | 74 | 93 | 148 | 48 | 157 | 0 | 14 | 14/138/5 | 2.5 | 27.7 | 21.9 | 4.1 | 111 | 1.1 | 709 | 79 | 24.7 | 5.6 | 0 (2) | 82/0/3/2/11 | 44 | 4.5 | 17 | 0 | 0 | 17888 |
| forest | 2 | 33 | 82 | 102 | 115 | 35 | 177 | 0 | 14 | 6/150/5 | 2.5 | 0 | 21.6 | 3.9 | 65 | 1.1 | 246 | 42 | 24.5 | 6 | 0 (3) | 88/0/3/0/8 | 30 | 4.9 | 13 | 0 | 0 | 15546 |
| lakeland | 1 | 9 | 57 | 231 | 249 | 72 | 151 | 0 | 14 | 24/142/0 | 2.6 | 0 | 22.9 | 4.6 | 60 | 1 | 2010 | 102 | 30.1 | 5.5 | 0 (1) | 84/0/2/0/13 | 66 | 4.8 | 21 | 1 | 0 | 21090 |
| lakeland | 2 | 19 | 77 | 170 | 170 | 55 | 109 | 0 | 13 | 2/123/5 | 2.6 | 0 | 21.2 | 4.8 | 104 | 1 | 1003 | 128 | 26 | 5.3 |  | 80/0/3/2/12 | 44 | 4 | 25 | 0 | 0 | 17648 |
| highland | 1 | 17 | 45 | 48 | 78 | 19 | 122 | 0 | 13 | 5/28/5 | 3 | 0 | 18.6 | 6.8 | 20 | 1 | 126 | 94 | 21.7 | 3.8 | 0 (4) | 69/0/1/0/30 | 48 | 5.8 | 13 | 0 | 0 | 9906 |
| highland | 2 | 11 | 21 | 65 | 65 | 22 | 69 | 0 | 13 | 10/50/0 | 2.9 | 16.4 | 10.7 | 7.2 | 21 | 1 | 176 | 89 | 21 | 8.7 | 0 (2) | 75/1/5/0/16 | 30 | 6.5 | 13 | 0 | 0 | 9560 |
| mean |  | 13.6 | 57.8 | 133.1 | 161.4 | 43.9 | 137 | 0.2 | 13.2 |  | 2.7 | 10.2 | 19.4 | 5.9 | 58.7 | 1 | 882.1 | 92.7 | 25.1 | 5.6 |  |  | 46.4 | 6.5 | 18.4 | 0.4 | 0 | 16381.7 |

Year 100 mean 133.1 (129.2 at F6), year 25 13.6 (12.5), dwellings 43.9 (46.1), hunger deaths 137.0 (148.0), 2 resettles (valley 2) against 4.


## G1: friends

Each person has `ties` to others beyond kin (separate from `bond`, which is courtship). A tie grows by 0.06 for every step two people spend doing a thing together: one hunting party, one building site (building, hauling or felling for it), one fire (eating, music, a story, dancing, the night watch, sheltering from the weather, mourning), one workshop, children playing at the camp, or working the same patch of ground (gathering, fishing, felling or quarrying within the same 4x4 tiles). Ties fade by about a quarter a year and are dropped for the dead. A tie of 0.5 or more is a friend. Friends:
- help raise each other's houses first (a builder finishes a friend's or a kinsman's begun house before others);
- pull plot choice like kin (a lot near a friend's roof scores as one near kin's);
- sit together of an evening (the view gives out seats round the fire in friendship order);
- are named when a person is described ("Friends: Soren, Ivo.").

Checks. New unit: at year 30 in lakeland 1 someone has a friend, describing them names their friends, and every tie is finite and within 0 to 2. In that world 7 of 12 people have at least one friend (1.5 friends each on average); in valley 2, 4 of 6. Tests 460 passed, 0 failed; scenarios 23 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 7 | 9 | 127 | 174 | 36 | 75 | 0 | 15 | 6/127/5 | 2.7 | 16.4 | 22.6 | 4.7 | 6 | 0.9 | 723 | 109 | 33.4 | 9.9 | 0 (1) | 74/0/3/0/22 | 42 | 5.2 | 17 | 3 | 0 | 12878 |
| valley | 2 | 4 | 29 | 109 | 114 | 38 | 88 | 2 | 12 | 0/252/0 | 2.6 | 0 | 14.1 | 4.1 | 34 | 1.1 | 659 | 152 | 17.9 | 3.9 |  | 87/0/2/0/9 | 37 | 4.7 | 21 | 0 | 0 | 12213 |
| plains | 1 | 9 | 81 | 209 | 278 | 72 | 251 | 0 | 13 | 4/90/1 | 2.7 | 26.8 | 22.7 | 8 | 122 | 1 | 2343 | 117 | 34.5 | 4.7 |  | 86/0/0/0/12 | 55 | 8.9 | 25 | 0 | 0 | 28602 |
| plains | 2 | 18 | 103 | 140 | 206 | 39 | 217 | 0 | 12 | 0/238/5 | 3.1 | 12.8 | 17.2 | 10.5 | 71 | 0.9 | 883 | 33 | 19.4 | 5.1 |  | 77/1/3/0/16 | 66 | 15.2 | 21 | 0 | 0 | 20220 |
| forest | 1 | 9 | 74 | 93 | 148 | 48 | 157 | 0 | 14 | 14/138/5 | 2.5 | 27.7 | 21.9 | 4.1 | 111 | 1.1 | 709 | 79 | 24.7 | 5.6 | 0 (2) | 82/0/3/2/11 | 44 | 4.5 | 17 | 0 | 0 | 18619 |
| forest | 2 | 33 | 83 | 84 | 136 | 34 | 164 | 0 | 14 | 9/164/5 | 2.5 | 0 | 19.6 | 4 | 77 | 1 | 268 | 92 | 23.5 | 5.8 | 0 (1) | 83/0/3/0/13 | 35 | 4 | 13 | 0 | 0 | 15483 |
| lakeland | 1 | 9 | 57 | 189 | 240 | 66 | 191 | 0 | 13 | 22/173/2 | 2.6 | 0 | 21.8 | 4.8 | 98 | 1 | 1568 | 112 | 29.9 | 5.4 | 0 (1) | 81/0/3/0/15 | 63 | 5.8 | 21 | 0 | 0 | 19585 |
| lakeland | 2 | 19 | 77 | 170 | 170 | 55 | 109 | 0 | 13 | 2/123/5 | 2.6 | 0 | 21.2 | 4.8 | 104 | 1 | 1003 | 128 | 26 | 5.3 |  | 80/0/3/2/12 | 44 | 4 | 25 | 0 | 0 | 17643 |
| highland | 1 | 17 | 45 | 55 | 92 | 30 | 125 | 0 | 13 | 9/42/1 | 2.9 | 0 | 18.9 | 6.5 | 41 | 1 | 249 | 123 | 24.6 | 3.5 | 0 (3) | 79/0/4/0/17 | 48 | 9 | 13 | 0 | 0 | 12077 |
| highland | 2 | 11 | 21 | 47 | 77 | 20 | 90 | 0 | 13 | 7/31/5 | 2.8 | 13.5 | 8.1 | 6.9 | 22 | 1 | 114 | 73 | 24.5 | 7.1 | 0 (1) | 63/0/1/0/35 | 30 | 4.3 | 13 | 0 | 0 | 9924 |
| mean |  | 13.6 | 57.9 | 122.3 | 163.5 | 43.8 | 146.7 | 0.2 | 13.2 |  | 2.7 | 9.7 | 18.8 | 5.8 | 68.6 | 1 | 851.9 | 101.8 | 25.8 | 5.6 |  |  | 46.4 | 6.6 | 18.6 | 0.3 | 0 | 16724.4 |

Year 100 mean 122.3 (133.1 at F7), year 25 13.6 (13.6), dwellings 43.8 (43.9), hunger deaths 146.7 (137.0), 2 resettles (valley 2), as before.


## G2: rivals

Ties can now go below nothing (to -2); a tie of -0.5 or less is a rival. What sours one:
- Two suitors for one person: when she chooses, whoever else was courting her holds it against the one she chose (-0.8, and -0.3 back). The first time it happens it is told ("Rasmus had hoped for Noor too. There is no warmth now between Rasmus and Pell.").
- A refused share: a household with an empty larder that no kin helps resents the grown people of any household within a lot and a half that keeps more than twice what it needs (-0.08 each evening).
- A death blamed: when someone is taken by a wolf, their partner and kin blame whoever was on the night watch (-1.0).

Grievances fade like friendship, and mend only slowly even when the two work side by side. Rivals build apart: a lot within 8 tiles of a rival's door scores lower. Once a year, a household whose grown member has a tie of -0.6 or worse with someone in the next lot leaves, at most once in ten years. Its roof goes to someone who has none if there is anyone (else it is taken down, half its timber kept), and the leavers build again away from the rival. It is told: "Sefa's household has left its house by Ila's door after too many hard words, and will build again away from them."

Checks. New unit: in lakeland 1 at year 30, two neighbouring households made bitter rivals; within three years the move is in the log and the mover's new roof is further from the rival than the old one. In five 100-year worlds, 3 moves happened by themselves (lakeland 1 at year 34; plains 2 at years 74 and 91). Tests 461 passed, 0 failed; scenarios 23 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 7 | 9 | 127 | 174 | 36 | 75 | 0 | 15 | 6/127/5 | 2.7 | 16.4 | 22.6 | 4.7 | 6 | 0.9 | 723 | 109 | 33.4 | 9.9 | 0 (1) | 74/0/3/0/22 | 42 | 5.2 | 17 | 3 | 0 | 12403 |
| valley | 2 | 4 | 29 | 40 | 112 | 29 | 116 | 2 | 13 | 23/129/0 | 2.5 | 0 | 13.9 | 3.8 | 15 | 1.1 | 28467 | 139 | 16.9 | 4 | 0 (4) | 85/0/3/0/12 | 36 | 4.1 | 13 | 0 | 0 | 11419 |
| plains | 1 | 9 | 81 | 209 | 278 | 72 | 251 | 0 | 13 | 4/90/1 | 2.7 | 26.8 | 22.7 | 8 | 122 | 1 | 2343 | 117 | 34.5 | 4.7 |  | 86/0/0/0/12 | 55 | 8.9 | 25 | 0 | 0 | 27232 |
| plains | 2 | 18 | 103 | 127 | 212 | 50 | 289 | 0 | 13 | 9/184/5 | 2.8 | 19.5 | 18.8 | 9 | 134 | 0.9 | 1293 | 62 | 22.9 | 5.1 | 0 (2) | 78/0/1/0/21 | 64 | 6.6 | 21 | 0 | 0 | 20621 |
| forest | 1 | 9 | 74 | 93 | 148 | 48 | 157 | 0 | 14 | 14/138/5 | 2.5 | 27.7 | 21.9 | 4.1 | 111 | 1.1 | 709 | 79 | 24.7 | 5.6 | 0 (2) | 82/0/3/2/11 | 44 | 4.5 | 17 | 0 | 0 | 21180 |
| forest | 2 | 33 | 83 | 84 | 136 | 34 | 164 | 0 | 14 | 9/164/5 | 2.5 | 0 | 19.6 | 4 | 77 | 1 | 268 | 92 | 23.5 | 5.8 | 0 (1) | 83/0/3/0/13 | 35 | 4 | 13 | 0 | 0 | 15980 |
| lakeland | 1 | 9 | 53 | 188 | 209 | 60 | 153 | 0 | 13 | 2/90/5 | 2.8 | 0 | 19.9 | 5.1 | 36 | 1 | 1376 | 112 | 30.9 | 4.3 | 0 (1) | 81/0/2/0/17 | 63 | 5.7 | 21 | 0 | 0 | 19158 |
| lakeland | 2 | 19 | 77 | 170 | 170 | 55 | 109 | 0 | 13 | 2/123/5 | 2.6 | 0 | 21.2 | 4.8 | 104 | 1 | 1003 | 128 | 26 | 5.3 |  | 80/0/3/2/12 | 44 | 4 | 25 | 0 | 0 | 19462 |
| highland | 1 | 17 | 45 | 55 | 92 | 30 | 125 | 0 | 13 | 9/42/1 | 2.9 | 0 | 18.9 | 6.5 | 41 | 1 | 249 | 123 | 24.6 | 3.5 | 0 (3) | 79/0/4/0/17 | 48 | 9 | 13 | 0 | 0 | 12668 |
| highland | 2 | 11 | 21 | 61 | 88 | 20 | 93 | 0 | 13 | 15/72/0 | 2.7 | 12.9 | 9.8 | 6.8 | 7 | 1 | 102 | 85 | 23.9 | 7.1 | 0 (1) | 53/0/2/1/43 | 28 | 5.3 | 13 | 0 | 0 | 10963 |
| mean |  | 13.6 | 57.5 | 115.4 | 161.9 | 43.4 | 153.2 | 0.2 | 13.4 |  | 2.7 | 10.3 | 18.9 | 5.7 | 65.3 | 1 | 3653.3 | 104.6 | 26.1 | 5.5 |  |  | 45.9 | 5.7 | 17.8 | 0.3 | 0 | 17108.6 |

Year 100 mean 115.4 (122.3 at G1), year 25 13.6 (13.6), dwellings 43.4 (43.8), hunger deaths 153.2 (146.7), 2 resettles (valley 2), as before. Valley 2 ends at 40 (109 at G1) and lakeland 1 at 188 (189); most of the drop is valley 2.


## G3: giving and debts

A household with an empty larder is given to by kin with plenty first, and only failing kin by a household where someone is a friend both ways; a stranger's household never gives directly (the common store is for those with no one). Every gift is a debt in `T.debts` ("taker>giver": amount). A household with more than 1.8 a head pays back what it owes, before anything goes to the common store. A tenth of every debt is forgiven each year, and a debt goes when either household does. The first gift is told ("... has sent food to ...'s. One larder was empty, and they will not forget it.").

Also: the pull away from a rival's door in choosing a lot is stronger (within 10 tiles, 1.5 a tile), since in one history the G2 test found a move that did not take them further off. Timber from a roof taken down after a quarrel is counted with what is carried home, so the "timber only from chopping" check accepts it.

Checks. New unit: in lakeland 1 at year 30, a household emptied with a kin household and a stranger one both full; after a step the debt is to the kin household and none to the stranger. New yearly invariant: every debt is finite and not negative. By year 60: lakeland 1 166 gifts (4 between friends), 49 open debts, 30 repaid; plains 2 275 gifts (17 between friends), 62 open, 118.6 repaid. Tests 474 passed, 0 failed; scenarios 23 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 7 | 9 | 136 | 141 | 37 | 56 | 0 | 14 | 11/128/5 | 2.7 | 16.6 | 26.1 | 5.2 | 6 | 1.2 | 603 | 144 | 34.1 | 11.6 |  | 80/0/2/4/12 | 44 | 5.1 | 17 | 3 | 0 | 15349 |
| valley | 2 | 4 | 30 | 86 | 94 | 31 | 83 | 2 | 12 | 6/121/0 | 2.4 | 0 | 14.8 | 3.7 | 43 | 1.1 | 507 | 121 | 20.1 | 4.1 |  | 89/0/3/0/8 | 37 | 4.5 | 17 | 0 | 0 | 13407 |
| plains | 1 | 9 | 73 | 307 | 316 | 89 | 213 | 0 | 13 | 0/125/5 | 2.5 | 29.2 | 24.3 | 7.3 | 113 | 1 | 4028 | 88 | 32 | 5 |  | 89/0/1/0/9 | 67 | 10.7 | 29 | 0 | 0 | 38530 |
| plains | 2 | 18 | 101 | 66 | 172 | 34 | 210 | 0 | 13 | 0/238/5 | 3 | 17.5 | 17.1 | 11.1 | 86 | 1.1 | 648 | 64 | 17.4 | 4.4 | 0 (1) | 74/1/2/0/21 | 67 | 14.6 | 17 | 0 | 0 | 21545 |
| forest | 1 | 9 | 69 | 92 | 134 | 42 | 166 | 0 | 14 | 12/164/5 | 2.7 | 27.7 | 23.4 | 4.1 | 39 | 1 | 925 | 77 | 27.5 | 4.3 | 14.5 (2) | 80/1/4/0/15 | 43 | 4.4 | 17 | 0 | 0 | 18616 |
| forest | 2 | 38 | 118 | 97 | 121 | 39 | 163 | 0 | 13 | 10/223/5 | 2.4 | 0 | 22 | 3.8 | 32 | 1.1 | 300 | 55 | 22.9 | 5.1 | 1 (1) | 88/0/4/0/8 | 31 | 4.7 | 13 | 0 | 0 | 19028 |
| lakeland | 1 | 9 | 67 | 214 | 246 | 77 | 142 | 0 | 13 | 26/120/6 | 2.7 | 0 | 22 | 4.7 | 20 | 1.1 | 2229 | 152 | 29 | 4.7 | 3 (4) | 82/1/3/1/13 | 65 | 5.5 | 21 | 0 | 0 | 21551 |
| lakeland | 2 | 17 | 99 | 171 | 173 | 54 | 102 | 0 | 14 | 17/93/2 | 2.5 | 0 | 18.9 | 5.1 | 62 | 1.1 | 982 | 126 | 24.4 | 4.1 | 0 (2) | 84/0/3/0/10 | 43 | 5 | 25 | 0 | 0 | 17905 |
| highland | 1 | 21 | 31 | 50 | 53 | 18 | 65 | 0 | 13 | 5/69/0 | 2.8 | 0 | 17.9 | 6.5 | 16 | 1.1 | 84 | 79 | 16.6 | 2.7 | 1.3333333333333333 (6) | 75/0/5/1/17 | 49 | 7.6 | 13 | 0 | 0 | 9762 |
| highland | 2 | 11 | 24 | 47 | 59 | 15 | 82 | 0 | 12 | 2/33/0 | 2.9 | 2.3 | 9.3 | 6.6 | 18 | 1 | 66 | 71 | 23.3 | 11 | 36 (2) | 67/0/2/0/30 | 27 | 5.2 | 9 | 0 | 0 | 8480 |
| mean |  | 14.3 | 62.1 | 126.6 | 150.9 | 43.6 | 128.2 | 0.2 | 13.1 |  | 2.7 | 9.3 | 19.6 | 5.8 | 43.5 | 1.1 | 1037.2 | 97.7 | 24.7 | 5.7 |  |  | 47.3 | 6.7 | 17.8 | 0.3 | 0 | 18417.3 |

Year 100 mean 126.6 (115.4 at G2), year 25 14.3 (13.6), dwellings 43.6 (43.4), hunger deaths 128.2 (153.2), 2 resettles (valley 2), as before.


## G4: barter

A household wants more of a kind of food when it is under a quarter of its larder, and can spare one when it is over 0.3 of a larder of at least half a ration a head. Each evening a household with a kind to spare tries the kinds it is short of, most wanted first. For each, it offers a neighbour within two lots who has that kind to spare and wants what is offered. The rate (what is given for one of what is got) is how much more one side wants than the other, between 0.5 and 2. A neighbour who has the food but no want for what is offered is a failed trade (`T.tradesFailed`). Trades are counted by what went for what (`T.swaps`); the first is told.

What a trade is for: a varied larder goes further. Food eaten from a household's larder gives up to 10% more when it holds all four kinds alike (`nourish`). One kind alone is food as before. The first version took up to 8% off a single-kind larder: year 100 fell to 92.8 and plains collapsed, because early on every larder is one kind. It was changed to a bonus only.

Also fixed: quarrels (G2) and the yearly forgiving of debts (G3) only ran in years when the food supply could spare hands; they now run every year. The G2 and G3 unit tests now look across four worlds for the households they need, since one world's history changes with every step.

Checks. New unit: in lakeland 1 and valley 2 over 60 years, trades happen, some fail, and a fishing household (a fisher, or a larder mostly fish) swaps fish for grain with a farming household (a farmer, or fields), or the other way round. Lakeland 1 by year 60: 63 trades, 532 failed, swaps of grain for fish 18, fish for grain 9, fruit for fish 14 and others. Tests 473 passed, 0 failed; scenarios 23 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 161 | 205 | 231 | 74 | 236 | 0 | 15 | 16/86/0 | 2.7 | 14.1 | 23.3 | 5.9 | 100 | 1 | 1838 | 219 | 43.7 | 4.8 | 2 (2) | 80/1/3/1/14 | 57 | 7.4 | 25 | 3 | 0 | 32376 |
| valley | 2 | 6 | 47 | 122 | 132 | 40 | 115 | 0 | 13 | 10/150/5 | 2.7 | 0 | 26.2 | 4 | 34 | 1.1 | 487 | 139 | 34.8 | 4.8 | 1.8 (5) | 82/2/4/0/11 | 47 | 5.7 | 17 | 0 | 0 | 21364 |
| plains | 1 | 29 | 171 | 296 | 354 | 88 | 371 | 0 | 13 | 32/227/6 | 2.7 | 23.8 | 24.4 | 8.6 | 113 | 1 | 4041 | 119 | 34.3 | 5.3 |  | 85/1/0/0/13 | 69 | 9.6 | 29 | 0 | 0 | 41663 |
| plains | 2 | 27 | 151 | 188 | 188 | 61 | 215 | 0 | 12 | 0/210/5 | 2.5 | 23 | 21.1 | 7.7 | 42 | 0.9 | 2243 | 61 | 17.6 | 4.9 |  | 87/0/1/0/9 | 58 | 7.2 | 25 | 0 | 0 | 21993 |
| forest | 1 | 3 | 10 | 164 | 164 | 43 | 74 | 3 | 13 | 19/97/5 | 2.7 | 13.5 | 21.1 | 4.2 | 18 | 0.9 | 839 | 65 | 28.2 | 5.8 | 2 (2) | 73/0/1/2/24 | 39 | 3.9 | 17 | 0 | 0 | 12688 |
| forest | 2 | 26 | 129 | 99 | 130 | 36 | 143 | 0 | 14 | 9/146/0 | 2.5 | 0 | 25 | 3.7 | 29 | 1.1 | 293 | 77 | 22.1 | 3.9 | 0 (4) | 85/0/1/0/12 | 31 | 4.5 | 13 | 0 | 0 | 17671 |
| lakeland | 1 | 11 | 60 | 180 | 219 | 56 | 137 | 0 | 11 | 14/71/1 | 2.7 | 0 | 20.3 | 4.5 | 66 | 0.9 | 1175 | 176 | 28 | 4.6 |  | 87/0/3/0/9 | 57 | 7.8 | 21 | 0 | 0 | 16731 |
| lakeland | 2 | 19 | 118 | 159 | 173 | 52 | 187 | 0 | 13 | 5/160/5 | 2.6 | 0 | 18.2 | 4.6 | 52 | 1 | 1097 | 145 | 33 | 6.4 | 19 (2) | 84/0/3/0/12 | 49 | 6.2 | 25 | 0 | 0 | 18459 |
| highland | 1 | 20 | 40 | 45 | 82 | 25 | 107 | 0 | 14 | 5/125/5 | 2.9 | 0 | 16.7 | 6.6 | 24 | 1 | 170 | 79 | 18.2 | 3.2 | 0 (1) | 78/0/2/0/17 | 53 | 8.6 | 13 | 0 | 0 | 11865 |
| highland | 2 | 15 | 27 | 26 | 38 | 7 | 81 | 0 | 12 | 9/91/5 | 3.2 | 2 | 5.4 | 6.1 | 0 | 1.1 | 385 | 28 | 9.8 | 42 | 4.5 (2) | 72/4/2/3/19 | 26 | 5.2 | 9 | 0 | 0 | 8153 |
| mean |  | 18.4 | 91.4 | 148.4 | 171.1 | 48.2 | 166.6 | 0.3 | 13 |  | 2.7 | 7.6 | 20.2 | 5.6 | 47.8 | 1 | 1256.8 | 110.8 | 27 | 8.6 |  |  | 48.6 | 6.6 | 19.4 | 0.3 | 0 | 20296.3 |

Year 100 mean 148.4 (126.6 at G3), year 25 18.4 (14.3), dwellings 48.2 (43.6), hunger deaths 166.6 (128.2), 3 resettles (forest 1) against 2. Run time 20.3 s a world (18.4).


## G5: reckoning follows debts

The want "too much to keep track of" now grows with what households owe each other, not with how many households there are: each year by 0.05 for every open debt beyond 8, unless a scribe keeps the marks. The tally house (F7) is raised when there are more than 8 open debts, and its trade is the scribe's (taken up under the F6 rules while debts are many). When writing is worked out, the number of open debts at that moment is kept (`T.writingDebts`).

Checks. New yearly invariant: writing is only worked out with more than 8 open debts (it skips in the small test worlds, where writing does not come). In five 100-year worlds at 96: writing came in four, with 25, 34, 25 and 28 open debts at the time (valley 2, plains 1, highland 1, forest 2); lakeland 1 had 109 open debts at year 100 but had not worked it out (writing also needs more food than mouths). Tests 474 passed, 0 failed; scenarios 23 passed.

Not done: no scribe was at work at year 100 in those five worlds; the tally house is gated like the other places (food to spare, four grown hands), and the want keeps growing (reckon 18 to 45 at year 100). Whether writing should ease debts in turn (G5's "answers it") is left to phase H.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 151 | 233 | 247 | 77 | 219 | 0 | 15 | 7/59/0 | 2.7 | 19.3 | 22.4 | 5.7 | 116 | 1 | 2125 | 217 | 41.4 | 5.3 | 1.8 (5) | 82/0/3/2/13 | 62 | 6.1 | 25 | 3 | 0 | 35484 |
| valley | 2 | 6 | 48 | 171 | 185 | 63 | 136 | 0 | 13 | 13/227/5 | 2.6 | 0 | 26.9 | 4.1 | 38 | 1 | 1072 | 235 | 33.2 | 5.9 | 0 (1) | 80/2/3/0/15 | 54 | 4.2 | 21 | 0 | 0 | 25279 |
| plains | 1 | 29 | 162 | 201 | 329 | 71 | 397 | 0 | 14 | 2/102/2 | 2.7 | 23.8 | 22.8 | 8.7 | 115 | 1 | 3546 | 99 | 31.5 | 5.1 | 0 (3) | 75/0/0/0/21 | 59 | 10.1 | 25 | 0 | 0 | 33396 |
| plains | 2 | 27 | 151 | 161 | 205 | 43 | 240 | 0 | 12 | 9/118/6 | 2.9 | 22.9 | 21.6 | 11.9 | 84 | 0.9 | 1670 | 45 | 16.5 | 5.1 |  | 79/1/2/0/17 | 65 | 14.1 | 21 | 0 | 0 | 21838 |
| forest | 1 | 3 | 10 | 166 | 168 | 37 | 90 | 3 | 13 | 45/163/5 | 2.7 | 13.5 | 19.9 | 4.2 | 5 | 0.8 | 712 | 56 | 23.9 | 6.6 | 0 (1) | 84/3/2/0/9 | 39 | 5.6 | 17 | 0 | 0 | 12278 |
| forest | 2 | 26 | 136 | 96 | 141 | 37 | 159 | 0 | 14 | 9/183/5 | 2.4 | 0 | 25.8 | 3.7 | 40 | 1 | 306 | 89 | 20.8 | 5.1 | 0 (2) | 87/1/2/0/9 | 29 | 4.1 | 13 | 0 | 0 | 17089 |
| lakeland | 1 | 11 | 60 | 180 | 219 | 56 | 137 | 0 | 11 | 14/71/1 | 2.7 | 0 | 20.3 | 4.5 | 66 | 0.9 | 1175 | 176 | 28 | 4.6 |  | 87/0/3/0/9 | 57 | 7.8 | 21 | 0 | 0 | 17210 |
| lakeland | 2 | 19 | 116 | 127 | 137 | 36 | 179 | 0 | 12 | 12/185/0 | 2.6 | 0 | 17.6 | 5.3 | 77 | 1 | 534 | 94 | 23.8 | 8.1 | 7 (1) | 81/0/2/0/16 | 47 | 4 | 21 | 0 | 0 | 15648 |
| highland | 1 | 20 | 41 | 47 | 77 | 20 | 108 | 0 | 13 | 3/60/0 | 3.1 | 0 | 17.2 | 6.5 | 10 | 1 | 143 | 78 | 18.1 | 2.9 | 0 (1) | 78/1/1/0/19 | 51 | 8.9 | 13 | 0 | 0 | 11189 |
| highland | 2 | 15 | 27 | 26 | 38 | 7 | 81 | 0 | 12 | 9/91/5 | 3.2 | 2 | 5.4 | 6.1 | 0 | 1.1 | 385 | 28 | 9.8 | 42 | 4.5 (2) | 72/4/2/3/19 | 26 | 5.2 | 9 | 0 | 0 | 6170 |
| mean |  | 18.4 | 90.2 | 140.8 | 174.6 | 44.7 | 174.6 | 0.3 | 12.9 |  | 2.8 | 8.2 | 20 | 6.1 | 55.1 | 1 | 1166.8 | 111.7 | 24.7 | 9.1 |  |  | 48.9 | 7 | 18.6 | 0.3 | 0 | 19558.1 |

Year 100 mean 140.8 (148.4 at G4), year 25 18.4 (18.4), dwellings 44.7 (48.2), hunger deaths 174.6 (166.6), 3 resettles (forest 1), as before.


## H1: coin

Failed barters are counted over about the last year (`T.failRate`), and what was handed over in trades is counted by kind (`T.given`). Once a place has made more than 30 trades and more than 15 fail a year, the kind most often handed over is taken by everyone as payment, whether they want it that day or not: it is coin (`T.coin`, with the trades and failures when it came in `T.coinAt`). In barter, a household offering coin finds a taker where before the trade would have failed. It is told: "Too many trades come to nothing. Now grain is taken by everyone as payment...".

Checks. New yearly invariant: coin only where, when it came, more than 30 trades had been made and more than 15 failed a year. At size 96 over 100 years, coin came in all five worlds tried: lakeland 1 (grain, year 56), valley 2 (fruit, 49), plains 1 (grain, 36), highland 1 (fish, 49), forest 2 (grain, 43). Lakeland 1 made 1001 trades by year 100 with 333 failed; before coin there were 63 trades by year 60. In the small worlds the tests use (size 40, 40 years) coin came in 3 of 15. Tests 476 passed, 0 failed; scenarios 23 passed.

Not done: metal coin once a smithy stands (the plan's "then metal") is left for H2, where prices come in.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 153 | 251 | 260 | 76 | 272 | 0 | 14 | 8/109/5 | 2.6 | 19.3 | 27.5 | 5.4 | 103 | 1 | 2264 | 184 | 35.7 | 5.6 |  | 87/0/2/0/10 | 63 | 5.9 | 25 | 4 | 0 | 34306 |
| valley | 2 | 6 | 48 | 143 | 150 | 45 | 99 | 0 | 12 | 2/207/0 | 2.6 | 0 | 24.4 | 3.9 | 56 | 1 | 652 | 138 | 34.6 | 5.4 |  | 87/1/3/0/9 | 49 | 4.2 | 17 | 0 | 0 | 21478 |
| plains | 1 | 29 | 164 | 288 | 470 | 101 | 498 | 0 | 14 | 25/161/5 | 2.7 | 23.8 | 24.3 | 8.7 | 111 | 0.9 | 9788 | 99 | 39.5 | 5.5 | 0 (1) | 79/0/1/0/15 | 78 | 8.3 | 33 | 0 | 0 | 45243 |
| plains | 2 | 27 | 152 | 181 | 282 | 71 | 344 | 0 | 12 | 0/301/5 | 2.6 | 24.7 | 19.5 | 7.2 | 126 | 0.9 | 2398 | 102 | 24.7 | 5 |  | 78/0/1/0/19 | 59 | 5 | 29 | 0 | 0 | 22331 |
| forest | 1 | 3 | 10 | 146 | 171 | 31 | 111 | 3 | 12 | 21/175/0 | 2.7 | 13.5 | 18.5 | 4.2 | 9 | 0.9 | 520 | 61 | 25.8 | 7.1 | 0 (1) | 84/0/3/0/12 | 38 | 4.4 | 13 | 0 | 0 | 12274 |
| forest | 2 | 26 | 140 | 81 | 147 | 39 | 175 | 0 | 13 | 7/144/5 | 2.4 | 0 | 23.1 | 3.6 | 30 | 1.1 | 355 | 71 | 22.8 | 4.2 |  | 85/0/1/0/13 | 30 | 4.4 | 13 | 0 | 0 | 16455 |
| lakeland | 1 | 11 | 60 | 190 | 256 | 73 | 149 | 0 | 12 | 8/114/0 | 2.9 | 0 | 22.1 | 4.8 | 72 | 1 | 1849 | 114 | 28.2 | 4.6 | 0 (2) | 76/0/2/0/21 | 63 | 4.5 | 21 | 0 | 0 | 18557 |
| lakeland | 2 | 19 | 119 | 115 | 151 | 45 | 203 | 0 | 12 | 1/149/0 | 2.6 | 0 | 15.4 | 5.3 | 78 | 0.9 | 766 | 102 | 26.4 | 5.2 | 7 (1) | 83/1/2/0/14 | 46 | 5.2 | 25 | 0 | 0 | 18516 |
| highland | 1 | 20 | 41 | 79 | 81 | 20 | 79 | 0 | 14 | 5/17/5 | 2.9 | 0 | 18.6 | 6.5 | 14 | 0.9 | 119 | 77 | 18.4 | 3 | 0 (1) | 66/2/3/0/19 | 50 | 10.1 | 13 | 0 | 0 | 9970 |
| highland | 2 | 15 | 27 | 26 | 38 | 7 | 81 | 0 | 12 | 9/91/5 | 3.2 | 2 | 5.4 | 6.1 | 0 | 1.1 | 385 | 28 | 9.8 | 42 | 4.5 (2) | 72/4/2/3/19 | 26 | 5.2 | 9 | 0 | 0 | 6677 |
| mean |  | 18.4 | 91.4 | 150 | 200.6 | 50.8 | 201.1 | 0.3 | 12.7 |  | 2.7 | 8.3 | 19.9 | 5.6 | 59.9 | 1 | 1909.6 | 97.6 | 26.6 | 8.8 |  |  | 50.2 | 5.7 | 19.8 | 0.4 | 0 | 20580.7 |

Year 100 mean 150.0 (140.8 at G5), dwellings 50.8 (44.7), hunger deaths 201.1 (174.6), 3 resettles (forest 1), as before.


## H2: prices

Once a season each place sets a price for each kind of food (`T.price`): what is wanted (a quarter of a year's eating for every mouth) against what is held in every larder and the common store. Each price moves half-way toward that every season, kept between 0.05 and 20. Where there is coin, prices are counted in it (the coin's own price is 1). Barter now trades at the ratio of prices (between 0.25 and 4) instead of the ratio of wants. In lakeland 1 at years 44 to 49: grain 0.14 to 0.26 (plenty in the larders), fish 1.5 to 2.6, fruit 0.5 to 1.05, meat at the cap of 20 (almost none held).

Checks. New unit (the plan's): the same world twice from the start of year 40, one with every field blighted through the year; at the end of the year grain is dearer in the blighted one (lakeland 1: 0.116 normal against 0.154 blighted; valley 2: 0.184 against 0.276). Where grain is the coin its price stays 1 by definition, so there the test compares grain against fruit and fish (plains 1). New yearly invariant: every price finite and positive. Tests 489 passed, 0 failed; scenarios 23 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 30 | 83 | 197 | 217 | 63 | 185 | 0 | 13 | 7/128/0 | 2.7 | 17.7 | 25.1 | 5.7 | 118 | 1 | 2027 | 208 | 41.3 | 6.4 | 3 (4) | 81/0/3/2/13 | 62 | 5.5 | 25 | 3 | 0 | 25411 |
| valley | 2 | 7 | 59 | 186 | 188 | 58 | 114 | 0 | 11 | 6/161/5 | 2.6 | 0 | 24.3 | 4 | 60 | 1.1 | 946 | 183 | 35.6 | 4.5 | 0 (3) | 80/1/3/1/13 | 53 | 4.2 | 21 | 0 | 0 | 19991 |
| plains | 1 | 33 | 173 | 205 | 331 | 78 | 436 | 0 | 12 | 24/176/5 | 2.5 | 19.3 | 22.3 | 7.9 | 80 | 1 | 3717 | 104 | 32.5 | 5.1 |  | 80/0/0/0/19 | 60 | 6.6 | 29 | 0 | 0 | 34317 |
| plains | 2 | 28 | 150 | 150 | 239 | 40 | 296 | 0 | 12 | 2/241/5 | 2.9 | 17.1 | 17.8 | 10.9 | 64 | 1 | 957 | 35 | 16.9 | 5.2 |  | 77/1/3/0/18 | 66 | 14.9 | 17 | 0 | 0 | 22187 |
| forest | 1 | 3 | 10 | 224 | 224 | 61 | 75 | 3 | 13 | 12/179/1 | 2.6 | 13.5 | 25.2 | 4.2 | 22 | 0.9 | 3206 | 89 | 25.9 | 6.7 |  | 81/0/3/2/12 | 44 | 4.3 | 21 | 0 | 0 | 15145 |
| forest | 2 | 25 | 133 | 97 | 144 | 37 | 158 | 0 | 14 | 1/119/0 | 2.5 | 0 | 21.3 | 3.8 | 51 | 1.1 | 356 | 75 | 23 | 5.2 | 0 (2) | 86/1/2/0/10 | 32 | 4.1 | 13 | 0 | 0 | 17183 |
| lakeland | 1 | 17 | 109 | 218 | 233 | 78 | 171 | 0 | 13 | 11/141/3 | 2.7 | 0 | 20.9 | 5 | 55 | 1 | 2108 | 132 | 29.8 | 4.8 | 0 (1) | 81/0/2/0/16 | 66 | 5.3 | 25 | 0 | 0 | 26105 |
| lakeland | 2 | 16 | 88 | 192 | 222 | 64 | 232 | 0 | 14 | 21/120/5 | 2.5 | 0 | 19.4 | 4.7 | 116 | 1 | 1220 | 182 | 31.6 | 4.5 | 3.5 (2) | 85/1/2/1/10 | 49 | 4.9 | 29 | 0 | 0 | 21602 |
| highland | 1 | 21 | 48 | 46 | 71 | 25 | 116 | 0 | 14 | 1/58/5 | 2.8 | 0 | 18.4 | 7 | 35 | 1.1 | 2428 | 95 | 19 | 3.1 | 0.4 (5) | 68/0/4/0/26 | 44 | 6.1 | 13 | 0 | 0 | 11968 |
| highland | 2 | 15 | 22 | 51 | 51 | 12 | 68 | 0 | 12 | 7/63/5 | 3 | 2 | 6.4 | 5.8 | 2 | 1.2 | 454 | 43 | 10.6 | 22.8 | 12 (1) | 56/0/0/0/44 | 27 | 4.6 | 9 | 0 | 0 | 6582 |
| mean |  | 19.5 | 87.5 | 156.6 | 192 | 51.6 | 185.1 | 0.3 | 12.8 |  | 2.7 | 7 | 20.1 | 5.9 | 60.3 | 1 | 1741.9 | 114.6 | 26.6 | 6.8 |  |  | 50.3 | 6 | 20.2 | 0.3 | 0 | 20049.1 |

Year 100 mean 156.6 (150.0 at H1), dwellings 51.6 (50.8), hunger deaths 185.1 (201.1), 3 resettles (forest 1), as before.


## H3: paid work, work chosen by earnings

- Food work is weighed by what it is expected to earn: what a day of it usually brings in (a slow average over the years, not just last year) times the price of that food now (capped at 4). Before, it was weighed only by last year's return, so a bad harvest drove people off the fields.
- When grain is dear against fish and fruit, each household sows more land (up to 1.6 times; down to 0.7 times when grain is cheap).
- Building is paid. The builder's household gets half a ration a stage, in coin where there is coin, from:
  - the household living in the house;
  - for a new house, the household of the person it is for (recorded when the plot is chosen);
  - failing both, the common store.

  Over 100 years lakeland 1 paid 15.6 rations to builders, plains 1 45.7.

Checks. New unit (the plan's): the same world twice from the start of year 40, one blighted; the next spring each working hand sows more after the blighted year. Lakeland 1: 3.97 field tiles a hand after a normal year, 4.43 after a blight; valley 1: 6.46 against 12.08 (the blight also starved 23 of its 35 working hands). Valley 2 (not in the test): 3.35 against 3.62. The number holding the farmer trade does not rise (lakeland 1: 6 after a normal year, 0 after a blight): trades are still only given out when the food supply can spare hands, so it is the households, not the trade, that turn to the fields. Tests 490 passed, 0 failed; scenarios 23 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 90 | 214 | 235 | 80 | 191 | 0 | 14 | 12/128/9 | 2.7 | 24 | 22.2 | 5.5 | 116 | 1 | 34758 | 242 | 33.4 | 4.2 | 4 (1) | 80/0/2/3/14 | 64 | 4.9 | 25 | 3 | 0 | 29735 |
| valley | 2 | 7 | 62 | 166 | 221 | 74 | 176 | 0 | 12 | 5/181/0 | 2.6 | 0 | 24.9 | 4.1 | 67 | 1 | 1178 | 214 | 35.1 | 4.3 | 0 (2) | 86/1/4/0/9 | 59 | 4.3 | 21 | 0 | 0 | 25207 |
| plains | 1 | 19 | 110 | 365 | 365 | 78 | 266 | 0 | 13 | 6/105/5 | 2.4 | 19.1 | 22.3 | 7.4 | 77 | 1 | 3369 | 121 | 33.3 | 4.6 |  | 82/0/1/0/14 | 64 | 8.2 | 29 | 0 | 0 | 35599 |
| plains | 2 | 26 | 100 | 142 | 160 | 35 | 184 | 0 | 12 | 7/240/0 | 2.7 | 20.3 | 15.7 | 10 | 76 | 1.1 | 602 | 29 | 16.4 | 5.2 |  | 77/0/2/0/20 | 57 | 12.3 | 17 | 0 | 0 | 20141 |
| forest | 1 | 3 | 10 | 129 | 133 | 30 | 64 | 3 | 10 | 2/87/0 | 2.7 | 13.5 | 17 | 3.9 | 31 | 0.9 | 441 | 54 | 23.7 | 5.7 |  | 87/0/2/0/10 | 36 | 5 | 17 | 0 | 0 | 12820 |
| forest | 2 | 25 | 101 | 106 | 122 | 35 | 173 | 0 | 13 | 7/229/7 | 2.4 | 0 | 20.7 | 3.8 | 36 | 1 | 331 | 45 | 23.3 | 6.6 | 2 (2) | 89/0/3/0/8 | 31 | 4.8 | 13 | 0 | 0 | 18478 |
| lakeland | 1 | 13 | 79 | 247 | 267 | 85 | 199 | 0 | 14 | 38/80/6 | 2.6 | 0 | 22 | 4.8 | 48 | 1.1 | 2233 | 110 | 32.2 | 4.9 | 3 (1) | 82/0/2/1/15 | 66 | 6 | 25 | 1 | 0 | 29760 |
| lakeland | 2 | 10 | 64 | 177 | 187 | 56 | 155 | 0 | 12 | 15/130/0 | 2.5 | 0 | 18.9 | 4.5 | 167 | 1 | 1116 | 136 | 28.4 | 5.3 | 0 (1) | 83/0/2/0/13 | 49 | 4.7 | 25 | 0 | 0 | 18698 |
| highland | 1 | 23 | 47 | 63 | 64 | 25 | 65 | 0 | 11 | 0/53/0 | 2.8 | 0 | 17.2 | 6.5 | 13 | 1.1 | 97 | 71 | 22.6 | 2.9 |  | 79/2/4/0/13 | 51 | 8.7 | 13 | 0 | 0 | 11339 |
| highland | 2 | 14 | 12 | 17 | 23 | 2 | 65 | 0 | 11 | 3/92/0 | 2.9 | 2 | 6.3 | 5.6 | 0 |  | 15 | 18 | 12.6 | 2.2 |  | 58/7/0/0/35 | 27 | 5.7 | 8 | 0 | 0 | 5685 |
| mean |  | 16.8 | 67.5 | 162.6 | 177.7 | 50 | 153.8 | 0.3 | 12.2 |  | 2.6 | 7.9 | 18.7 | 5.6 | 63.1 | 1 | 4414 | 104 | 26.1 | 4.6 |  |  | 50.4 | 6.5 | 19.3 | 0.4 | 0 | 20746.2 |

Year 100 mean 162.6 (156.6 at H2), dwellings 50.0 (51.6), hunger deaths 153.8 (185.1), 3 resettles (forest 1), as before.


## H4: the market

When coin comes (H1) the place gets a market (`T.market`, at the fire): the four lots round the fire are not built on from then on (houses already there stay), and a stall stands on each that is dry and free (the stall sprites made earlier, which were waiting for trade). A trade is now made at the market: each trading household sends one grown person, who walks there on a real trip (`market` work). It counts as a trip of its own kind in the household's year (B8's trip counts), and people are drawn at a stall chatting.

Also fixed in the view: someone who died was only let go after 30 seconds of game time on screen, so when steps run faster than frames (a long jump, a slow device) the dead piled up; a 70-year jump left frames taking 5 to 11 seconds each. The dead are now also let go three steps after dying.

Checks. New unit (the plan's): plains 1 has a market by year 70 and its households counted trips to it the year before; no house has been begun on the market lots. Lakeland 1 over 100 years: 1432 market trips; 37 in households' counts in its last year. Tests 491 passed, 0 failed; scenarios 23 passed. Still checked in the game at year 70 (plains 1): stall by the fire, people at the market.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 92 | 225 | 229 | 81 | 194 | 0 | 13 | 7/120/5 | 2.6 | 24 | 25 | 5.2 | 95 | 1.1 | 3864 | 236 | 34.2 | 4.4 |  | 87/0/2/0/10 | 64 | 5.2 | 25 | 3 | 0 | 26553 |
| valley | 2 | 7 | 62 | 127 | 128 | 43 | 130 | 0 | 11 | 19/198/5 | 2.6 | 0 | 25.8 | 3.8 | 35 | 1.1 | 600 | 137 | 33.9 | 4.5 |  | 79/0/3/0/17 | 46 | 4.1 | 17 | 0 | 0 | 19235 |
| plains | 1 | 19 | 119 | 198 | 205 | 65 | 198 | 0 | 13 | 5/173/0 | 2.3 | 19.1 | 23.7 | 7 | 87 | 1 | 1884 | 90 | 33.5 | 4.9 |  | 88/0/1/0/7 | 48 | 8.2 | 25 | 0 | 0 | 26224 |
| plains | 2 | 26 | 96 | 166 | 166 | 49 | 178 | 0 | 12 | 8/276/0 | 2.4 | 23.6 | 17.9 | 7.7 | 65 | 1 | 1069 | 41 | 20.8 | 5.7 |  | 73/0/0/0/24 | 52 | 4.4 | 21 | 0 | 0 | 17918 |
| forest | 1 | 3 | 10 | 134 | 135 | 32 | 57 | 3 | 10 | 15/91/8 | 2.6 | 13.5 | 19.5 | 3.8 | 23 | 1 | 493 | 57 | 25 | 7.3 |  | 81/3/2/0/11 | 36 | 4.6 | 17 | 0 | 0 | 12010 |
| forest | 2 | 25 | 109 | 92 | 130 | 36 | 165 | 0 | 13 | 25/252/0 | 2.5 | 0 | 20.3 | 3.7 | 41 | 1.1 | 359 | 42 | 22 | 5.3 | 0 (3) | 83/1/3/0/11 | 31 | 3.9 | 13 | 0 | 0 | 18698 |
| lakeland | 1 | 13 | 81 | 240 | 268 | 85 | 144 | 0 | 13 | 1/74/5 | 2.6 | 0 | 23.4 | 4.7 | 33 | 1.1 | 2904 | 159 | 31.8 | 5.2 | 1.5 (2) | 77/1/2/0/18 | 67 | 5.7 | 25 | 0 | 0 | 26034 |
| lakeland | 2 | 10 | 64 | 165 | 187 | 54 | 150 | 0 | 12 | 5/74/5 | 2.5 | 0 | 19 | 4.4 | 40 | 1 | 1121 | 123 | 26.8 | 4.5 | 0 (1) | 81/0/3/0/15 | 43 | 5.1 | 25 | 0 | 0 | 17102 |
| highland | 1 | 23 | 47 | 61 | 61 | 27 | 65 | 0 | 12 | 1/75/5 | 2.8 | 0 | 18.7 | 6.7 | 15 | 1.1 | 99 | 89 | 24.6 | 3.2 | 0 (1) | 73/0/3/0/20 | 52 | 6.3 | 13 | 0 | 0 | 10528 |
| highland | 2 | 14 | 12 | 17 | 23 | 2 | 65 | 0 | 11 | 3/92/0 | 2.9 | 2 | 6.3 | 5.6 | 0 |  | 15 | 18 | 12.6 | 2.2 |  | 58/7/0/0/35 | 27 | 5.7 | 8 | 0 | 0 | 5687 |
| mean |  | 16.8 | 69.2 | 142.5 | 153.2 | 47.4 | 134.6 | 0.3 | 12 |  | 2.6 | 8.2 | 20 | 5.3 | 43.4 | 1.1 | 1240.8 | 99.2 | 26.5 | 4.7 |  |  | 46.6 | 5.3 | 18.9 | 0.3 | 0 | 17998.9 |

Year 100 mean 142.5 (162.6 at H3), dwellings 47.4 (50.0), hunger deaths 134.6 (153.8), 3 resettles (forest 1), as before. Trading households give a person's day to the walk, which is likely most of the drop.


## I1 (with I2's height limits): where to put a roof, and upper floors

A household that needs a roof now weighs, as the design note says, one cost for every option: the building work spread over ten years, plus the days lost each year walking from that door, counted from the household's own trips last year:
- to the centre (store, market, building plots, guard);
- to its own fields (at half weight);
- out past the edge of the place for foraging, timber, firewood, stone and game. A door near the middle is far from those; this third part is my addition to the note, and without it everyone moved inward.

Building work is counted in a person's days: 12 for each unit of timber, 18 for each of stone, 20 for each stage, so a house is about 190 days. The options are the best free lot, or an upper floor above a house of the same kind that is one's own or a kinsman's. A floor costs 1.6 times the building, and its stairs add 1.5 tiles a floor to every trip. A floor is only weighed against a free lot actually found, or once the whole map has been searched; before, the household waits while the search widens, as it did. Floors are capped by means (I2): two with timber alone, four with a mason's yard standing, six with a lime kiln.

Deviation from the plan: a second ground-floor roof on a kin's lot is not an option. A lot (4 tiles, a 3x3 yard) has no room for one; the choice is a free lot or a floor up.

A floor is a site of its own (its own household, larder and hearth) marked as standing `upon` a house, at its tile. It comes down with the house, is never rebuilt as a better kind on its own, and is drawn as part of the house: the house's wall band (below the eaves at 0.69 of the drawing) repeated once per floor, with scaffolding while one goes up.

Checks:
- Scenario "held at 30 people", 100 years: no lot has more than one dwelling. It failed three times on the way: floors chosen when no lot had been found yet; a cheap hut floor compared against building a whole house; outward trips not counted.
- New yearly invariant: no house has more than two floors where masonry is not known, nor more than six anywhere.
- The one-site-per-tile check now allows floors, and fails a floor that stands on nothing.
- In 100-year worlds at 96: lakeland 1 has 12 upper floors, plains 1 has 3, valley 1 has 9. With an earlier weighting, houses with floors were nearer the centre than houses in general (valley 1: 10.9 against 15.2 tiles).
- Tests 504 passed, 0 failed; scenarios 23 passed. Still: a two-floor house at plains 1, year 100.

Cost: floors make the places a little smaller. On the 15 extra worlds, year 100 is 109.5 against 115.7 with floors switched off (the same code otherwise gives exactly H4's numbers). In the table below, 119.6 against 142.5 at H4. Households that move up into the centre are farther from what grows wild.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 77 | 168 | 187 | 48 | 139 | 0 | 12 | 17/67/0 | 2.8 | 20.9 | 24.8 | 6 | 29 | 1 | 3432 | 115 | 34.7 | 6.8 |  | 83/2/2/0/10 | 54 | 6.9 | 17 | 3 | 0 | 17813 |
| valley | 2 | 7 | 63 | 104 | 120 | 35 | 119 | 0 | 10 | 13/96/6 | 2.7 | 0 | 24.7 | 3.9 | 19 | 1.1 | 434 | 143 | 30.9 | 4.9 | 0 (1) | 85/3/3/0/7 | 49 | 4.8 | 13 | 0 | 0 | 16284 |
| plains | 1 | 19 | 119 | 242 | 346 | 71 | 346 | 0 | 14 | 0/342/5 | 2.6 | 19.1 | 21.7 | 7.5 | 81 | 1 | 2141 | 114 | 34.1 | 4.5 | 0 (1) | 83/0/1/0/13 | 56 | 7.5 | 25 | 0 | 0 | 30294 |
| plains | 2 | 26 | 105 | 99 | 116 | 44 | 129 | 0 | 11 | 6/284/5 | 2.4 | 20.4 | 17.2 | 7.4 | 91 | 1.1 | 963 | 36 | 17.8 | 5.6 |  | 83/1/0/1/11 | 44 | 5.8 | 21 | 0 | 0 | 15700 |
| forest | 1 | 3 | 10 | 134 | 135 | 32 | 57 | 3 | 10 | 15/91/8 | 2.6 | 13.5 | 19.5 | 3.8 | 23 | 1 | 493 | 57 | 25 | 7.3 |  | 81/3/2/0/11 | 36 | 4.6 | 17 | 0 | 0 | 12428 |
| forest | 2 | 25 | 109 | 89 | 129 | 35 | 144 | 0 | 13 | 11/219/0 | 2.5 | 0 | 21.7 | 3.8 | 28 | 1.1 | 305 | 43 | 22 | 4.7 | 8.4 (5) | 75/0/3/1/18 | 31 | 4.2 | 13 | 0 | 0 | 18222 |
| lakeland | 1 | 13 | 81 | 203 | 225 | 76 | 146 | 0 | 13 | 24/43/5 | 2.8 | 0 | 24 | 4.7 | 59 | 1.1 | 1805 | 145 | 29.2 | 5.6 | 1.5 (2) | 82/0/3/0/12 | 64 | 7.6 | 21 | 0 | 0 | 23185 |
| lakeland | 2 | 10 | 57 | 87 | 105 | 35 | 96 | 0 | 12 | 7/95/2 | 2.6 | 0 | 15.8 | 4.8 | 35 | 1.1 | 591 | 90 | 21.5 | 4 | 0 (1) | 83/1/1/0/12 | 35 | 4.8 | 17 | 0 | 0 | 12898 |
| highland | 1 | 23 | 47 | 53 | 53 | 17 | 76 | 0 | 13 | 9/51/0 | 2.8 | 0 | 18.1 | 6.1 | 10 | 1 | 44 | 53 | 20.1 | 3 |  | 75/0/1/0/23 | 47 | 6.4 | 9 | 0 | 0 | 10598 |
| highland | 2 | 14 | 12 | 17 | 23 | 2 | 65 | 0 | 11 | 3/92/0 | 2.9 | 2 | 6.3 | 5.6 | 0 |  | 15 | 18 | 12.6 | 2.2 |  | 58/7/0/0/35 | 27 | 5.7 | 8 | 0 | 0 | 6093 |
| mean |  | 16.8 | 68 | 119.6 | 143.9 | 39.5 | 131.7 | 0.3 | 11.9 |  | 2.7 | 7.6 | 19.4 | 5.4 | 37.5 | 1.1 | 1022.3 | 81.4 | 24.8 | 4.9 |  |  | 44.3 | 5.8 | 16.1 | 0.3 | 0 | 16351.5 |

Year 100 mean 119.6 (142.5 at H4), dwellings 39.5 (47.4; floors are not counted as dwellings in this column), hunger deaths 131.7 (134.6), 3 resettles (forest 1), as before.


## I3: rent

A household may now also take a floor above a stranger's house, for rent. The tenant would pay half of what it saves each year against its next best option (the best free lot, weighed by the same cost as I1). The owner builds it if ten years of that rent covers 1.6 times the house's building work. Every year each rented floor's rent is weighed again against the best free lot the tenants could take that year. It is paid from the tenants' larder to the owner's (a day of rent is a tenth of a ration), in coin where there is coin. The first is told. `choosePlot` has a look-only mode for this (no lot taken). In 100 years: plains 1 and valley 1 had 2 rented floors each (mean rent 2.5 and 22 days a year); lakeland 1 none.

Not shown: the plan's check, "rents fall the year a new street or bridge opens". Rent follows the tenants' best free alternative. I tried it three ways:
- Every ford bridged at once in three worlds: no change. Tenants' alternatives are not across water.
- Every lattice way worn into a road at once: no change. Rented floors sit at the centre where streets already run, and so do their alternatives.
- Measuring the walk along the ways (roads quicker, bridges counted), so a street would lower an alternative's cost: floors and rentals took over from year 11, year 100 fell to 99.0 and the held-at-30 village stacked again. That was reverted; the walk is a straight line again.

So the mechanism is there, but these worlds do not yet produce a case where a new way changes a tenant's alternative.

Checks. New yearly invariant: rents finite, not negative, and only paid by a floor. Tests 516 passed, 0 failed; scenarios 23 passed (held at 30: no doubled lots).

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 77 | 166 | 172 | 50 | 120 | 0 | 12 | 0/151/5 | 2.8 | 20.9 | 30.2 | 6.1 | 33 | 1.1 | 3675 | 192 | 36.4 | 6.9 |  | 84/0/4/0/11 | 58 | 6.4 | 21 | 3 | 0 | 19356 |
| valley | 2 | 7 | 63 | 104 | 120 | 35 | 119 | 0 | 10 | 13/96/6 | 2.7 | 0 | 24.7 | 3.9 | 19 | 1.1 | 434 | 143 | 30.9 | 4.9 | 0 (1) | 85/3/3/0/7 | 49 | 4.8 | 13 | 0 | 0 | 17070 |
| plains | 1 | 19 | 119 | 264 | 351 | 84 | 333 | 0 | 14 | 14/193/0 | 2.6 | 19.1 | 22.9 | 7.2 | 68 | 1 | 3134 | 121 | 35.1 | 4.8 | 0 (1) | 83/0/1/0/14 | 58 | 6.2 | 29 | 0 | 0 | 33129 |
| plains | 2 | 26 | 105 | 99 | 116 | 44 | 129 | 0 | 11 | 6/284/5 | 2.4 | 20.4 | 17.2 | 7.4 | 91 | 1.1 | 963 | 36 | 17.8 | 5.6 |  | 83/1/0/1/11 | 44 | 5.8 | 21 | 0 | 0 | 15862 |
| forest | 1 | 3 | 10 | 134 | 135 | 32 | 57 | 3 | 10 | 15/91/8 | 2.6 | 13.5 | 19.5 | 3.8 | 23 | 1 | 493 | 57 | 25 | 7.3 |  | 81/3/2/0/11 | 36 | 4.6 | 17 | 0 | 0 | 12669 |
| forest | 2 | 25 | 109 | 89 | 129 | 35 | 144 | 0 | 13 | 11/219/0 | 2.5 | 0 | 21.7 | 3.8 | 28 | 1.1 | 305 | 43 | 22 | 4.7 | 8.4 (5) | 75/0/3/1/18 | 31 | 4.2 | 13 | 0 | 0 | 18499 |
| lakeland | 1 | 13 | 81 | 203 | 225 | 76 | 146 | 0 | 13 | 24/43/5 | 2.8 | 0 | 24 | 4.7 | 59 | 1.1 | 1805 | 145 | 29.2 | 5.6 | 1.5 (2) | 82/0/3/0/12 | 64 | 7.6 | 21 | 0 | 0 | 24214 |
| lakeland | 2 | 10 | 57 | 87 | 105 | 35 | 96 | 0 | 12 | 7/95/2 | 2.6 | 0 | 15.8 | 4.8 | 35 | 1.1 | 591 | 90 | 21.5 | 4 | 0 (1) | 83/1/1/0/12 | 35 | 4.8 | 17 | 0 | 0 | 12910 |
| highland | 1 | 23 | 47 | 53 | 53 | 17 | 76 | 0 | 13 | 9/51/0 | 2.8 | 0 | 18.1 | 6.1 | 10 | 1 | 44 | 53 | 20.1 | 3 |  | 75/0/1/0/23 | 47 | 6.4 | 9 | 0 | 0 | 9355 |
| highland | 2 | 14 | 12 | 17 | 23 | 2 | 65 | 0 | 11 | 3/92/0 | 2.9 | 2 | 6.3 | 5.6 | 0 |  | 15 | 18 | 12.6 | 2.2 |  | 58/7/0/0/35 | 27 | 5.7 | 8 | 0 | 0 | 5970 |
| mean |  | 16.8 | 68 | 121.6 | 142.9 | 41 | 128.5 | 0.3 | 11.9 |  | 2.7 | 7.6 | 20 | 5.3 | 36.6 | 1.1 | 1145.9 | 89.8 | 25.1 | 4.9 |  |  | 44.9 | 5.6 | 16.9 | 0.3 | 0 | 16903.4 |

Year 100 mean 121.6 (119.6 at I1), dwellings 41.0 (39.5), hunger deaths 128.5 (131.7), 3 resettles (forest 1), as before.


## I4 (in part): shops on the market, and the walk to work counted

- A day at a place of work (`craft`) is now counted as a trip of its own ('work'), and ditch digging as 'fields'. The walking cost of I1 counts 'work' trips toward the centre, so a household whose people work in the places of work weighs a door near the middle.
- The market lots (H4) are no longer closed to everyone: a household in which someone has a building trade (smith, potter, wright, scribe, healer, builder, mason, herder) may build there. Such a house is a shop below with the home above (`shop`); the first is told.

Not shown: the plan's check, "tradespeople's doors are nearer the centre than farmers'". Over years 50 to 100 of four worlds, households with a tradesperson lived 14.6 tiles from the fire on average, farmers' 15.4. That is nearer, but barely. No shop was built in those runs. Trades are still given out only when the food supply can spare hands (F6 changed that only for the places of work), so late in these runs few households hold a trade at all: lakeland 1 and valley 1 had none. A proper fix is to let trades be taken up by what they earn (H3) for every trade, not only food work; that is not done.

Tests 516 passed, 0 failed; scenarios 23 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 77 | 166 | 172 | 50 | 120 | 0 | 12 | 0/151/5 | 2.8 | 20.9 | 30.2 | 6.1 | 33 | 1.1 | 3675 | 192 | 36.4 | 6.9 |  | 84/0/4/0/11 | 58 | 6.4 | 21 | 3 | 0 | 19161 |
| valley | 2 | 7 | 63 | 104 | 120 | 35 | 119 | 0 | 10 | 13/96/6 | 2.7 | 0 | 24.7 | 3.9 | 19 | 1.1 | 434 | 143 | 30.9 | 4.9 | 0 (1) | 85/3/3/0/7 | 49 | 4.8 | 13 | 0 | 0 | 16349 |
| plains | 1 | 19 | 119 | 264 | 351 | 84 | 333 | 0 | 14 | 14/193/0 | 2.6 | 19.1 | 22.9 | 7.2 | 68 | 1 | 3134 | 121 | 35.1 | 4.8 | 0 (1) | 83/0/1/0/14 | 58 | 6.2 | 29 | 0 | 0 | 32663 |
| plains | 2 | 26 | 105 | 99 | 116 | 44 | 129 | 0 | 11 | 6/284/5 | 2.4 | 20.4 | 17.2 | 7.4 | 91 | 1.1 | 963 | 36 | 17.8 | 5.6 |  | 83/1/0/1/11 | 44 | 5.8 | 21 | 0 | 0 | 15835 |
| forest | 1 | 3 | 10 | 134 | 135 | 32 | 57 | 3 | 10 | 15/91/8 | 2.6 | 13.5 | 19.5 | 3.8 | 23 | 1 | 493 | 57 | 25 | 7.3 |  | 81/3/2/0/11 | 36 | 4.6 | 17 | 0 | 0 | 11988 |
| forest | 2 | 25 | 109 | 89 | 129 | 35 | 144 | 0 | 13 | 11/219/0 | 2.5 | 0 | 21.7 | 3.8 | 28 | 1.1 | 305 | 43 | 22 | 4.7 | 8.4 (5) | 75/0/3/1/18 | 31 | 4.2 | 13 | 0 | 0 | 17471 |
| lakeland | 1 | 13 | 81 | 203 | 225 | 76 | 146 | 0 | 13 | 24/43/5 | 2.8 | 0 | 24 | 4.7 | 59 | 1.1 | 1805 | 145 | 29.2 | 5.6 | 1.5 (2) | 82/0/3/0/12 | 64 | 7.6 | 21 | 0 | 0 | 24037 |
| lakeland | 2 | 10 | 63 | 92 | 114 | 40 | 128 | 0 | 12 | 1/197/5 | 2.6 | 0 | 15.8 | 5.1 | 127 | 1.1 | 647 | 86 | 22 | 4.6 | 0 (1) | 80/1/1/0/13 | 37 | 5.4 | 17 | 0 | 0 | 14422 |
| highland | 1 | 23 | 47 | 53 | 53 | 17 | 76 | 0 | 13 | 9/51/0 | 2.8 | 0 | 18.1 | 6.1 | 10 | 1 | 44 | 53 | 20.1 | 3 |  | 75/0/1/0/22 | 47 | 6.4 | 9 | 0 | 0 | 9366 |
| highland | 2 | 14 | 12 | 17 | 23 | 2 | 65 | 0 | 11 | 3/92/0 | 2.9 | 2 | 6.3 | 5.6 | 0 |  | 15 | 18 | 12.6 | 2.2 |  | 58/7/0/0/35 | 27 | 5.7 | 8 | 0 | 0 | 5811 |
| mean |  | 16.8 | 68.6 | 122.1 | 143.8 | 41.5 | 131.7 | 0.3 | 11.9 |  | 2.7 | 7.6 | 20 | 5.4 | 45.8 | 1.1 | 1151.5 | 89.4 | 25.1 | 5 |  |  | 45.1 | 5.7 | 16.9 | 0.3 | 0 | 16710.3 |

Year 100 mean 122.1 (121.6 at I3).


## I5: rows before height

A free lot one lot over from a standing house, in line along a way, shares a wall with it. It scores better when a plot is chosen (+0.6), and building there is 0.85 of the work of a house standing alone, in the cost of I1. So a household fills the next lot in a row before a floor up wins. Over four 100-year worlds (lakeland 1, plains 1, valley 1, plains 2): 94% of houses stand in a row (95% before, since the lattice already lines them up), and upper floors fell from 33 to 16. Rows come first, and height only where the row is full.

Not done: drawing joined rows as terraces (each house is still drawn whole). The phase-wide check "dwellings per lot fall with distance from the centre; the edge is one storey; no lone tower in a field" is not yet measured as a test.

Tests 516 passed, 0 failed; scenarios 23 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 27 | 101 | 165 | 186 | 57 | 186 | 0 | 13 | 12/123/1 | 2.5 | 8 | 24.6 | 5.9 | 94 | 1 | 1233 | 159 | 39.6 | 6.1 | 0 (2) | 82/0/3/0/15 | 54 | 6.1 | 21 | 3 | 0 | 26601 |
| valley | 2 | 7 | 63 | 127 | 139 | 41 | 134 | 0 | 11 | 8/253/0 | 2.7 | 0 | 24.9 | 4.2 | 44 | 1.1 | 611 | 145 | 30.4 | 4.8 | 0 (2) | 84/2/3/0/10 | 52 | 4.8 | 17 | 0 | 0 | 16980 |
| plains | 1 | 19 | 115 | 256 | 258 | 82 | 207 | 0 | 13 | 4/177/3 | 2.2 | 19.1 | 24.7 | 6.7 | 125 | 1 | 3806 | 92 | 36.6 | 6.7 |  | 76/1/0/5/15 | 55 | 9 | 29 | 0 | 0 | 27486 |
| plains | 2 | 25 | 102 | 132 | 142 | 35 | 197 | 0 | 12 | 5/420/5 | 2.7 | 22 | 12.6 | 10.7 | 61 | 1 | 548 | 72 | 14.8 | 4.8 |  | 75/0/0/0/21 | 55 | 8.4 | 17 | 0 | 0 | 17932 |
| forest | 1 | 3 | 10 | 117 | 129 | 30 | 93 | 3 | 10 | 22/147/6 | 2.7 | 13.5 | 16.2 | 4.4 | 33 | 1 | 303 | 44 | 19.4 | 5.4 |  | 84/3/2/0/10 | 38 | 5.3 | 13 | 0 | 0 | 12789 |
| forest | 2 | 14 | 78 | 104 | 138 | 39 | 148 | 0 | 13 | 15/138/5 | 2.6 | 0 | 18.2 | 3.8 | 26 | 1.1 | 318 | 73 | 24.2 | 4.2 |  | 84/1/4/0/9 | 34 | 4.3 | 13 | 0 | 0 | 19218 |
| lakeland | 1 | 13 | 92 | 202 | 202 | 64 | 120 | 0 | 13 | 25/138/5 | 2.9 | 0 | 19.1 | 4.8 | 84 | 1 | 1190 | 157 | 27.7 | 4.9 | 3 (1) | 88/1/2/0/7 | 61 | 5.2 | 21 | 0 | 0 | 21517 |
| lakeland | 2 | 10 | 65 | 165 | 165 | 46 | 140 | 0 | 13 | 7/99/2 | 2.6 | 0 | 17 | 5 | 53 | 1 | 1156 | 138 | 25 | 4.6 | 0 (2) | 78/1/3/1/15 | 45 | 4.9 | 25 | 0 | 0 | 16895 |
| highland | 1 | 23 | 47 | 66 | 66 | 27 | 64 | 0 | 11 | 2/68/5 | 2.8 | 0 | 22.3 | 6.6 | 13 | 1.1 | 93 | 80 | 23.3 | 3.4 |  | 77/0/4/0/17 | 51 | 6.9 | 13 | 0 | 0 | 11086 |
| highland | 2 | 15 | 57 | 63 | 74 | 22 | 118 | 0 | 12 | 11/85/4 | 3 | 17.3 | 9 | 7.4 | 44 | 1 | 121 | 83 | 23.5 | 6.1 | 4.666666666666667 (3) | 75/0/5/0/18 | 36 | 6.5 | 13 | 0 | 0 | 11904 |
| mean |  | 15.6 | 73 | 139.7 | 149.9 | 44.3 | 140.7 | 0.3 | 12.1 |  | 2.7 | 8 | 18.9 | 5.9 | 57.7 | 1 | 937.9 | 104.3 | 26.5 | 5.1 |  |  | 48.1 | 6.1 | 18.2 | 0.3 | 0 | 18240.8 |

Year 100 mean 139.7 (122.1 at I4), dwellings 44.3 (41.5), hunger deaths 140.7 (131.7), 3 resettles (forest 1), as before.


## Owner's questions: where the food comes from; more from the fields; two crops; harvests seen and logged

Measured first. Every piece of food that comes in is now counted by kind (grain and greens from the fields, fruit gathered, fish, meat), each year (`T.foodLast`, shown in the Town panel as "Food last year", with food a head). Before this change, over the first 60 years of valley 1, plains 1 and lakeland 1:
- food coming in was only 2.0 to 2.8 a head a year, about what people eat;
- the fields gave 35 to 55% of it, fish 15 to 45%, gathering 15 to 50%, and hunting almost nothing;
- a sown tile gave about 0.3 a year, so a farming household barely fed itself, nobody could be spared for a trade, and larders stayed empty (which is also why the small furniture never showed: it waits for full larders and trades).

Changes:
- A sown tile gives three times what it did (`FIELD_YIELD`). Households sow half as many tiles, so a household still grows about one and a half times what it did, on less ground.
- A second crop: greens and beans (`veg`, a fifth food, keeping better than fruit). Each spring a household sows its new lots with whichever of grain and greens it has less of, in the larder and in the ground together, then the other, lot by lot. So households differ and trade.
- Bug: the fields were harvested twice a year in three of four worlds. Resting fields counted as sown, so the first frost "harvested" what had regrown. Now one harvest a year, and sowing waits for spring.
- Each household's harvest rises from its fields as a picture of the crop with "+N", and the year's harvest is told in the log ("Harvest: 157 grain and 101 greens from 220 sown tiles."). Grain is drawn as stalks turning gold; greens are the leafy plant.
- A floor is only built when it is clearly (10%) cheaper than a free lot: a roof of one's own is worth a little.
- The bad-harvest price test now blights only the grain fields, waits for prices to see the harvest, and compares grain with fish and fruit, whatever the coin is.

After: the fields give 60 to 80% of the food (valley 1 at year 40: 79%), food a head is 2.0 to 4.2, and trades are held by many (valley 1: 42 people at year 40, 173 at year 60). Places grow much larger: valley 1 has 704 people at year 100.

The view was too slow for that many: 6 frames a second at year 100 in valley 1. Fixed:
- every house asked every creature whether anyone worked on it, every frame;
- every drawn burrow and house counted its sleepers the same way;
- the code that keeps bodies apart compared everyone standing round the fire with each other, and worked on hidden and off-screen creatures too.

Now 45 frames a second at 1x and 87 at 4x with 704 people. A year of steps takes 1.8 s there.

Checks. New unit: in plains 1 over 40 years, never two harvests in one year, each shown rising from the fields, and at year 40 the fields give over 30% of the food with both crops coming in. Tests 518 passed, 0 failed; scenarios 23 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 30 | 175 | 704 | 704 | 119 | 549 | 0 | 14 | 17/82/5 | 3 | 14.7 | 22.7 | 7.5 | 47 | 1 | 4650 | 317 | 44.2 | 5.3 | 2 (2) | 78/0/2/0/17 | 77 | 7.7 | 33 | 3 | 0 | 65063 |
| valley | 2 | 8 | 74 | 559 | 804 | 169 | 451 | 0 | 14 | 16/86/5 | 3.2 | 0 | 27.8 | 7.1 | 52 | 0.9 | 4647 | 417 | 42 | 4.4 | 3 (2) | 73/0/3/0/20 | 88 | 8.7 | 33 | 0 | 0 | 72390 |
| plains | 1 | 34 | 191 | 262 | 562 | 88 | 688 | 0 | 12 | 12/107/6 | 3.1 | 21.3 | 23.4 | 9.5 | 103 | 1 | 2541 | 155 | 36.6 | 5.5 |  | 83/0/0/0/13 | 65 | 11.3 | 25 | 0 | 0 | 50279 |
| plains | 2 | 20 | 132 | 295 | 382 | 53 | 379 | 0 | 12 | 1/198/5 | 3.4 | 23.1 | 19.6 | 12.6 | 118 | 0.9 | 1037 | 80 | 19.9 | 4.5 |  | 74/0/2/0/18 | 79 | 15 | 21 | 0 | 0 | 31461 |
| forest | 1 | 3 | 5 | 90 | 90 | 22 | 18 | 5 | 12 | 19/121/6 | 2.4 | 13.5 | 12.9 | 3.4 | 4 |  | 198 | 70 | 13.9 | 3.3 | 0 (1) | 47/1/3/5/34 | 27 | 3.5 | 13 | 0 | 0 | 8162 |
| forest | 2 | 15 | 83 | 243 | 454 | 106 | 431 | 0 | 13 | 7/105/5 | 2.9 | 0 | 24.1 | 5.1 | 32 | 0.9 | 1554 | 168 | 30.4 | 4.9 | 0 (1) | 74/1/4/0/14 | 62 | 7.5 | 29 | 0 | 0 | 38202 |
| lakeland | 1 | 18 | 137 | 556 | 756 | 149 | 579 | 0 | 14 | 17/110/2 | 3.4 | 0 | 24.7 | 7.7 | 218 | 0.9 | 4547 | 237 | 32.8 | 5.5 | 0.8333333333333334 (6) | 79/0/1/0/18 | 82 | 9.7 | 33 | 6 | 0 | 76210 |
| lakeland | 2 | 8 | 57 | 511 | 779 | 136 | 393 | 0 | 13 | 10/51/8 | 3 | 0 | 24.8 | 6.5 | 39 | 0.8 | 4079 | 252 | 41.3 | 5.3 | 0 (2) | 79/0/3/0/16 | 74 | 9.3 | 45 | 0 | 0 | 44235 |
| highland | 1 | 31 | 176 | 187 | 213 | 46 | 298 | 0 | 14 | 5/15/0 | 3.4 | 26.2 | 18.6 | 9.9 | 138 | 1 | 400 | 178 | 25.1 | 3 | 0 (5) | 64/0/3/1/26 | 63 | 11.9 | 17 | 2 | 0 | 31500 |
| highland | 2 | 14 | 7 | 10 | 31 | 1 | 65 | 0 | 11 | 5/45/5 | 2.9 | 2 | 4.7 | 4.9 | 0 |  | 6 | 12 | 8.7 | 2 |  | 42/17/0/0/42 | 28 | 3.3 | 8 | 0 | 0 | 5348 |
| mean |  | 18.1 | 103.7 | 341.7 | 477.5 | 88.9 | 385.1 | 0.5 | 12.9 |  | 3.1 | 10.1 | 20.3 | 7.4 | 75.1 | 0.9 | 2365.9 | 188.6 | 29.5 | 4.4 |  |  | 64.5 | 8.8 | 25.7 | 1.1 | 0 | 42285 |

Year 100 mean 341.7 (139.7 before), hunger deaths 385.1 (140.7; there are many more people), 5 resettles (forest 1). Run time 42 s a world.


## Owner's request: a mayor and a hall, a shrine and a church

Each from a felt want, with a building that does the work:
- **The want of order** (`need.order`) grows each year with grudges held (ties at -0.5 or worse), households driven out by quarrels, and debts left unpaid beyond 15. When it is felt enough, and someone is trusted widely (friends with at least four people), the idea of a council comes.
- **The hall** (8 timber, 4 stone) is raised for it. Its trade is the elder's. The elder is whoever the most people count as a friend (age helps a little), not the handiest; a mayor is chosen whatever the larder, unlike other places of work. It is told: "... has been chosen to speak for the place, and sits in the hall to hear its quarrels: the first mayor."
- **While an elder sits in the hall:** grudges fade twice as fast, debts are forgiven by a fifth a year instead of a tenth, a household only leaves over a quarrel twice as bitter, and the want of order grows at a fifth of the rate.
- **The want of loss** (deaths, already felt) now also brings rites, and a shrine of standing stones and a kept fire. The newly bereaved mourn there, not at the fire, and grief eases 1.6 times faster while a shrine or church stands.
- **The church:** once masonry is known and more than six people are grieving at a time, a church (8 timber, 14 stone, three stages) is raised, and the shrine is taken down when it is finished.
- Both ideas name their building in `IDEA_VIA`. Code-drawn sprites: a long hall with a bell post, a ring of standing stones round a fire and a carved post, and a stone church with a tower and a cross.
- Descriptions now say "an elder", not "a elder".

Checks. New unit: plains 1 at year 60 has a finished hall with exactly one elder, a shrine or a church, and the first mayor told. In 80-year runs: valley 1 had a hall and a church by year 50, its first mayor at year 50, and its want of order at 5.6 (17.4 before the elder rule); plains 1 had its first mayor at year 51. Tests 519 passed, 0 failed; scenarios 23 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 32 | 172 | 691 | 691 | 134 | 423 | 0 | 16 | 21/115/5 | 3.1 | 20.9 | 26.9 | 7.4 | 104 | 1 | 5594 | 377 | 43.8 | 5.6 | 2.5 (4) | 76/0/2/0/18 | 76 | 9.5 | 37 | 3 | 0 | 72801 |
| valley | 2 | 8 | 73 | 610 | 800 | 158 | 332 | 0 | 16 | 8/79/0 | 3.5 | 0 | 27.3 | 7.1 | 82 | 0.9 | 3911 | 411 | 40.8 | 4.7 | 1 (4) | 76/0/3/0/19 | 84 | 7.6 | 33 | 0 | 0 | 71474 |
| plains | 1 | 34 | 195 | 395 | 539 | 105 | 496 | 0 | 14 | 16/192/6 | 3.2 | 21.3 | 23.3 | 9 | 100 | 0.8 | 6693 | 110 | 34.8 | 7.3 |  | 81/0/0/0/15 | 75 | 9.5 | 29 | 0 | 0 | 75391 |
| plains | 2 | 20 | 130 | 747 | 770 | 167 | 552 | 0 | 14 | 6/101/0 | 3.1 | 24.9 | 24.3 | 10.4 | 164 | 0.8 | 7441 | 243 | 35.3 | 5.4 |  | 78/0/1/0/17 | 92 | 10.4 | 49 | 0 | 0 | 64538 |
| forest | 1 | 3 | 5 | 51 | 51 | 14 | 18 | 5 | 12 | 4/114/0 | 2.3 | 13.5 | 13 | 3.4 | 5 |  | 93 | 65 | 14.6 | 4.2 |  | 49/0/2/0/42 | 22 | 3.1 | 9 | 0 | 0 | 7782 |
| forest | 2 | 12 | 72 | 307 | 427 | 122 | 352 | 0 | 15 | 5/147/0 | 2.8 | 0 | 25.1 | 5.3 | 63 | 0.9 | 1583 | 176 | 31.1 | 5.1 | 0 (3) | 77/0/3/0/16 | 66 | 6.7 | 33 | 0 | 0 | 45050 |
| lakeland | 1 | 18 | 137 | 563 | 686 | 149 | 537 | 0 | 16 | 18/57/1 | 3.3 | 0 | 26.4 | 7.9 | 101 | 0.8 | 5362 | 249 | 35.5 | 5.3 | 0.8 (5) | 74/0/1/0/23 | 81 | 8.6 | 37 | 4 | 0 | 81601 |
| lakeland | 2 | 8 | 57 | 481 | 501 | 103 | 291 | 0 | 14 | 20/97/5 | 3.1 | 0 | 22.9 | 6.2 | 53 | 0.9 | 7359 | 203 | 38 | 6.5 | 0 (1) | 72/0/1/1/24 | 68 | 5.9 | 37 | 0 | 0 | 38623 |
| highland | 1 | 31 | 153 | 192 | 212 | 47 | 268 | 0 | 16 | 6/53/0 | 3.7 | 27 | 19.6 | 10.2 | 74 | 1 | 390 | 196 | 25.4 | 3.1 | 0 (4) | 65/0/2/0/28 | 63 | 10.9 | 17 | 2 | 0 | 36927 |
| highland | 2 | 14 | 7 | 10 | 31 | 1 | 65 | 0 | 12 | 5/45/5 | 2.9 | 2 | 4.7 | 4.9 | 0 |  | 6 | 12 | 8.7 | 2 |  | 42/17/0/0/42 | 28 | 3.3 | 8 | 0 | 0 | 6008 |
| mean |  | 18 | 100.1 | 404.7 | 470.8 | 100 | 333.4 | 0.5 | 14.5 |  | 3.1 | 11 | 21.4 | 7.2 | 74.6 | 0.9 | 3843.2 | 204.2 | 30.8 | 4.9 |  |  | 65.5 | 7.6 | 28.9 | 0.9 | 0 | 50019.5 |

Year 100 mean 404.7 (341.7 before), hunger deaths 333.4 (385.1), 5 resettles (forest 1). A world now takes 50 s for 100 years.

## Owner's report: small things set out round houses in the wrong places

The garden, woodpile, bench, planter and the generated furniture each had their own fixed place, half a tile from the house's middle, two of them behind it. A house is drawn standing up from its tile, so things beside or behind it were drawn into its walls or hidden under its roof, and things collided with each other. Now each house has five spots, in front of it and out beyond its sides (offsets from its middle: (1.25, 1.25), (1.45, 0.5), (0.5, 1.45), (1.5, -0.4), (-0.4, 1.5)). They are filled in order: garden, woodpile, bench, planter, then furniture. A spot on water, a street, a field or another building is passed over. Floors built upon a house set out nothing of their own. Crates also come to a household that has fields, not only one with a farmer or fisher by trade. View only: the simulation is unchanged (tests 519 passed, 0 failed). Checked by stills of two houses in valley 1 at year 40.

Measured for the owner's question about animals (not changed yet): in valley 1, plains 1, lakeland 1 and forest 2, deer fall from about 90 to 5-20 within 20 years and wolves from about 45 to 5. In valley 1's first 20 years 163 deer starved and 60 were eaten. The grass stays near 0.2 across the map, grazed short by 150-500 rabbits, and deer starve in the first winters. Kinds stay on the map only because a few wander in from the edge. Tried and reverted:
- fewer wolves: no help;
- letting deer browse grown trees freely: 18 000 deer by year 14;
- browse that costs the tree a little: deer last longer in woods but still starve out by year 50 to 60, the woods thin, and valley 1 held 113 people at year 60 against about 326.

This needs its own balancing step.


## Owner's request: animals fear other kinds, hide in the woods, and live longer

- A frightened animal with no hole to bolt to runs away and into cover. Of eight places a few steps off on the far side from the hunter or the noise of people, it takes the one with most cover (woods count most, long grass a little).
- When looking for a better place to eat, wild prey weigh cover, more so once something has frightened them; browsers weigh woods too.
- The timid big ones (deer) keep away from where people live: within 10 tiles of the fire, plus a little more as the place grows, a place counts against them. Without this, deer that now survived browsed every sapling round the village. In valley 1 no tree grew back within reach, a house waited for timber from day 210, and most people slept without a roof (29 died of cold and hunger).
- In the woods deer eat leaves and twigs of grown trees, a little at a time, at a little cost to the tree (0.1 of what they eat), so a herd under the trees does not starve in winter.
- The wild keep off a sown field while the crop stands (it is watched and its edges walked). Without this, the surviving deer grazed the crops and plains 1 held 16 people at year 60 against 374.
- Hunters already catch less in cover.

Measured over 60 years, rabbits/deer/wolves at years 10, 20, 40 and 60. Before:
- valley 1: deer 12, 6, 5, 4, and no wolves for 20 years;
- plains 1: deer 4, 0, 7, 0;
- lakeland 1: deer 0, 10, 9, 16;
- forest 2: deer 14, 7, 14, 6.

After:
- valley 1: deer 48, 45, 48, 46;
- plains 1 (few trees): deer 19, 10, 6, 5;
- lakeland 1: deer 69, 57, 55, 42;
- forest 2: deer 238, 273, 233, 170.

Wolves keep 0 to 7 throughout. Tree cover falls in forest 2 (3465 to 2399 over 60 years), elsewhere it holds. Things tried and dropped on the way are in the entry above.

Checks:
- New unit: at year 30, deer number 10 or more in at least 3 of 4 worlds, and where they do, they stand in more cover than the land's average.
- Two older units depended on one world's history (a well by year 40 in lakeland 1, a hall by year 60 in plains 1) and now look across four worlds.
- Tests 523 passed, 0 failed; scenarios 24 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 80 | 459 | 647 | 98 | 472 | 0 | 15 | 26/78/5 | 3.4 | 14.4 | 25.4 | 7.1 | 32 | 1 | 3502 | 273 | 40.2 | 6.2 |  | 72/0/2/0/23 | 67 | 9.4 | 29 | 3 | 0 | 52238 |
| valley | 2 | 30 | 191 | 809 | 856 | 184 | 763 | 0 | 15 | 7/94/5 | 3.3 | 0 | 26.5 | 8.4 | 204 | 0.8 | 6500 | 485 | 37.5 | 4.6 | 0.625 (8) | 76/0/1/0/18 | 92 | 9.1 | 37 | 0 | 0 | 118641 |
| plains | 1 | 22 | 126 | 678 | 679 | 99 | 485 | 0 | 15 | 14/133/5 | 3.1 | 20.2 | 23.7 | 10 | 82 | 0.9 | 4659 | 132 | 34.8 | 5.2 |  | 73/0/0/0/22 | 68 | 10.5 | 29 | 0 | 0 | 59568 |
| plains | 2 | 3 | 27 | 889 | 889 | 146 | 7 | 1 | 15 | 0/208/2 | 3.4 | 2.4 | 22 | 7.8 | 26 | 1 | 6168 | 219 | 22.4 | 4.9 |  | 72/0/2/0/24 | 89 | 9.7 | 29 | 0 | 0 | 28793 |
| forest | 1 | 34 | 224 | 564 | 690 | 163 | 664 | 0 | 16 | 61/82/0 | 3.4 | 17.2 | 26.6 | 7.7 | 100 | 0.9 | 6057 | 315 | 38.1 | 5.9 | 5.8 (5) | 77/0/3/0/17 | 72 | 11 | 37 | 0 | 0 | 102783 |
| forest | 2 | 14 | 70 | 931 | 931 | 206 | 198 | 0 | 16 | 53/29/6 | 3 | 0 | 26.9 | 6.5 | 38 | 0.8 | 8373 | 248 | 41.6 | 5.3 | 0.8571428571428571 (7) | 75/0/3/1/16 | 89 | 8.9 | 53 | 0 | 0 | 72922 |
| lakeland | 1 | 14 | 104 | 758 | 1096 | 168 | 747 | 0 | 17 | 21/62/5 | 3.3 | 0 | 26.2 | 8 | 121 | 0.8 | 8128 | 259 | 37.1 | 5.1 | 6 (3) | 73/0/1/0/23 | 91 | 9.4 | 41 | 6 | 0 | 98359 |
| lakeland | 2 | 23 | 160 | 882 | 1193 | 156 | 652 | 0 | 16 | 8/32/5 | 3.5 | 0 | 27 | 7.8 | 72 | 0.6 | 9376 | 239 | 39.1 | 6 | 1 (1) | 72/0/2/0/22 | 84 | 10.3 | 53 | 0 | 0 | 92571 |
| highland | 1 | 30 | 158 | 127 | 178 | 48 | 222 | 0 | 16 | 5/23/5 | 3.4 | 22.5 | 20.3 | 9.9 | 67 | 1 | 972 | 168 | 23.4 | 3.4 | 0 (3) | 59/0/3/0/36 | 62 | 12.4 | 17 | 1 | 0 | 25725 |
| highland | 2 | 7 | 19 | 154 | 154 | 27 | 38 | 0 | 16 | 9/110/11 | 2.8 | 13.9 | 14.5 | 5.8 | 4 |  | 219 | 126 | 34.4 | 10.8 | 0 (1) | 63/0/4/3/22 | 31 | 8.2 | 13 | 0 | 0 | 9944 |
| mean |  | 20.5 | 115.9 | 625.1 | 731.3 | 129.5 | 424.8 | 0.1 | 15.7 |  | 3.3 | 9.1 | 23.9 | 7.9 | 74.6 | 0.9 | 5395.4 | 246.4 | 34.9 | 5.7 |  |  | 74.5 | 9.9 | 33.8 | 1 | 0 | 66154.4 |

Year 100 mean 625.1 (404.7 before): with deer to hunt and crops left standing, places grow larger still. Hunger deaths 424.8, 1 resettle (plains 2). A world takes 66 s for 100 years.


## Owner's request: cattle and milk, winter hunting, tired of the same food

Art: three Retro Diffusion images, $0.15 in all (standing, grazing, lying; $9.18 of the $10 cap now spent). From them, in code, the cow's strips in the deer's layout (walk: front and back legs swung in turn; graze: the head nodding; lie) and a calf at 0.62 of the size. Code-drawn: a dairy (whitewashed, a churn and a pail).

Simulation:
- **Wild cattle (`cow`):** a herd grazer, 7 heavy, hardy in the cold, 10 per 1600 tiles at the start. They crop close (a big mouth otherwise could not eat grass shorter than 0.25, and they starved within a year).
- **Taming:** a hunting party that comes within two tiles of a wild calf may bring it home alive. A grazer's orphan straying near the camp is taken in too. Either teaches herding, and then the pen.
- **Milk:** each working day at the pen the herder milks the grown tame cows (a quarter a cow) into the common store. Milk (`milk`) keeps very badly.
- **Cheese:** once 20 have been milked and food is going bad, cheese is worked out and a dairy raised. Its dairymaid presses two of milk into one of cheese, which keeps almost as well as grain. Both are new foods, so they add to a varied larder.
- **The herder** feeds beasts from the people's store only when it holds more than two rations a head; otherwise hay. A herded herd grazes within 10 tiles of the pen.
- **Hunting in the lean months:** from harvest to sowing, where farming is known, there is a ration a head put by, and meat is under 5% of the food held, the able go hunting. That includes those with a trade, unless it is kept at a place of work. Such a party looks out past the ground the game keeps clear of and keeps after its quarry a second day. Ordinary hunts keep their old short range.
  - A first version also counted the years before farming as "lean". The whole small band then hunted far instead of gathering and starved by year 4. Fixed.
- **Wolves:** they now go for a person only when starving. Healthier wolves had begun taking the children of small early bands.
- **Rabbits:** they keep off the ground within three tiles of any building and dig no burrow there (the streets were full of them), and a camp avoids a den strongly.
- **Tired of the same food:** a household whose larder is nearly all one kind loses contentment, and its people are described as "Tired of eating the same thing every day."

Results over 80 years at size 96:
- A calf was caught in 5 of 6 worlds.
- Lakeland 1 kept 34 tame cows and got 5% of its food from milk and cheese; plains 1 milked 936 times; plains 2 milked 994 times and made cheese.
- Wild cattle live on in every world (9 to 53 head at year 80).
- Meat stays small (0.1 to 0.4% of food): the game lives far off and the places are large.

Checks:
- New unit: wild cattle live on, and some place milks its cattle and has a dairy making cheese within 80 years.
- Rewritten to stop depending on one world's history: the bad-harvest price test now takes half of all grain held and checks that grain is dearer by the next season in at least 3 of 4 worlds. The pen test uses worlds with people at year 6. The strike test uses a world with hands to fetch, and needs the timber.
- Tests 522 passed, 0 failed; scenarios 21 passed.

Size 96, seeds 1 and 2:

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 3 | 36 | 347 | 434 | 69 | 252 | 2 | 15 | 6/156/1 | 2.9 | 0 | 21.1 | 6.7 | 10 | 1 | 1609 | 190 | 26.8 | 4.8 | 15 (1) | 77/0/1/0/20 | 61 | 5.8 | 29 | 0 | 0 | 38452 |
| valley | 2 | 23 | 146 | 742 | 1072 | 230 | 848 | 0 | 17 | 5/38/4 | 3.5 | 0 | 28.7 | 9.3 | 262 | 0.9 | 14523 | 646 | 24.5 | 5.1 | 0 (1) | 78/0/2/0/17 | 96 | 10.4 | 37 | 0 | 0 | 138660 |
| plains | 1 | 28 | 186 | 459 | 869 | 100 | 958 | 0 | 17 | 32/128/6 | 3.9 | 5 | 21.9 | 11.8 | 166 | 0.9 | 2637 | 93 | 25.3 | 4.6 |  | 75/1/1/0/22 | 68 | 11.2 | 29 | 0 | 0 | 75981 |
| plains | 2 | 24 | 162 | 742 | 1384 | 185 | 1218 | 0 | 15 | 1/81/2 | 3.6 | 26.3 | 24 | 10.3 | 205 | 0.8 | 19864 | 167 | 37.2 | 6.4 |  | 72/0/1/0/25 | 92 | 10.3 | 45 | 0 | 0 | 144484 |
| forest | 1 | 15 | 100 | 639 | 782 | 127 | 552 | 0 | 18 | 48/49/5 | 3.4 | 4.4 | 25.4 | 6.7 | 83 | 0.7 | 3119 | 218 | 27.1 | 4.9 |  | 76/0/2/0/19 | 71 | 9.9 | 41 | 0 | 0 | 65025 |
| forest | 2 | 22 | 156 | 968 | 968 | 176 | 715 | 0 | 16 | 33/87/1 | 3.1 | 0 | 26.5 | 6.8 | 146 | 0.9 | 8601 | 284 | 40.6 | 5.7 | 1.5 (2) | 74/0/1/0/23 | 89 | 6.3 | 45 | 0 | 0 | 112433 |
| lakeland | 1 | 38 | 233 | 948 | 949 | 149 | 554 | 0 | 18 | 4/95/4 | 3.3 | 0 | 25.2 | 8.1 | 204 | 0.8 | 5915 | 153 | 31.5 | 5.1 |  | 74/0/1/0/19 | 85 | 11.5 | 41 | 5 | 0 | 83375 |
| lakeland | 2 | 27 | 197 | 617 | 1057 | 151 | 985 | 0 | 18 | 15/84/12 | 3.4 | 0 | 24.9 | 7.7 | 107 | 0.7 | 6140 | 235 | 39.2 | 5.7 | 2.142857142857143 (7) | 79/0/0/0/19 | 77 | 8.5 | 53 | 0 | 0 | 100392 |
| highland | 1 | 11 | 83 | 138 | 188 | 50 | 202 | 0 | 19 | 4/15/6 | 3.2 | 24.2 | 24.4 | 9.5 | 46 | 1.1 | 391 | 184 | 29.3 | 3.7 | 0 (5) | 61/2/2/0/31 | 54 | 13.8 | 17 | 0 | 0 | 23546 |
| highland | 2 | 14 | 90 | 149 | 278 | 74 | 255 | 1 | 19 | 0/37/0 | 3.5 | 0 | 22.4 | 10 | 68 | 1 | 988 | 195 | 29 | 2.7 | 0 (3) | 71/1/4/0/20 | 63 | 11.3 | 30 | 1 | 0 | 27704 |
| mean |  | 20.5 | 138.9 | 574.9 | 798.1 | 131.1 | 653.9 | 0.3 | 17.2 |  | 3.4 | 6 | 24.5 | 8.7 | 129.7 | 0.9 | 6378.7 | 236.5 | 31.1 | 4.9 |  |  | 75.6 | 9.9 | 36.7 | 0.6 | 0 | 81005.2 |

Year 100 mean 574.9 (625.1 before), hunger deaths 653.9, 2 resettles. A world takes 81 s for 100 years.

## Cows redrawn

The first cow pictures had holes (background removal cut out the white patches) and a white smear on the grazing pose. Redrawn: three new pictures made on a flat magenta ground and keyed out by colour, so the white hide stays. Strips rebuilt from them (walk 8, graze 6, lie 6; calves at 0.62). Art cost $0.15 more, $9.33 of the $10 cap spent. No change to the simulation; the table matches the last one.

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 3 | 36 | 347 | 434 | 69 | 252 | 2 | 15 | 6/156/1 | 2.9 | 0 | 21.1 | 6.7 | 10 | 1 | 1609 | 190 | 26.8 | 4.8 | 15 (1) | 77/0/1/0/20 | 61 | 5.8 | 29 | 0 | 0 | 55407 |
| valley | 2 | 23 | 146 | 742 | 1072 | 230 | 848 | 0 | 17 | 5/38/4 | 3.5 | 0 | 28.7 | 9.3 | 262 | 0.9 | 14523 | 646 | 24.5 | 5.1 | 0 (1) | 78/0/2/0/17 | 96 | 10.4 | 37 | 0 | 0 | 203691 |
| plains | 1 | 28 | 186 | 459 | 869 | 100 | 958 | 0 | 17 | 32/128/6 | 3.9 | 5 | 21.9 | 11.8 | 166 | 0.9 | 2637 | 93 | 25.3 | 4.6 |  | 75/1/1/0/22 | 68 | 11.2 | 29 | 0 | 0 | 122116 |
| plains | 2 | 24 | 162 | 742 | 1384 | 185 | 1218 | 0 | 15 | 1/81/2 | 3.6 | 26.3 | 24 | 10.3 | 205 | 0.8 | 19864 | 167 | 37.2 | 6.4 |  | 72/0/1/0/25 | 92 | 10.3 | 45 | 0 | 0 | 229027 |
| forest | 1 | 15 | 100 | 639 | 782 | 127 | 552 | 0 | 18 | 48/49/5 | 3.4 | 4.4 | 25.4 | 6.7 | 83 | 0.7 | 3119 | 218 | 27.1 | 4.9 |  | 76/0/2/0/19 | 71 | 9.9 | 41 | 0 | 0 | 99438 |
| forest | 2 | 22 | 156 | 968 | 968 | 176 | 715 | 0 | 16 | 33/87/1 | 3.1 | 0 | 26.5 | 6.8 | 146 | 0.9 | 8601 | 284 | 40.6 | 5.7 | 1.5 (2) | 74/0/1/0/23 | 89 | 6.3 | 45 | 0 | 0 | 186166 |
| lakeland | 1 | 38 | 233 | 948 | 949 | 149 | 554 | 0 | 18 | 4/95/4 | 3.3 | 0 | 25.2 | 8.1 | 204 | 0.8 | 5915 | 153 | 31.5 | 5.1 |  | 74/0/1/0/19 | 85 | 11.5 | 41 | 5 | 0 | 136835 |
| lakeland | 2 | 27 | 197 | 617 | 1057 | 151 | 985 | 0 | 18 | 15/84/12 | 3.4 | 0 | 24.9 | 7.7 | 107 | 0.7 | 6140 | 235 | 39.2 | 5.7 | 2.142857142857143 (7) | 79/0/0/0/19 | 77 | 8.5 | 53 | 0 | 0 | 167130 |
| highland | 1 | 11 | 83 | 138 | 188 | 50 | 202 | 0 | 19 | 4/15/6 | 3.2 | 24.2 | 24.4 | 9.5 | 46 | 1.1 | 391 | 184 | 29.3 | 3.7 | 0 (5) | 61/2/2/0/31 | 54 | 13.8 | 17 | 0 | 0 | 42001 |
| highland | 2 | 14 | 90 | 149 | 278 | 74 | 255 | 1 | 19 | 0/37/0 | 3.5 | 0 | 22.4 | 10 | 68 | 1 | 988 | 195 | 29 | 2.7 | 0 (3) | 71/1/4/0/20 | 63 | 11.3 | 30 | 1 | 0 | 52287 |
| mean |  | 20.5 | 138.9 | 574.9 | 798.1 | 131.1 | 653.9 | 0.3 | 17.2 |  | 3.4 | 6 | 24.5 | 8.7 | 129.7 | 0.9 | 6378.7 | 236.5 | 31.1 | 4.9 |  |  | 75.6 | 9.9 | 36.7 | 0.6 | 0 | 129409.8 |

Tests 522 passed, 0 failed. Game loads with a clean console; cows checked in lakeland 1 at year 25 (8 tame cows by the pen).

## Lean years: no more mass famines

The 654 hunger deaths per run were famines, not a trickle: a village grew for 10 to 15 years on a full store, the store drained, and hundreds starved in one or two years (plains 2: 506 in years 80 and 81). Four causes added:

- **Births follow the store, not its size.** A couple counts the common store as plenty only while it is not lower than at this time last year. A full larder of their own still counts.
- **Rationing.** When the store is lower than a year ago and holds less than about a year's food, a meal from it fills only part way. Those rationed remember it as a lean time.
- **Sowing after lean years.** A household that went hungry or was rationed, or sees the store emptier than a year ago, sows more ground next spring (up to three times its old want, never more than its hands can work); after a year without either it lets a little go. Field lots are looked for up to 4 lots from the door (was 3).
- **The landless leave.** At sowing, a household that found no ground near its door after a lean year, or a couple with no roof who went short, leaves the valley with its small children to find land of its own. It is told in the log, is not a death and leaves no grave. This is the first half of J2: they leave the map for now; founding a hamlet on it comes with J1.

Rationing applies only once a place farms: in a foraging camp the store is a day's gathering, and rationing it starved the small 40-tile plains world (caught by the tests; fixed before this commit).

Results, 10 standard worlds: hunger deaths 654 to 7.6 per run; 807 people per run left instead (250 in highland 2 to 1,399 in valley 2); year 100 mean 575 to 807, peak 798 to 892. Leaving comes in waves after lean years (plains 2 lost about 470 in one spring in an earlier trial run).

Tests 526 passed, 0 failed. New test: a couple with no roof who went short leave at sowing with their small children; not counted as deaths; a fed household with fields stays; it is told. New table column: left.

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 21 | 154 | 498 | 764 | 129 | 6 | 1233 | 0 | 16 | 7/150/2 | 3.2 | 15.4 | 24.3 | 9.9 | 25 | 1.2 | 3908 | 373 | 25.7 | 3.8 | 0 (1) | 70/0/0/0/26 | 67 | 10.1 | 29 | 0 | 0 | 91787 |
| valley | 2 | 23 | 151 | 1054 | 1160 | 205 | 8 | 1399 | 0 | 16 | 0/25/5 | 3.7 | 0 | 26.8 | 10 | 30 | 1.1 | 11507 | 518 | 29.9 | 3.6 | 15.5 (4) | 74/0/1/0/21 | 97 | 10.8 | 37 | 0 | 0 | 171098 |
| plains | 1 | 27 | 170 | 677 | 867 | 105 | 6 | 873 | 0 | 15 | 7/240/7 | 3.9 | 5 | 23.5 | 9.9 | 39 | 0.9 | 3091 | 128 | 26 | 5.4 |  | 70/1/0/0/25 | 69 | 9 | 29 | 0 | 0 | 103823 |
| plains | 2 | 28 | 183 | 1578 | 1768 | 187 | 21 | 1200 | 0 | 18 | 6/18/3 | 3.8 | 27.5 | 26.4 | 9.1 | 26 | 1.5 | 19182 | 199 | 39.5 | 5.4 |  | 70/0/0/0/29 | 97 | 6.6 | 49 | 0 | 0 | 229469 |
| forest | 1 | 15 | 49 | 882 | 882 | 115 | 5 | 362 | 0 | 16 | 47/91/6 | 3.1 | 4.4 | 23.9 | 5.3 | 17 | 0.5 | 4724 | 263 | 27.6 | 5.1 |  | 66/0/2/0/30 | 60 | 5.5 | 45 | 0 | 0 | 65012 |
| forest | 2 | 19 | 100 | 1075 | 1109 | 195 | 9 | 846 | 0 | 15 | 45/26/6 | 3.3 | 0 | 25 | 7.6 | 23 | 1 | 9351 | 281 | 42.6 | 5 |  | 73/0/2/1/21 | 93 | 10.3 | 45 | 0 | 0 | 138471 |
| lakeland | 1 | 30 | 191 | 794 | 795 | 122 | 7 | 918 | 0 | 18 | 20/51/9 | 3.4 | 0 | 23.5 | 8.1 | 15 | 1 | 5296 | 146 | 31 | 5.1 |  | 76/1/0/0/21 | 80 | 6.5 | 37 | 1 | 0 | 99399 |
| lakeland | 2 | 30 | 149 | 1181 | 1186 | 145 | 6 | 662 | 0 | 19 | 10/0/5 | 3.2 | 0 | 24.5 | 5.7 | 35 | 1.8 | 8895 | 268 | 43.3 | 5.6 | 2.5 (2) | 71/0/1/0/28 | 86 | 5.2 | 53 | 0 | 0 | 121713 |
| highland | 1 | 12 | 96 | 176 | 217 | 38 | 6 | 328 | 0 | 17 | 1/26/6 | 3.6 | 23.8 | 23.1 | 10.5 | 1 | 1.2 | 278 | 153 | 23.7 | 3.8 | 0 (2) | 63/1/2/0/29 | 61 | 14.6 | 17 | 0 | 0 | 36276 |
| highland | 2 | 13 | 74 | 156 | 167 | 38 | 2 | 250 | 1 | 18 | 0/24/7 | 3.4 | 0 | 14.6 | 11.6 | 1 | 0.8 | 1560 | 131 | 19.4 | 3 | 0 (7) | 71/2/1/0/21 | 49 | 10 | 21 | 1 | 0 | 30532 |
| mean |  | 21.8 | 131.7 | 807.1 | 891.5 | 127.9 | 7.6 | 807.1 | 0.1 | 16.8 |  | 3.5 | 7.6 | 23.6 | 8.8 | 21.2 | 1.1 | 6779.2 | 246 | 30.9 | 4.6 |  |  | 75.9 | 8.9 | 36.2 | 0.2 | 0 | 108758 |

A world takes 109 s for 100 years (81 s before): the villages are larger at the end.

## Faster steps, smaller saves

No change to what happens: every world's history is the same. Checked three ways: the saved state of plains 2 after three more years from a year-75 save hashes the same before and after; every number in the table below is the same as the lean-years table except the time; a game saved and loaded again continues exactly as one that never stopped.

- The two path searches use a heap on flat typed arrays (same comparisons, same order) instead of a small array per entry; the full-map walk search marks open ground once and indexes neighbours directly.
- The path a person took within a step is filled in only when the view asks for it (`trailOf`); nothing in the simulation reads it.
- "Can I get home?" and "is that place on my side of the water?" are answered from a map of connected ground worked out at most once a step, not by a full search that fails across water.
- `homeSite()` uses an index of the sites checked against the list on every hit; the household round counts people per roof, and debts per household, once.
- Looking round from the spot one last looked from is skipped (what is known only grows).
- The save leaves out `byId`, a second copy of every creature, which restore already rebuilt from `agents`.

Plains 2 from its year-75 save (about 800 people): 3,632 to 1,872 ms per game year. Save 4.4 to 2.8 MB. 100-year world 109 s to 70 s. Tests 526 passed, 0 failed, in 285 s (386 s before). In the game at 48x with 818 people the calendar keeps its set pace (about 6 years a minute); the longest frame, when a step runs, was about half a second before this change.

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 21 | 154 | 498 | 764 | 129 | 6 | 1233 | 0 | 16 | 7/150/2 | 3.2 | 15.4 | 24.3 | 9.9 | 25 | 1.2 | 3908 | 373 | 25.7 | 3.8 | 0 (1) | 70/0/0/0/26 | 67 | 10.1 | 29 | 0 | 0 | 55273 |
| valley | 2 | 23 | 151 | 1054 | 1160 | 205 | 8 | 1399 | 0 | 16 | 0/25/5 | 3.7 | 0 | 26.8 | 10 | 30 | 1.1 | 11507 | 518 | 29.9 | 3.6 | 15.5 (4) | 74/0/1/0/21 | 97 | 10.8 | 37 | 0 | 0 | 101969 |
| plains | 1 | 27 | 170 | 677 | 867 | 105 | 6 | 873 | 0 | 15 | 7/240/7 | 3.9 | 5 | 23.5 | 9.9 | 39 | 0.9 | 3091 | 128 | 26 | 5.4 |  | 70/1/0/0/25 | 69 | 9 | 29 | 0 | 0 | 72405 |
| plains | 2 | 28 | 183 | 1578 | 1768 | 187 | 21 | 1200 | 0 | 18 | 6/18/3 | 3.8 | 27.5 | 26.4 | 9.1 | 26 | 1.5 | 19182 | 199 | 39.5 | 5.4 |  | 70/0/0/0/29 | 97 | 6.6 | 49 | 0 | 0 | 141557 |
| forest | 1 | 15 | 49 | 882 | 882 | 115 | 5 | 362 | 0 | 16 | 47/91/6 | 3.1 | 4.4 | 23.9 | 5.3 | 17 | 0.5 | 4724 | 263 | 27.6 | 5.1 |  | 66/0/2/0/30 | 60 | 5.5 | 45 | 0 | 0 | 46349 |
| forest | 2 | 19 | 100 | 1075 | 1109 | 195 | 9 | 846 | 0 | 15 | 45/26/6 | 3.3 | 0 | 25 | 7.6 | 23 | 1 | 9351 | 281 | 42.6 | 5 |  | 73/0/2/1/21 | 93 | 10.3 | 45 | 0 | 0 | 89475 |
| lakeland | 1 | 30 | 191 | 794 | 795 | 122 | 7 | 918 | 0 | 18 | 20/51/9 | 3.4 | 0 | 23.5 | 8.1 | 15 | 1 | 5296 | 146 | 31 | 5.1 |  | 76/1/0/0/21 | 80 | 6.5 | 37 | 1 | 0 | 69527 |
| lakeland | 2 | 30 | 149 | 1181 | 1186 | 145 | 6 | 662 | 0 | 19 | 10/0/5 | 3.2 | 0 | 24.5 | 5.7 | 35 | 1.8 | 8895 | 268 | 43.3 | 5.6 | 2.5 (2) | 71/0/1/0/28 | 86 | 5.2 | 53 | 0 | 0 | 77718 |
| highland | 1 | 12 | 96 | 176 | 217 | 38 | 6 | 328 | 0 | 17 | 1/26/6 | 3.6 | 23.8 | 23.1 | 10.5 | 1 | 1.2 | 278 | 153 | 23.7 | 3.8 | 0 (2) | 63/1/2/0/29 | 61 | 14.6 | 17 | 0 | 0 | 24470 |
| highland | 2 | 13 | 74 | 156 | 167 | 38 | 2 | 250 | 1 | 18 | 0/24/7 | 3.4 | 0 | 14.6 | 11.6 | 1 | 0.8 | 1560 | 131 | 19.4 | 3 | 0 (7) | 71/2/1/0/21 | 49 | 10 | 21 | 1 | 0 | 19673 |
| mean |  | 21.8 | 131.7 | 807.1 | 891.5 | 127.9 | 7.6 | 807.1 | 0.1 | 16.8 |  | 3.5 | 7.6 | 23.6 | 8.8 | 21.2 | 1.1 | 6779.2 | 246 | 30.9 | 4.6 |  |  | 75.9 | 8.9 | 36.2 | 0.2 | 0 | 69841.6 |

## Leaving shown, seats worked out once

View only; the simulation and the table are unchanged (same as the table above).

- People who leave the valley take up a bundle (children walk beside them) and walk off by the nearest edge of the land, a step's walk at a time, and are let go once past it. Before, they vanished on the spot. Checked in plains 1 at year 25 with a forced leaving: the couple and a small child walked from 72,70 to 81,70 over three steps carrying bundles; the log tells it; console clean.
- Seats round the fire by friendship: each person's closest friend is found once per step, not inside every comparison of the sort (6% of a big village's frame time). Same seats.

Tests 526 passed, 0 failed.

## Two clocks, builders at the plot, herds and packs, crops and fences, wolves stronger than people (2026-11-25)

What changed:
- **Two clocks.** A tick is still the same stretch of a life, but the seasons turn up to 3 times slower (`yearK` 3 in the game; deep winter keeps its old length). A year is 48 ticks instead of 24. The table's "years" are life-years (2,400 ticks), about 50 years on the calendar. In a long summer the fields are sown again after a full harvest.
- **Builders at the plot.** Every stage takes work done on the spot. The view raises a building only while someone is at it.
- **Family size from causes.** The norm is learned from the mother and starts at 6. It moves 20% a generation toward 2 (3 where the place farms) plus what was seen of children dying.
- **Wolves and people.** Wolves take the weak and the lone. Three people (two once wolves are known) can kill one, but may lose one of their own. Kin hunt a killer.
- **Animals.** They start in herds, packs and warrens. Young stay with their mothers. Packs keep their own ground, and a crowded pack sends its young off to find new ground.
- **Crops.** Grazers eat unfenced crops. People chase them off or kill them, then fence their fields.
- **Fixes to old faults:**
  - One begun building that could not be supplied stopped all building in the place, which left dozens of households without a roof. Now such a plot is set aside for the day, and the last of a pile can finish a stage.
  - The hungry only walked to the store along paths of at most 80 steps of cost, so far households starved beside a full store. Now anyone who can reach the store on foot goes.
  - A household that went short and has less than half the ground it needs now leaves; before, only a household with no ground at all did.

How it compares with the last table ("Leaving shown, seats worked out once"):
- Mean population at year 100 is 953 (807 before), the peak 1,019 (892 before). The building fault had been holding towns back.
- Hunger deaths are 16.8 a run (7.6 before). Most come in late, crowded years, among households far from the fire.
- 310 leave a run (807 before).
- Plains seed 1 dies out twice early on (cold and hunger in the first years) and is still small at year 100.
- Wild animals are hunted down hard in big places: rabbits and wolves are near nothing at year 100 in most worlds.

Tests: 534 passed, 0 failed (one warning: plains seed 1's first dwelling stands in year 8).

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 32 | 158 | 1221 | 1252 | 297 | 14 | 559 | 0 | 17 | 5/0/0 | 2.6 | 0 | 28.9 | 5.2 | 149 | 1.1 | 25572 | 824 | 100.4 | 7.3 | 3 (7) | 85/0/0/1/12 | 100 | 8.9 | 69 | 2 | 0 | 145603 |
| valley | 2 | 35 | 169 | 1204 | 1378 | 340 | 21 | 831 | 0 | 16 | 1/0/0 | 2.8 | 0 | 31.5 | 5.5 | 143 | 1.2 | 33786 | 946 | 56.7 | 6.9 | 2.5 (8) | 81/0/0/1/15 | 100 | 7 | 96 | 0 | 0 | 196568 |
| plains | 1 | 6 | 2 | 17 | 17 | 4 | 8 | 0 | 2 | 10 | 0/150/5 | 2.3 | 16.6 | 11.1 | 4.2 | 0 | 1 | 30 | 12 | 33.6 | 5.6 |  | 75/2/0/0/21 | 16 | 3.5 | 9 | 0 | 0 | 11787 |
| plains | 2 | 24 | 93 | 1408 | 1419 | 339 | 7 | 20 | 0 | 17 | 5/0/0 | 2.6 | 0 | 31.7 | 6.1 | 72 | 0.9 | 42449 | 349 | 44.1 | 7.9 |  | 80/0/0/3/16 | 100 | 8 | 69 | 0 | 0 | 110691 |
| forest | 1 | 33 | 144 | 1233 | 1483 | 379 | 20 | 560 | 0 | 16 | 0/0/0 | 2.8 | 0 | 28.7 | 4.5 | 131 | 1.2 | 47043 | 750 | 67.6 | 9.9 | 0.4 (5) | 82/0/0/0/14 | 100 | 8.4 | 96 | 0 | 0 | 217800 |
| forest | 2 | 8 | 49 | 801 | 801 | 192 | 6 | 0 | 0 | 16 | 51/10/5 | 2.4 | 2 | 27.2 | 3.7 | 41 |  | 6058 | 264 | 62.6 | 6.5 |  | 83/0/0/3/13 | 69 | 5 | 53 | 0 | 0 | 61860 |
| lakeland | 1 | 20 | 104 | 1315 | 1354 | 327 | 12 | 87 | 0 | 19 | 5/1/0 | 2.8 | 15.3 | 31.2 | 4.8 | 96 | 1.5 | 37370 | 540 | 80.6 | 7.9 | 6.125 (8) | 80/0/0/3/16 | 100 | 8.4 | 96 | 6 | 0 | 139899 |
| lakeland | 2 | 22 | 108 | 1493 | 1501 | 343 | 16 | 14 | 0 | 17 | 7/0/0 | 2.7 | 0 | 31.8 | 4.5 | 37 | 1.5 | 406291 | 551 | 70 | 10.1 |  | 82/0/0/3/14 | 100 | 6.6 | 96 | 3 | 0 | 185636 |
| highland | 1 | 21 | 106 | 141 | 245 | 22 | 12 | 353 | 0 | 17 | 1/31/0 | 4.2 | 23.7 | 18.4 | 15.6 | 4 | 1.3 | 170 | 110 | 23.8 | 3.7 | 0 (9) | 74/2/0/0/23 | 79 | 14.2 | 13 | 0 | 0 | 27582 |
| highland | 2 | 35 | 167 | 698 | 736 | 178 | 52 | 675 | 0 | 17 | 6/6/0 | 3.1 | 14.7 | 24 | 9.4 | 70 | 1.1 | 8353 | 561 | 53.4 | 5.7 | 1.1363636363636365 (22) | 70/0/0/1/22 | 93 | 11.4 | 49 | 2 | 0 | 126741 |
| mean |  | 23.6 | 110 | 953.1 | 1018.6 | 242.1 | 16.8 | 309.9 | 0.2 | 16.2 |  | 2.8 | 7.2 | 26.5 | 6.4 | 74.3 | 1.2 | 60712.2 | 490.7 | 59.3 | 7.2 |  |  | 85.7 | 8.1 | 64.6 | 1.3 | 0 | 122416.7 |

## Children who get lost, timber in a tree, fields on dry ground (2026-11-25)

What changed (owner's report: a child stuck at a river bank, too much wood from a tree, fields with water in them):
- **Lost children.** People walking somewhere by straight steps (small children going back to the fire, anyone fleeing or chasing) used to treat a bridge as water, and pressed against a bank they could not cross. Now a bridge is ground, and a person whose straight way is shut by water works out the way round and follows it. Of 5 children set down across water from the fire, 2 never got back before; now all 5 do, in 1 to 58 steps.
- **Timber.**
  - A full stand of trees is now 4 timber, however it is felled. Skill and an axe fell faster but no longer multiply the wood; one person carries 2 a trip, 4 with a cart. Before, clearing a plot gave 12.5 to 25 for a stand, and a forest village had 287 timber stacked at year 10 with 5 buildings, and 1,095 by year 40.
  - Trees cleared for fields leave logs. A strike leaves a tree's own timber.
  - Hearths near the fire burn from the stack first.
  - Now the stack is used up, and timber trips into the woods start once the cleared ground's logs are gone.
- **Fields.** A field lot must be dry all across (up to three of its nine tiles could be water before). Ditches go round fields, always stepping nearer the field they water, and nothing is sown on a ditch.
- **Also fixed:** parents who leave the valley take their small children wherever they are; a calf caught in the crop is led home to be raised.

How it compares with the last table:
- Mean population at year 100 is 592 (953 before). Building now costs real trees, so places grow more slowly: 87.6 at year 50 (110 before).
- Hunger deaths 6.2 a run (16.8 before), 317 left (310).
- No resettling in the mean.

Tests: 534 passed, 0 failed (two warnings: plains seed 1 and highland seed 2 at 128 die out once early on).

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 31 | 127 | 1084 | 1086 | 235 | 7 | 529 | 0 | 18 | 5/0/0 | 2.8 | 25 | 28.2 | 9.1 | 92 | 0.9 | 19785 | 720 | 99.4 | 7.3 | 0.14285714285714285 (7) | 85/0/0/1/13 | 98 | 9.1 | 65 | 3 | 0 | 146122 |
| valley | 2 | 35 | 147 | 1088 | 1412 | 330 | 5 | 690 | 0 | 16 | 6/15/0 | 3.2 | 26.1 | 32 | 8 | 138 | 1.7 | 102262 | 936 | 55.5 | 6.1 | 0.5 (2) | 79/0/0/0/17 | 100 | 13.8 | 96 | 0 | 0 | 235503 |
| plains | 1 | 23 | 46 | 113 | 148 | 7 | 3 | 205 | 0 | 11 | 1/166/6 | 3.3 | 11.2 | 9.6 | 11.8 | 4 | 1.8 | 36 | 7 | 9.5 | 4.3 |  | 64/1/0/0/23 | 52 | 10.9 | 9 | 0 | 0 | 20702 |
| plains | 2 | 17 | 65 | 279 | 381 | 62 | 16 | 228 | 0 | 14 | 5/192/0 | 5.4 | 20.1 | 23 | 13.4 | 16 | 1.5 | 2805 | 122 | 33 | 4.3 |  | 46/1/0/22/31 | 73 | 9.6 | 25 | 0 | 0 | 43493 |
| forest | 1 | 27 | 120 | 778 | 1150 | 293 | 6 | 646 | 0 | 15 | 10/0/0 | 2.7 | 19.1 | 27.5 | 5.7 | 72 | 1.2 | 15539 | 533 | 59.2 | 8.2 | 0 (1) | 76/0/0/0/19 | 95 | 5.6 | 65 | 0 | 0 | 130768 |
| forest | 2 | 11 | 67 | 746 | 815 | 191 | 5 | 278 | 0 | 17 | 40/26/2 | 2.6 | 18.1 | 26 | 5.7 | 36 | 1.1 | 5048 | 274 | 62.7 | 5.8 | 0 (3) | 85/0/0/0/13 | 85 | 5.8 | 53 | 0 | 0 | 99861 |
| lakeland | 1 | 11 | 34 | 425 | 425 | 102 | 6 | 0 | 0 | 17 | 3/160/20 | 2.6 | 21.4 | 22.3 | 7.1 | 19 | 0.9 | 3706 | 204 | 35.8 | 5.5 | 2.6666666666666665 (3) | 75/0/0/5/17 | 66 | 10 | 41 | 0 | 0 | 36810 |
| lakeland | 2 | 17 | 85 | 1189 | 1320 | 316 | 7 | 139 | 0 | 18 | 5/2/0 | 2.8 | 24.1 | 30.9 | 6.7 | 34 | 1.5 | 27070 | 550 | 67.9 | 9.6 | 1.5 (2) | 80/0/0/3/15 | 100 | 6.8 | 96 | 3 | 0 | 154249 |
| highland | 1 | 33 | 61 | 75 | 87 | 7 | 2 | 221 | 0 | 15 | 11/47/0 | 3.6 | 21.8 | 25.4 | 20 | 1 | 1.5 | 92 | 46 | 25.4 | 4.3 | 0 (1) | 72/1/0/0/24 | 70 | 13.2 | 9 | 0 | 0 | 25032 |
| highland | 2 | 26 | 124 | 142 | 167 | 10 | 5 | 232 | 0 | 17 | 6/81/5 | 4 | 14.3 | 7.9 | 13.2 | 0 | 1 | 154 | 55 | 15.9 | 3.8 | 0 (1) | 76/0/0/0/21 | 34 | 14 | 13 | 0 | 0 | 34548 |
| mean |  | 23.1 | 87.6 | 591.9 | 699.1 | 155.3 | 6.2 | 316.8 | 0 | 15.8 |  | 3.3 | 20.1 | 23.3 | 10.1 | 41.2 | 1.3 | 17649.7 | 344.7 | 46.4 | 5.9 |  |  | 77.3 | 9.9 | 47.2 | 0.6 | 0 | 92708.8 |


## Bridges over a river bend (2026-11-25)

What changed (owner's report: a house built across the river, everyone walking round instead of bridging it):
- **Cause.** Lots on the same piece of ground were judged by the straight line to the fire, so a lot just over a stream bend looked close even when the walk round was 40 tiles. And a bridge could only be wanted between two pieces of land with no way between them at all, so a long walk round never made anyone want one.
- **Fix.** A lot is judged by the real walk. Narrow places between two banks of the same ground are now places a bridge can go. Each year a household whose daily walk to the fire goes far round the water feels the want of a crossing where it would cut that walk short; trips that go round add to it.
- **Checked.** 30 worlds (5 lands x 6 seeds, 15 years): homes whose walk goes far round water 18 -> 5. Valley seed 1 (the owner's map): the household that moved in at calendar year 8 had a bridge at the 1-tile narrows by year 12; their walk 37 -> 8 tiles. New unit: a home moved across a bend gets a bridge within 4 calendar years and the walk falls below 0.6 of what it was.
- Bridges per 100-year run: 0.6 -> 3.5. Valley seed 1 is smaller (1084 -> 400 at year 100, more left); the mean is up (592 -> 642).
- Test fixes: the "no way over without a bridge" check takes a narrow place between separate land; the H3 bad-harvest check now blights one calendar year (it was one life year, which under the long summer missed the harvest).

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 31 | 135 | 400 | 607 | 112 | 6 | 872 | 0 | 17 | 6/89/5 | 3.3 | 26 | 25.9 | 10.3 | 67 | 1.3 | 3414 | 285 | 30.2 | 4 |  | 80/0/0/0/17 | 93 | 12.6 | 33 | 10 | 0 | 58593 |
| valley | 2 | 34 | 161 | 1323 | 1340 | 295 | 4 | 552 | 0 | 17 | 0/1/4 | 3.1 | 26 | 31.3 | 8.8 | 96 | 1.2 | 30308 | 804 | 46.7 | 5.5 | 0 (3) | 83/0/0/0/15 | 100 | 14 | 96 | 2 | 0 | 196008 |
| plains | 1 | 23 | 46 | 113 | 148 | 7 | 3 | 205 | 0 | 11 | 1/166/6 | 3.3 | 11.2 | 9.6 | 11.8 | 4 | 1.8 | 36 | 7 | 9.5 | 4.3 |  | 64/1/0/0/23 | 52 | 10.9 | 9 | 0 | 0 | 18956 |
| plains | 2 | 22 | 97 | 522 | 836 | 75 | 12 | 500 | 0 | 18 | 0/60/0 | 4.6 | 24.5 | 24.5 | 13.3 | 24 | 1.5 | 2514 | 60 | 30.2 | 4.9 |  | 73/0/0/0/22 | 86 | 12.8 | 25 | 2 | 0 | 59243 |
| forest | 1 | 27 | 126 | 1402 | 1458 | 356 | 12 | 273 | 0 | 19 | 0/0/0 | 2.8 | 15.5 | 29.9 | 5.9 | 122 | 1.1 | 92008 | 514 | 63.6 | 8.2 | 0 (1) | 81/0/0/2/14 | 100 | 8.9 | 96 | 4 | 0 | 220001 |
| forest | 2 | 11 | 68 | 712 | 809 | 192 | 4 | 271 | 0 | 18 | 85/43/5 | 2.8 | 14.5 | 26.5 | 5.6 | 36 | 1.4 | 5653 | 229 | 62.5 | 5.3 |  | 81/0/0/0/15 | 82 | 5.7 | 49 | 2 | 0 | 61224 |
| lakeland | 1 | 11 | 37 | 404 | 404 | 93 | 5 | 0 | 0 | 16 | 16/103/0 | 2.6 | 22.4 | 25.2 | 6.2 | 14 | 0.9 | 3211 | 130 | 26.4 | 4.8 |  | 81/0/0/3/13 | 57 | 5.3 | 41 | 9 | 0 | 27863 |
| lakeland | 2 | 17 | 92 | 1323 | 1351 | 331 | 9 | 59 | 0 | 20 | 5/0/0 | 2.7 | 25.2 | 32.7 | 6.3 | 48 | 1.5 | 31341 | 415 | 73.6 | 8.6 | 11.666666666666666 (3) | 81/0/0/2/15 | 100 | 7.5 | 96 | 5 | 0 | 127010 |
| highland | 1 | 30 | 136 | 74 | 206 | 8 | 7 | 332 | 0 | 19 | 1/10/0 | 4 | 28.2 | 20.6 | 18.2 | 13 | 1.5 | 438 | 101 | 26.9 | 3.6 | 0 (4) | 74/0/0/0/24 | 73 | 13.4 | 17 | 0 | 0 | 30371 |
| highland | 2 | 26 | 117 | 148 | 198 | 20 | 4 | 364 | 0 | 18 | 0/27/5 | 3.5 | 19.7 | 12.5 | 12.4 | 14 | 1.2 | 205 | 101 | 16.5 | 3.7 | 0 (2) | 77/1/0/1/17 | 39 | 13 | 13 | 1 | 0 | 26329 |
| mean |  | 23.2 | 101.5 | 642.1 | 735.7 | 148.9 | 6.6 | 342.8 | 0 | 17.3 |  | 3.3 | 21.3 | 23.9 | 9.9 | 43.8 | 1.3 | 16912.8 | 264.6 | 38.6 | 5.3 |  |  | 78.2 | 10.4 | 47.5 | 3.5 | 0 | 82559.8 |


## Rabbits that do not boom and starve; snares; kept herds that live (2026-11-26)

What changed (owner's report: rabbits eat everything and then disappear; should people not hunt them?):
- **Cause.** A rabbit doe bred whenever her own belly was full, so in a good summer they multiplied far past what the grass could carry and then starved by the thousand in winter (plains 1: 40 -> 1128 in the first life-year; 15,000 rabbits starved in 40 years against 142 taken by people). The long summer made it worse: litters ran on the life clock, so one summer was three breeding seasons.
- **Fix.** A wild beast's time between litters runs on the season clock. A grazing mother bears young only where the grass on her ground (3 tiles for a rabbit, 8 for a deer, 10 for cattle) is at least the grazing need of the mouths already there plus her litter.
- **Snares.** Each morning a household with someone from eight years up takes small game within 12 tiles of its door, one beast in twenty a day. Plains 1: 594 rabbits snared over 40 years. Snared game is not counted as hunters' pay (counting it drew people into hunting).
- **Kept herds.** While checking cattle: a calf brought home grazed out its patch 8 tiles from the pen and starved beside 150 hay, because only a herder fed it, and only within 6 tiles of the pen. Now a thin beast walks back to the pen and is given hay there, herder or none, and a herded beast moves over the pasture. Each year the herd is cut, oldest first, to what the pasture and hay can carry; the slaughtered go to the store as meat. Plains 2 and valley 1: herds of 30 to 70, milk every year (before: 0 milked by year 80).
- **Checked.** Rabbits in plains 1 and valley 1 now swing under 2.5 times over in a typical year (3.8 before); rabbit starvation over 40 years 15,000 -> 1,500, old age now the main death. Over 12 worlds at year 60, snaring on vs off: 187 vs 182 people, larger in 8 of 12. New unit for rabbits (fails on the old code). H2, H4 and the cattle check try more worlds; the bank check counts a person standing on a bridge as reachable.

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 36 | 171 | 646 | 737 | 88 | 10 | 487 | 0 | 19 | 9/32/4 | 5.4 | 21.8 | 22.5 | 11.3 | 135 | 1.8 | 3310 | 246 | 28.8 | 3 |  | 74/0/0/0/22 | 95 | 13.7 | 29 | 6 | 0 | 71198 |
| valley | 2 | 30 | 118 | 1294 | 1298 | 308 | 13 | 217 | 0 | 19 | 5/4/0 | 3 | 27.7 | 29.8 | 7.1 | 84 | 1.2 | 26058 | 739 | 38.3 | 3.9 | 3.6666666666666665 (12) | 80/0/0/2/15 | 99 | 11.2 | 69 | 2 | 0 | 105474 |
| plains | 1 | 22 | 35 | 46 | 99 | 5 | 8 | 209 | 0 | 12 | 0/194/5 | 2.9 | 10.6 | 11.8 | 10.4 | 2 | 1.5 | 0 | 14 | 13.5 | 6.7 |  | 74/0/0/0/23 | 54 | 10.4 | 9 | 0 | 0 | 19695 |
| plains | 2 | 18 | 68 | 848 | 849 | 68 | 15 | 0 | 0 | 18 | 10/225/0 | 5.9 | 23.3 | 19.2 | 11 | 17 | 1 | 4458 | 73 | 24.2 | 4.3 |  | 68/0/0/0/30 | 87 | 14 | 21 | 2 | 0 | 53012 |
| forest | 1 | 24 | 56 | 818 | 819 | 198 | 10 | 20 | 0 | 17 | 29/31/0 | 2.9 | 11.2 | 28.3 | 5.7 | 11 | 1.3 | 8053 | 311 | 44.8 | 6.4 |  | 80/0/0/3/15 | 74 | 7.2 | 49 | 1 | 0 | 56421 |
| forest | 2 | 29 | 146 | 810 | 1447 | 354 | 6 | 937 | 0 | 18 | 1/5/4 | 3.1 | 14.1 | 30.4 | 6.4 | 134 | 1.3 | 22112 | 489 | 77.8 | 6.4 |  | 77/0/0/0/18 | 100 | 5.9 | 73 | 3 | 0 | 194791 |
| lakeland | 1 | 22 | 106 | 963 | 1217 | 246 | 7 | 540 | 0 | 17 | 6/2/0 | 3 | 27.4 | 29.9 | 8.3 | 116 | 1.6 | 26390 | 423 | 56.4 | 7 | 0 (4) | 78/0/0/0/18 | 99 | 13.6 | 85 | 13 | 0 | 119271 |
| lakeland | 2 | 35 | 184 | 1355 | 1619 | 327 | 22 | 963 | 0 | 18 | 5/0/0 | 3 | 28.4 | 31.6 | 8.4 | 110 | 1.3 | 232902 | 484 | 66.1 | 8.6 | 1 (1) | 83/0/0/0/14 | 100 | 13.8 | 96 | 5 | 0 | 341321 |
| highland | 1 | 28 | 71 | 103 | 127 | 7 | 4 | 245 | 0 | 17 | 0/31/7 | 4.2 | 21.6 | 14.4 | 19.3 | 3 | 1.5 | 53 | 57 | 16.9 | 4.3 | 0 (2) | 72/0/0/2/21 | 72 | 13.7 | 9 | 1 | 0 | 18456 |
| highland | 2 | 34 | 172 | 238 | 238 | 23 | 2 | 405 | 0 | 18 | 0/76/6 | 3.7 | 20.6 | 14 | 12.8 | 21 |  | 263 | 113 | 15.8 | 3.6 | 0 (4) | 80/1/0/0/16 | 41 | 14.1 | 17 | 1 | 0 | 29298 |
| mean |  | 27.8 | 112.7 | 712.1 | 845 | 162.4 | 9.7 | 402.3 | 0 | 17.3 |  | 3.7 | 20.7 | 23.2 | 10.1 | 63.3 | 1.4 | 32359.9 | 294.9 | 38.3 | 5.4 |  |  | 82.1 | 11.8 | 45.7 | 3.4 | 0 | 100893.7 |

## The Wood Age limit; a ledger; grass and water redrawn (2026-11-27)

What changed (owner's requests):
- **Wood Age.** The game and this table now create the world with `age: 'wood'`: metal tools, masonry and concrete are never worked out, so no smithy, mason's yard, lime kiln or church is built. This is a cap set by hand (listed under "Planned on purpose"). Field stone is still used for footings, the well and the shrine.
- **Ledger.** `W.ledger()` and a Ledger section in the Town panel count people, homes, buildings, food by kind, timber, stone, firewood, hay, pots, carts, kept and wild beasts, fields, ways, bridges, and faith (shrines, times mourned at one, people grieving).
- **Ground.** Grass has tufts and soft patches of tone; water has clean bands by depth, a broken ripple line off the shore and strokes of light. Nothing moves yet.
- **Checked.** tests.html: 536 passed, 0 failed (1 warning, 35 skipped). Against the table above (all ideas open): mean at year 100 falls from 712.1 to 601.5, ideas from 17.3 to 14.1. Without tools the largest worlds are smaller (valley 1: 646 -> 260; plains 2: 848 -> 253; lakeland 1: 963 -> 346) and three are larger (plains 1: 46 -> 110; forest 1: 818 -> 1005; lakeland 2: 1355 -> 1713). Lakeland 2 refused 1.5 million lots: crowding there needs looking at.
- **Not done.** Plains 1 and highland 1 are still small (110 and 28). Water and grass do not move.

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 33 | 138 | 260 | 501 | 63 | 2 | 696 | 0 | 14 | 18/54/10 | 3.7 | 22.8 | 20.2 | 9.4 | 46 | 1.8 | 1738 | 196 | 24.6 | 3.6 | 0 (1) | 77/0/0/0/18 | 85 | 9.2 | 25 | 7 | 0 | 33814 |
| valley | 2 | 31 | 115 | 1069 | 1083 | 250 | 9 | 417 | 0 | 14 | 0/1/0 | 3 | 27 | 30.1 | 7.8 | 76 | 1.2 | 17088 | 698 | 42.4 | 4.4 |  | 84/0/0/0/13 | 98 | 11.2 | 57 | 2 | 0 | 69585 |
| plains | 1 | 33 | 39 | 110 | 143 | 7 | 4 | 244 | 0 | 12 | 5/198/5 | 3.4 | 15.7 | 11.7 | 9.8 | 1 | 2.3 | 12 | 16 | 15.4 | 3.8 |  | 70/1/0/0/25 | 53 | 11.1 | 9 | 0 | 0 | 15075 |
| plains | 2 | 23 | 99 | 253 | 299 | 23 | 5 | 288 | 0 | 14 | 15/207/5 | 4.1 | 16 | 11.9 | 10.2 | 11 | 1.1 | 202 | 45 | 17.8 | 3.7 |  | 71/2/0/0/25 | 65 | 10.8 | 13 | 1 | 0 | 20986 |
| forest | 1 | 21 | 74 | 1005 | 1027 | 239 | 5 | 11 | 0 | 13 | 17/3/4 | 2.6 | 11.4 | 28.3 | 5 | 37 | 1.1 | 18463 | 461 | 54.5 | 7.3 | 0 (1) | 82/0/0/3/14 | 86 | 6.3 | 61 | 1 | 0 | 54249 |
| forest | 2 | 28 | 136 | 1092 | 1255 | 312 | 6 | 422 | 0 | 14 | 23/1/3 | 2.8 | 11.3 | 30.3 | 5.8 | 96 | 1.4 | 16988 | 438 | 73.1 | 6.1 |  | 85/0/0/0/13 | 98 | 6.1 | 69 | 2 | 0 | 90319 |
| lakeland | 1 | 35 | 162 | 346 | 797 | 84 | 24 | 768 | 0 | 17 | 23/97/5 | 4.2 | 23 | 25.9 | 9.1 | 115 | 0.8 | 2140 | 132 | 30.3 | 5.2 | 0 (1) | 75/0/0/0/19 | 72 | 9.7 | 37 | 8 | 0 | 45737 |
| lakeland | 2 | 35 | 147 | 1713 | 1753 | 352 | 11 | 118 | 0 | 17 | 1/0/0 | 3 | 27.1 | 31.4 | 7.6 | 125 | 1.2 | 1533289 | 264 | 66 | 5 | 3 (4) | 81/0/0/0/16 | 100 | 18.9 | 96 | 7 | 0 | 451255 |
| highland | 1 | 29 | 33 | 28 | 65 | 3 | 1 | 169 | 0 | 11 | 5/13/7 | 2.8 | 21.5 | 8.7 | 5 | 2 | 1.2 | 248 | 23 | 17.9 | 2.3 | 0 (2) | 71/15/0/0/14 | 53 | 10.2 | 9 | 0 | 0 | 9875 |
| highland | 2 | 37 | 50 | 139 | 221 | 24 | 4 | 333 | 0 | 15 | 5/57/8 | 3.4 | 21.5 | 12.3 | 12.6 | 10 |  | 190 | 98 | 17.5 | 3.7 | 0 (1) | 78/3/0/0/15 | 36 | 11 | 13 | 1 | 0 | 16982 |
| mean |  | 30.5 | 99.3 | 601.5 | 714.4 | 135.7 | 7.1 | 346.6 | 0 | 14.1 |  | 3.3 | 19.7 | 21.1 | 8.2 | 51.9 | 1.3 | 159035.8 | 237.1 | 35.9 | 4.5 |  |  | 74.6 | 10.5 | 38.9 | 2.9 | 0 | 80787.7 |

## The hand as the only power; the ground moves; small things set on free ground (2026-11-27)

What changed (owner's design):
- **The hand.** The Rain, Sun, Grow and Strike buttons are gone. The hand lifts and sets down anything: people, beasts, piles, a whole tree, a stone off bare rock, fire, a handful of water, a building (`G.pick`, `G.drop`). Stone set on stone strikes a spark; fire burns where it is put; water puts it out; a tree set in water is logs; a building lands on the nearest free lot. People within 8 tiles see it (`a.saw`; the ledger counts them).
- **Fire takes timber buildings**, with what was in them, and may leap to the next lot in dry weather.
- **The ground moves** (view only): light runs down the rivers toward where they leave the land; wind passes through the grass in bands.
- **Small things** (view only): nothing wild on fences, in yards or against fields; yard things, stalls and camp things only on free ground.
- **Checked.** tests.html: 537 passed, 0 failed (1 warning, 35 skipped), run before the two view-only changes. The table below is the same, number for number, as the Wood Age table above: a world the hand does not touch runs as before, and no fire reached a building in these ten runs. Misplaced things counted in two villages (plains 2 at year 30, valley 1 at year 45): 0 of 2,034 and 0 of 3,779. Movement: 60 frames a second zoomed in and out in a headless browser.
- **Not done.** People do not yet make anything of what they saw. Open water and bare rock need a short hold to lift. The old powers' drawing code is still in `src/view.js`, unreachable.

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 33 | 138 | 260 | 501 | 63 | 2 | 696 | 0 | 14 | 18/54/10 | 3.7 | 22.8 | 20.2 | 9.4 | 46 | 1.8 | 1738 | 196 | 24.6 | 3.6 | 0 (1) | 77/0/0/0/18 | 85 | 9.2 | 25 | 7 | 0 | 31527 |
| valley | 2 | 31 | 115 | 1069 | 1083 | 250 | 9 | 417 | 0 | 14 | 0/1/0 | 3 | 27 | 30.1 | 7.8 | 76 | 1.2 | 17088 | 698 | 42.4 | 4.4 |  | 84/0/0/0/13 | 98 | 11.2 | 57 | 2 | 0 | 67233 |
| plains | 1 | 33 | 39 | 110 | 143 | 7 | 4 | 244 | 0 | 12 | 5/198/5 | 3.4 | 15.7 | 11.7 | 9.8 | 1 | 2.3 | 12 | 16 | 15.4 | 3.8 |  | 70/1/0/0/25 | 53 | 11.1 | 9 | 0 | 0 | 14207 |
| plains | 2 | 23 | 99 | 253 | 299 | 23 | 5 | 288 | 0 | 14 | 15/207/5 | 4.1 | 16 | 11.9 | 10.2 | 11 | 1.1 | 202 | 45 | 17.8 | 3.7 |  | 71/2/0/0/25 | 65 | 10.8 | 13 | 1 | 0 | 19844 |
| forest | 1 | 21 | 74 | 1005 | 1027 | 239 | 5 | 11 | 0 | 13 | 17/3/4 | 2.6 | 11.4 | 28.3 | 5 | 37 | 1.1 | 18463 | 461 | 54.5 | 7.3 | 0 (1) | 82/0/0/3/14 | 86 | 6.3 | 61 | 1 | 0 | 52784 |
| forest | 2 | 28 | 136 | 1092 | 1255 | 312 | 6 | 422 | 0 | 14 | 23/1/3 | 2.8 | 11.3 | 30.3 | 5.8 | 96 | 1.4 | 16988 | 438 | 73.1 | 6.1 |  | 85/0/0/0/13 | 98 | 6.1 | 69 | 2 | 0 | 88664 |
| lakeland | 1 | 35 | 162 | 346 | 797 | 84 | 24 | 768 | 0 | 17 | 23/97/5 | 4.2 | 23 | 25.9 | 9.1 | 115 | 0.8 | 2140 | 132 | 30.3 | 5.2 | 0 (1) | 75/0/0/0/19 | 72 | 9.7 | 37 | 8 | 0 | 47368 |
| lakeland | 2 | 35 | 147 | 1713 | 1753 | 352 | 11 | 118 | 0 | 17 | 1/0/0 | 3 | 27.1 | 31.4 | 7.6 | 125 | 1.2 | 1533289 | 264 | 66 | 5 | 3 (4) | 81/0/0/0/16 | 100 | 18.9 | 96 | 7 | 0 | 449363 |
| highland | 1 | 29 | 33 | 28 | 65 | 3 | 1 | 169 | 0 | 11 | 5/13/7 | 2.8 | 21.5 | 8.7 | 5 | 2 | 1.2 | 248 | 23 | 17.9 | 2.3 | 0 (2) | 71/15/0/0/14 | 53 | 10.2 | 9 | 0 | 0 | 10253 |
| highland | 2 | 37 | 50 | 139 | 221 | 24 | 4 | 333 | 0 | 15 | 5/57/8 | 3.4 | 21.5 | 12.3 | 12.6 | 10 |  | 190 | 98 | 17.5 | 3.7 | 0 (1) | 78/3/0/0/15 | 36 | 11 | 13 | 1 | 0 | 17210 |
| mean |  | 30.5 | 99.3 | 601.5 | 714.4 | 135.7 | 7.1 | 346.6 | 0 | 14.1 |  | 3.3 | 19.7 | 21.1 | 8.2 | 51.9 | 1.3 | 159035.8 | 237.1 | 35.9 | 4.5 |  |  | 74.6 | 10.5 | 38.9 | 2.9 | 0 | 79845.3 |

## Timber reaches the sites; sickness and birth hold numbers down; signs over heads; slow devices (2026-11-27)

What changed (owner's report: by year 49 the map was full of houses and a phone could not keep up; a village that big so early is not how people spread):
- **Measured first.** Valley 1 over 60 years: 234 born, 13 died; the place doubled every ten years. Nobody died young.
- **Timber.** Villages that stayed tiny had no timber reaching their sites (plains 1: 135 timber trips in 70 years). Looking for timber now has its own reach; timber by the fire is not split for kindling while a building waits; timber round a river bend is a want for a bridge; woodcutters follow roofless households, not a head count.
- **Sickness and birth** (`docs/HEALTH.md`): fever from fouled, crowded ground, the youngest first; one birth in 12.5 loses the child; children borne from 10 to 30, three years apart.
- **View.** A small sign over each person for what they want most. The picture is drawn at most twice as fine as the screen, and less when frames come slowly; the moving ground is drawn lighter when zoomed out.
- **Checked.** tests.html: 534 passed, 0 failed (1 warning, 39 skipped). Seven checks that need a large place or children who all live now run on `demog: 'old'`; the grain-price check gives every holder grain before taking it. Against the table above: mean at year 50 falls from 99.3 to 31.3, at year 100 from 601.5 to 160.2; hunger deaths 7.1 to 3.2; left 346.6 to 4.5.
- **Not done / to watch.** The first decades are thin: 4 to 28 people at year 25, and plains 1 died out once and was resettled. Valley 2 and plains 1 are at 43 and 30 at year 100. Nothing yet answers sickness but building apart. On a phone the speed is not measured, only on a slowed desktop browser (about 30 frames a second at 326 people after the picture is coarsened; 19 before).

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 73 | 322 | 324 | 96 | 1 | 4 | 0 | 14 | 10/86/5 | 2.6 | 24.2 | 24 | 10.1 | 29 | 1.4 | 3328 | 261 | 21.7 | 3.8 |  | 69/0/0/6/20 | 74 | 4.5 | 29 | 14 | 0 | 25279 |
| valley | 2 | 10 | 9 | 43 | 44 | 14 | 1 | 0 | 0 | 11 | 4/91/7 | 2.3 | 12.5 | 10 | 4.8 | 19 | 1.5 | 39 | 59 | 15.4 | 2.6 | 2 (2) | 72/0/0/0/21 | 25 | 3 | 9 | 1 | 0 | 9725 |
| plains | 1 | 6 | 9 | 30 | 30 | 8 | 14 | 0 | 1 | 13 | 11/183/7 | 2.1 | 17.6 | 18.7 | 11.5 | 0 | 1.3 | 7 | 12 | 13.4 | 13.3 |  | 73/0/0/3/24 | 47 | 8.9 | 9 | 0 | 0 | 13545 |
| plains | 2 | 18 | 33 | 174 | 175 | 44 | 2 | 0 | 0 | 13 | 8/217/5 | 2.7 | 21.9 | 14.5 | 9.1 | 2 | 1 | 654 | 55 | 18.5 | 4.3 |  | 66/0/0/3/24 | 39 | 3.2 | 17 | 2 | 0 | 14490 |
| forest | 1 | 17 | 39 | 214 | 214 | 58 | 1 | 0 | 0 | 12 | 48/43/1 | 2.8 | 0 | 19.9 | 6.4 | 8 | 1.7 | 946 | 69 | 19.3 | 3.6 | 0 (1) | 70/0/0/1/23 | 42 | 3 | 25 | 1 | 0 | 15772 |
| forest | 2 | 12 | 27 | 201 | 201 | 53 | 2 | 0 | 0 | 13 | 20/92/9 | 2.4 | 14.8 | 17.8 | 6.2 | 12 | 0.7 | 1061 | 45 | 27.1 | 4.8 |  | 64/0/0/4/24 | 29 | 3 | 25 | 2 | 0 | 16371 |
| lakeland | 1 | 12 | 44 | 288 | 289 | 71 | 2 | 0 | 0 | 16 | 27/99/6 | 2.9 | 21.6 | 20.1 | 11.3 | 29 | 1.5 | 2383 | 79 | 18.6 | 3.3 | 1.6666666666666667 (3) | 70/0/0/3/24 | 62 | 11.7 | 37 | 9 | 0 | 21848 |
| lakeland | 2 | 6 | 21 | 182 | 182 | 46 | 3 | 0 | 0 | 14 | 16/71/6 | 2.5 | 27.8 | 20.8 | 7 | 0 | 1.5 | 798 | 27 | 29.3 | 2.8 |  | 58/0/0/6/30 | 39 | 3.3 | 29 | 2 | 0 | 16216 |
| highland | 1 | 16 | 43 | 76 | 91 | 9 | 1 | 41 | 0 | 12 | 1/45/5 | 3 | 27.9 | 13.5 | 16.6 | 3 |  | 285 | 73 | 17.5 | 2.8 | 0.6923076923076923 (13) | 74/0/0/2/21 | 58 | 6 | 13 | 2 | 0 | 13501 |
| highland | 2 | 4 | 15 | 72 | 73 | 19 | 5 | 0 | 0 | 12 | 7/44/6 | 2.8 | 18 | 10.7 | 11.8 | 2 |  | 154 | 88 | 11.2 | 4.2 | 0 (1) | 65/0/0/4/24 | 37 | 3.6 | 13 | 5 | 0 | 9101 |
| mean |  | 12.9 | 31.3 | 160.2 | 162.3 | 41.8 | 3.2 | 4.5 | 0.1 | 13 |  | 2.6 | 18.6 | 17 | 9.5 | 10.4 | 1.3 | 965.5 | 76.8 | 19.2 | 4.6 |  |  | 45.2 | 5 | 20.6 | 3.8 | 0 | 15584.8 |

## What people make of the hand (2026-11-27)

What changed: people near the hand at work come to believe someone is there; a want answered builds trust, harm builds fear; it is told at home; trusting believers are sooner comforted in grief; the ledger counts believers, trusting and fearful, and each person's description says where they stand. Witnesses show a heart, fear or a hand over their heads. The numbers are in `docs/ARCHITECTURE.md` under "Planned on purpose".
- **Checked.** tests.html: 535 passed, 0 failed (1 warning, 39 skipped), with a new check: nobody believes in an untouched world; someone fed four times ends with belief and trust over 0.5; a household whose roof is moved three times ends with trust down by more than 0.5; a housemate is told within four years. The table is the same, number for number, as the one above: a world the hand does not touch runs as before.
- **Not done.** Offerings, looking up, building toward the hand, the first question, faces.

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 73 | 322 | 324 | 96 | 1 | 4 | 0 | 14 | 10/86/5 | 2.6 | 24.2 | 24 | 10.1 | 29 | 1.4 | 3328 | 261 | 21.7 | 3.8 |  | 69/0/0/6/20 | 74 | 4.5 | 29 | 14 | 0 | 23820 |
| valley | 2 | 10 | 9 | 43 | 44 | 14 | 1 | 0 | 0 | 11 | 4/91/7 | 2.3 | 12.5 | 10 | 4.8 | 19 | 1.5 | 39 | 59 | 15.4 | 2.6 | 2 (2) | 72/0/0/0/21 | 25 | 3 | 9 | 1 | 0 | 9829 |
| plains | 1 | 6 | 9 | 30 | 30 | 8 | 14 | 0 | 1 | 13 | 11/183/7 | 2.1 | 17.6 | 18.7 | 11.5 | 0 | 1.3 | 7 | 12 | 13.4 | 13.3 |  | 73/0/0/3/24 | 47 | 8.9 | 9 | 0 | 0 | 13553 |
| plains | 2 | 18 | 33 | 174 | 175 | 44 | 2 | 0 | 0 | 13 | 8/217/5 | 2.7 | 21.9 | 14.5 | 9.1 | 2 | 1 | 654 | 55 | 18.5 | 4.3 |  | 66/0/0/3/24 | 39 | 3.2 | 17 | 2 | 0 | 15188 |
| forest | 1 | 17 | 39 | 214 | 214 | 58 | 1 | 0 | 0 | 12 | 48/43/1 | 2.8 | 0 | 19.9 | 6.4 | 8 | 1.7 | 946 | 69 | 19.3 | 3.6 | 0 (1) | 70/0/0/1/23 | 42 | 3 | 25 | 1 | 0 | 16038 |
| forest | 2 | 12 | 27 | 201 | 201 | 53 | 2 | 0 | 0 | 13 | 20/92/9 | 2.4 | 14.8 | 17.8 | 6.2 | 12 | 0.7 | 1061 | 45 | 27.1 | 4.8 |  | 64/0/0/4/24 | 29 | 3 | 25 | 2 | 0 | 15720 |
| lakeland | 1 | 12 | 44 | 288 | 289 | 71 | 2 | 0 | 0 | 16 | 27/99/6 | 2.9 | 21.6 | 20.1 | 11.3 | 29 | 1.5 | 2383 | 79 | 18.6 | 3.3 | 1.6666666666666667 (3) | 70/0/0/3/24 | 62 | 11.7 | 37 | 9 | 0 | 20799 |
| lakeland | 2 | 6 | 21 | 182 | 182 | 46 | 3 | 0 | 0 | 14 | 16/71/6 | 2.5 | 27.8 | 20.8 | 7 | 0 | 1.5 | 798 | 27 | 29.3 | 2.8 |  | 58/0/0/6/30 | 39 | 3.3 | 29 | 2 | 0 | 15599 |
| highland | 1 | 16 | 43 | 76 | 91 | 9 | 1 | 41 | 0 | 12 | 1/45/5 | 3 | 27.9 | 13.5 | 16.6 | 3 |  | 285 | 73 | 17.5 | 2.8 | 0.6923076923076923 (13) | 74/0/0/2/21 | 58 | 6 | 13 | 2 | 0 | 13198 |
| highland | 2 | 4 | 15 | 72 | 73 | 19 | 5 | 0 | 0 | 12 | 7/44/6 | 2.8 | 18 | 10.7 | 11.8 | 2 |  | 154 | 88 | 11.2 | 4.2 | 0 (1) | 65/0/0/4/24 | 37 | 3.6 | 13 | 5 | 0 | 8456 |
| mean |  | 12.9 | 31.3 | 160.2 | 162.3 | 41.8 | 3.2 | 4.5 | 0.1 | 13 |  | 2.6 | 18.6 | 17 | 9.5 | 10.4 | 1.3 | 965.5 | 76.8 | 19.2 | 4.6 |  |  | 45.2 | 5 | 20.6 | 3.8 | 0 | 15220 |

## The first question; offerings (2026-11-27)

What changed: the first grown person to be nearly sure someone is there goes to the fire, raises their arms and asks who. The view goes to them and a panel shows their face and words; the player may give a name, which is kept and told, or say nothing, and after three days they call it "the Hand". Believing households with food to spare leave some out by the shrine or the fire. The opening card explains the hand.
- **Checked.** tests.html: 536 passed, 0 failed (1 warning, 39 skipped), with a new check of the question, the answer, the wait and the offerings. In the game at phone size: the question was raised, a name typed and kept, console clean. The table is the same, number for number, as the two above.
- **Not done.** One question only; no decisions put to the player; the portrait is the map figure enlarged.

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 28 | 73 | 322 | 324 | 96 | 1 | 4 | 0 | 14 | 10/86/5 | 2.6 | 24.2 | 24 | 10.1 | 29 | 1.4 | 3328 | 261 | 21.7 | 3.8 |  | 69/0/0/6/20 | 74 | 4.5 | 29 | 14 | 0 | 25151 |
| valley | 2 | 10 | 9 | 43 | 44 | 14 | 1 | 0 | 0 | 11 | 4/91/7 | 2.3 | 12.5 | 10 | 4.8 | 19 | 1.5 | 39 | 59 | 15.4 | 2.6 | 2 (2) | 72/0/0/0/21 | 25 | 3 | 9 | 1 | 0 | 9664 |
| plains | 1 | 6 | 9 | 30 | 30 | 8 | 14 | 0 | 1 | 13 | 11/183/7 | 2.1 | 17.6 | 18.7 | 11.5 | 0 | 1.3 | 7 | 12 | 13.4 | 13.3 |  | 73/0/0/3/24 | 47 | 8.9 | 9 | 0 | 0 | 13216 |
| plains | 2 | 18 | 33 | 174 | 175 | 44 | 2 | 0 | 0 | 13 | 8/217/5 | 2.7 | 21.9 | 14.5 | 9.1 | 2 | 1 | 654 | 55 | 18.5 | 4.3 |  | 66/0/0/3/24 | 39 | 3.2 | 17 | 2 | 0 | 14833 |
| forest | 1 | 17 | 39 | 214 | 214 | 58 | 1 | 0 | 0 | 12 | 48/43/1 | 2.8 | 0 | 19.9 | 6.4 | 8 | 1.7 | 946 | 69 | 19.3 | 3.6 | 0 (1) | 70/0/0/1/23 | 42 | 3 | 25 | 1 | 0 | 16001 |
| forest | 2 | 12 | 27 | 201 | 201 | 53 | 2 | 0 | 0 | 13 | 20/92/9 | 2.4 | 14.8 | 17.8 | 6.2 | 12 | 0.7 | 1061 | 45 | 27.1 | 4.8 |  | 64/0/0/4/24 | 29 | 3 | 25 | 2 | 0 | 15350 |
| lakeland | 1 | 12 | 44 | 288 | 289 | 71 | 2 | 0 | 0 | 16 | 27/99/6 | 2.9 | 21.6 | 20.1 | 11.3 | 29 | 1.5 | 2383 | 79 | 18.6 | 3.3 | 1.6666666666666667 (3) | 70/0/0/3/24 | 62 | 11.7 | 37 | 9 | 0 | 20436 |
| lakeland | 2 | 6 | 21 | 182 | 182 | 46 | 3 | 0 | 0 | 14 | 16/71/6 | 2.5 | 27.8 | 20.8 | 7 | 0 | 1.5 | 798 | 27 | 29.3 | 2.8 |  | 58/0/0/6/30 | 39 | 3.3 | 29 | 2 | 0 | 15703 |
| highland | 1 | 16 | 43 | 76 | 91 | 9 | 1 | 41 | 0 | 12 | 1/45/5 | 3 | 27.9 | 13.5 | 16.6 | 3 |  | 285 | 73 | 17.5 | 2.8 | 0.6923076923076923 (13) | 74/0/0/2/21 | 58 | 6 | 13 | 2 | 0 | 13506 |
| highland | 2 | 4 | 15 | 72 | 73 | 19 | 5 | 0 | 0 | 12 | 7/44/6 | 2.8 | 18 | 10.7 | 11.8 | 2 |  | 154 | 88 | 11.2 | 4.2 | 0 (1) | 65/0/0/4/24 | 37 | 3.6 | 13 | 5 | 0 | 8974 |
| mean |  | 12.9 | 31.3 | 160.2 | 162.3 | 41.8 | 3.2 | 4.5 | 0.1 | 13 |  | 2.6 | 18.6 | 17 | 9.5 | 10.4 | 1.3 | 965.5 | 76.8 | 19.2 | 4.6 |  |  | 45.2 | 5 | 20.6 | 3.8 | 0 | 15283.4 |

## Later questions and counsel; people who differ; a founding band of eight (2026-11-27)

What changed: once a name is known, a believer brings the place's worst trouble to the player (flood, fever, vanishing trees) and the answer is kept as counsel that weighs in choices people already make. People differ in height, build and beard, inherited. The game and this table start with three couples and two children (`human: 6`). The view glides to the one who asks. Camp things, stalls and yard things no longer share a tile.
- **Checked.** tests.html: 537 passed, 0 failed (1 warning, 39 skipped), with a new check of the questions, the counsel and the silence. Against the table above (a family of four): year 25 mean 12.9 -> 13.8, year 50 31.3 -> 33.1, year 100 160.2 -> 156.6. The spread is narrower: nine worlds end between 109 and 297 (before: 30 to 322).
- **Not right.** Forest 2 dies out twice and ends with 4 people (with a family of four it reached 201). I have not found why; the band may eat out the camp's ground in the first winters. Valley 1 has 13 hunger deaths.
- **Not done.** Whether counsel turned out well is not remembered; no built answer to sickness.

| land | seed | y25 | y50 | y100 | peak | dwellings | hunger deaths | left | resettled | ideas | animals | food trip | timber trip | stone trip | wood trip | hungry by full | starved out/avg | lots refused | pit trips | pit dist | quarry/new | quarry/flooded | days: food/hunt/wood/build/home % | known % | reach | lot reach | bridges | homes across water | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valley | 1 | 11 | 26 | 109 | 109 | 32 | 13 | 0 | 0 | 11 | 17/163/7 | 2.4 | 17 | 17.2 | 5.5 | 5 | 1.2 | 1050 | 94 | 15.6 | 4.1 |  | 63/0/0/4/25 | 45 | 3 | 17 | 4 | 0 | 11876 |
| valley | 2 | 13 | 31 | 143 | 143 | 35 | 3 | 0 | 0 | 11 | 3/136/10 | 2.6 | 15.3 | 22 | 5.9 | 3 | 1 | 428 | 102 | 24.5 | 3.9 |  | 70/0/0/0/23 | 39 | 3 | 17 | 2 | 0 | 14328 |
| plains | 1 | 17 | 43 | 149 | 149 | 24 | 4 | 0 | 0 | 15 | 1/147/2 | 3.4 | 27.3 | 15.9 | 12.4 | 3 | 0.7 | 632 | 27 | 24.5 | 6.3 |  | 71/0/0/2/24 | 67 | 8 | 17 | 1 | 0 | 21348 |
| plains | 2 | 17 | 45 | 297 | 297 | 65 | 1 | 0 | 0 | 15 | 8/154/5 | 3 | 24.2 | 23.8 | 11.7 | 15 | 0.5 | 2762 | 69 | 27.6 | 4.6 |  | 70/0/0/3/23 | 70 | 4.5 | 25 | 3 | 0 | 20733 |
| forest | 1 | 14 | 26 | 112 | 112 | 33 | 2 | 0 | 0 | 12 | 24/100/9 | 2.8 | 15.5 | 14 | 6.3 | 6 | 1.2 | 2226 | 38 | 17.9 | 3 | 2.5 (2) | 63/0/0/5/23 | 42 | 3.1 | 21 | 1 | 0 | 13217 |
| forest | 2 | 3 | 1 | 4 | 8 | 1 | 6 | 0 | 2 | 3 | 52/111/0 | 2.1 | 3.8 | 11 | 2.6 | 0 | 0.8 | 7 | 11 | 25.7 | 4.6 |  | 92/6/0/0/3 | 5 | 3 | 8 | 0 | 0 | 8681 |
| lakeland | 1 | 13 | 39 | 190 | 190 | 55 | 3 | 0 | 0 | 17 | 8/154/9 | 3 | 21.3 | 20 | 11.2 | 25 | 0.5 | 1251 | 56 | 18.9 | 2.8 | 0 (4) | 64/0/0/2/26 | 52 | 9.7 | 29 | 8 | 0 | 17878 |
| lakeland | 2 | 15 | 31 | 199 | 199 | 60 | 2 | 0 | 0 | 15 | 17/159/0 | 2.5 | 23 | 24.6 | 6.6 | 6 | 1.3 | 2653 | 21 | 33.6 | 2.9 |  | 68/0/0/3/25 | 40 | 3.3 | 29 | 3 | 0 | 16452 |
| highland | 1 | 21 | 51 | 163 | 163 | 26 | 4 | 0 | 0 | 14 | 7/28/5 | 3 | 28.3 | 18.3 | 17.7 | 8 | 1.2 | 411 | 141 | 18.4 | 2.9 | 1.625 (8) | 78/0/0/0/18 | 65 | 9.5 | 17 | 2 | 0 | 16443 |
| highland | 2 | 14 | 38 | 200 | 200 | 36 | 8 | 18 | 0 | 17 | 0/71/5 | 3.7 | 25.4 | 13.9 | 16.1 | 15 | 1.1 | 940 | 141 | 15.7 | 4 | 0 (5) | 69/0/0/2/22 | 59 | 12.8 | 25 | 6 | 0 | 16188 |
| mean |  | 13.8 | 33.1 | 156.6 | 157 | 36.7 | 4.6 | 1.8 | 0.2 | 13 |  | 2.9 | 20.1 | 18.1 | 9.6 | 8.6 | 1 | 1236 | 70 | 22.2 | 3.9 |  |  | 48.4 | 6 | 20.5 | 3 | 0 | 15714.4 |
