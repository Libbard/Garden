;(function () {
  'use strict';

  var MAX_UNDO = 3;
  var SLIDE_MS = 110;

  function lines(n, dir) {
    var out = [];
    for (var k = 0; k < n; k++) {
      var idx = [];
      for (var j = 0; j < n; j++) {
        var p = (dir === 'right' || dir === 'down') ? n - 1 - j : j;
        idx.push(dir === 'left' || dir === 'right' ? k * n + p : p * n + k);
      }
      out.push(idx);
    }
    return out;
  }

  function slide(items) {
    var out = [], i = 0;
    while (i < items.length) {
      if (i + 1 < items.length && items[i].v === items[i + 1].v) { out.push({ v: items[i].v * 2, src: [items[i], items[i + 1]] }); i += 2; }
      else { out.push({ v: items[i].v, src: [items[i]] }); i++; }
    }
    return out;
  }

  function slideValues(arr) {
    var out = slide(arr.filter(Boolean).map(function (v) { return { v: v }; }));
    var vals = out.map(function (o) { return o.v; }), gained = 0;
    out.forEach(function (o) { if (o.src.length > 1) gained += o.v; });
    while (vals.length < arr.length) vals.push(0);
    return { out: vals, gained: gained };
  }

  function move(cells, n, dir, mk) {
    var next = [], ghosts = [], merged = [], gained = 0, moved = false;
    for (var i = 0; i < n * n; i++) next.push(null);
    lines(n, dir).forEach(function (idx) {
      var items = [];
      idx.forEach(function (p) { if (cells[p]) items.push(cells[p]); });
      slide(items).forEach(function (o, j) {
        var to = idx[j];
        if (o.src.length === 1) {
          next[to] = o.src[0];
          if (cells[to] !== o.src[0]) moved = true;
        } else {
          var tile = mk(o.v);
          next[to] = tile; merged.push(tile); gained += o.v; moved = true;
          o.src.forEach(function (s) { ghosts.push({ tile: s, to: to }); });
        }
      });
    });
    return { cells: next, moved: moved, gained: gained, ghosts: ghosts, merged: merged };
  }

  function canMove(cells, n) {
    for (var i = 0; i < n * n; i++) {
      var a = cells[i];
      if (!a) return true;
      var r = Math.floor(i / n), c = i % n;
      if (c + 1 < n && cells[i + 1] && cells[i + 1].v === a.v) return true;
      if (r + 1 < n && cells[i + n] && cells[i + n].v === a.v) return true;
    }
    return false;
  }

  function spawn(cells, rng, mk) {
    var empty = [];
    for (var i = 0; i < cells.length; i++) if (!cells[i]) empty.push(i);
    if (!empty.length) return null;
    var at = empty[Math.floor(rng() * empty.length)];
    var tile = mk(rng() < 0.9 ? 2 : 4);
    cells[at] = tile;
    return { tile: tile, at: at };
  }

  function values(cells) { return cells.map(function (x) { return x ? x.v : 0; }); }
  function highest(cells) { var m = 0; cells.forEach(function (x) { if (x && x.v > m) m = x.v; }); return m; }

  function mount(ctx) {
    var t = ctx.t;
    var n = ctx.level === '5' ? 5 : 4;
    var reduced = !!ctx.reduced;
    var uid = 0;
    function mk(v) { uid++; return { id: uid, v: v }; }

    var cells = [], score = 0, undo = [], undosLeft = MAX_UNDO, reached = false;
    var banner = false, done = false, paused = false, pendingEnd = false;
    var els = {}, ghostsLive = [], ghostTimer = 0, endTimer = 0, bannerTimer = 0;

    var root = document.createElement('div');
    root.className = 'g48 g48--n' + n + (reduced ? ' g48--still' : '');
    root.style.setProperty('--n', n);
    var bg = '';
    for (var i = 0; i < n * n; i++) bg += '<span class="g48-cell"></span>';
    root.innerHTML = '<div class="g48-board" tabindex="0">' +
        '<div class="g48-bg" aria-hidden="true">' + bg + '</div>' +
        '<div class="g48-layer" aria-hidden="true"></div>' +
        '<div class="g48-win" hidden></div>' +
      '</div>' +
      '<p class="g48-tip"></p>';
    ctx.board.appendChild(root);
    var board = root.querySelector('.g48-board');
    var layer = root.querySelector('.g48-layer');
    var win = root.querySelector('.g48-win');
    var tip = root.querySelector('.g48-tip');

    ctx.controls.innerHTML = '<div class="g48-acts"><button type="button" class="gsf-btn g48-undo"></button></div>';
    var undoBtn = ctx.controls.querySelector('.g48-undo');

    function bestShown() { var b = ctx.best(); return Math.max(b == null ? 0 : b, score); }

    function paint(gain) {
      ctx.status('<span class="gm-stat g48-sc"><small>' + t('النتيجة', 'Score') + '</small><b>' + ctx.fmt('points', score) + '</b>' +
          (gain && !reduced ? '<em class="g48-plus" aria-hidden="true">+' + gain + '</em>' : '') + '</span>' +
        '<span class="gm-stat"><small>' + t('الأفضل', 'Best') + '</small><b>' + ctx.fmt('points', bestShown()) + '</b></span>');
      var can = undosLeft > 0 && undo.length > 0 && !done;
      undoBtn.disabled = !can;
      undoBtn.innerHTML = '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> <span>' + t('تراجع', 'Undo') + '</span> <b class="g48-cnt">' + undosLeft + '</b>';
      undoBtn.setAttribute('aria-label', t('تراجعْ عن الحركة الأخيرة — متبقٍّ ', 'Undo last move — remaining ') + undosLeft);
    }

    function texts() {
      board.setAttribute('aria-label', t('لوحةُ 2048 — اسحبْ أو استعملْ الأسهم', '2048 board — swipe or use the arrow keys'));
      var keys = '<span class="g48-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span>';
      tip.innerHTML = ctx.touch ? t('اسحبْ بإصبعك على اللوحة في أيِّ اتّجاه.', 'Swipe on the board in any direction.')
        : t('استعملْ الأسهمَ أو ' + keys + ' — و<kbd>U</kbd> للتراجع.', 'Use the arrow keys or ' + keys + ' — <kbd>U</kbd> to undo.');
      if (banner) drawBanner();
    }

    function place(el, at) {
      var r = Math.floor(at / n), c = at % n;
      el.style.transform = 'translate(calc(' + c + ' * (100% + var(--gap))), calc(' + r + ' * (100% + var(--gap))))';
    }
    function tileEl(tile, kind) {
      var el = document.createElement('div');
      var d = String(tile.v).length;
      el.className = 'g48-tile' + (kind ? ' g48-' + kind : '');
      el.innerHTML = '<span class="g48-in g48-v' + (tile.v <= 2048 ? tile.v : 'x') + ' g48-d' + Math.min(d, 6) + '">' + tile.v + '</span>';
      return el;
    }
    function flush() {
      clearTimeout(ghostTimer); ghostTimer = 0;
      ghostsLive.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      ghostsLive = [];
    }
    function rebuild(kind) {
      flush();
      layer.innerHTML = ''; els = {};
      cells.forEach(function (tile, at) {
        if (!tile) return;
        var el = tileEl(tile, kind); place(el, at); layer.appendChild(el); els[tile.id] = el;
      });
    }
    function render(res, spawned) {
      flush();
      var live = {};
      res.ghosts.forEach(function (g) {
        var el = els[g.tile.id];
        if (!el) return;
        place(el, g.to); el.classList.add('g48-gone');
        ghostsLive.push(el); delete els[g.tile.id];
      });
      cells.forEach(function (tile, at) {
        if (!tile) return;
        live[tile.id] = 1;
        var el = els[tile.id];
        if (!el) {
          var kind = spawned && tile === spawned.tile ? 'new' : res.merged.indexOf(tile) >= 0 ? 'pop' : '';
          el = tileEl(tile, kind); place(el, at); layer.appendChild(el); els[tile.id] = el;
        } else place(el, at);
      });
      Object.keys(els).forEach(function (id) {
        if (!live[id]) { var el = els[id]; if (el.parentNode) el.parentNode.removeChild(el); delete els[id]; }
      });
      if (reduced) flush();
      else ghostTimer = setTimeout(flush, SLIDE_MS + 20);
    }

    function persist() {
      if (done) return;
      ctx.save({ n: n, g: values(cells), s: score, u: undo, ul: undosLeft, r: reached });
    }

    function drawBanner() {
      win.setAttribute('dir', ctx.isAr() ? 'rtl' : 'ltr');
      win.innerHTML = '<div class="g48-win-box" role="dialog" aria-labelledby="g48-win-h">' +
        '<span class="g48-win-ico"><i class="fa-solid fa-trophy" aria-hidden="true"></i></span>' +
        '<h3 id="g48-win-h">' + t('وصلتَ إلى 2048!', 'You reached 2048!') + '</h3>' +
        '<p>' + t('تابِعْ لأعلى نتيجة', 'Keep going') + '</p>' +
        '<button type="button" class="gsf-btn gsf-btn--go g48-go"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + t('تابِعْ', 'Continue') + '</button>' +
      '</div>';
    }
    function openBanner() {
      banner = true;
      drawBanner();
      win.hidden = false;
      ctx.sound('win'); ctx.haptic(40);
      var b = win.querySelector('.g48-go');
      if (b) setTimeout(function () { if (banner) b.focus({ preventScroll: true }); }, 60);
    }
    function closeBanner() {
      if (!banner) return;
      banner = false;
      win.hidden = true; win.innerHTML = '';
      board.focus({ preventScroll: true });
      if (pendingEnd) end();
    }

    function end() {
      if (done) return;
      done = true;
      ctx.clearSave();
      paint();
      var top = highest(cells);
      clearTimeout(endTimer);
      endTimer = setTimeout(function () {
        ctx.finish({ won: true, score: score, title: t('لا حركاتٍ متبقّية', 'No moves left'),
          detail: t('أعلى مربّع: ', 'Highest tile: ') + '<span class="gm-n">' + top + '</span>' });
      }, reduced ? 250 : 650);
    }

    function go(dir) {
      if (done || paused || banner) return false;
      var res = move(cells, n, dir, mk);
      if (!res.moved) { board.classList.remove('g48-bump'); void board.offsetWidth; board.classList.add('g48-bump'); return true; }
      undo.push({ g: values(cells), s: score });
      while (undo.length > Math.min(MAX_UNDO, undosLeft)) undo.shift();
      cells = res.cells;
      score += res.gained;
      var spawned = spawn(cells, ctx.rng, mk);
      render(res, spawned);
      paint(res.gained);
      if (res.gained) { ctx.sound('merge'); ctx.haptic(10); } else ctx.sound('tap');
      var hit = !reached && res.merged.some(function (x) { return x.v >= 2048; });
      if (hit) {
        reached = true;
        clearTimeout(bannerTimer);
        bannerTimer = setTimeout(openBanner, reduced ? 0 : SLIDE_MS + 180);
        banner = true;
      }
      persist();
      if (!canMove(cells, n)) { if (banner) pendingEnd = true; else end(); }
      return true;
    }

    function doUndo() {
      if (done || banner || undosLeft <= 0 || !undo.length) return;
      var snap = undo.pop();
      undosLeft--;
      cells = snap.g.map(function (v) { return v ? mk(v) : null; });
      score = snap.s;
      rebuild('fade');
      while (undo.length > undosLeft) undo.shift();
      persist();
      paint();
      ctx.sound('tap');
    }

    function fresh() {
      cells = []; for (var i = 0; i < n * n; i++) cells.push(null);
      spawn(cells, ctx.rng, mk); spawn(cells, ctx.rng, mk);
      score = 0; undo = []; undosLeft = MAX_UNDO; reached = false;
      rebuild('new');
    }
    function restore(s) {
      if (!s || s.n !== n || !Array.isArray(s.g) || s.g.length !== n * n) return false;
      cells = s.g.map(function (v) { return v > 0 ? mk(v) : null; });
      if (!cells.some(Boolean)) return false;
      score = Number(s.s) || 0;
      undosLeft = Math.max(0, Math.min(MAX_UNDO, s.ul == null ? MAX_UNDO : s.ul | 0));
      undo = Array.isArray(s.u) ? s.u.filter(function (u) { return u && Array.isArray(u.g) && u.g.length === n * n; }).slice(-undosLeft) : [];
      if (!undosLeft) undo = [];
      reached = !!s.r;
      rebuild('fade');
      return true;
    }

    if (!restore(ctx.load())) fresh();
    texts();
    paint();
    if (!canMove(cells, n)) end();

    var ptr = null;
    var DIRS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down' };
    var LETTERS = { a: 'left', d: 'right', w: 'up', s: 'down' };

    function onDown(e) {
      if (e.target.closest('.g48-win')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, fired: false };
      try { board.setPointerCapture(e.pointerId); } catch (er) {}
      if (e.pointerType !== 'mouse') e.preventDefault();
      board.focus({ preventScroll: true });
    }
    function onMove(e) {
      if (!ptr || ptr.fired || e.pointerId !== ptr.id) return;
      var dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
      var ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < 24) return;
      ptr.fired = true;
      go(ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }
    function onUp(e) {
      if (ptr && e.pointerId === ptr.id) ptr = null;
    }
    function onWinClick(e) { if (e.target.closest('.g48-go')) closeBanner(); }
    function onUndoClick() { doUndo(); }

    board.addEventListener('pointerdown', onDown);
    board.addEventListener('pointermove', onMove);
    board.addEventListener('pointerup', onUp);
    board.addEventListener('pointercancel', onUp);
    win.addEventListener('click', onWinClick);
    undoBtn.addEventListener('click', onUndoClick);

    return {
      destroy: function () {
        clearTimeout(ghostTimer); clearTimeout(endTimer); clearTimeout(bannerTimer);
        board.removeEventListener('pointerdown', onDown);
        board.removeEventListener('pointermove', onMove);
        board.removeEventListener('pointerup', onUp);
        board.removeEventListener('pointercancel', onUp);
        win.removeEventListener('click', onWinClick);
        undoBtn.removeEventListener('click', onUndoClick);
      },
      pause: function () { paused = true; ptr = null; },
      resume: function () { paused = false; },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
        var dir = DIRS[e.key] || DIRS[e.code] || LETTERS[k];
        if (banner) {
          if (e.key === 'Enter' || e.key === ' ') { if (!win.hidden) closeBanner(); return true; }
          return !!dir;
        }
        if (dir) { go(dir); return true; }
        if (k === 'u' || e.code === 'KeyU' || k === 'z' || e.key === 'Backspace') { doUndo(); return true; }
        return false;
      },
      lang: function () { texts(); paint(); }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>اسحبْ لتحريك كلِّ المربّعات معاً إلى جهةٍ واحدة.</li><li>إذا التقى مربّعان بالرقم نفسِه اندمجا في مربّعٍ واحدٍ بمجموعهما، وتُضاف قيمتُه إلى نتيجتك.</li><li>يندمج كلُّ مربّعٍ مرّةً واحدةً فقط في الحركة، ويبدأ الدمجُ من الجهة التي تتحرّك نحوها.</li><li>بعد كلِّ حركةٍ يظهر مربّعٌ جديد: 2 غالباً، و4 أحياناً.</li><li>الهدفُ 2048، ويمكنك المتابعةُ بعدها. تنتهي اللعبةُ حين لا تبقى حركة.</li><li>لك ثلاثُ محاولاتِ تراجعٍ في كلِّ لعبة.</li><li>لوحةُ المفاتيح: الأسهمُ أو <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>، و<kbd>U</kbd> للتراجع، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>Swipe to slide every tile at once in one direction.</li><li>When two tiles with the same number meet, they merge into one with their sum, and that value is added to your score.</li><li>Each tile merges only once per move, and merging starts from the side you move towards.</li><li>A new tile appears after every move: usually 2, sometimes 4.</li><li>The goal is 2048 — and you can keep going after it. The game ends when no move is left.</li><li>You get three undos per game.</li><li>Keyboard: arrows or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>, <kbd>U</kbd> to undo, <kbd>P</kbd> to pause.</li></ul>';
  }

  window.GardenGames.register('g2048', {
    mount: mount, help: help,
    _t: { slide: slideValues, move: move, canMove: canMove, spawn: spawn, lines: lines, values: values, highest: highest }
  });
})();
