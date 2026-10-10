;(function () {
  'use strict';

  function i18n(node) {
    if (node && window.Garden && Garden.localize) {
      try { Garden.localize(node); } catch (e) {}
    }
    return node;
  }
  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function hexOf(t) {
    return (window.GardenCanvas && GardenCanvas.hexOf) ? GardenCanvas.hexOf(t) : '#888';
  }

  /*@3.NODJ.38*/
  var TONES = ['ink', 'red', 'orange', 'yellow', 'lime', 'emerald',
               'teal', 'sky', 'indigo', 'violet', 'pink', 'brown'];
  var TONE_AR = {
    ink: 'الحبر', red: 'أحمر', orange: 'برتقالي', yellow: 'أصفر',
    lime: 'ليموني', emerald: 'أخضر', teal: 'فيروزي', sky: 'أزرق',
    indigo: 'نيلي', violet: 'بنفسجي', pink: 'زهري', brown: 'بنّي',
    amber: 'كهرماني', rose: 'وردي', white: 'أبيض', black: 'أسود'
  };
  var TONE_EN = {
    ink: 'Ink', red: 'Red', orange: 'Orange', yellow: 'Yellow',
    lime: 'Lime', emerald: 'Green', teal: 'Teal', sky: 'Blue',
    indigo: 'Indigo', violet: 'Violet', pink: 'Pink', brown: 'Brown',
    amber: 'Amber', rose: 'Rose', white: 'White', black: 'Black'
  };

  /*@3.NODJ.54*/
  var MAIN_TONES = ['ink', 'red', 'sky', 'emerald'];
  /*@3.NODJ.66*/
  var EDGE_TONES = [
    { k: 'white', ar: 'أبيض', en: 'White' },
    { k: 'black', ar: 'أسود', en: 'Black' }
  ];
  var ALL_TONES = TONES.concat(['white', 'black']);
  var PIN_KEY = 'garden_ink_pin_colors';

  /*@3.NODJ.79*/
  var BAR_KEY = 'garden_ink_bar';
/*@3.NODJ.105*/
  var BAR_KEYS = ['favs', 'colors', 'tools', 'mine'];
  var BAR_ITEMS_DEF = {
    favs: ['undo', 'redo', 'sep', 'fx:0', 'fx:1', 'fx:2', 'fx:3', 'color', 'size',
           'sep', 'favs', 'sep', 'recent', 'spring', 'baredit', 'palm', 'penbtn', 'pincol', 'star'],
    colors: ['cols'],
    tools: ['t:pen', 't:hi', 't:text', 't:rect', 't:ell', 't:line', 't:arr',
            't:era', 't:lasso', 't:sel', 't:hand'],
    mine: []
  };
  var BAR_ON_DEF = { favs: 1, colors: 1, tools: 0, mine: 0 };

  /*@3.NODJ.107*/
  var ATOMS = {
    undo:   { grp: 'ink', icon: 'fa-rotate-left',   ar: 'تراجع', en: 'Undo' },
    redo:   { grp: 'ink', icon: 'fa-rotate-right',  ar: 'إعادة', en: 'Redo' },
    color:  { grp: 'colour', icon: 'fa-palette',    ar: 'زرُّ اللون', en: 'Colour button' },
    size:   { grp: 'ink', icon: 'fa-pen-nib',       ar: 'رأسُ القلمِ وسماكتُه', en: 'Pen tip and thickness' },
    favs:   { grp: 'ink', icon: 'fa-star',          ar: 'مفضّلتُك', en: 'Your favourites', wide: 1 },
    recent: { grp: 'ink', icon: 'fa-clock-rotate-left', ar: 'آخرُ ما استعملت', en: 'Recently used', wide: 1 },
    star:   { grp: 'ink', icon: 'fa-star',          ar: 'أضِفْ إلى المفضّلة', en: 'Add to favourites' },
    palm:   { grp: 'ink', icon: 'fa-hand',          ar: 'رفضُ راحةِ اليد', en: 'Palm rejection' },
    penbtn: { grp: 'ink', icon: 'fa-pen-clip',      ar: 'أزرارُ القلم', en: 'Pen buttons' },
    pincol: { grp: 'colour', icon: 'fa-droplet',    ar: 'شريطُ الألوان', en: 'Colour strip' },
    baredit:{ grp: 'misc', icon: 'fa-sliders',      ar: 'عدّلِ الشريط', en: 'Edit the bar' },
    cols:   { grp: 'colour', icon: 'fa-swatchbook', ar: 'قوائمُ الألوان', en: 'Colour lists', wide: 1 },
    sep:    { grp: 'misc', icon: 'fa-grip-lines-vertical', ar: 'فاصل', en: 'Separator' },
    spring: { grp: 'misc', icon: 'fa-arrows-left-right', ar: 'دفعٌ إلى الطرف', en: 'Push to the end' }
  };
  var TOOL_ATOMS = ['pen', 'hi', 'text', 'shp', 'rect', 'ell', 'line', 'arr', 'era', 'lasso', 'sel', 'hand'];
  var FIX_AR = ['اليد', 'التحديد', 'ممحاةُ الجزء', 'ممحاةُ الضربة'];
  var FIX_EN = ['Hand', 'Select', 'Part eraser', 'Stroke eraser'];
  /*@3.NODJ.115*/
  var TEXT_ATOMS = [
    { k: 'bold',        icon: 'fa-bold',            ar: 'غامق', en: 'Bold' },
    { k: 'italic',      icon: 'fa-italic',          ar: 'مائل', en: 'Italic' },
    { k: 'underline',   icon: 'fa-underline',       ar: 'تسطير', en: 'Underline' },
    { k: 'strike',      icon: 'fa-strikethrough',   ar: 'شطب', en: 'Strikethrough' },
    { k: 'code',        icon: 'fa-terminal',        ar: 'رمزٌ سطريّ', en: 'Inline code' },
    { k: 'clear',       icon: 'fa-eraser',          ar: 'إزالةُ التنسيق', en: 'Clear formatting' },
    { k: 'link',        icon: 'fa-link',            ar: 'رابط', en: 'Link' },
    { k: 'list:ul',     icon: 'fa-list-ul',         ar: 'قائمةٌ نقطيّة', en: 'Bulleted list' },
    { k: 'list:ol',     icon: 'fa-list-ol',         ar: 'قائمةٌ رقميّة', en: 'Numbered list' },
    { k: 'list:todo',   icon: 'fa-square-check',    ar: 'مربّعُ مهمّة', en: 'To-do' },
    { k: 'align:start', icon: 'fa-align-right',     ar: 'محاذاةٌ إلى البداية', en: 'Align to start' },
    { k: 'align:center', icon: 'fa-align-center',   ar: 'توسيط', en: 'Centre' },
    { k: 'align:end',   icon: 'fa-align-left',      ar: 'محاذاةٌ إلى النهاية', en: 'Align to end' },
    { k: 'dir',         icon: 'fa-right-left',      ar: 'اتّجاهُ الكتلة', en: 'Block direction' },
    { k: 'copy',        icon: 'fa-copy',            ar: 'نسخ', en: 'Copy' },
    { k: 'cut',         icon: 'fa-scissors',        ar: 'قصّ', en: 'Cut' },
    { k: 'paste',       icon: 'fa-paste',           ar: 'لصق', en: 'Paste' }
  ];
  function textAtom(k) {
    for (var i = 0; i < TEXT_ATOMS.length; i++) if (TEXT_ATOMS[i].k === k) return TEXT_ATOMS[i];
    return null;
  }
  function atomMeta(it) {
    if (it.indexOf('t:') === 0) {
      var tk = it.slice(2), i;
      for (i = 0; i < RING1.length; i++) if (RING1[i].tool === tk) return { grp: 'ink', icon: RING1[i].icon, html: RING1[i].html, ar: RING1[i].ar, en: RING1[i].en };
      for (i = 0; i < SHAPES.length; i++) if (SHAPES[i].k === tk) return { grp: 'ink', icon: SHAPES[i].icon, ar: SHAPES[i].ar, en: SHAPES[i].en };
      return null;
    }
    if (it.indexOf('fx:') === 0) {
      var ix = Number(it.slice(3));
      if (!(ix >= 0) || ix >= FAV_FIXED.length) return null;
      /*@3.NODJ.125*/
      return { grp: 'ink', html: favIcon(FAV_FIXED[ix]), ar: FIX_AR[ix], en: FIX_EN[ix] };
    }
    if (it.indexOf('x:') === 0) {
      var t = textAtom(it.slice(2));
      return t ? { grp: 'text', icon: t.icon, ar: t.ar, en: t.en } : null;
    }
    return ATOMS[it] || null;
  }

  /*@3.NODJ.106*/
  function barRead() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(BAR_KEY) || 'null'); } catch (e) {}
    var out = { v: 2, bars: [], scope: 'all' };
    var byK = {};
    if (raw && raw.v === 2 && raw.bars instanceof Array) {
      raw.bars.forEach(function (b) {
        if (!b || BAR_KEYS.indexOf(b.k) < 0 || byK[b.k]) return;
        byK[b.k] = { k: b.k, on: b.on ? 1 : 0,
          /*@3.NODJ.128*/
          fd: (b.fd == null) ? (b.on ? 0 : 1) : (b.fd ? 1 : 0),
          items: (b.items instanceof Array ? b.items : []).filter(function (x) {
            return typeof x === 'string' && (x === 'sep' || x === 'spring' || !!atomMeta(x));
          }).slice(0, 60) };
      });
      out.bars = BAR_KEYS.map(function (k) {
        return byK[k] || { k: k, on: BAR_ON_DEF[k], fd: BAR_ON_DEF[k] ? 0 : 1,
                           items: BAR_ITEMS_DEF[k].slice() };
      });
      out.scope = raw.scope === 'per' ? 'per' : 'all';
      /*@3.NODJ.131*/
      if (raw.mineBy && typeof raw.mineBy === 'object') out.mineBy = raw.mineBy;
      if (out.scope === 'per' && SURFACE && out.mineBy && out.mineBy[SURFACE] instanceof Array) {
        barOf(out, 'mine').items = out.mineBy[SURFACE].filter(function (x) {
          return typeof x === 'string' && (x === 'sep' || x === 'spring' || !!atomMeta(x));
        }).slice(0, 60);
      }
      return out;
    }
    var showOld = (raw && raw.show) || null;
    var rowsOld = (raw && raw.rows) || null;
    out.bars = BAR_KEYS.map(function (k) {
      var on = rowsOld && rowsOld[k] != null ? (rowsOld[k] ? 1 : 0) : BAR_ON_DEF[k];
      var items = BAR_ITEMS_DEF[k].slice();
      if (k === 'favs' && showOld) {
        items = items.filter(function (x) {
          if (x === 'undo' || x === 'redo') return showOld.hist == null || !!showOld.hist;
          if (x.indexOf('fx:') === 0) return showOld.fixed == null || !!showOld.fixed;
          if (x === 'color') return showOld.color == null || !!showOld.color;
          if (x === 'size') return showOld.size == null || !!showOld.size;
          if (x === 'recent') return showOld.recent == null || !!showOld.recent;
          if (x === 'palm') return showOld.palm == null || !!showOld.palm;
          if (x === 'penbtn') return showOld.penbtn == null || !!showOld.penbtn;
          if (x === 'star') return showOld.star == null || !!showOld.star;
          return true;
        });
      }
      return { k: k, on: on, fd: on ? 0 : 1, items: items };
    });
    out.scope = (raw && raw.scope === 'per') ? 'per' : 'all';
    /*@3.NODJ.80*/
    if (raw == null) {
      try { if (localStorage.getItem(PIN_KEY) === '0') out.bars[1].on = 0; } catch (e2) {}
    }
    return out;
  }

  function barOf(d, k) {
    for (var i = 0; i < d.bars.length; i++) if (d.bars[i].k === k) return d.bars[i];
    return { k: k, on: 0, items: [] };
  }
  function barGone(b) {
    var def = BAR_ITEMS_DEF[b.k] || [], out = [];
    for (var i = 0; i < def.length; i++) {
      var it = def[i];
      if (it === 'sep' || it === 'spring') continue;
      if (b.items.indexOf(it) < 0 && out.indexOf(it) < 0) out.push(it);
    }
    return out;
  }
  function barOn(k) { return !!barOf(barRead(), k).on; }
  function barHas(k, it) { return barOf(barRead(), k).items.indexOf(it) >= 0; }


  function barWrite(d) {
    if (d && d.scope === 'per' && SURFACE) {
      d.mineBy = (d.mineBy && typeof d.mineBy === 'object') ? d.mineBy : {};
      d.mineBy[SURFACE] = barOf(d, 'mine').items.slice();
    }
    try { localStorage.setItem(BAR_KEY, JSON.stringify(d)); } catch (e) {}
  }

  function colorsPinned() { return barOn('colors'); }

  function setColorsPinned(on) {
    var d = barRead();
    barOf(d, 'colors').on = on ? 1 : 0;
    barWrite(d);
    try { localStorage.setItem(PIN_KEY, on ? '1' : '0'); } catch (e) {}
  }

  var PL_KEY = 'garden_ink_palettes', PL_REC_KEY = 'garden_ink_recent_colors';
  var PL_MAX = 12, PL_LISTS_MAX = 8, PL_REC_MAX = 8;
  var PL_DEFAULTS = {
    pen: [['ink', 'red', 'sky', 'emerald', 'orange', 'violet'],
          ['teal', 'indigo', 'brown', 'pink', 'lime', 'ink'],
          ['red', 'orange', 'yellow', 'lime', 'sky', 'pink']],
    hi:  [['yellow', 'lime', 'sky', 'pink', 'orange', 'violet'],
          ['amber', 'emerald', 'teal', 'rose', 'indigo', 'brown'],
          ['yellow', 'pink', 'sky', 'lime', 'red', 'teal']]
  };
  var PL_NAMES = {
    pen: [['أساسيّ', 'Basic'], ['هادئ', 'Calm'], ['زاهٍ', 'Bright']],
    hi:  [['للمراجعة', 'Revision'], ['هادئ', 'Soft'], ['مفاتيحُ الامتحان', 'Exam keys']]
  };
  function plName(kind, i, list) {
    var dft = PL_DEFAULTS[kind][i];
    if (dft && list && list.join(',') === dft.join(',')) return L(PL_NAMES[kind][i][0], PL_NAMES[kind][i][1]);
    return L('لوحتي ', 'My palette ') + arDigits(i + 1);
  }
  function plKind(cv) { return (cv && cv.tool === 'hi') ? 'hi' : 'pen'; }
  function plOk(c) {
    return typeof c === 'string' && (ALL_TONES.indexOf(c) >= 0 || TONES.indexOf(c) >= 0 ||
      /^#[0-9a-f]{6}$/i.test(c) || c === 'amber' || c === 'rose');
  }
  function plRead() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(PL_KEY) || 'null'); } catch (e) {}
    var out = { v: 1 };
    ['pen', 'hi'].forEach(function (k) {
      var src = d && d[k], lists = [], cur = 0;
      if (src && Array.isArray(src.lists)) {
        src.lists.forEach(function (l) {
          if (lists.length >= PL_LISTS_MAX) return;
          lists.push({ c: (l && Array.isArray(l.c)) ? l.c.filter(plOk).slice(0, PL_MAX) : [] });
        });
        cur = Math.max(0, Math.min(lists.length - 1, Number(src.cur) || 0));
      }
      if (!lists.length) lists = PL_DEFAULTS[k].map(function (c) { return { c: c.slice() }; });
      out[k] = { cur: cur, lists: lists };
    });
    return out;
  }
  function plWrite(d) { try { localStorage.setItem(PL_KEY, JSON.stringify(d)); } catch (e) {} }
  function plRecents(kind) {
    try {
      var a = JSON.parse(localStorage.getItem(PL_REC_KEY) || 'null');
      if (a && Array.isArray(a[kind])) return a[kind].filter(plOk).slice(0, PL_REC_MAX);
    } catch (e) {}
    return [];
  }
  function noteRecentColor(kind, c) {
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
  function arDigits(n) {
    return isAr() ? String(n).replace(/\d/g, function (ch) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+ch); }) : String(n);
  }

  var PEN_W = [1.2, 2.4, 4, 7, 12];
  /*@3.NODJ.55*/
  var HI_W = [6, 10, 14, 20, 28, 38];
  /*@3.NODJ.95*/
  var WID_AR = ['شعرة', 'رفيع', 'وسط', 'عريض', 'عريضٌ جدّاً', 'الأعرض'];
  var WID_EN = ['Hairline', 'Fine', 'Medium', 'Bold', 'Extra bold', 'Widest'];
  var NIBS = [
    { k: 'round',  ar: 'مدوّرة',  en: 'Round' },
    { k: 'fine',   ar: 'رفيعة',   en: 'Fine' },
    { k: 'marker', ar: 'ثابتة',   en: 'Marker' },
    { k: 'flat',   ar: 'مشطوفة',  en: 'Chisel' },
    { k: 'pencil', ar: 'رصاص',    en: 'Pencil' },
    { k: 'chalk',  ar: 'طباشير',  en: 'Chalk', hide: 1 }
  ];
  function pickNibs() {
    return NIBS.filter(function (n) { return !n.hide; });
  }
  var SHAPES = [
    { k: 'rect', icon: 'fa-square',           ar: 'مستطيل', en: 'Rectangle' },
    { k: 'ell',  icon: 'fa-circle',           ar: 'دائرة',  en: 'Ellipse' },
    { k: 'line', icon: 'fa-minus',            ar: 'خط',     en: 'Line' },
    { k: 'arr',  icon: 'fa-arrow-right-long', ar: 'سهم',    en: 'Arrow' }
  ];

  var ICONS = window.GardenNotesIcons || {};

  var NIB_ICON = {
    round: ICONS.nibRound, fine: ICONS.nibFine,
    marker: ICONS.nibMarker, flat: ICONS.nibChisel,
    pencil: '<i class="fa-solid fa-pencil" aria-hidden="true"></i>',
    chalk: '<i class="fa-solid fa-brush" aria-hidden="true"></i>'
  };

  var LASSO_SVG = (window.GardenNotesIcons || {}).lasso || '';

  /*@3.NODJ.1*/
  var RING1 = [
    { k: 'pen',   icon: 'fa-pen',           ar: 'قلم — المسْه ثانيةً لرأسه وسماكته', en: 'Pen — tap again for tip and thickness', tool: 'pen', set: 'pen' },
    /*@3.NODJ.39*/
    { k: 'hi',    icon: 'fa-highlighter',   ar: 'تظليل — المسْه ثانيةً لطريقته', en: 'Highlighter — tap again for its options', tool: 'hi', set: 'hiw' },
    { k: 'era',   html: ICONS.eraser,       ar: 'ممحاة — المسْها ثانيةً لنوعها', en: 'Eraser — tap again for its kind', tool: 'era', set: 'era' },
    { k: 'shape', icon: 'fa-shapes',        ar: 'أشكال',      en: 'Shapes',      ring: 'shape' },
    /*@3.NODJ.63*/
    { k: 'text',  icon: 'fa-i-cursor',      ar: 'حقلُ نصّ',    en: 'Text field',  tool: 'text',
      cap: 'canText' },
    { k: 'shp',   icon: 'fa-vector-square', ar: 'شكلٌ بالسحب', en: 'Drag a shape', tool: 'shp',
      cap: 'canText' },
    { k: 'sel',   icon: 'fa-arrow-pointer', ar: 'تحديد',      en: 'Select',      tool: 'sel' },
    /*@3.NODJ.9*/
    { k: 'lasso', html: LASSO_SVG,          ar: 'لاسو حرّ',   en: 'Free lasso',  tool: 'lasso' },
    { k: 'hand',  icon: 'fa-hand',          ar: 'تمرير الصفحة', en: 'Scroll page', tool: 'hand' },
    { k: 'redo',  icon: 'fa-rotate-right',  ar: 'إعادة',      en: 'Redo' },
    { k: 'undo',  icon: 'fa-rotate-left',   ar: 'تراجع',      en: 'Undo' },
    { k: 'exit',  icon: 'fa-xmark',         ar: 'إنهاء الرسم', en: 'Exit drawing' }
  ];

  var HALO_KEY = 'garden_ink_halo', HALO_R = 46;
  function haloPrefs() {
    try {
      var o = JSON.parse(localStorage.getItem(HALO_KEY) || 'null');
      if (o && typeof o === 'object') return { on: o.on !== 0, swap: o.swap !== 0 };
    } catch (e) {}
    return { on: true, swap: true };
  }
  function rad1() { return haloPrefs().on ? 98 : R1; }
  function rad2() { return haloPrefs().on ? 148 : R2; }
  function haloSet(p) {
    try { localStorage.setItem(HALO_KEY, JSON.stringify({ on: p.on ? 1 : 0, swap: p.swap ? 1 : 0 })); } catch (e) {}
  }

  var R1 = 78, R2 = 128, POS_KEY = 'garden_ink_dial', FAV_KEY = 'garden_ink_favs2';
  /*@3.NODJ.59*/
  var FAV_KEY3 = 'garden_ink_favs3', FAV_MAX = 14;
  /*@3.NODJ.89*/
  var SURFACE = '';
  function favKeyNow() {
    return (barRead().scope === 'per' && SURFACE) ? (FAV_KEY3 + ':' + SURFACE) : FAV_KEY3;
  }

  /*@3.NODJ.56*/
  var FAV_FIXED = [
    { tool: 'hand',  color: 'ink', width: 4, nib: 'round' },
    { tool: 'sel',   color: 'ink', width: 4, nib: 'round' },
    { tool: 'era',   color: 'ink', width: 4, nib: 'round', mode: 'part' },
    { tool: 'era',   color: 'ink', width: 4, nib: 'round', mode: 'whole' }
  ];

  /*@3.NODJ.20*/
  var INKY = { pen: 1, hi: 1 };

  var PALM_ORDER = ['auto', 'always', 'never'];
  var PALM_UI = {
    auto:   { icon: 'palmAuto',   ar: 'رفضُ راحة اليد: تلقائيّ — إن رأى قلماً منع اليد',
                                  en: 'Palm rejection: automatic — hand ignored once a pen is seen' },
    always: { icon: 'palmAlways', ar: 'رفضُ راحة اليد: دائماً — القلمُ وحدَه يكتب',
                                  en: 'Palm rejection: always — only the pen writes' },
    never:  { icon: 'palmNever',  ar: 'رفضُ راحة اليد: مطفأ — الإصبعُ يكتب أيضاً',
                                  en: 'Palm rejection: off — finger writes too' }
  };

  /*@3.NODJ.47*/
  function tiltNow() {
    var I = window.GardenInkInput;
    return (I && I.tiltMode && I.tiltMode() === 'off') ? 'off' : 'auto';
  }

  function tiltSeen() {
    var I = window.GardenInkInput;
    return !!(I && I.tiltSeen && I.tiltSeen());
  }

  function tiltLabel() {
    if (tiltNow() === 'off') {
      return ['ميلُ القلم: مطفأ — زاويةُ الرأسِ ثابتة',
              'Pen tilt: off — the nib keeps a fixed angle'];
    }
    if (tiltSeen()) {
      return ['ميلُ القلم: يعمل — قلمُك يبلّغ ميلَه والرأسُ يدور معه',
              'Pen tilt: live — your pen reports tilt and the nib follows it'];
    }
    return ['ميلُ القلم: جاهز — لم يبلّغ قلمُك ميلاً بعدُ',
            'Pen tilt: ready — your pen has not reported tilt yet'];
  }

  function palmNow(cv) {
    var I = window.GardenInkInput;
    var d = (cv && cv.palmDefault) || 'auto';
    var m = I && I.palmMode ? I.palmMode(d) : d;
    return PALM_ORDER.indexOf(m) >= 0 ? m : 'auto';
  }

  function isFixed(f) {
    if (!f) return false;
    for (var i = 0; i < FAV_FIXED.length; i++) {
      if (favKey(FAV_FIXED[i]) === favKey(f)) return true;
    }
    return false;
  }

  /*@3.NODJ.10*/
  var FAV_DEFAULTS = [
    { tool: 'pen', color: 'ink',     width: 4, nib: 'round' },
    { tool: 'pen', color: 'red',     width: 4, nib: 'round' },
    { tool: 'pen', color: 'sky',     width: 4, nib: 'round' },
    { tool: 'pen', color: 'ink',     width: 4, nib: 'pencil' },
    { tool: 'hi',  color: 'yellow',  width: 26, nib: 'marker', straight: 1 },
    { tool: 'lasso', color: 'ink',   width: 4, nib: 'round' }
  ];

  /*@3.NODJ.35*/
  var RECENT_KEY = 'garden_ink_recent', RECENT_MAX = 5;

  function recents() {
    try {
      var a = JSON.parse(localStorage.getItem(RECENT_KEY) || 'null');
      if (Array.isArray(a)) return a.slice(0, RECENT_MAX);
    } catch (e) {}
    return [];
  }

  function knownFav(f) {
    if (isFixed(f)) return true;
    var list = favs(), k = favKey(f), i;
    for (i = 0; i < list.length; i++) if (favKey(list[i]) === k) return true;
    return false;
  }

  function noteRecent(cv) {
    if (!cv) return false;
    if (cv.tool === 'hand' || cv.tool === 'era') return false;
    var f = { tool: cv.tool, color: cv.color, width: cv.width, nib: cv.nib };
    if (cv.tool === 'hi') {
      f.straight = cv.straight ? 1 : 0;
      f.hiMode = cv.hiMode || (cv.straight ? 'line' : 'free');
      f.hiStyle = cv.hiStyle === 'under' ? 'under' : 'fill';
    }
    if (knownFav(f)) return false;
    var list = recents().filter(function (x) { return favKey(x) !== favKey(f); });
    list.unshift(f);
    list = list.slice(0, RECENT_MAX);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) {}
    return true;
  }

  /*@3.NODJ.36*/
  function legacyFavs() {
    var out = FAV_DEFAULTS.slice(), i;
    var seen = {};
    for (i = 0; i < out.length; i++) seen[favKey(out[i])] = 1;
    try {
      var a = JSON.parse(localStorage.getItem(FAV_KEY) || 'null');
      if (Array.isArray(a)) {
        for (i = 0; i < a.length && out.length < 12; i++) {
          if (!a[i] || seen[favKey(a[i])]) continue;
          seen[favKey(a[i])] = 1;
          out.push(a[i]);
        }
      }
    } catch (e) {}
    return out;
  }

  function favs() {
    try {
      var a = JSON.parse(localStorage.getItem(favKeyNow()) || 'null');
      if (Array.isArray(a)) {
        var out = [], i;
        for (i = 0; i < a.length && out.length < FAV_MAX; i++) {
          if (a[i] && a[i].tool) out.push(a[i]);
        }
        return out;
      }
    } catch (e) {}
    return legacyFavs();
  }

  function setFavs(a) {
    var out = [], seen = {}, i;
    for (i = 0; i < a.length && out.length < FAV_MAX; i++) {
      if (!a[i] || !a[i].tool) continue;
      var k = favKey(a[i]);
      if (seen[k]) continue;
      seen[k] = 1;
      out.push(a[i]);
    }
    try { localStorage.setItem(favKeyNow(), JSON.stringify(out)); } catch (e) {}
    return out;
  }

  function resetFavs() {
    try { localStorage.removeItem(favKeyNow()); } catch (e) {}
    try { localStorage.removeItem(FAV_KEY3); } catch (e1) {}
    try { localStorage.removeItem(FAV_KEY); } catch (e2) {}
  }
  /*@3.NODJ.14*/
  /*@3.NODJ.72*/
  function hiSig(f) {
    if (f.tool !== 'hi') return '';
    var m = f.hiMode || (f.straight ? 'line' : 'free');
    return m + ':' + (f.hiStyle === 'under' ? 'under' : 'fill');
  }
  function favKey(f) {
    return [f.tool, f.color, f.width, f.nib,
            f.tool === 'era' ? (f.mode || 'whole') : '',
            hiSig(f)].join('|');
  }
  function favName(f) {
    var t = null, i;
    for (i = 0; i < RING1.length; i++) if (RING1[i].tool === f.tool) t = RING1[i];
    var tn = t ? L(t.ar, t.en) : f.tool;
    if (f.tool === 'era') {
      return (f.mode === 'part') ? L('ممحاة القلم', 'Pen eraser')
                                 : L('ممحاة ذكيّة', 'Smart eraser');
    }
    if (f.tool === 'lasso' || f.tool === 'sel' || f.tool === 'hand') return tn;
    /*@3.NODJ.50*/
    if (f.tool === 'pen') {
      var nn = null;
      for (i = 0; i < NIBS.length; i++) if (NIBS[i].k === f.nib) nn = L(NIBS[i].ar, NIBS[i].en);
      return (nn || tn) + ' · ' +
             (TONE_AR[f.color] ? L(TONE_AR[f.color], TONE_EN[f.color]) : f.color) +
             ' · ' + f.width;
    }
    if (f.tool === 'hi') {
      /*@3.NODJ.74*/
      var hm2 = f.hiMode || (f.straight ? 'line' : 'free');
      var mn = hm2 === 'text' ? L('يلتقط الأسطر', 'snaps to lines')
             : hm2 === 'line' ? L('مستقيم', 'straight') : L('حرّ', 'freehand');
      return (f.hiStyle === 'under' ? L('تسطير', 'Underline') : L('تظليل', 'Highlight')) + ' · ' +
        (TONE_AR[f.color] ? L(TONE_AR[f.color], TONE_EN[f.color]) : f.color) + ' · ' + mn;
    }
    var cn = TONE_AR[f.color] ? L(TONE_AR[f.color], TONE_EN[f.color]) : f.color;
    return tn + ' · ' + cn + ' · ' + f.width;
  }

  function readPos() {
    try {
      var p = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
      if (p && isFinite(p.x) && isFinite(p.y)) return p;
    } catch (e) {}
    return null;
  }
  function writePos(p) {
    try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch (e) {}
  }

  function Dial(opts) {
    var o = opts || {};
    /*@3.NODJ.134*/
    this.o = o;
    this.getCv = o.canvas || function () { return null; };
    this.onExit = o.onExit || function () {};
    this.favHost = o.favHost || null;
    /*@3.NODJ.90*/
    SURFACE = o.surface || SURFACE || '';
    this.open = false;
    this.sub = null;
    this.build();
    this.buildFavs();
    this.place(readPos());
    this.sync();
  }

  /*@3.NODJ.11*/
  Dial.prototype.buildFavs = function () {
    if (!this.favHost) return;
    var dock = document.createElement('div');
    dock.className = 'ndl-dock';
    dock.hidden = true;
    var bar = document.createElement('div');
    bar.className = 'ndl-favs';
    bar.hidden = true;
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', L('مفضّلة القلم', 'Pen favourites'));
    dock.appendChild(bar);
    /*@3.NODJ.67*/
    var cbar = document.createElement('div');
    cbar.className = 'ndl-favs ndl-favs--colors';
    cbar.hidden = !colorsPinned();
    cbar.setAttribute('role', 'toolbar');
    cbar.setAttribute('aria-label', L('ألوانُ القلم', 'Pen colours'));
    dock.appendChild(cbar);
    /*@3.NODJ.81*/
    var tbar = document.createElement('div');
    tbar.className = 'ndl-favs ndl-favs--tools';
    tbar.hidden = !barOn('tools');
    tbar.setAttribute('role', 'toolbar');
    tbar.setAttribute('aria-label', L('أدواتُ الرسم', 'Drawing tools'));
    dock.appendChild(tbar);
    /*@3.NODJ.110*/
    var mbar = document.createElement('div');
    mbar.className = 'ndl-favs ndl-favs--mine';
    mbar.hidden = !barOn('mine');
    mbar.setAttribute('role', 'toolbar');
    mbar.setAttribute('aria-label', L('شريطي', 'My bar'));
    dock.appendChild(mbar);
    /*@3.NODJ.124*/
    var selfM = this;
    /*@3.NODJ.123*/
    mbar.addEventListener('pointerdown', function (e) {
      if (e.target.closest('[data-xact]')) e.preventDefault();
    });
    mbar.addEventListener('click', function (e) {
      var xb = e.target.closest('[data-xact]');
      if (xb) { selfM.textAct(xb.getAttribute('data-xact')); return; }
      var cvM = selfM.getCv();
      var rb = e.target.closest('[data-rtool]');
      if (rb) {
        if (cvM && cvM.setTool) cvM.setTool(rb.getAttribute('data-rtool'));
        selfM.sync(); selfM.paintMine(); return;
      }
      var sw2 = e.target.closest('.ndl-fav-sw[data-tone]');
      if (sw2) {
        if (cvM && cvM.setColor) cvM.setColor(sw2.getAttribute('data-tone'));
        selfM.sync(); selfM.paintMine(); return;
      }
      var hb2 = e.target.closest('[data-hist]');
      if (hb2) {
        if (!cvM) return;
        if (hb2.getAttribute('data-hist') === 'undo') {
          if (cvM.hist) cvM.hist.undo(); else if (cvM.undo) cvM.undo();
        } else if (cvM.hist) { cvM.hist.redo(); } else if (cvM.redo) { cvM.redo(); }
        selfM.sync(); return;
      }
      if (e.target.closest('[data-baredit]')) { selfM.barDialog(); return; }
      var szM = e.target.closest('[data-fixsize]');
      if (szM) { selfM.sizePop(szM); return; }
      var clM = e.target.closest('[data-fixcol]');
      if (clM) { selfM.colorPop(clM); return; }
      if (e.target.closest('[data-palm]')) { selfM.cyclePalm(); return; }
      if (e.target.closest('[data-penbtn]')) { selfM.penBtnDialog(); return; }
      if (e.target.closest('[data-pincol]')) { selfM.togglePin(); selfM.applyBar(); return; }
    });
    this.favHost.appendChild(dock);
    this.dock = dock;
    this.favBar = bar;
    this.colorBar = cbar;
    this.toolBar = tbar;
    this.mineBar = mbar;
    bar.hidden = !barOn('favs');
    this.paintFavs();
    this.paintColors();
    this.paintTools();
    this.paintMine();
    var selfT = this;
    tbar.addEventListener('click', function (e) {
      var b2 = e.target.closest('[data-rtool]');
      if (!b2) return;
      var cv2 = selfT.getCv();
      if (cv2 && cv2.setTool) cv2.setTool(b2.getAttribute('data-rtool'));
      selfT.sync();
      selfT.paintTools();
    });

    var self = this;
    cbar.addEventListener('click', function (e) {
      if (self._justSorted) return;
      var cv = self.getCv();
      var tab = e.target.closest('[data-pl]');
      if (tab) { self.plShow(tab.getAttribute('data-pl')); return; }
      if (e.target.closest('[data-pl-add]')) { self.plAct('newlist'); return; }
      if (e.target.closest('[data-pl-put]')) { self.plAct('add'); return; }
      var sw = e.target.closest('[data-tone]');
      if (sw && cv) { cv.setColor(sw.getAttribute('data-tone')); self.sync(); return; }
      if (e.target.closest('[data-pal]')) { self.cyclePalette(); return; }
      if (e.target.closest('[data-custom]')) { self.pickCustom(e.target.closest('[data-custom]')); }
    });
    cbar.addEventListener('contextmenu', function (e) {
      var it = e.target.closest('[data-ix],[data-rec],[data-pl]');
      if (!it) return;
      e.preventDefault();
      self.plPop(it, e.clientX, e.clientY);
    });
    var chold = null, chx = 0, chy = 0;
    cbar.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      var it = e.target.closest('[data-ix],[data-rec],[data-pl]');
      if (!it) return;
      chx = e.clientX; chy = e.clientY;
      if (chold) clearTimeout(chold);
      chold = setTimeout(function () {
        chold = null;
        if (self._sorting) return;
        self.plPop(it, chx, chy);
      }, 520);
    }, { passive: true });
    var cdrop = function (e) {
      if (!chold) return;
      if (e && e.clientX != null &&
          (Math.abs(e.clientX - chx) > 10 || Math.abs(e.clientY - chy) > 10)) {
        clearTimeout(chold); chold = null; return;
      }
      if (e && e.type !== 'pointermove') { clearTimeout(chold); chold = null; }
    };
    cbar.addEventListener('pointermove', cdrop, { passive: true });
    cbar.addEventListener('pointerup', cdrop, { passive: true });
    cbar.addEventListener('pointercancel', cdrop, { passive: true });
    this.bindSort();

    bar.addEventListener('click', function (e) {
      if (self._justSorted) return;
      if (e.target.closest('[data-pincol]')) { self.togglePin(); return; }
      var star = e.target.closest('[data-fav-star]');
      if (star) { self.toggleFav(); return; }
      var hb = e.target.closest('[data-hist]');
      if (hb) {
        var hcv = self.getCv();
        if (hcv) {
          if (hb.getAttribute('data-hist') === 'undo') {
            if (hcv.hist) hcv.hist.undo(); else if (hcv.undo) hcv.undo();
          } else if (hcv.hist) { hcv.hist.redo(); } else if (hcv.redo) { hcv.redo(); }
        }
        self.sync();
        return;
      }
/*@3.NODJ.111*/
/*@3.NODJ.121*/
      var xb = e.target.closest('[data-xact]');
      if (xb) { self.textAct(xb.getAttribute('data-xact')); return; }
      if (e.target.closest('[data-palm]')) { self.cyclePalm(); return; }
      if (e.target.closest('[data-tilt]')) { self.toggleTilt(); return; }
      if (e.target.closest('[data-penbtn]')) { self.penBtnDialog(); return; }
      /*@3.NODJ.85*/
      if (e.target.closest('[data-baredit]')) { self.barDialog(); return; }
      var szb = e.target.closest('[data-fixsize]');
      if (szb) { self.sizePop(szb); return; }
      /*@3.NODJ.42*/
      var clb = e.target.closest('[data-fixcol]');
      if (clb) { self.colorPop(clb); return; }
      var fix = e.target.closest('[data-fix]');
      var rec = fix ? null : e.target.closest('[data-recent]');
      var chip = fix || rec || e.target.closest('[data-fav]');
      if (!chip) return;
      var f = fix ? FAV_FIXED[Number(fix.getAttribute('data-fix'))]
            : rec ? recents()[Number(rec.getAttribute('data-recent'))]
                  : favs()[Number(chip.getAttribute('data-fav'))];
      var cv = self.getCv();
      if (!f || !cv) return;
      if (f.tool === 'era' && cv.setEraseMode) cv.setEraseMode(f.mode || 'whole');
      /*@3.NODJ.73*/
      if (f.tool === 'hi') {
        if (f.hiMode && cv.setHiMode) cv.setHiMode(f.hiMode);
        else if (cv.setStraight) cv.setStraight(!!f.straight);
        if (cv.setHiStyle) cv.setHiStyle(f.hiStyle === 'under' ? 'under' : 'fill');
      }
      cv.setTool(f.tool);
      /*@3.NODJ.19*/
      if (!INKY[f.tool]) { self.sync(); return; }
      cv.setColor(f.color);
      cv.setWidth(f.width);
      cv.setNib(f.nib);
      self.sync();
    });

    /*@3.NODJ.60*/
    /*@3.NODJ.92*/
    dock.addEventListener('contextmenu', function (e) {
      /*@3.NODJ.98*/
      if (e.defaultPrevented) return;
      if (e.target.closest('[data-hist],[data-palm],[data-tilt],[data-penbtn]')) return;
      e.preventDefault();
      self.favPop(e.target.closest('[data-fav],[data-recent]'), e.clientX, e.clientY);
    });
    var hold = null, hx = 0, hy = 0;
