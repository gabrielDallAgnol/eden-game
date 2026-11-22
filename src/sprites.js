// Eden sprites: art made outside the game (see art/), loaded from assets/sprites and swapped in for the
// hand-placed pixel maps. Anything not covered here keeps its built-in look, so the game runs with or without them.
// To add art: export it with art/scripts/export_game.py, then map it to a look or a prop in apply() below.
(function (root) {
const S = { ready: false, img: {}, meta: {} };

S.load = async function (base) {
  const meta = await (await fetch(base + 'manifest.json')).json();
  await Promise.all(Object.keys(meta).map(k => new Promise((ok, fail) => {
    const im = new Image(); im.onload = () => { S.img[k] = im; ok(); }; im.onerror = () => fail(new Error('missing ' + meta[k].file)); im.src = base + meta[k].file;
  })));
  S.meta = meta; S.ready = true;
};

S.apply = function (A, h) {
  const mk = h.mk, flip = h.flip, shrink = h.shrink;
  // one strip -> a list of frame canvases
  const frames = key => { const m = S.meta[key], out = []; for (let f = 0; f < m.frames; f++) { const c = mk(m.w, m.h); c.getContext('2d').drawImage(S.img[key], f * m.w, 0, m.w, m.h, 0, 0, m.w, m.h); out.push(c); } return out; };
  const one = key => frames(key)[0];
  // Sizes. The sheets were drawn to fill their canvas, not to a common scale, so each is brought to Eden's proportions here
  // (a grown person stands about 36 px): deer about 34 px long, a house about 100 px tall. Art drawn at the right size needs 1.
  const SCALE = { deer: 0.74, fawn: 0.74, cottage: 1.4 };
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

  // ---------------------------------------------------------------- the home: a timber cottage, with a snowed-over roof for winter
  const cottage = sized(one('cottage'), SCALE.cottage);
  A.hut = cottage;
  A.hutSnow = recolour(cottage, (r, g, b, x, y) => b > r + 8 && g > r && !dark(r, g, b) ? (y % 4 === 3 ? [205, 218, 234] : hash(x >> 1, y) < 0.85 ? [246, 249, 252] : [227, 235, 245]) : null);
};

root.EdenSprites = S;
})(typeof window !== 'undefined' ? window : globalThis);
