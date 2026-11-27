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
const landQ = qs.get('land') || landKept || 'wide';
let bandsKept = 0; try { bandsKept = +localStorage.getItem('eden.bands') || 0; } catch (e) { /* no storage */ }
const bandsQ = Math.max(1, Math.min(6, +(qs.get('bands') || bandsKept || 1)));   /* how many bands of people begin on the land */
/* a saved valley is taken up again when the opening card's Continue was pressed (or ?continue=1); otherwise a new one is made */
let saved = null;
try {
  if (qs.get('continue') === '1' || sessionStorage.getItem('eden.continue')) {
    saved = localStorage.getItem('eden.save');
    sessionStorage.removeItem('eden.continue');
  }
} catch (e) { /* no storage */ }
let loaded = null; if (saved) { try { loaded = Eden.load(saved); } catch (e) { console.warn('the saved valley could not be loaded; starting a new one', e); } }
/* a turn of the seasons takes up to this many times as long as a year of a life (midsummer); winter keeps its old length */
const yearQ = clamp(+(qs.get('yearK') || 3), 1, 8);
const sizeQ = clamp(+(qs.get('size') || (landQ === 'wide' ? 192 : 96)), 24, 256);   /* the wide country is four times the ground of the others */   /* the map, in tiles a side */
const W = loaded || Eden.create(seed, { resettle: true, startT: 0.3, dayCycle: DAY, family: true, land: landQ, size: sizeQ, yearK: yearQ, age: 'wood', human: 6, bands: bandsQ }), N = W.N, S = W.S, A = EdenArt.build();
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
let T0 = S.tribe; const camp = { x: T0.x + 0.5, y: T0.y + 0.5 };   /* T0: the band being watched (the one whose fire is nearest the middle of the view) */
const fire = { x: camp.x + 0.55, y: camp.y + 0.15 }, store = { x: camp.x - 0.45, y: camp.y + 0.35 };
const seat = k => { const a = k * 2.1 + 0.4, r = 0.62 + (k % 3) * 0.16; return { x: fire.x + Math.cos(a) * r, y: fire.y + Math.sin(a) * r * 0.9 }; };
const campR = () => T0.sites.length > 6 ? 4.6 : 3.3;
/* every band's buildings, in a steady order (by the number each was given when begun), and every band's fence stakes as one */
const allSites = () => { const B = S.tribes; if (!B || B.length < 2) return T0.sites; const o = []; for (const b of B) for (const q of b.sites) o.push(q); return o.sort((p, q) => p.id - q.id); };
const allFence = () => { const B = S.tribes; if (!B || B.length < 2) return T0.fence; let F = null; for (const b of B) if (b.fence) { if (!F) F = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) if (b.fence[i]) F[i] = b.fence[i]; } return F; };

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
/* marks that give the ground a hand: tufts of grass (1 a lit blade, 2 the dark at its foot), short strokes of light on water
   (1 the stroke, 2 the darker line under it), and a soft patchiness for tone. All tile every NT pixels */
const tuft = new Uint8Array(NT * NT), wave = new Uint8Array(NT * NT), blot = new Uint8Array(NT * NT);
{ const put = (A, x, y, v) => { A[((y & (NT - 1)) * NT) | (x & (NT - 1))] = v; };
  for (let gy = 0; gy < NT; gy += 8) for (let gx = 0; gx < NT; gx += 16) {
    const h = hash(gx + seed, gy), h2 = hash(gy + 31, gx + seed);
    if (h < 0.5) { const x = gx + ((h2 * 12) | 0), y = gy + ((h * 2 * 5) | 0), tall = h2 > 0.5;
      put(tuft, x, y, 1); put(tuft, x + 2, y, 1); put(tuft, x + 1, y - 1, 1); if (tall) { put(tuft, x + 1, y - 2, 1); put(tuft, x + 3, y - 1, 1); }
      put(tuft, x, y + 1, 2); put(tuft, x + 1, y + 1, 2); put(tuft, x + 2, y + 1, 2); }
    if (h2 < 0.42) { const x = gx + ((h * 10) | 0), y = gy + ((h2 * 2.38 * 6) | 0), len = 3 + ((h * 97) % 5 | 0);
      for (let k = 0; k < len; k++) put(wave, x + k, y, 1); if (len > 4) { put(wave, x + len, y + 1, 1); put(wave, x + len + 1, y + 1, 1); }
      for (let k = 1; k < len - 1; k++) put(wave, x + k + 1, y + 2, 2); }
  }
  /* patchiness: coarse random values, smoothed between */
  const G = 32, M = NT / G, cell = (x, y) => hash((x % M) + 7, (y % M) + seed * 3), sm = t => t * t * (3 - 2 * t);
  for (let y = 0; y < NT; y++) for (let x = 0; x < NT; x++) { const cx = (x / G) | 0, cy = (y / G) | 0, u = sm(x / G - cx), v = sm(y / G - cy);
    blot[y * NT + x] = 255 * ((cell(cx, cy) * (1 - u) + cell(cx + 1, cy) * u) * (1 - v) + (cell(cx, cy + 1) * (1 - u) + cell(cx + 1, cy + 1) * u) * v); } }
