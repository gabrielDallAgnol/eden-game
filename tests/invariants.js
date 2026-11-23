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
  extraWorlds: [{ land: 'lakeland', seed: 1, years: 100 }, { land: 'valley', seed: 1, years: 30, size: 96 }, { land: 'highland', seed: 2, years: 20, size: 128 }],   // longer runs with their own length, after the grid above (?extra=0 drops them)
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
    if ((v = q.get('extra')) === '0') CONFIG.extraWorlds = [];
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
function WorldRun(land, seed, years, size) {
  this.land = land; this.seed = seed; this.size = size; this.years = years || CONFIG.years; this.label = land + ' #' + seed + (size ? ' at ' + size : '') + (years ? ' (' + years + ' years)' : '');
  this.W = null; this.ticks = 0; this.year = 0; this.inYear = 0; this.phase = 'create'; this.aborted = '';
  this.W2 = null; this.ticks2 = 0;
  this.lastPeopleYear = -1; this.everPeople = false; this.gonePeopleYears = 0; this.firstDwellingYear = -1;
  this.startMs = 0; this.simMs = 0;
  var C = this.C = {}, self = this;
  var add = function (key, name, kind) { C[key] = new Check(name, kind); };
  add('run', 'create() and tick() throw no exception');
  add('clock', 'time moves forward: one tickNo per tick, S.t never goes back');
  add('inside', 'every living creature is on a whole tile inside the map');
  add('dry', 'no living creature stands on a water tile (a finished bridge is not water)');
  add('dryAlways', 'no living creature is on a water tile after any tick (a finished bridge is not water)');
  add('problems', 'the sim reports no defects in S.problems');
  add('pitFree', 'no lot or field on a quarry pit (B5)');
  add('killNear', 'every kill is made by a creature standing within 3 tiles of what it killed, by the state (E3)');
  add('mix', 'every larder\'s and the store\'s kinds of food add up to its total and none is negative (F2)');
  add('places', 'the Town panel\'s places of work list every standing workshop, kiln, smithy and pen, with exactly those whose trade is there (F6)');
  add('debts', 'every debt between households is finite, not negative, and between households that exist (G3)');
  add('writing', 'writing is only worked out in a place with many open debts (more than 8) (G5)');
  add('coin', 'coin appears only where trade is busy: more than 30 trades and more than 15 failed a year when it came (H1)');
  add('prices', 'every price is finite and positive (H2)');
  add('floors', 'no house has more than two floors in a place that does not know masonry, nor more than six anywhere (I1, I2)');
  add('rent', 'every rent is finite and not negative, and only a floor above someone else\'s house pays one (I3)');
  add('haul', 'everyone on a timber, stone or firewood trip carries a sane load and has a way home (E2)');
  add('tripSum', 'each household\'s trips last year add up to its working days (B8)');
  add('lotOwner', 'every lot tile belongs to its own household and is not sown by another (B4)');
  add('chopped', 'timber is only ever gained by someone chopping a tree');
  add('bank', 'no person is ever on a bank cut off from the camp (no bridge, no crossing)');
  add('fieldBank', 'every field lies on the same bank as the household that sows it');
  add('agentNums', 'each creature\'s energy and age are finite, age is not negative');
  add('ids', 'no two living creatures share an id');
  add('pop', 'S.pop matches the living creatures, species by species');
  add('popPeople', 'S.popPeople matches the living people');
  add('siteDry', 'no building site is on water or outside the map');
  add('siteTile', 'no two building sites share a tile, except floors built upon a house (and every floor stands on one) (I1)');
  add('siteNums', 'every site has a known kind and a finite, non-negative stage, wood and stone');
  add('stocks', 'store, wood, stone, every larder and every hearth\'s fuel are finite and not negative');
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
  add('softRubble', 'raising a house again after a flood takes fewer quarry trips than the first time (B6)', 'soft');
  add('softTrip', 'food trips from the door average under 8 tiles along the ways (B1)', 'soft');
  this.guard = function (key, fn) { try { fn(C[key]); } catch (e) { C[key].fail('the check itself threw at year ' + self.year + ': ' + (e && e.message || e)); } };
}

WorldRun.prototype.options = function () { var o = {}, k; for (k in CONFIG.worldOptions) o[k] = CONFIG.worldOptions[k]; o.land = this.land; if (this.size) o.size = this.size; return o; };

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
    while (this.year < this.years && now() < deadline) {
      var lastOfYear = this.inYear === this.TPY - 1, before = lastOfYear ? this.living() : null;
      var tn = S.tickNo, tt = S.t;
      var woodBefore = S.tribe ? S.tribe.wood : 0;
      try { W.tick(); } catch (e) { this.abort('tick ' + (this.ticks + 1) + ' (year ' + this.year + ')', e); this.phase = 'finish'; break; }
      this.ticks++; this.inYear++; C.run.ok();
      if (num(tn) && num(tt)) { if (S.tickNo !== tn + 1) C.clock.fail('tick ' + this.ticks + ': tickNo went from ' + tn + ' to ' + show(S.tickNo)); else if (!(S.t >= tt)) C.clock.fail('tick ' + this.ticks + ': S.t went from ' + show(tt) + ' to ' + show(S.t)); else C.clock.ok(); }
      else C.clock.skip('S.tickNo or S.t is not a number');
      this.dryTick();
      this.woodTick(woodBefore);
      this.killTick();
      if (lastOfYear) { this.inYear = 0; this.year++; this.popCheck(before); this.yearly(); }
    }
    if (this.phase === 'run' && this.year >= this.years) this.phase = CONFIG.determinism ? 'again' : 'finish';
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

