;(function () {
  'use strict';

  var ROUND = 60000, CD_MS = 650, LOCK_MS = 560, GOOD = 10, BAD = 5, SPAN = 4;
  var LEVELS = {
    easy: { min: 5, max: 5, both: false },
    medium: { min: 6, max: 7, both: false },
    hard: { min: 8, max: 8, both: true }
  };
  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var FALLBACK = {
    5: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]],
    6: [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3], [2, 3]],
    7: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2], [2, 3], [3, 3]],
    8: [[0, 0], [1, 0], [2, 0], [2, 1], [1, 1], [1, 2], [1, 3], [0, 3]]
  };

  function norm(cells) {
    var mx = Infinity, my = Infinity;
    cells.forEach(function (c) { if (c[0] < mx) mx = c[0]; if (c[1] < my) my = c[1]; });
    return cells.map(function (c) { return [c[0] - mx, c[1] - my]; }).sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });
  }
  function rot(cells, k) {
    var out = cells.map(function (c) { return [c[0], c[1]]; });
    k = ((k % 4) + 4) % 4;
    for (var i = 0; i < k; i++) out = out.map(function (c) { return [-c[1], c[0]]; });
    return norm(out);
  }
  function mirror(cells) { return norm(cells.map(function (c) { return [-c[0], c[1]]; })); }
  function key(cells) { return norm(cells).map(function (c) { return c[0] + ',' + c[1]; }).join(';'); }
  function canon(cells) {
    var best = null;
    for (var k = 0; k < 4; k++) { var s = key(rot(cells, k)); if (best === null || s < best) best = s; }
    return best;
  }
  function chiral(cells) { return canon(cells) !== canon(mirror(cells)); }
  function sizeOf(cells) {
    var w = 0, h = 0;
    cells.forEach(function (c) { if (c[0] + 1 > w) w = c[0] + 1; if (c[1] + 1 > h) h = c[1] + 1; });
    return { w: w, h: h };
  }
  function grow(rng, n) {
    var cells = [[0, 0]], seen = { '0,0': 1 }, guard = 0;
    while (cells.length < n && guard++ < 1000) {
      var c = cells[Math.floor(rng() * cells.length)], d = DIRS[Math.floor(rng() * 4)];
      var x = c[0] + d[0], y = c[1] + d[1], id = x + ',' + y;
      if (seen[id]) continue;
      seen[id] = 1;
      cells.push([x, y]);
    }
    return norm(cells);
  }
  function genShape(rng, n) {
    for (var tries = 0; tries < 400; tries++) {
      var s = grow(rng, n), z = sizeOf(s);
      if (z.w <= SPAN && z.h <= SPAN && chiral(s)) return s;
    }
    return norm(FALLBACK[n]);
  }
  function upright(cells) { var z = sizeOf(cells); return z.h > z.w ? rot(cells, 1) : cells; }
  function isSame(a, b) { return canon(a) === canon(b); }
  function trial(rng, level, correct, prevKey) {
    var L = LEVELS[level] || LEVELS.medium, n = L.min;
    if (L.max > L.min) n = rng() < Math.min(0.75, 0.3 + (correct || 0) * 0.02) ? L.max : L.min;
    var base = genShape(rng, n);
    if (prevKey && canon(base) === prevKey) base = genShape(rng, n);
    var same = rng() < 0.5, k = Math.floor(rng() * 4), k0 = L.both ? Math.floor(rng() * 4) : 0;
    var left = L.both ? rot(base, k0) : upright(base);
    var right = rot(same ? left : mirror(left), k);
    return { left: left, right: right, same: same, k: k, k0: k0, n: n, id: canon(base) };
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
  function grade(s) {
    var n = s.correct + s.wrong, acc = n ? s.correct / n : 0;
    if (n >= 20 && acc >= 0.9) return 1;
    if (acc < 0.65) return -1;
    return 0;
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
  function keyChoice(k, code, rtl) {
    if (k === 'ArrowLeft') return rtl ? 1 : 0;
    if (k === 'ArrowRight') return rtl ? 0 : 1;
    if (code === 'KeyS') return 0;
    if (code === 'KeyM') return 1;
    if (typeof k !== 'string' || k.length !== 1) return -1;
    var d = '12'.indexOf(k);
    if (d < 0) d = '١٢'.indexOf(k);
    if (d < 0) d = '۱۲'.indexOf(k);
    if (d < 0) d = 'sm'.indexOf(k.toLowerCase());
    return d;
  }
  function svgCells(cells) {
    var z = sizeOf(cells), ox = (SPAN - z.w) / 2, oy = (SPAN - z.h) / 2;
    return cells.map(function (c) {
      return '<rect x="' + (ox + c[0] + 0.06).toFixed(2) + '" y="' + (oy + c[1] + 0.06).toFixed(2) + '" width=".88" height=".88" rx=".12"/>';
    }).join('');
  }

  function mount(ctx) {
    var t = ctx.t;
    var s = fresh();
    var clk = timer(function () { return performance.now(); });
    var phase = 'start', cur = null, shownAt = 0, raf = 0, lastSec = 60, cdTimer = 0, cdN = 0, lock = 0, locked = false, shownMult = 1, dead = false;
    var fxTimers = {};

    var root = document.createElement('div');
    root.className = 'grt';
    root.innerHTML = '<div class="grt-track" aria-hidden="true"><div class="grt-fill"></div></div>' +
      '<div class="grt-stage">' +
        '<span class="grt-x" hidden></span>' +
        '<div class="grt-start"></div>' +
        '<div class="grt-count" hidden aria-live="assertive"></div>' +
        '<div class="grt-q" hidden>' +
          '<figure class="grt-sh grt-sh--a"><svg viewBox="-.15 -.15 4.3 4.3" role="img" focusable="false"></svg><figcaption></figcaption></figure>' +
          '<figure class="grt-sh grt-sh--b"><svg viewBox="-.15 -.15 4.3 4.3" role="img" focusable="false"></svg><figcaption></figcaption></figure>' +
        '</div>' +
        '<div class="grt-end" hidden></div>' +
      '</div>';
    ctx.board.appendChild(root);
    var fill = root.querySelector('.grt-fill');
    var stage = root.querySelector('.grt-stage');
    var badge = root.querySelector('.grt-x');
    var startEl = root.querySelector('.grt-start');
    var countEl = root.querySelector('.grt-count');
    var qEl = root.querySelector('.grt-q');
    var svgA = root.querySelector('.grt-sh--a svg');
    var svgB = root.querySelector('.grt-sh--b svg');
    var capA = root.querySelector('.grt-sh--a figcaption');
    var capB = root.querySelector('.grt-sh--b figcaption');
    var endEl = root.querySelector('.grt-end');

    var pad = document.createElement('div');
    pad.className = 'grt-pad grt-pad--off';
    ctx.controls.appendChild(pad);

    function num(v) { return ctx.num ? ctx.num(v) : String(v); }
    function rtl() { return document.documentElement.dir === 'rtl'; }

    function startHTML() {
      var b = ctx.best();
      return '<p class="grt-rule">' + t('هل الشكلُ الثاني هو الأوّلُ نفسُه بعد تدويره، أم صورتُه في المرآة؟ ستّون ثانية.', 'Is the second shape the first one turned around, or its mirror image? Sixty seconds.') + '</p>' +
        '<button type="button" class="gsf-btn gsf-btn--go grt-go" data-grt="go"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + t('ابدأ', 'Start') + '</button>' +
        (b != null ? '<p class="grt-best"><i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + t('أفضلُ نتيجة: ', 'Best: ') + num(ctx.fmt('points', b)) + '</p>' : '') +
        '<p class="grt-hint">' + t('<kbd>←</kbd> <kbd>→</kbd> أو <kbd>S</kbd> <kbd>M</kbd> للإجابة · <kbd>P</kbd> للإيقاف', '<kbd>←</kbd> <kbd>→</kbd> or <kbd>S</kbd> <kbd>M</kbd> to answer · <kbd>P</kbd> pauses') + '</p>';
    }
    function padHTML() {
      var r = rtl();
      var hs = (r ? '→' : '←') + ' · S', hm = (r ? '←' : '→') + ' · M';
      return '<button type="button" class="grt-b" data-i="0"><i class="fa-solid fa-equals" aria-hidden="true"></i>' +
          '<span class="grt-bn">' + t('نفسُه', 'Same') + '</span><kbd class="grt-kh" aria-hidden="true">' + hs + '</kbd></button>' +
        '<button type="button" class="grt-b" data-i="1"><i class="fa-solid fa-right-left" aria-hidden="true"></i>' +
          '<span class="grt-bn">' + t('مرآة', 'Mirrored') + '</span><kbd class="grt-kh" aria-hidden="true">' + hm + '</kbd></button>';
    }
    function endHTML() {
      return '<p class="grt-endt"><i class="fa-solid fa-stopwatch" aria-hidden="true"></i> ' + t('انتهى الوقت', 'Time’s up') + '</p>';
    }
    function labels() {
      pad.setAttribute('role', 'group');
      pad.setAttribute('aria-label', t('الجواب', 'Answer'));
      capA.textContent = t('الأصل', 'Original');
      capB.textContent = t('نفسُه أم مرآة؟', 'Same or mirrored?');
      svgA.setAttribute('aria-label', t('الشكلُ الأصليّ', 'Original shape'));
      svgB.setAttribute('aria-label', t('الشكلُ المقارَن', 'Shape to compare'));
    }

    function stat(label, value) { return '<span class="gm-stat"><small>' + label + '</small><b>' + value + '</b></span>'; }
    function paint() {
      ctx.status(stat(t('النقاط', 'Points'), ctx.fmt('points', s.points)) +
        stat(t('السلسلة', 'Streak'), s.streak) +
        stat(t('الوقت', 'Time'), '<span id="grt-time">' + lastSec + '</span>' + t('ث', 's')));
    }
    function paintBadge() {
      var m = multOf(s.streak);
      if (m === shownMult) return;
      shownMult = m;
      badge.hidden = m === 1;
      badge.textContent = '×' + m;
      badge.classList.toggle('grt-x--3', m === 3);
      badge.classList.remove('grt-pop'); void badge.offsetWidth; badge.classList.add('grt-pop');
    }
    function paintShapes() {
      if (!cur) return;
      svgA.innerHTML = svgCells(cur.left);
      svgB.innerHTML = svgCells(cur.right);
    }
    function canAnswer() { return phase === 'play' && clk.on() && !locked; }
    function padState() { pad.classList.toggle('grt-pad--off', !(phase === 'play' && clk.on())); }
    function show(el) { [startEl, countEl, qEl, endEl].forEach(function (x) { x.hidden = x !== el; }); }

    function next() {
      cur = trial(ctx.rng, ctx.level, s.correct, cur && cur.id);
      shownAt = clk.get();
      paintShapes();
      if (!ctx.reduced) { qEl.classList.remove('grt-in'); void qEl.offsetWidth; qEl.classList.add('grt-in'); }
      padState();
    }
    function flash(bad) {
      stage.classList.remove('grt-flash', 'grt-flash--bad'); void stage.offsetWidth;
      stage.classList.add('grt-flash');
      if (bad) stage.classList.add('grt-flash--bad');
    }
    function gainFx(g) {
      var el = document.createElement('span');
      el.className = 'grt-gain' + (g < 0 ? ' grt-gain--bad' : '');
      el.textContent = (g < 0 ? '−' + (-g) : '+' + g);
      stage.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ctx.reduced ? 450 : 700);
    }
    function btn(i) { return pad.querySelector('.grt-b[data-i="' + i + '"]'); }
    function mark(i, cls, ms) {
      var b = btn(i);
      if (!b) return;
      var id = cls + i;
      b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls);
      clearTimeout(fxTimers[id]);
      fxTimers[id] = setTimeout(function () { b.classList.remove(cls); }, ms);
    }
    function answer(i) {
      if (!canAnswer() || (i !== 0 && i !== 1)) return;
      var right = cur.same ? 0 : 1, ok = i === right;
      var g = step(s, ok, clk.get() - shownAt);
      if (ok) {
        ctx.sound('good');
        mark(i, 'down', 110);
        flash(false);
        gainFx(g);
        next();
      } else {
        ctx.sound('bad'); ctx.haptic(30);
        mark(i, 'grt-b--bad', LOCK_MS);
        mark(right, 'grt-b--hint', LOCK_MS);
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
        var el = document.getElementById('grt-time');
        if (el) el.textContent = sec;
        if (sec <= 10 && sec > 0) { root.classList.add('grt--warn'); ctx.sound('tick'); }
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
        won: true, score: s.points, unit: t('نقطة', 'pts'), grade: grade(s),
        detail: t('صحيحة: ', 'Correct: ') + num(s.correct + '/' + r.n) + ' · ' + t('الدقّة: ', 'Accuracy: ') + num(r.acc + '%') + ' · ' +
          t('متوسّطُ الاستجابة: ', 'Average reaction: ') + (r.avg == null ? '—' : num(r.avg) + ' ' + t('ملّي ثانية', 'ms')) + ' · ' +
          t('أطولُ سلسلة: ', 'Best streak: ') + num(s.best)
      });
    }

    function onRootClick(e) {
      if (e.target.closest('[data-grt="go"]')) begin();
    }
    function onPadDown(e) {
      var b = e.target.closest('.grt-b');
      if (!b) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      answer(Number(b.dataset.i));
    }
    function onPadClick(e) {
      if (e.detail !== 0) return;
      var b = e.target.closest('.grt-b');
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
          root.classList.add('grt--hide');
          return;
        }
        if (phase !== 'play' || !clk.on()) return;
        clk.pause();
        cancelAnimationFrame(raf);
        if (lock) { clearTimeout(lock); lock = 0; }
        root.classList.add('grt--hide');
        padState();
      },
      resume: function () {
        root.classList.remove('grt--hide');
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
        var c = keyChoice(k, e.code, rtl());
        if (phase === 'start') {
          if (k === 'Enter' || k === ' ') {
            var fb = document.activeElement;
            if (fb && fb.tagName === 'BUTTON' && !root.contains(fb)) return false;
            if (!e.repeat) begin();
            return true;
          }
          return false;
        }
        if (phase === 'count') return k === 'Enter' || k === ' ' || c >= 0;
        if (phase !== 'play') return false;
        if (c >= 0) { if (!e.repeat) answer(c); return true; }
        if (k === ' ' || k === 'Enter') {
          var f = document.activeElement;
          if (f && f.classList && f.classList.contains('grt-b') && pad.contains(f)) { if (!e.repeat) answer(Number(f.dataset.i)); return true; }
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
        padState();
        paint();
      }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>يظهر شكلان من مربّعاتٍ متلاصقة. الثاني إمّا <b>الشكلُ نفسُه</b> بعد تدويره، وإمّا <b>صورتُه في المرآة</b> بعد تدويره.</li><li>دوّرْه في ذهنك: إن انطبق على الأصل فاضغطْ «نفسُه»، وإلّا فاضغطْ «مرآة».</li><li>المستوى السهل خمسةُ مربّعات، والمتوسّط ستّةٌ أو سبعة، والصعب ثمانيةٌ والشكلان كلاهما مُدار.</li><li>لديك ستّون ثانية بعد العدّ 3‑2‑1. كلُّ إصابةٍ 10 نقاط، تتضاعف ×2 من الخامسة المتتالية و×3 من العاشرة.</li><li>الخطأ يخصم 5 نقاط ويقطع السلسلة، ويُريك الجوابَ الصحيح لحظة.</li><li>لوحةُ المفاتيح: السهمُ نحو الزرّ <kbd>←</kbd> <kbd>→</kbd>، أو <kbd>S</kbd> لـ«نفسُه» و<kbd>M</kbd> لـ«مرآة»، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>Two shapes made of joined squares appear. The second is either <b>the same shape</b> rotated, or its <b>mirror image</b> rotated.</li><li>Turn it in your mind: if it lines up with the original, tap Same; otherwise tap Mirrored.</li><li>Easy uses five squares, Medium six or seven, Hard eight with both shapes rotated.</li><li>You get sixty seconds after the 3‑2‑1 countdown. Each correct answer is 10 points, doubled from the 5th in a row and tripled from the 10th.</li><li>A miss costs 5 points, breaks the streak and briefly shows the right answer.</li><li>Keyboard: the arrow pointing at the button <kbd>←</kbd> <kbd>→</kbd>, or <kbd>S</kbd> for Same and <kbd>M</kbd> for Mirrored, and <kbd>P</kbd> to pause.</li></ul>';
  }

  var logic = {
    norm: norm, rot: rot, mirror: mirror, key: key, canon: canon, chiral: chiral, sizeOf: sizeOf, grow: grow, genShape: genShape,
    upright: upright, isSame: isSame, trial: trial, fresh: fresh, multOf: multOf, step: step, summary: summary, grade: grade,
    timer: timer, keyChoice: keyChoice, svgCells: svgCells, LEVELS: LEVELS, FALLBACK: FALLBACK, ROUND: ROUND, SPAN: SPAN
  };
  window.GardenGames.register('rotate', { mount: mount, help: help, logic: logic, _t: logic });
})();
