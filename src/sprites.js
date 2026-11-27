// Eden sprites: art made outside the game (see art/), loaded from assets/sprites and swapped in for the
// hand-placed pixel maps. Anything not covered here keeps its built-in look, so the game runs with or without them.
// To add art: export it with art/scripts/export_game.py, then map it to a look or a prop in apply() below.
(function (root) {
const S = { ready: false, img: {}, meta: {} };

S.load = async function (base) {
  const emb = root.EDEN_EMBED;                                        // a single-file build carries the sprites inside it
  const meta = emb ? emb.meta : await (await fetch(base + 'manifest.json')).json();
  await Promise.all(Object.keys(meta).map(k => new Promise((ok, fail) => {
    const im = new Image(); im.onload = () => { S.img[k] = im; ok(); }; im.onerror = () => fail(new Error('missing ' + meta[k].file)); im.src = emb ? emb.img[k] : base + meta[k].file;
  })));
  S.meta = meta; S.ready = true;
};

S.apply = function (A, h) {
  const mk = h.mk, flip = h.flip, shrink = h.shrink, trimRows = h.trimRows || (c => c);
  // one strip -> a list of frame canvases
  const frames = key => { const m = S.meta[key], out = []; for (let f = 0; f < m.frames; f++) { const c = mk(m.w, m.h); c.getContext('2d').drawImage(S.img[key], f * m.w, 0, m.w, m.h, 0, 0, m.w, m.h); out.push(c); } return out; };
  const one = key => frames(key)[0];
  // Sizes. The sheets were drawn to fill their canvas, not to a common scale, so each is brought to Eden's proportions here
  // (a grown person stands about 36 px): deer about 34 px long, a house about 100 px tall. Art drawn at the right size needs 1.
  const SCALE = { deer: 0.74, fawn: 0.74, cottage: 1.4, cow: 0.8, calf: 0.8 };
  const sized = (c, f) => { if (f === 1) return c; if (f < 1) return shrink(c, f); const o = mk(Math.round(c.width * f), Math.round(c.height * f)), x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, o.width, o.height); return o; };
  // a recoloured copy: fn(r, g, b, x, y, alphaAt) returns [r, g, b] or null to leave the pixel alone
  const recolour = (src, fn) => {
    const c = mk(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data, w = c.width, al = (xx, yy) => xx < 0 || yy < 0 || xx >= w || yy >= c.height ? 0 : p[(yy * w + xx) * 4 + 3];
    const out = new Uint8ClampedArray(p);
    for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < w; xx++) { const i = (yy * w + xx) * 4; if (!p[i + 3]) continue; const v = fn(p[i], p[i + 1], p[i + 2], xx, yy, al); if (v) { out[i] = v[0]; out[i + 1] = v[1]; out[i + 2] = v[2]; } }
    d.data.set(out); x.putImageData(d, 0, 0); return c;
  };
  const hash = (a, b) => { let n = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const dark = (r, g, b) => r + g + b < 150;                       // outline pixels are left alone

  // ---------------------------------------------------------------- deer and fawn: 8-frame walk, grazing, lying
  const animal = name => {
    const get = k => frames(name + '_' + k).map(c => sized(c, SCALE[name] || 1)), walk = get('walk'), graze = get('graze'), lie = get('lie'), last = lie[lie.length - 1];
    const head = graze.slice(-2);                                   // the two head-down frames
    return { r: walk, l: walk.map(flip), w: walk[0].width, h: walk[0].height, lie: { r: last, l: flip(last) }, graze: { r: head, l: head.map(flip) } };
  };
  A.look.deer = { grown: [animal('deer')], young: [animal('fawn')] };
  if (S.meta.cow_walk) A.look.cow = { grown: [animal('cow')], young: [animal('calf')] };   /* cattle: the drawing bought for them, a calf drawn smaller */

  // ---------------------------------------------------------------- the leaf tree, one drawing in every state the valley can put it in
  const green = one('tree_green'), autumn = one('tree_gold'), winter = one('tree_bare_snow'), blossom = one('tree_blossom');
  const leafy = (r, g, b) => g > r && g > b;
  const dots = (src, col, hi, every) => recolour(src, (r, g, b, x, y) => {
    if (dark(r, g, b) || y > src.height * 0.62) return null;
    const cx = (x / 3) | 0, cy = (y / 3) | 0; if (hash(cx, cy) > every) return null;
    return (x % 3 === 0 && y % 3 === 0) ? hi : (x % 3 < 2 && y % 3 < 2) ? col : null;
  });
  const snowCap = src => recolour(src, (r, g, b, x, y, al) => {
    if (y > src.height * 0.6) return null;
    const open = !al(x, y - 2) || !al(x, y - 5), lit = hash(x >> 1, y >> 1) < 0.28 && y < src.height * 0.4;
    return dark(r, g, b) ? null : open ? [246, 249, 252] : lit ? [227, 235, 245] : null;
  });
  const states = {
    green,
    fruit: dots(green, [200, 58, 44], [238, 120, 90], 0.07),
    dry: recolour(green, (r, g, b) => leafy(r, g, b) ? [Math.min(255, r * 1.35 + 42), g * 1.02 + 6, b * 0.7] : null),
    gold: recolour(autumn, (r, g, b) => r > g && g > b && !dark(r, g, b) ? [Math.min(255, r * 1.03 + 6), Math.min(255, g * 1.32 + 26), b * 1.1] : null),
    red: autumn,
    snow: snowCap(green),
    bareSnow: winter,
    bare: recolour(winter, (r, g, b, x, y) => Math.min(r, g, b) > 150 ? (hash(x, y) < 0.5 ? [112, 80, 58] : [94, 66, 48]) : null),
    blossom
  };
  states.goldFruit = dots(states.gold, [200, 58, 44], [238, 120, 90], 0.06);
  states.burnt = recolour(states.bare, (r, g, b) => { const l = (r + g + b) / 3 * 0.42; return [l + 8, l + 4, l + 4]; });
  A.trees = [0, 1, 2, 3].map(v => {
    const big = {}, small = {};
    for (const k in states) { let c = states[k]; if (v % 2) c = flip(c); if (v >= 2) c = shrink(c, 0.86); big[k] = c; small[k] = shrink(c, 0.55); }
    return { big, small };
  });

  // ---------------------------------------------------------------- people: three drawings, mixed into as many people as the valley holds
  // The sheets are drawn in key colours: red top, blue legs, brown hair, tan skin. Each person is made by swapping those four
  // for their own (skin and hair inherited from their parents, clothes their own), keeping the drawing's light and shade.
  // 2 bodies x 5 skins x 6 hairs x 10 tops x 6 legs = 3,600 different grown people from one man and one woman.
  if (S.meta.man_walk && S.meta.woman_walk && S.meta.child_walk) {
    const SKIN = [[238, 200, 164], [218, 172, 132], [190, 140, 102], [154, 108, 78], [116, 80, 60]];
    const HAIR = [[58, 42, 36], [96, 64, 42], [146, 96, 50], [200, 166, 90], [156, 66, 42], [34, 32, 38]], GREY = [184, 184, 178];
    const TOP = [[172, 62, 52], [198, 152, 72], [72, 104, 152], [98, 130, 76], [204, 192, 164], [124, 88, 62], [122, 72, 112], [72, 132, 126], [178, 98, 58], [132, 132, 130]];
    const LEGS = [[88, 74, 62], [62, 78, 112], [112, 102, 86], [72, 92, 72], [142, 122, 92], [54, 54, 62]];
    const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, mx ? d / mx : 0, mx / 255]; };
    // which part of the drawing a pixel belongs to, from its key colour (and, for hair against boots, how high up it sits)
    const part = (r, g, b, y, top, headRows) => {
      const [h, sat, v] = hsv(r, g, b); if (v < 0.16) return 0;                       // outline, belt, pupils
      if ((h < 14 || h > 338) && sat > 0.5) return 'top';
      if (h > 185 && h < 255 && sat > 0.35) return 'legs';
      if (h >= 8 && h < 45 && sat > 0.18 && sat < 0.7 && v > 0.52) return 'skin';
      if (h < 50 && v <= 0.52 && sat > 0.15 && y - top < headRows) return 'hair';
      return 0;
    };
    const REF = { top: 0.72, legs: 0.74, skin: 0.8, hair: 0.3 };                          // the brightness each key colour was drawn at
    const dress = (src, cols, headRows, beard) => {
      const c = mk(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height), p = d.data; let top = 0;
      search: for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx++) if (p[(yy * c.width + xx) * 4 + 3]) { top = yy; break search; }
      for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx++) {
        const i = (yy * c.width + xx) * 4; if (!p[i + 3]) continue; let k = part(p[i], p[i + 1], p[i + 2], yy, top, headRows); if (!k) continue;
        /* a beard: the skin of the lower face takes the colour of the hair (short: the jaw; full: from under the nose) */
        if (beard && k === 'skin' && yy - top < headRows && yy - top >= headRows * (beard > 1 ? 0.7 : 0.8)) { const t = cols.hair, f0 = Math.max(0.75, Math.min(1.2, Math.max(p[i], p[i + 1], p[i + 2]) / 255 / REF.skin)); p[i] = Math.min(255, t[0] * f0); p[i + 1] = Math.min(255, t[1] * f0); p[i + 2] = Math.min(255, t[2] * f0); continue; }
        const f = Math.max(0.5, Math.min(1.35, Math.max(p[i], p[i + 1], p[i + 2]) / 255 / REF[k])), t = cols[k];
        p[i] = Math.min(255, t[0] * f); p[i + 1] = Math.min(255, t[1] * f * (f < 1 ? 0.97 : 1)); p[i + 2] = Math.min(255, t[2] * f * (f < 1 ? 1.06 : 0.98));   // shadows lean cool, lights warm
      }
      x.putImageData(d, 0, 0); return c;
    };
    const rot = c => { const o = mk(c.height, c.width), g = o.getContext('2d'); g.translate(c.height, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); return trimRows(o); };   /* a body laid down lies on the ground, not on the empty margin it stood in */
    const BODY = {}; for (const n of ['man', 'woman', 'child']) BODY[n] = { walk: frames(n + '_walk'), up: frames(n + '_up'), sit: frames(n + '_sit'), head: Math.round(S.meta[n + '_walk'].h * (n === 'woman' ? 0.5 : 0.36)) };
    const made = new Map(), built = A.look.human;
    built.make = (a, stage) => {
      const L = a.looks || { skin: a.id % 5, hair: a.id % 6, top: a.id % 10, legs: a.id % 6 }, body = stage === 'young' || stage === 'tot' ? 'child' : a.fem ? 'woman' : 'man';
      const grownUp = stage === 'grown' || stage === 'old', tall = grownUp && L.tall !== undefined ? L.tall : 1, build = grownUp && L.build !== undefined ? L.build : 1, beard = grownUp && !a.fem && L.beard ? L.beard : 0;
      const key = body + stage + L.skin + '.' + L.hair + '.' + L.top + '.' + L.legs + '.' + tall + build + beard; let v = made.get(key); if (v) return v;
      const B = BODY[body], cols = { skin: SKIN[L.skin % SKIN.length], hair: stage === 'old' ? GREY : HAIR[L.hair % HAIR.length], top: TOP[L.top % TOP.length], legs: LEGS[L.legs % LEGS.length] };
      /* height and build: the figure a little shorter or taller, slighter or broader */
      const size = stage === 'tot' ? 0.78 : [0.93, 1, 1.07][tall], wide = [0.9, 1, 1.12][build];
      const girth = c => { if (wide === 1) return c; const o = mk(Math.max(2, Math.round(c.width * wide)), c.height), g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, o.width, o.height); return o; };
      const mkf = c => girth(sized(dress(c, cols, B.head, beard), size)), both = c => ({ r: c, l: flip(c) });
      const walk = B.walk.map(mkf), up = mkf(B.up[B.up.length - 1]), upB = mkf(B.up[B.up.length - 2]), sit = mkf(B.sit[B.sit.length - 1]);
      v = { r: walk, l: walk.map(flip), w: walk[0].width, h: walk[0].height, up: both(up), upB: both(upB), sit: both(sit), lie: both(rot(walk[0])) };
      made.set(key, v); return v;
    };
  }

  // ---------------------------------------------------------------- the home: a timber cottage, with a snowed-over roof for winter
  const cottage = sized(one('cottage'), SCALE.cottage);
  A.house = cottage;
  A.houseSnow = recolour(cottage, (r, g, b, x, y) => b > r + 8 && g > r && !dark(r, g, b) ? (y % 4 === 3 ? [205, 218, 234] : hash(x >> 1, y) < 0.85 ? [246, 249, 252] : [227, 235, 245]) : null);

  // ---------------------------------------------------------------- the rest of the village, where a drawing exists
  // snow lies on whatever faces the sky: the top few pixels of every column
  const snowOn = src => recolour(src, (r, g, b, x, y, al) => { if (dark(r, g, b)) return null; let open = false; for (let k = 1; k <= 4; k++) if (!al(x, y - k)) { open = true; break; } return open && y < src.height * 0.7 ? (hash(x >> 1, y) < 0.85 ? [246, 249, 252] : [221, 230, 241]) : null; });
  if (S.meta.tent) { A.tent = one('tent'); A.tentSnow = snowOn(A.tent); }
  if (S.meta.hut) { A.hut = one('hut'); A.hutSnow = snowOn(A.hut); A.hutLake = A.hutLakeSnow = null; }
  if (S.meta.well) { A.well = one('well'); A.wellSnow = snowOn(A.well); }
  if (S.meta.lakehouse) { A.houseLake = one('lakehouse'); A.houseLakeSnow = snowOn(A.houseLake); }
  // ---------------------------------------------------------------- the things of village life (generated with RD Lite, 2026-11-22):
  // each brought to Eden's scale by the height it should stand at, in pixels (a grown person is about 36)
  const PROP_H = { stall_red: 50, stall_green: 46, table_bench: 26, barrels: 24, crates: 26, haystack: 34, beehives: 24, washing_line: 38, lantern: 34, signpost: 28,
    planter: 18, scarecrow: 34, wheelbarrow: 20, chopping_block: 18, trough: 18, coop: 34, cooking_spit: 26, fish_rack: 30, music_corner: 22, rocking_chair: 24,
    laundry_tub: 18, potted_plants: 18, pumpkins: 18, wheat_sheaves: 24, stump_mushrooms: 18, bench_flowers: 22, firewood_stack: 30, woodworking_bench: 24,
    loom: 28, herb_drying: 26, toy_horse: 14 };
  A.prop = {};
  for (const k in S.meta) if (k.startsWith('prop_')) { const n = k.slice(5), c = one(k); A.prop[n] = sized(c, (PROP_H[n] || 24) / c.height); }
  if (S.meta.cart) { A.cart = sized(one('cart'), 0.66); A.cartL = flip(A.cart); }
  yarProps(A, one, sized, mk, snowOn, hash);
};

