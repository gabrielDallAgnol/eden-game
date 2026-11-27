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
  worldOptions: { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3 },   // as the game creates its world; `land` is added per world
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
  add('chopped', 'timber is only ever gained from trees: someone chopping, or picking up logs where trees were felled');
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
  /* felled now, or picked up from logs lying where trees were felled before (a cleared field, a strike, a roof taken down) */
  var chop = S.agents.some(function (a) { return a.act && (a.act.k === 'chop' || (a.act.k === 'fetch' && a.act.item === 'log')) && (a.alive || a.d.people); });   /* a chopper may die later in the same step */
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
    var home = W.mass[T.y * N + T.x], ok = {}, deck = {}; ok[home] = 1; W.fords().forEach(function (f) { if (T.bridged[f.key]) { if (f.ma === home) ok[f.mb] = 1; if (f.mb === home) ok[f.ma] = 1; if (ok[f.ma] || ok[f.mb]) f.tiles.forEach(function (t) { deck[t] = 1; }); } });
    /* standing on a bridge that joins the camp's ground is not being cut off */
    var bad = 0, ex = ''; L.list.forEach(function (a) { if (a.d && a.d.people && !ok[W.mass[a.y * N + a.x]] && !deck[a.y * N + a.x]) { bad++; if (!ex) ex = who(a) + ' at ' + a.x + ',' + a.y; } });
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
    if (k && k.trades > 30 && k.failRate >= 15) c.ok()   /* stored rounded to a tenth: the place itself saw more than 15 */; else c.fail(at + T.coin + ' became coin with ' + JSON.stringify(k));
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
/* demog: 'old' in a unit's world means the fast-growing demography from before sickness (see OLD_DEMOG in src/sim.js): used where a
   check needs a large place, or children who all live, within a few decades. Everything else runs on the game's own demography */
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
      T.hay = 30; /* a winter's hay for six beasts: the herder feeds hay, not the people's food */ T.sites.push({ id: 777777, x: px, y: py, kind: 'pen', stage: 1, wood: 0, stone: 0, larder: 0, members: 0, cold: 0, hunger: 0, fuel: 0, lit: -1, was: '', lake: false }); }
    for (i = 0; i < 14; i++) {
      if (withPen) { var h = S.agents.filter(function (a) { return a.alive && a.d.people && a.age >= 16 && a.age <= 46; }).sort(function (p, q) { return (q.job === 'herder') - (p.job === 'herder'); })[0]; if (h) h.job = 'herder'; }
      else S.agents.forEach(function (a) { if (a.job === 'herder') a.job = ''; });
      W.tick(); }
    return [n, S.agents.filter(function (a) { return a.alive && a.tame; }).length, S.popPeople];
  };
  var out = [], without = 0, withP = 0, tamed = 0, used = 0;
  /* worlds where people are living at that moment (a world waiting to be resettled has no one to keep beasts) */
  [[1, 'valley'], [3, 'forest'], [2, 'valley'], [1, 'lakeland'], [2, 'forest']].forEach(function (w) { if (used >= 2) return; var a = run(false, w[0], w[1]); if (a[2] < 4) return; var b = run(true, w[0], w[1]); used++; tamed += a[0]; without += a[1]; withP += b[1]; out.push(w[1] + ' ' + w[0] + ': ' + a[1] + ' of ' + a[0] + ' without, ' + b[1] + ' of ' + b[0] + ' with'); });
  if (used < 2) return 'fewer than two worlds with people at year 6';
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
  var W, T, N, i, w, worlds = [[1, 'lakeland'], [1, 'valley'], [1, 'plains'], [2, 'forest']], notes = [], wells = 0;
  for (w = 0; w < worlds.length; w++) { var wl = null; W = Eden.create(worlds[w][0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: worlds[w][1], size: 96 }); T = W.S.tribe; N = W.N;
    for (i = 0; i < 24 * 50 && !wl; i++) { W.tick(); if (i % 24 === 0) wl = T.sites.filter(function (q) { return q.kind === 'well' && q.stage >= 2; })[0] || null; }
    if (!wl) continue; wells++;
    T.skills.irrigation = true; for (i = 0; i < 24 * 4; i++) W.tick();
    var dug = 0; for (i = 0; i < N * N; i++) dug += T.ditch[i]; if (!dug) { notes.push(worlds[w][1] + ': no ditch dug in four years'); continue; }
    var nN = 0;
    for (i = 0; i < N * N; i++) if (W.field[i]) { var by = false, x = i % N, y = (i / N) | 0, dx, dy; for (dy = -2; dy <= 2; dy++) for (dx = -2; dx <= 2; dx++) if (T.ditch[(y + dy) * N + x + dx]) by = true; if (by) nN++; }
    if (nN) return '';   /* a place where the ditch reached its fields */
    notes.push(worlds[w][1] + ': ' + dug + ' ditch tiles, none beside a field yet');
  }
  return wells ? notes.join('; ') : 'no well by year 50 in four worlds';
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
UNITS.push(['a bad harvest raises the price of grain (H2): with most of the grain gone, grain is dearer by the next season than in the same place untouched', function () {
  var out = [], dearer = 0, lived = 0;
  [[1, 'lakeland'], [2, 'valley'], [1, 'valley'], [1, 'plains'], [2, 'lakeland'], [1, 'forest']].forEach(function (w) {
    var run = function (loss) { var W = Eden.create(w[0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, demog: 'old', yearK: 3, land: w[1], size: 96 }), S = W.S, T = S.tribe, i;
      for (i = 0; i < 24 * 40; i++) W.tick();
      if (!S.popPeople || !T.price) return null;
      /* every holder is given grain first, the same in both runs, so that there is a harvest to lose */
      [T].concat(T.sites.filter(function (q) { return q.members > 0; })).forEach(function (o) { var f = o === T ? 'store' : 'larder', m = W.mixOf(o, f), g = 2 * (o === T ? S.popPeople : o.members); m.grain += g; o[f] = (o[f] || 0) + g; });
      if (loss) { var cut = function (o, f) { if (!(o[f] > 0)) return; var m = W.mixOf(o, f), g = m.grain * 0.8; m.grain -= g; o[f] -= g; }; cut(T, 'store'); T.sites.forEach(function (q) { cut(q, 'larder'); }); }
      /* on to the next season's prices (the season clock: under a long summer a season is more than six steps) */
      do W.tick(); while (!S.newQuarter); return T.price.grain / T.price.veg; };
    var a = run(false), b = run(true); if (a === null || b === null) { out.push(w[1] + ' ' + w[0] + ': nobody there at year 40'); return; }
    lived++; out.push(w[1] + ' ' + w[0] + ': ' + a.toFixed(3) + ' as it was, ' + b.toFixed(3) + ' with half its grain gone'); if (b > a) dearer++; });
  if (lived < 3) return 'only ' + lived + ' worlds with people at year 40: ' + out.join('; ');
  return dearer >= Math.max(3, Math.ceil(lived * 0.6)) ? '' : 'grain dearer in only ' + dearer + ' of ' + lived + ': ' + out.join('; ');
}]);
UNITS.push(['after a bad harvest more hands go to the fields the next year (H3)', function () {
  var run = function (blight, seed, land) { var W = Eden.create(seed, { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: land, size: 96 }), S = W.S, N = W.N, i, j, f = 0;
    for (i = 0; i < 24 * 40; i++) W.tick(); while (S.cal % 1 > 0.05) W.tick();
    /* one calendar year blighted (the season clock, not the life clock: summer is long), then on to next summer's sowing */
    var c0 = S.cal; while (S.cal < c0 + 1) { if (blight) for (j = 0; j < N * N; j++) if (W.field[j]) W.grass[j] = 0; W.tick(); }
    while (S.cal < c0 + 1.6) W.tick(); for (j = 0; j < N * N; j++) f += W.field[j];
    var hands = S.agents.filter(function (a) { return a.alive && a.d.people && a.age >= 8 && a.age <= 60; }).length; return f / Math.max(1, hands); };   /* per working hand: a bad year also kills */
  var out = [], ok = true;
  var sa = 0, sb = 0; [[1, 'lakeland'], [1, 'valley'], [2, 'valley']].forEach(function (w) { var a = run(false, w[0], w[1]), b = run(true, w[0], w[1]); sa += a; sb += b; out.push(w[1] + ' ' + w[0] + ': ' + a.toFixed(2) + ' field tiles a hand sown after a normal year, ' + b.toFixed(2) + ' after a blighted one'); });
  return sb > sa ? '' : out.join('; ');   /* taken together: one world's history can hide it */
}]);
UNITS.push(['once there is a market, trips to it show up in the households\' trip counts (H4)', function () {
  var worlds = [[1, 'plains'], [2, 'plains'], [2, 'valley']], W, T, i, w, none = [];
  for (w = 0; w < worlds.length; w++) { W = Eden.create(worlds[w][0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: worlds[w][1], size: 96 }); T = W.S.tribe;
    for (i = 0; i < 24 * 70; i++) W.tick(); if (T.market) break; none.push(worlds[w][1] + ' ' + worlds[w][0] + ' (coin ' + T.coin + ')'); }
  if (!T.market) return 'no market by year 70 in ' + none.join(', ');
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
UNITS.push(['a growing place raises a hall where a trusted elder sits as mayor, and a shrine for its dead (then a church)', function () {
  var W, T, i, w, worlds = [[1, 'plains'], [1, 'valley'], [1, 'lakeland'], [2, 'forest']], tried = [];
  var up = function (k) { return T.sites.some(function (q) { return q.kind === k && q.stage >= W.BUILDINGS[k].stages.length; }); };
  for (w = 0; w < worlds.length; w++) { W = Eden.create(worlds[w][0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, demog: 'old', yearK: 3, land: worlds[w][1], size: 96 }); T = W.S.tribe;
    for (i = 0; i < 24 * 80 && !up('hall'); i++) W.tick(); if (up('hall')) break; tried.push(worlds[w][1] + ' ' + worlds[w][0] + ': order ' + T.need.order.toFixed(1)); }
  if (!up('hall')) return 'no hall by year 80 in four worlds (' + tried.join('; ') + ')';
  for (i = 0; i < 24 * 3; i++) W.tick();   /* a little while for an elder to be chosen */
  var e = W.S.agents.filter(function (a) { return a.alive && a.job === 'elder'; }); if (e.length !== 1) return e.length + ' elders in the hall';
  if (!up('shrine') && !up('church')) return 'a hall but no shrine or church (rites known: ' + !!T.skills.rites + ')';
  if (!W.S.log.some(function (l) { return /first mayor/.test(l.text); })) return 'the first mayor is not told';
  return '';
}]);
UNITS.push(['wild prey live in cover and away from people, and the deer last: 10 or more at year 30 in most worlds', function () {
  var worlds = [[1, 'valley'], [1, 'lakeland'], [2, 'forest'], [1, 'plains']], kept = 0, out = [], w, i;
  for (w = 0; w < worlds.length; w++) { var W = Eden.create(worlds[w][0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, demog: 'old', land: worlds[w][1], size: 96 }), N = W.N, T = W.S.tribe;
    for (i = 0; i < 24 * 30; i++) W.tick();
    var deer = W.S.agents.filter(function (a) { return a.alive && a.sp === 'deer' && !a.tame; }), cov = function (j) { return Math.min(0.8, W.tree[j] * 0.8 + W.grass[j] * 0.25); };
    var land = 0, n = 0, j; for (j = 0; j < N * N; j++) if (!W.water[j]) { land += cov(j); n++; }
    var under = deer.reduce(function (p, a) { return p + cov(a.y * N + a.x); }, 0) / Math.max(1, deer.length), near = deer.filter(function (a) { return Math.hypot(a.x - T.x, a.y - T.y) < 8; }).length;
    out.push(worlds[w][1] + ' ' + worlds[w][0] + ': ' + deer.length + ' deer, cover ' + under.toFixed(2) + ' against ' + (land / n).toFixed(2) + ', ' + near + ' by the camp');
    if (deer.length >= 10) kept++; if (deer.length >= 10 && !(under > land / n)) return 'deer stand in less cover than the land: ' + out[out.length - 1]; }
  return kept >= 3 ? '' : 'deer kept in only ' + kept + ' of 4 worlds: ' + out.join('; ');
}]);
UNITS.push(['cattle live on, wild or kept, a calf is brought home from the hunt, the herd is milked at the pen, and a dairy makes cheese', function () {
  var worlds = [[2, 'plains'], [2, 'highland'], [1, 'lakeland'], [1, 'valley']], best = null, out = [], w, i;
  for (w = 0; w < worlds.length && !best; w++) { var W = Eden.create(worlds[w][0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: worlds[w][1], size: 96 }), T = W.S.tribe;
    for (i = 0; i < 24 * 80; i++) W.tick();
    var wild = W.S.agents.filter(function (a) { return a.alive && a.sp === 'cow' && !a.tame; }).length; out.push(worlds[w][1] + ' ' + worlds[w][0] + ': ' + wild + ' wild cattle, ' + (W.S.stat.calves || 0) + ' calves caught, milked ' + Math.round(T.milked || 0));
    var kept = W.S.agents.filter(function (a) { return a.alive && a.sp === 'cow' && a.tame; }).length;
    if (wild + kept < 3) return 'cattle all but gone at year 80, wild or kept: ' + out[out.length - 1];
    if ((T.milked || 0) > 50 && T.sites.some(function (q) { return q.kind === 'dairy'; }) && (W.mixOf(T, 'store').cheese > 0 || T.skills.cheese)) best = out[out.length - 1]; }
  return best ? '' : 'no place milked its cattle and made cheese in 80 years: ' + out.join('; ');
}]);
UNITS.push(['a couple with no roof who went short leave the valley at sowing with their small children; it is not a death, and a fed household with fields stays', function () {
  var worlds = [[1, 'plains'], [1, 'valley'], [2, 'forest']], W, T, S, i, w, P, a, q;
  for (w = 0; w < worlds.length; w++) { W = Eden.create(worlds[w][0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: worlds[w][1], size: 96 }); S = W.S; T = S.tribe;
    for (i = 0; i < 24 * 40 && !(T.skills.farm && T.sownYear >= 0 && S.agents.some(function (b) { return b.alive && b.d.people && b.fem && b.partner && b.house; })); i++) W.tick();
    if (T.skills.farm) break; }
  if (!T.skills.farm) return 'no farming in 40 years in three worlds';
  P = S.agents.filter(function (b) { return b.alive && b.d.people; });
  a = P.find(function (b) { return b.fem && b.partner && b.house; }); if (!a) return 'no couple under a roof';
  q = S.byId.get(a.partner); var kids = P.filter(function (b) { return b.age < b.d.mature && (b.mom === a.id || b.dad === q.id); });
  var stay = T.sites.find(function (h) { return h.members > 0 && h.id !== a.house && h.fields > 0; });
  var deaths0 = Object.keys(S.deaths).reduce(function (p, k) { return p + (/^human/.test(k) ? S.deaths[k] : 0); }, 0), year = T.sownYear;
  for (i = 0; i < 24 * 2 && T.sownYear === year; i++) { [a, q].concat(kids).forEach(function (b) { if (b.alive) { b.house = 0; b.shortT = 1; } }); W.tick(); }
  if (T.sownYear === year) return 'no sowing within two years';
  if (a.alive || q.alive) return 'the couple is still here after sowing';
  if (!a.left || !q.left) return 'the couple is gone but not marked as having left';
  if (kids.some(function (b) { return b.alive && b.age < b.d.mature; })) return 'their small children stayed behind';   /* one grown up by the time they went may stay */
  var deaths1 = Object.keys(S.deaths).reduce(function (p, k) { return p + (/^human/.test(k) ? S.deaths[k] : 0); }, 0);
  if (deaths1 - deaths0 > 3) return (deaths1 - deaths0) + ' deaths counted around the leaving';
  if (stay && !S.agents.some(function (b) { return b.alive && b.house === stay.id; })) return 'a household with fields left too';
  if (!S.log.some(function (l) { return /left the valley to find land/.test(l.text); })) return 'the leaving is not told';
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
  var W = Eden.create(1, { land: 'valley' }), T = W.S.tribe, f = W.fords().filter(function (q) { return !q.same; })[0];
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
  var W, N, T, i, out = [], wl = [[3, 'forest'], [2, 'forest'], [2, 'valley'], [1, 'plains']];
  for (var k = 0; k < wl.length; k++) { W = Eden.create(wl[k][0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, demog: 'old', yearK: 3, land: wl[k][1], size: 96 }); N = W.N; T = W.S.tribe; for (i = 0; i < 24 * 8; i++) W.tick(); if (W.S.popPeople >= 4) break; }   /* a place with hands to fetch the logs */
  var deer = W.S.agents.filter(function (a) { return a.alive && !a.d.people && W.cells[a.y * N + a.x].indexOf(a) >= 0; })[0];
  if (deer) { W.G.strike(deer.x, deer.y); if (!W.S.piles.some(function (p) { return p.kind === 'meat'; })) out.push('no meat where a ' + deer.sp + ' was struck'); }
  /* a tree by a lived-in door, where the household's own fires and building would want the logs (else by the fire) */
  var home = T.sites.filter(function (q) { return q.members > 0; })[0] || T;
  var tj = -1; for (var r = 1; r < 6 && tj < 0; r++) for (var dy = -r; dy <= r && tj < 0; dy++) for (var dx = -r; dx <= r; dx++) { var j = (home.y + dy) * N + home.x + dx; if (W.tree[j] > 0.3) { tj = j; break; } }
  if (tj >= 0) { W.G.strike(tj % N, (tj / N) | 0); if (W.tree[tj] > 0) out.push('the struck tree still stands'); if (!W.S.piles.some(function (p) { return p.kind === 'wood' && p.x === tj % N; })) out.push('no logs where the tree fell'); }
  var rj = -1; for (i = 0; i < N * N && rj < 0; i++) if (W.rock[i] >= 0.15 && !W.water[i] && W.tree[i] <= 0.1) rj = i;
  if (rj >= 0) { W.G.strike(rj % N, (rj / N) | 0); if (!W.S.piles.some(function (p) { return p.kind === 'stone'; })) out.push('no stone where rock was struck'); }
  var before = W.S.piles.filter(function (p) { return p.kind === 'wood'; }).reduce(function (t, p) { return t + p.amt; }, 0);
  for (i = 0; i < 24 * 4; i++) { T.wood = 0; W.tick(); }   /* with no timber in the pile, logs lying by the village are wanted (a plot with trees on it is cleared first) */
  var after = W.S.piles.filter(function (p) { return p.kind === 'wood'; }).reduce(function (t, p) { return t + p.amt; }, 0);
  if (tj >= 0 && !(after < before)) out.push('logs by the village untouched after 4 years (' + before.toFixed(1) + ')');
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
UNITS.push(['two clocks: with yearK 3 a tick is the same stretch of a life, the warm months last longer and the winter keeps its length', function () {
  var A = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley' }), B = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley', yearK: 3 }), i;
  var a0 = A.S.t, b0 = B.S.t; for (i = 0; i < 24; i++) { A.tick(); B.tick(); }
  if (Math.abs((A.S.t - a0) - (B.S.t - b0)) > 1e-9) return 'a life-year is not the same number of ticks';
  /* one whole turn of the seasons, counted in ticks, and how many of them were frosty or warm */
  function turn(W) { var y = Math.floor(W.S.cal) + 1, n = 0, cold = 0, warm = 0; while (Math.floor(W.S.cal) < y) W.tick(); while (Math.floor(W.S.cal) < y + 1) { W.tick(); n++; if (W.S.air < 0) cold++; if (W.S.air > 12) warm++; } return { n: n, cold: cold, warm: warm }; }
  var ta = turn(A), tb = turn(B);
  if (ta.n !== 24) return 'a plain year took ' + ta.n + ' ticks, not 24';
  if (tb.n < 40 || tb.n > 56) return 'a year with yearK 3 took ' + tb.n + ' ticks (expected about 48)';
  if (tb.warm < 2.2 * ta.warm) return 'the warm months did not stretch: ' + tb.warm + ' warm ticks against ' + ta.warm;
  if (tb.cold > 1.5 * ta.cold + 1) return 'the winter stretched: ' + tb.cold + ' frosty ticks against ' + ta.cold;
  return '';
}]);
UNITS.push(['a building rises only under a builder standing at its plot, stage by stage over several steps', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'plains', size: 96, yearK: 3 }), S = W.S, T = S.tribe, i, prev = new Map(), rose = 0, bad = '', steps = new Map();
  for (i = 0; i < 24 * 25 && !bad; i++) {
    W.tick();
    var at = new Map(); S.agents.forEach(function (b) { if (b.alive && b.act && b.act.k === 'build' && b.act.site) { if (!at.has(b.act.site)) at.set(b.act.site, []); at.get(b.act.site).push(b); } });
    T.sites.forEach(function (s) { var p = prev.get(s.id), now = s.stage + (s.part || 0);
      if (p !== undefined && s.kind === p.kind && now > p.v + 1e-9) { rose++; var who = at.get(s.id) || [];
        if (!who.length) bad = s.kind + ' ' + s.id + ' rose at tick ' + i + ' with nobody building it';
        else if (!who.some(function (b) { return Math.max(Math.abs(b.x - s.x), Math.abs(b.y - s.y)) <= 1; })) bad = 'the builder of ' + s.kind + ' ' + s.id + ' is not at its plot';
        if (s.stage > p.stage) steps.set(s.id, (steps.get(s.id) || 0) + 1); }
      prev.set(s.id, { v: now, kind: s.kind, stage: s.stage }); });
  }
  if (bad) return bad;
  if (rose < 10) return 'only ' + rose + ' steps of building seen in 25 years';
  /* stages are put up over more than one step (a skilled builder with a tool finishes a light one in one): there were more
     steps of rising than stages completed */
  var stages = 0; steps.forEach(function (v) { stages += v; });
  if (rose <= stages) return rose + ' steps of building for ' + stages + ' stages: stages go up in one go';
  return '';
}]);
UNITS.push(['with sticks and stones three grown people stand against a wolf and kill or drive it off; two who do not yet know wolves back away', function () {
  var W = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, land: 'valley', size: 96, yearK: 3 }), S = W.S, i, tries, ok = 0, fled = 0;
  var grownN = function () { return S.agents.filter(function (b) { return b.alive && b.d.people && b.age >= 12 && b.age <= 40; }).length; };
  for (i = 0; i < 24 * 60 && (i < 24 * 8 || grownN() < 5); i++) W.tick();
  S.tribe.lore = 0;
  for (tries = 0; tries < 16; tries++) {
    while (S.tickNo % 4 >= 2) W.tick();   /* the next step is a day step */
    var P = S.agents.filter(function (b) { return b.alive && b.d.people && b.age >= 12 && b.age <= 40; }); if (P.length < 3) return 'fewer than three grown people at try ' + tries;
    var three = tries % 2 === 0, g = three ? P.slice(0, 3) : P.slice(0, 2), x = -1, y = -1, k, c;
    /* somewhere on open dry ground with nobody else within four tiles */
    for (k = 0; k < 400 && x < 0; k++) { c = { x: 4 + ((k * 37) % (W.N - 8)), y: 4 + ((k * 61) % (W.N - 8)) }; if (W.S.tribe && !W.water[c.y * W.N + c.x] && !W.water[c.y * W.N + c.x + 2] && !S.agents.some(function (b) { return b.alive && b.d.people && g.indexOf(b) < 0 && Math.max(Math.abs(b.x - c.x), Math.abs(b.y - c.y)) <= 4; })) { x = c.x; y = c.y; } }
    if (x < 0) return 'no open ground';
    g.forEach(function (b) { b.trip = null; b.x = x; b.y = y; b.e = 0.9; b.avenge = 0; });
    var w = W.G.place('wolf', Math.min(W.N - 1, x + 2), y, 3, 0.9); w.fear = 0; S.tribe.lore = 0;
    W.tick();
    if (three && (!w.alive || w.fear > 0)) ok++;
    if (!three && g.every(function (b) { return !b.alive || (b.act && b.act.k === 'flee'); })) fled++;
    if (w.alive) w.alive = false;
  }
  if (ok < 6) return 'three people killed or drove off the wolf only ' + ok + ' times in 8';
  if (fled < 6) return 'two people backed away only ' + fled + ' times in 8';
  return '';
}]);
UNITS.push(['family size is learned at home: children take their mother\'s norm, families shrink over generations where children live, and a couple stops at what it wants', function () {
  var W = Eden.create(1, { resettle: true, startT: 0.3, dayCycle: 4, family: true, demog: 'old', land: 'valley', size: 96, yearK: 3 }), S = W.S, i, seen = {}, early = [], late = [], over = 0, births = 0;
  for (i = 0; i < 24 * 70; i++) {
    var kidsBefore = {}; S.agents.forEach(function (b) { if (b.alive && b.d.people && b.fem && b.partner) kidsBefore[b.id] = S.agents.filter(function (c) { return c.alive && c.d.people && c.mom === b.id; }).length; });
    W.tick();
    S.agents.forEach(function (c) { if (!c.d.people || seen[c.id]) return; seen[c.id] = 1; if (i === 0 || !c.mom) return;   /* strangers from over the hills bring the first norm */
      if (c.norm === undefined) { over += 1000; return; } if (c.norm < 1.5 || c.norm > 9) over += 100;
      (S.t < 25 ? early : S.t > 55 ? late : []).push(c.norm);
      var m = S.byId.get(c.mom); births++;
      /* her other children still alive after the step (one may have died in it, before she gave birth) */
      if (m && m.wantKids !== undefined) { var others = S.agents.filter(function (o) { return o.alive && o.d.people && o.mom === m.id && o !== c && !(seen[o.id] === 1 && o.age < 0.06 && o.id > c.id); }).length; if (others >= m.wantKids) over++; } });
  }
  if (births < 20) return 'only ' + births + ' children born in 70 years';
  if (over) return over + ' children born without a norm, out of range, or past what their mother wanted';
  var mean = function (v) { return v.reduce(function (p, q) { return p + q; }, 0) / v.length; };
  if (!early.length || !late.length) return 'no children born early or late';
  if (!(mean(late) < mean(early) - 0.5)) return 'family size did not fall where children lived: ' + mean(early).toFixed(2) + ' then ' + mean(late).toFixed(2);
  return '';
}]);
UNITS.push(['a small child with water between it and the fire finds the way round (or over a bridge) instead of standing at the bank', function () {
  var out = [], ok = 0, tried = 0;
  [[1, 'valley'], [2, 'valley'], [1, 'lakeland'], [2, 'lakeland']].forEach(function (w) {
    var W = Eden.create(w[0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, demog: 'old', yearK: 3, land: w[1], size: 96 }), S = W.S, T = S.tribe, N = W.N, i, r, dx, dy, k;
    for (i = 0; i < 24 * 15; i++) W.tick();
    var kid = S.agents.filter(function (a) { return a.alive && a.d.people && a.age >= 1 && a.age < 4; })[0]; if (!kid) return;
    var spot = null;
    for (r = 8; r <= 20 && !spot; r++) for (dy = -r; dy <= r && !spot; dy++) for (dx = -r; dx <= r && !spot; dx++) { var x = T.x + dx, y = T.y + dy; if (x < 1 || y < 1 || x >= N - 1 || y >= N - 1 || W.water[y * N + x]) continue;
      var wet = false; for (k = 1; k < r; k++) if (W.water[Math.round(T.y + dy * k / r) * N + Math.round(T.x + dx * k / r)]) wet = true;
      if (wet && W.route(x, y, T.x, T.y, kid, 400).reached) spot = [x, y]; }
    if (!spot) return; tried++;
    kid.x = spot[0]; kid.y = spot[1];
    for (i = 0; i < 90 && kid.alive; i++) { W.tick(); if (Math.max(Math.abs(kid.x - T.x), Math.abs(kid.y - T.y)) <= 2) break; }
    if (Math.max(Math.abs(kid.x - T.x), Math.abs(kid.y - T.y)) <= 2) ok++; else out.push(w[1] + ' ' + w[0] + ': still at ' + kid.x + ',' + kid.y + ' from ' + spot);
  });
  if (tried < 2) return 'only ' + tried + ' worlds with a child and a spot across water';
  return ok === tried ? '' : out.join('; ');
}]);
UNITS.push(['a household living across a river bend from the fire wants a bridge at the narrow place, and gets one: the walk home is cut short', function () {
  var out = [], ok = 0, tried = 0;
  [[1, 'valley'], [4, 'forest'], [6, 'valley'], [2, 'lakeland']].forEach(function (w) {
    if (ok) return;
    var W = Eden.create(w[0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, demog: 'old', yearK: 3, land: w[1], size: 96 }), S = W.S, T = S.tribe, N = W.N, i, dx, dy;
    for (i = 0; i < 24 * 10; i++) W.tick();
    var home = T.sites.filter(function (q) { return !q.upon && (q.kind === 'hut' || q.kind === 'house') && S.agents.some(function (b) { return b.alive && b.house === q.id; }); })[0]; if (!home) return;
    var spot = null, narrow = W.fords().filter(function (f) { return f.same; });
    for (dy = -14; dy <= 14 && !spot; dy++) for (dx = -14; dx <= 14 && !spot; dx++) { var x = T.x + dx, y = T.y + dy; if (x < 2 || y < 2 || x >= N - 2 || y >= N - 2 || W.water[y * N + x]) continue;
      var wd = W.wayDist(T.x, T.y, x, y), st = Math.hypot(dx, dy);
      if (wd.round && isFinite(wd.d) && wd.d > st + 15 && narrow.some(function (f) { return Math.hypot(f.ax - x, f.ay - y) + Math.hypot(f.bx - T.x, f.by - T.y) < wd.d * 0.5 || Math.hypot(f.bx - x, f.by - y) + Math.hypot(f.ax - T.x, f.ay - T.y) < wd.d * 0.5; })) spot = [x, y, wd.d]; }
    if (!spot) return; tried++;
    home.x = spot[0]; home.y = spot[1]; T.skills.bridge = true; T.wood = Math.max(T.wood, 12);
    var y0 = S.cal; while (S.cal < y0 + 4 && !Object.keys(T.bridged).length) W.tick();
    var now = W.wayDist(T.x, T.y, spot[0], spot[1]).d;
    if (Object.keys(T.bridged).length && now < spot[2] * 0.6) ok++; else out.push(w[1] + ' ' + w[0] + ': home at ' + spot[0] + ',' + spot[1] + ' walk ' + spot[2].toFixed(0) + ' -> ' + now.toFixed(0) + ', want ' + T.need.cross.toFixed(2) + ', bridges ' + JSON.stringify(T.bridged));
  });
  if (!tried) return 'no world with a home spot across a bend';
  return ok ? '' : out.join('; ');
}]);
UNITS.push(['rabbits breed only where there is grass for the young: no yearly boom and starving crash; people snare them near their doors', function () {
  var out = [], snared = 0, ratios = [], alive = 0;
  [[1, 'plains'], [1, 'valley']].forEach(function (w) {
    var W = Eden.create(w[0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: w[1], size: 96 }), S = W.S, y, i;
    for (y = 0; y < 30; y++) { var hi = 0, lo = 1e9; for (i = 0; i < 24; i++) { W.tick(); hi = Math.max(hi, S.pop.rabbit | 0); lo = Math.min(lo, S.pop.rabbit | 0); } if (y >= 3) ratios.push(hi / Math.max(1, lo)); }
    if (S.pop.rabbit > 20) alive++; else out.push(w[1] + ' ' + w[0] + ': only ' + (S.pop.rabbit | 0) + ' rabbits at year 30');
    snared += S.stat.snared || 0;
  });
  ratios.sort(function (a, b) { return a - b; }); var mid = ratios[ratios.length >> 1];
  if (mid > 2.5) out.push('rabbits still swing ' + mid.toFixed(1) + ' times over in a typical year');
  if (!snared) out.push('no rabbit snared in two worlds over 30 years');
  return out.join('; ');
}]);
UNITS.push(['a tree holds what it holds: a full stand is 4 timber however it is felled, and a trip brings home no more than one can carry', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: 'forest', size: 96 }), S = W.S, T = S.tribe, N = W.N, i;
  var tree0 = 0, wood0 = T.wood; for (i = 0; i < N * N; i++) tree0 += W.tree[i];
  var piles0 = S.piles.filter(function (p) { return p.kind === 'wood'; }).reduce(function (t, p) { return t + p.amt; }, 0);
  for (i = 0; i < 24 * 30; i++) W.tick();
  if (S.stat.timberN && (S.stat.woodBack || 0) > 2 * 2 * S.stat.timberN + 1e-6) return 'timber trips brought ' + S.stat.woodBack.toFixed(1) + ' in ' + S.stat.timberN + ' trips: more than can be carried';
  var built = 0; T.sites.forEach(function (q) { var K = W.BUILDINGS[q.kind]; if (K) for (var k = 0; k < Math.min(q.stage, K.stages.length); k++) built += K.stages[k].wood || 0; });
  if (T.wood > 200) return 'a pile of ' + T.wood.toFixed(0) + ' timber after 30 years with ' + built + ' built into ' + T.sites.length + ' sites: trees give too much';
  return '';
}]);
UNITS.push(['fields are laid on dry ground all across: no crop on water or on a ditch, and no field round a pool', function () {
  var out = [];
  [[1, 'valley'], [1, 'lakeland']].forEach(function (w) {
    var W = Eden.create(w[0], { resettle: true, startT: 0.3, dayCycle: 4, family: true, demog: 'old', yearK: 3, land: w[1], size: 96 }), S = W.S, N = W.N, D, i, x, y, f, k, n = 0;
    for (i = 0; i < 24 * 40; i++) W.tick(); D = S.tribe.ditch;
    for (i = 0; i < N * N; i++) { if (W.field[i]) n++;
      if (W.field[i] && W.water[i]) out.push(w[1] + ': crop on water at ' + i);
      if (W.field[i] && D && D[i]) out.push(w[1] + ': crop on a ditch at ' + i);
      if (W.water[i] && !W.field[i]) { x = i % N; y = (i / N) | 0; f = 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { k = (y + d[1]) * N + x + d[0]; if (k >= 0 && k < N * N && W.field[k]) f++; }); if (f >= 3) out.push(w[1] + ': water with field on three sides at ' + x + ',' + y); } }
    if (!n) out.push(w[1] + ': no fields in 40 years');
  });
  return out.slice(0, 4).join('; ');
}]);
UNITS.push(['a wood-age world works out nothing of metal, dressed stone or lime, and its ledger adds up to what is in the state', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: 'plains', size: 96, age: 'wood' }), S = W.S, T = S.tribe, i, out = [];
  for (i = 0; i < 24 * 45; i++) W.tick();
  ['tools', 'masonry', 'concrete'].forEach(function (k) { if (T.skills[k]) out.push(k + ' was worked out in a wood-age world'); });
  T.sites.forEach(function (q) { if (/smithy|masonsyard|limekiln|church/.test(q.kind)) out.push('a ' + q.kind + ' stands in a wood-age world'); });
  if (W.ideas().some(function (q) { return /tools|masonry|concrete/.test(q.k); })) out.push('the list of ideas still offers what lies beyond wood');
  var L = W.ledger(), food = T.store, alive = S.agents.filter(function (a) { return a.alive && a.d.people; }).length;
  T.sites.forEach(function (q) { food += q.larder || 0; });
  if (L.people.all !== alive || L.people.men + L.people.women + L.people.children !== alive) out.push('ledger counts ' + L.people.all + ' people, the state has ' + alive);
  if (Math.abs(L.food.all - food) > 0.5) out.push('ledger food ' + L.food.all + ' against ' + food.toFixed(1) + ' in store and larders');
  var homes = 0, k; for (k in L.homes) homes += L.homes[k]; if (!homes) out.push('no homes in the ledger after 45 years');
  var beasts = 0, tame = S.agents.filter(function (a) { return a.alive && !a.d.people; }).length; for (k in L.beasts) beasts += L.beasts[k]; for (k in L.wild) beasts += L.wild[k];
  if (beasts !== tame) out.push('ledger counts ' + beasts + ' animals, the state has ' + tame);
  return out.join('; ');
}]);
UNITS.push(['the hand only lifts and sets down: a tree moves whole, stone on stone lights dry grass, water puts fire out, fire under a timber house takes it, a house is set on a free lot, and those near see it', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: 'plains', size: 96, age: 'wood' }), S = W.S, T = S.tribe, N = W.N, G = W.G, i, out = [], x, y, h, r;
  for (i = 0; i < 24 * 30; i++) W.tick();
  var at = function (ok) { for (var j = 0; j < N * N; j++) if (ok(j)) return j; return -1; }, far = function (j) { return Math.max(Math.abs(j % N - T.x), Math.abs(((j / N) | 0) - T.y)) > 12; };
  /* a tree, whole */
  var t0 = at(function (j) { return W.tree[j] > 0.5 && far(j); }), g0 = at(function (j) { return !W.water[j] && W.tree[j] < 0.05 && far(j) && !W.field[j] && j !== t0; });
  if (t0 < 0 || g0 < 0) return 'no tree or open ground to try'; var amt = W.tree[t0];
  h = G.pick(t0 % N, (t0 / N) | 0); if (!h || h.k !== 'tree' || W.tree[t0] > 0) out.push('the tree was not lifted');
  r = G.drop(h, g0 % N, (g0 / N) | 0); if (r !== 'tree' || Math.abs(W.tree[g0] - amt) > 1e-6) out.push('the tree did not stand where it was put (' + r + ')');
  /* stone on stone over dry grass */
  var d0 = at(function (j) { return !W.water[j] && far(j) && W.tree[j] < 0.05 && j % N > 2 && j % N < N - 3 && j > 3 * N && j < N * N - 3 * N; }); x = d0 % N; y = (d0 / N) | 0;
  for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var j = (y + dy) * N + x + dx; W.grass[j] = 0.9; W.soil[j] = 0.2; W.snow[j] = 0; W.burn[j] = 0; }
  r = G.drop({ k: 'pile', kind: 'stone', amt: 1 }, x, y); if (r !== 'ground') out.push('one stone alone made ' + r);
  r = G.drop({ k: 'pile', kind: 'stone', amt: 1 }, x, y); if (r !== 'spark') out.push('stone on stone made ' + r + ', not a spark');
  var lit = at(function (j) { return W.burn[j] > 0 && Math.abs(j % N - x) <= 1 && Math.abs(((j / N) | 0) - y) <= 1; }); if (lit < 0) out.push('no grass caught from the spark');
  /* fire is lifted, and water puts it out */
  if (lit >= 0) { h = G.pick(lit % N, (lit / N) | 0); if (!h || h.k !== 'fire' || W.burn[lit] > 0) out.push('the fire was not lifted'); G.drop(h, x, y); if (!(W.burn[d0] > 0)) out.push('fire set down did not burn');
    r = G.drop({ k: 'water' }, x, y); if (r !== 'doused' || W.burn[d0] > 0) out.push('water did not put the fire out (' + r + ')'); }
  for (i = 0; i < N * N; i++) W.burn[i] = 0;
  /* a house on a free lot, and the same people in it */
  var q = T.sites.filter(function (u) { return !u.upon && W.BUILDINGS[u.kind].room && u.stage > 0; })[0]; if (!q) return out.concat('no house to try').join('; ');
  var ox = q.x, oy = q.y, id = q.id, n0 = T.sites.length; h = G.pick(ox, oy); if (!h || h.k !== 'site' || h.id !== id) out.push('the house was not lifted');
  r = G.drop(h, ox + 17, oy + 9); if (r !== 'site' && r !== 'back') out.push('the house came down as ' + r);
  if (r === 'site') { if (q.x === ox && q.y === oy) out.push('the house did not move'); if ((q.x - T.x - 2) % 4 || (q.y - T.y - 2) % 4) out.push('the house is off the lattice at ' + q.x + ',' + q.y);
    if (T.sites.some(function (u) { return u !== q && !u.upon && u.x === q.x && u.y === q.y; })) out.push('two buildings on one lot'); }
  if (T.sites.length !== n0 || q.lifted) out.push('the house was lost or left in the air');
  /* fire under it */
  var st = q.stage; for (i = 0; i < 12 && q.stage > 0; i++) { W.burn[q.y * N + q.x] = 1; W.tick(); }
  if (q.stage > 0 && st > 0) out.push('a ' + q.kind + ' stood through a fire under it');
  if (!S.agents.some(function (a) { return a.alive && a.d.people && a.saw > 0; }) || !(W.ledger().faith.haveSeenTheHand > 0)) out.push('nobody saw the hand');
  for (i = 0; i < 24 * 2; i++) W.tick();
  if (S.problems.length) out.push(S.problems[0]);
  return out.join('; ');
}]);
UNITS.push(['sickness comes from fouled, crowded ground: fever and births kill, mostly the young; a roof among many is more exposed than a roof alone; without it nobody dies of fever', function () {
  var mk = function (o) { var W = Eden.create(1, Object.assign({ resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: 'valley', size: 96, age: 'wood' }, o)), i; for (i = 0; i < 24 * 60; i++) W.tick(); return W; };
  var W = mk({}), S = W.S, T = S.tribe, out = [], D = S.deaths, fever = 0, birth = 0, k;
  for (k in D) { if (/^human.*fever/.test(k)) fever += D[k]; if (/^human.*at birth/.test(k)) birth += D[k]; }
  if (!fever) out.push('nobody died of fever in 60 years'); if (!birth) out.push('no child was lost at birth in 60 years');
  if (!(T.kidDied > 0)) out.push('the place remembers no child dying');
  var homes = T.sites.filter(function (q) { return q.members > 0 && q.expo > 0 && !q.upon; }), near = function (q) { return homes.filter(function (u) { return u !== q && Math.abs(u.x - q.x) <= 6 && Math.abs(u.y - q.y) <= 6; }).length; };
  if (homes.length >= 4) { var srt = homes.slice().sort(function (a, b) { return near(a) - near(b); }), lo = srt[0], hi = srt[srt.length - 1];
    if (near(hi) > near(lo) + 1 && !(hi.expo > lo.expo)) out.push('a roof with ' + near(hi) + ' neighbours is exposed to ' + hi.expo.toFixed(1) + ', one with ' + near(lo) + ' to ' + lo.expo.toFixed(1)); }
  else out.push('fewer than 4 lived-in homes at year 60');
  var W2 = mk({ demog: 'old' }), D2 = W2.S.deaths; for (k in D2) if (/^human.*(fever|at birth|childbirth)/.test(k) && D2[k]) out.push('with the old demography, ' + D2[k] + ' died of ' + k);
  if (!(W2.S.popPeople > S.popPeople)) out.push('the place is no smaller with sickness (' + S.popPeople + ') than without (' + W2.S.popPeople + ')');
  return out.join('; ');
}]);
UNITS.push(['what people make of the hand: nobody believes in a world it never touches; a want answered makes belief and trust, harm makes belief and fear; it is told at home', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: 'plains', size: 96, age: 'wood', demog: 'old' }), S = W.S, T = S.tribe, G = W.G, i, out = [];
  for (i = 0; i < 24 * 30; i++) W.tick();
  var P = function () { return S.agents.filter(function (a) { return a.alive && a.d.people; }); };
  if (P().some(function (a) { return a.faith > 0 || a.saw > 0; })) out.push('someone believes before the hand has done anything');
  var L0 = W.ledger().faith; if (L0.believe || L0.haveSeenTheHand) out.push('the ledger counts believers before the hand has done anything');
  /* meat set down by the fire for someone hungry */
  var hungry = P().filter(function (a) { return a.age > 10; })[0]; hungry.e = 0.3; hungry.x = T.x; hungry.y = T.y;
  for (i = 0; i < 4; i++) G.drop({ k: 'pile', kind: 'meat', amt: 3 }, T.x, T.y);
  if (!(hungry.faith > 0.5 && hungry.trust > 0.5)) out.push('the hungry one fed four times: belief ' + (hungry.faith || 0).toFixed(2) + ', trust ' + (hungry.trust || 0).toFixed(2));
  /* a roof taken up and set down elsewhere */
  var q = T.sites.filter(function (u) { return !u.upon && W.BUILDINGS[u.kind].room && u.stage > 0 && P().some(function (a) { return a.house === u.id && a !== hungry && a.house !== hungry.house; }); })[0];
  if (q) { var m = P().filter(function (a) { return a.house === q.id; })[0]; m.x = q.x; m.y = q.y; var t0 = m.trust || 0; for (i = 0; i < 3; i++) { var h = G.pick(q.x, q.y); m.x = q.x; m.y = q.y; G.drop(h, q.x + 9, q.y + 5); m.x = q.x; m.y = q.y; }
    if (!(m.trust < t0 - 0.5 && m.faith > 0.4)) out.push('a household whose roof was moved three times: belief ' + (m.faith || 0).toFixed(2) + ', trust ' + t0.toFixed(2) + ' -> ' + (m.trust || 0).toFixed(2));
    /* told at home over the years */
    var mate = P().filter(function (a) { return a.house === q.id && a !== m; })[0]; if (mate) { mate.faith = 0; mate.trust = 0; for (i = 0; i < 24 * 4; i++) W.tick(); if (mate.alive && m.alive && mate.house === m.house && !(mate.faith > 0.05)) out.push('four years under one roof with a believer and nothing was told'); } }
  else out.push('no second household to try');
  var L = W.ledger().faith; if (!(L.believe >= 1)) out.push('the ledger counts no believer');
  if (!/watches|someone there|nobody touched/.test(W.describe(hungry) || 'watches')) out.push('nothing of it in how the person is described');
  return out.join('; ');
}]);
UNITS.push(['the first question: one who is nearly sure goes to the fire and asks who is there; answered, the name is kept and told; unanswered, they find a word of their own; believers leave food out', function () {
  var mk = function () { var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: 'plains', size: 96, age: 'wood', demog: 'old' }), i; for (i = 0; i < 24 * 30; i++) W.tick(); return W; };
  var feed = function (W) { var S = W.S, T = S.tribe, a = S.agents.filter(function (b) { return b.alive && b.d.people && b.age > 12 && b.age < 30; })[0], i; for (i = 0; i < 12 && !S.ask; i++) { a.e = 0.3; a.x = T.x; a.y = T.y; W.G.drop({ k: 'pile', kind: 'meat', amt: 2 }, T.x, T.y); } return a; };
  var W = mk(), S = W.S, T = S.tribe, out = [], i;
  if (S.ask || T.godName) out.push('a question or a name before the hand has done anything');
  var a = feed(W); if (!S.ask) return 'fed twelve times and nobody asked (belief ' + (a.faith || 0).toFixed(2) + ')';
  var asker = S.agents.filter(function (b) { return b.id === S.ask.id; })[0]; if (!(asker.faith >= 0.8)) out.push('the asker is not sure: ' + asker.faith);
  asker.e = 0.9; for (i = 0; i < 3; i++) W.tick(); if (S.ask && Math.max(Math.abs(asker.x - T.x), Math.abs(asker.y - T.y)) > 3) out.push('the asker did not wait by the fire');
  if (!S.ask) out.push('the question was dropped within three steps');
  var name = W.G.answer('  Gabriel <b> '); if (T.godName !== 'Gabriel b' || S.ask) out.push('the name kept is ' + JSON.stringify(T.godName) + ' (returned ' + JSON.stringify(name) + ')');
  if (!/Gabriel b/.test(W.describe(asker))) out.push('the asker\'s description does not use the name');
  if (W.ledger().godName !== 'Gabriel b') out.push('the ledger does not carry the name');
  T.sites.forEach(function (q) { if (q.members > 0) { q.larder = (q.larder || 0) + q.members * 4; } }); S.agents.forEach(function (b) { if (b.alive && b.d.people) { b.faith = 0.9; b.trust = 0.5; } });
  for (i = 0; i < 24 * 2; i++) W.tick(); if (!(S.stat.offerings > 0)) out.push('believing households with full larders left nothing out in two years');
  /* nobody answers */
  var W2 = mk(), S2 = W2.S; feed(W2); if (!S2.ask) return out.concat('second world: nobody asked').join('; '); var id2 = S2.ask.id;
  S2.agents.forEach(function (b) { if (b.id === id2) b.e = 0.9; }); for (i = 0; i < 20 && S2.ask; i++) { S2.agents.forEach(function (b) { if (b.id === id2) b.e = Math.max(b.e, 0.6); }); W2.tick(); }
  if (S2.ask) out.push('still waiting after twenty steps'); else if (S2.tribe.godName !== 'the Hand') out.push('unanswered, the name is ' + JSON.stringify(S2.tribe.godName));
  return out.join('; ');
}]);
UNITS.push(['later questions: with a name known, a believer brings the trouble that weighs most and asks what to do; the answer is kept as counsel; silence makes them ask less often', function () {
  var W = Eden.create(2, { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: 'plains', size: 96, age: 'wood', demog: 'old' }), S = W.S, T = S.tribe, out = [], i;
  for (i = 0; i < 24 * 30; i++) W.tick();
  var P = function () { return S.agents.filter(function (a) { return a.alive && a.d.people; }); }, year = function () { for (var k = 0; k < 24 && !S.ask; k++) W.tick(); };
  T.need.sick = 5; year(); year(); if (S.ask) out.push('a question was asked before anyone believed or knew a name');
  P().forEach(function (a) { a.faith = 0.9; a.trust = 0.4; }); T.godName = 'Gabriel'; T.need.sick = 5; year(); year();
  if (!S.ask || S.ask.kind !== 'sick') return out.concat('with fever deaths felt and a name known, the question is ' + JSON.stringify(S.ask && S.ask.kind)).join('; ');
  if (!/Gabriel/.test(S.ask.say) || !(S.ask.options.length >= 2)) out.push('the question does not use the name or offers no choice');
  if (W.G.answer('apart') !== 'apart' || !T.counsel || !T.counsel.apart || S.ask) out.push('the answer was not kept as counsel');
  if (W.ledger().counsel.indexOf('apart') < 0) out.push('the ledger does not carry the counsel');
  T.need.sick = 9; year(); if (S.ask) out.push('the same question was asked twice');
  /* a flood takes a house: asked, and nobody answers */
  T.floodT = S.t; T.askT = -9; year(); year(); if (!S.ask || S.ask.kind !== 'flood') return out.concat('after a flood the question is ' + JSON.stringify(S.ask && S.ask.kind)).join('; ');
  var id = S.ask.id, t0 = 0; P().forEach(function (a) { t0 += a.trust; }); for (i = 0; i < 30 && S.ask; i++) { P().forEach(function (a) { if (a.id === id) a.e = Math.max(a.e, 0.6); }); W.tick(); }
  if (S.ask) out.push('still waiting after thirty steps'); if (!(T.askSilent >= 1)) out.push('silence was not remembered'); if (T.counsel.high || T.counsel.stay) out.push('counsel was kept though nothing was said');
  return out.join('; ');
}]);
UNITS.push(['a wide country holds lowland and a mountain range at once, is colder high up, and its far-off beasts live on in coarse steps while people settle', function () {
  var W = Eden.create(4, { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: 'wide', size: 192, age: 'wood', human: 6 }), S = W.S, N = W.N, i, out = [], low = 0, high = 0, hiI = -1, loI = -1;
  for (i = 0; i < N * N; i++) { if (W.height[i] < 2.5) { low++; if (loI < 0 && !W.water[i]) loI = i; } if (W.height[i] > 7) { high++; if (hiI < 0) hiI = i; } }
  if (low < N * N * 0.15) out.push('only ' + Math.round(100 * low / N / N) + '% lowland'); if (high < N * N * 0.03) out.push('only ' + Math.round(100 * high / N / N) + '% above the tree line');
  if (hiI >= 0 && loI >= 0 && !(W.tempAt(hiI) < W.tempAt(loI) - 2)) out.push('the heights are not colder: ' + W.tempAt(hiI).toFixed(1) + ' against ' + W.tempAt(loI).toFixed(1));
  var t0 = Date.now(); for (i = 0; i < 24 * 20; i++) W.tick(); var ms = (Date.now() - t0) / (24 * 20);
  if (!S.popPeople) out.push('nobody alive at year 20'); var T = S.tribe, far = {}; S.agents.forEach(function (a) { if (a.alive && !a.d.people && Math.max(Math.abs(a.x - T.x), Math.abs(a.y - T.y)) > 60) far[a.sp] = (far[a.sp] || 0) + 1; });
  ['deer', 'cow', 'rabbit'].forEach(function (k) { if (!(far[k] >= 5)) out.push('far from the fire only ' + (far[k] || 0) + ' ' + k + ' are left at year 20'); });
  if (ms > 120) out.push('a step takes ' + ms.toFixed(0) + ' ms');
  if (S.problems.length) out.push(S.problems[0]);
  return out.join('; ');
}]);
UNITS.push(['herbs grow by place and their uses are known by people: found when someone at home is ill, only where the herb grows; fewer of the sick die where they are known; with the knowers gone it is gone', function () {
  var run = function (seed, land, tryP) { var W = Eden.create(seed, { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: land, size: 96, age: 'wood', human: 6, herbTry: tryP }), i; for (i = 0; i < 24 * 60; i++) W.tick(); return W; };
  var out = [], ill = [0, 0], dead = [0, 0], found = 0, Wk = null;
  [[1, 'valley'], [1, 'forest']].forEach(function (w) { [0, 0.5].forEach(function (tp, n) { var W = run(w[0], w[1], tp), S = W.S, k; ill[n] += S.stat.ill || 0; for (k in S.deaths) if (/^human.*fever/.test(k)) dead[n] += S.deaths[k];
    if (n) { found += S.stat.herbsFound || 0; if (!Wk && Object.keys(W.ledger().herbs).length) Wk = W; } else if (S.stat.herbsFound || Object.keys(W.ledger().herbs).length) out.push(w[1] + ': herbs known though nobody ever tried one'); }); });
  if (!found || !Wk) return 'nobody found a use for any herb in two worlds over 60 years';
  var r0 = dead[0] / Math.max(1, ill[0]), r1 = dead[1] / Math.max(1, ill[1]); if (!(r1 < r0 * 0.9)) out.push('of the sick, ' + (100 * r1).toFixed(1) + '% died where herbs were known and ' + (100 * r0).toFixed(1) + '% where not');
  var W = Wk, S = W.S, T = S.tribe, N = W.N, P = S.agents.filter(function (a) { return a.alive && a.d.people; }), knowers = P.filter(function (a) { return a.know && Object.keys(a.know).length; });
  /* only herbs that grow on this map are known, and each knower lives where one could have been found or learned it at home */
  var grows = {}; for (var i = 0; i < N * N; i++) if (W.herb[i]) grows[W.HERBS[W.herb[i]].k] = true;
  knowers.forEach(function (a) { Object.keys(a.know).forEach(function (k) { if (!grows[k]) out.push(a.name + ' knows ' + k + ', which does not grow here'); if (!(a.know[k] > 0 && a.know[k] <= 1)) out.push(a.name + ' knows ' + k + ' at ' + a.know[k]); }); });
  if (Object.keys(T.skills).some(function (k) { return grows[k]; })) out.push('a herb is known by the place, not by people');
  if (!/Knows /.test(W.describe(knowers[0]))) out.push('a knower\'s description does not say what they know');
  knowers.forEach(function (a) { a.know = {}; }); if (Object.keys(W.ledger().herbs).length) out.push('with every knower emptied, the ledger still counts knowers');
  return out.slice(0, 4).join('; ');
}]);
UNITS.push(['several bands on one land: each keeps its own fire, fields, store and discoveries; near ones meet, marry across and exchange; a starving band beside a full store raids it; news says which band', function () {
  var W = Eden.create(4, { resettle: true, startT: 0.3, dayCycle: 4, family: true, yearK: 3, land: 'wide', size: 192, age: 'wood', human: 6, bands: 3 }), S = W.S, N = W.N, i, out = [];
  if (S.tribes.length !== 3) return 'asked for 3 bands, got ' + S.tribes.length;
  var pop = function (B) { return S.agents.filter(function (a) { return a.alive && a.d.people && (a.band || 0) === B.band; }).length; };
  S.tribes.forEach(function (B, k) { S.tribes.forEach(function (C, j) { if (j > k && Math.max(Math.abs(B.x - C.x), Math.abs(B.y - C.y)) < 24) out.push('two fires ' + Math.max(Math.abs(B.x - C.x), Math.abs(B.y - C.y)) + ' tiles apart'); }); if (!pop(B)) out.push('band ' + k + ' began with nobody'); if (!B.name) out.push('band ' + k + ' has no name'); });
  for (i = 0; i < 24 * 40; i++) W.tick();
  var alive = S.tribes.slice(0, 3).filter(function (B) { return pop(B) > 0; }); if (alive.length < 2) out.push('only ' + alive.length + ' of 3 bands alive at year 40');
  alive.forEach(function (B) { var ids = {}; B.sites.forEach(function (q) { ids[q.id] = 1; }); if (B.skills.farm) { var f = 0; for (var j = 0; j < N * N; j++) if (W.field[j] && ids[W.owner[j]]) f++; if (!f && B.fields > 0) out.push(B.name + ' farm, count ' + B.fields + ' fields, and have none on the ground'); if (!(B.harvestLog || []).some(function (h) { return h[1] + h[2] > 0; })) out.push(B.name + ' have never brought a harvest in'); } });
  S.agents.forEach(function (a) { if (a.alive && a.d.people && a.house) { var B = S.tribes[a.band || 0]; if (!B.sites.some(function (q) { return q.id === a.house; })) out.push(a.name + ' lives under a roof of another band'); } });
  if (!S.rel || !Object.keys(S.rel).length) out.push('no two bands have met in 40 years'); else if (!(S.stat.crossWed > 0 || S.stat.bandTrades > 0)) out.push('bands met, and neither married across nor exchanged');
  if (!S.log.some(function (e) { return e.band === -1; })) out.push('no news of what passed between bands'); if (S.log.some(function (e) { return e.band === undefined; })) out.push('news with no band');
  /* a raid: one band starving, its neighbour full, and no friendship between them */
  var A = alive[0], B = alive[1]; if (A && B) { var k = Math.min(A.band, B.band) + ':' + Math.max(A.band, B.band); S.rel[k] = S.rel[k] || { v: 0, met: 1, kin: 0, raids: 0 }; S.rel[k].v = -0.2; var r0 = S.stat.raids || 0, sA = 0;
    B.x = A.x + 30; B.y = A.y; for (i = 0; i < 24 * 3 && (S.stat.raids || 0) === r0; i++) { A.store = 0; A.need.hunger = 2; B.store = pop(B) * 3; A.sites.forEach(function (q) { q.larder = 0; }); W.tick(); }
    if ((S.stat.raids || 0) === r0) out.push('a starving band beside a full store, not friends, did not raid in three years'); else if (!(S.rel[k].v < -0.5)) out.push('after a raid the two are not enemies: ' + S.rel[k].v.toFixed(2)); }
  if (S.problems.length) out.push(S.problems[0]);
  return out.slice(0, 5).join('; ');
}]);
})();
