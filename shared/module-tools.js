;(function () {
  'use strict';
  if (window.GardenModTools) return;

  var me = document.currentScript;
  var src = (me && me.src) || '';
  var DIR = src.replace(/[^/]*$/, '');
  var VER = (src.split('?')[1] || '');
  var ROOT = DIR.replace(/shared\/$/, '');
  var STOP_SEL = '#flashcards, #quiz, #vault, .flashcard-section, .quiz-section, .vault-section';

  function isAr() { return document.documentElement.lang !== 'en'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function js(name, test) {
    if (test()) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = DIR + name + (VER ? '?' + VER : '');
      s.onload = function () { res(); };
      s.onerror = function () { rej(new Error(name)); };
      document.head.appendChild(s);
    });
  }
  function css(name) {
    var old = document.querySelector('link[data-mi="' + name + '"]');
    if (old) return old.sheet ? Promise.resolve() : new Promise(function (r) { old.addEventListener('load', r); old.addEventListener('error', r); setTimeout(r, 3000); });
    return new Promise(function (r) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = DIR + name + (VER ? '?' + VER : ''); l.setAttribute('data-mi', name);
      l.onload = r; l.onerror = r;
      document.head.appendChild(l);
    });
  }
  var CSS_OK = Promise.all([css('surface.css'), css('module-ink.css'), css('module-tools.css')]);
  function ink() { return js('module-ink.js', function () { return !!window.GardenModuleInk; }).then(function () { return window.GardenModuleInk; }); }
  function menuLib() { return js('menu.js', function () { return !!window.GardenMenu; }).then(function () { return window.GardenMenu; }); }

  function toast(msg) {
    var old = document.querySelector('.mt-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'mt-toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.isConnected) t.remove(); }, 2200);
  }
  function copyText(s) {
    var done = function () { toast(L('نُسخ ✓', 'Copied ✓')); };
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s).then(done, function () { fallback(s); });
    fallback(s);
    return Promise.resolve();
    function fallback(v) {
      var ta = document.createElement('textarea');
      ta.value = v; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast(L('تعذّر النسخ', 'Copy failed')); }
      ta.remove();
    }
  }

  /*@3.MOTJ2.1*/
  var HI_DEF = ['yellow', 'lime', 'sky', 'pink', 'orange', 'violet'];
  var TONE_AR = { yellow: 'أصفر', lime: 'ليموني', emerald: 'أخضر', teal: 'فيروزي', sky: 'أزرق', indigo: 'نيلي', violet: 'بنفسجي',
                  pink: 'زهري', orange: 'برتقالي', red: 'أحمر', amber: 'كهرماني', rose: 'وردي', brown: 'بنّي', ink: 'رمادي' };
  var TONE_EN = { yellow: 'Yellow', lime: 'Lime', emerald: 'Green', teal: 'Teal', sky: 'Blue', indigo: 'Indigo', violet: 'Violet',
                  pink: 'Pink', orange: 'Orange', red: 'Red', amber: 'Amber', rose: 'Rose', brown: 'Brown', ink: 'Grey' };
  var ALL_HI = Object.keys(TONE_AR);
  function swatchLib() { return js('notes-swatch.js', function () { return !!window.GardenSwatch; }).then(function () { return window.GardenSwatch; }); }
  function hiPalette() {
    if (window.GardenSwatch && GardenSwatch.pal) return GardenSwatch.pal.cur('hi').slice(0, 6);
    try {
      var d = JSON.parse(localStorage.getItem('garden_ink_palettes') || 'null'), P = d && d.hi;
      var l = P && P.lists && P.lists[P.cur] && P.lists[P.cur].c;
      if (l && l.length) return l.slice(0, 6);
    } catch (e) {}
    return HI_DEF.slice();
  }
  function toneName(c) { return TONE_AR[c] ? L(TONE_AR[c], TONE_EN[c]) : c; }
  function hiHex(c) { return /^#/.test(c) ? c : 'var(--gmi-' + c + ')'; }
  function dotStyle(c, u) {
    var v = /^#/.test(c) ? c : 'var(' + (u ? '--gmi-p-' : '--gmi-') + c + ')';
    return '--t:' + v;
  }
  function dotHtml(c, u, cur, extra) {
    var t = u === 'text';
    return '<button type="button" ' + (extra || '') + ' class="mt-dot' + (t ? ' mt-dot--t' : (u ? ' mt-dot--u' : '')) + '"' +
      (u ? ' data-g="' + (t ? L('أ', 'A') : L('نص', 'ab')) + '"' : '') +
      ' style="' + esc(dotStyle(c, u)) + '" aria-pressed="' + (c === cur) + '" ';
  }
  var STYLE_KEY = 'garden_mi_selstyle';
  /*@3.MOTJ2.8*/
  var STYLES = { fill: { i: 'fa-highlighter', ar: 'تظليل', en: 'Highlight', ok: ['ظُلِّل ✓', 'Highlighted ✓'] },
                 under: { i: 'fa-underline', ar: 'تسطير', en: 'Underline', ok: ['سُطِّر ✓', 'Underlined ✓'] },
                 text: { i: 'fa-a', ar: 'لونُ النصّ', en: 'Text colour', ok: ['لُوِّن ✓', 'Coloured ✓'] } };
  var ST_ORDER = ['fill', 'under', 'text'];
  function selStyle() { try { var v = localStorage.getItem(STYLE_KEY); return STYLES[v] ? v : 'fill'; } catch (e) { return 'fill'; } }
  function dotKind(st) { return st === 'fill' ? false : st; }
  function setSelStyle(v) { try { localStorage.setItem(STYLE_KEY, v); } catch (e) {} }
  /*@3.MOTJ2.10*/
  function inkDark() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--gmi-p-ink').trim(), m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return false;
    var n = parseInt(m[1], 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 128;
  }
  function palFor(st) {
    if (st !== 'text') return hiPalette();
    return ['ink'].concat(hiPalette().filter(function (c) { return c !== 'ink' && c !== 'yellow' && c !== 'lime'; })).slice(0, 6);
  }
  function nameOf(c, st, en) {
    if (c === 'ink' && st === 'text') return inkDark() ? (en ? 'White' : 'أبيض') : (en ? 'Black' : 'أسود');
    return (en ? TONE_EN[c] : TONE_AR[c]) || c;
  }
  function stTabs(cur, attr) {
    return '<div class="mt-st" role="radiogroup" ' + lbl('طريقةُ التعليم', 'Marking style') + '>' + ST_ORDER.map(function (k) {
      var x = STYLES[k];
      return '<button type="button" class="mt-stb" role="radio" aria-checked="' + (k === cur) + '" ' + attr + '="' + k + '" ' + lbl(x.ar, x.en) + '><i class="fa-solid ' + x.i + '" aria-hidden="true"></i></button>';
    }).join('') + '</div>';
  }
  var LAST_KEY = 'garden_mi_selcolor';
  function lastColor() { try { return localStorage.getItem(LAST_KEY) || ''; } catch (e) { return ''; } }

  function peekHidden() { try { return localStorage.getItem('garden_peek_off') === '1'; } catch (e) { return false; } }
  function hasLatin(s) { return /[A-Za-z]{2,}/.test(s || ''); }

  var SEL = { el: null, range: null, text: '', rect: null, opts: null };
  function coarse() { return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); }

  function lbl(ar, en) {
    var t = L(ar, en);
    return 'aria-label="' + esc(t) + '" title="' + esc(t) + '" data-ar-title="' + esc(ar) + '" data-en-title="' + esc(en) + '"';
  }

  function buildBar() {
    var st = selStyle(), u = dotKind(st), cur = lastColor();
    var verb = { fill: ['ظلِّلْ بالـ', 'Highlight in '], under: ['سطِّرْ بالـ', 'Underline in '], text: ['لوِّنِ النصَّ بالـ', 'Colour the text '] }[st];
    var dots = palFor(st).map(function (c) {
      return dotHtml(c, u, cur, 'data-c="' + esc(c) + '"') +
        lbl(verb[0] + nameOf(c, st), verb[1] + nameOf(c, st, 1)) + '></button>';
    }).join('');
    var tr = hasLatin(SEL.text);
    return stTabs(st, 'data-st') +
      '<div class="mt-dots" role="group" ' + lbl('ألوانُ التظليل', 'Highlight colours') + '>' + dots + '</div>' +
      '<button type="button" class="mt-ic" data-a="pal" aria-haspopup="dialog" ' + lbl('لوحاتُ الألوان', 'Colour palettes') + '><i class="fa-solid fa-palette" aria-hidden="true"></i></button>' +
      '<span class="mt-sep" aria-hidden="true"></span>' +
      '<button type="button" class="mt-ic" data-a="copy" ' + lbl('انسخ', 'Copy') + '><i class="fa-solid fa-copy" aria-hidden="true"></i></button>' +
      '<button type="button" class="mt-ic" data-a="note" ' + lbl('ملاحظةٌ على هذا النصّ', 'A note on this text') + '><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i></button>' +
      (tr ? '<button type="button" class="mt-ic" data-a="tr" ' + lbl('ترجم', 'Translate') + '><i class="fa-solid fa-language" aria-hidden="true"></i></button>' : '') +
      '<button type="button" class="mt-ic" data-a="more" aria-haspopup="menu" ' + lbl('المزيد', 'More') + '><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>';
  }

  function place() {
    var el = SEL.el, r = SEL.rect;
    if (!el || !r) return;
    var vw = window.innerWidth, vh = window.innerHeight, pad = 10;
    var w = el.offsetWidth, h = el.offsetHeight;
    if (coarse()) {
      el.setAttribute('data-dock', SEL.top ? 'top' : '1');
      el.style.left = Math.max(pad, (vw - w) / 2) + 'px';
      el.style.top = '';
      return;
    }
    el.removeAttribute('data-dock');
    var top = r.top - h - 10;
    if (top < pad + 56) top = r.bottom + 10;
    top = Math.max(pad, Math.min(vh - h - pad, top));
    var left = Math.max(pad, Math.min(vw - w - pad, (r.left + r.right) / 2 - w / 2));
    el.style.left = Math.round(left) + 'px';
    el.style.top = Math.round(top) + 'px';
  }

  function hideSel() {
    if (SEL.el) SEL.el.hidden = true;
    document.body.classList.remove('garden-selbar-open');
  }

  function act(a, b) {
    var range = SEL.range, text = SEL.text, o = SEL.opts || {};
    if (a === 'st') {
      setSelStyle(b.getAttribute('data-st'));
      SEL.el.innerHTML = buildBar();
      place();
      var f = SEL.el.querySelector('.mt-stb[aria-checked="true"]');
      if (f) try { f.focus({ preventScroll: true }); } catch (e0) {}
      return;
    }
    if (a === 'hl') {
      var c = b.getAttribute('data-c');
      try { localStorage.setItem(LAST_KEY, c); } catch (e) {}
      hideSel();
      if (document.documentElement.hasAttribute('data-marks-off') && window.GardenMarks) GardenMarks.set(false);
      ink().then(function (I) { return I.addHighlight(range, c, selStyle()); }).then(function (n) {
        try { window.getSelection().removeAllRanges(); } catch (e) {}
        toast(n ? L(STYLES[selStyle()].ok[0], STYLES[selStyle()].ok[1])
                : L('هذا النصُّ خارجَ ما يُظلَّل', 'This text can’t be highlighted'));
      }, function () { toast(L('تعذّر التظليل', 'Could not highlight')); });
      return;
    }
    if (a === 'pal') { hideSel(); palDialog(true); return; }
    if (a === 'copy') { hideSel(); copyText(text); return; }
    if (a === 'note') { hideSel(); if (o.onNote) o.onNote(); return; }
    if (a === 'tr') {
      hideSel();
      translate(text, SEL.rect);
      return;
    }
    if (a === 'more') {
      var r = b.getBoundingClientRect();
      hideSel();
      smart(r.left, r.bottom + 6, { sec: secOf(range && range.startContainer), range: range, text: text, fromBar: 1 });
    }
  }

  function showSel(range, text, rect, opts) {
    SEL.range = range; SEL.text = text; SEL.rect = rect; SEL.opts = opts || {};
    if (!SEL.el) {
      var el = document.createElement('div');
      el.className = 'mt-sel';
      el.setAttribute('role', 'toolbar');
      el.setAttribute('aria-label', L('أدواتُ النصِّ المحدَّد', 'Selected-text tools'));
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); });
      el.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('button') : null;
        if (!b || !el.contains(b)) return;
        if (b.hasAttribute('data-c')) act('hl', b);
        else if (b.hasAttribute('data-st')) act('st', b);
        else act(b.getAttribute('data-a'), b);
      });
      document.body.appendChild(el);
      SEL.el = el;
      document.addEventListener('pointerdown', function (e) { if (SEL.el && !SEL.el.hidden && !SEL.el.contains(e.target)) hideSel(); }, true);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideSel(); });
      window.addEventListener('scroll', function () { if (SEL.el && !SEL.el.hidden && !coarse() && SEL.range) { SEL.rect = SEL.range.getBoundingClientRect(); place(); } }, { passive: true });
    }
    var tr = false;
    try { tr = localStorage.getItem('garden_tr_auto') === '1' && text.length <= 300 && latinMost(text); } catch (e) { tr = false; }
    SEL.top = tr;
    SEL.el.innerHTML = buildBar();
    SEL.el.hidden = false;
    place();
    CSS_OK.then(function () { if (!SEL.el.hidden) place(); });
    setTimeout(function () { if (SEL.el && !SEL.el.hidden && SEL.range && !coarse()) { SEL.rect = SEL.range.getBoundingClientRect(); place(); } }, 120);
    document.body.classList.add('garden-selbar-open');
    if (tr) translate(text, rect);
  }

  /*@3.MOTJ2.3*/
  var PAL_DLG = null;
  function palDialog(back) {
    var keep = back && SEL.range ? { range: SEL.range, text: SEL.text, rect: SEL.rect, opts: SEL.opts } : null;
    return swatchLib().then(function (S) { return Promise.resolve(S.ready).then(function () { return [S]; }); }).then(function (r) {
      var S = r[0], dlg = PAL_DLG;
      function paint() {
        var stP = selStyle();
        dlg.querySelector('.mt-pal-body').innerHTML =
          '<h3 class="mt-pal-t"><i class="fa-solid fa-palette" aria-hidden="true"></i> ' + esc(L('ألوانُ التظليل', 'Highlight colours')) + '</h3>' +
          '<div class="gsf-chips" role="radiogroup" aria-label="' + esc(L('طريقةُ التعليم', 'Marking style')) + '">' +
          ST_ORDER.map(function (k) {
            var on = k === stP, x = STYLES[k];
            return '<button type="button" class="gsf-chip' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-mtst="' + k + '"><i class="fa-solid ' + x.i + '" aria-hidden="true"></i> ' + esc(L(x.ar, x.en)) + '</button>';
          }).join('') + '</div>' +
          S.palPanel('hi', { hexOf: hiHex });
      }
      if (!dlg) {
        dlg = PAL_DLG = document.createElement('dialog');
        dlg.className = 'gsf mt-pal';
        dlg.setAttribute('aria-label', L('لوحاتُ ألوان التظليل', 'Highlight colour palettes'));
        dlg.innerHTML = '<div class="gsf-grip" aria-hidden="true"></div>' +
          '<form method="dialog" class="gsf-x"><button class="gsf-close" ' + lbl('إغلاق', 'Close') + '><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
          '<div class="gsf-body mt-pal-body"></div>';
        document.body.appendChild(dlg);
        dlg.addEventListener('click', function (e) {
          var b = e.target.closest ? e.target.closest('button') : null;
          if (!b || !dlg.contains(b)) return;
          if (b.hasAttribute('data-mtst')) { setSelStyle(b.getAttribute('data-mtst')); paint(); return; }
          S.palClick(b, 'hi', { hexOf: hiHex, onChange: paint, presets: ALL_HI.map(function (c) { return { v: c, hex: hiHex(c), name: L(TONE_AR[c], TONE_EN[c]) }; }) });
        });
        dlg.addEventListener('close', function () {
          if (S.closeBoard) S.closeBoard();
          var k = dlg.__keep; dlg.__keep = null;
          if (!k) return;
          try { var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(k.range); } catch (e) {}
          showSel(k.range, k.text, k.range.getBoundingClientRect(), k.opts);
        });
      }
      dlg.__keep = keep;
      paint();
      if (!dlg.open) dlg.showModal();
    }, function () { toast(L('تعذّر فتحُ اللوحات', 'Could not open the palettes')); });
  }
  document.addEventListener('garden:palettes', function () { if (SEL.el && !SEL.el.hidden) SEL.el.innerHTML = buildBar(); });
  swatchLib().catch(function () {});

  function latinMost(s) {
    var la = (String(s).match(/[A-Za-z]/g) || []).length, ar = (String(s).match(/[؀-ۿ]/g) || []).length;
    return la >= 2 && la >= ar;
  }
  function translate(text, rect) {
    return js('garden-tr.js', function () { return !!window.GardenTr; }).then(function () {
      window.GardenTr.open(text, rect || null, { to: isAr() || latinMost(text) ? 'ar' : 'en', autoToggle: true });
    }, function () { toast(L('تعذّرت الترجمة', 'Translation unavailable')); });
  }
  function wordAt(x, y) {
    var rg = null;
    try {
      if (document.caretRangeFromPoint) rg = document.caretRangeFromPoint(x, y);
      else if (document.caretPositionFromPoint) {
        var cp = document.caretPositionFromPoint(x, y);
        if (cp) { rg = document.createRange(); rg.setStart(cp.offsetNode, cp.offset); }
      }
    } catch (e) { rg = null; }
    var n = rg && rg.startContainer;
    if (!n || n.nodeType !== 3) return null;
    var t = n.nodeValue || '', i = rg.startOffset, a = i, b = i;
    while (a > 0 && /[A-Za-z'\-]/.test(t.charAt(a - 1))) a--;
    while (b < t.length && /[A-Za-z'\-]/.test(t.charAt(b))) b++;
    if (b - a < 2) return null;
    var wr = document.createRange();
    wr.setStart(n, a); wr.setEnd(n, b);
    return { text: t.slice(a, b), rect: wr.getBoundingClientRect() };
  }

  function secOf(node) {
    var el = node && (node.nodeType === 3 ? node.parentNode : node);
    var s = el && el.closest ? el.closest('.main-content > section') : null;
    return (s && s.id && !s.matches(STOP_SEL)) ? s : null;
  }
  function titleOf(sec) {
    var h = sec && sec.querySelector('h1, h2, h3');
    return h ? h.textContent.replace(/\s+/g, ' ').trim().replace(/^\d+\s+/, '') : '';
  }
  function courseLine() {
    var html = document.documentElement;
    var code = html.getAttribute('data-subject') || '', m = html.getAttribute('data-module') || '';
    return code ? code + (m ? ' · ' + L('الوحدة ', 'Module ') + m : '') : '';
  }
  var SKIP = 'script, style, button, .depth-tabs, .smart-term-tooltip, .ai-explain-btn, [aria-hidden="true"], .copy-btn, .code-header, svg';
  function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  function blocksOf(sec) {
    var out = [], seen = new Set();
    var all = sec.querySelectorAll('h2, h3, h4, p, li, pre, blockquote, td, th, figcaption, .content-target');
    Array.prototype.forEach.call(all, function (el) {
      if (!visible(el) || el.closest(SKIP)) return;
      for (var p = el.parentElement; p && p !== sec; p = p.parentElement) if (seen.has(p)) return;
      seen.add(el);
      var t;
      if (el.tagName === 'PRE') { t = el.innerText.replace(/\s+$/, ''); out.push({ k: 'code', t: t }); return; }
      t = el.innerText.replace(/\s+/g, ' ').trim();
      if (!t) return;
      var k = /^H[2-4]$/.test(el.tagName) ? 'h' : (el.tagName === 'LI' ? 'li' : 'p');
      var ol = k === 'li' && el.parentElement && el.parentElement.tagName === 'OL' ? el.parentElement : null;
      out.push({ k: k, t: t, n: ol ? (Number(ol.getAttribute('start')) || 1) + Array.prototype.indexOf.call(ol.children, el) : 0 });
    });
    return out;
  }
  function mdOf(sec) {
    var bl = blocksOf(sec), out = [];
    bl.forEach(function (b, i) {
      if (b.k === 'h') out.push((i ? '\n' : '') + '## ' + b.t);
      else if (b.k === 'li') out.push((b.n ? b.n + '. ' : '- ') + b.t);
      else if (b.k === 'code') out.push('```\n' + b.t + '\n```');
      else out.push(b.t);
    });
    var src = [courseLine(), moduleTitle()].filter(Boolean).join(' — ');
    return out.join('\n') + (src ? '\n\n— ' + src : '');
  }

  /*@3.MOTJ2.2*/
  var SHOT_W = 720, SHOT_MAX = 1650;
  /*@3.MOTJ2.9*/
  var ALGO_SEL = '[id^="algo-widget-"], .algo-widget, [data-algo], .algo-toolbar';
  var SVG_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity',
                   'fill-opacity', 'opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor',
                   'dominant-baseline', 'letter-spacing', 'visibility', 'display', 'color'];
  var LOGO = DIR + 'icons/logo.svg', LOGO_PNG = '';
  function logoReady() {
    if (LOGO_PNG) return Promise.resolve(LOGO_PNG);
    return new Promise(function (res) {
      var im = new Image(), done = function () { res(LOGO_PNG || LOGO); };
      im.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = c.height = 256;
          c.getContext('2d').drawImage(im, 0, 0, 256, 256);
          LOGO_PNG = c.toDataURL('image/png');
        } catch (e) {}
        done();
      };
      im.onerror = done;
      im.src = LOGO;
      setTimeout(done, 2500);
    });
  }
  function exportLib() { return js('export.js', function () { return !!window.Export; }).then(function () { return window.Export; }); }
  function moduleTitle() {
    var h = document.querySelector('#hero .content-target h1, #hero h1');
    return h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function inlineSvg(src, dst) {
    var a = src.querySelectorAll('svg, svg *'), b = dst.querySelectorAll('svg, svg *'), i;
    if (a.length !== b.length) return;
    for (i = 0; i < a.length; i++) {
      var cs = getComputedStyle(a[i]), st = '';
      SVG_PROPS.forEach(function (p) { var v = cs.getPropertyValue(p); if (v) st += p + ':' + v + ';'; });
      if (a[i].tagName.toLowerCase() === 'svg') {
        var r = a[i].getBoundingClientRect();
        if (r.width) { b[i].setAttribute('width', Math.round(r.width)); b[i].setAttribute('height', Math.round(r.height)); }
      }
      b[i].setAttribute('style', st + (b[i].getAttribute('style') || ''));
    }
  }
  function dropAssist(root) {
    Array.prototype.forEach.call(root.querySelectorAll('mjx-assistive-mml'), function (a) { a.remove(); });
  }
  var MJX_FACES = null;
  function mjxFaces() {
    if (MJX_FACES) return MJX_FACES;
    var el = document.getElementById('MJX-CHTML-styles'), faces = {}, rules = '';
    Array.prototype.forEach.call((el && el.sheet && el.sheet.cssRules) || [], function (r) {
      if (r.type === 5) {
        var fam = (r.style.getPropertyValue('font-family') || '').replace(/["']/g, '').trim();
        var m = /url\("?([^")]+)"?\)/.exec(r.cssText);
        if (fam && m) faces[fam] = { css: r.cssText, url: m[1] };
      } else rules += r.cssText + '\n';
    });
    MJX_FACES = Promise.all(Object.keys(faces).map(function (k) {
      return fetch(new URL(faces[k].url, location.href).href).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
        if (!b) return;
        return new Promise(function (res) {
          var fr = new FileReader();
          fr.onload = function () { faces[k].css = faces[k].css.split(faces[k].url).join(fr.result); res(); };
          fr.onerror = function () { res(); };
          fr.readAsDataURL(b);
        });
      }, function () {});
    })).then(function () { return { faces: faces, rules: rules }; });
    return MJX_FACES;
  }
  function xmlEsc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nativeMath(m, F) {
    var r = (m.querySelector('mjx-math') || m).getBoundingClientRect(), W = Math.ceil(r.width) + 1, H = Math.ceil(r.height) + 1;
    var used = {}, css = '';
    Array.prototype.forEach.call(m.querySelectorAll('mjx-c'), function (c) {
      getComputedStyle(c, '::before').fontFamily.split(',').forEach(function (f) { used[f.replace(/["']/g, '').trim()] = 1; });
    });
    Object.keys(used).forEach(function (f) { if (F.faces[f]) css += F.faces[f].css + '\n'; });
    var cl = m.cloneNode(true);
    dropAssist(cl);
    var pc = getComputedStyle(m.parentNode);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><foreignObject x="0" y="0" width="' + W + '" height="' + H + '">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:flex-start;margin:0;padding:0;font-size:' + pc.fontSize + ';color:' + getComputedStyle(m).color + ';direction:ltr;line-height:0;white-space:nowrap;text-align:left">' +
      '<style>' + xmlEsc(css + F.rules + 'mjx-container{display:inline-block !important;vertical-align:top !important;margin:0 !important;text-align:left !important;}mjx-math{margin:0 !important;}') + '</style>' +
      new XMLSerializer().serializeToString(cl) + '</div></foreignObject></svg>';
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () {
        try {
          var c = document.createElement('canvas'), k = 3;
          c.width = W * k; c.height = H * k;
          var g = c.getContext('2d');
          g.scale(k, k);
          g.drawImage(im, 0, 0, W, H);
          res(c.toDataURL('image/png'));
        } catch (e) { rej(e); }
      };
      im.onerror = rej;
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  function mathShots(roots, X) {
    var ms = [];
    roots.forEach(function (r) {
      Array.prototype.forEach.call(r.querySelectorAll('mjx-container'), function (m) { if (m.getClientRects().length) ms.push(m); });
    });
    var out = [];
    if (!ms.length) return Promise.resolve(out);
    return mjxFaces().then(function (F) {
      return ms.reduce(function (p, m, i) {
        return p.then(function () {
          m.setAttribute('data-mtm', i);
          var r = (m.querySelector('mjx-math') || m).getBoundingClientRect(), probe = document.createElement('span');
          probe.style.cssText = 'display:inline-block;inline-size:0;block-size:0;';
          m.parentNode.insertBefore(probe, m);
          var base = probe.getBoundingClientRect().top;
          probe.remove();
          var keep = function (url) { out[i] = { url: url, w: Math.ceil(r.width) + 1, h: Math.ceil(r.height) + 1, va: base - r.bottom, block: m.getAttribute('display') === 'true', align: getComputedStyle(m).textAlign }; };
          return nativeMath(m, F).then(keep, function () {
            var am = m.querySelector('mjx-assistive-mml'), at = am ? am.nextSibling : null;
            if (am) am.remove();
            var back = function () { if (am && !am.isConnected) m.insertBefore(am, at && at.parentNode === m ? at : null); };
            return window.html2canvas(m, { backgroundColor: null, scale: 3, logging: false, useCORS: true,
                                           onclone: function (doc) { X.fixColors(doc.body); } }).then(function (cv) {
              back(); keep(cv.toDataURL('image/png'));
            }, function () { back(); out[i] = null; });
          });
        });
      }, Promise.resolve());
    }).then(function () { return out; });
  }
  function untag(roots) {
    roots.forEach(function (r) {
      Array.prototype.forEach.call(r.querySelectorAll('[data-mtm]'), function (e) { e.removeAttribute('data-mtm'); });
    });
  }
  function mathImgs(body, maths) {
    Array.prototype.forEach.call(body.querySelectorAll('mjx-container[data-mtm]'), function (c) {
      var shot = maths[+c.getAttribute('data-mtm')];
      if (!shot) return;
      var im = document.createElement('img'), box = document.createElement(shot.block ? 'div' : 'span');
      im.src = shot.url; im.alt = '';
      im.width = shot.w; im.height = shot.h;
      im.style.cssText = 'display:inline-block;inline-size:' + shot.w + 'px;block-size:' + shot.h + 'px;max-inline-size:none;margin:0;' +
        (shot.block ? '' : 'vertical-align:' + Math.round(shot.va * 10) / 10 + 'px;');
      box.className = 'mt-shot-math';
      box.appendChild(im);
      c.parentNode.replaceChild(box, c);
    });
    dropAssist(body);
  }
  function flatText(el) {
    Array.prototype.forEach.call(el.querySelectorAll('.smart-term-tooltip, button, template, script, .copy-btn'), function (d) { d.remove(); });
    Array.prototype.forEach.call(el.querySelectorAll('.smart-term'), function (t) { t.replaceWith(document.createTextNode(t.textContent)); });
    Array.prototype.forEach.call(el.querySelectorAll('[class]'), function (e) {
      if (!/^(mt-shot|hljs)/.test(e.className.baseVal != null ? '' : e.className)) e.removeAttribute('class');
    });
    Array.prototype.forEach.call(el.querySelectorAll('[id]'), function (e) { e.removeAttribute('id'); });
    Array.prototype.forEach.call(el.querySelectorAll('ol > li, ul > li'), function (li) {
      var ls = li.parentNode, k = ls.tagName === 'OL';
      var n = (Number(ls.getAttribute('start')) || 1) + Array.prototype.indexOf.call(ls.children, li);
      var mk = document.createElement('span');
      mk.className = 'mt-shot-mk';
      mk.textContent = k ? n + '.' : '•';
      li.insertBefore(mk, li.firstChild);
    });
    return el;
  }
  function inner(host) {
    var t = host && (host.querySelector(':scope > .content-target') || host);
    var box = document.createElement('div');
    if (t) Array.prototype.forEach.call(t.childNodes, function (n) { box.appendChild(n.cloneNode(true)); });
    return box;
  }
  /*@3.MOTJ2.4*/
  function shotBlocks(sec, maths) {
    var body = sec.cloneNode(true);
    inlineSvg(sec, body);
    var lp = sec.querySelectorAll('pre *'), cp = body.querySelectorAll('pre *');
    if (lp.length === cp.length) Array.prototype.forEach.call(lp, function (e, i) {
      var cs = getComputedStyle(e);
      cp[i].style.color = cs.color; cp[i].style.fontWeight = cs.fontWeight; cp[i].style.fontStyle = cs.fontStyle;
    });
    mathImgs(body, maths);
    Array.prototype.forEach.call(body.querySelectorAll(ALGO_SEL), function (w) { w.remove(); });
    var out = document.createElement('div');
    out.className = 'mt-shot-body';
    Array.prototype.forEach.call(body.children, function (b) {
      var c = b.classList, el = null;
      if (c.contains('concept-header') || c.contains('depth-tabs') || c.contains('ai-explain-btn') || b.tagName === 'TEMPLATE') return;
      if (c.contains('depth-layer')) {
        if (!c.contains('active')) return;
        el = flatText(inner(b)); el.className = 'mt-shot-text';
      } else if (c.contains('code-block')) {
        var pre = b.querySelector('pre'), lang = b.querySelector('.code-block-header span');
        if (!pre) return;
        el = document.createElement('div'); el.className = 'mt-shot-code';
        if (lang) { var lb = document.createElement('span'); lb.className = 'mt-shot-lang'; lb.textContent = lang.textContent.trim(); el.appendChild(lb); }
        var p2 = pre.cloneNode(true); p2.removeAttribute('class'); p2.setAttribute('dir', 'ltr');
        el.appendChild(p2);
      } else if (b.tagName === 'DETAILS') {
        var q = b.querySelector('summary'), a = b.querySelector(':scope > div');
        el = document.createElement('div'); el.className = 'mt-shot-qa';
        el.innerHTML = '<div class="mt-shot-qa-h"><span class="mt-shot-qa-mark" aria-hidden="true">' + L('؟', '?') + '</span><span>' + esc(L('سؤالٌ للتفكير', 'Think about it')) + '</span></div>';
        var qq = flatText(inner(q)); qq.className = 'mt-shot-q'; el.appendChild(qq);
        if (a) {
          var al = document.createElement('div'); al.className = 'mt-shot-al'; al.textContent = L('الجواب', 'Answer'); el.appendChild(al);
          var aa = flatText(inner(a)); aa.className = 'mt-shot-a'; el.appendChild(aa);
        }
      } else if (c.contains('formula-block')) {
        el = document.createElement('div'); el.className = 'mt-shot-formula';
        var cap = b.querySelector('[data-bilingual]');
        if (cap) { var cp = flatText(inner(cap)); cp.className = 'mt-shot-fcap'; el.appendChild(cp); }
        Array.prototype.forEach.call(b.querySelectorAll('.mt-shot-math'), function (m) { el.appendChild(m); });
      } else if (b.querySelector('svg') || b.tagName === 'svg') {
        el = document.createElement('div'); el.className = 'mt-shot-fig';
        Array.prototype.forEach.call(b.querySelectorAll('svg'), function (s) { if (!s.closest('svg svg')) el.appendChild(s); });
        if (!el.children.length && b.tagName === 'svg') el.appendChild(b);
      } else if (b.tagName === 'TABLE' || b.querySelector('table')) {
        el = document.createElement('div'); el.className = 'mt-shot-table';
        var tb = (b.tagName === 'TABLE' ? b : b.querySelector('table')).cloneNode(true);
        el.appendChild(flatText(tb));
      } else {
        el = flatText(inner(b)); el.className = 'mt-shot-text';
        if (!el.textContent.trim() && !el.querySelector('img')) return;
      }
      out.appendChild(el);
    });
    return out;
  }
  function pad2(n) { n = String(n || '').trim(); return /^\d$/.test(n) ? '0' + n : n; }
  function shotCard(sec, maths, cat) {
    var h = document.documentElement, code = h.getAttribute('data-subject') || '', m = h.getAttribute('data-module') || '';
    var num = sec.querySelector('.concept-number'), title = titleOf(sec);
    var course = L(cat.name_ar || '', cat.name_en || '') || '';
    var card = document.createElement('div');
    card.className = 'mt-shot';
    card.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    var logo = LOGO_PNG || LOGO;
    card.innerHTML = '<img class="mt-shot-mark" src="' + logo + '" alt="" width="420" height="420">' +
      '<header class="mt-shot-h">' +
        '<div class="mt-shot-brand"><img src="' + logo + '" alt="" width="48" height="48"><div><b>' + esc(L('الحديقة الرقمية', 'Digital Garden')) + '</b>' +
        '<span><bdi class="mt-shot-cc" dir="ltr">' + esc(code) + '</bdi>' + (course ? ' · ' + esc(course) : '') + '</span></div></div>' +
        (m ? '<div class="mt-shot-mod"><small>' + esc(L('الوحدة', 'Module')) + '</small><b dir="ltr">' + esc(pad2(m)) + '</b></div>' : '') +
      '</header>' +
      '<div class="mt-shot-sub">' + esc(moduleTitle()) + '</div>' +
      '<div class="mt-shot-paper">' +
        '<div class="mt-shot-t">' + (num ? '<div class="mt-shot-cn"><small>' + esc(L('المفهوم', 'Concept')) + '</small><b dir="ltr">' + esc(pad2(num.textContent)) + '</b></div>' : '') +
        '<h2>' + esc(title) + '</h2></div>' +
      '</div>' +
      '<footer class="mt-shot-f"><span>' + esc(L('ادرسْه كاملاً بثلاثة أعماق، مع أسئلةٍ وبطاقات', 'Study it in full — three depths, questions and flashcards')) + '</span>' +
      '<b dir="ltr">libbard.github.io/Garden</b></footer>';
    card.querySelector('.mt-shot-paper').appendChild(shotBlocks(sec, maths));
    return card;
  }
  function shotDom(sec, X) {
    var roots = [sec];
    var shut = Array.prototype.filter.call(sec.querySelectorAll('details:not([open])'), function (d) { d.open = true; return true; });
    var restore = function () { shut.forEach(function (d) { d.open = false; }); untag(roots); };
    return Promise.all([X.ensureCanvas(), logoReady(), catalogOf(document.documentElement.getAttribute('data-subject') || '')]).then(function (r) {
      return new Promise(function (ok) { setTimeout(function () { ok(r[2]); }, 80); });
    }).then(function (cat) {
      return mathShots(roots, X).then(function (maths) {
        var card = shotCard(sec, maths, cat || {});
        restore();
        return card;
      });
    }, function (e) { restore(); throw e; }).catch(function (e) { restore(); throw e; });
  }
  function shareCard(sec) {
    return exportLib().then(function (X) {
      return shotDom(sec, X).then(function (card) {
        var ph = document.createElement('div');
        ph.className = 'mt-shot-ph';
        document.body.appendChild(ph);
        var bcs = getComputedStyle(document.body), bg = bcs.backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)') bg = getComputedStyle(document.documentElement).backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)') bg = '#0f1117';
        return window.html2canvas(ph, {
          backgroundColor: bg, scale: 3, useCORS: true, logging: false, scrollX: 0, scrollY: 0,
          windowWidth: 1280, windowHeight: 900,
          onclone: function (doc) {
            var c = doc.querySelector('.mt-shot-ph');
            c.appendChild(doc.importNode(card, true));
            c.setAttribute('data-on', '1');
            var st = doc.createElement('style');
            st.textContent = '.mt-shot-ph *, .mt-shot-ph *::before, .mt-shot-ph *::after { animation: none !important; transition: none !important; letter-spacing: normal !important; word-spacing: normal !important; }' +
'';
            doc.head.appendChild(st);
            var paper = c.querySelector('.mt-shot-paper');
            if (paper.scrollHeight > SHOT_MAX) c.querySelector('.mt-shot').setAttribute('data-cut', '1');
            X.fixColors(c);
          }
        }).then(function (cv) {
          ph.remove();
          return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
        }, function (e) { ph.remove(); throw e; });
      });
    });
  }
  /*@3.MOTJ2.5*/
  function actToast(msg, acts) {
    var old = document.querySelector('.mt-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'mt-toast mt-toast--act';
    t.setAttribute('role', 'status');
    var sp = document.createElement('span');
    sp.textContent = msg;
    t.appendChild(sp);
    acts.forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mt-toast-b';
      b.innerHTML = '<i class="fa-solid ' + a.icon + '" aria-hidden="true"></i> ';
      b.appendChild(document.createTextNode(a.label));
      b.addEventListener('click', function () { t.remove(); a.run(); });
      t.appendChild(b);
    });
    document.body.appendChild(t);
    setTimeout(function () { if (t.isConnected) t.remove(); }, 15000);
  }
  function copyBlob(blob) {
    return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  }
  function readyToast(blob, name, file, title) {
    var acts = [];
    if (file && navigator.canShare && navigator.canShare({ files: [file] }) && coarse()) {
      acts.push({ icon: 'fa-share-nodes', label: L('شارِكْها', 'Share it'), run: function () { navigator.share({ files: [file], title: title }).catch(function () {}); } });
    }
    if (navigator.clipboard && window.ClipboardItem) {
      acts.push({ icon: 'fa-copy', label: L('انسخْها', 'Copy it'), run: function () {
        copyBlob(blob).then(function () { toast(L('نُسخت الصورة ✓ — الصقْها حيث شئت', 'Image copied ✓ — paste it anywhere')); },
                            function () { toast(L('تعذّر النسخ — نزّلْها', 'Copy failed — download it')); });
      } });
    }
    acts.push({ icon: 'fa-download', label: L('نزّلْها', 'Download'), run: function () { download(blob, name); } });
    actToast(L('الصورة جاهزة', 'The image is ready'), acts);
  }
  function shareImage(sec) {
    var name = (document.documentElement.getAttribute('data-subject') || 'garden') + '-' + (sec.id || 'concept') + '.png';
    var title = titleOf(sec), made = null;
    toast(L('نصنع الصورة…', 'Making the image…'));
    var blobP = shareCard(sec).then(function (b) { if (!b) throw new Error('blob'); made = b; return b; });
    var fail = function () { toast(L('تعذّر صنعُ الصورة', 'Could not make the image')); };
    if (!coarse() && navigator.clipboard && window.ClipboardItem) {
      var w = null;
      try { w = copyBlob(blobP); } catch (e) { w = null; }
      if (w) {
        return w.then(function () {
          toast(L('نُسخت الصورة ✓ — الصقْها حيث شئت', 'Image copied ✓ — paste it anywhere'));
        }, function () {
          return blobP.then(function (b) { readyToast(b, name, null, title); }, fail);
        });
      }
    }
    return blobP.then(function (blob) {
      var file = null;
      try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { file = null; }
      if (file && coarse() && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: title }).catch(function (e) {
          if (e && e.name === 'AbortError') return;
          readyToast(blob, name, file, title);
        });
      }
      readyToast(blob, name, file, title);
    }, fail);
  }
  /*@3.MOTJ2.7*/
  function noteMd(sec) {
    var title = titleOf(sec), out = '', prevLi = false;
    blocksOf(sec).forEach(function (b, i) {
      if (!i && b.k !== 'code' && b.t.replace(/^\d+\s*/, '').trim() === title) return;
      var s = b.k === 'h' ? '### ' + b.t : b.k === 'li' ? (b.n ? b.n + '. ' : '- ') + b.t : b.k === 'code' ? '```\n' + b.t + '\n```' : b.t;
      out += (out ? (b.k === 'li' && prevLi ? '\n' : '\n\n') : '') + s;
      prevLi = b.k === 'li';
    });
    return out;
  }
  function toNote(sec) {
    var md = noteMd(sec);
    js('module-note.js', function () { return !!window.GardenModNote; }).then(function () {
      return window.GardenModNote.open({ concept: { title: titleOf(sec), md: md }, sec: sec.id });
    }).catch(function () { toQuick(sec); });
  }
  function toQuick(sec) {
    var md = mdOf(sec), id = 'q' + Date.now().toString(36);
    var html = document.documentElement, arr = [];
    try { arr = JSON.parse(localStorage.getItem('quick_notes') || '[]'); if (!Array.isArray(arr)) arr = []; } catch (e) { arr = []; }
    arr.unshift({ id: id, body: '# ' + titleOf(sec) + '\n\n' + md, created_at: Date.now(), updated_at: Date.now(),
                  course: html.getAttribute('data-subject') || '', module: Number(html.getAttribute('data-module')) || undefined,
                  origin: { page: location.pathname + '#' + sec.id, title: moduleTitle() || document.title.split('·')[0].trim() }, tags: [] });
    try { localStorage.setItem('quick_notes', JSON.stringify(arr)); } catch (e2) { toast(L('تعذّر الحفظ', 'Could not save')); return; }
    location.href = ROOT + 'hub/notes.html?adopt=' + encodeURIComponent(id);
  }

  /*@3.MOTJ2.6*/
  var CAT_P = null;
  function catalogOf(code) {
    if (!CAT_P) {
      CAT_P = Promise.race([
        fetch(DIR + 'courses_catalog.json' + (VER ? '?' + VER : '')).then(function (r) { return r.ok ? r.json() : {}; }),
        new Promise(function (r) { setTimeout(function () { r({}); }, 2000); })
      ]).catch(function () { CAT_P = null; return {}; });
    }
    return CAT_P.then(function (c) { return (c && c[code]) || {}; });
  }
  function tplText(host) {
    if (!host) return '';
    var t = host.querySelector('template.content-' + (isAr() ? 'ar' : 'en'));
    var src = t ? t.content : host;
    var box = document.createElement('div');
    box.appendChild(src.cloneNode(true));
    Array.prototype.forEach.call(box.querySelectorAll('li'), function (li) { li.insertBefore(document.createTextNode('\n- '), li.firstChild); });
    Array.prototype.forEach.call(box.querySelectorAll('p, br, h3, h4, tr'), function (p) { p.appendChild(document.createTextNode('\n')); });
    return box.textContent.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  }
  function depthsOf(sec) {
    var names = { flash: L('الخلاصة السريعة', 'Quick summary'), full: L('الشرح الكامل', 'Full explanation'), deep: L('التعمّق', 'Deep dive') };
    var out = [];
    Array.prototype.forEach.call(sec.querySelectorAll('.depth-layer'), function (d) {
      var t = tplText(d);
      if (t) out.push('### ' + (names[d.getAttribute('data-layer')] || d.getAttribute('data-layer')) + '\n' + t);
    });
    if (!out.length) out.push(mdOf(sec));
    Array.prototype.forEach.call(sec.querySelectorAll('pre'), function (p) {
      var lang = (p.closest('.code-block') && p.closest('.code-block').querySelector('.code-block-header span')) || null;
      out.push('```' + (lang ? lang.textContent.trim().toLowerCase() : '') + '\n' + p.textContent.replace(/\s+$/, '') + '\n```');
    });
    Array.prototype.forEach.call(sec.querySelectorAll('.formula-block, .math-block'), function (f) {
      if (f.classList.contains('formula-block') || !f.closest('.formula-block')) {
        var tex = f.querySelector('.math-block');
        var raw = tex ? (tex.getAttribute('data-tex') || '') : '';
        var cap = tplText(f.querySelector('[data-bilingual]'));
        var m = window.MathJax && MathJax.startup && MathJax.startup.document && tex ? MathJax.startup.document.getMathItemsWithin(tex) : null;
        if (!raw && m && m.length) raw = m.map(function (x) { return x.math; }).join('  ');
        if (raw || cap) out.push((cap ? cap + '\n' : '') + (raw ? '$$' + raw + '$$' : ''));
      }
    });
    var q = sec.querySelector('.thinking-question');
    if (q) out.push('### ' + L('سؤالُ تفكير', 'Thinking question') + '\n' + tplText(q.querySelector('summary')) + '\n' + L('الجواب: ', 'Answer: ') + tplText(q.querySelector('div')));
    return out.join('\n\n');
  }
  function professorVoice() {
    var t = tplText(document.querySelector('#professor .professor-text'));
    return t.length > 700 ? t.slice(0, 700).replace(/\s+\S*$/, '') + ' …' : t;
  }
  function aiPrompt(sec, sel) {
    var h = document.documentElement, code = h.getAttribute('data-subject') || '', m = h.getAttribute('data-module') || '';
    var num = sec.querySelector('.concept-number'), title = titleOf(sec);
    return catalogOf(code).then(function (cat) {
      var course = L(cat.name_ar || cat.name_en || '', cat.name_en || cat.name_ar || ''), book = cat.textbook || '';
      var who = L(cat.persona_ar || 'أستاذُ هذه المادّة', cat.persona_en || 'this course\'s professor');
      var near = L(cat.analogy_ar || '', cat.analogy_en || ''), guard = L(cat.guard_ar || '', cat.guard_en || '');
      var ctx = [
        L('المادّة: ', 'Course: ') + code + (course ? ' — ' + course : ''),
        book ? L('الكتابُ المقرّر: ', 'Textbook: ') + book : '',
        L('الوحدة ', 'Module ') + m + ': ' + moduleTitle(),
        L('المفهوم ', 'Concept ') + (num ? num.textContent.trim() : '') + ': ' + title
      ].filter(Boolean).join('\n');
      var voice = professorVoice(), s = String(sel || '').replace(/\s+/g, ' ').trim();
      var ask = s ? L(
        'أنت ' + who + '. أريد أن أفهم هذا النصَّ تحديداً من المفهوم:\n«' + s + '»\n\n' +
        'اشرحْه هو لا المفهومَ كلَّه:\n' +
        '1. معناه بلغةٍ بسيطة، وكلُّ مصطلحٍ أو رمزٍ فيه بالعربيّة والإنجليزيّة.\n' +
        '2. أين يقع من المفهوم ولماذا يهمّ.\n' +
        '3. مثالٌ محلولٌ خطوةً بخطوة يستعمله.\n' +
        '4. خطأٌ شائعٌ يقع فيه الطلاب عنده.\n' +
        '5. سؤالان قصيران لأختبر فهمي، والإجاباتُ في آخر الردّ.',
        'You are ' + who + '. I want to understand this exact passage from the concept:\n"' + s + '"\n\n' +
        'Explain it — not the whole concept:\n' +
        '1. What it means in plain words, with every term or symbol in it explained.\n' +
        '2. Where it sits in the concept and why it matters.\n' +
        '3. One worked example that uses it, step by step.\n' +
        '4. A common mistake students make with it.\n' +
        '5. Two short questions to test me, answers at the very end.') : L(
        'أنت ' + who + '. اشرحْ لي هذا المفهومَ شرحاً كاملاً وشاملاً:\n' +
        '1. الفكرةُ في جملتين، ثمّ الشرحُ المفصّل بلغةٍ بسيطة.\n' +
        '2. كلُّ مصطلحٍ بالعربيّة والإنجليزيّة.\n' +
        '3. مثالان محلولان خطوةً بخطوة: سهلٌ ثمّ بمستوى الامتحان.\n' +
        '4. الأخطاءُ الشائعة وكيف أتجنّبها.\n' +
        '5. ثلاثةُ أسئلةٍ متدرّجة لأختبر فهمي، والإجاباتُ في آخر الردّ.',
        'You are ' + who + '. Explain this concept completely:\n' +
        '1. The idea in two sentences, then a detailed plain-language explanation.\n' +
        '2. Every key term defined.\n' +
        '3. Two worked examples, step by step: an easy one, then exam level.\n' +
        '4. Common mistakes and how to avoid them.\n' +
        '5. Three graded questions to test me, answers at the very end.');
      var how = [near ? L('قرّبِ الفكرةَ بتشبيهاتٍ من: ', 'Bring it close with analogies from: ') + near : '',
                 guard ? L('تنبيه: ', 'Note: ') + guard : '',
                 book ? L('التزمْ مصطلحاتِ الكتاب المقرّر ورموزَه.', 'Stick to the textbook\'s terms and notation.') : ''].filter(Boolean).join('\n');
      return ask + (how ? '\n' + how : '') + '\n\n' + L('## السياق', '## Context') + '\n' + ctx + '\n\n' +
        L('## ما في صفحة المذاكرة عن هذا المفهوم (مرجعٌ لك — لا تكرّره حرفيّاً)', '## What my study page says about this concept (reference for you — don\'t repeat it verbatim)') + '\n' +
        depthsOf(sec) +
        (voice ? '\n\n' + L('## أسلوبُ أستاذ المادّة (تحدّثْ بروحه)', '## The course professor\'s voice (speak in this spirit)') + '\n' + voice : '') +
        '\n\n' + L('أجبْ بالعربيّة، واترك المصطلحاتِ والكودَ والمعادلاتِ بالإنجليزيّة.', 'Answer in English.');
    });
  }
  function copyLater(p) {
    var done = function () { toast(L('نُسخ ✓', 'Copied ✓')); };
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        return navigator.clipboard.write([new ClipboardItem({ 'text/plain': p.then(function (t) { return new Blob([t], { type: 'text/plain' }); }) })]).then(done, function () {
          return p.then(copyText);
        });
      } catch (e) {}
    }
    return p.then(copyText);
  }

  function focusOn(sec) {
    var main = document.querySelector('.main-content');
    if (!main) return;
    var on = sec && !sec.classList.contains('mt-focused');
    Array.prototype.forEach.call(main.querySelectorAll('.mt-focused'), function (s) { s.classList.remove('mt-focused'); });
    main.classList.toggle('mt-focus', !!on);
    if (on) { sec.classList.add('mt-focused'); sec.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  }

  function slidesHref() { var a = document.getElementById('sidebar-slides-btn'); return a ? a.href : ''; }
  function smart(x, y, ctx) {
    ctx = ctx || {};
    return Promise.all([menuLib(), ink().catch(function () { return null; })]).then(function (r) {
      var M = r[0], I = r[1], sec = ctx.sec, h = '';
      var hit = ctx.hit || null, word = ctx.word || null;
      if (hit) {
        var cur = (hit.ta && hit.ta.c) || '', hs = (hit.ta && hit.ta.x) ? 'text' : ((hit.ta && hit.ta.u) ? 'under' : 'fill');
        h += M.head({ fill: L('النصُّ المظلَّل', 'Highlighted text'), under: L('النصُّ المسطَّر', 'Underlined text'), text: L('النصُّ الملوَّن', 'Coloured text') }[hs]);
        h += '<div class="mt-mrow">' + stTabs(hs, 'data-mst') + '</div><div class="mt-mdots" role="group">' + hitDots(hs, cur) + '</div>';
        h += M.item('pal', 'fa-palette', L('لوحاتُ الألوان…', 'Colour palettes…'));
        if (hit.ta && hit.ta.n) h += M.item('hl-peek', 'fa-note-sticky', L('اعرضْ ملاحظتَك عليه', 'Show your note on it'));
        h += M.item('hl-copy', 'fa-copy', L('انسخِ النصّ', 'Copy the text'));
        h += M.item('hl-del', 'fa-eraser', L('أزِلْه', 'Remove it'), { danger: true });
        h += M.sep();
      }
      if (ctx.text && !hit) {
        h += M.head(L('النصُّ المحدَّد', 'Selected text'));
        h += M.item('sel-copy', 'fa-copy', L('انسخْه', 'Copy it'));
        if (ctx.onNote) h += M.item('sel-note', 'fa-pen-to-square', L('ملاحظةٌ عليه', 'A note on it'));
        if (hasLatin(ctx.text)) h += M.item('sel-tr', 'fa-language', L('ترجمْه', 'Translate it'));
        h += M.sep();
      } else if (word) {
        h += M.item('word-tr', 'fa-language', L('ترجمْ «', 'Translate “') + word.text + L('»', '”'));
        h += M.sep();
      }
      if (sec) {
        h += M.head(titleOf(sec).slice(0, 48) || L('هذا المفهوم', 'This concept'));
        h += M.item('c-text', 'fa-file-lines', L('انسخِ المفهومَ نصّاً', 'Copy the concept as text'));
        h += M.item('c-img', 'fa-image', L('شاركْه صورةً جميلة', 'Share it as an image'));
        h += M.item('c-ai', 'fa-wand-magic-sparkles', ctx.text && !hit ? L('انسخْ سؤالاً للذكاء عن النصِّ المحدَّد', 'Copy an AI prompt about the selected text') : L('انسخْه مع سؤالٍ للذكاء الاصطناعيّ', 'Copy it with a prompt for an AI'));
        h += M.item('c-note', 'fa-note-sticky', L('أضِفْه إلى ملاحظات الوحدة', 'Add it to the module notes'));
        h += M.item('c-link', 'fa-link', L('انسخْ رابطاً إليه', 'Copy a link to it'));
        h += M.item('c-focus', 'fa-crosshairs', sec.classList.contains('mt-focused') ? L('أنهِ التركيز', 'Stop focusing') : L('ركّزْ عليه وحدَه', 'Focus on it alone'));
        h += M.sep();
      }
      h += M.head(L('هذه الوحدة', 'This module'));
      if (I) h += M.item('m-ink', 'fa-pen-nib', I.isOn() ? L('أغلقِ الدفتر', 'Close the notebook') : L('افتحِ الدفترَ للرسم والتظليل', 'Open the notebook to draw and highlight'));
      if (peekHidden()) h += M.item('m-peek', 'fa-eye', L('أظهِرْ نوافذَ الملاحظات على النصّ', 'Show note windows on the text'));
      if (slidesHref()) h += M.item('m-slides', 'fa-chalkboard', L('ادرسِ السلايداتِ الأصليّة', 'Study the original slides'));
      h += M.item('m-quiz', 'fa-clipboard-question', L('اختبرْ نفسك', 'Test yourself'));
      if (I && I.keep && window.CSS && CSS.highlights) h += M.item('m-keep', I.keep() ? 'fa-square-check' : 'fa-square', L('أبقِ التظليلَ ظاهراً خارجَ الدفتر', 'Keep highlights showing outside the notebook'));
      if (!coarse()) h += '<div class="mt-mfoot">' + esc(L('Shift + الزرُّ الأيمن: قائمةُ المتصفّح', 'Shift + right-click: the browser menu')) + '</div>';
      var mel = M.open(x, y, h, function (a) {
        if (a.indexOf('c:') === 0 && hit) { I.editHighlight(hit.ta, 'color', a.slice(2)); return; }
        if (a === 'pal') { palDialog(false); return; }
        if (a === 'hl-peek' && hit) { js('module-peek.js', function () { return !!window.GardenModPeek; }).then(function () { window.GardenModPeek.on(); window.GardenModPeek.show(hit, { hold: 1 }); }); return; }
        if (a === 'hl-copy' && hit) { copyText(hit.ta.t); return; }
        if (a === 'hl-del' && hit) { I.editHighlight(hit.ta, 'del').then(function (n) { if (n) toast(L('أُزيل ✓', 'Removed ✓')); }); return; }
        if (a === 'sel-copy') { copyText(ctx.text); return; }
        if (a === 'sel-note' && ctx.onNote) { ctx.onNote(); return; }
        if (a === 'sel-tr') { translate(ctx.text, ctx.range ? ctx.range.getBoundingClientRect() : null); return; }
        if (a === 'word-tr' && word) { translate(word.text, word.rect); return; }
        if (a === 'c-text') { copyText(mdOf(sec)); return; }
        if (a === 'c-img') { shareImage(sec); return; }
        if (a === 'c-ai') { copyLater(aiPrompt(sec, ctx.text && !hit ? ctx.text : '')); return; }
        if (a === 'c-note') { toNote(sec); return; }
        if (a === 'c-link') { copyText(location.origin + location.pathname + '#' + sec.id); return; }
        if (a === 'c-focus') { focusOn(sec); return; }
        if (a === 'm-ink' && I) { var b = document.querySelector('[data-gh-ink]'); if (b) I.bind(b); I.toggle(); return; }
        if (a === 'm-peek') { try { localStorage.removeItem('garden_peek_off'); } catch (eP) {} toast(L('عادت نوافذُ الملاحظات ✓', 'Note windows are back ✓')); return; }
        if (a === 'm-slides') { location.href = slidesHref(); return; }
        if (a === 'm-quiz') {
          var html = document.documentElement;
          location.href = ROOT + 'hub/quiz.html?c=' + encodeURIComponent(html.getAttribute('data-subject') || '') + '&m=' + encodeURIComponent(html.getAttribute('data-module') || '');
          return;
        }
        if (a === 'm-keep' && I) { I.keep(!I.keep()); }
      }, { label: L('خياراتٌ ذكيّة', 'Smart options'), cls: 'mt-menu' });
      if (hit && mel) mel.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('[data-mst]') : null;
        if (!t || !mel.contains(t)) return;
        var k = t.getAttribute('data-mst');
        if (k === hs) return;
        I.editHighlight(hit.ta, 'style', k).then(function (n) {
          if (!n) return;
          hs = k;
          if (k === 'text') hit.ta.x = 1; else delete hit.ta.x;
          if (k === 'under') hit.ta.u = 1; else delete hit.ta.u;
          [].forEach.call(mel.querySelectorAll('[data-mst]'), function (q) { q.setAttribute('aria-checked', q.getAttribute('data-mst') === k ? 'true' : 'false'); });
          var dd = mel.querySelector('.mt-mdots');
          if (dd) dd.innerHTML = hitDots(k, (hit.ta && hit.ta.c) || '');
          var hh = mel.querySelector('.gsf-menu-h');
          if (hh) hh.textContent = { fill: L('النصُّ المظلَّل', 'Highlighted text'), under: L('النصُّ المسطَّر', 'Underlined text'), text: L('النصُّ الملوَّن', 'Coloured text') }[k];
        });
      });
    });
  }
  function hitDots(hs, cur) {
    var p = palFor(hs);
    return p.concat(ALL_HI.filter(function (c) { return p.indexOf(c) < 0 && !(hs === 'text' && (c === 'yellow' || c === 'lime')); }).slice(0, 3)).map(function (c) {
      return dotHtml(c, dotKind(hs), cur, 'role="menuitem" data-act="c:' + esc(c) + '"') + lbl(nameOf(c, hs), nameOf(c, hs, 1)) + '></button>';
    }).join('');
  }

  function onContext(e, o) {
    if (e.shiftKey || e.defaultPrevented) return false;
    var t = e.target;
    if (!t || !t.closest || t.closest('a[href], input, textarea, select, [contenteditable="true"], .mt-sel, .gsf-menu, dialog')) return false;
    var main = document.querySelector('.main-content');
    if (!main || !main.contains(t)) return false;
    var I = window.GardenModuleInk;
    if (I && I.isOn && I.isOn()) return false;
    e.preventDefault();
    var sel = window.getSelection(), text = sel ? String(sel).trim() : '', range = (text && sel.rangeCount) ? sel.getRangeAt(0).cloneRange() : null;
    if (range && !main.contains(range.commonAncestorContainer)) { range = null; text = ''; }
    var hit = (I && I.keptAt) ? I.keptAt(e.clientX, e.clientY) : null;
    smart(e.clientX, e.clientY, { sec: secOf(t), text: text, range: range, hit: hit, word: text ? null : wordAt(e.clientX, e.clientY),
                                  onNote: o && o.onNote && text ? o.onNote : null });
    return true;
  }

  function hlMenu(hit, x, y) { return smart(x, y, { hit: hit, sec: secOf(hit.rg.startContainer) }); }

  window.GardenModTools = { sel: showSel, hideSel: hideSel, smart: smart, onContext: onContext, hlMenu: hlMenu,
                            shareCard: shareCard, shareImage: shareImage, aiPrompt: aiPrompt, shotDom: function (sec) { return exportLib().then(function (X) { return shotDom(sec, X); }); }, md: mdOf, focus: focusOn };
})();
