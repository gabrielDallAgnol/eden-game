// Eden view: an isometric valley painted from the engine's state.
// The engine decides what happens in each step of time (about half a month). This view turns every step into a
// stretch of visible life: people walk out, pick, fish, carry and build, children play, babies ride on hips;
// animals graze in little hops, rest together, follow their mothers, flee and hunt. Whatever changes in the
// world grows, fades, melts or crossfades into its new state; nothing pops in or out.
(function () {
const TW = 64, TH = 32, CLIFF = 46, TICK_MS = 20000, DAY = 4, TS = TICK_MS / 1000;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t, ease = k => k * k * (3 - 2 * k);
const SMALL = 4;   /* small children (the tot sprite) until this age; grown at the species' mature age (8 for people) */
const qs = new URLSearchParams(location.search), seed = +(qs.get('seed') || 1 + Math.floor(Math.random() * 9999));
let landKept = ''; try { landKept = localStorage.getItem('eden.land') || ''; } catch (e) { /* no storage: the address decides */ }
const landQ = qs.get('land') || landKept || 'valley';
/* a saved valley is taken up again when the opening card's Continue was pressed (or ?continue=1); otherwise a new one is made */
let saved = null;
try {
  if (qs.get('continue') === '1' || sessionStorage.getItem('eden.continue')) {
    saved = localStorage.getItem('eden.save');
    sessionStorage.removeItem('eden.continue');
  }
} catch (e) { /* no storage */ }
let loaded = null; if (saved) { try { loaded = Eden.load(saved); } catch (e) { console.warn('the saved valley could not be loaded; starting a new one', e); } }
const sizeQ = clamp(+(qs.get('size') || 96), 24, 160);   /* the map, in tiles a side */
const W = loaded || Eden.create(seed, { resettle: true, startT: 0.3, dayCycle: DAY, family: true, land: landQ, size: sizeQ }), N = W.N, S = W.S, A = EdenArt.build();
const OX = N * TW / 2, OY = 170, WW = N * TW, WH = OY + N * TH + CLIFF + 30;
const isoX = (x, y) => (x - y) * (TW / 2) + OX, isoY = (x, y) => (x + y) * (TH / 2) + OY;
const cellAt = (wx, wy) => { const u = (wx - OX) / (TW / 2), v = (wy - OY) / (TH / 2); return { x: (u + v) / 2, y: (v - u) / 2 }; };
const cv = document.getElementById('cv'), cx = cv.getContext('2d');
let dpr = 1, cam = { x: 0, y: 0, z: 2 }, speed = 1, paused = true, tool = 'hand', tickFrac = 0, now = 0, gameMs = 0;
const hash = (a, b) => { let n = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
let rs = seed * 31 + 7; const rnd = () => { rs = (Math.imul(rs, 1103515245) + 12345) & 0x7fffffff; return rs / 0x7fffffff; }, R = (a, b) => a + rnd() * (b - a);
/* water can be crossed on a bridge and nowhere else */
const crossing = new Uint8Array(N * N);
function syncCrossings() { crossing.fill(0); const T = S.tribe; for (const f of W.fords()) if (T.bridged[f.key]) for (const t of f.tiles) crossing[t] = 1; }
const isWater = (x, y) => { const xi = x | 0, yi = y | 0; return xi < 0 || yi < 0 || xi >= N || yi >= N || (W.water[yi * N + xi] === 1 && !crossing[yi * N + xi]); };
const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ================================================================== the camp's fixed places
const T0 = S.tribe, camp = { x: T0.x + 0.5, y: T0.y + 0.5 };
const fire = { x: camp.x + 0.55, y: camp.y + 0.15 }, store = { x: camp.x - 0.45, y: camp.y + 0.35 };
const seat = k => { const a = k * 2.1 + 0.4, r = 0.62 + (k % 3) * 0.16; return { x: fire.x + Math.cos(a) * r, y: fire.y + Math.sin(a) * r * 0.9 }; };
const campR = () => T0.sites.length > 6 ? 4.6 : 3.3;

// ================================================================== ground: painted from the engine's fields, crossfaded, touched up locally while a power is held
// The ground lives in chunks of CT x CT tiles, one canvas each, so the map can be large. Every screen pixel belongs to
// exactly one tile and so to exactly one chunk; a chunk's canvas holds only its own pixels (the rest transparent), and the
// chunks are laid side by side with no seam. A chunk is repainted into one shared scratch image and crossfades from a copy
// of its old picture taken into a small pool of canvases.
const CT = 16, NC = Math.ceil(N / CT), CMX = 48, CW = CT * TW + 2 * CMX, CHT = CT * TH + CLIFF + 34;
const chunks = [];
for (let j = 0; j < NC; j++) for (let i = 0; i < NC; i++) {
  const ox = Math.floor(isoX(i * CT, (j + 1) * CT)) - CMX, oy = Math.floor(isoY(i * CT, j * CT)) - 2;
  chunks.push({ i, j, ox, oy, cv: null, ctx: null, stale: true, fade: null, painted: false });
}
const scratch = document.createElement('canvas').getContext('2d').createImageData(CW, CHT), px32 = new Uint32Array(scratch.data.buffer);
const fadePool = [];
const chunkOfPixel = (pxx, py) => {
  const v = (py - OY) / (TH / 2), u = (pxx - OX) / (TW / 2), fx = (u + v) / 2, fy = (v - u) / 2;
  if (fx < 0 || fy < 0) return -1;
  const tx = Math.min(N - 1, fx | 0), ty = Math.min(N - 1, fy | 0); return (ty >> 4) * NC + (tx >> 4);
};
/* paint a rectangle (chunk-local pixels) of one chunk into the scratch image; pixels of other chunks stay transparent */
function paintChunkRect(ch, x0, y0, x1, y1) {
  const k = ch.j * NC + ch.i; if (cbFor !== ch) chunkFields(ch);
  for (let y = y0; y < y1; y++) { const py = ch.oy + y; for (let x = x0; x < x1; x++) { const pxx = ch.ox + x; px32[y * CW + x] = pxx >= 0 && py >= 0 && pxx < WW && py < WH && chunkOfPixel(pxx, py) === k ? colorAt(pxx, py) : 0; } }
}
/* the speckle in the ground: a 512 x 512 tile of noise repeated over the whole land, so its size does not grow with the map */
const NT = 512, noise = new Uint8Array(NT * NT), noise2 = new Uint8Array(NT * NT);
{ let s = seed * 9301 + 7; const r = () => { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; return s >>> 8 & 255; }; for (let i = 0; i < NT * NT; i++) { noise[i] = r(); noise2[i] = r(); } }
const rgb = h => { const n = parseInt(h.slice(1), 16); return 0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16); };
const C = {
  deep: rgb('#3d7a8f'), mid: rgb('#4f93a3'), shal: rgb('#6fb0b5'), foam: rgb('#cfe9e4'), glint: rgb('#9fd3d0'), ice: rgb('#cfe6f2'), ice2: rgb('#eef7fb'), iceCrack: rgb('#a9cfe2'),
  bankLine: rgb('#5a4630'), sand: rgb('#d8c48a'), sandWet: rgb('#b59c68'),
  dry1: rgb('#cdb07a'),
  dry2: rgb('#b99a64'),
  earth1: rgb('#a5825a'),
  earth2: rgb('#8f6f4b'),
  wet1: rgb('#7a5c40'),
  wet2: rgb('#644a34'),
  mud: rgb('#553f2d'),
  puddle: rgb('#6f8f98'),
  puddle2: rgb('#8fb1b8'),
  gA: rgb('#86b24c'),
  gB: rgb('#79a645'),
  gHi: rgb('#a9cf63'),
  gLo: rgb('#5f8a3c'),
  lushA: rgb('#6da247'),
  lushB: rgb('#5f943f'),
  dryA: rgb('#b9b25a'),
  dryB: rgb('#a7a04e'),
  froA: rgb('#93a67c'),
  froB: rgb('#86996f'),
  shadeA: rgb('#4f7f3a'), shadeB: rgb('#447035'), flowerW: rgb('#fbf4e2'), flowerY: rgb('#f3d24f'), flowerP: rgb('#e08fb8'), flowerR: rgb('#d9523f'),
  snow: rgb('#f6f9fc'), snow2: rgb('#e3ebf5'), snow3: rgb('#cddaea'), frost: rgb('#dfeadf'),
  furrow: rgb('#5f4630'), tilled: rgb('#8c6c47'), crop1: rgb('#8fbf52'), crop2: rgb('#c2c957'), crop3: rgb('#e6c453'), stubble: rgb('#cdb06c'),
  yard1: rgb('#a3906a'), yard2: rgb('#968460'), floor: rgb('#7b6a4e'),
  pitRim: rgb('#8c7a62'), pit1: rgb('#6b5c4b'), pit2: rgb('#55493d'), pit3: rgb('#41372f'), pitFloor: rgb('#4f5a56'),
  ash: rgb('#3a3432'), ash2: rgb('#5a5350'), ember: rgb('#c9552c'), floodA: rgb('#6aa3b0'), floodB: rgb('#7bb2bb'),
  path1: rgb('#b49a6c'), path2: rgb('#a3875a'), pathEdge: rgb('#9a9a55'),
  kerb: rgb('#7d776c'), mortar: rgb('#6f6a60'), cob1: rgb('#b3aea2'), cob2: rgb('#a09b90'), cob3: rgb('#c2bdb1'), grav1: rgb('#bdb39a'), grav2: rgb('#a89e86'), grav3: rgb('#cfc6ae'),
  cl1: rgb('#8a6444'), cl2: rgb('#765338'), cl3: rgb('#5f412c'), cl4: rgb('#4a3222'), clEdge: rgb('#3a2619'), clGrass: rgb('#5f8a3c')
};
/* the fields, smoothed to 8 samples a tile, are held only for the chunk being painted: CB x CB samples, its corner at cbx, cby */
const BN = N * 8, CB = 16 * 8,
  mkB = () => new Float32Array(CB * CB),
  bG = mkB(),
  bS = mkB(),
  bM = mkB(),
  bWt = mkB(),
  bF = mkB(),
  bT = mkB(),
  bFe = mkB(),
  bTr = mkB(),
  bSc = mkB(),
  bRd = mkB(),
  bKn = mkB(),
  bHt = mkB(),
  roadF = new Float32Array(N * N);
const knownF = new Float32Array(N * N);
/* the ground a building takes: its whole lot is a trodden yard, the floor under the roof bare earth (1 = yard, 2 = floor) */
const lotMask = new Uint8Array(N * N);
function syncLots() { lotMask.fill(0); for (const q of S.tribe.sites) { const well = q.kind === 'well'; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = q.x + dx, y = q.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const i = y * N + x; if (W.water[i]) continue; if (!dx && !dy) lotMask[i] = 2; else if (!well && !W.field[i]) lotMask[i] = Math.max(lotMask[i], 1); } } }
const scar = new Float32Array(N * N), waterF = new Float32Array(N * N), trail = new Float32Array(N * N), cellT = new Float32Array(N * N);
for (let i = 0; i < N * N; i++) waterF[i] = W.water[i];
let cbx = 0, cby = 0, cbFor = null;
function blurRect(src, dst, bx0, by0, bx1, by1) {
  bx0 = Math.max(cbx, bx0); by0 = Math.max(cby, by0); bx1 = Math.min(BN - 1, cbx + CB - 1, bx1); by1 = Math.min(BN - 1, cby + CB - 1, by1);
  for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
    const fx = (bx + 0.5) / 8 - 0.5,
      fy = (by + 0.5) / 8 - 0.5,
      x0 = clamp(Math.floor(fx), 0, N - 1),
      y0 = clamp(Math.floor(fy), 0, N - 1),
      x1 = Math.min(N - 1, x0 + 1),
      y1 = Math.min(N - 1, y0 + 1),
      u = clamp(fx - x0, 0, 1),
      v = clamp(fy - y0, 0, 1);
    dst[(by - cby) * CB + (bx - cbx)] = (src[y0 * N + x0] * (1 - u) + src[y0 * N + x1] * u) * (1 - v) + (src[y1 * N + x0] * (1 - u) + src[y1 * N + x1] * u) * v;
  }
}
const blur = (src, dst) => blurRect(src, dst, cbx, cby, cbx + CB - 1, cby + CB - 1);
/* make the smoothed fields those of one chunk (as the land is now) */
function chunkFields(ch) {
  cbx = ch.i * CB; cby = ch.j * CB; cbFor = ch;
  for (let i = 0; i < N * N; i++) knownF[i] = W.known[i];
  for (const [src, dst] of [[W.height, bHt], [knownF, bKn], [waterF, bWt], [W.fert, bFe], [roadF, bRd], [W.grass, bG], [W.snow, bS], [W.soil, bM], [W.flood, bF], [W.tree, bT], [trail, bTr], [scar, bSc]]) blur(src, dst);
}
let gRipe = 0, gWarm = false, campOn = true;
function groundState() { gRipe = T0.sown && T0.cropWarm > 0 ? clamp(T0.cropWarm / 5.6, 0, 1) : 0; gWarm = S.air > 9; campOn = S.popPeople > 0 || T0.huts > 0; }
// The whole land is drawn. (The owner chose not to hide unseen land: the settlement's 'known' record stays in the
// simulation, but the view does not fade it into the dark. SHOW_ALL = false brings the fade back.)
const SHOW_ALL = true;
function colorAt(pxx, py) {
  let c = colorAt0(pxx, py); if (!c) return 0;
  const v = (py - OY) / (TH / 2), u = (pxx - OX) / (TW / 2), fx = (u + v) / 2, fy = (v - u) / 2;
  let k;
  if (fx >= N || fy >= N) k = W.known[Math.min(N - 1, fy | 0) * N + Math.min(N - 1, fx | 0)];
  else k = bKn[(((fy * 8) | 0) - cby) * CB + (((fx * 8) | 0) - cbx)];
  /* the shape of the land, before it is drawn in relief: low ground a little darker, ridges a little lighter */
  if (fx < N && fy < N && !W.water[(fy | 0) * N + (fx | 0)]) {
    const h = bHt[(((fy * 8) | 0) - cby) * CB + (((fx * 8) | 0) - cbx)], f = clamp(0.84 + 0.045 * h, 0.8, 1.2);
    const r = Math.min(255, (c & 255) * f), g = Math.min(255, ((c >>> 8) & 255) * f), b = Math.min(255, ((c >>> 16) & 255) * f);
    c = (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  }
  if (SHOW_ALL || k >= 0.98) return c;
  const t = clamp(k * 1.4 - 0.2, 0, 1), n = noise2[((py & (NT - 1)) * NT) | (pxx & (NT - 1))];
  if (t * 255 <= n) return 0;
  /* the last of the seen land is a little dimmer, as if in mist */
  const dim = 0.72 + 0.28 * t, r = (c & 255) * dim, g = ((c >>> 8) & 255) * dim, b = ((c >>> 16) & 255) * dim;
  return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
}
/* how much of a point on the ground has been seen, smoothly between tiles (for things standing on it) */
function knownAt(x, y) {
  if (SHOW_ALL) return 1;
  const fx = clamp(x - 0.5, 0, N - 1), fy = clamp(y - 0.5, 0, N - 1), x0 = fx | 0, y0 = fy | 0, x1 = Math.min(N - 1, x0 + 1), y1 = Math.min(N - 1, y0 + 1), u = fx - x0, v = fy - y0, K = W.known;
  return (K[y0 * N + x0] * (1 - u) + K[y0 * N + x1] * u) * (1 - v) + (K[y1 * N + x0] * (1 - u) + K[y1 * N + x1] * u) * v;
}
function colorAt0(pxx, py) {
  const p = ((py & (NT - 1)) * NT) | (pxx & (NT - 1)), v = (py - OY) / (TH / 2), u = (pxx - OX) / (TW / 2), fx = (u + v) / 2, fy = (v - u) / 2;
  if (fx < 0 || fy < 0) return 0;
  if (fx >= N || fy >= N) {                                                    // the cut edge of the land
    const d = Math.max(fx - N, fy - N) * TH; if (fx - CLIFF / TH >= N || fy - CLIFF / TH >= N || fx - d / TH < 0 || fy - d / TH < 0) return 0;
    const n = noise[p]; return d < 3 ? C.clGrass : d > CLIFF - 2 ? C.clEdge : d < 12 ? (n > 200 ? C.cl2 : C.cl1) : d < 26 ? (n > 190 ? C.cl3 : C.cl2) : (n > 180 ? C.cl4 : C.cl3);
  }
  const ci = (fy | 0) * N + (fx | 0), b = (((fy * 8) | 0) - cby) * CB + (((fx * 8) | 0) - cbx), n = noise[p], n2 = noise2[p], jn = (n - 128) / 255;
  const w = bWt[b] + jn * 0.06, T = cellT[ci]; let col;
  if (w > 0.5) {
    if (T < -3) col = n2 > 248 ? C.iceCrack : n > 170 ? C.ice2 : C.ice;
    else col = w < 0.57 ? C.foam : w > 0.88 ? C.deep : w > 0.7 ? C.mid : C.shal;
    if (T >= -3 && n2 > 252 && w > 0.6) col = C.glint;
    if (bS[b] * 3 > 0.6 && T < -3 && n > 110) col = C.snow;
    return col;
  }
  if (w > 0.455) return C.bankLine;
  const m = bM[b] + jn * 0.18, g = bG[b];
  col = m < 0.28 ? (n2 > 215 ? C.dry2 : C.dry1) : m < 0.78 ? (n2 > 215 ? C.earth2 : C.earth1) : m < 1.08 ? (n2 > 215 ? C.wet2 : C.wet1) : (n2 > 150 ? C.puddle2 : C.puddle);
  if (w > 0.36) col = m > 0.85 ? C.sandWet : C.sand;
  else if (W.field[ci]) {
    const row = ((pxx + py * 2) >> 2) & 3; col = row === 0 ? C.furrow : C.tilled;
    if (row !== 0 && g * 1.5 + jn * 0.4 > 0.35) col = gRipe > 0.8 ? C.crop3 : gRipe > 0.45 ? C.crop2 : gRipe > 0 ? C.crop1 : C.stubble;
  } else if (g * 1.6 + jn * 0.22 > 0.3 && m < 1.12) {
    const patch = bFe[b] + jn * 0.08 > 0.72;
    if (T < 0) col = patch ? C.froB : C.froA; else if (m < 0.3) col = patch ? C.dryB : C.dryA; else if (m > 0.8 && g > 0.5) col = patch ? C.lushB : C.lushA; else col = patch ? C.gB : C.gA;
    if (bT[b] + jn * 0.2 > 0.5) col = patch ? C.shadeB : C.shadeA;
    if (n2 < 5) col = T < 0 ? C.frost : C.gHi; else if (n2 > 250) col = C.gLo;
    else if (gWarm && g > 0.5 && m > 0.35 && n2 === 7) col = n < 64 ? C.flowerW : n < 128 ? C.flowerY : n < 192 ? C.flowerP : C.flowerR;
  }
  /* a quarry pit: stepped terraces down to its floor, deeper the more stone has been taken */
  { const pd = W.pit ? W.pit[ci] : 0;
    if (pd > 0.04) { const e = Math.max(Math.abs(fx % 1 - 0.5), Math.abs(fy % 1 - 0.5)) * 2, inner = 1 - e; if (inner < 0.12 + 0.5 * pd) { const lv = Math.floor(inner / 0.12); col = e > 0.92 ? C.pitRim : lv <= 0 ? C.pitRim : lv === 1 ? C.pit1 : lv === 2 ? C.pit2 : pd > 0.7 && lv >= 4 ? C.pitFloor : C.pit3; } } }
  /* the yard of a building and the floor under it */
  { const lm = lotMask[ci]; if (lm === 2) col = n2 > 200 ? C.yard2 : C.floor; else if (lm === 1) col = n2 > 215 ? C.yard2 : C.yard1; }
  // footpaths worn by people, and the trodden ground of the camp
  if (!W.field[ci]) {
    let worn = bTr[b] + jn * 0.16;
    if (campOn) { const dc = Math.hypot(fx - camp.x, fy - camp.y) / campR(); if (dc < 0.75) worn = Math.max(worn, 1.05 - dc * 0.7 + jn * 0.25); }
    if (worn > 0.62) col = n2 > 205 ? C.path2 : C.path1; else if (worn > 0.48 && n2 > 120) col = C.pathEdge;
  }
  // made streets: a beaten track while it is a hamlet, gravel when it is a village, stone setts when it is a town
  const rd = bRd[b] + jn * 0.1;
  if (rd > 0.4) {
    const lv = T0.pave;
    if (rd < 0.48) col = lv >= 2 ? C.kerb : C.pathEdge;
    else if (lv >= 3) {
      const v6 = fy * 5 + fx * 5, u6 = fx * 5 - fy * 5, row = Math.floor(v6), uu = u6 + (row & 1) * 0.5, pick = (hash(Math.floor(uu), row) * 3) | 0;
      col = (uu - Math.floor(uu) < 0.16 || v6 - row < 0.2) ? C.mortar : pick === 0 ? C.cob1 : pick === 1 ? C.cob2 : C.cob3;
    }
    else if (lv >= 2) col = n2 > 200 ? C.grav2 : n2 > 90 ? C.grav1 : C.grav3;
    else col = n2 > 205 ? C.path2 : C.path1;
  }
  const sc = bSc[b] * 1.3 + jn * 0.35; if (sc > 0.45 && n2 < clamp(sc, 0, 1) * 255) col = n > 242 && sc > 1 ? C.ember : n > 120 ? C.ash : C.ash2;
  const s = bS[b];
  if (s > 0.012) { if (s * 4.5 + jn * 0.5 > 0.42) col = n2 > 240 ? C.snow3 : n2 > 190 ? C.snow2 : C.snow; else if (n2 > 220) col = C.frost; }
  if (bF[b] + jn * 0.2 > 0.45) col = n2 > 128 ? C.floodA : C.floodB;
  return col;
}
// a full repaint runs a strip at a time into the shared pixels, then crossfades over the old picture
let paint = null, groundWanted = true;
let waterSeen = 0;
/* what a chunk's picture depends on, coarsely: if none of it has moved since the chunk was last painted, it is left alone */
function chunkSig(ch) {
  let h = (gRipe * 8 | 0) * 7 + (gWarm ? 3 : 0) + (campOn ? 5 : 0) + T0.pave * 11;
  /* what grows and lies on the ground: the chunk's average of each, in steps of 1/24; things that are or are not there
     (ways, fields, pits, water): tile by tile */
  const soft = [W.grass, W.snow, W.soil, W.tree, W.flood, scar, trail], hard = [roadF, waterF, W.field, W.known, lotMask], sum = new Float64Array(soft.length + 1);
  let n = 0;
  for (let y = ch.j * CT; y < Math.min(N, (ch.j + 1) * CT + 1); y++) for (let x = ch.i * CT; x < Math.min(N, (ch.i + 1) * CT + 1); x++) {
    const i = y * N + x; n++;
    for (let f = 0; f < soft.length; f++) sum[f] += soft[f][i];
    sum[soft.length] += cellT[i] < -3 ? 0 : cellT[i] < 0 ? 0.5 : 1;
    for (let f = 0; f < hard.length; f++) if (hard[f][i] > 0.5) h = (h * 31 + i * 7 + f) | 0;
    if (W.pit && W.pit[i] > 0.04) h = (h * 31 + i * 13 + Math.round(W.pit[i] * 6)) | 0;
  }
  for (let f = 0; f < sum.length; f++) h = (h * 31 + Math.round(sum[f] / n * 24)) | 0;
  return h;
}
let chunkRepaints = 0, chunkSkips = 0;
function startPaint() {
  /* a pit that filled into a pond changes the water itself */
  if ((S.stat && S.stat.ponds || 0) !== waterSeen) { waterSeen = S.stat.ponds; for (let i = 0; i < N * N; i++) waterF[i] = W.water[i]; }
  for (let i = 0; i < N * N; i++) roadF[i] = T0.road[i];
  syncLots();
  cbFor = null;   /* the smoothed fields are taken afresh, chunk by chunk, as each is painted */
  for (let i = 0; i < N * N; i++) cellT[i] = W.tempAt(i);
  groundState();
  for (const ch of chunks) { const sig = chunkSig(ch); if (!ch.painted || sig !== ch.sig) { ch.stale = true; ch.sig = sig; chunkRepaints++; } else chunkSkips++; }
  paint = { ch: null, row: 0 };
  groundWanted = false;
}
const chunkKnown = ch => { if (SHOW_ALL) return true; for (let y = Math.max(0, ch.j * CT - 1); y < Math.min(N, (ch.j + 1) * CT + 1); y++) for (let x = Math.max(0, ch.i * CT - 1); x < Math.min(N, (ch.i + 1) * CT + 1); x++) if (W.known[y * N + x]) return true; return false; };
const chunkVisible = ch => { const z = cam.z, vw = cv.width / z, vh = cv.height / z; return ch.ox < cam.x + vw && ch.ox + CW > cam.x && ch.oy < cam.y + vh && ch.oy + CHT > cam.y; };
/* paint some rows of the next stale chunk, those in view first; a finished chunk crossfades from its old picture */
function paintSome(rows, all) {
  while (rows > 0 && paint) {
    /* a chunk where nothing has been seen has no picture at all */
    for (const c of chunks) if (c.stale && !chunkKnown(c)) { c.stale = false; if (c.cv) { c.cv = null; c.ctx = null; c.painted = false; if (c.fade) { fadePool.push(c.fade.from); c.fade = null; } } }
    if (!paint.ch) { paint.ch = chunks.find(c => c.stale && chunkVisible(c)) || (all ? chunks.find(c => c.stale) : null); paint.row = 0; if (!paint.ch) { paint = null; return; } }   /* stale chunks out of view wait until they are seen */
    const ch = paint.ch, end = Math.min(CHT, paint.row + rows);
    paintChunkRect(ch, 0, paint.row, CW, end); rows -= end - paint.row; paint.row = end;
    if (end >= CHT) {
      if (!ch.cv) { ch.cv = mkC(CW, CHT); ch.ctx = ch.cv.getContext('2d'); }
      if (ch.painted && !all) { const from = fadePool.pop() || (chunks.filter(c => c.fade).length < 4 ? mkC(CW, CHT) : null); if (from) { const fc = from.getContext('2d'); fc.clearRect(0, 0, CW, CHT); fc.drawImage(ch.cv, 0, 0); if (ch.fade) fadePool.push(ch.fade.from); ch.fade = { t: now, from }; } }
      ch.ctx.putImageData(scratch, 0, 0); ch.painted = true; ch.stale = false; paint.ch = null;
    }
  }
}
function drawGround(cx) {
  for (const ch of chunks) {
    if (!ch.cv || !chunkVisible(ch)) continue;
    if (ch.fade) {
      const k = clamp((now - ch.fade.t) / 2600, 0, 1);
      cx.drawImage(ch.fade.from, ch.ox, ch.oy); cx.globalAlpha = ease(k); cx.drawImage(ch.cv, ch.ox, ch.oy); cx.globalAlpha = 1;
      if (k >= 1) { fadePool.push(ch.fade.from); ch.fade = null; }
    } else cx.drawImage(ch.cv, ch.ox, ch.oy);
  }
}
// touch up only the ground a power is working on, right away
function repaintCells(x0, y0, x1, y1) {
  x0 = clamp(x0 | 0, 0, N - 1); y0 = clamp(y0 | 0, 0, N - 1); x1 = clamp(x1 | 0, 0, N - 1); y1 = clamp(y1 | 0, 0, N - 1);
  const bx0 = (x0 - 1) * 8, by0 = (y0 - 1) * 8, bx1 = (x1 + 2) * 8, by1 = (y1 + 2) * 8;
  cbFor = null;   /* every chunk this touches takes its smoothed fields afresh */
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cellT[y * N + x] = W.tempAt(y * N + x);
  groundState();
  const pxa = clamp(Math.floor(isoX(x0, y1 + 1)), 0, WW - 1),
    pxb = clamp(Math.ceil(isoX(x1 + 1, y0)), 0, WW - 1),
    pya = clamp(Math.floor(isoY(x0, y0)), 0, WH - 1),
    pyb = clamp(Math.ceil(isoY(x1 + 1, y1 + 1)), 0, WH - 1);
  for (const ch of chunks) {
    if (!ch.cv) continue;
    const x0c = Math.max(0, pxa - ch.ox), y0c = Math.max(0, pya - ch.oy), x1c = Math.min(CW, pxb + 1 - ch.ox), y1c = Math.min(CHT, pyb + 1 - ch.oy);
    if (x1c <= x0c || y1c <= y0c) continue;
    paintChunkRect(ch, x0c, y0c, x1c, y1c);
    ch.ctx.putImageData(scratch, 0, 0, x0c, y0c, x1c - x0c, y1c - y0c);
    if (ch.fade) ch.fade.from.getContext('2d').putImageData(scratch, 0, 0, x0c, y0c, x1c - x0c, y1c - y0c);
  }
}

// ================================================================== things standing on the ground: they grow, fade and crossfade
const nearWater = new Uint8Array(N * N);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  if (W.water[y * N + x]) continue;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < N && ny < N && W.water[ny * N + nx]) nearWater[y * N + x] = 1;
  }
}
const STAGES = 8, stageCache = new Map();
function stageImg(src, stage) {
  if (stage >= STAGES - 1) return src;
  let m = stageCache.get(src);
  if (!m) stageCache.set(src, m = []);
  return m[stage] || (m[stage] = A.shrink(src, 0.3 + 0.7 * stage / (STAGES - 1)));
}
function treeLook(i, T, awake, snowy, falling) {
  const h1 = hash(i, 11), pine = W.fert[i] < 0.63;
  if (pine) {
    const P = A.pines[(h1 * 3) | 0].big;
    return { base: 'p' + ((h1 * 3) | 0), state: scar[i] > 0.6 ? 'burnt' : snowy ? 'snow' : 'green', img: scar[i] > 0.6 ? P.burnt : snowy ? P.snow : P.green };
  }
  const L = A.trees[(h1 * 4) | 0].big, fr = W.fruit[i] > 0.12 && hash(i, 12) < 0.7; let st;
  if (scar[i] > 0.6) st = 'burnt';
  else if (awake) st = fr ? 'fruit' : W.soil[i] < 0.26 ? 'dry' : L.blossom && W.warmSum[i] < 1.2 ? 'blossom' : 'green';   // in flower between waking and setting fruit
  else if (T > 2.5 && falling) st = fr ? 'goldFruit' : hash(i, 13) < 0.4 ? 'red' : 'gold';
  else if (T > 2.5) st = snowy ? 'snow' : 'green';
  else st = snowy ? 'bareSnow' : 'bare';
  return { base: 'l' + ((h1 * 4) | 0), state: st, img: L[st] };
}
const props = new Map();
function wantProps() {
  const want = new Map(), falling = !W.daysLengthen(), cR = campR();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x; if (W.water[i]) continue;
    const tr = W.tree[i], h0 = hash(i, 1), jx = (hash(i, 2) - 0.5) * 0.5, jy = (hash(i, 3) - 0.5) * 0.5, T = W.tempAt(i), snowy = W.snow[i] > 0.08;
    const inCamp = campOn && Math.hypot(x + 0.5 - camp.x, y + 0.5 - camp.y) < cR, px = x + 0.5 + jx, py = y + 0.5 + jy;
    const lag = hash(i, 9) * 0.1;                                          // each spot sprouts and fills out at its own pace
    if (tr >= 0.06 + lag && !inCamp && !W.field[i] && !T0.road[i] && h0 < (tr < 0.42 ? 0.5 : 0.42 + tr * 0.4)) {
      const lk = treeLook(i, T, W.warmSum[i] > 0, snowy, falling), stage = Math.round(clamp((tr - 0.06 - lag) / (0.45 + lag * 2), 0, 1) * (STAGES - 1));
      want.set('t' + i, { kind: 'tree', i, x: px, y: py, base: lk.base + lk.state, stage, img: stageImg(lk.img, stage), dy: 0 }); continue;
    }
    if (inCamp || W.field[i] || T0.road[i]) continue;   /* no bush or rock drawn on a field or a made road */
    if ((tr >= 0.04 && h0 > 0.78) || (h0 > 0.972 && W.grass[i] > 0.3)) {
      const B = A.bush[(hash(i, 4) * 3) | 0], st = snowy ? 'snow' : W.fruit[i] > 0.08 || (W.warmSum[i] > 1.2 && W.warmSum[i] < 7.6 && hash(i, 5) < 0.4) ? 'berry' : 'plain';
      want.set('b' + i, { kind: 'bush', i, x: px, y: py, base: 'b' + st, img: B[st], dy: 4 });
    }
    else if ((W.rock[i] > 0.2 && hash(i, 7) < 0.25 + W.rock[i] * 0.5) || (h0 < 0.02 && W.fert[i] < 0.75)) {
      const Rk = A.rock[(hash(i, 6) * 3) | 0];
      want.set('r' + i, { kind: 'rock', i, x: px, y: py, base: 'r' + snowy, img: snowy ? Rk.snow : Rk.plain, dy: 4 });
    }
    else if (nearWater[i] && h0 > 0.4 && h0 < 0.62 && T > -3) want.set('d' + i, { kind: 'reeds', i, x: x + 0.5 + jx * 0.6, y: y + 0.5, base: 'd', img: A.reeds, dy: 2 });
  }
  for (const h of S.homes.values()) {
    const snowy = W.snow[h.y * N + h.x] > 0.08;
    want.set('h' + h.id, { kind: h.kind,
      home: h,
      x: h.x + 0.5,
      y: h.y + 0.5,
      base: h.kind + snowy,
      img: h.kind === 'den' ? (snowy ? A.denSnow : A.den) : (snowy ? A.burrowSnow : A.burrow),
      dy: h.kind === 'den' ? 10 : 6 });
  }
  const piles = campOn ? Math.min(6, Math.ceil(T0.store / 7)) : 0;
  for (let k = 0; k < piles; k++) want.set('k' + k, { kind: 'basket', x: store.x + (k % 3) * 0.22 - 0.2, y: store.y + ((k / 3) | 0) * 0.25, base: 'k', img: A.basket, dy: 6 });
  // the fence, as far as it has been driven; a gate wherever a street goes through
  /* every stake that stands, old line and new: a stretch runs along x where its neighbours do; a gate wherever a street goes through */
  if (campOn && T0.fence) {
    const F = T0.fence;
    for (let c = 0; c < N * N; c++) {
      if (!F[c]) continue; const fx = c % N, fy = (c / N) | 0, alongX = (fx > 0 && F[c - 1]) || (fx < N - 1 && F[c + 1]), gate = T0.road[c];
      want.set('f' + c, { kind: 'fence', i: c, x: fx + 0.5, y: fy + 0.5, base: 'f' + alongX + gate, img: gate ? (alongX ? A.gateX : A.gateY) : (alongX ? A.fenceX : A.fenceY), dy: 14 });
    }
  }
  /* bridges: every one finished, and the one being laid as far as its timber goes */
  if (campOn) {
    const byKey = new Map(W.fords().map(f => [f.key, f]));
    /* n tiles decked, the rest of the span standing on bare piles; a bridge is begun from its own bank outward */
    const lay = (f, n, fromB) => { for (let k = 0; k < f.tiles.length; k++) { const t = f.tiles[fromB ? f.tiles.length - 1 - k : k], deck = k < n; want.set('b' + t, { kind: 'bridge', x: t % N + 0.5, y: ((t / N) | 0) + 0.5, base: 'b' + f.horiz + deck, img: deck ? (f.horiz ? A.bridgeX : A.bridgeY) : (f.horiz ? A.bridgePilesX : A.bridgePilesY), dy: 32 }); } };
    for (const key in T0.bridged) { const f = byKey.get(key); if (f) lay(f, f.tiles.length); }
    const b = T0.bridge; if (b && !b.done && b.wood > 0) { const f = byKey.get(b.key); if (f) lay(f, Math.floor(f.tiles.length * b.wood / b.need), b.ax !== f.ax || b.ay !== f.ay); }
  }
  /* what lies on the ground to be taken: meat where an animal fell, logs where a tree came down, broken stone */
  for (const p of S.piles || []) { const im = A.item[p.kind === 'wood' ? 'log' : p.kind], n = Math.min(6, Math.ceil(p.amt / 1.5)); for (let k = 0; k < n; k++) want.set('p' + p.kind + p.x + ',' + p.y + ':' + k, { kind: 'pile', x: p.x + 0.3 + (k % 3) * 0.16, y: p.y + 0.4 + ((k / 3) | 0) * 0.12, base: 'p' + p.kind, img: im, dy: 3 }); }
  const logs = campOn ? Math.min(6, Math.ceil(T0.wood / 2)) : 0;
  for (let k = 0; k < logs; k++) want.set('w' + k, { kind: 'logs', x: store.x - 0.3 + (k % 3) * 0.14, y: store.y + 0.45 + ((k / 3) | 0) * 0.12, base: 'w', img: A.item.log, dy: 2 });
  if (campOn && T0.carts && A.cart && ![...actors.values()].some(q => q.step && q.step.cart)) want.set('cart', { kind: 'cart', x: store.x - 0.7, y: store.y + 0.8, base: 'cart', img: A.cart, dy: 3 });
  if (campOn && T0.skills.fire) want.set('ring', { kind: 'ring', x: fire.x, y: fire.y, base: 'ring', img: A.ring, dy: 4 });
  return want;
}
function reconcile() {
  const want = wantProps();
  for (const [k, w] of want) {
    const p = props.get(k);
    if (!p) { props.set(k, Object.assign(w, { born: now, die: 0, swap: 0, prev: null, pop: 0 })); continue; }
    if (p.die) { p.die = 0; p.born = now - 400; }
    p.x = w.x; p.y = w.y; p.home = w.home;
    if (p.img !== w.img) {
      if (p.base === w.base) { if (w.stage !== p.stage) p.pop = now; p.img = w.img; }   // grew a size: a little bounce
      else { p.prev = p.img; p.img = w.img; p.swap = now; }                                // changed colour or state: a slow crossfade
      p.base = w.base; p.stage = w.stage;
    }
  }
  for (const [k, p] of props) if (!want.has(k) && !p.die) p.die = now;
}

