/*@3.MOTJ.1*/

;(function () {
  'use strict';

  var PREFS = 'dashboard_prefs';

  /*@3.MOTJ.2*/
  var THEMES = [
    { id: 'garden',  base: null,    star: 1, ar: 'مظهرُ الموقع', en: 'Site look' },

    { id: 'paper',   base: 'light', star: 1, ar: 'ورقٌ دافئ',            en: 'Warm Paper' },
    { id: 'github',  base: 'light', star: 1, ar: 'جِت‑هَب نهاريّ',       en: 'GitHub Light' },
    { id: 'latte',   base: 'light', star: 1, ar: 'كابتشينو نهاريّ',      en: 'Catppuccin Latte' },
    { id: 'solar',   base: 'light',          ar: 'سولارايزد نهاريّ',     en: 'Solarized Light' },
    { id: 'everlight', base: 'light',        ar: 'غابةٌ نهاريّة',        en: 'Everforest Light' },

    { id: 'mocha',   base: 'dark',  star: 1, ar: 'كابتشينو داكن',        en: 'Catppuccin Mocha' },
    { id: 'onedark', base: 'dark',  star: 1, ar: 'ون دارك',              en: 'One Dark' },
    { id: 'dracula', base: 'dark',           ar: 'دراكولا',              en: 'Dracula' },
    { id: 'nord',    base: 'dark',           ar: 'نورد',                 en: 'Nord' },
    { id: 'gruvbox', base: 'dark',           ar: 'جروف‑بوكس',            en: 'Gruvbox Dark' },
    { id: 'rosepine', base: 'dark',          ar: 'صنوبرٌ ورديّ',         en: 'Rosé Pine' },
    { id: 'everforest', base: 'dark',        ar: 'غابةٌ دائمة',          en: 'Everforest Dark' },

    { id: 'tokyo',   base: 'dim',   star: 1, ar: 'طوكيو ليلاً',          en: 'Tokyo Night' },
    { id: 'oled',    base: 'dim',            ar: 'أسودُ خالص',           en: 'True Black (OLED)' },
    { id: 'nightowl', base: 'dim',           ar: 'بومةُ الليل',          en: 'Night Owl' },
    { id: 'ayu',     base: 'dim',            ar: 'آيو داكن',             en: 'Ayu Dark' },
    { id: 'carbon',  base: 'dim',            ar: 'كربون',                en: 'Carbon' },
    { id: 'amber',   base: 'dim',            ar: 'كهرمانيّ',             en: 'Amber Night' }
  ];

  /*@3.MOTJ.3*/
  var FAMILY = {
    light: { ar: 'نهاريّة · ترث ثيمَنا النهاريّ', en: 'Light · inherit our light theme' },
    dark:  { ar: 'داكنة · ترث ثيمَنا الداكن',     en: 'Dark · inherit our dark theme' },
    dim:   { ar: 'ليليّة · ترث ثيمَنا الليليّ',   en: 'Night · inherit our night theme' }
  };

  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(ar, en) { return isAr() ? ar : en; }

  function prefs() {
    try {
      var p = JSON.parse(localStorage.getItem(PREFS) || 'null');
      return (p && typeof p === 'object') ? p : {};
    } catch (e) { return {}; }
  }
  /*@3.MOTJ.31*/
  var _scope = null;
  function onCourse() { return document.documentElement.hasAttribute('data-subject'); }
  function scope() { return _scope || (onCourse() ? 'module' : 'site'); }
  function baseOf(id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i].base; return null; }

  function current(sc) {
    sc = sc || scope();
    var v = prefs()[sc === 'site' ? 'siteTheme' : 'moduleTheme'];
    if (typeof v !== 'string' || !v || !baseOf(v)) return 'garden';
    /*@3.MOTJ.32*/
    return sc === 'site' && baseOf(v) !== siteTheme() ? 'garden' : v;
  }

  /*@3.MOTJ.4*/
  function choose(id, sc) {
    sc = sc || scope();
    if (sc === 'site') {
      if (window.GardenTint && GardenTint.setSiteTheme) GardenTint.setSiteTheme(id === 'garden' ? '' : id);
      try {
        document.dispatchEvent(new CustomEvent('garden:moduleThemeChanged', { detail: { theme: current('site'), scope: 'site' } }));
      } catch (e) {}
      return;
    }
    /*@3.MOTJ.5*/
    if (!id || id === 'garden') {
      if (window.GardenTint && GardenTint.clearTheme) GardenTint.clearTheme('module');
      try {
        document.dispatchEvent(new CustomEvent('garden:moduleThemeChanged', { detail: { theme: 'garden' } }));
      } catch (e) {}
      return;
    }
    var p = prefs();
    p.moduleTheme = id;
    try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch (e) {}
    if (window.GardenTint && GardenTint.applyTheme) GardenTint.applyTheme();
    try {
      document.dispatchEvent(new CustomEvent('garden:moduleThemeChanged', { detail: { theme: current() } }));
    } catch (e) {}
  }

  /*@3.MOTJ.11*/
  var FONTS = [
    { id: 'garden',   css: null,                   star: 1, ar: 'خطُّ الموقع (القاهرة)', en: 'Site font (Cairo)' },
    /*@3.MOTJ.27*/
    { id: 'thmanyah', css: 'Thmanyah Sans',         star: 1, ar: 'ثمانية',        en: 'Thmanyah Sans' },
    { id: 'frutiger', css: 'Frutiger LT Arabic',    star: 1, ar: 'فروتيجر',       en: 'Frutiger' },
    { id: 'plex',     css: 'IBM Plex Sans Arabic', star: 1, ar: 'بلكس عربي',    en: 'IBM Plex Sans Arabic' },
    { id: 'readex',   css: 'Readex Pro',           star: 1, ar: 'ريدكس برو',    en: 'Readex Pro' },
    { id: 'notosans', css: 'Noto Sans Arabic',     star: 1, ar: 'نوتو سانس',    en: 'Noto Sans Arabic' },
    { id: 'amiri',    css: 'Amiri',                star: 1, ar: 'أميري',        en: 'Amiri' },
    { id: 'naskh',    css: 'Noto Naskh Arabic',             ar: 'نسخ',          en: 'Noto Naskh Arabic' },
    { id: 'tajawal',  css: 'Tajawal',                       ar: 'تجوّل',         en: 'Tajawal' },
    { id: 'almarai',  css: 'Almarai',                       ar: 'المراعي',      en: 'Almarai' },
    { id: 'alexandria', css: 'Alexandria',                  ar: 'الإسكندريّة',  en: 'Alexandria' },
    { id: 'vazir',    css: 'Vazirmatn',                     ar: 'وزيرمتن',      en: 'Vazirmatn' },
    { id: 'messiri',  css: 'El Messiri',                    ar: 'المسيري',      en: 'El Messiri' },
    { id: 'kufi',     css: 'Noto Kufi Arabic',              ar: 'نوتو كوفي',    en: 'Noto Kufi Arabic' },
    { id: 'zain',     css: 'Zain',                          ar: 'زين',          en: 'Zain' },
    { id: 'rubik',    css: 'Rubik',                         ar: 'روبيك',        en: 'Rubik' },
    { id: 'thmanyahserif', css: 'Thmanyah Serif Text',      ar: 'ثمانية سيريف', en: 'Thmanyah Serif Text' }
  ];

  /*@3.MOTJ.16*/
  var FONTS_LAT = [
    { id: 'garden',      css: null,                    star: 1, ar: 'خطُّ الموقع (إنتر)', en: 'Site font (Inter)' },
    { id: 'sourceserif', css: 'Source Serif 4',        star: 1, ar: 'سورس سيريف',  en: 'Source Serif 4' },
    { id: 'newsreader',  css: 'Newsreader',            star: 1, ar: 'نيوزريدر',    en: 'Newsreader' },
    { id: 'literata',    css: 'Literata',              star: 1, ar: 'ليتيراتا',    en: 'Literata' },
    { id: 'atkinson',    css: 'Atkinson Hyperlegible', star: 1, ar: 'أتكِنسون',    en: 'Atkinson Hyperlegible' },
    { id: 'merriweather', css: 'Merriweather',                  ar: 'ميريويذر',    en: 'Merriweather' },
    { id: 'lora',        css: 'Lora',                           ar: 'لورا',        en: 'Lora' },
    { id: 'garamond',    css: 'EB Garamond',                    ar: 'غارامون',     en: 'EB Garamond' },
    { id: 'spectral',    css: 'Spectral',                       ar: 'سبكترال',     en: 'Spectral' },
    { id: 'fraunces',    css: 'Fraunces',                       ar: 'فرونسيس',     en: 'Fraunces' },
    { id: 'plexsans',    css: 'IBM Plex Sans',                  ar: 'بلكس سانس',   en: 'IBM Plex Sans' },
    { id: 'sourcesans',  css: 'Source Sans 3',                  ar: 'سورس سانس',   en: 'Source Sans 3' },
    { id: 'geist',       css: 'Geist',                          ar: 'غايست',       en: 'Geist' }
  ];

  function fontKey(kind, sc) {
    return ((sc || scope()) === 'site' ? 'site' : 'module') + ((kind ? kind === 'ar' : isAr()) ? 'Font' : 'FontLat');
  }

  function currentFont(kind, sc) {
    var v = prefs()[fontKey(kind, sc)];
    return (typeof v === 'string' && v) ? v : 'garden';
  }

  function chooseFont(id, kind, sc) {
    kind = kind || (isAr() ? 'ar' : 'lat');
    sc = sc || scope();
    if (!id || id === 'garden') {
      if (window.GardenTint && GardenTint.clearFont) GardenTint.clearFont(kind, sc);
      return;
    }
    var p = prefs();
    p[fontKey(kind, sc)] = id;
    try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch (e) {}
    if (window.GardenTint && GardenTint.applyFont) GardenTint.applyFont();
  }

  /*@3.MOTJ.18*/
  var _base = (function () {
    var sc = document.currentScript;
    return (sc && sc.src) ? sc.src.replace(/shared\/module-theme\.js(\?.*)?$/, '') : '';
  })();
  function surfaceSheet() {
    if (document.querySelector('link[data-garden-surface], link[href*="surface.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = _base + 'shared/surface.css';
    l.setAttribute('data-garden-surface', '');
    document.head.appendChild(l);
  }

  var _dlg = null, _opener = null;

  function close() {
    if (!_dlg) return;
    var d = _dlg;
    _dlg = null;
    try { d.close(); } catch (e) {}
    if (d.parentNode) d.parentNode.removeChild(d);
    if (_opener) { try { _opener.focus(); } catch (e) {} }
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  /*@3.MOTJ.29*/
  var DESIGNS = [
    { id: 'garden',   ar: 'Garden',    en: 'Garden',        note: ['التنسيقُ الأساسيّ', 'The core layout'] },
    { id: 'lamp',     ar: 'المصباح',   en: 'Lamp',          note: ['ركّزْ على مفهومٍ واحدٍ فقط', 'Focus on one concept only'] },
    { id: 'herbal',   ar: 'عشبي',      en: 'Herbal',        note: ['حديقتُك تنمو مع كلِّ مفهومٍ تقرؤه', 'Your garden grows with every concept you read'] },
    { id: 'cornell',  ar: 'كورنيل',    en: 'Cornell',       note: ['عمودُ إشاراتٍ وملاحظات', 'Cue column + notes'] },
    { id: 'journey',  ar: 'الرحلة',    en: 'Journey',       note: ['تقدّمٌ ووقتٌ تراه', 'Progress and time you can see'] },
    { id: 'recall',   ar: 'الاستذكار', en: 'Recall',        note: ['سؤالٌ قبل القراءة وتذكّرٌ بعدها', 'Question first, recall after'] },
    { id: 'words',    ar: 'بكلماتك',   en: 'In your words', note: ['اشرحه كما فهمته، ثمّ قارِنْ', 'Explain it as you understood it, then compare'] },
    { id: 'summary',  ar: 'الخلاصة',   en: 'Summary',       note: ['كلُّ المفاهيم في ورقة', 'Every concept on one sheet'] },
    { id: 'practice', ar: 'تمرين',     en: 'Practice',      note: ['أسئلةٌ بعد كلِّ مفهوم', 'Questions after each concept'] }
  ];

  var MINI = {
    garden: '<i class="mm-card mm-r12 mm-sh"><b class="mm-sq"></b><u class="mm-l mm-w60"></u><u class="mm-l mm-w80"></u><u class="mm-l mm-w70"></u></i>',
    lamp: '<i class="mm-room"><i class="mm-card mm-lit"><u class="mm-l mm-w60 mm-ink"></u><u class="mm-l mm-w80 mm-ink"></u><u class="mm-l mm-w70 mm-ink"></u></i><i class="mm-card mm-dim"><u class="mm-l mm-w70"></u></i></i>',
    herbal: '<i class="mm-card mm-r3"><b class="mm-stamp"></b><u class="mm-l mm-w60"></u><u class="mm-l mm-w80"></u></i><i class="mm-vine"><b></b><b></b><b class="mm-bud"></b><b class="mm-ghost"></b></i>',
    cornell: '<i class="mm-card mm-r6 mm-cornell"><i class="mm-cue"><b class="mm-num"></b><u class="mm-l mm-w80"></u></i><i class="mm-notes"><u class="mm-l mm-w80"></u><u class="mm-l mm-w90"></u><u class="mm-l mm-w70"></u></i></i>',
    journey: '<i class="mm-card mm-r12 mm-jr"><i class="mm-jbar"><b class="mm-d"></b><b class="mm-d"></b><b class="mm-cur"></b><b></b><b></b></i><u class="mm-l mm-w60"></u><u class="mm-l mm-w80"></u><i class="mm-jnext"></i></i>',
    recall: '<i class="mm-card mm-r12 mm-rc"><i class="mm-q"><u class="mm-l mm-w70 mm-ink"></u></i><u class="mm-l mm-w80 mm-blur"></u><u class="mm-l mm-w60 mm-blur"></u><i class="mm-rate"><b class="mm-t1"></b><b class="mm-t3"></b><b class="mm-t5"></b></i></i>',
    words: '<i class="mm-card mm-r12 mm-ow"><u class="mm-l mm-w80"></u><u class="mm-l mm-w60"></u><i class="mm-wbox"><u class="mm-l mm-w70 mm-ink"></u><b class="mm-caret"></b></i></i>',
    summary: '<i class="mm-shg"><i class="mm-card mm-r6"><u class="mm-l mm-w60 mm-ink"></u><u class="mm-l mm-w90"></u></i><i class="mm-card mm-r6"><u class="mm-l mm-w60 mm-ink"></u><u class="mm-l mm-w80"></u></i><i class="mm-card mm-r6"><u class="mm-l mm-w60 mm-ink"></u><u class="mm-l mm-w70"></u></i><i class="mm-card mm-r6"><u class="mm-l mm-w60 mm-ink"></u><u class="mm-l mm-w90"></u></i></i>',
    practice: '<i class="mm-card mm-r12 mm-prm"><u class="mm-l mm-w70"></u><i class="mm-q"><u class="mm-l mm-w70 mm-ink"></u><i class="mm-g"><b class="mm-t1"></b><b class="mm-t5"></b></i></i><i class="mm-q mm-back"><u class="mm-l mm-w60"></u></i></i>'
  };

  var SITE = [
    { id: 'dark', ar: 'داكن', en: 'Dark' },
    { id: 'dim', ar: 'خافت', en: 'Dim' },
    { id: 'light', ar: 'فاتح', en: 'Light' }
  ];

  function curDesign() { return (window.GardenTint && GardenTint.design) ? GardenTint.design() : 'garden'; }
  function chooseDesign(id) {
    if (window.GardenTint && GardenTint.setDesign) GardenTint.setDesign(id === 'garden' ? '' : id);
  }
  function siteTheme() {
    try { return localStorage.getItem('garden_theme') || 'dark'; } catch (e) { return 'dark'; }
  }
  function chooseSite(t) {
    if (window.GardenTint && GardenTint.setSiteTheme) GardenTint.setSiteTheme('');
    /*@3.MOTJ.33*/
    if (document.documentElement.getAttribute('data-mod-scope') === 'module') {
      try { localStorage.setItem('garden_theme', t); } catch (e) {}
    } else if (window.Garden && Garden.applyTheme) Garden.applyTheme(t);
    else {
      try { localStorage.setItem('garden_theme', t); } catch (e) {}
      document.documentElement.setAttribute('data-theme', t);
    }
    try {
      document.dispatchEvent(new CustomEvent('garden:moduleThemeChanged', { detail: { theme: 'garden', scope: 'site' } }));
    } catch (e) {}
  }

  /*@3.MOTJ.15*/
  var _siteCols = {};
  function siteCols(t) {
    var root = document.documentElement;
    /*@3.MOTJ.6*/
    var key = t + '|' + (root.getAttribute('data-tinted') || '');
    if (_siteCols[key]) return _siteCols[key];
    /*@3.MOTJ.7*/
    var hadSkin = root.getAttribute('data-mod-theme'), hadBase = root.getAttribute('data-theme');
    root.removeAttribute('data-mod-theme');
    root.setAttribute('data-theme', t);
    var cs = getComputedStyle(root), g = function (k) { return cs.getPropertyValue(k).trim(); };
    var c = {
      bg: g('--bg-body'), panel: g('--bg-card'), fg: g('--text-primary'),
      bars: ['--syn-keyword', '--syn-string', '--syn-function', '--syn-type'].map(g)
    };
    if (hadSkin) root.setAttribute('data-mod-theme', hadSkin);
    if (hadBase) root.setAttribute('data-theme', hadBase); else root.removeAttribute('data-theme');
    return (_siteCols[key] = c);
  }

  function designSection() {
    var sec = el('section', 'mt-sec mt-sec--design');
    var h = el('h3', 'gsf-card-h');
    h.appendChild(el('i', 'fa-solid fa-table-columns'));
    h.appendChild(el('span', null, L('التصميم', 'Design')));
    var sub = el('small', 'mt-hnote');
    h.appendChild(sub);
    sec.appendChild(h);
    var grid = el('div', 'mt-dgrid');
    sec.appendChild(grid);
    var tiles = [];
    DESIGNS.forEach(function (d) {
      var b = el('button', 'mt-dtile');
      b.type = 'button';
      b.setAttribute('role', 'menuitemradio');
      var pv = el('span', 'mt-pv');
      pv.setAttribute('aria-hidden', 'true');
      pv.innerHTML = MINI[d.id];
      b.appendChild(pv);
      b.appendChild(el('b', 'mt-dname', L(d.ar, d.en)));
      b.appendChild(el('span', 'mt-dnote', L(d.note[0], d.note[1])));
      b.addEventListener('click', function () { chooseDesign(d.id); mark(); });
      b.__id = d.id;
      tiles.push(b);
      grid.appendChild(b);
    });
    function mark() {
      var cur = curDesign(), on = null;
      tiles.forEach(function (b) {
        var is = b.__id === cur;
        b.classList.toggle('is-on', is);
        b.setAttribute('aria-checked', is ? 'true' : 'false');
        if (is) on = b;
      });
      var d = DESIGNS.filter(function (x) { return x.id === cur; })[0] || DESIGNS[0];
      sub.textContent = '· ' + L(d.note[0], d.note[1]);
    }
    mark();
    sec.__mark = mark;
    return sec;
  }

  function themeSection() {
    var sec = el('section', 'mt-sec');
    var h = el('h3', 'gsf-card-h');
    h.appendChild(el('i', 'fa-solid fa-swatchbook'));
    h.appendChild(el('span', null, L('الألوان', 'Colours')));
    sec.appendChild(h);

    var grid = el('div', 'mt-grid');
    sec.appendChild(grid);
    var tiles = [];

    function prev() {
      var p = el('span', 'mt-prev');
      p.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 4; i++) p.appendChild(document.createElement('i'));
      return p;
    }
    function tile(cls, name, onPick, id) {
      var b = el('button', 'mt-tile' + (cls ? ' ' + cls : ''));
      b.type = 'button';
      b.setAttribute('role', 'menuitemradio');
      b.appendChild(prev());
      var nm = el('span', 'mt-tname');
      nm.appendChild(el('span', null, name));
      b.appendChild(nm);
      b.addEventListener('click', function () { onPick(); mark(); });
      b.__id = id;
      tiles.push(b);
      grid.appendChild(b);
      return b;
    }

    var sc = scope();
    function paintSite(b, t) {
      var c = siteCols(t), p = b.querySelector('.mt-prev'), bars = p.children;
      p.style.background = c.panel;
      for (var i = 0; i < bars.length; i++) bars[i].style.background = c.bars[i] || 'currentColor';
    }
    if (sc === 'site') {
      grid.appendChild(el('div', 'mt-fam', L('ألوانُ الموقع الأصليّة', 'Original site colours')));
      SITE.forEach(function (s) {
        paintSite(tile('', L(s.ar, s.en), function () { chooseSite(s.id); }, 'site:' + s.id), s.id);
      });
    } else {
      /*@3.MOTJ.34*/
      var sp = current('site');
      var fb = tile(sp !== 'garden' ? 'mt-pal-' + sp : '', L('كالموقع', 'Same as site'), function () { choose('garden', 'module'); }, 'follow');
      if (sp === 'garden') paintSite(fb, siteTheme());
    }

    var group = null;
    THEMES.forEach(function (th) {
      if (!th.base) return;
      /*@3.MOTJ.8*/
      if (th.base !== group) {
        group = th.base;
        grid.appendChild(el('div', 'mt-fam', L(FAMILY[group].ar, FAMILY[group].en)));
      }
      tile('mt-pal-' + th.id, isAr() ? th.ar : th.en, function () { choose(th.id, sc); }, th.id);
    });

    function mark() {
      var cur = current(sc), st = siteTheme();
      tiles.forEach(function (b) {
        var none = sc === 'site' ? b.__id === 'site:' + st : b.__id === 'follow';
        var on = cur === 'garden' ? none : b.__id === cur;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    mark();
    sec.__mark = mark;
    return sec;
  }

  /*@3.MOTJ.30*/
  var _fontKind = null;
  function fontSection() {
    /*@3.MOTJ.13*/
    if (window.GardenTint && GardenTint.fontSheet) GardenTint.fontSheet();
    if (!_fontKind) _fontKind = isAr() ? 'ar' : 'lat';
    var sec = el('section', 'mt-sec');
    var h = el('h3', 'gsf-card-h');
    h.appendChild(el('i', 'fa-solid fa-font'));
    h.appendChild(el('span', null, L('خطُّ القراءة', 'Reading font')));
    var seg = el('span', 'mt-seg');
    seg.setAttribute('role', 'group');
    [['ar', 'عربي', 'Arabic'], ['lat', 'لاتيني', 'Latin']].forEach(function (k) {
      var b = el('button', null, L(k[1], k[2]));
      b.type = 'button';
      b.__k = k[0];
      b.addEventListener('click', function () { _fontKind = k[0]; paint(); });
      seg.appendChild(b);
    });
    h.appendChild(seg);
    sec.appendChild(h);

    var grid = el('div', 'mt-fgrid');
    sec.appendChild(grid);
    var rows = [];

    function paint() {
      Array.prototype.forEach.call(seg.children, function (b) {
        b.setAttribute('aria-pressed', b.__k === _fontKind ? 'true' : 'false');
      });
      grid.textContent = '';
      rows = [];
      var ar = _fontKind === 'ar';
      (ar ? FONTS : FONTS_LAT).forEach(function (fo) {
        var b = el('button', 'mt-ftile');
        b.type = 'button';
        b.setAttribute('role', 'menuitemradio');
        /*@3.MOTJ.14*/
        /*@3.MOTJ.17*/
        var gl = el('span', 'mt-glyph', ar ? 'أبجد' : 'Aa');
        gl.style.fontFamily = fo.css ? '"' + fo.css + '", sans-serif' : (ar ? '"Cairo", sans-serif' : '"Inter", sans-serif');
        b.appendChild(gl);
        b.appendChild(el('small', 'mt-fname', fo.id === 'garden'
          ? (scope() === 'site' ? L('خطُّ الموقع', 'Site font') : L('كالموقع', 'Same as site'))
          : (isAr() ? fo.ar : fo.en)));
        b.addEventListener('click', function () { chooseFont(fo.id, _fontKind); mark(); });
        b.__id = fo.id;
        rows.push(b);
        grid.appendChild(b);
      });
      mark();
    }
    function mark() {
      var cur = currentFont(_fontKind);
      rows.forEach(function (b) {
        var on = b.__id === cur;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    paint();
    sec.__mark = mark;
    return sec;
  }

  /*@3.MOTJ.9*/
  /*@3.MOTJ.35*/
  function needTint(cb) {
    if (window.GardenTint) { cb(); return; }
    var s = document.createElement('script');
    s.src = _base + 'shared/subject-tint.js';
    s.onload = s.onerror = function () { cb(); };
    document.head.appendChild(s);
  }

  function open(button, o) {
    if (_dlg) { close(); return; }
    o = o || {};
    if (!window.GardenTint) { needTint(function () { if (window.GardenTint) open(button, o); }); return; }
    _opener = button || null;
    _scope = (o.scope === 'site' || o.scope === 'module') ? o.scope : null;
    surfaceSheet();

    var d = document.createElement('dialog');
    d.className = 'gsf gsf--flat mt-dlg';
    d.setAttribute('aria-label', L('المظهر', 'Appearance'));

    d.appendChild(el('div', 'gsf-grip'));
    var x = el('form', 'gsf-x');
    x.method = 'dialog';
    var xb = el('button', 'gsf-close');
    xb.type = 'submit';
    xb.setAttribute('aria-label', L('إغلاق', 'Close'));
    xb.appendChild(el('i', 'fa-solid fa-xmark'));
    x.appendChild(xb);
    d.appendChild(x);

    var head = el('div', 'gsf-head');
    head.appendChild(el('h2', 'gsf-title', L('المظهر', 'Appearance')));
    /*@3.MOTJ.36*/
    var seg = el('div', 'mt-seg mt-seg--scope');
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', L('لأيِّ الصفحات', 'Which pages'));
    [['site', 'fa-house', 'الموقعُ كلُّه', 'Whole site'], ['module', 'fa-book-open-reader', 'صفحاتُ المواد', 'Course pages']].forEach(function (k) {
      var b = el('button');
      b.type = 'button';
      b.__k = k[0];
      b.appendChild(el('i', 'fa-solid ' + k[1]));
      b.appendChild(el('span', null, L(k[2], k[3])));
      b.addEventListener('click', function () { if (scope() !== k[0]) { _scope = k[0]; build(); } });
      seg.appendChild(b);
    });
    head.appendChild(seg);
    var sub = el('p', 'gsf-sub');
    head.appendChild(sub);
    d.appendChild(head);

    /*@3.MOTJ.12*/
    var body = el('div', 'gsf-body mt-body');
    d.appendChild(body);

    /*@3.MOTJ.23*/
    var foot = el('div', 'gsf-foot');
    var acts = el('div', 'gsf-acts');
    var reset = el('button', 'gsf-btn gsf-btn--ghost');
    reset.type = 'button';
    reset.appendChild(el('i', 'fa-solid fa-rotate-left'));
    var resetT = el('span');
    reset.appendChild(resetT);
    var secs = [];
    reset.addEventListener('click', function () {
      var sc = scope();
      if (sc === 'module') chooseDesign('garden');
      choose('garden', sc);
      chooseFont('garden', 'ar', sc);
      chooseFont('garden', 'lat', sc);
      secs.forEach(function (s) { s.__mark(); });
    });
    acts.appendChild(reset);
    foot.appendChild(acts);
    d.appendChild(foot);

    function build() {
      var sc = scope();
      Array.prototype.forEach.call(seg.children, function (b) {
        b.setAttribute('aria-pressed', b.__k === sc ? 'true' : 'false');
      });
      sub.textContent = sc === 'site'
        ? L('لكلِّ صفحات الموقع — يُطبَّق فوراً، والصفحةُ خلفك هي المعاينة.',
            'For every page of the site — applies at once; the page behind is the preview.')
        : (onCourse()
          ? L('لصفحات المواد والوحدات — وما لم تختره يتبع مظهرَ الموقع.',
              'For course and module pages — anything you leave follows the site look.')
          : L('لصفحات المواد والوحدات — تراه حين تفتح مادّة، وما لم تختره يتبع مظهرَ الموقع.',
              'For course and module pages — you’ll see it when you open a course; anything you leave follows the site look.'));
      resetT.textContent = sc === 'site' ? L('أعِدِ المظهرَ الأصليّ', 'Back to the original look') : L('أعِدْها كالموقع', 'Back to the site look');
      body.textContent = '';
      secs = sc === 'module' ? [designSection(), themeSection(), fontSection()] : [themeSection(), fontSection()];
      secs.forEach(function (s) { body.appendChild(s); });
    }
    build();

    document.body.appendChild(d);
    _dlg = d;
    d.addEventListener('close', close);
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
    var on = body.querySelector('.mt-dtile.is-on') || seg.querySelector('[aria-pressed="true"]');
    if (on && on.focus) try { on.focus({ preventScroll: true }); } catch (e) {}
  }

  window.GardenModuleTheme = {
    open: open, close: close, current: current, choose: choose, THEMES: THEMES,
    currentFont: currentFont, chooseFont: chooseFont, FONTS: FONTS, FONTS_LAT: FONTS_LAT,
    DESIGNS: DESIGNS, design: curDesign, chooseDesign: chooseDesign
  };
})();
