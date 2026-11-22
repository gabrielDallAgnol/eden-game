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
  gather: { known: true }, hunt: { known: true }, fish: { known: true }, tent: { known: true }, store: { known: true },
  hut: { known: false, learn: 'a winter spent under hides' }, house: { known: false, learn: 'a camp of huts, grown large' }, well: { known: false, learn: 'two roofs and many mouths' },
  fire: { known: false, learn: 'sees a tree burn' }, farm: { known: false, learn: 'sees plants made to grow beside the camp' },
  herd: { known: false, learn: 'a young animal caught alive' }, wheel: { known: false, learn: 'a tame beast and a made road' }
};

// Things people may work out for themselves. Why and when is not written here: see IDEAS inside create(), where each is tied
// to a want that has actually been felt and to the means lying at hand.
const TECHS = { pottery: 1, palisade: 1, plough: 1, granary: 1, irrigation: 1, tools: 1, medicine: 1, masonry: 1, writing: 1, concrete: 1 };
const JOBS = { farmer: 'gather', hunter: 'hunt', fisher: 'fish', gatherer: 'gather', builder: 'build', woodcutter: 'build', mason: 'build', herder: 'gather', guard: 'hunt' };
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

  // The kind of country. Same rules everywhere; only the lie of the land differs: how much water, how much wood, how much stone, how cold.
  const LANDS = {
    valley:   { river: 1.1, pond: [4.2, 3],   treeAt: 0.56, rockAt: 0.82, warm: 0,  fert: 0 },
    plains:   { river: 0.8, pond: [2.4, 1.7], treeAt: 0.72, rockAt: 0.9,  warm: 1,  fert: 0.08 },
    forest:   { river: 1.1, pond: [3, 2.2],   treeAt: 0.42, rockAt: 0.86, warm: 0,  fert: 0.05 },
    lakeland: { river: 1.2, pond: [9, 6.5],   treeAt: 0.58, rockAt: 0.86, warm: 0,  fert: 0 },
    highland: { river: 0.9, pond: [2.6, 1.9], treeAt: 0.6,  rockAt: 0.56, warm: -3, fert: -0.12 }
  };
  const landKind = LANDS[opt.land] ? opt.land : 'valley', LAND = LANDS[landKind], rock = F();
  const noise = (x, y, s) => { const h = (a, b) => { let n = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(s, 982451653)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; }; const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * u + (h(xi, yi + 1) - h(xi, yi)) * v + (h(xi, yi) - h(xi + 1, yi) - h(xi, yi + 1) + h(xi + 1, yi + 1)) * u * v; };
  const sd = (seed || 1) * 7 + 3;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = I(x, y), rx = N * 0.62 + Math.sin(y * 0.22 + sd) * 4;
    if (Math.abs(x - rx) < LAND.river || ((x - N * 0.3) / LAND.pond[0]) ** 2 + ((y - N * 0.7) / LAND.pond[1]) ** 2 < 1) water[i] = 1;
    const rn = noise(x / 5, y / 5, sd + 21); rock[i] = !water[i] && rn > LAND.rockAt ? clamp((rn - LAND.rockAt) * 5, 0.2, 1) : 0;   // bare stone showing through
    fert[i] = clamp((0.45 + 0.75 * noise(x / 7, y / 7, sd) + LAND.fert) * (1 - 0.45 * rock[i]), 0.25, 1);
    const tn = noise(x / 6, y / 6, sd + 9);
    tree[i] = water[i] || rock[i] > 0.5 ? 0 : tn > LAND.treeAt ? clamp((tn - LAND.treeAt + 0.06) * 3, 0, 0.95) : 0;
    grass[i] = water[i] ? 0 : 0.5 * fert[i]; fish[i] = water[i] ? 1 : 0; cells.push([]);
  }
  // how close each piece of ground lies to open water: it decides seepage and what floods first
  for (let i = 0; i < N * N; i++) {
    const x = i % N, y = (i / N) | 0; let d = 9;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; if (water[I(nx, ny)]) d = Math.min(d, Math.hypot(dx, dy)); }
    bank[i] = clamp(1 - d / 5, 0, 1); soil[i] = 0.45 + 0.55 * bank[i];
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
    for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); if (x < 0 || y < 0 || x >= N || y >= N) continue; const i = I(x, y); if (!water[i]) tread[i] = Math.min(6, tread[i] + w); }
  }
  // The ground remembers feet. A trip goes out from the door to the nearest way, along the ways, and in at the other end;
  // every cell it crosses is worn a little, and unused ways grow over. Where the wear is deep there is a street.
  function walk(x0, y0, x1, y1, w) {
    const T = S.tribe, vx = snapWay(x0, T.x), hy = snapWay(y1, T.y);
    stamp(x0, y0, vx, y0, w * 0.4); stamp(vx, y0, vx, hy, w); stamp(vx, hy, x1, hy, w); stamp(x1, hy, x1, y1, w * 0.4);
  }
  const S = { t: opt.startT || 0, agents: [], pop: {}, tribe: { x: 0, y: 0, store: 5, huts: 0, wood: 0, stone: 0, roof: 0.7, level: 0, carts: 0, threat: 0, need: { cold: 0, hunger: 0, spoil: 0, water: 0, danger: 0, flood: 0, toil: 0, crowd: 0, loss: 0, reckon: 0 }, plenty: 1, pave: 1, stoneWork: 0, floodSeen: false, got: { fish: 0, gather: 0, hunt: 0, farm: 0 }, eff: { fish: 0, gather: 0, hunt: 0, farm: 0 }, rate: {}, wall: null, fence: null, streets: null, road: new Uint8Array(N * N), sites: [], skills: {}, dead: 0, born: 0 }, log: [], deaths: {}, nextId: 1,
    rainY: 1, warmOff: LAND.warm, river: 1, air: 0, precip: 0, sky: 'clear', fx: [], emptyT: 0, homes: new Map(), tickNo: 0, night: false, dayK: 1, byId: new Map() };
  const DAY = opt.dayCycle || 0;   // ticks per day (0 = no day and night). Work that is skipped at night is done a little faster by day, so a year holds the same work.
  for (const k in SKILLS) S.tribe.skills[k] = SKILLS[k].known;
  for (const k in TECHS) S.tribe.skills[k] = false;

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
    S.agents.push(a); S.byId.set(a.id, a); if (d.people) { folkList = null; soul(a); folkList = null; } return a;
  }
  // ---------------------------------------------------------------- people are someone
  // Each person has a name, a sex, parents, perhaps a partner and a house, things they are good at, and people they miss.
  // What the camp does as a whole follows from what each of them wants: to eat, to be warm, to be with their own.
  const NAMES = { f: ['Mara', 'Ila', 'Suna', 'Edda', 'Wren', 'Tessa', 'Noor', 'Liv', 'Ansa', 'Runa', 'Yara', 'Hild', 'Oona', 'Brin', 'Sefa', 'Kaia', 'Dalla', 'Mirre', 'Thea', 'Ione'],
    m: ['Tor', 'Ben', 'Aron', 'Finn', 'Odo', 'Kell', 'Rasmus', 'Ivo', 'Bram', 'Leif', 'Soren', 'Hale', 'Emre', 'Jorn', 'Calder', 'Pell', 'Garth', 'Niko', 'Ulf', 'Davin'] };
  const CRAFTS = ['hunt', 'fish', 'gather', 'build'], CRAFT_NAME = { hunt: 'hunter', fish: 'fisher', gather: 'gatherer', build: 'builder' };
  const WED = 16;                                                   // old enough to pair off
  let folkList = null;                                               // the living people, gathered once and reused until someone is born, arrives or dies
  const folk = () => folkList || (folkList = S.agents.filter(b => b.alive && b.d.people));
  function nameFor(a) { const pool = NAMES[a.fem ? 'f' : 'm'], used = new Set(folk().filter(b => b !== a).map(b => b.name)); let nm = pool[(rnd() * pool.length) | 0]; for (let k = 0; k < pool.length && used.has(nm); k++) nm = pool[(pool.indexOf(nm) + 1) % pool.length]; return nm; }
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
    const what = a.job && a.age >= 13 && a.age <= 46 ? 'a ' + a.job : a.age < 2 ? 'a baby' : a.age < 6 ? 'a small child' : a.age < 13 ? 'a child, learning to ' + craftOf(a) : a.age > 46 ? 'an elder' : 'a ' + CRAFT_NAME[craftOf(a)];
    const mood = a.grief > 0.2 ? 'grieving' : a.mood === 'afraid' ? 'afraid' : a.e < 0.3 ? 'hungry' : a.mood === 'cold' ? 'cold' : a.e > 0.8 ? 'content' : 'getting by';
    const mom = S.byId.get(a.mom), dad = S.byId.get(a.dad), par = [mom, dad].filter(q => q && q.alive).map(q => q.name);
    return a.name + ', ' + age + ', ' + what + '. ' + (p && p.alive ? (a.fem ? 'Her' : 'His') + ' partner is ' + p.name + '. ' : a.age >= WED ? 'On ' + (a.fem ? 'her' : 'his') + ' own. ' : '')
      + (kids.length ? 'Children: ' + kids.join(', ') + '. ' : '') + (a.age < WED && par.length ? 'Child of ' + par.join(' and ') + '. ' : '') + 'Now: ' + mood + '.';
  }
  // Once in each step the camp's ties are looked over: who has grown close, who needs a roof, who has no one to choose
  function society(dt) {
    const T = S.tribe, P = folk(); if (!P.length) return;
    const evening = !DAY || S.tickNo % DAY === DAY - 2;
    T.kidsHungry = P.some(b => b.age < 13 && b.e < 0.7);
    { const wl = T.sites.find(q => q.kind === 'well' && raised(q));                     // every household walks to the fire and fetches its water, every day
      for (const q of T.sites) if (live(q)) { const n = P.filter(b => b.house === q.id).length; if (!n) continue; walk(q.x, q.y, T.x, T.y, 0.02 * n); if (wl) walk(q.x, q.y, wl.x, wl.y, 0.012 * n); }
      if (!wl && T.waterAt) walk(T.x, T.y, T.waterAt % N, (T.waterAt / N) | 0, 0.01 * P.length);
      if (S.tickNo % 4 === 0) for (let i = 0; i < N * N; i++) if (tread[i] > 0) tread[i] *= 0.965; }
    for (const a of P) {
      if (a.grief > 0) a.grief = Math.max(0, a.grief - dt * 1.2);
      if (a.partner) { const q = S.byId.get(a.partner); if (!q || !q.alive) a.partner = 0; }
      // the young learn by going along: a child picks up whatever its parents are doing
      if (a.age >= 6 && a.age < 13) for (const id of [a.mom, a.dad]) { const q = id && S.byId.get(id); const k = q && q.alive && q.act && { hunt: 'hunt', fish: 'fish', gather: 'gather', build: 'build', chop: 'build', haul: 'build' }[q.act.k]; if (k) practise(a, k, 0.006); }
    }
    // courting: two who are free, not kin, near in age and around the same fire of an evening grow close, and in time pair off
    if (evening) for (const a of P) {
      if (a.partner || a.age < WED || a.grief > 0.3 || !a.fem) continue;
      for (const b of P) {
        if (b.fem || b.partner || b.age < WED || b.grief > 0.3 || kin(a, b) || Math.abs(a.age - b.age) > 14 || cheb(a, b) > 4) continue;
        a.bond[b.id] = (a.bond[b.id] || 0) + R(0.05, 0.3); a.court = b.id; b.court = a.id;
        if (a.bond[b.id] >= 1) { a.partner = b.id; b.partner = a.id; a.court = b.court = 0; tell(a.name + ' and ' + b.name + ' have become a couple.'); S.fx.push({ kind: 'pair', a: a.id, b: b.id }); }
        break;
      }
    }
    // a roof for every household: a couple, or one alone with children, claims a finished house that nobody has
    for (const a of P) {
      if (a.age < WED) { const par = S.byId.get(a.mom) || S.byId.get(a.dad); const live = [a.mom, a.dad].map(id => S.byId.get(id)).find(q => q && q.alive && q.house); a.house = live ? live.house : a.house; continue; }
      if (a.house && !T.sites.some(q => q.id === a.house && live(q))) a.house = 0;
      const q = S.byId.get(a.partner); if (!a.house && q && q.house) a.house = q.house;
      if (!a.house) { const free = T.sites.find(st => live(st) && !P.some(b => b.house === st.id)); if (free) { a.house = free.id; if (q) q.house = free.id; tell((q ? a.name + ' and ' + q.name : a.name) + ' moved into a ' + (free.was || free.kind) + ' of their own.'); } }
    }
    // no one to choose: when the grown and free have only kin around them, in time someone comes over the hills
    if (!opt.closed && S.tickNo % TPY === 0) {
      for (const a of P) {
        if (a.partner || a.age < WED || a.age > 40 || a.grief > 0.3) continue;
        if (P.some(b => b !== a && b.fem !== a.fem && !b.partner && b.age >= WED - 2 && !kin(a, b) && Math.abs(a.age - b.age) <= 14)) continue;
        if (rnd() < 0.45) { const ex = rnd() < 0.5 ? 1 : N - 2, c = add(a.sp, ex, R(2, N - 2), clamp(a.age + R(-4, 4), WED + 1, 34), 0.9); c.fem = !a.fem; c.name = nameFor(c);
          S.fx.push({ kind: 'arrive', id: c.id, x: c.x, y: c.y }); tell('A stranger has come over the hills: ' + c.name + ', a ' + CRAFT_NAME[craftOf(c)] + '.'); break; }
      }
    }
  }
  const households = () => { let n = 0; for (const a of folk()) if (a.age >= WED && (!a.partner || a.fem)) { if (a.partner || a.age > 24 || childrenOf(a).length) n++; } return Math.max(1, n); };

  for (const sp in SP) { const d = SP[sp]; if (d.people) continue; const n = opt[sp] === undefined ? (d.start || 0) : opt[sp]; for (let k = 0; k < n; k++) add(sp, R(0, N), R(0, N)); }
  {
    let bx = N >> 1, by = N >> 1, best = -1;
    for (let k = 0; k < 200; k++) {
      const x = (R(4, N - 4)) | 0, y = (R(4, N - 4)) | 0, i = I(x, y); if (water[i]) continue; let w = 0, tr = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const j = I(clamp(x + dx, 0, N - 1), clamp(y + dy, 0, N - 1)); w += water[j]; tr += yieldOf(tree[j]); }
      const sc = Math.min(w, 4) + Math.min(tr, 12) * 0.5 + fert[i]; if (sc > best) { best = sc; bx = x; by = y; }
    }
    S.tribe.x = bx; S.tribe.y = by;
    for (const sp in SP) if (SP[sp].people) { const n = opt[sp] === undefined ? SP[sp].start : opt[sp]; for (let k = 0; k < n; k++) add(sp, bx, by, 18 + k * 2, 1); if (opt.family) { const mom = S.agents[S.agents.length - 1]; for (const c of [add(sp, bx, by, 5, 1), add(sp, bx, by, 0.9, 1)]) { c.mom = mom.id; c.dad = mom.partner; } } }
  }
  const die = (a, why, by) => { if (!a.alive) return; a.alive = false; folkList = null; S.fx.push({ kind: 'death', sp: a.sp, x: a.x, y: a.y, why, id: a.id, by: by || 0 }); const k = a.sp + ':' + why; S.deaths[k] = (S.deaths[k] || 0) + 1; if (a.d.people) { S.tribe.dead++; if (why === 'eaten') S.tribe.threat += 2; if (why === 'hunger' || why === 'cold and hunger') S.tribe.need.hunger += 0.4; if (why !== 'eaten' && why !== 'struck') S.tribe.need.loss += 1;
      if (a.name) { const near = folk().filter(b => b !== a && (b.partner === a.id || kin(a, b))); for (const b of near) { b.grief = 1; if (b.partner === a.id) b.partner = 0; }
        const how = { 'old age': 'has died, full of years', eaten: 'was taken by a wolf', drowned: 'drowned in the flood', burned: 'died in the fire', struck: 'was struck down', hunger: 'starved', 'cold and hunger': 'died of cold and hunger' }[why] || 'has died';
        tell(a.name + ' ' + how + '.' + (near.length ? ' ' + near.slice(0, 3).map(b => b.name).join(', ') + (near.length > 1 ? ' mourn.' : ' mourns.') : '')); } }
    // a kill is seen: those of its kind nearby stay wary of that kind of hunter for most of a year
    if (why === 'eaten' || why === 'hunted') { const k = by && S.byId.get(by); if (k) for (const b of S.agents) if (b.alive && b.sp === a.sp && cheb(b, a) <= 6) { b.fear = 1; b.fearSp = k.sp; } } };
  function nearest(a, r, ok) {
    let best = null, bd = r + 0.01;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = a.x + dx, y = a.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue;
      for (const b of cells[I(x, y)]) { if (!b.alive || b === a || !ok(b)) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); if (d < bd) { bd = d; best = b; } }
    }
    return best;
  }
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
      if (shut(a, nx, ny)) { if (!shut(a, nx, a.y)) ny = a.y; else if (!shut(a, a.x, ny)) nx = a.x; else { nx = clamp(a.x + ((rnd() * 3) | 0) - 1, 0, N - 1); ny = clamp(a.y + ((rnd() * 3) | 0) - 1, 0, N - 1); if (shut(a, nx, ny)) return; } }
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
      const watched = prey.d.social === 'herd' && herdSize(prey) >= 2 ? (nearest(prey, 3, c => c.sp === prey.sp && (c.watch === S.tickNo - 1 || c.watch === S.tickNo)) ? 0.35 : 0.55) : 1;                 // many eyes
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
    // a camp full of people is given a wide berth by anything big enough to be noticed, unless hunger drives it in
    if (!threat && d.mass >= 1 && !a.held && S.popPeople >= 2 && a.e > 0.25 && cheb(a, S.tribe) <= 3) {
      const T = S.tribe; a.mood = 'afraid'; a.act = { k: 'flee', id: 0, alarm: 1 }; stepTo(a, a.x + ((a.x - T.x) || 1) * 3, a.y + ((a.y - T.y) || 1) * 3, d.speed); return;
    }
    if (threat) {
      a.mood = 'afraid'; a.act = { k: 'flee', id: threat.id, fx: threat.x, fy: threat.y };
      // the very young of animals without a hole do not run: they drop where they stand and lie still, if there is anything to lie in
      if (!h && a.age < d.mature * 0.5 && cheb(threat, a) > 1 && cover(I(a.x, a.y)) > 0.3) { a.hidden = true; a.act.k = 'hide'; return; }
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
      if (d.social === 'herd' && !S.night) {
        const here = I(a.x, a.y);
        // in the heat of the day a fed herd goes and lies in the shade
        if (a.e > 0.6 && tempAt(here) > 24 && tree[here] < 0.4) {
          let bj = -1, bd = 1e9; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = a.x + dx, y = a.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const j = I(x, y); if (water[j] || tree[j] < 0.4) continue; const dd = Math.hypot(dx, dy); if (dd < bd) { bd = dd; bj = j; } }
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
    const short = T.store < pop * 0.5 && T.kidsHungry && a.age >= 13;        // when there is little, the grown go short so the children eat
    if (a.e < (short ? 0.4 : 0.85) && T.store > 0.05 && dist <= 8) { const take = Math.min(T.store, 1 - a.e, 0.5); T.store -= take; a.e += take; }
    if (a.age < 6) { stepTo(a, T.x, T.y, 1); a.act = { k: S.night ? 'sleep' : a.age < 2 ? 'baby' : 'play' }; return; }
    if (S.night) {                                                       // nights are spent at the camp; one of the able sits up by the fire
      const hm = a.house && T.sites.find(q => q.id === a.house);      /* home is their own roof once they have one; the fire until then */
      stepTo(a, hm ? hm.x : T.x, hm ? hm.y : T.y, 4);
      const day = Math.floor(S.tickNo / (DAY || 1)); if (a.age >= WED && a.age <= 46 && a.e > 0.5 && T.watchDay !== day) { T.watchDay = day; T.watcher = a.id; }
      const onWatch = T.watcher === a.id && T.watchDay === day; a.act = { k: onWatch ? 'watch' : 'sleep' };
      const w = nearest(a, onWatch ? 3 : 1, b => !b.hidden && canTake(b, a)); if (w && a.e > 0.6 && rnd() < (onWatch ? 0.5 : 0.2) * TPY * dt) { die(w, 'killed by people', a.id); a.act = { k: 'guard', id: w.id }; }
      return;
    }
    // people fear what can eat them: the young run for the camp, one alone backs away; three together stand their ground
    const beast = nearest(a, 4, b => !b.hidden && canTake(b, a));
    if (beast) {
      let band = a.age >= d.mature ? 1 : 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = a.x + dx, y = a.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; for (const b of cells[I(x, y)]) if (b.alive && b !== a && b.sp === a.sp && b.age >= d.mature) band++; }
      if (a.age < d.mature || band < 3) { a.mood = 'afraid'; stepTo(a, dist > 1 ? T.x : a.x + (a.x - beast.x), dist > 1 ? T.y : a.y + (a.y - beast.y), 2); a.act = { k: 'flee', id: beast.id }; return; }
    }
    a.act = { k: 'idle' };
    const grown = a.age >= d.mature, old = a.age > 46, able = grown && !old;   // children help close to home; the old keep the camp
    if (a.grief > 0.55 && a.e > 0.45 && rnd() < 0.6) { stepTo(a, T.x, T.y, 2); a.act = { k: 'mourn' }; return; }   // the newly bereaved sit by the fire and do little
    // foul weather: with a roof, food in the store and nothing pressing, people stay in
    if (T.huts > 0 && a.e > 0.6 && T.store > pop * 1.1) {
      const ct = tempAt(I(T.x, T.y)); if (ct < d.comfort - 9 || (S.precip > 0 && ct >= 0 && ct < 5)) { stepTo(a, T.x, T.y, 3); a.act = { k: 'shelter' }; return; }
    }
    const adults = S.agents.filter(b => b.alive && b.sp === a.sp && b.age >= d.mature).length, campT = tempAt(I(T.x, T.y));
    // huts and firewood come out of the nearest trees
    // houses: a plot is chosen, timber is felled and carried to it, and the house goes up a stage at a time
    const trade = a.job && (a.job === 'builder' || a.job === 'woodcutter' || a.job === 'mason');
    if (able && rnd() < dt * 12 * a.skill.build * (!a.job ? 1 : trade ? 2.4 : 0.3) * (T.skills.tools ? 1.3 : 1) && construct(a)) practise(a, 'build');
    // a guard keeps to the camp and its edges, fed from the store, and goes for whatever comes hunting
    if (a.job === 'guard' && a.e > 0.4) {
      const w = nearest(a, 4, b => !b.hidden && !b.d.people && b.d.eats.meat && b.d.mass > 3);
      if (w) { stepTo(a, w.x, w.y, 2); if (cheb(w, a) <= 1 && rnd() < 0.5 * a.skill.hunt * TPY * dt) { die(w, 'killed by people', a.id); practise(a, 'hunt'); } a.act = { k: 'guard', id: w.id }; return; }
      if (dist > 4) stepTo(a, T.x, T.y, 2); else roam(a, 2, 1); a.act = { k: 'patrol' }; return;
    }
    if (T.skills.fire && campT < d.comfort - 3 && rnd() < dt * 8) { for (let k = 0; k < 20; k++) { const j = I(clamp(T.x + ((rnd() * 11) | 0) - 5, 0, N - 1), clamp(T.y + ((rnd() * 11) | 0) - 5, 0, N - 1)); if (tree[j] > 0.1) { tree[j] -= 0.03; T.fireT = S.t; a.wood = j; break; } } }
    // look for food: plants, fish, game. What is found is carried home and shared.
    const range = able ? 7 : old ? 5 : 4; let bestV = 0, bx = a.x, by = a.y, kind = '';
    for (let k = 0; k < 10; k++) {
      const x = clamp(T.x + ((rnd() * (2 * range + 1)) | 0) - range, 0, N - 1), y = clamp(T.y + ((rnd() * (2 * range + 1)) | 0) - range, 0, N - 1), j = I(x, y), dd = 1 / (1 + Math.max(Math.abs(x - T.x), Math.abs(y - T.y)) / 5);
      let v = 0, kd = '';
      if (water[j]) { if (T.skills.fish) { v = fish[j] * 1.1 * (tempAt(j) < -3 ? 0.65 : 1) * a.skill.fish * (a.job === 'fisher' ? 1.5 : 1); kd = 'fish'; } }
      else { v = (fruit[j] * 1.6 + grass[j] * 0.12 * (1 - snowBlock(j, d.mass))) * a.skill.gather * (a.job === 'gatherer' || a.job === 'farmer' ? 1.3 : 1); kd = 'plant'; }
      v *= dd; if (v > bestV) { bestV = v; bx = x; by = y; kind = kd; }
    }
    // the hunt: when the stores run low, the able go out together in the morning after the nearest big game.
    // One walks straight at it; the others swing wide and get beyond it, so that what runs from the first runs onto them.
    if (able && T.skills.hunt) {
      let P = T.party; if (P) { const q = S.byId.get(P.prey); if (!q || !q.alive || q.hidden || S.t > P.until || P.day !== Math.floor(S.tickNo / (DAY || 1))) P = T.party = null; }
      if (!P && T.store < pop * 1.2 && adults >= 2 && (!a.job || a.job === 'hunter') && S.t > (T.noHunt || 0) && (!DAY || S.tickNo % DAY === 0)) {
        const q = nearest({ x: T.x, y: T.y }, 7, b => !b.d.people && !b.tame && !b.hidden && bodyOf(b) >= 1 && canTake(a, b) && !(b.d.eats.meat && b.d.mass > d.mass * 0.5));
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
          if (rnd() < p) { die(q, 'hunted', a.id); T.store += gm * 0.9; T.got.hunt += gm * 0.9;
            { const orphan = S.agents.find(b => b.alive && b.mom === q.id && !b.d.people && b.age < b.d.mature * 0.6 && cheb(b, q) <= 3);   /* the young one left standing by its dead mother is carried home */
              if (orphan) { orphan.tame = true; orphan.fear = 0; orphan.x = T.x; orphan.y = T.y; if (!T.skills.herd) { T.skills.herd = true; tell('The hunters brought a fawn home alive, its mother dead. The children will not let it be eaten.'); } } } a.act = { k: 'hunt', id: q.id, kill: 1, x: q.x, y: q.y, party: k + 1 }; T.party = null; T.hunts = (T.hunts || 0) + 1; }
        }
        return;
      }
    }
    // small game met by chance while out: anything small enough that is not itself a hunter of people-sized things
    const game = T.skills.hunt && T.store < pop * 1.2 ? nearest(a, 5, b => !b.d.people && !b.tame && !b.hidden && canTake(a, b) && !(b.d.eats.meat && b.d.mass > d.mass * 0.5) && rnd() > cover(I(b.x, b.y)) * 1.25 + (bodyOf(b) < 1 ? 0.4 : 0.15)) : null;
    if (game && able && rnd() < 0.3) {
      if (a.act.k === 'idle') a.act = { k: 'hunt', id: game.id };
      stepTo(a, game.x, game.y, 2);
      if (cheb(game, a) <= 1) { const gm = bodyOf(game), helpers = Math.min(3, adults - 1), p = (gm < 1 ? 0.22 : (0.07 + 0.05 * helpers) * Math.min(1, 4.5 / gm)) * (1 - 0.5 * cover(I(game.x, game.y))) * TPY * dt * S.dayK; if (rnd() < p) { die(game, 'hunted', a.id); T.store += gm * 0.9; a.act = { k: 'hunt', id: game.id, kill: 1, x: game.x, y: game.y }; } }
      return;
    }
    if (kind) {
      const j = I(bx, by), eff = TPY * dt * S.dayK / (1 + Math.max(Math.abs(bx - T.x), Math.abs(by - T.y)) / 6) / (1 + tree[j] * tree[j] * 1.2);
      walk(T.x, T.y, bx, by, 0.03);
      if (kind === 'fish') { const take = Math.min(fish[j] * 0.5, 0.31 * eff * a.skill.fish * (a.job === 'fisher' ? 1.3 : 1)) * (tempAt(j) < -3 ? 0.65 : 1); practise(a, 'fish'); fish[j] -= take; T.store += take * 1.5; T.got.fish += take * 1.5; T.eff.fish++; if (a.act.k === 'idle') a.act = { k: 'fish', x: bx, y: by, got: take }; }
      else { practise(a, 'gather'); const tf = Math.min(fruit[j], 0.24 * eff * a.skill.gather * (a.job === 'gatherer' ? 1.3 : 1)); fruit[j] -= tf; const tg = Math.min(grass[j] * 0.3, 0.08 * eff) * (1 - snowBlock(j, d.mass)); grass[j] -= tg; T.store += tf * 1.6 + tg * 0.5; T.got.gather += tf * 1.6 + tg * 0.5; T.eff.gather++; if (a.act.k === 'idle') a.act = { k: 'gather', x: bx, y: by, fruit: tf > 0.01 ? 1 : 0, got: tf * 1.6 + tg * 0.5 }; }
      if (rnd() < 0.5) { a.x = bx; a.y = by; } else { a.x = clamp(T.x + ((rnd() * 5) | 0) - 2, 0, N - 1); a.y = clamp(T.y + ((rnd() * 5) | 0) - 2, 0, N - 1); }
      if (water[I(a.x, a.y)]) { a.x = T.x; a.y = T.y; }
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
  const raised = q => q.stage >= DWELL[q.kind].stages;
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
    const homes = T.sites.filter(q => q.kind !== 'well'), r = Math.min(5, 1 + Math.ceil(Math.sqrt(T.sites.length + 1) * 0.6));
    let bestI = -1, bs = -1e9;
    for (let m = -r; m < r; m++) for (let k = -r; k < r; k++) {
      const x = T.x + k * PITCH + 2, y = T.y + m * PITCH + 2; if (x < 2 || y < 2 || x >= N - 2 || y >= N - 2) continue;   // the middle of each lot
      const i = I(x, y), dc = Math.hypot(x - T.x, y - T.y); if (water[i]) continue;
      if (T.sites.some(q => q.x === x && q.y === y)) continue;                                                // one roof to a lot, for now
      if (T.wall && T.wall.cells.includes(i)) continue;
      let wet = 0, timber = 0, crops = 0, way = 0;
      for (let ny = -1; ny <= 1; ny++) for (let nx = -1; nx <= 1; nx++) { const j = I(x + nx, y + ny); if (water[j]) wet++; timber += tree[j]; crops += field[j]; }
      if (wet > 2) continue;                                                                                  // not enough dry ground to stand a roof on
      for (const [ax, ay] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) way = Math.max(way, tread[I(clamp(x + ax, 0, N - 1), clamp(y + ay, 0, N - 1))]);
      let sc = rnd() * 0.3 - timber * 0.25 - rock[i] * 2 - Math.max(0, soil[i] - 0.9) * 3 - crops * 0.4 - wet * 0.5;
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
    if (bestI < 0) return null;
    const s = { id: S.nextId++, x: bestI % N, y: (bestI / N) | 0, kind, stage: 0, wood: 0, stone: 0, was: '', lake: !well && kind !== 'tent' && T.floodSeen && bank[bestI] > 0.5 }; T.sites.push(s);
    for (let ny = -1; ny <= 1; ny++) for (let nx = -1; nx <= 1; nx++) { const j = I(s.x + nx, s.y + ny); if (water[j]) continue; field[j] = 0; if (tree[j] > 0.05) { T.wood += tree[j] * 3; tree[j] = nx || ny ? Math.min(tree[j], 0.05) : 0; } }   /* the lot is cleared; what stood on it is the first timber */
    grass[bestI] = Math.min(grass[bestI], 0.08); fruit[bestI] = 0;
    return s;
  }
  function plotFor() {
    const T = S.tribe; let s = T.sites.find(q => !raised(q)); if (s) return s;          // finish what is begun
    const homes = T.sites.filter(q => q.kind !== 'well');
    if (homes.length < households()) {                                                  // a household without a roof
      const who = folk().find(a => a.age >= WED && !a.house && (!a.partner || a.fem));
      return choosePlot(best(), who);
    }
    if (T.wall && !T.wall.done) return T.wall;                                          // the fence, once begun, before comforts
    if (T.store < S.popPeople * 1.0) return null;                                       // the rest is for when there is food enough to spare the hands
    if (T.skills.well && !T.sites.some(q => q.kind === 'well')) return choosePlot('well', null);
    s = homes.find(q => NEXT[q.kind] && T.skills[NEXT[q.kind]]);                        // something better is known: rebuild, oldest first
    if (s) { s.was = s.kind; s.kind = NEXT[s.kind]; s.stage = 0; s.wood = 0; s.stone = 0; s.lake = T.floodSeen && bank[I(s.x, s.y)] > 0.5; return s; }
    return null;
  }
  // with a cart and a beast to draw it, one trip brings what took two
  function cartload(j) {
    const T = S.tribe; if (!T.carts) return 1;
    const dr = S.agents.find(b => b.alive && b.tame && b.age >= b.d.mature * 0.75 && !(b.cart >= S.tickNo)); if (!dr) return 1;
    dr.cart = S.tickNo; dr.cartJ = j; return 2;
  }
  function construct(a) {
    const T = S.tribe, s = plotFor(); if (!s) return false;
    if (s === T.wall) {                                               // stakes cut, carried and driven, a few paces of fence at a time
      if (T.wood < 1) { let bj = -1, bd = 1e9; for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) { const x = T.x + dx, y = T.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const j = I(x, y); if (tree[j] < 0.3) continue; const dd = Math.hypot(dx, dy) + rnd() * 1.5; if (dd < bd) { bd = dd; bj = j; } }
        if (bj < 0) return false; tree[bj] -= Math.min(tree[bj], 0.16); T.wood += (2 + (a.job === 'woodcutter' ? 1 : 0) + (T.skills.tools ? 1 : 0)) * cartload(bj); a.act = { k: 'chop', j: bj, site: 0 }; return true; }
      T.wood -= 1; const at = s.cells[Math.min(s.cells.length - 1, s.n)]; s.n = Math.min(s.cells.length, s.n + 4); a.act = { k: 'fence', j: at };
      if (s.n >= s.cells.length) { s.done = true; T.fence = new Uint8Array(N * N); for (const c of s.cells) T.fence[c] = 1; tell(s.grown ? 'The fence has been carried out round the new houses.' : 'The fence is closed. Nothing on four legs comes in now unless it is led.'); }
      return true;
    }
    const K = DWELL[s.kind], needW = (s.stage + 1) * K.wood + (s.lake ? 2 : 0), needS = (s.stage + 1) * K.stone;   // what must lie on the plot before the next stage; posts for a house over water
    if (s.wood < needW) {
      if (T.wood >= 1) { const c = Math.min(T.wood, needW - s.wood); T.wood -= c; s.wood += c; a.act = { k: 'haul', site: s.id, item: 'log' }; walk(T.x, T.y, s.x, s.y, 0.12); return true; }
      let bj = -1, bd = 1e9;                                        // fell the nearest standing timber; saplings are left to grow
      for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) { const x = s.x + dx, y = s.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const j = I(x, y); if (tree[j] < 0.3) continue; const dd = Math.hypot(dx, dy) + rnd() * 1.5; if (dd < bd) { bd = dd; bj = j; } }
      if (bj < 0) return false;
      tree[bj] -= Math.min(tree[bj], 0.16); T.wood += (2 + (a.job === 'woodcutter' ? 1 : 0) + (T.skills.tools ? 1 : 0)) * cartload(bj); a.act = { k: 'chop', j: bj, site: s.id }; walk(s.x, s.y, bj % N, (bj / N) | 0, T.carts ? 0.2 : 0.1); if (!T.carts) T.need.toil += 0.12; return true;
    }
    if (s.stone < needS) {
      if (T.stone >= 1) { const c = Math.min(T.stone, needS - s.stone); T.stone -= c; s.stone += c; a.act = { k: 'haul', site: s.id, item: 'stone' }; return true; }
      let bj = -1, bd = 1e9, got = 2;                               // break stone where it shows; failing that, carry cobbles up from the water's edge
      for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) { const x = s.x + dx, y = s.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const j = I(x, y); if (rock[j] < 0.15) continue; const dd = Math.hypot(dx, dy); if (dd < bd) { bd = dd; bj = j; } }
      if (bj < 0) { got = 1; for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) { const x = s.x + dx, y = s.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const j = I(x, y); if (water[j] || bank[j] < 0.75) continue; const dd = Math.hypot(dx, dy); if (dd < bd) { bd = dd; bj = j; } } }
      if (bj < 0) return false;
      T.stone += (got + (a.job === 'mason' ? 1 : 0) + (T.skills.tools ? 1 : 0)) * cartload(bj); a.act = { k: 'quarry', j: bj, site: s.id }; walk(s.x, s.y, bj % N, (bj / N) | 0, T.carts ? 0.2 : 0.1); T.stoneWork++; if (!T.carts) T.need.toil += 0.16;
      return true;
    }
    s.stage++; a.act = { k: 'build', site: s.id, stage: s.stage };
    if (raised(s)) {
      const first = !T.sites.some(q => q !== s && q.kind === s.kind && raised(q)), rebuilt = s.was; s.was = '';
      if (s.kind === 'well') { T.well = true; tell('The people have dug a well. The fields need not wait for rain.'); }
      else if (first) tell({ tent: 'A tent of hides is up: the first roof in the valley.', hut: 'The first hut stands, timber and thatch.', house: 'The first true house stands, timber on a footing of stone.' }[s.kind] + (s.lake ? ' It stands on posts at the water\'s edge.' : ''));
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
    const cells = []; for (let x = x0; x <= x1; x++) { cells.push(I(x, y0)); } for (let y = y0 + 1; y <= y1; y++) cells.push(I(x1, y)); for (let x = x1 - 1; x >= x0; x--) cells.push(I(x, y1)); for (let y = y1 - 1; y > y0; y--) cells.push(I(x0, y));
    T.wall = { x0, y0, x1, y1, cells: cells.filter(c => !water[c]), n: 0, done: false, grown: !!old }; T.fence = null;
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
    T.threat *= 0.8; T.plenty = T.plenty * 0.6 + 0.4 * (T.store / P.length);
    if (T.skills.palisade && (T.wall || T.threat >= 2)) planWall();
    const able = P.filter(a => a.age >= 13 && a.age <= 46), n = able.length; for (const a of P) if (a.age > 46 || a.age < 13) a.job = '';
    const spare = Math.floor(n * clamp((T.plenty - 0.7) / 4, 0, 0.45));           // hands the food supply can free from getting food
    if (n < 3 || (spare < 1 && !able.some(a => a.job))) { for (const a of able) a.job = ''; return; }
    const N_ = T.need, unroofed = Math.max(0, households() - T.sites.filter(q => q.kind !== 'well').length), work = T.sites.some(q => !raised(q)) || (T.wall && !T.wall.done) || unroofed > 0;
    // wants, strongest first, each asking for hands
    const asks = [['guard', T.threat >= 1.5 ? Math.max(1, Math.round(T.threat / 4)) : 0, T.threat], ['builder', work ? 1 + Math.round(unroofed / 2) : 0, 1 + N_.crowd + N_.cold],
      ['woodcutter', work && n >= 5 ? 1 : 0, N_.toil], ['mason', work && T.skills.house ? 1 : 0, N_.toil * 0.8], ['herder', S.agents.some(b => b.alive && b.tame) ? 1 : 0, 0.5]].sort((p, q) => q[2] - p[2]);
    const want = {}; let left = spare; for (const [job, k] of asks) { want[job] = Math.min(k, left); left -= want[job]; }
    // food work: people turn to whatever they have seen bring most home for a day's work. What has not been tried is given
    // a fair chance, and nothing is ever given up entirely, since a bad year for one thing is a good year for another.
    { const KEY = { farmer: 'farm', fisher: 'fish', hunter: 'hunt', gatherer: 'gather' }, R = T.rate;
      for (const k in T.got) { if (T.eff[k] > 0) { const now = T.got[k] / T.eff[k]; R[k] = R[k] === undefined ? now : R[k] * 0.5 + now * 0.5; } T.got[k] = 0; T.eff[k] = 0; }
      const kinds = ['farmer', 'fisher', 'hunter', 'gatherer'].filter(k => k !== 'farmer' || T.skills.farm), seen = kinds.map(k => R[KEY[k]]).filter(v => v !== undefined), mean = seen.length ? seen.reduce((p, q) => p + q, 0) / seen.length : 1;
      const w = kinds.map(k => Math.max(0.2 * mean, R[KEY[k]] === undefined ? mean : R[KEY[k]]) + (k === 'farmer' ? N_.hunger * mean : 0)), tot = w.reduce((p, q) => p + q, 0) || 1, nFood = Math.max(0, n - (spare - left));
      kinds.forEach((k, q) => { want[k] = spare >= 1 ? Math.round(nFood * w[q] / tot) : 0; }); if (spare >= 1) want.gatherer = n; }
    const have = {}; for (const a of able) { if (a.job && (have[a.job] || 0) < (want[a.job] || 0)) have[a.job] = (have[a.job] || 0) + 1; else a.job = ''; }
    for (const job of ['guard', 'builder', 'woodcutter', 'mason', 'herder', 'farmer', 'hunter', 'fisher', 'gatherer']) {
      while ((have[job] || 0) < (want[job] || 0)) {
        const free = able.filter(a => !a.job); if (!free.length) break;
        const pick = free.reduce((b, a) => a.skill[JOBS[job]] > b.skill[JOBS[job]] ? a : b); pick.job = job; have[job] = (have[job] || 0) + 1;
        T.trades = T.trades || {}; if (!T.trades[job] && job !== 'gatherer') { T.trades[job] = true; tell(pick.name + { farmer: ' has given all ' + (pick.fem ? 'her' : 'his') + ' days to the fields: the first farmer.', hunter: ' leads the hunt now, and does little else.', fisher: ' is at the water every day: the first to live by fishing.', builder: ' has become a builder: there are families without a roof.', woodcutter: ' fells timber for the whole place now.', mason: ' has taken up stone: the first mason.', herder: ' minds the tame deer.', guard: ' keeps watch with a spear by day as well as by night. The wolves have been in too often.' }[job]); }
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
    plough:     { need: 'hunger', at: 0.3, can: T => T.skills.farm && tameGrown(), say: 'Plough. Still not enough from the fields, and a tame beast standing idle: now it drags a share through the ground.' },
    pottery:    { need: 'spoil',  at: 1.0, can: T => T.skills.fire, say: 'Pottery. Too much lost to damp and mice. Clay hardened by the fire keeps food dry.' },
    granary:    { need: 'spoil',  at: 1.6, can: T => T.skills.farm && T.skills.pottery && (made(T, 'hut') || made(T, 'house')), say: 'Granary. Harvests rotting in a corner: the people have raised a store off the ground.' },
    well:       { need: 'water',  at: 0.45, can: T => T.huts > 0, say: 'So many buckets carried so far. The people mean to dig a well.' },
    irrigation: { need: 'water',  at: 1.0, can: T => T.skills.farm && T.well, say: 'Irrigation. Crops lost to dry weeks with water standing in the well: now it runs to the fields in ditches.' },
    palisade:   { need: 'danger', at: 2.0, can: T => T.skills.hut, say: 'Palisade. Wolves among the houses once too often: stakes can be set close enough to stop them.' },
    wheel:      { need: 'toil',   at: 0.5, can: () => tameGrown(), say: 'Every log carried on a shoulder, and a tame beast with nothing to pull. The people have built a cart.' },
    tools:      { need: 'toil',   at: 0.7, can: T => T.skills.fire && T.stoneWork >= 8, say: 'Tools. Among the broken stone, some that ran bright in the fire: an axe that bites, a chisel that cuts.' },
    medicine:   { need: 'loss',   at: 2.0, can: () => folk().some(a => a.skill.gather > 1.2), say: 'Medicine. Too many buried. Those who know plants have learned which ones help.' },
    writing:    { need: 'reckon', at: 2.5, can: T => T.store > S.popPeople, say: 'Writing. Too many households and too much in the store to hold in one head: marks are made for what is owed.' },
    concrete:   { need: 'flood',  at: 3.0, can: T => T.skills.masonry && T.skills.fire, say: 'Concrete. The river took the houses again. Burnt lime, sand and stone set like rock, and stay.' }
  };
  function reckonYear() {
    const T = S.tribe, N_ = T.need; if (!S.popPeople) return;
    // wants that are only seen over a year
    N_.crowd += Math.max(0, households() - T.sites.filter(q => q.kind !== 'well').length);
    if (T.waterDist === undefined) { let bd = 99; for (let i = 0; i < N * N; i++) if (water[i]) { const dd = Math.hypot((i % N) - T.x, ((i / N) | 0) - T.y); if (dd < bd) { bd = dd; T.waterAt = i; } } T.waterDist = bd; }
    // a way is a way once it is worn deep; it stays one until it has all but grown over. Whatever grew on it is cut back.
    for (let i = 0; i < N * N; i++) { const on = onWay(i % N, (i / N) | 0) && tread[i] > (T.road[i] ? 0.25 : 0.7) && !water[i]; if (on && !T.road[i] && tree[i] > 0) { T.wood += tree[i] * 3; tree[i] = 0; } T.road[i] = on ? 1 : 0; if (on) field[i] = 0; }
    N_.water += Math.max(0, T.waterDist - 2) * 0.12 * Math.min(4, S.popPeople / 5) * (T.well ? 0.2 : 1);   // every bucket, carried that far, for every mouth
    N_.reckon += Math.max(0, households() - 3) * 0.12 * (T.skills.writing ? 0 : 1);
    N_.danger = T.threat;
    if (!opt.noIdeas) for (const k in IDEAS) { const d = IDEAS[k]; if (T.skills[k] || N_[d.need] < d.at || !d.can(T)) continue; T.skills[k] = true; if (d.need !== 'danger') N_[d.need] *= 0.5; tell(d.say); break; }   // one thing at a time; an answer eases the want
    for (const k in N_) if (k !== 'danger') N_[k] *= 0.85;                                 // what is no longer felt is forgotten
    // names for what the place has become: said, never used to decide anything
    const homes = T.sites.filter(live), houses = homes.filter(q => q.kind === 'house' && raised(q)).length;
    const lvl = houses >= 8 && S.popPeople >= 30 ? 3 : houses >= 2 && T.well ? 2 : homes.some(q => (q.was || q.kind) !== 'tent') ? 1 : 0;
    if (lvl > T.level) tell(['', 'The camp has become a hamlet, strung along a beaten track.', 'The hamlet has become a village.', 'The village has become a town.'][lvl]); T.level = lvl;
    const beasts = S.agents.filter(b => b.alive && b.tame && b.age >= b.d.mature * 0.75).length;
    T.carts = T.skills.wheel ? Math.min(1 + Math.floor(T.need.toil), Math.max(1, beasts), beasts) : 0;
    const pave = T.skills.masonry ? 3 : T.carts ? 2 : 1; if (pave > T.pave) tell(pave === 3 ? 'With masons in the place, the streets are being set with stone.' : 'Cart wheels cut the track to mud: the people are laying gravel.'); T.pave = Math.max(T.pave, pave);
  }
  // Fields: sown once the ground is warm, reaped when the crop has had its warmth, or in a hurry when frost comes.
  function farm(dt) {
    const T = S.tribe, pop = S.popPeople; if (!T.skills.farm || !pop) return;
    const ct = tempAt(I(T.x, T.y));
    if (!T.sown && ct > 4 && (T.lastCampT === undefined || ct > T.lastCampT)) {
      const want = Math.round(pop * 1.6), r = Math.min(14, 3 + Math.sqrt(pop)); let have = 0; const cand = [];
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = T.x + Math.round(dx), y = T.y + Math.round(dy); if (x < 0 || y < 0 || x >= N || y >= N) continue; const i = I(x, y); if (water[i] || onWay(x, y) || T.sites.some(q => Math.abs(q.x - x) <= 1 && Math.abs(q.y - y) <= 1)) continue; if (field[i]) have++; else cand.push(i); }
      cand.sort((a, b) => fert[b] - tree[b] * 0.5 - (fert[a] - tree[a] * 0.5));
      for (let k = 0; k < cand.length && have < want; k++) { field[cand[k]] = 1; tree[cand[k]] = 0; grass[cand[k]] = Math.max(grass[cand[k]], 0.15); have++; }
      T.fields = have; T.sown = true; T.cropWarm = 0;
    }
    if (T.sown) {
      T.cropWarm += Math.max(0, ct) * dt;
      const ripe = T.cropWarm > 5.6, frost = ct < 0;
      if (ripe || frost) { { let dry = 0, nf = 0; for (let i = 0; i < N * N; i++) if (field[i]) { nf++; if (soil[i] < 0.32) dry++; } if (nf && dry / nf > 0.3) T.need.water += 1.5; } let got = 0; for (let i = 0; i < N * N; i++) if (field[i]) { if (!flood[i]) got += Math.max(0, grass[i] - 0.1) * 2.6 * (ripe ? 1 : 0.5); grass[i] = Math.min(grass[i], 0.1); } if (T.carts) got *= 1.3; if (T.skills.plough && S.agents.some(b => b.alive && b.tame)) got *= 1.4; { const f = folk().filter(b => b.job === 'farmer').length; if (f) got *= Math.min(1.5, 0.85 + 0.13 * f); } T.store += got; T.lastHarvest = got; T.got.farm += got; T.eff.farm += Math.max(4, folk().filter(b => b.job === 'farmer').length * TPY * 0.5); T.sown = false; T.resting = true; }
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
    { const roofed = T.sites.some(q => live(q) && (q.was || q.kind) !== 'tent'), lost = T.store * 0.35 * (roofed ? 0.75 : 1) * (T.skills.pottery ? 0.7 : 1) * (T.skills.granary ? 0.55 : 1) * dt; T.store = Math.max(0, T.store - lost); if (S.popPeople) T.need.spoil += lost / S.popPeople; }   /* what rots is seen rotting */
    if (flood[campI]) { T.store *= 1 - Math.min(1, 2.5 * dt); T.need.flood += dt * 2; }
    for (const w of T.sites) if (live(w) && flood[I(w.x, w.y)] && !w.lake && !(T.skills.concrete && w.kind === 'house' && !w.was) && rnd() < 3 * dt) {
      T.need.flood += 3; tell('The flood has taken a ' + (w.was || w.kind) + '.' + (T.floodSeen ? '' : ' Nobody will build so low again without thinking.')); T.floodSeen = true; w.was = ''; w.stage = 0; w.wood = 0; w.stone = 0; }
    if (!T.skills.fire && S.popPeople) { for (let dy = -6; dy <= 6 && !T.skills.fire; dy++) for (let dx = -6; dx <= 6; dx++) { const x = T.x + dx, y = T.y + dy; if (x >= 0 && y >= 0 && x < N && y < N && burn[I(x, y)] > 0) { T.skills.fire = true; S.log.push({ t: S.t, text: 'The people have taken fire for themselves.' }); break; } } }
    farm(dt); society(dt);
    { const lv = T.sites.filter(live); T.huts = lv.length; T.roof = lv.length ? lv.reduce((q, w) => q + DWELL[w.was || w.kind].roof, 0) / lv.length - (T.skills.masonry ? 0.05 : 0) : 0.7; if (S.tickNo % TPY === 3) { reckonYear(); townLife(); } }
    if (T.well && S.popPeople) for (let i = 0; i < N * N; i++) if (field[i] && soil[i] < (T.skills.irrigation ? 0.7 : 0.45)) soil[i] = T.skills.irrigation ? 0.7 : 0.45;   // carried from the well, a bucket at a time
    for (const a of S.agents) {
      if (!a.alive) continue; const d = a.d, i = I(a.x, a.y), Tc = tempAt(i); if (a.fear > 0) a.fear -= dt * 1.4;
      if (S.popPeople && !d.people && d.eats.meat && d.mass > 3 && cheb(a, T) <= 4 && !a.hidden) T.threat += dt * 3; /* a hunter in among the houses is remembered */ a.age += dt; a.cd -= dt; a.mood = ''; a.act = null; const wasHidden = a.hidden; a.hidden = false;
      // --- warmth: a body loses heat to cold air, faster when wet, slower under cover
      let shelter = tree[i] > 0.4 ? 0.6 : 1;
      if (wasHidden) shelter *= 0.4;
      if (d.people) { const hm = a.house && T.sites.find(q => q.id === a.house), home = Math.max(Math.abs(a.x - T.x), Math.abs(a.y - T.y)) <= 2 || (!!hm && Math.max(Math.abs(a.x - hm.x), Math.abs(a.y - hm.y)) <= 1); shelter = home ? (T.huts * 4 >= S.pop[a.sp] ? T.roof : 0.7) * (T.skills.fire && S.t - (T.fireT || -9) < 0.1 ? 0.5 : 1) : 1; }
      const soaked = S.precip > 0 && Tc >= 0 && shelter > 0.5 ? 1.5 : 1;         // cold rain is worse than dry cold
      if (d.people && a.e < 0.35) T.need.hunger += dt / S.popPeople;   /* wants are what one person feels, on average: a big camp is not colder than a small one */
      const cold = Math.max(0, d.comfort - Tc) * d.chill * shelter * soaked, hot = Tc > 32 ? (Tc - 32) * 0.08 : 0;
      if (d.people && cold > 0.1) T.need.cold += cold * dt / S.popPeople;
      const asleep = d.sleepsBelow !== undefined && Tc < d.sleepsBelow;                    // some bodies sleep the cold away
      a.e -= d.metab * dt / (d.people && a.age < 10 ? 2.5 : 1) * (asleep ? 0.12 : 1 + cold + hot);
      if (cold > 0.4) a.mood = 'cold'; else if (hot > 0.2) a.mood = 'hot';
      if (a.age > a.life * (d.people && T.skills.medicine ? 1.15 : 1)) { die(a, 'old age'); continue; }
      if (flood[i]) { a.e -= 1.2 * dt; if (rnd() < 0.6 * dt) { die(a, 'drowned'); continue; } roam(a, 3, 2); }
      if (burn[i] > 0) { if (rnd() < 0.5) { die(a, 'burned'); continue; } a.e -= 0.1; roam(a, 3, 3); }
      const e0 = a.e;
      if (asleep) a.mood = 'asleep'; else if (a.held) a.mood = 'afraid'; else if (d.people) person(a, d, dt); else animal(a, d, dt);
      if (!a.mood) a.mood = a.e < 0.3 ? 'hungry' : a.e > e0 + 0.02 ? 'fed' : '';
      if (a.alive && a.e <= 0) { die(a, Tc < d.comfort ? 'cold and hunger' : 'hunger'); continue; }
      // --- young are born to a well-fed mother when the air is warm enough for them
      if (a.alive && a.age >= d.mature && a.cd <= 0 && a.e > d.breedE && Tc >= d.warmBreed && (lengthening || sunH >= (d.lateLight || 0))) {
        if (d.people) { if (!a.fem || a.age < WED || a.age > 42 || T.store < 1.1 * S.pop[a.sp] + 1) continue; const q = S.byId.get(a.partner); if (!q || !q.alive || cheb(q, a) > 3) continue; if (childrenOf(a).filter(c => c.age < 9).length >= 3) continue; }   // a household can carry only so many small children at once
        else {
          if (!nearest(a, 7, b => b.sp === a.sp && b.age >= d.mature)) continue;
          if (d.territory) { let c = 0; for (const b of S.agents) if (b.alive && b.sp === a.sp && cheb(b, a) <= d.territory * 2) c++; if (c > d.territory) continue; }
        }
        const n = d.litter[0] + ((rnd() * (d.litter[1] - d.litter[0] + 1)) | 0); a.e -= 0.25 + 0.08 * n; a.cd = d.interval * (d.people ? 0.85 : 1) * R(0.85, 1.2);
        for (let k = 0; k < n; k++) born.push([a.sp, a.x, a.y, a.home, a.id]);
      }
    }
    for (const b of born) { const c = add(b[0], b[1], b[2], 0, 0.55); c.mom = b[4]; { const mm = S.byId.get(b[4]); if (mm && mm.tame) c.tame = true; } if (c.d.people) { const m = S.byId.get(b[4]), f = m && S.byId.get(m.partner); c.dad = f ? f.id : 0; if (m) { c.looks.skin = (f && rnd() < 0.5 ? f : m).looks.skin; c.looks.hair = (f && rnd() < 0.5 ? f : m).looks.hair; } for (const k of CRAFTS) c.skill[k] = clamp(((m ? m.skill[k] : 1) + (f ? f.skill[k] : 1)) / 2 * 0.3 + R(0.6, 0.8), 0.6, 1.2); if (m) tell(m.name + (f ? ' and ' + f.name : '') + ' have a ' + (c.fem ? 'daughter' : 'son') + ', ' + c.name + '.'); } if (b[3] && S.homes.has(b[3])) c.home = b[3]; S.fx.push({ kind: 'birth', sp: b[0], x: c.x, y: c.y, id: c.id, mom: b[4] }); if (SP[b[0]].people) T.born++; }
    if (S.fx.length > 200) S.fx.splice(0, S.fx.length - 200);
    // an empty valley does not stay empty of people for ever: after a few years, strangers find it
    if (opt.resettle) { if (S.popPeople) S.emptyT = 0; else { S.emptyT += dt; if (S.emptyT > 3) { S.emptyT = 0; T.store = 5; T.huts = 0; T.wood = 0; T.stone = 0; T.sites = []; T.well = false; T.roofT = 0; T.level = 0; T.carts = 0; T.threat = 0; for (const k in T.need) T.need[k] = 0; T.plenty = 1; T.pave = 1; T.stoneWork = 0; T.floodSeen = false; T.rate = {}; tread.fill(0); T.wall = null; T.fence = null; T.streets = null; T.road = new Uint8Array(N * N); for (const k in SKILLS) T.skills[k] = SKILLS[k].known; for (const k in TECHS) T.skills[k] = false; T.sown = false; T.resting = false; for (const sp in SP) if (SP[sp].people) for (let k = 0; k < 2; k++) { const c = add(sp, T.x, T.y, 18 + k * 2, 1); S.fx.push({ kind: 'arrive', id: c.id, x: c.x, y: c.y }); } S.fx.push({ kind: 'settlers', x: T.x, y: T.y }); S.log.push({ t: S.t, text: 'Two strangers have come over the hills.' }); } } }
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
  return { S, N, TPY, tick, G, stats, tread, PITCH, onWay, TECHS, IDEAS, ideas: () => Object.keys(IDEAS).map(k => ({ k, need: IDEAS[k].need, at: IDEAS[k].at, known: !!S.tribe.skills[k], can: !S.tribe.skills[k] && !!IDEAS[k].can(S.tribe) })), describe, craftOf, households, rock, land: landKind, LANDS, DWELL, SPECIES: SP, SKILLS, tempAt, sunHeight, daysLengthen, warmSum, fert, cells, moveTo(a, x, y) { const p = free(x, y); a.x = p[0]; a.y = p[1]; }, grass, tree, water, fruit, fish, flood, field, soil, snow, heat, burn, bank, add, bodyOf, canTake };
}
root.Eden = { create, SPECIES, SKILLS, TECHS, JOBS };
})(typeof window !== 'undefined' ? window : globalThis);
