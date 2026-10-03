(function () {
  'use strict';

  var SORTS = [
    { k: 'upd',  ar: 'الأحدث تعديلاً', en: 'Last modified', d: -1 },
    { k: 'ca',   ar: 'الأحدث إنشاءً',  en: 'Date created',  d: -1 },
    { k: 'name', ar: 'الاسم',          en: 'Name',          d: 1 },
    { k: 'size', ar: 'الحجم',          en: 'Size',          d: -1 },
    { k: 'kind', ar: 'النوع',          en: 'Kind',          d: 1 }
  ];
  var PRESS_MS = 450;

  var A = null, host = null, anchor = null, press = null, ate = 0, lastList = [];
  var TH = {}, thIO = null, thAsked = {};

  function L(a, e) { return A.L(a, e); }
  function esc(s) { return A.esc(s); }

  function sortOf() {
    var s = A.ui('xs') || {};
    var def = null;
    for (var i = 0; i < SORTS.length; i++) if (SORTS[i].k === s.k) def = SORTS[i];
    if (!def) return { k: 'upd', d: -1 };
    return { k: def.k, d: (s.d === 1 || s.d === -1) ? s.d : def.d };
  }
  function vmOf() { return A.ui('xvm') === 'rows' ? 'rows' : 'grid'; }

  function kindOf(n) {
    if (n.src !== 'rich') return n.src;
    return n.kind || 'rich';
  }
  function kindName(k) {
    switch (k) {
      case 'pdf':    return L('ملفّ PDF', 'PDF file');
      case 'board':  return L('لوح رسم', 'Drawing board');
      case 'ink':    return L('ملاحظة مرسومة', 'Ink note');
      case 'quick':  return L('ملاحظة سريعة', 'Quick note');
      case 'module': return L('من درس', 'From a lesson');
      case 'course': return L('من مادّة', 'From a course');
    }
    return L('ملاحظة', 'Note');
  }
  function kindIcon(k) {
    switch (k) {
      case 'pdf':    return 'fa-file-lines';
      case 'board':
      case 'ink':    return 'fa-pen-nib';
      case 'quick':  return 'fa-bolt';
      case 'module': return 'fa-graduation-cap';
      case 'course': return 'fa-folder-open';
    }
    return 'fa-file-lines';
  }

  function fmtSize(b) {
    b = Number(b) || 0;
    if (b <= 0) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return Math.max(1, Math.round(b / 1024)) + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(b < 10485760 ? 1 : 0) + ' MB';
    return (b / 1073741824).toFixed(1) + ' GB';
  }
  function fmtDate(t) {
    if (!t) return '';
    try {
      return new Date(t).toLocaleString(A.isAr() ? 'ar-u-ca-gregory-nu-latn' : 'en-GB',
        { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch (e) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  }
  function fmtDay(t) {
    if (!t) return '';
    try {
      return new Date(t).toLocaleDateString(A.isAr() ? 'ar-u-ca-gregory-nu-latn' : 'en-GB',
        { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return new Date(t).toISOString().slice(0, 10); }
  }
  function lat(s) { return '<span class="nx-lat">' + esc(s) + '</span>'; }

  function sorted(list) {
    var s = sortOf(), out = list.slice();
    var coll = null;
    try { coll = new Intl.Collator(A.isAr() ? 'ar' : 'en', { numeric: true, sensitivity: 'base' }); } catch (e) {}
    function cmpName(a, b) {
      var x = a.title || '', y = b.title || '';
      return coll ? coll.compare(x, y) : (x < y ? -1 : x > y ? 1 : 0);
    }
    out.sort(function (a, b) {
      var r = 0;
      if (s.k === 'name') r = cmpName(a, b);
      else if (s.k === 'size') r = (a.bytes || 0) - (b.bytes || 0);
      else if (s.k === 'ca') r = (a.created_at || 0) - (b.created_at || 0);
      else if (s.k === 'kind') r = kindName(kindOf(a)).localeCompare(kindName(kindOf(b)));
      else {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        r = (a.updated_at || 0) - (b.updated_at || 0);
      }
      if (!r) r = (a.updated_at || 0) - (b.updated_at || 0);
      return r * s.d;
    });
    return out;
  }

  function pickedSet() { return A.picked() || {}; }
  function pickedList() {
    var p = pickedSet(), out = [];
    for (var k in p) if (p[k]) out.push(k);
    return out;
  }

  function crumbHtml() {
    var cs = A.crumbs(), h = '';
    for (var i = 0; i < cs.length; i++) {
      var last = i === cs.length - 1;
      if (i) h += '<i class="nx-sep fa-solid ' + (A.isAr() ? 'fa-chevron-left' : 'fa-chevron-right') + '" aria-hidden="true"></i>';
      if (last) h += '<b dir="auto" aria-current="page">' + esc(cs[i].label) + '</b>';
      else h += '<button type="button" class="nx-crumb-b" data-x="view" data-v="' + esc(JSON.stringify(cs[i].v)) + '" dir="auto">' + esc(cs[i].label) + '</button>';
    }
    return h;
  }

  function sortLabel() {
    var s = sortOf();
    for (var i = 0; i < SORTS.length; i++) if (SORTS[i].k === s.k) return L(SORTS[i].ar, SORTS[i].en);
    return '';
  }

  function barHtml(trash) {
    var s = sortOf(), vm = vmOf();
    var h = '<div class="nx-bar">' +
      /*@3.NOEJ3.1*/
      (A.sections ? '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b nx-side" data-x="side" ' +
        'aria-label="' + esc(L('الأقسام', 'Sections')) + '" data-ar-title="الأقسام" data-en-title="Sections">' +
        '<i class="fa-solid fa-bars" aria-hidden="true"></i><span class="nx-b-t">' + esc(L('الأقسام', 'Sections')) + '</span></button>' : '') +
      '<nav class="nx-crumb" aria-label="' + esc(L('المسار', 'Path')) + '">' + crumbHtml() + '</nav>' +
      '<div class="nx-tools">' +
      '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="sort" aria-haspopup="true" ' +
        'aria-label="' + esc(L('ترتيب: ', 'Sort: ') + sortLabel()) + '" data-ar-title="ترتيب" data-en-title="Sort">' +
        '<i class="fa-solid ' + (s.d < 0 ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-wide-short') + '" aria-hidden="true"></i>' +
        '<span class="nx-b-t">' + esc(sortLabel()) + '</span></button>' +
      '<div class="nx-seg" role="group" aria-label="' + esc(L('طريقة العرض', 'View')) + '">' +
        '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="vm" data-v="grid" aria-pressed="' + (vm === 'grid') + '" ' +
          'aria-label="' + esc(L('شبكة', 'Grid')) + '" data-ar-title="شبكة" data-en-title="Grid">' +
          '<i class="fa-solid fa-table-cells-large" aria-hidden="true"></i></button>' +
        '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="vm" data-v="rows" aria-pressed="' + (vm === 'rows') + '" ' +
          'aria-label="' + esc(L('تفاصيل', 'Details')) + '" data-ar-title="تفاصيل" data-en-title="Details">' +
          '<i class="fa-solid fa-list" aria-hidden="true"></i></button>' +
      '</div>';
    /*@3.NOEJ3.3*/
    var back = A.last ? A.last() : null;
    var backB = back ? '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b nx-back" data-x="back" ' +
      'aria-label="' + esc(L('عُدْ إلى «', 'Back to “') + back.t + L('»', '”')) + '" data-ar-title="' + esc('عُدْ إلى «' + back.t + '»') + '" data-en-title="' + esc('Back to “' + back.t + '”') + '">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' : '';
    if (trash) {
      h += '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--danger nx-b" data-x="empty"' + (lastList.length ? '' : ' disabled') + '>' +
        '<i class="fa-solid fa-trash" aria-hidden="true"></i><span class="nx-b-t">' + esc(L('أفرغ السلّة', 'Empty trash')) + '</span></button>';
    } else {
      if (A.canFolder()) {
        h += '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="nfolder" aria-label="' + esc(L('مجلّد جديد', 'New folder')) + '" ' +
          'data-ar-title="مجلّد جديد" data-en-title="New folder"><i class="fa-solid fa-folder-plus" aria-hidden="true"></i></button>';
      }
      h += '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="import" ' +
        'aria-label="' + esc(L('استورد ملفّات', 'Import files')) + '" data-ar-title="استورد ملفّات" data-en-title="Import files">' +
        '<i class="fa-solid fa-file-import" aria-hidden="true"></i><span class="nx-b-t">' + esc(L('استورد', 'Import')) + '</span></button>';
      h += '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--go nx-b" data-x="nnote">' +
        '<i class="fa-solid fa-plus" aria-hidden="true"></i><span class="nx-b-t">' + esc(L('ملاحظة', 'Note')) + '</span></button>';
    }
    return h + backB + '</div></div>';
  }

  /*@3.NOEJ3.4*/
  function railHtml() {
    if (!A.places) return '';
    var cur = A.placeKey(), h = '<nav class="nx-rail" aria-label="' + esc(L('الأماكن', 'Places')) + '">';
    A.places().forEach(function (p) {
      if (p.head != null) {
        h += '<div class="nx-rail-h">' + (p.head ? '<span>' + esc(p.head) + '</span>' : '') +
          (p.add ? '<button type="button" class="nx-rail-add" data-x="nfolder-root" aria-label="' + esc(L('مجلّد جديد', 'New folder')) + '" ' +
            'data-ar-title="مجلّد جديد" data-en-title="New folder"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>' : '') + '</div>';
        return;
      }
      var on = A.placeKey(p.v) === cur;
      h += '<button type="button" class="nx-place" data-x="view" data-v="' + esc(JSON.stringify(p.v)) + '"' + (on ? ' aria-current="true"' : '') + '>' +
        '<i class="fa-solid ' + esc(p.icon) + '" aria-hidden="true"></i><span class="nx-place-n" dir="auto">' + esc(p.label) + '</span>' +
        (p.n ? '<span class="nx-place-c">' + lat(String(p.n)) + '</span>' : '') + '</button>';
    });
    return h + '</nav>';
  }

  function countTxt(n) {
    if (!n) return L('فارغ', 'Empty');
    return A.isAr() ? (n === 1 ? 'عنصرٌ واحد' : n === 2 ? 'عنصران' : n + (n >= 3 && n <= 10 ? ' عناصر' : ' عنصراً')) : (n + (n === 1 ? ' item' : ' items'));
  }
  function folderTiles(fs) {
    if (!fs.length) return '';
    var h = '<section class="nx-folders" aria-label="' + esc(L('المجلّدات', 'Folders')) + '">';
    for (var i = 0; i < fs.length; i++) {
      var f = fs[i];
      var tgt = f.v ? ' data-x="view" data-v="' + esc(JSON.stringify(f.v)) + '"' : ' data-x="folder" data-id="' + esc(f.id) + '"';
      h += '<button type="button" class="nx-fold nx-card"' + tgt + (f.tone ? ' style="--nx-tone:' + esc(f.tone) + '"' : '') + '>' +
        '<span class="nx-th nx-th--dir" aria-hidden="true"><i class="fa-solid ' + esc(f.icon || 'fa-folder') + '"></i></span>' +
        '<span class="nx-ft"><span class="nx-fold-n nx-nm" dir="auto">' + esc(f.name) + '</span>' +
        '<span class="nx-meta"><span class="nx-fold-c">' + esc(countTxt(f.count)) + '</span></span></span></button>';
    }
    return h + '</section>';
  }

  function itemHtml(n, picked) {
    var k = kindOf(n), sel = n.src === 'rich';
    var on = !!picked[n.uid];
    var tone = n.origin && n.origin.course ? A.tone(n.origin.course) : null;
    var where = n.origin && n.origin.course ? n.origin.course : (n.folder ? A.folderName(n.folder) : '');
    var size = fmtSize(n.bytes);
    var when = A.when(n);
    var trashT = n.deleted ? L('حُذفت ', 'Deleted ') + A.ago(n.deleted) : '';
    var lbl = (n.title || '') + ' · ' + kindName(k) + (when ? ' · ' + when : '');
    var shr = sel && A.shared && A.shared(n.id), th = sel ? TH[n.id] : null;
    return '<div class="nx-it" role="option" tabindex="0" data-uid="' + esc(n.uid) + '" data-k="' + esc(k) + '"' +
        (sel ? '' : ' data-ro="1"') + ' aria-selected="' + on + '" aria-label="' + esc(lbl) + '">' +
      (sel ? '<button type="button" class="nx-ck" data-x="pick" tabindex="-1" aria-label="' + esc(L('حدِّد', 'Select')) + '">' +
        '<i class="fa-solid fa-check" aria-hidden="true"></i></button>' : '') +
      /*@3.NOEJ3.5*/
      '<div class="nx-th" aria-hidden="true"' + (tone ? ' style="--nx-tone:' + esc(tone) + '"' : '') + (sel ? ' data-th="' + esc(n.id) + '"' : '') + '>' +
        (th ? '<img class="nx-th-img" src="' + esc(th) + '" alt="" decoding="async">'
            : '<span class="nx-pg"><span class="nx-pg-t" dir="auto">' + esc((n.title || '').slice(0, 60)) + '</span>' +
              (n.excerpt && k !== 'pdf' ? '<span class="nx-th-x" dir="auto">' + esc(n.excerpt.slice(0, 220)) + '</span>'
                                        : '<i class="fa-solid ' + kindIcon(k) + '"></i>') + '</span>') +
        (k === 'pdf' || k === 'board' || k === 'ink'
          ? '<span class="nx-kb nx-kb--' + esc(k === 'ink' ? 'board' : k) + '">' + esc(k === 'pdf' ? 'PDF' : L('لوح', 'Board')) + '</span>' : '') +
      '</div>' +
      '<div class="nx-nm" dir="auto">' +
        (n.pinned ? '<i class="nx-pin fa-solid fa-thumbtack" aria-hidden="true"></i>' : '') +
        esc(n.title || L('بلا عنوان', 'Untitled')) + '</div>' +
      '<div class="nx-c nx-c-k">' + esc(kindName(k)) + '</div>' +
      '<div class="nx-c nx-c-s">' + (size ? lat(size) : '<span class="nx-dim">—</span>') + '</div>' +
      '<div class="nx-c nx-c-w">' + (where ? '<span dir="auto">' + esc(where) + '</span>' : '<span class="nx-dim">—</span>') + '</div>' +
      '<div class="nx-c nx-c-m">' + esc(trashT || when) + '</div>' +
      '<div class="nx-mt nx-meta"><span class="nx-m-w">' + esc(trashT || when) + '</span>' +
        '<span class="nx-m-s">' + (size ? lat(size) : '') + '</span>' +
        '<i class="nx-m-sh fa-solid fa-share-nodes"' + (shr ? ' data-on="1"' : '') + ' role="img" aria-label="' +
          esc(shr ? L('مشارَكة', 'Shared') : L('غيرُ مشارَكة', 'Not shared')) + '"></i></div>' +
    '</div>';
  }

  function headHtml() {
    var s = sortOf();
    function th(k, ar, en, cls) {
      var on = s.k === k;
      return '<button type="button" class="nx-hd ' + cls + '" data-x="sortk" data-k="' + k + '"' +
        (on ? ' aria-sort="' + (s.d < 0 ? 'descending' : 'ascending') + '"' : '') + '>' +
        esc(L(ar, en)) + (on ? ' <i class="fa-solid ' + (s.d < 0 ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-wide-short') + '" aria-hidden="true"></i>' : '') +
        '</button>';
    }
    return '<div class="nx-head" role="presentation">' +
      '<span class="nx-hd-ck"></span>' +
      th('name', 'الاسم', 'Name', 'nx-hd-n') +
      th('kind', 'النوع', 'Kind', 'nx-hd-k') +
      th('size', 'الحجم', 'Size', 'nx-hd-s') +
      '<span class="nx-hd nx-hd-w">' + esc(L('المكان', 'Where')) + '</span>' +
      th('upd', 'عُدّلت', 'Modified', 'nx-hd-m') +
      '</div>';
  }

  function emptyHtml(trash) {
    if (trash) {
      return '<div class="nx-empty"><i class="fa-solid fa-trash-can" aria-hidden="true"></i>' +
        '<p>' + esc(L('السلّة فارغة.', 'Trash is empty.')) + '</p>' +
        '<p class="nx-hint">' + esc(L('ما تحذفه يبقى هنا ٣٠ يوماً ثمّ يُمحى.', 'What you delete stays here for 30 days, then it is erased.')) + '</p></div>';
    }
    return '<div class="nx-empty"><i class="fa-solid fa-feather" aria-hidden="true"></i>' +
      '<p>' + esc(L('لا شيء هنا بعد.', 'Nothing here yet.')) + '</p>' +
      '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--go nx-b" data-x="nnote"><i class="fa-solid fa-plus" aria-hidden="true"></i>' +
      '<span class="nx-b-t">' + esc(L('ملاحظة جديدة', 'New note')) + '</span></button></div>';
  }

  function summaryHtml(list, fs) {
    var bytes = 0, kinds = {}, i;
    for (i = 0; i < list.length; i++) {
      bytes += list[i].bytes || 0;
      var k = kindName(kindOf(list[i]));
      kinds[k] = (kinds[k] || 0) + 1;
    }
    var h = '<div class="nx-det-ic"><i class="fa-solid fa-folder-open" aria-hidden="true"></i></div>' +
      '<b class="nx-det-t" dir="auto">' + esc(A.crumbs().slice(-1)[0].label) + '</b><dl class="nx-dl">' +
      '<dt>' + esc(L('العناصر', 'Items')) + '</dt><dd>' + lat(String(list.length)) + '</dd>';
    if (fs.length) h += '<dt>' + esc(L('المجلّدات', 'Folders')) + '</dt><dd>' + lat(String(fs.length)) + '</dd>';
    if (bytes) h += '<dt>' + esc(L('الحجم', 'Size')) + '</dt><dd>' + lat(fmtSize(bytes)) + '</dd>';
    for (var name in kinds) h += '<dt>' + esc(name) + '</dt><dd>' + lat(String(kinds[name])) + '</dd>';
    h += '</dl><p class="nx-hint">' + esc(L('حدِّد عنصراً لترى خصائصه. Ctrl أو Shift لتحديد أكثر من واحد.',
                                            'Select an item to see its details. Ctrl or Shift selects more than one.')) + '</p>';
    return h;
  }

  function detailHtml(n) {
    var k = kindOf(n);
    var h = '<div class="nx-det-ic"><i class="fa-solid ' + kindIcon(k) + '" aria-hidden="true"></i></div>' +
      '<b class="nx-det-t" dir="auto">' + esc(n.title || L('بلا عنوان', 'Untitled')) + '</b><dl class="nx-dl">' +
      '<dt>' + esc(L('النوع', 'Kind')) + '</dt><dd>' + esc(kindName(k)) + '</dd>' +
      '<dt data-role="pg" hidden>' + esc(L('الصفحات', 'Pages')) + '</dt><dd data-role="pg" hidden></dd>' +
      '<dt data-role="sz"' + (n.bytes ? '' : ' hidden') + '>' + esc(L('الحجم', 'Size')) + '</dt>' +
        '<dd data-role="sz"' + (n.bytes ? '' : ' hidden') + '>' + lat(fmtSize(n.bytes)) + '</dd>' +
      /*@3.NOEJ3.2*/
      (n.fileBytes ? '<dt>' + esc(L('الملفّ', 'The file')) + '</dt><dd>' + lat(fmtSize(n.fileBytes)) + '</dd>' +
        '<dt>' + esc(L('ما كتبتَه عليه', 'Your marks on it')) + '</dt><dd>' + (n.dataBytes ? lat(fmtSize(n.dataBytes)) : '<span class="nx-dim">—</span>') + '</dd>' : '') +
      /*@3.NOEJ3.8*/
      (n.imgBytes ? '<dt>' + esc(L('الصور', 'Images')) + '</dt><dd>' + lat(fmtSize(n.imgBytes)) + '</dd>' : '') +
      '<dt data-role="au" hidden>' + esc(L('التسجيلات', 'Recordings')) + '</dt><dd data-role="au" hidden></dd>';
    if (n.created_at) h += '<dt>' + esc(L('أُنشئت', 'Created')) + '</dt><dd>' + esc(fmtDate(n.created_at)) + '</dd>';
    if (n.updated_at) h += '<dt>' + esc(L('عُدّلت', 'Modified')) + '</dt><dd>' + esc(fmtDate(n.updated_at)) + '</dd>';
    if (n.deleted) h += '<dt>' + esc(L('حُذفت', 'Deleted')) + '</dt><dd>' + esc(fmtDate(n.deleted)) + '</dd>';
    if (n.origin && n.origin.course) h += '<dt>' + esc(L('المادّة', 'Course')) + '</dt><dd dir="auto">' + esc(A.courseLabel(n.origin.course)) + '</dd>';
    if (n.folder) h += '<dt>' + esc(L('المجلّد', 'Folder')) + '</dt><dd dir="auto">' + esc(A.folderPath(n.folder)) + '</dd>';
    if (n.tags && n.tags.length) h += '<dt>' + esc(L('الوسوم', 'Tags')) + '</dt><dd dir="auto">' + esc(n.tags.map(function (t) { return '#' + t; }).join(' ')) + '</dd>';
    h += '</dl>';
    if (n.excerpt) h += '<p class="nx-det-x" dir="auto">' + esc(n.excerpt.slice(0, 280)) + '</p>';
    return h;
  }

  function fillDetail(n) {
    if (!n || n.src !== 'rich' || !A.doc) return;
    A.doc(n.id).then(function (row) {
      var d = row && row.doc;
      if (!d || !host) return;
      var box = host.querySelector('.nx-det[data-uid="' + n.uid + '"]');
      if (!box) return;
      function put(role, html) {
        var els = box.querySelectorAll('[data-role="' + role + '"]');
        for (var i = 0; i < els.length; i++) els[i].hidden = false;
        if (els[1]) els[1].innerHTML = html;
      }
      if (d.pdf) {
        if (d.pdf.pg) put('pg', lat(String(d.pdf.pg)));
        if (d.pdf.sz && !n.fileBytes) put('sz', lat(fmtSize(d.pdf.sz + (n.dataBytes || 0))));
      } else if (Array.isArray(d.pages) && d.pages.length) {
        put('pg', lat(String(d.pages.length)));
      }
      if (Array.isArray(d.aud) && d.aud.length) put('au', lat(String(d.aud.length)));
    })['catch'](function () {});
  }

  function selbarHtml(trash) {
    var n = pickedList().length;
    var h = '<div class="nx-sel" role="toolbar" aria-label="' + esc(L('أفعال المحدَّد', 'Selection actions')) + '"' + (n ? '' : ' hidden') + '>' +
      '<b class="nx-sel-n">' + esc(L(n === 1 ? 'عنصرٌ واحد' : (n === 2 ? 'عنصران' : n + (n <= 10 ? ' عناصر' : ' عنصراً')), n + (n === 1 ? ' item' : ' items'))) + '</b>';
    function b(x, icon, ar, en, cls) {
      return '<button type="button" class="gsf-btn gsf-btn--sm nx-b ' + (cls || 'gsf-btn--ghost') + '" data-x="' + x + '">' +
        '<i class="fa-solid ' + icon + '" aria-hidden="true"></i><span class="nx-b-t">' + esc(L(ar, en)) + '</span></button>';
    }
    if (trash) {
      h += b('restore', 'fa-rotate-left', 'استعِد', 'Restore');
      h += b('purge', 'fa-trash', 'احذف نهائيّاً', 'Delete forever', 'gsf-btn--danger');
    } else {
      if (n === 1) h += b('open', 'fa-up-right-from-square', 'افتح', 'Open');
      h += b('move', 'fa-folder-open', 'انقل', 'Move');
      h += b('export', 'fa-file-export', 'صدِّر', 'Export');
      h += A.view().k === 'archive'
        ? b('unarch', 'fa-box-archive', 'أعِد من الأرشيف', 'Unarchive')
        : b('arch', 'fa-box-archive', 'أرشِف', 'Archive');
      h += b('trash', 'fa-trash', 'إلى السلّة', 'To trash', 'gsf-btn--danger');
    }
    h += '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b nx-sel-x" data-x="unpick" aria-label="' + esc(L('ألغِ التحديد', 'Clear selection')) + '" ' +
      'data-ar-title="ألغِ التحديد" data-en-title="Clear selection"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
    return h + '</div>';
  }

  /*@3.NOEJ3.14*/
  var FSEL = {}, FANCH = null, FF = 'all', FROWS = [];
  var FILTS = [
    { k: 'all', ar: 'الكلّ', en: 'All', f: function () { return true; } },
    { k: 'here', ar: 'على هذا الجهاز', en: 'On this device', f: function (f) { return f.dev; } },
    { k: 'none', ar: 'بلا نسخةٍ نراها', en: 'No copy we can see', f: function (f) { return !f.dev && !f.us && !f.gd; } },
    { k: 'trash', ar: 'في السلّة', en: 'In trash', f: function (f) { return f.tr; } }
  ];
  function filtOf(k) { for (var i = 0; i < FILTS.length; i++) if (FILTS[i].k === k) return FILTS[i].f; return FILTS[0].f; }
  function fPicked() { return FROWS.filter(function (f) { return FSEL[f.h]; }); }
  function fselHtml() {
    var ps = fPicked(), n = ps.length;
    var canFree = ps.filter(function (f) { return f.dev && f.us; }).length;
    var canErase = ps.filter(function (f) { return f.kind === 'pdf'; }).length;
    function b(x, icon, ar, en, cls, off, tip) {
      return '<button type="button" class="gsf-btn gsf-btn--sm nx-b ' + (cls || 'gsf-btn--ghost') + '" data-x="' + x + '"' + (off ? ' disabled' : '') +
        (tip ? ' title="' + esc(tip) + '"' : '') + '><i class="fa-solid ' + icon + '" aria-hidden="true"></i><span class="nx-b-t">' + esc(L(ar, en)) + '</span></button>';
    }
    return '<div class="nx-sel" role="toolbar" aria-label="' + esc(L('أفعال المحدَّد', 'Selection actions')) + '"' + (n ? '' : ' hidden') + '>' +
      '<b class="nx-sel-n">' + esc(L(n === 1 ? 'ملفٌّ واحد' : (n === 2 ? 'ملفّان' : n + (n <= 10 ? ' ملفّات' : ' ملفّاً')), n + (n === 1 ? ' file' : ' files'))) + '</b>' +
      b('ffree', 'fa-cloud-arrow-down', 'حرِّرْ من هذا الجهاز' + (canFree && canFree < n ? ' (' + canFree + ')' : ''), 'Free from this device' + (canFree && canFree < n ? ' (' + canFree + ')' : ''), '', !canFree,
        canFree ? '' : L('لا شيءَ محدَّدٌ على هذا الجهاز وله نسخةٌ عندنا', 'Nothing selected is on this device with a copy kept by us')) +
      b('ferase', 'fa-trash', 'احذفْ من كلِّ مكان' + (canErase && canErase < n ? ' (' + canErase + ')' : ''), 'Delete everywhere' + (canErase && canErase < n ? ' (' + canErase + ')' : ''), 'gsf-btn--danger', !canErase,
        canErase ? '' : L('التسجيلُ يُحذف من داخل ملاحظته', 'A recording is deleted from inside its note')) +
      '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b nx-sel-x" data-x="funpick" aria-label="' + esc(L('ألغِ التحديد', 'Clear selection')) + '" ' +
        'data-ar-title="ألغِ التحديد" data-en-title="Clear selection"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>';
  }
  function fPaint() {
    if (!host) return;
    var rows = host.querySelectorAll('.nx-frow[data-fk]');
    for (var i = 0; i < rows.length; i++) {
      var on = !!FSEL[rows[i].getAttribute('data-fk')];
      rows[i].setAttribute('aria-selected', String(on));
      var ck = rows[i].querySelector('.nx-ck');
      if (ck) ck.setAttribute('aria-checked', String(on));
    }
    var bar = host.querySelector('.nx-sel');
    if (bar) { bar.outerHTML = fselHtml(); A.i18n(host); }
  }
  function fToggle(h) { if (FSEL[h]) delete FSEL[h]; else FSEL[h] = 1; FANCH = h; fPaint(); }
  function fRange(h) {
    var a = -1, b = -1;
    FROWS.forEach(function (f, i) { if (f.h === FANCH) a = i; if (f.h === h) b = i; });
    if (a < 0 || b < 0) { fToggle(h); return; }
    for (var i = Math.min(a, b); i <= Math.max(a, b); i++) FSEL[FROWS[i].h] = 1;
    fPaint();
  }
  function fAll() { FROWS.forEach(function (f) { FSEL[f.h] = 1; }); fPaint(); }
  function fClear() { FSEL = {}; FANCH = null; fPaint(); }
  function fRow(h) { for (var i = 0; i < FROWS.length; i++) if (FROWS[i].h === h) return FROWS[i]; return null; }
  function fFree(list) {
    var hs = list.filter(function (f) { return f.dev && f.us; }).map(function (f) { return f.h; });
    if (!hs.length || !A.spaceFree) return;
    A.spaceFree(hs).then(function (r) {
      CLEAN.msg = r.n ? L('حُرِّر ', 'Freed ') + fmtSize(r.bytes) + ' · ' + L('عددُها ' + r.n, r.n + ' items') : L('لم يُحذف شيء.', 'Nothing was removed.');
    }, function () { CLEAN.msg = L('تعذّر التحرير — لم يُحذف شيء.', 'Could not free — nothing was removed.'); })
      .then(function () { FSEL = {}; SPACE = null; render(); });
  }
  function fErase(list) {
    var ids = [], seen = {};
    list.forEach(function (f) { if (f.kind === 'pdf' && !seen[f.note]) { seen[f.note] = 1; ids.push(f.note); } });
    if (ids.length && A.spaceErase) A.spaceErase(ids, list.length === 1 ? list[0].name : '');
  }
  function fileMenu(x, y, h) {
    if (!FSEL[h]) { FSEL = {}; FSEL[h] = 1; FANCH = h; fPaint(); }
    var ps = fPicked(), n = ps.length, pl = n > 1 ? ' (' + n + ')' : '';
    var canFree = ps.filter(function (f) { return f.dev && f.us; }).length;
    var canErase = ps.filter(function (f) { return f.kind === 'pdf'; }).length;
    var html = '';
    if (n === 1) html += A.menuItem('fopen', 'fa-up-right-from-square', L('افتحْ ملاحظتَه', 'Open its note'));
    html += A.menuItem('ffree', 'fa-cloud-arrow-down', L('حرِّرْ من هذا الجهاز', 'Free from this device') + (canFree > 1 ? ' (' + canFree + ')' : ''), 0, !canFree);
    html += A.menuItem('ferase', 'fa-trash', L('احذفْ من كلِّ مكان…', 'Delete everywhere…') + (canErase > 1 ? ' (' + canErase + ')' : ''), 1, !canErase);
    if (n > 1) html += A.menuItem('funpick', 'fa-xmark', L('ألغِ التحديد', 'Clear selection') + pl);
    A.menu(x, y, html, function (act) {
      if (act === 'fopen' && ps[0] && A.openId) A.openId(ps[0].note);
      else if (act === 'ffree') fFree(ps);
      else if (act === 'ferase') fErase(ps);
      else if (act === 'funpick') fClear();
    });
  }

  /*@3.NOEJ3.9*/
  var SPACE = null, SPACE_AT = 0, SPACE_ASK = 0;
  /*@3.NOEJ3.10*/
  var CLEAN = { msg: '' };
  function cleanHtml(s) {
    var pg = s.pages || { n: 0, bytes: 0 }, o = s.orph, h = '';
    var row = function (k, icon, ar, en, sub, bytes, can, btnAr, btnEn) {
      return '<div class="nx-cl-row" data-k="' + k + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
        '<span class="nx-cl-t"><b>' + esc(L(ar, en)) + '</b><small>' + esc(sub) + '</small></span>' +
        '<span class="nx-fr-s">' + lat(fmtSize(bytes) || '0 B') + '</span>' +
        (can ? '<button type="button" class="gsf-btn gsf-btn--sm" data-x="clean" data-k="' + k + '" data-ar="' + esc(btnAr) + '" data-en="' + esc(btnEn) + '">' + esc(L(btnAr, btnEn)) + '</button>' : '') +
        '</div>';
    };
    /*@3.NOEJ3.12*/
    var fr = s.free || { n: 0, bytes: 0 };
    if (fr.n) h += row('free', 'fa-cloud-arrow-down', 'ملفّاتٌ لها نسخةٌ عندنا', 'Files that have a copy with us',
      L('عددُها ' + fr.n + ' · تُحذف من هذا الجهاز وحدَه، وتعود من نسختك عندنا حين تفتحها', fr.n + ' items · removed from this device only, and fetched back from your copy with us when you open them'),
      fr.bytes, true, 'حرِّرْها من الجهاز', 'Free them');
    if (pg.n) h += row('pages', 'fa-globe', 'صفحاتُ الموقع المحفوظة', 'Saved site pages',
      L('عددُها ' + pg.n + ' · حُفظت لتفتحها بلا اتّصال، وتُجلب من جديد حين تزورها', pg.n + ' items kept for offline use · fetched again when you visit'),
      pg.bytes, true, 'فرِّغْها', 'Clear them');
    if (o.n) {
      var wait = o.n - o.safe;
      var sub = L('ملفّاتٌ وحبرٌ لا يتبع أيَّ ملاحظة: مُحيت ملاحظاتُها أو لم يكتمل استيرادُها', 'Files and ink that belong to no note: their notes were erased or never finished importing');
      if (wait) sub += ' · ' + L(wait + ' كُتب في آخر عشر دقائق فينتظر (‏قد يكون استيراداً جارياً)', wait + ' written in the last ten minutes, so it waits (it may be an import in progress)');
      h += row('orph', 'fa-broom', 'بقايا ملاحظاتٍ محذوفة', 'Leftovers of deleted notes', sub,
        o.safe ? o.safeB : o.bytes, o.safe > 0, 'احذفْها من الجهاز', 'Remove from device');
    }
    if (!h) h = '<p class="nx-hint">' + esc(L('لا شيءَ يُنظَّف — الجهازُ نظيف.', 'Nothing to clean — this device is tidy.')) + '</p>';
    return '<section class="nx-sp-card nx-clean"><div class="nx-sp-h"><b>' + esc(L('تنظيفٌ آمن', 'Safe cleanup')) + '</b>' +
      '<span>' + esc(L('لا يمسّ ملاحظةً ولا ملفّاً تحتاجه', 'Never touches a note or a file you need')) + '</span></div>' + h +
      '<p class="nx-hint" role="status" data-role="clean-msg">' + esc(CLEAN.msg) + '</p></section>';
  }
  function cleanGo(b) {
    var k = b.getAttribute('data-k'), now = Date.now();
    if (!(+b.getAttribute('data-armed') > now - 5000)) {
      b.setAttribute('data-armed', String(now));
      b.textContent = L('اضغطْ ثانيةً للتأكيد', 'Press again to confirm');
      setTimeout(function () {
        if (!b.isConnected || +b.getAttribute('data-armed') !== now) return;
        b.removeAttribute('data-armed');
        b.textContent = L(b.getAttribute('data-ar'), b.getAttribute('data-en'));
      }, 5000);
      return;
    }
    b.disabled = true;
    b.removeAttribute('data-armed');
    A.spaceClean(k).then(function (r) {
      CLEAN.msg = r.n ? L('حُرِّر ', 'Freed ') + fmtSize(r.bytes) + ' · ' + L('عددُها ' + r.n, r.n + ' items') : L('لم يُحذف شيء.', 'Nothing was removed.');
    }, function () { CLEAN.msg = L('تعذّر التنظيف — لم يُحذف شيء.', 'Cleanup failed — nothing was removed.'); })
      .then(function () { SPACE = null; render(); });
  }
  function spaceHtml(s) {
    if (!s) return '<div class="nx-space"><p class="nx-hint">' + esc(L('أجرد ما على هذا الجهاز…', 'Counting what is on this device…')) + '</p></div>';
    var h = '<div class="nx-space"><section class="nx-sp-card"><div class="nx-sp-h"><b>' + esc(L('مساحةُ هذا الجهاز', 'This device')) + '</b>' +
      '<span>' + lat(fmtSize(s.used) || '0 B') + (s.quota ? ' ' + esc(L('من', 'of')) + ' ' + lat(fmtSize(s.quota)) : '') + '</span></div>';
    var tot = s.cats.reduce(function (a, c) { return a + c.bytes; }, 0) || 1;
    h += '<div class="nx-meter" role="img" aria-label="' + esc(s.cats.map(function (c) { return c.label + ' ' + fmtSize(c.bytes); }).join(' · ')) + '">';
    s.cats.forEach(function (c) { h += '<i data-k="' + esc(c.k) + '" style="inline-size:' + Math.max(1, Math.round(c.bytes / tot * 1000) / 10) + '%"></i>'; });
    h += '</div><div class="nx-legend">';
    s.cats.forEach(function (c) { h += '<span><i data-k="' + esc(c.k) + '"></i>' + esc(c.label) + ' ' + lat(fmtSize(c.bytes)) + '</span>'; });
    h += '</div>';
    h += '</section>' + cleanHtml(s) + '<section class="nx-sp-card"><div class="nx-sp-h"><b>' + esc(L('ملفّاتي في كلِّ مكان', 'My files everywhere')) + '</b><span>' + esc(L('الأكبرُ أوّلاً', 'Largest first')) + '</span></div>';
    if (!s.files.length) h += '<p class="nx-hint">' + esc(L('لا ملفّاتِ PDF ولا تسجيلات بعد.', 'No PDFs or recordings yet.')) + '</p>';
    /*@3.NOEJ3.13*/
    var cnt = {};
    FILTS.forEach(function (fl) { cnt[fl.k] = s.files.filter(fl.f).length; });
    if (!cnt[FF] && FF !== 'all') FF = 'all';
    var shown = s.files.filter(filtOf(FF));
    FROWS = shown;
    var keepF = {};
    shown.forEach(function (f) { if (FSEL[f.h]) keepF[f.h] = 1; });
    FSEL = keepF;
    if (s.files.length) {
      h += '<div class="nx-sp-f" role="group" aria-label="' + esc(L('تصفية الملفّات', 'Filter files')) + '">';
      FILTS.forEach(function (fl) {
        if (fl.k !== 'all' && !cnt[fl.k]) return;
        h += '<button type="button" class="nx-fchip" data-x="ffilt" data-k="' + fl.k + '" aria-pressed="' + (FF === fl.k) + '">' +
          esc(L(fl.ar, fl.en)) + ' ' + lat(String(cnt[fl.k])) + '</button>';
      });
      h += '<button type="button" class="nx-fchip nx-fchip--all" data-x="fall">' + esc(L('حدِّدِ الكلّ', 'Select all')) + '</button></div>';
      h += '<div class="nx-frows" role="listbox" aria-multiselectable="true" aria-label="' + esc(L('ملفّاتي', 'My files')) + '">';
    }
    shown.forEach(function (f) {
      var chip = function (on, ar, en) { return '<span class="nx-chip"' + (on ? ' data-on="1"' : '') + '>' + esc(L(ar, en)) + '</span>'; };
      var none = !f.dev && !f.us && !f.gd;
      var on = !!FSEL[f.h];
      h += '<div class="nx-frow" role="option" tabindex="0" aria-selected="' + on + '" data-x="frow" data-fk="' + esc(f.h) + '" data-id="' + esc(f.note) + '">' +
        '<span class="nx-ck" data-x="fpick" role="checkbox" aria-checked="' + on + '" aria-label="' + esc(L('حدِّد', 'Select')) + '"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
        '<i class="fa-solid ' + (f.kind === 'pdf' ? 'fa-file-lines' : 'fa-microphone') + '" aria-hidden="true"></i>' +
        '<span class="nx-fr-n"><b dir="auto">' + esc(f.name) + '</b><small dir="auto">' + esc(f.nt) + '</small></span>' +
        '<span class="nx-fr-s">' + lat(fmtSize(f.bytes)) + '</span>' +
        '<span class="nx-chips">' + chip(f.dev, 'الجهاز', 'Device') + chip(f.us, 'عندنا', 'Our copy') + chip(f.gd, 'درايف', 'Drive') +
          (f.other ? '<span class="nx-chip" data-on="1" data-k="other" dir="auto">' + esc(f.other) + '</span>'
            : (none ? '<span class="nx-chip" data-k="none">' + esc(L('لا نسخةَ نراها', 'No copy we can see')) + '</span>' : '')) +
        '</span></div>';
    });
    if (s.files.length) h += '</div>';
    return h + '</section></div>' + fselHtml();
  }

  function render() {
    if (!host || !host.isConnected || !A) return;
    if (A.view().k === 'space') {
      host.setAttribute('data-trash', '0');
      host.innerHTML = barHtml(false).replace(/<div class="nx-tools">[\s\S]*$/, '</div>') +
        '<div class="nx-main">' + railHtml() + '<div class="nx-scroll">' + spaceHtml(SPACE) + '</div></div>';
      A.i18n(host);
      /*@3.NOEJ3.15*/
      if (SPACE && Date.now() - SPACE_AT > 15000) SPACE = null;
      if (!SPACE && !SPACE_ASK && A.spaceInfo) {
        SPACE_ASK = 1;
        A.spaceInfo().then(function (s) { SPACE_ASK = 0; SPACE = s; SPACE_AT = Date.now(); if (A.view().k === 'space') render(); },
                           function () { SPACE_ASK = 0; });
      }
      return;
    }
    var trash = A.view().k === 'trash';
    var fs = trash ? [] : A.folders();
    var list = sorted(A.items());
    lastList = list;
    var picked = pickedSet();
    var keep = {};
    for (var i = 0; i < list.length; i++) if (picked[list[i].uid]) keep[list[i].uid] = 1;
    if (Object.keys(keep).length !== pickedList().length) A.setPicked(keep);
    var scroll = host.querySelector('.nx-scroll');
    var top = scroll ? scroll.scrollTop : 0;
    var ae = document.activeElement, fu = null, fx = null;
    if (ae && host.contains(ae)) {
      var fi = ae.closest('.nx-it');
      if (fi) fu = fi.getAttribute('data-uid');
      else fx = ae.getAttribute('data-x');
    }
    var vm = vmOf();
    var one = null, ks = Object.keys(keep);
    if (ks.length === 1) for (i = 0; i < list.length; i++) if (list[i].uid === ks[0]) one = list[i];

    host.setAttribute('data-vm', vm);
    host.setAttribute('data-trash', trash ? '1' : '0');
    host.innerHTML = barHtml(trash) +
      '<div class="nx-main">' + railHtml() + '<div class="nx-scroll">' +
        (fs.length && list.length ? '<div class="nx-lbl">' + esc(L('المجلّدات', 'Folders')) + '</div>' : '') +
        folderTiles(fs) +
        (fs.length && list.length ? '<div class="nx-lbl">' + esc(L('الملفّات', 'Files')) + '</div>' : '') +
        (list.length
          ? (vm === 'rows' ? headHtml() : '') +
            '<div class="nx-items" role="listbox" aria-multiselectable="true" aria-label="' + esc(L('العناصر', 'Items')) + '">' +
            list.map(function (n) { return itemHtml(n, keep); }).join('') + '</div>'
          : (fs.length ? '' : emptyHtml(trash))) +
      '</div>' +
      '<aside class="nx-det"' + (one ? ' data-uid="' + esc(one.uid) + '"' : '') + ' aria-label="' + esc(L('الخصائص', 'Details')) + '">' +
        (one ? detailHtml(one) : summaryHtml(list, fs)) + '</aside></div>' +
      selbarHtml(trash);
    A.i18n(host);
    scroll = host.querySelector('.nx-scroll');
    if (scroll && top) scroll.scrollTop = top;
    var back = fu ? host.querySelector('.nx-it[data-uid="' + fu + '"]')
             : (fx ? host.querySelector('.nx-tools [data-x="' + fx + '"]') : null);
    if (!back && (fu || fx)) back = host.querySelector('.nx-it') || host.querySelector('.nx-b');
    if (back) { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
    if (one) fillDetail(one);
    watchThumbs();
  }

  /*@3.NOEJ3.6*/
  function putThumb(id, u) {
    if (!u || !host) return;
    TH[id] = u;
    var box = host.querySelector('.nx-th[data-th="' + id + '"]');
    if (!box || box.querySelector('.nx-th-img')) return;
    var img = document.createElement('img');
    img.className = 'nx-th-img'; img.alt = ''; img.decoding = 'async'; img.src = u;
    var pg = box.querySelector('.nx-pg');
    if (pg) pg.remove();
    box.insertBefore(img, box.firstChild);
  }
  function askThumb(id) {
    if (thAsked[id] || !A.thumb) return;
    thAsked[id] = 1;
    A.thumb(id).then(function (u) {
      if (u) { putThumb(id, u); return; }
      var n = itemOf('rich:' + id);
      if (n && n.kind === 'pdf' && A.thumbMake) A.thumbMake(n).then(function (u2) { if (u2) putThumb(id, u2); });
    });
  }
  function watchThumbs() {
    if (!host || !A.thumb) return;
    var boxes = host.querySelectorAll('.nx-th[data-th]');
    if (!('IntersectionObserver' in window)) { for (var i = 0; i < boxes.length; i++) askThumb(boxes[i].getAttribute('data-th')); return; }
    if (thIO) thIO.disconnect();
    thIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { thIO.unobserve(en.target); askThumb(en.target.getAttribute('data-th')); } });
    }, { root: host.querySelector('.nx-scroll'), rootMargin: '200px 0px' });
    for (var j = 0; j < boxes.length; j++) if (!TH[boxes[j].getAttribute('data-th')]) thIO.observe(boxes[j]);
  }

  function paint() {
    if (!host || !host.isConnected) return;
    render();
  }

  function itemOf(uid) {
    for (var i = 0; i < lastList.length; i++) if (lastList[i].uid === uid) return lastList[i];
    return null;
  }
  function indexOf(uid) {
    for (var i = 0; i < lastList.length; i++) if (lastList[i].uid === uid) return i;
    return -1;
  }

  function toggle(uid) {
    var p = Object.assign({}, pickedSet());
    if (p[uid]) delete p[uid]; else p[uid] = 1;
    A.setPicked(p);
    anchor = uid;
    paint();
  }
  function range(uid) {
    var a = indexOf(anchor), b = indexOf(uid);
    if (a < 0) { toggle(uid); return; }
    var p = Object.assign({}, pickedSet());
    var lo = Math.min(a, b), hi = Math.max(a, b);
    for (var i = lo; i <= hi; i++) if (lastList[i].src === 'rich') p[lastList[i].uid] = 1;
    A.setPicked(p);
    paint();
  }
  function selectAll() {
    var p = {};
    for (var i = 0; i < lastList.length; i++) if (lastList[i].src === 'rich') p[lastList[i].uid] = 1;
    A.setPicked(p);
    paint();
  }
  function clear() { A.setPicked({}); anchor = null; paint(); }

  function openItem(n) {
    if (!n) return;
    A.open(n);
  }

  function sortMenu(btn) {
    var r = btn.getBoundingClientRect(), s = sortOf(), h = '';
    for (var i = 0; i < SORTS.length; i++) {
      h += A.menuItem('s:' + SORTS[i].k, s.k === SORTS[i].k ? 'fa-check' : 'fa-sort', L(SORTS[i].ar, SORTS[i].en));
    }
    h += A.menuItem('s:flip', s.d < 0 ? 'fa-arrow-up-wide-short' : 'fa-arrow-down-wide-short',
      s.d < 0 ? L('اقلبِ الترتيب: تصاعديّ', 'Reverse: ascending') : L('اقلبِ الترتيب: تنازليّ', 'Reverse: descending'));
    A.menu(A.isAr() ? r.right : r.left, r.bottom + 4, h, function (act) {
      if (act === 's:flip') A.uiSet('xs', { k: s.k, d: -s.d });
      else {
        var k = act.slice(2), def = null;
        for (var j = 0; j < SORTS.length; j++) if (SORTS[j].k === k) def = SORTS[j];
        if (def) A.uiSet('xs', { k: k, d: def.d });
      }
      paint();
    });
  }

  function trashMenu(x, y, uid) {
    if (!pickedSet()[uid]) { A.setPicked({}); var p = {}; p[uid] = 1; A.setPicked(p); paint(); }
    var n = pickedList().length, pl = n > 1 ? ' (' + n + ')' : '';
    A.menu(x, y,
      A.menuItem('restore', 'fa-rotate-left', L('استعِد', 'Restore') + pl) +
      A.menuItem('purge', 'fa-trash', L('احذف نهائيّاً', 'Delete forever') + pl, 1),
      function (act) { act === 'restore' ? A.restore(pickedList()) : A.purge(pickedList()); });
  }

  function onClick(e) {
    if (ate) { ate = 0; e.preventDefault(); return; }
    var x = e.target.closest('[data-x]');
    var it = e.target.closest('.nx-it');
    var act = x && host.contains(x) ? x.getAttribute('data-x') : '';
    var ids = pickedList();
    switch (act) {
      case 'view':
        try { A.setView(JSON.parse(x.getAttribute('data-v'))); } catch (e1) {}
        return;
      case 'folder': A.openFolder(x.getAttribute('data-id')); return;
      case 'sort': sortMenu(x); return;
      case 'sortk':
        var k = x.getAttribute('data-k'), s = sortOf();
        if (s.k === k) A.uiSet('xs', { k: k, d: -s.d });
        else { for (var j = 0; j < SORTS.length; j++) if (SORTS[j].k === k) A.uiSet('xs', { k: k, d: SORTS[j].d }); }
        paint();
        return;
      case 'vm': A.uiSet('xvm', x.getAttribute('data-v')); paint(); return;
      case 'side': if (A.sections) A.sections(); return;
      case 'nnote': A.newNote(); return;
      case 'nfolder': A.newFolder(); return;
      case 'nfolder-root': if (A.view().k !== 'home') A.setView({ k: 'home' }); A.newFolder(); return;
      case 'back': if (A.back) A.back(); return;
      case 'opennote': if (A.openId) A.openId(x.getAttribute('data-id')); return;
      case 'fpick': var fk0 = x.closest('[data-fk]'); if (fk0) fToggle(fk0.getAttribute('data-fk')); return;
      case 'frow':
        var fk = x.getAttribute('data-fk');
        if (e.shiftKey && FANCH) { e.preventDefault(); fRange(fk); return; }
        if (e.ctrlKey || e.metaKey || Object.keys(FSEL).length) { e.preventDefault(); fToggle(fk); return; }
        FANCH = fk;
        if (A.openId) A.openId(x.getAttribute('data-id'));
        return;
      case 'ffilt': FF = x.getAttribute('data-k') || 'all'; FSEL = {}; render(); return;
      case 'fall': fAll(); return;
      case 'funpick': fClear(); return;
      case 'ffree': fFree(fPicked()); return;
      case 'ferase': fErase(fPicked()); return;
      case 'clean': if (A.spaceClean) cleanGo(x); return;
      case 'import': pickFiles(); return;
      case 'empty': A.emptyTrash(); return;
      case 'unpick': clear(); return;
      case 'open': openItem(itemOf(ids[0])); return;
      case 'move': A.move(ids); return;
      case 'export': A.exportIds(ids); return;
      case 'arch': A.archive(ids, true); return;
      case 'unarch': A.archive(ids, false); return;
      case 'trash': A.trash(ids); return;
      case 'restore': A.restore(ids); return;
      case 'purge': A.purge(ids); return;
      case 'pick':
        if (it) toggle(it.getAttribute('data-uid'));
        return;
    }
    if (!it) return;
    var uid = it.getAttribute('data-uid'), n = itemOf(uid);
    if (!n) return;
    var ro = n.src !== 'rich';
    if (!ro && e.shiftKey && anchor) { e.preventDefault(); range(uid); return; }
    if (!ro && (e.ctrlKey || e.metaKey || ids.length)) { e.preventDefault(); toggle(uid); return; }
    if (A.view().k === 'trash') { toggle(uid); return; }
    anchor = uid;
    openItem(n);
  }

  function onKey(e) {
    var it = e.target.closest && e.target.closest('.nx-it');
    var ids = pickedList();
    if (A.view().k === 'space') {
      var fr = e.target.closest && e.target.closest('.nx-frow[data-fk]');
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); fAll(); return; }
      if (e.key === 'Escape' && Object.keys(FSEL).length) { e.preventDefault(); e.stopPropagation(); fClear(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && Object.keys(FSEL).length) { e.preventDefault(); fErase(fPicked()); return; }
      if (fr && e.key === 'Enter') { e.preventDefault(); if (A.openId) A.openId(fr.getAttribute('data-id')); return; }
      if (fr && e.key === ' ') { e.preventDefault(); fToggle(fr.getAttribute('data-fk')); return; }
      if (fr && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        var nx = e.key === 'ArrowDown' ? fr.nextElementSibling : fr.previousElementSibling;
        if (nx && nx.matches('.nx-frow')) { e.preventDefault(); nx.focus(); }
        return;
      }
      if (e.key !== 'Escape') return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault(); selectAll(); return;
    }
    if (e.key === 'Escape' && ids.length) { e.preventDefault(); e.stopPropagation(); clear(); return; }
    /*@3.NOEJ3.11*/
    if (e.key === 'Escape' && !e.defaultPrevented && A.back && A.last && A.last() &&
        !(window.GardenMenu && GardenMenu.isOpen && GardenMenu.isOpen())) { e.preventDefault(); A.back(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length) {
      e.preventDefault();
      if (A.view().k === 'trash') A.purge(ids); else A.trash(ids);
      return;
    }
    if (!it) return;
    var uid = it.getAttribute('data-uid');
    if (e.key === 'Enter') { e.preventDefault(); openItem(itemOf(uid)); return; }
    if (e.key === ' ') { e.preventDefault(); if (itemOf(uid) && itemOf(uid).src === 'rich') toggle(uid); return; }
    var dirs = { ArrowDown: 1, ArrowUp: -1, ArrowLeft: A.isAr() ? 1 : -1, ArrowRight: A.isAr() ? -1 : 1 };
    if (dirs[e.key]) {
      var all = host.querySelectorAll('.nx-it');
      var cols = 1;
      if (vmOf() === 'grid' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        var box = host.querySelector('.nx-items');
        try { cols = getComputedStyle(box).gridTemplateColumns.trim().split(/\s+/).length || 1; } catch (e2) {}
      }
      var i = Array.prototype.indexOf.call(all, it) + dirs[e.key] * cols;
      if (all[i]) { e.preventDefault(); all[i].focus(); }
    }
  }

  function onDocKey(e) {
    if (!host || !host.isConnected || e.defaultPrevented) return;
    var t = e.target;
    if (t && host.contains(t)) return;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
    if (t && t.closest && t.closest('dialog[open], .na-ctx')) return;
    if (document.querySelector('dialog[open]')) return;
    if (t && t !== document.body && t !== document.documentElement) return;
    onKey(e);
  }

  function pickFiles() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.multiple = true;
    inp.accept = '.pdf,application/pdf,audio/*,video/*,.m4a,.mp3,.wav,.aac,.ogg,.opus,.webm,.flac,.md,.markdown,.txt,.json';
    inp.style.display = 'none';
    inp.addEventListener('change', function () {
      var fs = inp.files ? Array.prototype.slice.call(inp.files) : [];
      inp.remove();
      if (fs.length) A.bulk(fs);
    });
    document.body.appendChild(inp);
    inp.click();
  }

  /*@3.NOEJ3.7*/
  function spaceMenu(x, y) {
    var trash = A.view().k === 'trash', h = '';
    if (trash) {
      h += A.menuItem('empty', 'fa-trash', L('أفرغِ السلّة', 'Empty trash'), 1, !lastList.length);
    } else {
      if (A.canFolder()) h += A.menuItem('nfolder', 'fa-folder-plus', L('مجلّدٌ جديد', 'New folder'));
      h += A.menuItem('nnote', 'fa-plus', L('ملاحظةٌ جديدة', 'New note'));
      h += A.menuItem('import', 'fa-file-import', L('استوردْ ملفّات', 'Import files'));
      if (A.canPaste && A.canPaste()) h += A.menuItem('paste', 'fa-paste', L('ألصِقْ هنا', 'Paste here'));
    }
    h += A.menuItem('sort', 'fa-arrow-down-wide-short', L('رتِّبْ حسب…', 'Sort by…'));
    h += A.menuItem('vm', vmOf() === 'grid' ? 'fa-list' : 'fa-table-cells-large', vmOf() === 'grid' ? L('اعرضْ تفاصيل', 'Show details') : L('اعرضْ شبكة', 'Show grid'));
    A.menu(x, y, h, function (act) {
      if (act === 'nfolder') A.newFolder();
      else if (act === 'nnote') A.newNote();
      else if (act === 'import') pickFiles();
      else if (act === 'paste') A.paste();
      else if (act === 'empty') A.emptyTrash();
      else if (act === 'vm') { A.uiSet('xvm', vmOf() === 'grid' ? 'rows' : 'grid'); paint(); }
      else if (act === 'sort') { var sb = host.querySelector('.nx-tools [data-x="sort"]'); if (sb) sortMenu(sb); }
    });
  }

  function onCtx(e) {
    var frc = e.target.closest('.nx-frow[data-fk]');
    if (frc) { e.preventDefault(); fileMenu(e.clientX, e.clientY, frc.getAttribute('data-fk')); return; }
    var it = e.target.closest('.nx-it');
    var fo = !it && e.target.closest('.nx-fold[data-id]');
    if (fo && A.folderCtx) { e.preventDefault(); A.folderCtx(e.clientX, e.clientY, fo.getAttribute('data-id')); return; }
    if (!it && e.target.closest('.nx-scroll') && !e.target.closest('.nx-fold, button, a')) {
      e.preventDefault();
      spaceMenu(e.clientX, e.clientY);
      return;
    }
    if (!it || it.getAttribute('data-ro')) return;
    e.preventDefault();
    var uid = it.getAttribute('data-uid');
    if (A.view().k === 'trash') trashMenu(e.clientX, e.clientY, uid);
    else A.ctx(e.clientX, e.clientY, uid);
  }

  var D = null, DRAG_PX = 6;

  function dropAt(x, y) {
    var el = document.elementFromPoint(x, y);
    var t = el && el.closest && el.closest('.nx-fold, .nx-crumb-b');
    if (!t || !host.contains(t)) return null;
    if (t.classList.contains('nx-fold')) return { el: t, fid: t.getAttribute('data-id') };
    var v = null;
    try { v = JSON.parse(t.getAttribute('data-v')); } catch (e) {}
    if (v && v.k === 'folder') return { el: t, fid: v.id };
    if (v && v.k === 'recent') return { el: t, fid: null };
    return null;
  }
  function dragEnd(commit) {
    if (!D) return;
    var d = D; D = null;
    try { d.it.releasePointerCapture(d.pid); } catch (e) {}
    if (d.ghost) d.ghost.remove();
    host.removeAttribute('data-drag');
    var old = host.querySelectorAll('.nx-drop');
    for (var i = 0; i < old.length; i++) old[i].classList.remove('nx-drop');
    if (!d.on) return;
    ate = 1;
    setTimeout(function () { ate = 0; }, 0);
    if (commit && d.to) A.moveTo(d.uids, d.to.fid);
  }

  function onDown(e) {
    if (e.pointerType !== 'touch') {
      if (e.button !== 0 || A.view().k === 'trash') return;
      var di = e.target.closest('.nx-it');
      if (!di || di.getAttribute('data-ro') || e.target.closest('[data-x]')) return;
      var du = di.getAttribute('data-uid');
      D = { uid: du, it: di, x: e.clientX, y: e.clientY, pid: e.pointerId, on: false, to: null };
      return;
    }
    var frp = e.target.closest('.nx-frow[data-fk]');
    if (frp) {
      press = { x: e.clientX, y: e.clientY, t: setTimeout(function () {
        press = null; ate = 1;
        fToggle(frp.getAttribute('data-fk'));
        try { navigator.vibrate && navigator.vibrate(12); } catch (e4) {}
      }, PRESS_MS) };
      return;
    }
    var it = e.target.closest('.nx-it');
    if (!it || it.getAttribute('data-ro')) return;
    var x0 = e.clientX, y0 = e.clientY;
    press = { x: x0, y: y0, t: setTimeout(function () {
      press = null;
      ate = 1;
      toggle(it.getAttribute('data-uid'));
      try { navigator.vibrate && navigator.vibrate(12); } catch (e3) {}
    }, PRESS_MS) };
  }
  function onMove(e) {
    if (D && e.pointerId === D.pid) {
      if (!D.on) {
        if (Math.abs(e.clientX - D.x) < DRAG_PX && Math.abs(e.clientY - D.y) < DRAG_PX) return;
        D.on = true;
        try { D.it.setPointerCapture(D.pid); } catch (e1) {}
        var sel = pickedList();
        D.uids = sel.indexOf(D.uid) > -1 ? sel : [D.uid];
        host.setAttribute('data-drag', '1');
        D.ghost = document.createElement('div');
        D.ghost.className = 'nx-ghost';
        var first = itemOf(D.uid);
        D.ghost.textContent = D.uids.length > 1 ? String(D.uids.length) : ((first && first.title) || '');
        document.body.appendChild(D.ghost);
      }
      e.preventDefault();
      D.ghost.style.left = '0';
      D.ghost.style.transform = 'translate(' + (e.clientX + 12) + 'px,' + (e.clientY + 12) + 'px)';
      var to = dropAt(e.clientX, e.clientY);
      if ((to && to.el) !== (D.to && D.to.el)) {
        if (D.to) D.to.el.classList.remove('nx-drop');
        if (to) to.el.classList.add('nx-drop');
      }
      D.to = to;
      return;
    }
    if (!press) return;
    if (Math.abs(e.clientX - press.x) > 8 || Math.abs(e.clientY - press.y) > 8) { clearTimeout(press.t); press = null; }
  }
  function onUp(e) {
    if (press) { clearTimeout(press.t); press = null; }
    if (D && e && e.pointerId === D.pid) dragEnd(e.type === 'pointerup');
  }

  function mount(el, api) {
    A = api;
    host = el;
    host.className = 'nx';
    host.setAttribute('data-gx', '1');
    if (!host._nxBound) {
      host._nxBound = 1;
      host.addEventListener('click', onClick);
      host.addEventListener('keydown', onKey);
      host.addEventListener('contextmenu', onCtx);
      host.addEventListener('pointerdown', onDown);
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerup', onUp);
      host.addEventListener('pointercancel', onUp);
    }
    if (!document._nxKey) {
      document._nxKey = 1;
      document.addEventListener('keydown', onDocKey);
    }
    render();
  }

  window.GardenNotesExplorer = {
    mount: mount,
    paint: paint,
    spaceStale: function () { SPACE = null; paint(); },
    active: function () { return !!(host && host.isConnected); },
    selectAll: function () { if (host && host.isConnected) selectAll(); }
  };
})();
