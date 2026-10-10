;(function () {
  'use strict';

  var TAB_LS = 'garden_ink_panel_tab', POS_LS = 'garden_ink_panel_pos';
  var TABS = [
    { k: 'tools', icon: 'fa-pen-ruler', ar: 'الأدوات', en: 'Tools' },
    { k: 'binds', icon: 'fa-keyboard', ar: 'الأزرار', en: 'Buttons' },
    { k: 'device', icon: 'fa-laptop', ar: 'هذا الجهاز', en: 'This device' },
    { k: 'custom', icon: 'fa-sliders', ar: 'التخصيص', en: 'Customise' }
  ];
  var TOOLS = [
    { k: 'pen', icon: 'fa-pen', ar: 'قلم', en: 'Pen' },
    { k: 'hi', icon: 'fa-highlighter', ar: 'تظليل', en: 'Highlight' },
    { k: 'era', icon: 'fa-eraser', ar: 'ممحاة', en: 'Eraser' },
    { k: 'hand', icon: 'fa-hand', ar: 'تمرير', en: 'Scroll' },
    { k: 'lasso', icon: 'fa-draw-polygon', ar: 'لاسو', en: 'Lasso' },
    { k: 'sel', icon: 'fa-arrow-pointer', ar: 'تحديد', en: 'Select' },
    { k: 'shape', icon: 'fa-shapes', ar: 'أشكال', en: 'Shapes' },
    { k: 'text', icon: 'fa-i-cursor', ar: 'نصّ', en: 'Text', cap: 'text' }
  ];
  var SHAPE_TOOLS = { rect: 1, ell: 1, line: 1, arr: 1, shp: 1 };
  var MOUSE = [['draw', 'ترسم', 'Draws'], ['pan', 'تمرّر', 'Scrolls'], ['off', 'لا تفعل شيئاً', 'Does nothing']];
  var TOUCH = [['auto', 'تلقائيّ', 'Automatic'], ['draw', 'يرسم', 'Draws'], ['pan', 'يمرّر', 'Scrolls'], ['off', 'لا يفعل شيئاً', 'Does nothing']];
  var HOW = [['auto', 'تلقائيّ', 'Automatic'], ['hold', 'ما دام مضغوطاً', 'While held'], ['toggle', 'يبدّل', 'Toggles']];
  var OS_ICON = { windows: 'fa-laptop', mac: 'fa-laptop', chromebook: 'fa-laptop', android: 'fa-tablet-screen-button',
                  ipad: 'fa-tablet-screen-button', iphone: 'fa-mobile-screen', other: 'fa-laptop' };

  function isAr() { return document.documentElement.lang !== 'en'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function I() { return window.GardenInkInput || null; }
  function readTab() { try { return localStorage.getItem(TAB_LS) || 'tools'; } catch (e) { return 'tools'; } }
  function ago(t) {
    if (!t) return '';
    var d = Math.max(0, Date.now() - t), m = Math.round(d / 60000);
    if (m < 2) return L('الآن', 'just now');
    if (m < 60) return L('قبل ' + m + ' دقيقة', m + ' min ago');
    var h = Math.round(m / 60);
    if (h < 24) return L('قبل ' + h + ' ساعة', h + ' h ago');
    var dd = Math.round(h / 24);
    return L('قبل ' + dd + ' يوماً', dd + ' days ago');
  }
  function lbl(ar, en) { return 'aria-label="' + esc(L(ar, en)) + '" data-ar-title="' + esc(ar) + '" data-en-title="' + esc(en) + '"'; }

  function Panel(dial) {
    this.d = dial;
    this.open = false;
    this.tab = readTab();
    this.stopRec = null;
    this.build();
  }

  Panel.prototype.cv = function () { return this.d && this.d.getCv ? this.d.getCv() : null; };

  Panel.prototype.build = function () {
    var el = document.createElement('section');
    el.className = 'nip';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', L('أدواتُ الرسم وإعداداتُها', 'Drawing tools and settings'));
    document.body.appendChild(el);
    this.el = el;
    var self = this;
    el.addEventListener('click', function (e) { self.onClick(e); });
    el.addEventListener('change', function (e) { self.onChange(e); });
    el.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    this._key = function (e) {
      if (!self.open || e.key !== 'Escape') return;
      if (self.stopRec) return;
      e.preventDefault(); e.stopPropagation();
      self.toggle(false);
    };
    document.addEventListener('keydown', this._key, true);
    this._resize = function () { if (self.open) self.place(); };
    window.addEventListener('resize', this._resize);
    this._outside = function (e) {
      if (!self.open || self.stopRec) return;
      var t = e.target;
      if (t && t.closest && (t.closest('.nip') || t.closest('.ndl') || t.closest('dialog') || t.closest('.nsw-bd') || t.closest('.nsw'))) return;
      self.toggle(false);
    };
    document.addEventListener('pointerdown', this._outside, true);
    var drag = null;
    el.addEventListener('pointerdown', function (e) {
      var h = e.target.closest ? e.target.closest('.nip-h') : null;
      if (!h || e.target.closest('button') || el.getAttribute('data-sheet') === '1') return;
      var zz = self.uiZ();
      drag = { id: e.pointerId, dx: e.clientX / zz - (parseFloat(el.style.left) || 0), dy: e.clientY / zz - (parseFloat(el.style.top) || 0) };
      try { h.setPointerCapture(e.pointerId); } catch (e2) {}
      e.preventDefault();
    });
    el.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var zz = self.uiZ();
      self.moveTo(e.clientX / zz - drag.dx, e.clientY / zz - drag.dy);
    });
    var end = function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      try { localStorage.setItem(POS_LS, JSON.stringify({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) })); } catch (e3) {}
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  };

  Panel.prototype.uiZ = function () {
    var z = 1;
    try { z = parseFloat(getComputedStyle(this.el).zoom) || 1; } catch (e) {}
    return (isFinite(z) && z > 0.2) ? z : 1;
  };

  Panel.prototype.moveTo = function (x, y) {
    var z = this.uiZ(), el = this.el, vw = window.innerWidth / z, vh = window.innerHeight / z;
    var w = el.offsetWidth || 380, h = el.offsetHeight || 400;
    x = Math.max(8, Math.min(x, vw - w - 8));
    y = Math.max(8, Math.min(y, vh - Math.min(h, 120)));
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
  };

  Panel.prototype.toggle = function (on) {
    var want = on == null ? !this.open : !!on;
    this.open = want;
    if (!want) { this.cancelRec(); this.el.hidden = true; }
    else { this.render(); this.el.hidden = false; this.place(); }
    if (this.d && this.d.onPanel) this.d.onPanel(want);
    return want;
  };

  Panel.prototype.place = function () {
    var z = this.uiZ(), el = this.el, vw = window.innerWidth / z, vh = window.innerHeight / z;
    var sheet = vw <= 640;
    el.setAttribute('data-sheet', sheet ? '1' : '0');
    if (sheet) { el.style.left = ''; el.style.top = ''; return; }
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(POS_LS) || 'null'); } catch (e0) {}
    if (saved && isFinite(saved.x) && isFinite(saved.y)) { this.moveTo(saved.x, saved.y); return; }
    var w = Math.min(380, vw - 24), pos = (this.d && this.d.pos) || { x: vw - 80, y: vh - 110 };
    var gap = 92;
    var x = (pos.x > vw / 2) ? pos.x - gap - w : pos.x + gap;
    x = Math.max(12, Math.min(x, vw - w - 12));
    var h = Math.min(el.scrollHeight || 520, vh - 24);
    var y = Math.max(12, Math.min(pos.y - h / 2, vh - h - 12));
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
  };

  Panel.prototype.render = function () {
    var p = I() ? I().devProfile() : null;
    var name = I() ? I().devName(p) : '';
    var h = '<header class="nip-h" data-drag="1" title="' + esc(L('اسحبْها من هنا', 'Drag from here')) + '"><h2 class="nip-t">' + esc(L('أدواتُ الرسم', 'Drawing tools')) + '</h2>' +
      '<button type="button" class="nip-dev" data-go="device" ' + lbl('هذا الجهاز: ' + name, 'This device: ' + name) + '>' +
      '<i class="fa-solid ' + (OS_ICON[(p && p.os) || 'other'] || 'fa-laptop') + '" aria-hidden="true"></i><bdi>' + esc(name) + '</bdi></button>' +
      '<button type="button" class="nip-x" data-act="close" ' + lbl('أغلقْ', 'Close') + '><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header>';
    h += '<nav class="nip-tabs" role="tablist">' + TABS.map(function (t) {
      return '<button type="button" role="tab" class="nip-tab" data-tab="' + t.k + '" aria-selected="' + (this.tab === t.k) + '">' +
        '<i class="fa-solid ' + t.icon + '" aria-hidden="true"></i><span>' + esc(L(t.ar, t.en)) + '</span></button>';
    }, this).join('') + '</nav>';
    h += '<div class="nip-b" role="tabpanel">' + this['tab_' + this.tab]() + '</div>';
    this.el.innerHTML = h;
    if (window.Garden && Garden.localize) { try { Garden.localize(this.el); } catch (e) {} }
  };

  Panel.prototype.sec = function (title, body, extra) {
    return '<div class="nip-sec' + (extra ? ' ' + extra : '') + '"><h3 class="nip-l">' + esc(title) + '</h3>' + body + '</div>';
  };

  Panel.prototype.chipRow = function (items) {
    return '<div class="nip-chips">' + items.map(function (it) {
      return '<button type="button" class="nip-chip" data-k="' + esc(it.k) + '" aria-pressed="' + (!!it.pressed) + '" ' +
        lbl(it.ar, it.en) + (it.style ? ' style="' + esc(it.style) + '"' : '') + '>' +
        (it.html != null && it.html !== '' ? it.html : (it.icon ? '<i class="fa-solid ' + it.icon + '" aria-hidden="true"></i>' : '')) +
        (it.text ? '<span>' + esc(it.text) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  };

  Panel.prototype.tab_tools = function () {
    var cv = this.cv(), d = this.d, tool = cv ? cv.tool : 'pen';
    var cur = SHAPE_TOOLS[tool] ? 'shape' : tool;
    var grid = '<div class="nip-tools">' + TOOLS.filter(function (t) {
      return !t.cap || (cv && cv.canText);
    }).map(function (t) {
      return '<button type="button" class="nip-tool" data-tool="' + t.k + '" aria-pressed="' + (cur === t.k) + '">' +
        '<i class="fa-solid ' + t.icon + '" aria-hidden="true"></i><span>' + esc(L(t.ar, t.en)) + '</span></button>';
    }).join('') + '</div>';
    var h = this.sec(L('الأداة', 'Tool'), grid);
    if (cur === 'shape') h += this.sec(L('الشكل', 'Shape'), this.chipRow(d.subItems('shape')));
    if (cur === 'era') h += this.sec(L('نوعُ الممحاة', 'Eraser'), this.chipRow(d.subItems('era').map(function (x) { x.text = L(x.ar.split(' — ')[0], x.en.split(' — ')[0]); return x; })));
    if (cur !== 'era' && cur !== 'hand' && cur !== 'sel' && cur !== 'lasso') {
      var cols = d.subItems('color').map(function (x) { if (x.cls === 'ndl-sw') { x.html = '<span class="nip-sw"></span>'; } return x; });
      h += this.sec(L('اللون', 'Colour'), this.chipRow(cols), 'nip-colors');
      if (d.palettes) {
        var pl = d.palettes(), hexOf = (window.GardenCanvas && (tool === 'hi' ? GardenCanvas.hiHexOf : GardenCanvas.hexOf)) || function (t) { return t; };
        h += this.sec(tool === 'hi' ? L('لوحاتُ التظليل حول اللوحة', 'Highlight palettes around the dial') : L('لوحاتُ الألوان حول اللوحة', 'Colour palettes around the dial'),
          '<ul class="nip-pals">' + pl.lists.map(function (l, i) {
            return '<li><button type="button" class="nip-pal" data-pal="' + i + '" aria-pressed="' + (i === pl.cur) + '"><span>' + esc(l.name) + '</span>' +
              '<span class="nip-pal-dots">' + l.c.slice(0, 6).map(function (c) { return '<i style="--t:' + esc(hexOf(c)) + '"></i>'; }).join('') + '</span></button></li>';
          }).join('') + '</ul>');
      }
      var ws = d.subItems(tool === 'hi' ? 'hiw' : 'size');
      h += this.sec(L('السماكة', 'Thickness'), this.chipRow(ws.filter(function (x) { return x.k.indexOf('w:') === 0; })));
      if (tool === 'hi') {
        h += this.sec(L('طريقةُ التظليل', 'Highlighting'), this.chipRow(ws.filter(function (x) { return x.k.indexOf('w:') !== 0; })));
      } else if (tool === 'pen' || tool === 'pencil') {
        h += this.sec(L('رأسُ القلم', 'Pen tip'), this.chipRow(d.subItems('nib').map(function (x) { x.text = L(x.ar, x.en); return x; })));
      }
    }
    h += '<div class="nip-row">' +
      '<button type="button" class="nip-btn" data-k="undo" ' + lbl('تراجع', 'Undo') + '><i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>' + esc(L('تراجع', 'Undo')) + '</span></button>' +
      '<button type="button" class="nip-btn" data-k="redo" ' + lbl('إعادة', 'Redo') + '><i class="fa-solid fa-rotate-right" aria-hidden="true"></i><span>' + esc(L('إعادة', 'Redo')) + '</span></button></div>';
    return h;
  };

  function actOptions(cur) {
    var X = I(), list = X ? X.ACT_LIST : [];
    var grp = function (g, title) {
      return '<optgroup label="' + esc(title) + '">' + list.filter(function (a) { return a.g === g; }).map(function (a) {
        return '<option value="' + esc(a.k) + '"' + (a.k === cur ? ' selected' : '') + '>' + esc(L(a.ar, a.en)) + '</option>';
      }).join('') + '</optgroup>';
    };
    return grp('tool', L('أداة', 'Tool')) + grp('cmd', L('أمر', 'Command')) + grp('none', L('لا شيء', 'None'));
  }

  Panel.prototype.tab_binds = function () {
    var X = I();
    if (!X) return '';
    var p = X.devProfile();
    var rank = function (t) { return t.indexOf('pen:') === 0 ? 0 : t.indexOf('mouse:') === 0 ? 1 : t.indexOf('key:') === 0 ? 2 : 3; };
    var rows = p.binds.slice().sort(function (a, b) { return rank(a.t) - rank(b.t); }).map(function (b) {
      var tool = X.isTool(b.a);
      return '<li class="nip-bind" data-trig="' + esc(b.t) + '">' +
        '<span class="nip-trig"><i class="fa-solid ' + X.trigIcon(b.t) + '" aria-hidden="true"></i><bdi>' + esc(X.trigLabel(b.t)) + '</bdi></span>' +
        '<select class="nip-sel" data-bind-act ' + lbl('ماذا يفعل: ' + X.trigLabel(b.t), 'What it does: ' + X.trigLabel(b.t)) + '>' + actOptions(b.a) + '</select>' +
        (tool ? '<select class="nip-sel nip-how" data-bind-how ' + lbl('كيف يعمل', 'How it works') + '>' + HOW.map(function (o) {
          return '<option value="' + o[0] + '"' + ((b.h || 'auto') === o[0] ? ' selected' : '') + '>' + esc(L(o[1], o[2])) + '</option>';
        }).join('') + '</select>' : '<span class="nip-how nip-once">' + esc(L('مرّةً عند الضغط', 'Once per press')) + '</span>') +
        '<button type="button" class="nip-ic" data-act="unbind" ' + lbl('احذفْ هذا الربط', 'Remove this binding') + '><i class="fa-solid fa-trash" aria-hidden="true"></i></button></li>';
    }).join('');
    var h = this.sec(L('أزرارُك على هذا الجهاز', 'Your buttons on this device'),
      (rows ? '<ul class="nip-binds">' + rows + '</ul>' : '<p class="nip-empty">' + esc(L('لا أزرارَ مربوطةً بعد.', 'No buttons bound yet.')) + '</p>'));
    if (this.stopRec) {
      h += '<div class="nip-rec" role="status" aria-live="polite"><i class="fa-solid fa-circle-dot" aria-hidden="true"></i>' +
        '<p><b>' + esc(L('اضغطِ الزرَّ الآن', 'Press the button now')) + '</b><br>' +
        esc(L('زرُّ القلم · زرُّ الفأرة · نقرٌ مزدوج · اختصارٌ من لوحة المفاتيح أو أزرارُ اللوح (‏XP‑Pen وأمثاله) · نقرةٌ بإصبعين أو ثلاثة',
              'A pen button · a mouse button · a double-click · a keyboard shortcut or tablet express keys (XP-Pen and the like) · a two- or three-finger tap')) +
        '</p><p class="nip-hint" data-role="rec-hint"></p>' +
        '<button type="button" class="nip-btn" data-act="rec-cancel">' + esc(L('ألغِ', 'Cancel')) + '</button></div>';
    } else {
      h += '<div class="nip-row"><button type="button" class="nip-btn nip-btn--go" data-act="rec">' +
        '<i class="fa-solid fa-plus" aria-hidden="true"></i><span>' + esc(L('سجّلْ زرّاً أو اختصاراً', 'Record a button or shortcut')) + '</span></button>' +
        '<button type="button" class="nip-btn" data-act="binds-reset"><span>' + esc(L('الأصل', 'Defaults')) + '</span></button></div>';
    }
    h += '<p class="nip-note">' + esc(L('«تلقائيّ»: الضغطُ المستمرُّ يبدّل الأداةَ ما دام الزرُّ مضغوطاً، والنقرةُ القصيرة تثبّتها حتى تنقر ثانيةً.',
      'Automatic: holding switches the tool while pressed; a short press keeps it until you press again.')) + '</p>';
    return h;
  };

  Panel.prototype.seg = function (name, opts, cur) {
    return '<div class="nip-chips" role="radiogroup">' + opts.map(function (o) {
      return '<button type="button" class="nip-chip" role="radio" data-' + name + '="' + o[0] + '" aria-checked="' + (cur === o[0]) + '" aria-pressed="' + (cur === o[0]) + '"><span>' + esc(L(o[1], o[2])) + '</span></button>';
    }).join('') + '</div>';
  };

  Panel.prototype.tab_device = function () {
    var X = I();
    if (!X) return '';
    var p = X.devProfile();
    var h = this.sec(L('اسمُ هذا الجهاز', 'This device’s name'),
      '<input class="nip-in" type="text" maxlength="40" data-dev-name value="' + esc(p.name || '') + '" placeholder="' + esc(X.devName(p)) + '" ' +
      lbl('اسمُ هذا الجهاز', 'This device’s name') + '><p class="nip-note">' +
      esc(L('إعداداتُ القلم والأزرار هنا لهذا الجهاز وحدَه، وتُحفظ في حسابك فتعود إن أعدتَ تثبيتَ المتصفّح.',
            'Pen and button settings here belong to this device only, and are kept in your account so they come back after a reinstall.')) + '</p>');
    h += this.sec(L('القلم', 'Pen'), '<p class="nip-note">' + esc(L('يرسم دائماً.', 'Always draws.')) + '</p>' +
      '<div class="nip-row"><button type="button" class="nip-btn" data-act="tilt" aria-pressed="' + (X.tiltMode() !== 'off') + '"><i class="fa-solid fa-pen-nib" aria-hidden="true"></i><span>' +
      esc(X.tiltMode() !== 'off' ? L('الإمالةُ تُشكّل الخطّ', 'Tilt shapes the line') : L('الإمالةُ متوقّفة', 'Tilt is off')) + '</span></button>' +
      '<button type="button" class="nip-btn" data-act="pressure"><i class="fa-solid fa-gauge" aria-hidden="true"></i><span>' + esc(L('أعِدْ معايرةَ الضغط', 'Recalibrate pressure')) + '</span></button></div>');
    h += this.sec(L('الفأرة', 'Mouse'), this.seg('mouse', MOUSE, p.src.mouse || 'draw'));
    h += this.sec(L('الإصبع', 'Finger'), this.seg('touch', TOUCH, p.touchSet ? (p.src.touch || 'auto') : 'auto') +
      '<p class="nip-note">' + esc(L('«تلقائيّ»: يرسم الإصبعُ حتى يُرى قلم، ثمّ يمرّر ويُرفض كفُّ اليد.',
        'Automatic: the finger draws until a pen is seen, then it scrolls and your palm is ignored.')) + '</p>');
    var others = X.otherDevices();
    h += this.sec(L('أجهزتُك الأخرى', 'Your other devices'), others.length ? '<ul class="nip-binds">' + others.map(function (o) {
      var nm = o.p.name || L('جهاز', 'Device') + ' ' + o.id.slice(1, 5);
      return '<li class="nip-bind nip-devrow" data-dev="' + esc(o.id) + '"><span class="nip-trig"><i class="fa-solid ' + (OS_ICON[o.p.os] || 'fa-laptop') +
        '" aria-hidden="true"></i><bdi>' + esc(nm) + '</bdi></span><span class="nip-how nip-once">' + esc(ago(o.p.at)) + ' · ' + o.p.binds.length + ' ' + esc(L('زرّاً', 'buttons')) + '</span>' +
        '<button type="button" class="nip-btn" data-act="copy-dev">' + esc(L('انسخْ إعداده', 'Copy its setup')) + '</button></li>';
    }).join('') + '</ul>' : '<p class="nip-empty">' + esc(L('لا أجهزةَ أخرى بعد — افتح الرسمَ من جهازٍ آخر بحسابك.', 'No other devices yet — open drawing on another device with your account.')) + '</p>');
    return h;
  };

  Panel.prototype.tab_custom = function () {
    var d = this.d, h = '';
    if (d.haloPrefs) {
      var hp = d.haloPrefs();
      var sw = function (k, on, ar, en, sar, sen) {
        return '<button type="button" class="nip-switch" role="switch" data-halo="' + k + '" aria-checked="' + on + '"><span>' +
          esc(L(ar, en)) + '<br><small class="nip-note">' + esc(L(sar, sen)) + '</small></span><b aria-hidden="true"></b></button>';
      };
      h += this.sec(L('ما يبقى ظاهراً حول اللوحة', 'What stays around the dial'), '<div class="nip-col">' +
        sw('on', hp.on, 'ألوانٌ ثابتة', 'Pinned colours', 'ستّةُ ألوانٍ من لوحتك حول الوسط — المسْ «⋯» لتبدّل اللوحة', 'Six colours from your palette around the centre — tap “⋯” to switch palette') +
        sw('swap', hp.swap, 'زرُّ القلم ⇄ التظليل', 'Pen ⇄ highlighter button', 'لمسةٌ واحدةٌ تبدّل بينهما', 'One tap switches between them') + '</div>');
    }
    var rows = '';
    if (d.favHost && d.barDialog) rows += '<button type="button" class="nip-btn" data-act="bar"><i class="fa-solid fa-table-cells" aria-hidden="true"></i><span>' + esc(L('عدّلْ شريطَ المفضّلة', 'Edit the favourites bar')) + '</span></button>';
    rows += '<button type="button" class="nip-btn" data-act="dial-home"><i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i><span>' + esc(L('أعِدِ اللوحةَ الدائريّة إلى مكانها', 'Put the dial back in its place')) + '</span></button>';
    h += this.sec(L('اللوحةُ والشريط', 'Dial and bar'), '<div class="nip-col">' + rows + '</div>');
    h += '<p class="nip-note">' + esc(L('اسحبِ اللوحةَ الدائريّة من وسطها إلى أيِّ مكان. والضغطُ على وسطها وهي مفتوحةٌ يفتح هذه الأدوات ويغلقها.',
      'Drag the dial from its centre anywhere. Pressing its centre while it is open shows and hides these tools.')) + '</p>';
    return h;
  };

  Panel.prototype.onClick = function (e) {
    var t = e.target.closest ? e.target.closest('button') : null;
    if (!t || !this.el.contains(t)) return;
    var X = I(), d = this.d;
    if (t.hasAttribute('data-tab') || t.hasAttribute('data-go')) {
      this.cancelRec();
      this.tab = t.getAttribute('data-tab') || t.getAttribute('data-go');
      try { localStorage.setItem(TAB_LS, this.tab); } catch (e1) {}
      this.render(); this.place();
      return;
    }
    if (t.hasAttribute('data-tool')) {
      var k = t.getAttribute('data-tool');
      if (k === 'shape') { var cv = this.cv(); if (cv) cv.setTool('rect'); d.sync(); }
      else d.pick(k);
      if (d.closeSub) d.closeSub();
      this.render();
      return;
    }
    if (t.hasAttribute('data-mouse') && X) {
      var p = X.devProfile(); p.src.mouse = t.getAttribute('data-mouse'); X.saveProfile(p); this.render(); return;
    }
    if (t.hasAttribute('data-touch') && X) {
      var m = t.getAttribute('data-touch');
      X.setPalmMode({ auto: 'auto', draw: 'never', pan: 'always', off: 'off' }[m]);
      this.render(); return;
    }
    if (t.hasAttribute('data-pal') && d.setPalette) { d.setPalette(+t.getAttribute('data-pal')); this.render(); return; }
    if (t.hasAttribute('data-halo') && d.setHalo) {
      var hp = d.haloPrefs(), k2 = t.getAttribute('data-halo');
      hp[k2] = !hp[k2];
      d.setHalo(hp);
      this.render();
      return;
    }
    var act = t.getAttribute('data-act');
    var key = t.getAttribute('data-k');
    if (key) { d.pick(key, t); if (d.closeSub) d.closeSub(); this.render(); return; }
    if (act === 'close') { this.toggle(false); return; }
    if (act === 'rec') { this.startRec(); return; }
    if (act === 'rec-cancel') { this.cancelRec(); this.render(); return; }
    if (act === 'unbind' && X) {
      var li = t.closest('[data-trig]');
      X.setBind(li.getAttribute('data-trig'), null);
      this.render(); return;
    }
    if (act === 'binds-reset' && X) {
      var pr = X.devProfile();
      pr.binds = [{ t: 'pen:barrel', a: 'era' }, { t: 'pen:tip', a: 'era' }, { t: 'pen:second', a: 'sel' }];
      X.saveProfile(pr); this.render(); return;
    }
    if (act === 'tilt' && X) { X.setTiltMode(X.tiltMode() === 'off' ? 'auto' : 'off'); this.render(); return; }
    if (act === 'pressure') {
      try { localStorage.removeItem('garden_ink_pmax'); } catch (e2) {}
      var cvp = this.cv();
      if (cvp && cvp.router && cvp.router.profile) { cvp.router.profile.pMax = 0; cvp.router.profile.pCeil = 0; cvp.router.profile.pMin = 1; }
      t.querySelector('span').textContent = L('تمّ — ارسمْ خطّاً بضغطٍ كامل', 'Done — draw one line at full pressure');
      return;
    }
    if (act === 'copy-dev' && X) {
      var id = t.closest('[data-dev]').getAttribute('data-dev');
      var other = X.otherDevices().filter(function (o) { return o.id === id; })[0];
      if (other) {
        var mine = X.devProfile();
        mine.src = JSON.parse(JSON.stringify(other.p.src || {}));
        mine.touchSet = other.p.touchSet || 0;
        mine.binds = JSON.parse(JSON.stringify(other.p.binds || []));
        X.saveProfile(mine);
        this.tab = 'binds'; this.render();
      }
      return;
    }
    if (act === 'bar' && d.barDialog) { d.barDialog(); return; }
    if (act === 'dial-home' && d.home) { d.home(); this.place(); return; }
  };

  Panel.prototype.onChange = function (e) {
    var X = I(), t = e.target;
    if (!X) return;
    if (t.hasAttribute('data-dev-name')) {
      var p = X.devProfile(); p.name = String(t.value || '').trim().slice(0, 40); X.saveProfile(p);
      var chip = this.el.querySelector('.nip-dev bdi'); if (chip) chip.textContent = X.devName(p);
      return;
    }
    var li = t.closest ? t.closest('[data-trig]') : null;
    if (!li) return;
    var trig = li.getAttribute('data-trig'), b = X.bindOf(trig) || { t: trig, a: 'none' };
    if (t.hasAttribute('data-bind-act')) {
      var v = t.value;
      if (v === 'none') { X.setBind(trig, null); this.render(); return; }
      X.setBind(trig, v, b.h);
      this.render();
      return;
    }
    if (t.hasAttribute('data-bind-how')) X.setBind(trig, b.a, t.value);
  };

  function defAct(trig) {
    if (/^pen:(barrel|tip)$/.test(trig)) return 'era';
    if (trig === 'pen:second') return 'sel';
    if (trig === 'mouse:middle' || trig === 'mouse:right') return 'hand';
    return 'undo';
  }

  Panel.prototype.startRec = function () {
    var X = I(), self = this;
    if (!X || this.stopRec) return;
    this.stopRec = X.captureAny(function (r) {
      self.stopRec = null;
      if (r && r.trig) {
        if (!X.bindOf(r.trig)) X.setBind(r.trig, defAct(r.trig));
        self.render();
        var row = self.el.querySelector('[data-trig="' + (window.CSS && CSS.escape ? CSS.escape(r.trig) : r.trig) + '"]');
        if (row) { row.setAttribute('data-new', '1'); var s = row.querySelector('[data-bind-act]'); if (s) s.focus(); }
      } else self.render();
    }, {
      ignore: '[data-act="rec-cancel"]',
      onHint: function () {
        var hEl = self.el.querySelector('[data-role="rec-hint"]');
        if (hEl) hEl.textContent = L('النقرةُ الواحدة بالزرِّ الأيسر تبقى للرسم — جرّبِ النقرَ المزدوج أو زرّاً آخر.',
                                     'A single left click stays for drawing — try a double-click or another button.');
      }
    });
    this.render();
  };

  Panel.prototype.cancelRec = function () {
    if (this.stopRec) { try { this.stopRec(); } catch (e) {} this.stopRec = null; }
  };

  Panel.prototype.destroy = function () {
    this.cancelRec();
    document.removeEventListener('keydown', this._key, true);
    document.removeEventListener('pointerdown', this._outside, true);
    window.removeEventListener('resize', this._resize);
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
  };

  window.GardenInkPanel = { mount: function (dial) { return new Panel(dial); } };
})();
