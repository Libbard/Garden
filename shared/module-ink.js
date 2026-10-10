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
      css('notes.css'), css('module-ink.css'),
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
    var els = S.ov.cv.els || [], by = {}, i, r;
    for (i = 0; i < S.lay.length; i++) by[S.lay[i].key] = [];
    for (i = 0; i < els.length; i++) {
      var y = anchorY(els[i]);
      for (r = 0; r < S.lay.length; r++) {
        var g = S.lay[r];
        if (y < g.end || r === S.lay.length - 1) { by[g.key].push(shifted(els[i], -g.top)); break; }
      }
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
    var lay = S.lay;
    return Promise.all(lay.map(function (g) { return unpackLayer(g.key); })).then(function (lists) {
      if (lay !== S.lay || !S.ov) return;
      var all = [];
      lists.forEach(function (list, i) {
        list.forEach(function (e) { var c = shifted(e, lay[i].top); c.id = nid(); all.push(c); });
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
      var t = S.drawing ? L('أخفِ أدواتِ الرسم', 'Hide drawing tools') : L('أظهِرْ أدواتِ الرسم', 'Show drawing tools');
      S.fab.setAttribute('aria-label', t); S.fab.title = t;
      S.fab.setAttribute('data-ar-title', S.drawing ? 'أخفِ أدواتِ الرسم' : 'أظهِرْ أدواتِ الرسم');
      S.fab.setAttribute('data-en-title', S.drawing ? 'Hide drawing tools' : 'Show drawing tools');
    }
  }

  function buildFab() {
    if (S.fab) { S.fab.hidden = false; return; }
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mi-fab';
    b.innerHTML = '<i class="fa-solid fa-pen-nib" aria-hidden="true"></i>';
    b.addEventListener('click', function () { setDrawing(!(S.ov && S.ov.on)); });
    document.body.appendChild(b);
    S.fab = b;
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
        onChange: function () { split(); }
      });
      S.ov.show();
      S.on = true;
      buildFab();
      document.addEventListener('click', onDepthClick, true);
      document.addEventListener('click', blockFold, true);
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
    fitZoom();
    if (S.ov) S.ov.fit();
  }

  function disable() {
    if (S.ov && S.ov.cv) split();
    clearTimeout(S.saveT);
    var flush = persist();
    document.removeEventListener('click', onDepthClick, true);
    document.removeEventListener('click', blockFold, true);
    window.removeEventListener('resize', onResize);
    if (S.ro) { S.ro.disconnect(); S.ro = null; }
    if (S.ov) { try { S.ov.destroy(); } catch (e) {} S.ov = null; }
    if (S.fab) S.fab.hidden = true;
    S.on = false; S.drawing = false; S.lay = null;
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