// dwellings go up in front of you, a stage at a time: a cleared plot with pegs, a frame, then walls and roof.
// What stands where, of what kind and how far along is the engine's business (tribe.sites); this only shows it.
const huts = [];
function syncHuts() {
  const sites = campOn ? T0.sites : [];
  for (let k = 0; k < sites.length; k++) {
    const st = sites[k], n = W.DWELL[st.kind].stages, tp = 0.05 + 0.95 * Math.min(1, st.stage / n); let h = huts[k];
    if (!h || h.die || h.id !== st.id) h = huts[k] = { k, id: st.id, x: st.x + 0.5, y: st.y + 0.5, p: S.tickNo < 3 ? tp : 0, born: now, die: 0, kind: st.kind };
    if (h.kind !== st.kind || tp < h.p - 0.02) {
      if (!st.was && tp < h.p - 0.02) burst(h.x, h.y, 'debris', 16);
      h.p = Math.min(h.p, tp);
      if (h.kind !== st.kind) h.p = 0.05;
    }   // washed out, or being rebuilt as something better
    h.kind = st.kind; h.was = st.was; h.lake = st.lake; h.target = tp; h.live = st.kind !== 'well' && (!!st.was || st.stage >= n);
    const K = W.DWELL[st.kind]; h.wood = st.wood - st.stage * K.wood; h.stone = st.stone - st.stage * K.stone;   // lying on the plot, not yet built in
  }
  for (let k = sites.length; k < huts.length; k++) if (huts[k] && !huts[k].die) { huts[k].die = now; burst(huts[k].x, huts[k].y, 'debris', 16); }
}
const mirrors = new WeakMap();
function mirrorOf(im) { let m = mirrors.get(im); if (!m) { m = mkC(im.width, im.height); const x = m.getContext('2d'); x.translate(im.width, 0); x.scale(-1, 1); x.drawImage(im, 0, 0); mirrors.set(im, m); } return m; }
const dwellImg = (kind, lake, snowy) => A[kind + (lake && (kind === 'hut' || kind === 'house') ? 'Lake' : '') + (snowy ? 'Snow' : '')] || A.hut;
// well-trodden ways: from the fire to every door, to the well, and down to the nearest water
let waterSpot = null;
function wearPaths() {
  return;   /* the engine keeps the ways now (W.tread on the lattice); nothing is drawn across the lots */
  if (!campOn) return;
  const tread = (x0, y0, x1, y1) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
    for (let k = 0; k <= n; k++) {
      const x = lerp(x0, x1, k / n) | 0, y = lerp(y0, y1, k / n) | 0;
      if (x >= 0 && y >= 0 && x < N && y < N && !W.water[y * N + x]) trail[y * N + x] = Math.max(trail[y * N + x], 0.95);
    }
  };
  for (const h of huts) if (h && !h.die && h.p > 0.3) { const d = door(h); tread(fire.x, fire.y, d.x, d.y); }
  if (!waterSpot) {
    let bd = 1e9;
    for (let i = 0; i < N * N; i++) if (nearWater[i]) {
      const d = Math.hypot((i % N) + 0.5 - camp.x, ((i / N) | 0) + 0.5 - camp.y);
      if (d < bd) {
        bd = d;
        waterSpot = { x: (i % N) + 0.5, y: ((i / N) | 0) + 0.5 };
      }
    }
  }
  const well = huts.find(h => h && h.kind === 'well' && h.p >= 1);
  if (waterSpot && !well && huts.some(h => h && h.live)) tread(fire.x, fire.y, waterSpot.x, waterSpot.y);   // once there is a well, the long walk to the water is given up
}
const graves = [], relics = [];

