// M02_algo.js — Interactive algorithm widgets (algo_batch.py · local)
// Generated: 2026-10-16T18:16:34

window.AlgoWidgets = window.AlgoWidgets || {};

var _AL = {
  lang: function() { return document.documentElement.lang || 'ar'; },
  i18n: {
    prev:  { ar: 'السابق',    en: 'Prev'      },
    step:  { ar: 'التالي',    en: 'Next'      },
    play:  { ar: '▶ تشغيل',  en: '▶ Play'    },
    pause: { ar: '❚❚ إيقاف', en: '❚❚ Pause'  },
    reset: { ar: '↺ إعادة',  en: '↺ Reset'   },
    stepN: { ar: 'الخطوة',   en: 'Step'      },
    fast:  { ar: 'سريع',     en: 'Fast'      },
    slow:  { ar: 'بطيء',     en: 'Slow'      }
  },
  t: function(k) { return this.i18n[k] ? (this.i18n[k][this.lang()] || this.i18n[k].en) : k; },
  stepLabel: function(c, t) { return this.t('stepN') + ': ' + c + ' / ' + t; },
  exp: function(en, ar) { return this.lang() === 'ar' ? ar : en; },
  speedToDelay: function(v) { return 2100 - (v * 20); },
  toolbar: function(id) {
    return '<div class="algo-toolbar" data-algo-toolbar="' + id + '">' +
      '<button data-algo-btn="prev">'  + this.t('prev')  + '</button>' +
      '<button data-algo-btn="play">'  + this.t('play')  + '</button>' +
      '<button data-algo-btn="step">'  + this.t('step')  + '</button>' +
      '<button data-algo-btn="reset">' + this.t('reset') + '</button>' +
    '</div>' +
    '<div class="algo-controls-row">' +
      '<span class="step-counter" data-algo-counter>' + this.stepLabel(0, 0) + '</span>' +
      '<div class="algo-speed" data-algo-speed>' +
        '<span data-algo-speed-slow>' + this.t('slow') + '</span>' +
        '<input type="range" min="1" max="100" value="60" step="1">' +
        '<span data-algo-speed-fast>' + this.t('fast') + '</span>' +
      '</div>' +
    '</div>';
  },
  titleHTML: function(id) {
    var t = window._algoTitles && window._algoTitles[id];
    if (!t) return '';
    var text = this.lang() === 'ar' ? t.ar : t.en;
    return '<h4 class="algo-title" data-algo-title="' + id + '">' + text + '</h4>';
  },
  refreshToolbars: function() {
    var self = this;
    document.querySelectorAll('[data-algo-toolbar]').forEach(function(tb) {
      tb.querySelector('[data-algo-btn="prev"]').textContent  = self.t('prev');
      tb.querySelector('[data-algo-btn="step"]').textContent  = self.t('step');
      var pb = tb.querySelector('[data-algo-btn="play"]');
      pb.textContent = pb.dataset.playing === '1' ? self.t('pause') : self.t('play');
      tb.querySelector('[data-algo-btn="reset"]').textContent = self.t('reset');
    });
    document.querySelectorAll('[data-algo-speed-slow]').forEach(function(s){ s.textContent = self.t('slow'); });
    document.querySelectorAll('[data-algo-speed-fast]').forEach(function(s){ s.textContent = self.t('fast'); });
  }
};

window._algoRerenders = window._algoRerenders || {};
window._algoRefresh = function() {
  _AL.refreshToolbars();
  document.querySelectorAll('[data-algo-title]').forEach(function(el) {
    var id = el.dataset.algoTitle;
    var t = window._algoTitles && window._algoTitles[id];
    if (t) el.textContent = _AL.lang() === 'ar' ? t.ar : t.en;
  });
  Object.values(window._algoRerenders).forEach(function(fn){ try{ fn(); }catch(e){} });
};

function _algoBindSpeed(container, getDelay, restartFn) {
  var input = container.querySelector('.algo-speed input');
  input.addEventListener('input', function() {
    var playBtn = container.querySelector('[data-algo-btn="play"]');
    if (playBtn && playBtn.dataset.playing === '1') restartFn();
  });
}

