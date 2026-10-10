;(function () {
  'use strict';

  var thisScript = document.currentScript;
  var BASE = (thisScript && thisScript.src) ? thisScript.src.replace(/games\.js(\?.*)?$/, '') : '../shared/';
  var VER = (thisScript && /\?v=([^&]+)/.exec(thisScript.src || '')) ? /\?v=([^&]+)/.exec(thisScript.src)[1] : '';
  var K = { meta: 'garden_games', save: 'garden_game_' };

  function isAr() { try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; } catch (e) { return true; } }
  function t(ar, en) { return isAr() ? ar : en; }
  function tx(o) { return o ? (isAr() ? o.ar : o.en) : ''; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function get(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function num(n) { return '<span class="gm-n">' + esc(n) + '</span>'; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function today(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function dayDiff(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var x = a;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function coarse() { return matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches; }
  function fmt(kind, v) {
    if (v == null) return '—';
    if (kind === 'time') {
      var s = Math.max(0, v / 1000), m = Math.floor(s / 60), r = s - m * 60;
      return m ? m + ':' + pad2(Math.floor(r)) : r.toFixed(1) + t('ث', 's');
    }
    return Number(v).toLocaleString('en-US');
  }

  var SKILLS = {
    memory: { ar: 'ذاكرة', en: 'Memory', icon: 'fa-brain' },
    logic: { ar: 'منطق', en: 'Logic', icon: 'fa-puzzle-piece' },
    focus: { ar: 'انتباه', en: 'Focus', icon: 'fa-bullseye' },
    speed: { ar: 'سرعة', en: 'Speed', icon: 'fa-bolt' }
  };

  var GAMES = [
    { id: 'sudoku', skill: 'logic', icon: 'fa-table-cells', kind: 'time', better: 'low',
      name: { ar: 'سودوكو', en: 'Sudoku' },
      desc: { ar: 'املأ الشبكةَ بالأرقام من 1 إلى 9 بلا تكرارٍ في صفٍّ أو عمودٍ أو مربّع.', en: 'Fill the grid with 1–9, no repeats in any row, column or box.' },
      levels: [{ id: 'easy', ar: 'سهل', en: 'Easy' }, { id: 'medium', ar: 'متوسّط', en: 'Medium' }, { id: 'hard', ar: 'صعب', en: 'Hard' }, { id: 'expert', ar: 'خبير', en: 'Expert' }],
      daily: 'easy' },
    { id: 'g2048', skill: 'logic', icon: 'fa-table-cells-large', kind: 'points', better: 'high',
      name: { ar: '2048', en: '2048' },
      desc: { ar: 'اسحبْ لتدمج المربّعاتِ المتشابهة حتى تصل إلى 2048 وما بعدها.', en: 'Swipe to merge matching tiles and reach 2048 and beyond.' },
      levels: [{ id: '4', ar: '4×4', en: '4×4' }, { id: '5', ar: '5×5', en: '5×5' }],
      daily: null },
    { id: 'memory', skill: 'memory', icon: 'fa-clone', kind: 'moves', better: 'low',
      name: { ar: 'أزواجُ الذاكرة', en: 'Memory Pairs' },
      desc: { ar: 'اقلبْ البطاقاتِ واعثرْ على الأزواج — رموزاً، أو مصطلحاً وتعريفَه من موادّك.', en: 'Flip cards to find pairs — symbols, or a term and its definition from your courses.' },
      levels: [{ id: '12', ar: '12 بطاقة', en: '12 cards' }, { id: '16', ar: '16 بطاقة', en: '16 cards' }, { id: '24', ar: '24 بطاقة', en: '24 cards' }],
      daily: '12' },
    { id: 'schulte', skill: 'focus', icon: 'fa-border-all', kind: 'time', better: 'low',
      name: { ar: 'جدولُ شولت', en: 'Schulte Table' },
      desc: { ar: 'المسْ الأرقامَ بالترتيب بأسرع ما تستطيع، وعيناك على مركز الجدول.', en: 'Tap the numbers in order as fast as you can, eyes on the centre.' },
      levels: [{ id: '4', ar: '4×4', en: '4×4' }, { id: '5', ar: '5×5', en: '5×5' }, { id: '6', ar: '6×6', en: '6×6' }, { id: '5c', ar: '5×5 ملوّن', en: '5×5 colour' }],
      daily: '5' },
    { id: 'math', skill: 'speed', icon: 'fa-calculator', kind: 'points', better: 'high',
      name: { ar: 'الحسابُ الخاطف', en: 'Quick Math' },
      desc: { ar: 'ستّون ثانية: حلَّ أكبرَ عددٍ من المسائل. كلُّ إصابةٍ متتالية ترفع النقاط والصعوبة.', en: 'Sixty seconds: solve as many as you can. Streaks raise points and difficulty.' },
      levels: [{ id: 'mix', ar: 'منوّع', en: 'Mixed' }, { id: 'add', ar: 'جمعٌ وطرح', en: '+ and −' }, { id: 'mul', ar: 'ضربٌ وقسمة', en: '× and ÷' }],
      daily: 'mix' },
    { id: 'mines', skill: 'logic', icon: 'fa-bomb', kind: 'time', better: 'low',
      name: { ar: 'كاسحةُ الألغام', en: 'Minesweeper' },
      desc: { ar: 'اكشفْ كلَّ الخانات الآمنة. الرقمُ يخبرك كم لغماً حوله، وضعْ علماً حيث تشكّ.', en: 'Reveal every safe square. Each number tells how many mines touch it — flag the ones you suspect.' },
      levels: [{ id: 'easy', ar: 'مبتدئ', en: 'Beginner' }, { id: 'medium', ar: 'متوسّط', en: 'Intermediate' }, { id: 'hard', ar: 'خبير', en: 'Expert' }],
      daily: 'easy' },
    { id: 'solitaire', skill: 'logic', icon: 'fa-diamond', kind: 'time', better: 'low',
      name: { ar: 'سوليتير', en: 'Solitaire' },
      desc: { ar: 'كلوندايك الكلاسيكيّة: رتّبِ الورقَ تنازليّاً بألوانٍ متبادلة، وابنِ الأكوامَ الأربعة من الآص إلى الملك.', en: 'Classic Klondike: stack down in alternating colours and build the four foundations from Ace to King.' },
      levels: [{ id: 'draw1', ar: 'سحبُ ورقة', en: 'Draw 1' }, { id: 'draw3', ar: 'سحبُ ثلاث', en: 'Draw 3' }],
      daily: null },
    { id: 'connect4', skill: 'logic', icon: 'fa-braille', kind: 'moves', better: 'low',
      name: { ar: 'أربعةٌ في صفّ', en: 'Connect Four' },
      desc: { ar: 'أسقِطْ أقراصَك في الأعمدة وصِلْ أربعةً أفقيّاً أو عموديّاً أو قطريّاً قبل الحاسوب.', en: 'Drop your discs into the columns and line up four — across, down or diagonally — before the computer.' },
      levels: [{ id: 'easy', ar: 'سهل', en: 'Easy' }, { id: 'medium', ar: 'متوسّط', en: 'Medium' }, { id: 'hard', ar: 'صعب', en: 'Hard' }],
      daily: null },
    { id: 'slide', skill: 'logic', icon: 'fa-arrows-up-down-left-right', kind: 'moves', better: 'low',
      name: { ar: 'اللغزُ المنزلق', en: 'Sliding Puzzle' },
      desc: { ar: 'حرّكِ المربّعاتِ في الخانة الفارغة حتى تعود الأرقامُ إلى ترتيبها.', en: 'Slide tiles into the empty space until the numbers are back in order.' },
      levels: [{ id: '3', ar: '3×3', en: '3×3' }, { id: '4', ar: '4×4', en: '4×4' }, { id: '5', ar: '5×5', en: '5×5' }],
      daily: '3' },
    { id: 'hanoi', skill: 'logic', icon: 'fa-layer-group', kind: 'moves', better: 'low',
      name: { ar: 'برجُ هانوي', en: 'Tower of Hanoi' },
      desc: { ar: 'انقلِ البرجَ كلَّه إلى العمود الأخير، قرصاً قرصاً، ولا تضعْ قرصاً على أصغرَ منه.', en: 'Move the whole tower to the last peg, one disc at a time, never a larger disc on a smaller one.' },
      levels: [{ id: '3', ar: '3 أقراص', en: '3 discs' }, { id: '4', ar: '4 أقراص', en: '4 discs' }, { id: '5', ar: '5 أقراص', en: '5 discs' }, { id: '6', ar: '6 أقراص', en: '6 discs' }, { id: '7', ar: '7 أقراص', en: '7 discs' }],
      daily: null },
    { id: 'simon', skill: 'memory', icon: 'fa-circle-dot', kind: 'points', better: 'high',
      name: { ar: 'سايمون', en: 'Simon' },
      desc: { ar: 'شاهدِ الألوانَ تضيء ثمّ أعِدْها بالترتيب. كلُّ جولةٍ تضيف لوناً.', en: 'Watch the colours light up, then repeat them in order. Each round adds one more.' },
      levels: [{ id: 'normal', ar: 'عادي', en: 'Normal' }, { id: 'fast', ar: 'سريع', en: 'Fast' }],
      daily: 'normal' },
    { id: 'stroop', skill: 'focus', icon: 'fa-palette', kind: 'points', better: 'high',
      name: { ar: 'ستروب', en: 'Stroop' },
      desc: { ar: 'اختر لونَ الحبر لا معنى الكلمة — «أحمر» مكتوبةٌ بالأزرق جوابُها أزرق. ستّون ثانية.', en: 'Pick the ink colour, not the word — “RED” written in blue means blue. Sixty seconds.' },
      levels: [{ id: 'classic', ar: 'كلاسيكي', en: 'Classic' }],
      daily: 'classic' },
    { id: 'snake', skill: 'speed', icon: 'fa-worm', kind: 'points', better: 'high',
      name: { ar: 'الثعبان', en: 'Snake' },
      desc: { ar: 'وجّهِ الثعبانَ إلى الطعام فيطول، ولا تصطدمْ بالجدار ولا بذيلك.', en: 'Steer the snake to the food so it grows — don’t hit the wall or your own tail.' },
      levels: [{ id: 'slow', ar: 'بطيء', en: 'Slow' }, { id: 'normal', ar: 'عادي', en: 'Normal' }, { id: 'fast', ar: 'سريع', en: 'Fast' }],
      daily: null }
  ];
  var BY = {}; GAMES.forEach(function (g) { BY[g.id] = g; });
  var IMPL = {};

  var S = { view: 'hub', game: null, level: null, inst: null, filter: 'all', daily: null, paused: false, loading: false };

  function meta() {
    var m = get(K.meta, null) || {};
    m.best = m.best || {}; m.plays = m.plays || {}; m.days = m.days || {}; m.streak = m.streak || { n: 0, last: null };
    if (m.fx == null) m.fx = false;
    return m;
  }
  function saveMeta(m) { put(K.meta, m); }
  function bestKey(id, lv) { return id + ':' + (lv || '-'); }
  function bestOf(id, lv) { var b = meta().best[bestKey(id, lv)]; return b ? b.v : null; }
  function lastLevel(id) { var m = meta(); return (m.lv && m.lv[id]) || BY[id].levels[0].id; }

  function dailyPlan(day) {
    var r = rng(hash('garden-daily-' + day));
    var pool = GAMES.filter(function (g) { return g.daily; }).map(function (g) { return g.id; });
    var out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  }
  function dailyState() {
    var d = today(), m = meta();
    var plan = dailyPlan(d);
    var done = (m.days[d] && m.days[d].done) || [];
    var streak = m.streak.n || 0;
    if (m.streak.last && dayDiff(m.streak.last, d) > 1) streak = 0;
    return { day: d, plan: plan, done: done, streak: streak, complete: plan.every(function (id) { return done.indexOf(id) >= 0; }) };
  }
  function markDaily(id, score) {
    var d = today(), m = meta();
    var day = m.days[d] = m.days[d] || { done: [], scores: {} };
    if (day.done.indexOf(id) < 0) day.done.push(id);
    day.scores[id] = score;
    var plan = dailyPlan(d);
    if (plan.every(function (x) { return day.done.indexOf(x) >= 0; }) && m.streak.last !== d) {
      m.streak.n = (m.streak.last && dayDiff(m.streak.last, d) === 1) ? (m.streak.n || 0) + 1 : 1;
      m.streak.last = d;
      m.streak.best = Math.max(m.streak.best || 0, m.streak.n);
    }
    var keys = Object.keys(m.days).sort();
    while (keys.length > 60) delete m.days[keys.shift()];
    saveMeta(m);
  }

  var audio = null;
  function fx() { return meta().fx; }
  function sound(name) {
    if (!fx()) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      var notes = { tap: [[660, .04]], good: [[740, .06], [988, .08]], bad: [[220, .12]], win: [[523, .09], [659, .09], [784, .09], [1047, .16]], merge: [[520, .05]], tick: [[880, .02]] }[name] || [[600, .05]];
      var at = audio.currentTime;
      notes.forEach(function (n) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = name === 'bad' ? 'triangle' : 'sine';
        o.frequency.value = n[0];
        g.gain.setValueAtTime(.0001, at);
        g.gain.exponentialRampToValueAtTime(.12, at + .01);
        g.gain.exponentialRampToValueAtTime(.0001, at + n[1]);
        o.connect(g); g.connect(audio.destination);
        o.start(at); o.stop(at + n[1] + .02);
        at += n[1] * .9;
      });
    } catch (e) {}
  }
  function haptic(ms) { if (!fx()) return; try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {} }

  function loadImpl(id) {
    if (IMPL[id]) return Promise.resolve(IMPL[id]);
    if (!document.querySelector('link[data-gm-css="' + id + '"]')) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = BASE + 'games/' + id + '.css' + (VER ? '?v=' + VER : '');
      l.setAttribute('data-gm-css', id);
      document.head.appendChild(l);
    }
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = BASE + 'games/' + id + '.js' + (VER ? '?v=' + VER : '');
      s.onload = function () { IMPL[id] ? res(IMPL[id]) : rej(new Error('no impl')); };
      s.onerror = function () { rej(new Error('load')); };
      document.head.appendChild(s);
    });
  }

  function renderHub() {
    var el = $('gm-hub');
    var ds = dailyState();
    var m = meta();
    var h = '<div class="gm-head"><h1>' + t('ألعابُ الذهن', 'Brain Games') + '</h1>' +
      '<p class="gm-sub">' + t('استراحةٌ قصيرةٌ تنشّط الذاكرةَ والانتباهَ والمنطق. تُلعب بالإصبع والفأرة ولوحة المفاتيح، وتُحفظ حيث توقّفت.',
        'A short break that wakes up memory, focus and logic. Play with touch, mouse or keyboard — your game is saved where you left it.') + '</p></div>';
    h += '<section class="gm-daily" aria-labelledby="gm-daily-h">' +
      '<div class="gm-daily-top"><div><h2 id="gm-daily-h">' + t('تمرينُ اليوم', 'Today’s workout') + '</h2><p>' +
        (ds.complete ? t('أتممتَ تمرينَ اليوم. نراك غداً.', 'You finished today’s workout. See you tomorrow.') : t('ثلاثُ ألعابٍ في نحو خمس دقائق، تتغيّر كلَّ يوم.', 'Three games in about five minutes, new every day.')) + '</p></div>' +
        (ds.streak ? '<div class="gm-streak" title="' + t('أيّامٌ متتالية', 'Days in a row') + '"><i class="fa-solid fa-fire" aria-hidden="true"></i>' + num(ds.streak) + '<small>' + t(ds.streak === 1 ? 'يوم' : ds.streak === 2 ? 'يومان' : ds.streak <= 10 ? 'أيّام' : 'يوماً', ds.streak === 1 ? 'day' : 'days') + '</small></div>' : '') + '</div>' +
      '<ol class="gm-daily-list">' + ds.plan.map(function (id, i) {
        var g = BY[id], done = ds.done.indexOf(id) >= 0;
        return '<li><button type="button" class="gm-dstep' + (done ? ' done' : '') + '" data-daily="' + id + '">' +
          '<span class="gm-dico"><i class="fa-solid ' + (done ? 'fa-check' : g.icon) + '" aria-hidden="true"></i></span>' +
          '<span class="gm-dtxt"><b>' + tx(g.name) + '</b><small>' + (done ? t('أُنجز', 'Done') : tx(SKILLS[g.skill])) + '</small></span></button></li>';
      }).join('') + '</ol>' +
      (ds.complete ? '' : '<button type="button" class="gsf-btn gsf-btn--go gm-dgo" data-act="daily"><i class="fa-solid fa-play" aria-hidden="true"></i> ' +
        (ds.done.length ? t('أكمِلْ تمرينَ اليوم', 'Continue today’s workout') : t('ابدأ تمرينَ اليوم', 'Start today’s workout')) + '</button>') +
      '</section>';
    h += '<section class="gm-champs" id="gm-champs" aria-labelledby="gm-champs-h" hidden></section>';
    h += '<div class="gsf-chips gm-filter" role="group" aria-label="' + t('صنِّفْ بالمهارة', 'Filter by skill') + '">' +
      chip('all', t('الكلّ', 'All')) + Object.keys(SKILLS).map(function (k) { return chip(k, '<i class="fa-solid ' + SKILLS[k].icon + '" aria-hidden="true"></i> ' + tx(SKILLS[k])); }).join('') + '</div>';
    h += '<div class="gm-grid">' + GAMES.filter(function (g) { return S.filter === 'all' || g.skill === S.filter; }).map(function (g) {
      var lv = lastLevel(g.id), b = bestOf(g.id, lv);
      var saved = !!get(K.save + g.id + '.' + lv, null);
      return '<button type="button" class="gm-card" data-play="' + g.id + '" style="--gm-c:var(--gm-' + g.skill + ')">' +
        '<span class="gm-ico"><i class="fa-solid ' + g.icon + '" aria-hidden="true"></i></span>' +
        '<span class="gm-ctxt"><b>' + tx(g.name) + '</b><small class="gm-skill">' + tx(SKILLS[g.skill]) + '</small>' +
        '<span class="gm-desc">' + tx(g.desc) + '</span></span>' +
        '<span class="gm-cfoot">' + (saved ? '<span class="gm-saved"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> ' + t('لعبةٌ محفوظة', 'Saved game') + '</span>' : '') +
        '<span class="gm-best">' + (b != null ? '<i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + num(fmt(g.kind, b)) : t('لم تُلعب بعد', 'Not played yet')) + '</span></span></button>';
    }).join('') + '</div>';
    el.innerHTML = h;
    boardCall('hub', $('gm-champs'));
    function chip(k, label) {
      var on = S.filter === k;
      return '<button type="button" class="gsf-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-filter="' + k + '">' + label + '</button>';
    }
  }

  function open(id, opts) {
    opts = opts || {};
    var g = BY[id]; if (!g) return;
    if (S.inst) teardown();
    S.game = g;
    S.daily = opts.daily ? { day: today() } : null;
    S.level = opts.daily ? g.daily : (opts.level || lastLevel(id));
    S.view = 'game';
    $('gm-hub').hidden = true;
    var st = $('gm-stage'); st.hidden = false;
    document.body.classList.add('gm-playing');
    if (location.hash !== '#' + id) { try { history.pushState({ gm: id }, '', '#' + id); } catch (e) { location.hash = id; } }
    renderFrame();
    S.loading = true;
    $('gm-board').innerHTML = '<div class="gm-loading"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i></div>';
    loadImpl(id).then(function () { S.loading = false; if (S.game === g) start(); })
      .catch(function () {
        S.loading = false;
        $('gm-board').innerHTML = '<div class="gm-err"><p>' + t('تعذّر تحميلُ اللعبة. تحقّقْ من اتّصالك.', 'Couldn’t load the game. Check your connection.') + '</p><button type="button" class="gsf-btn" data-act="reload-game">' + t('أعِدِ المحاولة', 'Retry') + '</button></div>';
      });
    window.scrollTo(0, 0);
  }

  function renderFrame() {
    $('gm-stage').innerHTML = '<div id="gm-head">' + headHTML() + '</div>' +
      '<div class="gm-status" id="gm-status" aria-live="polite"></div>' +
      '<div class="gm-board" id="gm-board"></div>' +
      '<div class="gm-controls" id="gm-controls"></div>' +
      '<div class="gm-over" id="gm-over" hidden></div>';
  }
  function headHTML() {
    var g = S.game;
    var lvChips = (!S.daily && g.levels.length > 1) ? '<div class="gsf-chips gm-levels" role="group" aria-label="' + t('المستوى', 'Level') + '">' + g.levels.map(function (l) {
      var on = l.id === S.level;
      return '<button type="button" class="gsf-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-level="' + esc(l.id) + '">' + esc(tx(l)) + '</button>';
    }).join('') + '</div>' : '';
    var ds = S.daily ? dailyState() : null;
    return '<div class="gm-bar">' +
        '<button type="button" class="gm-ib" data-act="back" aria-label="' + t('عودةٌ إلى الألعاب', 'Back to games') + '" data-ar-title="عودةٌ إلى الألعاب" data-en-title="Back to games"><i class="fa-solid fa-arrow-right gm-flip" aria-hidden="true"></i></button>' +
        '<div class="gm-title"><b>' + tx(g.name) + '</b>' + (S.daily ? '<small>' + t('تمرينُ اليوم', 'Today’s workout') + ' · ' + num((ds.plan.indexOf(g.id) + 1) + '/3') + '</small>' : '<small>' + tx(SKILLS[g.skill]) + '</small>') + '</div>' +
        '<div class="gm-tools">' +
          '<button type="button" class="gm-ib" data-act="board" aria-label="' + t('لوحةُ الصدارة', 'Leaderboard') + '" data-ar-title="لوحةُ الصدارة" data-en-title="Leaderboard"><i class="fa-solid fa-trophy" aria-hidden="true"></i></button>' +
          '<button type="button" class="gm-ib" data-act="help" aria-label="' + t('كيف تُلعب', 'How to play') + '" data-ar-title="كيف تُلعب" data-en-title="How to play"><i class="fa-solid fa-circle-question" aria-hidden="true"></i></button>' +
          '<button type="button" class="gm-ib' + (fx() ? ' on' : '') + '" data-act="fx" aria-pressed="' + fx() + '" aria-label="' + t('الأصواتُ والاهتزاز', 'Sound and vibration') + '" data-ar-title="الأصواتُ والاهتزاز" data-en-title="Sound and vibration"><i class="fa-solid ' + (fx() ? 'fa-volume-high' : 'fa-volume-xmark') + '" aria-hidden="true"></i></button>' +
          '<button type="button" class="gm-ib" data-act="restart" aria-label="' + t('ابدأ من جديد', 'Restart') + '" data-ar-title="ابدأ من جديد" data-en-title="Restart"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i></button>' +
        '</div>' +
      '</div>' +
      lvChips;
  }

  function ctxFor(g) {
    var seed = S.daily ? hash('garden-' + g.id + '-' + S.daily.day) : (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    return {
      level: S.level, daily: !!S.daily, seed: seed, rng: rng(seed), isAr: isAr, t: t, esc: esc, num: num, fmt: fmt,
      reduced: reduced(), base: BASE, touch: coarse(),
      board: $('gm-board'), controls: $('gm-controls'),
      status: function (html) { var s = $('gm-status'); if (s) s.innerHTML = html || ''; },
      sound: sound, haptic: haptic,
      best: function () { return bestOf(g.id, S.level); },
      save: function (state) { if (!S.daily) put(K.save + g.id + '.' + S.level, { level: S.level, at: Date.now(), state: state }); },
      load: function () { if (S.daily) return null; var s = get(K.save + g.id + '.' + S.level, null); return (s && s.level === S.level) ? s.state : null; },
      clearSave: function () { if (S.daily) return; try { localStorage.removeItem(K.save + g.id + '.' + S.level); } catch (e) {} },
      finish: function (r) { finish(g, r); },
      rngFrom: rng, hash: hash
    };
  }

  function start() {
    var g = S.game;
    if (S.inst) teardown();
    var o = $('gm-over'); if (o) { o.hidden = true; o.innerHTML = ''; }
    $('gm-board').innerHTML = ''; $('gm-controls').innerHTML = ''; $('gm-status').innerHTML = '';
    S.paused = false;
    var m = meta(); m.lv = m.lv || {}; if (!S.daily) m.lv[g.id] = S.level; saveMeta(m);
    S.ctx = ctxFor(g);
    try { S.inst = IMPL[g.id].mount(S.ctx) || {}; }
    catch (e) { $('gm-board').innerHTML = '<div class="gm-err"><p>' + t('حدث خطأٌ في اللعبة.', 'Something went wrong in the game.') + '</p></div>'; S.inst = null; }
  }
  function teardown() {
    try { if (S.inst && S.inst.destroy) S.inst.destroy(); } catch (e) {}
    S.inst = null;
  }

  function finish(g, r) {
    r = r || {};
    var m = meta(), key = bestKey(g.id, S.level), prev = m.best[key] ? m.best[key].v : null;
    var isBest = false;
    if (r.won !== false && r.score != null) {
      isBest = prev == null || (g.better === 'low' ? r.score < prev : r.score > prev);
      if (isBest) m.best[key] = { v: r.score, at: Date.now() };
      var day = today(), lg = m.log = m.log || {}, dl = lg[day] = lg[day] || {}, cur = dl[key];
      if (!cur || (g.better === 'low' ? r.score < cur.v : r.score > cur.v)) dl[key] = { v: r.score };
      var lk = Object.keys(lg).sort();
      while (lk.length > 62) delete lg[lk.shift()];
    }
    m.plays[g.id] = (m.plays[g.id] || 0) + 1;
    saveMeta(m);
    if (S.daily && r.won !== false) markDaily(g.id, r.score);
    try { if (window.GardenEv) GardenEv('brain_game', { g: g.id, lv: S.level, s: r.score, w: r.won !== false ? 1 : 0, d: S.daily ? 1 : 0 }); } catch (e) {}
    sound(r.won === false ? 'bad' : 'win');
    var o = $('gm-over'); if (!o) return;
    var ds = S.daily ? dailyState() : null;
    var next = ds ? ds.plan.filter(function (id) { return ds.done.indexOf(id) < 0; })[0] : null;
    var won = r.won !== false;
    o.innerHTML = '<div class="gm-res" role="dialog" aria-modal="true" aria-labelledby="gm-res-h">' +
      '<span class="gm-res-ico ' + (won ? 'ok' : 'no') + '"><i class="fa-solid ' + (won ? (isBest ? 'fa-trophy' : 'fa-star') : 'fa-hourglass-end') + '" aria-hidden="true"></i></span>' +
      '<h2 id="gm-res-h">' + esc(r.title || (won ? t('أحسنت!', 'Well done!') : t('انتهت اللعبة', 'Game over'))) + '</h2>' +
      (r.score != null ? '<p class="gm-res-score">' + num(fmt(g.kind, r.score)) + (r.unit ? ' <small>' + esc(r.unit) + '</small>' : '') + '</p>' : '') +
      (isBest && prev != null ? '<p class="gm-res-best"><i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + t('رقمٌ قياسيٌّ جديد!', 'New personal best!') + '</p>'
        : (prev != null || isBest) ? '<p class="gm-res-prev">' + t('أفضلُ نتيجةٍ لك: ', 'Your best: ') + num(fmt(g.kind, isBest ? r.score : prev)) + '</p>' : '') +
      (r.detail ? '<p class="gm-res-detail">' + r.detail + '</p>' : '') +
      '<div class="gm-res-lb" id="gm-res-lb"></div>' +
      (ds && ds.complete ? '<p class="gm-res-daily"><i class="fa-solid fa-fire" aria-hidden="true"></i> ' + t('أتممتَ تمرينَ اليوم! سلسلتُك: ', 'Workout complete! Streak: ') + num(ds.streak) + '</p>' : '') +
      '<div class="gm-res-acts">' +
        (next ? '<button type="button" class="gsf-btn gsf-btn--go" data-act="daily-next" data-next="' + next + '"><i class="fa-solid fa-forward" aria-hidden="true"></i> ' + t('اللعبةُ التالية: ', 'Next: ') + tx(BY[next].name) + '</button>'
          : '<button type="button" class="gsf-btn gsf-btn--go" data-act="again"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> ' + t('العبْ مرّةً أخرى', 'Play again') + '</button>') +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-act="back">' + t('كلُّ الألعاب', 'All games') + '</button>' +
      '</div></div>';
    o.hidden = false;
    boardCall('finished', { g: g.id, lv: S.level, score: r.score, won: won, el: $('gm-res-lb') });
    var b = o.querySelector('.gsf-btn--go'); if (b) setTimeout(function () { b.focus({ preventScroll: true }); }, 60);
    if (won && isBest && !reduced()) { try { if (window.Garden && Garden.launchConfetti && prev != null) Garden.launchConfetti(); } catch (e) {} }
  }

  function showHelp() {
    var g = S.game, impl = IMPL[g.id];
    var o = $('gm-over'); if (!o) return;
    var help = impl && impl.help ? impl.help(isAr()) : tx(g.desc);
    if (S.inst && S.inst.pause) S.inst.pause();
    o.innerHTML = '<div class="gm-res gm-help" role="dialog" aria-modal="true" aria-labelledby="gm-help-h">' +
      '<span class="gm-res-ico"><i class="fa-solid ' + g.icon + '" aria-hidden="true"></i></span>' +
      '<h2 id="gm-help-h">' + t('كيف تُلعب ', 'How to play ') + tx(g.name) + '</h2><div class="gm-help-b">' + help + '</div>' +
      '<div class="gm-res-acts"><button type="button" class="gsf-btn gsf-btn--go" data-act="help-close">' + t('فهمت', 'Got it') + '</button></div></div>';
    o.hidden = false;
    var b = o.querySelector('.gsf-btn--go'); if (b) b.focus({ preventScroll: true });
  }
  function pauseOverlay() {
    if (!S.inst || !S.inst.pause || S.paused) return;
    var o = $('gm-over'); if (!o || !o.hidden) return;
    S.inst.pause();
    S.paused = true;
    o.innerHTML = '<div class="gm-res gm-paused" role="dialog" aria-modal="true" aria-labelledby="gm-pause-h">' +
      '<span class="gm-res-ico"><i class="fa-solid fa-pause" aria-hidden="true"></i></span><h2 id="gm-pause-h">' + t('اللعبةُ متوقّفة', 'Paused') + '</h2>' +
      '<div class="gm-res-acts"><button type="button" class="gsf-btn gsf-btn--go" data-act="resume"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + t('تابِعْ', 'Resume') + '</button></div></div>';
    o.hidden = false;
  }
  function closeOverlay() {
    var o = $('gm-over'); if (o) { o.hidden = true; o.innerHTML = ''; }
    if (S.inst && S.inst.resume) S.inst.resume();
    S.paused = false;
  }

  function backToHub(fromPop) {
    teardown();
    S.view = 'hub'; S.game = null; S.daily = null;
    $('gm-stage').hidden = true; $('gm-stage').innerHTML = '';
    $('gm-hub').hidden = false;
    document.body.classList.remove('gm-playing');
    if (!fromPop && location.hash) { try { history.pushState({}, '', location.pathname + location.search); } catch (e) { location.hash = ''; } }
    renderHub();
    window.scrollTo(0, 0);
  }

  function onClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (d.filter) { S.filter = d.filter; renderHub(); return; }
    if (d.play) return open(d.play);
    if (d.daily) return open(d.daily, { daily: true });
    if (d.level) { S.level = d.level; $('gm-head').innerHTML = headHTML(); start(); return; }
    switch (d.act) {
      case 'daily': var ds = dailyState(); var nx = ds.plan.filter(function (id) { return ds.done.indexOf(id) < 0; })[0]; if (nx) open(nx, { daily: true }); return;
      case 'daily-next': return open(d.next, { daily: true });
      case 'back': return backToHub();
      case 'again': return start();
      case 'restart': if (S.ctx) S.ctx.clearSave(); return start();
      case 'help': return showHelp();
      case 'board': if (S.inst && S.inst.pause && S.view === 'game' && $('gm-over') && $('gm-over').hidden) pauseOverlay(); return boardCall('open', { g: d.bg || (S.game && S.game.id), lv: d.blv || (S.game && S.level) });
      case 'help-close': case 'resume': return closeOverlay();
      case 'fx':
        var m = meta(); m.fx = !m.fx; saveMeta(m);
        b.classList.toggle('on', m.fx); b.setAttribute('aria-pressed', m.fx);
        b.innerHTML = '<i class="fa-solid ' + (m.fx ? 'fa-volume-high' : 'fa-volume-xmark') + '" aria-hidden="true"></i>';
        if (m.fx) sound('good');
        return;
      case 'reload-game': return open(S.game.id, { daily: !!S.daily, level: S.level });
    }
  }

  function onKey(e) {
    if (S.view !== 'game') return;
    if (window.GardenGames.board && GardenGames.board.isOpen()) return;
    var tg = e.target;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var o = $('gm-over');
    if (o && !o.hidden) {
      if (e.key === 'Escape') { if (o.querySelector('[data-act="help-close"],[data-act="resume"]')) closeOverlay(); else backToHub(); e.preventDefault(); e.stopPropagation(); }
      return;
    }
    var handled = false;
    if (S.inst && S.inst.key) { try { handled = !!S.inst.key(e); } catch (er) { handled = false; } }
    if (!handled && (e.key === 'p' || e.key === 'P')) { pauseOverlay(); handled = true; }
    if (!handled && e.key === 'Escape') { backToHub(); handled = true; }
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (handled || k === 't' || k === 'l' || k === '+' || k === '-' || k === '=' || k === '_' || k === ' ' || /^Arrow/.test(k)) {
      e.preventDefault(); e.stopPropagation();
    }
  }

  function boardCall(name, arg) {
    var B = window.GardenGames && GardenGames.board;
    if (B && B[name]) { try { return B[name](arg); } catch (e) {} }
  }
  function loadBoard() {
    var s = document.createElement('script');
    s.src = BASE + 'games-board.js' + (VER ? '?v=' + VER : '');
    document.head.appendChild(s);
  }

  function route() {
    var id = (location.hash || '').replace('#', '');
    if (id && BY[id]) { if (!S.game || S.game.id !== id) open(id); }
    else if (S.view === 'game') backToHub(true);
  }

  function boot() {
    var root = $('gm-root');
    root.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('popstate', route);
    document.addEventListener('visibilitychange', function () { if (document.hidden && S.view === 'game') pauseOverlay(); });
    document.addEventListener('garden:languageChanged', function () {
      boardCall('lang');
      if (S.view === 'hub') renderHub();
      else if (S.game) {
        var hd = $('gm-head'); if (hd) hd.innerHTML = headHTML();
        if (S.inst && S.inst.lang) S.inst.lang();
      }
    });
    renderHub();
    route();
    loadBoard();
  }

  window.GardenGames = {
    register: function (id, impl) { IMPL[id] = impl; },
    list: GAMES, _state: S,
    _host: { list: GAMES, by: BY, fmt: fmt, t: t, tx: tx, esc: esc, num: num, today: today, meta: meta, lastLevel: lastLevel },
    _boardReady: function () { if (S.view === 'hub') boardCall('hub', $('gm-champs')); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
