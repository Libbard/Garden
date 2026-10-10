;(function () {
  'use strict';

  var LV = { easy: [9, 9, 10], medium: [16, 16, 40], hard: [30, 16, 99] };
  var CAP = { easy: 600, medium: 680, hard: 720 };
  var LONG = 350;
  var NONE = { type: 'none', cells: [] };

  function nbrs(i, W, H) {
    var r = (i / W) | 0, c = i - r * W, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      var rr = r + dr;
      if (rr < 0 || rr >= H) continue;
      for (var dc = -1; dc <= 1; dc++) {
        var cc = c + dc;
        if ((dr || dc) && cc >= 0 && cc < W) out.push(rr * W + cc);
      }
    }
    return out;
  }
  function zeros(n) { var a = new Array(n); for (var i = 0; i < n; i++) a[i] = 0; return a; }

  function plant(W, H, M, safe, rng) {
    var n = W * H, ban = zeros(n), pool = [], i;
    ban[safe] = 1;
    nbrs(safe, W, H).forEach(function (x) { ban[x] = 1; });
    for (i = 0; i < n; i++) if (!ban[i]) pool.push(i);
    if (pool.length < M) { pool = []; for (i = 0; i < n; i++) if (i !== safe) pool.push(i); }
    var mine = zeros(n);
    for (var k = 0; k < M; k++) {
      var j = k + Math.floor(rng() * (pool.length - k));
      var x = pool[k]; pool[k] = pool[j]; pool[j] = x;
      mine[pool[k]] = 1;
    }
    return mine;
  }
  function counts(mine, W, H) {
    var n = W * H, cnt = zeros(n);
    for (var i = 0; i < n; i++) {
      if (!mine[i]) continue;
      var nb = nbrs(i, W, H);
      for (var k = 0; k < nb.length; k++) cnt[nb[k]]++;
    }
    return cnt;
  }

  function game(W, H, M) {
    return { W: W, H: H, M: M, mine: null, cnt: null, rev: zeros(W * H), flag: zeros(W * H), open: 0, flags: 0, state: 'ready', hit: [] };
  }
  function arm(G, safe, rng) {
    G.mine = plant(G.W, G.H, G.M, safe, rng);
    G.cnt = counts(G.mine, G.W, G.H);
    G.state = 'play';
  }
  function spread(G, i) {
    var out = [];
    if (G.rev[i] || G.flag[i] || G.mine[i]) return out;
    var stack = [i];
    G.rev[i] = 1;
    while (stack.length) {
      var x = stack.pop();
      out.push(x);
      if (G.cnt[x]) continue;
      var nb = nbrs(x, G.W, G.H);
      for (var k = 0; k < nb.length; k++) {
        var y = nb[k];
        if (!G.rev[y] && !G.flag[y] && !G.mine[y]) { G.rev[y] = 1; stack.push(y); }
      }
    }
    G.open += out.length;
    return out;
  }
  function settleWin(G) {
    if (G.open !== G.W * G.H - G.M) return false;
    G.state = 'won';
    for (var i = 0; i < G.mine.length; i++) if (G.mine[i] && !G.flag[i]) { G.flag[i] = 1; G.flags++; }
    return true;
  }
  function chord(G, i) {
    if (G.state !== 'play' || !G.rev[i] || !G.cnt[i]) return NONE;
    var nb = nbrs(i, G.W, G.H), f = 0, hidden = [];
    for (var k = 0; k < nb.length; k++) {
      if (G.flag[nb[k]]) f++;
      else if (!G.rev[nb[k]]) hidden.push(nb[k]);
    }
    if (f !== G.cnt[i] || !hidden.length) return { type: 'none', cells: [], press: f !== G.cnt[i] ? hidden : [] };
    var hits = [], cells = [];
    hidden.forEach(function (n) {
      if (G.mine[n]) hits.push(n);
      else cells = cells.concat(spread(G, n));
    });
    if (hits.length) { G.state = 'lost'; G.hit = hits; return { type: 'boom', cells: hits, opened: cells }; }
    return { type: settleWin(G) ? 'win' : 'open', cells: cells };
  }
  function reveal(G, i, rng) {
    if (G.state === 'won' || G.state === 'lost') return NONE;
    if (G.rev[i]) return chord(G, i);
    if (G.flag[i]) return NONE;
    if (!G.mine) arm(G, i, rng);
    if (G.mine[i]) { G.state = 'lost'; G.hit = [i]; return { type: 'boom', cells: [i], opened: [] }; }
    var cells = spread(G, i);
    return { type: settleWin(G) ? 'win' : 'open', cells: cells };
  }
  function toggleFlag(G, i) {
    if (G.state === 'won' || G.state === 'lost' || G.rev[i]) return false;
    G.flag[i] = G.flag[i] ? 0 : 1;
    G.flags += G.flag[i] ? 1 : -1;
    return true;
  }
  function left(G) { return G.M - G.flags; }

  function pack(G) {
    return { W: G.W, H: G.H, M: G.M, mine: G.mine ? G.mine.join('') : '', rev: G.rev.join(''), flag: G.flag.join('') };
  }
  function bits(s, n) {
    if (typeof s !== 'string' || s.length !== n || /[^01]/.test(s)) return null;
    var a = new Array(n);
    for (var i = 0; i < n; i++) a[i] = s.charCodeAt(i) - 48;
    return a;
  }
  function unpack(o, M) {
    if (!o || typeof o !== 'object') return null;
    var W = o.W, H = o.H;
    if (!(W > 0 && H > 0 && W <= 40 && H <= 40) || (W | 0) !== W || (H | 0) !== H || o.M !== M) return null;
    var n = W * H, rev = bits(o.rev, n), flag = bits(o.flag, n), mine = o.mine ? bits(o.mine, n) : null;
    if (!rev || !flag || (o.mine && !mine)) return null;
    var G = game(W, H, M), mc = 0, i;
    G.rev = rev; G.flag = flag;
    for (i = 0; i < n; i++) {
      if (flag[i]) G.flags++;
      if (rev[i]) { G.open++; if (flag[i]) return null; }
      if (mine && mine[i]) { mc++; if (rev[i]) return null; }
    }
    if (!mine) return G.open ? null : G;
    if (mc !== M || G.open === 0 || G.open >= n - M) return null;
    G.mine = mine; G.cnt = counts(mine, W, H); G.state = 'play';
    return G;
  }

  function plural(n) { return n >= 3 && n <= 10 ? 'ألغام' : 'لغماً'; }

  function mount(ctx) {
    var t = ctx.t;
    var lvId = LV[ctx.level] ? ctx.level : 'easy';
    var M = LV[lvId][2], W = LV[lvId][0], H = LV[lvId][1];
    var G = null, acc = 0, cur = -1, mode = 'reveal';
    var saved = ctx.load();
    if (saved && saved.g) {
      var sg = saved.g;
      if ((sg.W === W && sg.H === H) || (lvId === 'hard' && sg.W === H && sg.H === W)) G = unpack(sg, M);
      if (G) {
        W = G.W; H = G.H;
        acc = Math.max(0, +saved.ms || 0);
        cur = (saved.cur | 0) >= 0 && saved.cur < W * H ? saved.cur | 0 : -1;
        mode = saved.mode === 'flag' ? 'flag' : 'reveal';
      }
    }
    if (!G) {
      if (lvId === 'hard') {
        var bw = ctx.board.clientWidth || (ctx.board.getBoundingClientRect ? ctx.board.getBoundingClientRect().width : 0) || 720;
        if (bw < 600) { W = 16; H = 30; }
      }
      G = game(W, H, M);
    }
    var N = W * H;

    var running = false, startAt = 0, tick = 0, lastSave = 0, done = false, paused = false, kb = false, lastTime = '';
    var timers = [], press = null;

    function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
    var FLAG = '<i class="fa-solid fa-flag" aria-hidden="true"></i>';
    var BOMB = '<i class="fa-solid fa-bomb" aria-hidden="true"></i>';
    var XM = '<i class="fa-solid fa-xmark gms-xm" aria-hidden="true"></i>';

    var root = el('div', 'gms gms--' + lvId);
    root.style.setProperty('--w', W);
    root.style.setProperty('--h', H);
    root.style.setProperty('--cap', CAP[lvId] + 'px');
    var board = el('div', 'gms-board');
    board.tabIndex = 0;
    board.setAttribute('role', 'group');
    var els = [];
    for (var i = 0; i < N; i++) {
      var c = el('div', 'gms-c gms-h');
      c.setAttribute('aria-hidden', 'true');
      c.gmsI = i;
      els.push(board.appendChild(c));
    }
    var live = el('p', 'gms-sr');
    live.setAttribute('aria-live', 'polite');
    root.appendChild(board);
    root.appendChild(live);
    ctx.board.appendChild(root);

    var ctl = el('div', 'gms-ctl');
    var modeBox = ctl.appendChild(el('div', 'gms-mode'));
    modeBox.setAttribute('role', 'group');
    var MODES = [
      { m: 'reveal', icon: 'fa-hand-pointer', ar: 'كشف', en: 'Reveal' },
      { m: 'flag', icon: 'fa-flag', ar: 'علم', en: 'Flag' }
    ];
    var modeBtn = {};
    MODES.forEach(function (o) {
      var b = el('button', 'gms-mb');
      b.type = 'button';
      b.gmsM = o.m;
      b.setAttribute('data-m', o.m);
      var ic = b.appendChild(el('i', 'fa-solid ' + o.icon));
      ic.setAttribute('aria-hidden', 'true');
      var lb = b.appendChild(el('span'));
      modeBtn[o.m] = { b: b, lb: lb, o: o };
      modeBox.appendChild(b);
    });
    var tip = ctl.appendChild(el('p', 'gms-tip'));
    ctx.controls.appendChild(ctl);

    var sigs = [];
    var CLS = { h: 'gms-c gms-h', f: 'gms-c gms-h gms-f', m: 'gms-c gms-o gms-m', k: 'gms-c gms-o gms-m gms-hit', x: 'gms-c gms-h gms-x' };
    var HTML = { h: '', f: FLAG, m: BOMB, k: BOMB, x: BOMB + XM };

    function look(i) {
      if (G.state === 'lost') {
        if (G.mine[i]) return G.hit.indexOf(i) >= 0 ? 'k' : (G.flag[i] ? 'f' : 'm');
        if (G.flag[i]) return 'x';
      }
      if (G.rev[i]) return 'o' + G.cnt[i];
      return G.flag[i] ? 'f' : 'h';
    }
    function render(fx) {
      for (var i = 0; i < N; i++) {
        var s = look(i), on = kb && i === cur, sig = s + (on ? '*' : '');
        if (sigs[i] === sig) continue;
        var prev = sigs[i];
        sigs[i] = sig;
        var e = els[i], open = s.charAt(0) === 'o';
        var cls = open ? 'gms-c gms-o gms-n' + s.slice(1) : CLS[s];
        if (on) cls += ' gms-cur';
        if (fx && fx[i] != null && !ctx.reduced) { cls += ' gms-in'; e.style.setProperty('--d', fx[i] + 'ms'); }
        e.className = cls;
        if (prev == null || prev.replace('*', '') !== s) e.innerHTML = open ? (s === 'o0' ? '' : s.slice(1)) : HTML[s];
      }
      status();
    }
    function ripple(origin, cells, step, cap) {
      var fx = {}, r0 = (origin / W) | 0, c0 = origin % W;
      cells.forEach(function (x) {
        var d = Math.max(Math.abs(((x / W) | 0) - r0), Math.abs((x % W) - c0));
        fx[x] = Math.min(cap, d * step);
      });
      return fx;
    }

    function elapsed() { return acc + (running ? performance.now() - startAt : 0); }
    function stat(label, value, id, extra) {
      return '<span class="gm-stat"><small>' + label + '</small><b' + (id ? ' id="' + id + '"' : '') + (extra || '') + '>' + value + '</b></span>';
    }
    function status() {
      lastTime = ctx.fmt('time', elapsed());
      var l = left(G);
      ctx.status(stat(t('ألغامٌ باقية', 'Mines left'), String(l), 'gms-left', ' dir="ltr"' + (l < 0 ? ' class="gms-neg"' : '')) +
        stat(t('الوقت', 'Time'), lastTime, 'gms-time'));
    }
    function onTick() {
      var s = ctx.fmt('time', elapsed());
      if (s !== lastTime) {
        lastTime = s;
        var node = document.getElementById('gms-time');
        if (node) node.textContent = s;
      }
      if (elapsed() - lastSave > 10000) persist();
    }
    function startClock() {
      if (running || done || paused || G.state !== 'play') return;
      running = true; startAt = performance.now();
      tick = setInterval(onTick, 200);
    }
    function stopClock() {
      if (!running) return;
      acc += performance.now() - startAt; running = false;
      clearInterval(tick);
    }
    function persist() {
      if (done || !G.mine || G.state !== 'play') return;
      lastSave = elapsed();
      ctx.save({ v: 1, g: pack(G), ms: Math.round(lastSave), cur: cur, mode: mode });
    }

    function labels() {
      board.setAttribute('aria-label', t('حقلُ الألغام — الأسهمُ للتنقّل، والمسافةُ للكشف، وF للعلم', 'Minefield — arrows to move, Space to reveal, F to flag'));
      modeBox.setAttribute('aria-label', t('ماذا تفعل اللمسة', 'What a tap does'));
      MODES.forEach(function (o) {
        var x = modeBtn[o.m];
        x.lb.textContent = t(o.ar, o.en);
        x.b.setAttribute('aria-pressed', mode === o.m ? 'true' : 'false');
      });
      tip.textContent = mode === 'flag'
        ? t('وضعُ العلم: اللمسةُ تضع علماً أو ترفعه، والضغطةُ المطوّلة تكشف.', 'Flag mode: a tap plants or lifts a flag, a long-press reveals.')
        : t('المسْ مطوّلاً أو انقرْ بالزرّ الأيمن لتضع علماً.', 'Long-press or right-click to plant a flag.');
    }
    function describe(i) {
      var s = look(i), r = (i / W) | 0, c = i % W;
      var d = s === 'h' ? t('مغطّاة', 'covered') : s === 'f' ? t('عليها علم', 'flagged') : s === 'o0' ? t('فارغة', 'empty')
        : s.charAt(0) === 'o' ? s.slice(1) : s === 'x' ? t('علمٌ خاطئ', 'wrong flag') : t('لغم', 'mine');
      return t('الصفّ ', 'Row ') + (r + 1) + t('، العمود ', ', column ') + (c + 1) + ': ' + d;
    }
    function announce() { live.textContent = cur >= 0 && kb ? describe(cur) : ''; }

    function peek(cells) {
      if (ctx.reduced) return;
      cells.forEach(function (x) { els[x].classList.add('gms-pk'); });
      timers.push(setTimeout(function () { cells.forEach(function (x) { els[x].classList.remove('gms-pk'); }); }, 180));
    }

    function after(r, i) {
      if (r.type === 'none') { if (r.press && r.press.length) peek(r.press); return; }
      startClock();
      if (r.type === 'open') {
        ctx.sound('tap');
        render(ripple(i, r.cells, 22, 420));
        announce();
        persist();
      } else if (r.type === 'boom') boom(r);
      else if (r.type === 'win') victory(r, i);
    }
    function boom(r) {
      stopClock();
      done = true;
      kb = false;
      ctx.clearSave();
      var show = [];
      for (var x = 0; x < N; x++) if ((G.mine[x] && !G.flag[x]) || (G.flag[x] && !G.mine[x])) show.push(x);
      var fx = ripple(r.cells[0], show, 30, 600);
      r.cells.forEach(function (h) { fx[h] = 0; });
      (r.opened || []).forEach(function (o) { fx[o] = 0; });
      render(fx);
      root.classList.add('gms-lost');
      ctx.sound('bad');
      ctx.haptic(60);
      var safe = N - M, ms = Math.round(acc);
      timers.push(setTimeout(function () {
        ctx.finish({ won: false, title: t('انفجر لغم!', 'Boom! You hit a mine'),
          detail: t('كشفتَ ', 'You cleared ') + G.open + t(' من ', ' of ') + safe + t(' خانةً آمنة', ' safe squares') + ' · ' + ctx.fmt('time', ms) });
      }, 900));
    }
    function victory(r, i) {
      stopClock();
      done = true;
      kb = false;
      ctx.clearSave();
      var ms = Math.round(acc);
      var flagged = [];
      for (var x = 0; x < N; x++) if (G.mine[x]) flagged.push(x);
      var fx = ripple(i, r.cells, 22, 420);
      flagged.forEach(function (f) { if (fx[f] == null) fx[f] = 450; });
      render(fx);
      root.classList.add('gms-won');
      ctx.haptic(20);
      timers.push(setTimeout(function () {
        ctx.finish({ won: true, score: ms,
          detail: t('اللوحة ', 'Board ') + W + '×' + H + ' · ' + M + ' ' + t(plural(M), 'mines') });
      }, ctx.reduced ? 300 : 800));
    }

    function primary(i) { if (done) return; after(reveal(G, i, ctx.rng), i); }
    function flagAt(i) {
      if (done || !toggleFlag(G, i)) return;
      ctx.sound('tap');
      if (!ctx.reduced) { var fx = {}; fx[i] = 0; render(fx); } else render();
      announce();
      persist();
    }
    function chordAt(i) { if (done || !G.rev[i]) return; after(chord(G, i), i); }
    function tap(i) { if (mode === 'flag' && !G.rev[i]) flagAt(i); else primary(i); }
    function alt(i) { if (mode === 'flag') primary(i); else flagAt(i); }
    function setMode(m) {
      if (m === mode) return;
      mode = m;
      ctx.sound('tap');
      labels();
      persist();
    }

    function cellFrom(node) {
      while (node && node !== board) { if (node.gmsI != null) return node.gmsI; node = node.parentNode; }
      return -1;
    }
    function clearPress() {
      if (!press) return;
      clearTimeout(press.tm);
      els[press.i].classList.remove('gms-pr');
      press = null;
    }
    function pressLook(i) { if (!G.rev[i] && !G.flag[i] && !done) els[i].classList.add('gms-pr'); }
    function onDown(e) {
      if (done || paused) return;
      var i = cellFrom(e.target);
      if (i < 0) return;
      clearPress();
      cur = i;
      if (kb) { kb = false; render(); announce(); }
      var mouse = e.pointerType === 'mouse';
      if (e.button === 2) { flagAt(i); return; }
      if (e.button === 1) { if (e.preventDefault) e.preventDefault(); chordAt(i); return; }
      if (e.button != null && e.button > 0) return;
      press = { i: i, id: e.pointerId, touch: !mouse, x: e.clientX, y: e.clientY, long: false, both: false, tm: 0 };
      pressLook(i);
      if (press.touch) {
        press.tm = setTimeout(function () {
          if (!press) return;
          press.long = true;
          els[press.i].classList.remove('gms-pr');
          ctx.haptic(15);
          alt(press.i);
        }, LONG);
      }
    }
    function onMove(e) {
      if (!press || e.pointerId !== press.id) return;
      if (press.touch) {
        if (Math.abs(e.clientX - press.x) > 10 || Math.abs(e.clientY - press.y) > 10) clearPress();
        return;
      }
      if (e.buttons & 2) press.both = true;
      var i = cellFrom(e.target);
      if (i >= 0 && i !== press.i) {
        els[press.i].classList.remove('gms-pr');
        press.i = i; cur = i;
        pressLook(i);
      }
    }
    function onUp(e) {
      if (!press || e.pointerId !== press.id) return;
      var p = press;
      clearPress();
      if (p.long) return;
      if (p.both) chordAt(p.i);
      else tap(p.i);
    }
    function onCancel(e) { if (press && e.pointerId === press.id) clearPress(); }
    function onLeave(e) { if (press && !press.touch && e.pointerId === press.id) clearPress(); }
    function onMenu(e) { e.preventDefault(); }
    function onCtl(e) {
      var node = e.target;
      while (node && node !== ctl) {
        if (node.gmsM) { setMode(node.gmsM); return; }
        node = node.parentNode;
      }
    }

    function center() { return ((H / 2) | 0) * W + ((W / 2) | 0); }
    function move(dr, dc) {
      if (cur < 0) cur = center();
      else if (kb) {
        var r = Math.max(0, Math.min(H - 1, ((cur / W) | 0) + dr)), c = Math.max(0, Math.min(W - 1, (cur % W) + dc));
        cur = r * W + c;
      }
      kb = true;
      if (document.activeElement !== board && board.focus) board.focus({ preventScroll: true });
      render();
      if (els[cur].scrollIntoView) els[cur].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      announce();
    }

    board.addEventListener('pointerdown', onDown);
    board.addEventListener('pointermove', onMove);
    board.addEventListener('pointerup', onUp);
    board.addEventListener('pointercancel', onCancel);
    board.addEventListener('pointerleave', onLeave);
    board.addEventListener('contextmenu', onMenu);
    ctl.addEventListener('click', onCtl);

    labels();
    render();
    if (G.state === 'play') { persist(); startClock(); }

    return {
      destroy: function () {
        stopClock();
        clearPress();
        done = true;
        timers.forEach(clearTimeout);
        board.removeEventListener('pointerdown', onDown);
        board.removeEventListener('pointermove', onMove);
        board.removeEventListener('pointerup', onUp);
        board.removeEventListener('pointercancel', onCancel);
        board.removeEventListener('pointerleave', onLeave);
        board.removeEventListener('contextmenu', onMenu);
        ctl.removeEventListener('click', onCtl);
      },
      pause: function () {
        if (done || paused) return;
        clearPress();
        stopClock();
        paused = true;
        root.classList.add('gms-hide');
        ctl.classList.add('gms-hide');
        persist();
      },
      resume: function () {
        paused = false;
        root.classList.remove('gms-hide');
        ctl.classList.remove('gms-hide');
        startClock();
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        if (done || paused) return false;
        var k = e.key, code = e.code || '';
        var dirs = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (dirs[k]) { move(dirs[k][0], dirs[k][1]); return true; }
        var lk = k && k.length === 1 ? k.toLowerCase() : '';
        if (lk === 'f' || (code === 'KeyF' && !/^[a-z]$/.test(lk))) {
          if (cur < 0 || !kb) { move(0, 0); return true; }
          flagAt(cur);
          return true;
        }
        if (k === ' ' || k === 'Enter') {
          var a = document.activeElement;
          if (a && a !== board && ctl.contains && ctl.contains(a) && a.click) { a.click(); return true; }
          if (a && a !== board && a.tagName && /^(BUTTON|A)$/.test(a.tagName)) return false;
          if (cur < 0 || !kb) { move(0, 0); return true; }
          primary(cur);
          return true;
        }
        return false;
      },
      lang: function () { labels(); render(); announce(); },
      _s: function () { return { G: G, cur: cur, kb: kb, mode: mode, done: done, running: running, ms: elapsed() }; }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>اكشفْ كلَّ الخانات الآمنة. الرقمُ يخبرك كم لغماً يلامس الخانةَ من جيرانها الثمانية (والأقطارُ منها).</li>' +
        '<li>اللمسةُ الأولى آمنةٌ دائماً وتفتح مساحة، والوقتُ يبدأ معها.</li>' +
        '<li>المسْ أو انقرْ لتكشف. والضغطةُ المطوّلة أو الزرُّ الأيمن يضع علماً حيث تظنّ لغماً.</li>' +
        '<li>وتحت اللوحة زرُّ <b>علم</b>: معه تضع اللمسةُ علماً، والمطوّلةُ تكشف.</li>' +
        '<li>المسْ رقماً حوله أعلامٌ بعدده فتنكشفُ بقيّةُ جيرانه دفعةً واحدة. وإن كان أحدُ الأعلام خاطئاً انفجر اللغم.</li>' +
        '<li>العدّادُ = الألغامُ ناقصَ الأعلام، وقد ينزل تحت الصفر إن أكثرتَ منها. وتفوز حين تُكشف كلُّ الخانات الآمنة، ولا يلزم تعليمُ الألغام.</li>' +
        '<li>لوحةُ المفاتيح: الأسهمُ للتنقّل، و<kbd>Space</kbd> أو <kbd>Enter</kbd> للكشف (وعلى الرقم لكشف جيرانه)، و<kbd>F</kbd> للعلم، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>Reveal every safe square. A number tells how many mines touch that square among its eight neighbours, diagonals included.</li>' +
        '<li>Your first tap is always safe and opens an area; the clock starts with it.</li>' +
        '<li>Tap or click to reveal. Long-press or right-click to plant a flag where you suspect a mine.</li>' +
        '<li>Below the board, switch to <b>Flag</b>: then a tap flags and a long-press reveals.</li>' +
        '<li>Tap a number that already has that many flags around it to open all its other neighbours at once. If one of those flags is wrong, a mine goes off.</li>' +
        '<li>The counter is mines minus flags and can drop below zero if you over-flag. You win when every safe square is open — flagging mines is optional.</li>' +
        '<li>Keyboard: arrows to move, <kbd>Space</kbd> or <kbd>Enter</kbd> to reveal (on a number, to open its neighbours), <kbd>F</kbd> to flag, <kbd>P</kbd> to pause.</li></ul>';
  }

  window.GardenGames.register('mines', {
    mount: mount,
    help: help,
    _t: { LV: LV, nbrs: nbrs, plant: plant, counts: counts, game: game, arm: arm, spread: spread, reveal: reveal, chord: chord, toggleFlag: toggleFlag, left: left, pack: pack, unpack: unpack }
  });
})();
