(function () {
  'use strict';

  var MAX_FILES = 60;
  var AUDIO_EXT = /\.(m4a|m4b|mp3|wav|aac|amr|3gpp?|ogg|oga|opus|webm|flac|caf|mp4|mov|mkv)$/i;
  var TEXT_EXT = /\.(md|markdown|txt|json)$/i;
  var CODE_RE = /(?:^|[^A-Za-z])([A-Za-z]{2,4})[\s_-]?(\d{3})(?!\d)/;

  var A = null, dlg = null, rows = [], busy = false, finished = false;

  function L(a, e) { return A.L(a, e); }
  function esc(s) { return A.esc(s); }
  function lat(s) { return '<span class="nb-lat">' + esc(s) + '</span>'; }

  function fmtSize(b) {
    b = Number(b) || 0;
    if (b < 1024) return b + ' B';
    if (b < 1048576) return Math.max(1, Math.round(b / 1024)) + ' KB';
    return (b / 1048576).toFixed(b < 10485760 ? 1 : 0) + ' MB';
  }

  function kindOf(f) {
    var n = f.name || '', t = (f.type || '').toLowerCase();
    if (t === 'application/pdf' || /\.pdf$/i.test(n)) return 'pdf';
    if (/^(audio|video)\//.test(t) || AUDIO_EXT.test(n) || A.isMedia(f)) return 'audio';
    if (/^text\//.test(t) || t === 'application/json' || TEXT_EXT.test(n)) return 'text';
    return '';
  }
  function kindName(k) {
    if (k === 'pdf') return 'PDF';
    if (k === 'audio') return L('تسجيل', 'Recording');
    if (k === 'text') return L('ملاحظة', 'Note');
    return L('غير مدعوم', 'Not supported');
  }
  function kindIcon(k) {
    if (k === 'pdf') return 'fa-file-lines';
    if (k === 'audio') return 'fa-microphone';
    if (k === 'text') return 'fa-file-lines';
    return 'fa-circle-xmark';
  }
  function baseName(n) {
    return String(n || '').replace(/\.[a-z0-9]{1,8}$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
  }
  function codeOf(n) {
    var m = CODE_RE.exec(String(n || ''));
    if (!m) return '';
    var c = m[1].toUpperCase() + m[2];
    return A.known(c) ? c : '';
  }

  function plan(files) {
    var fs = A.folders(), here = A.here(), out = [];
    function folderFor(code) {
      if (!code) return here;
      for (var i = 0; i < fs.length; i++) {
        var nm = String(fs[i].name || '').trim().toUpperCase();
        if (nm === code || nm.indexOf(code + ' ') === 0) return fs[i].id;
      }
      return here || ('new:' + code);
    }
    for (var i = 0; i < files.length; i++) {
      var f = files[i], k = kindOf(f), why = '';
      var lim = k ? A.limits[k] : 0;
      if (!k) why = L('نوعٌ غيرُ مدعوم', 'Unsupported type');
      else if (lim && f.size > lim) why = L('أكبرُ من الحدّ (', 'Over the limit (') + fmtSize(lim) + ')';
      else if (!f.size) why = L('ملفٌّ فارغ', 'Empty file');
      if (i >= MAX_FILES && !why) why = L('أكثرُ من ', 'More than ') + MAX_FILES + L(' ملفّاً في المرّة', ' files at once');
      var code = codeOf(f.name);
      out.push({ file: f, kind: k, title: baseName(f.name), code: code, dest: why ? '' : folderFor(code),
                 skip: !!why, why: why, st: why ? 'skip' : 'wait', pct: 0, err: '' });
    }
    return out;
  }

  function destOptions(sel, codes) {
    var fs = A.folders(), h = '<option value=""' + (sel === '' ? ' selected' : '') + '>' + esc(L('بلا مجلّد', 'No folder')) + '</option>';
    for (var i = 0; i < fs.length; i++) {
      h += '<option value="' + esc(fs[i].id) + '"' + (sel === fs[i].id ? ' selected' : '') + '>' + esc(fs[i].path) + '</option>';
    }
    for (var c in codes) {
      var v = 'new:' + c;
      h += '<option value="' + esc(v) + '"' + (sel === v ? ' selected' : '') + '>' + esc(L('مجلّدٌ جديد: ', 'New folder: ') + c) + '</option>';
    }
    return h;
  }

  function codesSet() {
    var o = {};
    for (var i = 0; i < rows.length; i++) if (rows[i].code) o[rows[i].code] = 1;
    return o;
  }

  function stHtml(r) {
    if (r.st === 'skip') return '<span class="nb-st nb-st--bad">' + esc(r.why) + '</span>';
    if (r.st === 'run') return '<span class="nb-st"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>' + (r.pct ? ' ' + lat(r.pct + '%') : '') + '</span>';
    if (r.st === 'ok') return '<span class="nb-st nb-st--ok"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ' + esc(L('تمّ', 'Done')) + '</span>';
    if (r.st === 'bad') return '<span class="nb-st nb-st--bad"><i class="fa-solid fa-circle-xmark" aria-hidden="true"></i> ' + esc(r.err) + '</span>';
    return '';
  }

  function rowHtml(r, i) {
    var codes = codesSet();
    return '<tr class="nb-row" data-i="' + i + '" data-st="' + r.st + '">' +
      '<td class="nb-n"><i class="fa-solid ' + kindIcon(r.kind) + ' nb-ic" data-k="' + esc(r.kind) + '" aria-hidden="true"></i>' +
        (r.skip ? '<span class="nb-name" dir="auto">' + esc(r.file.name) + '</span>'
          : '<input class="gsf-in nb-in" data-f="title" dir="auto" value="' + esc(r.title) + '" aria-label="' + esc(L('الاسم', 'Name')) + '"' + (busy || finished ? ' disabled' : '') + '>') +
      '</td>' +
      '<td class="nb-k">' + esc(kindName(r.kind)) + (r.code ? ' · ' + lat(r.code) : '') + '</td>' +
      '<td class="nb-s">' + lat(fmtSize(r.file.size)) + '</td>' +
      '<td class="nb-d">' + (r.skip ? '' : '<select class="gsf-in nb-sel" data-f="dest" aria-label="' + esc(L('إلى مجلّد', 'To folder')) + '"' + (busy || finished ? ' disabled' : '') + '>' + destOptions(r.dest, codes) + '</select>') + '</td>' +
      '<td class="nb-x">' + stHtml(r) +
        (busy || finished ? '' : '<button type="button" class="nb-rm" data-a="rm" aria-label="' + esc(L('أزِلْ من القائمة', 'Remove from list')) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>') +
      '</td></tr>';
  }

  function counts() {
    var c = { go: 0, skip: 0, ok: 0, bad: 0, bytes: 0 };
    rows.forEach(function (r) {
      if (r.skip) c.skip++; else c.go++;
      if (r.st === 'ok') c.ok++;
      if (r.st === 'bad') c.bad++;
      c.bytes += r.file.size || 0;
    });
    return c;
  }

  function render() {
    var c = counts();
    var head = dlg.querySelector('.nb-head');
    head.innerHTML =
      '<h2 class="gsf-title" id="nb-t">' + esc(L('استيرادُ ', 'Import ')) + lat(String(rows.length)) + esc(L(rows.length === 1 ? ' ملفّ' : (rows.length <= 10 ? ' ملفّات' : ' ملفّاً'), rows.length === 1 ? ' file' : ' files')) + '</h2>' +
      '<p class="gsf-sub">' + lat(fmtSize(c.bytes)) + ' · ' + esc(L('تُحفظ على هذا الجهاز أوّلاً، ثمّ ترفعها حيث تشاء من كلِّ ملاحظة.',
        'Kept on this device first; upload each one where you like from its note.')) + '</p>' +
      (busy || finished || !c.go ? '' :
        '<label class="nb-all"><span>' + esc(L('المجلّد للكلّ', 'Folder for all')) + '</span>' +
        '<select class="gsf-in nb-sel" data-f="all"><option value="*">' + esc(L('— كما هو في كلِّ صفّ —', '— as set per row —')) + '</option>' +
        destOptions('*', codesSet()) + '</select></label>');
    dlg.querySelector('.nb-tb').innerHTML = rows.map(rowHtml).join('');
    var foot = dlg.querySelector('.nb-foot');
    var msg = finished
      ? L('استُورد ', 'Imported ') + c.ok + (c.bad ? L(' · تعذّر ', ' · failed ') + c.bad : '')
      : (busy ? L('يُستورد… ', 'Importing… ') + c.ok + ' / ' + c.go
              : c.go + L(' سيُستورد', ' to import') + (c.skip ? L(' · ', ' · ') + c.skip + L(' مستبعَد', ' skipped') : ''));
    foot.innerHTML = '<span class="nb-msg" role="status">' + esc(msg) + '</span>' +
      (finished
        ? '<button type="button" class="gsf-btn gsf-btn--go" data-a="close">' + esc(L('تمّ', 'Done')) + '</button>'
        : '<button type="button" class="gsf-btn gsf-btn--ghost" data-a="close"' + (busy ? ' disabled' : '') + '>' + esc(L('إلغاء', 'Cancel')) + '</button>' +
          '<button type="button" class="gsf-btn gsf-btn--go" data-a="go"' + (busy || !c.go ? ' disabled' : '') + '>' +
            '<i class="fa-solid fa-file-import" aria-hidden="true"></i> ' + esc(L('استورد ', 'Import ')) + lat(String(c.go)) + '</button>');
    A.i18n(dlg);
    if (window.GardenSelect) { try { GardenSelect.enhance(dlg); GardenSelect.sync(dlg); } catch (e) {} }
  }

  function paintRow(i) {
    var tr = dlg && dlg.querySelector('.nb-row[data-i="' + i + '"]');
    if (!tr) return;
    tr.setAttribute('data-st', rows[i].st);
    var x = tr.querySelector('.nb-x');
    if (x) x.innerHTML = stHtml(rows[i]);
  }

  function errText(e) {
    var m = (e && e.message) || '';
    if (m === 'too-large') return L('أكبرُ من الحدّ', 'Too large');
    if (m === 'too-many-pages') return L('صفحاتُه أكثرُ من الحدّ', 'Too many pages');
    if (m === 'toobig') return L('أكبرُ من الحدّ', 'Too large');
    if (m === 'badfile') return L('صيغةٌ لا تُقرأ', 'Unreadable format');
    if (m === 'empty') return L('لا نصَّ فيه', 'No text in it');
    if (e && e.cancelled) return L('أُلغي', 'Cancelled');
    return L('تعذّرت قراءتُه', 'Could not read it');
  }

  function run() {
    if (busy) return;
    busy = true;
    var made = {}, first = null, dests = {};
    rows.forEach(function (r) {
      if (r.skip) return;
      var d = r.dest || '';
      if (d.indexOf('new:') === 0) {
        if (!made[d]) made[d] = A.mkFolder(d.slice(4));
        d = made[d];
      }
      r.fid = d;
      dests[d] = 1;
    });
    render();
    var chain = Promise.resolve();
    rows.forEach(function (r, i) {
      if (r.skip) return;
      chain = chain.then(function () {
        if (!dlg || !dlg.open) return;
        r.st = 'run';
        paintRow(i);
        return A.one({
          file: r.file, kind: r.kind, title: r.title,
          place: { f: r.fid || null, c: r.code || null },
          onProgress: function (at, of) {
            if (!of) return;
            var p = Math.round(at * 100 / of);
            if (p !== r.pct) { r.pct = p; paintRow(i); }
          }
        }).then(function (ids) {
          r.st = 'ok';
          if (!first && ids && ids[0]) first = ids[0];
        }, function (e) {
          r.st = 'bad';
          r.err = errText(e);
        }).then(function () { paintRow(i); });
      });
    });
    chain.then(function () {
      busy = false;
      finished = true;
      var keys = Object.keys(dests);
      A.done(keys.length === 1 && keys[0] ? keys[0] : null);
      if (dlg) render();
    });
  }

  function onClick(e) {
    var b = e.target.closest('[data-a]');
    if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'close') { if (!busy) close(); return; }
    if (a === 'go') { run(); return; }
    if (a === 'rm' && !busy && !finished) {
      var i = Number(b.closest('.nb-row').getAttribute('data-i'));
      rows.splice(i, 1);
      if (!rows.length) { close(); return; }
      render();
    }
  }

  function onChange(e) {
    var t = e.target, f = t.getAttribute && t.getAttribute('data-f');
    if (!f || busy || finished) return;
    if (f === 'all') {
      if (t.value === '*') return;
      rows.forEach(function (r) { if (!r.skip) r.dest = t.value; });
      render();
      return;
    }
    var tr = t.closest('.nb-row');
    if (!tr) return;
    var r = rows[Number(tr.getAttribute('data-i'))];
    if (!r) return;
    if (f === 'title') r.title = t.value.trim() || baseName(r.file.name);
    if (f === 'dest') r.dest = t.value;
  }

  function close() {
    if (!dlg) return;
    try { dlg.close(); } catch (e) {}
    dlg.remove();
    dlg = null;
  }

  function open(files, api) {
    A = api;
    var list = Array.prototype.slice.call(files || []);
    if (!list.length) return;
    if (dlg && busy) return;
    close();
    rows = plan(list);
    busy = false;
    finished = false;
    dlg = document.createElement('dialog');
    dlg.className = 'gsf gsf--flat nb';
    dlg.setAttribute('aria-labelledby', 'nb-t');
    dlg.setAttribute('data-keep-open', '1');
    dlg.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<div class="gsf-body"><div class="gsf-head nb-head"></div>' +
        '<div class="nb-tw"><table class="nb-tbl"><thead><tr>' +
          '<th>' + esc(L('الملفّ', 'File')) + '</th><th>' + esc(L('النوع', 'Kind')) + '</th>' +
          '<th>' + esc(L('الحجم', 'Size')) + '</th><th>' + esc(L('إلى', 'To')) + '</th><th></th>' +
        '</tr></thead><tbody class="nb-tb"></tbody></table></div></div>' +
      '<div class="gsf-foot"><div class="gsf-acts nb-foot"></div></div>';
    dlg.addEventListener('click', onClick);
    dlg.addEventListener('change', onChange);
    dlg.addEventListener('cancel', function (e) { if (busy) e.preventDefault(); else { e.preventDefault(); close(); } });
    (document.getElementById('na') || document.body).appendChild(dlg);
    render();
    try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
  }

  window.GardenNotesBulk = {
    open: open,
    plan: function (files, api) { A = api; return plan(Array.prototype.slice.call(files || [])); },
    busy: function () { return busy; }
  };
})();
