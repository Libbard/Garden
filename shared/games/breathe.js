;(function () {
  'use strict';

  var PATTERNS = {
    box: { ar: 'التنفّسُ الصندوقيّ', en: 'Box breathing', phases: [['in', 4000], ['hold', 4000], ['out', 4000], ['rest', 4000]] },
    '478': { ar: '\u20664-7-8\u2069', en: '4-7-8 breathing', phases: [['in', 4000], ['hold', 7000], ['out', 8000]] },
    coherent: { ar: 'الإيقاعُ الهادئ', en: 'Coherent breathing', phases: [['in', 5000], ['out', 5000]] }
  };
  var MINUTES = [1, 3, 5], DEF_MIN = 3, MIN_KEEP = 30000, LO = 0.5, HI = 1, OP_LO = 0.35, OP_HI = 1, STORE = 'garden_games_breathe';

  function pattern(id) { return PATTERNS[id] || PATTERNS.box; }
  function cycleMs(id) { return pattern(id).phases.reduce(function (a, p) { return a + p[1]; }, 0); }
  function sessionMs(id, minutes) {
    var c = cycleMs(id);
    return Math.max(1, Math.round(minutes * 60000 / c)) * c;
  }
  function phaseAt(id, ms) {
    var ph = pattern(id).phases, c = cycleMs(id);
    ms = Math.max(0, Math.floor(ms));
    var n = Math.floor(ms / c), r = ms - n * c, start = 0;
    for (var i = 0; i < ph.length; i++) {
      var end = start + ph[i][1];
      if (r < end) return { i: i, kind: ph[i][0], len: ph[i][1], into: r - start, remain: end - r, breaths: n, cycle: n };
      start = end;
    }
    return null;
  }
  function ease(p) { return (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, p)))) / 2; }
  function levelAt(id, ms) {
    var s = phaseAt(id, ms), p = s.into / s.len;
    if (s.kind === 'in') return ease(p);
    if (s.kind === 'out') return 1 - ease(p);
    return s.kind === 'hold' ? 1 : 0;
  }
  function targetOf(kind) { return kind === 'in' || kind === 'hold' ? 1 : 0; }
  function visual(reduced, level) {
    return reduced
      ? { prop: 'opacity', value: (OP_LO + (OP_HI - OP_LO) * level).toFixed(4) }
      : { prop: 'transform', value: 'scale(' + (LO + (HI - LO) * level).toFixed(4) + ')' };
  }
  function endPlan(elapsed, total) {
    var e = Math.max(0, Math.min(Math.floor(elapsed), total));
    if (e >= total) return { finish: true, score: total, full: true };
    if (e >= MIN_KEEP) return { finish: true, score: e, full: false };
    return { finish: false, score: 0, full: false };
  }
  function breathsIn(id, ms) { return Math.floor(Math.max(0, ms) / cycleMs(id)); }
  function clockText(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60), r = s - m * 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }
  function stepMinutes(cur, dir) {
    var i = MINUTES.indexOf(cur);
    if (i < 0) i = MINUTES.indexOf(DEF_MIN);
    return MINUTES[Math.max(0, Math.min(MINUTES.length - 1, i + dir))];
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
  function readMin() {
    try { var v = JSON.parse(localStorage.getItem(STORE) || 'null'); if (v && MINUTES.indexOf(v.min) >= 0) return v.min; } catch (e) {}
    return DEF_MIN;
  }
  function writeMin(m) { try { localStorage.setItem(STORE, JSON.stringify({ min: m })); } catch (e) {} }

  function mount(ctx) {
    var t = ctx.t, lv = PATTERNS[ctx.level] ? ctx.level : 'box', pat = PATTERNS[lv], reduced = !!ctx.reduced;
    var clk = timer(function () { return performance.now(); });
    var mins = readMin(), total = sessionMs(lv, mins), phase = 'start', raf = 0, lastKey = -1, lastSec = -1, lastBreaths = -1, note = '', dead = false;

    var root = document.createElement('div');
    root.className = 'gbr' + (reduced ? ' gbr--still' : '');
    root.innerHTML = '<div class="gbr-stage">' +
        '<div class="gbr-start"></div>' +
        '<div class="gbr-orb" hidden>' +
          '<svg class="gbr-ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
            '<circle class="gbr-rbg" cx="50" cy="50" r="48"></circle>' +
            '<circle class="gbr-rfg" cx="50" cy="50" r="48" pathLength="1"></circle>' +
          '</svg>' +
          '<div class="gbr-core" aria-hidden="true"></div>' +
          '<div class="gbr-say" aria-live="polite"><b class="gbr-word"></b><span class="gbr-n"></span></div>' +
        '</div>' +
        '<div class="gbr-end" hidden></div>' +
      '</div>';
    ctx.board.appendChild(root);
    var startEl = root.querySelector('.gbr-start');
    var orb = root.querySelector('.gbr-orb');
    var core = root.querySelector('.gbr-core');
    var ringFg = root.querySelector('.gbr-rfg');
    var wordEl = root.querySelector('.gbr-word');
    var nEl = root.querySelector('.gbr-n');
    var endEl = root.querySelector('.gbr-end');

    var bar = document.createElement('div');
    bar.className = 'gbr-bar';
    bar.hidden = true;
    ctx.controls.appendChild(bar);

    function num(v) { return ctx.num ? ctx.num(v) : String(v); }
    function pname() { return t(pat.ar, pat.en); }
    function word(kind) {
      if (kind === 'in') return t('شهيق', 'Inhale');
      if (kind === 'out') return t('زفير', 'Exhale');
      return t('احبسْ', 'Hold');
    }
    function ruleOf() {
      if (lv === '478') return t('شهيقٌ 4 ثوانٍ، ثمّ احبسْ 7، ثمّ زفيرٌ بطيءٌ 8.', 'Inhale for 4 seconds, hold for 7, then breathe out slowly for 8.');
      if (lv === 'coherent') return t('شهيقٌ 5 ثوانٍ وزفيرٌ 5 — نحوَ ستّةِ أنفاسٍ في الدقيقة، بلا حبس.', 'Inhale for 5 seconds and exhale for 5 — about six breaths a minute, no holds.');
      return t('شهيقٌ 4 ثوانٍ، احبسْ 4، زفيرٌ 4، احبسْ 4.', 'Inhale for 4 seconds, hold 4, exhale 4, hold 4.');
    }
    function startHTML() {
      return '<p class="gbr-name">' + pname() + '</p>' +
        '<p class="gbr-rule">' + ruleOf() + '</p>' +
        '<div class="gsf-chips gbr-dur" role="group" aria-label="' + t('مدّةُ الجلسة', 'Session length') + '">' +
          MINUTES.map(function (m) {
            var on = m === mins;
            return '<button type="button" class="gsf-chip gbr-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-min="' + m + '">' + num(m) + ' ' + t(m === 1 ? 'دقيقة' : 'دقائق', 'min') + '</button>';
          }).join('') +
        '</div>' +
        '<button type="button" class="gsf-btn gsf-btn--go gbr-go" data-gbr="go"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + t('ابدأ', 'Start') + '</button>' +
        (note ? '<p class="gbr-note">' + note + '</p>' : '') +
        '<p class="gbr-hint">' + t('<kbd>←</kbd> <kbd>→</kbd> للمدّة · <kbd>Enter</kbd> للبدء · <kbd>P</kbd> للإيقاف', '<kbd>←</kbd> <kbd>→</kbd> length · <kbd>Enter</kbd> start · <kbd>P</kbd> pauses') + '</p>';
    }
    function barHTML() {
      return '<button type="button" class="gsf-btn gsf-btn--ghost gbr-stop" data-gbr="stop"><i class="fa-solid fa-stop" aria-hidden="true"></i> ' + t('أنهِ الجلسة', 'End session') + '</button>';
    }
    function endHTML(score) {
      return '<p class="gbr-endt">' + t('أحسنت — خذْ لحظةً قبل أن تعود', 'Well done — take a moment before you go back') + '</p>' +
        '<p class="gbr-ends">' + t('أنفاسٌ كاملة: ', 'Full breaths: ') + num(breathsIn(lv, score)) + ' · ' + num(clockText(score)) + '</p>';
    }
    function stat(label, value) { return '<span class="gm-stat"><small>' + label + '</small><b>' + value + '</b></span>'; }
    function paint() {
      var el = phase === 'start' ? 0 : Math.min(clk.get(), total);
      ctx.status(stat(t('النمط', 'Pattern'), pname()) +
        stat(t('الأنفاس', 'Breaths'), '<span id="gbr-br">' + breathsIn(lv, el) + '</span>') +
        stat(t('المتبقّي', 'Left'), '<span id="gbr-left" class="gm-n">' + clockText(phase === 'start' ? sessionMs(lv, mins) : total - el) + '</span>'));
    }
    function show(el) { [startEl, orb, endEl].forEach(function (x) { x.hidden = x !== el; }); }

    function setNow(level) {
      var v = visual(reduced, level);
      core.style.transitionDuration = '0ms';
      core.style[v.prop] = v.value;
      void core.offsetWidth;
    }
    function glide(level, ms) {
      var v = visual(reduced, level);
      core.style.transitionDuration = Math.max(0, Math.round(ms)) + 'ms';
      core.style[v.prop] = v.value;
    }
    function ring(el) { ringFg.style.strokeDashoffset = (1 - el / total).toFixed(5); }
    function sayPhase(s) {
      wordEl.textContent = word(s.kind);
      root.setAttribute('data-phase', s.kind);
    }
    function sayCount(s) {
      var sec = Math.ceil(s.remain / 1000);
      if (sec !== lastSec) { lastSec = sec; nEl.textContent = sec; }
    }
    function enter(s, first) {
      sayPhase(s);
      lastSec = -1;
      sayCount(s);
      glide(targetOf(s.kind), s.remain);
      if (!first) { ctx.sound('tick'); ctx.haptic(10); }
    }
    function loop() {
      var el = clk.get();
      if (el >= total) { complete(total); return; }
      var s = phaseAt(lv, el), k = s.cycle * 10 + s.i;
      if (k !== lastKey) { var first = lastKey < 0; lastKey = k; enter(s, first); }
      else sayCount(s);
      ring(el);
      if (s.breaths !== lastBreaths) {
        lastBreaths = s.breaths;
        var b = document.getElementById('gbr-br');
        if (b) b.textContent = s.breaths;
      }
      var lf = document.getElementById('gbr-left');
      if (lf) lf.textContent = clockText(total - el);
      raf = requestAnimationFrame(loop);
    }
    function begin() {
      if (phase !== 'start') return;
      total = sessionMs(lv, mins);
      note = '';
      phase = 'play';
      lastKey = -1; lastBreaths = -1;
      show(orb);
      setNow(0);
      ring(0);
      bar.innerHTML = barHTML();
      bar.hidden = false;
      clk.start();
      paint();
      loop();
    }
    function reset(msg) {
      cancelAnimationFrame(raf);
      clk.stop(0);
      phase = 'start';
      note = msg || '';
      root.removeAttribute('data-phase');
      bar.hidden = true;
      startEl.innerHTML = startHTML();
      show(startEl);
      paint();
    }
    function complete(score) {
      if (phase === 'over') return;
      phase = 'over';
      cancelAnimationFrame(raf);
      clk.stop(score);
      root.removeAttribute('data-phase');
      bar.hidden = true;
      endEl.innerHTML = endHTML(score);
      show(endEl);
      paint();
      ctx.finish({
        won: true, score: score, grade: 0,
        title: t('أحسنت — خذْ لحظةً قبل أن تعود', 'Well done — take a moment before you go back'),
        detail: t('أنفاسٌ كاملة: ', 'Full breaths: ') + num(breathsIn(lv, score)) + ' · ' + pname()
      });
    }
    function stopEarly() {
      if (phase !== 'play') return;
      var plan = endPlan(clk.get(), total);
      if (plan.finish) complete(plan.score);
      else reset(t('توقّفتَ قبل 30 ثانية، فلم تُسجَّل الجلسة. عُدْ متى شئت.', 'You stopped before 30 seconds, so the session was not recorded. Come back any time.'));
    }
    function choose(m) {
      if (phase !== 'start' || MINUTES.indexOf(m) < 0) return;
      mins = m;
      writeMin(m);
      startEl.innerHTML = startHTML();
      var c = startEl.querySelector('[data-min="' + m + '"]');
      if (c && root.contains(document.activeElement)) c.focus();
      paint();
    }

    function onRootClick(e) {
      if (e.target.closest('[data-gbr="go"]')) { begin(); return; }
      var c = e.target.closest('[data-min]');
      if (c) choose(Number(c.dataset.min));
    }
    function onBarClick(e) {
      if (e.target.closest('[data-gbr="stop"]')) stopEarly();
    }
    root.addEventListener('click', onRootClick);
    bar.addEventListener('click', onBarClick);

    startEl.innerHTML = startHTML();
    paint();

    return {
      destroy: function () {
        dead = true;
        clk.stop();
        cancelAnimationFrame(raf);
        root.removeEventListener('click', onRootClick);
        bar.removeEventListener('click', onBarClick);
      },
      pause: function () {
        if (dead || phase !== 'play' || !clk.on()) return;
        clk.pause();
        cancelAnimationFrame(raf);
        setNow(levelAt(lv, Math.min(clk.get(), total - 1)));
        root.classList.add('gbr--hide');
      },
      resume: function () {
        root.classList.remove('gbr--hide');
        if (dead || phase !== 'play' || clk.on()) return;
        var el = Math.min(clk.get(), total - 1), s = phaseAt(lv, el);
        setNow(levelAt(lv, el));
        sayPhase(s);
        lastSec = -1;
        sayCount(s);
        lastKey = s.cycle * 10 + s.i;
        glide(targetOf(s.kind), s.remain);
        clk.resume();
        raf = requestAnimationFrame(loop);
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        var k = e.key;
        if (phase === 'start') {
          if (k === 'ArrowLeft' || k === 'ArrowRight') {
            var rtl = (document.documentElement.dir || 'rtl') === 'rtl';
            var dir = (k === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
            choose(stepMinutes(mins, dir));
            return true;
          }
          if (k === 'Enter' || k === ' ') {
            var f = document.activeElement;
            if (f && f.tagName === 'BUTTON' && !(root.contains(f) && f.dataset.gbr === 'go')) return false;
            if (!e.repeat) begin();
            return true;
          }
        }
        return false;
      },
      lang: function () {
        if (phase === 'start') startEl.innerHTML = startHTML();
        if (phase === 'over') endEl.innerHTML = endHTML(clk.get());
        if (phase === 'play') { bar.innerHTML = barHTML(); sayPhase(phaseAt(lv, Math.min(clk.get(), total - 1))); }
        paint();
      }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li><b>التنفّسُ الصندوقيّ</b>: شهيقٌ 4 ثوانٍ، ثمّ حبسٌ 4، ثمّ زفيرٌ 4، ثمّ حبسٌ 4 — إيقاعٌ متساوٍ يجمع الذهن.</li>' +
        '<li><b dir="ltr">4-7-8</b>: شهيقٌ 4 ثوانٍ، وحبسٌ 7، وزفيرٌ بطيءٌ 8 — الزفيرُ الطويلُ يُبطئ القلب.</li>' +
        '<li><b>الإيقاعُ الهادئ</b>: شهيقٌ 5 ثوانٍ وزفيرٌ 5، نحوَ ستّةِ أنفاسٍ في الدقيقة بلا حبس.</li>' +
        '<li>التنفّسُ البطيءُ يهدّئ الجسمَ قبل الاختبار: يُبطئ النبضَ ويخفّف التوتّر في دقائق.</li>' +
        '<li>اتبعِ الدائرة: تكبر مع الشهيق، وتثبت مع الحبس، وتصغر مع الزفير. والحلقةُ حولها تُريك ما مضى من الجلسة.</li>' +
        '<li>إن شعرتَ بدوارٍ فتوقّفْ وتنفّسْ كعادتك.</li>' +
        '<li>لوحةُ المفاتيح: <kbd>←</kbd> <kbd>→</kbd> لاختيار المدّة، و<kbd>Enter</kbd> للبدء، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li><b>Box breathing</b>: inhale for 4 seconds, hold 4, exhale 4, hold 4 — an even rhythm that steadies the mind.</li>' +
        '<li><b>4-7-8</b>: inhale for 4 seconds, hold 7, and breathe out slowly for 8 — the long exhale slows the heart.</li>' +
        '<li><b>Coherent breathing</b>: inhale for 5 seconds and exhale for 5, about six breaths a minute with no holds.</li>' +
        '<li>Slow breathing calms the body before an exam: it lowers your pulse and eases tension within minutes.</li>' +
        '<li>Follow the circle: it grows as you breathe in, stays still while you hold, and shrinks as you breathe out. The ring around it shows how much of the session has passed.</li>' +
        '<li>If you feel dizzy, stop and breathe normally.</li>' +
        '<li>Keyboard: <kbd>←</kbd> <kbd>→</kbd> pick the length, <kbd>Enter</kbd> starts, and <kbd>P</kbd> pauses.</li></ul>';
  }

  window.GardenGames.register('breathe', {
    mount: mount, help: help,
    logic: { PATTERNS: PATTERNS, MINUTES: MINUTES, MIN_KEEP: MIN_KEEP, STORE: STORE, cycleMs: cycleMs, sessionMs: sessionMs, phaseAt: phaseAt, levelAt: levelAt, targetOf: targetOf, visual: visual, endPlan: endPlan, breathsIn: breathsIn, clockText: clockText, stepMinutes: stepMinutes, ease: ease, timer: timer }
  });
})();
