;(function () {
  'use strict';

  var LOAD = 4;
  var SEG = typeof WeakMap === 'function' ? new WeakMap() : null;
  var RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

  /*@3.NOPJ7.8*/
  function inkWords(sp, cv) {
    if (!sp || !cv || !sp.firstChild || sp.firstChild.nodeType !== 3) return null;
    var memo = SEG ? SEG.get(sp) : null;
    if (memo && memo.cv === cv && memo.w === cv.width && memo.t === sp.firstChild.data) return memo.v;
    var v = null;
    try { v = segment(sp, cv); } catch (e) { v = null; }
    if (SEG) SEG.set(sp, { cv: cv, w: cv.width, t: sp.firstChild.data, v: v });
    return v;
  }

  function segment(sp, cv) {
    var tx = sp.firstChild.data || '';
    var words = [], re = /\S+/g, m;
    while ((m = re.exec(tx))) words.push({ a: m.index, b: m.index + m[0].length });
    if (words.length < 2) return null;
    var R = sp.getBoundingClientRect(), C = cv.getBoundingClientRect();
    if (!(R.width > 4) || !(R.height > 2) || !(C.width > 0) || !(C.height > 0)) return null;
    var kx = cv.width / C.width, ky = cv.height / C.height;
    var x0 = Math.max(0, Math.floor((R.left - C.left) * kx));
    var x1 = Math.min(cv.width, Math.ceil((R.right - C.left) * kx));
    var y0 = Math.max(0, Math.floor((R.top - C.top + R.height * 0.15) * ky));
    var y1 = Math.min(cv.height, Math.ceil((R.bottom - C.top - R.height * 0.12) * ky));
    var W = x1 - x0, H = y1 - y0;
    if (W < 8 || H < 2) return null;
    var px = cv.getContext('2d').getImageData(x0, y0, W, H).data;
    var hist = new Array(33).join('0').split('').map(Number), i, x, y;
    var lum = function (k) { return (px[k] * 299 + px[k + 1] * 587 + px[k + 2] * 114) / 1000; };
    for (i = 0; i < px.length; i += 4) hist[Math.min(31, lum(i) >> 3)]++;
    var bg = 0;
    for (i = 1; i < 32; i++) if (hist[i] > hist[bg]) bg = i;
    var bgL = bg * 8 + 4, ink = new Array(W);
    for (x = 0; x < W; x++) {
      ink[x] = 0;
      for (y = 0; y < H; y++) { if (Math.abs(lum((y * W + x) * 4) - bgL) > 70) { ink[x] = 1; break; } }
    }
    var runs = [], st = -1;
    for (x = 0; x <= W; x++) {
      if (x < W && ink[x]) { if (st < 0) st = x; }
      else if (st >= 0) { runs.push({ s: st, e: x }); st = -1; }
    }
    /*@3.NOPJ7.9*/
    var sliver = Math.max(2, 3 * kx);
    while (runs.length > 1 && runs[runs.length - 1].e - runs[runs.length - 1].s <= sliver && runs[runs.length - 1].e >= W - 1 &&
           runs[runs.length - 1].s - runs[runs.length - 2].e >= 2) runs.pop();
    while (runs.length > 1 && runs[0].e - runs[0].s <= sliver && runs[0].s <= 1 && runs[1].s - runs[0].e >= 2) runs.shift();
    if (runs.length < words.length) return null;
    var gaps = [];
    for (i = 1; i < runs.length; i++) gaps.push({ k: i, w: runs[i].s - runs[i - 1].e });
    var need = words.length - 1;
    var by = gaps.slice().sort(function (p, q) { return q.w - p.w; });
    var cut = by[need - 1], next = by[need];
    var at = {};
    /*@3.NOPJ7.10*/
    if (cut && cut.w >= Math.max(2, H * 0.12) && (!next || (cut.w >= next.w * 1.3 && cut.w - next.w >= 2))) {
      for (i = 0; i < need; i++) at[by[i].k] = 1;
    } else if (!guided(sp, words, runs, gaps, x0, kx, C, at)) return null;
    var segs = [], from = runs[0].s;
    for (i = 1; i < runs.length; i++) {
      if (at[i]) { segs.push({ s: from, e: runs[i - 1].e }); from = runs[i].s; }
    }
    segs.push({ s: from, e: runs[runs.length - 1].e });
    if (segs.length !== words.length) return null;
    if (RTL_RE.test(tx)) segs.reverse();
    for (i = 0; i < words.length; i++) {
      words[i].l = C.left + (x0 + segs[i].s) / kx;
      words[i].r = C.left + (x0 + segs[i].e) / kx;
    }
    return { w: words, top: R.top, bottom: R.bottom };
  }

  function guided(sp, words, runs, gaps, x0, kx, C, at) {
    var node = sp.firstChild, big = 0, i, j;
    for (i = 0; i < gaps.length; i++) big = Math.max(big, gaps[i].w);
    var minW = Math.max(2, big * 0.6), last = 0;
    for (i = 0; i < words.length - 1; i++) {
      var rg = document.createRange();
      try { rg.setStart(node, words[i].b); rg.setEnd(node, words[i + 1].a); } catch (e) { return false; }
      var r = rg.getBoundingClientRect();
      if (!(r.width >= 0) || !r.height) return false;
      var want = ((r.left + r.right) / 2 - C.left) * kx - x0, tol = Math.max(6, (r.width || 4) * 1.5) * kx;
      var best = -1, bd = 1e9;
      for (j = 0; j < gaps.length; j++) {
        var g = gaps[j];
        if (g.w < minW || g.k <= last) continue;
        var mid = (runs[g.k - 1].e + runs[g.k].s) / 2, d = Math.abs(mid - want);
        if (d < bd) { bd = d; best = g.k; }
      }
      if (best < 0 || bd > tol) return false;
      at[best] = 1;
      last = best;
    }
    return true;
  }

  function xAt(ws, off, end) {
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (end ? off <= w.b : off < w.b) {
        if (off <= w.a) return end && i > 0 ? ws[i - 1].r : w.l;
        return w.l + (off - w.a) / (w.b - w.a) * (w.r - w.l);
      }
    }
    return ws[ws.length - 1].r;
  }

  function inkRect(seg, a, b) {
    var L = xAt(seg.w, a, false), Rr = xAt(seg.w, b, true);
    var l = Math.min(L, Rr), r = Math.max(L, Rr);
    if (!(r - l > 0.5)) return null;
    return { left: l, right: r, top: seg.top, bottom: seg.bottom, width: r - l, height: seg.bottom - seg.top };
  }

  function create(o) {
    var h = o.handle;
    var view = o.view;
    var n = h.doc.numPages;
    var pg = new Array(n + 1);
    var st = { done: 0, dead: false, q: '', hits: [], cur: -1, scanning: false, ocr: '' };
    var oc = null, ot = {};

    function tell() {
      if (o.onState) {
        o.onState({ q: st.q, total: st.hits.length, cur: st.cur,
                    scanned: st.done, pages: n, scanning: st.scanning, ocr: st.ocr });
      }
    }

    /*@3.NOPJ7.1*/
    function grab(i) {
      if (st.dead || pg[i]) return Promise.resolve();
      return h.doc.getPage(i).then(function (p) {
        return p.getTextContent({ includeMarkedContent: false }).then(function (tc) {
          if (st.dead) return;
          var T = window.GardenPdfText;
          var b = T.fromItems(tc.items || []);
          var f = T.mapFold(b.t);
          pg[i] = { t: b.t, r: b.r, f: f.t, m: f.m };
          try { p.cleanup(); } catch (e) {}
        });
      }).catch(function () { pg[i] = { t: '', r: [], f: '', m: [0] }; });
    }

    /*@3.NOPJ7.2*/
    function scan(from) {
      if (st.scanning || st.dead) return Promise.resolve();
      st.scanning = true;
      var i = 1;
      var seq = [];
      var start = Math.max(1, Math.min(n, from || 1));
      for (var k = 0; k < n; k++) seq.push(((start - 1 + k) % n) + 1);
      var at = 0;
      var lanes = [];
      var run = function () {
        if (st.dead || at >= seq.length) return Promise.resolve();
        var idx = seq[at++];
        return grab(idx).then(function () {
          st.done++;
          if (st.q && pg[idx]) addPage(idx);
          if (st.done % 12 === 0 || st.done === n) { tell(); if (o.onProgress) o.onProgress(st.done, n); }
          return new Promise(function (r) { setTimeout(r, 0); }).then(run);
        });
      };
      for (i = 0; i < LOAD; i++) lanes.push(run());
      return Promise.all(lanes).then(function () {
        st.scanning = false;
        sortHits();
        tell();
      });
    }

    function sortHits() {
      st.hits.sort(function (a, b) { return a.p - b.p || a.s - b.s; });
    }

    function ocrOf(i) {
      if (!oc || !oc[i]) return null;
      if (ot[i]) return ot[i];
      var T = window.GardenPdfText, txt = '', ws = [], L = oc[i], a, b;
      for (a = 0; a < L.length; a++) {
        var line = L[a] || [], words = line[5] || [];
        if (a) txt += '\n';
        for (b = 0; b < words.length; b++) {
          var w = words[b];
          if (b) txt += ' ';
          ws.push({ s: txt.length, e: txt.length + String(w[4]).length, x: +w[0], y: +w[1], w: +w[2], h: +w[3] });
          txt += String(w[4]);
        }
      }
      var f = T.mapFold(txt);
      ot[i] = { t: txt, f: f.t, m: f.m, ws: ws };
      return ot[i];
    }

    function ocrPage(i) {
      var d = ocrOf(i);
      if (!d) return;
      var q = st.q, at = 0, guard = 0;
      while (guard++ < 5000) {
        var j = d.f.indexOf(q, at);
        if (j < 0) break;
        at = j + Math.max(1, q.length);
        var s = d.m[j];
        var e = d.m[Math.min(d.m.length - 1, j + q.length)];
        if (e > s) st.hits.push({ p: i, s: s, e: e, o: 1 });
      }
    }

    function setOcr(data, state) {
      if (st.dead) return;
      st.ocr = state || (data ? 'ready' : '');
      if (data && data.p) { oc = data.p; ot = {}; }
      if (st.q && oc) {
        st.hits = st.hits.filter(function (x) { return !x.o; });
        for (var k in oc) if (oc.hasOwnProperty(k) && +k >= 1 && +k <= n) ocrPage(+k);
        sortHits();
        repaintAll();
      }
      tell();
    }

    function addPage(i) {
      var d = pg[i];
      if (!st.q) return;
      ocrPage(i);
      if (!d) return;
      var q = st.q, at = 0, guard = 0;
      while (guard++ < 5000) {
        var j = d.f.indexOf(q, at);
        if (j < 0) break;
        at = j + Math.max(1, q.length);
        var s = d.m[j];
        var e = d.m[Math.min(d.m.length - 1, j + q.length)];
        if (e > s) st.hits.push({ p: i, s: s, e: e });
      }
    }

    /*@3.NOPJ7.3*/
    function search(raw) {
      var T = window.GardenPdfText;
      var q = T.query(raw);
      st.q = q;
      st.hits = [];
      st.cur = -1;
      if (q) {
        for (var i = 1; i <= n; i++) if (pg[i] || (oc && oc[i])) addPage(i);
        sortHits();
      }
      repaintAll();
      tell();
      if (q && !st.scanning && st.done < n) scan(view ? view.mid() : 1);
      return st.hits.length;
    }

    function nearest(dir) {
      if (!st.hits.length) return -1;
      if (st.cur >= 0) {
        var k = st.cur + (dir < 0 ? -1 : 1);
        if (k < 0) k = st.hits.length - 1;
        if (k >= st.hits.length) k = 0;
        return k;
      }
      var here = view ? view.mid() : 1;
      for (var i = 0; i < st.hits.length; i++) if (st.hits[i].p >= here) return i;
      return 0;
    }

    /*@3.NOPJ7.4*/
    function jump(k) {
      if (k < 0 || k >= st.hits.length) return;
      st.cur = k;
      var hit = st.hits[k];
      st.want = hit;
      if (view) view.goTo(hit.p, 0);
      repaintAll();
      tell();
      reveal(hit);
    }

    function next() { jump(nearest(1)); }
    function prev() { jump(nearest(-1)); }

    function runs(i, s, e) {
      var d = pg[i];
      if (!d) return [];
      var out = [];
      for (var k = 0; k < d.r.length; k++) {
        var r = d.r[k];
        if (r.i < 0 || r.e <= s || r.s >= e) continue;
        var a = Math.max(s, r.s) - r.s;
        var b = Math.min(e, r.e) - r.s;
        if (b > a) out.push({ i: r.i, a: a, b: b });
      }
      return out;
    }

    /*@3.NOPJ7.5*/
    function rectsOf(i, td, hit) {
      var spans = td.querySelectorAll('span');
      var list = [];
      var parts = runs(i, hit.s, hit.e);
      var cv = view && view.slots && view.slots[i] ? view.slots[i].cv : null;
      for (var k = 0; k < parts.length; k++) {
        var sp = spans[parts[k].i];
        if (!sp || !sp.firstChild) continue;
        var node = sp.firstChild;
        var a = Math.min(parts[k].a, node.length);
        var b = Math.min(parts[k].b, node.length);
        if (b <= a) continue;
        /*@3.NOPJ7.11*/
        var seg = cv ? inkWords(sp, cv) : null;
        var ir = seg ? inkRect(seg, a, b) : null;
        if (ir) { list.push(ir); continue; }
        var rg = document.createRange();
        try { rg.setStart(node, a); rg.setEnd(node, b); } catch (e) { continue; }
        var rs = rg.getClientRects();
        for (var j = 0; j < rs.length; j++) list.push(rs[j]);
      }
      return list;
    }

    function ocrBoxes(i, hit, base) {
      var d = ocrOf(i), out = [];
      var W = (view.pw && view.pw[i]) || view.defW || 0;
      if (!d || !(W > 0) || !(base.width > 0)) return out;
      var k = base.width / W;
      for (var j = 0; j < d.ws.length; j++) {
        var w = d.ws[j];
        if (w.e <= hit.s || w.s >= hit.e) continue;
        out.push({ x: w.x * k, y: w.y * k, w: w.w * k, h: w.h * k });
      }
      return out;
    }

    function paint(i, td) {
      if (st.dead || !view) return;
      var host = view.marks ? view.marks(i) : null;
      if (!host) return;
      wipeMine(host);
      if (!st.q) return;
      var slot = view.slots && view.slots[i];
      if (!slot) return;
      var base = slot.el.getBoundingClientRect();
      var V = window.GardenPdfView;
      for (var k = 0; k < st.hits.length; k++) {
        var hit = st.hits[k];
        if (hit.p !== i) continue;
        var boxes;
        if (hit.o) boxes = ocrBoxes(i, hit, base);
        else {
          if (!td) continue;
          var rects = rectsOf(i, td, hit);
          if (!rects.length) continue;
          boxes = V.merge(rects, base.left, base.top);
        }
        var on = (k === st.cur);
        for (var j = 0; j < boxes.length; j++) {
          var b = boxes[j];
          var el = document.createElement('div');
          el.className = 'gpv-mark' + (on ? ' on' : '') + (hit.o ? ' gpv-mark--ocr' : '');
          el.setAttribute('data-k', String(k));
          el.style.insetInlineStart = b.x.toFixed(2) + 'px';
          el.style.insetBlockStart = b.y.toFixed(2) + 'px';
          el.style.inlineSize = b.w.toFixed(2) + 'px';
          el.style.blockSize = b.h.toFixed(2) + 'px';
          host.appendChild(el);
        }
      }
      if (st.want && st.want.p === i) reveal(st.want);
    }

    /*@3.NOPJ7.7*/
    function wipeMine(host) {
      var old = host.querySelectorAll('.gpv-mark');
      for (var q = 0; q < old.length; q++) old[q].remove();
    }

    function repaintAll() {
      if (!view || !view.slots) return;
      for (var k in view.slots) {
        var s = view.slots[k];
        if (s.hl) wipeMine(s.hl);
        if (s.td || (oc && oc[k])) paint(+k, s.td);
      }
    }

    /*@3.NOPJ7.6*/
    function reveal(hit) {
      if (!view || !view.slots) return;
      var s = view.slots[hit.p];
      if (!s || !s.hl) return;
      var el = s.hl.querySelector('.gpv-mark.on');
      if (!el) return;
      st.want = null;
      var sc = view.scroller;
      var r = el.getBoundingClientRect();
      var box = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0, height: view.vh() };
      var pad = 90;
      if (r.top < box.top + pad || r.bottom > box.top + box.height - pad) {
        sc.scrollTop += (r.top - box.top) - Math.max(pad, box.height * 0.3);
        view.sync();
      }
    }

    function clear() {
      st.q = ''; st.hits = []; st.cur = -1; st.want = null;
      repaintAll();
      tell();
    }

    function destroy() {
      st.dead = true;
      pg = null;
    }

    return {
      scan: scan,
      search: search,
      next: next,
      prev: prev,
      jump: jump,
      paint: paint,
      repaint: repaintAll,
      clear: clear,
      destroy: destroy,
      state: function () {
        return { q: st.q, total: st.hits.length, cur: st.cur,
                 scanned: st.done, pages: n, scanning: st.scanning, ocr: st.ocr };
      },
      hit: function (k) { return st.hits[k] || null; },
      setOcr: setOcr,
      ocrText: function (i) { var d = ocrOf(i); return d ? d.t : ''; },
      text: function (i) { return pg && pg[i] ? pg[i].t : ''; }
    };
  }

  window.GardenPdfFind = { create: create, inkWords: inkWords, inkRect: inkRect };
})();
