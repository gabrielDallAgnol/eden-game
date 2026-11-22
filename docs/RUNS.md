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
