;(function () {
  'use strict';

  var S = window.GardenSearch;
  if (!S) return;
  function $(id) { return document.getElementById(id); }
  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function tx(a, e) { return isAr() ? a : e; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function lsGet(k, fb) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? fb : v; } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var TABS = [
    { k: 'all', ar: 'الكلّ', en: 'All' },
    { k: 'concept', ar: 'مفاهيم', en: 'Concepts', icon: 'fa-lightbulb' },
    { k: 'module', ar: 'وحدات', en: 'Modules', icon: 'fa-book-open' },
    { k: 'course', types: ['course', 'plan'], ar: 'مواد', en: 'Courses', icon: 'fa-book' },
    { k: 'slides', ar: 'العروض', en: 'Slides', icon: 'fa-file-pdf' },
    { k: 'video', ar: 'فيديوهات', en: 'Videos', icon: 'fa-circle-play' },
    { k: 'code', ar: 'أمثلة كود', en: 'Code examples', icon: 'fa-code' },
    { k: 'tool', ar: 'أدوات الموقع', en: 'Site tools', icon: 'fa-compass' },
    { k: 'faculty', ar: 'أساتذة', en: 'Instructors', icon: 'fa-chalkboard-user' },
    { k: 'section', ar: 'شعب', en: 'Sections', icon: 'fa-layer-group' },
    { k: 'mine', ar: 'ما يخصّني', en: 'Mine', icon: 'fa-user' }
  ];
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function typesOf(t) { return t.types || [t.k]; }

  var KIND = {
    concept: ['مفهوم', 'Concept', 'fa-lightbulb'], module: ['وحدة', 'Module', 'fa-book-open'],
    course: ['مادّة', 'Course', 'fa-book'], plan: ['مادّة في الخطط', 'Plan course', 'fa-book'],
    video: ['فيديو', 'Video', 'fa-circle-play'], code: ['مثال كود', 'Code example', 'fa-code'],
    slides: ['عرض المحاضرة', 'Lecture slides', 'fa-file-pdf'],
    tool: ['أداة في الموقع', 'Site tool', 'fa-compass'], note: ['ملاحظتي', 'My note', 'fa-note-sticky'],
    task: ['مهمّتي', 'My task', 'fa-list-check'], section: ['شعبتي', 'My section', 'fa-layer-group'],
    instructor: ['أستاذ', 'Instructor', 'fa-chalkboard-user'], lab: ['مختبر', 'Lab', 'fa-flask'],
    crn: ['رقم شعبة', 'CRN', 'fa-arrow-right-to-bracket'],
    faculty: ['أستاذ', 'Instructor', 'fa-chalkboard-user'], secs: ['شعبة', 'Section', 'fa-layer-group']
  };
  var FIELD = {
    kw: ['مصطلح', 'Key term'], kd: ['تعريف مصطلح', 'Term definition'], tg: ['الوسوم', 'Tags'],
    ds: ['الوصف', 'Description'], l1: ['الشرح السريع', 'Quick read'], l2: ['الشرح الكامل', 'Full explanation'],
    l3: ['الشرح العميق', 'Deep dive'], ob: ['أهداف التعلّم', 'Learning objectives'],
    na: ['حديث البروفيسور', "Professor's talk"], va: ['خزنة الامتحان', 'Exam vault'],
    pq: ['اسأل البروفيسور', 'Ask the professor'], pa: ['اسأل البروفيسور', 'Ask the professor'],
    fc: ['البطاقات التعليميّة', 'Flashcards'], fb: ['البطاقات التعليميّة', 'Flashcards'],
    cm: ['المقارنات', 'Comparisons'], fo: ['الصيغة', 'Formula'], co: ['الكود', 'Code'],
    ce: ['مثال كود', 'Code example'], th: ['سؤال تفكير', 'Thinking question'],
    ta: ['جواب سؤال التفكير', 'Thinking answer'], qz: ['اختبر نفسك', 'Quiz'],
    qo: ['خيارات الاختبار', 'Quiz options'], qx: ['شرح الإجابة', 'Answer explanation'],
    vt: ['موضوع الفيديو', 'Video topic'], vc: ['القناة', 'Channel'], sl: ['الشريحة', 'Slide'], pf: ['الأستاذ', 'Instructor']
  };
  var JUMP = {
    quiz: ['اختبر نفسك', 'Quiz'], flashcards: ['البطاقات', 'Flashcards'], vault: ['خزنة الامتحان', 'Exam vault'],
    'ask-professor': ['اسأل البروفيسور', 'Ask the professor'], professor: ['حديث البروفيسور', "Professor's talk"],
    objectives: ['أهداف التعلّم', 'Objectives']
  };
  var INS = [['', 'كلّ شيء', 'Everything'], ['title', 'العناوين', 'Titles'], ['body', 'الشرح', 'Explanations'],
             ['quiz', 'الاختبارات', 'Quizzes'], ['cards', 'البطاقات', 'Flashcards'],
             ['qa', 'اسأل البروفيسور', 'Ask the professor'], ['code', 'الكود', 'Code'], ['slides', 'العروض', 'Slides']];
  var GROUP_ORDER = ['section', 'faculty', 'tool', 'course', 'concept', 'module', 'slides', 'video', 'code'];
  var EXAMPLES = ['شجرة البحث الثنائية', 'deadlock', 'CS230 m3', '"stack overflow"', 'تعدد الأشكال', 'normalization'];

  var st = { q: '', type: 'all', level: [], course: '', inn: '', off: 0 };
  var seq = 0, last = null, acc = [], mine = [], offline = false, liveT = null;

  function readUrl() {
    var p = new URLSearchParams(location.search);
    st.q = p.get('q') || '';
    st.type = tab(p.get('type') || 'all').k;
    st.level = (p.get('level') || '').split(',').filter(function (v) { return /^[0-8]$/.test(v); });
    st.course = (p.get('course') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    st.inn = (p.get('in') || '').replace(/[^a-z]/g, '');
  }
  function writeUrl() {
    var p = new URLSearchParams();
    if (st.q) p.set('q', st.q);
    if (st.type !== 'all') p.set('type', st.type);
    if (st.level.length) p.set('level', st.level.join(','));
    if (st.course) p.set('course', st.course);
    if (st.inn) p.set('in', st.inn);
    var s = p.toString();
    try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); } catch (e) {}
  }

  function where(e) {
    var bits = [];
    if (e.code) bits.push(e.code);
    if (e.m) bits.push(tx('الوحدة ' + e.m, 'Module ' + e.m));
    if (e.kind === 'video' && e.x && e.x.ch) bits.push(e.x.ch);
    if (e.kind === 'code' && e.x && e.x.lang) bits.push(e.x.lang);
    if (e.kind === 'section' && e.x) {
      bits.push('CRN ' + e.x.crn);
      if (e.x.pf && e.x.pf.length) bits.push(e.x.pf.join('، '));
    }
    if (e.kind === 'faculty' && e.x && e.x.n) bits.push(tx('درّس ' + e.x.n + ' شعبة', 'taught ' + e.x.n + ' sections'));
    return bits.join(' · ');
  }
  function href(u) {
    if (!u) return '#';
    if (/^(https?:)?\/\//.test(u)) return u;
    return S.root + u;
  }
  function title(e) {
    var i = isAr() ? (e.ar ? 0 : 1) : (e.en ? 1 : 0);
    var t = i === 0 ? e.ar : e.en;
    return e.th ? S.markRanges(t, e.th[i]) : esc(t);
  }

  function card(e) {
    var kd = KIND[e.kind === 'section' ? 'secs' : e.kind || e.t] || KIND.concept;
    var ext = /^https?:/.test(e.url || '');
    var html = '<article class="sr-hit" data-k="' + esc(e.kind || e.t) + '">' +
      '<div class="sr-hit-top"><span class="sr-kind"><i class="fa-solid ' + kd[2] + '" aria-hidden="true"></i>' +
      esc(tx(kd[0], kd[1])) + '</span>' + (where(e) ? '<span class="sr-where">' + esc(where(e)) + '</span>' : '') + '</div>' +
      '<h3 class="sr-hit-t"><a href="' + esc(href(e.url)) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') +
      ' data-rec="1">' + title(e) + (ext ? ' <i class="fa-solid fa-arrow-up-right-from-square sr-ext" aria-hidden="true"></i>' : '') + '</a></h3>';
    if (e.sn && e.sn.f !== 'ti') {
      html += '<p class="sr-hit-s"' + (e.sn.g === 'en' ? ' dir="ltr" lang="en"' : '') + '>' + (e.sn.pre ? '… ' : '') +
        S.markRanges(e.sn.s, e.sn.h) + (e.sn.post ? ' …' : '') + '</p>';
    } else if (!e.remote && e.sub) {
      html += '<p class="sr-hit-s">' + esc(e.sub) + '</p>';
    }
    var from = e.sn && FIELD[e.sn.f];
    if (from && e.sn.f === 'sl' && /^p\d+$/.test(e.sn.a || '')) from = [from[0] + ' ' + e.sn.a.slice(1), from[1] + ' ' + e.sn.a.slice(1)];
    var jumpKey = e.sn && e.sn.a;
    var jumpLbl = jumpKey && JUMP[jumpKey];
    if (from || (e.jump && jumpLbl)) {
      html += '<div class="sr-hit-foot">' + (from ? '<span class="sr-from">' + esc(tx('وُجدت في: ', 'Found in: ') + tx(from[0], from[1])) + '</span>' : '') +
        (e.jump && jumpLbl && e.jump !== e.url ? '<a class="sr-jump" href="' + esc(href(e.jump)) + '" data-rec="1">' +
          esc(tx('اذهب إلى «' + jumpLbl[0] + '»', 'Go to ' + jumpLbl[1])) + ' <i class="fa-solid fa-arrow-left sr-jump-ico" aria-hidden="true"></i></a>' : '') +
        '</div>';
    }
    return html + '</article>';
  }

  function mineList(q) {
    var out = [];
    try { out = S.mine(q) || []; } catch (e) { out = []; }
    return out.map(function (m) {
      return { t: m.t, kind: m.t, code: m.code || '', m: m.m || 0, ar: m.ar || m.en || '', en: m.en || m.ar || '',
               url: m.url || '', sub: m.due || '', remote: false };
    });
  }

  var NOTE_IDX = null, NOTE_BUSY = null;
  function loadScript(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = no;
      document.head.appendChild(s);
    });
  }
  function localNotes() {
    if (NOTE_IDX) return Promise.resolve(NOTE_IDX);
    if (NOTE_BUSY) return NOTE_BUSY;
    var C = window.GardenSearchCore;
    if (!C) return Promise.resolve(null);
    NOTE_BUSY = (window.GardenNotesStore ? Promise.resolve() : loadScript(S.root + 'shared/notes-store.js'))
      .then(function () { return window.GardenNotesStore && GardenNotesStore.allRows ? GardenNotesStore.allRows() : []; })
      .then(function (rows) {
        var by = {}, docs = [];
        (rows || []).forEach(function (r) { if (r && r.id) by[r.id] = r; });
        lsGet('notes_index', []).forEach(function (rec) {
          var row = rec && by[rec.id], doc = null;
          try { doc = row ? (typeof row.raw === 'string' ? JSON.parse(row.raw) : row.raw) : null; } catch (e) { doc = null; }
          var d = C.noteDoc(rec, doc);
          if (d) docs.push(d);
        });
        NOTE_IDX = C.build(docs);
        return NOTE_IDX;
      })
      .catch(function () { NOTE_BUSY = null; return null; });
    return NOTE_BUSY;
  }
  function hostedNotes(q) {
    var Sy = window.GardenSync, base = window.GardenEndpoints && window.GardenEndpoints.sync;
    if (!Sy || !Sy.vaultId || !base) return Promise.resolve(null);
    return Promise.resolve(Sy.vaultId()).then(function (vid) {
      if (!vid) return null;
      var h = Sy.vaultHeaders ? Sy.vaultHeaders(vid) : {};
      return fetch(base + '/v1/search/' + vid + '?q=' + encodeURIComponent(q) + '&lim=30&lang=' + (isAr() ? 'ar' : 'en'), { headers: h })
        .then(function (r) { return r.ok ? r.json() : null; });
    }).catch(function () { return null; });
  }
  function notesFor(q) {
    return Promise.all([
      localNotes().then(function (ix) { return ix ? window.GardenSearchCore.search(ix, q, { limit: 30, lang: isAr() ? 'ar' : 'en' }) : null; }),
      hostedNotes(q)
    ]).then(function (two) {
      var seen = {}, out = [];
      [two[0], two[1]].forEach(function (r) {
        ((r && r.hits) || []).forEach(function (h) { if (!seen[h.i]) { seen[h.i] = 1; out.push(h); } });
      });
      return out;
    });
  }

  function renderTabs(j) {
    var el = $('sr-tabs');
    var ft = (j && j.facets && j.facets.type) || {};
    var all = 0;
    Object.keys(ft).forEach(function (k) { all += ft[k]; });
    var html = '';
    TABS.forEach(function (t) {
      var n = t.k === 'all' ? all : t.k === 'mine' ? mine.length : typesOf(t).reduce(function (s, k) { return s + (ft[k] || 0); }, 0);
      if (!n && t.k !== 'all' && t.k !== st.type) return;
      var on = t.k === st.type;
      html += '<button type="button" role="tab" class="sr-tab' + (on ? ' on' : '') + '" aria-selected="' + on + '" data-tab="' + t.k + '">' +
        (t.icon ? '<i class="fa-solid ' + t.icon + '" aria-hidden="true"></i>' : '') +
        '<span>' + esc(tx(t.ar, t.en)) + '</span><b>' + n + '</b></button>';
    });
    el.innerHTML = html;
    el.hidden = false;
  }

  function levelName(l) { return l === '0' ? tx('عامّة', 'General') : tx('المستوى ' + l, 'Level ' + l); }
  function renderFilters(j) {
    var fl = (j && j.facets && j.facets.level) || {};
    var keys = Object.keys(fl).sort(function (a, b) { return (a === '0') - (b === '0') || a - b; });
    st.level.forEach(function (l) { if (keys.indexOf(l) < 0) keys.push(l); });
    $('sr-levels').innerHTML = keys.map(function (l) {
      var on = st.level.indexOf(l) >= 0;
      return '<button type="button" class="sr-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-level="' + l + '">' +
        esc(levelName(l)) + '<b>' + (fl[l] || 0) + '</b></button>';
    }).join('');
    var fc = (j && j.facets && j.facets.course) || {};
    var codes = Object.keys(fc).sort(function (a, b) { return fc[b] - fc[a] || (a < b ? -1 : 1); }).slice(0, 60);
    if (st.course && codes.indexOf(st.course) < 0) codes.unshift(st.course);
    var sel = $('sr-course');
    sel.innerHTML = '<option value="">' + esc(tx('كلّ المواد', 'All courses')) + '</option>' + codes.map(function (c) {
      return '<option value="' + esc(c) + '"' + (c === st.course ? ' selected' : '') + '>' + esc(c) + (fc[c] ? ' · ' + fc[c] : '') + '</option>';
    }).join('');
    if (window.GardenSelect) { try { GardenSelect.enhance($('sr-filters')); GardenSelect.sync && GardenSelect.sync(sel); } catch (e) {} }
    $('sr-in').innerHTML = INS.map(function (x) {
      var on = st.inn === x[0];
      return '<button type="button" class="sr-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-in="' + x[0] + '">' + esc(tx(x[1], x[2])) + '</button>';
    }).join('');
    $('sr-filters').hidden = st.type === 'mine';
    var adv = !!st.inn;
    if (adv) { $('sr-adv').hidden = false; $('sr-adv-btn').setAttribute('aria-expanded', 'true'); }
    $('sr-adv-btn').classList.toggle('on', !!st.inn);
  }

  function renderStatus(j) {
    var el = $('sr-status');
    if (offline) {
      el.innerHTML = '<span class="sr-off"><i class="fa-solid fa-wifi" aria-hidden="true"></i>' +
        esc(tx('دون اتصال: نبحث في العناوين المحفوظة على جهازك وحدَها.', 'Offline: searching the titles saved on your device only.')) + '</span>';
      return;
    }
    if (!j) { el.textContent = ''; return; }
    var n = st.type === 'mine' ? mine.length : j.total;
    var html = '<span class="sr-count">' + esc(tx(n + ' نتيجة', n + (n === 1 ? ' result' : ' results'))) + '</span>';
    if (j.suggest) {
      html += '<button type="button" class="sr-suggest" data-q="' + esc(j.suggest) + '">' + esc(tx('هل تقصد', 'Did you mean')) +
        ' <b dir="auto">' + esc(j.suggest) + '</b>؟</button>';
    }
    if (j.relaxed) html += '<span class="sr-relaxed">' + esc(tx('لم تجتمع كلُّ الكلمات في نتيجةٍ واحدة — هذه أقربُ ما وجدنا.', 'No result has every word — these are the closest.')) + '</span>';
    el.innerHTML = html;
  }

  function renderResults(j) {
    var box = $('sr-results');
    var more = $('sr-more');
    if (st.type === 'mine') {
      box.innerHTML = mine.length ? mine.map(card).join('') : empty();
      more.hidden = true;
      return;
    }
    var list = acc.map(S.fromHit);
    if (!list.length) { box.innerHTML = empty(); more.hidden = true; return; }
    if (st.type !== 'all') {
      box.innerHTML = list.map(card).join('');
      more.hidden = acc.length >= j.total || acc.length >= 220;
      return;
    }
    var ft = (j && j.facets && j.facets.type) || {};
    var groups = GROUP_ORDER.map(function (g) {
      var t = tab(g), ks = typesOf(t);
      var items = list.filter(function (e) { return ks.indexOf(e.kind) >= 0; });
      var best = 0;
      acc.forEach(function (h) { if (ks.indexOf(h.k) >= 0 && h.s > best) best = h.s; });
      return { t: t, items: items, n: ks.reduce(function (s, k) { return s + (ft[k] || 0); }, 0), best: best };
    }).filter(function (g) { return g.items.length; });
    groups.sort(function (a, b) { return b.best - a.best; });
    var html = '';
    if (mine.length) html += group(tab('mine'), mine, mine.length);
    groups.forEach(function (g) { html += group(g.t, g.items, g.n); });
    box.innerHTML = html;
    more.hidden = true;
  }
  function group(t, items, n) {
    var cap = t.k === 'concept' ? 4 : 3;
    return '<section class="sr-grp"><div class="sr-grp-h"><h2><i class="fa-solid ' + t.icon + '" aria-hidden="true"></i>' + esc(tx(t.ar, t.en)) + '</h2>' +
      (n > Math.min(cap, items.length) ? '<button type="button" class="sr-grp-all" data-tab="' + t.k + '">' +
        esc(tx('الكلّ (' + n + ')', 'All ' + n)) + ' <i class="fa-solid fa-arrow-left sr-jump-ico" aria-hidden="true"></i></button>' : '') +
      '</div>' + items.slice(0, cap).map(card).join('') + '</section>';
  }
  function empty() {
    return '<div class="sr-empty"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><p>' +
      esc(tx('لا نتائج بهذه الفلاتر.', 'Nothing matches these filters.')) + '</p>' +
      (st.level.length || st.course || st.inn || st.type !== 'all' ? '<button type="button" class="gsf-btn gsf-btn--ghost" data-reset="1">' +
        esc(tx('أزِلِ الفلاتر', 'Clear filters')) + '</button>' : '') + '</div>';
  }

  function skeleton() {
    $('sr-results').innerHTML = '<div class="sr-skel" aria-hidden="true"><i></i><i></i><i></i></div>';
    $('sr-more').hidden = true;
  }

  function intro() {
    $('sr-tabs').hidden = true;
    $('sr-filters').hidden = true;
    $('sr-status').textContent = '';
    $('sr-more').hidden = true;
    var rec = lsGet('garden_search_recent', []);
    var chips = function (arr) {
      return arr.map(function (q) { return '<button type="button" class="sr-chip" data-q="' + esc(q) + '" dir="auto">' + esc(q) + '</button>'; }).join('');
    };
    $('sr-results').innerHTML = '<div class="sr-intro">' +
      '<h2>' + esc(tx('ابحث في كلِّ ما في الحديقة', 'Search everything in the garden')) + '</h2>' +
      '<p>' + esc(tx('نصُّ الشرح كاملاً بطبقاته الثلاث، وأسئلةُ الاختبارات والبطاقات وأسئلةُ البروفيسور، والموادُّ والفيديوهات وأمثلةُ الكود وأدواتُ الموقع — وملاحظاتُك ومهامُّك من جهازك.',
        'The full lesson text in all three depths, quiz questions, flashcards and professor Q&A, courses, videos, code examples and site tools — plus your notes and tasks from this device.')) + '</p>' +
      (rec.length ? '<h3>' + esc(tx('بحثتَ مؤخّراً', 'Recent')) + '</h3><div class="sr-chips">' + chips(rec) + '</div>' : '') +
      '<h3>' + esc(tx('جرّب', 'Try')) + '</h3><div class="sr-chips">' + chips(EXAMPLES) + '</div>' +
      '<div class="sr-syn">' + syntax() + '</div></div>';
  }
  function syntax() {
    var rows = [
      ['"…"', 'عبارةٌ كاملةٌ حرفيّاً', 'exact phrase'],
      ['-word', 'استبعدْ كلمة', 'exclude a word'],
      ['CS230 m3', 'مادّةٌ ووحدتُها', 'a course and its module'],
      ['type:concept', 'نوعٌ واحد', 'one kind'],
      ['level:4', 'مستوى', 'a level'],
      ['in:quiz', 'داخل الاختبارات وحدَها', 'inside quizzes only']
    ];
    return rows.map(function (r) { return '<span><code dir="ltr">' + esc(r[0]) + '</code> ' + esc(tx(r[1], r[2])) + '</span>'; }).join('');
  }

  function params(off) {
    var t = tab(st.type);
    var all = st.type === 'all' || st.type === 'mine';
    return { type: all ? '' : typesOf(t).join(','), level: st.level.join(','), course: st.course, in: st.inn,
             off: off, lim: st.type === 'all' ? 50 : st.type === 'mine' ? 1 : 20, timeout: 4000 };
  }

  function run(reset) {
    var q = st.q.trim();
    writeUrl();
    if (S.norm(q).length < 2) { intro(); return; }
    var my = ++seq;
    if (reset) { st.off = 0; acc = []; skeleton(); }
    mine = mineList(q);
    notesFor(q).then(function (hits) {
      if (my !== seq || !hits.length) return;
      var seenU = {};
      mine.forEach(function (m) { if (m.url) seenU[m.url] = 1; });
      var add = hits.map(S.fromHit).filter(function (e) { return !seenU[e.url]; });
      mine = add.concat(mine.filter(function (m) {
        return !add.some(function (a) { return a.url === m.url; });
      }));
      if (last || offline) paint();
    });
    S.remote(q, params(st.off)).then(function (j) {
      if (my !== seq) return;
      offline = false;
      last = j;
      acc = reset ? j.hits.slice() : acc.concat(j.hits);
      paint();
    }, function () {
      if (my !== seq) return;
      fallback(q, my);
    });
  }
  function paint() {
    var j = last;
    if (offline) { renderOfflineMine(); return; }
    renderTabs(j);
    renderFilters(j);
    renderStatus(j);
    renderResults(j);
  }
  function renderOfflineMine() {
    if (!mine.length) return;
    var box = $('sr-results');
    var g = box.querySelector('.sr-grp[data-mine]');
    var html = group(tab('mine'), mine, mine.length).replace('<section class="sr-grp"', '<section class="sr-grp" data-mine');
    if (g) g.outerHTML = html; else box.insertAdjacentHTML('afterbegin', html);
  }
  function fallback(q, my) {
    offline = true;
    S.load().then(function () {
      if (my !== seq) return;
      var res = [];
      try { res = S.query(q) || []; } catch (e) {}
      $('sr-tabs').hidden = true;
      $('sr-filters').hidden = true;
      renderStatus(null);
      $('sr-results').innerHTML = res.filter(function (r) { return r.e.t !== 'note'; }).length || mine.length ? res.filter(function (r) { return r.e.t !== 'note'; }).map(function (r) {
        var e = r.e;
        return card({ t: e.t, kind: e.t, code: e.code || '', m: e.m || 0, ar: e.ar || e.en || '', en: e.en || e.ar || '', url: e.url || '', remote: false });
      }).join('') : empty();
      renderOfflineMine();
      $('sr-more').hidden = true;
    });
  }

  function remember(q) {
    q = String(q || '').trim();
    if (S.norm(q).length < 2) return;
    var rec = lsGet('garden_search_recent', []).filter(function (x) { return x !== q; });
    rec.unshift(q);
    lsSet('garden_search_recent', rec.slice(0, 8));
  }

  function setQ(q) {
    st.q = q;
    $('sr-q').value = q;
    $('sr-clear').hidden = !q;
    run(true);
  }

  function bind() {
    var inp = $('sr-q');
    inp.value = st.q;
    $('sr-clear').hidden = !st.q;
    $('sr-form').addEventListener('submit', function (e) {
      e.preventDefault();
      clearTimeout(liveT);
      st.q = inp.value;
      remember(st.q);
      run(true);
      inp.blur();
    });
    inp.addEventListener('input', function () {
      $('sr-clear').hidden = !inp.value;
      clearTimeout(liveT);
      liveT = setTimeout(function () { st.q = inp.value; run(true); }, 220);
    });
    $('sr-clear').addEventListener('click', function () { setQ(''); inp.focus(); });
    $('sr-adv-btn').addEventListener('click', function () {
      var a = $('sr-adv');
      a.hidden = !a.hidden;
      this.setAttribute('aria-expanded', String(!a.hidden));
      if (!a.hidden && !$('sr-syn').innerHTML) $('sr-syn').innerHTML = syntax();
    });
    $('sr-course').addEventListener('change', function () { st.course = this.value; run(true); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-tab],[data-level],[data-in],[data-q],[data-reset],[data-rec]');
      if (!b || !document.querySelector('.sr-wrap').contains(b)) return;
      if (b.hasAttribute('data-rec')) { remember(st.q); return; }
      if (b.hasAttribute('data-tab')) { st.type = b.getAttribute('data-tab'); run(true); window.scrollTo({ top: 0 }); return; }
      if (b.hasAttribute('data-level')) {
        var l = b.getAttribute('data-level'), i = st.level.indexOf(l);
        if (i >= 0) st.level.splice(i, 1); else st.level.push(l);
        run(true); return;
      }
      if (b.hasAttribute('data-in')) { st.inn = b.getAttribute('data-in'); run(true); return; }
      if (b.hasAttribute('data-q')) { setQ(b.getAttribute('data-q')); remember(st.q); return; }
      if (b.hasAttribute('data-reset')) { st.type = 'all'; st.level = []; st.course = ''; st.inn = ''; run(true); }
    });
    $('sr-more').addEventListener('click', function () { st.off = acc.length; run(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      var a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable)) return;
      e.preventDefault(); inp.focus(); inp.select();
    });
    document.addEventListener('garden:languageChanged', function () {
      if (offline || !last) { run(true); return; }
      paint();
    });
  }

  function init() {
    readUrl();
    bind();
    run(true);
    if (!st.q) $('sr-q').focus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
