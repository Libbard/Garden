;(function () {
  'use strict';

  var W = 17, H = 15, START_LEN = 4;
  var SPEED = { slow: 150, normal: 110, fast: 75 };
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
  };
  var CODES = { KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };

  function opposite(a, b) { var u = DIRS[a], v = DIRS[b]; return !!(u && v) && u[0] + v[0] === 0 && u[1] + v[1] === 0; }

  function create(w, h, len) {
    w = w || W; h = h || H; len = len || START_LEN;
    var y = Math.floor(h / 2), hx = Math.min(w - 1, Math.max(len - 1, Math.floor(w / 4)));
    var snake = [];
    for (var i = 0; i < len; i++) snake.push([hx - i, y]);
    var ax = Math.min(w - 1, w - 1 - Math.floor(w / 4));
    var apple = [ax, y];
    if (snake.some(function (c) { return c[0] === ax && c[1] === y; })) apple = null;
    return { W: w, H: h, snake: snake, dir: 'right', queue: [], apple: apple, score: 0, alive: true, won: false };
  }

  function enqueue(s, d) {
    if (!DIRS[d] || !s.alive || s.queue.length >= 2) return false;
    var ref = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
    if (d === ref || opposite(d, ref)) return false;
    s.queue.push(d);
    return true;
  }

  function spawn(s, rng) {
    var occ = new Uint8Array(s.W * s.H);
    for (var i = 0; i < s.snake.length; i++) occ[s.snake[i][1] * s.W + s.snake[i][0]] = 1;
    var free = [];
    for (var k = 0; k < occ.length; k++) if (!occ[k]) free.push(k);
    if (!free.length) return null;
    var pick = free[Math.min(free.length - 1, Math.floor(rng() * free.length))];
    return [pick % s.W, Math.floor(pick / s.W)];
  }

  function step(s, rng) {
    if (!s.alive) return { died: null };
    if (s.queue.length) s.dir = s.queue.shift();
    var v = DIRS[s.dir], hd = s.snake[0], nx = hd[0] + v[0], ny = hd[1] + v[1];
    if (nx < 0 || ny < 0 || nx >= s.W || ny >= s.H) { s.alive = false; return { died: 'wall' }; }
    var eat = !!s.apple && s.apple[0] === nx && s.apple[1] === ny;
    var upto = eat ? s.snake.length : s.snake.length - 1;
    for (var i = 0; i < upto; i++) {
      if (s.snake[i][0] === nx && s.snake[i][1] === ny) { s.alive = false; return { died: 'self' }; }
    }
    s.snake.unshift([nx, ny]);
    if (!eat) { s.snake.pop(); return {}; }
    s.score++;
    s.apple = spawn(s, rng);
    if (!s.apple) { s.won = true; s.alive = false; return { ate: true, won: true }; }
    return { ate: true };
  }

  function mount(ctx) {
    var t = ctx.t;
    var stepMs = SPEED[ctx.level] || SPEED.normal;
    var reduced = !!ctx.reduced;
    var s = create(W, H, START_LEN);
    if (!s.apple) s.apple = spawn(s, ctx.rng);
    var prev = s.snake.slice();
    var waiting = true, started = false, running = false, dead = false, crashed = false, finished = false;
    var last = 0, raf = 0, deadAt = 0, appleAt = -1e9, finishTimer = 0;
    var pal = null;

    var root = document.createElement('div');
    root.className = 'gsn';
    root.innerHTML = '<div class="gsn-board">' +
      '<canvas class="gsn-cv" role="img"></canvas>' +
      '<div class="gsn-hint" aria-live="polite"><p><span class="gsn-hint-key"></span><span class="gsn-hint-touch"></span></p></div>' +
      '</div>';
    ctx.board.appendChild(root);
    var boardEl = root.querySelector('.gsn-board');
    var cv = root.querySelector('.gsn-cv');
    var g = cv.getContext('2d');
    var hintEl = root.querySelector('.gsn-hint');

    ctx.controls.innerHTML = '<div class="gsn-pad" role="group">' +
      ['up', 'left', 'right', 'down'].map(function (d) {
        return '<button type="button" class="gsn-key gsn-key--' + d + '" data-dir="' + d + '"><i class="fa-solid fa-chevron-' + d + '" aria-hidden="true"></i></button>';
      }).join('') + '</div>';
    var pad = ctx.controls.querySelector('.gsn-pad');

    var probe = document.createElement('span');
    probe.className = 'gsn-probe';
    probe.setAttribute('aria-hidden', 'true');
    root.appendChild(probe);
    var pc = document.createElement('canvas');
    pc.width = pc.height = 1;
    var pg = pc.getContext('2d', { willReadFrequently: true });

    function rgbOf(token, fallback) {
      try {
        probe.style.color = fallback;
        probe.style.color = 'var(' + token + ', ' + fallback + ')';
        var str = getComputedStyle(probe).color;
        pg.clearRect(0, 0, 1, 1);
        pg.fillStyle = fallback;
        pg.fillStyle = str;
        pg.fillRect(0, 0, 1, 1);
        var d = pg.getImageData(0, 0, 1, 1).data;
        if (d[3] > 0) return [d[0], d[1], d[2]];
      } catch (e) {}
      var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(fallback);
      return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128];
    }
    function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
    function css(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
    function lum(c) { return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
    function readPalette() {
      var bg = rgbOf('--bg-card', '#1e1e2e');
      var ink = rgbOf('--text-primary', '#e5e7eb');
      var body = rgbOf('--bg-body', '#11111b');
      var ok = rgbOf('--gm-ok', '#10b981');
      var bad = rgbOf('--gm-bad', '#ef4444');
      var dark = lum(ink) < lum(body) ? ink : body, light = lum(ink) < lum(body) ? body : ink;
      var isDark = lum(bg) < 128;
      pal = {
        a: css(bg), b: css(mix(bg, ink, isDark ? .05 : .045)),
        snake: css(mix(ok, bg, isDark ? .1 : .04)),
        head: css(mix(ok, isDark ? light : dark, .14)),
        apple: css(bad), shine: css(mix(bad, light, .45)),
        stem: css(mix(ink, bg, .35)), leaf: css(ok),
        bad: css(bad), eye: css(mix(light, ok, .05)), pupil: css(dark)
      };
    }

    var cssW = 0, cssH = 0;
    function fit() {
      var r = boardEl.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.min(3, window.devicePixelRatio || 1);
      cssW = r.width; cssH = r.height;
      var pw = Math.max(1, Math.round(cssW * dpr)), ph = Math.max(1, Math.round(cssH * dpr));
      if (cv.width !== pw) cv.width = pw;
      if (cv.height !== ph) cv.height = ph;
      draw(performance.now());
    }

    function lerp(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
    function draw(now) {
      if (!pal || !cv.width) return;
      g.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
      g.fillStyle = pal.a;
      g.fillRect(0, 0, W, H);
      g.fillStyle = pal.b;
      for (var y = 0; y < H; y++) for (var x = (y & 1); x < W; x += 2) g.fillRect(x, y, 1, 1);

      if (s.apple) {
        var pop = reduced ? 1 : Math.min(1, (now - appleAt) / 180);
        var sc = .55 + .45 * (1 - Math.pow(1 - pop, 3));
        var ax = s.apple[0] + .5, ay = s.apple[1] + .54;
        g.save();
        g.translate(ax, ay); g.scale(sc, sc);
        g.strokeStyle = pal.stem; g.lineWidth = .08; g.lineCap = 'round';
        g.beginPath(); g.moveTo(0, -.3); g.quadraticCurveTo(.02, -.42, .08, -.48); g.stroke();
        g.fillStyle = pal.leaf;
        g.beginPath(); g.ellipse(.17, -.4, .13, .065, -.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = pal.apple;
        g.beginPath(); g.arc(0, 0, .35, 0, Math.PI * 2); g.fill();
        g.fillStyle = pal.shine;
        g.beginPath(); g.arc(-.12, -.12, .08, 0, Math.PI * 2); g.fill();
        g.restore();
      }

      var f = (running && !reduced) ? Math.max(0, Math.min(1, (now - last) / stepMs)) : 1;
      var n = s.snake.length;
      var head = lerp(prev[0], s.snake[0], f);
      var tail = lerp(prev[prev.length - 1], s.snake[n - 1], f);
      var pts = [head];
      for (var i = 1; i < n; i++) pts.push(s.snake[i]);
      pts.push(tail);
      g.strokeStyle = pal.snake;
      g.lineWidth = .74; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(pts[0][0] + .5, pts[0][1] + .5);
      for (var j = 1; j < pts.length; j++) g.lineTo(pts[j][0] + .5, pts[j][1] + .5);
      g.stroke();

      var hx = head[0] + .5, hy = head[1] + .5;
      var flash = crashed && (reduced || Math.floor((now - deadAt) / 110) % 2 === 0);
      g.fillStyle = flash ? pal.bad : pal.head;
      g.beginPath(); g.arc(hx, hy, .42, 0, Math.PI * 2); g.fill();
      var v = DIRS[s.dir], px = -v[1], py = v[0];
      for (var e = -1; e <= 1; e += 2) {
        var ex = hx + v[0] * .12 + px * .19 * e, ey = hy + v[1] * .12 + py * .19 * e;
        g.fillStyle = pal.eye;
        g.beginPath(); g.arc(ex, ey, .12, 0, Math.PI * 2); g.fill();
        g.fillStyle = pal.pupil;
        g.beginPath(); g.arc(ex + v[0] * .04, ey + v[1] * .04, .065, 0, Math.PI * 2); g.fill();
      }
    }

    function frame(now) {
      raf = 0;
      if (running && !dead) {
        if (now - last > stepMs * 4) last = now - stepMs;
        var k = 0;
        while (running && !dead && now - last >= stepMs && k < 3) { last += stepMs; tick(now); k++; }
      }
      draw(now);
      var animating = (dead && !finished && now - deadAt < 800) || (!reduced && now - appleAt < 200);
      if ((running && !dead) || animating) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    function tick(now) {
      prev = s.snake.slice();
      var r = step(s, ctx.rng);
      if (r.died) {
        dead = true; crashed = true; running = false; deadAt = now;
        ctx.sound('bad'); ctx.haptic(40);
        finishTimer = setTimeout(function () { end(false); }, 700);
        return;
      }
      if (r.ate) {
        appleAt = now;
        ctx.sound(r.won ? 'win' : 'good'); ctx.haptic(10);
        paint();
        if (r.won) {
          dead = true; running = false; deadAt = now;
          prev = s.snake.slice();
          finishTimer = setTimeout(function () { end(true); }, 500);
        }
      }
    }

    function apples(nn) {
      return t(nn === 1 ? 'تفّاحة' : nn === 2 ? 'تفّاحتان' : (nn >= 3 && nn <= 10) ? 'تفّاحات' : 'تفّاحة', nn === 1 ? 'apple' : 'apples');
    }
    function end(filled) {
      if (finished) return;
      finished = true;
      ctx.clearSave();
      ctx.finish({
        won: s.score > 0, score: s.score, unit: apples(s.score),
        title: filled ? t('ملأتَ الساحةَ كلَّها!', 'You filled the whole board!') : (s.score > 0 ? t('انتهت الجولة', 'Game over') : t('اصطدمتَ مبكّراً', 'Crashed early')),
        detail: t('طولُ الثعبان: ', 'Snake length: ') + s.snake.length
      });
    }

    function paint() {
      var b = ctx.best();
      var best = Math.max(b == null ? 0 : b, s.score);
      ctx.status('<span class="gm-stat"><small>' + t('النقاط', 'Score') + '</small><b>' + s.score + '</b></span>' +
        '<span class="gm-stat"><small>' + t('الأفضل', 'Best') + '</small><b>' + best + '</b></span>');
    }
    function hint() {
      var key = root.querySelector('.gsn-hint-key'), touch = root.querySelector('.gsn-hint-touch');
      key.textContent = started ? t('اضغطْ سهماً لتتابع', 'Press an arrow key to continue') : t('اضغطْ سهماً لتبدأ', 'Press an arrow key to start');
      touch.textContent = started ? t('اسحبْ في أيِّ اتّجاهٍ لتتابع', 'Swipe in any direction to continue') : t('اسحبْ في أيِّ اتّجاهٍ لتبدأ', 'Swipe in any direction to start');
      hintEl.classList.toggle('gsn-hint--on', waiting && !dead && !finished);
    }
    function labels() {
      cv.setAttribute('aria-label', t('ساحةُ الثعبان', 'Snake board'));
      pad.setAttribute('aria-label', t('أزرارُ الاتّجاه', 'Direction buttons'));
      var names = { up: ['أعلى', 'Up'], down: ['أسفل', 'Down'], left: ['يسار', 'Left'], right: ['يمين', 'Right'] };
      [].forEach.call(pad.querySelectorAll('.gsn-key'), function (b) {
        var nm = names[b.dataset.dir];
        b.setAttribute('aria-label', t(nm[0], nm[1]));
        b.setAttribute('data-ar-title', nm[0]);
        b.setAttribute('data-en-title', nm[1]);
      });
    }

    function input(d) {
      if (!DIRS[d] || dead || finished) return;
      if (waiting) {
        waiting = false; started = true;
        enqueue(s, d);
        running = true;
        last = performance.now();
        prev = s.snake.slice();
        hint();
        kick();
        return;
      }
      enqueue(s, d);
    }

    var sw = null;
    function onDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      sw = { id: e.pointerId, x: e.clientX, y: e.clientY };
      try { boardEl.setPointerCapture(e.pointerId); } catch (er) {}
      if (e.pointerType !== 'mouse') e.preventDefault();
    }
    function onMove(e) {
      if (!sw || e.pointerId !== sw.id) return;
      var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      sw.x = e.clientX; sw.y = e.clientY;
    }
    function onUp(e) { if (sw && e.pointerId === sw.id) sw = null; }
    function onCtx(e) { e.preventDefault(); }
    function onPad(e) {
      var b = e.target.closest('.gsn-key'); if (!b) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      b.classList.remove('gsn-key--hit'); void b.offsetWidth; b.classList.add('gsn-key--hit');
      input(b.dataset.dir);
    }
    function onPadClick(e) {
      if (e.detail !== 0) return;
      var b = e.target.closest('.gsn-key'); if (b) input(b.dataset.dir);
    }

    boardEl.addEventListener('pointerdown', onDown);
    boardEl.addEventListener('pointermove', onMove);
    boardEl.addEventListener('pointerup', onUp);
    boardEl.addEventListener('pointercancel', onUp);
    boardEl.addEventListener('contextmenu', onCtx);
    pad.addEventListener('pointerdown', onPad);
    pad.addEventListener('click', onPadClick);
    pad.addEventListener('contextmenu', onCtx);

    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(boardEl); }
    else window.addEventListener('resize', fit);
    var mo = new MutationObserver(function () { readPalette(); draw(performance.now()); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    readPalette();
    labels();
    hint();
    paint();
    fit();

    return {
      destroy: function () {
        running = false; finished = true;
        if (raf) cancelAnimationFrame(raf); raf = 0;
        clearTimeout(finishTimer);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', fit);
        mo.disconnect();
        boardEl.removeEventListener('pointerdown', onDown);
        boardEl.removeEventListener('pointermove', onMove);
        boardEl.removeEventListener('pointerup', onUp);
        boardEl.removeEventListener('pointercancel', onUp);
        boardEl.removeEventListener('contextmenu', onCtx);
        pad.removeEventListener('pointerdown', onPad);
        pad.removeEventListener('click', onPadClick);
        pad.removeEventListener('contextmenu', onCtx);
      },
      pause: function () {
        if (dead || finished) return;
        if (running) { running = false; waiting = true; }
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        prev = s.snake.slice();
        sw = null;
        hint();
        draw(performance.now());
      },
      resume: function () {
        if (dead || finished) return;
        hint();
        draw(performance.now());
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        var d = KEYS[e.key] || CODES[e.code];
        if (!d) return false;
        input(d);
        return true;
      },
      lang: function () { paint(); hint(); labels(); }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>وجّهِ الثعبانَ إلى التفّاحة؛ كلُّ تفّاحةٍ نقطةٌ وتزيده طولاً.</li><li>تنتهي الجولةُ إن اصطدم بالجدار أو بجسمه.</li><li>لا يرجع الثعبانُ إلى الخلف مباشرةً — استدرْ مرّتين.</li><li>اللمس: اسحبْ في أيِّ مكانٍ من الساحة نحو الاتّجاه، أو استعملْ أزرارَ الاتّجاه تحتها.</li><li>لوحةُ المفاتيح: الأسهم أو <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>، و<kbd>P</kbd> للإيقاف.</li><li>تبدأ الحركةُ مع أوّل اتّجاهٍ تختاره.</li></ul>'
      : '<ul><li>Steer the snake to the apple; each apple scores a point and makes it longer.</li><li>The round ends if it hits a wall or its own body.</li><li>The snake can’t reverse straight back — turn twice instead.</li><li>Touch: swipe anywhere on the board toward the direction, or use the arrow pad below it.</li><li>Keyboard: arrow keys or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>, and <kbd>P</kbd> to pause.</li><li>The snake starts moving with your first direction.</li></ul>';
  }

  window.GardenGames.register('snake', {
    mount: mount, help: help,
    _t: { W: W, H: H, START_LEN: START_LEN, SPEED: SPEED, DIRS: DIRS, opposite: opposite, create: create, enqueue: enqueue, spawn: spawn, step: step }
  });
})();
