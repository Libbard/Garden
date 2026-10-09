;(function () {
  'use strict';
  var R = document.documentElement;
  var S = null;

  function isEn() { return R.getAttribute('lang') === 'en'; }
  function relabel(host) {
    if (!host) return;
    var en = isEn();
    Array.prototype.forEach.call(host.querySelectorAll('[data-ar]'), function (n) {
      var v = n.getAttribute(en ? 'data-en' : 'data-ar');
      if (v !== null) n.textContent = v;
    });
    var l = host.getAttribute(en ? 'data-en-label' : 'data-ar-label');
    if (l) host.setAttribute('aria-label', l);
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  }
  function tx(ar, en) { return '<span data-ar="' + ar + '" data-en="' + en + '">' + (isEn() ? en : ar) + '</span>'; }
  function overview() { return document.querySelector('section[data-view="overview"] > div'); }

  function termDepth() {
    var G = window.GardenData;
    if (!G || !G.termWindow) return null;
    try {
      var w = G.termWindow();
      if (!w || !w.ok) return null;
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(w.start || ''));
      if (!m) return null;
      var a = new Date(+m[1], +m[2] - 1, +m[3]), t = new Date();
      t.setHours(0, 0, 0, 0);
      var d = Math.round((t - a) / 86400000);
      if (d < 0 || d > w.days) return null;
      var wk = Math.min(w.weeks, Math.floor(d / 7) + 1);
      return { p: d / w.days, weeks: w.weeks, wk: wk, pct: Math.round(d / w.days * 100) };
    } catch (e) { return null; }
  }

  function buildDepth() {
    var host = overview();
    if (!host) return;
    var D = termDepth();
    var old = host.querySelector(':scope > .ab-depth');
    if (!D) { if (old) old.parentNode.removeChild(old); return; }
    var key = D.wk + '/' + D.weeks + '/' + D.pct;
    if (old && old.getAttribute('data-k') === key) return;
    var n = old || el('div', 'ab-depth');
    n.setAttribute('data-k', key);
    n.setAttribute('role', 'img');
    n.setAttribute('data-ar-label', 'عمق الفصل: الأسبوع ' + D.wk + ' من ' + D.weeks);
    n.setAttribute('data-en-label', 'Term depth: week ' + D.wk + ' of ' + D.weeks);
    n.style.setProperty('--ab-p', Math.max(0, Math.min(1, D.p)).toFixed(3));
    n.style.setProperty('--ab-wk', String(D.weeks));
    n.innerHTML =
      '<div class="ab-depth-top" aria-hidden="true"><b data-ar="الأسبوع ' + D.wk + ' من ' + D.weeks + '" data-en="Week ' + D.wk + ' of ' + D.weeks + '"></b>' +
        tx('عمق الفصل', 'Term depth') + '<i>' + D.pct + '%</i></div>' +
      '<div class="ab-depth-rule" aria-hidden="true"><i></i></div>' +
      '<span class="ab-depth-cap" aria-hidden="true" data-ar="السطح" data-en="Surface"></span>' +
      '<div class="ab-depth-track" aria-hidden="true"><i class="ab-depth-fill"></i><div class="ab-depth-mark"><b>' + D.pct + '%</b>' +
        '<span data-ar="الأسبوع ' + D.wk + '" data-en="Week ' + D.wk + '"></span></div></div>' +
      '<span class="ab-depth-cap" aria-hidden="true" data-ar="القاع" data-en="Floor"></span>';
    if (!old) {
      var g = host.querySelector(':scope > #widgets-grid');
      host.insertBefore(n, g || null);
    }
    relabel(n);
  }

  function buildCredit() {
    var host = overview();
    if (!host || host.querySelector(':scope > .ab-credit')) return;
    host.appendChild(el('p', 'ab-credit',
      '<span data-th="deep">' + tx('تصوير:', 'Photo:') + ' <b>Marcos Paulo Prado</b> · Unsplash</span>' +
      '<span data-th="shore">' + tx('تصوير:', 'Photo:') + ' <b>Trevor McKinnon</b> · Unsplash</span>' +
      '<span data-th="swarm">' + tx('القناديلُ البعيدة:', 'Distant jellyfish:') + ' <b>James Jeremy Beckers</b> · Unsplash</span>'));
  }

  function engine(report) {
    var cv = null, x = null, W = 0, H = 0, D = 1, parts = [], spr = null;
    var lx = 0, ly = 0, tx = 0, ty = 0, hx = 0, hy = 0, user = 0, light = false, rtl = true, rm = false, on = false;
    var raf = 0, last = 0, t0 = 0, sent = 0, col = null;
    var now = function () { return (typeof performance !== 'undefined' ? performance : Date).now(); };
    var rAF = typeof requestAnimationFrame === 'function' ? function (f) { return requestAnimationFrame(f); } : function (f) { return setTimeout(function () { f(now()); }, 33); };
    var cAF = typeof cancelAnimationFrame === 'function' ? function (h) { cancelAnimationFrame(h); } : function (h) { clearTimeout(h); };
    function mk(w, h) {
      if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(w, h);
      var c = document.createElement('canvas'); c.width = w; c.height = h; return c;
    }
    function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? c[3] : a) + ')'; }
    function radial(size, stops) {
      var c = mk(size, size), g = c.getContext('2d'), r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      for (var i = 0; i < stops.length; i++) r.addColorStop(stops[i][0], stops[i][1]);
      g.fillStyle = r; g.fillRect(0, 0, size, size);
      return c;
    }
    function sprites() {
      var b = col.beam, g = light ? col.glow : col.beam;
      spr = {
        dot: radial(16, [[0, light ? rgba(g, 1) : 'rgba(255,255,255,1)'], [.35, rgba(g, .9)], [1, rgba(g, 0)]]),
        pool: radial(256, [[0, rgba(b, light ? .5 : .22)], [.45, rgba(b, light ? .2 : .07)], [1, rgba(b, 0)]]),
        hole: radial(256, [[0, 'rgba(0,0,0,1)'], [.38, 'rgba(0,0,0,.65)'], [1, 'rgba(0,0,0,0)']]),
        cone: null
      };
      var c = mk(512, 240), q = c.getContext('2d'), m = 120;
      for (var k = 0; k < 5; k++) {
        var w0 = 2 + k * 1.5, w1 = 24 + k * 22, gr = q.createLinearGradient(0, 0, 512, 0);
        gr.addColorStop(0, rgba(b, 0));
        gr.addColorStop(.3, rgba(b, light ? .05 : .02));
        gr.addColorStop(.82, rgba(b, light ? .16 : .075));
        gr.addColorStop(1, rgba(b, 0));
        q.fillStyle = gr;
        q.beginPath(); q.moveTo(0, m - w0); q.lineTo(512, m - w1); q.lineTo(512, m + w1); q.lineTo(0, m + w0); q.closePath(); q.fill();
      }
      spr.cone = c;
    }
    function size(w, h, d) {
      W = w; H = h; D = d;
      if (cv) { cv.width = Math.max(1, Math.round(W * D)); cv.height = Math.max(1, Math.round(H * D)); }
      var n = W < 760 ? 50 : 100;
      if (parts.length !== n) {
        parts = [];
        for (var i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, z: .25 + Math.random() * .75, ph: Math.random() * 6.28, s: .4 + Math.random() * 1.1 });
      } else {
        for (var j = 0; j < n; j++) { if (parts[j].x > W) parts[j].x = Math.random() * W; if (parts[j].y > H) parts[j].y = Math.random() * H; }
      }
    }
    function draw(t, moving) {
      if (!x || !spr) return;
      x.setTransform(D, 0, 0, D, 0, 0);
      x.globalAlpha = 1;
      x.globalCompositeOperation = 'source-over';
      x.clearRect(0, 0, W, H);
      x.fillStyle = rgba(col.dark);
      x.fillRect(0, 0, W, H);
      var hr = W < 760 ? 360 : 560;
      x.globalCompositeOperation = 'destination-out';
      x.drawImage(spr.hole, lx - hr, ly - hr, hr * 2, hr * 2);
      x.globalCompositeOperation = light ? 'source-over' : 'lighter';
      var ox = rtl ? W * .07 : W * .93, oy = H + 60;
      var dx = lx - ox, dy = ly - oy, len = Math.sqrt(dx * dx + dy * dy) || 1;
      x.save();
      x.translate(ox, oy);
      x.rotate(Math.atan2(dy, dx));
      x.drawImage(spr.cone, 0, -240, len * 1.22, 480);
      x.restore();
      var pr = W < 760 ? 220 : 320;
      x.drawImage(spr.pool, lx - pr, ly - pr, pr * 2, pr * 2);
      var L2 = W < 760 ? 200 : 280, up = light ? -1 : 1;
      L2 *= L2;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (moving) {
          p.y += up * .32 * p.z * p.s;
          p.x += Math.sin(t * .6 + p.ph) * .24 * p.z;
          if (p.y > H + 4) { p.y = -4; p.x = Math.random() * W; }
          if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        }
        var ex = p.x - lx, ey = p.y - ly, dd = ex * ex + ey * ey, lit = dd < L2 ? 1 - dd / L2 : 0;
        var a = (light ? .12 + .25 * p.z : .08 + .22 * p.z) + lit * lit * .85, rad = (1 + p.z * 1.7) * (1 + lit * .8);
        x.globalAlpha = a > 1 ? 1 : a;
        x.drawImage(spr.dot, p.x - rad, p.y - rad, rad * 2, rad * 2);
      }
      x.globalAlpha = 1;
      x.globalCompositeOperation = 'source-over';
    }
    function aim(t) {
      if (!user || now() - user > 7000) {
        user = 0;
        tx = hx + Math.sin(t * .5) * 26;
        ty = hy + Math.cos(t * .37) * 16 - 10;
      }
    }
    function loop() {
      raf = 0;
      if (!on || rm) return;
      raf = rAF(loop);
      var n = now(), dt = n - last;
      if (dt < 33) return;
      last = n;
      var t = (n - t0) / 1000;
      aim(t);
      var k = 1 - Math.pow(.9, Math.min(4, dt / 16.7));
      lx += (tx - lx) * k;
      ly += (ty - ly) * k;
      draw(t, true);
      if (n - sent > 160) { sent = n; report({ lx: lx, ly: ly }); }
    }
    function still() {
      if (!user) { tx = hx; ty = hy; }
      lx = tx; ly = ty;
      draw(0, false);
      report({ lx: lx, ly: ly });
    }
    function start() { if (on && !rm && !raf) { last = 0; raf = rAF(loop); } }
    function stop() { if (raf) cAF(raf); raf = 0; }
    return {
      msg: function (m) {
        if (m.k === 'init') {
          cv = m.cv; x = cv.getContext('2d'); col = m.col; light = m.light; rtl = m.rtl; rm = m.rm; hx = m.hx; hy = m.hy;
          lx = tx = hx; ly = ty = hy; t0 = now();
          size(m.W, m.H, m.D); sprites();
          on = true;
          if (rm) still(); else start();
        } else if (m.k === 'size') { size(m.W, m.H, m.D); if (rm || !on) still(); }
        else if (m.k === 'theme') { col = m.col; light = m.light; rtl = m.rtl; sprites(); if (rm || !on) still(); }
        else if (m.k === 'ptr') { user = now(); tx = m.x; ty = m.y; if (rm) still(); }
        else if (m.k === 'home') { hx = m.x; hy = m.y; if (rm && !user) still(); }
        else if (m.k === 'run') { on = m.on; if (on) start(); else stop(); }
        else if (m.k === 'rm') { rm = m.on; if (rm) { stop(); still(); } else start(); }
        else if (m.k === 'stop') { on = false; stop(); }
      }
    };
  }

  var WORKER_SRC = 'var E=(' + engine.toString() + ')(function(r){postMessage(r);});onmessage=function(e){E.msg(e.data);};';

  function toRGBA(str, fb) {
    try {
      var c = document.createElement('canvas');
      c.width = c.height = 1;
      var q = c.getContext('2d');
      q.fillStyle = '#000';
      q.fillStyle = str;
      q.fillRect(0, 0, 1, 1);
      var d = q.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], +(d[3] / 255).toFixed(3)];
    } catch (e) { return fb; }
  }

  function Lamp() {
    var L = this;
    L.cv = el('canvas', 'ab-lamp');
    L.cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(L.cv);
    L.rm = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    L.lit = []; L.litAt = 0; L.lx = 0; L.ly = 0; L.visible = true; L.modal = false; L.homeRaf = 0;
    var self = function (r) { L.onReport(r); };
    var off = null;
    try {
      if (L.cv.transferControlToOffscreen && window.Worker && window.Blob && window.URL) {
        L.url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
        L.worker = new Worker(L.url);
        off = L.cv.transferControlToOffscreen();
        L.worker.onmessage = function (e) { self(e.data); };
        L.post = function (m, tr) { L.worker.postMessage(m, tr || []); };
      }
    } catch (e) { off = null; if (L.worker) { try { L.worker.terminate(); } catch (e2) {} } L.worker = null; }
    if (!off) {
      L.eng = engine(self);
      L.post = function (m) { L.eng.msg(m); };
    }
    var h = L.home();
    var m = L.state();
    m.k = 'init'; m.cv = off || L.cv; m.hx = h[0]; m.hy = h[1]; m.rm = L.rm.matches;
    L.post(m, off ? [off] : null);
    L.onMove = function (e) {
      if (e.pointerType === 'touch' && e.type === 'pointermove') return;
      L.post({ k: 'ptr', x: e.clientX, y: e.clientY });
    };
    L.onResize = function () { var s = L.state(); s.k = 'size'; L.post(s); L.cacheLit(); L.sendHome(); };
    L.onScroll = function () {
      if (L.homeRaf) return;
      L.homeRaf = requestAnimationFrame(function () { L.homeRaf = 0; L.sendHome(); });
    };
    L.onVis = function () { L.run(); };
    L.onRm = function () { L.post({ k: 'rm', on: L.rm.matches }); };
    window.addEventListener('pointermove', L.onMove, { passive: true });
    window.addEventListener('pointerdown', L.onMove, { passive: true });
    window.addEventListener('resize', L.onResize, { passive: true });
    window.addEventListener('scroll', L.onScroll, { passive: true });
    document.addEventListener('visibilitychange', L.onVis);
    if (L.rm.addEventListener) L.rm.addEventListener('change', L.onRm);
    if ('IntersectionObserver' in window) {
      L.io = new IntersectionObserver(function (es) { L.visible = es[es.length - 1].isIntersecting; L.run(); });
      L.io.observe(L.cv);
    }
    L.tick = setInterval(function () {
      var md = !!document.querySelector('dialog[open], .gsf[open]');
      if (md !== L.modal) { L.modal = md; L.run(); }
      L.sendHome();
      if (performance.now() - L.litAt > 2000) L.cacheLit();
    }, 700);
    L.cacheLit();
  }
  Lamp.prototype.state = function () {
    var cs = getComputedStyle(this.cv);
    return {
      W: window.innerWidth, H: window.innerHeight,
      D: Math.min(window.devicePixelRatio || 1, 1.5) * .75,
      col: { beam: toRGBA(cs.color, [170, 232, 255, 1]), dark: toRGBA(cs.outlineColor, [0, 3, 9, .6]), glow: toRGBA(cs.borderTopColor, [120, 236, 255, 1]) },
      light: R.getAttribute('data-theme') === 'light',
      rtl: R.getAttribute('dir') !== 'ltr'
    };
  };
  Lamp.prototype.home = function () {
    var o = document.querySelector('.dash-xam-num');
    if (o) {
      var r = o.getBoundingClientRect();
      if (r.width && r.bottom > 0 && r.top < window.innerHeight) return [r.left + r.width / 2, r.top + r.height / 2];
    }
    return [window.innerWidth * .5, window.innerHeight * .34];
  };
  Lamp.prototype.sendHome = function () { var h = this.home(); this.post({ k: 'home', x: h[0], y: h[1] }); };
  Lamp.prototype.run = function () { this.post({ k: 'run', on: !document.hidden && this.visible && !this.modal }); };
  Lamp.prototype.theme = function () { var s = this.state(); s.k = 'theme'; this.post(s); };
  Lamp.prototype.cacheLit = function () {
    var L = this, sy = window.scrollY, sx = window.scrollX;
    L.lit = Array.prototype.map.call(document.querySelectorAll('.dash-xam-num, .dash-course-card .dnx-head, .widget[data-widget="gpa"], .widget[data-widget="due"], .widget[data-widget="community"], .dash-level-card'), function (n) {
      var r = n.getBoundingClientRect();
      return { n: n, x: r.left + r.width / 2 + sx, y: r.top + r.height / 2 + sy, rad: Math.max(r.width, r.height) / 2, v: n.__abN === undefined ? -1 : n.__abN };
    });
    L.litAt = performance.now();
  };
  Lamp.prototype.onReport = function (r) {
    var L = this;
    if (!r || typeof r.lx !== 'number') return;
    L.lx = r.lx; L.ly = r.ly;
    var sy = window.scrollY, sx = window.scrollX, Rr = window.innerWidth < 760 ? 300 : 420;
    for (var i = 0; i < L.lit.length; i++) {
      var o = L.lit[i], dx = o.x - sx - L.lx, dy = o.y - sy - L.ly;
      var d = Math.max(0, Math.sqrt(dx * dx + dy * dy) - o.rad * .6);
      var v = Math.max(0, 1 - d / Rr);
      v = Math.round(v * v * 8) / 8;
      if (v !== o.v) { o.v = v; o.n.__abN = v; o.n.style.setProperty('--ab-n', String(v)); }
    }
  };
  Lamp.prototype.destroy = function () {
    var L = this;
    clearInterval(L.tick);
    if (L.homeRaf) cancelAnimationFrame(L.homeRaf);
    try { L.post({ k: 'stop' }); } catch (e) {}
    if (L.worker) { try { L.worker.terminate(); } catch (e) {} }
    if (L.url) { try { URL.revokeObjectURL(L.url); } catch (e) {} }
    window.removeEventListener('pointermove', L.onMove);
    window.removeEventListener('pointerdown', L.onMove);
    window.removeEventListener('resize', L.onResize);
    window.removeEventListener('scroll', L.onScroll);
    document.removeEventListener('visibilitychange', L.onVis);
    if (L.rm.removeEventListener) L.rm.removeEventListener('change', L.onRm);
    if (L.io) L.io.disconnect();
    L.lit.forEach(function (o) { try { o.n.style.removeProperty('--ab-n'); delete o.n.__abN; } catch (e) {} });
    if (L.cv.parentNode) L.cv.parentNode.removeChild(L.cv);
  };

  function wantLamp() {
    var b = document.body;
    return !!b && !b.hasAttribute('data-notes-app') && !R.hasAttribute('data-bg') && R.getAttribute('data-skin') === 'abyss';
  }
  function syncLamp() {
    if (!S) return;
    if (wantLamp()) {
      if (!S.lamp) S.lamp = new Lamp();
      else S.lamp.theme();
    } else if (S.lamp) {
      S.lamp.destroy();
      S.lamp = null;
    }
  }
  function refresh() {
    if (!S) return;
    buildDepth();
    buildCredit();
    var host = overview();
    if (host) { relabel(host.querySelector(':scope > .ab-depth')); relabel(host.querySelector(':scope > .ab-credit')); }
  }
  function onLang() {
    try { refresh(); if (S && S.lamp) S.lamp.theme(); } catch (e) {}
  }

  function mount() {
    if (S) return;
    S = { lamp: null, timer: 0, late: 0, mo: null };
    try { refresh(); } catch (e) {}
    try { syncLamp(); } catch (e) {}
    S.timer = setInterval(function () { try { refresh(); } catch (e) {} }, 30000);
    S.late = setTimeout(function () { try { refresh(); if (S && S.lamp) { S.lamp.cacheLit(); S.lamp.sendHome(); } } catch (e) {} }, 1500);
    if ('MutationObserver' in window) {
      S.mo = new MutationObserver(function () { try { syncLamp(); } catch (e) {} });
      S.mo.observe(R, { attributes: true, attributeFilter: ['data-bg', 'data-theme', 'data-mod-theme', 'dir', 'data-skin'] });
    }
    document.addEventListener('garden:languageChanged', onLang);
  }
  function unmount() {
    if (!S) return;
    clearInterval(S.timer);
    clearTimeout(S.late);
    if (S.mo) S.mo.disconnect();
    document.removeEventListener('garden:languageChanged', onLang);
    if (S.lamp) S.lamp.destroy();
    Array.prototype.forEach.call(document.querySelectorAll('.ab-depth, .ab-credit, canvas.ab-lamp'), function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    S = null;
  }

  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.abyss = { mount: mount, unmount: unmount };
})();