// ================================================================== particles and small life
const parts = [];
const PCOL = { grass: ['#8fbf52', '#6da247'], fruit: ['#d8402f', '#f2c14e'], chips: ['#c9a779', '#8a6a48'], dirt: ['#8f6f4b', '#6e5238'], splash: ['#cfe9e4', '#9fd3d0'], dust: ['#d8c48a', '#bfa878'],
  sparkle: ['#e9ffb0', '#b6f07a', '#fff6c0'],
  heat: ['#ffd27a', '#ffb24a'],
  steam: ['#f4f7fb', '#e3ebf5'],
  smoke: ['#8d8984', '#a9a49d'],
  blood: ['#a8352c', '#7a2620'],
  debris: ['#a8853f', '#6a4c30', '#c9a85a'],
  leafG: ['#d09a34', '#b9552c', '#e6b94a'], petal: ['#fbf4e2', '#e08fb8'], drop: ['#8fc4ea'], snow: ['#ffffff'], ember: ['#ffd95a', '#f08a2c'], heart: ['#e0507a'], zz: ['#e8ecff'] };
function spawn(kind, wx, wy, o) {
  if (parts.length > 700) return;
  const c = PCOL[kind] || ['#fff'];
  parts.push(Object.assign({ kind, x: wx, y: wy, vx: 0, vy: 0, g: 0, life: 0, max: 1200, col: c[(Math.random() * c.length) | 0], s: 1 }, o));
}
function burst(cx0, cy0, kind, n, o) {
  const wx = isoX(cx0, cy0), wy = isoY(cx0, cy0);
  for (let k = 0; k < n; k++) {
    const a = Math.random() * 6.28, sp = Math.random();
    if (kind === 'sparkle') spawn(kind, wx + Math.cos(a) * 40 * sp, wy + Math.sin(a) * 20 * sp, { vy: -0.012 - Math.random() * 0.02,
      max: 900 + Math.random() * 600,
      s: Math.random() < 0.5 ? 2 : 1,
      tw: 1 });
    else if (kind === 'steam' || kind === 'smoke') spawn(kind, wx + (Math.random() - 0.5) * 30, wy - Math.random() * 6, { vy: -0.015 - Math.random() * 0.01,
      vx: (Math.random() - 0.3) * 0.006,
      max: 1600 + Math.random() * 900,
      s: 2 });
    else if (kind === 'heat') spawn(kind, wx + Math.cos(a) * 50 * sp, wy + Math.sin(a) * 25 * sp, { vy: -0.02 - Math.random() * 0.02, max: 700 + Math.random() * 500 });
    else spawn(kind, wx + (Math.random() - 0.5) * 10, wy - 4 - Math.random() * 8, Object.assign({ vx: (Math.random() - 0.5) * 0.07,
      vy: -0.05 - Math.random() * 0.06,
      g: 0.00018,
      max: 700 + Math.random() * 500,
      floor: wy + Math.random() * 6 }, o));
  }
}
const ripples = [];   // rings on water: fish, rain, things dropped in
const flock = { list: [], next: 9000 }, flies = [];
let clouds = []; for (let k = 0; k < 5; k++) clouds.push({ x: Math.random() * WW, y: OY + Math.random() * N * TH, r: 180 + Math.random() * 160, sp: 0.004 + Math.random() * 0.004 });

// ================================================================== creatures: each has a short plan for the coming step of time
const actors = new Map();
const lookOf = a => A.look[a.d.look || a.sp] || (A.look[a.sp] = A.generic(a.d));
const jit = (id, k) => (((id * (k ? 53 : 37)) % 11) - 5) * 0.055;
const endOf = a => ({ x: a.x + 0.5 + jit(a.id, 0), y: a.y + 0.5 + jit(a.id, 1) });
const kind = a => a.d.people ? 'person' : a.d.mass < 1 ? 'small' : a.d.eats.meat ? 'hunter' : 'grazer';
const SPEED = { person: { walk: 0.62, run: 1.7 }, small: { walk: 0.75, run: 2.6 }, grazer: { walk: 0.42, run: 2.3 }, hunter: { walk: 0.8, run: 2.8 } };
const STEPS = { person: 3.6, small: 2.2, grazer: 2.6, hunter: 2.8 };   // leg swings per cell walked: the feet keep pace with the ground
const BODY = { person: 0.17, small: 0.1, grazer: 0.26, hunter: 0.22 };
function newRec(a, x, y, o) {
  const r = Object.assign({ id: a.id, a, x, y, face: a.id % 2 ? 'r' : 'l', odo: 0, plan: null, si: 0, bub: '', bubT: -1e9, ox: 0, oy: 0, alpha: 1, born: now, dead: null, hidden: false, scale: 1 }, o);
  actors.set(a.id, r);
  return r;
}
const recOf = id => actors.get(id);

// water-free routes: straight when the way is clear, otherwise around the water cell by cell
function clear(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 4);
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    if (isWater(lerp(x0, x1, t), lerp(y0, y1, t))) return false;
  }
  return true;
}
function route(x0, y0, x1, y1) {
  if (clear(x0, y0, x1, y1)) return [{ x: x1, y: y1 }];
  /* the way is the simulation's (E1): over land and bridges, roads quicker; if the far side cannot be reached, as near as this side allows */
  const cl = v => clamp(v | 0, 0, N - 1), rt = W.route(cl(x0), cl(y0), cl(x1), cl(y1));
  if (!rt.reached) { const end = rt.tiles.length ? rt.tiles[rt.tiles.length - 1] : cl(y0) * N + cl(x0); x1 = (end % N) + 0.5; y1 = ((end / N) | 0) + 0.5; if (!rt.tiles.length) return [{ x: x0, y: y0 }]; }
  const cellsP = rt.tiles;
  const pts = []; let ax = x0, ay = y0;
  for (let k = 0; k < cellsP.length; k++) {
    const c = cellsP[k], px = (c % N) + 0.5, py = ((c / N) | 0) + 0.5, nx = k + 1 < cellsP.length ? (cellsP[k + 1] % N) + 0.5 : x1, ny = k + 1 < cellsP.length ? ((cellsP[k + 1] / N) | 0) + 0.5 : y1;
    if (!clear(ax, ay, nx, ny)) {
      pts.push({ x: px, y: py });
      ax = px;
      ay = py;
    }
  }
  pts.push({ x: x1, y: y1 }); return pts;
}
// a plan: moves and pauses laid out over the step (u runs 0 to 1)
class Plan {
  constructor(r) { this.r = r; this.steps = []; this.u = 0; this.x = r.x; this.y = r.y; }
  // people keep to the ways between lots: out to the nearest way, along the ways, and in at the other end
  go(x, y, sp, pose, o) {
    if (this.r.a.d.people && campOn && Math.hypot(x - this.x, y - this.y) > 2.5 && !this.noWay) {
      const snap = (v, c) => c + Math.round((v - c) / W.PITCH) * W.PITCH, vx = snap(this.x - 0.5, T0.x) + 0.5, hy = snap(y - 0.5, T0.y) + 0.5;
      this.noWay = 1;
    for (const [wx, wy] of [[vx, this.y], [vx, hy], [x, hy]]) if (!isWater(wx, wy) && wx > 0.3 && wy > 0.3 && wx < N - 0.3 && wy < N - 0.3) this.go(wx, wy, sp, pose, o);
    this.go(x, y, sp, pose, o);
    this.noWay = 0;
    return this;
    }
    for (const p of route(this.x, this.y, x, y)) {
    const d = Math.hypot(p.x - this.x, p.y - this.y);
    if (d < 0.02) continue;
    const du = d / (sp * TS);
    this.steps.push(Object.assign({ t: 'm', u0: this.u, u1: this.u + du, x1: p.x, y1: p.y, pose: pose || 'walk' }, o));
    this.u += du;
    this.x = p.x;
    this.y = p.y;
  }
  return this; }
  wait(du, pose, o) { if (du > 0) { this.steps.push(Object.assign({ t: 's', u0: this.u, u1: this.u + du, pose: pose || 'idle' }, o)); this.u += du; } return this; }
  until(u, pose, o) { return this.wait(u - this.u, pose, o); }
  follow(du, id, o) {
  this.steps.push(Object.assign({ t: 'f', u0: this.u, u1: this.u + du, id, pose: 'walk' }, o));
  this.u += du;
  const m = recOf(id);
  if (m) {
    this.x = m.x;
    this.y = m.y;
  }
  return this;
}
  squeeze(upto) { if (this.u > upto) { const f = upto / this.u; for (const s of this.steps) { s.u0 *= f; s.u1 *= f; } this.u = upto; } return this; }
  done(pose, o) { this.squeeze(1); if (this.u < 1) this.wait(1 - this.u, pose, o); this.r.plan = this.steps; this.r.si = -1; return this; }
}
const near = (x, y, r) => {
  for (let k = 0; k < 12; k++) {
    const a = Math.random() * 6.28, d = Math.random() * r, px = clamp(x + Math.cos(a) * d, 0.3, N - 0.3), py = clamp(y + Math.sin(a) * d, 0.3, N - 0.3);
    if (!isWater(px, py)) return { x: px, y: py };
  }
  return { x, y };
};
// where to stand to work a spot: in front of a tree, or on the bank beside a piece of water
function standBy(x, y, from) {
  const cx0 = x + 0.5, cy0 = y + 0.5;
  if (!W.water[y * N + x]) return { x: cx0 + 0.32 + R(-0.1, 0.1), y: cy0 + 0.32 + R(-0.1, 0.1), lx: cx0, ly: cy0 };
  let best = null, bd = 1e9;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= N || ny >= N || W.water[ny * N + nx]) continue;
    const d = Math.hypot(nx + 0.5 - from.x, ny + 0.5 - from.y);
    if (d < bd) {
      bd = d;
      best = { x: nx + 0.5 - dx * 0.38, y: ny + 0.5 - dy * 0.38, lx: cx0, ly: cy0 };
    }
  }
  return best || { x: from.x, y: from.y, lx: cx0, ly: cy0 };
}
const hutOf = r => huts.length ? huts[(r.id * 7) % huts.length] : null;
const door = h => ({ x: h.x + 0.42, y: h.y + 0.42 });

