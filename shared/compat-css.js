;(function () {
  'use strict';
  if (window.GardenCompatCss) return;

  /*@3.COCJ2.1*/
  var S = window.CSS && CSS.supports ? function (a, b) { try { return b == null ? CSS.supports(a) : CSS.supports(a, b); } catch (e) { return false; } } : function () { return false; };
  var force = !!window.__gardenCompatForce;
  var NEED = {
    mix: force || !S('color', 'color-mix(in oklab, red 50%, blue)'),
    has: force || !S('selector(:has(a))'),
    dvh: force || !S('height', '1dvh')
  };
  if (!NEED.mix && !NEED.has && !NEED.dvh) { window.GardenCompatCss = { need: NEED, off: true }; return; }

  var NAMED = {
    transparent: [0, 0, 0, 0], white: [255, 255, 255, 1], black: [0, 0, 0, 1],
    red: [255, 0, 0, 1], blue: [0, 0, 255, 1], green: [0, 128, 0, 1], orange: [255, 165, 0, 1],
    yellow: [255, 255, 0, 1], gray: [128, 128, 128, 1], grey: [128, 128, 128, 1]
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function parseColor(s) {
    s = String(s || '').trim();
    if (!s) return null;
    var low = s.toLowerCase();
    if (NAMED[low]) return NAMED[low].slice();
    var m;
    if (low.charAt(0) === '#') {
      var h = low.slice(1);
      if (h.length === 3 || h.length === 4) h = h.replace(/./g, function (c) { return c + c; });
      if (h.length !== 6 && h.length !== 8) return null;
      var n = parseInt(h.slice(0, 6), 16);
      if (isNaN(n)) return null;
      var a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
    }
    m = low.match(/^rgba?\(\s*([^)]+)\)$/);
    if (m) {
      var parts = m[1].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
      if (parts.length < 3) return null;
      var ch = function (v) { return v.slice(-1) === '%' ? parseFloat(v) * 2.55 : parseFloat(v); };
      var al = parts.length > 3 ? (parts[3].slice(-1) === '%' ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])) : 1;
      var out = [ch(parts[0]), ch(parts[1]), ch(parts[2]), isNaN(al) ? 1 : al];
      return out.some(function (x) { return isNaN(x); }) ? null : out;
    }
    m = low.match(/^hsla?\(\s*([^)]+)\)$/);
    if (m) {
      var hp = m[1].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
      if (hp.length < 3) return null;
      var H = parseFloat(hp[0]) / 360, Sv = parseFloat(hp[1]) / 100, Lv = parseFloat(hp[2]) / 100;
      var A = hp.length > 3 ? (hp[3].slice(-1) === '%' ? parseFloat(hp[3]) / 100 : parseFloat(hp[3])) : 1;
      var q = Lv < 0.5 ? Lv * (1 + Sv) : Lv + Sv - Lv * Sv, p = 2 * Lv - q;
      var f = function (t) {
        t = ((t % 1) + 1) % 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      return [f(H + 1 / 3) * 255, f(H) * 255, f(H - 1 / 3) * 255, isNaN(A) ? 1 : A];
    }
    return null;
  }

  function toLin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function fromLin(c) { c = clamp(c, 0, 1); return (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255; }
  /*@3.COCJ2.3*/
  function rgbToOklab(c) {
    var r = toLin(c[0]), g = toLin(c[1]), b = toLin(c[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function oklabToRgb(o) {
    var l_ = o[0] + 0.3963377774 * o[1] + 0.2158037573 * o[2];
    var m_ = o[0] - 0.1055613458 * o[1] - 0.0638541728 * o[2];
    var s_ = o[0] - 0.0894841775 * o[1] - 1.2914855480 * o[2];
    var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
    return [fromLin(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
            fromLin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
            fromLin(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)];
  }

  /*@3.COCJ2.2*/
  function mix(space, c1, p1, c2, p2) {
    var a1 = c1[3], a2 = c2[3];
    var mult = 1;
    if (p1 == null && p2 == null) { p1 = 50; p2 = 50; }
    else if (p1 == null) p1 = 100 - p2;
    else if (p2 == null) p2 = 100 - p1;
    var sum = p1 + p2;
    if (sum <= 0) return null;
    if (sum !== 100) { if (sum < 100) mult = sum / 100; p1 = p1 * 100 / sum; p2 = p2 * 100 / sum; }
    var w1 = p1 / 100, w2 = p2 / 100;
    var alpha = a1 * w1 + a2 * w2;
    var t1 = alpha > 0 ? (a1 * w1) / alpha : w1, t2 = alpha > 0 ? (a2 * w2) / alpha : w2;
    var rgb;
    if (space === 'oklab' || space === 'oklch' || space === 'lab' || space === 'lch') {
      var o1 = rgbToOklab(c1), o2 = rgbToOklab(c2);
      rgb = oklabToRgb([o1[0] * t1 + o2[0] * t2, o1[1] * t1 + o2[1] * t2, o1[2] * t1 + o2[2] * t2]);
    } else if (space === 'srgb-linear') {
      rgb = [fromLin(toLin(c1[0]) * t1 + toLin(c2[0]) * t2), fromLin(toLin(c1[1]) * t1 + toLin(c2[1]) * t2), fromLin(toLin(c1[2]) * t1 + toLin(c2[2]) * t2)];
    } else {
      rgb = [c1[0] * t1 + c2[0] * t2, c1[1] * t1 + c2[1] * t2, c1[2] * t1 + c2[2] * t2];
    }
    return [rgb[0], rgb[1], rgb[2], clamp(alpha * mult, 0, 1)];
  }
  function fmt(c) {
    var r = Math.round(clamp(c[0], 0, 255)), g = Math.round(clamp(c[1], 0, 255)), b = Math.round(clamp(c[2], 0, 255));
    var a = Math.round(c[3] * 1000) / 1000;
    return a >= 1 ? 'rgb(' + r + ', ' + g + ', ' + b + ')' : 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
  }

  var varCache = null;
  function readVar(name, sc) {
    if (sc) {
      var v2 = '';
      try { v2 = sc.cs.getPropertyValue(name); } catch (e2) {}
      return String(v2 || '').trim();
    }
    if (!varCache) varCache = {};
    if (name in varCache) return varCache[name];
    var v = '';
    try { v = getComputedStyle(document.documentElement).getPropertyValue(name); } catch (e) {}
    varCache[name] = String(v || '').trim();
    return varCache[name];
  }
  function curColor(sc) {
    var v = '';
    try { v = (sc ? sc.cs : getComputedStyle(document.documentElement)).getPropertyValue('color'); } catch (e) {}
    return String(v || '').trim();
  }
  function splitTop(s, sep) {
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      if (ch === sep && depth === 0) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out;
  }
  function resolveVars(s, sc, depth) {
    depth = depth || 0;
    if (depth > 8) return null;
    var out = '', i = 0;
    while (i < s.length) {
      var at = s.indexOf('var(', i);
      if (at < 0) { out += s.slice(i); break; }
      out += s.slice(i, at);
      var j = at + 4, d = 1;
      while (j < s.length && d > 0) { var c = s.charAt(j); if (c === '(') d++; else if (c === ')') d--; j++; }
      if (d !== 0) return null;
      var inner = s.slice(at + 4, j - 1);
      var parts = splitTop(inner, ',');
      var name = parts[0].trim();
      var val = readVar(name, sc);
      if (!val && parts.length > 1) val = parts.slice(1).join(',').trim();
      if (!val) return null;
      var r = resolveVars(val, sc, depth + 1);
      if (r == null) return null;
      out += r;
      i = j;
    }
    return out;
  }
  function evalCalc(s) {
    var m = s.match(/^calc\((.*)\)$/);
    if (!m) return s;
    var expr = m[1].replace(/%/g, '');
    if (!/^[\d\s.+\-*/()]+$/.test(expr)) return null;
    var v;
    try { v = Function('return (' + expr + ')')(); } catch (e) { return null; }
    return isFinite(v) ? v + '%' : null;
  }
  function parseArg(s, sc) {
    s = s.trim();
    var pct = null, col = s;
    var m = s.match(/^(.*?)\s+(calc\([^)]*\)|[\d.]+%)$/) || s.match(/^(calc\([^)]*\)|[\d.]+%)\s+(.*)$/);
    if (m) {
      var a = m[1].trim(), b = m[2].trim();
      var isPctB = /%$/.test(b) || /^calc\(/.test(b);
      col = isPctB ? a : b;
      var pv = evalCalc(isPctB ? b : a);
      if (pv == null) return null;
      pct = parseFloat(pv);
    }
    if (/^currentcolor$/i.test(col)) col = curColor(sc);
    var c = parseColor(col);
    if (!c) return null;
    return { c: c, p: pct };
  }
  function resolveMix(value, sc) {
    var s = resolveVars(value, sc);
    if (s == null) return null;
    var guard = 0;
    while (s.indexOf('color-mix(') >= 0 && guard++ < 6) {
      var at = s.lastIndexOf('color-mix(');
      var j = at + 10, d = 1;
      while (j < s.length && d > 0) { var c = s.charAt(j); if (c === '(') d++; else if (c === ')') d--; j++; }
      if (d !== 0) return null;
      var inner = s.slice(at + 10, j - 1);
      var parts = splitTop(inner, ',');
      if (parts.length !== 3) return null;
      var sp = parts[0].trim().match(/^in\s+([a-z-]+)/i);
      if (!sp) return null;
      var a = parseArg(parts[1], sc), b = parseArg(parts[2], sc);
      if (!a || !b) return null;
      var r = mix(sp[1].toLowerCase(), a.c, a.p, b.c, b.p);
      if (!r) return null;
      s = s.slice(0, at) + fmt(r) + s.slice(j);
    }
    return s;
  }

  function stripComments(t) { return t.replace(/\/\*[\s\S]*?\*\//g, ''); }
  /*@3.COCJ2.4*/
  function parseSheet(text) {
    var out = [];
    var t = stripComments(text);
    var stack = [];
    var i = 0, n = t.length;
    var buf = '';
    while (i < n) {
      var ch = t.charAt(i);
      if (ch === '"' || ch === "'") {
        var q = ch, k = i + 1;
        while (k < n && t.charAt(k) !== q) { if (t.charAt(k) === '\\') k++; k++; }
        buf += t.slice(i, k + 1); i = k + 1; continue;
      }
      if (ch === '{') {
        var head = buf.trim(); buf = '';
        if (head.charAt(0) === '@' && !/^@(media|supports|layer|container)\b/i.test(head)) {
          var k2 = i, d2 = 0;
          while (k2 < n) { var c2 = t.charAt(k2); if (c2 === '{') d2++; else if (c2 === '}') { d2--; if (d2 === 0) break; } k2++; }
          i = k2 + 1; continue;
        }
        stack.push(head);
        i++; continue;
      }
      if (ch === '}') {
        var body = buf.trim(); buf = '';
        var sel = stack.pop();
        if (sel != null && body && sel.charAt(0) !== '@') {
          var wrap = stack.filter(function (x) { return x.charAt(0) === '@'; });
          out.push({ sel: sel, body: body, wrap: wrap });
        }
        i++; continue;
      }
      buf += ch; i++;
    }
    return out;
  }
  function decls(body) {
    var out = [];
    splitTop(body, ';').forEach(function (d) {
      var at = d.indexOf(':');
      if (at < 0) return;
      var p = d.slice(0, at).trim(), v = d.slice(at + 1).trim();
      if (!p || !v) return;
      var imp = /!important\s*$/i.test(v);
      if (imp) v = v.replace(/!important\s*$/i, '').trim();
      out.push({ p: p, v: v, imp: imp });
    });
    return out;
  }

  var hasN = 0, HAS = [];
  /*@3.COCJ2.8*/
  function hasRewrite(sel) {
    var m = sel.match(/^(.*?):has\(([^)]*)\)(.*)$/);
    if (!m) return null;
    var pre = m[1], inner = m[2].trim(), post = m[3];
    if (post.indexOf(':has(') >= 0) return null;
    var cls = 'gcm-has-' + (++hasN);
    HAS.push({ pre: pre || '*', inner: inner, cls: cls });
    return pre + '.' + cls + post;
  }
  function applyHas() {
    for (var i = 0; i < HAS.length; i++) {
      var h = HAS[i], list;
      try { list = document.querySelectorAll(h.pre); } catch (e) { continue; }
      for (var j = 0; j < list.length; j++) {
        var el = list[j], hit = false, inner = h.inner;
        try {
          if (inner.charAt(0) === '>') hit = !!el.querySelector(':scope > ' + inner.slice(1).trim());
          else if (inner.charAt(0) === '+') { var nx = el.nextElementSibling; hit = !!(nx && nx.matches(inner.slice(1).trim())); }
          else if (inner.charAt(0) === '~') { var sb = el.nextElementSibling; while (sb && !hit) { if (sb.matches(inner.slice(1).trim())) hit = true; sb = sb.nextElementSibling; } }
          else hit = !!el.querySelector(inner);
        } catch (e2) { hit = false; }
        el.classList.toggle(h.cls, hit);
      }
    }
  }

  var RULES = [];
  var STAT = { sheets: 0, mix: 0, mixLive: 0, mixFail: 0, has: 0, dvh: 0, fails: [] };
  function harvest(text) {
    parseSheet(text).forEach(function (r) {
      var sels = r.sel, ds = decls(r.body), out = [], i;
      var needHas = NEED.has && sels.indexOf(':has(') >= 0;
      for (i = 0; i < ds.length; i++) {
        var d = ds[i];
        var v = d.v;
        if (NEED.dvh && /\d(dvh|svh|lvh)\b/.test(v)) { v = v.replace(/(\d)(dvh|svh|lvh)\b/g, '$1vh'); STAT.dvh++; }
        if (v.indexOf('color-mix(') >= 0) {
          if (!NEED.mix) { if (needHas) out.push({ p: d.p, v: v, imp: d.imp }); continue; }
          out.push({ p: d.p, v: v, imp: d.imp, mix: 1 });
          continue;
        }
        if (v !== d.v || needHas) out.push({ p: d.p, v: v, imp: d.imp });
      }
      if (!out.length) return;
      var sel = sels;
      if (needHas) {
        var parts = splitTop(sels, ',').map(function (s) { return s.trim(); }).map(function (s) {
          if (s.indexOf(':has(') < 0) return s;
          var rw = hasRewrite(s);
          if (rw) STAT.has++;
          return rw;
        }).filter(Boolean);
        if (!parts.length) return;
        sel = parts.join(', ');
      }
      RULES.push({ sel: sel, wrap: r.wrap, ds: out });
    });
  }
  var LIVE = [], APPLIED = [], liveN = 0;
  var STATE_RE = /::[a-z-]+|:(hover|focus|focus-visible|focus-within|active|visited|target|checked|disabled|enabled|indeterminate|placeholder-shown|autofill|default|read-only|read-write|valid|invalid|required|optional|in-range|out-of-range|link|any-link|open)\b/g;
  /*@3.COCJ2.5*/
  function baseSel(sel) {
    var out = [], seen = {};
    splitTop(sel, ',').forEach(function (s) {
      var b = s.replace(STATE_RE, '').trim();
      if (!b || b === '&' || seen[b]) return;
      seen[b] = 1;
      out.push(b);
    });
    return out.join(', ');
  }
  /*@3.COCJ2.6*/
  function liveValue(sel, wrap, v) {
    var base = baseSel(sel);
    if (!base) return null;
    var out = '', i = 0;
    while (true) {
      var at = v.indexOf('color-mix(', i);
      if (at < 0) { out += v.slice(i); break; }
      out += v.slice(i, at);
      var j = at + 10, d = 1;
      while (j < v.length && d > 0) { var c = v.charAt(j); if (c === '(') d++; else if (c === ')') d--; j++; }
      if (d !== 0) return null;
      var name = '--gcm-' + (++liveN);
      LIVE.push({ sel: base, wrap: wrap, name: name, expr: v.slice(at, j) });
      out += 'var(' + name + ')';
      i = j;
    }
    return out;
  }
  function wrapOk(w) {
    if (/^@media\b/i.test(w)) {
      try { return matchMedia(w.replace(/^@media\s*/i, '')).matches; } catch (e) { return false; }
    }
    if (/^@supports\b/i.test(w)) {
      try { return CSS.supports(w.replace(/^@supports\s*/i, '')); } catch (e2) { return false; }
    }
    return true;
  }
  function elemPass() {
    var i, j, k;
    for (i = 0; i < APPLIED.length; i++) {
      try { APPLIED[i].el.style.removeProperty(APPLIED[i].p); } catch (e) {}
    }
    APPLIED.length = 0;
    STAT.mixLive = 0;
    var seen = null;
    try { seen = new Map(); } catch (eM) { seen = null; }
    for (i = 0; i < LIVE.length; i++) {
      var e = LIVE[i], list;
      for (j = 0; j < e.wrap.length; j++) if (!wrapOk(e.wrap[j])) break;
      if (j < e.wrap.length) continue;
      try { list = document.querySelectorAll(e.sel); } catch (e2) { continue; }
      for (k = 0; k < list.length; k++) {
        var el = list[k];
        var sc = seen ? seen.get(el) : null;
        if (!sc) { sc = { cs: getComputedStyle(el) }; if (seen) seen.set(el, sc); }
        var v = resolveMix(e.expr, sc);
        if (v == null) continue;
        try { el.style.setProperty(e.name, v); } catch (e3) { continue; }
        APPLIED.push({ el: el, p: e.name });
        STAT.mixLive++;
      }
    }
  }
  function render() {
    varCache = null;
    var css = '', i, j;
    STAT.mix = 0; STAT.mixFail = 0; STAT.mixLive = 0; STAT.fails = [];
    LIVE.length = 0; liveN = 0;
    for (i = 0; i < RULES.length; i++) {
      var r = RULES[i], body = '';
      for (j = 0; j < r.ds.length; j++) {
        var d = r.ds[j], v = d.v;
        if (d.mix) {
          var rv = resolveMix(v);
          if (rv == null) {
            rv = liveValue(r.sel, r.wrap, v);
            if (rv == null) {
              STAT.mixFail++;
              if (STAT.fails.length < 40) STAT.fails.push(r.sel.slice(0, 40) + ' | ' + d.p + ': ' + v);
              continue;
            }
            v = rv;
          } else { v = rv; STAT.mix++; }
        }
        body += d.p + ':' + v + (d.imp ? ' !important' : '') + ';';
      }
      if (!body) continue;
      var rule = r.sel + '{' + body + '}';
      for (j = r.wrap.length - 1; j >= 0; j--) rule = r.wrap[j] + '{' + rule + '}';
      css += rule + '\n';
    }
    var st = document.getElementById('garden-compat-css');
    if (!st) {
      st = document.createElement('style');
      st.id = 'garden-compat-css';
      (document.head || document.documentElement).appendChild(st);
    } else if (st !== document.head.lastElementChild) {
      st.parentNode.appendChild(st);
    }
    st.textContent = css;
    if (NEED.has) applyHas();
    if (LIVE.length) elemPass();
  }

  function collect() {
    var sheets = [].slice.call(document.styleSheets), jobs = [];
    sheets.forEach(function (sh) {
      var node = sh.ownerNode;
      if (!node) return;
      if (node.tagName === 'STYLE') { jobs.push(Promise.resolve(node.textContent || '')); return; }
      if (!sh.href) return;
      jobs.push(fetch(sh.href, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : ''; })['catch'](function () { return ''; }));
    });
    return Promise.all(jobs).then(function (texts) {
      STAT.sheets = texts.length;
      RULES.length = 0; HAS.length = 0; hasN = 0;
      texts.forEach(function (t) { if (t) harvest(t); });
      render();
    });
  }

  var timers = {};
  /*@3.COCJ2.7*/
  function later(key, fn, ms) { clearTimeout(timers[key]); timers[key] = setTimeout(fn, ms); }
  function start() {
    collect().then(function () {
      try {
        new MutationObserver(function () { later('render', render, 60); })
          .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
      } catch (e) {}
      if (NEED.has || LIVE.length) {
        var sweep = function () { if (NEED.has) applyHas(); if (LIVE.length) elemPass(); };
        try {
          new MutationObserver(function () { later('sweep', sweep, 80); })
            .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'checked'] });
        } catch (e2) {}
      }
      try { document.addEventListener('garden:languageChanged', function () { later('render', render, 60); }); } catch (e3) {}
    });
  }
  window.GardenCompatCss = { need: NEED, stat: STAT, render: render, refresh: collect, mix: resolveMix, parse: parseColor, live: LIVE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
