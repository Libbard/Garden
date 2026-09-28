/*@6.RECJ.1*/
(function () {
  'use strict';
  var root = document.documentElement;
  var G = window.GardenStudy;
  var cards = [], map = {}, bar = null, mo = null;
  var ar = function () { return (root.lang || 'ar') !== 'en'; };
  var L = function (a, e) { return ar() ? a : e; };
  var TONES = [[1, 'تذكّرتُه', 'Recalled'], [3, 'جزئيّاً', 'Partly'], [5, 'لم أتذكّر', 'Missed']];

  function rate(c) { return G.get(G.K(c)).r || 0; }
  function lv(c) { return G.level(G.K(c), map[G.K(c)]); }
  function question(c) {
    var tp = c.querySelector('.thinking-question summary template.content-' + (ar() ? 'ar' : 'en'));
    var t = tp ? tp.content.textContent : ((c.querySelector('.thinking-question summary .content-target') || {}).textContent || '');
    return t.trim();
  }

  function decorate(c) {
    var h = c.querySelector(':scope > .concept-header');
    if (!c.querySelector(':scope > .rc-prime') && question(c)) {
      var p = document.createElement('div'); p.className = 'rc-prime';
      p.innerHTML = '<span class="rc-k"></span><p class="rc-q"></p>';
      (h ? h.after(p) : c.prepend(p));
    }
    if (!c.querySelector(':scope > .rc-tools')) {
      var tl = document.createElement('div'); tl.className = 'rc-tools';
      tl.innerHTML = '<button type="button" class="sb-pill rc-cover"></button><span class="rc-chip" hidden></span>';
      tl.querySelector('.rc-cover').addEventListener('click', function () { cover(c, !covered(c)); });
      var tabs = c.querySelector(':scope > .depth-tabs'); (tabs ? tabs.after(tl) : (h ? h.after(tl) : c.prepend(tl)));
    }
    if (!c.querySelector(':scope > .rc-reveal')) {
      var rv = document.createElement('button'); rv.type = 'button'; rv.className = 'rc-reveal';
      rv.addEventListener('click', function () { cover(c, false); });
      c.querySelector(':scope > .rc-tools').after(rv);
    }
    if (!c.querySelector(':scope > .rc-rate')) {
      var r = document.createElement('div'); r.className = 'rc-rate'; r.hidden = true;
      r.innerHTML = '<span class="rc-rate-q"></span>' + TONES.map(function (t) { return '<button type="button" class="sb-pill" data-tone="' + t[0] + '"></button>'; }).join('');
      r.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-tone]'); if (!b) return;
        r.hidden = true; G.set(G.K(c), { r: +b.dataset.tone });
      });
      var tq = c.querySelector(':scope > .thinking-question'); (tq ? tq.before(r) : c.appendChild(r));
    }
  }
  function covered(c) { return !c.classList.contains('rc-shown'); }
  /*@6.RECJ.2*/
  function cover(c, on, bulk) {
    c.classList.toggle('rc-shown', !on);
    var r = c.querySelector('.rc-rate'); if (r) r.hidden = on || (bulk && !!rate(c));
    paint();
  }

  function paint() {
    var n = { 1: 0, 3: 0, 5: 0 };
    cards.forEach(function (c) {
      var q = question(c), pr = c.querySelector('.rc-prime');
      if (pr) { pr.querySelector('.rc-k').textContent = L('قبل أن تقرأ، فكّر', 'Before you read, ask yourself'); pr.querySelector('.rc-q').textContent = q; }
      var cv = c.querySelector('.rc-cover'), on = covered(c);
      cv.textContent = on ? L('اكشف النصّ', 'Show the text') : L('غطِّ النصّ واستذكِر', 'Cover & recall');
      cv.setAttribute('aria-pressed', String(on));
      c.querySelector('.rc-reveal').textContent = L('حاوِل أن تشرحه لنفسك… ثمّ اضغط لتكشف', 'Explain it to yourself… then tap to reveal');
      var rr = c.querySelector('.rc-rate');
      rr.querySelector('.rc-rate-q').textContent = L('هل تذكّرتَه؟', 'Did you recall it?');
      rr.querySelectorAll('button').forEach(function (b) { var t = TONES.filter(function (x) { return x[0] === +b.dataset.tone; })[0]; b.textContent = L(t[1], t[2]); });
      var tone = rate(c), chip = c.querySelector('.rc-chip'), v = G.tone(lv(c));
      if (tone) { n[tone]++; chip.hidden = false; chip.dataset.tone = tone; chip.textContent = L(TONES.filter(function (x) { return x[0] === tone; })[0][1], TONES.filter(function (x) { return x[0] === tone; })[0][2]); }
      else chip.hidden = true;
      if (v) c.dataset.rc = v; else delete c.dataset.rc;
      var a = document.querySelector('.sidebar .toc-link[href="#' + c.id + '"]'); if (a) { if (v) a.dataset.rc = v; else delete a.dataset.rc; }
    });
    if (bar) {
      var all = cards.every(covered);
      var weak = cards.filter(function (c) { var x = lv(c); return x === 'weak' || x === 'shaky'; });
      bar.querySelector('.rc-all').textContent = all ? L('اكشف كلَّ المفاهيم', 'Uncover all') : L('غطِّ الوحدةَ كلَّها واختبر نفسك', 'Cover the whole module');
      bar.querySelector('.rc-all').setAttribute('aria-pressed', String(all));
      bar.querySelector('.rc-sum').innerHTML =
        '<span data-tone="1">' + n[1] + ' ' + L('تذكّرتَها', 'recalled') + '</span><span data-tone="3">' + n[3] + ' ' + L('جزئيّاً', 'partly') + '</span><span data-tone="5">' + n[5] + ' ' + L('لم تتذكّرها', 'missed') + '</span>';
      var wk = bar.querySelector('.rc-weak'); wk.hidden = !weak.length;
      wk.textContent = L('راجع الأضعف', 'Review the weakest');
      wk.onclick = function () {
        var t = weak.sort(function (a, b) { return (G.tone(lv(b)) || 0) - (G.tone(lv(a)) || 0); })[0];
        if (t) { cover(t, true); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      };
      bar.querySelector('.rc-lead').textContent = L('اقرأ، ثمّ غطِّ واستذكِر — ما تستعيده بنفسك يبقى.', 'Read, then cover and recall — what you retrieve, you keep.');
    }
  }

  function build() {
    var main = document.querySelector('.main-content'); if (!main) return;
    cards = G.concepts(); map = G.match(cards); G.total(cards.length); G.track(cards, map);
    if (!cards.length) return;
    cards.forEach(decorate);
    if (!bar) {
      bar = document.createElement('div'); bar.className = 'sb-panel rc-bar';
      bar.innerHTML = '<p class="sb-lead rc-lead"></p><div class="sb-row"><button type="button" class="sb-pill is-go rc-all"></button><div class="rc-sum"></div><button type="button" class="sb-pill rc-weak" hidden></button></div>';
      bar.querySelector('.rc-all').addEventListener('click', function () {
        var all = cards.every(covered);
        cards.forEach(function (c) { if (covered(c) === all) cover(c, !all, true); });
        paint();
      });
      cards[0].before(bar);
    }
  }
  function mount() {
    if (document.documentElement.getAttribute('data-page') === 'quiz') return;   /*@6.RECJ.3*/
    build(); if (!cards.length) return;
    paint(); G.on(paint);
    mo = new MutationObserver(function () { setTimeout(paint, 80); }); mo.observe(root, { attributes: true, attributeFilter: ['lang'] });
  }
  function unmount() {
    G.off(paint); if (mo) mo.disconnect();
    document.querySelectorAll('.rc-prime, .rc-tools, .rc-reveal, .rc-rate, .rc-bar').forEach(function (x) { x.remove(); });
    document.querySelectorAll('.rc-shown').forEach(function (x) { x.classList.remove('rc-shown'); });
    document.querySelectorAll('[data-rc]').forEach(function (x) { delete x.dataset.rc; });
    bar = null; cards = [];
  }
  window.GardenDesigns = window.GardenDesigns || {};
  window.GardenDesigns['recall'] = { mount: mount, unmount: unmount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
