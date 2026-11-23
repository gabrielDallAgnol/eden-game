// Eden art: every sprite is a small hand-placed pixel map. Animals have a grown and a young form.
// A species row can name its look; an unknown animal gets a body built from its traits, so new rows still appear.
(function (root) {
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/* the canvas cut down to its painted rows, so whatever is drawn standing on its bottom edge touches the ground */
const trimRows = c => { const w = c.width, h = c.height, px = c.getContext('2d').getImageData(0, 0, w, h).data; let top = h, bot = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 8) { if (y < top) top = y; bot = y; break; }
  if (bot < 0 || (top === 0 && bot === h - 1)) return c; const o = mk(w, bot - top + 1); o.getContext('2d').drawImage(c, 0, -top); return o; };
const OUT = '#2a1c16';
function grid(rows) { const h = rows.length, w = Math.max(...rows.map(r => r.length)); return rows.map(r => (r + '.'.repeat(w - r.length)).replace(/ /g, '.').split('')); }
// smooth doubling (EPX): keeps hand-drawn curves round instead of blocky
function epx(g) {
  const h = g.length, w = g[0].length, o = []; for (let y = 0; y < h * 2; y++) o.push(new Array(w * 2));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = g[y][x], A = y > 0 ? g[y - 1][x] : '.', B = x < w - 1 ? g[y][x + 1] : '.', C = x > 0 ? g[y][x - 1] : '.', D = y < h - 1 ? g[y + 1][x] : '.';
    o[y * 2][x * 2] = C === A && C !== D && A !== B ? A : P; o[y * 2][x * 2 + 1] = A === B && A !== C && B !== D ? B : P;
    o[y * 2 + 1][x * 2] = D === C && D !== B && C !== A ? C : P; o[y * 2 + 1][x * 2 + 1] = B === D && B !== A && D !== C ? D : P;
  }
  return o;
}
const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const tone = (c, f) => { const [r, g, b] = hex(c), m = v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f))); return 'rgb(' + m(r) + ',' + m(g * (f > 1 ? 1 : 0.98)) + ',' + m(b * (f > 1 ? 0.97 : 1.04)) + ')'; };
// rows + palette -> canvas. opt.x2 doubles smoothly; every sprite gets a dark outline, a lit top edge and a shaded underside.
function sprite(rows, pal, opt) {
  opt = opt || {}; let g = grid(rows); if (opt.x2) g = epx(g);
  const h = g.length, w = g[0].length, c = mk(w + 2, h + 2), x = c.getContext('2d'), on = (xx, yy) => yy >= 0 && yy < h && xx >= 0 && xx < w && g[yy][xx] !== '.';
  for (let yy = -1; yy <= h; yy++) for (let xx = -1; xx <= w; xx++) {
    if (on(xx, yy)) { const base = pal[g[yy][xx]] || '#f0f'; let f = 1; if (!opt.flat) { if (!on(xx, yy - 1)) f = 1.22; else if (!on(xx, yy + 1)) f = 0.74; else if (!on(xx, yy + 2) || !on(xx + 1, yy + 1)) f = 0.88; else if (!on(xx, yy - 2)) f = 1.1; } x.fillStyle = f === 1 ? base : tone(base, f); x.fillRect(xx + 1, yy + 1, 1, 1); }
    else if (!opt.noOutline && (on(xx - 1, yy) || on(xx + 1, yy) || on(xx, yy - 1) || on(xx, yy + 1))) { x.fillStyle = OUT; x.fillRect(xx + 1, yy + 1, 1, 1); }
  }
  return c;
}
const flip = c => { const d = mk(c.width, c.height), g = d.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return d; };
// swap the leg rows to make a second walking frame
const legs = (rows, n, alt) => rows.slice(0, rows.length - n).concat(alt);

// ------------------------------------------------------------------ rabbit
const RAB = { a: '#b08f6c', b: '#7d6048', c: '#c9ab88', w: '#f3ecdf', k: '#1d1516', p: '#dda6a0' };
const rabbitA = [
  '.........bb.bb.',
  '.........ap.ap.',
  '.........ap.ap.',
  '.........ap.ap.',
  '........aaaaaa.',
  '...caaaaaaakaa.',
  '..caaaaaaaaaaab',
  '.caaaaaaaaaaaa.',
  'wcaaaaaaaaaaa..',
  'waaabaaaaabaa..',
  '.abbb....abb...'];
const rabbitB = legs(rabbitA, 2, [
  'waaaabaaabaaa..',
  '.bbb.....bbb...']);
const kitA = [
  '......b.b.',
  '......a.a.',
  '.....aaaaa',
  '..caaaakab',
  '.caaaaaaa.',
  'wcaaaaaa..',
  '.bb...bb..'];
const kitB = legs(kitA, 1, ['..bb.bb...']);

// ------------------------------------------------------------------ deer
const DEER = { a: '#b9844f', b: '#7e5632', c: '#d2a371', w: '#f0e2c6', k: '#17110f', h: '#e4d6b4', s: '#f4ead2' };
const deerA = [
  '.................h...h...',
  '................h.h.h.h..',
  '................hh..hh...',
  '.................hh.h....',
  '................b.hh.....',
  '................baaaa....',
  '.................aakaa...',
  '.................aaaaaak.',
  '.................aaaww...',
  '................aaaa.....',
  '...............caaa......',
  '.w..ccccccccccccaaa......',
  'wwcaaaaaaaaaaaaaaaa......',
  '.waaaaaaaaaaaaaaaaa......',
  '..aaaaaaaaaaaaaaaa.......',
  '..aaaaaaaaaaaaaaa........',
  '..aaawwwwwwwwwaaa........',
  '..ab.ab.......ab.ab......',
  '..ab.ab.......ab.ab......',
  '..a..a........a..a.......',
  '..a..a........a..a.......',
  '..k..k........k..k.......'];
const deerB = legs(deerA, 5, [
  '..ab..ab.....ab..ab......',
  '.ab...ab.....ab...ab.....',
  '.a.....a.....a.....a.....',
  '.a.....a.....a.....a.....',
  '.k.....k.....k.....k.....']);
// a doe: the same body, no antlers
const doeA = ['', '', '', '', '................b..b.....'].concat(deerA.slice(5));
const doeB = ['', '', '', '', '................b..b.....'].concat(deerB.slice(5));
const fawnA = [
  '...........b.b...',
  '...........aaaa..',
  '...........akaa..',
  '...........aaaak.',
  '..........aaaw...',
  '.w.cccccccaa.....',
  'wcasaasaasaa.....',
  '.aaaasaaasaa.....',
  '.aaaaaaaaaa......',
  '.aawwwwwwaa......',
  '.ab.ab..ab.ab....',
  '.a..a...a..a.....',
  '.k..k...k..k.....'];
const fawnB = legs(fawnA, 3, [
  '.ab..ab.ab..ab...',
  'a.....a.a.....a..',
  'k.....k.k.....k..']);

// ------------------------------------------------------------------ wolf
const WOLF = { a: '#8e9099', b: '#5a5c66', c: '#aeb0b8', w: '#dcdde2', k: '#15151a', y: '#e8c44a' };
const wolfA = [
  '..................b..b...',
  '..................ab.ab..',
  '.................aaaaaa..',
  '.................aayaaaa.',
  '................caaaaawwk',
  'b...............caaaawww.',
  'bb...ccccccccccccaaaw....',
  '.bb.caaaaaaaaaaaaaaa.....',
  '.bbbaaaaaaaaaaaaaaaa.....',
  '..bbaaaaaaaaaaaaaaa......',
  '...baaaaaaaaaaaaaa.......',
  '....aaawwwwwwwwaaa.......',
  '....ab.ab.....ab.ab......',
  '....ab.ab.....ab.ab......',
  '....a..a......a..a.......',
  '....k..k......k..k.......'];
const wolfB = legs(wolfA, 4, [
  '....ab..ab...ab..ab......',
  '...ab...ab...ab...ab.....',
  '...a.....a...a.....a.....',
  '...k.....k...k.....k.....']);
const pupA = [
  '.........b..b..',
  '.........ab.ab.',
  '........aaaaaa.',
  '........aakaaa.',
  'b.......aaaawwk',
  'bb.ccccccaaww..',
  '.bcaaaaaaaaa...',
  '..aaaaaaaaaa...',
  '..aawwwwwaa....',
  '..ab.a..ab.a...',
  '..k..k..k..k...'];
const pupB = legs(pupA, 2, [
  '.ab..a.ab...a..',
  '.k...k.k....k..']);

// ------------------------------------------------------------------ people
const SKIN = ['#e8b98f', '#d19a6c', '#b77c50', '#f0c8a4'], HAIR = ['#3a2a1c', '#6b4526', '#b98d4a', '#1f1a18', '#8a8a86'], CLOTH = ['#8a5a3c', '#6f7d4a', '#a8743a', '#5d6f86', '#9a4a3a', '#b9a06a'];
const manA = [
  '...hhhhh...',
  '..hhhhhhh..',
  '..hhsssss..',
  '..hsskssk..',
  '..sssssss..',
  '...sssss...',
  '..ttttttt..',
  '.ttttttttt.',
  '.sttttttts.',
  '.sttttttts.',
  '.sttuuttts.',
  '..ttttttt..',
  '..ttttttt..',
  '..ll...ll..',
  '..ll...ll..',
  '..ll...ll..',
  '..ll...ll..',
  '..bb...bbb.'];
const manB = legs(manA, 5, [
  '..ll...ll..',
  '..ll....ll.',
  '.ll.....ll.',
  '.ll......ll',
  '.bb......bb']);
const womanA = [
  '...hhhhh...',
  '..hhhhhhh..',
  '.hhhsssss..',
  '.hhsskssk..',
  '.hhssssss..',
  '.hh.ssss...',
  '.httttttt..',
  '.ttttttttt.',
  '.sttttttts.',
  '.sttttttts.',
  '.sttuuttts.',
  '..ttttttt..',
  '.ttttttttt.',
  '.ttttttttt.',
  '.ttttttttt.',
  '..ll...ll..',
  '..ll...ll..',
  '..bb...bbb.'];
const womanB = legs(womanA, 3, [
  '..ll....ll.',
  '.ll.....ll.',
  '.bb......bb']);
const childA = [
  '..hhhhh..',
  '.hhhhhhh.',
  '.hssssss.',
  '.sskssks.',
  '.sssssss.',
  '..ttttt..',
  '.sttttts.',
  '.sttttts.',
  '..ttttt..',
  '..ll.ll..',
  '..ll.ll..',
  '..bb.bb..'];
const childB = legs(childA, 3, [
  '..ll.ll..',
  '.ll...ll.',
  '.bb...bb.']);
const elderHair = 4;

