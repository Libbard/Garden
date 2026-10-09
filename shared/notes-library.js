(function () {
  'use strict';
  if (window.GardenNotesLibrary) return;

  var SRC = (document.currentScript && document.currentScript.src) || '';
  var DIR = SRC.replace(/[^/]*$/, '');
  var VER = (SRC.split('?')[1] || '');
  var loading = null, live = null;

  function en() { return (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2) === 'en'; }
  function T(ar, e) { return en() ? e : ar; }
  function css(name) {
    if (document.querySelector('link[data-lib="' + name + '"]')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = DIR + name + (VER ? '?' + VER : ''); l.dataset.lib = name;
    document.head.appendChild(l);
  }
  function js(name, test) {
    if (test()) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = DIR + name + (VER ? '?' + VER : ''); s.async = false;
      s.onload = function () { res(); }; s.onerror = function () { rej(new Error(name)); };
      document.head.appendChild(s);
    });
  }
  var picker = null;
  function pickerDeps() {
    if (picker) return picker;
    css('library.css');
    picker = js('library.js', function () { return !!window.GardenLibrary; }).catch(function (e) { picker = null; throw e; });
    return picker;
  }
  function deps() {
    if (loading) return loading;
    loading = Promise.all([pickerDeps(),
      js('notes-input.js', function () { return !!window.GardenInkInput; }),
      js('paint-gl.js', function () { return !!window.GardenPaintGL; }),
      js('coloring.js', function () { return !!window.GardenColoring; })])
      .then(function (r) { setTimeout(function () { try { if (GardenColoring.warm) GardenColoring.warm(); } catch (e) {} }, 0); return r; })
      .catch(function (e) { loading = null; throw e; });
    return loading;
  }

  function toast(msg) {
    var t = document.createElement('div'); t.className = 'nlib-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    var host = document.querySelector('dialog.nlib-studio[open]') || document.body;
    host.appendChild(t); setTimeout(function () { t.remove(); }, 2800);
  }

  function dims(blob) {
    return new Promise(function (res) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { res({ w: im.naturalWidth, h: im.naturalHeight }); URL.revokeObjectURL(u); };
      im.onerror = function () { res(null); URL.revokeObjectURL(u); };
      im.src = u;
    });
  }

  function insert(blob, wm, alt, ms, stk) {
    var app = window.GardenNotesApp;
    if (!app || !app.insertImage) { toast(T('افتحْ ملاحظةً أوّلاً ثمّ أدرجْ فيها.', 'Open a note first, then insert.')); return Promise.resolve(false); }
    return dims(blob).then(function (d) {
      return app.insertImage(blob, { wm: wm, alt: alt || '', iar: d ? Math.round(d.w / d.h * 1000) / 1000 : 0, inw: d ? Math.min(d.w, 900) : 0, name: 'mirsam.webp', ms: ms || null, stk: !!stk });
    }).then(function (ok) {
      if (!ok) toast(T('تعذّر الإدراجُ هنا. افتحْ صفحةً من الملاحظة ثمّ أعدِ المحاولة.', 'Could not insert here. Open a page of the note and try again.'));
      return ok;
    }, function () { toast(T('الصورةُ أكبرُ من أن تُحفظ.', 'The image is too large to save.')); return false; });
  }

  function fetchBlob(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); }); }

  function saveLayer(st) {
    var S = window.GardenNotesStore;
    if (!S || !S.putImage) return Promise.resolve(null);
    var pjP = st.exportProject ? st.exportProject().then(function (b) { return S.putImage(b, { name: 'drawing.mirsam' }); }).catch(function () { return null; }) : Promise.resolve(null);
    var lyP = st.paintBlob().then(function (b) { return b ? S.putImage(b, { name: 'mirsam-layer.webp' }) : null; }).catch(function () { return null; });
    return Promise.all([lyP, pjP]).then(function (r) {
      if (!r[0] && !r[1]) return null;
      var ms = st.project();
      if (r[0]) ms.pr = 'byte-local:' + r[0];
      if (r[1]) ms.pj = 'byte-local:' + r[1];
      return ms;
    });
  }
  function saveMine(st) {
    var app = window.GardenNotesApp;
    if (!app || !app.saveDrawing || !st.S) { toast(T('افتحِ الملاحظاتِ ليُحفظَ الرسمُ في حسابك.', 'Open your notes to save the drawing to your account.')); return Promise.resolve(false); }
    if (st.S.wet) st.S.dryNow();
    var t = st.title || T('رسمتي', 'My drawing');
    return Promise.all([st.toBlob('image/webp', .92), saveLayer(st)]).then(function (r) {
      return dims(r[0]).then(function (d) {
        return app.saveDrawing(r[0], { title: t, ms: r[1], iar: d ? Math.round(d.w / d.h * 1000) / 1000 : 0, inw: d ? Math.min(d.w, 900) : 0 });
      });
    }).then(function () { st.changed = 0; toast(T('حُفظت في «رسوماتي» — تجدها في ملاحظاتك وعلى كلِّ أجهزتك.', 'Saved to “My drawings” — find it in your notes on every device.')); return true; },
      function () { toast(T('تعذّر الحفظ. حاولْ مرّةً أخرى.', 'Could not save. Try again.')); return false; });
  }

  function studio(item, mode, edit) {
    var d = document.createElement('dialog');
    d.className = 'gsf gsf--stage nlib-studio';
    d.setAttribute('data-keep-open', '');
    d.setAttribute('aria-label', T('المرسم', 'Studio'));
    d.innerHTML = '<div class="gsf-guard nlib-guard" hidden><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><p></p>' +
      '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--go nlib-g-ins"></button><button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nlib-g-drop"></button>' +
      '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nlib-g-stay"></button></div><div class="nlib-body"></div>';
    var $ = function (s) { return d.querySelector(s); };
    $('.nlib-guard p').textContent = edit ? T('لم تحفظْ تعديلَك في الصفحة بعد.', 'You have not saved your changes to the page yet.') : T('لم تُدرجْ ما رسمتَه بعد.', 'You have not inserted your drawing yet.');
    $('.nlib-g-ins').textContent = edit ? T('احفظْه', 'Save it') : T('أدرجْه', 'Insert it');
    $('.nlib-g-drop').textContent = T('تجاهلْه', 'Discard');
    $('.nlib-g-stay').textContent = T('أكملِ الرسم', 'Keep drawing');
    document.body.appendChild(d);
    d.showModal();
    var hist = false;
    try { history.pushState({ mirsam: 1 }, ''); hist = true; } catch (e) {}
    var done = false, busy = false;
    var st = GardenColoring.create($('.nlib-body'), {
      insertLabel: edit ? ['احفظْ في الصفحة', 'Save to page'] : null,
      onClose: function () { ask(); },
      onInsert: function () { doInsert(); },
      onSaveMine: function (s) { return saveMine(s); },
      onOpenFile: function (pj) {
        var go = function () { st.load({ project: pj, title: pj.head.title }).then(function () { st.changed = 0; }); };
        if (st.isDirty && st.isDirty()) { pendingOpen = go; $('.nlib-guard').hidden = false; $('.nlib-g-stay').focus(); } else go();
      }
    });
    var pendingOpen = null;
    live = st;
    var name = (en() ? item.en : item.ar) || item.title || '';
    var ready = mode === 'lesson'
      ? GardenLibrary.svg(item).then(function (svg) { return st.lesson({ svg: svg, title: name }); })
      : item.project ? st.load({ project: item.project, title: name })
      : st.load({ lineUrl: item.line, refUrl: item.color, paintUrl: item.paintUrl || null, W: item.W, H: item.H, paper: item.paper, id: item.id, title: name });
    ready.then(function () { if (st.item && item.id) st.item.id = item.id; }, function () { toast(T('تعذّر فتحُ الرسم. تحقّقْ من الاتصال.', 'Could not open the drawing. Check your connection.')); });
    function close(fromPop) {
      if (done) return; done = true;
      if (live === st) live = null;
      window.removeEventListener('popstate', onPop);
      try { st.destroy(); } catch (e) {}
      try { d.close(); } catch (e2) {}
      d.remove();
      if (hist && !fromPop) { try { if (history.state && history.state.mirsam) history.back(); } catch (e3) {} }
    }
    function doInsert() {
      if (busy || !st.S) return; busy = true;
      var b = d.querySelector('.mrs-insert'); if (b) b.disabled = true;
      if (st.S.wet) st.S.dryNow();
      var layerP = saveLayer(st);
      st.toBlob('image/webp', .92).then(function (blob) {
        return layerP.then(function (ms) {
          if (ms) { ms.it = ms.it || item.id || ''; ms.ln = ms.ln || item.line || ''; ms.cr = ms.cr || item.color || ''; }
          if (edit) return edit.onSave(blob, ms).then(function (ok) { return ok !== false; });
          return insert(blob, .6, name, ms);
        });
      }).then(function (ok) {
        busy = false;
        if (ok) close(); else if (b) b.disabled = false;
      }, function () {
        busy = false; if (b) b.disabled = false;
        toast(T('تعذّر الحفظ. حاولْ مرّةً أخرى.', 'Could not save. Try again.'));
      });
    }
    function ask() {
      if (st.isDirty && st.isDirty()) { $('.nlib-guard').hidden = false; $('.nlib-g-stay').focus(); return false; }
      close(); return true;
    }
    function onPop() {
      if (done) return;
      if (st.isDirty && st.isDirty()) { try { history.pushState({ mirsam: 1 }, ''); } catch (e) {} $('.nlib-guard').hidden = false; return; }
      close(true);
    }
    window.addEventListener('popstate', onPop);
    $('.nlib-g-ins').addEventListener('click', function () { $('.nlib-guard').hidden = true; doInsert(); });
    $('.nlib-g-drop').addEventListener('click', function () { var go = pendingOpen; pendingOpen = null; if (go) { $('.nlib-guard').hidden = true; go(); } else close(); });
    $('.nlib-g-stay').addEventListener('click', function () { pendingOpen = null; $('.nlib-guard').hidden = true; });
    d.addEventListener('cancel', function (e) {
      e.preventDefault();
      if (st.orig) { st.setOrig(false); return; }
      if (!$('.nlib-guard').hidden) { $('.nlib-guard').hidden = true; return; }
      ask();
    });
    return st;
  }

  function open() {
    var ready = pickerDeps();
    ready.then(deps).catch(function () {});
    return ready.then(function () {
      GardenLibrary.open({
        kind: 'sticker',
        onSelect: function (item) { if (item.line && window.GardenColoring && GardenColoring.precompute) GardenColoring.precompute(item); },
        onPick: function (item, how) {
          if (how === 'sticker') return fetchBlob(item.sticker).then(function (b) { return insert(b, .2, '', null, true); });
          if (how === 'color-done') return fetchBlob(item.color).then(function (b) { return insert(b, .6, (en() ? item.en : item.ar) || '', { v: 1, it: item.id, ln: item.line, cr: item.color, done: 1 }); });
          deps().then(function () { studio(item, how === 'lesson' ? 'lesson' : 'color'); }, function () { toast(T('تعذّر تحميلُ المرسم. تحقّقْ من الاتصال.', 'Could not load the studio. Check your connection.')); });
        }
      });
    }, function () { toast(T('تعذّر تحميلُ المرسم. تحقّقْ من الاتصال.', 'Could not load the studio. Check your connection.')); });
  }

  function projectOf(ms) {
    var S = window.GardenNotesStore, ref = ms && ms.pj;
    if (!ref || !/^byte-local:[0-9a-f]{24}$/.test(ref) || !S || !S.getImage) return Promise.resolve(null);
    return S.getImage(ref.slice(11)).then(function (r) { return r && r.blob ? GardenColoring.readProject(r.blob) : null; }).catch(function () { return null; });
  }
  function layerUrl(ms) {
    var S = window.GardenNotesStore, ref = ms && ms.pr;
    if (!ref || !/^byte-local:[0-9a-f]{24}$/.test(ref) || !S || !S.imageUrl) return Promise.resolve(null);
    return Promise.resolve(S.imageUrl(ref.slice(11))).catch(function () { return null; });
  }

  function edit(ms, opts) {
    opts = opts || {};
    return deps().then(function () {
      return projectOf(ms).then(function (pj) {
        if (pj) { var sp = studio({ project: pj, title: opts.title || pj.head.title || '', id: ms.it, line: ms.ln, color: ms.cr }, 'color', { onSave: opts.onSave }); return sp; }
        return layerUrl(ms).then(function (u) {
        var item = { id: ms.it, line: ms.ln, color: ms.cr, paintUrl: ms.done ? null : u, W: ms.W, H: ms.H, paper: ms.pp, title: opts.title || '' };
        var st = studio(item, 'color', { onSave: opts.onSave });
        if (ms.done && ms.cr) st.opts.onRef = function (s) { if (s.refImg && s.S) { s.S.loadPaint(s.refImg); s.kick(); } };
        return st;
        });
      });
    }, function () { toast(T('تعذّر تحميلُ المرسم. تحقّقْ من الاتصال.', 'Could not load the studio. Check your connection.')); });
  }

  function color(item, how) { return deps().then(function () { return studio(item, how === 'lesson' ? 'lesson' : 'color'); }); }
  function openFile(file) {
    return deps().then(function () { return GardenColoring.readProject(file); }).then(function (pj) { return studio({ project: pj, title: pj.head.title }, 'color'); },
      function () { toast(T('هذا ليس ملفَّ مرسم.', 'This is not a studio file.')); return null; });
  }

  var warmed = false;
  function warm(e) {
    if (warmed || !e.target || !e.target.closest || !e.target.closest('#na-lib-top')) return;
    warmed = true;
    pickerDeps().then(function () { if (GardenLibrary.warm) GardenLibrary.warm('sticker'); }).catch(function () { warmed = false; });
  }
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('touchstart', warm, { passive: true });
  document.addEventListener('focusin', warm);

  window.GardenNotesLibrary = { open: open, deps: deps, edit: edit, color: color, openFile: openFile, current: function () { return live; } };
})();
