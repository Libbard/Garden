;(function () {
  'use strict';

  var PENALTY = 10000, SEEN = 'garden_tango_seen';
  var LV = { intro: ['تمهيدي', 'Starter'], easy: ['سهل', 'Easy'], medium: ['متوسّط', 'Medium'], hard: ['صعب', 'Hard'] };
  var PAR = { intro: 45000, easy: 90000, medium: 150000, hard: 240000 };
  var PLAN = {
    intro: { n: 4, signs: [3, 4], keep: [6, 7], floor: 2, deep: false, both: true },
    easy: { n: 6, signs: [6, 8], keep: [12, 14], floor: 4, deep: false },
    medium: { n: 6, signs: [9, 11], keep: [0, 0], floor: 7, deep: false },
    hard: { n: 6, signs: [10, 12], keep: [0, 0], floor: 8, deep: true }
  };
  var GEO = {};

  function geo(n) {
    if (GEO[n]) return GEO[n];
    var NN = n * n, LINES = [], TRIPLES = [], EDGES = [], r, c, k;
    for (r = 0; r < n; r++) {
      var row = [], col = [];
      for (c = 0; c < n; c++) { row.push(r * n + c); col.push(c * n + r); }
      LINES.push(row); LINES.push(col);
    }
    LINES.forEach(function (ln) { for (k = 0; k + 2 < n; k++) TRIPLES.push([ln[k], ln[k + 1], ln[k + 2]]); });
    for (r = 0; r < n; r++) for (c = 0; c + 1 < n; c++) EDGES.push([r * n + c, r * n + c + 1, 0]);
    for (r = 0; r + 1 < n; r++) for (c = 0; c < n; c++) EDGES.push([r * n + c, (r + 1) * n + c, 1]);
    GEO[n] = { N: n, NN: NN, HALF: n / 2, LINES: LINES, TRIPLES: TRIPLES, EDGES: EDGES, NE: EDGES.length };
    return GEO[n];
  }
  function geoOf(a) { return geo(Math.round(Math.sqrt(a.length))); }
  var G6 = geo(6);

  function shuffle(a, rnd) { for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(rnd() * (i + 1)); var x = a[i]; a[i] = a[k]; a[k] = x; } return a; }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function zeros(n) { var a = []; for (var i = 0; i < n; i++) a.push(0); return a; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function clock(ms) { var s = Math.floor(Math.max(0, ms) / 1000); return Math.floor(s / 60) + ':' + pad2(s % 60); }

  function fullGrid(rnd, n) {
    var Q = geo(n || 6), N = Q.N, NN = Q.NN, HALF = Q.HALF, g = zeros(NN);
    function fits(i, v) {
      var r = (i / N) | 0, c = i % N, rc = 0, cc = 0, k;
      for (k = 0; k < c; k++) if (g[r * N + k] === v) rc++;
      for (k = 0; k < r; k++) if (g[k * N + c] === v) cc++;
      if (rc >= HALF || cc >= HALF) return false;
      if (c >= 2 && g[i - 1] === v && g[i - 2] === v) return false;
      if (r >= 2 && g[i - N] === v && g[i - 2 * N] === v) return false;
      return true;
    }
    function rec(i) {
      if (i === NN) return true;
      var opts = rnd() < 0.5 ? [1, 2] : [2, 1];
      for (var k = 0; k < 2; k++) {
        if (!fits(i, opts[k])) continue;
        g[i] = opts[k];
        if (rec(i + 1)) return true;
      }
      g[i] = 0;
      return false;
    }
    rec(0);
    return g;
  }

  function signsOf(sol) { return geoOf(sol).EDGES.map(function (e) { return sol[e[0]] === sol[e[1]] ? 1 : 2; }); }

  function check(g, signs) {
    var Q = geoOf(g), N = Q.N, NN = Q.NN, NE = Q.NE, EDGES = Q.EDGES;
    var bad = zeros(NN), badE = zeros(NE), any = false, full = true, i, k;
    for (i = 0; i < NN; i++) if (!g[i]) { full = false; break; }
    Q.LINES.forEach(function (ln) {
      for (var v = 1; v <= 2; v++) {
        var n = 0;
        for (k = 0; k < N; k++) if (g[ln[k]] === v) n++;
        if (n > Q.HALF) { any = true; for (k = 0; k < N; k++) if (g[ln[k]] === v) bad[ln[k]] = 1; }
      }
    });
    Q.TRIPLES.forEach(function (tr) {
      var v = g[tr[0]];
      if (v && g[tr[1]] === v && g[tr[2]] === v) { any = true; bad[tr[0]] = bad[tr[1]] = bad[tr[2]] = 1; }
    });
    for (i = 0; i < NE; i++) {
      var s = signs[i], a = g[EDGES[i][0]], b = g[EDGES[i][1]];
      if (!s || !a || !b) continue;
      if ((s === 1) !== (a === b)) { any = true; badE[i] = 1; bad[EDGES[i][0]] = bad[EDGES[i][1]] = 1; }
    }
    return { bad: bad, badE: badE, ok: !any, full: full, won: full && !any };
  }

  function propagate(g, signs) {
    var Q = geoOf(g), N = Q.N, HALF = Q.HALF, EDGES = Q.EDGES, TRIPLES = Q.TRIPLES, LINES = Q.LINES;
    var changed = true, i, k, a, b, v;
    while (changed) {
      changed = false;
      for (i = 0; i < Q.NE; i++) {
        var s = signs[i];
        if (!s) continue;
        a = g[EDGES[i][0]]; b = g[EDGES[i][1]];
        if (a && b) { if ((s === 1) !== (a === b)) return false; continue; }
        if (a) { g[EDGES[i][1]] = s === 1 ? a : 3 - a; changed = true; }
        else if (b) { g[EDGES[i][0]] = s === 1 ? b : 3 - b; changed = true; }
      }
      for (i = 0; i < TRIPLES.length; i++) {
        var tr = TRIPLES[i], x = g[tr[0]], y = g[tr[1]], z = g[tr[2]];
        if (x && x === y && y === z) return false;
        if (x && x === y && !z) { g[tr[2]] = 3 - x; changed = true; }
        else if (y && y === z && !x) { g[tr[0]] = 3 - y; changed = true; }
        else if (x && x === z && !y) { g[tr[1]] = 3 - x; changed = true; }
      }
      for (i = 0; i < LINES.length; i++) {
        var ln = LINES[i], n1 = 0, n2 = 0;
        for (k = 0; k < N; k++) { v = g[ln[k]]; if (v === 1) n1++; else if (v === 2) n2++; }
        if (n1 > HALF || n2 > HALF) return false;
        if (n1 + n2 === N) continue;
        if (n1 === HALF) { for (k = 0; k < N; k++) if (!g[ln[k]]) g[ln[k]] = 2; changed = true; }
        else if (n2 === HALF) { for (k = 0; k < N; k++) if (!g[ln[k]]) g[ln[k]] = 1; changed = true; }
      }
    }
    return true;
  }

  function solve(g, signs, limit) {
    var found = 0, sol = null;
    function rec(a) {
      if (found >= limit || !propagate(a, signs)) return;
      var i = a.indexOf(0);
      if (i < 0) { found++; if (!sol) sol = a.slice(); return; }
      for (var v = 1; v <= 2 && found < limit; v++) { var b = a.slice(); b[i] = v; rec(b); }
    }
    rec(g.slice());
    return { count: found, sol: sol };
  }

  function deduce(g, signs, deep) {
    var a = g.slice();
    if (!propagate(a, signs)) return null;
    if (!deep) return a;
    var progress = true, NN = a.length;
    while (progress && a.indexOf(0) >= 0) {
      progress = false;
      for (var i = 0; i < NN; i++) {
        if (a[i]) continue;
        for (var v = 1; v <= 2; v++) {
          var b = a.slice(); b[i] = v;
          if (propagate(b, signs)) continue;
          a[i] = 3 - v;
          if (!propagate(a, signs)) return null;
          progress = true;
          break;
        }
      }
    }
    return a;
  }
  function solvedBy(g, signs, deep) { var a = deduce(g, signs, deep); return !!a && a.indexOf(0) < 0; }

  function firstStep(g, signs) {
    var Q = geoOf(g), EDGES = Q.EDGES, i, k;
    for (i = 0; i < Q.NE; i++) {
      var s = signs[i];
      if (!s) continue;
      var a = g[EDGES[i][0]], b = g[EDGES[i][1]];
      if (a && !b) return { i: EDGES[i][1], v: s === 1 ? a : 3 - a, rule: s === 1 ? 'eq' : 'ne', by: a };
      if (b && !a) return { i: EDGES[i][0], v: s === 1 ? b : 3 - b, rule: s === 1 ? 'eq' : 'ne', by: b };
    }
    for (i = 0; i < Q.TRIPLES.length; i++) {
      var tr = Q.TRIPLES[i], x = g[tr[0]], y = g[tr[1]], z = g[tr[2]];
      if (x && x === y && !z) return { i: tr[2], v: 3 - x, rule: 'pair', by: x };
      if (y && y === z && !x) return { i: tr[0], v: 3 - y, rule: 'pair', by: y };
      if (x && x === z && !y) return { i: tr[1], v: 3 - x, rule: 'gap', by: x };
    }
    for (i = 0; i < Q.LINES.length; i++) {
      var ln = Q.LINES[i], n1 = 0, n2 = 0, hole = -1;
      for (k = 0; k < Q.N; k++) { var v = g[ln[k]]; if (v === 1) n1++; else if (v === 2) n2++; else if (hole < 0) hole = ln[k]; }
      if (hole < 0) continue;
      if (n1 === Q.HALF) return { i: hole, v: 2, rule: i % 2 ? 'col' : 'row', by: 1 };
      if (n2 === Q.HALF) return { i: hole, v: 1, rule: i % 2 ? 'col' : 'row', by: 2 };
    }
    return null;
  }

  function pick(lo, hi, rnd) { return lo + Math.floor(rnd() * (hi - lo + 1)); }
  function countOf(a) { var n = 0; for (var i = 0; i < a.length; i++) if (a[i]) n++; return n; }
  function bothSigns(signs) { return signs.indexOf(1) >= 0 && signs.indexOf(2) >= 0; }

  function build(level, rnd) {
    var plan = PLAN[level] || PLAN.easy, Q = geo(plan.n), NN = Q.NN, NE = Q.NE, EDGES = Q.EDGES;
    var sol = fullGrid(rnd, plan.n), all = signsOf(sol), signs = zeros(NE), givens = sol.slice();
    shuffle(range(NE), rnd).slice(0, pick(plan.signs[0], plan.signs[1], rnd)).forEach(function (e) { signs[e] = all[e]; });
    var keep = plan.keep[1] ? pick(plan.keep[0], plan.keep[1], rnd) : 0, clues = NN;
    var order = shuffle(range(NN), rnd);
    for (var k = 0; k < NN && clues > keep; k++) {
      var c = order[k], v = givens[c];
      givens[c] = 0;
      if (solvedBy(givens, signs, plan.deep)) clues--; else givens[c] = v;
    }
    for (var e = 0; e < NE; e++) if (signs[e] && givens[EDGES[e][0]] && givens[EDGES[e][1]]) signs[e] = 0;
    shuffle(range(NE), rnd).forEach(function (e) {
      if (!signs[e] || countOf(signs) <= plan.floor) return;
      var s = signs[e];
      signs[e] = 0;
      if (!solvedBy(givens, signs, plan.deep)) signs[e] = s;
    });
    return { givens: givens, signs: signs, solution: sol, level: level, n: plan.n, simple: solvedBy(givens, signs, false) };
  }

  function generate(level, rnd) {
    level = PLAN[level] ? level : 'easy';
    var plan = PLAN[level], best = null;
    for (var tries = 0; tries < 60; tries++) {
      var p = build(level, rnd);
      if (level === 'hard' ? !p.simple : (!plan.both || bothSigns(p.signs))) return p;
      if (!best) best = p;
    }
    return best;
  }

  function score(ms, hints) { return Math.round(ms) + (hints | 0) * PENALTY; }
  function grade(level, ms, hints) {
    if ((hints | 0) >= 2) return -1;
    if (!(hints | 0) && ms < (PAR[level] || PAR.easy)) return 1;
    return 0;
  }

  function digits(s, n, max) {
    if (typeof s !== 'string' || s.length !== n) return null;
    var a = [];
    for (var i = 0; i < n; i++) { var d = s.charCodeAt(i) - 48; if (d < 0 || d > max) return null; a.push(d); }
    return a;
  }

  function seenBefore() {
    try {
      var was = window.localStorage.getItem(SEEN) === '1';
      if (!was) window.localStorage.setItem(SEEN, '1');
      return was;
    } catch (er) { return false; }
  }

  function mount(ctx) {
    var t = ctx.t;
    var level = PLAN[ctx.level] ? ctx.level : 'easy';
    var Q = geo(PLAN[level].n), N = Q.N, NN = Q.NN, NE = Q.NE, EDGES = Q.EDGES;
    var P, SG, SOL, G, H, undo, hints, acc, cur, lead = null;
    var running = false, startAt = 0, done = false, tick = 0, timers = [], lastTime = '', lastSave = 0;

    if (!restore(ctx.load())) fresh();
    if (level === 'intro' && !undo.length && !hints && G.join('') === P.join('')) lead = firstStep(G, SG);

    function fresh() {
      var p = generate(level, ctx.rng);
      P = p.givens.slice(); SG = p.signs.slice(); SOL = p.solution.slice();
      G = P.slice(); H = zeros(NN); undo = []; hints = 0; acc = 0; cur = 0;
    }
    function restore(st) {
      try {
        if (!st || st.v !== 1) return false;
        var s = digits(st.s, NN, 2), p = digits(st.p, NN, 2), g = digits(st.g, NE, 2), e = digits(st.e, NN, 2), h = digits(st.h, NN, 1);
        if (!s || !p || !g || !e || !h || s.indexOf(0) >= 0 || !check(s, g).won) return false;
        for (var i = 0; i < NN; i++) {
          if (p[i] && (p[i] !== s[i] || e[i] !== p[i])) return false;
          if (h[i] && e[i] !== s[i]) return false;
        }
        if (check(e, g).won) return false;
        SOL = s; P = p; SG = g; G = e; H = h;
        undo = Array.isArray(st.u) ? st.u.filter(validRec).slice(-200) : [];
        hints = Math.max(0, st.hints | 0); acc = Math.max(0, +st.t || 0);
        cur = (typeof st.cur === 'number' && st.cur >= 0 && st.cur < NN) ? st.cur | 0 : 0;
        return true;
      } catch (er) { return false; }
    }
    function validRec(r) {
      return Array.isArray(r) && r.length > 0 && r.every(function (x) {
        return Array.isArray(x) && x.length === 2 && x[0] >= 0 && x[0] < NN && x[1] >= 0 && x[1] <= 2;
      });
    }
    function persist() {
      if (done) return;
      if (undo.length > 200) undo.splice(0, undo.length - 200);
      ctx.save({ v: 1, s: SOL.join(''), p: P.join(''), g: SG.join(''), e: G.join(''), h: H.join(''), u: undo, hints: hints, t: Math.round(elapsed()), cur: cur });
      lastSave = elapsed();
    }

    function locked(i) { return !!(P[i] || H[i]); }
    function el(tag, cls, txt) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (txt != null) e.textContent = txt;
      return e;
    }
    function icon(v, cls) {
      var e = el('i', 'fa-solid ' + (v === 1 ? 'fa-sun gtg-sun' : 'fa-moon gtg-moon') + (cls ? ' ' + cls : ''));
      e.setAttribute('aria-hidden', 'true');
      return e;
    }

    var root = el('div', 'gtg gtg--n' + N);
    root.style.setProperty('--gtg-n', N);

    var rules = root.appendChild(el('section', 'gtg-rules'));
    var chip = rules.appendChild(el('button', 'gsf-chip gtg-rk'));
    chip.type = 'button';
    chip.setAttribute('aria-controls', 'gtg-cards');
    var chipIc = chip.appendChild(el('i', 'fa-solid fa-circle-info'));
    chipIc.setAttribute('aria-hidden', 'true');
    var chipTx = chip.appendChild(el('span', 'gtg-rkt'));
    var cards = rules.appendChild(el('ol', 'gtg-cards'));
    cards.id = 'gtg-cards';
    var cap = [];
    function card(fig) {
      var li = cards.appendChild(el('li', 'gtg-card'));
      var f = li.appendChild(el('span', 'gtg-fig'));
      f.setAttribute('aria-hidden', 'true');
      fig(f);
      cap.push(li.appendChild(el('span', 'gtg-cap')));
    }
    card(function (f) {
      (N === 4 ? [1, 2, 2, 1] : [1, 2, 1, 2, 2, 1]).forEach(function (v) { f.appendChild(icon(v, 'gtg-mi')); });
    });
    card(function (f) {
      var w = f.appendChild(el('span', 'gtg-no'));
      [1, 1, 1].forEach(function (v) { w.appendChild(icon(v, 'gtg-mi')); });
    });
    card(function (f) {
      [[1, '=', 1], [1, '×', 2]].forEach(function (pr) {
        var w = f.appendChild(el('span', 'gtg-pr'));
        w.appendChild(icon(pr[0], 'gtg-mi'));
        w.appendChild(el('span', 'gtg-ms', pr[1]));
        w.appendChild(icon(pr[2], 'gtg-mi'));
      });
    });
    var open = !seenBefore();
    function showRules(on) {
      open = on;
      cards.hidden = !on;
      chip.setAttribute('aria-expanded', on ? 'true' : 'false');
      chip.classList.toggle('on', on);
    }
    showRules(open);

    var board = root.appendChild(el('div', 'gtg-board'));
    board.setAttribute('role', 'grid');
    var cellEl = [];
    for (var i = 0; i < NN; i++) {
      var c = el('button', 'gtg-c');
      c.type = 'button';
      c.gtgI = i;
      c.tabIndex = -1;
      c.appendChild(icon(1));
      c.appendChild(icon(2));
      cellEl.push(board.appendChild(c));
    }
    var layer = board.appendChild(el('div', 'gtg-signs'));
    layer.setAttribute('aria-hidden', 'true');
    var signEl = [];
    EDGES.forEach(function (e, k) {
      if (!SG[k]) { signEl.push(null); return; }
      var s = el('span', 'gtg-s gtg-s--' + (e[2] ? 'v' : 'h'), SG[k] === 1 ? '=' : '×');
      var r = (e[0] / N) | 0, cc = e[0] % N;
      s.style.insetInlineStart = ((e[2] ? cc + 0.5 : cc + 1) * 100 / N) + '%';
      s.style.insetBlockStart = ((e[2] ? r + 1 : r + 0.5) * 100 / N) + '%';
      signEl.push(layer.appendChild(s));
    });
    var tip = root.appendChild(el('p', 'gtg-tip'));
    var live = root.appendChild(el('p', 'gtg-sr'));
    live.setAttribute('aria-live', 'polite');
    ctx.board.appendChild(root);

    var ctl = el('div', 'gtg-ctl');
    var TOOLS = [
      { a: 'undo', icon: 'fa-rotate-left', ks: 'Z', ar: 'تراجع', en: 'Undo' },
      { a: 'clear', icon: 'fa-eraser', ks: '', ar: 'مسحُ الكلّ', en: 'Clear' },
      { a: 'hint', icon: 'fa-lightbulb', ks: 'H', ar: 'تلميح', en: 'Hint' }
    ];
    var tool = {};
    TOOLS.forEach(function (o) {
      var b = el('button', 'gsf-btn gsf-btn--ghost gtg-tool');
      b.type = 'button';
      b.gtgA = o.a;
      if (o.ks) b.setAttribute('aria-keyshortcuts', o.ks);
      var ic = b.appendChild(el('i', 'fa-solid ' + o.icon));
      ic.setAttribute('aria-hidden', 'true');
      var lb = b.appendChild(el('span', 'gtg-tl'));
      tool[o.a] = { btn: b, lb: lb, o: o };
      ctl.appendChild(b);
    });
    ctx.controls.appendChild(ctl);

    function name(v) { return v === 1 ? t('شمس', 'sun') : v === 2 ? t('قمر', 'moon') : t('فارغة', 'empty'); }
    function cellLabel(i) {
      return t('الصفّ ', 'Row ') + (((i / N) | 0) + 1) + t('، العمود ', ', column ') + (i % N + 1) + ': ' + name(G[i]) +
        (P[i] ? t(' (معطاة)', ' (given)') : H[i] ? t(' (تلميح)', ' (hint)') : '');
    }
    function stat(label, value, id) {
      return '<span class="gm-stat"><small>' + label + '</small><b' + (id ? ' id="' + id + '"' : '') + '>' + value + '</b></span>';
    }
    function shown() { return elapsed() + hints * PENALTY; }
    function status() {
      lastTime = clock(shown());
      ctx.status((ctx.daily ? stat(t('المستوى', 'Level'), t(LV[level][0], LV[level][1])) : '') +
        stat(t('الوقت', 'Time'), lastTime, 'gtg-time') +
        stat(t('التلميحات', 'Hints'), hints ? hints + ' <small>(+' + (hints * PENALTY / 1000) + t('ث', 's') + ')</small>' : '0'));
    }
    function leadText(s) {
      var sun = s.v === 1;
      if (s.rule === 'eq') return sun ? t('بجانبها شمسٌ وبينهما =، فهي شمسٌ مثلُها.', 'its neighbour is a sun and = joins them, so it is a sun too.')
        : t('بجانبها قمرٌ وبينهما =، فهي قمرٌ مثلُه.', 'its neighbour is a moon and = joins them, so it is a moon too.');
      if (s.rule === 'ne') return sun ? t('بجانبها قمرٌ وبينهما ×، فهي شمس.', 'its neighbour is a moon and × splits them, so it is a sun.')
        : t('بجانبها شمسٌ وبينهما ×، فهي قمر.', 'its neighbour is a sun and × splits them, so it is a moon.');
      if (s.rule === 'pair') return sun ? t('بجانبها قمران متجاوران، ولا ثالثَ لهما — فهي شمس.', 'two moons sit next to it and a third is not allowed, so it is a sun.')
        : t('بجانبها شمسان متجاورتان، ولا ثالثةَ لهما — فهي قمر.', 'two suns sit next to it and a third is not allowed, so it is a moon.');
      if (s.rule === 'gap') return sun ? t('تقع بين قمرين، ولا ثلاثةَ متشابهة — فهي شمس.', 'it sits between two moons and three alike are not allowed, so it is a sun.')
        : t('تقع بين شمسين، ولا ثلاثةَ متشابهة — فهي قمر.', 'it sits between two suns and three alike are not allowed, so it is a moon.');
      var where = s.rule === 'row' ? t('صفِّها', 'its row') : t('عمودِها', 'its column');
      return sun ? t('اكتملت أقمارُ ' + where + ' (' + Q.HALF + ')، فهي شمس.', 'the moons of ' + where + ' are complete (' + Q.HALF + '), so it is a sun.')
        : t('اكتملت شموسُ ' + where + ' (' + Q.HALF + ')، فهي قمر.', 'the suns of ' + where + ' are complete (' + Q.HALF + '), so it is a moon.');
    }
    function tipText() {
      if (lead) return t('ابدأْ من هنا: ', 'Start here: ') + leadText(lead) + t(' المسْها ', ' Tap it ') + (lead.v === 1 ? t('مرّةً.', 'once.') : t('مرّتين.', 'twice.'));
      return t('المسْ خانةً: مرّةً شمس، ومرّتين قمر، وثالثةً تُفرغها.', 'Tap a cell: once for a sun, twice for a moon, a third time to empty it.');
    }
    function labels() {
      board.setAttribute('aria-label', t('شبكةُ الشمس والقمر — الأسهمُ للتنقّل وEnter للتبديل', 'Sun and moon grid — arrows to move, Enter to toggle'));
      chipTx.textContent = t('القواعد', 'Rules');
      cards.setAttribute('aria-label', t('قواعدُ اللعبة', 'Game rules'));
      cap[0].textContent = N === 4 ? t('شمسان وقمران في كلِّ صفٍّ وعمود', '2 suns + 2 moons in every row and column')
        : t('3 شموس و3 أقمار في كلِّ صفٍّ وعمود', '3 suns + 3 moons in every row and column');
      cap[1].textContent = t('لا ثلاثةَ متشابهة متجاورة', 'Never 3 alike side by side');
      cap[2].textContent = '';
      [['=', t('متماثلتان', 'same')], ['×', t('مختلفتان', 'opposite')]].forEach(function (pr, k) {
        if (k) cap[2].appendChild(document.createTextNode(' · '));
        var w = cap[2].appendChild(el('span', 'gtg-cw'));
        w.appendChild(el('b', 'gtg-ms', pr[0]));
        w.appendChild(document.createTextNode(' ' + pr[1]));
      });
      tip.textContent = tipText();
      TOOLS.forEach(function (o) { tool[o.a].lb.textContent = t(o.ar, o.en); });
    }
    function dropLead() {
      if (!lead) return;
      lead = null;
      tip.textContent = tipText();
    }

    function render() {
      var ck = check(G, SG), i;
      for (i = 0; i < NN; i++) {
        var cls = 'gtg-c' + (G[i] === 1 ? ' gtg-is-sun' : G[i] === 2 ? ' gtg-is-moon' : '') +
          (P[i] ? ' gtg-g' : H[i] ? ' gtg-h' : '') + (ck.bad[i] ? ' gtg-bad' : '') + (i === cur ? ' gtg-cur' : '') +
          (lead && lead.i === i ? ' gtg-lead' : '');
        var fx = cellEl[i].className.match(/ gtg-(?:pp|sh|wv)/g);
        if (fx) cls += fx.join('');
        if (cellEl[i].className !== cls) cellEl[i].className = cls;
        cellEl[i].tabIndex = i === cur ? 0 : -1;
        cellEl[i].setAttribute('aria-label', cellLabel(i));
        if (locked(i)) cellEl[i].setAttribute('aria-disabled', 'true'); else cellEl[i].removeAttribute('aria-disabled');
      }
      for (i = 0; i < NE; i++) if (signEl[i]) signEl[i].className = 'gtg-s gtg-s--' + (EDGES[i][2] ? 'v' : 'h') + (ck.badE[i] ? ' gtg-s--bad' : '');
      var mine = false;
      for (i = 0; i < NN; i++) if (!locked(i) && G[i]) { mine = true; break; }
      tool.undo.btn.disabled = done || !undo.length;
      tool.clear.btn.disabled = done || !mine;
      tool.hint.btn.disabled = done;
      status();
      return ck;
    }

    function anim(node, cls, delay) {
      if (ctx.reduced) return;
      node.classList.remove(cls);
      if (delay != null) node.style.setProperty('--d', delay + 'ms');
      void node.offsetWidth;
      node.classList.add(cls);
    }
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
      var s = clock(shown());
      if (s !== lastTime) {
        lastTime = s;
        var node = document.getElementById('gtg-time');
        if (node) node.textContent = s;
      }
      if (elapsed() - lastSave > 15000) persist();
    }

    function settle(i) {
      var ck = render();
      if (i >= 0) live.textContent = cellLabel(i);
      if (ck.won) { win(i); return; }
      persist();
    }
    function win(last) {
      done = true;
      stopClock();
      render();
      ctx.clearSave();
      var ms = Math.round(acc), sc = score(ms, hints), gr = grade(level, ms, hints);
      var lr = last >= 0 ? (last / N) | 0 : N / 2 - 1, lc = last >= 0 ? last % N : N / 2 - 1, wait = 80;
      if (!ctx.reduced) {
        for (var k = 0; k < NN; k++) anim(cellEl[k], 'gtg-wv', (Math.abs(((k / N) | 0) - lr) + Math.abs(k % N - lc)) * 55);
        wait = 2 * (N - 1) * 55 + 600;
      }
      ctx.sound('win');
      timers.push(setTimeout(function () {
        ctx.finish({ won: true, score: sc, grade: gr,
          detail: t('الوقت: ', 'Time: ') + clock(ms) + ' · ' + t('التلميحات: ', 'Hints: ') + hints + ' · ' + t(LV[level][0], LV[level][1]) });
      }, wait));
    }

    function setTo(i, v) {
      if (done) return;
      cur = i;
      if (locked(i)) { anim(cellEl[i], 'gtg-sh'); ctx.sound('bad'); ctx.haptic(20); render(); return; }
      if (G[i] === v) return;
      dropLead();
      undo.push([[i, G[i]]]);
      if (undo.length > 200) undo.shift();
      G[i] = v;
      ctx.sound('tap'); ctx.haptic(8);
      if (v) anim(cellEl[i], 'gtg-pp');
      settle(i);
    }
    function cycle(i) { setTo(i, (G[i] + 1) % 3); }
    function undoMove() {
      if (done || !undo.length) return;
      var rec = undo.pop(), last = -1;
      for (var k = rec.length - 1; k >= 0; k--) {
        if (locked(rec[k][0])) continue;
        G[rec[k][0]] = rec[k][1]; last = rec[k][0];
      }
      if (last >= 0) cur = last;
      ctx.sound('tap');
      settle(last);
    }
    function clearAll() {
      if (done) return;
      var rec = [];
      for (var i = 0; i < NN; i++) if (!locked(i) && G[i]) { rec.push([i, G[i]]); G[i] = 0; }
      if (!rec.length) return;
      undo.push(rec);
      ctx.sound('tap');
      settle(-1);
    }
    function hint() {
      if (done) return;
      dropLead();
      var target = -1;
      if (!locked(cur) && G[cur] !== SOL[cur]) target = cur;
      else {
        var pool = [];
        for (var i = 0; i < NN; i++) if (!locked(i) && G[i] !== SOL[i]) pool.push(i);
        if (!pool.length) return;
        target = pool[Math.floor(ctx.rng() * pool.length)];
      }
      G[target] = SOL[target]; H[target] = 1; hints++; cur = target;
      ctx.sound('good');
      anim(cellEl[target], 'gtg-pp');
      settle(target);
    }
    function act(a) {
      if (a === 'undo') undoMove();
      else if (a === 'clear') clearAll();
      else if (a === 'hint') hint();
    }

    function cellFrom(node) {
      while (node && node !== board) { if (node.gtgI != null) return node.gtgI; node = node.parentNode; }
      return -1;
    }
    function onDown(e) {
      if (done || (e.button != null && e.button > 0)) return;
      var i = cellFrom(e.target);
      if (i < 0) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      cycle(i);
    }
    function onClick(e) {
      if (e.detail !== 0) return;
      var i = cellFrom(e.target);
      if (i >= 0) cycle(i);
    }
    function onFocus(e) {
      var i = cellFrom(e.target);
      if (i >= 0 && i !== cur) { cur = i; render(); }
    }
    function onCtl(e) {
      var node = e.target;
      while (node && node !== ctl) { if (node.gtgA) { act(node.gtgA); return; } node = node.parentNode; }
    }
    function onChip() { showRules(!open); }
    board.addEventListener('pointerdown', onDown);
    board.addEventListener('click', onClick);
    board.addEventListener('focusin', onFocus);
    ctl.addEventListener('click', onCtl);
    chip.addEventListener('click', onChip);

    labels();
    render();
    persist();
    startClock();

    return {
      destroy: function () {
        stopClock();
        done = true;
        timers.forEach(clearTimeout);
        board.removeEventListener('pointerdown', onDown);
        board.removeEventListener('click', onClick);
        board.removeEventListener('focusin', onFocus);
        ctl.removeEventListener('click', onCtl);
        chip.removeEventListener('click', onChip);
      },
      pause: function () {
        if (done || !running) return;
        stopClock();
        root.classList.add('gtg--hide');
        ctl.classList.add('gtg--hide');
        persist();
      },
      resume: function () {
        root.classList.remove('gtg--hide');
        ctl.classList.remove('gtg--hide');
        if (!done) startClock();
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        if (!running || done) return false;
        var k = e.key, a = document.activeElement;
        var dirs = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
        if (dirs[k]) {
          var d = dirs[k], rtl = document.documentElement.dir === 'rtl';
          var onCell = cellFrom(a) >= 0;
          if (onCell) {
            var r = (cur / N) | 0, c = cur % N;
            r = Math.max(0, Math.min(N - 1, r + d[0]));
            c = Math.max(0, Math.min(N - 1, c + (rtl ? -d[1] : d[1])));
            cur = r * N + c;
          }
          render();
          cellEl[cur].focus();
          return true;
        }
        if (k === 'Enter' || k === ' ') {
          if (cellFrom(a) >= 0) { cycle(cur); return true; }
          if (a && (ctl.contains(a) || a === chip) && a.click) { a.click(); return true; }
          return false;
        }
        var lk = k && k.length === 1 ? k.toLowerCase() : '';
        if (lk === '1' || lk === 's') { setTo(cur, 1); cellEl[cur].focus(); return true; }
        if (lk === '2' || lk === 'm') { setTo(cur, 2); cellEl[cur].focus(); return true; }
        if (lk === '0' || k === 'Backspace' || k === 'Delete') { setTo(cur, 0); cellEl[cur].focus(); return true; }
        if (lk === 'z' || lk === 'u') { undoMove(); return true; }
        if (lk === 'h') { hint(); return true; }
        if (lk === 'r') { showRules(!open); return true; }
        return false;
      },
      lang: function () { labels(); render(); },
      _s: function () { return { P: P, SG: SG, SOL: SOL, G: G, H: H, undo: undo, hints: hints, cur: cur, done: done, ms: elapsed(), lead: lead, rules: open, n: N }; }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>املأ كلَّ خانةٍ بشمسٍ أو قمر: المسةُ الأولى شمس، والثانيةُ قمر، والثالثةُ تُفرغها.</li>' +
        '<li>في كلِّ صفٍّ وكلِّ عمودٍ عددٌ متساوٍ من الشموس والأقمار: شمسان وقمران في التمهيديّ (4×4)، وثلاثٌ وثلاثٌ في البقيّة (6×6).</li>' +
        '<li>لا يتجاور أكثرُ من اثنين متشابهين أفقيّاً أو عموديّاً.</li>' +
        '<li>العلامةُ <b>=</b> بين خانتين تعني أنّهما متماثلتان، والعلامةُ <b>×</b> تعني أنّهما مختلفتان.</li>' +
        '<li>الخاناتُ المعطاةُ مثبّتةٌ وعليها نقطةٌ صغيرة. وكلُّ مخالفةٍ للقواعد تظهر بالأحمر فوراً. لكلِّ لغزٍ حلٌّ واحدٌ يُبلغ بالمنطق.</li>' +
        '<li><b>التلميح</b> يملأ خانةً صحيحةً ويضيف 10 ثوانٍ إلى وقتك.</li>' +
        '<li>لوحةُ المفاتيح: الأسهمُ للتنقّل، و<kbd>Enter</kbd> أو <kbd>Space</kbd> للتبديل، و<kbd>1</kbd> أو <kbd>S</kbd> شمس، و<kbd>2</kbd> أو <kbd>M</kbd> قمر، و<kbd>0</kbd> أو <kbd>Backspace</kbd> للمسح، و<kbd>Z</kbd> للتراجع، و<kbd>H</kbd> للتلميح، و<kbd>R</kbd> للقواعد، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>Fill every cell with a sun or a moon: tap once for a sun, twice for a moon, a third time to empty it.</li>' +
        '<li>Every row and every column holds as many suns as moons: two of each on Starter (4x4), three of each on the other levels (6x6).</li>' +
        '<li>No more than two of the same symbol may sit next to each other horizontally or vertically.</li>' +
        '<li>An <b>=</b> sign between two cells means they are the same; an <b>×</b> means they are opposite.</li>' +
        '<li>Given cells are locked and carry a small dot. Any broken rule turns red right away. Each puzzle has one solution reachable by logic.</li>' +
        '<li><b>Hint</b> fills one correct cell and adds 10 seconds to your time.</li>' +
        '<li>Keyboard: arrows to move, <kbd>Enter</kbd> or <kbd>Space</kbd> to toggle, <kbd>1</kbd> or <kbd>S</kbd> sun, <kbd>2</kbd> or <kbd>M</kbd> moon, <kbd>0</kbd> or <kbd>Backspace</kbd> to clear, <kbd>Z</kbd> undo, <kbd>H</kbd> hint, <kbd>R</kbd> rules, <kbd>P</kbd> pause.</li></ul>';
  }

  window.GardenGames.register('tango', {
    mount: mount,
    help: help,
    logic: {
      generate: generate, build: build, fullGrid: fullGrid, signsOf: signsOf, check: check, propagate: propagate,
      solve: solve, deduce: deduce, solvedBy: solvedBy, firstStep: firstStep, geo: geo, score: score, grade: grade, clock: clock,
      N: 6, EDGES: G6.EDGES, LINES: G6.LINES, TRIPLES: G6.TRIPLES, PAR: PAR, PENALTY: PENALTY, PLAN: PLAN, LEVELS: ['intro', 'easy', 'medium', 'hard']
    }
  });
})();