// ------------------------------------------------------------------ things
const HUT = { t: '#c9a85a', u: '#a8853f', v: '#e0c479', w: '#8b6a44', x: '#6a4c30', d: '#2e2018', s: '#f3f6fb', m: '#b79463' };
const hut = [
  '............tt............',
  '...........tvvt...........',
  '..........tvvtut..........',
  '.........tvvttuut.........',
  '........tvvtttuuut........',
  '.......tvvttttuuuut.......',
  '......tvvtttttuuuuut......',
  '.....tvvttttttuuuuuut.....',
  '....tvvtttttttuuuuuuut....',
  '...tvvttttttttuuuuuuuut...',
  '..tvvtttttttttuuuuuuuuut..',
  '.tvvttttttttttuuuuuuuuuut.',
  'tttttttttttttttuuuuuuuuuuu',
  '..wwmwwwmwwwwwwwxwwxwwww..',
  '..wmwwwmwwddddwwwxwwwxww..',
  '..wwwmwwwwddddwwxwwwxwww..',
  '..wmwwwmwwddddwwwwxwwwxw..',
  '..wwmwwwwwddddwwwxwwxwww..',
  '..wwwwmwwwddddwwxwwwwxww..'];
const hutSnow = hut.map((r, i) => i < 12 ? r.replace(/v/g, 's').replace(/t(?=[^u]*$)/, 't') : r);
const FIRE = { r: '#d8442a', o: '#f08a2c', y: '#ffd95a', w: '#fff3b8', l: '#5a3b24', g: '#8a8a8a' };
const fire = [[
  '....o....',
  '...oyo...',
  '...oyo.o.',
  '..oyyyo..',
  '..oywyor.',
  '.royyyor.',
  '.llrrrll.',
  'lglllllgl'], [
  '.....o...',
  '.o..oy...',
  '...oyyo..',
  '..oyyyo..',
  '.royywo..',
  '.royyyor.',
  '.llrrrll.',
  'lglllllgl']];
const flame = [[
  '...o...',
  '..oyo..',
  '.oyyo.o',
  '.oywyo.',
  'royyyor',
  '.rooor.'], [
  '..o....',
  '..oyo.o',
  '.oyyyo.',
  'ooywyo.',
  'royyyor',
  '.rooor.']];
const BASK = { b: '#a57b46', c: '#7c5a30', r: '#c9483a', y: '#e2b64c', g: '#7d9a4a' };
const basket = [
  '..ryrg...',
  '.rgyrry..',
  'bbbbbbbbb',
  'bcbcbcbcb',
  '.bcbcbcb.',
  '.bbbbbbb.'];
const BONE = { w: '#efe9da', g: '#bdb5a2' };
const bones = [
  '.w...w...',
  'wwwgwww.w',
  '.w.g.w.ww',
  '..www....'];

// ------------------------------------------------------------------ trees: leaf colour and state follow temperature, water and fruit
const TR = { k: '#5a4230', l: '#7a5a3c' };
const crown = [
  '.....aaaa.....',
  '...aabaaaaa...',
  '..abaaaaabaa..',
  '.aaaabaaaaaaa.',
  '.abaaaaaabaac.',
  'aaaaabaaaaaacc',
  'aabaaaaabaaacc',
  'aaaaaaaaaaaccc',
  '.aaabaaaaacccc',
  '.caaaaaaccccc.',
  '..cccaccccc...',
  '....ccccc.....'];
const trunk = [
  '......kl......',
  '......kl......',
  '.....kkll.....'];
const bare = [
  '....k....k....',
  '.k...k..k..k..',
  '..k..k.kk.k...',
  '...k.kkk.k....',
  '.kk.kkk.kk..k.',
  '...kkkkkk..k..',
  '.....kkkkkk...',
  '......kl......',
  '......kl......',
  '......kl......',
  '......kl......',
  '.....kkll.....'];
function treeSet() {
  const mkT = (pal, fruit, snow) => { const rows = crown.map(r => r.split('')); if (fruit) for (const [x, y] of [[3, 3], [8, 2], [10, 6], [5, 7], [2, 6], [7, 9]]) if (rows[y][x] !== '.') rows[y][x] = 'f'; if (snow) for (let y = 0; y < 5; y++) for (let x = 0; x < 14; x++) if (rows[y][x] !== '.' && (y === 0 || rows[y - 1][x] === '.')) rows[y][x] = 's'; return sprite(rows.map(r => r.join('')).concat(trunk), Object.assign({ f: '#d8402f', s: '#f4f7fb' }, TR, pal)); };
  const green = { a: '#4f8f3e', b: '#6aa84d', c: '#356b33' }, dry = { a: '#8f9440', b: '#a8a850', c: '#6d7334' }, gold = { a: '#d09a34', b: '#e6b94a', c: '#a8702a' }, red = { a: '#b9552c', b: '#d7783a', c: '#8a3d24' };
  const bareS = sprite(bare, TR), bareSnow = sprite(bare.map((r, i) => i < 4 ? r.replace(/k/g, 's') : r), Object.assign({ s: '#f4f7fb' }, TR));
  const burnt = sprite(bare, { k: '#1c1715', l: '#2b2320' });
  return { green: mkT(green), greenFruit: mkT(green, true), dry: mkT(dry), gold: mkT(gold), goldFruit: mkT(gold, true), red: mkT(red), greenSnow: mkT(green, false, true), bare: bareS, bareSnow, burnt };
}
// a young tree
const sapling = ['..aa..', '.abaa.', 'aaaabc', '.aaac.', '..kl..', '..kl..'];

// ------------------------------------------------------------------ thought bubbles
const ICON = {
  cold: [['..w.w..', '.w.w.w.', 'w.www.w', '.wwwww.', 'w.www.w', '.w.w.w.', '..w.w..'], { w: '#4f9fd8' }],
  hot: [['...r...', '.r.r.r.', '..rrr..', 'rrryrrr', '..rrr..', '.r.r.r.', '...r...'], { r: '#e0602c', y: '#ffd95a' }],
  hungry: [['.......', 'b.....b', 'b.....b', 'bb...bb', '.bbbbb.', '..bbb..', '.......'], { b: '#8a6a44' }],
  fed: [['.......', '.gg.gg.', 'ggggggg', 'ggggggg', '.ggggg.', '..ggg..', '...g...'], { g: '#5fae4c' }],
  afraid: [['..rrr..', '..rrr..', '..rrr..', '..rrr..', '...r...', '.......', '..rrr..'], { r: '#d8402f' }],
  asleep: [['.......', 'bbbb...', '..b....', '.b..bbb', 'bbbb.b.', '....bbb', '.......'], { b: '#6a6f9a' }],
  love: [['.......', '.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#e0507a' }],
  wet: [['...b...', '..bbb..', '..bbb..', '.bbbbb.', '.bbwbb.', '.bbbbb.', '..bbb..'], { b: '#3f86c8', w: '#bfe0f7' }],
  grief: [['.......', '.k...k.', '.......', '.......', '..kkk..', '.k...k.', '.......'], { k: '#3a3340' }],
  warm: [['.......', '.k...k.', '.......', 'o.....o', '.k...k.', '..kkk..', '.......'], { k: '#3a3340', o: '#f0a0a0' }],
  chat: [['.......', '.......', '.......', 'k.k.k..', '.......', '.......', '.......'], { k: '#3a3340' }],
  play: [['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.', 'y.....y', '.......'], { y: '#f2c14e' }],
  /* what people love doing, shown over them while they do it */
  music: [['...kkk.', '...k..k', '...k...', '...k...', '.kkk...', 'kkkk...', '.kk....'], { k: '#4a3a6a' }],
  garden: [['..r....', '.rpr.r.', '..r.rpr', '...g.r.', '..gg.g.', '...gg..', '..ggg..'], { r: '#e0507a', p: '#ffd95a', g: '#5fae4c' }],
  story: [['kkkkkkk', 'k.....k', 'k.kkk.k', 'k.....k', 'k.kk..k', 'kkkkkkk', '..k....'], { k: '#5b4632' }],
  carve: [['.....ww', '....ww.', '...ww..', '..k....', '.k.....', 'k......', '.......'], { w: '#c9c4b8', k: '#8a6a48' }],
  dance: [['..k.k..', '.kk.kk.', '..k.k..', '..k.k..', 'kkk.kkk', 'kk..kk.', '.......'], { k: '#c0407a' }]
};
function bubble(icon) {
  const c = mk(13, 14), g = c.getContext('2d');
  g.fillStyle = '#2a2420'; g.fillRect(2, 0, 9, 1); g.fillRect(2, 10, 9, 1); g.fillRect(0, 2, 1, 7); g.fillRect(12, 2, 1, 7); g.fillRect(1, 1, 1, 1); g.fillRect(11, 1, 1, 1); g.fillRect(1, 9, 1, 1); g.fillRect(11, 9, 1, 1); g.fillRect(5, 11, 3, 1); g.fillRect(6, 12, 1, 1);
  g.fillStyle = '#fffaf0'; g.fillRect(2, 1, 9, 9); g.fillRect(1, 2, 11, 7); g.fillRect(5, 10, 3, 1); g.fillRect(6, 11, 1, 1);
  g.drawImage(sprite(icon[0], icon[1], { flat: true, noOutline: true }), 2, 1); return c;
}

// ------------------------------------------------------------------ tool icons
const TOOL = {
  hand: [['.....ss.....', '..ss.ss.ss..', '..ss.ss.ss..', '..ss.ss.ss.s', '..ssssssss.s', 's.ssssssssss', 'ss.sssssssss', '.sssssssssss', '..sssssssss.', '...sssssss..', '...sssssss..', '....sssss...'], { s: '#f1cfa6' }],
  rain: [['...wwww.....', '..wwwwwww...', '.wwwwwwwwww.', 'wwwwwwwwwwww', 'gwwwwwwwwwwg', '.gggggggggg.', '............', '.b..b..b..b.', 'b..b..b..b..', '............', '..b..b..b...', '.b..b..b....'], { w: '#f2f5f9', g: '#b9c4d2', b: '#3f86c8' }],
  sun: [['.....y......', '.y...y...y..', '..y.....y...', '....ooo.....', '...ooooo....', 'yy.ooooo.yy.', '...ooooo....', '....ooo.....', '..y.....y...', '.y...y...y..', '.....y......', '............'], { y: '#ffd95a', o: '#f6a623' }],
  grow: [['............', '......gg....', '.....gggg...', '.gg..ggg....', 'gggg.gg.....', '.ggg.g......', '...ggg......', '.....g......', '.....g......', '....bbb.....', '..bbbbbbb...', '.bbbbbbbbb..'], { g: '#5fae4c', b: '#7a5a3a' }],
  strike: [['......yyy...', '.....yyy....', '....yyy.....', '...yyy......', '..yyyyyy....', '.....yyy....', '....yyy.....', '...yyy......', '..yyy.......', '..yy........', '.yy.........', '.y..........'], { y: '#ffd95a' }]
};