// ---- people
function planPerson(r, phase, pi) {
  const a = r.a, act = a.act || { k: 'idle' }, P = new Plan(r), end = endOf(a), evening = phase === 2, young = a.age < a.d.mature, sp = young ? 0.7 : a.age > 46 ? 0.5 : SPEED.person.walk;
  r.carriedBy = 0;
  if (r.pose === 'hidden') {                                         // waking up: out of the hut door, one by one
    if (act.k === 'sleep') { P.done('hidden', r.step && r.step.hut ? { hut: r.step.hut } : {}); return; }
    P.wait(R(0.01, 0.12), 'hidden'); P.wait(0.03, 'emerge');
  }
  const home = () => {
    const h = huts.filter(q => q && q.live && !q.die), q = h.find(x => x.id === a.house) || (h.length ? h[(r.id * 7) % h.length] : null); /* their own house if they have one */
    if (q) {
      P.go(door(q).x, door(q).y, sp);
      P.wait(0.03, 'enter', { hut: q.k + 1 });
      P.done('hidden', { hut: q.k + 1 });
    } else {
      const s = seat(pi);
      P.go(s.x, s.y, sp);
      P.done('lie', { zz: 1 });
    }
  };
  switch (act.k) {
    case 'sleep': return home();
    case 'baby': {
      let mom = a.mom && recOf(a.mom);
      if (mom && mom.id % 2 === 0) {
        let bd = 1e9;
        for (const o of actors.values()) if (!o.dead && o.a.d.people && o.a.age >= 16 && o.id % 2 === 1) {
          const d = Math.hypot(o.x - r.x, o.y - r.y);
          if (d < bd) {
            bd = d;
            mom = o;
          }
        }
      }   // the one who carries the baby
      if (mom && !mom.dead && mom.a.age >= mom.a.d.mature) { r.carriedBy = mom.id; P.done('carried'); return; }
      const s = seat(pi + 3); P.go(s.x, s.y, 0.3, 'crawl'); P.done('sit', { lx: fire.x, ly: fire.y }); return;
    }
    case 'play': {
      const pals = [...actors.values()].filter(o => o !== r && !o.dead && o.a.d.people && o.a.age >= 2 && o.a.age < o.a.d.mature);
      if (pals.length && Math.random() < 0.55) { const o = pals[(Math.random() * pals.length) | 0]; P.follow(0.45, o.id, { gap: 0.35, sp: 1.1, pose: 'run', playful: 1 }); }
      for (let k = 0; k < 4 && P.u < 0.85; k++) { const q = near(camp.x, camp.y, 2.4); P.go(q.x, q.y, 0.9, 'hop'); P.wait(R(0.05, 0.12), Math.random() < 0.4 ? 'sit' : 'idle', { play: 1 }); }
      break;
    }
    case 'gather': {
      const st = standBy(act.x, act.y, r);
      P.go(st.x, st.y, sp); P.wait(R(0.5, 0.7), 'work', { fx: act.fruit ? 'fruit' : 'grass', lx: st.lx, ly: st.ly });   /* the load goes home on the next step (E2) */
      break;
    }
    case 'fish': {
      const st = standBy(act.x, act.y, r);
      P.go(st.x, st.y, sp); P.wait(R(0.5, 0.7), 'fish', { lx: st.lx, ly: st.ly, catch: act.got > 0.02 });   /* home with the catch on the next step (E2) */
      break;
    }
    case 'hunt': {
      const tg = recOf(act.id);
      if (act.kill && tg) {
        const sx = act.x + 0.5, sy = act.y + 0.5;
        P.wait(0.05, 'look', { at: act.id });
        P.go(sx, sy, SPEED.person.run, 'run', { killMark: 1 });
        P.wait(0.08, 'work', { fx: 'blood', lx: sx, ly: sy });
        P.go(store.x + 0.3, store.y + 0.15, sp * 0.8, 'carry', { item: 'meat' });
        P.wait(0.04, 'work', { drop: 1 });
      }
      else if (tg) { P.wait(0.05, 'look', { at: act.id }); P.go(lerp(P.x, tg.x, 0.8), lerp(P.y, tg.y, 0.8), SPEED.person.run, 'run'); P.wait(0.08, 'look', { at: act.id }); }
      P.go(end.x, end.y, sp); break;
    }
    case 'chop': {                                                    // fell timber, shoulder it, carry it to the plot
      const tx = act.j % N, ty = (act.j / N) | 0, st = standBy(tx, ty, r), h = huts.find(q => q && q.id === act.site), to = h ? { x: h.x + 0.55, y: h.y + 0.3 } : store;
      P.go(st.x, st.y, sp); P.wait(0.2, 'work', { fx: 'chips', lx: st.lx, ly: st.ly, shake: act.j });
      P.go(to.x, to.y, sp * 0.8, 'carry', { item: 'log' }); P.wait(0.04, 'work', { drop: 1 }); break;
    }
    case 'quarry': {                                                  // break stone where it shows, or pick cobbles at the water's edge
      const tx = act.j % N, ty = (act.j / N) | 0, st = standBy(tx, ty, r), h = huts.find(q => q && q.id === act.site), to = h ? { x: h.x + 0.55, y: h.y + 0.3 } : store;
      P.go(st.x, st.y, sp); P.wait(0.22, 'work', { fx: 'dust', lx: st.lx, ly: st.ly });
      P.go(to.x, to.y, sp * 0.7, 'carry', { item: 'stone' }); P.wait(0.04, 'work', { drop: 1 }); break;
    }
    case 'walkto': P.go(act.x + 0.5, act.y + 0.5, sp); break;                               // on the way out: as far as the simulation has them
    case 'carryhome': P.go(act.x + 0.5, act.y + 0.5, sp * 0.85, 'carry', { item: act.item === 'fish' ? 'fish' : 'basket' }); break;   // on the way home with a load
    case 'home': { const mine = huts.find(q => q && q.live && !q.die && q.id === a.house); const to = mine ? door(mine) : store; P.go(to.x, to.y, sp); P.wait(0.04, 'work', { drop: 1 }); break; }
    case 'fetch': {                                                   // out to what lies on the ground, and back with it
      const mine = huts.find(q => q && q.live && !q.die && q.id === a.house), to = act.item === 'meat' || act.item === 'sticks' ? (mine ? door(mine) : store) : store;
      P.go(act.x + 0.5, act.y + 0.5, sp); P.wait(0.08, 'work', { lx: act.x + 0.5, ly: act.y + 0.5 });
      P.go(to.x, to.y, sp * 0.8, 'carry', { item: act.item }); P.wait(0.04, 'work', { drop: 1 }); break;
    }
    case 'bridgework': {                                              // a log from the pile carried to the bridge end, and laid
      P.go(store.x - 0.3, store.y + 0.45, sp); P.wait(0.03, 'work');
      P.go(act.x + 0.5, act.y + 0.5, sp * 0.8, 'carry', { item: 'log' }); P.wait(0.12, 'work', { fx: 'hammer', lx: act.x + 0.5, ly: act.y + 0.5 }); break;
    }
    case 'haul': {                                                    // timber or stone from the camp's pile to the plot
      const h = huts.find(q => q && q.id === act.site); P.go(store.x - 0.3, store.y + 0.45, sp); P.wait(0.03, 'work');
      if (h) { P.go(h.x + 0.55, h.y + 0.3, sp * 0.8, 'carry', { item: act.item || 'log' }); P.wait(0.04, 'work', { drop: 1 }); } break;
    }
    case 'build': {
      const h = huts.find(q => q && q.id === act.site);
      if (h) { P.go(h.x + 0.55, h.y + 0.3, sp); P.done('work', { fx: 'hammer', site: h.k, lx: h.x, ly: h.y }); return; }
      break;
    }
    case 'flee': { r.bub = 'afraid'; r.bubT = now; P.go(end.x, end.y, SPEED.person.run, 'run'); P.done('look', { at: act.id }); return; }
    case 'patrol':
    {
      const p1 = near(camp.x, camp.y, campR() + 1.5), p2 = near(camp.x, camp.y, campR() + 1.5);
      P.go(p1.x, p1.y, sp);
      P.wait(0.12, 'look');
      P.go(p2.x, p2.y, sp);
      P.wait(0.1, 'look');
      break;
    }
    case 'fence':
    {
      const fx0 = act.j % N + 0.5, fy0 = ((act.j / N) | 0) + 0.5;
      P.go(store.x - 0.3, store.y + 0.45, sp);
      P.go(fx0, fy0 + 0.3, sp * 0.8, 'carry', { item: 'log' });
      P.done('work', { fx: 'hammer', lx: fx0, ly: fy0 });
      return;
    }
    case 'shelter': home(); return;
    case 'watch': { const s = seat(pi); P.go(s.x, s.y, sp); P.done('sit'); return; }   // the night watch, awake by the fire
    case 'mourn': { const s = seat(pi); r.bub = 'grief'; r.bubT = now + 800; P.go(s.x, s.y, sp * 0.7); P.done('sit'); return; }                                    // foul weather: indoors
    case 'guard': { const tg = recOf(act.id); if (tg) { P.go(tg.x, tg.y, SPEED.person.run, 'run', { killMark: 1 }); P.wait(0.1, 'work', { fx: 'blood', at: act.id }); } break; }
    default: {   // nothing worth fetching this time: firewood, the fields, a chat by the fire
      if (a.wood >= 0) {
        const tx = a.wood % N, ty = (a.wood / N) | 0, st = standBy(tx, ty, r);
        P.go(st.x, st.y, sp);
        P.wait(0.08, 'work', { fx: 'chips', lx: st.lx, ly: st.ly });
        /* firewood goes to their own hearth if they have a roof, to the common fire if not */
        const mine = huts.find(q => q && q.live && !q.die && q.id === a.house), to = mine ? door(mine) : { x: fire.x - 0.3, y: fire.y + 0.2 };
        P.go(to.x, to.y, sp, 'carry', { item: 'sticks' });
        P.wait(0.04, 'work', { drop: 1 });
        if (act.k === 'wood') return;
      }
      const fields = []; if (T0.sown) for (let i = 0; i < N * N; i++) if (W.field[i]) fields.push(i);
      if (fields.length && Math.random() < 0.7) {
        const f = fields[(Math.random() * fields.length) | 0], fx0 = f % N + 0.5, fy0 = ((f / N) | 0) + 0.5;
        P.go(fx0, fy0, sp);
        P.wait(0.22, 'work', { fx: 'dirt', lx: fx0 + 0.3, ly: fy0 + 0.3 });
        P.go(fx0 + R(-0.4, 0.4), fy0 + R(-0.4, 0.4), 0.3);
        P.wait(0.18, 'work', { fx: 'dirt' });
      }
      else { const s = seat(pi); P.go(s.x, s.y, sp); P.wait(0.4, 'sit', { chat: 1, lx: fire.x, ly: fire.y }); }
    }
  }
  if (evening) { P.squeeze(0.6); const s = seat(pi); P.go(s.x, s.y, sp); P.done('sit', { chat: 1, lx: fire.x, ly: fire.y }); return; }
  if (act.k === 'play') { P.done('idle', { play: 1 }); return; }
  P.go(end.x, end.y, sp); P.done('idle');
}

// ---- animals
function planAnimal(r) {
  const a = r.a, act = a.act || { k: 'idle' }, k = kind(a), V = SPEED[k], P = new Plan(r), end = endOf(a), hop = k === 'small' ? 'hop' : 'walk';
  if (r.pose === 'hidden') { if (a.hidden) { P.done('hidden'); return; } P.wait(R(0, 0.1), 'hidden'); P.wait(0.03, 'emerge'); }
  const homeAt = id => { const h = S.homes.get(id); return h ? { x: h.x + 0.5, y: h.y + 0.5 } : null; };
  switch (act.k) {
    case 'graze': {
      const legs = k === 'small' ? 3 : 2;
      for (let s = 1; s <= legs; s++) {
        const t = s / legs, q = { x: lerp(r.x, end.x, t) + (s < legs ? R(-0.3, 0.3) : 0), y: lerp(r.y, end.y, t) + (s < legs ? R(-0.3, 0.3) : 0) };
        if (!isWater(q.x, q.y)) P.go(q.x, q.y, V.walk * (k === 'small' ? 1 : 0.8), hop);
        P.wait(R(0.12, 0.25), act.wary && Math.random() < 0.5 ? 'look' : 'graze', { at: act.wary });
      }
      P.done('graze'); return;
    }
    case 'rest': case 'sleep': P.wait(R(0, 0.08), 'graze'); P.go(end.x, end.y, V.walk, hop); P.wait(0.04, 'idle'); P.done('lie', { zz: act.k === 'sleep' && Math.random() < 0.6 }); return;
    case 'follow': { const m = recOf(act.id); if (m) { P.follow(1, act.id, { gap: 0.32 + (a.id % 3) * 0.12, sp: V.walk * 1.6, pose: hop, playful: 1 }); P.done('idle'); return; } break; }
    case 'flee': {
      const th = recOf(act.id); P.wait(R(0.01, 0.05), 'look', { at: act.id });
      const h = act.home && homeAt(act.home);
      if (h) { P.go(h.x, h.y, V.run, 'run'); P.wait(0.03, 'enter'); P.done('hidden'); return; }
      P.go(end.x, end.y, V.run, 'run'); P.done('look', { at: th ? act.id : 0 }); return;
    }
    case 'hide': case 'den': case 'home': {
      const h = homeAt(a.home) || end; P.go(h.x, h.y, act.k === 'hide' ? V.run : V.walk, act.k === 'hide' ? 'run' : hop);
      if (a.hidden) { P.wait(0.03, 'enter'); P.done('hidden'); } else P.done('idle'); return;
    }
    case 'cart': {                                                    // the tame beast draws the cart out to the work and back with the load
      const tx = act.j % N, ty = (act.j / N) | 0, st = standBy(tx, ty, r);
      P.go(st.x, st.y, V.walk * 1.4, 'walk', { cart: 1 });
      P.wait(0.18, 'idle', { cart: 1 });
      P.go(store.x - 0.7, store.y + 0.8, V.walk * 1.2, 'walk', { cart: 1 });
      P.done('idle', { cart: 1 });
      return;
    }
    case 'watch': P.go(end.x, end.y, V.walk, hop); P.done('look', { at: 0 }); return;   // head up while the herd eats
    case 'stalk': P.wait(R(0.02, 0.1), 'look', { at: act.id }); P.go(end.x, end.y, V.walk * 0.45, 'creep', { at: act.id }); P.done('look', { at: act.id }); return;
    case 'chase': P.wait(R(0.04, 0.12), 'look', { at: act.id }); P.go(end.x, end.y, V.run, 'run'); P.wait(0.06, 'idle'); P.done('look', { at: act.id }); return;
    case 'kill': { const sx = act.x + 0.5, sy = act.y + 0.5; P.wait(R(0.05, 0.12), 'look', { at: act.id }); P.go(sx, sy, V.run, 'run', { killMark: 1 }); P.done('feed', { lx: sx, ly: sy }); return; }
    case 'feed': { const sx = act.x + 0.5 + jit(a.id, 0) * 2, sy = act.y + 0.5 + jit(a.id, 1) * 2; P.go(sx, sy, V.walk * 1.3, 'walk'); P.done('feed', { lx: act.x + 0.5, ly: act.y + 0.5 }); return; }
    case 'prowl':
    {
      const m = { x: lerp(r.x, end.x, 0.5) + R(-0.5, 0.5), y: lerp(r.y, end.y, 0.5) + R(-0.5, 0.5) };
      if (!isWater(m.x, m.y)) P.go(m.x, m.y, V.walk);
      P.wait(0.1, 'graze');
      P.go(end.x, end.y, V.walk);
      P.done('look');
      return;
    }
  }
  P.go(end.x, end.y, V.walk, hop); P.done('idle');
}
// the hunted see it coming: they look up, bolt, and either get away or are caught where the hunter catches them
function preyReacts() {
  for (const h of actors.values()) {
    if (h.dead || !h.a.act) continue; const act = h.a.act, prey = act.id && recOf(act.id); if (!prey || prey.dead && prey.dead.by !== h.id) continue;
    if ((act.k === 'kill' || (act.k === 'hunt' && act.kill) || act.k === 'guard') && prey.dead) {
      const ks = h.plan && h.plan.filter(q => q.killMark).pop(),
        P = new Plan(prey),
        sx = act.x !== undefined ? act.x + 0.5 : prey.x,
        sy = act.y !== undefined ? act.y + 0.5 : prey.y,
        at = ks ? ks.u1 : 0.4;
      P.wait(Math.max(0, at - 0.25), 'graze');
      P.wait(0.03, 'look', { at: h.id });
      P.go(sx + R(-0.2, 0.2), sy + R(-0.2, 0.2), SPEED[kind(prey.a)].run, 'run');
      P.squeeze(at);
      P.until(at, 'look', { at: h.id });
      P.done('dead');
      prey.dead.u = at; prey.dead.shown = false;
    } else if ((act.k === 'chase' || act.k === 'hunt') && !prey.dead && prey.plan) {
      const P = new Plan(prey), away = { x: prey.x + Math.sign(prey.x - h.x || 1) * 1.6, y: prey.y + Math.sign(prey.y - h.y || 1) * 1.6 }, e = endOf(prey.a), safe = isWater(away.x, away.y) ? e : away;
      P.wait(R(0.04, 0.1), 'graze');
      P.wait(0.03, 'look', { at: h.id });
      P.go(safe.x, safe.y, SPEED[kind(prey.a)].run, 'run');
      P.wait(0.08, 'look', { at: h.id });
      P.go(e.x, e.y, SPEED[kind(prey.a)].walk);
      P.done('look', { at: h.id });
      if (Math.random() < 0.5) say2(prey, 'afraid');
    }
  }
}
function planDeath(r) {
  const d = r.dead, P = new Plan(r); if (d.u !== undefined && !d.instant) return;   // a hunt already laid out the end
  d.u = d.instant ? tickFrac : R(0.05, 0.25);
  if (d.instant) { r.plan = [{ t: 's', u0: 0, u1: 1, pose: 'dead' }]; r.si = -1; return; }
  P.wait(d.u, d.why === 'old age' || d.why === 'hunger' || d.why === 'cold and hunger' ? 'lie' : 'idle'); P.done('dead');
}

