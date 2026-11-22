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
    metab: 2.2, speed: 1, sense: 6, mature: 8, breedE: 0.7, litter: [1, 1], interval: 2.4, warmBreed: -99, lateLight: 0,
    life: 52, comfort: 5.7, chill: 0.108, start: 2 }
};
// What people can do. Each skill is a small module; later eras add entries here.
const SKILLS = {
  gather: { known: true }, hunt: { known: true }, fish: { known: true }, tent: { known: true }, store: { known: true },
  hut: { known: false, learn: 'a winter spent under hides' }, house: { known: false, learn: 'a camp of huts, grown large' }, well: { known: false, learn: 'two roofs and many mouths' },
  fire: { known: false, learn: 'sees a tree burn' }, farm: { known: false, learn: 'sees plants made to grow beside the camp' },
  herd: { known: false, learn: 'a young animal caught alive' }, wheel: { known: false, learn: 'a tame beast and a made road' }
};

// Things people may work out for themselves. Why and when is not written here: see IDEAS inside create(), where each is tied
// to a want that has actually been felt and to the means lying at hand.
const TECHS = { bridge: 1, pottery: 1, palisade: 1, plough: 1, granary: 1, irrigation: 1, tools: 1, medicine: 1, masonry: 1, writing: 1, concrete: 1 };
const JOBS = { farmer: 'gather', hunter: 'hunt', fisher: 'fish', gatherer: 'gather', builder: 'build', woodcutter: 'build', mason: 'build', herder: 'gather', guard: 'hunt' };
function create(seed, opt) {
  opt = opt || {};
  const SP = opt.species || SPECIES, HUMAN = Object.values(SP).find(d => d.people) || SPECIES.human;
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

  // The kind of country. Same rules everywhere; only the lie of the land differs: how much water, how much wood, how much stone, how cold.
  const LANDS = {
    /* shape: how the height is made (see below); riverA: how many tiles must drain through a tile for a stream to run there;
       lake: how deep a hollow must be, in levels, to hold a lake */
    valley:   { shape: 'trough', riverA: 70,  lake: 0.4, treeAt: 0.56, rockAt: 0.82, warm: 0,  fert: 0 },
    plains:   { shape: 'low',    riverA: 120, lake: 0.3, treeAt: 0.72, rockAt: 0.9,  warm: 1,  fert: 0.08 },
    forest:   { shape: 'rolling', riverA: 80, lake: 0.6, treeAt: 0.42, rockAt: 0.86, warm: 0,  fert: 0.05 },
    lakeland: { shape: 'basins', riverA: 70,  lake: 0.2, treeAt: 0.58, rockAt: 0.86, warm: 0,  fert: 0 },
    highland: { shape: 'high',   riverA: 90,  lake: 0.9,  treeAt: 0.6,  rockAt: 0.56, warm: -3, fert: -0.12 }
  };
  const TREE_LINE = 7;
  /* how much country there is, against the 40 x 40 the animal numbers were first set for: what counts as 'nearly gone' and
     how many wander in together scale with it (D5) */
  const AREA = (opt.size || 40) * (opt.size || 40) / 1600;
  /* D5 tuning (wander-in): a plant eater counts as nearly gone below 8 per 40x40 of land and then comes back in 60% of
     years; wolves come in 80% of years while prey per wolf is plentiful. Groups that wander in grow with the square root of AREA. */   /* levels above which it grows too cold for woods to close */
  const landKind = LANDS[opt.land] ? opt.land : 'valley', LAND = LANDS[landKind], rock = F();
  const noise = (x, y, s) => {
    const h = (a, b) => {
      let n = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(s, 982451653)) | 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      n ^= n >>> 16;
      return (n >>> 0) / 4294967296;
    };
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * u + (h(xi, yi + 1) - h(xi, yi)) * v + (h(xi, yi) - h(xi + 1, yi) - h(xi, yi + 1) + h(xi + 1, yi + 1)) * u * v;
  };
  const sd = (seed || 1) * 7 + 3;
  // ---- the lie of the land. height is in levels (0 to about 8): neighbours one whole level apart are joined by a bank
  // that can be walked; two or more apart they meet at a cliff. It is made from noise at fixed wavelengths in tiles (48, 16
  // and 6), so a valley looks the same whatever the size of the map, shaped by the kind of country.
  const height = F(), flowTo = new Int32Array(N * N).fill(-1), accum = F(), filled = F();
  { const nz = (x, y, w, k) => noise(x / w, y / w, sd + k);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let h = 3.0 * nz(x, y, 48, 31) + 1.5 * nz(x, y, 16, 37) + 0.6 * nz(x, y, 6, 41);
      if (LAND.shape === 'trough') { const cx = N / 2 + 9 * Math.sin(y / 15 + sd), p = nz(x, y, 12, 67); h = h * 0.7 + Math.min(Math.abs(x - cx), 18) * 0.2 + (p > 0.62 ? 2 : 0); }   /* a few rocky knolls */
      else if (LAND.shape === 'low') h = h * 0.5 + 0.5;
      else if (LAND.shape === 'basins') h = h * 0.7 + 2.2 * nz(x, y, 9, 53);
      else if (LAND.shape === 'high') { h = h * 1.5 + 1.5 + 2.4 * Math.abs(nz(x, y, 14, 59) - 0.5); const p = nz(x, y, 20, 61); h += p > 0.56 ? 2.5 : p > 0.52 ? (p - 0.52) * 62 : 0; }   /* plateaus with steep edges */
      height[I(x, y)] = Math.max(0, h);
    }
  }
  // ---- water by flow, not placement. Every tile drains to its lowest way out; hollows fill to the point where they spill
  // (priority-flood from the edge of the map, which is where all water leaves). Where the fill stands above the ground there
  // is a lake; where enough land drains through a tile, a stream, wider the more drains through it.
  const flowOrder = [];
  { const heap = [], key = filled, done = new Uint8Array(N * N);
    const push = i => { heap.push(i); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (key[heap[p]] <= key[i]) break; heap[k] = heap[p]; k = p; } heap[k] = i; };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; const km = () => (m === k ? key[last] : key[heap[m]]); if (l < heap.length && key[heap[l]] < km()) m = l; if (r < heap.length && key[heap[r]] < km()) m = r; if (m === k) break; heap[k] = heap[m]; k = m; } heap[k] = last; } return top; };
    for (let i = 0; i < N * N; i++) { const x = i % N, y = (i / N) | 0; if (x === 0 || y === 0 || x === N - 1 || y === N - 1) { filled[i] = height[i]; done[i] = 1; push(i); } }
    while (heap.length) {
      const c = pop(), x = c % N; flowOrder.push(c);
      for (const n of [x > 0 ? c - 1 : -1, x < N - 1 ? c + 1 : -1, c - N, c + N]) { if (n < 0 || n >= N * N || done[n]) continue; done[n] = 1; filled[n] = Math.max(height[n], filled[c] + 1e-4); flowTo[n] = c; push(n); }
    }
    for (let k = flowOrder.length - 1; k >= 0; k--) { const i = flowOrder[k]; accum[i] += 1; if (flowTo[i] >= 0) accum[flowTo[i]] += accum[i]; }
    for (let i = 0; i < N * N; i++) if (filled[i] - height[i] > LAND.lake || accum[i] >= LAND.riverA) water[i] = 1;
    /* a big stream spreads: its lowest side-neighbour is under water too */
    for (let i = 0; i < N * N; i++) if (water[i] && accum[i] >= LAND.riverA * 12) { const x = i % N; let b = -1, bh = 1e9; for (const n of [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, i - N, i + N]) if (n >= 0 && n < N * N && !water[n] && height[n] < bh) { bh = height[n]; b = n; } if (b >= 0) water[b] = 2; }
    for (let i = 0; i < N * N; i++) if (water[i] === 2) water[i] = 1;
  }
  // ---- a way through: on any one piece of dry land, every tile can be reached by banks of one level, never only by
  // climbing a cliff. Where a cliff cuts the land in two, the lowest place on it is cut down to a bank (a fixed fix-up).
  { const L = i => Math.floor(height[i]), comp = new Int32Array(N * N);
    for (let round = 0; round < 400; round++) {
      comp.fill(-1); let nc = 0; const sizes = [];
      for (let i = 0; i < N * N; i++) { if (water[i] || comp[i] >= 0) continue; const st = [i]; comp[i] = nc; let sz = 0;
        while (st.length) { const c = st.pop(), x = c % N; sz++; for (const n of [x > 0 ? c - 1 : -1, x < N - 1 ? c + 1 : -1, c - N, c + N]) if (n >= 0 && n < N * N && !water[n] && comp[n] < 0 && Math.abs(L(n) - L(c)) <= 1) { comp[n] = nc; st.push(n); } }
        sizes.push(sz); nc++; }
      /* the smallest piece cut off by a cliff from a neighbour on the same dry land gets its lowest crossing cut down */
      let best = null, bd = 1e9;
      for (let c = 0; c < N * N; c++) { if (water[c]) continue; const x = c % N; for (const n of [x < N - 1 ? c + 1 : -1, c + N]) { if (n < 0 || n >= N * N || water[n] || comp[n] === comp[c]) continue; const d = Math.abs(L(n) - L(c)) * 1000 + Math.min(sizes[comp[c]], sizes[comp[n]]); if (d < bd) { bd = d; best = [c, n]; } } }
      if (!best) break;
      const [a, b] = best, hi = L(a) > L(b) ? a : b, lo = hi === a ? b : a; height[hi] = L(lo) + 1.5;
    }
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = I(x, y);
    /* steep and high ground shows bare stone; above the tree line it is too cold for woods */
    let slope = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N) slope = Math.max(slope, Math.abs(height[I(nx, ny)] - height[i])); }
    const rn = noise(x / 5, y / 5, sd + 21), rockAt = LAND.rockAt - 0.3 * Math.max(0, slope - 0.5) - 0.05 * Math.max(0, height[i] - 6); rock[i] = !water[i] && rn > rockAt ? clamp((rn - rockAt) * 5, 0.2, 1) : 0;   // bare stone showing through
    fert[i] = clamp((0.45 + 0.75 * noise(x / 7, y / 7, sd) + LAND.fert) * (1 - 0.45 * rock[i]), 0.25, 1);
    const tn = noise(x / 6, y / 6, sd + 9);
    const treeAt = LAND.treeAt + 0.2 * Math.max(0, height[i] - TREE_LINE);
    tree[i] = water[i] || rock[i] > 0.5 ? 0 : tn > treeAt ? clamp((tn - treeAt + 0.06) * 3, 0, 0.95) : 0;
    grass[i] = water[i] ? 0 : 0.5 * fert[i]; fish[i] = water[i] ? 1 : 0; cells.push([]);
  }
  // how close each piece of ground lies to open water: it decides seepage and what floods first
  for (let i = 0; i < N * N; i++) {
    const x = i % N, y = (i / N) | 0; let d = 9;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      if (water[I(nx, ny)]) d = Math.min(d, Math.hypot(dx, dy));
    }
    bank[i] = clamp(1 - d / 5, 0, 1); soil[i] = 0.45 + 0.55 * bank[i];
  }

  // Water divides the land. Dry ground that can be walked to without wetting a foot is one mass. Where a river is narrow
  // enough to wade, the two banks face each other at a ford; a ford can only be waded while the river runs low, and only a
  // bridge, built because too many days went into wading, makes it a walk. Fish are caught from the bank, not from the
  // middle of a lake.
  const FORD_W = 4, FORD_MAX = 1.4, mass = new Int32Array(N * N).fill(-1); let fords = [], massSize = [];
  function findMasses() {
    mass.fill(-1); let n = 0; const st = []; massSize = [];
    for (let i = 0; i < N * N; i++) {
      if (water[i] || mass[i] >= 0) continue; mass[i] = n; st.push(i);
      let size = 0;
      while (st.length) { const j = st.pop(), x = j % N; size++; for (const k of [x > 0 ? j - 1 : -1, x < N - 1 ? j + 1 : -1, j - N, j + N]) if (k >= 0 && k < N * N && !water[k] && mass[k] < 0) { mass[k] = n; st.push(k); } }
      massSize.push(size); n++;
    }
    fords = [];
    for (const horiz of [true, false]) for (let a = 0; a < N; a++) {
      let b = 0;
      while (b < N) {
        if (!water[horiz ? I(b, a) : I(a, b)]) { b++; continue; }
        let e = b; while (e < N && water[horiz ? I(e, a) : I(a, e)]) e++;
        if (b > 0 && e < N && e - b <= FORD_W && a % 2 === 0) {   /* every other row is enough: neighbouring fords are near the same */
          const ax = horiz ? b - 1 : a, ay = horiz ? a : b - 1, bx = horiz ? e : a, by = horiz ? a : e, ma = mass[I(ax, ay)], mb = mass[I(bx, by)];
          if (ma !== mb) { const tiles = []; for (let k = b; k < e; k++) tiles.push(horiz ? I(k, a) : I(a, k)); fords.push({ key: ax + ',' + ay, ax, ay, bx, by, w: e - b, ma, mb, horiz, tiles }); }
        }
        b = e;
      }
    }
  }
  findMasses();
  // the mass a tile is reached from: its own, or for water, the bank it is fished from (the door's own bank if it has one)
  const reachMass = (x, y, m0) => {
    const j = I(x, y); if (!water[j]) return mass[j]; let other = -2;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const m = mass[I(nx, ny)]; if (m === m0) return m0; if (m >= 0) other = m; }
    return other;
  };
  // Households. A roof and the people under it are one unit: what they bring home goes into their own larder, they eat from
  // it, they feel their own cold and their own hunger, and the ground they sow is theirs. What is held in common (the store
  // by the fire) is only what households have put there because they had more than they could use, and what those without
  // a roof of their own live from.
  const homeSite = a => a.house ? S.tribe.sites.find(q => q.id === a.house) || null : null;
  const bring = (a, amt) => { const h = homeSite(a); if (h) h.larder = (h.larder || 0) + amt; else S.tribe.store += amt; };
  const allFood = () => { let f = S.tribe.store; for (const q of S.tribe.sites) f += q.larder || 0; return f; };
  const owner = new Int32Array(N * N);
  // Quarries leave holes. rock is the stone still in the ground (about STONE_PER_TILE stone at 1); pit is how deep it has
  // been dug (0 to 1). A pit is neither a lot nor a field.
  const pit = new Float32Array(N * N), STONE_PER_TILE = 50;
  // Felling. A stand once begun is worked until it is down: cut marks it, and wood is taken from a begun stand before a new
  // one is started. What is left once a stand is nearly gone is cleared, so felling opens the ground.
  const cut = new Uint8Array(N * N), CHOP = 0.3;   /* how much of a stand one day's felling takes (the owner asked for felling to clear ground sooner) */
  function fell(j, amt) { const t = Math.min(tree[j], amt); tree[j] -= t; cut[j] = 1; if (tree[j] < 0.08) { tree[j] = 0; cut[j] = 0; } return t; }
  /* where the next wood comes from: a begun stand in reach, else the nearest new one big enough to be worth starting */
  // Piles: what lies on the ground ready to be taken (meat from a body, logs, loose stone). People take from a pile in reach
  // before they hunt, fell or quarry for the same thing; meat rots and logs burn.
  function dropPile(x, y, kind, amt) { if (amt <= 0.01) return; const p = S.piles.find(q => q.x === x && q.y === y && q.kind === kind); if (p) p.amt += amt; else S.piles.push({ x, y, kind, amt }); }
  function pileFor(x, y, kind, a) {
    let best = null, bd = reachOf(a) * 2 + 0.01;
    for (const p of S.piles) { if (p.kind !== kind || p.amt <= 0.05) continue; const d = wayDist(x, y, p.x, p.y).d; if (d < bd) { bd = d; best = p; } }
    return best ? { p: best, d: bd } : null;
  }
  function takePile(pl, max) { const t = Math.min(pl.p.amt, max); pl.p.amt -= t; if (pl.p.amt <= 0.05) S.piles.splice(S.piles.indexOf(pl.p), 1); return t; }
  function standFor(x, y, a, minNew) { const r = reachOf(a) * 2; let j = nearestWay(x, y, q => cut[q] && tree[q] > 0, 0, r); if (j < 0) j = nearestWay(x, y, q => tree[q] >= minNew, 1.5, r); return j; }
  // What the settlement knows of the land: every tile one of its people has stood within sight of (less far under trees).
  // It is only a record of what was seen. Nothing in the simulation reads it to decide anything.
  const known = new Uint8Array(N * N), SIGHT = 5, SIGHT_WOOD = 3;
  function see(a) {
    const r = tree[I(a.x, a.y)] > 0.5 ? SIGHT_WOOD : SIGHT;
    for (let y = Math.max(0, a.y - r); y <= Math.min(N - 1, a.y + r); y++) for (let x = Math.max(0, a.x - r); x <= Math.min(N - 1, a.x + r); x++) if ((x - a.x) * (x - a.x) + (y - a.y) * (y - a.y) <= r * r + r) known[I(x, y)] = 1;
  }
  // what is left on a lot when a dwelling is pulled down to be rebuilt, or taken by a flood
  const RUBBLE_STONE = 0.7, RUBBLE_WOOD = 0.3;                                // whose field a tile is (the id of the roof it belongs to)
  // Sound. Work, play, a crying child, a kill, a howl: each is a noise at a place, as loud as the thing that made it. It
  // carries a few tiles and fades with distance, a little faster through trees. Nothing is told what a noise means; each
  // creature does with it what its body would: the hungry hunter goes to look, the grazer and the fed hunter keep away
  // from the din of people, people who hear wolves at night remember it.
  let din = [], heardNow = [];
  const sound = (x, y, loud, kind) => { din.push({ x, y, l: loud, k: kind }); };
  function hear(a, want) {
    let best = null, bl = 0.25;
    for (const q of heardNow) { if (!want(q.k)) continue; const v = q.l - Math.hypot(q.x - a.x, q.y - a.y) * (0.32 + 0.12 * tree[I(a.x, a.y)]); if (v > bl) { bl = v; best = q; } }
    return best ? { x: best.x, y: best.y, l: bl, k: best.k } : null;
  }
  // Order. What gets built, where and when is left to wants and pulls; how it sits on the ground is not. Land is taken up in
  // lots: square plots PITCH tiles apart, with a strip between them left open as a way. A roof stands in the middle of a lot,
  // and people keep to the ways between lots when they go anywhere. So a place grows wherever its people need it to, but it
  // grows in rows and streets, the way real places do once more than a few families share the same ground.
  const PITCH = 4;
  const tread = F();
  const onWay = (x, y) => { const T = S.tribe; return ((x - T.x) % PITCH + PITCH) % PITCH === 0 || ((y - T.y) % PITCH + PITCH) % PITCH === 0; };
  const snapWay = (v, o) => o + Math.round((v - o) / PITCH) * PITCH;
  function stamp(x0, y0, x1, y1, w) {
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let k = 0; k <= n; k++) {
      const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n);
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      const i = I(x, y);
      if (water[i] && !bridgeTiles()[i]) return false;   /* feet stop at the water's edge: no way is worn on the far bank unless there is a bridge */
      if (!water[i]) tread[i] = Math.min(6, tread[i] + w);
    }
  }
  // The ground remembers feet. A trip goes out from the door to the nearest way, along the ways, and in at the other end;
  // every cell it crosses is worn a little, and unused ways grow over. Where the wear is deep there is a street.
  // A trip wears the ground where it goes: along the ways of the lattice where they lead straight there; where water stands
  // across them, along the way people really go round it or over a bridge (the route, remembered for a while per pair of
  // places), so no street runs into the water from both banks.
  const wornRoutes = new Map();
  function walk(x0, y0, x1, y1, w) {
    const T = S.tribe, vx = snapWay(x0, T.x), hy = snapWay(y1, T.y), legs = [[x0, y0, vx, y0, w * 0.4], [vx, y0, vx, hy, w], [vx, hy, x1, hy, w], [x1, hy, x1, y1, w * 0.4]];
    if (legs.every(l => dryLeg(l[0], l[1], l[2], l[3]))) { for (const l of legs) stamp(l[0], l[1], l[2], l[3], l[4]); return; }
    /* only a way to dry ground is looked for: to the water's edge where the trip ends at water */
    if (water[I(clamp(x1, 0, N - 1), clamp(y1, 0, N - 1))]) { const f = free(x1, y1); x1 = f[0]; y1 = f[1]; if (mass[I(x1, y1)] !== mass[I(clamp(x0, 0, N - 1), clamp(y0, 0, N - 1))]) return; }
    if (mass[I(clamp(x0, 0, N - 1), clamp(y0, 0, N - 1))] !== mass[I(clamp(x1, 0, N - 1), clamp(y1, 0, N - 1))] && !wayDist(x0, y0, x1, y1).bridged) return;   /* no way over: nothing to wear */
    const key = I(clamp(x0, 0, N - 1), clamp(y0, 0, N - 1)) * N * N + I(clamp(x1, 0, N - 1), clamp(y1, 0, N - 1)) + ':' + bridgeKeys + ':' + (T.roadGen || 0) + ':' + (S.stat.ponds || 0);   /* a remembered route is good only while the roads, bridges and water are as they were */
    let tiles = wornRoutes.get(key); if (!tiles) { const r = route(x0, y0, x1, y1); tiles = r.reached ? r.tiles : []; if (wornRoutes.size > 4000) wornRoutes.clear(); wornRoutes.set(key, tiles); }
    for (const t of tiles) if (!water[t]) tread[t] = Math.min(6, tread[t] + w);
  }
  function dryLeg(x0, y0, x1, y1) {
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))), br = bridgeTiles();
    for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); if (x < 0 || y < 0 || x >= N || y >= N) continue; const i = I(x, y); if (water[i] && !br[i]) return false; }
    return true;
  }

  // Distance costs working time. A trip goes the way walk() goes it (door, along the ways, in at the other end); its length
  // and how much of it lies on a made road decide how much of the day is left for the work itself:
  //   work done = day's work / (1 + d / (WALK * v)),  v = 1 on open ground, 1.5 on a made road, 2 with a cart.
  // WALK is the one tuning number (docs/LAND-AND-DENSITY.md, "Walking cost").
  const WALK = 6;
  // a hearth wants a little wood put by while the air is cold, and burns some each step it is lit
  const FUEL_KEEP = 1.5, FUEL_BURN = 0.3;
  // From one bank to the other only over a bridge: along the ways to it, across, and on. Without one the far bank cannot
  // be reached at all. 'wish' asks what it would cost if every narrow place had a bridge: what people imagine when they
  // look across at something they cannot get to.
  function wayDist(x0, y0, x1, y1, wish) {
    const m0 = mass[I(x0, y0)], m1 = reachMass(x1, y1, m0);
    if (m1 === -2) return { d: Infinity, road: 0 };
    if (m0 < 0 || m1 === m0) return flatDist(x0, y0, x1, y1);
    const T = S.tribe; let best = { d: Infinity, road: 0 };
    for (const f of fords) {
      const fwd = f.ma === m0 && f.mb === m1, back = f.mb === m0 && f.ma === m1; if (!fwd && !back) continue;
      const bridged = !!T.bridged[f.key]; if (!bridged && !wish) continue;
      const nx = fwd ? f.ax : f.bx, ny = fwd ? f.ay : f.by, fx = fwd ? f.bx : f.ax, fy = fwd ? f.by : f.ay;
      const a = flatDist(x0, y0, nx, ny), b = flatDist(fx, fy, x1, y1), d = a.d + f.w + 1 + b.d;
      if (d < best.d) best = { d, road: (a.road + b.road) / 2, ford: f, bridged };
    }
    return best;
  }
  function flatDist(x0, y0, x1, y1) {
    const T = S.tribe, vx = snapWay(x0, T.x), hy = snapWay(y1, T.y);
    /* along the ways, or straight across open ground where that is shorter: rough ground costs half again as much per tile */
    const d = Math.min(Math.abs(x0 - vx) + Math.abs(y0 - hy) + Math.abs(x1 - vx) + Math.abs(y1 - hy), 1.5 * Math.hypot(x1 - x0, y1 - y0));
    /* how much of the long legs runs on made road: looked at in the middle of each */
    const cx = clamp(vx, 0, N - 1), cy = clamp(hy, 0, N - 1);
    const rd = (T.road[I(cx, clamp(Math.round((y0 + hy) / 2), 0, N - 1))] ? 1 : 0) + (T.road[I(clamp(Math.round((vx + x1) / 2), 0, N - 1), cy)] ? 1 : 0);
    return { d, road: rd / 2 };
  }
  const walkEff = (x0, y0, x1, y1, v) => { const w = wayDist(x0, y0, x1, y1); return 1 / (1 + w.d / (WALK * v * (1 + 0.5 * w.road))); };
  // a trip that went through a ford: the ford is remembered as used, and the wading is felt as toil (the want a bridge answers)
  function crossed(w) { }
  // something better was seen across the water, out of reach: it is remembered at the narrow place it would be crossed,
  // and felt as the want of a way over (the want a bridge answers)
  function wishCross(f, k) { const T = S.tribe; T.fordUse[f.key] = (T.fordUse[f.key] || 0) + (k || 1); T.need.cross += 0.01 * (k || 1); S.stat.wishes++; }
  // Reach: how far a person is minded to go. It grows when a search comes back empty while the want is still felt, and
  // shrinks again once they are supplied. Its limit is physical: out and back before night, further on made roads or
  // with a cart.
  const REACH0 = 3;
  const reachOf = a => { if (a.reach === undefined) a.reach = WALK; return a.reach; };   /* a newcomer starts out looking as far as a day of walking makes worthwhile */
  const reachCap = () => { const T = S.tribe; return 12 * (T.pave > 1 ? 1.3 : 1) * (T.carts ? 1.5 : 1); };
  const stretch = a => { a.reach = Math.min(reachCap(), reachOf(a) * 1.25 + 0.5); };
  const settleBack = a => { a.reach = Math.max(REACH0, reachOf(a) * 0.96); };
  // where a person's working day starts and ends: the door of their own roof, or the fire for those without one
  const doorOf = a => { const h = homeSite(a); return h ? h : S.tribe; };
  // the nearest tile, along the ways, that answers a want; jitter adds a little chance so not everyone goes to the same one
  function nearestWay(x0, y0, ok, jitter, maxR) {
    let bj = -1, bd = maxR === undefined ? 1e9 : maxR + 0.01;
    const m0 = mass[I(x0, y0)];
    /* outward in rings from the start; a ring further out than the best found so far cannot hold anything nearer */
    for (let r = 0; r < N && r < bd; r++) for (let dy = -r; dy <= r; dy++) {
      const y = y0 + dy; if (y < 0 || y >= N) continue;
      const step = dy === -r || dy === r ? 1 : 2 * r;
      for (let dx = -r; dx <= r; dx += step || 1) {
        const x = x0 + dx; if (x < 0 || x >= N) continue; const j = I(x, y);
        if (!ok(j)) continue;
        if (Math.hypot(dx, dy) + (mass[j] !== m0 ? 3 : 0) >= bd) continue;    /* cannot beat the best already found */
        const dd = wayDist(x0, y0, x, y).d + (jitter ? rnd() * jitter : 0); if (dd < bd) { bd = dd; bj = j; }
      }
    }
    return bj;
  }
  // A settlement as it is when the first people arrive. The one place a settlement's fields are named, so a field added
  // here is reset wherever a settlement starts over.
  function newSettlement(x, y) {
    const T = { x, y, store: 5, huts: 0, wood: 0, stone: 0, roof: 0.7, level: 0, carts: 0, threat: 0,
      need: { cold: 0, hunger: 0, spoil: 0, water: 0, danger: 0, flood: 0, toil: 0, crowd: 0, loss: 0, reckon: 0, cross: 0 },
      fordUse: {}, bridged: {}, bridge: null,
      plenty: 1, pave: 1, stoneWork: 0, floodSeen: false, got: { fish: 0, gather: 0, hunt: 0, farm: 0 }, eff: { fish: 0, gather: 0, hunt: 0, farm: 0 },
      rate: {}, wall: null, fence: null, streets: null, road: new Uint8Array(N * N), sites: [], skills: {}, dead: 0, born: 0,
      well: false, roofT: 0, trades: {}, party: null, kidsHungry: false, watchDay: -1, watcher: 0, noHunt: 0, hunts: 0, fireT: -9, fuel: 0, lit: -1, gaveTold: false,
      sown: false, resting: false, cropWarm: 0, lastCampT: -1e9, fields: 0, lastHarvest: 0, seenGrow: 0, lastGrowT: -9, waterAt: null, waterDist: null, pondTold: false, lotAcross: null, lotReach: 8, roadGen: 0 };
    for (const k in SKILLS) T.skills[k] = SKILLS[k].known;
    for (const k in TECHS) T.skills[k] = false;
    return T;
  }
  const S = { t: opt.startT || 0, agents: [], pop: {}, tribe: newSettlement(0, 0), log: [], deaths: {}, nextId: 1,
    rainY: 1,
    warmOff: LAND.warm,
    river: 1,
    air: 0,
    precip: 0,
    sky: 'clear',
    fx: [],
    emptyT: 0,
    homes: new Map(),
    tickNo: 0,
    night: false,
    dayK: 1,
    byId: new Map(),
    problems: [],
    piles: [],
    stat: { wishes: 0, ponds: 0, newTrips: 0, newN: 0, reTrips: 0, reN: 0, pitD: 0, pitN: 0, lotsRefused: 0, fireMeals: 0, starveD: 0, starveRef: 0, starveN: 0, forageD: 0, forageN: 0, timberD: 0, timberN: 0, stoneD: 0, stoneN: 0, fuelD: 0, fuelN: 0 },
    levers: { hold: {},
      banned: {} } };
  const DAY = opt.dayCycle || 0;   // ticks per day (0 = no day and night). Work that is skipped at night is done a little faster by day, so a year holds the same work.

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
  const FISH_SWIM = 3;   /* how fast fish spread through open water, per year */
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
        /* fish swim: each water tile's stock drifts toward its neighbours', so a fished-out shore fills again from open water */
        { let sum = 0, n = 0; const x = i % N; for (const k of [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, i - N, i + N]) if (k >= 0 && k < N * N && water[k]) { sum += fish[k]; n++; } if (n) fish[i] += (sum / n - fish[i]) * Math.min(1, FISH_SWIM * dt); }
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
        if (field[i] || S.tribe.road[i]) tree[i] = Math.min(tree[i], 0.04);   /* seedlings on a sown field or a made road are trodden and weeded out */
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

  function free(x, y) {
    for (let k = 0; k < 60; k++) { const nx = clamp(Math.round(x + R(-k / 4, k / 4)), 0, N - 1), ny = clamp(Math.round(y + R(-k / 4, k / 4)), 0, N - 1); if (!water[I(nx, ny)]) return [nx, ny]; }
    /* deep in the water: search outward in rings until dry ground is found */
    const cx = clamp(Math.round(x), 0, N - 1), cy = clamp(Math.round(y), 0, N - 1);
    for (let r = 1; r < N; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && ny >= 0 && nx < N && ny < N && !water[I(nx, ny)]) return [nx, ny];
    }
    return [cx, cy];
  }
  function add(sp, x, y, age, e) {
    const d = SP[sp], p = free(x, y);
    const a = { id: S.nextId++,
      sp,
      d,
      x: p[0],
      y: p[1],
      e: e === undefined ? 0.7 : e,
      age: age === undefined ? R(d.mature, d.life * 0.6) : age,
      cd: R(0, d.interval),
      life: d.life * R(0.75, 1.15),
      alive: true,
      mood: '' };
    S.agents.push(a); S.byId.set(a.id, a); if (d.people) { folkList = null; soul(a); folkList = null; } return a;
  }
  // Where newcomers to an empty valley make their camp: water close by, fruiting trees, good ground, and room to range on
  // foot without having to wade a river to reach it.
  function campSite() {
    let bx = N >> 1, by = N >> 1, best = -1;
    for (let k = 0; k < 200; k++) {
      const x = (R(4, N - 4)) | 0, y = (R(4, N - 4)) | 0, i = I(x, y); if (water[i]) continue; let w = 0, tr = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const j = I(clamp(x + dx, 0, N - 1), clamp(y + dy, 0, N - 1)); w += water[j]; tr += yieldOf(tree[j]); }
      const sc = Math.min(w, 4) + Math.min(tr, 12) * 0.5 + fert[i] + Math.min(1, massSize[mass[i]] / 600) * 3; if (sc > best) { best = sc; bx = x; by = y; }
    }
    return [bx, by];
  }
  // where a stranger walks in: the edge of the map, on land joined to the camp on foot or over a bridge
  function edgeOfReach() {
    const T = S.tribe, home = mass[I(T.x, T.y)];
    const joined = m => m === home || fords.some(f => T.bridged[f.key] && ((f.ma === home && f.mb === m) || (f.mb === home && f.ma === m)));
    /* first choice: somewhere at the edge of what the place knows, so they come out of the unknown */
    for (let k = 0; k < 60; k++) { const j = (rnd() * N * N) | 0, x = j % N, y = (j / N) | 0; if (!known[j] || water[j] || !joined(mass[j])) continue; if ((x > 0 && !known[j - 1]) || (x < N - 1 && !known[j + 1]) || (y > 0 && !known[j - N]) || (y < N - 1 && !known[j + N])) return [x, y]; }
    for (let k = 0; k < 40; k++) { const side = (rnd() * 4) | 0, t = R(2, N - 2) | 0, x = side === 0 ? 1 : side === 1 ? N - 2 : t, y = side === 2 ? 1 : side === 3 ? N - 2 : t; if (!water[I(x, y)] && joined(mass[I(x, y)])) return [x, y]; }
    return [T.x, T.y];
  }
  // ---------------------------------------------------------------- people are someone
  // Each person has a name, a sex, parents, perhaps a partner and a house, things they are good at, and people they miss.
  // What the camp does as a whole follows from what each of them wants: to eat, to be warm, to be with their own.
  const NAMES = { f: ['Mara', 'Ila', 'Suna', 'Edda', 'Wren', 'Tessa', 'Noor', 'Liv', 'Ansa', 'Runa', 'Yara', 'Hild', 'Oona', 'Brin', 'Sefa', 'Kaia', 'Dalla', 'Mirre', 'Thea', 'Ione'],
    m: ['Tor', 'Ben', 'Aron', 'Finn', 'Odo', 'Kell', 'Rasmus', 'Ivo', 'Bram', 'Leif', 'Soren', 'Hale', 'Emre', 'Jorn', 'Calder', 'Pell', 'Garth', 'Niko', 'Ulf', 'Davin'] };
  const CRAFTS = ['hunt', 'fish', 'gather', 'build'], CRAFT_NAME = { hunt: 'hunter', fish: 'fisher', gather: 'gatherer', build: 'builder' };
  /* the ages of a life (the owner asked for children to grow up sooner, 2026-11-22): small children stay by the fire until
     SMALL, are grown at GROWN (the species' mature age), and may pair off at WED */
  const GROWN = HUMAN.mature, SMALL = 4, WED = 10;
  let folkList = null;                                               // the living people, gathered once and reused until someone is born, arrives or dies
  const folk = () => folkList || (folkList = S.agents.filter(b => b.alive && b.d.people));
  function nameFor(a) {
    const pool = NAMES[a.fem ? 'f' : 'm'], used = new Set(folk().filter(b => b !== a).map(b => b.name));
    let nm = pool[(rnd() * pool.length) | 0];
    for (let k = 0; k < pool.length && used.has(nm); k++) nm = pool[(pool.indexOf(nm) + 1) % pool.length];
    return nm;
  }
  function soul(a) {
    const others = folk().filter(b => b !== a);
    const single = a.age >= WED && others.length <= 1 ? others.find(b => b.age >= WED && !b.partner && b.fem !== undefined) : null;
    if (single) { a.fem = !single.fem; a.partner = single.id; single.partner = a.id; }   // those who arrive together are a couple already
    else a.fem = a.age >= WED && !others.length ? false : rnd() < 0.5;
    a.name = nameFor(a); a.partner = a.partner || 0; a.dad = a.dad || 0; a.house = 0; a.grief = 0; a.bond = {};
    a.skill = {}; for (const k of CRAFTS) a.skill[k] = R(0.8, 1.1);
    // how they look: skin and hair come down from the parents, clothes are their own (the view turns these numbers into colours)
    a.looks = { skin: (rnd() * 5) | 0, hair: (rnd() * 6) | 0, top: (rnd() * 10) | 0, legs: (rnd() * 6) | 0 };
  }
  const craftOf = a => { let b = 'gather'; for (const k of CRAFTS) if (a.skill[k] > a.skill[b]) b = k; return b; };
  const practise = (a, k, amt) => { a.skill[k] = Math.min(1.6, a.skill[k] + (amt || 0.004)); };
  const kin = (a, b) => a.id === b.mom || a.id === b.dad || b.id === a.mom || b.id === a.dad || (a.mom && a.mom === b.mom) || (a.dad && a.dad === b.dad);
  const childrenOf = a => folk().filter(b => b.mom === a.id || b.dad === a.id);
  const tell = text => S.log.push({ t: S.t, text });
  // a few words about one person, for whoever stops to look
  function describe(a) {
    if (!a.d.people || !a.name) return '';
    const age = Math.floor(a.age), p = S.byId.get(a.partner), kids = childrenOf(a).map(b => b.name);
    const what = a.job && a.age >= GROWN && a.age <= 46 ? 'a ' + a.job : a.age < 2 ? 'a baby' : a.age < SMALL ? 'a small child' : a.age < GROWN ? 'a child, learning to '
        + craftOf(a) : a.age > 46 ? 'an elder' : 'a ' + CRAFT_NAME[craftOf(a)];
    const mood = a.grief > 0.2 ? 'grieving' : a.mood === 'afraid' ? 'afraid' : a.e < 0.3 ? 'hungry' : a.mood === 'cold' ? 'cold' : a.e > 0.8 ? 'content' : 'getting by';
    const mom = S.byId.get(a.mom), dad = S.byId.get(a.dad), par = [mom, dad].filter(q => q && q.alive).map(q => q.name);
    const hh = homeSite(a),
      keeps = hh && hh.members ? ' The household of ' + hh.members + ' has ' + (hh.larder > hh.members * 1.5 ? 'a full larder' : hh.larder > hh.members * 0.5
          ? 'enough put by' : 'an empty larder') + (hh.fields ? ' and ' + hh.fields + ' field' + (hh.fields > 1 ? 's' : '') : '') + '.' : '';
    return a.name + ', ' + age + ', ' + what + '. ' + (p && p.alive ? (a.fem ? 'Her' : 'His') + ' partner is ' + p.name + '. ' : a.age >= WED ? 'On ' + (a.fem ? 'her' : 'his') + ' own. ' : '')
      + (kids.length ? 'Children: ' + kids.join(', ') + '. ' : '') + (a.age < WED && par.length ? 'Child of ' + par.join(' and ') + '. ' : '') + 'Now: ' + mood + '.' + keeps;
  }
  // Once in each step the camp's ties are looked over: who has grown close, who needs a roof, who has no one to choose
  function society(dt) {
    const T = S.tribe, P = folk(); if (!P.length) return;
    const evening = !DAY || S.tickNo % DAY === DAY - 2;
    T.kidsHungry = P.some(b => b.age < GROWN && b.e < 0.7);
    for (const q of T.sites) q.members = 0; for (const b of P) { const h = homeSite(b); if (h) h.members++; }
    // More than a household can eat before it spoils goes to the common store. A household gone short is helped first by
    // its own kin, if they have it to give.
    for (const q of T.sites) {
      if (!q.members) { if (q.larder > 0) { T.store += q.larder; q.larder = 0; } continue; }
      { const room = { tent: 4, hut: 6, house: 8 }[q.was || q.kind] || 6;            // too many under one roof: the eldest grown child with no partner goes to make a place of their own
        if (q.members > room && S.tickNo % TPY === 5) {
          const out = P.filter(b => b.house === q.id && b.age >= WED + 1 && !b.partner && [b.mom, b.dad].some(id => {
            const par = id && S.byId.get(id);
            return par && par.alive && par.house === q.id;
          })).sort((x, y) => y.age - x.age)[0];
          if (out) {
            out.house = 0;
            T.need.crowd += 1;
          }
        } }
      if (q.larder > q.members * 2.6) { const give = (q.larder - q.members * 2.6) * 0.3; q.larder -= give; T.store += give; }
      else if (q.larder < q.members * 0.25) {
        const mine = P.filter(b => b.house === q.id), kinRoof = T.sites.find(k => k !== q && k.members && k.larder > k.members * 1.2 && P.some(b => b.house === k.id && mine.some(m => kin(m, b))));
        if (kinRoof) {
          const give = Math.min(kinRoof.larder - kinRoof.members * 1.0, q.members * 0.5);
          kinRoof.larder -= give;
          q.larder += give;
          if (!T.gaveTold && give > 0.5) {
            T.gaveTold = true;
            const g = P.find(b => b.house === kinRoof.id && b.age >= WED), r = mine.find(b => b.age >= WED);
            if (g && r) tell(g.name + "'s household has sent food to " + r.name + "'s. They are kin, and one larder was empty.");
          }
        }
      }
    }
    { const wl = T.sites.find(q => q.kind === 'well' && raised(q));                     // every household walks to the fire and fetches its water, every day
      for (const q of T.sites) if (live(q)) { const n = P.filter(b => b.house === q.id).length; if (!n) continue; walk(q.x, q.y, T.x, T.y, 0.02 * n); if (wl) walk(q.x, q.y, wl.x, wl.y, 0.012 * n); }
      if (!wl && T.waterAt) walk(T.x, T.y, T.waterAt % N, (T.waterAt / N) | 0, 0.01 * P.length);
      if (S.tickNo % 4 === 0) for (let i = 0; i < N * N; i++) if (tread[i] > 0) tread[i] *= 0.965; }
    for (const a of P) {
      if (a.grief > 0) a.grief = Math.max(0, a.grief - dt * 1.2);
      if (a.partner) { const q = S.byId.get(a.partner); if (!q || !q.alive) a.partner = 0; }
      // the young learn by going along: a child picks up whatever its parents are doing
      if (a.age >= SMALL && a.age < GROWN) for (const id of [a.mom, a.dad]) {
        const q = id && S.byId.get(id);
        const k = q && q.alive && q.act && { hunt: 'hunt', fish: 'fish', gather: 'gather', build: 'build', chop: 'build', haul: 'build' }[q.act.k];
        if (k) practise(a, k, 0.006);
      }
    }
    // courting: two who are free, not kin, near in age and around the same fire of an evening grow close, and in time pair off
    if (evening) for (const a of P) {
      if (a.partner || a.age < WED || a.grief > 0.3 || !a.fem) continue;
      for (const b of P) {
        if (b.fem || b.partner || b.age < WED || b.grief > 0.3 || kin(a, b) || Math.abs(a.age - b.age) > 14 || cheb(doorOf(a), doorOf(b)) > 12) continue;   /* neighbours, not only those who happen to stand side by side */
        a.bond[b.id] = (a.bond[b.id] || 0) + R(0.05, 0.3); a.court = b.id; b.court = a.id;
        if (a.bond[b.id] >= 1) { a.partner = b.id; b.partner = a.id; a.court = b.court = 0; tell(a.name + ' and ' + b.name + ' have become a couple.');
          {
            const withParents = q => !!q.house && [q.mom, q.dad].some(id => {
              const par = id && S.byId.get(id);
              return par && par.alive && par.house === q.house;
            });   /* a couple wants a roof of its own: whoever still lives with their parents leaves; if one already keeps house, the other moves in */
            const la = withParents(a), lb = withParents(b);
            if (la && (lb || !b.house)) a.house = 0;
            if (lb && (la || !a.house)) b.house = 0;
            if (la && !lb && b.house) a.house = b.house;
            if (lb && !la && a.house) b.house = a.house;
          }
          S.fx.push({ kind: 'pair', a: a.id, b: b.id }); }
        break;
      }
    }
    // a roof for every household: a couple, or one alone with children, claims a finished house that nobody has
    for (const a of P) {
      if (a.age < WED) {
        const par = S.byId.get(a.mom) || S.byId.get(a.dad);
        const live = [a.mom, a.dad].map(id => S.byId.get(id)).find(q => q && q.alive && q.house);
        a.house = live ? live.house : a.house;
        continue;
      }
      if (a.house && !T.sites.some(q => q.id === a.house && live(q))) a.house = 0;
      const q = S.byId.get(a.partner); if (!a.house && q && q.house) a.house = q.house;
      if (!a.house) {
        const free = T.sites.find(st => live(st) && !P.some(b => b.house === st.id));
        if (free) {
          a.house = free.id;
          if (q) q.house = free.id;
          tell((q ? a.name + ' and ' + q.name : a.name) + ' moved into a ' + (free.was || free.kind) + ' of their own.');
        }
      }
    }
    // no one to choose: when the grown and free have only kin around them, in time someone comes over the hills
    const held = S.levers.hold[P[0].sp];
    if (!opt.closed && S.tickNo % TPY === 0 && !(held !== undefined && P.length >= held)) {
      for (const a of P) {
        if (a.partner || a.age < WED || a.age > 40 || a.grief > 0.3) continue;
        if (P.some(b => b !== a && b.fem !== a.fem && !b.partner && b.age >= WED - 2 && !kin(a, b) && Math.abs(a.age - b.age) <= 14)) continue;
        if (rnd() < 0.45) { const [ex, ey] = edgeOfReach(), c = add(a.sp, ex, ey, clamp(a.age + R(-4, 4), WED + 1, 34), 0.9); c.fem = !a.fem; c.name = nameFor(c);
          S.fx.push({ kind: 'arrive', id: c.id, x: c.x, y: c.y }); tell('A stranger has come over the hills: ' + c.name + ', a ' + CRAFT_NAME[craftOf(c)] + '.'); break; }
      }
    }
  }
  // how many roofs are wanted: one for every roof lived in, and one for every couple or grown person who has none
  const households = () => {
    const T = S.tribe;
    let n = T.sites.filter(q => q.kind !== 'well' && q.members > 0).length;
    for (const a of folk()) if (a.age >= WED && !a.house && (!a.partner || a.fem)) n++;
    return Math.max(1, n);
  };

  for (const sp in SP) { const d = SP[sp]; if (d.people) continue; const n = opt[sp] === undefined ? Math.round((d.start || 0) * N * N / 1600) : opt[sp]; for (let k = 0; k < n; k++) add(sp, R(0, N), R(0, N)); }
  {
    const [bx, by] = campSite();
    S.tribe.x = bx; S.tribe.y = by;
    for (const sp in SP) if (SP[sp].people) {
      const n = opt[sp] === undefined ? SP[sp].start : opt[sp];
      for (let k = 0; k < n; k++) add(sp, bx, by, 18 + k * 2, 1);
      if (opt.family) {
        const mom = S.agents[S.agents.length - 1];
        for (const c of [add(sp, bx, by, 5, 1), add(sp, bx, by, 0.9, 1)]) {
          c.mom = mom.id;
          c.dad = mom.partner;
        }
      }
    }
  }
  const die = (a, why, by) => {
    if (!a.alive) return;
    a.alive = false;
    folkList = null;
    if (why === 'eaten' || why === 'hunted' || why === 'killed by people') sound(a.x, a.y, 4, 'kill');
    S.fx.push({ kind: 'death', sp: a.sp, x: a.x, y: a.y, why, id: a.id, by: by || 0 });
    const k = a.sp + ':' + why;
    S.deaths[k] = (S.deaths[k] || 0) + 1;
    if (a.d.people && (why === 'hunger' || why === 'cold and hunger')) {
      /* where the starved lived, against where households live: is hunger worst at the edge? */
      const T = S.tribe, h = homeSite(a), homes = T.sites.filter(q => live(q) && q.members > 0);
      if (h && homes.length > 1) { S.stat.starveD += cheb(h, T); S.stat.starveRef += homes.reduce((p, q) => p + cheb(q, T), 0) / homes.length; S.stat.starveN++; }
    }
    if (a.d.people) {
      S.tribe.dead++;
      if (why === 'eaten') S.tribe.threat += 2;
      if (why === 'hunger' || why === 'cold and hunger') S.tribe.need.hunger += 0.4;
      if (why !== 'eaten' && why !== 'struck') S.tribe.need.loss += 1;
      if (a.name) { const near = folk().filter(b => b !== a && (b.partner === a.id || kin(a, b))); for (const b of near) { b.grief = 1; if (b.partner === a.id) b.partner = 0; }
        const how = { 'old age': 'has died, full of years',
          eaten: 'was taken by a wolf',
          drowned: 'drowned in the flood',
          burned: 'died in the fire',
          struck: 'was struck down',
          hunger: 'starved',
          'cold and hunger': 'died of cold and hunger' }[why] || 'has died';
        tell(a.name + ' ' + how + '.' + (near.length ? ' ' + near.slice(0, 3).map(b => b.name).join(', ') + (near.length > 1 ? ' mourn.' : ' mourns.') : '')); }
    }
    // a kill is seen: those of its kind nearby stay wary of that kind of hunter for most of a year
    if (why === 'eaten' || why === 'hunted') { const k = by && S.byId.get(by); if (k) for (const b of S.agents) if (b.alive && b.sp === a.sp && cheb(b, a) <= 6) { b.fear = 1; b.fearSp = k.sp; } }
  };
  function nearest(a, r, ok) {
    let best = null, bd = r + 0.01;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = a.x + dx, y = a.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue;
      for (const b of cells[I(x, y)]) { if (!b.alive || b === a || !ok(b)) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); if (d < bd) { bd = d; best = b; } }
    }
    return best;
  }
  // every living creature within r tiles that passes ok (from the per-tile lists, not the whole world)
  function around(a, r, ok) {
    const out = [];
    for (let y = Math.max(0, a.y - r); y <= Math.min(N - 1, a.y + r); y++) for (let x = Math.max(0, a.x - r); x <= Math.min(N - 1, a.x + r); x++) for (const b of cells[I(x, y)]) if (b.alive && b !== a && ok(b)) out.push(b);
    return out;
  }
  // the tiles under crop, gathered once each sowing (and after a load) rather than searched for every step
  let fieldList = null;
  const fieldTiles = () => { if (!fieldList) { fieldList = []; for (let i = 0; i < N * N; i++) if (field[i]) fieldList.push(i); } return fieldList; };
  // like nearest, but each candidate's distance is shifted by a bias: a way to prefer the weak, the young, the unwary
  function nearestBy(a, r, ok, bias) {
    let best = null, bd = 1e9;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = a.x + dx, y = a.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue;
      for (const b of cells[I(x, y)]) { if (!b.alive || b === a || !ok(b)) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)) + bias(b); if (d < bd) { bd = d; best = b; } }
    }
    return best;
  }
  // what cannot be walked onto: water, and for anything on four legs that is not led, a closed fence met from the outside
  const within = a => { const w = S.tribe.wall; return !!w && a.x > w.x0 && a.x < w.x1 && a.y > w.y0 && a.y < w.y1; };
  const shut = (a, x, y) => { const i = I(x, y); if (water[i]) return true; const T = S.tribe; return !!(T.fence && T.fence[i] && !a.d.people && !a.tame && !within(a)); };
  function stepTo(a, tx, ty, n) {
    for (let k = 0; k < n; k++) {
      const dx = Math.sign(tx - a.x), dy = Math.sign(ty - a.y); if (!dx && !dy) return;
      let nx = clamp(a.x + dx, 0, N - 1), ny = clamp(a.y + dy, 0, N - 1);
      if (shut(a, nx, ny)) {
        if (!shut(a, nx, a.y)) ny = a.y; else if (!shut(a, a.x, ny)) nx = a.x; else {
          nx = clamp(a.x + ((rnd() * 3) | 0) - 1, 0, N - 1);
          ny = clamp(a.y + ((rnd() * 3) | 0) - 1, 0, N - 1);
          if (shut(a, nx, ny)) return;
        }
      }
      a.x = nx; a.y = ny;
    }
  }
  // ---- routes (E1). The way a body actually goes from one tile to another: over dry ground and bridges, never over open
  // water, round a closed fence unless it is a person or led; a made road is quicker going. A* over tiles, diagonal steps only
  // where both sides are open. If the goal cannot be reached, the route goes to the reachable tile nearest it.
  let bridgeSet = null, bridgeKeys = -1;
  function bridgeTiles() { const T = S.tribe, k = Object.keys(T.bridged || {}).length; if (bridgeSet && k === bridgeKeys) return bridgeSet; bridgeSet = new Uint8Array(N * N); for (const f of fords) if (T.bridged[f.key]) for (const t of f.tiles) bridgeSet[t] = 1; bridgeKeys = k; return bridgeSet; }
  const ROUTE_G = new Float64Array(N * N), ROUTE_FROM = new Int32Array(N * N), ROUTE_SEEN = new Int32Array(N * N); let routeGen = 0;
  function route(x0, y0, x1, y1, a, maxCost) {
    const T = S.tribe, br = bridgeTiles(), s0 = I(clamp(x0, 0, N - 1), clamp(y0, 0, N - 1)), goal = I(clamp(x1, 0, N - 1), clamp(y1, 0, N - 1)), gx = goal % N, gy = (goal / N) | 0;
    const open = j => (!water[j] || br[j]) && !(a && T.fence && T.fence[j] && !a.d.people && !a.tame && !within(a));
    const hcost = j => { const dx = Math.abs(j % N - gx), dy = Math.abs(((j / N) | 0) - gy); return 0.67 * (Math.max(dx, dy) + 0.41 * Math.min(dx, dy)); };
    /* across open ground the way is simply straight: walked tile by tile, a diagonal step only where both sides are open */
    { let x = s0 % N, y = (s0 / N) | 0, ok = true, cost = 0; const line = [];
      while (x !== gx || y !== gy) { const dx = Math.sign(gx - x), dy = Math.sign(gy - y), sx = Math.abs(gx - x) * 2 >= Math.abs(gy - y) ? dx : 0, sy = Math.abs(gy - y) * 2 >= Math.abs(gx - x) ? dy : 0;
        const nx = x + sx, ny = y + sy, j = I(nx, ny); if (!open(j) || (sx && sy && (!open(I(nx, y)) || !open(I(x, ny))))) { ok = false; break; }
        cost += (sx && sy ? 1.41 : 1) * (T.road[j] ? 0.67 : 1); x = nx; y = ny; line.push(j); }
      if (ok) return { tiles: line, reached: true, cost }; }
    routeGen++; const heap = [];
    const push = (j, k) => { heap.push([k, j]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    ROUTE_SEEN[s0] = routeGen; ROUTE_G[s0] = 0; ROUTE_FROM[s0] = -1; push(s0, hcost(s0));
    let best = s0, bh = hcost(s0), found = false;
    while (heap.length) {
      const [fk, c] = pop(); if (c === goal) { found = true; break; }
      if (maxCost !== undefined && fk > maxCost) break;   /* nothing left that could arrive within the cost asked for */
      const cx = c % N, cy = (c / N) | 0, h = hcost(c); if (h < bh) { bh = h; best = c; }
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        const j = I(nx, ny); if (!open(j) || (dx && dy && (!open(I(nx, cy)) || !open(I(cx, ny))))) continue;
        const g = ROUTE_G[c] + (dx && dy ? 1.41 : 1) * (T.road[j] ? 0.67 : onWay(nx, ny) ? 0.85 : 1);
        if (ROUTE_SEEN[j] === routeGen && ROUTE_G[j] <= g) continue;
        ROUTE_SEEN[j] = routeGen; ROUTE_G[j] = g; ROUTE_FROM[j] = c; push(j, g + hcost(j));
      }
    }
    const end = found ? goal : best, tiles = []; for (let c = end; c !== s0 && c >= 0; c = ROUTE_FROM[c]) tiles.push(c); tiles.reverse();
    return { tiles, reached: found, cost: found ? ROUTE_G[goal] : Infinity };
  }
  const roam = (a, r, n) => stepTo(a, a.x + ((rnd() * (2 * r + 1)) | 0) - r, a.y + ((rnd() * (2 * r + 1)) | 0) - r, n);

  // ---- homes: an animal with a home trait keeps a burrow or den, shares it with its kind, and digs a new one when it is full or too far
  function homeOf(a) {
    let h = a.home && S.homes.get(a.home); if (h) return h;
    let bd = a.d.home === 'den' ? 22 : 9;
    for (const q of S.homes.values()) {
      if (q.sp !== a.sp || q.n >= (a.d.home === 'den' ? 30 : 10)) continue;
      const d = Math.max(Math.abs(q.x - a.x), Math.abs(q.y - a.y));
      if (d < bd) {
        bd = d;
        h = q;
      }
    }
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
      for (let k = 0; k < 6; k++) {
        const x = clamp(a.x + ((rnd() * 7) | 0) - 3, 0, N - 1), y = clamp(a.y + ((rnd() * 7) | 0) - 3, 0, N - 1), j = I(x, y);
        if (water[j]) continue;
        let sc = (d.eats.grass ? grass[j] * (1 - snowBlock(j, d.mass)) : 0) + (d.eats.fruit ? fruit[j] : 0) + rnd() * 0.05;
        if (anc) sc -= Math.max(0, Math.max(Math.abs(x - anc.x), Math.abs(y - anc.y)) - anc.r) * 0.02;
        if (sc > bs) {
          bs = sc;
          bx = x;
          by = y;
        }
      }
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
  const herdSize = a => {
    let c = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = a.x + dx, y = a.y + dy;
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      for (const b of cells[I(x, y)]) if (b.alive && b !== a && b.sp === a.sp) c++;
    }
    return c;
  };
  const onHunt = b => b.act && (b.act.k === 'stalk' || b.act.k === 'chase' || b.act.k === 'hunt' || b.act.k === 'kill');
  // ---- eating meat: find a body small enough, close in, and try
  function hunt(a, d, dt) {
    const prey = nearestBy(a, d.sense, b => {
      if (b.hidden || !canTake(a, b)) return false;
      if (S.popPeople >= 3 && a.e > 0.3 && cheb(b, S.tribe) <= 3) return false;   // nothing hunts inside a peopled camp unless it is starving
      if (S.tribe.fence && within(b) && !within(a)) return false;                  // nor through a closed fence
      const j = I(b.x, b.y);
      if (bodyOf(b) > d.mass) {                                       // bigger than me: only when desperate, or when it is alone in thick cover
        if (!(a.e < 0.3 || (a.e < 0.65 && tree[j] > 0.55))) return false;
        if (nearest(b, 1, c => c.sp === b.sp)) return false;
      }
      // the young are guarded: not worth it while a grown one too big to fight stands beside them
      if (b.age < b.d.mature && nearest(b, 1, c => c.sp === b.sp && c.age >= c.d.mature && c.d.mass > d.mass)) return false;
      return rnd() > cover(j) * 1.1 + hideBonus(b);
    }, b => (b.age < b.d.mature || b.age > b.life * 0.8 || b.e < 0.4) ? -2 : 0);   // the young, the old and the starved are taken first
    if (!prey) return false;
    a.act = { k: cheb(prey, a) > 2 ? 'stalk' : 'chase', id: prey.id };
    stepTo(a, prey.x, prey.y, d.speed);
    if (cheb(prey, a) <= 1) {
      const j = I(prey.x, prey.y), pm = bodyOf(prey), together = d.social === 'pack' && nearest(a, 3, b => b.sp === a.sp) ? 1.6 : 1;
      const watched = prey.d.social === 'herd' && herdSize(prey) >= 2 ? (nearest(prey, 3, c => c.sp === prey.sp && (c.watch === S.tickNo - 1
          || c.watch === S.tickNo)) ? 0.35 : 0.55) : 1;                 // many eyes
      const p = 0.42 * (pm < 1 ? 0.72 : 1) * Math.pow(Math.min(1, d.mass / pm), 5) * together * watched * (1 - cover(j)) * TPY * dt * 1.6;
      if (rnd() < p) {
        die(prey, 'eaten', a.id); const meal = pm / d.mass; a.act = { k: 'kill', id: prey.id, x: prey.x, y: prey.y };
        const pk = d.social === 'pack' ? around(a, 5, b => b.sp === a.sp) : [];
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
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
        const x = a.x + dx, y = a.y + dy;
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        for (const b of cells[I(x, y)]) if (b.alive && b !== a && b.sp === a.sp) {
          sx += x;
          sy += y;
          c++;
        }
      }
      if (c) return { x: Math.round(sx / c), y: Math.round(sy / c), r: 1 };
    }
    return null;
  }
  const off = (a, p) => Math.max(Math.abs(a.x - p.x), Math.abs(a.y - p.y));
  // rest where it belongs: beside the burrow, in the den's lee, or lying in the middle of the herd
  function settle(a, d, anc, k) { if (anc && off(a, anc) > anc.r) stepTo(a, anc.x, anc.y, d.speed); a.act = { k, x: a.x, y: a.y }; }
  // ---- one behaviour for every animal; the traits decide which parts ever fire
  function animal(a, d, dt) {
    if (a.tame) {                                                    // raised among people: it keeps to the camp, is fed in hard times, and works
      const T = S.tribe; if (!S.popPeople) { a.tame = false; } else {
        if (a.e < 0.75 && T.store > S.popPeople * 0.8) { T.store -= 0.12; a.e += 0.3; }
        if (a.e < 0.6 && folk().some(b => b.job === 'herder')) a.e = 0.6;      // a herder leads them to grass and brings them in at night
        if (a.cart >= S.tickNo - 1 && !S.night) { a.act = { k: 'cart', j: a.cartJ }; return; }
        if (cheb(a, T) > 3 || S.night) stepTo(a, T.x, T.y, 2);
        if (S.night) { a.act = { k: 'sleep', x: a.x, y: a.y }; return; }
        if (a.e < 0.95) forage(a, d, dt, { x: T.x, y: T.y, r: 3 }, true); a.act = { k: 'graze', x: a.x, y: a.y }; return;
      }
    }
    // fear: whatever could eat it is fled from when close; from further off when it is plainly hunting and can be seen,
    // or when one of its kind was lately killed by that sort of hunter
    const onWatch = a.watch === S.tickNo - 1;                          // it spent the last while with its head up
    const threat = (d.eats.meat && a.e < 0.3) ? null : nearest(a, onWatch ? d.sense + 1 : Math.min(d.sense, 4), b => {
      if (b.hidden || !canTake(b, a) || b.d.mass <= bodyOf(a) * 0.8) return false;
      if (cheb(b, a) <= 2 || (a.fear > 0 && a.fearSp === b.sp)) return true;
      return onHunt(b) && (onWatch || rnd() > cover(I(b.x, b.y)));
    });
    const h = d.home ? homeOf(a) : null;
    if (!threat && d.social === 'herd') {                              // one startled deer starts the herd
      const m = nearest(a, 3, b => b.sp === a.sp && b.act && b.act.k === 'flee' && !b.act.alarm);
      if (m) { a.mood = 'afraid'; a.act = { k: 'flee', id: m.act.id, alarm: 1 }; stepTo(a, a.x + (a.x - m.act.fx) * 3, a.y + (a.y - m.act.fy) * 3, d.speed); return; }
    }
    // the din of people: anything big enough to be hunted, and any hunter with a full belly, keeps its distance from it.
    // A camp asleep is quiet, and then they come close.
    if (!threat && d.mass >= 1 && !a.held && (a.e > 0.6 || !d.eats.meat)) {
      const n = hear(a, k => k === 'work' || k === 'play' || k === 'cry');
      if (n && n.l > 0.9 && a.e > 0.25) {
        a.mood = 'afraid';
        a.act = { k: 'flee', id: 0, alarm: 1 };
        stepTo(a, a.x + ((a.x - n.x) || 1) * 3, a.y + ((a.y - n.y) || 1) * 3, d.speed);
        return;
      }
    }
    if (threat) {
      a.mood = 'afraid'; a.act = { k: 'flee', id: threat.id, fx: threat.x, fy: threat.y };
      // the very young of animals without a hole do not run: they drop where they stand and lie still, if there is anything to lie in
      if (!h && a.age < d.mature * 0.5 && cheb(threat, a) > 1 && cover(I(a.x, a.y)) > 0.3) { a.hidden = true; a.act.k = 'hide'; return; }
      if (h && Math.max(Math.abs(h.x - a.x), Math.abs(h.y - a.y)) <= 5) {
        stepTo(a, h.x, h.y, d.speed + 1);
        a.act.home = h.id;
        if (atHome(a, h)) {
          a.hidden = true;
          a.act.k = 'hide';
        }
        return;
      }   // bolt for the hole
      stepTo(a, a.x + (a.x - threat.x) * 3, a.y + (a.y - threat.y) * 3, d.speed); return;
    }
    // a pack that made a kill comes to eat it
    if (a.feedAt) { const f = a.feedAt; a.feedAt = null; stepTo(a, f.x, f.y, d.speed + 1); a.act = { k: 'feed', x: f.x, y: f.y }; return; }
    // in bitter air a fed animal goes home and stays there
    if (h && a.e > 0.6 && tempAt(I(a.x, a.y)) < d.comfort - 1) {
      stepTo(a, h.x, h.y, d.speed);
      a.act = { k: 'home', home: h.id };
      if (atHome(a, h)) {
        a.hidden = true;
        a.mood = 'asleep';
        a.act.k = 'den';
      }
      return;
    }
    const anc = anchorOf(a, d, h);
    // the young keep close to their mother
    const mom = a.mom && a.age < d.mature * 0.5 ? S.byId.get(a.mom) : null;
    if (mom && mom.alive && !mom.hidden && cheb(mom, a) > 1) {
      stepTo(a, mom.x, mom.y, d.speed + 1);
      a.act = { k: 'follow', id: mom.id };
      if (plantEater(d) && a.e < 0.95) forage(a, d, dt, null, true);
      return;
    }
    if (d.eats.meat && a.e < 0.8 && hunt(a, d, dt)) return;
    if (d.eats.fish && a.e < 0.85 && fishing(a, d, dt)) { a.act = { k: 'fish', x: a.x, y: a.y }; return; }
    if (plantEater(d)) {
      if (d.social === 'herd' && !S.night) {
        const here = I(a.x, a.y);
        // in the heat of the day a fed herd goes and lies in the shade
        if (a.e > 0.6 && tempAt(here) > 24 && tree[here] < 0.4) {
          let bj = -1, bd = 1e9;
          for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
            const x = a.x + dx, y = a.y + dy;
            if (x < 0 || y < 0 || x >= N || y >= N) continue;
            const j = I(x, y);
            if (water[j] || tree[j] < 0.4) continue;
            const dd = Math.hypot(dx, dy);
            if (dd < bd) {
              bd = dd;
              bj = j;
            }
          }
          if (bj >= 0) { stepTo(a, bj % N, (bj / N) | 0, d.speed); a.act = { k: 'rest', x: a.x, y: a.y, shade: 1 }; return; }
        }
        // while the others eat, one that has eaten stands with its head up; they take it in turns
        if (a.e > 0.7 && a.age >= d.mature && (a.id + S.tickNo) % 5 === 0 && herdSize(a) >= 2) { a.watch = S.tickNo; a.act = { k: 'watch', x: a.x, y: a.y }; return; }
      }
      if (S.night && d.social === 'herd') { settle(a, d, anc, 'sleep'); return; }   // herds sleep at night, lying close together; small grazers nibble on in the dark
      if (a.e < 0.95) {
        // a hunter on the move nearby: drift away from it while eating
        const eye = nearest(a, 4, b => canTake(b, a) && b.d.mass > bodyOf(a) * 0.8 && b.act && (b.act.k === 'stalk' || b.act.k === 'prowl'));
        if (eye) stepTo(a, a.x + Math.sign(a.x - eye.x), a.y + Math.sign(a.y - eye.y), 1);
        if (d.social === 'herd' && a.id % 3 === 0) sound(a.x, a.y, 0.9, 'herd');   /* a herd at graze can be heard, if not from far */
        forage(a, d, dt, anc, !!eye); a.act = { k: 'graze', x: a.x, y: a.y, wary: eye ? eye.id : 0 }; return;
      }
      settle(a, d, anc, 'rest'); return;
    }
    if (d.eats.meat && a.e < 0.8) {
      // nothing in sight: a hungry hunter goes toward whatever sounds like food. A kill, a herd, a crying child; and when it is
      // hungry enough, the noise of people at work. At night a hungry pack gives tongue, and is heard a long way off.
      const n = hear(a, k => k === 'kill' || k === 'herd' || k === 'cry' || (a.e < 0.45 && (k === 'work' || k === 'play')));
      if (S.night && d.social === 'pack' && a.e < 0.5 && rnd() < 0.15) sound(a.x, a.y, 5, 'howl');
      if (n) { stepTo(a, n.x, n.y, d.speed); a.act = { k: 'prowl', x: a.x, y: a.y, heard: n.k }; return; }
      roam(a, 3, d.speed); a.act = { k: 'prowl', x: a.x, y: a.y }; return;
    }
    settle(a, d, anc, S.night ? 'rest' : 'sleep');                           // a fed hunter sleeps through the day in the den's lee
  }

  // ---------------------------------------------------------------- people
  // Trips. Each working step of a grown member of a household is one trip, counted by where it went and how far, for the
  // year; last year's counts are what a household knows about its own days (phase I weighs where to live with them).
  const TRIP_OF = { gather: 'forage', fish: 'forage', hunt: 'hunt', chop: 'timber', quarry: 'stone', build: 'build', fence: 'build', wood: 'wood', eat: 'store', guard: 'guard', patrol: 'guard' };
  function tally(a) {
    if (S.night || a.age < GROWN || a.age > 46 || !a.alive) return; const h = homeSite(a); if (!h) return;
    const k = a.act ? (a.act.k === 'haul' ? (a.act.item === 'stone' ? 'stone' : 'timber') : TRIP_OF[a.act.k] || 'home') : 'home';
    if (!h.trips) { h.trips = {}; h.tripD = {}; h.workDays = 0; }
    h.trips[k] = (h.trips[k] || 0) + 1; h.tripD[k] = (h.tripD[k] || 0) + (a.tripD || 0); h.workDays++;
  }
  // ---- trips (E2). Gathering and fishing are real journeys: out along the route, the work where the food is, and home
  // again with the load, which goes into the larder on arrival. A grown person walks PACE tiles in a step; what is left of
  // a step after walking is worked, and a step that ends at the door can start the next trip. So distance costs time
  // because it takes time, not by a factor.
  const PACE = 20;   /* tiles a grown person walks in a step: set so populations match the walking factor it replaces (E2) */
  function workAt(a, d, j, kind, budget) {
    const T = S.tribe, eff = TPY * (1 / TPY) * S.dayK * budget / (1 + tree[j] * tree[j] * 1.2);
    if (kind === 'fish') {
      let wj = j; if (!water[wj]) { const x = j % N, y = (j / N) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N && water[I(nx, ny)]) { wj = I(nx, ny); break; } } }
      const take = Math.min(fish[wj] * 0.5, 0.31 * eff * a.skill.fish * (a.job === 'fisher' ? 1.3 : 1)) * (tempAt(wj) < -3 ? 0.65 : 1);
      practise(a, 'fish'); fish[wj] -= take; T.got.fish += take * 1.5; T.eff.fish++; a.act = { k: 'fish', x: wj % N, y: (wj / N) | 0, got: take }; return take * 1.5;
    }
    practise(a, 'gather');
    const tf = Math.min(fruit[j], 0.24 * eff * a.skill.gather * (a.job === 'gatherer' ? 1.3 : 1)); fruit[j] -= tf;
    const tg = Math.min(grass[j] * 0.3, 0.08 * eff) * (1 - snowBlock(j, d.mass)); grass[j] -= tg;
    T.got.gather += tf * 1.6 + tg * 0.5; T.eff.gather++; a.act = { k: 'gather', x: j % N, y: (j / N) | 0, fruit: tf > 0.01 ? 1 : 0, got: tf * 1.6 + tg * 0.5 };
    return tf * 1.6 + tg * 0.5;
  }
  /* carry a trip on for one step with the time given; returns the time left once it is over (at the door), or -1 */
  function runTrip(a, d, pace, budget) {
    const tr = a.trip, speed = PACE * pace;
    if (tr.phase !== 'work') {
      let steps = Math.floor(speed * budget + 1e-9), walked = 0;
      while (steps-- > 0 && tr.path.length) { const t = tr.path.shift(); a.x = t % N; a.y = (t / N) | 0; walked++; }
      budget -= walked / speed; tr.walked += walked;
      if (tr.path.length) { a.act = { k: tr.phase === 'out' ? 'walkto' : 'carryhome', x: a.x, y: a.y, item: tr.kind === 'fish' ? 'fish' : 'basket' }; return -1; }
      if (tr.phase === 'back') { bring(a, tr.load); S.stat.forageD += tr.walked / 2; S.stat.forageN++; a.trip = null; a.act = { k: 'home', x: a.x, y: a.y }; return Math.max(0, budget); }
      tr.phase = 'work';
    }
    if (budget > 0.02) { tr.load += workAt(a, d, tr.j, tr.kind, budget); const door = doorOf(a); tr.phase = 'back';
      /* home the way they came, if they set out from the door; else by a route of its own */
      tr.path = tr.back && tr.back.length && tr.back[tr.back.length - 1] === I(door.x, door.y) ? tr.back : route(a.x, a.y, door.x, door.y, a).tiles; }
    return -1;
  }
  function person(a, d, dt) {
    a.wood = -1; a.tripD = 0; const T = S.tribe, dist = Math.max(Math.abs(a.x - T.x), Math.abs(a.y - T.y)), pop = S.pop[a.sp];
    // eating: from their own larder, at home. What is held in common by the fire is eaten only at the fire: someone whose
    // own larder is empty walks over to it, and that is their day. When there is little, the grown go short so the children eat.
    const hm = homeSite(a), mouths = hm ? hm.members || 1 : pop, short = a.age >= GROWN && T.kidsHungry && (hm ? (hm.larder || 0) < mouths * 0.5 : T.store < pop * 0.5);
    if (a.e < (short ? 0.4 : 0.85)) {
      let want = Math.min(1 - a.e, 0.5);
      if (hm && hm.larder > 0.05) { const t = Math.min(hm.larder, want); hm.larder -= t; a.e += t; want -= t; }
      if (want > 0.05 && T.store > 0.05 && dist <= 2) { const t = Math.min(T.store, want); T.store -= t; a.e += t; }
      else if (want > 0.05 && a.e < 0.4 && T.store > want && a.age >= SMALL && !S.night) {
        stepTo(a, T.x, T.y, 40); if (Math.max(Math.abs(a.x - T.x), Math.abs(a.y - T.y)) <= 2) { const t = Math.min(T.store, want); T.store -= t; a.e += t; a.act = { k: 'eat' }; S.stat.fireMeals++; return; }   /* the way may be barred by water */
      }
    }
    if (a.age < SMALL) { stepTo(a, T.x, T.y, 1); a.act = { k: S.night ? 'sleep' : a.age < 2 ? 'baby' : 'play' };
      if (a.age < 2 && (a.e < 0.5 || a.mood === 'cold')) sound(a.x, a.y, 3, 'cry');
      else if (!S.night && a.age >= 2) sound(a.x, a.y, 1.6, 'play');   /* a hungry or cold baby cries, day or night; children at play are not quiet */
      return; }
    if (a.trip) { if (S.night || a.age < SMALL) { bring(a, a.trip.load); a.trip = null; } }   /* night overtakes a trip: they come home with what they have */
    if (S.night) {                                                       // nights are spent at the camp; one of the able sits up by the fire
      const hm = a.house && T.sites.find(q => q.id === a.house);      /* home is their own roof once they have one; the fire until then */
      { const h = hm || T; if (Math.max(Math.abs(a.x - h.x), Math.abs(a.y - h.y)) > 1 && (mass[I(a.x, a.y)] === mass[I(h.x, h.y)] || route(a.x, a.y, h.x, h.y, a).reached)) { a.x = h.x; a.y = h.y; } }   /* home by dusk, wherever the day ended */
      const day = Math.floor(S.tickNo / (DAY || 1)); if (a.age >= WED && a.age <= 46 && a.e > 0.5 && T.watchDay !== day) { T.watchDay = day; T.watcher = a.id; }
      const onWatch = T.watcher === a.id && T.watchDay === day; a.act = { k: onWatch ? 'watch' : 'sleep' };
      if (onWatch) { const hw = hear(a, k => k === 'howl'); if (hw) T.threat += hw.l * 0.15; }   /* the one awake hears the pack, and says so in the morning */
      const w = nearest(a, onWatch ? 3 : 1, b => !b.hidden && canTake(b, a));
      if (w && a.e > 0.6 && rnd() < (onWatch ? 0.5 : 0.2) * TPY * dt) {
        die(w, 'killed by people', a.id);
        a.act = { k: 'guard', id: w.id };
      }
      return;
    }
    // people fear what can eat them: the young run for the camp, one alone backs away; three together stand their ground
    const beast = nearest(a, 4, b => !b.hidden && canTake(b, a));
    if (beast) {
      let band = a.age >= d.mature ? 1 : 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const x = a.x + dx, y = a.y + dy;
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        for (const b of cells[I(x, y)]) if (b.alive && b !== a && b.sp === a.sp && b.age >= d.mature) band++;
      }
      if (a.age < d.mature || band < 3) {
        a.mood = 'afraid';
        stepTo(a, dist > 1 ? T.x : a.x + (a.x - beast.x), dist > 1 ? T.y : a.y + (a.y - beast.y), 2);
        a.act = { k: 'flee', id: beast.id };
        return;
      }
    }
    a.act = { k: 'idle' };
    const grown = a.age >= d.mature, old = a.age > 46, able = grown && !old, pace = able ? 1 : 0.6;   // children help close to home; the old keep the camp
    /* someone out on a trip carries on with it; time left at the door goes to whatever comes next */
    let budget = 1;
    if (a.trip) { budget = runTrip(a, d, pace, 1); if (budget < 0.1) return; }
    if (a.grief > 0.55 && a.e > 0.45 && rnd() < 0.6) { stepTo(a, T.x, T.y, 2); a.act = { k: 'mourn' }; return; }   // the newly bereaved sit by the fire and do little
    // foul weather: with a roof, food in the store and nothing pressing, people stay in
    if (T.huts > 0 && a.e > 0.6 && (hm ? (hm.larder || 0) > mouths * 0.9 : T.store > pop * 1.1)) {
      const ct = tempAt(I(T.x, T.y)); if (ct < d.comfort - 9 || (S.precip > 0 && ct >= 0 && ct < 5)) { stepTo(a, T.x, T.y, 3); a.act = { k: 'shelter' }; return; }
    }
    const adults = S.adults[a.sp] || 0, campT = tempAt(I(T.x, T.y));
    // huts and firewood come out of the nearest trees
    // houses: a plot is chosen, timber is felled and carried to it, and the house goes up a stage at a time
    const trade = a.job && (a.job === 'builder' || a.job === 'woodcutter' || a.job === 'mason');
    /* the hungry look for food first; building, felling and hauling are for the fed */
    /* the chance to turn to building is weighed each step; someone away on trips weighs it on coming home, for all the steps away */
    const pBuild = Math.min(1, dt * 12 * a.skill.build * (!a.job ? 1 : trade ? 2.4 : 0.3) * (T.skills.tools ? 1.3 : 1)), away = Math.max(1, S.tickNo - (a.freeT || S.tickNo - 1)); a.freeT = S.tickNo;
    if (able && a.e > 0.6 && rnd() < 1 - Math.pow(1 - pBuild, away) && construct(a)) { practise(a, 'build'); return; }   /* building, felling and hauling take the day */
    // a guard keeps to the camp and its edges, fed from the store, and goes for whatever comes hunting
    if (a.job === 'guard' && a.e > 0.4) {
      const w = nearest(a, 4, b => !b.hidden && !b.d.people && b.d.eats.meat && b.d.mass > 3);
      if (w) {
        stepTo(a, w.x, w.y, 2);
        if (cheb(w, a) <= 1 && rnd() < 0.5 * a.skill.hunt * TPY * dt) {
          die(w, 'killed by people', a.id);
          practise(a, 'hunt');
        }
        a.act = { k: 'guard', id: w.id };
        return;
      }
      if (dist > 4) stepTo(a, T.x, T.y, 2); else roam(a, 2, 1); a.act = { k: 'patrol' }; return;
    }
    // firewood: each hearth is fed by its own household (the common fire by those with no roof). Wood is cut from the
    // nearest trees along the ways from the door, so the trees round the houses thin first, and a hearth far from any
    // wood gets less for a day's walking and burns low.
    { const hearth = doorOf(a);
      if (T.skills.fire && tempAt(I(hearth.x, hearth.y)) < d.comfort - 3 && (hearth.fuel || 0) < FUEL_KEEP && rnd() < dt * 8) {
        const lp = pileFor(hearth.x, hearth.y, 'wood', a);
        if (lp) { const ef = 1 / (1 + lp.d / (WALK * pace)); hearth.fuel = (hearth.fuel || 0) + takePile(lp, 1) * ef; a.act = { k: 'fetch', x: lp.p.x, y: lp.p.y, item: 'sticks' }; walk(hearth.x, hearth.y, lp.p.x, lp.p.y, 0.02); a.tripD = lp.d; return; }
        const j = standFor(hearth.x, hearth.y, a, 0.1);
        if (j < 0) stretch(a);
        if (j >= 0) {
          fell(j, 0.03);
          const w = wayDist(hearth.x, hearth.y, j % N, (j / N) | 0);
          const ef = 1 / (1 + w.d / (WALK * pace * (1 + 0.5 * w.road)));
          hearth.fuel = (hearth.fuel || 0) + ef;
          S.stat.fuelD += w.d; S.stat.fuelN++; crossed(w); a.tripD = w.d;
          walk(hearth.x, hearth.y, j % N, (j / N) | 0, 0.02);
          a.wood = j;
          /* a short trip leaves the rest of the day for finding food; a long one takes the day */
          if (rnd() > ef) { a.act = { k: 'wood', j }; return; }
        }
      }
    }
    /* meat lying out in reach is fetched home first, by a grown member of a household short of food */
    if (grown && !S.night && allFood() < pop * 2) { const door0 = doorOf(a), pl = pileFor(door0.x, door0.y, 'meat', a);
      if (pl) { const ef = 1 / (1 + pl.d / (WALK * pace)), got = takePile(pl, 1.5 * ef + 0.2); bring(a, got); walk(door0.x, door0.y, pl.p.x, pl.p.y, 0.03); a.tripD = pl.d; a.act = { k: 'fetch', x: pl.p.x, y: pl.p.y, item: 'meat' }; T.got.hunt += got; return; } }
    // look for food: plants, fish, game, from their own door. Places near the door are looked at most; nothing is out of
    // bounds, but a far place has to be worth the walk. What is found is carried home.
    const door = doorOf(a), cands = []; let wishV = 0, wishF = null, bestV = 0, bx = a.x, by = a.y, kind = '', bestE = 1;
    for (let k = 0; k < 10; k++) {
      const far = -reachOf(a) * Math.log(1 - rnd() * 0.999), ang = rnd() * 6.2832;
      const x = clamp(Math.round(door.x + Math.cos(ang) * far), 0, N - 1),
        y = clamp(Math.round(door.y + Math.sin(ang) * far), 0, N - 1),
        j = I(x, y),
        dd = walkEff(door.x, door.y, x, y, pace);
      let v = 0, kd = '';
      if (water[j]) { if (T.skills.fish) { v = fish[j] * 1.1 * (tempAt(j) < -3 ? 0.65 : 1) * a.skill.fish * (a.job === 'fisher' ? 1.5 : 1); kd = 'fish'; } }
      else { v = (fruit[j] * 1.6 + grass[j] * 0.12 * (1 - snowBlock(j, d.mass))) * a.skill.gather * (a.job === 'gatherer' || a.job === 'farmer' ? 1.3 : 1); kd = 'plant'; }
      if (!dd && v > 0 && mass[I(door.x, door.y)] !== mass[j]) { const wh = wayDist(door.x, door.y, x, y, true); if (wh.ford) { const vh = v / (1 + wh.d / (WALK * pace)); if (vh > wishV) { wishV = vh; wishF = wh.ford; } } }
      v *= dd; if (v > 0) cands.push([v, x, y, kd]); if (v > bestV) { bestV = v; bx = x; by = y; kind = kd; bestE = dd; }
    }
    if (wishF && wishV > bestV * 1.3) wishCross(wishF);
    /* nothing worth the walk near enough, and still hungry: next time they look further. Fed, they keep closer to home */
    if (a.e < 0.6 && bestV < 0.06) stretch(a); else if (a.e > 0.8) settleBack(a);
    // the hunt: when the stores run low, the able go out together in the morning after the nearest big game.
    // One walks straight at it; the others swing wide and get beyond it, so that what runs from the first runs onto them.
    if (able && T.skills.hunt) {
      let P = T.party; if (P) { const q = S.byId.get(P.prey); if (!q || !q.alive || q.hidden || S.t > P.until || P.day !== Math.floor(S.tickNo / (DAY || 1))) P = T.party = null; }
      if (!P && (allFood() < pop * 1.2 || a.job === 'hunter') && adults >= 2 && (!a.job || a.job === 'hunter') && S.t > (T.noHunt || 0) && (!DAY || S.tickNo % DAY === 0)) {
        const q = nearest({ x: T.x, y: T.y }, Math.max(7, Math.round(reachOf(a) * 2)), b => !b.d.people && !b.tame && !b.hidden && bodyOf(b) >= 1 && canTake(a, b) && !(b.d.eats.meat && b.d.mass > d.mass * 0.5));
        T.noHunt = S.t + 6 * dt;                                       // a hunt, good or bad, and then other work for a day or two
        if (q) P = T.party = { prey: q.id, until: S.t + 3 * dt, day: Math.floor(S.tickNo / (DAY || 1)), ids: [] };
      }
      if (P && !P.ids.includes(a.id) && P.ids.length < 3 && a.e > 0.35 && (a.job ? a.job === 'hunter' : P.ids.length < 2 || a.skill.hunt > 1)) P.ids.push(a.id);
      if (P && P.ids.includes(a.id)) {
        const q = S.byId.get(P.prey), k = P.ids.indexOf(a.id), ux = Math.sign(q.x - T.x) || 1, uy = Math.sign(q.y - T.y), side = k === 0 ? 0 : (k % 2 ? 2 : -2);
        const close = cheb(q, a) <= 2, tx = close || k === 0 ? q.x : q.x + ux * 2 - uy * side, ty = close || k === 0 ? q.y : q.y + uy * 2 + ux * side;
        stepTo(a, clamp(tx, 0, N - 1), clamp(ty, 0, N - 1), 3); a.act = { k: 'hunt', id: q.id, party: k + 1 }; practise(a, 'hunt'); T.eff.hunt++;   // hunters run their game down
        const reach = cheb(q, a); if (reach <= 2) {                      // within a spear's throw; surer from close in
          let near = 0; for (const id of P.ids) { const m = S.byId.get(id); if (m && m.alive && cheb(m, q) <= 3) near++; }
          const gm = bodyOf(q), p = (reach <= 1 ? 1 : 0.5) * a.skill.hunt * (0.3 + 0.2 * (near - 1)) * Math.min(1, 4.5 / gm) * (1 - 0.5 * cover(I(q.x, q.y))) * TPY * dt * S.dayK;
          if (rnd() < p) { die(q, 'hunted', a.id); { const sh = gm * 0.9 / P.ids.length; for (const id of P.ids) { const m = S.byId.get(id); if (m) bring(m, sh); } } T.got.hunt += gm * 0.9;
            {
              const orphan = S.agents.find(b => b.alive && b.mom === q.id && !b.d.people && b.age < b.d.mature * 0.6 && cheb(b,
                  q) <= 3);   /* the young one left standing by its dead mother is carried home */
              if (orphan) {
                orphan.tame = true;
                orphan.fear = 0;
                orphan.x = T.x;
                orphan.y = T.y;
                if (!T.skills.herd) {
                  T.skills.herd = true;
                  tell('The hunters brought a fawn home alive, its mother dead. The children will not let it be eaten.');
                }
              }
            }
            a.act = { k: 'hunt', id: q.id, kill: 1, x: q.x, y: q.y, party: k + 1 };
            T.party = null;
            T.hunts = (T.hunts || 0) + 1; }
        }
        return;
      }
    }
    // small game met by chance while out: anything small enough that is not itself a hunter of people-sized things
    const game = T.skills.hunt && (allFood() < pop * 1.2 || a.job === 'hunter') ? nearest(a, 5, b => !b.d.people && !b.tame && !b.hidden && canTake(a, b) && !(b.d.eats.meat
        && b.d.mass > d.mass * 0.5) && rnd() > cover(I(b.x, b.y)) * 1.25 + (bodyOf(b) < 1 ? 0.4 : 0.15)) : null;
    if (game && able && rnd() < 0.3) {
      if (a.act.k === 'idle' || a.act.k === 'home') a.act = { k: 'hunt', id: game.id };
      stepTo(a, game.x, game.y, 2);
      if (cheb(game, a) <= 1) {
        const gm = bodyOf(game), helpers = Math.min(3, adults - 1), p = (gm < 1 ? 0.22 : (0.07 + 0.05 * helpers) * Math.min(1, 4.5 / gm)) * (1 - 0.5 * cover(I(game.x, game.y))) * TPY * dt * S.dayK;
        if (rnd() < p) {
          die(game, 'hunted', a.id);
          bring(a, gm * 0.9);
          a.act = { k: 'hunt', id: game.id, kill: 1, x: game.x, y: game.y };
        }
      }
      return;
    }
    /* the best few places, in order: the first whose real way is not far longer than it looked is gone to */
    cands.sort((p, q) => q[0] - p[0]);
    for (const [, cx, cy, ck] of cands.slice(0, 3)) {
      const j = I(cx, cy);
      /* where to stand: the place itself, or for fish the bank beside the water on this side */
      let sj = j; if (water[j]) { sj = -1; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N && !water[I(nx, ny)] && mass[I(nx, ny)] === mass[I(door.x, door.y)]) { sj = I(nx, ny); break; } } }
      if (sj < 0) continue;
      const lim = 1.6 * Math.max(4, Math.hypot(a.x - sj % N, a.y - ((sj / N) | 0))) + 2, rt = route(a.x, a.y, sj % N, (sj / N) | 0, a, lim * 1.41);
      if (!rt.reached || rt.tiles.length > lim) continue;
      for (const t of rt.tiles) if (!water[t]) tread[t] = Math.min(6, tread[t] + 0.03);   /* the ground is worn where the trip really goes */
      { const w = wayDist(door.x, door.y, cx, cy); crossed(w); a.tripD = w.d; }
      a.trip = { kind: ck, j: sj, phase: 'out', path: rt.tiles.slice(), back: [I(a.x, a.y)].concat(rt.tiles.slice(0, -1)).reverse(), load: 0, walked: 0 }; runTrip(a, d, pace, budget); break;
    }
    // a strong camp drives off whatever would hunt it
    const w = a.e < 0.9 ? null : nearest(a, 2, b => !b.hidden && canTake(b, a));
    if (w && adults >= 3 && rnd() < 0.25 * TPY * dt) { die(w, 'killed by people', a.id); a.act = { k: 'guard', id: w.id }; }
  }
  // ---- building. A roof needs a plot, materials and work; nothing appears from nowhere.
  // What people can raise depends on what they have learned: hides over poles first, then a hut of timber and thatch, then a
  // house of timber on a stone footing. Each goes up a stage at a time, and each stage waits for its timber and stone to be
  // carried to the plot. A dwelling already lived in is rebuilt in place, around the people in it, when something better is known.
  const DWELL = {
    tent:  { stages: 1, wood: 2, stone: 0, roof: 0.52 },            // wood and stone are per stage; roof is how much cold still gets in
    hut:   { stages: 2, wood: 2, stone: 0, roof: 0.4 },
    house: { stages: 3, wood: 2, stone: 1, roof: 0.3 },
    well:  { stages: 2, wood: 1, stone: 2 }
  };
  /* a site of a kind nobody knows how to build is a defect: it is reported once in S.problems and never counts as standing */
  const raised = q => {
    const K = DWELL[q.kind];
    if (K) return q.stage >= K.stages;
    if (!S.problems.includes('unknown site kind ' + q.kind)) S.problems.push('unknown site kind ' + q.kind);
    return false;
  };
  const live = q => q.kind !== 'well' && (!!q.was || raised(q));     // someone can sleep in it
  const best = () => S.tribe.skills.house ? 'house' : S.tribe.skills.hut ? 'hut' : 'tent';
  const NEXT = { tent: 'hut', hut: 'house' };
  // The plot. Close to the middle of the camp but not in it (the fire and the stores keep that), with room between it and the
  // next roof, on dry open ground for choice. The bank, where the first flood comes, is left alone, except by those who live
  // off the water: a fisher's household builds right at the edge, on posts, and the flood passes under.
  // The plot. Nobody lays a town out. A household building a roof weighs a handful of pulls and takes the best ground it can
  // find: near the fire and the others, with a door on a way people already walk but not in the middle of it, near its own
  // kin, near where its work is (water for a fisher, fields for a farmer, timber for those who work wood), on ground that is
  // dry, open and not somebody's crop, with a little elbow room. Low wet ground by the water is only feared once a flood
  // has been seen to take a roof; and only then does anyone think of raising a house on posts.
  function choosePlot(kind, who) {
    const T = S.tribe, well = kind === 'well', P = folk(), craft = who ? (who.job || craftOf(who)) : '';
    const kinHomes = who ? T.sites.filter(q => live(q) && P.some(b => b.house === q.id && kin(b, who))) : [];
    /* ground a household may take: common ground, or what is already its own or its kin's */
    const mayUse = new Set(kinHomes.map(q => q.id)); if (who && who.house) mayUse.add(who.house); { const pt = who && S.byId.get(who.partner); if (pt && pt.house) mayUse.add(pt.house); }
    /* how far out a lot is looked for: as far as the place has had to look before (it grows when no lot was found) */
    const homes = T.sites.filter(q => q.kind !== 'well'), r = Math.min(Math.ceil(N / PITCH), Math.ceil(T.lotReach / PITCH));
    let bestI = -1, bs = -1e9, across = null;
    for (let m = -r; m < r; m++) for (let k = -r; k < r; k++) {
      const x = T.x + k * PITCH + 2, y = T.y + m * PITCH + 2; if (x < 2 || y < 2 || x >= N - 2 || y >= N - 2) continue;   // the middle of each lot
      const i = I(x, y); if (water[i]) continue;
      /* across water, a lot is as far as the way round by the ford or bridge; with no crossing at all it is out of reach */
      const dc = mass[i] === mass[I(T.x, T.y)] ? Math.hypot(x - T.x, y - T.y) : wayDist(T.x, T.y, x, y).d;
      if (!isFinite(dc)) { if (!across && !T.sites.some(q => q.x === x && q.y === y) && !water[i]) { const wh = wayDist(T.x, T.y, x, y, true); if (wh.ford) across = wh.ford; } continue; }
      if (T.sites.some(q => q.x === x && q.y === y)) continue;                                                // one roof to a lot, for now
      if (T.wall && T.wall.cells.includes(i)) continue;
      let wet = 0, timber = 0, crops = 0, way = 0, theirs = false;
      for (let ny = -1; ny <= 1; ny++) for (let nx = -1; nx <= 1; nx++) { const j = I(x + nx, y + ny); if (water[j]) wet++; timber += tree[j]; crops += field[j]; if ((owner[j] && !mayUse.has(owner[j])) || pit[j] > 0.1) theirs = true; }
      if (theirs) { S.stat.lotsRefused++; continue; }                                                                                    /* someone else's field or lot: not theirs to build on */
      if (wet > 2) continue;                                                                                  // not enough dry ground to stand a roof on
      for (const [ax, ay] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) way = Math.max(way, tread[I(clamp(x + ax, 0, N - 1), clamp(y + ay, 0, N - 1))]);
      let sc = rnd() * 0.3 - timber * 0.25 - rock[i] * 2 - Math.max(0, soil[i] - 0.9) * 3 - wet * 0.5;
      if (well) { let d = 0; for (const q of homes) d += Math.hypot(q.x - x, q.y - y); sc -= homes.length ? d / homes.length : dc; }   // where it is least far for everyone
      else {
        sc -= dc * 0.55; sc += Math.min(1.5, way) * 1.2;                                                      // near the fire and the others, on a way already walked
        sc -= bank[i] * (0.3 + T.need.flood * 1.5 + (T.floodSeen ? 1.2 : 0));
        if (craft === 'fisher' || craft === 'fish') sc += bank[i] * (T.floodSeen ? 2.8 : 2);
        if (craft === 'farmer') sc += crops * 0.5;
        if (craft === 'woodcutter' || craft === 'builder' || craft === 'build') sc += timber * 0.3;
        if (kinHomes.length) { let dk = 99; for (const q of kinHomes) dk = Math.min(dk, Math.hypot(q.x - x, q.y - y)); sc -= Math.min(dk, 12) * 0.2; }
      }
      if (sc > bs) { bs = sc; bestI = i; }
    }
    T.lotAcross = bestI < 0 ? across : null;
    if (bestI < 0) return null;
    const s = { id: S.nextId++,
      x: bestI % N,
      y: (bestI / N) | 0,
      kind,
      stage: 0,
      wood: 0,
      stone: 0,
      larder: 0,
      members: 0,
      cold: 0,
      hunger: 0,
      fuel: 0,
      lit: -1,
      was: '',
      lake: !well && kind !== 'tent' && T.floodSeen && bank[bestI] > 0.5 };
    T.sites.push(s);
    for (let ny = -1; ny <= 1; ny++) for (let nx = -1; nx <= 1; nx++) {
      const j = I(s.x + nx, s.y + ny);
      if (water[j]) continue;
      field[j] = 0; owner[j] = well ? 0 : s.id;   /* the lot is the household's; a well stands on common ground */
    }   /* trees standing on the lot are felled by the builders before anything else (construct), and are their first timber */
    grass[bestI] = Math.min(grass[bestI], 0.08); fruit[bestI] = 0;
    return s;
  }
  function plotFor() {
    const T = S.tribe; let s = T.sites.find(q => DWELL[q.kind] && !raised(q)); if (s) return s;          // finish what is begun
    const homes = T.sites.filter(q => q.kind !== 'well');
    if (homes.length < households()) {                                                  // a household without a roof
      const who = folk().find(a => a.age >= WED && !a.house && (!a.partner || a.fem));
      const lot = choosePlot(best(), who); if (lot) return lot;
      T.lotReach = Math.min(N, T.lotReach + PITCH / 4);   /* no lot in reach: look further next time */
      /* no lot to be had on this side: if there is free ground over the water, the want of a way across is felt where it would be crossed */
      if (T.lotAcross && S.tickNo % 4 === 0) wishCross(T.lotAcross, 2);
    }
    if (T.wall && !T.wall.done) return T.wall;                                          // the fence, once begun, before comforts
    if (allFood() < S.popPeople * 1.0) return null;                                     // the rest is for when there is food enough to spare the hands
    if (T.bridge && !T.bridge.done) return T.bridge;
    if (T.skills.well && !T.sites.some(q => q.kind === 'well')) return choosePlot('well', null);
    s = homes.filter(q => NEXT[q.kind] && T.skills[NEXT[q.kind]] && raised(q) && q.cold > 0.12 && (q.larder
        || 0) >= q.members * 0.6).sort((p, q) => q.cold - p.cold)[0];   // something better is known: the household that has felt the cold most, and can feed itself meanwhile, rebuilds first
    if (s) { s.was = s.kind; s.kind = NEXT[s.kind]; s.stage = 0; s.wood *= RUBBLE_WOOD; s.stone *= RUBBLE_STONE; s.qtrips = 0; s.lake = T.floodSeen && bank[I(s.x, s.y)] > 0.5; return s; }
    return null;
  }
  // with a cart and a beast to draw it, one trip brings what took two
  function cartload(j) {
    const T = S.tribe; if (!T.carts) return 1;
    const dr = S.agents.find(b => b.alive && b.tame && b.age >= b.d.mature * 0.75 && !(b.cart >= S.tickNo)); if (!dr) return 1;
    dr.cart = S.tickNo; dr.cartJ = j; return 2;
  }
  /* logs or loose stone lying in reach are carried in before anyone fells or quarries */
  function fromPile(a, x, y, kind) {
    const lp = pileFor(x, y, kind, a); if (!lp) return false; const T = S.tribe, ef = 1 / (1 + lp.d / WALK), got = takePile(lp, 3 * ef + 0.5);
    if (kind === 'wood') T.wood += got; else T.stone += got;
    a.act = { k: 'fetch', x: lp.p.x, y: lp.p.y, item: kind === 'wood' ? 'log' : 'stone' }; walk(x, y, lp.p.x, lp.p.y, 0.05); a.tripD = lp.d; return true;
  }
  function construct(a) {
    const T = S.tribe, s = plotFor(); if (!s) return false;
    if (s === T.bridge) {                                             // timber carried to the ford and laid across it, a few planks at a time
      if (T.wood >= 1) { const c = Math.min(T.wood, s.need - s.wood); T.wood -= c; s.wood += c; a.act = { k: 'bridgework', x: s.ax, y: s.ay }; walk(T.x, T.y, s.ax, s.ay, 0.12); sound(s.ax, s.ay, 3, 'work'); }
      else {
        if (fromPile(a, s.ax, s.ay, 'wood')) return true;
        const bj = standFor(s.ax, s.ay, a, 0.3); if (bj < 0) { stretch(a); return false; }
        fell(bj, CHOP); const w = wayDist(s.ax, s.ay, bj % N, (bj / N) | 0);
        T.wood += (2 + (a.job === 'woodcutter' ? 1 : 0) + (T.skills.tools ? 1 : 0)) / (1 + w.d / WALK); a.act = { k: 'chop', j: bj, site: 0 }; return true;
      }
      if (s.wood >= s.need) { s.done = true; T.bridged[s.key] = true; tell('A bridge of logs now crosses the water where people waded every day.'); }
      return true;
    }
    if (s === T.wall) {                                               // stakes cut, carried and driven, a few paces of fence at a time
      if (T.wood < 1) {
        if (fromPile(a, T.x, T.y, 'wood')) return true;
        const bj = standFor(T.x, T.y, a, 0.3);
        if (bj < 0) { stretch(a); return false; }
        fell(bj, CHOP);
        const ld = cartload(bj), ef = walkEff(T.x, T.y, bj % N, (bj / N) | 0, ld > 1 ? 2 : 1);
        T.wood += (2 + (a.job === 'woodcutter' ? 1 : 0) + (T.skills.tools ? 1 : 0)) * ld * ef;
        a.act = { k: 'chop', j: bj, site: 0 };
        return true;
      }
      /* a few more stakes where the new line has none yet; stakes already standing on it are kept */
      T.wood -= 1; if (!T.fence) T.fence = new Uint8Array(N * N);
      let at = -1, put = 0; for (const c of s.cells) { if (T.fence[c]) continue; T.fence[c] = 1; if (at < 0) at = c; if (++put >= 4) break; }
      s.n = s.cells.filter(c => T.fence[c]).length; if (at < 0) at = s.cells[0]; a.act = { k: 'fence', j: at }; sound(at % N, (at / N) | 0, 3, 'work');
      if (s.n >= s.cells.length) {
        s.done = true;
        /* the new ring is closed: the old stakes now standing inside it are pulled up */
        const ring = new Set(s.cells); for (let i = 0; i < N * N; i++) if (T.fence[i] && !ring.has(i)) T.fence[i] = 0;
        tell(s.grown ? 'The fence has been carried out round the new houses.' : 'The fence is closed. Nothing on four legs comes in now unless it is led.');
      }
      return true;
    }
    /* trees standing on the plot come down first: felled where they stand, and the first timber for the build */
    for (let ny = -1; ny <= 1; ny++) for (let nx = -1; nx <= 1; nx++) {
      const j = I(s.x + nx, s.y + ny); if (water[j] || tree[j] <= 0.05) continue;
      const got = fell(j, CHOP);
      T.wood += (2 + (a.job === 'woodcutter' ? 1 : 0) + (T.skills.tools ? 1 : 0)) * got / 0.16;
      a.act = { k: 'chop', j, site: s.id }; sound(s.x + nx, s.y + ny, 3.5, 'work'); return true;
    }
    const K = DWELL[s.kind], needW = (s.stage + 1) * K.wood + (s.lake ? 2 : 0), needS = (s.stage + 1) * K.stone;   // what must lie on the plot before the next stage; posts for a house over water
    if (s.wood < needW) {
      if (T.wood >= 1) { const c = Math.min(T.wood, needW - s.wood); T.wood -= c; s.wood += c; a.act = { k: 'haul', site: s.id, item: 'log' }; walk(T.x, T.y, s.x, s.y, 0.12); return true; }
      /* fell the nearest standing timber along the ways; saplings are left to grow. The further it stands, the less is
         brought back in a day */
      if (fromPile(a, s.x, s.y, 'wood')) return true;
      const bj = standFor(s.x, s.y, a, 0.3);
      if (bj < 0) { stretch(a); return false; }
      fell(bj, CHOP);
      const ld = cartload(bj), ef = walkEff(s.x, s.y, bj % N, (bj / N) | 0, ld > 1 ? 2 : 1);
      { const w = wayDist(s.x, s.y, bj % N, (bj / N) | 0); S.stat.timberD += w.d; S.stat.timberN++; crossed(w); a.tripD = w.d; }
      T.wood += (2 + (a.job === 'woodcutter' ? 1 : 0) + (T.skills.tools ? 1 : 0)) * ld * ef;
      a.act = { k: 'chop', j: bj, site: s.id };
      sound(bj % N, (bj / N) | 0, 3.5, 'work');
      walk(s.x, s.y, bj % N, (bj / N) | 0, T.carts ? 0.2 : 0.1);
      if (!T.carts) T.need.toil += 0.12;
      return true;
    }
    if (s.stone < needS) {
      if (T.stone >= 1) { const c = Math.min(T.stone, needS - s.stone); T.stone -= c; s.stone += c; a.act = { k: 'haul', site: s.id, item: 'stone' }; return true; }
      /* break stone where it shows, or carry cobbles up from the water's edge: whichever costs the less walking for what it gives */
      if (fromPile(a, s.x, s.y, 'stone')) return true;
      /* the quarry: of all the stone showing on common ground, the one that gives most for a day's walk; a deep pit is harder
         to work (deeper and farther both make stone dearer) */
      let bq = -1, vq = 0;
      for (let j = 0; j < N * N; j++) { if (rock[j] < 0.15 || Math.hypot(j % N - s.x, ((j / N) | 0) - s.y) > reachOf(a) * 2 || field[j] || (owner[j] && T.sites.some(q => q.id === owner[j] && q.kind !== 'well'))) continue; const v = 2 * walkEff(s.x, s.y, j % N, (j / N) | 0, 1) * (1 - 0.5 * pit[j]); if (v > vq) { vq = v; bq = j; } }
      const bc = nearestWay(s.x, s.y, j => !water[j] && bank[j] >= 0.75, 0, reachOf(a) * 2), vc = bc < 0 ? 0 : walkEff(s.x, s.y, bc % N, (bc / N) | 0, 1);
      if (bq < 0 && bc < 0) { stretch(a); return false; }
      const bj = vq >= vc ? bq : bc, got = vq >= vc ? 2 : 1;
      const ld = cartload(bj), ef = walkEff(s.x, s.y, bj % N, (bj / N) | 0, ld > 1 ? 2 : 1);
      { const w = wayDist(s.x, s.y, bj % N, (bj / N) | 0); S.stat.stoneD += w.d; S.stat.stoneN++; crossed(w); a.tripD = w.d; }
      const brought = (got + (a.job === 'mason' ? 1 : 0) + (T.skills.tools ? 1 : 0)) * ld * ef * (got === 2 ? 1 - 0.5 * pit[bj] : 1);
      T.stone += brought;
      if (got === 2) { const dug = Math.min(rock[bj], brought / STONE_PER_TILE); rock[bj] -= dug; pit[bj] = Math.min(1, pit[bj] + dug); S.stat.pitD += wayDist(T.x, T.y, bj % N, (bj / N) | 0, true).d; S.stat.pitN++; }
      a.act = { k: 'quarry', j: bj, site: s.id };
      sound(bj % N, (bj / N) | 0, 4, 'work');
      walk(s.x, s.y, bj % N, (bj / N) | 0, T.carts ? 0.2 : 0.1);
      T.stoneWork++; s.qtrips = (s.qtrips || 0) + 1;
      if (!T.carts) T.need.toil += 0.16;
      return true;
    }
    s.stage++; a.act = { k: 'build', site: s.id, stage: s.stage }; sound(s.x, s.y, 3, 'work');
    if (raised(s)) {
      const first = !T.sites.some(q => q !== s && q.kind === s.kind && raised(q)), rebuilt = s.was; s.was = '';
      /* quarry trips per stone dwelling: first raisings against raisings again after a flood */
      if (DWELL[s.kind].stone) { if (s.flooded) { S.stat.reTrips += s.qtrips || 0; S.stat.reN++; } else if (!rebuilt) { S.stat.newTrips += s.qtrips || 0; S.stat.newN++; } }
      s.flooded = false; s.qtrips = 0;
      if (s.kind === 'well') { T.well = true; tell('The people have dug a well. The fields need not wait for rain.'); }
      else if (first) tell({ tent: 'A tent of hides is up: the first roof in the valley.',
        hut: 'The first hut stands, timber and thatch.',
        house: 'The first true house stands, timber on a footing of stone.' }[s.kind] + (s.lake ? ' It stands on posts at the water\'s edge.' : ''));
      S.fx.push({ kind: 'hut', by: a.id, n: T.huts + (rebuilt ? 0 : 1) });
    }
    return true;
  }
  // The fence. Wolves among the houses once too often, and people who know how to set stakes, and it is begun: a ring round
  // every roof with a little room to spare. Water is left to be its own fence. When the place outgrows it, it is carried out further.
  function planWall() {
    const T = S.tribe, homes = T.sites; if (!homes.length) return;
    let x0 = T.x, y0 = T.y, x1 = T.x, y1 = T.y; for (const q of homes) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
    x0 = clamp(x0 - 3, 0, N - 1); y0 = clamp(y0 - 3, 0, N - 1); x1 = clamp(x1 + 3, 0, N - 1); y1 = clamp(y1 + 3, 0, N - 1);
    const old = T.wall; if (old && old.x0 <= x0 && old.y0 <= y0 && old.x1 >= x1 && old.y1 >= y1) return;
    const cells = [];
    for (let x = x0; x <= x1; x++) {
      cells.push(I(x, y0));
    }
    for (let y = y0 + 1; y <= y1; y++) cells.push(I(x1, y));
    for (let x = x1 - 1; x >= x0; x--) cells.push(I(x, y1));
    for (let y = y1 - 1; y > y0; y--) cells.push(I(x0, y));
    /* the old fence stays up while the new line is driven; stakes already on the new line count as done */
    T.wall = { x0, y0, x1, y1, cells: cells.filter(c => !water[c]), n: 0, done: false, grown: !!old }; if (T.fence) T.wall.n = T.wall.cells.filter(c => T.fence[c]).length;
    for (const c of T.wall.cells) field[c] = 0;
    if (!old) tell('Wolves among the houses once too often. The people are fencing the place round with stakes.');
  }
  // Trades. A camp of a few shares all the work. Once it is a hamlet there are enough hands for some to do one thing well, and
  // what the place is short of decides what they take up: mouths make farmers and fishers, plots make builders, wolves make guards.
  // Trades. While everyone must spend the day finding food, nobody can do anything else. When there is more in the store than
  // mouths need, some hands come free, and what the place most wants decides what they turn to: wolves make guards, families
  // without a roof make builders, hungry years make farmers. Nothing here asks how big the place is.
  function townLife() {
    const T = S.tribe, P = folk(); if (!P.length) return;
    T.threat *= 0.8; T.plenty = T.plenty * 0.6 + 0.4 * (allFood() / P.length);
    if (T.skills.palisade && (T.wall || T.threat >= 2)) planWall();
    const able = P.filter(a => a.age >= GROWN && a.age <= 46), n = able.length; for (const a of P) if (a.age > 46 || a.age < GROWN) a.job = '';
    const spare = Math.floor(n * clamp((T.plenty - 0.7) / 4, 0, 0.45));           // hands the food supply can free from getting food
    if (n < 3 || (spare < 1 && !able.some(a => a.job))) { for (const a of able) a.job = ''; return; }
    const N_ = T.need, unroofed = Math.max(0, households() - T.sites.filter(q => q.kind !== 'well').length), work = T.sites.some(q => !raised(q)) || (T.wall && !T.wall.done) || unroofed > 0;
    // wants, strongest first, each asking for hands
    const asks = [['guard', T.threat >= 1.5 ? Math.max(1, Math.round(T.threat / 4)) : 0, T.threat], ['builder', work ? 1 + Math.round(unroofed / 2) : 0, 1 + N_.crowd + N_.cold],
      ['woodcutter', work && n >= 5 ? 1 : 0, N_.toil], ['mason', work && T.skills.house ? 1 : 0, N_.toil * 0.8], ['herder', S.agents.some(b => b.alive
          && b.tame) ? 1 : 0, 0.5]].sort((p, q) => q[2] - p[2]);
    const want = {}; let left = spare; for (const [job, k] of asks) { want[job] = Math.min(k, left); left -= want[job]; }
    // food work: people turn to whatever they have seen bring most home for a day's work. What has not been tried is given
    // a fair chance, and nothing is ever given up entirely, since a bad year for one thing is a good year for another.
    { const KEY = { farmer: 'farm', fisher: 'fish', hunter: 'hunt', gatherer: 'gather' }, R = T.rate;
      for (const k in T.got) { if (T.eff[k] > 0) { const now = T.got[k] / T.eff[k]; R[k] = R[k] === undefined ? now : R[k] * 0.5 + now * 0.5; } T.got[k] = 0; T.eff[k] = 0; }
      const kinds = ['farmer', 'fisher', 'hunter', 'gatherer'].filter(k => k !== 'farmer' || T.skills.farm),
        seen = kinds.map(k => R[KEY[k]]).filter(v => v !== undefined),
        mean = seen.length ? seen.reduce((p, q) => p + q, 0) / seen.length : 1;
      const w = kinds.map(k => Math.max(0.2 * mean, R[KEY[k]] === undefined ? mean : R[KEY[k]]) + (k === 'farmer' ? N_.hunger * mean : 0)),
        tot = w.reduce((p, q) => p + q, 0) || 1,
        nFood = Math.max(0, n - (spare - left));
      kinds.forEach((k, q) => { want[k] = spare >= 1 ? Math.round(nFood * w[q] / tot) : 0; }); if (spare >= 1) want.gatherer = n; }
    const have = {}; for (const a of able) { if (a.job && (have[a.job] || 0) < (want[a.job] || 0)) have[a.job] = (have[a.job] || 0) + 1; else a.job = ''; }
    for (const job of ['guard', 'builder', 'woodcutter', 'mason', 'herder', 'farmer', 'hunter', 'fisher', 'gatherer']) {
      while ((have[job] || 0) < (want[job] || 0)) {
        const free = able.filter(a => !a.job); if (!free.length) break;
        const pick = free.reduce((b, a) => a.skill[JOBS[job]] > b.skill[JOBS[job]] ? a : b); pick.job = job; have[job] = (have[job] || 0) + 1;
        T.trades = T.trades || {};
        if (!T.trades[job] && job !== 'gatherer') {
          T.trades[job] = true;
          tell(pick.name + { farmer: ' has given all ' + (pick.fem ? 'her' : 'his') + ' days to the fields: the first farmer.',
            hunter: ' leads the hunt now, and does little else.',
            fisher: ' is at the water every day: the first to live by fishing.',
            builder: ' has become a builder: there are families without a roof.',
            woodcutter: ' fells timber for the whole place now.',
            mason: ' has taken up stone: the first mason.',
            herder: ' minds the tame deer.',
            guard: ' keeps watch with a spear by day as well as by night. The wolves have been in too often.' }[job]);
        }
      }
    }
  }
  // Ideas. Nothing is discovered because time has passed or because there are many people. A thing is worked out when the want
  // of it has been felt for long enough (cold nights, rotted stores, wolves among the houses, backs bent under loads) and when
  // what it takes is lying at hand. Each line: the want, how much of it, the means, and what is said when it comes.
  const made = (T, kind) => T.sites.some(q => (q.kind === kind && raised(q)) || q.was === kind);
  const tameGrown = () => S.agents.some(b => b.alive && b.tame && b.age >= b.d.mature * 0.75);
  const IDEAS = {
    fire:       { need: 'cold',   at: 0.2, can: () => true, say: 'Cold enough to try anything: stone struck on stone over dry moss. The people have fire.' },
    hut:        { need: 'cold',   at: 0.4, can: T => made(T, 'tent'), say: 'Too many cold nights under hides, with timber all around. The people have learned to build huts.' },
    house:      { need: 'cold',   at: 0.75, can: T => made(T, 'hut'), say: 'Wind through the thatch, winter after winter. The people have learned to build in timber on a footing of stone.' },
    masonry:    { need: 'cold',   at: 0.6, can: T => T.skills.tools && made(T, 'house'), say: 'Masonry. With tools that cut it, stone is laid true and the winter stays outside.' },
    farm:       { need: 'hunger', at: 0.15, can: T => T.huts > 0, say: 'Hungry seasons, and grain spilled by the store coming up green. The people have begun to sow.' },
    plough:     { need: 'hunger',
      at: 0.3,
      can: T => T.skills.farm && tameGrown(),
      say: 'Plough. Still not enough from the fields, and a tame beast standing idle: now it drags a share through the ground.' },
    pottery:    { need: 'spoil',  at: 1.0, can: T => T.skills.fire, say: 'Pottery. Too much lost to damp and mice. Clay hardened by the fire keeps food dry.' },
    granary:    { need: 'spoil',
      at: 1.6,
      can: T => T.skills.farm && T.skills.pottery && (made(T, 'hut') || made(T, 'house')),
      say: 'Granary. Harvests rotting in a corner: the people have raised a store off the ground.' },
    well:       { need: 'water',  at: 0.45, can: T => T.huts > 0, say: 'So many buckets carried so far. The people mean to dig a well.' },
    irrigation: { need: 'water',  at: 1.0, can: T => T.skills.farm && T.well, say: 'Irrigation. Crops lost to dry weeks with water standing in the well: now it runs to the fields in ditches.' },
    palisade:   { need: 'danger', at: 2.0, can: T => T.skills.hut, say: 'Palisade. Wolves among the houses once too often: stakes can be set close enough to stop them.' },
    wheel:      { need: 'toil',   at: 0.5, can: () => tameGrown(), say: 'Every log carried on a shoulder, and a tame beast with nothing to pull. The people have built a cart.' },
    tools:      { need: 'toil',
      at: 0.7,
      can: T => T.skills.fire && T.stoneWork >= 8,
      say: 'Tools. Among the broken stone, some that ran bright in the fire: an axe that bites, a chisel that cuts.' },
    medicine:   { need: 'loss',   at: 2.0, can: () => folk().some(a => a.skill.gather > 1.2), say: 'Medicine. Too many buried. Those who know plants have learned which ones help.' },
    writing:    { need: 'reckon', at: 2.5, can: () => allFood() > S.popPeople, say: 'Writing. Too many households and too much in the store to hold in one head: marks are made for what is owed.' },
    bridge:     { need: 'cross',  at: 1.2, can: T => T.skills.hut, say: 'Bridge. Too many days lost wading the ford, and the river too high to cross half the year. Logs can be laid across it.' },
    concrete:   { need: 'flood',  at: 3.0, can: T => T.skills.masonry && T.skills.fire, say: 'Concrete. The river took the houses again. Burnt lime, sand and stone set like rock, and stay.' }
  };
  // the ground settling, year by year, whether or not anyone lives there
  function settlePits() {
    const T = S.tribe;
    /* worked-out pits: on wet ground the water comes up and a pond forms, with a few fish in time; elsewhere the hole is
       used for spoil and settles, over twenty years or so, into poor ground that can be built on */
    let pond = false;
    for (let j = 0; j < N * N; j++) {
      if (pit[j] <= 0.1 || rock[j] >= 0.15 || water[j]) continue;
      if (bank[j] > 0.4 || soil[j] > 0.95) {
        water[j] = 1; fish[j] = 0.02; grass[j] = 0; tree[j] = 0; fruit[j] = 0; field[j] = 0; owner[j] = 0; pond = true;
        for (const a of cells[j]) { const p = free(a.x, a.y); a.x = p[0]; a.y = p[1]; }
        if (!T.pondTold) { T.pondTold = true; tell('The old stone pit by the water has filled. It is a pond now.'); }
      } else { pit[j] = Math.max(0, pit[j] - 0.05); if (!pit[j] || pit[j] <= 0.1) fert[j] = Math.min(fert[j], 0.35); }
    }
    if (pond) { findMasses(); S.stat.ponds++; }
  }
  function reckonYear() {
    const T = S.tribe, N_ = T.need; if (!S.popPeople) return;
    // wants that are only seen over a year
    N_.crowd += Math.max(0, households() - T.sites.filter(q => q.kind !== 'well').length);
    if (T.waterDist == null) {
      let bd = 99;
      for (let i = 0; i < N * N; i++) if (water[i]) {
        const dd = Math.hypot((i % N) - T.x, ((i / N) | 0) - T.y);
        if (dd < bd) {
          bd = dd;
          T.waterAt = i;
        }
      }
      T.waterDist = bd;
    }
    // a way is a way once it is worn deep; it stays one until it has all but grown over. Whatever grew on it is cut back.
    T.roadGen = (T.roadGen || 0) + 1;
    for (let i = 0; i < N * N; i++) {
      const on = onWay(i % N, (i / N) | 0) && tread[i] > (T.road[i] ? 0.25 : 0.7) && !water[i];
      if (on && !T.road[i] && tree[i] > 0) tree[i] = Math.min(tree[i], 0.05);   /* seedlings trodden down; nothing to carry off */
      T.road[i] = on ? 1 : 0;
      if (on) field[i] = 0;
    }
    N_.water += Math.max(0, T.waterDist - 2) * 0.12 * Math.min(4, S.popPeople / 5) * (T.well ? 0.2 : 1);   // every bucket, carried that far, for every mouth
    N_.reckon += Math.max(0, households() - 3) * 0.12 * (T.skills.writing ? 0 : 1);
    N_.danger = T.threat;
    if (!opt.noIdeas) for (const k in IDEAS) {
      const d = IDEAS[k];
      if (T.skills[k] || N_[d.need] < d.at || !d.can(T)) continue;
      T.skills[k] = true;
      if (d.need !== 'danger') N_[d.need] *= 0.5;
      tell(d.say);
      break;
    }   // one thing at a time; an answer eases the want
    /* a bridge is laid where the wading was worst this year, while the want of one is still felt */
    if (T.skills.bridge && !(T.bridge && !T.bridge.done) && N_.cross >= IDEAS.bridge.at * 0.5) {
      let bf = null, bu = 0; for (const f of fords) { const u = T.fordUse[f.key] || 0; if (!T.bridged[f.key] && u > bu) { bu = u; bf = f; } }
      if (bf) { const near = mass[I(bf.ax, bf.ay)] === mass[I(T.x, T.y)], ax = near ? bf.ax : bf.bx, ay = near ? bf.ay : bf.by;
        T.bridge = { key: bf.key, ax, ay, bx: near ? bf.bx : bf.ax, by: near ? bf.by : bf.ay, horiz: bf.horiz, tiles: bf.tiles.slice(), need: 3 * bf.w, wood: 0, done: false }; N_.cross *= 0.5; }
    }
    T.fordUse = {};
    for (const q of T.sites) { q.tripsLast = q.trips || {}; q.tripDLast = q.tripD || {}; q.workDaysLast = q.workDays || 0; q.trips = {}; q.tripD = {}; q.workDays = 0; }

    for (const k in N_) if (k !== 'danger') N_[k] *= 0.85;
    for (const q of T.sites) { q.cold *= 0.85; q.hunger *= 0.85; }                                 // what is no longer felt is forgotten
    // names for what the place has become: said, never used to decide anything
    const homes = T.sites.filter(live), houses = homes.filter(q => q.kind === 'house' && raised(q)).length;
    const lvl = houses >= 8 && S.popPeople >= 30 ? 3 : houses >= 2 && T.well ? 2 : homes.some(q => (q.was || q.kind) !== 'tent') ? 1 : 0;
    if (lvl > T.level) tell(['', 'The camp has become a hamlet, strung along a beaten track.', 'The hamlet has become a village.', 'The village has become a town.'][lvl]); T.level = lvl;
    const beasts = S.agents.filter(b => b.alive && b.tame && b.age >= b.d.mature * 0.75).length;
    T.carts = T.skills.wheel ? Math.min(1 + Math.floor(T.need.toil), Math.max(1, beasts), beasts) : 0;
    const pave = T.skills.masonry ? 3 : T.carts ? 2 : 1;
    if (pave > T.pave) tell(pave === 3 ? 'With masons in the place, the streets are being set with stone.' : 'Cart wheels cut the track to mud: the people are laying gravel.');
    T.pave = Math.max(T.pave, pave);
  }
  // Fields. Sown once the ground is warm, reaped when the crop has had its warmth, or in a hurry when frost comes. Every
  // field belongs to a roof: the household clears the best ground near its own door, as much as its hands can work and its
  // mouths need, and what grows there goes into its own larder.
  function farm(dt) {
    const T = S.tribe, pop = S.popPeople; if (!T.skills.farm || !pop) return;
    const ct = tempAt(I(T.x, T.y));
    if (!T.sown && ct > 4 && ct > T.lastCampT) {
      const P = folk(), homes = T.sites.filter(q => live(q) && q.members > 0), ids = new Set(homes.map(q => q.id)); let total = 0;
      for (let i = 0; i < N * N; i++) if (field[i] && !ids.has(owner[i])) { field[i] = 0; owner[i] = 0; }      // nobody's any more: it goes back to grass
      for (const h of homes) {
        const mine = P.filter(b => b.house === h.id), hands = mine.filter(b => b.age >= GROWN && b.age <= 60).length, farmers = mine.filter(b => b.job === 'farmer').length;
        const want = Math.round(hands * 2 + farmers * 1.5 + mine.length * 0.7); let have = 0;
        for (let k = 0; k < N * N; k++) if (field[k] && owner[k] === h.id) have++;
        /* Fields are laid out like houses: a household takes whole lots of the lattice next to its own (the middle 3 x 3 of
           each lot, with the ways round it left open), the nearest and best ground first, as many as its hands and mouths
           need. A lot is free if nobody lives on it, nobody else holds it, and it is dry ground on this bank. */
        const lots = [];
        for (let m = -3; m <= 3 && have < want; m++) for (let k = -3; k <= 3; k++) {
          const cx = snapWay(h.x, T.x) + 2 + k * PITCH, cy = snapWay(h.y, T.y) + 2 + m * PITCH; if (cx < 1 || cy < 1 || cx >= N - 1 || cy >= N - 1) continue;
          if (T.sites.some(q => Math.abs(q.x - cx) <= 1 && Math.abs(q.y - cy) <= 1)) continue;
          let ok = 0, fe = 0, mine2 = 0, theirs = false;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = I(cx + dx, cy + dy); if (owner[t] && owner[t] !== h.id) theirs = true; if (field[t] && owner[t] === h.id) mine2++; if (water[t] || pit[t] > 0.1 || rock[t] > 0.4 || tree[t] > 0.3 || mass[t] !== mass[I(h.x, h.y)] || (T.wall && T.wall.cells.includes(t))) continue; ok++; fe += fert[t]; }
          if (theirs || ok < 6 || mine2 >= ok) continue;
          lots.push([cx, cy, Math.hypot(cx - h.x, cy - h.y) * 0.22 - fe / ok]);
        }
        lots.sort((p, q) => p[2] - q[2]);
        for (const [cx, cy] of lots) {
          if (have >= want) break;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = I(cx + dx, cy + dy); if (field[t] || water[t] || pit[t] > 0.1 || rock[t] > 0.4 || tree[t] > 0.3 || mass[t] !== mass[I(h.x, h.y)] || (T.wall && T.wall.cells.includes(t))) continue;
            field[t] = 1; owner[t] = h.id; tree[t] = 0; grass[t] = Math.max(grass[t], 0.15); have++; }
        }
        h.fields = have; total += have;
      }
      T.fields = total; T.sown = true; T.cropWarm = 0; fieldList = null;
    }
    if (T.sown) {
      T.cropWarm += Math.max(0, ct) * dt;
      const ripe = T.cropWarm > 5.6, frost = ct < 0;
      if (ripe || frost) {
        let dry = 0, nf = 0, got = 0; const by = new Map(T.sites.map(q => [q.id, q])), P = folk();
        const boost = (T.carts ? 1.3 : 1) * (T.skills.plough && S.agents.some(b => b.alive && b.tame) ? 1.4 : 1);
        for (const i of fieldTiles()) if (field[i]) {
          nf++; if (soil[i] < 0.32) dry++;
          const h = by.get(owner[i]); let y = flood[i] ? 0 : Math.max(0, grass[i] - 0.1) * 2.6 * (ripe ? 1 : 0.5) * boost; grass[i] = Math.min(grass[i], 0.1);
          if (h) {
            if (h.farmer === undefined || h.farmerT !== S.tickNo) {
              h.farmer = P.some(b => b.house === h.id && b.job === 'farmer');
              h.farmerT = S.tickNo;
            }
            if (h.farmer) y *= 1.3;
            h.larder = (h.larder || 0) + y;
          } else T.store += y;
          got += y;
        }
        if (nf && dry / nf > 0.3) T.need.water += 1.5;
        T.lastHarvest = got; T.got.farm += got; T.eff.farm += Math.max(4, P.filter(b => b.job === 'farmer').length * TPY * 0.5); T.sown = false; T.resting = true;
      }
    }
    if (T.resting) { T.sown = true; T.cropWarm = -1e9; if (ct < 2) { T.resting = false; T.sown = false; } }   // nothing is sown again until the cold has passed
    T.lastCampT = ct;
  }

  // Starting over in the same place: the settlement object is kept (the view holds it) but every field is a fresh one's,
  // and what the old place left on the ground (ways, fields, who owned them) is gone.
  function resettle(T) {
    const [x, y] = campSite(), fresh = newSettlement(x, y);
    for (const k of Object.keys(T)) delete T[k];
    Object.assign(T, fresh);
    tread.fill(0); owner.fill(0); field.fill(0); known.fill(0);   /* newcomers know nothing of the place */
  }
  // ---------------------------------------------------------------- one step of time
  function tick() {
    heardNow = din; din = []; S.din = heardNow;
    const dt = 1 / TPY; S.t += dt; S.tickNo++; S.night = DAY ? S.tickNo % DAY === DAY - 1 : false; S.dayK = DAY ? (S.night ? 0 : DAY / (DAY - 1)) : 1; weather(dt); land(dt);
    for (let k = S.piles.length - 1; k >= 0; k--) { const p = S.piles[k], i = I(p.x, p.y); if (p.kind === 'meat') p.amt *= 1 - Math.min(1, 2.5 * dt); if (p.kind === 'wood' && burn[i] > 0) p.amt = 0; if (p.amt <= 0.05 || water[i]) S.piles.splice(k, 1); }   /* meat rots in a few months; logs burn */
    for (const q of S.homes.values()) q.n = 0;
    for (const L of cells) L.length = 0; S.pop = {}; for (const sp in SP) S.pop[sp] = 0; S.popPeople = 0;
    S.adults = {};
    for (const a of S.agents) if (a.alive) { cells[I(a.x, a.y)].push(a); S.pop[a.sp]++; if (a.age >= a.d.mature) S.adults[a.sp] = (S.adults[a.sp] || 0) + 1; if (a.d.people) S.popPeople++; const q = a.home && S.homes.get(a.home); if (q) q.n++; else a.home = 0; }
    for (const q of S.homes.values()) { if (q.n) q.emptyT = 0; else if ((q.emptyT += dt) > 2 || flood[I(q.x, q.y)]) S.homes.delete(q.id); }
    const T = S.tribe, born = [], campI = I(T.x, T.y), lengthening = daysLengthen(), sunH = sunHeight();
    {
      const keep = (T.skills.pottery ? 0.7 : 1) * (T.skills.granary ? 0.55 : 1);
      let lost = T.store * 0.35 * keep * dt;
      T.store = Math.max(0, T.store - lost);   /* what rots is seen rotting, in every larder */
      for (const q of T.sites) if (q.larder > 0) {
        const l = q.larder * 0.35 * ((q.was || q.kind) === 'tent' ? 1 : 0.75) * keep * dt;
        q.larder -= l;
        lost += l;
      }
      if (S.popPeople) T.need.spoil += lost / S.popPeople;
    }
    if (flood[campI]) { T.store *= 1 - Math.min(1, 2.5 * dt); T.need.flood += dt * 2; }
    for (const w of T.sites) if (live(w) && flood[I(w.x, w.y)] && !w.lake && !(T.skills.concrete && w.kind === 'house' && !w.was) && rnd() < 3 * dt) {
      T.need.flood += 3;
      tell('The flood has taken a ' + (w.was || w.kind) + '.' + (T.floodSeen ? '' : ' Nobody will build so low again without thinking.'));
      T.floodSeen = true;
      w.was = '';
      w.stage = 0;
      /* what the water leaves: most of the stone and some of the timber lie where the house stood */
      w.wood *= RUBBLE_WOOD;
      w.stone *= RUBBLE_STONE; w.flooded = true; w.qtrips = 0; }
    if (!T.skills.fire && S.popPeople) {
      for (let dy = -6; dy <= 6 && !T.skills.fire; dy++) for (let dx = -6; dx <= 6; dx++) {
        const x = T.x + dx, y = T.y + dy;
        if (x >= 0 && y >= 0 && x < N && y < N && burn[I(x, y)] > 0) {
          T.skills.fire = true;
          S.log.push({ t: S.t, text: 'The people have taken fire for themselves.' });
          break;
        }
      }
    }
    farm(dt); society(dt);
    {
      const lv = T.sites.filter(live);
      T.huts = lv.length;
      T.roof = lv.length ? lv.reduce((q, w) => q + ((DWELL[w.was || w.kind] || {}).roof || 0.7), 0) / lv.length - (T.skills.masonry ? 0.05 : 0) : 0.7;
      if (S.tickNo % TPY === 3) {
        reckonYear(); settlePits();
        townLife();
      }
    }
    /* hearths burn what their households carried home, while the air at the door is cold */
    if (T.skills.fire) for (const h of [T].concat(T.sites.filter(q => live(q) && q.members > 0))) {
      if (!(h.fuel > 0) || tempAt(I(h.x, h.y)) >= HUMAN.comfort - 3) continue;
      h.fuel = Math.max(0, h.fuel - FUEL_BURN); h.lit = S.tickNo; T.fireT = S.t;
    }
    if (T.well && S.popPeople) for (const i of fieldTiles()) if (field[i] && soil[i] < (T.skills.irrigation ? 0.7 : 0.45)) soil[i] = T.skills.irrigation
        ? 0.7 : 0.45;   // carried from the well, a bucket at a time
    for (const a of S.agents) {
      if (!a.alive) continue; const d = a.d, i = I(a.x, a.y), Tc = tempAt(i); if (a.fear > 0) a.fear -= dt * 1.4;
      if (S.popPeople && !d.people && d.eats.meat && d.mass > 3 && cheb(a, T) <= 4 && !a.hidden) T.threat += dt * 3; /* a hunter in among the houses is remembered */
      a.age += dt;
      a.cd -= dt;
      a.mood = '';
      a.act = null;
      const wasHidden = a.hidden;
      a.hidden = false;
      // --- warmth: a body loses heat to cold air, faster when wet, slower under cover
      let shelter = tree[i] > 0.4 ? 0.6 : 1;
      if (wasHidden) shelter *= 0.4;
      if (d.people) {
        const hm = a.house && T.sites.find(q => q.id === a.house),
          home = Math.max(Math.abs(a.x - T.x), Math.abs(a.y - T.y)) <= 2 || (!!hm && Math.max(Math.abs(a.x - hm.x), Math.abs(a.y - hm.y)) <= 1);
        const atCamp = Math.max(Math.abs(a.x - T.x), Math.abs(a.y - T.y)) <= 2, hearth = hm && !atCamp ? hm : T;
        shelter = home ? (T.huts * 4 >= S.pop[a.sp] ? T.roof : 0.7) * (T.skills.fire && hearth.lit === S.tickNo ? 0.5 : 1) : 1;
      }
      const soaked = S.precip > 0 && Tc >= 0 && shelter > 0.5 ? 1.5 : 1;         // cold rain is worse than dry cold
      if (d.people && a.e < 0.35) { const hm = homeSite(a); if (hm) hm.hunger += dt / Math.max(1, hm.members); }
      if (d.people && a.e < 0.35) T.need.hunger += dt / S.popPeople;   /* wants are what one person feels, on average: a big camp is not colder than a small one */
      const cold = Math.max(0, d.comfort - Tc) * d.chill * shelter * soaked, hot = Tc > 32 ? (Tc - 32) * 0.08 : 0;
      if (d.people && cold > 0.1) { T.need.cold += cold * dt / S.popPeople; const hm = homeSite(a); if (hm) hm.cold += cold * dt / Math.max(1, hm.members); }
      const asleep = d.sleepsBelow !== undefined && Tc < d.sleepsBelow;                    // some bodies sleep the cold away
      a.e -= d.metab * dt / (d.people && a.age < GROWN ? 2.5 : 1) * (asleep ? 0.12 : 1 + cold + hot);
      if (cold > 0.4) a.mood = 'cold'; else if (hot > 0.2) a.mood = 'hot';
      if (a.age > a.life * (d.people && T.skills.medicine ? 1.15 : 1)) { die(a, 'old age'); continue; }
      if (flood[i]) { a.e -= 1.2 * dt; if (rnd() < 0.6 * dt) { die(a, 'drowned'); continue; } roam(a, 3, 2); }
      if (burn[i] > 0) { if (rnd() < 0.5) { die(a, 'burned'); continue; } a.e -= 0.1; roam(a, 3, 3); }
      const e0 = a.e;
      if (asleep) a.mood = 'asleep'; else if (a.held) a.mood = 'afraid'; else if (d.people) { person(a, d, dt); tally(a); if (a.alive) see(a); } else animal(a, d, dt);
      if (!a.mood) a.mood = a.e < 0.3 ? 'hungry' : a.e > e0 + 0.02 ? 'fed' : '';
      if (a.alive && a.e <= 0) { die(a, Tc < d.comfort ? 'cold and hunger' : 'hunger'); continue; }
      // --- young are born to a well-fed mother when the air is warm enough for them
      if (a.alive && a.age >= d.mature && a.cd <= 0 && a.e > d.breedE && Tc >= d.warmBreed && (lengthening || sunH >= (d.lateLight || 0))) {
        if (d.people) {
          {
            const hm = homeSite(a);
            if (!a.fem || a.age < WED || a.age > 42 || !(hm ? (hm.larder || 0) >= 0.9 * (hm.members || 2) + 0.5 || T.store >= 1.1 * S.pop[a.sp] + 1 : T.store >= 1.1 * S.pop[a.sp] + 1)) continue;
          }
          const q = S.byId.get(a.partner);
          if (!q || !q.alive || (a.house ? q.house !== a.house : cheb(q, a) > 3)) continue;   /* a couple under one roof (they are not side by side all day) */
          if (childrenOf(a).filter(c => c.age < GROWN).length >= 3) continue;
        }   // a household can carry only so many small children at once
        else {
          if (!nearest(a, 7, b => b.sp === a.sp && b.age >= d.mature)) continue;
          if (d.territory) { const c = around(a, d.territory * 2, b => b.sp === a.sp).length + 1; if (c > d.territory) continue; }
        }
        const n = d.litter[0] + ((rnd() * (d.litter[1] - d.litter[0] + 1)) | 0); a.e -= 0.25 + 0.08 * n; a.cd = d.interval * (d.people ? 0.85 : 1) * R(0.85, 1.2);
        for (let k = 0; k < n; k++) born.push([a.sp, a.x, a.y, a.home, a.id]);
      }
    }
    /* test levers (G.hold, G.ban): no young beyond a held number, none at all of a banned kind */
    for (const b of born) {
      const cap = S.levers.hold[b[0]];
      if (S.levers.banned[b[0]] || (cap !== undefined && (SP[b[0]].people ? folk().length : S.pop[b[0]]) >= cap)) continue;
      const c = add(b[0], b[1], b[2], 0, 0.55);
      c.mom = b[4];
      {
        const mm = S.byId.get(b[4]);
        if (mm && mm.tame) c.tame = true;
      }
      if (c.d.people) {
        const m = S.byId.get(b[4]), f = m && S.byId.get(m.partner);
        c.dad = f ? f.id : 0;
        if (m) {
          c.looks.skin = (f && rnd() < 0.5 ? f : m).looks.skin;
          c.looks.hair = (f && rnd() < 0.5 ? f : m).looks.hair;
        }
        for (const k of CRAFTS) c.skill[k] = clamp(((m ? m.skill[k] : 1) + (f ? f.skill[k] : 1)) / 2 * 0.3 + R(0.6, 0.8), 0.6, 1.2);
        if (m) tell(m.name + (f ? ' and ' + f.name : '') + ' have a ' + (c.fem ? 'daughter' : 'son') + ', ' + c.name + '.');
      }
      if (b[3] && S.homes.has(b[3])) c.home = b[3];
      S.fx.push({ kind: 'birth', sp: b[0], x: c.x, y: c.y, id: c.id, mom: b[4] });
      if (SP[b[0]].people) T.born++;
    }
    if (S.fx.length > 200) S.fx.splice(0, S.fx.length - 200);
    // an empty valley does not stay empty of people for ever: after a few years, strangers find it
    if (opt.resettle) {
      if (S.popPeople) S.emptyT = 0; else {
        S.emptyT += dt;
        if (S.emptyT > 3) {
          S.emptyT = 0;
          resettle(T);
          for (const sp in SP) if (SP[sp].people) for (let k = 0; k < 2; k++) {
            const c = add(sp, T.x, T.y, 18 + k * 2, 1);
            S.fx.push({ kind: 'arrive', id: c.id, x: c.x, y: c.y });
          }
          S.fx.push({ kind: 'settlers', x: T.x, y: T.y });
          S.log.push({ t: S.t, text: 'Two strangers have come over the hills.' });
        }
      }
    }
    if (S.agents.length > 400 && Math.floor(S.t * TPY) % 12 === 0) { S.agents = S.agents.filter(a => a.alive); S.byId.clear(); for (const a of S.agents) S.byId.set(a.id, a); }
    // the valley is not the whole world: now and then animals wander in over the hills.
    // Plant eaters come when their kind is nearly gone; hunters come when there is plenty to hunt.
    if (!opt.closed && Math.floor(S.t * TPY) % TPY === 0) {
      for (const sp in SP) {
        const d = SP[sp]; if (!d.wanders) continue; let come = false;
        if (d.eats.meat && !plantEater(d)) {
          let game = 0;
          for (const q in SP) if (!SP[q].people && !SP[q].eats.meat && SP[q].mass <= d.mass * reach(d)) game += S.pop[q] * SP[q].mass;
          come = game / (S.pop[sp] + 1) > 6 * d.mass && S.pop[sp] < 16 * AREA && rnd() < 0.8;
        }
        else come = S.pop[sp] < 8 * AREA && rnd() < 0.6;
        if (S.levers.banned[sp]) come = false;
        if (come) {
          const ex = rnd() < 0.5 ? 1 : N - 2, ey = R(2, N - 2);
          for (let k = 0; k < Math.round((d.mass < 1 ? 4 : 2) * Math.sqrt(AREA)); k++) {
            const c = add(sp, ex, ey, d.mature * 1.2, 0.9);
            S.fx.push({ kind: 'arrive', id: c.id, x: c.x, y: c.y });
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------- the god's hand
  // Each power does one physical thing. Whether that helps depends on the state of the world it lands on.
  const area = (x, y, r, fn) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      fn(I(nx, ny));
    }
  };
  const G = {
    // water from the sky: snow on frozen ground, rain on warm ground, and it cools what it falls on
    rain(x, y, r, amt) {
      let n = 0;
      area(x, y, r, i => {
        n++;
        if (water[i]) return;
        if (tempAt(i) < 0) snow[i] += amt; else soil[i] = Math.min(1.4, soil[i] + amt);
        heat[i] -= 3 * amt;
        if (burn[i] > 0) burn[i] = 0;
      });
      S.river += amt * n / (N * N) * (tempAt(I(clamp(x, 0, N - 1), clamp(y, 0, N - 1))) < 0 ? 0 : 2.5);
    },
    // warmth from the sky
    sun(x, y, r, deg) { area(x, y, r, i => { heat[i] = Math.min(22, heat[i] + deg); }); },
    // a push to whatever is able to grow: it does little on frozen or parched ground
    grow(x, y, r, amt) {
      const T = S.tribe;
      if (S.popPeople && Math.max(Math.abs(x - T.x), Math.abs(y - T.y)) <= 5 && r <= 6) {
        if (S.t - (T.lastGrowT || -9) > 0.12) {
          T.seenGrow = (T.seenGrow || 0) + 1;
          T.lastGrowT = S.t;
        }
        if (T.seenGrow >= 3 && !T.skills.farm) {
          T.skills.farm = true;
          S.log.push({ t: S.t, text: 'The people have learned to sow.' });
        }
      }
      area(x, y, r, i => {
        if (water[i]) return;
        const k = amt * clamp(tempAt(i) / 8, 0.05, 1) * clamp(soil[i] / 0.3, 0.2, 1);
        grass[i] = Math.min(1, grass[i] + k);
        tree[i] = Math.min(1, tree[i] + k * 0.5);
        fruit[i] = Math.min(1.2, fruit[i] + k * tree[i]);
      });
    },
    // fire and force on one spot: kills what stands there, and sets light to anything dry enough to burn
    // what it breaks is left lying there: an animal's body as meat, a tree as logs, bare rock as loose stone; only dry grass
    // with nothing standing on it catches fire
    strike(x, y, id) {
      /* whatever stands on the tile now (or the one creature aimed at, wherever it is) */
      const aimed = id ? S.byId.get(id) : null; if (aimed && aimed.alive) { x = aimed.x; y = aimed.y; }
      const i = I(x, y), hit = S.agents.filter(a => a.alive && ((a.x === x && a.y === y) || a === aimed));
      for (const a of hit) { if (!a.d.people) dropPile(a.x, a.y, 'meat', bodyOf(a) * 0.9); die(a, 'struck'); }
      if (!water[i] && tree[i] > 0.1) { dropPile(x, y, 'wood', tree[i] * 12); tree[i] = 0; fruit[i] = 0; cut[i] = 0; }
      else if (!water[i] && rock[i] >= 0.15) { const dug = Math.min(rock[i], 0.06); rock[i] -= dug; pit[i] = Math.min(1, pit[i] + dug); dropPile(x, y, 'stone', dug * STONE_PER_TILE); }
      else if (!water[i] && snow[i] < 0.05 && soil[i] < 0.9 && grass[i] > 0.5) burn[i] = 1;
      heat[i] += 4; },
    // the hand moves a pile: set down by the fire it goes into the common store (meat), the timber or the stone; anywhere
    // else it lies where it is put, to be fetched
    movePile(x, y, kind, tx, ty) {
      const p = S.piles.find(q => q.x === x && q.y === y && q.kind === kind); if (!p) return '';
      S.piles.splice(S.piles.indexOf(p), 1); const T = S.tribe;
      if (S.popPeople && Math.max(Math.abs(tx - T.x), Math.abs(ty - T.y)) <= 2) { if (kind === 'meat') T.store += p.amt; else if (kind === 'wood') T.wood += p.amt; else T.stone += p.amt; return 'store'; }
      const f = free(tx, ty); dropPile(f[0], f[1], kind, p.amt); return 'ground';
    },
    // test levers
    cull(sp, frac) { for (const a of S.agents) if (a.alive && a.sp === sp && rnd() < frac) die(a, 'struck'); },
    feed(sp, amt) { for (const a of S.agents) if (a.alive && a.sp === sp) a.e = Math.min(1.2, a.e + amt); },
    give(amt) { S.tribe.store += amt; },
    climate(f) { S.rainY = f; }, drought(f) { S.rainY = f; }, warm(deg) { S.warmOff = deg; },
    teach(skill) { S.tribe.skills[skill] = true; },
    // scenario levers: hold a kind at a number (no births or arrivals beyond it), ban a kind outright, fell every tree
    // within r tiles of a point, take away all bare stone
    hold(sp, n) { S.levers.hold[sp] = n; },
    ban(sp) { S.levers.banned[sp] = true; for (const a of S.agents) if (a.alive && a.sp === sp) die(a, 'struck'); },
    fell(x, y, r) { area(x, y, r, i => { tree[i] = 0; fruit[i] = 0; }); },
    noStone() { rock.fill(0); }
  };
  const stats = () => {
    let g = 0, t = 0, n = 0, sn = 0, so = 0, fl = 0;
    for (let i = 0; i < N * N; i++) if (!water[i]) {
      g += grass[i];
      t += tree[i];
      sn += snow[i];
      so += soil[i];
      fl += flood[i];
      n++;
    }
    return { grass: g / n, tree: t / n, snow: sn / n, soil: so / n, flood: fl / n, store: S.tribe.store, huts: S.tribe.huts, air: S.air, river: S.river };
  };
  // ---------------------------------------------------------------- save and load
  // The world is plain data: the land arrays, S, the random stream and the noises still in the air. Typed arrays travel as
  // base64, Maps as their entries, and a creature names its species row instead of holding it.
  const FIELDS = { cut, height, known, pit, water, fert, bank, soil, snow, heat, burn, flood, grass, tree, fruit, fish, warmSum, field, rock, tread, owner };
  const b64 = ta => {
    const u = new Uint8Array(ta.buffer, ta.byteOffset, ta.byteLength);
    let str = '';
    for (let i = 0; i < u.length; i += 0x8000) str += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(str);
  };
  const unb64 = (str, Type) => { const bin = atob(str), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Type(u.buffer); };
  const TYPES = { Float32Array, Uint8Array, Int32Array };
  function pack(key, v) {
    if (key === 'd' && v && this.sp && v === SP[this.sp]) return undefined;
    if (ArrayBuffer.isView(v)) return { __ta: v.constructor.name, b: b64(v) };
    if (v instanceof Map) return { __map: [...v.entries()] };
    return v;
  }
  function unpack(key, v) {
    if (v && typeof v === 'object' && v.__ta) return unb64(v.b, TYPES[v.__ta]);
    if (v && typeof v === 'object' && v.__map) return new Map(v.__map);
    return v;
  }
  function save() {
    const o = {}; for (const k in opt) if (k !== 'species' && typeof opt[k] !== 'function') o[k] = opt[k];
    return JSON.stringify({ v: 1, seed, opt: o, N, rs, din, heardNow, fields: FIELDS, S }, pack);
  }
  function restore(json) {
    const o = typeof json === 'string' ? JSON.parse(json, unpack) : json;
    if (o.N !== N) throw new Error('save is for a ' + o.N + ' map, this world is ' + N);
    for (const k in FIELDS) if (o.fields[k]) FIELDS[k].set(o.fields[k]); findMasses();   /* ponds dug since the world began are part of the water now */
    rs = o.rs; din = o.din; heardNow = o.heardNow;
    for (const k of Object.keys(S)) delete S[k];
    Object.assign(S, o.S); S.din = heardNow;
    /* a save from an older version lacks the settlement fields added since: they take a fresh settlement's defaults */
    { const fresh = newSettlement(S.tribe.x, S.tribe.y); for (const k in fresh) if (!(k in S.tribe)) S.tribe[k] = fresh[k]; for (const k in fresh.need) if (!(k in S.tribe.need)) S.tribe.need[k] = 0;
      if (!S.piles) S.piles = [];
      if (!S.stat) S.stat = {}; for (const k of ['wishes', 'ponds', 'newTrips', 'newN', 'reTrips', 'reN', 'pitD', 'pitN', 'lotsRefused', 'fireMeals', 'starveD', 'starveRef', 'starveN', 'forageD', 'forageN', 'timberD', 'timberN', 'stoneD', 'stoneN', 'fuelD', 'fuelN']) if (!(k in S.stat)) S.stat[k] = 0;
      for (const q of S.tribe.sites) { if (q.fuel === undefined) q.fuel = 0; if (q.lit === undefined) q.lit = -1; } }
    S.byId = new Map(); for (const a of S.agents) { a.d = SP[a.sp]; S.byId.set(a.id, a); }
    folkList = null; fieldList = null;
  }
  tick();
  return { S,
    N,
    TPY,
    tick,
    G,
    newSettlement,
    save,
    restore,
    pit,
    known,
    height,
    cut,
    flowTo,
    accum,
    filled,
    mass,
    fords: () => fords,
    wayDist,
    around,
    route,
    stats,
    tread,
    PITCH,
    onWay,
    hear,
    owner,
    allFood,
    TECHS,
    IDEAS,
    ideas: () => Object.keys(IDEAS).map(k => ({ k,
      need: IDEAS[k].need,
      at: IDEAS[k].at,
      known: !!S.tribe.skills[k],
      can: !S.tribe.skills[k] && !!IDEAS[k].can(S.tribe) })),
    describe,
    craftOf,
    households,
    rock,
    land: landKind,
    LANDS,
    DWELL,
    SPECIES: SP,
    SKILLS,
    tempAt,
    sunHeight,
    daysLengthen,
    warmSum,
    fert,
    cells,
    moveTo(a, x, y) {
      const p = free(x, y);
      a.x = p[0];
      a.y = p[1];
    }, grass, tree, water, fruit, fish, flood, field, soil, snow, heat, burn, bank, add, bodyOf, canTake };
}
// a saved world: made afresh from its seed and options, then every piece of its state is put back
function load(json) { const o = typeof json === 'string' ? JSON.parse(json) : json; const W = create(o.seed, o.opt); W.restore(typeof json === 'string' ? json : JSON.stringify(o)); return W; }
root.Eden = { create, load, SPECIES, SKILLS, TECHS, JOBS };
})(typeof window !== 'undefined' ? window : globalThis);
