;(function () {
  'use strict';

  var MAX_PAGES = 9000;
  var LIB = 'shared/vendor/pdflib/pdf-lib.min.js';

  function isAr() {
    return (document.documentElement.lang || localStorage.getItem('garden_lang') || 'ar') === 'ar';
  }
  function L(a, b) { return isAr() ? a : b; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { return '<span class="npe-num">' + esc(n) + '</span>'; }

  var ROOT = (function () {
    var sc = document.currentScript;
    return (sc && sc.src) ? sc.src.replace(/shared[/]notes-pdfedit[.]js([?].*)?$/, '') : '../';
  })();
  var VER = (function () {
    var sc = document.currentScript;
    var m = sc && sc.src ? /[?&]v=([^&]+)/.exec(sc.src) : null;
    return m ? m[1] : '';
  })();

  var libP = null;
  function lib() {
    if (window.PDFLib && window.PDFLib.PDFDocument) return Promise.resolve(window.PDFLib);
    if (!libP) {
      libP = new Promise(function (ok, no) {
        var s = document.createElement('script');
        s.src = ROOT + LIB + (VER ? '?v=' + VER : '');
        s.onload = function () { window.PDFLib ? ok(window.PDFLib) : no(new Error('pdflib_missing')); };
        s.onerror = function () { no(new Error('pdflib_load')); };
        document.head.appendChild(s);
      }).catch(function (e) { libP = null; throw e; });
    }
    return libP;
  }

  var DIG = { '٠': 0, '١': 1, '٢': 2, '٣': 3, '٤': 4, '٥': 5, '٦': 6, '٧': 7, '٨': 8, '٩': 9,
              '۰': 0, '۱': 1, '۲': 2, '۳': 3, '۴': 4, '۵': 5, '۶': 6, '۷': 7, '۸': 8, '۹': 9 };
  function parseRange(str, n) {
    var s = String(str || '').replace(/[٠-٩۰-۹]/g, function (c) { return String(DIG[c]); });
    var parts = s.split(/[,،;؛\s]+/), out = {}, bad = [], i;
    for (i = 0; i < parts.length; i++) {
      var t = parts[i];
      if (!t) continue;
      var m = /^(\d+)(?:[-–—ـ~:](\d+))?$/.exec(t);
      if (!m) { bad.push(t); continue; }
      var a = +m[1], b = m[2] ? +m[2] : a;
      if (a > b) { var x = a; a = b; b = x; }
      if (a < 1 || b > n) { bad.push(t); a = Math.max(1, a); b = Math.min(n, b); }
      for (var k = a; k <= b; k++) out[k] = 1;
    }
    var pages = Object.keys(out).map(Number).sort(function (p, q) { return p - q; });
    return { pages: pages, bad: bad };
  }

  function rotOf(page, L0) {
    try { return page.getRotation().angle || 0; } catch (e) { return 0; }
  }

  /*@3.NOPJ13.1*/
  function prep(P, d, k) {
    var N = P.PDFName.of, ctx = d.context, pages = d.getPages(), at = {}, named = null, i, j;
    for (i = 0; i < pages.length; i++) at[pages[i].ref.toString()] = i;
    function key(o) {
      o = ctx.lookup(o);
      try { return o && o.decodeText ? o.decodeText() : null; } catch (e) { return null; }
    }
    function names() {
      if (named) return named;
      named = {};
      var n = 0;
      var put = function (a, v) { var s = key(a); if (s != null && !(s in named)) { named[s] = v; n++; } };
      var walk = function (node, depth) {
        node = ctx.lookup(node);
        if (!node || !node.get || depth > 32 || n > 20000) return;
        var ns = ctx.lookup(node.get(N('Names'))), q;
        if (ns && ns.size) for (q = 0; q + 1 < ns.size(); q += 2) put(ns.get(q), ns.get(q + 1));
        var kids = ctx.lookup(node.get(N('Kids')));
        if (kids && kids.size) for (q = 0; q < kids.size(); q++) walk(kids.get(q), depth + 1);
      };
      var nm = ctx.lookup(d.catalog.get(N('Names')));
      if (nm && nm.get) walk(nm.get(N('Dests')), 0);
      var old = ctx.lookup(d.catalog.get(N('Dests')));
      if (old && old.entries) old.entries().forEach(function (e) { put(e[0], e[1]); });
      return named;
    }
    function target(dst, depth) {
      dst = ctx.lookup(dst);
      if (!dst || depth > 4) return null;
      if (dst instanceof P.PDFArray) {
        if (!dst.size()) return null;
        var pg = dst.get(0);
        var ix = pg instanceof P.PDFRef ? at[pg.toString()] : (pg instanceof P.PDFNumber ? pg.asNumber() : null);
        if (ix == null || !(ix >= 0 && ix < pages.length)) return null;
        var v = [];
        for (var q = 1; q < dst.size(); q++) v.push(ctx.lookup(dst.get(q)));
        return { i: ix, v: v };
      }
      if (dst instanceof P.PDFDict) return target(dst.get(N('D')), depth + 1);
      var s = key(dst);
      return s != null && names()[s] ? target(names()[s], depth + 1) : null;
    }
    function goTo(o) {
      var dst = o.get(N('Dest'));
      if (dst) return { t: target(dst, 0), a: 0 };
      var a = ctx.lookup(o.get(N('A')));
      if (a && a.get && String(a.get(N('S'))) === '/GoTo') return { t: target(a.get(N('D')), 0), a: 1 };
      return null;
    }
    for (i = 0; i < pages.length; i++) {
      var an = ctx.lookup(pages[i].node.get(N('Annots')));
      if (!an || !an.size) continue;
      for (j = 0; j < an.size(); j++) {
        var x = ctx.lookup(an.get(j));
        if (!x || !x.get) continue;
        x.delete(N('P'));
        if (String(x.get(N('Subtype'))) !== '/Link') continue;
        var g = goTo(x);
        if (!g) continue;
        x.delete(N('Dest'));
        if (g.a) x.delete(N('A'));
        x.set(N('GDoc'), P.PDFNumber.of(k));
        x.set(N('GTo'), P.PDFNumber.of(g.t ? g.t.i : -1));
        if (g.t && g.t.v.length) x.set(N('GView'), ctx.obj(g.t.v));
      }
    }
    var seen = 0;
    function walkOl(first, depth) {
      var out = [], node = first, been = {};
      while (node && seen < 5000 && depth < 16) {
        var id = String(node);
        if (been[id]) break;
        been[id] = 1;
        var o = ctx.lookup(node);
        if (!o || !o.get) break;
        seen++;
        var g = goTo(o), c = ctx.lookup(o.get(N('Count')));
        out.push({ title: ctx.lookup(o.get(N('Title'))), t: g && g.t,
                   closed: c instanceof P.PDFNumber && c.asNumber() < 0,
                   kids: walkOl(o.get(N('First')), depth + 1) });
        node = o.get(N('Next'));
      }
      return out;
    }
    var ol = ctx.lookup(d.catalog.get(N('Outlines')));
    d.__gol = ol && ol.get ? walkOl(ol.get(N('First')), 0) : [];
    d.__mode = d.catalog.get(N('PageMode')) || null;
  }

  function relink(P, out, got, pos) {
    var N = P.PDFName.of, ctx = out.context;
    var where = function (k, t) {
      var r = t ? pos[k + ':' + t.i] : null;
      return r ? ctx.obj([r].concat(t.v)) : null;
    };
    out.getPages().forEach(function (pg) {
      var an = ctx.lookup(pg.node.get(N('Annots')));
      if (!an || !an.size) return;
      for (var j = an.size() - 1; j >= 0; j--) {
        var a = ctx.lookup(an.get(j));
        if (!a || !a.get || !a.get(N('GTo'))) continue;
        var k = a.get(N('GDoc')).asNumber(), t = a.get(N('GTo')).asNumber();
        var view = ctx.lookup(a.get(N('GView')));
        a.delete(N('GDoc')); a.delete(N('GTo')); a.delete(N('GView'));
        var r = t >= 0 ? pos[k + ':' + t] : null;
        if (!r) { an.remove(j); continue; }
        a.set(N('Dest'), ctx.obj([r].concat(view && view.asArray ? view.asArray() : [])));
      }
    });
    function fix(n, k) {
      var kids = [];
      n.kids.forEach(function (c) { var x = fix(c, k); if (x) kids.push(x); });
      var dest = where(k, n.t) || (kids.length ? kids[0].dest : null);
      return dest ? { title: n.title, dest: dest, kids: kids, closed: n.closed } : null;
    }
    var tree = [];
    got.forEach(function (d, k) {
      if (d && d.__gol) d.__gol.forEach(function (n) { var x = fix(n, k); if (x) tree.push(x); });
    });
    if (!tree.length) return;
    var root = ctx.nextRef();
    function write(list, parent) {
      var refs = list.map(function () { return ctx.nextRef(); }), total = 0;
      list.forEach(function (n, i) {
        var sub = n.kids.length ? write(n.kids, refs[i]) : null;
        var o = { Title: n.title || P.PDFHexString.fromText(''), Parent: parent, Dest: n.dest };
        if (i > 0) o.Prev = refs[i - 1];
        if (i < list.length - 1) o.Next = refs[i + 1];
        if (sub) { o.First = sub.first; o.Last = sub.last; o.Count = n.closed ? -sub.count : sub.count; }
        ctx.assign(refs[i], ctx.obj(o));
        total += 1 + (sub && !n.closed ? sub.count : 0);
      });
      return { first: refs[0], last: refs[refs.length - 1], count: total };
    }
    var top = write(tree, root);
    ctx.assign(root, ctx.obj({ Type: 'Outlines', First: top.first, Last: top.last, Count: top.count }));
    out.catalog.set(N('Outlines'), root);
    if (got[0] && got[0].__mode) out.catalog.set(N('PageMode'), got[0].__mode);
  }

  function build(srcs, items) {
    return lib().then(function (P) {
      var docs = [], got = [], pos = {};
      var load = function (k) {
        if (docs[k]) return docs[k];
        docs[k] = Promise.resolve(srcs[k]).then(function (b) {
          return b.arrayBuffer ? b.arrayBuffer() : b;
        }).then(function (buf) {
          return P.PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
        }).then(function (d) {
          if (d.isEncrypted) { var e = new Error('encrypted'); e.code = 'encrypted'; throw e; }
          try { prep(P, d, k); } catch (e2) { d.__gol = null; }
          got[k] = d;
          return d;
        });
        return docs[k];
      };
      return P.PDFDocument.create().then(function (out) {
        var need = {};
        items.forEach(function (it) { if (!it.blank) (need[it.f] = need[it.f] || []).push(it.i - 1); });
        var keys = Object.keys(need);
        var copied = {};
        return keys.reduce(function (ch, k) {
          return ch.then(function () { return load(+k); }).then(function (d) {
            var uniq = need[k].filter(function (v, j, a) { return a.indexOf(v) === j; });
            return out.copyPages(d, uniq).then(function (pgs) {
              copied[k] = {};
              uniq.forEach(function (v, j) { copied[k][v] = pgs[j]; });
            });
          });
        }, Promise.resolve()).then(function () {
          var used = {};
          return items.reduce(function (ch, it) {
            return ch.then(function () {
              if (it.blank) { out.addPage([it.w || 595.28, it.h || 841.89]); return; }
              var key = it.f + ':' + (it.i - 1);
              var pg = copied[it.f][it.i - 1];
              if (used[key]) {
                return load(it.f).then(function (d) { return out.copyPages(d, [it.i - 1]); }).then(function (two) {
                  out.addPage(two[0]); turn(two[0], it.r);
                });
              }
              used[key] = 1;
              out.addPage(pg); turn(pg, it.r);
              pos[key] = pg.ref;
            });
          }, Promise.resolve());
          function turn(pg, r) {
            if (!r) return;
            var a = (((rotOf(pg) + r) % 360) + 360) % 360;
            pg.setRotation(P.degrees(a));
          }
        }).then(function () {
          try { relink(P, out, got, pos); } catch (e) {}
          return out.save({ useObjectStreams: true });
        });
      });
    });
  }

  function mapOf(items) {
    var m = {};
    items.forEach(function (it, j) { if (!it.blank && it.f === 0) m[j + 1] = it.i; });
    return m;
  }

  function Editor(o) {
    this.o = o;
    this.h = o.handle;
    this.n = this.h.doc.numPages;
    this.items = [];
    for (var i = 1; i <= this.n; i++) this.items.push({ f: 0, i: i, r: 0, k: 'a' + i });
    this.files = [o.bytes];
    this.pdfs = [this.h.doc];
    this.names = [o.name || ''];
    this.sel = {};
    this.last = -1;
    this.seq = 0;
    this.dirty = false;
    this.busy = false;
    this.thumbs = {};
    if (o.select) for (var s = 0; s < o.select.length; s++) this.sel['a' + o.select[s]] = 1;
    this.mount();
  }

  Editor.prototype.mount = function () {
    var self = this;
    var d = document.createElement('dialog');
    d.className = 'gsf npe';
    d.setAttribute('data-keep-open', '1');
    d.setAttribute('aria-labelledby', 'npe-t');
    d.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<div class="gsf-x"><button type="button" class="gsf-close" data-pe="close" aria-label="' + esc(L('أغلق', 'Close')) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
      '<div class="gsf-head npe-head"><h2 class="gsf-title" id="npe-t">' + esc(L('صفحاتُ الملفّ', 'File pages')) + '</h2>' +
      '<p class="gsf-sub" dir="auto">' + esc(this.o.name || '') + '</p></div>' +
      '<div class="npe-bar" role="toolbar" aria-label="' + esc(L('أفعالُ الصفحات', 'Page actions')) + '">' +
        '<span class="npe-count" data-pe="count" aria-live="polite"></span>' +
        '<input class="gsf-in npe-range" data-pe="range" type="text" inputmode="numeric" dir="ltr" autocomplete="off" ' +
          'placeholder="' + esc(L('3-7، 12', '3-7, 12')) + '" aria-label="' + esc(L('حدِّدْ بأرقام الصفحات', 'Select by page numbers')) + '">' +
        '<div class="npe-acts">' +
          btn('rotr', 'fa-rotate-right', L('دوِّرْ يميناً', 'Rotate right'), 1) +
          btn('rotl', 'fa-rotate-left', L('دوِّرْ يساراً', 'Rotate left'), 1) +
          btn('del', 'fa-trash-can', L('احذفْ', 'Delete'), 0, 'danger') +
          btn('blank', 'fa-file', L('صفحةٌ فارغة', 'Blank page')) +
          btn('ins', 'fa-file-circle-plus', L('أدرِجْ من ملفّ', 'Insert from file')) +
          btn('ext', 'fa-file-export', L('استخرجْ ملفّاً', 'Extract as file')) +
        '</div>' +
      '</div>' +
      '<div class="gsf-guard npe-guard" data-pe="guard" hidden><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<p>' + esc(L('غيّرتَ الصفحاتِ ولم تحفظ. أتتركها؟', 'You changed the pages without saving. Leave anyway?')) + '</p>' +
        '<button type="button" class="gsf-btn gsf-btn--danger" data-pe="leave">' + esc(L('اتركْ', 'Leave')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-pe="stay">' + esc(L('ابقَ', 'Stay')) + '</button></div>' +
      '<div class="gsf-body npe-body"><div class="npe-grid" data-pe="grid" role="listbox" aria-multiselectable="true" aria-label="' + esc(L('الصفحات', 'Pages')) + '"></div></div>' +
      '<div class="gsf-foot npe-foot"><p class="npe-note" data-pe="note">' +
        esc(L('الحبرُ والتظليلُ ينتقلان مع صفحاتهما، والأصلُ يبقى فتستطيع التراجع.',
              'Ink and highlights move with their pages, and the original is kept so you can undo.')) + '</p>' +
        '<div class="gsf-acts">' +
          '<button type="button" class="gsf-btn gsf-btn--ghost" data-pe="close">' + esc(L('إلغاء', 'Cancel')) + '</button>' +
          '<button type="button" class="gsf-btn gsf-btn--go" data-pe="save" disabled>' + esc(L('احفظِ الملفَّ المعدَّل', 'Save the edited file')) + '</button>' +
        '</div></div>' +
      '<input type="file" accept="application/pdf,.pdf" data-pe="file" hidden>';
    function btn(a, icon, label, iconOnly, kind) {
      return '<button type="button" class="gsf-btn gsf-btn--' + (kind || 'ghost') + ' npe-b' + (iconOnly ? ' npe-b--i' : '') + '" data-pe="' + a + '"' +
        ' aria-label="' + esc(label) + '" data-tip="' + esc(label) + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
        (iconOnly ? '' : '<span>' + esc(label) + '</span>') + '</button>';
    }
    document.body.appendChild(d);
    this.d = d;
    this.grid = d.querySelector('[data-pe="grid"]');
    d.addEventListener('click', function (e) { self.click(e); });
    d.addEventListener('cancel', function (e) { e.preventDefault(); self.close(); });
    d.addEventListener('keydown', function (e) { self.key(e); });
    var rg = d.querySelector('[data-pe="range"]');
    rg.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); self.byRange(rg.value); } });
    rg.addEventListener('change', function () { self.byRange(rg.value); });
    d.querySelector('[data-pe="file"]').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (f) self.insertFile(f);
    });
    this.drag();
    this.io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) self.thumb(en.target); });
    }, { root: d.querySelector('.npe-body'), rootMargin: '300px 0px' }) : null;
    this.paint();
    d.showModal();
  };

  Editor.prototype.paint = function () {
    var self = this, g = this.grid, h = '';
    this.items.forEach(function (it, j) {
      var on = !!self.sel[it.k];
      var lab = it.blank ? L('فارغة', 'Blank') : (it.f ? L('ملفٌّ آخر · ', 'Other file · ') + it.i : String(it.i));
      h += '<div class="npe-pg' + (on ? ' is-on' : '') + '" role="option" tabindex="' + (j === Math.max(0, self.last) ? 0 : -1) + '"' +
        ' aria-selected="' + on + '" data-k="' + it.k + '" data-j="' + j + '"' +
        ' aria-label="' + esc(L('الصفحةُ ', 'Page ') + (j + 1) + (it.blank ? L(' فارغة', ' blank') : '')) + '">' +
        '<div class="npe-sheet' + (it.blank ? ' npe-sheet--blank' : '') + '" style="--rot:' + (it.r || 0) + 'deg;--k:' + self.fit(it) + '"><canvas aria-hidden="true"></canvas></div>' +
        '<span class="npe-n">' + num(j + 1) + (it.f || it.blank || it.i !== j + 1 ? ' <small>(' + esc(lab) + ')</small>' : '') +
        (it.r ? ' <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>' : '') + '</span>' +
        '<i class="fa-solid fa-check npe-tick" aria-hidden="true"></i></div>';
    });
    g.innerHTML = h;
    var nodes = g.querySelectorAll('.npe-pg');
    for (var i = 0; i < nodes.length; i++) {
      var k = nodes[i].getAttribute('data-k');
      if (this.thumbs[k]) this.put(nodes[i], this.thumbs[k]);
      else if (this.io) this.io.observe(nodes[i]);
      else this.thumb(nodes[i]);
    }
    this.state();
  };

  Editor.prototype.fit = function (it) {
    if (!it.r || it.r % 180 === 0) return 1;
    var a = (this.asp && this.asp[it.k]) || (it.blank && it.w ? it.h / it.w : 1.414);
    return Math.min(a, 1 / a).toFixed(3);
  };

  Editor.prototype.state = function () {
    var n = this.picked().length, total = this.items.length;
    var c = this.d.querySelector('[data-pe="count"]');
    c.innerHTML = n ? esc(L('حُدِّد ', '')) + num(n) + esc(L(' من ', ' of ')) + num(total) + esc(L('', ' selected'))
                    : num(total) + esc(L(' صفحة', ' pages'));
    c.classList.toggle('is-on', n > 0);
    var dis = function (a, v) { var b = this.d.querySelector('[data-pe="' + a + '"]'); if (b) b.disabled = v; }.bind(this);
    dis('rotr', !n || this.busy); dis('rotl', !n || this.busy); dis('ext', !n || this.busy);
    dis('del', !n || n >= total || this.busy);
    dis('blank', this.busy || total >= MAX_PAGES); dis('ins', this.busy || total >= MAX_PAGES);
    dis('save', !this.dirty || this.busy);
  };

  Editor.prototype.picked = function () {
    var self = this;
    return this.items.map(function (it, j) { return self.sel[it.k] ? j : -1; }).filter(function (j) { return j >= 0; });
  };

  Editor.prototype.thumb = function (node) {
    var self = this, k = node.getAttribute('data-k');
    if (this.io) this.io.unobserve(node);
    var it = this.items.filter(function (x) { return x.k === k; })[0];
    if (!it || it.blank || this.thumbs[k]) return;
    var pdf = this.pdfs[it.f];
    if (!pdf) return;
    pdf.getPage(it.i).then(function (pg) {
      var v1 = pg.getViewport({ scale: 1 });
      var w = 132, s = w / v1.width, vp = pg.getViewport({ scale: s * Math.min(2, window.devicePixelRatio || 1) });
      var cv = document.createElement('canvas');
      cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
      return pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function () {
        self.thumbs[k] = cv;
        var live = self.grid.querySelector('[data-k="' + k + '"]');
        if (live) self.put(live, cv);
      });
    }).catch(function () {});
  };

  Editor.prototype.put = function (node, cv) {
    var old = node.querySelector('canvas');
    if (!old) return;
    var c = document.createElement('canvas');
    c.width = cv.width; c.height = cv.height;
    c.getContext('2d').drawImage(cv, 0, 0);
    c.setAttribute('aria-hidden', 'true');
    old.parentNode.replaceChild(c, old);
    var sh = node.querySelector('.npe-sheet');
    sh.style.aspectRatio = cv.width + ' / ' + cv.height;
    this.asp = this.asp || {};
    var k = node.getAttribute('data-k');
    this.asp[k] = cv.height / Math.max(1, cv.width);
    var it = this.items.filter(function (x) { return x.k === k; })[0];
    if (it) sh.style.setProperty('--k', this.fit(it));
  };

  Editor.prototype.click = function (e) {
    var b = e.target.closest('[data-pe]');
    if (b && !b.disabled) {
      var a = b.getAttribute('data-pe');
      if (a === 'close') return this.close();
      if (a === 'leave') return this.close(true);
      if (a === 'stay') { this.d.querySelector('[data-pe="guard"]').hidden = true; return; }
      if (a === 'rotr') return this.rotate(90);
      if (a === 'rotl') return this.rotate(-90);
      if (a === 'del') return this.drop();
      if (a === 'blank') return this.blank();
      if (a === 'ins') return this.d.querySelector('[data-pe="file"]').click();
      if (a === 'ext') return this.extract();
      if (a === 'save') return this.save();
      return;
    }
    if (this._dragged) { this._dragged = false; return; }
    var pg = e.target.closest('.npe-pg');
    if (!pg) return;
    var j = +pg.getAttribute('data-j'), k = pg.getAttribute('data-k');
    if (e.shiftKey && this.last >= 0) {
      var a0 = Math.min(this.last, j), b0 = Math.max(this.last, j);
      for (var q = a0; q <= b0; q++) this.sel[this.items[q].k] = 1;
    } else if (this.sel[k]) delete this.sel[k];
    else this.sel[k] = 1;
    this.last = j;
    this.paint();
    var back = this.grid.querySelector('[data-j="' + j + '"]');
    if (back) back.focus({ preventScroll: true });
  };

  Editor.prototype.key = function (e) {
    var pg = e.target.closest && e.target.closest('.npe-pg');
    if (!pg) return;
    var j = +pg.getAttribute('data-j'), to = -1;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pg.click(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.drop(); return; }
    var rtl = getComputedStyle(this.grid).direction === 'rtl';
    if (e.key === 'ArrowRight') to = j + (rtl ? -1 : 1);
    if (e.key === 'ArrowLeft') to = j + (rtl ? 1 : -1);
    if (e.key === 'Home') to = 0;
    if (e.key === 'End') to = this.items.length - 1;
    if (to < 0 || to >= this.items.length) return;
    e.preventDefault();
    var n = this.grid.querySelector('[data-j="' + to + '"]');
    if (n) { pg.tabIndex = -1; n.tabIndex = 0; n.focus(); }
  };

  Editor.prototype.byRange = function (v) {
    var r = parseRange(v, this.items.length);
    this.sel = {};
    var self = this;
    r.pages.forEach(function (p) { self.sel[self.items[p - 1].k] = 1; });
    this.last = r.pages.length ? r.pages[r.pages.length - 1] - 1 : -1;
    this.paint();
    var rg = this.d.querySelector('[data-pe="range"]');
    rg.setAttribute('aria-invalid', r.bad.length ? 'true' : 'false');
    if (r.pages.length) {
      var first = this.grid.querySelector('[data-j="' + (r.pages[0] - 1) + '"]');
      if (first && first.scrollIntoView) first.scrollIntoView({ block: 'nearest' });
    }
  };

  Editor.prototype.touch = function () { this.dirty = true; this.state(); };

  Editor.prototype.rotate = function (deg) {
    var self = this;
    this.picked().forEach(function (j) {
      var it = self.items[j];
      it.r = ((((it.r || 0) + deg) % 360) + 360) % 360;
    });
    this.paint(); this.touch();
  };

  Editor.prototype.drop = function () {
    var self = this, keep = this.items.filter(function (it) { return !self.sel[it.k]; });
    if (!keep.length || keep.length === this.items.length) return;
    this.items = keep; this.sel = {}; this.last = -1;
    this.paint(); this.touch();
  };

  Editor.prototype.after = function () {
    var p = this.picked();
    return p.length ? p[p.length - 1] + 1 : this.items.length;
  };

  Editor.prototype.blank = function () {
    var at = this.after(), ref = this.items[Math.max(0, at - 1)], self = this;
    var go = function (w, h) {
      var it = { blank: 1, w: w, h: h, r: 0, k: 'z' + (++self.seq) };
      self.items.splice(at, 0, it);
      self.sel = {}; self.sel[it.k] = 1; self.last = at;
      self.paint(); self.touch();
    };
    if (ref && !ref.blank && this.pdfs[ref.f]) {
      this.pdfs[ref.f].getPage(ref.i).then(function (pg) {
        var v = pg.view || [0, 0, 595.28, 841.89];
        go(Math.abs(v[2] - v[0]), Math.abs(v[3] - v[1]));
      }, function () { go(595.28, 841.89); });
    } else go(595.28, 841.89);
  };

  Editor.prototype.insertFile = function (file) {
    var self = this, m = this.h.m;
    if (!m || !m.getDocument) return;
    this.busy = true; this.state();
    file.arrayBuffer().then(function (buf) {
      return m.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise.then(function (pdf) {
        var room = MAX_PAGES - self.items.length;
        var take = Math.min(pdf.numPages, room);
        var f = self.files.length;
        self.files.push(new Blob([buf], { type: 'application/pdf' }));
        self.pdfs.push(pdf);
        self.names.push(file.name || '');
        var at = self.after(), add = [];
        for (var i = 1; i <= take; i++) add.push({ f: f, i: i, r: 0, k: 'b' + f + '_' + i });
        self.items.splice.apply(self.items, [at, 0].concat(add));
        self.sel = {}; add.forEach(function (x) { self.sel[x.k] = 1; });
        self.last = at + add.length - 1;
        self.busy = false;
        self.paint(); self.touch();
        self.say(take < pdf.numPages
          ? L('أُدرجت ' + take + ' صفحة فقط — الحدُّ ' + MAX_PAGES + ' صفحة للملفّ.', 'Only ' + take + ' pages were inserted — a file holds at most ' + MAX_PAGES + ' pages.')
          : L('أُدرجت ' + take + ' صفحة من «' + (file.name || '') + '».', 'Inserted ' + take + ' pages from “' + (file.name || '') + '”.'));
      });
    }).catch(function () {
      self.busy = false; self.state();
      self.say(L('تعذّرت قراءةُ هذا الملفّ — أهو PDF سليمٌ وغيرُ محميٍّ بكلمة مرور؟', 'Could not read this file — is it a valid PDF without a password?'), 1);
    });
  };

  Editor.prototype.say = function (msg, bad) {
    var n = this.d.querySelector('[data-pe="note"]');
    n.textContent = msg;
    n.classList.toggle('is-bad', !!bad);
  };

  Editor.prototype.plan = function (onlyPicked) {
    var self = this;
    var list = onlyPicked ? this.items.filter(function (it) { return self.sel[it.k]; }) : this.items;
    return list.map(function (it) {
      return it.blank ? { blank: 1, w: it.w, h: it.h } : { f: it.f, i: it.i, r: it.r || 0 };
    });
  };

  Editor.prototype.run = function (items, done) {
    var self = this, sv = this.d.querySelector('[data-pe="save"]');
    this.busy = true; this.state();
    var was = sv.textContent;
    sv.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ' + esc(L('يُكتب الملفّ…', 'Writing the file…'));
    return build(this.files, items).then(function (bytes) {
      var blob = new Blob([bytes], { type: 'application/pdf' });
      return done(blob, mapOf(items));
    }).then(function (r) {
      self.busy = false; sv.textContent = was; self.state();
      return r;
    }, function (e) {
      self.busy = false; sv.textContent = was; self.state();
      self.say(e && e.code === 'encrypted'
        ? L('هذا الملفُّ محميٌّ بكلمة مرور، ولا يُحرَّر.', 'This file is password-protected and cannot be edited.')
        : L('تعذّرت كتابةُ الملفّ — لم يتغيّر شيء.', 'Could not write the file — nothing was changed.'), 1);
      throw e;
    });
  };

  Editor.prototype.save = function () {
    var self = this;
    if (!this.dirty || this.busy || !this.o.onSave) return;
    return this.run(this.plan(false), function (blob, map) {
      return self.o.onSave({ blob: blob, map: map, pages: self.items.length });
    }).then(function () { self.close(true); }, function () {});
  };

  Editor.prototype.extract = function () {
    var self = this, items = this.plan(true);
    if (!items.length || this.busy || !this.o.onExtract) return;
    return this.run(items, function (blob, map) {
      return self.o.onExtract({ blob: blob, map: map, pages: items.length });
    }).then(function () {
      self.say(L('صار المحدَّدُ ملاحظةً جديدة — والملفُّ هنا لم يتغيّر.', 'The selection became a new note — this file is unchanged.'));
    }, function () {});
  };

  Editor.prototype.drag = function () {
    var self = this, g = this.grid, st = null;
    g.addEventListener('pointerdown', function (e) {
      var pg = e.target.closest('.npe-pg');
      if (!pg || e.button > 0 || self.busy) return;
      st = { pg: pg, j: +pg.getAttribute('data-j'), x: e.clientX, y: e.clientY, id: e.pointerId, on: false,
             touch: e.pointerType !== 'mouse', t: Date.now() };
      if (st.touch) st.hold = setTimeout(function () { if (st) begin(); }, 380);
    });
    function begin() {
      st.on = true;
      st.pg.classList.add('is-drag');
      try { g.setPointerCapture(st.id); } catch (e) {}
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e2) {} }
    }
    g.addEventListener('pointermove', function (e) {
      if (!st || e.pointerId !== st.id) return;
      var d = Math.hypot(e.clientX - st.x, e.clientY - st.y);
      if (!st.on) {
        if (st.touch) { if (d > 10) { clearTimeout(st.hold); st = null; } return; }
        if (d < 8) return;
        begin();
      }
      e.preventDefault();
      var t = spot(e.clientX, e.clientY);
      var nodes = g.querySelectorAll('.npe-pg');
      for (var i = 0; i < nodes.length; i++) nodes[i].classList.toggle('is-to', i === t.j && t.j !== st.j);
      nodes.length && g.setAttribute('data-side', t.after ? 'after' : 'before');
      st.to = t;
    });
    function spot(x, y) {
      var nodes = g.querySelectorAll('.npe-pg'), best = 0, bd = Infinity, after = false;
      for (var i = 0; i < nodes.length; i++) {
        var r = nodes[i].getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var d = Math.hypot(x - cx, y - cy);
        if (d < bd) { bd = d; best = i; var rtl = getComputedStyle(g).direction === 'rtl'; after = rtl ? x < cx : x > cx; }
      }
      return { j: best, after: after };
    }
    function end(e) {
      if (!st || (e && e.pointerId !== st.id)) return;
      clearTimeout(st.hold);
      var s = st; st = null;
      g.removeAttribute('data-side');
      if (!s.on) return;
      self._dragged = true;
      setTimeout(function () { self._dragged = false; }, 0);
      if (!s.to) { self.paint(); return; }
      var moving = self.sel[self.items[s.j].k] ? self.picked() : [s.j];
      var target = s.to.j + (s.to.after ? 1 : 0);
      var moved = moving.map(function (j) { return self.items[j]; });
      var before = moving.filter(function (j) { return j < target; }).length;
      var rest = self.items.filter(function (it, j) { return moving.indexOf(j) < 0; });
      var at = Math.max(0, Math.min(rest.length, target - before));
      var next = rest.slice(0, at).concat(moved, rest.slice(at));
      var same = next.every(function (it, j) { return it === self.items[j]; });
      self.items = next;
      self.last = at;
      self.paint();
      if (!same) self.touch();
    }
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', function (e) { if (st) { clearTimeout(st.hold); st = null; self.paint(); } });
    g.addEventListener('contextmenu', function (e) { if (e.target.closest('.npe-pg')) e.preventDefault(); });
  };

  Editor.prototype.close = function (force) {
    if (!force && this.dirty) {
      var gd = this.d.querySelector('[data-pe="guard"]');
      gd.hidden = false;
      var lv = gd.querySelector('[data-pe="stay"]');
      if (lv) lv.focus();
      return;
    }
    if (this.io) this.io.disconnect();
    for (var i = 1; i < this.pdfs.length; i++) { try { this.pdfs[i].destroy(); } catch (e) {} }
    try { this.d.close(); } catch (e2) {}
    this.d.remove();
    if (this.o.onClose) this.o.onClose();
    if (Editor.cur === this) Editor.cur = null;
  };

  function open(o) {
    if (!o || !o.handle || !o.handle.doc || !o.bytes) return null;
    if (Editor.cur) Editor.cur.close(true);
    Editor.cur = new Editor(o);
    return Editor.cur;
  }

  function quick(o, items) {
    return build([o.bytes], items).then(function (bytes) {
      return { blob: new Blob([bytes], { type: 'application/pdf' }), map: mapOf(items), pages: items.length };
    });
  }

  window.GardenPdfEdit = {
    open: open,
    quick: quick,
    build: build,
    parseRange: parseRange,
    mapOf: mapOf,
    lib: lib,
    MAX_PAGES: MAX_PAGES
  };
})();