const mulc = (c, f) => (0xff000000 | (Math.min(255, ((c >>> 16) & 255) * f) << 16) | (Math.min(255, ((c >>> 8) & 255) * f) << 8) | Math.min(255, (c & 255) * f)) >>> 0;
const rgb = h => { const n = parseInt(h.slice(1), 16); return 0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16); };
const C = {
  herb1: rgb('#f3e9b8'), herb2: rgb('#e9a3b4'), herb3: rgb('#5b78d6'), herb4: rgb('#f4f7ee'), deep: rgb('#3d7a8f'), mid: rgb('#4f93a3'), shal: rgb('#6fb0b5'), foam: rgb('#cfe9e4'), glint: rgb('#9fd3d0'), ice: rgb('#cfe6f2'), ice2: rgb('#eef7fb'), iceCrack: rgb('#a9cfe2'),
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
function syncLots() { lotMask.fill(0); for (const q of allSites()) { if (q.kind === 'tent') continue; /* a tent is pitched on the grass: only a built house marks the ground under and round it */ const well = q.kind === 'well'; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = q.x + dx, y = q.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const i = y * N + x; if (W.water[i]) continue; if (!dx && !dy) lotMask[i] = 2; else if (!well && !W.field[i]) lotMask[i] = Math.max(lotMask[i], 1); } } }
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
    /* and its slopes: ground that rises away from the light (which comes from the upper left) is lit, ground that falls away is in shade */
    const xi = fx | 0, yi = fy | 0, H = W.height, hx = H[yi * N + Math.min(N - 1, xi + 1)] - H[yi * N + Math.max(0, xi - 1)], hy = H[Math.min(N - 1, yi + 1) * N + xi] - H[Math.max(0, yi - 1) * N + xi], lit = clamp(hx * 0.28 + hy * 0.12, -1, 1);
    const h = bHt[(((fy * 8) | 0) - cby) * CB + (((fx * 8) | 0) - cbx)], f = clamp(0.84 + 0.035 * h, 0.8, 1.22) * (1 + 0.2 * lit);
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
    else { /* clean bands by depth, a broken ripple line off the shore, and strokes of light on open water */
      const w0 = bWt[b], wv = wave[p];
      col = w < 0.57 ? C.foam : w0 > 0.88 ? C.deep : w0 > 0.7 ? C.mid : C.shal;
      if (w >= 0.57) { if (w0 > 0.63 && w0 < 0.655 && blot[p] > 96) col = C.glint;
        else if (wv === 2 && w0 > 0.7) col = mulc(col, 0.93); } }   /* the strokes of light themselves move: drawFlow */
    if (bS[b] * 3 > 0.6 && T < -3 && n > 110) col = C.snow;
    return col;
  }
  if (w > 0.455) return C.bankLine;
  const m = bM[b] + jn * 0.18, g = bG[b];
  col = m < 0.28 ? (n2 > 215 ? C.dry2 : C.dry1) : m < 0.78 ? (n2 > 215 ? C.earth2 : C.earth1) : m < 1.08 ? (n2 > 215 ? C.wet2 : C.wet1) : (n2 > 150 ? C.puddle2 : C.puddle);
  if (w > 0.36) col = m > 0.85 ? C.sandWet : C.sand;
  else if (T0.ditch && T0.ditch[ci] && (((pxx + py * 2) >> 2) & 3) === 1) col = n2 > 160 ? C.puddle2 : C.puddle;   /* a ditch, water running in its cut (F7) */
  else if (W.field[ci]) {
    const row = ((pxx + py * 2) >> 2) & 3; col = row === 0 ? C.furrow : C.tilled;
    if (row !== 0 && g * 1.5 + jn * 0.4 > 0.35) col = gRipe > 0.8 ? C.crop3 : gRipe > 0.45 ? C.crop2 : gRipe > 0 ? C.crop1 : C.stubble;
  } else if (g * 1.6 + jn * 0.22 > 0.3 && m < 1.12) {
    const patch = bFe[b] + jn * 0.08 > 0.72;
    if (T < 0) col = patch ? C.froB : C.froA; else if (m < 0.3) col = patch ? C.dryB : C.dryA; else if (m > 0.8 && g > 0.5) col = patch ? C.lushB : C.lushA; else col = patch ? C.gB : C.gA;
    if (bT[b] + jn * 0.2 > 0.5) col = patch ? C.shadeB : C.shadeA;
    /* herbs show as a few small flowers of their own colour: meadowsweet cream, yarrow pink, gentian blue, wild garlic white */
    { const hk = W.herb ? W.herb[ci] : 0; if (hk && T >= 0 && ((n2 * 7 + n) & 31) < 3) { col = hk === 1 ? C.herb1 : hk === 2 ? C.herb2 : hk === 3 ? C.herb3 : C.herb4; return col; } }
    /* tone in soft patches, then tufts: a lit blade or two with the dark at their foot */
    { const bl = blot[((py >> 1) & (NT - 1)) * NT | (pxx >> 1) & (NT - 1)], tf = tuft[p]; if (bl > 168) col = mulc(col, 1.05); else if (bl < 88) col = mulc(col, 0.95);
      if (tf === 1) col = T < 0 ? C.frost : mulc(col, 1.17); else if (tf === 2) col = mulc(col, 0.84); }
    if (gWarm && g > 0.5 && m > 0.35 && n2 === 7) col = n < 64 ? C.flowerW : n < 128 ? C.flowerY : n < 192 ? C.flowerP : C.flowerR;
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
  const soft = [W.grass, W.snow, W.soil, W.tree, W.flood, scar, trail], hard = [roadF, waterF, W.field, W.known, lotMask, T0.ditch || waterF], sum = new Float64Array(soft.length + 1);
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
    if (!paint.ch) {
      /* the chunk in view that has waited longest goes first, so at a fast speed none is left showing an old season while others are repainted again and again */
      let best = null; for (const c of chunks) if (c.stale && (all || chunkVisible(c)) && (!best || (c.paintedAt || 0) < (best.paintedAt || 0))) best = c;
      paint.ch = best; paint.row = 0; if (!paint.ch) { paint = null; return; } }   /* stale chunks out of view wait until they are seen */
    const ch = paint.ch, end = Math.min(CHT, paint.row + rows);
    paintChunkRect(ch, 0, paint.row, CW, end); rows -= end - paint.row; paint.row = end;
    if (end >= CHT) {
      if (!ch.cv) { ch.cv = mkC(CW, CHT); ch.ctx = ch.cv.getContext('2d'); }
      if (ch.painted && !all) { const from = fadePool.pop() || (chunks.filter(c => c.fade).length < 4 ? mkC(CW, CHT) : null); if (from) { const fc = from.getContext('2d'); fc.clearRect(0, 0, CW, CHT); fc.drawImage(ch.cv, 0, 0); if (ch.fade) fadePool.push(ch.fade.from); ch.fade = { t: now, from }; } }
      ch.ctx.putImageData(scratch, 0, 0); ch.painted = true; ch.stale = false; ch.paintedAt = now; paint.ch = null;
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
/* THE GROUND MOVES. Light runs down the rivers the way they fall (toward where the water leaves the land); on still water it
   only drifts. The wind goes through the grass in waves. Drawn over the painted ground each frame, in whole pixels and in
   steps of about a tenth of a second, so it stays pixel art */
const flowX = new Float32Array(N * N), flowY = new Float32Array(N * N); let flowSeen = -1;
function syncFlow() {
  const dist = new Int32Array(N * N).fill(-1), q = [];
  for (let i = 0; i < N * N; i++) { const x = i % N, y = (i / N) | 0; if (W.water[i] && (x === 0 || y === 0 || x === N - 1 || y === N - 1)) { dist[i] = 0; q.push(i); } }
  for (let h = 0; h < q.length; h++) { const i = q[h], x = i % N; for (const j of [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, i - N, i + N]) if (j >= 0 && j < N * N && W.water[j] && dist[j] < 0) { dist[j] = dist[i] + 1; q.push(j); } }
  for (let i = 0; i < N * N; i++) { flowX[i] = flowY[i] = 0; if (dist[i] < 0) continue; const x = i % N, y = (i / N) | 0; let vx = 0, vy = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) { vx += dx; vy += dy; continue; } const j = ny * N + nx; if (dist[j] < 0) continue; const d = dist[i] - dist[j]; vx += dx * d; vy += dy * d; }
    const l = Math.hypot(vx, vy); if (l > 0.01) { flowX[i] = vx / l; flowY[i] = vy / l; } }
}
function drawFlow(cx, vis) {
  if (slowMs > 40) return;   /* a device that cannot keep up does without the moving ground */
  const far = cam.z / dpr < 0.9, GUST = ['rgba(240,250,180,.35)', 'rgba(240,250,180,.5)', 'rgba(240,250,180,.65)', 'rgba(240,250,180,.8)'];
  if (flowSeen !== waterSeen) { syncFlow(); flowSeen = waterSeen; }
  const z = cam.z, tq = Math.floor(now / 110) * 110, wet = S.precip > 0, road = T0.road;
  let x0 = N, x1 = 0, y0 = N, y1 = 0;
  for (const [px, py] of [[cam.x, cam.y], [cam.x + cv.width / z, cam.y], [cam.x, cam.y + cv.height / z], [cam.x + cv.width / z, cam.y + cv.height / z]]) {
    const u = (px - OX) / (TW / 2), v = (py - OY) / (TH / 2), fx = (u + v) / 2, fy = (v - u) / 2; x0 = Math.min(x0, fx); x1 = Math.max(x1, fx); y0 = Math.min(y0, fy); y1 = Math.max(y1, fy); }
  x0 = clamp(Math.floor(x0) - 1, 0, N - 1); x1 = clamp(Math.ceil(x1) + 1, 0, N - 1); y0 = clamp(Math.floor(y0) - 1, 0, N - 1); y1 = clamp(Math.ceil(y1) + 1, 0, N - 1);
  const gt = tq * (wet ? 0.0021 : 0.0012);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * N + x; if (!vis(isoX(x + 0.5, y + 0.5), isoY(x + 0.5, y + 0.5))) continue;
    if (W.water[i]) {
      if (crossing[i] || cellT[i] < -3) continue; const fx = flowX[i], fy = flowY[i], moving = fx !== 0 || fy !== 0;
      for (let k = 0; k < (far ? 2 : 5); k++) { const h = hash(i, k + 11); if (h > (moving ? 0.8 : 0.45)) continue;
        const p = (tq * (moving ? 0.00042 : 0.00013) + h * 7.3) % 1, a = Math.sin(p * Math.PI); if (a < 0.3) continue;
        const span = moving ? 1.7 : 0.5, tx = x + 0.5 + (hash(i, k + 3) - 0.5) * 0.8 + (moving ? fx : 0.7) * (p - 0.5) * span, ty = y + 0.5 + (hash(k + 5, i) - 0.5) * 0.8 + (moving ? fy : -0.7) * (p - 0.5) * span;
        if (tx < 0 || ty < 0 || tx >= N || ty >= N || !waterF[(ty | 0) * N + (tx | 0)]) continue;
        cx.fillStyle = a > 0.8 ? 'rgba(232,248,244,.8)' : 'rgba(200,236,232,.45)'; { const px = Math.round(isoX(tx, ty)), py = Math.round(isoY(tx, ty)), len = moving ? (a > 0.8 ? 8 : 5) : 4; cx.fillRect(px - (len >> 1), py, len, 1); if (moving && a > 0.8) { cx.fillStyle = 'rgba(200,236,232,.4)'; cx.fillRect(px - 1, py + 1, len - 3, 1); } } }
    } else if (W.grass[i] > 0.45 && !W.field[i] && !lotMask[i] && !road[i] && W.snow[i] < 0.02 && cellT[i] >= 0 && W.tree[i] < 0.5) {
      /* a gust is a band that travels; where it passes, blades catch the light and lean */
      const g = Math.sin(x * 0.42 + y * 0.23 - gt + Math.sin(y * 0.11 + gt * 0.31) * 1.6); if (g < 0.5) continue; const s = (g - 0.5) * 2;
      cx.fillStyle = GUST[Math.min(3, (s * 4) | 0)];
      for (let k = 0; k < (far ? 2 : 6); k++) { const tx = x + hash(i, k + 21), ty = y + hash(k + 27, i), px = Math.round(isoX(tx, ty)), py = Math.round(isoY(tx, ty)); cx.fillRect(px, py - 1, 1, 2); cx.fillRect(px + 1, py - 3, 1, 2); if (s > 0.6) cx.fillRect(px + 2, py - 3, 1, 1); }
    }
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
/* the season of a leafy plant that is not a tree (bush, tall grass), read from the same causes as treeLook: awake after warmth, dry
   soil, cold with the days shortening, frost */
function leafState(i, T, falling) {
  if (W.warmSum[i] > 0) return W.soil[i] < 0.26 ? 'dry' : W.warmSum[i] < 1.2 ? 'spring' : 'plain';
  if (T > 2.5) return falling ? (hash(i, 13) < 0.4 ? 'red' : 'gold') : 'plain';
  return 'frost';
}
const props = new Map();
/* the tiles on screen, with a margin */
let propBox = null, propSmall = true, propTrees = true;
function viewTiles(m) { const z = cam.z; let x0 = N, x1 = 0, y0 = N, y1 = 0;
  for (const [px, py] of [[cam.x, cam.y], [cam.x + cv.width / z, cam.y], [cam.x, cam.y + cv.height / z], [cam.x + cv.width / z, cam.y + cv.height / z]]) { const u = (px - OX) / (TW / 2), v = (py - OY) / (TH / 2), fx = (u + v) / 2, fy = (v - u) / 2; x0 = Math.min(x0, fx); x1 = Math.max(x1, fx); y0 = Math.min(y0, fy); y1 = Math.max(y1, fy); }
  return { x0: clamp(Math.floor(x0) - m, 0, N - 1), x1: clamp(Math.ceil(x1) + m, 0, N - 1), y0: clamp(Math.floor(y0) - m, 0, N - 1), y1: clamp(Math.ceil(y1) + m, 0, N - 1) }; }
/* the band being watched follows the view: the nearest fire with people to the middle of the screen, looked for about twice a second */
let watchN = 0;
function watchFollowsView() { if (!S.tribes || S.tribes.length < 2 || (++watchN % 30) || cam.z / dpr < 0.45) return; const b = viewTiles(0), cx0 = (b.x0 + b.x1) / 2, cy0 = (b.y0 + b.y1) / 2; let best = -1, bd = 1e9;
  S.tribes.forEach((B, k) => { if (!B.pop0) return; const d = Math.hypot(B.x - cx0, B.y - cy0); if (d < bd) { bd = d; best = k; } }); if (best < 0 || S.tribes[best] === T0) return;
  T0 = W.watch(best); camp.x = T0.x + 0.5; camp.y = T0.y + 0.5; fire.x = camp.x + 0.55; fire.y = camp.y + 0.15; store.x = camp.x - 0.45; store.y = camp.y + 0.35; groundState(); reconcile(); startPaint(); say('Watching ' + (T0.name || 'the first people') + '.'); }
/* when the view has moved off what was last set out, or the zoom has crossed where small things appear, the scenery is set out again at once (no fading in) */
function propsFollowView() { if (!propBox) return; const b = viewTiles(1); W.setFocus((b.x0 + b.x1) >> 1, (b.y0 + b.y1) >> 1, Math.max(b.x1 - b.x0, b.y1 - b.y0) / 2 + 4); const small = cam.z / dpr >= 0.55, trees = cam.z / dpr >= 0.3;
  const edge = (lo, hi, v0, v1) => (v0 < lo && lo > 0) || (v1 > hi && hi < N - 1);
  if (small !== propSmall || trees !== propTrees || edge(propBox.x0, propBox.x1, b.x0, b.x1) || edge(propBox.y0, propBox.y1, b.y0, b.y1)) { const before = new Set(props.keys()); reconcile(); for (const [k, p] of props) { if (!before.has(k)) p.born = -1e9; else if (p.die === now) props.delete(k); } } }
function wantProps() {
  const SITES = allSites(), built = new Set(); for (const q of SITES) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) built.add((q.y + dy) * N + q.x + dx);   /* the ground a building stands on */
  const FN = campOn ? allFence() : null;
  /* ground free for something to be set on: dry, no building's lot (other than the one named), no fence, road, field or standing tree */
  const clearAt = (fx, fy, own, onWay) => { const tx = Math.floor(fx), ty = Math.floor(fy), t = ty * N + tx; if (tx < 0 || ty < 0 || tx >= N || ty >= N || W.water[t] || (T0.road[t] && !onWay) || W.field[t] || (FN && FN[t]) || W.tree[t] > 0.3) return false;
    for (const q of SITES) if (q !== own && !q.upon && Math.abs(q.x - tx) <= 1 && Math.abs(q.y - ty) <= 1) return false; return true; };
  /* a thing wanted at a place is put there if the ground is free, else on the nearest free ground within a tile and a half, else not at all */
  const used = new Set(), tileOf = (fx, fy) => Math.floor(fy) * N + Math.floor(fx);   /* tiles something made already stands on: one thing to a tile */
  const setNear = (key, o) => { for (const [dx, dy] of [[0, 0], [0.9, 0], [0, 0.9], [-0.9, 0], [0, -0.9], [0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9], [1.5, 0], [0, 1.5], [-1.5, 0], [0, -1.5]]) if (clearAt(o.x + dx, o.y + dy, null, true) && !used.has(tileOf(o.x + dx, o.y + dy))) { used.add(tileOf(o.x + dx, o.y + dy)); o.x += dx; o.y += dy; want.set(key, o); return true; } return false; };
  const want = new Map(), falling = !W.daysLengthen(), cR = campR(), ripe = T0.sown && T0.cropWarm > 0 ? clamp(T0.cropWarm / 5.6, 0, 1) : 0;
  /* only the land in view (and a margin round it) is given its trees, bushes and stones; seen from far off, the small things are left out */
  const B = propBox = viewTiles(8), small = cam.z / dpr >= 0.55, treesToo = cam.z / dpr >= 0.3; propSmall = small; propTrees = treesToo;
  for (let y = B.y0; y <= B.y1; y++) for (let x = B.x0; x <= B.x1; x++) {
    const i = y * N + x; if (W.water[i]) continue;
    const tr = W.tree[i], h0 = hash(i, 1), jx = (hash(i, 2) - 0.5) * 0.5, jy = (hash(i, 3) - 0.5) * 0.5, T = W.tempAt(i), snowy = W.snow[i] > 0.08;
    const inCamp = campOn && Math.hypot(x + 0.5 - camp.x, y + 0.5 - camp.y) < cR, px = x + 0.5 + jx, py = y + 0.5 + jy;
    const lag = hash(i, 9) * 0.1;                                          // each spot sprouts and fills out at its own pace
    if (treesToo && tr >= 0.06 + lag && !inCamp && !W.field[i] && !T0.road[i] && h0 < (tr < 0.42 ? 0.5 : 0.42 + tr * 0.4)) {
      const lk = treeLook(i, T, W.warmSum[i] > 0, snowy, falling), stage = Math.round(clamp((tr - 0.06 - lag) / (0.45 + lag * 2), 0, 1) * (STAGES - 1));
      want.set('t' + i, { kind: 'tree', i, x: px, y: py, base: lk.base + lk.state, stage, img: stageImg(lk.img, stage), dy: 0 }); continue;
    }
    /* what is sown comes up on the field, as far on as the season's warmth has brought it; each plant a little ahead or behind its neighbours */
    if (W.field[i] && A.crop && ripe > 0 && !snowy) {
      const r = clamp(ripe + (hash(i, 11) - 0.5) * 0.12, 0, 1), k = r < 0.2 ? 0 : r < 0.45 ? 1 : r < 0.8 ? 2 : 3, isGrain = !(W.crop && W.crop[i]) && A.grainCrop;   /* grain as stalks, greens as the leafy plant */
      const img = isGrain ? A.grainCrop[k] : k === 2 && W.soil[i] < 0.26 && A.cropDry ? A.cropDry : A.crop[k];
      want.set('c' + i, { kind: 'crop', i, x: x + 0.5 + jx * 0.3, y: y + 0.5 + jy * 0.3, base: 'c' + k + (img === A.cropDry) + (isGrain ? 'g' : 'v'), img, dy: 3 });
    }
    if (inCamp || W.field[i] || T0.road[i] || built.has(i)) continue;   /* no bush or rock drawn on a field, a made road or under a building */
    if (!small) continue;
    /* nor on a fence, in a yard, or (a bush being wide) hard against a fence, a field, a road or a building */
    if ((FN && FN[i]) || lotMask[i]) continue;
    const crowded = [i - 1, i + 1, i - N, i + N].some(j => j >= 0 && j < N * N && ((FN && FN[j]) || W.field[j] || T0.road[j] || built.has(j)));
    if (!crowded && ((tr >= 0.04 && h0 > 0.78) || (h0 > 0.972 && W.grass[i] > 0.3))) {
      const B = A.bush[(hash(i, 4) * A.bush.length) | 0], ls = snowy ? 'snow' : leafState(i, T, falling), berry = !snowy && ls !== 'frost' && (W.fruit[i] > 0.08 || (W.warmSum[i] > 1.2 && W.warmSum[i] < 7.6 && hash(i, 5) < 0.4));
      /* berries sit on whatever colour the leaves have turned */
      const st = berry ? (ls === 'gold' || ls === 'red' ? ls + 'Berry' : 'berry') : ls;
      want.set('b' + i, { kind: 'bush', i, x: px, y: py, base: 'b' + st, img: B[st] || (berry ? B.berry : B.plain), dy: 4 });
    }
    else if ((W.rock[i] > 0.2 && hash(i, 7) < 0.25 + W.rock[i] * 0.5) || (h0 < 0.02 && W.fert[i] < 0.75)) {
      const Rk = A.rock[(hash(i, 6) * A.rock.length) | 0], st = snowy ? 'snow' : (nearWater[i] || W.soil[i] > 0.9) && Rk.wet ? 'wet' : 'plain';
      want.set('r' + i, { kind: 'rock', i, x: px, y: py, base: 'r' + st, img: Rk[st], dy: 4 });
    }
    else if (nearWater[i] && h0 > 0.4 && h0 < 0.62 && T > -3) want.set('d' + i, { kind: 'reeds', i, x: x + 0.5 + jx * 0.6, y: y + 0.5, base: 'd', img: A.reeds, dy: 2 });
    /* tall grass where the grass has grown long and nothing has grazed it down */
    else if (A.tuft && !crowded && W.grass[i] > 0.6 && hash(i, 8) < (W.grass[i] - 0.6) * 0.8) {
      const G = A.tuft[(hash(i, 10) * A.tuft.length) | 0], st = snowy ? 'snow' : leafState(i, T, falling);
      want.set('g' + i, { kind: 'grass', i, x: px, y: py, base: 'g' + st, img: G[st] || G.plain, dy: 4 });
    }
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
  if (campOn && FN) {
    const F = FN;
    for (let c = 0; c < N * N; c++) {
      if (!F[c]) continue; const fx = c % N, fy = (c / N) | 0, alongX = (fx > 0 && F[c - 1]) || (fx < N - 1 && F[c + 1]), gate = T0.road[c];
      want.set('f' + c, { kind: 'fence', i: c, x: fx + 0.5, y: fy + 0.5, base: 'f' + alongX + gate, img: gate ? (alongX ? A.gateX : A.gateY) : (alongX ? A.fenceX : A.fenceY), dy: 14 });
    }
  }
  /* What households make of their own place and the things of their life, each where something calls for it, set out round the
     house on a few fixed spots: in front of it and out beyond its sides, never behind it or under its walls (a house is drawn
     standing up from its tile, so whatever is behind or beside it would be hidden or drawn into its walls). First the garden,
     then the firewood, a carved bench, the planter, then the rest; a spot on water, a street, a field or another building is passed over. */
  if (campOn) {
    const P = A.prop || {}, folkBy = new Map(), autumn = !W.daysLengthen() && S.air > -2, taken = new Set();
    for (const q of SITES) taken.add(q.y * N + q.x);
    for (const b of S.agents) if (b.alive && b.d.people && b.house) { let f = folkBy.get(b.house); if (!f) folkBy.set(b.house, f = { n: 0, small: 0, baby: 0, elder: 0, jobs: new Set(), likes: new Set(), herbs: 0 }); f.n++; if (b.age < 2) f.baby++; else if (b.age < b.d.mature) f.small++; if (b.age > 46) f.elder++; if (b.job) f.jobs.add(b.job); for (const k of b.likes || []) f.likes.add(k); if (b.skill && b.skill.gather > 1.3) f.herbs++; }
    const SPOTS = [[1.25, 1.25], [1.45, 0.5], [0.5, 1.45], [1.4, -0.45], [-0.45, 1.4]];   /* all on the household's own lot: the tile beyond is the way between lots */
    for (const q of SITES) {
      if (q.upon || !(W.BUILDINGS[q.kind] || {}).room || !(q.was || q.stage >= W.DWELL[q.kind].stages)) continue;
      const f = folkBy.get(q.id), L = q.larder || 0, n = Math.max(1, f ? f.n : 1), items = [];
      if ((q.garden || 0) > 0.15) items.push({ key: 'gd', kind: 'garden', base: 'gd' + q.id, img: A.garden[Math.min(2, Math.floor(q.garden * 3))], dy: 6 });
      if ((q.fuel || 0) >= 1.2 && P.firewood_stack) items.push({ key: 'wp', kind: 'woodpile', base: 'wpb', img: P.firewood_stack, dy: 4 });
      else if ((q.fuel || 0) > 0.2) items.push({ key: 'wp', kind: 'woodpile', base: 'wp', img: A.woodpile[Math.min(2, Math.floor(q.fuel))], dy: 3 });
      if ((q.carved || 0) > 0.2) items.push({ key: 'bn', kind: 'bench', base: 'bn' + q.id, img: q.carved > 0.6 ? A.benchCarved : A.bench, dy: 4 });
      if ((q.garden || 0) > 0.3 && P.planter) items.push({ key: 'pl', kind: 'prop', base: 'pl', img: (q.garden || 0) > 0.7 && P.bench_flowers ? P.bench_flowers : P.planter, dy: 4 });
      /* furniture is made, not found: nothing is kept round a tent but a fire's wood; joinery (table, crates, coop, racks) wants a timber roof to keep it under,
         and what is cut true or turned (barrels, a rocking chair, a loom, a workbench, hives, a barrow) wants the tools to cut it */
      if (f && q.kind !== 'tent' && A.prop) { const tools = !!(T0.skills && T0.skills.tools), house = q.kind === 'house', want2 = [];
        if (L > n * 1.5 && S.air > 10 && P.table_bench) want2.push('table_bench');
        if (f.small && P.toy_horse) want2.push('toy_horse');
        if (f.baby && P.laundry_tub) want2.push('laundry_tub'); else if (f.small + f.baby >= 2 && P.washing_line) want2.push('washing_line');
        if (f.elder && tools && P.rocking_chair) want2.push('rocking_chair');
        if (L > n * 2.5 && tools && P.barrels) want2.push('barrels'); else if (L > n * 1.5 && (f.jobs.has('farmer') || f.jobs.has('fisher') || (q.fields || 0) > 0) && P.crates) want2.push('crates');
        if ((q.fields || 0) > 0 && autumn && P[q.id % 2 ? 'pumpkins' : 'wheat_sheaves']) want2.push(q.id % 2 ? 'pumpkins' : 'wheat_sheaves');
        if ((q.fields || 0) >= 9 && (f.jobs.has('farmer') || autumn) && T0.skills && T0.skills.farm && P.haystack) want2.push('haystack');
        if ((q.fields || 0) > 0 && L > n && P.coop) want2.push('coop');
        if (f.likes.has('gardens') && (q.garden || 0) > 0.5 && tools && P.beehives) want2.push('beehives');
        if (f.likes.has('gardens') && P.potted_plants) want2.push('potted_plants');
        if ((q.carved || 0) > 0.4 && tools && P.woodworking_bench) want2.push('woodworking_bench');
        if ((q.woven || 0) > 0.3 && tools && house && P.loom) want2.push('loom');
        if (f.jobs.has('fisher') && P.fish_rack) want2.push('fish_rack');
        if (f.jobs.has('builder') && tools && T0.skills.wheel && P.wheelbarrow) want2.push('wheelbarrow');
        if (f.jobs.has('woodcutter') && P.chopping_block) want2.push('chopping_block');
        if (f.herbs && P.herb_drying) want2.push('herb_drying');
        want2.forEach((k, i) => items.push({ key: 'hp' + i, kind: 'prop', base: 'hp' + k, img: P[k], dy: 4 })); }
      let si = 0;
      for (const it of items) {
        while (si < SPOTS.length) { const [ox, oy] = SPOTS[si], tx = Math.floor(q.x + 0.5 + ox), ty = Math.floor(q.y + 0.5 + oy), t = ty * N + tx;
          if (clearAt(q.x + 0.5 + ox, q.y + 0.5 + oy, q) && !used.has(t)) { used.add(t); break; } si++; }
        if (si >= SPOTS.length) break;
        const [ox, oy] = SPOTS[si++]; want.set(it.key + q.id, { kind: it.kind, x: q.x + 0.5 + ox, y: q.y + 0.5 + oy, base: it.base, img: it.img, dy: it.dy });
      }
    }
  }
  if (campOn && A.prop) {
    const P = A.prop;
    /* by the fire and the store: market stalls once there is a market (H4), a spit once there have been hunts, the music corner where music is played, a signpost once streets meet there, a trough for tame beasts */
    /* H4: once there is coin, the four lots round the fire are the market, a stall on each */
    if (T0.market && P.stall_red) [[-2, -2, 'stall_red'], [2, -2, 'stall_green'], [-2, 2, 'stall_green'], [2, 2, 'stall_red']].forEach(([dx, dy, k], n) => { const x = T0.market.x + dx, y = T0.market.y + dy; if (x < 0 || y < 0 || x >= N || y >= N) return; /* a stall stands on its market lot while the lot is open; once something is built there the stall is gone (the shop is the house itself) */ const o = { kind: 'prop', x: x + 0.5, y: y + 0.5, base: 'mk' + k, img: P[k] || P.stall_red, dy: 4 }; if (clearAt(o.x, o.y) && !used.has(tileOf(o.x, o.y))) { used.add(tileOf(o.x, o.y)); want.set('mk' + n, o); } });
    if ((T0.hunts || 0) > 0 && P.cooking_spit) setNear('spit', { kind: 'prop', x: fire.x + 0.95, y: fire.y + 0.7, base: 'spit', img: P.cooking_spit, dy: 3 });
    if (S.musicT && S.tickNo - S.musicT < 48 && P.music_corner) setNear('musicc', { kind: 'prop', x: fire.x - 1.2, y: fire.y + 0.9, base: 'mc', img: P.music_corner, dy: 3 });
    { let rd = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = T0.x + dx, y = T0.y + dy; if (x >= 0 && y >= 0 && x < N && y < N && T0.road[y * N + x]) rd++; } if (rd > 4 && P.signpost) setNear('sign', { kind: 'prop', x: camp.x - 1.6, y: camp.y - 1.4, base: 'sign', img: P.signpost, dy: 3 }); }
    /* food left out for the one who watches: by the shrine if there is one, else by the fire */
    if ((T0.offer || 0) > 0.1) { const sh = T0.sites.find(q => q.kind === 'shrine' && q.stage > 0); setNear('offer', { kind: 'prop', x: sh ? sh.x + 0.5 + 1.2 : fire.x - 1.0, y: sh ? sh.y + 0.5 + 1.2 : fire.y - 0.9, base: 'offer', img: P.potted_plants || A.basket, dy: 4 }); if (T0.offer > 1) setNear('offer2', { kind: 'basket', x: sh ? sh.x + 0.5 + 1.5 : fire.x - 1.3, y: sh ? sh.y + 0.5 + 0.9 : fire.y - 0.6, base: 'offer2', img: A.basket, dy: 6 }); }
    if (S.agents.some(b => b.alive && b.tame) && P.trough) setNear('trough', { kind: 'prop', x: camp.x - 1.4, y: camp.y + 1.8, base: 'trough', img: P.trough, dy: 3 });
    /* lanterns on paved crossings of the lattice */
    if (T0.pave >= 2 && P.lantern) for (let m = -8; m <= 8; m++) for (let k = -8; k <= 8; k++) { const x = T0.x + k * W.PITCH, y = T0.y + m * W.PITCH; if (x < 0 || y < 0 || x >= N || y >= N || !T0.road[y * N + x] || (k + m) % 2) continue; want.set('ln' + x + ',' + y, { kind: 'prop', x: x + 0.85, y: y + 0.85, base: 'ln', img: P.lantern, dy: 3 }); }
    /* scarecrows in the middle of field lots */
    if (P.scarecrow) for (let m = -8; m <= 8; m++) for (let k = -8; k <= 8; k++) { const x = T0.x + k * W.PITCH + 2, y = T0.y + m * W.PITCH + 2; if (x < 0 || y < 0 || x >= N || y >= N || !W.field[y * N + x] || (k * 7 + m * 3) % 3) continue; want.set('sc' + x + ',' + y, { kind: 'prop', x: x + 0.5, y: y + 0.5, base: 'sc', img: P.scarecrow, dy: 3 }); }
    /* stumps left by felling, with mushrooms, where nothing else has been put since */
    if (P.stump_mushrooms) for (const j of (S.stumps || []).slice(-40)) { if (W.tree[j] > 0.05 || W.field[j] || T0.road[j] || lotMask[j] || (W.owner && W.owner[j]) || W.water[j] || !clearAt(j % N, (j / N) | 0)) continue; want.set('st' + j, { kind: 'prop', x: (j % N) + 0.5, y: ((j / N) | 0) + 0.5, base: 'st', img: P.stump_mushrooms, dy: 3 }); }
  }
  /* once there has been music by the fire, there are logs to sit on round it */
  if (campOn && S.musicT) for (let k = 0; k < 3; k++) { const ang = k * 2.1 + 0.5; setNear('ls' + k, { kind: 'seat', x: fire.x + Math.cos(ang) * 1.1, y: fire.y + Math.sin(ang) * 0.9, base: 'ls', img: A.logSeat, dy: 2 }); }
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
  if (campOn && T0.carts && A.cart && ![...actors.values()].some(q => q.step && q.step.cart)) setNear('cart', { kind: 'cart', x: store.x - 0.7, y: store.y + 0.8, base: 'cart', img: A.cart, dy: 3 });
  if (campOn && T0.skills.fire) want.set('ring', { kind: 'ring', x: fire.x, y: fire.y, base: 'ring', img: A.ring, dy: 4 });
  /* nothing wild is drawn where something made has been set down */
  { const WILD = { bush: 1, rock: 1, reeds: 1, grass: 1 }, busy = new Set(); for (const o of want.values()) if (!WILD[o.kind] && o.kind !== 'tree' && o.kind !== 'crop') busy.add(Math.floor(o.y) * N + Math.floor(o.x));
    for (const [k, o] of want) if (WILD[o.kind] && busy.has(o.i)) want.delete(k); }
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
  const sites = campOn ? allSites() : [];
  for (let k = 0; k < sites.length; k++) {
    const st = sites[k], n = W.DWELL[st.kind].stages, tp = 0.05 + 0.95 * Math.min(1, (st.stage + (st.part || 0)) / n); let h = huts[k];
    if (!h || h.die || h.id !== st.id) h = huts[k] = { k, id: st.id, x: st.x + 0.5, y: st.y + 0.5, p: tp, born: now, die: 0, kind: st.kind };
    if (h.kind !== st.kind || tp < h.p - 0.02) {
      if (!st.was && tp < h.p - 0.02) burst(h.x, h.y, 'debris', 16);
      h.p = Math.min(h.p, tp);
      if (h.kind !== st.kind) h.p = 0.05;
    }   // washed out, or being rebuilt as something better
    if (!st.lifted) { h.x = st.x + 0.5; h.y = st.y + 0.5; }
    h.kind = st.kind; h.was = st.was; h.lake = st.lake; h.target = tp; h.upon = st.upon || 0;
    /* I1: a floor built upon a house is drawn as part of it; the house below counts its floors, the finished ones and one being built */
    h.floors = 1 + sites.filter(u => u.upon === st.id && u.stage >= W.DWELL[u.kind].stages).length; h.floorUp = sites.some(u => u.upon === st.id && u.stage < W.DWELL[u.kind].stages); h.live = !!(W.BUILDINGS[st.kind] || { room: 1 }).room && (!!st.was || st.stage >= n);
    const K = W.DWELL[st.kind]; h.wood = st.wood - st.stage * K.wood; h.stone = st.stone - st.stage * K.stone;   // lying on the plot, not yet built in
  }
  for (let k = sites.length; k < huts.length; k++) if (huts[k] && !huts[k].die) { huts[k].die = now; burst(huts[k].x, huts[k].y, 'debris', 16); }
}
/* a house of several floors: its own drawing with the wall band (the middle of the picture, between the eaves and the footing)
   repeated once for every floor above the first */
