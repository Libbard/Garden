(function () {
  'use strict';
  if (window.GardenColoring) return;

  var PALETTES = {
    water: { ar: 'ألوانٌ مائيّة', en: 'Watercolors', colors: [
      ['#f7d23e', 'أصفرُ ليمونيّ', 'Lemon yellow'], ['#f4a91c', 'أصفرُ كادميوم', 'Cadmium yellow'],
      ['#f0812a', 'برتقاليّ', 'Orange'], ['#e2452c', 'قرمزيّ', 'Vermilion'],
      ['#c21e3a', 'أحمرُ داكن', 'Crimson'], ['#e66a8e', 'ورديّ', 'Rose'],
      ['#b23a88', 'أرجوانيّ', 'Magenta'], ['#6c3fa0', 'بنفسجيّ', 'Violet'],
      ['#2e4fa8', 'لازورديّ', 'Ultramarine'], ['#2a8bc9', 'أزرقُ سماويّ', 'Cerulean'],
      ['#1ba3a6', 'فيروزيّ', 'Turquoise'], ['#1f7a5a', 'أخضرُ زمرّديّ', 'Viridian'],
      ['#6b9b2e', 'أخضرُ عشبيّ', 'Sap green'], ['#a8c64a', 'أخضرُ فاتح', 'Light green'],
      ['#c9962e', 'مغرةٌ صفراء', 'Yellow ochre'], ['#b9763a', 'سيينا خام', 'Raw sienna'],
      ['#9a4a2a', 'سيينا محروقة', 'Burnt sienna'], ['#6b4126', 'بنّيّ داكن', 'Burnt umber'],
      ['#f5b7a0', 'خوخيّ', 'Peach'], ['#9ccbeb', 'أزرقُ فاتح', 'Sky blue'],
      ['#c3a6de', 'ليلكيّ', 'Lilac'], ['#4c5866', 'رماديّ باين', "Payne's grey"],
      ['#8a8f96', 'رماديّ', 'Grey'], ['#2b2b30', 'أسود', 'Ivory black']
    ] },
    pencil: { ar: 'ألوانٌ خشبيّة', en: 'Colored pencils', colors: [
      ['#fff36b', 'أصفرُ فاتح', 'Canary'], ['#ffd21f', 'أصفر', 'Yellow'], ['#ffad1f', 'ذهبيّ', 'Golden'],
      ['#ff7a1a', 'برتقاليّ', 'Orange'], ['#ff4b3e', 'أحمرُ فاتح', 'Scarlet'], ['#d81f2a', 'أحمر', 'Red'],
      ['#9e1b32', 'خمريّ', 'Wine'], ['#ff8fb1', 'ورديّ', 'Pink'], ['#e0457b', 'فوشيا', 'Fuchsia'],
      ['#b04fc4', 'أرجوانيّ', 'Purple'], ['#7448c2', 'بنفسجيّ', 'Violet'], ['#3f3fa8', 'نيليّ', 'Indigo'],
      ['#2563eb', 'أزرق', 'Blue'], ['#38a3f1', 'سماويّ', 'Sky'], ['#7dd3fc', 'أزرقُ ثلجيّ', 'Ice blue'],
      ['#14b8a6', 'فيروزيّ', 'Teal'], ['#0f766e', 'أخضرُ بحريّ', 'Sea green'], ['#16a34a', 'أخضر', 'Green'],
      ['#4d7c0f', 'زيتيّ', 'Olive'], ['#84cc16', 'ليمونيّ', 'Lime'], ['#bef264', 'أخضرُ فاتح', 'Spring'],
      ['#a16207', 'خردليّ', 'Mustard'], ['#c2793d', 'بنّيٌّ فاتح', 'Tan'], ['#8b5a2b', 'بنّيّ', 'Brown'],
      ['#5c3a1e', 'بنّيٌّ داكن', 'Dark brown'], ['#f8c9a8', 'لونُ البشرة', 'Peach'], ['#e9a77a', 'برونزيّ', 'Bronze'],
      ['#c68642', 'قمحيّ', 'Caramel'], ['#8d5524', 'كاكاو', 'Cocoa'], ['#e5e7eb', 'رماديٌّ فاتح', 'Light grey'],
      ['#9ca3af', 'رماديّ', 'Grey'], ['#4b5563', 'رماديٌّ داكن', 'Dark grey'], ['#111111', 'أسود', 'Black'],
      ['#ffffff', 'أبيض', 'White'], ['#d4af37', 'ذهب', 'Gold'], ['#a8a9ad', 'فضّة', 'Silver']
    ] },
    crayon: { ar: 'ألوانٌ شمعيّة', en: 'Crayons', colors: [
      ['#ffe14d', 'أصفر', 'Yellow'], ['#ff9f1c', 'برتقاليّ', 'Orange'], ['#ff3b30', 'أحمر', 'Red'],
      ['#ff6fae', 'ورديّ', 'Pink'], ['#a259ff', 'بنفسجيّ', 'Purple'], ['#2f6bff', 'أزرق', 'Blue'],
      ['#33c3f0', 'سماويّ', 'Sky'], ['#20c997', 'نعناعيّ', 'Mint'], ['#2fb344', 'أخضر', 'Green'],
      ['#8a5a2b', 'بنّيّ', 'Brown'], ['#f2c6a0', 'خوخيّ', 'Peach'], ['#9aa0a6', 'رماديّ', 'Grey'],
      ['#1d1d1f', 'أسود', 'Black'], ['#ffffff', 'أبيض', 'White'], ['#e0b100', 'ذهبيّ', 'Gold'], ['#7b3f00', 'شوكولاتة', 'Chocolate']
    ] }
  };

  var TOOLS = [
    { id: 'fill', icon: 'fa-fill-drip', ar: 'دلوُ التعبئة', en: 'Fill' },
    { id: 'water', icon: 'fa-paintbrush', ar: 'ألوانٌ مائيّة', en: 'Watercolor' },
    { id: 'pencil', icon: 'fa-pencil', ar: 'قلمٌ خشبيّ', en: 'Colored pencil' },
    { id: 'crayon', icon: 'fa-brush', ar: 'لونٌ شمعيّ', en: 'Crayon' },
    { id: 'marker', icon: 'fa-marker', ar: 'فلوماستر', en: 'Marker' },
    { id: 'eraser', icon: 'fa-eraser', ar: 'ممحاة', en: 'Eraser' }
  ];
  var MEDIUM_PAL = { fill: 'water', water: 'water', pencil: 'pencil', crayon: 'crayon', marker: 'pencil', eraser: null };

  function lang() { return (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2) === 'en' ? 'en' : 'ar'; }
  function T(ar, en) { return lang() === 'en' ? en : ar; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }
  function ctx2(c) { return c.getContext('2d', { willReadFrequently: false }); }
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  var HIDE_COLOR = '<style>#color,#hair,#skin,#skin-shadow,#guide{display:none}</style>';
  var HIDE_GUIDE = '<style>#guide{display:none}</style>';
  function withStyle(svg, style) { return svg.replace(/<svg\b([^>]*)>/, function (m) { return m + style; }); }
  function svgImage(text, size) {
    var s = text.replace(/<svg\b([^>]*)>/, function (m, a) {
      a = a.replace(/\s(width|height)="[^"]*"/g, '');
      return '<svg' + a + ' width="' + size + '" height="' + size + '">';
    });
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }));
      var im = new Image();
      im.onload = function () { res(im); setTimeout(function () { URL.revokeObjectURL(url); }, 0); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('svg decode')); };
      im.src = url;
    });
  }
  function rasterImage(url) {
    return new Promise(function (res, rej) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { res(im); }; im.onerror = rej; im.src = url;
    });
  }

  function noiseTile(size, cells, seed) {
    var s = seed || 1;
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    var small = canvas(cells, cells), sc = ctx2(small), id = sc.createImageData(cells, cells);
    for (var i = 0; i < cells * cells; i++) { var v = rnd() * 255 | 0; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    sc.putImageData(id, 0, 0);
    var big = canvas(size, size), bc = ctx2(big);
    bc.imageSmoothingEnabled = true; bc.imageSmoothingQuality = 'high';
    bc.drawImage(small, 0, 0, cells, cells, 0, 0, size, size);
    bc.drawImage(small, 0, 0, cells, cells, -size, 0, size, size);
    return big;
  }
  function alphaFrom(tile, lo, hi) {
    var c = canvas(tile.width, tile.height), x = ctx2(c);
    var d = tile.getContext('2d').getImageData(0, 0, c.width, c.height), o = x.createImageData(c.width, c.height);
    for (var i = 0; i < d.data.length; i += 4) {
      var v = d.data[i] / 255, a = (v - lo) / (hi - lo); a = a < 0 ? 0 : a > 1 ? 1 : a;
      o.data[i] = o.data[i + 1] = o.data[i + 2] = 0; o.data[i + 3] = a * 255;
    }
    x.putImageData(o, 0, 0);
    return c;
  }
  var TEX = null;
  function textures() {
    if (TEX) return TEX;
    var fine = noiseTile(256, 256, 7), mid = noiseTile(256, 96, 11), coarse = noiseTile(256, 48, 23), cloud = noiseTile(512, 9, 5);
    TEX = {
      grain: [alphaFrom(fine, .62, .78), alphaFrom(fine, .42, .62), alphaFrom(fine, .18, .42)],
      wax: [alphaFrom(mid, .5, .62), alphaFrom(mid, .3, .48)],
      gran: alphaFrom(fine, -.3, 1.1),
      cloud: alphaFrom(cloud, -.6, 1.2),
      paper: (function () {
        var c = canvas(256, 256), x = ctx2(c), d = ctx2(fine).getImageData(0, 0, 256, 256), m = ctx2(coarse).getImageData(0, 0, 256, 256), o = x.createImageData(256, 256);
        for (var i = 0; i < o.data.length; i += 4) {
          var v = 247 + (d.data[i] - 128) * .035 + (m.data[i] - 128) * .03;
          o.data[i] = v; o.data[i + 1] = v - 1; o.data[i + 2] = v - 4; o.data[i + 3] = 255;
        }
        x.putImageData(o, 0, 0); return c;
      })()
    };
    return TEX;
  }
  var FILTER_OK = (function () { try { var c = canvas(2, 2).getContext('2d'); c.filter = 'blur(1px)'; return c.filter === 'blur(1px)'; } catch (e) { return false; } })();

  function maxFilter(src, w, h, r, out) {
    var tmp = new Uint8Array(w * h), x, y, i, run, last;
    for (y = 0; y < h; y++) {
      last = -1e9; var row = y * w;
      for (x = 0; x < w; x++) { if (src[row + x]) last = x; tmp[row + x] = (x - last <= r) ? 1 : 0; }
      last = 1e9;
      for (x = w - 1; x >= 0; x--) { if (src[row + x]) last = x; if (last - x <= r) tmp[row + x] = 1; }
    }
    for (x = 0; x < w; x++) {
      last = -1e9;
      for (y = 0; y < h; y++) { i = y * w + x; if (tmp[i]) last = y; out[i] = (y - last <= r) ? 1 : 0; }
      last = 1e9;
      for (y = h - 1; y >= 0; y--) { i = y * w + x; if (tmp[i]) last = y; if (last - y <= r) out[i] = 1; }
    }
    return out;
  }

  function Regions(lineCanvas, gap) {
    var w = lineCanvas.width, h = lineCanvas.height, N = w * h;
    var d = lineCanvas.getContext('2d').getImageData(0, 0, w, h).data;
    var ink = new Uint8Array(N);
    for (var i = 0, j = 0; i < N; i++, j += 4) {
      var lum = (d[j] * 299 + d[j + 1] * 587 + d[j + 2] * 114) / 1000;
      if (d[j + 3] * (255 - lum) / 255 > 110) ink[i] = 1;
    }
    var wall = maxFilter(ink, w, h, gap, new Uint8Array(N));
    var lab = new Int32Array(N), n = 0, stack = new Int32Array(N), boxes = [0];
    for (var p = 0; p < N; p++) {
      if (wall[p] || lab[p]) continue;
      n++; var sp = 0, x0 = w, y0 = h, x1 = 0, y1 = 0, area = 0;
      stack[sp++] = p; lab[p] = n;
      while (sp) {
        var q = stack[--sp], qx = q % w, qy = (q - qx) / w; area++;
        if (qx < x0) x0 = qx; if (qx > x1) x1 = qx; if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
        if (qx > 0 && !wall[q - 1] && !lab[q - 1]) { lab[q - 1] = n; stack[sp++] = q - 1; }
        if (qx < w - 1 && !wall[q + 1] && !lab[q + 1]) { lab[q + 1] = n; stack[sp++] = q + 1; }
        if (qy > 0 && !wall[q - w] && !lab[q - w]) { lab[q - w] = n; stack[sp++] = q - w; }
        if (qy < h - 1 && !wall[q + w] && !lab[q + w]) { lab[q + w] = n; stack[sp++] = q + w; }
      }
      boxes.push({ x0: x0, y0: y0, x1: x1, y1: y1, area: area });
    }
    this.w = w; this.h = h; this.lab = lab; this.n = n; this.boxes = boxes; this.gap = gap; this.cache = new Map();
  }
  Regions.prototype.at = function (x, y) {
    x = x | 0; y = y | 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    var l = this.lab[y * this.w + x];
    if (l) return l;
    for (var r = 1; r <= this.gap + 3; r++) {
      for (var k = 0; k < 8; k++) {
        var a = k * Math.PI / 4, xx = (x + Math.cos(a) * r) | 0, yy = (y + Math.sin(a) * r) | 0;
        if (xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && this.lab[yy * this.w + xx]) return this.lab[yy * this.w + xx];
      }
    }
    return 0;
  };
  Regions.prototype.mask = function (L) {
    if (this.cache.has(L)) { var hit = this.cache.get(L); this.cache.delete(L); this.cache.set(L, hit); return hit; }
    var b = this.boxes[L], pad = this.gap + 3, w = this.w, h = this.h;
    var x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad), x1 = Math.min(w - 1, b.x1 + pad), y1 = Math.min(h - 1, b.y1 + pad);
    var mw = x1 - x0 + 1, mh = y1 - y0 + 1, M = mw * mh, src = new Uint8Array(M), allow = new Uint8Array(M);
    for (var y = 0; y < mh; y++) for (var x = 0; x < mw; x++) {
      var l = this.lab[(y + y0) * w + x + x0], i = y * mw + x;
      if (l === L) { src[i] = 1; allow[i] = 1; } else if (l === 0) allow[i] = 1;
    }
    var grown = maxFilter(src, mw, mh, pad, new Uint8Array(M));
    var c = canvas(mw, mh), cx = ctx2(c), id = cx.createImageData(mw, mh);
    for (var k = 0; k < M; k++) if (grown[k] && allow[k]) id.data[k * 4 + 3] = 255;
    cx.putImageData(id, 0, 0);
    var m = { c: c, x: x0, y: y0, w: mw, h: mh };
    this.cache.set(L, m);
    if (this.cache.size > 24) this.cache.delete(this.cache.keys().next().value);
    return m;
  };

  function Studio(host, opts) {
    this.opts = opts || {};
    this.host = host;
    this.tool = 'water';
    this.color = PALETTES.water.colors[9][0];
    this.size = 0.5;
    this.lock = true;
    this.zoom = 1; this.panX = 0; this.panY = 0;
    this.undo = []; this.redo = []; this.undoBytes = 0;
    this.build();
  }

  Studio.prototype.build = function () {
    var self = this;
    var root = el('div', 'gcol');
    root.innerHTML =
      '<div class="gcol-bar" role="toolbar">' +
        '<div class="gcol-tools"></div>' +
        '<label class="gcol-size"><i class="fa-solid fa-circle" aria-hidden="true"></i><input type="range" min="0" max="1" step="0.01" value="0.5"></label>' +
        '<button type="button" class="gsf-btn gsf-btn--sm gcol-lock" aria-pressed="true"></button>' +
        '<span class="gcol-sp"></span>' +
        '<button type="button" class="gsf-btn gsf-btn--sm gcol-undo" disabled><i class="fa-solid fa-rotate-left" aria-hidden="true"></i></button>' +
        '<button type="button" class="gsf-btn gsf-btn--sm gcol-redo" disabled><i class="fa-solid fa-rotate-right" aria-hidden="true"></i></button>' +
        '<button type="button" class="gsf-btn gsf-btn--sm gcol-peek"><i class="fa-solid fa-eye" aria-hidden="true"></i><span></span></button>' +
      '</div>' +
      '<div class="gcol-wrap"><div class="gcol-stage">' +
        '<canvas class="gcol-paper"></canvas><canvas class="gcol-paint"></canvas><canvas class="gcol-live"></canvas>' +
        '<canvas class="gcol-guide" hidden></canvas><canvas class="gcol-line"></canvas><img class="gcol-ref" alt="" hidden>' +
      '</div><div class="gcol-busy" hidden><i class="fa-solid fa-palette" aria-hidden="true"></i></div></div>' +
      '<div class="gcol-pal"><div class="gsf-chips gcol-sets"></div><div class="gcol-sw"></div></div>';
    this.root = root;
    this.$ = function (s) { return root.querySelector(s); };
    var tools = this.$('.gcol-tools');
    TOOLS.forEach(function (t) {
      var b = el('button', 'gsf-chip gcol-tool');
      b.type = 'button'; b.dataset.tool = t.id;
      b.innerHTML = '<i class="fa-solid ' + t.icon + '" aria-hidden="true"></i><span></span>';
      b.dataset.arTitle = t.ar; b.dataset.enTitle = t.en;
      b.addEventListener('click', function () { self.setTool(t.id); });
      tools.appendChild(b);
    });
    var sets = this.$('.gcol-sets');
    Object.keys(PALETTES).forEach(function (k) {
      var b = el('button', 'gsf-chip'); b.type = 'button'; b.dataset.set = k;
      b.addEventListener('click', function () { self.showPalette(k); });
      sets.appendChild(b);
    });
    this.$('.gcol-size input').addEventListener('input', function (e) { self.size = +e.target.value; });
    this.$('.gcol-lock').addEventListener('click', function () { self.lock = !self.lock; self.paintChrome(); });
    this.$('.gcol-undo').addEventListener('click', function () { self.step(-1); });
    this.$('.gcol-redo').addEventListener('click', function () { self.step(1); });
    var peek = this.$('.gcol-peek');
    var on = function () { self.peek(true); }, off = function () { self.peek(false); };
    peek.addEventListener('pointerenter', on); peek.addEventListener('pointerleave', off);
    peek.addEventListener('pointerdown', on); peek.addEventListener('pointerup', off); peek.addEventListener('pointercancel', off);
    peek.addEventListener('focus', on); peek.addEventListener('blur', off);
    this.host.appendChild(root);
    this.bindStage();
    this.showPalette('water');
    this.setTool('water');
    this.paintChrome();
    this._onLang = function () { self.paintChrome(); };
    document.addEventListener('garden:lang', this._onLang);
  };

  Studio.prototype.paintChrome = function () {
    var en = lang() === 'en';
    this.root.setAttribute('dir', en ? 'ltr' : 'rtl');
    this.root.querySelectorAll('.gcol-tool').forEach(function (b) {
      var t = en ? b.dataset.enTitle : b.dataset.arTitle;
      b.querySelector('span').textContent = t; b.setAttribute('aria-label', t); b.title = t;
    });
    var self = this;
    this.root.querySelectorAll('.gcol-sets .gsf-chip').forEach(function (b) {
      var p = PALETTES[b.dataset.set]; b.textContent = en ? p.en : p.ar;
      b.classList.toggle('on', b.dataset.set === self.palette);
    });
    var lock = this.$('.gcol-lock');
    lock.setAttribute('aria-pressed', String(this.lock));
    lock.innerHTML = '<i class="fa-solid ' + (this.lock ? 'fa-shapes' : 'fa-wand-magic-sparkles') + '" aria-hidden="true"></i><span>' +
      (this.lock ? T('داخلَ الخطوط', 'Inside lines') : T('حرّ', 'Free')) + '</span>';
    lock.title = T('اللونُ لا يتجاوز حدودَ المنطقة التي بدأتَ منها', 'Paint stays inside the shape you start in');
    this.$('.gcol-undo').setAttribute('aria-label', T('تراجع', 'Undo'));
    this.$('.gcol-redo').setAttribute('aria-label', T('إعادة', 'Redo'));
    this.$('.gcol-size input').setAttribute('aria-label', T('حجمُ الأداة', 'Brush size'));
    var pk = this.$('.gcol-peek'); pk.querySelector('span').textContent = T('استرقِ النظر', 'Peek');
    pk.title = T('مرّرْ أو اضغطْ مطوّلاً لترى الرسمَ ملوّناً', 'Hover or hold to see the colored original');
    pk.hidden = !this.refSvg;
  };

  Studio.prototype.setTool = function (id) {
    this.tool = id;
    this.root.querySelectorAll('.gcol-tool').forEach(function (b) { b.classList.toggle('on', b.dataset.tool === id); b.setAttribute('aria-pressed', String(b.dataset.tool === id)); });
    var p = MEDIUM_PAL[id];
    if (p && p !== this.palette && id !== 'fill') this.showPalette(p);
    this.root.dataset.tool = id;
  };

  Studio.prototype.showPalette = function (k) {
    var self = this; this.palette = k;
    var sw = this.$('.gcol-sw'); sw.textContent = '';
    var en = lang() === 'en';
    PALETTES[k].colors.forEach(function (c) {
      var b = el('button', 'gcol-c'); b.type = 'button';
      b.style.setProperty('--c', c[0]); b.dataset.c = c[0];
      b.setAttribute('aria-label', en ? c[2] : c[1]); b.title = en ? c[2] : c[1];
      b.addEventListener('click', function () { self.setColor(c[0]); });
      sw.appendChild(b);
    });
    var pick = el('label', 'gcol-c gcol-pick');
    pick.innerHTML = '<input type="color" aria-label="' + T('لونٌ من اختيارك', 'Custom color') + '"><i class="fa-solid fa-palette" aria-hidden="true"></i>';
    pick.querySelector('input').addEventListener('input', function (e) { self.setColor(e.target.value); });
    sw.appendChild(pick);
    this.root.querySelectorAll('.gcol-sets .gsf-chip').forEach(function (b) { b.classList.toggle('on', b.dataset.set === k); });
    this.setColor(this.color);
  };

  Studio.prototype.setColor = function (c) {
    this.color = c;
    this.root.style.setProperty('--gcol-cur', c);
    this.root.querySelectorAll('.gcol-c[data-c]').forEach(function (b) { b.classList.toggle('on', b.dataset.c.toLowerCase() === c.toLowerCase()); });
  };

  Studio.prototype.load = function (item) {
    var self = this;
    this.item = item;
    this.$('.gcol-busy').hidden = false;
    var side = Math.min(1600, Math.max(900, Math.round(Math.min(window.innerWidth, 1100) * Math.min(2, window.devicePixelRatio || 1))));
    var W = side, H = side;
    var linePromise, refPromise;
    if (this.mode === 'lesson' && !item.svg) this.mode = null;
    if (item.svg) {
      this.refSvg = withStyle(item.svg, HIDE_GUIDE);
      linePromise = svgImage(withStyle(item.svg, HIDE_COLOR), W);
      refPromise = Promise.resolve(this.refSvg);
    } else {
      this.refSvg = null;
      linePromise = rasterImage(item.lineUrl);
      if (item.refUrl) this.refUrl = item.refUrl;
    }
    return linePromise.then(function (img) {
      if (!item.svg) { var r = img.naturalHeight / img.naturalWidth; H = Math.round(W * r); }
      self.W = W; self.H = H;
      ['paper', 'paint', 'live', 'line', 'guide'].forEach(function (k) {
        var c = self.$('.gcol-' + k); c.width = W; c.height = H;
      });
      self.$('.gcol-stage').style.aspectRatio = W + ' / ' + H;
      var lc = ctx2(self.$('.gcol-line'));
      lc.clearRect(0, 0, W, H);
      lc.drawImage(img, 0, 0, W, H);
      if (!item.svg) {
        var d = lc.getImageData(0, 0, W, H);
        for (var i = 0; i < d.data.length; i += 4) {
          var lum = (d.data[i] * 299 + d.data[i + 1] * 587 + d.data[i + 2] * 114) / 1000;
          d.data[i + 3] = Math.max(0, Math.min(255, (255 - lum) * 1.6 - 60)) * (d.data[i + 3] / 255);
          d.data[i] = d.data[i + 1] = d.data[i + 2] = 0;
        }
        lc.putImageData(d, 0, 0);
      }
      var pc = ctx2(self.$('.gcol-paper'));
      pc.fillStyle = pc.createPattern(textures().paper, 'repeat'); pc.fillRect(0, 0, W, H);
      ctx2(self.$('.gcol-paint')).clearRect(0, 0, W, H);
      self.regions = new Regions(self.$('.gcol-line'), Math.max(2, Math.round(W / 260)));
      self.undo = []; self.redo = []; self.undoBytes = 0; self.syncUndo();
      var ref = self.$('.gcol-ref');
      if (self.refSvg) ref.src = URL.createObjectURL(new Blob([self.refSvg], { type: 'image/svg+xml' }));
      else if (self.refUrl) ref.src = self.refUrl;
      self.paintChrome();
      self.setZoom(1, 0, 0);
      self.$('.gcol-busy').hidden = true;
      if (self.opts.onReady) self.opts.onReady(self);
      return self;
    }, function (e) {
      self.$('.gcol-busy').hidden = true;
      throw e;
    });
  };

  Studio.prototype.lesson = function (item) {
    var self = this, svg = item.svg;
    var n = 0; svg.replace(/data-step="(\d+)"/g, function (m, k) { n = Math.max(n, +k); return m; });
    this.steps = n; this.stepAt = 1; this.mode = 'lesson';
    this.root.classList.add('is-lesson');
    var bar = this.$('.gcol-lesson');
    if (!bar) {
      bar = el('div', 'gcol-lesson');
      bar.innerHTML = '<button type="button" class="gsf-btn gsf-btn--sm gcol-prev"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span></span></button>' +
        '<output></output><button type="button" class="gsf-btn gsf-btn--go gsf-btn--sm gcol-next"><span></span></button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost gsf-btn--sm gcol-tpl" aria-pressed="true"><i class="fa-solid fa-eye" aria-hidden="true"></i><span></span></button>';
      this.root.insertBefore(bar, this.$('.gcol-wrap'));
      bar.querySelector('.gcol-prev').addEventListener('click', function () { self.goStep(self.stepAt - 1); });
      bar.querySelector('.gcol-next').addEventListener('click', function () { self.goStep(self.stepAt + 1); });
      bar.querySelector('.gcol-tpl').addEventListener('click', function (e) {
        var b = e.currentTarget, on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on)); self.$('.gcol-guide').hidden = !on;
      });
    }
    return this.load({ svg: svg }).then(function () {
      self.$('.gcol-line').hidden = true;
      self.$('.gcol-guide').hidden = false;
      self.setTool('pencil'); self.setColor('#4b5563'); self.lock = false; self.paintChrome();
      return self.goStep(1);
    });
  };

  Studio.prototype.goStep = function (k) {
    if (!this.steps) return Promise.resolve();
    k = Math.max(1, Math.min(this.steps, k)); this.stepAt = k;
    var css = '#color,#hair,#skin,#skin-shadow{display:none}#guide{display:inline!important;opacity:' + (k === 1 ? .9 : .45) + '}' +
      '#line [data-step]{opacity:.5}#line [data-step="' + k + '"]{opacity:1}#line [data-step="' + k + '"] *{stroke:#2563eb}';
    for (var j = k + 1; j <= this.steps; j++) css += '#line [data-step="' + j + '"]{display:none}';
    var self = this, bar = this.$('.gcol-lesson');
    bar.querySelector('output').textContent = T('الخطوة ', 'Step ') + k + ' / ' + this.steps;
    bar.querySelector('.gcol-prev').disabled = k === 1;
    bar.querySelector('.gcol-next span').textContent = k === this.steps ? T('قارنْ رسمي', 'Compare') : T('الخطوةُ التالية', 'Next step');
    bar.querySelector('.gcol-prev span').textContent = T('السابقة', 'Back');
    bar.querySelector('.gcol-tpl span').textContent = T('القالب', 'Guide');
    if (k === this.steps && this._lastStep === k) { this.$('.gcol-line').hidden = !this.$('.gcol-line').hidden; }
    this._lastStep = k;
    return svgImage(withStyle(this.item.svg, '<style>' + css + '</style>'), this.W).then(function (img) {
      var g = ctx2(self.$('.gcol-guide')); g.clearRect(0, 0, self.W, self.H); g.drawImage(img, 0, 0, self.W, self.H);
    });
  };

  Studio.prototype.peek = function (on) {
    var ref = this.$('.gcol-ref');
    if (!ref.getAttribute('src')) return;
    ref.hidden = !on;
    this.root.classList.toggle('is-peek', !!on);
  };

  Studio.prototype.pt = function (e) {
    var r = this.$('.gcol-line').getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * this.W, y: (e.clientY - r.top) / r.height * this.H, p: e.pointerType === 'pen' ? Math.max(.05, e.pressure || .5) : (e.pointerType === 'touch' ? .65 : .7), k: r.width / this.W };
  };

  Studio.prototype.radius = function () {
    var base = { water: [6, 70], pencil: [1.5, 14], crayon: [4, 32], marker: [3, 30], eraser: [4, 60] }[this.tool] || [4, 30];
    return (base[0] + (base[1] - base[0]) * this.size * this.size) * this.W / 1000;
  };

  Studio.prototype.bindStage = function () {
    var self = this, stage = this.$('.gcol-stage'), wrap = this.$('.gcol-wrap');
    var pointers = new Map(), stroke = null, gesture = null, lastPen = 0;
    stage.addEventListener('pointerdown', function (e) {
      if (!self.regions) return;
      if (e.pointerType === 'pen') lastPen = Date.now();
      if (e.pointerType === 'touch' && Date.now() - lastPen < 1500) return;
      if (e.button > 0 && e.pointerType === 'mouse') return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      if (pointers.size === 2) {
        if (stroke) { self.abortStroke(); stroke = null; }
        var ps = Array.from(pointers.values());
        gesture = { d: Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y), cx: (ps[0].x + ps[1].x) / 2, cy: (ps[0].y + ps[1].y) / 2, z: self.zoom, px: self.panX, py: self.panY };
        return;
      }
      if (pointers.size > 2) return;
      e.preventDefault();
      var p = self.pt(e);
      if (self.tool === 'fill') { self.fillAt(p.x, p.y); return; }
      stroke = self.beginStroke(p);
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesture && pointers.size === 2) {
        var ps = Array.from(pointers.values());
        var d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y), cx = (ps[0].x + ps[1].x) / 2, cy = (ps[0].y + ps[1].y) / 2;
        self.setZoom(gesture.z * d / gesture.d, gesture.px + (cx - gesture.cx), gesture.py + (cy - gesture.cy));
        return;
      }
      if (!stroke) return;
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      if (!evs.length) evs = [e];
      for (var i = 0; i < evs.length; i++) self.moveStroke(stroke, self.pt(evs[i]));
    });
    var end = function (e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (gesture) { if (pointers.size < 2) gesture = null; return; }
      if (stroke) { self.endStroke(stroke); stroke = null; }
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', function (e) { if (stroke) { self.abortStroke(); stroke = null; } pointers.delete(e.pointerId); gesture = null; });
    wrap.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && !e.metaKey && self.zoom === 1) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) self.setZoom(self.zoom * Math.exp(-e.deltaY / 300), self.panX, self.panY);
      else self.setZoom(self.zoom, self.panX - e.deltaX, self.panY - e.deltaY);
    }, { passive: false });
    wrap.addEventListener('dblclick', function () { if (self.zoom !== 1) self.setZoom(1, 0, 0); });
  };

  Studio.prototype.setZoom = function (z, x, y) {
    z = Math.max(1, Math.min(6, z));
    var wrap = this.$('.gcol-wrap'), lim = (z - 1) * wrap.clientWidth / 2;
    if (z === 1) { x = 0; y = 0; }
    this.zoom = z; this.panX = Math.max(-lim, Math.min(lim, x)); this.panY = Math.max(-lim, Math.min(lim, y));
    this.$('.gcol-stage').style.transform = z === 1 ? '' : 'translate(' + this.panX + 'px,' + this.panY + 'px) scale(' + z + ')';
  };

  Studio.prototype.region = function (x, y) {
    if (!this.lock) return null;
    var L = this.regions.at(x, y);
    return L ? this.regions.mask(L) : null;
  };

  Studio.prototype.beginStroke = function (p) {
    var live = this.$('.gcol-live'), lc = ctx2(live);
    lc.clearRect(0, 0, this.W, this.H);
    var s = { tool: this.tool, color: this.color, r: this.radius(), last: p, mask: this.region(p.x, p.y), box: null, dist: 0 };
    live.style.opacity = { water: .55, marker: .9 }[s.tool] || 1;
    live.style.mixBlendMode = s.tool === 'eraser' ? 'normal' : 'multiply';
    if (s.tool === 'eraser') { s.snap = this.snapshot(0, 0, this.W, this.H); live.style.opacity = 0; }
    this.dab(s, p, p);
    return s;
  };

  Studio.prototype.moveStroke = function (s, p) {
    var d = Math.hypot(p.x - s.last.x, p.y - s.last.y);
    if (d < Math.max(.6, s.r * .08)) return;
    this.dab(s, s.last, p);
    s.last = p; s.dist += d;
  };

  Studio.prototype.dab = function (s, a, b) {
    var r = s.r, tool = s.tool, pr = b.p;
    if (tool === 'pencil') r = s.r * (.55 + .6 * pr);
    if (tool === 'water') r = s.r * (.7 + .5 * pr);
    if (tool === 'crayon') r = s.r * (.75 + .35 * pr);
    var pad = r + 4, x0 = Math.floor(Math.min(a.x, b.x) - pad), y0 = Math.floor(Math.min(a.y, b.y) - pad);
    var x1 = Math.ceil(Math.max(a.x, b.x) + pad), y1 = Math.ceil(Math.max(a.y, b.y) + pad);
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(this.W, x1); y1 = Math.min(this.H, y1);
    var w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0) return;
    var seg = canvas(w, h), sc = ctx2(seg);
    sc.translate(-x0, -y0);
    sc.lineCap = 'round'; sc.lineJoin = 'round';
    var col = tool === 'eraser' ? '#000' : s.color;
    if (tool === 'water') {
      var steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (r * .18)));
      for (var i = 0; i <= steps; i++) {
        var t = i / steps, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t, rr = r * (.9 + Math.random() * .2);
        var g = sc.createRadialGradient(x, y, 0, x, y, rr);
        g.addColorStop(0, col); g.addColorStop(.72, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        sc.fillStyle = g; sc.beginPath(); sc.arc(x, y, rr, 0, 7); sc.fill();
      }
    } else {
      sc.strokeStyle = col; sc.lineWidth = r * 2;
      sc.globalAlpha = tool === 'pencil' ? Math.min(1, .35 + .6 * pr) : 1;
      sc.beginPath(); sc.moveTo(a.x, a.y); sc.lineTo(b.x + .01, b.y); sc.stroke();
      sc.globalAlpha = 1;
      if (tool === 'pencil' || tool === 'crayon') {
        var tex = textures(), lvl = tool === 'pencil' ? tex.grain[pr < .35 ? 0 : pr < .7 ? 1 : 2] : tex.wax[pr < .5 ? 0 : 1];
        sc.setTransform(1, 0, 0, 1, 0, 0);
        sc.globalCompositeOperation = 'destination-in';
        var pat = sc.createPattern(lvl, 'repeat');
        if (pat.setTransform) pat.setTransform(new DOMMatrix().translate(-x0, -y0).scale(tool === 'crayon' ? 1.6 : 1));
        sc.fillStyle = pat; sc.fillRect(0, 0, w, h);
      }
    }
    sc.setTransform(1, 0, 0, 1, 0, 0);
    if (s.mask) {
      sc.globalCompositeOperation = 'destination-in';
      sc.drawImage(s.mask.c, s.mask.x - x0, s.mask.y - y0);
    }
    var target = tool === 'eraser' ? ctx2(this.$('.gcol-paint')) : ctx2(this.$('.gcol-live'));
    target.save();
    if (tool === 'eraser') target.globalCompositeOperation = 'destination-out';
    target.drawImage(seg, x0, y0);
    target.restore();
    s.box = s.box ? { x0: Math.min(s.box.x0, x0), y0: Math.min(s.box.y0, y0), x1: Math.max(s.box.x1, x1), y1: Math.max(s.box.y1, y1) } : { x0: x0, y0: y0, x1: x1, y1: y1 };
  };

  Studio.prototype.abortStroke = function () {
    var lc = ctx2(this.$('.gcol-live'));
    lc.clearRect(0, 0, this.W, this.H);
  };

  Studio.prototype.endStroke = function (s) {
    if (!s.box) return;
    var b = s.box, pad = 6, x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad), x1 = Math.min(this.W, b.x1 + pad), y1 = Math.min(this.H, b.y1 + pad);
    var w = x1 - x0, h = y1 - y0;
    if (s.tool === 'eraser') {
      var pc = ctx2(this.$('.gcol-paint')), after = pc.getImageData(x0, y0, w, h);
      pc.putImageData(s.snap.data, 0, 0);
      var before = pc.getImageData(x0, y0, w, h);
      pc.putImageData(after, x0, y0);
      this.push({ x: x0, y: y0, before: before, after: after });
      return;
    }
    var live = this.$('.gcol-live'), layer = canvas(w, h), lc = ctx2(layer);
    lc.drawImage(live, x0, y0, w, h, 0, 0, w, h);
    if (s.tool === 'water') this.watercolor(lc, w, h, x0, y0, s.mask);
    this.commit(layer, x0, y0, { water: .55, marker: .9 }[s.tool] || 1, 'multiply');
    ctx2(live).clearRect(0, 0, this.W, this.H);
  };

  Studio.prototype.watercolor = function (lc, w, h, x0, y0, mask) {
    var tex = textures(), layer = lc.canvas;
    if (FILTER_OK) {
      var soft = canvas(w, h), so = ctx2(soft);
      so.filter = 'blur(' + Math.max(1, this.W / 700) + 'px)'; so.drawImage(layer, 0, 0); so.filter = 'none';
      var edge = canvas(w, h), ec = ctx2(edge);
      ec.drawImage(layer, 0, 0);
      ec.globalCompositeOperation = 'destination-out';
      ec.filter = 'blur(' + Math.max(2, this.W / 220) + 'px)'; ec.drawImage(layer, 0, 0); ec.filter = 'none';
      lc.clearRect(0, 0, w, h); lc.drawImage(soft, 0, 0);
      lc.globalAlpha = .9; lc.drawImage(edge, 0, 0); lc.drawImage(edge, 0, 0); lc.globalAlpha = 1;
      if (mask) { lc.globalCompositeOperation = 'destination-in'; lc.drawImage(mask.c, mask.x - x0, mask.y - y0); lc.globalCompositeOperation = 'source-over'; }
    }
    lc.globalCompositeOperation = 'destination-in';
    var cp = lc.createPattern(tex.cloud, 'repeat'); if (cp.setTransform) cp.setTransform(new DOMMatrix().translate(-x0, -y0).scale(this.W / 700));
    lc.fillStyle = cp; lc.fillRect(0, 0, w, h);
    var gp = lc.createPattern(tex.gran, 'repeat'); if (gp.setTransform) gp.setTransform(new DOMMatrix().translate(-x0, -y0));
    lc.fillStyle = gp; lc.fillRect(0, 0, w, h);
    lc.globalCompositeOperation = 'source-over';
  };

  Studio.prototype.fillAt = function (x, y) {
    var L = this.regions.at(x, y);
    if (!L) return;
    var m = this.regions.mask(L), tool = this.tool, w = m.w, h = m.h;
    var layer = canvas(w, h), lc = ctx2(layer), tex = textures();
    var medium = this.palette === 'water' ? 'water' : this.palette === 'crayon' ? 'crayon' : 'pencil';
    if (tool === 'fill' && this.palette === 'pencil' && this.flat !== false) medium = 'pencil';
    lc.fillStyle = this.color; lc.fillRect(0, 0, w, h);
    lc.globalCompositeOperation = 'destination-in';
    if (medium === 'pencil' || medium === 'crayon') {
      var lvl = medium === 'pencil' ? tex.grain[2] : tex.wax[1];
      var p = lc.createPattern(lvl, 'repeat'); if (p.setTransform) p.setTransform(new DOMMatrix().translate(-m.x, -m.y).scale(medium === 'crayon' ? 1.6 : 1));
      lc.fillStyle = p; lc.fillRect(0, 0, w, h);
    }
    lc.drawImage(m.c, 0, 0);
    lc.globalCompositeOperation = 'source-over';
    if (medium === 'water') {
      if (FILTER_OK) {
        var inner = canvas(w, h), ic = ctx2(inner);
        ic.filter = 'blur(' + Math.max(3, this.W / 160) + 'px)'; ic.drawImage(m.c, 0, 0); ic.filter = 'none';
        var edge = canvas(w, h), ec = ctx2(edge);
        ec.drawImage(layer, 0, 0); ec.globalCompositeOperation = 'destination-out'; ec.drawImage(inner, 0, 0);
        lc.globalAlpha = .85; lc.drawImage(edge, 0, 0); lc.globalAlpha = 1;
      }
      lc.globalCompositeOperation = 'destination-in';
      var cp = lc.createPattern(tex.cloud, 'repeat'); if (cp.setTransform) cp.setTransform(new DOMMatrix().translate(-m.x, -m.y).scale(this.W / 700));
      lc.fillStyle = cp; lc.fillRect(0, 0, w, h);
      var gp = lc.createPattern(tex.gran, 'repeat'); if (gp.setTransform) gp.setTransform(new DOMMatrix().translate(-m.x, -m.y));
      lc.fillStyle = gp; lc.fillRect(0, 0, w, h);
      lc.globalCompositeOperation = 'source-over';
    }
    var alpha = medium === 'water' ? .62 : medium === 'crayon' ? .95 : .9;
    this.commit(layer, m.x, m.y, alpha, 'multiply');
  };

  Studio.prototype.snapshot = function (x, y, w, h) {
    var c = ctx2(this.$('.gcol-paint'));
    return { x: x, y: y, data: c.getImageData(x, y, w, h) };
  };

  Studio.prototype.commit = function (layer, x0, y0, alpha, blend) {
    var pc = ctx2(this.$('.gcol-paint')), w = layer.width, h = layer.height;
    var before = pc.getImageData(x0, y0, w, h);
    pc.save(); pc.globalAlpha = alpha; pc.globalCompositeOperation = blend || 'source-over';
    pc.drawImage(layer, x0, y0); pc.restore();
    this.push({ x: x0, y: y0, before: before, after: pc.getImageData(x0, y0, w, h) });
    if (this.opts.onChange) this.opts.onChange(this);
  };

  Studio.prototype.push = function (u) {
    this.undo.push(u); this.redo = [];
    this.undoBytes += u.before.data.length * 2;
    while (this.undo.length > 1 && (this.undo.length > 40 || this.undoBytes > 160e6)) {
      var o = this.undo.shift(); this.undoBytes -= o.before.data.length * 2;
    }
    this.syncUndo();
  };
  Studio.prototype.step = function (dir) {
    var from = dir < 0 ? this.undo : this.redo, to = dir < 0 ? this.redo : this.undo;
    var u = from.pop(); if (!u) return;
    ctx2(this.$('.gcol-paint')).putImageData(dir < 0 ? u.before : u.after, u.x, u.y);
    to.push(u); this.syncUndo();
  };
  Studio.prototype.syncUndo = function () {
    this.$('.gcol-undo').disabled = !this.undo.length;
    this.$('.gcol-redo').disabled = !this.redo.length;
  };

  Studio.prototype.clear = function () {
    var pc = ctx2(this.$('.gcol-paint')), before = pc.getImageData(0, 0, this.W, this.H);
    pc.clearRect(0, 0, this.W, this.H);
    this.push({ x: 0, y: 0, before: before, after: pc.getImageData(0, 0, this.W, this.H) });
  };

  Studio.prototype.toBlob = function (opts) {
    opts = opts || {};
    var self = this, out = canvas(this.W, this.H), oc = ctx2(out);
    if (!opts.transparent) oc.drawImage(this.$('.gcol-paper'), 0, 0);
    oc.drawImage(this.$('.gcol-paint'), 0, 0);
    oc.drawImage(this.$('.gcol-line'), 0, 0);
    return new Promise(function (res) { out.toBlob(res, 'image/png'); });
  };

  Studio.prototype.painted = function () {
    var d = ctx2(this.$('.gcol-paint')).getImageData(0, 0, this.W, this.H).data, n = 0;
    for (var i = 3; i < d.length; i += 16) if (d[i] > 8) n++;
    return n * 4;
  };

  Studio.prototype.destroy = function () {
    document.removeEventListener('garden:lang', this._onLang);
    var ref = this.$('.gcol-ref'); if (ref.src && ref.src.indexOf('blob:') === 0) URL.revokeObjectURL(ref.src);
    this.regions = null; this.undo = []; this.redo = [];
    this.root.remove();
  };

  window.GardenColoring = {
    PALETTES: PALETTES,
    TOOLS: TOOLS,
    create: function (host, opts) { return new Studio(host, opts); },
    lineOnly: function (svg) { return withStyle(svg, HIDE_COLOR); },
    colored: function (svg) { return withStyle(svg, HIDE_GUIDE); }
  };
})();
