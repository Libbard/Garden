;(function () {
  'use strict';


  /*@3.NOOJ.18*/
  var A4W = 794;

  function pageW(sheet, z) {
    if (!sheet) return A4W;
    var w = Math.round(sheet.getBoundingClientRect().width / (z || 1));
    return (w > 40) ? w : A4W;
  }

  /*@3.NOOJ.13*/
  function zoomOf(el) {
    if (!el || !el.offsetWidth) return 1;
    var z = el.getBoundingClientRect().width / el.offsetWidth;
    return (isFinite(z) && z > 0.05) ? z : 1;
  }

  function Overlay(opts) {
    var o = opts || {};
    this.scroller = o.scroller;
    this.stage = o.stage || o.scroller;
    this.sheet = o.sheet;
    this.onChange = o.onChange || function () {};
    this.onLoad = o.onLoad || null;
    this.onAdd = o.onAdd || null;
    this.data = o.data || null;
    this.favHost = o.favHost || null;
    this.surface = o.surface || '';
    this.onBand = o.onBand || function () {};
    this.onTap = o.onTap || function () {};
    this.onPass = o.onPass || null;
    this.onScratch = o.onScratch || null;
    this.onUndo = o.onUndo || null;
    this.onErased = o.onErased || null;
    /*@3.NOOJ.31*/
    this.onTextAt = o.onTextAt || null;
    this.onPinch = o.onPinch || null;
    this.onShapeBox = o.onShapeBox || null;
    this.unview = o.unview || null;
    /*@3.NOOJ.14*/
    this.bound = o.bound !== false;
    this.hist = o.hist || null;
    this.refBase = o.refW || A4W;
    this.lineSel = o.lineSel || LINE_SEL;
    this.heightOf = o.heightOf || null;
    this.on = false;
    this.pick = false;
    this.build();
  }

  /*@3.NOOJ.1*/
  /*@3.NOOJ.7*/
  Overlay.prototype.build = function () {
    this.host = document.createElement('div');
    this.host.className = 'nov-host';
    this.host.hidden = true;
    this.stage.appendChild(this.host);

    var self = this;
    if (window.GardenNotesDial) {
      this.dial = GardenNotesDial.mount({
        canvas: function () { return self.cv; },
        onExit: function () { self.toggle(false); },
        favHost: this.favHost || null,
        surface: this.surface || ''
      });
    }
  };

  Overlay.prototype.sync = function () {
    if (this.dial) this.dial.sync();
  };

  /*@3.NOOJ.2*/
  /*@3.NOOJ.4*/
  /*@3.NOOJ.9*/
  Overlay.prototype.fit = function () {
    if (!this.cv) return;
    var stage = this.stage;
    var z = zoomOf(stage);
    var sh = this.sheet.getBoundingClientRect();
    var st = stage.getBoundingClientRect();
    var sc = this.scroller.getBoundingClientRect();
    var w = Math.round(sh.width / z);
    /*@3.NOOJ.23*/
    var h = this.bound
      ? Math.max(Math.round(this.sheet.scrollHeight), Math.round(sc.height / z))
      : Math.round(this.sheet.scrollHeight);
    if (this.heightOf) h = Math.max(1, Math.round(this.heightOf()));
    var rtl = false;
    try { rtl = getComputedStyle(this.scroller).direction === 'rtl'; } catch (e) {}
    var top = (sh.top - st.top) / z;
    var inl = (rtl ? (st.right - sh.right) : (sh.left - st.left)) / z;
    this.host.style.inlineSize = w + 'px';
    this.host.style.blockSize = h + 'px';
    this.host.style.insetBlockStart = Math.round(top) + 'px';
    this.host.style.insetInlineStart = Math.round(inl) + 'px';
    if (this.cv) {
      this.cv.pageH = h; this.cv.w = 0; this.cv.resize();
      /*@3.NOOJ.5*/
      /*@3.NOOJ.11*/
      /*@3.NOOJ.20*/
      if (this.bound) { this.refW = this.refBase; this.cv.setFit(1); this.syncWindow(); }
      else this.fitBoard(w);
    }
  };

  /*@3.NOOJ.21*/
  /*@3.NOOJ.30*/
  Overlay.prototype.syncWindow = function () {
    if (!this.cv || !this.bound || !this.cv.setWindow) return;
    var z = zoomOf(this.stage) || 1;
    var wr = this.cv.wrap.getBoundingClientRect();
    var sr = this.scroller.getBoundingClientRect();
    var yTop = (sr.top - wr.top) / z;
    var vhW = sr.height / z;
    this.cv.setWindow(yTop - Math.max(0, (this.cv.winH - vhW) / 2), yTop, vhW);
  };

  /*@3.NOOJ.27*/
  var LINE_SEL = '.ne-text, .ne-li, .ne-cell, .ne-code, .ne-cap, .ne-math-out';

  /*@3.NOOJ.28*/
  function mergeLines(rects, out) {
    var i, k;
    for (i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (r.height < 4 || r.width < 1) continue;
      var mid = (r.top + r.bottom) / 2, hit = null;
      for (k = 0; k < out.length; k++) {
        var o = out[k];
        var tol = Math.min(o.h, r.height) * 0.6 + 1;
        if (Math.abs(mid - (o.top + o.bot) / 2) <= tol) { hit = o; break; }
      }
      if (!hit) {
        out.push({ top: r.top, bot: r.bottom, left: r.left, right: r.right,
                   h: r.height, ub: r.ub, em: r.em, ar: r.ar });
        continue;
      }
      if (r.ub != null && !(hit.ub >= r.ub)) hit.ub = r.ub;
      if (r.em > 0 && !(hit.em >= r.em)) hit.em = r.em;
      if (r.ar) hit.ar = 1;
      if (r.top < hit.top) hit.top = r.top;
      if (r.bottom > hit.bot) hit.bot = r.bottom;
      if (r.left < hit.left) hit.left = r.left;
      if (r.right > hit.right) hit.right = r.right;
      hit.h = hit.bot - hit.top;
    }
  }

  /*@3.NOOJ.36*/
  /*@3.NOOJ.39*/
  var MCX = null;
  function inkFoot(n, a, b, h) {
    var el = n.parentNode;
    if (!el || !(h > 0)) return null;
    try {
      MCX = MCX || document.createElement('canvas').getContext('2d');
      var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) || 16;
      MCX.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      var str = n.nodeValue.slice(a, b), m = MCX.measureText(str);
      var asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
      if (!(asc + desc > 0)) return null;
      var k = h / (asc + desc), ink = Math.max(m.actualBoundingBoxDescent || 0, fs * 0.06);
      if (/[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]/.test(str)) {
        return { u: (asc + Math.max(ink, fs * 0.28) + fs * 0.2) * k, em: fs * k, ar: 1 };
      }
      return { u: Math.min(asc + desc, asc + ink + fs * 0.1) * k, em: fs * k };
    } catch (e) { return null; }
  }

  function footOf(ov, L0, o) {
    if (L0.ub == null || !(L0.bot - L0.top > 0)) return o;
    var sc = o.h / (L0.bot - L0.top);
    o.u = (L0.ub - L0.top) * sc;
    if (L0.em > 0) o.em = L0.em * sc;
    if (L0.ar) o.ar = 1;
    return o;
  }

  function textRects(rg, foot) {
    var out = [], root = rg.commonAncestorContainer, n, sub = document.createRange(), rs, k, a, b;
    if (root.nodeType === 3) root = root.parentNode;
    if (!root) return out;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while ((n = tw.nextNode())) {
      if (!n.nodeValue || !rg.intersectsNode(n)) continue;
      if (n.parentNode && n.parentNode.closest && n.parentNode.closest('[data-brk],[data-pgc]')) continue;
      a = (n === rg.startContainer) ? rg.startOffset : 0;
      b = (n === rg.endContainer) ? rg.endOffset : n.nodeValue.length;
      if (b <= a) continue;
      try { sub.setStart(n, a); sub.setEnd(n, b); rs = sub.getClientRects(); } catch (e) { continue; }
      for (k = 0; k < rs.length; k++) {
        var ft = foot && rs[k].height > 0 ? inkFoot(n, a, b, rs[k].height) : null;
        out.push(ft ? { top: rs[k].top, bottom: rs[k].bottom, left: rs[k].left, right: rs[k].right,
                        width: rs[k].width, height: rs[k].height, ub: rs[k].top + ft.u, em: ft.em, ar: ft.ar } : rs[k]);
      }
    }
    return out;
  }

  /*@3.NOOJ.29*/
  function caretAt(x, y) {
    if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
    if (document.caretPositionFromPoint) {
      var cp = document.caretPositionFromPoint(x, y);
      if (!cp) return null;
      var rg = document.createRange();
      try { rg.setStart(cp.offsetNode, cp.offset); rg.collapse(true); } catch (e) { return null; }
      return rg;
    }
    return null;
  }

  /*@3.NOOJ.38*/
  function hitChar(rg, x, y) {
    var n = rg && rg.startContainer;
    if (!n || n.nodeType !== 3) return null;
    var t = n.nodeValue || '', i = rg.startOffset, r = document.createRange(), k, bx;
    for (k = i - 1; k <= i; k++) {
      if (k < 0 || k >= t.length || /\s/.test(t.charAt(k))) continue;
      try { r.setStart(n, k); r.setEnd(n, k + 1); } catch (e) { continue; }
      bx = r.getBoundingClientRect();
      if (bx.width > 0 && x >= bx.left - 0.5 && x <= bx.right + 0.5 && y >= bx.top - bx.height && y <= bx.bottom + bx.height) return { node: n, a: k, b: k + 1 };
    }
    return null;
  }

  function wordRect(x, y) {
    var rg = caretAt(x, y);
    if (!rg) return null;
    var n = rg.startContainer;
    if (!n || n.nodeType !== 3) return null;
    var t = n.nodeValue || '';
    var i = Math.max(0, Math.min(t.length, rg.startOffset));
    var word = function (c) { return c && !/[\s\u00a0]/.test(c); };
    var a = i, b = i;
    while (a > 0 && word(t.charAt(a - 1))) a--;
    while (b < t.length && word(t.charAt(b))) b++;
    if (b <= a) return null;
    var r2 = document.createRange();
    try { r2.setStart(n, a); r2.setEnd(n, b); } catch (e2) { return null; }
    var rr = r2.getBoundingClientRect();
    return (rr && rr.width > 0.5) ? rr : null;
  }

  Overlay.prototype.lineUnder = function (bx) {
    if (!this.cv || !this.sheet) return null;
    var a = this.worldToClient({ x: bx.x0, y: bx.y0 });
    var b = this.worldToClient({ x: bx.x1, y: bx.y1 });
    var cTop = Math.min(a.y, b.y), cBot = Math.max(a.y, b.y);
    var cL = Math.min(a.x, b.x), cR = Math.max(a.x, b.x);
    var mid = (cTop + cBot) / 2, cMx = (cL + cR) / 2;
    var hosts = this.sheet.querySelectorAll(this.lineSel);
    var lines = [], i;
    for (i = 0; i < hosts.length; i++) {
      var hr = hosts[i].getBoundingClientRect();
      if (hr.bottom < cTop - 40 || hr.top > cBot + 40) continue;
      if (hr.right < cL - 60 || hr.left > cR + 60) continue;
      var rects = null;
      try {
        var rg = document.createRange();
        rg.selectNodeContents(hosts[i]);
        rects = textRects(rg, this.surface === 'module');
      } catch (e) { rects = null; }
      if (!rects || !rects.length) continue;
      mergeLines(rects, lines);
    }
    if (!lines.length) return null;
    var best = null, bestD = 1e9;
    for (i = 0; i < lines.length; i++) {
      var L0 = lines[i];
      var lm = (L0.top + L0.bot) / 2;
      var dy = Math.abs(lm - mid);
      var dx = (cMx < L0.left) ? (L0.left - cMx) : (cMx > L0.right ? cMx - L0.right : 0);
      var d = dy + dx * 0.35;
      if (d < bestD) { bestD = d; best = L0; }
    }
    if (!best) return null;
    if (Math.abs((best.top + best.bot) / 2 - mid) > best.h * 1.6 + 8) return null;
    var ly = (best.top + best.bot) / 2;
    var sL = Math.max(best.left, Math.min(best.right, cL));
    var sR = Math.max(best.left, Math.min(best.right, cR));
    var wA = wordRect(sL, ly), wB = wordRect(sR, ly);
    if (wA && Math.abs((wA.top + wA.bottom) / 2 - ly) < best.h) {
      sL = Math.min(sL, wA.left); sR = Math.max(sR, wA.right);
    }
    if (wB && Math.abs((wB.top + wB.bottom) / 2 - ly) < best.h) {
      sL = Math.min(sL, wB.left); sR = Math.max(sR, wB.right);
    }
    sL = Math.max(best.left, sL); sR = Math.min(best.right, sR);
    if (sR - sL < 2) { sL = best.left; sR = best.right; }
    var p0 = this.clientToWorld(best.left, best.top);
    var p1 = this.clientToWorld(best.right, best.bot);
    var q0 = this.clientToWorld(sL, best.top);
    var q1 = this.clientToWorld(sR, best.bot);
    return footOf(this, best, { x0: Math.min(p0.x, p1.x), x1: Math.max(p0.x, p1.x),
             y: Math.min(p0.y, p1.y), h: Math.abs(p1.y - p0.y),
             sx0: Math.min(q0.x, q1.x), sx1: Math.max(q0.x, q1.x) });
  };

  /*@3.NOOJ.34*/
  Overlay.prototype.linesUnder = function (pa, pb) {
    if (!this.cv || !this.sheet || !pa || !pb) return null;
    var a = this.worldToClient(pa), b = this.worldToClient(pb);
    var was = this.host.style.pointerEvents, wasS = this.sheet.style.pointerEvents;
    this.host.style.pointerEvents = 'none';
    this.sheet.style.pointerEvents = 'auto';
    var ra = null, rb = null;
    var inSheet = function (rg) { var n = rg && rg.startContainer; return !!(n && this.sheet.contains(n.nodeType === 3 ? n.parentNode : n) && (n.nodeType === 3 ? n.parentNode : n).closest && (n.nodeType === 3 ? n.parentNode : n).closest(this.lineSel)); }.bind(this);
    try {
      ra = caretAt(a.x, a.y); rb = caretAt(b.x, b.y);
      if (!inSheet(ra)) ra = this.caretNear(a.x, a.y);
      if (!inSheet(rb)) rb = this.caretNear(b.x, b.y);
    } catch (e) { ra = rb = null; }
    this.host.style.pointerEvents = was || '';
    this.sheet.style.pointerEvents = wasS || '';
    if (!ra || !rb) return null;
    if (!inSheet(ra) || !inSheet(rb)) return null;
    var rg = document.createRange();
    try {
      var cmp = ra.compareBoundaryPoints(Range.START_TO_START, rb), back = cmp > 0;
      if (!cmp) return null;
      var r0 = back ? rb : ra, r1 = back ? ra : rb, c0 = back ? b : a, c1 = back ? a : b;
      var h0 = hitChar(r0, c0.x, c0.y), h1 = hitChar(r1, c1.x, c1.y);
      if (h0) rg.setStart(h0.node, h0.a); else rg.setStart(r0.startContainer, r0.startOffset);
      if (h1) rg.setEnd(h1.node, h1.b); else rg.setEnd(r1.startContainer, r1.startOffset);
    } catch (e2) { return null; }
    if (rg.collapsed) return null;
    var rects = textRects(rg, this.surface === 'module'), lines = [], i;
    if (!rects || !rects.length) return null;
    mergeLines(rects, lines);
    lines.sort(function (x, y) { return x.top - y.top; });
    var out = [];
    for (i = 0; i < lines.length; i++) {
      var L0 = lines[i];
      if (!(L0.h > 3) || !(L0.right - L0.left > 2)) continue;
      var p0 = this.clientToWorld(L0.left, L0.top), p1 = this.clientToWorld(L0.right, L0.bot);
      out.push(footOf(this, L0, { x0: Math.min(p0.x, p1.x), x1: Math.max(p0.x, p1.x), y: Math.min(p0.y, p1.y), h: Math.abs(p1.y - p0.y) }));
    }
    return out.length ? out : null;
  };

  /*@3.NOOJ.37*/
  Overlay.prototype.wordUnder = function (pt) {
    if (!this.cv || !this.sheet || !pt) return null;
    var c = this.worldToClient(pt);
    var was = this.host.style.pointerEvents, wasS = this.sheet.style.pointerEvents;
    this.host.style.pointerEvents = 'none';
    this.sheet.style.pointerEvents = 'auto';
    var rg = null;
    try { rg = caretAt(c.x, c.y); } catch (e) { rg = null; }
    this.host.style.pointerEvents = was || '';
    this.sheet.style.pointerEvents = wasS || '';
    var n = rg && rg.startContainer;
    if (!n || n.nodeType !== 3 || !n.parentNode || !this.sheet.contains(n) ||
        !n.parentNode.closest || !n.parentNode.closest(this.lineSel)) return null;
    var t = n.nodeValue || '';
    var i = Math.max(0, Math.min(t.length, rg.startOffset));
    var word = function (ch) { return ch && !/[\s\u00a0.,;:!?\u060c\u061b\u061f()\[\]{}"'\u00ab\u00bb]/.test(ch); };
    var a = i, b = i;
    while (a > 0 && word(t.charAt(a - 1))) a--;
    while (b < t.length && word(t.charAt(b))) b++;
    if (b <= a) return null;
    var wr = document.createRange();
    try { wr.setStart(n, a); wr.setEnd(n, b); } catch (e2) { return null; }
    var hit = false, rs = wr.getClientRects(), k;
    for (k = 0; k < rs.length; k++) {
      if (c.x >= rs[k].left - 4 && c.x <= rs[k].right + 4 && c.y >= rs[k].top - 4 && c.y <= rs[k].bottom + 4) { hit = true; break; }
    }
    if (!hit) return null;
    var lines = [], out = [];
    mergeLines(textRects(wr, this.surface === 'module'), lines);
    for (k = 0; k < lines.length; k++) {
      var L0 = lines[k];
      if (!(L0.h > 3) || !(L0.right - L0.left > 2)) continue;
      var p0 = this.clientToWorld(L0.left, L0.top), p1 = this.clientToWorld(L0.right, L0.bot);
      out.push(footOf(this, L0, { x0: Math.min(p0.x, p1.x), x1: Math.max(p0.x, p1.x), y: Math.min(p0.y, p1.y), h: Math.abs(p1.y - p0.y) }));
    }
    return out.length ? out : null;
  };

  /*@3.NOOJ.35*/
  Overlay.prototype.caretNear = function (x, y) {
    var sr = this.sheet.getBoundingClientRect();
    if (y < sr.top - 40 || y > sr.bottom + 40) return null;
    var cx = Math.min(Math.max(x, sr.left + 8), sr.right - 8);
    var els = document.elementsFromPoint ? document.elementsFromPoint(cx, y) : [], blk = null, i;
    for (i = 0; i < els.length; i++) { if (els[i].matches && els[i].matches('[data-bid]') && this.sheet.contains(els[i])) { blk = els[i]; break; } }
    var cands = (blk || this.sheet).querySelectorAll(this.lineSel), best = null, bd = Infinity;
    for (i = 0; i < cands.length; i++) {
      var r = cands[i].getBoundingClientRect();
      if (!(r.height > 0) || !(r.width > 0)) continue;
      var dy = y < r.top ? r.top - y : (y > r.bottom ? y - r.bottom : 0);
      if (dy < bd) { bd = dy; best = r; }
    }
    if (!best || bd > 240) return null;
    var yy = Math.min(Math.max(y, best.top + 1), best.bottom - 1);
    var xx = Math.min(Math.max(x, best.left + 1), best.right - 1);
    return caretAt(xx, yy);
  };

  Overlay.prototype.worldToClient = function (p) {
    var r = this.cv.wet.getBoundingClientRect();
    var z = zoomOf(this.stage);
    var c = this.cv.cam;
    return { x: r.left + (p.x * c.z + c.x) * z, y: r.top + (p.y * c.z + c.y) * z };
  };

  Overlay.prototype.clientToWorld = function (x, y) {
    var r = this.cv.wet.getBoundingClientRect();
    var z = zoomOf(this.stage) || 1;
    var c = this.cv.cam;
    return { x: ((x - r.left) / z - c.x) / c.z, y: ((y - r.top) / z - c.y) / c.z };
  };

  /*@3.NOOJ.16*/
  Overlay.prototype.fitBoard = function (w) {
    if (!this.cv || !this.cv.contentBox) return;
    var bb = this.cv.contentBox();
    var need = bb ? Math.max(0, bb.x + bb.w) : 0;
    var room = Math.max(40, w - 10);
    var f = (need > room) ? (room / need) : 1;
    this.cv.setFit(Math.max(0.2, Math.min(1, f)));
  };

  /*@3.NOOJ.6*/
  Overlay.prototype.ensureCanvas = function () {
    if (this.cv || !window.GardenCanvas) return this.cv;
    var self = this;
    this.cv = GardenCanvas.mount(this.host, {
      height: 400,
      onWin: function () { self.syncWindow(); },
      onAdd: function (el) { if (self.onAdd) self.onAdd(el); },
      unview: function (el) { return self.unview ? self.unview(el) : 0; },
      hist: this.hist,
      snapText: function (bx) { return self.lineUnder(bx); },
      snapWord: function (pt) { return self.wordUnder(pt); },
      snapLines: function (st) { var pts = st && st.pts; return (pts && pts.length > 1) ? self.linesUnder(pts[0], pts[pts.length - 1]) : null; },
      /*@3.NOOJ.8*/
      bound: this.bound,
      onScroll: function (dx, dy) {
        var sc = self.scroller;
        if (typeof sc.scrollBy === 'function') sc.scrollBy({ left: -dx, top: -dy, behavior: 'instant' });
        else { sc.scrollTop -= dy; sc.scrollLeft -= dx; }
      },
      onPinch: function (phase, f, cx, cy) {
        if (self.onPinch) self.onPinch(phase, f, cx, cy);
      },
      onShapeBox: function (x, y, w, h, stage) { return self.onShapeBox ? self.onShapeBox(x, y, w, h, stage) : false; },
      onChange: function (d, quiet) {
        var out = {};
        for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) out[k] = d[k];
        out.ch = d.ch || 0;
        out.rw = self.refBase;
        self.onChange(out, quiet);
      },
      onState: function () { self.sync(); },
      onBand: function (r) { self.onBand(r); },
      onTap: function (p) { self.onTap(p); },
      onPass: function (x, y, src) { return self.onPass ? self.onPass(x, y, src) : false; },
      onScratch: this.onScratch ? function (cl, mode) { return self.onScratch(cl, mode); } : null,
      onUndo: this.onUndo ? function (box, kind) { self.onUndo(box, kind); } : null,
      onErased: this.onErased ? function (n, part) { self.onErased(n, part); } : null,
      /*@3.NOOJ.32*/
      onTextAt: self.onTextAt ? function (p, c) { self.onTextAt(p, c); } : null
    });
    this.cv.setTool(GardenCanvas.lastTool ? GardenCanvas.lastTool() : 'pen');
    if (this.hist) this.hist.register('ink', {
      undo: function () { return self.cv ? self.cv.undo() : false; },
      redo: function () { return self.cv ? self.cv.redo() : false; }
    });
    this.wet = this.cv.wet;
    /*@3.NOOJ.26*/
    function dropSel() {
      try {
        var sel = window.getSelection();
        if (sel && !sel.isCollapsed) sel.removeAllRanges();
      } catch (e) {}
      try {
        var ae = document.activeElement;
        if (ae && ae !== document.body && ae.blur &&
            ae.closest && ae.closest('.ne-root')) ae.blur();
      } catch (e2) {}
    }
    this.wet.addEventListener('pointerdown', function (e) {
      self.drawing = true;
      dropSel();
      if (e && e.cancelable) { try { e.preventDefault(); } catch (eP) {} }
      self.dim(true);
    });
    this.wet.addEventListener('selectstart', function (e) { e.preventDefault(); });
    this.wet.addEventListener('pointermove', function () {
      if (self.drawing) dropSel();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
      self.wet.addEventListener(ev, function () {
        self.drawing = false;
        self.dim(false);
      });
    });
    if (this.bound && this.scroller) {
      var selfW = this;
      this._scT = 0;
      this._onSc = function () {
        /*@3.NOOJ.24*/
        clearTimeout(selfW._scSettle);
        selfW._scSettle = setTimeout(function () { selfW.syncWindow(); }, 140);
        if (selfW._scT) return;
        selfW._scT = requestAnimationFrame(function () {
          selfW._scT = 0;
          selfW.syncWindow();
        });
      };
      this.scroller.addEventListener('scroll', this._onSc, { passive: true });
    }
    if (this.data && (this.data.ink || (this.data.shapes && this.data.shapes.length))) {
      var was = this.data.rw || this.data.w || 0;
      this.refW = this.bound ? this.refBase : pageW(this.sheet, zoomOf(this.stage));
      var self2 = this;
      var done = this.cv.load(this.data.ink, null, this.data.shapes, this.data.ts, this.data);
      if (done && done.then) done.then(function () { self2.migrateRef(was); if (self2.onLoad) self2.onLoad(); });
      else { this.migrateRef(was); if (this.onLoad) this.onLoad(); }
    }
    return this.cv;
  };

  /*@3.NOOJ.25*/
/*@3.NOOJ.33*/
/*@3.NOOJ.19*/

  Overlay.prototype.migrateRef = function (was) {
    if (!this.bound || !this.cv) return 0;
    var now = this.refBase;
    var k = (was && was > 0) ? (now / was) : 1;
    if (Math.abs(k - 1) < 0.002) return 0;
    var els = this.cv.els, i;
    for (i = 0; i < els.length; i++) this.cv.mapEl(els[i], 0, 0, 0, 0, k);
    this.cv.paint();
    this.cv.commit(true);
    return els.length;
  };

/*@3.NOOJ.10*/
  Overlay.prototype.setPick = function (on) {
    var want = !!on;
    this.pick = want;
    this.ensureCanvas();
    if (!this.refW) this.refW = this.bound ? this.refBase : pageW(this.sheet, zoomOf(this.stage));
    this.fit();
    if (this.cv) {
      this.cv.setPick(want);
      if (!want) { this.cv.deselect(); this.cv.setTool('pen'); }
    }
    this.host.hidden = false;
    this.host.setAttribute('data-live', (want || this.on) ? '1' : '0');
    return this.pick;
  };

  Overlay.prototype.clearBand = function (rect) {
    if (!this.cv) return 0;
    /*@3.NOOJ.22*/
    if (this.bound) return this.cv.deleteInWorldRect(rect);
    return this.cv.deleteInScreenRect(rect);
  };

  Overlay.prototype.show = function () {
    this.host.hidden = false;
    this.ensureCanvas();
    if (!this.refW) this.refW = this.bound ? this.refBase : pageW(this.sheet, zoomOf(this.stage));
    this.fit();
  };

  Overlay.prototype.toggle = function (on) {
    var want = (on == null) ? !this.on : !!on;
    if (want === this.on) return this.on;
    this.on = want;
    this.host.hidden = false;
    this.host.setAttribute('data-live', (want || this.pick) ? '1' : '0');
    this.scroller.classList.toggle('nov-drawing', want);
    if (want) { try { var s0 = window.getSelection(); if (s0) s0.removeAllRanges(); } catch (eS) {} }
    this.ensureCanvas();
    if (!this.refW) this.refW = this.bound ? this.refBase : pageW(this.sheet, zoomOf(this.stage));
    this.fit();
    if (this.dial) this.dial.show(want, want);
    if (want) this.sync();
    return this.on;
  };

  /*@3.NOOJ.3*/
  Overlay.prototype.dim = function (on) {
    if (this.dial) this.dial.dim(!!on);
  };

  Overlay.prototype.load = function (data) {
    this.data = data || null;
    var was = this.data ? (this.data.rw || this.data.w || 0) : 0;
    this.refW = this.bound ? this.refBase : pageW(this.sheet, zoomOf(this.stage));
    if (this.cv && this.data) {
      var self3 = this;
      var p = this.cv.load(this.data.ink, null, this.data.shapes, this.data.ts);
      if (p && p.then) p.then(function () { self3.migrateRef(was); if (self3.onLoad) self3.onLoad(); });
      else { this.migrateRef(was); if (this.onLoad) this.onLoad(); }
    }
  };

  Overlay.prototype.destroy = function () {
    if (this._onSc && this.scroller) {
      this.scroller.removeEventListener('scroll', this._onSc);
      this._onSc = null;
    }
    if (this.hist) this.hist.unregister('ink');
    if (this.cv) { try { this.cv.destroy(); } catch (e) {} this.cv = null; }
    if (this.host && this.host.parentNode) this.host.remove();
    if (this.dial) { try { this.dial.destroy(); } catch (e2) {} this.dial = null; }
    this.scroller.classList.remove('nov-drawing');
  };

  window.GardenNotesOverlay = {
    mount: function (opts) { return new Overlay(opts); }
  };
})();
