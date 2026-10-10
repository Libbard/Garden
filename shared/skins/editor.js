;(function () {
  'use strict';
  var D = document, R = D.documentElement;
  var on = false, els = [], obs = [], timers = [], raf = 0, deb = 0, lastGut = '', cured = null;
  var LH = 28;
  var EXT = { overview: '.md', home: '.md', notes: '.md', tour: '.md', tasks: '.todo', schedule: '.ics', gpa: '.calc', settings: '.json',
    sections: '.csv', faculty: '.json', labs: '.py', ratings: '.log', semester: '.yml', courses: '/', levels: '/' };
  var FALLBACK = { semester: 'hub/index.html', schedule: 'hub/schedule.html', labs: 'hub/labs.html', settings: 'hub/settings.html', home: 'index.html' };
  var ACT = [
    { k: 'explorer', ic: 'fa-solid fa-copy', ar: 'المستكشف', en: 'Explorer' },
    { k: 'search', ic: 'fa-solid fa-magnifying-glass', ar: 'بحث (Ctrl K)', en: 'Search (Ctrl K)' },
    { k: 'semester', ic: 'fa-solid fa-code-branch', ar: 'فصلي', en: 'Semester', badge: 1 },
    { k: 'schedule', ic: 'fa-solid fa-calendar-days', ar: 'الجدول', en: 'Schedule' },
    { k: 'labs', ic: 'fa-solid fa-flask', ar: 'المختبر', en: 'Labs' },
    { k: 'settings', ic: 'fa-solid fa-gear', ar: 'الإعدادات', en: 'Settings', end: 1 }
  ];
  var HOT = '.widget[data-widget="tasks"] .widget-item:is(:has(> span:last-child[style*="danger"]), :first-child:has(> span:last-child[style*="warn"]))';
  var LINES = [
    '.widget[data-widget="welcome"]:not([hidden]) .dash-greet-n',
    '.widget[data-widget="welcome"]:not([hidden]) .dash-greet > .widget-sub',
    '.widget:is([data-widget="tasks"], [data-widget="today"], [data-widget="notes"]):not([hidden]) > .widget-head',
    '.widget:is([data-widget="tasks"], [data-widget="today"]):not([hidden]) .widget-item',
    '.widget:is([data-widget="tasks"], [data-widget="today"], [data-widget="notes"]):not([hidden]) .widget-empty',
    '.widget[data-widget="notes"]:not([hidden]) :is(.wn-item, .wn-list > .widget-sub)',
    ':scope > .dash-section-head',
    '#dash-courses > .dash-course-card',
    '#dash-levels-section:not([hidden]) .dash-section-head',
    '#dash-levels-section:not([hidden]) .dash-level-card'
  ].join(',');
  var LENS = '#dash-tour-promo, .dash-today-foot, .wn-foot';
  var OUT = '.widget:is([data-widget="semester"], [data-widget="gpa"], [data-widget="due"], [data-widget="community"]):not([hidden]), .ed-probs';

  function en() { return R.getAttribute('lang') === 'en'; }
  function tx(ar, e) { return en() ? e : ar; }
  function qs(s, r) { return (r || D).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bi(ar, e) { return '<span data-ar="' + esc(ar) + '" data-en="' + esc(e) + '">' + esc(en() ? e : ar) + '</span>'; }
  function jget(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function day0() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function pd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function daysTo(s) { var d = pd(s); return d ? Math.round((d - day0()) / 864e5) : null; }
  function rel(n) {
    if (n < 0) return tx('متأخّرة', 'overdue');
    if (n === 0) return tx('اليوم', 'today');
    if (n === 1) return tx('غداً', 'tomorrow');
    if (en()) return 'in ' + n + ' days';
    if (n === 2) return 'بعد يومين';
    return 'بعد ' + n + (n <= 10 ? ' أيام' : ' يوماً');
  }
  function root() {
    var a = qs('.g-logo');
    var h = (a && a.href) || '';
    return h ? h.replace(/index\.html(?:[?#].*)?$/, '').replace(/[?#].*$/, '') : '';
  }
  function side() { return qs('aside.dash-side, aside.app-sidebar'); }
  function sideItem(k) { var s = side(); return s ? s.querySelector('.dash-side-item[data-side-key="' + k + '"]') : null; }
  function label(it) {
    if (!it) return '';
    var s = it.querySelector('span:not(.dash-side-badge)');
    return (s ? s.textContent : it.textContent || '').trim();
  }
  function add(el, parent, before) {
    if (before) parent.insertBefore(el, before); else parent.appendChild(el);
    els.push(el);
    return el;
  }
  function drop(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    var i = els.indexOf(el);
    if (i > -1) els.splice(i, 1);
  }

  function problems() {
    var out = [];
    var tasks = jget('my_tasks');
    if (Array.isArray(tasks)) tasks.forEach(function (t) {
      if (!t || t.done || !t.due) return;
      var n = daysTo(t.due);
      if (n == null || n > 3) return;
      out.push({ lvl: n <= 1 ? 'e' : 'w', n: n, t: t.title || '', code: t.course || '' });
    });
    var ws = jget('weekly_schedule');
    var ex = ws && Array.isArray(ws.exams) ? ws.exams : [];
    ex.forEach(function (x) {
      if (!x || !x.date) return;
      var n = daysTo(x.date);
      if (n == null || n < 0 || n > 14) return;
      var nm = x.exam_type === 'midterm' ? tx('الاختبار النصفي', 'Midterm') : x.exam_type === 'final' ? tx('الاختبار النهائي', 'Final exam') : tx('اختبار', 'Exam');
      out.push({ lvl: n <= 2 ? 'e' : 'w', n: n, t: nm, code: x.course_code || '', exam: 1 });
    });
    out.sort(function (a, b) { return a.n - b.n; });
    return out;
  }
  function weekInfo() {
    var ws = jget('weekly_schedule'), st = (ws && ws.settings) || {};
    var a = pd(st.term_start_date), b = pd(st.semester_end_date);
    if (!a || !b || b <= a) return null;
    var total = Math.round((b - a) / 864e5), gone = Math.round((day0() - a) / 864e5);
    var weeks = Math.max(1, Math.ceil(total / 7));
    return { week: Math.max(1, Math.min(weeks, Math.floor(gone / 7) + 1)), weeks: weeks };
  }
  function branch() {
    var s = jget('my_semester');
    var n = s && (en() ? (s.name_en || s.name_ar) : (s.name_ar || s.name_en));
    if (n && n !== 'T') return n;
    return tx('فصلي', 'semester');
  }
  function syncState() {
    var d = qs('#sync-header-btn .sync-status-dot');
    var c = d ? d.className : '';
    if (/\bsynced\b/.test(c)) return ['fa-solid fa-rotate', 'متزامن', 'Synced'];
    if (/\bloading\b/.test(c)) return ['fa-solid fa-rotate', 'يزامن…', 'Syncing…'];
    if (/\bpending\b/.test(c)) return ['fa-solid fa-rotate', 'بانتظار المزامنة', 'Pending sync'];
    if (/\berror\b/.test(c)) return ['fa-solid fa-triangle-exclamation', 'تعذّرت المزامنة', 'Sync failed'];
    return ['fa-solid fa-cloud', 'على هذا الجهاز', 'This device'];
  }

  var status = null;
  function paintStatus() {
    if (!status) {
      status = add(D.createElement('footer'), D.body);
      status.className = 'ed-status';
      status.setAttribute('aria-hidden', 'true');
    }
    var p = problems(), e = 0, w = 0;
    p.forEach(function (x) { if (x.lvl === 'e') e++; else w++; });
    var s = syncState(), wk = weekInfo();
    var h = '<span class="ed-br"><i class="fa-solid fa-code-branch"></i>' + esc(branch()) + '</span>' +
      '<span><i class="' + s[0] + '"></i>' + bi(s[1], s[2]) + '</span>' +
      '<span class="ed-e"><i class="fa-solid fa-circle-xmark"></i><b>' + e + '</b></span>' +
      '<span class="ed-w"><i class="fa-solid fa-triangle-exclamation"></i><b>' + w + '</b></span>' +
      '<span class="ed-sp">' + (wk ? bi('الأسبوع ' + wk.week + ' من ' + wk.weeks, 'Week ' + wk.week + ' of ' + wk.weeks) : '') + '</span>' +
      '<span class="ed-lang">' + bi('العربية', 'English') + '</span>' +
      '<span class="ed-enc ed-mono">UTF-8</span>' +
      '<span class="ed-enc ed-mono">' + (en() ? 'LTR' : 'RTL') + '</span>';
    if (status.innerHTML !== h) status.innerHTML = h;
    var bd = act && act.querySelector('.ed-bd');
    if (bd) { bd.textContent = String(e + w); bd.hidden = !(e + w); }
  }

  var act = null;
  function paintAct() {
    if (!D.body) return;
    if (!act) {
      act = add(D.createElement('nav'), D.body);
      act.className = 'ed-act';
      R.classList.add('ed-has-act');
      act.setAttribute('aria-label', tx('شريط النشاط', 'Activity bar'));
      act.addEventListener('click', onAct);
    }
    var base = root();
    var h = ACT.map(function (a) {
      var t = esc(en() ? a.en : a.ar);
      var cls = (a.end ? 'ed-end' : '') + (a.k === 'explorer' && !R.classList.contains('sb-collapsed') ? ' on' : '');
      var inner = '<i class="' + a.ic + '" aria-hidden="true"></i>' + (a.badge ? '<span class="ed-bd" hidden></span>' : '');
      var it = sideItem(a.k);
      var href = it && it.tagName === 'A' ? it.href : (!it && FALLBACK[a.k] && base ? base + FALLBACK[a.k] : '');
      if (href) return '<a class="' + cls + '" href="' + esc(href) + '" data-k="' + a.k + '" title="' + t + '" aria-label="' + t + '" data-ar-title="' + esc(a.ar) + '" data-en-title="' + esc(a.en) + '">' + inner + '</a>';
      return '<button type="button" class="' + cls + '" data-k="' + a.k + '" title="' + t + '" aria-label="' + t + '" data-ar-title="' + esc(a.ar) + '" data-en-title="' + esc(a.en) + '">' + inner + '</button>';
    }).join('');
    if (act.getAttribute('data-h') !== h) { act.innerHTML = h; act.setAttribute('data-h', h); }
  }
  function onAct(ev) {
    var b = ev.target.closest('button[data-k]');
    if (!b) return;
    var k = b.getAttribute('data-k');
    if (k === 'explorer') { var t = qs('.sb-toggle'); if (t) t.click(); setTimeout(paintAct, 30); return; }
    if (k === 'search') { var i = qs('#gs-input'); if (i) i.focus(); return; }
    var it = sideItem(k);
    if (it) it.click();
  }

  var tabs = null, crumbs = null;
  function paintTabs() {
    var host = qs('.dash-main') || qs('.app-shell-main');
    if (!host) return;
    var home = host.classList.contains('dash-main');
    var s = side(), a = s && s.querySelector('.dash-side-item.active');
    if (!a && s) {
      var me = location.pathname.replace(/\/index\.html$/, '/');
      Array.prototype.forEach.call(s.querySelectorAll('a.dash-side-item[href]'), function (x) {
        var p = x.pathname.replace(/\/index\.html$/, '/');
        if (!a && p === me && !x.hash) a = x;
      });
      var old = s.querySelector('[data-ed-cur]');
      if (old && old !== a) old.removeAttribute('data-ed-cur');
      if (a) { a.setAttribute('data-ed-cur', ''); cured = a; }
    }
    var ak = a ? a.getAttribute('data-side-key') : '';
    var keys = home ? ['overview', 'tasks', 'schedule'] : ['home', ak || '_page'];
    if (home && ak && keys.indexOf(ak) < 0) keys.splice(1, 0, ak);
    if (!home && !ak) ak = '_page';
    var h = keys.map(function (k) {
      var it = k === '_page' ? null : sideItem(k);
      var nm, ic, ext = EXT[k] || '.md';
      if (it) { nm = label(it); var ii = it.querySelector('i'); ic = ii ? ii.className : 'fa-solid fa-file-lines'; }
      else if (k === '_page') { var t = qs('h1.g-title'); nm = (t ? t.textContent : D.title).trim(); ic = 'fa-solid fa-file-lines'; }
      else return '';
      var cur = (home ? (ak || 'overview') : ak) === k;
      var body = '<i class="' + esc(ic) + '" aria-hidden="true"></i><b>' + esc(nm) + '</b><small>' + esc(ext) + '</small>' +
        '<i class="fa-solid fa-xmark ed-x" aria-hidden="true"></i>';
      var cls = 'ed-tab' + (cur ? ' on' : '');
      if (it && it.tagName === 'A') return '<a class="' + cls + '" data-k="' + k + '" href="' + esc(it.href) + '"' + (cur ? ' aria-current="page"' : '') + '>' + body + '</a>';
      if (it) return '<button type="button" class="' + cls + '" data-k="' + k + '"' + (cur ? ' aria-current="page"' : '') + '>' + body + '</button>';
      return '<span class="' + cls + '" data-k="' + k + '">' + body + '</span>';
    }).join('');
    if (!tabs || tabs.parentNode !== host) {
      if (tabs) drop(tabs);
      tabs = add(D.createElement('div'), host, host.firstChild);
      tabs.className = 'ed-tabs';
      tabs.setAttribute('role', 'navigation');
      tabs.addEventListener('click', function (ev) {
        var b = ev.target.closest('button.ed-tab');
        if (!b) return;
        var it = sideItem(b.getAttribute('data-k'));
        if (it) it.click();
      });
    }
    tabs.setAttribute('aria-label', tx('الملفّات المفتوحة', 'Open files'));
    if (tabs.getAttribute('data-h') !== h) { tabs.innerHTML = h; tabs.setAttribute('data-h', h); }
    var grp = a && a.closest('.dash-side-group');
    var gl = grp && grp.querySelector('.dash-side-label');
    var c = '<span>' + esc(tx('الحديقة الرقمية', 'Digital Garden')) + '</span>' +
      (gl ? '<span>' + esc(gl.textContent.trim()) + '</span>' : grp && !grp.previousElementSibling ? '<span>' + esc(tx('لوحتي', 'Dashboard')) + '</span>' : '') +
      '<span>' + esc((a ? label(a) : ((qs('h1.g-title') || {}).textContent || '').trim()) + (EXT[ak] || '.md')) + '</span>';
    if (!crumbs || crumbs.parentNode !== host) {
      if (crumbs) drop(crumbs);
      crumbs = add(D.createElement('div'), host, tabs.nextSibling);
      crumbs.className = 'ed-crumbs';
      crumbs.setAttribute('aria-hidden', 'true');
    }
    if (crumbs.innerHTML !== c) crumbs.innerHTML = c;
  }

  var gut = null, probs = null;
  function overview() { return qs('section[data-view="overview"] > div'); }
  function paintProbs(host) {
    if (!probs || probs.parentNode !== host) {
      if (probs) drop(probs);
      probs = add(D.createElement('section'), host);
      probs.className = 'ed-probs';
    }
    var p = problems();
    var h = '<div class="ed-sec">' + esc(tx('المشكلات', 'Problems')) + ' · <bdi>' + p.length + '</bdi></div>';
    if (!p.length) h += '<div class="ed-prob-none">' + esc(tx('// لا مشكلات — كلُّ شيءٍ على ما يرام', '// No problems — all clear')) + '</div>';
    p.slice(0, 3).forEach(function (x) {
      h += '<div class="ed-prob"><i class="fa-solid ' + (x.lvl === 'e' ? 'fa-circle-xmark e' : 'fa-triangle-exclamation w') + '" aria-hidden="true"></i>' +
        '<div>' + esc(x.t) + ' — ' + esc(rel(x.n)) + '<small><bdi>' + esc(x.code) + '</bdi> · ' + esc(x.exam ? tx('الجدول', 'schedule') + '.ics' : tx('المهام', 'tasks') + '.todo') + '</small></div></div>';
    });
    if (probs.innerHTML !== h) probs.innerHTML = h;
  }
  function paintGut() {
    var host = overview();
    if (!host) return;
    paintProbs(host);
    if (!gut || gut.parentNode !== host) {
      if (gut) drop(gut);
      gut = add(D.createElement('div'), host);
      gut.className = 'ed-gut';
      gut.setAttribute('aria-hidden', 'true');
      lastGut = '';
    }
    if (!host.offsetParent && getComputedStyle(host).position !== 'fixed') { return; }
    var H = host.getBoundingClientRect();
    if (!H.height) return;
    var items = [];
    Array.prototype.forEach.call(host.querySelectorAll(LINES), function (el) {
      var r = el.getBoundingClientRect();
      if (!r.height) return;
      items.push({ t: r.top - H.top, b: r.bottom - H.top, line: 1, cur: el.matches(HOT), card: el.matches('.dash-course-card, .dash-level-card') });
    });
    var x = host.querySelector('.dash-xam');
    if (x) {
      var xr = x.getBoundingClientRect();
      if (xr.height) {
        items.push({ t: xr.top - H.top - LH, b: xr.top - H.top, line: 1 });
        items.push({ t: xr.top - H.top, b: xr.bottom - H.top, line: 1, mid: 1 });
      }
    }
    var G = gut.getBoundingClientRect();
    Array.prototype.forEach.call(host.querySelectorAll(LENS + ', ' + OUT), function (el) {
      var r = el.getBoundingClientRect();
      if (!r.height || (el.matches(OUT) && (r.right <= G.left + 2 || r.left >= G.right - 2))) return;
      items.push({ t: r.top - H.top, b: r.bottom - H.top, line: 0 });
    });
    items.sort(function (a, b) { return a.t - b.t || b.line - a.line; });
    var n = 0, cur = items.length ? items[0].t : 0, rowT = -1e9, out = '';
    items.forEach(function (it) {
      var gap = it.t - cur;
      if (gap >= LH * 0.6) {
        var k = Math.max(1, Math.round(gap / LH)), step = gap / k;
        for (var i = 0; i < k; i++) { n++; out += '<span style="inset-block-start:' + Math.round(cur + i * step + (step - LH) / 2) + 'px">' + n + '</span>'; }
      }
      if (it.line && Math.abs(it.t - rowT) > 4) {
        n++;
        var y = it.mid ? (it.t + it.b) / 2 - LH / 2 : it.card ? it.t + 10 : it.t + (Math.min(LH, it.b - it.t) - LH) / 2;
        out += '<span' + (it.cur ? ' class="cur"' : '') + ' style="inset-block-start:' + Math.round(y) + 'px">' + n + '</span>';
        rowT = it.t;
      }
      if (it.b > cur) cur = it.b;
    });
    if (out !== lastGut) { gut.innerHTML = out; lastGut = out; }
  }

  function refresh() {
    if (!on) return;
    try { paintAct(); } catch (e) {}
    try { paintTabs(); } catch (e) {}
    try { paintGut(); } catch (e) {}
    try { paintStatus(); } catch (e) {}
  }
  function soon() {
    if (!on) return;
    clearTimeout(deb);
    deb = setTimeout(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(refresh); }, 60);
  }
  function watch(el, opt) {
    if (!el) return;
    var m = new MutationObserver(soon);
    m.observe(el, opt);
    obs.push(m);
  }
  function wire() {
    obs.forEach(function (o) { o.disconnect(); });
    obs = [];
    var sub = { childList: true, subtree: true, characterData: true };
    ['#widgets-grid', '#dash-exam-slot', '#dash-courses', '#dash-levels-section'].forEach(function (s) { watch(qs(s), sub); });
    watch(side(), { attributes: true, subtree: true, attributeFilter: ['class'] });
    watch(R, { attributes: true, attributeFilter: ['class', 'lang'] });
    watch(qs('#sync-header-btn'), { attributes: true, subtree: true, attributeFilter: ['class'] });
    watch(D.body, { childList: true });
    var host = overview();
    if (host && window.ResizeObserver) {
      var ro = new ResizeObserver(soon);
      ro.observe(host);
      obs.push(ro);
    }
  }
  function onLang() { lastGut = ''; if (act) act.removeAttribute('data-h'); if (tabs) tabs.removeAttribute('data-h'); refresh(); }
  function onStorage() { soon(); }

  function mount() {
    if (on) return;
    on = true;
    refresh();
    wire();
    [250, 900, 2200, 4500].forEach(function (ms) { timers.push(setTimeout(function () { wire(); refresh(); }, ms)); });
    timers.push(setInterval(refresh, 60000));
    D.addEventListener('garden:languageChanged', onLang);
    window.addEventListener('storage', onStorage);
    window.addEventListener('resize', soon);
    try { if (D.fonts && D.fonts.ready) D.fonts.ready.then(soon); } catch (e) {}
  }
  function unmount() {
    if (!on) return;
    on = false;
    timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    timers = [];
    clearTimeout(deb);
    cancelAnimationFrame(raf);
    obs.forEach(function (o) { o.disconnect(); });
    obs = [];
    D.removeEventListener('garden:languageChanged', onLang);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('resize', soon);
    if (cured) cured.removeAttribute('data-ed-cur');
    cured = null;
    els.slice().forEach(drop);
    els = [];
    R.classList.remove('ed-has-act');
    status = act = tabs = crumbs = gut = probs = null;
    lastGut = '';
  }
  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.editor = { mount: mount, unmount: unmount };
})();
