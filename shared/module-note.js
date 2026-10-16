;(function () {
  'use strict';

  if (window.GardenModNote) return;

  var me = document.currentScript;
  var src = (me && me.src) || '';
  var DIR = src.replace(/[^/]*$/, '');
  var VER = (src.split('?')[1] || '');
  var ROOT = DIR.replace(/shared\/$/, '');
  var LIVE = 'https://libbard.github.io/Garden/';
  var WKEY = 'garden_mn_w';

  function L(ar, en) { return document.documentElement.lang === 'en' ? en : ar; }
  function enc(s) { return encodeURIComponent(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function css() {
    if (!document.querySelector('link[data-mi="surface.css"], link[href*="shared/surface.css"]')) {
      var s = document.createElement('link');
      s.rel = 'stylesheet'; s.href = DIR + 'surface.css' + (VER ? '?' + VER : ''); s.setAttribute('data-mi', 'surface.css');
      document.head.appendChild(s);
    }
    if (document.querySelector('link[data-mn]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = DIR + 'module-note.css' + (VER ? '?' + VER : ''); l.setAttribute('data-mn', '1');
    document.head.appendChild(l);
  }
  function js(name, test) {
    if (test()) return Promise.resolve();
    return new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = DIR + name + (VER ? '?' + VER : '');
      s.onload = function () { ok(); };
      s.onerror = no;
      document.head.appendChild(s);
    });
  }
  function inkLib() { return js('module-ink.js', function () { return !!window.GardenModuleInk; }).then(function () { return window.GardenModuleInk; }); }
  function menuLib() { return js('menu.js', function () { return !!window.GardenMenu; }).then(function () { return window.GardenMenu; }); }

  function moduleTitle() {
    var h = document.querySelector('#hero .content-target h1, #hero h1');
    return h ? h.textContent.replace(/\s+/g, ' ').trim() : (document.title.split('·')[0] || '').trim();
  }
  function where() {
    var h = document.documentElement;
    return { c: h.getAttribute('data-subject') || '', m: Number(h.getAttribute('data-module')) || 0 };
  }
  /*@3.MONJ.1*/
  function hrefOf(sec) {
    var p = location.pathname, rel = p.slice(new URL(ROOT, location.href).pathname.length);
    var base = location.protocol === 'https:' ? location.origin + p : LIVE + rel;
    return base + (sec ? '#' + sec : '');
  }
  function secTitle(id) {
    var s = id && document.getElementById(id);
    var h = s && s.querySelector('h2, h3, .section-title');
    return h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function idx() {
    try { var a = JSON.parse(localStorage.getItem('notes_index') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function pages() {
    var w = where();
    return idx().filter(function (r) { return r && r.o && r.o.c === w.c && Number(r.o.m) === w.m && r.k !== 'pdf' && !(r.d > 0) && (!r.pv || r.id === S.id); })
      .sort(function (a, b) { return ((b.o.mm ? 1 : 0) - (a.o.mm ? 1 : 0)) || ((b.updated_at || 0) - (a.updated_at || 0)); });
  }

  /*@3.MONJ.2*/
  function shape() { var w = window.innerWidth; return w <= 768 ? 'sheet' : (w >= 1024 ? 'dock' : 'float'); }
  function dockW() {
    var w = window.innerWidth, saved = 0;
    try { saved = Number(localStorage.getItem(WKEY)) || 0; } catch (e) {}
    var v = saved || Math.round(Math.min(760, Math.max(640, w * 0.46)));
    return Math.max(400, Math.min(v, w - 480));
  }

  var S = { el: null, frame: null, id: null, main: false, ready: false, q: [], rng: {}, bid: {}, rid: 0,
            opener: null, closing: null, shape: '' };
  var html = document.documentElement;

  function layout() {
    if (!S.el) return;
    var sh = shape(), w = sh === 'dock' ? dockW() : 0;
    S.el.setAttribute('data-shape', sh);
    html.classList.toggle('mn-docked', sh === 'dock');
    html.classList.toggle('mn-tight', sh === 'dock' && window.innerWidth - w < 900);
    if (w) html.style.setProperty('--mn-w', w + 'px'); else html.style.removeProperty('--mn-w');
    if (sh !== S.shape) {
      S.shape = sh;
      post({ gnote: 'dock', on: sh !== 'sheet' });
    }
  }
  function post(m) {
    try { if (S.frame && S.ready) S.frame.contentWindow.postMessage(m, location.origin); } catch (e) {}
  }

  function icon(n) { return '<i class="fa-solid ' + n + '" aria-hidden="true"></i>'; }
  function btn(act, ic, ar, en) {
    var t = L(ar, en);
    return '<button type="button" class="mn-b" data-mn="' + act + '" aria-label="' + esc(t) + '" title="' + esc(t) + '" data-ar-title="' + esc(ar) + '" data-en-title="' + esc(en) + '">' + icon(ic) + '</button>';
  }

  function build() {
    css();
    var w = where();
    var el = document.createElement('aside');
    el.className = 'mn-sheet';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'false');
    el.setAttribute('aria-label', L('ملاحظاتُ الوحدة', 'Module notes'));
    el.innerHTML =
      '<div class="mn-edge" data-mn="edge" aria-hidden="true"></div>' +
      '<div class="mn-grab" data-mn="grab" aria-hidden="true"><span></span></div>' +
      '<header class="mn-h">' +
        '<button type="button" class="mn-pg" data-mn="pages" aria-haspopup="menu" aria-expanded="false">' +
          '<span class="mn-ic">' + icon('fa-book-open') + '</span>' +
          '<span class="mn-t"><b data-mn-t>' + esc(L('ملاحظاتُ الوحدة', 'Module notes')) + '</b>' +
          '<small><bdi dir="ltr">' + esc(w.c) + '</bdi> · ' + esc(L('الوحدة', 'Module')) + ' ' + w.m + '</small></span>' +
          icon('fa-chevron-down mn-chev') +
        '</button>' +
        btn('full', 'fa-up-right-and-down-left-from-center', 'افتحْها كاملةً في ملاحظاتي', 'Open it full in My Notes') +
        btn('close', 'fa-xmark', 'أغلقْ — محفوظة', 'Close — saved') +
      '</header>' +
      '<div class="mn-body"><div class="mn-wait" aria-live="polite"><span class="mn-spin"></span>' + esc(L('نفتح صفحةَ الوحدة…', 'Opening the module page…')) + '</div></div>';
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mn]');
      if (!b) return;
      var a = b.getAttribute('data-mn');
      if (a === 'close') close();
      else if (a === 'full') full();
      else if (a === 'pages') pagesMenu(b);
      else if (a === 'grab') el.classList.toggle('mn-low');
    });
    edge(el.querySelector('.mn-edge'));
    document.body.appendChild(el);
    S.el = el;
    return el;
  }

  /*@3.MONJ.3*/
  function edge(h) {
    var x0 = 0, w0 = 0, on = false;
    h.addEventListener('pointerdown', function (e) {
      if (S.shape !== 'dock') return;
      on = true; x0 = e.clientX; w0 = dockW();
      try { h.setPointerCapture(e.pointerId); } catch (e2) {}
      S.el.classList.add('mn-drag');
      e.preventDefault();
    });
    h.addEventListener('pointermove', function (e) {
      if (!on) return;
      var dx = e.clientX - x0, rtl = getComputedStyle(S.el).direction === 'rtl';
      var w = Math.round(w0 + (rtl ? dx : -dx));
      w = Math.max(400, Math.min(w, window.innerWidth - 480));
      try { localStorage.setItem(WKEY, String(w)); } catch (e3) {}
      layout();
    });
    var end = function () { if (!on) return; on = false; S.el.classList.remove('mn-drag'); fireResize(); };
    h.addEventListener('pointerup', end);
    h.addEventListener('pointercancel', end);
    h.addEventListener('dblclick', function () { try { localStorage.removeItem(WKEY); } catch (e) {} layout(); fireResize(); });
  }
  function fireResize() { setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 0); }

  function paintHead() {
    if (!S.el) return;
    var r = null, a = idx(), i;
    for (i = 0; i < a.length; i++) if (a[i] && a[i].id === S.id) { r = a[i]; break; }
    var t = S.el.querySelector('[data-mn-t]');
    if (t) t.textContent = (!r || (r.o && r.o.mm)) ? L('ملاحظاتُ الوحدة', 'Module notes') : (r.t || L('صفحةٌ بلا عنوان', 'Untitled page'));
  }

  function pagesMenu(b) {
    menuLib().then(function (M) {
      if (!M || !S.el) return;
      var list = pages(), h = M.head(L('صفحاتُ هذه الوحدة', 'This module’s pages'));
      list.forEach(function (r) {
        var nm = (r.o && r.o.mm) ? L('ملاحظاتُ الوحدة', 'Module notes') : (r.t || L('صفحةٌ بلا عنوان', 'Untitled page'));
        h += M.item(r.id, r.id === S.id ? 'fa-check' : ((r.o && r.o.mm) ? 'fa-book-open' : 'fa-file-lines'), nm, { attr: 'data-pg', cls: r.id === S.id ? 'mn-cur' : '' });
      });
      h += M.sep();
      h += M.item('new', 'fa-plus', L('صفحةٌ جديدةٌ لهذه الوحدة', 'A new page for this module'), { attr: 'data-pg' });
      if (peekOff()) h += M.item('peek', 'fa-eye', L('أظهِرْ نوافذَ الملاحظات على النصّ', 'Show note windows on the text'), { attr: 'data-pg' });
      var r0 = b.getBoundingClientRect();
      b.setAttribute('aria-expanded', 'true');
      M.open(document.documentElement.dir === 'rtl' ? r0.right : r0.left, r0.bottom + 6, h, function (act) {
        if (act === 'new') { open({ page: 'new' }); return; }
        if (act === 'peek') { peekOn(); return; }
        if (act && act !== S.id) open({ id: act });
      }, { attr: 'data-pg', label: L('صفحاتُ هذه الوحدة', 'This module’s pages'), cls: 'mn-menu', anchorEnd: true,
           onClose: function () { b.setAttribute('aria-expanded', 'false'); } });
    });
  }

  function frameUrl(o) {
    var w = where(), t = moduleTitle();
    var u = ROOT + 'hub/notes.html?embed=1&mod=1&course=' + enc(w.c) + '&module=' + enc(w.m) +
      '&from=' + enc(location.pathname) + (t ? '&title=' + enc(t.slice(0, 120)) : '') + (shape() !== 'sheet' ? '&dock=1' : '');
    if (o.id) u += '&id=' + enc(o.id);
    if (o.page === 'new') u += '&new=1';
    return u;
  }

  /*@3.MONJ.4*/
  function reqOf(o) {
    var rid = ++S.rid, sec = o.sec || '';
    if (o.quote) {
      if (o.range) S.rng[rid] = o.range;
      return { rid: rid, kind: 'quote', q: String(o.quote).slice(0, 4000), sec: sec, href: hrefOf(sec), label: secTitle(sec) || moduleTitle() };
    }
    if (o.concept) return { rid: rid, kind: 'concept', md: String(o.concept.md || ''), sec: sec, href: hrefOf(sec), label: o.concept.title || secTitle(sec) };
    if (o.adopt) { var w = where(); return { rid: rid, kind: 'legacy', nid: String(o.adopt), c: w.c, m: w.m }; }
    return null;
  }

  function onMsg(e) {
    if (!S.frame || e.source !== S.frame.contentWindow || e.origin !== location.origin || !e.data) return;
    var t = e.data.gnote;
    if (t === 'open') {
      S.id = e.data.id || null;
      S.main = !!e.data.main;
      S.ready = true;
      if (S.el) S.el.classList.add('mn-ready');
      paintHead();
      var q = S.q; S.q = [];
      q.forEach(function (r) { post({ gnote: 'append', req: r }); });
      if (S.show) { post({ gnote: 'show', bid: S.show }); S.show = null; }
    } else if (t === 'quicked') {
      var qr = quickR[e.data.bid]; delete quickR[e.data.bid];
      if (qr) qr(e.data.n > 0);
    } else if (t === 'appended') {
      if (e.data.rid) S.bid[e.data.rid] = e.data.b;
    } else if (t === 'closed') {
      if (swapR) { paintKept(e.data.id || null, e.data.kept || [], S.rng, S.bid); swapR(); return; }
      finish(e.data.id || null, e.data.kept || []);
    } else if (t === 'goto') {
      var s = e.data.hash && document.getElementById(String(e.data.hash).slice(1));
      if (!s) return;
      if (S.shape === 'sheet' && S.el) S.el.classList.add('mn-low');
      setTimeout(function () {
        var hd = document.querySelector('.g-header'), off = (hd ? hd.offsetHeight : 0) + 12;
        window.scrollTo({ top: Math.max(0, s.getBoundingClientRect().top + window.scrollY - off), behavior: 'auto' });
      }, 40);
      s.classList.add('mn-flash');
      setTimeout(function () { s.classList.remove('mn-flash'); }, 1600);
    }
  }
  window.addEventListener('message', onMsg);
  window.addEventListener('resize', function () { if (S.el) layout(); });

  function open(o) {
    o = o || {};
    var req = reqOf(o);
    if (S.el && !S.closing && !o.id && !o.page) {
      if (req) { if (S.ready) post({ gnote: 'append', req: req }); else S.q.push(req); }
      return Promise.resolve(true);
    }
    if (S.el && o.id && o.id === S.id && !S.closing) { if (o.bid) post({ gnote: 'show', bid: o.bid }); return Promise.resolve(true); }
    S.show = o.bid || null;
    if (S.el) return swap(o, req);
    var el = build();
    S.id = o.id || null; S.ready = false; S.q = req ? [req] : []; S.opener = document.activeElement; S.shape = '';
    layout();
    var f = document.createElement('iframe');
    f.className = 'mn-frame';
    f.title = L('محرّرُ الملاحظات', 'Notes editor');
    f.src = frameUrl(o);
    f.setAttribute('allow', 'clipboard-read; clipboard-write; microphone; fullscreen');
    S.edited = false;
    f.addEventListener('load', function () { watch(f); });
    el.querySelector('.mn-body').appendChild(f);
    S.frame = f;
    requestAnimationFrame(function () { el.classList.add('mn-on'); fireResize(); });
    html.classList.add('mn-open');
    document.addEventListener('keydown', onKey, true);
    return Promise.resolve(true);
  }

  var swapR = null;
  function swap(o, req) {
    if (S.closing) return S.closing.then(function () { return open(o); });
    return new Promise(function (ok) {
      var go = function () {
        swapR = null; clearTimeout(finT);
        S.ready = false; S.id = o.id || null; S.q = req ? [req] : []; S.edited = false;
        if (S.el) S.el.classList.remove('mn-ready');
        if (S.frame) S.frame.src = frameUrl(o);
        ok(true);
      };
      if (!S.ready) { go(); return; }
      swapR = go;
      post({ gnote: 'flush', keep: 0 });
      clearTimeout(finT);
      finT = setTimeout(go, 1800);
    });
  }

  /*@3.MONJ.8*/
  function watch(f) {
    var d = null;
    try { d = f.contentDocument; } catch (e) { d = null; }
    if (!d) return;
    var mark = function () { S.edited = true; };
    d.addEventListener('input', mark, true);
    d.addEventListener('pointerdown', function (e) { if (e.target && e.target.closest && e.target.closest('canvas')) mark(); }, true);
  }
  var KEEP = '.mt-sel, .gsf-menu, .mp, .mnp, dialog[open], .sidebar-notes-btn, .mt-toast, .mnp-toast, .mp-toast';
  document.addEventListener('pointerdown', function (e) {
    var t = e.target;
    if (!S.el || S.closing || S.edited || !t || t === document.documentElement || S.el.contains(t)) return;
    if (t.closest && t.closest(KEEP)) return;
    close();
  }, true);

  function onKey(e) {
    if (e.key !== 'Escape' || !S.el) return;
    if (S.frame && document.activeElement === S.frame) return;
    if (document.querySelector('.gsf-menu')) return;
    close();
  }

  var finT = 0, finR = null;
  function close(now, keep) {
    if (!S.el) return Promise.resolve(null);
    if (S.closing) return S.closing;
    S.closing = new Promise(function (r) { finR = r; });
    try { if (!S.ready) throw 0; S.frame.contentWindow.postMessage({ gnote: 'flush', keep: keep ? 1 : 0 }, location.origin); } catch (e) { now = true; }
    clearTimeout(finT);
    finT = setTimeout(function () { finish(S.id, []); }, now ? 0 : 1800);
    return S.closing;
  }

  /*@3.MONJ.5*/
  function finish(id, kept) {
    clearTimeout(finT);
    var el = S.el, rng = S.rng, bid = S.bid, opener = S.opener;
    if (!el) return;
    S.el = null; S.frame = null; S.ready = false; S.rng = {}; S.bid = {}; S.q = []; S.shape = '';
    el.classList.remove('mn-on');
    setTimeout(function () { el.remove(); }, 220);
    html.classList.remove('mn-open', 'mn-docked', 'mn-tight');
    html.style.removeProperty('--mn-w');
    fireResize();
    document.removeEventListener('keydown', onKey, true);
    paintKept(id, kept, rng, bid);
    try { if (opener && opener.focus && opener.isConnected) opener.focus({ preventScroll: true }); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent('garden:moduleNoteClosed', { detail: { id: id } })); } catch (e3) {}
    var r = finR; finR = null; S.closing = null;
    if (r) r(id);
  }

  function paintKept(id, kept, rng, bid) {
    var hl = id ? (kept || []).filter(function (r) { return rng[r]; }) : [];
    if (!hl.length) return;
    inkLib().then(function (I) {
      if (!I || !I.addHighlight) return;
      return hl.reduce(function (p, r) {
        return p.then(function () { var g = rng[r]; delete rng[r]; return I.addHighlight(g, 'sky', 'fill', { n: id + (bid[r] ? '#' + bid[r] : '') }); });
      }, Promise.resolve());
    }).catch(function () {});
  }

  function full() {
    var id0 = S.id;
    close(false, true).then(function (id) {
      var u = ROOT + 'hub/notes.html' + ((id || id0) ? '?id=' + enc(id || id0) : '');
      var w = null;
      if (shape() !== 'sheet') { try { w = window.open(u, '_blank'); if (w) w.opener = null; } catch (e) { w = null; } }
      if (!w) location.href = u;
    });
  }

  /*@3.MONJ.6*/
  var quickR = {};
  function quick(id, bid, text) {
    if (!id || !String(text || '').trim()) return Promise.resolve(false);
    css();
    if (S.el && S.ready && S.id === id && !S.closing) {
      return new Promise(function (ok) {
        quickR[bid] = ok;
        post({ gnote: 'quick', bid: bid, text: String(text) });
        setTimeout(function () { if (quickR[bid]) { delete quickR[bid]; ok(false); } }, 12000);
      });
    }
    return new Promise(function (ok) {
      var f = document.createElement('iframe'), done = false, step = 0;
      f.className = 'mn-courier';
      f.setAttribute('aria-hidden', 'true');
      f.tabIndex = -1;
      f.src = frameUrl({ id: id });
      var end = function (v) {
        if (done) return; done = true;
        window.removeEventListener('message', on);
        setTimeout(function () { f.remove(); }, 50);
        ok(v);
      };
      var on = function (e) {
        if (e.source !== f.contentWindow || e.origin !== location.origin || !e.data) return;
        var t = e.data.gnote;
        if (t === 'open' && !step) { step = 1; f.contentWindow.postMessage({ gnote: 'quick', bid: bid, text: String(text) }, location.origin); }
        else if (t === 'quicked') { step = 2; f.contentWindow.postMessage({ gnote: 'flush', keep: 1 }, location.origin); setTimeout(function () { end(e.data.n > 0); }, 4000); }
        else if (t === 'closed' && step === 2) end(true);
      };
      window.addEventListener('message', on);
      document.body.appendChild(f);
      setTimeout(function () { end(false); }, 20000);
    });
  }
  /*@3.MONJ.9*/
  function adoptAll(ids) {
    ids = (ids || []).map(String).filter(Boolean);
    if (!ids.length) return Promise.resolve(0);
    var pre = S.el ? close() : Promise.resolve();
    return pre.then(function () {
      return new Promise(function (ok) {
        var f = document.createElement('iframe'), done = false, want = {}, got = 0, flushed = false, w = where();
        var reqs = ids.map(function (nid) { var r = { rid: ++S.rid, kind: 'legacy', nid: nid, c: w.c, m: w.m }; want[r.rid] = 1; return r; });
        f.className = 'mn-courier';
        f.setAttribute('aria-hidden', 'true');
        f.tabIndex = -1;
        f.src = frameUrl({});
        var end = function () {
          if (done) return; done = true;
          window.removeEventListener('message', on);
          setTimeout(function () { f.remove(); }, 50);
          ok(got);
        };
        var flush = function () { if (flushed) return; flushed = true; f.contentWindow.postMessage({ gnote: 'flush', keep: 1 }, location.origin); setTimeout(end, 5000); };
        var on = function (e) {
          if (e.source !== f.contentWindow || e.origin !== location.origin || !e.data) return;
          var t = e.data.gnote;
          if (t === 'open' && !reqs.sent) { reqs.sent = 1; reqs.forEach(function (r) { f.contentWindow.postMessage({ gnote: 'append', req: r }, location.origin); }); setTimeout(flush, 8000); }
          else if (t === 'appended' && want[e.data.rid]) { delete want[e.data.rid]; got++; if (got === reqs.length) setTimeout(flush, 300); }
          else if (t === 'closed' && flushed) end();
        };
        window.addEventListener('message', on);
        document.body.appendChild(f);
        setTimeout(end, 30000);
      });
    });
  }
  /*@3.MONJ.7*/
  var PEEK_OFF = 'garden_peek_off';
  function peekOff() { try { return localStorage.getItem(PEEK_OFF) === '1'; } catch (e) { return false; } }
  function peekOn() {
    try { localStorage.removeItem(PEEK_OFF); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent('garden:peekToggle', { detail: { on: true } })); } catch (e2) {}
  }

  window.GardenModNote = { open: open, close: close, quick: quick, adoptAll: adoptAll, peekOn: peekOn, peekOff: peekOff,
                           isOpen: function () { return !!S.el; }, id: function () { return S.id; } };
})();
