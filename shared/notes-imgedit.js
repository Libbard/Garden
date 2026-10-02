/*@3.NOIJ5.1*/
;(function () {
  'use strict';

  var PREV = 1100, FULL = 3200;

  function isAr() {
    return (document.documentElement.lang || localStorage.getItem('garden_lang') || 'ar') === 'ar';
  }
  function L(a, b) { return isAr() ? a : b; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var RATIOS = [
    ['free', 'حرّ', 'Free', 0],
    ['orig', 'كالأصل', 'Original', -1],
    ['1:1', '١:١', '1:1', 1],
    ['4:3', '٤:٣', '4:3', 4 / 3],
    ['3:4', '٣:٤', '3:4', 3 / 4],
    ['16:9', '١٦:٩', '16:9', 16 / 9]
  ];
  var SLIDERS = [
    ['br', 'السطوع', 'Brightness', 40, 160],
    ['ct', 'التباين', 'Contrast', 40, 180],
    ['sa', 'تشبّعُ الألوان', 'Saturation', 0, 200]
  ];

  function blank() {
    return { rot: 0, fh: 0, fv: 0, cr: [0, 0, 1, 1], ar: 'free', br: 100, ct: 100, sa: 100, en: 0 };
  }
  function norm(ie) {
    var p = blank();
    if (!ie) return p;
    p.rot = [0, 90, 180, 270].indexOf(ie.rot) >= 0 ? ie.rot : 0;
    p.fh = ie.fh ? 1 : 0; p.fv = ie.fv ? 1 : 0;
    if (Array.isArray(ie.cr) && ie.cr.length === 4) {
      var c = ie.cr.map(Number);
      if (c.every(isFinite) && c[2] > 0.01 && c[3] > 0.01) {
        p.cr = [clamp(c[0], 0, 1), clamp(c[1], 0, 1), 0, 0];
        p.cr[2] = clamp(c[2], 0.01, 1 - p.cr[0]); p.cr[3] = clamp(c[3], 0.01, 1 - p.cr[1]);
      }
    }
    if (RATIOS.some(function (r) { return r[0] === ie.ar; })) p.ar = ie.ar;
    p.br = clamp(Number(ie.br) || 100, 40, 160);
    p.ct = clamp(Number(ie.ct) || 100, 40, 180);
    p.sa = ie.sa == null ? 100 : clamp(Number(ie.sa), 0, 200);
    p.en = ie.en ? 1 : 0;
    return p;
  }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function idle(p) {
    return !p.rot && !p.fh && !p.fv && p.cr[0] === 0 && p.cr[1] === 0 && p.cr[2] === 1 && p.cr[3] === 1 &&
      p.br === 100 && p.ct === 100 && p.sa === 100 && !p.en;
  }

  /*@3.NOIJ5.2*/
  function load(src) {
    return Promise.resolve(src).then(function (u) {
      if (!u) throw new Error('no_src');
      return new Promise(function (ok, no) {
        var im = new Image();
        if (/^https?:/i.test(u)) { im.crossOrigin = 'anonymous'; im.referrerPolicy = 'no-referrer'; }
        im.onload = function () { ok(im); };
        im.onerror = function () { no(new Error('load')); };
        im.src = u;
      });
    }).then(function (im) {
      var t = document.createElement('canvas');
      t.width = 2; t.height = 2;
      var g = t.getContext('2d');
      g.drawImage(im, 0, 0, 2, 2);
      try { g.getImageData(0, 0, 1, 1); } catch (e) { throw new Error('tainted'); }
      return im;
    });
  }

  function scaled(im, side) {
    var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
    var k = Math.min(1, side / Math.max(w, h, 1));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(im, 0, 0, c.width, c.height);
    return c;
  }
  function orient(src, p) {
    var q = p.rot % 180 !== 0;
    var c = document.createElement('canvas');
    c.width = q ? src.height : src.width; c.height = q ? src.width : src.height;
    var g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.translate(c.width / 2, c.height / 2);
    g.rotate(p.rot * Math.PI / 180);
    g.scale(p.fh ? -1 : 1, p.fv ? -1 : 1);
    g.drawImage(src, -src.width / 2, -src.height / 2);
    return c;
  }
  /*@3.NOIJ5.3*/
  function levels(src) {
    var d = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
    var hist = new Uint32Array(256), n = 0, i;
    for (i = 0; i < d.length; i += 16) {
      hist[(d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8]++; n++;
    }
    var lo = 0, hi = 255, acc = 0;
    for (i = 0; i < 256; i++) { acc += hist[i]; if (acc >= n * 0.01) { lo = i; break; } }
    acc = 0;
    for (i = 255; i >= 0; i--) { acc += hist[i]; if (acc >= n * 0.03) { hi = i; break; } }
    if (hi - lo < 40) return null;
    return [lo, hi];
  }
  function adjust(c, p, lv) {
    if (p.br === 100 && p.ct === 100 && p.sa === 100 && !(p.en && lv)) return;
    var g = c.getContext('2d');
    var img = g.getImageData(0, 0, c.width, c.height), d = img.data;
    var lut = new Uint8ClampedArray(256), i, v;
    var ct = p.ct / 100 * (p.en && lv ? 1.08 : 1), br = p.br / 100;
    for (i = 0; i < 256; i++) {
      v = i;
      if (p.en && lv) v = (v - lv[0]) * 255 / (lv[1] - lv[0]);
      v = v * br;
      v = (v - 128) * ct + 128;
      lut[i] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
    var sa = p.sa / 100 * (p.en && lv ? 1.06 : 1), doS = Math.abs(sa - 1) > 0.001;
    for (i = 0; i < d.length; i += 4) {
      var r = lut[d[i]], gg = lut[d[i + 1]], b = lut[d[i + 2]];
      if (doS) {
        var l = r * 0.299 + gg * 0.587 + b * 0.114;
        r = l + (r - l) * sa; gg = l + (gg - l) * sa; b = l + (b - l) * sa;
      }
      d[i] = r; d[i + 1] = gg; d[i + 2] = b;
    }
    g.putImageData(img, 0, 0);
  }
  function hasAlpha(c) {
    var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (var i = 3; i < d.length; i += 4 * 7) if (d[i] < 250) return true;
    return false;
  }
  function blobOf(c, png) {
    return new Promise(function (ok) {
      if (png) { c.toBlob(function (b) { ok(b); }, 'image/png'); return; }
      c.toBlob(function (b) {
        if (b && b.type === 'image/webp') { ok(b); return; }
        c.toBlob(function (j) { ok(j); }, 'image/jpeg', 0.92);
      }, 'image/webp', 0.92);
    });
  }

  function Ed(o) {
    this.o = o;
    this.p = norm(o.ie);
    this.p0 = JSON.parse(JSON.stringify(this.p));
    this.mount();
  }

  Ed.prototype.mount = function () {
    var self = this;
    var d = document.createElement('dialog');
    d.className = 'gsf nie';
    d.setAttribute('data-keep-open', '1');
    d.setAttribute('aria-labelledby', 'nie-t');
    var chips = RATIOS.map(function (r) {
      return '<button type="button" class="gsf-chip" data-ie="ar" data-v="' + r[0] + '" aria-pressed="false">' +
        '<span' + (/[0-9]/.test(r[2]) ? ' dir="ltr"' : '') + '>' + esc(L(r[1], r[2])) + '</span></button>';
    }).join('');
    var sl = SLIDERS.map(function (s) {
      return '<label class="nie-sl"><span>' + esc(L(s[1], s[2])) + '</span>' +
        '<input type="range" min="' + s[3] + '" max="' + s[4] + '" step="1" data-ie="' + s[0] + '" aria-label="' + esc(L(s[1], s[2])) + '">' +
        '<output dir="ltr" data-out="' + s[0] + '"></output></label>';
    }).join('');
    function tb(a, icon, label) {
      return '<button type="button" class="gsf-btn gsf-btn--ghost nie-tb" data-ie="' + a + '" aria-label="' + esc(label) +
        '" data-tip="' + esc(label) + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i></button>';
    }
    d.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<div class="gsf-x"><button type="button" class="gsf-close" data-ie="close" aria-label="' + esc(L('أغلق', 'Close')) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
      '<div class="gsf-head"><h2 class="gsf-title" id="nie-t">' + esc(L('تعديلُ الصورة', 'Edit image')) + '</h2></div>' +
      '<div class="gsf-guard nie-guard" data-ie="guard" hidden><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<p>' + esc(L('عدّلتَ الصورةَ ولم تحفظ. أتتركها؟', 'You edited the image without saving. Leave anyway?')) + '</p>' +
        '<button type="button" class="gsf-btn gsf-btn--danger" data-ie="leave">' + esc(L('اتركْ', 'Leave')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-ie="stay">' + esc(L('ابقَ', 'Stay')) + '</button></div>' +
      '<div class="gsf-body nie-body">' +
        '<div class="nie-stage" dir="ltr"><div class="nie-wrap" data-ie="wrap">' +
          '<canvas class="nie-cv" data-ie="cv" aria-label="' + esc(L('معاينةُ الصورة', 'Image preview')) + '"></canvas>' +
          '<div class="nie-crop" data-ie="crop" hidden>' +
            '<i class="nie-h" data-h="nw"></i><i class="nie-h" data-h="ne"></i><i class="nie-h" data-h="sw"></i><i class="nie-h" data-h="se"></i>' +
          '</div></div>' +
          '<p class="nie-msg" data-ie="msg" role="status">' + esc(L('تُحمَّل الصورة…', 'Loading the image…')) + '</p>' +
        '</div>' +
        '<div class="nie-side">' +
          '<section class="gsf-card nie-card"><h3 class="gsf-card-h"><i class="fa-solid fa-crop-simple" aria-hidden="true"></i>' + esc(L('القصُّ والتدوير', 'Crop and rotate')) + '</h3>' +
            '<div class="gsf-chips nie-chips" role="group" aria-label="' + esc(L('نسبةُ القصّ', 'Crop ratio')) + '">' + chips + '</div>' +
            '<div class="nie-row">' +
              tb('rl', 'fa-rotate-left', L('دوِّرْ إلى اليسار', 'Rotate left')) +
              tb('rr', 'fa-rotate-right', L('دوِّرْ إلى اليمين', 'Rotate right')) +
              tb('fh', 'fa-left-right', L('اقلبْ أفقيّاً', 'Flip horizontally')) +
              tb('fv', 'fa-up-down', L('اقلبْ عموديّاً', 'Flip vertically')) +
            '</div></section>' +
          '<section class="gsf-card nie-card"><h3 class="gsf-card-h"><i class="fa-solid fa-sun" aria-hidden="true"></i>' + esc(L('الضوءُ والألوان', 'Light and colour')) + '</h3>' +
            '<button type="button" class="gsf-btn gsf-btn--ghost nie-en" data-ie="en" aria-pressed="false"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>' +
              esc(L('وضّحْ صورةَ السبّورة أو الورقة', 'Clean up a board or paper photo')) + '</span></button>' +
            sl + '</section>' +
          '<button type="button" class="gsf-btn gsf-btn--ghost nie-reset" data-ie="reset"><i class="fa-solid fa-arrow-rotate-left" aria-hidden="true"></i><span>' +
            esc(L('ألغِ كلَّ التعديلات', 'Undo all edits')) + '</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="gsf-foot nie-foot"><p class="nie-note">' +
        esc(L('الأصلُ محفوظ — تعود إليه متى شئت.', 'The original is kept — go back to it any time.')) + '</p>' +
        '<div class="gsf-acts">' +
          (this.o.onRestore ? '<button type="button" class="gsf-btn gsf-btn--ghost" data-ie="orig"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i><span>' + esc(L('الصورةُ الأصليّة', 'Original')) + '</span></button>' : '') +
          '<button type="button" class="gsf-btn gsf-btn--ghost" data-ie="close">' + esc(L('إلغاء', 'Cancel')) + '</button>' +
          '<button type="button" class="gsf-btn gsf-btn--go" data-ie="save" disabled>' + esc(L('احفظ', 'Save')) + '</button>' +
        '</div></div>';
    document.body.appendChild(d);
    this.d = d;
    this.cv = d.querySelector('[data-ie="cv"]');
    this.crop = d.querySelector('[data-ie="crop"]');
    this.wrap = d.querySelector('[data-ie="wrap"]');
    d.addEventListener('click', function (e) { self.click(e); });
    d.addEventListener('input', function (e) { self.input(e); });
    d.addEventListener('cancel', function (e) { e.preventDefault(); self.close(); });
    this.drag();
    this.sync();
    d.showModal();
    load(this.o.src).then(function (im) {
      if (!self.d) return;
      self.im = im;
      self.small = scaled(im, PREV);
      self.lv = levels(self.small);
      self.d.querySelector('[data-ie="msg"]').hidden = true;
      self.crop.hidden = false;
      self.paint();
    }, function (e) {
      if (!self.d) return;
      var m = self.d.querySelector('[data-ie="msg"]');
      m.classList.add('is-bad');
      m.textContent = (e && e.message === 'tainted')
        ? L('موقعُ هذه الصورة لا يسمح بتعديلها. نزّلْها إلى جهازك ثمّ أضفْها «من جهازي».',
            'This image’s site does not allow editing it. Save it to your device, then add it from “My device”.')
        : L('تعذّر تحميلُ الصورة.', 'Could not load the image.');
    });
  };

  Ed.prototype.sync = function () {
    var p = this.p, d = this.d;
    [].forEach.call(d.querySelectorAll('[data-ie="ar"]'), function (b) {
      var on = b.getAttribute('data-v') === p.ar;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    SLIDERS.forEach(function (s) {
      var i = d.querySelector('input[data-ie="' + s[0] + '"]');
      if (i && document.activeElement !== i) i.value = String(p[s[0]]);
      var o = d.querySelector('[data-out="' + s[0] + '"]');
      if (o) o.textContent = p[s[0]] + '%';
    });
    var en = d.querySelector('[data-ie="en"]');
    en.setAttribute('aria-pressed', p.en ? 'true' : 'false');
    en.classList.toggle('is-on', !!p.en);
    d.querySelector('[data-ie="save"]').disabled = !this.im || same(p, this.p0);
    d.querySelector('[data-ie="reset"]').disabled = idle(p);
  };

  /*@3.NOIJ5.4*/
  Ed.prototype.dims = function () {
    var q = this.p.rot % 180 !== 0, w = this.small.width, h = this.small.height;
    return q ? [h, w] : [w, h];
  };
  Ed.prototype.paint = function () {
    var self = this;
    if (this._raf) return;
    var run = function () {
      if (!self._raf) return;
      cancelAnimationFrame(self._raf);
      self._raf = 0;
      if (!self.small || !self.d) return;
      var o = orient(self.small, self.p);
      adjust(o, self.p, self.lv);
      self.cv.width = o.width; self.cv.height = o.height;
      self.cv.getContext('2d').drawImage(o, 0, 0);
      self.placeCrop();
    };
    this._raf = requestAnimationFrame(run);
    setTimeout(run, 80);
  };
  Ed.prototype.placeCrop = function () {
    var c = this.p.cr;
    var s = this.crop.style;
    s.insetInlineStart = (c[0] * 100) + '%'; s.insetBlockStart = (c[1] * 100) + '%';
    s.inlineSize = (c[2] * 100) + '%'; s.blockSize = (c[3] * 100) + '%';
  };

  Ed.prototype.ratio = function () {
    var r = RATIOS.filter(function (x) { return x[0] === this.p.ar; }, this)[0];
    if (!r || !r[3]) return 0;
    if (r[3] > 0) return r[3];
    var dm = this.dims();
    return dm[0] / dm[1];
  };
  Ed.prototype.fitRatio = function () {
    var R = this.ratio();
    if (!R) return;
    var dm = this.dims(), W = dm[0], H = dm[1], c = this.p.cr;
    var cx = c[0] + c[2] / 2, cy = c[1] + c[3] / 2;
    var w = c[2], h = (w * W) / (R * H);
    if (h > c[3] || h > 1) { h = Math.min(c[3], 1); w = (h * H * R) / W; }
    if (w > 1) { w = 1; h = (w * W) / (R * H); }
    var x = clamp(cx - w / 2, 0, 1 - w), y = clamp(cy - h / 2, 0, 1 - h);
    this.p.cr = [x, y, w, h];
  };
  Ed.prototype.turn = function (cw) {
    var c = this.p.cr;
    this.p.rot = (this.p.rot + (cw ? 90 : 270)) % 360;
    this.p.cr = cw ? [1 - (c[1] + c[3]), c[0], c[3], c[2]] : [c[1], 1 - (c[0] + c[2]), c[3], c[2]];
  };

  Ed.prototype.click = function (e) {
    var b = e.target.closest('[data-ie]');
    if (!b || b.disabled) return;
    var a = b.getAttribute('data-ie'), p = this.p;
    if (a === 'close') { this.close(); return; }
    if (a === 'leave') { this.close(true); return; }
    if (a === 'stay') { this.d.querySelector('[data-ie="guard"]').hidden = true; return; }
    if (a === 'save') { this.save(); return; }
    if (a === 'orig') { var rs = this.o.onRestore; this.close(true); if (rs) rs(); return; }
    if (!this.small) return;
    if (a === 'ar') { p.ar = b.getAttribute('data-v'); if (p.ar !== 'free') this.fitRatio(); }
    else if (a === 'rl' || a === 'rr') { this.turn(a === 'rr'); if (p.ar !== 'free') this.fitRatio(); }
    else if (a === 'fh') { p.fh = p.fh ? 0 : 1; p.cr = [1 - (p.cr[0] + p.cr[2]), p.cr[1], p.cr[2], p.cr[3]]; }
    else if (a === 'fv') { p.fv = p.fv ? 0 : 1; p.cr = [p.cr[0], 1 - (p.cr[1] + p.cr[3]), p.cr[2], p.cr[3]]; }
    else if (a === 'en') p.en = p.en ? 0 : 1;
    else if (a === 'reset') this.p = blank();
    else return;
    this.sync();
    this.paint();
  };
  Ed.prototype.input = function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-ie');
    if (!k || !SLIDERS.some(function (s) { return s[0] === k; })) return;
    this.p[k] = parseInt(e.target.value, 10) || 0;
    this.sync();
    this.paint();
  };

  Ed.prototype.drag = function () {
    var self = this, D = null, MIN = 0.04;
    this.wrap.addEventListener('pointerdown', function (e) {
      if (!self.small || e.button > 0) return;
      var h = e.target.getAttribute && e.target.getAttribute('data-h');
      var inBox = e.target === self.crop || !!h;
      var r = self.cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      D = { id: e.pointerId, r: r, h: h || (inBox ? 'move' : 'new'), x: px, y: py, c: self.p.cr.slice() };
      if (D.h === 'new') { self.p.cr = [clamp(px, 0, 1), clamp(py, 0, 1), 0, 0]; D.c = self.p.cr.slice(); D.h = 'se'; D.fresh = 1; }
      try { self.wrap.setPointerCapture(e.pointerId); } catch (eC) {}
      e.preventDefault();
    });
    this.wrap.addEventListener('pointermove', function (e) {
      if (!D || e.pointerId !== D.id) return;
      var px = clamp((e.clientX - D.r.left) / D.r.width, 0, 1), py = clamp((e.clientY - D.r.top) / D.r.height, 0, 1);
      var dm = self.dims(), c = D.c.slice(), R = self.ratio(), W = dm[0], H = dm[1];
      if (D.h === 'move') {
        c[0] = clamp(D.c[0] + px - D.x, 0, 1 - c[2]);
        c[1] = clamp(D.c[1] + py - D.y, 0, 1 - c[3]);
      } else {
        var ax = D.h.indexOf('w') >= 0 ? D.c[0] + D.c[2] : D.c[0];
        var ay = D.h.indexOf('n') >= 0 ? D.c[1] + D.c[3] : D.c[1];
        if (D.fresh) { ax = D.c[0]; ay = D.c[1]; }
        var w = Math.abs(px - ax), h = Math.abs(py - ay);
        if (R) {
          var hR = (w * W) / (R * H);
          if (hR > h) h = hR; else w = (h * H * R) / W;
        }
        var sx = px < ax ? -1 : 1, sy = py < ay ? -1 : 1;
        if (sx < 0) w = Math.min(w, ax); else w = Math.min(w, 1 - ax);
        if (sy < 0) h = Math.min(h, ay); else h = Math.min(h, 1 - ay);
        if (R) { var h2 = (w * W) / (R * H); if (h2 > h) w = (h * H * R) / W; else h = h2; }
        w = Math.max(w, MIN); h = Math.max(h, MIN);
        c = [sx < 0 ? ax - w : ax, sy < 0 ? ay - h : ay, w, h];
        c[0] = clamp(c[0], 0, 1 - c[2]); c[1] = clamp(c[1], 0, 1 - c[3]);
      }
      self.p.cr = c;
      self.placeCrop();
    });
    var up = function (e) {
      if (!D || e.pointerId !== D.id) return;
      D = null;
      var c = self.p.cr;
      if (c[2] < MIN || c[3] < MIN) self.p.cr = [0, 0, 1, 1];
      self.p.cr = self.p.cr.map(function (v) { return Math.round(v * 10000) / 10000; });
      self.placeCrop();
      self.sync();
    };
    this.wrap.addEventListener('pointerup', up);
    this.wrap.addEventListener('pointercancel', up);
  };

  Ed.prototype.bake = function () {
    var p = this.p;
    var big = scaled(this.im, FULL);
    var o = orient(big, p);
    var x = Math.round(p.cr[0] * o.width), y = Math.round(p.cr[1] * o.height);
    var w = Math.max(1, Math.round(p.cr[2] * o.width)), h = Math.max(1, Math.round(p.cr[3] * o.height));
    w = Math.min(w, o.width - x); h = Math.min(h, o.height - y);
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(o, x, y, w, h, 0, 0, w, h);
    adjust(c, p, this.lv);
    return blobOf(c, hasAlpha(c));
  };

  Ed.prototype.save = function () {
    var self = this;
    if (!this.im || this.busy) return;
    if (same(this.p, this.p0)) { this.close(true); return; }
    this.busy = true;
    var sv = this.d.querySelector('[data-ie="save"]');
    sv.disabled = true;
    sv.textContent = L('يُحفظ…', 'Saving…');
    var p = JSON.parse(JSON.stringify(this.p));
    this.bake().then(function (blob) {
      if (!blob) throw new Error('encode');
      return self.o.onSave(blob, idle(p) ? null : p);
    }).then(function () {
      self.busy = false;
      self.close(true);
    }, function () {
      self.busy = false;
      sv.disabled = false;
      sv.textContent = L('احفظ', 'Save');
      var m = self.d.querySelector('[data-ie="msg"]');
      m.hidden = false; m.classList.add('is-bad');
      m.textContent = L('تعذّر حفظُ الصورة — حاولْ ثانيةً.', 'Could not save the image — try again.');
    });
  };

  Ed.prototype.close = function (force) {
    if (!this.d) return;
    if (!force && this.im && !same(this.p, this.p0)) {
      this.d.querySelector('[data-ie="guard"]').hidden = false;
      return;
    }
    var d = this.d;
    this.d = null;
    try { d.close(); } catch (e) {}
    if (d.parentNode) d.parentNode.removeChild(d);
  };

  window.GardenImgEdit = {
    open: function (o) { return new Ed(o || {}); },
    _norm: norm,
    _adjust: adjust,
    _orient: orient
  };
})();