window._algoTitles = window._algoTitles || {};
window._algoTest = window._algoTest || {};
window._algoSteps = window._algoSteps || {};
_AL.player = function (container, id, api) {
  var cur = 0, timer = null;
  var q = function (s) { return container.querySelector(s); };
  var counter = q('[data-algo-counter]'), playBtn = q('[data-algo-btn="play"]'), speed = q('.algo-speed input');
  function n() { return Math.max(1, api.count()); }
  function show(i) {
    cur = Math.max(0, Math.min(i, n() - 1));
    api.render(cur);
    if (counter) counter.textContent = _AL.stepLabel(cur + 1, n());
    var dir = _AL.lang() === 'ar' ? 'rtl' : 'ltr';
    [].forEach.call(container.querySelectorAll('.algo-title, .algo-explanation'), function (e) { e.style.setProperty('direction', dir, 'important'); });
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    if (playBtn) { playBtn.dataset.playing = '0'; playBtn.textContent = _AL.t('play'); }
  }
  function play() {
    stop();
    if (cur >= n() - 1) show(0);
    if (playBtn) { playBtn.dataset.playing = '1'; playBtn.textContent = _AL.t('pause'); }
    timer = setInterval(function () { if (cur >= n() - 1) { stop(); return; } show(cur + 1); },
                        _AL.speedToDelay(+(speed ? speed.value : 60)));
  }
  var b = function (k, f) { var el = q('[data-algo-btn="' + k + '"]'); if (el) el.addEventListener('click', f); };
  b('prev', function () { stop(); show(cur - 1); });
  b('step', function () { stop(); show(cur + 1); });
  b('play', function () { if (timer) stop(); else play(); });
  b('reset', function () { stop(); if (api.reset) api.reset(); show(0); });
  if (speed) speed.addEventListener('input', function () { if (timer) play(); });
  window._algoRerenders[id] = function () { show(cur); };
  container._algoGo = show;
  _AL.palette(container);
  var ex = q('.algo-explanation'); if (ex) ex.style.marginBottom = '14px';
  var cv = q('.algo-canvas'); if (cv) { cv.style.minHeight = '0'; cv.style.padding = '10px 0'; }
  show(0);
  return { show: show, stop: stop };
};

