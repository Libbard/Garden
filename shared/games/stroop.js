;(function () {
  'use strict';

  var COLORS = [
    { ar: 'أحمر', en: 'Red', word: 'RED', key: 'r' },
    { ar: 'أزرق', en: 'Blue', word: 'BLUE', key: 'b' },
    { ar: 'أخضر', en: 'Green', word: 'GREEN', key: 'g' },
    { ar: 'أصفر', en: 'Yellow', word: 'YELLOW', key: 'y' }
  ];
  var N = COLORS.length, CONG = 0.25, ROUND = 60000, CD_MS = 650, LOCK_MS = 420, GOOD = 10, BAD = 5;

  function trial(rng, prev) {
    var cong = rng() < CONG, c = [];
    for (var w = 0; w < N; w++) {
      for (var k = 0; k < N; k++) {
        if ((w === k) !== cong) continue;
        if (prev && prev.w === w && prev.k === k) continue;
        c.push({ w: w, k: k });
      }
    }
    return c[Math.floor(rng() * c.length)];
  }
  function fresh() { return { points: 0, streak: 0, best: 0, correct: 0, wrong: 0, rt: 0 }; }
  function multOf(n) { return n >= 10 ? 3 : n >= 5 ? 2 : 1; }
  function step(s, ok, rt) {
    if (ok) {
      s.streak++; s.correct++;
      if (s.streak > s.best) s.best = s.streak;
      s.rt += rt || 0;
      var g = GOOD * multOf(s.streak);
      s.points += g;
      return g;
    }
    s.wrong++; s.streak = 0;
    var l = Math.min(BAD, s.points);
    s.points -= l;
    return -l;
  }
  function summary(s) {
    var n = s.correct + s.wrong;
    return { n: n, acc: n ? Math.round(s.correct * 100 / n) : 0, avg: s.correct ? Math.round(s.rt / s.correct) : null };
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
  function keyIndex(k, en) {
    if (typeof k !== 'string' || k.length !== 1) return -1;
    var d = '1234'.indexOf(k);
    if (d < 0) d = '١٢٣٤'.indexOf(k);
    if (d < 0) d = '۱۲۳۴'.indexOf(k);
    if (d < 0 && en) d = 'rbgy'.indexOf(k.toLowerCase());
    return d;
  }

  function mount(ctx) {
    var t = ctx.t;
    var s = fresh();
    var clk = timer(function () { return performance.now(); });
    var phase = 'start', cur = null, shownAt = 0, raf = 0, lastSec = 60, cdTimer = 0, cdN = 0, lock = 0, locked = false, shownMult = 1, dead = false;
    var fxTimers = {};

    var root = document.createElement('div');
    root.className = 'gst';
    root.innerHTML = '<div class="gst-track" aria-hidden="true"><div class="gst-fill"></div></div>' +
      '<div class="gst-stage">' +
        '<span class="gst-x" hidden></span>' +
        '<div class="gst-start"></div>' +
        '<div class="gst-count" hidden aria-live="assertive"></div>' +
        '<div class="gst-q" hidden><span class="gst-word" role="img"></span></div>' +
        '<div class="gst-end" hidden></div>' +
      '</div>';
    ctx.board.appendChild(root);
    var fill = root.querySelector('.gst-fill');
    var stage = root.querySelector('.gst-stage');
    var badge = root.querySelector('.gst-x');
    var startEl = root.querySelector('.gst-start');
    var countEl = root.querySelector('.gst-count');
    var qEl = root.querySelector('.gst-q');
    var wordEl = root.querySelector('.gst-word');
    var endEl = root.querySelector('.gst-end');

    var pad = document.createElement('div');
    pad.className = 'gst-pad gst-pad--off';
    ctx.controls.appendChild(pad);

    function num(v) { return ctx.num ? ctx.num(v) : String(v); }
    function en() { return !ctx.isAr(); }
    function name(i) { return t(COLORS[i].ar, COLORS[i].en); }

    function startHTML() {
      var b = ctx.best();
      return '<p class="gst-rule">' + t('اضغطْ لونَ الحبر الذي كُتبت به الكلمة، لا ما تقوله الكلمة. ستّون ثانية.', 'Tap the colour of the ink the word is printed in — not what the word says. Sixty seconds.') + '</p>' +
        '<p class="gst-eg"><span class="gst-eg-w" data-ink="1">' + t('أحمر', 'RED') + '</span><i class="fa-solid fa-arrow-left gm-flip" aria-hidden="true"></i><span class="gst-eg-a"><span class="gst-sw" data-ink="1" aria-hidden="true"></span>' + t('أزرق', 'Blue') + '</span></p>' +
        '<button type="button" class="gsf-btn gsf-btn--go gst-go" data-gst="go"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + t('ابدأ', 'Start') + '</button>' +
        (b != null ? '<p class="gst-best"><i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + t('أفضلُ نتيجة: ', 'Best: ') + num(ctx.fmt('points', b)) + '</p>' : '') +
        '<p class="gst-hint">' + t('<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> للإجابة · <kbd>P</kbd> للإيقاف', '<kbd>1</kbd>–<kbd>4</kbd> or <kbd>R</kbd> <kbd>B</kbd> <kbd>G</kbd> <kbd>Y</kbd> to answer · <kbd>P</kbd> pauses') + '</p>';
    }
    function padHTML() {
      return COLORS.map(function (c, i) {
        var hint = (i + 1) + (en() ? ' · ' + c.key.toUpperCase() : '');
        return '<button type="button" class="gst-b" data-i="' + i + '">' +
          '<span class="gst-sw" data-ink="' + i + '" aria-hidden="true"></span>' +
          '<span class="gst-bn">' + name(i) + '</span>' +
          '<kbd class="gst-kh" aria-hidden="true">' + hint + '</kbd></button>';
      }).join('');
    }
    function endHTML() {
      return '<p class="gst-endt"><i class="fa-solid fa-stopwatch" aria-hidden="true"></i> ' + t('انتهى الوقت', 'Time’s up') + '</p>';
    }
    function labels() {
      pad.setAttribute('role', 'group');
      pad.setAttribute('aria-label', t('لونُ الحبر', 'Ink colour'));
    }

    function stat(label, value) { return '<span class="gm-stat"><small>' + label + '</small><b>' + value + '</b></span>'; }
    function paint() {
      ctx.status(stat(t('النقاط', 'Points'), ctx.fmt('points', s.points)) +
        stat(t('السلسلة', 'Streak'), s.streak) +
        stat(t('الوقت', 'Time'), '<span id="gst-time">' + lastSec + '</span>' + t('ث', 's')));
    }
    function paintBadge() {
      var m = multOf(s.streak);
      if (m === shownMult) return;
      shownMult = m;
      badge.hidden = m === 1;
      badge.textContent = '×' + m;
      badge.classList.toggle('gst-x--3', m === 3);
      badge.classList.remove('gst-pop'); void badge.offsetWidth; badge.classList.add('gst-pop');
    }
    function paintWord() {
      if (!cur) return;
      wordEl.textContent = t(COLORS[cur.w].ar, COLORS[cur.w].word);
      wordEl.setAttribute('data-ink', cur.k);
      wordEl.setAttribute('aria-label', t('كلمةُ «' + COLORS[cur.w].ar + '» بحبرٍ ' + COLORS[cur.k].ar, 'The word ' + COLORS[cur.w].word + ' in ' + COLORS[cur.k].en.toLowerCase() + ' ink'));
    }
    function canAnswer() { return phase === 'play' && clk.on() && !locked; }
    function padState() { pad.classList.toggle('gst-pad--off', !(phase === 'play' && clk.on())); }
    function show(el) { [startEl, countEl, qEl, endEl].forEach(function (x) { x.hidden = x !== el; }); }

    function next() {
      cur = trial(ctx.rng, cur);
      shownAt = clk.get();
      paintWord();
      if (!ctx.reduced) { wordEl.classList.remove('gst-in'); void wordEl.offsetWidth; wordEl.classList.add('gst-in'); }
      padState();
    }
    function flash(bad) {
      stage.classList.remove('gst-flash', 'gst-flash--bad'); void stage.offsetWidth;
      stage.classList.add('gst-flash');
      if (bad) stage.classList.add('gst-flash--bad');
    }
    function gainFx(g) {
      var el = document.createElement('span');
      el.className = 'gst-gain' + (g < 0 ? ' gst-gain--bad' : '');
      el.textContent = (g < 0 ? '−' + (-g) : '+' + g);
      stage.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ctx.reduced ? 450 : 700);
    }
    function btn(i) { return pad.querySelector('.gst-b[data-i="' + i + '"]'); }
    function mark(i, cls, ms) {
      var b = btn(i);
      if (!b) return;
      var id = cls + i;
      b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls);
      clearTimeout(fxTimers[id]);
      fxTimers[id] = setTimeout(function () { b.classList.remove(cls); }, ms);
    }
    function answer(i) {
      if (!canAnswer() || i < 0 || i >= N) return;
      var ok = i === cur.k;
      var g = step(s, ok, clk.get() - shownAt);
      if (ok) {
        ctx.sound('good');
        mark(i, 'down', 110);
        flash(false);
        gainFx(g);
        next();
      } else {
        ctx.sound('bad'); ctx.haptic(30);
        mark(i, 'gst-b--bad', LOCK_MS);
        mark(cur.k, 'gst-b--hint', LOCK_MS);
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
        var el = document.getElementById('gst-time');
        if (el) el.textContent = sec;
        if (sec <= 10 && sec > 0) { root.classList.add('gst--warn'); ctx.sound('tick'); }
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
      locked = false;
      fill.style.transform = 'scaleX(0)';
      lastSec = 0;
      endEl.innerHTML = endHTML();
      show(endEl);
      padState();
      paint();
      var r = summary(s);
      ctx.finish({
        won: true, score: s.points, unit: t('نقطة', 'pts'),
        detail: t('صحيحة: ', 'Correct: ') + num(s.correct + '/' + r.n) + ' · ' + t('الدقّة: ', 'Accuracy: ') + num(r.acc + '%') + ' · ' +
          t('متوسّطُ الاستجابة: ', 'Average reaction: ') + (r.avg == null ? '—' : num(r.avg) + ' ' + t('ملّي ثانية', 'ms'))
      });
    }

    function onRootClick(e) {
      if (e.target.closest('[data-gst="go"]')) begin();
    }
    function onPadDown(e) {
      var b = e.target.closest('.gst-b');
      if (!b) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      answer(Number(b.dataset.i));
    }
    function onPadClick(e) {
      if (e.detail !== 0) return;
      var b = e.target.closest('.gst-b');
      if (b) answer(Number(b.dataset.i));
    }
    root.addEventListener('click', onRootClick);
    pad.addEventListener('pointerdown', onPadDown);
    pad.addEventListener('click', onPadClick);

    startEl.innerHTML = startHTML();
    pad.innerHTML = padHTML();
    labels();
    paint();

    return {
      destroy: function () {
        dead = true;
        clk.stop();
        cancelAnimationFrame(raf);
        clearTimeout(lock); clearTimeout(cdTimer);
        Object.keys(fxTimers).forEach(function (k) { clearTimeout(fxTimers[k]); });
        root.removeEventListener('click', onRootClick);
        pad.removeEventListener('pointerdown', onPadDown);
        pad.removeEventListener('click', onPadClick);
      },
      pause: function () {
        if (phase === 'count') {
          if (cdTimer) { clearTimeout(cdTimer); cdTimer = 0; }
          root.classList.add('gst--hide');
          return;
        }
        if (phase !== 'play' || !clk.on()) return;
        clk.pause();
        cancelAnimationFrame(raf);
        if (lock) { clearTimeout(lock); lock = 0; }
        root.classList.add('gst--hide');
        padState();
      },
      resume: function () {
        root.classList.remove('gst--hide');
        if (phase === 'count') { if (!cdTimer) countdown(); return; }
        if (phase !== 'play' || clk.on()) return;
        clk.resume();
        if (locked) { locked = false; next(); }
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
        if (phase === 'count') return k === 'Enter' || k === ' ' || keyIndex(k, en()) >= 0;
        if (phase !== 'play') return false;
        var i = keyIndex(k, en());
        if (i >= 0) { if (!e.repeat) answer(i); return true; }
        if (k === ' ' || k === 'Enter') {
          var f = document.activeElement;
          if (f && f.classList && f.classList.contains('gst-b') && pad.contains(f)) { if (!e.repeat) answer(Number(f.dataset.i)); return true; }
          if (f && f.tagName === 'BUTTON' && !root.contains(f)) return false;
          return k === ' ';
        }
        return false;
      },
      lang: function () {
        if (phase === 'start') startEl.innerHTML = startHTML();
        if (phase === 'over') endEl.innerHTML = endHTML();
        pad.innerHTML = padHTML();
        labels();
        paintWord();
        padState();
        paint();
      }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>تظهر كلمةُ لونٍ مكتوبةً بحبرٍ ملوّن. اختر <b>لونَ الحبر</b> لا ما تقوله الكلمة: «أحمر» بالأزرق جوابُها «أزرق».</li><li>الأزرارُ الأربعة ثابتةُ المكان طوالَ اللعبة: أحمر · أزرق · أخضر · أصفر.</li><li>لديك ستّون ثانية بعد العدّ 3‑2‑1.</li><li>كلُّ إصابةٍ 10 نقاط، تتضاعف ×2 من الإصابة الخامسة المتتالية و×3 من العاشرة.</li><li>الخطأ يخصم 5 نقاط ويقطع السلسلة، ويُريك الجوابَ الصحيح لحظة.</li><li>اللمس: المسْ زرَّ اللون. لوحةُ المفاتيح: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> للأزرار بالترتيب، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>A colour word appears printed in coloured ink. Pick the <b>ink colour</b>, not what the word says: “RED” in blue ink means Blue.</li><li>The four buttons stay in the same place all game: Red · Blue · Green · Yellow.</li><li>You get sixty seconds after the 3‑2‑1 countdown.</li><li>Each correct answer is 10 points, doubled from the 5th in a row and tripled from the 10th.</li><li>A miss costs 5 points, breaks the streak and briefly shows the right answer.</li><li>Touch: tap the colour button. Keyboard: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> or <kbd>R</kbd> <kbd>B</kbd> <kbd>G</kbd> <kbd>Y</kbd>, and <kbd>P</kbd> to pause.</li></ul>';
  }

  window.GardenGames.register('stroop', { mount: mount, help: help, _t: { trial: trial, fresh: fresh, multOf: multOf, step: step, summary: summary, timer: timer, keyIndex: keyIndex, COLORS: COLORS, ROUND: ROUND } });
})();
