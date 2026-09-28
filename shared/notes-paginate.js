/*@3.NOPJ9.1*/
;(function (g) {
  'use strict';

  var POLICY = {
    tbl: 'units', code: 'units', card: 'units',
    ul: 'units', ol: 'units', todo: 'units', dl: 'units',
    p: 'atomic', h: 'atomic', quote: 'atomic', callout: 'atomic',
    img: 'atomic', math: 'atomic', dgm: 'atomic', ink: 'atomic', shape: 'atomic',
    hr: 'atomic', gap: 'atomic',
    /*@3.NOPJ9.3*/
    pb: 'break',
    sticky: 'free'
  };

  function policyOf(ty) {
    var p = POLICY[ty];
    if (!p) throw new Error('paginate: no policy for block type "' + ty + '"');
    return p;
  }

  function r2(v) { return Math.round(v * 100) / 100; }
  /*@3.NOPJ9.12*/
  var BRK_TOL = 4;

  /*@3.NOPJ9.7*/
  function paginate(items, H, topPad, botPad) {
    if (!(H > 0)) throw new Error('paginate: bad page height');
    var M = (topPad > 0) ? Math.min(topPad, H * 0.4) : 0;
    /*@3.NOPJ9.9*/
    var Mb = (botPad > 0) ? Math.min(botPad, H * 0.4) : 0;
    var pages = [], segs = {}, tops = {}, cends = {}, brk = [], y = 0, cy = 0, i, k;
    function pgOf(v) { return Math.floor((v + 0.5) / H); }
    function topOf(p) { return p * H + (p > 0 ? M : 0); }
    function endOf(v) { return (pgOf(v) + 1) * H - Mb; }
    function nextTop(v) { return topOf(pgOf(v) + 1); }
    function atStart(v) { return Math.abs(v - topOf(pgOf(v))) < 0.5; }
    function inPad(v) { var p = pgOf(v); return p > 0 && v < topOf(p) - 0.5; }
    function inFoot(v) { return Mb > 0 && v > endOf(v) - 0.5; }
    function norm(v) { if (inPad(v)) return topOf(pgOf(v)); if (inFoot(v)) return nextTop(v); return v; }
    function ensure(p) { while (pages.length <= p) pages.push([]); return pages[p]; }
    function pushSlice(id, top, hh, c0, c1, u, tol) {
      var yy = top + hh, off = 0, rem = c1 - c0, first = true;
      if (rem <= 0.5) { ensure(pgOf(top)).push({ id: id, y: r2(top), cut: [r2(c0), r2(c1)], head: hh > 0, u: u || null }); return yy; }
      while (rem > 0.5) {
        yy = norm(yy);
        var p = pgOf(yy), room = endOf(yy) - yy, take = (first && tol > 0.5 && rem - room <= tol) ? rem : Math.min(rem, room);
        ensure(p).push({ id: id, y: r2(first ? top : yy), cut: [r2(c0 + off), r2(c0 + off + take)], head: first && hh > 0, u: u || null });
        off += take; rem -= take; yy += take; first = false;
        if (rem > 0.5) yy = topOf(p + 1);
      }
      return yy;
    }

    /*@3.NOPJ9.11*/
    function wholeNeed(it2) {
      var p2 = policyOf(it2.ty);
      if (p2 === 'free' || p2 === 'break') return -1;
      var h2 = it2.h || 0;
      return (it2.hc != null && it2.hc >= 0) ? Math.min(it2.hc, h2) : h2;
    }
    function firstNeed(it2) {
      if (!it2) return -1;
      var p2 = policyOf(it2.ty);
      if (p2 === 'free' || p2 === 'break') return -1;
      var un = Array.isArray(it2.units) && it2.units.length > 1 ? it2.units : null;
      if (!un) return wholeNeed(it2);
      var sm = 0, q5, sc;
      for (q5 = 0; q5 < un.length; q5++) sm += un[q5];
      sc = (it2.h > 0 && sm > 0 && it2.ty !== 'card') ? Math.min(1, it2.h / (sm + (it2.lead || 0))) : 1;
      return ((it2.lead || 0) + un[0] + (it2.ty === 'card' ? Math.min(un[1], H * 0.5) : 0)) * sc;
    }
    function nextReal(from) {
      var q3;
      for (q3 = from; q3 < items.length; q3++) {
        if (policyOf(items[q3].ty) === 'free') continue;
        return items[q3];
      }
      return null;
    }
    for (i = 0; i < items.length; i++) {
      var it = items[i], h = it.h || 0, pol = policyOf(it.ty);
      if (pol === 'free') continue;
      tops[it.id] = r2(cy);
      /*@3.NOPJ9.8*/
      y = norm(y);
      if (pol === 'break') {
        var y0 = y, nxB = nextReal(i + 1), needB = nxB ? wholeNeed(nxB) : -1;
        brk.push({ id: it.id, y: r2(y0), waste: r2(atStart(y0) ? 0 : nextTop(y0) - y0),
                   slack: !!(needB >= 0 && !atStart(y0) && y0 + needB <= endOf(y0) - BRK_TOL) });
        if (!atStart(y)) y = nextTop(y);
        segs[it.id] = [{ from: 0, to: r2(Math.max(h, 1)), add: r2(y - cy - h) }];
        ensure(pgOf(y));
        cy += h;
        continue;
      }
      /*@3.NOPJ9.10*/
      if (pol === 'atomic' && Array.isArray(it.units) && it.units.length > 1) pol = 'units';
      var nxR = nextReal(i + 1), tol = (nxR && policyOf(nxR.ty) === 'break') ? BRK_TOL : 0.5;
      var units = (pol === 'units' && Array.isArray(it.units) && it.units.length) ? it.units : null;
      if (!units) {
        /*@3.NOPJ9.4*/
        var hc = (it.hc != null && it.hc >= 0) ? Math.min(it.hc, h) : h;
        if (!atStart(y) && y + hc > endOf(y) + tol) y = nextTop(y);
        /*@3.NOPJ9.15*/
        else if (it.kn && !atStart(y)) {
          var nd = firstNeed(nxR);
          if (nd > 0 && y + h + nd > endOf(y) + tol && h + nd <= H - M - Mb) y = nextTop(y);
        }
        segs[it.id] = [{ from: 0, to: r2(h), add: r2(y - cy) }];
        /*@3.NOPJ9.6*/
        cends[it.id] = r2(hc);
        y = pushSlice(it.id, y, 0, 0, hc, null, tol) + (h - hc);
        cy += h;
        continue;
      }
      /*@3.NOPJ9.5*/
      var lead = it.lead || 0, head = it.head || 0, tail = it.tail || 0, bot = it.bot || 0, gap = it.gap || 0;
      var sum = lead + tail + (it.botIn ? 0 : bot) + gap;
      for (k = 0; k < units.length; k++) sum += units[k];
      var total = h > 0 ? h : sum, scale = (h > 0 && sum > 0) ? h / sum : 1;
      var last = units.length - 1;
      var cont = (it.ty === 'card') ? head : lead;
      function uhOf(q) { return units[q] * scale; }
      function needOf(q) { return units[q] * scale + (q === last ? ((it.botIn ? 0 : bot) + tail) * scale : bot * scale); }
      /*@3.NOPJ9.13*/
      var with1 = (it.ty === 'card' && head > 0 && units.length > 1) ? Math.min(uhOf(1), H * 0.5) : 0;
      if (!atStart(y) && y + lead * scale + needOf(0) + with1 > endOf(y) + tol) y = nextTop(y);
      var partY = y, partOff = 0, cur = y + lead * scale, uOff = lead * scale, k0 = 0, s = [];
      var curAdd = r2(y - cy);
      for (k = 0; k < units.length; k++) {
        /*@3.NOPJ9.2*/
        var uh = uhOf(k);
        if (k > k0 && (atStart(cur) || cur + needOf(k) > endOf(cur) + tol)) {
          /*@3.NOPJ9.14*/
          var kb = k;
          while (kb - 1 > k0 && it.keep && it.keep[kb - 1]) kb--;
          if (kb < k) {
            for (var q4 = kb; q4 < k; q4++) { cur -= uhOf(q4); uOff -= uhOf(q4); }
            k = kb; uh = uhOf(k);
          }
          pushSlice(it.id, partY, partOff > 0 ? head : 0, partOff, uOff, [k0, k], tol);
          s.push({ from: r2(partOff), to: r2(uOff), add: curAdd });
          var ny = atStart(cur) ? cur : nextTop(cur);
          partY = ny; partOff = uOff; cur = ny + cont * scale; k0 = k;
          curAdd = r2(cur - (cy + uOff));
        }
        cur += uh; uOff += uh;
      }
      cur += ((it.botIn ? 0 : bot) + tail) * scale;
      var cEnd = Math.max(partOff, total - gap * scale);
      cends[it.id] = r2(cEnd);
      pushSlice(it.id, partY, partOff > 0 ? head : 0, partOff, cEnd, [k0, units.length], tol);
      s.push({ from: r2(partOff), to: r2(total), add: curAdd });
      segs[it.id] = s;
      y = cur + gap * scale;
      cy += total;
    }
    while (pages.length > 1 && !pages[pages.length - 1].length) pages.pop();
    if (!pages.length) pages.push([]);
    return { pages: pages, count: pages.length, segs: segs, tops: tops, cont: cends, brk: brk, H: H, M: M, Mb: Mb, contH: r2(cy), paperH: r2(y) };
  }

  function shiftOf(seg, dy) {
    if (!seg || !seg.length) return 0;
    var i;
    for (i = 0; i < seg.length; i++) if (dy < seg[i].to) return seg[i].add;
    return seg[seg.length - 1].add;
  }

  function paperY(lay, b, dy) {
    var t = lay.tops[b];
    if (t == null) return null;
    return r2(t + dy + shiftOf(lay.segs[b], dy));
  }

  function pageOf(lay, py) { return Math.max(0, Math.min(lay.count - 1, Math.floor(py / lay.H))); }

  var API = { POLICY: POLICY, policyOf: policyOf, paginate: paginate, shiftOf: shiftOf, paperY: paperY, pageOf: pageOf };
  g.GardenNotesPaginate = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
