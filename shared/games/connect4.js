;(function () {
  'use strict';

  var W = 7, H = 6, N = 42, WIN = 1000000, DELAY = 350;
  var ORDER = [3, 2, 4, 1, 5, 0, 6];
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var ABORT = { abort: true };
  var LINES = (function () {
    var out = [];
    for (var c = 0; c < W; c++) {
      for (var r = 0; r < H; r++) {
        for (var d = 0; d < 4; d++) {
          var dc = DIRS[d][0], dr = DIRS[d][1];
          var ec = c + 3 * dc, er = r + 3 * dr;
          if (ec < 0 || ec >= W || er < 0 || er >= H) continue;
          for (var k = 0; k < 4; k++) out.push((c + k * dc) * H + (r + k * dr));
        }
      }
    }
    return out;
  })();

  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function at(c, r) { return c * H + r; }
  function newGame() { return { b: new Int8Array(N), h: new Int8Array(W), n: 0 }; }
  function clone(g) { return { b: new Int8Array(g.b), h: new Int8Array(g.h), n: g.n }; }
  function play(g, c, p) { var i = c * H + g.h[c]; g.b[i] = p; g.h[c]++; g.n++; return i; }
  function unplay(g, c) { g.h[c]--; g.b[c * H + g.h[c]] = 0; g.n--; }
  function legal(g) { return ORDER.filter(function (c) { return g.h[c] < H; }); }

  function run(g, c, r, dc, dr, p) {
    var k = 0;
    c += dc; r += dr;
    while (c >= 0 && c < W && r >= 0 && r < H && g.b[c * H + r] === p) { k++; c += dc; r += dr; }
    return k;
  }
  function wouldWin(g, c, p) {
    var r = g.h[c];
    if (r >= H) return false;
    for (var d = 0; d < 4; d++) {
      var dc = DIRS[d][0], dr = DIRS[d][1];
      if (1 + run(g, c, r, dc, dr, p) + run(g, c, r, -dc, -dr, p) >= 4) return true;
    }
    return false;
  }
  function winsAt(g, i) {
    var p = g.b[i];
    if (!p) return false;
    var c = (i / H) | 0, r = i % H;
    for (var d = 0; d < 4; d++) {
      var dc = DIRS[d][0], dr = DIRS[d][1];
      if (1 + run(g, c, r, dc, dr, p) + run(g, c, r, -dc, -dr, p) >= 4) return true;
    }
    return false;
  }
  function lineCells(g, i) {
    var p = g.b[i], out = [];
    if (!p) return out;
    var c = (i / H) | 0, r = i % H;
    for (var d = 0; d < 4; d++) {
      var dc = DIRS[d][0], dr = DIRS[d][1];
      var a = run(g, c, r, dc, dr, p), b = run(g, c, r, -dc, -dr, p);
      if (1 + a + b < 4) continue;
      for (var k = -b; k <= a; k++) {
        var x = at(c + k * dc, r + k * dr);
        if (out.indexOf(x) < 0) out.push(x);
      }
    }
    return out.sort(function (x, y) { return x - y; });
  }
  function winner(g) {
    var p = 0, cells = [];
    for (var l = 0; l < LINES.length; l += 4) {
      var v = g.b[LINES[l]];
      if (v && v === g.b[LINES[l + 1]] && v === g.b[LINES[l + 2]] && v === g.b[LINES[l + 3]]) {
        p = p || v;
        for (var k = 0; k < 4; k++) if (cells.indexOf(LINES[l + k]) < 0) cells.push(LINES[l + k]);
      }
    }
    return p ? { p: p, cells: cells.sort(function (x, y) { return x - y; }) } : null;
  }
  function replay(moves) {
    if (!Array.isArray(moves) || moves.length > N) return null;
    var g = newGame(), over = null, last = -1;
    for (var k = 0; k < moves.length; k++) {
      var c = moves[k];
      if (over || typeof c !== 'number' || c !== (c | 0) || c < 0 || c >= W || g.h[c] >= H) return null;
      last = play(g, c, k % 2 ? 2 : 1);
      if (winsAt(g, last)) over = { p: g.b[last], cells: lineCells(g, last) };
      else if (g.n === N) over = { p: 0, cells: [] };
    }
    return { g: g, over: over, last: last };
  }
  function immediateWins(g, p) { return ORDER.filter(function (c) { return wouldWin(g, c, p); }); }

  function evaluate(g, p) {
    var b = g.b, o = 3 - p, s = 0;
    for (var r = 0; r < H; r++) { var v = b[3 * H + r]; if (v === p) s += 3; else if (v === o) s -= 3; }
    for (var l = 0; l < LINES.length; l += 4) {
      var a = 0, e = 0, hole = -1;
      for (var k = 0; k < 4; k++) { var x = b[LINES[l + k]]; if (x === p) a++; else if (x === o) e++; else hole = LINES[l + k]; }
      if (e === 0) { if (a === 3) s += threat(g, hole, p); else if (a === 2) s += 2; }
      else if (a === 0) { if (e === 3) s -= threat(g, hole, o); else if (e === 2) s -= 2; }
    }
    return s;
  }
  function threat(g, i, q) {
    var r = i % H;
    if (r === g.h[(i / H) | 0]) return 5;
    return (r % 2 === 0) === (q === 1) ? 10 : 4;
  }

  function negamax(g, depth, alpha, beta, p, ply, S) {
    S.nodes++;
    if (S.deadline && (S.nodes & 1023) === 0 && now() > S.deadline) throw ABORT;
    var o = 3 - p, c, k;
    for (k = 0; k < W; k++) if (wouldWin(g, ORDER[k], p)) return WIN - ply;
    if (g.n >= N - 1) return 0;
    if (depth <= 0) return evaluate(g, p);
    var forced = -1, threats = 0;
    for (k = 0; k < W; k++) { c = ORDER[k]; if (wouldWin(g, c, o)) { threats++; forced = c; } }
    if (threats > 1) return -(WIN - ply - 1);
    var best = -Infinity;
    for (k = 0; k < W; k++) {
      c = forced >= 0 ? forced : ORDER[k];
      if (g.h[c] < H) {
        play(g, c, p);
        var v = -negamax(g, depth - 1, -beta, -alpha, o, ply + 1, S);
        unplay(g, c);
        if (v > best) best = v;
        if (v > alpha) alpha = v;
        if (alpha >= beta) break;
      }
      if (forced >= 0) break;
    }
    return best === -Infinity ? 0 : best;
  }
  function rootSearch(g, p, depth, S, order, exact) {
    var best = -Infinity, move = -1, alpha = -Infinity, scores = {};
    for (var k = 0; k < order.length; k++) {
      var c = order[k], v;
      if (g.h[c] >= H) continue;
      if (wouldWin(g, c, p)) v = WIN;
      else {
        play(g, c, p);
        v = g.n === N ? 0 : -negamax(g, depth - 1, -Infinity, exact ? Infinity : -alpha, 3 - p, 1, S);
        unplay(g, c);
      }
      scores[c] = v;
      if (v > best) { best = v; move = c; }
      if (!exact && v > alpha) alpha = v;
    }
    return { move: move, score: best, scores: scores };
  }

  function chooseEasy(g0, p, rng) {
    var g = clone(g0), moves = legal(g);
    if (!moves.length) return -1;
    var w = immediateWins(g, p);
    if (w.length) return w[Math.floor(rng() * w.length)];
    var th = immediateWins(g, 3 - p);
    if (th.length && rng() < 0.5) return th[Math.floor(rng() * th.length)];
    var safe = moves.filter(function (c) {
      play(g, c, p);
      var bad = wouldWin(g, c, 3 - p);
      unplay(g, c);
      return !bad;
    });
    var pool = (safe.length && rng() >= 0.2) ? safe : moves;
    return pool[Math.floor(rng() * pool.length)];
  }
  function chooseMedium(g0, p, rng) {
    var g = clone(g0), moves = legal(g);
    if (!moves.length) return -1;
    var w = immediateWins(g, p);
    if (w.length) return w[0];
    var th = immediateWins(g, 3 - p);
    if (th.length) return th[0];
    var res = rootSearch(g, p, 4, { nodes: 0, deadline: 0 }, moves, true);
    var top = moves.filter(function (c) { return res.scores[c] === res.score; });
    return top[Math.floor(rng() * top.length)];
  }
  function chooseHard(g0, p, opts) {
    opts = opts || {};
    var g = clone(g0), order = legal(g);
    var ms = opts.ms == null ? 250 : opts.ms, maxD = opts.depth || 12;
    var info = opts.stats || {};
    info.depth = 0; info.nodes = 0;
    if (!order.length) return -1;
    var w = immediateWins(g, p);
    if (w.length) return w[0];
    var th = immediateWins(g, 3 - p);
    if (th.length) return th[0];
    if (order.length === 1) return order[0];
    var S = { nodes: 0, deadline: ms > 0 ? now() + ms : 0 }, move = order[0];
    for (var d = 1; d <= maxD && d <= N - g.n; d++) {
      var res;
      try { res = rootSearch(g, p, d, S, order, false); }
      catch (e) { if (e !== ABORT) throw e; break; }
      move = res.move; info.depth = d;
      order = [move].concat(order.filter(function (c) { return c !== move; }));
      if (res.score >= WIN - 64 || res.score <= -(WIN - 64)) break;
    }
    info.nodes = S.nodes;
    return move;
  }
  function choose(level, g, p, rng, opts) {
    if (level === 'easy') return chooseEasy(g, p, rng);
    if (level === 'medium') return chooseMedium(g, p, rng);
    return chooseHard(g, p, opts);
  }

  function mount(ctx) {
    var t = ctx.t;
    var lv = ctx.level === 'easy' || ctx.level === 'medium' ? ctx.level : 'hard';
    var reduced = !!ctx.reduced;
    var g = newGame(), moves = [], undos = 0, over = null;
    var thinking = false, finished = false, paused = false, dead = false;
    var pendingAI = null, pendingEnd = false;
    var aiTimer = 0, endTimer = 0, markTimer = 0, noTimer = 0;
    var cursor = 3, hoverCol = -1, pressCol = -1, kb = false, press = null, lastDur = 0, said = '';

    var saved = ctx.load();
    if (saved && saved.v === 1) {
      var rp = replay(saved.m);
      if (rp && !rp.over) { moves = saved.m.slice(); g = rp.g; undos = saved.u | 0; }
      else ctx.clearSave();
    }

    var root = document.createElement('div');
    root.className = 'gc4' + (reduced ? ' gc4--still' : '');
    var cellsHTML = '';
    for (var rt = 0; rt < H; rt++) for (var cc = 0; cc < W; cc++) cellsHTML += '<span class="gc4-cell" data-i="' + at(cc, H - 1 - rt) + '"></span>';
    root.innerHTML = '<div class="gc4-board" tabindex="0" role="application">' +
        '<div class="gc4-top" aria-hidden="true"><div class="gc4-top-in"><span class="gc4-ghost"></span></div></div>' +
        '<div class="gc4-frame"><div class="gc4-grid" aria-hidden="true"><span class="gc4-col"></span>' + cellsHTML + '</div></div>' +
      '</div>' +
      '<p class="gc4-tip"></p>';
    ctx.board.appendChild(root);
    var board = root.querySelector('.gc4-board');
    var grid = root.querySelector('.gc4-grid');
    var tip = root.querySelector('.gc4-tip');
    var cellEls = [];
    [].forEach.call(grid.querySelectorAll('.gc4-cell'), function (el) { cellEls[Number(el.getAttribute('data-i'))] = el; });

    ctx.controls.innerHTML = '<div class="gc4-acts"><button type="button" class="gsf-btn gc4-undo"></button></div>';
    var undoBtn = ctx.controls.querySelector('.gc4-undo');

    function playerMoves() { return Math.ceil(moves.length / 2); }
    function myTurn() { return !over && moves.length % 2 === 0; }
    function canAct() { return !dead && !over && !thinking && !finished && !paused && moves.length % 2 === 0; }

    function texts() {
      board.setAttribute('aria-label', t('لوحةُ أربعةٍ في صفّ — اخترْ عموداً بالسهمين ثمّ Enter، أو اضغطْ رقمَه من 1 إلى 7', 'Connect Four board — choose a column with the arrow keys then Enter, or press its number 1 to 7'));
      tip.innerHTML = '<span class="gc4-tip-t">' + t('المسْ أيَّ مكانٍ في العمود لتُسقط قرصَك فيه.', 'Tap anywhere in a column to drop your disc.') + '</span>' +
        '<span class="gc4-tip-k">' + t('انقرْ عموداً، أو اخترْه بـ<kbd>←</kbd> <kbd>→</kbd> ثمّ <kbd>Enter</kbd>، أو اضغطْ <kbd>1</kbd>–<kbd>7</kbd>.', 'Click a column, or pick one with <kbd>←</kbd> <kbd>→</kbd> then <kbd>Enter</kbd>, or press <kbd>1</kbd>–<kbd>7</kbd>.') + '</span>';
    }

    function paint() {
      var yours = myTurn() && !thinking;
      var you = '<span class="gm-stat gc4-who gc4-p1' + (yours || (over && over.p === 1) ? ' on' : '') + '"><i class="gc4-sw" aria-hidden="true"></i><small>' + t('أنت', 'You') + '</small>' +
        (over ? (over.p === 1 ? '<b>' + t('فزت!', 'Won!') + '</b>' : over.p === 0 ? '<b>' + t('تعادل', 'Draw') + '</b>' : '') : yours ? '<b>' + t('دورُك', 'Your turn') + '</b>' : '') + '</span>';
      var cpu = '<span class="gm-stat gc4-who gc4-p2' + (thinking || (over && over.p === 2) ? ' on' : '') + '"><i class="gc4-sw" aria-hidden="true"></i><small>' + t('الحاسوب', 'Computer') + '</small>' +
        (over && over.p === 2 ? '<b>' + t('فاز', 'Won') + '</b>' : thinking ? '<b>' + t('يفكّر', 'Thinking') + '<span class="gc4-dots" aria-hidden="true"><i></i><i></i><i></i></span></b>' : '') + '</span>';
      var mv = '<span class="gm-stat"><small>' + t('حركاتُك', 'Your moves') + '</small><b>' + ctx.fmt('moves', playerMoves()) + '</b></span>';
      ctx.status(you + cpu + mv + '<span class="gc4-sr">' + said + '</span>');
      var can = !over && !thinking && !finished && moves.length >= 2 && moves.length % 2 === 0;
      undoBtn.disabled = !can;
      undoBtn.innerHTML = '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> <span>' + t('تراجع', 'Undo') + '</span>';
      undoBtn.setAttribute('aria-label', t('تراجعْ عن حركتك الأخيرة وردِّ الحاسوب', 'Undo your last move and the computer’s reply'));
    }

    function ghostCol() {
      if (!myTurn() || thinking || finished) return -1;
      if (pressCol >= 0) return pressCol;
      if (hoverCol >= 0) return hoverCol;
      return kb ? cursor : -1;
    }
    function updateGhost() {
      var c = ghostCol();
      if (c >= 0) root.style.setProperty('--gc', c);
      root.classList.toggle('gc4--aim', c >= 0);
      root.classList.toggle('gc4--full', c >= 0 && g.h[c] >= H);
      root.classList.toggle('gc4--wait', thinking);
    }

    function discEl(i, p, animate) {
      var cell = cellEls[i];
      cell.innerHTML = '';
      var d = document.createElement('span');
      d.className = 'gc4-d gc4-p' + p;
      if (animate && !reduced) {
        var f = (H - 1 - (i % H)) + 1;
        lastDur = Math.round(120 * Math.sqrt(f) + 110);
        d.style.setProperty('--f', f);
        d.style.animationDuration = lastDur + 'ms';
        d.classList.add('gc4-drop');
      } else lastDur = 0;
      cell.appendChild(d);
      return d;
    }
    function markLast() {
      [].forEach.call(grid.querySelectorAll('.gc4-last'), function (el) { el.classList.remove('gc4-last'); });
      if (!moves.length) return;
      var c = moves[moves.length - 1];
      var el = cellEls[at(c, g.h[c] - 1)].firstChild;
      if (el) el.classList.add('gc4-last');
    }
    function renderAll() {
      for (var i = 0; i < N; i++) {
        if (g.b[i]) discEl(i, g.b[i], false);
        else cellEls[i].innerHTML = '';
      }
      lastDur = 0;
      markLast();
    }

    function persist() {
      if (over || finished) return;
      if (moves.length) ctx.save({ v: 1, m: moves.slice(), u: undos });
      else ctx.clearSave();
    }

    function nudge(c) {
      root.style.setProperty('--gc', c);
      root.classList.remove('gc4--no'); void root.offsetWidth; root.classList.add('gc4--no');
      clearTimeout(noTimer);
      noTimer = setTimeout(function () { root.classList.remove('gc4--no'); }, 320);
    }

    function place(c, p) {
      var i = play(g, c, p);
      moves.push(c);
      discEl(i, p, true);
      markLast();
      ctx.sound('tap'); ctx.haptic(8);
      if (winsAt(g, i)) { over = { p: p, cells: lineCells(g, i) }; endGame(); return; }
      if (g.n === N) { over = { p: 0, cells: [] }; endGame(); return; }
      persist();
      if (p === 1) scheduleAI();
      else { updateGhost(); paint(); }
    }

    function drop(c) {
      if (c < 0 || c >= W) return;
      if (!canAct()) return;
      cursor = c;
      if (g.h[c] >= H) { ctx.sound('bad'); ctx.haptic(20); nudge(c); return; }
      said = '';
      place(c, 1);
    }

    function scheduleAI() {
      thinking = true;
      updateGhost(); paint();
      var t0 = now();
      aiTimer = setTimeout(function () {
        aiTimer = 0;
        if (dead) return;
        var c = choose(lv, g, 2, ctx.rng, {});
        var wait = Math.max(0, DELAY - (now() - t0));
        aiTimer = setTimeout(function () { aiTimer = 0; aiPlay(c); }, wait);
      }, Math.min(lastDur, 220));
    }
    function aiPlay(c) {
      if (dead) return;
      if (paused) { pendingAI = c; return; }
      thinking = false;
      said = t('لعب الحاسوبُ في العمود ', 'The computer played column ') + (c + 1);
      place(c, 2);
    }

    function endGame() {
      thinking = false;
      ctx.clearSave();
      root.classList.add('gc4--over');
      updateGhost(); paint();
      ctx.haptic(over.p === 1 ? 30 : 15);
      var land = reduced ? 0 : lastDur;
      markTimer = setTimeout(function () {
        markTimer = 0;
        if (dead || !over.p) return;
        over.cells.forEach(function (i) { var el = cellEls[i].firstChild; if (el) el.classList.add('gc4-w'); });
        root.classList.add('gc4--won');
        if (over.p === 1) ctx.sound('good');
      }, land);
      endTimer = setTimeout(doFinish, land + 900);
    }
    function doFinish() {
      endTimer = 0;
      if (dead || finished) return;
      if (paused) { pendingEnd = true; return; }
      finished = true;
      paint();
      var lvName = lv === 'easy' ? t('سهل', 'Easy') : lv === 'medium' ? t('متوسّط', 'Medium') : t('صعب', 'Hard');
      var extra = undos ? ' · ' + t('تراجعات: ', 'Undos: ') + undos : '';
      if (over.p === 1) {
        ctx.finish({ won: true, score: playerMoves(), unit: t('حركة', 'moves'), title: t('فزتَ!', 'You won!'),
          detail: t('غلبتَ الحاسوبَ في مستوى «', 'You beat the computer on ') + lvName + t('»', '') + extra });
      } else if (over.p === 2) {
        ctx.finish({ won: false, title: t('فاز الحاسوب', 'The computer won'),
          detail: t('راقبْ خطوطَه القطريّة، وسُدَّ كلَّ ثلاثةٍ قبل أن تكتمل.', 'Watch its diagonals, and block every three before it becomes four.') });
      } else {
        ctx.finish({ won: false, title: t('تعادل', 'Draw'), detail: t('امتلأت اللوحةُ ولم يصلْ أحدٌ إلى أربعة.', 'The board filled up and nobody made four.') });
      }
    }

    function undo() {
      if (dead || over || thinking || finished || paused || moves.length < 2 || moves.length % 2) return;
      moves.splice(moves.length - 2, 2);
      g = replay(moves).g;
      undos++;
      said = '';
      renderAll();
      ctx.sound('tap');
      persist();
      updateGhost(); paint();
    }

    function colAt(x) {
      var r = grid.getBoundingClientRect();
      if (!r.width) return -1;
      var c = Math.floor((x - r.left) / r.width * W);
      return c < 0 ? 0 : c >= W ? W - 1 : c;
    }
    function onDown(e) {
      if (e.button > 0) return;
      if (e.pointerType !== 'mouse') kb = false;
      press = { id: e.pointerId, type: e.pointerType };
      pressCol = colAt(e.clientX);
      if (e.pointerType === 'mouse') hoverCol = pressCol;
      try { board.setPointerCapture(e.pointerId); } catch (er) {}
      updateGhost();
    }
    function onMove(e) {
      if (e.pointerType === 'mouse') hoverCol = colAt(e.clientX);
      if (press && press.id === e.pointerId) pressCol = colAt(e.clientX);
      updateGhost();
    }
    function onUp(e) {
      if (!press || press.id !== e.pointerId) return;
      press = null; pressCol = -1;
      var r = board.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 24 && e.clientY <= r.bottom + 24;
      if (e.pointerType === 'mouse') hoverCol = inside ? colAt(e.clientX) : -1;
      updateGhost();
      if (inside) drop(colAt(e.clientX));
    }
    function onCancel() { press = null; pressCol = -1; updateGhost(); }
    function onLeave(e) { if (e.pointerType === 'mouse' && !press) { hoverCol = -1; updateGhost(); } }
    function onMenu(e) { e.preventDefault(); }
    function onFocus() {
      var fv = false;
      try { fv = board.matches(':focus-visible'); } catch (er) {}
      if (fv) { kb = true; updateGhost(); }
    }
    function onBlur() { kb = false; updateGhost(); }

    board.addEventListener('pointerdown', onDown);
    board.addEventListener('pointermove', onMove);
    board.addEventListener('pointerup', onUp);
    board.addEventListener('pointercancel', onCancel);
    board.addEventListener('pointerleave', onLeave);
    board.addEventListener('contextmenu', onMenu);
    board.addEventListener('focus', onFocus);
    board.addEventListener('blur', onBlur);

    function onUndo() { undo(); }
    undoBtn.addEventListener('click', onUndo);

    texts();
    renderAll();
    updateGhost();
    paint();
    if (moves.length % 2) scheduleAI();

    return {
      destroy: function () {
        dead = true;
        clearTimeout(aiTimer); clearTimeout(endTimer); clearTimeout(markTimer); clearTimeout(noTimer);
        board.removeEventListener('pointerdown', onDown);
        board.removeEventListener('pointermove', onMove);
        board.removeEventListener('pointerup', onUp);
        board.removeEventListener('pointercancel', onCancel);
        board.removeEventListener('pointerleave', onLeave);
        board.removeEventListener('contextmenu', onMenu);
        board.removeEventListener('focus', onFocus);
        board.removeEventListener('blur', onBlur);
        undoBtn.removeEventListener('click', onUndo);
      },
      pause: function () { paused = true; press = null; pressCol = -1; },
      resume: function () {
        paused = false;
        if (pendingAI != null) { var c = pendingAI; pendingAI = null; aiPlay(c); }
        if (pendingEnd) { pendingEnd = false; endTimer = setTimeout(doFinish, 350); }
        updateGhost();
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        var k = e.key;
        if (k === 'ArrowLeft' || k === 'ArrowRight') {
          kb = true; hoverCol = -1;
          cursor = Math.max(0, Math.min(W - 1, cursor + (k === 'ArrowRight' ? 1 : -1)));
          updateGhost();
          return true;
        }
        if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
          var ae = document.activeElement;
          if (ae && ae !== board && (ae.tagName === 'BUTTON' || ae.tagName === 'A')) return false;
          kb = true; drop(cursor); updateGhost();
          return true;
        }
        if (k === 'ArrowDown') { kb = true; drop(cursor); updateGhost(); return true; }
        if (/^[1-7]$/.test(k)) { kb = true; hoverCol = -1; drop(Number(k) - 1); updateGhost(); return true; }
        if (k === 'u' || k === 'U') { undo(); return true; }
        return false;
      },
      lang: function () {
        if (said && moves.length) said = t('لعب الحاسوبُ في العمود ', 'The computer played column ') + (moves[moves.length - 1] + 1);
        texts(); paint();
      }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>أقراصُك <b>حمراء</b> وتبدأ أنت، وأقراصُ الحاسوب <b>زرقاء</b>.</li>' +
        '<li>في كلِّ دورٍ تُسقط قرصاً واحداً في عمود، فينزل إلى أدنى خانةٍ فارغةٍ فيه.</li>' +
        '<li>يفوز أوّلُ من يصل أربعةً من أقراصه في خطٍّ واحد: أفقيّاً أو عموديّاً أو قطريّاً.</li>' +
        '<li>إن امتلأت اللوحةُ كلُّها بلا أربعة فهي تعادل.</li>' +
        '<li>باللمس أو الفأرة: المسْ أيَّ مكانٍ في العمود. ويمكنك أن تُبقي إصبعَك وتحرّكه لتختار، ثمّ ترفعه.</li>' +
        '<li>لوحةُ المفاتيح: <kbd>←</kbd> <kbd>→</kbd> لاختيار العمود، و<kbd>Enter</kbd> أو <kbd>Space</kbd> أو <kbd>↓</kbd> للإسقاط، أو الأرقام <kbd>1</kbd>–<kbd>7</kbd> من اليسار إلى اليمين. <kbd>U</kbd> للتراجع و<kbd>P</kbd> للإيقاف.</li>' +
        '<li>«تراجع» يلغي حركتَك الأخيرة وردَّ الحاسوب عليها.</li>' +
        '<li>نتيجتُك عددُ حركاتك حتى الفوز — الأقلُّ أفضل.</li></ul>'
      : '<ul><li>Your discs are <b>red</b> and you move first; the computer’s are <b>blue</b>.</li>' +
        '<li>On each turn drop one disc into a column — it falls to the lowest empty space.</li>' +
        '<li>The first to line up four of their discs wins: across, down or diagonally.</li>' +
        '<li>If the whole board fills up without four, it’s a draw.</li>' +
        '<li>Touch or mouse: tap anywhere in a column. You can also hold your finger down, slide to choose, then lift.</li>' +
        '<li>Keyboard: <kbd>←</kbd> <kbd>→</kbd> to choose a column, <kbd>Enter</kbd>, <kbd>Space</kbd> or <kbd>↓</kbd> to drop, or the numbers <kbd>1</kbd>–<kbd>7</kbd> from left to right. <kbd>U</kbd> to undo, <kbd>P</kbd> to pause.</li>' +
        '<li>Undo takes back your last move and the computer’s reply.</li>' +
        '<li>Your score is the number of moves you needed to win — fewer is better.</li></ul>';
  }

  window.GardenGames.register('connect4', {
    mount: mount, help: help,
    _t: { W: W, H: H, N: N, WIN: WIN, LINES: LINES, ORDER: ORDER, at: at, newGame: newGame, clone: clone, play: play, unplay: unplay,
      wouldWin: wouldWin, winsAt: winsAt, lineCells: lineCells, winner: winner, replay: replay, immediateWins: immediateWins,
      evaluate: evaluate, chooseEasy: chooseEasy, chooseMedium: chooseMedium, chooseHard: chooseHard, choose: choose }
  });
})();