_AL.NS = 'http://www.w3.org/2000/svg';
_AL.el = function (tag, attrs, parent) {
  var e = document.createElementNS(_AL.NS, tag);
  for (var k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
_AL.TONE = { cur: 'orange', path: 'sky', done: 'emerald', cmp: 'teal' };
_AL.INK = {
  light: { orange: '#e2600b', sky: '#1273cc', emerald: '#0a8f4d', teal: '#00868f' },
  dark:  { orange: '#ff9f45', sky: '#5ab8ff', emerald: '#3ddc8a', teal: '#2fd8d0' }
};
_AL.HL = {
  light: { a: '80%', orange: '#ffbc70', sky: '#8ad4ff', emerald: '#7cf0b0', teal: '#6cebe2' },
  dark:  { a: '34%', orange: '#ff9a3c', sky: '#45a9ff', emerald: '#2fe08c', teal: '#22d3c5' }
};
_AL.STYLE = _AL.STYLE || 'ink';
_AL.palette = function (container) {
  var root = document.documentElement;
  function apply() {
    var th = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', ink = _AL.INK[th], hl = _AL.HL[th];
    for (var role in _AL.TONE) {
      var t = _AL.TONE[role];
      container.style.setProperty('--al-' + role, 'var(--gmi-p-' + t + ', ' + ink[t] + ')');
      container.style.setProperty('--al-' + role + '-hl',
        'color-mix(in srgb, var(--gmi-' + t + ', ' + hl[t] + ') var(--gmi-a, ' + hl.a + '), transparent)');
    }
  }
  apply();
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
};
_AL.ROLE = {
  cur:  { text: 'var(--al-cur)', hl: 'var(--al-cur-hl)', weight: 800 },
  cmp:  { text: 'var(--al-cmp)', hl: 'var(--al-cmp-hl)', weight: 800 },
  path: { text: 'var(--al-path)', hl: 'var(--al-path-hl)', weight: 800 },
  done: { text: 'var(--al-done)', hl: 'var(--al-done-hl)', weight: 800 },
  none: { text: 'var(--algo-text)', hl: 'none', weight: 700 }
};
_AL.FRAME = {
  cur:  { stroke: 'var(--al-cur)', width: 2.5, op: 1 },
  cmp:  { stroke: 'var(--al-cmp)', width: 2, op: 1 },
  path: { stroke: 'var(--al-path)', width: 2, op: 1 },
  done: { stroke: 'var(--al-done)', width: 2, op: 1 },
  none: { stroke: 'var(--text-muted)', width: 1.5, op: 0.5 }
};
_AL.inkText = function (text, roles) {
  var raw = String(text);
  if (_AL.lang() === 'ar') raw = raw.replace(/[A-Za-z][A-Za-z0-9_]*(?:\[[^\]]*\])*(?:\([^)]*\))?/g, function (w) { return '\u0001' + w + '\u0002'; });
  var esc = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  esc = esc.replace(/\b\d+\b/g, function (n) {
    var r = roles && roles[n];
    return r ? '<b style="color:var(--al-' + r + ');unicode-bidi:isolate">' + n + '</b>' : n;
  });
  return esc.replace(/\u0001/g, '<bdi dir="ltr" style="font-family:ui-monospace,Consolas,monospace;font-size:.9em;padding:0 4px;border-radius:4px;' +
    'background:color-mix(in srgb,var(--text-muted) 16%,transparent)">').replace(/\u0002/g, '</bdi>');
};
_AL.cellFor = function (keys, font) {
  var d = 1;
  (keys || []).forEach(function (k) { d = Math.max(d, String(k).length); });
  return Math.ceil(d * 0.62 * (font || 22) + 16);
};
_AL.keyNode = function (parent) {
  var g = _AL.el('g', { 'class': 'al-node' }, parent);
  var frame = _AL.el('rect', { rx: 7, ry: 7, fill: 'none' }, g);
  var cells = [], st = { x0: 0, c: 0, n: 0, y: 0, h: 0, gap: 0 };
  function ensure(n) {
    while (cells.length < n) {
      var r = _AL.el('rect', { rx: 5, ry: 5 }, g);
      var dv = _AL.el('line', { 'stroke-width': 1.5 }, g);
      var mk = _AL.el('rect', { rx: 3, ry: 3 }, g);
      var t = _AL.el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-weight': 700 }, g);
      cells.push({ r: r, dv: dv, mk: mk, t: t });
    }
  }
  var api = {
    g: g,
    set: function (keys, cx, cy, o) {
      o = o || {};
      keys = keys || [];
      var font = o.font || 22, n = keys.length;
      var c = Math.max(o.cell || 0, _AL.cellFor(keys, font)), h = o.h || Math.round(font * 1.8), gap = o.gap || 0;
      var w = n * c + Math.max(0, n - 1) * gap, x0 = cx - w / 2, y = cy - h / 2;
      st = { x0: x0, c: c, n: n, y: y, h: h, gap: gap };
      ensure(n);
      g.style.display = n ? '' : 'none';
      g.setAttribute('class', o.bare ? 'al-node al-bare' : 'al-node');
      var fr = _AL.FRAME[o.frame || 'none'];
      if (gap || o.bare || o.frame === 'off' || !n) frame.style.display = 'none';
      else {
        frame.style.display = '';
        frame.setAttribute('x', x0); frame.setAttribute('y', y);
        frame.setAttribute('width', w); frame.setAttribute('height', h);
        frame.setAttribute('stroke', fr.stroke); frame.setAttribute('stroke-width', fr.width);
        frame.setAttribute('stroke-opacity', fr.op);
      }
      cells.forEach(function (cl, i) {
        var on = i < n;
        cl.r.style.display = cl.t.style.display = on ? '' : 'none';
        cl.mk.style.display = 'none';
        cl.dv.style.display = on && !gap && !o.bare && i < n - 1 ? '' : 'none';
        cl.r.style.visibility = o.bare ? 'hidden' : '';
        if (!on) return;
        var role = _AL.ROLE[(o.roles && o.roles[i]) || 'none'] || _AL.ROLE.none, x = x0 + i * (c + gap);
        cl.r.setAttribute('x', x + (gap ? 0 : 1.5)); cl.r.setAttribute('y', y + (gap ? 0 : 1.5));
        cl.r.setAttribute('width', c - (gap ? 0 : 3)); cl.r.setAttribute('height', h - (gap ? 0 : 3));
        var rn = (o.roles && o.roles[i]) || 'none';
        cl.r.setAttribute('fill', 'var(--algo-bg)');
        if (gap) { cl.r.setAttribute('stroke', 'var(--text-muted)'); cl.r.setAttribute('stroke-opacity', 0.45);
                   cl.r.setAttribute('stroke-width', 1.5); }
        else cl.r.setAttribute('stroke', 'none');
        cl.dv.setAttribute('x1', x + c); cl.dv.setAttribute('x2', x + c);
        cl.dv.setAttribute('y1', y + 6); cl.dv.setAttribute('y2', y + h - 6);
        cl.dv.setAttribute('stroke', 'var(--text-muted)'); cl.dv.setAttribute('stroke-opacity', 0.45);
        cl.t.setAttribute('x', x + c / 2); cl.t.setAttribute('y', cy);
        var useInk = _AL.STYLE !== 'marker', useMk = rn !== 'none' && (_AL.STYLE === 'marker' || (_AL.STYLE === 'mix' && rn === 'cur'));
        cl.t.setAttribute('font-size', font);
        cl.t.setAttribute('fill', o.bare && rn === 'none' ? 'var(--text-muted)' : (useInk ? role.text : 'var(--algo-text)'));
        cl.t.setAttribute('font-weight', role.weight);
        if (useMk) {
          var tw = String(keys[i]).length * 0.62 * font + 8;
          cl.mk.style.display = '';
          cl.mk.setAttribute('x', x + (c - tw) / 2); cl.mk.setAttribute('width', tw);
          cl.mk.setAttribute('y', cy + font * 0.05); cl.mk.setAttribute('height', font * 0.5);
          cl.mk.setAttribute('fill', role.hl);
        }
        cl.t.textContent = keys[i];
      });
      return api;
    },
    width: function () { return st.n * st.c + Math.max(0, st.n - 1) * st.gap; },
    left: function () { return st.x0; }, top: function () { return st.y; }, bottom: function () { return st.y + st.h; },
    cellX: function (i) { return st.x0 + i * (st.c + st.gap) + st.c / 2; },
    edgeX: function (i) { return st.x0 + i * (st.c + st.gap); },
    hide: function () { g.style.display = 'none'; return api; }
  };
  return api;
};
_AL.arrows = function (svg, id) {
  var defs = svg.querySelector('defs') || _AL.el('defs', {}, svg);
  [['m', 'var(--text-muted)'], ['p', 'var(--al-path)']].forEach(function (a) {
    var m = _AL.el('marker', { id: 'w' + id + '-ar' + a[0], viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7,
                               orient: 'auto-start-reverse' }, defs);
    _AL.el('path', { d: 'M0 0 L10 5 L0 10 z', fill: a[1] }, m);
  });
  return function (parent) {
    var l = _AL.el('line', { 'stroke-width': 2 }, parent);
    return {
      el: l,
      set: function (x1, y1, x2, y2, onPath, dashed) {
        l.style.display = '';
        l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.setAttribute('stroke', onPath ? 'var(--al-path)' : 'var(--text-muted)');
        l.setAttribute('stroke-opacity', onPath ? 1 : 0.55);
        l.setAttribute('stroke-width', onPath ? 2.5 : 1.6);
        l.setAttribute('stroke-dasharray', dashed ? '5 4' : '');
        l.setAttribute('marker-end', 'url(#w' + id + '-ar' + (onPath ? 'p' : 'm') + ')');
      },
      hide: function () { l.style.display = 'none'; }
    };
  };
};
_AL.rowLabel = function (parent) {
  var t = _AL.el('text', { 'dominant-baseline': 'central', 'font-size': 17, 'font-weight': 700, fill: 'var(--text-muted)' }, parent);
  return {
    set: function (en, ar, y) {
      var isAr = _AL.lang() === 'ar';
      t.style.display = '';
      t.textContent = isAr ? ar : en;
      t.setAttribute('x', isAr ? 105 : 8); t.setAttribute('y', y); t.setAttribute('text-anchor', 'start');
      if (isAr) t.setAttribute('direction', 'rtl'); else t.removeAttribute('direction');
    },
    hide: function () { t.style.display = 'none'; }
  };
};
_AL.treeLayout = function (root, o) {
  var out = [], depth = 0;
  if (!root || (!root.keys.length && !(root.children || []).length)) return { nodes: out, depth: 0 };
  (function walk(n, d, parent, idx) {
    var rec = { n: n, d: d, parent: parent, idx: idx, kids: [], w: Math.max(1, n.keys.length) * o.cell };
    out.push(rec); depth = Math.max(depth, d + 1);
    if (parent) parent.kids.push(rec);
    (n.children || []).forEach(function (c, i) { walk(c, d + 1, rec, i); });
  })(root, 0, null, 0);
  var leaves = out.filter(function (r) { return !r.kids.length; });
  var total = leaves.reduce(function (a, r) { return a + r.w; }, 0) + o.gap * Math.max(0, leaves.length - 1);
  var x = o.x0 + Math.max(0, (o.x1 - o.x0 - total) / 2);
  leaves.forEach(function (r) { r.cx = x + r.w / 2; x += r.w + o.gap; });
  (function place(r) {
    if (r.kids.length) { r.kids.forEach(place); r.cx = (r.kids[0].cx + r.kids[r.kids.length - 1].cx) / 2; }
    r.cy = o.y0 + r.d * o.dy;
  })(out[0]);
  return { nodes: out, depth: depth, total: total };
};
_AL.treeView = function (svg, id, o) {
  var g = _AL.el('g', {}, svg), arrow = _AL.arrows(svg, id);
  var pool = [], edges = [], links = [], labels = [];
  function keysOf(t, internalOnly, acc) {
    acc = acc || [];
    if (!t) return acc;
    if (!internalOnly || (t.children && t.children.length)) t.keys.forEach(function (k) { acc.push(k); });
    (t.children || []).forEach(function (c) { keysOf(c, internalOnly, acc); });
    return acc;
  }
  function tuples(t, acc) {
    acc = acc || {};
    if (!t) return acc;
    acc[t.keys.join(',') + '|' + ((t.children && t.children.length) ? 'i' : 'l')] = 1;
    (t.children || []).forEach(function (c) { tuples(c, acc); });
    return acc;
  }
  function take(arr, make, i) { while (arr.length <= i) arr.push(make()); return arr[i]; }
  return {
    draw: function (tree, prev) {
      pool.forEach(function (n) { n.hide(); }); edges.forEach(function (e) { e.hide(); });
      links.forEach(function (e) { e.hide(); }); labels.forEach(function (l) { l.hide(); });
      var L = _AL.treeLayout(tree, o);
      var allPrev = keysOf(prev), intPrev = keysOf(prev, true), intNow = keysOf(tree, true), prevT = tuples(prev);
      var api = {};
      L.nodes.forEach(function (r, k) {
        var leaf = !r.kids.length, roles = r.n.keys.map(function (key) {
          if (allPrev.indexOf(key) < 0) return 'cur';
          if (!leaf && intPrev.indexOf(key) < 0) return 'path';
          if (leaf && intNow.indexOf(key) >= 0 && intPrev.indexOf(key) < 0) return 'done';
          return 'none';
        });
        var changed = prev && !prevT[r.n.keys.join(',') + '|' + (leaf ? 'l' : 'i')];
        api[k] = take(pool, function () { return _AL.keyNode(g); }, k)
          .set(r.n.keys, r.cx, r.cy, { cell: o.cell, font: o.font, roles: roles, frame: 'none' });
      });
      var e = 0;
      L.nodes.forEach(function (r, k) {
        r.kids.forEach(function (kid, i) {
          var p = api[k], c = api[L.nodes.indexOf(kid)];
          take(edges, function () { return arrow(g); }, e++).set(p.edgeX(i), p.bottom(), c.left() + c.width() / 2, c.top() - 2, false);
        });
      });
      if (o.links) {
        var lv = L.nodes.filter(function (r) { return !r.kids.length; }), j = 0;
        for (var i = 0; i + 1 < lv.length; i++) {
          var a = api[L.nodes.indexOf(lv[i])], b = api[L.nodes.indexOf(lv[i + 1])];
          take(links, function () { return arrow(g); }, j++).set(a.left() + a.width() + 3, lv[i].cy, b.left() - 3, lv[i].cy, false, true);
        }
      }
      if (o.labels && L.depth) {
        for (var d = 0; d < L.depth; d++) {
          var en = d === L.depth - 1 ? 'Leaves' : (d === 0 ? 'Root' : 'Internal');
          var ar = d === L.depth - 1 ? 'الأوراق' : (d === 0 ? 'الجذر' : 'داخليّة');
          if (L.depth === 1) { en = 'Root (leaf)'; ar = 'الجذر (ورقة)'; }
          take(labels, function () { return _AL.rowLabel(g); }, d).set(en, ar, o.y0 + d * o.dy);
        }
      }
      return L;
    }
  };
};
_AL.GRAPH_POS = [[300, 40], [460, 40], [620, 40], [380, 180], [540, 180], [700, 180]];
_AL.GRAPH_CAND = [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 3], [1, 4], [2, 4], [2, 5]];
_AL.randomGraph = function (n, weighted, extra) {
  var cand = _AL.GRAPH_CAND.filter(function (e) { return e[0] < n && e[1] < n; }).slice(), par = [], out = [], i;
  for (i = 0; i < n; i++) par.push(i);
  function f(x) { while (par[x] !== x) x = par[x]; return x; }
  for (i = cand.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)), t = cand[i]; cand[i] = cand[k]; cand[k] = t; }
  cand.forEach(function (e) {
    var a = f(e[0]), b = f(e[1]);
    if (a !== b || Math.random() < (extra == null ? 0.45 : extra)) {
      if (a !== b) par[a] = b;
      out.push(weighted ? [e[0], e[1], 1 + Math.floor(Math.random() * 9)] : [e[0], e[1]]);
    }
  });
  return out;
};
_AL.graph = function (parent) {
  var g = _AL.el('g', { 'class': 'al-graph' }, parent), ge = _AL.el('g', {}, g), gw = _AL.el('g', {}, g), gv = _AL.el('g', {}, g);
  var lines = [], wts = [], vs = [], R = 23, L = 'ABCDEFG';
  function take(arr, make, i) { while (arr.length <= i) arr.push(make()); return arr[i]; }
  return {
    set: function (n, edges, o) {
      o = o || {};
      lines.forEach(function (l) { l.style.display = 'none'; });
      wts.forEach(function (w) { w.hide(); });
      vs.forEach(function (v) { v.g.style.display = 'none'; });
      edges.forEach(function (e, k) {
        var p = _AL.GRAPH_POS[e[0]], q = _AL.GRAPH_POS[e[1]], role = (o.eRole || {})[Math.min(e[0], e[1]) + '-' + Math.max(e[0], e[1])];
        var l = take(lines, function () { return _AL.el('line', {}, ge); }, k);
        l.style.display = '';
        l.setAttribute('x1', p[0]); l.setAttribute('y1', p[1]); l.setAttribute('x2', q[0]); l.setAttribute('y2', q[1]);
        l.setAttribute('stroke', role ? 'var(--al-' + role + ')' : 'var(--text-muted)');
        l.setAttribute('stroke-opacity', role ? 1 : 0.5);
        l.setAttribute('stroke-width', role ? 3.5 : 2);
        if (e.length > 2) take(wts, function () { return _AL.keyNode(gw); }, k)
          .set([e[2]], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, { font: o.font || 18, h: 28, roles: [role || 'none'] });
      });
      for (var v = 0; v < n; v++) {
        var c = take(vs, function () {
          var gg = _AL.el('g', {}, gv);
          return { g: gg, c: _AL.el('circle', { r: R }, gg),
                   t: _AL.el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 21, 'font-weight': 800 }, gg) };
        }, v), rn = (o.vRole && o.vRole[v]) || 'none', fr = _AL.FRAME[rn], ro = _AL.ROLE[rn];
        c.g.style.display = '';
        c.c.setAttribute('cx', _AL.GRAPH_POS[v][0]); c.c.setAttribute('cy', _AL.GRAPH_POS[v][1]);
        c.c.setAttribute('fill', 'var(--algo-bg)'); c.c.setAttribute('stroke', fr.stroke);
        c.c.setAttribute('stroke-width', rn === 'none' ? 2 : 3.5); c.c.setAttribute('stroke-opacity', rn === 'none' ? 0.6 : 1);
        c.t.setAttribute('x', _AL.GRAPH_POS[v][0]); c.t.setAttribute('y', _AL.GRAPH_POS[v][1]);
        c.t.setAttribute('fill', ro.text); c.t.textContent = L[v];
      }
    }
  };
};
_AL.legend = function (el, items) {
  if (!el) return;
  el.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:4px 18px;margin:0 0 10px;font-size:.84em;' +
    'color:var(--text-muted);font-weight:600;direction:' + (_AL.lang() === 'ar' ? 'rtl' : 'ltr') + ' !important';
  el.innerHTML = items.map(function (it) {
    var r = _AL.ROLE[it.role], mk = _AL.STYLE === 'marker' || (_AL.STYLE === 'mix' && it.role === 'cur');
    var smp = '<b style="unicode-bidi:isolate;font-weight:800;padding:0 3px;border-radius:3px;color:' +
      (_AL.STYLE === 'marker' ? 'var(--algo-text)' : r.text) +
      (mk ? ';background:linear-gradient(transparent 52%, ' + r.hl + ' 52%)' : '') + '">' + (it.sample || '42') + '</b>';
    return '<span style="display:inline-flex;align-items:center;gap:6px">' + smp + _AL.exp(it.en, it.ar) + '</span>';
  }).join('');
};
_AL.fit = function (svg, count, render, pad) {
  pad = pad == null ? 16 : pad;
  var vb = svg.viewBox.baseVal, W = vb.width || 800, y0 = Infinity, y1 = -Infinity;
  svg.setAttribute('viewBox', '0 0 ' + W + ' 2000');
  var wrap = svg.parentElement; if (wrap) wrap.style.aspectRatio = W + ' / 2000';
  for (var i = 0; i < count; i++) {
    render(i);
    var r0 = svg.getBoundingClientRect(), s = W / (r0.width || W);
    [].forEach.call(svg.querySelectorAll('rect,text,line,path,circle,polygon,polyline,ellipse'), function (e) {
      if (e.closest('defs,marker')) return;
      for (var n = e; n && n !== svg; n = n.parentElement) {
        var cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return;
      }
      var r = e.getBoundingClientRect();
      if (!r.width && !r.height) return;
      if (r.height * s > 1900) return;
      y0 = Math.min(y0, (r.top - r0.top) * s); y1 = Math.max(y1, (r.bottom - r0.top) * s);
    });
  }
  if (!isFinite(y0)) { y0 = 0; y1 = 450; }
  var H = Math.max(160, Math.ceil(y1 - y0 + 2 * pad));
  svg.setAttribute('viewBox', '0 ' + Math.floor(y0 - pad) + ' ' + W + ' ' + H);
  if (wrap) wrap.style.aspectRatio = W + ' / ' + H;
  render(0);
};


