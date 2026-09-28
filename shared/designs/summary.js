/*@6.SUMJ.1*/
(function () {
  'use strict';
  var root = document.documentElement;
  var G = window.GardenStudy, L = G.L, esc = G.esc;
  var cards = [], map = {}, head = null, mo = null, grid = null;
  var KINDS = [
    ['.code-block', 'كود', 'code'], ['.svg-diagram, .svg-placeholder', 'مخطّط', 'diagram'],
    ['.comparison-wrapper', 'جدول', 'table'], ['.algo-widget', 'محاكاة', 'simulation']
  ];

  function decorate(c) {
    if (c.querySelector(':scope > .sh-tile')) return;
    var t = document.createElement('div'); t.className = 'sh-tile';
    t.innerHTML = '<div class="sh-own" hidden><i></i><p dir="auto"></p></div><div class="sh-terms"></div>' +
      '<div class="sh-foot"><span class="sh-lv" hidden></span><span class="sh-has"></span><button type="button" class="sb-pill sh-open"></button></div>';
    t.querySelector('.sh-open').addEventListener('click', function () { open(c, !c.classList.contains('sh-is-open'), true); });
    var tq = c.querySelector(':scope > .thinking-question'); (tq ? tq.before(t) : c.appendChild(t));
  }
  function open(c, on, scroll) {
    c.classList.toggle('sh-is-open', on);
    paint();
    /*@6.SUMJ.2*/
    if (on) setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 30);
    if (scroll) {
      var hh = (document.querySelector('.g-header') || { offsetHeight: 0 }).offsetHeight;
      window.scrollTo({ top: c.getBoundingClientRect().top + scrollY - hh - 16, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  function paint() {
    var nT = 0, nF = 0;
    cards.forEach(function (c) {
      var t = c.querySelector(':scope > .sh-tile'); if (!t) return;
      var k = G.K(c), ts = G.terms(c); nT += ts.length;
      nF += c.querySelectorAll(':scope > .formula-block').length;
      t.querySelector('.sh-terms').innerHTML = ts.map(function (x) { return '<span class="sh-term"><bdi>' + esc(x) + '</bdi></span>'; }).join('');
      var w = (G.get(k).w || '').trim(), own = t.querySelector('.sh-own');
      own.hidden = w.length < 12;
      own.querySelector('i').textContent = L('بكلماتك', 'In your words');
      own.querySelector('p').textContent = w;
      var lv = G.level(k, map[k]), chip = t.querySelector('.sh-lv');
      chip.hidden = !G.tone(lv); chip.dataset.tone = G.tone(lv); chip.textContent = G.levelName(lv);
      var isOpen = c.classList.contains('sh-is-open');
      var inside = KINDS.map(function (x) { var n = c.querySelectorAll(':scope > :is(' + x[0] + ')').length; return n ? L(x[1], x[2]) + (n > 1 ? ' ×' + n : '') : ''; }).filter(Boolean);
      t.querySelector('.sh-has').textContent = isOpen || !inside.length ? '' : L('وفي الشرح: ', 'Inside: ') + inside.join(' · ');
      var b = t.querySelector('.sh-open');
      b.textContent = isOpen ? L('اطوِ إلى الخلاصة', 'Fold back') : L('اقرأ الشرح', 'Read it in full');
      b.setAttribute('aria-expanded', String(isOpen));
      b.classList.toggle('is-go', !isOpen);
    });
    if (head) {
      var allOpen = cards.every(function (c) { return c.classList.contains('sh-is-open'); });
      head.querySelector('.sh-h').textContent = G.review ? L('المراجعةُ في ورقةٍ واحدة', 'The review on one sheet') : L('الوحدةُ في ورقةٍ واحدة', 'The module on one sheet');
      head.querySelector('.sh-sub').textContent = L('خلاصةُ كلِّ مفهومٍ ومصطلحاتُه وصيغُه — راجعْها في دقائق، وافتحْ ما تحتاج شرحَه.', 'Every concept’s summary, terms and formulas — review it in minutes, open what you need explained.');
      head.querySelector('.sh-stats').innerHTML =
        stat(cards.length, L('مفهوماً', 'concepts')) + stat(nT, L('مصطلحاً', 'terms')) + (nF ? stat(nF, L('صيغة', 'formulas')) : '');
      var a = head.querySelector('.sh-all'); a.textContent = allOpen ? L('اطوِ الكلّ', 'Fold all') : L('افتح الكلّ', 'Open all'); a.setAttribute('aria-pressed', String(allOpen));
      head.querySelector('.sh-print').textContent = L('اطبع الورقة', 'Print the sheet');
    }
  }
  function stat(n, w) { return '<span class="sh-stat"><b class="sb-ltr">' + n + '</b> ' + w + '</span>'; }

  /*@6.SUMJ.3*/
  function printIt() {
    G.print({
      title: G.moduleTitle(), cols: 2, legend: true,
      foot: L('راجِعْ ما لم تُتقنه أوّلاً — ثمّ افتح شرحَه في الصفحة.', 'Review what you have not mastered first — then open its explanation on the page.'),
      sub: G.review ? L('المراجعةُ في ورقةٍ واحدة', 'The review on one sheet') : L('الوحدةُ في ورقةٍ واحدة — كلُّ المفاهيم', 'The module on one sheet — every concept'),
      items: cards.map(function (c, i) {
        var k = G.K(c), w = (G.get(k).w || '').trim(), ts = G.terms(c), lv = G.level(k, map[k]);
        var f = Array.prototype.map.call(c.querySelectorAll(':scope > .formula-block'), function (fb) {
          var cap = fb.querySelector('.content-target'), mb = fb.querySelector('.math-block');
          return '<div class="f">' + (cap && cap.textContent.trim() ? '<span class="cap">' + esc(cap.textContent.trim()) + '</span>' : '') + (mb ? mb.innerHTML : '') + '</div>';
        }).join('');
        return { n: G.num(c, i), title: G.title(c), lv: G.tone(lv) ? lv : '', sum: G.flash(c), formulas: f, terms: ts, own: w.length >= 12 ? w : '' };
      })
    });
  }

  function build() {
    cards = G.concepts(); if (!cards.length) return;
    map = G.match(cards); G.total(cards.length); G.track(cards, map);
    grid = cards[0].parentElement; grid.classList.add('sh-grid');       /*@6.SUMJ.4*/
    cards.forEach(decorate);
    if (!head) {
      head = document.createElement('div'); head.className = 'sb-panel sh-head';
      head.innerHTML = '<div class="sh-h-row"><div><p class="sh-h"></p><p class="sh-sub"></p></div><div class="sh-stats"></div></div>' +
        '<div class="sb-row"><button type="button" class="sb-pill sh-all"></button><button type="button" class="sb-pill sh-print"></button></div>';
      head.querySelector('.sh-all').addEventListener('click', function () {
        var all = cards.every(function (c) { return c.classList.contains('sh-is-open'); });
        cards.forEach(function (c) { c.classList.toggle('sh-is-open', !all); }); paint();
        if (!all) setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 30);
      });
      head.querySelector('.sh-print').addEventListener('click', printIt);
      cards[0].before(head);
    }
    root.classList.add('sh-on');
  }
  /*@6.SUMJ.5*/
  function onHash() { var c = location.hash && document.getElementById(location.hash.slice(1)); if (c && cards.indexOf(c) >= 0 && !c.classList.contains('sh-is-open')) open(c, true, false); }

  function mount() {
    if (root.getAttribute('data-page') === 'quiz') return;   /*@6.SUMJ.6*/
    build(); if (!cards.length) return; paint(); G.on(paint);
    mo = new MutationObserver(function () { setTimeout(paint, 80); }); mo.observe(root, { attributes: true, attributeFilter: ['lang'] });
    window.addEventListener('hashchange', onHash);
  }
  function unmount() {
    G.off(paint); if (mo) mo.disconnect(); window.removeEventListener('hashchange', onHash);
    document.querySelectorAll('.sh-tile, .sh-head').forEach(function (x) { x.remove(); });
    document.querySelectorAll('.sh-is-open').forEach(function (x) { x.classList.remove('sh-is-open'); });
    root.classList.remove('sh-on'); if (grid) grid.classList.remove('sh-grid');
    head = grid = null; cards = [];
  }
  window.GardenDesigns = window.GardenDesigns || {};
  window.GardenDesigns['summary'] = { mount: mount, unmount: unmount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
