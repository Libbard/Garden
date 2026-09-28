/*@6.WORJ.1*/
(function () {
  'use strict';
  var root = document.documentElement;
  var G = window.GardenStudy, L = G.L, esc = G.esc;
  var cards = [], bar = null, sheet = null, mo = null, tSave = {}, shown = {}, draft = {};
  var MIN = 12, MAX = 1200;                         /*@6.WORJ.2*/

  function words(c) { var k = G.K(c); return k in draft ? draft[k] : (G.get(k).w || ''); }
  function written(c) { return words(c).trim().length >= MIN; }
  function dir() { return G.ar() ? 'rtl' : 'ltr'; }
  function stem(w) { return w.replace(/^[وفبكل](?=ال)/, '').replace(/^ال/, ''); }
  /*@6.WORJ.3*/
  function has(text, term) {
    var t = G.fold(text), m = term.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    return (m ? [m[1], m[2]] : [term]).some(function (p) {
      p = G.fold(p).replace(/\s+/g, ' ').trim(); if (!p) return false;
      var ws = p.split(' ').map(stem).filter(function (w) { return w.length >= 3; });
      return ws.length ? ws.every(function (w) { return t.indexOf(w) >= 0; }) : t.indexOf(p) >= 0;
    });
  }

  function decorate(c) {
    if (c.querySelector(':scope > .ow-box')) return;
    var k = G.K(c), id = 'ow-' + k;
    var box = document.createElement('div'); box.className = 'ow-box';
    box.innerHTML =
      '<div class="ow-head"><label class="ow-k" for="' + esc(id) + '"></label><span class="ow-hint"></span></div>' +
      '<textarea class="ow-ta" id="' + esc(id) + '" rows="2" maxlength="' + MAX + '" spellcheck="true"></textarea>' +
      '<div class="ow-foot"><span class="ow-state" aria-live="polite"></span><button type="button" class="sb-pill ow-cmp"></button></div>' +
      '<div class="ow-model" hidden><div class="ow-mk"></div><p class="ow-sum"></p><div class="ow-terms"></div></div>';
    var ta = box.querySelector('.ow-ta');
    ta.value = words(c); ta.dir = dir();
    var commit = function () { clearTimeout(tSave[k]); if (k in draft) { var v = draft[k]; delete draft[k]; G.set(k, { w: v }); } };
    ta.addEventListener('input', function () {
      draft[k] = ta.value; fit(ta);
      clearTimeout(tSave[k]); tSave[k] = setTimeout(commit, 500);
      paint(c);                                                    /*@6.WORJ.4*/
    });
    ta.addEventListener('blur', commit);
    box.querySelector('.ow-cmp').addEventListener('click', function () {
      if (!written(c)) { ta.focus(); nudge(box); return; }
      shown[k] = !shown[k]; paint(c);
    });
    var tq = c.querySelector(':scope > .thinking-question'); (tq ? tq.before(box) : c.appendChild(box));
    requestAnimationFrame(function () { fit(ta); });
  }
  function fit(ta) { ta.style.blockSize = 'auto'; ta.style.blockSize = Math.max(ta.scrollHeight + 2, 64) + 'px'; }
  function nudge(box) { box.classList.remove('ow-nudge'); void box.offsetWidth; box.classList.add('ow-nudge'); }

  function paint(only) {
    (only && only.nodeType ? [only] : cards).forEach(function (c) {
      var box = c.querySelector(':scope > .ow-box'); if (!box) return;
      var k = G.K(c), w = written(c), open = w && shown[k], ta = box.querySelector('.ow-ta');
      /*@6.WORJ.5*/
      if (!(k in draft) && document.activeElement !== ta && ta.value !== words(c)) { ta.value = words(c); fit(ta); }
      ta.dir = dir();
      box.querySelector('.ow-k').textContent = L('اشرحه بكلماتك', 'Explain it in your own words');
      box.querySelector('.ow-hint').textContent = L('كأنّك تشرحه لصديقٍ لم يقرأه — جملةٌ أو جملتان', 'as if to a friend who has not read it — a sentence or two');
      ta.placeholder = L('بكلماتك أنت، لا بكلمات الصفحة…', 'Your words, not the page’s…');
      box.querySelector('.ow-state').textContent = w ? (k in draft ? L('يُحفظ…', 'Saving…') : L('حُفظ ✓', 'Saved ✓')) : '';
      var b = box.querySelector('.ow-cmp');
      b.textContent = !w ? L('اكتبْ أوّلاً، ثمّ قارِنْ', 'Write first, then compare') : open ? L('أخفِ المقارنة', 'Hide the comparison') : L('قارِنْ بخلاصة الصفحة', 'Compare with the page');
      b.classList.toggle('is-go', w && !open);
      b.setAttribute('aria-expanded', String(!!open));
      box.dataset.state = open ? 'compared' : w ? 'written' : 'empty';
      var m = box.querySelector('.ow-model'); m.hidden = !open;
      if (open) {
        m.querySelector('.ow-mk').textContent = L('خلاصةُ الصفحة', 'The page’s summary');
        m.querySelector('.ow-sum').textContent = G.flash(c);
        var ts = G.terms(c), text = words(c);
        var miss = ts.filter(function (t) { return !has(text, t); }), hit = ts.filter(function (t) { return has(text, t); });
        m.querySelector('.ow-terms').innerHTML = !ts.length ? '' :
          '<span class="ow-tk">' + (miss.length ? L('مصطلحاتٌ لم تستعملها بعد — أيُّها يلزم شرحَك؟', 'Terms you have not used yet — which does your explanation need?') : L('استعملتَ مصطلحاتِ المفهوم كلَّها', 'You used every key term')) + '</span>' +
          miss.map(function (t) { return '<span class="ow-t is-miss"><bdi>' + esc(t) + '</bdi></span>'; }).join('') +
          hit.map(function (t) { return '<span class="ow-t is-hit"><bdi>' + esc(t) + '</bdi></span>'; }).join('');
      }
      c.classList.toggle('ow-done', w);
      var a = document.querySelector('.sidebar .toc-link[href="#' + c.id + '"]'); if (a) a.classList.toggle('ow-toc-done', w);
    });
    paintBar(); paintSheet();
  }
  function count() { return cards.filter(written).length; }

  function paintBar() {
    if (!bar) return;
    var n = count(), all = cards.length;
    bar.querySelector('.sb-lead').textContent = L('اشرحْ كلَّ مفهومٍ بكلماتك — ما تستطيع قولَه بنفسك هو ما فهمتَه. يُحفظ لك ويصل أجهزتك.', 'Explain every concept in your own words — what you can say yourself is what you understood. Saved for you, on all your devices.');
    bar.querySelector('.ow-meter').style.setProperty('--p', all ? n / all * 100 : 0);
    bar.querySelector('.ow-count').innerHTML = L('كتبتَ ', 'Written: ') + '<b class="sb-ltr">' + n + '/' + all + '</b>';
    bar.querySelector('.ow-go').textContent = L('ورقتي ↓', 'My sheet ↓');
  }
  function sheetTitle() { return G.review ? L('المراجعةُ بكلماتي', 'The review in my words') : L('الوحدةُ بكلماتي', 'The module in my words'); }
  function paintSheet() {
    if (!sheet) return;
    var n = count();
    sheet.querySelector('h3').textContent = L('ورقتُك — ', 'Your sheet — ') + (G.review ? L('المراجعةُ بكلماتك', 'the review in your words') : L('الوحدةُ بكلماتك', 'the module in your words'));
    sheet.querySelector('.ow-sh-sub').textContent = n === cards.length ? L('كتبتَ كلَّ المفاهيم. اقرأها بصوتٍ عالٍ قبل الاختبار — ما تعثّرتَ فيه ارجعْ إليه.', 'Every concept is written. Read it aloud before the test — go back to whatever you stumble on.')
      : L('ما لم تكتبه بعدُ مُعلَّمٌ هنا — اضغطه لتعود إليه.', 'Whatever you have not written yet is marked here — tap it to go back.');
    sheet.querySelector('ol').innerHTML = cards.map(function (c, i) {
      var w = written(c);
      return '<li class="' + (w ? 'is-w' : 'is-empty') + '"><a href="#' + esc(c.id) + '" data-go="' + i + '"><span class="ow-n sb-ltr">' + esc(G.num(c, i)) + '</span><b>' + esc(G.title(c)) + '</b>' +
        (w ? '' : '<span class="ow-miss">' + L('اكتبه ←', 'Write it →') + '</span>') + '</a>' + (w ? '<p dir="auto">' + esc(words(c).trim()) + '</p>' : '') + '</li>';
    }).join('');
    var cp = sheet.querySelector('.ow-copy'); if (!cp.dataset.busy) cp.textContent = L('انسخها', 'Copy');
    sheet.querySelector('.ow-print').textContent = L('اطبعها', 'Print');
    sheet.querySelector('.ow-note').textContent = L('احفظها في ملاحظاتي', 'Keep it in My notes');
    sheet.querySelector('.ow-note').title = L('تصير ملاحظةً تحرّرها وتصدّرها PDF', 'Becomes a note you can edit and export as PDF');
    sheet.querySelector('.ow-acts').hidden = !n;
  }
  function done() { return cards.map(function (c, i) { return { c: c, i: i }; }).filter(function (x) { return written(x.c); }); }
  function asText() {
    return G.moduleTitle() + ' — ' + sheetTitle() + '\n\n' + done().map(function (x) { return G.num(x.c, x.i) + '. ' + G.title(x.c) + '\n' + words(x.c).trim(); }).join('\n\n') + '\n';
  }
  function asMarkdown() {
    return '# ' + G.moduleTitle() + ' — ' + sheetTitle() + '\n\n' + done().map(function (x) { return '## ' + G.num(x.c, x.i) + '. ' + G.title(x.c) + '\n\n' + words(x.c).trim(); }).join('\n\n') + '\n';
  }
  function printIt() {
    G.print({
      title: G.moduleTitle(), sub: sheetTitle(), cols: 1, ownFirst: true,
      items: done().map(function (x) { return { n: G.num(x.c, x.i), title: G.title(x.c), own: words(x.c).trim(), sum: G.flash(x.c) }; }),
      foot: L('كتبتُه بنفسي — ما أستطيع قولَه هو ما فهمتُه.', 'Written in my own words — what I can say is what I understood.')
    });
  }

  function build() {
    cards = G.concepts(); if (!cards.length) return;
    G.total(cards.length); G.track(cards, G.match(cards));
    cards.forEach(decorate);
    if (!bar) {
      bar = document.createElement('div'); bar.className = 'sb-panel ow-bar';
      bar.innerHTML = '<p class="sb-lead"></p><div class="sb-row"><span class="ow-meter" aria-hidden="true"></span><span class="ow-count"></span><button type="button" class="sb-pill ow-go"></button></div>';
      bar.querySelector('.ow-go').addEventListener('click', function () { go(sheet); });
      cards[0].before(bar);
    }
    if (!sheet) {
      sheet = document.createElement('section'); sheet.className = 'ow-sheet'; sheet.id = 'ow-sheet';
      sheet.innerHTML = '<h3></h3><p class="ow-sh-sub"></p><ol></ol><div class="sb-row ow-acts"><button type="button" class="sb-pill is-go ow-note"></button><button type="button" class="sb-pill ow-print"></button><button type="button" class="sb-pill ow-copy"></button></div>';
      sheet.querySelector('ol').addEventListener('click', function (e) {
        var a = e.target.closest('a[data-go]'); if (!a) return; e.preventDefault();
        var c = cards[+a.dataset.go]; if (!c) return;
        go(c.querySelector('.ow-box') || c, function () { var t = c.querySelector('.ow-ta'); if (t) t.focus({ preventScroll: true }); });
      });
      sheet.querySelector('.ow-copy').addEventListener('click', function () {
        var b = this, fin = function (ok) { b.dataset.busy = 1; b.textContent = ok ? L('نُسخت ✓', 'Copied ✓') : L('تعذّر النسخ', 'Could not copy'); setTimeout(function () { delete b.dataset.busy; paintSheet(); }, 1600); };
        try { navigator.clipboard.writeText(asText()).then(function () { fin(true); }, function () { fin(false); }); } catch (e) { fin(false); }
      });
      sheet.querySelector('.ow-print').addEventListener('click', printIt);
      sheet.querySelector('.ow-note').addEventListener('click', function () { flushAll(); G.toNotes(asMarkdown()); });
      cards[cards.length - 1].after(sheet);
    }
  }
  function flushAll() { Object.keys(draft).forEach(function (k) { clearTimeout(tSave[k]); G.set(k, { w: draft[k] }); delete draft[k]; }); }
  function go(el, then) {
    if (!el) return;
    var hh = (document.querySelector('.g-header') || { offsetHeight: 0 }).offsetHeight;
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - hh - 20, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (then) setTimeout(then, 450);
  }

  function mount() {
    if (root.getAttribute('data-page') === 'quiz') return;   /*@6.WORJ.6*/
    build(); if (!cards.length) return; paint(); G.on(paint);
    mo = new MutationObserver(function () { setTimeout(function () { paint(); }, 80); }); mo.observe(root, { attributes: true, attributeFilter: ['lang'] });
    window.addEventListener('pagehide', flushAll);
  }
  function unmount() {
    flushAll(); G.off(paint); if (mo) mo.disconnect(); window.removeEventListener('pagehide', flushAll);
    document.querySelectorAll('.ow-box, .ow-bar, .ow-sheet').forEach(function (x) { x.remove(); });
    document.querySelectorAll('.ow-done').forEach(function (x) { x.classList.remove('ow-done'); });
    document.querySelectorAll('.ow-toc-done').forEach(function (x) { x.classList.remove('ow-toc-done'); });
    bar = sheet = null; cards = []; shown = {};
  }
  window.GardenDesigns = window.GardenDesigns || {};
  window.GardenDesigns['words'] = { mount: mount, unmount: unmount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