/*@3.NODJ.122*/
    dock.addEventListener('pointerdown', function (e) {
      if (e.target.closest('[data-xact]')) { e.preventDefault(); return; }
      if (e.pointerType === 'mouse') return;
      /*@3.NODJ.101*/
      if (e.target.closest('[data-ix],[data-rec],[data-pl],[data-rtool]')) return;
      if (e.target.closest('[data-hist],[data-palm],[data-tilt],[data-penbtn]')) return;
      hx = e.clientX; hy = e.clientY;
      var chip = e.target.closest('[data-fav],[data-recent]');
      if (hold) clearTimeout(hold);
      hold = setTimeout(function () {
        hold = null;
        if (self._sorting) return;
        self.favPop(chip, hx, hy);
      }, 520);
    }, { passive: true });
    var drop = function (e) {
      if (!hold) return;
      if (e && e.clientX != null &&
          (Math.abs(e.clientX - hx) > 10 || Math.abs(e.clientY - hy) > 10)) {
        clearTimeout(hold); hold = null; return;
      }
      if (e && e.type !== 'pointermove') { clearTimeout(hold); hold = null; }
    };
    bar.addEventListener('pointermove', drop, { passive: true });
    bar.addEventListener('pointerup', drop, { passive: true });
    bar.addEventListener('pointercancel', drop, { passive: true });
  };

  /*@3.NODJ.61*/
  function favRow(act, icon, ar, en, off, dz) {
    return { a: act, i: icon, t: L(ar, en), off: !!off, dz: dz ? 1 : 0 };
  }

  Dial.prototype.closeFavPop = function () {
    var el = this._fvPop;
    this._fvPop = null;
    if (el && el.isConnected && window.GardenMenu) GardenMenu.close();
  };

  /*@3.NODJ.136*/
  Dial.prototype.richPop = function (x, y, model, run) {
    var self = this;
    if (!window.GardenMenu || !GardenMenu.rich) return null;
    var el = GardenMenu.rich(x, y + 6, model, function (act) { self._fvPop = null; run(act); },
      { cls: 'ndl-favpop', attr: 'data-fx', focus: false, keepFocus: true,
        onClose: function () { if (self._fvPop === el) self._fvPop = null; } });
    this._fvPop = el || null;
    return el;
  };

  Dial.prototype.favPop = function (chip, x, y) {
    var self = this;
    this.closeFavPop();
    this.closeSizePop();
    this.closeColorPop();
    var list = favs();
    var isRec = !!(chip && chip.hasAttribute('data-recent'));
    var ix = chip ? Number(chip.getAttribute(isRec ? 'data-recent' : 'data-fav')) : -1;
    var cur = this.current();
    var head, quick = [], items = [];
    if (isRec) {
      head = { ico: 'fa-clock-rotate-left', t: L('أداةٌ استعملتَها أخيراً', 'A recent tool') };
      quick.push(favRow('add', 'fa-star', 'أضِفْ إلى المفضّلة', 'Add to favourites'));
    } else if (ix >= 0 && list[ix]) {
      head = { ico: 'fa-star', t: favName(list[ix]), s: L('في المفضّلة', 'In favourites') };
      quick.push(favRow('put', 'fa-right-left', 'ضَعِ الحاليّةَ مكانَها', 'Replace with current', !cur),
                 favRow('back', 'fa-arrow-right-long', 'قبلَها', 'Earlier', ix <= 0),
                 favRow('fwd', 'fa-arrow-left-long', 'بعدَها', 'Later', ix >= list.length - 1),
                 favRow('del', 'fa-trash', 'أزِلْها', 'Remove', false, 1));
    } else {
      head = { ico: 'fa-star', t: L('المفضّلةُ والأشرطة', 'Favourites & bars') };
    }
    if (!isRec) {
      items.push(favRow('add', 'fa-plus', 'أضِفِ الأداةَ الحاليّة', 'Add current tool', !cur),
                 favRow('reset', 'fa-rotate-left', 'أعِدِ المفضّلةَ الافتراضيّة', 'Reset favourites'));
    }
    /*@3.NODJ.91*/
    var rowsNow = barRead();
    var onOf = function (k) { return !!barOf(rowsNow, k).on; };
    items.push({ h: L('الأشرطة', 'The bars') });
    [['favs', 'fa-star', 'شريطُ المفضّلة', 'Favourites bar'], ['colors', 'fa-palette', 'شريطُ الألوان', 'Colours bar'],
     ['tools', 'fa-pen-ruler', 'شريطُ الأدوات', 'Tools bar'], ['mine', 'fa-wand-magic-sparkles', 'شريطي', 'My bar']].forEach(function (b) {
      items.push({ a: 'bar:' + b[0], i: b[1], t: L(b[2], b[3]), ok: onOf(b[0]) });
    });
    items.push(favRow('baredit', 'fa-sliders', 'عدّلِ الشريط…', 'Edit the bar…'));
    /*@3.NODJ.135*/
    items.push({ sep: 1 }, favRow('barreset', 'fa-rotate-left', 'أعِدِ الترتيبَ الافتراضيّ', 'Restore the default layout'),
               favRow('barwipe', 'fa-eraser', 'أعِدْ كلَّ شيءٍ إلى الافتراضيّ', 'Reset everything to default', false, 1));
    return this.richPop(x, y, { head: head, quick: quick, items: items }, function (act) { self.favAct(act, ix, isRec); });
  };

  /*@3.NODJ.62*/
  Dial.prototype.favAct = function (act, ix, isRec) {
    var list = favs();
    /*@3.NODJ.97*/
    if (act.indexOf('bar:') === 0) {
      var kR = act.slice(4);
      var dR = barRead(), bR = barOf(dR, kR);
      bR.on = bR.on ? 0 : 1;
      barWrite(dR);
      if (kR === 'colors') { try { localStorage.setItem(PIN_KEY, bR.on ? '1' : '0'); } catch (eP) {} }
      this.applyBar();
      return true;
    }
    if (act === 'baredit') { this.barDialog(); return true; }
    if (act === 'barreset') {
      try { localStorage.removeItem(BAR_KEY); } catch (eB) {}
      try { localStorage.removeItem(PIN_KEY); } catch (eB2) {}
      this.applyBar();
      return true;
    }
    if (act === 'barwipe') {
      var gone = [], kW, iW;
      try {
        for (iW = 0; iW < localStorage.length; iW++) {
          kW = localStorage.key(iW);
          if (/^garden_(ink|pdfink|shape_kit|notes_inkclip)/.test(kW || '')) gone.push(kW);
        }
        for (iW = 0; iW < gone.length; iW++) localStorage.removeItem(gone[iW]);
      } catch (eW) {}
      resetFavs();
      try { location.reload(); } catch (eR) {}
      return true;
    }
    if (act === 'reset') {
      resetFavs();
    } else if (act === 'add') {
      var f = isRec ? recents()[ix] : this.current();
      if (!f) return false;
      var key = favKey(f), i;
      for (i = 0; i < list.length; i++) if (favKey(list[i]) === key) return false;
      list.splice(ix >= 0 && !isRec ? ix : list.length, 0, f);
      setFavs(list);
    } else if (act === 'del') {
      if (!(ix >= 0) || !list[ix]) return false;
      list.splice(ix, 1);
      setFavs(list);
    } else if (act === 'put') {
      var c = this.current();
      if (!c || !(ix >= 0)) return false;
      list[ix] = c;
      setFavs(list);
    } else if (act === 'back' || act === 'fwd') {
      var to = act === 'back' ? ix - 1 : ix + 1;
      if (!(ix >= 0) || to < 0 || to >= list.length) return false;
      var t = list[ix]; list[ix] = list[to]; list[to] = t;
      setFavs(list);
    } else return false;
    this.paintFavs();
    this.sync();
    return true;
  };

  /*@3.NODJ.15*/
  /*@3.NODJ.49*/
  function favIcon(f) {
    if (f.tool === 'era') return f.mode === 'part' ? ICONS.eraserPen : ICONS.eraserSmart;
    if (f.tool === 'hi') {
      if (f.hiStyle === 'under') return '<i class="fa-solid fa-underline" aria-hidden="true"></i>';
      return f.straight ? ICONS.hiStraight : ICONS.hiWave;
    }
    if (f.tool === 'lasso') return LASSO_SVG;
    if (f.tool === 'pen') return NIB_ICON[f.nib] || NIB_ICON.round;
    var t = null, k;
    for (k = 0; k < RING1.length; k++) if (RING1[k].tool === f.tool) t = RING1[k];
    if (t && t.html) return t.html;
    return '<i class="fa-solid ' + ((t && t.icon) || 'fa-pen') + '" aria-hidden="true"></i>';
  }

  /*@3.NODJ.44*/
  function sizeChip(cv) {
    var w = (cv && cv.width) || 4;
    var nib = (cv && cv.nib) || 'round';
    var bar = Math.max(1.5, Math.min(7, w * 0.55));
    var nm = null, i;
    for (i = 0; i < NIBS.length; i++) if (NIBS[i].k === nib) nm = NIBS[i];
    var name = L('رأسُ القلم وسماكتُه', 'Pen nib and thickness') +
      (nm ? ' — ' + L(nm.ar, nm.en) + ' · ' + w : '');
    return '<button type="button" class="ndl-fav ndl-fav-size" data-fixsize="1"' +
      ' aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(name) + '" title="' + esc(name) + '">' +
      '<span class="ndl-nib-i" aria-hidden="true">' + (NIB_ICON[nib] || NIB_ICON.round) + '</span>' +
      '<span class="ndl-nib-w" aria-hidden="true" style="block-size:' + bar.toFixed(1) + 'px"></span>' +
      '</button>';
  }

  function curHex(cv) {
    if (!cv) return hexOf('ink');
    var K = window.GardenCanvas;
    if (cv.tool === 'hi' && K && K.hiHexOf) return K.hiHexOf(cv.color);
    return hexOf(cv.color);
  }

  function colorChip(cv) {
    var name = L('لونُ القلم', 'Pen colour');
    return '<button type="button" class="ndl-fav ndl-fav-col" data-fixcol="1"' +
      ' aria-haspopup="true" aria-expanded="false"' +
      ' aria-label="' + esc(name) + '" title="' + esc(name) + '">' +
      '<span class="ndl-col-dot" style="--t:' + curHex(cv) + '"></span>' +
      '</button>';
  }

  /*@3.NODJ.43*/
  var RAMP = [0.78, 0.58, 0.40, 0.22, 0, -0.18, -0.34, -0.50, -0.66];

  function shadesOf(tone, cv) {
    var K = window.GardenCanvas;
    var base = (cv && cv.tool === 'hi' && K && K.hiHexOf) ? K.hiHexOf(tone) : hexOf(tone);
    var mix = K && K.mixHex;
    return RAMP.map(function (k) {
      if (!k) return { hex: base, base: 1 };
      if (!mix) return { hex: base, base: 0 };
      return { hex: mix(base, k > 0 ? '#ffffff' : '#000000', Math.abs(k)), base: 0 };
    });
  }

  /*@3.NODJ.21*/
  /*@3.NODJ.51*/
  function favChip(f, attr, i) {
    var plain = f.tool === 'era' || f.tool === 'lasso' || f.tool === 'sel' || f.tool === 'hand';
    var inky = f.tool === 'pen' || f.tool === 'hi';
    var bar = inky
      ? '<span class="ndl-nib-w" aria-hidden="true" style="block-size:' +
        Math.max(1.5, Math.min(7, (f.width || 4) * (f.tool === 'hi' ? 0.16 : 0.55))).toFixed(1) +
        'px"></span>'
      : '';
    return '<button type="button" class="ndl-fav' + (inky ? ' ndl-fav-ink' : '') + '" ' +
      attr + '="' + i + '"' +
      (plain ? '' : ' data-tint="1" style="--t:' + hexOf(f.color) + '"') +
      ' aria-label="' + esc(favName(f)) + '" title="' + esc(favName(f)) + '">' +
      '<span class="ndl-nib-i" aria-hidden="true">' + favIcon(f) + '</span>' + bar +
      '</button>';
  }

  /*@3.NODJ.17*/
  function histChip(k, icon, ar, en) {
    return '<button type="button" class="ndl-fav ndl-fav-opt" data-hist="' + k + '" disabled' +
      ' aria-label="' + esc(L(ar, en)) + '" title="' + esc(L(ar, en)) + '"' +
      ' data-ar-title="' + esc(ar) + '" data-en-title="' + esc(en) + '">' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i></button>';
  }

