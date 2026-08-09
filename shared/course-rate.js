/*@3.CORJ.1*/
;(function () {
  'use strict';
  if (window.GardenCourseRate) return;

  var API = (window.GardenEndpoints && (GardenEndpoints.publicData || GardenEndpoints.sync)) || '';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function t(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /*@3.CORJ.2*/
  var TOK_KEY = 'gd_crate_tok';
  function localToken() {
    var v = '';
    try { v = localStorage.getItem(TOK_KEY) || ''; } catch (e) { }
    if (/^[A-Za-z0-9_-]{20,80}$/.test(v)) return v;
    var a = new Uint8Array(24);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a)
      : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); });
    v = btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    try { localStorage.setItem(TOK_KEY, v); } catch (e) { }
    return v;
  }
  function identity() {
    var out = {};
    try {
      var k = window.GardenSync && GardenSync.getKey && GardenSync.getKey();
      if (k && /^v[0-9a-f]{32}$/.test(k)) { out.vault_id = k; return out; }
    } catch (e) { }
    out.local_token = localToken();
    return out;
  }
  function synced() { return !!identity().vault_id; }

  function post(sub, body) {
    return fetch(API + sub, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); });
  }

  /*@3.CORJ.3*/
  var TERM_AR = { First: 'الفصل الأول', Second: 'الفصل الثاني', Third: 'الفصل الثالث', Summer: 'الصيفي' };
  function termLabel(x) {
    var d = String(x.description || '');
    var m = d.match(/(First|Secon(?:d)?|Third|Summer)\s*Term\s*(\d{4})\s*-\s*(\d{4})/i);
    if (!m) return x.term;
    var kind = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    if (kind === 'Secon') kind = 'Second';
    return (isAr() ? TERM_AR[kind] : kind + ' Term') + ' · ' + m[2] + '–' + m[3];
  }
  function fallbackTerms() {
    var y = new Date().getFullYear(), out = [];
    for (var i = 0; i < 3; i++) {
      for (var s = 3; s >= 1; s--) {
        out.push({ term: String(y - i) + s + '0',
                   label: t('الفصل ', 'Term ') + s + ' · ' + (y - i) });
      }
    }
    return out;
  }
  var _terms = null;
  function loadTerms() {
    if (_terms) return Promise.resolve(_terms);
    return fetch(API + '/v1/terms', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var ts = (j && (j.terms || j.rows)) || [];
        _terms = ts.length
          ? ts.map(function (x) { return { term: x.term, label: termLabel(x) }; })
          : fallbackTerms();
        return _terms;
      })
      .catch(function () { _terms = fallbackTerms(); return _terms; });
  }

  /*@3.CORJ.4*/
  var _opts = null;
  function loadOpts() {
    if (_opts) return Promise.resolve(_opts);
    return fetch(API + '/v1/courses/opts', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (!j || !j.ok) throw new Error('opts'); _opts = j; return j; });
  }

  /*@3.CORJ.5*/
  var EN = {
    'سهلة جدا': 'Very easy', 'سهلة': 'Easy', 'متوسطة': 'Moderate', 'صعبة': 'Hard', 'صعبة جدا': 'Very hard',
    '<2': '< 2 h', '2-4': '2–4 h', '5-8': '5–8 h', '9-12': '9–12 h', '>12': '> 12 h',
    'اول باول': 'Keep up weekly', 'اسبوعيا': 'Weekly is enough', 'مكثفة قبل الاختبار': 'Cram before exams',
    'يتوزع بانتظام': 'Evenly spread', 'يتكدس قليلا': 'Slightly bunched', 'يتكدس قبل الاختبارات': 'Bunched before exams',
    'النهائي يحسمها': 'Final decides', 'الاعمال والتسليمات': 'Coursework', 'الكويزات المتكررة': 'Frequent quizzes', 'موزعة بعدل': 'Evenly weighted',
    'من الشرائح': 'From slides', 'من الكتاب': 'From the book', 'بنك اسئلة متكرر': 'Recurring bank', 'جديدة كل فصل': 'New each term', 'لا اعرف': "Don't know",
    'اسهل': 'Easier', 'مثلها': 'Same', 'اصعب': 'Harder',
    'فهم وتحليل': 'Understanding', 'حفظ واستظهار': 'Memorization', 'تطبيق وبرمجة': 'Coding', 'حسابات ورياضيات': 'Math',
    'مشاريع وتسليمات': 'Projects', 'مفاهيم جديدة تحتاج وقتا': 'New concepts', 'قراءة كثيرة': 'Heavy reading',
    'اختيار من متعدد': 'Multiple choice', 'صح وخطا': 'True/False', 'مسائل حسابية': 'Calculations',
    'كتابة كود': 'Write code', 'تتبع مخرجات': 'Trace output', 'تحليل ومقالي': 'Essay',
    'حل اسئلة سابقة': 'Past papers', 'تلخيص الشرائح': 'Summarizing', 'شروحات مرئية': 'Video explainers',
    'تطبيق عملي': 'Hands-on', 'مجموعة دراسة': 'Study group', 'قراءة الكتاب': 'Reading the book', 'حل التمارين مرتين': 'Exercises twice',
    'فيديو': 'Video', 'كتاب': 'Book', 'موقع': 'Site', 'ملخص': 'Summary', 'قناة': 'Channel'
  };
  function lbl(v) { return isAr() ? v : (EN[v] || v); }

  /*@3.CORJ.6*/
  function chips(name, list, multi, cur) {
    var sel = multi ? (cur || []) : (cur ? [cur] : []);
    return '<div class="crx-chips" data-f="' + esc(name) + '" data-multi="' + (multi ? '1' : '') + '">' +
      list.map(function (v) {
        var on = sel.indexOf(v) >= 0;
        return '<button type="button" class="crx-chip' + (on ? ' on' : '') + '" ' +
          'data-v="' + esc(v) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
          esc(lbl(v)) + '</button>';
      }).join('') + '</div>';
  }

  function field(label, inner, hint, req) {
    return '<div class="crx-f">' +
      '<label class="crx-l">' + esc(label) +
        (req ? '<span class="crx-req" title="' + esc(t('إلزاميّ', 'Required')) + '"><i class="fa-solid fa-asterisk" aria-hidden="true"></i></span>' : '') +
      '</label>' +
      (hint ? '<p class="crx-hint">' + hint + '</p>' : '') + inner + '</div>';
  }
  function sec(title, body, note) {
    return '<section class="crx-sec"><h3 class="crx-h">' + esc(title) + '</h3>' +
      (note ? '<p class="crx-note">' + note + '</p>' : '') + body + '</section>';
  }

  /*@3.CORJ.7*/
  var dlg = null, ctx = null, state = null;

  function ensureDlg() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'crx';
    /*@3.CORJ.8*/
    dlg.setAttribute('data-keep-open', '');
    dlg.innerHTML =
      '<form method="dialog" class="crx-x"><button class="crx-close" aria-label="' +
        esc(t('إغلاق', 'Close')) + '">✕</button></form>' +
      '<div class="crx-body"></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('click', onClick);
    /*@3.CORJ.9*/
    dlg.addEventListener('cancel', function (e) {
      if (state && state.dirty && !confirm(t('تُغلق بلا حفظ؟', 'Close without saving?'))) e.preventDefault();
    });
    return dlg;
  }

  function open(o) {
    o = o || {};
    if (!API) { alert(t('الخدمةُ غير متاحة الآن.', 'Service unavailable.')); return; }
    ctx = { code: String(o.code || '').toUpperCase(), name: o.name || o.code, term: o.term || '',
            instructor: o.instructor || '', onSaved: o.onSaved };
    state = { dirty: false, vals: {}, res: [], existing: null };
    var d = ensureDlg();
    d.querySelector('.crx-body').innerHTML = '<p class="crx-load">' + esc(t('يُحمَّل…', 'Loading…')) + '</p>';
    if (!d.open) d.showModal();

    Promise.all([loadOpts(), loadTerms(), post('/v1/courses/rate/mine',
      Object.assign({ course_code: ctx.code }, identity()))])
      .then(function (r) {
        var mine = r[2] && r[2].j && r[2].j.rating;
        state.existing = mine || null;
        if (mine) {
          state.vals = {
            term: mine.term, difficulty: mine.difficulty, weekly_hours: mine.weekly_hours,
            study_rhythm: mine.study_rhythm, load_shape: mine.load_shape, nature: mine.nature || [],
            grade_weight: mine.grade_weight, q_style: mine.q_style || [], q_source: mine.q_source,
            q_vs_ex: mine.q_vs_ex, helped: mine.helped || [], grade: mine.grade,
            instructor: mine.instructor, took_it: mine.took_it,
            advice: mine.advice, explain: mine.explain,
          };
          state.res = (mine.resources || []).map(function (x) {
            return { title: x.title, url: x.url, kind: x.kind, why: x.why };
          });
        } else {
          state.vals = { term: ctx.term || '', nature: [], q_style: [], helped: [],
                         instructor: ctx.instructor || '' };
        }
        render(r[0], r[1]);
      })
      .catch(function () {
        d.querySelector('.crx-body').innerHTML =
          '<p class="crx-err">' + esc(t('تعذّر التحميل. جرّب لاحقاً.', 'Could not load. Try later.')) + '</p>';
      });
  }

  function render(opts, terms) {
    var v = state.vals, O = opts.one, M = opts.multi;
    var body =
      '<header class="crx-head">' +
        '<h2>' + esc(t('كيف هي المادة؟', 'How is this course?')) + '</h2>' +
        '<p class="crx-sub"><span class="crx-code">' + esc(ctx.code) + '</span> ' + esc(ctx.name) + '</p>' +
        (state.existing
          ? '<p class="crx-edit">' + esc(t('تعدّل تقييمَك السابق — ويمكنك سحبُه في أيِّ وقت.',
              'Editing your earlier rating — you can withdraw it any time.')) + '</p>'
          : '') +
      '</header>' +

      sec(t('أساسيات', 'Basics'),
        field(t('الفصل الذي درستَها فيه', 'Term you took it'),
          '<select class="crx-in" data-f="term">' +
            '<option value="">' + esc(t('اختر…', 'Choose…')) + '</option>' +
            terms.map(function (x) {
              return '<option value="' + esc(x.term) + '"' +
                (v.term === x.term ? ' selected' : '') + '>' + esc(x.label) + '</option>';
            }).join('') + '</select>',
          t('به تشيخ التقييمات — فرأيُ فصلٍ مضى لا يُقرأ كرأي هذا الفصل.',
            'Ratings age by term — an old term is not read as today.'), true) +

        field(t('الدكتور (اختياريّ)', 'Instructor (optional)'),
          '<input class="crx-in" type="text" data-f="instructor" maxlength="120" value="' +
            esc(v.instructor || '') + '" placeholder="' + esc(t('اسمُ من درّسك', 'Who taught you')) + '">',
          /*@3.CORJ.10*/
          t('<i class="fa-solid fa-lock" aria-hidden="true"></i> <b>لا يدخل مؤشّرَ الصعوبة إطلاقاً.</b> «صعبةٌ مع فلان» ليست صعوبةَ مادّة — وللأساتذة صفحتُهم.',
            '<i class="fa-solid fa-lock" aria-hidden="true"></i> <b>Never affects the difficulty score.</b> Instructors have their own page.')) +

        field(t('أنهيتَها؟', 'Finished it?'),
          chips('took_it', ['نعم', 'لا زلت فيها'], false,
            v.took_it === true ? 'نعم' : v.took_it === false ? 'لا زلت فيها' : null)) +

        field(t('درجتُك (اختياريّة)', 'Your grade (optional)'),
          chips('grade', O.grade, false, v.grade),
          /*@3.CORJ.11*/
          t('<i class="fa-solid fa-lock" aria-hidden="true"></i> <b>تُخزَّن ولا تُعرض أبداً — لا لك ولا لغيرك.</b> حضورُها وحدَه يرفع وزنَ تقييمك، وقيمتُها لا تُقرأ ولا تُجمَّع.',
            '<i class="fa-solid fa-lock" aria-hidden="true"></i> <b>Stored, never shown.</b> Its presence raises your weight; its value is never read.'))) +

      sec(t('الصعوبة والعبء', 'Difficulty & load'),
        field(t('الصعوبة', 'Difficulty'), chips('difficulty', O.difficulty, false, v.difficulty), '', true) +
        field(t('ساعاتٌ أسبوعياً خارج المحاضرة', 'Weekly hours outside class'),
          chips('weekly_hours', O.weekly_hours, false, v.weekly_hours)) +
        field(t('إيقاعُ المذاكرة', 'Study rhythm'),
          chips('study_rhythm', O.study_rhythm, false, v.study_rhythm),
          t('أنفعُ سؤالٍ هنا: <b>توزُّعُ</b> العبء يقول عن الصعوبة أكثرَ من <b>مجموع</b> الساعات.',
            'The most useful question: how work is <b>spread</b> matters more than total hours.')) +
        field(t('تكدُّسُ العبء', 'Load shape'), chips('load_shape', O.load_shape, false, v.load_shape))) +

      sec(t('طبيعةُ المادة', 'Nature'),
        field(t('اختر حتى ثلاثة', 'Pick up to three'),
          chips('nature', M.nature.opts, true, v.nature))) +

      sec(t('الاختبارات والدرجة', 'Exams & grading'),
        field(t('أين تكمن الدرجة', 'Where the grade sits'),
          chips('grade_weight', O.grade_weight, false, v.grade_weight)) +
        field(t('نمطُ الأسئلة', 'Question style'), chips('q_style', M.q_style.opts, true, v.q_style)) +
        field(t('مصدرُ الأسئلة', 'Question source'), chips('q_source', O.q_source, false, v.q_source)) +
        field(t('صعوبتُها مقارنةً بالتمارين', 'Versus the exercises'),
          chips('q_vs_ex', O.q_vs_ex, false, v.q_vs_ex))) +

      sec(t('كيف تُذاكَر', 'How to study it'),
        field(t('أنفعُ ما فعلتَ', 'What helped most'), chips('helped', M.helped.opts, true, v.helped)) +
        field(t('نصيحةٌ لمن سيأخذها', 'Advice for the next student'),
          '<textarea class="crx-in crx-ta" data-f="advice" rows="3" maxlength="300">' +
            esc(v.advice || '') + '</textarea>')) +

      sec(t('اشرح المادةَ بكلماتك', 'Explain it in your words'),
        field(t('ما هذه المادةُ فعلاً؟', 'What is this course really?'),
          '<textarea class="crx-in crx-ta" data-f="explain" rows="4" maxlength="500">' +
            esc(v.explain || '') + '</textarea>',
          t('أوّلُ ما يقرؤه زميلُك.', 'The first thing your classmate reads.'))) +

      sec(t('مصادرُ التعلّم', 'Learning resources'),
        '<div class="crx-res"></div>' +
        '<button type="button" class="crx-addres">+ ' + esc(t('أضف مصدراً', 'Add a resource')) + '</button>',
        t('يوتيوب يظهر مباشرةً، وما عداه ينتظر مراجعةً قبل أن يراه غيرُك.',
          'YouTube appears immediately; other links await review.')) +

      '<footer class="crx-foot">' +
        '<p class="crx-msg" aria-live="polite"></p>' +
        (synced() ? '' :
          '<p class="crx-warn">' + esc(t(
            'لا مزامنةَ على هذا الجهاز — تقييمُك يُحفظ، ولكنّ تعديلَه لاحقاً مرتبطٌ بهذا المتصفّح وحدَه.',
            'No sync on this device — your rating saves, but editing it later works only in this browser.')) +
          '</p>') +
        '<div class="crx-acts">' +
          (state.existing
            ? '<button type="button" class="crx-btn crx-btn--danger" data-a="withdraw">' +
                esc(t('اسحبْ تقييمي', 'Withdraw')) + '</button>' : '') +
          '<button type="button" class="crx-btn crx-btn--go" data-a="save">' +
            esc(state.existing ? t('احفظِ التعديل', 'Save changes') : t('أرسلْ تقييمي', 'Send')) +
          '</button>' +
        '</div>' +
      '</footer>';

    dlg.querySelector('.crx-body').innerHTML = body;
    drawRes();
  }

  /*@3.CORJ.12*/
  function drawRes() {
    var box = dlg.querySelector('.crx-res');
    if (!box) return;
    box.innerHTML = state.res.map(function (r, i) {
      return '<div class="crx-r" data-i="' + i + '">' +
        '<input class="crx-in" type="url" data-rf="url" placeholder="https://…" value="' + esc(r.url || '') + '">' +
        '<input class="crx-in" type="text" data-rf="title" maxlength="120" placeholder="' +
          esc(t('العنوان', 'Title')) + '" value="' + esc(r.title || '') + '">' +
        '<select class="crx-in" data-rf="kind">' +
          (_opts.resKind || []).map(function (k) {
            return '<option value="' + esc(k) + '"' + (r.kind === k ? ' selected' : '') + '>' + esc(lbl(k)) + '</option>';
          }).join('') + '</select>' +
        '<input class="crx-in" type="text" data-rf="why" maxlength="160" placeholder="' +
          esc(t('لماذا نفعك؟', 'Why it helped')) + '" value="' + esc(r.why || '') + '">' +
        '<button type="button" class="crx-rdel" data-a="delres">✕</button>' +
        '</div>';
    }).join('');
    var add = dlg.querySelector('.crx-addres');
    /*@3.CORJ.13*/
    if (add) add.hidden = state.res.length >= 3;
  }

  /*@3.CORJ.14*/
  function onClick(e) {
    var chip = e.target.closest && e.target.closest('.crx-chip');
    if (chip) { toggleChip(chip); return; }
    var b = e.target.closest && e.target.closest('[data-a]');
    if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'delres') {
      state.res.splice(Number(b.closest('.crx-r').getAttribute('data-i')), 1);
      state.dirty = true; drawRes(); return;
    }
    if (a === 'save') { save(b); return; }
    if (a === 'withdraw') { withdraw(b); return; }
  }

  function toggleChip(chip) {
    var box = chip.parentNode, f = box.getAttribute('data-f'), multi = !!box.getAttribute('data-multi');
    var on = chip.classList.contains('on');
    if (!multi) {
      /*@3.CORJ.15*/
      [].forEach.call(box.children, function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
      if (!on) { chip.classList.add('on'); chip.setAttribute('aria-pressed', 'true'); }
    } else {
      var max = (_opts.multi[f] || {}).max || 99;
      var n = box.querySelectorAll('.crx-chip.on').length;
      if (!on && n >= max) { flash(t('حتى ' + max + ' خيارات', 'Up to ' + max)); return; }
      chip.classList.toggle('on', !on);
      chip.setAttribute('aria-pressed', on ? 'false' : 'true');
    }
    state.dirty = true;
  }

  function readChips(f) {
    var box = dlg.querySelector('.crx-chips[data-f="' + f + '"]');
    if (!box) return null;
    var on = [].map.call(box.querySelectorAll('.crx-chip.on'), function (c) { return c.getAttribute('data-v'); });
    return box.getAttribute('data-multi') ? on : (on[0] || null);
  }
  function readIn(f) {
    var el = dlg.querySelector('[data-f="' + f + '"]');
    return el && el.value != null ? String(el.value).trim() : '';
  }
  function flash(msg, bad) {
    var m = dlg.querySelector('.crx-msg');
    if (!m) return;
    m.textContent = msg;
    m.className = 'crx-msg' + (bad ? ' is-err' : '');
  }

  function collect() {
    var b = Object.assign({ course_code: ctx.code }, identity());
    b.term = readIn('term');
    b.instructor = readIn('instructor') || null;
    b.advice = readIn('advice') || null;
    b.explain = readIn('explain') || null;
    b.difficulty = readChips('difficulty');
    ['weekly_hours', 'study_rhythm', 'load_shape', 'grade_weight', 'q_source', 'q_vs_ex', 'grade']
      .forEach(function (f) { b[f] = readChips(f); });
    ['nature', 'q_style', 'helped'].forEach(function (f) { b[f] = readChips(f) || []; });
    var tk = readChips('took_it');
    b.took_it = tk === 'نعم' ? true : tk === 'لا زلت فيها' ? false : null;

    /*@3.CORJ.16*/
    b.resources = [].map.call(dlg.querySelectorAll('.crx-r'), function (row) {
      var g = function (k) { var el = row.querySelector('[data-rf="' + k + '"]'); return el ? el.value.trim() : ''; };
      return { url: g('url'), title: g('title'), kind: g('kind'), why: g('why') };
    }).filter(function (r) { return r.url; });

    /*@3.CORJ.17*/
    try {
      var mine = JSON.parse(localStorage.getItem('my_semester') || 'null');
      var list = (mine && (mine.courses || mine)) || [];
      b.verified = Array.isArray(list) && list.some(function (c) {
        return String((c && (c.code || c.course_code)) || c).toUpperCase() === ctx.code;
      });
    } catch (e) { b.verified = false; }
    return b;
  }

  var FIELD_AR = {
    bad_term: 'اختر الفصل', bad_difficulty: 'اختر الصعوبة', bad_code: 'رمزُ المادة',
    bad_resource: 'رابطُ مصدرٍ غيرُ صالح (يجب أن يبدأ بـhttps)',
  };

  function save(btn) {
    var b = collect();
    /*@3.CORJ.18*/
    if (!b.term) { flash(t('اختر الفصلَ أوّلاً — وهو إلزاميّ.', 'Choose the term first.'), true); return; }
    if (!b.difficulty) { flash(t('اختر الصعوبة — وهي إلزاميّة.', 'Choose the difficulty.'), true); return; }

    btn.disabled = true;
    flash(t('يُرسَل…', 'Sending…'));
    post('/v1/courses/rate', b).then(function (x) {
      btn.disabled = false;
      if (x.s === 403) { flash(t('التقييمُ مغلقٌ حالياً.', 'Ratings are closed right now.'), true); return; }
      if (x.s === 429) { flash(t('أرسلتَ كثيراً اليوم — جرّب لاحقاً.', 'Too many today — try later.'), true); return; }
      if (x.s !== 200) {
        var f = (x.j && x.j.fields) || [];
        flash(f.length ? (FIELD_AR[f[0]] || t('راجعِ الحقولَ المميّزة', 'Check the fields')) + ''
                       : t('تعذّر الإرسال.', 'Could not send.'), true);
        return;
      }
      state.dirty = false;
      var pend = x.j.pending_links;
      flash(t('شكراً — حُفظ رأيُك.', 'Thanks — saved.') +
        (pend ? ' ' + t('و' + pend + ' رابطاً ينتظر المراجعة.', pend + ' link(s) awaiting review.') : ''));
      if (ctx.onSaved) { try { ctx.onSaved(); } catch (e) { } }
      setTimeout(function () { if (dlg.open) dlg.close(); }, 1200);
    }).catch(function () {
      btn.disabled = false;
      flash(t('تعذّر الاتصال.', 'Connection failed.'), true);
    });
  }

  function withdrawCode(code) {
    return post('/v1/courses/rate/withdraw',
      Object.assign({ course_code: String(code || '').toUpperCase() }, identity()))
      .then(function (x) { return x.s === 200 && !!(x.j && x.j.ok); })
      .catch(function () { return false; });
  }

  function withdraw(btn) {
    if (!confirm(t('يُحذف تقييمُك نهائياً. متابعة؟', 'Your rating will be deleted. Continue?'))) return;
    btn.disabled = true;
    withdrawCode(ctx.code).then(function (ok) {
      btn.disabled = false;
      if (!ok) { flash(t('تعذّر السحب.', 'Could not withdraw.'), true); return; }
      state.dirty = false;
      flash(t('سُحب تقييمُك.', 'Withdrawn.'));
      if (ctx.onSaved) { try { ctx.onSaved(); } catch (e) { } }
      setTimeout(function () { if (dlg.open) dlg.close(); }, 900);
    });
  }

  /*@3.CORJ.19*/
  document.addEventListener('input', function (e) {
    if (state && dlg && dlg.contains(e.target)) state.dirty = true;
  }, true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.crx-addres');
    if (!b || !state) return;
    if (state.res.length >= 3) return;
    state.res.push({ url: '', title: '', kind: (_opts.resKind || [''])[0], why: '' });
    state.dirty = true;
    drawRes();
  });

  window.GardenCourseRate = {
    open: open, identity: identity, synced: synced, withdraw: withdrawCode,
  };
})();
