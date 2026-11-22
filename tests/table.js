// The standard table: every step of docs/PLAN.md records this in docs/RUNS.md.
// Each world is run in slices so the page stays alive; the result is in window.EdenTable = { done, rows, markdown }.
(function () {
'use strict';
var q = new URLSearchParams(location.search);
var YEARS = +(q.get('years') || 100), SEEDS = (q.get('seeds') || '1,2').split(',').map(Number), LANDS = (q.get('lands') || 'valley,plains,forest,lakeland,highland').split(',');
var OPT = { resettle: true, startT: 0.3, dayCycle: 4, family: true };
// Columns: [heading, function(world, record) -> value]. Steps add their own columns here.
var hungerDeaths = function (S) { return (S.deaths['human:hunger'] || 0) + (S.deaths['human:cold and hunger'] || 0); };
var COLS = [
  ['land', function (W, r) { return r.land; }], ['seed', function (W, r) { return r.seed; }],
  ['y25', function (W, r) { return r.at[25]; }], ['y50', function (W, r) { return r.at[50]; }], ['y100', function (W, r) { return r.at[100]; }],
  ['peak', function (W, r) { return r.peak; }],
  ['dwellings', function (W) { return W.S.tribe.sites.filter(function (s) { return s.kind !== 'well' && (s.was || s.stage >= W.DWELL[s.kind].stages); }).length; }],
  ['hunger deaths', function (W) { return hungerDeaths(W.S); }],
  ['resettled', function (W, r) { return r.resettled; }],
  ['ideas', function (W) { return W.ideas().filter(function (i) { return i.known; }).length; }],
  ['animals', function (W) { var p = W.S.pop; return (p.deer || 0) + '/' + (p.rabbit || 0) + '/' + (p.wolf || 0); }],
  /* B1: mean length, along the ways, of a food trip from the door, and of timber and stone trips from the building plot */
  ['food trip', function (W) { var s = W.S.stat; return s ? s.forageD / Math.max(1, s.forageN) : ''; }],
  ['timber trip', function (W) { var s = W.S.stat; return s ? s.timberD / Math.max(1, s.timberN) : ''; }],
  ['stone trip', function (W) { var s = W.S.stat; return s ? s.stoneD / Math.max(1, s.stoneN) : ''; }],
  /* B2: mean length of a firewood trip from the hearth */
  ['wood trip', function (W) { var s = W.S.stat; return s && s.fuelN ? s.fuelD / s.fuelN : ''; }],
  /* B3: household-years in which a household with an empty larder had a neighbour (next lot) with a full one; and how far
     out the starved lived, against the average household (1 = no worse at the edge) */
  ['hungry by full', function (W, r) { return r.contrast || 0; }],
  ['starved out/avg', function (W) { var s = W.S.stat; return s && s.starveN ? s.starveD / Math.max(0.01, s.starveRef) : ''; }],
  /* water: bridges standing at year 100, and dwellings on another bank than the fire */
  /* B4: lots passed over because another household held the ground */
  ['lots refused', function (W) { return W.S.stat.lotsRefused || 0; }],
  /* B5: stone dug from pits, and the mean distance of the pits dug from the fire */
  ['pit trips', function (W) { return W.S.stat.pitN || 0; }],
  ['pit dist', function (W) { var s = W.S.stat; return s.pitN ? s.pitD / s.pitN : ''; }],
  /* B6: quarry trips per stone dwelling raised for the first time, and raised again after a flood */
  ['quarry/new', function (W) { var s = W.S.stat; return s.newN ? s.newTrips / s.newN : ''; }],
  ['quarry/flooded', function (W) { var s = W.S.stat; return s.reN ? s.reTrips / s.reN + ' (' + s.reN + ')' : ''; }],
  /* B8: what households' working days went to last year, summed over households (forage/hunt/wood/timber/stone/home), in % */
  ['days: food/hunt/wood/build/home %', function (W) { var t = {}, n = 0; W.S.tribe.sites.forEach(function (q) { if (!q.tripsLast) return; for (var k in q.tripsLast) { t[k] = (t[k] || 0) + q.tripsLast[k]; n += q.tripsLast[k]; } }); if (!n) return ''; var p = function (k) { return Math.round(100 * (t[k] || 0) / n); }; return p('forage') + '/' + p('hunt') + '/' + p('wood') + '/' + (p('timber') + p('stone') + p('build')) + '/' + p('home'); }],
  ['bridges', function (W) { return Object.keys(W.S.tribe.bridged || {}).length; }],
  ['homes across water', function (W) { if (!W.mass) return ''; var T = W.S.tribe, m = W.mass[T.y * W.N + T.x]; return T.sites.filter(function (q) { return q.kind !== 'well' && W.mass[q.y * W.N + q.x] !== m; }).length; }]
];
if (window.EdenTableExtra) COLS = COLS.concat(window.EdenTableExtra);
// optional per-step columns that need data gathered during the run: name -> { year(W, r), col: [heading, fn] }
var EXTRA = window.EdenTableTrack || [];
EXTRA.push({ year: function (W, r) {
  var homes = W.S.tribe.sites.filter(function (q) { return q.kind !== 'well' && q.members > 0; });
  homes.forEach(function (h) { if ((h.larder || 0) >= h.members * 0.25) return;
    if (homes.some(function (k) { return k !== h && Math.max(Math.abs(k.x - h.x), Math.abs(k.y - h.y)) <= W.PITCH && (k.larder || 0) > k.members * 1.5; })) r.contrast = (r.contrast || 0) + 1; });
} });
for (var e = 0; e < EXTRA.length; e++) if (EXTRA[e].col) COLS.push(EXTRA[e].col);
var jobs = []; LANDS.forEach(function (l) { SEEDS.forEach(function (s) { jobs.push({ land: l, seed: s }); }); });
var rows = [], at = 0, W = null, r = null, t0 = performance.now();
window.EdenTable = { done: false, rows: rows, markdown: '' };
function slice() {
  var end = performance.now() + 40;
  while (at < jobs.length && performance.now() < end) {
    if (!W) { var o = {}; for (var k in OPT) o[k] = OPT[k]; o.land = jobs[at].land; W = Eden.create(jobs[at].seed, o); r = { land: jobs[at].land, seed: jobs[at].seed, at: {}, peak: 0, resettled: 0, ticks: 0, logSeen: 0, ms: performance.now() }; }
    W.tick(); r.ticks++;
    var p = W.S.popPeople; if (p > r.peak) r.peak = p;
    for (; r.logSeen < W.S.log.length; r.logSeen++) if (/^Two strangers have come/.test(W.S.log[r.logSeen].text)) r.resettled++;
    if (r.ticks % W.TPY === 0) { var y = r.ticks / W.TPY; r.at[y] = p; for (var x = 0; x < EXTRA.length; x++) if (EXTRA[x].year) EXTRA[x].year(W, r, y); }
    if (r.ticks >= YEARS * W.TPY) {
      r.ms = Math.round(performance.now() - r.ms);
      rows.push(COLS.map(function (c) { try { var v = c[1](W, r); return typeof v === 'number' ? Math.round(v * 10) / 10 : v; } catch (err) { return 'err'; } }).concat([r.ms]));
      W = null; at++;
      document.getElementById('status').textContent = 'Done ' + at + ' of ' + jobs.length;
    }
  }
  if (at < jobs.length) return setTimeout(slice, 0);
  var head = COLS.map(function (c) { return c[0]; }).concat(['ms']);
  var md = '| ' + head.join(' | ') + ' |\n|' + head.map(function () { return '---'; }).join('|') + '|\n' + rows.map(function (x) { return '| ' + x.join(' | ') + ' |'; }).join('\n');
  // means for the numeric columns
  var mean = head.map(function (h, i) { if (i < 2) return i ? '' : 'mean'; var s = 0, n = 0; rows.forEach(function (x) { if (typeof x[i] === 'number') { s += x[i]; n++; } }); return n ? Math.round(s / n * 10) / 10 : ''; });
  md += '\n| ' + mean.join(' | ') + ' |';
  window.EdenTable.markdown = md; window.EdenTable.done = true;
  document.getElementById('md').textContent = md;
  document.getElementById('status').textContent = 'Done in ' + ((performance.now() - t0) / 1000).toFixed(1) + ' s';
}
setTimeout(slice, 0);
})();
