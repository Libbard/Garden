;(function () {
  'use strict';

  if (window.GardenModPanel) return;

  var me = document.currentScript;
  var src = (me && me.src) || '';
  var DIR = src.replace(/[^/]*$/, '');
  var VER = (src.split('?')[1] || '');

  function L(ar, en) { return document.documentElement.lang === 'en' ? en : ar; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function js(name, test) {
    if (test()) return Promise.resolve();
    return new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = DIR + name + (VER ? '?' + VER : '');
      s.onload = function () { ok(); };
      s.onerror = no;
      document.head.appendChild(s);
    });
  }
  function css(name) {
    var l = document.querySelector('link[data-mi="' + name + '"], link[href*="shared/' + name + '"]');
    if (!l) {
      l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = DIR + name + (VER ? '?' + VER : ''); l.setAttribute('data-mi', name);
      document.head.appendChild(l);
    }
    if (l.sheet) return Promise.resolve();
    return new Promise(function (ok) { l.addEventListener('load', ok); l.addEventListener('error', ok); setTimeout(ok, 3000); });
  }
  function ink() { return js('module-ink.js', function () { return !!window.GardenModuleInk; }).then(function () { return window.GardenModuleInk; }); }
  function tools() { return js('module-tools.js', function () { return !!window.GardenModTools; }).then(function () { return window.GardenModTools; }); }
  function note() { return js('module-note.js', function () { return !!window.GardenModNote; }).then(function () { return window.GardenModNote; }); }
  function peekStore() { return js('peek-store.js', function () { return !!window.GardenPeekStore; }).then(function () { return window.GardenPeekStore; }); }
  function where() { var h = document.documentElement; return { c: h.getAttribute('data-subject') || '', m: Number(h.getAttribute('data-module')) || 0 }; }
  function toast(m, undo) {
    var old = document.querySelector('.mnp-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'mnp-toast'; t.setAttribute('role', 'status');
    t.appendChild(document.createTextNode(m));
    if (undo) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mnp-undo'; b.textContent = L('تراجع', 'Undo');
      b.addEventListener('click', function () { t.remove(); undo(); });
      t.appendChild(b);
    }
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, undo ? 6000 : 2400);
  }

  var TONE = { yellow: ['أصفر', 'Yellow'], lime: ['ليموني', 'Lime'], emerald: ['أخضر', 'Green'], teal: ['فيروزي', 'Teal'], sky: ['أزرق', 'Blue'], indigo: ['نيلي', 'Indigo'],
               violet: ['بنفسجي', 'Violet'], pink: ['زهري', 'Pink'], orange: ['برتقالي', 'Orange'], red: ['أحمر', 'Red'], amber: ['كهرماني', 'Amber'], rose: ['وردي', 'Rose'], brown: ['بنّي', 'Brown'], ink: ['رمادي', 'Grey'] };
  var KINDS = [
    { k: 'note', ar: 'ملاحظاتي', en: 'My notes' },
    { k: 'fill', ar: 'تظليل', en: 'Highlights' },
    { k: 'under', ar: 'تسطير', en: 'Underlines' },
    { k: 'text', ar: 'لونُ النصّ', en: 'Text colour' }
  ];
  function hue(c, st) { return /^#/.test(c) ? c : 'var(--gmi-' + (st === 'fill' ? '' : 'p-') + c + ', #5ab8ff)'; }
  var VIEW = 'garden_mnp_view';
  function view0() { try { return localStorage.getItem(VIEW) === 'lines' ? 'lines' : 'cards'; } catch (e) { return 'cards'; } }
  function toneName(c) { return TONE[c] ? L(TONE[c][0], TONE[c][1]) : c; }

  /*@3.MONPJ.1*/
  function concepts() {
    var out = {}, i = 0;
    [].forEach.call(document.querySelectorAll('.main-content > section[id]'), function (s) {
      var h = s.querySelector('h2, h3'), n = s.querySelector('.concept-number');
      var t = h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
      if (n) t = t.replace(new RegExp('^' + n.textContent.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '');
      out[s.id] = { id: s.id, i: i++, t: t || L('مقدّمةُ الوحدة', 'Module intro'), n: n ? n.textContent.trim() : '' };
    });
    return out;
  }

  var S = { dlg: null, items: [], legacy: [], pages: [], opts: {}, kind: 'note', color: '', q: '', refT: 0, guard: false, moving: false };
  function modulePages() {
    var w = where(), a = [];
    try { a = JSON.parse(localStorage.getItem('notes_index') || '[]'); } catch (e) { a = []; }
    return (Array.isArray(a) ? a : []).filter(function (r) { return r && r.o && r.o.c === w.c && Number(r.o.m) === w.m && !(r.d > 0) && !r.pv; }).map(function (r) { return r.id; });
  }

  function load() {
    return ink().then(function (I) { return I.keptList(); }).then(function (rows) {
      var ids = {};
      rows.forEach(function (r) { if (r.ta.n) ids[String(r.ta.n).split('#')[0]] = 1; });
      modulePages().forEach(function (id) { ids[id] = 1; });
      return Promise.all(Object.keys(ids).map(function (id) {
        return peekStore().then(function (P) { return P.get(id); }).then(function (row) { return [id, row && row.secs]; }, function () { return [id, null]; });
      })).then(function (snaps) {
        var by = {};
        snaps.forEach(function (x) { by[x[0]] = x[1]; });
        var used = {};
        rows.forEach(function (r) {
          if (!r.ta.n) return;
          var p = String(r.ta.n).split('#'), secs = by[p[0]], head = secs && (secs[p[1]] ? p[1] : (secs.__ix && secs.__ix[p[1]]));
          r.note = head && secs[head] ? String(secs[head].x || '').trim() : '';
          r.hasNote = true;
          if (head) used[p[0] + '#' + head] = 1;
        });
        var pages = [];
        Object.keys(by).forEach(function (id) {
          var secs = by[id];
          if (!secs) return;
          Object.keys(secs).forEach(function (head) {
            if (head === '__ix' || used[id + '#' + head]) return;
            var x = secs[head], m = /href="[^"]*#([^"#]+)"/.exec(x.html || '');
            pages.push({ page: 1, id: id, head: head, sec: m ? decodeURIComponent(m[1]) : '', note: String(x.x || '').trim(), st: 'note' });
          });
        });
        S.items = rows;
        S.pages = pages;
        return rows;
      });
    });
  }

  function matches(r) {
    if (S.kind === 'note' && !r.hasNote && !r.legacy && !r.page) return false;
    if (S.kind !== 'note' && r.st !== S.kind) return false;
    if (S.color && S.kind !== 'note' && r.c !== S.color) return false;
    if (S.q) {
      var hay = ((r.ta && r.ta.t) || r.text || '') + ' ' + (r.note || '');
      if (hay.toLowerCase().indexOf(S.q) < 0) return false;
    }
    return true;
  }
  function shown() {
    var free = function (x) { return S.kind === 'note' && matches(x); };
    return S.items.filter(matches).concat(S.pages.filter(free), S.legacy.filter(free));
  }

  /*@3.MONPJ.2*/
  function kindOf(r) { return r.ta ? r.st : 'note'; }
  function counts() {
    var c = { all: 0, note: 0, fill: 0, under: 0, text: 0 };
    S.items.forEach(function (r) { c.all++; c[r.st] = (c[r.st] || 0) + 1; if (r.hasNote) c.note++; });
    c.all += S.pages.length + S.legacy.length;
    c.marks = S.items.length;
    c.note += S.pages.length + S.legacy.length;
    return c;
  }
  function render() {
    var d = S.dlg;
    if (!d) return;
    var C = concepts(), list = shown(), groups = {}, order = [], N = counts();
    list.forEach(function (r) {
      var sid = r.ta ? r.ta.s : (r.sec || ''), g = groups[sid];
      if (!g) { g = groups[sid] = { c: C[sid] || { id: sid, i: 9999, t: L('بلا موضع', 'No place'), n: '' }, rows: [] }; order.push(g); }
      g.rows.push(r);
    });
    order.sort(function (a, b) { return a.c.i - b.c.i; });
    order.forEach(function (g) {
      g.rows.sort(function (a, b) { return ((a.ta && a.ta.i) || 0) - ((b.ta && b.ta.i) || 0) || ((a.ta && a.ta.a) || 0) - ((b.ta && b.ta.a) || 0); });
    });
    var w = where();
    d.querySelector('.mnp-sub').textContent = w.c + ' · ' + L('الوحدة', 'Module') + ' ' + w.m;
    if (S.kind !== 'note' && !N[S.kind]) S.kind = 'note';
    d.querySelector('.mnp-tabs').innerHTML = KINDS.filter(function (x) { return x.k === 'note' || N[x.k]; }).map(function (x) {
      var on = x.k === S.kind;
      return '<button type="button" class="mnp-kind" role="tab" data-kind="' + x.k + '" aria-selected="' + on + '" aria-pressed="' + on + '" tabindex="' + (on ? 0 : -1) + '">' +
        '<span>' + esc(L(x.ar, x.en)) + '</span><b>' + N[x.k] + '</b></button>';
    }).join('');
    var cols = {};
    if (S.kind !== 'note') S.items.forEach(function (r) { if (r.st === S.kind) cols[r.c] = (cols[r.c] || 0) + 1; });
    var ck = Object.keys(cols);
    if (S.color && !cols[S.color]) S.color = '';
    var vw = view0();
    d.querySelector('.mnp-cols').innerHTML = S.kind === 'note'
      ? '<span class="mnp-seg" role="group" aria-label="' + esc(L('طريقةُ العرض', 'View')) + '">' +
          '<button type="button" class="mnp-vb" data-view="cards" aria-pressed="' + (vw === 'cards') + '" aria-label="' + esc(L('بطاقات', 'Cards')) + '" title="' + esc(L('بطاقات', 'Cards')) + '"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i></button>' +
          '<button type="button" class="mnp-vb" data-view="lines" aria-pressed="' + (vw === 'lines') + '" aria-label="' + esc(L('سطور', 'Lines')) + '" title="' + esc(L('سطور', 'Lines')) + '"><i class="fa-solid fa-list" aria-hidden="true"></i></button></span>'
      : (ck.length < 2 && !S.color ? '' : ck.map(function (c) {
      var on = S.color === c;
      return '<button type="button" class="mnp-col' + (on ? ' on' : '') + '" data-col="' + esc(c) + '" style="--c:' + esc(hue(c, S.kind)) + '" aria-pressed="' + on + '" title="' + esc(toneName(c) + ' — ' + cols[c]) + '" aria-label="' + esc(toneName(c) + ' — ' + cols[c]) + '"></button>';
    }).join(''));
    var lst = d.querySelector('.mnp-list');
    lst.setAttribute('data-view', S.kind === 'note' ? vw : 'marks');
    var body = d.querySelector('.mnp-list'), all = N.all;
    var oldN = S.legacy.length, banner = S.kind === 'note' && oldN && S.opts.onLegacyAll
      ? '<div class="mnp-old" role="status"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i><p>' +
          esc(L(oldN + (oldN === 1 ? ' ملاحظةٌ قديمة لم تُنقل' : ' ملاحظاتٍ قديمة لم تُنقل') + ' إلى صفحة الوحدة بعد — بلونها وتنسيقها.', oldN + ' older note' + (oldN === 1 ? '' : 's') + ' not yet in the module page — colour and formatting kept.')) +
          '</p><button type="button" class="gsf-btn gsf-btn--sm" data-mnp="adopt"' + (S.moving ? ' disabled' : '') + '>' + esc(S.moving ? L('تُنقل…', 'Moving…') : L('انقلْها كلَّها', 'Move them all')) + '</button></div>'
      : '';
    if (!all) {
      body.innerHTML = '<div class="mnp-empty"><i class="fa-solid fa-highlighter" aria-hidden="true"></i><p>' + esc(L('حدِّدْ أيَّ نصٍّ في الدرس ثمّ اختر لوناً لتظليله، أو «ملاحظة» لتكتب عليه — وتظهر هنا مرتّبةً بالمفاهيم.', 'Select any text in the lesson, then pick a colour to mark it or “Note” to write on it — it shows up here, ordered by concept.')) + '</p></div>';
    } else if (!list.length) {
      body.innerHTML = banner + '<div class="mnp-empty"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><p>' + esc(L('لا شيءَ يطابق هذا الاختيار.', 'Nothing matches this filter.')) + '</p></div>';
    } else {
      var k = 0;
      S.byK = [];
      body.innerHTML = banner + order.map(function (g) {
        return '<section class="mnp-g"><h3 class="mnp-gh">' + (g.c.n ? '<span class="mnp-n" dir="ltr">' + esc(g.c.n) + '</span>' : '') + '<span class="mnp-gt">' + esc(g.c.t) + '</span>' +
          '<button type="button" class="mnp-goto" data-sec="' + esc(g.c.id) + '" aria-label="' + esc(L('اذهبْ إلى المفهوم', 'Go to the concept')) + '" title="' + esc(L('اذهبْ إلى المفهوم', 'Go to the concept')) + '"><i class="fa-solid fa-arrow-turn-down" aria-hidden="true"></i></button></h3>' +
          g.rows.map(function (r) { r._k = k++; S.byK.push(r); return S.kind === 'note' ? noteRow(r) : row(r); }).join('') + '</section>';
      }).join('');
    }
    var nShown = list.filter(function (r) { return !!r.ta; }).length;
    var rm = d.querySelector('[data-mnp="rm"]');
    rm.hidden = !nShown;
    rm.disabled = !nShown;
    rm.hidden = rm.hidden || S.kind === 'note';
    rm.querySelector('span').textContent = (!S.color && !S.q ? { fill: L('أزِلْ كلَّ التظليل', 'Remove all highlights'), under: L('أزِلْ كلَّ التسطير', 'Remove all underlines'), text: L('أزِلْ كلَّ لون النصّ', 'Remove all text colour') }[S.kind] || '' : L('أزِلِ المعروض', 'Remove shown')) + (nShown ? ' (' + nShown + ')' : '');
    S.list = list;
  }
  function noteRow(r) {
    var q = String((r.ta && r.ta.t) || r.text || '').replace(/\s+/g, ' ').trim();
    var ls = String(r.note || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
    var title = q || ls.shift() || L('ملاحظة', 'Note'), sub = ls[0] || (q && r.hasNote && !r.note ? L('ملاحظتُك في صفحة الوحدة', 'Your note is in the module page') : '');
    var mk = r.ta ? '<span class="mnp-dot" data-st="' + r.st + '" aria-hidden="true"></span>'
      : '<i class="mnp-ic2 fa-solid ' + (r.legacy ? 'fa-clock-rotate-left' : 'fa-book-open') + '" aria-hidden="true"></i>';
    return '<div class="mnp-it mnp-nc" role="button" tabindex="0" data-k="' + r._k + '"' + (r.ta ? ' style="--c:' + esc(hue(r.c, r.st)) + '"' : '') + '>' + mk +
      '<div class="mnp-tx"><b class="mnp-t" dir="auto">' + esc(title.slice(0, 160)) + '</b>' + (sub ? '<span class="mnp-s" dir="auto">' + esc(sub.slice(0, 200)) + '</span>' : '') + '</div>' +
      (r.legacy ? '<small class="mnp-chip">' + esc(L('قديمة', 'Older')) + '</small>' : '') + '</div>';
  }
  function row(r) {
    if (r.page || r.legacy) {
      var tag = r.page ? L('في صفحة ملاحظات الوحدة', 'In the module notes page') : L('ملاحظةٌ قديمة — اضغطْ لتنقلها إلى صفحة الوحدة', 'An older note — tap to move it into the module page');
      return '<div class="mnp-it mnp-it--' + (r.page ? 'page' : 'old') + '" role="button" tabindex="0" data-k="' + r._k + '">' +
        '<div class="mnp-tx">' + (r.text ? '<q class="mnp-q">' + esc(r.text.slice(0, 160)) + '</q>' : '') +
        '<p class="mnp-note" dir="auto">' + esc((r.note || '').slice(0, 260)) + '</p>' +
        '<small class="mnp-tag"><i class="fa-solid ' + (r.page ? 'fa-book-open' : 'fa-clock-rotate-left') + '" aria-hidden="true"></i> ' + esc(tag) + '</small></div></div>';
    }
    var st = { fill: L('تظليل', 'Highlight'), under: L('تسطير', 'Underline'), text: L('لونُ نصّ', 'Text colour') }[r.st];
    return '<div class="mnp-it" role="button" tabindex="0" data-k="' + r._k + '" style="--c:' + esc(hue(r.c, r.st)) + '" aria-label="' + esc(st + ' · ' + toneName(r.c) + ': ' + String(r.ta.t || '').slice(0, 80)) + '">' +
      '<div class="mnp-tx"><q class="mnp-q" data-st="' + r.st + '" dir="auto"><span>' + esc(String(r.ta.t || '').slice(0, 200)) + '</span></q>' +
      (r.hasNote ? '<p class="mnp-note" dir="auto"><i class="fa-solid fa-pen" aria-hidden="true"></i>' + esc((r.note || L('ملاحظتُك في صفحة الوحدة', 'Your note is in the module page')).slice(0, 220)) + '</p>' : '') + '</div>' +
      '<div class="mnp-acts">' +
        '<button type="button" class="mnp-b" data-act="menu" aria-label="' + esc(L('لونُه وطريقتُه…', 'Its colour and style…')) + '" title="' + esc(L('لونُه وطريقتُه…', 'Its colour and style…')) + '"><i class="fa-solid fa-palette" aria-hidden="true"></i></button>' +
        '<button type="button" class="mnp-b mnp-b--rm" data-act="del" aria-label="' + esc(L('أزِلْه', 'Remove it')) + '" title="' + esc(L('أزِلْه', 'Remove it')) + '"><i class="fa-solid fa-eraser" aria-hidden="true"></i></button>' +
      '</div></div>';
  }

  /*@3.MONPJ.3*/
  function flash(rg) {
    if (!rg) return;
    [].forEach.call(rg.getClientRects(), function (q) {
      if (q.width < 1) return;
      var f = document.createElement('div');
      f.className = 'mnp-flash';
      f.style.cssText = 'left:' + (q.left + window.scrollX - 3) + 'px;top:' + (q.top + window.scrollY - 2) + 'px;width:' + (q.width + 6) + 'px;height:' + (q.height + 4) + 'px';
      document.body.appendChild(f);
      setTimeout(function () { f.remove(); }, 1500);
    });
  }
  function land(el, rg) {
    var hd = document.querySelector('.g-header'), off = (hd ? hd.offsetHeight : 0) + 90;
    var r = (rg || el).getBoundingClientRect();
    window.scrollTo({ top: Math.max(0, r.top + window.scrollY - off), behavior: 'smooth' });
  }
  function jump(r) {
    if (r.page) { close(); note().then(function (M) { M.open({ id: r.id, bid: r.head }); }); return; }
    if (r.legacy) { close(); if (S.opts.onLegacy) S.opts.onLegacy(r.id); return; }
    ink().then(function (I) {
      var rg = I.rangeOf(r.ta);
      if (!rg) { toast(L('لم يُعثر على هذا النصّ في الصفحة الآن', 'This text is not on the page right now')); return; }
      if (window.matchMedia && matchMedia('(max-width: 640px)').matches) close();
      land(null, rg);
      setTimeout(function () {
        flash(rg);
        if (r.hasNote && window.GardenModPeek && !(GardenModPeek.off && GardenModPeek.off())) {
          var q = rg.getClientRects()[0];
          GardenModPeek.show({ ta: r.ta, rg: rg, r: q }, { hold: 1 });
        }
      }, 450);
    });
  }
  function del(r) {
    ink().then(function (I) {
      var keep = { ta: JSON.parse(JSON.stringify(r.ta)), c: r.c, st: r.st, rg: I.rangeOf(r.ta) };
      return I.editHighlight(r.ta, 'del').then(function (n) {
        if (!n) return;
        toast(L('أُزيل ✓', 'Removed ✓'), keep.rg ? function () { I.addHighlight(keep.rg, keep.c, keep.st, keep.ta.n ? { n: keep.ta.n } : null); } : null);
      });
    });
  }
  function menuFor(r, b) {
    Promise.all([tools(), ink()]).then(function (x) {
      var T = x[0], I = x[1], rg = I.rangeOf(r.ta);
      if (!rg) { toast(L('لم يُعثر على هذا النصّ في الصفحة الآن', 'This text is not on the page right now')); return; }
      var q = b.getBoundingClientRect();
      T.hlMenu({ ta: r.ta, rg: rg, r: rg.getClientRects()[0] }, q.left, q.bottom + 6);
    });
  }
  function summary() {
    var C = concepts(), by = {}, order = [];
    S.list.forEach(function (r) {
      var sid = r.ta ? r.ta.s : (r.sec || '');
      if (!by[sid]) { by[sid] = []; order.push(sid); }
      by[sid].push(r);
    });
    order.sort(function (a, b) { return ((C[a] || {}).i || 9999) - ((C[b] || {}).i || 9999); });
    return order.map(function (sid) {
      var c = C[sid];
      return '### ' + (c ? c.t : L('بلا موضع', 'No place')) + '\n\n' + by[sid].map(function (r) {
        var t = r.ta ? r.ta.t : (r.text || '');
        return (t ? '- ' + t : '- ' + (r.note || '')) + (r.note && t ? '\n  ' + r.note.replace(/\n+/g, ' ') : '');
      }).join('\n');
    }).join('\n\n');
  }
  function copySummary() {
    var t = summary();
    var done = function () { toast(L('نُسخت الخلاصة ✓', 'Summary copied ✓')); };
    var old = function () {
      var x = document.createElement('textarea'); x.value = t; x.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(x); x.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      x.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, old); else old();
  }
  function toNotes() {
    var md = summary();
    if (!md.trim()) return;
    var day = new Date().toLocaleDateString(document.documentElement.lang === 'en' ? 'en-GB' : 'ar-SA-u-nu-latn', { day: 'numeric', month: 'long' });
    close();
    note().then(function (M) { M.open({ concept: { title: L('خلاصةُ ما علّمتُه — ', 'What I marked — ') + day, md: md }, sec: '' }); });
  }
  function removeShown() {
    var ids = S.list.filter(function (r) { return !!r.ta; }).map(function (r) { return r.ta; });
    ink().then(function (I) {
      var set = ids.map(function (t) { return t.s + '|' + t.i + '|' + t.a + '|' + t.b + '|' + t.t; });
      return I.bulk(function (ta) { return set.indexOf(ta.s + '|' + ta.i + '|' + ta.a + '|' + ta.b + '|' + ta.t) >= 0; }, 'del');
    }).then(function (n) { guard(false); toast(L('أُزيلت ' + n + ' علامة ✓', n + ' marks removed ✓')); });
  }
  function adoptAll() {
    if (S.moving || !S.opts.onLegacyAll) return;
    S.moving = true; render();
    Promise.resolve(S.opts.onLegacyAll()).then(function (n) {
      S.moving = false;
      if (n) S.legacy = [];
      toast(n ? L('نُقلت ' + n + ' إلى صفحة الوحدة ✓', n + ' moved into the module page ✓') : L('تعذّر النقل — حاولْ ثانيةً', 'Could not move them — try again'));
      return load().then(render);
    }, function () { S.moving = false; render(); toast(L('تعذّر النقل — حاولْ ثانيةً', 'Could not move them — try again')); });
  }
  function guard(on) {
    var g = S.dlg && S.dlg.querySelector('.mnp-guard');
    if (!g) return;
    S.guard = on;
    g.hidden = !on;
    if (on) {
      var n = S.list.filter(function (r) { return !!r.ta; }).length;
      g.querySelector('p').textContent = L('ستُزال ' + n + ' علامةً معروضةً من هذه الوحدة على كلِّ أجهزتك. ملاحظاتُك المكتوبة لا تُمسّ.', n + ' shown marks will be removed from this module on all your devices. Your written notes are not touched.');
      g.querySelector('[data-mnp="rm-yes"]').focus();
    }
  }

  /*@3.MONPJ.4*/
  function settings() {
    var keep = window.GardenModuleInk && GardenModuleInk.keep ? GardenModuleInk.keep() : true;
    var peek = true, bar = true;
    try { peek = localStorage.getItem('garden_peek_off') !== '1'; } catch (e) {}
    try { bar = sessionStorage.getItem('garden_notes_paused') !== '1'; } catch (e) {}
    var sw = function (k, on, ar, en, sar, sen) {
      return '<button type="button" class="mnp-sw" role="switch" aria-checked="' + on + '" data-set="' + k + '"><span class="mnp-swk" aria-hidden="true"></span><span><b>' + esc(L(ar, en)) + '</b><small>' + esc(L(sar, sen)) + '</small></span></button>';
    };
    return sw('keep', keep, 'أظهِرِ العلاماتِ في الدرس', 'Show marks in the lesson', 'التظليلُ والتسطيرُ ولونُ النصّ خارجَ الدفتر', 'Highlights, underlines and text colour outside the notebook') +
      sw('peek', peek, 'نوافذُ الملاحظات على النصّ', 'Note windows on the text', 'تظهر حين تمرّ على نصٍّ كتبتَ عليه', 'Appear when you pass over text you wrote on') +
      sw('bar', bar, 'شريطُ أدوات التحديد', 'Selection toolbar', 'يظهر حين تحدّد نصّاً في الدرس', 'Appears when you select text in the lesson');
  }
  function setOne(k, on) {
    if (k === 'keep') ink().then(function (I) { I.keep(on); });
    else if (k === 'peek') {
      try { if (on) localStorage.removeItem('garden_peek_off'); else localStorage.setItem('garden_peek_off', '1'); } catch (e) {}
      try { document.dispatchEvent(new CustomEvent('garden:peekToggle', { detail: { on: on } })); } catch (e2) {}
    } else if (k === 'bar') {
      try { if (on) sessionStorage.removeItem('garden_notes_paused'); else sessionStorage.setItem('garden_notes_paused', '1'); } catch (e) {}
    }
  }

  function build() {
    var d = document.createElement('dialog');
    d.className = 'gsf mnp';
    d.setAttribute('aria-labelledby', 'mnp-title');
    d.style.position = 'fixed';
    d.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<header class="mnp-h">' +
        '<div class="mnp-top"><h2 class="gsf-title" id="mnp-title" tabindex="-1"><i class="fa-solid fa-note-sticky" aria-hidden="true"></i> <span>' + esc(L('ملاحظاتي', 'My notes')) + '</span></h2>' +
          '<button type="button" class="mnp-ic" data-marks-btn data-mnp="marks"></button>' +
          '<button type="button" class="mnp-ic" data-mnp="set" aria-pressed="false" aria-label="' + esc(L('خياراتُ العرض', 'Display options')) + '" title="' + esc(L('خياراتُ العرض', 'Display options')) + '"><i class="fa-solid fa-sliders" aria-hidden="true"></i></button>' +
          '<button type="button" class="mnp-ic" data-mnp="x" aria-label="' + esc(L('إغلاق', 'Close')) + '" title="' + esc(L('إغلاق', 'Close')) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
        '<p class="gsf-sub mnp-sub"></p>' +
        '<div class="mnp-tabs" role="tablist" aria-label="' + esc(L('النوع', 'Kind')) + '"></div>' +
      '</header>' +
      '<div class="mnp-view mnp-view--list">' +
        '<div class="mnp-tools"><label class="mnp-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input class="gsf-in" type="search" dir="auto" placeholder="' + esc(L('ابحثْ في علاماتك وملاحظاتك…', 'Search your marks and notes…')) + '" aria-label="' + esc(L('بحث', 'Search')) + '"></label>' +
          '<div class="mnp-cols" role="group" aria-label="' + esc(L('اللون', 'Colour')) + '"></div></div>' +
        '<div class="gsf-body mnp-body"><div class="mnp-list" role="tabpanel"></div>' +
          '<button type="button" class="mnp-rmall" data-mnp="rm" hidden><i class="fa-solid fa-eraser" aria-hidden="true"></i> <span></span></button></div>' +
      '</div>' +
      '<div class="mnp-view mnp-view--set gsf-body" hidden><h3 class="mnp-st">' + esc(L('خياراتُ العرض', 'Display options')) + '</h3><div class="mnp-sws mnp-set">' + settings() + '</div></div>' +
      '<footer class="gsf-foot">' +
        '<div class="gsf-guard mnp-guard" hidden role="alert"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><p></p>' +
          '<button type="button" class="gsf-btn gsf-btn--danger gsf-btn--sm" data-mnp="rm-yes">' + esc(L('أزِلْها', 'Remove them')) + '</button>' +
          '<button type="button" class="gsf-btn gsf-btn--ghost gsf-btn--sm" data-mnp="rm-no">' + esc(L('تراجع', 'Keep them')) + '</button></div>' +
        '<div class="gsf-acts mnp-acts-f">' +
          '<button type="button" class="gsf-btn gsf-btn--go" data-mnp="open"><i class="fa-solid fa-book-open" aria-hidden="true"></i> <span>' + esc(L('صفحةُ ملاحظات الوحدة', 'Module notes page')) + '</span></button>' +
          '<button type="button" class="gsf-btn gsf-btn--ghost mnp-fi" data-mnp="copy" aria-label="' + esc(L('انسخِ الخلاصة', 'Copy summary')) + '" title="' + esc(L('انسخِ الخلاصة', 'Copy summary')) + '"><i class="fa-solid fa-copy" aria-hidden="true"></i></button>' +
          '<button type="button" class="gsf-btn gsf-btn--ghost mnp-fi" data-mnp="tonote" aria-label="' + esc(L('أضِفِ الخلاصةَ إلى الملاحظات', 'Add the summary to notes')) + '" title="' + esc(L('أضِفِ الخلاصةَ إلى الملاحظات', 'Add the summary to notes')) + '"><i class="fa-solid fa-file-circle-plus" aria-hidden="true"></i></button>' +
        '</div></footer>';
    d.addEventListener('click', onClick);
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); if (S.guard) guard(false); else close(); return; }
      var tb = e.target.closest && e.target.closest('.mnp-kind');
      if (tb && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        var tabs = [].slice.call(d.querySelectorAll('.mnp-kind')), i = tabs.indexOf(tb), rtl = getComputedStyle(d).direction === 'rtl';
        var n = tabs[(i + ((e.key === 'ArrowLeft') !== rtl ? 1 : -1) + tabs.length) % tabs.length];
        if (n) { S.kind = n.getAttribute('data-kind'); render(); var f = d.querySelector('.mnp-kind[aria-selected="true"]'); if (f) f.focus(); }
        e.preventDefault();
        return;
      }
      var it = e.target.closest && e.target.closest('.mnp-it');
      if (it && e.target === it && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); act(it, null); }
    });
    d.querySelector('input[type="search"]').addEventListener('input', function (e) { S.q = e.target.value.trim().toLowerCase(); render(); });
    d.addEventListener('close', function () { if (S.dlg === d) { S.dlg = null; d.remove(); } });
    document.body.appendChild(d);
    return d;
  }
  function view(set) {
    var d = S.dlg;
    if (!d) return;
    d.querySelector('.mnp-view--list').hidden = set;
    d.querySelector('.mnp-view--set').hidden = !set;
    d.querySelector('.mnp-tabs').hidden = set;
    d.querySelector('[data-mnp="set"]').setAttribute('aria-pressed', set ? 'true' : 'false');
    d.classList.toggle('mnp--set', set);
  }
  function act(it, b) {
    var r = (S.byK || [])[+it.getAttribute('data-k')] || null;
    if (!r) return;
    var a = b ? b.getAttribute('data-act') : '';
    if (a === 'del') del(r);
    else if (a === 'menu') menuFor(r, b);
    else jump(r);
  }
  function onClick(e) {
    var t = e.target;
    var b = t.closest('[data-act]'), it = t.closest('.mnp-it');
    if (it) { act(it, b); return; }
    var k = t.closest('.mnp-kind');
    if (k) { S.kind = k.getAttribute('data-kind'); render(); return; }
    var vb = t.closest('.mnp-vb');
    if (vb) { try { localStorage.setItem(VIEW, vb.getAttribute('data-view')); } catch (e0) {} render(); return; }
    var c = t.closest('.mnp-col');
    if (c) { var v = c.getAttribute('data-col'); S.color = S.color === v ? '' : v; render(); return; }
    var g = t.closest('.mnp-goto');
    if (g) { var sec = document.getElementById(g.getAttribute('data-sec')); if (sec) { if (matchMedia('(max-width: 640px)').matches) close(); land(sec); } return; }
    var sw = t.closest('.mnp-sw');
    if (sw) { var on = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', on); setOne(sw.getAttribute('data-set'), on); return; }
    var m = t.closest('[data-mnp]');
    if (!m) return;
    var x = m.getAttribute('data-mnp');
    if (x === 'x') close();
    else if (x === 'set') view(m.getAttribute('aria-pressed') !== 'true');
    else if (x === 'marks') { if (window.GardenMarks) GardenMarks.set(!GardenMarks.off()); }
    else if (x === 'open') { close(); note().then(function (M) { M.open({}); }); }
    else if (x === 'copy') copySummary();
    else if (x === 'tonote') toNotes();
    else if (x === 'rm') guard(true);
    else if (x === 'rm-no') guard(false);
    else if (x === 'rm-yes') removeShown();
    else if (x === 'adopt') adoptAll();
  }

  /*@3.MONPJ.5*/
  var KEEP = '.gsf-menu, .mt-sel, .mp, .mnp-toast, .mnp-flash, .sidebar-notes-btn, .mn-sheet, dialog[open]:not(.mnp)';
  function typing() {
    var d = S.dlg, q = d && d.querySelector('input[type="search"]');
    return !!(S.guard || (q && q.value.trim()));
  }
  document.addEventListener('pointerdown', function (e) {
    var d = S.dlg, t = e.target;
    if (!d || !t || t === document.documentElement || d.contains(t) || typing()) return;
    if (t.closest && t.closest(KEEP)) return;
    close();
  }, true);

  function refresh() {
    clearTimeout(S.refT);
    S.refT = setTimeout(function () {
      if (!S.dlg) return;
      var sc = S.dlg.querySelector('.mnp-body').scrollTop;
      load().then(function () { render(); if (S.dlg) S.dlg.querySelector('.mnp-body').scrollTop = sc; });
    }, 160);
  }
  document.addEventListener('garden:moduleInkSaved', refresh);
  window.addEventListener('storage', function (e) { if (e.key === 'garden_peek_t') refresh(); });
  document.addEventListener('garden:languageChanged', function () { if (S.dlg) { var o = S.opts; close(); open(o); } });

  var CSS_P = null;
  function open(o) {
    S.opts = o || {};
    S.legacy = (S.opts.legacy || []).map(function (x) { return { legacy: 1, id: x.id, text: x.highlight || '', note: x.body || x.title || '', sec: x.sec || '', st: 'note' }; });
    if (S.dlg) { S.dlg.querySelector('input[type="search"]').focus({ preventScroll: true }); return Promise.resolve(S.dlg); }
    S.kind = 'note'; S.color = ''; S.q = ''; S.guard = false;
    CSS_P = CSS_P || Promise.all([css('surface.css'), css('module-ink.css'), css('module-notes-panel.css')]);
    var data = load();
    return CSS_P.then(function () {
      if (S.dlg) return S.dlg;
      var sx = window.scrollX, sy = window.scrollY;
      var d = S.dlg = build();
      d.querySelector('.mnp-list').innerHTML = '<p class="gsf-rows-empty">…</p>';
      var mb = d.querySelector('[data-marks-btn]');
      if (mb) { if (window.GardenMarks) GardenMarks.paint(mb); else mb.remove(); }
      try { d.show(); } catch (e) { d.setAttribute('open', ''); }
      try { d.querySelector('#mnp-title').focus({ preventScroll: true }); } catch (e2) {}
      if (window.scrollX !== sx || window.scrollY !== sy) window.scrollTo({ left: sx, top: sy, behavior: 'instant' });
      return data.then(function () { render(); return d; });
    });
  }
  function close() {
    var d = S.dlg;
    if (!d) return;
    S.dlg = null;
    try { d.close(); } catch (e) {}
    d.remove();
  }

  window.GardenModPanel = { open: open, close: close, isOpen: function () { return !!S.dlg; } };
})();
