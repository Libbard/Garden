;(function () {
  'use strict';
  var on = false, art = null, obs = null, hold = null, io = null, queued = 0, watched = [];
  var CREDIT = 'https://unsplash.com/@yvettedewit?utm_source=digital_garden&utm_medium=referral';

  function lang() { return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ar'; }
  function num(n) { return lang() === 'en' ? String(n) : String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }); }
  function el(tag, cls, ar, en) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (ar !== undefined) { e.setAttribute('data-al-t', ''); e.setAttribute('data-ar', ar); e.setAttribute('data-en', en === undefined ? ar : en); e.textContent = lang() === 'en' ? e.getAttribute('data-en') : ar; }
    return e;
  }
  function relabel(root) {
    var list = (root || document).querySelectorAll('[data-al-t]');
    for (var i = 0; i < list.length; i++) list[i].textContent = list[i].getAttribute('data-' + lang()) || '';
  }
  function GD() { return window.GardenData || null; }
  function day(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function term() {
    var g = GD(); if (!g) return null;
    var st, w;
    try { st = (g.scheduleRaw() || {}).settings || {}; w = g.termWindow(st); } catch (e) { return null; }
    if (!w || !w.ok) return null;
    var a = day(st.term_start_date), b = day(st.semester_end_date);
    if (!a || !b || b <= a) return null;
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var total = Math.round((b - a) / 864e5), gone = Math.round((now - a) / 864e5);
    var weeks = Math.max(1, Math.ceil(total / 7));
    var out = { a: a, total: total, weeks: weeks, week: Math.max(1, Math.min(weeks, Math.floor(gone / 7) + 1)), p: Math.max(0, Math.min(100, gone / total * 100)) };
    try {
      var ex = (g.scheduleRaw() || {}).exams || [], best = null;
      for (var i = 0; i < ex.length; i++) {
        var d = day(ex[i].date);
        if (!d || d < now) continue;
        if (!best || d < best.d) best = { d: d, c: ex[i].course_code || '' };
      }
      if (best) {
        var bp = (best.d - a) / 864e5 / total * 100;
        if (bp >= 0 && bp <= 100) out.ex = { p: bp, c: best.c };
      }
    } catch (e) {}
    return out;
  }
  function level() {
    var g = GD(), s = null;
    try { s = g && g.semester(); } catch (e) {}
    var lv = s && String(s.level || '').trim();
    return /^\d{1,2}$/.test(lv) ? lv : '';
  }
  function eq(n) {
    var s = el('span', 'al-eq');
    s.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < (n || 4); i++) s.appendChild(document.createElement('b'));
    return s;
  }

  function buildArt(host) {
    var lv = level(), yr = new Date().getFullYear();
    art = el('div', 'al-art');
    var vin = el('div', 'al-vinyl'); vin.setAttribute('aria-hidden', 'true');
    var disc = el('div', 'al-disc'), lab = el('div', 'al-label');
    lab.appendChild(el('span', '', 'الوجه أ · ' + num(yr), 'SIDE A · ' + yr));
    disc.appendChild(lab); vin.appendChild(disc); vin.appendChild(el('div', 'al-sheen'));
    var sl = el('div', 'al-sleeve'); sl.setAttribute('aria-hidden', 'true');
    var top = el('div', 'al-c-top');
    top.appendChild(el('span', 'al-c-lp', 'LP · ' + yr));
    var ti = el('div', 'al-c-title');
    ti.appendChild(el('b', '', 'فصلي', 'My semester'));
    if (lv) ti.appendChild(el('span', '', 'المستوى ' + num(lv), 'Level ' + lv));
    sl.appendChild(top); sl.appendChild(ti);
    var cr = el('a', 'al-credit', 'صورة الغلاف: Yvette de Wit · Unsplash', 'Cover photo: Yvette de Wit · Unsplash');
    cr.href = CREDIT; cr.target = '_blank'; cr.rel = 'noopener noreferrer';
    art.appendChild(vin); art.appendChild(sl); art.appendChild(cr);
    host.insertBefore(art, host.firstChild);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (es) { if (art) art.classList.toggle('al-off', !es[0].isIntersecting); });
      io.observe(art);
    }
  }

  function wave(w) {
    var body = w.querySelector('.widget-body');
    if (!body) return;
    var old = body.querySelector('.al-wave');
    var t = term(), fill = w.querySelector('.widget-bar-fill');
    var p = t ? t.p : Math.max(0, Math.min(100, parseFloat(fill && fill.getAttribute('data-bar')) || 0));
    var key = (t ? t.week + '/' + t.weeks + '/' + (t.ex ? t.ex.c : '') : 'b' + p) + lang();
    if (old && old.getAttribute('data-k') === key) return;
    if (old) old.parentNode.removeChild(old);
    var box = el('div', 'al-wave');
    box.setAttribute('data-k', key);
    box.style.setProperty('--al-p', p.toFixed(2) + '%');
    var sc = el('div', 'al-scrub');
    sc.appendChild(el('div', 'al-bars'));
    if (t && t.ex) {
      var mk = el('span', 'al-mark');
      mk.style.setProperty('--al-m', t.ex.p.toFixed(2) + '%');
      mk.appendChild(el('b', '', t.ex.c));
      sc.appendChild(mk);
    }
    sc.appendChild(el('span', 'al-head'));
    box.appendChild(sc);
    if (t) {
      var tm = el('div', 'al-times');
      var pad = function (n) { return (n < 10 ? '0' : '') + n + ':00'; };
      tm.appendChild(el('b', '', pad(t.week)));
      tm.appendChild(el('span', '', 'الأسبوع ' + num(t.week) + ' من ' + num(t.weeks), 'Week ' + t.week + ' of ' + t.weeks));
      tm.appendChild(el('span', '', pad(t.weeks)));
      box.appendChild(tm);
      box.setAttribute('role', 'img');
      box.setAttribute('aria-label', lang() === 'en' ? 'Week ' + t.week + ' of ' + t.weeks : 'الأسبوع ' + t.week + ' من ' + t.weeks);
    } else box.setAttribute('aria-hidden', 'true');
    var bar = body.querySelector('.widget-bar');
    body.insertBefore(box, bar || null);
    w.classList.toggle('al-has-term', !!t);
  }

  function tracks() {
    var cards = document.querySelectorAll('.dash-course-card');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], sm = c.querySelector('.dnx-nm small');
      if (sm && !c.hasAttribute('data-al-dur')) {
        var m = /(\d+(?:[.,]\d+)?)\s*(ساع|hour|hr|h\b|cr)/i.exec(sm.textContent || '');
        if (m) c.setAttribute('data-al-dur', m[1].replace(',', '.') + ':00');
      }
      if (!c.querySelector(':scope > .al-eq')) c.appendChild(eq(4));
    }
  }

  function side() {
    var act = document.querySelectorAll('.dash-side-item.active');
    for (var i = 0; i < act.length; i++) if (!act[i].querySelector('.al-eq')) act[i].appendChild(eq(3));
    var stale = document.querySelectorAll('.dash-side-item:not(.active) > .al-eq');
    for (var j = 0; j < stale.length; j++) stale[j].parentNode.removeChild(stale[j]);
  }

  function apply() {
    queued = 0;
    if (!on) return;
    var host = document.querySelector('[data-view="overview"] > div');
    if (host && !art) buildArt(host);
    var sem = document.querySelector('.widget[data-widget="semester"]');
    if (sem) wave(sem);
    tracks();
    side();
  }
  function soon() { if (!queued) queued = requestAnimationFrame(apply); }
  function vis() {
    var R = document.documentElement, b = document.body;
    R.classList.toggle('al-paused', document.hidden || !!document.querySelector('dialog[open]') || /overflow:\s*hidden/.test((b && b.getAttribute('style')) || ''));
    R.classList.toggle('al-sheet', !!document.querySelector('.bn-sheet.on'));
  }
  function held(list) {
    for (var i = 0; i < list.length; i++) {
      var t = list[i].target;
      if (t === document.body || t.tagName === 'DIALOG' || (t.classList && t.classList.contains('bn-sheet'))) { vis(); return; }
    }
  }
  function onLang() { relabel(); var s = document.querySelector('.widget[data-widget="semester"] .al-wave'); if (s) s.removeAttribute('data-k'); soon(); }

  function mount() {
    if (on) return;
    on = true;
    apply();
    if ('MutationObserver' in window) {
      obs = new MutationObserver(soon);
      ['#widgets-grid', '#dash-courses', '.dash-side', '.app-sidebar'].forEach(function (s) {
        var n = document.querySelector(s);
        if (!n) return;
        var o = { childList: true, subtree: true };
        if (s.indexOf('side') > -1) { o.attributes = true; o.attributeFilter = ['class']; }
        obs.observe(n, o); watched.push(n);
      });
    }
    if ('MutationObserver' in window && document.body) {
      hold = new MutationObserver(held);
      hold.observe(document.body, { attributes: true, attributeFilter: ['open', 'style', 'class'], subtree: true });
    }
    document.addEventListener('garden:languageChanged', onLang);
    document.addEventListener('visibilitychange', vis);
    vis();
  }
  function unmount() {
    on = false;
    if (queued) cancelAnimationFrame(queued);
    queued = 0;
    if (obs) obs.disconnect();
    if (hold) hold.disconnect();
    obs = null; hold = null; watched = [];
    if (io) io.disconnect();
    io = null;
    document.removeEventListener('garden:languageChanged', onLang);
    document.removeEventListener('visibilitychange', vis);
    document.documentElement.classList.remove('al-paused', 'al-sheet');
    var rm = document.querySelectorAll('.al-art, .al-wave, .al-eq');
    for (var i = 0; i < rm.length; i++) if (rm[i].parentNode) rm[i].parentNode.removeChild(rm[i]);
    var d = document.querySelectorAll('[data-al-dur]');
    for (var j = 0; j < d.length; j++) d[j].removeAttribute('data-al-dur');
    var h = document.querySelectorAll('.al-has-term');
    for (var k = 0; k < h.length; k++) h[k].classList.remove('al-has-term');
    art = null;
  }
  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.album = { mount: mount, unmount: unmount };
})();
