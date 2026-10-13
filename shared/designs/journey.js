/*@6.JOUJ.1*/
(function () {
  'use strict';
  var root = document.documentElement;
  var G = window.GardenStudy;
  var cards = [], map = {}, cur = null, bar = null, fin = null, io = null, mo = null;
  var ar = function () { return (root.lang || 'ar') !== 'en'; };
  var L = function (a, e) { return ar() ? a : e; };

  function marked(c) { return !!G.get(G.K(c)).d; }
  function known(c) { return G.level(G.K(c), map[G.K(c)]) === 'strong'; }
  function isDone(c) { return marked(c) || known(c); }
  function mins(n) {
    if (!ar()) return n + ' min';
    return n === 1 ? 'دقيقة' : n === 2 ? 'دقيقتان' : n <= 10 ? n + ' دقائق' : n + ' دقيقة';
  }
  function about(n) { return L('نحو ', '~') + (ar() && n === 2 ? 'دقيقتين' : mins(n)); }
  function concepts(n) { return !ar() ? n + ' concepts' : n === 1 ? 'مفهومٍ واحد' : n === 2 ? 'مفهومين' : n <= 10 ? n + ' مفاهيم' : n + ' مفهوماً'; }
  function title(c) {
    var h = c.querySelector('.concept-header .content-target h2') || c.querySelector('.concept-header h2');
    if (!h) return c.id;
    var t = h.cloneNode(true), n = t.querySelector('.concept-number'); if (n) n.remove();
    return t.textContent.trim();
  }
  /*@6.JOUJ.3*/
  var PACE_KEY = 'garden_jr_study', dwell = {}, lastAct = 0, tick = null;
  function baseSeconds(c) { return +c.getAttribute('data-study-s') || 60; }
  function samples() {
    try { var p = JSON.parse(localStorage.getItem(PACE_KEY) || 'null'); if (p && p.s) return p; } catch (e) {}
    return { s: {}, o: [] };
  }
  function save(p) { try { localStorage.setItem(PACE_KEY, JSON.stringify(p)); } catch (e) {} }
  function pace() {
    var p = samples(), sum = 1, n = 1;
    p.o.forEach(function (k) { if (p.s[k] > 0) { sum += p.s[k]; n++; } });
    return { p: Math.max(0.5, Math.min(2.5, sum / n)), n: n - 1 };
  }
  function learn(c) {
    var base = baseSeconds(c), spent = dwell[c.id] || 0, r = spent / base;
    if (spent < 30 || r < 0.25 || r > 4) return;
    var p = samples(), k = G.K(c);
    p.o = p.o.filter(function (x) { return x !== k; }); p.o.push(k); p.s[k] = Math.round(r * 100) / 100;
    while (p.o.length > 30) delete p.s[p.o.shift()];
    save(p);
  }
  function unlearn(c) {
    var p = samples(), k = G.K(c);
    if (!(k in p.s)) return;
    delete p.s[k]; p.o = p.o.filter(function (x) { return x !== k; }); save(p);
  }
  function seconds(c) { return baseSeconds(c) * pace().p; }
  function toMin(s) { return Math.max(1, Math.round(s / 60)); }
  function active() { lastAct = Date.now(); }
  function onTick() {
    if (cur && document.visibilityState === 'visible' && Date.now() - lastAct < 60000) dwell[cur.id] = (dwell[cur.id] || 0) + 5;
  }

  function decorate(c, i) {
    if (!c.querySelector(':scope > .jr-meta')) {
      var m = document.createElement('div'); m.className = 'jr-meta';
      m.innerHTML = '<span class="jr-time"></span><span class="jr-state" aria-hidden="true"></span>';
      var h = c.querySelector(':scope > .concept-header'); if (h) h.after(m); else c.prepend(m);
    }
    if (!c.querySelector(':scope > .jr-next')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'jr-next';
      b.addEventListener('click', function () { if (!marked(c) && known(c)) return; toggle(c, !marked(c)); });
      c.appendChild(b);
    }
  }
  function toggle(c, advance) {
    var was = marked(c);
    if (was) unlearn(c); else learn(c);
    G.set(G.K(c), { d: was ? 0 : 1 });
    if (!was && advance) {
      var nx = cards[cards.indexOf(c) + 1];
      var target = nx || fin;
      if (target) setTimeout(function () {
        var top = target.getBoundingClientRect().top + scrollY - (bar ? bar.offsetHeight : 0) - hdr() - 16;
        window.scrollTo({ top: top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }, 220);
    }
  }
  function hdr() { var h = document.querySelector('.g-header'); return h ? h.offsetHeight : 0; }

  function build() {
    var main = document.querySelector('.main-content'); if (!main) return;
    cards = G.concepts(); map = G.match(cards); G.total(cards.length); G.track(cards, map);
    if (!cards.length) return;
    cards.forEach(decorate);
    if (!bar) {
      bar = document.createElement('nav'); bar.className = 'jr-bar';
      bar.innerHTML = '<div class="jr-now"><span class="jr-idx"></span><span class="jr-title"></span></div><div class="jr-segs"></div><div class="jr-left"><span class="jr-rem"></span><span class="jr-count"></span></div>';
      var top = cards[0]; while (top.parentElement && top.parentElement !== main) top = top.parentElement;   /*@6.JOUJ.4*/
      top.before(bar);
      cards.forEach(function (c) {
        var s = document.createElement('button'); s.type = 'button'; s.className = 'jr-seg'; s.dataset.id = c.id;
        s.addEventListener('click', function () {
          window.scrollTo({ top: c.getBoundingClientRect().top + scrollY - bar.offsetHeight - hdr() - 16, behavior: 'smooth' });
        });
        bar.querySelector('.jr-segs').appendChild(s);
      });
    }
    if (!fin) {
      fin = document.createElement('section'); fin.className = 'jr-finish';
      cards[cards.length - 1].after(fin);
    }
    root.style.setProperty('--jr-top', hdr() + 'px');
  }

  function paint() {
    var left = 0, n = 0, hh = hdr(); if (hh) root.style.setProperty('--jr-top', hh + 'px');
    cards.forEach(function (c, i) {
      var sec = seconds(c), t = toMin(sec), d = isDone(c), byKnow = d && !marked(c);
      if (!d) left += sec; else n++;
      c.classList.toggle('jr-done', d);
      c.classList.toggle('jr-cur', c === cur);
      var tm = c.querySelector('.jr-time'); if (tm) tm.textContent = about(t);
      var st = c.querySelector('.jr-state'); if (st) st.textContent = d ? L('أتممتَه', 'Done') : '';
      var nx = c.querySelector('.jr-next');
      if (nx) {
        var last = i === cards.length - 1;
        nx.textContent = byKnow ? L('✓ أتقنتَه في تصميمٍ آخر', '✓ Known from another design') : d ? L('✓ أتممتَه — اضغط للتراجع', '✓ Done — tap to undo') : (last ? L('أتممتُه — إلى الخلاصة', 'Done — to the wrap-up') : L('أتممتُه — إلى التالي', 'Done — next concept'));
        nx.setAttribute('aria-pressed', String(d));
      }
      var seg = bar && bar.querySelectorAll('.jr-seg')[i];
      if (seg) {
        seg.style.flexGrow = Math.round(sec); seg.className = 'jr-seg' + (d ? ' is-done' : '') + (c === cur ? ' is-cur' : '');
        seg.title = title(c) + ' · ' + mins(t); seg.setAttribute('aria-label', seg.title + (d ? ' · ' + L('أتممتَه', 'done') : ''));
      }
      var a = document.querySelector('.sidebar .toc-link[href="#' + c.id + '"]'); if (a) a.classList.toggle('jr-toc-done', d);
    });
    left = left ? toMin(left) : 0;
    if (bar) {
      var ci = cur ? cards.indexOf(cur) : -1;
      bar.querySelector('.jr-idx').textContent = ci >= 0 ? (ci + 1) + '/' + cards.length : concepts(cards.length);
      bar.querySelector('.jr-title').textContent = ci >= 0 ? title(cur) : L('ابدأ من الأوّل', 'Start at the top');
      var rem = bar.querySelector('.jr-rem');
      rem.textContent = left ? L('بقي ', '') + about(left) + L(' مذاكرة', ' of study left') : L('أتممتَ الوحدة', 'Module finished');
      rem.title = pace().n >= 2 ? L('محسوبٌ على سرعتك في المفاهيم التي أتممتَها', 'Based on your own pace so far') : L('وقتُ مذاكرةٍ لا قراءة: فهمُ الشرح الكامل والرسوم والأمثلة وسؤالِ التفكير', 'Study time, not reading time: the full explanation, diagrams, examples and the thinking question');
      bar.querySelector('.jr-count').textContent = '✓ ' + n;
      bar.querySelector('.jr-count').title = L('مفاهيمُ أتممتَها', 'concepts done');
    }
    if (fin) {
      var all = n === cards.length, pct = Math.round(n / cards.length * 100);
      var fc = document.getElementById('flashcards'), qz = document.getElementById('quiz');
      fin.style.setProperty('--p', pct);
      fin.classList.toggle('is-all', all);
      fin.innerHTML = '<div class="sb-ring" role="img" aria-label="' + pct + '%"><b>' + n + '<small>/' + cards.length + '</small></b></div>' +
        '<div class="jr-fin-body"><h3>' + (all ? L('أتممتَ الوحدة كلَّها', 'You finished the whole module') : L('أتممتَ ' + n + ' من ' + concepts(cards.length), n + ' of ' + cards.length + ' concepts done')) + '</h3>' +
        '<p>' + (all ? L('الآن وقتُ التثبيت — ما يُستعاد يبقى.', 'Now lock it in — what you recall, you keep.') : L('بقي ' + about(left) + '. أو ثبّتْ ما قرأتَه الآن:', about(left) + ' left. Or lock in what you read:')) + '</p>' +
        '<div class="sb-acts">' + (fc ? '<a href="#flashcards">' + L('البطاقات التعليمية', 'Flashcards') + '</a>' : '') + (qz ? '<a href="#quiz" class="go">' + L('اختبر نفسك', 'Test yourself') + '</a>' : '') + '</div></div>';
    }
  }

  function follow() {
    if (io) io.disconnect();
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { cur = e.target; paint(); } });
    }, { rootMargin: '-30% 0px -65% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }
  function onResize() { root.style.setProperty('--jr-top', hdr() + 'px'); }
  function onClick(e) { if (e.target.closest && e.target.closest('.depth-tab')) setTimeout(paint, 60); }

  function mount() {
    if (document.documentElement.getAttribute('data-page') === 'quiz') return;   /*@6.JOUJ.2*/
    build(); if (!cards.length) return;
    paint(); follow(); G.on(paint);
    document.addEventListener('click', onClick);
    mo = new MutationObserver(function () { setTimeout(paint, 80); }); mo.observe(root, { attributes: true, attributeFilter: ['lang'] });
    window.addEventListener('resize', onResize);
    active(); ['scroll', 'pointerdown', 'keydown'].forEach(function (t) { window.addEventListener(t, active, { passive: true }); });
    tick = setInterval(onTick, 5000);
  }
  function unmount() {
    G.off(paint); if (io) io.disconnect(); if (mo) mo.disconnect(); document.removeEventListener('click', onClick); window.removeEventListener('resize', onResize);
    clearInterval(tick); tick = null; ['scroll', 'pointerdown', 'keydown'].forEach(function (t) { window.removeEventListener(t, active); });
    document.querySelectorAll('.jr-bar, .jr-finish, .jr-meta, .jr-next').forEach(function (x) { x.remove(); });
    document.querySelectorAll('.jr-done, .jr-cur').forEach(function (x) { x.classList.remove('jr-done', 'jr-cur'); });
    document.querySelectorAll('.jr-toc-done').forEach(function (x) { x.classList.remove('jr-toc-done'); });
    bar = fin = cur = null; cards = [];
  }
  window.GardenDesigns = window.GardenDesigns || {};
  window.GardenDesigns['journey'] = { mount: mount, unmount: unmount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