/* ── widget 1 · dfa_run ── */
(function () {
window._algoTitles[1] = { en: 'Tracing a String Through a DFA', ar: 'تتبّعُ سلسلةٍ في آلةٍ محدودةٍ حتميّة' };
window._algoTest[1] = function (input) {
  var steps = [];
  var state = 0;
  var path = [0];
  var w = input.w;
  var delta = input.delta;
  var accept = input.accept;
  for (var i = 0; i < w.length; i++) {
    var c = w[i] === '1' ? 1 : 0;
    var from = state;
    var to = delta[from][c];
    path.push(to);
    var accepted = accept.indexOf(to) !== -1;
    state = to;
    var isLast = (i === w.length - 1);
    var en = "Read " + w[i] + " in q" + from + ": δ(q" + from + ", " + w[i] + ") = q" + to + ".";
    var ar = "نقرأ " + w[i] + " ونحن في q" + from + "، فننتقل إلى q" + to + ".";
    if (isLast) {
      en += accepted ? " The input is over and q" + to + " is accepting: the string is ACCEPTED."
                     : " The input is over and q" + to + " is not accepting: the string is REJECTED.";
      ar += accepted ? " انتهى المدخلُ وq" + to + " حالةُ قبول، فالسلسلةُ مقبولة."
                     : " انتهى المدخلُ وq" + to + " ليست حالةَ قبول، فالسلسلةُ مرفوضة.";
    }
    steps.push({
      en: en,
      ar: ar,
      snap: JSON.parse(JSON.stringify({
        i: i,
        from: from,
        to: to,
        path: path,
        accepted: accepted
      }))
    });
  }
  return steps;
};

window.AlgoWidgets[1] = function (container) {
  container.innerHTML =
    '<div class="algo-widget">' + _AL.titleHTML(1) + _AL.toolbar(1) +
    '<div class="algo-explanation" id="w1-exp" data-algo-text></div>' +
    '<div class="algo-stats" id="w1-stats" data-algo-text></div>' +
    '<div class="algo-legend" id="w1-legend" data-algo-text></div>' +
    '<div class="algo-canvas"><div style="width:100%;max-width:800px;margin:0 auto;">' +
    '<svg id="w1-svg" width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet"></svg>' +
    '</div></div></div>';
  var svg = container.querySelector('#w1-svg'), exp = container.querySelector('#w1-exp');
  var stats = container.querySelector('#w1-stats'), legend = container.querySelector('#w1-legend');
  var R = 26, g = _AL.el('g', {}, svg), ge = _AL.el('g', {}, g), gn = _AL.el('g', {}, g), gl = _AL.el('g', {}, g);
  var defs = _AL.el('defs', {}, svg);
  [['m', 'var(--text-muted)'], ['c', 'var(--al-cur)']].forEach(function (a) {
    var m = _AL.el('marker', { id: 'w1-dfa' + a[0], viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' }, defs);
    _AL.el('path', { d: 'M0 0 L10 5 L0 10 z', fill: a[1] }, m);
  });
  var MACHINES = [
    { delta: [[1, 0], [1, 2], [2, 2]], accept: [2], en: 'contains 01', ar: 'تحوي 01', pos: [[240, 92], [430, 92], [620, 92]] },
    { delta: [[0, 1], [0, 2], [2, 2]], accept: [2], en: 'has seen 11', ar: 'رأت 11', pos: [[240, 92], [430, 92], [620, 92]] },
    { delta: [[1, 2], [0, 3], [3, 0], [2, 1]], accept: [0], en: 'even 0s and even 1s', ar: 'أصفارٌ زوجيّةٌ وآحادٌ زوجيّة',
      pos: [[300, 74], [600, 74], [300, 254], [600, 254]] }
  ];
  var M = null, nodes = [], edges = [], tape = _AL.keyNode(g), idx = _AL.keyNode(g), lT = _AL.rowLabel(g), start = _AL.el('line', { 'stroke-width': 2.5 }, g);
  var steps = [], input = null;

  function randomInput() {
    M = MACHINES[Math.floor(Math.random() * MACHINES.length)];
    var n = 5 + Math.floor(Math.random() * 4), w = '';
    for (var k = 0; k < n; k++) w += Math.random() < 0.5 ? '0' : '1';
    return { delta: M.delta, accept: M.accept, w: w };
  }
  function take(arr, make, i) { while (arr.length <= i) arr.push(make()); return arr[i]; }
  function buildSVG() {
    edges.forEach(function (e) { e.p.style.display = 'none'; e.lab.hide(); });
    var n = M.delta.length, cx = 0, cy = 0, k = 0, groups = {};
    M.pos.forEach(function (p) { cx += p[0] / n; cy += p[1] / n; });
    M.delta.forEach(function (row, q) { row.forEach(function (to, c) {
      var key = q + '>' + to; (groups[key] = groups[key] || []).push(c);
    }); });
    Object.keys(groups).forEach(function (key) {
      var a = +key.split('>')[0], b = +key.split('>')[1], syms = groups[key], e = take(edges, function () {
        return { p: _AL.el('path', { fill: 'none' }, ge), lab: _AL.keyNode(gl) };
      }, k++), P = M.pos[a], Q = M.pos[b], d, lx, ly;
      if (a === b) {
        var ux = P[0] - cx, uy = P[1] - cy, L = Math.sqrt(ux * ux + uy * uy) || 1;
        ux /= L; uy /= L;
        if (n === 3) { ux = 0; uy = -1; }
        var px = -uy, py = ux, bx = P[0] + ux * R, by = P[1] + uy * R;
        var s1x = bx + px * 12, s1y = by + py * 12, s2x = bx - px * 12, s2y = by - py * 12;
        d = 'M' + s1x + ' ' + s1y + ' C' + (s1x + ux * 52 + px * 22) + ' ' + (s1y + uy * 52 + py * 22) + ' ' +
            (s2x + ux * 52 - px * 22) + ' ' + (s2y + uy * 52 - py * 22) + ' ' + s2x + ' ' + s2y;
        lx = P[0] + ux * (R + 56); ly = P[1] + uy * (R + 56);
      } else {
        var dx = Q[0] - P[0], dy = Q[1] - P[1], D = Math.sqrt(dx * dx + dy * dy), nx = -dy / D, ny = dx / D;
        var bend = groups[b + '>' + a] ? 30 : 0;
        var mx = (P[0] + Q[0]) / 2 + nx * bend * 2, my = (P[1] + Q[1]) / 2 + ny * bend * 2;
        var t1x = mx - P[0], t1y = my - P[1], t1 = Math.sqrt(t1x * t1x + t1y * t1y), t2x = mx - Q[0], t2y = my - Q[1], t2 = Math.sqrt(t2x * t2x + t2y * t2y);
        var sx = P[0] + t1x / t1 * R, sy = P[1] + t1y / t1 * R, ex = Q[0] + t2x / t2 * (R + 3), ey = Q[1] + t2y / t2 * (R + 3);
        d = 'M' + sx + ' ' + sy + ' Q' + mx + ' ' + my + ' ' + ex + ' ' + ey;
        var off = bend || 20;
        lx = (P[0] + Q[0]) / 2 + nx * off; ly = (P[1] + Q[1]) / 2 + ny * off;
      }
      e.p.style.display = ''; e.p.setAttribute('d', d);
      e.a = a; e.b = b; e.syms = syms; e.lx = lx; e.ly = ly;
    });
    edges.forEach(function (e, j) { e.on = j < k; });
    nodes.forEach(function (nd) { nd.g.style.display = 'none'; });
    M.pos.forEach(function (p, q) {
      var nd = take(nodes, function () {
        var gg = _AL.el('g', {}, gn);
        return { g: gg, c: _AL.el('circle', { r: R }, gg), c2: _AL.el('circle', { r: R - 5, fill: 'none' }, gg),
                 t: _AL.el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 20, 'font-weight': 800 }, gg) };
      }, q);
      nd.g.style.display = '';
      [nd.c, nd.c2, nd.t].forEach(function (el) { el.setAttribute(el.tagName === 'text' ? 'x' : 'cx', p[0]); el.setAttribute(el.tagName === 'text' ? 'y' : 'cy', p[1]); });
      nd.c.setAttribute('fill', 'var(--algo-bg)');
      nd.c2.style.display = M.accept.indexOf(q) >= 0 ? '' : 'none';
      nd.t.textContent = 'q' + q;
    });
    var s0 = M.pos[0];
    start.setAttribute('x1', s0[0] - R - 46); start.setAttribute('y1', s0[1]); start.setAttribute('x2', s0[0] - R - 3); start.setAttribute('y2', s0[1]);
    start.setAttribute('stroke', 'var(--text-muted)'); start.setAttribute('marker-end', 'url(#w1-dfam)');
  }
  function render(i) {
    var s = steps[i].snap, sym = +input.w.charAt(s.i), last = i === steps.length - 1;
    edges.forEach(function (e) {
      if (!e.on) return;
      var hot = e.a === s.from && e.b === s.to && e.syms.indexOf(sym) >= 0;
      e.p.setAttribute('stroke', hot ? 'var(--al-cur)' : 'var(--text-muted)');
      e.p.setAttribute('stroke-opacity', hot ? 1 : 0.6); e.p.setAttribute('stroke-width', hot ? 3.5 : 2);
      e.p.setAttribute('marker-end', 'url(#w1-dfa' + (hot ? 'c' : 'm') + ')');
      e.lab.set(e.syms.length > 1 ? e.syms.map(String) : [e.syms[0]], e.lx, e.ly, { font: 17, h: 26, gap: e.syms.length > 1 ? 4 : 0,
        roles: e.syms.map(function (c) { return hot && c === sym ? 'cur' : 'none'; }) });
    });
    nodes.forEach(function (nd, q) {
      if (q >= M.pos.length) return;
      var role = q === s.to ? (last ? (s.accepted ? 'done' : 'path') : 'cur') : (q === s.from ? 'cmp' : 'none');
      nd.c.setAttribute('stroke', _AL.FRAME[role].stroke); nd.c.setAttribute('stroke-width', role === 'none' ? 2 : 3.5);
      nd.c.setAttribute('stroke-opacity', role === 'none' ? 0.6 : 1);
      nd.c2.setAttribute('stroke', _AL.FRAME[role].stroke); nd.c2.setAttribute('stroke-width', 1.8);
      nd.t.setAttribute('fill', _AL.ROLE[role].text);
    });
    var yT = 0;
    M.pos.forEach(function (p) { yT = Math.max(yT, p[1]); });
    yT += 100;
    tape.set(input.w.split(''), 450, yT, { cell: 40, font: 21, gap: 6,
      roles: input.w.split('').map(function (c, k) { return k === s.i ? 'cur' : (k < s.i ? 'done' : 'none'); }) });
    idx.set(input.w.split('').map(function (c, k) { return k === s.i ? '▲' : ''; }), 450, yT + 34, { cell: 40, font: 17, gap: 6, bare: true, roles: input.w.split('').map(function (c, k) { return k === s.i ? 'cur' : 'none'; }) });
    lT.set('Input', 'المدخل', yT);
    exp.innerHTML = _AL.inkText(_AL.exp(steps[i].en, steps[i].ar), {});
    stats.style.cssText = 'color:var(--algo-muted, var(--text-muted));display:flex;flex-wrap:wrap;justify-content:center;gap:4px 22px;margin:0 0 6px;font-size:.9em;font-weight:700;direction:' +
      (_AL.lang() === 'ar' ? 'rtl' : 'ltr') + ' !important';
    stats.innerHTML = '<span>' + _AL.exp('Machine: ', 'الآلة: ') + _AL.exp(M.en, M.ar) + '</span>' +
      '<span style="direction:ltr;unicode-bidi:isolate">δ(q' + s.from + ', ' + input.w.charAt(s.i) + ') = <b style="color:var(--al-cur)">q' + s.to + '</b></span>' +
      '<span>' + _AL.exp('Path: ', 'المسار: ') + '<b style="direction:ltr;unicode-bidi:isolate;font-weight:inherit">' +
      s.path.map(function (q) { return 'q' + q; }).join(' → ') + '</b></span>' +
      (last ? '<span style="color:var(--al-' + (s.accepted ? 'done' : 'path') + ')">' +
        (s.accepted ? _AL.exp('ACCEPTED', 'مقبولة') : _AL.exp('REJECTED', 'مرفوضة')) + '</span>' : '');
    _AL.legend(legend, [
      { role: 'cmp', en: 'state before', ar: 'الحالةُ قبل', sample: '○' },
      { role: 'cur', en: 'transition taken', ar: 'الانتقالُ المأخوذ', sample: '→' },
      { role: 'done', en: 'symbols read', ar: 'رموزٌ قُرئت', sample: '0' }
    ]);
  }
  function regen() { input = randomInput(); steps = window._algoTest[1](input); buildSVG(); _AL.fit(svg, steps.length, render); }
  regen();
  _AL.player(container, 1, { count: function () { return steps.length; }, render: render, reset: regen });
};
})();

(function(){
  function init(){
    Object.keys(window.AlgoWidgets).forEach(function(id){
      var el = document.getElementById('algo-widget-' + id);
      if (el && !el.dataset.algoLoaded) {
        try { window.AlgoWidgets[id](el); el.dataset.algoLoaded = 'true'; }
        catch(e) { console.error('AlgoWidget #' + id + ' error:', e); }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