// ================================================================== events from the engine, turned into things you can see
function say2(r, b) { if (now - r.bubT > 6000) { r.bub = b; r.bubT = now + Math.random() * 600; } }
function takeEvents(instant) {
  for (const f of S.fx.splice(0)) {
    if (f.kind === 'death') {
      const r = recOf(f.id); if (!r) continue; r.dead = { why: f.why, by: f.by, t: gameMs, instant: !!instant };
      if (instant) { r.dead.u = tickFrac; r.dead.shown = true; r.dead.t = gameMs; if (f.why === 'struck') burst(r.x, r.y, 'smoke', 6); }
      if (W.SPECIES[f.sp].people) {
        const g = near(camp.x - 2.6, camp.y - 1.6, 1.2); graves.push({ x: g.x, y: g.y, born: now }); if (graves.length > 14) graves.shift();
        for (const o of actors.values()) if (o !== r && !o.dead && o.a.d.people && Math.hypot(o.x - r.x, o.y - r.y) < 6) { o.bub = 'grief'; o.bubT = now + 1200 + Math.random() * 3000; }
      }
    } else if (f.kind === 'birth') {
      const a = S.byId.get(f.id), m = f.mom && recOf(f.mom); if (!a) continue;
      const r = newRec(a, m ? m.x + R(-0.15, 0.15) : a.x + 0.5, m ? m.y + R(-0.1, 0.15) : a.y + 0.5, { born: now, newborn: 1, alpha: 0 });
      if (m && (a.d.people || Math.random() < 0.5)) {
        m.bub = 'love';
        m.bubT = now + 400;
      }
      if (a.d.people) for (const o of actors.values()) if (o.a.d.people && !o.dead && o !== m && Math.random() < 0.6) {
        o.bub = 'love';
        o.bubT = now + 1500 + Math.random() * 3000;
      }
    } else if (f.kind === 'arrive') {
      const a = S.byId.get(f.id); if (!a) continue; const ex = a.x < N / 2 ? -0.4 : N + 0.4; newRec(a, ex, a.y + 0.5, { born: now, arrive: 1, alpha: 0 });
    }
  }
}
function onTick() {
  syncCrossings();
  /* the year and the season, from how high the sun stands */
  { const el = document.getElementById('when'); if (el) { const ph = (((S.t - 0.08) % 1) + 1) % 1; el.textContent = 'Year ' + Math.floor(S.t) + ' \u00b7 ' + (ph < 0.125 || ph >= 0.875 ? 'winter' : ph < 0.375 ? 'spring' : ph < 0.625 ? 'summer' : 'autumn'); } }
  /* newcomers to an emptied valley may camp somewhere else: the fixed places of the camp follow the fire */
  if (camp.x !== T0.x + 0.5 || camp.y !== T0.y + 0.5) { camp.x = T0.x + 0.5; camp.y = T0.y + 0.5; fire.x = camp.x + 0.55; fire.y = camp.y + 0.15; store.x = camp.x - 0.45; store.y = camp.y + 0.35; }
  if (S.tickNo % W.TPY === 0 && !window.EDEN_NOSAVE) { try { localStorage.setItem('eden.save', W.save()); } catch (e) { /* storage full or off: play on unsaved */ } }   /* autosave once a game year */
  takeEvents(false); syncHuts();
  for (const a of S.agents) { if (!a.alive) continue; let r = recOf(a.id); if (!r) { const e = endOf(a); r = newRec(a, e.x, e.y, { alpha: 0 }); } r.a = a; }
  const phase = S.tickNo % DAY; let pi = 0;
  for (const r of actors.values()) {
    if (r.dead) { if (r.dead.shown) continue; planDeath(r); continue; }
    if (r.held) continue;
    if (r.a.d.people) planPerson(r, phase, pi++); else planAnimal(r);
  }
  preyReacts();
  wearPaths();
  for (let i = 0; i < N * N; i++) { trail[i] *= 0.992; if (W.burn[i] > 0) scar[i] = 1; else if (scar[i] > 0) scar[i] = Math.max(0, scar[i] - 0.012 - W.grass[i] * 0.02); }
  reconcile(); chronicle(); groundWanted = true;
}

// ---- moving along the plan, every frame
function stepAt(r, u, dts) {
  const pl = r.plan; if (!pl || !pl.length) return null;
  const enter = i => { const s = pl[i]; s.x0 = r.x; s.y0 = r.y; };
  if (r.si < 0) { r.si = 0; enter(0); }
  while (r.si < pl.length - 1 && u >= pl[r.si].u1) { const s = pl[r.si]; if (s.t === 'm') { r.odo += Math.hypot(s.x1 - r.x, s.y1 - r.y); r.x = s.x1; r.y = s.y1; } r.si++; enter(r.si); }
  const s = pl[r.si], k = clamp((u - s.u0) / Math.max(1e-6, s.u1 - s.u0), 0, 1);
  if (s.t === 'm') {
    const first = r.si === 0 || pl[r.si - 1].t !== 'm', last = r.si === pl.length - 1 || pl[r.si + 1].t !== 'm';
    const kk = first && last ? ease(k) : first ? k * k * (2 - k) * 0.5 + k * 0.5 : last ? 1 - (1 - k) * (1 - k) * 0.5 - (1 - k) * 0.5 : k;
    const nx = lerp(s.x0, s.x1, kk), ny = lerp(s.y0, s.y1, kk); r.vx = nx - r.x; r.vy = ny - r.y; r.odo += Math.hypot(r.vx, r.vy); r.x = nx; r.y = ny;
    r.spd = Math.hypot(s.x1 - s.x0, s.y1 - s.y0) / Math.max(0.05, (s.u1 - s.u0) * TS);
  } else if (s.t === 'f') {
    const m = recOf(s.id); r.vx = r.vy = 0;
    if (m && !m.dead) {
      const ang = (r.id % 7) * 0.9 + (s.playful ? Math.sin(gameMs / 900 + r.id) * 0.8 : 0),
        tx = m.x + Math.cos(ang) * s.gap,
        ty = m.y + Math.sin(ang) * s.gap * 0.8,
        d = Math.hypot(tx - r.x, ty - r.y);
      if (d > 0.06 && !isWater(tx, ty)) {
        const step = Math.min(d, (d > 0.6 ? s.sp * 1.5 : s.sp) * dts);
        r.vx = (tx - r.x) / d * step;
        r.vy = (ty - r.y) / d * step;
        r.x += r.vx;
        r.y += r.vy;
        r.odo += step;
        r.spd = step / Math.max(1e-3, dts);
      } else r.spd = 0;
    }
  } else { r.vx = r.vy = 0; r.spd = 0; }
  return s;
}

// ================================================================== camera and touch
function resize() { dpr = Math.min(3, window.devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); clampCam(); }
const minZ = () => Math.min(cv.width / WW, cv.height / WH) * 0.96, maxZ = () => 5 * dpr;
let kBox = null, kBoxT = -1;
function knownBox() {
  if (SHOW_ALL) return { x0: 0, y0: 0, x1: N - 1, y1: N - 1 };
  if (kBox && kBoxT === S.tickNo) return kBox;
  let x0 = N, y0 = N, x1 = -1, y1 = -1; for (let i = 0; i < N * N; i++) if (W.known[i]) { const x = i % N, y = (i / N) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { x0 = x1 = T0.x; y0 = y1 = T0.y; }
  kBoxT = S.tickNo; return (kBox = { x0, y0, x1, y1 });
}
function clampCam() {
  cam.z = clamp(cam.z, minZ(), maxZ());
  const vw = cv.width / cam.z, vh = cv.height / cam.z;
  /* the camera keeps to the land that has been seen */
  const kb = knownBox(), x0 = isoX(kb.x0, kb.y1 + 1), x1 = isoX(kb.x1 + 1, kb.y0), y0 = isoY(kb.x0, kb.y0) - 60, y1 = isoY(kb.x1 + 1, kb.y1 + 1) + CLIFF;
  cam.x = vw >= x1 - x0 ? (x0 + x1 - vw) / 2 : clamp(cam.x, x0 - vw * 0.3, x1 - vw * 0.7);
  cam.y = vh >= y1 - y0 ? (y0 + y1 - vh) / 2 : clamp(cam.y, y0 - vh * 0.3, y1 - vh * 0.7);
}
const toWorld = (sx, sy) => ({ x: cam.x + sx * dpr / cam.z, y: cam.y + sy * dpr / cam.z });
const toCell = (sx, sy) => { const w = toWorld(sx, sy), c = cellAt(w.x, w.y); return { x: clamp(c.x, 0, N - 0.01), y: clamp(c.y, 0, N - 0.01), wx: w.x, wy: w.y }; };
function zoomAt(sx, sy, f) { const w = toWorld(sx, sy); cam.z = clamp(cam.z * f, minZ(), maxZ()); cam.x = w.x - sx * dpr / cam.z; cam.y = w.y - sy * dpr / cam.z; clampCam(); }
const ptrs = new Map(); let pinch = null, held = null, heldPile = null, act = null, lastStrike = 0, bolt = null;
function actorAt(w) {
  let best = null, bd = 26;
  for (const r of actors.values()) {
    if (r.dead || r.hidden || r.carriedBy || r.pose === 'hidden') continue;
    const sp = lookOf(r.a).grown[0], d = Math.hypot(isoX(r.x, r.y) - w.x, isoY(r.x, r.y) - sp.h * 0.4 - w.y);
    if (d < bd) {
      bd = d;
      best = r;
    }
  }
  return best;
}
cv.addEventListener('pointerdown', e => {
  if (paused) return; cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { const [p, q] = [...ptrs.values()]; pinch = { d: Math.hypot(p.x - q.x, p.y - q.y), mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2 }; if (held) dropHeld(); act = null; return; }
  const w = toWorld(e.clientX, e.clientY);
  if (tool === 'hand') {
    const r = actorAt(w);
    if (r) {
      held = r;
      r.held = true;
      r.a.held = true;
      r.bub = 'afraid';
      r.bubT = now;
      const who = W.describe(r.a);
      if (who) say(who);
    }
    /* no creature under the hand: a pile of meat, logs or stone can be picked up instead */
    let pile = null; if (!r) { let bd = 30; for (const p of S.piles || []) { const d = Math.hypot(isoX(p.x + 0.5, p.y + 0.5) - w.x, isoY(p.x + 0.5, p.y + 0.5) - 4 - w.y); if (d < bd) { bd = d; pile = p; } } }
    if (pile) { heldPile = { x: pile.x, y: pile.y, kind: pile.kind, wx: w.x, wy: w.y }; say({ meat: 'Meat', wood: 'Logs', stone: 'Stone' }[pile.kind] + ': set it down by the fire for the village, or anywhere for people to fetch.'); }
    act = { id: e.pointerId, x: e.clientX, y: e.clientY, pan: !r && !pile };
  }
  else if (tool === 'strike') {
    if (now - lastStrike > 600) {
      lastStrike = now;
      const c = toCell(e.clientX, e.clientY), r = actorAt(w);
      /* the bolt hits the creature under the pointer, wherever the simulation has it; else the tile */
      if (r && !r.dead) W.G.strike(r.a.x, r.a.y, r.a.id); else W.G.strike(c.x | 0, c.y | 0);
      bolt = { x: w.x, y: w.y, t: now, seed: (Math.random() * 99) | 0 };
      takeEvents(true);
      scatterFrom(c.x, c.y, 4);
      burst(c.x, c.y, 'smoke', 10);
      burst(c.x, c.y, 'ember', 12);
      for (let i = 0; i < N * N; i++) if (W.burn[i] > 0) scar[i] = 1;
      reconcile();
      repaintCells(c.x - 2, c.y - 2, c.x + 2, c.y + 2);
    }
  }
  else act = { id: e.pointerId, x: e.clientX, y: e.clientY, acc: 0, t: 0 };
});
cv.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return; const ox = p.x, oy = p.y; p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size >= 2 && pinch) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    cam.x -= (mx - pinch.mx) * dpr / cam.z;
    cam.y -= (my - pinch.my) * dpr / cam.z;
    zoomAt(mx, my, d / Math.max(1, pinch.d));
    pinch = { d, mx, my };
    return;
  }
  if (!act || act.id !== e.pointerId) return; act.x = p.x; act.y = p.y;
  if (held) { const c = toCell(p.x, p.y + 10); held.x = c.x; held.y = c.y; }
  else if (heldPile) { const w2 = toWorld(p.x, p.y); heldPile.wx = w2.x; heldPile.wy = w2.y; }
  else if (act.pan) { cam.x -= (p.x - ox) * dpr / cam.z; cam.y -= (p.y - oy) * dpr / cam.z; clampCam(); }
});
function dropHeld() {
  const r = held; held = null; if (!r) return; r.held = false; r.a.held = false;
  if (isWater(r.x, r.y)) { const q = near(r.x, r.y, 2); r.x = q.x; r.y = q.y; ripples.push({ x: isoX(r.x, r.y), y: isoY(r.x, r.y), t: now }); }
  W.moveTo(r.a, clamp(r.x | 0, 0, N - 1), clamp(r.y | 0, 0, N - 1)); burst(r.x, r.y, 'dust', 6);
  // a moment to get its bearings, then it carries on from where it was put
  const P = new Plan(r), u = tickFrac; P.wait(u, 'idle'); P.wait(0.04, 'hop'); P.wait(0.06, 'look'); r.plan = null;
  if (r.a.d.people) { P.go(camp.x + R(-1, 1), camp.y + R(-1, 1), SPEED.person.walk); } else { const e = endOf(r.a); P.go(e.x, e.y, SPEED[kind(r.a)].walk); }
  P.done('idle'); r.si = -1; for (const s of r.plan) if (s.u1 <= u) { s.u0 = s.u1 = u; }
}
const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (act && act.id === e.pointerId) { if (held) dropHeld(); if (heldPile) dropPile(e); act = null; } };
function dropPile(e) {
  const hp = heldPile; heldPile = null; const c = toCell(e.clientX, e.clientY), where = W.G.movePile(hp.x, hp.y, hp.kind, clamp(c.x | 0, 0, N - 1), clamp(c.y | 0, 0, N - 1));
  if (where === 'store') say({ meat: 'The meat is in the common store by the fire.', wood: 'The logs are on the woodpile.', stone: 'The stone is stacked by the fire.' }[hp.kind]);
  burst(c.x, c.y, 'dust', 6); reconcile();
}
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 0.87); }, { passive: false });
let lastTap = 0; cv.addEventListener('click', e => { if (now - lastTap < 320 && tool === 'hand') zoomAt(e.clientX, e.clientY, 1.8); lastTap = now; });
// creatures near a sudden blow run from it
function scatterFrom(x, y, rad) {
  for (const r of actors.values()) {
    if (r.dead || r.held || r.hidden || r.carriedBy) continue; const d = Math.hypot(r.x - x, r.y - y); if (d > rad || d < 0.01) continue;
    const P = new Plan(r), u = tickFrac, fx0 = r.x + (r.x - x) / d * 1.8, fy0 = r.y + (r.y - y) / d * 1.8, q = isWater(fx0, fy0) ? near(r.x, r.y, 1.5) : { x: fx0, y: fy0 }, k = kind(r.a);
    P.wait(u, 'idle'); P.go(q.x, q.y, SPEED[k].run, 'run'); P.wait(0.1, 'look'); if (!r.a.d.people) { const e = endOf(r.a); P.go(e.x, e.y, SPEED[k].walk); } P.done('idle');
    for (const s of r.plan) if (s.u1 <= u) s.u0 = s.u1 = u; r.si = -1; r.bub = 'afraid'; r.bubT = now;
  }
}
// the powers: each one pushes the engine at the touched place, and the ground answers at once
function usePower(dtMs) {
  if (!act || tool === 'hand' || tool === 'strike') return; act.acc += dtMs; act.t += dtMs; if (act.acc < 120) return;
  const frac = act.acc / 2500; act.acc = 0; const c = toCell(act.x, act.y), x = c.x | 0, y = c.y | 0, cold = W.tempAt(y * N + x) < 0;
  if (tool === 'rain') {
    W.G.rain(x, y, 2, 0.2 * frac);
    if (!cold) for (let k = 0; k < 3; k++) {
      const q = { x: c.x + R(-2.3, 2.3), y: c.y + R(-2.3, 2.3) };
      if (isWater(q.x, q.y)) ripples.push({ x: isoX(q.x, q.y), y: isoY(q.x, q.y), t: now, small: 1 }); else burst(q.x, q.y, 'splash', 2, { vy: -0.03, max: 350 });
    }
  }
  else if (tool === 'sun') {
    const hadSnow = W.snow[y * N + x] > 0.02;
    W.G.sun(x, y, 2, 7 * frac);
    burst(c.x + R(-1.5, 1.5), c.y + R(-1.5, 1.5), 'heat', 3);
    if (hadSnow) burst(c.x + R(-1.5, 1.5), c.y + R(-1.5, 1.5), 'steam', 2);
  }
  else if (tool === 'grow') {
    W.G.grow(x, y, 2, 0.12 * frac);
    burst(c.x + R(-1.8, 1.8), c.y + R(-1.8, 1.8), 'sparkle', 4);
    if (Math.random() < 0.5) burst(c.x + R(-1.5, 1.5), c.y + R(-1.5, 1.5), 'petal', 1);
  }
  repaintCells(x - 3, y - 3, x + 3, y + 3); reconcile();
  // those under the touch notice it
  for (const r of actors.values()) {
    if (r.dead || r.hidden || r.carriedBy || Math.hypot(r.x - c.x, r.y - c.y) > 2.6 || Math.random() > 0.08) continue; const T = W.tempAt((r.y | 0) * N + (r.x | 0));
    if (tool === 'rain') say2(r, cold ? 'cold' : 'wet');
    else if (tool === 'sun') say2(r, T > 30 ? 'hot' : T < r.a.d.comfort + 6 ? 'warm' : 'fed');
    else if (tool === 'grow' && r.a.d.people) say2(r, 'play');
  }
}

