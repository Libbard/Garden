;(function () {
  'use strict';

  var RANGE = { easy: [40, 44], medium: [32, 35], hard: [28, 31], expert: [24, 27] };
  var LV = { easy: ['سهل', 'Easy'], medium: ['متوسّط', 'Medium'], hard: ['صعب', 'Hard'], expert: ['خبير', 'Expert'] };
  var ROW = [], COL = [], BOX = [], PEERS = [], UNITS = [], POP = new Uint8Array(512);
  var i0, j0;
  for (i0 = 1; i0 < 512; i0++) POP[i0] = POP[i0 >> 1] + (i0 & 1);
  for (i0 = 0; i0 < 81; i0++) { ROW[i0] = (i0 / 9) | 0; COL[i0] = i0 % 9; BOX[i0] = ((ROW[i0] / 3) | 0) * 3 + ((COL[i0] / 3) | 0); }
  for (i0 = 0; i0 < 27; i0++) UNITS.push([]);
  for (i0 = 0; i0 < 81; i0++) {
    UNITS[ROW[i0]].push(i0); UNITS[9 + COL[i0]].push(i0); UNITS[18 + BOX[i0]].push(i0);
    var pr = [];
    for (j0 = 0; j0 < 81; j0++) if (j0 !== i0 && (ROW[j0] === ROW[i0] || COL[j0] === COL[i0] || BOX[j0] === BOX[i0])) pr.push(j0);
    PEERS[i0] = pr;
  }

  function zeros() { var a = []; for (var i = 0; i < 81; i++) a.push(0); return a; }
  function shuffle(a, rnd) { for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(rnd() * (i + 1)); var x = a[i]; a[i] = a[k]; a[k] = x; } return a; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function clock(ms) {
    var s = Math.floor(Math.max(0, ms) / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
    return (h ? h + ':' + pad2(m) : m) + ':' + pad2(s % 60);
  }

  function search(g, limit, rnd) {
    var rows = [0, 0, 0, 0, 0, 0, 0, 0, 0], cols = rows.slice(), boxes = rows.slice();
    var cells = g.slice(), empty = [], found = 0, sol = null, i, v, b;
    for (i = 0; i < 81; i++) {
      v = cells[i];
      if (!v) { empty.push(i); continue; }
      b = 1 << (v - 1);
      if ((rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & b) return { count: 0, sol: null };
      rows[ROW[i]] |= b; cols[COL[i]] |= b; boxes[BOX[i]] |= b;
    }
    var n = empty.length;
    function rec(k) {
      if (k === n) { found++; if (!sol) sol = cells.slice(); return; }
      var bi = k, bc = 10, bm = 0, j, c, m, pc, x;
      for (j = k; j < n; j++) {
        c = empty[j]; m = ~(rows[ROW[c]] | cols[COL[c]] | boxes[BOX[c]]) & 511; pc = POP[m];
        if (pc < bc) { bc = pc; bi = j; bm = m; if (pc < 2) break; }
      }
      if (!bc) return;
      var cell = empty[bi]; empty[bi] = empty[k]; empty[k] = cell;
      var r = ROW[cell], co = COL[cell], bx = BOX[cell], opts = [];
      while (bm) { x = bm & -bm; bm ^= x; opts.push(x); }
      if (rnd) shuffle(opts, rnd);
      for (j = 0; j < opts.length && found < limit; j++) {
        x = opts[j];
        rows[r] |= x; cols[co] |= x; boxes[bx] |= x; cells[cell] = 32 - Math.clz32(x);
        rec(k + 1);
        rows[r] ^= x; cols[co] ^= x; boxes[bx] ^= x;
      }
      cells[cell] = 0;
    }
    rec(0);
    return { count: found, sol: sol };
  }

  function generate(level, rnd) {
    var R = RANGE[level] || RANGE.easy, best = null, blank = zeros();
    for (var tries = 0; tries < 40; tries++) {
      var full = search(blank, 1, rnd).sol;
      for (var pass = 0; pass < 3; pass++) {
        var target = R[0] + Math.floor(rnd() * (R[1] - R[0] + 1));
        var g = full.slice(), clues = 81, order = [];
        for (var q = 0; q < 81; q++) order.push(q);
        shuffle(order, rnd);
        for (var k = 0; k < 81 && clues > target; k++) {
          var c = order[k], v = g[c];
          g[c] = 0;
          if (search(g, 2).count === 1) clues--; else g[c] = v;
        }
        if (!best || clues < best.clues) best = { puzzle: g, solution: full, clues: clues };
        if (clues <= R[1]) return { puzzle: g, solution: full, clues: clues };
      }
    }
    return best;
  }

  function validGrid(s) {
    for (var u = 0; u < 27; u++) {
      var m = 0;
      for (var k = 0; k < 9; k++) m |= 1 << (s[UNITS[u][k]] - 1);
      if (m !== 511) return false;
    }
    return true;
  }
  function digits(s) {
    if (typeof s !== 'string' || s.length !== 81 || !/^[0-9]+$/.test(s)) return null;
    var a = [];
    for (var i = 0; i < 81; i++) a.push(s.charCodeAt(i) - 48);
    return a;
  }
  function validRec(r) {
    return Array.isArray(r) && r.length > 0 && r.every(function (x) {
      return Array.isArray(x) && x.length === 3 && x[0] >= 0 && x[0] < 81 && x[1] >= 0 && x[1] <= 9 && x[2] >= 0 && x[2] < 512;
    });
  }

  function mount(ctx) {
    var t = ctx.t;
    var level = RANGE[ctx.level] ? ctx.level : 'easy';
    var P, SOL, E, N, H, undo, mis, hints, acc, sel, nm;
    var focusD = 0, running = false, startAt = 0, done = false, tick = 0, timers = [], lastTime = '', lastSave = 0;

    if (!restore(ctx.load())) fresh();

    function fresh() {
      var g = generate(level, ctx.rng);
      P = g.puzzle.slice(); SOL = g.solution.slice();
      E = zeros(); N = zeros(); H = zeros(); undo = [];
      mis = 0; hints = 0; acc = 0; sel = -1; nm = false;
    }
    function restore(st) {
      try {
        if (!st || st.v !== 1) return false;
        var p = digits(st.p), s = digits(st.s), e = digits(st.e), h = digits(st.h);
        if (!p || !s || !e || !h || !Array.isArray(st.n) || st.n.length !== 81 || !validGrid(s)) return false;
        var full = true;
        for (var i = 0; i < 81; i++) {
          if (p[i] && (p[i] !== s[i] || e[i])) return false;
          if (h[i] && e[i] !== s[i]) return false;
          if ((p[i] || e[i]) !== s[i]) full = false;
        }
        if (full) return false;
        P = p; SOL = s; E = e; H = h.map(function (x) { return x ? 1 : 0; });
        N = st.n.map(function (x) { return (x | 0) & 511; });
        undo = Array.isArray(st.u) ? st.u.filter(validRec).slice(-200) : [];
        mis = Math.max(0, st.mis | 0); hints = Math.max(0, st.hints | 0); acc = Math.max(0, +st.t || 0);
        sel = (typeof st.sel === 'number' && st.sel >= 0 && st.sel < 81) ? st.sel | 0 : -1;
        nm = !!st.nm;
        return true;
      } catch (er) { return false; }
    }
    function persist() {
      if (done) return;
      if (undo.length > 200) undo.splice(0, undo.length - 200);
      ctx.save({ v: 1, p: P.join(''), s: SOL.join(''), e: E.join(''), h: H.join(''), n: N.slice(), u: undo,
        mis: mis, hints: hints, t: Math.round(elapsed()), sel: sel, nm: nm });
      lastSave = elapsed();
    }

    function val(i) { return P[i] || E[i]; }
    function locked(i) { return !!(P[i] || H[i]); }

    function el(tag, cls, txt) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (txt != null) e.textContent = txt;
      return e;
    }

    var root = el('div', 'gsud');
    var board = el('div', 'gsud-board');
    board.tabIndex = 0;
    board.setAttribute('role', 'group');
    var grid = el('div', 'gsud-grid');
    var boxEls = [], cellEl = [], vEl = [], fxEl = [], nEl = [];
    for (var b = 0; b < 9; b++) boxEls.push(grid.appendChild(el('div', 'gsud-box')));
    for (var i = 0; i < 81; i++) {
      var c = el('div', 'gsud-c');
      c.setAttribute('aria-hidden', 'true');
      c.gsudI = i;
      fxEl.push(c.appendChild(el('span', 'gsud-fx')));
      vEl.push(c.appendChild(el('span', 'gsud-v')));
      var ns = c.appendChild(el('span', 'gsud-ns')), row = [];
      for (var d = 1; d <= 9; d++) row.push(ns.appendChild(el('span', 'gsud-n', String(d))));
      nEl.push(row);
      cellEl.push(boxEls[BOX[i]].appendChild(c));
    }
    board.appendChild(grid);
    var live = el('p', 'gsud-sr');
    live.setAttribute('aria-live', 'polite');
    root.appendChild(board);
    root.appendChild(live);
    ctx.board.appendChild(root);

    var ctl = el('div', 'gsud-ctl');
    var toolsRow = ctl.appendChild(el('div', 'gsud-tools'));
    var TOOLS = [
      { a: 'undo', icon: 'fa-rotate-left', ks: 'Z', ar: 'تراجع', en: 'Undo' },
      { a: 'erase', icon: 'fa-eraser', ks: 'Backspace', ar: 'مسح', en: 'Erase' },
      { a: 'notes', icon: 'fa-pencil', ks: 'N', ar: 'ملاحظات', en: 'Notes' },
      { a: 'hint', icon: 'fa-lightbulb', ks: 'H', ar: 'تلميح', en: 'Hint' }
    ];
    var tool = {};
    TOOLS.forEach(function (o) {
      var btn = el('button', 'gsud-tool');
      btn.type = 'button';
      btn.gsudA = o.a;
      btn.setAttribute('aria-keyshortcuts', o.ks);
      var ti = btn.appendChild(el('span', 'gsud-ti'));
      var ic = ti.appendChild(el('i', 'fa-solid ' + o.icon));
      ic.setAttribute('aria-hidden', 'true');
      var badge = ti.appendChild(el('span', 'gsud-badge'));
      badge.setAttribute('aria-hidden', 'true');
      var lb = btn.appendChild(el('span', 'gsud-tl'));
      tool[o.a] = { btn: btn, badge: badge, lb: lb, o: o };
      toolsRow.appendChild(btn);
    });
    var padWrap = ctl.appendChild(el('div', 'gsud-pad'));
    var keys = padWrap.appendChild(el('div', 'gsud-keys'));
    keys.setAttribute('role', 'group');
    var keyEl = [], keyCnt = [];
    for (var kd = 1; kd <= 9; kd++) {
      var kb = el('button', 'gsud-k');
      kb.type = 'button';
      kb.gsudD = kd;
      kb.appendChild(el('b', null, String(kd)));
      keyCnt.push(kb.appendChild(el('small', null, '')));
      keyEl.push(keys.appendChild(kb));
    }
    ctx.controls.appendChild(ctl);

    var cache = { cls: [], v: [], n: [], hi: [], key: [] };

    function clashes() {
      var bad = [];
      for (var i = 0; i < 81; i++) {
        bad.push(0);
        var v = val(i);
        if (!v) continue;
        var pp = PEERS[i];
        for (var k = 0; k < 20; k++) if (val(pp[k]) === v) { bad[i] = 1; break; }
      }
      return bad;
    }

    function stat(label, value, id, cls) {
      return '<span class="gm-stat"><small>' + label + '</small><b' + (id ? ' id="' + id + '"' : '') + (cls ? ' class="' + cls + '"' : '') + '>' + value + '</b></span>';
    }
    function status() {
      lastTime = clock(elapsed());
      ctx.status((ctx.daily ? stat(t('المستوى', 'Level'), t(LV[level][0], LV[level][1])) : '') +
        stat(t('الأخطاء', 'Mistakes'), mis, null, mis ? 'gsud-bad' : '') +
        stat(t('الوقت', 'Time'), lastTime, 'gsud-time'));
    }

    function labels() {
      board.setAttribute('aria-label', t('شبكةُ السودوكو — الأسهمُ للتنقّل والأرقامُ للإدخال', 'Sudoku grid — arrows to move, digits to enter'));
      keys.setAttribute('aria-label', t('لوحةُ الأرقام', 'Number pad'));
      TOOLS.forEach(function (o) { tool[o.a].lb.textContent = t(o.ar, o.en); });
      cache.key = [];
    }

    function render() {
      var hv = sel >= 0 ? val(sel) : focusD, bad = clashes(), cnt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (var i = 0; i < 81; i++) {
        var v = val(i), cls = 'gsud-c';
        if (v && v === SOL[i]) cnt[v]++;
        if (P[i]) cls += ' gsud-g'; else if (v) cls += H[i] ? ' gsud-u gsud-h' : ' gsud-u';
        if (v && !P[i] && v !== SOL[i]) cls += ' gsud-err';
        if (bad[i]) cls += ' gsud-cl';
        if (i === sel) cls += ' gsud-sel';
        else if (hv && v === hv) cls += ' gsud-sm';
        else if (sel >= 0 && (ROW[i] === ROW[sel] || COL[i] === COL[sel] || BOX[i] === BOX[sel])) cls += ' gsud-pr';
        if (cache.cls[i] !== cls) { cellEl[i].className = cls; cache.cls[i] = cls; }
        var vt = v ? String(v) : '';
        if (cache.v[i] !== vt) { vEl[i].textContent = vt; cache.v[i] = vt; }
        var nmask = v ? 0 : N[i], hi = (!v && hv && (nmask & (1 << (hv - 1)))) ? hv : 0;
        if (cache.n[i] !== nmask || cache.hi[i] !== hi) {
          for (var d = 1; d <= 9; d++) {
            var on = nmask & (1 << (d - 1));
            nEl[i][d - 1].className = 'gsud-n' + (on ? ' gsud-on' : '') + (on && d === hi ? ' gsud-hi' : '');
          }
          cache.n[i] = nmask; cache.hi[i] = hi;
        }
      }
      for (var k = 1; k <= 9; k++) {
        var rem = Math.max(0, 9 - cnt[k]);
        var sig = rem + '|' + (k === focusD && sel < 0 ? 1 : 0);
        if (cache.key[k] === sig) continue;
        cache.key[k] = sig;
        var kbt = keyEl[k - 1];
        kbt.className = 'gsud-k' + (rem ? '' : ' gsud-done') + (k === focusD && sel < 0 ? ' gsud-sm' : '');
        keyCnt[k - 1].textContent = rem ? String(rem) : '';
        kbt.setAttribute('aria-label', k + ' — ' + (rem ? t('بقي ', '') + rem + t('', ' left') : t('اكتمل', 'complete')));
      }
      ctl.className = 'gsud-ctl' + (nm ? ' gsud-nm' : '') + (root.className.indexOf('gsud-hide') >= 0 ? ' gsud-hide' : '');
      var tn = tool.notes, th = tool.hint, tu = tool.undo;
      tn.btn.className = 'gsud-tool' + (nm ? ' gsud-on' : '');
      tn.btn.setAttribute('aria-pressed', nm ? 'true' : 'false');
      tn.badge.textContent = nm ? t('مفعّل', 'On') : t('مطفأ', 'Off');
      th.badge.textContent = hints ? String(hints) : '';
      th.btn.setAttribute('aria-label', t('تلميح', 'Hint') + (hints ? ' (' + hints + ')' : ''));
      tu.btn.className = 'gsud-tool' + (undo.length ? '' : ' gsud-off');
      tu.btn.setAttribute('aria-disabled', undo.length ? 'false' : 'true');
      status();
    }

    function announce() {
      if (sel < 0) { live.textContent = ''; return; }
      var v = val(sel), s = t('الصفّ ', 'Row ') + (ROW[sel] + 1) + t('، العمود ', ', column ') + (COL[sel] + 1) + ': ';
      if (v) s += v + (P[sel] ? t(' (معطى)', ' (given)') : (v !== SOL[sel] ? t(' (خطأ)', ' (wrong)') : ''));
      else {
        var list = [];
        for (var d = 1; d <= 9; d++) if (N[sel] & (1 << (d - 1))) list.push(d);
        s += list.length ? t('ملاحظات ', 'notes ') + list.join(' ') : t('فارغة', 'empty');
      }
      live.textContent = s;
    }

    function anim(node, cls, delay) {
      if (ctx.reduced) return;
      node.classList.remove(cls);
      if (delay != null) node.style.setProperty('--d', delay + 'ms');
      void node.offsetWidth;
      node.classList.add(cls);
    }
    function shake(i) { anim(vEl[i], 'gsud-sh'); ctx.haptic(15); }

    function elapsed() { return acc + (running ? performance.now() - startAt : 0); }
    function startClock() {
      if (running || done) return;
      running = true; startAt = performance.now();
      tick = setInterval(onTick, 250);
    }
    function stopClock() {
      if (!running) return;
      acc += performance.now() - startAt; running = false;
      clearInterval(tick);
    }
    function onTick() {
      var e = elapsed(), s = clock(e);
      if (s !== lastTime) {
        lastTime = s;
        var node = document.getElementById('gsud-time');
        if (node) node.textContent = s;
      }
      if (e - lastSave > 15000) persist();
    }

    function pushUndo(rec) { undo.push(rec); if (undo.length > 200) undo.shift(); }
    function change(rec, i, e, n) { rec.push([i, E[i], N[i]]); E[i] = e; N[i] = n; }

    function completedUnits(i) {
      return [UNITS[ROW[i]], UNITS[9 + COL[i]], UNITS[18 + BOX[i]]].filter(function (u) {
        return u.every(function (c) { return val(c) === SOL[c]; });
      });
    }
    function celebrate(i) {
      var units = completedUnits(i);
      if (!units.length) return false;
      units.forEach(function (u) {
        u.forEach(function (c) { anim(fxEl[c], 'gsud-fl', (Math.abs(ROW[c] - ROW[i]) + Math.abs(COL[c] - COL[i])) * 40); });
      });
      return true;
    }

    function settle(i, correct) {
      var unit = correct && i >= 0 ? celebrate(i) : false;
      render();
      announce();
      if (won(i)) return;
      if (unit) ctx.sound('good');
      persist();
    }

    function won(last) {
      for (var i = 0; i < 81; i++) if (val(i) !== SOL[i]) return false;
      done = true;
      stopClock();
      var ms = Math.round(acc);
      var r0 = last >= 0 ? ROW[last] : 4, c0 = last >= 0 ? COL[last] : 4;
      sel = -1; focusD = 0;
      render();
      ctx.clearSave();
      var wait = 60;
      if (!ctx.reduced) {
        for (var c = 0; c < 81; c++) {
          var dl = (Math.abs(ROW[c] - r0) + Math.abs(COL[c] - c0)) * 45;
          anim(fxEl[c], 'gsud-fl', dl);
          anim(vEl[c], 'gsud-wv', dl);
        }
        wait = 16 * 45 + 650;
      }
      ctx.sound('good');
      timers.push(setTimeout(function () {
        ctx.clearSave();
        ctx.finish({ won: true, score: ms,
          detail: t('الأخطاء: ', 'Mistakes: ') + mis + ' · ' + t('التلميحات: ', 'Hints: ') + hints + ' · ' + t(LV[level][0], LV[level][1]) });
      }, wait));
      return true;
    }

    function place(d) {
      if (E[sel] === d) return;
      var rec = [], bit = 1 << (d - 1);
      change(rec, sel, d, 0);
      PEERS[sel].forEach(function (p) { if (!val(p) && (N[p] & bit)) change(rec, p, 0, N[p] & ~bit); });
      pushUndo(rec);
      var ok = d === SOL[sel];
      if (ok) { ctx.sound('tap'); anim(vEl[sel], 'gsud-pp'); }
      else { mis++; ctx.sound('bad'); ctx.haptic(30); anim(vEl[sel], 'gsud-sh'); }
      settle(sel, ok);
    }
    function note(d) {
      if (E[sel]) { shake(sel); return; }
      var rec = [];
      change(rec, sel, 0, N[sel] ^ (1 << (d - 1)));
      pushUndo(rec);
      ctx.sound('tap');
      settle(-1, false);
    }
    function enter(d, asNote) {
      if (done) return;
      if (sel < 0) { focusD = focusD === d ? 0 : d; render(); return; }
      if (locked(sel)) { shake(sel); return; }
      if (nm || asNote) note(d); else place(d);
    }
    function erase() {
      if (done || sel < 0) return;
      if (locked(sel)) { shake(sel); return; }
      if (!E[sel] && !N[sel]) return;
      var rec = [];
      change(rec, sel, 0, 0);
      pushUndo(rec);
      ctx.sound('tap');
      settle(-1, false);
    }
    function hintMask(i) {
      var m = 0;
      PEERS[i].forEach(function (p) { if (H[p]) m |= 1 << (SOL[p] - 1); });
      return m;
    }
    function undoMove() {
      if (done) return;
      if (!undo.length) { if (sel >= 0) shake(sel); return; }
      var rec = undo.pop();
      for (var k = rec.length - 1; k >= 0; k--) {
        var c = rec[k][0];
        if (locked(c)) continue;
        E[c] = rec[k][1]; N[c] = rec[k][2] & ~hintMask(c);
      }
      sel = rec[0][0]; focusD = 0;
      ctx.sound('tap');
      anim(vEl[sel], 'gsud-pp');
      settle(-1, false);
    }
    function hint() {
      if (done) return;
      var target = -1;
      if (sel >= 0 && !locked(sel) && E[sel] !== SOL[sel]) target = sel;
      else {
        var pool = [];
        for (var i = 0; i < 81; i++) if (!locked(i) && E[i] !== SOL[i]) pool.push(i);
        if (!pool.length) return;
        target = pool[Math.floor(ctx.rng() * pool.length)];
      }
      var d = SOL[target], bit = 1 << (d - 1);
      E[target] = d; N[target] = 0; H[target] = 1; hints++;
      PEERS[target].forEach(function (p) { if (!val(p)) N[p] &= ~bit; });
      sel = target; focusD = 0;
      ctx.sound('good');
      anim(vEl[target], 'gsud-pp');
      anim(fxEl[target], 'gsud-fl', 0);
      settle(target, true);
    }
    function toggleNotes() { if (done) return; nm = !nm; ctx.sound('tap'); render(); persist(); }
    function select(i) {
      if (done) return;
      sel = i; focusD = 0;
      render(); announce();
    }
    function move(dr, dc) {
      if (done) return;
      if (sel < 0) { select(40); return; }
      select(((ROW[sel] + dr + 9) % 9) * 9 + (COL[sel] + dc + 9) % 9);
    }

    function cellFrom(node) {
      while (node && node !== board) { if (node.gsudI != null) return node.gsudI; node = node.parentNode; }
      return -1;
    }
    function onDown(e) {
      if (done || (e.button != null && e.button > 0)) return;
      var i = cellFrom(e.target);
      if (i >= 0) select(i);
    }
    function onCtl(e) {
      var node = e.target;
      while (node && node !== ctl) {
        if (node.gsudD) { enter(node.gsudD, false); return; }
        if (node.gsudA) { act(node.gsudA); return; }
        node = node.parentNode;
      }
    }
    function act(a) {
      if (a === 'undo') undoMove();
      else if (a === 'erase') erase();
      else if (a === 'notes') toggleNotes();
      else if (a === 'hint') hint();
    }
    board.addEventListener('pointerdown', onDown);
    ctl.addEventListener('click', onCtl);

    labels();
    render();
    announce();
    persist();
    startClock();

    return {
      destroy: function () {
        stopClock();
        done = true;
        timers.forEach(clearTimeout);
        board.removeEventListener('pointerdown', onDown);
        ctl.removeEventListener('click', onCtl);
      },
      pause: function () {
        if (done || !running) return;
        stopClock();
        root.classList.add('gsud-hide');
        ctl.classList.add('gsud-hide');
        persist();
      },
      resume: function () {
        root.classList.remove('gsud-hide');
        ctl.classList.remove('gsud-hide');
        if (!done) startClock();
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        if (!running && !done) return false;
        var k = e.key, code = e.code || '';
        var dirs = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (dirs[k]) { move(dirs[k][0], dirs[k][1]); return true; }
        var m = /^(?:Digit|Numpad)([0-9])$/.exec(code), d = -1;
        if (/^[0-9]$/.test(k)) d = +k;
        else if (m && k && k.length === 1) d = +m[1];
        if (d > 0) { enter(d, !!e.shiftKey && !/^[0-9]$/.test(k)); return true; }
        if (d === 0 || k === 'Backspace' || k === 'Delete') { erase(); return true; }
        var lk = k && k.length === 1 ? k.toLowerCase() : '';
        if (!/^[a-z]$/.test(lk)) lk = /^Key[A-Z]$/.test(code) ? code.slice(3).toLowerCase() : '';
        if (lk === 'n') { toggleNotes(); return true; }
        if (lk === 'z' || lk === 'u') { undoMove(); return true; }
        if (lk === 'h') { hint(); return true; }
        if (k === ' ' || k === 'Enter') {
          var a = document.activeElement;
          if (a && a !== ctl && ctl.contains && ctl.contains(a) && a.click) { a.click(); return true; }
        }
        return false;
      },
      lang: function () { labels(); render(); announce(); },
      _s: function () { return { P: P, SOL: SOL, E: E, N: N, H: H, undo: undo, mis: mis, hints: hints, sel: sel, nm: nm, done: done, focusD: focusD, ms: elapsed() }; }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>املأ كلَّ خانةٍ فارغةٍ برقمٍ من 1 إلى 9 بحيث لا يتكرّر رقمٌ في صفٍّ ولا عمودٍ ولا مربّعٍ 3×3.</li>' +
        '<li>لكلِّ لغزٍ حلٌّ واحدٌ فقط، ويُبلغ بالمنطق دون تخمين.</li>' +
        '<li>اخترْ خانةً ثمّ رقماً من اللوحة. الرقمُ المتعارض يظهر بالأحمر، وكلُّ رقمٍ يخالف الحلَّ يُحسب خطأً — بلا خسارة.</li>' +
        '<li><b>الملاحظات</b>: دوِّنْ الاحتمالاتِ صغيرةً داخل الخانة. ووضعُ رقمٍ يمحوه من ملاحظات صفّه وعموده ومربّعه.</li>' +
        '<li><b>التلميح</b> يكشف الرقمَ الصحيح في الخانة المختارة، أو في خانةٍ عشوائيّة إن لم تختر.</li>' +
        '<li>لوحةُ المفاتيح: الأسهمُ للتنقّل، و<kbd>1</kbd>–<kbd>9</kbd> للإدخال (ومع <kbd>Shift</kbd> ملاحظة)، و<kbd>0</kbd> أو <kbd>Backspace</kbd> للمسح، و<kbd>N</kbd> للملاحظات، و<kbd>Z</kbd> أو <kbd>U</kbd> للتراجع، و<kbd>H</kbd> للتلميح، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>Fill every empty cell with a digit from 1 to 9 so no digit repeats in any row, column or 3×3 box.</li>' +
        '<li>Every puzzle has exactly one solution and can be reached by logic alone.</li>' +
        '<li>Pick a cell, then a digit from the pad. Clashing digits turn red, and any digit that disagrees with the solution counts as a mistake — the game never ends on mistakes.</li>' +
        '<li><b>Notes</b>: jot small candidates inside a cell. Placing a digit clears it from the notes in its row, column and box.</li>' +
        '<li><b>Hint</b> reveals the correct digit in the selected cell, or in a random cell if none is selected.</li>' +
        '<li>Keyboard: arrows to move, <kbd>1</kbd>–<kbd>9</kbd> to enter (with <kbd>Shift</kbd> for a note), <kbd>0</kbd> or <kbd>Backspace</kbd> to erase, <kbd>N</kbd> notes, <kbd>Z</kbd> or <kbd>U</kbd> undo, <kbd>H</kbd> hint, <kbd>P</kbd> pause.</li></ul>';
  }

  window.GardenGames.register('sudoku', {
    mount: mount,
    help: help,
    _t: { generate: generate, search: search, validGrid: validGrid, clock: clock, RANGE: RANGE, UNITS: UNITS, PEERS: PEERS }
  });
})();