// ------------------------------------------------------------------ painted-by-rule sprites: trees, bushes, rocks, homes
const rngOf = s => { let v = (s * 2654435761) >>> 0 || 1; return () => { v ^= v << 13; v >>>= 0; v ^= v >> 17; v ^= v << 5; v >>>= 0; return v / 4294967296; }; };
// a tent: hides drawn over a ridge pole, open at the lit end, pegged at the corners. The first roof people know how to make.
function tentSprite(snow) {
  const W = 66, H = 50, c = mk(W, H), x = c.getContext('2d'), HIDE = ['#d9bd8c', '#c4a273', '#a8855c', '#86694a'];
  const ax = 22, ay = 6, bx = 48, by = 14, base = 44;                // ridge runs from the front peak (ax, ay) back to (bx, by)
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
    // front face: a triangle under the front peak; side: the long slope down to the right
    const fk = (yy - ay) / (base - ay), fh = fk * 15;                 // half-width of the front triangle at this height
    const inFront = fk >= 0 && fk <= 1 && Math.abs(xx - ax) <= fh;
    const t = (xx - ax) / (bx - ax), ry = ay + (by - ay) * t, sk = (yy - ry) / (base - 4 + t * -2 - ry), inSide = t > 0 && t <= 1.55 && sk >= 0 && sk <= 1 && xx <= bx + sk * 14 && xx >= ax + fh * 0.9;
    if (!inFront && !inSide) continue;
    let col = inFront ? (xx < ax - fh * 0.2 ? HIDE[0] : HIDE[1]) : (sk < 0.25 ? HIDE[1] : sk < 0.7 ? HIDE[2] : HIDE[3]);
    if (inSide && ((xx * 3 + yy) % 13 === 0)) col = HIDE[3];          // seams in the hides
    if (inFront && Math.abs(xx - ax) < fh * 0.42 && fk > 0.3) col = fk > 0.45 && Math.abs(xx - ax) < fh * 0.3 ? '#22160f' : '#5a3f2a';   // the way in
    if (snow && ((inSide && sk < 0.32) || (inFront && fk < 0.2))) col = (xx + yy) % 5 ? '#f6f9fc' : '#dfe7f1';
    x.fillStyle = col; x.fillRect(xx, yy, 1, 1);
  }
  x.fillStyle = '#6e5137'; x.fillRect(ax - 3, 1, 2, 7); x.fillRect(ax + 2, 1, 2, 7); x.fillRect(ax - 1, 4, 3, 2);   // crossed poles at the peak
  x.fillStyle = '#5a3f2a'; for (const px of [6, 38, 60]) x.fillRect(px, base - 1, 2, 4);                              // pegs
  return outlineCanvas(c, OUT);
}
// a well: a ring of stone, two posts, a little roof and a bucket
function wellSprite(snow) {
  const W = 34, H = 40, c = mk(W, H), x = c.getContext('2d'), ST = ['#b9b5aa', '#9a968c', '#77736a', '#5d5a53'];
  for (let yy = 22; yy < 38; yy++) for (let xx = 4; xx < 30; xx++) {
    const u = (xx - 17) / 13, top = 26 + (1 - Math.sqrt(Math.max(0, 1 - u * u))) * -4 + 0, bot = 33 + Math.sqrt(Math.max(0, 1 - u * u)) * 4; if (Math.abs(u) > 1 || yy < 24 - Math.sqrt(1 - u * u) * 2 || yy > bot) continue;
    const inner = ((xx - 17) / 9) ** 2 + ((yy - 26) / 3) ** 2 < 1;
    x.fillStyle = inner ? '#2c3f4a' : ((xx >> 2) + (yy >> 2)) % 2 ? (u < -0.2 ? ST[0] : u < 0.4 ? ST[1] : ST[2]) : (u < -0.2 ? ST[1] : u < 0.4 ? ST[2] : ST[3]); x.fillRect(xx, yy, 1, 1);
  }
  x.fillStyle = '#6e5137'; x.fillRect(6, 9, 2, 17); x.fillRect(26, 9, 2, 17); x.fillStyle = '#8a6a48'; x.fillRect(7, 12, 20, 2);     // posts and windlass
  for (let yy = 2; yy < 10; yy++) { const half = 3 + (yy - 2) * 1.9; for (let xx = Math.round(17 - half); xx <= Math.round(17 + half); xx++) { x.fillStyle = snow && yy < 6 ? '#f6f9fc' : xx < 15 ? '#a8855c' : '#86694a'; x.fillRect(xx, yy, 1, 1); } }
  x.fillStyle = '#4a3222'; x.fillRect(16, 14, 1, 6); x.fillStyle = '#8a6a48'; x.fillRect(14, 20, 5, 4);                            // rope and bucket
  return outlineCanvas(c, OUT);
}
// a granary: a timber store raised on four posts with a flat stone on each against the mice, under a steep thatch (F3)
function granarySprite(snow) {
  const W = 46, H = 54, c = mk(W, H), x = c.getContext('2d'), PL = ['#b08a5c', '#957148', '#7a5a3a', '#5e4430'], TH = ['#e2c779', '#c9a95a', '#a8873f', '#86692e'];
  x.fillStyle = '#5e4430'; for (const px of [9, 18, 28, 36]) x.fillRect(px, 38, 3, 14);                                   // posts
  x.fillStyle = '#9a968c'; for (const px of [7, 16, 26, 34]) x.fillRect(px, 36, 7, 3);                                    // staddle stones
  for (let yy = 22; yy < 37; yy++) for (let xx = 6; xx < 41; xx++) { const left = xx < 24, plank = (yy >> 1) % 2;      // walls of laid planks
    x.fillStyle = left ? PL[plank] : PL[plank + 2]; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = '#3e2c1f'; x.fillRect(13, 26, 6, 10);                                                                      // a small door
  for (let yy = 2; yy < 25; yy++) { const half = 3 + (yy - 2) * 0.95; for (let xx = Math.round(23 - half); xx <= Math.round(23 + half); xx++) {
    let col = xx < 23 ? TH[(yy + (xx >> 1)) % 3 === 0 ? 1 : 0] : TH[(yy + (xx >> 1)) % 3 === 0 ? 3 : 2]; if (snow && yy < 15) col = (xx + yy) % 5 ? '#f6f9fc' : '#dfe7f1'; x.fillStyle = col; x.fillRect(xx, yy, 1, 1); } }
  return outlineCanvas(c, OUT);
}
// a storehouse: a low timber shed where food is kept in fired pots, a few of them standing by the door (F3)
function storehouseSprite(snow) {
  const W = 54, H = 42, c = mk(W, H), x = c.getContext('2d'), PL = ['#b08a5c', '#957148', '#7a5a3a', '#5e4430'], RF = ['#8a6a48', '#6e5137'];
  for (let yy = 18; yy < 37; yy++) for (let xx = 6; xx < 42; xx++) { const left = xx < 20, plank = (xx >> 2) % 2; x.fillStyle = left ? PL[plank] : PL[plank + 2]; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = '#3e2c1f'; x.fillRect(10, 25, 7, 12);                                                                      // the door
  for (let yy = 6; yy < 20; yy++) { const l = 4 + (19 - yy) * 0.2, r = 44 - (19 - yy) * 0.2; for (let xx = Math.round(l); xx < Math.round(r); xx++) {
    let col = (yy % 3 === 0) ? RF[1] : RF[0]; if (snow && yy < 14) col = (xx + yy) % 5 ? '#f6f9fc' : '#dfe7f1'; x.fillStyle = col; x.fillRect(xx, yy, 1, 1); } }
  const pot = (cx, cy, r) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy * 1.3 <= r * r) { x.fillStyle = xx < 0 ? '#c97a4a' : '#a35a35'; x.fillRect(cx + xx, cy + yy, 1, 1); } x.fillStyle = '#7a3f25'; x.fillRect(cx - 2, cy - r - 1, 5, 2); };
  pot(45, 35, 4); pot(50, 37, 3); pot(44, 39, 2);
  return outlineCanvas(c, OUT);
}
// a kiln: a dome of fired clay with a dark stoking mouth, a few pots set out to cool (F4)
function kilnSprite(snow) {
  const W = 44, H = 40, c = mk(W, H), x = c.getContext('2d'), CL = ['#d08a5a', '#b87046', '#9a5a38', '#7a4430'];
  for (let yy = 8; yy < 36; yy++) for (let xx = 4; xx < 36; xx++) { const u = (xx - 20) / 16, v = (yy - 36) / 28; if (u * u + v * v > 1) continue;
    let col = CL[(u < -0.3 ? 0 : u < 0.2 ? 1 : 2) + (((xx >> 2) + (yy >> 2)) % 2 && u > 0.5 ? 1 : 0)]; if (snow && v < -0.75) col = (xx + yy) % 5 ? '#f6f9fc' : '#dfe7f1'; x.fillStyle = col; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = '#2a1a12'; x.fillRect(14, 26, 9, 10); x.fillStyle = '#e8743a'; x.fillRect(16, 31, 5, 4);                  // the mouth, glowing
  x.fillStyle = '#6e5137'; x.fillRect(18, 4, 4, 6);                                                                         // the vent
  const pot = (cx, cy, r) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy * 1.3 <= r * r) { x.fillStyle = xx < 0 ? '#c97a4a' : '#a35a35'; x.fillRect(cx + xx, cy + yy, 1, 1); } };
  pot(37, 34, 3); pot(41, 36, 2);
  return outlineCanvas(c, OUT);
}
// a smithy: an open shed on posts, a stone hearth with its chimney, the anvil out front (F4)
function smithySprite(snow) {
  const W = 52, H = 48, c = mk(W, H), x = c.getContext('2d'), RF = ['#7a5a3a', '#5e4430'], ST = ['#9a968c', '#77736a'];
  x.fillStyle = '#5e4430'; for (const px of [6, 22, 38]) x.fillRect(px, 18, 3, 24);                                         // posts
  for (let yy = 26; yy < 42; yy++) for (let xx = 30; xx < 44; xx++) { x.fillStyle = ST[((xx >> 2) + (yy >> 2)) % 2]; x.fillRect(xx, yy, 1, 1); }   // the hearth
  for (let yy = 2; yy < 26; yy++) for (let xx = 36; xx < 42; xx++) { x.fillStyle = ST[((xx >> 1) + (yy >> 2)) % 2]; x.fillRect(xx, yy, 1, 1); }   // its chimney
  x.fillStyle = '#e8743a'; x.fillRect(33, 33, 8, 3);
  for (let yy = 10; yy < 20; yy++) for (let xx = 2; xx < 46; xx++) { let col = yy % 3 === 0 ? RF[1] : RF[0]; if (snow && yy < 15) col = (xx + yy) % 5 ? '#f6f9fc' : '#dfe7f1'; x.fillStyle = col; x.fillRect(xx, yy, 1, 1); }   // the roof
  x.fillStyle = '#3c3c44'; x.fillRect(10, 36, 10, 3); x.fillRect(13, 39, 4, 5); x.fillRect(9, 35, 3, 2);                    // the anvil on its block
  return outlineCanvas(c, OUT);
}
// a workshop: a timber shed, its wide door open on a half-made cart wheel (F4)
function workshopSprite(snow) {
  const W = 56, H = 44, c = mk(W, H), x = c.getContext('2d'), PL = ['#b08a5c', '#957148', '#7a5a3a', '#5e4430'], RF = ['#8a6a48', '#6e5137'];
  for (let yy = 16; yy < 38; yy++) for (let xx = 4; xx < 44; xx++) { const left = xx < 22, plank = (xx >> 2) % 2; x.fillStyle = left ? PL[plank] : PL[plank + 2]; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = '#3e2c1f'; x.fillRect(8, 24, 12, 14);                                                                       // the wide door
  for (let yy = 4; yy < 18; yy++) for (let xx = 2; xx < 46; xx++) { let col = yy % 3 === 0 ? RF[1] : RF[0]; if (snow && yy < 12) col = (xx + yy) % 5 ? '#f6f9fc' : '#dfe7f1'; x.fillStyle = col; x.fillRect(xx, yy, 1, 1); }
  for (let a = 0; a < 6.28; a += 0.05) { x.fillStyle = '#5e4430'; x.fillRect(Math.round(48 + Math.cos(a) * 6), Math.round(34 + Math.sin(a) * 6), 1, 1); }   // the wheel
  x.fillStyle = '#7a5a3a'; for (let k = 0; k < 4; k++) { const a = k * 0.785; for (let r = 0; r < 6; r++) x.fillRect(Math.round(48 + Math.cos(a) * (r - 3) * 2), Math.round(34 + Math.sin(a) * (r - 3) * 2), 1, 1); }
  return outlineCanvas(c, OUT);
}
// a pen: a square of stakes and rails seen corner-on, a gap for the gate, a trough of hay inside (F5)
function penSprite(snow) {
  const W = 64, H = 40, c = mk(W, H), x = c.getContext('2d');
  const pt = (u, v) => [Math.round(32 + (u - v) * 26), Math.round(8 + (u + v) * 13)];   /* u, v in 0..1 over the pen's square */
  const rail = (a, b, y0) => { const n = 40; for (let k = 0; k <= n; k++) { const t = k / n, X = Math.round(a[0] + (b[0] - a[0]) * t), Y = Math.round(a[1] + (b[1] - a[1]) * t); x.fillStyle = '#8a6a48'; x.fillRect(X, Y - y0, 1, 2); } };
  const corners = [pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)];
  for (let s2 = 0; s2 < 4; s2++) { const a = corners[s2], b = corners[(s2 + 1) % 4]; if (s2 === 2) { const m = [Math.round((a[0] + b[0]) / 2), Math.round((a[1] + b[1]) / 2)]; rail(a, [Math.round(a[0] + (m[0] - a[0]) * 0.7), Math.round(a[1] + (m[1] - a[1]) * 0.7)], 6); rail(a, [Math.round(a[0] + (m[0] - a[0]) * 0.7), Math.round(a[1] + (m[1] - a[1]) * 0.7)], 10); continue; }
    rail(a, b, 6); rail(a, b, 10); }
  x.fillStyle = '#5e4430'; for (const [X, Y] of corners.concat([pt(0.5, 0), pt(1, 0.5), pt(0, 0.5)])) x.fillRect(X - 1, Y - 13, 3, 14);   /* stakes */
  const tr = pt(0.5, 0.45); x.fillStyle = '#7a5a3a'; x.fillRect(tr[0] - 7, tr[1] - 3, 14, 5); x.fillStyle = snow ? '#f6f9fc' : '#e2c779'; x.fillRect(tr[0] - 6, tr[1] - 4, 12, 2);   /* the trough and its hay */
  return outlineCanvas(c, OUT);
}
// a mason's yard: dressed blocks stacked by a lean-to, a block on the banker being worked (F7)
function masonsyardSprite(snow) {
  const W = 56, H = 40, c = mk(W, H), x = c.getContext('2d'), ST = ['#c9c6b8', '#a39f90', '#7d796d'];
  const block = (bx, by, w, h) => { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { x.fillStyle = yy < 2 ? (snow ? '#f6f9fc' : ST[0]) : xx < w * 0.6 ? ST[1] : ST[2]; x.fillRect(bx + xx, by + yy, 1, 1); } };
  x.fillStyle = '#5e4430'; x.fillRect(4, 10, 2, 22); x.fillRect(24, 10, 2, 22); for (let yy = 6; yy < 13; yy++) { x.fillStyle = snow && yy < 9 ? '#f6f9fc' : yy % 2 ? '#8a6a48' : '#6e5137'; x.fillRect(2, yy, 26, 1); }
  block(30, 26, 10, 7); block(41, 26, 10, 7); block(35, 19, 10, 7); block(8, 24, 12, 6); x.fillStyle = '#5e4430'; x.fillRect(10, 30, 2, 6); x.fillRect(16, 30, 2, 6);
  return outlineCanvas(c, OUT);
}
// a healer's house: a small low house with a herb garden fenced in front (F7)
function healerhouseSprite(snow) {
  const W = 56, H = 46, c = mk(W, H), x = c.getContext('2d'), PL = ['#b08a5c', '#957148', '#7a5a3a', '#5e4430'], TH = ['#7fae62', '#5f8f4a'];
  for (let yy = 18; yy < 34; yy++) for (let xx = 6; xx < 34; xx++) { const left = xx < 18, plank = (xx >> 2) % 2; x.fillStyle = left ? PL[plank] : PL[plank + 2]; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = '#3e2c1f'; x.fillRect(10, 24, 6, 10);
  for (let yy = 4; yy < 20; yy++) { const half = 2 + (yy - 4) * 1.1; for (let xx = Math.round(20 - half); xx <= Math.round(20 + half); xx++) { x.fillStyle = snow && yy < 12 ? '#f6f9fc' : (xx < 20 ? '#c9a95a' : '#a8873f'); x.fillRect(xx, yy, 1, 1); } }
  for (let yy = 34; yy < 44; yy++) for (let xx = 30; xx < 54; xx++) { x.fillStyle = snow ? '#e8edf2' : ((xx + yy * 3) % 5 ? TH[(xx >> 1) % 2] : '#d86fa0'); x.fillRect(xx, yy, 1, 1); }   /* the herbs, a few in flower */
  x.fillStyle = '#6e5137'; x.fillRect(30, 33, 24, 1); x.fillRect(30, 43, 24, 1); x.fillRect(30, 33, 1, 11); x.fillRect(53, 33, 1, 11);
  return outlineCanvas(c, OUT);
}
// a lime kiln: a squat stone tower with a draw-hole, white lime spilled at its foot (F7)
function limekilnSprite(snow) {
  const W = 40, H = 48, c = mk(W, H), x = c.getContext('2d'), ST = ['#b9b5aa', '#9a968c', '#77736a'];
  for (let yy = 6; yy < 44; yy++) { const half = 10 + (yy - 6) * 0.18; for (let xx = Math.round(20 - half); xx <= Math.round(20 + half); xx++) { let col = ST[(xx < 18 ? 0 : xx < 24 ? 1 : 2)]; if (((xx >> 2) + (yy >> 2)) % 2 && xx > 22) col = '#5d5a53'; if (snow && yy < 10) col = '#f6f9fc'; x.fillStyle = col; x.fillRect(xx, yy, 1, 1); } }
  x.fillStyle = '#2a1a12'; x.fillRect(16, 32, 8, 10); x.fillStyle = '#e8743a'; x.fillRect(18, 37, 4, 4);
  x.fillStyle = '#f0eee6'; x.fillRect(6, 43, 10, 3); x.fillRect(26, 44, 8, 2);
  return outlineCanvas(c, OUT);
}
// a tally house: a small timber house with a tall post notched with marks by its door (F7)
function tallyhouseSprite(snow) {
  const W = 48, H = 48, c = mk(W, H), x = c.getContext('2d'), PL = ['#b08a5c', '#957148', '#7a5a3a', '#5e4430'];
  for (let yy = 20; yy < 38; yy++) for (let xx = 6; xx < 34; xx++) { const left = xx < 18, plank = (yy >> 1) % 2; x.fillStyle = left ? PL[plank] : PL[plank + 2]; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = '#3e2c1f'; x.fillRect(10, 27, 6, 11);
  for (let yy = 6; yy < 22; yy++) { const half = 2 + (yy - 6) * 1.05; for (let xx = Math.round(20 - half); xx <= Math.round(20 + half); xx++) { x.fillStyle = snow && yy < 13 ? '#f6f9fc' : (yy % 3 ? '#8a6a48' : '#6e5137'); x.fillRect(xx, yy, 1, 1); } }
  x.fillStyle = '#7a5a3a'; x.fillRect(40, 8, 3, 32); x.fillStyle = '#f0e2c0'; for (let k = 0; k < 7; k++) x.fillRect(40, 11 + k * 4, 3, 1);   /* the notched post */
  return outlineCanvas(c, OUT);
}
// grain as it grows: a tuft of green shoots, taller green stalks, stalks heading, and ripe gold ears bending over
function grainSprite(stage) {
  const W = 18, H = 8 + stage * 5, c = mk(W, H), x = c.getContext('2d'), ripe = stage === 3, green = ['#8cbf52', '#62983f'], gold = ['#f2cf5e', '#dba23a', '#b3742b'];
  for (let k = 0; k < 7; k++) { const sx = 2 + k * 2 + (k % 2), h = H - 2 - ((k * 37) % 5); for (let yy = H - 1; yy >= H - h; yy--) { x.fillStyle = ripe ? gold[(k + yy) % 2] : green[(k + yy) % 2]; x.fillRect(sx + (ripe && yy < H - h + 3 ? 1 : 0), yy, 1, 1); }
    if (stage >= 2) { x.fillStyle = ripe ? gold[2] : '#a4c964'; x.fillRect(sx + (ripe ? 1 : 0), H - h, 2, 3); } }
  return outlineCanvas(c, OUT);
}
// a hall: a long timber house with a high roof, a wide door and a bell post where the place is called together
function hallSprite(snow) {
  const W = 76, H = 62, c = mk(W, H), x = c.getContext('2d'), PL = ['#b08a5c', '#957148', '#7a5a3a', '#5e4430'];
  for (let yy = 30; yy < 56; yy++) for (let xx = 6; xx < 62; xx++) { const left = xx < 26, plank = (yy >> 1) % 2; x.fillStyle = left ? PL[plank] : PL[plank + 2]; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = '#3e2c1f'; x.fillRect(11, 38, 10, 18); x.fillStyle = '#6e5137'; for (const wx of [32, 42, 52]) x.fillRect(wx, 38, 5, 6);
  for (let yy = 6; yy < 32; yy++) { const half = 4 + (yy - 6) * 1.2; for (let xx = Math.round(34 - half); xx <= Math.round(34 + half); xx++) { if (xx < 2 || xx > 66) continue; x.fillStyle = snow && yy < 16 ? '#f6f9fc' : (yy % 3 ? '#8a5a3a' : '#6e4430'); x.fillRect(xx, yy, 1, 1); } }
  x.fillStyle = '#5e4430'; x.fillRect(69, 20, 3, 36); x.fillRect(64, 20, 12, 3); x.fillStyle = '#c9a95a'; x.fillRect(68, 23, 5, 6);   /* the bell post */
  return outlineCanvas(c, OUT);
}
// a shrine: standing stones round a small fire, a carved post
function shrineSprite(snow) {
  const W = 40, H = 36, c = mk(W, H), x = c.getContext('2d'), ST = ['#c9c6b8', '#a39f90', '#7d796d'];
  for (const [sx, sh] of [[5, 16], [13, 22], [25, 20], [33, 14]]) for (let yy = 34 - sh; yy < 34; yy++) for (let xx = sx; xx < sx + 5; xx++) { x.fillStyle = snow && yy < 34 - sh + 2 ? '#f6f9fc' : ST[xx - sx < 2 ? 0 : xx - sx < 4 ? 1 : 2]; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = '#7a5a3a'; x.fillRect(19, 6, 3, 28); x.fillStyle = '#c9a95a'; x.fillRect(18, 6, 5, 3);
  x.fillStyle = '#e8743a'; x.fillRect(18, 30, 5, 3); x.fillStyle = '#f2cf5e'; x.fillRect(19, 29, 3, 2);
  return outlineCanvas(c, OUT);
}
// a church: a long stone nave and a square tower with a pointed roof and a cross on top
function churchSprite(snow) {
  const W = 80, H = 92, c = mk(W, H), x = c.getContext('2d'), ST = ['#cfcabb', '#aaa597', '#827d70', '#5d5a53'];
  for (let yy = 50; yy < 88; yy++) for (let xx = 4; xx < 56; xx++) { const left = xx < 22; x.fillStyle = ((xx >> 2) + (yy >> 2)) % 2 ? (left ? ST[0] : ST[2]) : (left ? ST[1] : ST[3]); x.fillRect(xx, yy, 1, 1); }
  for (let yy = 34; yy < 52; yy++) { const half = 2 + (yy - 34) * 1.6; for (let xx = Math.round(30 - half); xx <= Math.round(30 + half); xx++) { if (xx < 2 || xx > 58) continue; x.fillStyle = snow && yy < 42 ? '#f6f9fc' : (yy % 3 ? '#6e5a6a' : '#584656'); x.fillRect(xx, yy, 1, 1); } }
  for (let yy = 22; yy < 88; yy++) for (let xx = 56; xx < 74; xx++) { x.fillStyle = ((xx >> 2) + (yy >> 2)) % 2 ? ST[1] : ST[2]; x.fillRect(xx, yy, 1, 1); }   /* the tower */
  for (let yy = 4; yy < 23; yy++) { const half = (yy - 4) * 0.5; for (let xx = Math.round(65 - half); xx <= Math.round(65 + half); xx++) { x.fillStyle = snow && yy < 14 ? '#f6f9fc' : '#584656'; x.fillRect(xx, yy, 1, 1); } }
  x.fillStyle = '#c9a95a'; x.fillRect(64, 0, 2, 7); x.fillRect(62, 2, 6, 2);   /* the cross */
  x.fillStyle = '#3e2c1f'; x.fillRect(10, 68, 8, 20); x.fillStyle = '#7fa6c9'; for (const wx of [28, 40]) x.fillRect(wx, 60, 4, 9); x.fillRect(62, 40, 6, 9);
  return outlineCanvas(c, OUT);
}
// a dairy: a small whitewashed house kept cool, a churn and a pail at the door
function dairySprite(snow) {
  const W = 52, H = 46, c = mk(W, H), x = c.getContext('2d'), WL = ['#f0ece2', '#d8d2c2', '#bdb6a4'];
  for (let yy = 20; yy < 40; yy++) for (let xx = 6; xx < 40; xx++) { x.fillStyle = xx < 18 ? WL[0] : WL[(yy >> 2) % 2 ? 1 : 2]; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = '#3e2c1f'; x.fillRect(10, 28, 6, 12);
  for (let yy = 6; yy < 22; yy++) { const half = 2 + (yy - 6) * 1.2; for (let xx = Math.round(23 - half); xx <= Math.round(23 + half); xx++) { x.fillStyle = snow && yy < 13 ? '#f6f9fc' : (yy % 3 ? '#8a6a48' : '#6e5137'); x.fillRect(xx, yy, 1, 1); } }
  x.fillStyle = '#8a6a48'; x.fillRect(42, 30, 6, 12); x.fillStyle = '#6e5137'; x.fillRect(42, 33, 6, 1); x.fillRect(42, 38, 6, 1); x.fillStyle = '#5e4430'; x.fillRect(44, 24, 2, 7);   /* the churn */
  x.fillStyle = '#9a968c'; x.fillRect(34, 38, 5, 5); x.fillStyle = '#f6f4ec'; x.fillRect(35, 38, 3, 2);   /* a pail of milk */
  return outlineCanvas(c, OUT);
}
// a dwelling at the water's edge stands on posts with a landing in front, and the flood passes under it
function onStilts(img) {
  const lift = 12, c = mk(img.width + 8, img.height + lift), x = c.getContext('2d'), w = img.width, base = img.height + lift;
  x.fillStyle = '#5a3f2a'; for (const f of [0.14, 0.34, 0.52, 0.7, 0.88]) x.fillRect(Math.round(w * f) + 2, img.height - 14, 2, lift + 12);
  x.fillStyle = '#8a6a48'; x.fillRect(4, img.height - 4, w, 3); x.fillStyle = '#6e5137'; x.fillRect(4, img.height - 1, w, 1);          // the deck
  x.fillStyle = '#a8855c'; x.fillRect(0, base - 9, Math.round(w * 0.3), 2); x.fillStyle = '#5a3f2a'; x.fillRect(1, base - 7, 2, 7); x.fillRect(Math.round(w * 0.3) - 3, base - 7, 2, 7);   // a landing for the boat
  x.drawImage(img, 4, 0); return c;
}
// one tile of a log bridge, running along x (horiz) or along y: a deck of planks laid across the way of travel, a rail on each side
function bridgeSprite(horiz, piles) {
  const c = mk(64, 56), x = c.getContext('2d');
  const top = [32, 8], ax = horiz ? [32, 16] : [-32, 16], ay = horiz ? [-32, 16] : [32, 16];
  const at = (u, v, lift) => [top[0] + u * ax[0] + v * ay[0], top[1] + u * ax[1] + v * ay[1] - (lift || 0)];
  const quad = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.closePath(); x.fill(); };
  const line = (p, q, col, w) => { x.strokeStyle = col; x.lineWidth = w || 1; x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke(); };
  const D = 4;   /* the deck stands this many pixels above the water */
  /* piles driven into the river bed, with a ripple where each meets the water */
  for (const u of [0.18, 0.82]) for (const v of [0.12, 0.88]) {
    const p = at(u, v, -D - 10); x.fillStyle = 'rgba(214,236,240,.75)'; x.fillRect(Math.round(p[0]) - 3, Math.round(p[1]), 7, 1);
    const q = at(u, v, D); x.fillStyle = '#4a3222'; x.fillRect(Math.round(q[0]) - 1, Math.round(q[1]), 3, D + 10); x.fillStyle = '#6e5137'; x.fillRect(Math.round(q[0]) - 1, Math.round(q[1]), 1, D + 10);
  }
  if (!piles) {
    /* the deck: its shadowed side, then planks laid across the way, with a beam along each edge */
    quad([at(0, 0.08, D - 3), at(1, 0.08, D - 3), at(1, 0.92, D - 3), at(0, 0.92, D - 3)], '#3e2a1c');
    quad([at(0, 0.08, D), at(1, 0.08, D), at(1, 0.92, D), at(0, 0.92, D)], '#a8855c');
    for (let k = 0; k < 10; k++) { const u0 = k / 10, u1 = (k + 1) / 10; quad([at(u0, 0.1, D), at(u1 - 0.015, 0.1, D), at(u1 - 0.015, 0.9, D), at(u0, 0.9, D)], k % 3 === 0 ? '#b8946a' : k % 3 === 1 ? '#a07c54' : '#ac8860'); }
    for (const v of [0.08, 0.92]) line(at(0, v, D), at(1, v, D), '#6e5137', 2);
    /* the rails: posts at each end and in the middle, a pole along the top lit on its upper side */
    for (const v of [0.1, 0.9]) {
      for (const u of [0.04, 0.5, 0.96]) { const p = at(u, v, D); x.fillStyle = '#5a3f2a'; x.fillRect(Math.round(p[0]) - 1, Math.round(p[1]) - 8, 2, 8); }
      line(at(0, v, D + 8), at(1, v, D + 8), '#6e5137', 2); line(at(0, v, D + 9), at(1, v, D + 9), '#c9a779', 1);
    }
  } else {
    /* half built: a cross-beam on the piles, waiting for its planks */
    for (const u of [0.18, 0.82]) line(at(u, 0.08, D), at(u, 0.92, D), '#6e5137', 2);
  }
  return outlineCanvas(c, OUT);
}
// a garden bed by the door: dug earth with flowers, fuller the more it is tended (stage 1 to 3)
function gardenSprite(stage) {
  const c = mk(40, 24), x = c.getContext('2d');
  x.fillStyle = '#7a5a3a'; x.beginPath(); x.moveTo(20, 2); x.lineTo(38, 11); x.lineTo(20, 20); x.lineTo(2, 11); x.closePath(); x.fill();
  x.fillStyle = '#5e4630'; for (let k = 0; k < 4; k++) { x.fillRect(8 + k * 6, 8 + (k % 2) * 2, 5, 1); }
  const r = rngOf(7 + stage), cols = ['#e0507a', '#ffd95a', '#f2f0e8', '#b06ad8', '#ff8a3a'];
  for (let k = 0; k < 6 + stage * 5; k++) { const px = 6 + r() * 28, py = 6 + r() * 10; if (Math.abs(px - 20) / 18 + Math.abs(py - 11) / 9 > 1) continue; x.fillStyle = '#4f8a3a'; x.fillRect(px | 0, (py | 0) - 1, 1, 3); x.fillStyle = cols[(r() * cols.length) | 0]; x.fillRect((px | 0) - 1, (py | 0) - 2, 2, 2); }
  return outlineCanvas(c, OUT);
}
// a carved bench, set by the door of someone who carves
function benchSprite(carved) {
  const c = mk(30, 22), x = c.getContext('2d');
  x.fillStyle = '#6e5137'; x.fillRect(4, 12, 3, 8); x.fillRect(23, 12, 3, 8);
  x.fillStyle = '#a8855c'; x.fillRect(2, 9, 26, 4); x.fillStyle = '#86694a'; x.fillRect(2, 12, 26, 1);
  if (carved) { x.fillStyle = '#a8855c'; x.fillRect(3, 2, 24, 3); x.fillRect(4, 5, 2, 4); x.fillRect(24, 5, 2, 4); x.fillStyle = '#6e5137'; for (let k = 0; k < 5; k++) x.fillRect(7 + k * 4, 3, 2, 1); }
  return outlineCanvas(c, OUT);
}
// firewood stacked by a door: one to three rows of log ends
function woodpileSprite(n) {
  const c = mk(26, 20), x = c.getContext('2d');
  for (let row = 0; row < n; row++) for (let k = 0; k < 4 - row; k++) { const px = 3 + k * 5 + row * 2.5, py = 15 - row * 4; x.fillStyle = '#7a5a3a'; x.fillRect(px | 0, py | 0, 5, 4); x.fillStyle = '#c9a779'; x.fillRect((px | 0) + 1, (py | 0) + 1, 3, 2); x.fillStyle = '#8a6a48'; x.fillRect((px | 0) + 2, (py | 0) + 1, 1, 1); }
  return outlineCanvas(c, OUT);
}
// a log to sit on by the fire
function logSeatSprite() {
  const c = mk(26, 12), x = c.getContext('2d');
  x.fillStyle = '#7a5a3a'; x.fillRect(2, 4, 20, 6); x.fillStyle = '#9a7a52'; x.fillRect(2, 4, 20, 2); x.fillStyle = '#c9a779'; x.fillRect(21, 4, 3, 6); x.fillStyle = '#8a6a48'; x.fillRect(22, 6, 1, 2);
  return outlineCanvas(c, OUT);
}
// a run of sharpened stakes across one tile, along one of the two ground directions; and the two posts of a gate
function fenceSprite(alongX, gate) {
  const W = 38, H = 36, c = mk(W, H), x = c.getContext('2d'), n = gate ? 2 : 7;
  for (let k = 0; k < n; k++) {
    const t = gate ? (k ? 0.92 : 0.08) : (k + 0.5) / n, px = Math.round(alongX ? 3 + t * 30 : 33 - t * 30), py = Math.round(14 + t * 15), tall = gate ? 20 : 13 + (k % 2);
    for (let yy = 0; yy < tall; yy++) { const w = yy === 0 ? 1 : yy === 1 ? 2 : 3; x.fillStyle = yy < 3 ? '#c9a779' : (yy % 5 === 4 ? '#6e5137' : alongX ? '#8a6a48' : '#a07c54'); x.fillRect(px - (w >> 1), py - tall + yy, w, 1); }
  }
  if (!gate) { x.fillStyle = '#5a3f2a'; for (let k = 0; k < 30; k++) x.fillRect(alongX ? 3 + k : 33 - k, Math.round(14 + (k / 30) * 15) - 6, 1, 1); }   // the tie rail
  return outlineCanvas(c, OUT);
}
function outlineCanvas(c, col) {
  const w = c.width, h = c.height, x = c.getContext('2d'), d = x.getImageData(0, 0, w, h), a = d.data, on = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && a[(yy * w + xx) * 4 + 3] > 0, add = [];
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (!on(xx, yy) && (on(xx - 1, yy) || on(xx + 1, yy) || on(xx, yy - 1) || on(xx, yy + 1))) add.push(xx, yy);
  x.fillStyle = col; for (let k = 0; k < add.length; k += 2) x.fillRect(add[k], add[k + 1], 1, 1); return c;
}
// A lump made of overlapping round clusters, each lit from the upper left: tree crowns, bushes, boulders.
function lumps(x, blobs, pal, o) {
  o = o || {}; const r0 = rngOf(o.seed || 1); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const b of blobs) { x0 = Math.min(x0, b.x - b.r); x1 = Math.max(x1, b.x + b.r); y0 = Math.min(y0, b.y - b.r); y1 = Math.max(y1, b.y + b.r); }
  x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.ceil(x1); y1 = Math.ceil(y1); const W = x1 - x0 + 1, H = y1 - y0 + 1, own = new Int8Array(W * H).fill(-1), lit = new Float32Array(W * H);
  blobs.forEach((b, k) => { for (let yy = Math.floor(b.y - b.r); yy <= b.y + b.r; yy++) for (let xx = Math.floor(b.x - b.r); xx <= b.x + b.r; xx++) { const nx = (xx - b.x) / b.r, ny = (yy - b.y) / (b.r * (o.squash || 1)); if (nx * nx + ny * ny > 1) continue; const i = (yy - y0) * W + (xx - x0); own[i] = k; lit[i] = -(nx * 0.6 + ny * 0.8); } });
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
    const i = yy * W + xx; if (own[i] < 0) continue; const l = lit[i], under = yy > 0 && own[i - W] >= 0 && own[i - W] > own[i];
    let t = l > 0.52 ? 0 : l > 0.08 ? 1 : l > -0.48 ? 2 : 3; const n = r0();
    if (o.speck && n < o.speck && t > 0 && t < 3) t--; else if (o.speck && n > 1 - o.speck * 0.6 && t < 3) t++;
    if (yy < H - 1 && own[i + W] > own[i] && own[i + W] >= 0) t = 3;           // the cluster in front casts a rim of shade
    let col = pal[t]; if (o.snow && l > 0.3) col = l > 0.62 ? '#ffffff' : '#e3ebf5';
    x.fillStyle = col; x.fillRect(xx + x0, yy + y0, 1, 1);
  }
  if (o.fruit) for (let k = 0; k < o.fruit; k++) { const b = blobs[(r0() * blobs.length) | 0], fx = Math.round(b.x + (r0() - 0.5) * b.r), fy = Math.round(b.y + (r0() - 0.2) * b.r * 0.8); x.fillStyle = '#7a1f1a'; x.fillRect(fx, fy, 3, 3); x.fillStyle = '#d8402f'; x.fillRect(fx, fy, 2, 2); x.fillStyle = '#ff8a6a'; x.fillRect(fx, fy, 1, 1); }
}
const BARK = ['#8a6a48', '#6e5238', '#523b29'];
function drawTrunk(x, cx, base, top, w) {
  for (let yy = top; yy <= base; yy++) { const k = (yy - top) / (base - top), half = w / 2 + (k > 0.8 ? (k - 0.8) * 5 * 3 : 0) + (k < 0.15 ? (0.15 - k) * 8 : 0); for (let xx = Math.round(cx - half); xx <= Math.round(cx + half); xx++) { const u = (xx - (cx - half)) / (half * 2 || 1); x.fillStyle = u < 0.3 ? BARK[0] : u < 0.7 ? BARK[1] : BARK[2]; if ((yy * 7 + xx * 3) % 11 === 0) x.fillStyle = BARK[2]; x.fillRect(xx, yy, 1, 1); } }
}
function crownBlobs(seed, cx, cy, rx, ry, n, rmin, rmax) { const r = rngOf(seed), b = []; for (let k = 0; k < n; k++) { const a = k / n * 6.283 + r() * 0.8, d = k === 0 ? 0 : 0.35 + r() * 0.65; b.push({ x: cx + Math.cos(a) * rx * d, y: cy + Math.sin(a) * ry * d, r: rmin + r() * (rmax - rmin) }); } b.sort((p, q) => p.y - q.y); return b; }
const LEAF = {
  green: ['#9cc65a', '#6fa544', '#4c8237', '#2f5b2e'], dry: ['#c2c063', '#9a9a48', '#74783a', '#4f552c'], gold: ['#f2cf5e', '#dba23a', '#b3742b', '#7c4b22'], red: ['#ee9a50', '#cf6a34', '#a2452a', '#6f2c22'],
  pine: ['#6f9f58', '#4a7c46', '#33603c', '#1f4230'], bush: ['#a4c964', '#78a84a', '#55863c', '#356030'], rock: ['#c9c6b8', '#a39f90', '#7d796d', '#56534c']
};
function leafTree(seed, state, young) {
  const W = young ? 50 : 92, H = young ? 56 : 104, c = mk(W, H), x = c.getContext('2d'), cx = W / 2, r = rngOf(seed + 7);
  if (state === 'bare' || state === 'bareSnow' || state === 'burnt') {
    const tw = young ? 5 : 10, base = H - 3, top = young ? 30 : 56; drawTrunk(x, cx, base, top, tw);
    const limb = (px, py, ang, len, w, d) => { let qx = px, qy = py; for (let s = 0; s < len; s++) { qx += Math.cos(ang); qy += Math.sin(ang); ang += (r() - 0.5) * 0.16; x.fillStyle = s % 5 === 0 ? BARK[0] : BARK[1]; x.fillRect(Math.round(qx), Math.round(qy), Math.max(1, Math.round(w)), Math.max(1, Math.round(w))); if (state === 'bareSnow' && w < 3 && Math.sin(ang) > -0.75 && s % 2 === 0) { x.fillStyle = '#f4f7fb'; x.fillRect(Math.round(qx), Math.round(qy) - 1, Math.max(1, Math.round(w)), 1); } if (d > 0 && s > len * 0.35 && r() < 0.11) limb(qx, qy, ang + (r() < 0.5 ? -0.75 : 0.75), len * 0.55, w * 0.65, d - 1); } if (d > 0) { limb(qx, qy, ang - 0.5, len * 0.6, w * 0.7, d - 1); limb(qx, qy, ang + 0.5, len * 0.6, w * 0.7, d - 1); } };
    limb(cx - 1, top + 2, -1.57, young ? 12 : 22, young ? 3 : 5, young ? 2 : 3);
    if (state === 'burnt') { x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(12,10,10,.82)'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
    return outlineCanvas(c, OUT);
  }
  const cy = young ? 25 : 47; drawTrunk(x, cx, H - 3, cy + (young ? 8 : 14), young ? 5 : 10);
  const blobs = young ? crownBlobs(seed, cx, cy, 9, 8, 6, 8, 12) : crownBlobs(seed, cx, cy, 22, 20, 10, 13, 20);
  const pal = LEAF[state === 'fruit' || state === 'snow' ? 'green' : state === 'goldFruit' ? 'gold' : state];
  lumps(x, blobs, pal, { seed, speck: 0.07, snow: state === 'snow', fruit: state === 'fruit' || state === 'goldFruit' ? (young ? 4 : 11) : 0 });
  return outlineCanvas(c, state === 'gold' || state === 'red' || state === 'goldFruit' ? '#4a2a1c' : '#1f3a26');
}
function pineTree(seed, snow, young, burnt) {
  const W = young ? 34 : 60, H = young ? 66 : 126, c = mk(W, H), x = c.getContext('2d'), cx = W / 2, r = rngOf(seed + 3), tiers = young ? 4 : 6, P = LEAF.pine;
  drawTrunk(x, cx, H - 3, H - (young ? 12 : 18), young ? 3 : 6);
  const th = (H - (young ? 14 : 22)) / (tiers * 0.62 + 0.38);
  for (let t = tiers - 1; t >= 0; t--) {
    const top = 3 + t * th * 0.62, half0 = (young ? 5 : 8) + t * (young ? 2.6 : 3.8);
    for (let yy = 0; yy < th; yy++) { const k = yy / th, half = 1 + k * half0 + (yy > th - 4 ? 0 : 0); for (let xx = Math.round(cx - half); xx <= Math.round(cx + half); xx++) { const u = (xx - cx) / (half || 1), jag = yy > th - 5 && ((xx + t * 3) % 4 < 2) && yy > th - 3; if (jag) continue; let tn = u < -0.35 ? 0 : u < 0.2 ? 1 : u < 0.62 ? 2 : 3; if (k > 0.78 && tn < 3) tn++; if (r() < 0.06 && tn > 0) tn--; let col = P[tn]; if (snow && k < 0.3 + (u < 0 ? 0.18 : 0) && u < 0.5) col = k < 0.16 ? '#ffffff' : '#e3ebf5'; x.fillStyle = col; x.fillRect(xx, Math.round(top + yy), 1, 1); } }
  }
  if (burnt) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(12,10,10,.8)'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
  return outlineCanvas(c, '#16281f');
}
function bushSprite(seed, berries, snow) { const c = mk(34, 26), x = c.getContext('2d'); lumps(x, crownBlobs(seed, 17, 14, 7, 4, 5, 6, 9), LEAF.bush, { seed, speck: 0.08, fruit: berries ? 4 : 0, snow }); return outlineCanvas(c, '#1f3a26'); }
function rockSprite(seed, snow) { const c = mk(30, 22), x = c.getContext('2d'), r = rngOf(seed); lumps(x, [{ x: 11, y: 13, r: 7 + r() * 2 }, { x: 19, y: 14, r: 5 + r() * 2 }, { x: 15, y: 9, r: 5 }], LEAF.rock, { seed, speck: 0.04, snow, squash: 0.8 }); return outlineCanvas(c, '#2c2a28'); }
// a round wattle hut under a thatch cone
function hutSprite(snow) {
  const W = 86, H = 76, c = mk(W, H), x = c.getContext('2d'), cx = 43;
  for (let yy = 44; yy <= 71; yy++) for (let xx = 12; xx <= 74; xx++) { const u = (xx - cx) / 31, edge = 66 + Math.sqrt(Math.max(0, 1 - u * u)) * 6; if (Math.abs(u) > 1 || yy > edge) continue; let col = u < -0.45 ? '#c9a779' : u < 0.35 ? '#b08a5e' : '#8c6a47'; if ((xx - 12) % 7 === 0) col = '#6e5137'; else if ((yy % 5) === 0) col = tone(col, 0.86); x.fillStyle = col; x.fillRect(xx, yy, 1, 1); }
  for (let yy = 50; yy <= 72; yy++) for (let xx = 30; xx <= 42; xx++) { const u = (xx - 36) / 6.5, top = 50 + (1 - Math.sqrt(Math.max(0, 1 - u * u))) * 6; if (yy < top || yy > 66 + Math.sqrt(Math.max(0, 1 - ((xx - cx) / 31) ** 2)) * 6) continue; x.fillStyle = xx < 32 || yy < top + 1 ? '#5a3f2a' : '#22160f'; x.fillRect(xx, yy, 1, 1); }
  for (let yy = 3; yy <= 52; yy++) { const k = (yy - 3) / 49, half = 2 + Math.pow(k, 0.85) * 41; for (let xx = Math.round(cx - half); xx <= Math.round(cx + half); xx++) { const u = (xx - cx) / half, sag = 52 - (1 - u * u) * 0 - Math.abs(u) * 5; if (yy > 47 + (1 - u * u) * 5) continue; const band = ((yy + Math.round(Math.abs(u) * 3)) / 6) | 0; let col = u < -0.3 ? (band % 2 ? '#e9cc7a' : '#dcbc66') : u < 0.3 ? (band % 2 ? '#d2ae58' : '#c49f4c') : (band % 2 ? '#a9853d' : '#9a7635'); if ((yy + Math.round(Math.abs(u) * 3)) % 6 === 5) col = tone(col, 0.8); if ((xx * 5 + yy * 3) % 13 === 0) col = tone(col, 0.9); if (snow && k < 0.74 - Math.max(0, u) * 0.3 && (xx * 7 + yy * 13) % 23 !== 0) col = u < 0.1 ? '#ffffff' : '#dfe8f2'; x.fillStyle = col; x.fillRect(xx, yy, 1, 1); } }
  x.fillStyle = '#7a5a34'; x.fillRect(cx - 1, 0, 3, 5);
  return outlineCanvas(c, OUT);
}
// a rabbit warren: a low earth mound with a dark mouth
function burrowSprite(snow) {
  const c = mk(40, 24), x = c.getContext('2d');
  lumps(x, [{ x: 14, y: 14, r: 8 }, { x: 24, y: 13, r: 9 }, { x: 19, y: 11, r: 7 }], snow ? ['#ffffff', '#e3ebf5', '#b9a27c', '#7a5d3f'] : ['#9cc65a', '#8aa64c', '#a5845a', '#7a5d3f'], { seed: 5, speck: 0.05, squash: 0.75 });
  for (let yy = 12; yy <= 20; yy++) for (let xx = 13; xx <= 25; xx++) { const u = (xx - 19) / 6.5, v = (yy - 16.5) / 4.5; if (u * u + v * v < 1) { x.fillStyle = v < -0.55 ? '#4a3524' : '#1c120c'; x.fillRect(xx, yy, 1, 1); } }
  return outlineCanvas(c, OUT);
}
const peek = ['.pa...ap.', '.pa...ap.', '.aa...aa.', '.aaaaaaa.', 'aakaaakaa', 'aaaawaaaa', '.aaaaaaa.'];
// a wolf den: boulders around a cave mouth
function denSprite(snow) {
  const c = mk(64, 46), x = c.getContext('2d');
  lumps(x, [{ x: 16, y: 28, r: 12 }, { x: 46, y: 29, r: 13 }, { x: 31, y: 18, r: 15 }, { x: 22, y: 20, r: 10 }, { x: 42, y: 20, r: 10 }], LEAF.rock, { seed: 9, speck: 0.05, snow, squash: 0.85 });
  for (let yy = 20; yy <= 40; yy++) for (let xx = 20; xx <= 42; xx++) { const u = (xx - 31) / 11, v = (yy - 31) / 10; if (u * u + v * v < 1 && yy <= 39) { x.fillStyle = v < -0.6 || u < -0.75 ? '#3b3530' : '#120e0c'; x.fillRect(xx, yy, 1, 1); } }
  return outlineCanvas(c, '#2c2a28');
}
const reeds = ['..g...g..', '.kg..kg..', '.kg.gkg.g', '.g..g.g.g', '.g.gg.ggg', '.g.g..g.g', '.g.g..g.g'];

// ------------------------------------------------------------------ poses: lying, sitting, arms raised (made from the walking maps)
const lieOf = (rows, legRows, tuck) => rows.slice(0, rows.length - legRows).concat(tuck ? [tuck] : []);
const LIE = {
  rabbit: lieOf(rabbitA, 1), kit: lieOf(kitA, 1),
  deer: lieOf(deerA, 5, '...bbbbb.......bbbbb......'), doe: lieOf(doeA, 5, '...bbbbb.......bbbbb......'), fawn: lieOf(fawnA, 3, '..bbbb...bbbb....'),
  wolf: lieOf(wolfA, 4, '...bbbbbb...bbbbbb........'), pup: lieOf(pupA, 2, '..bbbb..bbbb...')
};
const SIT = { man: manA.slice(0, 13).concat(['..lllllll..', '.bb.....bb.']), woman: womanA.slice(0, 15).concat(['.bb.....bb.']) };
// arms up: picking fruit, swinging an axe, holding a load over the head
function armsUp(rows) {
  const g = rows.map(r => r.split(''));
  for (const y of [3, 4, 5]) for (const x of [1, 9]) if (g[y][x] === '.') g[y][x] = 's';
  for (const y of [6, 7]) for (const x of [1, 9]) if (g[y][x] === '.' || g[y][x] === 's') g[y][x] = 't';
  for (const y of [8, 9, 10]) for (const x of [1, 9]) if (g[y][x] === 's') g[y][x] = 't';
  return g.map(r => r.join(''));
}
// the very young: a toddler on its own feet, and a swaddled baby
const toddlerA = ['..hhh..', '.hhhhh.', '.sssss.', '.sksks.', '..sss..', '.ttttt.', 'sttttts', '.ttttt.', '.l...l.', '.b...b.'];
const toddlerB = legs(toddlerA, 2, ['..l.l..', '..b.b..']);
const toddlerSit = toddlerA.slice(0, 8).concat(['bb...bb']);
const babyMap = ['..hh...', '.ssss..', 'cskskcc', 'cssssc.', 'ccccccc', '.ccccc.'];
// things carried and things left behind
const ITEMS = {
  fish: [['.bbb...b', 'bbwbbbbb', '.bbb...b'], { b: '#6f9db8', w: '#1a2530' }],
  log: [['.wwwwwwwwk', 'wkwwwwwwkk', '.wwwwwwwwk'], { w: '#8a6a48', k: '#5a3f2a' }],
  stone: [['.ggh..', 'gghhk.', 'ghhkkk', '.kkk..'], { g: '#b9b5aa', h: '#9a968c', k: '#6d6a62' }],
  sticks: [['k...k..k', '.k.k..k.', 'kkkkkkkk', '.k..k.k.'], { k: '#7a5a3a' }],
  meat: [['..rrr.', '.rrwrr', 'rrrrr.', '.rr...'], { r: '#b8453a', w: '#efe2d0' }],
  grain: [['y.y.y', 'yyyyy', '.ggg.', '.ggg.'], { y: '#e6c453', g: '#8a9a4a' }]
};
const graveMap = ['....ggg....', '...gwwwg...', '...gwkwg...', '...gwwwg...', '.ddgwwwgdd.', 'dddddddddd.', '.dddddddd..'];
const GRAVE = { g: '#6d6a62', w: '#a9a59a', k: '#6d6a62', d: '#7a5d3f' };
const ringMap = ['..ggg.ggg..', '.g.......g.', 'g.........g', '.g.......g.', '..ggg.ggg..'];
// a soft round blob, used for cloud shadows and glows
function softBlob(r, rgb) { const c = mk(r * 2, r * 2), x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(0.55, 'rgba(' + rgb + ',.55)'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c; }
// a puffy pixel cloud for the rain tool
function cloudSprite(dark) { const c = mk(70, 34), x = c.getContext('2d'); lumps(x, [{ x: 18, y: 20, r: 11 }, { x: 34, y: 14, r: 14 }, { x: 50, y: 19, r: 12 }, { x: 28, y: 23, r: 9 }, { x: 44, y: 24, r: 9 }], dark ? ['#c9d2dc', '#a9b4c2', '#8a96a8', '#6c788c'] : ['#ffffff', '#eef3f8', '#d4dde8', '#b6c2d2'], { seed: 3, squash: 0.8 }); return outlineCanvas(c, '#4a5566'); }
// a smaller copy of a big sprite, still crisp: used while a tree grows up
function shrink(src, f) {
  const w = Math.max(2, Math.round(src.width * f)), h = Math.max(2, Math.round(src.height * f)), c = mk(w, h), x = c.getContext('2d');
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), a = d.data; for (let i = 3; i < a.length; i += 4) a[i] = a[i] > 110 ? 255 : 0; x.putImageData(d, 0, 0); return c;
}

function build() {
  const pair = (rows, pal, x2) => { const S = sprite(rows, pal, { x2 }); return { r: S, l: flip(S) }; };
  const two = (a, b, pal, x2, poses) => { const A = sprite(a, pal, { x2 }), B = sprite(b, pal, { x2 }), o = { r: [A, B], l: [flip(A), flip(B)], w: A.width, h: A.height }; if (poses) for (const k in poses) o[k] = pair(poses[k], pal, x2); return o; };
  const A = { look: {}, trees: [], pines: [] };
  const states = ['green', 'fruit', 'dry', 'gold', 'goldFruit', 'red', 'snow', 'bare', 'bareSnow', 'burnt'];
  for (let v = 0; v < 4; v++) { const big = {}, small = {}; for (const s of states) { big[s] = leafTree(11 + v * 17, s, false); small[s] = leafTree(101 + v * 13, s, true); } A.trees.push({ big, small }); }
  for (let v = 0; v < 3; v++) A.pines.push({ big: { green: pineTree(5 + v * 9, false, false), snow: pineTree(5 + v * 9, true, false), burnt: pineTree(5 + v * 9, false, false, true) }, small: { green: pineTree(55 + v * 9, false, true), snow: pineTree(55 + v * 9, true, true), burnt: pineTree(55 + v * 9, false, true, true) } });
  A.bush = [0, 1, 2].map(v => ({ plain: bushSprite(31 + v * 7, false), berry: bushSprite(31 + v * 7, true), snow: bushSprite(31 + v * 7, false, true) }));
  A.rock = [0, 1, 2].map(v => ({ plain: rockSprite(71 + v * 5), snow: rockSprite(71 + v * 5, true) }));
  A.reeds = sprite(reeds, { g: '#7fa04a', k: '#6a4a2e' });
  A.look.rabbit = { grown: [two(rabbitA, rabbitB, RAB, false, { lie: LIE.rabbit }), two(rabbitA, rabbitB, Object.assign({}, RAB, { a: '#9a9186', b: '#6a635b', c: '#b5ada2' }), false, { lie: LIE.rabbit })], young: [two(kitA, kitB, RAB, false, { lie: LIE.kit })] };
  A.look.deer = { grown: [two(deerA, deerB, DEER, true, { lie: LIE.deer }), two(doeA, doeB, DEER, true, { lie: LIE.doe })], young: [two(fawnA, fawnB, DEER, true, { lie: LIE.fawn })] };
  A.look.wolf = { grown: [two(wolfA, wolfB, WOLF, true, { lie: LIE.wolf }), two(wolfA, wolfB, Object.assign({}, WOLF, { a: '#6f6a66', b: '#48433f', c: '#8d8782' }), true, { lie: LIE.wolf })], young: [two(pupA, pupB, Object.assign({}, WOLF, { a: '#7b7d86', c: '#9a9ca5', y: '#15151a' }), true, { lie: LIE.pup })] };
  const people = { grown: [], young: [], old: [] };
  for (let v = 0; v < 12; v++) { const pal = { s: SKIN[v % 4], h: HAIR[(v * 7) % 4], t: CLOTH[(v * 5 + 1) % 6], u: CLOTH[(v + 3) % 6], l: '#5a4a3a', b: '#3a2c22', k: '#1a1412' }, grey = Object.assign({}, pal, { h: HAIR[elderHair] }); const W2 = { sit: SIT.woman, up: armsUp(womanA), upB: armsUp(womanB) }, M2 = { sit: SIT.man, up: armsUp(manA), upB: armsUp(manB) }; people.grown.push(v % 2 ? two(womanA, womanB, pal, true, W2) : two(manA, manB, pal, true, M2)); people.old.push(v % 2 ? two(womanA, womanB, grey, true, W2) : two(manA, manB, grey, true, M2)); people.young.push(two(childA, childB, pal, true, { sit: childA.slice(0, 9).concat(['.bb...bb.']), up: childA, upB: childB })); people.tot = people.tot || []; people.tot.push(two(toddlerA, toddlerB, pal, true, { sit: toddlerSit })); people.baby = people.baby || []; people.baby.push(sprite(babyMap, Object.assign({ c: '#efe2c4' }, pal), { x2: true })); }
  // people lying down: the standing figure laid on its side
  const rot = c => { const d = mk(c.height, c.width), g = d.getContext('2d'); g.translate(c.height, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); return trimRows(d); };   /* a body laid down lies on the ground, not on the empty margin it stood in */
  for (const k of ['grown', 'old', 'young', 'tot']) for (const o of people[k]) o.lie = { r: rot(o.r[0]), l: flip(rot(o.r[0])) };
  A.look.human = people;
  A.hut = hutSprite(false); A.hutSnow = hutSprite(true); A.house = A.hut; A.houseSnow = A.hutSnow;   // a drawn house replaces these when its sheet is there
  A.tent = tentSprite(false); A.tentSnow = tentSprite(true); A.granary = granarySprite(false); A.granarySnow = granarySprite(true); A.storehouse = storehouseSprite(false); A.storehouseSnow = storehouseSprite(true); A.kiln = kilnSprite(false); A.kilnSnow = kilnSprite(true); A.smithy = smithySprite(false); A.smithySnow = smithySprite(true); A.workshop = workshopSprite(false); A.workshopSnow = workshopSprite(true); A.pen = penSprite(false); A.penSnow = penSprite(true); A.grainCrop = [0, 1, 2, 3].map(grainSprite); for (const [k, f] of [['dairy', dairySprite], ['hall', hallSprite], ['shrine', shrineSprite], ['church', churchSprite]]) { A[k] = f(false); A[k + 'Snow'] = f(true); } for (const [k, f] of [['masonsyard', masonsyardSprite], ['healerhouse', healerhouseSprite], ['limekiln', limekilnSprite], ['tallyhouse', tallyhouseSprite]]) { A[k] = f(false); A[k + 'Snow'] = f(true); } A.well = wellSprite(false); A.wellSnow = wellSprite(true); A.garden = [1, 2, 3].map(gardenSprite); A.bench = benchSprite(false); A.benchCarved = benchSprite(true); A.woodpile = [1, 2, 3].map(woodpileSprite); A.logSeat = logSeatSprite(); A.bridgeX = bridgeSprite(true); A.bridgeY = bridgeSprite(false); A.bridgePilesX = bridgeSprite(true, true); A.bridgePilesY = bridgeSprite(false, true); A.fenceX = fenceSprite(true); A.fenceY = fenceSprite(false); A.gateX = fenceSprite(true, true); A.gateY = fenceSprite(false, true); A.onStilts = onStilts; A.burrow = burrowSprite(false); A.burrowSnow = burrowSprite(true); A.den = denSprite(false); A.denSnow = denSprite(true); A.peek = sprite(peek, RAB);
  A.fire = fire.map(f => sprite(f, FIRE, { x2: true, flat: true, noOutline: true })); A.flame = flame.map(f => sprite(f, FIRE, { x2: true, flat: true, noOutline: true })); A.basket = sprite(basket, BASK, { x2: true }); A.bones = sprite(bones, BONE, { x2: true });
  A.bubble = {}; for (const k in ICON) A.bubble[k] = bubble(ICON[k]);
  A.item = {}; for (const k in ITEMS) A.item[k] = sprite(ITEMS[k][0], ITEMS[k][1]); A.item.basket = sprite(basket, BASK);
  A.grave = sprite(graveMap, GRAVE, { x2: true }); A.ring = sprite(ringMap, { g: '#77736a' }, { x2: true });
  A.shadowBlob = softBlob(64, '20,32,28'); A.glow = softBlob(64, '255,190,90'); A.cloud = cloudSprite(false); A.cloudDark = cloudSprite(true);
  A.shrink = shrink;
  A.tool = {}; for (const k in TOOL) A.tool[k] = sprite(TOOL[k][0], TOOL[k][1], { flat: true, noOutline: true });
  A.generic = d => {
    const L = Math.round(clamp(8 + d.mass * 3.4, 10, 64)), Hh = Math.round(L * 0.55), meat = d.eats && d.eats.meat, pal = meat ? ['#9a7460', '#7a5846', '#5e4234', '#3e2a22'] : ['#c2b07a', '#a3925f', '#84754a', '#5f5435'];
    const draw = (s, f) => { const w = Math.max(7, Math.round(L * s)), h = Math.max(6, Math.round(Hh * s)), c = mk(w + 10, h + 8), x = c.getContext('2d'); x.fillStyle = pal[3]; x.fillRect(4 + f, h, 2, 6); x.fillRect(w - 2 - f, h, 2, 6); lumps(x, [{ x: 4 + w * 0.4, y: 2 + h * 0.55, r: h * 0.5 }, { x: 4 + w * 0.7, y: 2 + h * 0.5, r: h * 0.46 }, { x: 5 + w * 0.95, y: 1 + h * 0.3, r: h * 0.3 }], pal, { seed: 3 }); return outlineCanvas(c, OUT); };
    const pair = s => { const a = draw(s, 0), b = draw(s, 1); return { r: [a, b], l: [flip(a), flip(b)], w: a.width, h: a.height }; };
    return { grown: [pair(1)], young: [pair(0.55)] };
  };
  // art made outside the game replaces the built-in look wherever a sprite sheet exists (src/sprites.js)
  if (root.EdenSprites && root.EdenSprites.ready) root.EdenSprites.apply(A, { mk, flip, shrink, trimRows });
  for (const k of ['hut', 'house']) if (!A[k + 'Lake']) { A[k + 'Lake'] = onStilts(A[k]); A[k + 'LakeSnow'] = onStilts(A[k + 'Snow']); }
  return A;
}
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
root.EdenArt = { build, sprite };
})(typeof window !== 'undefined' ? window : globalThis);