// ================================================================== chronicle: a few words when something big happens
const say = (() => {
  const el = document.getElementById('news');
  let h;
  return t => {
    el.textContent = t;
    el.style.opacity = 1;
    clearTimeout(h);
    h = setTimeout(() => el.style.opacity = 0, 6500);
  };
})();
let logSeen = 0, hadPeople = true, hadFlood = false;
function chronicle() {
  while (logSeen < S.log.length) say(S.log[logSeen++].text);
  if (hadPeople && !S.popPeople) say('The valley is empty of people.'); hadPeople = S.popPeople > 0;
  const fl = W.flood[T0.y * N + T0.x]; if (fl && !hadFlood && S.popPeople) say('The water has reached the camp.'); hadFlood = !!fl;
}

// ================================================================== drawing
const draws = [];
const put = (im, wx, wy, extra) => { const d = Object.assign({ y: wy, img: im, x: Math.round(wx - im.width / 2), top: Math.round(wy - im.height) }, extra); draws.push(d); return d; };
function lightAt(tod) { // 0 = full day, 1 = full night; tod runs over one day of DAY steps
  if (tod < 0.06) return 1 - tod / 0.06; if (tod < 0.6) return 0; if (tod < 0.76) return (tod - 0.6) / 0.16; if (tod < 0.94) return 1; return 1 - (tod - 0.94) / 0.12;
}
function frame(t) {
  requestAnimationFrame(frame); const dtMs = Math.min(250, t - now); now = t;
  const dts = paused ? 0 : dtMs * speed / 1000;
  if (!paused) {
    usePower(dtMs); gameMs += dtMs * speed; tickFrac += dtMs * speed / TICK_MS;
    /* a slow frame catches up on the steps it missed, a few at a time, so fast speeds stay fast on a slow device */
    for (let n = 0; tickFrac >= 1 && n < 6; n++) { tickFrac -= 1; W.tick(); onTick(); }
    if (tickFrac >= 1) tickFrac = 0.99;
  }
  if (!paint && groundWanted) startPaint(); if (paint) paintSome(speed > 1 || act ? 200 : 90);
  const z = cam.z, u = tickFrac, tod = ((S.tickNo % DAY) + u) / DAY, dark = lightAt(tod) * (speed >= 8 ? 0.5 : 1);
  cx.setTransform(1, 0, 0, 1, 0, 0);
  const sky = cx.createLinearGradient(0, 0, 0, cv.height); sky.addColorStop(0, '#31504f'); sky.addColorStop(1, '#1d3136'); cx.fillStyle = sky; cx.fillRect(0, 0, cv.width, cv.height);
  cx.imageSmoothingEnabled = false; cx.setTransform(z, 0, 0, z, -Math.round(cam.x * z), -Math.round(cam.y * z));
  // ground, crossfading into its newest picture
  drawGround(cx);
  const vw = cv.width / z, vh = cv.height / z, vx0 = cam.x - 80, vx1 = cam.x + vw + 80, vy0 = cam.y - 20, vy1 = cam.y + vh + 150;
  const vis = (wx, wy) => wx > vx0 && wx < vx1 && wy > vy0 && wy < vy1;
  // cloud shadows drifting over the land
  const cloudy = S.precip > 0 ? 0.16 : 0.07;
  for (const c of clouds) {
    c.x += c.sp * dtMs * (speed || 0) * (paused ? 0 : 1) * 3;
    if (c.x - c.r > WW) {
      c.x = -c.r;
      c.y = OY + Math.random() * N * TH;
    }
    cx.globalAlpha = cloudy;
    cx.drawImage(A.shadowBlob, c.x - c.r, c.y - c.r * 0.5, c.r * 2, c.r);
  }
  cx.globalAlpha = 1;
  // ripples on the water
  for (let k = ripples.length - 1; k >= 0; k--) {
    const r = ripples[k], age = (now - r.t) / (r.small ? 600 : 1300);
    if (age > 1) {
      ripples.splice(k, 1);
      continue;
    }
    cx.strokeStyle = 'rgba(230,248,250,' + (0.7 * (1 - age)).toFixed(2) + ')';
    cx.lineWidth = 1;
    cx.beginPath();
    cx.ellipse(r.x, r.y, 3 + age * (r.small ? 7 : 16), (3 + age * (r.small ? 7 : 16)) * 0.5, 0, 0, 6.3);
    cx.stroke();
  }
  draws.length = 0;
  // ---- standing things
  for (const [key, p] of props) {
    const wx = isoX(p.x, p.y), wy = isoY(p.x, p.y) + (p.dy || 0); if (!vis(wx, wy)) continue;
    let al = clamp((now - p.born) / 1100, 0, 1); if (p.die) { al = Math.min(al, 1 - (now - p.die) / 1600); if (al <= 0) { props.delete(key); continue; } }
    al *= knownAt(p.x, p.y); if (al < 0.02) continue;
    const d = put(p.img, wx, wy, { alpha: al < 1 ? al : undefined,
      sway: p.kind === 'tree' ? p.i : -1,
      tree: p.kind === 'tree',
      prev: p.prev && now - p.swap < 2400 ? p.prev : null,
      swapK: clamp((now - p.swap) / 2400, 0, 1) });
    if (p.kind === 'tree' && W.burn[p.i] > 0) put(A.flame[(((t / 140) | 0) + p.i) % 2], wx, wy - 6);
    if (p.pop && now - p.pop < 380) d.pop = (now - p.pop) / 380;
    if (p.home && p.kind === 'den') d.eyes = { x: wx, y: wy - 18, home: p.home.id };
    if (p.home && p.kind === 'burrow') d.peek = { x: wx, y: wy - 12, home: p.home.id };
    if (p.kind === 'tree' && dts > 0 && Math.random() < dts * 0.05) {
      const st = p.base.slice(2);
      if (st === 'gold' || st === 'red' || st === 'goldFruit') spawn('leafG', wx + R(-30, 30), wy - R(50, 90), { vx: R(-0.01, 0.01), vy: 0.012, max: 4200, floor: wy + R(-4, 8), leaf: 1 });
    }
  }
  // the camp: houses going up, the fire, graves
  syncHuts();
  for (let k = 0; k < huts.length; k++) {
    const h = huts[k]; if (!h) continue; const wx = isoX(h.x, h.y), wy = isoY(h.x, h.y) + 20;
    let al = 1; if (h.die) { al = 1 - (now - h.die) / 2500; if (al <= 0) { huts[k] = null; continue; } }
    const working = [...actors.values()].some(r => r.step && r.step.site === h.k && r.step.pose === 'work');
    if (h.p < h.target && dts > 0) h.p = Math.min(h.target, h.p + dts * (working ? 1 / 10 : 1 / 45));
    const snowy = W.snow[(h.y | 0) * N + (h.x | 0)] > 0.08;
    /* a house turns its door toward the fire and the way its people walk: the drawing has the door on its left, so a house
       with the fire off to its right on screen is drawn mirrored (straight below the fire, half each way) */
    const toFire = (camp.x - camp.y) - (h.x - h.y), flip = toFire > 0.5 || (Math.abs(toFire) <= 0.5 && h.id % 2 === 1), face = im => flip ? mirrorOf(im) : im;
    if (h.was && h.p < 1) put(face(dwellImg(h.was, h.lake, snowy)), wx, wy, { scaf: h.p, alpha: al < 1 ? al : undefined, hut: h });   // lived in while it is rebuilt around them
    else put(face(dwellImg(h.kind, h.lake, snowy)), wx, wy, { build: h.p < 1 ? h.p : undefined, alpha: al < 1 ? al : undefined, hut: h });
  }
  for (let k = huts.length - 1; k >= 0 && !huts[k]; k--) huts.pop();
  for (const g of graves) { const wx = isoX(g.x, g.y), wy = isoY(g.x, g.y); if (vis(wx, wy)) put(A.grave, wx, wy + 4, { alpha: clamp((now - g.born) / 3000, 0, 1) }); }
  const fireLit = campOn && T0.skills.fire && (S.t - (T0.fireT || -9) < 0.12 || dark > 0.2);
  if (fireLit) {
    const wx = isoX(fire.x, fire.y), wy = isoY(fire.x, fire.y);
    put(A.fire[((t / 170) | 0) % 2], wx, wy + 2);
    if (dts > 0 && Math.random() < dts * 1.5) spawn('smoke', wx + R(-2, 2), wy - 14, { vy: -0.02, vx: 0.004, max: 2600, s: 2 });
    if (dts > 0 && Math.random() < dts * 1.2) spawn('ember', wx + R(-3, 3), wy - 10, { vy: -0.03, vx: R(-0.005, 0.005), max: 900 });
  }
  // ---- creatures
  const u2 = paused ? u : u;
  for (const r of actors.values()) {
    if (r.held) { r.pose = 'held'; } else { const s = stepAt(r, u2, dts); r.step = s; r.pose = s ? s.pose : 'idle'; }
    if (r.carriedBy) { const m = recOf(r.carriedBy); if (m && !m.dead) { r.x = m.x; r.y = m.y; r.pose = m.pose === 'hidden' ? 'hidden' : 'carried'; } else { r.carriedBy = 0; r.pose = 'sit'; } }
  }
  // keep out of each other's way: bodies push gently apart
  const bins = new Map();
  for (const r of actors.values()) {
    if (r.dead && r.dead.shown || r.pose === 'hidden' || r.pose === 'carried' || r.held) continue;
    const key = ((r.x + r.ox) | 0) + ',' + ((r.y + r.oy) | 0);
    let b = bins.get(key);
    if (!b) bins.set(key, b = []);
    b.push(r);
  }
  for (const r of actors.values()) {
    r.ox *= 0.985; r.oy *= 0.985; if (!bins.size) break; const bx0 = (r.x + r.ox) | 0, by0 = (r.y + r.oy) | 0, rr = BODY[kind(r.a)];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const b = bins.get((bx0 + dx) + ',' + (by0 + dy));
      if (!b) continue;
      for (const o of b) {
        if (o === r) continue;
        const ddx = (r.x + r.ox) - (o.x + o.ox), ddy = (r.y + r.oy) - (o.y + o.oy), d = Math.hypot(ddx, ddy), m = rr + BODY[kind(o.a)];
        if (d < m && d > 1e-4) {
          const push = (m - d) * 0.12;
          r.ox += ddx / d * push;
          r.oy += ddy / d * push;
        }
      }
    }
    r.ox = clamp(r.ox, -0.8, 0.8); r.oy = clamp(r.oy, -0.8, 0.8);
  }
  const babies = new Map(); for (const r of actors.values()) if (r.pose === 'carried') babies.set(r.carriedBy, r);
  for (const [id, r] of actors) {
    const a = r.a, pose = r.pose;
    if (r.dead) {
      if (!r.dead.shown && u >= (r.dead.u || 0)) {
        r.dead.shown = true;
        r.dead.t = gameMs;
        if (r.dead.why === 'eaten' || r.dead.why === 'hunted' || r.dead.why === 'killed by people') burst(r.x, r.y, 'blood', 5);
        if (r.dead.why === 'drowned') ripples.push({ x: isoX(r.x, r.y), y: isoY(r.x, r.y), t: now });
      }
      if (r.dead.shown) {
        const age = gameMs - r.dead.t, big = a.d.mass > 2, life = r.dead.why === 'eaten' ? 50000 : r.dead.why === 'struck' && !a.d.people ? 900 : 30000;
        if (age > life) {
          actors.delete(id);
          if (big) relics.push({ x: r.x, y: r.y, t: gameMs });
          continue;
        }
        r.alpha = clamp(1 - (age - life * 0.6) / (life * 0.4), 0, 1);
      }
    } else if (r.alpha < 1) r.alpha = Math.min(1, r.alpha + dtMs / 1500);
    if (pose === 'hidden' || pose === 'carried') continue;
    const x = r.x + r.ox, y = r.y + r.oy, wx = isoX(x, y), wy = isoY(x, y); if (!vis(wx, wy)) continue;
    const L = lookOf(a), dd = a.d, k = kind(a); let set = L.grown;
    if (dd.people) { if (a.age < 2 && L.baby) set = null; else if (a.age < SMALL && L.tot) set = L.tot; else if (a.age < dd.mature) set = L.young; else if (L.old && a.age > 46) set = L.old; }
    else if (a.age < dd.mature * 0.75) set = L.young;
    if (!set) { const b = L.baby[a.id % L.baby.length]; put(b, wx, wy, { shadow: { x: wx, y: wy, w: b.width }, alpha: r.alpha < 1 ? r.alpha : undefined }); continue; }
    // people drawn from sheets are put together one by one from their own looks; otherwise one of the built-in variants is picked
    const sp = dd.people && L.make ? L.make(a, set === L.tot ? 'tot' : set === L.young ? 'young' : set === L.old ? 'old' : 'grown')
      : set[(dd.people && a.fem !== undefined && (set === L.grown || set === L.old) ? ((a.id % 6) * 2 + (a.fem ? 1 : 0)) : a.id) % set.length]; let face = r.face;
    const s = r.step; let look = null;
    if (s && s.at) { const o = recOf(s.at); if (o) look = o; } else if (s && s.lx !== undefined) look = { x: s.lx, y: s.ly };
    if (Math.abs(r.vx - r.vy) > 0.0005 && (pose === 'walk' || pose === 'run' || pose === 'hop' || pose === 'carry' || pose === 'creep' || pose === 'crawl')) face = (r.vx - r.vy) > 0 ? 'r' : 'l';
    else if (look) { const ddx = (look.x - look.y) - (r.x - r.y); if (Math.abs(ddx) > 0.05) face = ddx > 0 ? 'r' : 'l'; }
    r.face = face;
    let im = sp[face][0], lift = 0, sq = 0, extra = {};
    const moving = r.spd > 0.05 && (pose === 'walk' || pose === 'run' || pose === 'hop' || pose === 'carry' || pose === 'creep' || pose === 'crawl' || (s && s.t === 'f'));
    const nf = sp.r.length, fr = moving ? ((r.odo * STEPS[k] * (nf / 2) * (pose === 'run' ? 0.8 : 1)) | 0) % nf : 0;   // sheets may carry more than two walking frames
    switch (pose) {
      case 'walk': case 'run': case 'creep':
      im = sp[face][fr];
      if (pose === 'run' && k !== 'person') lift = fr ? 1 : 0;
      if (moving && k === 'small') lift = Math.round(Math.abs(Math.sin(r.odo * Math.PI * 2.2)) * 3);
      break;
      case 'hop':
      im = sp[face][fr];
      if (moving) lift = Math.round(Math.abs(Math.sin(r.odo * Math.PI * (k === 'person' ? 1.6 : 2.2))) * (k === 'person' ? 4 : 3));
      else if (s && s.t === 's' && s.u1 - s.u0 < 0.06) lift = Math.round(Math.abs(Math.sin(gameMs / 120)) * 3);
      break;
      case 'carry': im = sp.up ? (fr && sp.upB ? sp.upB[face] : sp.up[face]) : sp[face][fr]; extra.item = s && s.item; break;
      case 'graze':
      if (sp.graze) im = sp.graze[face][Math.sin(gameMs / 420 + id) > 0.35 ? 1 : 0]; else {
        im = sp[face][0];
        sq = Math.sin(gameMs / 420 + id) > 0.35 ? 1 : 0;
      }
      if (dts > 0 && Math.random() < dts * 0.5) spawn('grass', wx + (face === 'r' ? 1 : -1) * sp.w * 0.35, wy - 3, { vy: -0.02, vx: R(-0.01, 0.01), g: 0.0001, max: 500, floor: wy });
      break;
      case 'feed':
      im = sp[face][0];
      sq = Math.sin(gameMs / 260 + id) > 0 ? 1 : 0;
      if (dts > 0 && Math.random() < dts * 0.6) spawn('blood', wx + (face === 'r' ? 1 : -1) * sp.w * 0.4, wy - 3, { vy: -0.02, g: 0.0002, max: 400, floor: wy });
      break;
      case 'lie': case 'dead':
      im = sp.lie ? sp.lie[face] : sp.sit ? sp.sit[face] : sp[face][0];
      if (pose === 'lie' && s && s.zz && dts > 0 && Math.random() < dts * 0.35) spawn('zz', wx + 6, wy - im.height, { vy: -0.012, vx: 0.006, max: 1800, z: 1 });
      break;
      case 'sit':
      im = sp.sit ? sp.sit[face] : sp.lie ? sp.lie[face] : sp[face][0];
      if (s && s.zz && dts > 0 && Math.random() < dts * 0.35) spawn('zz', wx + 6, wy - im.height, { vy: -0.012, vx: 0.006, max: 1800, z: 1 });
      if (s && s.chat && Math.random() < dts * 0.04) say2(r, 'chat');
      if (s && s.play && Math.random() < dts * 0.05) say2(r, 'play');
      break;
      case 'work': {
        const ph = ((gameMs / 380 + id) | 0) % 2; im = ph && sp.up ? sp.up[face] : sp[face][0]; if (!sp.up) sq = ph;
        const fx = s && s.fx;
        if (fx && ph && dts > 0 && Math.random() < dts * 3) {
          const lx = s.lx !== undefined ? isoX(s.lx, s.ly) : wx, ly = s.lx !== undefined ? isoY(s.lx, s.ly) : wy;
          spawn(fx === 'hammer' ? 'chips' : fx, lerp(wx, lx, 0.6) + R(-4, 4), (fx === 'fruit' ? ly - 40 : lerp(wy, ly, 0.6)) - R(2, 10), { vx: R(-0.03, 0.03),
            vy: fx === 'fruit' ? 0.01 : -0.05,
            g: 0.00022,
            max: 700,
            floor: wy });
        }
        if (s && s.shake !== undefined) { const p = props.get('t' + s.shake); if (p) p.pop = now - 200; }
        break;
      }
      case 'fish': im = sp[face][0]; extra.rod = { face, catch: s && s.catch, id }; break;
      case 'look': im = sp[face][0]; break;
      case 'enter': { const k2 = s ? clamp((u - s.u0) / Math.max(1e-4, s.u1 - s.u0), 0, 1) : 1; extra.alpha = 1 - k2; sq = Math.round(k2 * im.height * 0.5); break; }
      case 'emerge': { const k2 = s ? clamp((u - s.u0) / Math.max(1e-4, s.u1 - s.u0), 0, 1) : 1; extra.alpha = k2; sq = Math.round((1 - k2) * im.height * 0.5); break; }
      case 'held': im = sp[face][((now / 90) | 0) % 2]; lift = 16; break;
      case 'crawl': im = sp.sit ? sp.sit[face] : im; lift = moving ? (((r.odo * 6) | 0) % 2) : 0; break;
      default: im = sp[face][0];
    }
    // the newborn and the newly arrived ease into view
    let al = r.alpha; if (r.newborn) { const k2 = clamp((now - r.born) / 1400, 0, 1); if (k2 >= 1) r.newborn = 0; extra.grow = 0.45 + 0.55 * ease(k2); }
    /* children grow a little every year, not only when they move up to the next size of sprite */
    { const ag = r.a.age, dd = r.a.d; if (dd.people && ag >= 2 && ag < dd.mature) extra.grow = (extra.grow || 1) * (ag < SMALL ? 0.8 + 0.2 * (ag - 2) / (SMALL - 2) : 0.8 + 0.2 * (ag - SMALL) / (dd.mature - SMALL)); }
    if (extra.alpha !== undefined) al = Math.min(al, extra.alpha);
    al *= knownAt(r.x, r.y); if (al < 0.02) continue;
    if (s && s.cart && A.cart) extra.cart = face;
    const d = put(im, wx, wy - lift, Object.assign(extra, { y: wy,
      shadow: { x: wx,
        y: wy,
        w: sp.w,
        lifted: lift > 4 },
      alpha: al < 1 ? al : undefined,
      sq,
      bub: now - r.bubT < 4200 && now >= r.bubT ? r.bub : '',
      bx: wx,
      dead: pose === 'dead' }));
    if (babies.has(id)) {
      const b = L.baby ? L.baby[babies.get(id).a.id % L.baby.length] : null;
      if (b) d.baby = { img: b, x: wx + (face === 'r' ? -9 : 9) - b.width / 2, y: wy - im.height * 0.55 - lift - (pose === 'sit' ? -6 : 0) };
    }
    if (dd.people && moving && dts > 0) { const ci = (y | 0) * N + (x | 0); if (ci >= 0 && ci < N * N) trail[ci] = Math.min(1.2, trail[ci] + dts * 0.012); }
  }
  for (let k = relics.length - 1; k >= 0; k--) {
    const r = relics[k], age = gameMs - r.t;
    if (age > 240000) {
      relics.splice(k, 1);
      continue;
    }
    put(A.bones, isoX(r.x, r.y), isoY(r.x, r.y) + 2, { alpha: clamp(1 - (age - 200000) / 40000, 0, 1), y: isoY(r.x, r.y) - 6 });
  }
  // a crown that hides a creature turns glassy, so nothing is lost in the woods
  if (z / dpr > 0.5) {
    const live = draws.filter(d => d.shadow);
    for (const d of draws) if (d.tree) {
      const x0 = d.x + 6, x1 = d.x + d.img.width - 6, y0 = d.top + 4, y1 = d.y - 14;
      for (const a of live) if (a.y < d.y && a.shadow.x > x0 && a.shadow.x < x1 && a.y > y0 && a.top < y1) {
        d.alpha = Math.min(d.alpha === undefined ? 1 : d.alpha, 0.38);
        break;
      }
    }
  }
  draws.sort((p, q) => p.y - q.y);
  const wind = S.precip > 0 ? 2 : 1;
  for (const d of draws) {
    if (d.shadow && !d.dead) {
      cx.fillStyle = d.shadow.lifted ? 'rgba(20,30,20,.18)' : 'rgba(20,30,20,.28)';
      const sw = Math.round(d.shadow.w * 0.62);
      cx.globalAlpha = d.alpha === undefined ? 1 : d.alpha;
      cx.fillRect(Math.round(d.shadow.x - sw / 2), Math.round(d.shadow.y - 2), sw, 3);
      cx.fillRect(Math.round(d.shadow.x - sw / 2) + 2, Math.round(d.shadow.y - 3), sw - 4, 5);
      cx.globalAlpha = 1;
    }
    const al = d.alpha === undefined ? 1 : d.alpha, im = d.img, w = im.width, h = im.height;
    if (d.prev) { cx.globalAlpha = al; drawSway(d.prev, d, wind); cx.globalAlpha = al * ease(d.swapK); drawSway(im, d, wind); cx.globalAlpha = 1; }
    else if (d.build !== undefined) drawBuilding(d);
    else if (d.scaf !== undefined) { cx.globalAlpha = al; cx.drawImage(d.img, d.x, d.top); drawScaffold(d); cx.globalAlpha = 1; }
    else {
      cx.globalAlpha = al;
      if (d.dead) d.img = greyOf(im);
      if (d.grow !== undefined) { const gw = Math.round(w * d.grow), gh = Math.round(h * d.grow); cx.drawImage(im, Math.round(d.x + (w - gw) / 2), d.top + h - gh, gw, gh); }
      else if (d.pop !== undefined) {
        const e = Math.sin(d.pop * Math.PI) * 0.08, gw = Math.round(w * (1 + e)), gh = Math.round(h * (1 - e));
        cx.drawImage(im, Math.round(d.x + (w - gw) / 2), d.top + h - gh, gw, gh);
      }
      else if (d.sq) cx.drawImage(im, 0, 0, w, h - d.sq, d.x, d.top + d.sq, w, h - d.sq);
      else if (d.sway >= 0) drawSway(im, d, wind);
      else cx.drawImage(d.img, d.x, d.top);
      cx.globalAlpha = 1;
    }
    if (d.cart) { const ci = d.cart === 'r' ? A.cart : A.cartL; cx.drawImage(ci, d.cart === 'r' ? d.x - ci.width + 6 : d.x + w - 6, d.top + h - ci.height + 2); }
    if (d.item) { const it = A.item[d.item]; if (it) cx.drawImage(it, Math.round(d.x + w / 2 - it.width / 2), d.top - it.height + 3); }
    if (d.baby) cx.drawImage(d.baby.img, Math.round(d.baby.x), Math.round(d.baby.y));
    if (d.rod) drawRod(d);
    if (d.peek) {
      let n = 0;
      for (const r of actors.values()) if (r.pose === 'hidden' && r.a.home === d.peek.home && !r.a.d.eats.meat) n++;
      if (n && ((t / 2200 + d.peek.home) | 0) % 3 !== 0) cx.drawImage(A.peek, Math.round(d.peek.x - 5), Math.round(d.peek.y - 4));
    }
    if (d.eyes) {
      let n = 0;
      for (const r of actors.values()) if (r.pose === 'hidden' && r.a.home === d.eyes.home) n++;
      if (n) {
        cx.fillStyle = '#f2d24a';
        const blink = ((t / 3100) | 0) % 5 === 0;
        if (!blink) for (let q = 0; q < Math.min(3, n); q++) {
          const ex = Math.round(d.eyes.x - 6 + q * 6), ey = Math.round(d.eyes.y + (q % 2) * 3);
          cx.fillRect(ex, ey, 1, 1);
          cx.fillRect(ex + 3, ey, 1, 1);
        }
      }
    }
    if (d.hut) {
      let n = 0;
      for (const r of actors.values()) if (r.pose === 'hidden' && r.step && r.step.hut === d.hut.k + 1) n++;
      d.hut.sleepers = n;
      if (n && dts > 0 && Math.random() < dts * 0.4) spawn('zz', d.x + w * 0.7, d.top + 8, { vy: -0.012, vx: 0.006, max: 2000, z: 1 });
    }
  }
  // ---- particles
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k]; p.life += dts * 1000; if (p.life > p.max) { parts.splice(k, 1); continue; }
    const st = dts * 1000; p.vy += p.g * st; p.x += p.vx * st; p.y += p.vy * st;
    if (p.leaf) p.x += Math.sin(p.life / 300) * 0.3;
    if (p.floor !== undefined && p.y > p.floor && p.vy > 0) { p.y = p.floor; p.vx *= 0.5; p.vy = 0; p.g = 0; }
    const fade = 1 - p.life / p.max; cx.globalAlpha = clamp(fade * 1.5, 0, 1);
    if (p.z) { cx.fillStyle = '#e8ecff'; const zx = Math.round(p.x), zy = Math.round(p.y); cx.fillRect(zx, zy, 3, 1); cx.fillRect(zx + 1, zy + 1, 1, 1); cx.fillRect(zx, zy + 2, 3, 1); }
    else { cx.fillStyle = p.col; cx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
  }
  cx.globalAlpha = 1;
  // ---- small life: fish jumping, butterflies by day, fireflies by summer night, birds crossing
  if (dts > 0) {
    if (Math.random() < dts * 0.5) {
      for (let tries = 0; tries < 8; tries++) {
        const i = (Math.random() * N * N) | 0;
        if (W.water[i] && W.fish[i] > 0.3 && W.tempAt(i) > -3) {
          const x = i % N + Math.random(), y = ((i / N) | 0) + Math.random(), wx = isoX(x, y), wy = isoY(x, y);
          if (!vis(wx, wy)) continue;
          spawn('splash', wx, wy - 2, { vx: R(-0.02, 0.02), vy: -0.09, g: 0.0004, max: 520, floor: wy, s: 2, col: '#6f9db8' });
          setTimeout(() => ripples.push({ x: wx, y: wy, t: now }), 450);
          break;
        }
      }
    }
    const warmDay = S.air > 12 && dark < 0.3, summerNight = S.air > 13 && dark > 0.6;
    while (flies.length < (warmDay ? 7 : summerNight ? 14 : 0)) {
      const q = near(camp.x + R(-8, 8), camp.y + R(-8, 8), 2);
      flies.push({ x: isoX(q.x, q.y), y: isoY(q.x, q.y) - R(6, 20), a: Math.random() * 6, kind: warmDay ? 'b' : 'f', col: ['#fbf4e2', '#f3d24f', '#e08fb8', '#9fd3f0'][(Math.random() * 4) | 0] });
    }
    if (!warmDay && !summerNight) flies.length = 0;
    flock.next -= dts * 1000;
    if (flock.next < 0 && dark < 0.5) {
      flock.next = R(25000, 60000);
      const y0 = cam.y + R(0, vh * 0.6), dir = Math.random() < 0.5 ? 1 : -1;
      flock.list = [];
      for (let k = 0; k < 3 + ((Math.random() * 4) | 0); k++) flock.list.push({ x: (dir > 0 ? cam.x - 40 : cam.x + vw + 40) - dir * k * 14, y: y0 + Math.abs(k - 2) * 8 + k * 3, dir });
    }
  }
  for (const f of flies) {
    if (dts > 0) { f.a += R(-0.4, 0.4); f.x += Math.cos(f.a) * dts * 14; f.y += Math.sin(f.a) * dts * 7; }
    if (f.kind === 'b') {
      cx.fillStyle = f.col;
      const w = ((now / 120) | 0) % 2;
      cx.fillRect(Math.round(f.x) - 1 - w, Math.round(f.y), 1 + w, 2);
      cx.fillRect(Math.round(f.x) + 1, Math.round(f.y), 1 + w, 2);
    }
    else { const g = 0.5 + 0.5 * Math.sin(now / 400 + f.a * 9); cx.fillStyle = 'rgba(230,255,140,' + g.toFixed(2) + ')'; cx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); }
  }
  for (const b of flock.list) {
    if (dts > 0) b.x += b.dir * dts * 30;
    const wf = ((now / 200 + b.x) | 0) % 2;
    cx.fillStyle = '#3a3340';
    const bx = Math.round(b.x), by = Math.round(b.y);
    cx.fillRect(bx - 2, by - wf, 2, 1);
    cx.fillRect(bx, by, 1, 1);
    cx.fillRect(bx + 1, by - wf, 2, 1);
    cx.fillStyle = 'rgba(20,30,20,.12)';
    cx.fillRect(bx - 1, by + 60, 3, 1);
  }
  // ---- thoughts, above everything; hidden when far away so the valley stays calm
  if (z / dpr > 0.42) { let shown = 0; for (const d of draws) if (d.bub && A.bubble[d.bub] && shown++ < 24) cx.drawImage(A.bubble[d.bub], Math.round(d.bx - 13), d.top - 30, 26, 28); }
  // ---- the touch of a power
  if (act && tool !== 'hand' && tool !== 'strike') {
    const c = toCell(act.x, act.y), wx = c.wx, wy = c.wy, cold = W.tempAt((c.y | 0) * N + (c.x | 0)) < 0;
    if (tool === 'rain') {
      cx.fillStyle = cold ? '#f6f9fc' : '#8fc4ea';
      for (let q = 0; q < 60; q++) {
        const a2 = hash(q, 3) * 6.28, r = Math.sqrt(hash(q, 4)) * 140, yy = ((t / (cold ? 14 : 3.5) + hash(q, 6) * 120) % 120);
        cx.fillRect(Math.round(wx + Math.cos(a2) * r), Math.round(wy - 120 + yy + Math.sin(a2) * r * 0.5), cold ? 2 : 1, cold ? 2 : 6);
      }
      const cl = cold ? A.cloud : A.cloudDark;
      cx.drawImage(cl, Math.round(wx - cl.width), Math.round(wy - 150 + Math.sin(t / 700) * 2), cl.width * 2, cl.height * 2);
      cx.globalAlpha = 0.12;
      cx.drawImage(A.shadowBlob, wx - 140, wy - 70, 280, 140);
      cx.globalAlpha = 1;
    }
    else if (tool === 'sun') {
      const pulse = 1 + Math.sin(t / 300) * 0.05;
      for (let r = 150; r > 30; r -= 30) {
        cx.fillStyle = 'rgba(255,214,90,' + (0.05 + (150 - r) * 0.0009) + ')';
        cx.beginPath();
        cx.ellipse(wx, wy, r * pulse, r * 0.5 * pulse, 0, 0, 6.3);
        cx.fill();
      }
      cx.strokeStyle = 'rgba(255,230,140,.35)';
      cx.lineWidth = 2;
      for (let q = 0; q < 8; q++) {
        const a2 = q / 8 * 6.28 + t / 2000;
        cx.beginPath();
        cx.moveTo(wx + Math.cos(a2) * 40, wy - 140 + Math.sin(a2) * 40);
        cx.lineTo(wx + Math.cos(a2) * 150, wy + Math.sin(a2) * 70);
        cx.stroke();
      }
    }
    else if (tool === 'grow') { cx.strokeStyle = 'rgba(214,245,166,.5)'; cx.lineWidth = 1; cx.beginPath(); cx.ellipse(wx, wy, 140, 70, 0, 0, 6.3); cx.stroke(); }
  }
  if (heldPile) { const im = A.item[heldPile.kind === 'wood' ? 'log' : heldPile.kind]; for (let k = 0; k < 3; k++) cx.drawImage(im, Math.round(heldPile.wx - im.width / 2 + (k - 1) * 4), Math.round(heldPile.wy - 18 - k * 3)); }
  if (bolt) {
    const age = now - bolt.t;
    if (age > 300) bolt = null; else {
      cx.strokeStyle = age < 100 ? '#fffbe0' : '#ffd95a';
      cx.lineWidth = age < 100 ? 4 : 2;
      cx.beginPath();
      let bx = bolt.x + 40, by = cam.y - 10;
      cx.moveTo(bx, by);
      const st = 10;
      for (let q = 1; q <= st; q++) {
        const ty = by + (bolt.y - by) * q / st, tx = q === st ? bolt.x : bolt.x + 40 * (1 - q / st) + (hash(q, bolt.seed) - 0.5) * 46;
        cx.lineTo(tx, ty);
      }
      cx.stroke();
    }
  }
  // ---- light: dusk, night and dawn, with the warm lights of the camp on top
  cx.setTransform(1, 0, 0, 1, 0, 0);
  const sunH = W.sunHeight(), dim = (1 - sunH) * 0.08 + (S.precip > 0 ? 0.06 : 0); if (dim > 0.01) { cx.fillStyle = 'rgba(40,60,110,' + dim.toFixed(3) + ')'; cx.fillRect(0, 0, cv.width, cv.height); }
  const duskGlow = tod > 0.55 && tod < 0.78 ? Math.sin((tod - 0.55) / 0.23 * Math.PI) : tod > 0.92 || tod < 0.06 ? Math.sin(((tod + 0.08) % 1) / 0.14 * Math.PI) * 0.7 : 0;
  if (duskGlow > 0.01) { cx.fillStyle = 'rgba(255,140,70,' + (duskGlow * 0.13 * (speed >= 8 ? 0.5 : 1)).toFixed(3) + ')'; cx.fillRect(0, 0, cv.width, cv.height); }
  if (dark > 0.01) {
    cx.fillStyle = 'rgba(18,26,62,' + (dark * 0.46).toFixed(3) + ')'; cx.fillRect(0, 0, cv.width, cv.height);
    cx.globalCompositeOperation = 'lighter'; const sx = wx => (wx - cam.x) * z, sy = wy => (wy - cam.y) * z;
    if (fireLit) {
      const r = (70 + Math.sin(t / 150) * 4) * z, fx = sx(isoX(fire.x, fire.y)), fy = sy(isoY(fire.x, fire.y)) - 6 * z;
      cx.globalAlpha = dark * 0.55;
      cx.drawImage(A.glow, fx - r, fy - r * 0.6, r * 2, r * 1.2);
    }
    for (const h of huts) if (h && h.p >= 1 && h.sleepers) {
      const r = 26 * z, hx = sx(isoX(h.x, h.y)), hy = sy(isoY(h.x, h.y)) - 4 * z;
      cx.globalAlpha = dark * 0.5;
      cx.drawImage(A.glow, hx - r, hy - r * 0.6, r * 2, r * 1.2);
    }
    cx.globalAlpha = dark; for (const f of flies) if (f.kind === 'f') { const r = 5 * z; cx.drawImage(A.glow, sx(f.x) - r, sy(f.y) - r, r * 2, r * 2); }
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  }
  if (S.air > 24) { cx.fillStyle = 'rgba(255,170,60,' + clamp((S.air - 24) * 0.012, 0, 0.14).toFixed(3) + ')'; cx.fillRect(0, 0, cv.width, cv.height); }
  if (bolt && now - bolt.t < 80) { cx.fillStyle = 'rgba(255,255,230,.3)'; cx.fillRect(0, 0, cv.width, cv.height); }
  if (S.precip > 0 && !paused) {
    const snowing = S.sky === 'snow', n = snowing ? 60 : 70, uu = Math.max(1, Math.round(dpr * 1.2)); cx.fillStyle = snowing ? 'rgba(250,252,255,.85)' : 'rgba(170,205,235,.55)';
    for (let q = 0; q < n; q++) {
      const fall = snowing ? 0.04 : 0.6,
        yy = ((t * fall * dpr + hash(q, 21) * cv.height * 2) % (cv.height + 40)) - 20,
        xx = (hash(q, 22) * cv.width + (snowing ? Math.sin(t / 900 + q) * 14 * dpr : -yy * 0.16) + cv.width) % cv.width;
      cx.fillRect(xx | 0, yy | 0, uu, snowing ? uu : uu * 5);
    }
  }
}
// the fallen are drawn in faded colours; made once per sprite
const greys = new WeakMap();
function greyOf(im) {
  let g = greys.get(im);
  if (g) return g;
  g = mkC(im.width, im.height);
  const x = g.getContext('2d');
  x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, g.width, g.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const l = (a[i] * 0.3 + a[i + 1] * 0.55 + a[i + 2] * 0.15);
    a[i] = (a[i] * 0.4 + l * 0.6) * 0.78;
    a[i + 1] = (a[i + 1] * 0.4 + l * 0.6) * 0.78;
    a[i + 2] = (a[i + 2] * 0.4 + l * 0.6) * 0.8;
  }
  x.putImageData(d, 0, 0);
  greys.set(im, g);
  return g;
}
// trees sway: the crown moves a pixel in the wind while the trunk stays put
function drawSway(im, d, wind) {
  if (d.sway < 0) { cx.drawImage(im, d.x, d.top); return; }
  const w = im.width, h = im.height, cut = Math.round(h * 0.62), off = Math.round(Math.sin(now / 1500 + d.sway * 1.7) * wind * 0.8);
  cx.drawImage(im, 0, cut, w, h - cut, d.x, d.top + cut, w, h - cut); cx.drawImage(im, 0, 0, w, cut, d.x + off, d.top, w, cut);
}
// a hut going up: a ring of poles, then walls and thatch rising from the ground
function drawBuilding(d) {
  const im = d.img, w = im.width, h = im.height, p = d.build, al = d.alpha === undefined ? 1 : d.alpha, cxp = Math.round(d.x + w / 2), base = d.top + h - 3;
  cx.globalAlpha = al;
  // the plot: cleared earth, a peg at each corner
  const fw = Math.round(w * 0.4), fh = fw >> 1, cy0 = base - fh, C4 = [[cxp, cy0 - fh], [cxp + fw, cy0], [cxp, cy0 + fh], [cxp - fw, cy0]];
  cx.fillStyle = '#a5825a'; cx.beginPath(); cx.moveTo(C4[0][0], C4[0][1]); for (const q of C4) cx.lineTo(q[0], q[1]); cx.closePath(); cx.fill();
  cx.strokeStyle = '#6e5137'; cx.lineWidth = 1; cx.stroke();
  cx.fillStyle = '#5a3f2a'; for (const q of C4) cx.fillRect(q[0] - 1, q[1] - 5, 2, 6);
  // the frame: a post at each corner, then the plates that tie their tops together
  const k1 = clamp((p - 0.06) / 0.28, 0, 1), k2 = clamp((p - 0.36) / 0.64, 0, 1), ph = Math.round(h * 0.4 * Math.min(1, k1 * 1.4));
  if (k1 > 0 && k2 < 0.75) {
    cx.fillStyle = '#8a6a48'; for (const q of C4) cx.fillRect(q[0] - 1, q[1] - ph, 3, ph);
    if (k1 > 0.72) {
      cx.strokeStyle = '#6e5137';
      cx.lineWidth = 2;
      cx.beginPath();
      cx.moveTo(C4[3][0], C4[3][1] - ph);
      cx.lineTo(C4[0][0], C4[0][1] - ph);
      cx.lineTo(C4[1][0], C4[1][1] - ph);
      cx.lineTo(C4[2][0], C4[2][1] - ph);
      cx.closePath();
      cx.stroke();
    }
  }
  // walls, then the roof, rise from the ground
  const sh = Math.round(h * k2); if (sh > 0) cx.drawImage(im, 0, h - sh, w, sh, d.x, d.top + h - sh, w, sh);
  drawPiles(d, cxp + fw - 6, cy0 + fh - 4);
  cx.globalAlpha = 1;
}
// timber and stone waiting on the plot
function drawPiles(d, px, py) {
  const logs = d.hut ? Math.min(4, Math.ceil(d.hut.wood || 0)) : 0, stones = d.hut ? Math.min(4, Math.ceil(d.hut.stone || 0)) : 0;
  for (let q = 0; q < logs; q++) cx.drawImage(A.item.log, px + (q % 2) * 4, py - (q >> 1) * 3);
  for (let q = 0; q < stones; q++) cx.drawImage(A.item.stone, px - 12 - (q % 2) * 5, py + 1 - (q >> 1) * 3);
}
// a dwelling being rebuilt around the people in it: poles up the sides, planks rising with the work
function drawScaffold(d) {
  const w = d.img.width, h = d.img.height, base = d.top + h - 3, top = Math.round(base - h * 0.85 * Math.max(0.15, d.scaf));
  cx.fillStyle = '#6e5137'; for (const px of [d.x + 3, d.x + w - 5]) cx.fillRect(px, top, 2, base - top);
  cx.fillStyle = '#a8855c'; for (let yy = base - 10; yy > top; yy -= 12) cx.fillRect(d.x + 3, yy, w - 6, 2);
  drawPiles(d, d.x + w - 8, base - 2);
}
// a fishing rod and line out to a bobbing float; now and then a fish comes up on it
function drawRod(d) {
  const dir = d.rod.face === 'r' ? 1 : -1,
    hx = Math.round(d.x + d.img.width / 2 + dir * 8),
    hy = d.top + 18,
    tx = hx + dir * 16,
    ty = d.top + 2,
    fx = hx + dir * 30,
    fy = d.y + 4 + Math.round(Math.sin(now / 500 + d.rod.id) * 1);
  cx.strokeStyle = '#7a5a3a'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(hx, hy); cx.lineTo(tx, ty); cx.stroke();
  cx.strokeStyle = 'rgba(240,240,230,.7)'; cx.beginPath(); cx.moveTo(tx, ty); cx.quadraticCurveTo(tx + dir * 8, fy - 6, fx, fy); cx.stroke();
  const tug = d.rod.catch && ((now / 2600 + d.rod.id) | 0) % 3 === 0; cx.fillStyle = '#d8402f'; cx.fillRect(fx - 1, fy - (tug ? 0 : 1), 2, 2);
  if (tug && Math.random() < 0.04) { spawn('splash', fx, fy, { vx: R(-0.02, 0.02), vy: -0.06, g: 0.0003, max: 400, floor: fy }); ripples.push({ x: fx, y: fy, t: now, small: 1 }); }
}

