/*@3.NOEJ.1*/
;(function () {
  'use strict';

  var B = function () { return window.GardenNotesBlocks; };
  function hasFlow(bs) {
    for (var i = 0; i < bs.length; i++) if (bs[i] && bs[i].ty && bs[i].ty !== 'pb' && !bs[i].fp) return true;
    return false;
  }
  var SAN = function () { return window.GardenNotesSanitize; };

  /*@3.NOEJ.45*/
  var TEXTY = { p: 1, h: 1, quote: 1, callout: 1, todo: 1, sticky: 1, shape: 1 };
  /*@3.NOEJ.366*/
  var STICKY_TONES = [
    { k: 'amber',  ar: 'كهرمانيّ', en: 'Amber' },
    { k: 'lime',   ar: 'ليمونيّ',  en: 'Lime' },
    { k: 'sky',    ar: 'سماويّ',   en: 'Sky' },
    { k: 'pink',   ar: 'زهريّ',    en: 'Pink' },
    { k: 'violet', ar: 'بنفسجيّ',  en: 'Violet' },
    { k: 'slate',  ar: 'رماديّ',   en: 'Slate' }
  ];
  /*@3.NOEJ.204*/
  var LISTY = { ul: 1, ol: 1, dl: 1 };
  var KEEP = ['dir', 'al', 'ff', 'fs', 'hlb', 'fp', 'wm', 'z', 'zi', 'csc', 'rot', 'ls', 'lsb', 'fx', 'fy', 'sk', 'th'];
  /*@3.NOEJ.70*/
  var WIDE = { hr: 1, tbl: 1, ink: 1, gap: 1 };
  var AUTOSAVE_MS = 2000;
  var LAZY_SAVE_MS = 45000;
  /*@3.NOEJ.214*/
  /*@3.NOEJ.520*/
  var PBV = 6;
  /*@3.NOEJ.560*/
  var LV = (function () {
    try { var m = /[?&]v=([^&#]+)/.exec((document.currentScript && document.currentScript.src) || ''); return m ? m[1] : ''; } catch (eV) { return ''; }
  }());
  function engFresh(eng) { return !!(eng && eng.pbv === PBV && (eng.lv || '') === LV); }
  /*@3.NOEJ.220*/
  var CUT_SAFE = 10;
  /*@3.NOEJ.281*/
  var WIN_MIN = 300;
  /*@3.NOEJ.477*/
  /*@3.NOEJ.498*/
  /*@3.NOEJ.547*/
  var TFIT_MIN = 5, TFIT_SOFT = 0.8;
  var TBL_LAZY = 1200, TBL_LAZY_MIN = 24;
  /*@3.NOEJ.565*/
  var TBL_SAMPLE = 80;
  function winSwitch() {
    try {
      var v = localStorage.getItem('garden_notes_win');
      return v === '0' ? 0 : 1;
    } catch (e) { return 1; }
  }
  var WIN_PAD = 1600;
  var WIN_KEEP = 500;
  var WIN_SPAN = 70;
  var TYPE_GROUP_MS = 900;
  var TYPE_GROUP_MAX = 4000;
  var UNDO_MAX = 120;
  /*@3.NOEJ.246*/
  var UNDO_BYTES = 8 * 1024 * 1024;
  var UNDO_MIN = 12;

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }

  /*@3.NOEJ.227*/
  var CAL = {
    note:      { icon: 'fa-circle-info',          ar: 'ملاحظة', en: 'Note' },
    tip:       { icon: 'fa-lightbulb',            ar: 'فائدة',  en: 'Tip' },
    important: { icon: 'fa-star',                 ar: 'مهمّ',    en: 'Important' },
    warning:   { icon: 'fa-triangle-exclamation', ar: 'تحذير',  en: 'Warning' },
    caution:   { icon: 'fa-circle-exclamation',   ar: 'تنبيه',  en: 'Caution' }
  };
  var CAL_ORDER = ['note', 'tip', 'important', 'warning', 'caution'];
  function calKind(b) {
    var k = String((b && b.cal) || 'note').toLowerCase();
    return CAL[k] ? k : 'note';
  }

  var TURN = [
    { ty: 'p',       icon: 'fa-align-left',      ar: 'فقرة',        en: 'Paragraph' },
    { ty: 'h', lv: 1, icon: 'fa-heading',        ar: 'عنوان كبير',  en: 'Heading 1' },
    { ty: 'h', lv: 2, icon: 'fa-heading',        ar: 'عنوان متوسط', en: 'Heading 2' },
    { ty: 'h', lv: 3, icon: 'fa-heading',        ar: 'عنوان صغير',  en: 'Heading 3' },
    { ty: 'ul',      icon: 'fa-list-ul',         ar: 'قائمة نقطية', en: 'Bullet list' },
    { ty: 'ol',      icon: 'fa-list-ol',         ar: 'قائمة رقمية', en: 'Numbered list' },
    { ty: 'todo',    icon: 'fa-square-check',    ar: 'مربع مهمة',   en: 'To-do' },
    { ty: 'quote',   icon: 'fa-quote-right',     ar: 'اقتباس',      en: 'Quote' },
    { ty: 'callout', icon: 'fa-circle-info',     ar: 'صندوق ملاحظة', en: 'Note box',
      extra: { cal: 'note' } },
    { ty: 'callout', icon: 'fa-lightbulb',       ar: 'صندوق فائدة',  en: 'Tip box',
      extra: { cal: 'tip' } },
    { ty: 'callout', icon: 'fa-triangle-exclamation', ar: 'صندوق تحذير', en: 'Warning box',
      extra: { cal: 'warning' } },
    { ty: 'code',    icon: 'fa-code',            ar: 'كود',         en: 'Code' },
    /*@3.NOEJ.368*/
    { ty: 'sticky',  icon: 'fa-note-sticky',     ar: 'ورقةٌ ملصقة', en: 'Sticky note' },
    /*@3.NOEJ.374*/
    { ty: 'shape',   icon: 'fa-shapes',          ar: 'شكل',         en: 'Shape' }
  ];

  /*@3.NOEJ.229*/
  var MMD_EG = 'graph TD\n  A[\u0627\u0644\u0628\u062f\u0627\u064a\u0629] --> ' +
    'B{\u0634\u0631\u0637\u061f}\n  B -->|\u0646\u0639\u0645| ' +
    'C[\u0646\u0641\u0651\u0630]\n  B -->|\u0644\u0627| ' +
    'D[\u062a\u0648\u0642\u0651\u0641]';

  var INSERT = [
    { ty: 'p',       icon: 'fa-align-left',      ar: 'فقرة',        en: 'Paragraph',
      eg: { ar: 'نصٌّ عاديّ', en: 'Plain text' } },
    { ty: 'ul',      icon: 'fa-list-ul',         ar: 'قائمة نقطية', en: 'Bullet list',
      eg: { ar: '• بندٌ أوّل', en: '• First item' } },
    { ty: 'ol',      icon: 'fa-list-ol',         ar: 'قائمة رقمية', en: 'Numbered list',
      eg: { ar: '١. بندٌ أوّل', en: '1. First item' } },
    { ty: 'todo',    icon: 'fa-square-check',    ar: 'مربع مهمة',   en: 'To-do',
      eg: { ar: '\u2610 مهمّةٌ تُشطب', en: '\u2610 A task to tick' } },
    { ty: 'quote',   icon: 'fa-quote-right',     ar: 'اقتباس',      en: 'Quote',
      eg: { ar: 'كلامٌ منقولٌ عن غيرك', en: 'Words quoted from someone else' } },
    { ty: 'callout', icon: 'fa-circle-info',     ar: 'صندوق ملاحظة', en: 'Note box',
      extra: { cal: 'note' },
      eg: { ar: 'أزرق — معلومةٌ جانبيّة', en: 'Blue — a side note' } },
    { ty: 'callout', icon: 'fa-lightbulb',       ar: 'صندوق فائدة',  en: 'Tip box',
      extra: { cal: 'tip' },
      eg: { ar: 'أخضر — حيلةٌ تختصر عليك', en: 'Green — a shortcut' } },
    { ty: 'callout', icon: 'fa-star',            ar: 'صندوق مهمّ',    en: 'Important box',
      extra: { cal: 'important' },
      eg: { ar: 'بنفسجيّ — لا تنسَ هذا', en: 'Violet — do not miss this' } },
    { ty: 'callout', icon: 'fa-triangle-exclamation', ar: 'صندوق تحذير', en: 'Warning box',
      extra: { cal: 'warning' },
      eg: { ar: 'كهرمانيّ — انتبه قبل أن تمضي', en: 'Amber — check before you go on' } },
    { ty: 'callout', icon: 'fa-circle-exclamation', ar: 'صندوق تنبيه', en: 'Caution box',
      extra: { cal: 'caution' },
      eg: { ar: 'أحمر — خطأٌ شائعٌ هنا', en: 'Red — a common mistake' } },
    { ty: 'code',    icon: 'fa-code',            ar: 'كود',         en: 'Code',
      eg: { ar: 'شِفرةٌ ملوَّنةٌ بلغتها', en: 'Code, coloured by language' } },
    { ty: 'code',    icon: 'fa-diagram-project', ar: 'مخطّط ميرمايد', en: 'Mermaid diagram',
      extra: { lang: 'mermaid', dgm: 1, src: MMD_EG },
      eg: { ar: 'يُرسم فوراً — تدفّقٌ أو تسلسل', en: 'Drawn at once — flow or sequence' } },
    { ty: 'tbl',     icon: 'fa-table',           ar: 'جدول',        en: 'Table',
      eg: { ar: 'رأسُه يتكرّر عند الطباعة', en: 'Its header repeats when printed' } },
    { ty: 'math',    icon: 'fa-square-root-variable', ar: 'معادلة', en: 'Equation',
      eg: { ar: 'LaTeX \u2014 \\sum_{i=1}^{n} i^2', en: 'LaTeX \u2014 \\sum_{i=1}^{n} i^2' } },
    { ty: 'sticky',  icon: 'fa-note-sticky',     ar: 'ورقةٌ ملصقة', en: 'Sticky note',
      eg: { ar: 'ورقةٌ صغيرةٌ بلونٍ تختاره', en: 'A small paper in a colour you pick' } },
    /*@3.NOEJ.378*/
    { ty: 'shape',   icon: 'fa-shapes',          ar: 'شكل',         en: 'Shape',
      eg: { ar: 'مستطيلٌ أو نجمةٌ أو سهم — ويُكتب داخله',
            en: 'A box, a star, an arrow — and you write inside it' } },
    { ty: 'img',     icon: 'fa-image',           ar: 'صورة',        en: 'Image',
      eg: { ar: 'من جهازك أو قوقل درايف أو رابط — أو الصقْها واسحبْها', en: 'From your device, Google Drive or a link — or paste and drop' } },
    { ty: 'hr',      icon: 'fa-minus',           ar: 'فاصل',        en: 'Divider',
      eg: { ar: 'خطٌّ يفصل قسمين', en: 'A line between sections' } },
    { ty: 'gap',     icon: 'fa-arrows-up-down',  ar: 'فراغ',         en: 'Spacer',
      eg: { ar: 'مسافةٌ بيضاءُ بارتفاعٍ تختاره', en: 'White space you size' } },
    /*@3.NOEJ.439*/
    { ty: 'pb',      icon: 'fa-file-lines',      ar: 'فاصلُ صفحة',   en: 'Page break',
      eg: { ar: 'ما بعده يبدأ في صفحةٍ جديدة — كما يُطبع', en: 'What follows starts on a new page — as printed' } }
  ];

  var MENU = INSERT;

  function clone(o) {
    var out = {}, k;
    for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
    return out;
  }

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /*@3.NOEJ.6*/
  function offsetIn(root, node, off) {
    var n = 0, done = false, res = 0;
    function rec(host) {
      var kids = host.childNodes;
      for (var i = 0; i < kids.length; i++) {
        if (done) return;
        if (host === node && i === off) { res = n; done = true; return; }
        var c = kids[i];
        if (c.nodeType === 3) {
          if (c === node) { res = n + off; done = true; return; }
          n += c.nodeValue.length;
        } else if (c.nodeType === 1) {
          if (c.tagName === 'BR') { n += 1; }
          else rec(c);
        }
      }
      if (!done && host === node && off >= kids.length) { res = n; done = true; }
    }
    if (node === root && off === 0) return 0;
    rec(root);
    return done ? res : n;
  }

  function pointAt(root, pos) {
    var n = 0, hit = null;
    function rec(host) {
      var kids = host.childNodes;
      for (var i = 0; i < kids.length && !hit; i++) {
        var c = kids[i];
        if (c.nodeType === 3) {
          var len = c.nodeValue.length;
          if (pos <= n + len) { hit = { node: c, off: pos - n }; return; }
          n += len;
        } else if (c.nodeType === 1) {
          if (c.tagName === 'BR') {
            if (pos <= n) { hit = { node: host, off: i }; return; }
            n += 1;
          } else rec(c);
        }
      }
    }
    rec(root);
    if (hit) return hit;
    return { node: root, off: root.childNodes.length };
  }

  /*@3.NOEJ.105*/
  var ANCHOR_SEL = '.ne-text, .ne-li, .ne-cell, .ne-code';
  function selectRange(root, a, b) {
    var p1 = pointAt(root, a), p2 = pointAt(root, b);
    var r = document.createRange();
    try {
      r.setStart(p1.node, p1.off);
      r.setEnd(p2.node, p2.off);
    } catch (e) { return; }
    var s = window.getSelection();
    s.removeAllRanges(); s.addRange(r);
  }

  function runsLen(rt) {
    var n = 0;
    for (var i = 0; i < (rt || []).length; i++) n += (rt[i].s || '').length;
    return n;
  }

  /*@3.NOEJ.7*/
  function sliceRuns(rt, a, b) {
    var before = [], mid = [], after = [], pos = 0;
    for (var i = 0; i < (rt || []).length; i++) {
      var r = rt[i], s = r.s || '', len = s.length;
      var st = pos, en = pos + len;
      pos = en;
      if (en <= a) { before.push(r); continue; }
      if (st >= b) { after.push(r); continue; }
      if (st < a) before.push(Object.assign({}, r, { s: s.slice(0, a - st) }));
      var ms = Math.max(a, st), me = Math.min(b, en);
      if (me > ms) mid.push(Object.assign({}, r, { s: s.slice(ms - st, me - st) }));
      if (en > b) after.push(Object.assign({}, r, { s: s.slice(b - st) }));
    }
    return [before, mid, after];
  }

  function joinRuns(parts) {
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var arr = parts[i];
      for (var j = 0; j < arr.length; j++) {
        var r = arr[j];
        if (!r.s) continue;
        var last = out[out.length - 1];
        if (last && sameStyle(last, r)) { last.s += r.s; continue; }
        out.push(Object.assign({}, r));
      }
    }
    return out;
  }

  /*@3.NOEJ.108*/
  function sameStyle(a, b) { return B().sameRun(a, b); }

  function wordBounds(rt, pos) {
    var txt = B().runsToText(rt);
    if (!txt) return null;
    var a = pos, b = pos;
    var isW = function (ch) { return ch && !/[\s.,;:!?()[\]{}"'،؛؟—–-]/.test(ch); };
    while (a > 0 && isW(txt.charAt(a - 1))) a--;
    while (b < txt.length && isW(txt.charAt(b))) b++;
    return b > a ? [a, b] : null;
  }

  function Editor(host, doc, opts) {
    this.host = host;
    this.opts = opts || {};
    this.doc = B().normalize(doc);
    this.hist = this.opts.hist || null;
    this.undo = [];
    this.redo = [];
    this.saveTimer = null;
    this._fpy = null;
    this.dirty = false;
    this.focusEd = null;
    this.lastSel = null;
    this.root = el('div', 'ne-root');
    this.root.__ed = this;
    if (!this.opts.pickDrive) this.root.setAttribute('data-nogd', '1');
    this.host.innerHTML = '';
    this.host.appendChild(this.root);
    this.render();
    var selfE = this;
    needEmoji().then(function () { selfE.emojiSweep(); });
    if (document.fonts) {
      /*@3.NOEJ.156*/
      var engSettle = function () {
        if (selfE._engRecap) {
          var fullR = selfE._engRecap === 'full';
          selfE._engRecap = false;
          selfE.captureEng(fullR);
          if (selfE.doc.eng && selfE.opts.onSave) selfE.opts.onSave(selfE.doc, true);
        } else {
          selfE.applyEng();
        }
      };
      this._onFaces = engSettle;
      /*@3.NOEJ.449*/
      setTimeout(function () {
        if (selfE._destroyed || !selfE._onFaces) return;
        fontsReady().then(function () { if (selfE._onFaces) engSettle(); });
      }, 0);
      try { document.fonts.addEventListener('loadingdone', engSettle); } catch (eL) {}
    }
    this.bind();
    this.watch();
    this.bindDrag();
    this.bindImgPan();
    this.bindFreeCleanup();
  }

  /*@3.NOEJ.235*/
  Editor.prototype.settled = function () {
    var self = this;
    clearTimeout(this._setT);
    this._setT = setTimeout(function () {
      if (self._destroyed || !self.root || !self.root.isConnected) return;
      var go = function () {
        if (self._destroyed || !self.root || !self.root.isConnected) return;
        self._engStale = true;
        self.captureEng();
        if (self.doc.eng && self.opts.onSave) self.opts.onSave(self.doc, true);
      };
      /*@3.NOEJ.479*/
      if (!self._nat && !self._win) self.settleAll().then(go, go); else go();
    }, 180);
  };

  function imgWait(im, cap) {
    return new Promise(function (res) {
      var t = setTimeout(function () { res(false); }, cap || 4000);
      var fin = function () { clearTimeout(t); res(true); };
      if (im.complete && (im.naturalWidth || !im.getAttribute('src'))) { fin(); return; }
      im.addEventListener('load', fin, { once: true });
      im.addEventListener('error', fin, { once: true });
    });
  }

  Editor.prototype.settleAll = function (cap) {
    var self = this, root = this.root, waits = [], i;
    if (!root) return Promise.resolve(false);
    try {
      if (document.fonts) {
        if (document.fonts.status !== 'loaded') waits.push(document.fonts.ready);
        if (root.querySelector('.ne-code')) waits.push(document.fonts.load('16px "JetBrains Mono"'));
      }
    } catch (eF) {}
    var imgs = root.querySelectorAll('img.ne-img');
    for (i = 0; i < imgs.length; i++) {
      if (imgs[i].complete && imgs[i].naturalWidth) continue;
      if (imgs[i].getAttribute('loading') === 'lazy') imgs[i].setAttribute('loading', 'eager');
      waits.push(imgWait(imgs[i], cap || 4000));
    }
    var pend = root.querySelectorAll('[data-imgwait]');
    if (pend.length) {
      waits.push(new Promise(function (res) {
        var n = 0;
        (function tick() {
          var left = root.querySelectorAll('[data-imgwait]').length;
          if (!left || n++ > 40) { res(!left); return; }
          setTimeout(tick, 100);
        }());
      }).then(function () {
        var im2 = root.querySelectorAll('img.ne-img'), q, w2 = [];
        for (q = 0; q < im2.length; q++) {
          if (im2[q].complete && im2[q].naturalWidth) continue;
          if (im2[q].getAttribute('loading') === 'lazy') im2[q].setAttribute('loading', 'eager');
          w2.push(imgWait(im2[q], cap || 4000));
        }
        return Promise.all(w2);
      }));
    }
    if (this.dgmApply) { try { this.dgmApply(); } catch (eD) {} }
    if (this.mathAll) { try { waits.push(this.mathAll()); } catch (eM) {} }
    var done = function () { codeFlush(); try { self.tblFlushAll(); } catch (eT) {} self.dgmSettle(); return true; };
    return Promise.all(waits.map(function (p) { return Promise.resolve(p).catch(function () { return false; }); })).then(done, done);
  };

  /*@3.NOEJ.521*/
  Editor.prototype.dhSync = function (ids) {
    if (!ids || !ids.length || !this._nat || !this.natOk()) return 0;
    var map = this.bidMap(), off = [], i, n = 0;
    for (i = 0; i < ids.length; i++) if (!map[ids[i]]) off.push(ids[i]);
    if (!off.length) return 0;
    try { n = this.natMeasure(off); } catch (eN) { n = 0; }
    if (n && this.natOk()) this.reflowEng();
    return n;
  };

  /*@3.NOEJ.483*/
  Editor.prototype.dgmSettle = function () {
    var self = this;
    if (!this.dgmPrecache || this._dgmSettling) return;
    var bs = this.doc.blocks, todo = [], i, b;
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (!b || !isDiagram(b) || (b.dgm != null && !b.dgm) || !String(b.src || '').trim()) continue;
      var c = this._dgmSvg ? this._dgmSvg[b.id] : null;
      if (c && c.src === String(b.src || '')) continue;
      todo.push(b);
    }
    if (!todo.length) return;
    this._dgmSettling = true;
    var fin = function () {
      self._dgmSettling = false;
      if (self._destroyed || !self.root || !self.root.isConnected) return;
      var ids = [], q, map = self.bidMap();
      var nA = 0;
      try { nA = self.dgmApply(); } catch (eA) { nA = 0; }
      for (q = 0; q < todo.length; q++) if (!map[todo[q].id]) ids.push(todo[q].id);
      var nM = 0;
      if (ids.length && self._nat) { try { nM = self.natMeasure(ids); } catch (eN) { nM = 0; } }
      if (nA && self._win) { self._nat = null; self._engStale = true; self.settled(); return; }
      if (nA) { self._engStale = true; self.settled(); return; }
      if (nM && self.natOk()) self.reflowEng();
    };
    this.dgmPrecache(todo, false).then(fin, fin);
  };

  /*@3.NOEJ.583*/
  function Snap(keys, sh, bs, fresh) {
    this.k = keys; this.sh = sh; this.b = bs; this.length = fresh;
  }
  /*@3.NOEJ.584*/
  Snap.prototype.toString = function () { return JSON.stringify(unsnap(this)); };

  /*@3.NOEJ.585*/
  function unsnap(s) {
    if (!(s instanceof Snap)) return JSON.parse(s);
    var sh = JSON.parse(s.sh), d = {}, bs = new Array(s.b.length), i, k;
    for (i = 0; i < s.b.length; i++) bs[i] = JSON.parse(s.b[i]);
    for (i = 0; i < s.k.length; i++) {
      k = s.k[i];
      if (k === 'blocks') d[k] = bs;
      else if (Object.prototype.hasOwnProperty.call(sh, k)) d[k] = sh[k];
    }
    return d;
  }

  Editor.prototype.snapshot = function () {
    var d = this.doc, bs = d.blocks || [], sh = {}, keys = [], k, i, b, s, p, id;
    var memo = this._snapMemo, next = new Map(), out = new Array(bs.length), fresh = bs.length * 8;
    for (k in d) {
      if (!Object.prototype.hasOwnProperty.call(d, k)) continue;
      keys.push(k);
      if (k !== 'blocks') sh[k] = d[k];
    }
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      s = JSON.stringify(b);
      if (s === undefined) s = 'null';
      id = b ? b.id : null;
      p = memo && id != null ? memo.get(id) : undefined;
      if (p === s) s = p; else fresh += s.length;
      if (id != null) next.set(id, s);
      out[i] = s;
    }
    s = JSON.stringify(sh);
    if (this._snapSh === s) s = this._snapSh; else { this._snapSh = s; fresh += s.length; }
    this._snapMemo = next;
    return new Snap(keys, s, out, fresh);
  };

  /*@3.NOEJ.2*/
  Editor.prototype.pushUndo = function (before) {
    this.undo.push(before);
    if (this.undo.length > UNDO_MAX) this.undo.shift();
    this._undoB = (this._undoB || 0) + (before ? before.length : 0);
    while (this._undoB > UNDO_BYTES && this.undo.length > UNDO_MIN) {
      var gone = this.undo.shift();
      this._undoB -= gone ? gone.length : 0;
    }
    this.redo.length = 0;
    this._tg = null;
    if (this.hist) this.hist.note('ed');
  };

  Editor.prototype.typeGroup = function (bid) {
    var now = Date.now(), g = this._tg;
    if (g && g.bid === bid && (now - g.last) < TYPE_GROUP_MS &&
        (now - g.start) < TYPE_GROUP_MAX) { g.last = now; return; }
    this.pushUndo(this.snapshot());
    this._tg = { bid: bid, start: now, last: now };
  };

  /*@3.NOEJ.320*/
  Editor.prototype.renderMany = function (ids) {
    if (!ids || !ids.length) return true;
    var fresh = [], i, id, node, hit, anyFree = false;
    this._sw = 0;
    this.sheetW();
    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      hit = this.blockAt(id);
      if (!hit) return false;
      node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
      if (!node) {
        if (this._win) continue;
        return false;
      }
      this.dropCanvas(id);
      var made = this.renderBlock(hit.b);
      this.roDrop(node);
      this.root.replaceChild(made, node);
      this.roAdd(made);
      fresh.push(made);
      if (hit.b.fp) anyFree = true;
    }
    codeFlush();
    if (this.natSync(fresh) && this.natOk()) this.reflowEng();
    else this.applyEng();
    this.applyReadOnly();
    this.paintBlockSel();
    this.reAct();
    if (anyFree) this.layoutFree();
    if (this.opts.onLayout) this.opts.onLayout();
    return true;
  };

  /*@3.NOEJ.476*/
  function codeFlush() {
    var C = window.GardenNotesCode;
    if (C && C.sizeFlush) { try { C.sizeFlush(); } catch (e) {} }
  }

  /*@3.NOEJ.319*/
  function shellSig(doc) {
    var out = {}, k;
    for (k in doc) {
      if (!Object.prototype.hasOwnProperty.call(doc, k)) continue;
      if (k === 'blocks' || k === 'eng') continue;
      out[k] = doc[k];
    }
    try { return JSON.stringify(out); } catch (e) { return null; }
  }

  var PATCH_SPAN = 400;
  var PATCH_EDIT = 60;

  Editor.prototype.applyDoc = function (next) {
    if (!next || !Array.isArray(next.blocks) || !next.blocks.length) return false;
    if (this.doc.kind !== next.kind) return false;
    /*@3.NOEJ.322*/
    if (!this._nat || !this.natOk()) return false;
    var sh = shellSig(this.doc);
    if (sh == null || sh !== shellSig(next)) return false;

    var a = this.doc.blocks, b = next.blocks;
    var n = a.length, m = b.length, i, j;
    var p = 0;
    while (p < n && p < m && a[p].id === b[p].id) p++;
    var s = 0;
    while (s < n - p && s < m - p && a[n - 1 - s].id === b[m - 1 - s].id) s++;
    var delN = n - p - s, addN = m - p - s;
    if (delN + addN > PATCH_SPAN) return false;

    var changed = [];
    for (i = 0; i < p; i++) {
      if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) changed.push(b[i].id);
      if (changed.length > PATCH_EDIT) return false;
    }
    for (j = 0; j < s; j++) {
      if (JSON.stringify(a[n - 1 - j]) !== JSON.stringify(b[m - 1 - j])) {
        changed.push(b[m - 1 - j].id);
      }
      if (changed.length > PATCH_EDIT) return false;
    }

    var delIds = [], addIds = [], addBlocks = [];
    for (i = p; i < p + delN; i++) delIds.push(a[i].id);
    for (i = p; i < p + addN; i++) { addIds.push(b[i].id); addBlocks.push(b[i]); }

    /*@3.NOEJ.323*/
    this.doc = next;

    for (i = 0; i < delIds.length; i++) {
      var gone = this.root.querySelector(':scope > [data-bid="' + delIds[i] + '"]');
      if (!gone) continue;
      this.dropCanvas(delIds[i]);
      this.roDrop(gone);
      gone.parentNode.removeChild(gone);
    }

    if (!this.natSplice(p, delN, addIds)) {
      this._nat = null;
      this._engStale = true;
      this.render();
      return true;
    }
    for (i = 0; i < addBlocks.length; i++) {
      if (!addBlocks[i].fp) continue;
      this._nat.gap[p + i] = null;
      this._nat.hgt[p + i] = 0;
    }

    if (this._win) {
      this.reflowEng();
      this.winApply(true);
    } else {
      this._sw = 0;
      this.sheetW();
      var frag = document.createDocumentFragment();
      for (i = 0; i < addBlocks.length; i++) frag.appendChild(this.renderBlock(addBlocks[i]));
      var fresh = [].slice.call(frag.children);
      var nx = this.doc.blocks[p + addN];
      var anchor = nx
        ? this.root.querySelector(':scope > [data-bid="' + nx.id + '"]')
        : null;
      if (!anchor) {
        anchor = (this._winB && this._winB.parentNode === this.root)
          ? this._winB : this.root.querySelector(':scope > .ne-tail');
      }
      if (anchor) this.root.insertBefore(frag, anchor);
      else this.root.appendChild(frag);
      for (i = 0; i < fresh.length; i++) this.roAdd(fresh[i]);
      if (this.natSync(fresh) && this.natOk()) this.reflowEng();
      else this.applyEng();
    }

    if (!this.renderMany(changed)) { this.render(); return true; }
    this.applyReadOnly();
    this.paintBlockSel();
    this.reAct();
    this.layoutFree();
    if (this.opts.onLayout) this.opts.onLayout();
    return true;
  };

  /*@3.NOEJ.321*/
  Editor.prototype.diffSite = function (a, b) {
    var n = a.length, m = b.length, p = 0;
    while (p < n && p < m && a[p].id === b[p].id) p++;
    if (p < m) return b[p].id;
    /*@3.NOEJ.324*/
    if (p < n) return '';
    for (var i = 0; i < m; i++) {
      if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return b[i].id;
    }
    return '';
  };

  /*@3.NOEJ.586*/
  var LIVE_KEYS = ['aud', 'xs'];

  Editor.prototype.swapDoc = function (next) {
    for (var li = 0; li < LIVE_KEYS.length; li++) {
      var lk = LIVE_KEYS[li];
      if (this.doc && this.doc[lk] !== undefined) next[lk] = this.doc[lk];
      else delete next[lk];
    }
    var site = '';
    try { site = this.diffSite(this.doc.blocks, next.blocks); } catch (eS) { site = ''; }
    if (!this.applyDoc(next)) {
      this.doc = next;
      this.render();
    }
    if (site && this.blockAt(site)) {
      this.touchAct(site);
      this.focusBlock(site);
    }
    /*@3.NOEJ.429*/
    if (this.opts.onEng) { try { this.opts.onEng(); } catch (eE3) {} }
    this.settled();
  };

  Editor.prototype.doUndo = function () {
    this._tg = null;
    if (!this.undo.length) return false;
    var cur = this.snapshot();
    this.redo.push(cur);
    var popped = this.undo.pop();
    this._undoB = Math.max(0, (this._undoB || 0) - (popped ? popped.length : 0));
    this.swapDoc(unsnap(popped));
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.doRedo = function () {
    this._tg = null;
    if (!this.redo.length) return false;
    var cur = this.snapshot();
    this.undo.push(cur);
    this._undoB = (this._undoB || 0) + cur.length;
    this.swapDoc(unsnap(this.redo.pop()));
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.253*/
  Editor.prototype.softTouch = function () {
    if (!this._ro || !this.natOk() || !this.doc.eng || this._engStale) {
      this.touch();
      return;
    }
    if (DIR_CACHE) DIR_CACHE.delete(this.doc);
    if (this.opts.onLayout) this.opts.onLayout();
    this.mark();
  };

  Editor.prototype.touch = function (soft) {
    this._engStale = true;
    /*@3.NOEJ.181*/
    if (DIR_CACHE) DIR_CACHE.delete(this.doc);
    if (this._engOn) this.applyEng();
    if (this.opts.onLayout) this.opts.onLayout();
    this.mark(soft);
  };

  /*@3.NOEJ.211*/
  Editor.prototype.mark = function (soft) {
    this.dirty = true;
    if (!soft) {
      this._loud = 1;
      if (this.opts.onDirty) this.opts.onDirty();
    }
    this.arm();
  };

  /*@3.NOEJ.508*/
  Editor.prototype.markLazy = function () {
    this.dirty = true;
    if (this.saveTimer || this.lazyTimer) return;
    var self = this;
    this.lazyTimer = setTimeout(function () {
      self.lazyTimer = 0;
      if (self.opts.busy && self.opts.busy()) { self.markLazy(); return; }
      self.save();
    }, LAZY_SAVE_MS);
  };

  /*@3.NOEJ.212*/
  Editor.prototype.arm = function () {
    clearTimeout(this.saveTimer);
    if (this.lazyTimer) { clearTimeout(this.lazyTimer); this.lazyTimer = 0; }
    var self = this;
    this.saveTimer = setTimeout(function () {
      self.saveTimer = 0;
      if (self.opts.busy && self.opts.busy()) { self.arm(); return; }
      self.save();
    }, AUTOSAVE_MS);
  };

  Editor.prototype.save = function () {
    clearTimeout(this.saveTimer);
    this.saveTimer = 0;
    if (this.lazyTimer) { clearTimeout(this.lazyTimer); this.lazyTimer = 0; }
    this.readAll();
    for (var pi = this.doc.blocks.length - 1; pi >= 0; pi--) {
      var pb = this.doc.blocks[pi];
      if (!pb.prov) continue;
      if (this.blockHolds(pb, null)) delete pb.prov;
      else if (!this.caretInside(pb, null)) this.doc.blocks.splice(pi, 1);
    }
    /*@3.NOEJ.428*/
    if (!hasFlow(this.doc.blocks)) this.doc.blocks.push(B().blank('p'));
    this.dirty = false;
    this.captureEng();
    var loud = !!this._loud;
    this._loud = 0;
    if (this.opts.onSave) this.opts.onSave(this.doc, !loud);
    return this.doc;
  };

  /*@3.NOEJ.230*/
  Editor.prototype.blockAt = function (id) {
    var bs = this.doc.blocks, i;
    var ix = this._bidx;
    if (ix && ix.n === bs.length) {
      i = ix.m[id];
      if (i != null && bs[i] && bs[i].id === id) return { b: bs[i], i: i };
    }
    var m = {};
    for (i = 0; i < bs.length; i++) m[bs[i].id] = i;
    this._bidx = { n: bs.length, m: m };
    i = m[id];
    return (i == null) ? null : { b: bs[i], i: i };
  };

  /*@3.NOEJ.225*/
  var LIVE_TY = { img: 1, code: 1, math: 1, ink: 1, free: 1 };

  Editor.prototype.watch = function () {
    if (this._mo || typeof MutationObserver !== 'function') return;
    var self = this;
    this._dirty = null;
    this._mo = new MutationObserver(function (recs) { self.soil(recs); });
    this._mo.observe(this.root, { subtree: true, childList: true,
                                  characterData: true, attributes: true });
    this._imo = new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var ad = recs[i].addedNodes;
        for (var j = 0; j < ad.length; j++) {
          var n = ad[j];
          if (n.nodeType === 1 && !n.closest('mjx-container') && (n.classList.contains('ne-im') || n.querySelector('.ne-im'))) inlineMath(n);
        }
      }
    });
    this._imo.observe(this.root, { subtree: true, childList: true });
    inlineMath(this.root);
  };

  Editor.prototype.soil = function (recs) {
    if (this._dirty === null) return;
    for (var i = 0; i < recs.length; i++) {
      if (recs[i].type === 'attributes' &&
          (recs[i].attributeName === 'style' ||
           recs[i].attributeName === 'data-brk-sig')) continue;
      var t = recs[i].target;
      if (t && t.nodeType !== 1) t = t.parentNode;
      var n = (t && t.closest) ? t.closest('[data-bid]') : null;
      if (!n) {
        if (recs[i].type !== 'childList') continue;
        this._dirty = null;
        return;
      }
      this._dirty[n.getAttribute('data-bid')] = 1;
    }
  };

  Editor.prototype.readAll = function () {
    if (this._mo) { try { this.soil(this._mo.takeRecords()); } catch (eM) {} }
    var dirt = this._dirty, i;
    if (dirt) {
      var live = [], bs = this.doc.blocks;
      for (i = 0; i < bs.length; i++) {
        if (dirt[bs[i].id] || LIVE_TY[bs[i].ty] || bs[i].prov) live.push(bs[i].id);
      }
      for (i = 0; i < live.length; i++) {
        var one = this.root.querySelector('[data-bid="' + live[i] + '"]');
        if (one) this.readBlock(one);
      }
    } else {
      var nodes = this.root.querySelectorAll('[data-bid]');
      for (i = 0; i < nodes.length; i++) this.readBlock(nodes[i]);
    }
    if (this._mo) {
      try { this._mo.takeRecords(); } catch (eR) {}
      this._dirty = {};
    }
    return this.doc;
  };

  /*@3.NOEJ.223*/
  Editor.prototype.bidMap = function () {
    var nodes = this.root.querySelectorAll(':scope > [data-bid]');
    var m = {}, i;
    for (i = 0; i < nodes.length; i++) m[nodes[i].getAttribute('data-bid')] = nodes[i];
    return m;
  };

  /*@3.NOEJ.224*/
  Editor.prototype.scroller = function () {
    var n = this.root.parentNode;
    while (n && n.nodeType === 1) {
      if (n.scrollHeight - n.clientHeight > 4) {
        var ov = '';
        try { ov = getComputedStyle(n).overflowY; } catch (e) {}
        if (ov === 'auto' || ov === 'scroll' || ov === 'overlay') return n;
      }
      n = n.parentNode;
    }
    return null;
  };

  /*@3.NOEJ.473*/
  function preText(el) {
    var out = '';
    var walk = function (node) {
      var c, tag, blockish;
      for (c = node.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { out += c.nodeValue; continue; }
        if (c.nodeType !== 1) continue;
        if (c.classList && c.classList.contains('ne-pg')) continue;
        tag = c.nodeName;
        if (tag === 'BR') { out += '\n'; continue; }
        blockish = (tag === 'DIV' || tag === 'P');
        if (blockish && out.length && out.charAt(out.length - 1) !== '\n') out += '\n';
        walk(c);
      }
    };
    walk(el);
    return out;
  }
  /*@3.NOEJ.478*/
  Editor.prototype.readBlockAt = function (node, target) {
    if (!node || !target || !target.closest) return this.readBlock(node);
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit) return;
    var b = hit.b;
    if (b.prov) return this.readBlock(node);
    if (b.ty === 'tbl' && Array.isArray(b.rows)) {
      var td = target.closest('.ne-cell'), tr = td ? td.closest('tr') : null;
      if (!td || !tr || tr.hasAttribute('data-brk') || !node.contains(tr)) return this.readBlock(node);
      var trs = node.querySelectorAll('tr:not([data-brk])'), ri = Array.prototype.indexOf.call(trs, tr);
      var tds = tr.querySelectorAll('.ne-cell'), ci = Array.prototype.indexOf.call(tds, td);
      var row = b.rows[ri];
      if (tr.hasAttribute('data-hollow') || ri < 0 || ci < 0 || !row || row.length !== tds.length || b.rows.length !== trs.length) return this.readBlock(node);
      var cell = row[ci] || (row[ci] = { rt: [] });
      cell.rt = B().readRuns(td);
      return;
    }
    if (LISTY[b.ty] && Array.isArray(b.items)) {
      var li = target.closest('.ne-li');
      if (!li || !node.contains(li)) return this.readBlock(node);
      var lis = node.querySelectorAll('.ne-li'), k = Array.prototype.indexOf.call(lis, li);
      if (k < 0 || b.items.length !== lis.length || !b.items[k]) return this.readBlock(node);
      var it = b.items[k];
      it.rt = B().readRuns(li);
      var lv = parseInt(li.getAttribute('data-lv') || '0', 10);
      if (lv > 0) it.lv = Math.min(5, lv); else delete it.lv;
      if (li.hasAttribute('data-o')) it.o = li.getAttribute('data-o') === '1' ? 1 : 0; else delete it.o;
      return;
    }
    return this.readBlock(node);
  };

  Editor.prototype.readBlock = function (node) {
    if (!node) return;
    if (this._stale && this._stale[node.getAttribute('data-bid')]) return;
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit) return;
    var b = hit.b;
    if (node.__tblFill) node.__tblFill(true);
    if (b.prov && this.blockHolds(b, node)) this.commitProv(b.id);
    if (TEXTY[b.ty]) {
      var t = node.querySelector('.ne-text');
      if (t) b.rt = B().readRuns(t);
      if (b.ty === 'todo') {
        var cb = node.querySelector('.ne-check');
        b.done = cb && cb.getAttribute('aria-checked') === 'true' ? 1 : 0;
      }
    } else if (LISTY[b.ty]) {
      /*@3.NOEJ.83*/
      var lis = node.querySelectorAll('.ne-li');
      b.items = [].map.call(lis, function (li) {
        var lv = parseInt(li.getAttribute('data-lv') || '0', 10);
        var it = { rt: B().readRuns(li) };
        if (lv > 0) it.lv = Math.min(5, lv);
        /*@3.NOEJ.171*/
        if (li.hasAttribute('data-o')) it.o = li.getAttribute('data-o') === '1' ? 1 : 0;
        return it;
      });
      if (!b.items.length) b.items = [{ rt: [] }];
    } else if (b.ty === 'code') {
      var pre = node.querySelector('.ne-code');
      /*@3.NOEJ.470*/
      if (pre && !pre.hasAttribute('data-painted')) b.src = preText(pre);
      var sel = node.querySelector('.ne-lang');
      if (sel) b.lang = sel.value || '';
    } else if (b.ty === 'math') {
      var ta = node.querySelector('.ne-tex');
      if (ta) b.tex = ta.value || '';
    } else if (b.ty === 'tbl') {
      /*@3.NOEJ.218*/
      /*@3.NOEJ.511*/
      if (node.__dirty && this._tfit) delete this._tfit[b.id];
      var trs = node.querySelectorAll('tr:not([data-brk])');
      var oldRowsH = b.rows || [];
      b.rows = [].map.call(trs, function (tr, ri) {
        /*@3.NOEJ.485*/
        if (tr.hasAttribute('data-hollow') && oldRowsH[ri]) return oldRowsH[ri];
        return [].map.call(tr.querySelectorAll('.ne-cell'), function (td) {
          var cell = { rt: B().readRuns(td) };
          var ca = td.getAttribute('data-cal');
          var cvv = td.getAttribute('data-cva');
          if (ca) cell.al = ca;
          if (cvv) cell.va = cvv;
          var cdv = td.getAttribute('data-cdir'), cfv = parseFloat(td.getAttribute('data-cfs')), cff = td.getAttribute('data-cff');
          if (cdv) cell.dir = cdv;
          if (cfv > 0) cell.fs = cfv;
          if (cff) cell.ff = cff;
          return cell;
        });
      });
      b.cols = b.rows[0] ? b.rows[0].length : 2;
    } else if (b.ty === 'img') {
      var inp = node.querySelector('.ne-img-url');
      /*@3.NOEJ.370*/
      if (inp) {
        var typed = B().httpsOnly(inp.value);
        if (typed) { b.url = typed; delete b.loc; }
        else if (!B().localImg(b.url) || String(inp.value || '').trim()) b.url = '';
      }
      var alt = node.querySelector('.ne-img-alt');
      if (alt) b.alt = alt.value || '';
    }
  };

  /*@3.NOEJ.35*/
  /*@3.NOEJ.346*/
  function isDiagram(b) {
    if (!b || b.ty !== 'code') return false;
    var raw = String(b.lang || '').trim();
    if (!raw) return false;
    var C = window.GardenNotesCode;
    if (C && C.isMermaid) return C.isMermaid(raw);
    return /^(mermaid|mmd)$/i.test(raw);
  }

  /*@3.NOEJ.348*/
  function langList() {
    if (document.getElementById('ne-langs')) return;
    var C = window.GardenNotesCode;
    var all = (C && C.languages) ? C.languages() : [];
    if (!all.length) return;
    var dl = document.createElement('datalist');
    dl.id = 'ne-langs';
    all.sort();
    for (var i = 0; i < all.length; i++) {
      var o = document.createElement('option');
      o.value = all[i];
      dl.appendChild(o);
    }
    document.body.appendChild(dl);
  }

  var _mmdMod = null;
  function needMermaid() {
    if (window.GardenNotesMermaid) return Promise.resolve(window.GardenNotesMermaid);
    if (_mmdMod) return _mmdMod;
    _mmdMod = new Promise(function (res) {
      var probe = document.querySelector('script[src*="notes-editor.js"]');
      var src = probe ? (probe.getAttribute('src') || '') : '';
      var tag = document.createElement('script');
      tag.src = src.replace(/notes-editor\.js/, 'notes-mermaid.js');
      tag.onload = function () { res(window.GardenNotesMermaid || null); };
      tag.onerror = function () { res(null); };
      document.head.appendChild(tag);
    });
    return _mmdMod;
  }

  /*@3.NOEJ.205*/
  var _emoMod = null;
  function needEmoji() {
    if (window.GardenNotesEmoji) return Promise.resolve(window.GardenNotesEmoji);
    if (_emoMod) return _emoMod;
    _emoMod = new Promise(function (res) {
      var probe = document.querySelector('script[src*="notes-editor.js"]');
      var src = probe ? (probe.getAttribute('src') || '') : '';
      var base = src.replace(/notes-editor\.js.*$/, '');
      var v = src.split('?')[1] || '';
      var tag = document.createElement('script');
      tag.src = base + 'notes-emoji.js' + (v ? ('?' + v) : '');
      tag.onload = function () { res(window.GardenNotesEmoji || null); };
      tag.onerror = function () { res(null); };
      document.head.appendChild(tag);
    });
    return _emoMod;
  }

  /*@3.NOEJ.206*/
  Editor.prototype.emojiSweep = function () {
    var EM = window.GardenNotesEmoji;
    if (!EM || !this.doc || !this.doc.blocks) return false;
    var hit = false;
    function sweep(rt) {
      if (!Array.isArray(rt)) return;
      for (var i = 0; i < rt.length; i++) {
        var was = rt[i].s;
        if (was == null || was.indexOf(':') < 0) continue;
        var now = EM.replaceIn(was);
        if (now !== was) { rt[i].s = now; hit = true; }
      }
    }
    var bs = this.doc.blocks, i, k, r;
    for (i = 0; i < bs.length; i++) {
      var b = bs[i];
      sweep(b.rt);
      if (b.items) for (k = 0; k < b.items.length; k++) sweep(b.items[k].rt);
      if (b.rows) {
        for (k = 0; k < b.rows.length; k++) {
          for (r = 0; r < b.rows[k].length; r++) sweep(b.rows[k][r].rt);
        }
      }
    }
    if (hit) { this.render(); this.touch(true); }
    return hit;
  };

  /*@3.NOEJ.244*/
  Editor.prototype.render = function () {
    this._ancSeen = {};
    this._csel = null;
    var self = this;
    this.closeMenu();
    this.closeMention();
    /*@3.NOEJ.197*/
    if (DIR_CACHE) DIR_CACHE.delete(this.doc);
    /*@3.NOEJ.15*/
    for (var cid in (this.canvases || {})) {
      try { this.canvases[cid].destroy(); } catch (e) {}
    }
    this.canvases = {};
    /*@3.NOEJ.146*/
    this._sw = 0;
    this.sheetW();
    /*@3.NOEJ.302*/
    this._win = null;
    this._winA = null;
    this._winB = null;
    this._stale = null;
    this.root.innerHTML = '';
    this.applyCardOpts();
    /*@3.NOEJ.252*/
    this._nat = null;
    this._natIdx = null;
    this._engStale = true;
    var rng = null;
    var natOkR = false, coldR = false;
    this._cold = null;
    if (this.natLoad()) {
      this._engStale = false; natOkR = true;
      if (this.winOk()) rng = this.winPin(this.winRange());
    } else if (this.coldSeed()) {
      this._engStale = false; coldR = true;
      rng = this.winPin(this.winRange());
    } else if (this.doc.eng) {
      this.settled();
    }
    var frag = document.createDocumentFragment();
    if (!rng) this.doc.blocks.forEach(function (b) { frag.appendChild(self.renderBlock(b)); });
    frag.appendChild(this.renderTail());
    this.root.appendChild(frag);
    codeFlush();
    this.tblFitAll();
    this.dgmFitAll();
    if (rng) { this.winBind(); this.winSet(rng[0], rng[1]); this.freeSync(); }
    /*@3.NOEJ.254*/
    this.roLater();
    this.paintBlockSel();
    this.layoutFree();
    this.applyReadOnly();
    this.reAct();
    if (this.opts.onLayout) this.opts.onLayout();
    if (natOkR && this.opts.onEng) { try { this.opts.onEng(); } catch (eE2) {} }
    if (coldR) {
      if (this.opts.onGeom) { try { this.opts.onGeom(); } catch (eG2) {} }
      this.coldRun();
    }
  };

  /*@3.NOEJ.147*/
  Editor.prototype.renderInsert = function (at, blocks) {
    var self = this;
    this._sw = 0;
    this.sheetW();
    var frag = document.createDocumentFragment();
    for (var i = 0; i < blocks.length; i++) frag.appendChild(this.renderBlock(blocks[i]));
    var next = this.doc.blocks[at + blocks.length];
    var anchor = next
      ? this.root.querySelector(':scope > [data-bid="' + next.id + '"]')
      : (this._winB && this._winB.parentNode === this.root
         ? this._winB : this.root.querySelector(':scope > .ne-tail'));
    /*@3.NOEJ.301*/
    if (!anchor && this._win) {
      var ids0 = [];
      for (var w = 0; w < blocks.length; w++) ids0.push(blocks[w].id);
      if (!this.natSplice(at, 0, ids0)) { this._nat = null; this._engStale = true; this.settled(); }
      else this.reflowEng();
      this.winApply(true);
      return;
    }
    if (!anchor) { this.render(); return; }
    var fresh = [].slice.call(frag.children);
    this.root.insertBefore(frag, anchor);
    var ids = [];
    for (i = 0; i < blocks.length; i++) ids.push(blocks[i].id);
    if (!this.natSplice(at, 0, ids)) { this._nat = null; this._engStale = true; this.settled(); }
    for (i = 0; i < fresh.length; i++) this.roAdd(fresh[i]);
    codeFlush();
    /*@3.NOEJ.268*/
    if (this.natSync(fresh) && this.natOk()) this.reflowEng();
    else this.applyEng();
    this.applyReadOnly();
    if (this.opts.onLayout) this.opts.onLayout();
  };

  /*@3.NOEJ.231*/
/*@3.NOEJ.377*/
  Editor.prototype.closeShapePop = function () {
    if (this._shPop && this._shPop.parentNode) this._shPop.parentNode.removeChild(this._shPop);
    this._shPop = null;
    if (this._shOut) { document.removeEventListener('pointerdown', this._shOut, true); this._shOut = null; }
  };

  Editor.prototype.shapePop = function (btn, id, kind) {
    var self = this, B0 = B();
    var had = this._shPop && this._shPop.getAttribute('data-kind') === kind;
    this.closeShapePop();
    if (had) return null;
    var hit = this.blockAt(id);
    if (!hit || hit.b.ty !== 'shape') return null;
    var b = hit.b, ar = isAr();
    var pop = document.createElement('div');
    pop.className = 'ne-shp-pop';
    pop.setAttribute('data-kind', kind);
    pop.setAttribute('contenteditable', 'false');
    pop.setAttribute('dir', ar ? 'rtl' : 'ltr');
    var h = '';
    if (kind === 'sh') {
      h = B0.SHAPES.map(function (s) {
        var nm = B0.shapeName(s, ar);
        return '<button type="button" class="ne-shp-o" data-shv="' + s + '"' +
          ' aria-pressed="' + (b.sh === s ? 'true' : 'false') + '"' +
          ' aria-label="' + B0.esc(nm) + '" title="' + B0.esc(nm) + '">' +
          B0.shapeSvg({ sh: s, fill: 0 }, { stroke: 1.7 }) + '</button>';
      }).join('');
    } else {
      h = B0.SHAPE_TONES.map(function (t) {
        return '<button type="button" class="ne-shp-o ne-shp-c" data-tnv="' + t + '"' +
          ' data-tone="' + t + '"' +
          ' aria-pressed="' + (b.tone === t ? 'true' : 'false') + '"' +
          ' aria-label="' + B0.esc(t) + '" title="' + B0.esc(t) + '"></button>';
      }).join('');
    }
    pop.innerHTML = h;
    /*@3.NOEJ.383*/
    /*@3.NOEJ.387*/
    pop.style.position = 'fixed';
    pop.style.left = '0px'; pop.style.insetBlockStart = '0px';
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect();
    var pr = pop.getBoundingClientRect();
    var ph = pr.height || 90, pw = pr.width || 220;
    var top = r.bottom + 6;
    if (top + ph > innerHeight - 8) top = Math.max(8, r.top - 6 - ph);
    pop.style.position = 'fixed';
    pop.style.insetBlockStart = Math.round(Math.max(8, Math.min(innerHeight - ph - 8, top))) + 'px';
    pop.style.left = Math.round(Math.max(8, Math.min(innerWidth - pw - 8,
      r.left + r.width / 2 - pw / 2))) + 'px';
    pop.addEventListener('click', function (e) {
      var o = e.target.closest('[data-shv],[data-tnv]');
      if (!o) return;
      var hit2 = self.blockAt(id);
      if (!hit2) { self.closeShapePop(); return; }
      var before = self.snapshot();
      if (o.hasAttribute('data-shv')) hit2.b.sh = o.getAttribute('data-shv');
      else hit2.b.tone = o.getAttribute('data-tnv');
      self.pushUndo(before);
      self.closeShapePop();
      self.renderOne(id);
      self.touch();
    });
    this._shPop = pop;
    this._shOut = function (e) { if (pop && !pop.contains(e.target) && e.target !== btn) self.closeShapePop(); };
    setTimeout(function () { document.addEventListener('pointerdown', self._shOut, true); }, 0);
    return pop;
  };

  /*@3.NOEJ.453*/
  Editor.prototype.parkOrphans = function () {
    if (!this.root || this._win) return 0;
    var bs = this.doc.blocks, live = {}, i, n = 0;
    for (i = 0; i < bs.length; i++) live[bs[i].id] = 1;
    var kids = this.root.querySelectorAll(':scope > [data-bid]');
    for (i = 0; i < kids.length; i++) {
      if (live[kids[i].getAttribute('data-bid')]) continue;
      if (kids[i].getAttribute('data-ty') !== 'pb') continue;
      if (!kids[i].hidden) { kids[i].hidden = true; n++; }
    }
    this._nat = null; this._natIdx = null; this._engStale = true;
    return n;
  };
  /*@3.NOEJ.461*/
  Editor.prototype.sigOf = function (b) {
    if (b && b.ty === 'pb') return 'pb:' + b.id + ':' + (b.auto ? 1 : 0);
    return JSON.stringify(b);
  };
  Editor.prototype.blockSigs = function () {
    var o = {}, i, b;
    for (i = 0; i < this.doc.blocks.length; i++) { b = this.doc.blocks[i]; if (b) o[b.id] = this.sigOf(b); }
    return o;
  };
  /*@3.NOEJ.450*/
  Editor.prototype.syncBlocks = function (sigs) {
    if (!this.root || this._win) { this.render(); return null; }
    var bs = this.doc.blocks, root = this.root, i, node;
    var map = this.bidMap(), live = {}, out = {}, made = 0, gone = 0, redone = 0, reused = 0;
    for (i = 0; i < bs.length; i++) live[bs[i].id] = 1;
    var kids = [].slice.call(root.querySelectorAll(':scope > [data-bid]'));
    /*@3.NOEJ.452*/
    var pool = {}, nx;
    for (i = 0; i < kids.length; i++) {
      var bid = kids[i].getAttribute('data-bid');
      if (live[bid]) continue;
      if (kids[i].getAttribute('data-ty') === 'pb') {
        nx = kids[i].nextElementSibling;
        while (nx && nx.hasAttribute('data-bid') && !live[nx.getAttribute('data-bid')]) nx = nx.nextElementSibling;
        var key = (nx && nx.hasAttribute('data-bid')) ? nx.getAttribute('data-bid') : '$tail';
        if (!pool[key]) { pool[key] = kids[i]; delete map[bid]; continue; }
      }
      this.dropCanvas(bid);
      this.roDrop(kids[i]);
      kids[i].parentNode.removeChild(kids[i]);
      delete map[bid];
      gone++;
    }
    this._sw = 0;
    this.sheetW();
    var tail = root.querySelector(':scope > .ne-tail');
    var cursor = root.firstChild;
    for (i = 0; i < bs.length; i++) {
      var b = bs[i], sig = this.sigOf(b);
      out[b.id] = sig;
      node = map[b.id];
      if (node && ((sigs && sigs[b.id] !== sig) || (this._stale && this._stale[b.id]))) {
        /*@3.NOEJ.454*/
        var pruned = false;
        if (b.ty === 'tbl' && Array.isArray(b.rows) && b.rows.length) {
          try {
            var oldB = JSON.parse(sigs[b.id]);
            var oldRows = (oldB && Array.isArray(oldB.rows)) ? oldB.rows : null;
            if (oldRows && oldRows.length > b.rows.length && JSON.stringify(oldRows.slice(0, b.rows.length)) === JSON.stringify(b.rows)) {
              var trs = node.querySelectorAll('table.ne-tbl tr'), tq;
              if (trs.length === oldRows.length) {
                for (tq = trs.length - 1; tq >= b.rows.length; tq--) trs[tq].parentNode.removeChild(trs[tq]);
                pruned = true;
              }
            }
          } catch (ePr) { pruned = false; }
        }
        if (!pruned) {
          this.dropCanvas(b.id);
          var fresh = this.renderBlock(b);
          this.roDrop(node);
          root.replaceChild(fresh, node);
          node = fresh; map[b.id] = fresh;
          this.roAdd(fresh);
        }
        redone++;
      } else if (!node) {
        var re = null;
        if (b.ty === 'pb') {
          var nk = '$tail', q2;
          for (q2 = i + 1; q2 < bs.length; q2++) { if (bs[q2] && !bs[q2].fp) { nk = bs[q2].id; break; } }
          re = pool[nk] || null;
          if (re && re.parentNode === root) {
            delete pool[nk];
            re.setAttribute('data-bid', b.id);
            re.hidden = false;
            var pbx = re.querySelector('.ne-pb');
            if (pbx) pbx.style.blockSize = Math.max(0.01, Number(b.h) || 0) + 'px';
            re.style.marginBlockStart = (Number(b.h) < 0) ? (Number(b.h) + 'px') : '';
            re.__bd = 0;
            node = re; map[b.id] = re; reused++;
          } else re = null;
        }
        if (!re) {
          node = this.renderBlock(b);
          root.insertBefore(node, cursor && cursor !== tail ? cursor : (tail || null));
          map[b.id] = node;
          this.roAdd(node);
          made++;
        } else if (node !== cursor) {
          root.insertBefore(node, cursor && cursor !== tail ? cursor : (tail || null));
        }
      } else if (node !== cursor) {
        root.insertBefore(node, cursor && cursor !== tail ? cursor : (tail || null));
      }
      cursor = node.nextSibling;
    }
    this._stale = null;
    for (var pk in pool) {
      if (!Object.prototype.hasOwnProperty.call(pool, pk) || !pool[pk].parentNode) continue;
      this.roDrop(pool[pk]);
      pool[pk].parentNode.removeChild(pool[pk]);
      gone++;
    }
    this._nat = null;
    this._natIdx = null;
    this._engStale = true;
    this.paintBlockSel();
    this.layoutFree();
    this.applyReadOnly();
    this.reAct();
    if (this.opts.onLayout) this.opts.onLayout();
    return { sigs: out, made: made, gone: gone, redone: redone, reused: reused };
  };

  Editor.prototype.renderOne = function (id) {
    var hit = this.blockAt(id);
    if (!hit) { this.render(); return false; }
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    /*@3.NOEJ.291*/
    if (!node && this._win) return true;
    if (!node) { this.render(); return false; }
    this.dropCanvas(id);
    this._sw = 0;
    this.sheetW();
    var fresh = this.renderBlock(hit.b);
    if (!node.isConnected) { this.render(); return true; }
    this.roDrop(node);
    /*@3.NOEJ.408*/
    try { this.root.replaceChild(fresh, node); }
    catch (eR) { this.render(); return true; }
    this.roAdd(fresh);
    /*@3.NOEJ.269*/
    if (this.natSync([fresh]) && this.natOk()) this.reflowEng();
    else this.applyEng();
    this.applyReadOnly();
    this.paintBlockSel();
    if (this._csel && this._csel.bid === id) this._csel = null;
    this.reAct();
    if (hit.b.fp) this.layoutFree();
    if (this.opts.onLayout) this.opts.onLayout();
    return true;
  };

  /*@3.NOEJ.232*/
  Editor.prototype.renderDrop = function (id) {
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    /*@3.NOEJ.292*/
    if (!node && this._win) {
      var ixW = this.natIdx();
      var atW = ixW ? ixW[id] : null;
      if (atW != null && this.natSplice(atW, 1, [])) { this.reflowEng(); this.winApply(true); return true; }
      this._nat = null; this._engStale = true; this.settled();
      return true;
    }
    if (!node) { this.render(); return false; }
    this.dropCanvas(id);
    this.roDrop(node);
    node.parentNode.removeChild(node);
    var ix = this.natIdx();
    var at = ix ? ix[id] : null;
    if (at != null && this.natSplice(at, 1, [])) {
      if (this.reflowEng()) return true;
    } else { this._nat = null; this._engStale = true; this.settled(); }
    this.applyEng();
    if (this.opts.onLayout) this.opts.onLayout();
    return true;
  };

  Editor.prototype.dropCanvas = function (id) {
    if (!this.canvases || !this.canvases[id]) return;
    try { this.canvases[id].destroy(); } catch (e) {}
    delete this.canvases[id];
  };

  /*@3.NOEJ.8*/
  Editor.prototype.renderTail = function () {
    var tail = el('button', 'ne-tail', {
      type: 'button',
      'aria-label': L('أضف كتلة في النهاية', 'Add a block at the end')
    });
    tail.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i><span>' +
      B().esc(L('أضف كتلة', 'Add block')) + '</span>';
    return tail;
  };

  /*@3.NOEJ.19*/
  /*@3.NOEJ.29*/
  function appDir() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar' ? 'rtl' : 'ltr'; }
    catch (e) { return 'rtl'; }
  }
  /*@3.NOEJ.153*/
  var DIR_CACHE = typeof WeakMap === 'function' ? new WeakMap() : null;
  function firstStrong(s, out) {
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if ((c >= 0x0590 && c <= 0x08FF) || (c >= 0xFB1D && c <= 0xFDFD) ||
          (c >= 0xFE70 && c <= 0xFEFC)) { out.d = 'rtl'; return true; }
      if ((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)) { out.d = 'ltr'; return true; }
    }
    return false;
  }
  /*@3.NOEJ.497*/
  var DIR_CAP = 400;
  function tallyDir(s, out) {
    for (var i = 0; i < s.length && out.n < DIR_CAP; i++) {
      var c = s.charCodeAt(i);
      if ((c >= 0x0590 && c <= 0x08FF) || (c >= 0xFB1D && c <= 0xFDFD) ||
          (c >= 0xFE70 && c <= 0xFEFC)) { out.r++; out.n++; }
      else if ((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)) { out.l++; out.n++; }
    }
  }
  function tallyDone(out) {
    if (out.n >= DIR_CAP) { out.d = (out.r >= out.l * 2) ? 'rtl' : ((out.l >= out.r * 2) ? 'ltr' : ''); return true; }
    return false;
  }
  function scanRt(rt, out) {
    if (!Array.isArray(rt)) return false;
    for (var i = 0; i < rt.length; i++) {
      if (rt[i] && typeof rt[i].s === 'string') {
        /*@3.NOEJ.568*/
        if (rt[i].mth) { out.m = 1; continue; }
        tallyDir(rt[i].s, out); if (tallyDone(out)) return true;
      }
    }
    return false;
  }
  /*@3.NOEJ.183*/
  function blockContentDir(b) {
    if (!b || b.ty === 'code' || b.ty === 'math') return '';
    var out = { d: '', r: 0, l: 0, n: 0 }, j, k, hit = false;
    hit = scanRt(b.rt, out);
    if (!hit && Array.isArray(b.items)) {
      for (j = 0; j < b.items.length && !hit; j++) hit = scanRt(b.items[j] && b.items[j].rt, out);
    }
    if (!hit && Array.isArray(b.rows)) {
      for (j = 0; j < b.rows.length && !hit; j++) {
        var row = b.rows[j] || [];
        for (k = 0; k < row.length && !hit; k++) hit = scanRt(row[k] && row[k].rt, out);
      }
    }
    /*@3.NOEJ.613*/
    if (!hit) out.d = !out.n ? (out.m ? 'ltr' : '') : (out.r >= out.l * 2) ? 'rtl' : ((out.l >= out.r * 2) ? 'ltr' : '');
    return out.d;
  }

  /*@3.NOEJ.180*/
  function contentDir(d) {
    if (!d) return '';
    /*@3.NOEJ.184*/
    if (DIR_CACHE && DIR_CACHE.has(d)) return DIR_CACHE.get(d);
    var bs = d.blocks || [], dir = '';
    for (var i = 0; i < bs.length && !dir; i++) dir = blockContentDir(bs[i]);
    if (DIR_CACHE && dir) DIR_CACHE.set(d, dir);
    return dir;
  }

  function docDir(d) {
    if (!d) return appDir();
    if (d.bd === 'rtl' || d.bd === 'ltr') return d.bd;
    return contentDir(d) || appDir();
  }
  /*@3.NOEJ.242*/
  function blockDir(b, d) {
    if (b.ty === 'code') return 'ltr';
    if (b.dir === 'rtl' || b.dir === 'ltr') return b.dir;
    return blockContentDir(b) || docDir(d);
  }

  Editor.prototype.applyStyleAttrs = function (wrap, b) {
    var bd = wrap.querySelector(':scope > .ne-body');
    if (bd) bd.setAttribute('dir', blockDir(b, this.doc));
    if (b.dir && b.dir !== 'auto') wrap.setAttribute('data-dir', b.dir);
    else wrap.removeAttribute('data-dir');
    if (b.al && b.al !== 'start') wrap.setAttribute('data-al', b.al);
    else wrap.removeAttribute('data-al');
    /*@3.NOEJ.406*/
    var cardId = b.card ? String(b.card).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) : '';
    if (cardId && !b.fp) {
      wrap.setAttribute('data-card', cardId);
      if (b.cardStart) wrap.setAttribute('data-card-start', '1'); else wrap.removeAttribute('data-card-start');
      if (b.cardEnd) wrap.setAttribute('data-card-end', '1'); else wrap.removeAttribute('data-card-end');
      if (b.cardTitle) wrap.setAttribute('data-card-title', '1'); else wrap.removeAttribute('data-card-title');
      /*@3.NOEJ.414*/
      var cTone = this.cardToneFor(b, cardId);
      if (cTone === 'auto') wrap.removeAttribute('data-card-tone');
      else wrap.setAttribute('data-card-tone', cTone);
      wrap.setAttribute('data-card-alt', String(this.cardAlt(cardId)));
      var cLay = this.cardLayoutOf(b, cardId);
      if (cLay) wrap.setAttribute('data-card-layout', cLay); else wrap.removeAttribute('data-card-layout');
    } else {
      wrap.removeAttribute('data-card'); wrap.removeAttribute('data-card-start');
      wrap.removeAttribute('data-card-end'); wrap.removeAttribute('data-card-title');
      wrap.removeAttribute('data-card-tone'); wrap.removeAttribute('data-card-alt');
      wrap.removeAttribute('data-card-layout');
    }
    if (b.ty === 'h' && b.pg > 0) wrap.setAttribute('data-pg', String(b.pg | 0)); else wrap.removeAttribute('data-pg');
    /*@3.NOEJ.540*/
    var fmt = (b.fmt && FMTS[b.fmt]) ? b.fmt : '';
    if (fmt) wrap.setAttribute('data-fmt', fmt); else wrap.removeAttribute('data-fmt');
    if (fmt === 'ans' && !(this._unfold && this._unfold[b.id])) wrap.setAttribute('data-fold', '1');
    else wrap.removeAttribute('data-fold');
    if (b.fs) {
      wrap.setAttribute('data-fs', String(b.fs));
      wrap.style.setProperty('--ne-fs', b.fs + 'px');
    } else {
      wrap.removeAttribute('data-fs');
      wrap.style.removeProperty('--ne-fs');
    }
    if (b.ff) {
      wrap.setAttribute('data-ff', b.ff);
      var css = fontCss(b.ff);
      if (css) wrap.style.setProperty('--ne-ff', '"' + css + '"');
      if (window.GardenTint && GardenTint.fontSheet) { try { GardenTint.fontSheet(); } catch (e) {} }
      /*@3.NOEJ.63*/
      if (css && document.fonts && document.fonts.load) {
        try { document.fonts.load('400 16px "' + css + '"', 'أبجد Abc'); } catch (e) {}
        try { document.fonts.load('700 16px "' + css + '"', 'أبجد Abc'); } catch (e) {}
      }
    } else {
      wrap.removeAttribute('data-ff');
      wrap.style.removeProperty('--ne-ff');
    }
    if (b.ty === 'tbl') wrap.setAttribute('data-tst', b.st || 'head');
    this.applyFree(wrap, b);
    /*@3.NOEJ.38*/
    if (b.ty === 'tbl') {
      if (b.tc) {
        wrap.setAttribute('data-tc', '1');
        wrap.style.setProperty('--ne-tc', toneHex(b.tc));
      } else {
        wrap.removeAttribute('data-tc');
        wrap.style.removeProperty('--ne-tc');
      }
    }
    if (b.hlb) {
      wrap.setAttribute('data-hlb', '1');
      wrap.style.setProperty('--ne-hlb', toneHex(b.hlb));
    } else {
      wrap.removeAttribute('data-hlb');
      wrap.style.removeProperty('--ne-hlb');
    }
  };

  function toneHex(t) {
    if (typeof t === 'string' && t.charAt(0) === '#') {
      return (window.GardenCanvas && GardenCanvas.hexOf) ? GardenCanvas.hexOf(t) : t;
    }
    return (window.GardenCanvas && GardenCanvas.hexOf) ? GardenCanvas.hexOf(t) : '#888';
  }

  function fontCss(id) { return B().fontCss ? B().fontCss(id) : null; }

  var BULLETS = ['\u2022', '\u25E6', '\u25AA'];

  var AR_ABJAD = ('\u0623\u0628\u062C\u062F\u0647\u0648\u0632\u062D\u0637\u064A' +
                  '\u0643\u0644\u0645\u0646\u0633\u0639\u0641\u0635\u0642\u0631' +
                  '\u0634\u062A\u062B\u062E\u0630\u0636\u0638\u063A').split('');

  function alphaMark(n, ar) {
    if (ar) return AR_ABJAD[(Math.max(1, n) - 1) % AR_ABJAD.length];
    var s = '', k = Math.max(1, n);
    while (k > 0) { k--; s = String.fromCharCode(97 + (k % 26)) + s; k = Math.floor(k / 26); }
    return s;
  }

  var ROMAN = [[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];

  function romanMark(n) {
    var k = Math.max(1, Math.min(399, n)), s = '', i, guard = 0;
    while (k > 0 && guard++ < 40) {
      for (i = 0; i < ROMAN.length; i++) {
        if (k >= ROMAN[i][0]) { s += ROMAN[i][1]; k -= ROMAN[i][0]; break; }
      }
    }
    return s;
  }

  var OL_SEQ = {
    num:   ['num', 'alpha', 'roman'],
    arnum: ['arnum', 'alpha', 'num'],
    abjad: ['abjad', 'num', 'roman'],
    roman: ['roman', 'num', 'alpha']
  };

  var AR_DIGITS = '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669';

  function arNum(n) {
    return String(n).replace(/[0-9]/g, function (d) { return AR_DIGITS[+d]; });
  }

  var UL_SETS = {
    dot:     ['\u2022', '\u25E6', '\u25AA'],
    dash:    ['\u2013', '\u2013', '\u2013'],
    diamond: ['\u25C6', '\u25C7', '\u25B8']
  };

  /*@3.NOEJ.121*/
  function olMark(n, lv, ar, ls) {
    var seq = OL_SEQ[ls] || OL_SEQ.num;
    var kind = seq[lv % 3], g;
    if (kind === 'num') g = String(n);
    else if (kind === 'arnum') g = arNum(n);
    else if (kind === 'abjad') g = alphaMark(n, true);
    else if (kind === 'alpha') g = alphaMark(n, ar);
    else g = romanMark(n);
    /*@3.NOEJ.134*/
    var tail = (lv >= 3) ? ')' : '.';
    return g + tail;
  }

  function markIsAr(b, dc) {
    var d = blockDir(b, dc);
    if (d === 'rtl') return true;
    if (d === 'ltr') return false;
    return isAr();
  }

  Editor.prototype.renderBlock = function (b) {
    var self = this;
    var dd = this.doc;
    var wrap = el('div', 'ne-b ne-b-' + b.ty, { 'data-bid': b.id, 'data-ty': b.ty });
    /*@3.NOEJ.198*/
    var anc = (b.anc || b.ty === 'h') ? B().anchorOf(b) : '';
    if (anc) {
      if (!this._ancSeen) this._ancSeen = {};
      if (!this._ancSeen[anc]) { this._ancSeen[anc] = 1; wrap.id = anc; }
    }
    this.applyStyleAttrs(wrap, b);


    var body = el('div', 'ne-body');
    /*@3.NOEJ.30*/
    body.setAttribute('dir', blockDir(b, dd));
    wrap.appendChild(body);

    if (TEXTY[b.ty]) {
      if (b.ty === 'callout') {
        var ck = calKind(b);
        wrap.setAttribute('data-cal', ck);
        var chd = el('button', 'ne-cal-h', { type: 'button', contenteditable: 'false',
                                             'data-calh': '1' });
        paintCalHead(chd, ck, b);
        body.appendChild(chd);
        if (b.rt && b.rt.length && b.rt[0] && b.rt[0].cl) b.rt = b.rt.slice(1);
      }
      /*@3.NOEJ.367*/
      if (b.ty === 'sticky') {
        wrap.setAttribute('data-tone', b.tone || 'amber');
        wrap.style.setProperty('--ne-stk-rot', ((b.rot || 0) | 0) + 'deg');
        var sbar = el('div', 'ne-stk-bar', { contenteditable: 'false' });
        STICKY_TONES.forEach(function (t) {
          var tb = el('button', 'ne-stk-t', {
            type: 'button', 'data-stk': t.k, 'data-tone': t.k,
            'aria-pressed': (b.tone || 'amber') === t.k ? 'true' : 'false',
            'aria-label': L(t.ar, t.en), title: L(t.ar, t.en)
          });
          sbar.appendChild(tb);
        });
        [['rot-', 'fa-rotate-left', 'أَمِلْ يساراً', 'Tilt left'],
         ['rot+', 'fa-rotate-right', 'أَمِلْ يميناً', 'Tilt right']].forEach(function (r) {
          var rb = el('button', 'ne-stk-r', {
            type: 'button', 'data-stk': r[0],
            'aria-label': L(r[2], r[3]), title: L(r[2], r[3])
          });
          rb.innerHTML = '<i class="fa-solid ' + r[1] + '" aria-hidden="true"></i>';
          sbar.appendChild(rb);
        });
        body.appendChild(sbar);
      }
      /*@3.NOEJ.379*/
      if (b.ty === 'shape') {
        var B0 = B();
        wrap.setAttribute('data-tone', b.tone || 'ink');
        wrap.setAttribute('data-sh', b.sh || 'rect');
        if (b.sh === 'sticky') wrap.setAttribute('data-th', b.th || 'tape'); else wrap.removeAttribute('data-th');
        /*@3.NOEJ.391*/
        if (b.sk) wrap.setAttribute('data-sk', b.sk); else wrap.removeAttribute('data-sk');
        wrap.style.setProperty('--ne-shp-rot', ((b.rot || 0) | 0) + 'deg');
        wrap.style.setProperty('--ne-shp-ar', ((b.ar || 100) / 100).toFixed(3));
        /*@3.NOEJ.386*/
        wrap.style.setProperty('--ne-shp-fx', b.fx ? '-1' : '1');
        wrap.style.setProperty('--ne-shp-fy', b.fy ? '-1' : '1');
        /*@3.NOEJ.384*/
        wrap.setAttribute('data-fill', b.fill ? '1' : '0');
        var shp = el('div', 'ne-shp-lay', { contenteditable: 'false', 'aria-hidden': 'true' });
        shp.innerHTML = B0.shapeSvg(b);
        body.appendChild(shp);
        /*@3.NOEJ.392*/
        void 0;
      }
      if (b.ty === 'todo') {
        var cb = el('button', 'ne-check', {
          type: 'button', role: 'checkbox',
          'aria-checked': b.done ? 'true' : 'false',
          'aria-label': L('تم', 'Done')
        });
        cb.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
        body.appendChild(cb);
      }
      /*@3.NOEJ.3*/
      var tag = b.ty === 'h' ? ('h' + (b.lv || 2)) : 'div';
      var t = el(tag, 'ne-text', {
        contenteditable: 'true', dir: blockDir(b, dd),
        spellcheck: 'false', 'data-ph': placeholderFor(b)
      });
      t.innerHTML = B().runsToHtmlBidi(b.rt);
      if (b.ty === 'h' && b.pg > 0) {
        var pgB = el('span', 'ne-pgb', { contenteditable: 'false', 'aria-label': L('صفحة ', 'Page ') + (b.pg | 0) });
        pgB.innerHTML = '<i class="fa-solid fa-file-lines" aria-hidden="true"></i><bdi>' + (b.pg | 0) + '</bdi>';
        body.appendChild(pgB);
      }
      body.appendChild(t);

    } else if (LISTY[b.ty]) {
      /*@3.NOEJ.81*/
      var isDl = (b.ty === 'dl');
      var list = el(isDl ? 'dl' : (b.ty === 'ul' ? 'ul' : 'ol'),
                    isDl ? 'ne-list ne-dl' : 'ne-list');
      if (b.lsb) list.setAttribute('data-lsb', '1');
      var run = [];
      var arL = markIsAr(b, dd);
      (b.items || []).forEach(function (it) {
        var lv = Math.max(0, Math.min(5, it.lv || 0));
        var li = el(isDl ? (lv ? 'dd' : 'dt') : 'li',
          isDl ? ('ne-li ' + (lv ? 'ne-dd' : 'ne-dt')) : 'ne-li',
          { contenteditable: 'true', dir: blockDir(b, dd),
            spellcheck: 'false', 'data-lv': String(lv) });
        /*@3.NOEJ.170*/
        if (it.o != null) li.setAttribute('data-o', it.o ? '1' : '0');
        li.innerHTML = B().runsToHtmlBidi(it.rt);
        /*@3.NOEJ.109*/
        var blank = B().runsToText(it.rt || []) === '';
        /*@3.NOEJ.169*/
        var ord = (it.o != null) ? !!it.o : (b.ty === 'ol');
        if (isDl) {
          li.removeAttribute('data-n');
        } else if (ord) {
          var n = (run[lv] || (lv ? 0 : (b.start || 1) - 1)) + 1;
          if (!blank) {
            run[lv] = n;
            for (var d = lv + 1; d < run.length; d++) run[d] = 0;
          }
          var mk = olMark(n, lv, arL, b.ls);
          li.setAttribute('data-n', mk);
          if (!lv) li.setAttribute('data-seq', String(n));
        } else {
          var bset = UL_SETS[b.ls] || UL_SETS.dot;
          li.setAttribute('data-n', bset[lv % bset.length]);
        }
        if (blank) li.setAttribute('data-blank', '1');
        list.appendChild(li);
      });
      body.appendChild(list);

    } else if (b.ty === 'code') {
      var bar = el('div', 'ne-code-bar');
      langList();
      var lang = el('input', 'ne-lang', {
        type: 'text', value: b.lang || '', placeholder: L('اللغة', 'Language'),
        'aria-label': L('لغة الكود', 'Code language'), dir: 'ltr', spellcheck: 'false',
        list: 'ne-langs'
      });
      bar.appendChild(lang);
      body.appendChild(bar);
      var pre = el('pre', 'ne-code', {
        contenteditable: 'true', dir: 'ltr', spellcheck: 'false',
        'data-ph': L('اكتب الكود…', 'Type code…')
      });
      pre.textContent = b.src || '';
      body.appendChild(pre);
      paintCode(pre, b, this.root);
      /*@3.NOEJ.207*/
      if (isDiagram(b)) {
        /*@3.NOEJ.228*/
        var dOn = (b.dgm == null) ? true : !!b.dgm;
        var dBtn = el('button', 'ne-mini ne-dgm-t', {
          type: 'button', 'data-dgm': '1',
          'aria-pressed': dOn ? 'true' : 'false',
          'aria-label': L('اعرضِ المخطّط', 'Show diagram')
        });
        dBtn.innerHTML = '<i class="fa-solid fa-diagram-project" aria-hidden="true"></i>' +
          '<span>' + B().esc(L('مخطّط', 'Diagram')) + '</span>';
        bar.appendChild(dBtn);
        var dHost = el('div', 'ne-dgm', { dir: 'ltr' });
        dHost.hidden = !dOn;
        /*@3.NOEJ.438*/
        if (dOn && b.dh > 0) dHost.style.minBlockSize = Math.round(b.dh) + 'px';
        body.appendChild(dHost);
        /*@3.NOEJ.474*/
        var dTools = el('div', 'ne-dgm-tools', { role: 'group', 'aria-label': L('أدواتُ المخطّط', 'Diagram tools') });
        dTools.innerHTML =
          '<button type="button" class="ne-mini ne-dgm-tb" data-dgz="-" aria-label="' + B().esc(L('تصغير', 'Zoom out')) + '" title="' + B().esc(L('تصغير', 'Zoom out')) + '"><i class="fa-solid fa-magnifying-glass-minus" aria-hidden="true"></i></button>' +
          '<button type="button" class="ne-mini ne-dgm-tb" data-dgz="+" aria-label="' + B().esc(L('تكبير', 'Zoom in')) + '" title="' + B().esc(L('تكبير', 'Zoom in')) + '"><i class="fa-solid fa-magnifying-glass-plus" aria-hidden="true"></i></button>' +
          '<button type="button" class="ne-mini ne-dgm-tb" data-dgz="fit" aria-label="' + B().esc(L('الحجمُ المناسب', 'Fit')) + '" title="' + B().esc(L('الحجمُ المناسب', 'Fit')) + '"><i class="fa-solid fa-down-left-and-up-right-to-center" aria-hidden="true"></i></button>' +
          '<button type="button" class="ne-mini ne-dgm-tb" data-dgmfs="1" aria-label="' + B().esc(L('ملءُ الشاشة', 'Full screen')) + '" title="' + B().esc(L('ملءُ الشاشة', 'Full screen')) + '"><i class="fa-solid fa-expand" aria-hidden="true"></i></button>';
        dTools.hidden = !dOn;
        body.appendChild(dTools);
        pre.hidden = dOn;
        var dgmDone = function () {
          var sv = dHost.querySelector('svg');
          var grew = false;
          if (sv) {
            /*@3.NOEJ.437*/
            if (!self._dgmSvg) self._dgmSvg = {};
            self._dgmSvg[b.id] = { src: String(b.src || ''), html: dHost.innerHTML };
            var zD = self.zoomOf() || 1;
            var hD = Math.round(dHost.getBoundingClientRect().height / zD);
            if (hD > 0 && Math.abs((b.dh || 0) - hD) >= 1) { b.dh = hD; grew = true; try { self.markLazy(); } catch (eH) {} }
            dHost.style.minBlockSize = '';
            if (self.dgmFitAll()) grew = true;
          }
          /*@3.NOEJ.447*/
          if (grew || !sv) self.settled();
        };
        var cached = (dOn && self._dgmSvg && self._dgmSvg[b.id] && self._dgmSvg[b.id].src === String(b.src || '')) ? self._dgmSvg[b.id].html : null;
        if (cached) { dHost.setAttribute('data-state', 'ok'); dHost.innerHTML = cached; dHost.style.minBlockSize = ''; }
        else if (dOn) {
          /*@3.NOEJ.462*/
          dHost.__dgm = function () {
            if (dHost.__dgmOn) return dHost.__dgmOn;
            var hit = self._dgmSvg && self._dgmSvg[b.id];
            if (hit && hit.src === String(b.src || '') && hit.html) {
              dHost.setAttribute('data-state', 'ok'); dHost.innerHTML = hit.html;
              dHost.__dgmOn = Promise.resolve(true).then(dgmDone, dgmDone);
              return dHost.__dgmOn;
            }
            dHost.__dgmOn = self.dgmPrecache([b]).then(function () {
              var c = self._dgmSvg && self._dgmSvg[b.id];
              if (c && c.src === String(b.src || '') && c.html) { dHost.setAttribute('data-state', 'ok'); dHost.innerHTML = c.html; return true; }
              return needMermaid().then(function (M) { if (!M) return; return M.render(dHost, b.src || ''); });
            }).then(dgmDone, dgmDone);
            return dHost.__dgmOn;
          };
          if (b.dh > 0) dHost.setAttribute('data-dh', String(Math.round(b.dh)));
          else dHost.style.minBlockSize = '120px';
          self.ioAdd(dHost);
        }
      }

    } else if (b.ty === 'math') {
      /*@3.NOEJ.31*/
      var mbox = el('div', 'ne-mathx');
      var out = el('div', 'ne-math-out', { dir: 'ltr', role: 'button', tabindex: '0',
        'aria-label': L('عدّل المعادلة', 'Edit equation') });
      mbox.appendChild(out);
      var ta = el('textarea', 'ne-tex', {
        dir: 'ltr', spellcheck: 'false', rows: '2',
        placeholder: '\\sum_{i=1}^{n} i^2',
        'aria-label': L('معادلة LaTeX', 'LaTeX equation')
      });
      ta.value = b.tex || '';
      ta.hidden = !!String(b.tex || '').trim();
      mbox.appendChild(ta);
      out.hidden = !String(b.tex || '').trim();
      body.appendChild(mbox);
      renderMath(out, b.tex);

    } else if (b.ty === 'tbl') {
      var tbl = el('table', 'ne-tbl');
      var rowsT = b.rows || [], colsT = rowsT[0] ? rowsT[0].length : 1, dirT = blockDir(b, dd);
      var mkRow = function (row) {
        var tr = el('tr');
        row.forEach(function (c) {
          var td = el('td', 'ne-cell', { contenteditable: 'true',
            dir: dirT, spellcheck: 'false' });
          /*@3.NOEJ.93*/
          if (c.al) td.setAttribute('data-cal', c.al);
          if (c.va) td.setAttribute('data-cva', c.va);
          cellLook(td, c);
          td.innerHTML = B().runsToHtmlBidi(c.rt);
          tr.appendChild(td);
        });
        return tr;
      };
      var lazyT = !this._noLazy && rowsT.length * colsT > TBL_LAZY && rowsT.length > TBL_LAZY_MIN * 2;
      var kT = lazyT ? Math.max(TBL_LAZY_MIN, Math.floor(TBL_LAZY / Math.max(1, colsT))) : rowsT.length;
      var uT = lazyT ? this.natUnitOf(b.id) : null;
      var hollowT = !!(lazyT && uT && uT.cw && uT.cw.length === colsT && uT.un && uT.un.length === rowsT.length - 1 && uT.tw > 0);
      var rq, wrapT = wrap, selfT = this;
      var mkHollow = function (ri) {
        var tr = el('tr');
        tr.setAttribute('data-hollow', '1');
        var hh = uT.un[ri - 1];
        if (hh > 0) tr.style.blockSize = hh.toFixed(4) + 'px';
        var tdH = el('td', 'ne-cell', { contenteditable: 'false', dir: dirT, colspan: String(colsT) });
        tr.appendChild(tdH);
        return tr;
      };
      var fillRow = function (tr) {
        if (!tr || !tr.hasAttribute('data-hollow')) return;
        var ri = Array.prototype.indexOf.call(tbl.rows, tr);
        var row = rowsT[ri];
        if (!row) return;
        var made = mkRow(row), c, kids = [];
        for (c = 0; c < made.childNodes.length; c++) kids.push(made.childNodes[c]);
        tr.innerHTML = '';
        for (c = 0; c < kids.length; c++) tr.appendChild(kids[c]);
        tr.removeAttribute('data-hollow');
        tr.style.blockSize = '';
        if (selfT._tio) { try { selfT._tio.unobserve(tr); } catch (eU) {} }
      };
      wrap.__tblRow = fillRow;
      wrap.__tblRows = rowsT;
      wrap.__tblMk = mkRow;
      /*@3.NOEJ.501*/
      var fitT = this._tfit ? this._tfit[b.id] : null;
      if (fitT && fitT.m) { wrap.setAttribute('data-tfit', fitT.m); wrap.style.setProperty('--ne-tfs', fitT.fs + 'px'); }
      else if (fitT) { wrap.removeAttribute('data-tfit'); wrap.style.removeProperty('--ne-tfs'); }
      if (hollowT) {
        var cg = el('colgroup');
        for (rq = 0; rq < colsT; rq++) { var col = el('col'); col.style.inlineSize = uT.cw[rq].toFixed(2) + 'px'; cg.appendChild(col); }
        tbl.appendChild(cg);
        tbl.style.tableLayout = 'fixed';
        tbl.style.inlineSize = uT.tw.toFixed(2) + 'px';
        for (rq = 0; rq < rowsT.length; rq++) tbl.appendChild(rq < kT ? mkRow(rowsT[rq]) : mkHollow(rq));
        body.appendChild(tbl);
        wrapT.setAttribute('data-tblfill', '1');
        wrapT.__tblFill = function () {
          var hs = tbl.querySelectorAll('tr[data-hollow]'), q;
          for (q = 0; q < hs.length; q++) fillRow(hs[q]);
          wrapT.__tblFill = null;
          wrapT.removeAttribute('data-tblfill');
          return true;
        };
        var hsT = tbl.querySelectorAll('tr[data-hollow]');
        for (rq = 0; rq < hsT.length; rq++) this.tioAdd(hsT[rq], fillRow);
      } else {
        for (rq = 0; rq < kT && rq < rowsT.length; rq++) tbl.appendChild(mkRow(rowsT[rq]));
        body.appendChild(tbl);
      }
      if (lazyT && !hollowT) {
        var nextT = kT, batchT = kT;
        var natT = this.natHeightOf(b.id);
        if (natT > 0) wrapT.style.minBlockSize = natT.toFixed(2) + 'px';
        wrapT.setAttribute('data-tblfill', '1');
        var fillT = function (sync) {
          var lim = sync ? rowsT.length : Math.min(rowsT.length, nextT + batchT);
          for (; nextT < lim; nextT++) tbl.appendChild(mkRow(rowsT[nextT]));
          batchT *= 2;
          if (wrapT.__tblQ) { cancelAnimationFrame(wrapT.__tblQ); wrapT.__tblQ = 0; }
          if (nextT >= rowsT.length) {
            wrapT.__tblFill = null;
            wrapT.removeAttribute('data-tblfill');
            wrapT.style.minBlockSize = '';
            return true;
          }
          if (wrapT.isConnected) wrapT.__tblQ = requestAnimationFrame(function () { wrapT.__tblQ = 0; fillT(false); });
          return false;
        };
        wrapT.__tblFill = fillT;
        wrapT.__tblQ = requestAnimationFrame(function () { wrapT.__tblQ = 0; fillT(false); });
      }
      var tb = el('div', 'ne-tbl-bar');
      tb.innerHTML =
        '<button type="button" class="ne-mini" data-tbl="row+">' + L('+ صف', '+ Row') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="col+">' + L('+ عمود', '+ Col') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="row-">' + L('− صف', '− Row') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="col-">' + L('− عمود', '− Col') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="style">' + L('نمط الجدول', 'Table style') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="tone">' + L('لون الجدول', 'Table colour') + '</button>' +
        '<span class="ne-tbl-sep" aria-hidden="true"></span>' +
        '<button type="button" class="ne-mini ne-mini--sc" data-tbl="scope" data-csc="' + cscOf(b) + '"' +
        ' title="' + B().esc(L('الاتّجاهُ والخطُّ والحجمُ والمحاذاةُ تُطبَّق على:', 'Direction, font, size and alignment apply to:')) + '">' +
        L(CSC_L[cscOf(b)][0], CSC_L[cscOf(b)][1]) + '</button>' +
        TBL_ALIGN.map(function (a) {
          return '<button type="button" class="ne-mini ne-mini--i" data-tbl="' + a.k + '"' +
            ' aria-label="' + B().esc(L(a.ar, a.en)) + '" title="' + B().esc(L(a.ar, a.en)) + '">' +
            '<i class="fa-solid ' + a.icon + '" aria-hidden="true"></i></button>';
        }).join('');
      body.appendChild(tb);

    } else if (b.ty === 'img') {
      body.appendChild(this.renderImg(b));
      /*@3.NOEJ.446*/
      if (this._imgOpen && this._imgOpen[b.id]) wrap.setAttribute('data-imged', '1');

    } else if (b.ty === 'ink') {
      body.appendChild(this.renderInk(b));

    } else if (b.ty === 'hr') {
      body.appendChild(el('hr', 'ne-hr'));

    } else if (b.ty === 'pb') {
      /*@3.NOEJ.440*/
      /*@3.NOEJ.514*/
      var pbx = el('div', 'ne-pb');
      pbx.style.blockSize = Math.max(0.01, Number(b.h) || 0) + 'px';
      if (Number(b.h) < 0) wrap.style.marginBlockStart = Number(b.h) + 'px';
      body.appendChild(pbx);
    } else if (b.ty === 'gap') {
      /*@3.NOEJ.17*/
      var gap = el('div', 'ne-gap');
      gap.style.blockSize = (b.h || 40) + 'px';
      var ctl = el('div', 'ne-gap-c');
      var less = el('button', 'ne-gap-b', { type: 'button', 'aria-label': L('أقل فراغاً', 'Less space') });
      less.textContent = '−';
      var more = el('button', 'ne-gap-b', { type: 'button', 'aria-label': L('أكثر فراغاً', 'More space') });
      more.textContent = '+';
      ctl.appendChild(less); ctl.appendChild(more);
      gap.appendChild(ctl);
      body.appendChild(gap);
    }

    return wrap;
  };

  /*@3.NOEJ.22*/
  Editor.prototype.renderImg = function (b) {
    var box = el('div', 'ne-imgx');
    var fig = el('figure', 'ne-fig');
    var view = el('div', 'ne-img-view');
    fig.appendChild(view);
    var cap = el('figcaption', 'ne-cap');
    cap.textContent = b.alt || '';
    cap.hidden = !(b.cap && b.alt);
    fig.appendChild(cap);

    var edit = el('div', 'ne-img-edit', { contenteditable: 'false' });
    /*@3.NOEJ.358*/
    /*@3.NOEJ.394*/
    /*@3.NOEJ.402*/
    box.appendChild(fig);
    box.appendChild(edit);
    var hasSrc0 = !!B().imgSrc(b.url);
    /*@3.NOEJ.409*/
    if (!this._imgOpen) this._imgOpen = {};
    /*@3.NOEJ.434*/
    if (this._imgOpen[b.id] == null) this._imgOpen[b.id] = 0;
    edit.hidden = !this._imgOpen[b.id];
    if (!hasSrc0) this._imgOpen[b.id] = 0;
    /*@3.NOEJ.606*/
    if (this.floatsImg()) {
      edit.setAttribute('popover', 'manual');
      if (!edit.hidden) {
        var edF = this;
        requestAnimationFrame(function () {
          var ndF = edit.isConnected && !edit.hidden ? edit.closest('[data-bid]') : null;
          if (ndF) edF.placeImgPanel(ndF);
        });
      }
    }
    var headI = el('div', 'ne-img-head');
    headI.innerHTML = '<i class="fa-solid fa-sliders" aria-hidden="true"></i><span>' +
      B().esc(L('إعداداتُ الصورة', 'Image settings')) + '</span>' +
      '<button type="button" class="ne-mini ne-mini--i ne-img-x" data-imgx="1" aria-label="' +
      B().esc(L('أغلقِ اللوح', 'Close the panel')) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
    edit.appendChild(headI);
    /*@3.NOEJ.435*/
    (function (pan, head, edr) {
      var D0 = null;
      head.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button')) return;
        var z = edr.zoomOf() || 1;
        D0 = { x: e.clientX, y: e.clientY, l: pan.offsetLeft, t: pan.offsetTop, z: z, id: e.pointerId };
        /*@3.NOEJ.604*/
        if (imgPanOpen(pan)) {
          var rF = pan.getBoundingClientRect();
          D0.fl = 1; D0.l = rF.left; D0.t = rF.top; D0.w = rF.width; D0.h = rF.height;
        }
        try { head.setPointerCapture(e.pointerId); } catch (eC) {}
        e.preventDefault();
      });
      head.addEventListener('pointermove', function (e) {
        if (!D0 || e.pointerId !== D0.id) return;
        if (D0.fl) {
          var vwF = window.innerWidth, vhF = window.innerHeight;
          var fx = Math.round(Math.max(8, Math.min(vwF - D0.w - 8, D0.l + e.clientX - D0.x)));
          var fy = Math.round(Math.max(8, Math.min(vhF - Math.min(D0.h, vhF - 16) - 8, D0.t + e.clientY - D0.y)));
          pan.style.left = fx + 'px'; pan.style.top = fy + 'px';
          var ndD = pan.closest('[data-bid]');
          if (ndD) { if (!edr._imgFloat) edr._imgFloat = {}; edr._imgFloat[ndD.getAttribute('data-bid')] = { x: fx, y: fy }; }
          return;
        }
        var nl = Math.max(0, Math.round(D0.l + (e.clientX - D0.x) / D0.z));
        var nt = Math.max(0, Math.round(D0.t + (e.clientY - D0.y) / D0.z));
        pan.style.insetInlineStart = 'auto'; pan.style.right = 'auto';
        pan.style.left = nl + 'px'; pan.style.top = nt + 'px';
        pan.__dx = nl; pan.__dy = nt;
      });
      var up = function (e) { if (D0 && e.pointerId === D0.id) D0 = null; };
      head.addEventListener('pointerup', up);
      head.addEventListener('pointercancel', up);
    }(edit, headI, this));
    var cardOf = function (key, ar, en, icon, open) {
      var cd = el('section', 'ne-img-card', { 'data-card': key, 'data-open': open ? '1' : '0' });
      var hd = el('button', 'ne-img-card-h', {
        type: 'button', 'data-imgcard': key, 'aria-expanded': open ? 'true' : 'false'
      });
      hd.innerHTML = '<i class="fa-solid ' + icon + '" aria-hidden="true"></i><span>' + B().esc(L(ar, en)) +
        '</span><i class="fa-solid fa-chevron-down ne-img-chev" aria-hidden="true"></i>';
      cd.appendChild(hd);
      var bd = el('div', 'ne-img-card-b');
      cd.appendChild(bd);
      edit.appendChild(cd);
      return bd;
    };
    var acts = el('div', 'ne-img-acts');
    var edB = el('button', 'gsf-btn gsf-btn--go ne-img-ed', { type: 'button', 'data-imgedit': '1' });
    edB.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>' +
      B().esc(L('تعديلُ الصورة', 'Edit image')) + '</span>';
    acts.appendChild(edB);
    if (B().imgSrc(b.was)) {
      var orB = el('button', 'gsf-btn gsf-btn--ghost ne-img-orig', { type: 'button', 'data-imgorig': '1' });
      orB.innerHTML = '<i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i><span>' +
        B().esc(L('الصورةُ الأصليّة', 'Original')) + '</span>';
      acts.appendChild(orB);
    }
    edit.appendChild(acts);
    var cardSrc = cardOf('src', 'استبدالُ الصورة', 'Replace image', 'fa-repeat', !hasSrc0);
    var cardCap = cardOf('cap', 'العنوان', 'Caption', 'fa-heading', false);
    var cardLook = cardOf('look', 'الشكلُ والحجم', 'Look and size', 'fa-crop-simple', false);

    cardSrc.appendChild(srcBtns(true));
    /*@3.NOEJ.371*/
    var isLoc = !!(B().localImg && B().localImg(b.url));
    var urlIn = el('input', 'ne-img-url', {
      type: 'url', value: isLoc ? '' : (b.url || ''), dir: 'ltr', spellcheck: 'false',
      placeholder: L('أو الصقْ رابطَ صورة…', 'Or paste an image link…'),
      'aria-label': L('رابطُ الصورة', 'Image link')
    });
    var selfR = this;
    urlIn.addEventListener('change', function () {
      if (B().httpsOnly(urlIn.value)) selfR.imgLinkSet(b.id, urlIn.value, true);
    });
    cardSrc.appendChild(urlIn);
    var unsBtn = el('button', 'ne-mini ne-img-uns', {
      type: 'button', 'data-imguns': '1',
      'aria-label': L('ابحثْ في أنسبلاش', 'Search Unsplash')
    });
    unsBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
      '<span>' + B().esc(L('ابحثْ في أنسبلاش', 'Unsplash')) + '</span>';
    cardSrc.appendChild(unsBtn);

    var capRow = el('div', 'ne-img-row');
    var altIn = el('input', 'ne-img-alt', {
      type: 'text', value: b.alt || '', dir: 'auto',
      placeholder: L('عنوان الصورة', 'Image caption'),
      'aria-label': L('عنوان الصورة', 'Image caption')
    });
    capRow.appendChild(altIn);
    var capBtn = el('button', 'ne-mini', {
      type: 'button', 'data-imgc': '1',
      'aria-pressed': b.cap ? 'true' : 'false',
      'aria-label': L('إظهار العنوان تحت الصورة', 'Show caption under image')
    });
    capBtn.innerHTML = '<i class="fa-solid fa-' + (b.cap ? 'eye' : 'eye-slash') +
      '" aria-hidden="true"></i>';
    capRow.appendChild(capBtn);
    cardCap.appendChild(capRow);

    /*@3.NOEJ.359*/
    var qRow = el('div', 'ne-img-row ne-img-q');
    var qLab = el('span', 'ne-img-sl-t');
    qLab.textContent = L('الحجم', 'Size');
    qRow.appendChild(qLab);
    [['-', 'أصغر', 'Smaller'], [25, '', ''], [50, '', ''], [75, '', ''], [100, '', ''],
     ['+', 'أكبر', 'Bigger']].forEach(function (q) {
      var isN = typeof q[0] === 'number';
      var nm = isN ? (q[0] + '%') : L(q[1], q[2]);
      var qb = el('button', 'ne-mini' + (isN ? '' : ' ne-mini--i'), {
        type: 'button', 'data-imgq': String(q[0]),
        'aria-pressed': (isN && (b.iw == null ? 100 : b.iw) === q[0]) ? 'true' : 'false',
        'aria-label': nm, title: nm
      });
      qb.innerHTML = isN ? ('<span dir="ltr">' + q[0] + '%</span>')
        : ('<i class="fa-solid fa-' + (q[0] === '-' ? 'minus' : 'plus') + '" aria-hidden="true"></i>');
      qRow.appendChild(qb);
    });
    cardLook.appendChild(qRow);

    /*@3.NOEJ.42*/
    var dims = [
      { k: 'iw', min: 20, max: 100, ar: 'الحجم', en: 'Size', d: 100 },
      { k: 'zm', min: 40, max: 320, ar: 'حجم الصورة داخل الإطار', en: 'Image size inside frame', d: 0 },
      { k: 'op', min: 15, max: 100, ar: 'درجةُ الظهور', en: 'Opacity', d: 100 }
    ];
    dims.forEach(function (d) {
      var row = el('label', 'ne-img-sl');
      var lab = el('span', 'ne-img-sl-t');
      lab.textContent = L(d.ar, d.en);
      row.appendChild(lab);
      var sl = el('input', '', {
        type: 'range', min: String(d.min), max: String(d.max), step: '5',
        value: String(b[d.k] == null ? d.d : b[d.k]), 'data-imgk': d.k,
        'aria-label': L(d.ar, d.en)
      });
      row.appendChild(sl);
      cardLook.appendChild(row);
    });

    /*@3.NOEJ.41*/
    var shRow = el('div', 'ne-img-row');
    [['rect', 'fa-square', 'مستطيل', 'Rectangle'],
     ['soft', 'fa-square-full', 'حوافّ منحنية', 'Rounded'],
     ['circle', 'fa-circle', 'دائريّة', 'Circle']].forEach(function (sh) {
      var sb = el('button', 'ne-mini', {
        type: 'button', 'data-imgs': sh[0],
        'aria-pressed': (b.sh || 'rect') === sh[0] ? 'true' : 'false',
        'aria-label': L(sh[2], sh[3]),
        'data-ar-title': sh[2], 'data-en-title': sh[3]
      });
      sb.innerHTML = '<i class="fa-solid ' + sh[1] + '" aria-hidden="true"></i>';
      shRow.appendChild(sb);
    });
    var sep = el('span', 'ne-img-sep');
    shRow.appendChild(sep);
    [['start', 'fa-align-left', 'إلى البداية', 'To the start'],
     ['center', 'fa-align-center', 'توسيط', 'Centre'],
     ['end', 'fa-align-right', 'إلى النهاية', 'To the end']].forEach(function (al) {
      var ab = el('button', 'ne-mini', {
        type: 'button', 'data-imga': al[0],
        'aria-pressed': (b.al || 'start') === al[0] ? 'true' : 'false',
        'aria-label': L(al[2], al[3]),
        'data-ar-title': al[2], 'data-en-title': al[3]
      });
      ab.innerHTML = '<i class="fa-solid ' + al[1] + '" aria-hidden="true"></i>';
      shRow.appendChild(ab);
    });
    cardLook.appendChild(shRow);

    var rst = el('button', 'ne-mini', { type: 'button', 'data-imgr': '1' });
    rst.textContent = L('إعادة للأصل', 'Reset');
    cardLook.appendChild(rst);

    var hint = el('p', 'ne-hint');
    hint.textContent = L(
      'الصورةُ تُحفظ مع ملاحظتك: تصل أجهزتَك الأخرى، وتظهر بلا إنترنت، وتخرج في PDF. ' +
      'والرابطُ نحفظ منه نسخةً إن سمح موقعُه، وإلا عُرضت الصورةُ من موقعها.',
      'The image is kept with your note: it reaches your other devices, shows offline and exports to PDF. ' +
      'From a link we keep a copy when its site allows it; otherwise it is shown from its site.');
    cardSrc.appendChild(hint);

    applyImgStyle(fig, b);
    /*@3.NOEJ.597*/
    if (!this.readOnly) {
      var grips = el('div', 'ne-img-grips', { contenteditable: 'false', 'aria-hidden': 'true' });
      grips.appendChild(el('span', 'ne-img-grip', { 'data-grip': 's' }));
      grips.appendChild(el('span', 'ne-img-grip', { 'data-grip': 'e' }));
      view.appendChild(grips);
      this.gripWire(grips, fig, b.id);
    }
    /*@3.NOEJ.249*/
    paintImg(view, b.url, b.alt, b.lk, b);
    return box;
  };

  /*@3.NOEJ.600*/
  Editor.prototype.gripWire = function (gr, fig, id) {
    var self = this, D = null;
    gr.addEventListener('pointerdown', function (e) {
      var gp = e.target.closest('.ne-img-grip');
      if (!gp || e.button > 0 || self.readOnly) return;
      var hit = self.blockAt(id);
      if (!hit) return;
      e.preventDefault(); e.stopPropagation();
      var r = gr.parentNode.getBoundingClientRect();
      var col = fig.parentNode.getBoundingClientRect();
      var blk = fig.closest('.ne-b'), al = (blk && blk.getAttribute('data-al')) || '';
      var gb = gp.getBoundingClientRect();
      var onRight = (gb.left + gb.right) / 2 > (r.left + r.right) / 2;
      D = { id: e.pointerId, x0: e.clientX, on: false,
            ax: al === 'center' ? (r.left + r.right) / 2 : (onRight ? r.left : r.right),
            k: al === 'center' ? 2 : 1, W: col.width || 1,
            iw: hit.b.iw == null ? 100 : hit.b.iw, before: self.snapshot() };
      D.iw0 = D.iw;
      if (hit.b.fp) {
        var node = fig.closest('[data-bid]');
        var rtl = self.isRtl();
        D.free = { node: node, start: rtl ? onRight : !onRight, sgn: rtl ? -1 : 1,
                   SW: self.sheetW() || 794, z: self.zoomOf() || 1,
                   ox: hit.b.fp.x || 0, wm0: hit.b.wm, fx0: hit.b.fp.x };
        D.free.ow = (node.offsetWidth || node.getBoundingClientRect().width) / D.free.SW;
      }
      try { gr.setPointerCapture(e.pointerId); } catch (e2) {}
      fig.classList.add('ne-fig--sizing');
    });
    gr.addEventListener('pointermove', function (e) {
      if (!D || e.pointerId !== D.id) return;
      if (!D.on && Math.abs(e.clientX - D.x0) < 3) return;
      D.on = true;
      if (D.free) {
        var F = D.free, hit = self.blockAt(id);
        if (!hit || !hit.b.fp) return;
        var dw = F.sgn * (e.clientX - D.x0) / (F.z * F.SW);
        if (F.start) {
          var nx = Math.max(0, Math.min(F.ox + F.ow - 0.06, F.ox + dw));
          hit.b.wm = Math.max(0.06, F.ow - (nx - F.ox));
          hit.b.fp.x = nx;
        } else {
          hit.b.wm = Math.max(0.06, Math.min(Math.max(0.08, 1 - F.ox), F.ow + dw));
        }
        D.iw = 100;
        fig.style.inlineSize = '100%';
        self.applyFree(F.node, hit.b);
        return;
      }
      var w = Math.abs(e.clientX - D.ax) * D.k;
      D.iw = Math.max(10, Math.min(100, Math.round(w / D.W * 100)));
      fig.style.inlineSize = D.iw + '%';
    });
    var end = function (e) {
      if (!D || e.pointerId !== D.id) return;
      var d = D; D = null;
      fig.classList.remove('ne-fig--sizing');
      var hit = self.blockAt(id);
      if (!hit) return;
      var freeMoved = !!(d.free && d.on && hit.b.fp && (hit.b.wm !== d.free.wm0 || hit.b.fp.x !== d.free.fx0));
      if (d.iw === d.iw0 && !freeMoved) { applyImgStyle(fig, hit.b); return; }
      hit.b.iw = d.iw;
      self.pushUndo(d.before);
      var node = fig.closest('[data-bid]');
      if (node) {
        [].forEach.call(node.querySelectorAll('[data-imgq]'), function (x) {
          x.setAttribute('aria-pressed', Number(x.getAttribute('data-imgq')) === d.iw ? 'true' : 'false');
        });
        var sl = node.querySelector('[data-imgk="iw"]');
        if (sl) sl.value = String(d.iw);
      }
      applyImgStyle(fig, hit.b);
      self.touch();
    };
    gr.addEventListener('pointerup', end);
    gr.addEventListener('pointercancel', end);
    gr.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); });
  };

  /*@3.NOEJ.23*/
  function applyImgStyle(fig, b) {
    if (!fig) return;
    fig.style.inlineSize = (b.iw == null ? 100 : b.iw) + '%';
    var br = b.br == null ? 100 : b.br;
    fig.style.filter = br === 100 ? '' : ('brightness(' + (br / 100) + ')');
    var op = b.op == null ? 100 : b.op;
    fig.style.opacity = op === 100 ? '' : String(op / 100);
    fig.setAttribute('data-sh', b.sh || 'rect');
    /*@3.NOEJ.43*/
    var im = fig.querySelector('.ne-img-view img');
    if (im) {
      var fx = b.fx == null ? 50 : b.fx;
      var fy = b.fy == null ? 50 : b.fy;
      if ((b.sh || 'rect') === 'circle') {
        var cover = coverPct(im);
        var z = b.zm == null ? cover : b.zm;
        im.style.objectPosition = fx + '% ' + fy + '%';
        im.style.transform = 'scale(' + (z / 100) + ')';
        var sl = fig.parentNode ? fig.parentNode.querySelector('[data-imgk="zm"]') : null;
        if (sl && document.activeElement !== sl) sl.value = String(Math.round(z));
      } else {
        im.style.objectPosition = '';
        im.style.transform = '';
      }
    }
  }

/*@3.NOEJ.52*/
  function coverPct(im) {
    var iw = im.naturalWidth, ih = im.naturalHeight;
    var box = im.parentNode ? im.parentNode.getBoundingClientRect() : null;
    if (!iw || !ih || !box || !box.width || !box.height) return 100;
    var fit = Math.min(box.width / iw, box.height / ih);
    var cov = Math.max(box.width / iw, box.height / ih);
    if (!isFinite(fit) || fit <= 0) return 100;
    return Math.min(320, Math.max(100, Math.round((cov / fit) * 100)));
  }

  Editor.prototype.renderInk = function (b) {
    var box = el('div', 'ne-ink-box');
    var bar = el('div', 'nc-bar');
    var canvasHost = el('div', 'nc-host');
    box.appendChild(bar);
    box.appendChild(canvasHost);

    var self = this;
    if (!window.GardenCanvas) return box;

    setTimeout(function () {
      var cv = GardenCanvas.mount(canvasHost, {
        height: b.h || 300,
        onChange: function (d) {
          b.ink = d.ink; b.w = d.w; b.h = d.h;
          if (d.ts) b.ts = d.ts; else delete b.ts;
          b.shapes = d.shapes && d.shapes.length ? d.shapes : null;
          self.touch();
        },
        onState: function (st) { if (barUI) barUI.sync(st); }
      });
      var barUI = window.GardenCanvasBar ? GardenCanvasBar.mount(bar, cv) : null;
      self.canvases = self.canvases || {};
      self.canvases[b.id] = cv;
      cv.setTool(GardenCanvas.lastTool ? GardenCanvas.lastTool() : 'pen');
      if (b.ink || (b.shapes && b.shapes.length)) cv.load(b.ink, b.h, b.shapes, b.ts);
      cv.emit();
    }, 0);

    return box;
  };

  function placeholderFor(b) {
    if (b.ty === 'shape') return L('نصّ', 'Text');
    if (b.ty === 'h') return L('عنوان', 'Heading');
    if (b.ty === 'quote') return L('اقتباس', 'Quote');
    if (b.ty === 'callout') return L('تنبيه', 'Callout');
    if (b.ty === 'todo') return L('مهمة', 'To-do');
    return L('اكتب، أو اضغط / للأوامر…', 'Type, or press / for commands…');
  }

  /*@3.NOEJ.210*/
  var CORSQ = {};

  function corsOk(u) {
    var o;
    try { o = new URL(u, location.href).origin; } catch (e) { return Promise.resolve(true); }
    if (CORSQ[o]) return CORSQ[o];
    CORSQ[o] = new Promise(function (res) {
      var probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.referrerPolicy = 'no-referrer';
      var t = setTimeout(function () { res(false); }, 9000);
      probe.onload = function () { clearTimeout(t); res(true); };
      probe.onerror = function () { clearTimeout(t); res(false); };
      probe.src = u;
    });
    return CORSQ[o];
  }

  /*@3.NOEJ.356*/
  function wipeView(host) {
    var g = host.querySelector(':scope > .ne-img-grips');
    host.innerHTML = '';
    if (g) host.appendChild(g);
  }

  function paintLocal(host, ref, alt, lk) {
    var S = window.GardenNotesStore;
    var id = String(ref).slice(11);
    wipeView(host);
    if (!S || !S.imageUrl) return;
    /*@3.NOEJ.492*/
    var uNow = S.imageUrlNow ? S.imageUrlNow(id) : '';
    var put = function (u) {
      if (!u) {
        var bad = el('div', 'ne-img-bad');
        bad.textContent = L('لم تصل هذه الصورةُ بعد — تُرفع من الجهاز الذي أُلصقت فيه حين يُفتح متّصلاً.',
                            'This image has not arrived yet — it uploads from the device it was pasted on when that device is online.');
        var again = el('button', 'gsf-btn gsf-btn--ghost ne-img-again', { type: 'button' });
        again.textContent = L('حاولْ ثانيةً', 'Try again');
        again.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          paintLocal(host, ref, alt, lk);
        });
        bad.appendChild(again);
        host.appendChild(bad);
        return;
      }
      var img = el('img', 'ne-img', { src: u, alt: alt || '', loading: 'lazy' });
      img.addEventListener('load', function () {
        /*@3.NOEJ.598*/
        var ed = host.closest ? host.closest('.ne-root') : null;
        /*@3.NOEJ.480*/
        imgDims(host, img, ed);
        if (ed && ed.__ed && ed.__ed.settled) ed.__ed.settled();
      });
      var lku = lk ? B().normUrl(lk) : '';
      if (lku) {
        var a = el('a', 'ne-img-a', { href: lku, target: '_blank',
          rel: 'noopener noreferrer nofollow',
          'aria-label': L('افتحْ وجهةَ الصورة', 'Open the image target') });
        a.appendChild(img); host.appendChild(a);
      } else host.appendChild(img);
    };
    if (uNow) { put(uNow); return; }
    /*@3.NOEJ.468*/
    host.setAttribute('data-imgwait', '1');
    S.imageUrl(id).then(function (u) {
      host.removeAttribute('data-imgwait');
      if (!host.isConnected) return;
      put(u);
    });
  }

  function imgDims(host, img, ed) {
    var ndI = host.closest ? host.closest('[data-bid]') : null;
    if (!ndI || !ed || !ed.__ed || !(img.naturalWidth > 0) || !(img.naturalHeight > 0)) return;
    var hI = ed.__ed.blockAt(ndI.getAttribute('data-bid'));
    var arI = Math.round((img.naturalWidth / img.naturalHeight) * 1000) / 1000;
    if (!hI || hI.b.ty !== 'img' || (hI.b.iar === arI && hI.b.inw === img.naturalWidth)) return;
    hI.b.iar = arI; hI.b.inw = img.naturalWidth;
    if ((hI.b.sh || 'rect') !== 'circle') {
      host.style.aspectRatio = String(arI);
      host.style.maxInlineSize = img.naturalWidth + 'px';
      img.style.inlineSize = '100%';
    }
    ed.__ed.mark(true);
  }

  function paintImg(host, url, alt, lk, blk) {
    wipeView(host);
    if (blk && !(blk.iar > 0 && blk.inw > 0)) {
      var dd = B().dataDims(url);
      if (dd) { blk.iar = Math.round((dd.w / dd.h) * 1000) / 1000; blk.inw = dd.w; }
    }
    /*@3.NOEJ.430*/
    var keepBox = !!(blk && blk.iar > 0 && blk.inw > 0 && (blk.sh || 'rect') !== 'circle');
    host.style.aspectRatio = keepBox ? String(blk.iar) : '';
    host.style.maxInlineSize = keepBox ? (blk.inw + 'px') : '';
    /*@3.NOEJ.357*/
    if (B().localImg && B().localImg(url)) { paintLocal(host, url, alt, lk); return; }
    var u = B().httpsOnly(url);
    if (!u) {
      host.appendChild(pickZone());
      return;
    }
    var img = el('img', 'ne-img', {
      src: u, alt: alt || '', loading: 'lazy', referrerpolicy: 'no-referrer'
    });
    if (keepBox) img.style.inlineSize = '100%';
    var wrapA = null, lku = lk ? B().normUrl(lk) : '';
    if (lku) {
      wrapA = el('a', 'ne-img-a', {
        href: lku, target: '_blank', rel: 'noopener noreferrer nofollow',
        'aria-label': L('افتحْ وجهةَ الصورة', 'Open the image target')
      });
    }
    img.addEventListener('load', function () {
      var ed = host.closest ? host.closest('.ne-root') : null;
      if (ed && ed.__ed && ed.__ed.settled) ed.__ed.settled();
      /*@3.NOEJ.431*/
      var ndI = host.closest ? host.closest('[data-bid]') : null;
      if (ndI && ed && ed.__ed && img.naturalWidth > 0 && img.naturalHeight > 0) {
        var hI = ed.__ed.blockAt(ndI.getAttribute('data-bid'));
        var arI = Math.round((img.naturalWidth / img.naturalHeight) * 1000) / 1000;
        if (hI && hI.b.ty === 'img' && (hI.b.iar !== arI || hI.b.inw !== img.naturalWidth)) {
          hI.b.iar = arI; hI.b.inw = img.naturalWidth;
          if ((hI.b.sh || 'rect') !== 'circle') {
            host.style.aspectRatio = String(arI);
            host.style.maxInlineSize = img.naturalWidth + 'px';
            img.style.inlineSize = '100%';
          }
          ed.__ed.mark(true);
        }
      }
      corsOk(u).then(function (ok) {
        if (ok || !img.parentNode || host.querySelector('.ne-img-warn')) return;
        var w = el('div', 'ne-img-warn');
        w.textContent = L(
          'تُعرض هنا ولا تخرج في PDF — مستضيفُها لا يأذن بقراءتها. جرّب imgur أو GitHub.',
          'Shows here but will not export to PDF — its host forbids reading it. Try imgur or GitHub.');
        host.appendChild(w);
      });
    });
    img.addEventListener('error', function () {
      var edE = host.closest ? host.closest('.ne-root') : null;
      if (edE && edE.__ed && edE.__ed.settled) edE.__ed.settled();
      host.innerHTML = '';
      var bad = el('div', 'ne-img-bad');
      /*@3.NOEJ.596*/
      if (hostOf(u) === 'lh3.googleusercontent.com') {
        bad.textContent = L('هذه الصورةُ في درايف ولم تُفتح مشاركتُها — اجعلْها «أيُّ شخصٍ معه الرابط» في درايف، ثمّ حاولْ ثانيةً.',
                            'This Drive image is not shared — set it to "Anyone with the link" in Drive, then try again.');
        var again = el('button', 'gsf-btn gsf-btn--ghost ne-img-again', { type: 'button' });
        again.textContent = L('حاولْ ثانيةً', 'Try again');
        again.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          paintImg(host, url, alt, lk, blk);
        });
        bad.appendChild(again);
      } else bad.textContent = L('تعذّر تحميل الصورة من هذا الرابط.', 'Could not load the image from this link.');
      host.appendChild(bad);
    });
    if (wrapA) { wrapA.appendChild(img); host.appendChild(wrapA); }
    else host.appendChild(img);
  }

  /*@3.NOEJ.587*/
  var IMG_SRCS = [
    ['dev', 'fa-solid fa-laptop', 'من جهازي', 'My device'],
    ['gd', 'fa-brands fa-google-drive', 'قوقل درايف', 'Google Drive'],
    ['url', 'fa-solid fa-link', 'رابط', 'Link'],
    ['paste', 'fa-solid fa-paste', 'لصق', 'Paste']
  ];
  function srcBtns(compact) {
    var g = el('div', 'ne-img-srcs' + (compact ? ' ne-img-srcs--c' : ''));
    IMG_SRCS.forEach(function (s) {
      if (compact && s[0] === 'url') return;
      var bt = el('button', 'ne-img-src', { type: 'button', 'data-imgsrc': s[0] });
      bt.innerHTML = '<i class="' + s[1] + '" aria-hidden="true"></i><span>' + B().esc(L(s[2], s[3])) + '</span>';
      g.appendChild(bt);
    });
    return g;
  }
  function pickZone() {
    var z = el('div', 'ne-img-pick', { contenteditable: 'false' });
    z.innerHTML = '<i class="fa-solid fa-image ne-img-pick-i" aria-hidden="true"></i>' +
      '<b class="ne-img-pick-t">' + B().esc(L('اسحبْ صورةً إلى هنا، أو الصقْها، أو اخترْ من أين',
        'Drop an image here, paste it, or choose where from')) + '</b>' +
      '<span class="ne-img-pick-busy" role="status">' + B().esc(L('تُحفظ الصورة…', 'Saving the image…')) + '</span>';
    z.appendChild(srcBtns(false));
    var row = el('div', 'ne-img-lnrow');
    row.hidden = true;
    var inp = el('input', 'gsf-in ne-img-lnk', {
      type: 'url', dir: 'ltr', spellcheck: 'false', autocomplete: 'off',
      placeholder: L('رابطُ الصورة، أو رابطُ مشاركتها من درايف', 'An image link, or its Drive share link'),
      'aria-label': L('رابطُ الصورة', 'Image link')
    });
    var go = el('button', 'gsf-btn gsf-btn--go', { type: 'button', 'data-imglnk': '1' });
    go.textContent = L('أضِف', 'Add');
    inp.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault(); e.stopPropagation();
      go.click();
    });
    row.appendChild(inp); row.appendChild(go);
    z.appendChild(row);
    var ft = el('p', 'ne-img-pick-f');
    ft.innerHTML = B().esc(L('تُحفظ مع ملاحظتك، وتصل أجهزتَك، وتخرج في PDF · ',
      'Kept with your note, on all your devices, and in your PDF · ')) +
      '<button type="button" class="ne-img-unsl" data-imguns="1">' +
      B().esc(L('صورٌ مجّانيّة من أنسبلاش', 'Free photos from Unsplash')) + '</button>';
    z.appendChild(ft);
    return z;
  }

  /*@3.NOEJ.588*/
  function hostOf(u) { try { return new URL(u).hostname; } catch (e) { return ''; } }
  function driveImgUrl(u) {
    var m = /^https:[/][/](?:drive|docs)[.]google[.]com[/](?:file[/]d[/]|open[?]id=|uc[?](?:[^#]*&)?id=)([A-Za-z0-9_-]{10,})/.exec(String(u || '').trim());
    return m ? ('https://lh3.googleusercontent.com/d/' + m[1]) : '';
  }
  var COPY_MAX = 8 * 1024 * 1024;
  function fetchCopy(u) {
    if (!window.fetch || /(^|[.])unsplash[.]com$/i.test(hostOf(u))) return Promise.resolve(null);
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 12000);
    return fetch(u, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        if (!r.ok || !/^image[/](png|jpe?g|webp|gif|avif|bmp)/i.test(String(r.headers.get('content-type') || ''))) return null;
        if ((Number(r.headers.get('content-length')) || 0) > COPY_MAX) return null;
        return r.blob();
      })
      .then(function (bl) {
        clearTimeout(t);
        return (bl && bl.size && bl.size <= COPY_MAX && /^image[/]/.test(bl.type)) ? bl : null;
      }, function () { clearTimeout(t); return null; });
  }
  /*@3.NOEJ.589*/
  function squeeze(blob, side) {
    var mk = window.createImageBitmap ? createImageBitmap(blob) : Promise.reject(new Error('no_bitmap'));
    return mk.then(function (bm) {
      var k = Math.min(1, (side || 3000) / Math.max(bm.width, bm.height, 1));
      var cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(bm.width * k)); cv.height = Math.max(1, Math.round(bm.height * k));
      var g = cv.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(bm, 0, 0, cv.width, cv.height);
      try { bm.close(); } catch (e) {}
      return new Promise(function (ok) {
        cv.toBlob(function (o) {
          if (o && o.type === 'image/webp') { ok(o); return; }
          cv.toBlob(function (j) { ok(j); }, 'image/jpeg', 0.9);
        }, 'image/webp', 0.9);
      });
    });
  }
  function pickFiles(cb) {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
    inp.setAttribute('aria-hidden', 'true');
    inp.style.cssText = 'position:fixed;inset-inline-start:-9999px;inset-block-start:0;opacity:0;';
    document.body.appendChild(inp);
    var gone = function () { if (inp.parentNode) inp.parentNode.removeChild(inp); };
    inp.addEventListener('change', function () {
      var fs = [].slice.call(inp.files || []);
      gone();
      if (fs.length) cb(fs);
    });
    inp.addEventListener('cancel', gone);
    inp.click();
  }

  Editor.prototype.imgNote = function (ar, en) {
    if (this.opts && this.opts.onNote) this.opts.onNote(L(ar, en));
  };
  Editor.prototype.imgNode = function (id) {
    return this.root ? this.root.querySelector('[data-bid="' + id + '"]') : null;
  };
  Editor.prototype.imgBusy = function (id, on) {
    var nd = this.imgNode(id);
    if (!nd) return;
    if (on) nd.setAttribute('data-imgbusy', '1'); else nd.removeAttribute('data-imgbusy');
  };
  /*@3.NOEJ.590*/
  Editor.prototype.imgSet = function (id, url, extra, keep) {
    var hit = this.blockAt(id);
    if (!hit || hit.b.ty !== 'img') return false;
    var before = this.snapshot();
    var b = hit.b;
    b.url = url;
    delete b.iar; delete b.inw;
    if (!keep) { delete b.by; delete b.byLink; delete b.was; delete b.ie; delete b.loc; delete b.via; }
    if (extra) Object.assign(b, extra);
    this.pushUndo(before);
    this.renderOne(id);
    this.touch();
    this.emitState();
    return true;
  };
  Editor.prototype.imgFrom = function (id, kind) {
    var self = this;
    if (kind === 'dev') {
      pickFiles(function (fs) { self.takeImages({ files: fs }, self.imgNode(id), id); });
    } else if (kind === 'gd') {
      if (!this.opts.pickDrive) return;
      this.opts.pickDrive().then(function (f) {
        if (f) self.takeImages({ files: [f] }, self.imgNode(id), id);
      });
    } else if (kind === 'url') {
      var nd = this.imgNode(id);
      var row = nd ? nd.querySelector('.ne-img-lnrow') : null;
      if (!row) return;
      row.hidden = false;
      var inp = row.querySelector('input');
      if (inp) { try { inp.focus({ preventScroll: true }); } catch (eF) { inp.focus(); } }
    } else if (kind === 'paste') {
      this.imgPaste(id);
    }
  };
  Editor.prototype.imgPaste = function (id) {
    var self = this;
    var C = navigator.clipboard;
    var nope = function () {
      self.imgNote('لم يُسمح بقراءة الحافظة — اضغطْ Ctrl+V بعد أن تنسخ الصورة.',
                   'Clipboard access was not allowed — press Ctrl+V after copying the image.');
    };
    if (!C || !C.read) {
      if (C && C.readText) {
        C.readText().then(function (s) {
          if (B().httpsOnly(s)) self.imgLinkSet(id, s);
          else nope();
        }, nope);
      } else nope();
      return;
    }
    C.read().then(function (items) {
      var it = null, ty = '', txt = null, i, j;
      for (i = 0; i < (items || []).length && !it; i++) {
        for (j = 0; j < (items[i].types || []).length; j++) {
          var t = items[i].types[j];
          if (/^image[/]/.test(t)) { it = items[i]; ty = t; break; }
          if (t === 'text/plain' && !txt) txt = items[i];
        }
      }
      if (it) {
        return it.getType(ty).then(function (bl) {
          var f = new File([bl], 'pasted.' + (ty.split('/')[1] || 'png'), { type: ty });
          self.takeImages({ files: [f] }, self.imgNode(id), id);
        });
      }
      if (txt) {
        return txt.getType('text/plain').then(function (bl) { return bl.text(); }).then(function (s) {
          if (B().httpsOnly(s)) { self.imgLinkSet(id, s); return; }
          self.imgNote('لا صورةَ في الحافظة — انسخْ صورةً أوّلاً.', 'No image on the clipboard — copy one first.');
        });
      }
      self.imgNote('لا صورةَ في الحافظة — انسخْ صورةً أوّلاً.', 'No image on the clipboard — copy one first.');
    })['catch'](nope);
  };
  Editor.prototype.imgLinkGo = function (node, id) {
    var inp = node ? node.querySelector('.ne-img-lnk') : null;
    this.imgLinkSet(id, inp ? inp.value : '');
  };
  Editor.prototype.imgLinkSet = function (id, raw, keepOpen) {
    var self = this;
    var u = B().httpsOnly(raw);
    if (!u) {
      this.imgNote('الصقْ رابطاً يبدأ بـ https://', 'Paste a link that starts with https://');
      return Promise.resolve(false);
    }
    u = driveImgUrl(u) || u;
    var S = window.GardenNotesStore;
    this.imgBusy(id, true);
    var put = function (url, extra) {
      self.imgBusy(id, false);
      if (keepOpen) { if (!self._imgOpen) self._imgOpen = {}; self._imgOpen[id] = 1; }
      return self.imgSet(id, url, extra);
    };
    return fetchCopy(u).then(function (bl) {
      if (!bl || !S || !S.putImage) return put(u);
      return S.putImage(bl, { name: '' }).then(function (rid) {
        return put('byte-local:' + rid, { loc: 1, via: u });
      }, function () { return put(u); });
    });
  };

  var _ieP = null;
  function needImgEdit() {
    if (window.GardenImgEdit) return Promise.resolve(window.GardenImgEdit);
    if (_ieP) return _ieP;
    var me = document.querySelector('script[src*="notes-editor.js"]');
    var src = me ? me.getAttribute('src') : '../shared/notes-editor.js';
    var base = src.replace(/notes-editor[.]js.*$/, ''), q = (/[?]v=[^&]+/.exec(src) || [''])[0];
    _ieP = new Promise(function (ok, no) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = base + 'notes-imgedit.css' + q;
      document.head.appendChild(l);
      var sc = document.createElement('script');
      sc.src = base + 'notes-imgedit.js' + q;
      sc.onload = function () { if (window.GardenImgEdit) ok(window.GardenImgEdit); else no(new Error('ie_missing')); };
      sc.onerror = function () { no(new Error('ie_load')); };
      document.head.appendChild(sc);
    })['catch'](function (e) { _ieP = null; throw e; });
    return _ieP;
  }
  function imgUrlOf(ref) {
    var S = window.GardenNotesStore;
    if (B().localImg(ref)) return S && S.imageUrl ? S.imageUrl(String(ref).slice(11)) : Promise.resolve('');
    return Promise.resolve(B().httpsOnly(ref));
  }
  /*@3.NOEJ.591*/
  Editor.prototype.imgEdit = function (id) {
    var self = this;
    var hit = this.blockAt(id);
    if (!hit || hit.b.ty !== 'img' || !B().imgSrc(hit.b.url)) return;
    var b = hit.b;
    var base = B().imgSrc(b.was) || b.url;
    var ie0 = b.ie || null;
    if (!ie0 && b.br != null && b.br !== 100) ie0 = { br: b.br };
    needImgEdit().then(function (IE) {
      IE.open({
        src: imgUrlOf(base),
        ie: ie0,
        onSave: function (blob, ie) {
          var S = window.GardenNotesStore;
          if (!S || !S.putImage) return Promise.reject(new Error('no_store'));
          var put = function (bl) { return S.putImage(bl, { name: 'edited' }); };
          return put(blob)['catch'](function (e) {
            if (e && e.code === 'img_too_large') return squeeze(blob, 3000).then(put);
            throw e;
          }).then(function (rid) {
            var cur = self.blockAt(id);
            if (!cur) return;
            var was = B().imgSrc(cur.b.was) || cur.b.url;
            self.imgSet(id, 'byte-local:' + rid, { loc: 1, was: was, ie: ie, br: 100 }, true);
          });
        },
        onRestore: B().imgSrc(b.was) ? function () { self.imgOrig(id); } : null
      });
    }, function () {
      self.imgNote('تعذّر فتحُ محرّرِ الصورة — تحقّقْ من الاتّصال.', 'Could not open the image editor — check the connection.');
    });
  };
  Editor.prototype.imgOrig = function (id) {
    var hit = this.blockAt(id);
    var was = hit ? B().imgSrc(hit.b.was) : '';
    if (!was) return;
    var before = this.snapshot();
    hit.b.url = was;
    delete hit.b.was; delete hit.b.ie; delete hit.b.iar; delete hit.b.inw;
    this.pushUndo(before);
    this.renderOne(id);
    this.touch();
    this.emitState();
  };

  /*@3.NOEJ.21*/
  function paintCode(pre, b, root) {
    if (!pre || !window.GardenNotesCode) return;
    if (document.activeElement === pre) return;
    var C = window.GardenNotesCode;
    if (!C.norm(b.lang)) { pre.textContent = b.src || ''; return; }
    /*@3.NOEJ.487*/
    var lh = 0;
    if (C.lineHFor && root) {
      var cfs = root.getAttribute('data-cardfs') || '', dfs = root.getAttribute('data-docfs') || '';
      lh = C.lineHFor(root, 'fs=' + (b.fs || '') + '|card=' + (b.card ? 1 : 0) + '|cfs=' + cfs + '|dfs=' + dfs, b.fs || 0, b.card || '');
    }
    C.paint(pre, b.src || '', b.lang, null, lh);
  }

  /*@3.NOEJ.5*/
  /*@3.NOEJ.444*/
  var _fontsReady = null;
  function fontsReady() {
    if (!document.fonts) return Promise.resolve();
    if (!_fontsReady) {
      _fontsReady = document.fonts.ready.then(function () { _fontsReady = null; }, function () { _fontsReady = null; });
    }
    return _fontsReady;
  }
  /*@3.NOEJ.456*/
  var _mathQ = [], _mathT = 0;
  function mathFlush() {
    _mathT = 0;
    var list = _mathQ; _mathQ = [];
    var live = [], i;
    for (i = 0; i < list.length; i++) if (list[i].isConnected && !list[i].querySelector('mjx-container')) live.push(list[i]);
    if (!live.length) return Promise.resolve(0);
    return typesetMany(live);
  }
  /*@3.NOEJ.466*/
  var MATHC = {};
  function mathKeep(list) {
    var i, h;
    for (i = 0; i < list.length; i++) {
      h = list[i];
      if (!h || !h.__tex || !h.querySelector('mjx-container')) continue;
      MATHC[h.__tex] = h.innerHTML;
    }
  }
  function typesetMany(list) {
    if (!window.GardenMath || !GardenMath.typeset) return Promise.resolve(0);
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
      return MathJax.typesetPromise(list).then(function () { mathKeep(list); return list.length; }, function () { return 0; });
    }
    try { GardenMath.typeset(list[0]); } catch (e0) {}
    return new Promise(function (res) {
      var n = 0;
      (function wait() {
        if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
          var rest = list.slice(1).filter(function (h) { return h.isConnected && !h.querySelector('mjx-container'); });
          if (!rest.length) { mathKeep(list); res(1); return; }
          MathJax.typesetPromise(rest).then(function () { mathKeep(list); res(list.length); }, function () { mathKeep(list); res(1); });
          return;
        }
        if (++n > 400) { res(0); return; }
        setTimeout(wait, 50);
      }());
    });
  }
  function mathSoon() {
    if (_mathT) return;
    var go = function () { _mathT = setTimeout(mathFlush, 0); };
    if (document.fonts && document.fonts.status !== 'loaded') { _mathT = -1; fontsReady().then(go, go); return; }
    go();
  }
  function inlineMath(scope) {
    var hs = scope.classList && scope.classList.contains('ne-im') ? [scope] : scope.querySelectorAll('.ne-im'), n = 0, i, h, k;
    for (i = 0; i < hs.length; i++) {
      h = hs[i];
      if (h.querySelector('mjx-container')) continue;
      k = h.getAttribute('data-tex') || '';
      if (!k) continue;
      h.__tex = 'i:' + k;
      if (MATHC[h.__tex]) { h.innerHTML = MATHC[h.__tex]; continue; }
      _mathQ.push(h); n++;
    }
    if (n) mathSoon();
  }
  function renderMath(host, tex) {
    host.__tex = tex || '';
    if (tex && MATHC[tex]) { host.innerHTML = MATHC[tex]; return; }
    host.textContent = tex ? ('\\[' + tex + '\\]') : '';
    if (!tex) return;
    _mathQ.push(host);
    mathSoon();
  }


  Editor.prototype.insertAfter = function (id, block) {
    var hit = this.blockAt(id);
    var at = hit ? hit.i + 1 : this.doc.blocks.length;
    this.doc.blocks.splice(at, 0, block);
    return at;
  };

  /*@3.NOEJ.9*/
  Editor.prototype.addBlock = function (ty, afterId, lv, extra) {
    var before = this.snapshot();
    this.readAll();
    var nb = B().blank(ty, lv ? { lv: lv } : null);
    if (extra) Object.assign(nb, extra);
    /*@3.NOEJ.55*/
    var src = afterId ? this.blockAt(afterId) : null;
    if (src && src.b.fp) {
      nb.fp = this.fpUnder(src.b, afterId);
      /*@3.NOEJ.69*/
      if (nb.wm == null) nb.wm = WIDE[ty] ? 'full' : (src.b.wm || 'fit');
      nb.z = this.topZ() + 1;
    }
    /*@3.NOEJ.353*/
    var fresh = isDiagram(nb);
    if (fresh) nb.dgm = 0;
    this.insertAfter(afterId || this.lastBlockId(), nb);
    this.pushUndo(before);
    var nAt = this.blockAt(nb.id);
    if (nAt && !nb.fp) this.renderInsert(nAt.i, [nb]); else this.render();
    if (fresh) { this._mmdFresh = nb.id; this.openCode(nb.id); }
    else this.focusBlock(nb.id);
    this.touch();
    this.emitState();
    return nb.id;
  };

  Editor.prototype.openCode = function (id) {
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    var pre = node ? node.querySelector('.ne-code') : null;
    if (!pre) { this.focusBlock(id); return false; }
    pre.hidden = false;
    try {
      pre.focus({ preventScroll: false });
      var r = document.createRange();
      r.selectNodeContents(pre);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch (e) {}
    return true;
  };

  Editor.prototype.lastBlockId = function () {
    var bs = this.doc.blocks;
    return bs.length ? bs[bs.length - 1].id : null;
  };

  Editor.prototype.convert = function (id, ty, lv, extra) {
    var hit = this.blockAt(id);
    if (!hit) return;
    var before = this.snapshot();
    this.readBlock(this.root.querySelector('[data-bid="' + id + '"]'));
    var old = hit.b;
    if (old.ty === ty && (ty !== 'h' || (old.lv || 2) === (lv || 2)) &&
        !(extra && extra.cal && calKind(old) !== extra.cal)) return;
    var rt = old.rt || null;
    if (!rt && old.items) {
      rt = [];
      for (var i = 0; i < old.items.length; i++) {
        if (i) rt.push({ s: '\n' });
        rt = rt.concat(old.items[i].rt || []);
      }
    }
    /*@3.NOEJ.59*/
    if (!rt || !rt.length) {
      if (old.ty === 'code') rt = [{ s: old.src || '' }];
      else if (old.ty === 'math') rt = [{ s: old.tex || '' }];
      else if (old.ty === 'img') rt = [{ s: old.url || old.alt || '' }];
      else if (old.ty === 'tbl') {
        var cells = [];
        (old.rows || []).forEach(function (row) {
          var line = row.map(function (c) { return B().runsToText(c.rt || []); })
                        .filter(function (x) { return x; }).join(' | ');
          if (line) cells.push(line);
        });
        rt = cells.length ? [{ s: cells.join('\n') }] : rt;
      }
    }
    var nb = B().blank(ty, lv ? { lv: lv } : null);
    /*@3.NOEJ.60*/
    KEEP.forEach(function (k) { if (old[k] != null) nb[k] = old[k]; });
    nb.id = old.id;
    /*@3.NOEJ.56*/
    if (old.fp) nb.fp = old.fp;
    if (TEXTY[ty]) nb.rt = rt || [];
    else if (LISTY[ty]) {
      if (old.items && old.items.length) nb.items = old.items;
      else nb.items = splitLines(rt || []);
    } else if (ty === 'code') nb.src = B().runsToText(rt || []);
    /*@3.NOEJ.32*/
    else if (ty === 'math') nb.tex = B().runsToText(rt || []).trim();
    else if (ty === 'tbl') { if (rt && rt.length) nb.rows[0][0] = { rt: rt }; }
    else if (ty === 'img') {
      var maybe = B().httpsOnly(B().runsToText(rt || []).trim());
      if (maybe) nb.url = maybe;
      else nb.alt = B().runsToText(rt || []).trim();
    }
    if (extra) for (var xk in extra) nb[xk] = extra[xk];
    this.doc.blocks[hit.i] = nb;
    this.pushUndo(before);
    this.renderOne(nb.id);
    this.focusBlock(nb.id);
    this.touch();
    this.emitState();
  };

  Editor.prototype.setCallout = function (id, kind) {
    var hit = this.blockAt(id);
    if (!hit || hit.b.ty !== 'callout') return;
    if (!CAL[kind]) return;
    var before = this.snapshot();
    hit.b.cal = kind;
    delete hit.b.ct; delete hit.b.ci;
    this.pushUndo(before);
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (node) {
      node.setAttribute('data-cal', kind);
      var hd = node.querySelector('.ne-cal-h');
      if (hd) paintCalHead(hd, kind, hit.b);
    }
    this.touch();
    this.emitState();
  };

  function paintCalHead(hd, kind, b) {
    var c = CAL[kind] || CAL.note;
    var ct = b && b.ct ? String(b.ct).slice(0, 80) : '';
    var ci = b && /^fa-[a-z0-9-]{2,40}$/.test(String(b.ci || '')) ? b.ci : c.icon;
    hd.innerHTML = '<i class="fa-solid ' + (ct ? ci : c.icon) + '" aria-hidden="true"></i>' +
      '<span>' + B().esc(ct || L(c.ar, c.en)) + '</span>';
    hd.setAttribute('aria-label',
      L('نوعُ الصندوق: ', 'Box kind: ') + (ct || L(c.ar, c.en)) +
      L(' — اضغطْ لتغييره', ' — click to change'));
  }

  function splitLines(rt) {
    var items = [], cur = [];
    for (var i = 0; i < rt.length; i++) {
      var parts = String(rt[i].s || '').split('\n');
      for (var j = 0; j < parts.length; j++) {
        if (j) { items.push({ rt: cur }); cur = []; }
        if (parts[j]) cur.push(Object.assign({}, rt[i], { s: parts[j] }));
      }
    }
    items.push({ rt: cur });
    return items.length ? items : [{ rt: [] }];
  }

  /*@3.NOEJ.250*/
  function runSlot(b, which) {
    if (TEXTY[b.ty]) {
      return { k: -1, get: function () { return b.rt || []; },
               set: function (v) { b.rt = v; } };
    }
    if (LISTY[b.ty] && b.items && b.items.length) {
      var k = which === 'head' ? 0 : b.items.length - 1;
      var it = b.items[k];
      return { k: k, get: function () { return it.rt || []; },
               set: function (v) { it.rt = v; } };
    }
    return null;
  }

  Editor.prototype.caretIn = function (id, slotK, at) {
    /*@3.NOEJ.300*/
    if (this._win) this.winShow(id);
    var fresh = this.root.querySelector('[data-bid="' + id + '"]');
    if (!fresh) return;
    var t = slotK >= 0
      ? fresh.querySelectorAll('.ne-li')[slotK]
      : fresh.querySelector('.ne-text');
    if (!t) { this.focusBlock(id); return; }
    try { t.focus({ preventScroll: true }); } catch (eC) { t.focus(); }
    this.keepInView(t);
    selectRange(t, at, at);
  };

  Editor.prototype.joinItems = function (id, k) {
    var hit = this.blockAt(id);
    if (!hit || !LISTY[hit.b.ty] || !hit.b.items) return false;
    if (k < 1 || k >= hit.b.items.length) return false;
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    if (!node) return false;
    var before = this.snapshot();
    this.readBlock(node);
    var b = hit.b;
    var prevIt = b.items[k - 1], mine = b.items[k];
    var at = runsLen(prevIt.rt);
    prevIt.rt = joinRuns([prevIt.rt || [], mine.rt || []]);
    b.items.splice(k, 1);
    this.pushUndo(before);
    this.renderOne(id);
    this.caretIn(id, k - 1, at);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.joinBlocks = function (prevId, curId) {
    var ph = this.blockAt(prevId), ch = this.blockAt(curId);
    if (!ph || !ch || ph.i >= ch.i) return false;
    if (ph.b.fp || ch.b.fp) return false;
    var pslot = runSlot(ph.b, 'tail');
    var mslot = runSlot(ch.b, 'head');
    if (!pslot || !mslot) return false;
    var pnode = this.root.querySelector(':scope > [data-bid="' + prevId + '"]');
    var cnode = this.root.querySelector(':scope > [data-bid="' + curId + '"]');
    if (!pnode || !cnode) return false;
    var before = this.snapshot();
    this.readBlock(pnode);
    this.readBlock(cnode);
    pslot = runSlot(ph.b, 'tail');
    mslot = runSlot(ch.b, 'head');
    if (!pslot || !mslot) return false;
    var at = runsLen(pslot.get());
    pslot.set(joinRuns([pslot.get(), mslot.get()]));
    var keep = LISTY[ch.b.ty] && ch.b.items && ch.b.items.length > 1;
    if (keep) ch.b.items.splice(0, 1);
    else this.doc.blocks.splice(ch.i, 1);
    this.pushUndo(before);
    this.renderOne(prevId);
    if (keep) this.renderOne(curId); else this.renderDrop(curId);
    this.caretIn(prevId, pslot.k, at);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.266*/
  Editor.prototype.unlistItem = function (id, k) {
    var hit = this.blockAt(id);
    if (!hit || !LISTY[hit.b.ty] || !hit.b.items || !hit.b.items[k]) return false;
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    if (!node) return false;
    this.readBlock(node);
    var b = hit.b;
    if (b.items.length < 2) {
      this.convert(id, 'p');
      this.caretIn(id, -1, 0);
      return true;
    }
    var before = this.snapshot();
    var p = B().blank('p');
    p.rt = joinRuns([b.items[k].rt || []]);
    var key = ['ff', 'dir', 'al', 'fs'], q;
    for (q = 0; q < key.length; q++) if (b[key[q]] != null) p[key[q]] = b[key[q]];
    b.items.splice(k, 1);
    this.doc.blocks.splice(hit.i, 0, p);
    this.pushUndo(before);
    this.renderOne(id);
    var pAt = this.blockAt(p.id);
    if (pAt) this.renderInsert(pAt.i, [p]); else this.render();
    this.caretIn(p.id, -1, 0);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.flowNeighbour = function (i, dir) {
    var bs = this.doc.blocks, j = i + dir;
    while (j >= 0 && j < bs.length && (bs[j].fp || bs[j].ty === 'pb')) j += dir;
    return (j >= 0 && j < bs.length) ? bs[j] : null;
  };

  Editor.prototype.joinAt = function (id, edn, dir) {
    var hit = this.blockAt(id);
    if (!hit || hit.b.fp) return false;
    if (edn && edn.classList.contains('ne-li')) {
      var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
      var lis = node ? [].slice.call(node.querySelectorAll('.ne-li')) : [];
      var k = lis.indexOf(edn);
      if (k < 0) return false;
      /*@3.NOEJ.258*/
      if (dir < 0) {
        if (parseInt(edn.getAttribute('data-lv') || '0', 10) > 0) {
          return this.indentItem(node, hit.b, edn, -1);
        }
        if (k > 0) return this.joinItems(id, k);
        return this.unlistItem(id, 0);
      }
      if (k < lis.length - 1) return this.joinItems(id, k + 1);
      return false;
    }
    var nb = this.flowNeighbour(hit.i, dir < 0 ? -1 : 1);
    if (!nb) return false;
    return dir < 0 ? this.joinBlocks(nb.id, id) : this.joinBlocks(id, nb.id);
  };

  /*@3.NOEJ.251*/
  Editor.prototype.pasteHost = function () {
    var ed = this.focusEd && this.root.contains(this.focusEd) ? this.focusEd : null;
    var node = ed && ed.closest ? ed.closest('[data-bid]') : null;
    if (node) return node;
    var kids = this.root.children;
    for (var i = kids.length - 1; i >= 0; i--) {
      var k = kids[i];
      if (!k.hasAttribute || !k.hasAttribute('data-bid')) continue;
      if (k.hasAttribute('data-fp')) continue;
      return k;
    }
    return null;
  };

  /*@3.NOEJ.337*/
  function snapClip(cd) {
    if (!cd) return null;
    var html = '', txt = '';
    try { html = cd.getData('text/html') || ''; } catch (e) {}
    try { txt = cd.getData('text/plain') || ''; } catch (e) {}
    if (!html && !txt) return null;
    return {
      html: html, txt: txt,
      getData: function (t) {
        if (t === 'text/html') return this.html;
        if (t === 'text/plain') return this.txt;
        return '';
      },
      files: null, items: null
    };
  }

  /*@3.NOEJ.363*/
  function imgsIn(dt) {
    if (!dt) return null;
    var out = [], i;
    var fs = dt.files;
    if (fs && fs.length) {
      for (i = 0; i < fs.length; i++) if (/^image\//.test(fs[i].type)) out.push(fs[i]);
    }
    if (!out.length && dt.items) {
      for (i = 0; i < dt.items.length; i++) {
        var it = dt.items[i];
        if (it.kind !== 'file' || !/^image\//.test(it.type)) continue;
        var f = it.getAsFile ? it.getAsFile() : null;
        if (f) out.push(f);
      }
    }
    return out.length ? out : null;
  }

  /*@3.NOEJ.364*/
  Editor.prototype.takeImages = function (dt, node, intoId) {
    var self = this;
    var files = imgsIn(dt);
    var S = window.GardenNotesStore;
    if (!files || !S || !S.putImage) return false;
    var afterId = node && node.getAttribute ? node.getAttribute('data-bid') : null;
    /*@3.NOEJ.592*/
    var fill = intoId || null;
    if (!fill && afterId) {
      var tg = this.blockAt(afterId);
      if (tg && tg.b.ty === 'img' && !B().imgSrc(tg.b.url)) fill = afterId;
    }
    if (fill) this.imgBusy(fill, true);
    var put = function (f) {
      return S.putImage(f, { name: f.name || '' })['catch'](function (e) {
        if (e && e.code === 'img_too_large') return squeeze(f, 3000).then(function (sm) { return S.putImage(sm, { name: f.name || '' }); });
        throw e;
      });
    };
    var chain = Promise.resolve();
    files.slice(0, 6).forEach(function (f) {
      chain = chain.then(function () { return put(f); }).then(function (rid) {
        if (!self.root || !self.root.isConnected) return;
        if (fill) {
          var into = fill;
          fill = null;
          self.imgBusy(into, false);
          self.imgSet(into, 'byte-local:' + rid, { loc: 1 });
          afterId = into;
        } else {
          var made = self.addBlock('img', afterId, null,
            { url: 'byte-local:' + rid, alt: '', loc: 1 });
          afterId = made || afterId;
        }
        if (self.opts.onLocalImage) self.opts.onLocalImage(1);
      }, function (err) {
        if (fill) self.imgBusy(fill, false);
        if (self.opts.onLocalImage) self.opts.onLocalImage(0, err && err.code);
      });
    });
    return true;
  };

  Editor.prototype.pasteRun = function (cd, node, mode) {
    var self = this;
    if (!node) node = this.pasteHost();
    if (!node) return false;
    needEmoji().then(function () { self.emojiSweep(); });
    var snap = (cd && cd.__snap) ? cd : snapClip(cd);
    if (!mode && this._plainNext) { mode = 'text'; this._plainNext = false; }
    /*@3.NOEJ.352*/
    var flat0 = '';
    try { flat0 = (snap ? snap.txt : (cd ? cd.getData('text/plain') : '')) || ''; }
    catch (e0) { flat0 = ''; }
    var CC0 = window.GardenNotesCode;
    var asMmd = mode !== 'text' && !!(CC0 && CC0.looksMermaid && CC0.looksMermaid(flat0));
    var res;
    if (asMmd) {
      res = { blocks: [B().blank('code', { lang: 'mermaid', dgm: 1,
        src: flat0.replace(/\r\n?/g, '\n').replace(/\s+$/, '') })] };
    } else if (mode === 'text' && snap) {
      res = { blocks: SAN().fromPlain ? SAN().fromPlain(snap.txt) : [] };
    } else {
      res = SAN().fromClipboard(snap || cd);
    }
    if (res.rejectedImage) {
      /*@3.NOEJ.361*/
      if (this.takeImages(cd, node)) return true;
      if (this.opts.onImagePaste) this.opts.onImagePaste();
      return false;
    }
    var blocks = res.blocks || [];
    /*@3.NOEJ.96*/
    var hasHtml = false;
    try { hasHtml = !!(cd && cd.getData('text/html')); } catch (eh) {}
    if (!hasHtml && !asMmd) {
      var flat = cd ? cd.getData('text/plain') : '';
      if (flat && B().looksMarkdown && B().looksMarkdown(flat)) {
        blocks = B().fromMarkdown(flat);
      }
    }
    if (!blocks.length) return false;
    /*@3.NOEJ.186*/
    this.stampDir(blocks);

    /*@3.NOEJ.536*/
    var cut = this.pasteSel(node);
    if (cut && this.pasteInline(node, cut, blocks, hasHtml ? '' : flat0)) return true;
    if (cut && !cut.r.collapsed) cut.r.deleteContents();

    var before = this.snapshot();
    this.readBlock(node);
    var id = node.getAttribute('data-bid');
    var hit = this.blockAt(id);
    var at = hit ? hit.i + 1 : this.doc.blocks.length;

    /*@3.NOEJ.116*/
    var host = hit && hit.b.fp ? hit.b : null;
    /*@3.NOEJ.138*/
    if (hit) {
      for (var s = 0; s < blocks.length; s++) {
        if (hit.b.ff && blocks[s].ff == null) blocks[s].ff = hit.b.ff;
        if (hit.b.dir && blocks[s].dir == null) blocks[s].dir = hit.b.dir;
        if (hit.b.al && blocks[s].al == null) blocks[s].al = hit.b.al;
        if (hit.b.fs && blocks[s].fs == null) blocks[s].fs = hit.b.fs;
      }
    }
    if (hit && TEXTY[hit.b.ty] && !B().runsToText(hit.b.rt).trim() && blocks.length) {
      this.doc.blocks.splice(hit.i, 1);
      at = hit.i;
    }
    if (host) {
      var py = this.fpY(host), px = host.fp.x, zTop = this.topZ();
      for (var q = 0; q < blocks.length; q++) {
        blocks[q].fp = { x: px, y: py };
        this.fpLive(blocks[q], py);
        blocks[q].wm = host.wm || 'fit';
        blocks[q].z = zTop + 1 + q;
        py += 34;
      }
    }
    for (var i = 0; i < blocks.length; i++) this.doc.blocks.splice(at + i, 0, blocks[i]);
    this.pushUndo(before);
    /*@3.NOEJ.149*/
    if (hit && this.doc.blocks.indexOf(hit.b) === -1) {
      var goneN = this.root.querySelector(':scope > [data-bid="' + hit.b.id + '"]');
      if (goneN) goneN.remove();
    }
    this.renderInsert(at, blocks);
    /*@3.NOEJ.255*/
    if (!this.natOk()) { this._nat = null; this._engStale = true; this.settled(); }
    if (host) this.layoutFree();
    this.focusBlock(blocks[blocks.length - 1].id);
    this.touch();
    this.emitState();
    if (snap) {
      this._pasteOpt = {
        before: before, at: at, n: blocks.length,
        nodeId: id, snap: snap, mode: mode || 'full',
        last: blocks[blocks.length - 1].id
      };
      this.showPasteOpts();
    }
    return true;
  };

  /*@3.NOEJ.537*/
  /*@3.NOEJ.543*/
  Editor.prototype.unfoldAll = function () {
    var bs = this.doc && this.doc.blocks, n = 0, i;
    if (!bs) return 0;
    var u = this._unfold || (this._unfold = {}), ids = [];
    for (i = 0; i < bs.length; i++) if (bs[i].fmt === 'ans' && !u[bs[i].id]) { u[bs[i].id] = 1; n++; ids.push(bs[i].id); }
    if (!n) return 0;
    var fo = this.root.querySelectorAll(':scope > [data-fold]');
    for (i = 0; i < fo.length; i++) fo[i].removeAttribute('data-fold');
    /*@3.NOEJ.573*/
    if (this._nat && this.natOk && this.natOk()) {
      var live = this.bidMap(), off = [];
      for (i = 0; i < ids.length; i++) if (!live[ids[i]]) off.push(ids[i]);
      if (off.length) { try { this.natMeasure(off); } catch (eM) {} }
    }
    this._engStale = true;
    this.settled();
    return n;
  };

  Editor.prototype.pasteSel = function (node) {
    var edn = this.currentEditable();
    if (!edn || !node.contains(edn)) return null;
    var s = window.getSelection();
    if (!s || !s.rangeCount) return null;
    var r = s.getRangeAt(0);
    if (!edn.contains(r.startContainer) || !edn.contains(r.endContainer)) return null;
    return { ed: edn, r: r };
  };

  /*@3.NOEJ.538*/
  var INLINE_KEYS = { id: 1, ty: 1, rt: 1, dir: 1 };
  /*@3.NOEJ.574*/
  function cellRuns(blocks, flat) {
    var rt = [], q, bq, parts, ii;
    for (q = 0; q < blocks.length; q++) {
      bq = blocks[q]; parts = Array.isArray(bq.rt) ? bq.rt : null;
      if (!parts && Array.isArray(bq.items)) {
        parts = [];
        for (ii = 0; ii < bq.items.length; ii++) { if (ii) parts.push({ s: '\n' }); parts = parts.concat((bq.items[ii] && bq.items[ii].rt) || []); }
      }
      if (!parts && bq.src != null) parts = [{ s: String(bq.src) }];
      if (!parts || !parts.length) continue;
      if (rt.length) rt.push({ s: '\n' });
      rt = rt.concat(parts);
    }
    if (!rt.length && flat) rt = [{ s: String(flat).replace(/\r\n?/g, '\n').replace(/\n+$/, '') }];
    return rt.length ? { ty: 'p', rt: rt } : null;
  }
  Editor.prototype.pasteInline = function (node, cut, blocks, flat) {
    var inCell = !!(cut.ed.closest && cut.ed.closest('.ne-cell, td, th'));
    if (inCell && blocks.length) blocks = [cellRuns(blocks, flat)];
    if (blocks.length !== 1 || !blocks[0]) return false;
    var nb = blocks[0];
    if (nb.ty !== 'p' || !Array.isArray(nb.rt) || !nb.rt.length) return false;
    for (var k in nb) if (Object.prototype.hasOwnProperty.call(nb, k) && !INLINE_KEYS[k]) return false;
    if (!inCell && cut.r.collapsed && !(cut.ed.textContent || '').replace(/\u200b/g, '').trim()) return false;
    var rt = nb.rt;
    /*@3.NOEJ.539*/
    if (flat && rt.length === 1 && Object.keys(rt[0]).length === 1 && !/[\r\n]/.test(flat) &&
        flat.trim() === String(rt[0].s || '').trim()) rt = [{ s: flat }];
    var box = document.createElement('span');
    box.innerHTML = B().runsToHtml(rt);
    if (!box.firstChild) return false;
    var before = this.snapshot();
    var r = cut.r, last = box.lastChild, frag = document.createDocumentFragment();
    while (box.firstChild) frag.appendChild(box.firstChild);
    r.deleteContents();
    r.insertNode(frag);
    var s = window.getSelection(), rr = document.createRange();
    rr.setStartAfter(last); rr.collapse(true);
    s.removeAllRanges(); s.addRange(rr);
    cut.ed.dispatchEvent(new Event('input', { bubbles: true }));
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.338*/
  /*@3.NOEJ.343*/
  var CB_OK = !!(window.navigator && navigator.clipboard &&
                 (navigator.clipboard.read || navigator.clipboard.readText));

  Editor.prototype.pasteFromClipboard = function (mode, atId) {
    var self = this;
    var ar = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
    function say(m) { if (self.opts && self.opts.onNote) self.opts.onNote(m); }
    if (!CB_OK) {
      say(ar ? 'متصفّحُك لا يتيح قراءةَ الحافظة' : 'This browser cannot read the clipboard');
      return Promise.resolve(false);
    }
    var node = atId ? this.root.querySelector(':scope > [data-bid="' + atId + '"]') : null;
    if (!node) node = this.pasteHost();

    function run(html, txt) {
      if (!html && !txt) {
        say(ar ? 'الحافظةُ فارغة' : 'The clipboard is empty');
        return false;
      }
      var snap = { html: html || '', txt: txt || '', __snap: true,
                   files: null, items: null,
                   getData: function (t) {
                     if (t === 'text/html') return this.html;
                     if (t === 'text/plain') return this.txt;
                     return '';
                   } };
      var okp = self.pasteRun(snap, node, mode === 'text' ? 'text' : undefined);
      if (!okp) say(ar ? 'تعذّر اللصق' : 'Could not paste');
      return okp;
    }

    if (navigator.clipboard.read) {
      return navigator.clipboard.read().then(function (items) {
        /*@3.NOEJ.594*/
        var jobs = [], html = '', txt = '', pic = null;
        (items || []).forEach(function (it) {
          (it.types || []).forEach(function (ty) {
            if (!pic && /^image[/]/.test(ty)) pic = { it: it, ty: ty };
          });
        });
        if (pic && mode !== 'text') {
          return pic.it.getType(pic.ty).then(function (bl) {
            var f = new File([bl], 'pasted.' + (pic.ty.split('/')[1] || 'png'), { type: pic.ty });
            return self.takeImages({ files: [f] }, node);
          });
        }
        (items || []).forEach(function (it) {
          (it.types || []).forEach(function (ty) {
            if (ty === 'text/html') jobs.push(it.getType(ty).then(function (b) { return b.text(); })
              .then(function (s) { html = html || s; }));
            else if (ty === 'text/plain') jobs.push(it.getType(ty).then(function (b) { return b.text(); })
              .then(function (s) { txt = txt || s; }));
          });
        });
        return Promise.all(jobs).then(function () { return run(html, txt); });
      })['catch'](function () {
        /*@3.NOEJ.344*/
        if (!navigator.clipboard.readText) { say(ar ? 'لم يُسمح بقراءة الحافظة' : 'Clipboard access was denied'); return false; }
        return navigator.clipboard.readText().then(function (s) { return run('', s); })
          ['catch'](function () { say(ar ? 'لم يُسمح بقراءة الحافظة' : 'Clipboard access was denied'); return false; });
      });
    }
    return navigator.clipboard.readText().then(function (s) { return run('', s); })
      ['catch'](function () { say(ar ? 'لم يُسمح بقراءة الحافظة' : 'Clipboard access was denied'); return false; });
  };

  Editor.prototype.hidePasteOpts = function () {
    if (this._pasteBar && this._pasteBar.parentNode) this._pasteBar.parentNode.removeChild(this._pasteBar);
    this._pasteBar = null;
  };

  Editor.prototype.showPasteOpts = function () {
    var self = this;
    var st = this._pasteOpt;
    if (!st || this.readOnly) return;
    this.hidePasteOpts();
    var ar = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
    function L(a, e) { return ar ? a : e; }

    var bar = document.createElement('div');
    bar.className = 'ne-pasteopt';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', L('خيارات اللصق', 'Paste options'));
    var opts = [
      { m: 'full', i: 'fa-paste', ar: 'لصقٌ كامل', en: 'Keep formatting' },
      { m: 'text', i: 'fa-font', ar: 'النصُّ فقط', en: 'Text only' }
    ];
    if (clipAny()) opts.push({ m: 'blocks', i: 'fa-cubes', ar: 'العناصرُ المنسوخة', en: 'Copied blocks' });

    var h = '';
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      h += '<button type="button" class="ne-po-b' + (o.m === st.mode ? ' on' : '') +
        '" data-pm="' + o.m + '" aria-pressed="' + (o.m === st.mode ? 'true' : 'false') +
        '" aria-label="' + L(o.ar, o.en) + '" title="' + L(o.ar, o.en) + '">' +
        '<i class="fa-solid ' + o.i + '" aria-hidden="true"></i>' +
        '<span>' + L(o.ar, o.en) + '</span></button>';
    }
    bar.innerHTML = h;

    var anchor = this.root.querySelector(':scope > [data-bid="' + st.last + '"]');
    if (!anchor) return;
    anchor.appendChild(bar);
    this._pasteBar = bar;

    bar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pm]');
      if (!b) return;
      e.preventDefault();
      self.repaste(b.getAttribute('data-pm'));
    });

    if (this._poTimer) clearTimeout(this._poTimer);
    this._poTimer = setTimeout(function () { self.hidePasteOpts(); }, 12000);
  };

  Editor.prototype.repaste = function (mode) {
    var st = this._pasteOpt;
    if (!st || mode === st.mode) { this.hidePasteOpts(); return; }
    this.hidePasteOpts();
    /*@3.NOEJ.339*/
    this.swapDoc(unsnap(st.before));
    var popped = this.undo.pop();
    this._undoB = Math.max(0, (this._undoB || 0) - (popped ? popped.length : 0));

    var node = st.nodeId
      ? this.root.querySelector(':scope > [data-bid="' + st.nodeId + '"]')
      : null;
    if (!node) node = this.pasteHost();

    if (mode === 'blocks') {
      this.pasteBlocks();
      this._pasteOpt = null;
      return;
    }
    st.snap.__snap = true;
    this.pasteRun(st.snap, node, mode);
  };

  Editor.prototype.remove = function (id) {
    var hit = this.blockAt(id);
    if (!hit) return;
    var before = this.snapshot();
    this.doc.blocks.splice(hit.i, 1);
    var grew = false;
    if (!hasFlow(this.doc.blocks)) { this.doc.blocks.push(B().blank('p')); grew = true; }
    this.pushUndo(before);
    if (grew) this.render(); else this.renderDrop(id);
    var next = this.doc.blocks[Math.max(0, hit.i - 1)];
    if (next) this.focusBlock(next.id);
    this.touch();
    this.emitState();
  };

  /*@3.NOEJ.10*/
  Editor.prototype.move = function (id, dir) {
    var hit = this.blockAt(id);
    if (!hit) return false;
    var to = hit.i + (dir < 0 ? -1 : 1);
    if (to < 0 || to >= this.doc.blocks.length) return false;
    var before = this.snapshot();
    this.readAll();
    var bs = this.doc.blocks;
    var moved = bs.splice(hit.i, 1)[0];
    bs.splice(to, 0, moved);
    this.pushUndo(before);
    /*@3.NOEJ.247*/
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    if (!node) { this.render(); }
    else {
      var nxt = bs[to + 1];
      var anchor = nxt
        ? this.root.querySelector(':scope > [data-bid="' + nxt.id + '"]')
        : this.root.querySelector(':scope > .ne-tail');
      if (anchor) this.root.insertBefore(node, anchor);
      else this.root.appendChild(node);
      if (this.natMove(hit.i, to)) this.reflowEng();
      else { this._nat = null; this._engStale = true; this.settled(); }
      this.applyEng();
      if (this.opts.onLayout) this.opts.onLayout();
    }
    this.focusBlock(id);
    if (node && node.scrollIntoView) node.scrollIntoView({ block: 'nearest' });
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.duplicate = function (id) {
    var hit = this.blockAt(id);
    if (!hit) return;
    var before = this.snapshot();
    this.readAll();
    var copy = JSON.parse(JSON.stringify(hit.b));
    copy.id = B().uid();
    this.doc.blocks.splice(hit.i + 1, 0, copy);
    this.pushUndo(before);
    this.renderInsert(hit.i + 1, [copy]);
    this.focusBlock(copy.id);
    this.touch();
    this.emitState();
  };

  /*@3.NOEJ.33*/
  Editor.prototype.blockSel = function () {
    if (!this._bsel) this._bsel = {};
    return this._bsel;
  };

  /*@3.NOEJ.407*/
  Editor.prototype.cardBlocks = function (id, on) {
    var before = this.snapshot();
    var bs = this.doc.blocks, i, b;
    var KEYS = ['card', 'cardStart', 'cardEnd', 'cardTitle', 'cardTone', 'cardColor', 'cardLayout'];
    var strip = function (x) { for (var k = 0; k < KEYS.length; k++) delete x[KEYS[k]]; };
    if (!on) {
      var hit = this.blockAt(id);
      if (!hit || !hit.b.card) return;
      var cid = hit.b.card;
      for (i = 0; i < bs.length; i++) if (bs[i].card === cid) strip(bs[i]);
    } else {
      var sel = this.selectedBlocks(), ids = {};
      if (sel.length > 1) { for (i = 0; i < sel.length; i++) ids[sel[i].b.id] = 1; }
      else ids[id] = 1;
      var a = -1, z = -1;
      for (i = 0; i < bs.length; i++) if (ids[bs[i].id]) { if (a < 0) a = i; z = i; }
      if (a < 0) return;
      var cid2 = B().uid('c');
      var first = true, lastI = -1;
      for (i = a; i <= z; i++) {
        b = bs[i];
        if (b.fp) continue;
        strip(b);
        b.card = cid2;
        if (first) { b.cardStart = 1; if (b.ty === 'h') b.cardTitle = 1; first = false; }
        lastI = i;
      }
      if (lastI >= 0) bs[lastI].cardEnd = 1;
    }
    this.pushUndo(before);
    this.clearBlockSel();
    if (this._selMode) this.setSelectMode(false);
    this.render();
    this.touch();
    this.emitState();
  };

  Editor.prototype.cardTone = function (id, tone) {
    var hit = this.blockAt(id);
    if (!hit || !hit.b.card) return;
    if (!CARD_TONE_RE.test(tone)) return;
    var before = this.snapshot();
    var cid = hit.b.card, bs = this.doc.blocks, ids = [];
    for (var i = 0; i < bs.length; i++) {
      if (bs[i].card !== cid) continue;
      if (tone === 'auto') delete bs[i].cardTone; else bs[i].cardTone = tone;
      delete bs[i].cardColor;
      ids.push(bs[i].id);
    }
    this.pushUndo(before);
    this.renderSome(ids);
    this.touch();
  };

  /*@3.NOEJ.418*/
  var CARD_TONE_RE = /^(auto|white|grey|sky|amber|rose|emerald|violet)$/;
  var CARD_TONE_OLD = { indigo: 'auto', slate: 'grey', teal: 'emerald' };
  function cardToneOf(b) {
    var t = String(b.cardTone || b.cardColor || 'auto').toLowerCase();
    if (CARD_TONE_OLD[t]) t = CARD_TONE_OLD[t];
    return CARD_TONE_RE.test(t) ? t : 'auto';
  }
  /*@3.NOEJ.472*/
  Editor.prototype.cardToneFor = function (b, cid) {
    var own = cardToneOf(b);
    if (own !== 'auto') return own;
    var cs = (this.doc && this.doc.cards && typeof this.doc.cards === 'object') ? this.doc.cards : null;
    var ts = cs && Array.isArray(cs.t) ? cs.t.filter(function (t) { return CARD_TONE_RE.test(String(t)) && t !== 'auto'; }) : [];
    if (!ts.length) return 'auto';
    return ts[this.cardAlt(cid) % ts.length];
  };
  Editor.prototype.dgmZoom = function (host, how) {
    var z = parseFloat(host.getAttribute('data-vz')) || 1;
    var svg = host.querySelector('svg');
    if (!svg) return;
    if (how === 'fit') z = 1;
    else z = Math.max(1, Math.min(6, Math.round(z * (how === '+' ? 1.25 : 0.8) * 100) / 100));
    /*@3.NOEJ.490*/
    if (z <= 1.001) {
      host.removeAttribute('data-vz'); host.style.removeProperty('--dgm-vz');
      svg.style.removeProperty('width'); svg.style.removeProperty('height'); svg.style.removeProperty('max-width');
      host.style.removeProperty('block-size'); host.style.removeProperty('box-sizing');
      host.scrollLeft = 0; host.scrollTop = 0;
      host.__dgmBase = null;
      return;
    }
    if (!host.__dgmBase) {
      var zz = this.zoomOf() || 1, rS = svg.getBoundingClientRect(), rH = host.getBoundingClientRect();
      host.__dgmBase = { w: rS.width / zz, h: rH.height / zz };
    }
    var base = host.__dgmBase;
    host.setAttribute('data-vz', String(z));
    host.style.setProperty('--dgm-vz', String(z));
    host.style.boxSizing = 'border-box';
    host.style.blockSize = base.h.toFixed(2) + 'px';
    svg.style.maxWidth = 'none';
    svg.style.width = (base.w * z).toFixed(2) + 'px';
    svg.style.height = 'auto';
  };
  Editor.prototype.wireDgmPan = function (root) {
    var self = this;
    root.addEventListener('pointerdown', function (e) {
      var host = e.target.closest ? e.target.closest('.ne-dgm[data-vz]') : null;
      if (!host || e.button !== 0) return;
      e.preventDefault();
      try { var selP = window.getSelection(); if (selP && !selP.isCollapsed && host.contains(selP.anchorNode)) selP.removeAllRanges(); } catch (eS) {}
      var sx = e.clientX, sy = e.clientY, sl = host.scrollLeft, st = host.scrollTop, moved = false, pid = e.pointerId;
      var mv = function (ev) { if (ev.pointerId !== pid) return; var dx = ev.clientX - sx, dy = ev.clientY - sy; if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return; moved = true; host.scrollLeft = sl - dx; host.scrollTop = st - dy; ev.preventDefault(); };
      var up = function (ev) { if (ev.pointerId !== pid) return; host.removeEventListener('pointermove', mv); host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up); try { host.releasePointerCapture(pid); } catch (e2) {} if (moved) host.setAttribute('data-panned', '1'); setTimeout(function () { host.removeAttribute('data-panned'); }, 0); };
      try { host.setPointerCapture(pid); } catch (e1) {}
      host.addEventListener('pointermove', mv); host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    });
    root.addEventListener('wheel', function (e) {
      if (!e.ctrlKey) return;
      var host = e.target.closest ? e.target.closest('.ne-dgm') : null;
      if (!host || !host.querySelector('svg')) return;
      e.preventDefault();
      self.dgmZoom(host, e.deltaY < 0 ? '+' : '-');
    }, { passive: false });
  };
  Editor.prototype.recardTones = function () {
    var wraps = this.root.querySelectorAll(':scope > [data-card]'), i, hit, t;
    for (i = 0; i < wraps.length; i++) {
      hit = this.blockAt(wraps[i].getAttribute('data-bid'));
      if (!hit) continue;
      t = this.cardToneFor(hit.b, hit.b.card);
      if (t === 'auto') wraps[i].removeAttribute('data-card-tone'); else wraps[i].setAttribute('data-card-tone', t);
    }
  };
  Editor.prototype.applyCardOpts = function () {
    var cs = (this.doc && this.doc.cards && typeof this.doc.cards === 'object') ? this.doc.cards : null;
    var fs = cs && /^(sm|md|lg|xl)$/.test(String(cs.fs || '')) ? cs.fs : '';
    if (fs) this.root.setAttribute('data-cardfs', fs); else this.root.removeAttribute('data-cardfs');
    /*@3.NOEJ.544*/
    var sk = cs ? (SKIN_ALIAS.hasOwnProperty(cs.sk) ? SKIN_ALIAS[cs.sk] : (SKINS[cs.sk] ? cs.sk : '')) : '';
    if (sk) this.root.setAttribute('data-card-skin', sk); else this.root.removeAttribute('data-card-skin');
    this.applyDocFs();
  };
  /*@3.NOEJ.489*/
  Editor.prototype.applyDocFs = function () {
    var v = this.doc ? Number(this.doc.fs) : 0;
    if (v >= 10 && v <= 40 && Math.abs(v - 16) >= 0.5) { this.root.setAttribute('data-docfs', String(v)); this.root.style.setProperty('--ne-docfs', v + 'px'); }
    else { this.root.removeAttribute('data-docfs'); this.root.style.removeProperty('--ne-docfs'); }
  };
  /*@3.NOEJ.572*/
  Editor.prototype.cardOptsChanged = function () {
    this.applyCardOpts();
    var C = window.GardenNotesCode;
    if (C && C.resizeAll) { try { C.resizeAll(this.root); } catch (eR) {} }
    delete this.doc.eng;
    this._nat = null; this._engStale = true;
    this.render();
    this.settled();
  };
  Editor.prototype.setDocFs = function (px) {
    var v = Number(px);
    if (!(v >= 10 && v <= 40) || Math.abs(v - 16) < 0.5) delete this.doc.fs; else this.doc.fs = Math.round(v * 10) / 10;
    var C = window.GardenNotesCode;
    if (C && C.resizeAll) { try { C.resizeAll(this.root); } catch (eR) {} }
    delete this.doc.eng;
    this._nat = null; this._engStale = true;
    this.render();
    this.settled();
    this.touch();
    this.emitState();
    return true;
  };
  /*@3.NOEJ.533*/
  var CARD_LAYOUTS = { glossary: 1, sequence: 1, compare: 1 };
  var SKINS = { herbal: 1, cornell: 1, journey: 1 };
  /*@3.NOEJ.549*/
  var SKIN_ALIAS = { notebook: 'cornell', index: 'cornell', magazine: 'herbal', planner: 'journey', bare: '' };
  /*@3.NOEJ.541*/
  var FMTS = { term: 1, nums: 1, vars: 1, codenotes: 1, timeline: 1, q: 1, qp: 1, qe: 1, ans: 1, pros: 1, cons: 1, recall: 1 };
  Editor.prototype.cardLayoutOf = function (b, cid) {
    if (b.cardLayout) return CARD_LAYOUTS[b.cardLayout] ? b.cardLayout : '';
    var bs = this.doc.blocks, c = this._layC;
    if (!c || c.bs !== bs || c.n !== bs.length) {
      c = this._layC = { bs: bs, n: bs.length, m: {} };
      for (var i = 0; i < bs.length; i++) if (bs[i].card && bs[i].cardLayout && CARD_LAYOUTS[bs[i].cardLayout]) c.m[bs[i].card] = bs[i].cardLayout;
    }
    return c.m[cid] || '';
  };
  Editor.prototype.cardAlt = function (cid) {
    var bs = this.doc.blocks, seen = {}, n = 0;
    for (var i = 0; i < bs.length; i++) {
      var c = bs[i].card;
      if (!c || bs[i].fp || seen[c]) continue;
      if (c === cid) return n % 2;
      seen[c] = 1; n++;
    }
    return 0;
  };
  Editor.prototype.renderSome = function (ids) {
    if (!ids || !ids.length || ids.length > 40) { this.render(); return; }
    for (var i = 0; i < ids.length; i++) {
      if (!this.renderOne(ids[i])) return;
    }
  };
  Editor.prototype.cardIds = function (cid) {
    var bs = this.doc.blocks, out = [];
    for (var i = 0; i < bs.length; i++) if (bs[i].card === cid) out.push(bs[i].id);
    return out;
  };

  /*@3.NOEJ.415*/
  Editor.prototype.delCard = function (id) {
    var hit = this.blockAt(id);
    if (!hit || !hit.b.card) return 0;
    var cid = hit.b.card, before = this.snapshot();
    var keep = [], gone = 0;
    for (var i = 0; i < this.doc.blocks.length; i++) {
      if (this.doc.blocks[i].card === cid) gone++; else keep.push(this.doc.blocks[i]);
    }
    if (!gone) return 0;
    if (!keep.length) keep.push(B().blank('p'));
    this.doc.blocks = keep;
    this.pushUndo(before);
    this.clearBlockSel();
    this.render();
    this.touch();
    this.emitState();
    return gone;
  };

  /*@3.NOEJ.416*/
  /*@3.NOEJ.532*/
  Editor.prototype.gardenFormat = function (ids, opts) {
    var I = window.GardenNotesImport;
    if (!I || !I.format) return -1;
    this.readAll();
    var res = I.format(this.doc, Object.assign({ ids: ids && ids.length > 1 ? ids : null }, opts || {}));
    this.adoptFormat(res.doc);
    return res.report.cards;
  };

  Editor.prototype.adoptFormat = function (nd) {
    if (!nd || !Array.isArray(nd.blocks) || !nd.blocks.length) return 0;
    var before = this.snapshot();
    this.doc.blocks = nd.blocks;
    if (nd.cards && typeof nd.cards === 'object') this.doc.cards = nd.cards;
    this._layC = null;
    delete this.doc.eng;
    this._nat = null; this._engStale = true;
    this.pushUndo(before);
    this.clearBlockSel();
    if (this._selMode) this.setSelectMode(false);
    this.render();
    this.settled();
    this.touch();
    this.emitState();
    return nd.blocks.length;
  };

  Editor.prototype.selectedBlocks = function () {
    var sel = this.blockSel(), out = [];
    for (var i = 0; i < this.doc.blocks.length; i++) {
      if (sel[this.doc.blocks[i].id]) out.push({ b: this.doc.blocks[i], i: i });
    }
    if (out.length) return out;
    return this.rangeBlocks();
  };

  /*@3.NOEJ.488*/
  Editor.prototype.rangeBlocks = function () {
    var out = [], s = null;
    try { s = window.getSelection(); } catch (e) { s = null; }
    if (!s || !s.rangeCount || s.isCollapsed) return out;
    var r = s.getRangeAt(0);
    var na = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
    var nb = r.endContainer.nodeType === 1 ? r.endContainer : r.endContainer.parentNode;
    if (!na || !nb || !this.root.contains(na) || !this.root.contains(nb)) return out;
    var ba = na.closest ? na.closest('[data-bid]') : null, bb = nb.closest ? nb.closest('[data-bid]') : null;
    if (!ba || !bb || ba === bb) return out;
    var ha = this.blockAt(ba.getAttribute('data-bid')), hb = this.blockAt(bb.getAttribute('data-bid'));
    if (!ha || !hb) return out;
    var lo = Math.min(ha.i, hb.i), hi = Math.max(ha.i, hb.i), i;
    for (i = lo; i <= hi; i++) if (this.doc.blocks[i] && !this.doc.blocks[i].fp && this.doc.blocks[i].ty !== 'pb') out.push({ b: this.doc.blocks[i], i: i });
    return out;
  };

  /*@3.NOEJ.199*/
  Editor.prototype.ensureChrome = function () {
    if (this._chrome) return this._chrome;
    var rail = el('div', 'ne-rail');
    var tick = el('button', 'ne-tick', {
      type: 'button', tabindex: '-1', 'aria-pressed': 'false',
      'aria-label': L('حدّدْ هذه الكتلة', 'Select this block')
    });
    tick.innerHTML = '<i class="fa-regular fa-square" aria-hidden="true"></i>';
    var plus = el('button', 'ne-plus', {
      type: 'button', 'aria-label': L('أضف كتلة بعدها', 'Add a block after'), tabindex: '-1'
    });
    plus.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';
    var grip = el('button', 'ne-grip', {
      type: 'button', tabindex: '-1',
      'aria-label': L('اسحبْ لنقلها، أو اضغطْ لخياراتها', 'Drag to move, or click for options')
    });
    grip.innerHTML = '<i class="fa-solid fa-grip-vertical" aria-hidden="true"></i>';
    rail.appendChild(tick); rail.appendChild(plus); rail.appendChild(grip);

    var spin = el('button', 'ne-rgrip', {
      type: 'button', tabindex: '-1', 'aria-label': L('اسحبْ لتدويرها', 'Drag to rotate')
    });
    spin.innerHTML = '<i class="fa-solid fa-rotate" aria-hidden="true"></i>';
    /*@3.NOEJ.385*/
    var edges = ['s', 'e', 'nw', 'ne', 'sw', 'se', 'n', 'b'].map(function (sd) {
      return el('button', 'ne-wgrip', {
        type: 'button', tabindex: '-1', 'data-side': sd,
        'aria-label': L('اسحبْ لضبط العرض', 'Drag to set the width')
      });
    });
    var shbar = el('div', 'ne-shp-bar ne-shp-bar--float', { contenteditable: 'false' });
    var selfC = this;
    shbar.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    shbar.addEventListener('click', function (e) {
      var shbC = e.target.closest('[data-shp]');
      if (!shbC) return;
      e.preventDefault(); e.stopPropagation();
      var idC = shbar.getAttribute('data-for');
      var nodeC = idC ? selfC.root.querySelector(':scope > [data-bid="' + idC + '"]') : null;
      if (nodeC) selfC.shapeAct(nodeC, idC, shbC);
      /*@3.NOEJ.397*/
      selfC._shbHot = 1;
      if (selfC._shbHotT) clearTimeout(selfC._shbHotT);
      selfC._shbHotT = setTimeout(function () {
        selfC._shbHotT = 0;
        var hov = false;
        try { hov = shbar.matches(':hover'); } catch (eH) { hov = false; }
        if (hov) return;
        selfC._shbHot = 0;
        if (selfC._shbDirty) selfC.placeShpBar();
      }, 1500);
    });
    shbar.addEventListener('pointerenter', function () {
      selfC._shbHot = 1;
      if (selfC._chromeT) { clearTimeout(selfC._chromeT); selfC._chromeT = 0; }
    });
    shbar.addEventListener('pointerleave', function (e) {
      /*@3.NOEJ.432*/
      if (selfC._shbHotT) { clearTimeout(selfC._shbHotT); selfC._shbHotT = 0; }
      selfC._shbHot = 0;
      if (selfC._shbDirty) selfC.placeShpBar();
      var toRoot = !!(e && e.relatedTarget && selfC.root.contains(e.relatedTarget));
      if (!toRoot) selfC.armChromeHide();
    });
    this._chrome = { rail: rail, tick: tick, spin: spin, edges: edges, shbar: shbar, host: null };
    return this._chrome;
  };


  /*@3.NOEJ.375*/
  Editor.prototype.buildShapeBar = function (bar, b) {
    var B0 = B();
    var shbar = bar; shbar.innerHTML = '';
    var mk = function (at, val, ic, ar, en, on) {
      var q = el('button', 'ne-shp-b', {
        type: 'button', 'data-shp': at + ':' + val,
        'aria-label': L(ar, en), title: L(ar, en)
      });
      if (on) q.setAttribute('aria-pressed', 'true');
      q.innerHTML = ic;
      return q;
    };
    var pick = el('button', 'ne-shp-b ne-shp-pick', {
      type: 'button', 'data-shp': 'pick',
      'aria-label': L('غيّرِ الشكل', 'Change the shape'),
      title: L('غيّرِ الشكل', 'Change the shape')
    });
    /*@3.NOEJ.393*/
    pick.innerHTML = B0.shapeSvg({ sh: b.sh === 'sticker' ? 'rect' : b.sh, fill: 0 }, { stroke: 1.7 });
    if (b.sh !== 'sticker') shbar.appendChild(pick);
    if (b.sh === 'sticky') {
      shbar.appendChild(mk('th', 'next',
        '<i class="fa-solid fa-tape" aria-hidden="true"></i>',
        'ثيمُ الملصق — لصقةٌ · لصقتان · دبّوس · بلا', 'Sticky theme — tape, two tapes, pin, none'));
      /*@3.NOEJ.401*/
      shbar.appendChild(mk('ls', 'ul',
        '<i class="fa-solid fa-list-ul" aria-hidden="true"></i>',
        'نقطةٌ في أوّل هذا السطر', 'Bullet at the start of this line'));
      shbar.appendChild(mk('ls', 'ol',
        '<i class="fa-solid fa-list-ol" aria-hidden="true"></i>',
        'رقمٌ في أوّل هذا السطر', 'Number at the start of this line'));
    }
    shbar.appendChild(mk('fill', b.fill ? '0' : '1',
      '<i class="fa-solid fa-fill-drip" aria-hidden="true"></i>',
      'املأْه أو أفرِغْه', 'Fill or outline', b.fill));
    shbar.appendChild(mk('rot', '-90',
      '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i>',
      'أدِرْ ربعَ دورةٍ يساراً', 'Rotate a quarter turn left'));
    shbar.appendChild(mk('rot', '90',
      '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i>',
      'أدِرْ ربعَ دورةٍ يميناً', 'Rotate a quarter turn right'));
    shbar.appendChild(mk('flip', 'x',
      '<i class="fa-solid fa-arrows-left-right" aria-hidden="true"></i>',
      'اقلِبْه أفقيّاً', 'Flip horizontally', b.fx));
    shbar.appendChild(mk('flip', 'y',
      '<i class="fa-solid fa-arrows-up-down" aria-hidden="true"></i>',
      'اقلِبْه رأسيّاً', 'Flip vertically', b.fy));
    var cbtn = el('button', 'ne-shp-b ne-shp-col', {
      type: 'button', 'data-shp': 'colour',
      'aria-label': L('لونُ الشكل', 'Shape colour'),
      title: L('لونُ الشكل', 'Shape colour')
    });
    shbar.appendChild(cbtn);
    return shbar;
  };

  /*@3.NOEJ.398*/
  Editor.prototype.placeShpBar = function (force) {
    var c = this._chrome;
    if (!c || !c.shbar || !c.host || !c.shbar.parentNode) return;
    if (this._shbHot && !force) { this._shbDirty = 1; return; }
    this._shbDirty = 0;
    var bar = c.shbar, node = c.host;
    var pr = bar.offsetParent ? bar.offsetParent.getBoundingClientRect() : this.root.getBoundingClientRect();
    var nr = node.getBoundingClientRect();
    var z = this.zoomOf() || 1;
    var bw = bar.offsetWidth || 120, bh = bar.offsetHeight || 26;
    var left = (nr.left - pr.left) / z + (nr.width / z - bw) / 2;
    var top = (nr.top - pr.top) / z - bh - 6;
    if (top < 0) top = (nr.bottom - pr.top) / z + 6;
    bar.style.left = Math.round(left) + 'px';
    bar.style.top = Math.round(top) + 'px';
  };


  /*@3.NOEJ.376*/
  Editor.prototype.shapeAct = function (node, id, shb) {
    var self = this;
    var hitS = self.blockAt(id);
    if (!hitS || hitS.b.ty !== 'shape') return;
    var vS = shb.getAttribute('data-shp');
    if (vS === 'pick') { self.shapePop(shb, id, 'sh'); return; }
    if (vS === 'colour') { self.shapePop(shb, id, 'tone'); return; }
    if (vS.indexOf('ls:') === 0) { self.stickyMark(node, vS.slice(3)); return; }
    var beforeS = self.snapshot();
    if (vS.indexOf('rot:') === 0) {
      var rS = (hitS.b.rot || 0) + Number(vS.slice(4));
      hitS.b.rot = ((Math.round(rS) % 360) + 360) % 360;
      if (!hitS.b.rot) delete hitS.b.rot;
      self.applyFree(node, hitS.b);
    } else if (vS.indexOf('th:') === 0) {
      var TH = (B().STICKY_THEMES || ['tape', 'tape2', 'pin', 'none']);
      var iT = TH.indexOf(hitS.b.th || 'tape');
      hitS.b.th = TH[(iT + 1) % TH.length];
      self.pushUndo(beforeS);
      self.renderOne(id);
      self.touch();
      return;
    } else if (vS.indexOf('flip:') === 0) {
      var fk = vS.slice(5) === 'y' ? 'fy' : 'fx';
      if (hitS.b[fk]) delete hitS.b[fk]; else hitS.b[fk] = 1;
      node.style.setProperty('--ne-shp-' + fk, hitS.b[fk] ? '-1' : '1');
      shb.setAttribute('aria-pressed', hitS.b[fk] ? 'true' : 'false');
      node.setAttribute('data-f' + fk.slice(1), hitS.b[fk] ? '1' : '0');
    } else if (vS.indexOf('fill:') === 0) {
      hitS.b.fill = vS.slice(5) === '1' ? 1 : 0;
      self.pushUndo(beforeS);
      self.renderOne(id);
      self.touch();
      return;
    }
    self.pushUndo(beforeS);
    self.touch();

  };

  /*@3.NOEJ.399*/
  /*@3.NOEJ.382*/
  Editor.prototype.armChromeHide = function () {
    var self = this, root = this.root;
    if (self._chromeT) clearTimeout(self._chromeT);
    self._chromeT = setTimeout(function () {
      self._chromeT = 0;
      if (self._drag || self._bdrag || self._wdrag || self._rdrag) return;
      var hov = false, c = self._chrome;
      /*@3.NOEJ.433*/
      try {
        hov = !!(c && c.host && c.host.isConnected &&
                 (c.host.matches(':hover') || c.host.contains(document.activeElement))) ||
              !!(c && c.shbar && c.shbar.isConnected && c.shbar.matches(':hover'));
      } catch (eH) { hov = false; }
      if (hov || self._shbHot) return;
      if (self._actId && c && c.host && c.host.getAttribute('data-bid') === self._actId) return;
      self.chromeTo(null);
    }, 1200);
  };

  /*@3.NOEJ.400*/
  var STK_MARK = /^(\s*)(?:([\u2022\-\u2013\u25C6])|(\d+|[\u0660-\u0669]+)([.)\u066B]))\s/;
  function stkText(edn) {
    var B1 = B();
    return B1.runsToText(B1.readRuns(edn));
  }
  function stkNum(raw, add) {
    var ar = /[\u0660-\u0669]/.test(raw);
    var v = parseInt(ar ? raw.replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x660); }) : raw, 10);
    if (!isFinite(v)) v = 0;
    v += add;
    var out = String(v);
    return ar ? out.replace(/\d/g, function (d) { return String.fromCharCode(0x660 + Number(d)); }) : out;
  }
  Editor.prototype.stickyEnter = function (edn) {
    var bnd = this.selBounds(edn);
    var at = bnd ? Math.min(bnd[0], bnd[1]) : 0;
    var txt = stkText(edn);
    var pre = txt.slice(0, at);
    var ls = pre.lastIndexOf('\n') + 1;
    var line = pre.slice(ls);
    var m = STK_MARK.exec(line);
    var mark = '';
    if (m) {
      var leE = txt.indexOf('\n', ls); if (leE < 0) leE = txt.length;
      var rest = txt.slice(ls + m[0].length, leE);
      if (!rest.trim()) {
        selectRange(edn, ls, ls + m[0].length);
        try { document.execCommand('delete'); } catch (eD) {}
        return;
      }
      mark = m[2] ? (m[1] + m[2] + ' ') : (m[1] + stkNum(m[3], 1) + m[4] + ' ');
    }
    tagMode();
    var ok = false;
    try { ok = document.execCommand('insertLineBreak'); } catch (eL) { ok = false; }
    if (!ok) { try { document.execCommand('insertHTML', false, '<br>'); } catch (eH) {} }
    if (mark) { try { document.execCommand('insertText', false, mark); } catch (eT) {} }
  };

  Editor.prototype.stickyMark = function (node, kind) {
    var edn = node.querySelector('.ne-text');
    if (!edn) return;
    try { edn.focus({ preventScroll: true }); } catch (eF) { edn.focus(); }
    var txt = stkText(edn);
    var bnd = this.selBounds(edn);
    var at = bnd ? Math.min(bnd[0], bnd[1]) : txt.length;
    var ls = txt.lastIndexOf('\n', at - 1) + 1;
    var le = txt.indexOf('\n', ls); if (le < 0) le = txt.length;
    var line = txt.slice(ls, le);
    var m = STK_MARK.exec(line);
    var same = !!(m && ((kind === 'ul' && m[2]) || (kind === 'ol' && m[3])));
    if (m) {
      selectRange(edn, ls, ls + m[0].length);
      try { document.execCommand('delete'); } catch (eD) {}
      at = Math.max(ls, at - m[0].length);
      if (same) { selectRange(edn, at, at); return; }
    }
    var want = '\u2022 ';
    if (kind === 'ol') {
      var prev = ls > 0 ? txt.slice(txt.lastIndexOf('\n', ls - 2) + 1, ls - 1) : '';
      var pm = STK_MARK.exec(prev);
      want = (pm && pm[3]) ? (pm[1] + stkNum(pm[3], 1) + pm[4] + ' ') : '1. ';
    }
    selectRange(edn, ls, ls);
    try { document.execCommand('insertText', false, want); } catch (eT) {}
    selectRange(edn, at + want.length, at + want.length);
  };

  Editor.prototype.chromeTo = function (node) {
    /*@3.NOEJ.513*/
    if (node && node.getAttribute('data-ty') === 'pb') node = null;
    var c = this.ensureChrome();
    if (node && this._chromeT) { clearTimeout(this._chromeT); this._chromeT = 0; }
    if (c.host === node) return;
    c.host = node || null;
    if (c.shbar && c.shbar.parentNode) c.shbar.parentNode.removeChild(c.shbar);
    this._shbHot = 0; this._shbDirty = 0;
    if (this._shbHotT) { clearTimeout(this._shbHotT); this._shbHotT = 0; }
    if (!node) {
      if (c.rail.parentNode) c.rail.parentNode.removeChild(c.rail);
      if (c.spin.parentNode) c.spin.parentNode.removeChild(c.spin);
      for (var q = 0; q < c.edges.length; q++) {
        if (c.edges[q].parentNode) c.edges[q].parentNode.removeChild(c.edges[q]);
      }
      return;
    }
    node.insertBefore(c.rail, node.firstChild);
    node.appendChild(c.spin);
    for (var k = 0; k < c.edges.length; k++) node.appendChild(c.edges[k]);
    this.paintTick(node);
    if (node.getAttribute('data-ty') === 'shape') {
      var hitB = this.blockAt(node.getAttribute('data-bid'));
      if (hitB) {
        this.buildShapeBar(c.shbar, hitB.b);
        c.shbar.setAttribute('data-for', hitB.b.id);
        (this.root.parentNode || this.root).appendChild(c.shbar);
        this._shbHot = 0; this._shbDirty = 0;
        if (this._shbHotT) { clearTimeout(this._shbHotT); this._shbHotT = 0; }
        this.placeShpBar(true);
      }
    }
  };

  /*@3.NOEJ.200*/
  Editor.prototype.paintTick = function (node) {
    var c = this._chrome;
    if (!c || !node) return;
    var on = !!this.blockSel()[node.getAttribute('data-bid')];
    c.tick.setAttribute('aria-pressed', on ? 'true' : 'false');
    c.tick.innerHTML = '<i class="fa-' + (on ? 'solid fa-square-check' : 'regular fa-square') +
                       '" aria-hidden="true"></i>';
  };

  Editor.prototype.paintBlockSel = function () {
    var sel = this.blockSel();
    var nodes = this.root.querySelectorAll('[data-bid]');
    for (var i = 0; i < nodes.length; i++) {
      var on = !!sel[nodes[i].getAttribute('data-bid')];
      if (on) nodes[i].setAttribute('data-bsel', '1');
      else nodes[i].removeAttribute('data-bsel');
    }
    /*@3.NOEJ.164*/
    if (this._chrome && this._chrome.host) this.paintTick(this._chrome.host);
    if (this._selMode) this.paintSelHint();
  };

  Editor.prototype.toggleBlockSel = function (id, only) {
    var sel = this.blockSel();
    if (only) { this._bsel = {}; sel = this._bsel; sel[id] = 1; }
    else if (sel[id]) delete sel[id];
    else sel[id] = 1;
    this.paintBlockSel();
    this.emitState();
  };

  Editor.prototype.selectBlockRange = function (id) {
    var sel = this.blockSel();
    var last = this._bselLast, a = -1, b = -1, i;
    for (i = 0; i < this.doc.blocks.length; i++) {
      if (this.doc.blocks[i].id === last) a = i;
      if (this.doc.blocks[i].id === id) b = i;
    }
    if (a < 0 || b < 0) { this.toggleBlockSel(id); this._bselLast = id; return; }
    var lo = Math.min(a, b), hi = Math.max(a, b);
    for (i = lo; i <= hi; i++) sel[this.doc.blocks[i].id] = 1;
    this.paintBlockSel();
    this.emitState();
  };

  /*@3.NOEJ.161*/
  /*@3.NOEJ.185*/
  Editor.prototype.stampDir = function (blocks) {
    if (!Array.isArray(blocks) || !blocks.length) return blocks;
    var docD = contentDir(this.doc);
    if (!docD) return blocks;
    var inD = '';
    for (var k = 0; k < blocks.length && !inD; k++) inD = blockContentDir(blocks[k]);
    if (!inD || inD === docD) return blocks;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.dir === 'rtl' || b.dir === 'ltr') continue;
      var bd = blockContentDir(b) || inD;
      if (bd && bd !== docD) b.dir = bd;
    }
    return blocks;
  };

  /*@3.NOEJ.192*/
  function fold(t) {
    return String(t == null ? '' : t).toLowerCase()
      .replace(/[\u064b-\u0652\u0640]/g, '')
      .replace(/[\u0623\u0625\u0622]/g, '\u0627')
      .replace(/\u0629/g, '\u0647').replace(/[\u064a\u0649]/g, '\u064a')
      .replace(/\s+/g, ' ').trim();
  }

  Editor.prototype.mentionAt = function (edn) {
    if (!edn) return null;
    /*@3.NOEJ.245*/
    var txt = edn.textContent || '';
    if (txt.indexOf('@') < 0) return null;
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return null;
    var r = sel.getRangeAt(0);
    if (!edn.contains(r.startContainer)) return null;
    var at = offsetIn(edn, r.startContainer, r.startOffset);
    var head = txt.slice(0, at);
    var m = head.match(/(^|[\s(\u060c\u061b])@([^@\s]{0,40})$/);
    if (!m) return null;
    return { from: at - (m[2].length + 1), to: at, q: m[2] };
  };

  Editor.prototype.mentionItems = function (q) {
    var out = [], i, f = fold(q);
    var anc = this.anchors();
    for (i = 0; i < anc.length; i++) {
      if (f && fold(anc[i].t).indexOf(f) < 0) continue;
      out.push({ k: 'h', t: anc[i].t, v: '#' + anc[i].a, lv: anc[i].lv });
      if (out.length > 24) return out;
    }
    var notes = (this.opts.noteList ? this.opts.noteList() : []) || [];
    for (i = 0; i < notes.length; i++) {
      var t = notes[i].t || '';
      if (!t) continue;
      if (f && fold(t).indexOf(f) < 0) continue;
      out.push({ k: 'n', t: t, v: 'note:' + notes[i].id });
      if (out.length > 24) return out;
    }
    return out;
  };

  /*@3.NOEJ.193*/
  Editor.prototype.closeMention = function () {
    if (!this._mn) return;
    if (this._mn.el && this._mn.el.parentNode) this._mn.el.remove();
    this._mn = null;
  };

  Editor.prototype.openMention = function (edn, span) {
    var items = this.mentionItems(span.q);
    if (!items.length) { this.closeMention(); return; }
    var self = this;
    var m = this._mn && this._mn.el;
    if (!m) {
      m = el('div', 'ne-menu ne-mn', { role: 'menu' });
      m.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
      document.body.appendChild(m);
      m.addEventListener('mousedown', function (e) { e.preventDefault(); });
      m.addEventListener('click', function (e) {
        var b = e.target.closest('[data-mv]');
        if (!b) return;
        self.pickMention(b.getAttribute('data-mv'), b.getAttribute('data-mt'));
      });
    }
    this._mn = { el: m, ed: edn, from: span.from, to: span.to, i: 0 };
    m.innerHTML =
      '<div class="ne-menu-h">' + B().esc(L('اربطْ بـ', 'Link to')) + '</div>' +
      items.map(function (it, k) {
        return '<button type="button" class="ne-menu-i" role="menuitem"' +
          (k ? '' : ' data-on="1"') +
          ' data-mv="' + B().esc(it.v) + '" data-mt="' + B().esc(it.t) + '">' +
          '<i class="fa-solid ' + (it.k === 'h' ? 'fa-hashtag' : 'fa-note-sticky') +
          '" aria-hidden="true"></i><span>' + B().esc(it.t) + '</span></button>';
      }).join('');
    this.placeMention(m, edn);
  };

  Editor.prototype.placeMention = function (m, edn) {
    var r = null;
    try {
      var sel = window.getSelection();
      if (sel && sel.rangeCount) {
        var rects = sel.getRangeAt(0).getClientRects();
        if (rects && rects.length) r = rects[rects.length - 1];
      }
    } catch (e) {}
    if (!r || (!r.width && !r.height)) r = edn.getBoundingClientRect();
    var mr = m.getBoundingClientRect();
    var pad = 8;
    var top = r.bottom + 4;
    if (top + mr.height > window.innerHeight - pad) top = Math.max(pad, r.top - mr.height - 4);
    m.style.insetBlockStart = Math.round(top) + 'px';
    m.style.left = Math.round(Math.max(pad,
      Math.min(r.left, window.innerWidth - mr.width - pad))) + 'px';
  };

  Editor.prototype.moveMention = function (dir) {
    if (!this._mn) return false;
    var list = [].slice.call(this._mn.el.querySelectorAll('[data-mv]'));
    if (!list.length) return false;
    var at = list.findIndex(function (b) { return b.hasAttribute('data-on'); });
    if (at < 0) at = 0; else list[at].removeAttribute('data-on');
    var next = (at + dir + list.length) % list.length;
    list[next].setAttribute('data-on', '1');
    try { list[next].scrollIntoView({ block: 'nearest' }); } catch (e) {}
    return true;
  };

  /*@3.NOEJ.194*/
  Editor.prototype.pickMention = function (target, label) {
    var st = this._mn;
    this.closeMention();
    if (!st || !target) return false;
    var edn = st.ed;
    if (!edn || !this.root.contains(edn)) return false;
    var ref = this.runsRef(edn);
    if (!ref) return false;
    var rt = ref.get();
    var txt = String(label || target);
    var before = this.snapshot();
    var parts = sliceRuns(rt, st.from, st.to);
    var out = joinRuns([parts[0], [{ s: txt, lk: target }], parts[2]]);
    ref.set(out);
    this.pushUndo(before);
    edn.innerHTML = B().runsToHtmlBidi(out);
    try { edn.focus(); } catch (e) {}
    selectRange(edn, st.from + txt.length, st.from + txt.length);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.pickMentionActive = function () {
    if (!this._mn) return false;
    var b = this._mn.el.querySelector('[data-mv][data-on]') ||
            this._mn.el.querySelector('[data-mv]');
    if (!b) return false;
    return this.pickMention(b.getAttribute('data-mv'), b.getAttribute('data-mt'));
  };

  Editor.prototype.selectRangeBetween = function (aId, bId) {
    var a = -1, b = -1, i;
    for (i = 0; i < this.doc.blocks.length; i++) {
      if (this.doc.blocks[i].id === aId) a = i;
      if (this.doc.blocks[i].id === bId) b = i;
    }
    if (a < 0 || b < 0) return 0;
    var lo = Math.min(a, b), hi = Math.max(a, b);
    var sel = (this._bsel = {});
    for (i = lo; i <= hi; i++) sel[this.doc.blocks[i].id] = 1;
    this._bselLast = bId;
    this.paintBlockSel();
    this.emitState();
    return (hi - lo) + 1;
  };

  Editor.prototype.endBlockDrag = function () {
    var st = this._bdrag;
    this._bdrag = null;
    if (!st || !st.on) return;
    this.root.removeAttribute('data-bdrag');
    try { window.getSelection().removeAllRanges(); } catch (e) {}
  };

  /*@3.NOEJ.173*/
  /*@3.NOEJ.187*/
  Editor.prototype.findAnchor = function (slug) {
    var M = window.GardenNotesMd;
    var raw = String(slug || '').replace(/^#/, '');
    try { raw = decodeURIComponent(raw); } catch (eD) {}
    var want = (M && M.slug) ? M.slug(raw) : raw.toLowerCase();
    if (!want) return null;
    var bs = this.doc.blocks || [], i, a;

    /*@3.NOEJ.188*/
    for (i = 0; i < bs.length; i++) if (bs[i].anc && String(bs[i].anc) === want) return bs[i].id;

    /*@3.NOEJ.189*/
    var heads = [];
    for (i = 0; i < bs.length; i++) {
      if (bs[i].ty !== 'h') continue;
      a = B().anchorOf(bs[i]);
      if (!a) continue;
      if (a === want) return bs[i].id;
      heads.push({ id: bs[i].id, a: a });
    }

    /*@3.NOEJ.190*/
    var only = null, hits = 0, h;
    for (i = 0; i < heads.length; i++) {
      h = heads[i];
      if (h.a === want + 's' || want === h.a + 's' ||
          h.a === want + 'es' || want === h.a + 'es') { only = h; hits++; }
    }
    if (hits === 1) return only.id;

    /*@3.NOEJ.191*/
    only = null; hits = 0;
    for (i = 0; i < heads.length; i++) {
      h = heads[i];
      if (h.a.indexOf(want + '-') === 0) { only = h; hits++; }
    }
    if (hits === 1) return only.id;
    if (want.length < 2) return null;
    only = null; hits = 0;
    for (i = 0; i < heads.length; i++) {
      h = heads[i];
      if (h.a.indexOf(want) === 0) { only = h; hits++; }
    }
    return hits === 1 ? only.id : null;
  };

  /*@3.NOEJ.174*/
  Editor.prototype.flashBlock = function (id) {
    /*@3.NOEJ.299*/
    if (this._win) this.winShow(String(id).replace(/"/g, ''));
    var node = this.root.querySelector('[data-bid="' + String(id).replace(/"/g, '') + '"]');
    if (!node) return false;
    try { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    catch (e) { node.scrollIntoView(); }
    node.setAttribute('data-flash', '1');
    setTimeout(function () { node.removeAttribute('data-flash'); }, 1500);
    return true;
  };

  Editor.prototype.followLink = function (target) {
    var t = String(target || '');
    if (!t) return false;
    if (t.charAt(0) === '#') {
      var id = this.findAnchor(t);
      if (id) return this.flashBlock(id);
      if (this.opts.onLinkMiss) this.opts.onLinkMiss(t);
      return false;
    }
    if (/^note:/i.test(t)) {
      if (this.opts.onNoteLink) { this.opts.onNoteLink(t); return true; }
      return false;
    }
    return false;
  };

  /*@3.NOEJ.175*/
  Editor.prototype.anchors = function () {
    var out = [], bs = this.doc.blocks || [];
    for (var i = 0; i < bs.length; i++) {
      if (bs[i].ty !== 'h') continue;
      var a = B().anchorOf(bs[i]);
      var t = B().runsToText(bs[i].rt || []).trim();
      if (a && t) out.push({ a: a, t: t, lv: bs[i].lv || 2 });
    }
    return out;
  };

  Editor.prototype.clearBlockSel = function () {
    if (!this._bsel || !Object.keys(this._bsel).length) return;
    this._bsel = {};
    this.paintBlockSel();
    this.emitState();
  };

/*@3.NOEJ.53*/
  Editor.prototype.blocksInRect = function (rect, add) {
    var sel = add ? this.blockSel() : (this._bsel = {});
    var rr = this.root.getBoundingClientRect();
    /*@3.NOEJ.412*/
    var zR = this.zoomOf() || 1;
    var x1 = rr.left + rect.x * zR, y1 = rr.top + rect.y * zR;
    var x2 = x1 + rect.w * zR, y2 = y1 + rect.h * zR;
    var nodes = this.root.querySelectorAll(':scope > [data-bid]');
    var n = 0;
    for (var i = 0; i < nodes.length; i++) {
      var b = nodes[i].getBoundingClientRect();
      if (b.right < x1 || b.left > x2 || b.bottom < y1 || b.top > y2) continue;
      sel[nodes[i].getAttribute('data-bid')] = 1;
      n++;
    }
    this.paintBlockSel();
    this.emitState();
    return n;
  };

  Editor.prototype.blockAtPoint = function (x, y) {
    var rr = this.root.getBoundingClientRect();
    var zP = this.zoomOf() || 1;
    var px = rr.left + x * zP, py = rr.top + y * zP;
    var nodes = this.root.querySelectorAll(':scope > [data-bid]');
    for (var i = nodes.length - 1; i >= 0; i--) {
      var b = nodes[i].getBoundingClientRect();
      if (px >= b.left && px <= b.right && py >= b.top && py <= b.bottom) {
        return nodes[i].getAttribute('data-bid');
      }
    }
    return null;
  };

  Editor.prototype.setSelectMode = function (on, tell) {
    var was = !!this._selMode;
    this._selMode = !!on;
    this.root.setAttribute('data-selmode', this._selMode ? '1' : '0');
    if (!this._selMode) this.clearBlockSel();
    this.paintSelHint();
    /*@3.NOEJ.163*/
    /*@3.NOEJ.491*/
    if ((tell || was !== this._selMode) && this.opts.onSelMode) this.opts.onSelMode(this._selMode);
    this.emitState();
  };

  /*@3.NOEJ.61*/
  Editor.prototype.paintSelHint = function () {
    var host = this.root.parentNode;
    if (!host) return;
    var bar = host.querySelector('.ne-selhint');
    if (!this._selMode) { if (bar) bar.remove(); return; }
    if (!bar) {
      bar = el('div', 'ne-selhint', { role: 'status' });
      bar.innerHTML =
        '<i class="fa-solid fa-object-ungroup" aria-hidden="true"></i>' +
        '<span class="ne-selhint-t">' +
        B().esc(L('اضغطْ على الكتل لتحديدها — والزرُّ نفسُه يُخرجك، أو Esc.',
                  'Tap blocks to select them — the same button exits, or press Esc.')) +
        '</span>' +
        '<button type="button" class="ne-selhint-b" data-selall="1">' +
        B().esc(L('حدّدِ الكلّ', 'Select all')) + '</button>' +
        '<button type="button" class="ne-selhint-b ne-selhint-x" data-selx="1">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i> ' +
        B().esc(L('إلغاء', 'Cancel')) + '</button>';
      host.insertBefore(bar, this.root);
      var self = this;
      bar.addEventListener('click', function (e) {
        /*@3.NOEJ.612*/
        if (e.target.closest('[data-selx]')) { self.setSelectMode(false, 1); return; }
        if (!e.target.closest('[data-selall]')) return;
        /*@3.NOEJ.92*/
        if (self.opts.onSelectAll) self.opts.onSelectAll();
        else self.selectAllBlocks();
      });
    }
    var n = this.selectedBlocks().length;
    var t = bar.querySelector('.ne-selhint-t');
    if (t && n) {
      t.textContent = L('حُدِّدت ', 'Selected ') + n +
        L(' كتلة — والزرُّ نفسُه يُخرجك، أو Esc.', ' blocks — the same button exits, or press Esc.');
    }
  };

  Editor.prototype.selectAllBlocks = function () {
    /*@3.NOEJ.621*/
    var sel = this.blockSel(), fo = !!this.opts.freeOnly;
    for (var i = 0; i < this.doc.blocks.length; i++) {
      if (fo && !this.doc.blocks[i].fp) continue;
      sel[this.doc.blocks[i].id] = 1;
    }
    this.paintBlockSel();
    this.emitState();
  };

  var FLOW_ONLY = { hr: 1, gap: 1, pb: 1 };

  /*@3.NOEJ.34*/
  /*@3.NOEJ.132*/
  var CLIP_KEY = 'garden_notes_clip';
  function clipStore(list) {
    try {
      var raw = JSON.stringify(list || []);
      if (raw.length < 400000) localStorage.setItem(CLIP_KEY, raw);
    } catch (e) {}
  }
  function clipLoad() {
    try { return JSON.parse(localStorage.getItem(CLIP_KEY) || 'null') || []; }
    catch (e) { return []; }
  }
  function clipAny() {
    if (Editor.clip && Editor.clip.length) return true;
    try { return (localStorage.getItem(CLIP_KEY) || '').length > 2; }
    catch (e) { return false; }
  }

  Editor.prototype.copyBlocks = function () {
    var picked = this.selectedBlocks();
    if (!picked.length) return 0;
    this.readAll();
    Editor.clip = JSON.parse(JSON.stringify(picked.map(function (h) { return h.b; })));
    clipStore(Editor.clip);
    var B2 = B();
    try {
      var txt = Editor.clip.map(function (b) { return B2.blockToText ? B2.blockToText(b) : ''; })
        .filter(Boolean).join('\n');
      if (txt && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt)['catch'](function () {});
      }
    } catch (e) {}
    return Editor.clip.length;
  };

  Editor.prototype.cutBlocks = function () {
    var n = this.copyBlocks();
    if (n) this.deleteBlocks();
    return n;
  };

  Editor.prototype.pasteBlocks = function () {
    if (!Editor.clip || !Editor.clip.length) Editor.clip = clipLoad();
    if (!Editor.clip || !Editor.clip.length) return 0;
    var before = this.snapshot();
    this.readAll();
    var picked = this.selectedBlocks();
    var at = picked.length ? picked[picked.length - 1].i + 1 : this.doc.blocks.length;
    var made = Editor.clip.map(function (b) {
      var c = JSON.parse(JSON.stringify(b));
      c.id = B().uid();
      return c;
    });
    var args = [at, 0].concat(made);
    Array.prototype.splice.apply(this.doc.blocks, args);
    this.pushUndo(before);
    this._bsel = {};
    for (var i = 0; i < made.length; i++) this._bsel[made[i].id] = 1;
    /*@3.NOEJ.151*/
    this.renderInsert(at, made);
    this.paintBlockSel();
    this.touch();
    this.emitState();
    return made.length;
  };

  Editor.prototype.idSet = function () {
    var o = {};
    for (var i = 0; i < this.doc.blocks.length; i++) o[this.doc.blocks[i].id] = 1;
    return o;
  };

  /*@3.NOEJ.616*/
  Editor.prototype.freeNew = function (had, pt) {
    this.readAll();
    var W = this.sheetW() || 1, bs = this.doc.blocks, k = 0, moved = 0, base = null, i, b;
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (had[b.id] || b.ty === 'pb' || (FLOW_ONLY[b.ty] && !b.fp)) continue;
      if (b.fp && !base) base = { x: b.fp.x, y: b.fp.y };
    }
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (had[b.id] || b.ty === 'pb') continue;
      if (!b.fp) {
        if (FLOW_ONLY[b.ty]) continue;
        b.fp = pt ? { x: Math.max(0, Math.min(0.96, (pt.x - 6) / W)), y: Math.max(0, Math.round(pt.y - 12 + k * 30)) }
                  : { x: 0.05, y: 40 + k * 30 };
        if (b.wm == null) b.wm = WIDE[b.ty] ? 'full' : 'fit';
        k++;
      } else if (pt && base) {
        b.fp = { x: Math.max(0, Math.min(0.96, (pt.x - 6) / W + (b.fp.x - base.x))), y: Math.max(0, Math.round(pt.y - 12 + (b.fp.y - base.y))) };
      } else {
        b.fp = { x: Math.min(0.96, b.fp.x + 16 / W), y: b.fp.y + 16 };
      }
      b.z = this.topZ() + 1;
      moved++;
    }
    if (!moved) return 0;
    this.render();
    this.layoutFree();
    this.touch();
    this.emitState();
    return moved;
  };

  Editor.prototype.deleteBlocks = function () {
    var picked = this.selectedBlocks().filter(function (h) { return h.b && h.b.ty !== 'pb'; });
    if (!picked.length) return 0;
    var before = this.snapshot();
    for (var i = picked.length - 1; i >= 0; i--) this.doc.blocks.splice(picked[i].i, 1);
    if (!hasFlow(this.doc.blocks)) this.doc.blocks.push(B().blank('p'));
    this.pushUndo(before);
    this._bsel = {};
    this.render();
    this.touch();
    this.emitState();
    return picked.length;
  };

  /*@3.NOEJ.46*/
  /*@3.NOEJ.100*/
  /*@3.NOEJ.145*/
  Editor.prototype.sheetW = function () {
    if (this._sw > 0) return this._sw;
    var w = this.root.offsetWidth ||
            Math.round(this.root.getBoundingClientRect().width) || 794;
    if (w > 0) this._sw = w;
    return w;
  };

  Editor.prototype.zoomOf = function () {
    var w = this.root.offsetWidth;
    if (!w) return 1;
    var z = this.root.getBoundingClientRect().width / w;
    return (isFinite(z) && z > 0.05) ? z : 1;
  };

  Editor.prototype.isRtl = function () {
    try { return getComputedStyle(this.root).direction === 'rtl'; }
    catch (e) { return false; }
  };

  Editor.prototype.localPoint = function (clientX, clientY) {
    var r = this.root.getBoundingClientRect();
    var z = this.zoomOf();
    var x = this.isRtl() ? (r.right - clientX) : (clientX - r.left);
    return { x: x / z, y: (clientY - r.top) / z, w: this.sheetW() };
  };

  /*@3.NOEJ.64*/
  Editor.prototype.applyWidth = function (node, b) {
    var W = this.sheetW() || 794;
    var wm = b.wm;
    node.style.inlineSize = '';
    node.style.maxInlineSize = '';
    if (b.fp) {
      var room = Math.max(0.08, 1 - (b.fp.x || 0));
      if (typeof wm === 'number' && wm > 0) {
        node.setAttribute('data-wm', 'px');
        node.style.inlineSize = (Math.min(wm, room) * W) + 'px';
      } else if (wm === 'full') {
        /*@3.NOEJ.89*/
        node.setAttribute('data-wm', 'full');
        node.style.insetInlineStart = '0px';
        node.style.inlineSize = W + 'px';
      } else {
        node.setAttribute('data-wm', 'fit');
        node.style.maxInlineSize = (room * W) + 'px';
      }
      return;
    }
    if (typeof wm === 'number' && wm > 0) {
      node.setAttribute('data-wm', 'px');
      node.style.inlineSize = (Math.min(1, wm) * W) + 'px';
    } else if (wm === 'fit') {
      node.setAttribute('data-wm', 'fit');
    } else {
      node.removeAttribute('data-wm');
    }
  };

  /*@3.NOEJ.512*/
  Editor.prototype.fpY = function (b) {
    if (!b || !b.fp) return 0;
    var au = Number(b.fp.y) || 0;
    var m = this._fpy ? this._fpy[b.id] : null;
    /*@3.NOEJ.515*/
    return (m && isFinite(m.y) && m.base === au) ? m.y : au;
  };
  Editor.prototype.fpLive = function (b, y) {
    if (!b || !b.id || !b.fp) return;
    if (!this._fpy) this._fpy = {};
    this._fpy[b.id] = { y: y, base: Number(b.fp.y) || 0 };
  };
  Editor.prototype.fpAuthor = function (b, y) {
    if (!b || !b.fp) return;
    b.fp.y = this._pv ? Math.max(0, Math.round(this.pvUnview(y))) : y;
    this.fpLive(b, y);
  };
  Editor.prototype.fpCont = function (b) {
    if (!b || !b.fp) return 0;
    var au = Number(b.fp.y) || 0, m = this._fpy ? this._fpy[b.id] : null;
    if (m && isFinite(m.y) && m.base === au) return this._pv ? this.pvUnview(m.y) : m.y;
    return au;
  };

  /*@3.NOEJ.101*/
  Editor.prototype.applyFree = function (node, b) {
    if (!node) return;
    if (!b.fp) {
      node.removeAttribute('data-fp');
      node.style.insetInlineStart = ''; node.style.left = ''; node.style.right = '';
      node.style.top = ''; node.style.zIndex = '';
      this.applyWidth(node, b);
      return;
    }
    var W = this.sheetW();
    node.setAttribute('data-fp', '1');
    /*@3.NOEJ.388*/
    node.style.insetInlineStart = '';
    if (this.isRtl()) { node.style.left = ''; node.style.right = Math.round(b.fp.x * W) + 'px'; }
    else { node.style.right = ''; node.style.left = Math.round(b.fp.x * W) + 'px'; }
    node.style.top = Math.round(this.fpY(b)) + 'px';
    /*@3.NOEJ.65*/
    /*@3.NOEJ.135*/
    node.style.zIndex = String((b.zi ? 31 : 4) + (b.z || 0));
    /*@3.NOEJ.123*/
    node.style.transform = b.rot ? ('rotate(' + b.rot + 'deg)') : '';
    node.style.transformOrigin = b.rot ? 'center center' : '';
    /*@3.NOEJ.57*/
    this.applyWidth(node, b);
    if (this._chrome && this._chrome.host === node) this.placeShpBar();
  };

  /*@3.NOEJ.71*/
  Editor.prototype.topZ = function () {
    var top = 0;
    for (var i = 0; i < this.doc.blocks.length; i++) {
      var z = this.doc.blocks[i].z;
      if (typeof z === 'number' && z > top) top = z;
    }
    return top;
  };

  Editor.prototype.setZ = function (id, how) {
    var hit = this.blockAt(id);
    if (!hit || !hit.b.fp) return false;
    if (how !== 'front' && how !== 'back' && how !== 'up' && how !== 'down') return false;
    var before = this.snapshot();
    /*@3.NOEJ.133*/
    var frees = this.doc.blocks.filter(function (b) { return b.fp; });
    frees.sort(function (a, b) { return (a.z || 0) - (b.z || 0); });
    for (var i = 0; i < frees.length; i++) frees[i].z = i + 1;
    var at = frees.indexOf(hit.b);
    if (how === 'front') { hit.b.z = frees.length + 1; hit.b.zi = 1; }
    else if (how === 'back') { hit.b.z = 0; delete hit.b.zi; }
    else if (how === 'up') {
      if (at >= 0 && at < frees.length - 1) {
        hit.b.z = at + 2; frees[at + 1].z = at + 1;
      } else if (!hit.b.zi) hit.b.zi = 1;
    } else if (how === 'down') {
      if (hit.b.zi) delete hit.b.zi;
      else if (at > 0) { hit.b.z = at; frees[at - 1].z = at + 1; }
    }
    this.pushUndo(before);
    for (var j = 0; j < frees.length; j++) {
      var n = this.root.querySelector('[data-bid="' + frees[j].id + '"]');
      if (n) this.applyFree(n, frees[j]);
    }
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.bottomZ = function () {
    var low = 0;
    for (var i = 0; i < this.doc.blocks.length; i++) {
      var z = this.doc.blocks[i].z;
      if (typeof z === 'number' && z < low) low = z;
    }
    return low;
  };

  /*@3.NOEJ.80*/
  Editor.prototype.unfree = function (id) {
    var hit = this.blockAt(id);
    if (!hit || !hit.b.fp) return false;
    var before = this.snapshot();
    this.readAll();
    delete hit.b.fp;
    if (this._fpy) delete this._fpy[id];
    delete hit.b.z;
    if (hit.b.wm === 'fit') delete hit.b.wm;
    this.pushUndo(before);
    this.render();
    this.focusBlock(id);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.setFreeAlign = function (id, how) {
    var hit = this.blockAt(id);
    if (!hit || !hit.b.fp) return false;
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (!node) return false;
    var W = this.sheetW();
    var w = (node.offsetWidth || 120) / W;
    var before = this.snapshot();
    var x = 0;
    if (how === 'center') x = Math.max(0, (1 - w) / 2);
    else if (how === 'end') x = Math.max(0, 1 - w);
    hit.b.fp.x = x;
    this.pushUndo(before);
    this.applyFree(node, hit.b);
    this.dropTail();
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.256*/
  Editor.prototype.coarse = function () {
    if (this._coarse == null) {
      try { this._coarse = !!(window.matchMedia && matchMedia('(hover: none)').matches); }
      catch (e) { this._coarse = false; }
    }
    return this._coarse;
  };

  Editor.prototype.touchAct = function (id) {
    var prev = this._actId
      ? this.root.querySelector(':scope > [data-bid="' + this._actId + '"]') : null;
    if (prev) prev.removeAttribute('data-act');
    this._actId = id || '';
    if (!id) { this.chromeTo(null); return; }
    var node = this.root.querySelector(':scope > [data-bid="' + id + '"]');
    if (!node) return;
    node.setAttribute('data-act', '1');
    this.chromeTo(node);
  };

  /*@3.NOEJ.257*/
  Editor.prototype.reAct = function () {
    if (!this._actId) return;
    var node = this.root.querySelector(':scope > [data-bid="' + this._actId + '"]');
    if (!node) { this._actId = ''; return; }
    node.setAttribute('data-act', '1');
    this.chromeTo(node);
  };

  Editor.prototype.makeFree = function (id) {
    var hit = this.blockAt(id);
    if (!hit || hit.b.fp) return false;
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (!node) return false;
    var before = this.snapshot();
    this.readAll();
    var r = this.root.getBoundingClientRect();
    var nr = node.getBoundingClientRect();
    var z = this.zoomOf(), W = this.sheetW();
    hit.b.fp = {
      x: Math.max(0, Math.min(0.9,
         (this.isRtl() ? (r.right - nr.right) : (nr.left - r.left)) / z / W)),
      y: Math.max(0, Math.round((nr.top - r.top) / z))
    };
    this.fpLive(hit.b, hit.b.fp.y);
    if (hit.b.wm == null) hit.b.wm = WIDE[hit.b.ty] ? 'full' : 'fit';
    hit.b.z = this.topZ() + 1;
    this.pushUndo(before);
    this.render();
    this.focusBlock(id);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.72*/
  Editor.prototype.setWidth = function (id, mode) {
    var picked = this.selectedBlocks();
    if (!picked.length) {
      var h0 = this.blockAt(id);
      if (!h0) return false;
      picked = [h0];
    }
    var before = this.snapshot();
    var self = this;
    picked.forEach(function (hit) {
      if (mode == null || mode === 'auto') delete hit.b.wm;
      else hit.b.wm = mode;
      if (mode === 'full' && hit.b.fp) hit.b.fp.x = 0;
      if (mode === 'fit' && hit.b.fp) hit.b.fp.x = Math.min(hit.b.fp.x || 0, 0.9);
      var node = self.root.querySelector('[data-bid="' + hit.b.id + '"]');
      if (node) self.applyFree(node, hit.b);
    });
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.66*/
  Editor.prototype.freeH = function (id) {
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    return node ? (node.offsetHeight || node.getBoundingClientRect().height / this.zoomOf()) : 40;
  };

  /*@3.NOEJ.127*/
  Editor.prototype.freeGroup = function (b) {
    var sel = this._bsel || {}, out = [], i, o, n;
    if (sel[b.id]) {
      for (i = 0; i < this.doc.blocks.length; i++) {
        o = this.doc.blocks[i];
        if (!o.fp || !sel[o.id]) continue;
        n = this.root.querySelector('[data-bid="' + o.id + '"]');
        if (n) out.push({ b: o, node: n, ox: o.fp.x || 0, oy: this.fpY(o) });
      }
    }
    if (out.length > 1) return out;
    n = this.root.querySelector('[data-bid="' + b.id + '"]');
    return [{ b: b, node: n, ox: b.fp.x || 0, oy: this.fpY(b) }];
  };

  Editor.prototype.fpUnder = function (b, id) {
    var x = b.fp.x;
    var y = this.fpY(b) + this.freeH(id) + 8;
    /*@3.NOEJ.67*/
    for (var guard = 0; guard < 40; guard++) {
      var hit = null;
      for (var i = 0; i < this.doc.blocks.length; i++) {
        var o = this.doc.blocks[i];
        if (!o.fp || o.id === id) continue;
        if (Math.abs((o.fp.x || 0) - x) > 0.22) continue;
        if (Math.abs(this.fpY(o) - y) > 14) continue;
        hit = o;
        break;
      }
      if (!hit) break;
      y = this.fpY(hit) + this.freeH(hit.id) + 8;
    }
    return { x: x, y: y };
  };

  Editor.prototype.layoutFree = function () {
    /*@3.NOEJ.148*/
    this._sw = 0;
    if (this.doc.fpv !== 2) this.migrateFp();
    for (var i = 0; i < this.doc.blocks.length; i++) {
      var b = this.doc.blocks[i];
      if (!b.fp) continue;
      this.applyFree(this.root.querySelector('[data-bid="' + b.id + '"]'), b);
    }
    this.dropTail();
    this.applyEng();
    if (this.opts.onLayout) this.opts.onLayout();
  };

  Editor.prototype.migrateFp = function () {
    /*@3.NOEJ.102*/
    var W = this.sheetW(), z = this.zoomOf(), rtl = this.isRtl();
    var r = this.root.getBoundingClientRect();
    var list = [], i, b, node;
    for (i = 0; i < this.doc.blocks.length; i++) {
      b = this.doc.blocks[i];
      if (!b.fp) continue;
      node = this.root.querySelector('[data-bid="' + b.id + '"]');
      if (!node) continue;
      node.style.insetInlineStart = ''; node.style.right = '';
      node.style.left = (b.fp.x * W) + 'px';
      node.style.top = (b.fp.y * W) + 'px';
      list.push([b, node]);
    }
    for (i = 0; i < list.length; i++) {
      var nr = list[i][1].getBoundingClientRect();
      var fp = list[i][0].fp;
      fp.x = Math.max(0, Math.min(0.96,
        (rtl ? (r.right - nr.right) : (nr.left - r.left)) / z / W));
      fp.y = Math.max(0, Math.round((nr.top - r.top) / z));
      this.fpLive(list[i][0], fp.y);
      list[i][1].style.left = '';
    }
    this.doc.fpv = 2;
    if (list.length) this.mark(true);
  };

  function offRel(node, base) {
    var r1 = node.getBoundingClientRect(), r0 = base.getBoundingClientRect();
    return r1.top - r0.top;
  }

  Editor.prototype.stripBreaks = function (tbl) {
    var rs = tbl.querySelectorAll('tr[data-brk]'), i;
    for (i = 0; i < rs.length; i++) rs[i].parentNode.removeChild(rs[i]);
  };

  Editor.prototype.clearTableBreaks = function () {
    var ts = this.root.querySelectorAll('table.ne-tbl'), i;
    for (i = 0; i < ts.length; i++) {
      this.stripBreaks(ts[i]);
      ts[i].removeAttribute('data-brk-sig');
    }
  };

  /*@3.NOEJ.217*/
  Editor.prototype.fitTable = function (tbl, top0, ph, pad, z) {
    this.stripBreaks(tbl);
    var body = tbl.tBodies[0] || tbl;
    var rows = [].slice.call(tbl.rows);
    if (rows.length < 2) { tbl.removeAttribute('data-brk-sig'); return false; }

    var hdrH = rows[0].getBoundingClientRect().height / z;
    var cols = rows[0].cells.length;
    var tblTop = tbl.getBoundingClientRect().top;
    var cuts = [], acc = 0, i;

    for (i = 1; i < rows.length; i++) {
      var r = rows[i].getBoundingClientRect();
      var rt = top0 + (r.top - tblTop) / z + acc;
      var rh = r.height / z;
      var pg = Math.floor(rt / ph);
      var limit = (pg + 1) * ph - pad - CUT_SAFE;
      if (rt + rh <= limit + 0.5) continue;
      var gap = Math.round((pg + 1) * ph + pad - rt);
      if (gap <= 0) continue;
      cuts.push({ i: i, gap: gap });
      acc += gap + hdrH;
    }

    var sig = cuts.map(function (c) { return c.i + ':' + c.gap; }).join(',') +
      '|' + Math.round(hdrH) + '|' + cols;
    var prev = tbl.getAttribute('data-brk-sig');
    var same = prev === sig;
    tbl.setAttribute('data-brk-sig', sig);
    if (!cuts.length) return !!(prev && !same && prev.indexOf(':') >= 0);

    for (i = cuts.length - 1; i >= 0; i--) {
      var at = rows[cuts[i].i];
      var host = at.parentNode || body;
      var hc = rows[0].cloneNode(true);
      hc.setAttribute('data-brk', 'h');
      var hcs = hc.querySelectorAll('td,th'), k;
      for (k = 0; k < hcs.length; k++) {
        hcs[k].removeAttribute('contenteditable');
        hcs[k].removeAttribute('data-bid');
      }
      hc.setAttribute('aria-hidden', 'true');
      host.insertBefore(hc, at);

      var gp = document.createElement('tr');
      gp.setAttribute('data-brk', 'g');
      gp.setAttribute('aria-hidden', 'true');
      var gtd = document.createElement('td');
      gtd.colSpan = cols;
      gtd.className = 'ne-brk-g';
      gtd.style.height = cuts[i].gap + 'px';
      gp.appendChild(gtd);
      host.insertBefore(gp, hc);
    }
    return !same;
  };

  Editor.prototype.tableGuard = function (a, map) {
    var ph = this.pageH(), off = this.root.offsetTop || 0;
    var pad = off > 0 ? off : 16;
    var z = this.zoomOf() || 1;
    var changed = false, i;
    if (!map) map = this.bidMap();
    for (i = 0; i < this.doc.blocks.length; i++) {
      var b = this.doc.blocks[i];
      if (!b || b.ty !== 'tbl' || b.fp) continue;
      var node = map[b.id];
      var tbl = node && node.querySelector('table.ne-tbl');
      if (!tbl || a[i] == null) continue;
      var inner = offRel(tbl, node) / z;
      if (this.fitTable(tbl, a[i] + off + inner, ph, pad, z)) changed = true;
    }
    return changed;
  };

  /*@3.NOEJ.154*/
  /*@3.NOEJ.238*/
  /*@3.NOEJ.441*/
  Editor.prototype.a4H = function () {
    var v = 0;
    try { v = parseFloat(getComputedStyle(this.root).getPropertyValue('--na-sheeth')) || 0; } catch (e) {}
    return v > 200 ? v : 1123;
  };
  /*@3.NOEJ.502*/
  Editor.prototype.pageTop = function () {
    var f = this.opts.pagePad, v = 0;
    try { v = f ? Number(f()) : 0; } catch (e) { v = 0; }
    return (v > 0 && v < this.a4H() * 0.4) ? v : 0;
  };
  Editor.prototype.sizeBreaks = function () {
    if (!this.root || this.doc.kind === 'board') return 0;
    var bs = this.doc.blocks, i, n = 0, any = false;
    for (i = 0; i < bs.length; i++) if (bs[i] && bs[i].ty === 'pb') { any = true; break; }
    if (!any) return 0;
    var H = this.a4H(), off = this.root.offsetTop || 0, z = this.zoomOf() || 1;
    var map = this.bidMap();
    /*@3.NOEJ.467*/
    var rr = this.root.getBoundingClientRect(), reads = [], q;
    for (i = 0; i < bs.length; i++) {
      var b = bs[i];
      if (!b || b.ty !== 'pb') continue;
      var node = map[b.id], box = node ? node.querySelector('.ne-pb') : null;
      if (!node || !box) continue;
      var nxt = null;
      for (q = i + 1; q < bs.length; q++) { if (bs[q] && !bs[q].fp && map[bs[q].id]) { nxt = map[bs[q].id]; break; } }
      var nr = node.getBoundingClientRect();
      var curM = parseFloat(node.style.marginBlockStart) || 0;
      var boxH = parseFloat(box.style.blockSize) || 0;
      /*@3.NOEJ.459*/
      var prv = null;
      for (q = i - 1; q >= 0; q--) { if (bs[q] && !bs[q].fp && bs[q].ty !== 'pb' && map[bs[q].id]) { prv = map[bs[q].id]; break; } }
      reads.push({ b: b, node: node, box: box, curM: curM, boxH: boxH,
                   natural: (nr.top - rr.top) / z - curM,
                   mt: nxt ? Math.max(0, (nxt.getBoundingClientRect().top - nr.bottom) / z) : 0,
                   extra: Math.max(0, (nr.height / z) - boxH),
                   pbot: prv ? ((prv.getBoundingClientRect().bottom - rr.top) / z) : null });
    }
    var shift = 0, k;
    for (k = 0; k < reads.length; k++) {
      var rd = reads[k];
      var natural = rd.natural + shift;
      var pbot = (rd.pbot == null) ? natural : rd.pbot + shift;
      if (pbot > natural) pbot = natural;
      var bound = Math.ceil((pbot + off - 0.5) / H) * H - off + this.pageTop();
      var need = Math.round((bound - natural - rd.mt - rd.extra) * 100) / 100;
      var hPx = Math.max(0.01, need), mPx = Math.min(0, need);
      shift += (hPx + mPx) - (Math.max(0.01, rd.boxH) + rd.curM);
      if (Math.abs(rd.boxH - hPx) >= 0.05) rd.box.style.blockSize = hPx + 'px';
      if (Math.abs(rd.curM - mPx) >= 0.05) rd.node.style.marginBlockStart = mPx ? (mPx + 'px') : '';
      if (Math.abs((rd.b.h || 0) - need) >= 0.5) { rd.b.h = need; n++; }
    }
    if (n) this._engStale = true;
    return n;
  };

  /*@3.NOEJ.442*/
  /*@3.NOEJ.516*/
  Editor.prototype.staleMark = function (id) { (this._stale || (this._stale = {}))[id] = 1; };
  /*@3.NOEJ.517*/
  function spChain(bs, from, was, now) {
    var j;
    for (j = from; j < bs.length; j++) { if (bs[j] && !bs[j].fp && bs[j].sp === was) { bs[j].sp = now; return; } }
  }
  Editor.prototype.splitUnits = function (id, k) {
    var hit = this.blockAt(id);
    if (!hit || !(k > 0)) return null;
    var b = hit.b, nb = null, bs = this.doc.blocks;
    if (b.ty === 'tbl') {
      var rows = b.rows || [];
      if (k + 1 >= rows.length) return null;
      nb = JSON.parse(JSON.stringify(b));
      nb.id = B().uid();
      nb.rows = [JSON.parse(JSON.stringify(rows[0]))].concat(rows.slice(k + 1));
      nb.sp = b.id;
      b.rows = rows.slice(0, k + 1);
      bs.splice(hit.i + 1, 0, nb);
      spChain(bs, hit.i + 2, b.id, nb.id);
      this.staleMark(b.id);
      return nb.id;
    }
    if (b.ty === 'code') {
      /*@3.NOEJ.471*/
      var ls = String(b.src == null ? '' : b.src).split('\n');
      if (k >= ls.length) return null;
      nb = B().blank('code', { lang: b.lang || '', src: ls.slice(k).join('\n') });
      if (b.fs) nb.fs = b.fs;
      if (b.card) nb.card = b.card;
      nb.sp = b.id;
      b.src = ls.slice(0, k).join('\n');
      bs.splice(hit.i + 1, 0, nb);
      spChain(bs, hit.i + 2, b.id, nb.id);
      this.staleMark(b.id);
      return nb.id;
    }
    /*@3.NOEJ.507*/
    if ((b.ty === 'p' || b.ty === 'h' || b.ty === 'quote' || b.ty === 'callout') && Array.isArray(b.rt)) {
      var off = this.lineOffset(b, k);
      if (!(off > 0) || off >= runsLen(b.rt)) return null;
      var prt = sliceRuns(b.rt, off, off);
      nb = JSON.parse(JSON.stringify(b));
      nb.id = B().uid();
      nb.rt = joinRuns([prt[2]]);
      nb.sp = b.id;
      b.rt = joinRuns([prt[0]]);
      delete nb.cardStart; delete nb.cardTitle; delete b.cardEnd;
      bs.splice(hit.i + 1, 0, nb);
      spChain(bs, hit.i + 2, b.id, nb.id);
      this.staleMark(b.id);
      return nb.id;
    }
    if (b.ty === 'ul' || b.ty === 'ol' || b.ty === 'dl' || b.ty === 'todo') {
      var items = b.items || [];
      if (k >= items.length) return null;
      nb = JSON.parse(JSON.stringify(b));
      nb.id = B().uid();
      nb.items = items.slice(k);
      nb.sp = b.id;
      if (b.ty === 'ol') {
        var cnt = 0, q;
        for (q = 0; q < k; q++) if (!items[q].lv && B().runsToText(items[q].rt || []) !== '') cnt++;
        nb.start = (b.start || 1) + cnt;
      }
      b.items = items.slice(0, k);
      bs.splice(hit.i + 1, 0, nb);
      spChain(bs, hit.i + 2, b.id, nb.id);
      this.staleMark(b.id);
      return nb.id;
    }
    return null;
  };

  /*@3.NOEJ.518*/
  Editor.prototype.joinUnits = function (id) {
    var hit = this.blockAt(id);
    if (!hit || !hit.b.sp || hit.b.fp) return null;
    var t = hit.b, bs = this.doc.blocks, h = null, j;
    for (j = hit.i - 1; j >= 0; j--) { if (!bs[j] || bs[j].fp || bs[j].ty === 'pb') continue; h = bs[j]; break; }
    if (!h || h.id !== t.sp || h.ty !== t.ty) return null;
    if (t.ty === 'tbl') h.rows = (h.rows || []).concat((t.rows || []).slice(1));
    else if (t.ty === 'code') h.src = String(h.src == null ? '' : h.src) + '\n' + String(t.src == null ? '' : t.src);
    else if (Array.isArray(t.items) && Array.isArray(h.items)) h.items = h.items.concat(t.items);
    else if (Array.isArray(t.rt) && Array.isArray(h.rt)) h.rt = joinRuns([h.rt, t.rt]);
    else return null;
    if (t.cardEnd) h.cardEnd = 1;
    this.staleMark(h.id);
    bs.splice(hit.i, 1);
    for (j = 0; j < bs.length; j++) if (bs[j] && bs[j].sp === t.id) bs[j].sp = h.id;
    return h.id;
  };

  /*@3.NOEJ.519*/
  Editor.prototype.joinCard = function (id) {
    var hit = this.blockAt(id);
    if (!hit || !hit.b.spc || hit.b.fp || !hit.b.card) return null;
    var c = hit.b, bs = this.doc.blocks, p = null, j;
    for (j = hit.i - 1; j >= 0; j--) { if (!bs[j] || bs[j].fp || bs[j].ty === 'pb') continue; p = bs[j]; break; }
    var k0 = this.blockAt(c.spc);
    if (!p || !k0 || !p.card || String(p.card) !== String(k0.b.card)) return null;
    var ncid = String(c.card);
    for (j = hit.i + 1; j < bs.length; j++) {
      if (!bs[j] || bs[j].fp) continue;
      if (String(bs[j].card) !== ncid) break;
      bs[j].card = p.card;
      this.staleMark(bs[j].id);
    }
    delete p.cardEnd;
    this.staleMark(p.id);
    bs.splice(hit.i, 1);
    for (j = 0; j < bs.length; j++) if (bs[j] && bs[j].spc === c.id) bs[j].spc = c.spc;
    return p.id;
  };

  Editor.prototype.lineOffset = function (b, k) {
    var K = window.GardenNotesPaper;
    if (!K || !K.textRows || !this.root || !this.root.parentNode) return 0;
    var lab = document.createElement('div'), at = this.root.attributes, q;
    for (q = 0; q < at.length; q++) { if (at[q].name === 'id' || at[q].name === 'style' || at[q].name === 'contenteditable') continue; lab.setAttribute(at[q].name, at[q].value); }
    lab.setAttribute('aria-hidden', 'true');
    lab.dir = this.root.dir || (this.isRtl() ? 'rtl' : 'ltr');
    var W = this.root.getBoundingClientRect().width / (this.zoomOf() || 1);
    lab.style.cssText = (this.root.style.cssText || '') + ';position:absolute;inset-block-start:0;inset-inline-start:-99999px;inline-size:' + (W > 40 ? W : 794) + 'px;min-block-size:0;block-size:auto;visibility:hidden;pointer-events:none;contain:layout style';
    var node = this.renderBlock(b);
    lab.appendChild(node);
    this.root.parentNode.appendChild(lab);
    var out = 0;
    try {
      var host = node.querySelector('.ne-text'), rows = K.textRows(host);
      if (host && rows && k > 0 && k < rows.length) {
        var top = rows[k].top - 1, total = offsetIn(host, host, host.childNodes.length), lo = 1, hi = total, rg = document.createRange();
        var topAt = function (pos) { var a = pointAt(host, pos), bq = pointAt(host, pos + 1); if (!a || !bq) return -1; try { rg.setStart(a.node, a.off); rg.setEnd(bq.node, bq.off); } catch (e) { return -1; } var rr = rg.getBoundingClientRect(); return rr.height > 0 ? rr.top : -1; };
        while (lo < hi) { var mid = (lo + hi) >> 1, t = topAt(mid); if (t < 0 || t < top) lo = mid + 1; else hi = mid; }
        out = lo;
      }
    } catch (eL) { out = 0; }
    lab.remove();
    return out;
  };

  Editor.prototype.splitCard = function (kidId) {
    var hit = this.blockAt(kidId);
    if (!hit || !hit.b.card) return null;
    var cid = String(hit.b.card), bs = this.doc.blocks, i0 = hit.i, j;
    while (i0 > 0 && bs[i0 - 1] && !bs[i0 - 1].fp && String(bs[i0 - 1].card) === cid) i0--;
    if (i0 === hit.i) return null;
    var head = JSON.parse(JSON.stringify(bs[i0]));
    head.id = B().uid();
    delete head.sp;
    head.spc = bs[i0].id;
    var ncid = B().uid();
    head.card = ncid;
    for (j = hit.i; j < bs.length; j++) {
      if (!bs[j] || bs[j].fp) continue;
      if (String(bs[j].card) !== cid) break;
      bs[j].card = ncid;
      this.staleMark(bs[j].id);
    }
    /*@3.NOEJ.460*/
    for (j = hit.i - 1; j >= i0; j--) { if (bs[j] && !bs[j].fp) { bs[j].cardEnd = 1; this.staleMark(bs[j].id); break; } }
    bs.splice(hit.i, 0, head);
    for (j = hit.i + 1; j < bs.length; j++) { if (bs[j] && !bs[j].fp && bs[j].spc === head.spc) { bs[j].spc = head.id; break; } }
    return head.id;
  };

  Editor.prototype.captureEng = function (full) {
    if (this.doc.kind === 'board') return;
    /*@3.NOEJ.311*/
    if (this._engIn) { if (full) this._engStale = true; return; }
    this._engIn = 1;
    try { this.engPass(full); } finally { this._engIn = 0; }
    if (!this._engStale && !this._engRecap && this.opts.onEng) { try { this.opts.onEng(); } catch (eE) {} }
  };

  Editor.prototype.engPass = function (full) {
    /*@3.NOEJ.509*/
    if (this.natOk() && this._nat && this._nat.u) {
      if (this.sizeBreaksModel()) { this._engStale = false; this.reflowEng(); }
    } else if (this.sizeBreaks()) { this._nat = null; full = true; void this.root.offsetHeight; }
    /*@3.NOEJ.284*/
    if (this._win) {
      if (!full) { this.winSettle(); return; }
      this.winClear();
    }
    /*@3.NOEJ.213*/
    if (!this._engStale && !this._engVerify && this._nat &&
        this.doc.eng && this.doc.eng.pbv === PBV && engFresh(this.doc.eng)) {
      this.winBind();
      if (this.winOk()) this.winApply(false);
      return;
    }
    this._engVerify = false;
    /*@3.NOEJ.157*/
    var faceOk = true;
    try {
      faceOk = document.fonts.status === 'loaded' &&
               document.fonts.check('16px "Frutiger LT Arabic"');
    } catch (eF) {}
    /*@3.NOEJ.422*/
    if (!faceOk) { this._engRecap = full ? 'full' : true; return; }

    /*@3.NOEJ.203*/
    if (this._pv) this.pvStripAll();
    codeFlush();
    this.tblFlushAll();
    this.tblFitAll();
    this.dgmFitAll();
    var i, b, node;
    var map = this.bidMap();
    var bs = this.doc.blocks, n = bs.length;
    var top = new Array(n), hgt = new Array(n), nds = new Array(n), uu = new Array(n);
    var mine = new Array(n), live = 0;
    /*@3.NOEJ.241*/
    var rr0 = this.root.getBoundingClientRect(), r0 = rr0.top;
    /*@3.NOEJ.279*/
    var z = this.zoomOf() || 1;
    var rootW = rr0.width / z, rootL = rr0.left / z;
    for (i = 0; i < n; i++) {
      b = bs[i];
      node = b.fp ? null : map[b.id];
      if (!node) { top[i] = null; hgt[i] = 0; nds[i] = null; mine[i] = 0; uu[i] = null; continue; }
      var rr = node.getBoundingClientRect();
      top[i] = (rr.top - r0) / z;
      hgt[i] = rr.height / z;
      nds[i] = node;
      uu[i] = this.natUnitsOf(b, node, rr, z, rootW, rootL);
      /*@3.NOEJ.239*/
      mine[i] = node.__bd || 0;
      live++;
    }
    if (!live) {
      delete this.doc.eng;
      this.clearTableBreaks();
      this.clearMargins();
      return;
    }

    var oldA = (this.doc.eng && this.doc.eng.v === 3 &&
                Array.isArray(this.doc.eng.a) && this.doc.eng.a.length === n)
               ? this.doc.eng.a : null;
    var oldPb = (this.doc.eng && Array.isArray(this.doc.eng.pb) &&
                 this.doc.eng.pb.length === n) ? this.doc.eng.pb : null;
    /*@3.NOEJ.421*/

    var out = this.breakGuard(top, hgt, nds, mine);
    if (this._nat) this._nat.u = uu;
    this._cold = null;
    /*@3.NOEJ.182*/
    var cd = contentDir(this.doc);
    if (cd) this.doc.bd = cd; else delete this.doc.bd;
    var pad0 = this.root.offsetTop || 16;
    /*@3.NOEJ.158*/
    var mk = {};
    for (i = 0; i < n; i++) if (out.m[i] > 0) mk[bs[i].id] = out.m[i];
    this.doc.eng = { v: 3, w: 794, h: Math.round(this._engBot + pad0),
                     a: out.a, pb: out.pb, mk: mk, pbv: PBV, lv: LV, nat: this.natPack() };
    this._engStale = false;
    this.applyEng();
    this.mkFix(out, nds, r0, z);
    this._engBot = 0;
    for (i = 0; i < n; i++) {
      if (!nds[i] || out.a[i] == null) continue;
      out.a[i] = (nds[i].getBoundingClientRect().top - r0) / z;
      var bot = out.a[i] + hgt[i];
      if (bot > this._engBot) this._engBot = bot;
    }
    this.doc.eng.h = Math.round(this._engBot + pad0);
    /*@3.NOEJ.226*/
    if (this.root.querySelector('table.ne-tbl')) {
      /*@3.NOEJ.219*/
      var pass = (this._engPass || 0) + 1;
      /*@3.NOEJ.222*/
      if (pass < 3 && this.tableGuard(out.a, map)) {
        this._engPass = pass;
        this._engStale = true;
        this.engPass(true);
        this._engPass = 0;
        return;
      }
      this._engPass = 0;
    }
    /*@3.NOEJ.298*/
    this.winBind();
    if (this.winOk()) this.winApply(true);
    else if (this._pv) { this._pvA = null; this.pvApply(); }
  };

  /*@3.NOEJ.277*/
  Editor.prototype.mkFix = function (out, nds, r0, z) {
    var bs = this.doc.blocks, n = Math.min(bs.length, out.m.length);
    var map = nds ? null : this.bidMap();
    var round, carry, worst, i, node, act, e2, mk, any = false;
    if (r0 == null) r0 = this.root.getBoundingClientRect().top;
    if (!(z > 0.05)) z = this.zoomOf() || 1;
    for (round = 0; round < 2; round++) {
      carry = 0; worst = 0;
      for (i = 0; i < n; i++) {
        if (!(out.m[i] > 0) || out.a[i] == null) continue;
        node = nds ? nds[i] : map[bs[i].id];
        if (!node) continue;
        act = (node.getBoundingClientRect().top - r0) / z;
        e2 = (act - out.a[i]) - carry;
        if (Math.abs(e2) <= 0.4) continue;
        out.m[i] = Math.max(0, Math.round((out.m[i] - e2) * 100) / 100);
        carry += e2;
        any = true;
        if (Math.abs(e2) > worst) worst = Math.abs(e2);
      }
      if (!worst) break;
      mk = {};
      for (i = 0; i < bs.length; i++) if (out.m[i] > 0) mk[bs[i].id] = out.m[i];
      this.doc.eng.mk = mk;
      this.applyEng();
    }
    return any;
  };

/*@3.NOEJ.427*/
  /*@3.NOEJ.209*//*@3.NOEJ.405*//*@3.NOEJ.417*//*@3.NOEJ.420*//*@3.NOEJ.424*//*@3.NOEJ.425*/

  /*@3.NOEJ.208*/
  Editor.prototype.breakGuard = function (top, hgt, nds, mine) {
    var n = top.length, i;
    var gap = new Array(n), lh = new Array(n), ids = new Array(n);
    var prevBot = 0, first = true, std = 0;
    var bs = this.doc.blocks;
    for (i = 0; i < n; i++) {
      ids[i] = bs[i] ? bs[i].id : '';
      lh[i] = 0;
      if (top[i] == null) { gap[i] = null; continue; }
      var g = (first ? top[i] : (top[i] - prevBot)) - (mine[i] || 0);
      gap[i] = g > 0 ? g : 0;
      if (!first && !std && gap[i] > 0) std = gap[i];
      first = false;
      prevBot = top[i] + (hgt[i] || 0);
    }
    this._nat = { gap: gap, hgt: hgt.slice(), lh: lh, ids: ids,
                  std: std, n: n,
                  ph: this.pageH(), pad: this.root.offsetTop || 0 };
    this._natIdx = null;
    return this.breakCalc();
  };

  Editor.prototype.breakCalc = function () {
    var nat = this._nat;
    if (!nat) return null;
    var ph = nat.ph || this.pageH();
    var off = nat.pad == null ? (this.root.offsetTop || 0) : nat.pad;
    var pad = off > 0 ? off : 16;
    var room = ph - pad * 2;
    var gap = nat.gap, hgt = nat.hgt, lh = nat.lh;
    var bs = this.doc.blocks, n = gap.length, i;
    var a = new Array(n), pb = new Array(n), m = new Array(n);
    var y = 0, acc = 0;
    this._engBot = 0;
    for (i = 0; i < n; i++) {
      if (gap[i] == null) { a[i] = null; pb[i] = acc; m[i] = 0; continue; }
      y += gap[i];
      var t = y + off, h = hgt[i] || 0;
      var pg = Math.floor(t / ph);
      var limit = (pg + 1) * ph - pad - CUT_SAFE;
      var d = 0;
      if (h > 0 && t + h > limit + 0.5) {
        if (h <= room) {
          /*@3.NOEJ.215*/
          d = (pg + 1) * ph + pad - t;
        } else if (bs[i] && bs[i].ty === 'tbl') {
          /*@3.NOEJ.221*/
          d = 0;
        } else {
          /*@3.NOEJ.216*/
          var L = lh[i];
          if (!L) {
            L = lineOf(bs[i]
              ? this.root.querySelector(':scope > [data-bid="' + bs[i].id + '"]')
              : null);
            lh[i] = L;
          }
          if (L > 4) {
            var over = (limit - t) % L;
            if (over > 0.5) d = L - over;
          }
        }
      }
      if (d > 0.5) { y += d; acc += d; m[i] = Math.round(d * 100) / 100; }
      else { d = 0; m[i] = 0; }
      a[i] = y;
      pb[i] = acc;
      y += h;
      if (y > this._engBot) this._engBot = y;
    }
    return { a: a, pb: pb, m: m };
  };

  function rleOut(arr) {
    var out = [], i, v, n = 0, cur;
    for (i = 0; i < arr.length; i++) {
      v = arr[i];
      if (n && v === cur) { n++; continue; }
      if (n) out.push(n === 1 ? cur : [n, cur]);
      cur = v; n = 1;
    }
    if (n) out.push(n === 1 ? cur : [n, cur]);
    return out;
  }

  function rleIn(src, len) {
    if (!Array.isArray(src)) return null;
    var out = [], i, e, k, any = (len >= 1e9);
    for (i = 0; i < src.length; i++) {
      e = src[i];
      if (Array.isArray(e)) {
        if (!(e[0] > 0)) return null;
        for (k = 0; k < e[0]; k++) out.push(e[1]);
      } else out.push(e);
      if (!any && out.length > len) return null;
    }
    return (any || out.length === len) ? out : null;
  }

  /*@3.NOEJ.312*/
  Editor.prototype.natPack = function () {
    var nat = this._nat, bs = this.doc.blocks;
    if (!nat || nat.ids.length !== bs.length) return null;
    var g = new Array(bs.length), h = new Array(bs.length), i, v;
    for (i = 0; i < bs.length; i++) {
      v = nat.gap[i];
      g[i] = (v == null) ? null : Math.round(v * 100) / 100;
      v = nat.hgt[i];
      h[i] = (v == null) ? 0 : Math.round(v * 100) / 100;
    }
    /*@3.NOEJ.481*/
    var u = null;
    if (nat.u && nat.u.length === bs.length) {
      u = new Array(bs.length);
      for (i = 0; i < bs.length; i++) {
        var q = nat.u[i];
        if (!q) { u[i] = 0; continue; }
        u[i] = [r4(q.l || 0), r4(q.h || 0), q.un ? rleOut(q.un.map(r4)) : 0, r2(q.s || 0), r2(q.w || 0), r2(q.ce || 0), q.cw ? q.cw.map(r2) : 0, r2(q.tw || 0)];
      }
      u = rleOut(u.map(function (x) { return x === 0 ? 0 : JSON.stringify(x); }));
    }
    /*@3.NOEJ.561*/
    var tf = null, tq;
    if (this._tfit) {
      for (i = 0; i < bs.length; i++) {
        tq = bs[i].ty === 'tbl' ? this._tfit[bs[i].id] : null;
        if (!tq || !(tq.w > 40)) continue;
        if (!tf) tf = {};
        tf[bs[i].id] = tq.m ? [r2(tq.w), tq.m, r2(tq.fs || 0)] : [r2(tq.w)];
      }
    }
    return { n: bs.length, g: rleOut(g), h: rleOut(h), u: u, tf: tf,
             std: Math.round((nat.std || 0) * 100) / 100,
             ph: Math.round(nat.ph || 0), pad: Math.round(nat.pad || 0) };
  };

  Editor.prototype.natLoad = function () {
    var eng = this.doc.eng, bs = this.doc.blocks;
    if (!eng || eng.v !== 3 || !engFresh(eng) || eng.w !== 794) return false;
    if (!Array.isArray(eng.a) || eng.a.length !== bs.length) return false;
    if (this.doc.kind === 'board') return false;
    var nt = eng.nat;
    if (!nt || nt.n !== bs.length) return false;
    if (!(nt.ph > 200) || Math.abs(nt.ph - this.pageH()) > 1) return false;
    var gap = rleIn(nt.g, bs.length), hgt = rleIn(nt.h, bs.length);
    if (!gap || !hgt) return false;
    var i;
    var ids = new Array(bs.length), lh = new Array(bs.length);
    for (i = 0; i < bs.length; i++) { ids[i] = bs[i].id; lh[i] = 0; }
    this._nat = { gap: gap, hgt: hgt, lh: lh, ids: ids,
                  std: nt.std || 2.4, n: bs.length,
                  ph: nt.ph, pad: nt.pad || 0 };
    var us = nt.u ? rleIn(nt.u, bs.length) : null, u = null;
    if (us) {
      u = new Array(bs.length);
      for (i = 0; i < bs.length; i++) {
        var raw = us[i], q = null;
        if (raw && raw !== 0) {
          try { var arr = JSON.parse(raw); q = { l: arr[0] || 0, h: arr[1] || 0, un: arr[2] ? rleIn(arr[2], 1e9) : null }; if (arr[3] || arr[4]) { q.s = arr[3] || 0; q.w = arr[4] || 0; } if (arr[5]) q.ce = arr[5]; if (arr[6] && arr[7] > 0) { q.cw = arr[6]; q.tw = arr[7]; } if (q.un === null && arr[2]) q = null; } catch (eJ) { q = null; }
        }
        u[i] = q;
      }
    }
    this._nat.u = u;
    this._natIdx = null;
    /*@3.NOEJ.562*/
    if (nt.tf && typeof nt.tf === 'object') {
      if (!this._tfit) this._tfit = {};
      for (i = 0; i < bs.length; i++) {
        var tfI = bs[i].ty === 'tbl' ? nt.tf[bs[i].id] : null;
        if (!Array.isArray(tfI) || !(tfI[0] > 40) || this._tfit[bs[i].id]) continue;
        this._tfit[bs[i].id] = (tfI[1] === 'fs' || tfI[1] === 'wrap') ? { w: tfI[0], m: tfI[1], fs: tfI[2] } : { w: tfI[0], m: '' };
      }
    }
    return true;
  };

  Editor.prototype.natIdx = function () {
    var nat = this._nat;
    if (!nat) return null;
    if (this._natIdx && this._natIdx.n === nat.ids.length) return this._natIdx.m;
    var m = {}, i;
    for (i = 0; i < nat.ids.length; i++) m[nat.ids[i]] = i;
    this._natIdx = { n: nat.ids.length, m: m };
    return m;
  };

  Editor.prototype.natSplice = function (at, del, ids) {
    var nat = this._nat;
    if (!nat) return false;
    if (at < 0 || at > nat.ids.length) return false;
    var add = ids ? ids.length : 0, i;
    var g = nat.std || 2.4;
    var ng = [], nh = [], nl = [];
    for (i = 0; i < add; i++) { ng.push(g); nh.push(0); nl.push(0); }
    if (at === 0 && add && nat.gap.length && nat.gap[0] != null) {
      ng[0] = nat.gap[0];
      if (del < nat.gap.length) nat.gap[del] = g;
    }
    Array.prototype.splice.apply(nat.gap, [at, del].concat(ng));
    Array.prototype.splice.apply(nat.hgt, [at, del].concat(nh));
    Array.prototype.splice.apply(nat.lh, [at, del].concat(nl));
    if (nat.u) Array.prototype.splice.apply(nat.u, [at, del].concat(nl.map(function () { return null; })));
    Array.prototype.splice.apply(nat.ids, [at, del].concat(ids || []));
    nat.n = nat.ids.length;
    this._natIdx = null;
    return true;
  };

  Editor.prototype.natMove = function (from, to) {
    var nat = this._nat;
    if (!nat || from === to) return false;
    if (from < 0 || from >= nat.ids.length || to < 0 || to >= nat.ids.length) return false;
    var keys = ['gap', 'hgt', 'lh', 'ids', 'u'], k;
    for (k = 0; k < keys.length; k++) {
      var arr = nat[keys[k]];
      if (!arr) continue;
      arr.splice(to, 0, arr.splice(from, 1)[0]);
    }
    this._natIdx = null;
    return true;
  };

  function r2(v) { return Math.round(v * 100) / 100; }
  function r4(v) { return Math.round(v * 10000) / 10000; }

  /*@3.NOEJ.493*/
  Editor.prototype.renderInto = function (root) {
    var bs = this.doc.blocks, i, node, frag = document.createDocumentFragment();
    var was = this._noLazy; this._noLazy = true;
    try {
      for (i = 0; i < bs.length; i++) { node = this.renderBlock(bs[i]); frag.appendChild(node); }
    } finally { this._noLazy = was; }
    root.appendChild(frag);
    var imgsR = root.querySelectorAll('img.ne-img');
    for (i = 0; i < imgsR.length; i++) if (imgsR[i].getAttribute('loading') === 'lazy') imgsR[i].setAttribute('loading', 'eager');
    var fills = root.querySelectorAll('[data-tblfill]');
    for (i = 0; i < fills.length; i++) if (fills[i].__tblFill) fills[i].__tblFill(true);
    this.tblFitAll(root);
    this.tblFitOff(root);
    if (this.dgmApply) { try { this.dgmApply(root); } catch (eD) {} }
    imFill(root);
    return bs.length;
  };
  /*@3.NOEJ.570*/
  function imFill(scope) {
    var ims = scope.querySelectorAll('.ne-im[data-tex]'), miss = 0, i, k;
    for (i = 0; i < ims.length; i++) {
      if (ims[i].querySelector('mjx-container')) continue;
      k = 'i:' + ims[i].getAttribute('data-tex');
      if (MATHC[k]) { ims[i].__tex = k; ims[i].innerHTML = MATHC[k]; } else miss++;
    }
    return miss;
  }
  Editor.prototype.mathIds = function () {
    var bs = this.doc.blocks, out = [], i, b;
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (!b || b.fp) continue;
      if ((b.ty === 'math' && String(b.tex || '').trim()) || inlineTexes(b, {}, [], true).length) out.push(b.id);
    }
    return out;
  };
  /*@3.NOEJ.571*/
  function inlineTexes(v, seen, out, all) {
    if (!v || typeof v !== 'object') return out;
    if (all && out.length) return out;
    if (Array.isArray(v)) { for (var i = 0; i < v.length; i++) inlineTexes(v[i], seen, out, all); return out; }
    if (v.mth && typeof v.s === 'string' && v.s.trim()) {
      var k = 'i:' + v.s;
      if ((all || !MATHC[k]) && !seen[k]) { seen[k] = 1; out.push(v.s); }
      return out;
    }
    for (var key in v) if (Object.prototype.hasOwnProperty.call(v, key) && v[key] && typeof v[key] === 'object') inlineTexes(v[key], seen, out, all);
    return out;
  }

  Editor.prototype.mathPrecache = function () {
    var bs = this.doc.blocks, todo = [], i, b;
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (!b || b.ty !== 'math' || !String(b.tex || '').trim() || MATHC[b.tex]) continue;
      todo.push(b);
    }
    var inl = inlineTexes(bs, {}, []);
    if (!todo.length && !inl.length) return Promise.resolve(0);
    var lab = document.createElement('div');
    lab.className = 'ne-root';
    lab.setAttribute('aria-hidden', 'true');
    lab.style.cssText = 'position:absolute;inset-block-start:0;inset-inline-start:-99999px;inline-size:' + (this.sheetW() || 794) + 'px;visibility:hidden;pointer-events:none';
    var hosts = [];
    for (i = 0; i < todo.length; i++) {
      var out = document.createElement('div');
      out.className = 'ne-math-out';
      out.__tex = todo[i].tex;
      out.textContent = '\\[' + todo[i].tex + '\\]';
      lab.appendChild(out); hosts.push(out);
    }
    if (inl.length) {
      var para = document.createElement('div');
      para.className = 'ne-text';
      for (i = 0; i < inl.length; i++) {
        var sp = document.createElement('span');
        sp.className = 'ne-im';
        sp.setAttribute('dir', 'ltr');
        sp.__tex = 'i:' + inl[i];
        sp.textContent = '\\(' + inl[i] + '\\)';
        para.appendChild(sp);
        para.appendChild(document.createTextNode(' '));
        hosts.push(sp);
      }
      lab.appendChild(para);
    }
    (this.root.parentNode || document.body).appendChild(lab);
    var fin = function () { lab.remove(); return todo.length + inl.length; };
    try { return Promise.resolve(typesetMany(hosts)).then(fin, fin); } catch (e) { return Promise.resolve(fin()); }
  };

  /*@3.NOEJ.495*/
  Editor.prototype.imgSettle = function (capMs) {
    var self = this, bs = this.doc.blocks, jobs = [], ids = [], i, b, cap = capMs || 15000;
    var S = window.GardenNotesStore, B0 = B();
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (!b || b.ty !== 'img' || b.fp) continue;
      var srcU = '';
      if (B0.localImg && B0.localImg(b.url)) srcU = (S && S.imageUrlNow) ? S.imageUrlNow(String(b.url).slice(11)) : '';
      else srcU = B0.imgSrc ? B0.imgSrc(b.url) : '';
      if (!srcU) continue;
      if (b.iar > 0 && b.inw > 0) { ids.push(b.id); continue; }
      jobs.push((function (blk, u) {
        return new Promise(function (res) {
          var im = new Image(), t = setTimeout(function () { res(false); }, cap);
          im.onload = function () {
            clearTimeout(t);
            if (im.naturalWidth > 0 && im.naturalHeight > 0) {
              blk.iar = Math.round((im.naturalWidth / im.naturalHeight) * 1000) / 1000;
              blk.inw = im.naturalWidth;
              ids.push(blk.id);
            }
            res(true);
          };
          im.onerror = function () { clearTimeout(t); res(false); };
          if (!B0.localImg || !B0.localImg(blk.url)) im.referrerPolicy = 'no-referrer';
          im.src = u;
        });
      }(b, srcU)));
    }
    for (i = 0; i < bs.length; i++) if (bs[i] && bs[i].ty === 'math' && !bs[i].fp && String(bs[i].tex || '').trim()) ids.push(bs[i].id);
    var fin = function () {
      var live = self.bidMap(), out = [], q;
      for (q = 0; q < ids.length; q++) if (!live[ids[q]]) out.push(ids[q]);
      if (out.length) { try { self.natMeasure(out); } catch (eM) {} }
      return out.length;
    };
    if (!jobs.length) return Promise.resolve(fin());
    return Promise.all(jobs).then(fin, fin);
  };

  Editor.prototype.settleDone = function (capMs) {
    var self = this, t0 = Date.now(), cap = capMs || 60000;
    return new Promise(function (res) {
      if (self._cold && !self._cold.go) self.coldRun();
      (function tick() {
        var busy = !!self._dgmSettling || !!self._cold;
        try { if (document.fonts && document.fonts.status !== 'loaded') busy = true; } catch (e) {}
        if (!busy || Date.now() - t0 > cap) { res(!busy); return; }
        setTimeout(tick, 100);
      }());
    });
  };

  /*@3.NOEJ.494*/
  Editor.prototype.syncModel = function (prevIds, touched) {
    var nat = this._nat;
    if (!nat || !prevIds) return false;
    var bs = this.doc.blocks, i, id, cur = {}, prev = {}, measure = [], k;
    for (i = 0; i < bs.length; i++) cur[bs[i].id] = i;
    for (i = 0; i < prevIds.length; i++) prev[prevIds[i]] = i;
    /*@3.NOEJ.504*/
    var nextLeaf = function (from) { var q; for (q = from; q < bs.length; q++) { if (bs[q] && !bs[q].fp && bs[q].ty !== 'pb') return bs[q].id; } return null; };
    var after = [];
    for (i = prevIds.length - 1; i >= 0; i--) {
      if (cur[prevIds[i]] == null) { k = this.natIdx()[prevIds[i]]; if (k != null && nat.ids[k] === prevIds[i]) this.natSplice(k, 1, []); if (prevIds[i + 1] != null && cur[prevIds[i + 1]] != null) after.push(prevIds[i + 1]); }
    }
    for (i = 0; i < bs.length; i++) {
      id = bs[i].id;
      if (prev[id] != null) continue;
      this.natSplice(i, 0, [id]);
      /*@3.NOEJ.506*/
      if (bs[i].ty === 'pb') { k = this.natIdx()[id]; if (k != null) { nat.gap[k] = 0; nat.hgt[k] = Math.max(0.01, Number(bs[i].h) || 0.01); } measure.push(id); }
      else if (!bs[i].fp) measure.push(id);
      var nxId = nextLeaf(i + 1);
      if (nxId && prev[nxId] != null) after.push(nxId);
    }
    for (i = 0; i < after.length; i++) { if (cur[after[i]] != null && !bs[cur[after[i]]].fp && bs[cur[after[i]]].ty !== 'pb' && measure.indexOf(after[i]) < 0) measure.push(after[i]); }
    if (touched) for (i = 0; i < touched.length; i++) { if (cur[touched[i]] != null && measure.indexOf(touched[i]) < 0) measure.push(touched[i]); }
    if (measure.length) this.natMeasure(measure);
    this.reflowEng();
    return true;
  };

  Editor.prototype.natUnitsOf = function (b, node, r, z, rootW, rootL) {
    var K = window.GardenNotesPaper;
    if (!b || !node || b.fp || !K || !K.unitsOf) return null;
    var u = null, out = null;
    try { u = K.unitsOf(b, node, r, z); } catch (e) { u = null; }
    if (u && u.units && u.units.length) {
      out = { l: u.lead || 0, h: u.head || 0, un: u.units.slice() };
      if (u.vis) out.vis = 1;
      if (b.ty === 'tbl' && !node.querySelector('tr[data-hollow]')) {
        var tb0 = node.querySelector('table.ne-tbl'), tr0 = tb0 ? tb0.rows[0] : null, cw = [], c;
        if (tr0) { for (c = 0; c < tr0.cells.length; c++) cw.push(Math.round(tr0.cells[c].getBoundingClientRect().width / z * 100) / 100); out.cw = cw; out.tw = Math.round(tb0.getBoundingClientRect().width / z * 100) / 100; }
      }
    }
    if (node.hasAttribute('data-card-end')) {
      var ce = 0;
      try { var cs = getComputedStyle(node); ce = (parseFloat(cs.paddingBlockEnd) || 0) + (parseFloat(cs.borderBlockEndWidth) || 0); } catch (eC) { ce = 0; }
      if (ce > 0) { out = out || {}; out.ce = r2(ce); }
    }
    if (rootW > 0) {
      var s = (this.isRtl() ? (rootL + rootW - r.right / z) : (r.left / z - rootL)), w = r.width / z;
      if (Math.abs(s) > 0.5 || Math.abs(w - rootW) > 0.5) { out = out || {}; out.s = r2(s); out.w = r2(w); }
    }
    return out;
  };

  /*@3.NOEJ.482*/
  /*@3.NOEJ.563*/
  Editor.prototype.labRoot = function () {
    var W = this.sheetW() || 794, lab = document.createElement('div'), at = this.root.attributes, q;
    for (q = 0; q < at.length; q++) { if (at[q].name === 'id' || at[q].name === 'style' || at[q].name === 'contenteditable') continue; lab.setAttribute(at[q].name, at[q].value); }
    lab.setAttribute('aria-hidden', 'true');
    lab.dir = this.root.dir || (this.isRtl() ? 'rtl' : 'ltr');
    var rw = this.root.getBoundingClientRect().width / (this.zoomOf() || 1);
    if (rw > 40) W = rw;
    lab.style.cssText = (this.root.style.cssText || '') + ';position:absolute;inset-block-start:0;inset-inline-start:-99999px;inline-size:' + W + 'px;min-block-size:0;block-size:auto;visibility:hidden;pointer-events:none;contain:layout style';
    return lab;
  };

  Editor.prototype.natMeasure = function (ids) {
    var nat = this._nat, idx = this.natIdx();
    if (!nat || !idx || !ids || !ids.length || !this.root || !this.root.parentNode) return 0;
    var self = this, i, b, k, hit, nodes = [], done = 0;
    var lab = this.labRoot();
    /*@3.NOEJ.503*/
    var bsL = this.doc.blocks;
    for (i = 0; i < ids.length; i++) {
      hit = this.blockAt(ids[i]);
      if (!hit || hit.b.fp) continue;
      k = idx[ids[i]];
      if (k == null || nat.ids[k] !== ids[i]) continue;
      var prevB = null, qP;
      for (qP = hit.i - 1; qP >= 0; qP--) { if (bsL[qP] && !bsL[qP].fp) { prevB = bsL[qP]; break; } }
      if (prevB) {
        var stub = document.createElement('div');
        stub.className = 'ne-b ne-b-' + prevB.ty;
        stub.setAttribute('data-ty', prevB.ty);
        try { this.applyStyleAttrs(stub, prevB); } catch (eS) {}
        lab.appendChild(stub);
      }
      var node = this.renderBlock(hit.b);
      lab.appendChild(node);
      nodes.push([k, node, hit.b, prevB ? stub : null]);
    }
    if (!nodes.length) return 0;
    this.root.parentNode.appendChild(lab);
    if (this.dgmApply) { try { this.dgmApply(lab); } catch (eD) {} }
    imFill(lab);
    codeFlush();
    for (i = 0; i < nodes.length; i++) if (nodes[i][1].__tblFill) nodes[i][1].__tblFill(true);
    this.tblFitAll(lab);
    this.dgmFitAll(lab);
    var lr = lab.getBoundingClientRect();
    /*@3.NOEJ.550*/
    var zL = lab.offsetWidth > 0 ? lr.width / lab.offsetWidth : 1;
    if (!(isFinite(zL) && zL > 0.05)) zL = 1;
    for (i = 0; i < nodes.length; i++) {
      k = nodes[i][0]; b = nodes[i][2];
      var rr = nodes[i][1].getBoundingClientRect();
      /*@3.NOEJ.505*/
      var gapK = (rr.top - (nodes[i][3] ? nodes[i][3].getBoundingClientRect().bottom : lr.top)) / zL;
      if (gapK >= 0 && Math.abs((nat.gap[k] || 0) - gapK) >= 0.004) { nat.gap[k] = gapK; done++; }
      var h = rr.height / zL;
      if (!(h > 0)) continue;
      if (Math.abs((nat.hgt[k] || 0) - h) >= 0.02) { nat.hgt[k] = h; nat.lh[k] = 0; done++; }
      if (nat.u) nat.u[k] = this.natUnitsOf(b, nodes[i][1], rr, zL, lr.width / zL, lr.left / zL);
    }
    lab.remove();
    return done;
  };

  /*@3.NOEJ.556*/
  var COLD_MS = 36;
  function coldGuess(b, W) {
    var cpl = Math.max(20, Math.floor(W / 8.6)), LH = 27;
    var len = function (rt) { var n = 0, i; for (i = 0; rt && i < rt.length; i++) n += String(rt[i].s || '').length; return n; };
    var lines = function (n) { return Math.max(1, Math.ceil(n / cpl)); };
    var s = 0;
    switch (b.ty) {
      case 'h': return 40 + (lines(len(b.rt)) - 1) * 34;
      case 'p': case 'todo': return lines(len(b.rt)) * LH;
      case 'quote': case 'callout': return lines(len(b.rt)) * LH + 22;
      case 'ul': case 'ol': case 'dl':
        (b.items || []).forEach(function (it) { s += lines(len(it.rt)) * LH; });
        return Math.max(LH, s);
      case 'code': return isDiagram(b) ? (b.dh > 0 ? b.dh : 320) : String(b.src || '').split('\n').length * 21 + 28;
      case 'tbl': return Math.max(1, (b.rows || []).length) * 34 + 4;
      case 'math': return 64;
      case 'img': return b.iar > 0 ? Math.min(W, b.inw || W) / b.iar : 280;
      case 'hr': return 17;
      case 'pb': return Math.max(0.01, Number(b.h) || 0.01);
      case 'gap': return Number(b.h) > 0 ? Number(b.h) : 40;
      case 'ink': return Number(b.h) > 0 ? Number(b.h) : 200;
    }
    return LH;
  }
  /*@3.NOEJ.557*/
  Editor.prototype.coldSeed = function () {
    var bs = this.doc.blocks, n = bs.length, i;
    if (n < WIN_MIN || this.doc.kind === 'board' || this.opts.win === false) return false;
    if (this.opts.win !== true && !winSwitch()) return false;
    var eng0 = this.doc.eng, nt = eng0 && eng0.nat, g0 = null, h0 = null;
    if (nt && nt.n === n) { g0 = rleIn(nt.g, n); h0 = rleIn(nt.h, n); }
    var W = this.sheetW() || 794, std = (nt && nt.std > 0) ? nt.std : 2.4;
    var gap = new Array(n), hgt = new Array(n), lh = new Array(n), ids = new Array(n), u = new Array(n);
    for (i = 0; i < n; i++) {
      ids[i] = bs[i].id; lh[i] = 0; u[i] = null;
      if (bs[i].fp) { gap[i] = null; hgt[i] = 0; continue; }
      if (g0 && h0 && g0[i] != null && h0[i] > 0) { gap[i] = g0[i]; hgt[i] = h0[i]; }
      else { gap[i] = i ? std : 0; hgt[i] = coldGuess(bs[i], W); }
    }
    this._nat = { gap: gap, hgt: hgt, lh: lh, ids: ids, std: std, n: n,
                  ph: this.pageH(), pad: this.root.offsetTop || 0, u: u };
    this._natIdx = null;
    this._cold = { i: 0, done: {}, go: 0 };
    var out = this.breakCalc(), mk = {};
    for (i = 0; i < n; i++) if (out.m[i] > 0) mk[bs[i].id] = out.m[i];
    var pad0 = this._nat.pad > 0 ? this._nat.pad : 16;
    this.doc.eng = { v: 3, w: 794, h: Math.round(this._engBot + pad0), a: out.a, pb: out.pb, mk: mk, pbv: 0,
                     nat: (eng0 && eng0.nat) || null };
    if (this.winOk()) return true;
    this._nat = null; this._natIdx = null; this._cold = null;
    if (eng0) this.doc.eng = eng0; else delete this.doc.eng;
    return false;
  };
  Editor.prototype.coldBusy = function () { return !!this._cold; };
  /*@3.NOEJ.558*/
  Editor.prototype.coldRun = function () {
    var self = this, st = this._cold;
    if (!st || st.go) return;
    st.go = 1;
    var chunk = 16, flowAt = Date.now();
    var step = function () {
      if (self._destroyed || self._cold !== st || !self.root || !self.root.isConnected) return;
      if (!self.natOk()) { self.coldEnd(false); return; }
      var bs = self.doc.blocks, n = bs.length, live = self.bidMap(), ids = [], nodes = [], w = 0, b, q;
      var wOf = function (x) {
        if (live[x.id]) return 0.2;
        if (x.ty === 'tbl') return 1 + ((x.rows || []).length * ((x.rows && x.rows[0]) || []).length) / 30;
        if (x.ty === 'code') return 1 + String(x.src || '').length / 3000;
        return 1;
      };
      var take = function (x) {
        var wx = wOf(x);
        if (w > 0 && w + wx > chunk * 1.5) return false;
        st.done[x.id] = 1;
        if (live[x.id]) nodes.push(live[x.id]); else ids.push(x.id);
        w += wx;
        return true;
      };
      while (st.i < n && w < chunk) {
        b = bs[st.i];
        if (b && !b.fp && !st.done[b.id] && !take(b)) break;
        st.i++;
      }
      if (st.i >= n && w < chunk) {
        for (q = 0; q < n && w < chunk; q++) if (bs[q] && !bs[q].fp && !st.done[bs[q].id] && !take(bs[q])) break;
      }
      if (!ids.length && !nodes.length) { self.coldEnd(true); return; }
      var t0 = Date.now();
      if (nodes.length) { try { self.natSync(nodes); } catch (eS) {} }
      for (q = 0; q < n && bs[q] && bs[q].fp; q++) {}
      if (nodes.length && bs[q] && live[bs[q].id] && self._win && self._win.from <= q) {
        var nd0 = live[bs[q].id], z0 = self.zoomOf() || 1;
        var g0 = (nd0.getBoundingClientRect().top - self.root.getBoundingClientRect().top) / z0 - (nd0.__bd || 0);
        if (g0 >= 0 && !(parseFloat(self._winA && self._winA.style.blockSize) > 0)) self._nat.gap[q] = g0;
      }
      if (ids.length) { try { self.natMeasure(ids); } catch (eM) {} }
      var dt = Date.now() - t0;
      chunk = Math.max(4, Math.min(600, Math.round(chunk * Math.max(0.5, Math.min(2, COLD_MS / Math.max(2, dt))))));
      if (Date.now() - flowAt > 650) { flowAt = Date.now(); self.reflowEng(); }
      setTimeout(step, 0);
    };
    var go = function () { setTimeout(step, 0); };
    fontsReady().then(go, go);
  };
  Editor.prototype.coldEnd = function (ok) {
    if (!this._cold) return;
    this._cold = null;
    if (!ok || !this.natOk()) { this._nat = null; this._natIdx = null; this._engStale = true; this.settled(); return; }
    var live = this.root.querySelectorAll(':scope > [data-bid]'), arr = [], i;
    for (i = 0; i < live.length; i++) arr.push(live[i]);
    this.natSync(arr);
    this.reflowEng();
    if (this.opts.onEng) { try { this.opts.onEng(); } catch (eE) {} }
    if (this.doc.eng && this.opts.onSave) this.opts.onSave(this.doc, true);
  };

  /*@3.NOEJ.262*/
  Editor.prototype.natSync = function (nodes) {
    var nat = this._nat, idx = this.natIdx();
    if (!nat || !idx || !nodes) return false;
    var i, id, k, h, hit = false;
    var zn = this.zoomOf() || 1;
    var rr0 = this.root.getBoundingClientRect(), rootW = rr0.width / zn, rootL = rr0.left / zn;
    for (i = 0; i < nodes.length; i++) {
      if (!nodes[i] || !nodes[i].getAttribute) continue;
      if (nodes[i].hasAttribute('data-fp')) continue;
      id = nodes[i].getAttribute('data-bid');
      k = idx[id];
      if (k == null || nat.ids[k] !== id) continue;
      var dN = !!(this._pv && nodes[i].querySelector('.ne-pg'));
      if (dN) this.pvStrip(nodes[i]);
      var rc = nodes[i].getBoundingClientRect();
      h = rc.height / zn;
      if (nat.u) { var bu = this.doc.blocks[k]; if (bu && bu.id === id) nat.u[k] = this.natUnitsOf(bu, nodes[i], rc, zn, rootW, rootL); }
      if (dN) this.pvDress(nodes[i], true);
      if (!nodes[i].__pgm && !nodes[i].classList.contains('ne-w0')) {
        var pvN = nodes[i].previousElementSibling;
        while (pvN && pvN.hasAttribute && (pvN.hasAttribute('data-fp') || pvN.hasAttribute('data-pgc'))) pvN = pvN.previousElementSibling;
        if (pvN && pvN.hasAttribute && pvN.hasAttribute('data-bid')) {
          var gN = (rc.top - pvN.getBoundingClientRect().bottom) / zn;
          if (gN >= 0 && Math.abs((nat.gap[k] || 0) - gN) >= 0.004) { nat.gap[k] = gN; hit = true; }
        }
      }
      if (Math.abs((nat.hgt[k] || 0) - h) < 0.02) continue;
      nat.hgt[k] = h;
      nat.lh[k] = 0;
      hit = true;
    }
    return hit;
  };

  Editor.prototype.natHeightOf = function (id) {
    var nat = this._nat, idx = this.natIdx();
    if (!nat || !idx || idx[id] == null) return 0;
    var k = idx[id];
    return (nat.ids[k] === id && nat.hgt[k] > 0) ? nat.hgt[k] : 0;
  };

  Editor.prototype.natUnitOf = function (id) {
    var nat = this._nat, idx = this.natIdx();
    if (!nat || !nat.u || !idx || idx[id] == null) return null;
    var k = idx[id];
    return (nat.ids[k] === id) ? (nat.u[k] || null) : null;
  };

  Editor.prototype.tioAdd = function (tr, fill) {
    var self = this;
    if (typeof IntersectionObserver !== 'function') { fill(tr); return; }
    if (!this._tio) {
      this._tio = new IntersectionObserver(function (ents) {
        var i, n;
        for (i = 0; i < ents.length; i++) {
          if (!ents[i].isIntersecting) continue;
          n = ents[i].target;
          try { self._tio.unobserve(n); } catch (eU) {}
          if (n.__fill) n.__fill(n);
        }
      }, { root: null, rootMargin: '1200px 0px' });
    }
    tr.__fill = fill;
    this._tio.observe(tr);
  };

  Editor.prototype.tblFlushAll = function () {
    var list = this.root ? this.root.querySelectorAll(':scope > [data-tblfill]') : [], i, n = 0;
    for (i = 0; i < list.length; i++) { if (list[i].__tblFill) { list[i].__tblFill(true); n++; } }
    return n;
  };

  /*@3.NOEJ.499*/
  function tblNatW(node, tbl, how) {
    var wasI = tbl.style.inlineSize, wasL = tbl.style.tableLayout;
    var cols = tbl.querySelectorAll('colgroup > col'), q, keep = [];
    for (q = 0; q < cols.length; q++) { keep.push(cols[q].style.inlineSize); cols[q].style.inlineSize = ''; }
    tbl.style.inlineSize = ''; tbl.style.tableLayout = '';
    node.setAttribute('data-tmeas', how || '1');
    var w = tbl.offsetWidth;
    node.removeAttribute('data-tmeas');
    tbl.style.inlineSize = wasI;
    tbl.style.tableLayout = wasL;
    for (q = 0; q < cols.length; q++) cols[q].style.inlineSize = keep[q];
    return w;
  }

  Editor.prototype.tblFit = function (node) {
    var tbl = node ? node.querySelector('table.ne-tbl') : null;
    if (!tbl || !tbl.parentNode) return 0;
    var avail = tbl.parentNode.clientWidth;
    if (!(avail > 40)) return 0;
    if (node.__tfitW === avail) return 0;
    node.__tfitW = avail;
    var id = node.getAttribute('data-bid');
    var mode = node.getAttribute('data-tfit') || '';
    /*@3.NOEJ.510*/
    var memo = (id && this._tfit) ? this._tfit[id] : null;
    if (memo && memo.w === avail && !node.__dirty) {
      if (memo.m) { node.setAttribute('data-tfit', memo.m); node.style.setProperty('--ne-tfs', memo.fs + 'px'); }
      else if (mode) { node.removeAttribute('data-tfit'); node.style.removeProperty('--ne-tfs'); }
      return (memo.m || mode) ? 1 : 0;
    }
    if (mode) { node.removeAttribute('data-tfit'); node.style.removeProperty('--ne-tfs'); }
    var natW = tblNatW(node, tbl);
    if (natW <= avail + 0.5 || ((avail / natW < TFIT_SOFT || node.hasAttribute('data-fs')) && tblNatW(node, tbl, 'min') <= avail + 0.5)) {
      if (id) { if (!this._tfit) this._tfit = {}; this._tfit[id] = { w: avail, m: '' }; }
      return mode ? 1 : 0;
    }
    var cell = node.querySelector('.ne-cell'), base = 13.76;
    try { base = parseFloat(getComputedStyle(cell || tbl).fontSize) || 13.76; } catch (eF) {}
    node.setAttribute('data-tfit', 'fs');
    var fs = base, k;
    for (k = 0; k < 4; k++) {
      fs = Math.max(TFIT_MIN, fs * avail / Math.max(1, tblNatW(node, tbl)));
      node.style.setProperty('--ne-tfs', (Math.round(fs * 100) / 100) + 'px');
      if (tblNatW(node, tbl) <= avail + 0.5) break;
      if (fs <= TFIT_MIN + 0.01) break;
    }
    /*@3.NOEJ.500*/
    if (tblNatW(node, tbl) > avail + 0.5) node.setAttribute('data-tfit', 'wrap');
    if (id) {
      if (!this._tfit) this._tfit = {};
      this._tfit[id] = { fs: Math.round(fs * 100) / 100, m: node.getAttribute('data-tfit'), w: avail };
    }
    return 1;
  };

  function tblNatWAll(its, how) {
    var i, q, it, cols, out = new Array(its.length);
    for (i = 0; i < its.length; i++) {
      it = its[i]; cols = it.tbl.querySelectorAll('colgroup > col');
      it.keep = { i: it.tbl.style.inlineSize, l: it.tbl.style.tableLayout, c: [] };
      for (q = 0; q < cols.length; q++) { it.keep.c.push(cols[q].style.inlineSize); cols[q].style.inlineSize = ''; }
      it.tbl.style.inlineSize = ''; it.tbl.style.tableLayout = '';
      it.node.setAttribute('data-tmeas', how || '1');
    }
    for (i = 0; i < its.length; i++) out[i] = its[i].tbl.offsetWidth;
    for (i = 0; i < its.length; i++) {
      it = its[i]; cols = it.tbl.querySelectorAll('colgroup > col');
      it.node.removeAttribute('data-tmeas');
      it.tbl.style.inlineSize = it.keep.i; it.tbl.style.tableLayout = it.keep.l;
      for (q = 0; q < cols.length; q++) cols[q].style.inlineSize = it.keep.c[q];
    }
    return out;
  }
  /*@3.NOEJ.578*/
  Editor.prototype.dgmFitMax = function () {
    var f = this.opts && this.opts.dgFit, v = 0;
    try { v = f ? (+f() || 0) : 0; } catch (eF) { v = 0; }
    return v > 80 ? v : 0;
  };
  /*@3.NOEJ.581*/
  Editor.prototype.dgmLead = function (blk) {
    var id = blk.getAttribute('data-bid'), hit = id ? this.blockAt(id) : null, bs = this.doc.blocks, j;
    if (!hit) return 0;
    for (j = hit.i - 1; j >= 0 && bs[j] && bs[j].fp; j--) {}
    if (j < 0 || !bs[j] || bs[j].ty !== 'h') return 0;
    var nat = this._nat, idx = this.natIdx ? this.natIdx() : null, k = idx ? idx[id] : null, kp = idx ? idx[bs[j].id] : null;
    if (nat && k != null && kp != null && nat.ids[kp] === bs[j].id && nat.hgt[kp] > 0) return nat.hgt[kp] + (nat.gap[k] || 0);
    var pv = this.bidMap()[bs[j].id];
    if (pv && pv.parentNode === blk.parentNode && blk.offsetWidth > 0) {
      var z = blk.getBoundingClientRect().width / blk.offsetWidth;
      return Math.max(0, (blk.getBoundingClientRect().top - pv.getBoundingClientRect().top) / (z > 0.05 ? z : 1));
    }
    return 0;
  };
  Editor.prototype.dgmFitAll = function (root, over) {
    var host = root || this.root;
    if (!host) return 0;
    var max = (over != null) ? over : this.dgmFitMax();
    var svgs = host.querySelectorAll('[data-bid] .ne-dgm:not([data-vz]) > svg'), todo = [], i, s, n = 0;
    for (i = 0; i < svgs.length; i++) if (svgs[i].__dfitK !== max) todo.push(svgs[i]);
    if (!todo.length) return 0;
    for (i = 0; i < todo.length; i++) {
      s = todo[i]; s.__dfitW = s.style.maxBlockSize ? s.style.maxBlockSize : '';
      if (s.__dfitW) { s.style.maxBlockSize = ''; s.style.inlineSize = ''; }
    }
    var meas = new Array(todo.length);
    for (i = 0; i < todo.length; i++) {
      s = todo[i];
      var blk = s.closest('[data-bid]'), ow = blk ? blk.offsetWidth : 0;
      if (!(ow > 0)) { meas[i] = null; continue; }
      var br = blk.getBoundingClientRect(), z = br.width / ow, sh = s.getBoundingClientRect().height;
      if (!(z > 0.05) || !(sh > 0)) { meas[i] = null; continue; }
      meas[i] = { bh: br.height / z, sh: sh / z, lim: max > 0 ? max - this.dgmLead(blk) : 0 };
    }
    for (i = 0; i < todo.length; i++) {
      s = todo[i];
      var m = meas[i], v = '';
      if (!m) { if (s.__dfitW) { s.style.maxBlockSize = s.__dfitW; s.style.inlineSize = 'auto'; } continue; }
      if (max > 0 && m.bh > m.lim + 0.5) {
        v = Math.max(48, Math.floor((m.sh - (m.bh - m.lim) - 1) * 100) / 100) + 'px';
        s.style.maxBlockSize = v; s.style.inlineSize = 'auto';
      }
      if (v !== s.__dfitW) n++;
      s.__dfitK = max;
    }
    var ph = host.querySelectorAll('[data-bid] .ne-dgm[data-dh]:not([data-vz])'), pl = [], hp, dh;
    for (i = 0; i < ph.length; i++) {
      hp = ph[i];
      if (hp.hidden || hp.querySelector(':scope > svg') || !hp.style.minBlockSize) continue;
      dh = parseFloat(hp.getAttribute('data-dh')) || 0;
      if (!(dh > 0) || (hp.__dfitK === max && hp.__dfitP === hp.style.minBlockSize)) continue;
      pl.push([hp, dh, hp.style.minBlockSize]);
      hp.style.minBlockSize = dh + 'px';
    }
    for (i = 0; i < pl.length; i++) {
      hp = pl[i][0]; dh = pl[i][1];
      var pb = hp.closest('[data-bid]'), pw = pb ? pb.offsetWidth : 0;
      if (max > 0 && pw > 0) {
        var prr = pb.getBoundingClientRect(), pz = prr.width / pw, pbh = prr.height / (pz > 0.05 ? pz : 1), plim = max - this.dgmLead(pb);
        if (pbh > plim + 0.5) hp.style.minBlockSize = Math.max(48, Math.floor((dh - (pbh - plim) - 1) * 100) / 100) + 'px';
      } else if (max > 0) { hp.style.minBlockSize = pl[i][2]; continue; }
      if (hp.style.minBlockSize !== pl[i][2]) n++;
      hp.__dfitK = max; hp.__dfitP = hp.style.minBlockSize;
    }
    return n;
  };
  /*@3.NOEJ.579*/
  Editor.prototype.dgmRefit = function () {
    var max = this.dgmFitMax(), was = this._dgFitK;
    if (was === max) return false;
    this._dgFitK = max;
    if (!this.root || !this.doc || this.doc.kind === 'board') return false;
    var n = this.dgmFitAll(this.root);
    if (was == null && !max) return false;
    var bs = this.doc.blocks, map = this.bidMap(), live = [], off = [], i;
    for (i = 0; i < bs.length; i++) {
      if (!bs[i] || !isDiagram(bs[i])) continue;
      if (map[bs[i].id]) live.push(map[bs[i].id]); else off.push(bs[i].id);
    }
    if (!live.length && !off.length) return false;
    if (this._nat && this.natOk()) {
      var hit = live.length ? this.natSync(live) : false;
      var got = off.length ? this.natMeasure(off) : 0;
      if (!(hit || got)) return false;
      this.reflowEng();
      return true;
    }
    if (!n) return false;
    try { this.captureEng(true); } catch (eC) {}
    return true;
  };
  /*@3.NOEJ.580*/
  Editor.prototype.dgmFitPlan = function (max) {
    var out = {}, bs = this.doc && this.doc.blocks, nat = this._nat, idx = this.natIdx ? this.natIdx() : null, map = this.bidMap(), list = [], i, b, k, h;
    if (!bs || !(max > 80) || !this.root || !this.root.parentNode) return out;
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (!b || b.fp || !isDiagram(b) || (b.dgm != null && !b.dgm)) continue;
      h = 0;
      if (nat && idx && (k = idx[b.id]) != null && nat.ids[k] === b.id) h = nat.hgt[k] || 0;
      else if (map[b.id]) h = map[b.id].getBoundingClientRect().height / (this.zoomOf() || 1);
      if (h > max - 160 || (b.dh || 0) + 60 > max - 160) list.push(b);
    }
    var key = max + '|' + list.map(function (x) { return x.id + ':' + String(x.src || '').length + ':' + (x.dh || 0); }).join(',');
    if (this._dgPlan && this._dgPlan.k === key && this._dgPlan.w === (this.sheetW() || 0)) return this._dgPlan.out;
    this._dgPlan = { k: key, w: this.sheetW() || 0, out: out };
    if (!list.length) return out;
    var lab = this.labRoot(), nodes = [];
    for (i = 0; i < list.length; i++) { var nd = this.renderBlock(list[i]); lab.appendChild(nd); nodes.push(nd); }
    this.root.parentNode.appendChild(lab);
    try {
      if (this.dgmApply) { try { this.dgmApply(lab); } catch (eD) {} }
      this.dgmFitAll(lab, max);
      for (i = 0; i < nodes.length; i++) {
        var sv = nodes[i].querySelector('.ne-dgm > svg'), ow = nodes[i].offsetWidth;
        if (!sv || !sv.style.maxBlockSize || !(ow > 0)) continue;
        var r = nodes[i].getBoundingClientRect(), z = r.width / ow;
        out[list[i].id] = { h: r.height / (z > 0.05 ? z : 1), mb: sv.style.maxBlockSize };
      }
      for (i = 0; i < nodes.length; i++) if (!nodes[i].querySelector('.ne-dgm > svg')) { this._dgPlan = null; break; }
    } finally { lab.remove(); }
    return out;
  };
  Editor.prototype.tblFitAll = function (root) {
    var host = root || this.root;
    if (!host) return 0;
    var list = host.querySelectorAll('[data-bid][data-ty="tbl"]'), i, k, n = 0, all = [], work = [], it, w;
    for (i = 0; i < list.length; i++) {
      var tbl = list[i].querySelector('table.ne-tbl');
      if (!tbl || !tbl.parentNode) continue;
      all.push({ node: list[i], tbl: tbl, avail: tbl.parentNode.clientWidth });
    }
    for (i = 0; i < all.length; i++) {
      it = all[i];
      if (!(it.avail > 40) || it.node.__tfitW === it.avail) continue;
      it.node.__tfitW = it.avail;
      it.id = it.node.getAttribute('data-bid');
      it.mode = it.node.getAttribute('data-tfit') || '';
      var memo = (it.id && this._tfit) ? this._tfit[it.id] : null;
      if (memo && memo.w === it.avail && !it.node.__dirty) {
        if (memo.m) { it.node.setAttribute('data-tfit', memo.m); it.node.style.setProperty('--ne-tfs', memo.fs + 'px'); }
        else if (it.mode) { it.node.removeAttribute('data-tfit'); it.node.style.removeProperty('--ne-tfs'); }
        if (memo.m || it.mode) n++;
        continue;
      }
      if (it.mode) { it.node.removeAttribute('data-tfit'); it.node.style.removeProperty('--ne-tfs'); }
      work.push(it);
    }
    if (!work.length) return n;
    /*@3.NOEJ.566*/
    var big = [], redo = [];
    for (i = 0; i < work.length; i++) if (tblSampleOn(work[i])) big.push(work[i]);
    try { n += this.tblFitRun(work); } finally { for (i = 0; i < big.length; i++) tblSampleOff(big[i]); }
    for (i = 0; i < big.length; i++) {
      it = big[i];
      if (tblFitHolds(it)) continue;
      it.node.removeAttribute('data-tfit'); it.node.style.removeProperty('--ne-tfs');
      redo.push({ node: it.node, tbl: it.tbl, avail: it.avail, id: it.id, mode: '' });
    }
    if (redo.length) this.tblFitRun(redo);
    return n;
  };

  /*@3.NOEJ.567*/
  function cellText(c) {
    var rt = c && c.rt, out = '', q;
    if (!rt) return '';
    for (q = 0; q < rt.length; q++) out += (rt[q] && rt[q].s) || '';
    return out;
  }
  function wordMax(s) {
    var best = 0, cur = 0, q, ch;
    for (q = 0; q < s.length; q++) {
      ch = s.charCodeAt(q);
      if (ch === 32 || ch === 10 || ch === 9 || ch === 160) { if (cur > best) best = cur; cur = 0; } else cur++;
    }
    return cur > best ? cur : best;
  }
  function top2(arr, r, v) {
    if (!(v > 0)) return;
    if (!arr[0] || v > arr[0][1]) { arr[1] = arr[0]; arr[0] = [r, v]; }
    else if (!arr[1] || v > arr[1][1]) arr[1] = [r, v];
  }
  function tblSampleOn(it) {
    var rows = it.node.__tblRows, mk = it.node.__tblMk, real = it.tbl;
    if (!rows || !mk || rows.length <= TBL_SAMPLE || !real.parentNode) return false;
    var cols = rows[0] ? rows[0].length : 0, r, c, q, s;
    if (!cols) return false;
    var seen = { 0: 1 }, pick = [0];
    for (c = 0; c < cols; c++) {
      var bl = [], bw = [];
      for (r = 1; r < rows.length; r++) {
        if (!rows[r] || !rows[r][c]) continue;
        s = cellText(rows[r][c]);
        top2(bl, r, s.length);
        top2(bw, r, wordMax(s));
      }
      var hs = bl.concat(bw);
      for (q = 0; q < hs.length; q++) if (hs[q] && !seen[hs[q][0]]) { seen[hs[q][0]] = 1; pick.push(hs[q][0]); }
    }
    if (pick.length * 2 > rows.length) return false;
    pick.sort(function (a, b) { return a - b; });
    var smp = real.cloneNode(false), cg = real.querySelector(':scope > colgroup');
    if (cg) smp.appendChild(cg.cloneNode(true));
    for (q = 0; q < pick.length; q++) smp.appendChild(mk(rows[pick[q]]));
    real.parentNode.insertBefore(smp, real.nextSibling);
    it.real = real; it.realDisp = real.style.display;
    real.style.display = 'none';
    it.tbl = smp;
    return true;
  }
  function tblSampleOff(it) {
    if (!it.real) return;
    if (it.tbl && it.tbl !== it.real && it.tbl.parentNode) it.tbl.parentNode.removeChild(it.tbl);
    it.real.style.display = it.realDisp || '';
    it.tbl = it.real;
    it.real = null;
  }
  function tblFitHolds(it) {
    var mode = it.node.getAttribute('data-tfit') || '';
    if (mode === 'wrap') return !(it.fs > TFIT_MIN + 0.01);
    var wf = tblNatWAll([it])[0];
    if (wf <= it.avail + 0.5) return true;
    if (mode) return false;
    if (!(it.avail / wf < TFIT_SOFT || it.node.hasAttribute('data-fs'))) return false;
    return tblNatWAll([it], 'min')[0] <= it.avail + 0.5;
  }

  Editor.prototype.tblFitRun = function (work) {
    var i, k, n = 0, it, w;
    if (!this._tfit) this._tfit = {};
    w = tblNatWAll(work);
    var soft = [];
    for (i = 0; i < work.length; i++) if (w[i] > work[i].avail + 0.5 && (work[i].avail / w[i] < TFIT_SOFT || work[i].node.hasAttribute('data-fs'))) soft.push(work[i]);
    if (soft.length) {
      var wm = tblNatWAll(soft, 'min');
      for (i = 0; i < soft.length; i++) soft[i].soft = wm[i] <= soft[i].avail + 0.5;
    }
    var fsI = [];
    for (i = 0; i < work.length; i++) {
      it = work[i];
      if (w[i] <= it.avail + 0.5 || it.soft) { if (it.id) this._tfit[it.id] = { w: it.avail, m: '' }; if (it.mode) n++; continue; }
      var cell = it.node.querySelector('.ne-cell');
      it.base = 13.76;
      try { it.base = parseFloat(getComputedStyle(cell || it.tbl).fontSize) || 13.76; } catch (eF) {}
      fsI.push(it);
    }
    if (!fsI.length) return n;
    for (i = 0; i < fsI.length; i++) { fsI[i].node.setAttribute('data-tfit', 'fs'); fsI[i].fs = fsI[i].base; }
    w = tblNatWAll(fsI);
    for (i = 0; i < fsI.length; i++) fsI[i].cur = w[i];
    var act = fsI.slice();
    for (k = 0; k < 4 && act.length; k++) {
      for (i = 0; i < act.length; i++) {
        it = act[i];
        it.fs = Math.max(TFIT_MIN, it.fs * it.avail / Math.max(1, it.cur));
        it.node.style.setProperty('--ne-tfs', (Math.round(it.fs * 100) / 100) + 'px');
      }
      w = tblNatWAll(act);
      for (i = 0; i < act.length; i++) act[i].cur = w[i];
      act = act.filter(function (x) { return x.cur > x.avail + 0.5 && x.fs > TFIT_MIN + 0.01; });
    }
    for (i = 0; i < fsI.length; i++) {
      it = fsI[i];
      if (it.cur > it.avail + 0.5) it.node.setAttribute('data-tfit', 'wrap');
      if (it.id) this._tfit[it.id] = { fs: Math.round(it.fs * 100) / 100, m: it.node.getAttribute('data-tfit'), w: it.avail };
      n++;
    }
    return n;
  };

  /*@3.NOEJ.564*/
  Editor.prototype.tblFitOff = function (root) {
    if (!root || root.isConnected || !this.root || !this.root.parentNode) return 0;
    var list = root.querySelectorAll('[data-bid][data-ty="tbl"]'), need = [], i, id;
    for (i = 0; i < list.length; i++) {
      id = list[i].getAttribute('data-bid');
      if (!(id && this._tfit && this._tfit[id])) need.push(list[i]);
    }
    if (!need.length) return 0;
    var lab = this.labRoot(), marks = [];
    for (i = 0; i < need.length; i++) {
      var mk = document.createComment('');
      need[i].parentNode.insertBefore(mk, need[i]);
      marks.push(mk);
      lab.appendChild(need[i]);
    }
    this.root.parentNode.appendChild(lab);
    try { this.tblFitAll(lab); } finally {
      lab.remove();
      for (i = 0; i < need.length; i++) { marks[i].parentNode.insertBefore(need[i], marks[i]); marks[i].remove(); }
    }
    return need.length;
  };

  Editor.prototype.natOk = function () {
    var nat = this._nat, bs = this.doc.blocks;
    if (!nat || nat.ids.length !== bs.length) return false;
    if (this.doc.kind === 'board') return false;
    return true;
  };

  /*@3.NOEJ.465*/
  Editor.prototype.sizeBreaksModel = function () {
    var nat = this._nat, bs = this.doc.blocks;
    if (!nat || !bs || nat.ids.length !== bs.length || this.doc.kind === 'board') return 0;
    /*@3.NOEJ.496*/
    var H = this.a4H(), off = (nat.pad > 0) ? nat.pad : (this.root.offsetTop || 0);
    var gap = nat.gap, hgt = nat.hgt, n = bs.length, i, q, y = 0, changed = 0;
    var prevBot = null, map = null;
    for (i = 0; i < n; i++) {
      if (gap[i] == null) continue;
      var b = bs[i];
      y += gap[i];
      if (b && b.ty === 'pb' && !b.fp) {
        var cur = Number(b.h) || 0, curM = Math.min(0, cur);
        var gap0 = gap[i] - curM;
        var aNat = (prevBot == null ? y - gap[i] : prevBot) + gap0;
        var extra = Math.max(0, (hgt[i] || 0) - Math.max(0.01, cur));
        var mt = 0;
        for (q = i + 1; q < n; q++) { if (bs[q] && !bs[q].fp && gap[q] != null) { mt = Math.max(0, gap[q]); break; } }
        var base = (prevBot == null) ? aNat : prevBot;
        if (base > aNat) base = aNat;
        var bound = Math.ceil((base + off - 0.5) / H) * H - off + this.pageTop();
        var need = Math.round((bound - aNat - mt - extra) * 100) / 100;
        /*@3.NOEJ.486*/
        var hv = (Math.abs(need - cur) >= 0.05) ? need : cur;
        if (hv !== cur) {
          b.h = need;
          if (!map) map = this.bidMap();
          var node = map[b.id], box = node ? node.querySelector('.ne-pb') : null;
          if (box) {
            box.style.blockSize = Math.max(0.01, need) + 'px';
            node.style.marginBlockStart = (need < 0) ? (need + 'px') : '';
          }
          changed++;
        }
        gap[i] = gap0 + Math.min(0, hv);
        hgt[i] = Math.max(0.01, hv) + extra;
        y = aNat + Math.min(0, hv) + hgt[i];
        continue;
      }
      if (!(b && b.fp)) prevBot = y + (hgt[i] || 0);
      y += hgt[i] || 0;
    }
    if (changed) { try { this.markLazy(); } catch (eM) {} }
    return changed;
  };

  Editor.prototype.reflowEng = function () {
    if (!this.natOk()) return false;
    this.sizeBreaksModel();
    var out = this.breakCalc();
    if (!out) return false;
    var bs = this.doc.blocks, mk = {}, i;
    for (i = 0; i < bs.length; i++) if (out.m[i] > 0) mk[bs[i].id] = out.m[i];
    var nat0 = this._nat;
    var pad0 = (nat0 && nat0.pad > 0) ? nat0.pad : (this.root.offsetTop || 16);
    var oldA = (this.doc.eng && Array.isArray(this.doc.eng.a) &&
                this.doc.eng.a.length === bs.length) ? this.doc.eng.a : null;
    var oldPb = (this.doc.eng && Array.isArray(this.doc.eng.pb) &&
                 this.doc.eng.pb.length === bs.length) ? this.doc.eng.pb : null;
    this.doc.eng = { v: 3, w: 794, h: Math.round(this._engBot + pad0),
                     a: out.a, pb: out.pb, mk: mk, pbv: this._cold ? 0 : PBV, lv: LV, nat: this.natPack() };
    this._engStale = false;
    this._natRe = (this._natRe || 0) + 1;
    if (this._natRe > 300) { this._natRe = 0; this._engVerify = true; }
    this._roOff = true;
    this.applyEng();
    this._roOff = false;
    if (this.opts.onLayout) this.opts.onLayout();
    if (this.opts.onGeom) this.opts.onGeom();
    return true;
  };

  /*@3.NOEJ.280*/
  Editor.prototype.winOk = function () {
    /*@3.NOEJ.307*/
    if (this.opts.win === false) return false;
    /*@3.NOEJ.458*/
    if (this._winHold) return false;
    if (this.opts.win !== true && !winSwitch()) return false;
    if (this.doc.kind === 'board') return false;
    if (!this.natOk()) return false;
    var eng = this.doc.eng, bs = this.doc.blocks;
    if (!eng || eng.v !== 3 || !Array.isArray(eng.a) || eng.a.length !== bs.length) return false;
    if (bs.length < WIN_MIN) return false;
    if (this._bdrag || this._drag || this._wdrag || this._rdrag) return false;
    if (this._bsel) { for (var q in this._bsel) if (this._bsel[q]) return false; }
    return !!this.scroller();
  };

  Editor.prototype.winHold = function (on) {
    this._winHold = !!on;
    if (on) { if (this._win) this.winClear(); return; }
    this.captureEng(true);
  };

  /*@3.NOEJ.285*/
  Editor.prototype.winBase = function (sc) {
    return this.root.getBoundingClientRect().top -
           sc.getBoundingClientRect().top + sc.scrollTop;
  };

  Editor.prototype.winRange = function (pad) {
    var sc = this.scroller();
    if (!sc) return null;
    var eng = this.doc.eng, nat = this._nat, n = this.doc.blocks.length;
    var z = this.zoomOf() || 1;
    var base = this.winBase(sc);
    var P = (pad != null) ? pad : WIN_PAD;
    var top = (sc.scrollTop - base) / z - P;
    var bot = (sc.scrollTop - base + sc.clientHeight) / z + P;
    var from = -1, to = -1, i, y0, y1, A = this.pvTops() || eng.a, bs = this.doc.blocks;
    for (i = 0; i < n; i++) {
      if (A[i] == null) continue;
      y0 = A[i];
      y1 = y0 + (nat.hgt[i] || 0) + (this._pv ? this.pvExtra(bs[i].id) : 0);
      if (y1 < top) continue;
      if (y0 > bot) break;
      if (from < 0) from = i;
      to = i;
    }
    if (from < 0) { from = 0; to = Math.min(n - 1, WIN_SPAN); }
    return [from, to];
  };

  /*@3.NOEJ.282*/
  Editor.prototype.winKeep = function () {
    /*@3.NOEJ.314*/
    var out = [], self = this, ce = this.currentEditable();
    var nd = ce && ce.closest ? ce.closest('[data-bid]') : null;
    if (nd && nd.parentNode === this.root) out.push(nd.getAttribute('data-bid'));
    if (this._actId) out.push(this._actId);
    var bs = this.doc.blocks, i;
    for (i = 0; i < bs.length; i++) if (bs[i].prov) out.push(bs[i].id);
    return out.filter(function (id) {
      var hit = self.blockAt(id);
      return !!hit && !hit.b.fp;
    });
  };

  Editor.prototype.winPin = function (rng) {
    var keep = this.winKeep(), i, hit, k;
    for (i = 0; i < keep.length; i++) {
      hit = this.blockAt(keep[i]);
      if (!hit) continue;
      k = hit.i;
      if (k >= rng[0] && k <= rng[1]) continue;
      if (k < rng[0] && rng[0] - k <= WIN_SPAN) { rng[0] = k; continue; }
      if (k > rng[1] && k - rng[1] <= WIN_SPAN) { rng[1] = k; continue; }
      /*@3.NOEJ.303*/
      var ce = this.currentEditable();
      if (ce && ce.closest && ce.closest('[data-bid="' + keep[i] + '"]')) {
        try { ce.blur(); } catch (eB) {}
      }
    }
    return rng;
  };

  /*@3.NOEJ.283*/
  Editor.prototype.winPad = function (which) {
    var key = which === 'a' ? '_winA' : '_winB';
    if (this[key] && this[key].parentNode === this.root) return this[key];
    var el = document.createElement('div');
    el.className = 'ne-win';
    el.setAttribute('data-win', which);
    el.setAttribute('aria-hidden', 'true');
    this[key] = el;
    return el;
  };

  /*@3.NOEJ.286*/
  Editor.prototype.winSet = function (from, to) {
    var bs = this.doc.blocks, root = this.root, eng = this.doc.eng, nat = this._nat;
    var i, node, id, k;
    var idx = {}, live = {};
    for (i = 0; i < bs.length; i++) idx[bs[i].id] = i;
    var kids = root.querySelectorAll(':scope > [data-bid]');
    var out = [], stale = this._stale;
    for (i = 0; i < kids.length; i++) {
      id = kids[i].getAttribute('data-bid');
      if (stale && stale[id]) { this.dropCanvas(id); this.roDrop(kids[i]); kids[i].remove(); continue; }
      k = idx[id];
      if (k != null && (bs[k].fp || (k >= from && k <= to))) { live[id] = kids[i]; continue; }
      out.push(kids[i]);
    }
    /*@3.NOEJ.304*/
    for (i = 0; i < out.length; i++) {
      id = out[i].getAttribute('data-bid');
      /*@3.NOEJ.484*/
      var hitO = out[i].__dirty ? null : this.blockAt(id);
      if (out[i].__tblFill && !out[i].__dirty) { if (out[i].__tblQ) { cancelAnimationFrame(out[i].__tblQ); out[i].__tblQ = 0; } }
      else if (out[i].__dirty || !hitO || hitO.b.prov || hitO.b.fp) this.readBlock(out[i]);
      this.dropCanvas(id);
      this.roDrop(out[i]);
      out[i].remove();
    }
    this._sw = 0;
    this.sheetW();
    this._stale = null;
    var padB = this.winPad('b');
    if (padB.parentNode !== root) {
      var tail = root.querySelector(':scope > .ne-tail');
      if (tail) root.insertBefore(padB, tail); else root.appendChild(padB);
    }
    var anchor = padB;
    for (i = to; i >= from; i--) {
      node = live[bs[i].id];
      if (!node) {
        node = this.renderBlock(bs[i]);
        root.insertBefore(node, anchor);
        this.roAdd(node);
      } else if (node.nextSibling !== anchor) {
        root.insertBefore(node, anchor);
      }
      node.classList.remove('ne-w0');
      anchor = node;
    }
    var padA = this.winPad('a');
    if (padA.nextSibling !== anchor || padA.parentNode !== root) {
      root.insertBefore(padA, anchor);
    }
    codeFlush();
    this.tblFitAll();
    this.dgmFitAll();
    /*@3.NOEJ.305*/
    this.winPads(from, to, false);
    if (anchor && anchor.classList) anchor.classList.add('ne-w0');
    this.freeSync();
    this._win = { from: from, to: to };
    /*@3.NOEJ.308*/
    if (!this._winSaid) {
      this._winSaid = 1;
      try {
        console.info('[notes] نافذةُ الرسم: ' + ((to - from) + 1) + ' من ' +
          bs.length + ' كتلة · العتبة ' + WIN_MIN + ' · التصديرُ والطباعةُ ' +
          'من النموذجِ كاملاً');
      } catch (eL) {}
    }
    this.applyEng();
    if (this._pv || this.root.querySelector(':scope > [data-pgc]')) this.pvApply();
    this.applyReadOnly();
    this.paintBlockSel();
    this.reAct();
    if (this.opts.onLayout) this.opts.onLayout();
    return true;
  };

  Editor.prototype.winPads = function (from, to, keep) {
    var bs = this.doc.blocks, eng = this.doc.eng, nat = this._nat, root = this.root;
    var padA = this._winA, padB = this._winB;
    if (!padA || !padB || !eng || !nat || !Array.isArray(eng.a) || !bs[to]) return;
    var A = this.pvTops() || eng.a;
    var a0 = A[0] || 0;
    var aH = Math.max(0, (A[from] || 0) - a0);
    var bot = (A[to] || 0) + (nat.hgt[to] || 0) + this.pvExtra(bs[to].id);
    var pad0 = (nat && nat.pad > 0) ? nat.pad : (root.offsetTop || 16);
    var bH = Math.max(0, (this._pv && this._pvA ? this._pvA.bot : (eng.h - pad0)) - bot);
    var sA = aH.toFixed(2) + 'px', sB = bH.toFixed(2) + 'px';
    /*@3.NOEJ.534*/
    var d = keep ? aH - (parseFloat(padA.style.blockSize) || 0) : 0;
    if (padA.style.blockSize !== sA) padA.style.blockSize = sA;
    if (padB.style.blockSize !== sB) padB.style.blockSize = sB;
    if (Math.abs(d) >= 0.5) {
      var sc = this.scroller();
      if (sc) sc.scrollTop += d * (this.zoomOf() || 1);
    }
  };

  /*@3.NOEJ.287*/
  Editor.prototype.winApply = function (force) {
    if (!this.winOk()) { if (this._win) this.winClear(); return false; }
    var rng = this.winRange();
    if (!rng) return false;
    rng = this.winPin(rng);
    var cur = this._win;
    if (!force && cur && cur.from === rng[0] && cur.to === rng[1]) return false;
    /*@3.NOEJ.582*/
    if (!force && cur && this.winCovers(cur, rng)) return false;
    return this.winSet(rng[0], rng[1]);
  };

  Editor.prototype.winCovers = function (cur, rng) {
    if (cur.to >= this.doc.blocks.length) return false;
    var need = this.winRange(WIN_KEEP);
    if (!need || need[0] < cur.from || need[1] > cur.to) return false;
    var keep = this.winKeep(), i, hit;
    for (i = 0; i < keep.length; i++) {
      hit = this.blockAt(keep[i]);
      if (hit && (hit.i < cur.from || hit.i > cur.to) && hit.i >= rng[0] && hit.i <= rng[1]) return false;
    }
    return true;
  };

  /*@3.NOEJ.288*/
  Editor.prototype.winClear = function () {
    if (!this._win) return false;
    var bs = this.doc.blocks, root = this.root, i, node;
    var live = this.bidMap();
    var padB = (this._winB && this._winB.parentNode === root) ? this._winB : null;
    var anchor = padB || root.querySelector(':scope > .ne-tail');
    this._sw = 0;
    this.sheetW();
    for (i = bs.length - 1; i >= 0; i--) {
      node = live[bs[i].id];
      if (node && this._stale && this._stale[bs[i].id]) { this.dropCanvas(bs[i].id); this.roDrop(node); node.remove(); node = null; }
      if (!node) {
        node = this.renderBlock(bs[i]);
        root.insertBefore(node, anchor);
        this.roAdd(node);
      } else if (node.nextSibling !== anchor) {
        root.insertBefore(node, anchor);
      }
      node.classList.remove('ne-w0');
      anchor = node;
    }
    this._stale = null;
    if (this._winA && this._winA.parentNode) this._winA.remove();
    if (this._winB && this._winB.parentNode) this._winB.remove();
    this._win = null;
    codeFlush();
    this.applyEng();
    if (this._pv) this.pvApply();
    this.applyReadOnly();
    this.paintBlockSel();
    this.reAct();
    return true;
  };

  /*@3.NOEJ.289*/
  Editor.prototype.winShow = function (id) {
    if (!this._win) return true;
    var hit = this.blockAt(id);
    if (!hit) return false;
    if (hit.b.fp) return this.freeIn(hit.b);
    var k = hit.i;
    if (k >= this._win.from && k <= this._win.to) return true;
    var n = this.doc.blocks.length;
    this.winSet(Math.max(0, k - WIN_SPAN), Math.min(n - 1, k + WIN_SPAN));
    return true;
  };

  /*@3.NOEJ.306*/
  Editor.prototype.winSettle = function () {
    var live = this.root.querySelectorAll(':scope > [data-bid]');
    var arr = [], i;
    for (i = 0; i < live.length; i++) arr.push(live[i]);
    if (this.natSync(arr)) this.reflowEng();
    else this.applyEng();
  };

  /*@3.NOEJ.290*/
  Editor.prototype.winBind = function () {
    if (this._winTie) return;
    var self = this;
    this._winTie = function () {
      if (self._winQ) return;
      self._winQ = requestAnimationFrame(function () {
        self._winQ = 0;
        if (!self.root || !self.root.isConnected) return;
        self.winApply(false);
      });
    };
    var sc = this.scroller();
    if (sc) { sc.addEventListener('scroll', this._winTie, { passive: true }); this._winSc = sc; }
    window.addEventListener('resize', this._winTie, { passive: true });
  };

  /*@3.NOEJ.523*/
  var PV_TEXT = { p: 1, h: 1, quote: 1, callout: 1 };
  function pvEl(tag, g) {
    var e = document.createElement(tag);
    e.className = 'ne-pg';
    e.setAttribute('contenteditable', 'false');
    e.setAttribute('aria-hidden', 'true');
    e.setAttribute('data-pgg', String(g));
    if (tag !== 'tr') e.style.blockSize = Math.max(0, g) + 'px';
    return e;
  }
  function pvIdx(host) {
    var out = [], n = 0;
    (function rec(el) {
      var kids = el.childNodes, i, c;
      for (i = 0; i < kids.length; i++) {
        c = kids[i];
        if (c.nodeType === 3) { if (c.nodeValue.length) { out.push({ node: c, at: n, len: c.nodeValue.length }); n += c.nodeValue.length; } }
        else if (c.nodeType === 1) { if (c.tagName === 'BR') n += 1; else if (!(c.classList && c.classList.contains('ne-pg'))) rec(c); }
      }
    }(host));
    return { list: out, total: n };
  }
  function pvPt(ix, pos) {
    var l = ix.list, lo = 0, hi = l.length - 1, m;
    if (!l.length) return null;
    while (lo < hi) { m = (lo + hi + 1) >> 1; if (l[m].at <= pos) lo = m; else hi = m - 1; }
    var e = l[lo], off = pos - e.at;
    if (off < 0) off = 0;
    if (off > e.len) off = e.len;
    return { node: e.node, off: off };
  }
  /*@3.NOEJ.524*/
  function pvLineAt(host, top, ix) {
    ix = ix || pvIdx(host);
    var lo = 1, hi = ix.total, rg = document.createRange();
    var topAt = function (pos) {
      var a = pvPt(ix, pos), b = pvPt(ix, pos + 1);
      if (!a || !b) return null;
      try { rg.setStart(a.node, a.off); rg.setEnd(b.node, b.off); } catch (e) { return null; }
      var rr = rg.getBoundingClientRect();
      return rr.height > 0 ? rr.top : null;
    };
    while (lo < hi) { var mid = (lo + hi) >> 1, t = topAt(mid); if (t == null || t < top) lo = mid + 1; else hi = mid; }
    return lo;
  }
  function pvPut(host, pos, el) {
    var at = pointAt(host, pos), n = at.node;
    if (n.nodeType === 3) {
      if (at.off <= 0) { n.parentNode.insertBefore(el, n); return; }
      if (at.off >= n.nodeValue.length) { n.parentNode.insertBefore(el, n.nextSibling); return; }
      var t2 = n.splitText(at.off);
      t2.parentNode.insertBefore(el, t2);
      return;
    }
    n.insertBefore(el, n.childNodes[at.off] || null);
  }
  /*@3.NOEJ.530*/
  function pvLost(node) {
    return node.__pgN > 0 && node.querySelectorAll('.ne-pg').length < node.__pgN;
  }
  function pvCvLater(pre) {
    if (pre.__pgcvQ) return;
    var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
    pre.__pgcvQ = raf(function () {
      pre.__pgcvQ = raf(function () {
        pre.__pgcvQ = 0;
        if (!pre.querySelector('.ne-pg')) pre.removeAttribute('data-pgcv');
      });
    });
  }
  function pvNlPos(pre, k) {
    var tw = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT), t, i, s, seen = 0;
    while ((t = tw.nextNode())) {
      if (t.parentNode && t.parentNode.closest && t.parentNode.closest('.ne-pg')) continue;
      s = t.nodeValue;
      for (i = 0; i < s.length; i++) {
        if (s.charCodeAt(i) !== 10) continue;
        seen++;
        if (seen === k) return { node: t, off: i + 1 };
      }
    }
    return null;
  }

  Editor.prototype.pvSet = function (sp) {
    this._pv = sp || null;
    this._pvA = null;
    if (!this.root) return;
    if (this._win) this.winApply(true);
    else { this.pvApply(); if (this.opts.onLayout) this.opts.onLayout(); }
  };
  Editor.prototype.pvOn = function () { return !!this._pv; };
  Editor.prototype.pvShift = function (id, dy) {
    var P = window.GardenNotesPageView, sp = this._pv;
    if (!sp || !P) return 0;
    if (sp.parts[id]) return P.shift(sp, id, dy);
    var hit = this.blockAt(id), A = this.pvTops(), e = this.doc.eng;
    return (hit && A && A[hit.i] != null && e.a[hit.i] != null) ? A[hit.i] - e.a[hit.i] : 0;
  };
  Editor.prototype.pvSegs = function () {
    var sp = this._pv, e = this.doc.eng;
    if (!sp || !e || !Array.isArray(e.a)) return null;
    var c = this._pvS;
    if (c && c.e === e.a && c.v === sp.ver) return c.s;
    var A = this.pvTops(), bs = this.doc.blocks, nat = this._nat, out = [], i, q, id, pa, t;
    for (i = 0; i < bs.length; i++) {
      if (e.a[i] == null || bs[i].fp) continue;
      id = bs[i].id; t = e.a[i]; pa = sp.parts[id];
      if (!pa) { out.push({ v0: A[i], v1: A[i] + ((nat && nat.hgt[i]) || 0), add: A[i] - t, id: id, t: t }); continue; }
      for (q = 0; q < pa.length; q++) out.push({ v0: t + pa[q].from + pa[q].add, v1: t + pa[q].to + pa[q].add, add: pa[q].add, id: id, t: t });
    }
    this._pvS = { e: e.a, v: sp.ver, s: out };
    return out;
  };
  Editor.prototype.pvSegAt = function (y) {
    var s = this.pvSegs();
    if (!s || !s.length) return null;
    var lo = 0, hi = s.length - 1, mid;
    if (y < s[0].v0) return s[0];
    while (lo < hi) { mid = (lo + hi + 1) >> 1; if (s[mid].v0 <= y) lo = mid; else hi = mid - 1; }
    var a = s[lo], nx = s[lo + 1];
    if (y < a.v1 || !nx) return a;
    return ((y - a.v1) <= (nx.v0 - y)) ? a : nx;
  };
  Editor.prototype.pvUnview = function (y) {
    var g = this.pvSegAt(y);
    return g ? y - g.add : y;
  };
  /*@3.NOEJ.528*/
  Editor.prototype.pvGapIn = function (y) {
    var s = this.pvSegs(), lo = 0, hi, mid;
    if (!s || s.length < 2) return null;
    hi = s.length - 1;
    while (lo < hi) { mid = (lo + hi + 1) >> 1; if (s[mid].v0 <= y) lo = mid; else hi = mid - 1; }
    var a = s[lo], nx = s[lo + 1];
    if (!nx || y < a.v1 || y >= nx.v0 || a.id !== nx.id) return null;
    return { id: nx.id, from: Math.round((nx.v0 - nx.t - nx.add) * 100) / 100 };
  };
  Editor.prototype.pvDy = function (id, y) {
    var s = this.pvSegs(), i, best = null, bd = Infinity, d;
    if (!s) return null;
    for (i = 0; i < s.length; i++) {
      if (s[i].id !== id) continue;
      d = y < s[i].v0 ? s[i].v0 - y : (y > s[i].v1 ? y - s[i].v1 : 0);
      if (d < bd) { bd = d; best = s[i]; }
      if (!d) break;
    }
    return best ? y - best.t - best.add : null;
  };
  /*@3.NOEJ.529*/
  Editor.prototype.pvTops = function () {
    var e = this.doc.eng, sp = this._pv;
    if (!e || !Array.isArray(e.a)) return null;
    if (!sp) return e.a;
    var c = this._pvA;
    if (c && c.e === e.a && c.v === sp.ver) return c.a;
    var bs = this.doc.blocks, a = new Array(bs.length), nat = this._nat, i, s, id, carry = 0, x, bot = 0;
    for (i = 0; i < bs.length; i++) {
      if (e.a[i] == null) { a[i] = null; continue; }
      id = bs[i].id;
      s = sp.S[id];
      if (s == null) s = carry;
      a[i] = e.a[i] + s;
      carry = (sp.E[id] != null) ? sp.E[id] : s;
      x = a[i] + ((nat && nat.hgt[i]) || 0) + (sp.X[id] || 0);
      if (x > bot) bot = x;
    }
    this._pvA = { e: e.a, v: sp.ver, a: a, bot: bot };
    return a;
  };
  Editor.prototype.pvExtra = function (id) { return (this._pv && this._pv.X[id]) || 0; };
  Editor.prototype.pvApply = function () {
    if (!this.root) return;
    var kids = this.root.querySelectorAll(':scope > [data-bid]'), i;
    for (i = 0; i < kids.length; i++) {
      if (kids[i].hasAttribute('data-fp')) continue;
      this.pvDress(kids[i]);
    }
    this.pvClonesPos();
  };
  Editor.prototype.pvStripAll = function () {
    if (!this.root) return;
    var kids = this.root.querySelectorAll(':scope > [data-bid]'), i;
    for (i = 0; i < kids.length; i++) this.pvStrip(kids[i]);
  };
  Editor.prototype.pvStrip = function (node) {
    if (!node) return;
    if (node.__pgm) { node.style.marginBlockStart = ''; node.__pgm = 0; node.removeAttribute('data-pgm'); }
    if (node.hasAttribute('data-pgcut')) node.removeAttribute('data-pgcut');
    var sp = node.querySelectorAll('.ne-pg'), par = [], i, p;
    for (i = 0; i < sp.length; i++) { p = sp[i].parentNode; if (p && par.indexOf(p) < 0) par.push(p); sp[i].remove(); }
    for (i = 0; i < par.length; i++) { if (par[i].nodeName !== 'TBODY' && par[i].nodeName !== 'TABLE') { try { par[i].normalize(); } catch (eN) {} } }
    var cv = node.querySelectorAll('.ne-code[data-pgcv]');
    for (i = 0; i < cv.length; i++) pvCvLater(cv[i]);
    if (node.__pgc) { if (node.__pgc.parentNode) node.__pgc.remove(); node.__pgc = null; }
    node.__pgX = 0; node.__pgs = ''; node.__pgD = 0; node.__pgN = 0;
  };
  Editor.prototype.pvDress = function (node, force) {
    var P = window.GardenNotesPageView, sp = this._pv, id = node.getAttribute('data-bid');
    var sig = (sp && P) ? P.sigOf(sp, id) : '';
    if (sig && node.classList.contains('ne-w0')) sig += 'w';
    if (!force && node.__pgs === sig && !node.__pgD && !pvLost(node)) return false;
    this.pvStrip(node);
    if (!sig) return true;
    node.__pgs = sig;
    var hit = this.blockAt(id);
    if (!hit) return true;
    var pre = sp.pre[id];
    if (pre > 0 && !node.classList.contains('ne-w0') && hit.b.ty !== 'pb') {
      var k = this.natIdx() ? this.natIdx()[id] : null, g0 = (k != null && this._nat && this._nat.gap[k] != null) ? this._nat.gap[k] : 0;
      node.style.marginBlockStart = (Math.round((g0 + pre) * 100) / 100) + 'px';
      node.__pgm = 1;
      node.setAttribute('data-pgm', '1');
    }
    if (sp.cut[id]) node.setAttribute('data-pgcut', '1');
    if (sp.inner[id]) this.pvInner(node, hit.b, sp.inner[id]);
    if (sp.card[id]) this.pvClone(node, sp.card[id]);
    node.__pgN = node.querySelectorAll('.ne-pg').length;
    return true;
  };
  Editor.prototype.pvInner = function (node, b, inn) {
    var z = this.zoomOf() || 1, ty = b.ty, made = [], q, k, g, host, tbl, rows, lis, pre;
    /*@3.NOEJ.526*/
    if (ty === 'code') { pre = node.querySelector('.ne-code'); if (pre) pre.setAttribute('data-pgcv', '1'); }
    var h0 = node.getBoundingClientRect().height / z;
    if (PV_TEXT[ty]) {
      host = node.querySelector('.ne-text');
      var K = window.GardenNotesPaper, rws = (host && K && K.textRows) ? K.textRows(host) : null;
      if (!rws) return;
      var at = [], ixH = pvIdx(host);
      for (q = 0; q < inn.length; q++) { k = inn[q].k; if (k > 0 && k < rws.length) at.push({ pos: pvLineAt(host, rws[k].top - 1, ixH), g: inn[q].g }); }
      /*@3.NOEJ.525*/
      for (q = at.length - 1; q >= 0; q--) { if (at[q].pos > 0) { var s1 = pvEl('span', at[q].g); s1.style.cssText += ';display:inline-block;inline-size:100%;vertical-align:top'; pvPut(host, at[q].pos, s1); made.push(s1); } }
    } else if (ty === 'code') {
      if (!pre) return;
      var pts = [];
      for (q = 0; q < inn.length; q++) { var np = pvNlPos(pre, inn[q].k); if (np) pts.push({ np: np, g: inn[q].g }); }
      for (q = pts.length - 1; q >= 0; q--) {
        var s2 = pvEl('span', pts[q].g); s2.style.display = 'block';
        var tn = pts[q].np.node, off = pts[q].np.off;
        if (off >= tn.nodeValue.length) tn.parentNode.insertBefore(s2, tn.nextSibling);
        else { var t3 = tn.splitText(off); t3.parentNode.insertBefore(s2, t3); }
        made.push(s2);
      }
    } else if (ty === 'tbl') {
      tbl = node.querySelector('table.ne-tbl');
      if (!tbl) return;
      rows = [].slice.call(tbl.rows).filter(function (r) { return !r.hasAttribute('data-brk'); });
      var cols = rows[0] ? rows[0].cells.length : 1;
      for (q = inn.length - 1; q >= 0; q--) {
        k = inn[q].k; g = inn[q].g;
        var at2 = rows[k + 1];
        if (!at2) continue;
        var hd = rows[0] && inn[q].hd > 0 ? rows[0].cloneNode(true) : null, hdH = hd ? inn[q].hd : 0;
        var gp = pvEl('tr', g - hdH);
        gp.setAttribute('data-brk', 'g');
        var gtd = document.createElement('td');
        gtd.colSpan = cols; gtd.className = 'ne-brk-g';
        gtd.style.blockSize = Math.max(0, g - hdH) + 'px';
        gp.appendChild(gtd);
        at2.parentNode.insertBefore(gp, at2);
        made.push(gp);
        if (hd) {
          hd.className = 'ne-pg'; hd.setAttribute('data-brk', 'h'); hd.setAttribute('aria-hidden', 'true'); hd.setAttribute('data-pgg', String(hdH)); hd.setAttribute('data-pgc', '1');
          var hc = hd.querySelectorAll('td,th'), c;
          for (c = 0; c < hc.length; c++) { hc[c].removeAttribute('contenteditable'); hc[c].removeAttribute('data-bid'); }
          at2.parentNode.insertBefore(hd, at2);
        }
      }
    } else if (LISTY[ty]) {
      lis = node.querySelectorAll('.ne-li');
      for (q = inn.length - 1; q >= 0; q--) {
        var li = lis[inn[q].k];
        if (!li) continue;
        var s3 = pvEl('div', inn[q].g);
        li.parentNode.insertBefore(s3, li);
        made.push(s3);
      }
    }
    if (!made.length) return;
    var want = 0;
    for (q = 0; q < inn.length; q++) want += inn[q].g;
    var h1 = node.getBoundingClientRect().height / z, err = (h0 + want) - h1;
    /*@3.NOEJ.527*/
    if (Math.abs(err) > 0.2 && Math.abs(err) < want) {
      var per = err / made.length;
      for (q = 0; q < made.length; q++) {
        var t = made[q].nodeName === 'TR' ? made[q].firstChild : made[q];
        var cur = parseFloat(t.style.blockSize) || 0;
        t.style.blockSize = Math.max(0, Math.round((cur + per) * 100) / 100) + 'px';
      }
      h1 = node.getBoundingClientRect().height / z;
    }
    node.__pgX = Math.round((h1 - h0) * 100) / 100;
  };
  Editor.prototype.pvClone = function (node, cd) {
    var src = this.blockAt(cd.src);
    if (!src) return;
    var live = this.root.querySelector(':scope > [data-bid="' + cd.src + '"]');
    var cl = (live || this.renderBlock(src.b)).cloneNode(true), q;
    cl.removeAttribute('data-bid');
    var inner = cl.querySelectorAll('[data-bid],[contenteditable]');
    for (q = 0; q < inner.length; q++) { inner[q].removeAttribute('data-bid'); if (inner[q].hasAttribute('contenteditable')) inner[q].setAttribute('contenteditable', 'false'); }
    cl.classList.remove('ne-w0');
    cl.removeAttribute('data-card-end');
    cl.setAttribute('data-pgc', '1');
    cl.setAttribute('aria-hidden', 'true');
    cl.__pgHead = cd.head;
    cl.__pgFor = node;
    this.root.appendChild(cl);
    node.__pgc = cl;
  };
  Editor.prototype.pvClonesPos = function () {
    var cls = this.root.querySelectorAll(':scope > [data-pgc]'), i, c, n;
    for (i = 0; i < cls.length; i++) {
      c = cls[i]; n = c.__pgFor;
      if (!n || !n.isConnected || n.__pgc !== c) { c.remove(); continue; }
      c.style.position = 'absolute';
      c.style.margin = '0';
      c.style.insetBlockStart = (n.offsetTop - (c.__pgHead || 0)) + 'px';
      c.style.left = n.offsetLeft + 'px';
      c.style.width = n.offsetWidth + 'px';
    }
  };
  Editor.prototype.pvNatH = function (node, h) {
    return (node && node.__pgX && node.querySelector('.ne-pg')) ? h - node.__pgX : h;
  };

  Editor.prototype.roBind = function () {
    if (!window.ResizeObserver || this._ro) return;
    var self = this;
    this._ro = new ResizeObserver(function (ents) { self.onSizes(ents); });
  };

  Editor.prototype.roLater = function () {
    if (!window.ResizeObserver || this._roQ) return;
    var self = this;
    var run = function () {
      self._roQ = 0;
      if (!self.root || !self.root.isConnected) return;
      self.roAll();
    };
    this._roQ = window.requestAnimationFrame
      ? requestAnimationFrame(run) : setTimeout(run, 0);
  };

  Editor.prototype.roAll = function () {
    this.roBind();
    if (!this._ro) return;
    this._ro.disconnect();
    var kids = this.root.children, i, k;
    for (i = 0; i < kids.length; i++) {
      k = kids[i];
      if (!k.hasAttribute || !k.hasAttribute('data-bid')) continue;
      if (k.hasAttribute('data-fp')) continue;
      this._ro.observe(k);
    }
  };

  /*@3.NOEJ.448*/
  Editor.prototype.ioAdd = function (node) {
    var self = this;
    if (!this._io) {
      if (typeof IntersectionObserver !== 'function') { if (node.__dgm) node.__dgm(); return; }
      this._io = new IntersectionObserver(function (ents) {
        for (var i = 0; i < ents.length; i++) {
          if (!ents[i].isIntersecting) continue;
          var n = ents[i].target;
          try { self._io.unobserve(n); } catch (eU) {}
          if (n.__dgm) n.__dgm();
        }
      }, { root: null, rootMargin: '900px 0px' });
    }
    this._io.observe(node);
  };
  /*@3.NOEJ.451*/
  function dgmHash(str) {
    var h1 = 0x811c9dc5, h2 = 0x1000193, i, c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      h2 = Math.imul(h2 + c, 0x9e3779b1) >>> 0;
    }
    return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16) + str.length.toString(36);
  }
  Editor.prototype.dgmPrecache = function (list, lite) {
    var self = this, bs = list || this.doc.blocks, todo = [], i, b;
    if (!this._dgmSvg) this._dgmSvg = {};
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      /*@3.NOEJ.463*/
      if (!b || !isDiagram(b) || (b.dgm != null && !b.dgm) || !String(b.src || '').trim()) continue;
      var c = this._dgmSvg[b.id];
      if (c && c.src === String(b.src || '')) continue;
      if (lite && b.dh > 0) continue;
      todo.push(b);
    }
    if (!todo.length) return Promise.resolve(0);
    return needMermaid().then(function (M) {
      if (!M) return 0;
      var W = self.sheetW() || 794;
      var lab = document.createElement('div');
      lab.className = 'ne-root';
      lab.setAttribute('aria-hidden', 'true');
      lab.style.cssText = 'position:absolute;inset-block-start:0;inset-inline-start:-99999px;inline-size:' + W + 'px;block-size:0;contain:strict;pointer-events:none;visibility:hidden';
      lab.dir = self.isRtl() ? 'rtl' : 'ltr';
      var wrap = document.createElement('div'); wrap.className = 'ne-b ne-b-code';
      var body = document.createElement('div'); body.className = 'ne-body';
      var host = document.createElement('div'); host.className = 'ne-dgm'; host.dir = 'ltr';
      body.appendChild(host); wrap.appendChild(body); lab.appendChild(wrap);
      (self.root.parentNode || document.body).appendChild(lab);
      /*@3.NOEJ.522*/
      var k = 0, done = 0, grew = false, grown = [];
      /*@3.NOEJ.469*/
      var St = window.GardenNotesStore, keyOf = function (src) { return 'dgm:' + dgmHash(src) + ':' + (self.isRtl() ? 'r' : 'l') + (M.isDark && M.isDark() ? 'd' : 'l') + ':' + W; };
      /*@3.NOEJ.559*/
      function next() {
        if (k >= todo.length) { lab.remove(); if (grew) { try { self.markLazy(); } catch (eH) {} } try { self.dhSync(todo.map(function (x) { return x.id; })); } catch (eY) {} return done; }
        var bk = todo[k++], src = String(bk.src || '');
        var hit = (St && St.meta) ? St.meta(keyOf(src), null) : Promise.resolve(null);
        return hit.then(function (row) {
          if (row && row.html && row.src === src) {
            self._dgmSvg[bk.id] = { src: src, html: row.html };
            /*@3.NOEJ.618*/
            if (St.setMeta && !(Date.now() - (row.at || 0) < 864e5)) { try { row.at = Date.now(); St.setMeta(keyOf(src), row); } catch (eT) {} }
            if (row.dh > 0 && Math.abs((bk.dh || 0) - row.dh) >= 1) { bk.dh = row.dh; grew = true; grown.push(bk.id); }
            done++;
            return next();
          }
          host.innerHTML = '';
          return Promise.resolve(M.render(host, src)).then(function () {
            if (host.querySelector('svg')) {
              var html = host.innerHTML;
              self._dgmSvg[bk.id] = { src: src, html: html };
              var h = Math.round(host.getBoundingClientRect().height);
              if (h > 0 && Math.abs((bk.dh || 0) - h) >= 1) { bk.dh = h; grew = true; grown.push(bk.id); }
              if (St && St.setMeta && html.length < 4 * 1024 * 1024) {
                try { St.setMeta(keyOf(src), { src: src, html: html, dh: h, at: Date.now() }).then(function () { if (St.sweepDgm) St.sweepDgm(); }); } catch (eS) {}
              }
              done++;
            } else self._dgmSvg[bk.id] = { src: src, html: null, bad: 1 };
            return next();
          }, next);
        }, function () { host.innerHTML = ''; return Promise.resolve(M.render(host, src)).then(next, next); });
      }
      return next();
    });
  };
  /*@3.NOEJ.457*/
  Editor.prototype.mathAll = function () {
    var outs = this.root.querySelectorAll('.ne-math-out:not([hidden]), .ne-im'), list = [], i;
    for (i = 0; i < outs.length; i++) {
      if (outs[i].querySelector('mjx-container, svg, .MathJax')) continue;
      if (!(outs[i].textContent || '').trim()) continue;
      list.push(outs[i]);
    }
    _mathQ = []; if (_mathT > 0) { clearTimeout(_mathT); } _mathT = 0;
    if (!list.length) return Promise.resolve(0);
    var run = function () { return typesetMany(list); };
    if (document.fonts && document.fonts.status !== 'loaded') return fontsReady().then(run, run);
    return run();
  };
  /*@3.NOEJ.464*/
  Editor.prototype.dgmApply = function (rootOpt) {
    var hosts = (rootOpt || this.root).querySelectorAll('.ne-dgm'), n = 0, i, h;
    if (!this._dgmSvg) return 0;
    var byId = this.bidMap(), bs = this.doc.blocks, map = {}, touched = [];
    for (i = 0; i < bs.length; i++) if (bs[i]) map[bs[i].id] = bs[i];
    for (i = 0; i < hosts.length; i++) {
      h = hosts[i];
      if (h.hidden || h.querySelector('svg') || !h.__dgm) continue;
      var wrap = h.closest('[data-bid]'), b = wrap ? map[wrap.getAttribute('data-bid')] : null;
      var c = b ? this._dgmSvg[b.id] : null;
      if (!c || c.src !== String(b.src || '')) { if (b && b.dh > 0 && !h.getAttribute('data-dh')) { h.setAttribute('data-dh', String(Math.round(b.dh))); h.style.minBlockSize = Math.round(b.dh) + 'px'; } continue; }
      if (!c.html) { h.setAttribute('data-state', 'bad'); continue; }
      h.setAttribute('data-state', 'ok'); h.innerHTML = c.html; h.style.minBlockSize = '';
      if (wrap) touched.push(wrap);
      if (this._io) { try { this._io.unobserve(h); } catch (eU) {} }
      n++;
    }
    if (n) this.dgmFitAll(rootOpt || this.root);
    if (n && !rootOpt) {
      if (this.natOk() && this._nat.u) { if (this.natSync(touched)) this.reflowEng(); }
      else { this._nat = null; this._engStale = true; }
    }
    return n;
  };
  Editor.prototype.dgmAll = function () {
    var hosts = this.root.querySelectorAll('.ne-dgm'), jobs = [], i;
    for (i = 0; i < hosts.length; i++) {
      if (hosts[i].hidden || hosts[i].querySelector('svg')) continue;
      if (hosts[i].__dgm) { if (this._io) { try { this._io.unobserve(hosts[i]); } catch (eU) {} } jobs.push(hosts[i].__dgm()); }
    }
    return Promise.all(jobs).then(function () { return jobs.length; });
  };

  Editor.prototype.roAdd = function (node) {
    this.roBind();
    if (!this._ro || !node || !node.hasAttribute) return;
    if (!node.hasAttribute('data-bid') || node.hasAttribute('data-fp')) return;
    /*@3.NOEJ.455*/
    if (node.getAttribute('data-ty') === 'pb') return;
    this._ro.observe(node);
  };

  Editor.prototype.roDrop = function (node) {
    if (!this._ro || !node) return;
    try { this._ro.unobserve(node); } catch (eU) {}
  };

  Editor.prototype.onSizes = function (ents) {
    if (this._roOff || !this.natOk()) return;
    var eng = this.doc.eng;
    if (!eng || eng.v !== 3) return;
    var nat = this._nat, idx = this.natIdx();
    if (!idx) return;
    var changed = false, e, node, id, i, h, rr0S = null;
    var zo = this.zoomOf() || 1;
    for (e = 0; e < ents.length; e++) {
      node = ents[e].target;
      if (!node.parentNode || node.hasAttribute('data-fp')) continue;
      id = node.getAttribute('data-bid');
      i = idx[id];
      /*@3.NOEJ.261*/
      if (i == null || nat.ids[i] !== id) continue;
      if (this._pv && pvLost(node)) this.pvDress(node, true);
      var rcS = node.getBoundingClientRect();
      h = this.pvNatH(node, rcS.height / zo);
      if (Math.abs((nat.hgt[i] || 0) - h) < 0.02) continue;
      var dS = !!(this._pv && node.querySelector('.ne-pg'));
      if (dS) { this.pvStrip(node); rcS = node.getBoundingClientRect(); h = rcS.height / zo; }
      nat.hgt[i] = h;
      nat.lh[i] = 0;
      if (nat.u) { if (!rr0S) { rr0S = this.root.getBoundingClientRect(); } var bS = this.doc.blocks[i]; if (bS && bS.id === id) nat.u[i] = this.natUnitsOf(bS, node, rcS, zo, rr0S.width / zo, rr0S.left / zo); }
      if (dS) this.pvDress(node, true);
      changed = true;
    }
    if (!changed) return;
    this.reflowEng();
  };

  /*@3.NOEJ.240*/
  Editor.prototype.clearMargins = function () {
    var list = this.root.querySelectorAll(':scope > [data-bid]'), i;
    for (i = 0; i < list.length; i++) {
      if (!list[i].__bd) continue;
      list[i].__bd = 0;
      /*@3.NOEJ.243*/
      list[i].style.removeProperty('--ne-pb');
      list[i].removeAttribute('data-brkm');
    }
    this.root.style.minBlockSize = '';
    this._mbSet = '';
    this._engOn = false;
  };

  function lineOf(node) {
    if (!node) return 0;
    var v = 0;
    try {
      var cs = getComputedStyle(node);
      v = parseFloat(cs.lineHeight);
      if (!isFinite(v) || v <= 0) v = parseFloat(cs.fontSize) * 1.5;
    } catch (e) {}
    return isFinite(v) ? v : 0;
  }

  Editor.prototype.pageH = function () {
    /*@3.NOEJ.423*/
    if (this.doc && this.doc.kind !== 'board') return 1e7;
    var v = 0;
    try {
      v = parseFloat(getComputedStyle(this.root)
        .getPropertyValue('--na-sheeth')) || 0;
    } catch (e) {}
    return v > 200 ? v : 1123;
  };

  /*@3.NOEJ.155*/
  Editor.prototype.applyEng = function () {
    var eng = this.doc.eng;
    /*@3.NOEJ.535*/
    if (this._win) this.winPads(this._win.from, this._win.to, true);
    /*@3.NOEJ.159*/
    /*@3.NOEJ.426*/
    var ok = !!(eng && eng.v === 3 && eng.mk && eng.w === 794 &&
                this.doc.kind !== 'board' && this.pageH() < 1e6);
    /*@3.NOEJ.234*/
    if (!ok) { if (this._engOn) this.clearMargins(); return; }
    this._engOn = true;
    var kids = this.root.children, i, node, want, id;
    for (i = 0; i < kids.length; i++) {
      node = kids[i];
      if (!node.hasAttribute || !node.hasAttribute('data-bid')) continue;
      if (node.hasAttribute('data-fp')) continue;
      id = node.getAttribute('data-bid');
      want = eng.mk[id] || 0;
      if ((node.__bd || 0) === want) continue;
      node.__bd = want;
      if (want > 0) {
        node.style.setProperty('--ne-pb', want.toFixed(2) + 'px');
        node.setAttribute('data-brkm', '1');
      } else {
        node.style.removeProperty('--ne-pb');
        node.removeAttribute('data-brkm');
      }
    }
    var mb = (eng.h > 0) ? (eng.h + 'px') : '';
    if (this._mbSet !== mb) { this._mbSet = mb; this.root.style.minBlockSize = mb; }
  };

  Editor.prototype.docDir = function () { return docDir(this.doc); };

  /*@3.NOEJ.90*/
  Editor.prototype.dropTail = function () {
    var tail = this.root.querySelector(':scope > .ne-tail');
    if (!tail) return;
    tail.style.marginBlockStart = '';
    var free = this.root.querySelectorAll(':scope > [data-bid][data-fp]');
    if (!free.length) return;
    var rootTop = this.root.getBoundingClientRect().top;
    var z = this.zoomOf();
    var low = 0, i;
    for (i = 0; i < free.length; i++) {
      low = Math.max(low, (free[i].getBoundingClientRect().bottom - rootTop) / z);
    }
    var at = (tail.getBoundingClientRect().top - rootTop) / z;
    var gap = Math.round(low + 14 - at);
    if (gap > 0) tail.style.marginBlockStart = gap + 'px';
  };

  /*@3.NOEJ.47*/
  Editor.prototype.freeIn = function (b) {
    if (!b || !b.fp || !this.root) return false;
    if (this.root.querySelector(':scope > [data-bid="' + b.id + '"]')) return true;
    var anchor = (this._winB && this._winB.parentNode === this.root)
      ? this._winB : this.root.querySelector(':scope > .ne-tail');
    var node = this.renderBlock(b);
    this._sw = 0;
    this.sheetW();
    if (anchor) this.root.insertBefore(node, anchor);
    else this.root.appendChild(node);
    this.applyReadOnly();
    return true;
  };

  Editor.prototype.freeSync = function () {
    var bs = this.doc.blocks, i, any = false;
    for (i = 0; i < bs.length; i++) {
      if (!bs[i].fp) continue;
      if (this.freeIn(bs[i])) any = true;
    }
    return any;
  };

  /*@3.NOEJ.318*/
  Editor.prototype.addFree = function (ty, xPx, yPx, extra) {
    var W = this.sheetW();
    /*@3.NOEJ.389*/
    var ex = extra || {};
    var exact = !!ex.exact; delete ex.exact;
    if (!exact) { xPx = Math.max(0, xPx - 6); yPx = Math.max(0, yPx - 12); }
    var xCap = (exact && typeof ex.wm === 'number' && ex.wm > 0) ? Math.max(0, 1 - ex.wm) : 0.96;
    var x = Math.max(0, Math.min(xCap, xPx / W));
    var shH0 = this.opts.sheetH ? this.opts.sheetH() : 0;
    if (shH0 > 0) yPx = Math.min(yPx, Math.max(0, shH0 - 28));
    /*@3.NOEJ.372*/
    if (this.opts.freeDefaults) {
      var dflt = null;
      try { dflt = this.opts.freeDefaults(ty); } catch (eD) {}
      if (dflt) {
        var merged = {}, kD;
        for (kD in dflt) if (Object.prototype.hasOwnProperty.call(dflt, kD)) merged[kD] = dflt[kD];
        for (kD in ex) if (Object.prototype.hasOwnProperty.call(ex, kD)) merged[kD] = ex[kD];
        ex = merged;
      }
    }
    var b = B().blank(ty, ex);
    /*@3.NOEJ.58*/
    b.fp = { x: x, y: Math.max(0, Math.round(yPx)) };
    this.fpLive(b, b.fp.y);
    /*@3.NOEJ.68*/
    if (b.wm == null) b.wm = WIDE[ty] ? 'full' : 'fit';
    b.z = this.topZ() + 1;
    var before = this.snapshot();
    this.readAll();
    this.doc.blocks.push(b);
    /*@3.NOEJ.104*/
    this.pushUndo(before);
    if (!this.freeIn(b)) { this.render(); }
    else if (this.natSplice(this.doc.blocks.length - 1, 0, [b.id])) {
      /*@3.NOEJ.313*/
      var atF = this.doc.blocks.length - 1;
      this._nat.gap[atF] = null;
      this._nat.hgt[atF] = 0;
      this.reflowEng();
    } else {
      this._nat = null; this._engStale = true; this.settled();
    }
    this.layoutFree();
    this.focusBlock(b.id);
    /*@3.NOEJ.373*/
    if (this.opts.onFree) { try { this.opts.onFree(b); } catch (eF) {} }
    this.touch();
    this.emitState();
    return b;
  };

  /*@3.NOEJ.129*/
  Editor.prototype.setListStyle = function (id, key, val) {
    var hit = this.blockAt(id);
    if (!hit || !LISTY[hit.b.ty]) return;
    var before = this.snapshot();
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (node) this.readBlock(node);
    if (key === 'lsb') {
      if (hit.b.lsb) delete hit.b.lsb; else hit.b.lsb = 1;
    } else if (val && val !== 'num' && val !== 'dot') {
      hit.b.ls = val;
    } else {
      delete hit.b.ls;
    }
    this.pushUndo(before);
    this.renderOne(id);
    this.touch();
    this.emitState();
  };

  /*@3.NOEJ.131*/
  Editor.prototype.blockHolds = function (b, node) {
    if (!b) return false;
    if (B().runsToText(b.rt || []).trim()) return true;
    if (b.items && b.items.length && b.items.some(function (it) {
      return B().runsToText(it.rt || []).trim();
    })) return true;
    if (b.rows && b.rows.length) return true;
    if (b.url || b.src || b.tex || b.ink || (b.shapes && b.shapes.length)) return true;
    var n = node || this.root.querySelector('[data-bid="' + b.id + '"]');
    return !!(n && (n.textContent || '').trim());
  };

  Editor.prototype.caretInside = function (b, node) {
    var n = node || (b ? this.root.querySelector('[data-bid="' + b.id + '"]') : null);
    return !!(n && document.activeElement && n.contains(document.activeElement));
  };

  Editor.prototype.commitProv = function (id) {
    var hit = id ? this.blockAt(id) : null;
    if (!hit || !hit.b.prov) return false;
    delete hit.b.prov;
    return true;
  };

  Editor.prototype.dropProv = function () {
    var i, b, hit = null;
    for (i = 0; i < this.doc.blocks.length; i++) {
      b = this.doc.blocks[i];
      if (!b.prov) continue;
      var node = this.root.querySelector('[data-bid="' + b.id + '"]');
      if (node) this.readBlock(node);
      if (this.blockHolds(b, node)) { delete b.prov; continue; }
      if (this.caretInside(b, node)) continue;
      hit = { b: b, i: i };
    }
    if (!hit) return false;
    this.doc.blocks.splice(hit.i, 1);
    this.render();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.62*/
  Editor.prototype.dropAllEmptyFree = function () {
    var ids = [], i;
    for (i = 0; i < this.doc.blocks.length; i++) {
      var b = this.doc.blocks[i];
      if (b.fp && b.ty === 'p') ids.push(b.id);
    }
    if (!ids.length) return 0;
    var n = 0;
    for (i = 0; i < ids.length; i++) {
      var node = this.root.querySelector('[data-bid="' + ids[i] + '"]');
      if (node) this.readBlock(node);
      if (this.dropEmptyFree(ids[i])) n++;
    }
    if (n) { this.touch(); this.emitState(); }
    return n;
  };

  Editor.prototype.dropEmptyFree = function (id) {
    if (this.menuFor === id) return false;
    var hit = this.blockAt(id);
    if (!hit || !hit.b.fp) return false;
    var b = hit.b;
    if (b.ty !== 'p') return false;
    /*@3.NOEJ.115*/
    var node0 = this.root.querySelector('[data-bid="' + id + '"]');
    if (this.blockHolds(b, node0) || this.caretInside(b, node0)) return false;
    this.doc.blocks.splice(hit.i, 1);
    this.render();
    this.layoutFree();
    this.touch();
    return true;
  };

  Editor.prototype.focusBlock = function (id, atEnd) {
    /*@3.NOEJ.297*/
    if (this._win) this.winShow(id);
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (!node) return;
    var t = node.querySelector('.ne-text, .ne-li, .ne-code, .ne-tex, .ne-img-url, .ne-cell');
    if (!t) return;
    /*@3.NOEJ.233*/
    try { t.focus({ preventScroll: true }); } catch (eF) { t.focus(); }
    this.keepInView(t);
    if (t.isContentEditable && atEnd !== false) {
      var r = document.createRange();
      r.selectNodeContents(t); r.collapse(false);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  };


  /*@3.NOEJ.260*/
  Editor.prototype.seenBox = function (sc) {
    var s = sc.getBoundingClientRect();
    var top = s.top, bot = s.bottom;
    var vv = window.visualViewport;
    if (vv && vv.height > 0) {
      var vTop = vv.offsetTop || 0, vBot = vTop + vv.height;
      if (vTop > top) top = vTop;
      if (vBot < bot) bot = vBot;
    }
    return { top: top, bottom: bot };
  };

  Editor.prototype.keepInView = function (t) {
    var sc = this.scroller();
    if (!sc || !t) return;
    var r = t.getBoundingClientRect(), s = this.seenBox(sc);
    if (s.bottom - s.top < 40) return;
    if (r.bottom > s.top + 4 && r.top < s.bottom - 4) return;
    try { t.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    /*@3.NOEJ.264*/
    var r2 = t.getBoundingClientRect();
    var over = r2.bottom - (s.bottom - 6);
    if (over > 0) sc.scrollTop += over;
  };

  /*@3.NOEJ.265*/
  Editor.prototype.caretSeen = function () {
    var sc = this.scroller();
    if (!sc) return;
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    var edn = this.currentEditable();
    if (!edn || !this.root.contains(edn)) return;
    var r = sel.getRangeAt(0).getBoundingClientRect();
    if (!r || (!r.height && !r.top)) r = edn.getBoundingClientRect();
    var s = this.seenBox(sc);
    if (s.bottom - s.top < 40) return;
    var pad = 24;
    if (r.bottom > s.bottom - pad) sc.scrollTop += (r.bottom - (s.bottom - pad));
    else if (r.top < s.top + pad) sc.scrollTop -= ((s.top + pad) - r.top);
  };

  Editor.prototype.runsRef = function (edn) {
    var node = edn.closest('[data-bid]');
    if (!node) return null;
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit) return null;
    var b = hit.b;
    if (edn.classList.contains('ne-text')) {
      return { get: function () { return b.rt || []; }, set: function (v) { b.rt = v; } };
    }
    if (edn.classList.contains('ne-li')) {
      var lis = [].slice.call(node.querySelectorAll('.ne-li'));
      var k = lis.indexOf(edn);
      if (k < 0 || !b.items || !b.items[k]) return null;
      return { get: function () { return b.items[k].rt || []; }, set: function (v) { b.items[k].rt = v; } };
    }
    if (edn.classList.contains('ne-cell')) {
      var tr = edn.closest('tr');
      var rows = [].slice.call(node.querySelectorAll('tr:not([data-brk])'));
      var ri = rows.indexOf(tr);
      var ci = [].slice.call(tr.querySelectorAll('.ne-cell')).indexOf(edn);
      if (ri < 0 || ci < 0 || !b.rows || !b.rows[ri] || !b.rows[ri][ci]) return null;
      return { get: function () { return b.rows[ri][ci].rt || []; },
               set: function (v) { b.rows[ri][ci].rt = v; } };
    }
    return null;
  };

  Editor.prototype.currentEditable = function () {
    var a = document.activeElement;
    if (a && this.root.contains(a) &&
        (a.classList.contains('ne-text') || a.classList.contains('ne-li') ||
         a.classList.contains('ne-cell'))) return a;
    return this.focusEd && this.root.contains(this.focusEd) ? this.focusEd : null;
  };

  Editor.prototype.selBounds = function (edn) {
    var s = window.getSelection();
    if (s && s.rangeCount) {
      var r = s.getRangeAt(0);
      if (edn.contains(r.startContainer) && edn.contains(r.endContainer)) {
        return [offsetIn(edn, r.startContainer, r.startOffset),
                offsetIn(edn, r.endContainer, r.endOffset)];
      }
    }
    if (this.lastSel && this.lastSel.ed === edn) return [this.lastSel.a, this.lastSel.b];
    return null;
  };

  /*@3.NOEJ.11*/
  var PEND_CMD = { b: 'bold', i: 'italic', u: 'underline', st: 'strikeThrough' };

  /*@3.NOEJ.27*/
  function tagMode() {
    try { document.execCommand('styleWithCSS', false, false); } catch (e) {}
  }

  Editor.prototype.pendMark = function (mark) {
    var cmd = PEND_CMD[mark];
    if (!cmd) return false;
    var edn = this.currentEditable();
    if (!edn) return false;
    tagMode();
    var ok = false;
    try { ok = document.execCommand(cmd, false, null); } catch (e) { ok = false; }
    if (!ok) return false;
    this.emitState();
    return true;
  };

  Editor.prototype.pendState = function () {
    var out = null;
    for (var m in PEND_CMD) {
      var v = false;
      try { v = document.queryCommandState(PEND_CMD[m]); } catch (e) { return null; }
      (out = out || {})[m] = !!v;
    }
    return out;
  };

  Editor.prototype.applyMark = function (mark, value) {
    /*@3.NOEJ.112*/
    var picked = this.selectedBlocks();
    if (picked.length) return this.markBlocks(picked, mark, value);
    if (this.cselLive()) return this.markCells(mark, value);
    var edn = this.currentEditable();
    if (!edn) return false;
    var ref = this.runsRef(edn);
    if (!ref) return false;

    var node = edn.closest('[data-bid]');
    this.readBlock(node);

    var bounds = this.selBounds(edn);
    var rt = ref.get();
    var total = runsLen(rt);
    if (!bounds) bounds = [0, total];
    var a = Math.max(0, Math.min(bounds[0], bounds[1]));
    var b = Math.min(total, Math.max(bounds[0], bounds[1]));

    if (a === b) {
      /*@3.NOEJ.26*/
      if (PEND_CMD[mark]) return this.pendMark(mark);
      if (!total) return this.pendRun(mark, value);
      var w = wordBounds(rt, a);
      if (w) { a = w[0]; b = w[1]; }
      else { a = 0; b = total; }
    }

    var before = this.snapshot();
    var parts = sliceRuns(rt, a, b);
    var mid = parts[1];
    if (!mid.length) return false;

    var allHave = true;
    for (var i = 0; i < mid.length; i++) {
      var have = (mark === 'fg' || mark === 'hl') ? (mid[i][mark] || '') === value : !!mid[i][mark];
      if (!have) { allHave = false; break; }
    }
    var next = allHave ? null : value;
    for (var j = 0; j < mid.length; j++) {
      if (next == null || next === '') delete mid[j][mark];
      else mid[j][mark] = next;
    }

    var out = joinRuns([parts[0], mid, parts[2]]);
    ref.set(out);
    this.pushUndo(before);
    edn.innerHTML = B().runsToHtmlBidi(out);
    selectRange(edn, a, b);
    this.lastSel = { ed: edn, a: a, b: b };
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.555*/
  Editor.prototype.markCells = function (mark, value) {
    var td = this.cellNode(), node = td ? td.closest('[data-bid]') : null;
    var cn = this.cselNode();
    if (cn && node !== cn) node = cn;
    var hit = node ? this.blockAt(node.getAttribute('data-bid')) : null;
    var sel = hit ? this.cselOf(hit.b.id) : null;
    if (!sel) return false;
    this.readBlock(node);
    var at = function (p) { return hit.b.rows[p[0]] ? hit.b.rows[p[0]][p[1]] : null; };
    var cells = sel.map(at).filter(function (c) { return c && runsLen(c.rt || []); });
    if (!cells.length) return false;
    var next = value;
    if (mark && cells.every(function (c) {
      return c.rt.every(function (r) { return !r.s || ((mark === 'fg' || mark === 'hl') ? (r[mark] || '') === value : !!r[mark]); });
    })) next = null;
    var before = this.snapshot();
    cells.forEach(function (c) {
      c.rt = joinRuns([c.rt.map(function (r) {
        if (!mark) return { s: r.s };
        var o = Object.assign({}, r);
        if (next == null || next === '') delete o[mark]; else o[mark] = next;
        return o;
      })]);
    });
    sel.forEach(function (p) {
      var x = cellAt(node, p[0], p[1]), c = at(p);
      if (x && c) x.innerHTML = B().runsToHtmlBidi(c.rt || []);
    });
    if (this._tfit) delete this._tfit[hit.b.id];
    node.__tfitW = -1; node.__dirty = 1;
    this.tblFit(node);
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.markBlocks = function (picked, mark, value) {
    var before = this.snapshot();
    var self = this, did = 0;
    this.readAll();
    picked.forEach(function (hit) {
      var lists = [];
      if (hit.b.rt) lists.push(function (v) { hit.b.rt = v; return hit.b.rt; });
      (hit.b.items || []).forEach(function (it) {
        lists.push(function (v) { if (v) it.rt = v; return it.rt; });
      });
      (hit.b.rows || []).forEach(function (row) {
        row.forEach(function (c) { lists.push(function (v) { if (v) c.rt = v; return c.rt; }); });
      });
      lists.forEach(function (ref) {
        var rt = ref(null) || [];
        if (!rt.length) return;
        var out = rt.map(function (r) {
          var c = Object.assign({}, r);
          if (value === '' || value == null) delete c[mark]; else c[mark] = value;
          return c;
        });
        ref(out);
        did++;
      });
    });
    if (!did) return false;
    this.pushUndo(before);
    this.render();
    this.paintBlockSel();
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.111*/
  Editor.prototype.pendRun = function (mark, value) {
    if (mark !== 'fg' && mark !== 'hl' && mark !== 'ff') return false;
    var edn = this.currentEditable();
    if (!edn || !value) return false;
    var s = window.getSelection();
    if (!s || !s.rangeCount) return false;
    var r = s.getRangeAt(0);
    if (!edn.contains(r.startContainer) || !r.collapsed) return false;
    var run = {}; run.s = '\u200b'; run[mark] = value;
    var box = document.createElement('span');
    box.innerHTML = B().runsToHtml([run]);
    var node = box.firstElementChild;
    if (!node) return false;
    r.insertNode(node);
    var txt = node.firstChild;
    if (txt) {
      var rr = document.createRange();
      rr.setStart(txt, txt.nodeValue.length);
      rr.collapse(true);
      s.removeAllRanges(); s.addRange(rr);
    }
    this.readBlock(edn.closest('[data-bid]'));
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.114*/
  Editor.prototype.liveMark = function (mark, value, done) {
    var edn = this.currentEditable();
    if (!edn) return false;
    var ref = this.runsRef(edn);
    if (!ref) return false;
    var L = this._live;
    if (!L || L.ed !== edn || L.mark !== mark) {
      var node0 = edn.closest('[data-bid]');
      this.readBlock(node0);
      var rt0 = ref.get() || [];
      var total0 = runsLen(rt0);
      var bn = this.selBounds(edn);
      var a0, b0;
      if (bn && bn[0] !== bn[1]) { a0 = Math.min(bn[0], bn[1]); b0 = Math.max(bn[0], bn[1]); }
      else {
        var w0 = bn ? wordBounds(rt0, bn[0]) : null;
        if (w0) { a0 = w0[0]; b0 = w0[1]; } else { a0 = 0; b0 = total0; }
      }
      if (a0 === b0) return false;
      L = this._live = { ed: edn, mark: mark, a: a0, b: b0,
                         snap: this.snapshot(), pushed: false };
    }
    var rt = ref.get() || [];
    var parts = sliceRuns(rt, L.a, L.b);
    var mid = parts[1];
    if (!mid.length) return false;
    for (var i = 0; i < mid.length; i++) {
      if (!value) delete mid[i][mark]; else mid[i][mark] = value;
    }
    ref.set(joinRuns([parts[0], mid, parts[2]]));
    if (!L.pushed) { this.pushUndo(L.snap); L.pushed = true; }
    edn.innerHTML = B().runsToHtmlBidi(ref.get());
    selectRange(edn, L.a, L.b);
    this.lastSel = { ed: edn, a: L.a, b: L.b };
    if (done) { this._live = null; this.touch(); }
    this.emitState();
    return true;
  };

  Editor.prototype.clearMarks = function () {
    var picked = this.selectedBlocks();
    if (picked.length > 1) return this.clearMarksAll(picked);
    if (this.cselLive()) return this.markCells(null);
    var edn = this.currentEditable();
    if (!edn) return false;
    var ref = this.runsRef(edn);
    if (!ref) return false;
    this.readBlock(edn.closest('[data-bid]'));
    var rt = ref.get();
    var total = runsLen(rt);
    var bounds = this.selBounds(edn) || [0, total];
    var a = Math.min(bounds[0], bounds[1]), b = Math.max(bounds[0], bounds[1]);
    if (a === b) { a = 0; b = total; }
    var before = this.snapshot();
    var parts = sliceRuns(rt, a, b);
    var mid = parts[1].map(function (r) { return { s: r.s }; });
    var out = joinRuns([parts[0], mid, parts[2]]);
    ref.set(out);
    this.pushUndo(before);
    edn.innerHTML = B().runsToHtmlBidi(out);
    selectRange(edn, a, b);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.clearMarksAll = function (picked) {
    var self = this, before = this.snapshot(), n = 0, ids = [];
    var strip = function (rt) { return (rt || []).map(function (r) { return { s: r.s }; }); };
    picked.forEach(function (hit) {
      var b = hit.b, node = self.root.querySelector('[data-bid="' + b.id + '"]');
      if (node) self.readBlock(node);
      if (Array.isArray(b.rt)) b.rt = strip(b.rt);
      if (Array.isArray(b.items)) b.items.forEach(function (it) { it.rt = strip(it.rt); });
      if (Array.isArray(b.rows)) b.rows.forEach(function (row) { row.forEach(function (c) { c.rt = strip(c.rt); }); });
      delete b.hlb;
      n++; ids.push(b.id);
    });
    if (!n) return false;
    this.pushUndo(before);
    this.renderMany(ids);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.setLink = function (url) {
    var edn = this.currentEditable();
    if (!edn) return false;
    var href = url ? B().normUrl(url) : '';
    return this.applyMarkForce(edn, 'lk', href);
  };

  /*@3.NOEJ.91*/
  Editor.prototype.linkCtx = function () {
    var edn = this.currentEditable();
    if (!edn) return null;
    var ref = this.runsRef(edn);
    if (!ref) return null;
    this.readBlock(edn.closest('[data-bid]'));
    var bounds = this.selBounds(edn) || [0, 0];
    var a = Math.min(bounds[0], bounds[1]), b = Math.max(bounds[0], bounds[1]);
    var rt = ref.get();
    var text = '', url = '', pos = 0, i;
    for (i = 0; i < (rt || []).length; i++) {
      var r = rt[i], sv = r.s || '', st = pos, en = pos + sv.length;
      pos = en;
      if (en <= a || st >= b) {
        if (a === b && st <= a && a <= en && r.lk && !url) url = r.lk;
        continue;
      }
      text += sv.slice(Math.max(0, a - st), Math.min(sv.length, b - st));
      if (r.lk && !url) url = r.lk;
    }
    return { ed: edn, a: a, b: b, text: text, url: url };
  };

  Editor.prototype.applyLink = function (ctx, url, label) {
    if (!ctx || !ctx.ed || !this.root.contains(ctx.ed)) {
      return this.setLink(url);
    }
    var edn = ctx.ed;
    var ref = this.runsRef(edn);
    if (!ref) return false;
    var href = url ? B().normUrl(url) : '';
    if (url && !href) return false;
    var rt = ref.get();
    var a = ctx.a, b = ctx.b;
    var txt = String(label == null ? '' : label);
    var before = this.snapshot();
    var out, caret;

    if (a === b && !href) return false;

    if (a === b) {
      var shown = txt || href;
      var parts0 = sliceRuns(rt, a, a);
      out = joinRuns([parts0[0], [{ s: shown, lk: href }], parts0[2]]);
      caret = a + shown.length;
    } else {
      var parts = sliceRuns(rt, a, b);
      var mid = parts[1];
      if (txt && txt !== ctx.text) {
        var style = Object.assign({}, mid[0] || {});
        delete style.s;
        mid = [Object.assign(style, { s: txt })];
      }
      for (var i = 0; i < mid.length; i++) {
        if (href) mid[i].lk = href; else delete mid[i].lk;
      }
      out = joinRuns([parts[0], mid, parts[2]]);
      caret = a + (txt || ctx.text || '').length;
    }
    ref.set(out);
    this.pushUndo(before);
    edn.innerHTML = B().runsToHtmlBidi(out);
    try { edn.focus(); } catch (e) {}
    selectRange(edn, caret, caret);
    this.lastSel = { ed: edn, a: caret, b: caret };
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.applyMarkForce = function (edn, mark, value) {
    var ref = this.runsRef(edn);
    if (!ref) return false;
    this.readBlock(edn.closest('[data-bid]'));
    var rt = ref.get();
    var total = runsLen(rt);
    var bounds = this.selBounds(edn);
    if (!bounds) return false;
    var a = Math.min(bounds[0], bounds[1]), b = Math.max(bounds[0], bounds[1]);
    if (a === b) {
      var w = wordBounds(rt, a);
      if (!w) return false;
      a = w[0]; b = w[1];
    }
    var before = this.snapshot();
    var parts = sliceRuns(rt, a, b);
    var mid = parts[1];
    for (var i = 0; i < mid.length; i++) {
      if (!value) delete mid[i][mark]; else mid[i][mark] = value;
    }
    var out = joinRuns([parts[0], mid, parts[2]]);
    ref.set(out);
    this.pushUndo(before);
    edn.innerHTML = B().runsToHtmlBidi(out);
    selectRange(edn, a, b);
    this.touch();
    this.emitState();
    return true;
  };


  /*@3.NOEJ.176*/
  Editor.prototype.hasLiveFocus = function () {
    var a = document.activeElement;
    if (!a || a === document.body || a === document.documentElement) return false;
    if (this.root.contains(a)) return true;
    if (!a.closest) return false;
    return !!a.closest('.nr, .ne-menu, .ne-selhint, .nov-host, .nc-wrap, dialog[open]');
  };

  Editor.prototype.selState = function () {
    var edn = this.currentEditable();
    var st = { ty: null, lv: null, marks: {}, canUndo: this.hist ? this.hist.canUndo() : !!this.undo.length,
      canRedo: this.hist ? this.hist.canRedo() : !!this.redo.length,
               canUp: false, canDown: false, hasBlock: false,
               selMode: !!this._selMode,
               bsel: this.selectedBlocks().length,
               canPaste: clipAny() };
    /*@3.NOEJ.178*/
    if (!st.bsel && !this.hasLiveFocus()) return st;
    var bid = this.activeBid();
    var node = edn ? edn.closest('[data-bid]')
                   : (bid ? this.root.querySelector('[data-bid="' + bid + '"]') : null);
    if (!node) return st;
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit) return st;
    st.hasBlock = true;
    st.ty = hit.b.ty;
    st.lv = hit.b.lv || null;
    st.canUp = hit.i > 0;
    st.canDown = hit.i < this.doc.blocks.length - 1;
    st.dir = hit.b.dir || 'auto';
    st.al = hit.b.al || 'start';
    st.fs = hit.b.fs || 0;
    st.ff = hit.b.ff || '';
    var fsNode = edn || node.querySelector(ANCHOR_SEL);
    if (fsNode) st.fsEff = Math.round(parseFloat(getComputedStyle(fsNode).fontSize) || 0);
    if (!edn) return st;
    var ref = this.runsRef(edn);
    if (!ref) return st;
    var rt = ref.get();
    var bounds = this.selBounds(edn);
    if (!bounds) return st;
    var a = Math.min(bounds[0], bounds[1]), b = Math.max(bounds[0], bounds[1]);
    /*@3.NOEJ.28*/
    var pend = (a === b) ? this.pendState() : null;
    if (a === b) {
      var w = wordBounds(rt, a);
      if (w) { a = w[0]; b = w[1]; }
    }
    var mid = sliceRuns(rt, a, b)[1];
    if (!mid.length) {
      if (pend) for (var pk in pend) st.marks[pk] = pend[pk];
      return st;
    }
    var keys = ['b', 'i', 'u', 'st', 'c'];
    for (var k = 0; k < keys.length; k++) {
      var all = true;
      for (var i = 0; i < mid.length; i++) if (!mid[i][keys[k]]) { all = false; break; }
      st.marks[keys[k]] = all;
    }
    if (pend) for (var pk2 in pend) st.marks[pk2] = pend[pk2];
    var fg = mid[0].fg || '', hl = mid[0].hl || '';
    for (var j = 1; j < mid.length; j++) {
      if ((mid[j].fg || '') !== fg) fg = '';
      if ((mid[j].hl || '') !== hl) hl = '';
    }
    st.marks.fg = fg; st.marks.hl = hl;
    var rff = mid[0].ff || '';
    for (var q = 1; q < mid.length; q++) if ((mid[q].ff || '') !== rff) rff = '';
    st.marks.ff = rff;
    if (rff) st.ff = rff;
    var rfz = mid[0].fz || 0;
    for (var q2 = 1; q2 < mid.length; q2++) if ((mid[q2].fz || 0) !== rfz) rfz = 0;
    st.marks.fz = rfz;
    if (rfz) st.fs = rfz;
    return st;
  };

  /*@3.NOEJ.49*/
  Editor.prototype.bindFreeCleanup = function () {
    var self = this;
    this.root.addEventListener('focusout', function (e) {
      var node = e.target.closest ? e.target.closest('[data-bid][data-fp]') : null;
      if (!node) return;
      var id = node.getAttribute('data-bid');
      setTimeout(function () {
        var a = document.activeElement;
        if (a && self.root.contains(a) && a.closest('[data-bid]') === node) return;
        /*@3.NOEJ.113*/
        if (a && a !== document.body && !self.root.contains(a)) return;
        self.readBlock(node);
        self.dropEmptyFree(id);
      }, 0);
    });
  };

  Editor.prototype.emitState = function () {
    if (this.opts.onSelState) {
      var self = this;
      clearTimeout(this._stT);
      this._stT = setTimeout(function () { self.opts.onSelState(self.selState()); }, 0);
    }
  };


  /*@3.NOEJ.14*/
  Editor.prototype.activeBid = function () {
    var edn = this.currentEditable();
    var node = edn ? edn.closest('[data-bid]') : null;
    if (node) return node.getAttribute('data-bid');
    if (this.focusBid && this.blockAt(this.focusBid)) return this.focusBid;
    return this.lastBlockId();
  };

  /*@3.NOEJ.354*/
  Editor.prototype.selLink = function () {
    var s;
    try { s = window.getSelection(); } catch (e) { return null; }
    if (!s || !s.rangeCount) return null;
    var pick = function (n) {
      if (!n) return null;
      var el = (n.nodeType === 1) ? n : n.parentNode;
      return (el && el.closest) ? el.closest('a[href], a[data-nl]') : null;
    };
    var a = pick(s.anchorNode);
    if (!a || !this.root.contains(a)) return null;
    var b = pick(s.focusNode);
    return (b === a) ? a : null;
  };

  Editor.prototype.underline = function () {
    var a = this.selLink();
    if (!a) return this.applyMark('u', 1);
    this._ctxLink = a;
    return this.linkAct(a, 'lkline');
  };

  Editor.prototype.exec = function (cmd, val) {
    var bid = this.activeBid();
    switch (cmd) {
      case 'undo': return this.hist ? this.hist.undo() : this.doUndo();
      case 'redo': return this.hist ? this.hist.redo() : this.doRedo();
      case 'bold': return this.applyMark('b', 1);
      case 'italic': return this.applyMark('i', 1);
      case 'underline': return this.underline();
      case 'strike': return this.applyMark('st', 1);
      case 'code': return this.applyMark('c', 1);
      case 'fg': return this.applyMark('fg', val);
      case 'hl': return this.applyMark('hl', val);
      case 'clear': return this.clearMarks();
      case 'link': return this.setLink(val);
      case 'turn':
        if (!bid) return;
        return this.convert(bid, val.ty, val.lv);
      case 'insert':
        return this.addBlock(val.ty, bid, val.lv, val.extra);
      case 'up': return this.move(bid, -1);
      case 'down': return this.move(bid, 1);
      case 'dup': return this.duplicate(bid);
      case 'del': return this.remove(bid);
      case 'blockHl': return this.setBlockStyle('hlb', val);
      case 'dir':
        if (this.selectedBlocks().length <= 1 && this.cellNode()) return this.setCellProp('dir', val);
        return this.setBlockStyle('dir', val);
      case 'align': {
        var tdA = this.cellNode();
        if (tdA) {
          var hA = this.blockAt(tdA.closest('[data-bid]').getAttribute('data-bid'));
          return this.setCellAlign('h', val === 'start' ? '' : val, null, cscOf(hA && hA.b));
        }
        return this.setBlockStyle('al', val);
      }
      case 'font': {
        /*@3.NOEJ.396*/
        if (this.selectedBlocks().length > 1) return this.setBlockStyle('ff', val);
        if (this.cselLive()) return this.setCellProp('ff', val);
        var ednF = this.currentEditable();
        var bnd = ednF ? this.selBounds(ednF) : null;
        if (ednF && bnd && bnd[0] !== bnd[1]) return this.applyMarkForce(ednF, 'ff', val || '');
        if (this.cellNode()) return this.setCellProp('ff', val);
        return this.setBlockStyle('ff', val);
      }
      case 'fsize': {
        if (this.selectedBlocks().length > 1) return this.setFontSize(val);
        if (this.cselLive()) return this.setCellProp('fs', val);
        var ednZ = this.currentEditable();
        var bz = ednZ ? this.selBounds(ednZ) : null;
        if (ednZ && bz && bz[0] !== bz[1]) {
          var v = parseFloat(val);
          return this.applyMarkForce(ednZ, 'fz',
            (val === '' || !isFinite(v) || v <= 0) ? '' : Math.max(8, Math.min(96, v)));
        }
        if (this.cellNode()) return this.setCellProp('fs', val);
        return this.setFontSize(val);
      }
      case 'save': return this.save();
    }
  };


  /*@3.NOEJ.20*/
  /*@3.NOEJ.39*/
  Editor.prototype.setBlockStyle = function (key, val) {
    var picked = this.selectedBlocks();
    if (!picked.length) {
      var bid0 = this.activeBid();
      var h0 = bid0 ? this.blockAt(bid0) : null;
      if (!h0) return false;
      picked = [h0];
    }
    var before = this.snapshot();
    var self = this;
    picked.forEach(function (hit) {
      var node0 = self.root.querySelector('[data-bid="' + hit.b.id + '"]');
      if (node0) self.readBlock(node0);
      if (!val || val === 'auto' || val === 'start') delete hit.b[key];
      else hit.b[key] = val;
      var node = self.root.querySelector('[data-bid="' + hit.b.id + '"]');
      if (!node) return;
      self.applyStyleAttrs(node, hit.b);
      var eds = node.querySelectorAll('.ne-text, .ne-li, .ne-cell');
      for (var i = 0; i < eds.length; i++) eds[i].setAttribute('dir', eds[i].getAttribute('data-cdir') || blockDir(hit.b, self.doc));
      if (hit.b.ty === 'tbl') {
        if (self._tfit) delete self._tfit[hit.b.id];
        node.__tfitW = -1; node.__dirty = 1;
        self.tblFit(node);
      }
    });
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.95*/
  var FMT_MARKS = ['b', 'i', 'u', 'st', 'c', 'fg', 'hl', 'fz', 'ff', 'sb', 'sp'];
  /*@3.NOEJ.575*/
  function wordAt(rt, at) {
    var t = '', i;
    for (i = 0; i < rt.length; i++) t += (rt[i].s || '');
    var a = at, b = at, SP = /[\s.,،؛;:!?؟()"'«»]/;
    while (a > 0 && !SP.test(t.charAt(a - 1))) a--;
    while (b < t.length && !SP.test(t.charAt(b))) b++;
    return [a, b];
  }
  var FMT_BLOCK = ['al', 'dir', 'ff', 'fs', 'hlb'];

  Editor.prototype.copyFormat = function () {
    var edn = this.currentEditable();
    if (!edn) return null;
    var ref = this.runsRef(edn);
    var node = edn.closest('[data-bid]');
    var hit = node ? this.blockAt(node.getAttribute('data-bid')) : null;
    if (!hit) return null;
    this.readBlock(node);
    var marks = {};
    if (ref) {
      var rt = ref.get() || [];
      var bounds = this.selBounds(edn) || [0, 0];
      var at = Math.min(bounds[0], bounds[1]);
      var pos = 0, pick = null, i;
      for (i = 0; i < rt.length; i++) {
        var len = (rt[i].s || '').length;
        if (at <= pos + len && len) { pick = rt[i]; break; }
        pos += len;
      }
      if (!pick) pick = rt[rt.length - 1] || null;
      if (pick) {
        for (i = 0; i < FMT_MARKS.length; i++) {
          if (pick[FMT_MARKS[i]]) marks[FMT_MARKS[i]] = pick[FMT_MARKS[i]];
        }
      }
    }
    var blk = { ty: hit.b.ty, lv: hit.b.lv || 0 };
    for (var k = 0; k < FMT_BLOCK.length; k++) {
      if (hit.b[FMT_BLOCK[k]]) blk[FMT_BLOCK[k]] = hit.b[FMT_BLOCK[k]];
    }
    return { marks: marks, block: blk };
  };

  Editor.prototype.pasteFormat = function (fmt) {
    if (!fmt) return false;
    var edn = this.currentEditable();
    if (!edn) return false;
    var node = edn.closest('[data-bid]');
    var hit = node ? this.blockAt(node.getAttribute('data-bid')) : null;
    if (!hit) return false;
    var before = this.snapshot();
    this.readBlock(node);

    var ref = this.runsRef(edn);
    if (ref) {
      var rt = ref.get() || [];
      var total = runsLen(rt);
      var bounds = this.selBounds(edn);
      var a = 0, b = total;
      if (bounds) {
        a = Math.min(bounds[0], bounds[1]);
        b = Math.max(bounds[0], bounds[1]);
        /*@3.NOEJ.144*/
        if (a === b) {
          var wr = edn.closest('.ne-cell, td, th') ? [0, total] : wordAt(rt, a);
          a = wr[0]; b = wr[1];
          if (a === b) return false;
        }
      }
      if (b > a) {
        var parts = sliceRuns(rt, a, b);
        var mid = parts[1];
        for (var i = 0; i < mid.length; i++) {
          for (var m = 0; m < FMT_MARKS.length; m++) delete mid[i][FMT_MARKS[m]];
          for (var k in fmt.marks) mid[i][k] = fmt.marks[k];
        }
        var out = joinRuns([parts[0], mid, parts[2]]);
        ref.set(out);
        edn.innerHTML = B().runsToHtmlBidi(out);
        selectRange(edn, a, b);
        this.lastSel = { ed: edn, a: a, b: b };
      }
    }

    var blk = fmt.block || {};
    if (edn.closest('.ne-cell, td, th') || hit.b.ty === 'tbl') blk = null;
    for (var j = 0; blk && j < FMT_BLOCK.length; j++) {
      var key = FMT_BLOCK[j];
      if (blk[key]) hit.b[key] = blk[key]; else delete hit.b[key];
    }
    var live = this.root.querySelector('[data-bid="' + hit.b.id + '"]');
    if (live) this.applyStyleAttrs(live, hit.b);
    if (blk && blk.ty && (blk.ty !== hit.b.ty || (blk.ty === 'h' && (blk.lv || 0) !== (hit.b.lv || 0)))) {
      if (blk.ty === 'p' || blk.ty === 'h' || blk.ty === 'quote' || blk.ty === 'callout') {
        this.convert(hit.b.id, blk.ty, blk.lv || 0);
      }
    }
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.98*/
  Editor.prototype.moveItem = function (bid, from, to) {
    var hit = this.blockAt(bid);
    if (!hit || !LISTY[hit.b.ty] || !hit.b.items) return false;
    var n = hit.b.items.length;
    if (from < 0 || from >= n || to < 0 || to > n || from === to) return false;
    var node = this.root.querySelector('[data-bid="' + bid + '"]');
    var before = this.snapshot();
    if (node) this.readBlock(node);
    var it = hit.b.items.splice(from, 1)[0];
    if (!it) return false;
    hit.b.items.splice(to > from ? to - 1 : to, 0, it);
    this.pushUndo(before);
    this.render();
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.99*/
  Editor.prototype.setReadOnly = function (on) {
    this.readOnly = !!on;
    this.applyReadOnly();
  };

  Editor.prototype.applyReadOnly = function () {
    if (!this.readOnly) return;
    this.root.setAttribute('data-ro', '1');
    var q = this.root.querySelectorAll('[contenteditable="true"]');
    for (var i = 0; i < q.length; i++) q[i].setAttribute('contenteditable', 'false');
    var f = this.root.querySelectorAll('input, textarea, select, button');
    for (var j = 0; j < f.length; j++) {
      if (f[j].classList.contains('ne-check')) continue;
      f[j].disabled = true;
    }
  };

  /*@3.NOEJ.97*/
  Editor.prototype.appendBlocks = function (blocks) {
    if (!Array.isArray(blocks) || !blocks.length) return 0;
    this.stampDir(blocks);
    var before = this.snapshot();
    this.readAll();
    var live = B().liveBlocks ? B().liveBlocks(this.doc) : this.doc.blocks;
    /*@3.NOEJ.150*/
    var wiped = !live.length;
    if (wiped) this.doc.blocks.length = 0;
    var at = this.doc.blocks.length;
    for (var i = 0; i < blocks.length; i++) this.doc.blocks.push(blocks[i]);
    this.pushUndo(before);
    if (wiped) this.render();
    else this.renderInsert(at, blocks);
    this.focusBlock(blocks[blocks.length - 1].id);
    this.touch();
    this.emitState();
    return blocks.length;
  };

  /*@3.NOEJ.94*/
  Editor.prototype.setFontSize = function (px) {
    var v = parseFloat(px);
    if (px === '' || px == null || !isFinite(v) || v <= 0) return this.setBlockStyle('fs', 0);
    v = Math.max(8, Math.min(96, Math.round(v * 10) / 10));
    return this.setBlockStyle('fs', v);
  };

  /*@3.NOEJ.12*/
  Editor.prototype.placeMenu = function (m, anchor) {
    var pad = 8, gap = 6;
    m.style.position = 'fixed';
    m.style.maxBlockSize = '';
    var r = (anchor && anchor.getBoundingClientRect)
      ? anchor.getBoundingClientRect()
      : { top: anchor.y, bottom: anchor.y, left: anchor.x, right: anchor.x,
          width: 0, height: 0 };
    var vh = window.innerHeight, vw = window.innerWidth;
    var mr = m.getBoundingClientRect();
    var h = mr.height, w = mr.width;

    var roomBelow = vh - r.bottom - gap - pad;
    var roomAbove = r.top - gap - pad;
    var top;
    if (h <= roomBelow) top = r.bottom + gap;
    else if (h <= roomAbove) top = r.top - h - gap;
    else if (roomBelow >= roomAbove) { top = r.bottom + gap; m.style.maxBlockSize = roomBelow + 'px'; }
    else { m.style.maxBlockSize = roomAbove + 'px'; top = pad; }
    m.style.insetBlockStart = Math.max(pad, top) + 'px';

    var left = isAr() ? (r.right - w) : r.left;
    left = Math.max(pad, Math.min(left, vw - w - pad));
    m.style.insetInlineStart = '';
    m.style.left = left + 'px';
    m.style.right = 'auto';
  };

  /*@3.NOEJ.349*/
  Editor.prototype.grabSel = function () {
    this._ctxSel = null;
    this._ctxSelTxt = '';
    try {
      var s = window.getSelection();
      if (!s || !s.rangeCount || s.isCollapsed) return;
      if (!this.root.contains(s.anchorNode) || !this.root.contains(s.focusNode)) return;
      var r = s.getRangeAt(0);
      var txt = String(s).replace(/\u200b/g, '');
      if (!txt) return;
      this._ctxSel = r.cloneRange();
      this._ctxSelTxt = txt;
    } catch (e) {}
  };

  Editor.prototype.putSel = function () {
    var r = this._ctxSel;
    if (!r) return null;
    var host = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
    var edn = (host && host.closest) ? host.closest('[contenteditable="true"]') : null;
    if (edn) { try { edn.focus({ preventScroll: true }); } catch (e) {} }
    try {
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch (e2) { return null; }
    return edn;
  };

  Editor.prototype.copySel = function (cut) {
    var edn = this.putSel();
    if (!this._ctxSel) return false;
    var before = cut ? this.snapshot() : null;
    var done = false;
    try { done = document.execCommand(cut ? 'cut' : 'copy'); } catch (e) { done = false; }
    if (!done) {
      var box = document.createElement('div');
      try { box.appendChild(this._ctxSel.cloneContents()); } catch (e1) {}
      var txt = box.textContent || this._ctxSelTxt || '';
      if (txt && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt)['catch'](function () {});
        done = true;
      }
    }
    if (cut && done) {
      var node = edn ? edn.closest('[data-bid]') : null;
      while (node && node.parentNode !== this.root) {
        node = (node.parentNode && node.parentNode.closest)
          ? node.parentNode.closest('[data-bid]') : null;
      }
      if (node) this.readBlock(node);
      this.pushUndo(before);
      this.touch();
      this.emitState();
    }
    return done;
  };

  /*@3.NOEJ.350*/
  Editor.prototype.linkHost = function (a) {
    var node = a && a.closest ? a.closest('[data-bid]') : null;
    while (node && node.parentNode !== this.root) {
      node = (node.parentNode && node.parentNode.closest)
        ? node.parentNode.closest('[data-bid]') : null;
    }
    return node;
  };

  Editor.prototype.linkAct = function (a, act) {
    if (!a) return false;
    var href = a.getAttribute('data-nl') || a.getAttribute('href') || '';
    if (act === 'lkopen') {
      if (/^https:/i.test(href)) window.open(href, '_blank', 'noopener,noreferrer');
      else if (this.opts.onNoteLink) this.opts.onNoteLink(href);
      return true;
    }
    if (act === 'lkcopy') {
      if (href && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(href)['catch'](function () {});
      }
      if (this.opts.onNote) {
        this.opts.onNote(L('نُسخ عنوانُ الرابط', 'Link address copied'));
      }
      return true;
    }
    if (act === 'lksel' || act === 'lkedit') {
      try {
        var r = document.createRange();
        r.selectNodeContents(a);
        var host0 = a.closest('[contenteditable="true"]');
        if (host0) { try { host0.focus({ preventScroll: true }); } catch (eF) {} }
        var s = window.getSelection();
        s.removeAllRanges(); s.addRange(r);
      } catch (e) {}
      if (act === 'lkedit' && this.opts.onAskLink) this.opts.onAskLink();
      return true;
    }
    var node = this.linkHost(a);
    if (!node) return false;
    var before = this.snapshot();
    if (act === 'lkoff') {
      var pa = a.parentNode;
      while (a.firstChild) pa.insertBefore(a.firstChild, a);
      pa.removeChild(a);
    } else if (act === 'lkline') {
      if (a.getAttribute('data-lu') === '0') a.removeAttribute('data-lu');
      else a.setAttribute('data-lu', '0');
    } else { return false; }
    this.readBlock(node);
    this.pushUndo(before);
    this.renderOne(node.getAttribute('data-bid'));
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.316*/
  Editor.prototype.openCtx = function (target, cx, cy, at0) {
    if (this.readOnly) return false;
    if (!target || !this.root.contains(target)) return false;
    if (target.closest('.ne-menu') || target.closest('.ne-rail') ||
        target.closest('.ne-dgm-ed')) return false;
    this.grabSel();
    this._ctxLink = target.closest ? target.closest('a[href], a[data-nl]') : null;
    var node = target.closest ? target.closest('[data-bid]') : null;
    while (node && node.parentNode !== this.root) {
      node = (node.parentNode && node.parentNode.closest)
        ? node.parentNode.closest('[data-bid]') : null;
    }
    this.closeMenu();
    var at = { x: cx, y: cy };
    this._ctxHear = null;
    if (this.opts.hearAt) {
      var bts = 0, cvB = (node && this.canvases) ? this.canvases[node.getAttribute('data-bid')] : null;
      var sB = (cvB && cvB.stampAt) ? cvB.stampAt(cx, cy) : null;
      if (sB) bts = sB.ts;
      try { this._ctxHear = this.opts.hearAt(at0 ? at0.x : cx, at0 ? at0.y : cy, bts); } catch (eH) {}
    }
    if (node) {
      var bid = node.getAttribute('data-bid');
      this.touchAct(bid);
      this.openMenu(bid, at, 'block');
    } else {
      this.dropProv();
      var lp = this.localPoint(cx, cy);
      this.openMenu(null, at, 'paper', { x: lp.x, y: Math.max(0, lp.y) });
    }
    return true;
  };

  Editor.prototype.hintCtx = function () {
    if (this._ctxSaid || this.readOnly) return;
    this._ctxSaid = 1;
    this.say(this.coarse()
      ? L('المسِ الورقةَ مطوّلاً لإضافةِ حقلٍ هنا أو تغييرِ عنصر.',
          'Touch and hold the page to add a field here or change an element.')
      : L('اضغطْ بالزرِّ الأيمن لإضافةِ حقلٍ هنا أو تغييرِ عنصر.',
          'Right-click to add a field here or change an element.'));
  };

  Editor.prototype.selRows = function () {
    var n = (this._ctxSelTxt || '').replace(/\s+/g, ' ').trim();
    if (!n) return [];
    var cut = n.length > 26 ? (n.slice(0, 26) + '…') : n;
    var rows = [{ h: L('النصُّ المحدَّد', 'Selected text'), q: cut },
      { a: 'selcopy', i: 'fa-copy', t: L('نسخُ النصّ', 'Copy text') },
      { a: 'selcut', i: 'fa-scissors', t: L('قصُّ النصّ', 'Cut text') }];
    if (window.GardenTr) rows.push({ a: 'seltr', i: 'fa-language', t: L('ترجمةُ النصّ', 'Translate text') });
    return rows;
  };

  Editor.prototype.lkRows = function () {
    var a = this._ctxLink;
    if (!a) return [];
    var href = a.getAttribute('data-nl') || a.getAttribute('href') || '';
    var off = a.getAttribute('data-lu') === '0';
    var show = href.replace(/^https:\/\//i, '');
    if (show.length > 30) show = show.slice(0, 30) + '…';
    return [{ h: L('الرابط', 'Link'), q: show, qdir: 'ltr' },
      { a: 'lkopen', i: 'fa-arrow-up-right-from-square', t: L('فتحٌ في نافذةٍ جديدة', 'Open in a new tab') },
      { a: 'lkcopy', i: 'fa-link', t: L('نسخُ العنوان', 'Copy address') },
      { a: 'lkedit', i: 'fa-pen', t: L('تعديلُ الرابط', 'Edit the link') },
      { a: 'lksel', i: 'fa-highlighter', t: L('حدِّدْ نصَّه لتلوينه', 'Select its text to colour it') },
      { a: 'lkline', i: 'fa-underline', t: off ? L('أعِدِ الخطَّ السفليّ', 'Bring the underline back') : L('أخفِ الخطَّ السفليّ', 'Hide the underline') },
      { a: 'lkoff', i: 'fa-link-slash', t: L('انزعِ الرابطَ وأبقِ النصّ', 'Remove the link, keep the text') }];
  };

  /*@3.NOEJ.351*/
  Editor.prototype.pasteRows = function () {
    var n = (Editor.clip && Editor.clip.length) ? Editor.clip.length
          : (clipAny() ? (clipLoad().length || 0) : 0);
    return [{ h: L('اللصق', 'Paste') },
      { a: 'cbfull', i: 'fa-paste', t: L('من الحافظة — بتنسيقه', 'From the clipboard — keep formatting'), off: !CB_OK },
      { a: 'cbtext', i: 'fa-font', t: L('من الحافظة — النصُّ فقط', 'From the clipboard — text only'), off: !CB_OK },
      { a: 'paste', i: 'fa-cubes', t: n ? L('العناصرُ المنسوخة (' + n + ')', 'Copied blocks (' + n + ')') : L('العناصرُ المنسوخة', 'Copied blocks'), off: !clipAny() }];
  };

  function turnOf(b) {
    if (!b) return null;
    for (var k = 0; k < TURN.length; k++) {
      var t = TURN[k];
      if (t.ty !== b.ty || (t.lv || 0) !== (b.lv || 0)) continue;
      if (t.ty === 'callout' && t.extra && t.extra.cal !== calKind(b)) continue;
      return { k: k, t: t };
    }
    return null;
  }

  /*@3.NOEJ.611*/
  Editor.prototype.openMenu = function (id, anchor, kind, pt) {
    var self = this;
    this.closeMenu();
    var mode = kind || 'insert';
    var hear = (mode === 'block' || mode === 'paper') ? this._ctxHear : null;
    this._ctxHear = null;
    if (!window.GardenMenu || !GardenMenu.rich) return;
    var m = null, head = null, quick = null, items = [];
    /*@3.NOEJ.614*/
    var fo = !!this.opts.freeOnly;
    var adds = function (pre) {
      return INSERT.map(function (it, k) {
        if (fo && FLOW_ONLY[it.ty]) return null;
        return { a: pre + k, i: it.icon, t: L(it.ar, it.en), eg: it.eg ? L(it.eg.ar, it.eg.en) : '' };
      }).filter(Boolean);
    };
    if (mode === 'block') {
      var hit = this.blockAt(id);
      var bb = hit ? hit.b : null;
      var i = hit ? hit.i : 0;
      var last = this.doc.blocks.length - 1;
      var many = this.selectedBlocks().length > 1;
      var tk = turnOf(bb);
      head = { ico: tk ? tk.t.icon : 'fa-shapes', t: tk ? L(tk.t.ar, tk.t.en) : L('عنصر', 'Element'),
               s: fo ? '' : L('العنصرُ ' + (i + 1) + ' من ' + (last + 1), 'Element ' + (i + 1) + ' of ' + (last + 1)) };
      quick = fo ? [] : [{ a: 'up', i: 'fa-arrow-up', t: L('لأعلى', 'Up'), off: i <= 0 },
               { a: 'down', i: 'fa-arrow-down', t: L('لأسفل', 'Down'), off: i >= last }];
      quick.push({ a: 'dup', i: 'fa-clone', t: L('كرِّرْ', 'Duplicate') },
                 { a: 'copy', i: 'fa-copy', t: L('انسخْ', 'Copy') });
      if (fo) quick.push({ a: 'del', i: 'fa-trash', t: L('احذفْ', 'Delete'), dz: 1 });
      items = items.concat(this.selRows(), this.lkRows());
      if (items.length) items.push({ h: L('هذا العنصر', 'This element') });
      items.push({ a: 'g:turn', i: 'fa-shuffle', t: L('حوِّلْه إلى', 'Turn into'), sub: TURN.map(function (it, k) {
        return { a: 'turn:' + k, i: it.icon, t: L(it.ar, it.en), ok: !!(tk && tk.k === k) };
      }) });
      /*@3.NOEJ.130*/
      if (bb && LISTY[bb.ty]) {
        var lsNow = bb.ls || (bb.ty === 'ol' ? 'num' : 'dot');
        var lsOpts = bb.ty === 'ol'
          ? [['num', '1. 2. 3.'], ['arnum', '١. ٢. ٣.'],
             ['abjad', 'أ- ب- ج-'], ['roman', 'i. ii. iii.']]
          : [['dot', L('نقطة •', 'Dot •')], ['dash', L('شرطة –', 'Dash –')],
             ['diamond', L('معيّن ◆', 'Diamond ◆')]];
        items.push({ a: 'g:ls', i: 'fa-list-ol', t: L('شكلُ العلامة', 'Marker style'), sub: lsOpts.map(function (o) {
          return { a: 'ls:' + o[0], i: 'fa-list-ol', t: o[1], ok: lsNow === o[0] };
        }).concat([{ sep: 1 }, { a: 'lsb', i: 'fa-bold', t: L('علامةٌ بارزة', 'Bold marker'), ok: !!bb.lsb }]) });
      }
      if (bb && bb.ty === 'callout') {
        items.push({ a: 'g:cal', i: CAL[calKind(bb)].icon, t: L('نوعُ الصندوق', 'Box kind'), sub: CAL_ORDER.map(function (ck) {
          return { a: 'cal:' + ck, i: CAL[ck].icon, t: L(CAL[ck].ar, CAL[ck].en), ok: calKind(bb) === ck };
        }) });
      }
      /*@3.NOEJ.79*/
      var wm = bb ? bb.wm : null;
      if (bb) {
        items.push({ a: 'g:w', i: 'fa-arrows-left-right', t: L('العرض', 'Width'), sub: [
          { a: 'w:full', i: 'fa-arrows-left-right-to-line', t: L('كامل السطر', 'Full width'), ok: wm === 'full' || (!bb.fp && wm == null) },
          { a: 'w:fit', i: 'fa-arrows-left-right', t: L('بمقدار المحتوى', 'Fit the content'), ok: wm === 'fit' || (bb.fp && wm == null) },
          { a: 'w:auto', i: 'fa-rotate-left', t: L('أعِدْه إلى الأصل', 'Reset the width'), off: wm == null }] });
      }
      if (bb && bb.fp) {
        var arM = isAr();
        items.push({ a: 'g:pos', i: 'fa-layer-group', t: L('الموضعُ والظهور', 'Position & stacking'), sub: [
          { a: 'fx:start', i: arM ? 'fa-align-right' : 'fa-align-left', t: L('إلى بداية السطر', 'To the start') },
          { a: 'fx:center', i: 'fa-align-center', t: L('في المنتصف', 'Centred') },
          { a: 'fx:end', i: arM ? 'fa-align-left' : 'fa-align-right', t: L('إلى نهاية السطر', 'To the end') },
          { sep: 1 },
          { a: 'z:front', i: 'fa-arrow-up-wide-short', t: L('إلى المقدّمة', 'Bring to front') },
          { a: 'z:up', i: 'fa-angle-up', t: L('خطوةً للأمام', 'Forward one step') },
          { a: 'z:down', i: 'fa-angle-down', t: L('خطوةً للخلف', 'Backward one step') },
          { a: 'z:back', i: 'fa-arrow-down-wide-short', t: L('إلى الخلف', 'Send to back') }].concat(fo ? [] : [
          { sep: 1 },
          { a: 'anchor', i: 'fa-thumbtack', t: L('أعِدْها إلى التراتب', 'Return it to the order') }]) });
      } else if (bb && !fo) {
        items.push({ a: 'free', i: 'fa-arrows-up-down-left-right', t: L('اجعلها حرّةَ الموضع', 'Make it free-floating') });
      }
      /*@3.NOEJ.166*/
      items.push({ a: 'sel', i: 'fa-square-check', t: L('تحديدُ الكتل', 'Select blocks') });
      if (bb && bb.card) {
        /*@3.NOEJ.410*/
        var ctNow = cardToneOf(bb);
        var ctL = [['auto', 'تلقائيّ — يتناوب', 'Automatic — alternating'], ['white', 'أبيض', 'White'], ['grey', 'رماديّ', 'Grey'],
                   ['sky', 'سماويّ', 'Sky'], ['amber', 'كهرمانيّ', 'Amber'], ['rose', 'ورديّ', 'Rose'],
                   ['emerald', 'أخضر', 'Emerald'], ['violet', 'بنفسجيّ', 'Violet']];
        var sw = '<div class="ne-menu-sw" role="group" aria-label="' + B().esc(L('لونُ البطاقة', 'Card colour')) + '">';
        for (var ci = 0; ci < ctL.length; ci++) {
          sw += '<button type="button" class="ne-menu-i ne-menu-swb ne-menu-swb--' + ctL[ci][0] +
                (ctNow === ctL[ci][0] ? ' is-on' : '') + '" role="menuitemradio" aria-checked="' +
                (ctNow === ctL[ci][0] ? 'true' : 'false') + '" data-act="ct:' + ctL[ci][0] +
                '" title="' + B().esc(L(ctL[ci][1], ctL[ci][2])) + '" aria-label="' + B().esc(L(ctL[ci][1], ctL[ci][2])) + '"></button>';
        }
        sw += '</div>';
        items.push({ h: L('البطاقة', 'The card') }, { raw: sw },
          { a: 'uncard', i: 'fa-object-ungroup', t: L('فُكَّ البطاقة', 'Ungroup the card') },
          { a: 'delcard', i: 'fa-trash-can', t: L('احذفِ البطاقةَ بكلِّ حقولِها', 'Delete the whole card'), dz: 1 });
      } else if (bb && !bb.fp) {
        items.push({ a: 'card', i: 'fa-object-group', t: many ? L('اجمعِ المحدَّدةَ في بطاقة', 'Group the selected into a card') : L('اجمعْها في بطاقة', 'Group into a card') });
      }
      if (this.doc.blocks.length > 2) {
        items.push({ a: 'gfmt', i: 'fa-wand-magic-sparkles', t: many ? L('تنسيقُ Garden للمحدَّد', 'Garden format for the selection') : L('تنسيقُ Garden للوثيقة', 'Garden format for the document') });
      }
      items = items.concat(this.pasteRows());
      if (!fo) items.push({ sep: 1 }, { a: 'del', i: 'fa-trash', t: L('حذف', 'Delete'), dz: 1 });
    } else if (mode === 'paper') {
      head = { ico: 'fa-file-lines', t: L('الورقة', 'The page'), s: L('أضِفْ عنصراً في هذا الموضع', 'Add an element at this spot') };
      quick = fo ? [{ a: 'here:0', i: 'fa-i-cursor', t: L('فقرةٌ هنا', 'Paragraph here') },
               { a: 'phere', i: 'fa-cubes', t: L('المنسوخُ هنا', 'Copied here'), off: !clipAny() }]
        : [{ a: 'pend', i: 'fa-arrow-down', t: L('فقرةٌ في الآخر', 'Paragraph at end') },
               { a: 'phere', i: 'fa-cubes', t: L('المنسوخُ في الآخر', 'Copied at end'), off: !clipAny() }];
      if (!fo || this.doc.blocks.some(function (x) { return !!x.fp; })) quick.push({ a: 'sel', i: 'fa-square-check', t: L('حدِّدْ', 'Select') });
      if (!fo && this.doc.blocks.length > 2) quick.push({ a: 'gfmt', i: 'fa-wand-magic-sparkles', t: L('تنسيقُ Garden', 'Garden format') });
      /*@3.NOEJ.345*/
      items = items.concat(this.selRows(), this.lkRows(), [{ h: L('أضِفْ هنا', 'Add here') }], adds('here:'),
        this.pasteRows().filter(function (r) { return !fo || r.a !== 'paste'; }));
    } else {
      head = { ico: 'fa-plus', t: L('أضِف بعدها', 'Add after') };
      items = adds('ins:');
    }
    if (hear) items.unshift({ a: 'hear', i: 'fa-play', t: hear.label }, { sep: 1 });
    /*@3.NOEJ.609*/
    var ar0 = (anchor && anchor.getBoundingClientRect) ? anchor.getBoundingClientRect() : null;
    m = GardenMenu.rich(ar0 ? ar0.left : (anchor ? anchor.x : 0), ar0 ? ar0.bottom : (anchor ? anchor.y : 0),
      { head: head, quick: quick, items: items }, run, {
        cls: 'ne-menu', attr: 'data-act', focus: false, keepFocus: true, filter: true,
        icls: 'ne-menu-i', hcls: 'ne-menu-h', label: L('خيارات', 'Options'),
        onClose: function () { if (self.menu === m) { self.menu = null; self.menuFor = null; } }
      });
    if (!m) return;
    if (!m.hasAttribute('data-sheet')) this.placeMenu(m, anchor);
    this.menu = m;
    this._menuAt = Date.now();
    /*@3.NOEJ.54*/
    this.menuFor = id;

    /*@3.NOEJ.110*/
    var first = m.querySelector('.ne-menu-i:not([disabled])');
    if (first) first.focus();

    /*@3.NOEJ.615*/
    var ptF = fo ? (pt || (anchor && anchor.x != null ? self.localPoint(anchor.x, anchor.y) : null)) : null;
    function run(act) {
      self.closeMenu();
      if (act === 'hear') { if (hear && hear.go) hear.go(); return; }
      if (fo && (act === 'phere' || act === 'paste' || act === 'dup' || act === 'cbfull' || act === 'cbtext')) {
        var had = self.idSet();
        var settle = function () { self.freeNew(had, act === 'dup' ? null : ptF); };
        if (act === 'dup') { self.duplicate(id); settle(); return; }
        if (act === 'cbfull' || act === 'cbtext') {
          Promise.resolve(self.pasteFromClipboard(act === 'cbtext' ? 'text' : 'full', id)).then(settle, settle);
          return;
        }
        self.clearBlockSel();
        self.pasteBlocks();
        settle();
        return;
      }
      if (act.indexOf('here:') === 0) {
        var itH = INSERT[Number(act.slice(5))];
        if (itH && pt) {
          var exH = itH.extra ? clone(itH.extra) : {};
          if (itH.lv) exH.lv = itH.lv;
          self.addFree(itH.ty, pt.x, pt.y, exH);
        }
      } else if (act === 'phere') {
        self.clearBlockSel();
        self.pasteBlocks();
      } else if (act === 'pend') {
        self.addBlock('p', self.lastBlockId());
      } else if (act.indexOf('ins:') === 0) {
        var it = INSERT[Number(act.slice(4))];
        if (it) self.addBlock(it.ty, id, it.lv, it.extra ? clone(it.extra) : null);
      } else if (act.indexOf('turn:') === 0) {
        var t = TURN[Number(act.slice(5))];
        if (t) self.convert(id, t.ty, t.lv, t.extra ? clone(t.extra) : null);
      } else if (act.indexOf('cal:') === 0) {
        self.setCallout(id, act.slice(4));
      } else if (act.indexOf('w:') === 0) {
        var wv = act.slice(2);
        self.setWidth(id, wv === 'auto' ? null : wv);
      } else if (act.indexOf('z:') === 0) {
        /*@3.NOEJ.617*/
        if (self.setZ(id, act.slice(2)) !== false) self.touchAct('');
      } else if (act.indexOf('fx:') === 0) {
        self.setFreeAlign(id, act.slice(3));
      } else if (act.indexOf('ls:') === 0) {
        self.setListStyle(id, 'ls', act.slice(3));
      } else if (act === 'lsb') {
        self.setListStyle(id, 'lsb');
      } else if (act === 'free') {
        self.makeFree(id);
      } else if (act === 'anchor') {
        self.unfree(id);
      } else if (act === 'up') self.move(id, -1);
      else if (act === 'down') self.move(id, 1);
      else if (act === 'sel') {
        /*@3.NOEJ.168*/
        self.setSelectMode(true, 1);
        if (id) { self.toggleBlockSel(id, true); self._bselLast = id; }
      }
      else if (act === 'dup') self.duplicate(id);
      else if (act === 'card') self.cardBlocks(id, true);
      else if (act === 'uncard') self.cardBlocks(id, false);
      else if (act.indexOf('ct:') === 0) self.cardTone(id, act.slice(3));
      else if (act === 'delcard') self.delCard(id);
      else if (act === 'gfmt') {
        var selG = self.selectedBlocks().map(function (x) { return x.b.id; });
        if (self.opts.onGardenFormat) { self.opts.onGardenFormat(selG.length > 1 ? selG : null); return; }
        var nG = self.gardenFormat(selG.length > 1 ? selG : null);
        if (nG >= 0 && self.opts.onNote) {
          self.opts.onNote(nG ? (L('نُسِّقت ', 'Formatted ') + nG + L(' بطاقة', ' cards'))
                              : L('لا عناوينَ تُبنى عليها بطاقات — ابدأِ الأقسامَ بعنوانٍ أو بسطرٍ عريضٍ ينتهي بنقطتين.',
                                  'No headings to build cards from — start sections with a heading or a bold line ending in a colon.'));
        }
      }
      else if (act === 'seltr') {
        var trR = null;
        try { trR = self._ctxSel ? self._ctxSel.getBoundingClientRect() : null; } catch (eT) {}
        if (window.GardenTr) GardenTr.open(self._ctxSelTxt, trR && (trR.width || trR.height) ? trR : null);
      }
      else if (act === 'selcopy' || act === 'selcut') {
        if (!self.copySel(act === 'selcut') && self.opts.onNote) {
          self.opts.onNote(L('تعذّر النسخُ من هنا — جرّبْ Ctrl+C.',
                             'Could not copy from here — try Ctrl+C.'));
        }
      }
      else if (act.indexOf('lk') === 0) self.linkAct(self._ctxLink, act);
      else if (act === 'copy') {
        self.toggleBlockSel(id, true);
        var nC = self.copyBlocks();
        if (nC && self.opts.onNote) self.opts.onNote(self.opts.freeOnly ? L('نُسخ — الصقْه بالزرِّ الأيمن ⇐ «المنسوخُ هنا»', 'Copied — paste it with right-click ⇒ “Copied here”') : L('نُسخ — الصقْه بالزرِّ الأيمن ⇐ «العناصرُ المنسوخة»', 'Copied — paste it with right-click ⇒ “Copied blocks”'));
      }
      else if (act === 'paste') {
        if (id) self.toggleBlockSel(id, true); else self.clearBlockSel();
        self.pasteBlocks();
      }
      else if (act === 'cbfull' || act === 'cbtext') {
        self.pasteFromClipboard(act === 'cbtext' ? 'text' : 'full', id);
      }
      /*@3.NOEJ.620*/
      else if (act === 'del') { if (id && self.blockSel()[id] && self.selectedBlocks().length > 1) self.deleteBlocks(); else self.remove(id); }
    }
  };

  /*@3.NOEJ.603*/
  function imgPanOpen(pan) {
    try { return !!(pan && pan.hasAttribute('popover') && pan.matches(':popover-open')); } catch (e) { return false; }
  }
  function imgPanShut(pan) {
    if (!pan) return;
    pan.hidden = true;
    if (imgPanOpen(pan)) { try { pan.hidePopover(); } catch (e) {} }
  }

  /*@3.NOEJ.237*/
  Editor.prototype.editDiagramLabel = function (id, lbl) {
    var hit = this.blockAt(id);
    if (!hit || hit.b.ty !== 'code') return;
    var was = (lbl.textContent || '').trim();
    if (!was) return;
    var src = String(hit.b.src || '');
    var at = src.indexOf(was);
    if (at < 0) {
      this.say(L('هذه التسميةُ محسوبةٌ ولا توجد نصّاً في الشِفرة — افتحِ الشِفرةَ وعدّلها.',
                 'That label is computed, not literal in the source — open the source to edit it.'));
      return;
    }
    if (src.indexOf(was, at + was.length) >= 0) {
      this.say(L('هذه التسميةُ مكرّرةٌ في الشِفرة — افتحِ الشِفرةَ وعدّل ما تريد بعينه.',
                 'That label appears more than once — open the source and edit the one you mean.'));
      return;
    }
    var self = this;
    var box = el('input', 'ne-dgm-ed', {
      type: 'text', value: was, dir: 'auto', spellcheck: 'false',
      'aria-label': L('عدّلْ تسميةَ العنصر', 'Edit the element label')
    });
    var host = lbl.closest('.ne-dgm');
    var r = lbl.getBoundingClientRect(), hr = host.getBoundingClientRect();
    box.style.insetBlockStart = Math.round(r.top - hr.top - 4) + 'px';
    box.style.insetInlineStart = Math.round(r.left - hr.left - 6) + 'px';
    box.style.inlineSize = Math.max(70, Math.round(r.width) + 24) + 'px';
    host.appendChild(box);
    box.focus();
    box.select();
    var done = false;
    function shut(save) {
      if (done) return;
      done = true;
      var now = box.value.trim();
      if (box.parentNode) box.parentNode.removeChild(box);
      if (!save || !now || now === was) return;
      if (/[\[\]{}()|"'`<>\n]/.test(now)) {
        self.say(L('تجنّبِ الأقواسَ والعلاماتِ الخاصّة في التسمية.',
                   'Avoid brackets and special marks inside a label.'));
        return;
      }
      var before = self.snapshot();
      hit.b.src = src.slice(0, at) + now + src.slice(at + was.length);
      self.pushUndo(before);
      self.renderOne(id);
      self.touch();
    }
    box.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); shut(true); }
      else if (ev.key === 'Escape') { ev.preventDefault(); shut(false); }
      ev.stopPropagation();
    });
    box.addEventListener('blur', function () { shut(true); });
  };

  Editor.prototype.say = function (msg) {
    if (this.opts.onNote) { this.opts.onNote(msg); return; }
    if (window.Garden && Garden.toast) { try { Garden.toast(msg); return; } catch (e) {} }
  };

  /*@3.NOEJ.202*/
  /*@3.NOEJ.403*/
  Editor.prototype.placeImgPanel = function (node) {
    var pan = node && node.querySelector('.ne-img-edit');
    var fig = node && node.querySelector('.ne-fig');
    if (!pan || !fig) return;
    /*@3.NOEJ.595*/
    if (!window.GardenImgEdit && !_ieP && !this.readOnly && navigator.onLine !== false) {
      setTimeout(function () { needImgEdit()['catch'](function () {}); }, 800);
    }
    if (pan.hasAttribute('popover') && this.floatImgPanel(node, pan, fig)) return;
    pan.style.top = '';
    pan.style.maxBlockSize = '';
    var fr = fig.getBoundingClientRect();
    var vv = window.visualViewport;
    var vy = vv ? vv.offsetTop : 0;
    var vh = vv ? vv.height : (window.innerHeight || 800);
    var vB = vy + vh;
    var sc = fig.parentNode;
    while (sc && sc !== document.body) {
      var ov = '';
      try { ov = getComputedStyle(sc).overflowY; } catch (eO) { ov = ''; }
      if (ov === 'auto' || ov === 'scroll') {
        var scr = sc.getBoundingClientRect();
        vy = Math.max(vy, scr.top); vB = Math.min(vB, scr.bottom);
        break;
      }
      sc = sc.parentNode;
    }
    var z = this.zoomOf() || 1;
    var pad = 8;
    /*@3.NOEJ.436*/
    if (pan.__dx != null) { pan.style.left = pan.__dx + 'px'; pan.style.top = pan.__dy + 'px'; return; }
    var blk = (pan.offsetParent || node).getBoundingClientRect();
    var pw = pan.offsetWidth || 280;
    var rtlP = this.isRtl();
    var roomE = (rtlP ? (fr.left - blk.left) : (blk.right - fr.right)) / z;
    pan.style.left = ''; pan.style.right = '';
    if (roomE >= pw + pad * 2) {
      pan.style.insetInlineStart = Math.round((rtlP ? (blk.right - fr.left) : (fr.right - blk.left)) / z + pad) + 'px';
    } else pan.style.insetInlineStart = '';
    var seenT = Math.max(fr.top, vy + pad), seenB = Math.min(fr.bottom, vB - pad);
    var ph = pan.offsetHeight || 200;
    var figH = fr.height / z;
    var top = Math.max(pad, (seenT - fr.top) / z + pad);
    var room = Math.max(0, (seenB - seenT) / z - pad * 2);
    if (ph > room && room > 120) {
      pan.style.maxBlockSize = Math.round(room) + 'px';
      ph = room;
    }
    if (top + ph > figH - pad) top = Math.max(pad, figH - ph - pad);
    pan.style.top = Math.round(top) + 'px';
  };

  /*@3.NOEJ.602*/
  Editor.prototype.floatsImg = function () {
    return !!(this.root && this.root.closest && this.root.closest('.gpi-fed') &&
              window.HTMLElement && HTMLElement.prototype.showPopover);
  };
  Editor.prototype.floatImgPanel = function (node, pan, fig) {
    if (!imgPanOpen(pan)) { try { pan.showPopover(); } catch (eS) { return false; } }
    pan.classList.add('ne-img-edit--float');
    pan.style.insetInlineStart = ''; pan.style.right = '';
    var vw = window.innerWidth || 800, vh = window.innerHeight || 600;
    var pad = 8, gap = 10;
    pan.style.maxBlockSize = Math.max(160, vh - pad * 2) + 'px';
    var pw = pan.offsetWidth || 280, ph = pan.offsetHeight || 200;
    var id = node.getAttribute('data-bid');
    var mem = this._imgFloat && this._imgFloat[id];
    var x, y;
    if (mem) { x = mem.x; y = mem.y; }
    else {
      var fr = fig.getBoundingClientRect();
      var rtl = this.isRtl();
      var aft = rtl ? fr.left - gap - pw : fr.right + gap;
      var bef = rtl ? fr.right + gap : fr.left - gap - pw;
      var fits = function (v) { return v >= pad && v + pw <= vw - pad; };
      y = fr.top;
      if (fits(aft)) x = aft;
      else if (fits(bef)) x = bef;
      else {
        x = fr.left + fr.width / 2 - pw / 2;
        y = (fr.bottom + gap + ph <= vh - pad) ? fr.bottom + gap
          : (fr.top - gap - ph >= pad ? fr.top - gap - ph : (fr.bottom < vh / 2 ? vh - pad - ph : pad));
      }
    }
    x = Math.max(pad, Math.min(vw - pad - pw, x));
    y = Math.max(pad, Math.min(vh - pad - ph, y));
    pan.style.left = Math.round(x) + 'px'; pan.style.top = Math.round(y) + 'px';
    return true;
  };

  Editor.prototype.closeImgPanels = function (keep) {
    if (!this.root) return;
    var list = this.root.querySelectorAll('.ne-img-edit');
    for (var i = 0; i < list.length; i++) {
      var pan = list[i];
      if (pan.hidden) continue;
      if (keep && keep.contains(pan)) continue;
      var blkP = pan.closest('[data-bid]');
      imgPanShut(pan);
      if (!this._imgOpen) this._imgOpen = {};
      if (blkP) { this._imgOpen[blkP.getAttribute('data-bid')] = 0; blkP.removeAttribute('data-imged'); }
    }
  };

  Editor.prototype.closeMenu = function () {
    var m = this.menu;
    this.menu = null;
    this.menuFor = null;
    if (!m) return;
    if (m.classList.contains('gsf-menu') && window.GardenMenu && GardenMenu.isOpen()) GardenMenu.close();
    if (m.isConnected) m.remove();
  };


  /*@3.NOEJ.13*/
  /*@3.NOEJ.85*/
  Editor.prototype.indentItem = function (node, b, li, dir) {
    var lis = [].slice.call(node.querySelectorAll('.ne-li'));
    var k = lis.indexOf(li);
    if (k < 0) return false;
    var before = this.snapshot();
    this.readBlock(node);
    var cur = b.items[k].lv || 0;
    var prev = k > 0 ? (b.items[k - 1].lv || 0) : -1;
    /*@3.NOEJ.86*/
    var want = Math.max(0, Math.min(5, cur + dir));
    if (dir > 0 && want > prev + 1) return false;
    if (want === cur) return false;
    var drop = cur - want;
    b.items[k].lv = want;
    if (!want) delete b.items[k].lv;
    for (var j = k + 1; j < b.items.length; j++) {
      var lv = b.items[j].lv || 0;
      if (lv <= cur) break;
      var nl = Math.max(0, Math.min(5, lv - drop));
      if (nl) b.items[j].lv = nl; else delete b.items[j].lv;
    }
    var pos = offsetIn(li, window.getSelection().anchorNode || li,
                       window.getSelection().anchorOffset || 0);
    this.pushUndo(before);
    this.renderOne(b.id);
    var fresh = this.root.querySelector('[data-bid="' + b.id + '"]');
    var back = fresh ? fresh.querySelectorAll('.ne-li')[k] : null;
    if (back) { back.focus(); selectRange(back, pos, pos); }
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.splitListItem = function (node, li, b) {
    var lis = [].slice.call(node.querySelectorAll('.ne-li'));
    var k = lis.indexOf(li);
    if (k < 0) return;
    var before = this.snapshot();
    this.readBlock(node);
    var bounds = this.selBounds(li) || [runsLen(b.items[k].rt), runsLen(b.items[k].rt)];
    var at = Math.min(bounds[0], bounds[1]);
    var parts = sliceRuns(b.items[k].rt || [], 0, at);
    b.items[k].rt = joinRuns([parts[0], parts[1]]);
    /*@3.NOEJ.87*/
    var nit = { rt: joinRuns([parts[2]]) };
    if (b.items[k].lv) nit.lv = b.items[k].lv;
    b.items.splice(k + 1, 0, nit);
    this.pushUndo(before);
    this.renderOne(b.id);
    var fresh = this.root.querySelector('[data-bid="' + b.id + '"]');
    var next = fresh ? fresh.querySelectorAll('.ne-li')[k + 1] : null;
    if (next) { next.focus(); selectRange(next, 0, 0); }
    this.touch();
    this.emitState();
  };

  Editor.prototype.exitList = function (node, b) {
    var before = this.snapshot();
    this.readBlock(node);
    b.items = (b.items || []).filter(function (x) { return B().runsToText(x.rt).trim(); });
    if (!b.items.length) b.items = [{ rt: [] }];
    var np = B().blank('p');
    this.insertAfter(b.id, np);
    this.pushUndo(before);
    this.renderOne(b.id);
    var npAt = this.blockAt(np.id);
    if (npAt) this.renderInsert(npAt.i, [np]); else this.render();
    this.focusBlock(np.id);
    this.touch();
    this.emitState();
  };


  /*@3.NOEJ.267*/
  var BIN_KEY = {
    deleteContentBackward: 'Backspace',
    deleteContentForward: 'Delete',
    insertParagraph: 'Enter'
  };

  function keyOf(e) {
    var I = window.GardenInkInput;
    return (I && I.keyOf) ? I.keyOf(e) : String(e.key || '').toLowerCase();
  }

  Editor.prototype.bind = function () {
    var self = this;
    var root = this.root;

    /*@3.NOEJ.317*/
    this.lpDrop = function () {
      if (self._lpT) { clearTimeout(self._lpT); self._lpT = 0; }
      self._lpAt = null;
    };
    this.ctxOn = function (el, gate) {
      var subs = [], on = function (ty, fn, cap) { el.addEventListener(ty, fn, cap); subs.push([ty, fn, cap]); };
      var away = function (e) { return gate && (self.root.contains(e.target) || !gate()); };
      on('contextmenu', function (e) {
        if (self.readOnly) return;
        /*@3.NOEJ.619*/
        if (self._selMode && !self.selectedBlocks().length) return;
        if (away(e)) return;
        self._ctxAt = Date.now();
        self.lpDrop();
        if (self.openCtx(gate ? self.root : e.target, e.clientX, e.clientY,
                         gate ? { x: e.clientX, y: e.clientY } : null)) e.preventDefault();
      });
      on('pointerdown', function (e) {
        if (away(e)) return;
        self.lpDrop();
        if (e.pointerType === 'mouse' || (self._selMode && !self.selectedBlocks().length) || self.readOnly) return;
        if (e.isPrimary === false) return;
        var tgt = gate ? self.root : e.target, sx = e.clientX, sy = e.clientY;
        self._lpAt = { x: sx, y: sy };
        self._lpT = setTimeout(function () {
          self._lpT = 0;
          if (!self._lpAt) return;
          if (self._ctxAt && Date.now() - self._ctxAt < 1200) return;
          if (self._drag || self._bdrag || self._wdrag || self._rdrag) return;
          if (self.openCtx(tgt, sx, sy, gate ? { x: sx, y: sy } : null)) {
            self._eatClick = 1;
            try { window.getSelection().removeAllRanges(); } catch (eS) {}
          }
        }, 520);
      }, true);
      ['pointermove', 'pointercancel'].forEach(function (ty) {
        on(ty, function (e) {
          if (!self._lpAt) return;
          if (ty === 'pointercancel') { self.lpDrop(); return; }
          if (Math.hypot(e.clientX - self._lpAt.x, e.clientY - self._lpAt.y) > 10) self.lpDrop();
        }, true);
      });
      on('pointerup', function () { self.lpDrop(); }, true);
      return function () { subs.forEach(function (x) { el.removeEventListener(x[0], x[1], x[2]); }); subs = []; };
    };
    this.ctxOn(root, null);

    root.addEventListener('pointerdown', function (e) {
      /*@3.NOEJ.139*/
      self._pdAt = { x: e.clientX, y: e.clientY };
      self._imgDragged = false;
      var node = e.target.closest ? e.target.closest('[data-bid]') : null;
      if (node) self.focusBid = node.getAttribute('data-bid');
      var t = e.target;
      if (t.classList && (t.classList.contains('ne-text') || t.classList.contains('ne-li') ||
                          t.classList.contains('ne-cell'))) self.focusEd = t;
    }, true);

    /*@3.NOEJ.160*/
    this._bdrag = null;
    this._onBdragMove = function (e) {
      var st = self._bdrag;
      if (!st) return;
      if (!(e.buttons & 1)) { self.endBlockDrag(); return; }
      var hitEl = document.elementFromPoint(e.clientX, e.clientY);
      var node = (hitEl && hitEl.closest) ? hitEl.closest('[data-bid]') : null;
      if (!node || !root.contains(node)) return;
      var id = node.getAttribute('data-bid');
      if (!st.on) {
        if (id === st.id) return;
        if (Math.abs(e.clientY - st.y) < 6 && Math.abs(e.clientX - st.x) < 6) return;
        st.on = true;
        self._cdrag = null;
        self.cselClear();
        root.setAttribute('data-bdrag', '1');
        var ae = document.activeElement;
        if (ae && ae.blur && root.contains(ae)) { try { ae.blur(); } catch (eB) {} }
      }
      try { window.getSelection().removeAllRanges(); } catch (eS) {}
      if (id !== st.at) { st.at = id; self.selectRangeBetween(st.id, id); }
    };
    this._onBdragStop = function () { self.endBlockDrag(); };
    document.addEventListener('pointermove', this._onBdragMove);
    document.addEventListener('pointerup', this._onBdragStop);
    document.addEventListener('pointercancel', this._onBdragStop);

    /*@3.NOEJ.554*/
    this._cdrag = null;
    root.addEventListener('mousedown', function (e) { if (self.cselKind(e)) e.preventDefault(); });
    root.addEventListener('pointerdown', function (e) {
      self._cdrag = null;
      if (e.button !== 0 || self._selMode || self.cselKind(e)) return;
      var inB = e.target.closest ? e.target.closest('[data-bid]') : null;
      if (!inB && e.target !== root) return;
      if (e.target.closest('.ne-tbl-bar')) return;
      self.cselClear();
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.pointerType === 'touch' || self.readOnly) return;
      var td = e.target.closest('.ne-cell[contenteditable="true"]');
      var rc = td ? cellRC(inB, td) : null;
      if (rc) self._cdrag = { bid: inB.getAttribute('data-bid'), node: inB, a: rc, at: rc.join(','), lk: '', on: false };
    });
    this._onCdragMove = function (e) {
      var st = self._cdrag;
      if (!st) return;
      if (!(e.buttons & 1) || !st.node.isConnected) { self._cdrag = null; return; }
      var hitEl = document.elementFromPoint(e.clientX, e.clientY);
      var td = hitEl && hitEl.closest ? hitEl.closest('.ne-cell') : null;
      if (!td || td.closest('[data-bid]') !== st.node) return;
      var rc = cellRC(st.node, td);
      if (!rc) return;
      var key = rc.join(',');
      if (!st.on && key === st.at) return;
      if (!st.on) { st.on = true; self._csel = { bid: st.bid, a: st.a, k: {} }; }
      try { window.getSelection().removeAllRanges(); } catch (eS) {}
      e.preventDefault();
      if (key === st.lk) return;
      st.lk = key;
      self.cselRect(st.a, rc);
      self.cselPaint();
      self.emitState();
    };
    this._onCdragStop = function () { self._cdrag = null; };
    document.addEventListener('pointermove', this._onCdragMove);
    document.addEventListener('pointerup', this._onCdragStop);
    document.addEventListener('pointercancel', this._onCdragStop);
    root.addEventListener('keydown', function (e) {
      if (!self._csel || e.ctrlKey || e.metaKey || /^(Shift|Control|Alt|Meta)$/.test(e.key)) return;
      if (e.key === 'Escape') e.preventDefault();
      self.cselClear();
    }, true);

    root.addEventListener('pointerdown', function (e) {
      self.endBlockDrag();
      if (self._selMode || e.button !== 0 || e.pointerType === 'touch') return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      var ce = e.target.closest ? e.target.closest('[contenteditable="true"]') : null;
      if (!ce) return;
      var bn = ce.closest('[data-bid]');
      if (!bn) return;
      self._bdrag = { id: bn.getAttribute('data-bid'), at: null,
                      x: e.clientX, y: e.clientY, on: false };
    });

    /*@3.NOEJ.177*/
    root.addEventListener('focusout', function () {
      clearTimeout(self._blurT);
      self._blurT = setTimeout(function () { self.emitState(); }, 0);
    });

    root.addEventListener('focusout', function (e) {
      if (!e.target.classList) return;
      var node = e.target.closest('[data-bid]');
      if (!node) return;

      if (e.target.classList.contains('ne-code')) {
        self.readBlock(node);
        var hit = self.blockAt(node.getAttribute('data-bid'));
        if (hit && self._mmdFresh === hit.b.id && isDiagram(hit.b)) {
          self._mmdFresh = null;
          hit.b.dgm = 1;
          self.renderOne(hit.b.id);
          self.touch();
          return;
        }
        if (hit) { paintCode(e.target, hit.b, self.root); if (self._pv) self.pvDress(node, true); }
        return;
      }

      if (e.target.classList.contains('ne-tex')) {
        self.readBlock(node);
        var mx = e.target.parentNode;
        var mout = mx.querySelector('.ne-math-out');
        var has = !!String(e.target.value || '').trim();
        if (mout) {
          renderMath(mout, e.target.value);
          mout.hidden = !has;
        }
        e.target.hidden = has;
      }
    });

    root.addEventListener('focusin', function (e) {
      if (e.target.classList && e.target.classList.contains('ne-code')) {
        var n2 = e.target.closest('[data-bid]');
        var h2 = n2 ? self.blockAt(n2.getAttribute('data-bid')) : null;
        /*@3.NOEJ.531*/
        if (h2) { e.target.removeAttribute('data-painted'); e.target.textContent = h2.b.src || ''; if (self._pv) self.pvDress(n2, true); }
      }
      var t = e.target;
      if (t.classList && (t.classList.contains('ne-text') || t.classList.contains('ne-li') ||
                          t.classList.contains('ne-cell'))) {
        self.focusEd = t;
      }
      var node = t.closest ? t.closest('[data-bid]') : null;
      if (node) self.focusBid = node.getAttribute('data-bid');
      self.emitState();
    });

    /*@3.NOEJ.141*/
    this._onSelChange = function () {
      var edn = self.currentEditable();
      if (!edn) return;
      var s = window.getSelection();
      if (!s || !s.rangeCount) return;
      var r = s.getRangeAt(0);
      if (!edn.contains(r.startContainer)) return;
      self.lastSel = { ed: edn,
        a: offsetIn(edn, r.startContainer, r.startOffset),
        b: offsetIn(edn, r.endContainer, r.endOffset) };
      self.emitState();
    };
    document.addEventListener('selectionchange', this._onSelChange);
    this.wireDgmPan(root);

    /*@3.NOEJ.259*/
    root.addEventListener('beforeinput', function (e) {
      var bn = e.target.closest ? e.target.closest('[data-bid]') : null;
      if (bn) self.typeGroup(bn.getAttribute('data-bid'));
      var key = BIN_KEY[e.inputType];
      if (!key || self._binGo) return;
      var t = e.target;
      if (!t || !t.isContentEditable) return;
      if (!(t.classList.contains('ne-text') || t.classList.contains('ne-li'))) return;
      self._binGo = 1;
      var took = false;
      try {
        took = !t.dispatchEvent(new KeyboardEvent('keydown', {
          key: key, code: key, bubbles: true, cancelable: true
        }));
      } catch (eB) { took = false; }
      self._binGo = 0;
      if (took) e.preventDefault();
    });

    /*@3.NOEJ.569*/
    root.addEventListener('copy', function (e) {
      var sel = window.getSelection();
      if (!e.clipboardData || !sel || !sel.rangeCount || sel.isCollapsed) return;
      var rg = sel.getRangeAt(0), frag;
      try { frag = rg.cloneContents(); } catch (eC) { return; }
      var box = document.createElement('div');
      box.appendChild(frag);
      var ims = box.querySelectorAll('.ne-im[data-tex]');
      if (!ims.length) return;
      for (var i = 0; i < ims.length; i++) ims[i].textContent = '$' + ims[i].getAttribute('data-tex') + '$';
      box.style.cssText = 'position:fixed;inset-inline-start:-9999px;inset-block-start:0;white-space:pre-wrap;';
      document.body.appendChild(box);
      var txt = box.innerText;
      document.body.removeChild(box);
      box.removeAttribute('style');
      e.clipboardData.setData('text/plain', txt);
      e.clipboardData.setData('text/html', box.innerHTML);
      e.preventDefault();
    });
    /*@3.NOEJ.273*/
    root.addEventListener('input', function () { self.caretSeen(); });
    var dirtyOn = function (e) {
      var nb = e.target && e.target.closest ? e.target.closest('[data-bid]') : null;
      if (nb) { nb.__dirty = 1; nb.__tfitW = -1; }
    };
    root.addEventListener('pointerdown', dirtyOn, true);
    root.addEventListener('keydown', dirtyOn, true);
    root.addEventListener('paste', dirtyOn, true);
    root.addEventListener('cut', dirtyOn, true);
    root.addEventListener('drop', dirtyOn, true);
    root.addEventListener('input', dirtyOn, true);
    root.addEventListener('change', dirtyOn, true);
    root.addEventListener('focusin', function (e) {
      var trH = e.target && e.target.closest ? e.target.closest('tr[data-hollow]') : null;
      if (!trH) return;
      var wrapH = trH.closest('[data-bid]');
      if (wrapH && wrapH.__tblRow) { wrapH.__tblRow(trH); var c0 = trH.querySelector('.ne-cell'); if (c0) { try { c0.focus(); } catch (eF) {} } }
    }, true);

    root.addEventListener('keydown', function (e) {
      if (!self._pv || (e.key !== 'Backspace' && e.key !== 'Delete')) return;
      var s = window.getSelection();
      if (!s || !s.rangeCount) return;
      var r = s.getRangeAt(0), n = r.startContainer, o = r.startOffset, adj = null, back = e.key === 'Backspace';
      if (!r.collapsed) adj = r.cloneContents().querySelector('.ne-pg');
      else if (n.nodeType === 3) adj = back ? (o === 0 ? n.previousSibling : null) : (o >= n.nodeValue.length ? n.nextSibling : null);
      else adj = back ? (n.childNodes[o - 1] || null) : (n.childNodes[o] || null);
      if (!adj || !adj.classList || !adj.classList.contains('ne-pg')) return;
      var bn = (n.nodeType === 3 ? n.parentNode : n).closest('[data-bid]');
      if (bn) { self.pvStrip(bn); bn.__pgD = 1; }
    }, true);
    root.addEventListener('input', function (e) {
      var node = e.target.closest('[data-bid]');
      if (node && self._pv) node.__pgD = 1;
      if (node) { node.__dirty = 1; node.__tfitW = -1; self.readBlockAt(node, e.target); self.commitProv(node.getAttribute('data-bid')); }
      /*@3.NOEJ.125*/
      var liI = e.target.closest ? e.target.closest('.ne-li') : null;
      if (liI) {
        if (liI.textContent === '') liI.setAttribute('data-blank', '1');
        else liI.removeAttribute('data-blank');
      }
      if (e.target.classList.contains('ne-tex')) {
        var out = node.querySelector('.ne-math-out');
        if (out) renderMath(out, e.target.value);
      }
      if (e.target.classList.contains('ne-img-url')) {
        var vw = node.querySelector('.ne-img-view');
        if (vw) paintImg(vw, e.target.value, '');
      }
      if (e.target.classList.contains('ne-img-alt')) {
        var hitA = self.blockAt(node.getAttribute('data-bid'));
        var capA = node.querySelector('.ne-cap');
        if (capA && hitA) {
          capA.textContent = e.target.value || '';
          capA.hidden = !(hitA.b.cap && e.target.value);
        }
      }
      var slk = e.target.getAttribute && e.target.getAttribute('data-imgk');
      if (slk) {
        var hitS = self.blockAt(node.getAttribute('data-bid'));
        if (hitS) {
          hitS.b[slk] = parseInt(e.target.value, 10);
          applyImgStyle(node.querySelector('.ne-fig'), hitS.b);
        }
      }
      if (e.target.classList.contains('ne-lang')) {
        /*@3.NOEJ.347*/
        var hitL = self.blockAt(node.getAttribute('data-bid'));
        var preL = node.querySelector('.ne-code');
        if (hitL) {
          var wasD = !!node.querySelector('.ne-dgm');
          hitL.b.lang = e.target.value || '';
          if (isDiagram(hitL.b) !== wasD) {
            var caret = e.target.selectionStart;
            if (preL) hitL.b.src = preL.textContent || '';
            self.renderOne(hitL.b.id);
            var back = self.root.querySelector(
              ':scope > [data-bid="' + hitL.b.id + '"] .ne-lang');
            if (back) {
              back.focus();
              try { back.setSelectionRange(caret, caret); } catch (eR) {}
            }
            self.softTouch();
            return;
          }
          if (preL && document.activeElement !== preL) paintCode(preL, hitL.b, self.root);
        }
      }
      self.softTouch();
    });

    /*@3.NOEJ.201*/
    root.addEventListener('pointerover', function (e) {
      /*@3.NOEJ.309*/
      if ((e.pointerType && e.pointerType !== 'mouse') || self.coarse()) return;
      if (self._drag || self._bdrag || self._wdrag || self._rdrag) return;
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('.ne-rail') || t.closest('.ne-rgrip') || t.closest('.ne-wgrip')) return;
      var nb = t.closest(':scope > [data-bid]');
      if (!nb) {
        nb = t.closest('[data-bid]');
        while (nb && nb.parentNode !== root) nb = nb.parentNode.closest ? nb.parentNode.closest('[data-bid]') : null;
      }
      /*@3.NOEJ.390*/
      /*@3.NOEJ.419*/
      var anySel = self._selMode || self.selectedBlocks().length > 0;
      if (nb && self._actId && !anySel && nb.getAttribute('data-bid') !== self._actId) return;
      if (nb && nb.parentNode === root) self.chromeTo(nb);
    });

    root.addEventListener('pointerleave', function (e) {
      /*@3.NOEJ.310*/
      if ((e && e.pointerType && e.pointerType !== 'mouse') || self.coarse()) return;
      if (self._drag || self._bdrag || self._wdrag || self._rdrag) return;
      var shbL = self._chrome && self._chrome.shbar;
      if (shbL && e && e.relatedTarget && shbL.contains(e.relatedTarget)) return;
      self.armChromeHide();
    });
    root.addEventListener('pointerenter', function () {
      if (self._chromeT) { clearTimeout(self._chromeT); self._chromeT = 0; }
    });

    /*@3.NOEJ.48*/
    root.addEventListener('click', function (e) {
      if (self._eatClick) { self._eatClick = 0; e.preventDefault(); e.stopPropagation(); return; }
      /*@3.NOEJ.140*/
      if (self._pdAt && e.detail > 0 &&
          Math.hypot(e.clientX - self._pdAt.x, e.clientY - self._pdAt.y) > 8) {
        return;
      }
      var lnk = e.target.closest ? e.target.closest('a[href]') : null;
      /*@3.NOEJ.172*/
      if (lnk && lnk.hasAttribute('data-nl') && !self._selMode && !e.shiftKey) {
        e.preventDefault();
        self.followLink(lnk.getAttribute('data-nl'));
        return;
      }
      if (lnk && !self._selMode && !e.shiftKey) {
        var hrefC = B().normUrl(lnk.getAttribute('href'));
        if (hrefC) {
          e.preventDefault();
          window.open(hrefC, '_blank', 'noopener');
          return;
        }
      }
      if (e.target.closest('.ne-tail')) {
        self.addBlock('p', self.lastBlockId());
        return;
      }
      if (e.target === root) {
        /*@3.NOEJ.315*/
        self.dropProv();
        self.hintCtx();
        return;
      }
      /*@3.NOEJ.128*/
      var frame = e.target.closest('[data-bid][data-fp]');
      if (frame && e.target === frame && !self._selMode) {
        e.preventDefault();
        self.toggleBlockSel(frame.getAttribute('data-bid'), true);
        try { window.getSelection().removeAllRanges(); } catch (eF) {}
        return;
      }
      var node = e.target.closest('[data-bid]');
      if (!node && e.target.closest('.ne-shp-bar--float')) {
        var forId = e.target.closest('.ne-shp-bar--float').getAttribute('data-for');
        node = forId ? root.querySelector(':scope > [data-bid="' + forId + '"]') : null;
      }
      if (!node) return;
      var id = node.getAttribute('data-bid');
      self.focusBid = id;

      /*@3.NOEJ.165*/
      if (e.target.closest('.ne-tick')) {
        e.preventDefault();
        if (!self._selMode) self.setSelectMode(true, 1);
        self.toggleBlockSel(id);
        self._bselLast = id;
        try { window.getSelection().removeAllRanges(); } catch (eT) {}
        return;
      }

      var ck = self.cselKind(e);
      if (ck) { e.preventDefault(); self.cselClick(e, ck); return; }
      /*@3.NOEJ.36*/
      if (self._selMode || e.ctrlKey || e.metaKey || e.shiftKey) {
        if (e.target.closest('.ne-plus')) { self.openMenu(id, e.target.closest('.ne-plus'), 'insert'); return; }
        /*@3.NOEJ.413*/
        if (e.target.closest('.ne-grip')) { e.preventDefault(); self.openMenu(id, e.target.closest('.ne-grip'), 'block'); return; }
        e.preventDefault();
        if (e.shiftKey && self._bselLast) self.selectBlockRange(id);
        else { self.toggleBlockSel(id, !(self._selMode || e.ctrlKey || e.metaKey)); self._bselLast = id; }
        return;
      }
      var grip = e.target.closest('.ne-grip');
      if (grip) { self.openMenu(id, grip, 'block'); return; }
      var plus = e.target.closest('.ne-plus');
      if (plus) { self.openMenu(id, plus, 'insert'); return; }
      if (self.selectedBlocks().length) self.clearBlockSel();

      var cb = e.target.closest('.ne-check');
      if (cb) {
        var on = cb.getAttribute('aria-checked') === 'true';
        cb.setAttribute('aria-checked', on ? 'false' : 'true');
        self.readBlock(node);
        self.touch();
        return;
      }

      var chb = e.target.closest('[data-calh]');
      if (chb) {
        var hb = self.blockAt(id);
        var cur = CAL_ORDER.indexOf(calKind(hb ? hb.b : null));
        self.setCallout(id, CAL_ORDER[(cur + 1) % CAL_ORDER.length]);
        return;
      }

      var tb = e.target.closest('[data-tbl]');
      if (tb) { self.tableOp(id, tb.getAttribute('data-tbl')); return; }

      var mo = e.target.closest('.ne-math-out');
      if (mo) {
        var mx = mo.parentNode;
        var mta = mx.querySelector('.ne-tex');
        if (mta) { mta.hidden = false; mo.hidden = true; mta.focus(); }
        return;
      }

      var inD = e.target.closest ? e.target.closest('.ne-dgm') : null;
      var lbl = inD && e.target.closest ? e.target.closest('text, .nodeLabel, .edgeLabel') : null;
      if (inD && lbl) { self.editDiagramLabel(id, lbl); return; }

      /*@3.NOEJ.475*/
      var dgz = e.target.closest('[data-dgz]');
      if (dgz) {
        e.preventDefault();
        var hz = node.querySelector('.ne-dgm');
        if (hz) self.dgmZoom(hz, dgz.getAttribute('data-dgz'));
        return;
      }
      var dgf = e.target.closest('[data-dgmfs]');
      if (dgf) {
        e.preventDefault();
        /*@3.NOEJ.404*/
        var dh = node.querySelector('.ne-dgm');
        var svL = dh ? dh.querySelector('svg') : null;
        if (!svL) return;
        var dlgD = document.createElement('dialog');
        dlgD.className = 'gsf ne-dgm-dlg';
        dlgD.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
        dlgD.setAttribute('data-full', '0');
        var fullL = function (on) {
          return '<i class="fa-solid ' + (on ? 'fa-compress' : 'fa-expand') + '" aria-hidden="true"></i> ' +
            B().esc(on ? L('عودة', 'Back') : L('ملءُ الشاشة', 'Full screen'));
        };
        dlgD.innerHTML = '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' +
          B().esc(L('إغلاق', 'Close')) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
          '<div class="gsf-body ne-dgm-dlg-body"><div class="ne-dgm ne-dgm--dlg" data-state="ok" dir="ltr"></div></div>' +
          '<div class="gsf-foot gsf-acts ne-dgm-dlg-acts">' +
          '<button type="button" class="gsf-btn gsf-btn--ghost" data-dgmz="-" aria-label="' + B().esc(L('تصغير', 'Zoom out')) + '">' +
          '<i class="fa-solid fa-magnifying-glass-minus" aria-hidden="true"></i></button>' +
          '<button type="button" class="gsf-btn gsf-btn--ghost" data-dgmz="+" aria-label="' + B().esc(L('تكبير', 'Zoom in')) + '">' +
          '<i class="fa-solid fa-magnifying-glass-plus" aria-hidden="true"></i></button>' +
          '<button type="button" class="gsf-btn gsf-btn--ghost" data-dgmz="fit" aria-label="' + B().esc(L('ملاءمةُ المخطّطِ للنافذة', 'Fit the diagram to the window')) + '">' +
          '<i class="fa-solid fa-down-left-and-up-right-to-center" aria-hidden="true"></i></button>' +
          '<button type="button" class="gsf-btn" data-dgmfull="1">' + fullL(false) + '</button>' +
          '<form method="dialog"><button class="gsf-btn gsf-btn--ghost" type="submit">' + B().esc(L('إغلاق', 'Close')) + '</button></form>' +
          '</div>';
        var hostD = dlgD.querySelector('.ne-dgm--dlg');
        var baked = null;
        try {
          var Mm = window.GardenNotesMermaid;
          var rrD = svL.getBoundingClientRect(), zD0 = self.zoomOf() || 1;
          baked = (Mm && Mm.bake) ? Mm.bake(svL, rrD.width / zD0, rrD.height / zD0,
                                           (Mm.isDark && Mm.isDark()) ? 'dark' : 'light') : null;
        } catch (eB) { baked = null; }
        hostD.innerHTML = baked ? baked.svg : dh.innerHTML;
        var svD = hostD.querySelector('svg');
        var ratD = (baked && baked.w > 0 && baked.h > 0) ? (baked.h / baked.w) : 0;
        if (svD) { svD.removeAttribute('width'); svD.removeAttribute('height'); svD.setAttribute('data-nmd', '1'); }
        var zD = 1;
        /*@3.NOEJ.411*/
        var bodyD = dlgD.querySelector('.ne-dgm-dlg-body');
        var applyZ = function () { hostD.style.setProperty('--dgm-z', String(Math.round(zD * 100) / 100)); };
        var natW = (baked && baked.w > 0) ? baked.w : 800;
        hostD.style.setProperty('--dgm-w', Math.round(natW) + 'px');
        var fitD = function () {
          var bw = bodyD.clientWidth - 32, bh = bodyD.clientHeight - 32;
          if (!(bw > 40) || !(bh > 40)) { zD = 1; applyZ(); return; }
          var zW = bw / natW;
          var zH = ratD > 0 ? (bh / (natW * ratD)) : zW;
          zD = Math.max(0.05, Math.min(4, Math.min(zW, zH)));
          applyZ();
        };
        document.body.appendChild(dlgD);
        dlgD.addEventListener('close', function () { dlgD.remove(); });
        dlgD.addEventListener('click', function (ev) {
          var zb = ev.target.closest('[data-dgmz]');
          if (zb) {
            var zk = zb.getAttribute('data-dgmz');
            if (zk === 'fit') { fitD(); return; }
            zD = Math.max(0.05, Math.min(8, zD * (zk === '+' ? 1.25 : 0.8)));
            applyZ();
            return;
          }
          var fb = ev.target.closest('[data-dgmfull]');
          if (fb) {
            var onF = dlgD.getAttribute('data-full') !== '1';
            dlgD.setAttribute('data-full', onF ? '1' : '0');
            fb.innerHTML = fullL(onF);
          }
        });
        try { dlgD.showModal(); } catch (eM) { dlgD.setAttribute('open', ''); }
        fitD();
        dlgD.addEventListener('click', function (evF) {
          if (evF.target.closest('[data-dgmfull]')) setTimeout(fitD, 60);
        });
        return;
      }
      var dgb = e.target.closest('[data-dgm]');
      if (dgb) {
        var hitD = self.blockAt(id);
        if (!hitD) return;
        /*@3.NOEJ.236*/
        var wasOn = (hitD.b.dgm == null) ? 1 : (hitD.b.dgm ? 1 : 0);
        hitD.b.dgm = wasOn ? 0 : 1;
        self.renderOne(id);
        if (!hitD.b.dgm) {
          var preT = self.root.querySelector('[data-bid="' + id + '"] .ne-code');
          if (preT) { try { preT.focus({ preventScroll: true }); } catch (eT) { preT.focus(); } }
        }
        self.touch();
        return;
      }

      var isrc = e.target.closest('[data-imgsrc]');
      if (isrc) { if (!self.readOnly) self.imgFrom(id, isrc.getAttribute('data-imgsrc')); return; }
      if (e.target.closest('[data-imglnk]')) { if (!self.readOnly) self.imgLinkGo(node, id); return; }
      if (e.target.closest('[data-imgedit]')) { if (!self.readOnly) self.imgEdit(id); return; }
      if (e.target.closest('[data-imgorig]')) { if (!self.readOnly) self.imgOrig(id); return; }
      var pickZ = e.target.closest('.ne-img-pick');
      if (pickZ && !e.target.closest('[data-imguns]')) return;
      var imf = pickZ ? null : e.target.closest('.ne-fig');
      if (imf && imf.getAttribute('data-sh') === 'circle' && self._imgDragged) {
        self._imgDragged = false;
        return;
      }
      if (imf && !e.target.closest('.ne-cap')) {
        var pan = node.querySelector('.ne-img-edit');
        if (pan) {
          if (pan.hidden) pan.hidden = false; else imgPanShut(pan);
          if (!self._imgOpen) self._imgOpen = {};
          self._imgOpen[id] = pan.hidden ? 0 : 1;
          if (pan.hidden) node.removeAttribute('data-imged'); else node.setAttribute('data-imged', '1');
          if (!pan.hidden) self.placeImgPanel(node);
        }
        return;
      }
      var iun = e.target.closest('[data-imguns]');
      if (iun) {
        if (!window.GardenUnsplash) return;
        GardenUnsplash.open(function (p) {
          var hitU = self.blockAt(id);
          if (!hitU || !p || !p.url) return;
          var beforeU = self.snapshot();
          hitU.b.url = B().httpsOnly(p.url);
          if (!hitU.b.alt) hitU.b.alt = p.alt || '';
          hitU.b.by = p.by || '';
          hitU.b.byLink = p.byLink || '';
          self.pushUndo(beforeU);
          self.render();
          self.touch();
          self.emitState();
        });
        return;
      }
      /*@3.NOEJ.369*/
      var stk = e.target.closest('[data-stk]');
      if (stk) {
        var hitK = self.blockAt(id);
        if (!hitK || hitK.b.ty !== 'sticky') return;
        var beforeK = self.snapshot();
        var vK = stk.getAttribute('data-stk');
        if (vK === 'rot-' || vK === 'rot+') {
          var r0 = (hitK.b.rot || 0) + (vK === 'rot+' ? 3 : -3);
          hitK.b.rot = Math.max(-12, Math.min(12, r0));
          node.style.setProperty('--ne-stk-rot', hitK.b.rot + 'deg');
        } else {
          hitK.b.tone = vK;
          node.setAttribute('data-tone', vK);
          [].forEach.call(node.querySelectorAll('[data-stk]'), function (x) {
            var kk = x.getAttribute('data-stk');
            if (kk === 'rot-' || kk === 'rot+') return;
            x.setAttribute('aria-pressed', kk === vK ? 'true' : 'false');
          });
        }
        self.pushUndo(beforeK);
        self.touch();
        return;
      }
      var shb = e.target.closest('[data-shp]');
      if (shb) { self.shapeAct(node, id, shb); return; }
      var imx = e.target.closest('[data-imgx]');
      if (imx) {
        var panX = imx.closest('.ne-img-edit');
        if (panX) imgPanShut(panX);
        node.removeAttribute('data-imged');
        if (!self._imgOpen) self._imgOpen = {};
        self._imgOpen[id] = 0;
        return;
      }
      var imcd = e.target.closest('[data-imgcard]');
      if (imcd) {
        var panC = imcd.closest('.ne-img-edit');
        var cardC = imcd.closest('.ne-img-card');
        var wasOpen = cardC && cardC.getAttribute('data-open') === '1';
        if (panC) {
          [].forEach.call(panC.querySelectorAll('.ne-img-card'), function (cq) {
            var on = (cq === cardC) && !wasOpen;
            cq.setAttribute('data-open', on ? '1' : '0');
            var hq = cq.querySelector('[data-imgcard]');
            if (hq) hq.setAttribute('aria-expanded', on ? 'true' : 'false');
          });
        }
        self.placeImgPanel(node);
        return;
      }
      var imc = e.target.closest('[data-imgc]');
      if (imc) {
        var hitC = self.blockAt(id);
        if (!hitC) return;
        self.pushUndo(self.snapshot());
        hitC.b.cap = hitC.b.cap ? 0 : 1;
        imc.setAttribute('aria-pressed', hitC.b.cap ? 'true' : 'false');
        imc.innerHTML = '<i class="fa-solid fa-' + (hitC.b.cap ? 'eye' : 'eye-slash') +
          '" aria-hidden="true"></i>';
        var capC = node.querySelector('.ne-cap');
        if (capC) capC.hidden = !(hitC.b.cap && capC.textContent);
        self.touch();
        return;
      }
      /*@3.NOEJ.360*/
      var imq = e.target.closest('[data-imgq]');
      if (imq) {
        var hitQ = self.blockAt(id);
        if (!hitQ) return;
        var beforeQ = self.snapshot();
        var nowQ = hitQ.b.iw == null ? 100 : hitQ.b.iw;
        var vQ = imq.getAttribute('data-imgq');
        var nextQ = (vQ === '-') ? nowQ - 10 : (vQ === '+') ? nowQ + 10 : Number(vQ);
        hitQ.b.iw = Math.max(10, Math.min(100, Math.round(nextQ)));
        self.pushUndo(beforeQ);
        [].forEach.call(node.querySelectorAll('[data-imgq]'), function (x) {
          var kx = x.getAttribute('data-imgq');
          x.setAttribute('aria-pressed', Number(kx) === hitQ.b.iw ? 'true' : 'false');
        });
        var slQ = node.querySelector('[data-imgk="iw"]');
        if (slQ) slQ.value = String(hitQ.b.iw);
        applyImgStyle(node.querySelector('.ne-fig'), hitQ.b);
        self.touch();
        return;
      }
      var ims = e.target.closest('[data-imgs]');
      /*@3.NOEJ.608*/
      if (ims) {
        var hitS = self.blockAt(id);
        if (!hitS) return;
        if ((hitS.b.sh || 'rect') === ims.getAttribute('data-imgs')) return;
        self.pushUndo(self.snapshot());
        hitS.b.sh = ims.getAttribute('data-imgs');
        [].forEach.call(node.querySelectorAll('[data-imgs]'), function (x) {
          x.setAttribute('aria-pressed', x === ims ? 'true' : 'false');
        });
        applyImgStyle(node.querySelector('.ne-fig'), hitS.b);
        self.touch();
        return;
      }
      var ima = e.target.closest('[data-imga]');
      if (ima) {
        var hitA = self.blockAt(id);
        if (!hitA) return;
        self.pushUndo(self.snapshot());
        hitA.b.al = ima.getAttribute('data-imga');
        [].forEach.call(node.querySelectorAll('[data-imga]'), function (x) {
          x.setAttribute('aria-pressed', x === ima ? 'true' : 'false');
        });
        self.applyStyleAttrs(node, hitA.b);
        self.touch();
        return;
      }
      var imr = e.target.closest('[data-imgr]');
      if (imr) {
        var hitR = self.blockAt(id);
        if (!hitR) return;
        self.pushUndo(self.snapshot());
        hitR.b.iw = 100; hitR.b.br = 100; hitR.b.op = 100;
        delete hitR.b.sh; delete hitR.b.al;
        [].forEach.call(node.querySelectorAll('[data-imgs]'), function (x) {
          x.setAttribute('aria-pressed', x.getAttribute('data-imgs') === 'rect' ? 'true' : 'false');
        });
        [].forEach.call(node.querySelectorAll('[data-imga]'), function (x) {
          x.setAttribute('aria-pressed', x.getAttribute('data-imga') === 'start' ? 'true' : 'false');
        });
        self.applyStyleAttrs(node, hitR.b);
        [].forEach.call(node.querySelectorAll('[data-imgk]'), function (sl) {
          sl.value = String(hitR.b[sl.getAttribute('data-imgk')]);
        });
        applyImgStyle(node.querySelector('.ne-fig'), hitR.b);
        self.touch();
        return;
      }

      var gb = e.target.closest('.ne-gap-b');
      if (gb) {
        var hitG = self.blockAt(id);
        if (!hitG || hitG.b.ty !== 'gap') return;
        var beforeG = self.snapshot();
        var cur = hitG.b.h || 40;
        hitG.b.h = Math.max(12, Math.min(320, cur + (gb.textContent === '+' ? 20 : -20)));
        self.pushUndo(beforeG);
        var gEl = node.querySelector('.ne-gap');
        if (gEl) gEl.style.blockSize = hitG.b.h + 'px';
        self.touch();
        return;
      }
    });

    /*@3.NOEJ.196*/
    root.addEventListener('keydown', function (e) {
      if (!self._mn) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); self.closeMention(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); self.moveMention(1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); self.moveMention(-1); return; }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault(); e.stopPropagation();
        self.pickMentionActive();
        return;
      }
    }, true);

    root.addEventListener('focusout', function () { self.closeMention(); });

    /*@3.NOEJ.37*/
    root.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      var picked = self.selectedBlocks().length;
      if (picked) {
        var k = keyOf(e);
        if (mod && k === 'c') { e.preventDefault(); self.copyBlocks(); return; }
        if (mod && k === 'x') { e.preventDefault(); self.cutBlocks(); return; }
        if (mod && k === 'v') { e.preventDefault(); self.pasteBlocks(); return; }
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); self.deleteBlocks(); return; }
        if (e.key === 'Escape') { e.preventDefault(); self.clearBlockSel(); return; }
      } else if (mod && e.shiftKey && keyOf(e) === 'v') {
        /*@3.NOEJ.340*/
        self._plainNext = true;
        setTimeout(function () { self._plainNext = false; }, 1200);
      } else if (mod && keyOf(e) === 'v' && Editor.clip && Editor.clip.length) {
        var here = e.target.closest('[data-bid]');
        if (here && !e.target.isContentEditable) { e.preventDefault(); self.pasteBlocks(); return; }
      }

      var node = e.target.closest('[data-bid]');
      if (!node) return;
      if (e.key === 'Escape') {
        var pnl = node.querySelector('.ne-img-edit');
        if (pnl && !pnl.hidden) { e.preventDefault(); self.closeImgPanels(null); return; }
      }
      var id = node.getAttribute('data-bid');
      var hit = self.blockAt(id);
      if (!hit) return;
      var b = hit.b;
      var mod = e.ctrlKey || e.metaKey;

      if (mod && !e.shiftKey && keyOf(e) === 'z') {
        e.preventDefault();
        if (self.hist) self.hist.undo(); else self.doUndo();
        return;
      }
      if (mod && (keyOf(e) === 'y' || (e.shiftKey && keyOf(e) === 'z'))) {
        e.preventDefault();
        if (self.hist) self.hist.redo(); else self.doRedo();
        return;
      }
      if (mod && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault(); self.move(id, e.key === 'ArrowUp' ? -1 : 1); return;
      }
      if (mod && !e.shiftKey && 'biu'.indexOf(keyOf(e)) !== -1) {
        e.preventDefault();
        self.exec({ b: 'bold', i: 'italic', u: 'underline' }[keyOf(e)]);
        return;
      }
      if (mod && e.key === 'Enter') { e.preventDefault(); self.save(); return; }

      if (e.key === 'Enter' && !e.shiftKey && b.ty === 'shape' && b.sh === 'sticky') {
        var ednK = e.target.closest ? e.target.closest('.ne-text') : null;
        if (ednK) { e.preventDefault(); self.stickyEnter(ednK); return; }
      }
      if (e.key === 'Enter' && !e.shiftKey && TEXTY[b.ty]) {
        e.preventDefault();
        var before = self.snapshot();
        self.readBlock(node);
        /*@3.NOEJ.248*/
        var ednE = (e.target.closest && e.target.closest('.ne-text')) || null;
        var cutA = null, cutB = null;
        if (ednE) {
          var bnd = self.selBounds(ednE);
          if (bnd) { cutA = Math.min(bnd[0], bnd[1]); cutB = Math.max(bnd[0], bnd[1]); }
        }
        var rtE = b.rt || [];
        var lenE = runsLen(rtE);
        if (cutA === 0 && cutB === 0 && lenE > 0 && !b.fp) {
          var up = B().blank('p');
          var hitE = self.blockAt(id);
          var atUp = hitE ? hitE.i : 0;
          self.doc.blocks.splice(atUp, 0, up);
          self.pushUndo(before);
          self.renderInsert(atUp, [up]);
          self.focusBlock(id, false);
          self.touch();
          self.emitState();
          return;
        }
        var nb = B().blank(b.ty === 'h' ? 'p' : b.ty);
        if (b.ty === 'todo') nb.done = 0;
        var tailE = null;
        if (cutA != null && cutA < lenE) {
          var prtE = sliceRuns(rtE, cutA, cutB);
          b.rt = joinRuns([prtE[0]]);
          tailE = joinRuns([prtE[2]]);
          nb.rt = tailE;
        } else if (cutA != null && cutB > cutA) {
          b.rt = joinRuns([sliceRuns(rtE, cutA, cutB)[0]]);
        }
        /*@3.NOEJ.73*/
        if (b.fp) {
          nb.fp = self.fpUnder(b, id);
          nb.wm = b.wm || 'fit';
          nb.z = self.topZ() + 1;
          if (b.ff) nb.ff = b.ff;
          if (b.dir) nb.dir = b.dir;
          if (b.al) nb.al = b.al;
          /*@3.NOEJ.126*/
          if (b.rot) {
            nb.rot = b.rot;
            var th = b.rot * Math.PI / 180;
            var dd = self.freeH(id) + 8;
            var WR = self.sheetW() || 794;
            var sgr = self.isRtl() ? -1 : 1;
            nb.fp = {
              x: Math.max(0, Math.min(0.96, (b.fp.x || 0) + sgr * (-Math.sin(th) * dd) / WR)),
              y: Math.max(0, Math.round((b.fp.y || 0) + Math.cos(th) * dd))
            };
          }
        }
        self.insertAfter(id, nb);
        self.pushUndo(before);
        if (tailE) self.renderOne(id);
        /*@3.NOEJ.152*/
        var nbAt = self.blockAt(nb.id);
        if (nbAt) self.renderInsert(nbAt.i, [nb]); else self.render();
        if (tailE) {
          var fresh = self.root.querySelector('[data-bid="' + nb.id + '"]');
          var edF = fresh ? fresh.querySelector('.ne-text') : null;
          if (edF) { edF.focus(); selectRange(edF, 0, 0); }
          else self.focusBlock(nb.id);
        } else self.focusBlock(nb.id);
        self.touch();
        self.emitState();
        return;
      }

      /*@3.NOEJ.84*/
      if (e.key === 'Tab' && LISTY[b.ty]) {
        var liT = e.target.closest('.ne-li');
        if (liT) {
          e.preventDefault();
          self.indentItem(node, b, liT, e.shiftKey ? -1 : 1);
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey && LISTY[b.ty]) {
        var li = e.target.closest('.ne-li');
        if (!li) return;
        e.preventDefault();
        if (!li.textContent.trim()) {
          /*@3.NOEJ.88*/
          if (parseInt(li.getAttribute('data-lv') || '0', 10) > 0) {
            self.indentItem(node, b, li, -1);
            return;
          }
          /*@3.NOEJ.122*/
          var allLi = [].slice.call(node.querySelectorAll('.ne-li'));
          var at = allLi.indexOf(li);
          var prevBlank = at > 0 && !allLi[at - 1].textContent.trim();
          if (prevBlank) { self.exitList(node, b); return; }
          self.splitListItem(node, li, b);
          return;
        }
        self.splitListItem(node, li, b);
        return;
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && !mod &&
          e.target.isContentEditable &&
          (e.target.classList.contains('ne-text') ||
           e.target.classList.contains('ne-li'))) {
        var selJ = window.getSelection();
        if (selJ && selJ.isCollapsed) {
          var bndJ = self.selBounds(e.target);
          var dirJ = e.key === 'Backspace' ? -1 : 1;
          var lenJ = (e.target.textContent || '').length;
          if (bndJ && bndJ[0] === bndJ[1] &&
              (dirJ < 0 ? bndJ[0] === 0 : bndJ[0] >= lenJ) &&
              self.joinAt(id, e.target, dirJ)) {
            e.preventDefault();
            return;
          }
        }
      }

      if (e.key === 'Backspace' && TEXTY[b.ty]) {
        var t = node.querySelector('.ne-text');
        if (t && !t.textContent && self.doc.blocks.length > 1) {
          e.preventDefault();
          self.remove(id);
          return;
        }
      }

      if (e.key === 'Backspace' && LISTY[b.ty]) {
        var li2 = e.target.closest('.ne-li');
        var lis = [].slice.call(node.querySelectorAll('.ne-li'));
        if (li2 && !li2.textContent && lis.length > 1) {
          e.preventDefault();
          var k = lis.indexOf(li2);
          var before2 = self.snapshot();
          self.readBlock(node);
          b.items.splice(k, 1);
          self.pushUndo(before2);
          self.render();
          var fresh = self.root.querySelector('[data-bid="' + id + '"]');
          var prev = fresh ? fresh.querySelectorAll('.ne-li')[Math.max(0, k - 1)] : null;
          if (prev) { prev.focus(); selectRange(prev, runsLen(b.items[Math.max(0, k - 1)].rt), runsLen(b.items[Math.max(0, k - 1)].rt)); }
          self.touch();
          return;
        }
      }

      if (e.key === 'Escape' && b.prov) {
        e.preventDefault();
        e.stopPropagation();
        try { e.target.blur(); } catch (x9) {}
        self.dropProv();
        return;
      }

      if (e.key === '/' && TEXTY[b.ty]) {
        var tt = node.querySelector('.ne-text');
        if (tt && !tt.textContent.trim()) {
          e.preventDefault();
          self.openMenu(id, tt, 'insert');
        }
      }
    });

    /*@3.NOEJ.195*/
    root.addEventListener('input', function (e) {
      var t0 = e.target;
      if (!t0 || !t0.classList) return;
      if (!(t0.classList.contains('ne-text') || t0.classList.contains('ne-li') ||
            t0.classList.contains('ne-cell'))) { self.closeMention(); return; }
      var span = self.mentionAt(t0);
      if (span) self.openMention(t0, span);
      else self.closeMention();
    });

    /*@3.NOEJ.136*/
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains('ne-text')) return;
      if (t.textContent !== '/') return;
      var node2 = t.closest('[data-bid]');
      if (!node2) return;
      var id2 = node2.getAttribute('data-bid');
      var hit2 = self.blockAt(id2);
      if (!hit2 || !TEXTY[hit2.b.ty]) return;
      t.textContent = '';
      self.openMenu(id2, t, 'insert');
    });

    /*@3.NOEJ.341*/
    function elOf(t) {
      if (t && t.nodeType !== 1) t = t.parentElement;
      return (t && t.nodeType === 1) ? t : null;
    }

    root.addEventListener('paste', function (e) {
      var tgt = elOf(e.target);
      if (!tgt) return;
      var node = tgt.closest('[data-bid]');
      if (!node) return;
      /*@3.NOEJ.4*/
      if (tgt.classList.contains('ne-code') ||
          tgt.classList.contains('ne-tex')) {
        /*@3.NOEJ.137*/
        e.preventDefault();
        var flatTxt = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
        if (flatTxt) {
          /*@3.NOEJ.548*/
          self._tg = null; self.typeGroup(node.getAttribute('data-bid')); self._tg = null;
          try { document.execCommand('insertText', false, flatTxt); }
          catch (ep) {
            tgt.textContent += flatTxt;
          }
        }
        return;
      }
      if (tgt.tagName === 'INPUT') return;

      e.preventDefault();
      self.pasteRun(e.clipboardData, node);
    });

    /*@3.NOEJ.342*/
    root.addEventListener('input', function () { self.hidePasteOpts(); });
    /*@3.NOEJ.542*/
    var unfold = function (e) {
      var t = elOf(e.target);
      var fo = t ? t.closest('.ne-root > [data-fold]') : null;
      if (!fo || fo.parentNode !== root) return;
      (self._unfold || (self._unfold = {}))[fo.getAttribute('data-bid')] = 1;
      fo.removeAttribute('data-fold');
    };
    root.addEventListener('click', unfold);
    root.addEventListener('focusin', unfold);
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && self._pasteBar) { e.stopPropagation(); self.hidePasteOpts(); }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (String(e.key).toLowerCase() === 'a' || e.code === 'KeyA')) {
        var edA = self.currentEditable();
        var bA = edA ? self.selBounds(edA) : null;
        var lenA = edA ? (edA.textContent || '').length : 0;
        var whole = !edA || lenA === 0 || (bA && bA[0] === 0 && bA[1] >= lenA);
        if (whole || self._selMode) {
          e.preventDefault(); e.stopPropagation();
          if (!self._selMode) self.setSelectMode(true, 1);
          self.selectAllBlocks();
          try { window.getSelection().removeAllRanges(); } catch (eS) {}
        }
      }
    }, true);
    this._pasteDoc = function (e) {
      if (!self._pasteBar) return;
      if (e.target && e.target.closest && e.target.closest('.ne-pasteopt')) return;
      self.hidePasteOpts();
    };
    document.addEventListener('pointerdown', this._pasteDoc, true);

    root.addEventListener('beforeinput', function (e) {
      if (e.inputType !== 'insertFromPaste' && e.inputType !== 'insertFromPasteAsQuotation') return;
      var dt = e.dataTransfer;
      if (!dt || typeof dt.getData !== 'function') return;
      var tgt = elOf(e.target);
      if (!tgt) return;
      if (tgt.classList.contains('ne-code') || tgt.classList.contains('ne-tex')) return;
      if (tgt.tagName === 'INPUT') return;
      var node = tgt.closest('[data-bid]');
      if (!node) return;
      var html = '', txt = '';
      try { html = dt.getData('text/html') || ''; } catch (eh) {}
      try { txt = dt.getData('text/plain') || ''; } catch (et) {}
      if (!html && !txt) return;
      e.preventDefault();
      self.pasteRun(dt, node);
    });

    this._onDocPaste = function (e) {
      if (!self.root || !self.root.isConnected) return;
      var t = e.target;
      if (t && t.nodeType !== 1) t = t.parentElement;
      if (t && self.root.contains(t)) return;
      if (t && t.closest && (t.closest('[contenteditable="true"]') ||
          t.closest('input, textarea, select, dialog'))) return;
      if (self.readOnly) return;
      var host = self.pasteHost();
      if (!host) return;
      e.preventDefault();
      if (!self.pasteRun(e.clipboardData, host) && clipAny()) self.pasteBlocks();
    };
    /*@3.NOEJ.355*/
    if (!this.opts.noDocPaste) document.addEventListener('paste', this._onDocPaste);

    /*@3.NOEJ.143*/
    /*@3.NOEJ.362*/
    /*@3.NOEJ.593*/
    /*@3.NOEJ.599*/
    root.addEventListener('dragstart', function (e) {
      var tg = elOf(e.target);
      if (tg && tg.tagName === 'IMG' && tg.closest && tg.closest('[data-bid]')) e.preventDefault();
    });
    var overZ = null;
    var unover = function () { if (overZ) { overZ.removeAttribute('data-over'); overZ = null; } };
    root.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (!e.dataTransfer) return;
      var withImg = !!imgsIn(e.dataTransfer) || [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0;
      e.dataTransfer.dropEffect = withImg ? 'copy' : 'none';
      var tz = elOf(e.target);
      var z = (withImg && tz && tz.closest) ? tz.closest('.ne-img-pick') : null;
      if (z !== overZ) { unover(); if (z) { z.setAttribute('data-over', '1'); overZ = z; } }
    });
    root.addEventListener('dragleave', function (e) {
      if (overZ && !overZ.contains(e.relatedTarget)) unover();
    });
    root.addEventListener('drop', function (e) {
      unover();
      if (self.readOnly || !e.dataTransfer || !imgsIn(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      var t2 = elOf(e.target);
      var node2 = (t2 && t2.closest) ? t2.closest('[data-bid]') : null;
      self.takeImages(e.dataTransfer, node2 || self.pasteHost());
    });
    root.addEventListener('drop', function (e) { e.preventDefault(); });

    this._onDocClick = function (e) {
      /*@3.NOEJ.380*/
      if (self._eatClick) { self._eatClick = 0; return; }
      /*@3.NOEJ.381*/
      if (self.menu && Date.now() - (self._menuAt || 0) < 350) return;
      if (self.menu && !e.target.closest('.ne-menu') &&
          !e.target.closest('.ne-grip') && !e.target.closest('.ne-plus')) {
        self.closeMenu();
      }
      self.closeImgPanels(e.target.closest('.ne-b[data-ty="img"]'));
    };
    document.addEventListener('click', this._onDocClick);
    /*@3.NOEJ.601*/
    this._onDocKey = function (e) {
      if (!self.root) return;
      if (e.key === 'Escape') {
        if (self.menu && !e.defaultPrevented) { e.preventDefault(); self.closeMenu(); return; }
        if (self.root.querySelector('.ne-img-edit:not([hidden])')) self.closeImgPanels(null);
        /*@3.NOEJ.610*/
        if (!e.defaultPrevented && self._selMode) { e.preventDefault(); self.setSelectMode(false, 1); return; }
        if (!e.defaultPrevented && self.selectedBlocks().length) {
          var aeE = document.activeElement;
          if (!(aeE && aeE !== document.body && aeE.isContentEditable)) { e.preventDefault(); self.clearBlockSel(); }
        }
        return;
      }
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || self.readOnly || self.menu) return;
      var ae = document.activeElement;
      if (ae && ae !== document.body && (ae.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))) return;
      if (ae && ae !== document.body && !self.root.contains(ae)) return;
      if (self.selectedBlocks().length) { e.preventDefault(); self.closeImgPanels(null); self.deleteBlocks(); return; }
      if (!self._actId) return;
      var nd = self.root.querySelector(':scope > [data-bid="' + self._actId + '"][data-ty="img"][data-act="1"]');
      if (!nd || !nd.getClientRects().length) return;
      e.preventDefault();
      self.closeImgPanels(null);
      self.remove(self._actId);
    };
    document.addEventListener('keydown', this._onDocKey);
    /*@3.NOEJ.605*/
    this._onImgAway = function (e) {
      if (!self.root) return;
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('.ne-img-edit, dialog[open], .gsf-menu, .ne-menu, [popover]')) return;
      var list = self.root.querySelectorAll('.ne-img-edit--float');
      for (var i = 0; i < list.length; i++) {
        var pn = list[i];
        if (pn.hidden || !imgPanOpen(pn)) continue;
        var bk = pn.closest('[data-bid]');
        if (bk && bk.contains(t)) continue;
        imgPanShut(pn);
        if (bk) {
          if (!self._imgOpen) self._imgOpen = {};
          self._imgOpen[bk.getAttribute('data-bid')] = 0;
          bk.removeAttribute('data-imged');
        }
      }
    };
    document.addEventListener('pointerdown', this._onImgAway, true);

    /*@3.NOEJ.16*/
    this._onScroll = function (e) {
      if (!self.menu) return;
      if (e.target && e.target.nodeType === 1 && self.menu.contains(e.target)) return;
      if (e.target === self.menu) return;
      self.closeMenu();
    };
    window.addEventListener('scroll', this._onScroll, true);
  };

  var DRAG_PX = 6;

  /*@3.NOEJ.24*/
  /*@3.NOEJ.44*/
  Editor.prototype.bindImgPan = function () {
    var self = this, root = this.root;
    var P = null;

    root.addEventListener('pointerdown', function (e) {
      var view = e.target.closest('.ne-fig[data-sh="circle"] .ne-img-view');
      if (!view) return;
      var node = view.closest('[data-bid]');
      var hit = node ? self.blockAt(node.getAttribute('data-bid')) : null;
      if (!hit) return;
      var r = view.getBoundingClientRect();
      P = { id: e.pointerId, b: hit.b, view: view, w: r.width || 1, h: r.height || 1,
            x: e.clientX, y: e.clientY,
            fx: hit.b.fx == null ? 50 : hit.b.fx,
            fy: hit.b.fy == null ? 50 : hit.b.fy, moved: false };
      try { view.setPointerCapture(e.pointerId); } catch (e2) {}
      e.preventDefault();
    });

    root.addEventListener('pointermove', function (e) {
      if (!P || e.pointerId !== P.id) return;
      var dx = e.clientX - P.x, dy = e.clientY - P.y;
      if (!P.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      P.moved = true;
      self._imgDragged = true;
      P.b.fx = Math.max(0, Math.min(100, P.fx - (dx / P.w) * 100));
      P.b.fy = Math.max(0, Math.min(100, P.fy - (dy / P.h) * 100));
      var im = P.view.querySelector('img');
      if (im) im.style.objectPosition = P.b.fx + '% ' + P.b.fy + '%';
    });

    var stop = function (e) {
      if (!P || e.pointerId !== P.id) return;
      try { P.view.releasePointerCapture(P.id); } catch (e2) {}
      if (P.moved) self.touch();
      P = null;
    };
    root.addEventListener('pointerup', stop);
    root.addEventListener('pointercancel', stop);
  };

  Editor.prototype.bindDrag = function () {
    var self = this, root = this.root;
    var D = null;

    /*@3.NOEJ.124*/
    /*@3.NOEJ.445*/
    root.addEventListener('pointerdown', function (e) {
      var bn = e.target.closest ? e.target.closest(':scope > [data-bid]') : null;
      if (!bn) bn = e.target.closest ? e.target.closest('[data-bid]') : null;
      while (bn && bn.parentNode !== self.root) bn = (bn.parentNode && bn.parentNode.closest) ? bn.parentNode.closest('[data-bid]') : null;
      var fine = e.pointerType === 'mouse' || !self.coarse();
      if (fine && !(bn && bn.hasAttribute('data-fp'))) return;
      if (bn) self.touchAct(bn.getAttribute('data-bid'));
    }, true);
    if (!self._actDoc) {
      self._actDoc = function (e) {
        if (!self._actId || self._destroyed) return;
        var t = e.target;
        if (!t || !t.closest) return;
        if (self.root.contains(t)) {
          var inAct = t.closest(':scope > [data-bid="' + self._actId + '"]');
          if (!inAct) { var anyB = t.closest('[data-bid]'); while (anyB && anyB.parentNode !== self.root) anyB = (anyB.parentNode && anyB.parentNode.closest) ? anyB.parentNode.closest('[data-bid]') : null; inAct = anyB && anyB.getAttribute('data-bid') === self._actId; }
          if (inAct || t.closest('.ne-rail, .ne-rgrip, .ne-wgrip, .ne-menu')) return;
          self.touchAct('');
          return;
        }
        if (t.closest('.ne-shp-bar, .ne-shp-pop, .ne-menu, dialog, .ne-selhint, .ne-img-edit')) return;
        self.touchAct('');
      };
      document.addEventListener('pointerdown', self._actDoc, true);
      self._actKey = function (e) {
        if (e.key !== 'Escape' || !self._actId || self._destroyed) return;
        if (e.target && e.target.closest && e.target.closest('.ne-menu, dialog')) return;
        self.touchAct('');
      };
      document.addEventListener('keydown', self._actKey, true);
    }

    root.addEventListener('pointerdown', function (e) {
      var rg = e.target.closest('.ne-rgrip');
      if (!rg) return;
      var rnode = rg.closest('[data-bid][data-fp]');
      var rhit = rnode ? self.blockAt(rnode.getAttribute('data-bid')) : null;
      if (!rhit) return;
      var rr = rnode.getBoundingClientRect();
      var cx = rr.left + rr.width / 2, cy = rr.top + rr.height / 2;
      D = { spin: 1, b: rhit.b, node: rnode, cx: cx, cy: cy, sx: e.clientX, sy: e.clientY,
            dead: Math.max(16, 0.6 * Math.hypot(e.clientX - cx, e.clientY - cy)),
            a0: Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI,
            r0: rhit.b.rot || 0, pid: e.pointerId, snap: self.snapshot() };
      try { rg.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault();
      e.stopPropagation();
    }, true);

    /*@3.NOEJ.77*/
    root.addEventListener('pointerdown', function (e) {
      var wg = e.target.closest('.ne-wgrip');
      if (!wg) return;
      var wnode = wg.closest('[data-bid]');
      var whit = wnode ? self.blockAt(wnode.getAttribute('data-bid')) : null;
      if (!whit) return;
      var WW = self.sheetW() || 794;
      /*@3.NOEJ.103*/
      var side = wg.getAttribute('data-side') || 'e';
      var boxy = side !== 's' && side !== 'e';
      if (side === 's' && !whit.b.fp) return;
      if (boxy && whit.b.ty !== 'shape') return;
      D = { wide: 1, side: side, b: whit.b, node: wnode, W: WW,
            sgn: self.isRtl() ? -1 : 1, x: e.clientX, y: e.clientY,
            oh: (wnode.querySelector('.ne-body') || wnode).getBoundingClientRect().height / (self.zoomOf() || 1),
            ow: (wnode.offsetWidth || wnode.getBoundingClientRect().width) / WW,
            ox: whit.b.fp ? (whit.b.fp.x || 0) : 0,
            oy: whit.b.fp ? (whit.b.fp.y || 0) : 0,
            pid: e.pointerId, snap: self.snapshot() };
      try { wg.setPointerCapture(e.pointerId); } catch (x) {}
      wnode.classList.add('ne-sizing');
      e.preventDefault();
      e.stopPropagation();
    }, true);

    /*@3.NOEJ.50*/
    root.addEventListener('pointerdown', function (e) {
      var fgrip = e.target.closest('.ne-grip');
      var fnode = fgrip ? fgrip.closest('[data-bid][data-fp]') : null;
      if (fnode) {
        var fhit = self.blockAt(fnode.getAttribute('data-bid'));
        if (!fhit) return;
        var W = self.sheetW();
        D = { free: 1, b: fhit.b, node: fnode, W: W,
              x: e.clientX, y: e.clientY, grp: self.freeGroup(fhit.b),
              ox: fhit.b.fp.x, oy: fhit.b.fp.y, pid: e.pointerId,
              snap: self.snapshot() };
        try { fgrip.setPointerCapture(e.pointerId); } catch (e3) {}
        for (var gk = 0; gk < D.grp.length; gk++) D.grp[gk].node.classList.add('ne-dragging');
        e.preventDefault();
        return;
      }
      var li = e.target.closest ? e.target.closest('.ne-li') : null;
      if (li) {
        var lr = li.getBoundingClientRect();
        /*@3.NOEJ.106*/
        var onMark = self.isRtl() ? (e.clientX > lr.right - 1) : (e.clientX < lr.left + 1);
        var lnode = onMark ? li.closest('[data-bid]') : null;
        if (lnode) {
          var all = [].slice.call(lnode.querySelectorAll('.ne-li'));
          D = { item: 1, bid: lnode.getAttribute('data-bid'), li: li, node: lnode,
                from: all.indexOf(li), to: -1, x: e.clientX, y: e.clientY,
                on: false, pid: e.pointerId, grip: li };
          try { li.setPointerCapture(e.pointerId); } catch (x0) {}
          e.preventDefault();
          return;
        }
      }
      var grip = e.target.closest('.ne-grip');
      if (!grip) return;
      var node = grip.closest('[data-bid]');
      if (!node) return;
      D = { id: node.getAttribute('data-bid'), x: e.clientX, y: e.clientY,
            on: false, tgt: null, before: false, pid: e.pointerId, node: node };
      try { grip.setPointerCapture(e.pointerId); } catch (x) {}
      D.grip = grip;
    });

    root.addEventListener('pointermove', function (e) {
      if (!D || e.pointerId !== D.pid) return;
      /*@3.NOEJ.78*/
      if (D.spin) {
        e.preventDefault();
        var sdx = e.clientX - D.cx, sdy = e.clientY - D.cy;
        var ang = Math.atan2(sdy, sdx) * 180 / Math.PI;
        /*@3.NOEJ.623*/
        if (!D.go) {
          if (Math.hypot(e.clientX - D.sx, e.clientY - D.sy) < 6) return;
          D.go = 1;
        }
        if (Math.hypot(sdx, sdy) < D.dead) { D.hold = 1; return; }
        if (D.hold) { D.hold = 0; D.a0 = ang; D.r0 = D.b.rot || 0; return; }
        var next = D.r0 + (ang - D.a0);
        if (e.shiftKey) next = Math.round(next / 15) * 15;
        else { var q90 = Math.round(next / 90) * 90; if (Math.abs(next - q90) < 4) next = q90; }
        D.b.rot = Math.round(next * 10) / 10;
        D.node.style.transform = 'rotate(' + D.b.rot + 'deg)';
        D.node.style.transformOrigin = 'center center';
        D.moved = true;
        self.placeShpBar();
        return;
      }
      if (D.wide) {
        e.preventDefault();
        var zw = self.zoomOf();
        var dw = D.sgn * (e.clientX - D.x) / (zw * D.W);
        var sd = D.side;
        var leftSide = sd === 'nw' || sd === 'sw', rightSide = sd === 'ne' || sd === 'se';
        var topSide = sd === 'nw' || sd === 'ne' || sd === 'n', botSide = sd === 'sw' || sd === 'se' || sd === 'b';
        var rtlD = self.isRtl();
        var startEdge = sd === 's' || (rtlD ? rightSide : leftSide);
        var endEdge = sd === 'e' || (rtlD ? leftSide : rightSide);
        if (startEdge && D.b.fp) {
          var nx = Math.max(0, Math.min(0.96, D.ox + dw));
          D.b.wm = Math.max(0.06, Math.min(1 - nx, D.ow - (nx - D.ox)));
          D.b.fp.x = nx;
        } else if (endEdge) {
          var room = D.b.fp ? Math.max(0.08, 1 - (D.b.fp.x || 0)) : 1;
          D.b.wm = Math.max(0.06, Math.min(room, D.ow + dw));
        }
        if (topSide || botSide) {
          var dh = (e.clientY - D.y) / zw;
          var hN = Math.max(24, topSide ? D.oh - dh : D.oh + dh);
          if (topSide && D.b.fp) self.fpAuthor(D.b, Math.max(0, Math.round(D.oy + (D.oh - hN))));
          D.b.ar = Math.max(20, Math.min(400, Math.round((D.b.wm * D.W) / hN * 100)));
          D.node.style.setProperty('--ne-shp-ar', (D.b.ar / 100).toFixed(3));
        }
        self.applyFree(D.node, D.b);
        D.moved = true;
        return;
      }
      if (D.free) {
        e.preventDefault();
        /*@3.NOEJ.74*/
        var zf = self.zoomOf();
        var sg = self.isRtl() ? -1 : 1;
        var dxN = sg * (e.clientX - D.x) / (zf * D.W);
        var dyN = (e.clientY - D.y) / zf;
        var lo = -Infinity, hi = Infinity, dLo = -Infinity, gi, g, gw;
        /*@3.NOEJ.607*/
        for (gi = 0; gi < D.grp.length; gi++) {
          g = D.grp[gi];
          if (g.dye == null) {
            var gW = g.node.offsetWidth || 120, gH = g.node.offsetHeight || 24;
            var th = ((g.b.rot || 0) % 360) * Math.PI / 180;
            var cs = Math.abs(Math.cos(th)), sn = Math.abs(Math.sin(th));
            g.dxe = ((gW * cs + gH * sn) - gW) / 2;
            g.dye = ((gW * sn + gH * cs) - gH) / 2;
          }
          gw = (g.node.offsetWidth || 120) / D.W;
          lo = Math.max(lo, g.dxe / D.W - g.ox);
          hi = Math.min(hi, Math.max(0.04, 1 - gw - g.dxe / D.W) - g.ox);
          dLo = Math.max(dLo, g.dye - g.oy);
        }
        if (lo > hi) hi = lo;
        dxN = Math.max(lo, Math.min(hi, dxN));
        dyN = Math.max(dLo, dyN);
        var shH = self.opts.sheetH ? self.opts.sheetH() : 0;
        if (shH > 0) {
          var dHi = Infinity;
          for (gi = 0; gi < D.grp.length; gi++) {
            g = D.grp[gi];
            dHi = Math.min(dHi, Math.max(0, shH - (g.node.offsetHeight || 24) - g.dye) - g.oy);
          }
          if (dHi < dLo) dHi = dLo;
          dyN = Math.min(dHi, dyN);
        }
        for (gi = 0; gi < D.grp.length; gi++) {
          g = D.grp[gi];
          g.b.fp.x = g.ox + dxN;
          self.fpAuthor(g.b, Math.max(Math.min(0, Math.round(g.dye)), Math.round(g.oy + dyN)));
          self.applyFree(g.node, g.b);
        }
        D.moved = true;
        return;
      }
      if (D.item) {
        if (!D.on) {
          if (Math.abs(e.clientX - D.x) < DRAG_PX && Math.abs(e.clientY - D.y) < DRAG_PX) return;
          D.on = true;
          self.closeMenu();
          D.li.classList.add('ne-li-dragging');
          root.classList.add('ne-dragging-on');
        }
        e.preventDefault();
        aimItem(e.clientY);
        return;
      }
      if (!D.on) {
        if (Math.abs(e.clientX - D.x) < DRAG_PX && Math.abs(e.clientY - D.y) < DRAG_PX) return;
        D.on = true;
        self.closeMenu();
        D.node.classList.add('ne-dragging');
        root.classList.add('ne-dragging-on');
      }
      e.preventDefault();
      aim(e.clientX, e.clientY);
    });

    function aimItem(y) {
      clearMark();
      var lis = [].slice.call(D.node.querySelectorAll('.ne-li'));
      D.to = -1;
      for (var i = 0; i < lis.length; i++) {
        var r = lis[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) { D.to = i; lis[i].setAttribute('data-drop', 'b'); return; }
      }
      D.to = lis.length;
      if (lis.length) lis[lis.length - 1].setAttribute('data-drop', 'a');
    }

    function clearMark() {
      [].forEach.call(root.querySelectorAll('[data-drop]'), function (n) {
        n.removeAttribute('data-drop');
      });
    }

    /*@3.NOEJ.25*/
    function aim(x, y) {
      clearMark();
      D.tgt = null;
      var nodes = root.querySelectorAll('[data-bid]');
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.getAttribute('data-bid') === D.id) continue;
        var r = n.getBoundingClientRect();
        if (y >= r.top && y <= r.bottom) {
          D.tgt = n;
          D.before = (y < r.top + r.height / 2);
          n.setAttribute('data-drop', D.before ? 'b' : 'a');
          return;
        }
      }
      var last = nodes[nodes.length - 1];
      if (last && y > last.getBoundingClientRect().bottom &&
          last.getAttribute('data-bid') !== D.id) {
        D.tgt = last; D.before = false;
        last.setAttribute('data-drop', 'a');
      }
    }

    function finish(commit) {
      if (!D) return;
      var d = D; D = null;
      try { d.grip.releasePointerCapture(d.pid); } catch (x) {}
      clearMark();
      root.classList.remove('ne-dragging-on');
      if (d.node) d.node.classList.remove('ne-dragging');
      if (!d.on) return;
      if (commit && d.tgt) self.moveTo(d.id, d.tgt.getAttribute('data-bid'), d.before);
    }

    root.addEventListener('pointerup', function (e) {
      if (!D || e.pointerId !== D.pid) return;
      if (D.spin) {
        if (D.moved) { self.pushUndo(D.snap); self._eatClick = 1; self.touch(); self.emitState(); }
        D = null;
        e.preventDefault(); e.stopPropagation();
        return;
      }
      if (D.wide) {
        D.node.classList.remove('ne-sizing');
        if (D.moved) {
          self.pushUndo(D.snap); self.touch(); self.emitState();
          /*@3.NOEJ.443*/
          if (D.b && D.b.fp && self.opts.onFree) { try { self.opts.onFree(D.b); } catch (eW) {} }
        }
        D = null;
        e.preventDefault(); e.stopPropagation();
        return;
      }
      if (D.free) {
        for (var gu = 0; gu < D.grp.length; gu++) D.grp[gu].node.classList.remove('ne-dragging');
        if (D.moved) {
          /*@3.NOEJ.117*/
          self._eatClick = 1;
          self.pushUndo(D.snap);
          self.touch(); self.emitState();
          if (self.opts.onFree) { for (var gf = 0; gf < D.grp.length; gf++) { try { self.opts.onFree(D.grp[gf].b); } catch (eG) {} } }
          e.preventDefault(); e.stopPropagation();
        }
        D = null;
        return;
      }
      if (D.item) {
        var di = D; D = null;
        try { di.grip.releasePointerCapture(di.pid); } catch (x2) {}
        clearMark();
        root.classList.remove('ne-dragging-on');
        di.li.classList.remove('ne-li-dragging');
        if (di.on && di.to >= 0) {
          self.moveItem(di.bid, di.from, di.to);
          e.preventDefault(); e.stopPropagation();
        }
        return;
      }
      var was = D.on;
      finish(true);
      if (was) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    root.addEventListener('pointercancel', function (e) {
      if (!D || e.pointerId !== D.pid) return;
      if (D.spin) { D = null; return; }
      if (D.wide) { D.node.classList.remove('ne-sizing'); D = null; return; }
      if (D.free) { D.node.classList.remove('ne-dragging'); D = null; return; }
      if (D.item) {
        clearMark();
        root.classList.remove('ne-dragging-on');
        D.li.classList.remove('ne-li-dragging');
        D = null;
        return;
      }
      finish(false);
    });
  };

  Editor.prototype.moveTo = function (id, targetId, before) {
    if (!id || !targetId || id === targetId) return false;
    var from = this.blockAt(id);
    if (!from) return false;
    var snap = this.snapshot();
    this.readAll();
    var bs = this.doc.blocks;
    var i = -1, j = -1, k;
    for (k = 0; k < bs.length; k++) {
      if (bs[k].id === id) i = k;
      if (bs[k].id === targetId) j = k;
    }
    if (i < 0 || j < 0) return false;
    var moved = bs.splice(i, 1)[0];
    var at = 0;
    for (k = 0; k < bs.length; k++) if (bs[k].id === targetId) { at = k; break; }
    bs.splice(before ? at : at + 1, 0, moved);
    this.pushUndo(snap);
    this.render();
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.destroy = function () {
    /*@3.NOEJ.296*/
    if (this._winTie) {
      if (this._winSc) { try { this._winSc.removeEventListener('scroll', this._winTie); } catch (eW) {} }
      try { window.removeEventListener('resize', this._winTie); } catch (eW2) {}
      if (this._winQ) { try { cancelAnimationFrame(this._winQ); } catch (eW3) {} this._winQ = 0; }
      this._winTie = null;
      this._winSc = null;
    }
    this.closeMenu();
    this.closeMention();
    if (this._actDoc) { try { document.removeEventListener('pointerdown', this._actDoc, true); } catch (eA) {} this._actDoc = null; }
    if (this._actKey) { try { document.removeEventListener('keydown', this._actKey, true); } catch (eK) {} this._actKey = null; }
    if (this._pasteDoc) { try { document.removeEventListener('pointerdown', this._pasteDoc, true); } catch (eP) {} this._pasteDoc = null; }
    if (this._shOut) { try { document.removeEventListener('pointerdown', this._shOut, true); } catch (eS) {} this._shOut = null; }
    /*@3.NOEJ.142*/
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
    /*@3.NOEJ.179*/
    if (this._blurT) { clearTimeout(this._blurT); this._blurT = null; }
    for (var cid in (this.canvases || {})) {
      try { this.canvases[cid].destroy(); } catch (e) {}
    }
    this.canvases = {};
    document.removeEventListener('click', this._onDocClick);
    if (this._onDocKey) document.removeEventListener('keydown', this._onDocKey);
    if (this._onImgAway) document.removeEventListener('pointerdown', this._onImgAway, true);
    if (this._onDocPaste) document.removeEventListener('paste', this._onDocPaste);
    if (this._ro) { try { this._ro.disconnect(); } catch (eR) {} this._ro = null; }
    if (this._io) { try { this._io.disconnect(); } catch (eI) {} this._io = null; }
    document.removeEventListener('selectionchange', this._onSelChange);
    /*@3.NOEJ.167*/
    document.removeEventListener('pointermove', this._onBdragMove);
    document.removeEventListener('pointerup', this._onBdragStop);
    document.removeEventListener('pointercancel', this._onBdragStop);
    document.removeEventListener('pointermove', this._onCdragMove);
    document.removeEventListener('pointerup', this._onCdragStop);
    document.removeEventListener('pointercancel', this._onCdragStop);
    window.removeEventListener('scroll', this._onScroll, true);
    if (this._onFaces) {
      try { document.fonts.removeEventListener('loadingdone', this._onFaces); } catch (eF) {}
      this._onFaces = null;
    }
    if (this._mo) { try { this._mo.disconnect(); } catch (eM) {} this._mo = null; }
    if (this._imo) { try { this._imo.disconnect(); } catch (eI) {} this._imo = null; }
    if (this._setT) { clearTimeout(this._setT); this._setT = null; }
    if (this._lpT) { clearTimeout(this._lpT); this._lpT = 0; }
    this._lpAt = null;
    if (this._roQ) {
      try { cancelAnimationFrame(this._roQ); } catch (eQ) {}
      this._roQ = 0;
    }
    this._dirty = null;
    this._bidx = null;
    this._natIdx = null;
    this._nat = null;
    this._cold = null;
    this.undo.length = 0;
    this.redo.length = 0;
    this._undoB = 0;
    this._snapMemo = null;
    this._snapSh = null;
    this.root.__ed = null;
    this._winA = null;
    this._winB = null;
    this._destroyed = 1;
  };

  var TBL_ALIGN = [
    { k: 'ah:start',  icon: 'fa-align-left',    ar: 'كلُّ الخلايا إلى البداية', en: 'All cells to start' },
    { k: 'ah:center', icon: 'fa-align-center',  ar: 'توسيطُ كلِّ الخلايا',      en: 'Centre all cells' },
    { k: 'ah:end',    icon: 'fa-align-right',   ar: 'كلُّ الخلايا إلى النهاية', en: 'All cells to end' },
    { k: 'av:top',    icon: 'fa-angles-up',     ar: 'كلُّ الخلايا إلى الأعلى',  en: 'All cells to top' },
    { k: 'av:middle', icon: 'fa-bars',          ar: 'توسيطٌ عموديّ',            en: 'Middle vertically' },
    { k: 'av:bottom', icon: 'fa-angles-down',   ar: 'كلُّ الخلايا إلى الأسفل',  en: 'All cells to bottom' }
  ];

  /*@3.NOEJ.545*/
  function cellLook(td, c) {
    if (c.dir) { td.setAttribute('data-cdir', c.dir); td.setAttribute('dir', c.dir); }
    else td.removeAttribute('data-cdir');
    if (c.fs) { td.setAttribute('data-cfs', String(c.fs)); td.style.fontSize = c.fs + 'px'; }
    else { td.removeAttribute('data-cfs'); td.style.fontSize = ''; }
    var css = c.ff ? B().fontCss(c.ff) : null;
    if (c.ff) { td.setAttribute('data-cff', c.ff); td.style.fontFamily = css ? '"' + css + '", sans-serif' : ''; }
    else { td.removeAttribute('data-cff'); td.style.fontFamily = ''; }
  }

  var CSC = ['all', 'row', 'col', 'one'];
  var CSC_L = { all: ['الجدول', 'Table'], row: ['الصفّ', 'Row'], col: ['العمود', 'Column'], one: ['الخليّة', 'Cell'] };
  function cscOf(b) { return CSC.indexOf(b && b.csc) >= 0 ? b.csc : 'all'; }

  function tblRows(node) { return [].slice.call(node.querySelectorAll('tr:not([data-brk])')); }
  function cellRC(node, td) {
    var tr = td && td.closest ? td.closest('tr') : null;
    if (!tr || tr.hasAttribute('data-brk') || tr.hasAttribute('data-hollow')) return null;
    var ri = tblRows(node).indexOf(tr);
    var ci = [].indexOf.call(tr.querySelectorAll('.ne-cell'), td);
    return (ri < 0 || ci < 0) ? null : [ri, ci];
  }
  function cellAt(node, ri, ci) {
    var tr = tblRows(node)[ri];
    if (!tr || tr.hasAttribute('data-hollow')) return null;
    return tr.querySelectorAll('.ne-cell')[ci] || null;
  }

  /*@3.NOEJ.551*/
  Editor.prototype.cellTargets = function (node, b, td, scope) {
    var sel = this.cselOf(b.id);
    if (sel) return sel;
    var rc = td ? cellRC(node, td) : null, out = [];
    (b.rows || []).forEach(function (row, ri) {
      row.forEach(function (c, ci) {
        if (rc && scope === 'one' && (ri !== rc[0] || ci !== rc[1])) return;
        if (rc && scope === 'row' && ri !== rc[0]) return;
        if (rc && scope === 'col' && ci !== rc[1]) return;
        out.push([ri, ci]);
      });
    });
    return out;
  };

  /*@3.NOEJ.552*/
  Editor.prototype.cselOf = function (id) {
    var cs = this._csel;
    if (!cs || cs.bid !== id) return null;
    if (!this.root.querySelector('[data-bid="' + id + '"] .ne-cell[data-csel]')) { this._csel = null; return null; }
    var out = Object.keys(cs.k).map(function (k) { return k.split(',').map(Number); });
    return out.length ? out : null;
  };
  Editor.prototype.cselLive = function () {
    return !!this.cselNode();
  };
  /*@3.NOEJ.576*/
  Editor.prototype.cselNode = function () {
    var cs = this._csel;
    if (!cs) return null;
    var node = this.root.querySelector(':scope > [data-bid="' + cs.bid + '"]');
    return (node && this.cselOf(cs.bid)) ? node : null;
  };
  Editor.prototype.cselPaint = function () {
    var old = this.root.querySelectorAll('.ne-cell[data-csel]'), i;
    for (i = 0; i < old.length; i++) old[i].removeAttribute('data-csel');
    var cs = this._csel, node = cs ? this.root.querySelector('[data-bid="' + cs.bid + '"]') : null;
    if (cs && !node) cs = this._csel = null;
    var n = 0;
    if (cs) {
      for (var k in cs.k) {
        var p = k.split(','), td = cellAt(node, +p[0], +p[1]);
        if (td) { td.setAttribute('data-csel', '1'); n++; }
      }
      if (!n) cs = this._csel = null;
    }
    var btns = this.root.querySelectorAll('[data-tbl="scope"]');
    for (i = 0; i < btns.length; i++) {
      var bn = btns[i].closest('[data-bid]'), bid = bn && bn.getAttribute('data-bid');
      var hitB = bid ? this.blockAt(bid) : null;
      if (cs && bid === cs.bid) {
        btns[i].textContent = L('المحدَّد (' + n + ')', 'Selected (' + n + ')');
        btns[i].setAttribute('data-csc', 'sel');
      } else if (btns[i].getAttribute('data-csc') === 'sel') {
        var sc = cscOf(hitB && hitB.b);
        btns[i].textContent = L(CSC_L[sc][0], CSC_L[sc][1]);
        btns[i].setAttribute('data-csc', sc);
      }
    }
  };
  Editor.prototype.cselClear = function () {
    if (!this._csel && !this.root.querySelector('.ne-cell[data-csel]')) return;
    this._csel = null;
    this.cselPaint();
  };
  Editor.prototype.cselRect = function (a, b) {
    var cs = this._csel;
    cs.k = {};
    for (var r = Math.min(a[0], b[0]); r <= Math.max(a[0], b[0]); r++) {
      for (var c = Math.min(a[1], b[1]); c <= Math.max(a[1], b[1]); c++) cs.k[r + ',' + c] = 1;
    }
  };
  /*@3.NOEJ.553*/
  Editor.prototype.cselKind = function (e) {
    if (this._selMode || this.readOnly || e.button !== 0) return null;
    if (!(e.ctrlKey || e.metaKey || e.shiftKey)) return null;
    var td = e.target && e.target.closest ? e.target.closest('.ne-cell[contenteditable="true"]') : null;
    var node = td ? td.closest('[data-bid]') : null;
    if (!node || !this.root.contains(node) || !cellRC(node, td)) return null;
    if (this.selectedBlocks().length) return null;
    var cur = this.cellNode();
    var same = (this._csel && this._csel.bid === node.getAttribute('data-bid')) ||
               !!(cur && cur.closest('[data-bid]') === node);
    if (e.shiftKey && !(e.ctrlKey || e.metaKey)) return same ? 'rect' : null;
    return 'tog';
  };
  Editor.prototype.cselClick = function (e, kind) {
    var td = e.target.closest('.ne-cell'), node = td.closest('[data-bid]'), id = node.getAttribute('data-bid');
    var rc = cellRC(node, td), cs = this._csel;
    if (!rc) return;
    if (!cs || cs.bid !== id) {
      var cur = this.cellNode();
      var a = (cur && cur.closest('[data-bid]') === node) ? cellRC(node, cur) : null;
      cs = this._csel = { bid: id, a: a || rc, k: {} };
      if (a) cs.k[a.join(',')] = 1;
    }
    if (kind === 'rect') this.cselRect(cs.a, rc);
    else {
      var key = rc.join(',');
      if (cs.k[key]) delete cs.k[key]; else cs.k[key] = 1;
      cs.a = rc;
    }
    this.cselPaint();
    this.emitState();
  };

  /*@3.NOEJ.546*/
  Editor.prototype.setCellProp = function (key, val) {
    var td = this.cellNode();
    var node = td ? td.closest('[data-bid]') : null;
    var cn = this.cselNode();
    if (cn && node !== cn) { node = cn; td = null; }
    var hit = node ? this.blockAt(node.getAttribute('data-bid')) : null;
    if (!hit || hit.b.ty !== 'tbl') return false;
    var scope = this.cselOf(hit.b.id) ? 'sel' : cscOf(hit.b);
    this.readBlock(node);
    var rows = tblRows(node);
    var self = this;
    var cellOf = function (x) {
      var ri = rows.indexOf(x.closest('tr'));
      var ci = [].indexOf.call(x.parentNode.querySelectorAll('.ne-cell'), x);
      return hit.b.rows[ri] ? hit.b.rows[ri][ci] : null;
    };
    if (scope === 'all') {
      var had = false;
      hit.b.rows.forEach(function (row) { row.forEach(function (c) { if (c[key] != null) { had = true; } }); });
      if (had) {
        var before0 = this.snapshot();
        hit.b.rows.forEach(function (row) { row.forEach(function (c) { delete c[key]; }); });
        [].forEach.call(node.querySelectorAll('.ne-cell'), function (x) { var c = cellOf(x); if (c) cellLook(x, c); });
        this.pushUndo(before0);
      }
      return key === 'fs' ? this.setFontSize(val) : this.setBlockStyle(key, val);
    }
    var before = this.snapshot();
    this.cellTargets(node, hit.b, td, scope).forEach(function (p) {
      var c = hit.b.rows[p[0]] ? hit.b.rows[p[0]][p[1]] : null;
      if (!c) return;
      var v = val;
      if (key === 'fs') { v = parseFloat(val); v = (isFinite(v) && v > 0) ? Math.max(8, Math.min(96, Math.round(v * 10) / 10)) : 0; }
      if (!v || v === 'auto') delete c[key]; else c[key] = v;
      /*@3.NOEJ.577*/
      var rk = key === 'fs' ? 'fz' : (key === 'ff' ? 'ff' : '');
      var hadR = !!rk && (c.rt || []).some(function (r) { return r[rk] != null; });
      if (hadR) c.rt = joinRuns([c.rt.map(function (r) { var o = Object.assign({}, r); delete o[rk]; return o; })]);
      var x = cellAt(node, p[0], p[1]);
      if (!x) return;
      if (hadR) x.innerHTML = B().runsToHtmlBidi(c.rt || []);
      cellLook(x, c);
      if (key === 'dir' && !c.dir) x.setAttribute('dir', blockDir(hit.b, self.doc));
    });
    if (this._tfit) delete this._tfit[hit.b.id];
    node.__tfitW = -1; node.__dirty = 1;
    this.tblFit(node);
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.cellNode = function () {
    var edn = this.currentEditable();
    return (edn && edn.classList.contains('ne-cell')) ? edn : null;
  };

  /*@3.NOEJ.107*/
  Editor.prototype.setCellAlign = function (axis, val, fallback, all) {
    var td = this.cellNode();
    var node = td ? td.closest('[data-bid]') : null;
    if (fallback && (!node || node.getAttribute('data-bid') !== fallback)) {
      node = this.root.querySelector('[data-bid="' + fallback + '"]');
      td = null;
    }
    if (!node) return false;
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit || hit.b.ty !== 'tbl') return false;
    var before = this.snapshot();
    this.readBlock(node);
    var attr = axis === 'v' ? 'data-cva' : 'data-cal';
    var key = axis === 'v' ? 'va' : 'al';
    if (td && td.closest('[data-bid]') !== node) td = null;
    var scope = all === true ? 'all' : (all || 'one');
    this.cellTargets(node, hit.b, td, td ? scope : 'all').forEach(function (p) {
      var cell = hit.b.rows && hit.b.rows[p[0]] && hit.b.rows[p[0]][p[1]];
      if (!cell) return;
      if (val) cell[key] = val; else delete cell[key];
      var x = cellAt(node, p[0], p[1]);
      if (x) { if (val) x.setAttribute(attr, val); else x.removeAttribute(attr); }
    });
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.tableOp = function (id, op) {
    var hitS = this.blockAt(id);
    if (this._tfit) delete this._tfit[id];
    var scope = cscOf(hitS && hitS.b);
    if (op.indexOf('ah:') === 0) return this.setCellAlign('h', op.slice(3), id, scope);
    if (op.indexOf('av:') === 0) return this.setCellAlign('v', op.slice(3), id, scope);
    if (op === 'scope') {
      if (!hitS || hitS.b.ty !== 'tbl') return;
      if (this.cselOf(id)) { this.cselClear(); return true; }
      var nx = CSC[(CSC.indexOf(scope) + 1) % CSC.length];
      if (nx === 'all') delete hitS.b.csc; else hitS.b.csc = nx;
      var nodeS = this.root.querySelector('[data-bid="' + id + '"]');
      var btnS = nodeS && nodeS.querySelector('[data-tbl="scope"]');
      if (btnS) {
        btnS.textContent = L(CSC_L[nx][0], CSC_L[nx][1]);
        btnS.setAttribute('data-csc', nx);
      }
      this.touch();
      return true;
    }
    var hit = this.blockAt(id);
    if (!hit || hit.b.ty !== 'tbl') return;
    this.cselClear();
    var before = this.snapshot();
    this.readBlock(this.root.querySelector('[data-bid="' + id + '"]'));
    var b = hit.b;
    var cols = b.rows[0] ? b.rows[0].length : 2;
    var tdH = this.cellNode(), atR = -1, atC = -1;
    if (tdH && tdH.closest('[data-bid]') === this.root.querySelector('[data-bid="' + id + '"]')) {
      var trH = tdH.closest('tr');
      atR = [].indexOf.call(trH.parentNode.querySelectorAll('tr'), trH);
      atC = [].indexOf.call(trH.querySelectorAll('.ne-cell'), tdH);
    }
    var goR = atR, goC = atC;
    if (op === 'row+') {
      var r = []; for (var i = 0; i < cols; i++) r.push({ rt: [] });
      if (atR >= 0) { b.rows.splice(atR + 1, 0, r); goR = atR + 1; } else b.rows.push(r);
    } else if (op === 'row-' && b.rows.length > 1) {
      if (atR >= 0) { b.rows.splice(atR, 1); goR = Math.min(atR, b.rows.length - 1); } else b.rows.pop();
    } else if (op === 'col+') {
      b.rows.forEach(function (row) { if (atC >= 0) row.splice(atC + 1, 0, { rt: [] }); else row.push({ rt: [] }); });
      if (atC >= 0) goC = atC + 1;
    } else if (op === 'col-' && cols > 1) {
      b.rows.forEach(function (row) { if (atC >= 0 && atC < row.length) row.splice(atC, 1); else row.pop(); });
      if (atC >= 0) goC = Math.min(atC, cols - 2);
    } else if (op === 'style') {
      var ST = B().TBL_STYLES;
      var at = ST.indexOf(b.st || 'head');
      b.st = ST[(at + 1) % ST.length];
    } else if (op === 'tone') {
      /*@3.NOEJ.40*/
      var TC = ['', 'violet', 'emerald', 'sky', 'amber', 'rose', 'teal'];
      var ac = TC.indexOf(b.tc || '');
      b.tc = TC[(ac + 1) % TC.length];
    }
    b.cols = b.rows[0] ? b.rows[0].length : 1;
    this.pushUndo(before);
    this.renderOne(id);
    if (goR >= 0 && goC >= 0 && /^(row|col)[+-]$/.test(op)) {
      var nodeG = this.root.querySelector('[data-bid="' + id + '"]');
      var trG = nodeG && nodeG.querySelectorAll('tr')[goR];
      var tdG = trG && trG.querySelectorAll('.ne-cell')[goC];
      if (tdG) { try { tdG.focus(); this.focusEd = tdG; } catch (eG) {} }
    }
    this.touch();
  };

  /*@3.NOEJ.18*/
  document.addEventListener('garden:languageChanged', function () {
    var all = document.querySelectorAll('.ne-root');
    for (var i = 0; i < all.length; i++) {
      var inst = all[i].__ed;
      if (inst) { inst.readAll(); inst.render(); inst.emitState(); }
    }
  });

  window.GardenNotesEditor = { PBV: PBV, LV: LV, engFresh: engFresh,
    mount: function (host, doc, opts) { return new Editor(host, doc, opts); },
    hasClip: function () { return clipAny(); },
    MENU: MENU,
    TURN: TURN,
    INSERT: INSERT
  };
})();
