;(function () {
  'use strict';

  var COLORS = [
    { ar: 'أحمر', en: 'Red' },
    { ar: 'أزرق', en: 'Blue' },
    { ar: 'أخضر', en: 'Green' },
    { ar: 'أصفر', en: 'Yellow' }
  ];
  var SHAPES = [
    { ar: 'دائرة', en: 'Circle', id: 'circle' },
    { ar: 'مثلّث', en: 'Triangle', id: 'triangle' },
    { ar: 'مربّع', en: 'Square', id: 'square' },
    { ar: 'نجمة', en: 'Star', id: 'star' }
  ];
  var RULES = [
    { ar: 'اللون', en: 'Colour', icon: 'fa-palette' },
    { ar: 'الشكل', en: 'Shape', icon: 'fa-shapes' }
  ];
  var LEVELS = {
    easy: { sw: 0.25, prep: 700 },
    medium: { sw: 0.40, prep: 500 },
    hard: { sw: 0.50, prep: 300 }
  };
  var N = 4, ROUND = 60000, CD_MS = 650, LOCK_MS = 420, GOOD = 10, BAD = 5, MIN_RT = 150;

  function starPoints() {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? 20 : 47, a = -Math.PI / 2 + i * Math.PI / 5;
      p.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (53 + r * Math.sin(a)).toFixed(1));
    }
    return p.join(' ');
  }
  var GLYPH = {
    circle: '<circle cx="50" cy="50" r="42"/>',
    triangle: '<polygon points="50,8 94,88 6,88" stroke-linejoin="round"/>',
    square: '<rect x="12" y="12" width="76" height="76" rx="7"/>',
    star: '<polygon points="' + starPoints() + '" stroke-linejoin="round"/>'
  };
  function svg(shape, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + GLYPH[SHAPES[shape].id] + '</svg>';
  }

  function cfg(level) { return LEVELS[level] || LEVELS.medium; }
  function trial(rng, prev, pSwitch) {
    var rule, sw;
    if (!prev) { rule = rng() < 0.5 ? 0 : 1; sw = null; }
    else { sw = rng() < pSwitch; rule = sw ? 1 - prev.rule : prev.rule; }
    var pick = Math.floor(rng() * (prev ? N * N - 1 : N * N));
    if (prev && pick >= prev.c * N + prev.s) pick++;
    return { rule: rule, c: Math.floor(pick / N), s: pick % N, sw: sw };
  }
  function answerOf(tr) { return tr.rule === 0 ? tr.c : tr.s; }
  function fresh() { return { points: 0, streak: 0, best: 0, correct: 0, wrong: 0, rt: 0, rtSw: 0, nSw: 0, rtRep: 0, nRep: 0 }; }
  function multOf(n) { return n >= 10 ? 3 : n >= 5 ? 2 : 1; }
  function step(s, ok, rt, sw) {
    if (ok) {
      s.streak++; s.correct++;
      if (s.streak > s.best) s.best = s.streak;
      rt = rt || 0;
      s.rt += rt;
      if (sw === true) { s.rtSw += rt; s.nSw++; }
      else if (sw === false) { s.rtRep += rt; s.nRep++; }
      var g = GOOD * multOf(s.streak);
      s.points += g;
      return g;
    }
    s.wrong++; s.streak = 0;
    var l = Math.min(BAD, s.points);
    s.points -= l;
    return -l;
  }
  function switchCost(s) {
    if (!s.nSw || !s.nRep) return null;
    return Math.round(s.rtSw / s.nSw - s.rtRep / s.nRep);
  }
  function summary(s) {
    var n = s.correct + s.wrong;
    return { n: n, acc: n ? Math.round(s.correct * 100 / n) : 0, avg: s.correct ? Math.round(s.rt / s.correct) : null, cost: switchCost(s) };
  }
  function grade(r) {
    if (r.n >= 25 && r.acc >= 90) return 1;
    if (r.acc < 65) return -1;
    return 0;
  }
  function maxScore(level) {
    var n = Math.floor(ROUND / (cfg(level).prep + MIN_RT)), s = fresh();
    for (var i = 0; i < n; i++) step(s, true, MIN_RT, false);
    return s.points;
  }
  function timer(now) {
    var acc = 0, at = 0, on = false;
    return {
      start: function () { acc = 0; at = now(); on = true; },
      pause: function () { if (!on) return; acc += now() - at; on = false; },
      resume: function () { if (on) return; at = now(); on = true; },
      stop: function (v) { if (on) { acc += now() - at; on = false; } if (v != null) acc = v; },
      get: function () { return acc + (on ? now() - at : 0); },
      on: function () { return on; }
    };
  }
  function keyIndex(k) {
    if (typeof k !== 'string' || k.length !== 1) return -1;
    var d = '1234'.indexOf(k);
    if (d < 0) d = '١٢٣٤'.indexOf(k);
    if (d < 0) d = '۱۲۳۴'.indexOf(k);
    return d;
  }

  function mount(ctx) {
    var t = ctx.t;
    var lv = cfg(ctx.level);
    var s = fresh();
    var clk = timer(function () { return performance.now(); });
    var phase = 'start', cur = null, shownAt = 0, cardOn = false, raf = 0, lastSec = 60, cdTimer = 0, cdN = 0;
    var lock = 0, locked = false, prepTimer = 0, shownMult = 1, dead = false, padRule = -1;
    var fxTimers = {};

    var root = document.createElement('div');
    root.className = 'gsw';
    root.innerHTML = '<div class="gsw-track" aria-hidden="true"><div class="gsw-fill"></div></div>' +
      '<div class="gsw-stage">' +
        '<span class="gsw-x" hidden></span>' +
        '<div class="gsw-start"></div>' +
        '<div class="gsw-count" hidden aria-live="assertive"></div>' +
        '<div class="gsw-q" hidden>' +
          '<div class="gsw-cue" aria-live="polite"></div>' +
          '<div class="gsw-card" role="img"></div>' +
        '</div>' +
        '<div class="gsw-end" hidden></div>' +
      '</div>';
    ctx.board.appendChild(root);
    var fill = root.querySelector('.gsw-fill');
    var stage = root.querySelector('.gsw-stage');
    var badge = root.querySelector('.gsw-x');
    var startEl = root.querySelector('.gsw-start');
    var countEl = root.querySelector('.gsw-count');
    var qEl = root.querySelector('.gsw-q');
    var cueEl = root.querySelector('.gsw-cue');
    var cardEl = root.querySelector('.gsw-card');
    var endEl = root.querySelector('.gsw-end');

    var pad = document.createElement('div');
    pad.className = 'gsw-pad gsw-pad--off';
    var html = '';
    for (var bi = 0; bi < N; bi++) html += '<button type="button" class="gsw-b" data-i="' + bi + '"></button>';
    pad.innerHTML = html;
    ctx.controls.appendChild(pad);
    var btns = [].slice.call(pad.querySelectorAll('.gsw-b'));

    function num(v) { return ctx.num ? ctx.num(v) : String(v); }
    function nm(o) { return t(o.ar, o.en); }

    function cueHTML(rule) {
      return '<i class="fa-solid ' + RULES[rule].icon + '" aria-hidden="true"></i><span>' + nm(RULES[rule]) + '</span>';
    }
    function startHTML() {
      var b = ctx.best();
      return '<p class="gsw-rule">' + t('فوقَ البطاقة قاعدةٌ: «اللون» أو «الشكل». أجبْ بحسبها، وانتبهْ: القاعدةُ تتبدّل بلا إنذار. ستّون ثانية.', 'Above the card is a rule: Colour or Shape. Answer by that rule — and watch out, it switches without warning. Sixty seconds.') + '</p>' +
        '<div class="gsw-egs">' +
          '<p class="gsw-eg"><span class="gsw-cue gsw-cue--sm" data-rule="0">' + cueHTML(0) + '</span><span class="gsw-eg-c" data-ink="0">' + svg(3, 'gsw-eg-s') + '</span><i class="fa-solid fa-arrow-left gm-flip" aria-hidden="true"></i><b>' + nm(COLORS[0]) + '</b></p>' +
          '<p class="gsw-eg"><span class="gsw-cue gsw-cue--sm" data-rule="1">' + cueHTML(1) + '</span><span class="gsw-eg-c" data-ink="0">' + svg(3, 'gsw-eg-s') + '</span><i class="fa-solid fa-arrow-left gm-flip" aria-hidden="true"></i><b>' + nm(SHAPES[3]) + '</b></p>' +
        '</div>' +
        '<button type="button" class="gsf-btn gsf-btn--go gsw-go" data-gsw="go"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + t('ابدأ', 'Start') + '</button>' +
        (b != null ? '<p class="gsw-best"><i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + t('أفضلُ نتيجة: ', 'Best: ') + num(ctx.fmt('points', b)) + '</p>' : '') +
        '<p class="gsw-hint">' + t('<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> للإجابة · <kbd>P</kbd> للإيقاف', '<kbd>1</kbd>–<kbd>4</kbd> to answer · <kbd>P</kbd> pauses') + '</p>';
    }
    function endHTML() {
      return '<p class="gsw-endt"><i class="fa-solid fa-stopwatch" aria-hidden="true"></i> ' + t('انتهى الوقت', 'Time’s up') + '</p>';
    }
    function paintPad(rule, force) {
      if (rule === padRule && !force) return;
      padRule = rule;
      pad.setAttribute('data-rule', rule);
      pad.setAttribute('role', 'group');
      pad.setAttribute('aria-label', t('الجوابُ بحسب ', 'Answer by ') + nm(RULES[rule]));
      btns.forEach(function (b, i) {
        var mark = rule === 0
          ? '<span class="gsw-sw" data-ink="' + i + '" aria-hidden="true"></span>'
          : svg(i, 'gsw-bs');
        b.innerHTML = mark + '<span class="gsw-bn">' + nm(rule === 0 ? COLORS[i] : SHAPES[i]) + '</span><kbd class="gsw-kh" aria-hidden="true">' + (i + 1) + '</kbd>';
      });
      if (!ctx.reduced && phase === 'play') { pad.classList.remove('gsw-pad--in'); void pad.offsetWidth; pad.classList.add('gsw-pad--in'); }
    }

    function stat(label, value) { return '<span class="gm-stat"><small>' + label + '</small><b>' + value + '</b></span>'; }
    function paint() {
      ctx.status(stat(t('النقاط', 'Points'), ctx.fmt('points', s.points)) +
        stat(t('السلسلة', 'Streak'), s.streak) +
        stat(t('الوقت', 'Time'), '<span id="gsw-time">' + lastSec + '</span>' + t('ث', 's')));
    }
    function paintBadge() {
      var m = multOf(s.streak);
      if (m === shownMult) return;
      shownMult = m;
      badge.hidden = m === 1;
      badge.textContent = '×' + m;
      badge.classList.toggle('gsw-x--3', m === 3);
      badge.classList.remove('gsw-pop'); void badge.offsetWidth; badge.classList.add('gsw-pop');
    }
    function paintCue() {
      if (!cur) return;
      cueEl.setAttribute('data-rule', cur.rule);
      stage.setAttribute('data-rule', cur.rule);
      cueEl.innerHTML = cueHTML(cur.rule);
    }
    function paintCard() {
      if (!cur || !cardOn) { cardEl.innerHTML = ''; cardEl.removeAttribute('data-ink'); cardEl.setAttribute('aria-label', t('استعدّ…', 'Get ready…')); return; }
      cardEl.setAttribute('data-ink', cur.c);
      cardEl.innerHTML = svg(cur.s, 'gsw-shape');
      cardEl.setAttribute('aria-label', t(SHAPES[cur.s].ar + ' ' + (cur.s === 0 || cur.s === 3 ? 'لونُها ' : 'لونُه ') + COLORS[cur.c].ar, COLORS[cur.c].en + ' ' + SHAPES[cur.s].en.toLowerCase()));
    }
    function canAnswer() { return phase === 'play' && clk.on() && !locked && cardOn; }
    function padState() { pad.classList.toggle('gsw-pad--off', !(phase === 'play' && clk.on())); }
    function show(el) { [startEl, countEl, qEl, endEl].forEach(function (x) { x.hidden = x !== el; }); }

    function showCard() {
      prepTimer = 0;
      if (dead || phase !== 'play' || !clk.on()) return;
      cardOn = true;
      shownAt = clk.get();
      paintCard();
      if (!ctx.reduced) { cardEl.classList.remove('gsw-in'); void cardEl.offsetWidth; cardEl.classList.add('gsw-in'); }
    }
    function present() {
      cardOn = false;
      paintCue();
      paintCard();
      paintPad(cur.rule);
      if (cur.sw && !ctx.reduced) { cueEl.classList.remove('gsw-pop'); void cueEl.offsetWidth; cueEl.classList.add('gsw-pop'); }
      clearTimeout(prepTimer);
      prepTimer = setTimeout(showCard, lv.prep);
      padState();
    }
    function next() {
      cur = trial(ctx.rng, cur, lv.sw);
      present();
    }
    function flash(bad) {
      stage.classList.remove('gsw-flash', 'gsw-flash--bad'); void stage.offsetWidth;
      stage.classList.add('gsw-flash');
      if (bad) stage.classList.add('gsw-flash--bad');
    }
    function gainFx(g) {
      var el = document.createElement('span');
      el.className = 'gsw-gain' + (g < 0 ? ' gsw-gain--bad' : '');
      el.textContent = (g < 0 ? '−' + (-g) : '+' + g);
      stage.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ctx.reduced ? 450 : 700);
    }
    function mark(i, cls, ms) {
      var b = btns[i];
      if (!b) return;
      var id = cls + i;
      b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls);
      clearTimeout(fxTimers[id]);
      fxTimers[id] = setTimeout(function () { b.classList.remove(cls); }, ms);
    }
    function answer(i) {
      if (!canAnswer() || i < 0 || i >= N) return;
      var right = answerOf(cur), ok = i === right;
      var g = step(s, ok, clk.get() - shownAt, cur.sw);
      if (ok) {
        ctx.sound('good');
        mark(i, 'down', 110);
        flash(false);
        gainFx(g);
        next();
      } else {
        ctx.sound('bad'); ctx.haptic(30);
        mark(i, 'gsw-b--bad', LOCK_MS);
        mark(right, 'gsw-b--hint', LOCK_MS);
        flash(true);
        if (g < 0) gainFx(g);
        locked = true;
        padState();
        lock = setTimeout(function () { lock = 0; locked = false; if (phase === 'play' && clk.on()) next(); }, LOCK_MS);
      }
      paintBadge();
      paint();
    }

    function loop() {
      var left = Math.max(0, ROUND - clk.get());
      fill.style.transform = 'scaleX(' + (left / ROUND).toFixed(4) + ')';
      var sec = Math.ceil(left / 1000);
      if (sec !== lastSec) {
        lastSec = sec;
        var el = document.getElementById('gsw-time');
        if (el) el.textContent = sec;
        if (sec <= 10 && sec > 0) { root.classList.add('gsw--warn'); ctx.sound('tick'); }
      }
      if (left <= 0) { end(); return; }
      raf = requestAnimationFrame(loop);
    }
    function go() {
      phase = 'play';
      show(qEl);
      lastSec = 60;
      clk.start();
      next();
      paint();
      raf = requestAnimationFrame(loop);
    }
    function tickCd() {
      if (dead) return;
      if (cdN === 0) { cdTimer = 0; go(); return; }
      countEl.innerHTML = '<span>' + cdN + '</span>';
      ctx.sound('tick');
      cdN--;
      cdTimer = setTimeout(tickCd, CD_MS);
    }
    function countdown() { cdN = 3; tickCd(); }
    function begin() {
      if (phase !== 'start') return;
      phase = 'count';
      show(countEl);
      countdown();
    }
    function end() {
      if (phase === 'over') return;
      phase = 'over';
      clk.stop(ROUND);
      cancelAnimationFrame(raf);
      if (lock) { clearTimeout(lock); lock = 0; }
      if (prepTimer) { clearTimeout(prepTimer); prepTimer = 0; }
      locked = false; cardOn = false;
      fill.style.transform = 'scaleX(0)';
      lastSec = 0;
      endEl.innerHTML = endHTML();
      show(endEl);
      padState();
      paint();
      var r = summary(s);
      ctx.finish({
        won: true, score: s.points, unit: t('نقطة', 'pts'), grade: grade(r),
        detail: t('صحيحة: ', 'Correct: ') + num(s.correct + '/' + r.n) + ' · ' + t('الدقّة: ', 'Accuracy: ') + num(r.acc + '%') + ' · ' +
          t('كلفةُ التبديل: ', 'Switch cost: ') + (r.cost == null ? '—' : num((r.cost > 0 ? '+' : '') + r.cost) + ' ' + t('ملّي ثانية', 'ms'))
      });
    }

    function onRootClick(e) {
      if (e.target.closest('[data-gsw="go"]')) begin();
    }
    function onPadDown(e) {
      var b = e.target.closest('.gsw-b');
      if (!b) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      answer(Number(b.dataset.i));
    }
    function onPadClick(e) {
      if (e.detail !== 0) return;
      var b = e.target.closest('.gsw-b');
      if (b) answer(Number(b.dataset.i));
    }
    root.addEventListener('click', onRootClick);
    pad.addEventListener('pointerdown', onPadDown);
    pad.addEventListener('click', onPadClick);

    startEl.innerHTML = startHTML();
    paintPad(0, true);
    paint();

    function cols() { return matchMedia('(min-width: 600px)').matches ? 4 : 2; }

    return {
      destroy: function () {
        dead = true;
        clk.stop();
        cancelAnimationFrame(raf);
        clearTimeout(lock); clearTimeout(cdTimer); clearTimeout(prepTimer);
        Object.keys(fxTimers).forEach(function (k) { clearTimeout(fxTimers[k]); });
        root.removeEventListener('click', onRootClick);
        pad.removeEventListener('pointerdown', onPadDown);
        pad.removeEventListener('click', onPadClick);
      },
      pause: function () {
        if (phase === 'count') {
          if (cdTimer) { clearTimeout(cdTimer); cdTimer = 0; }
          root.classList.add('gsw--hide');
          return;
        }
        if (phase !== 'play' || !clk.on()) return;
        clk.pause();
        cancelAnimationFrame(raf);
        if (lock) { clearTimeout(lock); lock = 0; }
        if (prepTimer) { clearTimeout(prepTimer); prepTimer = 0; }
        root.classList.add('gsw--hide');
        pad.classList.add('gsw-pad--hide');
        padState();
      },
      resume: function () {
        root.classList.remove('gsw--hide');
        pad.classList.remove('gsw-pad--hide');
        if (phase === 'count') { if (!cdTimer) countdown(); return; }
        if (phase !== 'play' || clk.on()) return;
        clk.resume();
        if (locked) { locked = false; next(); }
        else if (!cardOn) present();
        padState();
        raf = requestAnimationFrame(loop);
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        var k = e.key;
        if (phase === 'start') {
          if (k === 'Enter' || k === ' ') {
            var fb = document.activeElement;
            if (fb && fb.tagName === 'BUTTON' && !root.contains(fb)) return false;
            if (!e.repeat) begin();
            return true;
          }
          return false;
        }
        if (phase === 'count') return k === 'Enter' || k === ' ' || keyIndex(k) >= 0;
        if (phase !== 'play') return false;
        var i = keyIndex(k);
        if (i >= 0) { if (!e.repeat) answer(i); return true; }
        var c = cols(), dirs = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: c, ArrowUp: -c };
        if (dirs[k] != null) {
          var at = btns.indexOf(document.activeElement);
          btns[at < 0 ? 0 : Math.max(0, Math.min(N - 1, at + dirs[k]))].focus();
          return true;
        }
        if (k === ' ' || k === 'Enter') {
          var f = document.activeElement, fi = btns.indexOf(f);
          if (fi >= 0) { if (!e.repeat) answer(fi); return true; }
          if (f && f.tagName === 'BUTTON' && !root.contains(f)) return false;
          return k === ' ';
        }
        return false;
      },
      lang: function () {
        if (phase === 'start') startEl.innerHTML = startHTML();
        if (phase === 'over') endEl.innerHTML = endHTML();
        paintPad(padRule < 0 ? 0 : padRule, true);
        paintCue();
        paintCard();
        padState();
        paint();
      }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>تظهر بطاقةٌ عليها شكلٌ ملوّن، وفوقها القاعدة: «اللون» <i class="fa-solid fa-palette" aria-hidden="true"></i> أو «الشكل» <i class="fa-solid fa-shapes" aria-hidden="true"></i>.</li><li>إن كانت القاعدةُ «اللون» فاختر لونَه، وإن كانت «الشكل» فاختر شكلَه. الأزرارُ الأربعة تتبدّل مع القاعدة.</li><li>القاعدةُ تتكرّر أحياناً وتتبدّل أحياناً بلا إنذار. في المستوى الصعب تتبدّل أكثر، ولا تظهر قبل البطاقة إلّا بلحظةٍ قصيرة.</li><li>لديك ستّون ثانية بعد العدّ 3‑2‑1. كلُّ إصابةٍ 10 نقاط، تتضاعف ×2 من الخامسة المتتالية و×3 من العاشرة، والخطأُ يخصم 5 ويقطع السلسلة.</li><li><b>كلفةُ التبديل</b>: كم تبطؤ حين تتغيّر القاعدةُ للتوّ مقارنةً بتكرارها — كلّما قلّت كان أفضل.</li><li>اللمس: المسِ الزرّ. لوحةُ المفاتيح: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> للأزرار بالترتيب، والأسهمُ مع <kbd>Enter</kbd>، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>A card shows a coloured shape, and above it the rule: Colour <i class="fa-solid fa-palette" aria-hidden="true"></i> or Shape <i class="fa-solid fa-shapes" aria-hidden="true"></i>.</li><li>When the rule is Colour, pick its colour; when it is Shape, pick its shape. The four buttons change with the rule.</li><li>The rule sometimes repeats and sometimes switches without warning. On Hard it switches more often and appears only a moment before the card.</li><li>You get sixty seconds after the 3‑2‑1 countdown. Each correct answer is 10 points, doubled from the 5th in a row and tripled from the 10th; a miss costs 5 and breaks the streak.</li><li><b>Switch cost</b>: how much slower you are right after the rule changes than when it repeats — lower is better.</li><li>Touch: tap a button. Keyboard: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> for the buttons in order, arrows with <kbd>Enter</kbd>, and <kbd>P</kbd> to pause.</li></ul>';
  }

  var logic = { LEVELS: LEVELS, COLORS: COLORS, SHAPES: SHAPES, RULES: RULES, ROUND: ROUND, MIN_RT: MIN_RT, cfg: cfg, trial: trial, answerOf: answerOf, fresh: fresh, multOf: multOf, step: step, switchCost: switchCost, summary: summary, grade: grade, maxScore: maxScore, timer: timer, keyIndex: keyIndex };
  window.GardenGames.register('switch', { mount: mount, help: help, logic: logic, _t: logic });
})();
