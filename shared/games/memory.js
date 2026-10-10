;(function () {
  'use strict';

  var ICONS = [
    ['star', 'نجمة', 'Star'], ['heart', 'قلب', 'Heart'], ['moon', 'قمر', 'Moon'], ['sun', 'شمس', 'Sun'],
    ['bolt', 'برق', 'Bolt'], ['anchor', 'مرساة', 'Anchor'], ['bell', 'جرس', 'Bell'], ['book', 'كتاب', 'Book'],
    ['cloud', 'غيمة', 'Cloud'], ['feather', 'ريشة', 'Feather'], ['fire', 'نار', 'Fire'], ['key', 'مفتاح', 'Key'],
    ['music', 'موسيقى', 'Music'], ['plane', 'طائرة', 'Plane'], ['rocket', 'صاروخ', 'Rocket'], ['tree', 'شجرة', 'Tree'],
    ['flask', 'دورق', 'Flask'], ['puzzle-piece', 'قطعة أحجية', 'Puzzle piece'], ['dice', 'نرد', 'Dice'], ['paw', 'أثر مخلب', 'Paw'],
    ['gift', 'هديّة', 'Gift'], ['ghost', 'شبح', 'Ghost'], ['palette', 'لوحة ألوان', 'Palette'], ['compass', 'بوصلة', 'Compass']
  ];
  var MODE_KEY = 'garden_game_memory_mode';
  var LIM = { term: 60, def: 70 };

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  function pairsFor(level) { var n = parseInt(level, 10); return (n === 16 || n === 24 ? n : 12) / 2; }
  function symbolDeck(pairs, rng) {
    var pick = shuffle(ICONS.map(function (_, i) { return i; }), rng).slice(0, pairs);
    var off = rng() * 360;
    var cards = [];
    pick.forEach(function (ic, p) {
      var h = Math.round((off + p * 360 / pairs) % 360);
      cards.push({ p: p, ic: ic, h: h }, { p: p, ic: ic, h: h });
    });
    return shuffle(cards, rng);
  }
  function termDeck(items, pairs, rng, lang) {
    var all = shuffle(items, rng), l = lang || 'en';
    var short = all.filter(function (x) { return (x.t[l] || '').length <= 40 && (x.d[l] || '').length <= 48; });
    var pick = short.concat(all.filter(function (x) { return short.indexOf(x) < 0; })).slice(0, pairs);
    var cards = [];
    pick.forEach(function (it, p) {
      cards.push({ p: p, k: 't', tx: it.t }, { p: p, k: 'd', tx: it.d });
    });
    return shuffle(cards, rng);
  }
  function extractCards(html) {
    if (typeof html !== 'string') return null;
    var at = html.indexOf('id="flashcard-data"');
    if (at < 0) return null;
    var s = html.indexOf('>', at), e = html.indexOf('</script>', s);
    if (s < 0 || e < 0) return null;
    try {
      var j = JSON.parse(html.slice(s + 1, e).trim());
      if (Array.isArray(j)) return j;
      if (j && Array.isArray(j.cards)) return j.cards;
    } catch (er) {}
    return null;
  }
  function clean(s) { return typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : ''; }
  function plainOk(s) { return !!s && !/\\\(|\\\[|\$\$|<[a-z\/]|&#?\w+;/i.test(s); }
  var Q_AR = /^(أعط|أعطِ|اعط|وضح|وضّح|بيّن|حدد|حدّد|اكتب|احسب|ارسم|كيف|لماذا|متى|أين|اذكر|عدّد|عدد|قارن|اشرح|صف|هل|كم|من|في|على|أي|أيّ|ما\s+(الفرق|الذي|وظيفة|دور|هدف|الهدف|الغرض|أهمية|فائدة|مكونات|أنواع|خصائص|مزايا|عيوب|سبب|العلاقة))(\s|$)/;
  var Q_EN = /^(how|why|when|where|which|who|whom|whose|name|list|compare|explain|describe|in|on|for|is|are|can|does|do|should|give)\b/i;
  var CORE_AR = /(^(دور|وظيفة|الفرق|هدف|الهدف|الغرض|أهمية|فائدة|مكونات|مكوّنات|أنواع|خصائص|مزايا|عيوب|سبب|العلاقة|التعبير|الأمر|ناتج|نتيجة|قيمة|عدد|الخطوة|الخطوات|تعريف|المخرجات)(\s|$))|\s(في|من|بين|عند|على|إلى|عن|التي|الذي|لأداة)\s/;
  var BAD_EN = /\b(of|in|for|between|used|does|do|with|from|to|when|that|which)\b/i;
  function unq(s) { return s.replace(/^['"‘’“”«»]+|['"‘’“”«»]+$/g, '').replace(/\s*['"‘’“”«»]\s*/g, ' ').replace(/\s+/g, ' ').trim(); }
  function termOf(s, lang) {
    s = clean(s);
    if (!s) return '';
    var m, core;
    if (lang === 'ar') {
      if ((m = /^(?:ما\s+(?:هو|هي|هما|هم)(?:s+تعريف)?|ماذا\s+(?:يعني|تعني|يقصد\s+ب|نعني\s+ب)|ما\s+المقصود\s+ب|ما\s+معنى|عرّ?ف)\s*(.+?)\s*[؟?.]?$/.exec(s))) {
        core = unq(m[1]);
        if (Q_AR.test(core) || CORE_AR.test(core) || core.replace(/\([^)]*\)/g, '').trim().split(/\s+/).length > 5) return '';
        return core;
      }
      return /[؟?]\s*$/.test(s) || Q_AR.test(s) || /^ما(ذا)?\s/.test(s) ? '' : unq(s);
    }
    if ((m = /^(?:what\s+(?:is|are)(?:\s+(?:a|an|the))?|define|what\s+does\s+(.+?)\s+(?:mean|stand\s+for))\s*(.*?)\s*[?.]?$/i.exec(s))) {
      core = unq(m[1] || m[2] || '');
      if (!core || BAD_EN.test(core) || Q_EN.test(core) || core.replace(/\([^)]*\)/g, '').trim().split(/\s+/).length > 5) return '';
      return core;
    }
    return /\?\s*$/.test(s) || Q_EN.test(s) || /^what\b/i.test(s) ? '' : unq(s);
  }
  function usable(arr, lang) {
    var out = [], seenT = {}, seenD = {};
    (arr || []).forEach(function (c) {
      if (!c || !c.front || !c.back || !c.back.definition) return;
      var ta = termOf(c.front.ar, 'ar'), te = termOf(c.front.en, 'en');
      var t = { ar: ta || clean(c.front.ar), en: te || clean(c.front.en) };
      if (!(lang === 'ar' ? ta : te)) return;
      var d = { ar: clean(c.back.definition.ar), en: clean(c.back.definition.en) };
      var tt = t[lang], dd = d[lang];
      if (!plainOk(tt) || !plainOk(dd)) return;
      if (tt.length > LIM.term || dd.length > LIM.def) return;
      var kt = tt.toLowerCase(), kd = dd.toLowerCase();
      if (kt === kd || seenT[kt] || seenD[kd]) return;
      seenT[kt] = 1; seenD[kd] = 1;
      out.push({ t: t, d: d });
    });
    return out;
  }
  function merge(pool, more, lang) {
    var seenT = {}, seenD = {}, added = 0;
    pool.forEach(function (x) { seenT[x.t[lang].toLowerCase()] = 1; seenD[x.d[lang].toLowerCase()] = 1; });
    more.forEach(function (x) {
      var kt = x.t[lang].toLowerCase(), kd = x.d[lang].toLowerCase();
      if (seenT[kt] || seenD[kd] || seenT[kd] || seenD[kt]) return;
      seenT[kt] = 1; seenD[kd] = 1; pool.push(x); added++;
    });
    return added;
  }
  function stars(moves, pairs) { return moves <= pairs * 1.4 ? 3 : moves <= pairs * 2 ? 2 : 1; }
  function validDeck(deck, n) {
    if (!Array.isArray(deck) || deck.length !== n) return false;
    var c = {};
    for (var i = 0; i < deck.length; i++) { var d = deck[i]; if (!d || typeof d.p !== 'number') return false; if (d.k ? !(d.tx && typeof d.tx === 'object') : !ICONS[d.ic]) return false; c[d.p] = (c[d.p] || 0) + 1; }
    return Object.keys(c).every(function (k) { return c[k] === 2; }) && Object.keys(c).length === n / 2;
  }
  function layoutsFor(n, narrow) {
    if (n === 12) return narrow ? [[3, 4], [4, 3]] : [[4, 3]];
    if (n === 16) return [[4, 4]];
    return narrow ? [[4, 6], [6, 4]] : [[6, 4]];
  }
  function pickLayout(n, narrow, bw, avail, gap, a, floor) {
    var best = null;
    layoutsFor(n, narrow).forEach(function (L) {
      var c = L[0], r = L[1];
      var wLim = (bw - (c - 1) * gap) / c;
      var hLim = (avail - (r - 1) * gap) / r * a;
      var cw = Math.max(0, Math.min(wLim, Math.max(hLim, floor)));
      var over = Math.max(0, Math.round(r * cw / a + (r - 1) * gap - avail));
      if (!best || over < best.over - 2 || (Math.abs(over - best.over) <= 2 && cw > best.cw + 0.5)) best = { c: c, r: r, cw: cw, over: over };
    });
    return best;
  }

  function mount(ctx) {
    var t = ctx.t;
    var N = pairsFor(ctx.level) * 2, PAIRS = N / 2;
    var root = document.createElement('div');
    root.className = 'gmem' + (ctx.reduced ? ' gmem--rm' : '');
    ctx.board.appendChild(root);

    var S = null;
    var gen = 0, dead = false, loading = false, paused = false;
    var open = [], flipT = 0, finT = 0, comboT = 0, raf = 0;
    var running = false, startAt = 0;
    var cols = 4, cards = [], grid = null, note = '', resizeRaf = 0, lastKey = { i: -1, at: 0 };

    function pref() { try { return localStorage.getItem(MODE_KEY) === 'terms' ? 'terms' : 'sym'; } catch (e) { return 'sym'; } }
    function setPref(m) { try { localStorage.setItem(MODE_KEY, m); } catch (e) {} }
    var mode = ctx.daily ? 'sym' : pref();

    function lang() { return ctx.isAr() ? 'ar' : 'en'; }
    function txt(o) { if (!o) return ''; var l = lang(); return o[l] || o[l === 'ar' ? 'en' : 'ar'] || ''; }
    function elapsed() { return S ? S.acc + (running ? performance.now() - startAt : 0) : 0; }
    function found() { return S ? S.matched.length / 2 : 0; }

    function renderControls() {
      if (ctx.daily) { ctx.controls.innerHTML = ''; return; }
      var m = mode;
      function b(id, icon, label) {
        var on = m === id;
        return '<button type="button" class="gsf-chip gmem-mode' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-gmem-mode="' + id + '">' +
          '<i class="fa-solid ' + icon + '" aria-hidden="true"></i> ' + label + '</button>';
      }
      ctx.controls.innerHTML = '<div class="gsf-chips gmem-modes" role="group" aria-label="' + t('نوعُ البطاقات', 'Card type') + '">' +
        b('sym', 'fa-shapes', t('رموز', 'Symbols')) + b('terms', 'fa-book-open', t('مصطلحات موادّي', 'My course terms')) + '</div>';
    }

    function paint() {
      if (loading || !S) { ctx.status(''); return; }
      ctx.status('<span class="gm-stat"><small>' + t('أزواج', 'Pairs') + '</small><b>' + found() + '/' + PAIRS + '</b></span>' +
        '<span class="gm-stat"><small>' + t('حركات', 'Moves') + '</small><b>' + S.moves + '</b></span>' +
        '<span class="gm-stat"><small>' + t('الوقت', 'Time') + '</small><b id="gmem-time">' + ctx.fmt('time', elapsed()) + '</b></span>');
    }
    function loop() {
      var el = document.getElementById('gmem-time');
      if (el) { var s = ctx.fmt('time', elapsed()); if (el.textContent !== s) el.textContent = s; }
      if (running) raf = requestAnimationFrame(loop);
    }
    function begin() { if (running || !S || S.done) return; running = true; startAt = performance.now(); raf = requestAnimationFrame(loop); }
    function halt() { if (running) { S.acc += performance.now() - startAt; running = false; } cancelAnimationFrame(raf); }

    function faceHTML(d) {
      if (d.k) {
        var s = txt(d.tx), len = s.length;
        var sz = d.k === 't' ? (len <= 12 ? 'l' : len <= 26 ? 'm' : 's') : (len <= 24 ? 'm' : len <= 46 ? 's' : 'xs');
        return '<small class="gmem-tag">' + (d.k === 't' ? t('مصطلح', 'Term') : t('تعريف', 'Definition')) + '</small>' +
          '<span class="gmem-txt gmem-txt--' + sz + '" dir="auto">' + ctx.esc(s) + '</span>' +
          '<i class="fa-solid fa-check gmem-ok" aria-hidden="true"></i>';
      }
      return '<i class="fa-solid fa-' + ICONS[d.ic][0] + ' gmem-ico" aria-hidden="true"></i><i class="fa-solid fa-check gmem-ok" aria-hidden="true"></i>';
    }
    function faceCls(d) { return 'gmem-face' + (d.k ? ' gmem-face--' + d.k : ''); }
    function label(i) {
      var d = S.deck[i], el = cards[i];
      var up = el && (el.classList.contains('up') || el.classList.contains('ok'));
      var base = t('بطاقة ', 'Card ') + (i + 1);
      if (!up) return base;
      var what = d.k ? (d.k === 't' ? t('مصطلح: ', 'Term: ') : t('تعريف: ', 'Definition: ')) + txt(d.tx) : t(ICONS[d.ic][1], ICONS[d.ic][2]);
      return base + ' — ' + what + (el.classList.contains('ok') ? t(' (مطابَقة)', ' (matched)') : '');
    }
    function relabel(i) { if (cards[i]) cards[i].setAttribute('aria-label', label(i)); }

    function render() {
      var src = S.src && S.src.length ? '<p class="gmem-src"><i class="fa-solid fa-book-open" aria-hidden="true"></i> <span dir="ltr">' + ctx.esc(S.src.join(' + ')) + '</span></p>' : '';
      root.innerHTML = (note ? '<p class="gmem-note" role="status"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> ' + note + '</p>' : '') +
        '<div class="gmem-grid' + (S.mode === 'terms' ? ' gmem-grid--terms' : '') + '" role="group" aria-label="' + t('بطاقاتُ الذاكرة', 'Memory cards') + '">' +
        S.deck.map(function (d, i) {
          var ok = S.matched.indexOf(i) >= 0;
          return '<button type="button" class="gmem-card' + (ok ? ' ok' : '') + '" data-i="' + i + '"' + (d.h != null ? ' style="--h:' + d.h + '"' : '') + '>' +
            '<span class="gmem-in"><span class="gmem-back" aria-hidden="true"><i class="fa-solid fa-seedling" aria-hidden="true"></i></span>' +
            '<span class="' + faceCls(d) + '" aria-hidden="true">' + faceHTML(d) + '</span></span></button>';
        }).join('') + '</div>' +
        '<div class="gmem-combo" aria-hidden="true"></div>' + src;
      grid = root.querySelector('.gmem-grid');
      cards = [].slice.call(grid.querySelectorAll('.gmem-card'));
      cards.forEach(function (_, i) { relabel(i); });
      layout();
      paint();
    }

    function layout() {
      if (!grid || dead) return;
      var narrow = window.innerWidth < 480;
      var bw = Math.min(ctx.board.clientWidth || 340, 680);
      var gap = bw < 420 ? 6 : 10;
      var a = S.mode === 'terms' ? 0.74 : 0.8;
      var top = grid.getBoundingClientRect().top + (window.scrollY || 0);
      var below = 38;
      var nav = document.querySelector('.bottom-nav');
      if (nav && getComputedStyle(nav).display !== 'none') below += nav.offsetHeight;
      var ctl = ctx.controls && ctx.controls.offsetHeight ? ctx.controls.offsetHeight + 14 : 0;
      var floor = S.mode === 'terms' ? 60 : N === 24 ? 58 : 46;
      var L = pickLayout(N, narrow, bw, Math.max(200, window.innerHeight - top - below - ctl), gap, a, floor);
      if (ctl && (L.cw < 64 || L.over > 0)) L = pickLayout(N, narrow, bw, Math.max(200, window.innerHeight - top - below), gap, a, floor);
      cols = L.c;
      var cw = Math.floor(L.cw * 10) / 10;
      root.style.setProperty('--gmem-c', L.c);
      root.style.setProperty('--gmem-g', gap + 'px');
      root.style.setProperty('--gmem-cw', cw + 'px');
      root.style.setProperty('--gmem-a', a === 0.8 ? '4 / 5' : '37 / 50');
      root.style.setProperty('--gmem-w', (cw * L.c + gap * (L.c - 1)) + 'px');
      if (S.mode === 'terms') fit();
    }
    function fit() {
      [].forEach.call(root.querySelectorAll('.gmem-txt'), function (el) {
        el.style.fontSize = '';
        el.classList.remove('gmem-txt--wrap');
        var fs = parseFloat(getComputedStyle(el).fontSize) || 12, guard = 0;
        function over() { return el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 1; }
        while (over() && fs > 8.5 && guard++ < 14) { fs = Math.max(8.5, fs * 0.9); el.style.fontSize = fs + 'px'; }
        if (el.scrollWidth > el.clientWidth + 1) el.classList.add('gmem-txt--wrap');
        el.style.webkitLineClamp = '';
        if (el.scrollHeight > el.clientHeight + 2) el.style.webkitLineClamp = String(Math.max(1, Math.floor(el.clientHeight / (fs * 1.34) - 0.6)));
      });
    }
    function onResize() { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(layout); }

    function persist() {
      if (!S || S.done) return;
      ctx.save({ v: 1, mode: S.mode, deck: S.deck, matched: S.matched, moves: S.moves, elapsed: Math.round(elapsed()), combo: S.combo, bestCombo: S.bestCombo, src: S.src || null });
    }

    function closeOpen() {
      clearTimeout(flipT); flipT = 0;
      open.forEach(function (i) { var el = cards[i]; if (el) { el.classList.remove('up', 'no'); relabel(i); } });
      open = [];
    }
    function showCombo(n) {
      var el = root.querySelector('.gmem-combo'); if (!el) return;
      el.innerHTML = '<i class="fa-solid fa-fire" aria-hidden="true"></i> ' + t('سلسلة', 'Combo') + ' <b class="gm-n">×' + n + '</b>';
      el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
      clearTimeout(comboT); comboT = setTimeout(function () { el.classList.remove('on'); }, 1100);
    }
    function flip(i) {
      if (!S || S.done || loading || paused) return;
      var el = cards[i]; if (!el || el.classList.contains('ok')) return;
      if (open.length === 2) closeOpen();
      if (open.indexOf(i) >= 0) return;
      begin();
      el.classList.add('up'); open.push(i); relabel(i);
      ctx.sound('tap'); ctx.haptic(6);
      if (open.length < 2) return;
      S.moves++;
      var a = open[0], b = open[1];
      if (S.deck[a].p === S.deck[b].p) {
        open = [];
        S.matched.push(a, b);
        S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo);
        [a, b].forEach(function (k) {
          var c = cards[k]; c.classList.remove('up'); c.classList.add('ok');
          if (!ctx.reduced) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
          relabel(k);
        });
        ctx.sound('good'); ctx.haptic(18);
        if (S.combo >= 2) showCombo(S.combo);
        if (S.matched.length === N) return done();
      } else {
        S.combo = 0;
        [a, b].forEach(function (k) { var c = cards[k]; c.classList.remove('no'); void c.offsetWidth; c.classList.add('no'); });
        ctx.haptic(24);
        flipT = setTimeout(closeOpen, 800);
      }
      paint();
      persist();
    }
    function done() {
      S.done = true;
      halt();
      paint();
      ctx.clearSave();
      var st = stars(S.moves, PAIRS);
      var detail = '<span class="gmem-stars" role="img" aria-label="' + st + '/3"><b>' + '★★★'.slice(0, st) + '</b>' + '★★★'.slice(st) + '</span> · ' +
        t('الوقت: ', 'Time: ') + ctx.num(ctx.fmt('time', S.acc)) +
        (S.bestCombo >= 2 ? ' · ' + t('أطولُ سلسلة: ', 'Best combo: ') + ctx.num('×' + S.bestCombo) : '');
      var title = st === 3 ? t('ذاكرةٌ لامعة!', 'Brilliant memory!') : st === 2 ? t('أحسنت!', 'Well done!') : t('وجدتَ كلَّ الأزواج!', 'All pairs found!');
      finT = setTimeout(function () {
        if (dead) return;
        ctx.finish({ won: true, score: S.moves, unit: t('حركة', 'moves'), detail: detail, title: title });
      }, ctx.reduced ? 120 : 520);
    }

    function startDeck(deck, m, src, restore) {
      loading = false;
      open = []; clearTimeout(flipT);
      running = false; cancelAnimationFrame(raf);
      S = { mode: m, deck: deck, matched: [], moves: 0, acc: 0, combo: 0, bestCombo: 0, src: src || null, done: false };
      if (restore) {
        S.matched = (restore.matched || []).filter(function (i) { return typeof i === 'number' && i >= 0 && i < N; });
        S.moves = restore.moves | 0; S.acc = +restore.elapsed || 0; S.combo = restore.combo | 0; S.bestCombo = restore.bestCombo | 0;
      }
      render();
    }
    function showLoading() {
      loading = true;
      ctx.status('');
      root.innerHTML = '<div class="gmem-load" role="status"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>' +
        t('نجمع مصطلحاتٍ من موادّك…', 'Gathering terms from your courses…') + '</span></div>';
      grid = null; cards = [];
    }

    function courseList(GD) {
      var list = [], seen = {};
      function ok(i) { return i && i.code && i.path && i.available !== false && (i.modules | 0) > 0; }
      function add(i) { if (ok(i) && !seen[i.code]) { seen[i.code] = 1; list.push({ code: i.code, path: i.path, modules: i.modules | 0 }); } }
      var sem = null; try { sem = GD.semester && GD.semester(); } catch (e) {}
      ((sem && Array.isArray(sem.courses)) ? sem.courses : []).forEach(function (c) { if (c && c.code) add(GD.courseInfo(c.code)); });
      if (!list.length) (GD.catalogList ? GD.catalogList() : []).forEach(add);
      return list;
    }
    function loadTerms(my) {
      var GD = window.GardenData;
      if (!GD || !GD.ready) return Promise.resolve(null);
      var lg = lang(), site = ctx.base.replace(/shared\/$/, '');
      return GD.ready().then(function () {
        var list = courseList(GD);
        var pool = [], src = [], tried = {}, fetches = 0, spins = 0;
        function step() {
          if (dead || my !== gen) return null;
          if (pool.length >= PAIRS) return { items: pool, src: src };
          if (fetches >= 6 || !list.length || spins > 40) return null;
          spins++;
          var c = list[Math.floor(ctx.rng() * list.length)];
          var m = 1 + Math.floor(ctx.rng() * c.modules), key = c.code + ':' + m;
          if (tried[key]) return step();
          tried[key] = 1; fetches++;
          return fetch(site + c.path + 'M' + pad2(m) + '.html', { credentials: 'same-origin' })
            .then(function (r) { return r.ok ? r.text() : ''; })
            .catch(function () { return ''; })
            .then(function (html) {
              var got = extractCards(html);
              if (got && merge(pool, usable(got, lg), lg) > 0) src.push(c.code + ' · M' + pad2(m));
              return step();
            });
        }
        return step();
      }).catch(function () { return null; });
    }

    function newGame(m) {
      gen++;
      var my = gen;
      clearTimeout(flipT); clearTimeout(finT);
      running = false; cancelAnimationFrame(raf);
      note = '';
      S = null;
      if (m === 'terms') {
        showLoading();
        loadTerms(my).then(function (res) {
          if (dead || my !== gen) return;
          if (res) startDeck(termDeck(res.items, PAIRS, ctx.rng, lang()), 'terms', res.src);
          else {
            note = t('لم نجد في موادّك مصطلحاتٍ قصيرةً تكفي الآن، فهذه جولةٌ بالرموز.', 'Not enough short terms in your courses right now — here is a symbols round.');
            startDeck(symbolDeck(PAIRS, ctx.rng), 'sym', null);
          }
          persist();
        });
      } else {
        startDeck(symbolDeck(PAIRS, ctx.rng), 'sym', null);
      }
    }

    function onClick(e) {
      var mb = e.target.closest('[data-gmem-mode]');
      if (mb && ctx.controls.contains(mb)) {
        var m = mb.getAttribute('data-gmem-mode');
        if (m === mode && !(S && S.mode !== m && !loading)) return;
        mode = m; setPref(m); ctx.clearSave(); renderControls(); newGame(m);
        return;
      }
      var c = e.target.closest('.gmem-card');
      if (!c || !root.contains(c)) return;
      var ci = Number(c.getAttribute('data-i'));
      if (e.detail === 0 && lastKey.i === ci && performance.now() - lastKey.at < 600) return;
      flip(ci);
    }
    root.addEventListener('click', onClick);
    ctx.controls.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    renderControls();
    var saved = ctx.load();
    if (saved && saved.v === 1 && validDeck(saved.deck, N) && (saved.mode === 'sym' || saved.mode === 'terms')) {
      startDeck(saved.deck, saved.mode, saved.src, saved);
    } else {
      newGame(mode);
    }

    return {
      destroy: function () {
        dead = true; running = false;
        cancelAnimationFrame(raf); cancelAnimationFrame(resizeRaf);
        clearTimeout(flipT); clearTimeout(finT); clearTimeout(comboT);
        root.removeEventListener('click', onClick);
        ctx.controls.removeEventListener('click', onClick);
        window.removeEventListener('resize', onResize);
      },
      pause: function () {
        paused = true;
        if (S && !S.done) { halt(); paint(); }
        root.classList.add('gmem--hide');
      },
      resume: function () {
        paused = false;
        root.classList.remove('gmem--hide');
        if (S && !S.done && (S.moves > 0 || open.length)) begin();
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        if (!cards.length) return false;
        var i = cards.indexOf(document.activeElement);
        var d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
        if (d != null) {
          var to;
          if (i < 0) to = 0;
          else { to = i + d; if (to < 0 || to >= cards.length) to = i; if ((d === 1 || d === -1) && Math.floor(to / cols) !== Math.floor(i / cols)) to = i; }
          cards[to].focus();
          return true;
        }
        if ((e.key === 'Enter' || e.key === ' ') && i >= 0) { lastKey = { i: i, at: performance.now() }; flip(i); return true; }
        return false;
      },
      lang: function () {
        renderControls();
        if (loading) { var sp = root.querySelector('.gmem-load span'); if (sp) sp.textContent = t('نجمع مصطلحاتٍ من موادّك…', 'Gathering terms from your courses…'); return; }
        if (!S) return;
        if (note) note = t('لم نجد في موادّك مصطلحاتٍ قصيرةً تكفي الآن، فهذه جولةٌ بالرموز.', 'Not enough short terms in your courses right now — here is a symbols round.');
        var nt = root.querySelector('.gmem-note');
        if (nt) nt.innerHTML = '<i class="fa-solid fa-circle-info" aria-hidden="true"></i> ' + note;
        if (grid) grid.setAttribute('aria-label', t('بطاقاتُ الذاكرة', 'Memory cards'));
        cards.forEach(function (el, i) {
          var f = el.querySelector('.gmem-face');
          if (f && S.deck[i].k) f.innerHTML = faceHTML(S.deck[i]);
          relabel(i);
        });
        layout();
        paint();
      }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>اقلبْ بطاقتين في كلِّ مرّة. إن تطابقتا بقيتا مكشوفتين، وإلا انقلبتا بعد لحظة.</li>' +
        '<li>كلُّ محاولةٍ ببطاقتين حركةٌ واحدة، والأقلُّ أفضل. يبدأ الوقتُ مع أوّل قلبة.</li>' +
        '<li>النجوم: حتى 1.4 حركةٍ لكلِّ زوجٍ ثلاثُ نجوم، وحتى حركتين نجمتان، وما زاد نجمة.</li>' +
        '<li>لا تنتظرْ انقلابَ البطاقتين الخاطئتين: المسْ بطاقةً ثالثةً فتنقلبان فوراً وتبدأ محاولتك التالية.</li>' +
        '<li>التطابقُ المتتالي يصنع سلسلةً تظهر فوق البطاقات.</li>' +
        '<li><b>مصطلحات موادّي</b>: بدل الرموز نأخذ بطاقاتٍ من وحدات موادّ فصلك (أو من كلِّ المواد إن لم تحدّد فصلك)، فيكون الزوجُ مصطلحاً وتعريفَه. تذاكر وأنت تلعب.</li>' +
        '<li>لوحةُ المفاتيح: الأسهمُ للتنقّل بين البطاقات، و<kbd>Enter</kbd> أو <kbd>Space</kbd> للقلب، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>Flip two cards at a time. A match stays face up; otherwise both flip back after a moment.</li>' +
        '<li>Each two-card attempt is one move — fewer is better. The clock starts with your first flip.</li>' +
        '<li>Stars: up to 1.4 moves per pair earns three, up to two moves per pair earns two, otherwise one.</li>' +
        '<li>No need to wait after a miss: tap a third card and the two flip back at once as your next try begins.</li>' +
        '<li>Consecutive matches build a combo shown above the cards.</li>' +
        '<li><b>My course terms</b>: instead of symbols, cards come from the modules of your semester courses (or all courses if you have not set a semester) — each pair is a term and its definition, so you revise while you play.</li>' +
        '<li>Keyboard: arrows move between cards, <kbd>Enter</kbd> or <kbd>Space</kbd> flips, <kbd>P</kbd> pauses.</li></ul>';
  }

  window.GardenGames.register('memory', {
    mount: mount, help: help,
    _t: { termOf: termOf, shuffle: shuffle, symbolDeck: symbolDeck, termDeck: termDeck, extractCards: extractCards, usable: usable, merge: merge, stars: stars, validDeck: validDeck, pickLayout: pickLayout, pairsFor: pairsFor, ICONS: ICONS }
  });
})();
