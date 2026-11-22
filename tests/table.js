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
  ['wood trip', function (W) { var s = W.S.stat; return s && s.fuelN ? s.fuelD / s.fuelN : ''; }]
];
if (window.EdenTableExtra) COLS = COLS.concat(window.EdenTableExtra);
// optional per-step columns that need data gathered during the run: name -> { year(W, r), col: [heading, fn] }
var EXTRA = window.EdenTableTrack || [];
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
