;(function () {
  'use strict';

  var QB = window.GardenQuizBank;
  var K = { prefs: 'garden_quiz_prefs', run: 'garden_quiz_run', hist: 'garden_quiz_hist', stats: 'garden_quiz_stats' };
  var HIST_CAP = 40;
  var thisScript = document.currentScript;
  var ROOT = (thisScript && thisScript.src) ? thisScript.src.replace(/shared\/quiz\.js(\?.*)?$/, '') : '../';

  function isAr() { try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; } catch (e) { return true; } }
  function L() { return isAr() ? 'ar' : 'en'; }
  function t(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rich(s) {
    var G = window.GardenText;
    return G && G.html ? G.html(s) : esc(s);
  }
  function $(id) { return document.getElementById(id); }
  function get(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function drop(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function num(n) { return '<span class="qz-n">' + esc(n) + '</span>'; }
  function code(c) { return '<span class="gsf-code">' + esc(c) + '</span>'; }
  function clock(sec) {
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h ? h + ':' + QB.pad2(m) : m) + ':' + QB.pad2(s);
  }
  function plural(n, one, two, few, many) { return n === 1 ? one : n === 2 ? two : (n >= 3 && n <= 10) ? few : many; }
  function qWord(n) { return isAr() ? plural(n, 'سؤالٌ', 'سؤالان', 'أسئلة', 'سؤالاً') : (n === 1 ? 'question' : 'questions'); }
  function typeset(el) { try { if (window.GardenMath && GardenMath.typeset) GardenMath.typeset(el); } catch (e) {} }

  var KIND = {
    mcq: { ar: 'اختيارٌ متعدّد', en: 'Multiple choice', icon: 'fa-list-ul' },
    tf: { ar: 'صحٌّ وخطأ', en: 'True or false', icon: 'fa-circle-half-stroke' },
    match: { ar: 'توصيلُ المصطلحات', en: 'Match the terms', icon: 'fa-link' },
    essay: { ar: 'مقاليّ', en: 'Essay', icon: 'fa-pen-nib' }
  };
  var DIFF = {
    easy: { ar: 'سهل', en: 'Easy', tone: 1 },
    medium: { ar: 'متوسّط', en: 'Medium', tone: 3 },
    hard: { ar: 'صعب', en: 'Hard', tone: 5 }
  };
  var STYLE = {
    recall: { ar: 'تذكّر', en: 'Recall' },
    concept: { ar: 'مفهوم', en: 'Concept' },
    application: { ar: 'تطبيق', en: 'Application' },
    analysis: { ar: 'تحليل', en: 'Analysis' },
    trap: { ar: 'فخّ', en: 'Trap' }
  };
  var SOURCE = {
    all: { ar: 'كلُّ الأسئلة', en: 'All questions' },
    unseen: { ar: 'لم أرها بعد', en: 'Not seen yet' },
    due: { ar: 'حان موعدُ مراجعته', en: 'Due for review' },
    wrong: { ar: 'أخطائي', en: 'My mistakes' },
    flag: { ar: 'ما علّمتُه', en: 'Bookmarked' }
  };
  var DEF = {
    codes: [], scope: {}, modules: {}, types: ['mcq', 'tf'], count: 20,
    diffs: ['easy', 'medium', 'hard'], styles: [], source: 'all',
    mode: 'practice', timer: 'none', minutes: 0, perSec: 45,
    smart: true, order: 'module', hints: true, src: 'bank', fresh: false
  };

  var S = {
    view: 'setup', cfg: null, course: {}, cards: {}, index: {}, cardIndex: {},
    run: null, tick: null, review: 'wrong', adv: false
  };

  function D() { return window.GardenData; }
  function info(c) { var d = D(); return (d && d.courseInfo) ? d.courseInfo(c) : null; }
  function cname(c) {
    var i = info(c);
    if (!i) return c;
    return isAr() ? (i.name_ar || i.name_en || c) : (i.name_en || i.name_ar || c);
  }
  function hasBank(c) { var i = info(c); return !!(i && i.path && i.available !== false); }
  function myCodes() {
    var d = D(), sem = null;
    try { sem = d && d.semester ? d.semester() : null; } catch (e) { sem = null; }
    var out = [];
    ((sem && sem.courses) || []).forEach(function (c) {
      var k = c && String(c.code || '').toUpperCase();
      if (k && hasBank(k) && out.indexOf(k) < 0) out.push(k);
    });
    return out;
  }

  function stats() { return get(K.stats, {}); }
  function bump(key, ok, sure) { var st = stats(); QB.record(st, key, ok, sure); put(K.stats, st); }
  function setFlag(key, on) { var st = stats(); QB.flagIt(st, key, on); put(K.stats, st); }
  function isFlagged(key) { var s = stats()[key]; return !!(s && s[4]); }

  var SRC = {
    bank: { ar: 'بنكُ المادّة', en: 'Course bank', sar: 'أسئلةُ المراجعة والكويز', sen: 'Review and quiz questions', icon: 'fa-database' },
    module: { ar: 'أسئلةُ الوحدات', en: 'Module quizzes', sar: 'اختبارُ كلِّ وحدةٍ في صفحتها', sen: 'Each module page’s own quiz', icon: 'fa-list-check' }
  };
  function srcs() { var s = S.cfg.src; return s === 'module' ? ['module'] : s === 'both' ? ['bank', 'module'] : ['bank']; }
  function scopeOf(c) { return S.cfg.scope[c] || 'both'; }
  function course(c) { return S.course[c] || null; }
  function idxOf(c) { return (S.idx && S.idx.courses && S.idx.courses[c]) || null; }
  function allMods(c) {
    var k = course(c);
    if (k && k.mods.length) return k.mods.map(function (m) { return m.n; });
    var x = idxOf(c), n = x ? x.n : 0, out = [];
    for (var i = 1; i <= n; i++) out.push(i);
    return out;
  }
  function midEnd(c) {
    var k = course(c), x = idxOf(c);
    return (k && k.midEnd) || (x && x.mid) || Math.max(1, Math.floor(allMods(c).length / 2));
  }
  function modulesOf(c) {
    var sc = scopeOf(c), e = midEnd(c);
    return allMods(c).filter(function (m) { return sc === 'mid' ? m <= e : sc === 'fin' ? m > e : true; });
  }
  function modTitle(c, m) {
    var k = course(c), x = null;
    if (k) k.mods.forEach(function (y) { if (y.n === m) x = y; });
    return x ? (isAr() ? x.ar || x.en : x.en || x.ar) : '';
  }
  function modLabel(c, m, withCode) {
    var tt = modTitle(c, m);
    return (withCode ? code(c) + ' · ' : '') + t('الوحدة ', 'Module ') + num(m) + (tt ? ' · <span class="qz-mt" dir="auto">' + esc(tt) + '</span>' : '');
  }
  function getJSON(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function loadIndex() {
    if (S.idxP) return S.idxP;
    S.idxP = getJSON(ROOT + 'data/quiz/index.json').then(function (j) { S.idx = j; }).catch(function () { S.idx = { courses: {} }; S.idxP = null; });
    return S.idxP;
  }
  function loadCourse(c) {
    var k = S.course[c];
    if (k && (k.status === 'ok' || k.status === 'loading')) return k.p;
    k = S.course[c] = { status: 'loading', mods: [], midEnd: 0, bank: [], module: [], cards: [], essays: null };
    k.p = getJSON(ROOT + 'data/quiz/' + encodeURIComponent(c) + '.json').then(function (j) {
      var x = QB.inflate(j);
      k.mods = x.mods; k.midEnd = x.midEnd; k.bank = x.bank; k.module = x.module; k.cards = x.cards;
      x.bank.concat(x.module).forEach(function (q) { S.index[q.key] = q; });
      x.cards.forEach(function (cd) { S.cardIndex[cd.key] = cd; });
      k.status = 'ok';
    }).catch(function () { k.status = navigator.onLine === false ? 'offline' : 'err'; });
    return k.p;
  }
  function loadEssays(c) {
    var k = S.course[c];
    if (!k || k.status !== 'ok') return Promise.resolve();
    if (k.essays && k.essays.status !== 'err') return k.essays.p;
    var e = k.essays = { status: 'loading', list: [] };
    e.p = getJSON(ROOT + 'data/quiz/' + encodeURIComponent(c) + '.essays.json').then(function (j) {
      e.list = QB.inflateEssays(j);
      e.list.forEach(function (q) { S.index[q.key] = q; });
      e.status = 'ok';
    }).catch(function () { e.status = 'err'; });
    return e.p;
  }
  function wantsEssays() { return S.cfg.types.indexOf('essay') >= 0; }
  function bankState(c) {
    var k = course(c);
    if (!k) return 'loading';
    if (k.status !== 'ok') return k.status;
    if (wantsEssays() && (!k.essays || k.essays.status === 'loading')) return 'loading';
    return 'ok';
  }
  function catReady() { var d = D(); return d && d.ready ? d.ready() : Promise.resolve(); }
  function ensureBanks() { return Promise.all([catReady(), loadIndex()]).then(ensureBanksNow); }
  function ensureBanksNow() {
    S.cfg.codes = S.cfg.codes.filter(hasBank);
    return Promise.all(S.cfg.codes.map(function (c) {
      return loadCourse(c).then(function () { return wantsEssays() ? loadEssays(c) : null; });
    }));
  }
  function poolOf(c) {
    var k = course(c);
    if (!k || k.status !== 'ok') return [];
    var s = srcs();
    if (s.length === 1) return k[s[0]];
    return QB.dedupe(k.bank.concat(k.module));
  }
  function pool() {
    var out = [];
    S.cfg.codes.forEach(function (c) { out = out.concat(poolOf(c)); });
    return out;
  }
  function essayPool() {
    if (!wantsEssays()) return null;
    var out = [];
    S.cfg.codes.forEach(function (c) { var k = course(c); if (k && k.essays && k.essays.status === 'ok') out = out.concat(k.essays.list); });
    return out;
  }
  function modCount(c, m) {
    var n = 0;
    poolOf(c).forEach(function (q) { if (q.module === m) n++; });
    if (wantsEssays()) { var k = course(c); if (k && k.essays && k.essays.status === 'ok') k.essays.list.forEach(function (q) { if (q.module === m) n++; }); }
    return n;
  }
  function modMastery(c, m) {
    var st = stats(), seen = 0, ok = 0, n = 0;
    poolOf(c).forEach(function (q) {
      if (q.module !== m) return;
      n++;
      var s = st[q.key];
      if (s && s[0]) { seen++; if (s[2] === 1) ok++; }
    });
    return { n: n, seen: seen, ok: ok };
  }
  function wantedModules() {
    var out = [];
    S.cfg.codes.forEach(function (c) {
      var sel = S.cfg.modules[c];
      ((sel && sel.length) ? sel : modulesOf(c)).forEach(function (m) { out.push([c, m]); });
    });
    return out;
  }
  function cardPool() {
    var out = [];
    S.cfg.codes.forEach(function (c) { var k = course(c); if (k && k.status === 'ok') out = out.concat(k.cards); });
    return out;
  }

  function saveCfg() { put(K.prefs, S.cfg); }
  function loadCfg() {
    var c = get(K.prefs, null);
    var cfg = JSON.parse(JSON.stringify(DEF));
    if (c && typeof c === 'object') Object.keys(DEF).forEach(function (k) { if (c[k] != null) cfg[k] = c[k]; });
    cfg.codes = (cfg.codes || []).filter(function (c) { return /^[A-Z]{2,5}[0-9]{2,4}$/.test(c); });
    return cfg;
  }

  function show(view) {
    S.view = view;
    ['setup', 'run', 'result'].forEach(function (v) { $('qz-' + v).hidden = v !== view; });
    document.body.classList.toggle('qz-running', view === 'run');
    window.scrollTo(0, 0);
  }

  function renderSetup() {
    var el = $('qz-setup');
    el.innerHTML =
      '<div class="qz-head">' +
        '<h1>' + t('الاختبارُ المخصّص', 'Custom Test') + '</h1>' +
        '<p class="qz-sub">' + t('اخترْ موادَّك ووحداتِها وشكلَ الأسئلة ووقتَها، أو ابدأ من قالبٍ جاهز. الأسئلةُ من اختبارات الوحدات كلِّها وبنوك المراجعة، بالعربيّة والإنجليزيّة.',
          'Pick your courses, modules, question format and time, or start from a ready template. Questions come from every module quiz and the review banks, in Arabic and English.') + '</p>' +
      '</div>' +
      '<div id="qz-resume"></div>' +
      '<div class="qz-presets" id="qz-presets"></div>' +
      '<div class="qz-grid">' +
        '<div class="qz-cards">' +
          '<section class="gsf-card qz-card" id="qz-c-course"></section>' +
          '<section class="gsf-card qz-card" id="qz-c-shape"></section>' +
          '<section class="gsf-card qz-card" id="qz-c-time"></section>' +
          '<section class="gsf-card qz-card" id="qz-c-adv"></section>' +
        '</div>' +
        '<aside class="qz-sum" id="qz-sum" aria-live="polite"></aside>' +
      '</div>' +
      '<section class="qz-hist" id="qz-hist"></section>';
    renderResume();
    renderPresets();
    renderCourse();
    renderShape();
    renderTime();
    renderAdv();
    renderSummary();
    renderHist();
  }

  function chip(attrs, on, label, tone) {
    return '<button type="button" class="gsf-chip' + (on ? ' on' : '') + '"' + (tone ? ' data-tone="' + tone + '"' : '') +
      ' aria-pressed="' + (on ? 'true' : 'false') + '" ' + attrs + '>' + label + '</button>';
  }
  function cardHead(icon, ar, en, extra) {
    return '<h2 class="gsf-card-h"><i class="fa-solid ' + icon + '" aria-hidden="true"></i><span>' + t(ar, en) + '</span>' + (extra || '') + '</h2>';
  }

  function renderResume() {
    var el = $('qz-resume'); if (!el) return;
    var r = get(K.run, null);
    if (!r || !r.items || !r.items.length || r.done) { el.innerHTML = ''; return; }
    var done = (r.answers || []).filter(function (a) { return a != null; }).length;
    el.innerHTML = '<div class="qz-resume">' +
      '<i class="fa-solid fa-hourglass-half" aria-hidden="true"></i>' +
      '<p><b>' + t('لديك اختبارٌ لم يكتمل', 'You have an unfinished test') + '</b> · ' +
        t('أجبتَ عن ' + done + ' من ' + r.items.length, done + ' of ' + r.items.length + ' answered') + ' · ' + r.cfg.codes.map(code).join(' ') + '</p>' +
      '<div class="gsf-acts"><button type="button" class="gsf-btn gsf-btn--go" data-act="resume">' + t('أكمِلْه', 'Continue') + '</button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost" data-act="discard">' + t('تجاهَلْه', 'Discard') + '</button></div></div>';
  }

  var PRESETS = [
    { id: 'quick', icon: 'fa-bolt', ar: 'سريع', en: 'Quick', sar: '10 أسئلة · تصحيحٌ فوريّ', sen: '10 questions · instant feedback',
      set: { count: 10, types: ['mcq', 'tf'], mode: 'practice', timer: 'none', source: 'all', diffs: ['easy', 'medium', 'hard'], styles: [] } },
    { id: 'mid', icon: 'fa-graduation-cap', ar: 'محاكاةُ منتصف الفصل', en: 'Midterm simulation', sar: '40 سؤالاً · 50 دقيقة', sen: '40 questions · 50 min',
      set: { count: 40, types: ['mcq'], mode: 'exam', timer: 'total', minutes: 50, source: 'all', diffs: ['easy', 'medium', 'hard'], styles: [] }, scope: 'mid' },
    { id: 'fin', icon: 'fa-award', ar: 'محاكاةُ النهائيّ', en: 'Final simulation', sar: '50 سؤالاً · 70 دقيقة', sen: '50 questions · 70 min',
      set: { count: 50, types: ['mcq'], mode: 'exam', timer: 'total', minutes: 70, source: 'all', diffs: ['easy', 'medium', 'hard'], styles: [] }, scope: 'both' },
    { id: 'wrong', icon: 'fa-bandage', ar: 'أخطائي', en: 'My mistakes', sar: 'ما أخطأتَه ولم تصحّحه', sen: 'What you missed and haven’t fixed',
      set: { count: 20, types: ['mcq', 'tf'], mode: 'practice', timer: 'none', source: 'wrong', diffs: ['easy', 'medium', 'hard'], styles: [] } },
    { id: 'tf', icon: 'fa-stopwatch', ar: 'صحٌّ وخطأ خاطف', en: 'True/false sprint', sar: '20 عبارة · 20 ثانيةً لكلّ', sen: '20 statements · 20s each',
      set: { count: 20, types: ['tf'], mode: 'practice', timer: 'per', perSec: 20, source: 'all', diffs: ['easy', 'medium', 'hard'], styles: [] } },
    { id: 'hard', icon: 'fa-fire', ar: 'الصعبُ وحدَه', en: 'Hard only', sar: 'الصعبُ والفخاخ', sen: 'Hard and trap questions',
      set: { count: 15, types: ['mcq'], mode: 'practice', timer: 'none', source: 'all', diffs: ['hard'], styles: [] } }
  ];
  function renderPresets() {
    $('qz-presets').innerHTML = PRESETS.map(function (p) {
      return '<button type="button" class="qz-preset" data-preset="' + p.id + '">' +
        '<i class="fa-solid ' + p.icon + '" aria-hidden="true"></i>' +
        '<b>' + t(p.ar, p.en) + '</b><small>' + t(p.sar, p.sen) + '</small></button>';
    }).join('');
  }
  function applyPreset(id) {
    var p = PRESETS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    Object.keys(p.set).forEach(function (k) { S.cfg[k] = JSON.parse(JSON.stringify(p.set[k])); });
    if (p.scope) S.cfg.codes.forEach(function (c) { S.cfg.scope[c] = p.scope; });
    S.cfg.modules = {};
    saveCfg();
    refreshAll();
    var sum = $('qz-sum');
    if (sum) { sum.classList.remove('qz-pulse'); void sum.offsetWidth; sum.classList.add('qz-pulse'); }
    if (!S.cfg.codes.length) openPicker();
  }

  function renderCourse() {
    var el = $('qz-c-course'); if (!el) return;
    var mine = myCodes();
    var list = mine.slice();
    S.cfg.codes.forEach(function (c) { if (list.indexOf(c) < 0) list.push(c); });
    var h = cardHead('fa-book-open', 'المادّةُ والنطاق', 'Course and scope');
    h += '<div class="gsf-chips qz-courses">' + list.map(function (c) {
      var on = S.cfg.codes.indexOf(c) >= 0;
      return chip('data-course="' + esc(c) + '" title="' + esc(cname(c)) + '"', on, '<span class="qz-code">' + esc(c) + '</span>');
    }).join('') +
      '<button type="button" class="gsf-chip qz-add" data-act="pick" aria-label="' + t('أضِفْ مادّة', 'Add a course') + '" data-ar-title="أضِفْ مادّة" data-en-title="Add a course"><i class="fa-solid fa-plus" aria-hidden="true"></i> ' + t('مادّةٌ أخرى', 'Another course') + '</button></div>';
    if (!S.cfg.codes.length) {
      h += '<p class="qz-note">' + (mine.length ? t('اخترْ مادّةً واحدةً على الأقلّ.', 'Choose at least one course.')
        : t('لم تُضِفْ موادَّ فصلك بعد — اخترْ من كلِّ الموادّ.', 'You haven’t added your semester courses yet — choose from all courses.')) + '</p>';
    }
    if (S.cfg.codes.length) {
      var tot = { bank: 0, module: 0 };
      S.cfg.codes.forEach(function (c) { var x = idxOf(c); if (x) { tot.bank += x.b; tot.module += x.q; } });
      var cur = S.cfg.src || 'bank';
      h += '<div class="qz-field"><span class="qz-lbl">' + t('مصدرُ الأسئلة', 'Question source') + '</span><div class="gsf-opts gsf-opts--3 gsf-opts--wrap qz-srcs">' +
        ['bank', 'module'].map(function (k) {
          return '<button type="button" class="gsf-opt" data-src="' + k + '" aria-pressed="' + (cur === k) + '"><i class="fa-solid ' + SRC[k].icon + '" aria-hidden="true"></i>' +
            '<span class="gsf-opt-t">' + t(SRC[k].ar, SRC[k].en) + ' <span class="qz-cnt">' + num(tot[k].toLocaleString('en')) + '</span></span><span class="gsf-opt-s">' + t(SRC[k].sar, SRC[k].sen) + '</span></button>';
        }).join('') +
        '<button type="button" class="gsf-opt" data-src="both" aria-pressed="' + (cur === 'both') + '"><i class="fa-solid fa-layer-group" aria-hidden="true"></i>' +
          '<span class="gsf-opt-t">' + t('كلاهما', 'Both') + '</span><span class="gsf-opt-s">' + t('بلا تكرارٍ بين المصدرين', 'No repeats across the two') + '</span></button>' +
        '</div></div>';
    }
    S.cfg.codes.forEach(function (c) {
      var sc = scopeOf(c);
      var st = bankState(c);
      var all = allMods(c), e = midEnd(c), n = all.length;
      var mods = modulesOf(c);
      var sel = S.cfg.modules[c] || [];
      var rng = function (a, b) { return a > b ? '' : ' <span class="qz-rng">' + num(a === b ? a : a + '–' + b) + '</span>'; };
      h += '<div class="qz-scope" data-scope-of="' + esc(c) + '">' +
        '<div class="qz-scope-h"><span class="qz-code">' + esc(c) + '</span><span class="qz-cname">' + esc(cname(c)) + '</span></div>' +
        '<div class="gsf-chips">' +
          chip('data-scope="mid" data-c="' + esc(c) + '"', sc === 'mid', t('منتصف الفصل', 'Midterm') + (n ? rng(1, e) : '')) +
          chip('data-scope="fin" data-c="' + esc(c) + '"', sc === 'fin', t('النهائيّ', 'Final') + (n ? rng(e + 1, all[n - 1]) : '')) +
          chip('data-scope="both" data-c="' + esc(c) + '"', sc === 'both', t('كلُّ الوحدات', 'All modules') + (n ? rng(all[0], all[n - 1]) : '')) +
        '</div>';
      if (st === 'loading') h += '<p class="qz-load"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ' + t('يجلب بنكَ المادّة…', 'Loading the course bank…') + '</p>';
      else if (st === 'offline') h += '<p class="qz-err">' + t('لا اتّصال — افتح هذه الصفحةَ مرّةً وأنت متّصل لتعمل المادّةُ بلا إنترنت.', 'You’re offline — open this page once while online to use this course offline.') + ' <button type="button" class="gsf-btn gsf-btn--sm" data-act="retry">' + t('أعِدِ المحاولة', 'Retry') + '</button></p>';
      else if (st === 'err') h += '<p class="qz-err">' + t('تعذّر جلبُ بنك هذه المادّة.', 'Couldn’t load this course’s bank.') + ' <button type="button" class="gsf-btn gsf-btn--sm" data-act="retry">' + t('أعِدِ المحاولة', 'Retry') + '</button></p>';
      else {
        var inScope = 0, seenAll = 0, poolN = 0;
        mods.forEach(function (m) { inScope += modCount(c, m); var mm = modMastery(c, m); seenAll += mm.seen; poolN += mm.n; });
        h += '<p class="qz-cover"><i class="fa-solid fa-layer-group" aria-hidden="true"></i> ' +
          num(mods.length) + ' ' + t(mods.length === 1 ? 'وحدة' : 'وحدات', mods.length === 1 ? 'module' : 'modules') + ' · ' + num(inScope.toLocaleString('en')) + ' ' + qWord(inScope) +
          (poolN ? ' · ' + t('رأيتَ ', 'seen ') + num(Math.round(seenAll / poolN * 100) + '٪') : '') + '</p>';
        if (mods.length > 1) {
          h += '<div class="qz-mods" role="group" aria-label="' + t('الوحدات', 'Modules') + '">' +
            '<button type="button" class="qz-mod qz-mod--all" data-mod="all" data-c="' + esc(c) + '" aria-pressed="' + (!sel.length ? 'true' : 'false') + '">' +
              '<span class="qz-mod-n"><i class="fa-solid fa-check-double" aria-hidden="true"></i></span><span class="qz-mod-t">' + t('كلُّ وحدات النطاق', 'Every module in scope') + '</span></button>' +
            mods.map(function (m) {
              var on = sel.indexOf(m) >= 0, cnt = modCount(c, m), tt = modTitle(c, m), mm = modMastery(c, m);
              var ps = mm.n ? mm.seen / mm.n : 0, po = mm.n ? mm.ok / mm.n : 0;
              var tip = t('رأيتَ ' + mm.seen + ' من ' + mm.n + ' وأصبتَ آخرَ مرّةٍ ' + mm.ok, 'Seen ' + mm.seen + ' of ' + mm.n + ', right last time ' + mm.ok);
              return '<button type="button" class="qz-mod" data-mod="' + m + '" data-c="' + esc(c) + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + (cnt ? '' : ' disabled') + ' title="' + esc(tt + ' — ' + tip) + '">' +
                '<span class="qz-mod-n">' + num(m) + '</span><span class="qz-mod-t" dir="auto">' + esc(tt || t('الوحدة ' + m, 'Module ' + m)) + '</span>' +
                '<span class="qz-mod-c">' + num(cnt) + '</span>' +
                '<span class="qz-mod-m" style="--s:' + ps.toFixed(3) + ';--o:' + po.toFixed(3) + '" aria-label="' + esc(tip) + '"></span></button>';
            }).join('') + '</div>' +
            '<p class="qz-legend"><span class="qz-lg qz-lg--o"></span>' + t('أصبتَه آخرَ مرّة', 'right last time') + '<span class="qz-lg qz-lg--s"></span>' + t('رأيتَه', 'seen') + '<span class="qz-lg"></span>' + t('لم تره بعد', 'not seen yet') + ' · ' + t('والرقمُ عددُ أسئلة الوحدة', 'the number is the module’s question count') + '</p>';
        }
      }
      h += '</div>';
    });
    el.innerHTML = h;
  }

  function renderShape() {
    var el = $('qz-c-shape'); if (!el) return;
    var h = cardHead('fa-shapes', 'شكلُ الأسئلة', 'Question format');
    h += '<div class="qz-field"><span class="qz-lbl">' + t('النوع', 'Type') + '</span><div class="gsf-chips">' +
      QB.TYPES.map(function (k) { return chip('data-type="' + k + '"', S.cfg.types.indexOf(k) >= 0, '<i class="fa-solid ' + KIND[k].icon + '" aria-hidden="true"></i> ' + t(KIND[k].ar, KIND[k].en)); }).join('') +
      '</div></div>';
    h += '<div class="qz-field"><span class="qz-lbl">' + t('الصعوبة', 'Difficulty') + '</span><div class="gsf-chips">' +
      QB.DIFFS.map(function (k) { return chip('data-diff="' + k + '"', S.cfg.diffs.indexOf(k) >= 0, t(DIFF[k].ar, DIFF[k].en), DIFF[k].tone); }).join('') +
      '</div></div>';
    h += '<div class="qz-field"><label class="qz-lbl" for="qz-count">' + t('عددُ الأسئلة', 'Number of questions') + '</label>' +
      '<div class="qz-count"><input type="range" id="qz-count" min="5" max="100" step="5" value="' + S.cfg.count + '">' +
      '<output id="qz-count-v" for="qz-count">' + num(S.cfg.count) + '</output></div>' +
      '<div class="gsf-chips qz-quick">' + [10, 20, 30, 50, 100].map(function (n) { return chip('data-count="' + n + '"', S.cfg.count === n, num(n)); }).join('') + '</div></div>';
    h += '<div class="qz-field"><span class="qz-lbl">' + t('ترتيبُ الأسئلة', 'Question order') + '</span><div class="gsf-chips">' +
      chip('data-order="module"', S.cfg.order !== 'random', '<i class="fa-solid fa-arrow-down-1-9" aria-hidden="true"></i> ' + t('بتسلسل الوحدات', 'Module by module')) +
      chip('data-order="random"', S.cfg.order === 'random', '<i class="fa-solid fa-shuffle" aria-hidden="true"></i> ' + t('عشوائيّ', 'Random')) +
      '</div><small class="qz-hint-s">' + (S.cfg.order === 'random' ? t('الوحداتُ مخلوطةٌ كما في اختبارٍ شامل.', 'Modules are mixed, as in a cumulative exam.') : t('الوحدةُ الأولى فالتي تليها، ومن السهل إلى الصعب داخل كلِّ وحدة.', 'First module first, easy to hard within each module.')) + '</small></div>';
    el.innerHTML = h;
  }

  function renderTime() {
    var el = $('qz-c-time'); if (!el) return;
    var c = S.cfg;
    var h = cardHead('fa-stopwatch', 'الوضعُ والوقت', 'Mode and time');
    h += '<div class="gsf-opts gsf-opts--2 qz-modes">' +
      '<button type="button" class="gsf-opt" data-mode="practice" aria-pressed="' + (c.mode === 'practice') + '"><i class="fa-solid fa-chalkboard-user" aria-hidden="true"></i><span class="gsf-opt-t">' + t('تدريب', 'Practice') + '</span><span class="gsf-opt-s">' + t('تصحيحٌ وشرحٌ بعد كلِّ سؤال', 'Feedback and explanation after each question') + '</span></button>' +
      '<button type="button" class="gsf-opt" data-mode="exam" aria-pressed="' + (c.mode === 'exam') + '"><i class="fa-solid fa-file-signature" aria-hidden="true"></i><span class="gsf-opt-t">' + t('محاكاةُ اختبار', 'Exam simulation') + '</span><span class="gsf-opt-s">' + t('لا شيءَ يُكشف حتى تسلّم', 'Nothing is revealed until you submit') + '</span></button>' +
      '</div>';
    h += '<div class="qz-field"><span class="qz-lbl">' + t('الوقت', 'Timer') + '</span><div class="gsf-chips">' +
      chip('data-timer="none"', c.timer === 'none', t('بلا وقت', 'No timer')) +
      chip('data-timer="total"', c.timer === 'total', t('وقتٌ للاختبار كلِّه', 'Whole-test timer')) +
      chip('data-timer="per"', c.timer === 'per', t('وقتٌ لكلِّ سؤال', 'Per-question timer')) +
      '</div>';
    if (c.timer === 'total') {
      h += '<div class="qz-step"><button type="button" class="gsf-btn gsf-btn--sm" data-step="min:-5" aria-label="' + t('أنقِصْ', 'Less') + '" data-ar-title="أنقِصْ" data-en-title="Less"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>' +
        '<span id="qz-min-v">' + num(minutesFor()) + ' ' + t('دقيقة', 'min') + '</span>' +
        '<button type="button" class="gsf-btn gsf-btn--sm" data-step="min:5" aria-label="' + t('زِدْ', 'More') + '" data-ar-title="زِدْ" data-en-title="More"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>' +
        (c.minutes ? '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost" data-step="min:auto">' + t('تلقائيّ', 'Auto') + '</button>' : '<span class="qz-hint-s">' + t('محسوبٌ من نوع الأسئلة', 'Based on question types') + '</span>') + '</div>';
    } else if (c.timer === 'per') {
      h += '<div class="gsf-chips">' + [15, 20, 30, 45, 60, 90].map(function (s) { return chip('data-per="' + s + '"', c.perSec === s, num(s) + ' ' + t('ث', 's')); }).join('') + '</div>';
    }
    h += '</div>';
    el.innerHTML = h;
  }

  function renderAdv() {
    var el = $('qz-c-adv'); if (!el) return;
    var c = S.cfg;
    var st = stats();
    var wrongN = 0, flagN = 0, seenN = 0, dueN = 0, p = QB.filterPool(pool(), { modules: buildMods() }, {}), byStyle = {}, day = QB.today();
    p.forEach(function (q) {
      byStyle[q.style] = (byStyle[q.style] || 0) + 1;
      var s = QB.statOf(st, q.key, day);
      if (!s.seen) return;
      seenN++; if (s.last === 0 && s.wrong) wrongN++; if (s.flag) flagN++; if (s.due) dueN++;
    });
    var counts = { all: p.length, unseen: p.length - seenN, due: dueN, wrong: wrongN, flag: flagN };
    var h = '<button type="button" class="qz-adv-t" data-act="adv" aria-expanded="' + (S.adv ? 'true' : 'false') + '">' +
      '<i class="fa-solid fa-sliders" aria-hidden="true"></i><span>' + t('خياراتٌ متقدّمة', 'Advanced options') + '</span>' +
      '<small>' + t(SOURCE[c.source].ar, SOURCE[c.source].en) + (c.styles.length ? ' · ' + c.styles.map(function (s) { return t(STYLE[s].ar, STYLE[s].en); }).join('، ') : '') + '</small>' +
      '<i class="fa-solid fa-chevron-down qz-adv-c" aria-hidden="true"></i></button>';
    if (S.adv) {
      h += '<div class="qz-adv-b">';
      h += '<div class="qz-field"><span class="qz-lbl">' + t('من أين تأتي الأسئلة', 'Where questions come from') + '</span><div class="gsf-chips">' +
        Object.keys(SOURCE).map(function (k) { return chip('data-source="' + k + '"', c.source === k, t(SOURCE[k].ar, SOURCE[k].en) + ' <span class="qz-cnt">' + num(counts[k]) + '</span>'); }).join('') + '</div>' +
        '<small class="qz-hint-s">' + t('«حان موعدُ مراجعته»: تكرارٌ متباعد — ما أخطأتَه يعود غداً، وما أصبتَه يعود بعد 3 ثمّ 7 ثمّ 16 ثمّ 35 يوماً.', '“Due for review” is spaced repetition: misses come back tomorrow, hits after 3, 7, 16, then 35 days.') + '</small></div>';
      h += '<div class="qz-field"><span class="qz-lbl">' + t('نمطُ السؤال', 'Question style') + ' <small>' + t('(لا شيء = الكلّ)', '(none = all)') + '</small></span><div class="gsf-chips">' +
        QB.STYLES.map(function (k) { return chip('data-style="' + k + '"', c.styles.indexOf(k) >= 0, t(STYLE[k].ar, STYLE[k].en) + ' <span class="qz-cnt">' + num(byStyle[k] || 0) + '</span>'); }).join('') + '</div>' +
        (byStyle[''] ? '<small class="qz-hint-s">' + t('أسئلةُ اختبارات الوحدات (' + byStyle[''] + ') بلا نمطٍ مسجَّل، فاختيارُ نمطٍ يقصرك على أسئلة المراجعة.', 'Module-quiz questions (' + byStyle[''] + ') carry no style tag, so picking a style limits you to review questions.') + '</small>' : '') + '</div>';
      h += '<div class="qz-toggles">' +
        tog('fresh', c.fresh, t('تجنّبْ ما رأيتُه', 'Avoid what I’ve seen'), t('أسئلةٌ جديدةٌ أوّلاً، ولا يعود المرئيُّ إلا إن نفدت — الأقدمُ رؤيةً قبل غيره', 'New questions first; seen ones return only when new run out, oldest first')) +
        tog('smart', c.smart, t('أولويّةٌ ذكيّة', 'Smart priority'), t('ما أخطأتَه وما حان موعدُه وما لم تره يأتي أوّلاً', 'Missed, due and unseen questions come first')) +
        tog('hints', c.hints, t('اسمحْ بالتلميح', 'Allow hints'), t('في وضع التدريب', 'In practice mode')) +
        '</div>';
      h += '</div>';
    }
    el.innerHTML = h;
  }
  function tog(k, on, title, sub) {
    return '<button type="button" class="qz-tog" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-tog="' + k + '">' +
      '<span class="qz-tog-k" aria-hidden="true"></span><span><b>' + title + '</b><small>' + sub + '</small></span></button>';
  }

  function minutesFor(items) {
    if (S.cfg.minutes) return S.cfg.minutes;
    var est = { mcq: 72, tf: 30, match: 100, essay: 420 };
    var types = S.cfg.types.length ? S.cfg.types : ['mcq'];
    if (items) return QB.suggestMinutes(items);
    var s = 0;
    for (var i = 0; i < S.cfg.count; i++) s += est[types[i % types.length]];
    return Math.max(2, Math.round(s / 60));
  }

  function plan() {
    var p = pool();
    var cards = S.cfg.types.indexOf('match') >= 0 ? cardPool() : null;
    var cfg = cfgForBuild();
    var cap = QB.capacity(p, cards, cfg, stats(), essayPool());
    var maxQ = { mcq: cap.mcq, tf: cap.tf, match: Math.min(cap.match, 12), essay: Math.min(cap.essay, 10) };
    var want = QB.allocate(S.cfg.count, S.cfg.types, maxQ);
    var got = want.mcq + want.tf + want.match + want.essay;
    return { cap: cap, want: want, got: got, pool: p.length };
  }
  function buildMods() {
    var out = {};
    S.cfg.codes.forEach(function (c) { var sel = S.cfg.modules[c]; out[c] = (sel && sel.length) ? sel.slice() : modulesOf(c); });
    return out;
  }
  function cfgForBuild() {
    return {
      count: S.cfg.count, types: S.cfg.types, diffs: S.cfg.diffs, styles: S.cfg.styles, source: S.cfg.source,
      modules: buildMods(), smart: S.cfg.smart, order: S.cfg.order, codes: S.cfg.codes, fresh: S.cfg.fresh
    };
  }

  function renderSummary() {
    var el = $('qz-sum'); if (!el) return;
    var loading = S.cfg.codes.some(function (c) { return bankState(c) === 'loading'; });
    var pl = plan();
    var mods = 0;
    S.cfg.codes.forEach(function (c) { var s = S.cfg.modules[c]; mods += (s && s.length) ? s.length : modulesOf(c).length; });
    var msg = '', can = pl.got > 0 && !loading && S.cfg.types.length > 0 && S.cfg.diffs.length > 0;
    if (!S.cfg.codes.length) msg = t('اخترْ مادّةً لتبدأ.', 'Choose a course to start.');
    else if (!S.cfg.types.length) msg = t('اخترْ نوعاً واحداً على الأقلّ.', 'Choose at least one question type.');
    else if (!S.cfg.diffs.length) msg = t('اخترْ صعوبةً واحدةً على الأقلّ.', 'Choose at least one difficulty.');
    else if (!loading && pl.got === 0) msg = S.cfg.source === 'wrong' ? t('لا أخطاءَ محفوظةً في هذا النطاق بعد — أحسنت.', 'No saved mistakes in this scope yet — nice.')
      : S.cfg.source === 'flag' ? t('لم تعلّم أسئلةً في هذا النطاق بعد.', 'You haven’t bookmarked questions in this scope yet.')
      : S.cfg.source === 'due' ? t('لا شيءَ حان موعدُ مراجعته اليوم في هذا النطاق.', 'Nothing in this scope is due for review today.')
      : t('لا أسئلةَ تطابق هذه الخيارات — وسِّعِ النطاقَ أو الصعوبة.', 'No questions match — widen the scope or difficulty.');
    else if (!loading && pl.got < S.cfg.count) msg = t('المتاحُ ' + pl.got + ' فقط بهذه الخيارات.', 'Only ' + pl.got + ' available with these options.');
    if (S.cfg.codes.length && S.cfg.types.indexOf('match') >= 0 && !loading && !pl.want.match && pl.cap.match === 0) msg += ' ' + t('لا بطاقاتِ مصطلحاتٍ كافيةً للتوصيل هنا.', 'Not enough term cards here for matching.');
    if (wantsEssays() && !loading && pl.cap.essay > 10 && pl.want.essay === 10) msg += ' ' + t('المقاليُّ عشرةٌ على الأكثر في الاختبار الواحد.', 'At most ten essays per test.');
    var parts = QB.TYPES.filter(function (k) { return pl.want[k]; }).map(function (k) { return num(pl.want[k]) + ' ' + t(KIND[k].ar, KIND[k].en); });
    var timeTxt = S.cfg.timer === 'none' ? t('بلا وقت', 'No timer')
      : S.cfg.timer === 'per' ? num(S.cfg.perSec) + ' ' + t('ثانيةً لكلِّ سؤال', 's per question')
      : num(minutesFor()) + ' ' + t('دقيقة', 'minutes');
    el.innerHTML =
      '<span class="qz-sum-l">' + t('اختبارُك', 'Your test') + '</span>' +
      '<div class="qz-sum-big">' + (loading ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>' : num(pl.got)) + '<small>' + qWord(pl.got) + '</small></div>' +
      '<p class="qz-sum-of">' + (loading ? t('يجلب الأسئلة…', 'Loading questions…') : t('من ', 'from ') + num((pl.cap.mcq + pl.cap.essay).toLocaleString('en')) + ' ' + t('سؤالاً في نطاقك', 'questions in your scope')) + '</p>' +
      (parts.length ? '<p class="qz-sum-parts">' + parts.join(' · ') + '</p>' : '') +
      '<ul class="qz-sum-meta">' +
        '<li><i class="fa-solid fa-stopwatch" aria-hidden="true"></i>' + timeTxt + '</li>' +
        '<li><i class="fa-solid ' + (S.cfg.mode === 'exam' ? 'fa-file-signature' : 'fa-chalkboard-user') + '" aria-hidden="true"></i>' + (S.cfg.mode === 'exam' ? t('محاكاةُ اختبار', 'Exam simulation') : t('تدريب', 'Practice')) + '</li>' +
        (S.cfg.codes.length ? '<li><i class="fa-solid fa-layer-group" aria-hidden="true"></i>' + num(S.cfg.codes.length) + ' ' + t(S.cfg.codes.length === 1 ? 'مادّة' : 'موادّ', S.cfg.codes.length === 1 ? 'course' : 'courses') + ' · ' + num(mods) + ' ' + t('وحدة', 'modules') + '</li>' : '') +
      '</ul>' +
      (msg ? '<p class="qz-sum-msg">' + msg + '</p>' : '') +
      '<button type="button" class="gsf-btn gsf-btn--go qz-start" data-act="start"' + (can ? '' : ' disabled') + '><i class="fa-solid fa-play" aria-hidden="true"></i> ' + t('ابدأ الاختبار', 'Start test') + '</button>';
  }

  function renderHist() {
    var el = $('qz-hist'); if (!el) return;
    var h = get(K.hist, []);
    var st = stats();
    var wrong = 0, flag = 0, byCode = {};
    Object.keys(st).forEach(function (k) {
      var s = st[k]; var c = k.split('.')[0];
      if (s[2] === 0 && s[1]) { wrong++; byCode[c] = (byCode[c] || 0) + 1; }
      if (s[4]) flag++;
    });
    if (!h.length && !wrong && !flag) { el.innerHTML = ''; return; }
    var out = '<h2 class="qz-h2">' + t('سجلُّك', 'Your record') + '</h2>';
    out += '<div class="qz-bankrow">' +
      '<div class="qz-stat"><b>' + num(wrong) + '</b><span>' + t('سؤالاً أخطأتَه ولم تصحّحه بعد', 'missed questions not fixed yet') + '</span></div>' +
      '<div class="qz-stat"><b>' + num(flag) + '</b><span>' + t('سؤالاً علّمتَه للمراجعة', 'bookmarked for review') + '</span></div>' +
      '<div class="qz-stat"><b>' + num(h.length) + '</b><span>' + t('اختباراً محفوظاً', 'saved tests') + '</span></div>' +
      '</div>';
    if (h.length > 1) out += spark(h.slice(-12));
    if (h.length) {
      out += '<ol class="qz-hlist">' + h.slice().reverse().slice(0, 8).map(function (r, i) {
        var pct = Math.round(r.s / r.t * 100);
        var d = new Date(r.at);
        return '<li class="qz-hrow">' +
          '<span class="qz-hpct" data-tone="' + toneOf(pct) + '">' + num(pct + '٪') + '</span>' +
          '<span class="qz-hmain"><b>' + r.codes.map(code).join(' ') + ' · ' + num(r.n) + ' ' + qWord(r.n) + '</b>' +
          '<small>' + esc(d.toLocaleDateString(isAr() ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { day: 'numeric', month: 'short' })) + ' · ' + (r.mode === 'exam' ? t('محاكاة', 'Exam') : t('تدريب', 'Practice')) + ' · ' + clock(r.dur) + '</small></span>' +
          (r.wrong && r.wrong.length ? '<button type="button" class="gsf-btn gsf-btn--sm" data-redo="' + (h.length - 1 - i) + '">' + t('أعِدْ أخطاءه', 'Redo mistakes') + ' (' + r.wrong.length + ')</button>' : '<span class="qz-hok"><i class="fa-solid fa-check" aria-hidden="true"></i></span>') +
          '</li>';
      }).join('') + '</ol>';
    }
    el.innerHTML = out;
  }
  function toneOf(pct) { return pct >= 85 ? 1 : pct >= 70 ? 2 : pct >= 55 ? 3 : pct >= 40 ? 4 : 5; }
  function spark(list) {
    var w = 300, hgt = 64, n = list.length;
    var pts = list.map(function (r, i) { return [Math.round(8 + i * (w - 16) / Math.max(1, n - 1)), Math.round(hgt - 8 - (r.s / r.t) * (hgt - 16))]; });
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
    var area = path + ' L' + pts[n - 1][0] + ' ' + (hgt - 4) + ' L' + pts[0][0] + ' ' + (hgt - 4) + ' Z';
    var last = pts[n - 1];
    return '<figure class="qz-spark"><svg viewBox="0 0 ' + w + ' ' + hgt + '" role="img" aria-label="' + t('منحنى درجاتك في آخر الاختبارات', 'Your scores over recent tests') + '">' +
      '<line x1="8" x2="' + (w - 8) + '" y1="' + Math.round(hgt - 8 - .5 * (hgt - 16)) + '" y2="' + Math.round(hgt - 8 - .5 * (hgt - 16)) + '" class="qz-spark-g"/>' +
      '<path d="' + area + '" class="qz-spark-a"/><path d="' + path + '" class="qz-spark-l"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="4" class="qz-spark-p"/></svg>' +
      '<figcaption>' + t('آخرُ ', 'Last ') + num(n) + t(' اختبارات', ' tests') + '</figcaption></figure>';
  }

  function refreshAll() {
    if (S.view !== 'setup') return;
    renderCourse(); renderShape(); renderTime(); renderAdv(); renderSummary();
  }
  function reloadBanks() {
    renderCourse(); renderSummary();
    ensureBanks().then(function () {
      if (S.view === 'setup') { renderCourse(); renderAdv(); renderSummary(); }
    });
  }

  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); return arr; }

  function onSetupClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (d.preset) return applyPreset(d.preset);
    if (d.course) {
      toggleIn(S.cfg.codes, d.course);
      saveCfg(); reloadBanks(); renderAdv(); return;
    }
    if (d.scope) {
      S.cfg.scope[d.c] = d.scope; S.cfg.modules[d.c] = [];
      saveCfg(); reloadBanks(); return;
    }
    if (d.mod) {
      if (d.mod === 'all') S.cfg.modules[d.c] = [];
      else {
        var sel = S.cfg.modules[d.c] = (S.cfg.modules[d.c] || []).slice();
        toggleIn(sel, Number(d.mod));
        if (sel.length === modulesOf(d.c).length) S.cfg.modules[d.c] = [];
      }
      saveCfg(); renderCourse(); renderAdv();
      renderSummary(); return;
    }
    if (d.type) { toggleIn(S.cfg.types, d.type); saveCfg(); renderShape(); if (d.type === 'essay') reloadBanks(); else { renderCourse(); renderSummary(); } return; }
    if (d.diff) { toggleIn(S.cfg.diffs, d.diff); saveCfg(); renderShape(); renderAdv(); renderSummary(); return; }
    if (d.src) { S.cfg.src = d.src; saveCfg(); renderCourse(); renderAdv(); renderSummary(); return; }
    if (d.order) { S.cfg.order = d.order; saveCfg(); renderShape(); renderSummary(); return; }
    if (d.count) { S.cfg.count = Number(d.count); saveCfg(); renderShape(); renderTime(); renderSummary(); return; }
    if (d.mode) { S.cfg.mode = d.mode; saveCfg(); renderTime(); renderSummary(); return; }
    if (d.timer) { S.cfg.timer = d.timer; saveCfg(); renderTime(); renderSummary(); return; }
    if (d.per) { S.cfg.perSec = Number(d.per); saveCfg(); renderTime(); renderSummary(); return; }
    if (d.step) {
      var v = d.step.split(':')[1];
      S.cfg.minutes = v === 'auto' ? 0 : Math.max(2, Math.min(240, minutesFor() + Number(v)));
      saveCfg(); renderTime(); renderSummary(); return;
    }
    if (d.source) { S.cfg.source = d.source; saveCfg(); renderAdv(); renderSummary(); return; }
    if (d.style) { toggleIn(S.cfg.styles, d.style); saveCfg(); renderAdv(); renderSummary(); return; }
    if (d.tog) { S.cfg[d.tog] = !S.cfg[d.tog]; saveCfg(); renderAdv(); renderSummary(); return; }
    if (d.redo != null) return redoFromHist(Number(d.redo));
    switch (d.act) {
      case 'adv': S.adv = !S.adv; renderAdv(); return;
      case 'pick': return openPicker();
      case 'retry':
        S.cfg.codes.forEach(function (c) { var k = course(c); if (k && k.status !== 'loading') k.status = 'retry'; });
        return reloadBanks();
      case 'start': return start();
      case 'resume': return resume();
      case 'discard': drop(K.run); renderResume(); return;
    }
  }
  function onSetupInput(e) {
    if (e.target.id === 'qz-count') {
      S.cfg.count = Number(e.target.value);
      var o = $('qz-count-v'); if (o) o.innerHTML = num(S.cfg.count);
      document.querySelectorAll('[data-count]').forEach(function (c) {
        var on = Number(c.dataset.count) === S.cfg.count;
        c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      saveCfg(); renderSummary();
      var mv = $('qz-min-v'); if (mv) mv.innerHTML = num(minutesFor()) + ' ' + t('دقيقة', 'min');
    }
  }

  function openPicker() {
    var dlg = $('qz-pick');
    var d = D();
    var list = (d && d.catalogList ? d.catalogList() : []).filter(function (c) { return c && c.path && c.available !== false; });
    var levels = {};
    list.forEach(function (c) { var lv = c.level || 'others'; (levels[lv] = levels[lv] || []).push(c); });
    var order = Object.keys(levels).sort();
    dlg.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' + t('أغلِقْ', 'Close') + '" data-ar-title="أغلِقْ" data-en-title="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
      '<div class="gsf-head"><h2 class="gsf-title">' + t('اخترِ الموادّ', 'Choose courses') + '</h2><p class="gsf-sub">' + t('يمكنك خلطُ أكثرَ من مادّةٍ في اختبارٍ واحد.', 'You can mix several courses in one test.') + '</p></div>' +
      '<div class="gsf-body"><input type="search" class="gsf-in qz-pick-q" id="qz-pick-q" placeholder="' + t('ابحثْ برمز المادّة أو اسمها', 'Search by course code or name') + '" autocomplete="off">' +
      '<div class="qz-pick-list" id="qz-pick-list">' + order.map(function (lv) {
        var c0 = levels[lv][0];
        var title = c0 && c0.level_name_ar ? t(c0.level_name_ar, c0.level_name_en || lv) : t('موادُّ عامّة', 'General courses');
        return '<div class="qz-pick-g"><h3>' + esc(title) + '</h3><div class="gsf-rows">' + levels[lv].map(function (c) {
          var on = S.cfg.codes.indexOf(c.code) >= 0;
          return '<button type="button" class="gsf-row qz-pick-r" data-pick="' + esc(c.code) + '" aria-current="' + (on ? 'true' : 'false') + '" data-s="' + esc((c.code + ' ' + c.name_ar + ' ' + c.name_en).toLowerCase()) + '">' +
            '<i class="' + esc(c.icon || 'fa-solid fa-book') + '" aria-hidden="true"></i><span><span class="qz-code">' + esc(c.code) + '</span> ' + esc(isAr() ? c.name_ar : c.name_en) + '</span>' +
            '<i class="fa-solid fa-check qz-pick-ok" aria-hidden="true"></i></button>';
        }).join('') + '</div></div>';
      }).join('') + '</div></div>' +
      '<div class="gsf-foot"><div class="gsf-acts"><button type="button" class="gsf-btn gsf-btn--go" data-act="pick-done">' + t('تمّ', 'Done') + '</button></div></div>';
    if (!dlg.open) dlg.showModal();
    var q = $('qz-pick-q');
    if (q && !matchMedia('(pointer: coarse)').matches) q.focus();
  }
  function onPickClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.pick) {
      var c = b.dataset.pick;
      toggleIn(S.cfg.codes, c);
      b.setAttribute('aria-current', S.cfg.codes.indexOf(c) >= 0 ? 'true' : 'false');
      saveCfg();
    } else if (b.dataset.act === 'pick-done') {
      $('qz-pick').close();
    }
  }
  function onPickInput(e) {
    if (e.target.id !== 'qz-pick-q') return;
    var v = e.target.value.trim().toLowerCase();
    document.querySelectorAll('#qz-pick-list .qz-pick-r').forEach(function (r) { r.hidden = !!v && r.dataset.s.indexOf(v) < 0; });
    document.querySelectorAll('#qz-pick-list .qz-pick-g').forEach(function (g) { g.hidden = !g.querySelector('.qz-pick-r:not([hidden])'); });
  }

  function start(fixed) {
    var p = pool();
    var cards = S.cfg.types.indexOf('match') >= 0 ? cardPool() : null;
    var built;
    if (fixed) {
      built = { items: fixed };
    } else {
      built = QB.build(p, cards, cfgForBuild(), stats(), (Date.now() ^ Math.floor(Math.random() * 1e9)) & 0x7fffffff, essayPool());
    }
    if (!built.items.length) return;
    var n = built.items.length;
    var total = S.cfg.timer === 'total' ? (S.cfg.minutes || QB.suggestMinutes(built.items)) * 60 : 0;
    S.run = {
      id: Date.now(), cfg: JSON.parse(JSON.stringify(S.cfg)), items: built.items,
      answers: new Array(n).fill(null), flags: built.items.map(function (it) { return it.key ? isFlagged(it.key) : false; }),
      locked: new Array(n).fill(false), times: new Array(n).fill(0), hintUsed: new Array(n).fill(false),
      guess: new Array(n).fill(false), strike: built.items.map(function () { return []; }),
      idx: 0, elapsed: 0, total: total, perLeft: S.cfg.timer === 'per' ? S.cfg.perSec : 0, done: false, startedAt: Date.now()
    };
    saveRun();
    show('run');
    renderRun();
    startTick();
  }
  function resume() {
    var r = get(K.run, null);
    if (!r) return;
    S.cfg = r.cfg;
    var ps = [], codes = {};
    r.items.forEach(function (it) { (it.key ? [it.key] : []).concat(it.keys || []).forEach(function (k) { codes[k.split('.')[0]] = 1; }); });
    var ess = r.items.some(function (it) { return it.kind === 'essay'; });
    Object.keys(codes).forEach(function (c) { ps.push(loadCourse(c).then(function () { return ess ? loadEssays(c) : null; })); });
    $('qz-setup').classList.add('qz-busy');
    Promise.all(ps).then(function () {
      $('qz-setup').classList.remove('qz-busy');
      var miss = r.items.some(function (it) { return it.key ? !S.index[it.key] : it.keys.some(function (k) { return !S.cardIndex[k]; }); });
      if (miss) { drop(K.run); renderResume(); return; }
      if (!r.guess) r.guess = r.items.map(function () { return false; });
      if (!r.strike) r.strike = r.items.map(function () { return []; });
      S.run = r;
      show('run'); renderRun(); startTick();
    });
  }
  function saveRun() { if (S.run && !S.run.done) put(K.run, S.run); }

  function startTick() {
    stopTick();
    var last = Date.now();
    S.tick = setInterval(function () {
      var now = Date.now(), dt = (now - last) / 1000; last = now;
      if (!S.run || S.run.done || document.hidden) return;
      if (dt > 5) dt = 1;
      var r = S.run;
      r.elapsed += dt;
      r.times[r.idx] += dt;
      if (r.cfg.timer === 'total' && r.total && r.elapsed >= r.total) { finish(true); return; }
      if (r.cfg.timer === 'per' && !r.locked[r.idx]) {
        r.perLeft -= dt;
        if (r.perLeft <= 0) { timeoutQ(); }
      }
      paintClock();
      if (Math.round(r.elapsed) % 5 === 0) saveRun();
    }, 250);
  }
  function stopTick() { if (S.tick) clearInterval(S.tick); S.tick = null; }
  function paintClock() {
    var r = S.run, el = $('qz-clock'); if (!r || !el) return;
    var txt, warn = false, frac = null;
    if (r.cfg.timer === 'total') { var left = r.total - r.elapsed; txt = clock(left); warn = left < 60; frac = left / r.total; }
    else if (r.cfg.timer === 'per') { txt = clock(r.perLeft); warn = r.perLeft <= 5; frac = r.perLeft / r.cfg.perSec; }
    else txt = clock(r.elapsed);
    el.textContent = txt;
    el.classList.toggle('qz-warn', warn);
    var bar = $('qz-tbar');
    if (bar) { bar.hidden = frac == null; if (frac != null) bar.style.setProperty('--f', Math.max(0, Math.min(1, frac)).toFixed(3)); }
  }
  function timeoutQ() {
    var r = S.run;
    if (r.cfg.mode === 'practice') { lockQ(r.idx); renderRun(); }
    else {
      r.locked[r.idx] = true;
      if (r.idx < r.items.length - 1) go(r.idx + 1); else finish(false);
    }
  }

  function qOf(it) { return it.key ? S.index[it.key] : null; }
  function lockQ(i) {
    var r = S.run;
    if (r.locked[i]) return;
    r.locked[i] = true;
    var it = r.items[i];
    if (r.cfg.mode === 'practice') recordOne(i);
    saveRun();
  }
  function recordOne(i) {
    var r = S.run, it = r.items[i];
    r.rec = r.rec || [];
    if (r.rec[i] || !it.key || !QB.answered(it, r.answers[i])) return;
    var st = stats();
    r.snap = r.snap || {};
    if (!(it.key in r.snap)) r.snap[it.key] = st[it.key] || null;
    var sc = QB.grade(it, r.answers[i], qOf(it));
    QB.record(st, it.key, it.kind === 'essay' ? sc >= 0.6 : sc === 1, !r.guess[i]);
    put(K.stats, st);
    r.rec[i] = true;
  }
  function unrecord(r) {
    if (!r.snap) return;
    var st = stats();
    Object.keys(r.snap).forEach(function (k) {
      var prev = r.snap[k], cur = st[k];
      if (prev) { if (cur) prev[4] = cur[4]; st[k] = prev; }
      else if (cur && cur[4]) st[k] = [0, 0, null, 0, 1, 0];
      else delete st[k];
    });
    put(K.stats, st);
  }
  function answer(i, val) {
    var r = S.run;
    if (r.locked[i]) return;
    r.answers[i] = val;
    var it = r.items[i];
    if (r.cfg.mode === 'practice' && it.kind !== 'match') lockQ(i);
    saveRun();
    renderRun();
  }
  function go(i) {
    var r = S.run;
    if (i < 0 || i >= r.items.length) return;
    r.idx = i;
    S.matchAct = null;
    if (r.cfg.timer === 'per') r.perLeft = r.locked[i] ? 0 : r.cfg.perSec;
    saveRun();
    renderRun();
    var q = $('qz-q'); if (q) q.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function activeSlot(ans) {
    if (S.matchAct != null && S.matchAct >= 0 && S.matchAct < 4) return S.matchAct;
    var e = ans.indexOf(null);
    return e >= 0 ? e : 0;
  }
  function matchPick(bi) {
    var r = S.run;
    var ans = (r.answers[r.idx] || [null, null, null, null]).slice();
    var slot = activeSlot(ans);
    var p = ans.indexOf(bi);
    if (p === slot) ans[slot] = null;
    else {
      if (p >= 0) ans[p] = ans[slot];
      ans[slot] = bi;
    }
    var next = -1;
    for (var k = 1; k <= 4; k++) { var j = (slot + k) % 4; if (ans[j] == null) { next = j; break; } }
    S.matchAct = next >= 0 ? next : null;
    r.answers[r.idx] = ans.every(function (x) { return x == null; }) ? null : ans;
    saveRun(); renderRun();
  }
  function tbtn(attrs, icon, ar, en, on) {
    return '<button type="button" class="qz-tb' + (on ? ' on' : '') + '" ' + attrs + ' title="' + esc(t(ar, en)) + '">' +
      '<i class="fa-' + (icon.indexOf('regular:') === 0 ? 'regular fa-' + icon.slice(8) : 'solid fa-' + icon) + '" aria-hidden="true"></i><span>' + t(ar, en) + '</span></button>';
  }
  function essayAns(i) { var a = S.run.answers[i]; return a && typeof a === 'object' && !Array.isArray(a) ? a : { text: '' }; }
  function essayTicks(i, q) {
    var a = essayAns(i);
    return a.ticks || QB.essayHits(a.text, q.points);
  }
  function kpList(i, q, lang, editable) {
    var ticks = essayTicks(i, q), pts = q.points[lang] || q.points.en || [];
    if (!pts.length) return '';
    var got = ticks.filter(Boolean).length;
    return '<div class="qz-kps"><p class="qz-kps-h"><b>' + t('النقاطُ المفتاحيّة', 'Key points') + '</b> · ' +
      t('علّمْنا ما يبدو أنك ذكرتَه — صحّحْه بنفسك', 'We ticked what you seem to cover — correct it yourself') +
      ' <span class="qz-kps-n">' + num(got) + ' / ' + num(pts.length) + '</span></p><ul>' +
      pts.map(function (p, j) {
        var on = !!ticks[j];
        return '<li><button type="button" class="qz-kp' + (on ? ' on' : '') + '" data-kp="' + j + '" data-ki="' + i + '" aria-pressed="' + on + '"' + (editable ? '' : ' disabled') + '>' +
          '<i class="fa-' + (on ? 'solid fa-circle-check' : 'regular fa-circle') + '" aria-hidden="true"></i><span dir="auto">' + rich(p) + '</span></button></li>';
      }).join('') + '</ul></div>';
  }
  function modelAnswer(q, lang, open) {
    return '<details class="qz-model"' + (open ? ' open' : '') + '><summary><i class="fa-solid fa-file-pen" aria-hidden="true"></i> ' + t('الإجابةُ النموذجيّة', 'Model answer') +
      ' <small>' + num(QB.wordCount(q.model[lang])) + ' ' + t('كلمة', 'words') + '</small></summary><p dir="auto">' + rich(q.model[lang]) + '</p></details>';
  }

  function qArticle(i, opt) {
    var r = S.run, it = r.items[i], q = qOf(it), lang = L();
    var practice = r.cfg.mode === 'practice';
    var revealed = !opt.measure && practice && r.locked[i];
    var h = '';
    var meta = [];
    if (q) {
      meta.push(code(q.code));
      if (q.module) meta.push(modLabel(q.code, q.module));
      meta.push('<span class="qz-diff" data-tone="' + DIFF[q.diff].tone + '">' + t(DIFF[q.diff].ar, DIFF[q.diff].en) + '</span>');
    } else {
      var c0 = S.cardIndex[it.keys[0]];
      if (c0) { meta.push(code(c0.code)); meta.push(modLabel(c0.code, c0.module)); }
    }
    meta.push('<span class="qz-kind"><i class="fa-solid ' + KIND[it.kind].icon + '" aria-hidden="true"></i> ' + t(KIND[it.kind].ar, KIND[it.kind].en) + '</span>');
    h += '<div class="qz-meta">' + meta.join('<span class="qz-dot" aria-hidden="true">·</span>') + '</div>';
    var a = opt.measure ? null : r.answers[i];

    if (it.kind === 'mcq') {
      var struck = (!opt.measure && r.strike && r.strike[i]) || [];
      h += '<h2 class="qz-stem" dir="auto">' + rich(q.q[lang]) + '</h2><div class="qz-opts" role="radiogroup">';
      it.order.forEach(function (oi, di) {
        var sel = a === di, x = struck.indexOf(di) >= 0;
        var cls = 'qz-opt' + (sel ? ' sel' : '') + (x && !revealed ? ' x' : '');
        if (revealed) { if (oi === q.ans) cls += ' ok'; else if (sel) cls += ' no'; }
        h += '<div class="qz-orow"><button type="button" class="' + cls + '" role="radio" aria-checked="' + (sel ? 'true' : 'false') + '" data-opt="' + di + '"' + (revealed ? ' disabled' : '') + '>' +
          '<span class="qz-key">' + (di + 1) + '</span><span class="qz-opt-t" dir="auto">' + rich(q.opts[lang][oi]) + '</span>' +
          (revealed && oi === q.ans ? '<i class="fa-solid fa-check qz-mark" aria-hidden="true"></i>' : revealed && sel ? '<i class="fa-solid fa-xmark qz-mark" aria-hidden="true"></i>' : '') + '</button>' +
          (revealed ? '' : '<button type="button" class="qz-x' + (x ? ' on' : '') + '" data-strike="' + di + '" aria-pressed="' + x + '" aria-label="' + t(x ? 'أعِدْ هذا الخيار' : 'استبعِدْ هذا الخيار', x ? 'Restore this option' : 'Rule out this option') + '" title="' + t(x ? 'أعِدْه' : 'استبعِدْه', x ? 'Restore' : 'Rule out') + '"><i class="fa-solid fa-strikethrough" aria-hidden="true"></i></button>') +
          '</div>';
      });
      h += '</div>';
    } else if (it.kind === 'tf') {
      h += '<h2 class="qz-stem" dir="auto">' + rich(q.q[lang]) + '</h2>' +
        '<div class="qz-claim"><span>' + t('الجوابُ المقترح', 'Proposed answer') + '</span><p dir="auto">' + rich(q.opts[lang][it.shown]) + '</p></div>' +
        '<div class="qz-tf" role="radiogroup">';
      [[true, 'fa-check', 'صحيح', 'True', 'T'], [false, 'fa-xmark', 'خطأ', 'False', 'F']].forEach(function (o) {
        var sel = a === o[0];
        var cls = 'qz-tfb' + (sel ? ' sel' : '');
        if (revealed) { if (o[0] === it.truth) cls += ' ok'; else if (sel) cls += ' no'; }
        h += '<button type="button" class="' + cls + '" role="radio" aria-checked="' + (sel ? 'true' : 'false') + '" data-tf="' + (o[0] ? 1 : 0) + '"' + (revealed ? ' disabled' : '') + '>' +
          '<i class="fa-solid ' + o[1] + '" aria-hidden="true"></i><span>' + t(o[2], o[3]) + '</span><kbd>' + o[4] + '</kbd></button>';
      });
      h += '</div>';
    } else if (it.kind === 'essay') {
      var ea = opt.measure ? { text: '' } : essayAns(i), wc = QB.wordCount(ea.text), target = QB.wordCount(q.model.en);
      h += '<h2 class="qz-stem" dir="auto">' + rich(q.q[lang]) + '</h2>';
      if (!revealed) {
        h += '<label class="qz-ess-l" for="qz-essay">' + t('اكتبْ إجابتك', 'Write your answer') + '</label>' +
          '<textarea id="qz-essay" class="gsf-ta qz-essay" dir="auto" rows="8" data-ess="' + i + '" placeholder="' + esc(t('اكتبْ بالعربيّة أو الإنجليزيّة — النقاطُ المفتاحيّة تُقرأ باللغتين', 'Write in Arabic or English — key points are matched in both')) + '">' + esc(ea.text) + '</textarea>' +
          '<p class="qz-ess-c"><span id="qz-wc">' + num(wc) + '</span> ' + t('كلمة', 'words') + ' · ' + t('الإجابةُ النموذجيّة نحو ', 'the model answer is about ') + num(target) + ' ' + t('كلمة', 'words') +
          (q.points.en.length ? ' · ' + num(q.points.en.length) + ' ' + t('نقاطٍ مفتاحيّة', 'key points') : '') + '</p>';
        if (practice) h += '<div class="qz-mcheck"><button type="button" class="gsf-btn gsf-btn--go" data-run="essay-check"><i class="fa-solid fa-clipboard-check" aria-hidden="true"></i> ' + t('قارِنْ بالإجابة النموذجيّة', 'Compare with the model answer') + '</button></div>';
      } else {
        h += '<div class="qz-ess-mine"><span>' + t('إجابتُك', 'Your answer') + '</span><p dir="auto">' + (ea.text ? esc(ea.text) : '<i>' + t('لم تكتب شيئاً', 'You wrote nothing') + '</i>') + '</p></div>' +
          kpList(i, q, lang, true) + modelAnswer(q, lang, !q.points.en.length);
      }
    } else {
      var ans = a || [null, null, null, null];
      var cards = it.keys.map(function (k) { return S.cardIndex[k]; });
      var act = opt.measure ? 0 : activeSlot(ans);
      var LET = isAr() ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D'];
      h += '<h2 class="qz-stem">' + t('صِلْ كلَّ عبارةٍ بجوابها', 'Match each prompt with its answer') + '</h2>' +
        (revealed ? '' : '<p class="qz-mhelp">' + t('اخترْ عبارةً ثمّ جوابَها من البطاقات أدناه. اضغطْ جواباً مختاراً لتلغيه.', 'Pick a prompt, then its answer from the cards below. Tap a chosen answer to clear it.') + '</p>') +
        '<ol class="qz-mslots">';
      cards.forEach(function (c, pi) {
        var chosen = ans[pi];
        var cls = 'qz-mslot' + (chosen != null ? ' filled' : '') + (!revealed && pi === act ? ' active' : '');
        if (revealed) cls += chosen === pi ? ' ok' : ' no';
        h += '<li><button type="button" class="' + cls + '" data-ms="' + pi + '"' + (revealed ? ' disabled' : '') + ' aria-pressed="' + (!revealed && pi === act ? 'true' : 'false') + '">' +
          '<span class="qz-key">' + (pi + 1) + '</span>' +
          '<span class="qz-mtxt"><span class="qz-mp" dir="auto">' + rich(c.front[lang]) + '</span>' +
          '<span class="qz-mans" dir="auto">' + (chosen != null ? '<b class="qz-mlet">' + LET[it.order.indexOf(chosen)] + '</b> ' + rich(cards[chosen].back[lang]) : '<i>' + t('لم تختر بعد', 'Not chosen yet') + '</i>') + '</span>' +
          (revealed && chosen !== pi ? '<span class="qz-mright" dir="auto"><i class="fa-solid fa-check" aria-hidden="true"></i> ' + rich(c.back[lang]) + '</span>' : '') +
          '</span></button></li>';
      });
      h += '</ol>';
      if (!revealed) {
        h += '<div class="qz-mbank">' + it.order.map(function (bi, li) {
          var by = ans.indexOf(bi);
          return '<button type="button" class="qz-mb' + (by >= 0 ? ' used' : '') + '" data-mb="' + bi + '">' +
            '<b class="qz-mlet">' + LET[li] + '</b><span dir="auto">' + rich(cards[bi].back[lang]) + '</span>' +
            (by >= 0 ? '<span class="qz-mby">' + num(by + 1) + '</span>' : '') + '</button>';
        }).join('') + '</div>';
      }
      if (practice && !revealed) {
        var full = ans.every(function (x) { return x != null; });
        h += '<div class="qz-mcheck"><button type="button" class="gsf-btn gsf-btn--go" data-run="check"' + (full ? '' : ' disabled') + '>' + t('تحقّقْ', 'Check') + '</button></div>';
      }
    }

    if (!revealed && (it.kind === 'mcq' || it.kind === 'tf')) {
      var g = !opt.measure && r.guess[i];
      h += '<div class="qz-aux">' +
        '<button type="button" class="qz-guess' + (g ? ' on' : '') + '" data-run="guess" aria-pressed="' + !!g + '" title="' + esc(t('علِّمْه قبل أن تجيب إن لم تكن متأكّداً — فإن أصبتَ تخميناً عاد إليك غداً', 'Mark it before answering if you’re unsure — a lucky guess comes back tomorrow')) + '">' +
          '<i class="fa-' + (g ? 'solid' : 'regular') + ' fa-circle-question" aria-hidden="true"></i> ' + t('غيرُ متأكّد', 'Not sure') + ' <kbd>G</kbd></button>';
      if (it.kind === 'mcq' && strikeHint()) {
        h += '<span class="qz-aux-h"><i class="fa-solid fa-strikethrough" aria-hidden="true"></i> ' + t('زرُّ الشطب بجانب كلِّ خيارٍ يستبعد ما تتأكّد من خطئه', 'The strike button beside each option rules out one you know is wrong') + '</span>';
      }
      if (practice && r.cfg.hints && q && q.hint[lang]) {
        h += !opt.measure && r.hintUsed[i]
          ? '<p class="qz-hint"><i class="fa-regular fa-lightbulb" aria-hidden="true"></i> ' + rich(q.hint[lang]) + '</p>'
          : '<button type="button" class="qz-guess" data-run="hint"><i class="fa-regular fa-lightbulb" aria-hidden="true"></i> ' + t('تلميح', 'Hint') + ' <kbd>H</kbd></button>';
      }
      h += '</div>';
    }
    if (revealed && it.kind !== 'essay') h += feedback(it, q, a, lang, i);
    return h;
  }

  function strikeHint() { return !S.run.strike.some(function (x) { return x && x.length; }); }
  function measureRun() {
    var r = S.run, art = $('qz-q');
    if (!r || !art) return;
    var w = art.getBoundingClientRect().width;
    if (!w) return;
    var probe = document.createElement('article');
    probe.className = 'qz-q qz-probe';
    probe.setAttribute('aria-hidden', 'true');
    probe.style.inlineSize = w + 'px';
    art.parentNode.appendChild(probe);
    var max = 0;
    r.items.forEach(function (it, i) {
      probe.innerHTML = qArticle(i, { measure: true });
      max = Math.max(max, probe.getBoundingClientRect().height);
    });
    probe.remove();
    var bar = document.querySelector('.qz-bar'), foot = document.querySelector('.qz-foot');
    var room = window.innerHeight - (bar ? bar.getBoundingClientRect().height : 0) - (foot ? foot.getBoundingClientRect().height : 0) - 96;
    var minh = Math.max(0, Math.min(Math.ceil(max), Math.max(260, room)));
    S.minh = { w: Math.round(w), h: minh, lang: L(), n: r.items.length, id: r.id, sh: strikeHint() };
    document.documentElement.style.setProperty('--qz-minh', minh + 'px');
  }
  function ensureMeasure() {
    var r = S.run, art = $('qz-q');
    if (!r || !art) return;
    var w = Math.round(art.getBoundingClientRect().width);
    var m = S.minh;
    if (!m || m.w !== w || m.lang !== L() || m.id !== r.id || m.sh !== strikeHint()) measureRun();
  }

  function renderRun() {
    var r = S.run, el = $('qz-run'); if (!r || !el) return;
    var n = r.items.length;
    var answered = r.items.filter(function (it, i) { return QB.answered(it, r.answers[i]); }).length;
    var practice = r.cfg.mode === 'practice';
    var revealed = practice && r.locked[r.idx];
    var it = r.items[r.idx];
    var h = '<div class="qz-bar">' +
      tbtn('data-run="quit"', 'xmark', 'إنهاء', 'End') +
      '<div class="qz-prog"><span class="qz-prog-t"><span class="qz-prog-w">' + t('السؤال', 'Question') + ' </span>' + num(r.idx + 1) + ' <span class="qz-prog-w">' + t('من', 'of') + '</span><span class="qz-prog-s" aria-hidden="true">/</span> ' + num(n) + '</span>' +
      '<span class="qz-prog-b" style="--p:' + ((practice ? r.locked.filter(Boolean).length : answered) / n).toFixed(3) + '"></span></div>' +
      '<span class="qz-clock' + (r.cfg.timer === 'none' ? ' qz-clock--up' : '') + '" id="qz-clock" role="timer" aria-live="off" title="' + esc(r.cfg.timer === 'none' ? t('الوقتُ المنقضي', 'Time elapsed') : t('الوقتُ الباقي', 'Time left')) + '"></span>' +
      tbtn('data-run="flag" aria-pressed="' + (r.flags[r.idx] ? 'true' : 'false') + '"', (r.flags[r.idx] ? 'bookmark' : 'regular:bookmark'), r.flags[r.idx] ? 'معلَّم' : 'علِّمْه', r.flags[r.idx] ? 'Marked' : 'Mark', r.flags[r.idx]) +
      '</div>' +
      '<div class="qz-tbar" id="qz-tbar" hidden></div>' +
      '<div id="qz-guard"></div>';
    h += '<article class="qz-q" id="qz-q" tabindex="-1">' + qArticle(r.idx, {}) + '</article>';

    h += '<nav class="qz-nav" id="qz-nav" aria-label="' + t('الأسئلة', 'Questions') + '">' + r.items.map(function (x, i) {
      var cls = 'qz-nb';
      if (i === r.idx) cls += ' cur';
      if (QB.answered(x, r.answers[i])) cls += ' ans';
      if (practice && r.locked[i] && x.kind !== 'essay') { var sc = QB.grade(x, r.answers[i], qOf(x)); cls += !QB.answered(x, r.answers[i]) ? ' skip' : sc === 1 ? ' ok' : ' no'; }
      if (r.flags[i]) cls += ' flag';
      return '<button type="button" class="' + cls + '" data-go="' + i + '" aria-label="' + t('السؤال ', 'Question ') + (i + 1) + '">' + (i + 1) + '</button>';
    }).join('') + '</nav>';

    h += '<div class="qz-foot">';
    if (practice) {
      h += '<span class="qz-score">' + t('النتيجة: ', 'Score: ') + num(fmtScore(scoreSoFar())) + ' / ' + num(r.locked.filter(Boolean).length) + '</span>';
      h += revealed
        ? '<button type="button" class="gsf-btn gsf-btn--go qz-next" data-run="next">' + (r.idx < n - 1 ? t('التالي', 'Next') : t('النتيجة', 'See results')) + ' <kbd>↵</kbd></button>'
        : '<button type="button" class="gsf-btn gsf-btn--ghost" data-run="skip" title="' + esc(t('تخطَّه بلا تسجيل — لا يُحسب خطأً', 'Skip without recording — it won’t count as a mistake')) + '">' + t('تخطَّ', 'Skip') + '</button>';
    } else {
      h += '<button type="button" class="gsf-btn" data-run="prev"' + (r.idx ? '' : ' disabled') + '><i class="fa-solid fa-arrow-right qz-flip" aria-hidden="true"></i> ' + t('السابق', 'Previous') + '</button>';
      h += '<button type="button" class="gsf-btn gsf-btn--ghost qz-navt" data-run="grid" aria-expanded="false"><i class="fa-solid fa-table-cells" aria-hidden="true"></i> ' + num(answered) + ' / ' + num(n) + '</button>';
      h += r.idx < n - 1
        ? '<button type="button" class="gsf-btn" data-run="next">' + t('التالي', 'Next') + ' <i class="fa-solid fa-arrow-left qz-flip" aria-hidden="true"></i></button>'
        : '<button type="button" class="gsf-btn gsf-btn--go" data-run="submit">' + t('سلِّمْ', 'Submit') + '</button>';
    }
    h += '</div>';
    el.innerHTML = h;
    paintClock();
    typeset(el);
    ensureMeasure();
    if (it.kind === 'essay' && !revealed) {
      var ta = $('qz-essay');
      if (ta && !matchMedia('(pointer: coarse)').matches) ta.focus({ preventScroll: true });
    }
  }
  function fmtScore(x) { return Math.round(x * 100) / 100; }
  function scoreSoFar() {
    var r = S.run, s = 0;
    r.items.forEach(function (it, i) { if (r.locked[i]) s += QB.grade(it, r.answers[i], qOf(it)); });
    return s;
  }
  function feedback(it, q, a, lang, i) {
    var sc = QB.grade(it, a, q);
    var ok = sc === 1, guessed = i != null && S.run.guess[i];
    var h = '<div class="qz-fb ' + (ok ? 'ok' : a == null ? 'skip' : 'no') + '" role="status">';
    h += '<b><i class="fa-solid ' + (ok ? 'fa-circle-check' : a == null ? 'fa-forward' : 'fa-circle-xmark') + '" aria-hidden="true"></i> ' +
      (ok ? (guessed ? t('أصبتَ تخميناً — سيعود إليك غداً لتثبّته', 'Right, but a guess — it comes back tomorrow') : t('إجابةٌ صحيحة', 'Correct')) : a == null ? t('تخطّيتَه — لم يُسجَّل خطأً', 'Skipped — not recorded as a mistake') : it.kind === 'match' ? t('أصبتَ ' + Math.round(sc * 4) + ' من 4', Math.round(sc * 4) + ' of 4 correct') : t('إجابةٌ خاطئة', 'Incorrect')) + '</b>';
    if (q) {
      if (it.kind === 'tf') h += '<p>' + (it.truth ? t('العبارةُ صحيحة.', 'The statement is true.') : t('العبارةُ خاطئة. الصحيح: ', 'The statement is false. Correct answer: ') + '<span dir="auto">' + rich(q.opts[lang][q.ans]) + '</span>') + '</p>';
      else if (!ok) h += '<p>' + t('الصحيح: ', 'Correct answer: ') + '<span dir="auto">' + rich(q.opts[lang][q.ans]) + '</span></p>';
      if (q.exp[lang]) h += '<p class="qz-exp" dir="auto">' + rich(q.exp[lang]) + '</p>';
    }
    return h + '</div>';
  }

  function guard(msg, acts) {
    var g = $('qz-guard'); if (!g) return;
    g.innerHTML = '<div class="gsf-guard qz-g"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><p>' + msg + '</p><div class="gsf-acts">' + acts + '</div></div>';
  }

  function onRunClick(e) {
    var b = e.target.closest('button'); if (!b || !S.run) return;
    var r = S.run, d = b.dataset;
    if (d.opt != null) return answer(r.idx, Number(d.opt));
    if (d.tf != null) return answer(r.idx, d.tf === '1');
    if (d.ms != null) {
      if (r.locked[r.idx]) return;
      var a0 = (r.answers[r.idx] || [null, null, null, null]).slice(), si = Number(d.ms);
      if (a0[si] != null && S.matchAct === si) a0[si] = null;
      S.matchAct = si;
      r.answers[r.idx] = a0.every(function (x) { return x == null; }) ? null : a0;
      saveRun(); renderRun(); return;
    }
    if (d.mb != null) {
      if (r.locked[r.idx]) return;
      matchPick(Number(d.mb)); return;
    }
    if (d.go != null) return go(Number(d.go));
    if (d.strike != null) {
      var sl = r.strike[r.idx] = (r.strike[r.idx] || []).slice(), sv = Number(d.strike), sp = sl.indexOf(sv);
      if (sp >= 0) sl.splice(sp, 1); else sl.push(sv);
      saveRun(); renderRun(); return;
    }
    if (d.kp != null) {
      var ki = Number(d.ki), kq = qOf(r.items[ki]), ea = essayAns(ki);
      ea.ticks = essayTicks(ki, kq).slice();
      ea.ticks[Number(d.kp)] = !ea.ticks[Number(d.kp)];
      r.answers[ki] = ea;
      saveRun();
      if (S.view === 'run') renderRun(); else { renderResultTop(); renderReviewList(); }
      return;
    }
    switch (d.run) {
      case 'flag':
        r.flags[r.idx] = !r.flags[r.idx];
        var it = r.items[r.idx];
        if (it.key) setFlag(it.key, r.flags[r.idx]);
        saveRun(); renderRun(); return;
      case 'guess': r.guess[r.idx] = !r.guess[r.idx]; saveRun(); renderRun(); return;
      case 'essay-check':
        var ta = $('qz-essay'); if (ta) r.answers[r.idx] = { text: ta.value };
        r.locked[r.idx] = true; saveRun(); renderRun(); return;
      case 'hint': r.hintUsed[r.idx] = true; saveRun(); renderRun(); return;
      case 'check': lockQ(r.idx); renderRun(); return;
      case 'skip':
        if (r.cfg.mode === 'practice') { lockQ(r.idx); renderRun(); } return;
      case 'next':
        if (r.idx < r.items.length - 1) go(r.idx + 1); else finish(false); return;
      case 'prev': go(r.idx - 1); return;
      case 'grid':
        var nav = $('qz-nav'); if (nav) { var open = nav.classList.toggle('open'); b.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) nav.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
        return;
      case 'submit':
        var left = r.items.filter(function (x, i) { return !QB.answered(x, r.answers[i]); }).length;
        if (left) return guard(t('بقي ' + left + ' ' + qWord(left) + ' بلا إجابة — لن تُسجَّل أخطاءً، لكنّها تُحسب من الدرجة كما في الاختبار الحقيقيّ. سلِّمْ على أيِّ حال؟', left + ' ' + qWord(left) + ' unanswered — not recorded as mistakes, but they count against the score as in a real exam. Submit anyway?'),
          '<button type="button" class="gsf-btn gsf-btn--go" data-run="submit-yes">' + t('سلِّمْ', 'Submit') + '</button><button type="button" class="gsf-btn gsf-btn--ghost" data-run="guard-no">' + t('أكمِلْ', 'Keep going') + '</button>');
        return finish(false);
      case 'submit-yes': return finish(false);
      case 'quit':
        var done = r.items.filter(function (x, i) { return QB.answered(x, r.answers[i]); }).length;
        return guard(t('أجبتَ عن ' + done + ' من ' + r.items.length + '. ماذا تريد؟', 'You answered ' + done + ' of ' + r.items.length + '. What would you like to do?'),
          (done ? '<button type="button" class="gsf-btn gsf-btn--go" data-run="quit-score" title="' + esc(t('تُحسب ما أجبتَه وحدَه، ولا يُسجَّل ما لم تُجِبه خطأً', 'Only what you answered is scored; unanswered questions are not recorded as mistakes')) + '">' + t('أنهِ واحسبْ ما أجبتُه', 'End and score my answers') + '</button>' : '') +
          '<button type="button" class="gsf-btn" data-run="quit-save">' + t('احفظْه لأكمله لاحقاً', 'Save to finish later') + '</button>' +
          '<button type="button" class="gsf-btn gsf-btn--danger" data-run="quit-drop" title="' + esc(t('لا نتيجةَ ولا سجلَّ ولا أخطاء — كأنّك لم تبدأ', 'No score, no record, no mistakes — as if you never started')) + '">' + t('اخرجْ بلا تسجيل', 'Leave without recording') + '</button>' +
          '<button type="button" class="gsf-btn gsf-btn--ghost" data-run="guard-no">' + t('أكمِلْ', 'Keep going') + '</button>');
      case 'quit-score': return finish(false, true);
      case 'quit-drop':
        if (r.cfg.mode === 'practice') unrecord(r);
        drop(K.run); stopTick(); S.run = null; show('setup'); renderSetup(); reloadBanks(); return;
      case 'quit-save': saveRun(); stopTick(); S.run = null; show('setup'); renderSetup(); return;
      case 'guard-no': var g = $('qz-guard'); if (g) g.innerHTML = ''; return;
    }
  }

  function onRunInput(e) {
    var ta = e.target;
    if (!ta || ta.id !== 'qz-essay' || !S.run) return;
    var i = Number(ta.dataset.ess);
    S.run.answers[i] = ta.value.trim() ? { text: ta.value } : null;
    var wc = $('qz-wc'); if (wc) wc.textContent = QB.wordCount(ta.value);
    clearTimeout(S.essT); S.essT = setTimeout(saveRun, 600);
    var nb = document.querySelector('.qz-nb.cur'); if (nb) nb.classList.toggle('ans', !!ta.value.trim());
  }
  function onKey(e) {
    if (S.view !== 'run' || !S.run) return;
    var tg = e.target;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    var r = S.run, it = r.items[r.idx], k = e.key, lk = k.length === 1 ? k.toLowerCase() : k;
    var handled = true;
    var rtl = document.documentElement.dir === 'rtl';
    if (/^[1-9]$/.test(k)) {
      var i = Number(k) - 1;
      if (it.kind === 'mcq' && i < it.order.length) answer(r.idx, i);
      else if (it.kind === 'tf' && i < 2) answer(r.idx, i === 0);
      else if (it.kind === 'match' && i < 4 && !r.locked[r.idx]) { S.matchAct = i; renderRun(); }
      else handled = false;
    } else if (it.kind === 'mcq' && /^[a-f]$/.test(lk) && 'abcdef'.indexOf(lk) < it.order.length && lk !== 'f') answer(r.idx, 'abcdef'.indexOf(lk));
    else if (it.kind === 'match' && !r.locked[r.idx] && /^[a-d]$/.test(lk)) matchPick(it.order['abcd'.indexOf(lk)]);
    else if (it.kind === 'tf' && (lk === 't' || lk === 'y' || lk === 'ص')) answer(r.idx, true);
    else if (it.kind === 'tf' && (lk === 'f' || lk === 'n' || lk === 'خ')) answer(r.idx, false);
    else if (lk === 'h' && r.cfg.mode === 'practice') { var hb = document.querySelector('[data-run="hint"]'); if (hb) hb.click(); else handled = false; }
    else if (lk === 'm' || lk === 'b') { var fb = document.querySelector('[data-run="flag"]'); if (fb) fb.click(); }
    else if (lk === 'g') { var gb = document.querySelector('[data-run="guess"]'); if (gb) gb.click(); else handled = false; }
    else if (k === 'Enter' || (k === ' ' && r.cfg.mode === 'practice')) {
      var nb = document.querySelector('[data-run="next"].qz-next') || (r.cfg.mode === 'exam' ? document.querySelector('[data-run="next"]') : null);
      if (nb) nb.click(); else handled = false;
    }
    else if (k === (rtl ? 'ArrowLeft' : 'ArrowRight')) { if (r.cfg.mode === 'exam' || r.locked[r.idx]) { if (r.idx < r.items.length - 1) go(r.idx + 1); } else handled = false; }
    else if (k === (rtl ? 'ArrowRight' : 'ArrowLeft')) { if (r.cfg.mode === 'exam') go(r.idx - 1); else handled = false; }
    else if (lk === 't' || lk === 'l' || k === '+' || k === '-' || k === '=' || k === '_') { }
    else handled = false;
    if (handled) { e.preventDefault(); e.stopPropagation(); }
  }

  function finish(timeUp, partial) {
    var r = S.run; if (!r || r.done) return;
    stopTick();
    r.done = true;
    var total = r.items.length, s = 0, wrong = [], skip = [], byMod = {}, byDiff = {}, byStyle = {}, byKind = {};
    function add(map, k, sc) { var m = map[k] = map[k] || [0, 0]; m[0] += sc; m[1] += 1; }
    r.items.forEach(function (it, i) {
      var q = qOf(it);
      if (!QB.answered(it, r.answers[i])) { skip.push(i); return; }
      var sc = QB.grade(it, r.answers[i], q);
      s += sc;
      recordOne(i);
      if (sc < 1) wrong.push(i);
      add(byKind, it.kind, sc);
      if (q) {
        add(byMod, q.code + ':' + q.module, sc);
        add(byDiff, q.diff, sc);
        if (q.style) add(byStyle, q.style, sc);
      } else {
        var c0 = S.cardIndex[it.keys[0]];
        if (c0) add(byMod, c0.code + ':' + c0.module, sc);
      }
    });
    var done = total - skip.length;
    var outOf = partial ? done : total;
    r.result = { s: s, t: outOf, done: done, total: total, partial: !!partial, byMod: byMod, byDiff: byDiff, byStyle: byStyle, byKind: byKind, wrong: wrong, skip: skip, timeUp: timeUp };
    if (done) {
      var hist = get(K.hist, []);
      hist.push({
        at: Date.now(), codes: r.cfg.codes.slice(), n: outOf, s: Math.round(s * 100) / 100, t: outOf, dur: Math.round(r.elapsed), mode: r.cfg.mode,
        wrong: wrong.map(function (i) { return r.items[i]; }).slice(0, 100)
      });
      if (hist.length > HIST_CAP) hist = hist.slice(hist.length - HIST_CAP);
      put(K.hist, hist);
    }
    drop(K.run);
    if (!skip.length && !partial) logToPrediction(r, s);
    S.review = wrong.length ? 'wrong' : skip.length ? 'skip' : 'all';
    show('result');
    renderResult();
    if (outOf >= 10 && s / outOf >= 0.9) { try { if (window.Garden && Garden.launchConfetti && !matchMedia('(prefers-reduced-motion: reduce)').matches) Garden.launchConfetti(); } catch (e) {} }
    try { if (window.GardenEv) GardenEv('custom_quiz', { n: total, a: done, pct: outOf ? Math.round(s / outOf * 100) : 0, m: r.cfg.mode, k: r.cfg.types.join('+') }); } catch (e) {}
  }
  function logToPrediction(r, s) {
    if (r.cfg.mode !== 'exam' || r.items.length < 10 || r.cfg.codes.length !== 1) return;
    var c = r.cfg.codes[0], sc = (r.cfg.scope || {})[c];
    if (sc !== 'mid' && sc !== 'fin') return;
    if ((r.cfg.modules[c] || []).length) return;
    if (r.cfg.source && r.cfg.source !== 'all') return;
    if (r.items.some(function (it) { return it.kind !== 'mcq'; })) return;
    try { if (window.Garden && Garden.recordQuiz) Garden.recordQuiz(c, sc === 'mid' ? 'midterm' : 'final', s, r.items.length); } catch (e) {}
  }

  function bars(map, labelFn, sortFn) {
    var keys = Object.keys(map);
    if (sortFn) keys.sort(sortFn);
    return keys.map(function (k) {
      var v = map[k], p = v[0] / v[1];
      var lb = labelFn(k);
      return '<div class="qz-brow"><span class="qz-bl" title="' + esc(lb.replace(/<[^>]+>/g, '')) + '">' + lb + '</span><span class="qz-bb" data-tone="' + toneOf(p * 100) + '" style="--v:' + p.toFixed(3) + '"></span><span class="qz-bv">' + num(fmtScore(v[0])) + '/' + num(v[1]) + '</span></div>';
    }).join('');
  }
  function weakest(res) {
    var best = null;
    [['byMod', function (k) { var p = k.split(':'); return modLabel(p[0], Number(p[1]), true); }],
     ['byStyle', function (k) { return t('أسئلةُ «' + STYLE[k].ar + '»', '“' + STYLE[k].en + '” questions'); }],
     ['byDiff', function (k) { return t('الأسئلةُ ال' + (k === 'easy' ? 'سهلة' : k === 'hard' ? 'صعبة' : 'متوسّطة'), DIFF[k].en.toLowerCase() + ' questions'); }]].forEach(function (pair) {
      var map = res[pair[0]];
      Object.keys(map).forEach(function (k) {
        var v = map[k];
        if (v[1] < 3) return;
        var p = v[0] / v[1];
        if (!best || p < best.p) best = { p: p, label: pair[1](k), v: v };
      });
    });
    return best && best.p < 0.7 ? best : null;
  }

  function rescore() {
    var r = S.run, res = r.result, s = 0, wrong = [];
    r.items.forEach(function (it, i) {
      if (!QB.answered(it, r.answers[i])) return;
      var sc = QB.grade(it, r.answers[i], qOf(it));
      s += sc;
      if (sc < 1) wrong.push(i);
    });
    res.s = s; res.wrong = wrong;
  }
  function renderResultTop() {
    var r = S.run, res = r.result, el = $('qz-res-head'); if (!el) return;
    rescore();
    var pct = res.t ? Math.round(res.s / res.t * 100) : 0;
    var d = D();
    var grade = d && d.gradeOfPercent && !res.partial ? d.gradeOfPercent(pct) : '';
    var hist = get(K.hist, []);
    var prev = null;
    for (var i = hist.length - 2; i >= 0; i--) { if (hist[i].codes.join() === r.cfg.codes.join()) { prev = hist[i]; break; } }
    var delta = prev && res.done ? pct - Math.round(prev.s / prev.t * 100) : null;
    var w = weakest(res);
    var lucky = r.items.filter(function (it, i) { return r.guess[i] && QB.answered(it, r.answers[i]) && QB.grade(it, r.answers[i], qOf(it)) === 1; }).length;
    var essays = r.items.filter(function (it, i) { return it.kind === 'essay' && QB.answered(it, r.answers[i]); }).length;
    var notes = [];
    if (res.partial) notes.push(['fa-scale-balanced', t('حُسب ما أجبتَه وحدَه: ' + res.done + ' من ' + res.total + '.', 'Only what you answered is scored: ' + res.done + ' of ' + res.total + '.')]);
    if (res.skip.length) notes.push(['fa-forward', t('لم تُجِب عن ' + res.skip.length + ' — لم تُسجَّل أخطاءً ولن تدخل «أخطائي».', res.skip.length + ' unanswered — not recorded as mistakes and kept out of “My mistakes”.')]);
    if (lucky) notes.push(['fa-circle-question', t('أصبتَ ' + lucky + ' تخميناً — ستعود إليك غداً لتثبّتها.', lucky + ' right by guessing — they come back tomorrow to make them stick.')]);
    if (essays) notes.push(['fa-pen-nib', t('درجةُ المقاليّ من نقاطه المفتاحيّة — راجعْ علاماتِها في القائمة أدناه وصحّحْها بنفسك.', 'Essay scores come from their key points — check and correct the ticks in the list below.')]);
    if (res.timeUp) notes.push(['fa-hourglass-end', t('انتهى الوقت.', 'Time ran out.')]);
    el.innerHTML = '<div class="qz-res-top">' +
      '<div class="qz-ring" data-tone="' + toneOf(pct) + '" style="--v:' + (pct / 100).toFixed(3) + '"><b>' + num(pct + '٪') + '</b></div>' +
      '<div class="qz-res-txt"><h1>' + (!res.done ? t('لم تُجِب عن شيء', 'Nothing answered') : pct >= 90 ? t('ممتاز', 'Excellent') : pct >= 75 ? t('أداءٌ جيّد', 'Good work') : pct >= 50 ? t('في الطريق', 'Getting there') : t('بداية — راجعْ أخطاءك', 'A start — review your mistakes')) + '</h1>' +
        '<p>' + num(fmtScore(res.s)) + ' ' + t('من', 'of') + ' ' + num(res.t) + (grade ? ' · ' + t('تقدير ', 'grade ') + code(grade) : '') + ' · ' + clock(r.elapsed) + '</p>' +
        (delta != null ? '<p class="qz-delta" data-up="' + (delta >= 0 ? 1 : 0) + '"><i class="fa-solid ' + (delta >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down') + '" aria-hidden="true"></i> ' + (delta >= 0 ? '+' : '') + num(delta) + ' ' + t('نقطةً عن آخر اختبارٍ لهذه الموادّ', 'points vs your last test on these courses') + '</p>' : '') +
      '</div></div>' +
      (notes.length ? '<ul class="qz-notes">' + notes.map(function (n) { return '<li><i class="fa-solid ' + n[0] + '" aria-hidden="true"></i> ' + n[1] + '</li>'; }).join('') + '</ul>' : '') +
      (w ? '<p class="qz-insight"><i class="fa-solid fa-magnifying-glass-chart" aria-hidden="true"></i> ' + t('نقطةُ ضعفك هنا: ', 'Your weak spot: ') + w.label + ' — ' + num(fmtScore(w.v[0])) + ' ' + t('من', 'of') + ' ' + num(w.v[1]) + '</p>' : '');
    var rb = $('qz-redo-n'); if (rb) rb.textContent = res.wrong.length;
    document.querySelectorAll('[data-rf]').forEach(function (c) { var k = c.dataset.rf, n = reviewCount(k); var x = c.querySelector('.qz-cnt'); if (x) x.innerHTML = num(n); });
  }
  function reviewCount(k) {
    var r = S.run, res = r.result;
    if (k === 'wrong') return res.wrong.length;
    if (k === 'skip') return res.skip.length;
    if (k === 'flag') return r.flags.filter(Boolean).length;
    if (k === 'right') return res.done - res.wrong.length;
    return res.total;
  }

  function renderResult() {
    var r = S.run, res = r.result, el = $('qz-result');
    rescore();
    var h = '<div id="qz-res-head"></div>';
    h += '<div class="qz-res-acts">' +
      '<button type="button" class="gsf-btn gsf-btn--go" data-res="redo"' + (res.wrong.length ? '' : ' hidden') + '><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> ' + t('أعِدْ ما أخطأتُه', 'Retry my mistakes') + ' (<span id="qz-redo-n">' + res.wrong.length + '</span>)</button>' +
      '<button type="button" class="gsf-btn" data-res="print"><i class="fa-solid fa-print" aria-hidden="true"></i> ' + t('اطبعْ للمراجعة', 'Print for review') + '</button>' +
      '<button type="button" class="gsf-btn" data-res="again"><i class="fa-solid fa-shuffle" aria-hidden="true"></i> ' + t('اختبارٌ جديدٌ بالإعدادات نفسِها', 'New test, same settings') + '</button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost" data-res="setup"><i class="fa-solid fa-sliders" aria-hidden="true"></i> ' + t('غيِّرِ الإعدادات', 'Change settings') + '</button>' +
      '</div>';
    h += '<div id="qz-print-opts"></div>';
    if (res.done) {
      h += '<div class="qz-breaks">' +
        '<section class="gsf-card"><h2 class="gsf-card-h"><i class="fa-solid fa-layer-group" aria-hidden="true"></i>' + t('بالوحدة', 'By module') + '</h2>' +
          bars(res.byMod, function (k) { var p = k.split(':'); return modLabel(p[0], Number(p[1]), r.cfg.codes.length > 1); },
            function (a, b) { var A = a.split(':'), B = b.split(':'); return A[0] === B[0] ? A[1] - B[1] : A[0] < B[0] ? -1 : 1; }) + '</section>' +
        (Object.keys(res.byDiff).length ? '<section class="gsf-card"><h2 class="gsf-card-h"><i class="fa-solid fa-signal" aria-hidden="true"></i>' + t('بالصعوبة', 'By difficulty') + '</h2>' +
          bars(res.byDiff, function (k) { return t(DIFF[k].ar, DIFF[k].en); }, function (a, b) { return QB.DIFFS.indexOf(a) - QB.DIFFS.indexOf(b); }) + '</section>' : '') +
        (Object.keys(res.byStyle).length ? '<section class="gsf-card"><h2 class="gsf-card-h"><i class="fa-solid fa-brain" aria-hidden="true"></i>' + t('بنمط السؤال', 'By question style') + '</h2>' +
          bars(res.byStyle, function (k) { return t(STYLE[k].ar, STYLE[k].en); }, function (a, b) { return QB.STYLES.indexOf(a) - QB.STYLES.indexOf(b); }) + '</section>' : '') +
        (Object.keys(res.byKind).length > 1 ? '<section class="gsf-card"><h2 class="gsf-card-h"><i class="fa-solid fa-shapes" aria-hidden="true"></i>' + t('بالنوع', 'By type') + '</h2>' +
          bars(res.byKind, function (k) { return t(KIND[k].ar, KIND[k].en); }) + '</section>' : '') +
        '</div>';
    }
    h += '<h2 class="qz-h2">' + t('راجعِ الأسئلة', 'Review the questions') + '</h2>' +
      '<div class="gsf-chips qz-rf">' + [['wrong', 'الخطأ', 'Wrong'], ['right', 'الصحيح', 'Right'], ['skip', 'لم أُجِبْ', 'Unanswered'], ['flag', 'المعلَّم', 'Bookmarked'], ['all', 'الكلّ', 'All']].map(function (x) {
        return chip('data-rf="' + x[0] + '"', S.review === x[0], t(x[1], x[2]) + ' <span class="qz-cnt">' + num(reviewCount(x[0])) + '</span>');
      }).join('') + '</div>' +
      '<ol class="qz-rlist" id="qz-rlist"></ol>';
    el.innerHTML = h;
    renderResultTop();
    renderReviewList();
  }
  function reviewIdx() {
    var r = S.run, out = [];
    r.items.forEach(function (it, i) {
      var done = QB.answered(it, r.answers[i]);
      var sc = done ? QB.grade(it, r.answers[i], qOf(it)) : 0;
      if (S.review === 'wrong' && (!done || sc === 1)) return;
      if (S.review === 'right' && (!done || sc < 1)) return;
      if (S.review === 'skip' && done) return;
      if (S.review === 'flag' && !r.flags[i]) return;
      out.push(i);
    });
    return out;
  }
  function renderReviewList() {
    var r = S.run, lang = L(), el = $('qz-rlist'); if (!el) return;
    var idx = reviewIdx();
    if (!idx.length) { el.innerHTML = '<li class="qz-empty">' + t('لا أسئلةَ في هذا التصنيف.', 'No questions in this filter.') + '</li>'; return; }
    el.innerHTML = idx.map(function (i) {
      var it = r.items[i], q = qOf(it), a = r.answers[i], done = QB.answered(it, a), sc = done ? QB.grade(it, a, q) : 0;
      var state = !done ? 'skip' : sc === 1 ? 'ok' : it.kind === 'essay' && sc >= 0.6 ? 'part' : 'no';
      var badge = { ok: ['fa-circle-check', 'صحيح', 'Right'], no: ['fa-circle-xmark', 'خطأ', 'Wrong'], part: ['fa-circle-half-stroke', 'جزئيّ', 'Partial'], skip: ['fa-forward', 'لم تُجِب', 'Unanswered'] }[state];
      var h = '<li class="qz-ri" data-state="' + state + '">' +
        '<div class="qz-ri-h"><span class="qz-ri-n">' + num(i + 1) + '</span>' +
        '<span class="qz-ri-st"><i class="fa-solid ' + badge[0] + '" aria-hidden="true"></i> ' + t(badge[1], badge[2]) + (it.kind === 'essay' && done ? ' · ' + num(Math.round(sc * 100) + '٪') : '') + '</span>' +
        '<span class="qz-kind"><i class="fa-solid ' + KIND[it.kind].icon + '" aria-hidden="true"></i> ' + t(KIND[it.kind].ar, KIND[it.kind].en) + '</span>' +
        (q ? '<span class="qz-diff" data-tone="' + DIFF[q.diff].tone + '">' + t(DIFF[q.diff].ar, DIFF[q.diff].en) + '</span>' : '') +
        (r.guess[i] ? '<span class="qz-ri-g"><i class="fa-solid fa-circle-question" aria-hidden="true"></i> ' + t('تخمين', 'Guess') + '</span>' : '') +
        '<button type="button" class="qz-tb qz-tb--sm' + (r.flags[i] ? ' on' : '') + '" data-rflag="' + i + '" aria-pressed="' + (r.flags[i] ? 'true' : 'false') + '" title="' + esc(t('علِّمْه ليعود إليك في «ما علّمتُه»', 'Mark it to find it in “Bookmarked”')) + '"><i class="fa-' + (r.flags[i] ? 'solid' : 'regular') + ' fa-bookmark" aria-hidden="true"></i><span>' + (r.flags[i] ? t('معلَّم', 'Marked') : t('علِّمْه', 'Mark')) + '</span></button></div>';
      if (it.kind === 'match') {
        var cards = it.keys.map(function (k) { return S.cardIndex[k]; });
        h += '<ul class="qz-ri-match">' + cards.map(function (c, pi) {
          var mine = a && a[pi] != null ? cards[a[pi]].back[lang] : null;
          var good = a && a[pi] === pi;
          return '<li class="' + (good ? 'ok' : 'no') + '"><span dir="auto">' + rich(c.front[lang]) + '</span> ⟵ <b dir="auto">' + rich(c.back[lang]) + '</b>' + (!good && mine ? ' <s dir="auto">' + rich(mine) + '</s>' : '') + '</li>';
        }).join('') + '</ul>';
      } else if (it.kind === 'essay') {
        var ea = essayAns(i);
        h += '<p class="qz-ri-q" dir="auto">' + rich(q.q[lang]) + '</p>' +
          '<div class="qz-ess-mine"><span>' + t('إجابتُك', 'Your answer') + '</span><p dir="auto">' + (ea.text ? esc(ea.text) : '<i>' + t('لم تكتب شيئاً', 'You wrote nothing') + '</i>') + '</p></div>' +
          (done ? kpList(i, q, lang, true) : '') + modelAnswer(q, lang, !done) +
          '<p class="qz-ri-src">' + (q.module ? modLabel(q.code, q.module, true) : code(q.code)) + '</p>';
      } else {
        h += '<p class="qz-ri-q" dir="auto">' + rich(q.q[lang]) + '</p>';
        if (it.kind === 'tf') {
          h += '<p class="qz-ri-claim" dir="auto">' + t('الجوابُ المقترح: ', 'Proposed answer: ') + rich(q.opts[lang][it.shown]) + '</p>' +
            '<p class="qz-ri-a">' + t('الحكم: ', 'Verdict: ') + '<b>' + (it.truth ? t('صحيح', 'True') : t('خطأ', 'False')) + '</b>' + (a != null && a !== it.truth ? ' · ' + t('إجابتُك: ', 'You said: ') + (a ? t('صحيح', 'True') : t('خطأ', 'False')) : '') + '</p>';
        } else {
          h += '<ul class="qz-ri-opts">' + it.order.map(function (oi, di) {
            var cls = oi === q.ans ? 'ok' : a === di ? 'no' : '';
            return '<li class="' + cls + '" dir="auto">' + rich(q.opts[lang][oi]) + (oi === q.ans ? ' <i class="fa-solid fa-check" aria-hidden="true"></i>' : a === di ? ' <i class="fa-solid fa-xmark" aria-hidden="true"></i>' : '') + '</li>';
          }).join('') + '</ul>';
        }
        if (q.exp[lang]) h += '<p class="qz-exp" dir="auto">' + rich(q.exp[lang]) + '</p>';
        h += '<p class="qz-ri-src">' + (q.module ? modLabel(q.code, q.module, true) : code(q.code)) + (q.topic ? ' · <span dir="ltr">' + esc(q.topic.replace(/-/g, ' ')) + '</span>' : '') + '</p>';
      }
      return h + '</li>';
    }).join('');
    typeset(el);
  }

  function printOpts() {
    var el = $('qz-print-opts'); if (!el) return;
    if (el.innerHTML) { el.innerHTML = ''; return; }
    var r = S.run, wrongN = r.result.wrong.length, flagN = r.flags.filter(Boolean).length;
    el.innerHTML = '<div class="gsf-card qz-popts"><h2 class="gsf-card-h"><i class="fa-solid fa-print" aria-hidden="true"></i>' + t('ماذا تطبع؟', 'What to print?') + '</h2>' +
      '<div class="gsf-chips" id="qz-p-what">' +
        chip('data-pw="wrong"', wrongN > 0, t('ما أخطأتُه', 'My mistakes') + ' <span class="qz-cnt">' + num(wrongN) + '</span>') +
        chip('data-pw="flag"', wrongN === 0 && flagN > 0, t('ما علّمتُه', 'Bookmarked') + ' <span class="qz-cnt">' + num(flagN) + '</span>') +
        chip('data-pw="all"', wrongN === 0 && flagN === 0, t('الاختبارُ كلُّه', 'The whole test') + ' <span class="qz-cnt">' + num(r.items.length) + '</span>') +
      '</div><div class="gsf-chips" id="qz-p-how">' +
        chip('data-ph="ans"', true, t('مع الإجابات والشرح', 'With answers and explanations')) +
        chip('data-ph="sheet"', false, t('ورقةُ اختبار ومفتاحٌ في آخرها', 'Test sheet, answer key at the end')) +
      '</div><div class="gsf-acts"><button type="button" class="gsf-btn gsf-btn--go" data-res="print-go"><i class="fa-solid fa-print" aria-hidden="true"></i> ' + t('اطبعْ', 'Print') + '</button></div></div>';
  }
  function doPrint() {
    var r = S.run, lang = L();
    var what = (document.querySelector('#qz-p-what .on') || {}).dataset;
    var how = (document.querySelector('#qz-p-how .on') || {}).dataset;
    what = what ? what.pw : 'wrong'; how = how ? how.ph : 'ans';
    var idx = r.items.map(function (_, i) { return i; }).filter(function (i) {
      if (what === 'wrong') return r.result.wrong.indexOf(i) >= 0;
      if (what === 'flag') return r.flags[i];
      return true;
    });
    if (!idx.length) return;
    var L4 = isAr() ? ['أ', 'ب', 'ج', 'د', 'هـ', 'و'] : ['A', 'B', 'C', 'D', 'E', 'F'];
    var key = [];
    var body = idx.map(function (i, n) {
      var it = r.items[i], q = qOf(it);
      var h = '<li class="qp-q"><div class="qp-h"><b>' + (n + 1) + '.</b>';
      if (it.kind === 'match') {
        var cards = it.keys.map(function (k) { return S.cardIndex[k]; });
        h += ' ' + t('صِلْ كلَّ عبارةٍ بما يقابلها', 'Match each prompt with its answer') + '</div><table class="qp-m"><tbody>' +
          cards.map(function (c, pi) { return '<tr><td>' + (pi + 1) + '. ' + rich(c.front[lang]) + '</td><td>' + L4[pi] + '. ' + rich(cards[it.order[pi]].back[lang]) + '</td></tr>'; }).join('') + '</tbody></table>';
        var mk = cards.map(function (c, pi) { return (pi + 1) + '←' + L4[it.order.indexOf(pi)]; }).join('، ');
        if (how === 'ans') h += '<p class="qp-a">' + mk + '</p>'; else key.push((n + 1) + ': ' + mk);
      } else {
        h += ' <span dir="auto">' + rich(q.q[lang]) + '</span></div>';
        if (it.kind === 'tf') {
          h += '<p class="qp-claim">' + t('الجوابُ المقترح: ', 'Proposed answer: ') + '<span dir="auto">' + rich(q.opts[lang][it.shown]) + '</span> — ' + t('صحيح / خطأ', 'True / False') + '</p>';
          var v = it.truth ? t('صحيح', 'True') : t('خطأ', 'False');
          if (how === 'ans' && !it.truth) v += ' — ' + t('الصحيح: ', 'Correct: ') + '<span dir="auto">' + rich(q.opts[lang][q.ans]) + '</span>';
          if (how === 'ans') h += '<p class="qp-a">' + v + '</p>'; else key.push((n + 1) + ': ' + v);
        } else {
          h += '<ol class="qp-o" type="A">' + it.order.map(function (oi, di) {
            return '<li class="' + (how === 'ans' && oi === q.ans ? 'qp-ok' : '') + '"><span class="qp-l">' + L4[di] + '.</span> <span dir="auto">' + rich(q.opts[lang][oi]) + '</span></li>';
          }).join('') + '</ol>';
          if (how !== 'ans') key.push((n + 1) + ': ' + L4[it.order.indexOf(q.ans)]);
        }
        if (how === 'ans' && q.exp[lang]) h += '<p class="qp-e" dir="auto">' + rich(q.exp[lang]) + '</p>';
        h += '<p class="qp-src">' + esc(q.code) + (q.module ? ' · ' + t('الوحدة ', 'Module ') + q.module + (modTitle(q.code, q.module) ? ' · ' + esc(modTitle(q.code, q.module)) : '') : '') + '</p>';
      }
      return h + '</li>';
    }).join('');
    var now = new Date().toLocaleDateString(isAr() ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    var title = what === 'wrong' ? t('أسئلتي للمراجعة', 'My questions to review') : what === 'flag' ? t('ما علّمتُه للمراجعة', 'Bookmarked for review') : t('الاختبار', 'The test');
    var p = $('qz-print');
    p.innerHTML = '<header class="qp-top"><h1>' + title + '</h1><p>' + r.cfg.codes.map(function (c) { return esc(c) + ' — ' + esc(cname(c)); }).join(' · ') + ' · ' + esc(now) + ' · ' + idx.length + ' ' + qWord(idx.length) + '</p></header>' +
      '<ol class="qp-list">' + body + '</ol>' +
      (key.length ? '<section class="qp-key"><h2>' + t('مفتاحُ الإجابات', 'Answer key') + '</h2><p>' + key.join(' · ') + '</p></section>' : '') +
      '<footer class="qp-foot">' + t('الحديقةُ الرقميّة', 'Digital Garden') + '</footer>';
    typeset(p);
    setTimeout(function () { window.print(); }, 350);
  }

  function onResultClick(e) {
    var b = e.target.closest('button'); if (!b || !S.run) return;
    var d = b.dataset, r = S.run;
    if (d.rf) { S.review = d.rf; document.querySelectorAll('[data-rf]').forEach(function (c) { var on = c.dataset.rf === d.rf; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); }); renderReviewList(); return; }
    if (d.rflag != null) {
      var i = Number(d.rflag);
      r.flags[i] = !r.flags[i];
      var it = r.items[i]; if (it.key) setFlag(it.key, r.flags[i]);
      renderReviewList(); renderResultTop(); return;
    }
    if (d.kp != null) return onRunClick(e);
    if (d.pw || d.ph) {
      var grp = b.parentElement;
      grp.querySelectorAll('.gsf-chip').forEach(function (c) { c.classList.toggle('on', c === b); c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      return;
    }
    switch (d.res) {
      case 'redo':
        var items = r.result.wrong.map(function (i) { return reorder(r.items[i]); });
        S.cfg = JSON.parse(JSON.stringify(r.cfg));
        if (S.cfg.timer === 'total') S.cfg.minutes = 0;
        return start(QB.shuffle(items, QB.rng(Date.now() & 0x7fffffff)));
      case 'print': return printOpts();
      case 'print-go': return doPrint();
      case 'again': S.cfg = JSON.parse(JSON.stringify(r.cfg)); return start();
      case 'setup': S.run = null; show('setup'); renderSetup(); reloadBanks(); return;
    }
  }
  function reorder(it) {
    var x = JSON.parse(JSON.stringify(it));
    var rr = QB.rng((Date.now() ^ Math.floor(Math.random() * 1e9)) & 0x7fffffff);
    if (x.kind === 'mcq' && S.index[x.key]) x.order = QB.optOrder(S.index[x.key], rr);
    else if (x.order) x.order = QB.shuffle(x.order, rr);
    return x;
  }
  function redoFromHist(i) {
    var h = get(K.hist, [])[i];
    if (!h || !h.wrong || !h.wrong.length) return;
    var need = {};
    h.wrong.forEach(function (it) { (it.key ? [it.key] : []).concat(it.keys || []).forEach(function (k) { need[k.split('.')[0]] = 1; }); });
    var ess = h.wrong.some(function (it) { return it.kind === 'essay'; });
    var ps = Object.keys(need).map(function (c) { return loadCourse(c).then(function () { return ess ? loadEssays(c) : null; }); });
    Promise.all(ps).then(function () {
      var items = h.wrong.filter(function (it) { return it.key ? S.index[it.key] : it.keys.every(function (k) { return S.cardIndex[k]; }); }).map(reorder);
      if (!items.length) return;
      S.cfg.mode = 'practice'; S.cfg.timer = 'none';
      start(items);
    });
  }

  function onLang() {
    if (S.view === 'setup') renderSetup();
    else if (S.view === 'run') renderRun();
    else if (S.view === 'result') renderResult();
    var dlg = $('qz-pick'); if (dlg && dlg.open) openPicker();
  }

  function boot() {
    if (!QB) return;
    S.cfg = loadCfg();
    var setup = $('qz-setup'), run = $('qz-run'), result = $('qz-result'), pick = $('qz-pick');
    setup.addEventListener('click', onSetupClick);
    setup.addEventListener('input', onSetupInput);
    run.addEventListener('click', onRunClick);
    run.addEventListener('input', onRunInput);
    var rz = null;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (S.view === 'run') ensureMeasure(); }, 200); });
    result.addEventListener('click', onResultClick);
    pick.addEventListener('click', onPickClick);
    pick.addEventListener('input', onPickInput);
    pick.addEventListener('close', function () { if (S.view === 'setup') { reloadBanks(); renderAdv(); } });
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('garden:languageChanged', onLang);
    document.addEventListener('visibilitychange', function () { if (document.hidden) saveRun(); });
    window.addEventListener('pagehide', saveRun);
    window.addEventListener('beforeprint', function () { document.body.classList.add('qz-printing'); });
    window.addEventListener('afterprint', function () { document.body.classList.remove('qz-printing'); });
    show('setup');
    renderSetup();
    var d = D();
    (d && d.ready ? d.ready() : Promise.resolve()).then(function () {
      S.cfg.codes = S.cfg.codes.filter(hasBank);
      if (!S.cfg.codes.length) S.cfg.codes = myCodes().slice(0, 1);
      renderSetup();
      reloadBanks();
    });
  }

  window.GardenQuiz = { _state: S };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
