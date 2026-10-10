;(function () {
  'use strict';

  var ADD = [null, [[1, 9], [1, 9]], [[2, 19], [2, 9]], [[10, 49], [2, 9]], [[10, 99], [10, 49]], [[10, 99], [10, 99]], [[100, 499], [10, 99]], [[100, 999], [10, 99]], [[100, 999], [100, 999]]];
  var MUL = [null, [[2, 5], [2, 5]], [[2, 5], [2, 10]], [[2, 9], [2, 9]], [[3, 12], [3, 12]], [[11, 19], [2, 9]], [[11, 99], [2, 9]], [[11, 19], [11, 19]], [[11, 39], [11, 29]]];
  var OPS = { mix: ['+', '−', '×', '÷'], add: ['+', '−'], mul: ['×', '÷'] };
  var ROUND = 60000, DMAX = 8, CD_MS = 650;
  var AR_DIG = '٠١٢٣٤٥٦٧٨٩', FA_DIG = '۰۱۲۳۴۵۶۷۸۹';

  function rint(rng, r) { return r[0] + Math.floor(rng() * (r[1] - r[0] + 1)); }
  function make(op, d, rng) {
    var R = (op === '+' || op === '−') ? ADD[d] : MUL[d];
    var x = rint(rng, R[0]), y = rint(rng, R[1]), sw = rng() < 0.5;
    if (op === '+') return sw ? { op: op, a: y, b: x, ans: x + y } : { op: op, a: x, b: y, ans: x + y };
    if (op === '−') return sw ? { op: op, a: x + y, b: x, ans: y } : { op: op, a: x + y, b: y, ans: x };
    if (op === '×') return sw ? { op: op, a: y, b: x, ans: x * y } : { op: op, a: x, b: y, ans: x * y };
    return { op: op, a: x * y, b: y, ans: x };
  }
  function gen(level, d, rng, prev) {
    var ops = OPS[level] || OPS.mix, p, n = 0;
    d = Math.max(1, Math.min(DMAX, d | 0));
    do { p = make(ops[Math.floor(rng() * ops.length)], d, rng); p.d = d; n++; }
    while (prev && n < 40 && p.op === prev.op && p.a === prev.a && p.b === prev.b);
    return p;
  }
  function fresh() { return { d: 1, run: 0, streak: 0, best: 0, points: 0, correct: 0, wrong: 0, skipped: 0 }; }
  function multOf(n) { return n >= 10 ? 3 : n >= 5 ? 2 : 1; }
  function step(s, kind) {
    if (kind === 'ok') {
      s.streak++; s.correct++;
      if (s.streak > s.best) s.best = s.streak;
      var g = 10 * s.d * multOf(s.streak);
      s.points += g;
      if (++s.run >= 3) { s.run = 0; if (s.d < DMAX) s.d++; }
      return g;
    }
    if (kind === 'skip') s.skipped++; else s.wrong++;
    s.streak = 0; s.run = 0;
    if (s.d > 1) s.d--;
    return 0;
  }

  function mount(ctx) {
    var t = ctx.t;
    var level = OPS[ctx.level] ? ctx.level : 'mix';
    var s = fresh();
    var phase = 'start', cur = null, typed = '';
    var acc = 0, startAt = 0, running = false, raf = 0, lastSec = 60;
    var shownAt = 0, spent = 0, wait = 0, waitNext = false, cdTimer = 0, cdN = 0, shownMult = 1, dead = false;
    var keyTimers = {};

    var root = document.createElement('div');
    root.className = 'gmth';
    var dots = '';
    for (var i = 1; i <= DMAX; i++) dots += '<i></i>';
    root.innerHTML = '<div class="gmth-track" aria-hidden="true"><div class="gmth-fill"></div></div>' +
      '<div class="gmth-stage">' +
        '<div class="gmth-dots" aria-hidden="true">' + dots + '</div>' +
        '<span class="gmth-x" hidden></span>' +
        '<div class="gmth-start"></div>' +
        '<div class="gmth-count" hidden aria-live="assertive"></div>' +
        '<div class="gmth-q" hidden><div class="gmth-expr" aria-live="polite"></div><div class="gmth-ans"></div></div>' +
        '<div class="gmth-end" hidden></div>' +
      '</div>';
    ctx.board.appendChild(root);
    var fill = root.querySelector('.gmth-fill');
    var stage = root.querySelector('.gmth-stage');
    var dotEls = [].slice.call(root.querySelectorAll('.gmth-dots i'));
    var badge = root.querySelector('.gmth-x');
    var startEl = root.querySelector('.gmth-start');
    var countEl = root.querySelector('.gmth-count');
    var qEl = root.querySelector('.gmth-q');
    var exprEl = root.querySelector('.gmth-expr');
    var ansEl = root.querySelector('.gmth-ans');
    var endEl = root.querySelector('.gmth-end');

    var pad = document.createElement('div');
    pad.className = 'gmth-pad gmth-pad--off';
    ctx.controls.appendChild(pad);

    function num(v) { return ctx.num ? ctx.num(v) : String(v); }
    function clock() { return acc + (running ? performance.now() - startAt : 0); }

    function startHTML() {
      var b = ctx.best();
      return '<p class="gmth-rule">' + t('ستّون ثانية: اكتبِ الناتج، وكلُّ ثلاثِ إصاباتٍ متتالية ترفع الصعوبةَ والنقاط.', 'Sixty seconds: type the answer — every three in a row raises difficulty and points.') + '</p>' +
        '<button type="button" class="gsf-btn gsf-btn--go gmth-go" data-gmth="go"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + t('ابدأ', 'Start') + '</button>' +
        (b != null ? '<p class="gmth-best"><i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + t('أفضلُ نتيجة: ', 'Best: ') + num(ctx.fmt('points', b)) + '</p>' : '') +
        '<p class="gmth-hint">' + t('الأرقامُ للكتابة · <kbd>Enter</kbd> للإرسال · <kbd>S</kbd> للتخطّي · <kbd>P</kbd> للإيقاف', 'Digits to type · <kbd>Enter</kbd> submits · <kbd>S</kbd> skips · <kbd>P</kbd> pauses') + '</p>';
    }
    function padHTML() {
      var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', '0', 'del'];
      return keys.map(function (k) {
        if (k === 'skip') return '<button type="button" class="gmth-k gmth-k--fn" data-k="skip" aria-label="' + t('تخطَّ المسألة', 'Skip problem') + '"><i class="fa-solid fa-forward" aria-hidden="true"></i><span>' + t('تخطَّ', 'Skip') + '</span></button>';
        if (k === 'del') return '<button type="button" class="gmth-k gmth-k--fn" data-k="del" aria-label="' + t('امسحْ رقماً', 'Delete digit') + '"><i class="fa-solid fa-delete-left" aria-hidden="true"></i></button>';
        return '<button type="button" class="gmth-k" data-k="' + k + '">' + k + '</button>';
      }).join('');
    }
    function endHTML() {
      return '<p class="gmth-endt"><i class="fa-solid fa-stopwatch" aria-hidden="true"></i> ' + t('انتهى الوقت', 'Time’s up') + '</p>';
    }
    function labels() {
      pad.setAttribute('role', 'group');
      pad.setAttribute('aria-label', t('لوحةُ الأرقام', 'Number pad'));
      ansEl.setAttribute('aria-label', t('إجابتك', 'Your answer'));
    }

    function stat(label, value) { return '<span class="gm-stat"><small>' + label + '</small><b>' + value + '</b></span>'; }
    function paint() {
      ctx.status(stat(t('النقاط', 'Points'), ctx.fmt('points', s.points)) +
        stat(t('السلسلة', 'Streak'), s.streak) +
        stat(t('الوقت', 'Time'), '<span id="gmth-time">' + lastSec + '</span>' + t('ث', 's')));
    }
    function paintBadge() {
      var m = multOf(s.streak);
      if (m === shownMult) return;
      shownMult = m;
      badge.hidden = m === 1;
      badge.textContent = '×' + m;
      badge.classList.toggle('gmth-x--3', m === 3);
      badge.classList.remove('gmth-pop'); void badge.offsetWidth; badge.classList.add('gmth-pop');
    }
    function paintDots(d) { dotEls.forEach(function (el, j) { el.classList.toggle('on', j < d); }); }
    function paintAns() {
      ansEl.className = 'gmth-ans';
      ansEl.innerHTML = '<span class="gmth-dig">' + typed + '</span><i class="gmth-caret" aria-hidden="true"></i>';
    }
    function padState() { pad.classList.toggle('gmth-pad--off', !(phase === 'play' && running && !waitNext)); }
    function show(el) { [startEl, countEl, qEl, endEl].forEach(function (x) { x.hidden = x !== el; }); }

    function next() {
      cur = gen(level, s.d, ctx.rng, cur);
      typed = '';
      shownAt = clock();
      exprEl.innerHTML = '<span>' + cur.a + '</span><span class="gmth-op">' + cur.op + '</span><span>' + cur.b + '</span>';
      paintAns();
      paintDots(cur.d);
      padState();
    }
    function flash(bad) {
      stage.classList.remove('gmth-flash', 'gmth-flash--bad'); void stage.offsetWidth;
      stage.classList.add('gmth-flash');
      if (bad) stage.classList.add('gmth-flash--bad');
    }
    function gainFx(g) {
      var el = document.createElement('span');
      el.className = 'gmth-gain';
      el.textContent = '+' + g;
      stage.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ctx.reduced ? 450 : 700);
    }
    function reveal(kind) {
      ansEl.className = 'gmth-ans ' + (kind === 'bad' ? 'gmth-ans--bad' : 'gmth-ans--skip');
      ansEl.innerHTML = (kind === 'bad' && typed ? '<s class="gmth-typed">' + typed + '</s>' : '') + '<span class="gmth-right">' + cur.ans + '</span>';
    }
    function answer(kind) {
      spent += clock() - shownAt;
      var g = step(s, kind);
      if (kind === 'ok') {
        ctx.sound('good');
        flash(false);
        gainFx(g);
        next();
      } else {
        if (kind === 'bad') { ctx.sound('bad'); ctx.haptic(30); flash(true); }
        reveal(kind);
        waitNext = true;
        padState();
        wait = setTimeout(function () { wait = 0; waitNext = false; if (phase === 'play' && running) next(); }, kind === 'bad' ? 600 : 450);
      }
      paintBadge();
      paint();
    }
    function submit() {
      if (phase !== 'play' || !running || waitNext || !typed) return;
      answer(Number(typed) === cur.ans ? 'ok' : 'bad');
    }
    function press(k) {
      if (phase !== 'play' || !running || waitNext) return;
      if (k === 'skip') { answer('skip'); return; }
      if (k === 'del') { if (typed) { typed = typed.slice(0, -1); paintAns(); } return; }
      var len = String(cur.ans).length;
      if (typed.length >= len) return;
      typed += k;
      paintAns();
      if (typed.length === len) submit(); else ctx.sound('tap');
    }
    function keyFx(k) {
      var b = pad.querySelector('[data-k="' + k + '"]');
      if (!b) return;
      b.classList.add('down');
      clearTimeout(keyTimers[k]);
      keyTimers[k] = setTimeout(function () { b.classList.remove('down'); }, 110);
    }

    function loop() {
      var left = Math.max(0, ROUND - clock());
      fill.style.transform = 'scaleX(' + (left / ROUND).toFixed(4) + ')';
      var sec = Math.ceil(left / 1000);
      if (sec !== lastSec) {
        lastSec = sec;
        var el = document.getElementById('gmth-time');
        if (el) el.textContent = sec;
        if (sec <= 10 && sec > 0) { root.classList.add('gmth--warn'); ctx.sound('tick'); }
      }
      if (left <= 0) { end(); return; }
      raf = requestAnimationFrame(loop);
    }
    function go() {
      phase = 'play';
      show(qEl);
      acc = 0; spent = 0; lastSec = 60;
      running = true; startAt = performance.now();
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
      if (ctx.reduced) { go(); return; }
      phase = 'count';
      show(countEl);
      countdown();
    }
    function end() {
      if (phase === 'over') return;
      phase = 'over';
      running = false; acc = ROUND;
      cancelAnimationFrame(raf);
      if (wait) { clearTimeout(wait); wait = 0; }
      waitNext = false;
      fill.style.transform = 'scaleX(0)';
      lastSec = 0;
      endEl.innerHTML = endHTML();
      show(endEl);
      padState();
      paint();
      var n = s.correct + s.wrong + s.skipped;
      var accP = n ? Math.round(s.correct * 100 / n) : 0;
      var avg = n ? (spent / n / 1000).toFixed(1) : '—';
      ctx.finish({
        won: true, score: s.points, unit: t('نقطة', 'pts'),
        detail: t('صحيحة: ', 'Correct: ') + num(s.correct) + ' · ' + t('الدقّة: ', 'Accuracy: ') + num(accP + '%') + ' · ' +
          t('أطولُ سلسلة: ', 'Best streak: ') + num(s.best) + ' · ' + t('المعدّل: ', 'Average: ') + num(avg) + t('ث لكلِّ مسألة', 's per problem')
      });
    }

    function onRootClick(e) {
      var b = e.target.closest('[data-gmth="go"]');
      if (b) begin();
    }
    function onPadDown(e) {
      var b = e.target.closest('.gmth-k');
      if (!b) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      keyFx(b.dataset.k);
      press(b.dataset.k);
    }
    function onPadClick(e) {
      if (e.detail !== 0) return;
      var b = e.target.closest('.gmth-k');
      if (b) press(b.dataset.k);
    }
    root.addEventListener('click', onRootClick);
    pad.addEventListener('pointerdown', onPadDown);
    pad.addEventListener('click', onPadClick);

    startEl.innerHTML = startHTML();
    pad.innerHTML = padHTML();
    labels();
    paintDots(1);
    paintAns();
    paint();

    return {
      destroy: function () {
        dead = true; running = false;
        cancelAnimationFrame(raf);
        clearTimeout(wait); clearTimeout(cdTimer);
        Object.keys(keyTimers).forEach(function (k) { clearTimeout(keyTimers[k]); });
        root.removeEventListener('click', onRootClick);
        pad.removeEventListener('pointerdown', onPadDown);
        pad.removeEventListener('click', onPadClick);
      },
      pause: function () {
        if (phase === 'count') {
          if (cdTimer) { clearTimeout(cdTimer); cdTimer = 0; }
          root.classList.add('gmth--hide');
          return;
        }
        if (phase !== 'play' || !running) return;
        acc += performance.now() - startAt; running = false;
        cancelAnimationFrame(raf);
        if (wait) { clearTimeout(wait); wait = 0; }
        root.classList.add('gmth--hide');
        padState();
      },
      resume: function () {
        root.classList.remove('gmth--hide');
        if (phase === 'count') { if (!cdTimer) countdown(); return; }
        if (phase !== 'play' || running) return;
        running = true; startAt = performance.now();
        if (waitNext) { waitNext = false; next(); }
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
        if (phase === 'count') return k === 'Enter' || k === ' ';
        if (phase !== 'play') return false;
        var di = AR_DIG.indexOf(k);
        if (di < 0) di = FA_DIG.indexOf(k);
        if (di >= 0) k = String(di);
        if (/^[0-9]$/.test(k)) { if (!e.repeat) { keyFx(k); press(k); } return true; }
        if (k === 'Backspace' || k === 'Delete') { keyFx('del'); press('del'); return true; }
        if (k === 'Enter') { if (!e.repeat) submit(); return true; }
        if (k === 's' || k === 'S' || k === 'س') { if (!e.repeat) { keyFx('skip'); press('skip'); } return true; }
        if (k === ' ') {
          var f = document.activeElement;
          if (f && f.classList && f.classList.contains('gmth-k') && pad.contains(f)) { keyFx(f.dataset.k); press(f.dataset.k); }
          return true;
        }
        return false;
      },
      lang: function () {
        if (phase === 'start') startEl.innerHTML = startHTML();
        if (phase === 'over') endEl.innerHTML = endHTML();
        pad.innerHTML = padHTML();
        labels();
        padState();
        paint();
      }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>لديك ستّون ثانية: اكتبْ ناتجَ كلِّ مسألةٍ بلوحة الأرقام أو بلوحة المفاتيح.</li><li>تُرسَل الإجابةُ وحدَها حين يكتمل عددُ أرقامها، أو اضغطْ <kbd>Enter</kbd>.</li><li>الخطأُ يُريك الإجابةَ الصحيحة لحظةً ثمّ تأتي المسألةُ التالية.</li><li>كلُّ ثلاثِ إصاباتٍ متتالية ترفع الصعوبةَ درجة (حتى 8)، وكلُّ خطأٍ أو تخطٍّ يخفضها درجة.</li><li>النقاط: 10 × الصعوبة لكلِّ إصابة، وتتضاعف ×2 من الإصابة الخامسة المتتالية و×3 من العاشرة.</li><li>المستويات: «منوّع» للعمليّات الأربع، و«جمعٌ وطرح»، و«ضربٌ وقسمة» — والقسمةُ دائماً بلا باقٍ.</li><li>المفاتيح: الأرقام للكتابة، <kbd>Backspace</kbd> للمسح، <kbd>Enter</kbd> للإرسال، <kbd>S</kbd> للتخطّي، <kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>You have sixty seconds: type each answer on the number pad or your keyboard.</li><li>The answer submits itself once it has enough digits, or press <kbd>Enter</kbd>.</li><li>A miss shows the right answer for a moment, then the next problem appears.</li><li>Every three correct in a row raises the difficulty one step (up to 8); a miss or a skip lowers it one step.</li><li>Points: 10 × difficulty per correct answer, doubled from the 5th in a row and tripled from the 10th.</li><li>Levels: “Mixed” uses all four operations, “+ and −”, or “× and ÷” — divisions always come out exact.</li><li>Keys: digits to type, <kbd>Backspace</kbd> to delete, <kbd>Enter</kbd> to submit, <kbd>S</kbd> to skip, <kbd>P</kbd> to pause.</li></ul>';
  }

  window.GardenGames.register('math', { mount: mount, help: help, _t: { gen: gen, make: make, step: step, multOf: multOf, fresh: fresh, ADD: ADD, MUL: MUL, OPS: OPS } });
})();
