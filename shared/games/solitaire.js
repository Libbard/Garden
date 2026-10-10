;(function () {
  'use strict';

  var SUIT = ['\u2660', '\u2665', '\u2666', '\u2663'];
  var VS = '\uFE0E';
  var RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var UNDO_MAX = 200;
  var TOPC = [0, 1, 3, 4, 5, 6];

  function suitOf(c) { return Math.floor(c / 13); }
  function rankOf(c) { return c % 13 + 1; }
  function isRed(c) { var s = suitOf(c); return s === 1 || s === 2; }
  function last(a) { return a[a.length - 1]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function canStack(card, onto) { return rankOf(card) === rankOf(onto) - 1 && isRed(card) !== isRed(onto); }
  function canTab(card, pile) { return pile.length ? canStack(card, last(pile)) : rankOf(card) === 13; }
  function canFound(card, f) { return f.length ? suitOf(card) === suitOf(last(f)) && rankOf(card) === rankOf(last(f)) + 1 : rankOf(card) === 1; }

  function fresh(draw) {
    return { draw: draw, fan: 0, moves: 0, stock: [], waste: [], found: [[], [], [], []], tab: [[], [], [], [], [], [], []], down: [0, 0, 0, 0, 0, 0, 0] };
  }
  function clone(s) {
    return {
      draw: s.draw, fan: s.fan, moves: s.moves, stock: s.stock.slice(), waste: s.waste.slice(),
      found: s.found.map(function (p) { return p.slice(); }), tab: s.tab.map(function (p) { return p.slice(); }), down: s.down.slice()
    };
  }

  function deal(rng, draw) {
    var deck = [], i, j, x, r, c;
    for (i = 0; i < 52; i++) deck.push(i);
    for (i = 51; i > 0; i--) { j = Math.floor(rng() * (i + 1)); x = deck[i]; deck[i] = deck[j]; deck[j] = x; }
    var s = fresh(draw === 3 ? 3 : 1);
    for (r = 0; r < 7; r++) for (c = r; c < 7; c++) s.tab[c].push(deck.pop());
    for (c = 0; c < 7; c++) s.down[c] = c;
    s.stock = deck;
    return s;
  }

  function srcCards(st, m) {
    if (m.f === 'w') return st.waste.length && m.n === 1 ? [last(st.waste)] : null;
    if (m.f === 'f') { var f = st.found[m.i]; return f && f.length && m.n === 1 ? [last(f)] : null; }
    var p = st.tab[m.i];
    if (!p || !(m.n >= 1)) return null;
    var s = p.length - m.n, k;
    if (s < 0 || s < st.down[m.i]) return null;
    for (k = s; k < p.length - 1; k++) if (!canStack(p[k + 1], p[k])) return null;
    return p.slice(s);
  }
  function mv(src, to, j) { return { f: src.f, i: src.i, n: src.n, t: to, j: j }; }
  function legal(st, m) {
    if (!m || (m.t !== 'f' && m.t !== 't') || !(m.j >= 0) || m.j > (m.t === 'f' ? 3 : 6)) return false;
    if (m.f === 'f' && m.t === 'f') return false;
    if (m.f === 't' && m.t === 't' && m.i === m.j) return false;
    var cs = srcCards(st, m);
    if (!cs) return false;
    if (m.t === 'f') return cs.length === 1 && canFound(cs[0], st.found[m.j]);
    return canTab(cs[0], st.tab[m.j]);
  }
  function apply(st, m) {
    var s = clone(st), cs, p, k;
    if (m.f === 'w') {
      cs = [s.waste.pop()];
      s.fan = s.waste.length ? Math.min(s.waste.length, Math.max(1, s.fan - 1)) : 0;
    } else if (m.f === 'f') {
      cs = [s.found[m.i].pop()];
    } else {
      p = s.tab[m.i];
      cs = p.splice(p.length - m.n, m.n);
      if (!p.length) s.down[m.i] = 0;
      else if (s.down[m.i] >= p.length) s.down[m.i] = p.length - 1;
    }
    if (m.t === 'f') s.found[m.j].push(cs[0]);
    else for (k = 0; k < cs.length; k++) s.tab[m.j].push(cs[k]);
    s.moves++;
    return s;
  }
  function drawState(st) {
    if (!st.stock.length && !st.waste.length) return null;
    var s = clone(st), n, k;
    if (s.stock.length) {
      n = Math.min(s.draw, s.stock.length);
      for (k = 0; k < n; k++) s.waste.push(s.stock.pop());
      s.fan = n;
    } else {
      s.stock = s.waste.reverse();
      s.waste = [];
      s.fan = 0;
    }
    s.moves++;
    return s;
  }
  function foundTarget(st, c) {
    var j;
    if (rankOf(c) === 1) { for (j = 0; j < 4; j++) if (!st.found[j].length) return j; return -1; }
    for (j = 0; j < 4; j++) if (st.found[j].length && canFound(c, st.found[j])) return j;
    return -1;
  }
  function won(st) { return st.found[0].length + st.found[1].length + st.found[2].length + st.found[3].length === 52; }
  function canAuto(st) {
    if (won(st) || st.stock.length || st.waste.length) return false;
    for (var i = 0; i < 7; i++) if (st.down[i]) return false;
    return true;
  }
  function autoMove(st) {
    var best = null, br = 99, i, p, j;
    for (i = 0; i < 7; i++) {
      p = st.tab[i];
      if (!p.length) continue;
      j = foundTarget(st, last(p));
      if (j >= 0 && rankOf(last(p)) < br) { br = rankOf(last(p)); best = { f: 't', i: i, n: 1, t: 'f', j: j }; }
    }
    if (st.waste.length) {
      j = foundTarget(st, last(st.waste));
      if (j >= 0 && rankOf(last(st.waste)) < br) best = { f: 'w', i: 0, n: 1, t: 'f', j: j };
    }
    return best;
  }
  function bestMove(st, src) {
    var cs = srcCards(st, src), j, m;
    if (!cs) return null;
    if (src.n === 1 && src.f !== 'f') {
      j = foundTarget(st, cs[0]);
      if (j >= 0) return mv(src, 'f', j);
    }
    var wholeCol = src.f === 't' && st.tab[src.i].length === src.n;
    for (j = 0; j < 7; j++) {
      m = mv(src, 't', j);
      if (!legal(st, m)) continue;
      if (wholeCol && !st.tab[j].length) continue;
      return m;
    }
    return null;
  }
  function allMoves(st) {
    var out = [], srcs = [], i, j, k, p, s;
    if (st.waste.length) srcs.push({ f: 'w', i: 0, n: 1 });
    for (i = 0; i < 4; i++) if (st.found[i].length) srcs.push({ f: 'f', i: i, n: 1 });
    for (i = 0; i < 7; i++) { p = st.tab[i]; for (k = st.down[i]; k < p.length; k++) srcs.push({ f: 't', i: i, n: p.length - k }); }
    for (s = 0; s < srcs.length; s++) {
      for (j = 0; j < 4; j++) if (legal(st, mv(srcs[s], 'f', j))) out.push(mv(srcs[s], 'f', j));
      for (j = 0; j < 7; j++) if (legal(st, mv(srcs[s], 't', j))) out.push(mv(srcs[s], 't', j));
    }
    return out;
  }
  function anyPlayable(st) {
    var pool = st.stock.concat(st.waste), k, j;
    for (k = 0; k < pool.length; k++) {
      if (foundTarget(st, pool[k]) >= 0) return true;
      for (j = 0; j < 7; j++) if (canTab(pool[k], st.tab[j])) return true;
    }
    return false;
  }
  function hint(st) {
    var i, j, p, d, m, w = st.waste.length ? { f: 'w', i: 0, n: 1 } : null;
    if (w) { j = foundTarget(st, last(st.waste)); if (j >= 0) return mv(w, 'f', j); }
    for (i = 0; i < 7; i++) { p = st.tab[i]; if (p.length) { j = foundTarget(st, last(p)); if (j >= 0) return { f: 't', i: i, n: 1, t: 'f', j: j }; } }
    for (i = 0; i < 7; i++) {
      p = st.tab[i]; d = st.down[i];
      if (!p.length || !d) continue;
      for (j = 0; j < 7; j++) { m = { f: 't', i: i, n: p.length - d, t: 't', j: j }; if (legal(st, m)) return m; }
    }
    if (w) for (j = 0; j < 7; j++) { m = mv(w, 't', j); if (legal(st, m)) return m; }
    var king = w && rankOf(last(st.waste)) === 13;
    for (i = 0; i < 7 && !king; i++) if (st.down[i] && rankOf(st.tab[i][st.down[i]]) === 13) king = true;
    if (king) {
      for (i = 0; i < 7; i++) {
        p = st.tab[i];
        if (!p.length || st.down[i] || rankOf(p[0]) === 13) continue;
        for (j = 0; j < 7; j++) { if (!st.tab[j].length) continue; m = { f: 't', i: i, n: p.length, t: 't', j: j }; if (legal(st, m)) return m; }
      }
    }
    if ((st.stock.length || st.waste.length) && anyPlayable(st)) return { draw: true };
    return null;
  }

  function enc(s) {
    function cs(a) { var o = ''; for (var k = 0; k < a.length; k++) o += String.fromCharCode(48 + a[k]); return o; }
    return [s.draw, s.fan, s.moves, cs(s.stock), cs(s.waste), s.found.map(cs).join(','), s.tab.map(cs).join(','), s.down.join('')].join('|');
  }
  function dec(str) {
    if (typeof str !== 'string') return null;
    var p = str.split('|');
    if (p.length !== 8) return null;
    function ca(x) { var a = []; for (var k = 0; k < x.length; k++) a.push(x.charCodeAt(k) - 48); return a; }
    var s = {
      draw: Number(p[0]), fan: Number(p[1]), moves: Number(p[2]), stock: ca(p[3]), waste: ca(p[4]),
      found: p[5].split(',').map(ca), tab: p[6].split(',').map(ca), down: p[7].split('').map(Number)
    };
    return valid(s) ? s : null;
  }
  function valid(s) {
    if (!s || (s.draw !== 1 && s.draw !== 3)) return false;
    if (!Array.isArray(s.stock) || !Array.isArray(s.waste) || !Array.isArray(s.found) || !Array.isArray(s.tab) || !Array.isArray(s.down)) return false;
    if (s.found.length !== 4 || s.tab.length !== 7 || s.down.length !== 7) return false;
    var seen = {}, n = 0, i, k, p, d;
    function take(a) {
      if (!Array.isArray(a)) return false;
      for (var q = 0; q < a.length; q++) {
        var c = a[q];
        if (typeof c !== 'number' || c < 0 || c > 51 || c % 1 || seen[c]) return false;
        seen[c] = 1; n++;
      }
      return true;
    }
    if (!take(s.stock) || !take(s.waste)) return false;
    for (i = 0; i < 4; i++) {
      p = s.found[i];
      if (!take(p)) return false;
      for (k = 0; k < p.length; k++) if (rankOf(p[k]) !== k + 1 || suitOf(p[k]) !== suitOf(p[0])) return false;
    }
    for (i = 0; i < 7; i++) {
      p = s.tab[i]; d = s.down[i];
      if (!take(p)) return false;
      if (typeof d !== 'number' || d % 1) return false;
      if (p.length ? (d < 0 || d >= p.length) : d !== 0) return false;
      for (k = d; k < p.length - 1; k++) if (!canStack(p[k + 1], p[k])) return false;
    }
    if (n !== 52) return false;
    if (typeof s.fan !== 'number' || s.fan % 1 || s.fan < 0 || s.fan > Math.min(s.draw, s.waste.length) || (s.waste.length && s.fan < 1)) return false;
    if (typeof s.moves !== 'number' || !(s.moves >= 0) || s.moves % 1) return false;
    return true;
  }

  function engine(st) {
    var E = { st: st, undo: [] };
    E.push = function () { E.undo.push(enc(E.st)); if (E.undo.length > UNDO_MAX) E.undo.shift(); };
    E.move = function (m) { if (!legal(E.st, m)) return false; E.push(); E.st = apply(E.st, m); return true; };
    E.draw = function () { var n = drawState(E.st); if (!n) return false; E.push(); E.st = n; return true; };
    E.back = function () {
      while (E.undo.length) { var s = dec(E.undo.pop()); if (s) { E.st = s; return true; } }
      return false;
    };
    return E;
  }

  function mount(ctx) {
    var t = ctx.t;
    var draw = ctx.level === 'draw3' ? 3 : 1;
    var reduced = !!ctx.reduced;
    var E = engine(deal(ctx.rng, draw));
    var acc = 0, startAt = 0, running = false, started = false, done = false, busy = false, paused = false, dead = false, wasRunning = false;
    var tick = 0, flyT = 0, msgT = 0, hintT = 0, autoT = 0, finT = 0, raf = 0;

    var sv = ctx.load();
    if (sv && sv.v === 1) {
      var ls = dec(sv.s);
      if (ls && ls.draw === draw && !won(ls)) {
        E.st = ls;
        E.undo = (Array.isArray(sv.u) ? sv.u : []).filter(function (x) { var d = dec(x); return d && d.draw === draw; }).slice(-UNDO_MAX);
        acc = Math.max(0, Number(sv.el) || 0);
        started = !!sv.go;
      }
    }

    var root = document.createElement('div');
    root.className = 'gsol gsol--still';
    root.innerHTML = '<div class="gsol-board" tabindex="0" role="group"></div><p class="gsol-msg" role="status" aria-live="polite"></p>';
    ctx.board.appendChild(root);
    var board = root.querySelector('.gsol-board');
    var msg = root.querySelector('.gsol-msg');

    function slot(cls, label) {
      var el = document.createElement('div');
      el.className = 'gsol-slot ' + cls;
      el.setAttribute('aria-hidden', 'true');
      if (label) el.innerHTML = '<span>' + label + '</span>';
      board.appendChild(el);
      return el;
    }
    var slots = { s: slot('gsol-slot--s'), w: slot('gsol-slot--w'), f: [], t: [] };
    slots.s.innerHTML = '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i>';
    for (var fi = 0; fi < 4; fi++) slots.f.push(slot('gsol-slot--f', 'A'));
    for (var ti = 0; ti < 7; ti++) slots.t.push(slot('gsol-slot--t', 'K'));

    var els = [];
    for (var ci = 0; ci < 52; ci++) els.push(cardEl(ci));
    function cardEl(c) {
      var rk = rankOf(c), r = RANK[rk], s = SUIT[suitOf(c)] + VS;
      var corner = '<b>' + r + '</b><i>' + s + '</i>';
      var pip = rk > 10 ? '<span class="gsol-pip gsol-pip--c"><span><b>' + r + '</b><i>' + s + '</i></span></span>'
        : '<span class="gsol-pip' + (rk === 1 ? ' gsol-pip--a' : '') + '">' + s + '</span>';
      var el = document.createElement('div');
      el.className = 'gsol-card';
      el.setAttribute('data-c', c);
      el.innerHTML = '<div class="gsol-in"><div class="gsol-face' + (isRed(c) ? ' gsol-rd' : '') + '">' +
        '<span class="gsol-cn">' + corner + '</span>' + pip + '<span class="gsol-cn gsol-cn2">' + corner + '</span>' +
        '</div><div class="gsol-back"></div></div>';
      board.appendChild(el);
      return el;
    }

    ctx.controls.innerHTML = '<div class="gsol-acts">' +
      '<button type="button" class="gsf-btn gsol-b-undo"></button>' +
      '<button type="button" class="gsf-btn gsol-b-hint"></button>' +
      '<button type="button" class="gsf-btn gsf-btn--go gsol-b-auto" hidden></button></div>';
    var undoB = ctx.controls.querySelector('.gsol-b-undo');
    var hintB = ctx.controls.querySelector('.gsol-b-hint');
    var autoB = ctx.controls.querySelector('.gsol-b-auto');

    function texts() {
      board.setAttribute('aria-label', t('طاولةُ السوليتير — اسحبِ الأوراقَ أو المسها، أو استعملِ الأسهمَ وEnter',
        'Solitaire table — drag or tap cards, or use the arrow keys and Enter'));
      undoB.innerHTML = '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>' + t('تراجع', 'Undo') + '</span>';
      undoB.setAttribute('aria-label', t('تراجعْ عن الحركة الأخيرة (U)', 'Undo last move (U)'));
      hintB.innerHTML = '<i class="fa-solid fa-lightbulb" aria-hidden="true"></i><span>' + t('تلميح', 'Hint') + '</span>';
      hintB.setAttribute('aria-label', t('أرِني حركةً مفيدة (H)', 'Show a useful move (H)'));
      autoB.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>' + t('إنهاءٌ تلقائيّ', 'Auto-finish') + '</span>';
      autoB.setAttribute('aria-label', t('انقلِ الأوراقَ الباقيةَ إلى الأساس تلقائيّاً', 'Move the remaining cards to the foundations'));
    }

    function elapsed() { return acc + (running ? performance.now() - startAt : 0); }
    function upd() { var el = document.getElementById('gsol-time'); if (el) el.textContent = ctx.fmt('time', elapsed()); }
    function startClock() {
      started = true;
      if (running || done || paused) return;
      running = true; startAt = performance.now();
      clearInterval(tick); tick = setInterval(upd, 250);
    }
    function stopClock() {
      if (running) { acc += performance.now() - startAt; running = false; }
      clearInterval(tick);
    }
    function paint() {
      ctx.status('<span class="gm-stat"><small>' + t('الوقت', 'Time') + '</small><b id="gsol-time">' + ctx.fmt('time', elapsed()) + '</b></span>' +
        '<span class="gm-stat"><small>' + t('الحركات', 'Moves') + '</small><b>' + E.st.moves + '</b></span>');
    }
    function controlsState() {
      undoB.disabled = done || busy || !E.undo.length;
      hintB.disabled = done || busy;
      autoB.hidden = done || !canAuto(E.st);
      autoB.disabled = busy;
    }
    function persist() {
      if (done) return;
      ctx.save({ v: 1, s: enc(E.st), u: E.undo.slice(-UNDO_MAX), el: Math.round(elapsed()), go: started });
    }
    function say(text) {
      msg.textContent = text;
      msg.classList.add('gsol-msg--on');
      clearTimeout(msgT);
      msgT = setTimeout(function () { msg.classList.remove('gsol-msg--on'); }, 2600);
    }

    var L = null, lastW = 0;
    function colX(i) { return L.ox + i * (L.cw + L.g); }
    function tr(x, y) { return 'translate3d(' + Math.round(x * 10) / 10 + 'px,' + Math.round(y * 10) / 10 + 'px,0)'; }
    function at(el, x, y) { el.style.insetInlineStart = x + 'px'; el.style.insetBlockStart = y + 'px'; }
    function layout() {
      if (dead) return;
      var W = Math.min(root.clientWidth || ctx.board.clientWidth || 340, 720);
      lastW = root.clientWidth;
      var rect = board.getBoundingClientRect();
      var top = rect.top + (window.scrollY || 0);
      var below = 12;
      var nav = document.querySelector('.bottom-nav');
      if (nav && getComputedStyle(nav).display !== 'none') below += nav.offsetHeight;
      var ctl = ctx.controls && ctx.controls.offsetHeight ? ctx.controls.offsetHeight + 14 : 0;
      var avail = Math.max(240, window.innerHeight - top - below - ctl);
      var g = W < 420 ? 4 : W < 600 ? 6 : 8;
      var cw = (W - 6 * g) / 7;
      cw = Math.floor(clamp(Math.min(cw, avail / 3.2 / 1.4, 104), 30, 104));
      var ch = Math.round(cw * 1.4);
      var fs = Math.round(clamp(cw * 0.32, 12, 24) * 2) / 2;
      var duMin = Math.ceil(fs * 1.12 + 5);
      L = {
        W: W, g: g, cw: cw, ch: ch, fs: fs, avail: avail,
        ox: Math.floor((W - (7 * cw + 6 * g)) / 2),
        tabY: ch + Math.max(8, Math.round(ch * 0.14)),
        duMin: duMin, du0: Math.max(duMin, Math.round(ch * 0.27)),
        ddMin: Math.max(3, Math.round(ch * 0.05)), dd0: Math.max(4, Math.round(ch * 0.11)),
        fan: Math.round(cw * 0.3)
      };
      root.style.setProperty('--gsol-cw', cw + 'px');
      root.style.setProperty('--gsol-ch', ch + 'px');
      root.style.setProperty('--gsol-fs', fs + 'px');
      root.classList.toggle('gsol--lg', cw >= 64);
      at(slots.s, colX(0), 0);
      at(slots.w, colX(1), 0);
      for (var j = 0; j < 4; j++) at(slots.f[j], colX(3 + j), 0);
      for (var i = 0; i < 7; i++) at(slots.t[i], colX(i), L.tabY);
      render(false);
    }
    function needAt(i, dd, du) {
      var p = E.st.tab[i], d = E.st.down[i], u = p.length - d;
      return p.length ? L.tabY + d * dd + Math.max(0, u - 1) * du + L.ch : L.tabY + L.ch;
    }
    function boardH() {
      var mn = 0;
      for (var i = 0; i < 7; i++) mn = Math.max(mn, needAt(i, L.ddMin, L.duMin));
      var cap = L.tabY + L.ch + 6 * L.dd0 + 12 * L.du0;
      return Math.ceil(Math.max(Math.min(L.avail, cap), mn, L.tabY + L.ch * 2));
    }
    function offsets(i, bh) {
      var p = E.st.tab[i], d = E.st.down[i], u = p.length - d, dd = L.dd0, du = L.du0;
      if (needAt(i, dd, du) > bh && d) dd = Math.max(L.ddMin, Math.floor((bh - L.tabY - L.ch - Math.max(0, u - 1) * du) / d));
      if (needAt(i, dd, du) > bh && u > 1) du = Math.max(L.duMin, Math.floor((bh - L.tabY - L.ch - d * dd) / (u - 1)));
      return { dd: dd, du: du };
    }

    var loc = {}, pos = {}, baseZ = {}, bhNow = 0;
    function render(anim, extra) {
      if (!L || dead) return;
      var st = E.st, prev = loc, fly = 0, i, k, p, x, y, o;
      anim = anim && !reduced;
      loc = {};
      root.classList.toggle('gsol--still', !anim);
      bhNow = boardH();
      board.style.blockSize = bhNow + 'px';
      function put(c, px, py, z, up, pl, pi, pk) {
        loc[c] = { p: pl, i: pi, k: pk };
        pos[c] = { x: px, y: py };
        baseZ[c] = z;
        var el = els[c], q = prev[c];
        var moved = anim && q && (q.p !== pl || q.i !== pi);
        el.style.transform = tr(px, py);
        el.style.zIndex = moved ? 600 + z : z;
        if (moved) fly++;
        el.classList.toggle('gsol-up', up);
      }
      for (k = 0; k < st.stock.length; k++) put(st.stock[k], colX(0), 0, 10 + k, false, 's', 0, k);
      var wl = st.waste.length, fan = st.draw === 3 ? Math.min(st.fan, wl) : Math.min(1, wl);
      for (k = 0; k < wl; k++) {
        var fj = k - (wl - fan);
        put(st.waste[k], colX(1) + (fj > 0 ? fj * L.fan : 0), 0, 100 + k, true, 'w', 0, k);
      }
      for (i = 0; i < 4; i++) for (k = 0; k < st.found[i].length; k++) put(st.found[i][k], colX(3 + i), 0, 200 + k, true, 'f', i, k);
      for (i = 0; i < 7; i++) {
        p = st.tab[i]; o = offsets(i, bhNow); x = colX(i); y = L.tabY;
        for (k = 0; k < p.length; k++) {
          put(p[k], x, y, 300 + k, k >= st.down[i], 't', i, k);
          y += k < st.down[i] ? o.dd : o.du;
        }
      }
      if (extra) extra.forEach(function (c) { els[c].style.zIndex = 600 + baseZ[c]; fly++; });
      if (fly) { clearTimeout(flyT); flyT = setTimeout(restack, 280); }
      slots.s.classList.toggle('gsol-slot--re', !st.stock.length && wl > 0);
      if (!anim) void board.offsetWidth;
      paintCursor();
    }
    function restack() {
      var skip = press && press.drag ? press.cards : [];
      for (var c = 0; c < 52; c++) if (baseZ[c] != null && skip.indexOf(c) < 0) els[c].style.zIndex = baseZ[c];
    }

    function shake(el) {
      if (!el) return;
      el.classList.remove('gsol-no');
      void el.offsetWidth;
      el.classList.add('gsol-no');
      ctx.haptic(18);
    }
    var hl = [];
    function clearHint() { clearTimeout(hintT); hl.forEach(function (el) { el.classList.remove('gsol-hint'); }); hl = []; }

    function after(anim, extra) {
      clampCursor();
      render(anim, extra);
      paint();
      controlsState();
      if (won(E.st)) win(); else persist();
    }
    function act(fn, snd, extra) {
      if (done || busy) return false;
      clearHint();
      if (!fn()) { render(true, extra); return false; }
      startClock();
      ctx.sound(snd || 'tap');
      ctx.haptic(8);
      after(true, extra);
      return true;
    }
    function doMove(m, extra) { return act(function () { return E.move(m); }, m.t === 'f' ? 'good' : 'tap', extra); }
    function doDraw() {
      if (done || busy || paused) return;
      if (!E.st.stock.length && !E.st.waste.length) { shake(slots.s); return; }
      act(function () { return E.draw(); }, 'tap');
    }
    function undo() {
      if (done || busy || paused) return;
      clearHint();
      if (!E.back()) { shake(undoB); return; }
      ctx.sound('tap');
      after(true);
    }
    function win() {
      if (done) return;
      done = true;
      stopClock();
      ctx.clearSave();
      paint();
      controlsState();
      var ms = Math.round(acc), moves = E.st.moves;
      finT = setTimeout(function () {
        if (dead) return;
        ctx.finish({ won: true, score: ms, detail: t('الحركات: ', 'Moves: ') + moves });
      }, reduced ? 80 : 560);
    }
    function autoStep() {
      autoT = 0;
      if (dead || paused) return;
      var m = autoMove(E.st);
      while (m) {
        E.st = apply(E.st, m);
        if (!reduced) break;
        m = autoMove(E.st);
      }
      if (!m || won(E.st)) {
        busy = false;
        after(true);
        return;
      }
      render(true);
      paint();
      ctx.sound('tick');
      autoT = setTimeout(autoStep, 85);
    }
    function autoFinish() {
      if (done || busy || paused || !canAuto(E.st)) return;
      clearHint();
      busy = true;
      startClock();
      controlsState();
      autoStep();
    }
    function showHint() {
      if (done || busy || paused) return;
      clearHint();
      var h = hint(E.st), list = [];
      if (!h) { say(t('لم أجدْ حركةً مفيدة — جرّبِ التراجعَ أو ابدأْ من جديد.', 'No helpful move found — try Undo or start over.')); ctx.sound('bad'); return; }
      if (h.draw) {
        list.push(E.st.stock.length ? els[last(E.st.stock)] : slots.s);
        say(E.st.stock.length ? t('اسحبْ ورقةً من الكومة.', 'Draw from the stock.') : t('المسِ الكومةَ لتعيدَ الأوراقَ وتسحبَ من جديد.', 'Tap the stock to turn the waste over and draw again.'));
      } else {
        list.push(els[srcCards(E.st, h)[0]]);
        var tp = h.t === 'f' ? E.st.found[h.j] : E.st.tab[h.j];
        list.push(tp.length ? els[last(tp)] : (h.t === 'f' ? slots.f[h.j] : slots.t[h.j]));
      }
      hl = list;
      list.forEach(function (el) { el.classList.add('gsol-hint'); });
      hintT = setTimeout(clearHint, 2000);
      ctx.sound('tick');
    }

    var press = null, lastTap = { at: 0, key: '' };
    function srcAt(c) {
      var q = loc[c], st = E.st;
      if (!q) return null;
      if (q.p === 'w') return q.k === st.waste.length - 1 ? { f: 'w', i: 0, n: 1 } : null;
      if (q.p === 'f') return q.k === st.found[q.i].length - 1 ? { f: 'f', i: q.i, n: 1 } : null;
      if (q.p === 't') return q.k >= st.down[q.i] ? { f: 't', i: q.i, n: st.tab[q.i].length - q.k } : null;
      return null;
    }
    function onDown(e) {
      if (dead || done || busy || paused || press) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var cardE = e.target.closest('.gsol-card');
      var c = cardE ? Number(cardE.getAttribute('data-c')) : -1;
      var kind, src = null;
      if (c >= 0 && loc[c] && loc[c].p === 's') kind = 'stock';
      else if (c >= 0) { src = srcAt(c); kind = src ? 'card' : 'fixed'; }
      else if (e.target.closest('.gsol-slot') === slots.s) kind = 'stock';
      else return;
      e.preventDefault();
      try { board.focus({ preventScroll: true }); } catch (er) {}
      if (kbd) { kbd = false; paintCursor(); }
      press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, kind: kind, src: src, el: cardE, br: board.getBoundingClientRect(), drag: false, cards: null, dx: 0, dy: 0 };
      try { board.setPointerCapture(e.pointerId); } catch (er) {}
    }
    function onMove(e) {
      if (!press || e.pointerId !== press.id) return;
      var dx = e.clientX - press.x0, dy = e.clientY - press.y0;
      if (!press.drag) {
        if (press.kind !== 'card') return;
        if (Math.abs(dx) + Math.abs(dy) < (e.pointerType === 'mouse' ? 5 : 9)) return;
        var cs = srcCards(E.st, press.src);
        if (!cs) return;
        clearHint();
        press.drag = true;
        press.cards = cs;
        cs.forEach(function (c, k) { els[c].classList.add('gsol-drag'); els[c].style.zIndex = 1000 + k; });
      }
      press.dx = dx; press.dy = dy;
      press.cards.forEach(function (c) { els[c].style.transform = tr(pos[c].x + dx, pos[c].y + dy); });
    }
    function dropTarget(src, x, y, px, py) {
      var best = null, score = 0, j;
      function consider(m, r) {
        if (!legal(E.st, m)) return;
        var w = Math.min(x + L.cw, r.x + r.w) - Math.max(x, r.x), h = Math.min(y + L.ch, r.y + r.h) - Math.max(y, r.y);
        var s = w > 0 && h > 0 ? w * h : 0;
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) s += 1e7;
        if (s > score) { score = s; best = m; }
      }
      if (src.n === 1 && src.f !== 'f') for (j = 0; j < 4; j++) consider(mv(src, 'f', j), { x: colX(3 + j), y: 0, w: L.cw, h: L.ch });
      for (j = 0; j < 7; j++) {
        var p = E.st.tab[j], ly = p.length ? pos[last(p)].y : L.tabY;
        consider(mv(src, 't', j), { x: colX(j), y: L.tabY, w: L.cw, h: Math.max(ly + L.ch, bhNow) - L.tabY });
      }
      return best;
    }
    function onUp(e) {
      if (!press || e.pointerId !== press.id) return;
      var p = press;
      press = null;
      try { board.releasePointerCapture(e.pointerId); } catch (er) {}
      if (p.drag) {
        p.cards.forEach(function (c) { els[c].classList.remove('gsol-drag'); });
        var m = null;
        if (e.type === 'pointerup' && !done && !busy && !paused) {
          var top = pos[p.cards[0]];
          m = dropTarget(p.src, top.x + p.dx, top.y + p.dy, e.clientX - p.br.left, e.clientY - p.br.top);
        }
        if (!m || !doMove(m, p.cards)) { render(true, p.cards); if (m === null && e.type === 'pointerup') ctx.haptic(10); }
        return;
      }
      if (e.type !== 'pointerup') return;
      tap(p);
    }
    function tap(p) {
      if (p.kind === 'stock') { doDraw(); return; }
      if (p.kind === 'fixed') { shake(p.el); return; }
      var now = performance.now(), key = p.src.f + p.src.i;
      if (key === lastTap.key && now - lastTap.at < 320) return;
      var m = bestMove(E.st, p.src);
      if (!m) { shake(p.el); return; }
      lastTap = { at: now, key: key };
      doMove(m);
    }
    function cancelPress() {
      if (!press) return;
      var p = press;
      press = null;
      if (p.drag) { p.cards.forEach(function (c) { els[c].classList.remove('gsol-drag'); }); render(true, p.cards); }
    }
    function noMenu(e) { e.preventDefault(); }

    var cur = { r: 1, c: 0, k: -1 }, kbd = false, kfEl = null;
    function clampCursor() {
      if (cur.r !== 1) return;
      var p = E.st.tab[cur.c], d = E.st.down[cur.c];
      if (!p.length) cur.k = -1;
      else if (cur.k < d || cur.k >= p.length) cur.k = p.length - 1;
    }
    function curEl() {
      var st = E.st, f;
      if (cur.r === 0) {
        if (cur.c === 0) return st.stock.length ? els[last(st.stock)] : slots.s;
        if (cur.c === 1) return st.waste.length ? els[last(st.waste)] : slots.w;
        f = st.found[cur.c - 3];
        return f.length ? els[last(f)] : slots.f[cur.c - 3];
      }
      var p = st.tab[cur.c];
      return p.length ? els[p[clamp(cur.k, 0, p.length - 1)]] : slots.t[cur.c];
    }
    function paintCursor() {
      if (kfEl) kfEl.classList.remove('gsol-kf');
      kfEl = null;
      if (!kbd || done) return;
      kfEl = curEl();
      if (kfEl) kfEl.classList.add('gsol-kf');
    }
    function curSrc() {
      var st = E.st;
      if (cur.r === 0) {
        if (cur.c === 0) return 'stock';
        if (cur.c === 1) return st.waste.length ? { f: 'w', i: 0, n: 1 } : null;
        return st.found[cur.c - 3].length ? { f: 'f', i: cur.c - 3, n: 1 } : null;
      }
      var p = st.tab[cur.c];
      return p.length && cur.k >= st.down[cur.c] ? { f: 't', i: cur.c, n: p.length - cur.k } : null;
    }
    function moveCursor(k) {
      var st = E.st, p, d, ix;
      if (cur.r === 0) {
        ix = TOPC.indexOf(cur.c);
        if (k === 'ArrowLeft') cur.c = TOPC[Math.max(0, ix - 1)];
        else if (k === 'ArrowRight') cur.c = TOPC[Math.min(TOPC.length - 1, ix + 1)];
        else if (k === 'ArrowDown') { cur.r = 1; cur.k = st.tab[cur.c].length - 1; }
        return;
      }
      p = st.tab[cur.c]; d = st.down[cur.c];
      if (k === 'ArrowLeft' || k === 'ArrowRight') { cur.c = clamp(cur.c + (k === 'ArrowLeft' ? -1 : 1), 0, 6); cur.k = st.tab[cur.c].length - 1; }
      else if (k === 'ArrowUp') { if (p.length && cur.k - 1 >= d) cur.k--; else { cur.r = 0; cur.c = cur.c === 2 ? 1 : cur.c; } }
      else if (k === 'ArrowDown') { if (cur.k < p.length - 1) cur.k++; }
    }
    function activate() {
      var src = curSrc();
      if (src === 'stock') { doDraw(); return; }
      var m = src && bestMove(E.st, src);
      if (!m) { shake(curEl()); return; }
      doMove(m);
    }
    function sendTo(kind, j) {
      var src = curSrc(), m = null;
      if (src && src !== 'stock') {
        if (kind === 'f') { var cs = srcCards(E.st, src); var fj = cs && src.n === 1 ? foundTarget(E.st, cs[0]) : -1; if (fj >= 0) m = mv(src, 'f', fj); }
        else m = mv(src, 't', j);
      }
      if (!m || !legal(E.st, m)) { shake(curEl()); return; }
      doMove(m);
    }

    function onCtl(e) {
      var b = e.target.closest('button');
      if (!b || b.disabled || press) return;
      if (b === undoB) undo();
      else if (b === hintB) showHint();
      else if (b === autoB) autoFinish();
    }
    function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { if (!press) layout(); }); }
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { if (root.clientWidth !== lastW) schedule(); });
      ro.observe(root);
    }
    board.addEventListener('pointerdown', onDown);
    board.addEventListener('pointermove', onMove);
    board.addEventListener('pointerup', onUp);
    board.addEventListener('pointercancel', onUp);
    board.addEventListener('lostpointercapture', onUp);
    board.addEventListener('contextmenu', noMenu);
    ctx.controls.addEventListener('click', onCtl);
    window.addEventListener('resize', schedule);

    texts();
    clampCursor();
    paint();
    controlsState();
    layout();
    raf = requestAnimationFrame(function () { layout(); });

    return {
      destroy: function () {
        dead = true;
        stopClock();
        clearTimeout(flyT); clearTimeout(msgT); clearTimeout(hintT); clearTimeout(autoT); clearTimeout(finT);
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        window.removeEventListener('resize', schedule);
        board.removeEventListener('pointerdown', onDown);
        board.removeEventListener('pointermove', onMove);
        board.removeEventListener('pointerup', onUp);
        board.removeEventListener('pointercancel', onUp);
        board.removeEventListener('lostpointercapture', onUp);
        board.removeEventListener('contextmenu', noMenu);
        ctx.controls.removeEventListener('click', onCtl);
      },
      pause: function () {
        if (paused) return;
        cancelPress();
        wasRunning = running;
        stopClock();
        paused = true;
        clearTimeout(autoT); autoT = 0;
        root.classList.add('gsol--hide');
        persist();
      },
      resume: function () {
        if (!paused) return;
        paused = false;
        root.classList.remove('gsol--hide');
        if (wasRunning && !done) startClock();
        if (busy && !autoT) autoT = setTimeout(autoStep, 85);
        schedule();
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        var k = e.key;
        if (press && press.drag) return /^(Arrow\w+|Enter| |[dDuUzZhHfFaA1-7])$/.test(k);
        if (k === ' ' || k === 'd' || k === 'D') { doDraw(); return true; }
        if (k === 'u' || k === 'U' || k === 'z' || k === 'Z') { undo(); return true; }
        if (k === 'h' || k === 'H') { showHint(); return true; }
        if ((k === 'a' || k === 'A') && !autoB.hidden) { autoFinish(); return true; }
        if (/^Arrow(Up|Down|Left|Right)$/.test(k)) {
          if (done || busy) return true;
          if (kbd) moveCursor(k);
          kbd = true;
          clampCursor();
          paintCursor();
          return true;
        }
        if (k === 'Enter') {
          var ae = document.activeElement;
          if (ae && ae !== board && (ae.tagName === 'BUTTON' || ae.tagName === 'A')) return false;
          if (!kbd) { kbd = true; clampCursor(); paintCursor(); return true; }
          activate();
          return true;
        }
        if (/^[1-7]$/.test(k)) { if (!kbd) { kbd = true; paintCursor(); return true; } sendTo('t', Number(k) - 1); return true; }
        if (k === 'f' || k === 'F') { if (!kbd) { kbd = true; paintCursor(); return true; } sendTo('f'); return true; }
        return false;
      },
      lang: function () { texts(); paint(); }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>الهدف: انقلِ الأوراقَ الـ52 كلَّها إلى الأكوام الأربعة في الأعلى — لكلِّ نقشٍ كومة، من الآص (A) صعوداً حتى الملك (K).</li>' +
        '<li>في الأعمدة السبعة ضعِ الورقةَ على ورقةٍ أعلى منها بدرجةٍ واحدة وبلونٍ مخالف (9 حمراء على 10 سوداء). تُنقل السلسلةُ المرتّبةُ معاً، والعمودُ الفارغ لا يقبل إلا الملك.</li>' +
        '<li>المسِ الكومةَ المقلوبة لتسحب ورقةً (أو ثلاثاً في «سحبُ ثلاث»، والعليا وحدَها تُلعب). وحين تنفد المسْ مكانَها لتُعيدَ الأوراقَ وتسحبَ من جديد، بلا حدّ.</li>' +
        '<li>اسحبِ الورقةَ أو السلسلةَ وأفلتْها حيث تريد، أو المسها فتذهب إلى أفضل مكانٍ متاح — الأساسِ أوّلاً.</li>' +
        '<li>«تلميح» يريك حركةً مفيدة، و«تراجع» بلا حدّ. وحين تنكشف كلُّ الأوراق ويفرغ السحب يظهر «إنهاءٌ تلقائيّ».</li>' +
        '<li>لوحةُ المفاتيح: <kbd>Space</kbd> أو <kbd>D</kbd> للسحب، <kbd>U</kbd> أو <kbd>Z</kbd> للتراجع، <kbd>H</kbd> للتلميح، والأسهمُ لاختيار ورقةٍ ثمّ <kbd>Enter</kbd> لنقلها، أو <kbd>1</kbd>–<kbd>7</kbd> إلى عمودٍ بعينه و<kbd>F</kbd> إلى الأساس، و<kbd>P</kbd> للإيقاف.</li>' +
        '<li>يبدأ الوقتُ مع أوّل حركة، وتُحفظ اللعبةُ حيث توقّفت.</li></ul>'
      : '<ul><li>Goal: move all 52 cards to the four foundations at the top — one per suit, from Ace (A) up to King (K).</li>' +
        '<li>On the seven columns, place a card on one rank higher of the opposite colour (red 9 on black 10). Ordered runs move together, and an empty column takes only a King.</li>' +
        '<li>Tap the stock to draw one card (or three in “Draw 3”, where only the top one plays). When it runs out, tap its spot to turn the waste over and draw again — no limit.</li>' +
        '<li>Drag a card or run and drop it where you want, or tap it to send it to the best place available — the foundation first.</li>' +
        '<li>“Hint” shows a useful move and “Undo” has no limit. When every card is face up and the stock is empty, “Auto-finish” appears.</li>' +
        '<li>Keyboard: <kbd>Space</kbd> or <kbd>D</kbd> to draw, <kbd>U</kbd> or <kbd>Z</kbd> to undo, <kbd>H</kbd> for a hint, arrows to pick a card then <kbd>Enter</kbd> to move it, or <kbd>1</kbd>–<kbd>7</kbd> to a given column and <kbd>F</kbd> to the foundation, <kbd>P</kbd> to pause.</li>' +
        '<li>The clock starts with your first move, and the game is saved where you left it.</li></ul>';
  }

  window.GardenGames.register('solitaire', {
    mount: mount, help: help,
    _t: {
      deal: deal, canStack: canStack, canTab: canTab, canFound: canFound, srcCards: srcCards, legal: legal, apply: apply,
      drawState: drawState, foundTarget: foundTarget, won: won, canAuto: canAuto, autoMove: autoMove, bestMove: bestMove,
      allMoves: allMoves, hint: hint, enc: enc, dec: dec, valid: valid, engine: engine, clone: clone, fresh: fresh,
      rankOf: rankOf, suitOf: suitOf, isRed: isRed, UNDO_MAX: UNDO_MAX
    }
  });
})();