// ---------------------------------------------------------------- rocks, bushes and tall grass from Yar's tileset (CC-BY 3.0, art/third_party)
// Only the drawing is borrowed: each pixel keeps how light or dark it is and takes the matching shade from one of Eden's
// own ramps (the LEAF colours in art.js), then gets Eden's 1 px outline. One drawing so gives every season.
const RAMP = {
  spring: ['#b8d86e', '#8cbf52', '#62983f', '#3c6b33', '#1f3a26'], plain: ['#a4c964', '#78a84a', '#55863c', '#356030', '#1f3a26'],
  dry: ['#c2c063', '#9a9a48', '#74783a', '#4f552c', '#2c3020'], gold: ['#f2cf5e', '#dba23a', '#b3742b', '#7c4b22', '#4a2a1c'],
  red: ['#ee9a50', '#cf6a34', '#a2452a', '#6f2c22', '#4a2a1c'], frost: ['#c9d6c0', '#a3b39a', '#7d8f78', '#56665a', '#2c3530'],
  rock: ['#c9c6b8', '#a39f90', '#7d796d', '#56534c', '#2c2a28'], wet: ['#b4b8b0', '#8e938c', '#6c716c', '#4a4f4c', '#26292a']
};
const hexRGB = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
function gradientMap(src, ramp, mk) {
  const w = src.width, h = src.height, sx = src.getContext('2d').getImageData(0, 0, w, h).data, c = mk(w + 2, h + 2), x = c.getContext('2d'), d = x.createImageData(w + 2, h + 2), p = d.data;
  const lum = new Float32Array(w * h), on = new Uint8Array((w + 2) * (h + 2)), seen = [];
  for (let i = 0; i < w * h; i++) if (sx[i * 4 + 3] > 0) { lum[i] = sx[i * 4] * 0.299 + sx[i * 4 + 1] * 0.587 + sx[i * 4 + 2] * 0.114; seen.push(lum[i]); }
  if (!seen.length) return c;
  seen.sort((a, b) => a - b);
  /* the sprite's own light range, ignoring the few lightest and darkest pixels */
  const lo = seen[Math.floor(seen.length * 0.03)], hi = seen[Math.floor(seen.length * 0.97)], stops = ramp.slice(0, 4).map(hexRGB), out = hexRGB(ramp[4]);
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const i = y * w + xx; if (!sx[i * 4 + 3]) continue;
    let t = Math.min(1, Math.max(0, (hi - lum[i]) / Math.max(1, hi - lo))); t = Math.round(t * 5) / 5;
    const k = t * 3, j = Math.min(2, k | 0), f = k - j, o = ((y + 1) * (w + 2) + xx + 1) * 4;
    for (let ch = 0; ch < 3; ch++) p[o + ch] = stops[j][ch] * (1 - f) + stops[j + 1][ch] * f;
    p[o + 3] = 255; on[(y + 1) * (w + 2) + xx + 1] = 1;
  }
  /* Eden's outline: one dark pixel just outside the shape */
  for (let y = 0; y < h + 2; y++) for (let xx = 0; xx < w + 2; xx++) {
    const i = y * (w + 2) + xx; if (on[i]) continue;
    if ((xx > 0 && on[i - 1]) || (xx < w + 1 && on[i + 1]) || (y > 0 && on[i - w - 2]) || (y < h + 1 && on[i + w + 2])) { p[i * 4] = out[0]; p[i * 4 + 1] = out[1]; p[i * 4 + 2] = out[2]; p[i * 4 + 3] = 255; }
  }
  x.putImageData(d, 0, 0); return c;
}
function yarProps(A, one, sized, mk, snowOn, hash) {
  if (!S.meta.yar_bush_a) return;
  const raw = (k, f) => sized(one(k), f), g = (src, r) => gradientMap(src, RAMP[r], mk);
  /* berries: a few red pixels on the upper leaves */
  const berries = src => { const c = mk(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let y = 2; y < c.height * 0.75; y++) for (let xx = 1; xx < c.width - 1; xx++) { const i = (y * c.width + xx) * 4; if (p[i + 3] && p[i + 1] > 90 && hash(xx * 7, y * 13) < 0.05) { p[i] = 200; p[i + 1] = 58; p[i + 2] = 44; } }
    x.putImageData(d, 0, 0); return c; };
  /* the leafy things: every state the valley can put them in */
  const leafy = src => { const o = { spring: g(src, 'spring'), plain: g(src, 'plain'), dry: g(src, 'dry'), gold: g(src, 'gold'), red: g(src, 'red'), frost: g(src, 'frost') }; o.berry = berries(o.plain); o.goldBerry = berries(o.gold); o.redBerry = berries(o.red); o.snow = snowOn(o.frost); return o; };
  /* the leafiest of the three is what people sow: wild bushes keep the other two drawings, so a field is told apart at a glance */
  A.bush = [leafy(raw('yar_bush_b', 1)), leafy(raw('yar_bush_c', 1))];
  /* a crop as it grows: a sprout in spring green, a plant, a full plant, and ripe, gold and hung with fruit */
  { const st = (f, r, fruit) => { const c = g(raw('yar_bush_a', f), r); return fruit ? berries(c) : c; };
    A.crop = [st(0.2, 'spring'), st(0.28, 'spring'), st(0.36, 'plain'), st(0.42, 'gold', true)]; A.cropDry = st(0.36, 'dry'); }
  A.tuft = [leafy(raw('yar_grass_a', 0.8)), leafy(raw('yar_grass_b', 0.8))];
  const stone = src => { const plain = g(src, 'rock'); return { plain, wet: g(src, 'wet'), snow: snowOn(plain) }; };
  A.rock = [stone(raw('yar_rock_a', 1)), stone(raw('yar_rock_b', 1)), stone(raw('yar_rock_c', 0.66))];
}

root.EdenSprites = S;
})(typeof window !== 'undefined' ? window : globalThis);
