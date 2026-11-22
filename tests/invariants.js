// Eden invariants: fixed-seed worlds run for a number of years in the browser, checked every simulated year and at the end.
// Open tests.html (served over http, for example http://localhost:8765/tests.html). No Node, no libraries.
//
// The outcome is on the page, in document.title and in window.EdenTests = { done, passed, failed, warnings, skipped, results }.
// Each result is { world, land, seed, check, kind: 'hard' | 'soft', status: 'pass' | 'fail' | 'warn' | 'skip', detail }.
// A hard check that is broken is a failure. A soft check is an expectation about how a game usually goes; broken, it is a warning.
// A check whose fields do not exist in this version of the sim is reported as skipped.
(function () {
'use strict';

// ---------------------------------------------------------------- what to run (change here, or in the address: ?years=10&seeds=1,2&lands=valley,highland&det=0)
var CONFIG = {
  years: 40,                                   // simulated years per world
  seeds: [1, 2, 3],
  lands: ['valley', 'forest', 'plains'],       // any of: valley, plains, forest, lakeland, highland
  worldOptions: { resettle: true, startT: 0.3, dayCycle: 4, family: true },   // as the game creates its world; `land` is added per world
  determinism: true,                           // run every world a second time and compare the end state
  mustSurviveOn: ['valley', 'forest'],         // lands where people must not be gone for good
  survivalWindowYears: 5,                      // "not gone for good" = people seen at a yearly check within this many years of the end (resettling takes about 3)
  dwellingWithinYears: 5,                      // soft: a raised dwelling by this year
  sliceMs: 30,                                 // how long to simulate before giving the page back to the browser
  maxExamples: 3,                              // how many examples of a broken check to keep in the detail
  hardFieldMax: 1e6,                           // any land field beyond this (or below zero) is a failure
  // Land fields on the world object. [name, soft upper bound]: going over the soft bound is a warning, not a failure.
  fields: [['water', 1], ['tree', 1.5], ['grass', 1.5], ['field', 1], ['soil', 3], ['snow', 20], ['rock', 1.5],
           ['fruit', 1.5], ['fish', 1.5], ['flood', 1], ['burn', 100], ['bank', 1.5], ['fert', 1.5]],
  maxAgents: 5000,                             // soft: the agents array (living and dead) should not grow without limit
  maxLogLines: 20000                           // soft
};

(function readAddress() {
  try {
    var q = new URLSearchParams(location.search), v;
    if ((v = q.get('years')) && +v > 0) CONFIG.years = +v;
    if ((v = q.get('seeds'))) { var s = v.split(',').map(Number).filter(function (n) { return isFinite(n); }); if (s.length) CONFIG.seeds = s; }
    if ((v = q.get('lands'))) CONFIG.lands = v.split(',').filter(Boolean);
    if ((v = q.get('det')) !== null) CONFIG.determinism = v !== '0' && v !== 'false';
  } catch (e) { /* no address to read: keep the defaults */ }
})();

// ---------------------------------------------------------------- small helpers
var now = function () { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); };
var num = function (v) { return typeof v === 'number' && isFinite(v); };
var has = function (o, k) { return o !== null && o !== undefined && o[k] !== undefined; };
var isArr = function (a) { return Array.isArray(a); };
var isField = function (a) { return !!a && typeof a.length === 'number' && typeof a !== 'string' && (ArrayBuffer.isView(a) || isArr(a)); };
var show = function (v) { if (typeof v === 'number') return String(Math.round(v * 1000) / 1000); try { return JSON.stringify(v); } catch (e) { return String(v); } };
var who = function (a) { return (a.sp || 'creature') + (a.name ? ' ' + a.name : '') + (a.id !== undefined ? ' #' + a.id : ''); };

// One check for one world. It gathers what it saw over the whole run and gives one row at the end.
function Check(name, kind) { this.name = name; this.kind = kind || 'hard'; this.ran = 0; this.bad = 0; this.examples = []; this.skipWhy = ''; this.note = ''; }
Check.prototype.ok = function () { this.ran++; };
Check.prototype.fail = function (msg) { this.ran++; this.bad++; if (this.examples.length < CONFIG.maxExamples) this.examples.push(msg); };
Check.prototype.skip = function (why) { if (!this.skipWhy) this.skipWhy = why; };
Check.prototype.row = function () {
  var status, detail = '';
  if (this.bad) { status = this.kind === 'hard' ? 'fail' : 'warn'; detail = this.examples.join(' | ') + (this.bad > this.examples.length ? ' | and ' + (this.bad - this.examples.length) + ' more' : ''); }
  else if (!this.ran) { status = 'skip'; detail = this.skipWhy || 'never reached'; }
  else { status = 'pass'; detail = this.note; }
  return { check: this.name, kind: this.kind, status: status, detail: detail };
};

// ---------------------------------------------------------------- one world
function WorldRun(land, seed) {
  this.land = land; this.seed = seed; this.label = land + ' #' + seed;
  this.W = null; this.ticks = 0; this.year = 0; this.inYear = 0; this.phase = 'create'; this.aborted = '';
  this.W2 = null; this.ticks2 = 0;
  this.lastPeopleYear = -1; this.everPeople = false; this.gonePeopleYears = 0; this.firstDwellingYear = -1;
  this.startMs = 0; this.simMs = 0;
  var C = this.C = {}, self = this;
  var add = function (key, name, kind) { C[key] = new Check(name, kind); };
  add('run', 'create() and tick() throw no exception');
  add('clock', 'time moves forward: one tickNo per tick, S.t never goes back');
  add('inside', 'every living creature is on a whole tile inside the map');
  add('dry', 'no living creature stands on a water tile');
  add('agentNums', 'each creature\'s energy and age are finite, age is not negative');
  add('ids', 'no two living creatures share an id');
  add('pop', 'S.pop matches the living creatures, species by species');
  add('popPeople', 'S.popPeople matches the living people');
  add('siteDry', 'no building site is on water or outside the map');
  add('siteTile', 'no two building sites share a tile');
  add('siteNums', 'every site has a known kind and a finite, non-negative stage, wood and stone');
  add('stocks', 'store, wood and stone are finite and not negative');
  add('needs', 'every need value is finite');
  add('fields', 'land fields hold no NaN and stay within hard bounds');
  add('log', 'log lines are well formed, in time order, with no "undefined" or "NaN" in the text');
  add('deaths', 'death counts are whole and not negative');
  add('determinism', 'the same seed and land run twice end the same (population, log)');
  add('survive', 'people are not gone for good at the end');
  add('softNeeds', 'no need value is negative', 'soft');
  add('softFields', 'land fields stay in their usual range', 'soft');
  add('softDwelling', 'a dwelling stands within ' + CONFIG.dwellingWithinYears + ' years', 'soft');
  add('softNeverGone', 'people never died out (no resettling was needed)', 'soft');
  add('softAnimals', 'at least one kind of animal is alive at the end', 'soft');
  add('softGrowth', 'agents array and log stay a sane size', 'soft');
  this.guard = function (key, fn) { try { fn(C[key]); } catch (e) { C[key].fail('the check itself threw at year ' + self.year + ': ' + (e && e.message || e)); } };
}

WorldRun.prototype.options = function () { var o = {}, k; for (k in CONFIG.worldOptions) o[k] = CONFIG.worldOptions[k]; o.land = this.land; return o; };

WorldRun.prototype.living = function () {
  var S = this.W.S, by = {}, people = 0, n = 0, list = [];
  if (!S || !isArr(S.agents)) return null;
  for (var i = 0; i < S.agents.length; i++) { var a = S.agents[i]; if (!a || !a.alive) continue; list.push(a); n++; by[a.sp] = (by[a.sp] || 0) + 1; if (a.d && a.d.people) people++; }
  return { by: by, people: people, n: n, list: list };
};

// Advance by at most `budget` ms. Returns true when this world has nothing left to do.
WorldRun.prototype.step = function (deadline) {
  var self = this, C = this.C, t0 = now();
  if (this.phase === 'create') {
    this.startMs = t0;
    try {
      if (!window.Eden || typeof window.Eden.create !== 'function') throw new Error('window.Eden.create is missing: src/sim.js did not load');
      this.W = window.Eden.create(this.seed, this.options());
      if (!this.W || typeof this.W.tick !== 'function' || !this.W.S) throw new Error('create() did not return a world with tick() and S');
      if (this.W.land !== undefined && this.W.land !== this.land) throw new Error('asked for land "' + this.land + '" and got "' + this.W.land + '" (unknown land name?)');
      C.run.ok();
    } catch (e) { this.abort('create', e); this.phase = 'finish'; return false; }
    this.TPY = num(this.W.TPY) && this.W.TPY > 0 ? Math.round(this.W.TPY) : 24;
    this.yearly();                                                     // the world as it is made is checked too
    this.phase = 'run';
  }
  if (this.phase === 'run') {
    var W = this.W, S = W.S;
    while (this.year < CONFIG.years && now() < deadline) {
      var lastOfYear = this.inYear === this.TPY - 1, before = lastOfYear ? this.living() : null;
      var tn = S.tickNo, tt = S.t;
      try { W.tick(); } catch (e) { this.abort('tick ' + (this.ticks + 1) + ' (year ' + this.year + ')', e); this.phase = 'finish'; break; }
      this.ticks++; this.inYear++; C.run.ok();
      if (num(tn) && num(tt)) { if (S.tickNo !== tn + 1) C.clock.fail('tick ' + this.ticks + ': tickNo went from ' + tn + ' to ' + show(S.tickNo)); else if (!(S.t >= tt)) C.clock.fail('tick ' + this.ticks + ': S.t went from ' + show(tt) + ' to ' + show(S.t)); else C.clock.ok(); }
      else C.clock.skip('S.tickNo or S.t is not a number');
      if (lastOfYear) { this.inYear = 0; this.year++; this.popCheck(before); this.yearly(); }
    }
    if (this.phase === 'run' && this.year >= CONFIG.years) this.phase = CONFIG.determinism ? 'again' : 'finish';
  }
  if (this.phase === 'again') {
    if (!this.W2) { try { this.W2 = window.Eden.create(this.seed, this.options()); } catch (e) { C.determinism.fail('second create() threw: ' + (e && e.message || e)); this.phase = 'finish'; } }
    try { while (this.W2 && this.ticks2 < this.ticks && now() < deadline) { this.W2.tick(); this.ticks2++; } }
    catch (e) { C.determinism.fail('second run threw at tick ' + (this.ticks2 + 1) + ' where the first did not: ' + (e && e.message || e)); this.phase = 'finish'; }
    if (this.phase === 'again' && this.ticks2 >= this.ticks) { this.guard('determinism', function (c) { self.compare(c); }); this.phase = 'finish'; }
  }
  this.simMs += now() - t0;
  if (this.phase === 'finish') { this.finish(); this.phase = 'done'; }
  return this.phase === 'done';
};

WorldRun.prototype.abort = function (where, e) {
  this.aborted = where;
  var stack = e && e.stack ? String(e.stack).split('\n').slice(0, 3).join(' / ') : '';
  this.C.run.fail(where + ': ' + (e && e.message || e) + (stack ? '  [' + stack + ']' : ''));
};

// S.pop is counted inside tick(). Today it is counted at the start of the tick, so it equals the living creatures before the tick;
// a later version may count at the end. Either is accepted; anything else is a miscount.
WorldRun.prototype.popCheck = function (before) {
  var self = this, S = this.W.S, y = this.year;
  this.guard('pop', function (c) {
    var after = self.living();
    if (!before || !after) return c.skip('S.agents is missing');
    if (!S.pop || typeof S.pop !== 'object') return c.skip('S.pop is missing');
    var okB = true, okA = true, sp, seen = {};
    for (sp in S.pop) { seen[sp] = 1; if (S.pop[sp] !== (before.by[sp] || 0)) okB = false; if (S.pop[sp] !== (after.by[sp] || 0)) okA = false; }
    for (sp in after.by) if (!seen[sp]) { okA = false; okB = false; }
    if (okA || okB) c.ok(); else c.fail('year ' + y + ': S.pop ' + show(S.pop) + ', living before the tick ' + show(before.by) + ', after ' + show(after.by));
  });
  this.guard('popPeople', function (c) {
    var after = self.living();
    if (!before || !after) return c.skip('S.agents is missing');
    if (!num(S.popPeople)) return c.skip('S.popPeople is missing');
    if (S.popPeople === before.people || S.popPeople === after.people) c.ok(); else c.fail('year ' + y + ': S.popPeople ' + S.popPeople + ', living people before the tick ' + before.people + ', after ' + after.people);
  });
};

WorldRun.prototype.yearly = function () {
  var self = this, W = this.W, S = W.S, N = W.N, y = this.year, at = 'year ' + y + ': ';
  var water = isField(W.water) ? W.water : null, okN = num(N) && N > 0;
  var L = this.living(), T = S.tribe, sites = T && isArr(T.sites) ? T.sites : null;
  var inMap = function (x, y_) { return x >= 0 && y_ >= 0 && x < N && y_ < N; };
  var whole = function (v) { return num(v) && Math.floor(v) === v; };

  this.guard('inside', function (c) {
    if (!L) return c.skip('S.agents is missing'); if (!okN) return c.skip('W.N is missing');
    var bad = 0, ex = '';
    for (var i = 0; i < L.list.length; i++) { var a = L.list[i]; if (!whole(a.x) || !whole(a.y) || !inMap(a.x, a.y)) { bad++; if (!ex) ex = who(a) + ' at ' + show(a.x) + ',' + show(a.y); } }
    if (bad) c.fail(at + bad + ' off the map or between tiles, e.g. ' + ex); else c.ok();
  });
  this.guard('dry', function (c) {
    if (!L) return c.skip('S.agents is missing'); if (!okN || !water) return c.skip('W.N or W.water is missing');
    var bad = 0, ex = '';
    for (var i = 0; i < L.list.length; i++) { var a = L.list[i]; if (whole(a.x) && whole(a.y) && inMap(a.x, a.y) && water[a.y * N + a.x]) { bad++; if (!ex) ex = who(a) + ' at ' + a.x + ',' + a.y; } }
    if (bad) c.fail(at + bad + ' in the water, e.g. ' + ex); else c.ok();
  });
  this.guard('agentNums', function (c) {
    if (!L) return c.skip('S.agents is missing');
    var bad = 0, ex = '', checked = 0;
    for (var i = 0; i < L.list.length; i++) { var a = L.list[i], b = '';
      if (has(a, 'e')) { checked++; if (!num(a.e)) b = 'e=' + show(a.e); }
      if (has(a, 'age')) { checked++; if (!num(a.age) || a.age < 0) b = 'age=' + show(a.age); }
      if (b) { bad++; if (!ex) ex = who(a) + ' ' + b; } }
    if (bad) c.fail(at + bad + ' creatures, e.g. ' + ex); else if (checked || !L.n) c.ok(); else c.skip('agents have no e or age');
  });
  this.guard('ids', function (c) {
    if (!L) return c.skip('S.agents is missing'); if (L.n && !has(L.list[0], 'id')) return c.skip('agents have no id');
    var seen = {}, bad = 0, ex = '';
    for (var i = 0; i < L.list.length; i++) { var id = L.list[i].id; if (seen[id]) { bad++; if (!ex) ex = who(L.list[i]); } seen[id] = 1; }
    if (bad) c.fail(at + bad + ' repeated ids, e.g. ' + ex); else c.ok();
  });

  this.guard('siteDry', function (c) {
    if (!sites) return c.skip('S.tribe.sites is missing'); if (!okN || !water) return c.skip('W.N or W.water is missing');
    var bad = [];
    for (var i = 0; i < sites.length; i++) { var s = sites[i]; if (!whole(s.x) || !whole(s.y) || !inMap(s.x, s.y)) bad.push((s.kind || 'site') + ' off the map at ' + show(s.x) + ',' + show(s.y)); else if (water[s.y * N + s.x]) bad.push((s.kind || 'site') + ' on water at ' + s.x + ',' + s.y); }
    if (bad.length) c.fail(at + bad.slice(0, 2).join('; ')); else c.ok();
  });
  this.guard('siteTile', function (c) {
    if (!sites) return c.skip('S.tribe.sites is missing');
    var seen = {}, bad = [];
    for (var i = 0; i < sites.length; i++) { var s = sites[i], k = s.x + ',' + s.y; if (seen[k]) bad.push((s.kind || 'site') + ' and ' + seen[k] + ' both at ' + k); seen[k] = s.kind || 'site'; }
    if (bad.length) c.fail(at + bad.slice(0, 2).join('; ')); else c.ok();
  });
  this.guard('siteNums', function (c) {
    if (!sites) return c.skip('S.tribe.sites is missing');
    var bad = [], D = W.DWELL;
    for (var i = 0; i < sites.length; i++) { var s = sites[i], lab = (s.kind || 'site') + ' at ' + s.x + ',' + s.y + ': ';
      if (typeof s.kind !== 'string' || !s.kind) bad.push(lab + 'kind=' + show(s.kind));
      else if (D && typeof D === 'object' && !D[s.kind]) bad.push(lab + 'kind is not in DWELL');
      else if (D && D[s.kind] && num(D[s.kind].stages) && num(s.stage) && s.stage > D[s.kind].stages) bad.push(lab + 'stage ' + s.stage + ' of ' + D[s.kind].stages);
      var keys = ['stage', 'wood', 'stone'];
      for (var j = 0; j < keys.length; j++) if (has(s, keys[j]) && (!num(s[keys[j]]) || s[keys[j]] < 0)) bad.push(lab + keys[j] + '=' + show(s[keys[j]])); }
    if (bad.length) c.fail(at + bad.slice(0, 2).join('; ')); else c.ok();
  });
  if (sites && this.firstDwellingYear < 0) {
    try { for (var i = 0; i < sites.length; i++) { var s = sites[i]; if (s.kind !== 'well' && (s.stage >= 1 || s.was)) { this.firstDwellingYear = y; break; } } } catch (e) { /* soft */ }
  }

  this.guard('stocks', function (c) {
    if (!T) return c.skip('S.tribe is missing');
    var keys = ['store', 'wood', 'stone'], bad = [], n = 0;
    for (var j = 0; j < keys.length; j++) if (has(T, keys[j])) { n++; if (!num(T[keys[j]]) || T[keys[j]] < 0) bad.push(keys[j] + '=' + show(T[keys[j]])); }
    if (!n) return c.skip('S.tribe has no store, wood or stone');
    if (bad.length) c.fail(at + bad.join(', ')); else c.ok();
  });
  this.guard('needs', function (c) {
    if (!T || !T.need || typeof T.need !== 'object') return c.skip('S.tribe.need is missing');
    var bad = [], neg = [];
    for (var k in T.need) { if (!num(T.need[k])) bad.push(k + '=' + show(T.need[k])); else if (T.need[k] < 0) neg.push(k + '=' + show(T.need[k])); }
    if (bad.length) c.fail(at + bad.join(', ')); else c.ok();
    if (neg.length) self.C.softNeeds.fail(at + neg.join(', ')); else self.C.softNeeds.ok();
  });

  this.guard('fields', function (c) {
    var found = 0, bad = [], soft = [];
    for (var f = 0; f < CONFIG.fields.length; f++) {
      var name = CONFIG.fields[f][0], softMax = CONFIG.fields[f][1], a = W[name];
      if (!isField(a)) continue; found++;
      if (okN && a.length !== N * N) { bad.push(name + ' has ' + a.length + ' cells, the map has ' + N * N); continue; }
      var lo = Infinity, hi = -Infinity, nan = 0;
      for (var i = 0; i < a.length; i++) { var v = a[i]; if (v !== v) nan++; else { if (v < lo) lo = v; if (v > hi) hi = v; } }
      if (nan) bad.push(name + ' has ' + nan + ' NaN');
      else if (lo < -1e-6 || hi > CONFIG.hardFieldMax || hi === Infinity) bad.push(name + ' ranges ' + show(lo) + ' to ' + show(hi));
      else if (hi > softMax) soft.push(name + ' reaches ' + show(hi) + ' (usually up to ' + softMax + ')');
    }
    if (T && isField(T.road) && okN && T.road.length !== N * N) bad.push('tribe.road has ' + T.road.length + ' cells');
    if (!found) return c.skip('no land fields on the world object');
    if (bad.length) c.fail(at + bad.join('; ')); else c.ok();
    if (soft.length) self.C.softFields.fail(at + soft.join('; ')); else self.C.softFields.ok();
  });

  this.guard('log', function (c) {
    if (!isArr(S.log)) return c.skip('S.log is missing');
    var from = self.logSeen || 0, bad = [], prev = from > 0 && S.log[from - 1] ? S.log[from - 1].t : -Infinity;
    if (S.log.length < from) from = 0;                                  // a trimmed log is allowed; start over
    for (var i = from; i < S.log.length; i++) { var e = S.log[i];
      if (!e || typeof e.text !== 'string' || !e.text) { bad.push('line ' + i + ' has no text'); continue; }
      if (!num(e.t)) bad.push('line ' + i + ' has t=' + show(e.t)); else { if (e.t < prev - 1e-9) bad.push('line ' + i + ' is dated before the one above it'); prev = e.t; }
      if (/\bundefined\b|\bNaN\b|\[object /.test(e.text)) bad.push('"' + e.text.slice(0, 90) + '"'); }
    self.logSeen = S.log.length;
    if (bad.length) c.fail(at + bad.slice(0, 2).join('; ')); else c.ok();
  });
  this.guard('deaths', function (c) {
    if (!S.deaths || typeof S.deaths !== 'object') return c.skip('S.deaths is missing');
    var bad = [];
    for (var k in S.deaths) if (!whole(S.deaths[k]) || S.deaths[k] < 0) bad.push(k + '=' + show(S.deaths[k]));
    if (bad.length) c.fail(at + bad.slice(0, 3).join(', ')); else c.ok();
  });

  if (L) { if (L.people > 0) { this.lastPeopleYear = y; this.everPeople = true; } else this.gonePeopleYears++; }
};

WorldRun.prototype.endState = function (W) {
  var S = W.S, alive = 0, h = 0, i, j;
  if (isArr(S.agents)) for (i = 0; i < S.agents.length; i++) if (S.agents[i] && S.agents[i].alive) alive++;
  if (isArr(S.log)) for (i = 0; i < S.log.length; i++) { var t = String(S.log[i] && S.log[i].text); for (j = 0; j < t.length; j++) h = (h * 31 + t.charCodeAt(j)) | 0; }
  return { pop: show(S.pop), popPeople: S.popPeople, living: alive, logLines: isArr(S.log) ? S.log.length : undefined, logHash: h,
    store: S.tribe && num(S.tribe.store) ? S.tribe.store : undefined, sites: S.tribe && isArr(S.tribe.sites) ? S.tribe.sites.length : undefined };
};

WorldRun.prototype.compare = function (c) {
  var a = this.endState(this.W), b = this.endState(this.W2), diff = [];
  for (var k in a) if (a[k] !== b[k]) diff.push(k + ': ' + show(a[k]) + ' then ' + show(b[k]));
  if (diff.length) c.fail('after ' + this.ticks + ' ticks, ' + diff.join('; ')); else c.ok();
};

WorldRun.prototype.finish = function () {
  var self = this, C = this.C, W = this.W, y = this.year;
  var cut = this.aborted ? 'the run stopped at ' + this.aborted : '';
  if (W && W.S && !this.aborted) {
    this.guard('survive', function (c) {
      if (CONFIG.mustSurviveOn.indexOf(self.land) < 0) return c.skip('not required on ' + self.land + ' land');
      if (!isArr(W.S.agents)) return c.skip('S.agents is missing');
      if (CONFIG.years < CONFIG.survivalWindowYears) return c.skip('the run is shorter than ' + CONFIG.survivalWindowYears + ' years');
      if (self.lastPeopleYear >= y - CONFIG.survivalWindowYears) c.ok();
      else c.fail('no people at any yearly check since year ' + (self.lastPeopleYear < 0 ? 'the start' : self.lastPeopleYear) + ' (the run ended at year ' + y + ')');
    });
    this.guard('softDwelling', function (c) {
      if (!W.S.tribe || !isArr(W.S.tribe.sites)) return c.skip('S.tribe.sites is missing');
      if (CONFIG.years < CONFIG.dwellingWithinYears) return c.skip('the run is shorter than ' + CONFIG.dwellingWithinYears + ' years');
      if (self.firstDwellingYear >= 0 && self.firstDwellingYear <= CONFIG.dwellingWithinYears) { c.ok(); c.note = 'by year ' + self.firstDwellingYear; }
      else c.fail(self.firstDwellingYear < 0 ? 'no dwelling was raised in ' + y + ' years' : 'the first dwelling stood in year ' + self.firstDwellingYear);
    });
    this.guard('softNeverGone', function (c) {
      if (!isArr(W.S.agents)) return c.skip('S.agents is missing');
      if (self.gonePeopleYears) c.fail('no people at ' + self.gonePeopleYears + ' of ' + (y + 1) + ' yearly checks; last seen in year ' + self.lastPeopleYear); else c.ok();
    });
    this.guard('softAnimals', function (c) {
      var L = self.living(); if (!L) return c.skip('S.agents is missing');
      var kinds = []; for (var i = 0; i < L.list.length; i++) { var a = L.list[i]; if (!(a.d && a.d.people) && kinds.indexOf(a.sp) < 0) kinds.push(a.sp); }
      if (kinds.length) { c.ok(); c.note = kinds.join(', '); } else c.fail('no animal of any kind is alive in year ' + y);
    });
    this.guard('softGrowth', function (c) {
      var S = W.S, bad = [];
      if (isArr(S.agents) && S.agents.length > CONFIG.maxAgents) bad.push('S.agents holds ' + S.agents.length);
      if (isArr(S.log) && S.log.length > CONFIG.maxLogLines) bad.push('S.log holds ' + S.log.length + ' lines');
      if (bad.length) c.fail(bad.join('; ')); else c.ok();
    });
  }
  if (!CONFIG.determinism) C.determinism.skip('turned off (det=0)');
  var rows = [], S = W && W.S, L = W && S ? this.living() : null;
  this.summary = 'year ' + y + (S && num(S.t) ? ' (S.t ' + show(S.t) + ')' : '') + ', ' + this.ticks + ' ticks, ' + Math.round(this.simMs) + ' ms' +
    (L ? ', ' + L.people + ' people, ' + (L.n - L.people) + ' animals' : '') + (S && S.tribe && isArr(S.tribe.sites) ? ', ' + S.tribe.sites.length + ' sites' : '') + (S && isArr(S.log) ? ', ' + S.log.length + ' log lines' : '');
  for (var k in C) { var r = C[k].row(); if (r.status === 'skip' && cut && !C[k].skipWhy) r.detail = cut; r.world = this.label; r.land = this.land; r.seed = this.seed; rows.push(r); }
  this.rows = rows; this.W = null; this.W2 = null;                      // let the worlds go
};

// ---------------------------------------------------------------- the page
var $ = function (id) { return document.getElementById(id); };
var el = function (tag, text, cls) { var e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
var running = false, timer = 0;

function tally(results) { var t = { pass: 0, fail: 0, warn: 0, skip: 0 }; for (var i = 0; i < results.length; i++) t[results[i].status]++; return t; }

function showSummary(done, ms, extra) {
  var R = window.EdenTests, t = tally(R.results);
  R.passed = t.pass; R.failed = t.fail; R.warnings = t.warn; R.skipped = t.skip; R.done = done; R.ms = Math.round(ms);
  var line = t.pass + ' passed, ' + t.fail + ' failed, ' + t.warn + ' warnings, ' + t.skip + ' skipped, ' + (ms / 1000).toFixed(1) + ' s';
  R.summary = line;
  document.title = (done ? (t.fail ? 'FAIL ' : 'OK ') : 'running ') + line + ' | Eden tests';
  var s = $('summary'); if (s) { s.textContent = (done ? '' : 'Running: ') + line; s.className = done ? (t.fail ? 'fail' : t.warn ? 'warn' : 'pass') : ''; }
  var p = $('progress'); if (p && extra !== undefined) p.textContent = extra;
}

function showWorld(run) {
  var body = $('results'); if (!body) return;
  var t = tally(run.rows), head = el('tr', undefined, 'world'), th = el('th', run.label + ': ' + t.pass + ' passed, ' + t.fail + ' failed, ' + t.warn + ' warnings, ' + t.skip + ' skipped. ' + run.summary);
  th.colSpan = 4; head.appendChild(th); body.appendChild(head);
  for (var i = 0; i < run.rows.length; i++) { var r = run.rows[i], tr = el('tr', undefined, r.status);
    tr.appendChild(el('td', r.world)); tr.appendChild(el('td', r.status.toUpperCase(), 'status'));
    tr.appendChild(el('td', r.check + (r.kind === 'soft' ? ' (soft)' : ''))); tr.appendChild(el('td', r.detail || '', 'detail')); body.appendChild(tr); }
}

function start() {
  if (running) return;
  running = true;
  var runs = [], li, si, t0 = now(), at = 0;
  for (li = 0; li < CONFIG.lands.length; li++) for (si = 0; si < CONFIG.seeds.length; si++) runs.push(new WorldRun(CONFIG.lands[li], CONFIG.seeds[si]));
  window.EdenTests = { done: false, passed: 0, failed: 0, warnings: 0, skipped: 0, results: [], worlds: [], config: CONFIG, ms: 0, summary: '' };
  var body = $('results'); if (body) body.textContent = '';
  var btn = $('run'); if (btn) btn.disabled = true;
  var cfg = $('config'); if (cfg) cfg.textContent = 'Lands: ' + CONFIG.lands.join(', ') + '. Seeds: ' + CONFIG.seeds.join(', ') + '. Years: ' + CONFIG.years + '. Determinism rerun: ' + (CONFIG.determinism ? 'on' : 'off') + '.';
  function slice() {
    var deadline = now() + CONFIG.sliceMs;
    try {
      while (at < runs.length && now() < deadline) {
        var run = runs[at];
        if (run.step(deadline)) { Array.prototype.push.apply(window.EdenTests.results, run.rows); window.EdenTests.worlds.push({ world: run.label, summary: run.summary }); showWorld(run); at++; }
      }
    } catch (e) {                                                       // the harness itself broke: say so as a failure and move on to the next world
      var broken = runs[at];
      window.EdenTests.results.push({ world: broken ? broken.label : '?', land: broken && broken.land, seed: broken && broken.seed, check: 'the test harness ran without error', kind: 'hard', status: 'fail', detail: String(e && e.stack || e).slice(0, 400) });
      if (broken) { broken.rows = [window.EdenTests.results[window.EdenTests.results.length - 1]]; broken.summary = 'harness error'; showWorld(broken); }
      at++;
    }
    if (at < runs.length) {
      var r = runs[at];
      showSummary(false, now() - t0, 'World ' + (at + 1) + ' of ' + runs.length + ': ' + r.label + ', ' + (r.phase === 'again' ? 'second run for determinism' : 'year ' + r.year + ' of ' + CONFIG.years));
      timer = setTimeout(slice, 0);
    } else {
      running = false; if (btn) btn.disabled = false;
      showSummary(true, now() - t0, 'Done: ' + runs.length + ' worlds.');
    }
  }
  showSummary(false, 0, 'Starting');
  timer = setTimeout(slice, 0);
}

window.EdenTests = { done: false, passed: 0, failed: 0, warnings: 0, skipped: 0, results: [], worlds: [], config: CONFIG, ms: 0, summary: '' };
window.EdenTestsRun = start;
function boot() { var btn = $('run'); if (btn) btn.addEventListener('click', start); start(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
