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

  return { split: split, assemble: assemble, hash: hash, hashes: hashes, diff: diff, chunks: chunks, byteLen: byteLen, MAX_PART: MAX_PART };
});
