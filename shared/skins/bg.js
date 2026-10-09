;(function () {
  'use strict';
  if (window.GardenBg) return;
  var root = document.documentElement, layer = null, credit = null, timer = null, cur = null, objUrl = '';
  var DB = 'garden-bg', STORE = 'img', KEY = 'local';
  var PATS = ['stars', 'flower', 'scales', 'hex', 'circuit', 'topo', 'chevron', 'diamonds', 'plus', 'dots', 'grid', 'lines'];

  function reduce() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function onVis() { root.classList.toggle('gbg-paused', document.hidden); syncTimer(); }
  document.addEventListener('visibilitychange', onVis);

  function idb(mode, fn) {
    return new Promise(function (ok, no) {
      var r;
      try { r = indexedDB.open(DB, 1); } catch (e) { no(e); return; }
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onerror = function () { no(r.error); };
      r.onsuccess = function () {
        var tx = r.result.transaction(STORE, mode), st = tx.objectStore(STORE), q = fn(st);
        tx.oncomplete = function () { ok(q && q.result); r.result.close(); };
        tx.onerror = function () { no(tx.error); r.result.close(); };
      };
    });
  }
  function saveLocal(file) {
    return new Promise(function (ok, no) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var W = Math.min(2560, Math.max(screen.width, screen.height) * Math.min(2, window.devicePixelRatio || 1));
        var s = Math.min(1, W / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        c.toBlob(function (b) {
          if (!b) { no(new Error('encode')); return; }
          idb('readwrite', function (st) { return st.put(b, KEY); }).then(function () { ok(b); }, no);
        }, 'image/webp', .86);
      };
      img.onerror = function () { URL.revokeObjectURL(u); no(new Error('decode')); };
      img.src = u;
    });
  }
  function loadLocal() { return idb('readonly', function (st) { return st.get(KEY); }); }

  function clear() {
    if (timer) { clearInterval(timer); timer = null; }
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
    if (credit && credit.parentNode) credit.parentNode.removeChild(credit);
    layer = credit = null;
    if (objUrl) { URL.revokeObjectURL(objUrl); objUrl = ''; }
    root.removeAttribute('data-bg-p');
    root.removeAttribute('data-bg-m');
    ['--gbg-po', '--gbg-ps', '--gbg-pz'].forEach(function (k) { root.style.removeProperty(k); });
  }

  function tok(name, fb) { var v = getComputedStyle(root).getPropertyValue(name).trim(); return v || fb; }
  function pixels() {
    var c = document.createElement('canvas');
    var W = 288, H = Math.max(120, Math.min(640, Math.round(W * innerHeight / Math.max(1, innerWidth))));
    c.className = 'gbg-layer'; c.width = W; c.height = H; c.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(c, document.body.firstChild);
    layer = c;
    var g = c.getContext('2d'), t = 0;
    var bg = tok('--bg-body', '#111827'), ink = tok('--text-primary', '#ffffff'), acc = tok('--st-accent', '#a78bfa'), ok2 = tok('--st-ok', '#10b981');
    var probe = document.createElement('canvas').getContext('2d');
    function rgb(s) { probe.fillStyle = '#000'; probe.fillStyle = s; s = probe.fillStyle; if (s[0] === '#') return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)]; var m = s.match(/[\d.]+/g) || [0, 0, 0]; return [+m[0], +m[1], +m[2]]; }
    function mix(a, b, k) { var x = rgb(a), y = rgb(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * k); }).join(',') + ')'; }
    var light = (function () { var x = rgb(bg); return (x[0] * 299 + x[1] * 587 + x[2] * 114) / 1000 > 140; })();
    var sky = [];
    for (var s = 0; s < 8; s++) sky.push(mix(bg, s < 5 ? acc : ok2, (s < 5 ? s : 8 - s) * (light ? .035 : .05)));
    var far = mix(bg, ink, light ? .1 : .07), near = mix(bg, ink, light ? .16 : .03), tree = mix(bg, ink, light ? .22 : .015);
    var star = mix(bg, ink, light ? .25 : .75), dim = mix(bg, ink, light ? .14 : .35), moon = mix(bg, light ? ok2 : acc, light ? .45 : .75);
    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    var stars = [];
    for (var i = 0; i < 90; i++) stars.push([Math.floor(Math.random() * W), Math.floor(Math.random() * H * .44), Math.random() * 6, Math.random() < .15]);
    function ridge(x, base, a1, f1, a2, f2, ph) { return Math.round(base + a1 * Math.sin(x / f1 + ph) + a2 * Math.sin(x / f2 + ph * 2)); }
    var bandH = (H * .66) / sky.length;
    var st = document.createElement('canvas'); st.width = W; st.height = H;
    var sg = st.getContext('2d');
    function paintStatic() {
      var g = sg;
      for (var y = 0; y < H; y++) {
        var f = y / bandH, k = Math.floor(f), frac = f - k;
        for (var x = 0; x < W; x += 1) {
          var th = BAYER[(y & 3) * 4 + (x & 3)] / 16;
          var idx = Math.min(sky.length - 1, k + (frac > th ? 1 : 0));
          if (x === 0 || idx !== paintStatic.last) { g.fillStyle = sky[idx]; paintStatic.last = idx; }
          g.fillRect(x, y, 1, 1);
        }
      }
      var mx = Math.round(W * (document.documentElement.dir === 'rtl' ? .1 : .9)), my = Math.round(H * .1);
      g.fillStyle = moon; g.fillRect(mx - 3, my - 5, 7, 11); g.fillRect(mx - 5, my - 3, 11, 7); g.fillRect(mx - 4, my - 4, 9, 9);
      g.fillStyle = sky[0]; g.fillRect(mx + 1, my - 5, 5, 7); g.fillRect(mx + 3, my - 3, 3, 7);
      for (var x2 = 0; x2 < W; x2++) {
        var h1 = ridge(x2, H * .62, 9, 21, 5, 7.3, 0);
        g.fillStyle = far; g.fillRect(x2, h1, 1, H - h1);
        var h2 = ridge(x2, H * .74, 6, 31, 3, 11, 1.7);
        g.fillStyle = near; g.fillRect(x2, h2, 1, H - h2);
      }
      g.fillStyle = tree;
      for (var tx = 6; tx < W; tx += 13) {
        var by = ridge(tx, H * .86, 3, 17, 2, 6, .6), th2 = 6 + ((tx * 7) % 5);
        for (var r = 0; r < th2; r++) { var w = Math.max(1, Math.round((r / th2) * 4)); g.fillRect(tx - w, by - th2 + r, w * 2 + 1, 1); }
        g.fillRect(tx, by, 1, 2);
      }
      g.fillRect(0, Math.round(H * .88), W, H);
    }
    paintStatic();
    function draw() {
      g.drawImage(st, 0, 0);
      stars.forEach(function (s) {
        var a = .5 + .5 * Math.sin(t * .45 + s[2]);
        if (a > .32) { g.fillStyle = a > .82 ? star : dim; g.fillRect(s[0], s[1], 1, 1); if (s[3] && a > .9) { g.fillRect(s[0] - 1, s[1], 3, 1); g.fillRect(s[0], s[1] - 1, 1, 3); } }
      });
      t++;
    }
    draw();
    pixels.draw = draw;
  }
  function syncTimer() {
    var want = cur && cur.type === 'pixels' && layer && !document.hidden && !reduce();
    if (want && !timer) timer = setInterval(pixels.draw, 125);
    if (!want && timer) { clearInterval(timer); timer = null; }
  }
  function photo(b) {
    var d = document.createElement('div');
    d.className = 'gbg-layer gbg-photo';
    d.setAttribute('aria-hidden', 'true');
    d.style.opacity = '0';
    var dimV = Math.max(0, Math.min(80, +b.dim || 45));
    root.style.setProperty('--gbg-dim', dimV + '%');
    if (+b.blur > 0) { d.classList.add('is-blur'); root.style.setProperty('--gbg-blur', Math.min(20, +b.blur) + 'px'); }
    document.body.insertBefore(d, document.body.firstChild);
    layer = d;
    function show(u) {
      var im = new Image();
      im.onload = function () { if (layer !== d) return; d.style.backgroundImage = 'url("' + u + '")'; d.style.opacity = '1'; };
      im.src = u;
    }
    if (b.src === 'local') {
      loadLocal().then(function (blob) { if (!blob || layer !== d) return; objUrl = URL.createObjectURL(blob); show(objUrl); }, function () {});
    } else if (/^https:\/\/images\.unsplash\.com\//.test(b.url || '')) {
      var w = Math.round(Math.min(2400, Math.max(screen.width, screen.height) * Math.min(2, window.devicePixelRatio || 1)));
      show(b.url.replace(/([?&])w=\d+/, '$1w=' + w).replace(/([?&])q=\d+/, '$1q=72'));
      if (b.by) {
        credit = document.createElement('a');
        credit.className = 'gbg-credit';
        credit.href = (/^https:\/\/unsplash\.com\//.test(b.byLink || '') ? b.byLink : 'https://unsplash.com') + '?utm_source=garden&utm_medium=referral';
        credit.target = '_blank'; credit.rel = 'noopener noreferrer nofollow';
        credit.textContent = b.by + ' · Unsplash';
        document.body.appendChild(credit);
      }
    }
  }

  var SLOTS = [
    { k: 'page', ar: 'أرضيّةُ الجلد', en: 'Skin ground' },
    { k: 'acc', ar: 'ظلُّ لونه', en: 'Accent wash', c: .045 },
    { k: 'near', ar: 'جارٌ دافئ', en: 'Warm neighbour', off: 38, c: .04 },
    { k: 'far', ar: 'جارٌ بارد', en: 'Cool neighbour', off: -38, c: .04 },
    { k: 'comp', ar: 'مقابِل', en: 'Opposite', off: 180, c: .032 },
    { k: 'sand', ar: 'رمل', en: 'Sand', h: 75, c: .04 },
    { k: 'sea', ar: 'بحر', en: 'Sea', h: 215, c: .045 },
    { k: 'rose', ar: 'ورد', en: 'Rose', h: 355, c: .045 },
    { k: 'forest', ar: 'غابة', en: 'Forest', h: 150, c: .04 },
    { k: 'dusk', ar: 'غسق', en: 'Dusk', h: 292, c: .045 }
  ];
  var probe = null;
  function rgbOf(v) {
    if (!probe) { var c = document.createElement('canvas'); c.width = c.height = 1; probe = c.getContext('2d', { willReadFrequently: true }); }
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = '#000'; probe.fillStyle = v || '#000'; probe.fillRect(0, 0, 1, 1);
    var d = probe.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
  }
  function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function gam(c) { c = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, c)) * 255); }
  function lch(rgb) {
    var r = lin(rgb[0]), g = lin(rgb[1]), b = lin(rgb[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    return { L: L, C: Math.sqrt(A * A + B * B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
  }
  function hex(L, C, h) {
    for (var t = 0; t < 24; t++, C *= 0.85) {
      var a = C * Math.cos(h * Math.PI / 180), bb = C * Math.sin(h * Math.PI / 180);
      var l = L + 0.3963377774 * a + 0.2158037573 * bb, m = L - 0.1055613458 * a - 0.0638541728 * bb, s = L - 0.0894841775 * a - 1.2914855480 * bb;
      l = l * l * l; m = m * m * m; s = s * s * s;
      var R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, Bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
      if (R >= -0.002 && R <= 1.002 && G >= -0.002 && G <= 1.002 && Bl >= -0.002 && Bl <= 1.002 || C < 0.002)
        return '#' + [gam(R), gam(G), gam(Bl)].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
    }
    return '#000000';
  }
  function bases() {
    var p = lch(rgbOf(tok('--sk-page', '') || tok('--bg-body', '#111827')));
    var a = lch(rgbOf(tok('--sk-acc', '') || tok('--st-accent', '#a78bfa')));
    if (p.C < 0.012) p.h = a.h;
    return { p: p, a: a, light: p.L > 0.6 };
  }
  function palette() {
    var B = bases(), k = B.light ? 0.8 : 1;
    return SLOTS.map(function (S) {
      var h = S.k === 'page' ? B.p.h : S.k === 'acc' ? B.a.h : S.h !== undefined ? S.h : B.p.h + S.off;
      var C = S.k === 'page' ? B.p.C : S.c * k;
      return { k: S.k, ar: S.ar, en: S.en, hex: S.k === 'page' ? hex(B.p.L, B.p.C, B.p.h) : hex(B.p.L, C, (h + 360) % 360) };
    });
  }
  function custom(c) { var B = bases(), x = lch(rgbOf(c)); return hex(B.p.L, Math.min(0.06, x.C) * (B.light ? 0.8 : 1), x.h); }
  function colorOf(b) {
    if (b.k) { var P = palette(); for (var i = 0; i < P.length; i++) if (P[i].k === b.k) return P[i].hex; }
    if (/^#[0-9a-f]{6}$/i.test(b.u || '')) return custom(b.u);
    if (/^#[0-9a-f]{6}$/i.test(b.c || '')) return custom(b.c);
    return palette()[0].hex;
  }
  function paintColor(b) {
    var h = colorOf(b);
    root.style.setProperty('--gbg-c', h);
    if (b.c !== h) {
      b.c = h;
      try { var P = JSON.parse(localStorage.getItem('dashboard_prefs') || '{}'); if (P.siteBg && P.siteBg.type === 'color') { P.siteBg.c = h; localStorage.setItem('dashboard_prefs', JSON.stringify(P)); } } catch (e) {}
    }
  }

  var mo = null;
  function watch() {
    if (mo) return;
    try {
      mo = new MutationObserver(function () {
        if (cur && cur.type === 'pixels') mount(cur);
        if (cur && cur.type === 'color') requestAnimationFrame(function () { if (cur && cur.type === 'color') paintColor(cur); });
      });
      mo.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-mod-theme', 'data-skin'] });
    } catch (e) {}
  }
  function mount(b) {
    watch();
    clear();
    cur = b || null;
    if (!b) return;
    if (b.type === 'pattern') {
      if (PATS.indexOf(b.p) > -1) root.setAttribute('data-bg-p', b.p);
      if (b.m === 'drift' || b.m === 'breathe') root.setAttribute('data-bg-m', b.m);
      var o = isFinite(+b.o) ? Math.max(4, Math.min(100, +b.o)) : 28;
      var s = isFinite(+b.s) ? Math.max(0, Math.min(100, +b.s)) : 35;
      var z = isFinite(+b.z) ? Math.max(50, Math.min(220, +b.z)) : 100;
      root.style.setProperty('--gbg-po', (o / 200).toFixed(3));
      root.style.setProperty('--gbg-ps', s + '%');
      root.style.setProperty('--gbg-pz', (z / 100).toFixed(2));
    }
    if (b.type === 'color') paintColor(b);
    if (b.type === 'pixels') pixels();
    if (b.type === 'photo') photo(b);
    onVis();
  }
  function unmount() { clear(); cur = null; syncTimer(); }

  window.GardenBg = { mount: mount, unmount: unmount, saveLocal: saveLocal, loadLocal: loadLocal, PATS: PATS, palette: palette, custom: custom };
})();
