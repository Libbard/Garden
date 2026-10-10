;(function () {
  'use strict';

  var SLIDE_MS = 120;
  var SWIPE_PX = 22;

  function solvedArr(n) {
    var a = [];
    for (var i = 1; i < n * n; i++) a.push(i);
    a.push(0);
    return a;
  }

  function inversions(a) {
    var c = 0;
    for (var i = 0; i < a.length; i++) {
      if (!a[i]) continue;
      for (var j = i + 1; j < a.length; j++) if (a[j] && a[j] < a[i]) c++;
    }
    return c;
  }

  function solvable(a, n) {
    var inv = inversions(a);
    if (n % 2) return inv % 2 === 0;
    var fromBottom = n - Math.floor(a.indexOf(0) / n);
    return (inv + fromBottom) % 2 === 1;
  }

  function isPerm(a, n) {
    if (!Array.isArray(a) || a.length !== n * n) return false;
    var seen = {};
    for (var i = 0; i < a.length; i++) {
      var v = a[i];
      if (typeof v !== 'number' || v !== Math.floor(v) || v < 0 || v >= n * n || seen[v]) return false;
      seen[v] = 1;
    }
    return true;
  }

  function manhattan(a, n) {
    var d = 0;
    for (var i = 0; i < a.length; i++) {
      var v = a[i];
      if (!v) continue;
      var g = v - 1;
      d += Math.abs(Math.floor(i / n) - Math.floor(g / n)) + Math.abs(i % n - g % n);
    }
    return d;
  }

  function isSolved(a) {
    for (var i = 0; i < a.length - 1; i++) if (a[i] !== i + 1) return false;
    return a[a.length - 1] === 0;
  }

  function fixParity(a) {
    var p = -1, q = -1;
    for (var k = 0; k < a.length; k++) {
      if (!a[k]) continue;
      if (p < 0) p = k; else { q = k; break; }
    }
    var x = a[p]; a[p] = a[q]; a[q] = x;
    return a;
  }

  function shuffle(n, rng) {
    var need = n * n, a, i;
    for (var tries = 0; tries < 2000; tries++) {
      a = [];
      for (i = 0; i < n * n; i++) a.push(i);
      for (i = a.length - 1; i > 0; i--) {
        var k = Math.floor(rng() * (i + 1));
        var x = a[i]; a[i] = a[k]; a[k] = x;
      }
      if (!solvable(a, n)) fixParity(a);
      if (manhattan(a, n) >= need) return a;
    }
    a = [];
    for (i = n * n - 1; i >= 1; i--) a.push(i);
    a.push(0);
    if (!solvable(a, n)) fixParity(a);
    return a;
  }

  function slideAt(a, n, idx) {
    var b = a.indexOf(0);
    if (idx == null || idx < 0 || idx >= a.length || idx === b) return null;
    var br = Math.floor(b / n), bc = b % n, r = Math.floor(idx / n), c = idx % n, step;
    if (r === br) step = c > bc ? 1 : -1;
    else if (c === bc) step = r > br ? n : -n;
    else return null;
    var out = a.slice(), moved = [], p = b;
    while (p !== idx) {
      var q = p + step;
      out[p] = out[q];
      moved.push({ v: out[p], from: q, to: p });
      p = q;
    }
    out[idx] = 0;
    return { a: out, moved: moved, count: moved.length };
  }

  function dirMove(a, n, dir) {
    var b = a.indexOf(0), r = Math.floor(b / n), c = b % n, src = -1;
    if (dir === 'left' && c < n - 1) src = b + 1;
    else if (dir === 'right' && c > 0) src = b - 1;
    else if (dir === 'up' && r < n - 1) src = b + n;
    else if (dir === 'down' && r > 0) src = b - n;
    return src < 0 ? null : slideAt(a, n, src);
  }

  function swipeDir(dx, dy, min) {
    var ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < (min == null ? SWIPE_PX : min)) return null;
    return ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }

  var KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  var CODES = { KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down' };
  var LETTERS = { a: 'left', d: 'right', w: 'up', s: 'down' };
  function keyDir(e) {
    if (!e || e.ctrlKey || e.metaKey || e.altKey) return null;
    var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
    return KEYS[e.key] || CODES[e.code] || LETTERS[k] || null;
  }

  function cellAt(x, y, rect, n) {
    if (!rect || !rect.width || !rect.height) return -1;
    var c = Math.floor((x - rect.left) / rect.width * n);
    var r = Math.floor((y - rect.top) / rect.height * n);
    c = Math.max(0, Math.min(n - 1, c));
    r = Math.max(0, Math.min(n - 1, r));
    return r * n + c;
  }

  function mount(ctx) {
    var t = ctx.t;
    var n = ctx.level === '5' ? 5 : ctx.level === '4' ? 4 : 3;
    var total = n * n;
    var reduced = !!ctx.reduced;

    var arr = null, moves = 0, acc = 0, startAt = 0, running = false, held = false;
    var done = false, paused = false, raf = 0, endTimer = 0, ptr = null;
    var els = {};

    var root = document.createElement('div');
    root.className = 'gsl gsl--n' + n + (reduced ? ' gsl--still' : '');
    root.style.setProperty('--n', n);
    var board = document.createElement('div');
    board.className = 'gsl-board';
    board.setAttribute('tabindex', '0');
    board.setAttribute('role', 'group');
    var layer = document.createElement('div');
    layer.className = 'gsl-layer';
    layer.setAttribute('aria-hidden', 'true');
    board.appendChild(layer);
    var tip = document.createElement('p');
    tip.className = 'gsl-tip';
    root.appendChild(board);
    root.appendChild(tip);
    ctx.board.appendChild(root);

    function now() { return performance.now(); }
    function elapsed() { return acc + (running ? now() - startAt : 0); }

    function place(v, at) {
      var el = els[v];
      if (!el) return;
      var r = Math.floor(at / n), c = at % n;
      el.style.transform = 'translate(calc(' + c + ' * (100% + var(--gsl-gap))), calc(' + r + ' * (100% + var(--gsl-gap))))';
      el.classList.toggle('gsl-ok', at === v - 1);
    }

    function build() {
      layer.innerHTML = '';
      els = {};
      for (var v = 1; v < total; v++) {
        var el = document.createElement('div');
        el.className = 'gsl-tile';
        el.setAttribute('data-v', String(v));
        var inner = document.createElement('span');
        inner.className = 'gsl-in' + (v >= 10 ? ' gsl-d2' : '');
        inner.textContent = String(v);
        el.appendChild(inner);
        els[v] = el;
        layer.appendChild(el);
      }
      for (var i = 0; i < total; i++) if (arr[i]) place(arr[i], i);
    }

    function paint() {
      var b = ctx.best();
      ctx.status('<span class="gm-stat"><small>' + t('الحركات', 'Moves') + '</small><b>' + ctx.fmt('moves', moves) + '</b></span>' +
        '<span class="gm-stat"><small>' + t('الوقت', 'Time') + '</small><b id="gsl-time">' + ctx.fmt('time', elapsed()) + '</b></span>' +
        '<span class="gm-stat"><small>' + t('الأفضل', 'Best') + '</small><b>' + (b == null ? '—' : ctx.fmt('moves', b)) + '</b></span>');
    }

    function texts() {
      board.setAttribute('aria-label', t('لوحةُ اللغز المنزلق — المسْ مربّعاً أو اسحبْ أو استعملْ الأسهم', 'Sliding puzzle board — tap a tile, swipe, or use the arrow keys'));
      tip.innerHTML = t('المسْ مربّعاً بجانب الفراغ أو في صفّه أو عموده، أو اسحبْ على اللوحة. وعلى لوحة المفاتيح: الأسهم.',
        'Tap a tile next to the gap, or anywhere in its row or column, or swipe on the board. On a keyboard: the arrow keys.');
    }

    function loop() {
      var el = document.getElementById('gsl-time');
      if (el) el.textContent = ctx.fmt('time', elapsed());
      if (running) raf = requestAnimationFrame(loop);
    }
    function begin() {
      if (running || done) return;
      running = true; startAt = now();
      raf = requestAnimationFrame(loop);
    }
    function halt() {
      if (!running) return;
      acc += now() - startAt; running = false;
      cancelAnimationFrame(raf);
    }

    function persist() {
      if (done) return;
      ctx.save({ n: n, a: arr.slice(), m: moves, ms: Math.round(elapsed()) });
    }

    function win() {
      done = true;
      halt();
      ctx.clearSave();
      paint();
      root.classList.add('gsl--won');
      ctx.haptic(30);
      var ms = Math.round(acc);
      clearTimeout(endTimer);
      endTimer = setTimeout(function () {
        ctx.finish({ won: true, score: moves, unit: t('حركة', 'moves'), title: t('رتّبتَها كلَّها!', 'Solved!'),
          detail: t('الوقت: ', 'Time: ') + '<span class="gm-n">' + ctx.fmt('time', ms) + '</span>' });
      }, reduced ? 200 : SLIDE_MS + 480);
    }

    function nudge(v) {
      var el = els[v];
      if (!el || reduced) return;
      el.classList.remove('gsl-no'); void el.offsetWidth; el.classList.add('gsl-no');
    }

    function apply(res) {
      if (done || paused || !res) return false;
      begin();
      arr = res.a;
      moves += res.count;
      res.moved.forEach(function (m) { place(m.v, m.to); });
      ctx.sound('tap'); ctx.haptic(8);
      if (isSolved(arr)) { win(); return true; }
      persist();
      paint();
      return true;
    }

    function tapAt(x, y) {
      var idx = cellAt(x, y, layer.getBoundingClientRect(), n);
      if (idx < 0 || !arr[idx]) return;
      var res = slideAt(arr, n, idx);
      if (res) apply(res); else nudge(arr[idx]);
    }

    function restore(s) {
      if (!s || s.n !== n || !isPerm(s.a, n) || !solvable(s.a, n) || isSolved(s.a)) return false;
      arr = s.a.slice();
      moves = Math.max(0, Math.floor(Number(s.m) || 0));
      acc = Math.max(0, Number(s.ms) || 0);
      return true;
    }

    if (!restore(ctx.load())) { arr = shuffle(n, ctx.rng); moves = 0; acc = 0; }
    build();
    texts();
    paint();

    function onDown(e) {
      if (done || paused || ptr) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, fired: false };
      try { board.setPointerCapture(e.pointerId); } catch (er) {}
      if (e.pointerType !== 'mouse') e.preventDefault();
      try { board.focus({ preventScroll: true }); } catch (er) {}
    }
    function onMove(e) {
      if (!ptr || ptr.fired || e.pointerId !== ptr.id) return;
      var d = swipeDir(e.clientX - ptr.x, e.clientY - ptr.y);
      if (!d) return;
      ptr.fired = true;
      apply(dirMove(arr, n, d));
    }
    function onUp(e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      var p = ptr; ptr = null;
      if (p.fired || done || paused) return;
      var d = swipeDir(e.clientX - p.x, e.clientY - p.y);
      if (d) apply(dirMove(arr, n, d));
      else tapAt(p.x, p.y);
    }
    function onCancel(e) { if (ptr && e.pointerId === ptr.id) ptr = null; }
    function onMenu(e) { e.preventDefault(); }

    board.addEventListener('pointerdown', onDown);
    board.addEventListener('pointermove', onMove);
    board.addEventListener('pointerup', onUp);
    board.addEventListener('pointercancel', onCancel);
    board.addEventListener('contextmenu', onMenu);

    return {
      destroy: function () {
        running = false; cancelAnimationFrame(raf); clearTimeout(endTimer);
        board.removeEventListener('pointerdown', onDown);
        board.removeEventListener('pointermove', onMove);
        board.removeEventListener('pointerup', onUp);
        board.removeEventListener('pointercancel', onCancel);
        board.removeEventListener('contextmenu', onMenu);
      },
      pause: function () {
        if (paused) return;
        paused = true; ptr = null;
        held = running;
        halt();
        if (!done) persist();
        root.classList.add('gsl--hide');
      },
      resume: function () {
        if (!paused) return;
        paused = false;
        root.classList.remove('gsl--hide');
        if (held && !done) begin();
        held = false;
        paint();
      },
      key: function (e) {
        var d = keyDir(e);
        if (!d) return false;
        apply(dirMove(arr, n, d));
        return true;
      },
      lang: function () { texts(); paint(); }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>رتّبِ الأرقامَ تصاعديّاً من اليسار إلى اليمين ومن الأعلى إلى الأسفل، والخانةُ الفارغةُ في الزاوية السفلى اليمنى.</li>' +
        '<li>المسْ مربّعاً بجانب الفراغ فينزلق إليه. ولمسُ مربّعٍ أبعدَ في صفّ الفراغ أو عموده يدفع المربّعاتِ بينهما كلَّها نحوه دفعةً واحدة.</li>' +
        '<li>أو اسحبْ على اللوحة: ينزلق المربّعُ المجاورُ للفراغ في اتّجاه سحبك.</li>' +
        '<li>كلُّ مربّعٍ يتحرّك حركةٌ واحدة — فدفعُ ثلاثة مربّعاتٍ معاً ثلاثُ حركات. والأقلُّ أفضل.</li>' +
        '<li>المربّعُ الذي بلغ مكانَه الصحيح يُلوَّن بأخضرَ خفيف. ويبدأ الوقتُ مع أوّل حركة.</li>' +
        '<li>لوحةُ المفاتيح: السهمُ يُدخل المربّعَ إلى الفراغ في اتّجاهه — <kbd>←</kbd> ينقل المربّعَ الذي على يمين الفراغ إلى اليسار. وتعمل <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> كذلك، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>Put the numbers in order, left to right and top to bottom, with the empty space in the bottom-right corner.</li>' +
        '<li>Tap a tile next to the gap to slide it in. Tapping a tile further along the gap’s row or column pushes every tile in between toward the gap in one go.</li>' +
        '<li>Or swipe on the board: the tile beside the gap slides in the direction you swipe.</li>' +
        '<li>Every tile that moves counts as one move — pushing three tiles at once is three moves. Fewer is better.</li>' +
        '<li>Tiles that reach their correct spot turn a light green. The clock starts with your first move.</li>' +
        '<li>Keyboard: an arrow moves a tile into the gap in that direction — <kbd>←</kbd> moves the tile on the gap’s right to the left. <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> work too, and <kbd>P</kbd> pauses.</li></ul>';
  }

  window.GardenGames.register('slide', {
    mount: mount, help: help,
    _t: { solvedArr: solvedArr, inversions: inversions, solvable: solvable, isPerm: isPerm, manhattan: manhattan, isSolved: isSolved,
      shuffle: shuffle, slideAt: slideAt, dirMove: dirMove, swipeDir: swipeDir, keyDir: keyDir, cellAt: cellAt, fixParity: fixParity }
  });
})();
