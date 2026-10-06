(function () {
  'use strict';
  if (window.GardenColoring) return;

  var PALETTES = {
    wash: { ar: 'ألوانٌ مائيّة', en: 'Watercolors', colors: [
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
    graphite: { ar: 'درجاتُ الرصاص', en: 'Graphite grades', colors: [
      ['#b8b8bd', '2H — صلبٌ فاتح', '2H — hard, light'], ['#9a9aa0', 'HB', 'HB'], ['#77777e', '2B', '2B'],
      ['#55555c', '4B', '4B'], ['#3a3a40', '6B', '6B'], ['#26262b', '8B — ليّنٌ داكن', '8B — soft, dark']
    ] },
    oil: { ar: 'ألوانٌ زيتيّة', en: 'Oil paints', colors: [
      ['#f4f1e8', 'أبيضُ التيتانيوم', 'Titanium white'], ['#f6d32d', 'أصفرُ الكادميوم', 'Cadmium yellow'], ['#e8a33a', 'مغرةٌ صفراء', 'Yellow ochre'],
      ['#e2452c', 'أحمرُ الكادميوم', 'Cadmium red'], ['#9e1b32', 'أليزارين قرمزيّ', 'Alizarin crimson'], ['#8a4a2a', 'سيينا محروقة', 'Burnt sienna'],
      ['#5c3a1e', 'أمبر محروق', 'Burnt umber'], ['#1d3fa8', 'أزرقُ الألترامارين', 'Ultramarine blue'], ['#0f5a8a', 'أزرقُ بروسيا', 'Prussian blue'],
      ['#2a8bc9', 'أزرقُ سيرولين', 'Cerulean blue'], ['#1f7a5a', 'أخضرُ فيريديان', 'Viridian'], ['#6b8e23', 'أخضرُ عشبيّ', 'Sap green'],
      ['#6c3fa0', 'بنفسجيُّ ديوكسازين', 'Dioxazine violet'], ['#d98aa8', 'ورديٌّ فاتح', 'Rose'], ['#1d1d1f', 'أسودُ العاج', 'Ivory black']
    ] },
    chalk: { ar: 'طباشيرُ باستيل', en: 'Soft pastels', colors: [
      ['#fff4c2', 'كريميّ', 'Cream'], ['#ffd34d', 'أصفرُ ذهبيّ', 'Golden yellow'], ['#ff9f6e', 'خوخيّ', 'Peach'], ['#e04a7a', 'ورديٌّ داكن', 'Deep rose'],
      ['#c23b3b', 'أحمر', 'Red'], ['#9b6bd6', 'بنفسجيّ', 'Violet'], ['#5aa0e6', 'أزرقُ سماويّ', 'Sky blue'], ['#2e5c9e', 'أزرقُ ليليّ', 'Night blue'],
      ['#7ccf8b', 'أخضرُ نعناعيّ', 'Mint'], ['#3f8a4a', 'أخضرُ ورقيّ', 'Leaf green'], ['#c7a27a', 'رمليّ', 'Sand'], ['#7a5a43', 'بنّيّ', 'Brown'],
      ['#ffffff', 'أبيض', 'White'], ['#9a9aa0', 'رماديّ', 'Grey'], ['#222226', 'فحميّ', 'Charcoal']
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
    { id: 'wash', icon: 'fa-paintbrush', ar: 'ألوانٌ مائيّة', en: 'Watercolor' },
    { id: 'pencil', icon: 'fa-pencil', ar: 'قلمٌ خشبيّ', en: 'Colored pencil' },
    { id: 'crayon', icon: 'fa-brush', ar: 'لونٌ شمعيّ', en: 'Crayon' },
    { id: 'marker', icon: 'fa-marker', ar: 'فلوماستر', en: 'Marker' },
    { id: 'blend', icon: 'fa-droplet', ar: 'دمجُ الألوان', en: 'Blend' },
    { id: 'eraser', icon: 'fa-eraser', ar: 'ممحاة', en: 'Eraser' },
    { id: 'pick', icon: 'fa-eye-dropper', ar: 'خذْ لونَ الأصل', en: 'Pick original color' }
  ];
  var GL_TOOLS = [
    { id: 'fill', icon: 'fa-fill-drip', ar: 'دلوُ التعبئة', en: 'Fill' },
    { id: 'wash', icon: 'fa-paintbrush', ar: 'ألوانٌ مائيّة', en: 'Watercolor' },
    { id: 'pencil', icon: 'fa-pencil', ar: 'قلمٌ خشبيّ', en: 'Colored pencil' },
    { id: 'graphite', icon: 'fa-pen', ar: 'قلمُ رصاص', en: 'Graphite' },
    { id: 'chalk', icon: 'fa-brush', ar: 'طباشيرُ باستيل', en: 'Soft pastel' },
    { id: 'oil', icon: 'fa-palette', ar: 'ألوانٌ زيتيّة', en: 'Oil paint' },
    { id: 'marker', icon: 'fa-marker', ar: 'فلوماستر', en: 'Marker' },
    { id: 'blend', icon: 'fa-droplet', ar: 'دمجُ الألوان', en: 'Blend' },
    { id: 'eraser', icon: 'fa-eraser', ar: 'ممحاة', en: 'Eraser' },
    { id: 'pick', icon: 'fa-eye-dropper', ar: 'خذْ لونَ الأصل', en: 'Pick original color' }
  ];
  var GL_PAL = { fill: null, wash: 'wash', pencil: 'pencil', graphite: 'graphite', chalk: 'chalk', oil: 'oil', marker: 'pencil', blend: null, eraser: null, pick: null };
  var MEDIUM_PAL = { fill: 'wash', wash: 'wash', pencil: 'pencil', crayon: 'crayon', marker: 'pencil', eraser: null, pick: null, blend: null };
  var PAPERS = [['smooth', 'ورقٌ ناعم', 'Smooth paper'], ['cold', 'ورقُ ألوانٍ مائيّة', 'Cold-press paper'], ['rough', 'ورقٌ خشن', 'Rough paper'], ['canvas', 'قماشُ رسم', 'Canvas']];

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
      gran: alphaFrom(fine, -2.2, 1.0),
      cloud: alphaFrom(cloud, -1.6, 1.1),
      papers: (function () {
        var d = ctx2(fine).getImageData(0, 0, 256, 256).data, md = ctx2(mid).getImageData(0, 0, 256, 256).data, m = ctx2(coarse).getImageData(0, 0, 256, 256).data;
        function make(kf, km, kc, base) {
          var c = canvas(256, 256), x = ctx2(c), o = x.createImageData(256, 256);
          for (var i = 0; i < o.data.length; i += 4) {
            var v = base + (d[i] - 128) * kf + (md[i] - 128) * km + (m[i] - 128) * kc;
            o.data[i] = v; o.data[i + 1] = v - 1; o.data[i + 2] = v - 4; o.data[i + 3] = 255;
          }
          x.putImageData(o, 0, 0); return c;
        }
        return { smooth: make(.03, 0, .025, 249), cold: make(.05, .07, .06, 246), rough: make(.09, .1, .09, 243) };
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
    this.tool = 'wash';
    this.color = PALETTES.wash.colors[9][0];
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
        '<button type="button" class="gsf-btn gsf-btn--sm gcol-shade" aria-pressed="true"><i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i><span></span></button>' +
        '<span class="gcol-sp"></span>' +
        '<button type="button" class="gsf-btn gsf-btn--sm gcol-undo" disabled><i class="fa-solid fa-rotate-left" aria-hidden="true"></i></button>' +
        '<button type="button" class="gsf-btn gsf-btn--sm gcol-redo" disabled><i class="fa-solid fa-rotate-right" aria-hidden="true"></i></button>' +
        '<button type="button" class="gsf-btn gsf-btn--sm gcol-peek"><i class="fa-solid fa-eye" aria-hidden="true"></i><span></span></button>' +
      '</div>' +
      '<div class="gcol-wrap"><div class="gcol-stage">' +
        '<canvas class="gcol-paper"></canvas><canvas class="gcol-paint"></canvas><canvas class="gcol-live"></canvas>' +
        '<canvas class="gcol-guide" hidden></canvas><canvas class="gcol-line"></canvas><img class="gcol-ref" alt="" hidden>' +
      '</div><div class="gcol-busy" hidden><i class="fa-solid fa-palette" aria-hidden="true"></i></div></div>' +
      '<div class="gcol-pal"><div class="gcol-palhead"><div class="gsf-chips gcol-sets"></div><div class="gsf-chips gcol-papers"></div></div><div class="gcol-recent"></div><div class="gcol-sw"></div></div>';
    this.root = root;
    this.$ = function (s) { return root.querySelector(s); };
    this.glm = !this.opts.noGL && !!window.GardenPaintGL && GardenPaintGL.supported();
    if (this.glm) {
      var glc = el('canvas', 'gcol-gl'); this.$('.gcol-stage').insertBefore(glc, this.$('.gcol-guide'));
      root.classList.add('is-gl');
    }
    var tools = this.$('.gcol-tools');
    (this.glm ? GL_TOOLS : TOOLS).forEach(function (t) {
      var b = el('button', 'gsf-chip gcol-tool');
      b.type = 'button'; b.dataset.tool = t.id;
      b.innerHTML = '<i class="fa-solid ' + t.icon + '" aria-hidden="true"></i><span></span>';
      b.dataset.arTitle = t.ar; b.dataset.enTitle = t.en;
      b.addEventListener('click', function () { self.setTool(t.id); });
      tools.appendChild(b);
    });
    var sets = this.$('.gcol-sets');
    Object.keys(PALETTES).filter(function (k) { return self.glm ? k !== 'crayon' : ['graphite', 'oil', 'chalk'].indexOf(k) < 0; }).forEach(function (k) {
      var b = el('button', 'gsf-chip'); b.type = 'button'; b.dataset.set = k;
      b.addEventListener('click', function () { self.showPalette(k); });
      sets.appendChild(b);
    });
    this.$('.gcol-size input').addEventListener('input', function (e) { self.size = +e.target.value; });
    this.shade = true;
    this.$('.gcol-shade').addEventListener('click', function () { self.shade = !self.shade; self.paintChrome(); });
    var papers = this.$('.gcol-papers');
    PAPERS.filter(function (pp) { return self.glm || pp[0] !== 'canvas'; }).forEach(function (pp) {
      var b = el('button', 'gsf-chip'); b.type = 'button'; b.dataset.paper = pp[0];
      b.addEventListener('click', function () { self.setPaper(pp[0]); });
      papers.appendChild(b);
    });
    this.paperKind = this.glm ? 'cold' : 'smooth';
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
    this.showPalette('wash');
    this.setTool('wash');
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
    var sh = this.$('.gcol-shade');
    sh.setAttribute('aria-pressed', String(!!this.shade));
    sh.querySelector('span').textContent = T('تظليلٌ تلقائيّ', 'Auto shading');
    sh.title = T('الدلوُ يرسم ضوءاً وظلّاً داخل المنطقة كما يفعل الرسّام', 'The fill adds light and shadow inside the shape, like an illustrator');
    var self2 = this;
    this.root.querySelectorAll('.gcol-papers .gsf-chip').forEach(function (b) {
      var pp = PAPERS.filter(function (x) { return x[0] === b.dataset.paper; })[0];
      b.textContent = en ? pp[2] : pp[1]; b.classList.toggle('on', pp[0] === (self2.paperKind || 'smooth'));
    });
    var pk = this.$('.gcol-peek'); pk.querySelector('span').textContent = T('استرقِ النظر', 'Peek');
    pk.title = T('مرّرْ أو اضغطْ مطوّلاً لترى الرسمَ ملوّناً', 'Hover or hold to see the colored original');
    pk.hidden = !(this.refSvg || this.refUrl);
  };

  Studio.prototype.setTool = function (id) {
    this.tool = id;
    this.root.querySelectorAll('.gcol-tool').forEach(function (b) { b.classList.toggle('on', b.dataset.tool === id); b.setAttribute('aria-pressed', String(b.dataset.tool === id)); });
    var p = (this.glm ? GL_PAL : MEDIUM_PAL)[id];
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
      if (!item.svg) { W = Math.min(2048, img.naturalWidth || W); H = Math.round(W * img.naturalHeight / img.naturalWidth); }
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
      if (self.glm) {
        try {
          if (!self.S || self.S.W !== W || self.S.H !== H) {
            if (self.S) self.S.destroy();
            var old = self.$('.gcol-gl'), fresh = el('canvas', 'gcol-gl'); old.parentNode.replaceChild(fresh, old);
            self.S = GardenPaintGL.create(fresh, { W: W, H: H, paper: self.paperKind });
          } else { self.S.clear(); self.S.setPaper(self.paperKind); }
          self.kick();
        } catch (e) { self.glm = false; self.root.classList.remove('is-gl'); }
      }
      self.drawPaper();
      ctx2(self.$('.gcol-paint')).clearRect(0, 0, W, H);
      self.regions = new Regions(self.$('.gcol-line'), Math.max(2, Math.round(W / (item.svg ? 260 : 420))));
      self._refPx = null;
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

  Studio.prototype.kick = function () {
    if (!this.S || this._raf) return;
    var self = this, last = performance.now();
    var loop = function (now) {
      self._raf = 0;
      if (!self.S) return;
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      var wet = self.S.wet ? self.S.tick(dt) : false;
      self._ageAcc = (self._ageAcc || 0) + dt;
      var oil = false; if (self.S.oilT) { oil = true; if (self._ageAcc > 1) { self.S.age(self._ageAcc); self._ageAcc = 0; } }
      if (self.S.dirty) self.S.render();
      if (wet || self.S.wet || oil) self._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  };

  Studio.prototype.drawPaper = function () {
    if (this.glm && this.S) { this.S.setPaper(this.paperKind); this.root.dataset.paper = this.paperKind; this.kick(); return; }
    var pc = ctx2(this.$('.gcol-paper')), k = this.paperKind || 'smooth';
    var pat = pc.createPattern(textures().papers[k], 'repeat');
    if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(Math.max(1, this.W / 1100)));
    pc.fillStyle = pat; pc.fillRect(0, 0, this.W, this.H);
    this.root.dataset.paper = k;
  };

  Studio.prototype.setPaper = function (k) {
    this.paperKind = k;
    if (this.W) this.drawPaper();
    this.root.querySelectorAll('.gcol-papers .gsf-chip').forEach(function (b) { b.classList.toggle('on', b.dataset.paper === k); });
  };

  Studio.prototype.paintOriginal = function () {
    var self = this, src = this.$('.gcol-ref').getAttribute('src');
    if (!src) return Promise.resolve(false);
    return new Promise(function (res) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () {
        if (self.glm && self.S) {
          var r = [0, 0, self.W, self.H], b = self.S.snap(r); self.S.paintImage(im); self.pushGL(r, b); self.kick();
        } else {
          var pc = ctx2(self.$('.gcol-paint')), before = pc.getImageData(0, 0, self.W, self.H);
          pc.drawImage(im, 0, 0, self.W, self.H);
          self.push({ x: 0, y: 0, before: before, after: pc.getImageData(0, 0, self.W, self.H) });
        }
        res(true);
      };
      im.onerror = function () { res(false); };
      im.src = src;
    });
  };

  Studio.prototype.peek = function (on) {
    var ref = this.$('.gcol-ref');
    if (!ref.getAttribute('src')) return;
    ref.hidden = !on;
    this.root.classList.toggle('is-peek', !!on);
  };

  Studio.prototype.radius = function (tool) {
    var base = { wash: [6, 70], pencil: [1.2, 14], graphite: [1, 12], chalk: [4, 40], oil: [4, 60], crayon: [4, 32], marker: [2.5, 30], eraser: [4, 60], blend: [5, 55] }[tool || this.tool] || [4, 30];
    return (base[0] + (base[1] - base[0]) * this.size * this.size) * this.W / 1000;
  };

  Studio.prototype.toCanvas = function (p) {
    var st = this.$('.gcol-stage');
    return { x: p.x * this.W / (st.offsetWidth || 1), y: p.y * this.H / (st.offsetHeight || 1), p: p.p == null ? .7 : p.p, tz: p.tz || 0 };
  };

  Studio.prototype.bindStage = function () {
    var self = this, stage = this.$('.gcol-stage'), wrap = this.$('.gcol-wrap');
    wrap.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && !e.metaKey && self.zoom === 1) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) self.setZoom(self.zoom * Math.exp(-e.deltaY / 300), self.panX, self.panY);
      else self.setZoom(self.zoom, self.panX - e.deltaX, self.panY - e.deltaY);
    }, { passive: false });
    wrap.addEventListener('dblclick', function () { if (self.zoom !== 1) self.setZoom(1, 0, 0); });
    if (window.GardenInkInput) return this.bindInk(stage);
    this.bindPlain(stage);
  };

  Studio.prototype.startAt = function (p, act) {
    if (!this.regions) return null;
    if (this.tool === 'pick' && act !== 'era') { this.pickAt(p.x, p.y); return { done: 1 }; }
    if (this.tool === 'fill' && act !== 'era') return { tap: p };
    return this.beginStroke(p, act === 'era' ? 'eraser' : null);
  };

  Studio.prototype.finish = function (s, keep) {
    if (!s || s.done) return;
    if (s.tap) { if (keep) this.fillAt(s.tap.x, s.tap.y); return; }
    if (keep) this.endStroke(s); else this.abortStroke();
  };

  Studio.prototype.bindInk = function (stage) {
    var self = this, live = {}, g0 = null;
    this.router = GardenInkInput.create({
      el: stage,
      palmDefault: '',
      onBegin: function (id, pt, ptype, act) { live[id] = self.startAt(self.toCanvas(pt), act); },
      onMove: function (id, pts) {
        var s = live[id]; if (!s || s.tap || s.done) return;
        for (var i = 0; i < pts.length; i++) self.moveStroke(s, self.toCanvas(pts[i]));
      },
      onEnd: function (id, keep, tr) { var s = live[id]; delete live[id]; self.finish(s, keep || (!!tr && !!(s && s.tap))); },
      onGesture: function (phase, g) {
        if (phase === 'end' || !g.n) { g0 = null; return; }
        if (!g0 || g0.n !== g.n) g0 = { n: g.n, d: g.d || 0, cx: g.cx, cy: g.cy, z: self.zoom, px: self.panX, py: self.panY };
        if (g.n >= 2 && g0.d) self.setZoom(g0.z * g.d / g0.d, g0.px + (g.cx - g0.cx), g0.py + (g.cy - g0.cy));
        else if (g.n === 1 && self.zoom > 1) self.setZoom(self.zoom, g0.px + (g.cx - g0.cx), g0.py + (g.cy - g0.cy));
      }
    });
  };

  Studio.prototype.bindPlain = function (stage) {
    var self = this, pointers = new Map(), stroke = null, gesture = null, lastPen = 0;
    var local = function (e) { var r = stage.getBoundingClientRect(), z = r.width / (stage.offsetWidth || 1); return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z, p: e.pointerType === 'pen' ? Math.max(.05, e.pressure || .5) : .7 }; };
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'pen') lastPen = Date.now();
      if (e.pointerType === 'mouse' && Date.now() - lastPen < 1500) return;
      if (e.button > 0 && e.pointerType === 'mouse') return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
      if (pointers.size === 2) {
        if (stroke) { self.finish(stroke, false); stroke = null; }
        var ps = Array.from(pointers.values());
        gesture = { d: Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y), cx: (ps[0].x + ps[1].x) / 2, cy: (ps[0].y + ps[1].y) / 2, z: self.zoom, px: self.panX, py: self.panY };
        return;
      }
      if (pointers.size > 2) return;
      stroke = self.startAt(self.toCanvas(local(e)), (e.buttons & 32) ? 'era' : null);
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
      if (!stroke || stroke.tap || stroke.done) return;
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      if (!evs.length) evs = [e];
      for (var i = 0; i < evs.length; i++) self.moveStroke(stroke, self.toCanvas(local(evs[i])));
    });
    var end = function (e, keep) {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (gesture) { if (pointers.size < 2) gesture = null; return; }
      self.finish(stroke, keep); stroke = null;
    };
    stage.addEventListener('pointerup', function (e) { end(e, true); });
    stage.addEventListener('pointercancel', function (e) { end(e, false); });
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

  Studio.prototype.glBegin = function (p, tool) {
    var S = this.S, mask = this.lock && tool !== 'eraser' ? this.region(p.x, p.y) : null;
    S.setMask(mask); S.keepPre();
    var grade = tool === 'graphite' ? ({ '#b8b8bd': .35, '#9a9aa0': .5, '#77777e': .62, '#55555c': .74, '#3a3a40': .84, '#26262b': .92 }[this.color.toLowerCase()] || .7) : null;
    var st = S.stroke(tool, tool === 'graphite' ? '#2b2b30' : this.color, this.radius(tool), { mask: !!mask, grade: grade, load: tool === 'wash' ? .55 + .4 * this.size : 1 });
    var s = { gl: st, tool: tool, color: this.color, r: st.r, last: p, ctrl: null, dist: 0 };
    S.dab(st, p, p); this.kick();
    return s;
  };

  Studio.prototype.beginStroke = function (p, override) {
    if (this.glm && this.S) return this.glBegin(p, override || this.tool);
    var live = this.$('.gcol-live'), lc = ctx2(live);
    lc.clearRect(0, 0, this.W, this.H);
    var tool = override || this.tool;
    var s = { tool: tool, color: this.color, r: this.radius(tool), last: p, ctrl: null, mask: this.region(p.x, p.y), box: null, dist: 0 };
    live.style.opacity = { wash: .85, marker: .92 }[s.tool] || 1;
    live.style.mixBlendMode = s.tool === 'eraser' ? 'normal' : 'multiply';
    if (s.tool === 'eraser' || s.tool === 'blend') { s.snap = this.snapshot(0, 0, this.W, this.H); live.style.opacity = 0; }
    this.dab(s, p, p);
    return s;
  };

  Studio.prototype.moveStroke = function (s, p) {
    var c = s.ctrl || s.last;
    if (Math.hypot(p.x - c.x, p.y - c.y) < Math.max(.6, s.r * .06)) return;
    if (!s.ctrl) { s.ctrl = p; return; }
    var m = { x: (c.x + p.x) / 2, y: (c.y + p.y) / 2, p: (c.p + p.p) / 2, tz: ((c.tz || 0) + (p.tz || 0)) / 2 };
    this.curve(s, s.last, c, m);
    s.last = m; s.ctrl = p;
  };

  Studio.prototype.curve = function (s, a, c, b) {
    var len = Math.hypot(c.x - a.x, c.y - a.y) + Math.hypot(b.x - c.x, b.y - c.y);
    var n = Math.max(1, Math.ceil(len / Math.max(1.5, s.r * .5))), prev = a;
    for (var i = 1; i <= n; i++) {
      var t = i / n, u = 1 - t;
      var q = { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y, p: u * a.p + t * b.p, tz: u * (a.tz || 0) + t * (b.tz || 0) };
      this.dab(s, prev, q); prev = q;
    }
    s.dist += len;
  };

  Studio.prototype.smudge = function (s, a, b) {
    var r = Math.max(3, s.r * (.7 + .5 * b.p)), d = Math.ceil(r * 2), pc = ctx2(this.$('.gcol-paint'));
    var steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (r * .3)));
    var px = a.x, py = a.y;
    for (var i = 1; i <= steps; i++) {
      var t = i / steps, nx = a.x + (b.x - a.x) * t, ny = a.y + (b.y - a.y) * t;
      var tmp = canvas(d, d), tc = ctx2(tmp);
      tc.drawImage(this.$('.gcol-paint'), Math.round(px - r), Math.round(py - r), d, d, 0, 0, d, d);
      tc.globalCompositeOperation = 'destination-in';
      var g = tc.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      tc.fillStyle = g; tc.fillRect(0, 0, d, d);
      if (s.mask) tc.drawImage(s.mask.c, s.mask.x - Math.round(nx - r), s.mask.y - Math.round(ny - r));
      pc.drawImage(tmp, Math.round(nx - r), Math.round(ny - r));
      px = nx; py = ny;
    }
    var x0 = Math.max(0, Math.floor(Math.min(a.x, b.x) - r - 2)), y0 = Math.max(0, Math.floor(Math.min(a.y, b.y) - r - 2));
    var x1 = Math.min(this.W, Math.ceil(Math.max(a.x, b.x) + r + 2)), y1 = Math.min(this.H, Math.ceil(Math.max(a.y, b.y) + r + 2));
    s.box = s.box ? { x0: Math.min(s.box.x0, x0), y0: Math.min(s.box.y0, y0), x1: Math.max(s.box.x1, x1), y1: Math.max(s.box.y1, y1) } : { x0: x0, y0: y0, x1: x1, y1: y1 };
  };

  Studio.prototype.dab = function (s, a, b) {
    if (s.gl) { this.S.dab(s.gl, a, b); this.kick(); return; }
    if (s.tool === 'blend') return this.smudge(s, a, b);
    var r = s.r, tool = s.tool, pr = b.p;
    if (tool === 'pencil') r = s.r * (.55 + .6 * pr);
    if (tool === 'wash') r = s.r * (.7 + .5 * pr);
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
    if (tool === 'wash') {
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
    if (this.glm && this.S && this.S.fbPre) { this.S.restore(this.S.snapPre([0, 0, this.W, this.H])); this.kick(); return; }
    var lc = ctx2(this.$('.gcol-live'));
    lc.clearRect(0, 0, this.W, this.H);
  };

  Studio.prototype.endStroke = function (s) {
    if (s.ctrl) { this.dab(s, s.last, s.ctrl); s.last = s.ctrl; s.ctrl = null; }
    if (s.gl) {
      var b = s.gl.box; this.S.useMask = 0;
      if (b) { var r = this.S.clip([b[0] - 4, b[1] - 4, b[2] + 8, b[3] + 8], this.W, this.H); if (r) this.pushGL(r, this.S.snapPre(r)); }
      if (this.recent == null || this.recent[0] !== this.color) this.addRecent(this.color);
      this.kick(); return;
    }
    if (!s.box) return;
    var b = s.box, pad = 6, x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad), x1 = Math.min(this.W, b.x1 + pad), y1 = Math.min(this.H, b.y1 + pad);
    var w = x1 - x0, h = y1 - y0;
    if (s.tool === 'eraser' || s.tool === 'blend') {
      var pc = ctx2(this.$('.gcol-paint')), after = pc.getImageData(x0, y0, w, h);
      pc.putImageData(s.snap.data, 0, 0);
      var before = pc.getImageData(x0, y0, w, h);
      pc.putImageData(after, x0, y0);
      this.push({ x: x0, y: y0, before: before, after: after });
      return;
    }
    var live = this.$('.gcol-live'), layer = canvas(w, h), lc = ctx2(layer);
    lc.drawImage(live, x0, y0, w, h, 0, 0, w, h);
    if (s.tool === 'wash') this.watercolor(lc, w, h, x0, y0, s.mask);
    this.commit(layer, x0, y0, { wash: .85, marker: .92 }[s.tool] || 1, 'multiply');
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

  Studio.prototype.fillAt = function (x, y, medium) {
    var L = this.regions.at(x, y);
    if (!L) return;
    if (this.glm && this.S) {
      var m = this.regions.mask(L), S = this.S, rect = S.clip([m.x - 2, this.H - m.y - m.h - 2, m.w + 4, m.h + 4], this.W, this.H);
      var before = S.snap(rect);
      if (medium === 'wash') S.wash(m, this.color, .9);
      else S.fill(m, GardenPaintGL.hexToRgb(this.color), this.shade ? 1 : 0, 1);
      this.pushGL(rect, before);
      if (this.recent == null || this.recent[0] !== this.color) this.addRecent(this.color);
      this.kick(); return;
    }
    var m = this.regions.mask(L), tool = this.tool, w = m.w, h = m.h;
    var layer = canvas(w, h), lc = ctx2(layer), tex = textures();
    medium = medium || 'flat';
    lc.fillStyle = this.color; lc.fillRect(0, 0, w, h);
    lc.globalCompositeOperation = 'destination-in';
    if (medium === 'pencil' || medium === 'crayon') {
      var lvl = medium === 'pencil' ? tex.grain[2] : tex.wax[1];
      var p = lc.createPattern(lvl, 'repeat'); if (p.setTransform) p.setTransform(new DOMMatrix().translate(-m.x, -m.y).scale(medium === 'crayon' ? 1.6 : 1));
      lc.fillStyle = p; lc.fillRect(0, 0, w, h);
    }
    lc.drawImage(m.c, 0, 0);
    lc.globalCompositeOperation = 'source-over';
    if (medium === 'wash') {
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
    if (medium === 'flat') {
      if (this.shade) this.shadeLayer(lc, m, this.color);
      this.commit(layer, m.x, m.y, 1, 'source-over'); return;
    }
    var alpha = medium === 'wash' ? .92 : medium === 'crayon' ? .95 : .9;
    this.commit(layer, m.x, m.y, alpha, 'multiply');
  };

  function mix(hex, to, k) {
    var a = hexRgb(hex), b = to === '#fff' ? [255, 255, 255] : [12, 10, 20];
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')';
  }

  Studio.prototype.shadeLayer = function (lc, m, color) {
    var w = m.w, h = m.h, b = this.regions.boxes[this.regions.at(m.x + w / 2, m.y + h / 2)] || null;
    var g = lc.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, mix(color, '#fff', .3)); g.addColorStop(.42, color); g.addColorStop(1, mix(color, '#000', .28));
    lc.globalCompositeOperation = 'source-atop'; lc.fillStyle = g; lc.fillRect(0, 0, w, h);
    if (FILTER_OK) {
      var ring = canvas(w, h), rc = ctx2(ring), blur = Math.max(2, Math.min(w, h) / 9, this.W / 300);
      rc.drawImage(m.c, 0, 0); rc.globalCompositeOperation = 'destination-out';
      rc.filter = 'blur(' + blur + 'px)'; rc.drawImage(m.c, 0, 0); rc.filter = 'none';
      rc.globalCompositeOperation = 'source-in'; rc.fillStyle = mix(color, '#000', .45); rc.fillRect(0, 0, w, h);
      lc.globalAlpha = .45; lc.drawImage(ring, 0, 0); lc.globalAlpha = 1;
      var hi = canvas(w, h), hc = ctx2(hi), rg = hc.createRadialGradient(w * .3, h * .28, 0, w * .3, h * .28, Math.max(w, h) * .45);
      rg.addColorStop(0, 'rgba(255,255,255,.28)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      hc.fillStyle = rg; hc.fillRect(0, 0, w, h); hc.globalCompositeOperation = 'destination-in'; hc.drawImage(m.c, 0, 0);
      lc.drawImage(hi, 0, 0);
    }
    lc.globalCompositeOperation = 'source-over';
  };

  Studio.prototype.refPixels = function () {
    if (this._refPx) return Promise.resolve(this._refPx);
    var self = this, src = this.$('.gcol-ref').getAttribute('src');
    if (!src) return Promise.resolve(null);
    return new Promise(function (res) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () {
        var c = canvas(self.W, self.H), x = ctx2(c); x.fillStyle = '#fff'; x.fillRect(0, 0, self.W, self.H);
        x.drawImage(im, 0, 0, self.W, self.H);
        try { self._refPx = x.getImageData(0, 0, self.W, self.H).data; } catch (e) { self._refPx = null; }
        res(self._refPx);
      };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  };

  Studio.prototype.pickAt = function (x, y) {
    var self = this;
    var L = this.regions.at(x, y), b = L ? this.regions.boxes[L] : null;
    return this.refPixels().then(function (d) {
      var hex;
      if (d) {
        var r = 0, g = 0, bl = 0, n = 0, R = Math.max(2, Math.round(self.W / 300));
        for (var yy = Math.max(0, (y | 0) - R); yy <= Math.min(self.H - 1, (y | 0) + R); yy++)
          for (var xx = Math.max(0, (x | 0) - R); xx <= Math.min(self.W - 1, (x | 0) + R); xx++) {
            if (L && self.regions.lab[yy * self.W + xx] !== L) continue;
            var j = (yy * self.W + xx) * 4; if (d[j] + d[j + 1] + d[j + 2] < 90) continue;
            r += d[j]; g += d[j + 1]; bl += d[j + 2]; n++;
          }
        if (n) hex = '#' + ((1 << 24) | (Math.round(r / n) << 16) | (Math.round(g / n) << 8) | Math.round(bl / n)).toString(16).slice(1);
      }
      if (!hex) {
        var p = ctx2(self.$('.gcol-paint')).getImageData(x | 0, y | 0, 1, 1).data;
        if (p[3] > 10) hex = '#' + ((1 << 24) | (p[0] << 16) | (p[1] << 8) | p[2]).toString(16).slice(1);
      }
      if (hex) { self.setColor(hex); self.addRecent(hex); }
      return hex;
    });
  };

  Studio.prototype.addRecent = function (hex) {
    this.recent = (this.recent || []).filter(function (c) { return c !== hex; });
    this.recent.unshift(hex); this.recent = this.recent.slice(0, 10);
    var row = this.$('.gcol-recent'), self = this;
    row.textContent = '';
    this.recent.forEach(function (c) {
      var b = el('button', 'gcol-c gcol-c--sm'); b.type = 'button'; b.style.setProperty('--c', c); b.dataset.c = c;
      b.setAttribute('aria-label', T('لونٌ استعملتَه ', 'Recent color ') + c); b.title = c;
      b.addEventListener('click', function () { self.setColor(c); });
      row.appendChild(b);
    });
    this.setColor(this.color);
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
    if (this.recent == null || this.recent[0] !== this.color) this.addRecent(this.color);
    if (this.opts.onChange) this.opts.onChange(this);
  };

  Studio.prototype.pushGL = function (rect, before) {
    var self = this;
    this.redo.forEach(function (u) { if (u.gl) { self.S.drop(u.before); if (u.after) self.S.drop(u.after); } }); this.redo = [];
    this.undo.push({ gl: 1, rect: rect, before: before, after: null, px: rect[2] * rect[3] });
    this.undoBytes += rect[2] * rect[3] * 16;
    while (this.undo.length > 1 && (this.undo.length > 40 || this.undoBytes > 400e6)) {
      var o = this.undo.shift(); this.undoBytes -= (o.px || 0) * 16; if (o.gl) { this.S.drop(o.before); if (o.after) this.S.drop(o.after); }
    }
    this.syncUndo();
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
    if (u.gl) {
      if (dir < 0) { if (!u.after) u.after = this.S.snap(u.rect); this.S.clearWet(u.rect); this.S.restore(u.before); }
      else this.S.restore(u.after);
      to.push(u); this.syncUndo(); this.kick(); return;
    }
    ctx2(this.$('.gcol-paint')).putImageData(dir < 0 ? u.before : u.after, u.x, u.y);
    to.push(u); this.syncUndo();
  };
  Studio.prototype.syncUndo = function () {
    this.$('.gcol-undo').disabled = !this.undo.length;
    this.$('.gcol-redo').disabled = !this.redo.length;
  };

  Studio.prototype.clear = function () {
    if (this.glm && this.S) { var r = [0, 0, this.W, this.H], b = this.S.snap(r); this.S.clear(); this.pushGL(r, b); this.kick(); return; }
    var pc = ctx2(this.$('.gcol-paint')), before = pc.getImageData(0, 0, this.W, this.H);
    pc.clearRect(0, 0, this.W, this.H);
    this.push({ x: 0, y: 0, before: before, after: pc.getImageData(0, 0, this.W, this.H) });
  };

  Studio.prototype.toBlob = function (opts) {
    opts = opts || {};
    var self = this, out = canvas(this.W, this.H), oc = ctx2(out);
    if (this.glm && this.S) {
      var px = this.S.read(), id = oc.createImageData(this.W, this.H), row = this.W * 4;
      for (var y = 0; y < this.H; y++) id.data.set(px.subarray((this.H - 1 - y) * row, (this.H - y) * row), y * row);
      oc.putImageData(id, 0, 0); oc.globalCompositeOperation = 'multiply'; oc.drawImage(this.$('.gcol-line'), 0, 0); oc.globalCompositeOperation = 'source-over';
      return new Promise(function (res) { out.toBlob(res, 'image/png'); });
    }
    if (!opts.transparent) oc.drawImage(this.$('.gcol-paper'), 0, 0);
    if (!opts.transparent) oc.globalCompositeOperation = 'multiply';
    oc.drawImage(this.$('.gcol-paint'), 0, 0);
    oc.globalCompositeOperation = 'multiply';
    oc.drawImage(this.$('.gcol-line'), 0, 0);
    oc.globalCompositeOperation = 'source-over';
    return new Promise(function (res) { out.toBlob(res, 'image/png'); });
  };

  Studio.prototype.painted = function () {
    var d = ctx2(this.$('.gcol-paint')).getImageData(0, 0, this.W, this.H).data, n = 0;
    for (var i = 3; i < d.length; i += 16) if (d[i] > 8) n++;
    return n * 4;
  };

  Studio.prototype.destroy = function () {
    document.removeEventListener('garden:lang', this._onLang);
    if (this.router) this.router.destroy();
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this.S) { this.S.destroy(); this.S = null; }
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
