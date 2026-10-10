;(function (root) {
  'use strict';

  var BANKS = { mid: 'midterm-review.html', fin: 'final-review.html' };
  var TYPES = ['mcq', 'tf', 'match', 'essay'];
  var SRCS = ['bank', 'module'];
  var BOX_DAYS = [0, 1, 3, 7, 16, 35];
  var DIFFS = ['easy', 'medium', 'hard'];
  var STYLES = ['recall', 'concept', 'application', 'analysis', 'trap'];
  var STYLE_OF = {
    recall: 'recall', identify: 'recall', direct: 'recall', base: 'recall', 'base-module': 'recall', base_module: 'recall',
    'real-world': 'application', examples: 'application',
    objective: 'recall', objectives: 'recall', scope: 'recall', 'formula-identify': 'recall',
    concept: 'concept', 'key-concept': 'concept', key_concept: 'concept', 'vault-key-concept': 'concept', 'vault-key': 'concept',
    secret: 'concept', 'vault-secret': 'concept', vault: 'concept', relationship: 'concept', condition: 'concept',
    criterion: 'concept', preference: 'concept', causal: 'concept',
    application: 'application', numerical: 'application', calculation: 'application', formula: 'application',
    'formula-numerical': 'application', 'formula-variable': 'application', 'formula-logic': 'application', variable: 'application',
    scenario: 'application', process: 'application', 'process-ordering': 'application', sequence: 'application',
    logic: 'application', logical: 'application',
    analysis: 'analysis', comparison: 'analysis', contrast: 'analysis', synthesis: 'analysis', difference: 'analysis',
    trap: 'trap', 'vault-trap': 'trap'
  };
  var VAGUE = /(all|none|both|either|neither) (of )?(the )?(above|these|of these|options|answers)|^both [a-e]\b|^(a|b|c|d) (and|&) (b|c|d)\b|^all are (correct|true)|^none are (correct|true)|جميع ما (سبق|ذكر)|كل ما (سبق|ذكر)|لا شيء مما|ليس أي مما|جميع الإجابات|كل الإجابات|الخياران [أ-د]|الخيارين [أ-د]|كل مما سبق|جميع (ما|مما) سبق|(أ|ب|ج) و ?(ب|ج|د) معاً/i;
  var CITES_POS = /\b(first|second|third|fourth|last|1st|2nd|3rd|4th) (option|choice|answer)|\b(option|choice) (\(?[a-d]\)?|[1-4]|one|two|three|four)\b|\([a-d]\) (is|are)\b|(الخيار|الاختيار|الإجابة|البديل) ?(الأول|الثاني|الثالث|الرابع|الأخير|\(?[أبجد]\)?)(?=[\s.,،:)]|$)/i;

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, r) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function extractJSON(html, id) {
    var mark = 'id="' + id + '"';
    var i = html.indexOf(mark);
    if (i < 0) return null;
    var s = html.indexOf('>', i) + 1;
    var e = html.indexOf('</script>', s);
    if (s <= 0 || e < 0) return null;
    try { return JSON.parse(html.slice(s, e)); } catch (err) { return null; }
  }

  var MOD_CARD = /href="M(\d\d)\.html"[^>]*class="module-card[\s\S]*?<h3[^>]*>\s*<template class="content-ar">([\s\S]*?)<\/template>\s*<template class="content-en">([\s\S]*?)<\/template>/g;
  function extractModules(html) {
    var out = [], m;
    MOD_CARD.lastIndex = 0;
    while ((m = MOD_CARD.exec(String(html || '')))) {
      out.push({ n: Number(m[1]), ar: strip(m[2]), en: strip(m[3]) });
    }
    return out.sort(function (a, b) { return a.n - b.n; });
  }
  function strip(s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim(); }

  function midEndOf(html, midMods, total) {
    var m = /Modules? 1 (?:to|-|–) (\d{1,2})/.exec(String(html || ''));
    var n = m ? Number(m[1]) : 0;
    if (n > 0 && n < total) return n;
    var top = 0;
    (midMods || []).forEach(function (x) { if (x > top) top = x; });
    if (top >= Math.floor(total / 2) - 1 && top < total) return top;
    return Math.max(1, Math.floor(total / 2));
  }

  function txt(o) {
    if (!o) return { ar: '', en: '' };
    if (typeof o === 'string') return { ar: o, en: o };
    return { ar: String(o.ar || o.en || ''), en: String(o.en || o.ar || '') };
  }

  function normalize(code, bank, list, mod) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (q) {
      if (!q || !q.options || !q.question) return;
      var oa = (q.options.ar && q.options.ar.length) ? q.options.ar : q.options.en;
      var oe = (q.options.en && q.options.en.length) ? q.options.en : q.options.ar;
      if (!oe || oe.length < 2) return;
      var ans = Number(q.correctIndex);
      if (!(ans >= 0 && ans < oe.length)) return;
      var m = bank === 'mod' ? Number(mod) || 0 : Number(q.module) || 0;
      var x = {
        key: code + '.' + (bank === 'mod' ? 'q' + pad2(m) : bank) + '.' + q.id,
        code: code, bank: bank, id: q.id, module: m,
        q: txt(q.question),
        opts: { ar: oa.map(String), en: oe.map(String) },
        ans: ans,
        exp: txt(q.explanation),
        hint: txt(q.hint),
        diff: DIFFS.indexOf(q.difficulty) >= 0 ? q.difficulty : 'medium',
        style: STYLE_OF[String(q.type || '').toLowerCase()] || '',
        topic: String(q.topic || '')
      };
      x.fixed = CITES_POS.test(x.exp.en) || CITES_POS.test(x.exp.ar) || CITES_POS.test(x.hint.en) || CITES_POS.test(x.hint.ar);
      x.tail = [];
      for (var i = 0; i < oe.length; i++) if (isVague(oe[i]) || isVague(oa[i])) x.tail.push(i);
      out.push(x);
    });
    return out;
  }

  function stem(s) { return String(s || '').toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
  function dedupe(list) {
    var seen = {}, out = [];
    list.forEach(function (q) {
      var k = q.code + '|' + stem(q.q.en);
      var at = seen[k];
      if (at == null) { seen[k] = out.length; out.push(q); return; }
      var cur = out[at];
      if (!cur.module && q.module) out[at] = q;
      else if (!cur.style && q.style && cur.module === q.module) out[at] = q;
    });
    return out;
  }

  function normalizeCards(code, mod, list) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (c) {
      if (!c || !c.front || !c.back) return;
      var def = c.back.definition || c.back;
      var f = txt(c.front), b = txt(def);
      if (!f.en || !b.en) return;
      if (b.en.length > 160 || f.en.length > 160) return;
      out.push({ key: code + '.m' + mod + '.' + c.id, code: code, module: mod, front: f, back: b });
    });
    return out;
  }

  function isVague(s) { return VAGUE.test(String(s || '').trim()); }

  function optOrder(q, r, shuffleIt) {
    var idx = q.opts.en.map(function (_, i) { return i; });
    if (q.fixed || shuffleIt === false) return idx;
    var tail = q.tail || [];
    var body = shuffle(idx.filter(function (i) { return tail.indexOf(i) < 0; }), r);
    return body.concat(tail);
  }

  function tfEligible(q) {
    if (isVague(q.opts.en[q.ans]) || isVague(q.opts.ar[q.ans])) return false;
    var others = 0;
    for (var i = 0; i < q.opts.en.length; i++) {
      if (i !== q.ans && !isVague(q.opts.en[i]) && !isVague(q.opts.ar[i])) others++;
    }
    return others > 0;
  }

  function words(s) {
    return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(function (w) { return w.length > 2; });
  }
  function overlap(a, b) {
    var A = words(a), B = words(b);
    if (!A.length || !B.length) return 0;
    var set = {}, hit = 0;
    A.forEach(function (w) { set[w] = 1; });
    B.forEach(function (w) { if (set[w]) hit++; });
    return hit / Math.max(A.length, B.length);
  }

  function makeTF(q, truth, r) {
    if (truth) return { shown: q.ans, truth: true };
    var cands = [];
    for (var i = 0; i < q.opts.en.length; i++) {
      if (i === q.ans || isVague(q.opts.en[i]) || isVague(q.opts.ar[i])) continue;
      cands.push({ i: i, sim: overlap(q.opts.en[i], q.opts.en[q.ans]) });
    }
    if (!cands.length) return { shown: q.ans, truth: true };
    if (q.diff === 'hard') {
      cands.sort(function (a, b) { return b.sim - a.sim; });
      return { shown: cands[0].i, truth: false };
    }
    if (q.diff === 'easy' && cands.length > 1) {
      cands.sort(function (a, b) { return a.sim - b.sim; });
      return { shown: cands[0].i, truth: false };
    }
    return { shown: cands[Math.floor(r() * cands.length)].i, truth: false };
  }

  function today() { return Math.floor(Date.now() / 86400000); }
  function statOf(stats, key, day) {
    var s = stats && stats[key];
    if (!s) return { seen: 0, wrong: 0, last: null, day: 0, flag: false, box: 0, due: false };
    var box = s[5] || 0, d = s[3] || 0;
    return { seen: s[0] || 0, wrong: s[1] || 0, last: s[2], day: d, flag: !!s[4], box: box,
      due: !!s[0] && ((day == null ? today() : day) - d) >= BOX_DAYS[Math.min(box, BOX_DAYS.length - 1)] };
  }
  function record(stats, key, ok, sure, day) {
    var s = (stats[key] || [0, 0, null, 0, 0, 0]).slice();
    while (s.length < 6) s.push(0);
    s[0] = (s[0] || 0) + 1;
    if (!ok) s[1] = (s[1] || 0) + 1;
    s[2] = ok ? 1 : 0;
    s[3] = day == null ? today() : day;
    s[5] = !ok ? 0 : sure === false ? 1 : Math.min((s[5] || 0) + 1, BOX_DAYS.length - 1);
    stats[key] = s;
    return s;
  }
  function flagIt(stats, key, on) {
    var s = (stats[key] || [0, 0, null, 0, 0, 0]).slice();
    while (s.length < 6) s.push(0);
    s[4] = on ? 1 : 0;
    stats[key] = s;
    return s;
  }

  function inflateQ(code, src, x) {
    return {
      key: code + '.' + x.k, code: code, src: src, id: x.k, module: x.m,
      q: x.q, opts: x.o, ans: x.a,
      exp: x.x || { ar: '', en: '' }, hint: x.h || { ar: '', en: '' },
      diff: x.d || 'medium', style: x.s || '', topic: x.t || '',
      fixed: !!x.f, tail: x.l || []
    };
  }
  function inflate(json) {
    var c = json.code;
    return {
      code: c, mods: json.mods || [], midEnd: json.midEnd || 0,
      bank: (json.bank || []).map(function (x) { return inflateQ(c, 'bank', x); }),
      module: (json.module || []).map(function (x) { return inflateQ(c, 'module', x); }),
      cards: (json.cards || []).map(function (x) { return { key: c + '.' + x.k, code: c, module: x.m, front: x.f, back: x.b }; })
    };
  }
  function inflateEssays(json) {
    var c = json.code;
    return (json.essays || []).map(function (x) {
      return { key: c + '.' + x.k, code: c, src: 'essay', module: x.m, q: x.q, model: x.x,
        points: x.p || { ar: [], en: [] }, diff: x.d || 'medium', style: '', topic: '' };
    });
  }

  var STOP = /^(the|and|for|that|this|with|from|are|was|were|its|into|than|then|they|their|which|when|what|have|has|been|can|will|also|such|each|other|more|most|not|but|all|any|use|used|using|between|about|only|must|may|you|your|our|her|his|في|من|على|إلى|الى|عن|مع|هذا|هذه|ذلك|التي|الذي|الذين|كما|ثم|أو|او|أن|ان|إن|لا|ما|كل|بين|عند|قد|هو|هي|كان|يتم|تم|حيث|بها|به|لها|له|لم|لن|ليس|غير|أي|اي|بعض|جميع)$/;
  function sig(s) {
    var out = {};
    String(s || '').toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[ً-ْـ]/g, '')
      .replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .split(/[^\p{L}\p{N}]+/u).forEach(function (w) {
        if (/[؀-ۿ]/.test(w)) w = w.replace(/^(وال|بال|كال|فال|لل|ال|و)(?=..)/, '');
        if (w.length < 3 || STOP.test(w)) return;
        out[w.slice(0, /[؀-ۿ]/.test(w) ? 4 : 5)] = 1;
      });
    return Object.keys(out);
  }
  function essayHits(text, points) {
    var T = {};
    sig(text).forEach(function (w) { T[w] = 1; });
    var en = (points && points.en) || [], ar = (points && points.ar) || [];
    return en.map(function (p, i) {
      return [p, ar[i]].some(function (s) {
        var W = sig(s);
        if (!W.length) return false;
        var m = 0;
        W.forEach(function (w) { if (T[w]) m++; });
        return m / W.length >= 0.5 || (m >= 3 && m / W.length >= 0.34);
      });
    });
  }
  function wordCount(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }

  function inMods(cfg, code, mod) {
    var mods = cfg.modules || null;
    return !(mods && mods[code] && mods[code].length && mods[code].indexOf(mod) < 0);
  }

  function filterPool(pool, cfg, stats) {
    var diffs = cfg.diffs && cfg.diffs.length ? cfg.diffs : DIFFS;
    var styles = cfg.styles && cfg.styles.length ? cfg.styles : null;
    var day = today();
    return pool.filter(function (q) {
      if (!inMods(cfg, q.code, q.module)) return false;
      if (diffs.indexOf(q.diff) < 0) return false;
      if (styles && q.src !== 'essay' && styles.indexOf(q.style) < 0) return false;
      var st = statOf(stats, q.key, day);
      if (cfg.source === 'unseen' && st.seen) return false;
      if (cfg.source === 'wrong' && !(st.wrong && st.last === 0)) return false;
      if (cfg.source === 'flag' && !st.flag) return false;
      if (cfg.source === 'due' && !st.due) return false;
      return true;
    });
  }

  function weightOf(q, stats, smart, day) {
    if (!smart) return 1;
    var st = statOf(stats, q.key, day);
    if (st.last === 0) return 3;
    if (st.due) return 2.5;
    if (!st.seen) return 2;
    return 1;
  }

  function roundRobin(pool, n, r, stats, smart) {
    if (n <= 0 || !pool.length) return [];
    var groups = {}, order = [], day = today();
    shuffle(pool, r).forEach(function (q) {
      var g = q.code + ':' + q.module;
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(q);
    });
    order.forEach(function (g) {
      groups[g] = groups[g]
        .map(function (q) { return { q: q, k: Math.pow(r(), 1 / weightOf(q, stats, smart, day)) }; })
        .sort(function (a, b) { return b.k - a.k; })
        .map(function (x) { return x.q; });
    });
    order = shuffle(order, r);
    var out = [], alive = order.length;
    while (out.length < n && alive > 0) {
      alive = 0;
      for (var i = 0; i < order.length && out.length < n; i++) {
        var g = groups[order[i]];
        if (g.length) { out.push(g.shift()); if (g.length) alive++; }
      }
    }
    return out;
  }
  function spread(pool, n, r, stats, smart, fresh) {
    if (!fresh) return roundRobin(pool, n, r, stats, smart);
    var unseen = [], seen = [];
    pool.forEach(function (q) { (statOf(stats, q.key).seen ? seen : unseen).push(q); });
    var out = roundRobin(unseen, n, r, stats, smart);
    if (out.length < n) {
      seen = shuffle(seen, r).sort(function (a, b) { return statOf(stats, a.key).day - statOf(stats, b.key).day; });
      out = out.concat(seen.slice(0, n - out.length));
    }
    return out;
  }

  function allocate(n, types, caps) {
    var t = types.filter(function (x) { return caps[x] > 0; });
    var res = {};
    TYPES.forEach(function (x) { res[x] = 0; });
    if (!t.length) return res;
    var left = n;
    var share = Math.floor(n / t.length);
    t.forEach(function (x) { res[x] = Math.min(share, caps[x]); left -= res[x]; });
    var guard = 0;
    while (left > 0 && guard++ < 1000) {
      var moved = false;
      for (var i = 0; i < t.length && left > 0; i++) {
        if (res[t[i]] < caps[t[i]]) { res[t[i]]++; left--; moved = true; }
      }
      if (!moved) break;
    }
    return res;
  }

  function matchGroups(cards, cfg) {
    var g = {}, order = [];
    (cards || []).forEach(function (c) {
      if (!inMods(cfg, c.code, c.module)) return;
      var k = c.code + ':' + c.module;
      if (!g[k]) { g[k] = []; order.push(k); }
      g[k].push(c);
    });
    return { g: g, order: order };
  }
  function matchCap(cards, cfg) {
    var mg = matchGroups(cards, cfg), n = 0;
    mg.order.forEach(function (k) { n += Math.floor(mg.g[k].length / 4); });
    return n;
  }

  function capacity(pool, cards, cfg, stats, essays) {
    var f = filterPool(pool, cfg, stats);
    var tf = f.filter(tfEligible).length;
    var e = essays ? filterPool(essays, cfg, stats) : [];
    return { mcq: f.length, tf: tf, match: cards ? matchCap(cards, cfg) : 0, essay: e.length, filtered: f, essays: e };
  }

  var DRANK = { easy: 0, medium: 1, hard: 2 };
  function arrange(items, cfg, info, r) {
    var tail = items.filter(function (it) { return it.kind === 'essay'; });
    var body = items.filter(function (it) { return it.kind !== 'essay'; });
    if (cfg.order === 'random') return shuffle(body, r).concat(shuffle(tail, r));
    var codes = (cfg.codes || []).slice();
    function sorted(list) {
      var tag = list.map(function (it, i) {
        var x = info(it);
        if (codes.indexOf(x.code) < 0) codes.push(x.code);
        return { it: it, c: x.code, m: x.module, d: x.diff == null ? 1 : DRANK[x.diff], k: TYPES.indexOf(it.kind), i: i };
      });
      tag.sort(function (a, b) {
        return codes.indexOf(a.c) - codes.indexOf(b.c) || a.m - b.m || a.k - b.k || a.d - b.d || a.i - b.i;
      });
      return tag.map(function (x) { return x.it; });
    }
    return sorted(body).concat(sorted(tail));
  }

  function build(pool, cards, cfg, stats, seed, essays) {
    var r = rng(seed || (Date.now() & 0x7fffffff));
    var cap = capacity(pool, cards, cfg, stats, essays);
    var types = (cfg.types && cfg.types.length ? cfg.types : ['mcq']).filter(function (x) { return TYPES.indexOf(x) >= 0; });
    var maxQ = { mcq: cap.mcq, tf: cap.tf, match: Math.min(cap.match, 12), essay: Math.min(cap.essay, 10) };
    var want = allocate(Math.max(1, cfg.count | 0), types, maxQ);
    var used = {}, items = [], meta = {};
    var smart = cfg.smart !== false, fresh = !!cfg.fresh;

    var tfPool = cap.filtered.filter(tfEligible);
    var tfPick = spread(tfPool, want.tf, r, stats, smart, fresh);
    var truthBag = shuffle(tfPick.map(function (q, i) { return i % 2 === 0; }), r);
    tfPick.forEach(function (q, i) {
      used[q.key] = 1; meta[q.key] = q;
      var t = makeTF(q, truthBag[i], r);
      items.push({ kind: 'tf', key: q.key, shown: t.shown, truth: t.truth });
    });

    var mcqPool = cap.filtered.filter(function (q) { return !used[q.key]; });
    spread(mcqPool, want.mcq, r, stats, smart, fresh).forEach(function (q) {
      used[q.key] = 1; meta[q.key] = q;
      items.push({ kind: 'mcq', key: q.key, order: optOrder(q, r, cfg.shuffleOpts) });
    });

    spread(cap.essays, want.essay, r, stats, smart, fresh).forEach(function (q) {
      meta[q.key] = q;
      items.push({ kind: 'essay', key: q.key });
    });

    if (want.match > 0 && cards) {
      var mg = matchGroups(cards, cfg);
      mg.order.forEach(function (k) { mg.g[k] = shuffle(mg.g[k], r); });
      var ring = shuffle(mg.order, r), made = 0, live = true;
      while (made < want.match && live) {
        live = false;
        for (var gi = 0; gi < ring.length && made < want.match; gi++) {
          var cp = mg.g[ring[gi]], set = [], seenB = {};
          while (set.length < 4 && cp.length) {
            var c = cp.shift(), bk = c.back.en.toLowerCase();
            if (seenB[bk]) continue;
            seenB[bk] = 1; set.push(c);
          }
          if (set.length < 4) continue;
          set.forEach(function (x) { meta[x.key] = x; });
          items.push({ kind: 'match', keys: set.map(function (x) { return x.key; }), order: shuffle([0, 1, 2, 3], r) });
          made++;
          if (cp.length >= 4) live = true;
        }
      }
    }

    items = arrange(items, cfg, function (it) { return meta[it.key || it.keys[0]]; }, r);
    return { items: items, want: want, cap: cap };
  }

  function essayScore(answer, q) {
    if (!answer || !String(answer.text || '').trim()) return 0;
    var n = q && q.points && q.points.en ? q.points.en.length : 0;
    if (!n) return answer.self == null ? 0 : answer.self;
    var ticks = answer.ticks || essayHits(answer.text, q.points);
    var k = 0;
    ticks.forEach(function (x) { if (x) k++; });
    return k / n;
  }
  function answered(item, answer) {
    if (answer == null) return false;
    if (item.kind === 'essay') return !!String(answer.text || '').trim();
    if (item.kind === 'match') return answer.some(function (x) { return x != null; });
    return true;
  }
  function grade(item, answer, q) {
    if (answer == null) return 0;
    if (item.kind === 'mcq') return item.order[answer] === q.ans ? 1 : 0;
    if (item.kind === 'tf') return answer === item.truth ? 1 : 0;
    if (item.kind === 'essay') return essayScore(answer, q);
    if (item.kind === 'match') {
      var ok = 0;
      for (var i = 0; i < 4; i++) if (answer[i] === i) ok++;
      return ok / 4;
    }
    return 0;
  }

  function suggestMinutes(items) {
    var s = 0;
    items.forEach(function (it) { s += it.kind === 'mcq' ? 72 : it.kind === 'tf' ? 30 : it.kind === 'essay' ? 420 : 100; });
    return Math.max(2, Math.round(s / 60));
  }

  var api = {
    BANKS: BANKS, TYPES: TYPES, SRCS: SRCS, DIFFS: DIFFS, STYLES: STYLES, STYLE_OF: STYLE_OF, BOX_DAYS: BOX_DAYS,
    today: today, record: record, flagIt: flagIt, inflate: inflate, inflateEssays: inflateEssays,
    essayHits: essayHits, essayScore: essayScore, wordCount: wordCount, answered: answered,
    rng: rng, shuffle: shuffle, pad2: pad2,
    extractJSON: extractJSON, extractModules: extractModules, midEndOf: midEndOf,
    normalize: normalize, normalizeCards: normalizeCards, dedupe: dedupe, optOrder: optOrder,
    isVague: isVague, tfEligible: tfEligible, makeTF: makeTF, overlap: overlap,
    filterPool: filterPool, capacity: capacity, build: build, arrange: arrange, grade: grade,
    allocate: allocate, spread: spread, statOf: statOf, suggestMinutes: suggestMinutes
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GardenQuizBank = api;
})(typeof window !== 'undefined' ? window : this);
