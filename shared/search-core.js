(function (root, make) {
  'use strict';
  var api = make();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GardenSearchCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = 1;
  var AR_MARKS = /[ً-ٰٟـ]/g;
  var FOLD = {
    'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
    'ة': 'ه', 'ى': 'ي', 'ی': 'ي', 'ؤ': 'و',
    'ئ': 'ي', 'ک': 'ك'
  };
  var FOLD_RE = /[أإآٱةىیؤئک٠-٩۰-۹]/g;
  var TOKEN_RE = /[a-z0-9]+[+#]*|[ء-ي]+/g;
  var AR_PRE = /^(?:وال|بال|كال|فال|ال|لل)/;
  var AR_PL = /(?:ات|ون|ين|ان)$/;

  var W = {
    cc: 14, ti: 10, kw: 6, tg: 4, ds: 3, vt: 4, l1: 2.2, ob: 2, ce: 2, th: 1.4, fc: 1.6,
    pq: 1.3, cm: 1.1, l2: 1, kd: 1, fo: 1, na: 0.8, va: 1, ta: 0.9, fb: 0.9, pa: 0.8,
    l3: 0.7, qz: 0.9, qx: 0.6, qo: 0.5, co: 0.5, vc: 1.2, mm: 2, nt: 1, nb: 1, pd: 0.8, pf: 4, sl: 0.9
  };
  var GROUPS = {
    title: ['ti', 'kw', 'cc'],
    body: ['ds', 'tg', 'l1', 'l2', 'l3', 'ob', 'na', 'va', 'fo', 'th', 'ta', 'kd', 'cm', 'vt', 'nb'],
    quiz: ['qz', 'qo', 'qx'],
    cards: ['fc', 'fb'],
    qa: ['pq', 'pa'],
    code: ['co', 'ce'],
    pdf: ['pd'],
    slides: ['sl']
  };
  var KIND_BOOST = { course: 1.7, tool: 1.5, faculty: 1.5, section: 1.4, module: 1.25, concept: 1, plan: 0.9, note: 1.1, slides: 0.9, video: 0.7, code: 0.6 };
  var KIND_ORDER = ['section', 'course', 'faculty', 'tool', 'module', 'concept', 'note', 'slides', 'video', 'code', 'plan'];
  var K1 = 1.2, B = 0.45;

  function foldCh(c) {
    var n = c.charCodeAt(0);
    if (n >= 0x0660 && n <= 0x0669) return String.fromCharCode(48 + n - 0x0660);
    if (n >= 0x06F0 && n <= 0x06F9) return String.fromCharCode(48 + n - 0x06F0);
    return FOLD[c] || c;
  }
  function fold(s) { return String(s == null ? '' : s).toLowerCase().replace(FOLD_RE, foldCh); }
  function clean(s) { return String(s == null ? '' : s).replace(AR_MARKS, '').replace(/\s+/g, ' ').trim(); }
  function norm(s) { return fold(clean(s)); }

  function stem(t) {
    if (/[0-9]/.test(t)) return t;
    var c = t.charCodeAt(0);
    if (c >= 0x0621) {
      if (t.length >= 5 && AR_PRE.test(t)) t = t.replace(AR_PRE, '');
      else if (t.length >= 4 && (t.slice(0, 2) === 'ال' || t.slice(0, 2) === 'لل')) t = t.slice(2);
      if (t.length >= 5 && AR_PL.test(t)) t = t.slice(0, -2);
      if (t.length >= 4 && t.charAt(t.length - 1) === 'ه') t = t.slice(0, -1);
      if (t.length >= 5 && t.charAt(t.length - 1) === 'ي') t = t.slice(0, -1);
      return t;
    }
    if (t.length <= 3 || /[+#]/.test(t)) return t;
    if (/ies$/.test(t) && t.length > 4) return t.slice(0, -3) + 'y';
    if (/sses$/.test(t)) return t.slice(0, -2);
    if (/(?:x|z|ch|sh|ss)es$/.test(t)) return t.slice(0, -2);
    if (/[^su]s$/.test(t)) return t.slice(0, -1);
    if (/ing$/.test(t) && t.length > 5) return t.slice(0, -3);
    if (/ed$/.test(t) && t.length > 4) return t.slice(0, -2);
    return t;
  }

  function tokens(folded) { return folded.match(TOKEN_RE) || []; }

  function joinCodes(q) {
    return q.replace(/(^|[^a-z0-9])([a-z]{2,5})\s+(\d{3})(?![0-9])/g, '$1$2$3')
      .replace(/(^|[^a-z0-9])m0+(\d)/g, '$1m$2');
  }

  function parse(raw) {
    var q = norm(raw);
    var out = { terms: [], neg: [], phrases: [], filters: {}, prefix: '' };
    q = q.replace(/"([^"]+)"/g, function (_, p) {
      var ph = norm(p);
      if (ph) out.phrases.push(ph);
      tokens(joinCodes(ph)).forEach(function (t) { out.terms.push(stem(t)); });
      return ' ';
    });
    q = q.replace(/(^|\s)(type|k|course|c|level|l|in|lang)\s*:\s*([^\s]+)/g, function (_, sp, key, val) {
      key = { k: 'type', c: 'course', l: 'level' }[key] || key;
      out.filters[key] = val.split(',').filter(Boolean);
      return ' ';
    });
    q = joinCodes(q);
    var endsOpen = /[a-z0-9ء-ي]$/.test(q);
    var parts = q.split(/\s+/).filter(Boolean);
    parts.forEach(function (p, i) {
      var neg = p.charAt(0) === '-' && p.length > 1;
      var tk = tokens(neg ? p.slice(1) : p);
      tk.forEach(function (t, j) {
        if (neg) { out.neg.push(stem(t)); return; }
        var last = endsOpen && i === parts.length - 1 && j === tk.length - 1;
        if (last && t.length >= 2) out.prefix = t;
        else out.terms.push(stem(t));
      });
    });
    var seen = {};
    out.terms = out.terms.filter(function (t) { if (seen[t] || !t) return false; seen[t] = 1; return true; });
    if (out.prefix && seen[stem(out.prefix)] && out.terms.length) out.prefix = '';
    return out;
  }

  var CODES = [], CODE_IX = {}, SEP = '\u0001';
  function codeIx(c) {
    var k = CODE_IX[c];
    if (k === undefined) { k = CODES.length; CODES.push(c); CODE_IX[c] = k; }
    return k;
  }
  function nFields(d) { return d.fc ? d.fc.length : 0; }
  function fText(d, i) { return d.tx.slice(d.fo[i], d.fo[i + 1] - 1); }
  function fCode(d, i) { return CODES[d.fc[i]]; }
  function fLang(d, i) { return d.fg[i] ? 'en' : 'ar'; }
  function fAnchor(d, i) { return d.fa ? d.fa[i] : undefined; }
  function fields(d) {
    var out = [];
    for (var i = 0; i < nFields(d); i++) {
      var a = fAnchor(d, i);
      out.push(a ? [fCode(d, i), fLang(d, i), fText(d, i), a] : [fCode(d, i), fLang(d, i), fText(d, i)]);
    }
    return out;
  }

  function Builder() {
    this.docs = [];
    this.post = new Map();
    this.lens = [];
  }
  Builder.prototype.add = function (d) {
    var di = this.docs.length;
    var tf = new Map();
    var len = 0;
    function put(term, w) { tf.set(term, (tf.get(term) || 0) + w); }
    var codes = [];
    if (d.c) codes.push(d.c);
    (d.a || []).forEach(function (p) { codes.push(p[0]); });
    codes.forEach(function (c) { put(fold(c), W.cc); });
    if (d.m) put('m' + d.m, W.mm);
    var f = d.f || [], i, j, at = 0, fa = null;
    var parts = new Array(f.length), fo = new Int32Array(f.length + 1);
    var fc = new Uint8Array(f.length), fg = new Uint8Array(f.length);
    for (i = 0; i < f.length; i++) {
      var raw = String(f[i][2] == null ? '' : f[i][2]);
      parts[i] = raw; fo[i] = at; at += raw.length + 1;
      fc[i] = codeIx(f[i][0]);
      fg[i] = f[i][1] === 'en' ? 1 : 0;
      if (f[i][3]) { if (!fa) fa = {}; fa[i] = f[i][3]; }
      var w = W[f[i][0]] || 1;
      var tk = tokens(fold(raw));
      len += tk.length;
      for (j = 0; j < tk.length; j++) {
        var t = tk[j], s = stem(t);
        put(s, w);
        if (s !== t) put(t, w * 0.15);
      }
    }
    fo[f.length] = at;
    d.tx = f.length ? parts.join(SEP) + SEP : '';
    d.fo = fo; d.fc = fc; d.fg = fg;
    if (fa) d.fa = fa;
    delete d.f;
    d._t = [fold(d.t && d.t[0]), fold(d.t && d.t[1])];
    var ts = tokens(d._t[0] + ' ' + d._t[1]);
    d._ts = ts.map(stem).concat(ts);
    this.docs.push(d);
    this.lens.push(len);
    var post = this.post;
    tf.forEach(function (w, t) {
      var p = post.get(t);
      if (!p) { p = { ids: new Int32Array(2), w: new Float32Array(2), n: 0 }; post.set(t, p); }
      if (p.n === p.ids.length) {
        var ni = new Int32Array(p.n * 2), nw = new Float32Array(p.n * 2);
        ni.set(p.ids); nw.set(p.w); p.ids = ni; p.w = nw;
      }
      p.ids[p.n] = di; p.w[p.n] = w; p.n++;
    });
  };
  Builder.prototype.done = function () {
    var N = this.docs.length, sum = 0, i;
    for (i = 0; i < N; i++) sum += this.lens[i];
    var dict = new Map();
    this.post.forEach(function (p, t) {
      dict.set(t, { ids: p.ids.slice(0, p.n), w: p.w.slice(0, p.n) });
    });
    this.post = null;
    var terms = Array.from(dict.keys()).sort();
    return { v: VERSION, docs: this.docs, N: N, avg: N ? sum / N : 1, lens: Float32Array.from(this.lens), dict: dict, terms: terms };
  };

  function build(docs) {
    var b = new Builder();
    for (var i = 0; i < docs.length; i++) b.add(docs[i]);
    return b.done();
  }

  function lower(arr, x) {
    var lo = 0, hi = arr.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (arr[mid] < x) lo = mid + 1; else hi = mid; }
    return lo;
  }

  function expand(idx, pre, cap) {
    var out = [], i = lower(idx.terms, pre);
    for (; i < idx.terms.length && out.length < 4000; i++) {
      var t = idx.terms[i];
      if (t.slice(0, pre.length) !== pre) break;
      out.push(t);
    }
    if (out.length > cap) {
      out.sort(function (a, b) { return idx.dict.get(b).ids.length - idx.dict.get(a).ids.length; });
      out.length = cap;
    }
    return out;
  }

  function edits1(a, b) {
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, e = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++e > 1) return false;
      if (la > lb) i++;
      else if (lb > la) j++;
      else if (i + 1 < la && a[i] === b[j + 1] && a[i + 1] === b[j]) { i += 2; j += 2; }
      else { i++; j++; }
    }
    return e + (la - i) + (lb - j) <= 1;
  }

  function fuzzy(idx, t) {
    if (t.length < 4 || /[0-9]/.test(t)) return null;
    var first = t.charAt(0), i = lower(idx.terms, first), best = null, bestN = 0;
    for (; i < idx.terms.length; i++) {
      var c = idx.terms[i];
      if (c.charAt(0) !== first) break;
      if (Math.abs(c.length - t.length) > 1 || !edits1(t, c)) continue;
      var n = idx.dict.get(c).ids.length;
      if (n > bestN) { best = c; bestN = n; }
    }
    return best;
  }

  function idf(idx, n) { return Math.log(1 + (idx.N - n + 0.5) / (n + 0.5)); }

  function groupScores(idx, alts, boostFirst) {
    var m = new Map();
    for (var a = 0; a < alts.length; a++) {
      var p = idx.dict.get(alts[a]);
      if (!p) continue;
      var f = idf(idx, p.ids.length) * (a === 0 && boostFirst ? 1 : 0.85);
      for (var k = 0; k < p.ids.length; k++) {
        var d = p.ids[k], tf = p.w[k];
        var dl = idx.lens[d] / idx.avg;
        var s = f * (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * dl));
        var cur = m.get(d);
        if (cur === undefined || s > cur) m.set(d, s);
      }
    }
    return m;
  }

  function fieldOk(d, codes, needles) {
    var ftx = null;
    for (var i = 0; i < nFields(d); i++) {
      if (codes.indexOf(fCode(d, i)) < 0) continue;
      if (ftx === null) ftx = fold(d.tx);
      var seg = ftx.slice(d.fo[i], d.fo[i + 1] - 1), ok = true;
      for (var j = 0; j < needles.length && ok; j++) if (seg.indexOf(needles[j]) < 0) ok = false;
      if (ok) return true;
    }
    return false;
  }

  function hasPhrase(d, ph) {
    if (d.tx && fold(d.tx).indexOf(ph) >= 0) return true;
    return d._t[0].indexOf(ph) >= 0 || d._t[1].indexOf(ph) >= 0;
  }

  function codesOf(d) {
    var out = d.c ? [d.c.toLowerCase()] : [];
    (d.a || []).forEach(function (p) { out.push(String(p[0]).toLowerCase()); });
    return out;
  }

  function search(idx, raw, opts) {
    opts = opts || {};
    var t0 = Date.now();
    var P = typeof raw === 'string' ? parse(raw) : raw;
    var res = { q: raw, total: 0, hits: [], facets: { type: {}, level: {}, course: {} }, terms: [], suggest: null, relaxed: false };
    var groups = [], fixes = {};
    P.terms.forEach(function (t) {
      var alts = idx.dict.has(t) ? [t] : [];
      if (!alts.length) {
        var fz = fuzzy(idx, t);
        if (fz) { alts = [fz]; fixes[t] = fz; }
      }
      groups.push({ t: t, alts: alts });
    });
    if (P.prefix) {
      var pre = P.prefix, st = stem(pre);
      var alts = expand(idx, pre, 48);
      if (st !== pre && idx.dict.has(st) && alts.indexOf(st) < 0) alts.unshift(st);
      if (!alts.length) {
        var fp = fuzzy(idx, st);
        if (fp) { alts = [fp]; fixes[pre] = fp; }
      }
      groups.push({ t: pre, alts: alts, prefix: true });
    }
    var fx = Object.keys(fixes);
    if (fx.length) res.suggest = fx.reduce(function (s, k) { return s.split(k).join(fixes[k]); }, P.terms.concat(P.prefix ? [P.prefix] : []).join(' '));
    res.terms = groups.map(function (g) { return { t: g.t, alts: g.alts.slice(0, 12), prefix: !!g.prefix }; });
    if (!groups.length && !P.phrases.length) { res.ms = Date.now() - t0; return res; }

    var maps = groups.map(function (g) { return groupScores(idx, g.alts, !g.prefix); });
    function combine(needAll) {
      var acc = new Map();
      if (!maps.length) return acc;
      var order = maps.map(function (m, i) { return i; }).sort(function (a, b) { return maps[a].size - maps[b].size; });
      if (needAll) {
        maps[order[0]].forEach(function (s, d) {
          var tot = s;
          for (var k = 1; k < order.length; k++) {
            var v = maps[order[k]].get(d);
            if (v === undefined) return;
            tot += v;
          }
          acc.set(d, tot);
        });
      } else {
        maps.forEach(function (m) { m.forEach(function (s, d) { acc.set(d, (acc.get(d) || 0) + s); }); });
      }
      return acc;
    }
    var acc = combine(true);
    if (!acc.size && maps.length > 1 && opts.relax !== false) { acc = combine(false); res.relaxed = acc.size > 0; }
    if (!groups.length && P.phrases.length) {
      acc = new Map();
      for (var di = 0; di < idx.N; di++) acc.set(di, 0.1);
    }

    var negSet = new Set();
    P.neg.forEach(function (t) { var p = idx.dict.get(t); if (p) for (var k = 0; k < p.ids.length; k++) negSet.add(p.ids[k]); });
    var inCodes = null;
    if (P.filters['in']) {
      inCodes = [];
      P.filters['in'].forEach(function (g) { (GROUPS[g] || [g]).forEach(function (c) { inCodes.push(c); }); });
    }
    var needles = groups.map(function (g) { return g.prefix ? g.t : g.alts[0] || g.t; }).filter(Boolean);
    var fType = P.filters.type, fCourse = P.filters.course, fLevel = P.filters.level;
    var qTitle = norm(typeof raw === 'string' ? raw.replace(/"/g, '') : '');
    var base = [];
    acc.forEach(function (s, d) {
      if (negSet.has(d)) return;
      var doc = idx.docs[d];
      if (opts.allow && !opts.allow(doc)) return;
      for (var p = 0; p < P.phrases.length; p++) if (!hasPhrase(doc, P.phrases[p])) return;
      if (inCodes && !fieldOk(doc, inCodes, needles)) return;
      var score = s * (KIND_BOOST[doc.k] || 1);
      if (groups.length) {
        var cov = 0;
        for (var g = 0; g < groups.length; g++) {
          var G = groups[g], hit = false;
          for (var z = 0; z < doc._ts.length && !hit; z++) {
            var w = doc._ts[z];
            if (G.prefix ? w.indexOf(G.t) === 0 || G.alts.indexOf(w) >= 0 : G.alts.indexOf(w) >= 0) hit = true;
          }
          if (hit) cov++;
        }
        cov /= groups.length;
        score *= 1 + 0.9 * cov + (cov === 1 ? 0.4 : 0);
      }
      if (qTitle && qTitle.length >= 2) {
        if (doc._t[0] === qTitle || doc._t[1] === qTitle) score *= 2.2;
        else if (doc._t[0].indexOf(qTitle) === 0 || doc._t[1].indexOf(qTitle) === 0) score *= 1.6;
        else if (doc._t[0].indexOf(qTitle) >= 0 || doc._t[1].indexOf(qTitle) >= 0) score *= 1.3;
      }
      if (opts.boost && opts.boost(doc)) score *= opts.boostBy || 1.3;
      base.push({ d: d, s: score });
    });

    var hits = [];
    base.forEach(function (h) {
      var doc = idx.docs[h.d], cs = codesOf(doc);
      var okT = !fType || fType.indexOf(doc.k) >= 0;
      var okC = !fCourse || fCourse.some(function (c) { return cs.indexOf(c) >= 0; });
      var okL = !fLevel || fLevel.indexOf(String(doc.l)) >= 0;
      if (okC && okL) res.facets.type[doc.k] = (res.facets.type[doc.k] || 0) + 1;
      if (okT && okC) res.facets.level[doc.l] = (res.facets.level[doc.l] || 0) + 1;
      if (okT && okL && doc.c) res.facets.course[doc.c] = (res.facets.course[doc.c] || 0) + 1;
      if (okT && okC && okL) hits.push(h);
    });
    hits.sort(function (a, b) {
      if (b.s !== a.s) return b.s - a.s;
      var ka = KIND_ORDER.indexOf(idx.docs[a.d].k), kb = KIND_ORDER.indexOf(idx.docs[b.d].k);
      if (ka !== kb) return ka - kb;
      return (idx.docs[a.d].t[0] || '').length - (idx.docs[b.d].t[0] || '').length;
    });
    res.total = hits.length;
    var off = Math.max(0, opts.offset | 0), lim = Math.min(Math.max(1, opts.limit || 20), 300);
    var re = matcher(groups, P.phrases);
    res.hits = hits.slice(off, off + lim).map(function (h) {
      var doc = idx.docs[h.d];
      var o = { i: doc.i, k: doc.k, c: doc.c || '', l: doc.l || 0, m: doc.m || 0, t: doc.t, u: doc.u, s: Math.round(h.s * 100) / 100 };
      if (doc.a) o.a = doc.a;
      if (doc.x) o.x = doc.x;
      var sn = snippet(doc, re, opts.lang, inCodes, P.phrases);
      if (sn) o.sn = sn;
      o.th = [marks(doc.t[0], re), marks(doc.t[1], re)];
      return o;
    });
    res.ms = Date.now() - t0;
    return res;
  }

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function matcher(groups, phrases) {
    var alts = [];
    groups.forEach(function (g) {
      (g.prefix ? [g.t] : g.alts.length ? g.alts : [g.t]).forEach(function (a) { if (a) alts.push(esc(a)); });
    });
    phrases.forEach(function (p) { alts.push(esc(p)); });
    if (!alts.length) return null;
    alts.sort(function (a, b) { return b.length - a.length; });
    return new RegExp('(^|[^a-z0-9\\u0621-\\u064A])((?:\\u0648\\u0627\\u0644|\\u0628\\u0627\\u0644|\\u0643\\u0627\\u0644|\\u0641\\u0627\\u0644|\\u0627\\u0644|\\u0644\\u0644|\\u0648|\\u0628|\\u0644|\\u0641)?)(' + alts.join('|') + ')', 'g');
  }

  function ranges(folded, re) {
    var out = [];
    if (!re) return out;
    re.lastIndex = 0;
    var m;
    while ((m = re.exec(folded)) && out.length < 40) {
      var s = m.index + m[1].length + m[2].length;
      var e = s + m[3].length;
      while (e < folded.length && /[a-z0-9ء-ي]/.test(folded.charAt(e))) e++;
      out.push([s, e]);
      if (re.lastIndex === m.index) re.lastIndex++;
    }
    return out;
  }

  function marks(text, re) {
    if (!text) return [];
    return ranges(fold(text), re);
  }

  function snippet(doc, re, lang, inCodes, phrases) {
    if (!re) return null;
    var best = -1, bestScore = 0, bestR = null;
    var ftx = doc.tx ? fold(doc.tx) : '';
    for (var i = 0; i < nFields(doc); i++) {
      var fc = fCode(doc, i);
      if (inCodes && inCodes.indexOf(fc) < 0) continue;
      var seg = ftx.slice(doc.fo[i], doc.fo[i + 1] - 1);
      var r = ranges(seg, re);
      if (!r.length) continue;
      var uniq = {};
      r.forEach(function (x) { uniq[seg.slice(x[0], x[1])] = 1; });
      var sc = Object.keys(uniq).length * 10 + Math.min(r.length, 5);
      if (lang && fLang(doc, i) === lang) sc += 6;
      for (var p = 0; phrases && p < phrases.length; p++) if (seg.indexOf(phrases[p]) >= 0) sc += 30;
      if (fc === 'ti' || fc === 'cc') sc -= 8;
      if (sc > bestScore) { best = i; bestScore = sc; bestR = r; }
    }
    if (best < 0) return null;
    var text = fText(doc, best), R = bestR, SPAN = 180;
    var start = Math.max(0, R[0][0] - 50);
    if (start > 0) { var sp = text.lastIndexOf(' ', start); start = sp > start - 20 ? sp + 1 : start; }
    var end = Math.min(text.length, start + SPAN);
    if (end < text.length) { var sp2 = text.indexOf(' ', end); end = sp2 > 0 && sp2 < end + 20 ? sp2 : end; }
    var h = [];
    R.forEach(function (x) { if (x[0] >= start && x[1] <= end) h.push([x[0] - start, x[1] - start]); });
    var o = { f: fCode(doc, best), g: fLang(doc, best), s: text.slice(start, end), h: h, pre: start > 0, post: end < text.length };
    if (fAnchor(doc, best)) o.a = fAnchor(doc, best);
    return o;
  }

  function runsText(rt) {
    if (!Array.isArray(rt)) return '';
    var s = '';
    for (var i = 0; i < rt.length; i++) if (rt[i] && rt[i].s != null) s += rt[i].s;
    return s;
  }
  function blockTexts(b) {
    var out = [];
    if (!b) return out;
    if (b.ty === 'code') { out.push(String(b.src || '')); return out; }
    if (b.ty === 'math') { out.push(String(b.tex || '')); return out; }
    if (b.ty === 'img') { if (typeof b.alt === 'string') out.push(b.alt); return out; }
    if (Array.isArray(b.rt)) out.push(runsText(b.rt));
    if (Array.isArray(b.items)) b.items.forEach(function (it) { out.push(runsText((it && it.rt) || [])); });
    if (Array.isArray(b.rows)) b.rows.forEach(function (row) {
      (row || []).forEach(function (c) { out.push(runsText((c && c.rt) || [])); });
    });
    return out;
  }
  function langOf(t) { return /[\u0600-\u06FF]/.test(t) ? 'ar' : 'en'; }
  function noteDoc(rec, doc) {
    if (!rec || !rec.id || typeof rec.d === 'number') return null;
    var f = [], title = clean(rec.t || '');
    if (title) f.push(['ti', langOf(title), title]);
    (rec.g || []).forEach(function (g) { g = clean(g); if (g) f.push(['tg', langOf(g), g]); });
    var blocks = doc && Array.isArray(doc.blocks) ? doc.blocks : [];
    for (var i = 0; i < blocks.length; i++) {
      var ts = blockTexts(blocks[i]);
      for (var j = 0; j < ts.length; j++) {
        var t = clean(ts[j]);
        if (t) f.push(['nb', langOf(t), t.length > 20000 ? t.slice(0, 20000) : t]);
      }
    }
    var o = rec.o || {};
    return { i: 'n:' + rec.id, k: 'note', c: o.c ? String(o.c) : '', l: 0, m: Number(o.m) || 0,
             t: [title || '…', title || '…'], u: 'hub/notes.html?id=' + encodeURIComponent(rec.id), f: f,
             x: { up: rec.updated_at || rec.ca || 0, id: rec.id } };
  }

  function parseJsonl(text) {
    var out = [], lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) if (lines[i]) out.push(JSON.parse(lines[i]));
    return out;
  }

  return {
    version: VERSION, fold: fold, clean: clean, norm: norm, stem: stem, tokens: tokens,
    parse: parse, build: build, Builder: Builder, search: search, parseJsonl: parseJsonl, noteDoc: noteDoc, fields: fields,
    GROUPS: GROUPS, WEIGHTS: W
  };
});
