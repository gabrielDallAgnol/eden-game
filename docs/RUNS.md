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
