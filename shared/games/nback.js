;(function () {
  'use strict';

  var BASE = 20, RATE = 0.3, ISI = 2500, SHOW = 500, CELLS = 9, CD_MS = 650, FX_MS = 420, RING_MS = 900, MISS_MS = 2600;
  var EG = [0, 4, 8, 2];

  function nOf(level) {
    var n = parseInt(level, 10);
    return n >= 1 && n <= 4 ? n : 2;
  }
  function targetsFor() { return Math.round(BASE * RATE); }
  function block(rng, n) {
    var len = BASE + n, tg = targetsFor(), idx = [], is = [], pos = [], i;
    for (i = n; i < len; i++) idx.push(i);
    for (i = idx.length - 1; i > 0; i--) { var k = Math.floor(rng() * (i + 1)); var x = idx[i]; idx[i] = idx[k]; idx[k] = x; }
    for (i = 0; i < len; i++) is.push(false);
    for (i = 0; i < tg; i++) is[idx[i]] = true;
    for (i = 0; i < len; i++) {
      if (is[i]) { pos.push(pos[i - n]); continue; }
      var avoid = i >= n ? pos[i - n] : -1;
      var p = Math.floor(rng() * (avoid < 0 ? CELLS : CELLS - 1));
      if (avoid >= 0 && p >= avoid) p++;
      pos.push(p);
    }
    return { n: n, len: len, pos: pos, target: is, targets: tg, nonTargets: BASE - tg };
  }
  function isMatch(pos, n, i) { return i >= n && pos[i] === pos[i - n]; }
  function tally(b, pressed) {
    var r = { hits: 0, misses: 0, falseAlarms: 0, rejections: 0 };
    for (var i = b.n; i < b.len; i++) {
      var p = !!pressed[i];
      if (b.target[i]) { if (p) r.hits++; else r.misses++; }
      else if (p) r.falseAlarms++;
      else r.rejections++;
    }
    return r;
  }
  function score(hits, falseAlarms, targets, nonTargets) {
    var h = targets ? 100 * hits / targets : 0;
    var f = nonTargets ? 100 * falseAlarms / nonTargets : 0;
    return Math.max(0, Math.min(100, Math.round(h - f)));
  }
  function grade(s) { return s >= 80 ? 1 : s < 50 ? -1 : 0; }
  function phaseAt(ms) {
    var i = Math.floor(ms / ISI);
    return { i: i, on: ms - i * ISI < SHOW };
  }
  function duration(len) { return len * ISI; }
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
  function isPress(e) {
    var c = e.code, k = e.key;
    if (c === 'Space' || c === 'KeyM' || c === 'KeyA') return true;
    return k === ' ' || k === 'm' || k === 'M' || k === 'a' || k === 'A';
  }
  function review(b, pressed) {
    return b.pos.map(function (p, i) {
      var k = i < b.n ? 'memo' : b.target[i] ? (pressed[i] ? 'hit' : 'miss') : (pressed[i] ? 'fa' : 'cr');
      return { i: i, pos: p, kind: k, ref: b.target[i] ? i - b.n : -1 };
    });
  }
  function missText(n) {
    return ['فاتتْك مطابقةُ الخطوة السابقة: كانت في مكانها قبل ' + stepsAr(n), 'You missed the previous one: it matched ' + n + ' back'];
  }
  function stepsAr(n) { return n === 1 ? 'خطوةٍ واحدة' : n === 2 ? 'خطوتين' : n + ' خطوات'; }
  function stepsEn(n) { return n === 1 ? '1 step' : n + ' steps'; }

  function mount(ctx) {
    var t = ctx.t;
    var n = nOf(ctx.level);
    var b = block(ctx.rng, n);
    var pressed = [];
    var clk = timer(function () { return performance.now(); });
    var phase = 'start', cur = -1, lit = -1, raf = 0, cdTimer = 0, cdN = 0, egTimer = 0, egAt = 0, dead = false, hits = 0, misses = 0, ringEl = null, sent = false;
    var fx = {};

    var root = document.createElement('div');
    root.className = 'gnb';
    var cellsHTML = '';
    for (var c = 0; c < CELLS; c++) cellsHTML += '<span class="gnb-c" data-c="' + c + '"></span>';
    root.innerHTML = '<div class="gnb-track" aria-hidden="true"><div class="gnb-fill"></div></div>' +
      '<div class="gnb-stage">' +
        '<span class="gnb-n"></span>' +
        '<div class="gnb-start"></div>' +
        '<div class="gnb-count" hidden aria-live="assertive"></div>' +
        '<div class="gnb-play" hidden><div class="gnb-grid" role="img">' + cellsHTML + '</div></div>' +
        '<div class="gnb-end" hidden></div>' +
      '</div>' +
      '<p class="gnb-fb" aria-live="polite"></p>';
    ctx.board.appendChild(root);
    var fill = root.querySelector('.gnb-fill');
    var stage = root.querySelector('.gnb-stage');
    var badge = root.querySelector('.gnb-n');
    var startEl = root.querySelector('.gnb-start');
    var countEl = root.querySelector('.gnb-count');
    var playEl = root.querySelector('.gnb-play');
    var grid = root.querySelector('.gnb-grid');
    var endEl = root.querySelector('.gnb-end');
    var fbEl = root.querySelector('.gnb-fb');
    var cellEls = [].slice.call(grid.querySelectorAll('.gnb-c'));

    var pad = document.createElement('div');
    pad.className = 'gnb-pad gnb-pad--off';
    ctx.controls.appendChild(pad);

    function num(v) { return ctx.num ? ctx.num(v) : String(v); }
    function nLabel() { return t('قارنْ بما قبل ' + n, 'Compare with ' + n + ' back'); }
    function stat(label, value) { return '<span class="gm-stat"><small>' + label + '</small><b>' + value + '</b></span>'; }

    function egSeq() {
      var s = EG.slice(0, n);
      s.push(EG[0]);
      return s;
    }
    function egHTML() {
      return egSeq().map(function (p, i, a) {
        var last = i === a.length - 1, first = i === 0;
        var cells = '';
        for (var k = 0; k < CELLS; k++) cells += '<span' + (k === p ? ' class="on"' : '') + '></span>';
        return '<span class="gnb-eg-s' + (first ? ' gnb-eg-s--from' : '') + (last ? ' gnb-eg-s--to' : '') + '" data-i="' + i + '">' +
          '<span class="gnb-eg-g">' + cells + '</span>' +
          (last ? '<i class="fa-solid fa-equals" aria-hidden="true"></i>' : '<b>' + (i + 1) + '</b>') + '</span>';
      }).join('');
    }
    function startHTML() {
      var best = ctx.best();
      return '<p class="gnb-rule">' + t('اضغطْ «تطابق» حين تضيء الخانةُ حيث أضاءت قبل ' + stepsAr(n) + '.', 'Press “Match” when the square lights where it was ' + stepsEn(n) + ' back.') + '</p>' +
        '<div class="gnb-eg" role="img" aria-label="' + t('مثال: الأخيرةُ في مكان الأولى، فهي مطابقة', 'Example: the last square is where the first one was, so it is a match') + '">' + egHTML() + '</div>' +
        (n > 1 ? '<p class="gnb-first"><i class="fa-solid fa-seedling" aria-hidden="true"></i> ' + t('ابدأْ بـ <bdi>N = 1</bdi> إن كانت أوّلَ مرّة', 'First time? Start with <bdi>N = 1</bdi>') + '</p>' : '') +
        '<button type="button" class="gsf-btn gsf-btn--go gnb-go" data-gnb="go"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + t('ابدأ', 'Start') + '</button>' +
        (best != null ? '<p class="gnb-best"><i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + t('أفضلُ نتيجة: ', 'Best: ') + num(best + '%') + '</p>' : '') +
        '<p class="gnb-hint">' + t('<kbd>Space</kbd> أو <kbd>M</kbd> أو <kbd>A</kbd> للمطابقة · <kbd>P</kbd> للإيقاف', '<kbd>Space</kbd>, <kbd>M</kbd> or <kbd>A</kbd> for a match · <kbd>P</kbd> pauses') + '</p>';
    }
    function endHTML() {
      var r = tally(b, pressed);
      return '<p class="gnb-endt"><i class="fa-solid fa-flag-checkered" aria-hidden="true"></i> ' + t('انتهت الجولة', 'Block complete') + '</p>' +
        '<p class="gnb-ends">' + t('أصبتَ ', 'Hits ') + num(r.hits + '/' + b.targets) + ' · ' + t('فاتتْك ', 'Missed ') + num(r.misses) + ' · ' + t('ضغطاتٌ زائدة ', 'False alarms ') + num(r.falseAlarms) + '</p>' +
        reviewHTML() +
        '<button type="button" class="gsf-btn gsf-btn--go gnb-go" data-gnb="score"><i class="fa-solid fa-flag-checkered" aria-hidden="true"></i> ' + t('اعرضْ نتيجتك', 'See your score') + '</button>';
    }
    function tileHTML(x) {
      var cells = '';
      for (var k = 0; k < CELLS; k++) cells += '<span' + (k === x.pos ? ' class="on"' : '') + '></span>';
      var foot = x.kind === 'hit' ? '<i class="fa-solid fa-check" aria-hidden="true"></i>'
        : x.kind === 'fa' ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        : x.kind === 'miss' ? t('فاتت', 'missed')
        : x.kind === 'memo' ? t('حفظ', 'memo') : '';
      var name = t('المحاولة ', 'Trial ') + (x.i + 1) + ': ' + (
        x.kind === 'hit' ? t('أصبتَ مطابقتَها', 'match caught')
        : x.kind === 'miss' ? t('مطابقةٌ فاتتْك', 'missed match')
        : x.kind === 'fa' ? t('ضغطةٌ زائدة', 'false alarm')
        : x.kind === 'memo' ? t('للحفظ فقط', 'memorise only') : t('ليست مطابقة', 'not a match')) +
        (x.ref >= 0 ? ' — ' + t('تطابق المحاولة ', 'matches trial ') + (x.ref + 1) : '');
      return '<li class="gnb-rv-t gnb-rv-t--' + x.kind + '" data-i="' + x.i + '"' + (x.ref >= 0 ? ' data-ref="' + x.ref + '" tabindex="0"' : '') + ' aria-label="' + ctx.esc(name) + '">' +
        '<span class="gnb-rv-h"><b>' + (x.i + 1) + '</b>' + (x.ref >= 0 ? '<span class="gnb-rv-eq">=' + (x.ref + 1) + '</span>' : '') + '</span>' +
        '<span class="gnb-rv-g" aria-hidden="true">' + cells + '</span>' +
        '<span class="gnb-rv-k" aria-hidden="true">' + foot + '</span></li>';
    }
    function reviewHTML() {
      return '<div class="gnb-rv">' +
        '<p class="gnb-rv-tt">' + t('راجعِ الجولة', 'Review the block') + '</p>' +
        '<ol class="gnb-rv-s">' + review(b, pressed).map(tileHTML).join('') + '</ol>' +
        '<p class="gnb-rv-lg"><span><i class="fa-solid fa-check gnb-ok" aria-hidden="true"></i> ' + t('أصبت', 'caught') + '</span>' +
        '<span><b class="gnb-rv-dash"></b> ' + t('مطابقةٌ فاتتْك', 'missed match') + '</span>' +
        '<span><i class="fa-solid fa-xmark gnb-bad" aria-hidden="true"></i> ' + t('ضغطةٌ زائدة', 'false alarm') + '</span>' +
        '<span><bdi class="gnb-rv-eq">=4</bdi> ' + t('في مكان المحاولة 4', 'same place as trial 4') + '</span></p>' +
        '<p class="gnb-rv-hint">' + t('المسْ مربّعاً عليه «=» لترى المحاولةَ التي يطابقها.', 'Tap a tile marked “=” to see the trial it matches.') + '</p>' +
      '</div>';
    }
    function pick(tile) {
      if (tile && !tile.hasAttribute('data-ref')) tile = null;
      [].slice.call(endEl.querySelectorAll('.gnb-rv-t--pick, .gnb-rv-t--src')).forEach(function (x) { x.classList.remove('gnb-rv-t--pick', 'gnb-rv-t--src'); });
      if (!tile) return;
      var src = endEl.querySelector('.gnb-rv-t[data-i="' + tile.getAttribute('data-ref') + '"]');
      tile.classList.add('gnb-rv-t--pick');
      if (src) src.classList.add('gnb-rv-t--src');
    }
    function padHTML() {
      return '<button type="button" class="gsf-btn gnb-match" data-gnb="match"><i class="fa-solid fa-equals" aria-hidden="true"></i>' +
        '<span>' + t('تطابق', 'Match') + '</span><kbd class="gnb-kh" aria-hidden="true">Space</kbd></button>';
    }
    function labels() {
      badge.textContent = nLabel();
      grid.setAttribute('aria-label', t('شبكةٌ من تسع خانات', 'Grid of nine squares'));
    }
    function paint() {
      var shown = Math.max(0, Math.min(cur + 1, b.len));
      ctx.status(stat(t('المحاولة', 'Trial'), num(shown + '/' + b.len)) +
        stat(t('أصبت', 'Hits'), num(hits + '/' + b.targets)) +
        stat(t('فاتتْك', 'Missed'), num(misses)));
    }
    function matchBtn() { return pad.querySelector('.gnb-match'); }
    function padState() {
      var live = phase === 'play' && clk.on() && cur >= n && cur < b.len && !pressed[cur];
      pad.classList.toggle('gnb-pad--off', !(phase === 'play' && clk.on()));
      pad.classList.toggle('gnb-pad--wait', phase === 'play' && cur < n);
      var m = matchBtn();
      if (m) m.setAttribute('aria-disabled', live ? 'false' : 'true');
    }
    function show(el) { [startEl, countEl, playEl, endEl].forEach(function (x) { x.hidden = x !== el; }); }

    function later(id, ms, fn) {
      clearTimeout(fx[id]);
      fx[id] = setTimeout(function () { fx[id] = 0; fn(); }, ms);
    }
    function mark(el, cls, ms) {
      if (!el) return;
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      later(cls, ms, function () { el.classList.remove(cls); });
    }
    function say(kind, ar, en, ms) {
      fbEl.className = 'gnb-fb' + (kind ? ' gnb-fb--' + kind : '');
      fbEl.textContent = t(ar, en);
      later('fb', ms || 1400, function () { fbEl.textContent = ''; fbEl.className = 'gnb-fb'; });
    }
    function ring(p) {
      if (ringEl) ringEl.classList.remove('gnb-c--miss');
      ringEl = p >= 0 ? cellEls[p] : null;
      if (!ringEl) { clearTimeout(fx.ring); return; }
      ringEl.classList.add('gnb-c--miss');
      later('ring', RING_MS, function () { if (ringEl) ringEl.classList.remove('gnb-c--miss'); ringEl = null; });
    }
    function flash(bad) {
      stage.classList.remove('gnb-flash', 'gnb-flash--bad'); void stage.offsetWidth;
      stage.classList.add('gnb-flash');
      if (bad) stage.classList.add('gnb-flash--bad');
    }
    function setLit(p) {
      if (p === lit) return;
      if (lit >= 0) cellEls[lit].classList.remove('gnb-on');
      lit = p;
      if (lit >= 0) cellEls[lit].classList.add('gnb-on');
    }

    function openTrial(i) {
      setLit(b.pos[i]);
      paint();
      padState();
    }
    function closeTrial(i) {
      if (b.target[i] && !pressed[i]) {
        misses++;
        mark(matchBtn(), 'gnb-match--miss', FX_MS + 200);
        if (i < b.len - 1) ring(b.pos[i]);
        var m = missText(n);
        say('miss', m[0], m[1], MISS_MS);
        paint();
      }
    }
    function progress(ms) {
      var f = Math.max(0, 1 - ms / duration(b.len));
      fill.style.transform = 'scaleX(' + f.toFixed(4) + ')';
    }
    function loop() {
      var ms = clk.get(), ph = phaseAt(ms);
      while (cur < ph.i && cur < b.len) {
        if (cur >= 0) closeTrial(cur);
        cur++;
        if (cur < b.len) openTrial(cur);
      }
      progress(ms);
      if (cur >= b.len) { end(); return; }
      setLit(ph.on ? b.pos[cur] : -1);
      raf = requestAnimationFrame(loop);
    }
    function press() {
      if (phase !== 'play' || !clk.on() || cur < 0 || cur >= b.len) return;
      if (cur < n) {
        say('wait', 'احفظِ المواضعَ أوّلاً — لا مطابقةَ قبل ' + stepsAr(n), 'Keep memorising — no match is possible before ' + stepsEn(n));
        return;
      }
      if (pressed[cur]) return;
      pressed[cur] = true;
      var m = matchBtn();
      if (b.target[cur]) {
        hits++;
        ctx.sound('good');
        mark(m, 'gnb-match--ok', FX_MS);
        flash(false);
        say('ok', 'أحسنت!', 'Match!');
      } else {
        ctx.sound('bad'); ctx.haptic(30);
        mark(m, 'gnb-match--bad', FX_MS);
        flash(true);
        say('bad', 'ليست مطابقة', 'Not a match');
      }
      padState();
      paint();
    }

    function egStop() { clearInterval(egTimer); egTimer = 0; }
    function egTick() {
      var steps = [].slice.call(startEl.querySelectorAll('.gnb-eg-s'));
      if (!steps.length) return;
      egAt = (egAt + 1) % (steps.length + 1);
      steps.forEach(function (s, i) {
        s.classList.toggle('gnb-eg-s--now', i === egAt);
        s.classList.toggle('gnb-eg-s--seen', i < egAt);
      });
      startEl.querySelector('.gnb-eg').classList.toggle('gnb-eg--hit', egAt === steps.length - 1);
    }
    function egStart() {
      egStop();
      if (ctx.reduced) { startEl.querySelector('.gnb-eg').classList.add('gnb-eg--still'); return; }
      egAt = -1;
      egTick();
      egTimer = setInterval(egTick, 900);
    }

    function go() {
      phase = 'play';
      show(playEl);
      cur = -1;
      clk.start();
      loop();
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
      egStop();
      phase = 'count';
      show(countEl);
      countdown();
    }
    function end() {
      if (phase === 'over') return;
      phase = 'over';
      clk.stop(duration(b.len));
      cancelAnimationFrame(raf);
      setLit(-1);
      ring(-1);
      clearTimeout(fx.fb);
      fbEl.textContent = ''; fbEl.className = 'gnb-fb';
      fill.style.transform = 'scaleX(0)';
      endEl.innerHTML = endHTML();
      show(endEl);
      padState();
      paint();
      var go = endEl.querySelector('[data-gnb="score"]');
      if (go) setTimeout(function () { if (!dead) go.focus({ preventScroll: true }); }, 60);
    }
    function send() {
      if (phase !== 'over' || sent) return;
      sent = true;
      var r = tally(b, pressed);
      var sc = score(r.hits, r.falseAlarms, b.targets, b.nonTargets);
      ctx.finish({
        won: true, score: sc, unit: t('٪', '%'), grade: grade(sc),
        detail: t('الإصابات: ', 'Hits: ') + num(r.hits + '/' + b.targets) + ' · ' +
          t('ضغطاتٌ زائدة: ', 'False alarms: ') + num(r.falseAlarms + '/' + b.nonTargets) + ' · ' +
          t('فاتتْك: ', 'Misses: ') + num(r.misses)
      });
    }

    function onRootClick(e) {
      if (e.target.closest('[data-gnb="go"]')) { begin(); return; }
      if (e.target.closest('[data-gnb="score"]')) { send(); return; }
      if (phase === 'over') pick(e.target.closest('.gnb-rv-t[data-ref]'));
    }
    function onRootOver(e) {
      if (phase !== 'over') return;
      var tile = e.target.closest && e.target.closest('.gnb-rv-t[data-ref]');
      if (tile) pick(tile);
    }
    function onRootOut(e) {
      if (phase !== 'over' || e.pointerType !== 'mouse') return;
      if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.gnb-rv-s')) pick(null);
    }
    function onPadDown(e) {
      if (!e.target.closest('.gnb-match')) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      press();
    }
    function onPadClick(e) {
      if (e.detail !== 0) return;
      if (e.target.closest('.gnb-match')) press();
    }
    root.addEventListener('click', onRootClick);
    root.addEventListener('pointerover', onRootOver);
    root.addEventListener('pointerout', onRootOut);
    root.addEventListener('focusin', onRootOver);
    pad.addEventListener('pointerdown', onPadDown);
    pad.addEventListener('click', onPadClick);

    startEl.innerHTML = startHTML();
    pad.innerHTML = padHTML();
    labels();
    paint();
    padState();
    egStart();

    return {
      destroy: function () {
        if (phase === 'over' && !sent) send();
        dead = true;
        clk.stop();
        cancelAnimationFrame(raf);
        clearTimeout(cdTimer);
        egStop();
        Object.keys(fx).forEach(function (k) { clearTimeout(fx[k]); });
        root.removeEventListener('click', onRootClick);
        root.removeEventListener('pointerover', onRootOver);
        root.removeEventListener('pointerout', onRootOut);
        root.removeEventListener('focusin', onRootOver);
        pad.removeEventListener('pointerdown', onPadDown);
        pad.removeEventListener('click', onPadClick);
      },
      pause: function () {
        if (phase === 'count') {
          if (cdTimer) { clearTimeout(cdTimer); cdTimer = 0; }
          root.classList.add('gnb--hide');
          return;
        }
        if (phase !== 'play' || !clk.on()) return;
        clk.pause();
        cancelAnimationFrame(raf);
        root.classList.add('gnb--hide');
        padState();
      },
      resume: function () {
        root.classList.remove('gnb--hide');
        if (phase === 'count') { if (!cdTimer) countdown(); return; }
        if (phase !== 'play' || clk.on()) return;
        clk.resume();
        padState();
        raf = requestAnimationFrame(loop);
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        var k = e.key;
        if (phase === 'start') {
          if (k === 'Enter' || k === ' ') {
            var fb = document.activeElement;
            if (fb && fb.tagName === 'BUTTON' && !root.contains(fb) && !pad.contains(fb)) return false;
            if (!e.repeat) begin();
            return true;
          }
          return false;
        }
        if (phase === 'count') return k === 'Enter' || isPress(e);
        if (phase === 'over') {
          if (sent || (k !== 'Enter' && k !== ' ')) return false;
          var fo = document.activeElement;
          if (fo && fo.closest && fo.closest('.gnb-rv-t')) { if (!e.repeat) pick(fo.closest('.gnb-rv-t')); return true; }
          if (!e.repeat) send();
          return true;
        }
        if (phase !== 'play') return false;
        if (isPress(e)) { if (!e.repeat) press(); return true; }
        if (k === 'Enter') {
          var f = document.activeElement;
          if (f && pad.contains(f)) { if (!e.repeat) press(); return true; }
          return false;
        }
        return false;
      },
      lang: function () {
        if (phase === 'start') { startEl.innerHTML = startHTML(); egStart(); }
        if (phase === 'over') endEl.innerHTML = endHTML();
        pad.innerHTML = padHTML();
        fbEl.textContent = '';
        labels();
        padState();
        paint();
      }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>تضيء خانةٌ من تسع خاناتٍ كلَّ ثانيتين ونصف، لنصف ثانيةٍ فقط.</li><li>اضغطْ «تطابق» حين تضيء الخانةُ في المكان نفسِه الذي أضاءت فيه قبل <b>N</b> خطوة: في المستوى 2 تقارن بما قبل خطوتين.</li><li>نحو ثلثِ المحاولات مطابقات. لا تضغطْ في غيرها، ولا تضغطْ قبل أن تمرّ N خطوةً من البداية.</li><li>الضغطةُ الصحيحة تومض بالأخضر، والزائدة بالأحمر. والمطابقةُ التي فاتتك تُحاط خانتُها بإطارٍ أحمرَ متقطّعٍ لحظةَ تضيء الخانةُ التالية، وفي آخر الجولة شريطٌ يعرض كلَّ المحاولات لتتحقّق بنفسك.</li><li>النتيجة = نسبةُ ما أصبتَ من المطابقات − نسبةُ ضغطاتك الزائدة من غيرها، بين 0 و100. وإن بلغتَ 80 فأنت جاهزٌ للمستوى التالي.</li><li>اللمس: الزرُّ الكبير «تطابق». لوحةُ المفاتيح: <kbd>Space</kbd> أو <kbd>M</kbd> أو <kbd>A</kbd>، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>One of nine squares lights up every 2.5 seconds, for half a second only.</li><li>Press “Match” when the square is in the same place as <b>N</b> steps back: at level 2 you compare with two steps ago.</li><li>About a third of the trials are matches. Do not press on the others, and do not press before the first N steps have passed.</li><li>A correct press flashes green, a false alarm red. A match you missed gets a dashed red ring on its square as the next square lights, and the end screen replays every trial so you can check it yourself.</li><li>Score = percent of matches you caught minus percent of non-matches you pressed, from 0 to 100. Reach 80 and you are ready for the next level.</li><li>Touch: the big “Match” button. Keyboard: <kbd>Space</kbd>, <kbd>M</kbd> or <kbd>A</kbd>, and <kbd>P</kbd> to pause.</li></ul>';
  }

  window.GardenGames.register('nback', {
    mount: mount, help: help,
    logic: { nOf: nOf, block: block, isMatch: isMatch, tally: tally, score: score, grade: grade, phaseAt: phaseAt, duration: duration, timer: timer, isPress: isPress, review: review, missText: missText, targetsFor: targetsFor, ISI: ISI, SHOW: SHOW, BASE: BASE }
  });
})();
