/*@3.NOPJ15.1*/
(function (root, make) {
  'use strict';
  var api = make();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GardenNotesParts = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_PART = 4 * 1024 * 1024;

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }

  /*@3.NOPJ15.2*/
  function split(doc) {
    var out = {};
    if (!isObj(doc)) return out;
    var keys = Object.keys(doc);
    out.kk = JSON.stringify(keys);
    keys.forEach(function (k) {
      var v = doc[k];
      if (k === 'blocks' && Array.isArray(v)) {
        var seen = {}, order = [];
        v.forEach(function (b, i) {
          var id = (isObj(b) && b.id != null && b.id !== '') ? String(b.id) : '#' + i;
          var key = id;
          if (seen[id]) key = id + '~' + seen[id];
          seen[id] = (seen[id] || 0) + 1;
          order.push(key);
          out['b:' + key] = JSON.stringify(b);
        });
        out.o = JSON.stringify(order);
        return;
      }
      if (k === 'marks' && isObj(v) && isObj(v.pages)) {
        var rest = {};
        Object.keys(v).forEach(function (mk) { rest[mk] = mk === 'pages' ? Object.keys(v.pages) : v[mk]; });
        out['k:marks'] = JSON.stringify(rest);
        Object.keys(v.pages).forEach(function (n) { out['m:' + n] = JSON.stringify(v.pages[n]); });
        return;
      }
      out['k:' + k] = JSON.stringify(v === undefined ? null : v);
    });
    return out;
  }

  function val(p) {
    if (p == null) return undefined;
    if (typeof p !== 'string') return p;
    try { return JSON.parse(p); } catch (e) { return undefined; }
  }

  /*@3.NOPJ15.3*/
  function assemble(parts) {
    parts = parts || {};
    var kk = val(parts.kk);
    if (!Array.isArray(kk)) kk = [];
    var have = {};
    kk.forEach(function (k) { have[k] = 1; });
    Object.keys(parts).forEach(function (p) {
      if (p.indexOf('k:') === 0 && parts[p] != null && !have[p.slice(2)]) { kk.push(p.slice(2)); have[p.slice(2)] = 1; }
    });
    if (!have.blocks && (parts.o != null || Object.keys(parts).some(function (p) { return p.indexOf('b:') === 0 && parts[p] != null; }))) {
      kk.push('blocks'); have.blocks = 1;
    }
    var doc = {};
    kk.forEach(function (k) {
      if (k === 'blocks') {
        var order = val(parts.o);
        if (!Array.isArray(order)) order = [];
        var used = {}, blocks = [];
        order.forEach(function (key) {
          var b = val(parts['b:' + key]);
          if (b === undefined || used[key]) return;
          used[key] = 1;
          blocks.push(b);
        });
        /*@3.NOPJ15.4*/
        Object.keys(parts).filter(function (p) {
          return p.indexOf('b:') === 0 && !used[p.slice(2)] && parts[p] != null;
        }).sort().forEach(function (p) {
          var b = val(parts[p]);
          if (b !== undefined) blocks.push(b);
        });
        doc.blocks = blocks;
        return;
      }
      if (k === 'marks' && parts['k:marks'] != null) {
        var m = val(parts['k:marks']);
        if (isObj(m) && Array.isArray(m.pages)) {
          var pages = {}, listed = {};
          m.pages.forEach(function (n) {
            listed[n] = 1;
            var pg = val(parts['m:' + n]);
            if (pg !== undefined) pages[n] = pg;
          });
          Object.keys(parts).filter(function (p) {
            return p.indexOf('m:') === 0 && !listed[p.slice(2)] && parts[p] != null;
          }).sort().forEach(function (p) {
            var pg = val(parts[p]);
            if (pg !== undefined) pages[p.slice(2)] = pg;
          });
          var mm = {};
          Object.keys(m).forEach(function (mk) { mm[mk] = mk === 'pages' ? pages : m[mk]; });
          doc.marks = mm;
          return;
        }
        doc.marks = m;
        return;
      }
      if (parts['k:' + k] == null) return;
      var v = val(parts['k:' + k]);
      if (v !== undefined) doc[k] = v;
    });
    return doc;
  }

  /*@3.NOPJ15.5*/
  function hash(s) {
    s = String(s);
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(36) + '.' + s.length.toString(36);
  }

  function hashes(parts) {
    var h = {};
    Object.keys(parts).forEach(function (k) { if (parts[k] != null) h[k] = hash(parts[k]); });
    return h;
  }

  function diff(baseH, parts) {
    var set = {}, del = [];
    baseH = baseH || {};
    Object.keys(parts).forEach(function (k) {
      if (parts[k] == null) return;
      if (baseH[k] !== hash(parts[k])) set[k] = parts[k];
    });
    Object.keys(baseH).forEach(function (k) { if (!own(parts, k) || parts[k] == null) del.push(k); });
    return { set: set, del: del };
  }

  function byteLen(s) {
    s = String(s);
    var n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) n += 1;
      else if (c < 0x800) n += 2;
      else if (c >= 0xD800 && c <= 0xDBFF) { n += 4; i++; }
      else n += 3;
    }
    return n;
  }

  /*@3.NOPJ15.6*/
  function chunks(d, cap) {
    cap = cap || 900 * 1024;
    var tail = { kk: 1, o: 1, 'k:marks': 1 };
    var keys = Object.keys(d.set).filter(function (k) { return !tail[k]; });
    var out = [], cur = { set: {}, del: [] }, size = 0;
    keys.forEach(function (k) {
      var n = byteLen(d.set[k]) + k.length + 8;
      if (size && size + n > cap) { out.push(cur); cur = { set: {}, del: [] }; size = 0; }
      cur.set[k] = d.set[k];
      size += n;
    });
    Object.keys(tail).forEach(function (k) { if (own(d.set, k)) cur.set[k] = d.set[k]; });
    cur.del = d.del.slice();
    out.push(cur);
    return out;
  }

  /*@3.NOPJ15.7*/
  var DIFF_CAP = 4000000;
  function J(v) { return JSON.stringify(v === undefined ? null : v); }

  function pairs(o, a, eq) {
    var n = o.length, m = a.length, i, j;
    if (n * m > DIFF_CAP) return null;
    var w = m + 1, L = new Uint32Array((n + 1) * w);
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        L[i * w + j] = eq(o[i], a[j]) ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1]);
      }
    }
    var map = {};
    i = 0; j = 0;
    while (i < n && j < m) {
      if (eq(o[i], a[j])) { map[i] = j; i++; j++; }
      else if (L[(i + 1) * w + j] >= L[i * w + j + 1]) i++;
      else j++;
    }
    return map;
  }

  function same(x, y, eq) {
    if (x.length !== y.length) return false;
    for (var i = 0; i < x.length; i++) if (!eq(x[i], y[i])) return false;
    return true;
  }

  function diff3(o, a, b, eq, union) {
    var ma = pairs(o, a, eq), mb = pairs(o, b, eq);
    if (!ma || !mb) return null;
    var out = [], io = 0, ia = 0, ib = 0;
    for (;;) {
      var k = io, ak = a.length, bk = b.length;
      while (k < o.length && !(ma[k] != null && mb[k] != null)) k++;
      if (k < o.length) { ak = ma[k]; bk = mb[k]; }
      var O = o.slice(io, k), A = a.slice(ia, ak), Bc = b.slice(ib, bk);
      if (same(A, O, eq)) out = out.concat(Bc);
      else if (same(Bc, O, eq) || same(A, Bc, eq)) out = out.concat(A);
      else if (union) {
        out = out.concat(A);
        Bc.forEach(function (x) { if (!A.some(function (y) { return eq(x, y); })) out.push(x); });
      } else return null;
      if (k >= o.length) break;
      out.push(a[ak]);
      io = k + 1; ia = ak + 1; ib = bk + 1;
    }
    return out;
  }

  function toks(rt) {
    var out = [];
    (rt || []).forEach(function (r) {
      var m = {}, k;
      for (k in r) if (own(r, k) && k !== 's') m[k] = r[k];
      var mk = JSON.stringify(m), s = r.s == null ? '' : String(r.s);
      for (var i = 0; i < s.length; i++) out.push({ c: s.charAt(i), m: mk });
    });
    return out;
  }

  function runs(ts) {
    var out = [], cur = null;
    ts.forEach(function (t) {
      if (cur && cur.m === t.m) { cur.s += t.c; return; }
      cur = { m: t.m, s: t.c };
      out.push(cur);
    });
    return out.map(function (r) { var o = JSON.parse(r.m); o.s = r.s; return o; });
  }

  function eqTok(x, y) { return x.c === y.c && x.m === y.m; }
  function eqVal(x, y) { return J(x) === J(y); }

  /*@3.NOPJ15.8*/
  function mergeBlock(base, a, b) {
    if (!isObj(base) || !isObj(a) || !isObj(b)) return null;
    var out = {}, keys = {}, ok = true;
    [base, a, b].forEach(function (x) { Object.keys(x).forEach(function (k) { keys[k] = 1; }); });
    Object.keys(keys).forEach(function (k) {
      if (!ok) return;
      var vo = base[k], va = a[k], vb = b[k], v;
      if (J(va) === J(vb)) v = va;
      else if (J(va) === J(vo)) v = vb;
      else if (J(vb) === J(vo)) v = va;
      else if (Array.isArray(va) && Array.isArray(vb) && Array.isArray(vo) && va.concat(vb, vo).every(function (r) { return isObj(r) && (r.s == null || typeof r.s === 'string'); }) && k === 'rt') {
        var m = diff3(toks(vo), toks(va), toks(vb), eqTok, false);
        if (!m) { ok = false; return; }
        v = runs(m);
      } else if (typeof va === 'string' && typeof vb === 'string' && typeof vo === 'string') {
        var c = diff3(vo.split(''), va.split(''), vb.split(''), function (x, y) { return x === y; }, false);
        if (!c) { ok = false; return; }
        v = c.join('');
      } else { ok = false; return; }
      if (v !== undefined) out[k] = v;
    });
    return ok ? out : null;
  }

  function mergeList(base, a, b) {
    if (!Array.isArray(base) || !Array.isArray(a) || !Array.isArray(b)) return null;
    return diff3(base, a, b, eqVal, true);
  }

  return { split: split, assemble: assemble, hash: hash, hashes: hashes, diff: diff, chunks: chunks, byteLen: byteLen, MAX_PART: MAX_PART,
           mergeBlock: mergeBlock, mergeList: mergeList, diff3: diff3 };
});
