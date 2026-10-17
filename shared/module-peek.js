;(function () {
  'use strict';

  if (window.GardenModPeek) return;

  var me = document.currentScript;
  var src = (me && me.src) || '';
  var DIR = src.replace(/[^/]*$/, '');
  var VER = (src.split('?')[1] || '');
  var OFF = 'garden_peek_off';

  function L(ar, en) { return document.documentElement.lang === 'en' ? en : ar; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pdir() { return document.documentElement.lang === 'en' ? 'ltr' : 'rtl'; }
  function off() { if (document.documentElement.hasAttribute('data-marks-off')) return true; try { return localStorage.getItem(OFF) === '1'; } catch (e) { return false; } }
  function coarse() { try { return matchMedia('(hover: none)').matches; } catch (e) { return false; } }
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
  function css(name) {
    if (document.querySelector('link[data-mi="' + name + '"], link[href*="shared/' + name + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = DIR + name + (VER ? '?' + VER : ''); l.setAttribute('data-mi', name);
    document.head.appendChild(l);
  }
  function store() { return js('peek-store.js', function () { return !!window.GardenPeekStore; }).then(function () { return window.GardenPeekStore; }); }
  function noteLib() { return js('module-note.js', function () { return !!window.GardenModNote; }).then(function () { return window.GardenModNote; }); }
  function toast(m) {
    var t = document.createElement('div');
    t.className = 'mp-toast'; t.setAttribute('role', 'status'); t.textContent = m;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function doneBtn() {
    return '<button type="submit" class="mp-go" title="' + esc(L('احفظْ الآن — وتُحفظ وحدَها حين تغلق', 'Save now — it also saves itself when you close')) + '"><i class="fa-solid fa-check" aria-hidden="true"></i> <span data-ar="تمّ" data-en="Done">' + esc(L('تمّ', 'Done')) + '</span></button>';
  }
  function btn(act, ic, ar, en) {
    var t = L(ar, en);
    return '<button type="button" class="mp-b" data-mp="' + act + '" aria-label="' + esc(t) + '" title="' + esc(t) + '" data-ar-title="' + esc(ar) + '" data-en-title="' + esc(en) + '"><i class="fa-solid ' + ic + '" aria-hidden="true"></i></button>';
  }

  /*@3.MOPJ.1*/
  function refOf(ta) {
    var n = ta && ta.n ? String(ta.n) : '', i = n.indexOf('#');
    return n ? { id: i < 0 ? n : n.slice(0, i), bid: i < 0 ? '' : n.slice(i + 1) } : null;
  }
  function keyOf(hit) { return hit.ta && hit.ta.n ? String(hit.ta.n) : (hit.legacy ? 'L:' + hit.legacy.id : ''); }
  function snapOf(ref) {
    if (!ref) return Promise.resolve(null);
    return store().then(function (P) { return P.get(ref.id); }).then(function (row) {
      var secs = row && row.secs, head = null;
      if (!secs) return null;
      head = secs[ref.bid] ? ref.bid : (secs.__ix && secs.__ix[ref.bid]) || null;
      return head && secs[head] ? { head: head, s: secs[head] } : null;
    }, function () { return null; });
  }

  /*@3.MOPJ.5*/
  function opaque(c) {
    var m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return false;
    var p = m[1].split(/[\s,/]+/).filter(Boolean);
    return p.length < 4 || parseFloat(p[3]) > .9;
  }
  function skin(card, rg) {
    var n = rg && rg.startContainer;
    n = n && (n.nodeType === 3 ? n.parentNode : n);
    if (!n || !n.closest) n = document.querySelector('.main-content') || document.body;
    var el = n, bg = '';
    while (el && el.nodeType === 1) { var c = getComputedStyle(el).backgroundColor; if (opaque(c)) { bg = c; break; } el = el.parentElement; }
    var p = n.closest('p, li, td, dd, blockquote, h2, h3, h4') || n, ps = getComputedStyle(p);
    var hs = getComputedStyle(document.documentElement);
    card.style.setProperty('--mp-bg', bg || hs.getPropertyValue('--bg-card') || '#fff');
    card.style.setProperty('--mp-ink', ps.color);
    card.style.setProperty('--mp-font', ps.fontFamily);
  }

  /*@3.MOPJ.2*/
  function strong(t) {
    var m = /[A-Za-z\u0590-\u08FF\uFB1D-\uFEFC]/.exec(t || '');
    return m && /[A-Za-z]/.test(m[0]) ? 'ltr' : 'rtl';
  }
  function dirAuto(root) {
    [].forEach.call(root.querySelectorAll('[dir]'), function (e) { e.setAttribute('dir', e.classList.contains('ne-body') ? strong(e.textContent) : 'auto'); });
    [].forEach.call(root.querySelectorAll('.ne-text, .ne-li, .ne-cell, h1, h2, h3, p, li'), function (e) { if (!e.hasAttribute('dir')) e.setAttribute('dir', 'auto'); });
  }
  function paras(t) {
    return String(t || '').split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { return '<p dir="auto">' + esc(l) + '</p>'; }).join('');
  }
  function body(card, hit) {
    var sv = card.querySelector('.mp-sv'), lg = hit.legacy || (card.__ref && window.GardenLegacyByRef ? window.GardenLegacyByRef(card.__ref) : null);
    return snapOf(card.__ref).then(function (r) {
      if (!card.isConnected) return;
      card.__head = r ? r.head : (card.__ref && card.__ref.bid);
      card.__text = r ? (r.s.x || '') : (lg ? [lg.title, lg.body].filter(Boolean).join('\n') : (hit.ta.t || ''));
      card.removeAttribute('data-mode');
      if (!r) {
        if (lg && (lg.body || lg.title)) {
          card.setAttribute('data-mode', 'flow');
          sv.innerHTML = '<div class="mp-txt">' + (lg.title && lg.title !== lg.body ? '<p class="mp-ttl" dir="auto">' + esc(lg.title) + '</p>' : '') + paras(lg.body) + '</div>';
          return;
        }
        sv.innerHTML = '<p class="mp-miss">' +
          esc(L('افتحْ ملاحظتَك مرّةً على هذا الجهاز لتظهر هنا — أو اكتبْ تحت سطراً سريعاً.', 'Open your note once on this device to see it here — or write a quick line below.')) + '</p>';
        return;
      }
      var s = r.s, ink = null;
      try { ink = s.ink ? JSON.parse(s.ink) : null; } catch (e) { ink = null; }
      card.classList.toggle('mp-wide', !!(ink && ink.u));
      if (ink && ink.u) {
        var room = Math.max(200, sv.clientWidth - 28), k = Math.min(1, room / Math.max(1, s.w));
        card.setAttribute('data-mode', 'page');
        sv.innerHTML = '<div class="mp-pg" style="block-size:' + Math.round(s.h * k + 8) + 'px"><div class="mp-sc" style="inline-size:' + s.w + 'px;block-size:' + s.h + 'px;transform:scale(' + k + ')">' +
          '<div class="ne-root mp-pgt" style="left:' + (s.tx || 0) + 'px;top:' + (s.ty || 0) + 'px;inline-size:' + (s.tw || s.w) + 'px">' + s.html + '</div>' +
          '<img class="mp-ink" alt="" src="' + esc(ink.u) + '" style="inset-inline-start:auto;left:' + ink.x + 'px;top:' + ink.y + 'px;inline-size:' + ink.w + 'px;block-size:' + ink.h + 'px"></div></div>';
      } else {
        card.setAttribute('data-mode', 'flow');
        sv.innerHTML = '<div class="ne-root mp-txt">' + s.html + '</div>';
        dirAuto(sv);
      }
    });
  }

  var HOV = null, hideT = 0, showT = 0, PINS = [];

  function build(hit, o) {
    css('notes.css'); css('module-peek.css');
    var ref = refOf(hit.ta), lg = hit.legacy, moved = !!ref;
    var card = document.createElement('section');
    card.className = 'mp';
    card.__ref = ref; card.__hit = hit; card.__key = keyOf(hit);
    card.setAttribute('role', 'dialog');
    card.setAttribute('dir', document.documentElement.lang === 'en' ? 'ltr' : 'rtl');
    card.setAttribute('aria-label', L('ملاحظتُك على هذا النصّ', 'Your note on this text'));
    card.style.setProperty('--mp-t', /^#/.test(hit.ta.c || '') ? hit.ta.c : 'var(--gmi-p-' + (hit.ta.c || 'sky') + ', #5ab8ff)');
    skin(card, hit.rg);
    var st = hit.ta.k ? 'note' : (hit.ta.x ? 'text' : (hit.ta.u ? 'under' : 'fill'));
    card.innerHTML =
      '<header class="mp-h"><span class="mp-tt"><i class="mp-mk" data-st="' + st + '" aria-hidden="true"></i><b data-ar="ملاحظتُك" data-en="Your note">' + esc(L('ملاحظتُك', 'Your note')) + '</b></span>' +
        '<span class="mp-acts">' +
        btn('pin', 'fa-thumbtack', 'ثبِّتْها عائمةً — واسحبْها من رأسها إلى أيِّ موضع', 'Float it — drag it by its header anywhere') +
        btn('copy', 'fa-copy', 'انسخْ ما فيها', 'Copy its content') +
        btn('open', 'fa-up-right-and-down-left-from-center', moved ? 'افتحْها في ملاحظات الوحدة' : 'انقلْها إلى ملاحظات الوحدة', moved ? 'Open it in the module notes' : 'Move it into the module notes') +
        (hit.ta.k && window.GardenModuleInk && GardenModuleInk.noteLine && GardenModuleInk.noteLine() && !hit.ta.q ? btn('line', 'fa-eraser', 'أزِلِ الخطَّ تحت هذا النصّ', 'Remove the line under this text') : '') +
        (moved ? btn('del', 'fa-trash', 'احذفْ هذه الملاحظة', 'Delete this note') : '') +
        btn('eye', 'fa-eye-slash', 'أخفِ نوافذَ الملاحظات (تُعاد من «ملاحظاتي»)', 'Hide note windows (bring them back from My notes)') +
        btn('x', 'fa-xmark', 'أغلقْ', 'Close') +
        '</span></header>' +
      '<div class="mp-sv" tabindex="-1"><p class="mp-wait">…</p></div>' +
      (moved
        ? '<form class="mp-in"><textarea rows="1" dir="' + pdir() + '" maxlength="4000" aria-label="' + esc(L('ملاحظةٌ سريعة', 'Quick note')) + '" placeholder="' + esc(L('أضِفْ سطراً — يُحفظ وحدَه', 'Add a line — it saves itself')) +
            '" data-ar-placeholder="أضِفْ سطراً — يُحفظ وحدَه" data-en-placeholder="Add a line — it saves itself"></textarea>' +
            doneBtn() +
            '<span class="mp-st" aria-live="polite"></span></form>'
        : '<div class="mp-in mp-in--old"><button type="button" class="mp-mv" data-mp="open"><i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i> ' + esc(L('انقلْها إلى ملاحظات الوحدة لتكملَ عليها', 'Move it into the module notes to keep writing')) + '</button></div>');
    if (o.hold) card.__hold = 1;
    drag(card);
    card.addEventListener('click', onCard);
    card.addEventListener('pointerenter', function () { clearTimeout(hideT); });
    card.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && card === HOV && !card.__hold) hideSoon(); });
    var ta = card.querySelector('textarea'), form = card.querySelector('form');
    if (ta) {
      card.__dk = 'q' + Date.now().toString(36);
      card.__autosave = function () { if (ta.value.trim() && !card.__saving) save(card, true); };
      ta.addEventListener('input', function () {
        ta.dir = ta.value ? 'auto' : pdir(); card.classList.toggle('mp-has', !!ta.value.trim()); ta.style.blockSize = 'auto'; ta.style.blockSize = Math.min(140, ta.scrollHeight) + 'px';
        keepDraft({ k: card.__dk, id: card.__ref.id, bid: card.__head || card.__ref.bid, text: ta.value });
      });
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); save(card); }
        if (e.key === 'Escape') { ta.blur(); if (!card.classList.contains('mp-pin')) close(card); }
      });
      form.addEventListener('submit', function (e) { e.preventDefault(); save(card); });
    }
    document.body.appendChild(card);
    return card;
  }

  function place(card, r) {
    var vw = window.innerWidth, vh = window.innerHeight, pad = 10;
    var main = document.querySelector('.main-content'), mr = main ? main.getBoundingClientRect() : { left: 0, right: vw };
    var lo = Math.max(pad, mr.left + 4), hi = Math.min(vw - pad, mr.right - 4);
    var hd = document.querySelector('.g-header'), top0 = (hd ? hd.getBoundingClientRect().bottom : 0) + pad;
    var up = r.top - 10 - top0, down = vh - pad - r.bottom - 10;
    card.style.maxBlockSize = '';
    var h = card.offsetHeight, above = h <= up || (h > down && up >= down);
    if (h > (above ? up : down)) { card.style.maxBlockSize = Math.max(180, Math.floor(above ? up : down)) + 'px'; h = card.offsetHeight; }
    var y = above ? r.top - 10 - h : r.bottom + 10;
    var w = card.offsetWidth, x = Math.max(lo, Math.min(hi - w, (r.left + r.right) / 2 - w / 2));
    card.style.left = Math.round(x + window.scrollX) + 'px';
    card.style.top = Math.round(y + window.scrollY) + 'px';
  }

  function show(hit, o) {
    o = o || {};
    if (!hit || !hit.ta || !(hit.ta.n || hit.legacy) || off()) return Promise.resolve(null);
    var key = keyOf(hit), i;
    if (HOV && !HOV.isConnected) HOV = null;
    PINS = PINS.filter(function (c) { return c.isConnected; });
    for (i = 0; i < PINS.length; i++) if (PINS[i].__key === key) { flash(PINS[i]); return Promise.resolve(PINS[i]); }
    if (HOV && HOV.__key === key) { clearTimeout(hideT); if (o.hold) HOV.__hold = 1; return Promise.resolve(HOV); }
    if (HOV) hide(HOV);
    var card = build(hit, o);
    if (!o.pin) HOV = card;
    var r = hit.r || (hit.rg && hit.rg.getBoundingClientRect());
    place(card, r);
    if (o.pin) pin(card, true);
    card.classList.add('mp-on');
    return body(card, hit).then(function () { if (card.isConnected && !card.classList.contains('mp-float')) place(card, rectOf(hit.rg) || r); return card; });
  }
  function rectOf(rg) {
    if (!rg) return null;
    var u = null;
    [].forEach.call(rg.getClientRects(), function (q) {
      if (q.width < 1 || q.height < 1) return;
      u = u ? { left: Math.min(u.left, q.left), top: Math.min(u.top, q.top), right: Math.max(u.right, q.right), bottom: Math.max(u.bottom, q.bottom) } : { left: q.left, top: q.top, right: q.right, bottom: q.bottom };
    });
    return u;
  }
  function repos(c) {
    if (!c || !c.isConnected || !c.__hit || c.classList.contains('mp-float')) return;
    var r = rectOf(c.__hit.rg);
    if (r) place(c, r);
  }
  function flash(c) { c.classList.remove('mp-flash'); void c.offsetWidth; c.classList.add('mp-flash'); }
  var draftT = 0;
  function keepDraft(o) {
    clearTimeout(draftT);
    draftT = setTimeout(function () { noteLib().then(function (M) { if (M.draft) M.draft(o); }); }, 250);
  }
  /*@3.MOPJ.8*/
  function close(card) {
    if (!card) return;
    clearTimeout(draftT);
    if (card.__autosave) card.__autosave();
    hide(card);
  }
  function hide(card) {
    if (!card) return;
    if (card === HOV) HOV = null;
    PINS = PINS.filter(function (c) { return c !== card; });
    card.classList.remove('mp-on');
    setTimeout(function () { card.remove(); }, 160);
  }
  function typed(card) {
    var ta = card && card.querySelector('textarea');
    return !!(card && (card.__saving || (ta && ta.value.trim())));
  }
  function busy(card) {
    var ta = card && card.querySelector('textarea');
    return !!(card && (card.classList.contains('mp-pin') || card.__hold || typed(card) || (ta && document.activeElement === ta) || card.matches(':hover')));
  }
  function hideSoon() {
    clearTimeout(hideT);
    hideT = setTimeout(function () { if (HOV && !busy(HOV)) hide(HOV); }, 320);
  }
  /*@3.MOPJ.6*/
  function float(card, on) {
    var r = card.getBoundingClientRect();
    card.classList.toggle('mp-float', on);
    if (on) { card.style.left = Math.round(r.left) + 'px'; card.style.top = Math.round(r.top) + 'px'; card.style.maxBlockSize = ''; }
    else { card.style.left = Math.round(r.left + window.scrollX) + 'px'; card.style.top = Math.round(r.top + window.scrollY) + 'px'; }
  }
  function drag(card) {
    var h = card.querySelector('.mp-h'), on = false, dx = 0, dy = 0;
    h.addEventListener('pointerdown', function (e) {
      if (e.button || (e.target.closest && e.target.closest('button'))) return;
      if (!card.classList.contains('mp-pin')) pin(card, true);
      var r = card.getBoundingClientRect();
      on = true; dx = e.clientX - r.left; dy = e.clientY - r.top;
      try { h.setPointerCapture(e.pointerId); } catch (e2) {}
      card.classList.add('mp-drag');
      e.preventDefault();
    });
    h.addEventListener('pointermove', function (e) {
      if (!on) return;
      var w = card.offsetWidth, hh = card.offsetHeight;
      card.style.left = Math.round(Math.max(4, Math.min(window.innerWidth - w - 4, e.clientX - dx))) + 'px';
      card.style.top = Math.round(Math.max(4, Math.min(window.innerHeight - Math.min(hh, 60), e.clientY - dy))) + 'px';
    });
    var end = function () { if (!on) return; on = false; card.classList.remove('mp-drag'); };
    h.addEventListener('pointerup', end);
    h.addEventListener('pointercancel', end);
  }
  function pin(card, on) {
    if (on !== card.classList.contains('mp-float')) float(card, on);
    card.classList.toggle('mp-pin', on);
    var b = card.querySelector('[data-mp="pin"]');
    if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) { if (card === HOV) HOV = null; if (PINS.indexOf(card) < 0) PINS.push(card); }
    else { PINS = PINS.filter(function (c) { return c !== card; }); if (HOV && HOV !== card) hide(HOV); HOV = card; card.__hold = 1; }
  }

  /*@3.MOPJ.3*/
  function openIt(card) {
    var ref = card.__ref, lg = card.__hit && card.__hit.legacy;
    hide(card);
    if (!ref && lg && lg.adopt) { lg.adopt(); return; }
    if (ref) noteLib().then(function (M) { M.open({ id: ref.id, bid: card.__head || ref.bid }); });
  }
  function onCard(e) {
    var card = e.currentTarget, b = e.target.closest('[data-mp]');
    var a = e.target.closest('a[href]');
    if (a && !b) {
      var u = null;
      try { u = new URL(a.getAttribute('href'), location.href); } catch (er) { u = null; }
      var tgt = u && u.hash && u.pathname.slice(-location.pathname.replace(/^.*?\/(L\d+\/|others\/)/, '$1').length) === location.pathname.replace(/^.*?\/(L\d+\/|others\/)/, '$1') ? document.getElementById(u.hash.slice(1)) : null;
      if (tgt) { e.preventDefault(); tgt.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      return;
    }
    if (!b) {
      var ta0 = card.querySelector('textarea');
      if (ta0 && !e.target.closest('textarea, .mp-in') && !String(window.getSelection() || '')) ta0.focus();
      return;
    }
    var act = b.getAttribute('data-mp');
    if (act === 'x') close(card);
    else if (act === 'del') askDel(card);
    else if (act === 'pin') pin(card, !card.classList.contains('mp-pin'));
    else if (act === 'copy') copy(card);
    else if (act === 'open') openIt(card);
    else if (act === 'line') {
      hide(card);
      js('module-tools.js', function () { return !!window.GardenModTools; }).then(function () { window.GardenModTools.noteQuiet(window.GardenModuleInk, card.__hit.ta, true); });
    }
    else if (act === 'eye') {
      try { localStorage.setItem(OFF, '1'); } catch (er2) {}
      hideAll();
      toast(L('أُخفيت نوافذُ الملاحظات — تُعيدها من «ملاحظاتي» أو قائمة الزرّ الأيمن', 'Note windows hidden — bring them back from “My notes” or the right-click menu'));
    }
  }
  function say(card, m) {
    var st = card.querySelector('.mp-st');
    if (st) { st.textContent = m; return; }
    toast(m);
  }
  function copy(card) {
    var t = card.__text || card.querySelector('.mp-sv').innerText || '';
    var h = (card.querySelector('.mp-sv .ne-root') || {}).innerHTML || '';
    var ok = function () { say(card, L('نُسخت ✓', 'Copied ✓')); setTimeout(function () { say(card, ''); }, 1600); };
    var old = function () {
      var x = document.createElement('textarea');
      x.value = t; x.setAttribute('readonly', ''); x.style.cssText = 'position:fixed;opacity:0;inset-block-start:0';
      document.body.appendChild(x); x.select();
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) { done = false; }
      x.remove();
      if (done) ok(); else say(card, L('تعذّر النسخ', 'Copy failed'));
    };
    var cb = navigator.clipboard;
    if (!cb) { old(); return; }
    var p = (window.ClipboardItem && h)
      ? cb.write([new ClipboardItem({ 'text/plain': new Blob([t], { type: 'text/plain' }), 'text/html': new Blob([h], { type: 'text/html' }) })])
      : cb.writeText(t);
    Promise.race([p, new Promise(function (r, no) { setTimeout(function () { no(new Error('slow')); }, 1500); })]).then(ok, old);
  }
  /*@3.MOPJ.9*/
  function askDel(card) {
    if (card.querySelector('.mp-ask')) return;
    var ref = card.__ref, head = card.__head || (ref && ref.bid);
    if (!ref || !head) return;
    var box = document.createElement('div');
    box.className = 'mp-ask';
    box.innerHTML = '<span>' + esc(L('تُحذف الملاحظةُ من ملاحظات الوحدة، ويبقى نصُّ الدرس كما هو.', 'The note is removed from the module notes; the lesson text stays as it is.')) + '</span>' +
      '<button type="button" class="mp-ask-b mp-ask-b--dz" data-ask="yes"><i class="fa-solid fa-trash" aria-hidden="true"></i> ' + esc(L('احذفْها', 'Delete it')) + '</button>' +
      '<button type="button" class="mp-ask-b" data-ask="no">' + esc(L('تراجعْ', 'Cancel')) + '</button>';
    card.__hold = 1;
    card.insertBefore(box, card.querySelector('.mp-in'));
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ask]');
      if (!b) return;
      e.stopPropagation();
      if (b.getAttribute('data-ask') === 'no') { box.remove(); return; }
      [].forEach.call(box.querySelectorAll('button'), function (x) { x.disabled = true; });
      box.querySelector('span').textContent = L('تُحذف…', 'Deleting…');
      noteLib().then(function (M) { return M.drop(ref.id, head); }).then(function (ok) {
        if (ok) { hide(card); toast(L('حُذفت الملاحظة ✓', 'Note deleted ✓')); }
        else box.querySelector('span').textContent = L('تعذّر الحذف — افتحْها في ملاحظات الوحدة', 'Could not delete — open it in the module notes');
      }, function () { box.querySelector('span').textContent = L('تعذّر الحذف', 'Could not delete'); });
    });
    try { box.querySelector('[data-ask="yes"]').focus({ preventScroll: true }); } catch (e2) {}
  }
  function save(card, bg) {
    var ta = card.querySelector('textarea'), st = card.querySelector('.mp-st'), txt = ta.value;
    if (!txt.trim() || card.__saving || !card.__ref) return;
    if (bg) {
      card.__saving = 1;
      noteLib().then(function (M) { return M.addLine(card.__ref.id, card.__head || card.__ref.bid, txt, card.__dk); }).then(function (ok) {
        card.__saving = 0;
        toast(ok ? L('حُفظ ما كتبتَه ✓', 'What you wrote is saved ✓') : L('سيُحفظ ما كتبتَه في زيارتك التالية', 'What you wrote will be saved on your next visit'));
      }, function () { card.__saving = 0; });
      return;
    }
    card.__saving = 1;
    ta.disabled = true; st.textContent = L('يُحفظ…', 'Saving…');
    var root = card.querySelector('.mp-sv .ne-root') || card.querySelector('.mp-sv');
    var miss = card.querySelector('.mp-miss');
    if (miss) miss.remove();
    var tmp = document.createElement('div');
    tmp.className = 'mp-new';
    txt.split(/\n/).filter(function (l) { return l.trim(); }).forEach(function (l) { var p = document.createElement('p'); p.dir = 'auto'; p.textContent = l; tmp.appendChild(p); });
    root.appendChild(tmp);
    repos(card);
    var dk = card.__dk;
    card.__dk = 'q' + Date.now().toString(36);
    noteLib().then(function (M) { return M.addLine(card.__ref.id, card.__head || card.__ref.bid, txt, dk); }).then(function (ok) {
      card.__saving = 0; ta.disabled = false;
      if (ok) { ta.value = ''; ta.dir = pdir(); card.classList.remove('mp-has'); ta.style.blockSize = ''; st.textContent = L('حُفظ ✓', 'Saved ✓'); body(card, card.__hit).then(function () { repos(card); }); }
      else { tmp.remove(); st.textContent = L('تعذّر الحفظ — حاولْ ثانيةً', 'Could not save — try again'); }
      setTimeout(function () { if (st.textContent.indexOf('✓') >= 0) st.textContent = ''; }, 1800);
      ta.focus();
    }, function () { card.__saving = 0; ta.disabled = false; tmp.remove(); st.textContent = L('تعذّر الحفظ', 'Could not save'); });
  }
  function hideAll() { if (HOV) hide(HOV); PINS.slice().forEach(hide); }

  /*@3.MOPJ.7*/
  function compose(o) {
    o = o || {};
    if (!o.quote) return null;
    css('notes.css'); css('module-peek.css');
    if (HOV) hide(HOV);
    var card = document.createElement('section'), rg = o.range || null;
    card.className = 'mp mp-compose';
    card.__key = 'new:' + Date.now(); card.__hold = 1;
    card.__hit = { ta: { k: 1, c: 'sky', t: String(o.quote) }, rg: rg };
    card.setAttribute('role', 'dialog');
    card.setAttribute('dir', pdir());
    card.setAttribute('aria-label', L('ملاحظةٌ جديدة على هذا النصّ', 'A new note on this text'));
    card.style.setProperty('--mp-t', 'var(--gmi-p-sky, #5ab8ff)');
    skin(card, rg);
    var ph = L('اكتبْ ملاحظتَك — تُحفظ وحدَها', 'Write your note — it saves itself');
    card.innerHTML =
      '<header class="mp-h"><span class="mp-tt"><i class="mp-mk" data-st="note" aria-hidden="true"></i><b data-ar="ملاحظةٌ جديدة" data-en="New note">' + esc(L('ملاحظةٌ جديدة', 'New note')) + '</b></span>' +
        '<span class="mp-acts">' +
        btn('grow', 'fa-up-right-and-down-left-from-center', 'وسِّعْها في ملاحظات الوحدة', 'Expand it in the module notes') +
        btn('x', 'fa-xmark', 'أغلقْ', 'Close') +
        '</span></header>' +
      '<form class="mp-in"><textarea rows="2" dir="' + pdir() + '" maxlength="4000" aria-label="' + esc(L('ملاحظةٌ سريعة', 'Quick note')) + '" placeholder="' + esc(ph) +
        '" data-ar-placeholder="اكتبْ ملاحظتَك — تُحفظ وحدَها" data-en-placeholder="Write your note — it saves itself"></textarea>' +
        doneBtn() +
        '<span class="mp-st" aria-live="polite"></span></form>';
    var ta = card.querySelector('textarea'), st = card.querySelector('.mp-st');
    card.__dk = 'c' + Date.now().toString(36);
    card.__autosave = function () {
      var txt = ta.value;
      if (!txt.trim() || card.__saving) return;
      card.__saving = 1;
      noteLib().then(function (M) { return M.create({ k: card.__dk, quote: o.quote, range: rg, sec: o.sec, text: txt }); }).then(function (r) {
        card.__saving = 0;
        toast(r ? L('حُفظت ملاحظتُك ✓', 'Your note is saved ✓') : L('ستُحفظ ملاحظتُك في زيارتك التالية', 'Your note will be saved on your next visit'));
      }, function () { card.__saving = 0; });
    };
    var grow = function () {
      var txt = ta.value;
      clearTimeout(draftT);
      noteLib().then(function (M) { if (M.draft) M.draft({ k: card.__dk, text: '' }); });
      hide(card);
      noteLib().then(function (M) { M.open({ quote: o.quote, range: rg, sec: o.sec, text: txt }); });
    };
    var save = function () {
      var txt = ta.value;
      if (!txt.trim() || card.__saving) return;
      card.__saving = 1; ta.readOnly = true; st.textContent = L('يُحفظ…', 'Saving…');
      clearTimeout(draftT);
      noteLib().then(function (M) { return M.create({ k: card.__dk, quote: o.quote, range: rg, sec: o.sec, text: txt }); }).then(function (r) {
        card.__saving = 0; ta.readOnly = false;
        if (!r) { st.textContent = L('تعذّر الحفظ — حاولْ ثانيةً', 'Could not save — try again'); return; }
        ta.value = '';
        hide(card);
        var hit = { ta: { n: r.id + '#' + r.b, k: 1, c: 'sky', t: String(o.quote) }, rg: rg };
        var p = (rg && !off()) ? show(hit, { hold: 1 }) : Promise.resolve(null);
        p.then(function (c) { if (c) say(c, L('حُفظت ✓', 'Saved ✓')); else toast(L('حُفظت ملاحظتُك ✓', 'Your note is saved ✓')); });
      }, function () { card.__saving = 0; ta.readOnly = false; st.textContent = L('تعذّر الحفظ', 'Could not save'); });
    };
    card.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mp]');
      if (!b) { if (!e.target.closest('textarea')) ta.focus(); return; }
      var a = b.getAttribute('data-mp');
      if (a === 'x') close(card);
      else if (a === 'grow') grow();
    });
    ta.addEventListener('input', function () {
      ta.dir = ta.value ? 'auto' : pdir(); card.classList.toggle('mp-has', !!ta.value.trim()); ta.style.blockSize = 'auto'; ta.style.blockSize = Math.min(140, ta.scrollHeight) + 'px';
      keepDraft({ k: card.__dk, quote: o.quote, sec: o.sec, text: ta.value });
    });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); save(); }
      if (e.key === 'Escape') { e.stopPropagation(); close(card); }
    });
    card.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); save(); });
    drag(card);
    document.body.appendChild(card);
    HOV = card;
    place(card, o.rect || rectOf(rg) || { left: innerWidth / 2, right: innerWidth / 2, top: innerHeight / 3, bottom: innerHeight / 3 });
    card.classList.add('mp-on');
    try { ta.focus({ preventScroll: true }); } catch (e3) { ta.focus(); }
    return card;
  }

  /*@3.MOPJ.4*/
  var rafP = 0, lastE = null, want = null;
  function hitAt(ev) {
    var mk = ev.target.closest && ev.target.closest('.user-highlight, .user-highlight-txt');
    if (mk && window.GardenLegacyPeek) return window.GardenLegacyPeek(mk);
    var I = window.GardenModuleInk;
    return I && I.keptAt ? I.keptAt(ev.clientX, ev.clientY) : null;
  }
  function onMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    lastE = e;
    if (rafP) return;
    rafP = requestAnimationFrame(function () {
      rafP = 0;
      var ev = lastE;
      if (!ev || off() || ev.buttons) return;
      if (HOV && HOV.contains(ev.target)) { clearTimeout(hideT); return; }
      if (ev.target.closest && ev.target.closest('.mp, .mt-sel, .gsf-menu, .mn-sheet')) return;
      var hit = hitAt(ev);
      if (hit && hit.ta && (hit.ta.n || hit.legacy)) {
        clearTimeout(hideT);
        var key = keyOf(hit);
        if (want === key) return;
        want = key;
        clearTimeout(showT);
        showT = setTimeout(function () { if (want === key && !String(window.getSelection() || '').trim()) show(hit); }, 260);
      } else {
        want = null; clearTimeout(showT);
        if (HOV && !busy(HOV)) hideSoon();
      }
    });
  }
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerdown', function (e) {
    var t = e.target;
    if (!t || t === document.documentElement || (t.closest && t.closest('.mp, .gsf-menu, .mt-sel, .mp-toast'))) return;
    var at = hitAt(e), key = at ? keyOf(at) : '';
    [HOV].concat(PINS).forEach(function (c) {
      if (!c || !c.isConnected || c.classList.contains('mp-pin') || c.__saving || c.querySelector('.mp-ask') || (key && c.__key === key)) return;
      close(c);
    });
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && HOV && !HOV.classList.contains('mp-pin')) close(HOV); });
  window.addEventListener('pagehide', function () { [HOV].concat(PINS).forEach(function (c) { if (c && c.__autosave) c.__autosave(); }); });
  window.addEventListener('scroll', function () { if (HOV && !busy(HOV)) hide(HOV); }, { passive: true });
  window.addEventListener('storage', function (e) {
    if (e.key !== 'garden_peek_t' || !e.newValue) return;
    var id = e.newValue.split('|')[0];
    [HOV].concat(PINS).forEach(function (c) { if (c && c.__ref && c.__ref.id === id && !c.__saving) body(c, c.__hit).then(function () { repos(c); }); });
  });
  document.addEventListener('garden:languageChanged', function () {
    var lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
    [HOV].concat(PINS).forEach(function (c) {
      if (!c) return;
      [].forEach.call(c.querySelectorAll('[data-ar-title]'), function (b) { var t = b.getAttribute('data-' + lang + '-title'); b.title = t; b.setAttribute('aria-label', t); });
      [].forEach.call(c.querySelectorAll('[data-ar]'), function (b) { b.textContent = b.getAttribute('data-' + lang); });
      var ta = c.querySelector('textarea'); if (ta) { ta.placeholder = ta.getAttribute('data-' + lang + '-placeholder'); if (!ta.value) ta.dir = pdir(); }
      c.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
    });
  });
  document.addEventListener('garden:peekToggle', function (e) { if (e.detail && !e.detail.on) hideAll(); });
  document.addEventListener('garden:moduleThemeChanged', function () { [HOV].concat(PINS).forEach(function (c) { if (c && c.__hit) skin(c, c.__hit.rg); }); });

  window.GardenModPeek = { show: show, compose: compose, hideAll: hideAll,
                           ask: function (hit) { return show(hit, { hold: 1 }).then(function (c) { if (c) askDel(c); return c; }); }, off: off, on: function () { try { localStorage.removeItem(OFF); } catch (e) {} },
                           tapFirst: function () { return coarse(); } };
})();
