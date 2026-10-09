;(function () {
  'use strict';
  var ON = false, mo = null, raf = 0, tm = [], alt = 0, animUntil = 0, RM = false;
  var DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var FT = 46;
  var DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  var MONS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  var PLANE = '<svg viewBox="-18 -16 34 32" aria-hidden="true"><path d="M14 0L4-2.6-3-15h-4l4 12.6-8 .4-3-5h-3l2 7-2 7h3l3-5 8 .4-4 12.6h4L4 2.6z"/></svg>';
  var CALL = { ar: ['اليوم', 'غداً'], en: ['Today', 'Tomorrow'] };

  function lang() { return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ar'; }
  function mk(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    e.setAttribute('data-dp', '');
    return e;
  }
  function bi(e, ar, en) {
    e.setAttribute('data-ar', ar);
    e.setAttribute('data-en', en);
    e.textContent = lang() === 'en' ? en : ar;
    return e;
  }
  function lat(word, ar) {
    var s = mk('span', 'dp-lat');
    s.setAttribute('aria-hidden', 'true');
    return bi(s, word, ar);
  }
  function later(fn, ms) { tm.push(setTimeout(fn, ms)); }

  function flip(f, to) {
    var from = f._v;
    if (from === to) return;
    f._v = to;
    f.firstChild.textContent = to;
    if (RM) return;
    var a = document.createElement('i'), b = document.createElement('i'), x = document.createElement('b'), y = document.createElement('b');
    a.className = 'dp-lt'; b.className = 'dp-lb';
    x.textContent = from; y.textContent = to;
    a.appendChild(x); b.appendChild(y);
    f.appendChild(a); f.appendChild(b);
    later(function () { if (a.parentNode) a.parentNode.removeChild(a); if (b.parentNode) b.parentNode.removeChild(b); }, FT * 2 + 30);
  }
  function cells(str, cls) {
    var g = mk('span', 'dp-flaps' + (cls ? ' ' + cls : ''));
    g.setAttribute('aria-hidden', 'true');
    String(str).toUpperCase().split('').forEach(function (ch) {
      var f = document.createElement('span'), b = document.createElement('b');
      f.className = 'dp-f' + (ch === ':' ? ' dp-col' : '');
      b.textContent = ch;
      f.appendChild(b);
      f._v = ch;
      g.appendChild(f);
    });
    return g;
  }
  function spin(g, delay) {
    if (!(Date.now() < animUntil)) return;
    Array.prototype.forEach.call(g.children, function (f, i) {
      var c = f._v;
      if (c === ':' || c === ' ') return;
      var L = DRUM.length, idx = Math.max(0, DRUM.indexOf(c)), k = 3 + Math.floor(Math.random() * 7);
      f._v = ' '; f.firstChild.textContent = ' ';
      for (var j = k; j >= 0; j--) {
        (function (v, step) { later(function () { flip(f, v); }, delay + i * 38 + step * (FT * 2 + 14)); })(DRUM[(idx - j + L * 4) % L], k - j);
      }
    });
  }

  function dateCode() {
    var d = new Date(), n = d.getDate();
    return DAYS[d.getDay()] + ' ' + (n < 10 ? '0' + n : n) + ' ' + MONS[d.getMonth()];
  }
  function headLat(w, word, ar) {
    var h = w && w.querySelector(':scope > .widget-head');
    if (!h || h.querySelector('.dp-lat')) return h;
    var t = h.querySelector(':scope > span:not(.widget-icon)');
    var s = lat(word, ar);
    if (t && t.nextSibling) h.insertBefore(s, t.nextSibling); else h.appendChild(s);
    return h;
  }
  function remark(it) { var s = it.querySelector(':scope > span:last-child'); return s && !s.classList.contains('widget-item-name') ? s : null; }
  function isCall(s) {
    if (!s) return false;
    var t = s.textContent.trim(), st = s.getAttribute('style') || '';
    return /st-(warn|danger)/.test(st) && (CALL.ar.indexOf(t) > -1 || CALL.en.indexOf(t) > -1);
  }

  function board(delay) {
    var w = document.querySelector('.widget[data-widget="tasks"]');
    if (!w) return delay;
    var h = headLat(w, 'DEPARTURES', 'المغادرة');
    if (h && !h.querySelector('.dp-clock')) {
      var c = mk('span', 'dp-clock');
      c.setAttribute('aria-hidden', 'true');
      var sm = mk('small');
      sm.appendChild(bi(mk('span'), 'التاريخ المحلّي', 'Local date'));
      sm.appendChild(lat('LOCAL DATE', 'التاريخ المحلّي'));
      var g = cells(dateCode(), 'dp-date');
      c.appendChild(sm); c.appendChild(g);
      var link = h.querySelector('.widget-link');
      h.insertBefore(c, link || null);
      spin(g, delay + 500);
    }
    var list = w.querySelector('.widget-list');
    if (!list) return delay;
    if (!list.querySelector(':scope > .dp-cols')) {
      var cols = mk('div', 'dp-cols');
      cols.setAttribute('aria-hidden', 'true');
      [['الرحلة', 'Flight', 'FLIGHT', 'الرحلة'], ['الوجهة', 'Destination', 'DESTINATION', 'الوجهة'], ['الحالة', 'Remarks', 'REMARKS', 'الحالة']].forEach(function (x) {
        var s = mk('span');
        s.appendChild(bi(mk('span'), x[0], x[1]));
        s.appendChild(lat(x[2], x[3]));
        cols.appendChild(s);
      });
      cols.appendChild(mk('span'));
      list.insertBefore(cols, list.firstChild);
    }
    var first = true;
    Array.prototype.forEach.call(list.querySelectorAll(':scope > .widget-item'), function (it, r) {
      var rm = remark(it);
      it.classList.toggle('dp-call', first && isCall(rm));
      if (rm) first = false;
      if (it.querySelector(':scope > .dp-code')) return;
      var code = it.querySelector('.dash-up-code');
      if (!code || !code.textContent.trim()) return;
      var g = cells(code.textContent.trim().replace(/\s+/g, ''), 'dp-code');
      it.insertBefore(g, it.querySelector('.widget-item-name'));
      it.classList.add('dp-on');
      spin(g, delay + r * 110);
    });
    return delay + 400;
  }

  function arrivals(delay) {
    var w = document.querySelector('.widget[data-widget="today"]');
    if (!w) return;
    headLat(w, 'ARRIVALS', 'الوصول');
    Array.prototype.forEach.call(w.querySelectorAll('.widget-item'), function (it, r) {
      var go = it.querySelector('.widget-item-go'), t = it.querySelector('.widget-item-time');
      if (!go || !t || go.querySelector('.dp-flaps')) return;
      var v = t.textContent.trim();
      if (!/^\d{1,2}:\d{2}$/.test(v)) return;
      if (v.length === 4) v = '0' + v;
      var g = cells(v);
      go.insertBefore(g, go.firstChild);
      it.classList.add('dp-on');
      spin(g, delay + r * 120);
    });
  }

  function welcome() {
    var w = document.querySelector('.widget[data-widget="welcome"]');
    if (!w) return;
    var greet = w.querySelector('.dash-greet');
    if (!w.querySelector('.dp-kick')) {
      var k = mk('span', 'dp-kick');
      k.setAttribute('aria-hidden', 'true');
      k.appendChild(bi(mk('span'), 'صالة المغادرة', 'Departures lounge'));
      k.appendChild(lat('DEPARTURES LOUNGE', 'صالة المغادرة'));
      w.insertBefore(k, greet || w.firstChild);
    }
    var it = document.querySelector('.widget[data-widget="tasks"] .widget-list > .widget-item');
    var code = it && it.querySelector('.dash-up-code'), rm = it && remark(it);
    var nx = w.querySelector('.dp-next');
    if (!code || !rm) { if (nx) nx.parentNode.removeChild(nx); return; }
    var key = code.textContent.trim() + '|' + rm.textContent.trim() + '|' + lang();
    if (nx && nx.getAttribute('data-k') === key) return;
    if (!nx) {
      nx = mk('span', 'dp-next');
      nx.setAttribute('aria-hidden', 'true');
      w.appendChild(nx);
    }
    nx.setAttribute('data-k', key);
    nx.innerHTML = '';
    var pl = document.createElement('span');
    pl.className = 'dp-pl';
    pl.innerHTML = PLANE;
    var tx = document.createElement('span'), b = document.createElement('b'), em = document.createElement('em');
    tx.textContent = (lang() === 'en' ? 'Next flight' : 'رحلتك التالية') + ' ';
    b.textContent = code.textContent.trim();
    em.textContent = rm.textContent.trim();
    tx.appendChild(b);
    tx.appendChild(document.createTextNode(' · '));
    tx.appendChild(em);
    nx.appendChild(pl);
    nx.appendChild(tx);
  }

  function qr(seed) {
    var s = seed, o = '';
    function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    function fnd(x, y) { o += '<rect x="' + x + '" y="' + y + '" width="7" height="7"/><rect class="dp-qr-h" x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>'; }
    for (var y = 0; y < 25; y++) for (var x = 0; x < 25; x++) {
      if ((x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16)) continue;
      if (rnd() > .52) o += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    fnd(0, 0); fnd(18, 0); fnd(0, 18);
    return '<svg class="dp-qr" viewBox="0 0 25 25" shape-rendering="crispEdges" aria-hidden="true">' + o + '</svg>';
  }

  function pass() {
    var a = document.querySelector('#dash-exam-slot .dash-xam');
    if (!a || a.querySelector('.dp-ph')) return;
    var sub = a.querySelector('.dash-xam-s'), t = a.querySelector('.dash-xam-t');
    var m = sub && sub.textContent.match(/\b[A-Z]{2,5}\s?\d{3}[A-Z]?\b/);
    var code = m ? m[0].replace(/\s+/g, '') : '';
    var ph = mk('span', 'dp-ph');
    ph.setAttribute('aria-hidden', 'true');
    var air = mk('span', 'dp-air'), ic = document.createElement('i'), nm = document.createElement('span');
    ic.innerHTML = PLANE;
    nm.appendChild(bi(mk('b'), 'خطوط الحديقة', 'Garden Air'));
    nm.appendChild(lat('GARDEN AIR', 'خطوط الحديقة'));
    air.appendChild(ic); air.appendChild(nm);
    var bp = mk('small');
    bp.appendChild(bi(mk('span'), 'بطاقة صعود', 'Boarding pass'));
    bp.appendChild(lat('BOARDING PASS', 'بطاقة صعود'));
    ph.appendChild(air); ph.appendChild(bp);
    a.insertBefore(ph, a.firstChild);
    var toL = mk('span', 'dp-lbl dp-to-l');
    toL.setAttribute('aria-hidden', 'true');
    toL.appendChild(bi(mk('span'), 'إلى', 'To'));
    toL.appendChild(lat('TO', 'إلى'));
    a.insertBefore(toL, t ? t.parentNode : null);
    if (code) {
      var fl = mk('span', 'dp-lbl dp-from-l');
      fl.setAttribute('aria-hidden', 'true');
      fl.appendChild(bi(mk('span'), 'من', 'From'));
      fl.appendChild(lat('FROM', 'من'));
      var big = mk('span', 'dp-big');
      big.setAttribute('aria-hidden', 'true');
      big.textContent = code;
      var fly = mk('span', 'dp-fly');
      fly.setAttribute('aria-hidden', 'true');
      fly.innerHTML = PLANE;
      a.insertBefore(fl, toL); a.insertBefore(fly, toL); a.insertBefore(big, toL);
      a.classList.add('dp-has-from');
    }
    var st = mk('span', 'dp-stub');
    st.setAttribute('aria-hidden', 'true');
    var seed = 0;
    for (var i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) & 0xffff;
    st.innerHTML = qr(seed + 99);
    var info = document.createElement('span');
    info.className = 'dp-sinfo';
    var c = document.createElement('span');
    c.textContent = code || 'GARDEN AIR';
    var bar = document.createElement('i');
    bar.className = 'dp-bar';
    info.appendChild(c); info.appendChild(bar);
    st.appendChild(info);
    a.appendChild(st);
  }

  function altitude() {
    var m = document.querySelector('.widget[data-widget="gpa"] .widget-metric');
    if (!m) return;
    var v = parseFloat(m.textContent.replace(',', '.'));
    var box = m.parentNode, cur = box.querySelector('.dp-altm');
    if (!(v > 0 && v <= 5)) { if (cur) cur.parentNode.removeChild(cur); return; }
    var ft = Math.round(v * 10000).toLocaleString('en-US');
    var key = ft + lang();
    if (cur && cur.getAttribute('data-k') === key) return;
    if (!cur) { cur = mk('span', 'dp-altm'); cur.setAttribute('aria-hidden', 'true'); box.appendChild(cur); }
    cur.setAttribute('data-k', key);
    cur.innerHTML = '';
    var b = document.createElement('b');
    b.textContent = lang() === 'en' ? ft + ' ft' : ft + ' قدم';
    cur.appendChild(document.createTextNode(lang() === 'en' ? 'Cruising at ' : 'تحليقٌ على '));
    cur.appendChild(b);
  }

  function credit() {
    var host = document.querySelector('[data-view="overview"] > div');
    if (!host || host.querySelector(':scope > .dp-credit')) return;
    var u = '?utm_source=digital_garden&utm_medium=referral';
    function link(href, name) { var x = document.createElement('a'); x.href = 'https://unsplash.com/@' + href + u; x.target = '_blank'; x.rel = 'noopener noreferrer'; x.textContent = name; return x; }
    function line(cls, who) {
      var s = document.createElement('span');
      s.className = cls;
      s.appendChild(bi(mk('span'), 'تصوير: ', 'Photo: '));
      s.appendChild(link(who[0], who[1]));
      s.appendChild(document.createTextNode(' · Unsplash'));
      return s;
    }
    var p = mk('p', 'dp-credit');
    p.appendChild(line('dp-cr-day', ['astraliu123', 'Astra Liu']));
    p.appendChild(line('dp-cr-win', ['smeasevt', 'Stephen Mease']));
    p.appendChild(line('dp-cr-night', ['frogman1962', 'Tsukada Kazuhiro']));
    host.appendChild(p);
  }

  function decorate() {
    raf = 0;
    if (!ON) return;
    var d = board(250);
    arrivals(d + 200);
    welcome();
    headLat(document.querySelector('.widget[data-widget="notes"]'), 'CABIN NOTE', 'مذكّرة الرحلة');
    pass();
    altitude();
    credit();
    if (animUntil && document.querySelector('.dp-flaps')) animUntil = 0;
  }
  function schedule(list) {
    if (list && list.every && list.every(function (m) { var t = m.target; return t.nodeType === 1 && (t.closest('.dp-flaps') || t.classList.contains('dp-next') || t.classList.contains('dp-altm')); })) return;
    if (!raf) raf = requestAnimationFrame(decorate);
  }

  function tick() {
    if (document.hidden || RM) return;
    var it = document.querySelector('.widget[data-widget="tasks"] .widget-item.dp-call');
    if (!it) return;
    var s = remark(it);
    if (!s) return;
    if (it.classList.contains('dp-alt')) { it.classList.remove('dp-alt'); return; }
    s.setAttribute('data-dp-alt', (lang() === 'en' ? 'Final call · ' : 'آخر نداء · ') + s.textContent.trim());
    it.classList.add('dp-alt');
  }
  function startTick() { if (!alt && !RM && ON && !document.hidden) alt = setInterval(tick, 6500); }
  function stopTick() { if (alt) clearInterval(alt); alt = 0; }
  function vis() { if (document.hidden) stopTick(); else startTick(); }

  function relabel() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-dp][data-ar]'), function (e) {
      var v = e.getAttribute('data-' + lang());
      if (v != null) e.textContent = v;
    });
    var it = document.querySelector('.widget-item.dp-alt');
    if (it) it.classList.remove('dp-alt');
    schedule();
  }

  function mount() {
    if (ON) return;
    ON = true;
    try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { RM = false; }
    var fresh = false;
    try { fresh = !sessionStorage.getItem('dp-flap'); sessionStorage.setItem('dp-flap', '1'); } catch (e) { fresh = false; }
    animUntil = (fresh && !RM && !document.hidden) ? Date.now() + 5000 : 0;
    var targets = ['#widgets-grid', '#dash-exam-slot'].map(function (s) { return document.querySelector(s); }).filter(Boolean);
    if (targets.length && window.MutationObserver) {
      mo = new MutationObserver(schedule);
      targets.forEach(function (t) { mo.observe(t, { childList: true, subtree: true, characterData: true }); });
    }
    decorate();
    document.addEventListener('garden:languageChanged', relabel);
    document.addEventListener('visibilitychange', vis);
    startTick();
  }
  function unmount() {
    if (!ON) return;
    ON = false;
    if (mo) mo.disconnect();
    mo = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    stopTick();
    tm.forEach(clearTimeout);
    tm = [];
    animUntil = 0;
    document.removeEventListener('garden:languageChanged', relabel);
    document.removeEventListener('visibilitychange', vis);
    Array.prototype.forEach.call(document.querySelectorAll('[data-dp]'), function (e) {
      if (e.parentNode && !(e.parentNode.closest && e.parentNode.closest('[data-dp]'))) e.parentNode.removeChild(e);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.dp-on, .dp-call, .dp-alt, .dp-has-from'), function (e) { e.classList.remove('dp-on', 'dp-call', 'dp-alt', 'dp-has-from'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-dp-alt]'), function (e) { e.removeAttribute('data-dp-alt'); });
  }
  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.departures = { mount: mount, unmount: unmount };
})();
