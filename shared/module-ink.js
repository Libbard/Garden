;(function () {
  'use strict';

  var CARD = 804, MARGIN = 96, SHEET = CARD + 2 * MARGIN, VP_W = SHEET + 64;
  var STOP_SEL = '#flashcards, #quiz, #vault, .flashcard-section, .quiz-section, .vault-section';
  var LINE_SEL = 'p, li, td, th, h1, h2, h3, h4, pre, blockquote, figcaption, dt, dd, summary, .content-target';
  var SAVE_MS = 600;

  var me = document.currentScript;
  var src = (me && me.src) || '';
  var DIR = src.replace(/[^/]*$/, '');
  var VER = (src.split('?')[1] || '');

  function L(ar, en) { return document.documentElement.lang === 'en' ? en : ar; }

  function js(name, test) {
    if (test()) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = DIR + name + (VER ? '?' + VER : '');
      s.async = false;
      s.onload = function () { res(); };
      s.onerror = function () { rej(new Error(name)); };
      document.head.appendChild(s);
    });
  }
  function css(name) {
    var href = DIR + name + (VER ? '?' + VER : '');
    if (document.querySelector('link[data-mi="' + name + '"]')) return Promise.resolve();
    return new Promise(function (res) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-mi', name);
      l.onload = res; l.onerror = res;
      document.head.appendChild(l);
    });
  }
  var depsP = null;
  function deps() {
    if (depsP) return depsP;
    depsP = Promise.all([
      css('notes.css'), css('module-ink.css'), css('surface.css'),
      js('menu.js', function () { return !!window.GardenMenu; }),
      js('notes-ink-codec.js', function () { return !!window.GardenInkCodec; }),
      js('notes-input.js', function () { return !!window.GardenInkInput; }),
      js('notes-icons.js', function () { return !!window.GardenNotesIcons; }),
      js('notes-canvas.js', function () { return !!window.GardenCanvas; }),
      js('notes-dial.js', function () { return !!window.GardenNotesDial; }),
      js('notes-inkpanel.js', function () { return !!window.GardenInkPanel; }),
      js('notes-overlay.js', function () { return !!window.GardenNotesOverlay; })
    ]).catch(function (e) { depsP = null; throw e; });
    return depsP;
  }

  function pageKey() {
    var m = /(L\d+\/[^/]+\/[^/]+)\.html$/.exec(location.pathname);
    return m ? m[1] : location.pathname;
  }
  var LS = 'garden_mink:' + pageKey();

  function readStore() {
    try {
      var s = JSON.parse(localStorage.getItem(LS) || 'null');
      if (s && s.L) return s;
    } catch (e) {}
    return { v: 1, rw: SHEET, L: {} };
  }
  function writeStore(s) {
    try {
      if (!Object.keys(s.L).length && !(s.pend && Object.keys(s.pend).length)) localStorage.removeItem(LS);
      else localStorage.setItem(LS, JSON.stringify(s));
      return true;
    } catch (e) { return false; }
  }
  function hasInk() {
    try { var s = JSON.parse(localStorage.getItem(LS) || 'null'); return !!(s && s.L && Object.keys(s.L).length); }
    catch (e) { return false; }
  }

  var PAGE_ID = pageKey().replace(/\//g, '.');
  var PUSH_MS = 2500;
  function syncBase() { var e = window.GardenEndpoints; return (e && e.sync) || ''; }
  function vault() {
    var G = window.GardenSync;
    if (!G || !G.vaultId || !syncBase()) return Promise.resolve(null);
    try { return Promise.resolve(G.vaultId()).catch(function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }
  function hdrs(id, extra) {
    var G = window.GardenSync, h = Object.assign({}, extra || {});
    if (G && G.vaultHeaders) { try { return G.vaultHeaders(id, h); } catch (e) {} }
    return h;
  }
  function inkUrl(id) { return syncBase() + '/v1/mink/' + encodeURIComponent(id) + '/' + encodeURIComponent(PAGE_ID); }

  var pushT = 0, pushing = null;
  function schedulePush() { clearTimeout(pushT); pushT = setTimeout(push, PUSH_MS); }

  function push() {
    if (pushing) return pushing.then(schedulePush);
    var st = readStore(), pend = st.pend || {}, keys = Object.keys(pend);
    if (!keys.length) return Promise.resolve(false);
    pushing = vault().then(function (id) {
      if (!id) return false;
      var set = {}, del = {};
      keys.forEach(function (k) {
        if (pend[k] === 'del') del[k] = (st.dt && st.dt[k]) || Date.now();
        else if (st.L[k]) set[k] = { v: JSON.stringify({ ink: st.L[k].ink || '', shapes: st.L[k].shapes || [], ts: st.L[k].ts || null }), t: st.L[k].t || Date.now() };
      });
      return fetch(inkUrl(id), { method: 'POST', cache: 'no-store',
        headers: hdrs(id, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ set: set, del: del }) }).then(function (r) {
        if (!r.ok) return false;
        return r.json().then(function (j) {
          var now = readStore();
          now.pend = now.pend || {};
          keys.forEach(function (k) {
            var was = pend[k], cur = now.pend[k];
            var tWas = was === 'del' ? del[k] : (set[k] && set[k].t);
            var tNow = cur === 'del' ? (now.dt && now.dt[k]) : (now.L[k] && now.L[k].t);
            if (cur && tWas === tNow) { delete now.pend[k]; if (now.dt) delete now.dt[k]; }
          });
          writeStore(now);
          return (j.stale && j.stale.length) ? pull().then(function () { return true; }) : true;
        });
      });
    }).catch(function () { return false; }).then(function (v) { pushing = null; return v; });
    return pushing;
  }

  function pull() {
    return vault().then(function (id) {
      if (!id) return false;
      var st0 = readStore();
      return fetch(inkUrl(id) + '?since=' + (st0.syncT || 0), { cache: 'no-store', headers: hdrs(id) }).then(function (r) {
        if (!r.ok) return false;
        return r.json().then(function (j) {
          var st = readStore(), got = j.layers || {}, changed = [];
          st.pend = st.pend || {};
          Object.keys(got).forEach(function (k) {
            var it = got[k], local = st.L[k], lt = local ? (local.t || 0) : ((st.dt && st.dt[k]) || 0);
            if (!(it.t > lt)) return;
            if (st.pend[k] && lt >= it.t) return;
            if (it.v == null) delete st.L[k];
            else {
              var d = null;
              try { d = JSON.parse(it.v); } catch (e) { d = null; }
              if (!d) return;
              st.L[k] = { ink: d.ink || '', shapes: d.shapes || [], ts: d.ts || undefined, t: it.t };
              if (!st.L[k].ts) delete st.L[k].ts;
            }
            delete st.pend[k];
            changed.push(k);
          });
          if (j.t > (st.syncT || 0)) st.syncT = j.t;
          writeStore(st);
          return changed;
        });
      });
    }).catch(function () { return false; });
  }

  var scroller = {
    get scrollTop() { return window.scrollY; },
    set scrollTop(v) { window.scrollTo(window.scrollX, v); },
    get scrollLeft() { return window.scrollX; },
    set scrollLeft(v) { window.scrollTo(v, window.scrollY); },
    getBoundingClientRect: function () {
      var w = document.documentElement.clientWidth, h = window.innerHeight;
      return { top: 0, left: 0, right: w, bottom: h, width: w, height: h, x: 0, y: 0 };
    },
    scrollBy: function (o) { window.scrollBy({ left: o.left || 0, top: o.top || 0, behavior: 'instant' }); },
    addEventListener: function (t, f, o) { window.addEventListener(t, f, o); },
    removeEventListener: function (t, f, o) { window.removeEventListener(t, f, o); },
    classList: document.documentElement.classList
  };

  var S = {
    on: false, drawing: false, ov: null, main: null, lay: null, mem: {}, sig: {},
    store: null, dirty: {}, saveT: 0, busy: false, vp: null, opened: [], ro: null,
    reT: 0, btn: null, fab: null, seq: 0
  };

  function nid() { S.seq += 1; return 'm' + S.seq.toString(36) + Math.random().toString(36).slice(2, 5); }

  function depthOf(sec) {
    var t = sec.querySelector('.depth-tab.active[data-layer]');
    return t ? t.getAttribute('data-layer') : 'base';
  }

  function sections() {
    var out = [], kids = S.main.children, i;
    for (i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.matches(STOP_SEL)) break;
      if (el.tagName !== 'SECTION' || !el.id || !el.offsetHeight) continue;
      out.push(el);
    }
    return out;
  }

  function layout() {
    var secs = sections(), regs = [], i;
    var mr = S.main.getBoundingClientRect(), z = (S.main.offsetWidth && mr.width / S.main.offsetWidth) || 1;
    for (i = 0; i < secs.length; i++) {
      var sr = secs[i].getBoundingClientRect();
      var top = Math.round((sr.top - mr.top) / z * 8) / 8, bot = top + Math.round(sr.height / z * 8) / 8;
      regs.push({ el: secs[i], top: top, bot: bot, key: secs[i].id + '|' + depthOf(secs[i]) });
    }
    for (i = 0; i < regs.length; i++) {
      regs[i].start = i ? Math.round((regs[i - 1].bot + regs[i].top) / 2) : 0;
      regs[i].end = (i < regs.length - 1) ? Math.round((regs[i].bot + regs[i + 1].top) / 2) : regs[i].bot + 40;
    }
    var stop = S.main.querySelector(STOP_SEL);
    if (stop && regs.length) {
      var last = regs[regs.length - 1];
      var st = (stop.getBoundingClientRect().top - mr.top) / z - 4;
      if (st > last.bot && st < last.end) last.end = Math.round(st);
    }
    return regs;
  }

  var MCODE = { flash: 'f', full: 'u', deep: 'd', base: 'b' };
  function mcode(k) { var m = k.split('|')[1] || ''; return MCODE[m] || (m.charAt(0) || 'z'); }
  function bridgeKey(lay, a, b) {
    var c = '', i;
    for (i = a; i <= b; i++) c += mcode(lay[i].key);
    return 'x-' + (b - a + 1) + '-' + lay[a].el.id + '|' + c;
  }
  function bridgeAt(lay, key) {
    var m = /^x-(\d+)-(.+)\|([a-z]+)$/.exec(key);
    if (!m) return -1;
    var n = +m[1], i;
    for (i = 0; i < lay.length; i++) {
      if (lay[i].el.id !== m[2]) continue;
      if (i + n - 1 >= lay.length || bridgeKey(lay, i, i + n - 1) !== key) return -1;
      return i;
    }
    return -1;
  }
  function liveBridges(lay) {
    var out = [], seen = {}, k;
    var add = function (key) {
      if (seen[key] || key.indexOf('x-') !== 0) return;
      seen[key] = 1;
      var i = bridgeAt(lay, key);
      if (i >= 0) out.push({ key: key, top: lay[i].top, i: i });
    };
    if (S.store) for (k in S.store.L) if (Object.prototype.hasOwnProperty.call(S.store.L, k)) add(k);
    for (k in S.mem) if (Object.prototype.hasOwnProperty.call(S.mem, k) && S.mem[k] && S.mem[k].length) add(k);
    return out;
  }

  function regionOf(lay, y) {
    for (var r = 0; r < lay.length; r++) if (y < lay[r].end || r === lay.length - 1) return r;
    return lay.length - 1;
  }

  function sheetH() {
    var r = S.lay || layout();
    return r.length ? r[r.length - 1].end : 400;
  }

  function anchorY(el) {
    if (el.ty === 'st') return (el.pts && el.pts.length) ? el.pts[0].y : 0;
    if (el.y1 != null) return Math.min(el.y1, el.y2 == null ? el.y1 : el.y2);
    if (el.y != null) return el.y;
    return 0;
  }

  function shifted(el, dy) {
    var c = JSON.parse(JSON.stringify(el));
    window.GardenCanvas.eachPoint(c, function (x, y) { return [x, y + dy]; });
    c._bb = null;
    return c;
  }

  function sigOf(list) {
    var s = JSON.stringify(list.map(function (e) {
      var c = {}, k;
      for (k in e) if (k !== 'id' && k !== '_bb' && Object.prototype.hasOwnProperty.call(e, k)) c[k] = e[k];
      return c;
    }));
    var h = 2166136261, i;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36) + ':' + s.length;
  }

  function split() {
    if (!S.ov || !S.ov.cv || !S.lay) return;
    var els = S.ov.cv.els || [], by = {}, i, lay = S.lay, G = window.GardenCanvas;
    for (i = 0; i < lay.length; i++) by[lay[i].key] = [];
    (S.vis || []).forEach(function (b) { by[b.key] = []; });
    for (i = 0; i < els.length; i++) {
      var a = regionOf(lay, anchorY(els[i])), lo = a, hi = a;
      var bb = G.bboxOf ? G.bboxOf(els[i]) : null;
      if (bb) {
        lo = regionOf(lay, bb.y); hi = regionOf(lay, bb.y + bb.h);
        while (hi > lo && bb.y + bb.h < lay[hi].top + 8) hi--;
        while (lo < hi && bb.y > lay[lo].bot - 8) lo++;
        if (lo === hi) lo = hi = Math.max(lo, Math.min(hi, a));
      }
      if (lo === hi) { by[lay[lo].key].push(shifted(els[i], -lay[lo].top)); continue; }
      var bk = bridgeKey(lay, lo, hi);
      (by[bk] = by[bk] || []).push(shifted(els[i], -lay[lo].top));
    }
    for (var key in by) {
      if (!Object.prototype.hasOwnProperty.call(by, key)) continue;
      var sg = sigOf(by[key]);
      if (sg === S.sig[key]) continue;
      S.mem[key] = by[key];
      S.sig[key] = sg;
      S.dirty[key] = 1;
    }
    clearTimeout(S.saveT);
    S.saveT = setTimeout(persist, SAVE_MS);
  }

  function packLayer(list) {
    var K = window.GardenInkCodec, G = window.GardenCanvas;
    var strokes = list.filter(function (e) { return e.ty === 'st'; });
    var shapes = list.filter(function (e) { return e.ty !== 'st'; }).map(function (e) {
      var c = {}, k;
      for (k in e) if (k !== '_bb' && Object.prototype.hasOwnProperty.call(e, k)) c[k] = e[k];
      return c;
    });
    var ts = strokes.map(function (e) { return e.ts > 0 ? e.ts : -1; });
    return K.pack(strokes.map(function (e) {
      var col = (K.canCarry && !K.canCarry(e.c)) ? G.hexOf(e.c) : e.c;
      return { tool: e.hi ? 'hi' : 'pen', color: col, w: e.w, nib: e.nib, o: e.o, pts: e.pts };
    })).then(function (ink) {
      var d = { ink: strokes.length ? ink : '', shapes: shapes, t: Date.now() };
      if (ts.some(function (t) { return t > 0; })) d.ts = ts;
      return d;
    });
  }

  function persist() {
    var keys = Object.keys(S.dirty);
    if (!keys.length) return Promise.resolve();
    S.dirty = {};
    var st = readStore();
    st.pend = st.pend || {};
    st.dt = st.dt || {};
    return Promise.all(keys.map(function (k) {
      var list = S.mem[k] || [];
      if (!list.length) {
        if (st.L[k]) { delete st.L[k]; st.pend[k] = 'del'; st.dt[k] = Date.now(); }
        return null;
      }
      return packLayer(list).then(function (d) { st.L[k] = d; st.pend[k] = 'set'; delete st.dt[k]; });
    })).then(function () {
      st.rw = SHEET;
      writeStore(st);
      schedulePush();
      markBtn();
      try { document.dispatchEvent(new CustomEvent('garden:moduleInkSaved', { detail: { keys: keys } })); } catch (e) {}
    });
  }

  function unpackLayer(key) {
    if (S.mem[key]) return Promise.resolve(S.mem[key]);
    var d = (S.store && S.store.L[key]) || null;
    if (!d) { S.mem[key] = []; S.sig[key] = sigOf([]); return Promise.resolve(S.mem[key]); }
    var shapes = (d.shapes || []).map(function (s) { s.id = nid(); return s; });
    var done = d.ink ? window.GardenInkCodec.unpack(d.ink) : Promise.resolve([]);
    return done.then(function (strokes) {
      var tsOk = Array.isArray(d.ts) && d.ts.length === strokes.length;
      var list = strokes.map(function (st, k) {
        var e = { id: nid(), ty: 'st', c: st.color || 'ink', w: st.w || 2.4, nib: st.nib || 'round',
                  o: st.tool === 'hi' ? 0.32 : (st.o == null ? 1 : st.o), hi: st.tool === 'hi' ? 1 : 0, pts: st.pts };
        if (tsOk && d.ts[k] > 0) e.ts = d.ts[k];
        return e;
      }).concat(shapes);
      S.mem[key] = list;
      S.sig[key] = sigOf(list);
      return list;
    });
  }

  function compose() {
    if (!S.ov) return Promise.resolve();
    S.lay = layout();
    var lay = S.lay, vis = liveBridges(lay);
    var parts = lay.map(function (g) { return { key: g.key, top: g.top }; }).concat(vis);
    return Promise.all(parts.map(function (g) { return unpackLayer(g.key); })).then(function (lists) {
      if (lay !== S.lay || !S.ov) return;
      S.vis = vis;
      var all = [];
      lists.forEach(function (list, i) {
        list.forEach(function (e) { var c = shifted(e, parts[i].top); c.id = nid(); all.push(c); });
      });
      S.ov.fit();
      var cv = S.ov.cv;
      if (!cv) return;
      cv.els = all;
      cv.undoS = []; cv.redoS = [];
      if (cv.deselect) cv.deselect();
      cv.w = 0; cv.resize(); cv.paint();
      if (cv.emit) cv.emit();
    });
  }

  function relayout() {
    clearTimeout(S.reT);
    S.reT = setTimeout(function () {
      if (!S.on || !S.lay) return;
      var now = layout(), same = now.length === S.lay.length, i;
      for (i = 0; same && i < now.length; i++) {
        if (now[i].key !== S.lay[i].key || now[i].top !== S.lay[i].top || now[i].end !== S.lay[i].end) same = false;
      }
      if (same) return;
      split();
      compose();
    }, 120);
  }

  function onDepthClick(e) {
    if (!S.on) return;
    var t = e.target && e.target.closest ? e.target.closest('.depth-tab') : null;
    if (!t || !S.main.contains(t)) return;
    split();
    setTimeout(function () { compose(); }, 0);
  }

  function inInk(el) {
    var s = el && el.closest ? el.closest('.main-content > section') : null;
    return !!s && !s.classList.contains('mi-free');
  }

  function blockFold(e) {
    if (!S.on) return;
    var t = e.target && e.target.closest ? e.target.closest('.accordion-trigger, summary') : null;
    if (t && S.main.contains(t) && inInk(t)) { e.preventDefault(); e.stopPropagation(); }
  }

  function markFree(on) {
    var past = false;
    Array.prototype.forEach.call(S.main.children, function (el) {
      if (!past && el.matches(STOP_SEL)) past = true;
      if (el.tagName === 'SECTION') el.classList.toggle('mi-free', !!on && past);
    });
  }

  function openFolds() {
    S.opened = [];
    S.main.querySelectorAll('details').forEach(function (d) {
      if (!d.open && inInk(d)) { d.open = true; S.opened.push(['d', d]); }
    });
    S.main.querySelectorAll('.accordion-item').forEach(function (a) {
      if (!a.classList.contains('open') && inInk(a)) { a.classList.add('open'); S.opened.push(['a', a]); }
    });
  }
  function closeFolds() {
    S.opened.forEach(function (p) { if (p[0] === 'd') p[1].open = false; else p[1].classList.remove('open'); });
    S.opened = [];
  }

  function fitZoom() {
    var m = S.main;
    m.style.zoom = '';
    var wrap = m.parentElement, side = document.querySelector('aside.sidebar');
    var avail = wrap ? wrap.clientWidth : document.documentElement.clientWidth;
    if (side && side.offsetWidth && wrap && wrap.contains(side)) avail -= side.offsetWidth + 24;
    var z = Math.min(1, Math.max(0.3, (avail - 16) / SHEET));
    if (z < 0.999) m.style.zoom = String(z);
  }

  function forceViewport(on) {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    if (on) {
      if (S.vp == null && window.innerWidth < VP_W) {
        document.documentElement.style.setProperty('--mi-ui', (VP_W / Math.max(240, window.innerWidth)).toFixed(3));
        S.vp = meta.getAttribute('content') || '';
        meta.setAttribute('content', 'width=' + VP_W + ', viewport-fit=cover');
        document.documentElement.classList.add('mi-vp');
      }
    } else if (S.vp != null) {
      var back = S.vp;
      meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
      setTimeout(function () { if (S.vp == null) meta.setAttribute('content', back); }, 300);
      S.vp = null;
      document.documentElement.classList.remove('mi-vp');
      document.documentElement.style.removeProperty('--mi-ui');
    }
  }

  function settle() {
    var waits = [];
    try { if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready); } catch (e) {}
    try { if (window.MathJax && MathJax.startup && MathJax.startup.promise) waits.push(MathJax.startup.promise); } catch (e2) {}
    return Promise.race([Promise.all(waits), new Promise(function (r) { setTimeout(r, 2500); })]);
  }

  function setDrawing(on) {
    if (!S.ov) return;
    S.drawing = !!on;
    S.ov.toggle(S.drawing);
    if (S.fab) {
      S.fab.setAttribute('aria-pressed', S.drawing ? 'true' : 'false');
      var k = keyLabel(), ar = S.drawing ? 'أوقفِ القلم' : 'شغّلِ القلم', en = S.drawing ? 'Pen off' : 'Pen on';
      var t = L(ar, en) + (k ? ' (' + k + ')' : '');
      S.fab.setAttribute('aria-label', t); S.fab.title = t;
      S.fab.setAttribute('data-ar-title', ar + (k ? ' (' + k + ')' : ''));
      S.fab.setAttribute('data-en-title', en + (k ? ' (' + k + ')' : ''));
    }
  }

  var DEF_KEY = 'key:Alt+KeyP';
  function penKeys() {
    var X = window.GardenInkInput, out = [];
    if (X && X.devProfile) X.devProfile().binds.forEach(function (b) { if (b.a === 'tools' && b.t.indexOf('key:') === 0) out.push(b.t); });
    return out.length ? out : [DEF_KEY];
  }
  function keyLabel() {
    var X = window.GardenInkInput;
    return X && X.trigLabel ? X.trigLabel(penKeys()[0]) : 'Alt + P';
  }

  function key() {
    if (S.busy) return Promise.resolve();
    if (!S.on) return enable();
    setDrawing(!S.drawing);
    return Promise.resolve();
  }

  function onPenWake(e) {
    if (!S.on || S.drawing || e.pointerType !== 'pen') return;
    var X = window.GardenInkInput, t = X && X.trigOf ? X.trigOf(e) : null;
    if (!t || X.actFor(t) !== 'tools') return;
    e.preventDefault(); e.stopPropagation();
    setDrawing(true);
  }

  var TAP_SEL = 'a[href], button, summary, label, input, select, textarea, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"])';
  function pass(x, y, src) {
    if (!S.ov || !S.ov.host) return false;
    var host = S.ov.host, list = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [], el = null, i;
    for (i = 0; i < list.length; i++) {
      if (host.contains(list[i]) || (list[i].closest && list[i].closest('.ndl, .nip, .mi-dock'))) continue;
      el = list[i]; break;
    }
    var t = el && el.closest ? el.closest(TAP_SEL) : null;
    if (!t) return false;
    if (src === 'touch' && t.tagName === 'A' && !/^#/.test(t.getAttribute('href') || '')) return false;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName) && !/^(checkbox|radio|button|submit)$/.test(t.type || '')) {
      try { t.focus({ preventScroll: true }); } catch (e) {}
      return true;
    }
    t.click();
    return true;
  }

  var BIN = 'garden_mink_bin:' + pageKey();
  function visibleKeys() {
    var out = [];
    (S.lay || []).forEach(function (g) { out.push(g.key); });
    (S.vis || []).forEach(function (b) { out.push(b.key); });
    return out;
  }
  function wipe(all) {
    if (!S.on || !S.ov || !S.ov.cv) return Promise.resolve(0);
    split();
    clearTimeout(S.saveT);
    return persist().then(function () {
      var st = readStore(), keys = all ? Object.keys(st.L) : visibleKeys().filter(function (k) { return !!st.L[k]; });
      if (!keys.length) return 0;
      var bin = { at: Date.now(), L: {} }, n = 0;
      st.pend = st.pend || {}; st.dt = st.dt || {};
      keys.forEach(function (k) {
        bin.L[k] = st.L[k];
        delete st.L[k]; st.pend[k] = 'del'; st.dt[k] = Date.now();
        S.mem[k] = []; S.sig[k] = sigOf([]);
        n++;
      });
      try { localStorage.setItem(BIN, JSON.stringify(bin)); } catch (e) {}
      writeStore(st);
      S.store = st;
      schedulePush();
      markBtn();
      return compose().then(function () { undoBar(n); return n; });
    });
  }
  function readBin() {
    try { var b = JSON.parse(localStorage.getItem(BIN) || 'null'); return (b && b.L && Object.keys(b.L).length) ? b : null; }
    catch (e) { return null; }
  }
  function restore() {
    var bin = readBin();
    if (!bin || !S.on) return Promise.resolve(0);
    if (S.ov && S.ov.cv) split();
    clearTimeout(S.saveT);
    return persist().then(function () {
      var st = readStore(), t = Date.now(), n = 0;
      st.pend = st.pend || {}; st.dt = st.dt || {};
      Object.keys(bin.L).forEach(function (k) {
        if (st.L[k]) return;
        st.L[k] = Object.assign({}, bin.L[k], { t: t });
        st.pend[k] = 'set'; delete st.dt[k];
        delete S.mem[k]; delete S.sig[k];
        n++;
      });
      try { localStorage.removeItem(BIN); } catch (e) {}
      writeStore(st);
      S.store = st;
      schedulePush();
      markBtn();
      return compose().then(function () { return n; });
    });
  }

  function undoBar(n) {
    var old = document.querySelector('.mi-undo');
    if (old) old.remove();
    var bar = document.createElement('div');
    bar.className = 'mi-undo';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<span></span><button type="button" class="gsf-btn gsf-btn--sm"></button>';
    bar.firstChild.textContent = L('مُسح الرسم', 'Drawings cleared') + ' · ' + n + ' ' + L(n === 1 ? 'طبقة' : 'طبقات', n === 1 ? 'layer' : 'layers');
    bar.lastChild.textContent = L('تراجع', 'Undo');
    bar.lastChild.addEventListener('click', function () { bar.remove(); restore(); });
    document.body.appendChild(bar);
    setTimeout(function () { if (bar.isConnected) bar.remove(); }, 9000);
  }

  var POS = 'garden_mi_dock';
  function readPos() {
    try { var p = JSON.parse(localStorage.getItem(POS) || 'null'); return (p && isFinite(p.x) && isFinite(p.y)) ? p : null; }
    catch (e) { return null; }
  }
  function placeDock(p) {
    var d = S.dock;
    if (!d) return;
    if (!p) { d.style.left = d.style.top = ''; d.removeAttribute('data-moved'); return; }
    var z = parseFloat(getComputedStyle(d).zoom) || 1;
    var w = (d.offsetWidth || 90) * z, h = (d.offsetHeight || 48) * z, vw = window.innerWidth, vh = window.innerHeight, pad = 8;
    var x = Math.max(pad, Math.min(vw - w - pad, p.x * vw - w / 2));
    var y = Math.max(pad, Math.min(vh - h - pad, p.y * vh - h / 2));
    d.style.left = Math.round(x / z) + 'px'; d.style.top = Math.round(y / z) + 'px';
    d.setAttribute('data-moved', '1');
  }

  function openMenu() {
    var M = window.GardenMenu;
    if (!M || !S.more) return;
    var st = readStore(), vis = visibleKeys().filter(function (k) { return !!st.L[k]; }).length;
    var all = Object.keys(st.L).length, bin = readBin();
    var h = M.head(L('الرسمُ في هذه الصفحة', 'Drawings on this page')) +
      M.item('wipe-vis', 'fa-eraser', L('امسحِ الظاهرَ الآن', 'Clear what you see now'), { off: !vis }) +
      M.item('wipe-all', 'fa-trash-can', L('امسحْ كلَّ رسم الصفحة · كلُّ الأنماط', 'Clear every drawing · all modes'), { off: !all, danger: true }) +
      M.item('restore', 'fa-rotate-left', L('استعِدْ آخرَ ما مُسح', 'Bring back the last clear'), { off: !bin }) +
      M.sep() +
      M.head(L('اختصارُ القلم', 'Pen shortcut') + ': ' + keyLabel()) +
      M.item('keys', 'fa-keyboard', L('غيِّرِ الاختصارَ أو اربطْه بزرٍّ', 'Change the shortcut or bind a button')) +
      M.item('home', 'fa-arrows-to-dot', L('أعِدِ الزرَّ إلى مكانه', 'Put the button back'), { off: !readPos() });
    var r = S.more.getBoundingClientRect();
    var el = M.open(r.left, r.top, h, function (act) {
      if (act === 'wipe-vis') wipe(false);
      else if (act === 'wipe-all') wipe(true);
      else if (act === 'restore') restore();
      else if (act === 'home') { try { localStorage.removeItem(POS); } catch (e) {} placeDock(null); }
      else if (act === 'keys') {
        if (!S.drawing) setDrawing(true);
        var dl = S.ov && S.ov.dial;
        if (dl && dl.togglePanel) { try { localStorage.setItem('garden_ink_panel_tab', 'binds'); } catch (e2) {} dl.togglePanel(true); if (dl.panel) { dl.panel.tab = 'binds'; dl.panel.render(); } }
      }
    }, { label: L('خياراتُ الرسم', 'Drawing options'), cls: 'mi-menu' });
    if (el) {
      var er = el.getBoundingClientRect();
      var top = r.top - er.height - 8;
      if (top < 8) top = r.bottom + 8;
      el.style.insetBlockStart = (parseFloat(el.style.insetBlockStart || '0') + top - er.top) + 'px';
    }
  }

  function buildFab() {
    if (S.dock) { S.dock.hidden = false; placeDock(readPos()); return; }
    var d = document.createElement('div');
    d.className = 'mi-dock';
    d.innerHTML = '<button type="button" class="mi-more" aria-haspopup="menu"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>' +
      '<button type="button" class="mi-fab"><i class="fa-solid fa-pen-nib" aria-hidden="true"></i></button>';
    var b = d.lastChild, m = d.firstChild;
    var mt = L('خياراتُ الرسم: المسحُ والاختصار', 'Drawing options: clear and shortcut');
    m.title = mt; m.setAttribute('aria-label', mt);
    m.setAttribute('data-ar-title', 'خياراتُ الرسم: المسحُ والاختصار'); m.setAttribute('data-en-title', 'Drawing options: clear and shortcut');
    m.addEventListener('click', openMenu);
    var drag = null;
    b.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, r: d.getBoundingClientRect() };
      try { b.setPointerCapture(e.pointerId); } catch (e2) {}
    });
    b.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 8) return;
      drag.moved = true;
      d.setAttribute('data-drag', '1');
      placeDock({ x: (drag.r.left + drag.r.width / 2 + dx) / window.innerWidth, y: (drag.r.top + drag.r.height / 2 + dy) / window.innerHeight });
    });
    var end = function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var was = drag;
      drag = null;
      d.removeAttribute('data-drag');
      if (!was.moved) return;
      S.fabDragged = Date.now();
      var r = d.getBoundingClientRect();
      var p = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
      try { localStorage.setItem(POS, JSON.stringify(p)); } catch (e3) {}
    };
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
    b.addEventListener('click', function () {
      if (S.fabDragged && Date.now() - S.fabDragged < 400) return;
      setDrawing(!(S.ov && S.ov.on));
    });
    document.body.appendChild(d);
    S.dock = d; S.fab = b; S.more = m;
    placeDock(readPos());
  }

  function markBtn() {
    var b = S.btn;
    if (!b) return;
    b.setAttribute('aria-pressed', S.on ? 'true' : 'false');
    b.classList.toggle('mi-has', hasInk());
    var t = S.on ? L('أغلقِ الدفتر — الصفحةُ كما كانت بلا رسم', 'Close the notebook — the page as it was, without drawings')
                 : L('الدفتر: ارسمْ على الوحدة', 'Notebook: draw on this module');
    b.title = t; b.setAttribute('aria-label', t);
  }

  function enable() {
    if (S.on || S.busy) return Promise.resolve();
    S.main = document.querySelector('.main-content');
    if (!S.main) return Promise.resolve();
    S.busy = true;
    if (S.btn) S.btn.setAttribute('aria-busy', 'true');
    return deps().then(function () {
      forceViewport(true);
      document.documentElement.classList.add('mi-on');
      markFree(true);
      openFolds();
      fitZoom();
      return settle();
    }).then(function () {
      return Promise.race([pull(), new Promise(function (r) { setTimeout(r, 2500); })]);
    }).then(function () {
      S.store = readStore();
      S.mem = {}; S.sig = {}; S.dirty = {};
      S.lay = layout();
      S.ov = window.GardenNotesOverlay.mount({
        scroller: scroller, stage: S.main, sheet: S.main, bound: true, refW: SHEET,
        lineSel: LINE_SEL, surface: 'module',
        heightOf: sheetH,
        onPass: pass,
        onChange: function () { split(); }
      });
      if (S.ov.dial) S.ov.dial.onExit = function () { setDrawing(false); };
      S.ov.show();
      S.on = true;
      buildFab();
      document.addEventListener('click', onDepthClick, true);
      document.addEventListener('click', blockFold, true);
      window.addEventListener('pointerdown', onPenWake, true);
      window.addEventListener('resize', onResize);
      if (window.ResizeObserver) {
        S.ro = new ResizeObserver(relayout);
        sections().forEach(function (s) { S.ro.observe(s); });
      }
      return compose();
    }).then(function () {
      setDrawing(true);
    }).catch(function (e) {
      try { console.warn('module-ink', e); } catch (e2) {}
      disable();
    }).then(function () {
      S.busy = false;
      if (S.btn) S.btn.removeAttribute('aria-busy');
      markBtn();
    });
  }

  function onResize() {
    if (!S.on) return;
    placeDock(readPos());
    fitZoom();
    if (S.ov) S.ov.fit();
  }

  function disable() {
    if (S.ov && S.ov.cv) split();
    clearTimeout(S.saveT);
    var flush = persist();
    document.removeEventListener('click', onDepthClick, true);
    document.removeEventListener('click', blockFold, true);
    window.removeEventListener('pointerdown', onPenWake, true);
    window.removeEventListener('resize', onResize);
    if (S.ro) { S.ro.disconnect(); S.ro = null; }
    if (S.ov) { try { S.ov.destroy(); } catch (e) {} S.ov = null; }
    if (S.dock) S.dock.hidden = true;
    var ub = document.querySelector('.mi-undo');
    if (ub) ub.remove();
    S.on = false; S.drawing = false; S.lay = null; S.vis = [];
    if (S.main) { S.main.style.zoom = ''; closeFolds(); markFree(false); }
    document.documentElement.classList.remove('mi-on', 'nov-drawing');
    forceViewport(false);
    markBtn();
    return flush;
  }

  function toggle() { return S.on ? disable() : enable(); }

  window.addEventListener('pagehide', function () { if (S.on && S.ov && S.ov.cv) { split(); persist(); } });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') push(); });

  window.GardenModuleInk = {
    toggle: toggle,
    key: key,
    keys: penKeys,
    wipe: wipe,
    restore: restore,
    enable: enable,
    disable: disable,
    bind: function (btn) { S.btn = btn; markBtn(); },
    isOn: function () { return S.on; },
    hasInk: hasInk,
    flush: function () { if (S.on) split(); clearTimeout(S.saveT); return persist(); },
    push: push,
    pull: pull,
    PAGE_ID: PAGE_ID,
    _state: S,
    REF: { card: CARD, margin: MARGIN, sheet: SHEET }
  };
})();
