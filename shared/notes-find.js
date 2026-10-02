/*@3.NOFJ.1*/
;(function () {
  'use strict';
  if (window.GardenNotesFind) return;

  function L(ar, en) {
    var lang = 'ar';
    try { lang = localStorage.getItem('garden_lang') || 'ar'; } catch (e) {}
    return lang === 'en' ? en : ar;
  }

  function B() { return window.GardenNotesBlocks; }

  /*@3.NOFJ.2*/
  var MARK = /[ً-ْٰـ‌‍]/;
  var FOLD = {
    'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
    'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي'
  };

  function digit(c) {
    var k = c.charCodeAt(0);
    if (k >= 0x0660 && k <= 0x0669) return String(k - 0x0660);
    if (k >= 0x06F0 && k <= 0x06F9) return String(k - 0x06F0);
    return '';
  }

  function normSlow(src) {
    var out = '', map = [], i, c, d;
    for (i = 0; i < src.length; i++) {
      c = src.charAt(i);
      if (MARK.test(c)) continue;
      d = digit(c);
      if (d) c = d;
      else if (FOLD[c]) c = FOLD[c];
      else c = c.toLowerCase();
      out += c;
      map.push(i);
    }
    return { s: out, m: map };
  }

  /*@3.NOFJ.15*/
  var MARK_G = /[\u064b-\u0652\u0670\u0640\u200c\u200d]/g;
  var FOLD_G = /[\u0623\u0625\u0622\u0671\u0649\u0629\u0624\u0626\u0660-\u0669\u06f0-\u06f9]/g;
  function fold1(c) {
    var d = digit(c);
    return d || FOLD[c] || c;
  }
  function normFast(src) {
    return src.replace(MARK_G, '').replace(FOLD_G, fold1).toLowerCase();
  }

  /*@3.NOFJ.16*/
  function mapOf(row) {
    if (row.m) return row.m;
    var src = row.src || '', map = [], i;
    for (i = 0; i < src.length; i++) { if (MARK.test(src.charAt(i))) continue; map.push(i); }
    if (map.length !== row.s.length) { var q = normSlow(src); row.s = q.s; map = q.m; }
    row.m = map;
    return map;
  }

  function norm(src) {
    var s = normFast(src);
    return { s: s, m: null, src: src };
  }

  /*@3.NOFJ.20*/
  function fieldsOf(b) {
    var M = B(), out = [];
    if (!b) return out;
    if (b.ty === 'code') { out.push({ k: 'src', t: String(b.src || '') }); return out; }
    if (b.ty === 'math') { out.push({ k: 'tex', t: String(b.tex || '') }); return out; }
    if (b.ty === 'img') { if (typeof b.alt === 'string' && b.alt) out.push({ k: 'alt', t: b.alt }); return out; }
    if (Array.isArray(b.rt)) out.push({ k: 'rt', t: M.runsToText(b.rt) });
    if (Array.isArray(b.items)) {
      b.items.forEach(function (it, a) { out.push({ k: 'item', a: a, t: M.runsToText((it && it.rt) || []) }); });
    }
    if (Array.isArray(b.rows)) {
      b.rows.forEach(function (row, r) {
        (row || []).forEach(function (c, ci) { out.push({ k: 'cell', a: r, c: ci, t: M.runsToText((c && c.rt) || []) }); });
      });
    }
    return out;
  }

  function Find() {
    this.ed = null;
    this.bar = null;
    this.layer = null;
    this.q = '';
    this.hits = [];
    this.at = -1;
    this.idx = null;
    this.open = false;
  }

  /*@3.NOFJ.8*/
  Find.prototype.pdf = function () {
    return (this.getPdf && this.getPdf()) || null;
  };

  /*@3.NOFJ.5*/
  Find.prototype.index = function () {
    var ed = this.ed;
    if (!ed || !ed.doc) return [];
    var bs = ed.doc.blocks || [];
    var key = bs.length + ':' + (ed._findStamp || 0);
    if (this.idx && this.idx.key === key) return this.idx.rows;
    var rows = [], i, j, fs, f;
    for (i = 0; i < bs.length; i++) {
      fs = fieldsOf(bs[i]);
      for (j = 0; j < fs.length; j++) { f = fs[j]; f.src = f.t; f.s = normFast(f.t); f.m = null; }
      rows.push({ i: i, id: bs[i].id, fs: fs });
    }
    this.idx = { key: key, rows: rows };
    return rows;
  };

  Find.prototype.soil = function () {
    if (this.ed) this.ed._findStamp = (this.ed._findStamp || 0) + 1;
    this.idx = null;
  };

  /*@3.NOFJ.17*/
  Find.prototype.scan = function () {
    var out = [], nq = normFast(String(this.q == null ? '' : this.q));
    if (nq.length < 1) return out;
    var rows = this.index(), cap = 5000, i, j, r, f, k, from, m, e1, e;
    for (i = 0; i < rows.length && out.length < cap; i++) {
      r = rows[i];
      for (j = 0; j < r.fs.length && out.length < cap; j++) {
        f = r.fs[j];
        if (!f.s || f.s.indexOf(nq) < 0) continue;
        m = mapOf(f);
        from = 0;
        while ((k = f.s.indexOf(nq, from)) !== -1) {
          e1 = m[k + nq.length - 1];
          e = (e1 != null ? e1 + 1 : m[k] + 1);
          while (e < f.src.length && MARK.test(f.src.charAt(e))) e++;
          out.push({ b: r.i, id: r.id, fi: j, k: f.k, a: f.a, c: f.c, s: m[k], e: e });
          from = k + nq.length;
          if (out.length >= cap) break;
        }
      }
    }
    return out;
  };

  function sameHit(a, b) { return !!(a && b && a.id === b.id && a.fi === b.fi && a.s === b.s); }
  function after(h, p) { return h.b > p.b || (h.b === p.b && (h.fi > p.fi || (h.fi === p.fi && h.s >= p.s))); }

  Find.prototype.search = function (q, keep) {
    var prev = (keep && this.at >= 0 && this.hits[this.at]) ? this.hits[this.at] : null;
    this.q = String(q == null ? '' : q);
    this.hits = [];
    this.at = -1;
    /*@3.NOFJ.9*/
    var P = this.pdf();
    if (P) {
      var n = P.search(this.q);
      if (n) P.next();
      this.say();
      return n;
    }
    this.hits = this.scan();
    this.say();
    var start = 0;
    if (prev) {
      for (var pi = 0; pi < this.hits.length; pi++) { if (sameHit(this.hits[pi], prev) || after(this.hits[pi], prev)) { start = pi; break; } }
    }
    if (this.hits.length) this.go(start);
    else this.paint();
    return this.hits.length;
  };

  /*@3.NOFJ.18*/
  Find.prototype.refresh = function () {
    if (!this.open || !this.q || this.pdf()) { this.paint(); this.say(); return; }
    var cur = (this.at >= 0 && this.hits[this.at]) ? this.hits[this.at] : null;
    var was = this.at;
    this.hits = this.scan();
    var at = -1, i;
    if (cur) {
      for (i = 0; i < this.hits.length; i++) { if (sameHit(this.hits[i], cur)) { at = i; break; } }
      if (at < 0) for (i = 0; i < this.hits.length; i++) { if (this.hits[i].b >= cur.b) { at = i; break; } }
    }
    if (at < 0 && this.hits.length) at = Math.max(0, Math.min(was, this.hits.length - 1));
    this.at = this.hits.length ? at : -1;
    this.paint();
    this.say();
  };

  Find.prototype.nodeOf = function (id) {
    var ed = this.ed;
    if (!ed || !ed.root) return null;
    var map = ed.bidMap ? ed.bidMap() : null;
    return (map && map[id]) || ed.root.querySelector('[data-bid="' + id + '"]');
  };

  Find.prototype.go = function (at) {
    if (!this.hits.length) return false;
    var n = this.hits.length;
    this.at = ((at % n) + n) % n;
    var h = this.hits[this.at];
    var ed = this.ed;
    if (ed && ed._win && ed.winShow) ed.winShow(h.id);
    this.reveal(h, false);
    /*@3.NOFJ.19*/
    var self = this;
    if (this._goQ) cancelAnimationFrame(this._goQ);
    this._goQ = requestAnimationFrame(function () {
      self._goQ = 0;
      if (!self.open || !self.ed || !self.ed.root) return;
      var cur = self.hits[self.at];
      if (sameHit(cur, h)) self.reveal(cur, true);
      self.paint();
    });
    this.paint();
    this.say();
    return true;
  };

  /*@3.NOFJ.21*/
  Find.prototype.reveal = function (h, soft) {
    var ed = this.ed, node = this.nodeOf(h.id);
    if (!ed || !node) return;
    var got = this.rectsOf(node, h, true), r = null, i, q;
    for (i = 0; i < got.rs.length; i++) {
      q = got.rs[i];
      r = r ? { top: Math.min(r.top, q.top), bottom: Math.max(r.bottom, q.bottom), left: Math.min(r.left, q.left), right: Math.max(r.right, q.right) } : { top: q.top, bottom: q.bottom, left: q.left, right: q.right };
    }
    if (!r) { var nr = node.getBoundingClientRect(); r = { top: nr.top, bottom: Math.min(nr.bottom, nr.top + 40), left: nr.left, right: nr.right }; }
    var sc = ed.scroller ? ed.scroller() : null;
    if (!sc) { try { node.scrollIntoView({ block: 'center' }); } catch (e) { node.scrollIntoView(); } return; }
    var sr = sc.getBoundingClientRect(), pad = Math.min(120, sr.height * 0.18);
    var inView = r.top >= sr.top + pad && r.bottom <= sr.bottom - pad;
    if (!inView && !(soft && r.top >= sr.top && r.bottom <= sr.bottom)) {
      sc.scrollTop += ((r.top + r.bottom) / 2) - (sr.top + sr.height / 2);
    }
    var el = got.el, hs = el ? el.parentElement : null, g = 0, cs;
    while (hs && hs !== node.parentNode && g++ < 8) {
      if (hs.scrollWidth > hs.clientWidth + 2) {
        try { cs = getComputedStyle(hs).overflowX; } catch (eC) { cs = ''; }
        if (cs === 'auto' || cs === 'scroll') {
          var hr = hs.getBoundingClientRect(), mid = (r.left + r.right) / 2;
          if (mid < hr.left + 24 || mid > hr.right - 24) hs.scrollLeft += mid - (hr.left + hr.width / 2);
          break;
        }
      }
      hs = hs.parentElement;
    }
  };

  Find.prototype.next = function (back) {
    var P = this.pdf();
    if (P) {
      if (back) P.prev(); else P.next();
      this.say();
      return true;
    }
    return this.go(this.at + (back ? -1 : 1));
  };

  /*@3.NOFJ.3*/
  Find.prototype.host = function () {
    var ed = this.ed;
    if (!ed || !ed.root) return null;
    var el = this.layer;
    if (el && el.parentNode === ed.root) return el;
    el = document.createElement('div');
    el.className = 'nf-layer';
    el.setAttribute('aria-hidden', 'true');
    ed.root.appendChild(el);
    this.layer = el;
    return el;
  };

  /*@3.NOFJ.22*/
  function rangeIn(root, from, to) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var acc = 0, n, len, a = null, b = null, last = null, ix;
    while ((n = w.nextNode())) {
      if (n.nodeType === 1) {
        if (n.nodeName !== 'BR') continue;
        ix = [].indexOf.call(n.parentNode.childNodes, n);
        if (a === null && acc + 1 > from) a = [n.parentNode, ix];
        acc += 1;
        if (a !== null && acc >= to) { b = [n.parentNode, ix + 1]; break; }
        continue;
      }
      len = n.nodeValue.length;
      last = n;
      if (a === null && acc + len > from) a = [n, from - acc];
      if (a !== null && acc + len >= to) { b = [n, to - acc]; break; }
      acc += len;
    }
    if (!a) return null;
    if (!b) b = last ? [last, last.nodeValue.length] : a;
    var r = document.createRange();
    try { r.setStart(a[0], Math.max(0, a[1])); r.setEnd(b[0], Math.max(0, b[1])); } catch (e) { return null; }
    return r;
  }

  function shown(el) {
    if (!el || el.hidden || (el.closest && el.closest('[hidden]'))) return false;
    return el.getClientRects().length > 0;
  }

  function fieldEl(node, h, fill) {
    if (h.k === 'rt') return node.querySelector('.ne-text');
    if (h.k === 'item') return node.querySelectorAll('.ne-li')[h.a] || null;
    if (h.k === 'cell') {
      var tb = node.querySelector('table.ne-tbl'), tr = tb && tb.rows ? tb.rows[h.a] : null;
      if (!tr && fill && node.__tblFill) { try { node.__tblFill(true); } catch (eF) {} tr = tb && tb.rows ? tb.rows[h.a] : null; }
      if (!tr) return null;
      if (tr.hasAttribute('data-hollow')) {
        if (!fill || !node.__tblRow) return null;
        try { node.__tblRow(tr); } catch (eR) { return null; }
      }
      return tr.querySelectorAll('.ne-cell')[h.c] || null;
    }
    if (h.k === 'src') return node.querySelector('.ne-code');
    if (h.k === 'alt') return node.querySelector('.ne-cap');
    return null;
  }

  /*@3.NOFJ.23*/
  Find.prototype.altOf = function (node, h) {
    var box = null;
    if (h.k === 'src') {
      var dg = node.querySelector('.ne-dgm');
      if (dg && !dg.hidden) {
        var svg = dg.querySelector('svg'), nq = normFast(String(this.q || '')), out = [], i, r, ts;
        if (svg && nq) {
          ts = svg.querySelectorAll('text');
          for (i = 0; i < ts.length && out.length < 60; i++) {
            if (normFast(ts[i].textContent || '').indexOf(nq) < 0) continue;
            r = ts[i].getBoundingClientRect();
            if (r.width && r.height) out.push(r);
          }
        }
        if (out.length) return out;
        box = dg;
      }
    } else if (h.k === 'tex') {
      var ta = node.querySelector('.ne-tex');
      box = (ta && !ta.hidden) ? ta : node.querySelector('.ne-math-out');
    } else if (h.k === 'alt') {
      box = node.querySelector('.ne-img-view');
    }
    if (!box) box = node;
    var br = box.getBoundingClientRect();
    return (br.width && br.height) ? [br] : [];
  };

  Find.prototype.rectsOf = function (node, h, fill) {
    var el = fieldEl(node, h, fill), rs = [], i;
    if (el && h.k !== 'tex' && shown(el)) {
      var rg = rangeIn(el, h.s, h.e);
      if (rg) {
        var rr = rg.getClientRects();
        for (i = 0; i < rr.length; i++) if (rr[i].width > 0 && rr[i].height > 0) rs.push(rr[i]);
      }
      if (rs.length) return { rs: rs, box: false, el: el };
    }
    return { rs: this.altOf(node, h), box: true, el: el };
  };

  Find.prototype.paint = function () {
    if (this.pdf()) return;
    var host = this.host();
    if (!host) return;
    if (!this.hits.length || !this.open) { host.textContent = ''; return; }
    var ed = this.ed;
    var z = ed.zoomOf ? (ed.zoomOf() || 1) : 1;
    /*@3.NOFJ.6*/
    /*@3.NOFJ.14*/
    var rr = host.getBoundingClientRect();
    var map = ed.bidMap ? ed.bidMap() : null;
    var seen = 0, out = [], i, k, done = {};
    var winA = -1, winB = -1;
    if (ed._win) { winA = ed._win.from; winB = ed._win.to; }
    for (i = 0; i < this.hits.length && seen < 600; i++) {
      var h = this.hits[i];
      if (winA >= 0 && (h.b < winA || h.b > winB)) continue;
      var node = map ? map[h.id] : ed.root.querySelector('[data-bid="' + h.id + '"]');
      if (!node) continue;
      var got = this.rectsOf(node, h, i === this.at);
      for (k = 0; k < got.rs.length; k++) {
        var q = got.rs[k];
        var key = got.box ? (Math.round(q.left) + ':' + Math.round(q.top) + ':' + Math.round(q.width)) : '';
        if (key && done[key] && i !== this.at) continue;
        if (key) done[key] = 1;
        out.push([i === this.at, got.box, (q.left - rr.left) / z, (q.top - rr.top) / z, q.width / z, q.height / z]);
        seen++;
      }
    }
    var frag = document.createDocumentFragment();
    for (i = 0; i < out.length; i++) {
      var d = document.createElement('div');
      d.className = 'nf-hit';
      if (out[i][0]) d.setAttribute('data-on', '1');
      if (out[i][1]) d.setAttribute('data-box', '1');
      d.style.left = out[i][2] + 'px';
      d.style.top = out[i][3] + 'px';
      d.style.width = out[i][4] + 'px';
      d.style.height = out[i][5] + 'px';
      frag.appendChild(d);
    }
    host.textContent = '';
    host.appendChild(frag);
  };

  Find.prototype.say = function (msg) {
    if (!this.bar) return;
    var out = this.bar.querySelector('[data-nf="count"]');
    if (!out) return;
    if (msg) { out.textContent = msg; out.removeAttribute('data-none'); return; }
    /*@3.NOFJ.10*/
    var P = this.pdf();
    if (P) {
      var st = P.state();
      var hint = this.bar.querySelector('.nf-ocr');
      var soon = !!(st.q && st.ocr === 'pending');
      if (soon && !hint) { hint = document.createElement('p'); hint.className = 'nf-ocr'; this.bar.appendChild(hint); }
      if (hint) {
        hint.hidden = !soon;
        if (soon) hint.textContent = L('نصوصُ الصور ستُتاح للبحث قريباً', 'Text inside images will be searchable soon');
      }
      if (!st.q) { out.textContent = ''; out.removeAttribute('data-none'); return; }
      var scan = st.scanning
        ? ' \u00b7 ' + Math.round(st.scanned * 100 / Math.max(1, st.pages)) + '%'
        : '';
      if (!st.total) {
        out.textContent = (st.scanning ? L('\u064a\u064f\u0642\u0631\u0623 \u0627\u0644\u0645\u0644\u0641\u0651', 'Reading the file') + scan
                                       : L('\u0644\u0627 \u0646\u062a\u064a\u062c\u0629', 'No results'));
        out.setAttribute('data-none', st.scanning ? '0' : '1');
        return;
      }
      out.removeAttribute('data-none');
      out.textContent = (st.cur + 1) + ' / ' + st.total + scan;
      return;
    }
    if (!this.q) { out.textContent = ''; out.removeAttribute('data-none'); return; }
    if (!this.hits.length) {
      out.textContent = L('لا نتيجة', 'No results');
      out.setAttribute('data-none', '1');
      return;
    }
    out.removeAttribute('data-none');
    out.textContent = (this.at + 1) + ' / ' + this.hits.length;
  };

  Find.prototype.place = function () {
    var bar = this.bar;
    if (!bar || bar.hidden) return;
    var host = bar.offsetParent;
    if (!host) return;
    var hr = host.getBoundingClientRect();
    var w = bar.offsetWidth, h = bar.offsetHeight;
    if (!w || !hr.width) return;
    var btn = document.getElementById('na-find-btn');
    var br = btn ? btn.getBoundingClientRect() : null;
    var pad = 8, x, y;
    if (br && br.width > 0 && br.height > 0) {
      x = br.left + br.width / 2 - w / 2 - hr.left;
      y = br.bottom - hr.top + 6;
    } else {
      x = hr.width - w - pad;
      y = pad;
    }
    x = Math.max(pad, Math.min(hr.width - w - pad, x));
    y = Math.max(pad, Math.min(Math.max(pad, hr.height - h - pad), y));
    bar.style.left = Math.round(x) + 'px';
    bar.style.insetBlockStart = Math.round(y) + 'px';
  };

  /*@3.NOFJ.24*/
  Find.prototype.canRep = function () {
    var ed = this.ed;
    return !this.pdf() && !!(ed && ed.doc && !ed.readOnly && ed.root && ed.root.isConnected);
  };
  Find.prototype.repShow = function (on) {
    var row = this.bar ? this.bar.querySelector('[data-nf="row"]') : null;
    var tg = this.bar ? this.bar.querySelector('[data-nf="rep"]') : null;
    var ok = this.canRep();
    if (tg) tg.hidden = !ok;
    var want = !!on && ok;
    if (row) row.hidden = !want;
    if (tg) tg.setAttribute('aria-expanded', want ? 'true' : 'false');
    if (this.bar) { if (want) this.bar.setAttribute('data-rep', '1'); else this.bar.removeAttribute('data-rep'); }
    this.place();
    return want;
  };

  Find.prototype.show = function (on, rep) {
    /*@3.NOFJ.26*/
    if (this.layer && (!this.ed || this.layer.parentNode !== this.ed.root)) this.layer = null;
    if (!this.bar) return;
    var want = on !== false;
    this.open = want;
    this.bar.hidden = !want;
    var btn = document.getElementById('na-find-btn');
    if (btn) btn.setAttribute('aria-expanded', want ? 'true' : 'false');
    /*@3.NOFJ.11*/
    var P = this.pdf();
    if (P) {
      this.repShow(false);
      if (want) {
        this.place();
        var pin = this.bar.querySelector('[data-nf="q"]');
        if (pin) { try { pin.focus(); pin.select(); } catch (e3) {} }
        if (this.q) this.search(this.q);
        else this.say();
      } else { P.clear(); this.say(); }
      return;
    }
    if (want) {
      var open = this.repShow(rep === true ? true : (rep === false ? false : !!(this.bar.getAttribute('data-rep'))));
      this.place();
      var inp = this.bar.querySelector('[data-nf="q"]');
      var wi = this.bar.querySelector('[data-nf="with"]');
      var foc = (open && rep === true && inp && inp.value) ? wi : inp;
      if (foc) { try { foc.focus(); foc.select(); } catch (e) {} }
      if (this.q) this.search(this.q, true);
    } else {
      this.hits = []; this.at = -1;
      this.paint();
      var ed = this.ed;
      if (ed && ed.root) {
        var f = ed.root.querySelector('.ne-text, .ne-li');
        if (f && !this.coarse()) { try { f.focus({ preventScroll: true }); } catch (e2) {} }
      }
    }
  };

  Find.prototype.coarse = function () {
    try { return !!(window.matchMedia && matchMedia('(hover: none)').matches); }
    catch (e) { return false; }
  };

  /*@3.NOFJ.25*/
  function strSplice(s, a, b, t) { s = String(s == null ? '' : s); return s.slice(0, a) + t + s.slice(b); }
  function spliceRuns(rt, a, b, text) {
    var M = B(), before = [], tpl = null, afterR = [], pos = 0, i, r, s, st, en;
    rt = rt || [];
    for (i = 0; i < rt.length; i++) {
      r = rt[i]; s = r.s == null ? '' : String(r.s); st = pos; en = pos + s.length; pos = en;
      if (st < a) before.push(en <= a ? r : Object.assign({}, r, { s: s.slice(0, a - st) }));
      if (en > b) afterR.push(st >= b ? r : Object.assign({}, r, { s: s.slice(b - st) }));
      if (!tpl && s.length && ((st <= a && a < en) || (st >= a && st < b))) tpl = r;
    }
    if (!tpl) tpl = before.length ? before[before.length - 1] : (afterR.length ? afterR[0] : {});
    var mid = text ? [Object.assign({}, tpl, { s: text })] : [];
    var all = before.concat(mid, afterR), out = [], last;
    for (i = 0; i < all.length; i++) {
      r = all[i];
      if (!r.s) continue;
      last = out[out.length - 1];
      if (last && M && M.sameRun && M.sameRun(last, r)) { last.s += r.s; continue; }
      out.push(Object.assign({}, r));
    }
    return out;
  }
  function setField(b, h, text) {
    if (h.k === 'rt') { b.rt = spliceRuns(b.rt || [], h.s, h.e, text); return true; }
    if (h.k === 'item') { var it = b.items && b.items[h.a]; if (!it) return false; it.rt = spliceRuns(it.rt || [], h.s, h.e, text); return true; }
    if (h.k === 'cell') { var row = b.rows && b.rows[h.a], c = row && row[h.c]; if (!c) return false; c.rt = spliceRuns(c.rt || [], h.s, h.e, text); return true; }
    if (h.k === 'src') { b.src = strSplice(b.src, h.s, h.e, text); return true; }
    if (h.k === 'tex') { b.tex = strSplice(b.tex, h.s, h.e, text); return true; }
    if (h.k === 'alt') { b.alt = strSplice(b.alt, h.s, h.e, text); return true; }
    return false;
  }
  Find.prototype.fresh = function () {
    var ed = this.ed;
    try { if (ed.readAll) ed.readAll(); } catch (e0) {}
    this.soil();
    return this.scan();
  };
  Find.prototype.apply = function (list, text) {
    var ed = this.ed, bs = ed.doc.blocks, ids = [], seen = {}, i, h, n = 0;
    if (!list.length) return 0;
    var before = ed.snapshot();
    list = list.slice().sort(function (x, y) { return (y.b - x.b) || (y.fi - x.fi) || (y.s - x.s); });
    for (i = 0; i < list.length; i++) {
      h = list[i];
      var b = bs[h.b];
      if (!b || b.id !== h.id) continue;
      if (!setField(b, h, text)) continue;
      n++;
      if (!seen[h.id]) { seen[h.id] = 1; ids.push(h.id); }
    }
    if (!n) return 0;
    ed.pushUndo(before);
    var ok = false;
    try { ok = ed.renderMany ? ed.renderMany(ids) : false; } catch (eR) { ok = false; }
    if (!ok) { try { ed.render(); } catch (eR2) {} }
    else if (ed._win && ed.natMeasure) {
      var off = [];
      for (i = 0; i < ids.length; i++) if (!ed.root.querySelector(':scope > [data-bid="' + ids[i] + '"]')) off.push(ids[i]);
      if (off.length) { try { ed.natMeasure(off); ed.reflowEng(); } catch (eM) {} }
    }
    ed.touch();
    if (ed.emitState) ed.emitState();
    this.soil();
    return n;
  };
  Find.prototype.withText = function () {
    var wi = this.bar ? this.bar.querySelector('[data-nf="with"]') : null;
    return wi ? String(wi.value) : '';
  };
  Find.prototype.replaceOne = function () {
    if (!this.canRep() || !this.q) return 0;
    var cur = (this.at >= 0 && this.hits[this.at]) ? this.hits[this.at] : null;
    var fresh = this.fresh(), i, h = null, text = this.withText();
    if (cur) for (i = 0; i < fresh.length; i++) { if (sameHit(fresh[i], cur)) { h = fresh[i]; break; } }
    if (!h) { this.hits = fresh; if (fresh.length) this.go(0); else { this.paint(); this.say(); } return 0; }
    var n = this.apply([h], text);
    this.hits = this.scan();
    var nx = -1, past = { b: h.b, fi: h.fi, s: h.s + text.length };
    for (i = 0; i < this.hits.length; i++) { if (after(this.hits[i], past)) { nx = i; break; } }
    if (this.hits.length) this.go(nx < 0 ? 0 : nx);
    else { this.at = -1; this.paint(); this.say(); }
    return n;
  };
  Find.prototype.replaceAll = function () {
    if (!this.canRep() || !this.q) return 0;
    var fresh = this.fresh(), text = this.withText();
    var n = this.apply(fresh, text);
    this.hits = this.scan();
    this.at = this.hits.length ? 0 : -1;
    this.paint();
    this.say(n ? L('استُبدل ' + n, n + ' replaced') : '');
    var self = this;
    clearTimeout(this._sayT);
    this._sayT = setTimeout(function () { self.say(); }, 2200);
    return n;
  };

  Find.prototype.bind = function (opts) {
    var self = this;
    this.getEd = opts.editor;
    this.getPdf = opts.pdf || null;
    this.bar = opts.bar || document.getElementById('na-find-bar');
    if (!this.bar) return;
    var inp = this.bar.querySelector('[data-nf="q"]');
    var wi = this.bar.querySelector('[data-nf="with"]');

    var sync = function () { self.ed = self.getEd ? self.getEd() : null; };

    if (inp) {
      /*@3.NOFJ.12*/
      var inT = 0;
      inp.addEventListener('input', function () {
        clearTimeout(inT);
        inT = setTimeout(function () { sync(); self.search(inp.value, true); }, 90);
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); sync(); self.next(e.shiftKey); return; }
        if (e.key === 'Escape') { e.preventDefault(); self.show(false); }
      });
    }
    if (wi) {
      wi.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); sync(); if (e.ctrlKey || e.metaKey || e.altKey) self.replaceAll(); else self.replaceOne(); return; }
        if (e.key === 'Escape') { e.preventDefault(); self.show(false); }
      });
    }
    this.bar.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-nf]') : null;
      if (!b) return;
      var k = b.getAttribute('data-nf');
      sync();
      if (k === 'next') self.next(false);
      else if (k === 'prev') self.next(true);
      else if (k === 'shut') self.show(false);
      else if (k === 'rep') { var on = self.repShow(b.getAttribute('aria-expanded') !== 'true'); var fi = on ? wi : inp; if (fi) { try { fi.focus(); } catch (eF) {} } }
      else if (k === 'one') self.replaceOne();
      else if (k === 'all') self.replaceAll();
    });

    /*@3.NOFJ.4*/
    this._keys = function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && (e.code === 'KeyF' || e.code === 'KeyH')) {
        sync();
        if (!self.pdf() && (!self.ed || !self.ed.root || !self.ed.root.isConnected)) return;
        if (e.code === 'KeyH' && self.pdf()) return;
        e.preventDefault();
        self.show(true, e.code === 'KeyH' ? true : undefined);
        return;
      }
      if (!self.open) return;
      if (e.code === 'F3') { e.preventDefault(); sync(); self.next(e.shiftKey); return; }
      if (e.key === 'Escape') {
        var inBar = self.bar.contains(e.target);
        if (inBar || !e.target.closest || !e.target.closest('dialog')) {
          e.preventDefault();
          self.show(false);
        }
      }
    };
    document.addEventListener('keydown', this._keys, true);

    var btn = document.getElementById('na-find-btn');
    if (btn) btn.addEventListener('click', function () { sync(); self.show(self.bar.hidden); });

    /*@3.NOFJ.7*/
    document.addEventListener('pointerdown', function (e) {
      if (!self.open) return;
      var t = e.target;
      if (self.bar.contains(t)) return;
      if (t.closest && t.closest('#na-find-btn')) return;
      self.show(false);
    }, true);

    this._relay = function () { if (self.open) { self.place(); self.paint(); } };
    window.addEventListener('resize', this._relay, { passive: true });
    document.addEventListener('garden:languageChanged', function () { self.say(); });
  };

  Find.prototype.onDocChange = function () {
    this.soil();
    this.refresh();
  };

  /*@3.NOFJ.13*/
  Find.prototype.onLayout = function () {
    var self = this;
    if (!this.open || this._lq) return;
    this._lq = requestAnimationFrame(function () { self._lq = 0; if (self.open) self.paint(); });
  };

  var inst = new Find();
  window.GardenNotesFind = {
    bind: function (o) { inst.bind(o || {}); },
    show: function (on, rep) { inst.ed = inst.getEd ? inst.getEd() : inst.ed; inst.show(on, rep); },
    isOpen: function () { return inst.open; },
    soil: function () { inst.onDocChange(); },
    relayout: function () { inst.onLayout(); },
    search: function (q) { inst.ed = inst.getEd ? inst.getEd() : inst.ed; return inst.search(q); },
    replace: function (w, all) { inst.ed = inst.getEd ? inst.getEd() : inst.ed; var wi = inst.bar ? inst.bar.querySelector('[data-nf="with"]') : null; if (wi && w != null) wi.value = String(w); return all ? inst.replaceAll() : inst.replaceOne(); },
    tell: function () { inst.say(); },
    next: function (b) { return inst.next(b); },
    hits: function () { return inst.hits.length; },
    at: function () { return inst.at; },
    normalize: norm,
    _i: inst
  };
})();
