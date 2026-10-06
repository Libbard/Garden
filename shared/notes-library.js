(function () {
  'use strict';
  if (window.GardenNotesLibrary) return;

  var SRC = (document.currentScript && document.currentScript.src) || '';
  var DIR = SRC.replace(/[^/]*$/, '');
  var VER = (SRC.split('?')[1] || '');
  var loading = null;

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
      var s = document.createElement('script'); s.src = DIR + name + (VER ? '?' + VER : '');
      s.onload = function () { res(); }; s.onerror = function () { rej(new Error(name)); };
      document.head.appendChild(s);
    });
  }
  function deps() {
    if (loading) return loading;
    css('library.css');
    loading = js('library.js', function () { return !!window.GardenLibrary; })
      .then(function () { return js('paint-gl.js', function () { return !!window.GardenPaintGL; }); })
      .then(function () { return js('coloring.js', function () { return !!window.GardenColoring; }); })
      .catch(function (e) { loading = null; throw e; });
    return loading;
  }

  function toast(msg) {
    var t = document.createElement('div'); t.className = 'nlib-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }

  function dims(blob) {
    return new Promise(function (res) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { res({ w: im.naturalWidth, h: im.naturalHeight }); URL.revokeObjectURL(u); };
      im.onerror = function () { res(null); URL.revokeObjectURL(u); };
      im.src = u;
    });
  }

  function insert(blob, wm, alt) {
    var app = window.GardenNotesApp;
    if (!app || !app.insertImage) { toast(T('افتحْ ملاحظةً أوّلاً ثمّ أدرجْ فيها.', 'Open a note first, then insert.')); return Promise.resolve(false); }
    return dims(blob).then(function (d) {
      return app.insertImage(blob, { wm: wm, alt: alt || '', iar: d ? Math.round(d.w / d.h * 1000) / 1000 : 0, inw: d ? d.w : 0, name: 'mirsam.webp' });
    }).then(function (ok) {
      if (!ok) toast(T('تعذّر الإدراجُ هنا. افتحْ صفحةً من الملاحظة ثمّ أعدِ المحاولة.', 'Could not insert here. Open a page of the note and try again.'));
      return ok;
    }, function () { toast(T('الصورةُ أكبرُ من أن تُحفظ.', 'The image is too large to save.')); return false; });
  }

  function fetchBlob(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); }); }

  function studio(item, mode) {
    var d = document.createElement('dialog');
    d.className = 'gsf nlib-studio';
    d.setAttribute('data-keep-open', '');
    d.innerHTML = '<div class="nlib-head"><h2 class="gsf-title"></h2><span class="nlib-sp"></span>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost nlib-show"></button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost nlib-cancel"></button>' +
      '<button type="button" class="gsf-btn gsf-btn--go nlib-insert"></button></div>' +
      '<div class="gsf-guard nlib-guard" hidden><p></p><button type="button" class="gsf-btn gsf-btn--sm nlib-g-ins"></button><button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nlib-g-drop"></button></div>' +
      '<div class="nlib-body"></div>';
    var $ = function (s) { return d.querySelector(s); };
    $('.gsf-title').textContent = (en() ? item.en : item.ar) || T('المرسم', 'Studio');
    $('.nlib-show').textContent = T('اعرضِ النتيجة', 'Show the result');
    $('.nlib-cancel').textContent = T('إغلاق', 'Close');
    $('.nlib-insert').textContent = T('أدرجْ في الصفحة', 'Insert into the page');
    $('.nlib-guard p').textContent = T('لم تُدرجْ ما رسمتَه بعد.', 'You have not inserted your drawing yet.');
    $('.nlib-g-ins').textContent = T('أدرجْه', 'Insert it');
    $('.nlib-g-drop').textContent = T('تجاهلْه', 'Discard');
    $('.nlib-show').hidden = mode === 'lesson';
    document.body.appendChild(d);
    d.showModal();
    var st = GardenColoring.create($('.nlib-body'), {});
    var ready = mode === 'lesson'
      ? GardenLibrary.svg(item).then(function (svg) { return st.lesson({ svg: svg }); })
      : st.load({ lineUrl: item.line, refUrl: item.color });
    ready.catch(function () { toast(T('تعذّر فتحُ الرسم.', 'Could not open the drawing.')); });
    var done = false;
    function close() { if (done) return; done = true; try { st.destroy(); } catch (e) {} d.close(); d.remove(); }
    function doInsert() {
      var b = $('.nlib-insert'); b.disabled = true;
      st.toBlob().then(function (blob) { return insert(blob, .6, (en() ? item.en : item.ar) || ''); })
        .then(function (ok) { if (ok) close(); else b.disabled = false; });
    }
    $('.nlib-insert').addEventListener('click', doInsert);
    $('.nlib-g-ins').addEventListener('click', doInsert);
    $('.nlib-g-drop').addEventListener('click', close);
    $('.nlib-show').addEventListener('click', function () { st.paintOriginal(); });
    var ask = function () { if (st.undo && st.undo.length) { $('.nlib-guard').hidden = false; return; } close(); };
    $('.nlib-cancel').addEventListener('click', ask);
    d.addEventListener('cancel', function (e) { e.preventDefault(); ask(); });
  }

  function open() {
    return deps().then(function () {
      GardenLibrary.open({
        kind: 'sticker',
        onPick: function (item, how) {
          if (how === 'sticker') return fetchBlob(item.sticker).then(function (b) { return insert(b, .2, ''); });
          if (how === 'color-done') return fetchBlob(item.color).then(function (b) { return insert(b, .6, (en() ? item.en : item.ar) || ''); });
          studio(item, how === 'lesson' ? 'lesson' : 'color');
        }
      });
    }, function () { toast(T('تعذّر تحميلُ المرسم. تحقّقْ من الاتصال.', 'Could not load the studio. Check your connection.')); });
  }

  window.GardenNotesLibrary = { open: open, deps: deps };
})();
