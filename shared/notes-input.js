;(function () {
  'use strict';

  var MOUSE_TWIN_MS = 1500;
  var COMMIT_PX = 3;
  var TWO_FINGER_GRACE_MS = 250;
  var PALM_AREA = 120;
  var FLAT_EPS = 0.02;
  var CEIL_FLOOR = 0.5;
  var PALM_KEY = 'garden_ink_palm';
  var PMAX_KEY = 'garden_ink_pmax';
  var BTN_KEY = 'garden_pen_buttons';

  var TILT_KEY = 'garden_ink_tilt';
  var HALF_PI = Math.PI / 2, TAU = Math.PI * 2, D2R = Math.PI / 180;

  /*@3.NOIJ2.28*/
  var _tilt = null;

  /*@3.NOIJ2.35*/
  function tiltMode() {
    if (_tilt) return _tilt;
    _tilt = 'auto';
    try {
      if (localStorage.getItem(TILT_KEY) === 'off') _tilt = 'off';
    } catch (e) {}
    return _tilt;
  }

  /*@3.NOIJ2.29*/
  function readTilt(e) {
    if (e.pointerType !== 'pen') return null;

    /*@3.NOIJ2.33*/
    var alt = e.altitudeAngle, az = e.azimuthAngle;
    if (typeof alt === 'number' && typeof az === 'number' &&
        isFinite(alt) && isFinite(az) && !(alt >= HALF_PI - 1e-6 && az === 0)) {
      return norm(alt, az);
    }

    /*@3.NOIJ2.34*/
    var tx = e.tiltX, ty = e.tiltY;
    if (typeof tx !== 'number' || typeof ty !== 'number') return null;
    if (!isFinite(tx) || !isFinite(ty)) return null;
    if (tx === 0 && ty === 0) return null;
    return norm2(tx * D2R, ty * D2R);
  }

  /*@3.NOIJ2.30*/
  function norm2(tx, ty) {
    var az, alt;
    if (Math.abs(tx) >= HALF_PI - 1e-6 || Math.abs(ty) >= HALF_PI - 1e-6) {
      alt = 0;
      az = Math.atan2(ty === 0 ? 0 : (ty > 0 ? 1 : -1), tx === 0 ? 0 : (tx > 0 ? 1 : -1));
    } else if (tx === 0) {
      az = ty > 0 ? HALF_PI : -HALF_PI;
      alt = HALF_PI - Math.abs(ty);
    } else if (ty === 0) {
      az = tx > 0 ? 0 : Math.PI;
      alt = HALF_PI - Math.abs(tx);
    } else {
      var kx = Math.tan(tx), ky = Math.tan(ty);
      az = Math.atan2(ky, kx);
      alt = Math.atan(1 / Math.sqrt(kx * kx + ky * ky));
    }
    return norm(alt, az);
  }

  /*@3.NOIJ2.31*/
  function norm(alt, az) {
    var tz = 1 - Math.max(0, Math.min(1, alt / HALF_PI));
    az = az % TAU;
    if (az < 0) az += TAU;
    return { tz: tz, az: az };
  }

  var AIR_CLICK_MS = 900;
  var BTN_DEFAULT = { barrel: 'era', tip: 'era', second: 'sel' };
  var ACTS = [
    { k: 'era',   ar: 'ممحاة',        en: 'Eraser' },
    { k: 'sel',   ar: 'تحديد',        en: 'Select' },
    { k: 'lasso', ar: 'لاسو',         en: 'Lasso' },
    { k: 'hand',  ar: 'تمرير',        en: 'Scroll' },
    { k: 'hi',    ar: 'تظليل',        en: 'Highlight' },
    { k: 'none',  ar: 'بلا فعل',      en: 'Nothing' }
  ];

  function penButtons() {
    var out = { barrel: 'none', tip: 'none', second: 'none' };
    devProfile().binds.forEach(function (x) {
      var m = /^pen:(barrel|tip|second)$/.exec(x.t);
      if (m) out[m[1]] = x.a || 'none';
    });
    return out;
  }

  function penButtons0() {
    var out = { barrel: BTN_DEFAULT.barrel, tip: BTN_DEFAULT.tip, second: BTN_DEFAULT.second };
    try {
      var a = JSON.parse(localStorage.getItem(BTN_KEY) || 'null');
      if (a && typeof a === 'object') {
        if (typeof a.barrel === 'string') out.barrel = a.barrel;
        if (typeof a.tip === 'string') out.tip = a.tip;
        if (typeof a.second === 'string') out.second = a.second;
      }
    } catch (e) {}
    return out;
  }

  /*@3.NOIJ2.10*/
  function penMods(e) {
    if (e.pointerType !== 'pen') return null;
    var b = e.buttons || 0;
    if ((b & 32) || e.button === 5) return 'tip';
    if ((b & 2) || e.button === 2) return 'barrel';
    if ((b & 4) || e.button === 1) return 'second';
    return null;
  }

  /*@3.NOIJ2.15*/
  var KEYS_KEY = 'garden_pen_keys';

  function penKeys() {
    try {
      var o = JSON.parse(localStorage.getItem(KEYS_KEY) || 'null');
      if (o && typeof o === 'object') return o;
    } catch (e) {}
    return {};
  }

  function normKey(k) {
    var s = String(k == null ? '' : k);
    if (s.length !== 1) return '';
    s = s.toLowerCase();
    return /^[a-z0-9`\-=\[\]\\;',.\/]$/.test(s) ? s : '';
  }

  /*@3.NOIJ2.16*/
  function setPenKey(key, act) {
    var k = normKey(key);
    if (!k) return null;
    var m = penKeys();
    for (var old in m) if (m[old] === act) delete m[old];
    if (act && act !== 'none') m[k] = act; else delete m[k];
    try { localStorage.setItem(KEYS_KEY, JSON.stringify(m)); } catch (e) {}
    return m;
  }

  function clearPenKey(act) {
    var m = penKeys(), hit = false;
    for (var k in m) if (m[k] === act) { delete m[k]; hit = true; }
    if (hit) { try { localStorage.setItem(KEYS_KEY, JSON.stringify(m)); } catch (e) {} }
    return m;
  }

  function keyFor(act) {
    var m = penKeys();
    for (var k in m) if (m[k] === act) return k;
    return '';
  }

  var DEV_ID_LS = 'garden_device_id';
  var DEV_PREFIX = 'garden_ink_dev_';
  var DBL_MS = 380, DBL_PX = 8, TAP_MS = 320, TAP_PX = 10;

  var TOOL_ACTS = { pen: 1, hi: 1, era: 1, 'era:part': 1, 'era:whole': 1, sel: 1, lasso: 1, hand: 1, text: 1, rect: 1, ell: 1, line: 1, arr: 1 };
  var ACT_LIST = [
    { k: 'pen', g: 'tool', ar: 'قلم', en: 'Pen' },
    { k: 'hi', g: 'tool', ar: 'تظليل', en: 'Highlighter' },
    { k: 'era', g: 'tool', ar: 'ممحاة', en: 'Eraser' },
    { k: 'era:part', g: 'tool', ar: 'ممحاةٌ جزئيّة', en: 'Partial eraser' },
    { k: 'era:whole', g: 'tool', ar: 'ممحاةُ الخطِّ كلِّه', en: 'Whole-stroke eraser' },
    { k: 'sel', g: 'tool', ar: 'تحديد', en: 'Select' },
    { k: 'lasso', g: 'tool', ar: 'لاسو', en: 'Lasso' },
    { k: 'hand', g: 'tool', ar: 'تمرير', en: 'Scroll' },
    { k: 'line', g: 'tool', ar: 'خطٌّ مستقيم', en: 'Straight line' },
    { k: 'rect', g: 'tool', ar: 'مستطيل', en: 'Rectangle' },
    { k: 'ell', g: 'tool', ar: 'دائرة', en: 'Ellipse' },
    { k: 'arr', g: 'tool', ar: 'سهم', en: 'Arrow' },
    { k: 'undo', g: 'cmd', ar: 'تراجع', en: 'Undo' },
    { k: 'redo', g: 'cmd', ar: 'إعادة', en: 'Redo' },
    { k: 'dial', g: 'cmd', ar: 'افتحِ اللوحةَ الدائريّة أو أغلقْها', en: 'Open or close the dial' },
    { k: 'panel', g: 'cmd', ar: 'افتحْ أدواتِ الرسم كاملة', en: 'Open all drawing tools' },
    { k: 'color:next', g: 'cmd', ar: 'اللونُ التالي', en: 'Next colour' },
    { k: 'color:prev', g: 'cmd', ar: 'اللونُ السابق', en: 'Previous colour' },
    { k: 'width:up', g: 'cmd', ar: 'أسمكُ', en: 'Thicker' },
    { k: 'width:down', g: 'cmd', ar: 'أرفعُ', en: 'Thinner' },
    { k: 'tools', g: 'cmd', ar: 'أخفِ أدواتِ الرسم أو أظهِرْها', en: 'Hide or show drawing tools' },
    { k: 'none', g: 'none', ar: 'بلا فعل', en: 'Nothing' }
  ];
  function isTool(act) { return !!TOOL_ACTS[act]; }
  function isCmd(act) { return !!act && act !== 'none' && !TOOL_ACTS[act]; }

  function devId() {
    var d = '';
    try { d = localStorage.getItem(DEV_ID_LS) || ''; } catch (e) {}
    if (!/^d[0-9a-f]{16}$/.test(d)) {
      var b = new Uint8Array(8);
      try { crypto.getRandomValues(b); } catch (e2) { for (var i = 0; i < 8; i++) b[i] = Math.floor(Math.random() * 256); }
      d = 'd';
      for (var j = 0; j < 8; j++) d += (b[j] < 16 ? '0' : '') + b[j].toString(16);
      try { localStorage.setItem(DEV_ID_LS, d); } catch (e3) {}
    }
    return d;
  }

  function devGuess() {
    var ua = navigator.userAgent || '', tp = navigator.maxTouchPoints || 0;
    var os = /Android/.test(ua) ? 'android'
           : (/iPhone|iPod/.test(ua) ? 'iphone'
           : ((/iPad/.test(ua) || (/Macintosh/.test(ua) && tp > 1)) ? 'ipad'
           : (/Windows/.test(ua) ? 'windows' : (/Mac OS X/.test(ua) ? 'mac' : (/CrOS/.test(ua) ? 'chromebook' : 'other')))));
    var wide = Math.max(screen.width || 0, screen.height || 0);
    var big = Math.min(screen.width || 0, screen.height || 0) >= 600;
    var kind = (os === 'android' && big) ? 'tablet' : (os === 'android' || os === 'iphone') ? 'phone'
             : os === 'ipad' ? 'tablet' : (tp > 0 ? 'twoinone' : 'computer');
    var N = {
      windows: ['ويندوز', 'Windows'], android: ['أندرويد', 'Android'], iphone: ['آيفون', 'iPhone'],
      ipad: ['آيباد', 'iPad'], mac: ['ماك', 'Mac'], chromebook: ['كروم بوك', 'Chromebook'], other: ['جهاز', 'Device']
    };
    var K = { tablet: ['لوحيّ', 'tablet'], phone: ['جوّال', 'phone'], twoinone: ['٢ في ١', '2-in-1'], computer: ['حاسوب', 'computer'] };
    return { os: os, kind: kind, wide: wide,
             ar: K[kind][0] + ' ' + N[os][0], en: N[os][1] + ' ' + K[kind][1] };
  }

  var _prof = null, _profKey = '';
  function devKey(id) { return DEV_PREFIX + (id || devId()); }

  function legacyBinds() {
    var out = [], b = penButtons0(), m = penKeys();
    ['barrel', 'tip', 'second'].forEach(function (s) { if (b[s] && b[s] !== 'none') out.push({ t: 'pen:' + s, a: b[s] }); });
    for (var k in m) {
      if (!Object.prototype.hasOwnProperty.call(m, k)) continue;
      var c = /^[a-z]$/.test(k) ? 'Key' + k.toUpperCase() : (/^[0-9]$/.test(k) ? 'Digit' + k : '');
      if (c && m[k] && m[k] !== 'none') out.push({ t: 'key:' + c, a: m[k] });
    }
    return out;
  }

  function devProfile() {
    var k = devKey();
    if (_prof && _profKey === k) return _prof;
    var p = null;
    try { p = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) {}
    if (!p || typeof p !== 'object' || !Array.isArray(p.binds)) {
      var g = devGuess();
      p = { v: 1, name: '', os: g.os, kind: g.kind, src: { mouse: 'draw', touch: 'auto' }, touchSet: 0, binds: legacyBinds(), at: 0 };
    }
    if (!p.src) p.src = { mouse: 'draw', touch: 'auto' };
    _prof = p; _profKey = k;
    return p;
  }

  function saveProfile(p) {
    p.at = Date.now();
    if (!p.os) { var g = devGuess(); p.os = g.os; p.kind = g.kind; }
    _prof = p; _profKey = devKey();
    try { localStorage.setItem(_profKey, JSON.stringify(p)); } catch (e) {}
    var pb = { barrel: 'none', tip: 'none', second: 'none' };
    p.binds.forEach(function (x) { var m = /^pen:(barrel|tip|second)$/.exec(x.t); if (m) pb[m[1]] = x.a; });
    try { localStorage.setItem(BTN_KEY, JSON.stringify(pb)); } catch (e2) {}
    if (p.touchSet) {
      var pm = { auto: 'auto', pan: 'always', draw: 'never', off: 'always' }[p.src.touch] || 'auto';
      try { localStorage.setItem(PALM_KEY, pm); } catch (e3) {}
    }
    fire('profile', { profile: p });
    return p;
  }

  function devName(p) {
    p = p || devProfile();
    if (p.name) return p.name;
    var g = devGuess();
    return (document.documentElement.lang === 'en') ? g.en : g.ar;
  }

  function otherDevices() {
    var out = [], me = devKey();
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf(DEV_PREFIX) !== 0 || k === me) continue;
        var p = null;
        try { p = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) {}
        if (p && Array.isArray(p.binds)) out.push({ id: k.slice(DEV_PREFIX.length), p: p });
      }
    } catch (e2) {}
    out.sort(function (a, b) { return (b.p.at || 0) - (a.p.at || 0); });
    return out;
  }

  function actFor(trig) {
    if (!trig) return null;
    var b = devProfile().binds;
    for (var i = 0; i < b.length; i++) if (b[i].t === trig) return b[i].a || null;
    return null;
  }
  function bindOf(trig) {
    var b = devProfile().binds;
    for (var i = 0; i < b.length; i++) if (b[i].t === trig) return b[i];
    return null;
  }

  function setBind(trig, act, how) {
    var p = devProfile(), b = p.binds.filter(function (x) { return x.t !== trig; });
    if (act && act !== 'none') b.push({ t: trig, a: act, h: how || 'auto' });
    p.binds = b;
    return saveProfile(p);
  }

  var BUS = [];
  function on(fn) { BUS.push(fn); return function () { BUS = BUS.filter(function (f) { return f !== fn; }); }; }
  function fire(act, info) {
    BUS.slice().forEach(function (fn) { try { fn(act, info || {}); } catch (e) {} });
  }

  var MB = { 1: 'middle', 2: 'right', 3: 'back', 4: 'forward' };
  function trigOf(e) {
    var t = e.pointerType || 'mouse';
    if (t === 'pen') { var m = penMods(e); return m ? 'pen:' + m : null; }
    if (t === 'mouse' && MB[e.button]) return 'mouse:' + MB[e.button];
    return null;
  }

  var MODS_RE = /^(Control|Shift|Alt|Meta|OS|AltGraph|CapsLock|Fn)(Left|Right)?$/;
  function comboOf(e) {
    var code = e.code || '';
    if (!code || MODS_RE.test(code) || MODS_RE.test(e.key || '')) return '';
    var s = '';
    if (e.ctrlKey) s += 'Ctrl+';
    if (e.altKey) s += 'Alt+';
    if (e.shiftKey) s += 'Shift+';
    if (e.metaKey) s += 'Meta+';
    return 'key:' + s + code;
  }

  var KEY_NAMES = { Space: 'Space', Enter: 'Enter', Tab: 'Tab', Backspace: 'Backspace', Delete: 'Delete',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc', PageUp: 'PgUp', PageDown: 'PgDn',
    Home: 'Home', End: 'End', Insert: 'Ins', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']',
    Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backquote: '`' };
  function codeName(c) {
    var m = /^Key([A-Z])$/.exec(c) || /^Digit([0-9])$/.exec(c) || /^Numpad([0-9])$/.exec(c);
    if (m) return m[1];
    return KEY_NAMES[c] || c.replace(/^Numpad/, 'Num ');
  }

  var TRIG_NAMES = {
    'pen:barrel': ['زرُّ القلم الجانبيّ', 'Pen side button'],
    'pen:tip': ['طرفُ الممحاة في القلم', 'Pen eraser end'],
    'pen:second': ['زرُّ القلم الثاني', 'Pen second button'],
    'pen:dbl-left': ['نقرتان بطرف القلم', 'Double tap with the pen'],
    'pen:dbl-barrel': ['نقرتان بزرِّ القلم الجانبيّ', 'Double press of the side button'],
    'mouse:right': ['زرُّ الفأرة الأيمن', 'Right mouse button'],
    'mouse:middle': ['زرُّ الفأرة الأوسط', 'Middle mouse button'],
    'mouse:back': ['زرُّ «رجوع» في الفأرة', 'Mouse back button'],
    'mouse:forward': ['زرُّ «تقدّم» في الفأرة', 'Mouse forward button'],
    'mouse:dbl-left': ['نقرٌ مزدوجٌ بالزرِّ الأيسر', 'Left double-click'],
    'mouse:dbl-right': ['نقرٌ مزدوجٌ بالزرِّ الأيمن', 'Right double-click'],
    'mouse:dbl-middle': ['نقرٌ مزدوجٌ بالزرِّ الأوسط', 'Middle double-click'],
    'touch:2tap': ['نقرةٌ بإصبعين', 'Two-finger tap'],
    'touch:3tap': ['نقرةٌ بثلاثة أصابع', 'Three-finger tap']
  };
  function trigLabel(t) {
    var ar = document.documentElement.lang !== 'en';
    if (TRIG_NAMES[t]) return TRIG_NAMES[t][ar ? 0 : 1];
    if (t && t.indexOf('key:') === 0) {
      var parts = t.slice(4).split('+'), code = parts.pop();
      return parts.concat([codeName(code)]).join(' + ');
    }
    return t || '';
  }
  function actLabel(a) {
    var ar = document.documentElement.lang !== 'en';
    for (var i = 0; i < ACT_LIST.length; i++) if (ACT_LIST[i].k === a) return ar ? ACT_LIST[i].ar : ACT_LIST[i].en;
    return a || '';
  }
  function trigIcon(t) {
    if (!t) return 'fa-circle-question';
    if (t.indexOf('pen:') === 0) return 'fa-pen-clip';
    if (t.indexOf('mouse:') === 0) return 'fa-computer-mouse';
    if (t.indexOf('touch:') === 0) return 'fa-hand-pointer';
    return 'fa-keyboard';
  }

  function captureAny(cb, opt) {
    var done = false, lastL = null, touches = {}, tStart = 0, tMax = 0, tMoved = 0, timer = 0;
    var o = opt || {};
    function stop() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('contextmenu', onCtx, true);
    }
    function got(t) { stop(); cb({ trig: t, label: trigLabel(t) }); }
    function inUi(e) { return o.ignore && e.target && e.target.closest && e.target.closest(o.ignore); }
    function onCtx(e) { e.preventDefault(); }
    function onDown(e) {
      if (inUi(e)) return;
      var t = e.pointerType || 'mouse';
      if (t === 'touch') {
        touches[e.pointerId] = { x: e.clientX, y: e.clientY };
        var n = Object.keys(touches).length;
        if (n === 1) { tStart = Date.now(); tMax = 1; tMoved = 0; }
        if (n > tMax) tMax = n;
        e.preventDefault();
        return;
      }
      var trig = trigOf(e);
      if (trig) { e.preventDefault(); e.stopPropagation(); got(trig); return; }
      if (e.button === 0) {
        e.preventDefault(); e.stopPropagation();
        var now0 = Date.now();
        if (lastL && now0 - lastL.t < DBL_MS && Math.abs(e.clientX - lastL.x) < DBL_PX && Math.abs(e.clientY - lastL.y) < DBL_PX) {
          got((t === 'pen' ? 'pen' : 'mouse') + ':dbl-left');
          return;
        }
        lastL = { t: now0, x: e.clientX, y: e.clientY };
        if (o.onHint) o.onHint('single');
      }
    }
    function onMove(e) {
      var s = touches[e.pointerId];
      if (!s) return;
      var d = Math.abs(e.clientX - s.x) + Math.abs(e.clientY - s.y);
      if (d > tMoved) tMoved = d;
    }
    function onUp(e) {
      if (!touches[e.pointerId]) return;
      delete touches[e.pointerId];
      if (Object.keys(touches).length) return;
      if (tMax >= 2 && Date.now() - tStart < TAP_MS * 1.6 && tMoved < TAP_PX * 2) got(tMax >= 3 ? 'touch:3tap' : 'touch:2tap');
    }
    function onKey(e) {
      if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) { e.preventDefault(); stop(); cb(null); return; }
      var c = comboOf(e);
      if (!c) return;
      e.preventDefault(); e.stopPropagation();
      got(c);
    }
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('contextmenu', onCtx, true);
    timer = setTimeout(function () { if (!done) { stop(); cb(null); } }, o.timeout || 20000);
    return stop;
  }

  function keyEngine(adapter) {
    var held = {};
    function down(e) {
      if (e.defaultPrevented || e.repeat) return;
      if (adapter.active && !adapter.active()) return;
      var t = e.target;
      if (typing(t)) return;
      if (t && t.closest && t.closest('dialog[open]')) return;
      var c = comboOf(e);
      var act = actFor(c);
      if (!act || act === 'none') return;
      e.preventDefault();
      if (isTool(act)) {
        held[e.code] = { act: act, t: Date.now(), how: (bindOf(c) || {}).h };
        adapter.apply(act, 'down');
      } else adapter.apply(act, 'cmd');
    }
    function up(e) {
      var h = held[e.code];
      if (!h) return;
      delete held[e.code];
      var how = h.how;
      var tap = Date.now() - h.t < 300;
      adapter.apply(h.act, (how === 'toggle' || (how !== 'hold' && tap)) ? 'tap' : 'up');
    }
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return function () {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
    };
  }

  /*@3.NOIJ2.20*/
  var CODE_KEY = /^(?:Key([A-Z])|Digit([0-9]))$/;
  function keyOf(e) {
    var m = CODE_KEY.exec(e.code || '');
    if (m) return (m[1] || m[2]).toLowerCase();
    return String(e.key || '').toLowerCase();
  }

  /*@3.NOIJ2.17*/
  function capture(kind, cb) {
    var done = false;
    function stop() {
      if (done) return;
      done = true;
      window.removeEventListener('pointerdown', onPen, true);
      window.removeEventListener('pointermove', onPen, true);
      window.removeEventListener('keydown', onKey, true);
    }
    function onPen(e) {
      if (e.pointerType !== 'pen') return;
      var mod = penMods(e);
      if (!mod) return;
      e.preventDefault();
      e.stopPropagation();
      stop();
      cb({ kind: 'pen', mod: mod });
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); stop(); cb(null); return; }
      /*@3.NOIJ2.19*/
      if (kind === 'pen') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = normKey(e.key);
      if (!k) return;
      e.preventDefault();
      e.stopPropagation();
      stop();
      cb({ kind: 'key', key: k });
    }
    if (kind !== 'key') {
      window.addEventListener('pointerdown', onPen, true);
      window.addEventListener('pointermove', onPen, true);
    }
    window.addEventListener('keydown', onKey, true);
    return stop;
  }

  /*@3.NOIJ2.23*/
  function contact(e, prof) {
    if ((e.buttons & 1) === 1) return true;
    if (typeof e.pressure === 'number' && e.pressure > 0.01) return true;
    if (e.pointerType === 'pen' && prof && !prof.pMax) return true;
    return false;
  }

  function palmMode(def) {
    var pp = devProfile();
    if (pp.touchSet) return { auto: 'auto', pan: 'always', draw: 'never', off: 'off' }[pp.src.touch] || 'auto';
    var d = def || 'auto';
    try { return localStorage.getItem(PALM_KEY) || d; }
    catch (e) { return d; }
  }

  function now() { return Date.now(); }

  /*@3.NOIJ2.1*/
  function Profile() {
    this.penSeen = false;
    this.lastPenAt = 0;
    this.pMin = 1;
    this.pMax = 0;
    this.pSamples = 0;
    this.areaSeen = false;
    /*@3.NOIJ2.9*/
    try {
      var v = parseFloat(localStorage.getItem(PMAX_KEY) || '0');
      if (isFinite(v) && v > 0 && v <= 1) this.pCeil = v;
    } catch (e) {}
  }

  Profile.prototype.ceiling = function () {
    return Math.max(this.pMax, this.pCeil || 0, CEIL_FLOOR);
  };

  Profile.prototype.notePen = function () {
    this.penSeen = true;
    this.lastPenAt = now();
  };

  Profile.prototype.notePressure = function (v) {
    if (typeof v !== 'number') return;
    this.pSamples++;
    if (v < this.pMin) this.pMin = v;
    if (v > this.pMax) {
      this.pMax = v;
      if (v > (this.pCeil || 0)) {
        this.pCeil = v;
        try { localStorage.setItem(PMAX_KEY, String(v)); } catch (e) {}
      }
    }
  };

  /*@3.NOIJ2.2*/
  Profile.prototype.pressureIsFlat = function () {
    return (this.pMax - this.pMin) < FLAT_EPS;
  };

  Profile.prototype.mouseIsTwin = function () {
    return this.penSeen && (now() - this.lastPenAt) < MOUSE_TWIN_MS;
  };

  function splitAct(act) {
    var want = act, mode = null;
    if (act.indexOf('era') === 0) {
      want = 'era';
      if (act === 'era:part') mode = 'part';
      else if (act === 'era:whole') mode = 'whole';
    }
    return { tool: want, mode: mode };
  }

  function Mods(a) {
    this.a = a || {};
    this.held = null;
    this.latch = null;
  }

  Mods.prototype.begin = function (act) {
    if (!act || act === 'none') return false;
    var a = this.a, s = splitAct(act);
    this.held = { tool: a.getTool(), mode: a.getEraseMode() };
    if (s.mode) a.setEraseMode(s.mode);
    if (s.tool !== a.getTool()) a.setTool(s.tool);
    else if (a.onChange) a.onChange();
    return true;
  };

  Mods.prototype.end = function (info) {
    var a = this.a;
    if (info && info.tap && info.act) {
      this.held = null;
      this.toggle(info.act);
      if (a.onChange) a.onChange();
      return 'tap';
    }
    var m = this.held;
    this.held = null;
    if (m && !(a.hasSelection && a.hasSelection())) {
      a.setEraseMode(m.mode);
      if (a.getTool() !== m.tool) a.setTool(m.tool);
    }
    if (a.onChange) a.onChange();
    return 'hold';
  };

  Mods.prototype.toggle = function (act) {
    if (!act || act === 'none') return false;
    var a = this.a, s = splitAct(act), L = this.latch;
    if (L && L.act === act) {
      this.latch = null;
      a.setEraseMode(L.mode);
      a.setTool(L.tool);
      return true;
    }
    if (L) {
      this.latch = { act: act, tool: L.tool, mode: L.mode };
    } else {
      if (s.tool === a.getTool() && (!s.mode || s.mode === a.getEraseMode())) return false;
      this.latch = { act: act, tool: a.getTool(), mode: a.getEraseMode() };
    }
    if (s.mode) a.setEraseMode(s.mode);
    a.setTool(s.tool);
    return true;
  };

  var EAT_SKIP = '.mi-dock, .g-header, .gsf-menu';
  function eat(e) {
    var t = e && e.target;
    if (!e || e.type !== 'pointerdown' || (t && t.closest && t.closest(EAT_SKIP))) return false;
    var id = e.pointerId, t0 = Date.now();
    e.preventDefault();
    e.stopPropagation();
    var stop = function (ev) {
      if (ev.pointerId !== id) return;
      ev.preventDefault(); ev.stopPropagation();
      if (ev.type !== 'pointermove') off();
    };
    var clk = function (ev) {
      document.removeEventListener('click', clk, true);
      if (Date.now() - t0 > 900) return;
      ev.preventDefault(); ev.stopPropagation();
    };
    var off = function () {
      document.removeEventListener('pointermove', stop, true);
      document.removeEventListener('pointerup', stop, true);
      document.removeEventListener('pointercancel', stop, true);
      setTimeout(function () { document.removeEventListener('click', clk, true); }, 900);
    };
    document.addEventListener('pointermove', stop, true);
    document.addEventListener('pointerup', stop, true);
    document.addEventListener('pointercancel', stop, true);
    document.addEventListener('click', clk, true);
    return true;
  }

  function typing(t) {
    return !!(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
  }

  function keys(spec, guard) {
    return function (e) {
      if (e.defaultPrevented) return;
      if (typing(e.target)) return;
      if (guard && guard(e) === false) return;
      var name = ((e.ctrlKey || e.metaKey) ? 'mod+' : '') +
                 (e.shiftKey ? 'shift+' : '') + keyOf(e);
      var fn = spec[name];
      if (!fn) return;
      if (fn(e) === false) return;
      e.preventDefault();
    };
  }

  function ring(host) {
    var el = null;
    return {
      at: function (x, y, r, dashed) {
        if (!host) return;
        if (!el) {
          el = document.createElement('div');
          el.className = 'gink-ring';
          el.setAttribute('aria-hidden', 'true');
          host.appendChild(el);
        }
        el.setAttribute('data-dash', dashed ? '1' : '0');
        el.style.inlineSize = el.style.blockSize = Math.max(4, r * 2) + 'px';
        el.style.insetInlineStart = '0';
        el.style.insetBlockStart = '0';
        el.style.transform = 'translate(' + (x - r) + 'px,' + (y - r) + 'px)';
        el.hidden = false;
      },
      off: function () { if (el) el.hidden = true; },
      drop: function () {
        if (el && el.parentNode) el.parentNode.removeChild(el);
        el = null;
      }
    };
  }

  function Router(opts) {
    var o = opts || {};
    this.el = o.el;
    this.onBegin = o.onBegin || function () {};
    this.onMove = o.onMove || function () {};
    this.onEnd = o.onEnd || function () {};
    this.onEndMod = o.onEndMod || null;
    this.onGesture = o.onGesture || function () {};
    this.mode = o.mode || function () { return 'draw'; };
    this.palmDef = o.palmDefault || '';
    this.profile = o.profile || new Profile();
    this.onDouble = o.onDouble || null;
    this.onPass = o.onPass || null;
    this.passing = {};
    this.live = {};
    this.gest = {};
    this.swallow = {};
    this._dbl = null;
    this._taps = null;
    this.bind();
  }

  Router.prototype.runAct = function (act, trig) {
    if (!act || act === 'none') return;
    if (isCmd(act)) { fire(act, { trig: trig, el: this.el }); return; }
    if (this.onEndMod) this.onEndMod({ mod: trig, act: act, moved: 0, held: 0, tap: true });
  };

  Router.prototype.dblOf = function (e) {
    if (e.pointerType === 'touch') return null;
    var b = e.button, t = now(), prev = this._dbl;
    var side = b === 0 ? 'left' : (e.pointerType === 'pen' ? (penMods(e) || 'x') : (MB[b] || 'x'));
    var name = (e.pointerType === 'pen' ? 'pen' : 'mouse') + ':dbl-' + side;
    this._dbl = { name: name, t: t, x: e.clientX, y: e.clientY };
    if (!prev || prev.name !== name || t - prev.t > DBL_MS ||
        Math.abs(e.clientX - prev.x) > DBL_PX || Math.abs(e.clientY - prev.y) > DBL_PX) return null;
    var a = actFor(name);
    if (!a || a === 'none') return null;
    this._dbl = null;
    return name;
  };

  Router.prototype.noteTap = function (g) {
    var T = this._taps;
    if (!T || now() - T.t0 > TAP_MS * 1.6) T = this._taps = { t0: g.t0 || now(), n: 0, moved: 0 };
    T.n = Math.max(T.n, this.gestureCount() + 1);
    if ((g.moved || 0) > T.moved) T.moved = g.moved || 0;
    if (this.gestureCount() > 0) return;
    this._taps = null;
    if (g.src !== 'touch' || T.n < 2 || T.moved > TAP_PX * 2 || now() - T.t0 > TAP_MS * 1.6) return;
    var trig = T.n >= 3 ? 'touch:3tap' : 'touch:2tap', act = actFor(trig);
    if (act && act !== 'none') this.runAct(act, trig);
  };

  /*@3.NOIJ2.18*/
  Router.prototype.rect = function (fresh) {
    if (fresh || !this._rect) this._rect = this.el.getBoundingClientRect();
    return this._rect;
  };

  Router.prototype.zoom = function () {
    var el = this.el;
    if (!el || !el.offsetWidth) return 1;
    var z = this.rect().width / el.offsetWidth;
    return (isFinite(z) && z > 0.05) ? z : 1;
  };

  /*@3.NOIJ2.24*/
  Router.prototype.local = function (e) {
    var r = this._cr;
    if (!r) {
      r = this.el.getBoundingClientRect();
      this._cr = r;
      var self = this;
      if (!this._crBound) {
        this._crBound = 1;
        var drop = function () { self._cr = null; };
        window.addEventListener('scroll', drop, { capture: true, passive: true });
        window.addEventListener('resize', drop, { passive: true });
      }
    }
    var z = (this.el.offsetWidth && r.width / this.el.offsetWidth) || 1;
    if (!isFinite(z) || z <= 0.05) z = 1;
    return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z };
  };

  Router.prototype.dropRect = function () { this._cr = null; };

  Router.prototype.gpt = function (e) {
    var p = this.local(e);
    p.cx = e.clientX;
    p.cy = e.clientY;
    return p;
  };

  /*@3.NOIJ2.3*/
  Router.prototype.classify = function (e) {
    var t = e.pointerType || 'mouse';
    var P = this.profile;
    var pm = palmMode(this.palmDef);

    if (t === 'pen') { P.notePen(); return 'draw'; }

    if (t === 'mouse') {
      if (P.mouseIsTwin()) return 'reject';
      var ms = devProfile().src.mouse;
      if (ms === 'off') return 'reject';
      if (ms === 'pan') return 'gesture';
      return 'draw';
    }

    if (t === 'touch') {
      if (pm === 'off') return 'reject';
      if (pm === 'never') return 'draw';
      if (pm === 'always') return 'gesture';
      if (P.penSeen) return 'gesture';
      if (e.width > 0) {
        P.areaSeen = true;
        if (e.width >= PALM_AREA || e.height >= PALM_AREA) return 'reject';
      }
      /*@3.NOIJ2.26*/
      if (this.gestureCount() > 0) return 'gesture';
      if (this.drawingCount() > 0) return 'gesture';
      return 'draw';
    }
    return 'draw';
  };

  Router.prototype.srcOff = function (e) {
    if (e.pointerType === 'mouse') return !this.profile.mouseIsTwin() && devProfile().src.mouse === 'off';
    if (e.pointerType === 'touch') return palmMode(this.palmDef) === 'off' && !(e.width >= PALM_AREA || e.height >= PALM_AREA);
    return false;
  };

  Router.prototype.passable = function (g) {
    if (!this.onPass || !g || g.act === 'hand' || g.multi || g.palm) return false;
    if (g.src !== 'mouse' && g.src !== 'touch') return false;
    if ((g.moved || 0) >= TAP_PX || now() - (g.t0 || 0) > 450) return false;
    if (g.src === 'touch' && (this.drawingCount() > 0 || (this.profile.lastPenAt && now() - this.profile.lastPenAt < 700))) return false;
    return true;
  };

  Router.prototype.drawingCount = function () {
    var n = 0;
    for (var k in this.live) if (this.live[k]) n++;
    return n;
  };

  Router.prototype.gestureCount = function () {
    var n = 0;
    for (var k in this.gest) if (this.gest[k]) n++;
    return n;
  };

  /*@3.NOIJ2.4*/
  Router.prototype.effP = function (tr, pt, e) {
    var P = this.profile;
    var raw = (typeof e.pressure === 'number') ? e.pressure : 0;
    if (e.pointerType === 'pen') P.notePressure(raw);

    if (e.pointerType === 'pen' && !P.pressureIsFlat()) {
      /*@3.NOIJ2.8*/
      var denom = P.ceiling();
      return Math.max(0.05, Math.min(1, raw / denom));
    }

    var last = tr.pts[tr.pts.length - 1];
    if (!last) return 0.55;
    var dx = pt.x - last.x, dy = pt.y - last.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var fast = Math.min(1, d / 14);
    var target = 0.85 - 0.55 * fast;
    tr.pSmooth = (tr.pSmooth == null) ? target : (tr.pSmooth * 0.72 + target * 0.28);
    return Math.max(0.12, Math.min(1, tr.pSmooth));
  };

  /*@3.NOIJ2.32*/
  Router.prototype.effTilt = function (tr, pt, e) {
    if (tiltMode() === 'off') return;
    var r = readTilt(e);
    if (!r) {
      if (tr.tilt) { pt.tz = tr.lastTz; pt.az = tr.lastAz; }
      return;
    }
    tr.tilt = 1;
    tr.lastTz = r.tz; tr.lastAz = r.az;
    pt.tz = r.tz; pt.az = r.az;
    if (!SEEN.tilt) { SEEN.tilt = 1; }
  };

  Router.prototype.points = function (e) {
    var evts = (typeof e.getCoalescedEvents === 'function')
      ? (e.getCoalescedEvents() || [e]) : [e];
    return evts.length ? evts : [e];
  };

  /*@3.NOIJ2.5*/
  /*@3.NOIJ2.25*/
  Router.prototype.cancelProvisional = function () {
    for (var id in this.live) {
      var tr = this.live[id];
      if (!tr || tr.src !== 'touch') continue;
      if (tr.committed && now() - (tr.t0 || 0) > TWO_FINGER_GRACE_MS) continue;
      this.onEnd(id, false);
      this.gest[id] = { x: tr.last.x, y: tr.last.y,
                        cx: tr.last.cx || 0, cy: tr.last.cy || 0, src: 'touch' };
      delete this.live[id];
    }
  };

  Router.prototype.bind = function () {
    var self = this;
    var el = this.el;

    /*@3.NOIJ2.12*/
    this._down = function (e) {
      /*@3.NOIJ2.27*/
      self._cr = null;
      /*@3.NOIJ2.13*/
      var dbl = self.dblOf(e);
      if (dbl) {
        e.preventDefault();
        self.swallow[e.pointerId] = 1;
        if (/dbl-left$/.test(dbl) && self.onDouble) self.onDouble();
        self.runAct(actFor(dbl), dbl, 'tap');
        return;
      }
      var trig = trigOf(e);
      var act = trig ? actFor(trig) : null;
      if (trig && (!act || act === 'none')) {
        if (e.pointerType !== 'pen') return;
        act = null;
      }
      var mod = trig ? (e.pointerType === 'pen' ? penMods(e) : trig) : null;
      if (act && isCmd(act)) {
        e.preventDefault();
        self.swallow[e.pointerId] = 1;
        try { el.setPointerCapture(e.pointerId); } catch (errC) {}
        self.runAct(act, trig, 'cmd');
        return;
      }
      var verdict = self.classify(e);
      if (verdict === 'reject') {
        e.preventDefault();
        if (self.onPass && self.srcOff(e)) self.passing[e.pointerId] = { x: e.clientX, y: e.clientY, t0: now(), src: e.pointerType };
        return;
      }

      /*@3.NOIJ2.22*/
      if ((!mod && (verdict === 'gesture' || self.mode() === 'pan')) || act === 'hand') {
        e.preventDefault();
        self.cancelProvisional();
        var multi = self.gestureCount() > 0;
        if (multi) for (var gk in self.gest) if (self.gest[gk]) self.gest[gk].multi = 1;
        self.gest[e.pointerId] = Object.assign(self.gpt(e), { src: e.pointerType, t0: now(), moved: 0, act: act === 'hand' ? 'hand' : null,
          px: e.clientX, py: e.clientY, multi: multi ? 1 : 0, palm: (e.width >= PALM_AREA || e.height >= PALM_AREA) ? 1 : 0 });
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        self.emitGesture('start');
        return;
      }

      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      var pt = self.local(e);
      var tr = { src: e.pointerType, pts: [], start: pt, last: pt,
                 committed: e.pointerType !== 'touch', moved: 0 };
      pt.p = self.effP(tr, pt, e);
      self.effTilt(tr, pt, e);
      tr.pts.push(pt);
      tr.mod = mod;
      tr.act = act;
      tr.t0 = now();
      /*@3.NOIJ2.21*/
      tr.hold = !!mod;
      self.live[e.pointerId] = tr;
      if (!tr.hold) { tr.began = 1; self.onBegin(e.pointerId, pt, e.pointerType, null); }
      else if (contact(e, self.profile)) {
        tr.hold = false; tr.began = 1;
        self.onBegin(e.pointerId, pt, e.pointerType, tr.act);
      }
    };

    this._move = function (e) {
      if (self.swallow[e.pointerId]) { e.preventDefault(); return; }
      if (self.gest[e.pointerId]) {
        e.preventDefault();
        var g = self.gpt(e);
        var g0 = self.gest[e.pointerId];
        if (g0.sx == null) { g0.sx = g0.cx; g0.sy = g0.cy; }
        var mv = Math.abs(g.cx - g0.sx) + Math.abs(g.cy - g0.sy);
        if (mv > (g0.moved || 0)) g0.moved = mv;
        self.gest[e.pointerId].x = g.x;
        self.gest[e.pointerId].y = g.y;
        self.gest[e.pointerId].cx = g.cx;
        self.gest[e.pointerId].cy = g.cy;
        self.emitGesture('move');
        return;
      }
      var tr = self.live[e.pointerId];
      if (!tr) return;
      e.preventDefault();

      var raw = self.points(e), out = [];
      for (var i = 0; i < raw.length; i++) {
        var p = self.local(raw[i]);
        p.cx = raw[i].clientX; p.cy = raw[i].clientY;
        var last = tr.pts[tr.pts.length - 1];
        if (last && Math.abs(p.x - last.x) < 0.35 && Math.abs(p.y - last.y) < 0.35) continue;
        p.p = self.effP(tr, p, raw[i]);
        self.effTilt(tr, p, raw[i]);
        tr.pts.push(p);
        out.push(p);
        tr.last = p;
      }
      if (!out.length) return;

      var dx = tr.last.x - tr.start.x, dy = tr.last.y - tr.start.y;
      tr.moved = Math.sqrt(dx * dx + dy * dy);
      if (!tr.committed && tr.moved >= COMMIT_PX) tr.committed = true;

      if (tr.hold) {
        if (!contact(e, self.profile)) return;
        tr.hold = false;
        tr.began = 1;
        tr.start = tr.last;
        self.onBegin(e.pointerId, tr.last, tr.src, tr.act);
      }
      self.onMove(e.pointerId, out, tr);
    };

    this._up = function (e) {
      self._cr = null;
      if (self.swallow[e.pointerId]) { delete self.swallow[e.pointerId]; return; }
      var ps = self.passing[e.pointerId];
      if (ps) {
        delete self.passing[e.pointerId];
        if (e.type === 'pointerup' && Math.abs(e.clientX - ps.x) + Math.abs(e.clientY - ps.y) < TAP_PX && now() - ps.t0 < 600) self.onPass(ps.x, ps.y, ps.src);
        return;
      }
      if (self.gest[e.pointerId]) {
        var gg = self.gest[e.pointerId];
        delete self.gest[e.pointerId];
        if (e.type === 'pointerup' && self.passable(gg)) self.onPass(gg.px, gg.py, gg.src);
        self.noteTap(gg);
        self.emitGesture(self.gestureCount() ? 'move' : 'end');
        if (gg.act === 'hand' && (gg.moved || 0) < TAP_PX && now() - (gg.t0 || 0) < 400 && self.onEndMod) {
          self.onEndMod({ mod: 'hand', act: 'hand', moved: 0, held: now() - gg.t0, tap: true });
        }
        return;
      }
      var tr = self.live[e.pointerId];
      if (!tr) return;
      delete self.live[e.pointerId];
      /*@3.NOIJ2.6*/
      var keep = !tr.hold && (tr.committed || tr.src !== 'touch');
      self.onEnd(e.pointerId, keep, tr);
      /*@3.NOIJ2.14*/
      if (tr.mod && self.onEndMod) {
        self.onEndMod({
          mod: tr.mod,
          act: tr.act,
          moved: tr.moved || 0,
          held: now() - (tr.t0 || 0),
          tap: !tr.began
        });
      }
    };

    /*@3.NOIJ2.11*/
    this._ctx = function (e) { e.preventDefault(); };
    el.addEventListener('contextmenu', this._ctx);
    el.addEventListener('pointerdown', this._down);
    el.addEventListener('pointermove', this._move);
    el.addEventListener('pointerup', this._up);
    el.addEventListener('pointercancel', this._up);
    /*@3.NOIJ2.7*/
    el.addEventListener('lostpointercapture', this._up);
  };

  Router.prototype.emitGesture = function (phase) {
    var ids = Object.keys(this.gest);
    var pts = ids.map(function (k) { return this.gest[k]; }, this);
    if (!pts.length) { this.onGesture(phase, { n: 0 }); return; }
    if (pts.length === 1) {
      this.onGesture(phase, { n: 1, x: pts[0].x, y: pts[0].y,
                              cx: pts[0].cx, cy: pts[0].cy });
      return;
    }
    var a = pts[0], b = pts[1];
    var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y;
    this.onGesture(phase, { n: pts.length, x: cx, y: cy,
                            cx: ((a.cx || 0) + (b.cx || 0)) / 2,
                            cy: ((a.cy || 0) + (b.cy || 0)) / 2,
                            d: Math.sqrt(dx * dx + dy * dy) });
  };

  Router.prototype.destroy = function () {
    var el = this.el;
    el.removeEventListener('contextmenu', this._ctx);
    el.removeEventListener('pointerdown', this._down);
    el.removeEventListener('pointermove', this._move);
    el.removeEventListener('pointerup', this._up);
    el.removeEventListener('pointercancel', this._up);
    el.removeEventListener('lostpointercapture', this._up);
  };

  var SEEN = { tilt: 0 };

  window.GardenInkInput = {
    create: function (opts) { return new Router(opts); },
    tiltMode: tiltMode,
    setTiltMode: function (m) {
      _tilt = (m === 'off') ? 'off' : 'auto';
      try { localStorage.setItem(TILT_KEY, _tilt); } catch (e) {}
    },
    tiltSeen: function () { return !!SEEN.tilt; },
    readTilt: readTilt,
    tiltFromXY: norm2,
    Profile: Profile,
    palmMode: palmMode,
    setPalmMode: function (m) {
      try { localStorage.setItem(PALM_KEY, m); } catch (e) {}
      var p = devProfile();
      p.src.touch = { auto: 'auto', always: 'pan', never: 'draw', off: 'off' }[m] || 'auto';
      p.touchSet = 1;
      saveProfile(p);
    },
    penButtons: penButtons,
    setPenButtons: function (m) {
      ['barrel', 'tip', 'second'].forEach(function (k) {
        if (m && typeof m[k] === 'string') setBind('pen:' + k, m[k]);
      });
      return penButtons();
    },
    penMods: penMods,
    ACTS: ACTS,
    mods: function (adapter) { return new Mods(adapter); },
    splitAct: splitAct,
    keys: keys,
    eat: eat,
    ring: ring,
    keyOf: keyOf,
    penKeys: penKeys,
    setPenKey: setPenKey,
    clearPenKey: clearPenKey,
    keyFor: keyFor,
    capture: capture,
    captureAny: captureAny,
    keyEngine: keyEngine,
    devId: devId,
    devGuess: devGuess,
    devProfile: devProfile,
    saveProfile: saveProfile,
    devName: devName,
    otherDevices: otherDevices,
    actFor: actFor,
    bindOf: bindOf,
    setBind: setBind,
    trigOf: trigOf,
    comboOf: comboOf,
    trigLabel: trigLabel,
    trigIcon: trigIcon,
    actLabel: actLabel,
    ACT_LIST: ACT_LIST,
    isTool: isTool,
    isCmd: isCmd,
    on: on,
    fire: fire,
    CONST: { MOUSE_TWIN_MS: MOUSE_TWIN_MS, COMMIT_PX: COMMIT_PX, PALM_AREA: PALM_AREA }
  };
})();
