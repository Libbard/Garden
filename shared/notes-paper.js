;(function (g) {
  'use strict';

  var A = function () { return g.GardenNotesAnchor; };
  var P = function () { return g.GardenNotesPaginate; };
  var LISTY = { ul: 1, ol: 1, dl: 1, todo: 0 };
  var TEXTL = { p: 1, h: 1, quote: 1, callout: 1 };
  var TEXTL_MIN = 600;

  function r2(v) { return Math.round(v * 100) / 100; }

  function unitsOf(b, node, r, z) {
    var list = null, i, out = { lead: 0, units: null, head: 0, tail: 0 };
    if (b.ty === 'tbl') {
      if (node.__tblFill && !node.querySelector('tr[data-hollow]')) node.__tblFill(true);
      var trs = node.querySelectorAll('table.ne-tbl tr');
      if (trs.length > 1) {
        var h0 = trs[0].getBoundingClientRect();
        out.head = h0.height / z;
        out.lead = (h0.top - r.top) / z + out.head;
        out.units = [];
        /*@3.NOPJ10.28*/
        var rq = [];
        for (i = 1; i < trs.length; i++) rq.push(trs[i].getBoundingClientRect());
        for (i = 0; i < rq.length; i++) out.units.push(((i + 1 < rq.length ? rq[i + 1].top : rq[i].bottom) - rq[i].top) / z);
        out.unitEls = Array.prototype.slice.call(trs, 1);
      }
    } else if (LISTY[b.ty]) {
      list = node.querySelectorAll('.ne-li');
      if (list.length > 1) {
        out.lead = (list[0].getBoundingClientRect().top - r.top) / z;
        out.units = [];
        for (i = 0; i < list.length; i++) out.units.push(list[i].getBoundingClientRect().height / z);
        out.unitEls = Array.prototype.slice.call(list);
      }
    } else if (b.ty === 'code') {
      /*@3.NOPJ10.13*/
      var pre = node.querySelector('.ne-code');
      var src = String(b.src == null ? '' : b.src);
      /*@3.NOPJ10.17*/
      var lns = src.length ? src.split('\n') : [];
      if (lns.length > 1 && lns[lns.length - 1] === '') lns.pop();
      var nL = lns.length;
      if (pre && !pre.hidden && nL > 1 && (!window.GardenNotesCode || !GardenNotesCode.isMermaid || !GardenNotesCode.isMermaid(b.lang))) {
        var pr = pre.getBoundingClientRect(), cs = getComputedStyle(pre);
        var padT = (parseFloat(cs.paddingBlockStart) || 0) + (parseFloat(cs.borderBlockStartWidth) || 0);
        var padB = (parseFloat(cs.paddingBlockEnd) || 0) + (parseFloat(cs.borderBlockEndWidth) || 0);
        var cks = pre.querySelectorAll(':scope > .cd-ck'), q, n, hq, units = [];
        if (cks.length) {
          for (q = 0; q < cks.length; q++) {
            n = parseInt(cks[q].getAttribute('data-n'), 10) || 0;
            hq = cks[q].getBoundingClientRect().height / z;
            for (var w = 0; w < n; w++) units.push(hq / n);
          }
        } else {
          hq = Math.max(0, pr.height - padT - padB) / z;
          for (q = 0; q < nL; q++) units.push(hq / nL);
        }
        if (units.length === nL) {
          out.lead = (pr.top - r.top) / z + padT;
          out.units = units;
          out.code = { lines: lns, lang: b.lang || '' };
        }
      } else if (pre && !pre.hidden && r.height / z > TEXTL_MIN && (!window.GardenNotesCode || !GardenNotesCode.isMermaid || !GardenNotesCode.isMermaid(b.lang))) {
        /*@3.NOPJ10.24*/
        var luC = lineUnits(pre, r, z);
        if (luC) { out.lead = luC.lead; out.units = luC.units; out.vis = 1; }
      }
    } else if (TEXTL[b.ty] && r.height / z > TEXTL_MIN) {
      /*@3.NOPJ10.22*/
      var lu = lineUnits(node.querySelector('.ne-text'), r, z);
      if (lu) { out.lead = lu.lead; out.units = lu.units; out.lines = lu.units.length; }
    }
    return out;
  }

  /*@3.NOPJ10.26*/
  function lineUnits(tx, r, z) {
    var rows = textRows(tx);
    if (!rows || rows.length < 2) return null;
    var tr = tx.getBoundingClientRect(), cs = null;
    try { cs = getComputedStyle(tx); } catch (e) { cs = null; }
    var pT = cs ? (parseFloat(cs.paddingBlockStart) || 0) + (parseFloat(cs.borderBlockStartWidth) || 0) : 0;
    var pB = cs ? (parseFloat(cs.paddingBlockEnd) || 0) + (parseFloat(cs.borderBlockEndWidth) || 0) : 0;
    var cTop = tr.top + pT * z, cBot = tr.bottom - pB * z, edges = [cTop], i, units = [];
    for (i = 0; i + 1 < rows.length; i++) edges.push((rows[i].bottom + rows[i + 1].top) / 2);
    edges.push(Math.max(cBot, edges[edges.length - 1]));
    for (i = 0; i < rows.length; i++) units.push(Math.max(0, edges[i + 1] - edges[i]) / z);
    return { lead: (cTop - r.top) / z, units: units };
  }

  /*@3.NOPJ10.25*/
  function textRows(tx) {
    if (!tx) return null;
    var rects = null, q, rows = [];
    try { var rg = document.createRange(); rg.selectNodeContents(tx); rects = rg.getClientRects(); } catch (e) { rects = null; }
    if (!rects || rects.length < 2) return null;
    var k, mid, rc, hit;
    for (q = 0; q < rects.length; q++) {
      rc = rects[q];
      if (rc.height < 2 || rc.width < 0.5) continue;
      mid = (rc.top + rc.bottom) / 2; hit = null;
      for (k = rows.length - 1; k >= 0 && k >= rows.length - 64; k--) {
        if (mid >= rows[k].top && mid <= rows[k].bottom) { hit = rows[k]; break; }
        if (rows[k].bottom < mid) break;
      }
      if (hit) { if (rc.top < hit.top) hit.top = rc.top; if (rc.bottom > hit.bottom) hit.bottom = rc.bottom; continue; }
      rows.push({ top: rc.top, bottom: rc.bottom });
    }
    rows.sort(function (x, y) { return x.top - y.top; });
    var out = [];
    for (q = 0; q < rows.length; q++) {
      var cur = out.length ? out[out.length - 1] : null, rw = rows[q];
      if (cur && (rw.top + rw.bottom) / 2 <= cur.bottom) { if (rw.bottom > cur.bottom) cur.bottom = rw.bottom; continue; }
      out.push({ top: rw.top, bottom: rw.bottom });
    }
    return out.length > 1 ? out : null;
  }

  /*@3.NOPJ10.29*/
  function keepNext(b, h) {
    if (!b || b.fp) return false;
    if (b.ty === 'h') return true;
    if (b.ty !== 'p' || !(h > 0) || h > 110 || !Array.isArray(b.rt)) return false;
    var t = '', i;
    for (i = 0; i < b.rt.length; i++) t += (b.rt[i] && b.rt[i].s) || '';
    return /[:\uFF1A]\s*$/.test(t);
  }

  function measure(ed, sheet, stage, z, model) {
    var root = ed.root, bs = ed.doc.blocks, map = ed.bidMap();
    var stR = stage.getBoundingClientRect(), rtR = root.getBoundingClientRect(), shR = sheet.getBoundingClientRect();
    var rtl = false;
    try { rtl = getComputedStyle(root).direction === 'rtl'; } catch (e) {}
    var blocks = [], free = [], i, b, node, r;
    /*@3.NOPJ10.3*/
    var engA = (ed.doc.eng && ed.doc.eng.v === 3 && Array.isArray(ed.doc.eng.a) && ed.doc.eng.a.length === bs.length) ? ed.doc.eng.a : null;
    /*@3.NOPJ10.12*/
    var natH = (engA && ed._nat && Array.isArray(ed._nat.hgt) && ed._nat.hgt.length === bs.length && Array.isArray(ed._nat.ids)) ? ed._nat.hgt : null;
    /*@3.NOPJ10.18*/
    var natU = (natH && ed._nat.u && ed._nat.u.length === bs.length) ? ed._nat.u : null;
    var rootW = rtR.width / z;
    for (i = 0; i < bs.length; i++) {
      b = bs[i]; node = map[b.id];
      /*@3.NOPJ10.19*/
      if (model && natU && !b.fp) node = null;
      if (!node) {
        if (b.fp || !natU || !engA || engA[i] == null || !(natH[i] > 0)) { if (map[b.id] && b.fp) node = map[b.id]; else continue; }
        var uq = natU[i] || {};
        var mq = { id: b.id, ty: b.ty, card: b.card ? String(b.card) : '', fp: false, t: engA[i], s: uq.s || 0, w: (uq.w > 0) ? uq.w : rootW,
                   h: natH[i], domT: engA[i], domH: natH[i], synth: 1 };
        var nxS = null, q3;
        for (q3 = i + 1; q3 < bs.length; q3++) { if (!bs[q3].fp && engA[q3] != null) { nxS = engA[q3]; break; } }
        if (nxS != null && nxS - mq.t > 0 && mq.h > nxS - mq.t) mq.h = nxS - mq.t;
        mq.lead = uq.l || 0; mq.head = uq.h || 0; mq.units = (uq.un && uq.un.length) ? uq.un.slice() : null; mq.unitEls = null;
        if (mq.units && b.ty === 'code') {
          var srcS = String(b.src == null ? '' : b.src), lnS = srcS.length ? srcS.split('\n') : [];
          if (lnS.length > 1 && lnS[lnS.length - 1] === '') lnS.pop();
          mq.code = (lnS.length === mq.units.length && !uq.vis) ? { lines: lnS, lang: b.lang || '' } : null;
          if (!mq.code) { if (uq.vis) mq.vis = 1; else mq.units = null; }
        }
        if (mq.card && uq.ce > 0) mq.cardEnd = uq.ce;
        if (keepNext(b, mq.h)) mq.kn = 1;
        blocks.push(mq);
        continue;
      }
      r = node.getBoundingClientRect();
      var m = { id: b.id, ty: b.ty, card: b.fp ? '' : (b.card ? String(b.card) : ''), fp: !!b.fp,
                t: (r.top - rtR.top) / z, s: (rtl ? (rtR.right - r.right) : (r.left - rtR.left)) / z,
                w: r.width / z, h: r.height / z, domT: (r.top - rtR.top) / z, domH: r.height / z };
      if (b.fp) {
        /*@3.NOPJ10.6*/
        var tf = node.style.transform, rb = r;
        if (tf) { node.style.transform = 'none'; rb = node.getBoundingClientRect(); node.style.transform = tf; }
        m.t = (rb.top - rtR.top) / z; m.s = (rtl ? (rtR.right - rb.right) : (rb.left - rtR.left)) / z;
        m.w = rb.width / z; m.h = rb.height / z;
        m.va = (r.top - rb.top) / z; m.vb = (r.bottom - rb.top) / z;
        m.b = b.fp.b || null; m.dy = (typeof b.fp.dy === 'number') ? b.fp.dy : null;
        free.push(m); continue;
      }
      if (engA && engA[i] != null) {
        m.t = engA[i];
        if (natH && natH[i] > 0 && ed._nat.ids[i] === b.id) m.h = natH[i];
        var nxA = null, q2;
        for (q2 = i + 1; q2 < bs.length; q2++) { if (!bs[q2].fp && engA[q2] != null) { nxA = engA[q2]; break; } }
        if (nxA != null && nxA - m.t > 0 && m.h > nxA - m.t) m.h = nxA - m.t;
      }
      var u = unitsOf(b, node, r, z);
      m.lead = u.lead; m.units = u.units; m.head = u.head; m.unitEls = u.unitEls; m.code = u.code || null; if (u.vis) m.vis = 1;
      if (keepNext(b, m.h)) m.kn = 1;
      /*@3.NOPJ10.8*/
      if (m.card && node.hasAttribute('data-card-end')) {
        try { var csE = getComputedStyle(node); m.cardEnd = (parseFloat(csE.paddingBlockEnd) || 0) + (parseFloat(csE.borderBlockEndWidth) || 0); } catch (eCs) { m.cardEnd = 0; }
      }
      blocks.push(m);
    }
    /*@3.NOPJ10.5*/
    return { rootTop: (rtR.top - stR.top) / z, sheetTop: (shR.top - stR.top) / z + (sheet.clientTop || 0),
             rootH: rtR.height / z, blocks: blocks, free: free, rtl: rtl };
  }

  function items(ms, off) {
    var out = [], i, k, cur = null, byId = {}, acc = null;
    for (i = 0; i < ms.blocks.length; i++) {
      var m = ms.blocks[i], nx = ms.blocks[i + 1];
      m.hh = nx ? Math.max(m.h, nx.t - m.t) : m.h;
      /*@3.NOPJ10.11*/
      if (m.ty === 'pb' && acc != null) m.hh = Math.max(0, (nx ? nx.t : m.t + m.h) - acc);
      acc = (acc == null ? m.t : acc) + m.hh;
      if (m.card) {
        if (!cur || cur.cid !== m.card) {
          cur = { id: 'card:' + m.card + ':' + m.id, ty: 'card', cid: m.card, kids: [], units: [], keep: [], h: 0, head: 0 };
          out.push(cur);
        }
        cur.kids.push(m); cur.units.push(m.hh); cur.keep.push(m.kn ? 1 : 0); cur.h += m.hh;
        if (m.cardEnd > 0) { cur.bot = m.cardEnd; cur.botIn = 1; }
        continue;
      }
      cur = null;
      var it = { id: m.id, ty: m.ty, h: m.hh, hc: m.h, m: m };
      if (m.kn) it.kn = 1;
      if (m.units) {
        /*@3.NOPJ10.9*/
        var sum = m.lead, uu;
        for (k = 0; k < m.units.length; k++) sum += m.units[k];
        it.lead = m.lead; it.units = m.units; it.head = m.head;
        it.bot = Math.max(0, m.h - sum); it.gap = Math.max(0, m.hh - Math.max(m.h, sum)); it.tail = 0;
      }
      out.push(it);
    }
    for (i = 0; i < out.length; i++) {
      if (out[i].ty === 'card') {
        out[i].head = out[i].kids.length > 1 ? out[i].units[0] : 0;
        for (k = 0; k < out[i].kids.length; k++) byId[out[i].kids[k].id] = { item: out[i], k: k };
      } else byId[out[i].id] = { item: out[i], k: -1 };
    }
    var lead0 = off + (ms.blocks.length ? ms.blocks[0].t : 0);
    if (lead0 > 0) out.unshift({ id: 'paper:lead', ty: 'gap', h: lead0 });
    return { list: out, byId: byId };
  }

  function offOf(it, k) { var o = 0, i; for (i = 0; i < k; i++) o += it.units[i]; return o; }

  function pruneUnits(node, m, u) {
    var els = m.unitEls || [], i;
    for (i = 0; i < els.length; i++) {
      if (!u || i < u[0] || i >= u[1]) els[i].setAttribute('data-paper-drop', '1');
    }
    var drop = node.querySelectorAll('[data-paper-drop]');
    for (i = 0; i < drop.length; i++) drop[i].parentNode.removeChild(drop[i]);
  }

  function build(o) {
    var ed = o.ed, sheet = o.sheet, stage = o.stage, z = o.zoom || 1, H = o.H, box = o.inkBox, els = o.inkEls || [];
    /*@3.NOPJ10.27*/
    var bare = !o.model && ed.pvOn && ed.pvOn();
    if (bare) ed.pvStripAll();
    var ms;
    try { ms = measure(ed, sheet, stage, z, o.model); } finally { if (bare) ed.pvApply(); }
    var off = ms.rootTop - ms.sheetTop;
    var it = items(ms, off);
    /*@3.NOPJ10.20*/
    /*@3.NOPJ10.21*/
    var lay = P().paginate(it.list, H, o.topPad || 0, o.botPad || 0);
    var i, p, e, k;
    function segOf(bid, dy) {
      var ref = it.byId[bid];
      if (!ref) return 0;
      if (ref.k >= 0) return P().shiftOf(lay.segs[ref.item.id], offOf(ref.item, ref.k) + dy);
      return P().shiftOf(lay.segs[bid], dy);
    }
    function freeShift(fpTopRoot) {
      var y = fpTopRoot + off, idx = -1, j;
      for (j = 0; j < ms.blocks.length; j++) if (ms.blocks[j].t + off <= y + 10) idx = j;
      if (idx < 0) return 0;
      return segOf(ms.blocks[idx].id, y - (ms.blocks[idx].t + off));
    }
    /*@3.NOPJ10.1*/
    var freeMap = {}, fMax = 0, fm, fy;
    var topOf = {};
    for (i = 0; i < ms.blocks.length; i++) topOf[ms.blocks[i].id] = ms.blocks[i].t;
    for (i = 0; i < ms.free.length; i++) {
      fm = ms.free[i];
      /*@3.NOPJ10.4*/
      if (fm.b && topOf[fm.b] != null && fm.dy != null) fy = topOf[fm.b] + fm.dy + off + segOf(fm.b, fm.dy);
      else fy = fm.t + off + freeShift(fm.t);
      /*@3.NOPJ10.7*/
      var va = (typeof fm.va === 'number') ? fm.va : 0, vb = (typeof fm.vb === 'number') ? fm.vb : fm.h;
      freeMap[fm.id] = { t: r2(fy - off), s: r2(fm.s), w: r2(fm.w), h: r2(fm.h), va: r2(va), vb: r2(vb), free: 1 };
      if (fy + vb > fMax) fMax = fy + vb;
    }
    var count = Math.max(lay.count, Math.ceil((fMax - 0.5) / H));
    var spans = { rootTop: ms.rootTop, sheetTop: ms.sheetTop, rootH: count * H, map: {},
                  inkTop: box ? box.top : 0, inkH: count * H };
    for (k in freeMap) spans.map[k] = freeMap[k];
    var parts = [];
    for (p = 0; p < lay.pages.length; p++) {
      for (i = 0; i < lay.pages[p].length; i++) {
        e = lay.pages[p][i];
        var ref = it.byId[e.id] || null;
        var item = ref ? ref.item : null;
        if (!item) {
          var cardIt = null;
          for (k = 0; k < it.list.length; k++) if (it.list[k].id === e.id) { cardIt = it.list[k]; break; }
          item = cardIt;
        }
        if (!item || item.ty === 'gap' || item.ty === 'pb') continue;
        var pn = parts.filter(function (q) { return q.id === e.id; }).length;
        if (item.ty === 'card') {
          var o0 = 0;
          for (k = 0; k < item.kids.length; k++) {
            var kid = item.kids[k], a0 = o0, b0 = o0 + item.units[k];
            o0 = b0;
            if (b0 <= e.cut[0] + 0.5 || a0 >= e.cut[1] - 0.5) continue;
            var y = e.y - off + (e.head ? item.head : 0) + (a0 - e.cut[0]);
            if (!spans.map[kid.id]) spans.map[kid.id] = { t: r2(y), s: r2(kid.s), w: r2(kid.w), h: r2(kid.h) };
          }
          if (e.head) parts.push({ kind: 'head', id: item.kids[0].id, key: item.kids[0].id + '#h' + p, t: r2(e.y - off), m: item.kids[0] });
          continue;
        }
        var m = item.m;
        var cEnd = (lay.cont && lay.cont[e.id] != null) ? lay.cont[e.id] : item.h;
        if (!item.units || (e.cut[0] < 0.5 && e.cut[1] >= cEnd - 0.5)) {
          if (!spans.map[m.id]) spans.map[m.id] = { t: r2(e.y - e.cut[0] - off), s: r2(m.s), w: r2(m.w), h: r2(m.h) };
          continue;
        }
        parts.push({ kind: 'part', id: m.id, key: m.id + '#' + pn, t: r2(e.y - off), m: m, c0: e.cut[0], c1: e.cut[1], head: e.head, u: e.u, last: e.cut[1] >= cEnd - 0.5 });
      }
    }
    var shiftEls = [];
    for (i = 0; i < els.length; i++) {
      var el = els[i], cp = JSON.parse(JSON.stringify(el));
      var dz = (el.b && el.dy != null) ? segOf(el.b, el.dy) : 0;
      if (dz) A().shiftEl(cp, dz);
      shiftEls.push(cp);
    }
    var cuts = [];
    for (i = 0; i <= count; i++) cuts.push(r2(ms.sheetTop + i * H));
    return {
      lay: lay, spans: spans, parts: parts, cuts: cuts, pages: count, byId: it.byId, items: it.list, off: off,
      segOf: segOf, els: shiftEls, freeShift: freeShift, free: freeMap
    };
  }

  function applyClone(clone, pr, ms) {
    var root = clone.querySelector('.ne-root');
    if (!root) return;
    var i, node, live = {};
    var kids = root.children;
    for (i = 0; i < kids.length; i++) {
      var bid = kids[i].getAttribute && kids[i].getAttribute('data-bid');
      if (bid) live[bid] = kids[i];
    }
    /*@3.NOPJ10.16*/
    var skels = {};
    function skelOf(src, pt) {
      var sk = skels[pt.id];
      if (sk) return sk;
      var units = pt.m.ty === 'tbl' ? Array.prototype.slice.call(src.querySelectorAll('table.ne-tbl tr'), 1)
                                    : Array.prototype.slice.call(src.querySelectorAll('.ne-li'));
      var par = units.length ? units[0].parentNode : null, q;
      for (q = 1; q < units.length; q++) if (units[q].parentNode !== par) { par = null; break; }
      if (!par) { sk = { skel: null }; skels[pt.id] = sk; return sk; }
      for (q = 0; q < units.length; q++) par.removeChild(units[q]);
      var path = [], cur = par;
      while (cur && cur !== src) { path.unshift(Array.prototype.indexOf.call(cur.parentNode.children, cur)); cur = cur.parentNode; }
      sk = { skel: src.cloneNode(true), units: units, path: path };
      skels[pt.id] = sk;
      return sk;
    }
    for (i = 0; i < pr.parts.length; i++) {
      var pt = pr.parts[i], src = live[pt.id];
      if (!src) continue;
      if (pt.kind === 'part' && pt.m.ty === 'code' && pt.m.code) { var preS = src.querySelector('.ne-code'); if (preS && preS.firstChild) preS.textContent = ''; }
      var sk = (pt.kind === 'part' && !(pt.m.ty === 'code' && pt.m.code)) ? skelOf(src, pt) : null;
      if (sk && sk.skel) {
        node = sk.skel.cloneNode(true);
        var par2 = node, pq;
        for (pq = 0; pq < sk.path.length && par2; pq++) par2 = par2.children[sk.path[pq]];
        var ua = pt.u ? pt.u[0] : 0, ub = pt.u ? pt.u[1] : sk.units.length;
        if (par2) for (pq = ua; pq < ub && pq < sk.units.length; pq++) par2.appendChild(sk.units[pq].cloneNode(true));
      } else node = src.cloneNode(true);
      node.setAttribute('data-span', pt.key);
      if (pt.kind === 'part') {
        var mm = pt.m;
        if ((TEXTL[mm.ty] || (mm.ty === 'code' && !mm.code)) && !(sk && sk.skel)) {
          /*@3.NOPJ10.23*/
          node.setAttribute('data-clip', '1');
          var bodyT = node.querySelector(':scope > .ne-body') || node.firstElementChild;
          if (bodyT && pt.c0 > 0.5) bodyT.style.marginBlockStart = r2(-(pt.c0 - (mm.lead || 0))) + 'px';
          node.style.overflow = 'hidden';
        } else if (mm.ty === 'code' && mm.code) {
          /*@3.NOPJ10.14*/
          var preP = node.querySelector('.ne-code'), C0 = window.GardenNotesCode;
          var u0 = pt.u ? pt.u[0] : 0, u1 = pt.u ? pt.u[1] : mm.code.lines.length;
          var subSrc = mm.code.lines.slice(u0, u1).join('\n');
          if (preP) {
            if (C0 && C0.paint && C0.norm && C0.norm(mm.code.lang)) C0.paint(preP, subSrc, mm.code.lang, 'spans');
            else preP.textContent = subSrc;
            /*@3.NOPJ10.30*/
            var fL = preP.firstChild;
            if (u0 > 0 && subSrc.charAt(0) === '\n' && fL && fL.nodeType === 3 && preP.textContent.length > subSrc.length && fL.nodeValue.charAt(0) === '\n') fL.nodeValue = fL.nodeValue.slice(1);
          }
        } else if (!(sk && sk.skel)) {
          var unitEls = pt.m.ty === 'tbl' ? Array.prototype.slice.call(node.querySelectorAll('table.ne-tbl tr'), 1)
                                          : Array.prototype.slice.call(node.querySelectorAll('.ne-li'));
          pruneUnits(node, { unitEls: unitEls }, pt.u);
        }
        /*@3.NOPJ10.2*/
        var lastPart = (pt.last != null) ? !!pt.last : (pt.c1 >= (mm.hh || 0) - 0.5);
        if (!lastPart) {
          var tails = node.querySelectorAll('.ne-tbl-bar');
          for (var tq = 0; tq < tails.length; tq++) tails[tq].remove();
        }
        /*@3.NOPJ10.10*/
        /*@3.NOPJ10.15*/
        var partH = r2(pt.c1 - pt.c0 + ((pt.head || pt.c0 > 0.5) ? (mm.lead || 0) : 0));
        if (!lastPart || TEXTL[mm.ty] || (mm.ty === 'code' && !mm.code)) { node.style.maxBlockSize = partH + 'px'; node.style.overflow = 'hidden'; }
        pr.spans.map[pt.key] = { t: r2(pt.t), s: pt.m.s, w: pt.m.w, h: partH };
      } else {
        pr.spans.map[pt.key] = { t: pt.t, s: pt.m.s, w: pt.m.w, h: pt.m.h };
      }
      root.appendChild(node);
    }
    for (i = 0; i < pr.parts.length; i++) {
      if (pr.parts[i].kind !== 'part') continue;
      var orig = live[pr.parts[i].id];
      if (orig && orig.parentNode) orig.parentNode.removeChild(orig);
      live[pr.parts[i].id] = null;
    }
    var fr = root.querySelectorAll(':scope > [data-bid]');
    for (i = 0; i < fr.length; i++) {
      var n2 = fr[i];
      if (!n2.style || !n2.style.top || n2.getAttribute('data-span')) continue;
      var bid2 = n2.getAttribute('data-bid');
      if (pr.spans.map[bid2]) continue;
      var top = parseFloat(n2.style.top) || 0;
      var dz = pr.freeShift(top);
      if (dz) n2.style.top = r2(top + dz) + 'px';
    }
    var page = clone.querySelector('.na-page');
    if (page) { page.style.setProperty('--na-pages', String(pr.pages)); page.setAttribute('data-pages', String(pr.pages)); }
  }

  g.GardenNotesPaper = { build: build, applyClone: applyClone, measure: measure, unitsOf: unitsOf, textRows: textRows };
})(typeof window !== 'undefined' ? window : globalThis);
