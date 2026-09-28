/*@3.NOAJ2.1*/
;(function (g) {
  'use strict';

  function isLeaf(b) { return !!(b && b.ty && !b.fp); }

  function leaves(blocks) {
    var out = [], i;
    if (!Array.isArray(blocks)) return out;
    for (i = 0; i < blocks.length; i++) if (isLeaf(blocks[i])) out.push({ i: i, id: blocks[i].id });
    return out;
  }

  function bandIndex(y, tops) {
    var lo = 0, hi = tops.length - 1, mid;
    if (!tops.length) return -1;
    if (!(y >= tops[0])) return 0;
    while (lo < hi) {
      mid = (lo + hi + 1) >> 1;
      if (tops[mid] <= y) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  function anchorPoint(el) {
    if (!el) return null;
    if (el.ty === 'st') {
      var p = el.pts && el.pts[0];
      return p ? { x: p.x, y: p.y } : null;
    }
    if (el.y1 == null || el.y2 == null) return null;
    return { x: Math.min(el.x1, el.x2), y: Math.min(el.y1, el.y2) };
  }

  function ownerOf(el, tops) {
    var a = anchorPoint(el);
    if (!a || !tops.length) return -1;
    if (el.ty !== 'st' || !el.pts || el.pts.length < 2) return bandIndex(a.y, tops);
    var votes = {}, best = -1, bestN = 0, i, j, n;
    for (i = 0; i < el.pts.length; i++) {
      j = bandIndex(el.pts[i].y, tops);
      n = (votes[j] || 0) + 1;
      votes[j] = n;
      if (n > bestN) { bestN = n; best = j; }
    }
    var first = bandIndex(a.y, tops);
    if (votes[first] === bestN) return first;
    return best;
  }

  function build(els, ids, tops) {
    var out = [], i, j, a;
    for (i = 0; i < els.length; i++) {
      j = ownerOf(els[i], tops);
      a = anchorPoint(els[i]);
      if (j < 0 || !a) { out.push(null); continue; }
      out.push({ b: ids[j], dy: Math.round((a.y - tops[j]) * 100) / 100 });
    }
    return out;
  }

  function place(iaEls, els, topById) {
    var out = [], i, a, e, t;
    for (i = 0; i < els.length; i++) {
      e = iaEls[i];
      a = anchorPoint(els[i]);
      t = e && topById ? topById[e.b] : null;
      if (!e || !a || t == null) { out.push(null); continue; }
      out.push(Math.round(((t + e.dy) - a.y) * 100) / 100);
    }
    return out;
  }

  function shiftEl(el, dy) {
    var i;
    if (!dy) return el;
    if (el.ty === 'st') {
      for (i = 0; i < el.pts.length; i++) el.pts[i].y += dy;
    } else if (el.y1 != null) { el.y1 += dy; el.y2 += dy; }
    if (el._bb) el._bb = null;
    return el;
  }

  function migrate(o) {
    var blocks = o.blocks || [], a = o.engA || [], ids = [], tops = [], i;
    for (i = 0; i < blocks.length; i++) {
      if (!isLeaf(blocks[i]) || a[i] == null) continue;
      ids.push(blocks[i].id); tops.push(a[i]);
    }
    if (!ids.length) return null;
    var pad = o.pad || 0;
    if (pad) for (i = 0; i < tops.length; i++) tops[i] += pad;
    var els = (o.shapes || []).concat(o.strokes || []);
    return { v: 3, n: tops.length, els: build(els, ids, tops) };
  }

  function hash(ov) {
    var s = (ov && ov.ink) ? String(ov.ink) : '';
    var sh = (ov && ov.shapes) ? ov.shapes : [];
    var h = 0x811c9dc5, i, k;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    for (k = 0; k < sh.length; k++) {
      var e = sh[k], t = [e.ty, e.x1, e.y1, e.x2, e.y2].join(',');
      for (i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    }
    return 'h:' + h.toString(16) + ':' + s.length + ':' + sh.length;
  }

  function split(iaEls, fromId, toId, ys, lead) {
    var n = 0, i, e, add = (lead > 0) ? lead : 0;
    for (i = 0; i < iaEls.length; i++) {
      e = iaEls[i];
      if (!e || e.b !== fromId || !(e.dy >= ys)) continue;
      e.b = toId; e.dy = Math.round((e.dy - ys + add) * 100) / 100; n++;
    }
    return n;
  }

  function merge(iaEls, fromId, intoId, hInto) {
    var n = 0, i, e;
    for (i = 0; i < iaEls.length; i++) {
      e = iaEls[i];
      if (!e || e.b !== fromId) continue;
      e.b = intoId; e.dy = Math.round((e.dy + hInto) * 100) / 100; n++;
    }
    return n;
  }

  function drop(iaEls, leafId, prevId, topLeaf, topPrev) {
    var n = 0, i, e, d = topLeaf - topPrev;
    for (i = 0; i < iaEls.length; i++) {
      e = iaEls[i];
      if (!e || e.b !== leafId) continue;
      e.b = prevId; e.dy = Math.round((e.dy + d) * 100) / 100; n++;
    }
    return n;
  }

  var API = {
    V: 3,
    leaves: leaves, bandIndex: bandIndex, anchorPoint: anchorPoint, ownerOf: ownerOf,
    build: build, place: place, shiftEl: shiftEl, migrate: migrate, hash: hash,
    split: split, merge: merge, drop: drop
  };
  g.GardenNotesAnchor = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
