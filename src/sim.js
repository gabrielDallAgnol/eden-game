// Eden: a small valley run by causes, not by outcomes.
//
// There is one outside driver: how high the sun stands over the year. Everything else follows.
//   sun height + local warmth      -> temperature of each piece of ground
//   clouds + temperature           -> rain or snow
//   snow + warmth                  -> meltwater -> wet soil and a rising river -> flood
//   warmth + soil water            -> plants grow, fruit sets, crops ripen
//   body size + what it eats       -> who can eat whom, who hides, who fears whom
// No rule below reads "winter", "summer" or the name of an animal.
(function (root) {

// ---- Living things are rows of traits. A new animal is a new row and nothing else.
// mass: adult body size.  eats: what it can digest.  social: alone | herd | pack | tribe.
// comfort: coldest air (deg C) it shrugs off.  chill: extra hunger per degree below that.
// warmBreed: air must be this warm before young are born.  lateLight: once the days are shortening, no more young
// are born when the sun stands lower than this (2 = only while days lengthen, 0 = any time).  home: the kind of shelter it keeps (burrow, den); it hides and warms itself there.
// sleepsBelow: sleeps through air colder than this.  territory: how much room one family needs.
const SPECIES = {
  rabbit: { mass: 0.6, eats: { grass: 1 }, social: 'alone', home: 'burrow',
    metab: 4.5, bite: 13, speed: 1, sense: 3, mature: 0.5, breedE: 0.84, litter: [2, 3], interval: 0.45, warmBreed: -4.5, lateLight: 0.86,
    life: 3.5, comfort: 0.5, chill: 0.108, wanders: true, start: 40 },
  deer: { mass: 4.5, eats: { grass: 1, browse: 0.6, fruit: 0.5 }, social: 'herd',
    metab: 2.2, bite: 5, speed: 1, sense: 4, mature: 1.5, breedE: 0.8, litter: [1, 1], interval: 0.8, warmBreed: -3, lateLight: 2,
    life: 11, comfort: -2, chill: 0.077, wanders: true, start: 22 },
  wolf: { mass: 6, eats: { meat: 1 }, social: 'pack', territory: 14, home: 'den',
    metab: 1.05, speed: 2, sense: 7, mature: 1.6, breedE: 0.85, litter: [2, 4], interval: 0.8, warmBreed: -5, lateLight: 2,
    life: 9, comfort: -4.7, chill: 0.062, wanders: true, start: 8 },
  human: { mass: 9, eats: { meat: 1, fish: 1, fruit: 1, seed: 1 }, social: 'tribe', people: true,
    metab: 2.2, speed: 1, sense: 6, mature: 13, breedE: 0.7, litter: [1, 1], interval: 2.4, warmBreed: -99, lateLight: 0,
    life: 52, comfort: 5.7, chill: 0.108, start: 2 }
};
// What people can do. Each skill is a small module; later eras add entries here.
const SKILLS = {
  gather: { known: true }, hunt: { known: true }, fish: { known: true }, hut: { known: true }, store: { known: true },
  fire: { known: false, learn: 'sees a tree burn' }, farm: { known: false, learn: 'sees plants made to grow beside the camp' },
  herd: { known: false, learn: 'is given a living animal' }
};

function create(seed, opt) {
  opt = opt || {};
  const SP = opt.species || SPECIES;
  const N = opt.size || 40, TPY = 24;
  let rs = (seed || 1) | 0;
  const rnd = () => { rs = (Math.imul(rs, 1103515245) + 12345) & 0x7fffffff; return rs / 0x7fffffff; };
  const R = (a, b) => a + rnd() * (b - a), clamp = (v, a, b) => v < a ? a : v > b ? b : v, I = (x, y) => y * N + x;
  const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  const F = () => new Float32Array(N * N);
  // the ground
  const water = new Uint8Array(N * N), fert = F(), bank = F(), cells = [];
  // what lies on it and in it
  const soil = F(), snow = F(), heat = F(), burn = F(), flood = new Uint8Array(N * N);
  const grass = F(), tree = F(), fruit = F(), fish = F(), warmSum = F(), field = new Uint8Array(N * N);

  const noise = (x, y, s) => { const h = (a, b) => { let n = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(s, 982451653)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; }; const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * u + (h(xi, yi + 1) - h(xi, yi)) * v + (h(xi, yi) - h(xi + 1, yi) - h(xi, yi + 1) + h(xi + 1, yi + 1)) * u * v; };
  const sd = (seed || 1) * 7 + 3;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = I(x, y), rx = N * 0.62 + Math.sin(y * 0.22 + sd) * 4;
    if (Math.abs(x - rx) < 1.1 || ((x - N * 0.3) / 4.2) ** 2 + ((y - N * 0.7) / 3) ** 2 < 1) water[i] = 1;
    fert[i] = clamp(0.45 + 0.75 * noise(x / 7, y / 7, sd), 0.25, 1);
    const tn = noise(x / 6, y / 6, sd + 9);
    tree[i] = water[i] ? 0 : tn > 0.56 ? clamp((tn - 0.5) * 3, 0, 0.95) : 0;
    grass[i] = water[i] ? 0 : 0.5 * fert[i]; fish[i] = water[i] ? 1 : 0; cells.push([]);
  }
  // how close each piece of ground lies to open water: it decides seepage and what floods first
  for (let i = 0; i < N * N; i++) {
    const x = i % N, y = (i / N) | 0; let d = 9;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; if (water[I(nx, ny)]) d = Math.min(d, Math.hypot(dx, dy)); }
    bank[i] = clamp(1 - d / 5, 0, 1); soil[i] = 0.45 + 0.55 * bank[i];
  }

  const S = { t: opt.startT || 0, agents: [], pop: {}, tribe: { x: 0, y: 0, store: 5, huts: 0, skills: {}, dead: 0, born: 0 }, log: [], deaths: {}, nextId: 1,
    rainY: 1, warmOff: 0, river: 1, air: 0, precip: 0, sky: 'clear', fx: [], emptyT: 0, homes: new Map(), tickNo: 0, night: false, dayK: 1, byId: new Map() };
  const DAY = opt.dayCycle || 0;   // ticks per day (0 = no day and night). Work that is skipped at night is done a little faster by day, so a year holds the same work.
  for (const k in SKILLS) S.tribe.skills[k] = SKILLS[k].known;

  // ---------------------------------------------------------------- physics
  // The only thing given from outside: the height of the sun through the year.
  const sunHeight = () => 0.5 - 0.5 * Math.cos(2 * Math.PI * ((S.t % 1) - 0.08));
  const daysLengthen = () => Math.sin(2 * Math.PI * ((S.t % 1) - 0.08)) > 0;
  const airNow = () => -6 + 26 * sunHeight() + S.warmOff;
  // Temperature of one piece of ground: the air, plus any warmth lying on it, softened under trees, cooled by snow.
  function tempAt(i) {
    let t = S.air + heat[i];
    if (tree[i] > 0.4) t += t < 5 ? 1.5 : t > 24 ? -2 : 0;
    if (snow[i] > 0.15) t -= 1;
    return t;
  }
  const snowBlock = (i, mass) => Math.min(0.5, snow[i] * 0.8) * (mass < 1 ? 1 : 0.6);   // big animals can dig down to the grass
  const cover = i => clamp(tree[i] * 0.8 + grass[i] * 0.25, 0, 0.8);

  function weather(dt) {
    S.air = airNow();
    // clouds come and go on their own; how much they carry is the valley's climate
    S.precip = rnd() < 0.6 ? S.rainY * R(0.6, 1.4) / (0.6 * TPY) : 0;
    S.sky = S.precip > 0 ? (S.air < 0 ? 'snow' : 'rain') : 'clear';
  }

  const FLOOD_AT = 1.8;
  // Open woodland fruits well; a closed canopy puts its strength into wood, not fruit.
  const yieldOf = t => 3.5 * t * (1.1 - t) * (1.1 - t) + 0.25 * t;
  function land(dt) {
    let runoff = 0, nLand = 0;
    for (let i = 0; i < N * N; i++) {
      if (heat[i]) heat[i] *= 1 - Math.min(1, 5 * dt);                // warmth and cold laid on the ground fade
      const T = tempAt(i);
      if (water[i]) {
        const lv = S.river;
        fish[i] = Math.max(0.01, Math.min(1, fish[i] + (1.6 * lv * fish[i] * (1 - fish[i]) + 0.02 - (lv < 0.6 ? (0.6 - lv) * 1.2 * fish[i] : 0)) * dt));
        continue;
      }
      nLand++;
      // --- water: what falls becomes snow on cold ground, rain on warm ground
      let wetIn = 0;
      if (S.precip > 0) { if (T < 0) snow[i] += S.precip; else { wetIn += S.precip * 0.9; runoff += S.precip; } }
      else if (T < -1 && soil[i] > 0.3 && snow[i] < 0.04) snow[i] += 0.02 * dt * TPY * 0.25;   // hoarfrost: a thin white skin from the damp alone
      if (snow[i] > 0 && T > 0) { const melt = Math.min(snow[i], T * 1.0 * dt); snow[i] -= melt; wetIn += melt * 0.9; runoff += melt * 0.7; }
      const evap = 2.2 * (0.4 + Math.max(0, T) / 14) * (1 - 0.3 * tree[i]);
      soil[i] = clamp(soil[i] + wetIn + (10 * bank[i] * (1 - soil[i]) - evap * soil[i]) * dt, 0, 1.4);
      // --- the river leaves its bed when it is carrying too much
      flood[i] = (S.river > FLOOD_AT && bank[i] > 1 - (S.river - FLOOD_AT) * 0.6) || soil[i] > 1.3 ? 1 : 0;

      // --- fire
      if (burn[i] > 0) {
        burn[i] -= dt * 8; heat[i] += 6; tree[i] *= 1 - Math.min(1, 7 * dt); grass[i] = Math.min(grass[i], 0.05); fruit[i] = 0; snow[i] = 0;
        if (S.precip === 0 || T < 0) for (const j of [i - 1, i + 1, i - N, i + N]) {
          if (j < 0 || j >= N * N || water[j] || burn[j] > 0 || Math.abs((j % N) - (i % N)) > 1) continue;
          if ((tree[j] > 0.25 || grass[j] > 0.6) && snow[j] < 0.02 && rnd() < 0.55 * (1 - soil[j] / 0.8)) burn[j] = 1;
        }
        if (burn[i] <= 0) { burn[i] = 0; fert[i] = Math.min(1, fert[i] + 0.04); }   // ash feeds the ground
      }

      // --- plants: warmth and water decide, nothing else
      const m = clamp(soil[i], 0, 1.3), gf = clamp(T / 13, 0, 1) * (T > 30 ? Math.max(0, 1 - (T - 30) / 8) : 1);
      const dry = m < 0.25, logF = soil[i] > 1.05 ? Math.max(0.1, 1 - (soil[i] - 1.05) * 2.2) : 1;
      const K = field[i] ? fert[i] * 1.25 : fert[i] * (1 - 0.65 * tree[i]), g = grass[i];
      let ng = g;
      if (gf > 0) ng += 4.2 * gf * m * logF * g * (1 - g / Math.max(0.05, K)) * dt;
      else ng -= (snow[i] > 0.1 ? 0.3 : 0.5) * g * dt;                 // frost bites; a snow blanket protects
      if (dry && T > 0) ng -= (0.25 - m) * 3 * g * dt;
      if (T > 30) ng -= (T - 30) * 0.15 * g * dt;                      // scorched
      if (flood[i]) { ng -= 2.5 * g * dt; fruit[i] *= 1 - Math.min(1, 3 * dt); if (tree[i] > 0.02) tree[i] -= 0.12 * tree[i] * dt; }
      if (gf > 0 && ng < 0.04) ng += 0.05 * m * dt;
      grass[i] = clamp(ng, 0, 1);
      if (dry && T > 0 && tree[i] > 0.05) tree[i] -= (0.25 - m) * 0.25 * tree[i] * dt;
      if (gf > 0) {
        const t = tree[i], x = i % N; let nb = 0;
        if (x > 0) nb += tree[i - 1]; if (x < N - 1) nb += tree[i + 1]; if (i >= N) nb += tree[i - N]; if (i < N * N - N) nb += tree[i + N];
        tree[i] = clamp(t + (0.05 * t * (1 - t) + 0.006 * nb * (1 - t)) * gf * m * dt, 0, 1);
      }
      // --- fruit: a tree counts the warmth since it last went dormant; frost sends it back to sleep
      if (T < 3) warmSum[i] = 0; else warmSum[i] += T * dt;
      if (T < 0) fruit[i] *= 1 - Math.min(1, 6 * dt);
      if (warmSum[i] > 1.2 && warmSum[i] < 7.6) fruit[i] = Math.min(tree[i] * 1.2, fruit[i] + yieldOf(tree[i]) * 3.2 * Math.min(1, m * 1.3) * logF * dt);
      else fruit[i] = Math.max(0, fruit[i] - fruit[i] * 1.5 * dt);
    }
    // the river answers to what ran off the land, slowly
    const inflow = (runoff / Math.max(1, nLand)) * TPY / 0.78;
    S.river += (inflow - S.river) * Math.min(1, dt / 0.5);
  }

  // ---------------------------------------------------------------- bodies
  const bodyOf = a => { const d = a.d; return a.age >= d.mature ? d.mass : d.mass * (0.35 + 0.65 * a.age / d.mature); };   // the young are small
  const plantEater = d => d.eats.grass || d.eats.browse || d.eats.fruit;
  const reach = d => d.social === 'pack' ? 1.6 : d.social === 'tribe' ? 1.2 : 0.95;          // together you can bring down more
  // Can this hunter make a meal of that body? Only size and appetite decide.
  const canTake = (h, p) => h.d.eats.meat && h.sp !== p.sp && bodyOf(p) <= h.d.mass * reach(h.d);
  const hideBonus = p => bodyOf(p) < 1 ? 0.4 : 0;                                           // small things vanish in the grass
  const mouth = d => clamp(0.04 + 0.036 * d.mass, 0.06, 0.25);                               // small mouths crop closer to the ground
  const gut = d => Math.max(1, d.mass * 0.9);

  function free(x, y) { for (let k = 0; k < 60; k++) { const nx = clamp(Math.round(x + R(-k / 4, k / 4)), 0, N - 1), ny = clamp(Math.round(y + R(-k / 4, k / 4)), 0, N - 1); if (!water[I(nx, ny)]) return [nx, ny]; } return [x, y]; }
  function add(sp, x, y, age, e) {
    const d = SP[sp], p = free(x, y);
    const a = { id: S.nextId++, sp, d, x: p[0], y: p[1], e: e === undefined ? 0.7 : e, age: age === undefined ? R(d.mature, d.life * 0.6) : age, cd: R(0, d.interval), life: d.life * R(0.75, 1.15), alive: true, mood: '' };
    S.agents.push(a); S.byId.set(a.id, a); return a;
  }
  for (const sp in SP) { const d = SP[sp]; if (d.people) continue; const n = opt[sp] === undefined ? (d.start || 0) : opt[sp]; for (let k = 0; k < n; k++) add(sp, R(0, N), R(0, N)); }
  {
    let bx = N >> 1, by = N >> 1, best = -1;
    for (let k = 0; k < 200; k++) {
      const x = (R(4, N - 4)) | 0, y = (R(4, N - 4)) | 0, i = I(x, y); if (water[i]) continue; let w = 0, tr = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const j = I(clamp(x + dx, 0, N - 1), clamp(y + dy, 0, N - 1)); w += water[j]; tr += yieldOf(tree[j]); }
      const sc = Math.min(w, 4) + Math.min(tr, 12) * 0.5 + fert[i]; if (sc > best) { best = sc; bx = x; by = y; }
    }
    S.tribe.x = bx; S.tribe.y = by;
    for (const sp in SP) if (SP[sp].people) { const n = opt[sp] === undefined ? SP[sp].start : opt[sp]; for (let k = 0; k < n; k++) add(sp, bx, by, 18 + k * 2, 1); if (opt.family) { const mom = S.agents[S.agents.length - 1]; add(sp, bx, by, 5, 1).mom = mom.id; add(sp, bx, by, 0.9, 1).mom = mom.id; } }
  }
  const die = (a, why, by) => { if (!a.alive) return; a.alive = false; S.fx.push({ kind: 'death', sp: a.sp, x: a.x, y: a.y, why, id: a.id, by: by || 0 }); const k = a.sp + ':' + why; S.deaths[k] = (S.deaths[k] || 0) + 1; if (a.d.people) S.tribe.dead++; };
  function nearest(a, r, ok) {
    let best = null, bd = r + 0.01;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = a.x + dx, y = a.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue;
      for (const b of cells[I(x, y)]) { if (!b.alive || b === a || !ok(b)) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); if (d < bd) { bd = d; best = b; } }
    }
    return best;
  }
  function stepTo(a, tx, ty, n) {
    for (let k = 0; k < n; k++) {
      const dx = Math.sign(tx - a.x), dy = Math.sign(ty - a.y); if (!dx && !dy) return;
      let nx = clamp(a.x + dx, 0, N - 1), ny = clamp(a.y + dy, 0, N - 1);
      if (water[I(nx, ny)]) { if (!water[I(nx, a.y)]) ny = a.y; else if (!water[I(a.x, ny)]) nx = a.x; else { nx = clamp(a.x + ((rnd() * 3) | 0) - 1, 0, N - 1); ny = clamp(a.y + ((rnd() * 3) | 0) - 1, 0, N - 1); if (water[I(nx, ny)]) return; } }
      a.x = nx; a.y = ny;
    }
  }
  const roam = (a, r, n) => stepTo(a, a.x + ((rnd() * (2 * r + 1)) | 0) - r, a.y + ((rnd() * (2 * r + 1)) | 0) - r, n);

  // ---- homes: an animal with a home trait keeps a burrow or den, shares it with its kind, and digs a new one when it is full or too far
  function homeOf(a) {
    let h = a.home && S.homes.get(a.home); if (h) return h;
    let bd = a.d.home === 'den' ? 22 : 9; for (const q of S.homes.values()) { if (q.sp !== a.sp || q.n >= (a.d.home === 'den' ? 30 : 10)) continue; const d = Math.max(Math.abs(q.x - a.x), Math.abs(q.y - a.y)); if (d < bd) { bd = d; h = q; } }
    if (!h) { if (water[I(a.x, a.y)] || field[I(a.x, a.y)]) return null; h = { id: S.nextId++, sp: a.sp, kind: a.d.home, x: a.x, y: a.y, n: 0, emptyT: 0 }; S.homes.set(h.id, h); }
    a.home = h.id; h.n++; return h;
  }
  const atHome = (a, h) => a.x === h.x && a.y === h.y;
  // ---- eating plants: grass down to what the mouth can reach, fruit, young trees
  function forage(a, d, dt, anc, stay) {
    let got = 0; const need = Math.min((d.bite || 4) * dt * (d.social === 'herd' ? S.dayK : 1), 1.05 - a.e), sz = gut(d), fl = mouth(d);
    for (let q = 0; q < (sz > 1 ? 9 : 5) && got < need; q++) {
      const x = q ? clamp(a.x + ((rnd() * 3) | 0) - 1, 0, N - 1) : a.x, y = q ? clamp(a.y + ((rnd() * 3) | 0) - 1, 0, N - 1) : a.y, j = I(x, y); if (water[j]) continue;
      const open = 1 - snowBlock(j, d.mass);
      if (d.eats.grass) { const g = grass[j], cv = 1.2 / sz; if (g > fl) { const take = Math.min((need - got) / cv, (g - fl) * 0.5 * open); grass[j] -= take; got += take * cv; } }
      if (got < need && d.eats.fruit && fruit[j] > 0.02) { const cv = 1.5 / sz, take = Math.min((need - got) / cv, fruit[j] * 0.5); fruit[j] -= take; got += take * cv; }
      if (got < need && d.eats.browse && tree[j] > 0.02 && tree[j] < 0.5) { const cv = 3 / sz, take = Math.min((need - got) / cv, tree[j] * 0.25, 0.03); tree[j] -= take; got += take * cv; }
    }
    a.e += got;
    if (got < need * 0.7 && !stay) {                                  // not enough here: look further, but not far from home or the group
      let bx = a.x, by = a.y, bs = -1;
      for (let k = 0; k < 6; k++) { const x = clamp(a.x + ((rnd() * 7) | 0) - 3, 0, N - 1), y = clamp(a.y + ((rnd() * 7) | 0) - 3, 0, N - 1), j = I(x, y); if (water[j]) continue; let sc = (d.eats.grass ? grass[j] * (1 - snowBlock(j, d.mass)) : 0) + (d.eats.fruit ? fruit[j] : 0) + rnd() * 0.05; if (anc) sc -= Math.max(0, Math.max(Math.abs(x - anc.x), Math.abs(y - anc.y)) - anc.r) * 0.02; if (sc > bs) { bs = sc; bx = x; by = y; } }
      stepTo(a, bx, by, d.speed + 1);
    }
    return got;
  }
  // ---- eating fish: only from the water's edge, and not through ice
  function fishing(a, d, dt) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = a.x + dx, y = a.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const j = I(x, y);
      if (water[j] && fish[j] > 0.1 && tempAt(j) > -3) { const take = Math.min(fish[j] * 0.4, (1.1 - a.e) * d.mass / 3); fish[j] -= take; a.e += take * 3 / d.mass; return true; }
    }
    return false;
  }
  const herdSize = a => { let c = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = a.x + dx, y = a.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; for (const b of cells[I(x, y)]) if (b.alive && b !== a && b.sp === a.sp) c++; } return c; };
  // ---- eating meat: find a body small enough, close in, and try
  function hunt(a, d, dt) {
    const prey = nearest(a, d.sense, b => {
      if (b.hidden || !canTake(a, b)) return false;
      const j = I(b.x, b.y);
      if (bodyOf(b) > d.mass) {                                       // bigger than me: only when desperate, or when it is alone in thick cover
        if (!(a.e < 0.3 || (a.e < 0.65 && tree[j] > 0.55))) return false;
        if (nearest(b, 1, c => c.sp === b.sp)) return false;
      }
      // the young are guarded: not worth it while a grown one too big to fight stands beside them
      if (b.age < b.d.mature && nearest(b, 1, c => c.sp === b.sp && c.age >= c.d.mature && c.d.mass > d.mass)) return false;
      return rnd() > cover(j) * 1.1 + hideBonus(b);
    });
    if (!prey) return false;
    a.act = { k: cheb(prey, a) > 2 ? 'stalk' : 'chase', id: prey.id };
    stepTo(a, prey.x, prey.y, d.speed);
    if (cheb(prey, a) <= 1) {
      const j = I(prey.x, prey.y), pm = bodyOf(prey), together = d.social === 'pack' && nearest(a, 3, b => b.sp === a.sp) ? 1.6 : 1;
      const watched = prey.d.social === 'herd' && herdSize(prey) >= 2 ? 0.55 : 1;                 // many eyes
      const p = 0.42 * (pm < 1 ? 0.72 : 1) * Math.pow(Math.min(1, d.mass / pm), 5) * together * watched * (1 - cover(j)) * TPY * dt * 1.6;
      if (rnd() < p) {
        die(prey, 'eaten', a.id); const meal = pm / d.mass; a.act = { k: 'kill', id: prey.id, x: prey.x, y: prey.y };
        const pk = d.social === 'pack' ? S.agents.filter(b => b.alive && b.sp === a.sp && b !== a && cheb(b, a) <= 5) : [];
        for (const b of pk) b.feedAt = { x: prey.x, y: prey.y };                    // the pack comes to the kill
        a.e = Math.min(1.25, a.e + meal * (pk.length ? 0.45 : 1)); for (const b of pk) b.e = Math.min(1.25, b.e + meal * 0.55 / pk.length);
      }
    }
    return true;
  }
  // where an animal's day is anchored: its home, or else the middle of its group
  function anchorOf(a, d, h) {
    if (h) return { x: h.x, y: h.y, r: d.home === 'den' ? 8 : 5 };
    if (d.social === 'herd' || d.social === 'pack') {
      let sx = 0, sy = 0, c = 0;
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const x = a.x + dx, y = a.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; for (const b of cells[I(x, y)]) if (b.alive && b !== a && b.sp === a.sp) { sx += x; sy += y; c++; } }
      if (c) return { x: Math.round(sx / c), y: Math.round(sy / c), r: 1 };
    }
    return null;
  }
  const off = (a, p) => Math.max(Math.abs(a.x - p.x), Math.abs(a.y - p.y));
  // rest where it belongs: beside the burrow, in the den's lee, or lying in the middle of the herd
  function settle(a, d, anc, k) { if (anc && off(a, anc) > anc.r) stepTo(a, anc.x, anc.y, d.speed); a.act = { k, x: a.x, y: a.y }; }
  // ---- one behaviour for every animal; the traits decide which parts ever fire
  function animal(a, d, dt) {
    const threat = (d.eats.meat && a.e < 0.3) ? null : nearest(a, 2, b => canTake(b, a) && b.d.mass > bodyOf(a) * 0.8);
    const h = d.home ? homeOf(a) : null;
    if (threat) {
      a.mood = 'afraid'; a.act = { k: 'flee', id: threat.id };
      if (h && Math.max(Math.abs(h.x - a.x), Math.abs(h.y - a.y)) <= 5) { stepTo(a, h.x, h.y, d.speed + 1); a.act.home = h.id; if (atHome(a, h)) { a.hidden = true; a.act.k = 'hide'; } return; }   // bolt for the hole
      stepTo(a, a.x + (a.x - threat.x) * 3, a.y + (a.y - threat.y) * 3, d.speed); return;
    }
    // a pack that made a kill comes to eat it
    if (a.feedAt) { const f = a.feedAt; a.feedAt = null; stepTo(a, f.x, f.y, d.speed + 1); a.act = { k: 'feed', x: f.x, y: f.y }; return; }
    // in bitter air a fed animal goes home and stays there
    if (h && a.e > 0.6 && tempAt(I(a.x, a.y)) < d.comfort - 1) { stepTo(a, h.x, h.y, d.speed); a.act = { k: 'home', home: h.id }; if (atHome(a, h)) { a.hidden = true; a.mood = 'asleep'; a.act.k = 'den'; } return; }
    const anc = anchorOf(a, d, h);
    // the young keep close to their mother
    const mom = a.mom && a.age < d.mature * 0.5 ? S.byId.get(a.mom) : null;
    if (mom && mom.alive && !mom.hidden && cheb(mom, a) > 1) { stepTo(a, mom.x, mom.y, d.speed + 1); a.act = { k: 'follow', id: mom.id }; if (plantEater(d) && a.e < 0.95) forage(a, d, dt, null, true); return; }
    if (d.eats.meat && a.e < 0.8 && hunt(a, d, dt)) return;
    if (d.eats.fish && a.e < 0.85 && fishing(a, d, dt)) { a.act = { k: 'fish', x: a.x, y: a.y }; return; }
    if (plantEater(d)) {
      if (S.night && d.social === 'herd') { settle(a, d, anc, 'sleep'); return; }   // herds sleep at night, lying close together; small grazers nibble on in the dark
      if (a.e < 0.95) {
        // a hunter on the move nearby: drift away from it while eating
        const eye = nearest(a, 4, b => canTake(b, a) && b.d.mass > bodyOf(a) * 0.8 && b.act && (b.act.k === 'stalk' || b.act.k === 'prowl'));
        if (eye) stepTo(a, a.x + Math.sign(a.x - eye.x), a.y + Math.sign(a.y - eye.y), 1);
        forage(a, d, dt, anc, !!eye); a.act = { k: 'graze', x: a.x, y: a.y, wary: eye ? eye.id : 0 }; return;
      }
      settle(a, d, anc, 'rest'); return;
    }
    if (d.eats.meat && a.e < 0.8) { roam(a, 3, d.speed); a.act = { k: 'prowl', x: a.x, y: a.y }; return; }
    settle(a, d, anc, S.night ? 'rest' : 'sleep');                           // a fed hunter sleeps through the day in the den's lee
  }

  // ---------------------------------------------------------------- people
  function person(a, d, dt) {
    a.wood = -1; const T = S.tribe, dist = Math.max(Math.abs(a.x - T.x), Math.abs(a.y - T.y)), pop = S.pop[a.sp];
    if (a.e < 0.85 && T.store > 0.05 && dist <= 8) { const take = Math.min(T.store, 1 - a.e, 0.5); T.store -= take; a.e += take; }
    if (a.age < 6) { stepTo(a, T.x, T.y, 1); a.act = { k: S.night ? 'sleep' : a.age < 2 ? 'baby' : 'play' }; return; }
    if (S.night) {                                                       // nights are spent at the camp
      stepTo(a, T.x, T.y, 3); a.act = { k: 'sleep' };
      const w = nearest(a, 2, b => !b.hidden && canTake(b, a)); if (w && a.e > 0.9 && rnd() < 0.25 * TPY * dt) { die(w, 'killed by people', a.id); a.act = { k: 'guard', id: w.id }; }
      return;
    }
    a.act = { k: 'idle' };
    const adults = S.agents.filter(b => b.alive && b.sp === a.sp && b.age >= d.mature).length, campT = tempAt(I(T.x, T.y));
    // huts and firewood come out of the nearest trees
    if (T.skills.hut && T.huts * 4 < pop + 1 && rnd() < dt * 6) { for (let k = 0; k < 30; k++) { const j = I(clamp(T.x + ((rnd() * 9) | 0) - 4, 0, N - 1), clamp(T.y + ((rnd() * 9) | 0) - 4, 0, N - 1)); if (tree[j] > 0.2) { tree[j] -= 0.15; T.huts++; a.act = { k: 'build', j, n: T.huts }; S.fx.push({ kind: 'hut', by: a.id, j, n: T.huts }); break; } } }
    if (T.skills.fire && campT < d.comfort - 3 && rnd() < dt * 8) { for (let k = 0; k < 20; k++) { const j = I(clamp(T.x + ((rnd() * 11) | 0) - 5, 0, N - 1), clamp(T.y + ((rnd() * 11) | 0) - 5, 0, N - 1)); if (tree[j] > 0.1) { tree[j] -= 0.03; T.fireT = S.t; a.wood = j; break; } } }
    // look for food: plants, fish, game. What is found is carried home and shared.
    const range = 7; let bestV = 0, bx = a.x, by = a.y, kind = '';
    for (let k = 0; k < 10; k++) {
      const x = clamp(T.x + ((rnd() * (2 * range + 1)) | 0) - range, 0, N - 1), y = clamp(T.y + ((rnd() * (2 * range + 1)) | 0) - range, 0, N - 1), j = I(x, y), dd = 1 / (1 + Math.max(Math.abs(x - T.x), Math.abs(y - T.y)) / 5);
      let v = 0, kd = '';
      if (water[j]) { if (T.skills.fish) { v = fish[j] * 1.1 * (tempAt(j) < -3 ? 0.65 : 1); kd = 'fish'; } }
      else { v = fruit[j] * 1.6 + grass[j] * 0.12 * (1 - snowBlock(j, d.mass)); kd = 'plant'; }
      v *= dd; if (v > bestV) { bestV = v; bx = x; by = y; kind = kd; }
    }
    // game: anything small enough that is not itself a hunter of people-sized things
    const game = T.skills.hunt && T.store < pop * 1.2 ? nearest(a, 5, b => !b.d.people && !b.hidden && canTake(a, b) && !(b.d.eats.meat && b.d.mass > d.mass * 0.5) && rnd() > cover(I(b.x, b.y)) * 1.25 + (bodyOf(b) < 1 ? 0.4 : 0.15)) : null;
    if (game && rnd() < 0.3) {
      if (a.act.k === 'idle') a.act = { k: 'hunt', id: game.id };
      stepTo(a, game.x, game.y, 2);
      if (cheb(game, a) <= 1) { const gm = bodyOf(game), helpers = Math.min(3, adults - 1), p = (gm < 1 ? 0.22 : (0.07 + 0.05 * helpers) * Math.min(1, 4.5 / gm)) * (1 - 0.5 * cover(I(game.x, game.y))) * TPY * dt * S.dayK; if (rnd() < p) { die(game, 'hunted', a.id); T.store += gm * 0.9; a.act = { k: 'hunt', id: game.id, kill: 1, x: game.x, y: game.y }; } }
      return;
    }
    if (kind) {
      const j = I(bx, by), eff = TPY * dt * S.dayK / (1 + Math.max(Math.abs(bx - T.x), Math.abs(by - T.y)) / 6) / (1 + tree[j] * tree[j] * 1.2);
      if (kind === 'fish') { const take = Math.min(fish[j] * 0.5, 0.31 * eff) * (tempAt(j) < -3 ? 0.65 : 1); fish[j] -= take; T.store += take * 1.5; if (a.act.k === 'idle') a.act = { k: 'fish', x: bx, y: by, got: take }; }
      else { const tf = Math.min(fruit[j], 0.24 * eff); fruit[j] -= tf; const tg = Math.min(grass[j] * 0.3, 0.08 * eff) * (1 - snowBlock(j, d.mass)); grass[j] -= tg; T.store += tf * 1.6 + tg * 0.5; if (a.act.k === 'idle') a.act = { k: 'gather', x: bx, y: by, fruit: tf > 0.01 ? 1 : 0, got: tf * 1.6 + tg * 0.5 }; }
      if (rnd() < 0.5) { a.x = bx; a.y = by; } else { a.x = clamp(T.x + ((rnd() * 5) | 0) - 2, 0, N - 1); a.y = clamp(T.y + ((rnd() * 5) | 0) - 2, 0, N - 1); }
      if (water[I(a.x, a.y)]) { a.x = T.x; a.y = T.y; }
    }
    // a strong camp drives off whatever would hunt it
    const w = a.e < 0.9 ? null : nearest(a, 2, b => !b.hidden && canTake(b, a));
    if (w && adults >= 3 && rnd() < 0.25 * TPY * dt) { die(w, 'killed by people', a.id); a.act = { k: 'guard', id: w.id }; }
  }
  // Fields: sown once the ground is warm, reaped when the crop has had its warmth, or in a hurry when frost comes.
  function farm(dt) {
    const T = S.tribe, pop = S.popPeople; if (!T.skills.farm || !pop) return;
    const ct = tempAt(I(T.x, T.y));
    if (!T.sown && ct > 4 && (T.lastCampT === undefined || ct > T.lastCampT)) {
      const want = Math.round(pop * 1.6), r = Math.min(14, 3 + Math.sqrt(pop)); let have = 0; const cand = [];
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = T.x + Math.round(dx), y = T.y + Math.round(dy); if (x < 0 || y < 0 || x >= N || y >= N) continue; const i = I(x, y); if (water[i]) continue; if (field[i]) have++; else cand.push(i); }
      cand.sort((a, b) => fert[b] - tree[b] * 0.5 - (fert[a] - tree[a] * 0.5));
      for (let k = 0; k < cand.length && have < want; k++) { field[cand[k]] = 1; tree[cand[k]] = 0; grass[cand[k]] = Math.max(grass[cand[k]], 0.15); have++; }
      T.fields = have; T.sown = true; T.cropWarm = 0;
    }
    if (T.sown) {
      T.cropWarm += Math.max(0, ct) * dt;
      const ripe = T.cropWarm > 5.6, frost = ct < 0;
      if (ripe || frost) { let got = 0; for (let i = 0; i < N * N; i++) if (field[i]) { if (!flood[i]) got += Math.max(0, grass[i] - 0.1) * 2.6 * (ripe ? 1 : 0.5); grass[i] = Math.min(grass[i], 0.1); } T.store += got; T.lastHarvest = got; T.sown = false; T.resting = true; }
    }
    if (T.resting) { T.sown = true; T.cropWarm = -1e9; if (ct < 2) { T.resting = false; T.sown = false; } }   // nothing is sown again until the cold has passed
    T.lastCampT = ct;
  }

  // ---------------------------------------------------------------- one step of time
  function tick() {
    const dt = 1 / TPY; S.t += dt; S.tickNo++; S.night = DAY ? S.tickNo % DAY === DAY - 1 : false; S.dayK = DAY ? (S.night ? 0 : DAY / (DAY - 1)) : 1; weather(dt); land(dt);
    for (const q of S.homes.values()) q.n = 0;
    for (const L of cells) L.length = 0; S.pop = {}; for (const sp in SP) S.pop[sp] = 0; S.popPeople = 0;
    for (const a of S.agents) if (a.alive) { cells[I(a.x, a.y)].push(a); S.pop[a.sp]++; if (a.d.people) S.popPeople++; const q = a.home && S.homes.get(a.home); if (q) q.n++; else a.home = 0; }
    for (const q of S.homes.values()) { if (q.n) q.emptyT = 0; else if ((q.emptyT += dt) > 2 || flood[I(q.x, q.y)]) S.homes.delete(q.id); }
    const T = S.tribe, born = [], campI = I(T.x, T.y), lengthening = daysLengthen(), sunH = sunHeight();
    T.store = Math.max(0, T.store - T.store * 0.35 * dt);
    if (flood[campI]) { T.store *= 1 - Math.min(1, 2.5 * dt); if (T.huts > 0 && rnd() < 3 * dt) T.huts--; }
    if (!T.skills.fire && S.popPeople) { for (let dy = -6; dy <= 6 && !T.skills.fire; dy++) for (let dx = -6; dx <= 6; dx++) { const x = T.x + dx, y = T.y + dy; if (x >= 0 && y >= 0 && x < N && y < N && burn[I(x, y)] > 0) { T.skills.fire = true; S.log.push({ t: S.t, text: 'The people have taken fire for themselves.' }); break; } } }
    farm(dt);
    for (const a of S.agents) {
      if (!a.alive) continue; const d = a.d, i = I(a.x, a.y), Tc = tempAt(i); a.age += dt; a.cd -= dt; a.mood = ''; a.act = null; const wasHidden = a.hidden; a.hidden = false;
      // --- warmth: a body loses heat to cold air, faster when wet, slower under cover
      let shelter = tree[i] > 0.4 ? 0.6 : 1;
      if (wasHidden) shelter *= 0.4;
      if (d.people) { const home = Math.max(Math.abs(a.x - T.x), Math.abs(a.y - T.y)) <= 2; shelter = home ? (T.huts * 4 >= S.pop[a.sp] ? 0.35 : 0.7) * (T.skills.fire && S.t - (T.fireT || -9) < 0.1 ? 0.5 : 1) : 1; }
      const soaked = S.precip > 0 && Tc >= 0 && shelter > 0.5 ? 1.5 : 1;         // cold rain is worse than dry cold
      const cold = Math.max(0, d.comfort - Tc) * d.chill * shelter * soaked, hot = Tc > 32 ? (Tc - 32) * 0.08 : 0;
      const asleep = d.sleepsBelow !== undefined && Tc < d.sleepsBelow;                    // some bodies sleep the cold away
      a.e -= d.metab * dt / (d.people && a.age < 10 ? 2.5 : 1) * (asleep ? 0.12 : 1 + cold + hot);
      if (cold > 0.4) a.mood = 'cold'; else if (hot > 0.2) a.mood = 'hot';
      if (a.age > a.life) { die(a, 'old age'); continue; }
      if (flood[i]) { a.e -= 1.2 * dt; if (rnd() < 0.6 * dt) { die(a, 'drowned'); continue; } roam(a, 3, 2); }
      if (burn[i] > 0) { if (rnd() < 0.5) { die(a, 'burned'); continue; } a.e -= 0.1; roam(a, 3, 3); }
      const e0 = a.e;
      if (asleep) a.mood = 'asleep'; else if (a.held) a.mood = 'afraid'; else if (d.people) person(a, d, dt); else animal(a, d, dt);
      if (!a.mood) a.mood = a.e < 0.3 ? 'hungry' : a.e > e0 + 0.02 ? 'fed' : '';
      if (a.alive && a.e <= 0) { die(a, Tc < d.comfort ? 'cold and hunger' : 'hunger'); continue; }
      // --- young are born to a well-fed mother when the air is warm enough for them
      if (a.alive && a.age >= d.mature && a.cd <= 0 && a.e > d.breedE && Tc >= d.warmBreed && (lengthening || sunH >= (d.lateLight || 0))) {
        if (d.people) { if (T.store < 1.1 * S.pop[a.sp] + 1 || a.age > 42) continue; if (!nearest(a, 3, b => b.sp === a.sp && b.age >= d.mature)) continue; }
        else {
          if (!nearest(a, 7, b => b.sp === a.sp && b.age >= d.mature)) continue;
          if (d.territory) { let c = 0; for (const b of S.agents) if (b.alive && b.sp === a.sp && cheb(b, a) <= d.territory * 2) c++; if (c > d.territory) continue; }
        }
        const n = d.litter[0] + ((rnd() * (d.litter[1] - d.litter[0] + 1)) | 0); a.e -= 0.25 + 0.08 * n; a.cd = d.interval * R(0.85, 1.2);
        for (let k = 0; k < n; k++) born.push([a.sp, a.x, a.y, a.home, a.id]);
      }
    }
    for (const b of born) { const c = add(b[0], b[1], b[2], 0, 0.55); c.mom = b[4]; if (b[3] && S.homes.has(b[3])) c.home = b[3]; S.fx.push({ kind: 'birth', sp: b[0], x: c.x, y: c.y, id: c.id, mom: b[4] }); if (SP[b[0]].people) T.born++; }
    if (S.fx.length > 200) S.fx.splice(0, S.fx.length - 200);
    // an empty valley does not stay empty of people for ever: after a few years, strangers find it
    if (opt.resettle) { if (S.popPeople) S.emptyT = 0; else { S.emptyT += dt; if (S.emptyT > 3) { S.emptyT = 0; T.store = 5; T.huts = 0; T.sown = false; T.resting = false; for (const sp in SP) if (SP[sp].people) for (let k = 0; k < 2; k++) { const c = add(sp, T.x, T.y, 18 + k * 2, 1); S.fx.push({ kind: 'arrive', id: c.id, x: c.x, y: c.y }); } S.fx.push({ kind: 'settlers', x: T.x, y: T.y }); S.log.push({ t: S.t, text: 'Two strangers have come over the hills.' }); } } }
    if (S.agents.length > 400 && Math.floor(S.t * TPY) % 12 === 0) { S.agents = S.agents.filter(a => a.alive); S.byId.clear(); for (const a of S.agents) S.byId.set(a.id, a); }
    // the valley is not the whole world: now and then animals wander in over the hills.
    // Plant eaters come when their kind is nearly gone; hunters come when there is plenty to hunt.
    if (!opt.closed && Math.floor(S.t * TPY) % TPY === 0) {
      for (const sp in SP) {
        const d = SP[sp]; if (!d.wanders) continue; let come = false;
        if (d.eats.meat && !plantEater(d)) { let game = 0; for (const q in SP) if (!SP[q].people && !SP[q].eats.meat && SP[q].mass <= d.mass * reach(d)) game += S.pop[q] * SP[q].mass; come = game / (S.pop[sp] + 1) > 6 * d.mass && S.pop[sp] < 16 && rnd() < 0.5; }
        else come = S.pop[sp] < 3 && rnd() < 0.3;
        if (come) { const ex = rnd() < 0.5 ? 1 : N - 2, ey = R(2, N - 2); for (let k = 0; k < (d.mass < 1 ? 4 : 2); k++) { const c = add(sp, ex, ey, d.mature * 1.2, 0.9); S.fx.push({ kind: 'arrive', id: c.id, x: c.x, y: c.y }); } }
      }
    }
  }

  // ---------------------------------------------------------------- the god's hand
  // Each power does one physical thing. Whether that helps depends on the state of the world it lands on.
  const area = (x, y, r, fn) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; fn(I(nx, ny)); } };
  const G = {
    // water from the sky: snow on frozen ground, rain on warm ground, and it cools what it falls on
    rain(x, y, r, amt) { let n = 0; area(x, y, r, i => { n++; if (water[i]) return; if (tempAt(i) < 0) snow[i] += amt; else soil[i] = Math.min(1.4, soil[i] + amt); heat[i] -= 3 * amt; if (burn[i] > 0) burn[i] = 0; }); S.river += amt * n / (N * N) * (tempAt(I(clamp(x, 0, N - 1), clamp(y, 0, N - 1))) < 0 ? 0 : 2.5); },
    // warmth from the sky
    sun(x, y, r, deg) { area(x, y, r, i => { heat[i] = Math.min(22, heat[i] + deg); }); },
    // a push to whatever is able to grow: it does little on frozen or parched ground
    grow(x, y, r, amt) {
      const T = S.tribe; if (S.popPeople && Math.max(Math.abs(x - T.x), Math.abs(y - T.y)) <= 5 && r <= 6) { if (S.t - (T.lastGrowT || -9) > 0.12) { T.seenGrow = (T.seenGrow || 0) + 1; T.lastGrowT = S.t; } if (T.seenGrow >= 3 && !T.skills.farm) { T.skills.farm = true; S.log.push({ t: S.t, text: 'The people have learned to sow.' }); } }
      area(x, y, r, i => { if (water[i]) return; const k = amt * clamp(tempAt(i) / 8, 0.05, 1) * clamp(soil[i] / 0.3, 0.2, 1); grass[i] = Math.min(1, grass[i] + k); tree[i] = Math.min(1, tree[i] + k * 0.5); fruit[i] = Math.min(1.2, fruit[i] + k * tree[i]); });
    },
    // fire and force on one spot: kills what stands there, and sets light to anything dry enough to burn
    strike(x, y) { const i = I(x, y); for (const a of cells[i]) die(a, 'struck'); if (!water[i] && snow[i] < 0.05 && soil[i] < 0.9 && (tree[i] > 0.15 || grass[i] > 0.5)) burn[i] = 1; heat[i] += 4; },
    // test levers
    cull(sp, frac) { for (const a of S.agents) if (a.alive && a.sp === sp && rnd() < frac) die(a, 'struck'); },
    feed(sp, amt) { for (const a of S.agents) if (a.alive && a.sp === sp) a.e = Math.min(1.2, a.e + amt); },
    give(amt) { S.tribe.store += amt; },
    climate(f) { S.rainY = f; }, drought(f) { S.rainY = f; }, warm(deg) { S.warmOff = deg; },
    teach(skill) { S.tribe.skills[skill] = true; }
  };
  const stats = () => { let g = 0, t = 0, n = 0, sn = 0, so = 0, fl = 0; for (let i = 0; i < N * N; i++) if (!water[i]) { g += grass[i]; t += tree[i]; sn += snow[i]; so += soil[i]; fl += flood[i]; n++; } return { grass: g / n, tree: t / n, snow: sn / n, soil: so / n, flood: fl / n, store: S.tribe.store, huts: S.tribe.huts, air: S.air, river: S.river }; };
  tick();
  return { S, N, TPY, tick, G, stats, SPECIES: SP, SKILLS, tempAt, sunHeight, daysLengthen, warmSum, fert, cells, moveTo(a, x, y) { const p = free(x, y); a.x = p[0]; a.y = p[1]; }, grass, tree, water, fruit, fish, flood, field, soil, snow, heat, burn, bank, add, bodyOf, canTake };
}
root.Eden = { create, SPECIES, SKILLS };
})(typeof window !== 'undefined' ? window : globalThis);
