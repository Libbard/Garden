;(function () {
  'use strict';

  var PADS = [
    { k: 'g', hz: 392, ar: 'أخضر', en: 'Green', keys: 'Q · 1' },
    { k: 'r', hz: 329.63, ar: 'أحمر', en: 'Red', keys: 'W · 2' },
    { k: 'y', hz: 261.63, ar: 'أصفر', en: 'Yellow', keys: 'A · 3' },
    { k: 'b', hz: 196, ar: 'أزرق', en: 'Blue', keys: 'S · 4' }
  ];
  var SPEED = {
    normal: [[1, 420, 180], [6, 340, 150], [10, 280, 130], [14, 220, 110]],
    fast: [[1, 280, 120], [6, 240, 100], [10, 200, 90], [14, 170, 80]]
  };
  var LEAD_START = 650, LEAD_RESUME = 750, NEXT_ROUND = 800, MIN_HOLD = 160, KEY_HOLD = 220, END_DELAY = 950;
  var CODES = { KeyQ: 0, KeyW: 1, KeyA: 2, KeyS: 3, Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 };
  var CHARS = { q: 0, w: 1, a: 2, s: 3, '1': 0, '2': 1, '3': 2, '4': 3 };

  function pick(rng) { return Math.min(3, Math.floor(rng() * 4)); }
  function sequence(rng, n) { var out = []; for (var i = 0; i < n; i++) out.push(pick(rng)); return out; }
  function timing(level, round) {
    var tb = SPEED[level] || SPEED.normal, r = tb[0];
    for (var i = 1; i < tb.length; i++) if (round >= tb[i][0]) r = tb[i];
    return { on: r[1], gap: r[2] };
  }
  function schedule(level, len, lead) {
    var tm = timing(level, len), at = lead || 0, steps = [];
    for (var i = 0; i < len; i++) { steps.push({ i: i, at: at, on: tm.on }); at += tm.on + tm.gap; }
    return { steps: steps, end: len ? at - tm.gap : at };
  }
  function judge(seq, idx, p) {
    if (idx < 0 || idx >= seq.length) return { result: 'locked', idx: idx };
    if (seq[idx] !== p) return { result: 'wrong', idx: idx };
    idx++;
    return { result: idx === seq.length ? 'round' : 'ok', idx: idx };
  }
  function engine(rng) {
    var E = { seq: [], idx: 0, score: 0, phase: 'idle' };
    E.start = function () { E.seq = [pick(rng)]; E.idx = 0; E.score = 0; E.phase = 'show'; };
    E.show = function () { if (E.phase === 'over' || E.phase === 'idle') return false; E.phase = 'show'; E.idx = 0; return true; };
    E.ready = function () { if (E.phase === 'show') { E.phase = 'input'; E.idx = 0; } };
    E.press = function (p) {
      if (E.phase !== 'input') return 'locked';
      var r = judge(E.seq, E.idx, p);
      if (r.result === 'wrong') { E.phase = 'over'; return 'wrong'; }
      E.idx = r.idx;
      if (r.result === 'round') { E.score = E.seq.length; E.seq.push(pick(rng)); E.idx = 0; E.phase = 'wait'; }
      return r.result;
    };
    E.want = function () { return E.seq[E.idx]; };
    return E;
  }
  function padFor(e) {
    if (!e || e.ctrlKey || e.metaKey || e.altKey) return null;
    if (e.code && CODES[e.code] != null) return CODES[e.code];
    var k = (e.key || '').toLowerCase();
    return CHARS[k] != null ? CHARS[k] : null;
  }
  function roundsWord(n, ar) {
    if (!ar) return n === 1 ? 'round' : 'rounds';
    if (n === 1) return 'جولة';
    if (n === 2) return 'جولتان';
    if (n >= 3 && n <= 10) return 'جولات';
    return n === 0 ? 'جولات' : 'جولةً';
  }

  function fxOn() {
    try { var m = JSON.parse(localStorage.getItem('garden_games') || 'null'); return !!(m && m.fx); } catch (e) { return false; }
  }
  var AC = null;
  function audio() {
    if (!fxOn()) return null;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      return AC;
    } catch (e) { return null; }
  }
  function voice(hz, ms, type, vol) {
    var a = audio(); if (!a) return null;
    try {
      var o = a.createOscillator(), g = a.createGain(), at = a.currentTime;
      o.type = type || 'triangle';
      o.frequency.value = hz;
      g.gain.setValueAtTime(.0001, at);
      g.gain.exponentialRampToValueAtTime(vol || .2, at + .012);
      o.connect(g); g.connect(a.destination);
      o.start(at);
      var v = { o: o, g: g, a: a, done: false };
      if (ms) stopVoice(v, ms / 1000);
      else o.stop(at + 3);
      return v;
    } catch (e) { return null; }
  }
  function stopVoice(v, after) {
    if (!v || v.done) return;
    v.done = true;
    try {
      var at = v.a.currentTime + (after || 0);
      v.g.gain.cancelScheduledValues(at);
      v.g.gain.setValueAtTime(Math.max(.0001, v.g.gain.value || .2), at);
      v.g.gain.exponentialRampToValueAtTime(.0001, at + .04);
      v.o.stop(at + .06);
    } catch (e) {}
  }

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function mount(ctx) {
    var t = ctx.t, level = SPEED[ctx.level] ? ctx.level : 'normal';
    var E = engine(ctx.rng);
    var timers = [], lit = [0, 0, 0, 0], holds = {}, shown = 0, paused = false, ended = false, alive = true;

    var root = el('div', 'gsim' + (ctx.reduced ? ' gsim--still' : ''));
    var board = el('div', 'gsim-board gsim--lock', { role: 'group' });
    var pads = PADS.map(function (p, i) {
      var b = el('button', 'gsim-pad gsim-pad--' + p.k, { type: 'button', 'data-p': String(i) });
      b.appendChild(el('span', 'gsim-key', { 'aria-hidden': 'true' }));
      board.appendChild(b);
      return b;
    });
    var hub = el('div', 'gsim-hub');
    var lbl = el('small', 'gsim-lbl');
    var count = el('b', 'gsim-num');
    var go = el('button', 'gsim-go', { type: 'button' });
    var goIco = el('i', 'fa-solid fa-play', { 'aria-hidden': 'true' });
    var goTxt = el('span', 'gsim-go-t');
    go.appendChild(goIco); go.appendChild(goTxt);
    hub.appendChild(lbl); hub.appendChild(count); hub.appendChild(go);
    board.appendChild(hub);
    var tip = el('p', 'gsim-tip');
    root.appendChild(board); root.appendChild(tip);
    ctx.board.appendChild(root);

    function T(fn, ms) { var id = setTimeout(function () { var k = timers.indexOf(id); if (k >= 0) timers.splice(k, 1); if (alive) fn(); }, ms); timers.push(id); return id; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function up(p) { lit[p]++; pads[p].classList.add('on'); }
    function down(p) { lit[p] = Math.max(0, lit[p] - 1); if (!lit[p]) pads[p].classList.remove('on'); }
    function clearLit() { lit = [0, 0, 0, 0]; pads.forEach(function (b) { b.classList.remove('on'); }); }
    function dropHolds() { Object.keys(holds).forEach(function (id) { stopVoice(holds[id].v); }); holds = {}; }

    function texts() {
      board.setAttribute('aria-label', t('لوحةُ سايمون', 'Simon board'));
      pads.forEach(function (b, i) {
        b.setAttribute('aria-label', t(PADS[i].ar, PADS[i].en) + ' (' + PADS[i].keys + ')');
        b.firstChild.textContent = PADS[i].keys.charAt(0);
      });
      hub.setAttribute('dir', ctx.isAr() ? 'rtl' : 'ltr');
      lbl.textContent = t('الجولة', 'Round');
      goTxt.textContent = t('ابدأ', 'Start');
      go.setAttribute('aria-label', t('ابدأ اللعبة', 'Start the game'));
      tip.textContent = t('لوحةُ المفاتيح: Q W A S أو 1 2 3 4', 'Keyboard: Q W A S or 1 2 3 4');
    }
    function paint() {
      var ph = E.phase, len = E.seq.length;
      var msg = ph === 'idle' ? t('اضغطْ «ابدأ» حين تستعدّ', 'Press Start when ready')
        : paused ? t('متوقّفة', 'Paused')
        : ph === 'show' ? t('شاهِدْ…', 'Watch…')
        : ph === 'input' ? t('دورُك', 'Your turn')
        : ph === 'wait' ? t('أحسنت!', 'Nice!')
        : t('خطأ!', 'Miss!');
      var step = ph === 'idle' ? '—' : ph === 'show' ? shown + '/' + len : ph === 'wait' ? E.score + '/' + E.score : E.idx + '/' + len;
      var best = ctx.best();
      ctx.status('<span class="gm-stat gsim-msg gsim-msg--' + ph + '"><b>' + msg + '</b></span>' +
        '<span class="gm-stat"><small>' + t('الخطوة', 'Step') + '</small><b>' + step + '</b></span>' +
        '<span class="gm-stat"><small>' + t('الأفضل', 'Best') + '</small><b>' + ctx.fmt('points', best) + '</b></span>');
      var started = ph !== 'idle';
      go.hidden = started;
      lbl.hidden = !started; count.hidden = !started;
      count.textContent = String(ph === 'wait' ? E.score : len);
      board.classList.toggle('gsim--lock', ph !== 'input' || paused);
      board.classList.toggle('gsim--live', ph === 'input' && !paused);
      root.classList.toggle('gsim--idle', !started);
    }

    function playRound(lead) {
      if (!E.show()) return;
      clearLit(); dropHolds();
      shown = 0;
      var sc = schedule(level, E.seq.length, lead);
      sc.steps.forEach(function (s) {
        T(function () { var p = E.seq[s.i]; shown = s.i + 1; up(p); voice(PADS[p].hz, s.on); paint(); }, s.at);
        T(function () { down(E.seq[s.i]); }, s.at + s.on);
      });
      T(function () { E.ready(); paint(); }, sc.end);
      paint();
    }
    function begin(fromKey) {
      if (E.phase !== 'idle') return;
      audio();
      E.start();
      paint();
      playRound(LEAD_START);
      if (fromKey) { try { pads[0].focus({ preventScroll: true }); } catch (e) {} }
    }
    function lose(p) {
      var want = E.want();
      dropHolds(); clearLit();
      pads[p].classList.remove('no'); void pads[p].offsetWidth; pads[p].classList.add('no');
      voice(92, 650, 'sawtooth', .14);
      ctx.haptic(80);
      paint();
      [0, 260, 520].forEach(function (at) {
        T(function () { up(want); }, at);
        T(function () { down(want); }, at + 170);
      });
      T(function () {
        if (ended) return;
        ended = true;
        var n = E.score, ar = ctx.isAr();
        ctx.finish({
          won: n > 0, score: n, title: t('انتهت اللعبة', 'Game over'),
          unit: roundsWord(n, ar),
          detail: t('أخطأتَ في الخطوة ', 'Missed at step ') + (E.idx + 1) + '/' + E.seq.length + ' · ' +
            t('اللونُ الصحيح: ', 'Right colour: ') + t(PADS[want].ar, PADS[want].en)
        });
      }, END_DELAY);
    }
    function accept(p) {
      var r = E.press(p);
      if (r === 'locked') return null;
      if (r === 'wrong') { lose(p); return r; }
      if (r === 'round') { paint(); T(function () { playRound(0); }, NEXT_ROUND); return r; }
      paint();
      return r;
    }

    function onDown(e) {
      if (e.target === go || (go.contains && go.contains(e.target))) return;
      var b = e.target.closest ? e.target.closest('.gsim-pad') : null;
      if (!b) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      if (e.button > 0) return;
      if (E.phase !== 'input' || paused) return;
      var p = Number(b.getAttribute('data-p'));
      audio();
      var r = accept(p);
      if (r === null || r === 'wrong') return;
      up(p);
      holds[e.pointerId] = { p: p, at: Date.now(), v: voice(PADS[p].hz, 0) };
    }
    function onUp(e) {
      var h = holds[e.pointerId]; if (!h) return;
      delete holds[e.pointerId];
      var wait = Math.max(0, MIN_HOLD - (Date.now() - h.at));
      T(function () { down(h.p); stopVoice(h.v); }, wait);
    }
    function keyPress(p) {
      if (E.phase !== 'input' || paused) return;
      audio();
      var r = accept(p);
      if (r === null || r === 'wrong') return;
      up(p);
      voice(PADS[p].hz, KEY_HOLD);
      T(function () { down(p); }, KEY_HOLD);
    }
    function onClick(e) {
      if (e.detail !== 0) return;
      var b = e.target.closest ? e.target.closest('.gsim-pad') : null;
      if (b) keyPress(Number(b.getAttribute('data-p')));
    }
    function onMenu(e) { e.preventDefault(); }
    function onGo() { begin(); }

    board.addEventListener('pointerdown', onDown);
    board.addEventListener('click', onClick);
    board.addEventListener('contextmenu', onMenu);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    go.addEventListener('click', onGo);
    texts();
    paint();

    var inst = {
      destroy: function () {
        alive = false; clearTimers(); dropHolds(); clearLit();
        board.removeEventListener('pointerdown', onDown);
        board.removeEventListener('click', onClick);
        board.removeEventListener('contextmenu', onMenu);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        go.removeEventListener('click', onGo);
      },
      pause: function () {
        if (paused || E.phase === 'idle' || E.phase === 'over') return;
        paused = true;
        clearTimers(); dropHolds(); clearLit();
        root.classList.add('gsim--hide');
        paint();
      },
      resume: function () {
        if (!paused) return;
        paused = false;
        root.classList.remove('gsim--hide');
        playRound(LEAD_RESUME);
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        var p = padFor(e);
        if (p != null) { if (!e.repeat) keyPress(p); return true; }
        if (e.key === 'Enter' || e.key === ' ') {
          var i = pads.indexOf(document.activeElement);
          if (i >= 0) { if (!e.repeat) keyPress(i); return true; }
          if (E.phase === 'idle') { begin(true); return true; }
          return false;
        }
        return false;
      },
      lang: function () { texts(); paint(); }
    };
    inst._probe = { engine: E, pads: pads, go: go, board: board, lit: function () { return lit.slice(); }, timers: function () { return timers.length; }, isPaused: function () { return paused; } };
    return inst;
  }

  function help(ar) {
    return ar
      ? '<ul><li>اضغطْ «ابدأ» في وسط الدائرة حين تكون مستعدّاً.</li><li>يُضيء سايمون لوناً ويُصدر نغمتَه؛ أعِدْه بلمس اللون نفسِه.</li><li>في كلِّ جولةٍ يُعيد السلسلةَ كلَّها من أوّلها ثمّ يضيف لوناً واحداً جديداً، وعليك أن تُعيدها كاملةً بالترتيب.</li><li>لا تلمسْ شيئاً وهو يعرض («شاهِدْ…»)؛ دورُك يبدأ حين ترى «دورُك».</li><li>خطأٌ واحدٌ ينهي اللعبة، ويومض اللونُ الصحيح. نتيجتُك عددُ الجولات التي أتممتَها.</li><li>في «عادي» تتسارع السلسلةُ قليلاً عند الجولات 6 و10 و14، و«سريع» يبدأ سريعاً.</li><li>لوحةُ المفاتيح: <kbd>Q</kbd> أخضر · <kbd>W</kbd> أحمر · <kbd>A</kbd> أصفر · <kbd>S</kbd> أزرق (أو <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd>)، و<kbd>Enter</kbd> للبدء، و<kbd>P</kbd> للإيقاف — والمتابعةُ تُعيد الجولةَ من أوّلها.</li><li>النغماتُ تعمل حين تشغّل زرَّ الصوت أعلاه، واللعبةُ تُلعب بالألوان وحدَها أيضاً.</li></ul>'
      : '<ul><li>Press <b>Start</b> in the centre when you are ready.</li><li>Simon lights a colour and plays its tone — repeat it by tapping the same colour.</li><li>Each round Simon replays the whole sequence from the start, then adds one new colour. Repeat the full sequence in order.</li><li>Don’t tap while Simon is playing (“Watch…”); your turn starts at “Your turn”.</li><li>One mistake ends the game and the right colour flashes. Your score is the number of rounds you completed.</li><li>On Normal the sequence speeds up a little at rounds 6, 10 and 14; Fast starts fast.</li><li>Keyboard: <kbd>Q</kbd> green · <kbd>W</kbd> red · <kbd>A</kbd> yellow · <kbd>S</kbd> blue (or <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd>), <kbd>Enter</kbd> to start, <kbd>P</kbd> to pause — resuming replays the round from the start.</li><li>Tones play when the sound button above is on; the game is fully playable by colour alone.</li></ul>';
  }

  window.GardenGames.register('simon', {
    mount: mount, help: help,
    _t: { PADS: PADS, SPEED: SPEED, pick: pick, sequence: sequence, timing: timing, schedule: schedule, judge: judge, engine: engine, padFor: padFor, roundsWord: roundsWord, fxOn: fxOn,
      LEAD_START: LEAD_START, LEAD_RESUME: LEAD_RESUME, NEXT_ROUND: NEXT_ROUND, END_DELAY: END_DELAY }
  });
})();
