;(function () {
  'use strict';
  var D = document, R = D.documentElement;
  var AR = '٠١٢٣٤٥٦٧٨٩', DAY = 864e5;
  var mounted = false, host = null, parts = null, hostMo = null, rootMo = null, tick = 0, weave = null, road = null;
  var EMBLEM = '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.6"><path d="M24 30c0-5 .5-9 0-14" stroke-width="2"/><path d="M24 15c-4-4-9-3.6-12 .5M24 15c-3.6-5.6-8.4-7-12.4-6.4M24 15c-.8-5-2-8-4.4-11M24 15c.8-5 2-8 4.4-11M24 15c3.6-5.6 8.4-7 12.4-6.4M24 15c4-4 9-3.6 12 .5"/><path d="M8 44C17 41 29 35 39 27" stroke-width="2"/><path d="M40 44C31 41 19 35 9 27" stroke-width="2"/><path d="M6.5 41.5l3.6 4M41.5 41.5l-3.6 4"/></g></svg>';
  var RIDGE = [[1000, 74], [975, 72], [930, 69], [905, 64], [890, 65], [840, 60], [800, 57], [788, 51], [730, 49], [670, 46], [657, 40], [590, 38], [530, 35], [518, 29], [450, 27], [390, 25], [378, 19], [300, 17], [230, 15], [218, 11], [150, 10], [92, 8], [64, 7], [60, 30], [57, 52], [53, 79]];

  function en() { return R.getAttribute('lang') === 'en'; }
  function n(v, e) { var s = String(v); return e ? s : s.replace(/\d/g, function (d) { return AR.charAt(+d); }); }
  function make(tag, cls, html) { var e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function tx(ar, eng) { return '<span data-ar="' + ar + '" data-en="' + eng + '">' + (en() ? eng : ar) + '</span>'; }
  function relabel(scope) {
    var e = en();
    Array.prototype.forEach.call(scope.querySelectorAll('[data-ar]'), function (x) { x.textContent = x.getAttribute(e ? 'data-en' : 'data-ar'); });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-ar-label]'), function (x) { x.setAttribute('aria-label', x.getAttribute(e ? 'data-en-label' : 'data-ar-label')); });
  }
  function today() { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); }
  function isFest() { var d = new Date(), m = d.getMonth() + 1, x = d.getDate(); return (m === 2 && x === 22) || (m === 9 && x === 23); }
  function fest() { if (isFest()) R.setAttribute('data-sd-fest', '1'); else R.removeAttribute('data-sd-fest'); }
  function arDays(v) { return v === 1 ? 'يوماً واحداً' : v === 2 ? 'يومين' : (v >= 3 && v <= 10 ? n(v) + ' أيام' : n(v) + ' يوماً'); }
  function until(v, e) {
    if (v === 0) return e ? 'today' : 'اليوم';
    if (v === 1) return e ? 'tomorrow' : 'غداً';
    return e ? 'in ' + v + ' days' : 'بعد ' + arDays(v);
  }
  function nextOcc(T, m, d) {
    var y = new Date().getFullYear(), c = Date.UTC(y, m - 1, d);
    if (c < T) c = Date.UTC(y + 1, m - 1, d);
    return Math.round((c - T) / DAY);
  }

  function paintRoad() {
    if (!road) return;
    var e = en(), T = today(), S = Date.UTC(2016, 3, 25), E = Date.UTC(2030, 0, 1);
    var left = Math.max(0, Math.round((E - T) / DAY));
    var p = Math.min(1, Math.max(0, (T - S) / (E - S)));
    var X = function (t) { return 980 - (t - S) / (E - S) * 916; };
    var x = 980 - p * 916, y = 40, k, a, c;
    for (k = 0; k < RIDGE.length - 1; k++) {
      a = RIDGE[k]; c = RIDGE[k + 1];
      if (x <= a[0] && x >= c[0] && a[0] !== c[0]) { y = a[1] + (c[1] - a[1]) * (a[0] - x) / (a[0] - c[0]); break; }
    }
    var line = 'M' + RIDGE.map(function (q) { return q[0] + ' ' + q[1]; }).join(' L');
    var area = line + ' L53 80 L1000 80Z';
    var pct = Math.round(p * 100), yr = new Date().getFullYear();
    var ticks = '';
    [2016, 2018, 2020, 2022, 2024, 2026, 2028, 2030].forEach(function (yy) {
      var tx0 = X(yy === 2016 ? S : Date.UTC(yy, 0, 1));
      ticks += '<span style="inset-inline-start:' + ((1000 - tx0) / 10).toFixed(2) + '%">' + n(yy, e) + '</span>';
    });
    var noun = e ? (left === 1 ? 'day to 2030' : 'days to 2030') : (left >= 3 && left <= 10 ? 'أيام حتى ٢٠٣٠' : 'يوماً حتى ٢٠٣٠');
    var f = nextOcc(T, 2, 22), nd = nextOcc(T, 9, 23);
    road.innerHTML =
      '<div class="sd-count"><span class="sd-lab">' + EMBLEM + (e ? 'Saudi Vision 2030' : 'رؤية المملكة ٢٠٣٠') + '</span>' +
      '<span class="sd-num"><b>' + n(left, e) + '</b><small>' + noun + '</small></span>' +
      '<span class="sd-sub">' + (e ? pct + '% of the road walked since the Vision launched in 2016' : 'مضى ' + n(pct) + '٪ من الطريق منذ إطلاق الرؤية عام ٢٠١٦') + '</span></div>' +
      '<div class="sd-ruler" aria-hidden="true"><svg viewBox="0 0 1000 80" preserveAspectRatio="none">' +
      '<defs><clipPath id="sd-past"><rect x="' + x.toFixed(1) + '" y="-10" width="' + (1010 - x).toFixed(1) + '" height="100"/></clipPath></defs>' +
      '<path class="sd-ghost" vector-effect="non-scaling-stroke" d="' + line + '"/>' +
      '<g clip-path="url(#sd-past)" class="sd-fadein"><path class="sd-fill" d="' + area + '"/><path class="sd-done" vector-effect="non-scaling-stroke" d="' + line + '"/></g></svg>' +
      '<span class="sd-edge" style="inset-inline-start:93.6%">' + (e ? 'The 2030 edge' : 'حافّةُ ٢٠٣٠') + '</span>' +
      '<div class="sd-today" style="inset-inline-start:' + ((1000 - x) / 10).toFixed(2) + '%;top:' + (26 + y / 80 * 62 - 20).toFixed(1) + 'px"><span class="sd-flag">' + (e ? 'You are here · ' + yr : 'أنت هنا · ' + n(yr)) + '</span><span class="sd-pin"></span></div>' +
      '<div class="sd-ticks">' + ticks + '</div></div>' +
      '<div class="sd-occ"><span class="sd-occ-h">' + (e ? 'Two days this skin dresses up' : 'مناسبتان يتزيّن فيهما الجلد') + '</span>' +
      '<div><b>' + (e ? 'Founding Day' : 'يوم التأسيس') + '</b> ' + (e ? '22 Feb' : '٢٢ فبراير') + ' · <span class="sd-next">' + until(f, e) + '</span></div>' +
      '<div><b>' + (e ? 'National Day' : 'اليوم الوطنيّ') + '</b> ' + (e ? '23 Sep' : '٢٣ سبتمبر') + ' · <span class="sd-next">' + until(nd, e) + '</span></div></div>';
    road.setAttribute('aria-label', e ? 'The road to 2030' : 'الطريق إلى ٢٠٣٠');
  }

  function makeWeave(cv, src) {
    var ctx = cv.getContext('2d');
    if (!ctx) return null;
    var img = new Image(), M = [], settled = null, sctx = null, W = 0, H = 0, dpr = 1, b = 0, th = 0, ptr = 0, raf = 0, t0 = 0, phase = 0, glints = [], day = false, C = null;
    var vis = true, dead = false, tm = 0, ro = null, io = null, rz = 0, ready = false;
    var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduce = !!(mq && mq.matches);
    var instant = reduce || !!navigator.webdriver || /HeadlessChrome/.test(navigator.userAgent);
    try { if (sessionStorage.getItem('sd-weft') === '1') instant = true; } catch (e) {}
    var DUR = 3.4, GROW = .42;
    var nc = D.createElement('canvas'); nc.width = nc.height = 1;
    var nx = nc.getContext('2d', { willReadFrequently: true });
    function norm(v) {
      nx.clearRect(0, 0, 1, 1); nx.fillStyle = '#000'; nx.fillStyle = v; nx.fillRect(0, 0, 1, 1);
      var q = nx.getImageData(0, 0, 1, 1).data;
      return 'rgb(' + q[0] + ',' + q[1] + ',' + q[2] + ')';
    }
    function colors() {
      var probe = D.createElement('i'), out = [];
      probe.style.display = 'none';
      cv.parentNode.appendChild(probe);
      ['--sd-weft-a', '--sd-weft-b', '--sd-weft-c'].forEach(function (k) { probe.style.color = 'var(' + k + ')'; out.push(norm(getComputedStyle(probe).color)); });
      probe.parentNode.removeChild(probe);
      return out;
    }
    function rnd(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function sm(a, c, x) { x = Math.min(1, Math.max(0, (x - a) / (c - a))); return x * x * (3 - 2 * x); }
    function build() {
      if (!img.naturalWidth) return false;
      var r = cv.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height);
      if (W < 60 || H < 60) return false;
      day = R.getAttribute('data-theme') === 'light';
      C = colors();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var IW = img.naturalWidth, IH = img.naturalHeight, kx = IW / 1011, ky = IH / 1198;
      var ch = 650 * ky, cw = ch * W / H;
      if (cw > IW * .98) { cw = IW * .98; ch = cw * H / W; }
      var x0 = Math.max(0, Math.min(IW - cw, 505 * kx - cw / 2)), y0 = Math.max(0, Math.min(IH - ch, 515 * ky - ch / 2));
      b = W < 460 ? 5.3 : 7.4; th = b * .866;
      var cols = Math.ceil(W / (b / 2)) + 1, rows = Math.ceil(H / th) + 1;
      var oc = D.createElement('canvas'); oc.width = cols; oc.height = rows;
      var o = oc.getContext('2d', { willReadFrequently: true }); o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high';
      o.drawImage(img, x0, y0, cw, ch, 0, 0, cols, rows);
      var d = o.getImageData(0, 0, cols, rows).data, N = cols * rows, L = new Float32Array(N), B = new Float32Array(N), T = new Float32Array(N), mk = new Float32Array(N), fw = new Float32Array(N);
      var i, j, k, rr = rnd(1442), p1 = rr() * 6, p2 = rr() * 6, p3 = rr() * 6, inMask = [];
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
        k = j * cols + i; L[k] = (.299 * d[k * 4] + .587 * d[k * 4 + 1] + .114 * d[k * 4 + 2]) / 255;
        var ux = (x0 + (i + .5) / cols * cw) / kx, uy = (y0 + (j + .5) / rows * ch) / ky;
        var dh = Math.hypot((ux - 498) / 185, (uy - 408) / 228), dt = Math.hypot((ux - 505) / 370, (uy - 740) / 250);
        var fx = Math.abs((i + .5) / cols * 2 - 1), fy = (j + .5) / rows;
        var m = Math.max(1 - sm(.68, 1.12, dh), (1 - sm(.5, 1.05, dt)) * .88) * (1 - sm(.62, .97, fy)) * (1 - sm(.78, .99, fx));
        var nz = .5 + .22 * Math.sin(ux * .023 + p1) * Math.sin(uy * .019 + p2) + .18 * Math.sin((ux - uy) * .013 + p3) + .1 * Math.sin(ux * .061 + uy * .047);
        mk[k] = m * 1.25 + (nz - .5) * .7 + (rr() - .5) * .38 - .36;
        fw[k] = 1 - sm(.35, 1.25, dh);
        if (m > .6) inMask.push(L[k]);
      }
      inMask.sort(function (a, c) { return a - c; });
      var lo = inMask[Math.floor(inMask.length * .03)] || 0, hi = inMask[Math.floor(inMask.length * .97)] || 1;
      var rad = 3, acc, cnt;
      for (j = 0; j < rows; j++) { acc = 0; cnt = 0; for (i = -rad; i < cols + rad; i++) { if (i + rad < cols) { acc += L[j * cols + i + rad]; cnt++; } if (i - rad - 1 >= 0) { acc -= L[j * cols + i - rad - 1]; cnt--; } if (i >= 0 && i < cols) T[j * cols + i] = acc / cnt; } }
      for (i = 0; i < cols; i++) { acc = 0; cnt = 0; for (j = -rad; j < rows + rad; j++) { if (j + rad < rows) { acc += T[(j + rad) * cols + i]; cnt++; } if (j - rad - 1 >= 0) { acc -= T[(j - rad - 1) * cols + i]; cnt--; } if (j >= 0 && j < rows) B[j * cols + i] = acc / cnt; } }
      M = []; var rt = rnd(77);
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
        k = j * cols + i; if (mk[k] <= 0) continue;
        var ln = Math.min(1, Math.max(0, (L[k] - lo) / (hi - lo))), bn = Math.min(1, Math.max(0, (B[k] - lo) / (hi - lo)));
        var v0 = Math.min(1, Math.max(0, ln + (ln - bn) * 1.5));
        var v = day ? Math.pow(1 - v0, 1.35) : Math.pow(v0, 1.12);
        var fade = Math.min(1, mk[k] * 2.4);
        var s = Math.sqrt(v) * (.55 + .45 * fade) * (day ? 1 : .62 + .38 * fw[k]);
        if (s < .16) continue;
        var up = (i + j) % 2 === 0, px = i * b / 2, py = j * th + th / 2, cy = up ? py + th / 6 : py - th / 6;
        var al = day ? (.6 + .4 * fw[k]) * (.5 + .5 * fade) : (.38 + .62 * fw[k]) * (.45 + .55 * fade);
        var tt = (1 - j / rows) * .84 + (1 - i / cols) * .1 + rt() * .06;
        M.push({ x: px, y: cy, up: up, s: Math.min(.94, s), a: al, c: v > .72 && fw[k] > .3 ? 1 : 0, t: tt * DUR, g: fw[k] });
      }
      M.sort(function (a, c) { return a.t - c.t; });
      settled = D.createElement('canvas'); settled.width = cv.width; settled.height = cv.height;
      sctx = settled.getContext('2d'); sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ptr = 0; glints = []; phase = 0;
      return true;
    }
    function tri(c, m, k) {
      var h = th * m.s * k, hb = b * m.s * k / 2;
      if (m.up) { c.moveTo(m.x - hb, m.y + h / 3); c.lineTo(m.x, m.y - 2 * h / 3); c.lineTo(m.x + hb, m.y + h / 3); }
      else { c.moveTo(m.x - hb, m.y - h / 3); c.lineTo(m.x + hb, m.y - h / 3); c.lineTo(m.x, m.y + 2 * h / 3); }
      c.closePath();
    }
    function paint(c, list, k) {
      var buckets = {}, q, key;
      for (q = 0; q < list.length; q++) { var m = list[q]; key = m.c * 10 + Math.min(7, Math.max(1, Math.round(m.a * 7))); (buckets[key] || (buckets[key] = [])).push(m); }
      for (key in buckets) { var arr = buckets[key]; c.globalAlpha = (key % 10) / 7; c.fillStyle = C[Math.floor(key / 10)]; c.beginPath(); for (q = 0; q < arr.length; q++) tri(c, arr[q], k); c.fill(); }
      c.globalAlpha = 1;
    }
    function finishAll() { if (ptr < M.length) { paint(sctx, M.slice(ptr), 1); ptr = M.length; } phase = 1; }
    function still() { ctx.clearRect(0, 0, W, H); ctx.drawImage(settled, 0, 0, W, H); }
    function draw(el) {
      ctx.clearRect(0, 0, W, H);
      if (phase === 0) {
        var e = ptr; while (e < M.length && M[e].t + GROW <= el) e++;
        if (e > ptr) { paint(sctx, M.slice(ptr, e), 1); ptr = e; }
        ctx.drawImage(settled, 0, 0, W, H);
        var g = ptr, shuttle = null;
        while (g < M.length && M[g].t <= el) {
          var m = M[g], p = (el - m.t) / GROW, ez = 1 - Math.pow(1 - p, 3);
          ctx.globalAlpha = m.a * Math.min(1, p * 1.6); ctx.fillStyle = p < .35 ? C[2] : C[m.c]; ctx.beginPath(); tri(ctx, m, ez * (1 + .35 * (1 - p))); ctx.fill(); shuttle = m; g++;
        }
        ctx.globalAlpha = 1;
        if (shuttle) { var gr = ctx.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, C[2]); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.globalAlpha = .4; ctx.fillRect(0, shuttle.y - .5, W, 1); ctx.globalAlpha = 1; }
        if (ptr >= M.length) phase = 1;
      } else {
        ctx.drawImage(settled, 0, 0, W, H);
        var tries = 0;
        while (glints.length < 14 && tries++ < 60) { var cand = M[(Math.random() * M.length) | 0]; if (cand && cand.s > .45 && cand.g > .15) glints.push({ m: cand, s: el + Math.random() * 1.5, d: 1.1 + Math.random() * 1.2 }); }
        for (var q = glints.length - 1; q >= 0; q--) {
          var G = glints[q], pp = (el - G.s) / G.d;
          if (pp > 1) { glints.splice(q, 1); continue; }
          if (pp < 0) continue;
          var w = Math.sin(Math.PI * pp); ctx.globalAlpha = w * .95; ctx.fillStyle = C[2]; ctx.beginPath(); tri(ctx, G.m, 1 + .4 * w); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
    function loop(now) {
      raf = 0;
      if (dead || !vis || D.hidden) return;
      if (!t0) t0 = now;
      var el = (now - t0) / 1000;
      draw(el);
      if (phase === 0) raf = requestAnimationFrame(loop);
      else tm = setTimeout(function () { tm = 0; if (!dead && !raf) raf = requestAnimationFrame(loop); }, 50);
    }
    function kick() { if (!raf && !tm && !dead && ready && !reduce && vis && !D.hidden) raf = requestAnimationFrame(loop); }
    function halt() { if (raf) cancelAnimationFrame(raf); raf = 0; if (tm) clearTimeout(tm); tm = 0; }
    function settle() { halt(); if (!build()) { ready = false; return; } ready = true; finishAll(); still(); kick(); }
    function start() {
      if (dead) return;
      if (!build()) return;
      ready = true;
      if (instant) { finishAll(); still(); }
      else { try { sessionStorage.setItem('sd-weft', '1'); } catch (e) {} instant = true; t0 = 0; }
      kick();
    }
    function onVis() { if (D.hidden) { halt(); if (ready && phase === 0) { finishAll(); still(); } } else kick(); }
    function onMq() { reduce = !!(mq && mq.matches); if (reduce) { halt(); if (ready) { finishAll(); still(); } } else kick(); }
    D.addEventListener('visibilitychange', onVis);
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq); }
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (es) {
        vis = es[es.length - 1].isIntersecting;
        if (!vis) { halt(); if (ready && phase === 0) { finishAll(); still(); } } else kick();
      });
      io.observe(cv);
    }
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(function () {
        var r = cv.getBoundingClientRect();
        if (Math.round(r.width) === W && Math.round(r.height) === H && ready) return;
        clearTimeout(rz);
        rz = setTimeout(function () {
          if (dead) return;
          var q = cv.getBoundingClientRect();
          if (!ready) start();
          else if (Math.round(q.width) !== W || Math.round(q.height) !== H) settle();
        }, 220);
      });
      ro.observe(cv);
    }
    img.decoding = 'async';
    img.onload = function () { if (!dead) requestAnimationFrame(start); };
    img.src = src;
    return {
      recolor: function () { if (!dead && ready) settle(); },
      destroy: function () {
        dead = true; halt(); clearTimeout(rz);
        D.removeEventListener('visibilitychange', onVis);
        if (mq) { if (mq.removeEventListener) mq.removeEventListener('change', onMq); else if (mq.removeListener) mq.removeListener(onMq); }
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        img.onload = null; M = []; settled = null; sctx = null;
      }
    };
  }

  function sheetBase() {
    var l = D.querySelector('link[data-garden-skin="skins/saudi"]');
    return l && l.href ? l.href.replace(/saudi\.css(\?[^#]*)?(#.*)?$/, '') : '';
  }

  function buildParts() {
    var P = {};
    P.vista = make('div', 'sd-vista',
      '<span class="sd-cr" data-ar="صورةٌ مرسومةٌ نقطيّاً لسموّ وليّ العهد عن عدسة المصوّر الملكيّ بندر الجلعود" data-en="A woven dot rendering of HRH the Crown Prince after a photo by royal photographer Bandar Aljaloud"></span>' +
      '<div class="sd-frame" aria-hidden="true"></div>' +
      '<svg class="sd-niche" viewBox="0 0 560 600" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="M0 600 V24 L10 24 L20 10 L30 24 L44 24 L54 10 L64 24 L78 24 L88 10 L98 24 L462 24 L472 10 L482 24 L496 24 L506 10 L516 24 L530 24 L540 10 L550 24 L560 24 V600"/></svg>' +
      '<canvas class="sd-weft" role="img" data-ar-label="صورةٌ نقطيّةٌ منسوجة لسموّ وليّ العهد الأمير محمد بن سلمان" data-en-label="A woven dot portrait of HRH Crown Prince Mohammed bin Salman"></canvas>' +
      '<figure class="sd-plate"><div class="sd-thumb" role="img" data-ar-label="جرفُ جبل طويق" data-en-label="The cliffs of Mount Tuwaiq"></div><div>' +
      '<blockquote data-ar="«همّةُ السعوديّين مثلُ جبل طويق»" data-en="“The determination of Saudis is like Mount Tuwaiq”"></blockquote>' +
      '<figcaption><b data-ar="سموّ وليّ العهد" data-en="HRH the Crown Prince"></b> <span data-ar="الأمير محمد بن سلمان" data-en="Mohammed bin Salman"></span></figcaption></div></figure>');
    P.quote = make('figure', 'sd-quote',
      '<span class="sd-quote-bar" aria-hidden="true"></span><div>' +
      '<blockquote data-ar="«همّةُ السعوديّين مثلُ جبل طويق»" data-en="“The determination of Saudis is like Mount Tuwaiq”"></blockquote>' +
      '<figcaption>— <b data-ar="سموّ وليّ العهد" data-en="HRH the Crown Prince"></b> <span data-ar="الأمير محمد بن سلمان" data-en="Mohammed bin Salman"></span></figcaption></div>');
    P.sky = make('div', 'sd-sky'); P.sky.setAttribute('aria-hidden', 'true');
    P.road = make('div', 'sd-road'); P.road.setAttribute('role', 'group');
    P.sec = make('div', 'sd-sec', '<span data-ar="يومُك" data-en="Your day"></span>');
    P.sec.setAttribute('role', 'heading'); P.sec.setAttribute('aria-level', '2');
    P.foot = make('div', 'sd-foot', EMBLEM + '<div>' +
      '<div class="sd-fest-t">' + tx('في يوم التأسيس (٢٢ فبراير) واليوم الوطنيّ (٢٣ سبتمبر) يتزيّن هذا الجلدُ وحدَه بالرايات الخضراء.', 'On Founding Day (22 Feb) and National Day (23 Sep) this skin dresses itself in green pennants.') + '</div>' +
      '<div><b data-ar="البورتريه:" data-en="Portrait:"></b> ' + tx('صورةٌ مرسومةٌ نقطيّاً لسموّ وليّ العهد عن عدسة المصوّر الملكيّ بندر الجلعود', 'a woven dot rendering of HRH the Crown Prince after a photo by royal photographer Bandar Aljaloud') +
      ' · <b data-ar="تصوير:" data-en="Photos:"></b> سيف الظاهر · Hala AlGhanim · Ameer Albahouth · Glenov Brankovic · SALEH · Unsplash</div></div>');
    P.garland = make('div', 'sd-garland'); P.garland.setAttribute('aria-hidden', 'true');
    return P;
  }

  function place() {
    if (!host || !parts) return;
    var xam = host.querySelector(':scope > #dash-exam-slot'), grid = host.querySelector(':scope > #widgets-grid');
    var before = function (node, ref) { if (node.parentNode === host && (ref ? node.nextSibling === ref : true)) return; if (ref && ref.parentNode === host) host.insertBefore(node, ref); else host.appendChild(node); };
    if (!parts.garland.isConnected) host.insertBefore(parts.garland, host.firstChild);
    if (!parts.sky.isConnected) before(parts.sky, xam || grid);
    if (!parts.vista.isConnected) before(parts.vista, xam || grid);
    if (!parts.quote.isConnected) before(parts.quote, xam || grid);
    if (!parts.road.isConnected) before(parts.road, grid);
    if (!parts.sec.isConnected) before(parts.sec, grid);
    if (!parts.foot.isConnected) host.appendChild(parts.foot);
  }

  function mountHome() {
    host = D.querySelector('section[data-view="overview"] > div');
    if (!host) return;
    parts = buildParts();
    road = parts.road;
    relabel(parts.vista); relabel(parts.quote); relabel(parts.sec); relabel(parts.foot);
    paintRoad();
    place();
    hostMo = new MutationObserver(function () {
      var k, miss = false;
      for (k in parts) if (!parts[k].isConnected) miss = true;
      if (miss) place();
    });
    hostMo.observe(host, { childList: true });
    var base = sheetBase(), cv = parts.vista.querySelector('canvas');
    if (base && cv) weave = makeWeave(cv, base + 'img/saudi/portrait.webp');
  }

  function onLang() {
    if (!parts) return;
    relabel(parts.vista); relabel(parts.quote); relabel(parts.sec); relabel(parts.foot);
    paintRoad();
  }
  function onRoot(list) {
    var th = false, lg = false;
    list.forEach(function (m) { if (m.attributeName === 'lang' || m.attributeName === 'dir') lg = true; else th = true; });
    if (lg) onLang();
    if (th && weave) weave.recolor();
  }
  function onTick() { fest(); paintRoad(); }

  function mount() {
    if (mounted) return;
    mounted = true;
    fest();
    try { mountHome(); } catch (e) {}
    D.addEventListener('garden:languageChanged', onLang);
    try {
      rootMo = new MutationObserver(onRoot);
      rootMo.observe(R, { attributes: true, attributeFilter: ['data-theme', 'data-mod-theme', 'lang', 'dir'] });
    } catch (e) {}
    tick = setInterval(onTick, 3600000);
  }
  function unmount() {
    if (!mounted) return;
    mounted = false;
    clearInterval(tick); tick = 0;
    D.removeEventListener('garden:languageChanged', onLang);
    if (rootMo) rootMo.disconnect(); rootMo = null;
    if (hostMo) hostMo.disconnect(); hostMo = null;
    if (weave) weave.destroy(); weave = null;
    if (parts) { for (var k in parts) { var p = parts[k]; if (p.parentNode) p.parentNode.removeChild(p); } }
    parts = null; road = null; host = null;
    R.removeAttribute('data-sd-fest');
  }
  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.saudi = { mount: mount, unmount: unmount };
})();
