/*@3.MYRJ.1*/
;(function () {
  'use strict';

  var API = (window.GardenEndpoints && (GardenEndpoints.publicData || GardenEndpoints.sync)) || '';
  var CODE_RE = /^[A-Z]{2,4}[0-9]{2,4}$/;

  var state = { rows: null, loading: true, err: false };

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function t(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  var D = function () { return window.GardenData; };
  function info(code) {
    var d = D();
    return (d && d.courseInfo && d.courseInfo(code)) || null;
  }
  function nameOf(code) {
    var i = info(code);
    if (!i) return code;
    return isAr() ? (i.name_ar || code) : (i.name_en || i.name_ar || code);
  }
  function iconOf(code) {
    var i = info(code);
    return (i && i.icon) || 'fa-solid fa-book';
  }
  function tint(code) {
    var i = info(code);
    return (i && i.brand_color) ? ' style="--tint:' + esc(i.brand_color) + '"' : '';
  }

  function CR() { return window.GardenCourseRate; }
  function identity() { var c = CR(); return c ? c.identity() : {}; }
  function synced() { return !!identity().vault_id; }
  function ratingsOn() {
    var F = window.GardenFlags;
    return !F || F.get('ratings.course.enabled') !== false;
  }

  function post(sub, body) {
    return fetch(API + sub, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); });
  }

  function load() {
    if (!API) { state.loading = false; state.err = true; draw(); return Promise.resolve(); }
    state.loading = true;
    draw();
    return post('/v1/courses/rate/list', identity()).then(function (x) {
      state.loading = false;
      if (x.s !== 200 || !x.j || !x.j.ok) { state.err = true; state.rows = []; }
      else { state.err = false; state.rows = x.j.rows || []; }
      draw();
    }).catch(function () {
      state.loading = false; state.err = true; state.rows = [];
      draw();
    });
  }

  /*@3.MYRJ.2*/
  function candidates() {
    var d = D();
    if (!d) return [];
    var seen = {}, out = [];
    function push(code, kind) {
      var c = String(code || '').toUpperCase();
      if (!CODE_RE.test(c) || seen[c]) return;
      seen[c] = 1;
      out.push({ code: c, kind: kind });
    }
    try {
      var done = d.completedCourses() || {};
      Object.keys(done).forEach(function (c) { push(c, 'done'); });
    } catch (e) { }
    try {
      var sem = d.semester();
      ((sem && sem.courses) || []).forEach(function (c) {
        push(c && c.code, (d.courseDone && d.courseDone(c)) ? 'done' : 'now');
      });
    } catch (e) { }
    return out;
  }

  function ratedSet() {
    var m = {};
    (state.rows || []).forEach(function (r) { m[String(r.code).toUpperCase()] = r; });
    return m;
  }

  function termLabel(term) {
    var s = String(term || '');
    if (!/^[0-9]{5,6}$/.test(s)) return s;
    var year = s.slice(0, 4), n = s.slice(4, 5);
    var AR = { '1': 'الأول', '2': 'الثاني', '3': 'الثالث' };
    return isAr()
      ? 'الفصل ' + (AR[n] || n) + ' · ' + year
      : 'Term ' + n + ' · ' + year;
  }

  function ago(iso) {
    var ms = Date.now() - new Date(iso).getTime();
    if (!isFinite(ms) || ms < 0) return '';
    var day = 86400000;
    if (ms < day) return t('اليوم', 'today');
    var dd = Math.floor(ms / day);
    if (dd < 30) return t('قبل ' + dd + ' يوماً', dd + 'd ago');
    var mm = Math.floor(dd / 30);
    return t('قبل ' + mm + ' شهراً', mm + 'mo ago');
  }

  /*@3.MYRJ.3*/
  function idNote() {
    var box = $('mr-id');
    if (!box) return;
    if (synced()) {
      box.className = 'mr-id is-ok';
      box.innerHTML = '<i class="fa-solid fa-shield-halved" aria-hidden="true"></i>' +
        '<p>' + esc(t(
          'مزامنتُك مفعّلة — تقييماتُك تتبعك على كلِّ جهازٍ تفتح فيه الخزنةَ نفسَها.',
          'Sync is on — your ratings follow you on any device with the same vault.')) + '</p>';
    } else {
      box.className = 'mr-id is-warn';
      box.innerHTML = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<p>' + esc(t(
          'لا مزامنةَ على هذا الجهاز. تقييماتُك تُحفظ وتُنشر كغيرها، ولكنّ تعديلَها وسحبَها مرتبطان بهذا المتصفّح وحدَه — امسحْ بياناتِه وتفقد المفتاح.',
          'No sync on this device. Your ratings are saved and published, but editing and withdrawing them work only in this browser — clear its data and you lose the key.')) +
        '</p><a class="mr-id-go" href="settings.html">' +
        esc(t('فعّلِ المزامنة', 'Turn on sync')) + '</a>';
    }
  }

  function todoCard(c, hasRating) {
    var pill = c.kind === 'done'
      ? '<span class="mr-pill is-done">' + esc(t('أنهيتَها', 'Finished')) + '</span>'
      : '<span class="mr-pill">' + esc(t('تدرسها الآن', 'In progress')) + '</span>';
    return '<article class="mr-todo"' + tint(c.code) + '>' +
      '<i class="mr-todo-i ' + esc(iconOf(c.code)) + '" aria-hidden="true"></i>' +
      '<div class="mr-todo-t">' +
        '<b class="mr-code">' + esc(c.code) + '</b>' +
        '<span class="mr-name">' + esc(nameOf(c.code)) + '</span>' +
      '</div>' + pill +
      '<button type="button" class="gsf-btn gsf-btn--go" data-rate="' + esc(c.code) + '">' +
        esc(hasRating ? t('عدّلْ', 'Edit') : t('قيّمها', 'Rate it')) +
      '</button>' +
    '</article>';
  }

  function excerpt(s, n) {
    var v = String(s || '').replace(/\s+/g, ' ').trim();
    return v.length > n ? v.slice(0, n - 1) + '…' : v;
  }

  function doneRow(r) {
    var body = r.explain || r.advice || '';
    var meta = [];
    if (r.difficulty) meta.push('<span class="mr-chip">' + esc(r.difficulty) + '</span>');
    if (r.term) meta.push('<span class="mr-meta-i">' + esc(termLabel(r.term)) + '</span>');
    if (r.verified) {
      meta.push('<span class="mr-meta-i" title="' +
        esc(t('المادةُ في سجلّك — ولذلك وزنُ تقييمك أعلى', 'In your record — your rating weighs more')) +
        '"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ' +
        esc(t('من سجلّك', 'From your record')) + '</span>');
    }
    if (r.has_grade) {
      meta.push('<span class="mr-meta-i" title="' +
        esc(t('درجتُك محفوظةٌ ولا تُعرض لأحد — حضورُها وحدَه رفع وزنَ تقييمك',
              'Your grade is stored and never shown — its presence alone raised your weight')) +
        '"><i class="fa-solid fa-lock" aria-hidden="true"></i> ' +
        esc(t('درجتُك محفوظة', 'Grade stored')) + '</span>');
    }
    if (r.res_n) {
      meta.push('<span class="mr-meta-i"><i class="fa-solid fa-link" aria-hidden="true"></i> ' +
        esc(r.res_n + ' ' + t('مصدراً', 'resources')) +
        (r.res_pending ? ' · <b class="mr-pend">' +
          esc(r.res_pending + ' ' + t('تنتظر المراجعة', 'awaiting review')) + '</b>' : '') +
        '</span>');
    }
    if (r.updated_at) meta.push('<span class="mr-meta-i">' + esc(ago(r.updated_at)) + '</span>');

    return '<article class="mr-row"' + tint(r.code) + '>' +
      '<header class="mr-row-h">' +
        '<i class="mr-row-i ' + esc(iconOf(r.code)) + '" aria-hidden="true"></i>' +
        '<div class="mr-row-t">' +
          '<b class="mr-code">' + esc(r.code) + '</b>' +
          '<span class="mr-name">' + esc(nameOf(r.code)) + '</span>' +
        '</div>' +
      '</header>' +
      (body ? '<p class="mr-quote">' + esc(excerpt(body, 220)) + '</p>' : '') +
      '<div class="mr-meta">' + meta.join('') + '</div>' +
      '<div class="mr-acts">' +
        '<button type="button" class="gsf-btn" data-rate="' + esc(r.code) + '">' +
          '<i class="fa-solid fa-pen" aria-hidden="true"></i> ' + esc(t('عدّلْ', 'Edit')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--danger" data-drop="' + esc(r.code) + '">' +
          '<i class="fa-solid fa-trash" aria-hidden="true"></i> ' + esc(t('اسحبْ', 'Withdraw')) + '</button>' +
      '</div>' +
    '</article>';
  }

  /*@3.MYRJ.4*/
  function pickerHtml() {
    var d = D();
    var list = (d && d.catalogList && d.catalogList()) || [];
    if (!list.length) return '';
    var rated = ratedSet();
    var opts = list.filter(function (c) { return c && c.code && CODE_RE.test(c.code); })
      .sort(function (a, b) { return a.code < b.code ? -1 : 1; })
      .map(function (c) {
        return '<option value="' + esc(c.code) + '">' + esc(c.code) + ' · ' +
          esc(isAr() ? (c.name_ar || c.code) : (c.name_en || c.code)) +
          (rated[c.code] ? ' ✓' : '') + '</option>';
      }).join('');
    return '<div class="mr-any">' +
      '<label class="mr-any-l" for="mr-pick">' +
        esc(t('أو قيّم أيَّ مادّةٍ أخرى درستَها', 'Or rate any other course you took')) + '</label>' +
      '<div class="mr-any-row">' +
        '<select class="gsf-in" data-gs id="mr-pick"><option value="">' +
          esc(t('اختر مادّة…', 'Choose a course…')) + '</option>' + opts + '</select>' +
        '<button type="button" class="gsf-btn gsf-btn--go" id="mr-pick-go">' +
          esc(t('افتحِ النموذج', 'Open the form')) + '</button>' +
      '</div>' +
    '</div>';
  }

  function draw() {
    idNote();
    var todo = $('mr-todo'), done = $('mr-done');
    if (!todo || !done) return;

    if (state.loading) {
      todo.innerHTML = '<p class="mr-load">' + esc(t('يُحمَّل…', 'Loading…')) + '</p>';
      done.innerHTML = '';
      return;
    }
    if (state.err) {
      todo.innerHTML = '<div class="mr-empty is-err">' +
        '<i class="fa-solid fa-plug-circle-xmark" aria-hidden="true"></i>' +
        '<p>' + esc(t('تعذّر الوصولُ إلى الخدمة. تقييماتُك سليمةٌ في مكانها — أعِد المحاولةَ بعد قليل.',
                      'Could not reach the service. Your ratings are safe — try again shortly.')) + '</p>' +
        '<button type="button" class="gsf-btn" id="mr-retry">' + esc(t('أعِدِ المحاولة', 'Retry')) + '</button>' +
      '</div>';
      done.innerHTML = '';
      return;
    }

    var rated = ratedSet();
    var open = ratingsOn();
    var pend = candidates().filter(function (c) { return !rated[c.code]; });

    var head = '<h2 class="mr-h">' + esc(t('مواد تنتظر رأيَك', 'Courses awaiting your take')) +
      (pend.length ? ' <span class="mr-n">' + pend.length + '</span>' : '') + '</h2>';

    /*@3.MYRJ.5*/
    if (!open) {
      todo.innerHTML = head +
        '<div class="mr-empty"><i class="fa-solid fa-pause" aria-hidden="true"></i>' +
        '<p>' + esc(t('التقييمُ مغلقٌ مؤقّتاً. وما كتبتَه سابقاً يبقى لك — تراه وتسحبه في أيِّ وقت.',
                      'Rating is paused for now. What you already wrote stays yours — view or withdraw it any time.')) +
        '</p></div>';
    } else if (!pend.length) {
      todo.innerHTML = head +
        '<div class="mr-empty is-ok"><i class="fa-solid fa-circle-check" aria-hidden="true"></i>' +
        '<p>' + esc((state.rows || []).length
          ? t('قيّمتَ كلَّ ما في سجلّك. شكراً — زميلُك القادمُ سيقرأ ما كتبتَه.',
              'You rated everything in your record. Thank you — the next student will read it.')
          : t('لا مواد في سجلّك بعد. أضفْ موادَّك في «فصلي» ثمّ عُدْ، أو اختر مادّةً من القائمة أدناه.',
              'No courses in your record yet. Add them in “My semester”, or pick a course below.')) +
        '</p></div>' + pickerHtml();
    } else {
      todo.innerHTML = head +
        '<p class="mr-sec-sub">' + esc(t(
          'اضغطْ واحدةً بعد الأخرى — كلُّ نافذةٍ تُغلق فتجد التاليةَ أمامك.',
          'Tap them one after another — each dialog closes and the next is right there.')) + '</p>' +
        '<div class="mr-todos">' + pend.map(function (c) { return todoCard(c, false); }).join('') + '</div>' +
        pickerHtml();
    }

    var rows = state.rows || [];
    done.innerHTML = '<h2 class="mr-h">' + esc(t('ما كتبتَه', 'What you wrote')) +
      (rows.length ? ' <span class="mr-n">' + rows.length + '</span>' : '') + '</h2>' +
      (rows.length
        ? '<div class="mr-rows">' + rows.map(doneRow).join('') + '</div>'
        : '<div class="mr-empty"><i class="fa-regular fa-pen-to-square" aria-hidden="true"></i><p>' +
          esc(t('لم تكتب شيئاً بعد.', 'Nothing yet.')) + '</p></div>');

    if (window.GardenSelect && GardenSelect.enhance) GardenSelect.enhance(todo);
  }

  function openFor(code) {
    var c = CR();
    if (!c) return;
    c.open({ code: code, name: nameOf(code), onSaved: load });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rate],[data-drop],#mr-retry,#mr-pick-go');
    if (!b) return;
    if (b.id === 'mr-retry') { load(); return; }
    if (b.id === 'mr-pick-go') {
      var sel = $('mr-pick');
      if (sel && sel.value) openFor(sel.value);
      return;
    }
    var rate = b.getAttribute('data-rate');
    if (rate) { openFor(rate); return; }
    var drop = b.getAttribute('data-drop');
    if (drop) {
      if (!confirm(t('يُحذف تقييمُك لـ' + drop + ' نهائياً. متابعة؟',
                     'Your rating for ' + drop + ' will be deleted. Continue?'))) return;
      b.disabled = true;
      /*@3.MYRJ.6*/
      CR().withdraw(drop).then(function (ok) {
        b.disabled = false;
        if (!ok) { alert(t('تعذّر السحب. جرّب لاحقاً.', 'Could not withdraw. Try later.')); return; }
        load();
      });
    }
  });

  document.addEventListener('garden:languageChanged', function () { draw(); });

  function boot() {
    var d = D();
    var go = function () { load(); };
    if (d && d.ready) d.ready().then(go, go);
    else go();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