// ================================================================== the few controls there are
const tools = document.getElementById('tools');
for (const [id, label] of [['hand', 'Hand'], ['rain', 'Rain'], ['sun', 'Sun'], ['grow', 'Grow'], ['strike', 'Strike']]) {
  const b = document.createElement('button');
  b.className = 'tool' + (id === tool ? ' sel' : '');
  b.dataset.t = id;
  const c = document.createElement('canvas');
  c.width = 12;
  c.height = 12;
  c.getContext('2d').drawImage(A.tool[id], 0, 0);
  b.appendChild(c);
  b.appendChild(document.createTextNode(label));
  b.onclick = () => { tool = id; for (const q of tools.children) q.classList.toggle('sel', q.dataset.t === id); }; tools.appendChild(b);
}
const bS2 = document.getElementById('bSpeed'), SPEEDS = [1, 4, 16, 48, 0];
bS2.onclick = () => {
  speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
  bS2.textContent = speed === 0 ? 'II' : speed + 'x';
};
{
  const el = document.getElementById('lands');
  if (el) for (const k in W.LANDS) {
    const b = document.createElement('button');
    b.className = 'btn land' + (k === W.land ? ' sel' : '');
    b.textContent = k;
    b.onclick = () => {
      try {
        localStorage.setItem('eden.land', k);
      } catch (e) { /* ignore */ }
      if (window.EDEN_EMBED) {
        location.reload();
        return;
      }
      const q = new URLSearchParams(location.search);
      q.set('land', k);
      location.search = q.toString();
    };
    el.appendChild(b);
  }
}
// what the place has become and what its people know: a panel that opens from the corner
{ const el = document.getElementById('know'), btn = document.getElementById('bKnow');
  const fill = () => {
    const names = ['A camp', 'A hamlet', 'A village', 'A town'], jobs = {};
    let grown = 0;
    for (const a of S.agents) if (a.alive && a.d.people) {
      if (a.age >= a.d.mature) grown++;
      if (a.job) jobs[a.job] = (jobs[a.job] || 0) + 1;
    }
    const ideas = W.ideas(), known = ideas.filter(q => q.known).map(q => q.k).concat(['herd'].filter(k => T0.skills[k]));
    const WANT = { cold: 'cold',
      hunger: 'hunger',
      spoil: 'food rotting',
      water: 'water far off',
      danger: 'wolves',
      flood: 'floods',
      toil: 'heavy loads',
      crowd: 'no roof',
      loss: 'deaths',
      reckon: 'too much to keep track of' };
    const felt = Object.keys(T0.need).filter(k => T0.need[k] > 0.15).sort((p, q) => T0.need[q] - T0.need[p]);
    const bar = v => '<span style="display:inline-block;height:6px;width:' + Math.round(Math.min(1, v / 3) * 70 + 4) + 'px;background:#b8453a;border-radius:2px;vertical-align:middle"></span>';
    const near = ideas.filter(q => q.can).sort((p, q) => (T0.need[q.need] / q.at) - (T0.need[p.need] / p.at)).slice(0, 4);
    el.innerHTML = '<b>' + names[T0.level] + ' of ' + S.popPeople + '</b>, year ' + Math.floor(S.t) + '<br>' + T0.huts + ' roofs' + (T0.wall ? (T0.wall.done
        ? ', fenced' : ', fence going up') : '') + (T0.carts ? ', ' + T0.carts + ' cart' + (T0.carts > 1 ? 's' : '') : '')
      + '<p><b>What weighs on them</b><br>' + (felt.length ? felt.map(k => bar(T0.need[k]) + ' ' + WANT[k]).join('<br>') : 'nothing much: a good season') + '</p>'
      + '<p><b>Trades</b><br>' + (Object.keys(jobs).length ? Object.keys(jobs).map(k => jobs[k] + ' ' + k + (jobs[k] > 1 ? 's' : '')).join(', ') : 'none: every hand is needed for food') + '</p>'
      + '<p><b>Worked out so far</b><br>' + (known.join(', ') || 'only what they came with') + '</p>'
      + (near.length ? '<p><b>Would come, if the want grew</b><br>' + near.map(q => q.k + ' (from ' + WANT[q.need] + ', ' + Math.min(99,
          Math.round(100 * T0.need[q.need] / q.at)) + '%)').join('<br>') + '</p>' : '');
  };
  if (el && btn) {
    btn.onclick = () => {
      const open = el.style.display !== 'block';
      el.style.display = open ? 'block' : 'none';
      if (open) fill();
    };
    setInterval(() => {
      if (el.style.display === 'block') fill();
    }, 1500);
  } }