/*@3.NODJ.108*/
  Dial.prototype.atomHtml = function (it, ix) {
    var cv = this.getCv();
    if (it === 'sep') return '<span class="ndl-fav-sep" aria-hidden="true"></span>';
    if (it === 'spring') return '<span class="ndl-fav-spring" aria-hidden="true"></span>';
    if (it === 'undo') return histChip('undo', 'fa-rotate-left', 'تراجع', 'Undo');
    if (it === 'redo') return histChip('redo', 'fa-rotate-right', 'إعادة', 'Redo');
    if (it === 'color') return colorChip(cv);
    if (it === 'size') return sizeChip(cv);
    if (it.indexOf('fx:') === 0) {
      var ixF = Number(it.slice(3));
      return FAV_FIXED[ixF] ? favChip(FAV_FIXED[ixF], 'data-fix', ixF) : '';
    }
    if (it === 'favs') return favs().map(function (f, i) { return favChip(f, 'data-fav', i); }).join('');
    if (it === 'recent') return recents().map(function (f, i) { return favChip(f, 'data-recent', i); }).join('');
    if (it === 'star') {
      return '<button type="button" class="ndl-fav-star" data-fav-star="1"' +
        ' aria-pressed="false" aria-label="' + esc(L('أضِف للمفضّلة', 'Add to favourites')) + '"' +
        ' title="' + esc(L('أضِف للمفضّلة', 'Add to favourites')) + '">' + ICONS.star + '</button>';
    }
    if (it === 'palm') {
      var pm = palmNow(cv), pu = PALM_UI[pm];
      return '<button type="button" class="ndl-fav ndl-fav-opt" data-palm="1"' +
        ' aria-label="' + esc(L(pu.ar, pu.en)) + '" title="' + esc(L(pu.ar, pu.en)) + '">' +
        ICONS[pu.icon] + '</button>';
    }
    if (it === 'penbtn') {
      return '<button type="button" class="ndl-fav ndl-fav-opt" data-penbtn="1"' +
        ' aria-label="' + esc(L('أزرارُ القلم', 'Pen buttons')) + '"' +
        ' title="' + esc(L('أزرارُ القلم', 'Pen buttons')) + '">' + ICONS.penBtn + '</button>';
    }
    if (it === 'pincol') {
      return '<button type="button" class="ndl-fav ndl-fav-opt" data-pincol="1"' +
        ' aria-pressed="' + (colorsPinned() ? 'true' : 'false') + '"' +
        ' aria-label="' + esc(L('شريطُ الألوان', 'Colour strip')) + '"' +
        ' title="' + esc(L('شريطُ الألوان — يثبت تحت المفضّلة', 'Colour strip — pinned under favourites')) + '">' +
        '<i class="fa-solid fa-palette" aria-hidden="true"></i></button>';
    }
    /*@3.NODJ.84*/
    if (it === 'baredit') {
      return '<button type="button" class="ndl-fav ndl-fav-opt" data-baredit="1"' +
        ' aria-label="' + esc(L('عدّلِ الشريط', 'Edit the bar')) + '"' +
        ' title="' + esc(L('عدّلِ الشريط — الأشرطةُ وأزرارُها والمفضّلة',
                           'Edit the bar — bars, their buttons and favourites')) + '">' +
        '<i class="fa-solid fa-sliders" aria-hidden="true"></i></button>';
    }
    if (it.indexOf('t:') === 0) {
      var tk = it.slice(2), m = atomMeta(it);
      if (!m) return '';
      if (tk === 'text' && !(cv && cv.canText)) return '';
      var nm = L(m.ar, m.en);
      return '<button type="button" class="ndl-fav" data-rtool="' + esc(tk) + '"' +
        ' aria-pressed="' + (cv && cv.tool === tk ? 'true' : 'false') + '"' +
        ' aria-label="' + esc(nm) + '" title="' + esc(nm) + '">' +
        (m.html || '<i class="fa-solid ' + (m.icon || 'fa-pen') + '" aria-hidden="true"></i>') +
        '</button>';
    }
    /*@3.NODJ.109*/
    if (it.indexOf('x:') === 0) {
      var tx = textAtom(it.slice(2));
      if (!tx) return '';
      var nx = L(tx.ar, tx.en);
      return '<button type="button" class="ndl-fav ndl-fav-txt" data-xact="' + esc(tx.k) + '"' +
        ' aria-label="' + esc(nx) + '" title="' + esc(nx) + '">' +
        '<i class="fa-solid ' + tx.icon + '" aria-hidden="true"></i></button>';
    }
/*@3.NODJ.120*/
    if (it === 'cols') {
      var K2 = window.GardenCanvas;
      var kind2 = plKind(cv), P2 = plRead()[kind2];
      var hexC = function (t) { return (kind2 === 'hi' && K2 && K2.hiHexOf) ? K2.hiHexOf(t) : hexOf(t); };
      var list2 = (P2.lists[P2.cur] || { c: [] }).c;
      return list2.map(function (t, i) {
        var nm2 = TONE_AR[t] ? L(TONE_AR[t], TONE_EN[t]) : t;
        return '<button type="button" class="ndl-fav ndl-fav-sw" data-tone="' + esc(t) + '"' +
          ' data-ix="' + i + '" style="--t:' + hexC(t) + '"' +
          ' aria-pressed="' + (cv && cv.color === t ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(nm2) + '" title="' + esc(nm2) + '"></button>';
      }).join('');
    }
    return '';
  };

  Dial.prototype.paintFavs = function () {
    if (!this.favBar) return;
    /*@3.NODJ.83*/
    var self = this;
    var items = barOf(barRead(), 'favs').items;
    var h = items.map(function (it, i) { return self.atomHtml(it, i); }).join('');
    this.favBar.innerHTML = h;
    /*@3.NODJ.116*/
    if (this._hintLive) {
      var hb = this.favBar.querySelector('[data-fixsize]');
      if (hb) hb.setAttribute('data-hint', '1');
    }
    i18n(this.favBar);
  };

  Dial.prototype.paintMine = function () {
    if (!this.mineBar) return;
    var self = this;
    var items = barOf(barRead(), 'mine').items;
    this.mineBar.innerHTML = items.map(function (it, i) { return self.atomHtml(it, i); }).join('');
    i18n(this.mineBar);
  };

  /*@3.NODJ.68*/
  Dial.prototype.paintColors = function () {
    if (!this.colorBar) return;
    var cv = this.getCv();
    var K = window.GardenCanvas;
    var pm = (K && K.paletteMode) ? K.paletteMode() : '';
    var kind = plKind(cv), P = plRead()[kind];
    var rec = this._plView === 'recent';
    var hexK = function (t) { return (kind === 'hi' && K && K.hiHexOf) ? K.hiHexOf(t) : hexOf(t); };
    var nameOf = function (t) { return TONE_AR[t] ? L(TONE_AR[t], TONE_EN[t]) : t; };
    var h = '<span class="ndl-pl-tabs" role="tablist">';
    P.lists.forEach(function (l, i) {
      var nm = L('قائمة ', 'List ') + (i + 1);
      h += '<button type="button" class="ndl-fav ndl-pl-tab" data-pl="' + i + '" role="tab"' +
        ' aria-selected="' + (!rec && i === P.cur ? 'true' : 'false') + '"' +
        ' aria-label="' + esc(nm) + '" title="' + esc(nm) + '">' + arDigits(i + 1) + '</button>';
    });
    if (P.lists.length < PL_LISTS_MAX) {
      h += '<button type="button" class="ndl-fav ndl-pl-tab ndl-pl-tab--add" data-pl-add="1"' +
        ' aria-label="' + esc(L('قائمةٌ جديدة', 'New list')) + '" title="' + esc(L('قائمةٌ جديدة', 'New list')) + '">' +
        '<i class="fa-solid fa-plus" aria-hidden="true"></i></button>';
    }
    h += '<button type="button" class="ndl-fav ndl-pl-tab" data-pl="recent" role="tab"' +
      ' aria-selected="' + (rec ? 'true' : 'false') + '"' +
      ' aria-label="' + esc(L('آخرُ الألوانِ المستعملة', 'Recently used colours')) + '"' +
      ' title="' + esc(L('آخرُ الألوانِ المستعملة', 'Recently used colours')) + '">' +
      '<i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i></button>';
    h += '</span><span class="ndl-fav-sep" aria-hidden="true"></span>';
    var cols = rec ? plRecents(kind) : P.lists[P.cur].c;
    if (!cols.length) {
      h += '<span class="ndl-pl-empty">' + esc(rec
        ? L('لم يُستعمل لونٌ بعد', 'No colours used yet')
        : L('القائمةُ فارغة — أضِفِ اللونَ الحاليّ', 'Empty list — add the current colour')) + '</span>';
    }
    cols.forEach(function (t, i) {
      h += '<button type="button" class="ndl-fav ndl-fav-sw" data-tone="' + esc(t) + '" ' +
        (rec ? 'data-rec' : 'data-ix') + '="' + i + '" style="--t:' + hexK(t) + '"' +
        ' aria-pressed="' + (cv && cv.color === t ? 'true' : 'false') + '"' +
        ' aria-label="' + esc(nameOf(t)) + '" title="' + esc(nameOf(t)) + '"></button>';
    });
    if (!rec && cols.length < PL_MAX) {
      h += '<button type="button" class="ndl-fav ndl-fav-opt ndl-pl-put" data-pl-put="1"' +
        ' aria-label="' + esc(L('أضِفِ اللونَ الحاليَّ إلى القائمة', 'Add the current colour to this list')) + '"' +
        ' title="' + esc(L('أضِفِ اللونَ الحاليَّ إلى القائمة', 'Add the current colour to this list')) + '">' +
        '<i class="fa-solid fa-plus" aria-hidden="true"></i></button>';
    }
    h += '<span class="ndl-fav-tail">';
    var pal = pm === 'night'
      ? ['ألوانُ الليل — اضغط لألوانِ النهار', 'Night colours — tap for day colours', 'fa-moon']
      : (pm === 'day'
        ? ['ألوانُ النهار — اضغط للتلقائيّ', 'Day colours — tap for automatic', 'fa-sun']
        : ['الألوانُ تتبع الورقةَ — اضغط لألوانِ الليل', 'Colours follow the paper — tap for night colours',
           'fa-circle-half-stroke']);
    h += '<button type="button" class="ndl-fav ndl-fav-opt" data-pal="1"' +
      ' aria-pressed="' + (pm ? 'true' : 'false') + '"' +
      ' aria-label="' + esc(L(pal[0], pal[1])) + '" title="' + esc(L(pal[0], pal[1])) + '">' +
      '<i class="fa-solid ' + pal[2] + '" aria-hidden="true"></i></button>';
    h += '<button type="button" class="ndl-fav ndl-fav-opt" data-custom="1"' +
      ' aria-label="' + esc(L('لون مخصّص', 'Custom colour')) + '"' +
      ' title="' + esc(L('لون مخصّص', 'Custom colour')) + '">' +
      '<i class="fa-solid fa-eye-dropper" aria-hidden="true"></i></button></span>';
    this.colorBar.innerHTML = h;
    this.colorBar.setAttribute('data-kind', kind);
    i18n(this.colorBar);
  };

  /*@3.NODJ.82*/
  var ROW_TOOLS = ['pen', 'hi', 'text', 'rect', 'ell', 'line', 'arr', 'era', 'lasso', 'sel', 'hand'];

  Dial.prototype.paintTools = function () {
    var tb = this.toolBar;
    if (!tb) return;
    var cv = this.getCv();
    var now = cv ? String(cv.tool || '') : '';
    var meta = function (k) {
      var i;
      for (i = 0; i < RING1.length; i++) if (RING1[i].tool === k) return RING1[i];
      for (i = 0; i < SHAPES.length; i++) if (SHAPES[i].k === k) return SHAPES[i];
      return null;
    };
    var selfT2 = this;
    tb.innerHTML = barOf(barRead(), 'tools').items.map(function (it, i) {
      return selfT2.atomHtml(it, i);
    }).join('');
    i18n(tb);
  };

  Dial.prototype.plShow = function (k) {
    if (k === 'recent') { this._plView = 'recent'; this.paintColors(); return; }
    var d = plRead(), P = d[plKind(this.getCv())];
    var i = Number(k);
    if (!(i >= 0) || i >= P.lists.length) return;
    P.cur = i;
    plWrite(d);
    this._plView = 'list';
    this.paintColors();
  };

  Dial.prototype.plAct = function (act, ix, to) {
    var cv = this.getCv();
    var kind = plKind(cv), d = plRead(), P = d[kind];
    var list = P.lists[P.cur].c;
    var c = cv && typeof cv.color === 'string' ? cv.color : '';
    if (act === 'add') {
      if (!plOk(c) || list.indexOf(c) >= 0 || list.length >= PL_MAX) return false;
      list.push(c);
    } else if (act === 'put') {
      if (!plOk(c) || !(ix >= 0) || ix >= list.length) return false;
      list[ix] = c;
    } else if (act === 'del') {
      if (!(ix >= 0) || ix >= list.length) return false;
      list.splice(ix, 1);
    } else if (act === 'move') {
      if (!(ix >= 0) || ix >= list.length || !(to >= 0) || to >= list.length) return false;
      var it = list.splice(ix, 1)[0];
      list.splice(to, 0, it);
    } else if (act === 'rec-add') {
      var r = plRecents(kind)[ix];
      if (!r || list.indexOf(r) >= 0 || list.length >= PL_MAX) return false;
      list.push(r);
      this._plView = 'list';
    } else if (act === 'newlist') {
      if (P.lists.length >= PL_LISTS_MAX) return false;
      P.lists.push({ c: plOk(c) ? [c] : [] });
      P.cur = P.lists.length - 1;
      this._plView = 'list';
    } else if (act === 'dellist') {
      if (P.lists.length <= 1) return false;
      P.lists.splice(ix >= 0 ? ix : P.cur, 1);
      P.cur = Math.min(P.cur, P.lists.length - 1);
      this._plView = 'list';
    } else if (act === 'reset') {
      P.lists = PL_DEFAULTS[kind].map(function (x) { return { c: x.slice() }; });
      P.cur = 0;
      this._plView = 'list';
    } else if (act === 'clear-rec') {
      try {
        var a = JSON.parse(localStorage.getItem(PL_REC_KEY) || 'null') || {};
        a[kind] = [];
        localStorage.setItem(PL_REC_KEY, JSON.stringify(a));
      } catch (e) {}
      this.paintColors();
      return true;
    } else return false;
    plWrite(d);
    this.paintColors();
    this.sync();
    return true;
  };

  Dial.prototype.plPop = function (it, x, y) {
    var self = this;
    this.closeFavPop();
    this.closeSizePop();
    this.closeColorPop();
    var cv = this.getCv();
    var kind = plKind(cv), P = plRead()[kind];
    var isIx = it.hasAttribute('data-ix'), isRec = it.hasAttribute('data-rec'), isTab = it.hasAttribute('data-pl');
    var ix = isIx ? Number(it.getAttribute('data-ix')) : isRec ? Number(it.getAttribute('data-rec')) : -1;
    var tab = isTab ? it.getAttribute('data-pl') : '';
    var cur = cv && plOk(cv.color);
    var head = null, quick = [], items = [];
    if (isIx) {
      var t = P.lists[P.cur].c[ix];
      head = { ico: 'fa-palette', t: TONE_AR[t] ? L(TONE_AR[t], TONE_EN[t]) : t, s: L('قائمة ', 'List ') + (P.cur + 1) };
      quick.push(favRow('put', 'fa-right-left', 'ضَعِ الحاليَّ مكانَه', 'Replace with current', !cur),
                 favRow('add', 'fa-plus', 'أضِفِ الحاليّ', 'Add current', !cur),
                 favRow('del', 'fa-trash', 'أزِلْه', 'Remove', false, 1));
    } else if (isRec) {
      head = { ico: 'fa-clock-rotate-left', t: L('لونٌ استعملتَه أخيراً', 'A recent colour') };
      items.push(favRow('rec-add', 'fa-plus', 'أضِفْه إلى القائمةِ الحاليّة', 'Add to current list'),
                 favRow('clear-rec', 'fa-trash', 'امسحْ آخرَ الألوان', 'Clear recent colours', false, 1));
    } else if (isTab && tab === 'recent') {
      head = { ico: 'fa-clock-rotate-left', t: L('آخرُ الألوان', 'Recent colours') };
      items.push(favRow('clear-rec', 'fa-trash', 'امسحْ آخرَ الألوان', 'Clear recent colours', false, 1));
    } else if (isTab) {
      head = { ico: 'fa-swatchbook', t: L('قائمة ', 'List ') + (Number(tab) + 1) };
      items.push(favRow('newlist', 'fa-plus', 'قائمةٌ جديدة', 'New list', P.lists.length >= PL_LISTS_MAX),
                 favRow('reset', 'fa-rotate-left', 'أعِدِ القوائمَ الافتراضيّة', 'Reset lists'),
                 { sep: 1 },
                 favRow('dellist', 'fa-trash', 'احذفْ هذه القائمة', 'Delete this list', P.lists.length <= 1, 1));
    }
    if (!head) return null;
    return this.richPop(x, y, { head: head, quick: quick, items: items }, function (act) {
      self.plAct(act, act === 'dellist' ? Number(tab) : ix);
    });
  };

  Dial.prototype.cyclePalette = function () {
    var K = window.GardenCanvas;
    if (!K || !K.setPalette) return;
    var pm = K.paletteMode();
    K.setPalette(pm === '' ? 'night' : (pm === 'night' ? 'day' : ''));
    var cv = this.getCv();
    if (cv && cv.paint) { try { cv.paint(); } catch (e) {} }
    this.paintFavs();
    this.paintColors();
    this.sync();
  };

/*@3.NODJ.117*/
  Dial.prototype.liveEd = function () {
    var ae = document.activeElement;
    var r = (ae && ae.closest) ? ae.closest('.ne-root') : null;
    if (r && r.__ed) return r.__ed;
    var all = document.querySelectorAll('.ne-root');
    for (var i = all.length - 1; i >= 0; i--) if (all[i].__ed) return all[i].__ed;
    return null;
  };

  Dial.prototype.textAct = function (act) {
    var ed = this.liveEd();
    var ae = document.activeElement;
    var focused = !!(ae && ae.closest && ae.closest('.ne-root') && ae.isContentEditable);
    if (!focused && this.o && this.o.onTextAtom) {
      var took = false;
      try { took = !!this.o.onTextAtom(act); } catch (e0) { took = false; }
      if (took) return true;
    }
    if (!ed || !ed.exec) return false;
    if (act.indexOf('align:') === 0) {
      var av = act.slice(6), sa = ed.selState ? ed.selState() : {};
      ed.exec('align', sa.al === av ? 'start' : av);
      return true;
    }
    if (act.indexOf('list:') === 0) {
      var ty = act.slice(5), st = ed.selState ? ed.selState() : {};
      ed.exec('turn', { ty: st.ty === ty ? 'p' : ty });
      return true;
    }
    if (act === 'dir') {
      var sd = ed.selState ? ed.selState() : {};
      var here = (sd.dir === 'rtl' || sd.dir === 'ltr') ? sd.dir : (isAr() ? 'rtl' : 'ltr');
      ed.exec('dir', here === 'rtl' ? 'ltr' : 'rtl');
      return true;
    }
    try { ed.exec(act); } catch (e) { return false; }
    return true;
  };

  Dial.prototype.togglePin = function () {
    var on = !colorsPinned();
    setColorsPinned(on);
    if (this.colorBar) this.colorBar.hidden = !on;
    var b = this.favBar ? this.favBar.querySelector('[data-pincol]') : null;
    if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
  };

  /*@3.NODJ.69*/
  Dial.prototype.bindSort = function () {
    var self = this;
    function wire(bar, sel, onDrop) {
      var st = null, hold = null;
      function start() {
        if (!st || !st.it || st.on) return;
        st.on = true;
        self._sorting = true;
        try { bar.setPointerCapture(st.id); } catch (e2) {}
        var r = st.it.getBoundingClientRect();
        var g = st.it.cloneNode(true);
        g.className += ' ndl-ghost';
        g.style.inlineSize = r.width + 'px';
        g.style.blockSize = r.height + 'px';
        g.style.left = r.left + 'px';
        g.style.top = r.top + 'px';
        document.body.appendChild(g);
        st.g = g;
        st.it.classList.add('is-lifted');
        bar.classList.add('is-sorting');
      }
      function mark(to) {
        var items = [].slice.call(bar.querySelectorAll(sel));
        for (var i = 0; i < items.length; i++) items[i].classList.toggle('is-drop', i === to);
      }
      bar.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return;
        var it = e.target.closest(sel);
        var items = [].slice.call(bar.querySelectorAll(sel));
        st = { id: e.pointerId, it: it, from: it ? items.indexOf(it) : -1,
               x: e.clientX, y: e.clientY, sx: bar.scrollLeft, on: false,
               touch: e.pointerType !== 'mouse', to: null };
        if (hold) clearTimeout(hold);
        hold = null;
        /*@3.NODJ.70*/
        /*@3.NODJ.104*/
        if (it && st.touch) hold = setTimeout(function () {
          hold = null;
          if (!st) return;
          st.armed = true;
          bar.classList.add('is-armed');
        }, 320);
      });
      bar.addEventListener('pointermove', function (e) {
        if (!st || e.pointerId !== st.id) return;
        var dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (!st.on) {
          if (st.touch) {
            if (st.armed && st.it && !self._fvPop && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) { start(); }
            else {
              /*@3.NODJ.103*/
              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                if (hold) { clearTimeout(hold); hold = null; }
                st.armed = false;
                bar.classList.remove('is-armed');
              }
              return;
            }
          } else {
            if (!st.it || Math.abs(dx) + Math.abs(dy) < 6) return;
            start();
          }
        }
        e.preventDefault();
        st.g.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        var items = [].slice.call(bar.querySelectorAll(sel));
        var rtl = getComputedStyle(bar).direction === 'rtl';
        var to = items.length;
        for (var i = 0; i < items.length; i++) {
          var q = items[i].getBoundingClientRect();
          var mid = q.left + q.width / 2;
          if (rtl ? e.clientX > mid : e.clientX < mid) { to = i; break; }
        }
        st.to = to;
        mark(to);
      });
      function end(e) {
        if (!st || e.pointerId !== st.id) return;
        if (hold) { clearTimeout(hold); hold = null; }
        var was = st;
        st = null;
        try { bar.releasePointerCapture(was.id); } catch (e2) {}
        bar.classList.remove('is-armed');
        if (!was.on) return;
        self._sorting = false;
        if (was.g && was.g.parentNode) was.g.parentNode.removeChild(was.g);
        bar.classList.remove('is-sorting');
        var items = [].slice.call(bar.querySelectorAll(sel));
        for (var i = 0; i < items.length; i++) items[i].classList.remove('is-drop', 'is-lifted');
        self._justSorted = true;
        setTimeout(function () { self._justSorted = false; }, 0);
        if (e.type !== 'pointerup' || was.to == null) return;
        var to = was.to > was.from ? was.to - 1 : was.to;
        if (to !== was.from) onDrop(was.from, to);
      }
      bar.addEventListener('pointerup', end);
      bar.addEventListener('pointercancel', end);
    }
    if (this.favBar) {
      wire(this.favBar, '[data-fav]', function (from, to) {
        var list = favs();
        var it = list.splice(from, 1)[0];
        list.splice(to, 0, it);
        setFavs(list);
        self.paintFavs();
        self.sync();
      });
    }
    if (this.colorBar) {
      wire(this.colorBar, '[data-tone][data-ix]', function (from, to) {
        self.plAct('move', from, to);
      });
    }
  };

  /*@3.NODJ.46*/
  Dial.prototype.rec = function (used) {
    if (!used) return;
    var k = favKey(used);
    if (k === this._lastUsed) return;
    this._lastUsed = k;
    if (noteRecent(used)) this.paintFavs();
    if (INKY[used.tool] && noteRecentColor(used.tool === 'hi' ? 'hi' : 'pen', used.color) &&
        this._plView === 'recent') this.paintColors();
  };

  /*@3.NODJ.76*/
  var HI_MODES = [
    { k: 'text', icon: 'fa-align-center', ar: 'يلتقط سطرَ النصّ ويظلّله', en: 'Snaps to the line of text' },
    { k: 'line', svg: 'hiStraight', ar: 'تظليل مستقيم حيثما رسمت', en: 'Straight, wherever you draw' },
    { k: 'free', svg: 'hiWave', ar: 'تظليل حرّ يتبع يدك', en: 'Free highlight that follows your hand' }
  ];
  var HI_STYLES = [
    { k: 'fill',  icon: 'fa-highlighter', ar: 'يملأ خلفَ النصّ', en: 'Fills behind the text' },
    { k: 'under', icon: 'fa-underline', ar: 'خطٌّ تحت النصّ بدل التظليل',
      en: 'A line under the text instead of a fill' }
  ];
  function hiRows(cv) {
    if (!cv || cv.tool !== 'hi') return '';
    var hm = cv.hiMode || 'text', hs = cv.hiStyle === 'under' ? 'under' : 'fill';
    var row = function (list, attr, now) {
      return '<div class="ndl-szrow">' + list.map(function (o) {
        var nm = L(o.ar, o.en);
        return '<button type="button" class="ndl-szb" ' + attr + '="' + o.k + '"' +
          ' aria-pressed="' + (now === o.k ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(nm) + '" title="' + esc(nm) + '">' +
          (o.svg ? (ICONS[o.svg] || '') : '<i class="fa-solid ' + o.icon + '" aria-hidden="true"></i>') +
          '</button>';
      }).join('') + '</div>';
    };
    return '<div class="ndl-szsep" aria-hidden="true"></div>' +
      row(HI_MODES, 'data-hm', hm) + row(HI_STYLES, 'data-hs', hs);
  }

  /*@3.NODJ.94*/
  function tiltRow() {
    var I = window.GardenInkInput;
    if (!I || !I.tiltMode) return '';
    var tl = tiltLabel(), on = tiltNow() === 'auto';
    return '<div class="ndl-szsep" aria-hidden="true"></div>' +
      '<div class="ndl-szrow"><button type="button" class="ndl-szb" data-tiltx="1"' +
      ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
      ' data-live="' + (on && tiltSeen() ? '1' : '0') + '"' +
      ' aria-label="' + esc(L(tl[0], tl[1])) + '" title="' + esc(L(tl[0], tl[1])) + '">' +
      (ICONS.tilt || '<i class="fa-solid fa-pen-nib" aria-hidden="true"></i>') +
      '</button><span class="ndl-szlbl">' + esc(L(tl[0], tl[1])) + '</span></div>';
  }

  /*@3.NODJ.30*/
  Dial.prototype.sizePop = function (btn) {
    var self = this, cv = this.getCv();
    if (this._szPop) { this.closeSizePop(); return; }
    if (!cv) return;
    var ws = (cv.tool === 'hi') ? HI_W : PEN_W;
    var pop = document.createElement('div');
    pop.className = 'ndl-szpop';
    pop.innerHTML =
      '<div class="ndl-szrow">' + ws.map(function (w, i) {
        var d = Math.max(4, Math.min(18, w * 1.35));
        /*@3.NODJ.99*/
        var nm = L(WID_AR[i] || 'سماكة', WID_EN[i] || 'Width') + ' · ' + w;
        return '<button type="button" class="ndl-szb" data-w="' + w + '"' +
          ' aria-pressed="' + (Math.abs(cv.width - w) < 0.01 ? 'true' : 'false') + '"' +
          ' title="' + esc(nm) + '"' +
          ' aria-label="' + esc(nm) + '">' +
          '<span class="ndl-fav-dot" style="inline-size:' + d + 'px;block-size:' + d + 'px"></span>' +
          '</button>';
      }).join('') + '</div>' +
      '<div class="ndl-szrow">' + pickNibs().map(function (n) {
        return '<button type="button" class="ndl-szb" data-nib="' + n.k + '"' +
          ' aria-pressed="' + (cv.nib === n.k ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(L(n.ar, n.en)) + '" title="' + esc(L(n.ar, n.en)) + '">' +
          (NIB_ICON[n.k] || '') + '</button>';
      }).join('') + '</div>' + hiRows(cv) + tiltRow();
    (btn.parentNode || document.body).appendChild(pop);
    var r = btn.getBoundingClientRect();
    pop.style.position = 'fixed';
    /*@3.NODJ.78*/
    var pr = pop.getBoundingClientRect();
    var ph = pr.height || 110, pw = pr.width || 200;
    var top = r.bottom + 6;
    if (top + ph > innerHeight - 8) top = Math.max(8, r.top - 6 - ph);
    pop.style.insetBlockStart = Math.round(Math.max(8, Math.min(innerHeight - ph - 8, top))) + 'px';
    pop.style.left = Math.round(Math.max(8, Math.min(innerWidth - pw - 8,
      r.left + r.width / 2 - pw / 2))) + 'px';
    pop.addEventListener('click', function (e) {
      var wb = e.target.closest('[data-w]');
      if (wb) { cv.setWidth(parseFloat(wb.getAttribute('data-w'))); self.closeSizePop(); self.sync(); self.paintFavs(); return; }
      var nb = e.target.closest('[data-nib]');
      if (nb) { cv.setNib(nb.getAttribute('data-nib')); self.closeSizePop(); self.sync(); self.paintFavs(); return; }
      /*@3.NODJ.77*/
      if (e.target.closest('[data-tiltx]')) {
        self.toggleTilt(); self.closeSizePop(); self.sync(); self.paintFavs(); return;
      }
      var hb = e.target.closest('[data-hm],[data-hs]');
      if (!hb) return;
      if (hb.hasAttribute('data-hm') && cv.setHiMode) cv.setHiMode(hb.getAttribute('data-hm'));
      if (hb.hasAttribute('data-hs') && cv.setHiStyle) cv.setHiStyle(hb.getAttribute('data-hs'));
      self.closeSizePop(); self.sync(); self.paintFavs();
    });
    btn.setAttribute('aria-expanded', 'true');
    this._szPop = pop;
    this._szOut = function (e) { if (pop && !pop.contains(e.target)) self.closeSizePop(); };
    setTimeout(function () { document.addEventListener('pointerdown', self._szOut, true); }, 0);
  };

  Dial.prototype.colorPop = function (btn) {
    var self = this, cv = this.getCv();
    if (this._clPop) { this.closeColorPop(); return; }
    if (!cv) return;
    var pop = document.createElement('div');
    pop.className = 'ndl-clpop';
    pop.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    pop.innerHTML =
      '<div class="ndl-clrow" data-role="base">' + MAIN_TONES.map(function (t) {
        return '<button type="button" class="ndl-clb" data-tone="' + t + '"' +
          ' style="--t:' + (cv.tool === 'hi' && window.GardenCanvas && GardenCanvas.hiHexOf
                            ? GardenCanvas.hiHexOf(t) : hexOf(t)) + '"' +
          ' aria-pressed="' + (cv.color === t ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(L(TONE_AR[t], TONE_EN[t])) + '"' +
          ' title="' + esc(L(TONE_AR[t], TONE_EN[t])) + '"></button>';
      }).join('') +
      EDGE_TONES.map(function (t) {
        return '<button type="button" class="ndl-clb" data-tone="' + t.k + '"' +
          ' style="--t:' + hexOf(t.k) + '"' +
          ' aria-pressed="' + (cv.color === t.k ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(L(t.ar, t.en)) + '"' +
          ' title="' + esc(L(t.ar, t.en)) + '"></button>';
      }).join('') +
      '<button type="button" class="ndl-clb ndl-clb--more" data-more="1"' +
      ' aria-label="' + esc(L('بقيّةُ الألوان', 'More colours')) + '"' +
      ' title="' + esc(L('بقيّةُ الألوان', 'More colours')) + '">' +
      '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>' +
      '<button type="button" class="ndl-clb ndl-clb--pick" data-custom="1"' +
      ' aria-label="' + esc(L('لون مخصّص', 'Custom colour')) + '"' +
      ' title="' + esc(L('لون مخصّص', 'Custom colour')) + '">' +
      '<i class="fa-solid fa-eye-dropper" aria-hidden="true"></i></button></div>' +
      '<div class="ndl-clrow ndl-clrow--more" data-role="rest" hidden>' +
      TONES.filter(function (t) { return MAIN_TONES.indexOf(t) < 0; }).map(function (t) {
        return '<button type="button" class="ndl-clb" data-tone="' + t + '"' +
          ' style="--t:' + (cv.tool === 'hi' && window.GardenCanvas && GardenCanvas.hiHexOf
                            ? GardenCanvas.hiHexOf(t) : hexOf(t)) + '"' +
          ' aria-pressed="' + (cv.color === t ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(L(TONE_AR[t], TONE_EN[t])) + '"' +
          ' title="' + esc(L(TONE_AR[t], TONE_EN[t])) + '"></button>';
      }).join('') + '</div>' +
      '<div class="ndl-clramp" data-role="ramp" hidden></div>';
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect();
    var pr = pop.getBoundingClientRect();
    pop.style.position = 'fixed';
    pop.style.insetBlockStart = Math.round(Math.min(innerHeight - pr.height - 8,
                                                    r.bottom + 6)) + 'px';
    pop.style.insetInlineStart = '';
    var left = isAr() ? (r.right - pr.width) : r.left;
    pop.style.left = Math.round(Math.max(8, Math.min(left, innerWidth - pr.width - 8))) + 'px';
    btn.setAttribute('aria-expanded', 'true');
    this._clPop = pop;

    var paintRamp = function (tone) {
      var box = pop.querySelector('[data-role="ramp"]');
      if (!box) return;
      box.hidden = false;
      box.innerHTML = '<span class="ndl-clname">' +
        esc(L(TONE_AR[tone], TONE_EN[tone])) + '</span>' +
        shadesOf(tone, cv).map(function (s) {
          return '<button type="button" class="ndl-clb ndl-clb--sh' + (s.base ? ' is-base' : '') +
            '" data-hex="' + (s.base ? tone : s.hex) + '" style="--t:' + s.hex + '"' +
            ' aria-pressed="' + (cv.color === (s.base ? tone : s.hex) ? 'true' : 'false') + '"' +
            ' aria-label="' + esc(L(TONE_AR[tone], TONE_EN[tone])) + ' ' + s.hex + '"></button>';
        }).join('');
      i18n(box);
    };

    pop.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tone]');
      if (t) {
        var tone = t.getAttribute('data-tone');
        cv.setColor(tone);
        self.sync();
        paintRamp(tone);
        var q = pop.querySelectorAll('[data-tone]');
        for (var i = 0; i < q.length; i++) {
          q[i].setAttribute('aria-pressed', q[i] === t ? 'true' : 'false');
        }
        return;
      }
      var sh = e.target.closest('[data-hex]');
      if (sh) {
        cv.setColor(sh.getAttribute('data-hex'));
        self.sync();
        self.closeColorPop();
        return;
      }
      /*@3.NODJ.57*/
      if (e.target.closest('[data-more]')) {
        var rest = pop.querySelector('[data-role="rest"]');
        if (rest) rest.hidden = !rest.hidden;
        return;
      }
      if (e.target.closest('[data-custom]')) {
        self.closeColorPop();
        self.pickCustom(btn);
      }
    });
    if (typeof cv.color === 'string' && cv.color.charAt(0) !== '#') paintRamp(cv.color);
    this._clOut = function (e) { if (pop && !pop.contains(e.target)) self.closeColorPop(); };
    setTimeout(function () { document.addEventListener('pointerdown', self._clOut, true); }, 0);
  };

  Dial.prototype.closeColorPop = function () {
    if (this._clOut) { document.removeEventListener('pointerdown', this._clOut, true); this._clOut = null; }
    if (this._clPop) { try { this._clPop.remove(); } catch (e) {} this._clPop = null; }
    if (this.favBar) {
      var b = this.favBar.querySelector('[data-fixcol]');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  };

  Dial.prototype.closeSizePop = function () {
    if (this._szOut) { document.removeEventListener('pointerdown', this._szOut, true); this._szOut = null; }
    if (this._szPop) { try { this._szPop.remove(); } catch (e) {} this._szPop = null; }
    if (this.favBar) {
      var b = this.favBar.querySelector('[data-fixsize]');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  };

  /*@3.NODJ.48*/
  Dial.prototype.toggleTilt = function () {
    var I = window.GardenInkInput;
    if (!I || !I.setTiltMode) return;
    var next = tiltNow() === 'auto' ? 'off' : 'auto';
    I.setTiltMode(next);
    this.paintFavs();
    this.syncFavs();
    var cv = this.getCv();
    if (cv && cv.paint) cv.paint();
    return next;
  };

  Dial.prototype.cyclePalm = function () {
    var I = window.GardenInkInput;
    if (!I || !I.setPalmMode) return;
    var i = PALM_ORDER.indexOf(palmNow(this.getCv()));
    var next = PALM_ORDER[(i + 1) % PALM_ORDER.length];
    I.setPalmMode(next);
    this.paintFavs();
    this.syncFavs();
    return next;
  };

  /*@3.NODJ.18*/
  /*@3.NODJ.27*/
  Dial.prototype.applyAct = function (act) {
    var cv = this.getCv();
    if (!cv || !act || act === 'none') return false;
    /*@3.NODJ.31*/
    if (!cv.toggleAct) return false;
    var done = cv.toggleAct(act);
    if (done) this.sync();
    return done;
  };

  /*@3.NODJ.86*/
  var BAR_ROWS = [
    { k: 'favs',   icon: 'fa-star',   ar: 'المفضّلة', en: 'Favourites' },
    { k: 'colors', icon: 'fa-palette', ar: 'الألوان', en: 'Colours' },
    { k: 'tools',  icon: 'fa-pen-ruler', ar: 'الأدوات', en: 'Tools' },
    { k: 'mine',   icon: 'fa-wand-magic-sparkles', ar: 'شريطي', en: 'My bar' }
  ];
  /*@3.NODJ.114*/
  var ATOM_GROUPS = [
    { k: 'ink',    ar: 'رسمٌ وقلم', en: 'Pen and drawing' },
    { k: 'text',   ar: 'نصٌّ وتحرير', en: 'Text and editing' },
    { k: 'colour', ar: 'ألوان',      en: 'Colours' },
    { k: 'misc',   ar: 'ترتيب',      en: 'Arrangement' }
  ];
  function atomList() {
    var out = [], k;
    for (k in ATOMS) if (Object.prototype.hasOwnProperty.call(ATOMS, k)) out.push(k);
    TOOL_ATOMS.forEach(function (t) { out.push('t:' + t); });
    FAV_FIXED.forEach(function (f, i) { out.push('fx:' + i); });
    TEXT_ATOMS.forEach(function (t) { out.push('x:' + t.k); });
    return out;
  }

  function atomChip(it, extra) {
    var m = atomMeta(it);
    if (!m) return '';
    var nm = L(m.ar, m.en);
    var ic = m.html || '<i class="fa-solid ' + (m.icon || 'fa-circle') + '" aria-hidden="true"></i>';
    return '<button type="button" class="ndl-bc" ' + (extra || '') +
      ' data-atom="' + esc(it) + '" data-grp="' + esc(m.grp || 'misc') + '"' +
      ' aria-label="' + esc(nm) + '" title="' + esc(nm) + '">' + ic + '</button>';
  }

  /*@3.NODJ.112*/
  Dial.prototype.barDialog = function () {
    var self = this;
    var stale = document.getElementById('ndl-bar');
    if (stale) { try { stale.close(); } catch (e0) {} stale.remove(); }
    var dlg = document.createElement('dialog');
    dlg.id = 'ndl-bar';
    dlg.className = 'gsf ndl-bar';
    dlg.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    document.body.appendChild(dlg);

    function cardsHtml() {
      var st = barRead();
      return BAR_ROWS.map(function (r) {
        var b = barOf(st, r.k);
        var chips = b.items.map(function (it, i) {
          if (it === 'sep') {
            return '<span class="ndl-bc ndl-bc--sep" data-ix="' + i + '" data-bark="' + r.k + '"' +
              ' role="button" tabindex="0" aria-label="' + esc(L('فاصل', 'Separator')) + '"' +
              ' title="' + esc(L('فاصل', 'Separator')) + '"></span>';
          }
          if (it === 'spring') {
            return '<span class="ndl-bc ndl-bc--spring" data-ix="' + i + '" data-bark="' + r.k + '"' +
              ' role="button" tabindex="0" aria-label="' + esc(L('دفعٌ إلى الطرف', 'Push to the end')) + '"' +
              ' title="' + esc(L('دفعٌ إلى الطرف', 'Push to the end')) + '"></span>';
          }
          return atomChip(it, 'data-ix="' + i + '" data-bark="' + r.k + '"');
        }).join('');
        var fdN = b.fd ? 1 : 0;
        return '<section class="ndl-card" data-bark="' + r.k + '"' +
          ' data-fold="' + fdN + '">' +
          '<header class="ndl-card-h">' +
            '<button type="button" class="ndl-card-f" data-bfold="' + r.k + '"' +
              ' aria-expanded="' + (fdN ? 'false' : 'true') + '"' +
              ' aria-label="' + esc(L('اطوِ البطاقة', 'Collapse the card')) + '"' +
              ' title="' + esc(L('اطوِ البطاقة أو افتحْها', 'Collapse or open the card')) + '">' +
              '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
            '<i class="fa-solid ' + r.icon + '" aria-hidden="true"></i>' +
            '<span class="ndl-card-t">' + esc(L(r.ar, r.en)) + '</span>' +
            '<span class="ndl-card-n">' + b.items.length + '</span>' +
            '<button type="button" class="ndl-sw" data-bon="' + r.k + '"' +
              ' role="switch" aria-checked="' + (b.on ? 'true' : 'false') + '"' +
              ' aria-label="' + esc(L('أظهرْ هذا الشريط', 'Show this bar')) + '"' +
              ' title="' + esc(L('أظهرْ هذا الشريط', 'Show this bar')) + '"><i></i></button>' +
          '</header>' +
          '<div class="ndl-card-b" data-bark="' + r.k + '">' + chips +
            (b.items.length ? '' : '<span class="ndl-card-e">' +
              esc(L('لا أيقوناتٍ بعد — أضِفْ من الزرِّ أدناه.',
                    'No icons yet — add one with the button below.')) + '</span>') +
          '</div>' +
          /*@3.NODJ.129*/
          '<div class="ndl-card-f2">' +
            '<button type="button" class="ndl-bc ndl-bc--add" data-badd="' + r.k + '"' +
              ' aria-label="' + esc(L('أضِفْ أيقونة', 'Add an icon')) + '"' +
              ' title="' + esc(L('أضِفْ أيقونة', 'Add an icon')) + '">' +
              '<i class="fa-solid fa-plus" aria-hidden="true"></i></button>' +
            '<button type="button" class="ndl-bc ndl-bc--addsep" data-bsep="' + r.k + '"' +
              ' aria-label="' + esc(L('أضِفْ فاصلاً', 'Add a separator')) + '"' +
              ' title="' + esc(L('أضِفْ فاصلاً', 'Add a separator')) + '">' +
              '<i class="fa-solid fa-grip-lines-vertical" aria-hidden="true"></i></button>' +
            /*@3.NODJ.130*/
            '<button type="button" class="ndl-bc ndl-bc--restore" data-brestore="' + r.k + '"' +
              (barGone(b).length ? '' : ' disabled') +
              ' aria-label="' + esc(L('أعِدِ المحذوف', 'Restore removed')) + '"' +
              ' title="' + esc(L('أعِدِ المحذوفَ من هذا الشريط', 'Restore what was removed from this bar')) + '">' +
              '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i></button>' +
          '</div></section>';
      }).join('');
    }

    function paint() {
      var body = dlg.querySelector('.ndl-bar-cards');
      if (body) body.innerHTML = cardsHtml();
      i18n(dlg);
    }

    var st0 = barRead();
    dlg.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' +
        esc(L('إغلاق', 'Close')) + '"><i class="fa-solid fa-xmark"></i></button></form>' +
      '<div class="gsf-body">' +
      '<p class="ndl-bar-p">' + esc(L(
        'اضغطِ الأيقونةَ مطوّلاً فيظهر اسمُها وترتفع، ثمّ اسحبْها إلى مكانها. وضغطةٌ سريعةٌ تُزيلها.',
        'Press and hold an icon: its name shows and it lifts — then drag it into place. A quick tap removes it.')) + '</p>' +
      '<div class="ndl-bar-cards">' + cardsHtml() + '</div>' +
      '<div class="ndl-bar-foot">' +
        '<button type="button" class="ndl-sw" data-bscope="1" role="switch"' +
          ' aria-checked="' + (st0.scope === 'all' ? 'true' : 'false') + '"' +
          ' aria-label="' + esc(L('مفضّلةٌ واحدةٌ لكلِّ الأنواع', 'One set of favourites everywhere')) + '"' +
          ' title="' + esc(L('مفضّلةٌ واحدةٌ لكلِّ الأنواع — أطفِئْه فيصير لكلِّ سطحٍ مفضّلتُه',
                             'One set of favourites everywhere — turn it off and each surface gets its own')) +
          '"><i></i></button>' +
        '<span class="ndl-bar-foot-t">' +
          esc(L('مفضّلةٌ واحدةٌ لكلِّ الأنواع', 'One set of favourites everywhere')) + '</span>' +
        '<button type="button" class="gsf-btn" data-breset="1">' +
          esc(L('أعِدْ كلَّ شيءٍ كما كان', 'Reset everything')) + '</button>' +
      '</div></div>';

    /*@3.NODJ.118*/
    function atomPicker(bark, anchor) {
      var old = dlg.querySelector('.ndl-pick');
      if (old) old.remove();
      var used = barOf(barRead(), bark).items;
      var pick = document.createElement('div');
      pick.className = 'ndl-pick';
      pick.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
      var all = atomList();
      pick.innerHTML = ATOM_GROUPS.map(function (g) {
        var mine = all.filter(function (it) {
          var m = atomMeta(it);
          return m && (m.grp || 'misc') === g.k && it !== 'sep' && it !== 'spring';
        });
        if (!mine.length) return '';
        return '<div class="ndl-pick-h">' + esc(L(g.ar, g.en)) + '</div>' +
          '<div class="ndl-pick-g">' + mine.map(function (it) {
            return atomChip(it, 'data-put="' + esc(bark) + '"' +
              (used.indexOf(it) >= 0 ? ' aria-pressed="true"' : ''));
          }).join('') + '</div>';
      }).join('');
      /*@3.NODJ.132*/
      pick.style.position = 'fixed';
      dlg.appendChild(pick);
      var place = function () {
        if (!pick.isConnected) return;
        pick.style.insetBlockStart = '0px'; pick.style.left = '0px'; pick.style.right = '';
        var o0 = pick.getBoundingClientRect();
        var ox = o0.left, oy = o0.top;
        var r = anchor.getBoundingClientRect();
        /*@3.NODJ.133*/
        var dr = dlg.getBoundingClientRect();
        var bx0 = Math.max(0, dr.left), bx1 = Math.min(innerWidth, dr.right);
        var by0 = Math.max(0, dr.top), by1 = Math.min(innerHeight, dr.bottom);
        pick.style.maxInlineSize = Math.max(120, bx1 - bx0 - 16) + 'px';
        pick.style.maxBlockSize = Math.max(120, by1 - by0 - 16) + 'px';
        var pr = pick.getBoundingClientRect();
        var ph = pr.height || 220, pw = pr.width || 260;
        var top, left;
        if (innerWidth <= 640) {
          left = bx0 + 8; pw = Math.min(pw, bx1 - bx0 - 16);
          top = Math.max(by0 + 8, Math.min(by1 - ph - 8, by0 + (by1 - by0) * 0.14));
        } else {
          top = r.bottom + 6;
          if (top + ph > by1 - 8) top = Math.max(by0 + 8, r.top - 6 - ph);
          top = Math.max(by0 + 8, Math.min(by1 - ph - 8, top));
          left = Math.max(bx0 + 8, Math.min(bx1 - pw - 8, r.left + r.width / 2 - pw / 2));
        }
        pick.style.insetBlockStart = Math.round(top - oy) + 'px';
        pick.style.left = Math.round(left - ox) + 'px';
      };
      place();
      requestAnimationFrame(place);
      return pick;
    }

    dlg.addEventListener('click', function (e) {
      var sw = e.target.closest('[data-bon]');
      if (sw) {
        var kO = sw.getAttribute('data-bon');
        var dO = barRead(), bO = barOf(dO, kO);
        bO.on = bO.on ? 0 : 1;
        bO.fd = bO.on ? 0 : 1;
        barWrite(dO);
        if (kO === 'colors') { try { localStorage.setItem(PIN_KEY, bO.on ? '1' : '0'); } catch (eP) {} }
        sw.setAttribute('aria-checked', bO.on ? 'true' : 'false');
        paint();
        self.applyBar();
        return;
      }
      var fb = e.target.closest('[data-bfold]');
      if (fb) {
        var kF = fb.getAttribute('data-bfold');
        var dF = barRead(), bF = barOf(dF, kF);
        bF.fd = bF.fd ? 0 : 1;
        barWrite(dF);
        var card = dlg.querySelector('.ndl-card[data-bark="' + kF + '"]');
        if (card) card.setAttribute('data-fold', bF.fd ? '1' : '0');
        fb.setAttribute('aria-expanded', bF.fd ? 'false' : 'true');
        return;
      }
      var sc = e.target.closest('[data-bscope]');
      if (sc) {
        var dS = barRead();
        dS.scope = dS.scope === 'all' ? 'per' : 'all';
        barWrite(dS);
        sc.setAttribute('aria-checked', dS.scope === 'all' ? 'true' : 'false');
        self.applyBar();
        return;
      }
      var add = e.target.closest('[data-badd]');
      if (add) { atomPicker(add.getAttribute('data-badd'), add); return; }
      var rs = e.target.closest('[data-brestore]');
      if (rs) {
        var kR = rs.getAttribute('data-brestore');
        var dR = barRead(), bR = barOf(dR, kR);
        var gone = barGone(bR);
        if (!gone.length) return;
        bR.items = bR.items.concat(gone);
        barWrite(dR); paint(); self.applyBar(); return;
      }
      var sep = e.target.closest('[data-bsep]');
      if (sep) {
        var kS = sep.getAttribute('data-bsep');
        var dSe = barRead(); barOf(dSe, kS).items.push('sep');
        barWrite(dSe); paint(); self.applyBar(); return;
      }
      var put = e.target.closest('[data-put]');
      if (put) {
        var kP = put.getAttribute('data-put'), itP = put.getAttribute('data-atom');
        var dP = barRead(), bP = barOf(dP, kP);
        var atP = bP.items.indexOf(itP);
        if (atP >= 0) bP.items.splice(atP, 1); else bP.items.push(itP);
        barWrite(dP);
        var pk = dlg.querySelector('.ndl-pick'); if (pk) pk.remove();
        paint(); self.applyBar(); return;
      }
      var chip = e.target.closest('.ndl-card-b [data-ix]');
      if (chip) {
        if (self._barHeld) { self._barHeld = 0; return; }
        var kC = chip.getAttribute('data-bark'), ixC = Number(chip.getAttribute('data-ix'));
        var dC = barRead(), bC = barOf(dC, kC);
        if (!(ixC >= 0) || ixC >= bC.items.length) return;
        bC.items.splice(ixC, 1);
        barWrite(dC); paint(); self.applyBar(); return;
      }
      if (e.target.closest('[data-breset]')) {
        try { localStorage.removeItem(BAR_KEY); } catch (e3) {}
        try { localStorage.removeItem(PIN_KEY); } catch (e4) {}
        resetFavs();
        self.applyBar();
        try { dlg.close(); } catch (e5) {}
        dlg.remove();
        self.barDialog();
        return;
      }
      if (!e.target.closest('.ndl-pick') && !e.target.closest('[data-badd]')) {
        var pk2 = dlg.querySelector('.ndl-pick'); if (pk2) pk2.remove();
      }
    });

    dlg.addEventListener('close', function () { dlg.remove(); });
    try { dlg.showModal(); } catch (e6) {}
    self.barSort(dlg, paint);
    if (window.GardenSelect && GardenSelect.enhance) { try { GardenSelect.enhance(dlg); } catch (e7) {} }
    return dlg;
  };

/*@3.NODJ.119*/
  var BAR_HOLD_MS = 300, BAR_SLOP = 7;

  Dial.prototype.barSort = function (dlg, paint) {
    var self = this, st = null;

    function chipsOf(k) {
      return [].slice.call(dlg.querySelectorAll('.ndl-card-b[data-bark="' + k + '"] [data-ix]'));
    }
    function bodyOf(k) {
      return dlg.querySelector('.ndl-card-b[data-bark="' + k + '"]');
    }
    /*@3.NODJ.113*/
    function nameTip(c) {
      var tip = dlg.querySelector('.ndl-bar-tip');
      if (!tip) { tip = document.createElement('div'); tip.className = 'ndl-bar-tip'; dlg.appendChild(tip); }
      tip.textContent = c.getAttribute('aria-label') || '';
      var r = c.getBoundingClientRect();
      tip.style.insetBlockStart = Math.round(Math.max(6, r.top - 30)) + 'px';
      tip.style.left = Math.round(Math.max(6,
        Math.min(innerWidth - 160, r.left + r.width / 2 - 70))) + 'px';
      tip.setAttribute('data-on', '1');
      if (self._tipT) clearTimeout(self._tipT);
      self._tipT = setTimeout(function () { tip.removeAttribute('data-on'); }, 1800);
    }

    /*@3.NODJ.126*/
    function dropAt(items, x, y, from) {
      var best = -1, bd = Infinity, i, q, cx, cy, gap;
      for (i = 0; i < items.length; i++) {
        q = items[i].getBoundingClientRect();
        if (!q.width && !q.height) continue;
        cx = q.left + q.width / 2; cy = q.top + q.height / 2;
        gap = Math.abs(y - cy) * 3 + Math.abs(x - cx);
        if (gap < bd) { bd = gap; best = i; }
      }
      if (best < 0) return from;
      q = items[best].getBoundingClientRect();
      cx = q.left + q.width / 2;
      var rtl = getComputedStyle(items[best]).direction === 'rtl';
      var after = rtl ? (x < cx) : (x > cx);
      var want = best + (after ? 1 : 0);
      if (want > from) want--;
      return Math.max(0, Math.min(items.length - 1, want));
    }

    function lift() {
      if (!st || st.on) return;
      st.on = true;
      self._barHeld = 1;
      st.el.classList.add('is-lifted');
      var body = bodyOf(st.k);
      if (body) body.classList.add('is-sorting');
      nameTip(st.el);
      try { dlg.setPointerCapture(st.id); } catch (eC) {}
    }

    /*@3.NODJ.127*/
    dlg.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      var c = e.target.closest('.ndl-card-b [data-ix]');
      if (!c) return;
      self._barHeld = 0;
      st = { k: c.getAttribute('data-bark'), i: Number(c.getAttribute('data-ix')),
             x: e.clientX, y: e.clientY, el: c, on: false, to: null,
             id: e.pointerId, mouse: e.pointerType === 'mouse',
             t: setTimeout(lift, BAR_HOLD_MS) };
    });

    dlg.addEventListener('pointermove', function (e) {
      if (!st || e.pointerId !== st.id) return;
      var far = Math.abs(e.clientX - st.x) + Math.abs(e.clientY - st.y) > BAR_SLOP;
      if (!st.on) {
        if (!far) return;
        if (st.mouse) { clearTimeout(st.t); lift(); }
        else { clearTimeout(st.t); st = null; return; }
      }
      e.preventDefault();
      var items = chipsOf(st.k);
      var to = dropAt(items, e.clientX, e.clientY, st.i);
      st.to = to;
      items.forEach(function (x, i) { x.classList.toggle('is-drop', i === to && i !== st.i); });
    });

    function end(e) {
      if (!st || (e && e.pointerId !== st.id)) return;
      var was = st; st = null;
      clearTimeout(was.t);
      try { dlg.releasePointerCapture(was.id); } catch (eR) {}
      [].forEach.call(dlg.querySelectorAll('.is-lifted,.is-drop'), function (x) {
        x.classList.remove('is-lifted', 'is-drop');
      });
      [].forEach.call(dlg.querySelectorAll('.ndl-card-b.is-sorting'), function (x) {
        x.classList.remove('is-sorting');
      });
      if (!was.on) return;
      setTimeout(function () { self._barHeld = 0; }, 0);
      if (was.to == null || was.to === was.i) return;
      var d = barRead(), b = barOf(d, was.k);
      if (!(was.i >= 0) || was.i >= b.items.length) return;
      var to = Math.max(0, Math.min(b.items.length - 1, was.to));
      var it = b.items.splice(was.i, 1)[0];
      b.items.splice(to, 0, it);
      barWrite(d);
      paint();
      self.applyBar();
    }
    dlg.addEventListener('pointerup', end);
    dlg.addEventListener('pointercancel', end);
  };

  /*@3.NODJ.87*/
  Dial.prototype.applyBar = function () {
    var st = barRead();
    if (this.favBar) this.favBar.hidden = !barOf(st, 'favs').on;
    if (this.colorBar) this.colorBar.hidden = !barOf(st, 'colors').on;
    if (this.toolBar) this.toolBar.hidden = !barOf(st, 'tools').on;
    if (this.mineBar) this.mineBar.hidden = !barOf(st, 'mine').on;
    /*@3.NODJ.93*/
    if (this.dock) {
      var bare = !st.bars.some(function (b) { return b.on; });
      this.dock.setAttribute('data-bare', bare ? '1' : '0');
      this.dock.setAttribute('title', bare
        ? L('اضغطْ مطوّلاً أو بالزرِّ الأيمنِ لإعادةِ الأشرطة',
            'Long-press or right-click to bring the bars back')
        : '');
    }
    this.paintFavs();
    this.paintColors();
    this.paintTools();
    this.paintMine();
    this.syncFavs();
  };

  Dial.prototype.penBtnDialog = function () {
    var I = window.GardenInkInput;
    if (!I || !I.penButtons || !I.ACTS) return null;
    var PEN_ACTS = I.ACTS;
    var map = I.penButtons();
    /*@3.NODJ.34*/
    var stale = document.getElementById('ndl-penbtn');
    if (stale) { try { stale.close(); } catch (e0) {} stale.remove(); }
    var dlg = document.createElement('dialog');
    dlg.id = 'ndl-penbtn';
    dlg.className = 'gsf ndl-penbtn';
    document.body.appendChild(dlg);
    function row(key, ar, en, hint) {
      var opts = PEN_ACTS.map(function (a2) {
        return '<option value="' + a2.k + '"' + (map[key] === a2.k ? ' selected' : '') +
          ' data-gs-name-ar="' + esc(a2.ar) + '" data-gs-name-en="' + esc(a2.en) + '">' +
          esc(L(a2.ar, a2.en)) + '</option>';
      }).join('');
      /*@3.NODJ.22*/
      return '<div class="ndl-pb-row"><span class="ndl-pb-k">' + esc(L(ar, en)) + '</span>' +
        '<select data-gs data-pb="' + key + '" class="gsf-in" aria-label="' +
        esc(L(ar, en)) + '">' + opts + '</select>' +
        '<button type="button" class="ndl-pb-rec" data-rec="' + key + '">' +
        '<i class="fa-solid fa-circle-dot" aria-hidden="true"></i>' +
        '<span>' + esc(L('سجّلْ زرّاً', 'Record a button')) + '</span></button>' +
        '<span class="ndl-pb-h">' + esc(hint) + '</span></div>';
    }

    /*@3.NODJ.23*/
    function keyRow(a2) {
      var k = I.keyFor ? I.keyFor(a2.k) : '';
      return '<div class="ndl-pb-row ndl-pb-row--k"><span class="ndl-pb-k">' +
        esc(L(a2.ar, a2.en)) + '</span>' +
        '<kbd class="ndl-pb-kbd" data-kbd="' + a2.k + '">' +
        esc(k ? k.toUpperCase() : L('—', '—')) + '</kbd>' +
        '<button type="button" class="ndl-pb-rec" data-reck="' + a2.k + '">' +
        '<i class="fa-solid fa-keyboard" aria-hidden="true"></i>' +
        '<span>' + esc(L('سجّلْ مفتاحاً', 'Record a key')) + '</span></button>' +
        '<button type="button" class="ndl-pb-clr" data-clrk="' + a2.k + '" aria-label="' +
        esc(L('امسحِ الاختصار', 'Clear the shortcut')) + '">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>';
    }
    /*@3.NODJ.32*/
    dlg.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' +
        esc(L('إغلاق', 'Close')) + '"><i class="fa-solid fa-xmark"></i></button></form>' +
      '<div class="gsf-body">' +
      '<h3 class="ndl-pb-t">' + esc(L('أزرارُ القلم', 'Pen buttons')) + '</h3>' +
      '<p class="ndl-pb-p">' + esc(L(
        'اضغطْ زرَّ قلمِك مرّةً فتعمل الأداةُ المربوطةُ به، واضغطْه ثانيةً فتعود أداتُك.',
        'Press your pen button once and its tool takes over; press again and your tool returns.')) + '</p>' +
      '<p class="ndl-pb-p">' + esc(L(
        'ولستَ بحاجةٍ لمعرفة اسم زرِّك: اضغطْ «سجّلْ زرّاً» ثمّ اضغطِ الزرَّ نفسَه، ونحن نعرفه.',
        'You need not know which button is which: tap “Record a button”, then press it — we will name it.')) + '</p>' +
      '<p class="ndl-pb-st" data-role="rec-st" role="status" aria-live="polite"></p>' +
      row('barrel', 'الزرُّ الجانبيّ', 'Side button',
          L('الزرُّ الذي يقع تحت الإبهام، وهو أشهرُ ما في الأقلام.',
            'The button under your thumb — the one most pens have.')) +
      row('tip', 'رأسُ الممحاة', 'Eraser end',
          L('في الأقلامِ التي يُقلَبُ طرفُها الخلفيُّ فيمحو.',
            'For pens whose back end erases when you flip them over.')) +
      row('second', 'الزرُّ الثاني', 'Second button',
          L('زرٌّ إضافيٌّ في بعض الأقلام، وقد يلزمه ضبطٌ في برنامجِ القلم.',
            'An extra button on some pens; it may need setting up in the pen’s own software.')) +
      '<p class="ndl-pb-w">' + esc(L(
        'وبعضُ الأقلامِ تُبقي أزرارَها داخلَ عتادِها فلا يصلُ المتصفّحَ منها شيء — فإن لم يُسجَّل زرُّك بعد محاولتين، اربطْ مفتاحاً من لوحة المفاتيح أسفلَه.',
        'Some pens keep their buttons inside their own hardware, so nothing reaches the browser. If yours does not register after two tries, bind a keyboard key below instead.')) + '</p>' +
      /*@3.NODJ.24*/
      '<h3 class="ndl-pb-t">' + esc(L('اختصاراتُ لوحة المفاتيح', 'Keyboard shortcuts')) + '</h3>' +
      '<p class="ndl-pb-p">' + esc(L(
        'مفتاحٌ واحدٌ بلا مُعدِّل، يعمل حين لا تكون تكتب — وهو يبدّل ويعود مثل زرِّ القلم تماماً.',
        'A single key with no modifier, active while you are not typing — it toggles and returns just like a pen button.')) + '</p>' +
      PEN_ACTS.filter(function (a3) { return a3.k !== 'none'; }).map(keyRow).join('') +
      '</div>';
    dlg.addEventListener('change', function (e) {
      var sel = e.target.closest('[data-pb]');
      if (!sel) return;
      var m = {};
      m[sel.getAttribute('data-pb')] = sel.value;
      I.setPenButtons(m);
    });

    /*@3.NODJ.25*/
    var self = this;
    var stopCap = null;
    var capT = null;

    /*@3.NODJ.33*/
    function say(kind, msg) {
      var st = dlg.querySelector('[data-role="rec-st"]');
      if (!st) return;
      st.textContent = msg || '';
      st.setAttribute('data-k', kind || '');
    }

    function arm(btn, kind, done) {
      if (stopCap) { stopCap(); stopCap = null; }
      if (capT) { clearTimeout(capT); capT = null; }
      var span = btn.querySelector('span');
      var was = span ? span.textContent : '';
      btn.classList.add('is-rec');
      if (span) span.textContent = L('في انتظارك…', 'Waiting…');
      say('wait', kind === 'key'
        ? L('اضغطْ أيَّ مفتاحٍ الآن — و‏Esc يلغي.', 'Press any key now — Esc cancels.')
        : L('اضغطْ زرَّ قلمِك الآن — و‏Esc يلغي.', 'Press your pen button now — Esc cancels.'));

      function unarm() {
        if (capT) { clearTimeout(capT); capT = null; }
        stopCap = null;
        btn.classList.remove('is-rec');
        if (span) span.textContent = was;
      }

      capT = setTimeout(function () {
        if (stopCap) { stopCap(); }
        unarm();
        say('warn', kind === 'key'
          ? L('لم تصلْ ضغطةٌ. جرّبْ مرّةً أخرى.', 'No key arrived. Try once more.')
          : L('لم تصلْ ضغطةٌ من قلمك. جرّبْ مرّةً أخرى، أو اربطْ مفتاحاً من لوحة المفاتيح.',
              'Nothing arrived from your pen. Try again, or bind a keyboard key instead.'));
      }, 12000);

      stopCap = I.capture(kind, function (got) {
        unarm();
        if (!got) { say('', L('أُلغي التسجيل.', 'Recording cancelled.')); return; }
        done(got);
      });
    }

    function actName(k) {
      for (var i = 0; i < PEN_ACTS.length; i++) {
        if (PEN_ACTS[i].k === k) return L(PEN_ACTS[i].ar, PEN_ACTS[i].en);
      }
      return k;
    }

    var MOD_NAME = {
      barrel: ['الزرُّ الجانبيّ', 'Side button'],
      tip:    ['رأسُ الممحاة', 'Eraser end'],
      second: ['الزرُّ الثاني', 'Second button']
    };
    function modName(m) {
      var n = MOD_NAME[m];
      return n ? L(n[0], n[1]) : m;
    }

    dlg.addEventListener('click', function (e) {
      var rec = e.target.closest('[data-rec]');
      if (rec) {
        e.preventDefault();
        var forKey = rec.getAttribute('data-rec');
        arm(rec, 'pen', function (got) {
          var cur = dlg.querySelector('[data-pb="' + forKey + '"]');
          var act = cur ? cur.value : 'era';
          var m2 = {};
          m2[got.mod] = act;
          I.setPenButtons(m2);
          var msg = L('سُجِّل: ', 'Recorded: ') + modName(got.mod) +
                    L(' ⇐ ', ' → ') + actName(act);
          var fresh = self.penBtnDialog();
          var st2 = fresh && fresh.querySelector('[data-role="rec-st"]');
          if (st2) { st2.textContent = msg; st2.setAttribute('data-k', 'ok'); }
        });
        return;
      }
      var reck = e.target.closest('[data-reck]');
      if (reck) {
        e.preventDefault();
        var act2 = reck.getAttribute('data-reck');
        arm(reck, 'key', function (got) {
          I.setPenKey(got.key, act2);
          var kb = dlg.querySelector('[data-kbd="' + act2 + '"]');
          if (kb) kb.textContent = got.key.toUpperCase();
          say('ok', L('سُجِّل: ', 'Recorded: ') + got.key.toUpperCase() +
                    L(' ⇐ ', ' → ') + actName(act2));
        });
        return;
      }
      var clr = e.target.closest('[data-clrk]');
      if (clr) {
        e.preventDefault();
        var act3 = clr.getAttribute('data-clrk');
        I.clearPenKey(act3);
        var kb2 = dlg.querySelector('[data-kbd="' + act3 + '"]');
        if (kb2) kb2.textContent = '—';
      }
    });
    dlg.addEventListener('close', function () {
      if (stopCap) { stopCap(); stopCap = null; }
      if (capT) { clearTimeout(capT); capT = null; }
    });
    if (window.GardenSelect && GardenSelect.enhance) {
      try { GardenSelect.enhance(dlg); } catch (e2) {}
    }
    try { dlg.showModal(); } catch (e3) {}
    return dlg;
  };

  Dial.prototype.current = function () {
    var cv = this.getCv();
    if (!cv) return null;
    var f = { tool: cv.tool, color: cv.color, width: cv.width, nib: cv.nib };
    if (cv.tool === 'era') f.mode = cv.eraseMode || 'whole';
    if (cv.tool === 'hi') {
      f.straight = cv.hiStraight ? 1 : 0;
      f.hiMode = cv.hiMode || (cv.hiStraight ? 'line' : 'free');
      f.hiStyle = cv.hiStyle === 'under' ? 'under' : 'fill';
    }
    return f;
  };

  Dial.prototype.toggleFav = function () {
    var cur = this.current();
    if (!cur || isFixed(cur)) return;
    var list = favs(), key = favKey(cur), at = -1, i;
    for (i = 0; i < list.length; i++) if (favKey(list[i]) === key) at = i;
    if (at >= 0) list.splice(at, 1);
    else list.unshift(cur);
    setFavs(list);
    this.paintFavs();
    this.sync();
  };

  Dial.prototype.syncFavs = function (st) {
    if (!this.favBar) return;
    /*@3.NODJ.52*/
    if (st) {
      var hu = this.favBar.querySelector('[data-hist="undo"]');
      var hr = this.favBar.querySelector('[data-hist="redo"]');
      if (hu) hu.disabled = !st.canUndo;
      if (hr) hr.disabled = !st.canRedo;
    }
    var cur = this.current();
    if (!cur) return;
    var key = favKey(cur), list = favs(), on = false, i;
    for (i = 0; i < list.length; i++) if (favKey(list[i]) === key) on = true;
    var chips = this.favBar.querySelectorAll('[data-fav]');
    for (i = 0; i < chips.length; i++) {
      chips[i].setAttribute('aria-pressed',
        favKey(list[Number(chips[i].getAttribute('data-fav'))] || {}) === key ? 'true' : 'false');
    }
    var fixed = this.favBar.querySelectorAll('[data-fix]');
    for (i = 0; i < fixed.length; i++) {
      chips = FAV_FIXED[Number(fixed[i].getAttribute('data-fix'))];
      fixed[i].setAttribute('aria-pressed', favKey(chips) === key ? 'true' : 'false');
    }
    /*@3.NODJ.45*/
    var cb = this.favBar.querySelector('[data-fixcol]');
    if (cb) {
      var tmp = document.createElement('div');
      tmp.innerHTML = colorChip(cur);
      cb.replaceWith(tmp.firstChild);
    }
    var sb = this.favBar.querySelector('[data-fixsize]');
    if (sb) {
      var tmp2 = document.createElement('div');
      tmp2.innerHTML = sizeChip(cur);
      sb.replaceWith(tmp2.firstChild);
    }
    if (this.colorBar) {
      if (this.colorBar.getAttribute('data-kind') !== plKind(cur)) this.paintColors();
      var sws = this.colorBar.querySelectorAll('[data-tone]');
      for (i = 0; i < sws.length; i++) {
        sws[i].setAttribute('aria-pressed', sws[i].getAttribute('data-tone') === cur.color ? 'true' : 'false');
      }
    }
    var star = this.favBar.querySelector('[data-fav-star]');
    if (star) star.hidden = isFixed(cur);
    if (star && !star.hidden) {
      star.setAttribute('aria-pressed', on ? 'true' : 'false');
      star.innerHTML = on ? ICONS.starOff : ICONS.star;
      var lab = on ? ['أزِلْ هذا الإعداد من المفضّلة', 'Remove this setup from favourites']
                   : ['أضِف الإعداد الحاليّ للمفضّلة', 'Add the current setup to favourites'];
      star.setAttribute('aria-label', L(lab[0], lab[1]));
      star.setAttribute('title', L(lab[0], lab[1]));
    }
  };

  Dial.prototype.build = function () {
    var d = document.createElement('div');
    d.className = 'ndl';
    d.setAttribute('data-open', '0');
    d.hidden = true;
    d.innerHTML =
      '<div class="ndl-halo" data-role="halo"></div>' +
      '<button type="button" class="ndl-hub" aria-expanded="false"' +
      ' aria-label="' + esc(L('لوحة القلم', 'Pen palette')) + '"' +
      ' data-ar-title="لوحة القلم — اسحبها لأيّ مكان"' +
      ' data-en-title="Pen palette — drag it anywhere">' +
      '<i class="fa-solid fa-pen" aria-hidden="true" data-role="hub-i"></i></button>' +
      '<button type="button" class="ndl-z" data-role="zoom" aria-live="polite"' +
      ' aria-label="' + esc(L('التكبير', 'Zoom')) + '"' +
      ' data-ar-title="التكبير" data-en-title="Zoom">100%</button>' +
      '<div class="ndl-ring ndl-ring--1" data-role="r1" hidden></div>' +
      '<div class="ndl-ring ndl-ring--2" data-role="r2" hidden></div>' +
      '<span class="ndl-tip" data-role="tip"></span>';
    document.body.appendChild(d);
    this.el = d;
    this.hub = d.querySelector('.ndl-hub');
    this.zoomBtn = d.querySelector('[data-role="zoom"]');
    this.r1 = d.querySelector('[data-role="r1"]');
    this.r2 = d.querySelector('[data-role="r2"]');
    this.tip = d.querySelector('[data-role="tip"]');
    this.halo = d.querySelector('[data-role="halo"]');
    i18n(d);
    this.paintRing1();
    this.bind();

    var self = this;
    this._themeObs = new MutationObserver(function () {
      self.paintFavs();
      self.paintColors();
      var sub = self.sub;
      if (sub) { self.sub = null; self.openSub(sub); }
      self.sync();
    });
    this._themeObs.observe(document.documentElement,
      { attributes: true, attributeFilter: ['data-theme', 'data-mod-theme', 'data-tinted'] });
  };

  /*@3.NODJ.2*/
  Dial.prototype.arc = function (host, items, radius, cls) {
    var n = items.length;
    var step = 360 / n;
    host.innerHTML = items.map(function (it, i) {
      var a = (-90 + i * step) * Math.PI / 180;
      var x = Math.cos(a) * radius, y = Math.sin(a) * radius;
      return '<button type="button" class="ndl-i' + (it.cls ? ' ' + it.cls : '') + '"' +
        ' style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px' +
        (it.style ? ';' + it.style : '') + '"' +
        ' data-k="' + esc(it.k) + '" data-ar="' + esc(it.ar) + '" data-en="' + esc(it.en) + '"' +
        ' aria-label="' + esc(L(it.ar, it.en)) + '"' +
        (it.pressed ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
        (it.html || '<i class="fa-solid ' + it.icon + '" aria-hidden="true"></i>') +
        '</button>';
    }).join('');
    if (cls) host.setAttribute('data-kind', cls);
  };

  /*@3.NODJ.64*/
  Dial.prototype.paintRing1 = function () {
    var cv = this.getCv();
    this.arc(this.r1, RING1.filter(function (t) {
      return !t.cap || !!(cv && cv[t.cap]);
    }).map(function (t) {
      return { k: t.k, icon: t.icon, html: t.html, ar: t.ar, en: t.en,
               cls: t.k === 'exit' ? 'ndl-i--danger' : '' };
    }), rad1());
  };

  /*@3.NODJ.3*/
  Dial.prototype.subItems = function (kind) {
    var cv = this.getCv();
    if (kind === 'pen') return this.subItems('size').concat(this.subItems('nib'));
    if (kind === 'nib') {
      return pickNibs().map(function (n) {
        return { k: 'nib:' + n.k, ar: n.ar, en: n.en,
                 pressed: cv && cv.nib === n.k,
                 html: NIB_ICON[n.k] || ICONS.nibRound };
      });
    }
    if (kind === 'size' || kind === 'hiw') {
      var ws = kind === 'hiw' ? HI_W : PEN_W;
      var out2 = ws.map(function (w) {
        var d = Math.max(4, Math.min(20, kind === 'hiw' ? w * 0.5 : w * 1.5));
        return { k: 'w:' + w, ar: 'سماكة ' + w, en: 'Width ' + w,
                 pressed: cv && cv.width === w,
                 html: '<span class="ndl-dot" style="inline-size:' + d + 'px;block-size:' + d + 'px"></span>' };
      });
      /*@3.NODJ.12*/
      if (kind === 'hiw') {
        /*@3.NODJ.40*/
        var hm = (cv && cv.hiMode) || 'text';
        out2.push({ k: 'hm:text', ar: 'يلتقط سطرَ النصّ ويظلّله', en: 'Snaps to the line of text',
                    pressed: hm === 'text', icon: 'fa-align-center' });
        out2.push({ k: 'hm:line', ar: 'تظليل مستقيم حيثما رسمت', en: 'Straight, wherever you draw',
                    pressed: hm === 'line', html: ICONS.hiStraight });
        out2.push({ k: 'hm:free', ar: 'تظليل حرّ يتبع يدك', en: 'Free highlight that follows your hand',
                    pressed: hm === 'free', html: ICONS.hiWave });
        /*@3.NODJ.75*/
        var hs = (cv && cv.hiStyle === 'under') ? 'under' : 'fill';
        out2.push({ k: 'hs:fill', ar: 'يملأ خلفَ النصّ', en: 'Fills behind the text',
                    pressed: hs === 'fill', icon: 'fa-highlighter' });
        out2.push({ k: 'hs:under', ar: 'خطٌّ تحت النصّ بدل التظليل',
                    en: 'A line under the text instead of a fill',
                    pressed: hs === 'under', icon: 'fa-underline' });
      }
      return out2;
    }
    /*@3.NODJ.13*/
    if (kind === 'era') {
      return [
        { k: 'era:part', html: ICONS.eraserPen, ar: 'ممحاة القلم — تمحو ما تمرّ عليه',
          en: 'Pen eraser — rubs out what it touches',
          pressed: !!(cv && cv.eraseMode === 'part') },
        { k: 'era:whole', html: ICONS.eraserSmart, ar: 'ممحاة ذكيّة — تحذف العنصر كاملاً',
          en: 'Smart eraser — deletes the whole element',
          pressed: !!(cv && cv.eraseMode !== 'part') }
      ];
    }
    if (kind === 'shape') {
      return SHAPES.map(function (s) {
        return { k: 'tool:' + s.k, icon: s.icon, ar: s.ar, en: s.en,
                 pressed: cv && cv.tool === s.k };
      });
    }
    if (kind === 'color') {
      var isHi = !!(cv && cv.tool === 'hi');
      var swHex = function (t) {
        if (isHi && window.GardenCanvas && GardenCanvas.hiHexOf) return GardenCanvas.hiHexOf(t);
        return hexOf(t);
      };
      var out = TONES.map(function (t) {
        return { k: 'c:' + t, ar: TONE_AR[t], en: TONE_EN[t],
                 cls: 'ndl-sw', style: '--t:' + swHex(t),
                 pressed: cv && cv.color === t, html: '' };
      });
      out.push({ k: 'c:custom', icon: 'fa-eye-dropper',
                 ar: 'لون مخصّص', en: 'Custom colour',
                 pressed: !!(cv && typeof cv.color === 'string' && cv.color.charAt(0) === '#') });
      return out;
    }
    if (kind === 'zoom') {
      /*@3.NODJ.8*/
      if (cv && cv.bound) return [];
      return [
        { k: 'z:out', icon: 'fa-magnifying-glass-minus', ar: 'تصغير', en: 'Zoom out' },
        { k: 'z:100', ar: 'حجم أصلي', en: 'Actual size',
          html: '<span class="ndl-n">100%</span>' },
        { k: 'z:in',  icon: 'fa-magnifying-glass-plus', ar: 'تكبير', en: 'Zoom in' },
        { k: 'z:fit', icon: 'fa-crop-simple', ar: 'ملاءمة الصفحة', en: 'Fit page' }
      ];
    }
    return [];
  };

  Dial.prototype.openSub = function (kind, anchor) {
    if (this.sub === kind) { this.closeSub(); return; }
    var items = this.subItems(kind);
    if (!items.length) { this.closeSub(); return; }
    var btn = anchor ? this.r1.querySelector('[data-k="' + anchor + '"]') : null;
    if (btn) {
      var bx = parseFloat(btn.style.left) || 0, by = parseFloat(btn.style.top) || 0;
      this.fan(this.r2, items, rad2(), Math.atan2(by, bx) * 180 / Math.PI, kind);
    } else this.arc(this.r2, items, rad2(), kind);
    this.r2.hidden = false;
    this.sub = kind;
    this.clamp();
  };

  Dial.prototype.fan = function (host, items, radius, center, cls) {
    var n = items.length;
    var step = Math.max(15, Math.min(22, 300 / Math.max(1, n)));
    var start = center - step * (n - 1) / 2;
    this.arc(host, items, radius, cls);
    var btns = host.querySelectorAll('.ndl-i');
    for (var i = 0; i < btns.length; i++) {
      var a = (start + i * step) * Math.PI / 180;
      btns[i].style.left = (Math.cos(a) * radius).toFixed(1) + 'px';
      btns[i].style.top = (Math.sin(a) * radius).toFixed(1) + 'px';
    }
  };

  Dial.prototype.paintHalo = function () {
    var h = this.halo;
    if (!h) return;
    var pr = haloPrefs();
    h.hidden = !pr.on;
    this.el.setAttribute('data-halo', pr.on ? '1' : '0');
    if (!pr.on) { h.innerHTML = ''; return; }
    var cv = this.getCv(), kind = plKind(cv), d = plRead(), P = d[kind];
    var list = ((P.lists[P.cur] || {}).c || []).slice(0, 6);
    var isHi = !!(cv && cv.tool === 'hi');
    var C0 = window.GardenCanvas;
    var hx = function (t) { return (isHi && C0 && C0.hiHexOf) ? C0.hiHexOf(t) : hexOf(t); };
    var pos = function (i) {
      var a = (-90 + i * 45) * Math.PI / 180;
      return 'left:' + (Math.cos(a) * HALO_R).toFixed(1) + 'px;top:' + (Math.sin(a) * HALO_R).toFixed(1) + 'px';
    };
    var cur = cv ? cv.color : '';
    var out = list.map(function (t, i) {
      var nm = TONE_AR[t] ? L(TONE_AR[t], TONE_EN[t]) : t;
      return '<button type="button" class="ndl-hc" data-hc="' + esc(t) + '" style="' + pos(i) + ';--t:' + esc(hx(t)) + '"' +
        ' aria-pressed="' + (cur === t) + '" aria-label="' + esc(nm) + '" data-ar="' + esc(TONE_AR[t] || t) + '" data-en="' + esc(TONE_EN[t] || t) + '"></button>';
    });
    var pn = plName(kind, P.cur, list);
    out.push('<button type="button" class="ndl-hp" data-hp="1" style="' + pos(6) + '"' +
      ' aria-label="' + esc(L('اللوحةُ: ' + pn + ' — المسْ للتالية', 'Palette: ' + pn + ' — tap for the next')) + '"' +
      ' data-ar="' + esc('اللوحةُ: ' + pn + ' — المسْ للتالية') + '" data-en="' + esc('Palette: ' + pn + ' — tap for the next') + '">' +
      '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>');
    if (pr.swap) {
      var toHi = !isHi;
      out.push('<button type="button" class="ndl-hs" data-hs="' + (toHi ? 'hi' : 'pen') + '" style="' + pos(7) + '"' +
        ' aria-label="' + esc(toHi ? L('بدّلْ إلى التظليل', 'Switch to the highlighter') : L('بدّلْ إلى القلم', 'Switch to the pen')) + '"' +
        ' data-ar="' + (toHi ? 'بدّلْ إلى التظليل' : 'بدّلْ إلى القلم') + '" data-en="' + (toHi ? 'Switch to the highlighter' : 'Switch to the pen') + '">' +
        '<i class="fa-solid ' + (toHi ? 'fa-highlighter' : 'fa-pen') + '" aria-hidden="true"></i></button>');
    }
    h.innerHTML = out.join('');
  };

  Dial.prototype.haloPick = function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!b || !this.halo.contains(b)) return;
    var cv = this.getCv();
    if (!cv) return;
    e.preventDefault();
    if (b.hasAttribute('data-hc')) {
      var t = b.getAttribute('data-hc');
      cv.setColor(t);
      noteRecentColor(plKind(cv), t);
    } else if (b.hasAttribute('data-hp')) {
      var d = plRead(), k = plKind(cv), P = d[k];
      P.cur = (P.cur + 1) % Math.max(1, P.lists.length);
      plWrite(d);
      this.paintHalo();
      var nb = this.halo.querySelector('[data-hp]');
      if (nb) this.showTip(nb);
      if (this.panel && this.panel.open) this.panel.render();
      return;
    } else if (b.hasAttribute('data-hs')) {
      this.pick(b.getAttribute('data-hs'));
    }
    this.sync();
  };

  Dial.prototype.showTip = function (b) {
    var tip = this.tip;
    if (!tip || !b) return;
    tip.textContent = L(b.getAttribute('data-ar') || '', b.getAttribute('data-en') || '');
    clearTimeout(this._tipT);
    tip.setAttribute('data-on', '1');
    this._tipT = setTimeout(function () { tip.setAttribute('data-on', '0'); }, 1600);
  };

  Dial.prototype.palettes = function () {
    var cv = this.getCv(), k = plKind(cv), d = plRead(), P = d[k];
    return { kind: k, cur: P.cur, lists: P.lists.map(function (l, i) { return { c: l.c, name: plName(k, i, l.c) }; }) };
  };

  Dial.prototype.setPalette = function (i) {
    var cv = this.getCv(), k = plKind(cv), d = plRead();
    d[k].cur = Math.max(0, Math.min(d[k].lists.length - 1, i));
    plWrite(d);
    this.paintHalo();
  };

  Dial.prototype.haloPrefs = function () { return haloPrefs(); };
  Dial.prototype.setHalo = function (p) { haloSet(p); this.paintHalo(); this.paintRing1(); this.clamp(); };

  Dial.prototype.closeSub = function () {
    this.r2.hidden = true;
    this.r2.innerHTML = '';
    this.sub = null;
  };

  Dial.prototype.setOpen = function (on) {
    this.open = !!on;
    this.el.setAttribute('data-open', this.open ? '1' : '0');
    this.hub.setAttribute('aria-expanded', this.open ? 'true' : 'false');
    this.r1.hidden = !this.open;
    if (!this.open) this.closeSub();
    this.hubFace();
    this.clamp();
  };

  Dial.prototype.hubFace = function () {
    var gear = this.open && !!window.GardenInkPanel;
    this.el.setAttribute('data-gear', gear ? '1' : '0');
    var g = this.hub.querySelector('[data-role="hub-g"]');
    if (gear && !g) {
      g = document.createElement('i');
      g.className = 'fa-solid fa-gear ndl-gear';
      g.setAttribute('aria-hidden', 'true');
      g.setAttribute('data-role', 'hub-g');
      this.hub.appendChild(g);
    }
    var t = gear
      ? (this.panelOpen ? ['أخفِ أدواتِ الرسم كاملة', 'Hide all drawing tools'] : ['كلُّ أدواتِ الرسم وإعداداتُها', 'All drawing tools and settings'])
      : ['لوحة القلم — اسحبها لأيّ مكان', 'Pen palette — drag it anywhere'];
    this.hub.setAttribute('data-ar-title', t[0]);
    this.hub.setAttribute('data-en-title', t[1]);
    this.hub.setAttribute('aria-label', L(t[0], t[1]));
    this.hub.setAttribute('aria-pressed', gear && this.panelOpen ? 'true' : 'false');
  };

  Dial.prototype.togglePanel = function (on) {
    if (!window.GardenInkPanel) return false;
    if (!this.panel) this.panel = GardenInkPanel.mount(this);
    return this.panel.toggle(on);
  };

  Dial.prototype.onPanel = function (on) {
    this.panelOpen = !!on;
    this.hubFace();
  };

  Dial.prototype.home = function () {
    try { localStorage.removeItem('garden_ink_dial'); } catch (e) {}
    this.place(null);
  };

  Dial.prototype.runKey = function (act, phase) {
    var cv = this.getCv();
    if (!cv) return;
    if (phase === 'cmd') { this.cmd(act); return; }
    if (phase === 'down') { if (cv.beginMod) cv.beginMod(act); }
    else {
      if (cv.endMod) cv.endMod({ act: act, tap: false, moved: 0, held: 0 });
      if (phase === 'tap' && cv.toggleAct) cv.toggleAct(act);
    }
    this.sync();
    if (this.panel && this.panel.open) this.panel.render();
  };

  Dial.prototype.cmd = function (act) {
    var cv = this.getCv();
    if (act === 'dial') { this.setOpen(!this.open); return; }
    if (act === 'panel') { this.togglePanel(); return; }
    if (act === 'tools') { this.setOpen(false); this.onExit(); return; }
    if (!cv) return;
    if (act === 'undo' || act === 'redo') { this.pick(act); }
    else if (act === 'color:next' || act === 'color:prev') {
      var i = TONES.indexOf(cv.color), n = TONES.length;
      cv.setColor(TONES[((i < 0 ? 0 : i) + (act === 'color:next' ? 1 : n - 1)) % n]);
    } else if (act === 'width:up' || act === 'width:down') {
      var ws = cv.tool === 'hi' ? HI_W : PEN_W, j = 0, k;
      for (k = 0; k < ws.length; k++) if (Math.abs(ws[k] - cv.width) < Math.abs(ws[j] - cv.width)) j = k;
      j = Math.max(0, Math.min(ws.length - 1, j + (act === 'width:up' ? 1 : -1)));
      cv.setWidth(ws[j]);
    } else if (cv.toggleAct) cv.toggleAct(act);
    this.sync();
    if (this.panel && this.panel.open) this.panel.render();
  };

  /*@3.NODJ.4*/
  Dial.prototype.uiZ = function () {
    var z = 1;
    try { z = parseFloat(getComputedStyle(this.el).zoom) || 1; } catch (e) {}
    return (isFinite(z) && z > 0.2) ? z : 1;
  };

  Dial.prototype.place = function (p) {
    var pad = 10;
    var reach = (this.open ? (this.sub ? rad2() : rad1()) : (haloPrefs().on ? HALO_R + 18 : 0)) + 26;
    var z = this.uiZ();
    var vw = window.innerWidth / z, vh = window.innerHeight / z;
    var x, y;
    if (p) { x = p.x; y = p.y; }
    else { x = isAr() ? (vw - 76) : 76; y = vh - 110; }
    x = Math.max(pad + reach, Math.min(x, vw - pad - reach));
    y = Math.max(pad + reach, Math.min(y, vh - pad - reach));
    if (vw < 2 * (pad + reach)) x = vw / 2;
    if (vh < 2 * (pad + reach)) y = vh / 2;
    this.pos = { x: x, y: y };
    this.el.style.left = Math.round(x) + 'px';
    this.el.style.top = Math.round(y) + 'px';
  };

  Dial.prototype.clamp = function () { this.place(this.pos); };

  Dial.prototype.bind = function () {
    var self = this;

    /*@3.NODJ.26*/
    var I2 = window.GardenInkInput;
    this._keys = (I2 && I2.keyEngine) ? I2.keyEngine({
      active: function () { return !self.el.hidden && !!self.getCv(); },
      apply: function (act, phase) { self.runKey(act, phase); }
    }) : null;
    this._bus = (I2 && I2.on) ? I2.on(function (act, info) {
      if (self.el.hidden || act === 'profile') return;
      var cv = self.getCv();
      if (info && info.el && cv && cv.wet && info.el !== cv.wet) return;
      self.cmd(act);
    }) : null;
    this._outside = function (e) {
      if (!self.open || self.el.hidden) return;
      var t = e.target;
      if (t && t.closest && (t.closest('.ndl') || t.closest('.nip') || t.closest('.ndl-dock') || t.closest('dialog'))) return;
      self.setOpen(false);
    };
    document.addEventListener('pointerdown', this._outside, true);

    /*@3.NODJ.5*/
    var st = null;
    this.hub.addEventListener('pointerdown', function (e) {
      st = { x: e.clientX, y: e.clientY, ox: self.pos.x, oy: self.pos.y, moved: false, id: e.pointerId };
      try { self.hub.setPointerCapture(e.pointerId); } catch (e2) {}
      e.preventDefault();
    });
    this.hub.addEventListener('pointermove', function (e) {
      if (!st || e.pointerId !== st.id) return;
      var dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.moved && (Math.abs(dx) + Math.abs(dy)) < 6) return;
      st.moved = true;
      var zz = self.uiZ();
      self.place({ x: st.ox + dx / zz, y: st.oy + dy / zz });
    });
    var end = function (e) {
      if (!st || e.pointerId !== st.id) return;
      try { self.hub.releasePointerCapture(st.id); } catch (e2) {}
      if (st.moved) writePos(self.pos);
      else if (self.open && window.GardenInkPanel) self.togglePanel();
      else self.setOpen(!self.open);
      st = null;
    };
    this.hub.addEventListener('pointerup', end);
    this.hub.addEventListener('pointercancel', function (e) { if (st && e.pointerId === st.id) st = null; });

    this.halo.addEventListener('click', function (e) { self.haloPick(e); });
    this.halo.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    this.zoomBtn.addEventListener('click', function () {
      if (!self.open) self.setOpen(true);
      self.openSub('zoom');
    });

    this.r1.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]');
      if (!b) return;
      self.pick(b.getAttribute('data-k'), b);
    });
    this.r2.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]');
      if (!b) return;
      self.pick(b.getAttribute('data-k'), b);
    });

    var hov = function (e) {
      var b = e.target.closest('[data-k], [data-hc], [data-hp], [data-hs]');
      if (!b) { self.tip.setAttribute('data-on', '0'); return; }
      self.tip.textContent = L(b.getAttribute('data-ar') || '', b.getAttribute('data-en') || '');
      self.tip.setAttribute('data-on', '1');
    };
    this.el.addEventListener('pointerover', hov);
    this.el.addEventListener('pointerout', function () { self.tip.setAttribute('data-on', '0'); });

    this._onKey = function (e) {
      if (e.key !== 'Escape' || self.el.hidden) return;
      if (self.sub) { self.closeSub(); return; }
      if (self.open) { self.setOpen(false); }
    };
    document.addEventListener('keydown', this._onKey);

    this._onRestore = function () { self.restore(); };
    this.el.addEventListener('pointerenter', this._onRestore);
    this.hub.addEventListener('click', this._onRestore);

    this._onRz = function () { self.clamp(); };
    window.addEventListener('resize', this._onRz);

    this._onLang = function () {
      i18n(self.el);
      self.paintRing1();
      self.paintFavs();
      self.paintColors();
      if (self.sub) self.openSub(self.sub);
      self.sync();
    };
    document.addEventListener('garden:languageChanged', this._onLang);
    this._onSync = function () { self.paintColors(); };
    window.addEventListener('garden:syncCompleted', this._onSync);
  };

  /*@3.NODJ.6*/
  Dial.prototype.pick = function (k, btn) {
    var cv = this.getCv();
    var item = null, i;
    for (i = 0; i < RING1.length; i++) if (RING1[i].k === k) item = RING1[i];

    if (item) {
      if (item.k === 'exit') { this.setOpen(false); this.onExit(); return; }
      if (item.k === 'undo') { if (cv) { if (cv.hist) cv.hist.undo(); else cv.undo(); } this.sync(); return; }
      if (item.k === 'redo') { if (cv) { if (cv.hist) cv.hist.redo(); else cv.redo(); } this.sync(); return; }
      /*@3.NODJ.58*/
      if (item.tool && cv && item.set && cv.tool === item.tool) {
        this.openSub(item.set, item.k);
        this.sync();
        return;
      }
      if (item.tool && cv) {
        cv.setTool(item.tool);
        if (item.tool === 'hi' && typeof cv.color === 'string' &&
            cv.color.charAt(0) !== '#') {
          var C1 = window.GardenCanvas;
          var hx = (C1 && C1.hiHexOf) ? C1.hiHexOf(cv.color) : '';
          var pn = (C1 && C1.hexOf) ? C1.hexOf(cv.color) : '';
          if (!hx || hx === pn) cv.setColor('yellow');
        }
      }
      if (item.ring) this.openSub(item.ring, item.k);
      else this.closeSub();
      this.sync();
      return;
    }

    if (!cv) return;
    if (k.indexOf('nib:') === 0) { cv.setNib(k.slice(4)); }
    else if (k.indexOf('w:') === 0) { cv.setWidth(parseFloat(k.slice(2))); }
    else if (k.indexOf('tool:') === 0) { cv.setTool(k.slice(5)); }
    else if (k === 'c:custom') this.pickCustom(btn);
    else if (k.indexOf('c:') === 0) { cv.setColor(k.slice(2)); }
    else if (k === 'z:in') cv.setUserZoom(cv.userZ * 1.25);
    else if (k === 'z:out') cv.setUserZoom(cv.userZ / 1.25);
    else if (k.indexOf('era:') === 0) cv.setEraseMode(k.slice(4));
    else if (k.indexOf('str:') === 0) cv.setStraight(k.slice(4) === '1');
    else if (k.indexOf('hm:') === 0 && cv.setHiMode) cv.setHiMode(k.slice(3));
    else if (k.indexOf('hs:') === 0 && cv.setHiStyle) cv.setHiStyle(k.slice(3));
    else if (k === 'z:100') cv.resetZoom();
    else if (k === 'z:fit') cv.resetZoom();
    this.sync();
  };

  /*@3.NODJ.7*/
  Dial.prototype.pickCustom = function (btn) {
    var self = this, cv = this.getCv();
    if (!cv) return;
    var cur = (typeof cv.color === 'string' && cv.color.charAt(0) === '#') ? cv.color : hexOf(cv.color);
    /*@3.NODJ.29*/
    var S = window.GardenSwatch;
    if (S && S.board) {
      S.board(btn || null, cur, function (v, done) {
        cv.setColor(v);
        self.sync();
      });
      return;
    }
    cv.setColor(cur);
    self.sync();
  };

  /*@3.NODJ.100*/
  /*@3.NODJ.96*/
  var HINT_MS = 3000, HINT_KEY = 'garden_ink_nibhint';
  function hintSeen(k) {
    try { return sessionStorage.getItem(HINT_KEY + ':' + k) === '1'; } catch (e) { return true; }
  }
  function hintMark(k) {
    try { sessionStorage.setItem(HINT_KEY + ':' + k, '1'); } catch (e) {}
  }

  Dial.prototype.nibHint = function (why) {
    if (hintSeen(why)) return false;
    var b = this.favBar ? this.favBar.querySelector('[data-fixsize]') : null;
    if (!b || b.offsetParent === null) return false;
    hintMark(why);
    var self = this;
    b.setAttribute('data-hint', '1');
    if (this._hintT) clearTimeout(this._hintT);
    this._hintT = setTimeout(function () {
      var c = self.favBar ? self.favBar.querySelector('[data-fixsize][data-hint]') : null;
      if (c) c.removeAttribute('data-hint');
      self._hintLive = 0;
    }, HINT_MS);
    this._hintLive = 1;
    return true;
  };

  Dial.prototype.sync = function (st) {
    var cv = this.getCv();
    var s = st || (cv ? {
      tool: cv.tool, color: cv.color, width: cv.width, nib: cv.nib,
      zoom: cv.userZ, fit: cv.fitZ, used: cv.used || null,
      canUndo: cv.hist ? cv.hist.canUndo() : !!(cv.undoS && cv.undoS.length),
      canRedo: cv.hist ? cv.hist.canRedo() : !!(cv.redoS && cv.redoS.length)
    } : null);
    if (!s) return;
    if (s.used) this.rec(s.used);
    /*@3.NODJ.102*/
    if (s.tool === 'pen' || s.tool === 'hi') {
      this.nibHint('start');
      if (this._lastTool && this._lastTool !== s.tool) this.nibHint('swap');
    }
    this._lastTool = s.tool;

    var hi = this.el.querySelector('[data-role="hub-i"]');
    if (hi) {
      var ic = 'fa-pen', svg = null;
      for (var i = 0; i < RING1.length; i++) {
        if (RING1[i].tool === s.tool) { ic = RING1[i].icon; svg = RING1[i].html || null; }
      }
      for (var j = 0; j < SHAPES.length; j++) if (SHAPES[j].k === s.tool) { ic = SHAPES[j].icon; svg = null; }
      if (s.tool === 'era') {
        svg = (cv && cv.eraseMode === 'part') ? ICONS.eraserPen : ICONS.eraserSmart;
      }
      if (s.tool === 'hi') {
        svg = (cv && cv.hiStraight) ? ICONS.hiStraight : ICONS.hiWave;
      }
      if (svg) hi.outerHTML = '<span class="ni-host" data-role="hub-i">' + svg + '</span>';
      else hi.outerHTML = '<i class="fa-solid ' + ic + '" aria-hidden="true" data-role="hub-i"></i>';
    }
    this.hubFace();
    this.paintHalo();
    if (this.panel && this.panel.open && !this._inPanelSync) {
      this._inPanelSync = 1;
      try { this.panel.render(); } finally { this._inPanelSync = 0; }
    }
    /*@3.NODJ.53*/
    this.hub.style.color = hexOf(s.color);
    var C0 = window.GardenCanvas;
    var paper = (C0 && C0.paperHex) ? C0.paperHex() : null;
    this.hub.style.setProperty('--ndl-paper', paper || '');
    this.el.style.setProperty('--ndl-paper', paper || '');

    var z = this.zoomBtn;
    if (z) {
      var bound = !!(cv && cv.bound);
      z.textContent = Math.round((bound ? (s.fit || 1) : (s.zoom || 1)) * 100) + '%';
      z.setAttribute('data-ar-title', bound ? 'حجمُ الورقة نسبةً إلى A4' : 'التكبير');
      z.setAttribute('data-en-title', bound ? 'Page size relative to A4' : 'Zoom');
      z.setAttribute('title', L(bound ? 'حجمُ الورقة نسبةً إلى A4' : 'التكبير',
                                bound ? 'Page size relative to A4' : 'Zoom'));
      z.style.cursor = bound ? 'default' : 'pointer';
      /*@3.NODJ.37*/
      z.hidden = bound;
    }

    var q = this.r1.querySelectorAll('[data-k]');
    for (var m = 0; m < q.length; m++) {
      var kk = q[m].getAttribute('data-k'), on = false;
      for (var n = 0; n < RING1.length; n++) {
        if (RING1[n].k === kk && RING1[n].tool && RING1[n].tool === s.tool) on = true;
      }
      if (kk === 'shape') {
        for (var p = 0; p < SHAPES.length; p++) if (SHAPES[p].k === s.tool) on = true;
      }
      if (kk === 'undo') q[m].disabled = !s.canUndo;
      if (kk === 'redo') q[m].disabled = !s.canRedo;
      q[m].setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    this.syncFavs(s);

    if (this.sub) {
      var items = this.subItems(this.sub);
      var sq = this.r2.querySelectorAll('[data-k]');
      for (var t = 0; t < sq.length && t < items.length; t++) {
        sq[t].setAttribute('aria-pressed', items[t].pressed ? 'true' : 'false');
        if (this.sub === 'color') sq[t].style.setProperty('--t', hexOf(s.color === items[t].k.slice(2)
          ? s.color : items[t].k.slice(2)));
      }
    }
  };

  /*@3.NODJ.71*/
  Dial.prototype.show = function (on, drawing, keepDock) {
    this.el.hidden = !on;
    this.el.setAttribute('data-drawing', drawing ? '1' : '0');
    /*@3.NODJ.88*/
    var live = on || keepDock;
    var st = barRead();
    if (this.dock) this.dock.hidden = !live;
    if (this.favBar) this.favBar.hidden = !live || !barOf(st, 'favs').on;
    if (this.colorBar) this.colorBar.hidden = !live || !barOf(st, 'colors').on;
    if (this.toolBar) this.toolBar.hidden = !live || !barOf(st, 'tools').on;
    if (this.mineBar) this.mineBar.hidden = !live || !barOf(st, 'mine').on;
    if (on) { this.paintRing1(); this.paintColors(); this.paintTools(); this.paintMine(); this.clamp(); this.sync(); }
    else { this.setOpen(false); if (this.panel && this.panel.open) this.panel.toggle(false); }
  };

  /*@3.NODJ.16*/
  Dial.prototype.dim = function (on) {
    if (!on) return;
    if (this.open) { this._wasOpen = { open: true, sub: this.sub }; this.setOpen(false); }
  };

  Dial.prototype.restore = function () {
    var w = this._wasOpen;
    if (!w) return;
    this._wasOpen = null;
    this.setOpen(true);
    if (w.sub) this.openSub(w.sub);
  };

  Dial.prototype.destroy = function () {
    if (this._themeObs) { try { this._themeObs.disconnect(); } catch (e) {} }
    document.removeEventListener('keydown', this._onKey);
    /*@3.NODJ.28*/
    if (this._keys) this._keys();
    if (this._bus) this._bus();
    document.removeEventListener('pointerdown', this._outside, true);
    if (this.panel) { try { this.panel.destroy(); } catch (eP) {} this.panel = null; }
    if (this._onRestore) this.el.removeEventListener('pointerenter', this._onRestore);
    window.removeEventListener('resize', this._onRz);
    document.removeEventListener('garden:languageChanged', this._onLang);
    if (this._onSync) window.removeEventListener('garden:syncCompleted', this._onSync);
    if (this.el && this.el.parentNode) this.el.remove();
    if (this.dock && this.dock.parentNode) this.dock.remove();
    else if (this.favBar && this.favBar.parentNode) this.favBar.remove();
  };

  window.GardenNotesDial = {
    mount: function (opts) { return new Dial(opts); },
    penButtons: function () { var o = { penBtnDialog: Dial.prototype.penBtnDialog }; return o.penBtnDialog(); },
    RING1: RING1,
    TONES: TONES
  };
})();
