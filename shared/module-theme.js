/*@3.MOTJ.1*/

;(function () {
  'use strict';

  var PREFS = 'dashboard_prefs';

  /*@3.MOTJ.2*/
  var THEMES = [
    { id: 'garden',  base: null,    ar: 'الحديقة الرقمية (يتبع الموقع)', en: 'Digital Garden (follows the site)' },

    { id: 'paper',   base: 'light', ar: 'ورقٌ دافئ',            en: 'Warm Paper' },
    { id: 'github',  base: 'light', ar: 'جِت‑هَب نهاريّ',       en: 'GitHub Light' },
    { id: 'solar',   base: 'light', ar: 'سولارايزد نهاريّ',     en: 'Solarized Light' },

    { id: 'onedark', base: 'dark',  ar: 'ون دارك',              en: 'One Dark' },
    { id: 'dracula', base: 'dark',  ar: 'دراكولا',              en: 'Dracula' },
    { id: 'nord',    base: 'dark',  ar: 'نورد',                 en: 'Nord' },
    { id: 'gruvbox', base: 'dark',  ar: 'جروف‑بوكس',            en: 'Gruvbox Dark' },

    { id: 'oled',    base: 'dim',   ar: 'أسودُ خالص',           en: 'True Black (OLED)' },
    { id: 'tokyo',   base: 'dim',   ar: 'طوكيو ليلاً',          en: 'Tokyo Night' },
    { id: 'amber',   base: 'dim',   ar: 'كهرمانيّ',             en: 'Amber Night' }
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
  function current() {
    var v = prefs().moduleTheme;
    return (typeof v === 'string' && v) ? v : 'garden';
  }

  /*@3.MOTJ.4*/
  function choose(id) {
    /*@3.MOTJ.5*/
    if (!id || id === 'garden') {
      if (window.GardenTint && GardenTint.clearTheme) GardenTint.clearTheme();
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

  /*@3.MOTJ.6*/
  function palettes() {
    var root = document.documentElement;
    var hadSkin = root.getAttribute('data-mod-theme');
    var hadBase = root.getAttribute('data-theme');
    var out = {};
    THEMES.forEach(function (th) {
      var cs;
      if (th.id === 'garden') {
        /*@3.MOTJ.7*/
        root.removeAttribute('data-mod-theme');
        var site = 'dark';
        try { site = localStorage.getItem('garden_theme') || 'dark'; } catch (e) {}
        root.setAttribute('data-theme', site);
        cs = getComputedStyle(root);
        out[th.id] = {
          bg: cs.getPropertyValue('--bg-card').trim() || '#1f2937',
          bars: ['--syn-keyword', '--syn-string', '--syn-function'].map(function (k) {
            return cs.getPropertyValue(k).trim() || 'currentColor';
          })
        };
        return;
      }
      root.setAttribute('data-mod-theme', th.id);
      cs = getComputedStyle(root);
      out[th.id] = {
        bg: cs.getPropertyValue('--mt-bg').trim(),
        bars: ['--mt-key', '--mt-str', '--mt-fn'].map(function (k) {
          return cs.getPropertyValue(k).trim();
        })
      };
    });
    if (hadSkin) root.setAttribute('data-mod-theme', hadSkin); else root.removeAttribute('data-mod-theme');
    if (hadBase) root.setAttribute('data-theme', hadBase);
    return out;
  }

  /*@3.MOTJ.11*/
  var FONTS = [
    { id: 'garden',  css: null,                   ar: 'خطُّ الموقع',   en: 'Site font' },
    { id: 'plex',    css: 'IBM Plex Sans Arabic', ar: 'بلكس عربي',    en: 'IBM Plex Sans Arabic' },
    { id: 'cairo',   css: 'Cairo',                ar: 'القاهرة',      en: 'Cairo' },
    { id: 'tajawal', css: 'Tajawal',              ar: 'تجوّل',         en: 'Tajawal' },
    { id: 'almarai', css: 'Almarai',              ar: 'المراعي',      en: 'Almarai' },
    { id: 'readex',  css: 'Readex Pro',           ar: 'ريدكس برو',    en: 'Readex Pro' },
    { id: 'naskh',   css: 'Noto Naskh Arabic',    ar: 'نسخ',          en: 'Noto Naskh Arabic' }
  ];

  function currentFont() {
    var v = prefs().moduleFont;
    return (typeof v === 'string' && v) ? v : 'garden';
  }

  function chooseFont(id) {
    if (!id || id === 'garden') {
      if (window.GardenTint && GardenTint.clearFont) GardenTint.clearFont();
      return;
    }
    var p = prefs();
    p.moduleFont = id;
    try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch (e) {}
    if (window.GardenTint && GardenTint.applyFont) GardenTint.applyFont();
  }

  function close() {
    var pop = document.getElementById('mtPop');
    if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
  }

  function open(button) {
    if (document.getElementById('mtPop')) { close(); return; }

    var pal = palettes();
    var cur = current();
    var pop = document.createElement('div');
    pop.className = 'mt-pop';
    pop.id = 'mtPop';
    pop.setAttribute('role', 'menu');

    /*@3.MOTJ.12*/
    var colTheme = document.createElement('div');
    colTheme.className = 'mt-col';
    var colFont = document.createElement('div');
    colFont.className = 'mt-col mt-col--font';
    pop.appendChild(colTheme);
    pop.appendChild(colFont);

    var head = document.createElement('div');
    head.className = 'mt-sep';
    head.textContent = L('ثيمُ صفحات المادة', 'Course pages theme');
    colTheme.appendChild(head);

    /*@3.MOTJ.13*/
    if (window.GardenTint && GardenTint.fontSheet) GardenTint.fontSheet();
    var curF = currentFont();
    var fhead = document.createElement('div');
    fhead.className = 'mt-sep';
    fhead.textContent = L('خطُّ القراءة', 'Reading font');
    colFont.appendChild(fhead);

    FONTS.forEach(function (fo) {
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.setAttribute('role', 'menuitemradio');
      opt.setAttribute('aria-checked', fo.id === curF ? 'true' : 'false');
      opt.className = 'mt-opt mt-fopt' + (fo.id === curF ? ' is-on' : '');

      var name = document.createElement('span');
      name.className = 'mt-name';
      name.textContent = isAr() ? fo.ar : fo.en;
      /*@3.MOTJ.14*/
      if (fo.css) name.style.fontFamily = '"' + fo.css + '", sans-serif';
      opt.appendChild(name);

      var samp = document.createElement('span');
      samp.className = 'mt-fsamp';
      samp.textContent = isAr() ? 'خوارزمية Ag' : 'Algorithm أب';
      if (fo.css) samp.style.fontFamily = '"' + fo.css + '", sans-serif';
      opt.appendChild(samp);

      opt.addEventListener('click', function () { chooseFont(fo.id); close(); });
      colFont.appendChild(opt);
    });

    var group = null;
    THEMES.forEach(function (th) {
      /*@3.MOTJ.8*/
      if (th.base && th.base !== group) {
        group = th.base;
        var sep = document.createElement('div');
        sep.className = 'mt-sep';
        sep.textContent = L(FAMILY[group].ar, FAMILY[group].en);
        colTheme.appendChild(sep);
      }
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.setAttribute('role', 'menuitemradio');
      opt.setAttribute('aria-checked', th.id === cur ? 'true' : 'false');
      opt.className = 'mt-opt' + (th.id === cur ? ' is-on' : '');

      var sw = document.createElement('span');
      sw.className = 'mt-sw';
      sw.style.background = pal[th.id].bg;
      pal[th.id].bars.forEach(function (c) {
        var bar = document.createElement('i');
        bar.style.background = c;
        sw.appendChild(bar);
      });
      opt.appendChild(sw);

      var name = document.createElement('span');
      name.className = 'mt-name';
      name.textContent = isAr() ? th.ar : th.en;
      opt.appendChild(name);

      opt.addEventListener('click', function () { choose(th.id); close(); });
      colTheme.appendChild(opt);
    });

    /*@3.MOTJ.9*/
    button.parentNode.appendChild(pop);

    /*@3.MOTJ.10*/
    var away = function (e) {
      if (pop.contains(e.target) || e.target === button || button.contains(e.target)) return;
      close();
      document.removeEventListener('click', away, true);
      document.removeEventListener('keydown', esc, true);
    };
    var esc = function (e) {
      if (e.key !== 'Escape') return;
      close();
      try { button.focus(); } catch (err) {}
      document.removeEventListener('click', away, true);
      document.removeEventListener('keydown', esc, true);
    };
    setTimeout(function () {
      document.addEventListener('click', away, true);
      document.addEventListener('keydown', esc, true);
    }, 0);
  }

  window.GardenModuleTheme = {
    open: open, close: close, current: current, choose: choose, THEMES: THEMES,
    currentFont: currentFont, chooseFont: chooseFont, FONTS: FONTS
  };
})();
