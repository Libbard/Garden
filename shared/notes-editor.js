/*@3.NOEJ.1*/
;(function () {
  'use strict';

  var B = function () { return window.GardenNotesBlocks; };
  var SAN = function () { return window.GardenNotesSanitize; };

  /*@3.NOEJ.45*/
  var TEXTY = { p: 1, h: 1, quote: 1, callout: 1, todo: 1 };
  /*@3.NOEJ.204*/
  var LISTY = { ul: 1, ol: 1, dl: 1 };
  var KEEP = ['dir', 'al', 'ff', 'fs', 'hlb', 'fp', 'wm', 'z', 'zi', 'csc', 'rot', 'ls', 'lsb'];
  /*@3.NOEJ.70*/
  var WIDE = { hr: 1, tbl: 1, ink: 1, gap: 1 };
  var AUTOSAVE_MS = 2000;
  /*@3.NOEJ.214*/
  var PBV = 3;
  var TYPE_GROUP_MS = 900;
  var TYPE_GROUP_MAX = 4000;
  var UNDO_MAX = 120;

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(ar, en) { return isAr() ? ar : en; }

  var TURN = [
    { ty: 'p',       icon: 'fa-align-left',      ar: 'فقرة',        en: 'Paragraph' },
    { ty: 'h', lv: 1, icon: 'fa-heading',        ar: 'عنوان كبير',  en: 'Heading 1' },
    { ty: 'h', lv: 2, icon: 'fa-heading',        ar: 'عنوان متوسط', en: 'Heading 2' },
    { ty: 'h', lv: 3, icon: 'fa-heading',        ar: 'عنوان صغير',  en: 'Heading 3' },
    { ty: 'ul',      icon: 'fa-list-ul',         ar: 'قائمة نقطية', en: 'Bullet list' },
    { ty: 'ol',      icon: 'fa-list-ol',         ar: 'قائمة رقمية', en: 'Numbered list' },
    { ty: 'todo',    icon: 'fa-square-check',    ar: 'مربع مهمة',   en: 'To-do' },
    { ty: 'quote',   icon: 'fa-quote-right',     ar: 'اقتباس',      en: 'Quote' },
    { ty: 'callout', icon: 'fa-circle-info',     ar: 'تنبيه',       en: 'Callout' },
    { ty: 'code',    icon: 'fa-code',            ar: 'كود',         en: 'Code' }
  ];

  var INSERT = [
    { ty: 'p',       icon: 'fa-align-left',      ar: 'فقرة',        en: 'Paragraph' },
    { ty: 'ul',      icon: 'fa-list-ul',         ar: 'قائمة نقطية', en: 'Bullet list' },
    { ty: 'ol',      icon: 'fa-list-ol',         ar: 'قائمة رقمية', en: 'Numbered list' },
    { ty: 'todo',    icon: 'fa-square-check',    ar: 'مربع مهمة',   en: 'To-do' },
    { ty: 'quote',   icon: 'fa-quote-right',     ar: 'اقتباس',      en: 'Quote' },
    { ty: 'callout', icon: 'fa-circle-info',     ar: 'تنبيه',       en: 'Callout' },
    { ty: 'code',    icon: 'fa-code',            ar: 'كود',         en: 'Code' },
    { ty: 'tbl',     icon: 'fa-table',           ar: 'جدول',        en: 'Table' },
    { ty: 'math',    icon: 'fa-square-root-variable', ar: 'معادلة', en: 'Equation' },
    { ty: 'img',     icon: 'fa-image',           ar: 'صورة برابط',  en: 'Image by URL' },
    { ty: 'hr',      icon: 'fa-minus',           ar: 'فاصل',        en: 'Divider' },
    { ty: 'gap',     icon: 'fa-arrows-up-down',  ar: 'فراغ',         en: 'Spacer' }
  ];

  var MENU = INSERT;

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
    this.dirty = false;
    this.focusEd = null;
    this.lastSel = null;
    this.root = el('div', 'ne-root');
    this.root.__ed = this;
    this.host.innerHTML = '';
    this.host.appendChild(this.root);
    this.render();
    var selfE = this;
    needEmoji().then(function () { selfE.emojiSweep(); });
    if (document.fonts && document.fonts.ready) {
      /*@3.NOEJ.156*/
      var engSettle = function () {
        if (selfE._engRecap) {
          selfE._engRecap = false;
          selfE.captureEng();
          if (selfE.doc.eng && selfE.opts.onSave) selfE.opts.onSave(selfE.doc);
        } else {
          selfE.applyEng();
        }
      };
      document.fonts.ready.then(engSettle);
      try { document.fonts.addEventListener('loadingdone', engSettle); } catch (eL) {}
    }
    this.bind();
    this.bindDrag();
    this.bindImgPan();
    this.bindFreeCleanup();
  }

  Editor.prototype.snapshot = function () { return JSON.stringify(this.doc); };

  /*@3.NOEJ.2*/
  Editor.prototype.pushUndo = function (before) {
    this.undo.push(before);
    if (this.undo.length > UNDO_MAX) this.undo.shift();
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

  Editor.prototype.doUndo = function () {
    this._tg = null;
    if (!this.undo.length) return false;
    var cur = this.snapshot();
    this.redo.push(cur);
    this.doc = JSON.parse(this.undo.pop());
    this.render();
    this.touch(true);
    this.emitState();
    return true;
  };

  Editor.prototype.doRedo = function () {
    this._tg = null;
    if (!this.redo.length) return false;
    var cur = this.snapshot();
    this.undo.push(cur);
    this.doc = JSON.parse(this.redo.pop());
    this.render();
    this.touch(true);
    this.emitState();
    return true;
  };

  Editor.prototype.touch = function () {
    this._engStale = true;
    /*@3.NOEJ.181*/
    if (DIR_CACHE) DIR_CACHE.delete(this.doc);
    if (this._engOn) this.applyEng();
    if (this.opts.onLayout) this.opts.onLayout();
    this.mark();
  };

  /*@3.NOEJ.211*/
  Editor.prototype.mark = function () {
    this.dirty = true;
    if (this.opts.onDirty) this.opts.onDirty();
    this.arm();
  };

  /*@3.NOEJ.212*/
  Editor.prototype.arm = function () {
    clearTimeout(this.saveTimer);
    var self = this;
    this.saveTimer = setTimeout(function () {
      if (self.opts.busy && self.opts.busy()) { self.arm(); return; }
      self.save();
    }, AUTOSAVE_MS);
  };

  Editor.prototype.save = function () {
    clearTimeout(this.saveTimer);
    this.readAll();
    for (var pi = this.doc.blocks.length - 1; pi >= 0; pi--) {
      var pb = this.doc.blocks[pi];
      if (!pb.prov) continue;
      if (this.blockHolds(pb, null)) delete pb.prov;
      else if (!this.caretInside(pb, null)) this.doc.blocks.splice(pi, 1);
    }
    if (!this.doc.blocks.length) this.doc.blocks.push(B().blank('p'));
    this.dirty = false;
    this.captureEng();
    if (this.opts.onSave) this.opts.onSave(this.doc);
    return this.doc;
  };

  Editor.prototype.blockAt = function (id) {
    for (var i = 0; i < this.doc.blocks.length; i++) {
      if (this.doc.blocks[i].id === id) return { b: this.doc.blocks[i], i: i };
    }
    return null;
  };

  Editor.prototype.readAll = function () {
    var nodes = this.root.querySelectorAll('[data-bid]');
    for (var i = 0; i < nodes.length; i++) this.readBlock(nodes[i]);
    return this.doc;
  };

  Editor.prototype.readBlock = function (node) {
    if (!node) return;
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit) return;
    var b = hit.b;
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
      if (pre) b.src = pre.textContent || '';
      var sel = node.querySelector('.ne-lang');
      if (sel) b.lang = sel.value || '';
    } else if (b.ty === 'math') {
      var ta = node.querySelector('.ne-tex');
      if (ta) b.tex = ta.value || '';
    } else if (b.ty === 'tbl') {
      var trs = node.querySelectorAll('tr');
      b.rows = [].map.call(trs, function (tr) {
        return [].map.call(tr.querySelectorAll('.ne-cell'), function (td) {
          var cell = { rt: B().readRuns(td) };
          var ca = td.getAttribute('data-cal');
          var cvv = td.getAttribute('data-cva');
          if (ca) cell.al = ca;
          if (cvv) cell.va = cvv;
          return cell;
        });
      });
      b.cols = b.rows[0] ? b.rows[0].length : 2;
    } else if (b.ty === 'img') {
      var inp = node.querySelector('.ne-img-url');
      if (inp) b.url = B().httpsOnly(inp.value);
      var alt = node.querySelector('.ne-img-alt');
      if (alt) b.alt = alt.value || '';
    }
  };

  /*@3.NOEJ.35*/
  function isDiagram(b) {
    return b && b.ty === 'code' && /^mermaid$/i.test(String(b.lang || '').trim());
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
    if (hit) { this.render(); this.touch(); }
    return hit;
  };

  Editor.prototype.render = function () {
    this._ancSeen = {};
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
    this.root.innerHTML = '';
    var frag = document.createDocumentFragment();
    this.doc.blocks.forEach(function (b) { frag.appendChild(self.renderBlock(b)); });
    frag.appendChild(this.renderTail());
    this.root.appendChild(frag);
    this.paintBlockSel();
    this.layoutFree();
    this.applyReadOnly();
    if (this.opts.onLayout) this.opts.onLayout();
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
      : this.root.querySelector(':scope > .ne-tail');
    if (!anchor) { this.render(); return; }
    this.root.insertBefore(frag, anchor);
    this.applyEng();
    this.applyReadOnly();
    if (this.opts.onLayout) this.opts.onLayout();
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
  function scanRt(rt, out) {
    if (!Array.isArray(rt)) return false;
    for (var i = 0; i < rt.length; i++) {
      if (rt[i] && typeof rt[i].s === 'string' && firstStrong(rt[i].s, out)) return true;
    }
    return false;
  }
  /*@3.NOEJ.183*/
  function blockContentDir(b) {
    if (!b || b.ty === 'code' || b.ty === 'math') return '';
    var out = { d: '' }, j, k;
    if (scanRt(b.rt, out)) return out.d;
    if (Array.isArray(b.items)) {
      for (j = 0; j < b.items.length && !out.d; j++) scanRt(b.items[j] && b.items[j].rt, out);
    }
    if (!out.d && Array.isArray(b.rows)) {
      for (j = 0; j < b.rows.length && !out.d; j++) {
        var row = b.rows[j] || [];
        for (k = 0; k < row.length && !out.d; k++) scanRt(row[k] && row[k].rt, out);
      }
    }
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
  function blockDir(b, d) {
    if (b.ty === 'code') return 'ltr';
    if (b.dir === 'rtl' || b.dir === 'ltr') return b.dir;
    return docDir(d);
  }

  Editor.prototype.applyStyleAttrs = function (wrap, b) {
    var bd = wrap.querySelector(':scope > .ne-body');
    if (bd) bd.setAttribute('dir', blockDir(b, this.doc));
    if (b.dir && b.dir !== 'auto') wrap.setAttribute('data-dir', b.dir);
    else wrap.removeAttribute('data-dir');
    if (b.al && b.al !== 'start') wrap.setAttribute('data-al', b.al);
    else wrap.removeAttribute('data-al');
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
      var lang = el('input', 'ne-lang', {
        type: 'text', value: b.lang || '', placeholder: L('اللغة', 'Language'),
        'aria-label': L('لغة الكود', 'Code language'), dir: 'ltr', spellcheck: 'false'
      });
      bar.appendChild(lang);
      body.appendChild(bar);
      var pre = el('pre', 'ne-code', {
        contenteditable: 'true', dir: 'ltr', spellcheck: 'false',
        'data-ph': L('اكتب الكود…', 'Type code…')
      });
      pre.textContent = b.src || '';
      body.appendChild(pre);
      paintCode(pre, b);
      /*@3.NOEJ.207*/
      if (isDiagram(b)) {
        var dOn = !!b.dgm;
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
        body.appendChild(dHost);
        pre.hidden = dOn;
        if (dOn) needMermaid().then(function (M) {
          if (M) M.render(dHost, b.src || '');
        });
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
      (b.rows || []).forEach(function (row) {
        var tr = el('tr');
        row.forEach(function (c) {
          var td = el('td', 'ne-cell', { contenteditable: 'true',
            dir: blockDir(b, dd), spellcheck: 'false' });
          /*@3.NOEJ.93*/
          if (c.al) td.setAttribute('data-cal', c.al);
          if (c.va) td.setAttribute('data-cva', c.va);
          td.innerHTML = B().runsToHtmlBidi(c.rt);
          tr.appendChild(td);
        });
        tbl.appendChild(tr);
      });
      body.appendChild(tbl);
      var tb = el('div', 'ne-tbl-bar');
      tb.innerHTML =
        '<button type="button" class="ne-mini" data-tbl="row+">' + L('+ صف', '+ Row') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="col+">' + L('+ عمود', '+ Col') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="row-">' + L('− صف', '− Row') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="col-">' + L('− عمود', '− Col') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="style">' + L('نمط الجدول', 'Table style') + '</button>' +
        '<button type="button" class="ne-mini" data-tbl="tone">' + L('لون الجدول', 'Table colour') + '</button>' +
        '<span class="ne-tbl-sep" aria-hidden="true"></span>' +
        '<button type="button" class="ne-mini ne-mini--sc" data-tbl="scope"' +
        ' aria-pressed="' + (b.csc === 'all' ? 'true' : 'false') + '">' +
        L(b.csc === 'all' ? 'كلُّ الخلايا' : 'الخليّة',
          b.csc === 'all' ? 'All cells' : 'This cell') + '</button>' +
        TBL_ALIGN.map(function (a) {
          return '<button type="button" class="ne-mini ne-mini--i" data-tbl="' + a.k + '"' +
            ' aria-label="' + B().esc(L(a.ar, a.en)) + '" title="' + B().esc(L(a.ar, a.en)) + '">' +
            '<i class="fa-solid ' + a.icon + '" aria-hidden="true"></i></button>';
        }).join('');
      body.appendChild(tb);

    } else if (b.ty === 'img') {
      body.appendChild(this.renderImg(b));

    } else if (b.ty === 'ink') {
      body.appendChild(this.renderInk(b));

    } else if (b.ty === 'hr') {
      body.appendChild(el('hr', 'ne-hr'));

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
    box.appendChild(fig);

    var edit = el('div', 'ne-img-edit');
    edit.hidden = !!B().httpsOnly(b.url);

    var urlIn = el('input', 'ne-img-url', {
      type: 'url', value: b.url || '', dir: 'ltr', spellcheck: 'false',
      placeholder: 'https://i.imgur.com/…',
      'aria-label': L('رابط الصورة المباشر', 'Direct image link')
    });
    edit.appendChild(urlIn);
    var unsBtn = el('button', 'ne-mini ne-img-uns', {
      type: 'button', 'data-imguns': '1',
      'aria-label': L('ابحثْ في أنسبلاش', 'Search Unsplash')
    });
    unsBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
      '<span>' + B().esc(L('ابحثْ في أنسبلاش', 'Unsplash')) + '</span>';
    edit.appendChild(unsBtn);

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
    edit.appendChild(capRow);

    /*@3.NOEJ.42*/
    var dims = [
      { k: 'iw', min: 20, max: 100, ar: 'الحجم', en: 'Size', d: 100 },
      { k: 'zm', min: 40, max: 320, ar: 'حجم الصورة داخل الإطار', en: 'Image size inside frame', d: 0 },
      { k: 'br', min: 20, max: 150, ar: 'السطوع', en: 'Brightness', d: 100 },
      { k: 'op', min: 15, max: 100, ar: 'الوضوح', en: 'Opacity', d: 100 }
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
      edit.appendChild(row);
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
    edit.appendChild(shRow);

    var rst = el('button', 'ne-mini', { type: 'button', 'data-imgr': '1' });
    rst.textContent = L('إعادة للأصل', 'Reset');
    edit.appendChild(rst);

    var hint = el('p', 'ne-hint');
    hint.innerHTML = L(
      'الصق رابطاً مباشراً للصورة. وللتصدير إلى PDF يلزم مستضيفٌ يأذن بقراءتها — ' +
      '<a href="https://imgur.com" target="_blank" rel="noopener noreferrer">imgur</a> أو ' +
      '<a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a> يأذنان، ' +
      'و<span dir="ltr">i.ibb.co</span> و<span dir="ltr">postimg</span> يُعرضان ولا يُصدَّران. ' +
      'والصورةُ تُعرض من موقعها ولا تُحفظ عندنا — فلا تظهر بلا إنترنت، وموقعُها يرى اتّصالك.',
      'Paste a direct image link. Exporting to PDF needs a host that permits reading it — ' +
      '<a href="https://imgur.com" target="_blank" rel="noopener noreferrer">imgur</a> and ' +
      '<a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a> do; ' +
      'i.ibb.co and postimg show but will not export. ' +
      'The image is shown from its host and is not stored here — it will not appear offline, and that host can see your connection.');
    edit.appendChild(hint);

    box.appendChild(edit);
    applyImgStyle(fig, b);
    paintImg(view, b.url, b.alt);
    return box;
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
          b.shapes = d.shapes && d.shapes.length ? d.shapes : null;
          self.touch();
        },
        onState: function (st) { if (barUI) barUI.sync(st); }
      });
      var barUI = window.GardenCanvasBar ? GardenCanvasBar.mount(bar, cv) : null;
      self.canvases = self.canvases || {};
      self.canvases[b.id] = cv;
      cv.setTool('pen');
      if (b.ink || (b.shapes && b.shapes.length)) cv.load(b.ink, b.h, b.shapes);
      cv.emit();
    }, 0);

    return box;
  };

  function placeholderFor(b) {
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

  function paintImg(host, url, alt) {
    host.innerHTML = '';
    var u = B().httpsOnly(url);
    if (!u) return;
    var img = el('img', 'ne-img', {
      src: u, alt: alt || '', loading: 'lazy', referrerpolicy: 'no-referrer'
    });
    img.addEventListener('load', function () {
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
      host.innerHTML = '';
      var bad = el('div', 'ne-img-bad');
      bad.textContent = L('تعذّر تحميل الصورة من هذا الرابط.', 'Could not load the image from this link.');
      host.appendChild(bad);
    });
    host.appendChild(img);
  }

  /*@3.NOEJ.21*/
  function paintCode(pre, b) {
    if (!pre || !window.GardenNotesCode) return;
    if (document.activeElement === pre) return;
    var C = window.GardenNotesCode;
    if (!C.norm(b.lang)) { pre.textContent = b.src || ''; return; }
    C.paint(pre, b.src || '', b.lang);
  }

  /*@3.NOEJ.5*/
  function renderMath(host, tex) {
    host.textContent = tex ? ('\\[' + tex + '\\]') : '';
    if (!tex) return;
    if (window.GardenMath && GardenMath.typeset) {
      try { GardenMath.typeset(host); } catch (e) {}
    }
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
    this.insertAfter(afterId || this.lastBlockId(), nb);
    this.pushUndo(before);
    this.render();
    this.focusBlock(nb.id);
    this.touch();
    this.emitState();
    return nb.id;
  };

  Editor.prototype.lastBlockId = function () {
    var bs = this.doc.blocks;
    return bs.length ? bs[bs.length - 1].id : null;
  };

  Editor.prototype.convert = function (id, ty, lv) {
    var hit = this.blockAt(id);
    if (!hit) return;
    var before = this.snapshot();
    this.readBlock(this.root.querySelector('[data-bid="' + id + '"]'));
    var old = hit.b;
    if (old.ty === ty && (ty !== 'h' || (old.lv || 2) === (lv || 2))) return;
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
    this.doc.blocks[hit.i] = nb;
    this.pushUndo(before);
    this.render();
    this.focusBlock(nb.id);
    this.touch();
    this.emitState();
  };

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

  Editor.prototype.remove = function (id) {
    var hit = this.blockAt(id);
    if (!hit) return;
    var before = this.snapshot();
    this.doc.blocks.splice(hit.i, 1);
    if (!this.doc.blocks.length) this.doc.blocks.push(B().blank('p'));
    this.pushUndo(before);
    this.render();
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
    this.render();
    this.focusBlock(id);
    var node = this.root.querySelector('[data-bid="' + id + '"]');
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
    this.render();
    this.focusBlock(copy.id);
    this.touch();
    this.emitState();
  };

  /*@3.NOEJ.33*/
  Editor.prototype.blockSel = function () {
    if (!this._bsel) this._bsel = {};
    return this._bsel;
  };

  Editor.prototype.selectedBlocks = function () {
    var sel = this.blockSel(), out = [];
    for (var i = 0; i < this.doc.blocks.length; i++) {
      if (sel[this.doc.blocks[i].id]) out.push({ b: this.doc.blocks[i], i: i });
    }
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
    var edges = ['s', 'e'].map(function (sd) {
      return el('button', 'ne-wgrip', {
        type: 'button', tabindex: '-1', 'data-side': sd,
        'aria-label': L('اسحبْ لضبط العرض', 'Drag to set the width')
      });
    });
    this._chrome = { rail: rail, tick: tick, spin: spin, edges: edges, host: null };
    return this._chrome;
  };

  Editor.prototype.chromeTo = function (node) {
    var c = this.ensureChrome();
    if (c.host === node) return;
    c.host = node || null;
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
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return null;
    var r = sel.getRangeAt(0);
    if (!edn.contains(r.startContainer)) return null;
    var at = offsetIn(edn, r.startContainer, r.startOffset);
    var txt = edn.textContent || '';
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
    var x1 = rr.left + rect.x, y1 = rr.top + rect.y;
    var x2 = x1 + rect.w, y2 = y1 + rect.h;
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
    var nodes = this.root.querySelectorAll(':scope > [data-bid]');
    for (var i = nodes.length - 1; i >= 0; i--) {
      var b = nodes[i].getBoundingClientRect();
      if (rr.left + x >= b.left && rr.left + x <= b.right &&
          rr.top + y >= b.top && rr.top + y <= b.bottom) {
        return nodes[i].getAttribute('data-bid');
      }
    }
    return null;
  };

  Editor.prototype.setSelectMode = function (on, tell) {
    this._selMode = !!on;
    this.root.setAttribute('data-selmode', this._selMode ? '1' : '0');
    if (!this._selMode) this.clearBlockSel();
    this.paintSelHint();
    /*@3.NOEJ.163*/
    if (tell && this.opts.onSelMode) this.opts.onSelMode(this._selMode);
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
        B().esc(L('حدّدِ الكلّ', 'Select all')) + '</button>';
      host.insertBefore(bar, this.root);
      var self = this;
      bar.addEventListener('click', function (e) {
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
    var sel = this.blockSel();
    for (var i = 0; i < this.doc.blocks.length; i++) sel[this.doc.blocks[i].id] = 1;
    this.paintBlockSel();
    this.emitState();
  };

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

  Editor.prototype.deleteBlocks = function () {
    var picked = this.selectedBlocks();
    if (!picked.length) return 0;
    var before = this.snapshot();
    for (var i = picked.length - 1; i >= 0; i--) this.doc.blocks.splice(picked[i].i, 1);
    if (!this.doc.blocks.length) this.doc.blocks.push(B().blank('p'));
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
    node.style.left = ''; node.style.right = '';
    node.style.insetInlineStart = Math.round(b.fp.x * W) + 'px';
    node.style.top = Math.round(b.fp.y) + 'px';
    /*@3.NOEJ.65*/
    /*@3.NOEJ.135*/
    node.style.zIndex = String((b.zi ? 31 : 4) + (b.z || 0));
    /*@3.NOEJ.123*/
    node.style.transform = b.rot ? ('rotate(' + b.rot + 'deg)') : '';
    node.style.transformOrigin = b.rot ? 'center center' : '';
    /*@3.NOEJ.57*/
    this.applyWidth(node, b);
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
        if (n) out.push({ b: o, node: n, ox: o.fp.x || 0, oy: o.fp.y || 0 });
      }
    }
    if (out.length > 1) return out;
    n = this.root.querySelector('[data-bid="' + b.id + '"]');
    return [{ b: b, node: n, ox: b.fp.x || 0, oy: b.fp.y || 0 }];
  };

  Editor.prototype.fpUnder = function (b, id) {
    var x = b.fp.x;
    var y = b.fp.y + this.freeH(id) + 8;
    /*@3.NOEJ.67*/
    for (var guard = 0; guard < 40; guard++) {
      var hit = null;
      for (var i = 0; i < this.doc.blocks.length; i++) {
        var o = this.doc.blocks[i];
        if (!o.fp || o.id === id) continue;
        if (Math.abs((o.fp.x || 0) - x) > 0.22) continue;
        if (Math.abs((o.fp.y || 0) - y) > 14) continue;
        hit = o;
        break;
      }
      if (!hit) break;
      y = hit.fp.y + this.freeH(hit.id) + 8;
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
      list[i][1].style.left = '';
    }
    this.doc.fpv = 2;
  };

  /*@3.NOEJ.154*/
  Editor.prototype.captureEng = function () {
    if (this.doc.kind === 'board') return;
    /*@3.NOEJ.213*/
    if (!this._engStale && this.doc.eng && this.doc.eng.pbv === PBV) return;
    /*@3.NOEJ.157*/
    var faceOk = true;
    try {
      faceOk = document.fonts.status === 'loaded' &&
               document.fonts.check('16px "Thmanyah Sans"');
    } catch (eF) {}
    if (!faceOk) { this._engRecap = true; return; }
    /*@3.NOEJ.158*/
    var a = [], n = 0, i, b, node;
    var hgt = [], nds = [];
    this.root.style.minBlockSize = '';
    for (i = 0; i < this.doc.blocks.length; i++) {
      b = this.doc.blocks[i];
      node = b.fp ? null : this.root.querySelector(':scope > [data-bid="' + b.id + '"]');
      if (!node) { a.push(null); hgt.push(0); nds.push(null); continue; }
      a.push(Math.round(node.offsetTop));
      hgt.push(node.offsetHeight);
      nds.push(node);
      n++;
    }
    if (!n) { delete this.doc.eng; return; }
    /*@3.NOEJ.208*/
    var oldA = (this.doc.eng && this.doc.eng.v === 2 &&
                Array.isArray(this.doc.eng.a) &&
                this.doc.eng.a.length === a.length) ? this.doc.eng.a : null;
    var oldPb = (this.doc.eng && Array.isArray(this.doc.eng.pb) &&
                 this.doc.eng.pb.length === a.length) ? this.doc.eng.pb : null;
    var pb = this.breakGuard(a, hgt, nds);
    /*@3.NOEJ.182*/
    var cd = contentDir(this.doc);
    if (cd) this.doc.bd = cd; else delete this.doc.bd;
    var pad0 = this.root.offsetTop || 16;
    var docH = Math.max(Math.round(this.root.offsetHeight),
                        Math.round(this._engBot + pad0));
    this.doc.eng = { v: 2, w: 794, h: docH, a: a, pb: pb, pbv: PBV };
    this._engStale = false;
    /*@3.NOEJ.209*/
    if (this.opts.onEngShift && oldA) {
      var off = this.root.offsetTop || 0, regs = [], any = false;
      for (i = 0; i < a.length; i++) {
        if (oldA[i] == null) continue;
        var dz = pb[i] - (oldPb ? oldPb[i] : 0);
        if (!regs.length || regs[regs.length - 1].by !== dz) {
          regs.push({ from: oldA[i] + off, by: dz });
        }
        if (dz) any = true;
      }
      if (any) this.opts.onEngShift(regs);
    }
    this.applyEng();
  };

  Editor.prototype.breakGuard = function (a, hgt, nds) {
    var ph = this.pageH(), off = this.root.offsetTop || 0;
    var pad = off > 0 ? off : 16;
    var room = ph - pad * 2;
    var acc = 0, pb = [], i;
    this._engBot = 0;
    for (i = 0; i < a.length; i++) {
      if (a[i] == null) { pb.push(acc); continue; }
      a[i] += acc;
      var top = a[i] + off, h = hgt[i] || 0;
      var pg = Math.floor(top / ph);
      var limit = (pg + 1) * ph - pad;
      var d = 0;
      if (h > 0 && top + h > limit + 0.5) {
        if (h <= room * 0.5) {
          /*@3.NOEJ.215*/
          d = (pg + 1) * ph + pad - top;
        } else if (h <= room) {
          d = (pg + 1) * ph + pad - top;
        } else {
          /*@3.NOEJ.216*/
          var lh = lineOf(nds && nds[i]);
          if (lh > 4) {
            var over = (limit - top) % lh;
            if (over > 0.5) d = lh - over;
          }
        }
      }
      if (d > 0) { a[i] += d; acc += d; }
      if (a[i] + h > this._engBot) this._engBot = a[i] + h;
      pb.push(acc);
    }
    return pb;
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
    var nodes = this.root.querySelectorAll(':scope > [data-bid]');
    var i, node, tgt, dY;
    /*@3.NOEJ.159*/
    var arr = (eng && eng.v === 2 && Array.isArray(eng.a) &&
               eng.a.length === this.doc.blocks.length) ? eng.a : null;
    var map = (eng && !arr && eng.y) ? eng.y : null;
    if (this._engStale || !eng || (!arr && !map) || eng.w !== 794 ||
        this.doc.kind === 'board') {
      if (!this._engOn) return;
      this._engOn = false;
      for (i = 0; i < nodes.length; i++) nodes[i].style.translate = '';
      this.root.style.minBlockSize = '';
      return;
    }
    this._engOn = true;
    var at = {};
    for (i = 0; i < nodes.length; i++) at[nodes[i].getAttribute('data-bid')] = nodes[i];
    /*@3.NOEJ.203*/
    var n = this.doc.blocks.length, hit = new Array(n), tops = new Array(n);
    for (i = 0; i < n; i++) {
      node = at[this.doc.blocks[i].id];
      hit[i] = (node && !node.hasAttribute('data-fp')) ? node : null;
      tops[i] = hit[i] ? hit[i].offsetTop : 0;
    }
    for (i = 0; i < n; i++) {
      node = hit[i];
      if (!node) continue;
      tgt = arr ? arr[i] : map[this.doc.blocks[i].id];
      if (tgt == null) { node.style.translate = ''; continue; }
      dY = Math.round((tgt - tops[i]) * 10) / 10;
      node.style.translate = (dY > 0.6 || dY < -0.6) ? ('0 ' + dY + 'px') : '';
    }
    this.root.style.minBlockSize = (eng.h > 0) ? (eng.h + 'px') : '';
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
  Editor.prototype.addFree = function (ty, xPx, yPx, extra, prov) {
    var W = this.sheetW();
    xPx = Math.max(0, xPx - 6);
    yPx = Math.max(0, yPx - 12);
    var x = Math.max(0, Math.min(0.92, xPx / W));
    var b = B().blank(ty, extra);
    /*@3.NOEJ.58*/
    b.fp = { x: x, y: Math.max(0, Math.round(yPx)) };
    /*@3.NOEJ.68*/
    if (b.wm == null) b.wm = WIDE[ty] ? 'full' : 'fit';
    b.z = this.topZ() + 1;
    var before = this.snapshot();
    this.readAll();
    this.doc.blocks.push(b);
    /*@3.NOEJ.104*/
    if (prov) { b.prov = 1; this._provBefore = before; }
    else this.pushUndo(before);
    this.render();
    this.layoutFree();
    this.focusBlock(b.id);
    if (!prov) this.touch();
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
    this.render();
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
    var before = this._provBefore;
    this._provBefore = null;
    if (before != null) this.pushUndo(before);
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
    this._provBefore = null;
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
    var node = this.root.querySelector('[data-bid="' + id + '"]');
    if (!node) return;
    var t = node.querySelector('.ne-text, .ne-li, .ne-code, .ne-tex, .ne-img-url, .ne-cell');
    if (!t) return;
    t.focus();
    if (t.isContentEditable && atEnd !== false) {
      var r = document.createRange();
      r.selectNodeContents(t); r.collapse(false);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
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
      var rows = [].slice.call(node.querySelectorAll('tr'));
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

  Editor.prototype.exec = function (cmd, val) {
    var bid = this.activeBid();
    switch (cmd) {
      case 'undo': return this.hist ? this.hist.undo() : this.doUndo();
      case 'redo': return this.hist ? this.hist.redo() : this.doRedo();
      case 'bold': return this.applyMark('b', 1);
      case 'italic': return this.applyMark('i', 1);
      case 'underline': return this.applyMark('u', 1);
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
      case 'dir': return this.setBlockStyle('dir', val);
      case 'align':
        if (this.cellNode()) return this.setCellAlign('h', val === 'start' ? '' : val, null);
        return this.setBlockStyle('al', val);
      case 'font': {
        var ednF = this.currentEditable();
        var bnd = ednF ? this.selBounds(ednF) : null;
        if (ednF && bnd && bnd[0] !== bnd[1]) return this.applyMarkForce(ednF, 'ff', val || '');
        return this.setBlockStyle('ff', val);
      }
      case 'fsize': {
        var ednZ = this.currentEditable();
        var bz = ednZ ? this.selBounds(ednZ) : null;
        if (ednZ && bz && bz[0] !== bz[1]) {
          var v = parseFloat(val);
          return this.applyMarkForce(ednZ, 'fz',
            (val === '' || !isFinite(v) || v <= 0) ? '' : Math.max(8, Math.min(96, v)));
        }
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
      for (var i = 0; i < eds.length; i++) eds[i].setAttribute('dir', blockDir(hit.b, self.doc));
    });
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  /*@3.NOEJ.95*/
  var FMT_MARKS = ['b', 'i', 'u', 'st', 'c', 'fg', 'hl'];
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
        if (a === b) return false;
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
    for (var j = 0; j < FMT_BLOCK.length; j++) {
      var key = FMT_BLOCK[j];
      if (blk[key]) hit.b[key] = blk[key]; else delete hit.b[key];
    }
    var live = this.root.querySelector('[data-bid="' + hit.b.id + '"]');
    if (live) this.applyStyleAttrs(live, hit.b);
    if (blk.ty && (blk.ty !== hit.b.ty || (blk.ty === 'h' && (blk.lv || 0) !== (hit.b.lv || 0)))) {
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
    var r = anchor.getBoundingClientRect();
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

  Editor.prototype.openMenu = function (id, anchor, kind) {
    var self = this;
    this.closeMenu();
    var mode = kind || 'insert';
    var m = el('div', 'ne-menu');
    m.setAttribute('role', 'menu');
    m.setAttribute('dir', isAr() ? 'rtl' : 'ltr');

    var html = '';
    if (mode === 'block') {
      var hit = this.blockAt(id);
      var bb0 = hit ? hit.b : null;
      var i = hit ? hit.i : 0;
      var last = this.doc.blocks.length - 1;
      html += '<div class="ne-menu-h">' + B().esc(L('هذه الكتلة', 'This block')) + '</div>';
      html += mItem('up', 'fa-arrow-up', L('تحريك لأعلى', 'Move up'), i <= 0);
      html += mItem('down', 'fa-arrow-down', L('تحريك لأسفل', 'Move down'), i >= last);
      /*@3.NOEJ.130*/
      if (bb0 && LISTY[bb0.ty]) {
        html += '<div class="ne-menu-h">' + B().esc(L('شكلُ العلامة', 'Marker style')) + '</div>';
        var lsNow = bb0.ls || (bb0.ty === 'ol' ? 'num' : 'dot');
        var lsOpts = bb0.ty === 'ol'
          ? [['num', '1. 2. 3.'], ['arnum', '\u0661. \u0662. \u0663.'],
             ['abjad', '\u0623- \u0628- \u062C-'], ['roman', 'i. ii. iii.']]
          : [['dot', L('نقطة \u2022', 'Dot \u2022')], ['dash', L('شرطة \u2013', 'Dash \u2013')],
             ['diamond', L('معيّن \u25C6', 'Diamond \u25C6')]];
        for (var lo = 0; lo < lsOpts.length; lo++) {
          html += mItem('ls:' + lsOpts[lo][0], 'fa-list-ol', lsOpts[lo][1],
                        false, lsNow === lsOpts[lo][0] ? 'is-on' : '');
        }
        html += mItem('lsb', 'fa-bold', L('علامةٌ بارزة', 'Bold marker'),
                      false, bb0.lsb ? 'is-on' : '');
      }
      /*@3.NOEJ.166*/
      html += mItem('sel', 'fa-square-check', L('تحديدُ الكتل', 'Select blocks'));
      html += mItem('dup', 'fa-clone', L('تكرار', 'Duplicate'));
      html += mItem('copy', 'fa-copy', L('نسخ', 'Copy'));
      html += mItem('paste', 'fa-paste', L('لصقٌ بعدها', 'Paste after'),
                    !clipAny());
      html += mItem('del', 'fa-trash', L('حذف', 'Delete'), false, 'ne-menu-i--danger');
      /*@3.NOEJ.79*/
      var bb = hit ? hit.b : null;
      var wm = bb ? bb.wm : null;
      html += '<div class="ne-menu-h">' + B().esc(L('العرض', 'Width')) + '</div>';
      html += mItem('w:full', 'fa-arrows-left-right-to-line', L('كامل السطر', 'Full width'),
                    false, wm === 'full' || (!bb.fp && wm == null) ? 'is-on' : '');
      html += mItem('w:fit', 'fa-arrows-left-right', L('بمقدار المحتوى', 'Fit the content'),
                    false, wm === 'fit' || (bb.fp && wm == null) ? 'is-on' : '');
      html += mItem('w:auto', 'fa-rotate-left', L('أعِدْه إلى الأصل', 'Reset the width'),
                    wm == null);
      if (bb && bb.fp) {
        var arM = isAr();
        html += '<div class="ne-menu-h">' + B().esc(L('الموضع', 'Position')) + '</div>';
        html += mItem('fx:start', arM ? 'fa-align-right' : 'fa-align-left',
                      L('إلى بداية السطر', 'To the start'));
        html += mItem('fx:center', 'fa-align-center', L('في المنتصف', 'Centred'));
        html += mItem('fx:end', arM ? 'fa-align-left' : 'fa-align-right',
                      L('إلى نهاية السطر', 'To the end'));
        html += '<div class="ne-menu-h">' + B().esc(L('الظهور', 'Stacking')) + '</div>';
        html += mItem('z:front', 'fa-arrow-up-wide-short', L('إلى المقدّمة', 'Bring to front'));
        html += mItem('z:up', 'fa-angle-up', L('خطوةً للأمام', 'Forward one step'));
        html += mItem('z:down', 'fa-angle-down', L('خطوةً للخلف', 'Backward one step'));
        html += mItem('z:back', 'fa-arrow-down-wide-short', L('إلى الخلف', 'Send to back'));
        html += mItem('anchor', 'fa-thumbtack', L('أعِدْها إلى التراتب', 'Return it to the order'));
      } else if (bb) {
        html += '<div class="ne-menu-h">' + B().esc(L('الموضع', 'Position')) + '</div>';
        html += mItem('free', 'fa-arrows-up-down-left-right',
                      L('اجعلها حرّةَ الموضع', 'Make it free-floating'));
      }
      html += '<div class="ne-menu-h">' + B().esc(L('حوّل إلى', 'Turn into')) + '</div>';
      html += TURN.map(function (it, k) {
        return mItem('turn:' + k, it.icon, L(it.ar, it.en));
      }).join('');
    } else {
      html += '<div class="ne-menu-h">' + B().esc(L('أضِف بعدها', 'Add after')) + '</div>';
      html += INSERT.map(function (it, k) {
        return mItem('ins:' + k, it.icon, L(it.ar, it.en));
      }).join('');
    }
    m.innerHTML = html;
    document.body.appendChild(m);
    this.placeMenu(m, anchor);
    this.menu = m;
    /*@3.NOEJ.54*/
    this.menuFor = id;

    var first = m.querySelector('.ne-menu-i:not([disabled])');
    if (first) first.focus();

    m.addEventListener('click', function (e) {
      var btn = e.target.closest('.ne-menu-i');
      if (!btn || btn.disabled) return;
      var act = btn.getAttribute('data-act');
      self.closeMenu();
      if (act.indexOf('ins:') === 0) {
        var it = INSERT[Number(act.slice(4))];
        if (it) self.addBlock(it.ty, id, it.lv);
      } else if (act.indexOf('turn:') === 0) {
        var t = TURN[Number(act.slice(5))];
        if (t) self.convert(id, t.ty, t.lv);
      } else if (act.indexOf('w:') === 0) {
        var wv = act.slice(2);
        self.setWidth(id, wv === 'auto' ? null : wv);
      } else if (act.indexOf('z:') === 0) {
        self.setZ(id, act.slice(2));
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
        self.toggleBlockSel(id, true);
        self._bselLast = id;
      }
      else if (act === 'dup') self.duplicate(id);
      else if (act === 'copy') { self.toggleBlockSel(id, true); self.copyBlocks(); }
      else if (act === 'paste') { self.toggleBlockSel(id, true); self.pasteBlocks(); }
      else if (act === 'del') self.remove(id);
    });
    /*@3.NOEJ.110*/
    var items = function () {
      return [].slice.call(m.querySelectorAll('.ne-menu-i:not([disabled])'))
               .filter(function (b) { return !b.hidden; });
    };
    var step = function (dir) {
      var list = items();
      if (!list.length) return;
      var at = list.indexOf(document.activeElement);
      var next = list[(at + dir + list.length + (at < 0 ? 1 : 0)) % list.length];
      if (next) next.focus();
    };
    var filter = '';
    var applyFilter = function () {
      var q = filter.toLowerCase();
      var shown = 0;
      [].forEach.call(m.querySelectorAll('.ne-menu-i'), function (b) {
        var txt = (b.textContent || '').toLowerCase();
        var hit = !q || txt.indexOf(q) >= 0;
        b.hidden = !hit;
        if (hit) shown++;
      });
      [].forEach.call(m.querySelectorAll('.ne-menu-h'), function (h) {
        var nx = h.nextElementSibling, any = false;
        while (nx && !nx.classList.contains('ne-menu-h')) {
          if (!nx.hidden) { any = true; break; }
          nx = nx.nextElementSibling;
        }
        h.hidden = !any;
      });
      m.setAttribute('data-q', filter);
      var first = items()[0];
      if (first) first.focus();
      return shown;
    };
    m.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault(); self.closeMenu(); self.focusBlock(id); return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); step(e.key === 'ArrowDown' ? 1 : -1); return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        var list = items();
        if (list.length) list[e.key === 'Home' ? 0 : list.length - 1].focus();
        return;
      }
      if (e.key === 'Backspace') {
        if (!filter) return;
        e.preventDefault(); filter = filter.slice(0, -1); applyFilter(); return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault(); filter += e.key; applyFilter(); return;
      }
    });
  };

  function mItem(act, icon, label, disabled, extra) {
    return '<button type="button" class="ne-menu-i' + (extra ? ' ' + extra : '') +
      '" role="menuitem" data-act="' + act + '"' + (disabled ? ' disabled' : '') + '>' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span>' + B().esc(label) + '</span></button>';
  }

  /*@3.NOEJ.202*/
  Editor.prototype.closeImgPanels = function (keep) {
    if (!this.root) return;
    var list = this.root.querySelectorAll('.ne-img-edit');
    for (var i = 0; i < list.length; i++) {
      var pan = list[i];
      if (pan.hidden) continue;
      if (keep && keep.contains(pan)) continue;
      var url = pan.querySelector('.ne-img-url');
      if (url && !String(url.value || '').trim()) continue;
      pan.hidden = true;
    }
  };

  Editor.prototype.closeMenu = function () {
    if (this.menu) { this.menu.remove(); this.menu = null; }
    this.menuFor = null;
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
    this.render();
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
    this.render();
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
    this.render();
    this.focusBlock(np.id);
    this.touch();
    this.emitState();
  };


  function keyOf(e) {
    var I = window.GardenInkInput;
    return (I && I.keyOf) ? I.keyOf(e) : String(e.key || '').toLowerCase();
  }

  Editor.prototype.bind = function () {
    var self = this;
    var root = this.root;

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
        if (hit) paintCode(e.target, hit.b);
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
        if (h2) e.target.textContent = h2.b.src || '';
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

    root.addEventListener('beforeinput', function (e) {
      var bn = e.target.closest ? e.target.closest('[data-bid]') : null;
      if (bn) self.typeGroup(bn.getAttribute('data-bid'));
    });

    root.addEventListener('input', function (e) {
      var node = e.target.closest('[data-bid]');
      if (node) { self.readBlock(node); self.commitProv(node.getAttribute('data-bid')); }
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
        var hitL = self.blockAt(node.getAttribute('data-bid'));
        var preL = node.querySelector('.ne-code');
        if (hitL && preL && document.activeElement !== preL) paintCode(preL, hitL.b);
      }
      self.touch();
    });

    /*@3.NOEJ.201*/
    root.addEventListener('pointerover', function (e) {
      if (self._drag || self._bdrag || self._wdrag || self._rdrag) return;
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('.ne-rail') || t.closest('.ne-rgrip') || t.closest('.ne-wgrip')) return;
      var nb = t.closest(':scope > [data-bid]');
      if (!nb) {
        nb = t.closest('[data-bid]');
        while (nb && nb.parentNode !== root) nb = nb.parentNode.closest ? nb.parentNode.closest('[data-bid]') : null;
      }
      if (nb && nb.parentNode === root) self.chromeTo(nb);
    });

    root.addEventListener('pointerleave', function () {
      if (self._drag || self._bdrag || self._wdrag || self._rdrag) return;
      self.chromeTo(null);
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
        self.dropProv();
        var lp = self.localPoint(e.clientX, e.clientY);
        if (lp.y > 0) self.addFree('p', lp.x, lp.y, null, 1);
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

      /*@3.NOEJ.36*/
      if (self._selMode || e.ctrlKey || e.metaKey || e.shiftKey) {
        if (e.target.closest('.ne-plus')) { self.openMenu(id, e.target.closest('.ne-plus'), 'insert'); return; }
        e.preventDefault();
        if (e.shiftKey && self._bselLast) self.selectBlockRange(id);
        else { self.toggleBlockSel(id, !(self._selMode || e.ctrlKey || e.metaKey)); self._bselLast = id; }
        return;
      }
      if (self.selectedBlocks().length) self.clearBlockSel();

      var grip = e.target.closest('.ne-grip');
      if (grip) { self.openMenu(id, grip, 'block'); return; }
      var plus = e.target.closest('.ne-plus');
      if (plus) { self.openMenu(id, plus, 'insert'); return; }

      var cb = e.target.closest('.ne-check');
      if (cb) {
        var on = cb.getAttribute('aria-checked') === 'true';
        cb.setAttribute('aria-checked', on ? 'false' : 'true');
        self.readBlock(node);
        self.touch();
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

      var dgb = e.target.closest('[data-dgm]');
      if (dgb) {
        var hitD = self.blockAt(id);
        if (!hitD) return;
        hitD.b.dgm = hitD.b.dgm ? 0 : 1;
        if (!hitD.b.dgm) delete hitD.b.dgm;
        self.render();
        self.touch();
        return;
      }

      var imf = e.target.closest('.ne-fig');
      if (imf && imf.getAttribute('data-sh') === 'circle' && self._imgDragged) {
        self._imgDragged = false;
        return;
      }
      if (imf && !e.target.closest('.ne-cap')) {
        var pan = node.querySelector('.ne-img-edit');
        if (pan) pan.hidden = !pan.hidden;
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
      var imc = e.target.closest('[data-imgc]');
      if (imc) {
        var hitC = self.blockAt(id);
        if (!hitC) return;
        hitC.b.cap = hitC.b.cap ? 0 : 1;
        imc.setAttribute('aria-pressed', hitC.b.cap ? 'true' : 'false');
        imc.innerHTML = '<i class="fa-solid fa-' + (hitC.b.cap ? 'eye' : 'eye-slash') +
          '" aria-hidden="true"></i>';
        var capC = node.querySelector('.ne-cap');
        if (capC) capC.hidden = !(hitC.b.cap && capC.textContent);
        self.touch();
        return;
      }
      var ims = e.target.closest('[data-imgs]');
      if (ims) {
        var hitS = self.blockAt(id);
        if (!hitS) return;
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

      if (e.key === 'Enter' && !e.shiftKey && TEXTY[b.ty]) {
        e.preventDefault();
        var before = self.snapshot();
        self.readBlock(node);
        var nb = B().blank(b.ty === 'h' ? 'p' : b.ty);
        if (b.ty === 'todo') nb.done = 0;
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
        /*@3.NOEJ.152*/
        var nbAt = self.blockAt(nb.id);
        if (nbAt) self.renderInsert(nbAt.i, [nb]); else self.render();
        self.focusBlock(nb.id);
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

    root.addEventListener('paste', function (e) {
      var node = e.target.closest('[data-bid]');
      if (!node) return;
      /*@3.NOEJ.4*/
      if (e.target.classList.contains('ne-code') ||
          e.target.classList.contains('ne-tex')) {
        /*@3.NOEJ.137*/
        e.preventDefault();
        var flatTxt = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
        if (flatTxt) {
          try { document.execCommand('insertText', false, flatTxt); }
          catch (ep) {
            e.target.textContent += flatTxt;
          }
        }
        return;
      }
      if (e.target.tagName === 'INPUT') return;

      e.preventDefault();
      needEmoji().then(function () { self.emojiSweep(); });
      var res = SAN().fromClipboard(e.clipboardData);
      if (res.rejectedImage) {
        if (self.opts.onImagePaste) self.opts.onImagePaste();
        return;
      }
      var blocks = res.blocks || [];
      /*@3.NOEJ.96*/
      var hasHtml = false;
      try { hasHtml = !!(e.clipboardData && e.clipboardData.getData('text/html')); } catch (eh) {}
      if (!hasHtml) {
        var flat = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
        if (flat && B().looksMarkdown && B().looksMarkdown(flat)) {
          blocks = B().fromMarkdown(flat);
        }
      }
      if (!blocks.length) return;
      /*@3.NOEJ.186*/
      self.stampDir(blocks);

      var before = self.snapshot();
      self.readBlock(node);
      var id = node.getAttribute('data-bid');
      var hit = self.blockAt(id);
      var at = hit ? hit.i + 1 : self.doc.blocks.length;

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
        self.doc.blocks.splice(hit.i, 1);
        at = hit.i;
      }
      if (host) {
        var py = host.fp.y, px = host.fp.x, zTop = self.topZ();
        for (var q = 0; q < blocks.length; q++) {
          blocks[q].fp = { x: px, y: py };
          blocks[q].wm = host.wm || 'fit';
          blocks[q].z = zTop + 1 + q;
          py += 34;
        }
      }
      for (var i = 0; i < blocks.length; i++) self.doc.blocks.splice(at + i, 0, blocks[i]);
      self.pushUndo(before);
      /*@3.NOEJ.149*/
      if (hit && self.doc.blocks.indexOf(hit.b) === -1) {
        var goneN = self.root.querySelector(':scope > [data-bid="' + hit.b.id + '"]');
        if (goneN) goneN.remove();
      }
      self.renderInsert(at, blocks);
      if (host) self.layoutFree();
      self.focusBlock(blocks[blocks.length - 1].id);
      self.touch();
      self.emitState();
    });

    /*@3.NOEJ.143*/
    root.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
    });
    root.addEventListener('drop', function (e) { e.preventDefault(); });

    this._onDocClick = function (e) {
      if (self.menu && !e.target.closest('.ne-menu') &&
          !e.target.closest('.ne-grip') && !e.target.closest('.ne-plus')) {
        self.closeMenu();
      }
      self.closeImgPanels(e.target.closest('.ne-b[data-ty="img"]'));
    };
    document.addEventListener('click', this._onDocClick);

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
    root.addEventListener('pointerdown', function (e) {
      var rg = e.target.closest('.ne-rgrip');
      if (!rg) return;
      var rnode = rg.closest('[data-bid][data-fp]');
      var rhit = rnode ? self.blockAt(rnode.getAttribute('data-bid')) : null;
      if (!rhit) return;
      var rr = rnode.getBoundingClientRect();
      var cx = rr.left + rr.width / 2, cy = rr.top + rr.height / 2;
      D = { spin: 1, b: rhit.b, node: rnode, cx: cx, cy: cy,
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
      var side = wg.getAttribute('data-side') === 's' ? 's' : 'e';
      if (side === 's' && !whit.b.fp) return;
      D = { wide: 1, side: side, b: whit.b, node: wnode, W: WW,
            sgn: self.isRtl() ? -1 : 1, x: e.clientX,
            ow: (wnode.offsetWidth || wnode.getBoundingClientRect().width) / WW,
            ox: whit.b.fp ? (whit.b.fp.x || 0) : 0,
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
        var ang = Math.atan2(e.clientY - D.cy, e.clientX - D.cx) * 180 / Math.PI;
        var next = D.r0 + (ang - D.a0);
        if (e.shiftKey) next = Math.round(next / 15) * 15;
        D.b.rot = Math.round(next * 10) / 10;
        D.node.style.transform = 'rotate(' + D.b.rot + 'deg)';
        D.node.style.transformOrigin = 'center center';
        D.moved = true;
        return;
      }
      if (D.wide) {
        e.preventDefault();
        var zw = self.zoomOf();
        var dw = D.sgn * (e.clientX - D.x) / (zw * D.W);
        if (D.side === 's' && D.b.fp) {
          var nx = Math.max(0, Math.min(0.96, D.ox + dw));
          D.b.wm = Math.max(0.06, Math.min(1 - nx, D.ow - (nx - D.ox)));
          D.b.fp.x = nx;
        } else {
          var room = D.b.fp ? Math.max(0.08, 1 - (D.b.fp.x || 0)) : 1;
          D.b.wm = Math.max(0.06, Math.min(room, D.ow + dw));
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
        for (gi = 0; gi < D.grp.length; gi++) {
          g = D.grp[gi];
          gw = (g.node.offsetWidth || 120) / D.W;
          lo = Math.max(lo, -g.ox);
          hi = Math.min(hi, Math.max(0.04, 1 - gw) - g.ox);
          dLo = Math.max(dLo, -g.oy);
        }
        if (lo > hi) hi = lo;
        dxN = Math.max(lo, Math.min(hi, dxN));
        dyN = Math.max(dLo, dyN);
        for (gi = 0; gi < D.grp.length; gi++) {
          g = D.grp[gi];
          g.b.fp.x = g.ox + dxN;
          g.b.fp.y = Math.max(0, Math.round(g.oy + dyN));
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
        if (D.moved) { self.pushUndo(D.snap); self.touch(); self.emitState(); }
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
    this.closeMenu();
    this.closeMention();
    /*@3.NOEJ.142*/
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
    /*@3.NOEJ.179*/
    if (this._blurT) { clearTimeout(this._blurT); this._blurT = null; }
    for (var cid in (this.canvases || {})) {
      try { this.canvases[cid].destroy(); } catch (e) {}
    }
    this.canvases = {};
    document.removeEventListener('click', this._onDocClick);
    document.removeEventListener('selectionchange', this._onSelChange);
    /*@3.NOEJ.167*/
    document.removeEventListener('pointermove', this._onBdragMove);
    document.removeEventListener('pointerup', this._onBdragStop);
    document.removeEventListener('pointercancel', this._onBdragStop);
    window.removeEventListener('scroll', this._onScroll, true);
  };

  var TBL_ALIGN = [
    { k: 'ah:start',  icon: 'fa-align-left',    ar: 'كلُّ الخلايا إلى البداية', en: 'All cells to start' },
    { k: 'ah:center', icon: 'fa-align-center',  ar: 'توسيطُ كلِّ الخلايا',      en: 'Centre all cells' },
    { k: 'ah:end',    icon: 'fa-align-right',   ar: 'كلُّ الخلايا إلى النهاية', en: 'All cells to end' },
    { k: 'av:top',    icon: 'fa-angles-up',     ar: 'كلُّ الخلايا إلى الأعلى',  en: 'All cells to top' },
    { k: 'av:middle', icon: 'fa-bars',          ar: 'توسيطٌ عموديّ',            en: 'Middle vertically' },
    { k: 'av:bottom', icon: 'fa-angles-down',   ar: 'كلُّ الخلايا إلى الأسفل',  en: 'All cells to bottom' }
  ];

  Editor.prototype.cellNode = function () {
    var edn = this.currentEditable();
    return (edn && edn.classList.contains('ne-cell')) ? edn : null;
  };

  /*@3.NOEJ.107*/
  Editor.prototype.setCellAlign = function (axis, val, fallback, all) {
    var td = this.cellNode();
    var node = td ? td.closest('[data-bid]') : null;
    if (!node && fallback) {
      node = this.root.querySelector('[data-bid="' + fallback + '"]');
    }
    if (!node) return false;
    var hit = this.blockAt(node.getAttribute('data-bid'));
    if (!hit || hit.b.ty !== 'tbl') return false;
    var before = this.snapshot();
    this.readBlock(node);
    var attr = axis === 'v' ? 'data-cva' : 'data-cal';
    var key = axis === 'v' ? 'va' : 'al';
    var cells = (all || !td) ? [].slice.call(node.querySelectorAll('.ne-cell')) : [td];
    var rows = [].slice.call(node.querySelectorAll('tr'));
    cells.forEach(function (c) {
      if (val) c.setAttribute(attr, val); else c.removeAttribute(attr);
      var tr = c.closest('tr');
      var ri = rows.indexOf(tr);
      var ci = [].slice.call(tr.querySelectorAll('.ne-cell')).indexOf(c);
      var cell = hit.b.rows && hit.b.rows[ri] && hit.b.rows[ri][ci];
      if (!cell) return;
      if (val) cell[key] = val; else delete cell[key];
    });
    this.pushUndo(before);
    this.touch();
    this.emitState();
    return true;
  };

  Editor.prototype.tableOp = function (id, op) {
    var hitS = this.blockAt(id);
    var scope = (hitS && hitS.b.csc === 'all');
    if (op.indexOf('ah:') === 0) return this.setCellAlign('h', op.slice(3), id, scope);
    if (op.indexOf('av:') === 0) return this.setCellAlign('v', op.slice(3), id, scope);
    if (op === 'scope') {
      if (!hitS || hitS.b.ty !== 'tbl') return;
      hitS.b.csc = scope ? 'one' : 'all';
      var nodeS = this.root.querySelector('[data-bid="' + id + '"]');
      var btnS = nodeS && nodeS.querySelector('[data-tbl="scope"]');
      if (btnS) {
        btnS.textContent = L(scope ? 'الخليّة' : 'كلُّ الخلايا',
                             scope ? 'This cell' : 'All cells');
        btnS.setAttribute('aria-pressed', scope ? 'false' : 'true');
      }
      this.touch();
      return true;
    }
    var hit = this.blockAt(id);
    if (!hit || hit.b.ty !== 'tbl') return;
    var before = this.snapshot();
    this.readBlock(this.root.querySelector('[data-bid="' + id + '"]'));
    var b = hit.b;
    var cols = b.rows[0] ? b.rows[0].length : 2;
    if (op === 'row+') {
      var r = []; for (var i = 0; i < cols; i++) r.push({ rt: [] });
      b.rows.push(r);
    } else if (op === 'row-' && b.rows.length > 1) {
      b.rows.pop();
    } else if (op === 'col+') {
      b.rows.forEach(function (row) { row.push({ rt: [] }); });
    } else if (op === 'col-' && cols > 1) {
      b.rows.forEach(function (row) { row.pop(); });
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
    this.render();
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

  window.GardenNotesEditor = { PBV: PBV,
    mount: function (host, doc, opts) { return new Editor(host, doc, opts); },
    hasClip: function () { return clipAny(); },
    MENU: MENU,
    TURN: TURN,
    INSERT: INSERT
  };
})();
