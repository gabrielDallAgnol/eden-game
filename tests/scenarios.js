// Scenarios: short named runs with an expectation each. These are the acceptance tests for later phases of docs/PLAN.md.
// A scenario sets the world up with the god powers (W.G), runs it, gathers numbers each year and states what should hold.
// Results land in window.EdenTests in the same shape as tests.html, so the same tools read both.
(function () {
'use strict';
var q = new URLSearchParams(location.search);
var SEEDS = (q.get('seeds') || '1,2').split(',').map(Number), ONLY = q.get('only');
var OPT = { resettle: true, startT: 0.3, dayCycle: 4, family: true };
var TPY = 24;
var hunger = function (S) { return (S.deaths['human:hunger'] || 0) + (S.deaths['human:cold and hunger'] || 0); };
var dwellings = function (W) { return W.S.tribe.sites.filter(function (s) { return s.kind !== 'well' && (s.was || s.stage >= W.DWELL[s.kind].stages); }).length; };
var mean = function (a) { return a.length ? a.reduce(function (p, v) { return p + v; }, 0) / a.length : 0; };
var r1 = function (v) { return Math.round(v * 100) / 100; };
// a scenario: { name, land, years, setup(W), year(W, rec, y), expect: [[text, kind, fn(rec, W) -> [ok, detail]]] }
var SCENARIOS = window.EdenScenarios = [
  { name: 'held30', title: 'held at 30 people', land: 'valley', years: 100,
    setup: function (W) { W.G.hold('human', 30); },
    year: function (W, r) { r.peak = Math.max(r.peak || 0, W.S.popPeople); },
    expect: [
      ['the lever holds: never more than 30 people', 'hard', function (r) { return [r.peak <= 30, 'peak ' + r.peak]; }],
      ['no lot has more than one dwelling', 'hard', function (r, W) { var seen = {}, bad = 0; W.S.tribe.sites.forEach(function (s) { var k = s.x + ',' + s.y; if (seen[k]) bad++; seen[k] = 1; }); return [!bad, bad + ' doubled lots']; }],
      ['people are still there at the end', 'soft', function (r, W) { return [W.S.popPeople > 0, W.S.popPeople + ' people']; }]
    ] },
  { name: 'deforest', title: 'every tree within 10 tiles felled in year 10', land: 'forest', years: 30,
    setup: function () {},
    tick: function (W, r) {
      /* B2: how often a hearth is lit while the air at its door is cold, year by year */
      var T = W.S.tribe, y = Math.floor(r.ticks / 24); if (!T.skills.fire) return; r.lit = r.lit || []; r.lit[y] = r.lit[y] || [0, 0];
      T.sites.forEach(function (h) { if (!h.members || h.kind === 'well' || W.tempAt(h.y * W.N + h.x) >= W.SPECIES.human.comfort - 3) return; r.lit[y][0]++; if (h.lit === W.S.tickNo) r.lit[y][1]++; });
    },
    year: function (W, r, y) {
      var T = W.S.tribe; r.cold = r.cold || []; r.cold[y] = T.need.cold;
      if (y === 10) { W.G.fell(T.x, T.y, 10); r.felledAt = y; }
    },
    expect: [
      ['the felled village feels colder within 2 years (need.cold rises)', 'soft', function (r) { var before = mean(r.cold.slice(8, 11)), after = mean(r.cold.slice(11, 13)); return [after > before, 'need.cold years 8-10 ' + r1(before) + ', years 11-12 ' + r1(after)]; }],
      ['hearths are lit less often once the wood round them is gone (B2)', 'soft', function (r) { var f = function (a, b) { var w = 0, l = 0; for (var y = a; y < b; y++) if (r.lit && r.lit[y]) { w += r.lit[y][0]; l += r.lit[y][1]; } return w ? l / w : 0; }; var before = f(7, 10), after = f(10, 13); return [after < before, 'lit when cold: years 7-9 ' + Math.round(before * 100) + '%, years 10-12 ' + Math.round(after * 100) + '%']; }],
      ['no extinction (people at the end)', 'soft', function (r, W) { return [W.S.popPeople > 0, W.S.popPeople + ' people, ' + hunger(W.S) + ' hunger deaths']; }]
    ] },
  { name: 'drought', title: 'permanent drought (a third of the usual rain)', land: 'valley', years: 50,
    setup: function (W) { W.G.drought(0.33); },
    year: function () {},
    expect: [
      ['people are still there at the end', 'soft', function (r, W) { return [W.S.popPeople > 0, W.S.popPeople + ' people, ' + hunger(W.S) + ' hunger deaths, ' + dwellings(W) + ' dwellings']; }]
    ] },
  { name: 'nowolves', title: 'wolves removed for good', land: 'valley', years: 50,
    setup: function (W) { W.G.ban('wolf'); },
    year: function () {},
    expect: [
      ['no wolf is ever alive again', 'hard', function (r, W) { return [!W.S.pop.wolf, (W.S.pop.wolf || 0) + ' wolves']; }],
      ['nobody is taken by a wolf', 'hard', function (r, W) { return [!W.S.deaths['human:eaten'], (W.S.deaths['human:eaten'] || 0) + ' taken']; }],
      ['no palisade is thought of (no danger felt)', 'soft', function (r, W) { return [!W.S.tribe.skills.palisade, 'palisade ' + !!W.S.tribe.skills.palisade]; }]
    ] },
  { name: 'nostone', title: 'no bare stone anywhere', land: 'highland', years: 60,
    setup: function (W) { W.G.noStone(); },
    year: function () {},
    expect: [
      ['dwellings are still raised', 'soft', function (r, W) { return [dwellings(W) > 0, dwellings(W) + ' dwellings, ' + W.S.tribe.stoneWork + ' stone trips, houses known ' + !!W.S.tribe.skills.house]; }]
    ] }
];
var jobs = []; SCENARIOS.forEach(function (sc) { if (ONLY && ONLY.split(',').indexOf(sc.name) < 0) return; SEEDS.forEach(function (seed) { jobs.push({ sc: sc, seed: seed }); }); });
var results = [], worlds = [], at = 0, W = null, rec = null, t0 = performance.now();
window.EdenTests = { done: false, results: results, worlds: worlds, summary: '' };
var body = document.getElementById('rows');
function row(r) { var tr = document.createElement('tr'); tr.className = r.status; [r.world, r.status.toUpperCase(), r.check + (r.kind === 'soft' ? ' (soft)' : ''), r.detail].forEach(function (t, i) { var td = document.createElement('td'); td.textContent = t; if (i === 1) td.className = 's'; if (i === 3) td.className = 'd'; tr.appendChild(td); }); body.appendChild(tr); }
function slice() {
  var end = performance.now() + 40;
  while (at < jobs.length && performance.now() < end) {
    var job = jobs[at], label = job.sc.name + ' ' + job.sc.land + ' #' + job.seed;
    try {
      if (!W) { var o = {}; for (var k in OPT) o[k] = OPT[k]; o.land = job.sc.land; W = Eden.create(job.seed, o); rec = { ticks: 0 }; job.sc.setup(W, rec); }
      W.tick(); rec.ticks++; if (job.sc.tick) job.sc.tick(W, rec);
      if (rec.ticks % TPY === 0) job.sc.year(W, rec, rec.ticks / TPY);
      if (rec.ticks >= job.sc.years * TPY) {
        job.sc.expect.forEach(function (e) { var out; try { out = e[2](rec, W); } catch (err) { out = [false, 'threw: ' + err.message]; }
          var r = { world: label, check: e[0], kind: e[1], status: out[0] ? 'pass' : e[1] === 'hard' ? 'fail' : 'warn', detail: out[1] }; results.push(r); row(r); });
        worlds.push({ world: label, summary: job.sc.title + ': ' + job.sc.years + ' years, ' + W.S.popPeople + ' people, ' + dwellings(W) + ' dwellings, ' + hunger(W.S) + ' hunger deaths' });
        W = null; at++;
      }
    } catch (err) { var r2 = { world: label, check: 'runs without error', kind: 'hard', status: 'fail', detail: String(err && err.stack || err).slice(0, 300) }; results.push(r2); row(r2); W = null; at++; }
  }
  if (at < jobs.length) return setTimeout(slice, 0);
  var t = { pass: 0, fail: 0, warn: 0 }; results.forEach(function (r) { t[r.status]++; });
  var line = t.pass + ' passed, ' + t.fail + ' failed, ' + t.warn + ' warnings, ' + ((performance.now() - t0) / 1000).toFixed(1) + ' s';
  window.EdenTests.summary = line; window.EdenTests.passed = t.pass; window.EdenTests.failed = t.fail; window.EdenTests.warnings = t.warn; window.EdenTests.done = true;
  document.getElementById('summary').textContent = line; document.title = (t.fail ? 'FAIL ' : 'OK ') + line;
}
setTimeout(slice, 0);
})();