WorldRun.prototype.woodTick = function (before) {
  var S = this.W.S, T = S.tribe, c = this.C.chopped;
  var back = (S.stat.woodBack || 0) - (this.woodBack || 0); this.woodBack = S.stat.woodBack || 0;   /* E2: logs carried home from a felling trip */
  if (!T || !(T.wood > before + 1e-9)) return;
  var chop = S.agents.some(function (a) { return a.act && a.act.k === 'chop' && (a.alive || a.d.people); });   /* a chopper may die later in the same step */
  if (chop || back >= T.wood - before - 1e-6) c.ok(); else c.fail('tick ' + this.ticks + ': timber went from ' + show(before) + ' to ' + show(T.wood) + ' and nobody chopped');
};
WorldRun.prototype.killTick = function () {
  var S = this.W.S, c = this.C.killNear, seen = this.fxSeen || (this.fxSeen = new WeakSet());
  (S.fx || []).forEach(function (f) { if (seen.has(f)) return; seen.add(f);
    if (f.kind !== 'death' || !f.by || f.why === 'struck') return; var k = S.byId && S.byId.get(f.by); if (!k) return;
    var kx = f.kx >= 0 ? f.kx : k.x, ky = f.ky >= 0 ? f.ky : k.y, d = Math.max(Math.abs(kx - f.x), Math.abs(ky - f.y)); if (d <= 3) c.ok(); else c.fail(f.sp + ' ' + f.why + ' by a ' + k.sp + ' standing ' + d + ' tiles away'); });
};
/* tiles of every finished bridge: standing there is standing on the bridge, not in the river */
function bridgeSet(W) { var T = W.S.tribe, set = {}; if (!T || !T.bridged || !W.fords) return set; W.fords().forEach(function (f) { if (T.bridged[f.key]) f.tiles.forEach(function (t) { set[t] = 1; }); }); return set; }
WorldRun.prototype.dryTick = function () {
  var W = this.W, S = W.S, N = W.N, water = W.water, c = this.C.dryAlways;
  if (!isField(water) || !isArr(S.agents)) return c.skip('W.water or S.agents is missing');
  var br = null; for (var i = 0; i < S.agents.length; i++) { var a = S.agents[i]; if (a && a.alive && water[a.y * N + a.x] && !(br || (br = bridgeSet(W)))[a.y * N + a.x]) { c.fail('tick ' + this.ticks + ': ' + who(a) + ' at ' + a.x + ',' + a.y); return; } }
  c.ok();
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
    var bad = 0, ex = '', br = bridgeSet(W);
    for (var i = 0; i < L.list.length; i++) { var a = L.list[i]; if (whole(a.x) && whole(a.y) && inMap(a.x, a.y) && water[a.y * N + a.x] && !br[a.y * N + a.x]) { bad++; if (!ex) ex = who(a) + ' at ' + a.x + ',' + a.y; } }
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
    for (var i = 0; i < sites.length; i++) { var s = sites[i], k = s.x + ',' + s.y; if (s.upon) { if (!sites.some(function (b) { return b.id === s.upon && b.x === s.x && b.y === s.y; })) bad.push('a floor at ' + k + ' stands on nothing'); continue; } if (seen[k]) bad.push((s.kind || 'site') + ' and ' + seen[k] + ' both at ' + k); seen[k] = s.kind || 'site'; }
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
    try { for (var i = 0; i < sites.length; i++) { var s = sites[i]; if (!(W.BUILDINGS && W.BUILDINGS[s.kind] && !W.BUILDINGS[s.kind].room) && (s.stage >= 1 || s.was)) { this.firstDwellingYear = y; break; } } } catch (e) { /* soft */ }
  }

  this.guard('bank', function (c) {
    if (!W.mass || !W.fords || !L || !T) return c.skip('W.mass is missing');
    var home = W.mass[T.y * N + T.x], ok = {}; ok[home] = 1; W.fords().forEach(function (f) { if (T.bridged[f.key]) { if (f.ma === home) ok[f.mb] = 1; if (f.mb === home) ok[f.ma] = 1; } });
    var bad = 0, ex = ''; L.list.forEach(function (a) { if (a.d && a.d.people && !ok[W.mass[a.y * N + a.x]]) { bad++; if (!ex) ex = who(a) + ' at ' + a.x + ',' + a.y; } });
    if (bad) c.fail(at + bad + ' people across water with no bridge, e.g. ' + ex); else c.ok();
  });
  this.guard('fieldBank', function (c) {
    if (!W.mass || !W.owner || !sites) return c.skip('W.mass or W.owner is missing');
    var by = {}; sites.forEach(function (q) { by[q.id] = q; }); var bad = 0, ex = '';
    for (var i = 0; i < N * N; i++) if (W.field[i] && W.owner[i] && by[W.owner[i]]) { var h = by[W.owner[i]]; if (W.mass[i] !== W.mass[h.y * N + h.x]) { bad++; if (!ex) ex = 'field ' + (i % N) + ',' + ((i / N) | 0) + ' of the house at ' + h.x + ',' + h.y; } }
    if (bad) c.fail(at + bad + ' fields across water, e.g. ' + ex); else c.ok();
  });
  this.guard('pitFree', function (c) {
    if (!W.pit || !sites) return c.skip('W.pit is missing');
    var bad = 0, ex = '';
    for (var i = 0; i < N * N; i++) if (W.pit[i] > 0.1 && W.field[i]) { bad++; if (!ex) ex = 'field on a pit at ' + (i % N) + ',' + ((i / N) | 0); }
    sites.forEach(function (q) { if (q.kind !== 'well' && W.pit[q.y * N + q.x] > 0.1) { bad++; if (!ex) ex = q.kind + ' on a pit at ' + q.x + ',' + q.y; } });
    if (bad) c.fail(at + bad + ', e.g. ' + ex); else c.ok();
  });
  this.guard('tripSum', function (c) {
    if (!sites) return c.skip('no sites'); var bad = [], seen = 0;
    sites.forEach(function (q) { if (!q.tripsLast) return; seen++; var sum = 0; for (var k in q.tripsLast) sum += q.tripsLast[k]; if (sum !== q.workDaysLast) bad.push(q.kind + ' at ' + q.x + ',' + q.y + ': trips ' + sum + ', work days ' + q.workDaysLast); });
    if (bad.length) c.fail(at + bad.slice(0, 2).join('; ')); else if (seen) c.ok(); else c.skip('no household has a year of trips yet');
  });
  this.guard('haul', function (c) {
    var bad = [], seen = 0;
    S.agents.forEach(function (a) { var tr = a.trip; if (!a.alive || !tr || !(tr.kind === 'timber' || tr.kind === 'stone' || tr.kind === 'fuel')) return; seen++;
      if (!(isFinite(tr.load) && tr.load >= 0 && tr.load < 50)) bad.push(a.name + ' carries ' + tr.load + ' ' + tr.kind);
      else if (!Array.isArray(tr.back) || !tr.back.length) bad.push(a.name + ' has no way home from a ' + tr.kind + ' trip'); });
    if (bad.length) c.fail(at + bad.slice(0, 2).join('; ')); else if (seen) c.ok(); else c.skip('nobody hauling at this check');
  });
  this.guard('mix', function (c) {
    if (!W.mixOf || !T) return c.skip('W.mixOf is missing'); var bad = [];
    var look = function (o, f, lab) { if (!(o[f] > 0.01) || !o.mix) return; var m = o.mix, ks = Object.keys(m), sum = ks.reduce(function (p, k) { return p + m[k]; }, 0);
      if (ks.some(function (k) { return !(m[k] >= -1e-6); })) bad.push(lab + ' holds a negative kind ' + JSON.stringify(m));
      else if (Math.abs(sum - o[f]) > 0.02 * o[f] + 0.05 && sum > 1e-9) bad.push(lab + ' kinds add to ' + sum.toFixed(2) + ' of ' + o[f].toFixed(2)); };
    W.mixOf(T, 'store'); look(T, 'store', 'the store');
    (T.sites || []).forEach(function (q) { if (q.larder > 0.01) { W.mixOf(q, 'larder'); look(q, 'larder', q.kind + ' ' + q.id); } });
    if (bad.length) c.fail(at + bad.slice(0, 2).join('; ')); else c.ok();
  });
  this.guard('places', function (c) {
    if (!W.workplaces || !W.BUILDINGS) return c.skip('W.workplaces is missing'); var wp = W.workplaces(), bad = [], B = W.BUILDINGS;
    (T.sites || []).forEach(function (q) { var K = B[q.kind]; if (!K || !K.work || !(q.stage >= K.stages.length)) return; var w = wp.filter(function (x) { return x.place === q.kind && x.x === q.x && x.y === q.y; })[0];
      if (!w) { bad.push('the ' + q.kind + ' at ' + q.x + ',' + q.y + ' is not listed'); return; }
      var hold = L.list.filter(function (a) { return a.job === K.work; }).map(function (a) { return a.name; }).sort().join(',');
      if (w.workers.slice().sort().join(',') !== hold) bad.push('the ' + q.kind + ' lists ' + w.workers.join(',') + ' but ' + hold + ' hold the trade'); });
    if (bad.length) c.fail(at + bad.slice(0, 2).join('; ')); else c.ok();
  });
  this.guard('debts', function (c) {
    if (!T || !T.debts) return c.skip('no debts kept'); var bad = [], ids = {}; (T.sites || []).forEach(function (q) { ids[q.id] = 1; });
    Object.keys(T.debts).forEach(function (k) { var v = T.debts[k], p = k.split('>'); if (!(isFinite(v) && v >= 0)) bad.push(k + ' = ' + v); else if (p.length !== 2) bad.push('odd key ' + k); });
    if (bad.length) c.fail(at + bad.slice(0, 2).join('; ')); else c.ok();
  });
  this.guard('writing', function (c) {
    if (!T || !T.skills || !T.skills.writing) return c.skip('writing not known yet'); if (T.writingDebts === undefined) return c.skip('learned before the debts were counted');
    if (T.writingDebts > 8) c.ok(); else c.fail(at + 'writing was worked out with only ' + T.writingDebts + ' open debts');
  });
  this.guard('coin', function (c) {
    if (!T || !T.coin) return c.skip('no coin yet'); var k = T.coinAt;
    if (k && k.trades > 30 && k.failRate > 15) c.ok(); else c.fail(at + T.coin + ' became coin with ' + JSON.stringify(k));
  });
  this.guard('prices', function (c) {
    if (!T || !T.price) return c.skip('no prices yet'); var bad = Object.keys(T.price).filter(function (g) { var v = T.price[g]; return !(isFinite(v) && v > 0); });
    if (bad.length) c.fail(at + bad.map(function (g) { return g + '=' + T.price[g]; }).join(', ')); else c.ok();
  });
  this.guard('floors', function (c) {
    if (!sites) return c.skip('no sites'); var most = 1, at2 = '';
    sites.forEach(function (q) { if (q.upon) return; var f = 1 + sites.filter(function (u) { return u.upon === q.id; }).length; if (f > most) { most = f; at2 = q.x + ',' + q.y; } });
    if (most > 6 || (most > 2 && !(T.skills && T.skills.masonry))) c.fail(at + 'a house of ' + most + ' floors at ' + at2 + (T.skills && T.skills.masonry ? '' : ' with no masonry known')); else c.ok();
  });
  this.guard('rent', function (c) {
    if (!sites) return c.skip('no sites'); var bad = [];
    sites.forEach(function (u) { if (u.rent === undefined) return; if (!(isFinite(u.rent) && u.rent >= 0)) bad.push('rent ' + u.rent + ' at ' + u.x + ',' + u.y); else if (u.rent > 0 && !u.upon) bad.push('a ground floor pays rent at ' + u.x + ',' + u.y); });
    if (bad.length) c.fail(at + bad.slice(0, 2).join('; ')); else c.ok();
  });
  this.guard('lotOwner', function (c) {
    if (!W.owner || !sites) return c.skip('W.owner is missing');
    var bad = 0, ex = '';
    sites.forEach(function (q) { if (q.upon || (W.BUILDINGS && W.BUILDINGS[q.kind] && !W.BUILDINGS[q.kind].room)) return; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var j = (q.y + dy) * N + q.x + dx; if (W.water[j]) continue; if (W.owner[j] !== q.id || W.field[j]) { bad++; if (!ex) ex = 'tile ' + (q.x + dx) + ',' + (q.y + dy) + ' of the ' + q.kind + ' at ' + q.x + ',' + q.y + ' is owned by ' + W.owner[j] + (W.field[j] ? ' and sown' : ''); } } });
    if (bad) c.fail(at + bad + ' lot tiles not the household\'s own, e.g. ' + ex); else c.ok();
  });
  this.guard('problems', function (c) {
    if (!isArr(S.problems)) return c.skip('S.problems is missing');
    if (S.problems.length) c.fail(at + S.problems.slice(0, 3).join('; ')); else c.ok();
  });
  this.guard('stocks', function (c) {
    if (!T) return c.skip('S.tribe is missing');
    var keys = ['store', 'wood', 'stone'], bad = [], n = 0;
    for (var j = 0; j < keys.length; j++) if (has(T, keys[j])) { n++; if (!num(T[keys[j]]) || T[keys[j]] < 0) bad.push(keys[j] + '=' + show(T[keys[j]])); }
    if (sites) for (var q = 0; q < sites.length; q++) ['larder', 'fuel'].forEach(function (k) { var v = sites[q][k]; if (v !== undefined && (!num(v) || v < 0)) bad.push('site ' + sites[q].id + ' ' + k + '=' + show(v)); });
    if (T.fuel !== undefined && (!num(T.fuel) || T.fuel < 0)) bad.push('fuel=' + show(T.fuel));
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
      if (self.years < CONFIG.survivalWindowYears) return c.skip('the run is shorter than ' + CONFIG.survivalWindowYears + ' years');
      if (self.lastPeopleYear >= y - CONFIG.survivalWindowYears) c.ok();
      else c.fail('no people at any yearly check since year ' + (self.lastPeopleYear < 0 ? 'the start' : self.lastPeopleYear) + ' (the run ended at year ' + y + ')');
    });
    this.guard('softDwelling', function (c) {
      if (!W.S.tribe || !isArr(W.S.tribe.sites)) return c.skip('S.tribe.sites is missing');
      if (self.years < CONFIG.dwellingWithinYears) return c.skip('the run is shorter than ' + CONFIG.dwellingWithinYears + ' years');
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
    this.guard('softTrip', function (c) {
      var st = W.S.stat; if (!st || st.forageD === undefined) return c.skip('S.stat is missing');
      if (!st.forageN) return c.skip('no food trips');
      var m = st.forageD / st.forageN; c.note = 'mean ' + show(m) + ' over ' + st.forageN + ' trips';
      if (m < 8) c.ok(); else c.fail(c.note);
    });
    this.guard('softRubble', function (c) {
      var st = W.S.stat; if (!st || st.reN === undefined) return c.skip('S.stat has no rebuild counts');
      if (!st.reN || !st.newN) return c.skip('no stone dwelling was raised again after a flood');
      var a = st.reTrips / st.reN, b = st.newTrips / st.newN; c.note = show(a) + ' quarry trips after a flood (' + st.reN + '), ' + show(b) + ' for a first build (' + st.newN + ')';
      if (a < b) c.ok(); else c.fail(c.note);
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

// ---------------------------------------------------------------- unit checks: short, targeted, run once before the worlds
// Each is [name, fn]; fn returns '' when it holds, or a sentence saying what went wrong. Steps add their checks here.
var UNITS = window.EdenUnits = window.EdenUnits || [];
UNITS.push(['every BUILDINGS row is whole: stages with finite wood and stone, a roof, and a known idea (F1)', function () {
  var W = Eden.create(1, { land: 'valley' }), B = W.BUILDINGS, bad = [], ideas = W.IDEAS ? Object.keys(W.IDEAS) : null;
  if (!B) return 'W.BUILDINGS is missing';
  Object.keys(B).forEach(function (k) { var K = B[k];
    if (!Array.isArray(K.stages) || !K.stages.length) bad.push(k + ' has no stages');
    else K.stages.forEach(function (st, i) { if (!(isFinite(st.wood) && st.wood >= 0 && isFinite(st.stone) && st.stone >= 0)) bad.push(k + ' stage ' + i + ' needs ' + JSON.stringify(st)); });
    if (!(K.roof > 0 && K.roof <= 1)) bad.push(k + ' roof ' + K.roof);
    if (K.needsIdea && ideas && ideas.indexOf(K.needsIdea) < 0 && K.needsIdea !== 'herd' /* learned by raising a fawn, not an idea */) bad.push(k + ' needs an idea that is not in IDEAS: ' + K.needsIdea);
    if (K.next && !B[K.next]) bad.push(k + ' is rebuilt into an unknown kind ' + K.next); });
  return bad.slice(0, 4).join('; ');
}]);
UNITS.push(['meat and fish spoil faster than grain; households eat differently (F2)', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'lakeland' }), T = W.S.tribe;
  T.store = 0; T.mix = { grain: 30, meat: 30, fish: 30, fruit: 30 }; T.store = 120;
  W.tick(); W.tick(); W.tick(); var m = W.mixOf(T, 'store');
  if (!(m.meat < m.grain && m.fish < m.grain)) return 'after three steps grain ' + m.grain.toFixed(2) + ', meat ' + m.meat.toFixed(2) + ', fish ' + m.fish.toFixed(2);
  var V = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'lakeland', size: 96 }), i, shares = [];
  /* at years 20, 30 and 40: the widest spread between households in the share of any kind of food */
  var spread = 0, seen = 0;
  for (i = 0; i < 24 * 40; i++) { V.tick(); if (i % 240 !== 239 || i < 24 * 19) continue;
    ['grain', 'meat', 'fish', 'fruit'].forEach(function (g) { var sh = []; V.S.tribe.sites.forEach(function (q) { if (q.larder > 1) { var k = V.mixOf(q, 'larder'); sh.push(k[g] / q.larder); } }); if (sh.length >= 2) { seen++; spread = Math.max(spread, Math.max.apply(null, sh) - Math.min.apply(null, sh)); } }); }
  if (!seen) return 'fewer than two households with food at years 20 to 40';
  return spread > 0.1 ? '' : 'every household eats much the same: the widest spread in any kind is ' + spread.toFixed(2);
}]);
UNITS.push(['food in common keeps only while a store stands: burn the granary and the store rots faster that same year (F3)', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley' }), T = W.S.tribe;
  T.skills.pottery = T.skills.farm = T.skills.granary = true; W.G.cull('human', 1);   /* nobody to eat from the store: what goes is what rots */
  T.sites.push({ id: 888888, x: T.x + 3, y: T.y + 3, kind: 'granary', stage: 2, wood: 0, stone: 0, larder: 0, members: 0, cold: 0, hunger: 0, fuel: 0, lit: -1, was: '', lake: false });
  var lose = function () { T.mix = { grain: 60, meat: 0, fish: 0, fruit: 0 }; T.store = 60; W.tick(); var m = W.mixOf(T, 'store'); return 60 - m.grain; };
  var kept = lose(); W.G.ruin('granary'); var open = lose();
  if (!(open > kept * 1.5)) return 'grain lost in a step: ' + kept.toFixed(3) + ' with the granary standing, ' + open.toFixed(3) + ' once it is gone';
  return '';
}]);
UNITS.push(['tools are made at a smithy: with no smithy, none are made and those there wear out (F4)', function () {
  var W = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley' }), T = W.S.tribe, i, last;
  for (i = 0; i < 24 * 3; i++) W.tick();
  T.skills.tools = true; T.tools = 10; T.ore = 50; W.G.ruin('smithy'); last = T.tools;
  for (i = 0; i < 24 * 2; i++) { W.G.ruin('smithy'); W.tick(); if (T.tools > last + 1e-9) return 'tools rose from ' + last.toFixed(3) + ' to ' + T.tools.toFixed(3) + ' at step ' + i + ' with no smithy standing'; last = T.tools; }
  return T.tools < 10 * 0.7 ? '' : 'tools only wore from 10 to ' + T.tools.toFixed(2) + ' in two years';
}]);
UNITS.push(['tame deer come through a winter with a pen and a herder (most of them), and fewer of them without (F5)', function () {
  var run = function (withPen, seed, land) {
    var W = Eden.create(seed, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: land, size: 96 }), S = W.S, T = S.tribe, i, n = 0;
    for (i = 0; i < 24 * 6; i++) W.tick(); while (!(S.t % 1 > 0.6 && S.t % 1 < 0.7)) W.tick();   /* autumn */
    T.skills.herd = true; T.hay = 0;
    S.agents.forEach(function (a) { if (a.alive && a.sp === 'deer' && a.age >= a.d.mature && n < 6) { a.tame = true; a.fear = 0; W.moveTo(a, T.x, T.y); n++; } });
    if (withPen) { var px = T.x, py = T.y, r, k, D;
      for (r = 2; r <= 4 && px === T.x; r++) { D = [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r]]; for (k = 0; k < D.length; k++) { var x = T.x + D[k][0], y = T.y + D[k][1], rt = W.route(T.x, T.y, x, y); if (px === T.x && rt.reached && rt.tiles.length <= r + 2) { px = x; py = y; } } }
      T.hay = 8; T.sites.push({ id: 777777, x: px, y: py, kind: 'pen', stage: 1, wood: 0, stone: 0, larder: 0, members: 0, cold: 0, hunger: 0, fuel: 0, lit: -1, was: '', lake: false }); }
    for (i = 0; i < 14; i++) {
      if (withPen) { var h = S.agents.filter(function (a) { return a.alive && a.d.people && a.age >= 16 && a.age <= 46; }).sort(function (p, q) { return (q.job === 'herder') - (p.job === 'herder'); })[0]; if (h) h.job = 'herder'; }
      else S.agents.forEach(function (a) { if (a.job === 'herder') a.job = ''; });
      W.tick(); }
    return [n, S.agents.filter(function (a) { return a.alive && a.tame; }).length];
  };
  var out = [], without = 0, withP = 0, tamed = 0;
  [[1, 'valley'], [3, 'forest']].forEach(function (w) { var a = run(false, w[0], w[1]), b = run(true, w[0], w[1]); tamed += a[0]; without += a[1]; withP += b[1]; out.push(w[1] + ' ' + w[0] + ': ' + a[1] + ' of ' + a[0] + ' without, ' + b[1] + ' of ' + b[0] + ' with'); });
  return withP >= tamed * 0.6 && withP > without ? '' : out.join('; ');
}]);
UNITS.push(['no idea has an effect without a built thing: every idea names a building or a work, and the converted ones do nothing without it (F7)', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley' }), bad = [];
  Object.keys(W.IDEAS).forEach(function (k) { var v = W.IDEA_VIA && W.IDEA_VIA[k]; if (!v) bad.push(k + ' names nothing it works through'); else if (!W.BUILDINGS[v] && !(W.WORKS && W.WORKS[v])) bad.push(k + ' works through ' + v + ', which is neither a building nor a work'); });
  if (bad.length) return bad.slice(0, 3).join('; ');
  /* knowing masonry, medicine, concrete and writing with none of their places standing: roofs only as warm as their kinds, and
     streets not set with stone */
  var V = Eden.create(4, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley', size: 96 }), T = V.S.tribe, i;
  for (i = 0; i < 24 * 30; i++) V.tick();
  ['masonry', 'medicine', 'concrete', 'writing'].forEach(function (k) { T.skills[k] = true; });
  var reckon0 = T.need.reckon, pave0 = T.pave;
  for (i = 0; i < 24 * 2; i++) { ['masonsyard', 'healerhouse', 'limekiln', 'tallyhouse'].forEach(function (k) { V.G.ruin(k); }); V.tick(); }
  var lv = T.sites.filter(function (q) { var K = V.BUILDINGS[q.was || q.kind]; return K && K.room && (q.was || q.stage >= K.stages.length); });
  var want = lv.length ? lv.reduce(function (p, q) { return p + V.BUILDINGS[q.was || q.kind].roof; }, 0) / lv.length : 0.7;
  if (Math.abs(T.roof - want) > 1e-6) return 'roof ' + T.roof.toFixed(4) + ' with no mason\'s yard; its kinds give ' + want.toFixed(4);
  if (T.pave >= 3 && pave0 < 3) return 'streets were set with stone with no mason\'s yard';
  return '';
}]);
UNITS.push(['a ditch dug from the well waters only the fields beside it (F7)', function () {
  var W = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'lakeland', size: 96 }), T = W.S.tribe, N = W.N, i;
  for (i = 0; i < 24 * 40; i++) W.tick();
  var wl = T.sites.filter(function (q) { return q.kind === 'well' && q.stage >= 2; })[0]; if (!wl) return 'no well by year 40';
  T.skills.irrigation = true; for (i = 0; i < 24 * 4; i++) W.tick();
  var dug = 0; for (i = 0; i < N * N; i++) dug += T.ditch[i]; if (!dug) return 'no ditch dug in four years of irrigation';
  var near = 0, far = 0, nN = 0, nF = 0;
  for (i = 0; i < N * N; i++) if (W.field[i]) { var by = false, x = i % N, y = (i / N) | 0, dx, dy; for (dy = -2; dy <= 2; dy++) for (dx = -2; dx <= 2; dx++) if (T.ditch[(y + dy) * N + x + dx]) by = true; if (by) { near += W.soil[i]; nN++; } else { far += W.soil[i]; nF++; } }
  if (!nN) return dug + ' ditch tiles, but none beside a field';
  return '';
}]);
UNITS.push(['people make friends beyond kin, and describing someone names them (G1)', function () {
  var W = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'lakeland', size: 96 }), i;
  for (i = 0; i < 24 * 30; i++) W.tick();
  var P = W.S.agents.filter(function (a) { return a.alive && a.d.people; }), withF = P.filter(function (a) { return Object.keys(a.ties || {}).some(function (id) { return a.ties[id] >= 0.5; }); });
  if (!withF.length) return 'nobody of ' + P.length + ' has a friend at year 30';
  var a = withF[0], d = W.describe(a); if (d.indexOf('Friends: ') < 0) return 'a person with friends is described without them: ' + d;
  var bad = P.filter(function (b) { return Object.keys(b.ties || {}).some(function (id) { var v = b.ties[id]; return !(isFinite(v) && v >= -2 && v <= 2); }); });   /* rivals go below nothing (G2) */
  return bad.length ? bad[0].name + ' has a tie out of bounds' : '';
}]);
UNITS.push(['after a bitter quarrel a household leaves the house by its rival\'s door, says so in the log, and builds again further off (G2)', function () {
  var tried = [], w, i;
  var worlds = [[1, 'lakeland', 30], [2, 'valley', 30], [1, 'plains', 40], [2, 'forest', 30]];
  for (w = 0; w < worlds.length; w++) {
    var W = Eden.create(worlds[w][0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: worlds[w][1], size: 96 }), S = W.S, T = S.tribe;
    for (i = 0; i < 24 * worlds[w][2]; i++) W.tick();
    var site = function (a) { return T.sites.filter(function (q) { return q.id === a.house; })[0]; }, done = function (q) { var K = W.BUILDINGS[q.kind]; return K && K.room && q.stage >= K.stages.length && q.members > 0; };
    var P = S.agents.filter(function (a) { return a.alive && a.d.people && a.age >= 10 && a.house && site(a) && done(site(a)); }), pair = null;
    P.forEach(function (a) { P.forEach(function (b) { if (pair || a.house === b.house) return; var p = site(a), q = site(b); if (Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) <= 5) pair = [a, b, p, q]; }); });
    if (!pair) { tried.push(worlds[w][1] + ' ' + worlds[w][0] + ': no neighbours'); continue; }
    var a = pair[0], b = pair[1], seen = S.log.length; a.ties = a.ties || {}; a.ties[b.id] = -1.5; b.ties = b.ties || {}; b.ties[a.id] = -1.5;
    var dOld = Math.hypot(pair[2].x - pair[3].x, pair[2].y - pair[3].y);
    for (i = 0; i < 24 * 3; i++) { a.ties[b.id] = Math.min(a.ties[b.id], -1.5); b.ties[a.id] = Math.min(b.ties[a.id], -1.5); W.tick(); }
    var mover = [a, b].filter(function (x) { return x.alive && x.house !== (x === a ? pair[2].id : pair[3].id); })[0];
    if (!mover) { tried.push(worlds[w][1] + ' ' + worlds[w][0] + ': neither moved'); continue; }
    if (!S.log.slice(seen).some(function (l) { return /hard words/.test(l.text); })) return mover.name + '\'s household moved, but the log does not say so';
    var other = mover === a ? b : a, ns = site(mover), os = site(other); if (!ns || !os) return '';
    return Math.hypot(ns.x - os.x, ns.y - os.y) > dOld ? '' : 'the new roof (' + ns.x + ',' + ns.y + ') is no further from the rival than the old one';
  }
  return tried.join('; ');
}]);
UNITS.push(['a household in want is given to by its kin before any stranger, and the gift is kept as a debt (G3)', function () {
  var worlds = [[1, 'lakeland', 30], [2, 'valley', 30], [1, 'plains', 40], [2, 'forest', 30]], w, i, tried = [];
  for (w = 0; w < worlds.length; w++) {
    var W = Eden.create(worlds[w][0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: worlds[w][1], size: 96 }), S = W.S, T = S.tribe;
    for (i = 0; i < 24 * worlds[w][2]; i++) W.tick();
    var P = S.agents.filter(function (a) { return a.alive && a.d.people && a.house; }), by = function (id) { return P.filter(function (a) { return a.house === id; }); };
    var homes = T.sites.filter(function (q) { return q.members > 0 && by(q.id).length; }), pick = null;
    homes.forEach(function (q) { if (pick) return; var mine = by(q.id);
      var kinH = homes.filter(function (k) { return k !== q && by(k.id).some(function (b) { return mine.some(function (m) { return W.kin(m, b); }); }); })[0];
      var strH = homes.filter(function (k) { return k !== q && !by(k.id).some(function (b) { return mine.some(function (m) { return W.kin(m, b) || (m.ties && m.ties[b.id] >= 0.5); }); }); })[0];
      if (kinH && strH) pick = [q, kinH, strH]; });
    if (!pick) { tried.push(worlds[w][1] + ' ' + worlds[w][0] + ': no such households'); continue; }
    var q = pick[0], k = pick[1], st = pick[2]; T.debts = {}; q.larder = 0; q.mix = null; k.larder = k.members * 3; k.mix = null; st.larder = st.members * 5; st.mix = null;
    W.tick();
    if (T.debts[q.id + '>' + st.id]) return 'a stranger household gave before kin did';
    if (!(T.debts[q.id + '>' + k.id] > 0)) return 'kin with a full larder gave nothing (debts: ' + JSON.stringify(T.debts) + ')';
    return '';
  }
  return tried.join('; ');
}]);
UNITS.push(['fishers\' and farmers\' households trade fish for grain; failed trades are counted (G4)', function () {
  var n = 0, fails = 0, tr = 0, i;
  [[1, 'lakeland'], [2, 'valley']].forEach(function (w) { var W = Eden.create(w[0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: w[1], size: 96 }); for (i = 0; i < 24 * 60; i++) W.tick(); n += W.S.tribe.fishForGrain || 0; fails += W.S.tribe.tradesFailed || 0; tr += W.S.tribe.trades2 || 0; });
  if (!tr) return 'no trade at all in two 60-year worlds';
  if (!(fails > 0)) return tr + ' trades and not one failed';
  return n > 0 ? '' : tr + ' trades, none of fish for grain between a fishing and a farming household';
}]);
UNITS.push(['a bad harvest raises the price of grain (H2)', function () {
  var run = function (blight, seed, land) { var W = Eden.create(seed, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: land, size: 96 }), S = W.S, N = W.N, i, j;
    for (i = 0; i < 24 * 40; i++) W.tick(); while (S.t % 1 > 0.05) W.tick();
    for (i = 0; i < 24; i++) { if (blight) for (j = 0; j < N * N; j++) if (W.field[j] && !(W.crop && W.crop[j])) W.grass[j] = 0; W.tick(); }   /* the grain fails; greens come in */
    for (i = 0; i < 7; i++) W.tick();   /* one more season, so the prices have seen the harvest */
    var p = S.tribe.price; return p.grain / ((p.fruit + p.fish) / 2); };   /* grain against fish and fruit, which the blight does not touch (whatever the coin is) */
  var out = [], ok = true;
  [[1, 'lakeland'], [2, 'valley']].forEach(function (w) { var a = run(false, w[0], w[1]), b = run(true, w[0], w[1]); out.push(w[1] + ' ' + w[0] + ': ' + a.toFixed(3) + ' normal, ' + b.toFixed(3) + ' blighted'); if (!(b > a)) ok = false; });
  return ok ? '' : 'grain no dearer after a blighted year: ' + out.join('; ');
}]);
UNITS.push(['after a bad harvest more hands go to the fields the next year (H3)', function () {
  var run = function (blight, seed, land) { var W = Eden.create(seed, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: land, size: 96 }), S = W.S, N = W.N, i, j, f = 0;
    for (i = 0; i < 24 * 40; i++) W.tick(); while (S.t % 1 > 0.05) W.tick();
    for (i = 0; i < 24; i++) { if (blight) for (j = 0; j < N * N; j++) if (W.field[j]) W.grass[j] = 0; W.tick(); }
    for (i = 0; i < 14; i++) W.tick(); for (j = 0; j < N * N; j++) f += W.field[j];
    var hands = S.agents.filter(function (a) { return a.alive && a.d.people && a.age >= 8 && a.age <= 60; }).length; return f / Math.max(1, hands); };   /* per working hand: a bad year also kills */
  var out = [], ok = true;
  var sa = 0, sb = 0; [[1, 'lakeland'], [1, 'valley'], [2, 'valley']].forEach(function (w) { var a = run(false, w[0], w[1]), b = run(true, w[0], w[1]); sa += a; sb += b; out.push(w[1] + ' ' + w[0] + ': ' + a.toFixed(2) + ' field tiles a hand sown after a normal year, ' + b.toFixed(2) + ' after a blighted one'); });
  return sb > sa ? '' : out.join('; ');   /* taken together: one world's history can hide it */
}]);
UNITS.push(['once there is a market, trips to it show up in the households\' trip counts (H4)', function () {
  var W = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'plains', size: 96 }), T = W.S.tribe, i;
  for (i = 0; i < 24 * 70; i++) W.tick();
  if (!T.market) return 'no market by year 70 (coin ' + T.coin + ')';
  var n = 0; T.sites.forEach(function (q) { n += (q.tripsLast && q.tripsLast.market) || 0; });
  if (!n) return 'a market since then, but no household counted a trip to it last year';
  var open = T.sites.filter(function (q) { return q.stage === 0 && Math.abs(q.x - T.market.x) <= W.PITCH && Math.abs(q.y - T.market.y) <= W.PITCH && W.BUILDINGS[q.kind] && W.BUILDINGS[q.kind].room; });
  return open.length ? 'a house begun on the market ground at ' + open[0].x + ',' + open[0].y : '';
}]);
UNITS.push(['one harvest a year, each logged and shown rising from the fields; the fields feed people (grain and greens)', function () {
  var W = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'plains', size: 96 }), S = W.S, i, years = {}, pops = 0;
  for (i = 0; i < 24 * 40; i++) { W.tick(); (S.fx || []).forEach(function (f) { if (f.kind === 'harvest' && !f.seen) { f.seen = 1; pops++; } }); }
  var H = S.log.filter(function (l) { return /^Harvest/.test(l.text); }); H.forEach(function (l) { var y = Math.floor(l.t); years[y] = (years[y] || 0) + 1; });
  var twice = Object.keys(years).filter(function (y) { return years[y] > 1; }); if (twice.length) return 'two harvests in year ' + twice[0];
  if (!H.length) return 'no harvest logged in 40 years'; if (!pops) return 'no harvest shown rising from a field';
  var f = S.tribe.foodLast || {}, tot = Object.keys(f).reduce(function (p, k) { return p + f[k]; }, 0), fields = (f.grain || 0) + (f.veg || 0);
  if (!(fields > 0.3 * tot)) return 'the fields gave only ' + Math.round(100 * fields / Math.max(1e-9, tot)) + '% of the food at year 40';
  if (!(f.veg > 0 && f.grain > 0)) return 'only one crop came in: ' + JSON.stringify(f);
  return '';
}]);
UNITS.push(['a site of a kind not in DWELL is reported, not a crash', function () {
  var W = Eden.create(3, { land: 'valley' }); W.S.tribe.sites.push({ id: 999999, x: 1, y: 1, kind: 'castle', stage: 0, wood: 0, stone: 0, larder: 0, members: 0, cold: 0, hunger: 0, was: '' });
  for (var i = 0; i < 48; i++) W.tick();
  return W.S.problems.indexOf('unknown site kind castle') >= 0 ? '' : 'S.problems is ' + show(W.S.problems);
}]);
UNITS.push(['moveTo into the middle of a lake lands on dry ground', function () {
  var W = null, N = 0, a = null, wet = -1;
  for (var sd = 1; sd <= 8 && wet < 0; sd++) { W = Eden.create(sd, { land: 'lakeland', size: 96 }); N = W.N; a = W.S.agents[0];
  for (var i = 0; i < N * N && wet < 0; i++) { var x = i % N, y = (i / N) | 0, deep = true; for (var d = -2; d <= 2 && deep; d++) for (var e = -2; e <= 2; e++) if (x + d < 0 || y + e < 0 || x + d >= N || y + e >= N || !W.water[(y + e) * N + x + d]) { deep = false; break; } if (deep) wet = i; } }
  if (wet < 0) return 'no deep water found on lakeland seeds 1 to 8 at 96';
  for (var k = 0; k < 20; k++) { W.moveTo(a, wet % N, (wet / N) | 0); if (W.water[a.y * N + a.x] || a.x !== Math.round(a.x)) return 'placed at ' + a.x + ',' + a.y; }
  return '';
}]);
UNITS.push(['after a wipe-out and resettle, every settlement field equals a fresh one\'s', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley' });
  for (var i = 0; i < 24 * 15; i++) W.tick();                     /* let the first place grow some state worth forgetting */
  W.G.cull('human', 1); var seen = W.S.log.length, k = 0, T = W.S.tribe;
  for (; k < 24 * 8; k++) { W.tick(); var hit = false; for (var j = seen; j < W.S.log.length; j++) if (/^Two strangers have come/.test(W.S.log[j].text)) hit = true; seen = W.S.log.length; if (hit) break; }
  if (k >= 24 * 8) return 'nobody came back within 8 years';
  if (W.S.tribe !== T) return 'the settlement object was replaced (the view holds it)';
  var fresh = W.newSettlement(T.x, T.y), diff = [];
  var same = function (a, b) { if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; } return JSON.stringify(a) === JSON.stringify(b); };
  var keys = {}; Object.keys(T).forEach(function (x) { keys[x] = 1; }); Object.keys(fresh).forEach(function (x) { keys[x] = 1; });
  for (var key in keys) if (!same(T[key], fresh[key])) diff.push(key + ': ' + show(T[key]).slice(0, 40) + ' vs fresh ' + show(fresh[key]).slice(0, 40));
  return diff.length ? diff.slice(0, 5).join('; ') : '';
}]);
UNITS.push(['no wolf den is dug within 12 tiles of the camp; a struck den is broken', function () {
  var near = [], lands = ['valley', 'forest', 'highland'];
  for (var s = 1; s <= 3; s++) for (var l = 0; l < lands.length; l++) {
    var W = Eden.create(s, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: lands[l] }), T = W.S.tribe;
    for (var i = 0; i < 24 * 12; i++) { W.tick(); if (W.S.tribe.x !== T.x) break; }
    W.S.homes.forEach(function (h) { if (h.kind === 'den' && Math.max(Math.abs(h.x - W.S.tribe.x), Math.abs(h.y - W.S.tribe.y)) < 12) near.push(lands[l] + ' #' + s + ' den at ' + h.x + ',' + h.y); });
    var den = null; W.S.homes.forEach(function (h) { if (!den && h.kind === 'den') den = h; });
    if (den) { W.G.strike(den.x, den.y); if (W.S.homes.has(den.id)) return 'struck den still stands at ' + den.x + ',' + den.y; }
  }
  return near.slice(0, 3).join('; ');
}]);
UNITS.push(['save at year 20, load, run 20 more: identical to an unbroken 40-year run', function () {
  var O = { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'lakeland' }, out = [];
  [1, 2].forEach(function (seed) {
    var A = Eden.create(seed, O), i; for (i = 0; i < 480; i++) A.tick();
    var B = Eden.load(A.save()); for (i = 0; i < 480; i++) B.tick();
    var C = Eden.create(seed, O); for (i = 0; i < 960; i++) C.tick();
    var b = B.save(), c = C.save(); if (b !== c) { var k = 0; while (b[k] === c[k]) k++; out.push('seed ' + seed + ' differs at ...' + c.slice(Math.max(0, k - 60), k + 20)); }
  });
  return out.join('; ');
}]);
UNITS.push(['the common store is eaten only at the fire: everyone who went to eat from it is beside the fire (B3)', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley' }), i, bad = 0, seen = 0, T = W.S.tribe;
  for (i = 0; i < 24 * 12; i++) W.tick();
  for (i = 0; i < 24 * 20; i++) { W.tick(); W.S.agents.forEach(function (a) { if (a.alive && a.act && a.act.k === 'eat') { seen++; if (Math.max(Math.abs(a.x - T.x), Math.abs(a.y - T.y)) > 2) bad++; } }); }
  return bad ? bad + ' of ' + seen + ' ate from the store away from the fire' : '';
}]);
UNITS.push(['across the river: no way over without a bridge; a bridge makes it a walk', function () {
  var W = Eden.create(1, { land: 'valley' }), T = W.S.tribe, f = W.fords()[0];
  if (!f) return 'no narrow place on valley #1';
  var none = W.wayDist(f.ax, f.ay, f.bx, f.by).d, wish = W.wayDist(f.ax, f.ay, f.bx, f.by, true).d, out = [];
  T.bridged[f.key] = true; var bridged = W.wayDist(f.ax, f.ay, f.bx, f.by).d;
  if (isFinite(none)) out.push('crossable without a bridge: ' + none);
  if (!isFinite(wish)) out.push('the imagined crossing has no cost');
  if (!isFinite(bridged) || bridged > f.w + 3) out.push('over the bridge costs ' + bridged + ' for ' + f.w + ' tiles of water');
  return out.join('; ');
}]);
UNITS.push(['a worked-out pit on wet ground becomes a pond; on dry ground it settles into poor ground (B7)', function () {
  var W = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'lakeland' }), N = W.N, wet = -1, dry = -1, i, T = W.S.tribe;
  for (i = 0; i < N * N; i++) { if (W.water[i] || W.field[i] || W.owner[i]) continue; if (wet < 0 && W.bank[i] > 0.6) wet = i; if (dry < 0 && W.bank[i] === 0 && W.soil[i] < 0.9 && Math.abs(i % N - T.x) > 6) dry = i; }
  W.pit[wet] = 0.6; W.rock[wet] = 0.05; W.pit[dry] = 0.6; W.rock[dry] = 0.05;
  for (i = 0; i < 24 * 15; i++) W.tick();
  var out = [];
  if (!W.water[wet]) out.push('wet pit at ' + (wet % N) + ',' + ((wet / N) | 0) + ' did not fill');
  if (W.water[dry]) out.push('dry pit filled with water'); else if (W.pit[dry] > 0.1) out.push('dry pit still ' + W.pit[dry].toFixed(2) + ' deep after 15 years');
  if (W.water[wet] && W.mass[wet] !== -1) out.push('the new pond is still counted as dry land');
  return out.join('; ');
}]);
UNITS.push(['around() finds exactly the creatures a scan of the whole world finds (D1)', function () {
  var W = Eden.create(5, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'forest' }), i, bad = 0;
  for (i = 0; i < 24 * 10; i++) W.tick();
  /* positions move during a step; compare against the per-tile lists as they stand after one more */
  W.tick(); var live = W.S.agents.filter(function (a) { return a.alive && W.cells[a.y * W.N + a.x].indexOf(a) >= 0; });
  live.slice(0, 40).forEach(function (a) { [3, 5, 12].forEach(function (r) {
    var got = W.around(a, r, function (b) { return b.sp === a.sp; }).length, want = 0;
    for (var c = 0; c < W.cells.length; c++) { var cx = c % W.N, cy = (c / W.N) | 0; if (Math.max(Math.abs(cx - a.x), Math.abs(cy - a.y)) > r) continue; W.cells[c].forEach(function (b) { if (b.alive && b !== a && b.sp === a.sp) want++; }); }
    if (got !== want) bad++; }); });
  return bad ? bad + ' of 120 lookups differ' : '';
}]);
UNITS.push(['known land starts small round the camp and grows; strangers to an empty valley know nothing (D2)', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'forest' }), N = W.N, i, out = [];
  var share = function () { var k = 0; for (var j = 0; j < N * N; j++) k += W.known[j]; return k / (N * N); };
  for (i = 0; i < 24; i++) W.tick(); var y1 = share();
  var y20 = 0; for (i = 0; i < 24 * 19; i++) { W.tick(); y20 = Math.max(y20, share()); }   /* the most known before any emptying */
  if (!(y1 > 0 && y1 < 0.3)) out.push('year 1 known ' + Math.round(y1 * 100) + '%');
  if (!(y20 > y1)) out.push('year 20 known ' + Math.round(y20 * 100) + '% is not more than year 1');
  W.G.cull('human', 1); for (i = 0; i < 24 * 8 && !/^Two strangers/.test((W.S.log[W.S.log.length - 1] || {}).text || ''); i++) W.tick();
  var after = share(); if (after > 0.3) out.push('after resettling ' + Math.round(after * 100) + '% is still known');
  return out.join('; ');
}]);
UNITS.push(['the land at 40, 96 and 128: water drains to the edge or a lake, never uphill; each dry piece joined by banks of one level (H1)', function () {
  var out = [];
  [40, 96, 128].forEach(function (size) { ['valley', 'plains', 'forest', 'lakeland', 'highland'].forEach(function (land) {
    var W = Eden.create(1, { land: land, size: size }), N = W.N, bad = [];
    for (var i = 0; i < N * N; i++) {
      /* follow the drainage from every water tile: it must reach the map edge, never climbing */
      if (W.water[i]) { var c = i, g = 0; while (W.flowTo[c] >= 0 && g++ < N * N) { var f = W.flowTo[c]; if (W.filled[f] > W.filled[c] + 1e-9) { bad.push('uphill at ' + (c % N) + ',' + ((c / N) | 0)); break; } c = f; } var x = c % N, y = (c / N) | 0; if (!(x === 0 || y === 0 || x === N - 1 || y === N - 1)) bad.push('no outlet from ' + (i % N) + ',' + ((i / N) | 0)); }
      if (bad.length) break;
    }
    /* banks: on each dry piece, every tile reachable from every other by steps of at most one level */
    var comp = new Int32Array(N * N).fill(-1), byMass = {}, L = function (j) { return Math.floor(W.height[j]); };
    for (var s0 = 0; s0 < N * N && !bad.length; s0++) { if (W.water[s0] || comp[s0] >= 0) continue; var st = [s0]; comp[s0] = s0;
      while (st.length) { var c2 = st.pop(), x2 = c2 % N; [x2 > 0 ? c2 - 1 : -1, x2 < N - 1 ? c2 + 1 : -1, c2 - N, c2 + N].forEach(function (n) { if (n >= 0 && n < N * N && !W.water[n] && comp[n] < 0 && Math.abs(L(n) - L(c2)) <= 1) { comp[n] = s0; st.push(n); } }); }
      var m = W.mass[s0]; if (byMass[m] !== undefined && byMass[m] !== s0) bad.push('land at ' + (s0 % N) + ',' + ((s0 / N) | 0) + ' is cut off by a cliff'); else byMass[m] = s0; }
    if (bad.length) out.push(land + ' at ' + size + ': ' + bad.slice(0, 2).join('; '));
  }); });
  return out.join(' | ');
}]);
UNITS.push(['strike leaves meat from an animal, logs from a tree, stone from rock; logs near the village get used', function () {
  var W = Eden.create(3, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'forest', size: 96 }), N = W.N, T = W.S.tribe, i, out = [];
  for (i = 0; i < 24 * 8; i++) W.tick();
  var deer = W.S.agents.filter(function (a) { return a.alive && !a.d.people && W.cells[a.y * N + a.x].indexOf(a) >= 0; })[0];
  if (deer) { W.G.strike(deer.x, deer.y); if (!W.S.piles.some(function (p) { return p.kind === 'meat'; })) out.push('no meat where a ' + deer.sp + ' was struck'); }
  var tj = -1; for (var r = 1; r < 6 && tj < 0; r++) for (var dy = -r; dy <= r && tj < 0; dy++) for (var dx = -r; dx <= r; dx++) { var j = (T.y + dy) * N + T.x + dx; if (W.tree[j] > 0.3) { tj = j; break; } }
  if (tj >= 0) { W.G.strike(tj % N, (tj / N) | 0); if (W.tree[tj] > 0) out.push('the struck tree still stands'); if (!W.S.piles.some(function (p) { return p.kind === 'wood' && p.x === tj % N; })) out.push('no logs where the tree fell'); }
  var rj = -1; for (i = 0; i < N * N && rj < 0; i++) if (W.rock[i] >= 0.15 && !W.water[i] && W.tree[i] <= 0.1) rj = i;
  if (rj >= 0) { W.G.strike(rj % N, (rj / N) | 0); if (!W.S.piles.some(function (p) { return p.kind === 'stone'; })) out.push('no stone where rock was struck'); }
  var before = W.S.piles.filter(function (p) { return p.kind === 'wood'; }).reduce(function (t, p) { return t + p.amt; }, 0);
  for (i = 0; i < 24 * 2; i++) W.tick();
  var after = W.S.piles.filter(function (p) { return p.kind === 'wood'; }).reduce(function (t, p) { return t + p.amt; }, 0);
  if (tj >= 0 && !(after < before)) out.push('logs by the village untouched after 2 years (' + before.toFixed(1) + ')');
  return out.join('; ');
}]);
UNITS.push(['a route exists between any two land tiles on the same piece of land, and never crosses open water (E1)', function () {
  var out = [];
  [40, 96].forEach(function (size) { ['valley', 'lakeland', 'highland'].forEach(function (land) {
    var W = Eden.create(2, { land: land, size: size }), N = W.N, cnt = {}, i, k, bad = 0, n = 0;
    for (i = 0; i < N * N; i++) cnt[W.mass[i]] = (cnt[W.mass[i]] || 0) + 1;
    /* every 37th land tile against every 53rd, on the same piece of land */
    for (i = 0; i < N * N && n < 60; i += 37) { if (W.water[i] || cnt[W.mass[i]] < 30) continue; for (k = 11; k < N * N && n < 60; k += 53 * 7) { if (W.water[k] || W.mass[k] !== W.mass[i]) continue; var r = W.route(i % N, (i / N) | 0, k % N, (k / N) | 0); n++; if (!r.reached || r.tiles.some(function (j) { return W.water[j]; })) bad++; } }
    if (bad) out.push(land + ' at ' + size + ': ' + bad + ' of ' + n + ' routes failed');
  }); });
  return out.join('; ');
}]);
UNITS.push(['strike hits the creature aimed at wherever it is; a pile set down by the fire goes into the store', function () {
  var W = Eden.create(3, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley' }), i, out = [], T = W.S.tribe;
  for (i = 0; i < 24 * 3; i++) W.tick();
  var a = W.S.agents.filter(function (b) { return b.alive && !b.d.people; })[0];
  W.G.strike(0, 0, a.id); if (a.alive) out.push('the aimed ' + a.sp + ' is still alive');
  var p = W.S.piles.filter(function (q) { return q.kind === 'meat'; })[0];
  if (!p) out.push('no meat left'); else { var s0 = T.store, amt = p.amt; W.G.movePile(p.x, p.y, 'meat', T.x, T.y); if (!(T.store > s0 + amt - 0.01)) out.push('store went ' + s0.toFixed(2) + ' to ' + T.store.toFixed(2)); }
  return out.join('; ');
}]);
UNITS.push(['people are where their work is: at the place they gather, beside the water they fish, at the door when they bring food home (E2)', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley', size: 96 }), N = W.N, i, bad = [], seen = 0;
  for (i = 0; i < 24 * 6; i++) W.tick();
  for (i = 0; i < 24 * 4; i++) { W.tick(); W.S.agents.forEach(function (a) { if (!a.alive || !a.d.people || !a.act) return; var k = a.act.k;
    if (k === 'gather' && (a.x !== a.act.x || a.y !== a.act.y)) bad.push(a.name + ' gathers at ' + a.act.x + ',' + a.act.y + ' but stands at ' + a.x + ',' + a.y);
    if (k === 'fish' && Math.max(Math.abs(a.x - a.act.x), Math.abs(a.y - a.act.y)) > 1) bad.push(a.name + ' fishes ' + a.act.x + ',' + a.act.y + ' from ' + a.x + ',' + a.y);
    if (k === 'home') { var h = W.S.tribe.sites.filter(function (q) { return q.id === a.house; })[0], d = h || W.S.tribe; if (a.x !== d.x || a.y !== d.y) bad.push(a.name + ' brought food home but stands at ' + a.x + ',' + a.y); }
    if (k === 'gather' || k === 'fish' || k === 'home') seen++; }); }
  return bad.length ? bad.length + ' of ' + seen + ': ' + bad.slice(0, 2).join('; ') : (seen ? '' : 'no gathering or fishing seen');
}]);
function runUnits() {
  var rows = [];
  for (var i = 0; i < UNITS.length; i++) { var msg; try { msg = UNITS[i][1](); } catch (e) { msg = 'threw: ' + (e && e.message || e); }
    rows.push({ world: 'units', land: '', seed: 0, check: UNITS[i][0], kind: 'hard', status: msg ? 'fail' : 'pass', detail: msg || '' }); }
  return rows;
}

function start() {
  if (running) return;
  running = true;
  var runs = [], li, si, t0 = now(), at = 0;
  for (li = 0; li < CONFIG.lands.length; li++) for (si = 0; si < CONFIG.seeds.length; si++) runs.push(new WorldRun(CONFIG.lands[li], CONFIG.seeds[si]));
  for (li = 0; li < CONFIG.extraWorlds.length; li++) runs.push(new WorldRun(CONFIG.extraWorlds[li].land, CONFIG.extraWorlds[li].seed, CONFIG.extraWorlds[li].years, CONFIG.extraWorlds[li].size));
  window.EdenTests = { done: false, passed: 0, failed: 0, warnings: 0, skipped: 0, results: [], worlds: [], config: CONFIG, ms: 0, summary: '' };
  var body = $('results'); if (body) body.textContent = '';
  var unitRows = runUnits(); Array.prototype.push.apply(window.EdenTests.results, unitRows); showWorld({ label: 'units', rows: unitRows, summary: '' });
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
