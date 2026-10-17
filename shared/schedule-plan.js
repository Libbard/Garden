/*@3.SCPJ.1*/
;(function () {
  'use strict';

  var INDEX_PATH = '../shared/data/curriculum_index.json';
  var MAP_BASE = '../';

  var S = null;                 /*@3.SCPJ.2*/
  var index = null;             /*@3.SCPJ.3*/
  var maps = {};                /*@3.SCPJ.4*/
  var modulesCache = {};        /*@3.SCPJ.5*/

  var wizard = null;            /*@3.SCPJ.6*/
  var activeTab = 'midterm';    /*@3.SCPJ.7*/

  var GAP_MIN = 15;             /*@3.SCPJ.8*/
  var DEFAULT_START = '10:00';  /*@3.SCPJ.9*/
  var MAX_SPD = 10;

  function isAr() { return S.isAr(); }
  function esc(s) { return S.escapeH(s); }
  function T(ar, en) { return isAr() ? ar : en; }
  function ENG() { return window.GardenPlanEngine || null; }

  /*@3.SCPJ.10*/
  function loadIndex() {
    if (index) return Promise.resolve(index);
    return fetch(INDEX_PATH).then(function (r) { return r.json(); })
      .then(function (j) { index = (j && j.courses) || {}; return index; })
      .catch(function () { index = {}; return index; });
  }

  function loadMap(path) {
    if (maps[path]) return Promise.resolve(maps[path]);
    return fetch(MAP_BASE + path).then(function (r) { return r.json(); })
      .then(function (j) { maps[path] = j; return j; })
      .catch(function () { maps[path] = { courses: {} }; return maps[path]; });
  }

  /*@3.SCPJ.11*/
  function ownModules(code) {
    var sem = null;
    try { sem = JSON.parse(localStorage.getItem('my_semester') || 'null'); } catch (e) { sem = null; }
    var e = sem && Array.isArray(sem.courses)
      ? sem.courses.filter(function (x) { return x && x.code === code; })[0] : null;
    if (!e || !Array.isArray(e.modules) || !e.modules.length) return null;
    return e.modules.map(function (m, i) {
      return {
        id: m.id || ('M' + (i < 9 ? '0' : '') + (i + 1)),
        title: m.title || ('الوحدة ' + (i + 1)),
        title_en: m.title_en || m.title || ('Module ' + (i + 1)),
        difficulty: Number(m.difficulty) || 5,
        hours: Number(m.hours) || 2,
        topics: []
      };
    });
  }

  function loadModules(code) {
    if (modulesCache[code]) return Promise.resolve(modulesCache[code]);
    var own = ownModules(code);
    if (own) { modulesCache[code] = own; return Promise.resolve(own); }
    return loadIndex().then(function (idx) {
      var entry = idx[code];
      if (!entry || !entry.map) { modulesCache[code] = []; return []; }
      return loadMap(entry.map).then(function (m) {
        var course = (m.courses || {})[code];
        var out = [];
        if (course && course.modules) {
          Object.keys(course.modules).sort().forEach(function (mid) {
            var md = course.modules[mid] || {};
            out.push({
              id: mid,
              title: md.title || mid,
              title_en: md.title_en || md.title || mid,
              difficulty: Number(md.module_difficulty) || 5,
              hours: Number(md.study_hours_estimate) || 2,
              topics: Array.isArray(md.topics) ? md.topics : []
            });
          });
        }
        modulesCache[code] = out;
        return out;
      });
    });
  }

  function loadModulesFor(codes) {
    return Promise.all(codes.map(loadModules)).then(function (all) {
      var out = {};
      codes.forEach(function (c, i) { out[c] = all[i]; });
      return out;
    });
  }

  function modTitle(m) { return isAr() ? m.title : (m.title_en || m.title); }
  function modNum(id) { return parseInt(String(id).replace(/^M/i, ''), 10) || 0; }
  function modOf(code, mid) { return (modulesCache[code] || []).filter(function (m) { return m.id === mid; })[0] || null; }

  /*@3.SCPJ.12*/
  function store() {
    var d = S.data();
    if (!d.intensive || typeof d.intensive !== 'object') d.intensive = { active: null, plans: {}, module_status: {}, updated_at: null };
    if (!d.intensive.plans || typeof d.intensive.plans !== 'object') d.intensive.plans = {};
    if (!d.intensive.module_status || typeof d.intensive.module_status !== 'object') d.intensive.module_status = {};
    return d.intensive;
  }
  function numKey(code, mid) { return code + '_' + modNum(mid); }
  function oldKey(code, mid) { return code + '_' + mid; }
  function moduleStatus(code, mid) {
    var ms = store().module_status;
    var v = ms[numKey(code, mid)];
    if (v === 'mastered' || v === 'unmastered') return v;
    return ms[oldKey(code, mid)] === 'mastered' ? 'mastered' : 'new';
  }
  function isMastered(code, mid) { return moduleStatus(code, mid) === 'mastered'; }
  function setModuleStatus(code, mid, st) {
    var ms = store().module_status;
    if (String(mid) !== String(modNum(mid))) delete ms[oldKey(code, mid)];
    ms[numKey(code, mid)] = st === 'mastered' ? 'mastered' : 'auto';
    try { if (window.GardenData && GardenData.dropProgressCache) GardenData.dropProgressCache(); } catch (e) {}
  }
  function migrateMastery() {
    var ms = store().module_status, n = 0;
    Object.keys(ms).forEach(function (k) {
      var m = /^(.+)_M(\d+)$/i.exec(k);
      if (!m) return;
      var nk = m[1] + '_' + parseInt(m[2], 10);
      if (ms[k] === 'mastered' && ms[nk] !== 'mastered' && ms[nk] !== 'unmastered') ms[nk] = 'mastered';
      delete ms[k];
      n++;
    });
    return n;
  }
  function knownOf(code, mid) {
    if (moduleStatus(code, mid) === 'unmastered') return 0;
    try {
      if (!window.GardenData || !GardenData.courseProgress) return null;
      var p = GardenData.courseProgress(code);
      var sig = p && p.perModule ? p.perModule[modNum(mid) - 1] : null;
      return (sig && typeof sig.score === 'number' && p.known) ? sig.score : null;
    } catch (e) { return null; }
  }
  function persist() {
    store().updated_at = new Date().toISOString();
    S.save();
  }

  /*@3.SCPJ.13*/
  function d2s(d) { return S.fmtLocalDate(d); }
  function s2d(s) { return S.parseLocalDate(s); }
  function addDays(dstr, n) { var d = s2d(dstr); d.setDate(d.getDate() + n); return d2s(d); }
  function dayName(dstr) { return S.DAYS_ORDER[s2d(dstr).getDay()]; }
  function diffDays(a, b) { return Math.round((s2d(b) - s2d(a)) / 86400000); }
  function todayStr() { return d2s(new Date()); }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function shortDate(dstr) {
    var d = s2d(dstr);
    return d.getDate() + ' ' + S.MONTH_NAMES[isAr() ? 'ar' : 'en'][d.getMonth()];
  }
  function dayShort(dstr) { return S.DAY_SHORT[isAr() ? 'ar' : 'en'][dayName(dstr)]; }

  /*@3.SCPJ.15*/
  var busyCache = {};
  function busyOn(dstr) {
    if (busyCache[dstr]) return busyCache[dstr];
    var out = [];
    try {
      S.eventsOnDate(s2d(dstr)).forEach(function (e) {
        if (e.src === 'intensive') return;
        if (e.allDay || e.start == null) return;
        out.push({ s: e.start, e: (e.end != null ? e.end : e.start + 60) });
      });
    } catch (err) { /*@3.SCPJ.16*/ }
    out.sort(function (a, b) { return a.s - b.s; });
    busyCache[dstr] = out;
    return out;
  }
  function clearBusy() { busyCache = {}; }

  function dayEndHour() { var st = S.data().settings || {}; return st.day_end_hour || 23; }
  function engineCtx(extra) {
    var c = {
      today: todayStr(), nowMin: nowMin(), dayEndHour: dayEndHour(),
      busyOn: busyOn, known: knownOf, mastered: isMastered
    };
    if (extra) Object.keys(extra).forEach(function (k) { c[k] = extra[k]; });
    return c;
  }

  /*@3.SCPJ.102*/
  function fieldList(topic, key) {
    var v = isAr() ? topic[key] : (topic[key + '_en'] || topic[key]);
    if (!v) return [];
    if (typeof v === 'string' && v.charAt(0) === '[') {
      try { var j = JSON.parse(v.replace(/'/g, '"')); if (Array.isArray(j)) return j; } catch (e) {}
    }
    return Array.isArray(v) ? v : [String(v)];
  }
  function firstPoint(mod, en) {
    var out = '';
    (mod && mod.topics || []).some(function (t) {
      var v = en ? (t.must_know_en || t.must_know) : t.must_know;
      if (typeof v === 'string' && v.charAt(0) === '[') { try { v = JSON.parse(v.replace(/'/g, '"')); } catch (e) {} }
      var x = Array.isArray(v) ? v[0] : v;
      if (x) { out = String(x); return true; }
      return false;
    });
    return out.length > 110 ? out.slice(0, 107) + '…' : out;
  }

  /*@3.SCPJ.123*/
  function decorate(sessions) {
    sessions.forEach(function (s) {
      if (!s.module) return;
      var m = modOf(s.course, s.module);
      if (!m) return;
      s.title = m.title; s.title_en = m.title_en;
      var a = firstPoint(m, false), b = firstPoint(m, true);
      if (a) s.tip = a; else delete s.tip;
      if (b) s.tip_en = b; else delete s.tip_en;
    });
    return sessions;
  }
  function sessTitle(s) {
    var m = s.module ? modOf(s.course, s.module) : null;
    if (m) return modTitle(m);
    return isAr() ? (s.title || '') : (s.title_en || s.title || '');
  }

  /*@3.SCPJ.57*/
  function openWizard(tab, editExisting) {
    var courses = S.semesterCourses().map(function (c) { return c.code; });
    if (!courses.length) {
      alert(T('أضِف مواد فصلك أولاً من صفحة الفصل.', 'Add your semester courses first.'));
      return;
    }
    if (!ENG()) { alert(T('تعذّر تحميل محرّك الخطة — أعد تحميل الصفحة.', 'The plan engine did not load — reload the page.')); return; }
    clearBusy();
    wizard = {
      step: 1,
      tab: tab || autoTab(),
      all: courses.slice(),
      cfg: {
        start_date: todayStr(),
        exam_dates: {},
        courses: courses.slice(),
        modules: {},
        sessions_per_day: 2,
        session_minutes: 60,
        /*@3.SCPJ.58*/
        parts_mode: 1,
        rest_days: ['friday', 'saturday'],
        spacing: 'off',                     /*@3.SCPJ.59*/
        review_mode: 'auto',
        pace: 'auto',
        max_course_day: 0,
        avoid_conflicts: true,              /*@3.SCPJ.60*/
        window: { start_time: DEFAULT_START, end_time: pad2(dayEndHour()) + ':00' },   /*@3.SCPJ.61*/
        extra_reviews: [],
        day_caps: {}
      },
      mods: {},
      editing: false,
      result: null
    };
    seedExamDates();

    /*@3.SCPJ.62*/
    if (editExisting) {
      var p = normalizePlan(editExisting);
      wizard.editing = true;
      wizard.cfg.start_date = todayStr();
      wizard.cfg.exam_dates = clone(p.exam_dates);
      var live = S.data(), want = wizard.tab === 'midterm' ? 'midterm' : 'final';
      Object.keys(wizard.cfg.exam_dates).forEach(function (c) {
        var x = realExam(live, c, want);
        if (x && x.date && !x.plan_tab) wizard.cfg.exam_dates[c] = x.date;
      });
      wizard.cfg.courses = p.courses.filter(function (c) { return courses.indexOf(c) !== -1; });
      if (!wizard.cfg.courses.length) wizard.cfg.courses = courses.slice();
      ['modules', 'extra_reviews', 'window', 'day_caps'].forEach(function (k) { wizard.cfg[k] = clone(p[k]); });
      ['sessions_per_day', 'session_minutes', 'parts_mode', 'spacing', 'review_mode', 'pace', 'max_course_day'].forEach(function (k) {
        if (p[k] !== undefined) wizard.cfg[k] = p[k];
      });
      wizard.cfg.rest_days = p.rest_days.slice();
      wizard.cfg.avoid_conflicts = p.avoid_conflicts !== false;
      if (!wizard.cfg.window.end_time) wizard.cfg.window.end_time = pad2(dayEndHour()) + ':00';
      wizard.keep = p.sessions.filter(function (s) { return s.done || (s.locked && s.date >= todayStr()); });
      wizard.skip = p.unplaced.filter(function (u) { return u.reason === 'manual'; });
    }
    /*@3.SCPJ.116*/
    wizard.shown = clone(wizard.cfg.exam_dates);

    showWizard();
    loadModulesFor(courses).then(function (m) {
      wizard.mods = m;
      if (!wizard.editing) applyDefaultSelection();
      renderWizard();
    });
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /*@3.SCPJ.63*/
  function focusOf(tab) {
    var fp = (S.data().settings || {}).focus_periods || {};
    return fp[tab] || {};
  }
  function autoTab() {
    var t = todayStr();
    var m = focusOf('midterm'), f = focusOf('final');
    if (f.start && t >= f.start) return 'final';
    if (m.end && t > m.end) return 'final';
    if (m.start && t >= m.start) return 'midterm';
    return activeTab || 'midterm';
  }
  /*@3.SCPJ.64*/
  function seedExamDates() {
    var d = S.data();
    var wantType = wizard.tab === 'midterm' ? 'midterm' : 'final';
    var fp = focusOf(wizard.tab);
    wizard.cfg.exam_dates = {};
    wizard.all.forEach(function (c) {
      if (fp.start) wizard.cfg.exam_dates[c] = fp.start;
    });
    wizard.all.forEach(function (c) {
      var x = realExam(d, c, wantType);
      if (x && x.date) wizard.cfg.exam_dates[c] = x.date;
    });
    wizard.cfg.start_date = todayStr();
  }

  /*@3.SCPJ.115*/
  function realExam(d, code, type) {
    var best = null, rank = -1;
    (d.exams || []).forEach(function (x) {
      if (!x || x.course_code !== code || (x.exam_type || 'exam') !== type) return;
      var r = x.sx_crn ? 2 : (x.plan_tab ? 0 : 1);
      if (r > rank) { best = x; rank = r; }
    });
    return best;
  }

  /*@3.SCPJ.65*/
  /*@3.SCPJ.112*/
  function defaultSelectFor(code) {
    var list = wizard.mods[code] || [];
    var sel = [];
    list.forEach(function (m) {
      var n = modNum(m.id);
      if (wizard.tab === 'midterm' ? n <= 6 : n > 6) sel.push(m.id);
    });
    /*@3.SCPJ.66*/
    wizard.cfg.modules[code] = sel.filter(function (id) { return !isMastered(code, id); });
  }
  function applyDefaultSelection() { wizard.all.forEach(defaultSelectFor); }

  function resetSelection() {
    wizard.cfg.courses.forEach(function (code) { wizard.cfg.modules[code] = []; });
    wizard.result = null;
    renderWizard();
  }

  function showWizard() {
    document.getElementById('modal-plan').style.display = '';
    renderWizard();
  }
  function closeWizard() {
    document.getElementById('modal-plan').style.display = 'none';
    wizard = null;
  }

  function renderWizard() {
    var box = document.getElementById('plan-wizard');
    if (!box || !wizard) return;
    var steps = [
      T('الاختبارات', 'Exams'),
      T('الوحدات', 'Modules'),
      T('الإيقاع', 'Rhythm'),
      T('الخطة', 'The plan')
    ];
    var head = '<div class="ip-steps">' + steps.map(function (s, i) {
      var n = i + 1;
      var cls = wizard.step === n ? ' active' : (wizard.step > n ? ' done' : '');
      return '<span class="ip-step' + cls + '"><span class="ip-step-num">' + n + '</span>' + esc(s) + '</span>';
    }).join('<span class="ip-connector"></span>') + '</div>';

    var body = '';
    if (wizard.step === 1) body = stepDates();
    else if (wizard.step === 2) body = stepModules();
    else if (wizard.step === 3) body = stepRhythm();
    else body = stepResult();

    var nav = '<div class="sch-modal-actions ip-wiz-nav">';
    if (wizard.step < 4) nav += '<button class="sch-btn sch-btn-primary" id="ip-next">' + T('التالي', 'Next') + '</button>';
    if (wizard.step === 4 && wizard.result && wizard.result.ok) {
      nav += '<button class="sch-btn sch-btn-primary" id="ip-save">' +
        (wizard.editing ? T('اعتمد التعديل', 'Save changes') : T('اعتمد الخطة', 'Save plan')) + '</button>';
    }
    if (wizard.step > 1) nav += '<button class="sch-btn sch-btn-secondary" id="ip-back">' + T('رجوع', 'Back') + '</button>';
    nav += '<button class="sch-btn sch-btn-secondary" id="ip-close">' + T('إغلاق', 'Close') + '</button></div>';

    box.innerHTML = head + '<div class="ip-body">' + body + '</div>' + nav;
    bindWizard();
  }

  function stepDates() {
    /*@3.SCPJ.67*/
    var h = wizard.editing
      ? '<div class="ip-note">' + esc(T('تُعدّل الآن خطة ' + (wizard.tab === 'midterm' ? 'الميدتيرم' : 'الفاينل') +
          ' — ما أتممتَه وما نقلتَه بيدك يبقى في مكانه، والباقي يُعاد توزيعه من اليوم.',
          'Editing the ' + wizard.tab + ' plan — what you finished or moved by hand stays put; the rest is laid out again from today.')) + '</div>'
      : '<div class="ip-tabs">' +
        ['midterm', 'final'].map(function (t) {
          return '<button class="ip-tab' + (wizard.tab === t ? ' active' : '') + '" data-ptab="' + t + '">' +
            (t === 'midterm' ? T('ميدتيرم', 'Midterm') : T('فاينل', 'Final')) + '</button>';
        }).join('') + '</div>';

    /*@3.SCPJ.68*/
    var fp = focusOf(wizard.tab);
    if (!fp.start) {
      h += '<p class="sch-editor-hint">' + esc(T('لم تُضبط فترةُ ' + (wizard.tab === 'midterm' ? 'الميدتيرم' : 'الفاينل') +
        ' في إعدادات الجدول — اكتب تاريخ كلِّ اختبارٍ أدناه.',
        'The ' + wizard.tab + ' window is not set in schedule settings — enter each exam date below.')) + '</p>';
    }

    h += '<div class="ip-grid2"><div><label class="sch-label" for="ip-start">' + T('أبدأ المذاكرة من', 'Start studying on') + '</label>' +
      '<input type="date" class="sch-input" id="ip-start" value="' + wizard.cfg.start_date + '"></div></div>';
    h += '<div class="sch-editor-subhead"><span>' + T('المواد وتواريخ اختباراتها', 'Courses & exam dates') +
      '</span><span class="ip-course-count">' +
      T(wizard.cfg.courses.length + ' من ' + wizard.all.length, wizard.cfg.courses.length + ' of ' + wizard.all.length) + '</span></div>';
    var today = todayStr();
    wizard.all.forEach(function (c) {
      var on = wizard.cfg.courses.indexOf(c) !== -1;
      var ex = wizard.cfg.exam_dates[c] || '';
      var left = ex ? diffDays(today, ex) : null;
      var tag = left == null ? '' : left < 0 ? T('مضى', 'passed') : left === 0 ? T('اليوم', 'today') :
        left === 1 ? T('غداً', 'tomorrow') : T('بعد ' + nDays(left), 'in ' + left + ' days');
      h += '<div class="ip-row ip-row-c' + (on ? '' : ' is-out') + '">' +
        '<button type="button" class="ip-inc' + (on ? ' is-on' : '') + '" data-ipinc="' + esc(c) + '"' +
          ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
          ' aria-label="' + esc((on ? T('استبعد ', 'Exclude ') : T('أدرج ', 'Include ')) + S.courseShort(c)) + '">' +
          '<i class="fa-solid fa-check" aria-hidden="true"></i></button>' +
        '<span class="ip-row-label"><span class="ip-dot" style="background:' +
        S.courseColor(c) + '"></span><span class="ip-code">' + esc(S.courseShort(c)) + '</span></span>' +
        '<input type="date" class="sch-input ip-exam" data-code="' + esc(c) + '" value="' + ex + '"' + (on ? '' : ' disabled') +
        ' aria-label="' + esc(T('تاريخ اختبار ', 'Exam date for ') + S.courseShort(c)) + '">' +
        '<span class="ip-left' + (left != null && left <= 3 ? ' is-near' : '') + '">' + esc(tag) + '</span></div>';
    });
    h += '<p class="sch-editor-hint">' + T(
      'التاريخ يُضاف إلى الجدول وصفحة المادة حدثاً لكامل اليوم حتى تحدّد ساعته. ومادّةٌ مضى اختبارُها تخرج من الخطة وحدَها.',
      'Each date is added to the schedule and the course page as an all-day event until you set its hour. A course whose exam has passed leaves the plan on its own.') + '</p>';
    return h;
  }

  function weightOf(code, m) {
    var E = ENG();
    return E ? E.moduleWeight(m, knownOf(code, m.id)).prio : 0.5;
  }

  function stepModules() {
    if (!Object.keys(wizard.mods).length) {
      return '<p class="sch-editor-hint">' + T('جارٍ تحميل الوحدات…', 'Loading modules…') + '</p>';
    }
    var h = '<div class="sch-editor-subhead"><span>' + T('ما يدخل الخطة', 'What goes in the plan') + '</span>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" id="ip-reset">' +
      T('ألغِ كلَّ التحديدات', 'Clear all selections') + '</button></div>';
    h += '<p class="sch-editor-hint">' + T(
      'اضغط الوحدة لتدوير حالتها: داخل الخطة ← خارجها ← أتقنتُها (لا تُوزَّع، وهو الوسمُ نفسُه في صفحة المادة). ونجمةُ ★ للوحدات الأثقل وزناً في الاختبار وما يُبنى عليها — تُقدَّم إن ضاق الوقت.',
      'Tap a module to cycle it: in the plan → out → mastered (never scheduled; the same mark as on the course page). ★ marks the modules that weigh most in the exam and that later modules build on — they come first when time is short.') + '</p>';

    wizard.cfg.courses.forEach(function (code) {
      var list = wizard.mods[code] || [];
      var sel = wizard.cfg.modules[code] || [];
      var ws = list.map(function (m) { return weightOf(code, m); }).sort(function (a, b) { return b - a; });
      var cut = ws.length >= 3 ? ws[Math.max(0, Math.floor(ws.length / 3) - 1)] : 2;
      var hrs = 0;
      list.forEach(function (m) { if (sel.indexOf(m.id) !== -1) hrs += m.hours; });
      h += '<div class="ip-course"><div class="ip-course-head">' +
        '<span class="ip-dot" style="background:' + S.courseColor(code) + '"></span>' +
        '<b class="ip-code">' + esc(S.courseShort(code)) + '</b>' +
        '<span class="ip-course-count">' + sel.length + '/' + list.length + ' · ' + hrs + T(' س', 'h') + '</span>' +
        '<span class="ip-course-acts"><button class="ip-tiny" data-allc="' + esc(code) + '">' + T('الكلّ', 'All') + '</button>' +
        '<button class="ip-tiny" data-nonec="' + esc(code) + '">' + T('لا شيء', 'None') + '</button></span></div>';
      if (!list.length) {
        h += '<p class="sch-editor-hint">' + T('لا بيانات وحدات لهذه المادة.', 'No module data for this course.') + '</p></div>';
        return;
      }
      h += '<div class="ip-mods">';
      list.forEach(function (m) {
        var st = moduleStatus(code, m.id);
        var on = sel.indexOf(m.id) !== -1;
        var cls = st === 'mastered' ? 'is-mastered' : (on ? 'is-on' : 'is-off');
        var key = weightOf(code, m) >= cut && cut <= 1;
        var hrs1 = m.hours + (isAr() ? ' س' : 'h');
        h += '<button class="ip-mod ' + cls + '" data-code="' + esc(code) + '" data-mid="' + esc(m.id) + '" ' +
          'aria-label="' + esc(modNum(m.id) + ' · ' + modTitle(m) + ' · ' + (st === 'mastered' ? T('أتقنتُها', 'mastered') : on ? T('في الخطة', 'in the plan') : T('خارجها', 'out'))) + '" ' +
          'title="' + esc(modTitle(m) + ' · ' + T('صعوبة', 'difficulty') + ' ' + m.difficulty + '/10 · ' + hrs1) + '">' +
          '<span class="ip-mod-n">' + modNum(m.id) + (key ? ' <span class="ip-star" aria-hidden="true">★</span>' : '') + '</span>' +
          '<span class="ip-mod-t">' + esc(modTitle(m)) + '</span>' +
          '<span class="ip-mod-meta"><span class="ip-diff d' + Math.min(3, Math.ceil(m.difficulty / 3.5)) + '">' +
            m.difficulty + '</span><span class="ip-hours">' + esc(hrs1) + '</span></span>' +
          '</button>';
      });
      h += '</div></div>';
    });
    return h;
  }

  function pills(group, list, cur) {
    return '<div class="ip-pills" role="group">' + list.map(function (p) {
      var on = String(cur) === String(p[0]);
      return '<button type="button" class="ip-pill' + (on ? ' active' : '') + '" aria-pressed="' + on + '" data-' + group + '="' + p[0] + '">' +
        esc(String(p[1])) + '</button>';
    }).join('') + '</div>';
  }
  function timePick(id, val, title) {
    return '<div class="sch-timepick" title="' + esc(title) + '"><select class="tp-h" data-title-ar="الساعة" data-title-en="Hour"></select><span class="tp-colon">:</span>' +
      '<select class="tp-m" data-title-ar="الدقيقة" data-title-en="Minute"></select>' +
      '<select class="tp-mer" data-title-ar="صباحاً أو مساءً" data-title-en="AM or PM"></select>' +
      '<input type="hidden" id="' + id + '" value="' + esc(val) + '"></div>';
  }

  function stepRhythm() {
    var c = wizard.cfg;
    var h = '';
    h += '<div class="ip-card-grp"><div class="ip-grp-h"><i class="fa-solid fa-clock" aria-hidden="true"></i>' + T('يومُك', 'Your day') + '</div>';
    h += '<div class="ip-grid2"><div><label class="sch-label">' + T('جلساتٌ في اليوم (حدٌّ أعلى)', 'Sessions per day (max)') + '</label>' +
      '<div class="ip-stepper"><button type="button" class="ip-tiny" data-spdd="-1" aria-label="' + T('أقلّ', 'Fewer') + '">−</button>' +
      '<b id="ip-spd-v">' + c.sessions_per_day + '</b>' +
      '<button type="button" class="ip-tiny" data-spdd="1" aria-label="' + T('أكثر', 'More') + '">+</button></div></div>' +
      '<div><label class="sch-label">' + T('طول الجلسة (دقيقة)', 'Session length (min)') + '</label>' +
      pills('smin', [[30, 30], [45, 45], [60, 60], [90, 90], [120, 120]], c.session_minutes) + '</div></div>';
    h += '<div class="ip-grid2"><div><label class="sch-label">' + T('يبدأ يومي', 'My day starts') + '</label>' + timePick('ip-start-time', c.window.start_time, T('بداية اليوم', 'Day start')) + '</div>' +
      '<div><label class="sch-label">' + T('ينتهي يومي', 'My day ends') + '</label>' + timePick('ip-end-time', c.window.end_time || '23:00', T('نهاية اليوم', 'Day end')) + '</div></div>';
    h += '<label class="sch-label">' + T('أيام الراحة', 'Rest days') + '</label>' +
      '<div class="ip-pills">' + S.DAYS_ORDER.map(function (d) {
        var on = c.rest_days.indexOf(d) !== -1;
        return '<button type="button" class="ip-pill' + (on ? ' active' : '') + '" aria-pressed="' + on + '" data-rest="' + d + '">' +
          esc(S.DAY_SHORT[isAr() ? 'ar' : 'en'][d]) + '</button>';
      }).join('') + '</div>';
    /*@3.SCPJ.70*/
    h += '<label class="sch-label">' + T('إن تعارضت جلسةٌ مع محاضرة', 'If a session clashes with a lecture') + '</label>' +
      pills('avoid', [['1', T('انقلها لأقرب وقتٍ حرّ', 'Move it to the next free time')], ['0', T('اتركها في وقتها', 'Keep its time')]], c.avoid_conflicts !== false ? '1' : '0');
    h += '</div>';

    h += '<div class="ip-card-grp"><div class="ip-grp-h"><i class="fa-solid fa-layer-group" aria-hidden="true"></i>' + T('التوزيع', 'Layout') + '</div>';
    /*@3.SCPJ.69*/
    h += '<label class="sch-label">' + T('جلساتٌ لكلِّ وحدة', 'Sessions per module') + '</label>' +
      pills('parts', [[1, '1'], [2, '2'], [3, '3'], ['auto', T('حسب ساعاتها', 'By its hours')]], c.parts_mode);
    h += '<label class="sch-label">' + T('حدُّ المادّة الواحدة في اليوم', 'Max sessions of one course per day') + '</label>' +
      pills('mcd', [[0, T('تلقائيّ', 'Auto')], [1, '1'], [2, '2'], [3, '3']], c.max_course_day || 0);
    h += '<label class="sch-label">' + T('إيقاع التوزيع', 'Pace') + '</label>' +
      pills('pace', [['auto', T('تلقائيّ', 'Auto')], ['even', T('على المدّة كلِّها', 'Across the whole span')], ['early', T('أنهِ مبكّراً وراجع', 'Finish early, then review')]], c.pace);
    h += '</div>';

    h += '<div class="ip-card-grp"><div class="ip-grp-h"><i class="fa-solid fa-rotate" aria-hidden="true"></i>' + T('المراجعة', 'Review') + '</div>';
    h += '<label class="sch-label">' + T('مراجعةُ ما قبل الاختبار', 'Pre-exam review') + '</label>' +
      pills('revmode', [['auto', T('بعد الوحدات إن بقي وقت', 'After the modules, if time is left')], ['always', T('احجزها دائماً', 'Always reserve it')], ['off', T('بلا مراجعة', 'None')]], c.review_mode);
    /*@3.SCPJ.71*/
    h += '<label class="sch-label">' + T('المراجعة المتباعدة لكلِّ الوحدات', 'Spaced review for every module') + '</label>' +
      pills('spacing', [['off', T('بلا', 'None')], ['lite', T('بعد 3 أيام', 'After 3 days')], ['full', T('بعد 3 و7 أيام', 'After 3 and 7 days')]], c.spacing);
    h += extraReviewsHtml(c);
    h += '</div>';
    h += '<div class="ip-live" id="ip-live">' + liveLine() + '</div>';
    return h;
  }

  function liveLine() {
    var E = ENG();
    if (!E || !wizard) return '';
    var r = E.compute(wizard.cfg, wizard.mods, engineCtx({ keep: wizard.keep, skip: wizard.skip }), { noAdvice: true });
    if (!r.ok) return '';
    var d = r.diagnostics;
    var placed = r.sessions.filter(function (s) { return s.kind === 'study'; }).length;
    return '<span class="ip-mode m-' + d.mode + '">' + esc(modeLabel(d.mode)) + '</span> ' +
      esc(T('سعتك ' + d.capacity + ' جلسة ووحداتُك ' + d.demand + ' — يتّسع منها ' + placed + '.',
            'Room for ' + d.capacity + ' sessions; your modules need ' + d.demand + ' — ' + placed + ' fit.'));
  }

  /*@3.SCPJ.72*/
  function extraReviewsHtml(c) {
    var h = '<div class="sch-editor-subhead ip-xr-headrow"><span>' +
      T('مراجعاتٌ تختار وحداتِها', 'Reviews you pick') + '</span>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" id="ip-xr-add">＋ ' +
      T('أضف مراجعة', 'Add review') + '</button></div>';
    var list = c.extra_reviews || [];
    if (!list.length) return h;
    list.forEach(function (r, i) {
      var mods = (wizard.mods[r.course] || []);
      h += '<div class="ip-xr" data-xr="' + i + '">' +
        '<div class="ip-xr-head">' +
          '<span class="ip-dot" style="background:' + S.courseColor(r.course) + '"></span>' +
          '<b class="ip-code" role="button" tabindex="0" title="' + esc(T('بدّل المادة', 'Switch course')) + '">' + esc(S.courseShort(r.course)) + '</b>' +
          '<span class="ip-xr-count">' + (r.modules || []).length + ' ' + T('وحدة', 'modules') + '</span>' +
          '<button class="ip-xr-del" data-xrdel="' + i + '" aria-label="' + T('حذف', 'Remove') + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '</div>' +
        '<div class="ip-xr-dates">' +
          '<label class="sch-label">' + T('من', 'From') + '</label>' +
          '<input type="date" class="sch-input ip-xr-from" data-xr="' + i + '" value="' + esc(r.from || '') + '">' +
          '<label class="sch-label">' + T('إلى', 'To') + '</label>' +
          '<input type="date" class="sch-input ip-xr-to" data-xr="' + i + '" value="' + esc(r.to || '') + '">' +
        '</div>' +
        '<div class="ip-xr-mods">' + mods.map(function (m) {
          var on = (r.modules || []).indexOf(m.id) !== -1;
          return '<button class="ip-xr-mod' + (on ? ' active' : '') + '" data-xr="' + i + '" data-mid="' +
            esc(m.id) + '" title="' + esc(modTitle(m)) + '">' + modNum(m.id) + '</button>';
        }).join('') + '</div></div>';
    });
    return h;
  }

  function modeLabel(m) {
    return m === 'relaxed' ? T('وقتُك واسع', 'Plenty of time')
      : m === 'balanced' ? T('متوازن', 'Balanced')
      : m === 'tight' ? T('ضيّق', 'Tight')
      : T('لا يتّسع لكلِّ شيء', 'Not enough time for everything');
  }
  function modeText(d) {
    if (d.mode === 'relaxed') return T('وُزّعت الوحداتُ على المدّة وبقي آخرُها للمراجعة.', 'Modules are spread out and the last days are left for review.');
    if (d.mode === 'balanced') return T('الوحداتُ موزّعةٌ واليومُ السابق للاختبار للمراجعة.', 'Modules are spread out; the day before each exam is for review.');
    if (d.mode === 'tight') return T('قُدّمت الوحداتُ على المراجعة، فالمراجعةُ في ما بقي من وقت.', 'Modules come first; review only takes the time that is left.');
    return T('اختيرت الوحداتُ الأهمّ — وزنُها في الاختبار وما يُبنى عليها وما لم تتقنه — والباقي في «لم تتّسع» لتقرّر بنفسك.',
      'The most important modules were picked — exam weight, what builds on them, what you have not mastered — the rest wait in "Did not fit" for you to decide.');
  }
  function reasonText(r) {
    return r === 'manual' ? T('أخرجتَها بيدك', 'you took it out')
      : r === 'conflict' ? T('تزاحمت الأيام', 'days were full')
      : T('لا وقت', 'no time');
  }

  function stepResult() {
    var E = ENG();
    if (!wizard.result) wizard.result = E.compute(wizard.cfg, wizard.mods, engineCtx({ keep: wizard.keep, skip: wizard.skip }));
    var r = wizard.result, d = r.diagnostics;
    if (!r.ok) {
      return '<div class="ip-infeasible"><b>' + esc(T('لا تاريخَ اختبارٍ قادم لأيِّ مادّةٍ في الخطة — ارجع إلى الخطوة الأولى.',
        'No upcoming exam date for any course in the plan — go back to step one.')) + '</b></div>';
    }
    var h = '';
    h += '<div class="ip-verdict m-' + d.mode + '"><span class="ip-mode m-' + d.mode + '">' + esc(modeLabel(d.mode)) + '</span>' +
      '<p>' + esc(modeText(d)) + '</p></div>';
    var study = r.sessions.filter(function (s) { return s.kind === 'study'; }).length;
    var revs = r.sessions.length - study;
    h += '<div class="ip-stats">' +
      stat(r.sessions.length, T('جلسة', 'sessions')) + stat(study, T('وحدة', 'module sessions')) +
      stat(revs, T('مراجعة', 'reviews')) + stat(countDays(r.sessions), T('يوم مذاكرة', 'study days')) +
      (r.unplaced.length ? stat(r.unplaced.length, T('لم تتّسع', 'did not fit'), 'warn') : '') + '</div>';
    if (d.passed.length) {
      h += '<p class="sch-editor-hint">' + esc(T('خرجت من الخطة لأن اختبارها مضى: ', 'Left out because their exam has passed: ') +
        d.passed.map(function (c) { return S.courseShort(c); }).join(' · ')) + '</p>';
    }
    h += '<div class="ip-pc">' + Object.keys(d.per_course).map(function (c) {
      var pc = d.per_course[c];
      return '<div class="ip-pc-row"><span class="ip-dot" style="background:' + S.courseColor(c) + '"></span>' +
        '<b class="ip-code">' + esc(S.courseShort(c)) + '</b>' +
        '<span>' + esc(T(pc.placed + ' وحدة', pc.placed + ' modules')) + '</span>' +
        (pc.dropped ? '<span class="ip-warn">' + esc(T(pc.dropped + ' لم تتّسع', pc.dropped + ' left out')) + '</span>' : '') +
        '<span class="ip-pc-r">' + (pc.buffer ? '<i class="fa-solid fa-rotate" aria-hidden="true"></i> ' + esc(T('مراجعة قبل الاختبار', 'pre-exam review')) : '') +
        ' · ' + esc(shortDate(pc.exam)) + '</span></div>';
    }).join('') + '</div>';
    if (r.unplaced.length) {
      h += '<div class="sch-editor-subhead"><span>' + T('لم تتّسع', 'Did not fit') + '</span></div>' +
        '<p class="sch-editor-hint">' + T('تبقى في لوحة الخطة لتضعها في أيِّ يومٍ بالسحب أو بالتحديد ثمّ «انقل».',
          'They stay on the plan board so you can drop them on any day — drag them, or select and "Move".') + '</p>' +
        '<div class="ip-unplaced">' + r.unplaced.map(function (u) {
          return '<span class="sch-chip" style="--chip-color:' + S.courseColor(u.course) + '"><span class="sch-chip-dot"></span>' +
            esc(S.courseShort(u.course)) + ' · ' + esc(T('وحدة ', 'M') + modNum(u.module)) +
            ' <small>' + esc(reasonText(u.reason)) + '</small></span>';
        }).join('') + '</div>';
      if (d.advice && d.advice.length) {
        h += '<p class="sch-editor-hint">' + T('أو جرّب واحداً — كلٌّ جُرّب فعلاً وهذا أثره:', 'Or try one — each was actually run, with its effect:') + '</p>';
        h += '<div class="ip-advice">' + d.advice.map(function (a, i) {
          return '<button class="ip-advice-item' + (a.enough ? ' is-enough' : '') + '" data-advice="' + i + '">' +
            '<span class="ip-advice-t">' + esc(adviceText(a)) + '</span>' +
            '<span class="ip-advice-d">' + esc(a.enough ? T('يكفي وحده', 'enough alone') : T('+' + a.gain + ' وحدة', '+' + a.gain + ' modules')) + '</span>' +
            '</button>';
        }).join('') + '</div>';
      }
    }
    if (d.spacing_wanted !== 'off' && d.spacing_applied !== d.spacing_wanted) {
      h += '<div class="ip-note">' + esc(T('المراجعة المتباعدة لا تتّسع لكلِّ الوحدات، فطُبّق ' +
        (d.spacing_applied === 'lite' ? 'الأخفُّ منها (بعد 3 أيام).' : 'لا شيء منها — لا تُطبَّق على بعض الوحدات دون بعض.'),
        'Spaced review does not fit every module, so ' +
        (d.spacing_applied === 'lite' ? 'the lighter one (after 3 days) was applied.' : 'none was applied — it is never applied to some modules only.'))) + '</div>';
    }
    if (d.buffers && d.buffers.missed && d.buffers.missed.length && wizard.cfg.review_mode === 'auto') {
      h += '<p class="sch-editor-hint">' + esc(T('لم يبقَ وقتٌ لمراجعة ما قبل الاختبار في: ', 'No time was left for a pre-exam review in: ') +
        d.buffers.missed.map(function (c) { return S.courseShort(c); }).join(' · ')) + '</p>';
    }
    h += '<div class="ip-preview">' + previewHtml(r.sessions) + '</div>';
    return h;
  }
  function stat(n, label, tone) {
    return '<span class="ip-stat' + (tone ? ' is-' + tone : '') + '"><b>' + n + '</b>' + esc(label) + '</span>';
  }
  function adviceText(a) {
    if (a.k === 'open') return T('افتح يوم ' + S.DAY_NAMES.ar[a.day], 'Open ' + S.DAY_NAMES.en[a.day]);
    if (a.k === 'one') return T('جلسةٌ واحدة لكلِّ وحدة', 'One session per module');
    if (a.k === 'spd') return T(a.n + ' جلسات في اليوم', a.n + ' sessions a day');
    if (a.k === 'min') return T('جلسةٌ من ' + a.n + ' دقيقة', a.n + '-minute sessions');
    if (a.k === 'late') return T('مدّ يومك إلى 11:30م', 'Extend your day to 11:30 pm');
    if (a.k === 'early') return T('ابدأ يومك 8 صباحاً', 'Start your day at 8 am');
    if (a.k === 'revauto') return T('المراجعةُ بعد الوحدات لا قبلها', 'Review after the modules, not before');
    return a.id;
  }

  function countDays(sessions) {
    var seen = {};
    sessions.forEach(function (s) { seen[s.date] = 1; });
    return Object.keys(seen).length;
  }

  function previewHtml(sessions) {
    var byDate = {};
    sessions.forEach(function (s) { (byDate[s.date] = byDate[s.date] || []).push(s); });
    return Object.keys(byDate).sort().map(function (d) {
      return '<div class="ip-prev-day"><div class="ip-prev-date">' + esc(dayShort(d) + ' ' + shortDate(d)) + '</div>' +
        byDate[d].map(function (s) {
          return '<div class="ip-prev-item" style="--event-color:' + S.courseColor(s.course) + '">' +
            '<span class="ip-prev-time">' + esc(S.fmtTime12(s.start_time)) + '</span>' +
            '<span class="ip-prev-course">' + esc(S.courseShort(s.course)) + '</span>' +
            '<span class="ip-prev-mod">' + (s.key ? '<span class="ip-star" aria-hidden="true">★</span> ' : '') + esc(sessionLabel(s)) + '</span></div>';
        }).join('') + '</div>';
    }).join('');
  }

  function sessionLabel(s) {
    if (s.kind === 'buffer') return T('مراجعة ما قبل الاختبار', 'Pre-exam review');
    if (s.kind === 'spaced') return T('مراجعة · وحدة ' + modNum(s.module), 'Review · module ' + modNum(s.module));
    var base = T('الوحدة ' + modNum(s.module), 'Module ' + modNum(s.module));
    if (s.total_parts > 1) base += ' · ' + T('الجلسة ' + s.part + ' من ' + s.total_parts, 'session ' + s.part + ' of ' + s.total_parts);
    return base;
  }

  function captureStepDates() {
    var box = document.getElementById('plan-wizard');
    if (!box || !wizard) return;
    var st = document.getElementById('ip-start');
    if (st) wizard.cfg.start_date = st.value || todayStr();
    box.querySelectorAll('.ip-exam').forEach(function (i) {
      var c = i.getAttribute('data-code');
      if (i.value) wizard.cfg.exam_dates[c] = i.value;
      else delete wizard.cfg.exam_dates[c];
    });
  }
  function keepTimes() {
    if (!wizard) return;
    var a = document.getElementById('ip-start-time'), b = document.getElementById('ip-end-time');
    if (a && a.value) wizard.cfg.window.start_time = a.value;
    if (b && b.value) wizard.cfg.window.end_time = b.value;
  }

  function bindWizard() {
    var box = document.getElementById('plan-wizard');
    if (!box) return;
    S.TP.build(box);

    function bind(id, fn) { var e = document.getElementById(id); if (e) e.addEventListener('click', fn); }
    function redraw() { keepTimes(); wizard.result = null; renderWizard(); }

    bind('ip-close', closeWizard);
    bind('ip-back', function () { keepTimes(); wizard.step--; wizard.result = null; renderWizard(); });
    bind('ip-next', function () {
      if (wizard.step === 1) {
        captureStepDates();
        /*@3.SCPJ.76*/
        if (!wizard.cfg.courses.length) {
          alert(T('أدرِج مادةً واحدةً على الأقل في الخطة.', 'Include at least one course in the plan.'));
          return;
        }
        /*@3.SCPJ.113*/
        var missing = wizard.cfg.courses.filter(function (c) { return !wizard.cfg.exam_dates[c]; });
        if (missing.length) {
          alert(T('حدّد تاريخ اختبار لـ: ', 'Set an exam date for: ') +
            missing.map(function (c) { return S.courseShort(c); }).join(' · ') +
            T('\nأو استبعدها من الخطة.', '\nor exclude them from the plan.'));
          return;
        }
      } else if (wizard.step === 3) keepTimes();
      wizard.step++;
      wizard.result = null;
      renderWizard();
    });
    bind('ip-save', function () { commitPlan(); });
    bind('ip-reset', resetSelection);

    box.querySelectorAll('[data-ipinc]').forEach(function (b) {
      b.addEventListener('click', function () {
        captureStepDates();
        var c = this.getAttribute('data-ipinc');
        if (wizard.cfg.courses.indexOf(c) === -1) {
          wizard.cfg.courses = wizard.all.filter(function (x) { return x === c || wizard.cfg.courses.indexOf(x) !== -1; });
          if (!wizard.cfg.modules[c]) defaultSelectFor(c);
        } else {
          wizard.cfg.courses = wizard.cfg.courses.filter(function (x) { return x !== c; });
        }
        renderWizard();
      });
    });
    box.querySelectorAll('.ip-exam').forEach(function (i) {
      i.addEventListener('change', function () { captureStepDates(); renderWizard(); });
    });
    box.querySelectorAll('[data-ptab]').forEach(function (b) {
      b.addEventListener('click', function () {
        wizard.tab = this.getAttribute('data-ptab');
        seedExamDates();
        applyDefaultSelection();
        renderWizard();
      });
    });
    box.querySelectorAll('.ip-mod').forEach(function (b) {
      b.addEventListener('click', function () {
        cycleModule(this.getAttribute('data-code'), this.getAttribute('data-mid'));
        renderWizard();
      });
    });
    box.querySelectorAll('[data-allc]').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = this.getAttribute('data-allc');
        wizard.cfg.modules[c] = (wizard.mods[c] || []).filter(function (m) { return !isMastered(c, m.id); }).map(function (m) { return m.id; });
        renderWizard();
      });
    });
    box.querySelectorAll('[data-nonec]').forEach(function (b) {
      b.addEventListener('click', function () { wizard.cfg.modules[this.getAttribute('data-nonec')] = []; renderWizard(); });
    });

    box.querySelectorAll('[data-spdd]').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = wizard.cfg.sessions_per_day + parseInt(this.getAttribute('data-spdd'), 10);
        wizard.cfg.sessions_per_day = Math.max(1, Math.min(MAX_SPD, n));
        redraw();
      });
    });
    var groups = {
      smin: function (v) { wizard.cfg.session_minutes = parseInt(v, 10); },
      parts: function (v) { wizard.cfg.parts_mode = v === 'auto' ? 'auto' : parseInt(v, 10); },
      mcd: function (v) { wizard.cfg.max_course_day = parseInt(v, 10) || 0; },
      pace: function (v) { wizard.cfg.pace = v; },
      revmode: function (v) { wizard.cfg.review_mode = v; },
      avoid: function (v) { wizard.cfg.avoid_conflicts = v === '1'; },
      spacing: function (v) { wizard.cfg.spacing = v; }
    };
    Object.keys(groups).forEach(function (g) {
      box.querySelectorAll('[data-' + g + ']').forEach(function (b) {
        b.addEventListener('click', function () { groups[g](this.getAttribute('data-' + g)); redraw(); });
      });
    });
    box.querySelectorAll('[data-rest]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = this.getAttribute('data-rest');
        var i = wizard.cfg.rest_days.indexOf(d);
        if (i === -1) wizard.cfg.rest_days.push(d); else wizard.cfg.rest_days.splice(i, 1);
        redraw();
      });
    });
    box.querySelectorAll('.sch-timepick select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        setTimeout(function () { keepTimes(); var l = document.getElementById('ip-live'); if (l) l.innerHTML = liveLine(); }, 0);
      });
    });

    /*@3.SCPJ.78*/
    bind('ip-xr-add', function () {
      keepTimes();
      var c = wizard.cfg.courses[0];
      if (!c) return;
      var to = '';
      wizard.cfg.courses.forEach(function (x) { var d = wizard.cfg.exam_dates[x]; if (d && (!to || d > to)) to = d; });
      wizard.cfg.extra_reviews.push({ course: c, modules: [], from: wizard.cfg.start_date, to: to ? addDays(to, -1) : wizard.cfg.start_date });
      renderWizard();
    });
    box.querySelectorAll('[data-xrdel]').forEach(function (b) {
      b.addEventListener('click', function () {
        keepTimes();
        wizard.cfg.extra_reviews.splice(parseInt(this.getAttribute('data-xrdel'), 10), 1);
        renderWizard();
      });
    });
    box.querySelectorAll('.ip-xr-mod').forEach(function (b) {
      b.addEventListener('click', function () {
        keepTimes();
        var r = wizard.cfg.extra_reviews[parseInt(this.getAttribute('data-xr'), 10)];
        if (!r) return;
        var mid = this.getAttribute('data-mid');
        var i = (r.modules = r.modules || []).indexOf(mid);
        if (i === -1) r.modules.push(mid); else r.modules.splice(i, 1);
        renderWizard();
      });
    });
    box.querySelectorAll('.ip-xr-from, .ip-xr-to').forEach(function (i) {
      i.addEventListener('change', function () {
        var r = wizard.cfg.extra_reviews[parseInt(this.getAttribute('data-xr'), 10)];
        if (r) r[this.classList.contains('ip-xr-from') ? 'from' : 'to'] = this.value;
      });
    });
    box.querySelectorAll('.ip-xr-head b').forEach(function (b) {
      function cycle() {
        keepTimes();
        var r = wizard.cfg.extra_reviews[parseInt(b.closest('.ip-xr').getAttribute('data-xr'), 10)];
        if (!r) return;
        var i = wizard.cfg.courses.indexOf(r.course);
        r.course = wizard.cfg.courses[(i + 1) % wizard.cfg.courses.length];
        r.modules = [];
        renderWizard();
      }
      b.addEventListener('click', cycle);
      b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(); } });
    });

    /*@3.SCPJ.79*/
    box.querySelectorAll('[data-advice]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = wizard.result.diagnostics.advice[parseInt(this.getAttribute('data-advice'), 10)];
        if (!a) return;
        a.apply(wizard.cfg);
        wizard.result = null;
        renderWizard();
      });
    });
  }

  /*@3.SCPJ.80*/
  function cycleModule(code, mid) {
    var sel = wizard.cfg.modules[code] || (wizard.cfg.modules[code] = []);
    var i = sel.indexOf(mid);
    if (isMastered(code, mid)) { setModuleStatus(code, mid, 'new'); if (i === -1) sel.push(mid); }
    else if (i !== -1) sel.splice(i, 1);
    else setModuleStatus(code, mid, 'mastered');
    wizard.result = null;
    persist();
  }

  function planFromCfg(cfg, r, prev) {
    return {
      created_at: prev && prev.created_at ? prev.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      start_date: cfg.start_date,
      exam_dates: clone(cfg.exam_dates),
      courses: cfg.courses.slice(),
      modules: clone(cfg.modules),
      sessions_per_day: cfg.sessions_per_day,
      session_minutes: cfg.session_minutes,
      parts_mode: cfg.parts_mode,
      rest_days: cfg.rest_days.slice(),
      spacing: r.spacing,
      spacing_wanted: cfg.spacing,
      review_mode: cfg.review_mode,
      pace: cfg.pace,
      max_course_day: cfg.max_course_day || 0,
      avoid_conflicts: cfg.avoid_conflicts !== false,
      extra_reviews: clone(cfg.extra_reviews || []),
      window: clone(cfg.window),
      day_caps: clone(cfg.day_caps || {}),
      sessions: decorate(r.sessions),
      unplaced: r.unplaced.map(function (u) {
        return { course: u.course, module: u.module, part: u.part || 1, total: u.total || 1, reason: u.reason, prio: u.prio };
      }),
      diagnostics: { mode: r.diagnostics.mode, demand: r.diagnostics.demand, capacity: r.diagnostics.capacity,
                     moved: r.diagnostics.moved || 0 }
    };
  }

  function commitPlan() {
    var r = wizard.result;
    if (!r || !r.ok) return;
    var st = store();
    st.plans[wizard.tab] = planFromCfg(wizard.cfg, r, st.plans[wizard.tab]);
    /*@3.SCPJ.81*/
    syncExamEvents(wizard.tab, wizard.cfg.exam_dates);
    st.active = wizard.tab;
    activeTab = wizard.tab;
    persist();
    closeWizard();
    S.render();
    undoStack = [];
    openPanel();
  }

  /*@3.SCPJ.82*/
  function syncExamEvents(tab, examDates) {
    var d = S.data();
    if (!Array.isArray(d.exams)) d.exams = [];
    var type = tab === 'midterm' ? 'midterm' : 'final';
    dedupeExams();
    Object.keys(examDates || {}).forEach(function (code) {
      var date = examDates[code];
      if (!date) return;
      var found = realExam(d, code, type);

      if (found) {
        var shown = (wizard && wizard.shown) ? wizard.shown[code] : undefined;
        if (found.date !== date && date !== shown) found.date = date;
        return;                                  /*@3.SCPJ.83*/
      }
      d.exams.push({
        id: 'exam_ip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        course_code: code, date: date,
        start_time: '', end_time: '', all_day: true,
        exam_type: type, room: '', notes: '', plan_tab: tab
      });
    });
    dedupeExams();
  }

  /*@3.SCPJ.84*/
  function dedupeExams() {
    var d = S.data();
    if (!Array.isArray(d.exams)) return 0;
    var key = function (x) { return x.course_code + '|' + (x.exam_type || 'exam'); };
    /*@3.SCPJ.114*/
    var real = {};
    d.exams.forEach(function (x) { if (x && x.course_code && !x.plan_tab) real[key(x)] = 1; });
    var out = [], at = {};
    d.exams.forEach(function (x) {
      /*@3.SCPJ.85*/
      if (!x || !x.course_code || !x.plan_tab) { out.push(x); return; }
      var k = key(x);
      if (real[k]) return;
      if (at[k] === undefined) { at[k] = out.length; out.push(x); return; }
      out[at[k]] = richerExam(out[at[k]], x);
    });
    var removed = d.exams.length - out.length;
    d.exams = out;
    return removed;
  }
  function richerExam(a, b) { return examWeight(b) > examWeight(a) ? b : a; }
  function examWeight(x) {
    var w = 0;
    if (x.start_time) w += 4;          /*@3.SCPJ.86*/
    if (x.room) w += 2;
    if (x.notes) w += 1;
    if (!x.plan_tab) w += 1;           /*@3.SCPJ.87*/
    return w;
  }

  /*@3.SCPJ.88*/
  function planEndDate(p) {
    var last = '';
    Object.keys(p.exam_dates || {}).forEach(function (c) {
      var d = p.exam_dates[c];
      if (d && d > last) last = d;
    });
    return last;
  }

  /*@3.SCPJ.89*/
  function normalizePlan(p) {
    if (!p || typeof p !== 'object') return null;
    if (!Array.isArray(p.sessions)) p.sessions = [];
    if (!Array.isArray(p.courses) || !p.courses.length) {
      var seen = {};
      p.sessions.forEach(function (s) { if (s.course) seen[s.course] = 1; });
      p.courses = Object.keys(seen);
    }
    if (!p.exam_dates || typeof p.exam_dates !== 'object') p.exam_dates = {};
    if (!p.modules || typeof p.modules !== 'object') p.modules = {};
    if (!Array.isArray(p.rest_days)) p.rest_days = [];
    if (!Array.isArray(p.unplaced)) p.unplaced = [];
    if (!Array.isArray(p.extra_reviews)) p.extra_reviews = [];
    if (!p.window || typeof p.window !== 'object') p.window = { start_time: DEFAULT_START };
    if (!p.day_caps || typeof p.day_caps !== 'object') p.day_caps = {};
    if (!p.session_minutes) p.session_minutes = 60;
    if (!p.sessions_per_day) p.sessions_per_day = 2;
    if (p.parts_mode === undefined) p.parts_mode = 1;
    if (!p.review_mode) p.review_mode = 'auto';
    if (!p.pace) p.pace = 'auto';

    /*@3.SCPJ.90*/
    var end = planEndDate(p);
    var seen2 = {};
    p.sessions = p.sessions.filter(function (s) {
      if (!s || !s.date) return false;
      if (end && s.date > end) return false;
      if (seen2[s.id]) return false;
      seen2[s.id] = 1;
      return true;
    });
    return p;
  }
  function cfgOfPlan(p) {
    return {
      start_date: p.start_date, exam_dates: p.exam_dates, courses: p.courses, modules: p.modules,
      sessions_per_day: p.sessions_per_day, session_minutes: p.session_minutes, parts_mode: p.parts_mode,
      rest_days: p.rest_days, spacing: p.spacing_wanted || p.spacing || 'off', review_mode: p.review_mode,
      pace: p.pace, max_course_day: p.max_course_day || 0, avoid_conflicts: p.avoid_conflicts !== false,
      window: p.window, extra_reviews: p.extra_reviews, day_caps: p.day_caps
    };
  }
  function curPlan() { return normalizePlan(store().plans[activeTab]); }

  /*@3.SCPJ.91*/
  var panelView = 'main';       /*@3.SCPJ.92*/
  var panelTab = 'board';
  var editingSession = null;
  var cardFor = null;
  var sel = {};
  var selectMode = false;
  var moving = false;
  var undoStack = [];
  var toastT = null;

  function openPanel(opts) {
    var ov = document.getElementById('modal-plan-panel');
    if (!ov) return;
    activeTab = store().active || activeTab;
    panelView = 'main'; editingSession = null; cardFor = null;
    sel = {}; selectMode = false; moving = false;
    if (opts && opts.tab) panelTab = opts.tab;
    clearBusy();
    var codes = [];
    Object.keys(store().plans).forEach(function (t) {
      (store().plans[t].courses || []).forEach(function (c) { if (codes.indexOf(c) === -1) codes.push(c); });
    });
    ov.style.display = '';
    renderPanel();
    if (codes.length) loadModulesFor(codes).then(function () { if (ov.style.display !== 'none') renderPanel(); });
  }
  function closePanel() {
    document.getElementById('modal-plan-panel').style.display = 'none';
    sel = {}; moving = false; selectMode = false;
  }

  function seriesKey(s) { return s.course + '|' + s.order; }
  function orderLabel(n) {
    var ar = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];
    return T('الجلسة ' + (ar[n] || (n + 1)), 'Session ' + (n + 1));
  }
  /*@3.SCPJ.93*/
  function nDays(n) {
    if (window.Garden && window.Garden.smartCount) return window.Garden.smartCount(n, ['يوم', 'يومان', 'أيام'], ['day', 'days']);
    return n + ' ' + T('يوماً', 'days');
  }
  function nSessions(n) {
    if (window.Garden && window.Garden.smartCount) {
      return window.Garden.smartCount(n, ['جلسة', 'جلستان', 'جلسات'], ['session', 'sessions']);
    }
    return n + ' ' + T('جلسة', 'sessions');
  }
  function backToMain() { panelView = 'main'; editingSession = null; cardFor = null; renderPanel(); }

  function findPlanOf(id) {
    var plans = store().plans || {};
    var hit = null;
    Object.keys(plans).forEach(function (t) {
      var q = plans[t];
      if (q && (q.sessions || []).some(function (x) { return x.id === id; })) hit = t;
    });
    return hit;
  }
  function openSessionEditor(id) {
    var t = findPlanOf(id);
    if (t) activeTab = t;
    var p = curPlan();
    var s = p && p.sessions.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    editingSession = id;
    panelView = 'session';
    openPanelRaw();
  }
  function openSessionCard(id) {
    var t = findPlanOf(id);
    if (!t) return false;
    activeTab = t;
    var p = curPlan();
    var s = p.sessions.filter(function (x) { return x.id === id; })[0];
    if (!s) return false;
    cardFor = id;
    panelView = 'card';
    openPanelRaw();
    loadModules(s.course).then(function () { if (panelView === 'card') renderPanel(); });
    return true;
  }
  function openPanelRaw() {
    var ov = document.getElementById('modal-plan-panel');
    if (!ov) return;
    renderPanel();
    ov.style.display = '';
  }

  /*@3.SCPJ.94*/
  var detailsFor = null;
  function openModuleDetails(code, mid) {
    detailsFor = { code: code, mid: mid };
    panelView = 'details';
    openPanelRaw();
    loadModules(code).then(function () { if (panelView === 'details') renderPanel(); });
  }

  var DETAIL_GROUPS = [
    { key: 'must_know',       icon: 'fa-bullseye',            ar: 'يجب أن تعرف',  en: 'Must know' },
    { key: 'must_memorize',   icon: 'fa-pen-to-square',       ar: 'يجب أن تحفظ',  en: 'Must memorize' },
    { key: 'common_mistakes', icon: 'fa-triangle-exclamation', ar: 'انتبه لهذه',  en: 'Watch out' }
  ];
  function groupsOf(mod) {
    return DETAIL_GROUPS.map(function (g) {
      var items = [];
      (mod && mod.topics || []).forEach(function (t) { items = items.concat(fieldList(t, g.key)); });
      return { g: g, items: items };
    }).filter(function (x) { return x.items.length; });
  }

  function subnav(title) {
    return '<div class="ip-subnav"><button class="sch-btn sch-btn-secondary sch-btn-xs" id="ip-back-main">' +
      '<i class="fa-solid ' + (isAr() ? 'fa-arrow-right' : 'fa-arrow-left') + '" aria-hidden="true"></i> ' + T('رجوع', 'Back') + '</button><b>' + esc(title) + '</b></div>';
  }

  function renderDetails(box) {
    var code = detailsFor.code, mid = detailsFor.mid;
    var mod = modOf(code, mid);
    var h = subnav(T('تفاصيل الوحدة', 'Module details'));
    if (!mod) {
      box.innerHTML = h + '<p class="sch-editor-hint">' + T('جارٍ التحميل…', 'Loading…') + '</p>';
      bindPanel(); return;
    }
    h += '<div class="ip-det-head">' +
      '<span class="ip-dot" style="background:' + S.courseColor(code) + '"></span>' +
      '<span class="ip-det-num">' + modNum(mid) + '</span>' +
      '<b class="ip-det-title">' + esc(modTitle(mod)) + '</b>' +
      '<span class="ip-diff d' + Math.min(3, Math.ceil(mod.difficulty / 3.5)) + '">' + mod.difficulty + '</span>' +
      '</div>';
    var gs = groupsOf(mod);
    gs.forEach(function (x) {
      h += '<div class="ip-det-group"><div class="ip-det-glabel">' +
        '<i class="fa-solid ' + x.g.icon + '" aria-hidden="true"></i> ' + esc(isAr() ? x.g.ar : x.g.en) +
        '<span class="ip-det-count">' + x.items.length + '</span></div>' +
        '<ul class="ip-det-list">' + x.items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('') + '</ul></div>';
    });
    if (!gs.length) h += '<p class="sch-editor-hint">' + T('لا تفاصيل محفوظة لهذه الوحدة.', 'No stored details for this module.') + '</p>';
    h += '<div class="sch-modal-actions">' +
      '<button class="sch-btn sch-btn-primary" id="ip-det-page">' + T('افتح الوحدة', 'Open the module') + '</button></div>';
    box.innerHTML = h;
    bindPanel();
    var pg = document.getElementById('ip-det-page');
    if (pg) pg.addEventListener('click', function () { openModule(code, mid); });
  }

  function renderTimesEditor(box, p) {
    var groups = {};
    p.sessions.forEach(function (s) { (groups[seriesKey(s)] = groups[seriesKey(s)] || []).push(s); });
    var keys = Object.keys(groups).sort();
    var h = subnav(T('أوقات الجلسات', 'Session times'));
    if (!keys.length) {
      box.innerHTML = h + '<p class="sch-editor-hint">' + T('لا جلسات في هذه الخطة.', 'No sessions in this plan.') + '</p>';
      bindPanel(); return;
    }
    h += '<p class="sch-editor-hint">' + T(
      'كلُّ سطرٍ سلسلة: المادة مع رتبة جلستها في اليوم. الوقتُ هنا يسري على جلسات السلسلة كلِّها ويُثبَّت فلا تغيّره إعادةُ التوزيع.',
      'Each row is a series: a course plus its slot rank in the day. The time here applies to the whole series and is pinned, so a re-layout keeps it.') + '</p>';
    keys.forEach(function (k) {
      var list = groups[k], s0 = list[0];
      h += '<div class="ip-series" data-series="' + esc(k) + '">' +
        '<div class="ip-series-head">' +
          '<span class="ip-dot" style="background:' + S.courseColor(s0.course) + '"></span>' +
          '<b class="ip-code">' + esc(S.courseShort(s0.course)) + '</b>' +
          '<span class="ip-series-meta">' + esc(orderLabel(s0.order)) + ' · ' + esc(nSessions(list.length)) + '</span>' +
        '</div>' +
        '<div class="ip-series-fields">' +
          '<div class="sch-timepick"><select class="tp-h" data-title-ar="الساعة" data-title-en="Hour"></select><span class="tp-colon">:</span>' +
          '<select class="tp-m" data-title-ar="الدقيقة" data-title-en="Minute"></select>' +
          '<select class="tp-mer" data-title-ar="صباحاً أو مساءً" data-title-en="AM or PM"></select>' +
          '<input type="hidden" class="ip-series-time" value="' + esc(s0.start_time || DEFAULT_START) + '"></div>' +
          '<input type="number" class="sch-input ip-series-min" min="15" max="240" step="5" value="' + (s0.minutes || 60) + '" aria-label="' + T('المدّة بالدقائق', 'Minutes') + '">' +
          '<button class="sch-btn sch-btn-primary sch-btn-xs ip-series-apply">' + T('طبّق', 'Apply') + '</button>' +
        '</div></div>';
    });
    box.innerHTML = h;
    S.TP.build(box);
    bindPanel();
  }

  function renderSessionEditor(box, p) {
    var s = p.sessions.filter(function (x) { return x.id === editingSession; })[0];
    if (!s) { backToMain(); return; }
    var n = p.sessions.filter(function (x) { return seriesKey(x) === seriesKey(s); }).length;
    var h = subnav(T('اليوم والوقت', 'Day & time'));
    h += '<div class="ip-note">' +
      '<span class="ip-dot" style="background:' + S.courseColor(s.course) + '"></span> ' +
      esc(S.courseShort(s.course)) + ' · ' + esc(sessionLabel(s)) + '</div>';
    var dMax = sessionDateMax(p, s);
    h += '<label class="sch-label" for="ip-se-date">' + T('اليوم', 'Day') + '</label>' +
      '<input type="date" class="sch-input" id="ip-se-date" value="' + esc(s.date) + '"' +
      (dMax ? ' max="' + esc(dMax) + '"' : '') + '>' +
      '<p class="sch-editor-hint" id="ip-se-date-err" style="display:none"></p>';
    h += '<label class="sch-label">' + T('الوقت', 'Time') + '</label>' +
      '<div class="sch-timepick"><select class="tp-h" data-title-ar="الساعة" data-title-en="Hour"></select><span class="tp-colon">:</span>' +
      '<select class="tp-m" data-title-ar="الدقيقة" data-title-en="Minute"></select>' +
      '<select class="tp-mer" data-title-ar="صباحاً أو مساءً" data-title-en="AM or PM"></select>' +
      '<input type="hidden" id="ip-se-time" value="' + esc(s.start_time || DEFAULT_START) + '"></div>';
    h += '<label class="sch-label" for="ip-se-min">' + T('المدّة (دقيقة)', 'Duration (min)') + '</label>' +
      '<input type="number" class="sch-input" id="ip-se-min" min="15" max="240" step="5" value="' + (s.minutes || 60) + '">';
    h += '<p class="sch-editor-hint">' + T(
      'سلسلة هذه الجلسة: ' + S.courseShort(s.course) + ' · ' + orderLabel(s.order) + ' (' + nSessions(n) + '). ' +
      'التعديل على السلسلة يمسّ وقتَها ومدّتَها كلَّها، واليومُ يتغيّر لهذه الجلسة وحدَها.',
      'This session\'s series: ' + S.courseShort(s.course) + ' · ' + orderLabel(s.order) + ' (' + nSessions(n) + '). ' +
      'Applying to the series changes the time and duration of them all; the day changes for this session only.') + '</p>';
    h += '<div class="sch-modal-actions">' +
      '<button class="sch-btn sch-btn-primary" id="ip-se-one">' + T('هذه الجلسة فقط', 'This session only') + '</button>' +
      '<button class="sch-btn sch-btn-secondary" id="ip-se-all">' + T('كل جلسات السلسلة', 'The whole series') + '</button>' +
      '<button class="sch-btn sch-btn-danger" id="ip-se-del">' + T('حذف الجلسة', 'Delete session') + '</button>' +
      '</div>';
    box.innerHTML = h;
    S.TP.build(box);
    bindPanel();
  }

  function applySessionEdit(all) {
    var p = curPlan();
    var s = p && p.sessions.filter(function (x) { return x.id === editingSession; })[0];
    if (!s) return;
    var t = document.getElementById('ip-se-time').value || s.start_time;
    var m = parseInt(document.getElementById('ip-se-min').value, 10) || s.minutes;
    var dEl = document.getElementById('ip-se-date');
    var nd = dEl && /^\d{4}-\d{2}-\d{2}$/.test(dEl.value) ? dEl.value : s.date;
    var dMax = sessionDateMax(p, s);
    if (nd !== s.date && dMax && nd > dMax) {
      var err = document.getElementById('ip-se-date-err');
      if (err) {
        err.textContent = T('اختر يوماً قبل اختبار المادة (' + dMax + ' آخرُ يومٍ متاح).',
          'Pick a day before the course exam (' + dMax + ' is the last day allowed).');
        err.style.display = '';
      }
      return;
    }
    snapshot(p);
    var key = seriesKey(s);
    p.sessions.forEach(function (x) {
      if (all ? seriesKey(x) === key : x.id === s.id) {
        if (x.start_time !== t || x.minutes !== m) x.time_locked = true;
        x.start_time = t; x.minutes = m;
      }
    });
    if (nd !== s.date) { s.date = nd; s.locked = true; }
    persist(); backToMain(); S.render();
  }

  function sessionDateMax(p, s) {
    var ex = (p.exam_dates || {})[s.course];
    return ex ? addDays(ex, -1) : planEndDate(p);
  }

  /*@3.SCPJ.97*/
  function stateText(p) {
    var today = todayStr();
    var nextExam = null;
    p.courses.forEach(function (c) {
      var d = p.exam_dates[c];
      if (d && d >= today && (!nextExam || d < nextExam.date)) nextExam = { course: c, date: d };
    });
    var doneN = p.sessions.filter(function (s) { return s.done; }).length;
    var total = p.sessions.length;
    var missed = p.sessions.filter(function (s) { return !s.done && s.date < today; }).length;

    if (nextExam && nextExam.date === today) {
      return T('اليوم اختبار ' + S.courseShort(nextExam.course) + '. لا وحدات جديدة — راجع رؤوس الأقلام وثِق بما بنيته.',
               'Today is your ' + S.courseShort(nextExam.course) + ' exam. No new modules — skim your headlines and trust the work.');
    }
    if (!nextExam) {
      return T('انتهت اختبارات هذه الخطة. راجع ما استقرّ وما لم يستقرّ قبل أن تُغلقها.',
               'This plan\'s exams are done. Review what stuck and what did not before closing it.');
    }
    var left = diffDays(today, nextExam.date);
    if (p.start_date > today) {
      return T('تبدأ الخطة في ' + shortDate(p.start_date) + ' — ' + nSessions(total) + ' بانتظارك، وأقرب اختبار بعد ' + nDays(left) + '.',
               'The plan starts on ' + shortDate(p.start_date) + ' — ' + nSessions(total) + ' ahead, nearest exam in ' + left + ' days.');
    }
    var miss = missed ? T(' · فاتتك ' + nSessions(missed) + ' — «أعد توزيع ما بقي» يضعها من جديد.',
                          ' · ' + nSessions(missed) + ' missed — "Re-lay what\'s left" places them again.') : '';
    if (left <= 1) {
      return T('اختبار ' + S.courseShort(nextExam.course) + ' غداً. الليلة للمراجعة والنوم، لا لفتح وحدة جديدة.',
               S.courseShort(nextExam.course) + ' exam tomorrow. Tonight is for review and sleep, not a new module.') + miss;
    }
    var pct = total ? Math.round(doneN / total * 100) : 0;
    return T('أنجزت ' + doneN + ' من ' + total + ' (' + pct + '٪) وأمامك ' + nDays(left) + ' حتى ' + S.courseShort(nextExam.course) + '.',
             doneN + ' of ' + total + ' done (' + pct + '%), ' + left + ' days until ' + S.courseShort(nextExam.course) + '.') + miss;
  }

  /*@3.SCPJ.98*/
  function trackerHtml(p) {
    return p.courses.map(function (code) {
      var all = modulesCache[code] || [];
      var scheduled = {};
      p.sessions.forEach(function (s) { if (s.course === code && s.module && s.kind === 'study') scheduled[s.module] = 1; });
      var nM = 0, nD = 0, nN = 0;
      var squares = all.map(function (m) {
        var cls, lab;
        if (isMastered(code, m.id)) { cls = 'is-mastered'; nM++; lab = T('أتقنتُها', 'mastered'); }
        else if (scheduled[m.id]) { cls = 'is-scheduled'; nD++; lab = T('موزّعة', 'scheduled'); }
        else { cls = 'is-none'; nN++; lab = T('لم تُوزَّع', 'not scheduled'); }
        return '<button class="ip-sq ' + cls + '" data-code="' + esc(code) + '" data-mid="' + esc(m.id) + '" ' +
          'style="--chip-color:' + S.courseColor(code) + '" aria-label="' + esc(modNum(m.id) + ' · ' + modTitle(m) + ' — ' + lab) + '" title="' +
          esc(modNum(m.id) + ' · ' + modTitle(m) + ' — ' + lab) + '">' + modNum(m.id) + '</button>';
      }).join('');
      return '<div class="ip-track"><div class="ip-track-head">' +
        '<span class="ip-dot" style="background:' + S.courseColor(code) + '"></span>' +
        '<b class="ip-code">' + esc(S.courseShort(code)) + '</b>' +
        '<span class="ip-track-count">' + nD + ' ' + T('موزّعة', 'scheduled') +
        ' · ' + nM + ' ' + T('متقنة', 'mastered') + ' · ' + nN + ' ' + T('خارجها', 'out') + '</span>' +
        '<input type="date" class="sch-input ip-panel-exam" data-code="' + esc(code) + '" value="' + esc(p.exam_dates[code] || '') + '" aria-label="' +
          esc(T('تاريخ اختبار ', 'Exam date for ') + S.courseShort(code)) + '"></div>' +
        '<div class="ip-squares">' + squares + '</div></div>';
    }).join('');
  }

  /*@3.SCPJ.117*/
  function capOf(p, d) {
    var o = p.day_caps[d];
    if (o != null && o !== '') return parseInt(o, 10) || 0;
    return p.rest_days.indexOf(dayName(d)) !== -1 ? 0 : p.sessions_per_day;
  }
  function examsOn(p, d) { return p.courses.filter(function (c) { return p.exam_dates[c] === d; }); }

  function chipHtml(s, p) {
    var ex = p.exam_dates[s.course];
    var late = ex && s.date >= ex;
    var cls = 'ip-chip k-' + (s.kind || 'study') + (s.done ? ' is-done' : '') + (sel[s.id] ? ' is-sel' : '') +
      (late ? ' is-late' : '') + (s.locked ? ' is-locked' : '');
    var t = s.kind === 'buffer' ? T('مراجعة قبل الاختبار', 'Pre-exam review') : (sessTitle(s) || sessionLabel(s));
    var lab = S.courseShort(s.course) + ' · ' + sessionLabel(s) + (t ? ' · ' + t : '') + (s.start_time ? ' · ' + S.fmtTime12(s.start_time) : '');
    return '<button type="button" class="' + cls + '" data-sid="' + esc(s.id) + '" style="--chip-color:' + S.courseColor(s.course) + '"' +
      ' aria-pressed="' + (sel[s.id] ? 'true' : 'false') + '" aria-label="' + esc(lab) + '" title="' + esc(lab) + '">' +
      '<span class="ip-chip-c">' + esc(S.courseShort(s.course)) + '</span>' +
      '<span class="ip-chip-n">' + (s.kind === 'buffer' ? '<i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>'
        : s.kind === 'spaced' ? '<i class="fa-solid fa-rotate" aria-hidden="true"></i>' + modNum(s.module) : 'M' + modNum(s.module)) + '</span>' +
      '<span class="ip-chip-t">' + esc(t) + '</span>' +
      (s.key ? '<span class="ip-star" aria-hidden="true">★</span>' : '') +
      (s.done ? '<i class="fa-solid fa-check ip-chip-ok" aria-hidden="true"></i>' : '') +
      '</button>';
  }
  function trayChip(u, i) {
    var id = 'u' + i;
    var cls = 'ip-chip k-study is-tray' + (sel[id] ? ' is-sel' : '');
    var m = modOf(u.course, u.module);
    var t = m ? modTitle(m) : '';
    var lab = S.courseShort(u.course) + ' · ' + T('الوحدة ', 'Module ') + modNum(u.module) + (t ? ' · ' + t : '') + ' · ' + reasonText(u.reason);
    return '<button type="button" class="' + cls + '" data-uid="' + id + '" style="--chip-color:' + S.courseColor(u.course) + '"' +
      ' aria-pressed="' + (sel[id] ? 'true' : 'false') + '" aria-label="' + esc(lab) + '" title="' + esc(lab) + '">' +
      '<span class="ip-chip-c">' + esc(S.courseShort(u.course)) + '</span>' +
      '<span class="ip-chip-n">M' + modNum(u.module) + '</span><span class="ip-chip-t">' + esc(t) + '</span></button>';
  }

  function boardRange(p) {
    var today = todayStr();
    var from = p.start_date || today;
    p.sessions.forEach(function (s) { if (s.date < from) from = s.date; });
    if (from < addDays(today, -14) && p.sessions.some(function (s) { return s.date >= today; })) from = addDays(today, -7);
    var to = planEndDate(p) || from;
    var f = s2d(from); f.setDate(f.getDate() - f.getDay());
    var t = s2d(to); t.setDate(t.getDate() + (6 - t.getDay()));
    return { from: d2s(f), to: d2s(t), first: from, last: to };
  }

  function boardHtml(p) {
    var r = boardRange(p);
    var byDate = {};
    p.sessions.forEach(function (s) { (byDate[s.date] = byDate[s.date] || []).push(s); });
    Object.keys(byDate).forEach(function (d) { byDate[d].sort(function (a, b) { return (a.start_time || '').localeCompare(b.start_time || '') || a.order - b.order; }); });
    var today = todayStr();
    var h = '<div class="ip-board' + (moving ? ' is-moving' : '') + '" role="grid" aria-label="' + esc(T('لوحة الخطة', 'Plan board')) + '">';
    h += '<div class="ip-wk ip-wk-head" role="row">' + S.DAYS_ORDER.map(function (d) {
      return '<div class="ip-dh" role="columnheader">' + esc(S.DAY_SHORT[isAr() ? 'ar' : 'en'][d]) + '</div>';
    }).join('') + '</div>';
    var d = r.from, guard = 0;
    while (d <= r.to && guard++ < 70) {
      h += '<div class="ip-wk" role="row">';
      for (var i = 0; i < 7; i++) {
        var inRange = d >= r.first && d <= r.last;
        var list = byDate[d] || [];
        var cap = capOf(p, d);
        var exs = examsOn(p, d);
        var cls = 'ip-cell' + (inRange ? '' : ' is-out') + (d === today ? ' is-today' : '') + (d < today ? ' is-past' : '') +
          (cap === 0 && !list.length ? ' is-rest' : '') + (exs.length ? ' has-exam' : '') + (list.length > cap && cap ? ' is-over' : '');
        h += '<div class="' + cls + '" data-date="' + d + '" role="gridcell"' + (inRange ? ' tabindex="-1"' : '') + '>';
        if (inRange) {
          h += '<div class="ip-cell-h"><span class="ip-cell-d"><span class="ip-cell-wd">' + esc(dayShort(d)) + ' </span>' +
            esc(s2d(d).getDate() === 1 || d === r.first ? shortDate(d) : String(s2d(d).getDate())) + '</span>' +
            '<button type="button" class="ip-cell-load" data-act="daycap" data-date="' + d + '"' +
              ' aria-label="' + esc(T('سعة ' + dayShort(d) + ' ' + shortDate(d) + ': ' + list.length + ' من ' + cap + ' — غيّرها', dayShort(d) + ' ' + shortDate(d) + ' capacity: ' + list.length + ' of ' + cap + ' — change it')) + '">' +
              (cap === 0 && !list.length ? esc(T('راحة', 'rest')) : list.length + '/' + cap) +
              (p.day_caps[d] != null ? ' <i class="fa-solid fa-lock" aria-hidden="true"></i>' : '') + '</button></div>';
          exs.forEach(function (c) {
            h += '<div class="ip-exam-tag" style="--chip-color:' + S.courseColor(c) + '"><i class="fa-solid fa-file-pen" aria-hidden="true"></i> ' +
              esc(T('اختبار ', 'Exam · ') + S.courseShort(c)) + '</div>';
          });
          h += list.map(function (s) { return chipHtml(s, p); }).join('');
          if (moving) h += '<span class="ip-drop-here">' + esc(T('ضعها هنا', 'Drop here')) + '</span>';
        }
        h += '</div>';
        d = addDays(d, 1);
      }
      h += '</div>';
    }
    return h + '</div>';
  }

  function selIds() { return Object.keys(sel).filter(function (k) { return sel[k]; }); }

  function selBarHtml(p) {
    var ids = selIds();
    if (!ids.length && !moving) return '';
    var trayN = ids.filter(function (k) { return k.charAt(0) === 'u'; }).length;
    var sessN = ids.length - trayN;
    var h = '<div class="ip-selbar" role="toolbar" aria-label="' + esc(T('أفعال المحدّد', 'Selection actions')) + '">';
    if (moving) {
      h += '<b>' + esc(T('اضغط اليومَ الذي تريده', 'Tap the day you want')) + '</b>' +
        '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-act="cancel-move">' + T('إلغاء', 'Cancel') + '</button></div>';
      return h;
    }
    h += '<b>' + esc(T(ids.length + ' محدّدة', ids.length + ' selected')) + '</b>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-act="move"><i class="fa-solid fa-arrows-up-down-left-right" aria-hidden="true"></i> ' + T('انقل إلى…', 'Move to…') + '</button>';
    if (sessN) {
      h += '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-act="shift" data-n="-1">' + T('يوم −1', 'Day −1') + '</button>' +
        '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-act="shift" data-n="1">' + T('يوم +1', 'Day +1') + '</button>' +
        '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-act="tray">' + T('إلى «لم تتّسع»', 'To "Did not fit"') + '</button>' +
        '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-act="done">' + T('أتممتُها', 'Done') + '</button>';
    }
    h += '<button class="sch-btn sch-btn-danger sch-btn-xs" data-act="remove">' + T('احذف', 'Delete') + '</button>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-act="clear">' + T('إلغاء التحديد', 'Clear') + '</button></div>';
    return h;
  }

  function renderPanel() {
    var box = document.getElementById('plan-panel');
    if (!box) return;
    var ov = document.getElementById('modal-plan-panel');
    var st = store();
    var modal = ov && ov.querySelector('.sch-modal');
    if (panelView === 'details' && detailsFor) { if (modal) modal.classList.remove('is-board'); return renderDetails(box); }
    var p = curPlan();
    if (panelView !== 'main' && p) {
      if (modal) modal.classList.remove('is-board');
      if (panelView === 'times') return renderTimesEditor(box, p);
      if (panelView === 'session') return renderSessionEditor(box, p);
      if (panelView === 'card') return renderCardView(box, p);
    }
    panelView = 'main';
    if (modal) modal.classList.toggle('is-board', !!p && panelTab === 'board');

    var h = '<div class="ip-top"><div class="ip-tabs">' + ['midterm', 'final'].map(function (t) {
      var has = !!st.plans[t];
      return '<button class="ip-tab' + (activeTab === t ? ' active' : '') + '" data-paneltab="' + t + '" aria-pressed="' + (activeTab === t) + '">' +
        (t === 'midterm' ? T('ميدتيرم', 'Midterm') : T('فاينل', 'Final')) +
        (has ? (st.active === t ? ' <span class="ip-live-dot" aria-label="' + esc(T('مفعّلة', 'active')) + '"></span>' : '') : ' <span class="ip-tab-empty">＋</span>') + '</button>';
    }).join('') + '</div>';
    if (p) {
      h += '<div class="ip-tabs ip-views">' + [['board', T('اللوحة', 'Board')], ['today', T('اليوم', 'Today')], ['mods', T('الوحدات والاختبارات', 'Modules & exams')]].map(function (v) {
        return '<button class="ip-tab' + (panelTab === v[0] ? ' active' : '') + '" data-pview="' + v[0] + '" aria-pressed="' + (panelTab === v[0]) + '">' + esc(v[1]) + '</button>';
      }).join('') + '</div>';
    }
    h += '</div>';

    if (!p) {
      h += '<div class="ip-empty"><p>' + T('لا خطة ' + (activeTab === 'midterm' ? 'للميدتيرم' : 'للفاينل') + ' بعد. أخبرني بتواريخ اختباراتك والوحدات، وأوزّعها على أيّامك — ثمّ تحرّكها كما تشاء.',
        'No ' + activeTab + ' plan yet. Give me your exam dates and modules and I will lay them across your days — then move them as you like.') + '</p>' +
        '<button class="sch-btn sch-btn-primary" id="ip-new">' + T('أنشئ الخطة', 'Create the plan') + '</button></div>';
      box.innerHTML = h;
      bindPanel();
      return;
    }

    var mode = (p.diagnostics && p.diagnostics.mode) || '';
    var lateN = p.sessions.filter(function (s) { var ex = p.exam_dates[s.course]; return ex && s.date >= ex; }).length;
    h += '<div class="ip-state">' + (mode ? '<span class="ip-mode m-' + mode + '">' + esc(modeLabel(mode)) + '</span> ' : '') + esc(stateText(p)) +
      (lateN ? ' <span class="ip-warn">' + esc(T(nSessions(lateN) + ' بعد اختبار مادّتها', nSessions(lateN) + ' after their exam')) + '</span>' : '') + '</div>';

    h += '<div class="ip-toolbar">' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs' + (selectMode ? ' is-on' : '') + '" data-act="select" aria-pressed="' + selectMode + '"><i class="fa-regular fa-square-check" aria-hidden="true"></i> ' + T('تحديد', 'Select') + '</button>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-act="undo"' + (undoStack.length ? '' : ' disabled') + '><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> ' + T('تراجع', 'Undo') + '</button>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-act="relay"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ' + T('أعد توزيع ما بقي', 'Re-lay what\'s left') + '</button>' +
      '<button class="sch-btn sch-btn-secondary sch-btn-xs" id="ip-times"><i class="fa-solid fa-clock" aria-hidden="true"></i> ' + T('الأوقات', 'Times') + '</button>' +
      '<button class="sch-btn sch-btn-primary sch-btn-xs" id="ip-rebuild"><i class="fa-solid fa-sliders" aria-hidden="true"></i> ' + T('إعدادات الخطة', 'Plan settings') + '</button>' +
      '</div>';

    if (panelTab === 'board') {
      if (p.unplaced.length) {
        h += '<div class="ip-tray" data-tray="1"><span class="ip-tray-l">' + esc(T('لم تتّسع (' + p.unplaced.length + ') — اسحبها إلى يوم، أو حدّدها ثمّ «انقل»',
          'Did not fit (' + p.unplaced.length + ') — drag one to a day, or select then "Move"')) + '</span>' +
          p.unplaced.map(trayChip).join('') + '</div>';
      } else if (moving || dragging) {
        h += '<div class="ip-tray is-empty" data-tray="1"><span class="ip-tray-l">' + esc(T('أفلتها هنا لتخرجها من الأيام', 'Drop here to take it off the days')) + '</span></div>';
      }
      h += boardHtml(p);
      h += '<p class="sch-editor-hint ip-board-hint">' + T(
        'اضغط الجلسة لتفتح بطاقتها · Ctrl أو Shift مع الضغط لتحديد عدّة · اسحبها بالفأرة إلى يومٍ آخر · وباللمس اضغط مطوّلاً لتبدأ التحديد.',
        'Tap a session to open its card · Ctrl or Shift-click to select several · drag with the mouse to another day · on touch, long-press to start selecting.') + '</p>';
    } else if (panelTab === 'today') {
      h += '<div id="ip-today-cards"></div>';
    } else {
      h += '<div class="ip-progress-wrap">' + trackerHtml(p) + '</div>' +
        '<p class="sch-editor-hint">' + T('المربّع يبدّل «أتقنتُها» — وهو الوسمُ نفسُه في صفحة المادة. والتاريخ بجانب المادة يعدّل اختبارها في الجدول.',
          'A square toggles "mastered" — the same mark as on the course page. The date beside each course edits its exam in the schedule.') + '</p>';
    }

    /*@3.SCPJ.96*/
    var isOn = st.active === activeTab;
    h += '<div class="sch-modal-actions ip-foot">' +
      '<button class="sch-btn sch-btn-secondary" id="ip-activate">' +
        (isOn ? '<i class="fa-solid fa-pause" aria-hidden="true"></i> ' + T('أوقفها مؤقتاً', 'Pause') : '<i class="fa-solid fa-play" aria-hidden="true"></i> ' + T('فعّلها', 'Activate')) + '</button>' +
      '<button class="sch-btn sch-btn-danger" id="ip-delete">' + T('احذف الخطة', 'Delete plan') + '</button>' +
      '<button class="sch-btn sch-btn-secondary" id="ip-panel-close">' + T('إغلاق', 'Close') + '</button></div>';
    if (!isOn) {
      h += '<p class="sch-editor-hint">' + T('الخطة موقوفة: جلساتها لا تظهر في الجدول ولا تنبّهك، وكل بياناتها محفوظة.',
        'Paused: its sessions are hidden from the schedule and send no reminders; all its data is kept.') + '</p>';
    }
    h += selBarHtml(p) + '<div class="ip-toast" id="ip-toast" role="status" aria-live="polite"></div>';

    var scroller = modal;
    var keepScroll = scroller ? scroller.scrollTop : 0;
    box.innerHTML = h;
    if (scroller) scroller.scrollTop = keepScroll;
    bindPanel();
    if (panelTab === 'today') renderTodayCards(document.getElementById('ip-today-cards'), p);
  }

  function renderCardView(box, p) {
    var s = p.sessions.filter(function (x) { return x.id === cardFor; })[0];
    if (!s) { backToMain(); return; }
    var mod = s.module ? modOf(s.course, s.module) : null;
    box.innerHTML = subnav(T('جلسة المذاكرة', 'Study session')) + '<div class="ip-cards ip-cards-one">' + sessionCard(s, mod, true) + '</div>';
    bindPanel();
    bindCards(box);
  }

  /*@3.SCPJ.118*/
  function snapshot(p) {
    undoStack.push({ tab: activeTab, sessions: clone(p.sessions), unplaced: clone(p.unplaced) });
    if (undoStack.length > 25) undoStack.shift();
  }
  function undo() {
    var u = undoStack.pop();
    if (!u) return;
    var p = normalizePlan(store().plans[u.tab]);
    if (!p) return;
    p.sessions = u.sessions; p.unplaced = u.unplaced;
    activeTab = u.tab;
    sel = {};
    persist(); S.render(); renderPanel();
    toast(T('رجعتُ خطوة.', 'Undone.'));
  }
  function toast(msg, withUndo) {
    var t = document.getElementById('ip-toast');
    if (!t) return;
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (withUndo ? '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-act="undo">' + T('تراجع', 'Undo') + '</button>' : '');
    t.classList.add('is-on');
    var b = t.querySelector('[data-act="undo"]');
    if (b) b.addEventListener('click', function () { undo(); });
    clearTimeout(toastT);
    toastT = setTimeout(function () { var x = document.getElementById('ip-toast'); if (x) x.classList.remove('is-on'); }, 5000);
  }
  function relayDays(p, dates) {
    var E = ENG();
    if (!E) return;
    clearBusy();
    var seen = {};
    dates.forEach(function (d) {
      if (seen[d]) return;
      seen[d] = 1;
      E.relayDay(cfgOfPlan(p), engineCtx(), p.sessions, d);
    });
  }
  function commitOp(p, msg) {
    sel = {};
    moving = false;
    persist(); S.render(); renderPanel();
    if (msg) toast(msg, true);
  }

  function makeSession(u, date, p) {
    var s = {
      id: 'ip_' + date.replace(/-/g, '') + '_m_' + Math.random().toString(36).slice(2, 7),
      date: date, order: 99, course: u.course, module: u.module, part: u.part || 1, total_parts: u.total || 1,
      kind: 'study', start_time: '', minutes: p.session_minutes, done: false, note: '', prio: u.prio, locked: true
    };
    decorate([s]);
    return s;
  }

  function moveTo(ids, date) {
    var p = curPlan();
    if (!p) return;
    snapshot(p);
    var touched = [date], moved = 0, blocked = 0;
    var trayIdx = [];
    ids.forEach(function (id) {
      if (id.charAt(0) === 'u') {
        var u = p.unplaced[parseInt(id.slice(1), 10)];
        if (!u) return;
        var ex = p.exam_dates[u.course];
        if (ex && date >= ex) { blocked++; return; }
        p.sessions.push(makeSession(u, date, p));
        trayIdx.push(parseInt(id.slice(1), 10));
        moved++;
        return;
      }
      var s = p.sessions.filter(function (x) { return x.id === id; })[0];
      if (!s) return;
      var ex2 = p.exam_dates[s.course];
      if (ex2 && date >= ex2) { blocked++; return; }
      if (s.date === date) return;
      touched.push(s.date);
      s.date = date; s.locked = true; s.order = 99;
      if (s.time_locked) delete s.time_locked;
      moved++;
    });
    p.unplaced = p.unplaced.filter(function (u, i) { return trayIdx.indexOf(i) === -1; });
    relayDays(p, touched);
    if (!moved) {
      undoStack.pop(); sel = {}; moving = false; renderPanel();
      if (blocked) toast(T('لم تُنقل: ' + dayShort(date) + ' ' + shortDate(date) + ' يومُ اختبار مادّتها أو بعده.', 'Not moved: ' + dayShort(date) + ' ' + shortDate(date) + ' is on or after its exam.'));
      return;
    }
    commitOp(p, T('نُقلت ' + nSessions(moved) + ' إلى ' + dayShort(date) + ' ' + shortDate(date) + '.', 'Moved ' + nSessions(moved) + ' to ' + dayShort(date) + ' ' + shortDate(date) + '.') +
      (blocked ? ' ' + T(blocked + ' لم تُنقل: اليومُ بعد اختبار مادّتها.', blocked + ' not moved: that day is after their exam.') : ''));
  }

  function shiftBy(ids, n) {
    var p = curPlan();
    if (!p) return;
    snapshot(p);
    var touched = [], moved = 0, blocked = 0;
    ids.forEach(function (id) {
      var s = p.sessions.filter(function (x) { return x.id === id; })[0];
      if (!s) return;
      var nd = addDays(s.date, n);
      var ex = p.exam_dates[s.course];
      if ((ex && nd >= ex) || nd < todayStr()) { blocked++; return; }
      touched.push(s.date, nd);
      s.date = nd; s.locked = true; s.order = 99;
      if (s.time_locked) delete s.time_locked;
      moved++;
    });
    if (!moved) {
      undoStack.pop(); sel = {}; renderPanel();
      toast(T('لم تتحرّك: اليومُ المجاور قبل اليوم أو يومَ اختبار مادّتها.', 'Not moved: the next day is in the past or on its exam.'));
      return;
    }
    relayDays(p, touched);
    commitOp(p, T('حُرّكت ' + nSessions(moved) + (n > 0 ? ' يوماً للأمام.' : ' يوماً للخلف.'), 'Shifted ' + nSessions(moved) + (n > 0 ? ' a day later.' : ' a day earlier.')) +
      (blocked ? ' ' + T(blocked + ' بقيت: لا يومَ متاحاً.', blocked + ' stayed: no day available.') : ''));
  }

  function toTray(ids) {
    var p = curPlan();
    if (!p) return;
    snapshot(p);
    var touched = [], n = 0;
    p.sessions = p.sessions.filter(function (s) {
      if (ids.indexOf(s.id) === -1) return true;
      touched.push(s.date);
      if (s.kind === 'study' && s.module) {
        p.unplaced.push({ course: s.course, module: s.module, part: s.part || 1, total: s.total_parts || 1, reason: 'manual', prio: s.prio });
      }
      n++;
      return false;
    });
    relayDays(p, touched);
    commitOp(p, T('أُخرجت ' + nSessions(n) + ' من الأيام — تجدها في «لم تتّسع».', nSessions(n) + ' taken off the days — find them in "Did not fit".'));
  }

  function setDoneIds(ids) {
    var p = curPlan();
    if (!p) return;
    snapshot(p);
    var all = true;
    ids.forEach(function (id) { var s = p.sessions.filter(function (x) { return x.id === id; })[0]; if (s && !s.done) all = false; });
    ids.forEach(function (id) { var s = p.sessions.filter(function (x) { return x.id === id; })[0]; if (s) s.done = !all; });
    commitOp(p, all ? T('أعدتُها غيرَ مكتملة.', 'Marked not done.') : T('أحسنت — عُلّمت مكتملة.', 'Nice — marked done.'));
  }

  function removeIds(ids) {
    var p = curPlan();
    if (!p) return;
    snapshot(p);
    var touched = [], n = 0;
    p.sessions = p.sessions.filter(function (s) {
      if (ids.indexOf(s.id) === -1) return true;
      touched.push(s.date); n++; return false;
    });
    var drop = ids.filter(function (k) { return k.charAt(0) === 'u'; }).map(function (k) { return parseInt(k.slice(1), 10); });
    p.unplaced = p.unplaced.filter(function (u, i) { if (drop.indexOf(i) !== -1) { n++; return false; } return true; });
    relayDays(p, touched);
    commitOp(p, T('حُذفت ' + nSessions(n) + '.', nSessions(n) + ' deleted.'));
  }

  /*@3.SCPJ.122*/
  function relayRest() {
    var E = ENG();
    var p = curPlan();
    if (!E || !p) return;
    clearBusy();
    var today = todayStr();
    loadModulesFor(p.courses).then(function (mods) {
      snapshot(p);
      var keep = p.sessions.filter(function (s) { return s.done || (s.locked && s.date >= today); });
      var skip = p.unplaced.filter(function (u) { return u.reason === 'manual'; });
      var cfg = cfgOfPlan(p);
      cfg.start_date = today > p.start_date ? today : p.start_date;
      var r = E.compute(cfg, mods, engineCtx({ keep: keep, skip: skip }), { noAdvice: true });
      if (!r.ok) { undoStack.pop(); toast(T('لا اختبارَ قادم في هذه الخطة.', 'No upcoming exam in this plan.')); return; }
      var past = p.sessions.filter(function (s) { return s.done && s.date < cfg.start_date && keep.indexOf(s) === -1; });
      p.sessions = decorate(r.sessions.concat(past));
      p.unplaced = r.unplaced.map(function (u) { return { course: u.course, module: u.module, part: u.part || 1, total: u.total || 1, reason: u.reason, prio: u.prio }; });
      p.spacing = r.spacing;
      p.diagnostics = { mode: r.diagnostics.mode, demand: r.diagnostics.demand, capacity: r.diagnostics.capacity, moved: r.diagnostics.moved || 0 };
      commitOp(p, T('أُعيد توزيعُ ما بقي من اليوم — وما أتممتَه أو نقلتَه بيدك في مكانه.', 'What was left is laid out again from today — finished and hand-moved sessions stayed put.'));
    });
  }

  /*@3.SCPJ.119*/
  var dragging = null;
  var hold = null;
  var ateClick = false;

  function bindPanel() {
    var box = document.getElementById('plan-panel');
    if (!box) return;
    function bind(id, fn) { var e = document.getElementById(id); if (e) e.addEventListener('click', fn); }
    bind('ip-back-main', backToMain);
    bind('ip-se-one', function () { applySessionEdit(false); });
    bind('ip-se-all', function () { applySessionEdit(true); });
    bind('ip-se-del', function () {
      var p = curPlan();
      snapshot(p);
      var s = p.sessions.filter(function (x) { return x.id === editingSession; })[0];
      p.sessions = p.sessions.filter(function (x) { return x.id !== editingSession; });
      if (s) relayDays(p, [s.date]);
      persist(); backToMain(); S.render();
      toast(T('حُذفت الجلسة.', 'Session deleted.'), true);
    });
    box.querySelectorAll('.ip-series-apply').forEach(function (b) {
      b.addEventListener('click', function () {
        var wrap = this.closest('.ip-series');
        var key = wrap.getAttribute('data-series');
        var t = wrap.querySelector('.ip-series-time').value;
        var m = parseInt(wrap.querySelector('.ip-series-min').value, 10) || 60;
        var p = curPlan();
        snapshot(p);
        p.sessions.forEach(function (x) { if (seriesKey(x) === key) { x.start_time = t; x.minutes = m; x.time_locked = true; } });
        persist(); renderPanel(); S.render();
      });
    });
    box.querySelectorAll('[data-paneltab]').forEach(function (b) {
      b.addEventListener('click', function () { activeTab = this.getAttribute('data-paneltab'); sel = {}; moving = false; renderPanel(); });
    });
    box.querySelectorAll('[data-pview]').forEach(function (b) {
      b.addEventListener('click', function () { panelTab = this.getAttribute('data-pview'); sel = {}; moving = false; renderPanel(); });
    });
    bind('ip-panel-close', closePanel);
    bind('ip-new', function () { closePanel(); openWizard(activeTab); });
    bind('ip-rebuild', function () { closePanel(); openWizard(activeTab, store().plans[activeTab]); });
    bind('ip-times', function () { panelView = 'times'; renderPanel(); });
    bind('ip-activate', function () {
      var st = store();
      st.active = (st.active === activeTab) ? null : activeTab;   /*@3.SCPJ.99*/
      persist(); renderPanel(); S.render();
    });
    /*@3.SCPJ.100*/
    bind('ip-delete', function () {
      var st = store();
      var kin = String(activeTab);
      var keys = Object.keys(st.plans).filter(function (k) { return k === kin || k.indexOf(kin) === 0; });
      var n = keys.reduce(function (a, k) { return a + ((st.plans[k] && st.plans[k].sessions) || []).length; }, 0);
      if (!confirm(T(
        'حذف خطة ' + (kin === 'midterm' ? 'الميدتيرم' : 'الفاينل') + ' و' + n +
        ' جلسة، ومعها اختبارات هذه الخطة من الجدول؟ حالة إتقان الوحدات تبقى كما هي.',
        'Delete the ' + kin + ' plan with ' + n + ' sessions, plus the exams it created? Module mastery is kept.'))) return;
      keys.forEach(function (k) { delete st.plans[k]; });
      var d = S.data();
      if (Array.isArray(d.exams)) d.exams = d.exams.filter(function (x) { return !(x && x.plan_tab === kin); });
      if (st.active === activeTab || keys.indexOf(st.active) !== -1) st.active = Object.keys(st.plans)[0] || null;
      undoStack = [];
      persist(); renderPanel(); S.render();
    });
    box.querySelectorAll('.ip-panel-exam').forEach(function (i) {
      i.addEventListener('change', function () {
        var p = store().plans[activeTab];
        if (!p || !this.value) return;
        p.exam_dates[this.getAttribute('data-code')] = this.value;
        var m = {}; m[this.getAttribute('data-code')] = this.value;
        syncExamEvents(activeTab, m);              /*@3.SCPJ.101*/
        persist(); renderPanel(); S.render();
      });
    });
    box.querySelectorAll('.ip-sq').forEach(function (b) {
      b.addEventListener('click', function () {
        var code = this.getAttribute('data-code'), mid = this.getAttribute('data-mid');
        setModuleStatus(code, mid, isMastered(code, mid) ? 'new' : 'mastered');
        persist(); renderPanel(); S.render();
      });
    });
    box.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); act(this.getAttribute('data-act'), this); });
    });
    bindBoard(box);
  }

  function act(a, el) {
    var ids = selIds();
    if (a === 'select') { selectMode = !selectMode; if (!selectMode) sel = {}; renderPanel(); return; }
    if (a === 'undo') { undo(); return; }
    if (a === 'relay') { relayRest(); return; }
    if (a === 'clear') { sel = {}; selectMode = false; renderPanel(); return; }
    if (a === 'cancel-move') { moving = false; renderPanel(); return; }
    if (a === 'daycap') { capMenu(el); return; }
    if (!ids.length) return;
    if (a === 'move') { moving = true; renderPanel(); return; }
    if (a === 'shift') { shiftBy(ids.filter(function (k) { return k.charAt(0) !== 'u'; }), parseInt(el.getAttribute('data-n'), 10)); return; }
    if (a === 'tray') { toTray(ids.filter(function (k) { return k.charAt(0) !== 'u'; })); return; }
    if (a === 'done') { setDoneIds(ids.filter(function (k) { return k.charAt(0) !== 'u'; })); return; }
    if (a === 'remove') { removeIds(ids); return; }
  }

  function capMenu(btn) {
    var cell = btn.closest('.ip-cell');
    var old = document.querySelector('.ip-capmenu');
    if (old) { var same = old.parentNode === cell; old.parentNode.removeChild(old); if (same) return; }
    var p = curPlan();
    if (!p || !cell) return;
    var d = btn.getAttribute('data-date');
    var cur = p.day_caps[d];
    var opts = [['0', T('راحة', 'Rest')], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['6', '6'], ['', T('كالمعتاد', 'Default')]];
    var m = document.createElement('div');
    m.className = 'ip-capmenu';
    m.setAttribute('role', 'group');
    m.setAttribute('aria-label', T('جلساتُ هذا اليوم', 'Sessions this day'));
    m.innerHTML = '<span>' + esc(T('جلساتُ هذا اليوم', 'Sessions this day')) + '</span>' + opts.map(function (o) {
      var on = o[0] === '' ? cur == null : String(cur) === o[0];
      return '<button type="button" class="ip-pill' + (on ? ' active' : '') + '" aria-pressed="' + on + '" data-cap="' + o[0] + '">' + esc(o[1]) + '</button>';
    }).join('');
    cell.appendChild(m);
    m.querySelectorAll('[data-cap]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var v = this.getAttribute('data-cap');
        var q = curPlan();
        snapshot(q);
        if (v === '') delete q.day_caps[d]; else q.day_caps[d] = parseInt(v, 10);
        var over = q.sessions.filter(function (x) { return x.date === d; }).length - capOf(q, d);
        persist(); renderPanel();
        toast(over > 0
          ? T('صار لهذا اليوم ' + (v === '0' ? 'راحة' : capOf(q, d) + ' جلسات') + '، وفيه ' + nSessions(over) + ' زيادة — «أعد توزيع ما بقي» ينقلها.', 'This day now holds ' + capOf(q, d) + '; ' + over + ' extra — "Re-lay what\'s left" moves them.')
          : T('حُفظت سعةُ اليوم، وتحترمها إعادةُ التوزيع.', 'Saved — re-laying respects it.'), true);
      });
    });
    var first = m.querySelector('.ip-pill.active') || m.querySelector('.ip-pill');
    if (first) first.focus();
  }
  function chipId(el) { return el.getAttribute('data-sid') || el.getAttribute('data-uid'); }
  function toggleSel(id) { if (sel[id]) delete sel[id]; else sel[id] = true; renderPanel(); }

  function bindBoard(box) {
    if (box._ipBoard) return;
    box._ipBoard = true;

    box.addEventListener('click', function (e) {
      if (ateClick) { ateClick = false; e.preventDefault(); e.stopPropagation(); return; }
      var chip = e.target.closest && e.target.closest('.ip-chip');
      if (moving) {
        var cell = e.target.closest && e.target.closest('.ip-cell:not(.is-out)');
        if (cell) { moveTo(selIds(), cell.getAttribute('data-date')); return; }
        var tray = e.target.closest && e.target.closest('[data-tray]');
        if (tray) { toTray(selIds().filter(function (k) { return k.charAt(0) !== 'u'; })); return; }
        return;
      }
      if (!chip) return;
      var id = chipId(chip);
      if (selectMode || e.ctrlKey || e.metaKey || e.shiftKey || id.charAt(0) === 'u' || selIds().length) {
        if (!selectMode && (e.ctrlKey || e.metaKey || e.shiftKey)) selectMode = true;
        toggleSel(id);
        return;
      }
      openSessionCard(id);
    });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && (moving || selIds().length)) {
        e.preventDefault(); e.stopPropagation();
        moving = false; sel = {}; selectMode = false; renderPanel();
      }
    });

    box.addEventListener('pointerdown', function (e) {
      var chip = e.target.closest && e.target.closest('.ip-chip');
      if (!chip || moving) return;
      if (e.button != null && e.button !== 0) return;
      var id = chipId(chip);
      if (e.pointerType === 'mouse') {
        dragging = { id: id, x: e.clientX, y: e.clientY, on: false, el: chip, ghost: null, over: null, pid: e.pointerId };
        return;
      }
      hold = { id: id, x: e.clientX, y: e.clientY, t: setTimeout(function () {
        if (!hold) return;
        hold.fired = true;
        selectMode = true;
        sel[hold.id] = true;
        if (navigator.vibrate) { try { navigator.vibrate(8); } catch (er) {} }
        renderPanel();
      }, 420) };
    });
    box.addEventListener('pointermove', function (e) {
      if (hold && Math.abs(e.clientX - hold.x) + Math.abs(e.clientY - hold.y) > 8) { clearTimeout(hold.t); hold = null; }
      if (!dragging) return;
      var dx = e.clientX - dragging.x, dy = e.clientY - dragging.y;
      if (!dragging.on) {
        if (Math.abs(dx) + Math.abs(dy) < 6) return;
        dragging.on = true;
        if (!sel[dragging.id]) { sel = {}; sel[dragging.id] = true; }
        var n = selIds().length;
        dragging.ghost = document.createElement('div');
        dragging.ghost.className = 'ip-ghost';
        dragging.ghost.textContent = n > 1 ? T(n + ' جلسات', n + ' sessions') : (dragging.el.getAttribute('aria-label') || '');
        document.body.appendChild(dragging.ghost);
        document.documentElement.classList.add('ip-dragging');
        try { box.setPointerCapture(dragging.pid); } catch (er) {}
      }
      e.preventDefault();
      dragging.ghost.style.transform = 'translate(' + (e.clientX + 12) + 'px,' + (e.clientY + 12) + 'px)';
      var under = document.elementFromPoint(e.clientX, e.clientY);
      var tgt = under && under.closest ? (under.closest('.ip-cell:not(.is-out)') || under.closest('[data-tray]')) : null;
      if (dragging.over !== tgt) {
        if (dragging.over) dragging.over.classList.remove('is-drop');
        dragging.over = tgt;
        if (tgt) tgt.classList.add('is-drop');
      }
    });
    function endDrag(e) {
      if (hold) {
        clearTimeout(hold.t);
        if (hold.fired) { ateClick = true; setTimeout(function () { ateClick = false; }, 450); }
        hold = null;
      }
      if (!dragging) return;
      var d = dragging;
      dragging = null;
      document.documentElement.classList.remove('ip-dragging');
      if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
      if (d.over) d.over.classList.remove('is-drop');
      if (!d.on) return;
      ateClick = true;
      setTimeout(function () { ateClick = false; }, 0);
      var ids = selIds();
      if (!d.over || e.type === 'pointercancel') { renderPanel(); return; }
      if (d.over.hasAttribute('data-tray')) toTray(ids.filter(function (k) { return k.charAt(0) !== 'u'; }));
      else moveTo(ids, d.over.getAttribute('data-date'));
    }
    box.addEventListener('pointerup', endDrag);
    box.addEventListener('pointercancel', endDrag);
    box.addEventListener('contextmenu', function (e) {
      var chip = e.target.closest && e.target.closest('.ip-chip');
      if (!chip) return;
      e.preventDefault();
      selectMode = true;
      sel[chipId(chip)] = true;
      renderPanel();
    });
  }

  /*@3.SCPJ.120*/
  function briefHtml(mod, max) {
    var gs = groupsOf(mod);
    if (!gs.length) return '';
    return '<div class="ip-brief">' + gs.map(function (x) {
      var items = x.items.slice(0, max || 99);
      return '<div class="ip-brief-g g-' + x.g.key + '"><div class="ip-brief-h"><i class="fa-solid ' + x.g.icon + '" aria-hidden="true"></i> ' +
        esc(isAr() ? x.g.ar : x.g.en) + '<span class="ip-det-count">' + x.items.length + '</span></div>' +
        '<ul>' + items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div>';
  }

  function sessionCard(s, mod, full) {
    var color = S.courseColor(s.course);
    var title = s.kind === 'buffer' ? T('مراجعة ما قبل الاختبار', 'Pre-exam review') : (mod ? modTitle(mod) : (sessTitle(s) || sessionLabel(s)));
    var diff = mod ? mod.difficulty : null;
    var body = mod ? briefHtml(mod, full ? 99 : 4) : '';
    if (!body) {
      body = s.kind === 'buffer'
        ? '<p class="sch-editor-hint">' + T('مرّ على وحدات المادة كلِّها: رؤوسُ الأقلام، وما أخطأتَ فيه، وأسئلةُ الاختبارات السابقة. لا وحدةَ جديدة اليوم.',
            'Go over every module of the course: headlines, what you got wrong, past exam questions. No new module today.') + '</p>'
        : '<p class="sch-editor-hint">' + T('لا تفاصيل محفوظة لهذه الوحدة — افتحها وابدأ بأهدافها.', 'No stored details for this module — open it and start from its objectives.') + '</p>';
    }
    return '<article class="ip-card' + (s.done ? ' is-done' : '') + (full ? ' is-full' : '') + '" style="--event-color:' + color + '">' +
      '<div class="ip-card-head">' +
        '<span class="ip-card-time">' + esc(s.start_time ? S.fmtTime12(s.start_time) : '') + '</span>' +
        '<span class="ip-card-course ip-code"><span class="ip-dot" aria-hidden="true"></span>' + esc(S.courseShort(s.course)) + '</span>' +
        (s.key ? '<span class="ip-key"><span aria-hidden="true">★</span> ' + T('أساسيّة', 'Core') + '</span>' : '') +
        (diff ? '<span class="ip-diff d' + Math.min(3, Math.ceil(diff / 3.5)) + '" title="' + esc(T('الصعوبة', 'Difficulty')) + '">' + diff + '</span>' : '') +
        '<span class="ip-card-mins">' + s.minutes + T(' د', 'm') + '</span>' +
      '</div>' +
      '<div class="ip-card-title">' +
        (s.module ? '<span class="ip-card-modn">' + modNum(s.module) + '</span>' : '') +
        esc(title) + '</div>' +
      '<div class="ip-card-sub">' + esc(sessionLabel(s) + ' · ' + dayShort(s.date) + ' ' + shortDate(s.date)) + '</div>' +
      '<div class="ip-card-body">' + body + '</div>' +
      '<div class="ip-card-actions">' +
        (s.module ? '<button class="sch-btn sch-btn-primary sch-btn-xs" data-ipmod="' + esc(s.course) + '|' + esc(s.module) + '">' +
          '<i class="fa-solid fa-book-open-reader" aria-hidden="true"></i> ' + T('ادرس الوحدة', 'Study the module') + '</button>' : '') +
        '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-ipdone="' + esc(s.id) + '">' +
          (s.done ? T('تراجع', 'Undo') : '<i class="fa-solid fa-check" aria-hidden="true"></i> ' + T('أتممتُها', 'Done')) + '</button>' +
        '<button class="sch-btn sch-btn-secondary sch-btn-xs" data-ipedit="' + esc(s.id) + '">' + T('اليوم والوقت', 'Day & time') + '</button>' +
      '</div></article>';
  }

  function renderTodayCards(box, p) {
    if (!box) return;
    var today = todayStr();
    var list = p.sessions.filter(function (s) { return s.date === today; });
    var head = '';
    if (!list.length) {
      var next = p.sessions.filter(function (s) { return s.date > today && !s.done; })
        .sort(function (a, b) { return a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''); });
      if (!next.length) { box.innerHTML = '<p class="sch-editor-hint">' + T('لا جلسات اليوم ولا بعده.', 'No sessions today or later.') + '</p>'; return; }
      var nd = next[0].date;
      list = next.filter(function (s) { return s.date === nd; });
      head = '<p class="sch-editor-hint">' + esc(T('لا جلسات اليوم. القادمة: ' + dayShort(nd) + ' ' + shortDate(nd), 'Nothing today. Next: ' + dayShort(nd) + ' ' + shortDate(nd))) + '</p>';
    }
    list.sort(function (a, b) { return (a.start_time || '').localeCompare(b.start_time || ''); });
    var codes = {};
    list.forEach(function (s) { codes[s.course] = 1; });
    loadModulesFor(Object.keys(codes)).then(function (mods) {
      box.innerHTML = head + '<div class="ip-cards">' + list.map(function (s) {
        var mod = (mods[s.course] || []).filter(function (m) { return m.id === s.module; })[0];
        return sessionCard(s, mod);
      }).join('') + '</div>';
      bindCards(box);
    });
  }

  function bindCards(box) {
    box.querySelectorAll('[data-ipdone]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = this.getAttribute('data-ipdone');
        var t = findPlanOf(id);
        var p = t ? normalizePlan(store().plans[t]) : null;
        if (!p) return;
        var s = p.sessions.filter(function (x) { return x.id === id; })[0];
        if (s) { s.done = !s.done; persist(); renderPanel(); S.render(); }
      });
    });
    box.querySelectorAll('[data-ipmod]').forEach(function (b) {
      b.addEventListener('click', function () { var q = this.getAttribute('data-ipmod').split('|'); openModule(q[0], q[1]); });
    });
    box.querySelectorAll('[data-ipdet]').forEach(function (b) {
      b.addEventListener('click', function () { var q = this.getAttribute('data-ipdet').split('|'); openModuleDetails(q[0], q[1]); });
    });
    box.querySelectorAll('[data-ipedit]').forEach(function (b) {
      b.addEventListener('click', function () { openSessionEditor(this.getAttribute('data-ipedit')); });
    });
  }

  /*@3.SCPJ.121*/
  function sheetBrief(ev, body) {
    if (!ev || !body || !ev.course_code) return;
    var id = ev.id;
    var t = findPlanOf(id);
    var s = t ? (store().plans[t].sessions || []).filter(function (x) { return x.id === id; })[0] : null;
    var slot = document.createElement('div');
    slot.className = 'ip-sheet-brief';
    body.appendChild(slot);
    if (s && s.kind === 'buffer') {
      slot.innerHTML = '<p class="sch-editor-hint">' + T('مرّ على وحدات المادة كلِّها: رؤوسُ الأقلام، وما أخطأتَ فيه، وأسئلةُ الاختبارات السابقة.',
        'Go over every module of the course: headlines, what you got wrong, past exam questions.') + '</p>';
      return;
    }
    if (!ev.module) return;
    loadModules(ev.course_code).then(function () {
      var mod = modOf(ev.course_code, ev.module);
      if (!mod || !slot.isConnected) return;
      slot.innerHTML = briefHtml(mod, 3) + (s && s.key ? '<p class="ip-key-note"><span aria-hidden="true">★</span> ' +
        esc(T('وحدةٌ أساسيّة: ثقيلةُ الوزن في الاختبار أو تُبنى عليها وحداتٌ بعدها.', 'A core module: it weighs heavily in the exam or later modules build on it.')) + '</p>' : '');
    });
  }

  /*@3.SCPJ.104*/
  function openModule(code, mid) {
    var cat = S.catalog();
    var c = (cat && cat.courses ? cat.courses : []).filter(function (x) { return x.code === code; })[0];
    if (!c || !c.path) { alert(T('لا صفحة لهذه المادة.', 'No page for this course.')); return; }
    var n = String(modNum(mid)).padStart(2, '0');
    window.location.href = '../' + c.path + 'M' + n + '.html';
  }

  /*@3.SCPJ.105*/
  function renderSettingsSection(box) {
    if (!box) return;
    var st = store();
    var lines = ['midterm', 'final'].map(function (t) {
      var p = st.plans[t];
      var label = t === 'midterm' ? T('ميدتيرم', 'Midterm') : T('فاينل', 'Final');
      if (!p) return '<div class="ip-row"><span class="ip-row-label">' + label + '</span><span class="sch-editor-hint">' +
        T('لا خطة', 'No plan') + '</span></div>';
      var done = (p.sessions || []).filter(function (s) { return s.done; }).length;
      return '<div class="ip-row"><span class="ip-row-label">' + label +
        (st.active === t ? ' <span class="ip-live-dot" aria-label="' + esc(T('مفعّلة', 'active')) + '"></span>' : '') + '</span>' +
        '<span class="sch-editor-hint">' + done + '/' + (p.sessions || []).length + ' ' + T('جلسة', 'sessions') + '</span></div>';
    }).join('');

    box.innerHTML = '<p class="sch-editor-hint">' + T(
        'خطتان متعايشتان لكلٍّ تواريخها ووحداتها. جلساتها تُعرض في الجدول وتنبّهك، وتحرّكها من لوحة الخطة.',
        'Two coexisting plans, each with its own dates and modules. Their sessions show in the schedule and remind you; move them from the plan board.') + '</p>' +
      lines +
      '<button class="sch-btn sch-btn-primary sch-btn-block" id="ip-open-panel" style="margin-top:.5rem">' +
      T('افتح لوحة الخطة', 'Open the plan board') + '</button>';

    var b = document.getElementById('ip-open-panel');
    if (b) b.addEventListener('click', function () {
      document.getElementById('modal-editor').style.display = 'none';
      openPanel();
    });
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function fromHash() {
    var m = /^#ip-([A-Za-z0-9_\-]+)$/.exec(location.hash || '');
    if (!m) return;
    var id = m[1];
    var t = findPlanOf(id);
    if (!t) return;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    openSessionCard(id);
  }

  /*@3.SCPJ.106*/
  function init() {
    S = window.GardenSchedule;
    if (!S) return;
    activeTab = store().active || 'midterm';

    /*@3.SCPJ.107*/
    var st = store(), dirty = 0;
    Object.keys(st.plans).forEach(function (k) {
      var p = st.plans[k];
      var n = (p && p.sessions) ? p.sessions.length : 0;
      normalizePlan(p);
      if (p && p.sessions.length !== n) dirty += n - p.sessions.length;
    });
    dirty += dedupeExams();
    dirty += migrateMastery();
    if (dirty) persist();
    /*@3.SCPJ.108*/
    var codes = [];
    Object.keys(store().plans).forEach(function (t) {
      (store().plans[t].courses || []).forEach(function (c) { if (codes.indexOf(c) === -1) codes.push(c); });
    });
    /*@3.SCPJ.109*/
    if (codes.length) loadModulesFor(codes).then(function () { S.render(); fromHash(); });

    var closeBtn = document.getElementById('plan-panel-x');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    var wizX = document.getElementById('plan-wizard-x');
    if (wizX) wizX.addEventListener('click', closeWizard);
    document.addEventListener('garden:languageChanged', function () {
      if (wizard) renderWizard();
      var ov = document.getElementById('modal-plan-panel');
      if (ov && ov.style.display !== 'none') renderPanel();
    });
    if (window.addEventListener) window.addEventListener('hashchange', fromHash);
  }

  window.GardenSchedulePlan = {
    init: init,
    openWizard: function (tab) { if (S) openWizard(tab); },
    openPanel: function (o) { if (S) openPanel(o); },
    renderSettingsSection: renderSettingsSection,
    openModule: function (code, mid) { if (S) openModule(code, mid); },
    /*@3.SCPJ.110*/
    moduleTitle: function (code, mid) {
      if (!S || !code || !mid) return '';
      var m = modOf(code, mid);
      return m ? modTitle(m) : '';
    },
    moduleNum: function (mid) { return modNum(mid); },
    _syncExams: function (tab, dates, shown) {
      var w = wizard;
      wizard = { shown: shown || {} };
      try { syncExamEvents(tab, dates); } finally { wizard = w; }
    },
    openDetails: function (code, mid) { if (S) openModuleDetails(code, mid); },
    editSession: function (id) { if (S) openSessionEditor(id); },
    openSession: function (id) { return S ? openSessionCard(id) : false; },
    sheetBrief: function (ev, body) { if (S) sheetBrief(ev, body); },
    /*@3.SCPJ.111*/
    todaySessions: function () {
      var s = window.GardenSchedule;
      if (!s) return [];
      var d = s.data();
      var it = d && d.intensive;
      var p = (it && it.active && it.plans) ? it.plans[it.active] : null;
      if (!p) return [];
      var t = s.fmtLocalDate(new Date());
      return (p.sessions || []).filter(function (x) { return x.date === t; });
    },
    sessionCardHtml: function (s, mod) { return sessionCard(s, mod); },
    loadModules: function (code) { return loadModules(code); },
    bindCards: bindCards
  };
})();