const storeyCache = new Map(); let storeyIds = new WeakMap(), storeyN = 0;
function storeyed(im, floors) {
  if (floors <= 1) return im; let id = storeyIds.get(im); if (!id) storeyIds.set(im, id = ++storeyN); const key = id + ':' + floors; let c = storeyCache.get(key); if (c) return c;
  const H = im.height, top = Math.round(H * 0.69), band = Math.round(H * 0.2), add = band * (floors - 1);   /* the roof ends at about 0.69 of the drawing; the walls run below it */ c = mkC(im.width, H + add); const x = c.getContext('2d');
  x.drawImage(im, 0, top, im.width, H - top, 0, top + add, im.width, H - top);                         /* the ground floor and footing */
  for (let k = 0; k < floors - 1; k++) x.drawImage(im, 0, top, im.width, band, 0, top + add - band * (k + 1), im.width, band);   /* a band of wall for each floor above */
  x.drawImage(im, 0, 0, im.width, top, 0, 0, im.width, top);                                          /* the roof on top */
  storeyCache.set(key, c); return c;
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
/* E3/E4 check: just before each step, how far each creature is drawn from where the simulation has it (people and animals apart) */
const drift = { people: { n: 0, far: 0, max: 0, ex: '' }, animals: { n: 0, far: 0, max: 0, ex: '' } };
let midTick = false;
function driftNote() {
  for (const r of actors.values()) { if (r.dead || !r.a.alive || r.pose === 'hidden' || r.pose === 'carried' || r.a.hidden) continue;
    const d = Math.hypot(r.x - (r.a.x + 0.5), r.y - (r.a.y + 0.5)), o = r.a.d.people ? drift.people : drift.animals; o.n++;
    if (d > 1.5) { o.far++; if (!o.ex) o.ex = r.a.sp + ' ' + r.id + ' drawn ' + d.toFixed(1) + ' tiles off, doing ' + (r.a.act && r.a.act.k); } if (d > o.max) o.max = d; }
}
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
const BOUND = 1.4;
class Plan {
  constructor(r) { this.r = r; this.steps = []; this.u = 0; this.x = r.x; this.y = r.y; }
  // people keep to the ways between lots: out to the nearest way, along the ways, and in at the other end
  /* E3: a person goes only where the simulation has them; once bound, anything asked farther than BOUND from where the step
     leaves them is drawn at the edge of that reach instead of on an invented trip */
  go(x, y, sp, pose, o) {
    if (this.bound) { const b = this.bound, d = Math.hypot(x - b.x, y - b.y); if (d > BOUND) { x = b.x + (x - b.x) * BOUND / d; y = b.y + (y - b.y) * BOUND / d; if (isWater(x, y)) { x = b.x; y = b.y; } } }
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
  /* along tiles the simulation walked this step, tile centre to tile centre, with no way-finding of its own */
  path(tiles, sp, pose, o) {
    for (let k = 1; k < tiles.length; k++) { const t = tiles[k], px = (t % N) + 0.5 + jit(this.r.id, 0) * 0.5, py = ((t / N) | 0) + 0.5 + jit(this.r.id, 1) * 0.5, d = Math.hypot(px - this.x, py - this.y);
      if (d < 0.02) continue; const du = d / (sp * TS); this.steps.push(Object.assign({ t: 'm', u0: this.u, u1: this.u + du, x1: px, y1: py, pose: pose || 'walk' }, o)); this.u += du; this.x = px; this.y = py; }
    return this; }
  wait(du, pose, o) { if (du > 0) { this.steps.push(Object.assign({ t: 's', u0: this.u, u1: this.u + du, pose: pose || 'idle' }, o)); this.u += du; } return this; }
  until(u, pose, o) { return this.wait(u - this.u, pose, o); }
  follow(du, id, o) {
  this.steps.push(Object.assign({ t: 'f', u0: this.u, u1: this.u + du, id, pose: 'walk' }, this.bound ? { bx: this.bound.x, by: this.bound.y } : {}, o));
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
  /* the way the simulation walked them this step comes first, then whatever they do there, kept close to where the step left them */
  { const tr = W.trailOf ? W.trailOf(a.id) : null;
    if (tr && tr.length > 1) { const carry = act.k === 'carryhome' || act.k === 'drop'; P.path(tr, act.k === 'flee' ? SPEED.person.run : carry ? sp * 0.85 : sp, carry ? 'carry' : 'walk', carry ? { item: act.item || 'basket' } : undefined); P.squeeze(0.7); }
    if (act.k !== 'baby') P.bound = { x: a.x + 0.5, y: a.y + 0.5 }; }
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
    case 'market': { const m = T0.market || camp, sx = m.x + 0.5 + (pi % 2 ? 1.6 : -1.6), sy = m.y + 0.5 + ((pi >> 1) % 2 ? 1.6 : -1.6); P.go(sx, sy, sp); P.wait(0.5, 'idle', { chat: 1, lx: sx, ly: sy }); break; }   // at a stall, trading
    case 'dig': { const tx = act.j % N + 0.5, ty = ((act.j / N) | 0) + 0.5; P.go(tx + 0.3, ty + 0.3, sp); P.wait(0.5, 'work', { fx: 'dirt', lx: tx, ly: ty }); break; }   // digging the ditch a tile further
    case 'craft': { const tx = act.j % N + 0.5, ty = ((act.j / N) | 0) + 0.5; P.go(tx + 0.4, ty + 0.4, sp); P.wait(0.6, 'work', { fx: act.at === 'kiln' ? 'dust' : 'hammer', lx: tx, ly: ty }); break; }   // a day at the kiln, the anvil or the bench
    case 'walkto': P.go(act.x + 0.5, act.y + 0.5, sp); break;                               // on the way out: as far as the simulation has them
    case 'carryhome': P.go(act.x + 0.5, act.y + 0.5, sp * 0.85, 'carry', { item: act.item || 'basket' }); break;   // on the way back with a load: fish, a basket, logs, stone, sticks
    case 'drop': P.go(act.x + 0.5, act.y + 0.5, sp * 0.85, 'carry', { item: act.item || 'log' }); P.wait(0.05, 'work', { drop: 1 }); break;   // the load set down at the plot or the hearth
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
    case 'music': case 'story': { const s = seat(pi); P.go(s.x, s.y, sp); r.bub = act.k === 'story' ? 'story' : 'music'; r.bubT = now + R(0, 900); P.done('sit'); return; }   // an evening by the fire with what they love
    case 'dance': { const s = seat(pi + 3); P.go(s.x, s.y, sp); r.bub = 'dance'; r.bubT = now + R(0, 900); for (let k = 0; k < 4; k++) P.go(s.x + R(-0.3, 0.3), s.y + R(-0.3, 0.3), sp * 1.2, 'hop'); P.done('idle'); return; }
    case 'garden': { const mine = huts.find(q => q && q.live && !q.die && q.id === a.house), at = mine ? { x: mine.x + 1.0, y: mine.y + 0.5 } : { x: end.x, y: end.y }; P.go(at.x, at.y, sp); r.bub = 'garden'; r.bubT = now + R(0, 900); P.wait(0.6, 'work', { fx: 'grass', lx: at.x + 0.3, ly: at.y }); P.done('idle'); return; }
    case 'weave': { const mine = huts.find(q => q && q.live && !q.die && q.id === a.house), at = mine ? { x: mine.x - 0.6, y: mine.y + 0.4 } : { x: end.x, y: end.y }; P.go(at.x, at.y, sp); r.bub = 'carve'; r.bubT = now + R(0, 900); P.done('sit'); return; }
    case 'carve': { const mine = huts.find(q => q && q.live && !q.die && q.id === a.house), at = mine ? { x: mine.x + 0.2, y: mine.y + 1.1 } : { x: end.x, y: end.y }; P.go(at.x, at.y, sp); r.bub = 'carve'; r.bubT = now + R(0, 900); P.wait(0.6, 'sit', { fx: 'chips', lx: at.x, ly: at.y }); P.done('sit'); return; }
    case 'watch': { const s = seat(pi); P.go(s.x, s.y, sp); P.done('sit'); return; }   // the night watch, awake by the fire
    case 'mourn': { const s = act.x !== undefined && (act.x !== T0.x || act.y !== T0.y) ? { x: act.x + 0.5 + R(-0.6, 0.6), y: act.y + 1.1 + R(-0.2, 0.3) } : seat(pi); r.bub = 'grief'; r.bubT = now + 800; P.go(s.x, s.y, sp * 0.7); P.done('sit'); return; }   // by the fire, or at the shrine once there is one                                    // foul weather: indoors
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
      const fields = []; if (T0.sown) for (let y = Math.max(0, a.y - 2); y <= Math.min(N - 1, a.y + 2); y++) for (let x = Math.max(0, a.x - 2); x <= Math.min(N - 1, a.x + 2); x++) if (W.field[y * N + x]) fields.push(y * N + x);   /* a field where they stand, not one across the valley */
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
  /* E4: the way the simulation moved it this step first, then whatever it does there, kept close to where it now is */
  { const tr = W.trailOf ? W.trailOf(a.id) : null; if (tr && tr.length > 1) { const run = act.k === 'flee' || act.k === 'chase' || act.k === 'hide' || act.k === 'kill'; P.path(tr, run ? V.run : V.walk, run ? 'run' : hop); P.squeeze(0.6); }
    P.bound = { x: a.x + 0.5, y: a.y + 0.5 }; }
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
/* one who is leaving the valley walks on towards the edge of the land a step's worth at a time, the grown carrying a bundle,
   and is let go once past the edge (or after a few steps, if no way out is found) */
function planLeave(r) {
  const L = r.leave; L.n++;
  if (r.x < -0.5 || r.y < -0.5 || r.x > N + 0.5 || r.y > N + 0.5 || L.n > 8) { actors.delete(r.id); return; }
  const grown = r.a.age >= r.a.d.mature, P = new Plan(r), o = grown ? { item: 'sticks' } : {};
  P.go(clamp(L.x, 0, N - 0.01), clamp(L.y, 0, N - 0.01), SPEED.person.walk, grown ? 'carry' : 'walk', o);
  { const d = Math.hypot(L.x - P.x, L.y - P.y); if (d > 0.02) { const du = d / (SPEED.person.walk * TS); P.steps.push(Object.assign({ t: 'm', u0: P.u, u1: P.u + du, x1: L.x, y1: L.y, pose: grown ? 'carry' : 'walk' }, o)); P.u += du; } }
  /* only what fits in this step: the rest of the way is walked in the next */
  const steps = []; for (const st of P.steps) { if (st.u0 >= 1) break; if (st.u1 > 1 && st.t === 'm') { const k = (1 - st.u0) / (st.u1 - st.u0), x0 = steps.length ? steps[steps.length - 1].x1 : r.x, y0 = steps.length ? steps[steps.length - 1].y1 : r.y;
      steps.push(Object.assign({}, st, { u1: 1, x1: x0 + (st.x1 - x0) * k, y1: y0 + (st.y1 - y0) * k })); break; } steps.push(st); }
  r.plan = steps; r.si = -1;
}
function planDeath(r) {
  const d = r.dead, P = new Plan(r); if (d.u !== undefined && !d.instant) return;   // a hunt already laid out the end
  d.u = d.instant ? tickFrac : R(0.05, 0.25);
  if (d.instant) { r.plan = [{ t: 's', u0: 0, u1: 1, pose: 'dead' }]; r.si = -1; return; }
  P.wait(d.u, d.why === 'old age' || d.why === 'hunger' || d.why === 'cold and hunger' ? 'lie' : 'idle'); P.done('dead');
}

// ================================================================== events from the engine, turned into things you can see
function say2(r, b) { if (now - r.bubT > 6000) { r.bub = b; r.bubT = now + Math.random() * 600; } }
const pops = [];
function takeEvents(instant) {
  for (const f of S.fx.splice(0)) {
    if (f.kind === 'death') {
      const r = recOf(f.id); if (!r) continue; r.dead = { why: f.why, by: f.by, t: gameMs, instant: !!instant };
      if (instant) { r.dead.u = tickFrac; r.dead.shown = true; r.dead.t = gameMs; if (f.why === 'struck') burst(r.x, r.y, 'smoke', 6); }
      if (W.SPECIES[f.sp].people) {
        const g = near(camp.x - 2.6, camp.y - 1.6, 1.2); graves.push({ x: g.x, y: g.y, born: now }); if (graves.length > 14) graves.shift();
        for (const o of actors.values()) if (o !== r && !o.dead && o.a.d.people && Math.hypot(o.x - r.x, o.y - r.y) < 6) { o.bub = 'grief'; o.bubT = now + 1200 + Math.random() * 3000; }
      }
    } else if (f.kind === 'harvest') {   /* a household's harvest rises from its fields */
      if (pops.length < 40) pops.push({ x: f.x + 0.5, y: f.y + 0.5, t: now + Math.random() * 600, grain: Math.round(f.grain), veg: Math.round(f.veg) });
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
    } else if (f.kind === 'leave') {   /* gone from the valley: no body, no grave. They take up a bundle and walk off by the nearest edge of the land */
      const r = recOf(f.id); if (!r) continue; if (instant) { actors.delete(f.id); continue; }
      const ex = r.x < N - r.x ? -1.5 : N + 1.5, ey = r.y < N - r.y ? -1.5 : N + 1.5;
      r.leave = Math.min(r.x, N - r.x) < Math.min(r.y, N - r.y) ? { x: ex, y: r.y, n: 0 } : { x: r.x, y: ey, n: 0 }; r.pose = r.a.age < r.a.d.mature ? 'walk' : 'carry';
    } else if (f.kind === 'arrive') {
      const a = S.byId.get(f.id); if (!a) continue; const ex = a.x < N / 2 ? -0.4 : N + 0.4; newRec(a, ex, a.y + 0.5, { born: now, arrive: 1, alpha: 0 });
    }
  }
}
function onTick() {
  syncCrossings();
  /* the year and the season, from how high the sun stands */
  { const el = document.getElementById('when'); if (el) { const ph = (((S.cal - 0.08) % 1) + 1) % 1; el.textContent = 'Year ' + Math.floor(S.cal) + ' \u00b7 ' + (ph < 0.125 || ph >= 0.875 ? 'winter' : ph < 0.375 ? 'spring' : ph < 0.625 ? 'summer' : 'autumn'); } }
  /* newcomers to an emptied valley may camp somewhere else: the fixed places of the camp follow the fire */
  if (camp.x !== T0.x + 0.5 || camp.y !== T0.y + 0.5) { camp.x = T0.x + 0.5; camp.y = T0.y + 0.5; fire.x = camp.x + 0.55; fire.y = camp.y + 0.15; store.x = camp.x - 0.45; store.y = camp.y + 0.35; }
  if ((W.YK === 1 ? S.tickNo % W.TPY === 0 : S.newYear) && !window.EDEN_NOSAVE) { try { localStorage.setItem('eden.save', W.save()); } catch (e) { /* storage full or off: play on unsaved */ } }   /* autosave once a game year */
  takeEvents(false); syncHuts();
  /* the dead are shown falling for a while on screen; when steps run faster than the screen (a long jump, a slow device) they are let go after a few steps all the same */
  for (const [id, r] of actors) if (r.dead) { if (r.dead.tick === undefined) r.dead.tick = S.tickNo; else if (S.tickNo - r.dead.tick > 3) actors.delete(id); }
  for (const a of S.agents) { if (!a.alive) continue; let r = recOf(a.id); if (!r) { const e = endOf(a); r = newRec(a, e.x, e.y, { alpha: 0 }); } r.a = a; }
  const phase = S.tickNo % DAY;
  /* seats round the fire go out by friendship (G1): each person beside the one they are closest to, so friends sit together */
  const seatOf = new Map(); { const folk = S.agents.filter(a => a.alive && a.d.people), best = a => { let b = 0, v = 0.5; for (const id in a.ties || {}) if (a.ties[id] > v) { v = a.ties[id]; b = +id; } return b; };
    const keyOf = new Map(); for (const a of folk) { const f = best(a); keyOf.set(a.id, f ? Math.min(a.id, f) : a.id); }   /* worked out once each, not in every comparison */
    folk.sort((p, q) => keyOf.get(p.id) - keyOf.get(q.id) || p.id - q.id).forEach((a, k) => seatOf.set(a.id, k)); }
  for (const r of actors.values()) {
    if (r.dead) { if (r.dead.shown) continue; planDeath(r); continue; }
    if (r.leave) { planLeave(r); continue; }
    if (r.held) continue;
    if (r.a.d.people) planPerson(r, phase, seatOf.has(r.a.id) ? seatOf.get(r.a.id) : 0); else planAnimal(r);
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
      const ang = (r.id % 7) * 0.9 + (s.playful ? Math.sin(gameMs / 900 + r.id) * 0.8 : 0);
      let tx = m.x + Math.cos(ang) * s.gap, ty = m.y + Math.sin(ang) * s.gap * 0.8;
      /* following, but no farther than the simulation lets them stray from their own place (E3, E4) */
      if (s.bx !== undefined) { const bd = Math.hypot(tx - s.bx, ty - s.by); if (bd > BOUND) { tx = s.bx + (tx - s.bx) * BOUND / bd; ty = s.by + (ty - s.by) * BOUND / bd; } }
      const d = Math.hypot(tx - r.x, ty - r.y);
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
/* how finely the picture is drawn: never more than twice the screen's own points, and less when frames come slowly (pixel art
   loses little by it). The view stays where it is: the zoom is carried over */
let dprCap = 2, slowMs = 16, slowN = 0, fastN = 0, lastDprT = 0;
function resize() { const old = dpr; dpr = Math.max(1, Math.min(dprCap, window.devicePixelRatio || 1)); if (old !== dpr && cv.width) { const k = dpr / old; cam.z *= k; cam.x /= 1; }
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); clampCam(); }
/* the view carried gently to a place (the one who asks), until it is there or the player takes hold of it */
let glide = null;
function glideStep(dtMs) { if (!glide) return; const k = 1 - Math.pow(0.004, dtMs / 1000), cxw = cam.x + cv.width / cam.z / 2, cyw = cam.y + cv.height / cam.z / 2, nx = cxw + (glide.wx - cxw) * k, ny = cyw + (glide.wy - cyw) * k; cam.z += (glide.z - cam.z) * k;
  cam.x = nx - cv.width / cam.z / 2; cam.y = ny - cv.height / cam.z / 2; clampCam(); if (Math.abs(glide.wx - nx) < 0.5 && Math.abs(glide.wy - ny) < 0.5 && Math.abs(glide.z - cam.z) < 0.01) glide = null; }
function paceCheck(dtMs) { slowMs = slowMs * 0.95 + dtMs * 0.05;
  if (slowMs > 30) { fastN = 0; if (++slowN > 90 && dprCap > 1 && (window.devicePixelRatio || 1) > 1) { const cxw = cam.x + cv.width / cam.z / 2, cyw = cam.y + cv.height / cam.z / 2; dprCap = Math.max(1, Math.min(dprCap, window.devicePixelRatio || 1) - 0.5); slowN = 0; lastDprT = now; resize(); cam.x = cxw - cv.width / cam.z / 2; cam.y = cyw - cv.height / cam.z / 2; clampCam(); } }
  else { slowN = 0; if (slowMs < 13 && dprCap < 2 && now - lastDprT > 30000 && ++fastN > 900) { const cxw = cam.x + cv.width / cam.z / 2, cyw = cam.y + cv.height / cam.z / 2; dprCap = Math.min(2, dprCap + 0.5); fastN = 0; lastDprT = now; resize(); cam.x = cxw - cv.width / cam.z / 2; cam.y = cyw - cv.height / cam.z / 2; clampCam(); } } }
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
const ptrs = new Map(); let pinch = null, held = null, heldThing = null, act = null, lastStrike = 0, bolt = null;
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
/* the hand lifts what is at a place: asks the simulation for it, and remembers its picture to carry */
function liftAt(c, w, ground) {
  const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N, T = S.tribe;
  for (let d = 0; d <= 2; d++) { const x = (c.x | 0) + d, y = (c.y | 0) + d; if (!inb(x, y)) continue; const i = y * N + x;
    const tall = W.tree[i] > 0.1 || T.sites.some(q => !q.upon && Math.abs(q.x - x) <= 1 && Math.abs(q.y - y) <= 1);
    const low = W.burn[i] > 0 || (S.piles || []).some(p => p.x === x && p.y === y) || (S.popPeople && Math.abs(x - T.x) <= 1 && Math.abs(y - T.y) <= 1);
    const bare = W.water[i] || (W.rock && W.rock[i] >= 0.15);
    if (!(tall || (d === 0 && (low || (ground && bare))))) continue;
    const pr = props.get('t' + i), img = pr ? pr.img : null, h = W.G.pick(x, y); if (!h) continue;
    heldThing = { h, img, wx: w.x, wy: w.y, cx: x, cy: y };
    say({ fire: 'Fire.', water: 'Water, cupped in the hand.', tree: 'A tree, roots and all.', site: 'A ' + (h.kind || 'building') + ', lifted off its ground.', pile: { meat: 'Meat.', wood: 'Logs.', stone: 'A stone.' }[h.kind] }[h.k] || '');
    if (h.k === 'tree' || h.k === 'pile') repaintCells(x - 2, y - 2, x + 2, y + 2);
    reconcile(); return true; }
  return false;
}
cv.addEventListener('pointerdown', e => {
  glide = null;
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
    /* no creature under the hand: whatever else is there is lifted. Tall things (a tree, a house) are also caught by the
       ground just in front of where they were touched. Open water and bare rock are taken only by holding still a moment,
       so that dragging across a lake still moves the view */
    if (!r) { const c0 = toCell(e.clientX, e.clientY); liftAt(c0, w, false); }
    act = { id: e.pointerId, x: e.clientX, y: e.clientY, pan: !r && !heldThing, t0: now, x0: e.clientX, y0: e.clientY };
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
  else if (heldThing) { const w2 = toWorld(p.x, p.y); heldThing.wx = w2.x; heldThing.wy = w2.y; if (heldThing.h.k === 'site') { const c2 = toCell(p.x, p.y), hu = huts.find(q => q && q.id === heldThing.h.id); if (hu) { hu.x = c2.x; hu.y = c2.y; } } }
  else if (act.pan) { cam.x -= (p.x - ox) * dpr / cam.z; cam.y -= (p.y - oy) * dpr / cam.z; clampCam(); }
});
function dropHeld() {
  const r = held; held = null; if (!r) return; r.held = false; r.a.held = false;
  if (isWater(r.x, r.y)) { const q = near(r.x, r.y, 2); r.x = q.x; r.y = q.y; ripples.push({ x: isoX(r.x, r.y), y: isoY(r.x, r.y), t: now }); }
  W.G.setDown(r.a, clamp(r.x | 0, 0, N - 1), clamp(r.y | 0, 0, N - 1)); burst(r.x, r.y, 'dust', 6); showSeen();
  // a moment to get its bearings, then it carries on from where it was put
  const P = new Plan(r), u = tickFrac; P.wait(u, 'idle'); P.wait(0.04, 'hop'); P.wait(0.06, 'look'); r.plan = null;
  if (r.a.d.people) { P.go(camp.x + R(-1, 1), camp.y + R(-1, 1), SPEED.person.walk); } else { const e = endOf(r.a); P.go(e.x, e.y, SPEED[kind(r.a)].walk); }
  P.done('idle'); r.si = -1; for (const s of r.plan) if (s.u1 <= u) { s.u0 = s.u1 = u; }
}
const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (act && act.id === e.pointerId) { if (held) dropHeld(); if (heldThing) dropThing(e); act = null; } };
/* those who saw the hand just now show what they made of it: a heart for a want answered, fear for harm, the hand for a wonder */
function showSeen() { for (const r of actors.values()) { const a = r.a; if (!a.d.people || r.dead || a.sawT !== S.tickNo || !a.sawHow) continue; r.bub = a.sawHow === 'gift' ? 'love' : a.sawHow === 'harm' ? 'afraid' : 'hand'; r.bubT = now + Math.random() * 500; a.sawHow = ''; } }
function dropThing(e) {
  const ht = heldThing; heldThing = null; const c = toCell(e.clientX, e.clientY), x = clamp(c.x | 0, 0, N - 1), y = clamp(c.y | 0, 0, N - 1), res = W.G.drop(ht.h, x, y);
  const SAY = { store: 'Set down by the fire: it is the village\'s now.', spark: 'Stone on stone: a spark, and the dry grass has caught.', fire: 'Fire, set down.', out: 'The fire is out in the water.', doused: 'The water has put the fire out.',
    wet: 'Water on the ground.', tree: 'The tree stands where it was put.', logs: 'The tree has come down as logs.', site: 'Set down on the nearest free lot.', back: 'There is no free lot there: it is back where it stood.' };
  if (SAY[res]) say(SAY[res]);
  if (res === 'spark' || res === 'fire') { burst(c.x, c.y, 'ember', 12); burst(c.x, c.y, 'smoke', 8); scatterFrom(c.x, c.y, 3); for (let i = 0; i < N * N; i++) if (W.burn[i] > 0) scar[i] = 1; }
  else if (res === 'wet' || res === 'doused') burst(c.x, c.y, 'splash', 8, { vy: -0.03, max: 350 }); else if (res === 'out' || res === 'water') ripples.push({ x: isoX(c.x, c.y), y: isoY(c.x, c.y), t: now });
  else burst(c.x, c.y, 'dust', 6);
  if (res === 'site' || res === 'back') { syncLots(); syncHuts(); startPaint(); }
  takeEvents(true); reconcile(); repaintCells(x - 3, y - 3, x + 3, y + 3); showSeen();
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
  if (act && tool === 'hand' && act.pan && !held && !heldThing && now - act.t0 > 350 && Math.hypot(act.x - act.x0, act.y - act.y0) < 6) { if (liftAt(toCell(act.x, act.y), toWorld(act.x, act.y), true)) act.pan = false; else act.t0 = 1e15; }
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
  while (logSeen < S.log.length) { const e = S.log[logSeen++]; if (e.band === undefined || e.band === -1 || e.band === (S.watch || 0)) say(e.text); }   /* the news of the band being watched, and of what passes between bands */
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
  paceCheck(dtMs);
  glideStep(dtMs);
  propsFollowView(); watchFollowsView();
  const dts = paused ? 0 : dtMs * speed / 1000;
  if (!paused) {
    usePower(dtMs); gameMs += dtMs * speed; tickFrac += dtMs * speed / TICK_MS;
    /* a slow frame catches up on the steps it missed, a few at a time, so fast speeds stay fast on a slow device */
    /* with several bands a step is taken a band at a time, and no more of it in one frame than a few thousandths of a second allow */
    { const t0 = performance.now(); for (let n = 0; tickFrac >= 1 && n < 24; n++) { if (!midTick) { driftNote(); midTick = true; } if (!W.tickSlice()) { if (performance.now() - t0 > 10) break; continue; } midTick = false; tickFrac -= 1; onTick(); if (performance.now() - t0 > 14) break; } }
    if (tickFrac >= 1) tickFrac = 0.99;
  }
  if (!paint && groundWanted) startPaint();
  /* the ground gets a slice of each frame's time, more when the days run fast, in strips of rows */
  if (paint) { const t0 = performance.now(), budget = speed > 1 || act ? 9 : 4; do paintSome(24); while (paint && performance.now() - t0 < budget); }
  const z = cam.z, u = tickFrac, tod = ((S.tickNo % DAY) + u) / DAY, dark = lightAt(tod) * (speed >= 8 ? 0.5 : 1);
  cx.setTransform(1, 0, 0, 1, 0, 0);
  const sky = cx.createLinearGradient(0, 0, 0, cv.height); sky.addColorStop(0, '#31504f'); sky.addColorStop(1, '#1d3136'); cx.fillStyle = sky; cx.fillRect(0, 0, cv.width, cv.height);
  cx.imageSmoothingEnabled = false; cx.setTransform(z, 0, 0, z, -Math.round(cam.x * z), -Math.round(cam.y * z));
  // ground, crossfading into its newest picture
  drawGround(cx);
  const vw = cv.width / z, vh = cv.height / z, vx0 = cam.x - 80, vx1 = cam.x + vw + 80, vy0 = cam.y - 20, vy1 = cam.y + vh + 150;
  const vis = (wx, wy) => wx > vx0 && wx < vx1 && wy > vy0 && wy < vy1;
  drawFlow(cx, vis);
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
  /* who is at work on which house, and who is tucked away in which burrow, den or house: counted once a frame, not once a house */
  const workingOn = new Set(), hidHome = new Map(), hidHomeGrazer = new Map(), hidHut = new Map();
  for (const r of actors.values()) { if (r.step && r.step.pose === 'work' && r.step.site !== undefined) workingOn.add(r.step.site);
    if (r.pose === 'hidden') { const h = r.a.home; if (h) { hidHome.set(h, (hidHome.get(h) || 0) + 1); if (!r.a.d.eats.meat) hidHomeGrazer.set(h, (hidHomeGrazer.get(h) || 0) + 1); } if (r.step && r.step.hut) hidHut.set(r.step.hut, (hidHut.get(r.step.hut) || 0) + 1); } }
  for (let k = 0; k < huts.length; k++) {
    const h = huts[k]; if (!h) continue; const wx = isoX(h.x, h.y), wy = isoY(h.x, h.y) + 20;
    let al = 1; if (h.die) { al = 1 - (now - h.die) / 2500; if (al <= 0) { huts[k] = null; continue; } }
    const working = workingOn.has(h.k);
    if (working) h.workedAt = now;
    /* it rises only under someone's hands: while a builder is at it, and for a few moments after they put down their tools */
    if (h.p < h.target && dts > 0 && (working || now - (h.workedAt || -1e9) < 6000)) h.p = Math.min(h.target, h.p + dts * (working ? 1 / 10 : 1 / 30));
    const snowy = W.snow[(h.y | 0) * N + (h.x | 0)] > 0.08;
    /* a house turns its door toward the fire and the way its people walk: the drawing has the door on its left, so a house
       with the fire off to its right on screen is drawn mirrored (straight below the fire, half each way) */
    const toFire = (camp.x - camp.y) - (h.x - h.y), flip = toFire > 0.5 || (Math.abs(toFire) <= 0.5 && h.id % 2 === 1), face = im => flip ? mirrorOf(im) : im;
    if (h.upon) continue;   /* drawn with the house it stands on */
    if (h.was && h.p < 1) put(face(storeyed(dwellImg(h.was, h.lake, snowy), h.floors || 1)), wx, wy, { scaf: h.p, alpha: al < 1 ? al : undefined, hut: h });   // lived in while it is rebuilt around them
    else put(face(storeyed(dwellImg(h.kind, h.lake, snowy), (h.floors || 1) + (h.floorUp ? 1 : 0))), wx, wy, { build: h.p < 1 ? h.p : undefined, scaf: h.floorUp ? 0.6 : undefined, alpha: al < 1 ? al : undefined, hut: h });
  }
  for (let k = huts.length - 1; k >= 0 && !huts[k]; k--) huts.pop();
  for (const g of graves) { const wx = isoX(g.x, g.y), wy = isoY(g.x, g.y); if (vis(wx, wy)) put(A.grave, wx, wy + 4, { alpha: clamp((now - g.born) / 3000, 0, 1) }); }
  /* the fires of the other bands: a ring of stones, and a flame while theirs is lit */
  if (S.tribes && S.tribes.length > 1) for (const B of S.tribes) { if (B === T0 || !B.skills.fire) continue; const wx = isoX(B.x + 1.05, B.y + 0.65), wy = isoY(B.x + 1.05, B.y + 0.65); if (!vis(wx, wy)) continue; put(A.ring, wx, wy + 4); if (S.t - (B.fireT || -9) < 0.12 || dark > 0.2) put(A.fire[((t / 170) | 0) % 2], wx, wy + 2); }
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
    const key = ((r.y + r.oy) | 0) * N + ((r.x + r.ox) | 0);
    let b = bins.get(key);
    if (!b) bins.set(key, b = []);
    b.push(r);
  }
  for (const r of actors.values()) {
    r.ox *= 0.985; r.oy *= 0.985; if (!bins.size) break; if (r.dead && r.dead.shown || r.pose === 'hidden' || r.pose === 'carried' || r.held) continue;
    { const wx = isoX(r.x, r.y), wy = isoY(r.x, r.y); if (wx < vx0 || wx > vx1 || wy < vy0 || wy > vy1) continue; }   /* only those on screen are nudged apart */
    const bx0 = (r.x + r.ox) | 0, by0 = (r.y + r.oy) | 0, rr = BODY[kind(r.a)];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const b = bins.get((by0 + dy) * N + bx0 + dx);
      if (!b) continue;
      /* in a crowd, a body feels only the nearest few round it: ten from each tile is enough to keep apart */
      for (let bi = 0, bn = Math.min(b.length, 10); bi < bn; bi++) { const o = b[(bi + (r.id % b.length)) % b.length];
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
    if (S.ask && id === S.ask.id && sp.up && !moving) im = sp.up[face];   /* the one who asks stands with arms raised */
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
      want: r.a.d.people && !r.a.held ? W.wantOf(r.a) : '',
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
      n += hidHomeGrazer.get(d.peek.home) || 0;
      if (n && ((t / 2200 + d.peek.home) | 0) % 3 !== 0) cx.drawImage(A.peek, Math.round(d.peek.x - 5), Math.round(d.peek.y - 4));
    }
    if (d.eyes) {
      let n = 0;
      n += hidHome.get(d.eyes.home) || 0;
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
      n += hidHut.get(d.hut.k + 1) || 0;
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
  /* what each person wants most, as a small sign over their head: it stays for as long as the want does */
  if (z / dpr > 0.7) { let shown = 0; for (const d of draws) if (!d.bub && d.want && A.bubble[d.want] && shown++ < 80) cx.drawImage(A.bubble[d.want], Math.round(d.bx - 8), d.top - 19, 16, 17); }
  /* harvest: what each household brought in, rising from its fields and fading */
  for (let k = pops.length - 1; k >= 0; k--) { const p = pops[k], age = (now - p.t) / 3000; if (age > 1) { pops.splice(k, 1); continue; } if (age < 0) continue;
    const wx = isoX(p.x, p.y), wy = isoY(p.x, p.y) - 10 - age * 26; cx.globalAlpha = age < 0.75 ? 1 : (1 - age) * 4;
    const parts = []; if (p.grain > 0) parts.push(['grain', p.grain]); if (p.veg > 0) parts.push(['veg', p.veg]);
    parts.forEach(([g, n], i) => { const im = g === 'grain' ? (A.grainCrop && A.grainCrop[3]) : (A.crop && A.crop[2]), ox = (i - (parts.length - 1) / 2) * 24;
      if (im) cx.drawImage(im, Math.round(wx + ox - 14), Math.round(wy - 12), 14, 14 * im.height / im.width);
      cx.font = 'bold 8px monospace'; cx.lineWidth = 2; cx.strokeStyle = '#2a1c16'; cx.fillStyle = g === 'grain' ? '#f6d16b' : '#b8e07a'; cx.strokeText('+' + n, Math.round(wx + ox + 1), Math.round(wy)); cx.fillText('+' + n, Math.round(wx + ox + 1), Math.round(wy)); });
    cx.globalAlpha = 1; }
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
  if (heldThing) { const ht = heldThing, hx = Math.round(ht.wx), hy = Math.round(ht.wy);
    if (ht.h.k === 'pile') { const im = A.item[ht.h.kind === 'wood' ? 'log' : ht.h.kind]; for (let k = 0; k < 3; k++) cx.drawImage(im, Math.round(hx - im.width / 2 + (k - 1) * 4), hy - 18 - k * 3); }
    else if (ht.h.k === 'tree' && ht.img) cx.drawImage(ht.img, Math.round(hx - ht.img.width / 2), hy - ht.img.height + 4);
    else if (ht.h.k === 'fire') { const f = Math.floor(t / 90) % 3; cx.fillStyle = '#e8622c'; cx.fillRect(hx - 3, hy - 14 - f, 6, 8 + f); cx.fillStyle = '#ffb347'; cx.fillRect(hx - 2, hy - 12 - f, 4, 6 + f); cx.fillStyle = '#fff3b0'; cx.fillRect(hx - 1, hy - 9, 2, 3); cx.fillStyle = '#5a3a22'; cx.fillRect(hx - 1, hy - 6, 2, 8); }
    else if (ht.h.k === 'water') { cx.fillStyle = '#4f93a3'; cx.fillRect(hx - 4, hy - 12, 8, 5); cx.fillRect(hx - 3, hy - 13, 6, 7); cx.fillStyle = '#cfe9e4'; cx.fillRect(hx - 2, hy - 12, 2, 1); } }
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
/* one power only: the hand. There is nothing to choose between, so no buttons are shown */
for (const [id, label] of []) {
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
  /* how many bands begin: one, or several far apart on the same land */
  if (el) { const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap'; row.innerHTML = '<b style="font-size:14px">Bands of people:</b>';
    for (const n of [1, 2, 3, 4]) { const b = document.createElement('button'); b.className = 'btn land' + (n === (S.tribes ? Math.max(1, S.tribes.filter(B => !B.from && B.from !== 0).length) : 1) ? ' sel' : ''); b.textContent = String(n);
      b.onclick = () => { try { localStorage.setItem('eden.bands', String(n)); } catch (e) { /* ignore */ } if (window.EDEN_EMBED) { location.reload(); return; } const q = new URLSearchParams(location.search); q.set('bands', String(n)); q.set('fresh', '1'); location.search = q.toString(); }; row.appendChild(b); }
    el.parentNode.insertBefore(row, el.nextSibling); }
}
// THE FIRST QUESTION: when someone asks who is there, their face comes up with their words, and the player may answer with a name
{ const box = document.createElement('div'); box.id = 'ask';
  box.style.cssText = 'display:none;position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom));width:min(92vw,400px);box-sizing:border-box;background:var(--paper);color:var(--ink);border:3px solid var(--line);border-radius:9px;padding:12px;z-index:6;box-shadow:0 5px 0 rgba(59,43,31,.5);font-size:14px';
  box.innerHTML = '<div style="display:flex;gap:12px;align-items:center"><canvas id="askFace" width="64" height="80" style="width:96px;height:120px;image-rendering:pixelated;flex:none;background:rgba(0,0,0,.08);border-radius:6px"></canvas><div><b id="askWho"></b><p id="askSay" style="margin:6px 0 0;line-height:1.35"></p></div></div>'
    + '<div style="display:flex;gap:6px;margin-top:10px"><input id="askIn" maxlength="24" placeholder="A name" autocomplete="off" style="flex:1;min-width:0;font:inherit;padding:7px;border:2px solid var(--line);border-radius:6px;background:#fffdf2;color:var(--ink)"><button class="btn" id="askGo">Answer</button><button class="btn" id="askNo">Say nothing</button></div>';
  document.body.appendChild(box); let shownFor = 0, passed = 0;
  const inp = box.querySelector('#askIn'), hide = () => { box.style.display = 'none'; shownFor = 0; };
  const answer = () => { const v = inp.value.trim(); if (!v || !S.ask) return; W.G.answer(v); inp.value = ''; hide(); takeEvents(true); };
  box.querySelector('#askGo').onclick = answer; inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') answer(); });
  box.querySelector('#askNo').onclick = () => { passed = S.ask ? S.ask.id : 0; hide(); };   /* they go on waiting, and in the end find a word of their own */
  setInterval(() => { const q = S.ask; if (!q) { if (shownFor) hide(); return; } if (shownFor === q.id || passed === q.id || paused) return; const a = S.agents.find(b => b.id === q.id); if (!a || !a.alive) return;
    shownFor = q.id; const L = lookOf(a), sp = L.make ? L.make(a, a.age > 46 ? 'old' : 'grown') : L.grown[a.id % L.grown.length], im = sp.r[0];
    const c = box.querySelector('#askFace'), g = c.getContext('2d'), k = Math.max(2, Math.round(c.width / im.width * 1.7)); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height); g.drawImage(im, Math.round((c.width - im.width * k) / 2), 6, im.width * k, im.height * k);   /* head and shoulders, large */
    box.querySelector('#askWho').textContent = a.name + ', ' + Math.floor(a.age);
    /* a later question: their words and the answers they offer come with it; the name box gives way to buttons */
    const row = box.querySelector('#askIn').parentNode; for (const old of row.querySelectorAll('.askOpt')) old.remove();
    const nameQ = q.kind === 'name'; inp.style.display = nameQ ? '' : 'none'; box.querySelector('#askGo').style.display = nameQ ? '' : 'none';
    if (!nameQ) for (const [k, label] of q.options) { const b = document.createElement('button'); b.className = 'btn askOpt'; b.textContent = label; b.style.flex = '1'; b.onclick = () => { W.G.answer(k); hide(); takeEvents(true); }; row.insertBefore(b, box.querySelector('#askNo')); }
    box.querySelector('#askSay').textContent = !nameQ ? q.say : q.fear ? 'Things move that no hand of ours has touched, and we have been hurt by it. What are you? What are we to call you?' : 'Someone is there. I have seen what you do. Who are you? What shall we call you?';
    box.style.display = 'block';
    /* the view goes to the one who asks */
    const r = recOf(a.id), wx = isoX(r ? r.x : a.x + 0.5, r ? r.y : a.y + 0.5), wy = isoY(r ? r.x : a.x + 0.5, r ? r.y : a.y + 0.5); glide = { wx, wy: wy - 30, z: clamp(Math.max(cam.z, dpr * 2.2), minZ(), maxZ()) }; }, 700); }
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
      reckon: 'too much to keep track of',
      cross: 'rivers to wade',
      sick: 'fever',
      order: 'quarrels unsettled' };
    const felt = Object.keys(T0.need).filter(k => T0.need[k] > 0.15).sort((p, q) => T0.need[q] - T0.need[p]);
    const bar = v => '<span style="display:inline-block;height:6px;width:' + Math.round(Math.min(1, v / 3) * 70 + 4) + 'px;background:#b8453a;border-radius:2px;vertical-align:middle"></span>';
    const near = ideas.filter(q => q.can).sort((p, q) => (T0.need[q.need] / q.at) - (T0.need[p.need] / p.at)).slice(0, 4);
    el.innerHTML = '<b>' + names[T0.level] + ' of ' + S.popPeople + '</b>, year ' + Math.floor(S.cal) + '<br>' + T0.huts + ' roofs' + (T0.wall ? (T0.wall.done
        ? ', fenced' : ', fence going up') : '') + (T0.carts ? ', ' + T0.carts + ' cart' + (T0.carts > 1 ? 's' : '') : '')
      + '<p><b>What weighs on them</b><br>' + (felt.length ? felt.map(k => bar(T0.need[k]) + ' ' + WANT[k]).join('<br>') : 'nothing much: a good season') + '</p>'
      + (() => { const f = T0.foodLast || {}, src = [['grain', 'the fields, grain'], ['veg', 'the fields, greens'], ['fruit', 'gathered'], ['fish', 'fished'], ['meat', 'hunted']], tot = src.reduce((p, [k]) => p + (f[k] || 0), 0); if (!tot) return '';
          return '<p><b>Food last year</b> (' + (tot / Math.max(1, S.popPeople)).toFixed(1) + ' a head)<br>' + src.filter(([k]) => f[k] > 0.5).map(([k, w]) => Math.round(100 * f[k] / tot) + '% ' + w).join('<br>') + '</p>'; })()
      /* the ledger: everything the place has, counted */
      + (() => { const L = W.ledger(), cap = k => k.charAt(0).toUpperCase() + k.slice(1), NAME = { all: 'all', inStore: 'of it in the common store', veg: 'greens', fruit: 'fruit and roots', mournedAtShrine: 'times mourned at the shrine', meadowsweet: 'meadowsweet (fever)', yarrow: 'yarrow (births)', gentian: 'gentian (sick children)', garlic: 'wild garlic (the gut)', haveSeenTheHand: 'have seen the hand', richest: 'the fullest larder', poorest: 'the emptiest', tight: 'who hold tight to theirs', halfHeldBy: 'roofs holding half of it', ofRoofs: 'of', offerings: 'food left out', believe: 'believe someone is there', trusting: 'of them, trusting', fearful: 'of them, fearful',
            grieving: 'grieving now', ways: 'tiles of worn way', fields: 'field tiles', fenced: 'fenced', healerhouse: "healer's house", tallyhouse: 'tally house', born: 'born here', died: 'died', left: 'left the valley', cow: 'cattle', deer: 'deer', rabbit: 'rabbits', wolf: 'wolves' };
          const row = (t, o) => { const ks = Object.keys(o).filter(k => o[k] > 0); return ks.length ? '<tr><td style="vertical-align:top;padding-right:8px"><b>' + t + '</b></td><td>' + ks.map(k => (NAME[k] || k) + ' <b>' + o[k] + '</b>').join(', ') + '</td></tr>' : ''; };
          return '<p><b>Ledger</b></p><table style="border-collapse:collapse;font-size:inherit">' + row('People', L.people) + row('Homes', L.homes) + row('Buildings', L.buildings) + row('Being built', L.building) + row('Food', L.food) + row('Goods', L.goods)
            + row('Food a head, by roof', L.wealth || {}) + row('Know herbs', L.herbs || {}) + (L.bands && L.bands.length ? '<tr><td style="vertical-align:top;padding-right:8px"><b>Other peoples</b></td><td>' + L.bands.map(b => b.name.replace(/[<>&]/g, '') + ': <b>' + b.people + '</b>, ' + b.dist + ' tiles off, ' + b.feeling + (b.wed ? ', ' + b.wed + ' married across' : '') + (b.raids ? ', ' + b.raids + ' raids' : '')).join('<br>') + '</td></tr>' : '') + row('Kept beasts', L.beasts) + row('Wild', L.wild) + row('Land', L.land) + row(L.godName ? 'Faith in ' + L.godName.replace(/[<>&]/g, '') : 'Faith', L.faith) + (L.counsel && L.counsel.length ? '<tr><td style="vertical-align:top;padding-right:8px"><b>Counsel</b></td><td>' + L.counsel.map(k => ({ spare: 'leave the young trees', cut: 'cut what is needed', apart: 'live further apart', nothing: 'no answer to the fever', high: 'keep to high ground', stay: 'stay by the water' }[k] || k)).join(', ') + '</td></tr>' : '') + '</table>'; })()
      + '<p><b>Trades</b><br>' + (Object.keys(jobs).length ? Object.keys(jobs).map(k => jobs[k] + ' ' + k + (jobs[k] > 1 ? 's' : '')).join(', ') : 'none: every hand is needed for food') + '</p>'
      /* F6: every place of work standing, and who works there */
      + (() => { const wp = W.workplaces ? W.workplaces() : []; if (!wp.length) return ''; const nm = l => l.length > 3 ? l.slice(0, 3).join(', ') + ' and ' + (l.length - 3) + ' more' : l.join(', ');
          return '<p><b>Places of work</b><br>' + wp.map(w => (w.job ? w.place + ' (' + w.job + 's)' : 'the ' + w.place) + ': ' + (w.workers.length ? nm(w.workers) : '<i>nobody</i>')).join('<br>') + '</p>'; })()
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
window.EdenGame = { W, cam, actors, props, huts, isoX, isoY, lookOf, setTool: t => {
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
  }, parts, flies, scar, bSc, colorAt, repaintCells, chunks, drift: () => { const o = JSON.parse(JSON.stringify(drift)); for (const k in drift) drift[k] = { n: 0, far: 0, max: 0, ex: '' }; return o; }, paintCounts: () => ({ repaints: chunkRepaints, skips: chunkSkips }),
  groundBytes: () => chunks.reduce((t, c) => t + (c.cv ? CW * CHT * 4 : 0), 0) + fadePool.length * CW * CHT * 4 + CW * CHT * 4 + 10 * CB * CB * 4 + 2 * NT * NT + 4 * 4 * N * N,
  /* the ground as the chunks hold it, laid into one world-sized picture, and how many pixels differ from colorAt (a test) */
  groundCheck() { paint = null; startPaint(); paintSome(1e9, true); const c = mkC(WW, WH), x = c.getContext('2d'); for (const ch of chunks) if (ch.cv) x.drawImage(ch.cv, ch.ox, ch.oy); const d = new Uint32Array(x.getImageData(0, 0, WW, WH).data.buffer); let bad = 0, ex = ''; for (let py = 0; py < WH; py += 3) for (let pxx = 0; pxx < WW; pxx += 3) { const ck = chunkOfPixel(pxx, py); if (ck >= 0 && cbFor !== chunks[ck]) chunkFields(chunks[ck]); const want = colorAt(pxx, py) >>> 0, got = d[py * WW + pxx] >>> 0; if (want !== got && !(want === 0 && (got >>> 24) === 0)) { bad++; if (!ex) ex = pxx + ',' + py + ' want ' + want.toString(16) + ' got ' + got.toString(16); } } return { bad, ex }; } };
requestAnimationFrame(t => { now = t; frame(t); });
})();
