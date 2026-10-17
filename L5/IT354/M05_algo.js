// M05_algo.js — Interactive algorithm widgets (algo_batch.py · local)
// Generated: 2026-10-16T18:45:03

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
        if (o.directed) {
          var dx = q[0] - p[0], dy = q[1] - p[1], D = Math.sqrt(dx * dx + dy * dy);
          l.setAttribute('x1', p[0] + dx / D * R); l.setAttribute('y1', p[1] + dy / D * R);
          l.setAttribute('x2', q[0] - dx / D * (R + 4)); l.setAttribute('y2', q[1] - dy / D * (R + 4));
          l.setAttribute('marker-end', 'url(#w' + o.id + '-ar' + (role === 'path' ? 'p' : 'm') + ')');
        } else {
          l.setAttribute('x1', p[0]); l.setAttribute('y1', p[1]); l.setAttribute('x2', q[0]); l.setAttribute('y2', q[1]);
          l.removeAttribute('marker-end');
        }
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


/* ── widget 1 · precedence_graph ── */
(function () {
window._algoTitles[1] = { en: 'Is the Schedule Conflict Serializable?', ar: 'هل الجدولُ قابلٌ للتسلسل تعارضيّاً؟' };
window._algoTest[1] = function (input) {
    function computeSteps(input) {
        let steps = [];
        let edges = [];
        let n = input.n;
        let ops = input.ops;
        for (let i = 0; i < ops.length; i++) {
            let op_i = ops[i];
            let t_i = op_i[0];
            let type_i = op_i[1];
            let item_i = op_i[2];
            let added = [];
            for (let j = i + 1; j < ops.length; j++) {
                let op_j = ops[j];
                let t_j = op_j[0];
                let type_j = op_j[1];
                let item_j = op_j[2];
                if (t_i !== t_j && item_i === item_j && (type_i === 'w' || type_j === 'w')) {
                    let newEdge = [t_i, t_j];
                    let exists = edges.some(e => e[0] === newEdge[0] && e[1] === newEdge[1]) ||
                                 added.some(e => e[0] === newEdge[0] && e[1] === newEdge[1]);
                    if (!exists) {
                        added.push(newEdge);
                    }
                }
            }
            added.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
            edges = edges.concat(added);
            edges.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
            let opStr = type_i.toUpperCase() + "(" + item_i + ")";
            let tStr = "T" + (t_i + 1);
            let en, ar;
            const opEn = (type_i === "r" ? "read" : "write") + " of " + item_i + " by " + tStr;
            const opAr = (type_i === "r" ? "قراءةُ " : "كتابةُ ") + tStr + " للعنصر " + item_i;
            if (added.length === 0) {
                en = "Operation " + (i + 1) + ": " + opEn + ". No new edge.";
                ar = "العمليّة " + (i + 1) + ": " + opAr + ". لا ضلعَ جديد.";
            } else {
                let names = added.map(e => "T" + (e[0] + 1) + " → T" + (e[1] + 1));
                en = "Operation " + (i + 1) + ": " + opEn + ". A later conflicting operation gives the edge " + names.join(", ") + ".";
                ar = "العمليّة " + (i + 1) + ": " + opAr + ". تتعارض مع عمليّةٍ لاحقة، فنرسم " + names.map(x => "⁦" + x + "⁩").join("، ") + ".";
            }
            steps.push({
                en: en,
                ar: ar,
                snap: JSON.parse(JSON.stringify({
                    i: i,
                    edges: edges,
                    added: added,
                    serial: null
                }))
            });
        }
        let remaining = [];
        for (let t = 0; t < n; t++) remaining.push(t);
        let serial = [];
        let cycle = false;
        while (remaining.length > 0) {
            let candidates = [];
            for (let t of remaining) {
                let hasIncoming = false;
                for (let edge of edges) {
                    if (edge[1] === t && remaining.includes(edge[0])) {
                        hasIncoming = true;
                        break;
                    }
                }
                if (!hasIncoming) candidates.push(t);
            }
            if (candidates.length === 0) {
                cycle = true;
                break;
            }
            candidates.sort((a, b) => a - b);
            let chosen = candidates[0];
            serial.push(chosen);
            remaining = remaining.filter(t => t !== chosen);
        }
        if (cycle) {
            serial = [];
        }
        let finalEn, finalAr;
        if (cycle) {
            finalEn = "The precedence graph has a cycle: the schedule is NOT conflict serializable.";
            finalAr = "في مخطّط الأسبقيّة دورة، فالجدولُ غيرُ قابلٍ للتسلسل تعارضيّاً.";
        } else {
            let seq = serial.map(t => "T" + (t + 1)).join(", ");
            finalEn = "No cycle in the precedence graph: the schedule is conflict serializable, equivalent to " + seq + ".";
            finalAr = "لا دورةَ في مخطّط الأسبقيّة، فالجدولُ قابلٌ للتسلسل ويكافئ الترتيبَ ⁦" + seq + "⁩.";
        }
        steps.push({
            en: finalEn,
            ar: finalAr,
            snap: JSON.parse(JSON.stringify({
                i: -1,
                edges: edges,
                added: [],
                serial: serial
            }))
        });
        return steps;
    }
    return computeSteps(input);
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
  var X0 = 160, COL = 62, Y_I = 20, Y0 = 62, ROW = 44, R = 28;
  var g = _AL.el('g', {}, svg), ge = _AL.el('g', {}, g), gn = _AL.el('g', {}, g);
  var defs = _AL.el('defs', {}, svg);
  [['m', 'var(--text-muted)'], ['c', 'var(--al-cur)'], ['p', 'var(--al-path)']].forEach(function (a) {
    var m = _AL.el('marker', { id: 'w1-pg' + a[0], viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' }, defs);
    _AL.el('path', { d: 'M0 0 L10 5 L0 10 z', fill: a[1] }, m);
  });
  var idx = _AL.keyNode(g), cells = [], rl = [], edges = [], nodes = [];
  var steps = [], input = null;

  function randomInput() {
    var want = Math.random() < 0.5, inp;
    for (var t = 0; t < 300; t++) {
      var n = Math.random() < 0.6 ? 3 : 2, ops = [], m = 7 + Math.floor(Math.random() * 3);
      for (var k = 0; k < m; k++) ops.push([Math.floor(Math.random() * n), Math.random() < 0.5 ? 'r' : 'w', 'XYZ'.charAt(Math.floor(Math.random() * (n === 2 ? 2 : 3)))]);
      inp = { n: n, ops: ops };
      var st = window._algoTest[1](inp), f = st[st.length - 1].snap;
      if (f.edges.length >= 2 && (f.serial.length === n) === want) return inp;
    }
    return inp;
  }
  function take(a, make, i) { while (a.length <= i) a.push(make()); return a[i]; }
  function pos(t, n) { return n === 2 ? [[330, 300], [590, 300]][t] : [[300, 268], [600, 268], [450, 380]][t]; }
  function render(i) {
    var s = steps[i].snap, n = input.n, ops = input.ops, last = s.i < 0;
    idx.set(ops.map(function (o, k) { return k + 1; }), X0 + (ops.length - 1) * COL / 2, Y_I, { cell: COL, font: 17, bare: true,
      roles: ops.map(function (o, k) { return k === s.i ? 'cur' : 'none'; }) });
    cells.forEach(function (c) { c.hide(); }); rl.forEach(function (r) { r.hide(); });
    var cur = s.i >= 0 ? ops[s.i] : null;
    ops.forEach(function (o, k) {
      var conf = cur && k > s.i && o[0] !== cur[0] && o[2] === cur[2] && (o[1] === 'w' || cur[1] === 'w');
      take(cells, function () { return _AL.keyNode(g); }, k).set([o[1] + '(' + o[2] + ')'], X0 + k * COL, Y0 + o[0] * ROW,
        { cell: COL - 6, font: 18, roles: [k === s.i ? 'cur' : (conf ? 'cmp' : (k < s.i || last ? 'done' : 'none'))], frame: k === s.i ? 'cur' : 'none' });
    });
    for (var t = 0; t < n; t++) take(rl, function () { return _AL.rowLabel(g); }, t).set('T' + (t + 1), 'T' + (t + 1), Y0 + t * ROW);
    edges.forEach(function (e) { e.style.display = 'none'; });
    var isNew = function (e) { return s.added.some(function (a) { return a[0] === e[0] && a[1] === e[1]; }); };
    s.edges.forEach(function (e, k) {
      var P = pos(e[0], n), Q = pos(e[1], n), dx = Q[0] - P[0], dy = Q[1] - P[1], D = Math.sqrt(dx * dx + dy * dy), nx = -dy / D, ny = dx / D;
      var both = s.edges.some(function (f) { return f[0] === e[1] && f[1] === e[0]; }), bend = both ? 26 : 0;
      var mx = (P[0] + Q[0]) / 2 + nx * bend * 2, my = (P[1] + Q[1]) / 2 + ny * bend * 2;
      var a1 = Math.atan2(my - P[1], mx - P[0]), a2 = Math.atan2(my - Q[1], mx - Q[0]);
      var p = take(edges, function () { return _AL.el('path', { fill: 'none' }, ge); }, k), nw = isNew(e);
      var cyc = last && s.serial.length < n, col = nw ? 'c' : (cyc ? 'c' : 'p');
      p.style.display = '';
      p.setAttribute('d', 'M' + (P[0] + Math.cos(a1) * R) + ' ' + (P[1] + Math.sin(a1) * R) + ' Q' + mx + ' ' + my + ' ' +
        (Q[0] + Math.cos(a2) * (R + 4)) + ' ' + (Q[1] + Math.sin(a2) * (R + 4)));
      p.setAttribute('stroke', col === 'c' ? 'var(--al-cur)' : 'var(--al-path)'); p.setAttribute('stroke-width', nw ? 3.5 : 2.5);
      p.setAttribute('marker-end', 'url(#w1-pg' + col + ')');
    });
    nodes.forEach(function (x) { x.g.style.display = 'none'; });
    for (t = 0; t < n; t++) {
      var nd = take(nodes, function () {
        var gg = _AL.el('g', {}, gn);
        return { g: gg, c: _AL.el('circle', { r: R }, gg), t: _AL.el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 20, 'font-weight': 800 }, gg) };
      }, t), P2 = pos(t, n), role = cur && cur[0] === t ? 'cur' : 'none';
      if (last) role = s.serial.length === n ? 'done' : 'none';
      nd.g.style.display = '';
      nd.c.setAttribute('cx', P2[0]); nd.c.setAttribute('cy', P2[1]); nd.c.setAttribute('fill', 'var(--algo-bg)');
      nd.c.setAttribute('stroke', _AL.FRAME[role].stroke); nd.c.setAttribute('stroke-width', role === 'none' ? 2 : 3.5);
      nd.t.setAttribute('x', P2[0]); nd.t.setAttribute('y', P2[1]); nd.t.setAttribute('fill', _AL.ROLE[role].text);
      nd.t.textContent = 'T' + (t + 1);
    }
    exp.innerHTML = _AL.inkText(_AL.exp(steps[i].en, steps[i].ar), {});
    stats.style.cssText = 'color:var(--algo-muted, var(--text-muted));display:flex;flex-wrap:wrap;justify-content:center;gap:4px 22px;margin:0 0 6px;font-size:.9em;font-weight:700;direction:' +
      (_AL.lang() === 'ar' ? 'rtl' : 'ltr') + ' !important';
    var ok = last && s.serial.length === n;
    stats.innerHTML = '<span>' + _AL.exp('Edges: ', 'الأضلاع: ') + '<b style="unicode-bidi:isolate">' + s.edges.length + '</b></span>' +
      (last ? '<span style="color:var(--al-' + (ok ? 'done' : 'cur') + ')">' + (ok ? _AL.exp('serializable as ', 'قابلٌ للتسلسل كـ ') +
        '<b style="direction:ltr;unicode-bidi:isolate">' + s.serial.map(function (x) { return 'T' + (x + 1); }).join(' → ') + '</b>' :
        _AL.exp('cycle: not serializable', 'دورة: غيرُ قابلٍ للتسلسل')) + '</span>' : '');
    _AL.legend(legend, [
      { role: 'cur', en: 'this operation', ar: 'العمليّةُ الآن', sample: 'w' },
      { role: 'cmp', en: 'conflicts later', ar: 'تتعارض لاحقاً', sample: 'r' },
      { role: 'path', en: 'precedence edge', ar: 'ضلعُ أسبقيّة', sample: '→' }
    ]);
  }
  function regen() { input = randomInput(); steps = window._algoTest[1](input); _AL.fit(svg, steps.length, render); }
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
