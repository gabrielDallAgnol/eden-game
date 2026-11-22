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
