(function () {
  'use strict';

  /*@3.NOPJ16.1*/
  var LRU = 200, FIRST = 20, BUSY = 2, THUMB_W = 132;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') !== 'en'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function num(n) { return '<span class="nps-lat">' + esc(String(n)) + '</span>'; }

  function mount(o) {
    var api = o.api, host = o.host, body = o.body, src = o.src || null;
    var st = { tab: o.tab === 'toc' ? 'toc' : 'pages', cur: 0, dead: false, cache: {}, order: [], q: [], busy: 0,
               outline: null, toc: [], userScroll: 0, n: 0 };
    var el = document.createElement('aside');
    el.className = 'nps';
    if (src) el.setAttribute('data-src', 'note');
    el.innerHTML =
      '<div class="nps-head">' +
        '<div class="nps-tabs" role="tablist">' +
          '<button type="button" role="tab" class="nps-tab" data-nps="pages"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i><span></span></button>' +
          '<button type="button" role="tab" class="nps-tab" data-nps="toc"><i class="fa-solid fa-list-ul" aria-hidden="true"></i><span></span></button>' +
        '</div>' +
        '<button type="button" class="nps-x" data-nps="close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '</div>' +
      '<label class="nps-go"><span></span><input type="number" min="1" step="1" inputmode="numeric" class="gsf-in" data-nps="go"></label>' +
      '<div class="nps-list nps-pages" role="list" data-nps="list"></div>' +
      '<div class="nps-list nps-toc" data-nps="toclist" hidden></div>';
    host.appendChild(el);
    var list = el.querySelector('[data-nps="list"]');
    var tocEl = el.querySelector('[data-nps="toclist"]');
    var goIn = el.querySelector('[data-nps="go"]');

    function labels() {
      var t = el.querySelectorAll('.nps-tab');
      t[0].querySelector('span').textContent = L('الصفحات', 'Pages');
      t[1].querySelector('span').textContent = src ? L('العناوين', 'Headings') : L('الفهرس', 'Contents');
      el.setAttribute('aria-label', src ? L('صفحاتُ الملاحظة وعناوينُها', 'Note pages and headings')
                                        : L('صفحاتُ الملفّ وفهرسُه', 'File pages and contents'));
      var x = el.querySelector('.nps-x');
      x.setAttribute('aria-label', L('أغلقِ اللوح', 'Close the panel'));
      x.setAttribute('title', L('أغلقِ اللوح', 'Close the panel'));
      el.querySelector('.nps-go > span').textContent = L('إلى صفحة', 'Go to page');
      goIn.setAttribute('aria-label', L('رقمُ الصفحة', 'Page number'));
      el.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    }

    function total() { return api.pages() || 0; }

    function build() {
      var n = total(), h = '';
      st.n = n;
      for (var i = 1; i <= n; i++) {
        h += '<button type="button" role="listitem" class="nps-th" data-p="' + i + '" aria-label="' + esc(L('الصفحة ', 'Page ') + i) + '">' +
          '<span class="nps-mini"></span>' + num(i) + '</button>';
      }
      list.innerHTML = h;
      goIn.max = String(n);
      if (st.io) st.io.disconnect();
      st.io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) want(Number(en.target.getAttribute('data-p'))); });
      }, { root: list, rootMargin: '400px 0px' }) : null;
      var ths = list.children;
      for (var j = 0; j < ths.length; j++) {
        if (j < FIRST) want(j + 1);
        else if (st.io) st.io.observe(ths[j]);
      }
    }

    function want(p) {
      if (st.cache[p] || st.q.indexOf(p) >= 0) { if (st.cache[p]) put(p); return; }
      st.q.push(p);
      pump();
    }

    function pump() {
      var doc = src || (api.doc && api.doc());
      while (!st.dead && doc && st.busy < BUSY && st.q.length) {
        var p = st.q.shift();
        st.busy++;
        render(doc, p).then(done, done);
      }
      function done() { st.busy--; if (!st.dead) pump(); }
    }

    function keep(p, v) {
      st.cache[p] = v;
      st.order.push(p);
      while (st.order.length > LRU) {
        var old = st.order.shift();
        if (Math.abs(old - st.cur) < 8) { st.order.push(old); continue; }
        delete st.cache[old];
        var oe = list.querySelector('[data-p="' + old + '"] .nps-mini');
        if (oe) { oe.innerHTML = ''; oe.removeAttribute('data-ok'); }
        var ot = list.querySelector('[data-p="' + old + '"]');
        if (ot && st.io) st.io.observe(ot);
      }
      put(p);
    }

    function render(doc, p) {
      if (src) {
        var v = null;
        try { v = src.thumb(p); } catch (e) { v = null; }
        if (v && !st.dead) keep(p, v);
        return Promise.resolve();
      }
      return doc.getPage(p).then(function (pg) {
        var v1 = pg.getViewport({ scale: 1 });
        var s = THUMB_W / v1.width * Math.min(2, window.devicePixelRatio || 1);
        var vp = pg.getViewport({ scale: s });
        var cv = document.createElement('canvas');
        cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
        return pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function () {
          if (st.dead) return;
          keep(p, cv);
        });
      });
    }

    function put(p) {
      var cv = st.cache[p];
      var box = list.querySelector('[data-p="' + p + '"] .nps-mini');
      if (!cv || !box || box.getAttribute('data-ok')) return;
      if (cv.svg) {
        box.innerHTML = cv.svg;
        box.style.aspectRatio = cv.w + ' / ' + cv.h;
        box.setAttribute('data-ok', '1');
        if (st.io && box.parentNode) st.io.unobserve(box.parentNode);
        return;
      }
      var c = document.createElement('canvas');
      c.width = cv.width; c.height = cv.height;
      c.getContext('2d').drawImage(cv, 0, 0);
      c.setAttribute('aria-hidden', 'true');
      box.innerHTML = '';
      box.appendChild(c);
      box.style.aspectRatio = cv.width + ' / ' + cv.height;
      box.setAttribute('data-ok', '1');
      var th = box.parentNode;
      if (st.io && th) st.io.unobserve(th);
    }

    function destOf(doc, d) {
      var p = typeof d === 'string' ? doc.getDestination(d) : Promise.resolve(d);
      return p.then(function (arr) {
        if (!arr || !arr.length) return 0;
        var ref = arr[0];
        if (typeof ref === 'number') return ref + 1;
        return doc.getPageIndex(ref).then(function (i) { return i + 1; });
      }).catch(function () { return 0; });
    }

    function loadToc() {
      if (st.outline) return st.outline;
      if (src) {
        var rows = [];
        try { rows = src.toc() || []; } catch (e) { rows = []; }
        st.outline = Promise.resolve(rows);
        return st.outline;
      }
      var doc = api.doc && api.doc();
      if (!doc || !doc.getOutline) { st.outline = Promise.resolve([]); return st.outline; }
      st.outline = doc.getOutline().then(function (items) {
        /*@3.NOPJ16.2*/
        var flat = [], dests = [];
        (function walk(arr, lv) {
          (arr || []).forEach(function (it) {
            flat.push({ t: String(it.title || '').trim(), lv: lv, p: 0, kids: (it.items || []).length });
            dests.push(it.dest);
            walk(it.items, lv + 1);
          });
        }(items, 0));
        return Promise.all(dests.map(function (d, i) {
          return destOf(doc, d).then(function (p) { flat[i].p = p; });
        })).then(function () { return flat; });
      }).catch(function () { return []; });
      return st.outline;
    }

    function paintToc(ty) {
      if (!src) tocEl.innerHTML = '<p class="nps-empty">' + esc(L('يُقرأ الفهرس…', 'Reading the contents…')) + '</p>';
      loadToc().then(function (rows) {
        if (st.dead) return;
        st.toc = rows;
        if (!rows.length) {
          tocEl.innerHTML = '<p class="nps-empty">' + esc(src
            ? L('لا عناوينَ في هذه الملاحظة بعد — كلُّ عنوانٍ تكتبه يظهر هنا.', 'No headings in this note yet — every heading you write shows up here.')
            : L('لا فهرسَ في هذا الملفّ — صفحاتُه كلُّها في «الصفحات».', 'This file has no contents list — all its pages are under “Pages”.')) + '</p>';
          return;
        }
        var h = '';
        rows.forEach(function (r, i) {
          h += '<button type="button" class="nps-tr" data-ti="' + i + '" data-lv="' + Math.min(r.lv, 4) + '"' + (r.p ? '' : ' disabled') +
            ' style="--lv:' + Math.min(r.lv, 4) + '">' +
            (r.kids ? '<i class="fa-solid fa-chevron-down nps-fold" data-fold="' + i + '" aria-hidden="true"></i>' : '<i class="nps-dot" aria-hidden="true"></i>') +
            '<span class="nps-tt" dir="auto">' + esc(r.t || L('بلا عنوان', 'Untitled')) + '</span>' +
            (r.p ? num(r.p) : '') + '</button>';
        });
        tocEl.innerHTML = h;
        if (ty) tocEl.scrollTop = ty;
        mark();
      });
    }

    function tab(t) {
      st.tab = t === 'toc' ? 'toc' : 'pages';
      [].forEach.call(el.querySelectorAll('.nps-tab'), function (b) {
        var on = b.getAttribute('data-nps') === st.tab;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      list.hidden = st.tab !== 'pages';
      tocEl.hidden = st.tab !== 'toc';
      if (st.tab === 'toc' && !st.toc.length) paintToc();
      if (o.onTab) o.onTab(st.tab);
      mark(true);
    }

    function mark(scroll) {
      var p = api.page() || 1;
      var moved = p !== st.cur;
      st.cur = p;
      var old = list.querySelector('.nps-th[aria-current]');
      if (old && Number(old.getAttribute('data-p')) !== p) old.removeAttribute('aria-current');
      var th = list.querySelector('[data-p="' + p + '"]');
      if (th) th.setAttribute('aria-current', 'page');
      if (th && !list.hidden && (moved || scroll) && Date.now() - st.userScroll > 1200) keepIn(list, th);
      var best = -1, y = src && src.y ? src.y() : null;
      for (var i = 0; i < st.toc.length; i++) {
        if (y != null && st.toc[i].y != null) { if (st.toc[i].y <= y) best = i; }
        else if (st.toc[i].p && st.toc[i].p <= p) best = i;
      }
      var tOld = tocEl.querySelector('.nps-tr[aria-current]');
      if (tOld) tOld.removeAttribute('aria-current');
      var tr = best >= 0 ? tocEl.querySelector('[data-ti="' + best + '"]') : null;
      if (tr) { tr.setAttribute('aria-current', 'true'); if (!tocEl.hidden && (moved || scroll) && Date.now() - st.userScroll > 1200) keepIn(tocEl, tr); }
      if (document.activeElement !== goIn) goIn.value = String(p);
    }

    function keepIn(box, item) {
      var b = box.getBoundingClientRect(), r = item.getBoundingClientRect();
      if (r.top >= b.top && r.bottom <= b.bottom && r.left >= b.left - 1 && r.right <= b.right + 1) return;
      if (box.scrollHeight > box.clientHeight + 1) box.scrollTop += (r.top - b.top) - (b.height - r.height) / 2;
      if (box.scrollWidth > box.clientWidth + 1) box.scrollLeft += (r.left - b.left) - (b.width - r.width) / 2;
    }

    function fold(i) {
      var r = st.toc[i];
      if (!r) return;
      var btn = tocEl.querySelector('[data-ti="' + i + '"]');
      var shut = btn.getAttribute('data-shut') !== '1';
      btn.setAttribute('data-shut', shut ? '1' : '0');
      for (var k = i + 1; k < st.toc.length && st.toc[k].lv > r.lv; k++) {
        var n = tocEl.querySelector('[data-ti="' + k + '"]');
        if (!n) continue;
        if (shut) n.hidden = true;
        else {
          n.hidden = false;
          if (n.getAttribute('data-shut') === '1') {
            var lv = st.toc[k].lv;
            while (k + 1 < st.toc.length && st.toc[k + 1].lv > lv) k++;
          }
        }
      }
    }

    function go(p) {
      p = Math.max(1, Math.min(total(), Math.round(p) || 1));
      if (o.go) o.go(p); else api.goTo(p, 0);
      setTimeout(function () { mark(); }, 60);
      if (o.onGo) o.onGo(p);
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-nps], .nps-th, .nps-tr');
      if (!b || !el.contains(b)) return;
      var a = b.getAttribute('data-nps');
      if (a === 'pages' || a === 'toc') { tab(a); return; }
      if (a === 'close') { if (o.onClose) o.onClose(); return; }
      if (b.classList.contains('nps-th')) { go(Number(b.getAttribute('data-p'))); return; }
      if (b.classList.contains('nps-tr')) {
        var f = e.target.closest('[data-fold]');
        if (f) { fold(Number(f.getAttribute('data-fold'))); return; }
        var r = st.toc[Number(b.getAttribute('data-ti'))];
        if (r && src && src.at && r.y != null) { src.at(r); setTimeout(function () { mark(); }, 60); if (o.onGo) o.onGo(r.p); }
        else if (r && r.p) go(r.p);
      }
    });
    goIn.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); go(Number(goIn.value)); }
      if (e.key === 'Escape') { goIn.blur(); }
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && o.onClose) { e.preventDefault(); e.stopPropagation(); o.onClose(); }
    });
    var markUser = function () { st.userScroll = Date.now(); };
    list.addEventListener('wheel', markUser, { passive: true });
    list.addEventListener('touchmove', markUser, { passive: true });
    tocEl.addEventListener('wheel', markUser, { passive: true });
    tocEl.addEventListener('touchmove', markUser, { passive: true });

    labels();
    build();
    tab(st.tab);

    return {
      el: el,
      sync: function () { if (!st.dead) mark(); },
      labels: function () { if (st.dead) return; labels(); build(); if (st.tab === 'toc') paintToc(); mark(true); },
      rebuild: function () { if (st.dead) return; st.cache = {}; st.order = []; st.q = []; st.outline = null; st.toc = []; build(); if (st.tab === 'toc') paintToc(); mark(true); },
      /*@3.NOPJ16.3*/
      refresh: function () {
        if (st.dead) return;
        var y = list.scrollTop, ty = tocEl.scrollTop;
        st.cache = {}; st.order = []; st.q = []; st.outline = null;
        if (total() !== st.n) { st.cur = 0; build(); list.scrollTop = y; }
        else {
          var ths = list.children;
          for (var i = 0; i < ths.length; i++) {
            var m = ths[i].firstChild;
            if (m && m.getAttribute('data-ok')) { m.removeAttribute('data-ok'); if (st.io) st.io.observe(ths[i]); else want(i + 1); }
          }
        }
        if (st.tab === 'toc') paintToc(ty); else st.toc = [];
        mark();
      },
      tab: function () { return st.tab; },
      destroy: function () {
        st.dead = true;
        if (st.io) st.io.disconnect();
        st.cache = {};
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    };
  }

  window.GardenPdfSide = { mount: mount };
})();
