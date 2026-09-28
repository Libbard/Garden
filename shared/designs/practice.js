/*@6.PRAJ.1*/
(function () {
  'use strict';
  var root = document.documentElement;
  var G = window.GardenStudy, L = G.L, esc = G.esc;
  var cards = [], deck = [], own = {}, back = {}, bar = null, end = null, mo = null, openQ = {};
  var GRADES = [[0, 'لم أتذكر', 'Blackout'], [2, 'صعب', 'Hard'], [3, 'جيد', 'Good'], [4, 'ممتاز', 'Very Good'], [5, 'سهل', 'Easy']]   /*@6.PRAJ.2*/

  function pick(o) { return !o ? '' : typeof o === 'string' ? o : (o[G.ar() ? 'ar' : 'en'] || o.ar || o.en || ''); }
  function ok(s) { return s && s.g >= 3; }

  /*@6.PRAJ.3*/
  function spacing() {
    back = {}; var used = {};
    cards.forEach(function (c, i) {
      if (i < 2) return;
      var pool = [];
      cards.slice(0, i - 1).forEach(function (p) { own[G.K(p)].forEach(function (d) { if (!used[d]) pool.push({ d: d, from: p }); }); });
      if (!pool.length) return;
      var rank = function (x) { var s = G.cardState(x.d); return !s ? 2 : !ok(s) ? 0 : s.due ? 1 : 3; };
      pool.sort(function (a, b) { return rank(a) - rank(b); });
      back[G.K(c)] = pool[0]; used[pool[0].d] = 1;
    });
  }

  function qEl(i, from) {
    var q = document.createElement('div'); q.className = 'pr-q'; q.dataset.card = i;
    if (from) { q.classList.add('is-back'); q.dataset.from = cards.indexOf(from); }
    q.innerHTML = (from ? '<span class="pr-from"></span>' : '') + '<p class="pr-front" dir="auto"></p>' +
      '<button type="button" class="sb-pill pr-show"></button>' +
      '<div class="pr-ans" hidden><p class="pr-def" dir="auto"></p><p class="pr-ex" dir="auto"></p>' +
      '<p class="pr-gq"></p><div class="sm2-grades pr-grade">' +
      GRADES.map(function (g) { return '<button type="button" class="sm2-btn sm2-btn--' + g[0] + '" data-g="' + g[0] + '" data-i18n="fc.grade.' + g[0] + '"></button>'; }).join('') +
      '</div></div>' +
      '<div class="pr-res" hidden><span class="pr-chip"></span><button type="button" class="pr-again"></button></div>';
    q.querySelector('.pr-show').addEventListener('click', function () {
      openQ[i] = 1; paint(); var g = q.querySelector('.pr-grade [data-g="3"]'); if (g) g.focus({ preventScroll: true });
    });
    q.querySelector('.pr-grade').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-g]'); if (!b) return;
      delete openQ[i]; G.grade(i, +b.dataset.g);                 /*@6.PRAJ.4*/
      if (!(window.Garden && Garden.fcGradeAt) || G.review) paint();
    });
    q.querySelector('.pr-again').addEventListener('click', function () {
      openQ[i] = 'again'; paint(); q.querySelector('.pr-show').focus({ preventScroll: true });
    });
    return q;
  }
  function decorate(c) {
    if (c.querySelector(':scope > .pr-box')) return;
    var list = own[G.K(c)], bk = back[G.K(c)];
    if (!list.length && !bk) return;
    var box = document.createElement('div'); box.className = 'pr-box';
    box.innerHTML = '<div class="pr-k"><span class="pr-t"></span><span class="pr-n"></span></div>';
    list.forEach(function (i) { box.appendChild(qEl(i)); });
    if (bk) box.appendChild(qEl(bk.d, bk.from));
    var tq = c.querySelector(':scope > .thinking-question'); (tq ? tq.before(box) : c.appendChild(box));
  }
  function paintQ(q) {
    var i = +q.dataset.card, d = deck[i]; if (!d) return;
    var s = G.cardState(i), st = openQ[i], openA = st === 1, answered = s && st !== 'again';
    var fr = q.querySelector('.pr-from');
    if (fr) { var p = cards[+q.dataset.from]; fr.textContent = L('مراجعة · من المفهوم ', 'Review · from concept ') + (p ? G.num(p, cards.indexOf(p)) : ''); }
    q.querySelector('.pr-front').textContent = pick(d.front);
    var sh = q.querySelector('.pr-show'); sh.hidden = openA || answered; sh.textContent = L('فكّرْ في الجواب… ثمّ اكشفه', 'Think of the answer… then reveal it');
    q.querySelector('.pr-ans').hidden = !openA;
    q.querySelector('.pr-def').textContent = pick(d.back && d.back.definition);
    var ex = pick(d.back && d.back.example), exEl = q.querySelector('.pr-ex');
    exEl.hidden = !ex; exEl.textContent = ex ? L('مثال: ', 'Example: ') + ex : '';
    q.querySelector('.pr-gq').textContent = L('كيف كان تذكّرُك؟ — يُسجَّل في بطاقاتك التعليميّة', 'How well did you recall it? — saved to your flashcards');
    q.querySelectorAll('.pr-grade button').forEach(function (b) { var g = GRADES.filter(function (x) { return x[0] === +b.dataset.g; })[0]; b.textContent = L(g[1], g[2]); });
    var rs = q.querySelector('.pr-res'); rs.hidden = !answered || openA;
    if (answered) {
      var chip = rs.querySelector('.pr-chip'), g = GRADES.filter(function (x) { return x[0] === s.g; })[0];
      chip.dataset.tone = ok(s) ? 1 : s.g === 2 ? 3 : 5;
      chip.textContent = (g ? L(g[1], g[2]) : '') + (ok(s) ? '' : L(' — سيعود إليك', ' — it will come back')) + (s.due ? L(' · حان موعدُها في البطاقات', ' · due in your flashcards') : '');
      rs.querySelector('.pr-again').textContent = L('أعِدْه', 'Try again');
    }
    q.dataset.r = answered ? (ok(s) ? 1 : 5) : '';
  }
  function paint() {
    document.querySelectorAll('.pr-q').forEach(paintQ);
    var total = deck.length, done = 0, right = 0, missed = [];
    deck.forEach(function (d, i) { var s = G.cardState(i); if (s) { done++; if (ok(s)) right++; else missed.push(i); } });
    cards.forEach(function (c) {
      var k = G.K(c), box = c.querySelector(':scope > .pr-box');
      if (box) {
        var n = own[k].length + (back[k] ? 1 : 0);
        box.querySelector('.pr-t').textContent = L('تمرّنْ', 'Practise');
        box.querySelector('.pr-n').textContent = G.ar() ? (n === 1 ? 'سؤالٌ واحد' : n === 2 ? 'سؤالان' : n + ' أسئلة') : n + (n === 1 ? ' question' : ' questions');
      }
      var v = G.tone(G.level(k, own[k])), a = document.querySelector('.sidebar .toc-link[href="#' + c.id + '"]');
      if (a) { if (v) a.dataset.pr = v; else delete a.dataset.pr; }
      if (v) c.dataset.pr = v; else delete c.dataset.pr;
    });
    if (bar) {
      bar.querySelector('.sb-lead').textContent = L('تمرّنْ وأنت تقرأ: بعد كلِّ مفهومٍ أسئلتُه من بطاقات ' + (G.review ? 'المراجعة' : 'الوحدة') + '، وتقديرُك يُسجَّل فيها — وما أخطأتَ فيه يعود إليك بعد مفهومين.',
        'Practise as you read: each concept ends with its questions from the ' + (G.review ? 'review' : 'module') + ' deck, your grade goes into your flashcards — and what you miss comes back two concepts later.');
      bar.querySelector('.pr-dots').innerHTML = deck.map(function (d, i) { var s = G.cardState(i); return '<i' + (s ? ' data-tone="' + (ok(s) ? 1 : 5) + '"' : '') + '></i>'; }).join('');
      bar.querySelector('.pr-stat').innerHTML = L('أجبتَ ', 'Answered ') + '<b class="sb-ltr">' + done + '/' + total + '</b>' + (done ? ' · ' + L('أصبتَ ', 'right ') + '<b class="sb-ltr">' + right + '</b>' : '');
      var fx = bar.querySelector('.pr-fix'); fx.hidden = !missed.length; fx.textContent = L('أعِدْ ما أخطأتَ فيه', 'Retry what you missed') + ' (' + missed.length + ')';
    }
    if (end) {
      end.style.setProperty('--p', total ? Math.round(right / total * 100) : 0);
      end.querySelector('.sb-ring b').innerHTML = right + '<small>/' + total + '</small>';
      end.querySelector('.sb-ring').setAttribute('aria-label', L('أصبتَ ', 'Right: ') + right + '/' + total);
      end.querySelector('h3').textContent = !done ? L('حصيلةُ التمرين', 'Your practice') : done < total ? L('أجبتَ ' + done + ' من ' + total, done + ' of ' + total + ' answered') : missed.length ? L('أتممتَ الأسئلة — وبقي ما يستحقّ الإعادة', 'All answered — some are worth another go') : L('أصبتَ في كلِّ الأسئلة', 'Every question right');
      end.querySelector('.pr-missed').innerHTML = missed.length ? '<li class="pr-mh">' + L('أخطأتَ في:', 'You missed:') + '</li>' + missed.map(function (i) { return '<li><a href="#" data-card="' + i + '" dir="auto">' + esc(pick(deck[i].front)) + '</a></li>'; }).join('') : '';
      var fc = document.getElementById('flashcards'), qz = document.getElementById('quiz');
      end.querySelector('.sb-acts').innerHTML = (fc ? '<a href="#flashcards">' + L('البطاقات التعليمية', 'Flashcards') + '</a>' : '') + (qz ? '<a href="#quiz" class="go">' + L('اختبر نفسك', 'Test yourself') + '</a>' : '');
    }
  }
  function goTo(i) {
    var q = document.querySelector('.pr-q[data-card="' + i + '"]'); if (!q) return;
    openQ[i] = 'again'; paint();
    var hh = (document.querySelector('.g-header') || { offsetHeight: 0 }).offsetHeight;
    window.scrollTo({ top: q.getBoundingClientRect().top + scrollY - hh - 90, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    setTimeout(function () { q.querySelector('.pr-show').focus({ preventScroll: true }); }, 450);
  }

  function build() {
    cards = G.concepts(); deck = G.deck();
    if (!cards.length || !deck.length) { cards = []; return; }
    own = G.match(cards); G.total(cards.length); G.track(cards, own); spacing();
    cards.forEach(decorate);
    if (!bar) {
      bar = document.createElement('div'); bar.className = 'sb-panel pr-bar';
      bar.innerHTML = '<p class="sb-lead"></p><div class="pr-dots" aria-hidden="true"></div><div class="sb-row"><span class="pr-stat"></span><button type="button" class="sb-pill pr-fix" hidden></button></div>';
      bar.querySelector('.pr-fix').addEventListener('click', function () {
        for (var i = 0; i < deck.length; i++) { var s = G.cardState(i); if (s && !ok(s)) { goTo(i); return; } }
      });
      cards[0].before(bar);
    }
    if (!end) {
      end = document.createElement('section'); end.className = 'pr-end';
      end.innerHTML = '<div class="sb-ring" role="img"><b></b></div><div class="pr-end-body"><h3></h3><ul class="pr-missed"></ul><div class="sb-acts"></div></div>';
      end.querySelector('.pr-missed').addEventListener('click', function (e) { var a = e.target.closest('a[data-card]'); if (!a) return; e.preventDefault(); goTo(a.dataset.card); });
      cards[cards.length - 1].after(end);
    }
  }

  function mount() {
    if (root.getAttribute('data-page') === 'quiz') return;   /*@6.PRAJ.5*/
    build(); if (!cards.length) return; paint(); G.on(paint);
    mo = new MutationObserver(function () { setTimeout(paint, 80); }); mo.observe(root, { attributes: true, attributeFilter: ['lang'] });
  }
  function unmount() {
    G.off(paint); if (mo) mo.disconnect();
    document.querySelectorAll('.pr-box, .pr-bar, .pr-end').forEach(function (x) { x.remove(); });
    document.querySelectorAll('[data-pr]').forEach(function (x) { delete x.dataset.pr; });
    bar = end = null; cards = []; deck = []; own = {}; back = {}; openQ = {};
  }
  window.GardenDesigns = window.GardenDesigns || {};
  window.GardenDesigns['practice'] = { mount: mount, unmount: unmount, _own: function () { return own; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
