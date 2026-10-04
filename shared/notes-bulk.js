(function () {
  'use strict';

  var MAX_FILES = 60;
  var AUDIO_EXT = /\.(m4a|m4b|mp3|wav|aac|amr|3gpp?|ogg|oga|opus|webm|flac|caf|mp4|mov|mkv)$/i;
  var TEXT_EXT = /\.(md|markdown|txt|json)$/i;
  var CODE_RE = /(?:^|[^A-Za-z])([A-Za-z]{2,4})[\s_-]?(\d{3})(?!\d)/;
  var ACCEPT = '.pdf,application/pdf,audio/*,video/*,.m4a,.mp3,.wav,.aac,.ogg,.opus,.webm,.flac,.md,.markdown,.txt,.json';

  var A = null, dlg = null, rows = [], busy = false, finished = false, stopAsk = false, seq = 0;
  /*@3.NOBJ2.4*/
  var KEEP_LS = 'notes_bulk_keep', keepTo = 'here';
  function keepRead() { try { var v = localStorage.getItem(KEEP_LS); return v === 'us' || v === 'gd' ? v : 'here'; } catch (e) { return 'here'; } }
  function keepWrite(v) { try { if (v === 'here') localStorage.removeItem(KEEP_LS); else localStorage.setItem(KEEP_LS, v); } catch (e) {} }

  function L(a, e) { return A.L(a, e); }
  function esc(s) { return A.esc(s); }
  function lat(s) { return '<span class="nb-lat">' + esc(s) + '</span>'; }
  function ic(n) { return '<i class="fa-solid ' + n + '" aria-hidden="true"></i>'; }

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
    if (k === 'text') return 'fa-note-sticky';
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
  function normCode(v) {
    var m = /([A-Za-z]{2,4})\s*-?\s*(\d{3})/.exec(String(v || ''));
    if (!m) return '';
    var c = m[1].toUpperCase() + m[2];
    return A.known(c) ? c : '';
  }
  function folderFor(code) {
    var fs = A.folders(), here = A.here();
    if (!code) return here;
    for (var i = 0; i < fs.length; i++) {
      var nm = String(fs[i].name || '').trim().toUpperCase();
      if (nm === code || nm.indexOf(code + ' ') === 0) return fs[i].id;
    }
    return here || ('new:' + code);
  }

  function plan(files, from) {
    var out = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i], k = kindOf(f), why = '';
      var lim = k ? A.limits[k] : 0;
      if (!k) why = L('نوعٌ غيرُ مدعوم', 'Unsupported type');
      else if (lim && f.size > lim) why = L('أكبرُ من الحدّ (', 'Over the limit (') + fmtSize(lim) + ')';
      else if (!f.size) why = L('ملفٌّ فارغ', 'Empty file');
      if ((from || 0) + i >= MAX_FILES && !why) why = L('أكثرُ من ', 'More than ') + MAX_FILES + L(' ملفّاً في المرّة', ' files at once');
      var code = codeOf(f.name);
      out.push({ id: ++seq, file: f, kind: k, title: baseName(f.name), code: code, auto: 1, dest: why ? '' : folderFor(code),
                 skip: !!why, why: why, st: why ? 'skip' : 'wait', pct: 0, err: '' });
    }
    return out;
  }

  function codesSet() {
    var o = {};
    for (var i = 0; i < rows.length; i++) if (rows[i].code) o[rows[i].code] = 1;
    return o;
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

  function stHtml(r) {
    if (r.st === 'skip') return '<span class="nb-st nb-st--bad">' + ic('fa-circle-minus') + esc(r.why) + '</span>';
    if (r.st === 'stop') return '<span class="nb-st">' + ic('fa-circle-pause') + esc(L('أُوقف', 'Stopped')) + '</span>';
    if (r.st === 'run') return '<span class="nb-st nb-st--run">' + ic('fa-spinner fa-spin') + (r.pct ? lat(r.pct + '%') : esc(L('يُقرأ…', 'Reading…'))) + '</span>';
    if (r.st === 'ok') return '<span class="nb-st nb-st--ok">' + ic('fa-circle-check') + esc(L('تمّ', 'Done')) + '</span>';
    if (r.st === 'bad') return '<span class="nb-st nb-st--bad">' + ic('fa-circle-xmark') + esc(r.err) + '</span>';
    return '<span class="nb-st nb-st--wait">' + esc(L('ينتظر', 'Waiting')) + '</span>';
  }

  /*@3.NOBJ2.1*/
  function courseHtml(r) {
    var lock = busy || finished || r.skip;
    if (r.ed && !lock) {
      return '<span class="nb-cin"><input class="gsf-in nb-cinp" data-f="course" list="nb-cl" dir="ltr" value="' + esc(r.code) + '" ' +
        'placeholder="CS362" aria-label="' + esc(L('رمزُ المادّة', 'Course code')) + '" autocomplete="off" spellcheck="false"></span>';
    }
    if (!r.code) {
      return lock ? '' : '<button type="button" class="nb-chip nb-chip--add" data-a="cedit">' + ic('fa-plus') + esc(L('مادّة', 'Course')) + '</button>';
    }
    var c = A.course ? A.course(r.code) : { label: r.code, tone: '' };
    return '<button type="button" class="nb-chip" data-a="cedit"' + (c.tone ? ' style="--nb-tone:' + esc(c.tone) + '"' : '') + (lock ? ' disabled' : '') +
      ' title="' + esc(r.auto ? L('عرفناها من اسم الملفّ — اضغطْ لتغييرها', 'Guessed from the file name — press to change') : L('اضغطْ لتغييرها', 'Press to change')) + '">' +
      '<i class="nb-dot" aria-hidden="true"></i><span dir="auto">' + esc(c.label) + '</span>' +
      (r.auto ? '<small>' + esc(L('من الاسم', 'from name')) + '</small>' : '') + (lock ? '' : ic('fa-pen')) + '</button>';
  }

  function rowHtml(r, i) {
    var lock = busy || finished;
    return '<li class="nb-row" data-i="' + i + '" data-st="' + r.st + '" data-k="' + esc(r.kind) + '">' +
      '<span class="nb-ic" aria-hidden="true">' + ic(kindIcon(r.kind)) + '</span>' +
      '<div class="nb-main">' +
        (r.skip || lock ? '<span class="nb-name" dir="auto">' + esc(r.skip ? r.file.name : r.title) + '</span>'
          : '<input class="gsf-in nb-in" data-f="title" dir="auto" value="' + esc(r.title) + '" aria-label="' + esc(L('الاسم', 'Name')) + '">') +
        '<div class="nb-meta"><span>' + esc(kindName(r.kind)) + '</span><span>' + lat(fmtSize(r.file.size)) + '</span>' +
          (r.file.gd ? '<span class="nb-gd">' + '<i class="fa-brands fa-google-drive" aria-hidden="true"></i>' + esc(L('من درايف', 'from Drive')) + '</span>' : '') + courseHtml(r) + '</div>' +
      '</div>' +
      '<div class="nb-d">' + (r.skip || lock ? (r.skip ? '' : '<span class="nb-to">' + ic('fa-folder') + esc(destName(r)) + '</span>')
        : '<select class="gsf-in nb-sel" data-f="dest" data-gs-name-ar="إلى مجلّد" data-gs-name-en="To folder" aria-label="' + esc(L('إلى مجلّد', 'To folder')) + '">' + destOptions(r.dest, codesSet()) + '</select>') + '</div>' +
      '<div class="nb-x">' + stHtml(r) +
        (lock ? '' : '<button type="button" class="nb-rm" data-a="rm" aria-label="' + esc(L('أزِلْ من القائمة', 'Remove from list')) + '" data-ar-title="أزِلْ من القائمة" data-en-title="Remove from list">' + ic('fa-xmark') + '</button>') +
      '</div>' +
      (r.st === 'run' || r.st === 'ok' ? '<span class="nb-bar" aria-hidden="true"><i style="inline-size:' + (r.st === 'ok' ? 100 : Math.max(4, r.pct)) + '%"></i></span>' : '') +
      '</li>';
  }
  function destName(r) {
    var d = r.fid != null ? r.fid : r.dest;
    if (!d) return L('بلا مجلّد', 'No folder');
    if (String(d).indexOf('new:') === 0) return String(d).slice(4);
    var fs = A.folders();
    for (var i = 0; i < fs.length; i++) if (fs[i].id === d) return fs[i].path;
    return L('مجلّد', 'Folder');
  }

  function counts() {
    var c = { go: 0, skip: 0, ok: 0, bad: 0, stop: 0, bytes: 0, done: 0 };
    rows.forEach(function (r) {
      if (r.skip) c.skip++; else c.go++;
      if (r.st === 'ok') c.ok++;
      if (r.st === 'bad') c.bad++;
      if (r.st === 'stop') c.stop++;
      c.bytes += r.file.size || 0;
    });
    c.done = c.ok + c.bad + c.stop;
    return c;
  }

  function headHtml(c) {
    var lock = busy || finished;
    return '<div class="nb-hd"><span class="nb-hd-i" aria-hidden="true">' + ic('fa-file-import') + '</span>' +
      '<span class="nb-hd-t"><h2 class="gsf-title" id="nb-t">' + esc(L('استيرادُ ', 'Import ')) + lat(String(rows.length)) + esc(L(rows.length === 1 ? ' ملفّ' : (rows.length <= 10 ? ' ملفّات' : ' ملفّاً'), rows.length === 1 ? ' file' : ' files')) + '</h2>' +
      '<p class="gsf-sub">' + lat(fmtSize(c.bytes)) + ' · ' + esc(keepTo === 'us' ? L('تُحفظ على هذا الجهاز، ونسخةٌ منها عندنا.', 'Kept on this device, with a copy kept by us.')
        : keepTo === 'gd' ? L('تُحفظ على هذا الجهاز، ونسخةٌ منها في درايفك.', 'Kept on this device, with a copy in your Drive.')
        : L('تُحفظ على هذا الجهاز أوّلاً، ثمّ ترفعها حيث تشاء من كلِّ ملاحظة.', 'Kept on this device first; upload each one where you like from its note.')) + '</p></span>' +
      (finished ? '' : '<span class="nb-adds"><button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nb-add" data-a="add">' + ic('fa-plus') + '<span>' + esc(L('من جهازي', 'From device')) + '</span></button>' +
        (A.drivePick ? '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nb-add" data-a="addgd">' + '<i class="fa-brands fa-google-drive" aria-hidden="true"></i>' + '<span>' + esc(L('من درايف', 'From Drive')) + '</span></button>' : '') + '</span>') +
      '</div>' +
      (lock || !c.go ? '' :
        '<label class="nb-all">' + ic('fa-folder-tree') + '<span>' + esc(L('المجلّد للكلّ', 'Folder for all')) + '</span>' +
        '<select class="gsf-in nb-sel" data-f="all" data-gs-name-ar="المجلّد للكلّ" data-gs-name-en="Folder for all"><option value="*">' + esc(L('— كما في كلِّ ملفّ —', '— as set per file —')) + '</option>' +
        destOptions('*', codesSet()) + '</select></label>' +
        '<label class="nb-all">' + ic('fa-cloud-arrow-up') + '<span>' + esc(L('ونسخةٌ احتياطيّة', 'And a backup copy')) + '</span>' +
        '<select class="gsf-in nb-sel" data-f="keep" data-gs-name-ar="ونسخةٌ احتياطيّة" data-gs-name-en="And a backup copy">' +
          '<option value="here"' + (keepTo === 'here' ? ' selected' : '') + '>' + esc(L('لا — على هذا الجهاز وحدَه', 'No — this device only')) + '</option>' +
          (A.canUs && A.canUs() ? '<option value="us"' + (keepTo === 'us' ? ' selected' : '') + '>' + esc(L('ارفعْها كلَّها إلى نسختي عندنا', 'Upload all to my copy with us')) + '</option>' : '') +
          (A.drivePick ? '<option value="gd"' + (keepTo === 'gd' ? ' selected' : '') + '>' + esc(L('ارفعْها كلَّها إلى درايفي', 'Upload all to my Drive')) + '</option>' : '') +
        '</select></label>');
  }

  function render() {
    if (!dlg) return;
    var c = counts();
    dlg.querySelector('.nb-head').innerHTML = headHtml(c);
    dlg.querySelector('.nb-list').innerHTML = rows.map(rowHtml).join('');
    var drop = dlg.querySelector('.nb-drop');
    if (drop) drop.hidden = finished;
    paintFoot();
    A.i18n(dlg);
    if (window.GardenSelect) { try { GardenSelect.enhance(dlg); GardenSelect.sync(dlg); } catch (e) {} }
  }
  function paintFoot() {
    var c = counts(), foot = dlg.querySelector('.nb-foot');
    var msg = finished
      ? L('استُورد ', 'Imported ') + c.ok + (c.bad ? L(' · تعذّر ', ' · failed ') + c.bad : '') + (c.stop ? L(' · أُوقف ', ' · stopped ') + c.stop : '')
      : (busy ? (stopAsk ? L('يُكمل الملفَّ الجاريَ ثمّ يقف…', 'Finishing the current file, then stopping…') : L('يُستورد… ', 'Importing… ') + c.done + ' / ' + c.go)
              : c.go + L(' سيُستورد', ' to import') + (c.skip ? L(' · ', ' · ') + c.skip + L(' مستبعَد', ' skipped') : ''));
    var pct = c.go ? Math.round(c.done * 100 / c.go) : 0;
    foot.innerHTML = '<span class="nb-msg" role="status">' + esc(msg) +
        (busy || finished ? '<span class="nb-tot" aria-hidden="true"><i style="inline-size:' + pct + '%"></i></span>' : '') + '</span>' +
      (finished
        ? '<button type="button" class="gsf-btn gsf-btn--go" data-a="close">' + esc(L('تمّ', 'Done')) + '</button>'
        : busy
          ? '<button type="button" class="gsf-btn gsf-btn--danger" data-a="stop"' + (stopAsk ? ' disabled' : '') + '>' + ic('fa-stop') + ' ' + esc(L('أوقِفْ', 'Stop')) + '</button>'
          : '<button type="button" class="gsf-btn gsf-btn--ghost" data-a="close">' + esc(L('إلغاء', 'Cancel')) + '</button>' +
            '<button type="button" class="gsf-btn gsf-btn--go" data-a="go"' + (!c.go ? ' disabled' : '') + '>' +
              ic('fa-file-import') + ' ' + esc(L('استوردْ ', 'Import ')) + lat(String(c.go)) + '</button>');
  }

  function paintRow(i) {
    var li = dlg && dlg.querySelector('.nb-row[data-i="' + i + '"]');
    if (!li) return;
    var w = document.createElement('ul');
    w.innerHTML = rowHtml(rows[i], i);
    li.parentNode.replaceChild(w.firstChild, li);
    A.i18n(dlg);
    paintFoot();
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

  var made = {}, first = null, dests = {};
  function resolveDest(r) {
    var d = r.dest || '';
    if (d.indexOf('new:') === 0) {
      if (!made[d]) made[d] = A.mkFolder(d.slice(4));
      d = made[d];
    }
    r.fid = d;
    dests[d] = 1;
  }
  /*@3.NOBJ2.2*/
  function next() {
    if (!dlg || !dlg.open) { busy = false; return; }
    var i = -1;
    for (var k = 0; k < rows.length; k++) if (rows[k].st === 'wait') { i = k; break; }
    if (i < 0 || stopAsk) {
      rows.forEach(function (r) { if (r.st === 'wait') r.st = 'stop'; });
      busy = false;
      finished = true;
      var keys = Object.keys(dests);
      A.done(keys.length === 1 && keys[0] ? keys[0] : null);
      render();
      return;
    }
    var r = rows[i];
    resolveDest(r);
    r.st = 'run';
    paintRow(i);
    A.one({
      file: r.file, kind: r.kind, title: r.title, keep: keepTo,
      place: { f: r.fid || null, c: r.code || null },
      onProgress: function (at, of) {
        if (!of) return;
        var p = Math.round(at * 100 / of);
        if (p !== r.pct) { r.pct = p; paintRow(rows.indexOf(r)); }
      }
    }).then(function (ids) {
      r.st = 'ok';
      if (!first && ids && ids[0]) first = ids[0];
    }, function (e) {
      r.st = 'bad';
      r.err = errText(e);
    }).then(function () { paintRow(rows.indexOf(r)); next(); });
  }
  function run() {
    if (busy || finished) return;
    busy = true;
    stopAsk = false;
    made = {}; first = null; dests = {};
    render();
    next();
  }

  function pick() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.multiple = true;
    inp.accept = ACCEPT;
    inp.style.display = 'none';
    inp.addEventListener('change', function () {
      var fs = inp.files ? Array.prototype.slice.call(inp.files) : [];
      inp.remove();
      if (fs.length) add(fs);
    });
    (dlg || document.body).appendChild(inp);
    inp.click();
  }
  function pickDrive() {
    if (!A.drivePick) return;
    A.drivePick().then(function (list) {
      if (!list || !list.length || !dlg) return;
      add(list.map(function (d) { return { name: d.name || 'drive', size: Number(d.size) || 0, type: d.mime || '', gd: d.id }; }));
    }, function (e) { if (A.say) A.say(e); });
  }
  /*@3.NOBJ2.3*/
  function add(files) {
    if (!dlg || finished) return false;
    var list = Array.prototype.slice.call(files || []);
    if (!list.length) return true;
    var seen = {};
    rows.forEach(function (r) { seen[r.file.name + '|' + r.file.size] = 1; });
    list = list.filter(function (f) { return !seen[f.name + '|' + f.size]; });
    rows = rows.concat(plan(list, rows.filter(function (r) { return !r.skip; }).length));
    if (busy) {
      var lst = dlg.querySelector('.nb-list'), w = document.createElement('ul');
      w.innerHTML = rows.slice(rows.length - list.length).map(function (r) { return rowHtml(r, rows.indexOf(r)); }).join('');
      while (w.firstChild) lst.appendChild(w.firstChild);
      dlg.querySelector('.nb-head').innerHTML = headHtml(counts());
      A.i18n(dlg);
      paintFoot();
    } else render();
    return true;
  }

  function commitCourse(inp) {
    var li = inp.closest('.nb-row');
    var r = li && rows[Number(li.getAttribute('data-i'))];
    if (!r || !r.ed) return;
    var v = inp.value.trim(), code = v ? normCode(v) : '';
    r.ed = 0;
    if (v && !code) { r.ed = 1; inp.setCustomValidity(L('لا نعرف مادّةً بهذا الرمز', 'No course with this code')); inp.reportValidity(); return; }
    if (code !== r.code) {
      var wasAuto = r.dest === folderFor(r.code);
      r.code = code; r.auto = 0;
      if (wasAuto) r.dest = folderFor(code);
    }
    render();
  }

  function onClick(e) {
    var b = e.target.closest('[data-a]');
    if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'close') { if (!busy) close(); return; }
    if (a === 'go') { run(); return; }
    if (a === 'stop') { stopAsk = true; paintFoot(); return; }
    if (a === 'add') { pick(); return; }
    if (a === 'addgd') { pickDrive(); return; }
    var li = b.closest('.nb-row'), i = li ? Number(li.getAttribute('data-i')) : -1;
    if (a === 'rm' && !busy && !finished && i >= 0) {
      rows.splice(i, 1);
      if (!rows.length) { close(); return; }
      render();
      return;
    }
    if (a === 'cedit' && !busy && !finished && rows[i]) {
      rows.forEach(function (r) { r.ed = 0; });
      rows[i].ed = 1;
      render();
      var inp = dlg.querySelector('.nb-row[data-i="' + i + '"] .nb-cinp');
      if (inp) { try { inp.focus(); inp.select(); } catch (e2) {} }
    }
  }

  function onChange(e) {
    var t = e.target, f = t.getAttribute && t.getAttribute('data-f');
    if (!f || busy || finished) return;
    if (f === 'course') { commitCourse(t); return; }
    if (f === 'keep') { keepTo = t.value; keepWrite(keepTo); render(); return; }
    if (f === 'all') {
      if (t.value === '*') return;
      rows.forEach(function (r) { if (!r.skip) r.dest = t.value; });
      render();
      return;
    }
    var li = t.closest('.nb-row');
    if (!li) return;
    var r = rows[Number(li.getAttribute('data-i'))];
    if (!r) return;
    if (f === 'title') r.title = t.value.trim() || baseName(r.file.name);
    if (f === 'dest') r.dest = t.value;
  }
  function onKey(e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('nb-cinp')) {
      if (e.key === 'Enter') { e.preventDefault(); commitCourse(t); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); var li = t.closest('.nb-row'); var r = li && rows[Number(li.getAttribute('data-i'))]; if (r) { r.ed = 0; render(); } }
      else t.setCustomValidity('');
    }
  }
  function onBlur(e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('nb-cinp')) setTimeout(function () { if (t.isConnected && document.activeElement !== t) commitCourse(t); }, 120);
  }
  function hasFiles(e) { var dt = e.dataTransfer; return !!(dt && Array.prototype.indexOf.call(dt.types || [], 'Files') > -1); }
  function onDragOver(e) {
    if (!hasFiles(e) || finished) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dlg.setAttribute('data-drop', '1');
  }
  function onDragLeave(e) { if (dlg && (!e.relatedTarget || !dlg.contains(e.relatedTarget))) dlg.removeAttribute('data-drop'); }
  function onDrop() { if (dlg) dlg.removeAttribute('data-drop'); }

  function close() {
    if (!dlg) return;
    try { dlg.close(); } catch (e) {}
    dlg.remove();
    dlg = null;
  }

  function courseList() {
    var h = '', list = A.courses ? A.courses() : [];
    for (var i = 0; i < list.length; i++) h += '<option value="' + esc(list[i].code) + '">' + esc(list[i].name) + '</option>';
    return h;
  }

  function open(files, api) {
    A = api;
    keepTo = keepRead();
    if ((keepTo === 'us' && !(A.canUs && A.canUs())) || (keepTo === 'gd' && !A.drivePick)) keepTo = 'here';
    var list = Array.prototype.slice.call(files || []);
    if (!list.length && api.fromDrive && A.drivePick) {
      return A.drivePick().then(function (got) {
        if (got && got.length) open(got.map(function (d) { return { name: d.name || 'drive', size: Number(d.size) || 0, type: d.mime || '', gd: d.id }; }), api);
      }, function (e) { if (A.say) A.say(e); });
    }
    if (!list.length) return;
    if (dlg && dlg.open && !finished) { add(list); return; }
    close();
    rows = plan(list);
    busy = false;
    finished = false;
    stopAsk = false;
    dlg = document.createElement('dialog');
    dlg.className = 'gsf gsf--flat nb';
    dlg.setAttribute('aria-labelledby', 'nb-t');
    dlg.setAttribute('data-keep-open', '1');
    dlg.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<div class="gsf-body"><div class="gsf-head nb-head"></div>' +
        '<ul class="nb-list" aria-label="' + esc(L('الملفّات', 'Files')) + '"></ul>' +
        '<button type="button" class="nb-drop" data-a="add">' + ic('fa-cloud-arrow-up') + '<span>' + esc(L('اسحبْ ملفّاتٍ أخرى إلى هنا، أو اضغطْ لتختار', 'Drag more files here, or press to choose')) + '</span></button>' +
        '<datalist id="nb-cl">' + courseList() + '</datalist></div>' +
      '<div class="gsf-foot"><div class="gsf-acts nb-foot"></div></div>';
    dlg.addEventListener('click', onClick);
    dlg.addEventListener('change', onChange);
    dlg.addEventListener('keydown', onKey);
    dlg.addEventListener('focusout', onBlur);
    dlg.addEventListener('dragover', onDragOver);
    dlg.addEventListener('dragleave', onDragLeave);
    dlg.addEventListener('drop', onDrop);
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); if (!busy) close(); });
    (document.getElementById('na') || document.body).appendChild(dlg);
    render();
    try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
  }

  window.GardenNotesBulk = {
    open: open,
    add: function (files) { return add(files); },
    isOpen: function () { return !!(dlg && dlg.open && !finished); },
    plan: function (files, api) { A = api; return plan(Array.prototype.slice.call(files || [])); },
    busy: function () { return busy; }
  };
})();
