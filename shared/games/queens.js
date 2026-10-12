;(function () {
  'use strict';

  var SIZES = { '6': 6, '7': 7, '8': 8, '9': 9 };
  var PENALTY = 10000;

  function shuffle(a, rnd) { for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(rnd() * (i + 1)); var x = a[i]; a[i] = a[k]; a[k] = x; } return a; }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function clock(ms) {
    var s = Math.floor(Math.max(0, ms) / 1000), m = Math.floor(s / 60);
    return m + ':' + pad2(s % 60);
  }

  function placeQueens(n, rnd) {
    var cols = [], used = 0;
    function rec(r) {
      if (r === n) return true;
      var opts = shuffle(range(n), rnd);
      for (var k = 0; k < n; k++) {
        var c = opts[k];
        if (used & (1 << c)) continue;
        if (r > 0 && Math.abs(cols[r - 1] - c) < 2) continue;
        cols[r] = c; used |= 1 << c;
        if (rec(r + 1)) return true;
        used &= ~(1 << c);
      }
      return false;
    }
    rec(0);
    return cols;
  }

  function neighbours(n, i) {
    var r = (i / n) | 0, c = i % n, out = [];
    if (r > 0) out.push(i - n);
    if (r < n - 1) out.push(i + n);
    if (c > 0) out.push(i - 1);
    if (c < n - 1) out.push(i + 1);
    return out;
  }

  function grow(n, cols, rnd) {
    var reg = [], w = [], left = n * n - n, i, k;
    for (i = 0; i < n * n; i++) reg.push(-1);
    for (k = 0; k < n; k++) { reg[k * n + cols[k]] = k; w.push(.25 + rnd() * rnd() * 2); }
    while (left > 0) {
      var cand = [], tot = 0;
      for (i = 0; i < n * n; i++) {
        if (reg[i] < 0) continue;
        var nb = neighbours(n, i);
        for (k = 0; k < nb.length; k++) if (reg[nb[k]] < 0) { cand.push(nb[k], reg[i]); tot += w[reg[i]]; }
      }
      var pick = rnd() * tot, j = 0;
      for (; j < cand.length - 2; j += 2) { pick -= w[cand[j + 1]]; if (pick <= 0) break; }
      reg[cand[j]] = cand[j + 1];
      left--;
    }
    return reg;
  }

  function solve(reg, n, limit, avoid) {
    var count = 0, sol = null, other = null, cols = [];
    function rec(r, cm, rm, prev) {
      if (r === n) {
        count++;
        if (!sol) sol = cols.slice();
        if (avoid && !other) { for (var q = 0; q < n; q++) if (cols[q] !== avoid[q]) { other = cols.slice(); break; } }
        return;
      }
      var base = r * n;
      for (var c = 0; c < n; c++) {
        if (cm & (1 << c)) continue;
        if (prev >= 0 && (c === prev - 1 || c === prev + 1)) continue;
        var g = reg[base + c];
        if (rm & (1 << g)) continue;
        cols[r] = c;
        rec(r + 1, cm | (1 << c), rm | (1 << g), c);
        if (count >= limit) return;
      }
    }
    rec(0, 0, 0, -1);
    return { count: count, sol: sol, other: other };
  }

  function connectedWithout(reg, n, g, skip) {
    var start = -1, size = 0, i;
    for (i = 0; i < n * n; i++) if (reg[i] === g && i !== skip) { size++; if (start < 0) start = i; }
    if (start < 0) return false;
    var seen = {}, stack = [start], got = 0;
    seen[start] = 1;
    while (stack.length) {
      var x = stack.pop(); got++;
      var nb = neighbours(n, x);
      for (var k = 0; k < nb.length; k++) {
        var y = nb[k];
        if (y !== skip && !seen[y] && reg[y] === g) { seen[y] = 1; stack.push(y); }
      }
    }
    return got === size;
  }

  function sees(n, reg, a, b) {
    var ra = (a / n) | 0, ca = a % n, rb = (b / n) | 0, cb = b % n;
    return ra === rb || ca === cb || reg[a] === reg[b] || (Math.abs(ra - rb) < 2 && Math.abs(ca - cb) < 2);
  }

  function logical(reg, n) {
    var total = n * n, st = [], units = [], i, k, u;
    for (i = 0; i < total; i++) st.push(0);
    for (k = 0; k < 3 * n; k++) units.push([]);
    for (i = 0; i < total; i++) { units[(i / n) | 0].push(i); units[n + i % n].push(i); units[2 * n + reg[i]].push(i); }
    function place(q) { st[q] = 2; for (var x = 0; x < total; x++) if (x !== q && !st[x] && sees(n, reg, x, q)) st[x] = 1; }
    function open(unit) { var o = []; for (var j = 0; j < unit.length; j++) { if (st[unit[j]] === 2) return null; if (!st[unit[j]]) o.push(unit[j]); } return o; }
    for (var guard = 0; guard < total * 4; guard++) {
      var moved = false;
      for (u = 0; u < units.length && !moved; u++) {
        var o = open(units[u]);
        if (o && !o.length) return false;
        if (o && o.length === 1) { place(o[0]); moved = true; }
      }
      for (u = 0; u < units.length && !moved; u++) {
        var op = open(units[u]);
        if (!op) continue;
        for (var x = 0; x < total; x++) {
          if (st[x] || op.indexOf(x) >= 0) continue;
          if (op.every(function (c) { return sees(n, reg, c, x); })) { st[x] = 1; moved = true; }
        }
      }
      if (!moved) break;
    }
    return st.filter(function (v) { return v === 2; }).length === n;
  }

  function generate(n, rnd) {
    var LIMIT = 24, spare = null;
    for (var attempt = 0; attempt < 400; attempt++) {
      var cols = placeQueens(n, rnd);
      var reg = grow(n, cols, rnd);
      var isQ = {};
      for (var q = 0; q < n; q++) isQ[q * n + cols[q]] = 1;
      var res = solve(reg, n, LIMIT, cols);
      for (var step = 0; step < 50 && res.count > 1; step++) {
        var alt = res.other, moves = [];
        for (var r = 0; r < n; r++) {
          var i = r * n + alt[r];
          if (isQ[i]) continue;
          var nb = neighbours(n, i);
          for (var k = 0; k < nb.length; k++) if (reg[nb[k]] !== reg[i]) moves.push(i, reg[nb[k]]);
        }
        shuffle(range(moves.length / 2), rnd).some(function (m) {
          var cell = moves[m * 2], to = moves[m * 2 + 1], from = reg[cell];
          if (!connectedWithout(reg, n, from, cell)) return false;
          reg[cell] = to;
          var nx = solve(reg, n, LIMIT, cols);
          if (nx.count <= res.count || rnd() < .25) { res = nx; return true; }
          reg[cell] = from;
          return false;
        });
        if (!moves.length) break;
      }
      if (res.count !== 1) continue;
      var out = { n: n, reg: reg, sol: cols };
      if (logical(reg, n)) return out;
      if (!spare) spare = out;
      if (attempt >= 40) return spare;
    }
    return spare;
  }

  function validRegions(reg, n) {
    if (!reg || reg.length !== n * n) return false;
    var seen = [];
    for (var i = 0; i < n * n; i++) { var g = reg[i]; if (!(g >= 0 && g < n) || (g | 0) !== g) return false; seen[g] = 1; }
    for (var k = 0; k < n; k++) if (!seen[k] || !connectedWithout(reg, n, k, -1)) return false;
    return true;
  }

  function clashes(n, reg, queens) {
    var bad = {};
    for (var a = 0; a < queens.length; a++) {
      for (var b = a + 1; b < queens.length; b++) {
        var x = queens[a], y = queens[b];
        var rx = (x / n) | 0, cx = x % n, ry = (y / n) | 0, cy = y % n;
        if (rx === ry || cx === cy || reg[x] === reg[y] || (Math.abs(rx - ry) < 2 && Math.abs(cx - cy) < 2)) { bad[x] = 1; bad[y] = 1; }
      }
    }
    return bad;
  }

  function solved(n, reg, queens) {
    return queens.length === n && Object.keys(clashes(n, reg, queens)).length === 0;
  }

  function grade(n, ms, hints) {
    if (hints >= 2) return -1;
    if (!hints && ms < n * n * 1500) return 1;
    return 0;
  }

  function mount(ctx) {
    var t = ctx.t;
    var n = SIZES[ctx.level] || 7, total = n * n;
    var REG, SOL, S, H, undo, hints, acc;
    var running = false, started = false, startAt = 0, done = false, hidden = false, tick = 0, timers = [], drag = null, lastTime = '';

    if (!restore(ctx.load())) fresh();

    function fresh() {
      var g = null;
      while (!g) g = generate(n, ctx.rng);
      REG = g.reg; SOL = g.sol;
      S = []; H = [];
      for (var i = 0; i < total; i++) { S.push(0); H.push(0); }
      undo = []; hints = 0; acc = 0;
    }
    function restore(st) {
      try {
        if (!st || st.v !== 1 || st.n !== n) return false;
        var reg = String(st.r).split('').map(Number), s = String(st.s).split('').map(Number), h = String(st.h).split('').map(Number);
        if (!validRegions(reg, n) || s.length !== total || h.length !== total || !Array.isArray(st.sol) || st.sol.length !== n) return false;
        var chk = solve(reg, n, 2);
        if (chk.count !== 1 || chk.sol.join() !== st.sol.join()) return false;
        for (var i = 0; i < total; i++) {
          if (s[i] > 2 || s[i] < 0) return false;
          if (h[i] && (s[i] !== 2 || SOLcell(st.sol, i) !== 1)) return false;
        }
        REG = reg; SOL = st.sol.slice(); S = s; H = h;
        undo = Array.isArray(st.u) ? st.u.filter(function (rec) {
          return Array.isArray(rec) && rec.every(function (x) { return Array.isArray(x) && x.length === 2 && x[0] >= 0 && x[0] < total && x[1] >= 0 && x[1] <= 2; });
        }).slice(-200) : [];
        hints = Math.max(0, st.hints | 0); acc = Math.max(0, +st.t || 0);
        started = acc > 0;
        return !isWon();
      } catch (er) { return false; }
    }
    function SOLcell(sol, i) { return sol[(i / n) | 0] === i % n ? 1 : 0; }
    function persist() {
      if (done) return;
      ctx.save({ v: 1, n: n, r: REG.join(''), sol: SOL, s: S.join(''), h: H.join(''), u: undo.slice(-200), hints: hints, t: Math.round(elapsed()) });
    }

    function queens() { var q = []; for (var i = 0; i < total; i++) if (S[i] === 2) q.push(i); return q; }
    function isWon() { return solved(n, REG, queens()); }

    function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

    var root = el('div', 'gqn');
    root.style.setProperty('--n', n);
    var grid = root.appendChild(el('div', 'gqn-grid'));
    grid.setAttribute('role', 'grid');
    var cellEl = [];
    for (var i = 0; i < total; i++) {
      var r = (i / n) | 0, c = i % n, w = '';
      if (r > 0 && REG[i - n] !== REG[i]) w += ' gqn-wt';
      if (r < n - 1 && REG[i + n] !== REG[i]) w += ' gqn-wb';
      if (c > 0 && REG[i - 1] !== REG[i]) w += ' gqn-ws';
      if (c < n - 1 && REG[i + 1] !== REG[i]) w += ' gqn-we';
      var b = el('button', 'gqn-c');
      b.type = 'button';
      b.dataset.i = i;
      b.dataset.r = REG[i];
      b.gqnW = w;
      b.tabIndex = i === 0 ? 0 : -1;
      b.appendChild(el('i', 'fa-solid'));
      cellEl.push(grid.appendChild(b));
    }
    var tip = root.appendChild(el('p', 'gqn-tip'));
    ctx.board.appendChild(root);

    var ctl = el('div', 'gqn-ctl');
    var TOOLS = [
      { a: 'undo', icon: 'fa-rotate-left', ar: 'تراجع', en: 'Undo' },
      { a: 'clear', icon: 'fa-eraser', ar: 'مسحُ الكلّ', en: 'Clear' },
      { a: 'hint', icon: 'fa-lightbulb', ar: 'تلميح', en: 'Hint' }
    ];
    var tool = {};
    TOOLS.forEach(function (o) {
      var btn = el('button', 'gsf-btn gsf-btn--ghost gqn-tool');
      btn.type = 'button';
      btn.dataset.a = o.a;
      var ic = btn.appendChild(el('i', 'fa-solid ' + o.icon));
      ic.setAttribute('aria-hidden', 'true');
      tool[o.a] = btn.appendChild(el('span'));
      ctl.appendChild(btn);
    });
    ctx.controls.appendChild(ctl);

    var cache = { cls: [], lab: [] };

    function stat(label, value, id) {
      return '<span class="gm-stat"><small>' + label + '</small><b' + (id ? ' id="' + id + '"' : '') + '>' + value + '</b></span>';
    }
    function status() {
      lastTime = clock(elapsed());
      ctx.status(stat(t('التيجان', 'Queens'), '<span class="gm-n">' + queens().length + '/' + n + '</span>') +
        stat(t('الوقت', 'Time'), lastTime, 'gqn-time') +
        stat(t('التلميحات', 'Hints'), hints));
    }
    function labels() {
      grid.setAttribute('aria-label', t('رقعةُ التيجان', 'Queens board'));
      tip.textContent = t('لمسةٌ واحدةٌ تضع ✕، والثانيةُ تاجاً، والثالثةُ تمحو. واسحبْ إصبعَك لتضعَ ✕ على عدّة خانات.', 'Tap once for ✕, twice for a queen, three times to clear. Drag to mark ✕ on many cells.');
      TOOLS.forEach(function (o) { tool[o.a].textContent = t(o.ar, o.en); });
      cache.lab = [];
    }
    function render() {
      var q = queens(), bad = clashes(n, REG, q);
      for (var i = 0; i < total; i++) {
        var s = S[i], cls = 'gqn-c' + cellEl[i].gqnW + (s === 1 ? ' gqn-x' : s === 2 ? ' gqn-q' : '') + (bad[i] ? ' gqn-bad' : '') + (H[i] ? ' gqn-h' : '');
        if (cache.cls[i] !== cls) {
          cellEl[i].className = cls;
          cellEl[i].firstChild.className = 'fa-solid' + (s === 1 ? ' fa-xmark' : s === 2 ? ' fa-crown' : '');
          cache.cls[i] = cls;
        }
        var lab = t('الصفّ ', 'Row ') + ((i / n | 0) + 1) + t('، العمود ', ', column ') + (i % n + 1) + t('، المنطقة ', ', region ') + (REG[i] + 1) + ': ' +
          (s === 2 ? (bad[i] ? t('تاجٌ متعارض', 'clashing queen') : t('تاج', 'queen')) : s === 1 ? t('علامة ✕', 'marked ✕') : t('فارغة', 'empty'));
        if (cache.lab[i] !== lab) { cellEl[i].setAttribute('aria-label', lab); cache.lab[i] = lab; }
      }
      tool.undo.parentNode.disabled = !undo.length || done;
      tool.clear.parentNode.disabled = done;
      tool.hint.parentNode.disabled = done;
      status();
    }

    function elapsed() { return acc + (running ? performance.now() - startAt : 0); }
    function startClock() {
      if (running || done || hidden) return;
      running = true; started = true; startAt = performance.now();
      tick = setInterval(onTick, 250);
    }
    function stopClock() {
      if (!running) return;
      acc += performance.now() - startAt; running = false;
      clearInterval(tick);
    }
    function onTick() {
      var s = clock(elapsed());
      if (s === lastTime) return;
      lastTime = s;
      var node = document.getElementById('gqn-time');
      if (node) node.textContent = s;
    }

    function setCell(i, v, rec) {
      if (H[i] || S[i] === v) return false;
      rec.push([i, S[i]]);
      S[i] = v;
      return true;
    }
    function anim(node, cls, delay) {
      if (ctx.reduced) return;
      node.classList.remove(cls);
      if (delay != null) node.style.setProperty('--d', delay + 'ms');
      void node.offsetWidth;
      node.classList.add(cls);
    }
    function shake(i) { anim(cellEl[i], 'gqn-sh'); ctx.haptic(15); }

    function afterChange(i) {
      render();
      if (i >= 0 && S[i] === 2) {
        var bad = clashes(n, REG, queens());
        if (bad[i]) { ctx.sound('bad'); ctx.haptic(30); anim(cellEl[i], 'gqn-sh'); }
        else { ctx.sound('tap'); anim(cellEl[i], 'gqn-pp'); }
      } else if (i >= 0) ctx.sound('tap');
      if (checkWin(i)) return;
      persist();
    }

    function cycle(i, rec) {
      if (H[i]) { shake(i); return false; }
      return setCell(i, (S[i] + 1) % 3, rec);
    }
    function act(i, v) {
      if (done || hidden) return;
      startClock();
      var rec = [];
      if (v == null ? cycle(i, rec) : (H[i] ? (shake(i), false) : setCell(i, v, rec))) { undo.push(rec); if (undo.length > 200) undo.shift(); }
      afterChange(i);
    }

    function undoMove() {
      if (done || hidden) return;
      var rec = undo.pop();
      if (!rec) return;
      for (var k = rec.length - 1; k >= 0; k--) if (!H[rec[k][0]]) S[rec[k][0]] = rec[k][1];
      ctx.sound('tap');
      render(); persist();
      if (rec.length) anim(cellEl[rec[0][0]], 'gqn-pp');
    }
    function clearAll() {
      if (done || hidden) return;
      var rec = [];
      for (var i = 0; i < total; i++) setCell(i, 0, rec);
      if (!rec.length) return;
      undo.push(rec);
      ctx.sound('tap');
      render(); persist();
    }
    function hint() {
      if (done || hidden) return;
      var pool = [];
      for (var r = 0; r < n; r++) { var i = r * n + SOL[r]; if (!H[i]) pool.push(i); }
      var free = pool.filter(function (x) { return S[x] !== 2; });
      if (free.length) pool = free;
      if (!pool.length) return;
      startClock();
      var target = pool[Math.floor(ctx.rng() * pool.length)];
      S[target] = 2; H[target] = 1; hints++;
      acc += PENALTY;
      ctx.sound('good');
      render();
      anim(cellEl[target], 'gqn-pp');
      roving(target);
      cellEl[target].focus({ preventScroll: true });
      if (checkWin(target)) return;
      persist();
    }

    function checkWin(last) {
      if (!isWon()) return false;
      done = true;
      stopClock();
      drag = null;
      ctx.clearSave();
      render();
      var r0 = last >= 0 ? (last / n) | 0 : 0, c0 = last >= 0 ? last % n : 0, wait = 60;
      if (!ctx.reduced) {
        for (var i = 0; i < total; i++) anim(cellEl[i], 'gqn-wv', (Math.abs(((i / n) | 0) - r0) + Math.abs(i % n - c0)) * 50);
        wait = 2 * n * 50 + 500;
      }
      root.classList.add('gqn--won');
      ctx.sound('good');
      var ms = Math.round(acc);
      timers.push(setTimeout(function () {
        ctx.finish({ won: true, score: ms, grade: grade(n, ms, hints),
          detail: t('التلميحات: ', 'Hints: ') + hints + (hints ? t(' (+10ث لكلٍّ منها)', ' (+10s each)') : '') + ' · ' + n + '×' + n });
      }, wait));
      return true;
    }

    function cellAt(x, y) {
      var node = document.elementFromPoint ? document.elementFromPoint(x, y) : null;
      var b = node && node.closest ? node.closest('.gqn-c') : null;
      return b && grid.contains(b) ? +b.dataset.i : -1;
    }
    function onDown(e) {
      if (done || hidden || (e.button != null && e.button > 0)) return;
      var b = e.target.closest ? e.target.closest('.gqn-c') : null;
      if (!b) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      var i = +b.dataset.i, wasEmpty = S[i] === 0 && !H[i];
      startClock();
      var rec = [];
      if (cycle(i, rec)) { undo.push(rec); if (undo.length > 200) undo.shift(); }
      drag = { id: e.pointerId, rec: rec, paint: wasEmpty, last: i };
      try { grid.setPointerCapture(e.pointerId); } catch (er) {}
      if (e.pointerType === 'mouse') b.focus({ preventScroll: true });
      roving(i);
      afterChange(i);
    }
    function onMove(e) {
      if (!drag || e.pointerId !== drag.id || !drag.paint || done) return;
      var i = cellAt(e.clientX, e.clientY);
      if (i < 0 || i === drag.last) return;
      drag.last = i;
      if (S[i] === 0 && setCell(i, 1, drag.rec)) { ctx.sound('tap'); render(); }
    }
    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      if (!done) persist();
    }
    function onClick(e) {
      if (e.detail !== 0) return;
      var b = e.target.closest ? e.target.closest('.gqn-c') : null;
      if (b) act(+b.dataset.i);
    }
    function onCtl(e) {
      var b = e.target.closest ? e.target.closest('.gqn-tool') : null;
      if (!b || b.disabled) return;
      var a = b.dataset.a;
      if (a === 'undo') undoMove(); else if (a === 'clear') clearAll(); else if (a === 'hint') hint();
    }
    function roving(i) {
      for (var k = 0; k < total; k++) cellEl[k].tabIndex = k === i ? 0 : -1;
    }

    grid.addEventListener('pointerdown', onDown);
    grid.addEventListener('pointermove', onMove);
    grid.addEventListener('pointerup', onUp);
    grid.addEventListener('pointercancel', onUp);
    grid.addEventListener('click', onClick);
    ctl.addEventListener('click', onCtl);

    labels();
    render();

    return {
      destroy: function () {
        stopClock(); done = true;
        timers.forEach(clearTimeout);
        grid.removeEventListener('pointerdown', onDown);
        grid.removeEventListener('pointermove', onMove);
        grid.removeEventListener('pointerup', onUp);
        grid.removeEventListener('pointercancel', onUp);
        grid.removeEventListener('click', onClick);
        ctl.removeEventListener('click', onCtl);
      },
      pause: function () {
        if (done) return;
        stopClock(); hidden = true; drag = null;
        root.classList.add('gqn--hide'); ctl.classList.add('gqn--hide');
        persist();
      },
      resume: function () {
        hidden = false;
        root.classList.remove('gqn--hide'); ctl.classList.remove('gqn--hide');
        if (!done && started) startClock();
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey || done || hidden) return false;
        var k = e.key, lk = k && k.length === 1 ? k.toLowerCase() : '';
        var dirs = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: n, ArrowUp: -n };
        if (document.documentElement.dir === 'rtl') { dirs.ArrowRight = -1; dirs.ArrowLeft = 1; }
        var i = cellEl.indexOf(document.activeElement);
        if (dirs[k] != null) {
          var to;
          if (i < 0) to = Math.floor(n / 2) * n + Math.floor(n / 2);
          else {
            var d = dirs[k], r0 = (i / n) | 0, c0 = i % n;
            if (d === 1 || d === -1) to = r0 * n + Math.max(0, Math.min(n - 1, c0 + d));
            else to = Math.max(0, Math.min(total - 1, i + d));
          }
          roving(to); cellEl[to].focus();
          return true;
        }
        if (lk === 'z' || lk === 'u' || e.code === 'KeyZ') { undoMove(); return true; }
        if (lk === 'h' || e.code === 'KeyH') { hint(); return true; }
        if (i < 0) return false;
        if (k === 'Enter' || k === ' ') { act(i); return true; }
        if (lk === 'x' || e.code === 'KeyX') { act(i, S[i] === 1 ? 0 : 1); return true; }
        if (lk === 'q' || e.code === 'KeyQ') { act(i, S[i] === 2 ? 0 : 2); return true; }
        if (k === 'Backspace' || k === 'Delete') { act(i, 0); return true; }
        return false;
      },
      lang: function () { labels(); render(); }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>ضعْ تاجاً واحداً في كلِّ صفٍّ، وفي كلِّ عمود، وفي كلِّ منطقةٍ ملوّنة.</li>' +
        '<li>لا يتلامس تاجان أبداً — ولا قطريّاً.</li>' +
        '<li>لمسةٌ واحدةٌ تضع ✕ لتستبعدَ خانة، والثانيةُ تضع تاجاً، والثالثةُ تمحو. واسحبْ إصبعَك لتضعَ ✕ على عدّة خاناتٍ دفعةً واحدة.</li>' +
        '<li>التيجانُ المتعارضة تظهر بالأحمر. ولكلِّ لغزٍ حلٌّ واحدٌ يُبلغ بالمنطق.</li>' +
        '<li><b>التلميح</b> يكشف تاجاً صحيحاً ويضيف 10 ثوانٍ إلى وقتك.</li>' +
        '<li>لوحةُ المفاتيح: الأسهمُ للتنقّل، و<kbd>Enter</kbd> أو <kbd>Space</kbd> للتبديل، و<kbd>X</kbd> للعلامة، و<kbd>Q</kbd> للتاج، و<kbd>Backspace</kbd> للمسح، و<kbd>Z</kbd> للتراجع، و<kbd>H</kbd> للتلميح، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>Place exactly one queen in every row, every column and every coloured region.</li>' +
        '<li>Two queens may never touch — not even diagonally.</li>' +
        '<li>Tap once to mark ✕ (rule a cell out), twice for a queen, a third time to clear. Drag across cells to mark many ✕ at once.</li>' +
        '<li>Clashing queens turn red. Every puzzle has exactly one solution, reachable by logic.</li>' +
        '<li><b>Hint</b> reveals one correct queen and adds 10 seconds to your time.</li>' +
        '<li>Keyboard: arrows to move, <kbd>Enter</kbd> or <kbd>Space</kbd> to cycle, <kbd>X</kbd> to mark, <kbd>Q</kbd> for a queen, <kbd>Backspace</kbd> to clear, <kbd>Z</kbd> to undo, <kbd>H</kbd> for a hint, <kbd>P</kbd> to pause.</li></ul>';
  }

  window.GardenGames.register('queens', {
    mount: mount,
    help: help,
    logic: { generate: generate, solve: solve, logical: logical, placeQueens: placeQueens, grow: grow, validRegions: validRegions, clashes: clashes, solved: solved, grade: grade, clock: clock, SIZES: SIZES, PENALTY: PENALTY }
  });
})();
