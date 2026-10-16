;(function () {
  'use strict';

  var KEY = 'garden_notes_swatches';
  var MAX = 8;

  /*@3.NOSJ5.7*/
  var CSS_READY = (function () {
    var me = document.currentScript, src = (me && me.src) || '';
    var l = document.querySelector('link[href*="notes-swatch.css"]');
    if (!l) {
      if (!src) return Promise.resolve();
      l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = src.replace(/notes-swatch\.js(\?.*)?$/, 'notes-swatch.css$1');
      document.head.appendChild(l);
    }
    if (l.sheet) return Promise.resolve();
    return new Promise(function (ok) { l.addEventListener('load', ok); l.addEventListener('error', ok); setTimeout(ok, 3000); });
  })();

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function norm(v) {
    var s = String(v == null ? '' : v).trim().toLowerCase();
    if (s.charAt(0) !== '#') s = '#' + s;
    if (/^#[0-9a-f]{3}$/.test(s)) {
      return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    }
    return /^#[0-9a-f]{6}$/.test(s) ? s : '';
  }

  function read() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }

  function write(o) {
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }

  function bucket(kind) {
    var o = read();
    var b = o[kind] || {};
    return {
      recent: (b.recent || []).map(norm).filter(Boolean),
      pinned: (b.pinned || []).map(norm).filter(Boolean)
    };
  }

  function save(kind, b) {
    var o = read();
    o[kind] = { recent: b.recent.slice(0, MAX), pinned: b.pinned.slice(0, MAX) };
    write(o);
  }

  /*@3.NOSJ5.1*/
  function push(kind, hex) {
    var v = norm(hex);
    if (!v) return false;
    var b = bucket(kind);
    if (b.pinned.indexOf(v) > -1) return true;
    b.recent = [v].concat(b.recent.filter(function (x) { return x !== v; }));
    var room = Math.max(0, MAX - b.pinned.length);
    b.recent = b.recent.slice(0, room);
    save(kind, b);
    return true;
  }

  function togglePin(kind, hex) {
    var v = norm(hex);
    if (!v) return false;
    var b = bucket(kind);
    if (b.pinned.indexOf(v) > -1) {
      b.pinned = b.pinned.filter(function (x) { return x !== v; });
      b.recent = [v].concat(b.recent.filter(function (x) { return x !== v; }));
    } else {
      b.pinned = [v].concat(b.pinned.filter(function (x) { return x !== v; })).slice(0, MAX);
      b.recent = b.recent.filter(function (x) { return x !== v; });
    }
    var room = Math.max(0, MAX - b.pinned.length);
    b.recent = b.recent.slice(0, room);
    save(kind, b);
    return true;
  }

  function all(kind) {
    var b = bucket(kind);
    var out = b.pinned.map(function (h) { return { hex: h, pin: 1 }; });
    b.recent.forEach(function (h) {
      if (!out.some(function (x) { return x.hex === h; })) out.push({ hex: h, pin: 0 });
    });
    return out.slice(0, MAX);
  }

  /*@3.NOSJ5.2*/
  function html(kind) {
    var items = all(kind);
    var h = '<div class="nsw" data-swkind="' + esc(kind) + '">' +
      '<div class="nr-pop-h">' + esc(L('لونٌ مخصّص', 'Custom colour')) + '</div>';
    if (items.length) {
      h += '<div class="nsw-row">' + items.map(function (it) {
        return '<span class="nsw-cell' + (it.pin ? ' is-pin' : '') + '">' +
          '<button type="button" class="nsw-sw" data-swatch="' + esc(it.hex) + '"' +
          ' style="--t:' + esc(it.hex) + '" aria-label="' +
          esc(L('استعمل ', 'Use ') + it.hex) + '"></button>' +
          '<button type="button" class="nsw-pin" data-pin="' + esc(it.hex) + '"' +
          ' aria-pressed="' + (it.pin ? 'true' : 'false') + '" aria-label="' +
          esc(it.pin ? L('ألغِ تثبيت ', 'Unpin ') + it.hex : L('ثبّتْ ', 'Pin ') + it.hex) +
          '"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i></button>' +
          '</span>';
      }).join('') + '</div>';
    }
    h += '<div class="nsw-hex">' +
      '<input type="text" class="nsw-in" data-hexin="' + esc(kind) + '"' +
      ' spellcheck="false" dir="ltr" inputmode="latin" maxlength="7" placeholder="#7C3AED"' +
      ' aria-label="' + esc(L('رمزُ اللون', 'Colour code')) + '">' +
      '<button type="button" class="nsw-go" data-hexgo="' + esc(kind) + '" aria-label="' +
      esc(L('طبّقِ الرمز', 'Apply code')) + '"><i class="fa-solid fa-check" aria-hidden="true"></i></button>' +
      '<button type="button" class="nsw-eye" data-custom="' + esc(kind) + '" aria-label="' +
      esc(L('اختر من اللوحة', 'Pick from the palette')) +
      '"><i class="fa-solid fa-eye-dropper" aria-hidden="true"></i></button>' +
      '</div></div>';
    return h;
  }


  /*@3.NOSJ5.5*/
  function hsv2hex(h, sv, vv) {
    var c = vv * sv, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = vv - c;
    var r = 0, g = 0, b = 0, k = Math.floor(h / 60) % 6;
    if (k === 0) { r = c; g = x; }
    else if (k === 1) { r = x; g = c; }
    else if (k === 2) { g = c; b = x; }
    else if (k === 3) { g = x; b = c; }
    else if (k === 4) { r = x; b = c; }
    else { r = c; b = x; }
    function h2(v) { var t = Math.round((v + m) * 255).toString(16); return t.length < 2 ? '0' + t : t; }
    return '#' + h2(r) + h2(g) + h2(b);
  }

  function hex2hsv(hex) {
    var v = norm(hex) || '#7c3aed';
    var r = parseInt(v.slice(1, 3), 16) / 255,
        g = parseInt(v.slice(3, 5), 16) / 255,
        b = parseInt(v.slice(5, 7), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    var h = 0;
    if (d) {
      if (mx === r) h = 60 * (((g - b) / d) % 6);
      else if (mx === g) h = 60 * (((b - r) / d) + 2);
      else h = 60 * (((r - g) / d) + 4);
    }
    if (h < 0) h += 360;
    return { h: h, s: mx ? d / mx : 0, v: mx };
  }

  /*@3.NOSJ5.8*/
  function board(anchor, current, cb, o) {
    closeBoard();
    o = o || {};
    var st = hex2hsv(current), pre = o.presets || [];
    var host = (anchor && anchor.closest && anchor.closest('dialog[open]')) || document.body;
    var el = document.createElement('div');
    el.className = 'nsw-bd';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', L('لوحُ الألوان', 'Colour board'));
    el.innerHTML =
      (pre.length ? '<div class="nsw-pre" role="group" aria-label="' + esc(L('ألوانٌ جاهزة', 'Ready colours')) + '">' + pre.map(function (x) {
        return '<button type="button" class="nsw-pre-b" data-pre="' + esc(x.v) + '" style="--t:' + esc(x.hex) + '" aria-label="' + esc(x.name || x.v) + '" title="' + esc(x.name || x.v) + '"></button>';
      }).join('') + '</div><div class="nsw-pre-l">' + esc(L('أو لونٌ مخصّص', 'Or a custom colour')) + '</div>' : '') +
      '<div class="nsw-sv" data-sv><span class="nsw-knob" data-knob></span></div>' +
      '<input type="range" class="nsw-hue" data-hue min="0" max="359" step="1"' +
      ' aria-label="' + esc(L('الصبغة', 'Hue')) + '">' +
      '<div class="nsw-bd-f">' +
      '<span class="nsw-prev" data-prev aria-hidden="true"></span>' +
      '<input type="text" class="nsw-in" data-bdhex spellcheck="false" dir="ltr"' +
      ' maxlength="7" aria-label="' + esc(L('رمزُ اللون', 'Colour code')) + '">' +
      '<button type="button" class="nsw-go" data-bdok aria-label="' +
      esc(L('طبّق', 'Apply')) + '"><i class="fa-solid fa-check" aria-hidden="true"></i></button>' +
      '</div>';
    host.appendChild(el);

    var sv = el.querySelector('[data-sv]');
    var knob = el.querySelector('[data-knob]');
    var hue = el.querySelector('[data-hue]');
    var prev = el.querySelector('[data-prev]');
    var hexf = el.querySelector('[data-bdhex]');

    function paint(live) {
      var hex = hsv2hex(st.h, st.s, st.v);
      el.style.setProperty('--h', String(Math.round(st.h)));
      knob.style.insetInlineStart = '';
      knob.style.left = (st.s * 100) + '%';
      knob.style.top = ((1 - st.v) * 100) + '%';
      knob.style.setProperty('--t', hex);
      prev.style.setProperty('--t', hex);
      if (document.activeElement !== hexf) hexf.value = hex;
      hue.value = String(Math.round(st.h));
      if (live) cb(hex, false);
      return hex;
    }

    function fromPoint(e) {
      el.__dirty = 1;
      var r = sv.getBoundingClientRect();
      st.s = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
      st.v = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)));
      paint(true);
    }

    sv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      try { sv.setPointerCapture(e.pointerId); } catch (err) {}
      fromPoint(e);
    });
    sv.addEventListener('pointermove', function (e) {
      if (e.buttons & 1) fromPoint(e);
    });
    hue.addEventListener('input', function () { el.__dirty = 1; st.h = parseFloat(hue.value) || 0; paint(true); });
    el.addEventListener('click', function (e) {
      var pb = e.target.closest ? e.target.closest('[data-pre]') : null;
      if (!pb) return;
      e.preventDefault(); e.stopPropagation();
      cb(pb.getAttribute('data-pre'), true);
      closeBoard();
    });
    hexf.addEventListener('input', function () {
      el.__dirty = 1;
      var v = norm(hexf.value);
      if (!v) return;
      st = hex2hsv(v);
      paint(true);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closeBoard(); return; }
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
    });
    el.querySelector('[data-bdok]').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); commit();
    });

    function commit() {
      var hex = norm(hexf.value) || hsv2hex(st.h, st.s, st.v);
      push(kindOf(el), hex);
      cb(hex, true);
      closeBoard();
    }
    el.__commit = commit;

    var r = anchor ? anchor.getBoundingClientRect()
                   : { left: innerWidth / 2, bottom: innerHeight / 2, top: innerHeight / 2 };
    el.style.position = 'fixed';
    el.style.insetBlockStart = Math.round(Math.max(8, Math.min(innerHeight - (pre.length ? 330 : 250), r.bottom + 6))) + 'px';
    el.style.left = Math.round(Math.max(8, Math.min(innerWidth - 232, r.left - 90))) + 'px';
    paint(false);
    _board = el;
    setTimeout(function () {
      document.addEventListener('pointerdown', outside, true);
    }, 0);
    return el;
  }

  var _board = null;
  var _kind = 'fg';
  function kindOf() { return _kind; }

  function outside(e) {
    if (!_board || _board.contains(e.target)) return;
    var go = _board.__dirty && _board.__commit;
    if (go) go(); else closeBoard();
  }

  function closeBoard() {
    document.removeEventListener('pointerdown', outside, true);
    if (_board) { try { _board.remove(); } catch (e) {} _board = null; }
  }

  /*@3.NOSJ5.3*/
  function openNative(anchor, current, cb) {
    var inp = document.createElement('input');
    inp.type = 'color';
    inp.value = norm(current) || '#7c3aed';
    var r = anchor ? anchor.getBoundingClientRect()
                   : { left: innerWidth / 2, bottom: innerHeight / 2, width: 0, height: 0 };
    inp.style.cssText = 'position:fixed;inline-size:' + Math.max(1, Math.round(r.width)) +
      'px;block-size:' + Math.max(1, Math.round(r.height)) + 'px;opacity:0;border:0;padding:0;' +
      'pointer-events:none;inset-block-start:' + Math.round(r.top) + 'px;' +
      'inset-inline-start:auto;left:' + Math.round(r.left) + 'px;z-index:2147483647';
    document.body.appendChild(inp);
    var done = false;
    function fire() {
      if (done) return;
      done = true;
      var v = norm(inp.value);
      if (v) cb(v);
      setTimeout(function () { try { inp.remove(); } catch (e) {} }, 0);
    }
    inp.addEventListener('change', fire);
    inp.addEventListener('blur', function () { setTimeout(fire, 120); });
    try { inp.click(); } catch (e) { try { inp.remove(); } catch (e2) {} }
    return inp;
  }

  /*@3.NOSJ5.4*/
  function bind(host, kind, apply, repaint) {
    if (!host) return;
    host.addEventListener('click', function (e) {
      var pin = e.target.closest('[data-pin]');
      if (pin) {
        e.preventDefault();
        e.stopPropagation();
        togglePin(kind, pin.getAttribute('data-pin'));
        if (repaint) repaint();
        return;
      }
      var sw = e.target.closest('[data-swatch]');
      if (sw) {
        e.preventDefault();
        e.stopPropagation();
        var hv = norm(sw.getAttribute('data-swatch'));
        if (hv) { push(kind, hv); apply(hv, true); }
        return;
      }
      var go = e.target.closest('[data-hexgo]');
      if (go) {
        e.preventDefault();
        e.stopPropagation();
        var fld = host.querySelector('[data-hexin]');
        var hx = norm(fld && fld.value);
        if (hx) { push(kind, hx); apply(hx, true); }
        else if (fld) { fld.setAttribute('aria-invalid', 'true'); fld.focus(); }
        return;
      }
      var eye = e.target.closest('[data-custom]');
      if (eye) {
        e.preventDefault();
        e.stopPropagation();
        _kind = kind;
        var seed = (host.querySelector('[data-hexin]') || {}).value;
        board(eye, seed, function (v, done) {
          if (done) push(kind, v);
          apply(v, done);
        });
      }
    });
    host.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var fld = e.target.closest('[data-hexin]');
      if (!fld) return;
      e.preventDefault();
      var hx = norm(fld.value);
      if (hx) { push(kind, hx); apply(hx, true); }
      else fld.setAttribute('aria-invalid', 'true');
    });
    host.addEventListener('input', function (e) {
      var fld = e.target.closest('[data-hexin]');
      if (fld) fld.removeAttribute('aria-invalid');
    });
  }

  /*@3.NOSJ5.6*/
  var PL_KEY = 'garden_ink_palettes', PL_REC_KEY = 'garden_ink_recent_colors';
  var PL_MAX = 12, PL_LISTS_MAX = 24, PL_REC_MAX = 8, PL_OLD = 3;
  var PL_TONES = ['ink', 'red', 'orange', 'yellow', 'lime', 'emerald', 'teal', 'sky', 'indigo', 'violet',
                  'pink', 'brown', 'white', 'black', 'amber', 'rose'];
  var PL_DEFAULTS = {
    pen: [['ink', 'red', 'sky', 'emerald', 'orange', 'violet'],
          ['teal', 'indigo', 'brown', 'pink', 'lime', 'ink'],
          ['red', 'orange', 'yellow', 'lime', 'sky', 'pink'],
          ['ink', 'sky', 'red', 'emerald', 'amber', 'violet'],
          ['violet', 'sky', 'teal', 'emerald', 'orange', 'pink'],
          ['indigo', 'emerald', 'orange', 'sky', 'red', 'ink'],
          ['red', 'emerald', 'orange', 'sky', 'violet', 'ink'],
          ['red', 'orange', 'amber', 'brown', 'rose', 'ink'],
          ['indigo', 'sky', 'teal', 'emerald', 'violet', 'ink'],
          ['brown', 'amber', 'emerald', 'teal', 'orange', 'ink'],
          ['pink', 'lime', 'sky', 'yellow', 'violet', 'teal'],
          ['ink', 'indigo', 'brown', 'teal', 'rose', 'emerald'],
          ['red', 'orange', 'yellow', 'emerald', 'sky', 'violet']],
    hi:  [['yellow', 'lime', 'sky', 'pink', 'orange', 'violet'],
          ['amber', 'emerald', 'teal', 'rose', 'indigo', 'brown'],
          ['yellow', 'pink', 'sky', 'lime', 'red', 'teal'],
          ['yellow', 'sky', 'emerald', 'pink', 'orange', 'violet'],
          ['pink', 'sky', 'lime', 'violet', 'amber', 'teal'],
          ['lime', 'emerald', 'teal', 'yellow', 'pink', 'sky'],
          ['orange', 'rose', 'amber', 'red', 'violet', 'pink'],
          ['sky', 'teal', 'indigo', 'emerald', 'violet', 'lime'],
          ['red', 'amber', 'emerald', 'yellow', 'orange', 'sky'],
          ['red', 'orange', 'yellow', 'lime', 'sky', 'violet'],
          ['teal', 'indigo', 'brown', 'emerald', 'violet', 'rose'],
          ['yellow', 'pink', 'lime', 'orange', 'sky', 'emerald'],
          ['amber', 'sky', 'rose', 'lime', 'indigo', 'teal']]
  };
  var PL_NAMES = {
    pen: [['أساسيّ', 'Basic'], ['هادئ', 'Calm'], ['زاهٍ', 'Bright'], ['مذاكرة', 'Study'], ['خريطةٌ ذهنيّة', 'Mind map'],
          ['كود', 'Code'], ['تصحيح', 'Marking'], ['دافئ', 'Warm'], ['بارد', 'Cool'], ['ترابيّ', 'Earthy'],
          ['نيون', 'Neon'], ['رصين', 'Sober'], ['قوسُ قزح', 'Rainbow']],
    hi:  [['للمراجعة', 'Revision'], ['هادئ', 'Soft'], ['مفاتيحُ الامتحان', 'Exam keys'], ['تعريفٌ ومثال', 'Definition & example'],
          ['باستيل', 'Pastel'], ['ربيع', 'Spring'], ['غروب', 'Sunset'], ['محيط', 'Ocean'], ['إشارات', 'Signals'],
          ['قوسُ قزح', 'Rainbow'], ['رصين', 'Sober'], ['حيويّ', 'Lively'], ['للحفظ', 'Memorise']]
  };
  var TONE_AR = { ink: 'الحبر', red: 'أحمر', orange: 'برتقالي', yellow: 'أصفر', lime: 'ليموني', emerald: 'أخضر',
                  teal: 'فيروزي', sky: 'أزرق', indigo: 'نيلي', violet: 'بنفسجي', pink: 'زهري', brown: 'بنّي',
                  amber: 'كهرماني', rose: 'وردي', white: 'أبيض', black: 'أسود' };
  var TONE_EN = { ink: 'Ink', red: 'Red', orange: 'Orange', yellow: 'Yellow', lime: 'Lime', emerald: 'Green',
                  teal: 'Teal', sky: 'Blue', indigo: 'Indigo', violet: 'Violet', pink: 'Pink', brown: 'Brown',
                  amber: 'Amber', rose: 'Rose', white: 'White', black: 'Black' };
  function toneName(c) { return TONE_AR[c] ? L(TONE_AR[c], TONE_EN[c]) : c; }
  function digits(n) {
    return isAr() ? String(n).replace(/\d/g, function (ch) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+ch); }) : String(n);
  }
  function plOk(c) { return typeof c === 'string' && (PL_TONES.indexOf(c) >= 0 || /^#[0-9a-f]{6}$/i.test(c)); }
  function plName(kind, i, list) {
    var j, s = list ? list.join(',') : '';
    for (j = 0; j < PL_DEFAULTS[kind].length; j++) {
      if (s === PL_DEFAULTS[kind][j].join(',')) return L(PL_NAMES[kind][j][0], PL_NAMES[kind][j][1]);
    }
    return L('لوحتي ', 'My palette ') + digits(i + 1);
  }
  function plRing(P) {
    var every = P.lists.map(function (l, i) { return i; });
    if (P.rot === 'all') return every;
    var pin = (P.pin || []).filter(function (i) { return i >= 0 && i < P.lists.length; });
    return pin.length ? pin : every;
  }
  function plNext(P) {
    var ring = plRing(P), at = ring.indexOf(P.cur);
    return ring[(at + 1) % ring.length];
  }
  function plRead() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(PL_KEY) || 'null'); } catch (e) {}
    var out = { v: 1 };
    ['pen', 'hi'].forEach(function (k) {
      var src = d && d[k], lists = [], cur = 0, pin = null, rot = 'pin';
      if (src && Array.isArray(src.lists)) {
        src.lists.forEach(function (l) {
          if (lists.length >= PL_LISTS_MAX) return;
          lists.push({ c: (l && Array.isArray(l.c)) ? l.c.filter(plOk).slice(0, PL_MAX) : [] });
        });
        cur = Math.max(0, Math.min(lists.length - 1, Number(src.cur) || 0));
        if (Array.isArray(src.pin)) pin = src.pin.filter(function (i) { return i >= 0 && i < lists.length; });
        if (src.rot === 'all') rot = 'all';
        if (!src.x10 && lists.length) {
          if (!pin) pin = lists.map(function (l, i) { return i; });
          var have = lists.map(function (l) { return l.c.join(','); });
          PL_DEFAULTS[k].slice(PL_OLD).forEach(function (c) {
            if (lists.length < PL_LISTS_MAX && have.indexOf(c.join(',')) < 0) lists.push({ c: c.slice() });
          });
        }
      }
      if (!lists.length) lists = PL_DEFAULTS[k].map(function (c) { return { c: c.slice() }; });
      if (!pin) pin = [0, 1, 2].filter(function (i) { return i < lists.length; });
      out[k] = { cur: cur, lists: lists, pin: pin, rot: rot, x10: 1 };
    });
    return out;
  }
  function plWrite(d) {
    try { localStorage.setItem(PL_KEY, JSON.stringify(d)); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent('garden:palettes')); } catch (e2) {}
  }
  function plRecents(kind) {
    try {
      var a = JSON.parse(localStorage.getItem(PL_REC_KEY) || 'null');
      if (a && Array.isArray(a[kind])) return a[kind].filter(plOk).slice(0, PL_REC_MAX);
    } catch (e) {}
    return [];
  }
  function noteRecent(kind, c) {
    if (!plOk(c)) return false;
    var a = null;
    try { a = JSON.parse(localStorage.getItem(PL_REC_KEY) || 'null'); } catch (e) {}
    if (!a || typeof a !== 'object') a = {};
    var list = (Array.isArray(a[kind]) ? a[kind] : []).filter(function (x) { return x !== c; });
    list.unshift(c);
    a[kind] = list.slice(0, PL_REC_MAX);
    try { localStorage.setItem(PL_REC_KEY, JSON.stringify(a)); } catch (e2) {}
    return true;
  }
  function plCur(kind) { var P = plRead()[kind]; return (P.lists[P.cur] || { c: [] }).c.slice(); }

  function cssHex(v) {
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    var s = document.createElement('span'), out = '';
    s.style.color = v;
    s.style.display = 'none';
    document.body.appendChild(s);
    var m = /rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/.exec(getComputedStyle(s).color || '');
    s.remove();
    if (m) out = '#' + [m[1], m[2], m[3]].map(function (x) { var t = (+x).toString(16); return t.length < 2 ? '0' + t : t; }).join('');
    return out || '#ffe14d';
  }
  function palPanel(kind, o) {
    o = o || {};
    var P = plRead()[kind], hx = o.hexOf || function (t) { return t; };
    var list = (P.lists[P.cur] || { c: [] }).c;
    var h = '<div class="nsw-pl" data-plkind="' + esc(kind) + '">';
    h += '<div class="nsw-pl-cur"><div class="nsw-pl-h"><b>' + esc(L('لوحتُك الأساسيّة', 'Your main palette')) + '</b>' +
      '<span>' + esc(digits(P.cur + 1) + ' · ' + plName(kind, P.cur, list)) + '</span></div>' +
      '<div class="nsw-pl-row">' + list.map(function (t, i) {
        return '<span class="nsw-pl-cell"><button type="button" class="nsw-pl-sw" data-pled="' + i + '" style="--t:' + esc(hx(t)) + '"' +
          ' aria-label="' + esc(L('غيّرْ ', 'Change ') + toneName(t)) + '" title="' + esc(L('غيّرْ ', 'Change ') + toneName(t)) + '"></button>' +
          (list.length > 1 ? '<button type="button" class="nsw-pl-x" data-pldel="' + i + '" aria-label="' + esc(L('أزِلْ ', 'Remove ') + toneName(t)) + '">' +
            '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' : '') + '</span>';
      }).join('') +
      (list.length < PL_MAX ? '<button type="button" class="nsw-pl-add" data-pladd="1" aria-label="' + esc(L('أضِفْ لوناً', 'Add a colour')) + '" title="' +
        esc(L('أضِفْ لوناً', 'Add a colour')) + '"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>' : '') + '</div>' +
      '<p class="nsw-pl-note">' + esc(L('المسْ لوناً لتغييره، أو اخترْ لوحةً جاهزةً أدناه لتصير أساسيّتَك.',
                                         'Tap a colour to change it, or pick a ready palette below to make it your main one.')) + '</p></div>';
    h += '<details class="nsw-more"' + (o.open ? ' open' : '') + '><summary>' + esc(L('لوحاتٌ جاهزة', 'Ready palettes')) + ' <span>' + esc(digits(P.lists.length)) + '</span></summary>';
    h += '<ul class="nip-pals">' + P.lists.map(function (l, i) {
      var on = P.rot === 'all' || P.pin.indexOf(i) >= 0;
      return '<li class="nip-pal-row"><button type="button" class="nip-pal" data-pal="' + i + '" aria-pressed="' + (i === P.cur) + '">' +
        '<span class="nip-pal-no">' + esc(digits(i + 1)) + '</span><span class="nip-pal-nm">' + esc(plName(kind, i, l.c)) + '</span>' +
        '<span class="nip-pal-dots">' + l.c.slice(0, 6).map(function (c) { return '<i style="--t:' + esc(hx(c)) + '"></i>'; }).join('') + '</span></button>' +
        (o.pins ? '<button type="button" class="nip-ic nip-pal-pin" data-palpin="' + i + '" aria-pressed="' + (P.pin.indexOf(i) >= 0) + '"' + (on ? '' : ' data-off="1"') +
          ' aria-label="' + esc(P.pin.indexOf(i) >= 0 ? L('مثبَّتةٌ في الدوران — المسْ لإخراجها', 'Pinned in the cycle — tap to take it out') : L('ثبّتْها في الدوران', 'Pin it into the cycle')) +
          '"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i></button>' : '') + '</li>';
    }).join('') + '</ul>';
    h += '<button type="button" class="nsw-pl-reset" data-plrst="1"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> ' +
      esc(L('أعِدِ اللوحاتِ الجاهزةَ كما كانت', 'Restore the ready palettes')) + '</button></details></div>';
    return h;
  }
  function palClick(t, kind, o) {
    o = o || {};
    if (!t || !t.closest) return false;
    var b = t.closest('[data-pal],[data-pled],[data-pldel],[data-pladd],[data-plrst]');
    if (!b) return false;
    var d = plRead(), P = d[kind], list = P.lists[P.cur].c, done = function () { plWrite(d); if (o.onChange) o.onChange(); };
    if (b.hasAttribute('data-pal')) {
      var i = +b.getAttribute('data-pal');
      if (i >= 0 && i < P.lists.length) { P.cur = i; done(); }
      return true;
    }
    if (b.hasAttribute('data-pldel')) {
      var k = +b.getAttribute('data-pldel');
      if (list.length > 1 && k >= 0 && k < list.length) { list.splice(k, 1); done(); }
      return true;
    }
    if (b.hasAttribute('data-plrst')) {
      P.lists = PL_DEFAULTS[kind].map(function (x) { return { c: x.slice() }; });
      P.pin = [0, 1, 2]; P.rot = 'pin'; P.cur = 0;
      done();
      return true;
    }
    var ix = b.hasAttribute('data-pled') ? +b.getAttribute('data-pled') : -1;
    var seed = ix >= 0 ? cssHex((o.hexOf || function (x) { return x; })(list[ix])) : '#ffd166';
    _kind = kind === 'hi' ? 'hl' : 'fg';
    var pre = (o.presets || []).filter(function (x) { return list.indexOf(x.v) < 0 || (ix >= 0 && list[ix] === x.v); });
    board(b, seed, function (v, fin) {
      if (!fin) return;
      var d2 = plRead(), L2 = d2[kind].lists[d2[kind].cur].c;
      if (ix >= 0 && ix < L2.length) L2[ix] = v;
      else if (L2.indexOf(v) < 0 && L2.length < PL_MAX) L2.push(v);
      plWrite(d2);
      noteRecent(kind, v);
      if (o.onChange) o.onChange();
    }, { presets: pre });
    return true;
  }

  window.GardenSwatch = {
    ready: CSS_READY,
    pal: { read: plRead, write: plWrite, name: plName, ring: plRing, next: plNext, ok: plOk, recents: plRecents,
           noteRecent: noteRecent, cur: plCur, DEFAULTS: PL_DEFAULTS, NAMES: PL_NAMES,
           MAX: PL_MAX, LISTS_MAX: PL_LISTS_MAX, REC_MAX: PL_REC_MAX },
    palPanel: palPanel,
    palClick: palClick,
    cssHex: cssHex,
    norm: norm,
    list: all,
    push: push,
    togglePin: togglePin,
    html: html,
    bind: bind,
    board: board,
    closeBoard: closeBoard,
    openNative: openNative,
    MAX: MAX
  };
})();
