;(function () {
  'use strict';

  var sc = document.currentScript;
  var SRC = (sc && sc.src) || '';
  var ROOT = SRC ? SRC.replace(/shared\/support-note\.js(\?.*)?$/, '') : '';
  var VER = (SRC.match(/[?&]v=([0-9][0-9.]*)/) || [])[1] || '';

  var LS = 'garden_support_note';
  var VISITS_LS = 'garden_module_visits';

  var MIN_DAYS = 3;
  var DAY = 24 * 3600 * 1000;

  var LINKS = {
    group: 'https://groups.google.com/g/digital_garden',
    form: 'https://forms.gle/ejxPHYZz875AmDLUA',
    x: 'https://x.com/FahadS024',
    chat: 'https://t.me/Computing_and_Informatics',
    archive: 'https://t.me/computingg'
  };

  var dlg = null;
  var armed = false;
  var outside = 0;
  var OUT_MAX = 2;

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }

  function readJSON(k, d) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }
    catch (e) { return d; }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }

  function state() {
    var s = readJSON(LS, null);
    return (s && typeof s === 'object') ? s : {};
  }
  function seal() {
    var s = state();
    s.seen = 1;
    s.at = Date.now();
    writeJSON(LS, s);
  }

  /*@3.SUNJ.1*/
  function stampFirstSeen() {
    var s = state();
    if (s.t0) return s.t0;
    s.t0 = oldestTrace() || Date.now();
    writeJSON(LS, s);
    return s.t0;
  }

  function moduleVisits() {
    var m = readJSON(VISITS_LS, null);
    if (!m || typeof m !== 'object') return 0;
    var n = 0;
    Object.keys(m).forEach(function (k) {
      var v = m[k];
      if (v && typeof v === 'object') n += (parseInt(v.n, 10) || 0);
      else n += (parseInt(v, 10) || 0);
    });
    return n;
  }

  function oldestTrace() {
    var oldest = 0;
    function take(t) {
      t = Number(t);
      if (!(t > 1500000000000) || t > Date.now() + DAY) return;
      if (!oldest || t < oldest) oldest = t;
    }
    var m = readJSON(VISITS_LS, null);
    if (m && typeof m === 'object') {
      Object.keys(m).forEach(function (k) {
        var v = m[k];
        if (v && typeof v === 'object') take(v.d);
      });
    }
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        if (k.indexOf('__syncT_') === 0 || k.indexOf('garden_unit_slots_t0_') === 0) take(localStorage.getItem(k));
      }
    } catch (e) {}
    return oldest;
  }

  /*@3.SUNJ.2*/
  function surfaceBusy() {
    try {
      var open = document.querySelector('dialog[open]');
      return !!(open && open !== dlg);
    } catch (e) { return false; }
  }

  function why() {
    var s = state();
    if (s.seen) return { show: false, why: 'أُخفيت من قبل (seen)', at: s.at || null };
    var t0 = stampFirstSeen();
    var days = t0 ? (Date.now() - t0) / DAY : 0;
    if (!t0 || days < MIN_DAYS) {
      return { show: false, why: 'لم تمضِ ' + MIN_DAYS + ' أيّام', days: +days.toFixed(2),
               t0: t0, from: new Date(t0).toISOString().slice(0, 10), oldestTrace: oldestTrace() || null };
    }
    if (surfaceBusy()) return { show: false, why: 'نافذةٌ أخرى مفتوحةٌ الآن — تُعرض في الفتحة التالية' };
    return { show: true, why: 'تُعرض', days: +days.toFixed(2),
             from: new Date(t0).toISOString().slice(0, 10), visits: moduleVisits() };
  }

  function shouldShow() { return why().show; }

  function needCss(href) {
    var have = [].slice.call(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(function (l) { return (l.getAttribute('href') || '').indexOf(href) >= 0; });
    if (have) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = ROOT + href + (VER && href.indexOf('support-note') >= 0 ? '?v=' + VER : '');
    document.head.appendChild(l);
  }

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }
  function bi(n, ar, en) {
    n.setAttribute('data-ar', ar);
    n.setAttribute('data-en', en);
    n.textContent = L(ar, en);
    return n;
  }
  function icon(name) {
    var i = document.createElement('i');
    i.className = name;
    i.setAttribute('aria-hidden', 'true');
    return i;
  }

  var CHANNELS = [
    {
      href: LINKS.group, ic: 'fa-solid fa-comments',
      nAr: 'مجموعة قوقل', nEn: 'Google group',
      dAr: 'مجتمعُ الموقع — تُقرأ البلاغاتُ وتُناقش',
      dEn: 'The site’s community — reports are read and discussed'
    },
    {
      href: LINKS.form, ic: 'fa-solid fa-clipboard-list',
      nAr: 'نموذجُ البلاغات', nEn: 'Report form',
      dAr: 'أسرعُ طريقةٍ منظَّمة — تصلني مباشرة',
      dEn: 'The quickest structured way — straight to me'
    },
    {
      href: LINKS.x, ic: 'fa-brands fa-x-twitter', at: '@FahadS024',
      nAr: 'حسابي في إكس', nEn: 'Me on X',
      dAr: 'للضرورة — تواصلٌ مباشرٌ معي',
      dEn: 'When it matters — talk to me directly'
    }
  ];

  function channel(c) {
    var a = el('a', 'gsn-ch');
    a.href = c.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    var ic = el('span', 'gsn-ch-ic');
    ic.appendChild(icon(c.ic));
    a.appendChild(ic);

    var t = el('span', 'gsn-ch-t');
    var n = el('span', 'gsn-ch-n');
    n.appendChild(bi(el('span'), c.nAr, c.nEn));
    if (c.at) {
      n.appendChild(document.createTextNode(' '));
      var at = el('span', 'gsn-at');
      at.textContent = c.at;
      n.appendChild(at);
    }
    t.appendChild(n);
    t.appendChild(bi(el('span', 'gsn-ch-d'), c.dAr, c.dEn));
    a.appendChild(t);

    var go = el('span', 'gsn-ch-go');
    go.appendChild(icon('fa-solid fa-arrow-up-right-from-square'));
    a.appendChild(go);

    a.setAttribute('aria-label', L(c.nAr + ' — ' + c.dAr, c.nEn + ' — ' + c.dEn));
    a.setAttribute('data-ar-title', c.dAr);
    a.setAttribute('data-en-title', c.dEn);

    /*@3.SUNJ.3*/
    a.addEventListener('click', function () { seal(); armed = true; });
    return a;
  }

  function build() {
    if (dlg) return dlg;
    needCss('shared/surface.css');
    needCss('shared/support-note.css');

    dlg = el('dialog', 'gsf gsn');
    /*@3.SUNJ.4*/
    dlg.setAttribute('data-keep-open', '');
    dlg.setAttribute('aria-labelledby', 'gsn-title');

    var grip = el('div', 'gsf-grip');
    grip.setAttribute('aria-hidden', 'true');
    dlg.appendChild(grip);

    var body = el('div', 'gsf-body');

    var head = el('div', 'gsf-head gsn-hd');
    var ic = el('span', 'gsn-ic');
    ic.appendChild(icon('fa-solid fa-seedling'));
    head.appendChild(ic);

    var ht = el('div', 'gsn-hd-t');
    var h = bi(el('h2', 'gsf-title'), 'الحديقةُ ما زالت تُبنى', 'The Garden is still being built');
    h.id = 'gsn-title';
    ht.appendChild(h);
    ht.appendChild(bi(el('p', 'gsf-sub'),
      'قد تصادف خللاً أو نقصاً — وهذا متوقَّع. أيُّ مشكلةٍ في الموقع أو ميزةٍ تتمنّاها، أوصِلها إليّ من هنا:',
      'You may hit a glitch or find something missing — that is expected. For any problem with the site, or a feature you would like, reach me here:'));
    head.appendChild(ht);
    body.appendChild(head);

    var chs = el('div', 'gsn-chs');
    CHANNELS.forEach(function (c) { chs.appendChild(channel(c)); });
    body.appendChild(chs);

    var aside = el('div', 'gsn-aside');
    aside.appendChild(icon('fa-brands fa-telegram'));
    var ap = el('p');
    ap.setAttribute('data-gsn-aside', '');
    asideText(ap);
    aside.appendChild(ap);
    body.appendChild(aside);

    dlg.appendChild(body);

    var foot = el('div', 'gsf-foot');
    var hint = el('span', 'gsn-hint');
    hint.setAttribute('data-gsn-hint', '');
    hintText(hint);
    foot.appendChild(hint);

    var btn = bi(el('button', 'gsf-btn'), 'أخفِ هذه الرسالة', 'Hide this message');
    btn.type = 'button';
    btn.addEventListener('click', function () { dismiss(); });
    foot.appendChild(btn);

    dlg.appendChild(foot);
    document.body.appendChild(dlg);

    /*@3.SUNJ.5*/
    dlg.addEventListener('cancel', function (ev) {
      ev.preventDefault();
      dismiss();
    });

    dlg.addEventListener('click', function (ev) {
      if (ev.target !== dlg) return;
      outside++;
      if (outside >= OUT_MAX) { dismiss(); return; }
      var b = dlg.querySelector('.gsf-foot .gsf-btn');
      if (!b) return;
      b.classList.remove('gsn-nudge');
      void b.offsetWidth;
      b.classList.add('gsn-nudge');
    });

    return dlg;
  }

  /*@3.SUNJ.7*/
  function asideText(p) {
    var ar = 'أمّا أسئلةُ الكلية والمواد فمكانُها قروبُ <b>الحوسبة والمعلوماتية</b> و<b>الأرشيف</b> في تليجرام — زملائي هناك أسرعُ في إفادتك.';
    var en = 'For college and course questions, the <b>Computing &amp; Informatics</b> group and its <b>Archive</b> on Telegram serve you better — my peers there answer faster.';
    p.innerHTML = isAr() ? ar : en;
  }
  function hintText(s) {
    var ar = 'تجد هذه الروابطَ دائماً في <b>الإعدادات</b>.';
    var en = 'These links always live in <b>Settings</b>.';
    s.innerHTML = isAr() ? ar : en;
  }

  function dismiss() {
    seal();
    armed = false;
    try { if (dlg && dlg.open) dlg.close(); } catch (e) {}
  }

  function open() {
    build();
    outside = 0;
    try { if (window.Garden && Garden.localize) Garden.localize(dlg); } catch (e) {}
    try { asideText(dlg.querySelector('[data-gsn-aside]')); } catch (e) {}
    try { hintText(dlg.querySelector('[data-gsn-hint]')); } catch (e) {}
    try { dlg.showModal(); } catch (e) { try { dlg.show(); } catch (e2) {} }
  }

  /*@3.SUNJ.6*/
  document.addEventListener('visibilitychange', function () {
    if (!armed || document.visibilityState !== 'visible') return;
    armed = false;
    try { if (dlg && dlg.open) dlg.close(); } catch (e) {}
  });

  document.addEventListener('garden:languageChanged', function () {
    if (!dlg) return;
    try { asideText(dlg.querySelector('[data-gsn-aside]')); } catch (e) {}
    try { hintText(dlg.querySelector('[data-gsn-hint]')); } catch (e) {}
  });

  function boot() {
    if (!shouldShow()) return;
    var go = function () { if (shouldShow()) open(); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2500 });
    else setTimeout(go, 1200);
  }

  if (document.readyState === 'complete') setTimeout(boot, 600);
  else window.addEventListener('load', function () { setTimeout(boot, 600); });

  window.GardenSupportNote = {
    show: function () { open(); },
    dismiss: dismiss,
    links: LINKS,
    state: state,
    shouldShow: shouldShow,
    why: why,
    reset: function () { try { localStorage.removeItem(LS); } catch (e) {} return why(); },
    test: function () { open(); return 'عُرضت — ولم تُختم'; },
    age: function (days) {
      var d = (days == null ? MIN_DAYS + 1 : Number(days));
      writeJSON(LS, { t0: Date.now() - d * DAY });
      return why();
    }
  };
})();
