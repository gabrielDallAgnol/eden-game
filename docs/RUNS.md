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