document.getElementById('begin').onclick = () => { document.getElementById('intro').style.display = 'none'; paused = false; };
{ const c = document.getElementById('cont'); let has = false; try { has = !!localStorage.getItem('eden.save'); } catch (e) { /* no storage */ }
  if (c && has && !loaded) { c.style.display = 'block'; c.onclick = () => { try { sessionStorage.setItem('eden.continue', '1'); } catch (e) { /* ignore */ } location.reload(); }; } }
if (loaded) { const b = document.getElementById('begin'); if (b) b.textContent = 'Carry on'; }
document.getElementById('bHelp').onclick = () => { document.getElementById('intro').style.display = 'flex'; paused = true; };
addEventListener('resize', resize); resize();
cam.z = clamp(dpr * 1.1, minZ(), maxZ()); { const wx = isoX(camp.x, camp.y), wy = isoY(camp.x, camp.y); cam.x = wx - cv.width / cam.z / 2; cam.y = wy - 30 - cv.height / cam.z / 2; clampCam(); }
for (const a of S.agents) if (a.alive) { const e = endOf(a); newRec(a, e.x, e.y); }
huts.length = 0; onTick();
syncCrossings(); startPaint(); paintSome(1e9, true); for (const p of props.values()) p.born = -1e9;
window.EdenGame = { W, cam, actors, props, huts, isoX, isoY, setTool: t => {
    tool = t;
  }, start: () => {
    document.getElementById('intro').style.display = 'none';
    paused = false;
  }, setSpeed: s => {
    speed = s;
  }, clampCam, sync: onTick, A, get tickFrac() {
    return tickFrac;
  }, set tickFrac(v) {
    tickFrac = v;
  }, parts, flies, scar, bSc, colorAt, repaintCells, chunks, paintCounts: () => ({ repaints: chunkRepaints, skips: chunkSkips }),
  groundBytes: () => chunks.reduce((t, c) => t + (c.cv ? CW * CHT * 4 : 0), 0) + fadePool.length * CW * CHT * 4 + CW * CHT * 4 + 10 * CB * CB * 4 + 2 * NT * NT + 4 * 4 * N * N,
  /* the ground as the chunks hold it, laid into one world-sized picture, and how many pixels differ from colorAt (a test) */
  groundCheck() { paint = null; startPaint(); paintSome(1e9, true); const c = mkC(WW, WH), x = c.getContext('2d'); for (const ch of chunks) if (ch.cv) x.drawImage(ch.cv, ch.ox, ch.oy); const d = new Uint32Array(x.getImageData(0, 0, WW, WH).data.buffer); let bad = 0, ex = ''; for (let py = 0; py < WH; py += 3) for (let pxx = 0; pxx < WW; pxx += 3) { const ck = chunkOfPixel(pxx, py); if (ck >= 0 && cbFor !== chunks[ck]) chunkFields(chunks[ck]); const want = colorAt(pxx, py) >>> 0, got = d[py * WW + pxx] >>> 0; if (want !== got && !(want === 0 && (got >>> 24) === 0)) { bad++; if (!ex) ex = pxx + ',' + py + ' want ' + want.toString(16) + ' got ' + got.toString(16); } } return { bad, ex }; } };
requestAnimationFrame(t => { now = t; frame(t); });
})();
