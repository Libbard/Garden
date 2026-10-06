(function () {
  'use strict';

  var SORTS = [
    { k: 'upd',  ar: 'الأحدث تعديلاً', en: 'Last modified', d: -1, i: 'fa-clock' },
    { k: 'ca',   ar: 'الأحدث إنشاءً',  en: 'Date created',  d: -1, i: 'fa-calendar-plus' },
    { k: 'name', ar: 'الاسم',          en: 'Name',          d: 1,  i: 'fa-font' },
    { k: 'size', ar: 'الحجم',          en: 'Size',          d: -1, i: 'fa-weight-hanging' },
    { k: 'kind', ar: 'النوع',          en: 'Kind',          d: 1,  i: 'fa-shapes' }
  ];
  var PRESS_MS = 450;
  var MOPT = { cls: 'na-ctx', id: 'na-ctx', attr: 'data-cact' };

  var A = null, host = null, anchor = null, press = null, ate = 0, lastList = [];
  var TH = {}, thIO = null, thAsked = {};
  var STAT = {}, stAsk = {}, stIO = null;
  var EST = null, EST_AT = 0;

  function L(a, e) { return A.L(a, e); }
  function esc(s) { return A.esc(s); }
  function ic(n, brand) { return '<i class="' + (brand ? 'fa-brands ' : 'fa-solid ') + n + '" aria-hidden="true"></i>'; }
  function GM() { return window.GardenMenu; }

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
      case 'ink':    return 'fa-pen-ruler';
      case 'quick':  return 'fa-bolt';
      case 'module': return 'fa-graduation-cap';
      case 'course': return 'fa-folder-open';
    }
    return 'fa-note-sticky';
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
  function lat(s) { return '<span class="nx-lat">' + esc(s) + '</span>'; }
  function nItems(n) {
    return A.isAr() ? (n === 1 ? 'عنصرٌ واحد' : n === 2 ? 'عنصران' : n + (n >= 3 && n <= 10 ? ' عناصر' : ' عنصراً')) : (n + (n === 1 ? ' item' : ' items'));
  }

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

  /*@3.NOEJ3.16*/
  function statList(n) {
    var s = STAT[n.id] || {}, out = [];
    function add(k, i, t, d, brand) { out.push({ k: k, i: i, t: t, d: d, brand: brand }); }
    if (n.pinned) add('pin', 'fa-thumbtack', L('مثبَّتة', 'Pinned'), L('مثبَّتةٌ في أعلى «الأحدث تعديلاً».', 'Pinned to the top of “Last modified”.'));
    if (n.src === 'rich' && A.shared && A.shared(n.id)) add('share', 'fa-link', L('مشارَكة', 'Shared'), L('لها رابطُ مشاركة: من يملك الرابطَ يقرؤها.', 'It has a share link: anyone with the link can read it.'));
    if (s.file) {
      if (s.us) add('cloud', 'fa-cloud', L('نسختُه عندنا', 'Copy with us'), L('نسخةٌ من الملفّ محفوظةٌ عندنا في السحاب — تفتحه من أيِّ جهازٍ تدخل منه.', 'A copy of the file is kept with us in the cloud — open it from any device you sign in on.'));
      if (s.gd) add('drive', 'fa-google-drive', L('في درايف', 'In Drive'), L('نسخةٌ منه في Google Drive الخاصِّ بك.', 'A copy is in your Google Drive.'), 1);
      if (s.dev && !s.us && !s.gd) add('only', 'fa-mobile-screen', L('على هذا الجهاز وحدَه', 'Only on this device'), L('لا نسخةَ له إلّا هنا: إن مُسح المتصفّحُ ضاع. ارفعْه إلى السحاب أو درايف من داخله.', 'Its only copy is here: clearing the browser loses it. Upload it to the cloud or Drive from inside it.'));
      if (!s.dev && !s.us && !s.gd) {
        add('none', 'fa-triangle-exclamation', s.other ? L('على جهازٍ آخر', 'On another device') : L('لا نسخةَ نراها', 'No copy we can see'),
          s.other ? L('استُورد على جهازٍ آخر ولم يُرفع بعد: افتحْه هناك وارفعْه، أو أعِدْ فتحَه من ملفّك هنا.', 'Imported on another device and not uploaded yet: open it there and upload it, or reopen it from your file here.')
                  : L('لا نجد الملفَّ على هذا الجهاز ولا عندنا ولا في درايف. أعِدْ فتحَه من ملفّك.', 'The file is not on this device, with us, or in Drive. Reopen it from your file.'));
      }
    }
    if (s.aud) add('aud', 'fa-microphone', L(s.aud === 1 ? 'فيها تسجيل' : 'فيها ' + s.aud + ' تسجيلات', s.aud === 1 ? 'Has a recording' : s.aud + ' recordings'),
      L('فيها ' + (s.aud === 1 ? 'تسجيلٌ صوتيّ' : s.aud + ' تسجيلات') + (s.audUs ? ' · ' + (s.audUs === s.aud ? 'كلُّها' : s.audUs + ' منها') + ' عندنا في السحاب' : ' · على هذا الجهاز'),
        s.aud + ' recording' + (s.aud === 1 ? '' : 's') + (s.audUs ? ' · ' + s.audUs + ' in our cloud' : ' · on this device')));
    if (n.remind_at) add('bell', 'fa-bell', L('لها تنبيه', 'Has a reminder'), L('لها تنبيهٌ في موعدٍ اخترتَه.', 'It has a reminder at a time you chose.'));
    return out;
  }
  var LEGEND = [
    ['pin', 'fa-thumbtack', 'مثبَّتة', 'Pinned', 'في أعلى «الأحدث تعديلاً».', 'At the top of “Last modified”.'],
    ['share', 'fa-link', 'مشارَكة', 'Shared', 'لها رابطٌ يقرؤها به غيرُك.', 'It has a link others can read it with.'],
    ['cloud', 'fa-cloud', 'نسختُه عندنا', 'Copy with us', 'الملفُّ محفوظٌ عندنا في السحاب ويُفتح من أيِّ جهاز.', 'The file is kept in our cloud and opens on any device.'],
    ['drive', 'fa-google-drive', 'في درايف', 'In Drive', 'نسخةٌ في Google Drive الخاصِّ بك.', 'A copy is in your Google Drive.', 1],
    ['only', 'fa-mobile-screen', 'على هذا الجهاز وحدَه', 'Only on this device', 'لا نسخةَ احتياطيّة — ارفعْه كي لا يضيع.', 'No backup — upload it so it is not lost.'],
    ['none', 'fa-triangle-exclamation', 'لا نسخةَ هنا', 'No copy here', 'الملفُّ على جهازٍ آخر أو لا نراه.', 'The file is on another device or we cannot see it.'],
    ['aud', 'fa-microphone', 'فيها تسجيل', 'Has a recording', 'تسجيلٌ صوتيٌّ داخل الملاحظة.', 'A voice recording inside the note.'],
    ['bell', 'fa-bell', 'لها تنبيه', 'Has a reminder', 'تنبيهٌ في موعدٍ اخترتَه.', 'A reminder at a time you chose.']
  ];
  function stHtml(n) {
    if (n.src !== 'rich') return '<span class="nx-st" aria-hidden="true"></span>';
    var st = statList(n), lbl = st.map(function (x) { return x.t; }).join(' · ');
    if (!st.length) return '<span class="nx-st" data-st="' + esc(n.id) + '" aria-hidden="true"></span>';
    return '<button type="button" class="nx-st" data-x="why" data-st="' + esc(n.id) + '" aria-label="' + esc(L('الحالة: ', 'Status: ') + lbl) + '">' +
      st.map(function (x) { return '<i class="' + (x.brand ? 'fa-brands ' : 'fa-solid ') + x.i + '" data-k="' + x.k + '" title="' + esc(x.t) + '" aria-hidden="true"></i>'; }).join('') +
      '</button>';
  }
  function whyRows(st) {
    return st.map(function (x) {
      return '<div class="nx-why-r" data-k="' + x.k + '">' + ic(x.i, x.brand) + '<span><b>' + esc(x.t) + '</b><small>' + esc(x.d) + '</small></span></div>';
    }).join('');
  }
  function whyPop(btn) {
    var id = btn.getAttribute('data-st'), n = null;
    for (var i = 0; i < lastList.length; i++) if (lastList[i].id === id && lastList[i].src === 'rich') n = lastList[i];
    if (!n || !GM()) return;
    var r = btn.getBoundingClientRect();
    GM().open(A.isAr() ? r.right : r.left, r.bottom + 6,
      '<div class="gsf-rm-h"><span class="gsf-rm-hi">' + ic(kindIcon(kindOf(n))) + '</span><span class="gsf-rm-ht"><b dir="auto">' + esc(n.title || L('بلا عنوان', 'Untitled')) + '</b>' +
        '<small>' + esc(L('ما تعنيه رموزُها', 'What its icons mean')) + '</small></span></div>' + whyRows(statList(n)) +
      '<div class="gsf-menu-sep" role="separator"></div>' + GM().item('legend', 'fa-circle-question', L('كلُّ الرموز', 'All icons'), { attr: 'data-cact' }),
      function (act) { if (act === 'legend') legendPop(btn); }, { cls: 'na-ctx nx-whypop', attr: 'data-cact', anchorEnd: true, label: L('الحالة', 'Status') });
  }
  function legendPop(btn) {
    if (!GM()) return;
    var r = btn.getBoundingClientRect();
    GM().open(A.isAr() ? r.right : r.left, r.bottom + 6,
      '<div class="gsf-rm-h"><span class="gsf-rm-hi">' + ic('fa-circle-question') + '</span><span class="gsf-rm-ht"><b>' + esc(L('ماذا تعني الرموز؟', 'What do the icons mean?')) + '</b>' +
        '<small>' + esc(L('تظهر أسفلَ كلِّ بطاقة · مرِّرِ الفأرةَ أو اضغطْها لتعرف حالَ ملفِّها', 'Shown under each card · hover or tap them for that file')) + '</small></span></div>' +
      whyRows(LEGEND.map(function (x) { return { k: x[0], i: x[1], t: L(x[2], x[3]), d: L(x[4], x[5]), brand: x[6] }; })),
      null, { cls: 'na-ctx nx-whypop nx-legend-pop', attr: 'data-cact', anchorEnd: true, label: L('دليلُ الرموز', 'Icon guide') });
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
  function btn(x, icon, label, cls, extra) {
    return '<button type="button" class="gsf-btn gsf-btn--sm nx-b ' + (cls || 'gsf-btn--ghost') + '" data-x="' + x + '"' + (extra || '') + '>' +
      ic(icon) + (label ? '<span class="nx-b-t">' + esc(label) + '</span>' : '') + '</button>';
  }
  function tip(ar, en) { return ' aria-label="' + esc(L(ar, en)) + '" data-ar-title="' + esc(ar) + '" data-en-title="' + esc(en) + '"'; }

  function barHtml(place) {
    var s = sortOf(), vm = vmOf();
    var h = '<div class="nx-bar">' +
      /*@3.NOEJ3.1*/
      (A.sections ? btn('side', 'fa-bars', L('الأقسام', 'Sections'), 'gsf-btn--ghost nx-side', tip('الأقسام', 'Sections')) : '') +
      '<nav class="nx-crumb" aria-label="' + esc(L('المسار', 'Path')) + '">' + crumbHtml() + '</nav>' +
      '<div class="nx-tools">';
    if (place !== 'space') {
      h += btn('sort', s.d < 0 ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-wide-short', sortLabel(), 'gsf-btn--ghost nx-quiet',
        ' aria-haspopup="menu" aria-label="' + esc(L('ترتيب: ', 'Sort: ') + sortLabel()) + '" data-ar-title="ترتيب" data-en-title="Sort"') +
        '<div class="nx-seg" role="group" aria-label="' + esc(L('طريقة العرض', 'View')) + '">' +
          '<button type="button" class="nx-segb" data-x="vm" data-v="grid" aria-pressed="' + (vm === 'grid') + '"' + tip('شبكة', 'Grid') + '>' + ic('fa-table-cells-large') + '</button>' +
          '<button type="button" class="nx-segb" data-x="vm" data-v="rows" aria-pressed="' + (vm === 'rows') + '"' + tip('تفاصيل', 'Details') + '>' + ic('fa-list') + '</button>' +
        '</div>' +
        btn('legend', 'fa-circle-question', L('الرموز', 'Icons'), 'gsf-btn--ghost nx-quiet', ' aria-haspopup="dialog"' + tip('ماذا تعني الرموز؟', 'What do the icons mean?'));
    }
    if (place !== 'trash' && place !== 'space') {
      h += '<div class="nx-split">' +
        btn('nnote', 'fa-plus', L('جديد', 'New'), 'gsf-btn--go', tip('ملاحظةٌ جديدة', 'New note')) +
        btn('newmenu', 'fa-chevron-down', '', 'gsf-btn--go nx-b--ic', ' aria-haspopup="menu"' + tip('خياراتُ الجديد', 'More to create')) + '</div>';
    }
    /*@3.NOEJ3.3*/
    var back = A.last ? A.last() : null;
    if (back) h += '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b nx-b--ic nx-back" data-x="back" ' +
      'aria-label="' + esc(L('عُدْ إلى «', 'Back to “') + back.t + L('»', '”')) + '" data-ar-title="' + esc('عُدْ إلى «' + back.t + '» (Esc)') + '" data-en-title="' + esc('Back to “' + back.t + '” (Esc)') + '">' +
      ic('fa-xmark') + '</button>';
    return h + '</div></div>';
  }

  /*@3.NOEJ3.4*/
  function railHtml() {
    if (!A.places) return '';
    var cur = A.placeKey(), h = '<nav class="nx-rail" aria-label="' + esc(L('الأماكن', 'Places')) + '">';
    A.places().forEach(function (p) {
      if (p.head != null) {
        h += '<div class="nx-rail-h">' + (p.head ? '<span>' + esc(p.head) + '</span>' : '') +
          (p.add ? '<button type="button" class="nx-rail-add" data-x="nfolder-root"' + tip('مجلّد جديد', 'New folder') + '>' + ic('fa-plus') + '</button>' : '') + '</div>';
        return;
      }
      var on = A.placeKey(p.v) === cur;
      h += '<button type="button" class="nx-place" data-x="view" data-v="' + esc(JSON.stringify(p.v)) + '"' + (on ? ' aria-current="true"' : '') + '>' +
        ic(p.icon) + '<span class="nx-place-n" dir="auto">' + esc(p.label) + '</span>' +
        (p.n ? '<span class="nx-place-c">' + lat(String(p.n)) + '</span>' : '') + '</button>';
    });
    h += '<button type="button" class="nx-rail-m" data-x="view" data-v="' + esc(JSON.stringify({ k: 'space' })) + '">' + meterInner() + '</button>';
    return h + '</nav>';
  }
  function meterInner() {
    var e = EST || {}, pct = e.quota ? Math.max(1, Math.min(100, Math.round(e.usage / e.quota * 1000) / 10)) : 0;
    return '<span class="nx-rail-mt">' + esc(L('على هذا الجهاز', 'On this device')) + ' ' + (e.usage ? lat(fmtSize(e.usage)) : '…') + '</span>' +
      '<span class="nx-rail-mb" aria-hidden="true"><i style="inline-size:' + pct + '%"></i></span>';
  }
  function askEst() {
    if (EST && Date.now() - EST_AT < 30000) return;
    EST_AT = Date.now();
    if (!(navigator.storage && navigator.storage.estimate)) return;
    navigator.storage.estimate().then(function (e) {
      EST = { usage: e.usage || 0, quota: e.quota || 0 };
      var m = host && host.querySelector('.nx-rail-m');
      if (m) m.innerHTML = meterInner();
    }, function () {});
  }

  function folderTiles(fs) {
    if (!fs.length) return '';
    var h = '<section class="nx-folders" aria-label="' + esc(L('المجلّدات', 'Folders')) + '">';
    for (var i = 0; i < fs.length; i++) {
      var f = fs[i];
      var tgt = f.v ? ' data-x="view" data-v="' + esc(JSON.stringify(f.v)) + '"' + (f.course ? ' data-course="' + esc(f.course) + '"' : '') : ' data-x="folder" data-id="' + esc(f.id) + '"';
      h += '<button type="button" class="nx-fold"' + tgt + (f.tone ? ' style="--nx-tone:' + esc(f.tone) + '"' : '') + '>' +
        '<span class="nx-fold-i" aria-hidden="true">' + ic(f.icon || 'fa-folder') + '</span>' +
        '<span class="nx-ft"><span class="nx-fold-n" dir="auto">' + esc(f.name) + '</span>' +
        '<span class="nx-fold-c">' + esc(f.count ? nItems(f.count) : L('فارغ', 'Empty')) + '</span></span></button>';
    }
    return h + '</section>';
  }

  function itemHtml(n, picked, trash) {
    var k = kindOf(n), sel = n.src === 'rich';
    var on = !!picked[n.uid];
    var tone = n.origin && n.origin.course ? A.tone(n.origin.course) : null;
    var where = n.origin && n.origin.course ? n.origin.course : (n.folder ? A.folderName(n.folder) : '');
    var size = fmtSize(n.bytes);
    var when = A.when(n);
    var trashT = n.deleted ? L('حُذفت ', 'Deleted ') + A.ago(n.deleted) : '';
    var lbl = (n.title || '') + ' · ' + kindName(k) + (when ? ' · ' + when : '');
    var th = sel ? TH[n.id] : null;
    return '<div class="nx-it" role="option" tabindex="0" data-uid="' + esc(n.uid) + '" data-k="' + esc(k) + '"' + (sel ? ' data-id="' + esc(n.id) + '"' : ' data-ro="1"') +
        ' aria-selected="' + on + '" aria-label="' + esc(lbl) + '"' + (tone ? ' style="--nx-tone:' + esc(tone) + '"' : '') + '>' +
      '<button type="button" class="nx-ck" data-x="pick" tabindex="-1" aria-label="' + esc(L('حدِّد', 'Select')) + '">' + ic('fa-check') + '</button>' +
      /*@3.NOEJ3.5*/
      '<div class="nx-th" aria-hidden="true"' + (sel ? ' data-th="' + esc(n.id) + '"' : '') + '>' +
        (th ? '<img class="nx-th-img" src="' + esc(th) + '" alt="" decoding="async">'
            : '<span class="nx-pg"><span class="nx-pg-t" dir="auto">' + esc((n.title || '').slice(0, 60)) + '</span>' +
              (n.excerpt && k !== 'pdf' ? '<span class="nx-th-x" dir="auto">' + esc(n.excerpt.slice(0, 220)) + '</span>'
                                        : ic(kindIcon(k))) + '</span>') +
        (k === 'pdf' || k === 'board' || k === 'ink'
          ? '<span class="nx-kb nx-kb--' + esc(k === 'ink' ? 'board' : k) + '">' + esc(k === 'pdf' ? 'PDF' : L('لوح', 'Board')) + '</span>' : '') +
      '</div>' +
      (sel && !trash ? '<div class="nx-hov">' +
        '<button type="button" class="nx-hb" data-x="iopen" tabindex="-1">' + ic('fa-arrow-up-right-from-square') + '<span>' + esc(L('افتحْ', 'Open')) + '</span></button>' +
        '<button type="button" class="nx-hb nx-hb--ic" data-x="ishare" tabindex="-1"' + tip('شارِكْ', 'Share') + '>' + ic('fa-link') + '</button>' +
        '<button type="button" class="nx-hb nx-hb--ic" data-x="imore" tabindex="-1"' + tip('المزيد', 'More') + '>' + ic('fa-ellipsis') + '</button></div>' : '') +
      '<div class="nx-nm" dir="auto"><span class="nx-ki" aria-hidden="true">' + ic(kindIcon(k)) + '</span>' +
        '<span class="nx-nm-t">' + esc(n.title || L('بلا عنوان', 'Untitled')) + '</span></div>' +
      '<div class="nx-l1"><span class="nx-dot" aria-hidden="true"></span>' +
        '<span class="nx-l1-w" dir="auto">' + (where ? esc(where) : esc(kindName(k))) + '</span>' +
        (size ? '<span class="nx-l1-s">' + lat(size) + '</span>' : '') + '</div>' +
      '<div class="nx-c nx-c-k">' + esc(kindName(k)) + '</div>' +
      '<div class="nx-c nx-c-s">' + (size ? lat(size) : '<span class="nx-dim">—</span>') + '</div>' +
      '<div class="nx-c nx-c-w">' + (where ? '<span dir="auto">' + esc(where) + '</span>' : '<span class="nx-dim">—</span>') + '</div>' +
      '<div class="nx-c nx-c-m">' + esc(trashT || when) + '</div>' +
      '<div class="nx-l2 nx-meta"><span class="nx-m-w">' + esc(trashT || when) + '</span>' + stHtml(n) +
        (sel ? '<button type="button" class="nx-more" data-x="imore" tabindex="-1"' + tip('المزيد', 'More') + '>' + ic('fa-ellipsis') + '</button>' : '') + '</div>' +
    '</div>';
  }

  function headHtml() {
    var s = sortOf();
    function th(k, ar, en, cls) {
      var on = s.k === k;
      return '<button type="button" class="nx-hd ' + cls + '" data-x="sortk" data-k="' + k + '"' +
        (on ? ' aria-sort="' + (s.d < 0 ? 'descending' : 'ascending') + '"' : '') + '>' +
        esc(L(ar, en)) + (on ? ' ' + ic(s.d < 0 ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-wide-short') : '') +
        '</button>';
    }
    return '<div class="nx-head" role="presentation">' +
      '<span class="nx-hd-ck"></span>' +
      th('name', 'الاسم', 'Name', 'nx-hd-n') +
      th('kind', 'النوع', 'Kind', 'nx-hd-k') +
      th('size', 'الحجم', 'Size', 'nx-hd-s') +
      '<span class="nx-hd nx-hd-w">' + esc(L('المكان', 'Where')) + '</span>' +
      th('upd', 'عُدّلت', 'Modified', 'nx-hd-m') +
      '<span class="nx-hd nx-hd-st">' + esc(L('الحالة', 'Status')) + '</span>' +
      '</div>';
  }

  function emptyHtml(trash) {
    if (trash) {
      return '<div class="nx-empty"><span class="nx-empty-i">' + ic('fa-trash-can') + '</span>' +
        '<b>' + esc(L('السلّة فارغة', 'Trash is empty')) + '</b>' +
        '<p class="nx-hint">' + esc(L('ما تحذفه يبقى هنا ٣٠ يوماً ثمّ يُمحى من كلِّ أجهزتك.', 'What you delete stays here for 30 days, then it is erased from all your devices.')) + '</p></div>';
    }
    return '<div class="nx-empty"><span class="nx-empty-i">' + ic('fa-feather') + '</span>' +
      '<b>' + esc(L('لا شيءَ هنا بعد', 'Nothing here yet')) + '</b>' +
      '<p class="nx-hint">' + esc(L('ابدأْ بملاحظة، أو اسحبْ ملفّاتِ PDF وتسجيلاتٍ إلى هنا.', 'Start a note, or drag PDFs and recordings here.')) + '</p>' +
      '<div class="nx-empty-a">' + btn('nnote', 'fa-plus', L('ملاحظةٌ جديدة', 'New note'), 'gsf-btn--go') +
        btn('import', 'fa-file-import', L('استوردْ ملفّات', 'Import files'), 'gsf-btn--ghost') + '</div></div>';
  }

  function detailHtml(n) {
    var k = kindOf(n);
    var h = '<div class="nx-det-hd"><span class="nx-det-ic">' + ic(kindIcon(k)) + '</span>' +
      '<span><b class="nx-det-t" id="nx-props-t" dir="auto">' + esc(n.title || L('بلا عنوان', 'Untitled')) + '</b><small>' + esc(kindName(k)) + '</small></span></div><dl class="nx-dl">' +
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
    var st = statList(n);
    if (st.length) h += '<div class="nx-det-st"><b>' + esc(L('حالتُها', 'Its status')) + '</b>' + whyRows(st) + '</div>';
    if (n.excerpt) h += '<p class="nx-det-x" dir="auto">' + esc(n.excerpt.slice(0, 280)) + '</p>';
    return h;
  }

  function fillDetail(n) {
    if (!n || n.src !== 'rich' || !A.doc) return;
    A.doc(n.id).then(function (row) {
      var d = row && row.doc;
      var box = d && document.querySelector('.nx-det[data-uid="' + n.uid + '"]');
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
  /*@3.NOEJ3.17*/
  function propsOpen(n) {
    if (!n) return;
    var d = document.getElementById('nx-props');
    if (!d) {
      d = document.createElement('dialog');
      d.id = 'nx-props';
      d.className = 'gsf nx-props';
      d.setAttribute('aria-labelledby', 'nx-props-t');
      (document.getElementById('na') || document.body).appendChild(d);
    }
    d.innerHTML = '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close"' + tip('أغلقْ', 'Close') + '>' + ic('fa-xmark') + '</button></form>' +
      '<div class="gsf-body"><div class="nx-det" data-uid="' + esc(n.uid) + '">' + detailHtml(n) + '</div></div>';
    A.i18n(d);
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
    var redo = function () { if (d.open) { var b = d.querySelector('.nx-det'); if (b) { b.innerHTML = detailHtml(n); fillDetail(n); } } };
    fillDetail(n);
    if (n.src === 'rich' && A.status) A.status(n.id).then(function (s) { STAT[n.id] = s; redo(); }, function () {});
  }

  function selbarHtml(trash) {
    var n = pickedList().length;
    var h = '<div class="nx-sel" role="toolbar" aria-label="' + esc(L('أفعال المحدَّد', 'Selection actions')) + '"' + (n ? '' : ' hidden') + '>' +
      '<b class="nx-sel-n">' + esc(L(n === 1 ? 'عنصرٌ واحد' : (n === 2 ? 'عنصران' : n + (n <= 10 ? ' عناصر' : ' عنصراً')), n + (n === 1 ? ' item' : ' items'))) + '</b>';
    function b(x, icon, ar, en, cls) { return btn(x, icon, L(ar, en), cls || 'gsf-btn--ghost'); }
    var tot = lastList.length;
    /*@3.NOEJ3.26*/
    if (n < tot) h += b('pickall', 'fa-check-double', 'حدِّدِ الكلّ (' + tot + ')', 'Select all (' + tot + ')');
    h += b('unpick', 'fa-xmark', 'ألغِ التحديد', 'Clear selection') + '<span class="nx-sel-vr" aria-hidden="true"></span>';
    if (trash) {
      h += b('restore', 'fa-rotate-left', 'استعِدْ', 'Restore');
      h += '<span class="nx-sel-vr" aria-hidden="true"></span>' + b('purge', 'fa-trash', 'احذفْ نهائيّاً', 'Delete forever', 'gsf-btn--danger');
    } else {
      if (n === 1) h += b('open', 'fa-up-right-from-square', 'افتحْ', 'Open');
      h += b('move', 'fa-folder-open', 'انقلْ', 'Move');
      h += b('export', 'fa-file-export', 'صدِّرْ', 'Export');
      /*@3.NOEJ3.32*/
      var pk = pickedList().map(itemOf).filter(Boolean);
      var allPdf = pk.length === n && pk.every(function (x) { return kindOf(x) === 'pdf'; });
      if (allPdf && n >= 2 && A.pdfMerge) h += b('pmerge', 'fa-object-group', 'ادمجْ', 'Merge');
      if (allPdf && n === 1 && A.pdfSplit) h += b('psplit', 'fa-scissors', 'قسِّمْ', 'Split');
      h += A.view().k === 'archive'
        ? b('unarch', 'fa-box-archive', 'أعِدْ من الأرشيف', 'Unarchive')
        : b('arch', 'fa-box-archive', 'أرشِفْ', 'Archive');
      h += '<span class="nx-sel-vr" aria-hidden="true"></span>' + b('trash', 'fa-trash', 'إلى السلّة', 'To trash', 'gsf-btn--danger');
    }
    return h + '</div>';
  }

  /*@3.NOEJ3.14*/
  var FSEL = {}, FANCH = null, FF = 'all', FROWS = [];
  var FILTS = [
    { k: 'all', ar: 'الكلّ', en: 'All', f: function () { return true; } },
    { k: 'here', ar: 'على هذا الجهاز', en: 'On this device', f: function (f) { return f.dev; } },
    { k: 'only', ar: 'على هذا الجهاز وحدَه', en: 'Only on this device', f: function (f) { return f.dev && !f.us && !f.gd && !f.tr; } },
    { k: 'none', ar: 'بلا نسخةٍ نراها', en: 'No copy we can see', f: function (f) { return !f.dev && !f.us && !f.gd; } },
    { k: 'trash', ar: 'في السلّة', en: 'In trash', f: function (f) { return f.tr; } }
  ];
  function filtOf(k) { for (var i = 0; i < FILTS.length; i++) if (FILTS[i].k === k) return FILTS[i].f; return FILTS[0].f; }
  function fPicked() { return FROWS.filter(function (f) { return FSEL[f.h]; }); }
  function fselHtml() {
    var ps = fPicked(), n = ps.length;
    var canFree = ps.filter(function (f) { return f.dev && f.us; }).length;
    var canErase = ps.length, w = keepWays();
    var canUs = ps.filter(function (f) { return keepable(f, 'us'); }).length, canGd = ps.filter(function (f) { return keepable(f, 'gd'); }).length;
    function b(x, icon, ar, en, cls, off, why) {
      return '<button type="button" class="gsf-btn gsf-btn--sm nx-b ' + (cls || 'gsf-btn--ghost') + '" data-x="' + x + '"' + (off ? ' disabled' : '') +
        (why ? ' title="' + esc(why) + '"' : '') + '>' + ic(icon, icon === 'fa-google-drive') + '<span class="nx-b-t">' + esc(L(ar, en)) + '</span></button>';
    }
    return '<div class="nx-sel" role="toolbar" aria-label="' + esc(L('أفعال المحدَّد', 'Selection actions')) + '"' + (n ? '' : ' hidden') + '>' +
      '<b class="nx-sel-n">' + esc(L(n === 1 ? 'ملفٌّ واحد' : (n === 2 ? 'ملفّان' : n + (n <= 10 ? ' ملفّات' : ' ملفّاً')), n + (n === 1 ? ' file' : ' files'))) + '</b>' +
      (n < FROWS.length ? b('fall', 'fa-check-double', 'حدِّدِ الكلّ (' + FROWS.length + ')', 'Select all (' + FROWS.length + ')') : '') +
      b('funpick', 'fa-xmark', 'ألغِ التحديد', 'Clear selection') + '<span class="nx-sel-vr" aria-hidden="true"></span>' +
      (w.us ? b('fkeepus', 'fa-cloud-arrow-up', 'ارفعْ عندنا' + (canUs && canUs < n ? ' (' + canUs + ')' : ''), 'Upload to us' + (canUs && canUs < n ? ' (' + canUs + ')' : ''), '', !canUs || KEEP.run,
        canUs ? '' : L('كلُّ المحدَّد له نسخةٌ عندنا أو ليس على هذا الجهاز', 'Everything selected already has a copy with us or is not on this device')) : '') +
      (w.gd ? b('fkeepgd', 'fa-google-drive', 'إلى درايف' + (canGd && canGd < n ? ' (' + canGd + ')' : ''), 'To Drive' + (canGd && canGd < n ? ' (' + canGd + ')' : ''), '', !canGd || KEEP.run,
        canGd ? '' : L('كلُّ المحدَّد في درايف أو ليس على هذا الجهاز', 'Everything selected is in Drive or not on this device')) : '') +
      b('ffree', 'fa-cloud-arrow-down', 'حرِّرْ من هذا الجهاز' + (canFree && canFree < n ? ' (' + canFree + ')' : ''), 'Free from this device' + (canFree && canFree < n ? ' (' + canFree + ')' : ''), '', !canFree,
        canFree ? '' : L('لا شيءَ محدَّدٌ على هذا الجهاز وله نسخةٌ عندنا', 'Nothing selected is on this device with a copy kept by us')) +
      '<span class="nx-sel-vr" aria-hidden="true"></span>' +
      b('ferase', 'fa-trash', 'احذفْ من كلِّ مكان' + (canErase && canErase < n ? ' (' + canErase + ')' : ''), 'Delete everywhere' + (canErase && canErase < n ? ' (' + canErase + ')' : ''), 'gsf-btn--danger', !canErase) +
      '</div>';
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
  function fFree(list) {
    var hs = list.filter(function (f) { return f.dev && f.us; }).map(function (f) { return f.h; });
    if (!hs.length || !A.spaceFree) return;
    A.spaceFree(hs).then(function (r) {
      CLEAN.msg = r.n ? L('حُرِّر ', 'Freed ') + fmtSize(r.bytes) + ' · ' + L('عددُها ' + r.n, r.n + ' items') : L('لم يُحذف شيء.', 'Nothing was removed.');
    }, function () { CLEAN.msg = L('تعذّر التحرير — لم يُحذف شيء.', 'Could not free — nothing was removed.'); })
      .then(function () { FSEL = {}; SPACE = null; STAT = {}; if (A.statusStale) A.statusStale(); render(); });
  }
  function fErase(list) {
    var ids = [], seen = {};
    list.forEach(function (f) { if (f.kind === 'pdf' && !seen[f.note]) { seen[f.note] = 1; ids.push(f.note); } });
    var aud = list.filter(function (f) { return f.kind === 'aud' && !seen[f.note]; }).map(function (f) { return { nid: f.note, i: f.h }; });
    if ((ids.length || aud.length) && A.spaceErase) A.spaceErase(ids, list.length === 1 ? list[0].name : '', aud);
  }
  function fileMenu(x, y, h) {
    if (!FSEL[h]) { FSEL = {}; FSEL[h] = 1; FANCH = h; fPaint(); }
    var ps = fPicked(), n = ps.length, pl = n > 1 ? ' (' + n + ')' : '';
    var canFree = ps.filter(function (f) { return f.dev && f.us; }).length;
    var canErase = ps.length, w = keepWays();
    var canUs = ps.filter(function (f) { return keepable(f, 'us'); }).length, canGd = ps.filter(function (f) { return keepable(f, 'gd'); }).length;
    var f0 = ps[0] || {}, copies = (f0.dev ? 1 : 0) + (f0.us ? 1 : 0) + (f0.gd ? 1 : 0);
    var items = [];
    if (n === 1) items.push({ a: 'fopen', i: 'fa-up-right-from-square', t: L('افتحْ ملاحظتَه', 'Open its note') });
    items.push({ a: 'ffree', i: 'fa-cloud-arrow-down', t: L('حرِّرْ من هذا الجهاز', 'Free from this device') + (canFree > 1 ? ' (' + canFree + ')' : ''), off: !canFree,
      why: canFree ? '' : L('يُحرَّر ما له نسخةٌ عندنا وحدَه', 'Only what has a copy with us can be freed') });
    if (w.us) items.push({ a: 'fkeepus', i: 'fa-cloud-arrow-up', t: L('ارفعْ إلى نسختي عندنا', 'Upload to my copy with us') + (canUs > 1 ? ' (' + canUs + ')' : ''), off: !canUs || KEEP.run,
      why: canUs ? '' : L('له نسخةٌ عندنا أو ليس على هذا الجهاز', 'It already has a copy with us or is not on this device') });
    if (w.gd) items.push({ a: 'fkeepgd', i: 'fa-google-drive', brand: 1, t: L('ارفعْ إلى درايفي', 'Upload to my Drive') + (canGd > 1 ? ' (' + canGd + ')' : ''), off: !canGd || KEEP.run,
      why: canGd ? '' : L('في درايف أو ليس على هذا الجهاز', 'It is in Drive or not on this device') });
    if (n > 1) items.push({ a: 'funpick', i: 'fa-xmark', t: L('ألغِ التحديد', 'Clear selection') + pl });
    items.push({ sep: 1 });
    items.push({ a: 'ferase', i: 'fa-trash', t: L('احذفْ من كلِّ مكان…', 'Delete everywhere…') + (canErase > 1 ? ' (' + canErase + ')' : ''), dz: 1, off: !canErase });
    GM().rich(x, y, {
      head: n === 1 ? { ico: f0.kind === 'pdf' ? 'fa-file-lines' : 'fa-microphone', t: f0.name, s: fmtSize(f0.bytes) + ' · ' + (copies ? L(copies === 1 ? 'نسخةٌ واحدة' : copies + ' نسخ', copies + (copies === 1 ? ' copy' : ' copies')) : L('لا نسخةَ نراها', 'No copy we can see')) }
                    : { ico: 'fa-square-check', t: L(n + ' ملفّات محدَّدة', n + ' files selected') },
      items: items
    }, function (act) {
      if (act === 'fopen' && ps[0] && A.openId) A.openId(ps[0].note);
      else if (act === 'ffree') fFree(ps);
      else if (act === 'fkeepus' || act === 'fkeepgd') keepGo(ps, act === 'fkeepgd' ? 'gd' : 'us');
      else if (act === 'ferase') fErase(ps);
      else if (act === 'funpick') fClear();
    }, MOPT);
  }

  /*@3.NOEJ3.9*/
  var SPACE = null, SPACE_AT = 0, SPACE_ASK = 0, LAST_PLACE = '';
  /*@3.NOEJ3.10*/
  var CLEAN = { msg: '' };
  function cleanHtml(s) {
    var pg = s.pages || { n: 0, bytes: 0 }, o = s.orph, h = '';
    var row = function (k, icon, ar, en, sub, bytes, can, btnAr, btnEn) {
      return '<div class="nx-cl-row" data-k="' + k + '"><span class="nx-cl-i">' + ic(icon) + '</span>' +
        '<span class="nx-cl-t"><b>' + esc(L(ar, en)) + '</b><small>' + esc(sub) + '</small></span>' +
        '<span class="nx-fr-s">' + lat(fmtSize(bytes) || '0 B') + '</span>' +
        (can ? '<button type="button" class="gsf-btn gsf-btn--sm nx-b" data-x="clean" data-k="' + k + '" data-ar="' + esc(btnAr) + '" data-en="' + esc(btnEn) + '">' + esc(L(btnAr, btnEn)) + '</button>' : '') +
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
  /*@3.NOEJ3.24*/
  var KEEP = { run: 0, to: '', at: 0, of: 0, cur: null, prog: 0, ok: 0, bad: [], msg: '', stop: 0 };
  function keepable(f, to) { return !!(f && f.dev && !f.tr && !(to === 'gd' ? f.gd : f.us)); }
  function keepWays() { return A.keepWays ? A.keepWays() : { us: false, gd: false }; }
  function keepPct() { return Math.round(Math.min(1, ((KEEP.at - 1) + (KEEP.prog || 0)) / Math.max(1, KEEP.of)) * 1000) / 10; }
  function keepHtml(s) {
    var only = s.files.filter(function (f) { return f.dev && !f.us && !f.gd && !f.tr; });
    if (!KEEP.run && !KEEP.msg && !only.length) return '';
    var w = keepWays(), bytes = only.reduce(function (a, f) { return a + (f.bytes || 0); }, 0), h;
    h = '<section class="nx-sp-card nx-keep" data-run="' + (KEEP.run ? 1 : 0) + '"><div class="nx-sp-h"><b>' + esc(L('احمِ ملفّاتك', 'Protect your files')) + '</b><span>' +
      (KEEP.run ? esc(L('يُرفع ', 'Uploading ')) + lat(KEEP.at + ' / ' + KEEP.of) : esc(L('لا نسخةَ لها إلّا هنا', 'Their only copy is here'))) + '</span></div>';
    if (KEEP.run) {
      var c = KEEP.cur || {};
      h += '<div class="nx-keep-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + KEEP.of + '" aria-valuenow="' + KEEP.at + '"><i style="inline-size:' + keepPct() + '%"></i></div>' +
        '<p class="nx-hint"><span dir="auto">' + esc(c.name || '') + '</span> · ' + lat(fmtSize(c.bytes) || '0 B') + '</p>' +
        '<div class="nx-keep-b"><button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="kstop"' + (KEEP.stop ? ' disabled' : '') + '>' +
        esc(KEEP.stop ? L('يقف بعد هذا الملفّ…', 'Stopping after this file…') : L('أوقِفْ بعد هذا الملفّ', 'Stop after this file')) + '</button></div>';
    } else {
      if (only.length) {
        h += '<div class="nx-cl-row" data-k="keep"><span class="nx-cl-i">' + ic('fa-mobile-screen') + '</span>' +
          '<span class="nx-cl-t"><b>' + esc(only.length === 1 ? L('ملفٌّ على هذا الجهاز وحدَه', 'One file is on this device only')
            : only.length === 2 ? L('ملفّان على هذا الجهاز وحدَه', 'Two files are on this device only')
            : L(only.length + (only.length <= 10 ? ' ملفّاتٍ' : ' ملفّاً') + ' على هذا الجهاز وحدَه', only.length + ' files are on this device only')) + '</b>' +
          '<small>' + esc(L('إن مُسح المتصفّحُ ضاعت — ارفعْها لتفتحها من أيِّ جهاز', 'Clearing the browser would lose them — upload them to open them anywhere')) + '</small></span>' +
          '<span class="nx-fr-s">' + lat(fmtSize(bytes) || '0 B') + '</span><span></span></div>';
        h += '<div class="nx-keep-b">' +
          (w.us ? '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--go nx-b" data-x="keep" data-to="us">' + ic('fa-cloud-arrow-up') + esc(L('ارفعْها إلى نسختي عندنا', 'Upload them to my copy with us')) + '</button>' : '') +
          (w.gd ? '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="keep" data-to="gd">' + ic('fa-google-drive', 1) + esc(L('إلى درايفي', 'To my Drive')) + '</button>' : '') +
          (!w.us && !w.gd ? '<span class="nx-hint">' + esc(L('افتحِ المزامنةَ أو اربطْ درايف لترفعها.', 'Turn on sync or connect Drive to upload them.')) + '</span>' : '') + '</div>';
      }
      if (KEEP.msg) h += '<p class="nx-hint" role="status">' + esc(KEEP.msg) + '</p>';
      h += keepBigHtml(w);
    }
    return h + '</section>';
  }
  /*@3.NOEJ3.30*/
  var BACK = { run: 0, msg: '', k: '', i: 0, n: 0 };
  function backHtml() {
    if (!A.backup) return '';
    var steps = { notes: L('الملاحظات', 'Notes'), ink: L('الرسم', 'Drawings'), images: L('الصور', 'Images'), files: L('الملفّات', 'Files'), done: L('يُحفظ', 'Saving'),
                  up: L('يُرفع إلى درايف', 'Uploading to Drive'), down: L('يُنزَّل من درايف', 'Downloading from Drive') };
    var gd = !!(A.driveOn && A.driveOn());
    var h = '<section class="nx-sp-card nx-back" data-run="' + (BACK.run ? 1 : 0) + '"><div class="nx-sp-h"><b>' + esc(L('نسخةٌ كاملةٌ في ملفٍّ واحد', 'A full copy in one file')) + '</b>' +
      '<span>' + (BACK.run ? esc(steps[BACK.k] || '') + (BACK.pct != null ? ' ' + lat(BACK.pct + '%') : BACK.n > 1 ? ' ' + lat(BACK.i + ' / ' + BACK.n) : '') : esc(gd ? L('على جهازك أو في درايفك', 'On your device or in your Drive') : L('على جهازك', 'On your device'))) + '</span></div>';
    h += '<p class="nx-hint">' + esc(L('ملاحظاتُك ومجلّداتُها وملفّاتُ PDF وتسجيلاتُك وصورُك ورسمُك في ملفٍّ مضغوطٍ واحد — تُقرأ دون الموقع، وفيها ما تُستعاد به.',
      'Your notes with their folders, PDFs, recordings, images and drawings in one ZIP — readable without the site, and complete enough to restore.')) + '</p>';
    h += '<div class="nx-keep-b"><button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="backup"' + (BACK.run ? ' disabled' : '') + '>' +
      ic('fa-file-zipper') + esc(BACK.run ? L('يُجمع…', 'Collecting…') : L('نزِّلِ النسخةَ الكاملة', 'Download the full copy')) + '</button>' +
      (gd && A.backupDrive ? '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="backgd"' + (BACK.run ? ' disabled' : '') + '>' +
        ic('fa-google-drive', 1) + esc(L('إلى درايفي', 'To my Drive')) + '</button>' : '') +
      (A.restorePlan ? '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="rpick"' + (BACK.run || BACK.plan ? ' disabled' : '') + '>' +
        ic('fa-clock-rotate-left') + esc(L('استعِدْ من ملفّ…', 'Restore from a file…')) + '</button>' : '') +
      (gd && A.driveBackups ? '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="rgdlist"' + (BACK.run || BACK.plan ? ' disabled' : '') + '>' +
        ic('fa-google-drive', 1) + esc(L('استعِدْ من درايف…', 'Restore from Drive…')) + '</button>' : '') + '</div>';
    if (gd && A.gdAuto) {
      var au = A.gdAuto(), dt = au.at ? new Date(au.at) : null;
      h += '<label class="nx-gdauto"><input type="checkbox" data-x="gdauto"' + (au.on ? ' checked' : '') + '> <span>' +
        esc(L('احفظْ نسخةً في درايفي كلَّ أسبوعٍ تلقائيّاً', 'Save a copy to my Drive every week, automatically')) + '</span></label>';
      if (au.on && au.linked === false) h += '<p class="nx-hint">' + esc(L('اربطْ درايف من الإعدادات ليعمل دون أن يسألك كلَّ مرّة.', 'Link Drive in Settings so it runs without asking you each time.')) + '</p>';
      else if (au.on) h += '<p class="nx-hint">' + esc(dt ? L('آخرُ نسخةٍ تلقائيّة: ', 'Last automatic copy: ') + dt.toLocaleDateString(L('ar', 'en'), { day: 'numeric', month: 'short' }) : L('أوّلُ نسخةٍ بعد دقيقةٍ من فتح الملاحظات.', 'The first copy runs a minute after you open your notes.')) + '</p>';
    }
    if (BACK.gdl && !BACK.plan) h += gdlHtml(BACK.gdl);
    if (BACK.plan) h += restHtml(BACK.plan);
    if (BACK.msg) h += '<p class="nx-hint" role="status">' + esc(BACK.msg) + '</p>';
    return h + '</section>';
  }
  function backPaint() {
    var c = host && host.querySelector('.nx-back');
    if (!c) return;
    var t = document.createElement('div');
    t.innerHTML = backHtml();
    if (t.firstChild) c.parentNode.replaceChild(t.firstChild, c);
  }
  function backGo() {
    if (BACK.run || !A.backup) return;
    BACK = { run: 1, msg: '', k: 'notes', i: 0, n: 0 };
    backPaint();
    var last = 0;
    A.backup(function (k, i, n) {
      BACK.k = k; BACK.i = i; BACK.n = n;
      var t = Date.now();
      if (t - last > 120 || k === 'done') { last = t; backPaint(); }
    }).then(function (res) {
      var c = res.counts || {};
      BACK = { run: 0, k: '', i: 0, n: 0, msg: res.how === 'cancel' ? L('أُلغي الحفظ — لم يُكتب شيء.', 'Saving was cancelled — nothing was written.')
        : L('حُفظت النسخة: ', 'Saved: ') + c.notes + L(' ملاحظة · ', ' notes · ') + c.files + L(' ملفّاً · ', ' files · ') + c.images + L(' صورة · ', ' images · ') + fmtSize(res.bytes) };
      backPaint();
    }, function (e) {
      BACK = { run: 0, k: '', i: 0, n: 0, msg: (e && e.message === 'zip_too_big') ? L('النسخةُ أكبرُ من ‎4 جيجا — جرِّبْ بعد نقل ملفّاتٍ إلى درايف.', 'The copy is over 4 GB — try again after moving files to Drive.')
        : L('تعذّر جمعُ النسخة — لم يُحذف شيء.', 'Could not collect the copy — nothing was removed.') };
      backPaint();
    });
  }
  function restHtml(P) {
    var row = function (n, ar, en) { return n ? '<li>' + esc(L(ar, en)) + ' <b>' + lat(String(n)) + '</b></li>' : ''; };
    var fresh = P.add + P.newer + P.folders.length + P.files.length + P.images.length + P.keys.length + P.ink;
    var dt = new Date(P.man.at || 0), p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    var when = isNaN(dt) ? '' : dt.getFullYear() + '-' + p2(dt.getMonth() + 1) + '-' + p2(dt.getDate()) + ' ' + p2(dt.getHours()) + ':' + p2(dt.getMinutes());
    var h = '<div class="nx-rest" role="group" aria-label="' + esc(L('ما ستُضيفه النسخة', 'What the copy will add')) + '">' +
      '<p class="nx-hint">' + esc(L('نسخةُ ', 'Copy from ')) + lat(when) + esc(L(' — تُضاف ولا تمحو: ما على جهازك أحدثَ يبقى.', ' — it adds and never erases: anything newer on this device stays.')) + '</p><ul class="nx-rest-l">' +
      row(P.add, 'ملاحظاتٌ ليست على جهازك:', 'Notes not on this device:') +
      row(P.newer, 'ملاحظاتٌ نسختُها في الملفّ أحدث:', 'Notes whose copy in the file is newer:') +
      row(P.files.length, 'ملفّاتُ PDF وتسجيلات:', 'PDFs and recordings:') +
      row(P.images.length, 'صور:', 'Images:') +
      row(P.ink, 'صفحاتٌ عليها رسمُك:', 'Pages with your drawing:') +
      row(P.folders.length, 'مجلّدات:', 'Folders:') +
      row(P.keys.length, 'من إعداداتك ومهامّك المحفوظة:', 'Of your saved settings and tasks:') +
      row(P.keep, 'ملاحظاتٌ على جهازك مثلُها أو أحدثُ منها فتبقى:', 'Notes already here, the same or newer — they stay:') +
      row(P.gone, 'ملاحظاتٌ حذفتَها بعد النسخة فلا تعود:', 'Notes you deleted after the copy, so they stay deleted:') + '</ul>';
    if (!fresh) {
      h += '<p class="nx-hint">' + esc(L('كلُّ ما في النسخة على جهازك — لا شيءَ يُستعاد.', 'Everything in the copy is already here — nothing to restore.')) + '</p>' +
        '<div class="nx-keep-b"><button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="rcancel">' + esc(L('حسناً', 'OK')) + '</button></div>';
    } else {
      h += '<div class="nx-keep-b"><button type="button" class="gsf-btn gsf-btn--sm gsf-btn--go nx-b" data-x="rgo"' + (BACK.run ? ' disabled' : '') + '>' + ic('fa-clock-rotate-left') +
        esc(BACK.run ? L('يُستعاد…', 'Restoring…') : L('استعِدْها', 'Restore')) + (P.bytes ? ' · ' + lat(fmtSize(P.bytes)) : '') + '</button>' +
        (BACK.run ? '' : '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="rcancel">' + esc(L('إلغاء', 'Cancel')) + '</button>') + '</div>';
    }
    return h + '</div>';
  }
  function gdlHtml(list) {
    var h = '<div class="nx-rest" role="group" aria-label="' + esc(L('نسخُك في درايف', 'Your copies in Drive')) + '">';
    if (!list.length) h += '<p class="nx-hint">' + esc(L('لا نسخةَ في درايفك بعد — اضغطْ «إلى درايفي» لتحفظ أولاها.', 'No copy in your Drive yet — press “To my Drive” to save the first.')) + '</p>';
    list.forEach(function (f) {
      var dt = new Date(f.at || 0), p2 = function (n) { return (n < 10 ? '0' : '') + n; };
      var w = isNaN(dt) ? '' : dt.getFullYear() + '-' + p2(dt.getMonth() + 1) + '-' + p2(dt.getDate()) + ' ' + p2(dt.getHours()) + ':' + p2(dt.getMinutes());
      h += '<div class="nx-cl-row" data-k="gd"><span class="nx-cl-i">' + ic('fa-file-zipper') + '</span><span class="nx-cl-t"><b>' + lat(w) + '</b><small dir="auto">' + esc(f.name || '') + '</small></span>' +
        '<span class="nx-fr-s">' + lat(fmtSize(f.size) || '0 B') + '</span>' +
        '<button type="button" class="gsf-btn gsf-btn--sm nx-b" data-x="rgdpick" data-id="' + esc(f.id) + '" data-n="' + esc(f.name || '') + '">' + esc(L('اخترْها', 'Choose')) + '</button></div>';
    });
    return h + '<div class="nx-keep-b"><button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="rcancel">' + esc(L('إغلاق', 'Close')) + '</button></div></div>';
  }
  function gdBackGo() {
    if (BACK.run || !A.backupDrive) return;
    BACK = { run: 1, msg: '', k: 'notes', i: 0, n: 0 };
    backPaint();
    var last = 0, tick = function () { var t = Date.now(); if (t - last > 150) { last = t; backPaint(); } };
    A.backupDrive(function (k, i, n) {
      BACK.k = k === 'done' ? 'up' : k; BACK.i = i; BACK.n = n; tick();
    }, function (at, of) {
      BACK.k = 'up'; BACK.pct = of ? Math.floor(at / of * 100) : 0; tick();
    }).then(function (res) {
      var c = res.counts || {};
      BACK = { run: 0, k: '', i: 0, n: 0, msg: L('حُفظت في درايفك (‏مجلّد Backups): ', 'Saved in your Drive (Backups folder): ') + c.notes + L(' ملاحظة · ', ' notes · ') + c.files + L(' ملفّاً · ', ' files · ') + fmtSize(res.bytes) };
      backPaint();
    }, function (e) {
      BACK = { run: 0, k: '', i: 0, n: 0, msg: (e && e.message === 'zip_too_big') ? L('النسخةُ أكبرُ من ‎4 جيجا — لا تُجمع في ملفٍّ واحد بعد.', 'The copy is over 4 GB — it cannot be one file yet.')
        : L('لم تُرفع النسخة: ', 'The copy was not uploaded: ') + (A.driveWhy ? A.driveWhy(e) : '') + L(' — لم يُحذف شيء.', ' — nothing was removed.') };
      backPaint();
    });
  }
  function gdListGo() {
    if (BACK.run || !A.driveBackups) return;
    BACK = { run: 0, msg: L('أقرأ نسخَك في درايف…', 'Reading your copies in Drive…'), k: '', i: 0, n: 0 };
    backPaint();
    A.driveBackups().then(function (list) {
      BACK = { run: 0, msg: '', k: '', i: 0, n: 0, gdl: list || [] };
      backPaint();
    }, function (e) {
      BACK = { run: 0, k: '', i: 0, n: 0, msg: L('تعذّرت قراءةُ درايف: ', 'Could not read Drive: ') + (A.driveWhy ? A.driveWhy(e) : '') };
      backPaint();
    });
  }
  function gdPickGo(b) {
    if (BACK.run || !A.driveBackupFile) return;
    BACK = { run: 1, msg: '', k: 'down', i: 0, n: 0, pct: 0 };
    backPaint();
    var last = 0;
    A.driveBackupFile(b.getAttribute('data-id'), b.getAttribute('data-n'), function (at, of) {
      BACK.pct = of ? Math.floor(at / of * 100) : 0;
      var t = Date.now(); if (t - last > 150) { last = t; backPaint(); }
    }).then(function (f) { return restLoad(f); }, function (e) {
      BACK = { run: 0, k: '', i: 0, n: 0, msg: L('تعذّر تنزيلُ النسخة من درايف: ', 'Could not download the copy from Drive: ') + (A.driveWhy ? A.driveWhy(e) : '') };
      backPaint();
    });
  }
  function restLoad(f) {
    BACK = { run: 0, msg: L('أقرأ النسخة…', 'Reading the copy…'), k: '', i: 0, n: 0 };
    backPaint();
    return A.restorePlan(f).then(function (P) {
      BACK = { run: 0, msg: '', k: '', i: 0, n: 0, plan: P };
      backPaint();
    }, function (e) {
      var m = e && e.message;
      BACK = { run: 0, k: '', i: 0, n: 0, msg: m === 'not_zip' || m === 'not_backup'
        ? L('هذا الملفُّ ليس نسخةً كاملةً من الحديقة — اخترِ الملفَّ الذي نزّلتَه من «نسخةٌ كاملةٌ في ملفٍّ واحد».', 'This is not a full Garden copy — pick the file you downloaded from “A full copy in one file”.')
        : m === 'zip_method' ? L('أُعيد ضغطُ الملفِّ بطريقةٍ لا يقرؤها متصفّحُك — استعملِ الملفَّ كما نزّلتَه.', 'The file was re-compressed in a way your browser cannot read — use the file as you downloaded it.')
        : L('تعذّرت قراءةُ النسخة — لم يتغيّر شيء.', 'Could not read the copy — nothing changed.') };
      backPaint();
    });
  }
  function restPick() {
    if (BACK.run || !A.restorePlan) return;
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.zip,application/zip';
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (f) restLoad(f);
    });
    inp.click();
  }
  function restGo() {
    var P = BACK.plan;
    if (!P || BACK.run || !A.restoreRun) return;
    BACK.run = 1; BACK.k = 'notes';
    backPaint();
    var last = 0;
    A.restoreRun(P, function (k, i, n) {
      BACK.k = k; BACK.i = i; BACK.n = n;
      var t = Date.now();
      if (t - last > 120 || k === 'done') { last = t; backPaint(); }
    }).then(function (g) {
      var m = L('استُعيد: ', 'Restored: ') + g.notes + L(' ملاحظة · ', ' notes · ') + g.files + L(' ملفّاً · ', ' files · ') + g.images + L(' صورة', ' images');
      if (g.bad) m += ' · ' + L('تعذّر ' + g.bad + ' — بقي ما على جهازك كما هو', g.bad + ' failed — what was on this device is unchanged');
      BACK = { run: 0, k: '', i: 0, n: 0, msg: m };
    }, function () {
      BACK = { run: 0, k: '', i: 0, n: 0, msg: L('توقّفت الاستعادة — ما استُعيد قبلها باقٍ، ولم يُمحَ شيء.', 'Restoring stopped — what came back before it stays, and nothing was erased.') };
    }).then(function () { SPACE = null; STAT = {}; if (A.statusStale) A.statusStale(); render(); });
  }
  function keepBigOver() {
    var b = KEEP.big || [], left = b.reduce(function (m, x) { return Math.min(m, x.e.left); }, Infinity);
    var fit = b.filter(function (x) { return x.e.over_max && x.e.bytes <= x.e.over_max; });
    var ob = b.filter(function (x) { return x.e.big_max && x.e.bytes <= x.e.big_max && !(x.e.over_max && x.e.bytes <= x.e.over_max); });
    var bl = ob.reduce(function (m, x) { return Math.min(m, x.e.big_left); }, Infinity);
    return { fit: isFinite(left) ? fit.slice(0, Math.max(0, left)) : [], left: isFinite(left) ? left : 0, of: (b[0] && b[0].e.of) || 0,
             big: isFinite(bl) ? ob.slice(0, Math.max(0, bl)) : [], bigLeft: isFinite(bl) ? bl : 0, bigOf: (ob[0] && ob[0].e.big_of) || 0,
             bigMax: (ob[0] && ob[0].e.big_max) || 0 };
  }
  function keepBigHtml(w) {
    var b = KEEP.big || [];
    if (!b.length) return '';
    var o = keepBigOver(), n = b.length;
    var h = '<div class="nx-cl-row" data-k="big"><span class="nx-cl-i">' + ic('fa-weight-hanging') + '</span>' +
      '<span class="nx-cl-t"><b>' + esc(n === 1 ? L('ملفٌّ أكبرُ من حدِّ الرفع لم يُرفع', 'One file over the upload limit was skipped')
        : L(n + (n <= 10 ? ' ملفّاتٍ أكبرُ' : ' ملفّاً أكبرُ') + ' من حدِّ الرفع لم تُرفع', n + ' files over the upload limit were skipped')) + '</b>' +
      '<small>' + esc(b.slice(0, 3).map(function (x) { return (x.f.name || '') + ' (' + fmtSize(x.e.bytes) + ')'; }).join(' · ') + (n > 3 ? ' …' : '')) + '</small></span>' +
      '<span class="nx-fr-s">' + lat(fmtSize(b[0].e.max) || '') + '</span><span></span></div><div class="nx-keep-b">';
    if (o.fit.length) h += '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--go nx-b" data-x="kover">' + ic('fa-cloud-arrow-up') +
      esc(L('ارفعْ ' + o.fit.length + ' بتجاوزات الفصل (بقي لك ' + o.left + ' من ' + o.of + ')',
            'Upload ' + o.fit.length + ' using this term’s exceptions (' + o.left + ' of ' + o.of + ' left)')) + '</button>';
    if (o.big.length) h += '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--go nx-b" data-x="kbig">' + ic('fa-cloud-arrow-up') +
      esc(L('ارفعْ «' + (o.big[0].f.name || '') + '» بخانة الفصل الكبيرة (‏حتى ' + fmtSize(o.bigMax) + ' · بقي لك ' + o.bigLeft + ')',
            'Upload “' + (o.big[0].f.name || '') + '” with the term’s large slot (up to ' + fmtSize(o.bigMax) + ' · ' + o.bigLeft + ' left)')) + '</button>';
    if (w.gd) h += '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost nx-b" data-x="kbiggd">' + ic('fa-google-drive', 1) +
      esc(L('أرسلْها إلى درايفي', 'Send them to my Drive')) + '</button>';
    return h + '</div>';
  }
  function keepPaint() {
    var c = host && host.querySelector('.nx-keep');
    if (c && SPACE) { c.outerHTML = keepHtml(SPACE); A.i18n(host); }
  }
  function keepGo(list, to, over, big) {
    if (KEEP.run || !A.spaceKeep) return;
    var go = list.filter(function (f) { return keepable(f, to); });
    if (!go.length) return;
    KEEP = { run: 1, to: to, at: 0, of: go.length, cur: null, prog: 0, ok: 0, bad: [], big: [], msg: '', stop: 0 };
    FSEL = {};
    render();
    A.spaceKeep(go, to, {
      start: function (k, f) { KEEP.at = k + 1; KEEP.cur = f; KEEP.prog = 0; keepPaint(); },
      prog: function (x) { KEEP.prog = x; var b = host && host.querySelector('.nx-keep-bar > i'); if (b) b.style.inlineSize = keepPct() + '%'; },
      done: function (k, f, ok, why, r) {
        if (ok) KEEP.ok++;
        else if (r && r.big && to === 'us') KEEP.big.push({ f: f, e: r.big });
        else KEEP.bad.push({ f: f, why: why || '' });
      },
      stop: function () { return !!KEEP.stop; },
      over: !!over,
      big: !!big
    }).then(function (r) {
      var where = to === 'gd' ? L('إلى درايفك', 'to your Drive') : L('إلى نسختك عندنا', 'to your copy with us');
      var m = KEEP.ok ? L('رُفع ' + KEEP.ok + ' ' + where, 'Uploaded ' + KEEP.ok + ' ' + where) : L('لم يُرفع شيء', 'Nothing was uploaded');
      if (KEEP.bad.length) m += ' · ' + L('تعذّر ' + KEEP.bad.length + ': ', KEEP.bad.length + ' failed: ') + KEEP.bad[0].why;
      if (r && r.halt) m += ' · ' + r.halt;
      else if (KEEP.stop && KEEP.at < KEEP.of) m += ' · ' + L('أُوقف قبل ' + (KEEP.of - KEEP.at), 'stopped before ' + (KEEP.of - KEEP.at));
      KEEP = { run: 0, msg: m, big: KEEP.big };
    }, function () { KEEP = { run: 0, msg: L('تعذّر الرفع — لم يتغيّر شيء.', 'The upload failed — nothing changed.') }; })
      .then(function () { SPACE = null; STAT = {}; if (A.statusStale) A.statusStale(); render(); });
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
      .then(function () { SPACE = null; STAT = {}; if (A.statusStale) A.statusStale(); render(); });
  }
  function spaceHtml(s) {
    if (!s) return '<div class="nx-space"><p class="nx-hint">' + esc(L('أجرد ما على هذا الجهاز…', 'Counting what is on this device…')) + '</p></div>';
    var h = '<div class="nx-space"><div class="nx-sp-side"><section class="nx-sp-card"><div class="nx-sp-h"><b>' + esc(L('مساحةُ هذا الجهاز', 'This device')) + '</b>' +
      '<span>' + lat(fmtSize(s.used) || '0 B') + (s.quota ? ' ' + esc(L('من', 'of')) + ' ' + lat(fmtSize(s.quota)) : '') + '</span></div>';
    var tot = s.cats.reduce(function (a, c) { return a + c.bytes; }, 0) || 1;
    h += '<div class="nx-meter" role="img" aria-label="' + esc(s.cats.map(function (c) { return c.label + ' ' + fmtSize(c.bytes); }).join(' · ')) + '">';
    s.cats.forEach(function (c) { h += '<i data-k="' + esc(c.k) + '" style="inline-size:' + Math.max(1, Math.round(c.bytes / tot * 1000) / 10) + '%"></i>'; });
    h += '</div><div class="nx-legend">';
    s.cats.forEach(function (c) { h += '<span><i data-k="' + esc(c.k) + '"></i>' + esc(c.label) + ' ' + lat(fmtSize(c.bytes)) + '</span>'; });
    h += '</div>';
    h += '</section>' + keepHtml(s) + cleanHtml(s) + backHtml() + '</div><section class="nx-sp-card nx-sp-files"><div class="nx-sp-h"><b>' + esc(L('ملفّاتي في كلِّ مكان', 'My files everywhere')) + '</b><span>' + esc(L('الأكبرُ أوّلاً', 'Largest first')) + '</span></div>';
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
      var chip = function (on, icon, ar, en, brand) { return '<span class="nx-chip"' + (on ? ' data-on="1"' : '') + '>' + ic(icon, brand) + esc(L(ar, en)) + '</span>'; };
      var none = !f.dev && !f.us && !f.gd;
      var on = !!FSEL[f.h];
      h += '<div class="nx-frow" role="option" tabindex="0" aria-selected="' + on + '" data-x="frow" data-fk="' + esc(f.h) + '" data-id="' + esc(f.note) + '">' +
        '<span class="nx-ck" data-x="fpick" role="checkbox" aria-checked="' + on + '" aria-label="' + esc(L('حدِّد', 'Select')) + '">' + ic('fa-check') + '</span>' +
        '<span class="nx-fr-i" data-k="' + (f.kind === 'pdf' ? 'pdf' : 'aud') + '">' + ic(f.kind === 'pdf' ? 'fa-file-lines' : 'fa-microphone') + '</span>' +
        '<span class="nx-fr-n"><b dir="auto">' + esc(f.name) + '</b><small dir="auto">' + esc(f.nt) + '</small></span>' +
        '<span class="nx-fr-s">' + lat(fmtSize(f.bytes)) + '</span>' +
        '<span class="nx-chips">' + chip(f.dev, 'fa-laptop', 'الجهاز', 'Device') + chip(f.us, 'fa-cloud', 'عندنا', 'Our copy') + chip(f.gd, 'fa-google-drive', 'درايف', 'Drive', 1) +
          (f.other ? '<span class="nx-chip" data-on="1" data-k="other" dir="auto">' + ic('fa-mobile-screen') + esc(f.other) + '</span>'
            : (none ? '<span class="nx-chip" data-k="none">' + ic('fa-triangle-exclamation') + esc(L('لا نسخةَ نراها', 'No copy we can see')) + '</span>' : '')) +
        '</span></div>';
    });
    if (s.files.length) h += '</div>';
    return h + '</section></div>' + fselHtml();
  }

  function placeOf() {
    var k = A.view().k;
    return k === 'trash' ? 'trash' : k === 'space' ? 'space' : 'home';
  }

  function termHtml() {
    var n = A.termNotice ? A.termNotice() : null;
    if (!n || !n.armed || !(n.refs > 0)) return '';
    var d = '';
    try { d = new Date(n.purge_at).toLocaleDateString(A.isAr() ? 'ar-u-ca-gregory-nu-latn' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) {}
    var cnt = n.refs === 1 ? L('ملفٌّ واحد', 'one file') : n.refs === 2 ? L('ملفّان', 'two files') : L(n.refs + (n.refs <= 10 ? ' ملفّات' : ' ملفّاً'), n.refs + ' files');
    return '<div class="nx-trashnote nx-term" role="status">' + ic('fa-hourglass-half') + '<span><b>' + esc(L('بدأ فصلٌ جديد', 'A new term has started')) + '</b> — ' +
      esc(L('ملفّاتُ الفصل الماضي (' + cnt + ' · ' + fmtSize(n.bytes) + ') تُحذف من نسختك عندنا يومَ ' + d + '. رسوماتُك وتعليقاتُك ونصوصُك تبقى، ونسخةُ جهازك ودرايف لا تُمسّ.',
            'Last term’s files (' + cnt + ' · ' + fmtSize(n.bytes) + ') will be removed from your copy with us on ' + d + '. Your drawings, comments and text stay, and your device and Drive copies are untouched.')) + '</span>' +
      '<span class="nx-term-b">' + btn('tnzip', 'fa-file-zipper', L('نزِّلِ النسخةَ الكاملة', 'Download a full copy'), 'gsf-btn--sm gsf-btn--go', '') +
      '<button type="button" class="gsf-btn gsf-btn--sm nx-b gsf-btn--ghost" data-x="tngd">' + ic('fa-google-drive', 1) + '<span class="nx-b-t">' + esc(L('إلى درايفي', 'To my Drive')) + '</span></button>' +
      '</span></div>';
  }

  function render() {
    if (!host || !host.isConnected || !A) return;
    askEst();
    var wasPlace = LAST_PLACE;
    LAST_PLACE = placeOf();
    if (A.view().k === 'space') {
      /*@3.NOEJ3.20*/
      if (wasPlace !== 'space' && !SPACE_ASK) SPACE = null;
      host.setAttribute('data-trash', '0');
      host.setAttribute('data-place', 'space');
      host.innerHTML = barHtml('space') +
        '<div class="nx-main">' + railHtml() + '<div class="nx-scroll">' + termHtml() + spaceHtml(SPACE) + '</div></div>';
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

    host.setAttribute('data-vm', vm);
    host.setAttribute('data-trash', trash ? '1' : '0');
    host.setAttribute('data-place', placeOf());
    host.innerHTML = barHtml(placeOf()) +
      '<div class="nx-main">' + railHtml() + '<div class="nx-scroll">' + termHtml() +
        (!trash && A.slidesBar ? A.slidesBar() : '') +
        (trash ? '<div class="nx-trashnote">' + ic('fa-circle-info') + '<span>' + esc(L('ما في السلّة يُمحى بعد ٣٠ يوماً من حذفه، من كلِّ أجهزتك.', 'What is in the trash is erased 30 days after you delete it, from all your devices.')) + '</span>' +
          btn('empty', 'fa-trash', L('أفرغِ السلّة', 'Empty trash'), 'gsf-btn--danger', list.length ? '' : ' disabled') + '</div>' : '') +
        (fs.length && list.length ? '<div class="nx-lbl">' + esc(L('المجلّدات', 'Folders')) + '</div>' : '') +
        folderTiles(fs) +
        (fs.length && list.length ? '<div class="nx-lbl">' + esc(L('الملفّات', 'Files')) + ' ' + lat(String(list.length)) + '</div>' : '') +
        (list.length
          ? (vm === 'rows' ? headHtml() : '') +
            '<div class="nx-items" role="listbox" aria-multiselectable="true" aria-label="' + esc(L('العناصر', 'Items')) + '">' +
            list.map(function (n) { return itemHtml(n, keep, trash); }).join('') + '</div>'
          : (fs.length ? '' : emptyHtml(trash))) +
      '</div></div>' +
      selbarHtml(trash);
    A.i18n(host);
    scroll = host.querySelector('.nx-scroll');
    if (scroll && top) scroll.scrollTop = top;
    var back = fu ? host.querySelector('.nx-it[data-uid="' + fu + '"]')
             : (fx ? host.querySelector('.nx-tools [data-x="' + fx + '"]') : null);
    if (!back && (fu || fx)) back = host.querySelector('.nx-it') || host.querySelector('.nx-b');
    if (back) { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
    watchThumbs();
    watchStat();
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
  function putStat(id) {
    var n = itemOf('rich:' + id), el = n && host && host.querySelector('.nx-st[data-st="' + id + '"]');
    if (!el) return;
    var w = document.createElement('div');
    w.innerHTML = stHtml(n);
    el.parentNode.replaceChild(w.firstChild, el);
    A.i18n(host);
  }
  function askStat(id) {
    if (stAsk[id] || !A.status) return;
    stAsk[id] = 1;
    A.status(id).then(function (s) {
      var old = JSON.stringify(STAT[id] || null);
      STAT[id] = s;
      if (old !== JSON.stringify(s)) putStat(id);
    }, function () {});
  }
  function watchStat() {
    if (!host || !A.status) return;
    stAsk = {};
    var its = host.querySelectorAll('.nx-it[data-id]');
    if (!('IntersectionObserver' in window)) { for (var i = 0; i < its.length; i++) askStat(its[i].getAttribute('data-id')); return; }
    if (stIO) stIO.disconnect();
    stIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { stIO.unobserve(en.target); askStat(en.target.getAttribute('data-id')); } });
    }, { root: host.querySelector('.nx-scroll'), rootMargin: '200px 0px' });
    for (var j = 0; j < its.length; j++) stIO.observe(its[j]);
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
    for (var i = lo; i <= hi; i++) p[lastList[i].uid] = 1;
    A.setPicked(p);
    paint();
  }
  function selectAll() {
    var p = {};
    for (var i = 0; i < lastList.length; i++) p[lastList[i].uid] = 1;
    A.setPicked(p);
    paint();
  }
  function clear() { A.setPicked({}); anchor = null; paint(); }

  function openItem(n) {
    if (!n) return;
    A.open(n);
  }
  function at(b) {
    var r = b.getBoundingClientRect();
    return { x: A.isAr() ? r.right : r.left, y: r.bottom + 4 };
  }

  /*@3.NOEJ3.18*/
  function sortMenu(b) {
    var p = at(b), s = sortOf();
    var items = SORTS.map(function (x) { return { a: 's:' + x.k, i: x.i, t: L(x.ar, x.en), ok: s.k === x.k }; });
    items.push({ sep: 1 });
    items.push({ a: 's:flip', i: s.d < 0 ? 'fa-arrow-up-wide-short' : 'fa-arrow-down-wide-short',
      t: s.d < 0 ? L('اقلبِ الترتيب: تصاعديّ', 'Reverse: ascending') : L('اقلبِ الترتيب: تنازليّ', 'Reverse: descending') });
    GM().rich(p.x, p.y, { items: items }, function (act) {
      if (act === 's:flip') A.uiSet('xs', { k: s.k, d: -s.d });
      else {
        var k = act.slice(2), def = null;
        for (var j = 0; j < SORTS.length; j++) if (SORTS[j].k === k) def = SORTS[j];
        if (def) A.uiSet('xs', { k: k, d: def.d });
      }
      paint();
    }, Object.assign({ anchorEnd: true, label: L('ترتيب', 'Sort') }, MOPT));
  }
  function importItems() {
    var gd = A.importDrive && A.driveOn && A.driveOn();
    return [
      { a: 'import', i: 'fa-laptop', t: L('ملفّاتٌ من جهازي…', 'Files from my device…') }].concat(gd ? [
      { a: 'importgd', i: 'fa-cloud-arrow-down', t: L('ملفّاتٌ من درايف…', 'Files from Drive…') }] : []).concat([
      { a: 'c:ai', i: 'fa-wand-magic-sparkles', t: L('من محادثة ذكاء…', 'From an AI chat…') },
      { a: 'c:md', i: 'fa-file-code', t: L('ماركداون…', 'Markdown…') },
      { a: 'c:json', i: 'fa-file-arrow-down', t: L('ملفُّ JSON صُدِّر من هنا…', 'A JSON export from here…') }
    ]);
  }
  function newMenu(b) {
    var p = at(b), items = [
      { a: 'nnote', i: 'fa-note-sticky', t: L('ملاحظةٌ جديدة', 'New note') },
      { a: 'c:board', i: 'fa-pen-ruler', t: L('لوحُ رسم', 'Drawing board') }
    ];
    if (A.canFolder()) items.push({ a: 'nfolder', i: 'fa-folder-plus', t: L('مجلّدٌ جديد', 'New folder') });
    items.push({ sep: 1 });
    items.push({ a: 'g:imp', i: 'fa-file-import', t: L('استوردْ', 'Import'), sub: importItems() });
    GM().rich(p.x, p.y, { items: items }, doSpaceAct, Object.assign({ anchorEnd: true, label: L('جديد', 'New') }, MOPT));
  }
  function doSpaceAct(act) {
    if (act === 'carch' || act === 'cunarch') { A.courseArch(A.view().code, act === 'carch'); return; }
    if (act === 'cmods' && A.courseMods) { A.courseMods(A.view().code); return; }
    if (act === 'nfolder') A.newFolder();
    else if (act === 'nnote') A.newNote();
    else if (act === 'import') pickFiles();
    else if (act === 'importgd' && A.importDrive) A.importDrive();
    else if (act === 'paste') A.paste();
    else if (act === 'empty') A.emptyTrash();
    else if (act === 'vm') { A.uiSet('xvm', vmOf() === 'grid' ? 'rows' : 'grid'); paint(); }
    else if (act === 'sort') { var sb = host.querySelector('.nx-tools [data-x="sort"]'); if (sb) sortMenu(sb); }
    else if (act.indexOf('c:') === 0 && A.create) A.create(act.slice(2));
  }

  function trashMenu(x, y, uid) {
    if (!pickedSet()[uid]) { var p = {}; p[uid] = 1; A.setPicked(p); paint(); }
    var ids = pickedList(), n = ids.length, it = itemOf(uid) || {};
    GM().rich(x, y, {
      head: n === 1 ? { ico: kindIcon(kindOf(it)), t: it.title || L('بلا عنوان', 'Untitled'), s: L('في السلّة · ', 'In trash · ') + (it.deleted ? A.ago(it.deleted) : '') }
                    : { ico: 'fa-square-check', t: L(n + ' عناصر محدَّدة', n + ' items selected'), s: L('في السلّة', 'In trash') },
      items: [{ a: 'restore', i: 'fa-rotate-left', t: L('استعِدْ', 'Restore') }, { sep: 1 },
              { a: 'purge', i: 'fa-trash', t: L('احذفْ نهائيّاً…', 'Delete forever…'), dz: 1, kb: 'Del' }]
    }, function (act) { if (act === 'restore') A.restore(pickedList()); else A.purge(pickedList()); }, MOPT);
  }

  /*@3.NOEJ3.19*/
  function itemMenu(x, y, uid) {
    var p0 = pickedSet();
    if (!p0[uid]) { A.setPicked({}); paint(); }
    var ids = pickedList();
    if (!ids.length) ids = [uid];
    var n = ids.length, it = itemOf(uid);
    if (!it) return;
    var k = kindOf(it), recs = ids.map(itemOf).filter(Boolean);
    var allPinned = recs.every(function (r) { return r.pinned; });
    var arch = A.view().k === 'archive';
    var canPaste = A.canPaste && A.canPaste();
    var head = n === 1
      ? { ico: kindIcon(k), tone: it.origin && it.origin.course ? A.tone(it.origin.course) : '', t: it.title || L('بلا عنوان', 'Untitled'),
          s: [kindName(k), it.origin && it.origin.course ? it.origin.course : (it.folder ? A.folderName(it.folder) : ''), fmtSize(it.bytes)].filter(Boolean).join(' · ') }
      : { ico: 'fa-square-check', t: L(n + ' عناصر محدَّدة', n + ' items selected'), s: fmtSize(recs.reduce(function (a, r) { return a + (r.bytes || 0); }, 0)) };
    var quick = n === 1
      ? [{ a: 'open', i: 'fa-arrow-up-right-from-square', t: L('افتحْ', 'Open') }, { a: 'share', i: 'fa-link', t: L('شارِكْ', 'Share') },
         { a: 'dup', i: 'fa-clone', t: L('كرِّرْ', 'Duplicate') }, { a: 'move', i: 'fa-folder-open', t: L('انقلْ', 'Move') }]
      : [{ a: 'move', i: 'fa-folder-open', t: L('انقلْ', 'Move') }, { a: 'export', i: 'fa-file-export', t: L('صدِّرْ', 'Export') },
         { a: 'dup', i: 'fa-clone', t: L('كرِّرْ', 'Duplicate') }, { a: arch ? 'unarch' : 'arch', i: 'fa-box-archive', t: arch ? L('أعِدْ', 'Unarchive') : L('أرشِفْ', 'Archive') }];
    var items = [
      { a: 'g:org', i: 'fa-pen-to-square', t: L('نظِّمْ', 'Organise'), sub: [
        { a: allPinned ? 'unpin' : 'pin', i: 'fa-thumbtack', t: allPinned ? L('ألغِ التثبيت', 'Unpin') : L('ثبِّتْ في الأعلى', 'Pin to top') },
        { a: arch ? 'unarch' : 'arch', i: 'fa-box-archive', t: arch ? L('أعِدْ من الأرشيف', 'Unarchive') : L('أرشِفْ', 'Archive') },
        { a: 'move', i: 'fa-folder-open', t: L('انقلْ إلى مجلّد…', 'Move to folder…') }] },
      { a: 'g:clip', i: 'fa-clipboard', t: L('الحافظة', 'Clipboard'), sub: [
        { a: 'copy', i: 'fa-copy', t: L('انسخْ', 'Copy'), kb: 'Ctrl C' },
        { a: 'cut', i: 'fa-scissors', t: L('قُصَّ', 'Cut'), kb: 'Ctrl X' },
        { a: 'paste', i: 'fa-paste', t: L('ألصِقْ هنا', 'Paste here'), kb: 'Ctrl V', off: !canPaste, why: canPaste ? '' : L('لا شيءَ في الحافظة', 'The clipboard is empty') }] },
      { a: 'course', i: 'fa-graduation-cap', t: (n === 1 && it.origin && it.origin.course) ? L('المادّة: ', 'Course: ') + it.origin.course + L(' — غيِّرْ…', ' — change…') : L('اربطْ بمادّة…', 'Link to a course…') },
      { a: 'export', i: 'fa-file-export', t: L('صدِّرْ…', 'Export…') }
    ];
    if (recs.length === n && recs.every(function (r) { return kindOf(r) === 'pdf'; })) {
      if (n >= 2 && A.pdfMerge) items.push({ a: 'pmerge', i: 'fa-object-group', t: L('ادمجْها في ملفٍّ واحد…', 'Merge into one file…') });
      if (n === 1 && A.pdfSplit) items.push({ a: 'psplit', i: 'fa-scissors', t: L('قسِّمْه إلى ملفّات…', 'Split into files…') });
    }
    if (n === 1) items.push({ a: 'props', i: 'fa-circle-info', t: L('الخصائص', 'Properties'), kb: 'Alt ⏎' });
    items.push({ sep: 1 });
    items.push({ a: 'trash', i: 'fa-trash', t: L('إلى السلّة', 'To trash'), dz: 1, kb: 'Del' });
    GM().rich(x, y, { head: head, quick: quick, items: items }, function (act) {
      if (act === 'open') openItem(it);
      else if (act === 'share') A.share(uid);
      else if (act === 'dup') A.dup(ids);
      else if (act === 'move') A.move(ids);
      else if (act === 'export') A.exportIds(ids);
      else if (act === 'pmerge') A.pdfMerge(ids);
      else if (act === 'psplit') A.pdfSplit(ids[0]);
      else if (act === 'pin' || act === 'unpin') A.pin(ids, act === 'pin');
      else if (act === 'arch' || act === 'unarch') A.archive(ids, act === 'arch');
      else if (act === 'copy' || act === 'cut') A.act(act, uid);
      else if (act === 'paste') A.paste();
      else if (act === 'props') propsOpen(it);
      else if (act === 'course' && A.linkCourse) A.linkCourse(ids);
      else if (act === 'trash') A.trash(ids);
    }, MOPT);
  }
  /*@3.NOEJ3.29*/
  function lessonMenu(x, y, uid) {
    var p0 = pickedSet();
    if (!p0[uid]) { A.setPicked({}); paint(); }
    var ids = pickedList();
    if (!ids.length) ids = [uid];
    var it = itemOf(uid);
    if (!it) return;
    var k = kindOf(it);
    GM().rich(x, y, {
      head: { ico: kindIcon(k), tone: it.origin && it.origin.course ? A.tone(it.origin.course) : '', t: it.title || L('بلا عنوان', 'Untitled'),
              s: [kindName(k), it.origin && it.origin.label ? it.origin.label : ''].filter(Boolean).join(' · ') },
      quick: [{ a: 'open', i: 'fa-arrow-up-right-from-square', t: k === 'quick' ? L('افتحْها', 'Open') : L('في درسها', 'In its lesson') },
              { a: 'export', i: 'fa-file-export', t: ids.length > 1 ? L('صدِّرِ المحدَّد', 'Export selected') : L('صدِّرْ', 'Export') }],
      items: [{ h: L('تُعدَّل وتُحذف من صفحتها — والمستكشفُ يعرضها ويصدّرها.', 'Edit or delete it on its own page — the explorer shows and exports it.') }]
    }, function (act) {
      if (act === 'open') openItem(it);
      else if (act === 'export') A.exportIds(ids);
    }, MOPT);
  }
  function folderMenu(x, y, fid, el) {
    var name = el ? (el.querySelector('.nx-fold-n, .nx-place-n') || el).textContent : '';
    var cnt = el ? (el.querySelector('.nx-fold-c, .nx-place-c') || {}).textContent || '' : '';
    var canPaste = A.canPaste && A.canPaste();
    var cItems = A.folderCourseItems ? A.folderCourseItems(fid) : [];
    GM().rich(x, y, {
      head: { ico: 'fa-folder', t: name, s: L('مجلّد · ', 'Folder · ') + cnt },
      quick: [{ a: 'fopen', i: 'fa-folder-open', t: L('افتحْ', 'Open') }, { a: 'fnew', i: 'fa-folder-plus', t: L('بداخله', 'Inside') },
              { a: 'frename', i: 'fa-i-cursor', t: L('سمِّ', 'Rename') }, { a: 'fpaste', i: 'fa-paste', t: L('ألصِقْ', 'Paste'), off: !canPaste, why: canPaste ? '' : L('لا شيءَ في الحافظة', 'The clipboard is empty') }],
      items: [
        { a: 'g:ord', i: 'fa-sort', t: L('رتِّبْ بين إخوته', 'Order among siblings'), sub: [
          { a: 'fup', i: 'fa-arrow-up', t: L('إلى أعلى', 'Move up'), off: !A.folderSib(fid, -1) },
          { a: 'fdown', i: 'fa-arrow-down', t: L('إلى أسفل', 'Move down'), off: !A.folderSib(fid, 1) }] },
        { a: 'frename', i: 'fa-pen', t: L('أعِدْ تسميتَه أو انقلْه…', 'Rename or move…') }].concat(cItems, [
        { sep: 1 },
        { a: 'fdel', i: 'fa-trash', t: L('احذفِ المجلّد…', 'Delete folder…'), dz: 1 }])
    }, function (act) { A.folderAct(act, fid); }, MOPT);
  }

  /*@3.NOEJ3.31*/
  function courseMenu(x, y, code, el) {
    var name = el ? (el.querySelector('.nx-fold-n') || el).textContent : A.courseLabel(code);
    var cnt = el ? (el.querySelector('.nx-fold-c') || {}).textContent || '' : '';
    var arch = A.courseArchived(code);
    GM().rich(x, y, {
      head: { ico: 'fa-graduation-cap', tone: A.tone(code), t: name, s: L('مادّة · ', 'Course · ') + cnt },
      items: [
        { a: 'open', i: 'fa-folder-open', t: L('افتحْ', 'Open') },
        { a: 'mods', i: 'fa-layer-group', t: L('اقترحْ وحداتِ ملفّاتها…', 'Suggest modules for its files…') },
        { sep: 1 },
        arch ? { a: 'unarch', i: 'fa-box-archive', t: L('أعِدْها إلى «المواد»', 'Back to Courses') }
             : { a: 'arch', i: 'fa-box-archive', t: L('أرشِفْ المادّة', 'Archive course'), why: L('تختفي من «المواد» وتبقى ملاحظاتُها في «الأرشيف»', 'Leaves Courses; its notes stay in Archive') }
      ]
    }, function (act) {
      if (act === 'open') A.setView({ k: 'course', code: code });
      else if (act === 'mods' && A.courseMods) A.courseMods(code);
      else if (act === 'arch') A.courseArch(code, true);
      else if (act === 'unarch') A.courseArch(code, false);
    }, MOPT);
  }

  /*@3.NOEJ3.7*/
  function spaceMenu(x, y) {
    var trash = A.view().k === 'trash', cs = A.crumbs(), here = cs.length ? cs[cs.length - 1].label : '';
    var canPaste = A.canPaste && A.canPaste();
    var model = { head: { ico: trash ? 'fa-trash-can' : 'fa-folder-open', t: here, s: nItems(lastList.length) } };
    if (trash) {
      model.items = [{ a: 'empty', i: 'fa-trash', t: L('أفرغِ السلّة…', 'Empty trash…'), dz: 1, off: !lastList.length }];
    } else {
      model.quick = [{ a: 'nnote', i: 'fa-note-sticky', t: L('ملاحظة', 'Note') }, { a: 'c:board', i: 'fa-pen-ruler', t: L('لوحُ رسم', 'Board') }];
      if (A.canFolder()) model.quick.push({ a: 'nfolder', i: 'fa-folder-plus', t: L('مجلّد', 'Folder') });
      model.quick.push({ a: 'import', i: 'fa-file-import', t: L('استوردْ', 'Import') });
      model.items = [
        { a: 'g:imp', i: 'fa-file-import', t: L('استوردْ من…', 'Import from…'), sub: importItems() },
        { a: 'paste', i: 'fa-paste', t: L('ألصِقْ هنا', 'Paste here'), kb: 'Ctrl V', off: !canPaste, why: canPaste ? '' : L('لا شيءَ في الحافظة', 'The clipboard is empty') }
      ];
      var vc = A.view();
      if (vc.k === 'course' && A.courseMods) model.items.push({ a: 'cmods', i: 'fa-layer-group', t: L('اقترحْ وحداتِ ملفّاتها…', 'Suggest modules for its files…') });
      if (vc.k === 'course' && A.courseArch) {
        model.items.push(A.courseArchived(vc.code)
          ? { a: 'cunarch', i: 'fa-box-archive', t: L('أعِدْ المادّةَ إلى «المواد»', 'Move course back to Courses') }
          : { a: 'carch', i: 'fa-box-archive', t: L('أرشِفْ هذه المادّة', 'Archive this course') });
      }
    }
    model.items.push({ sep: 1 });
    model.items.push({ a: 'sort', i: 'fa-arrow-down-wide-short', t: L('رتِّبْ حسب…', 'Sort by…') });
    model.items.push({ a: 'vm', i: vmOf() === 'grid' ? 'fa-list' : 'fa-table-cells-large', t: vmOf() === 'grid' ? L('اعرضْ تفاصيل', 'Show details') : L('اعرضْ شبكة', 'Show grid') });
    GM().rich(x, y, model, doSpaceAct, MOPT);
  }

  function onClick(e) {
    if (ate) { ate = 0; e.preventDefault(); return; }
    if (A.slidesClick && A.slidesClick(e)) return;
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
      case 'legend': legendPop(x); return;
      case 'why': whyPop(x); return;
      case 'newmenu': newMenu(x); return;
      case 'side': if (A.sections) A.sections(); return;
      case 'nnote': A.newNote(); return;
      case 'nfolder': A.newFolder(); return;
      case 'nfolder-root': if (A.view().k !== 'home') A.setView({ k: 'home' }); A.newFolder(); return;
      case 'back': if (A.back) A.back(); return;
      case 'iopen': if (it) openItem(itemOf(it.getAttribute('data-uid'))); return;
      case 'ishare': if (it) A.share(it.getAttribute('data-uid')); return;
      case 'imore':
        if (it) { var p = at(x); if (A.view().k === 'trash') trashMenu(p.x, p.y, it.getAttribute('data-uid')); else itemMenu(p.x, p.y, it.getAttribute('data-uid')); }
        return;
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
      case 'fkeepus': keepGo(fPicked(), 'us'); return;
      case 'fkeepgd': keepGo(fPicked(), 'gd'); return;
      /*@3.NOEJ3.25*/
      case 'backup': backGo(); return;
      case 'tnzip': case 'tngd':
        if (A.view().k !== 'space') A.setView({ k: 'space' });
        setTimeout(function () { if (x.getAttribute('data-x') === 'tngd') gdBackGo(); else backGo(); }, 350);
        return;
      case 'rpick': restPick(); return;
      case 'backgd': gdBackGo(); return;
      case 'rgdlist': gdListGo(); return;
      case 'rgdpick': gdPickGo(x); return;
      case 'gdauto': if (A.gdAutoSet) A.gdAutoSet(x.checked).then(backPaint, backPaint); return;
      case 'rgo': restGo(); return;
      case 'rcancel': BACK = { run: 0, msg: '', k: '', i: 0, n: 0 }; backPaint(); return;
      case 'keep': if (SPACE) keepGo(SPACE.files.filter(function (f) { return f.dev && !f.us && !f.gd && !f.tr; }), x.getAttribute('data-to') === 'gd' ? 'gd' : 'us'); return;
      case 'kstop': KEEP.stop = 1; keepPaint(); return;
      case 'kover': keepGo(keepBigOver().fit.map(function (x) { return x.f; }), 'us', true); return;
      case 'kbig': keepGo(keepBigOver().big.slice(0, 1).map(function (x) { return x.f; }), 'us', false, true); return;
      case 'kbiggd': keepGo((KEEP.big || []).map(function (x) { return x.f; }), 'gd'); return;
      case 'ferase': fErase(fPicked()); return;
      case 'clean': if (A.spaceClean) cleanGo(x); return;
      case 'import': pickFiles(); return;
      case 'empty': A.emptyTrash(); return;
      case 'unpick': clear(); return;
      case 'pickall': selectAll(); return;
      case 'open': openItem(itemOf(ids[0])); return;
      case 'move': A.move(ids); return;
      case 'export': A.exportIds(ids); return;
      case 'pmerge': A.pdfMerge(ids); return;
      case 'psplit': A.pdfSplit(ids[0]); return;
      case 'arch': A.archive(ids, true); return;
      case 'unarch': A.archive(ids, false); return;
      case 'trash': A.trash(ids); return;
      case 'restore': A.restore(ids); return;
      case 'purge': A.purge(ids); return;
      case 'pick':
        /*@3.NOEJ3.27*/
        if (it && e.shiftKey && anchor) { e.preventDefault(); range(it.getAttribute('data-uid')); return; }
        if (it) toggle(it.getAttribute('data-uid'));
        return;
    }
    if (!it) return;
    var uid = it.getAttribute('data-uid'), n = itemOf(uid);
    if (!n) return;
    if (e.shiftKey && anchor) { e.preventDefault(); range(uid); return; }
    if (e.ctrlKey || e.metaKey || ids.length) { e.preventDefault(); toggle(uid); return; }
    if (A.view().k === 'trash') { toggle(uid); return; }
    anchor = uid;
    openItem(n);
  }

  function onKey(e) {
    var it = e.target.closest && e.target.closest('.nx-it');
    var ids = pickedList();
    if (A.view().k === 'space') {
      var fr = e.target.closest && e.target.closest('.nx-frow[data-fk]');
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA')) { e.preventDefault(); fAll(); return; }
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
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA')) {
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
    if (e.key === 'Enter' && e.altKey) { e.preventDefault(); if (itemOf(uid) && itemOf(uid).src === 'rich') propsOpen(itemOf(uid)); return; }
    if (e.key === 'Enter') { e.preventDefault(); openItem(itemOf(uid)); return; }
    if (e.key === ' ') { e.preventDefault(); if (itemOf(uid)) toggle(uid); return; }
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault();
      var r = it.getBoundingClientRect();
      if (itemOf(uid)) (itemOf(uid).src !== 'rich' ? lessonMenu : A.view().k === 'trash' ? trashMenu : itemMenu)(A.isAr() ? r.right - 12 : r.left + 12, r.top + 24, uid);
      return;
    }
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
    if (!host || !host.isConnected || e.defaultPrevented || !host.getClientRects().length) return;
    var t = e.target;
    if (t && host.contains(t)) return;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
    if (t && t.closest && t.closest('dialog[open], .na-ctx')) return;
    if (document.querySelector('dialog[open]')) return;
    if (t && t !== document.body && t !== document.documentElement &&
        /*@3.NOEJ3.28*/
        !((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA') && t.closest && t.closest('button, a, [role="button"], [tabindex]'))) return;
    onKey(e);
  }

  function pickFiles() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.multiple = true;
    inp.accept = '.pdf,application/pdf,.ppt,.pptx,.pps,.ppsx,.pot,.potx,.odp,.doc,.docx,.dot,.dotx,.odt,.rtf,.xls,.xlsx,.ods,audio/*,video/*,.m4a,.mp3,.wav,.aac,.ogg,.opus,.webm,.flac,.md,.markdown,.txt,.json';
    inp.style.display = 'none';
    inp.addEventListener('change', function () {
      var fs = inp.files ? Array.prototype.slice.call(inp.files) : [];
      inp.remove();
      if (fs.length) A.bulk(fs);
    });
    document.body.appendChild(inp);
    inp.click();
  }

  function railV(el) {
    var v = null;
    try { v = JSON.parse(el.getAttribute('data-v')); } catch (e) {}
    return v;
  }
  /*@3.NOEJ3.22*/
  function placeMenu(x, y, el) {
    var v = railV(el);
    if (!v) return;
    if (v.k === 'folder') { folderMenu(x, y, v.id, el); return; }
    var nm = (el.querySelector('.nx-place-n') || el).textContent;
    var items = [{ a: 'open', i: 'fa-folder-open', t: L('افتحْ', 'Open') }];
    if (v.k === 'home' && A.canFolder()) items.push({ a: 'nfolder', i: 'fa-folder-plus', t: L('مجلّدٌ جديد', 'New folder') });
    if (v.k === 'trash') items.push({ sep: 1 }, { a: 'empty', i: 'fa-trash', t: L('أفرغِ السلّة…', 'Empty trash…'), dz: 1 });
    var i0 = el.querySelector('i'), icn = i0 ? (String(i0.className).match(/fa-[a-z0-9-]+/g) || ['fa-folder']).pop() : 'fa-folder';
    GM().rich(x, y, { head: { ico: icn, t: nm }, items: items }, function (act) {
      if (act === 'open') A.setView(v);
      else if (act === 'nfolder') { A.setView({ k: 'home' }); A.newFolder(); }
      else if (act === 'empty') A.emptyTrash();
    }, MOPT);
  }

  function onCtx(e) {
    /*@3.NOEJ3.23*/
    var pl = e.target.closest('.nx-place[data-v]');
    if (pl) { e.preventDefault(); placeMenu(e.clientX, e.clientY, pl); return; }
    var frc = e.target.closest('.nx-frow[data-fk]');
    if (frc) { e.preventDefault(); fileMenu(e.clientX, e.clientY, frc.getAttribute('data-fk')); return; }
    var it = e.target.closest('.nx-it');
    var fo = !it && e.target.closest('.nx-fold[data-id]');
    if (fo) { e.preventDefault(); folderMenu(e.clientX, e.clientY, fo.getAttribute('data-id'), fo); return; }
    var fc = !it && A.courseArch && e.target.closest('.nx-fold[data-course]');
    if (fc) { e.preventDefault(); courseMenu(e.clientX, e.clientY, fc.getAttribute('data-course'), fc); return; }
    if (!it && e.target.closest('.nx-scroll') && !e.target.closest('.nx-fold, button, a')) {
      e.preventDefault();
      spaceMenu(e.clientX, e.clientY);
      return;
    }
    if (!it) return;
    e.preventDefault();
    var uid = it.getAttribute('data-uid');
    if (it.getAttribute('data-ro')) { lessonMenu(e.clientX, e.clientY, uid); return; }
    if (A.view().k === 'trash') trashMenu(e.clientX, e.clientY, uid);
    else itemMenu(e.clientX, e.clientY, uid);
  }

  var D = null, DRAG_PX = 6;

  function folderIdOf(el) {
    if (!el) return null;
    if (el.classList.contains('nx-fold')) return el.getAttribute('data-id');
    var v = railV(el);
    return v && v.k === 'folder' ? v.id : null;
  }
  /*@3.NOEJ3.21*/
  function fdropAt(x, y, fid) {
    var el = document.elementFromPoint(x, y);
    var t = el && el.closest && el.closest('.nx-fold[data-id], .nx-place[data-v], .nx-crumb-b');
    if (!t || !host.contains(t)) return null;
    var id = folderIdOf(t);
    if (!id) {
      var v = railV(t);
      return v && v.k === 'home' ? { el: t, ref: null, where: 'root', cls: 'nx-drop' } : null;
    }
    if (id === fid) return null;
    var r = t.getBoundingClientRect(), f;
    if (t.classList.contains('nx-place')) f = (y - r.top) / (r.height || 1);
    else {
      f = (x - r.left) / (r.width || 1);
      if (getComputedStyle(t).direction === 'rtl') f = 1 - f;
    }
    var where = f < .28 ? 'before' : (f > .72 ? 'after' : 'into');
    return { el: t, ref: id, where: where, cls: where === 'into' ? 'nx-drop' : 'nx-drop-' + (where === 'before' ? 'b' : 'a') };
  }

  function dropAt(x, y) {
    var el = document.elementFromPoint(x, y);
    var t = el && el.closest && el.closest('.nx-fold, .nx-crumb-b');
    if (!t || !host.contains(t)) return null;
    if (t.classList.contains('nx-fold')) return t.getAttribute('data-id') ? { el: t, fid: t.getAttribute('data-id') } : null;
    var v = null;
    try { v = JSON.parse(t.getAttribute('data-v')); } catch (e) {}
    if (v && v.k === 'folder') return { el: t, fid: v.id };
    if (v && (v.k === 'recent' || v.k === 'home')) return { el: t, fid: null };
    return null;
  }
  function dragEnd(commit) {
    if (!D) return;
    var d = D; D = null;
    try { d.it.releasePointerCapture(d.pid); } catch (e) {}
    if (d.ghost) d.ghost.remove();
    host.removeAttribute('data-drag');
    var old = host.querySelectorAll('.nx-drop, .nx-drop-b, .nx-drop-a');
    for (var i = 0; i < old.length; i++) old[i].classList.remove('nx-drop', 'nx-drop-b', 'nx-drop-a');
    if (!d.on) return;
    ate = 1;
    setTimeout(function () { ate = 0; }, 0);
    if (commit && d.to && d.fid) { if (A.folderPlace) A.folderPlace(d.fid, d.to.ref, d.to.where); return; }
    if (commit && d.to) A.moveTo(d.uids, d.to.fid);
  }

  function onDown(e) {
    if (e.pointerType !== 'touch') {
      if (e.button !== 0 || A.view().k === 'trash') return;
      var fe = e.target.closest('.nx-fold[data-id], .nx-place[data-v]'), ff = fe && folderIdOf(fe);
      if (ff) { D = { fid: ff, it: fe, x: e.clientX, y: e.clientY, pid: e.pointerId, on: false, to: null }; return; }
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
    if (!it || it.getAttribute('data-ro') || e.target.closest('.nx-more, .nx-st')) return;
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
        host.setAttribute('data-drag', '1');
        D.ghost = document.createElement('div');
        D.ghost.className = 'nx-ghost';
        if (D.fid) D.ghost.textContent = (D.it.querySelector('.nx-fold-n, .nx-place-n') || D.it).textContent;
        else {
          var sel = pickedList();
          D.uids = sel.indexOf(D.uid) > -1 ? sel : [D.uid];
          var first = itemOf(D.uid);
          D.ghost.textContent = D.uids.length > 1 ? String(D.uids.length) : ((first && first.title) || '');
        }
        document.body.appendChild(D.ghost);
      }
      e.preventDefault();
      D.ghost.style.left = '0';
      D.ghost.style.transform = 'translate(' + (e.clientX + 12) + 'px,' + (e.clientY + 12) + 'px)';
      var to = D.fid ? fdropAt(e.clientX, e.clientY, D.fid) : dropAt(e.clientX, e.clientY);
      if (to && !to.cls) to.cls = 'nx-drop';
      if ((to && to.el) !== (D.to && D.to.el) || (to && D.to && to.cls !== D.to.cls)) {
        if (D.to) D.to.el.classList.remove('nx-drop', 'nx-drop-b', 'nx-drop-a');
        if (to) to.el.classList.add(to.cls);
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
    spaceStale: function () { SPACE = null; STAT = {}; if (A && A.statusStale) A.statusStale(); paint(); },
    active: function () { return !!(host && host.isConnected); },
    kind: { of: kindOf, name: kindName, icon: kindIcon, size: fmtSize, count: nItems },
    selectAll: function () { if (host && host.isConnected) selectAll(); }
  };
})();
