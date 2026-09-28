/*@6.STCJ.1*/
(function () {
  'use strict';
  if (window.GardenStudy) return;
  var root = document.documentElement;
  var SUBJ = root.getAttribute('data-subject') || '';
  var MOD = root.getAttribute('data-module') || '';
  var OK = /^[A-Z0-9]+$/.test(SUBJ) && /^(\d+|review)$/.test(MOD);
  var KEY = OK ? 'garden_' + SUBJ + '_m' + MOD + '_study' : 'garden_study:' + location.pathname;
  var REVIEW = MOD === 'review';
  var subs = [];

  function ar() { return (root.lang || 'ar') !== 'en'; }
  function L(a, e) { return ar() ? a : e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function readKey(k) {
    try { var o = JSON.parse(localStorage.getItem(k) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; }
  }
  function data() { var o = readKey(KEY); if (!o.c || typeof o.c !== 'object') o.c = {}; return o; }
  function write(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} emit(); }
  function emit() { settle(); subs.slice().forEach(function (f) { try { f(); } catch (e) {} }); }
  /*@6.STCJ.2*/
  var tracked = null;
  function track(list, m) { tracked = { list: list, map: m }; settle(); }
  function settle() {
    if (!tracked) return;
    var o = data(), changed = false;
    tracked.list.forEach(function (c) {
      var k = K(c), kv = level(k, tracked.map[k]) === 'strong' ? 1 : 0, r = o.c[k];
      if ((r ? r.k || 0 : 0) === kv) return;
      if (!r) r = o.c[k] = { d: 0, r: 0, w: '' };
      r.k = kv; r.t = Date.now(); changed = true;
    });
    if (changed) try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }

  /*@6.STCJ.3*/
  function fromModules(cid) {
    var best = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k === KEY || k.indexOf('garden_' + SUBJ + '_m') !== 0 || !/_m\d+_study$/.test(k)) continue;
        var r = (readKey(k).c || {})[cid];
        if (r && (r.t || 0) >= (best.t || 0)) best = r;
      }
    } catch (e) {}
    return best;
  }
  function get(cid) {
    var own = data().c[cid] || {};
    if (!REVIEW) return own;
    var m = fromModules(cid), out = {};
    ['d', 'r', 'w'].forEach(function (f) { out[f] = own[f] || m[f] || (f === 'w' ? '' : 0); });
    out.t = Math.max(own.t || 0, m.t || 0);
    return out;
  }
  function set(cid, patch) {
    var o = data(), r = o.c[cid] || { d: 0, r: 0, w: '' };
    Object.keys(patch).forEach(function (k) { r[k] = patch[k]; });
    r.t = Date.now(); o.c[cid] = r; write(o);
  }
  function total(n) { var o = data(); if (o.n !== n) { o.n = n; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} } }
  function on(f) { subs.push(f); }
  function off(f) { subs = subs.filter(function (x) { return x !== f; }); }
  window.addEventListener('storage', function (e) { if (!e.key || e.key === KEY || /_fc$/.test(e.key)) emit(); });
  window.addEventListener('garden:syncCompleted', function () { setTimeout(emit, 0); });
  document.addEventListener('garden:cardsReviewed', function () { setTimeout(emit, 0); });

  /*@6.STCJ.4*/
  var deckCache = null;
  function deck() {
    if (deckCache) return deckCache;
    var el = document.getElementById('flashcard-data');
    try { deckCache = el ? JSON.parse(el.textContent) : []; } catch (e) { deckCache = []; }
    return deckCache;
  }
  function sm2() {
    if (window.Garden && Garden.fcState) { try { return Garden.fcState().sm2 || {}; } catch (e) {} }
    return OK ? readKey('garden_' + SUBJ + '_m' + MOD + '_fc') : {};
  }
  /*@6.STCJ.5*/
  function cardState(i) {
    if (REVIEW || !(window.Garden && Garden.fcGradeAt)) { var p = (data().p || {})[i]; return p ? { g: p.g, due: false } : null; }
    var s = sm2()[i];
    if (!s || !s.n && s.lastGrade == null) return null;
    return { g: s.lastGrade != null ? s.lastGrade : (s.interval >= 21 ? 5 : 3), due: s.nextReview && s.nextReview <= Date.now(), strong: s.interval >= 21 };
  }
  function grade(i, g) {
    if (!REVIEW && window.Garden && Garden.fcGradeAt && Garden.fcGradeAt(i, g)) return;
    var o = data(); o.p = o.p || {}; o.p[i] = { g: g, t: Date.now() }; write(o);
  }

  /*@6.STCJ.6*/
  var STOP = ' what which does with that this from have when into than then them they their there these those also only such used uses using each other more most many much very will would should could about between after before where while being been were your yours ';
  function fold(s) { return String(s).toLowerCase().replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي'); }
  function toks(s) {
    return fold(s).split(/[^a-z0-9\u0621-\u064A]+/).map(function (w) { return w.replace(/^(?:[وفبكل])?ال/, ''); })
      .filter(function (w) { return w.length >= 4 && STOP.indexOf(' ' + w + ' ') < 0; });
  }
  function tplText(el) { var t = ''; el.querySelectorAll('template').forEach(function (tp) { t += ' ' + tp.content.textContent; }); return t; }
  var matchCache = null;
  function match(list) {
    if (matchCache && matchCache.list === list) return matchCache.map;
    var d = deck(), N = list.length, map = {};
    list.forEach(function (c) { map[K(c)] = []; });
    if (N && d.length) {
      var docs = list.map(function (c) {
        var bag = {}, h = c.querySelector(':scope > .concept-header');
        toks(tplText(c)).forEach(function (w) { bag[w] = (bag[w] || 0) + 1; });
        if (h) toks(tplText(h)).forEach(function (w) { bag[w] = (bag[w] || 0) + 3; });
        return bag;
      });
      var df = {}; docs.forEach(function (b) { Object.keys(b).forEach(function (w) { df[w] = (df[w] || 0) + 1; }); });
      d.forEach(function (card, i) {
        if (!card || !card.front) return;
        var def = card.back && card.back.definition || {};
        var q = toks([card.front.ar, card.front.en, def.ar, def.en].join(' ')), seen = {};
        q = q.filter(function (w) { return seen[w] ? false : (seen[w] = 1); });
        var e = (i + .5) / d.length * N - .5, best = -1, bs = -1;
        docs.forEach(function (b, ci) {
          var s = 0; q.forEach(function (w) { if (b[w]) s += Math.log(1 + N / df[w]) * Math.min(b[w], 4); });
          s = s / (1 + .18 * Math.abs(ci - e));
          if (s > bs) { bs = s; best = ci; }
        });
        if (bs <= 0) best = Math.max(0, Math.min(N - 1, Math.round(e)));
        map[K(list[best])].push(i);
      });
    }
    matchCache = { list: list, map: map };
    return map;
  }

  /*@6.STCJ.7*/
  function level(cid, idx) {
    var r = get(cid), sig = [];
    if (r.r === 1) sig.push('strong'); else if (r.r === 3) sig.push('shaky'); else if (r.r === 5) sig.push('weak');
    (idx || []).forEach(function (i) {
      var c = cardState(i); if (!c) return;
      sig.push(c.g >= 3 ? 'strong' : c.g === 2 ? 'shaky' : 'weak');
    });
    if (sig.indexOf('weak') >= 0) return 'weak';
    if (sig.indexOf('shaky') >= 0) return 'shaky';
    if (sig.length) return 'strong';
    return r.d ? 'read' : '';
  }
  var TONE = { strong: 1, shaky: 3, weak: 5 };
  function tone(lv) { return TONE[lv] || ''; }
  function levelName(lv) {
    return { strong: L('أتقنتَه', 'Known'), shaky: L('يحتاج تثبيتاً', 'Shaky'), weak: L('راجِعْه', 'Review it'), read: L('قرأتَه', 'Read') }[lv] || '';
  }

  /*@6.STCJ.8*/
  function concepts() {
    var main = document.querySelector('.main-content'); if (!main) return [];
    var list = Array.prototype.filter.call(main.querySelectorAll('.concept-card'), function (c) { return c.id; });
    var seen = {};
    /*@6.STCJ.9*/
    list.forEach(function (c) { seen[c.id] = (seen[c.id] || 0) + 1; c.dataset.sk = seen[c.id] > 1 ? c.id + '~' + seen[c.id] : c.id; });
    return list;
  }
  function K(c) { return c.dataset.sk || c.id; }
  function title(c) {
    var h = c.querySelector('.concept-header .content-target h2') || c.querySelector('.concept-header h2');
    if (!h) return c.id;
    var t = h.cloneNode(true), n = t.querySelector('.concept-number'); if (n) n.remove();
    return t.textContent.replace(/\s+/g, ' ').trim();
  }
  function num(c, i) { var n = c.querySelector('.concept-header .concept-number'); return n ? n.textContent.trim() : String(i + 1); }
  function flash(c) { var f = c.querySelector(':scope > .depth-layer[data-layer="flash"] .content-target'); return f ? f.textContent.replace(/\s+/g, ' ').trim() : ''; }
  /*@6.STCJ.10*/
  function terms(c) {
    var seen = {}, out = [];
    var add = function (t) {
      t = t.replace(/\s+/g, ' ').replace(/^[\s:،,.؛;]+|[\s:،,.؛;]+$/g, '').trim();
      if (t.length < 2 || t.length > 48) return;
      var k = fold(t).replace(/\s+/g, ' '); if (seen[k]) return; seen[k] = 1; out.push(t);
    };
    [':scope > .depth-layer[data-layer="full"] .content-target', ':scope > .depth-layer[data-layer="deep"] .content-target'].forEach(function (s) {
      var el = c.querySelector(s); if (!el) return;
      el.querySelectorAll('strong, b, .smart-term').forEach(function (b) {
        if (b.parentElement.closest('strong, b, .smart-term')) return;       /*@6.STCJ.11*/
        var t = b.textContent.replace(/^[)]+|[(]+$/g, '');
        if ((t.match(/\(/g) || []).length > (t.match(/\)/g) || []).length) t += ')';   /*@6.STCJ.12*/
        add(t);
      });
      var re = /([\u0621-\u064A]+(?:\s+[\u0621-\u064A]+)?)\s*\(([A-Za-z][A-Za-z0-9 .+\/-]{1,32})\)/g, m, txt = el.textContent;
      while ((m = re.exec(txt))) if (/[A-Za-z]{3}/.test(m[2])) add(m[1].replace(/^[وفبكل](?=ال)/, '') + ' (' + m[2].trim() + ')');
    });
    return out.slice(0, 8);
  }
  function moduleTitle() { var h = document.querySelector('.hero h1'); return h ? h.textContent.replace(/\s+/g, ' ').trim() : document.title; }
  function siteRoot() {
    var s = document.querySelector('script[src*="shared/garden.js"]');
    return s ? s.src.replace(/shared\/garden\.js.*$/, '') : location.origin + '/';
  }

  /*@6.STCJ.13*/
  var themeP = null;
  function printTheme() {
    if (window.GardenPrintTheme) return Promise.resolve(window.GardenPrintTheme);
    if (themeP) return themeP;
    themeP = new Promise(function (res) {
      var s = document.createElement('script'); s.src = siteRoot() + 'shared/print-theme.js';
      s.onload = function () { res(window.GardenPrintTheme || null); }; s.onerror = function () { res(null); };
      document.head.appendChild(s);
    });
    return themeP;
  }
  function brand(px) { var P = window.GardenPrintTheme; return P && P.brand ? P.brand(px) : ''; }
  function print(o) {
    printTheme().then(function (PT) { printDoc(o, PT); });
  }
  function printDoc(o, PT) {
    var A = ar(), mode = PT ? PT.readMode() : 'paper';
    var SLOTS = o.ownFirst ? ['own', 'sum', 'fs', 'tm'] : ['sum', 'fs', 'own', 'tm'];
    var fontHref = siteRoot() + 'shared/vendor/fonts/garden/garden-core.css';
    var mjx = Array.prototype.filter.call(document.querySelectorAll('style'), function (s) { return /mjx-/.test(s.textContent || ''); })
      .map(function (s) { return s.outerHTML; }).join('');
    var date = new Date().toLocaleDateString(A ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    var vars = PT ? PT.vars(mode) : ':root{--pr-bg:#fff;--pr-bg2:#fbfcfe;--pr-card:#fff;--pr-fg:#0f172a;--pr-fg1:#334155;--pr-fg2:#64748b;--pr-fg3:#94a3b8;--pr-fg4:#a8b3c2;--pr-line:#cbd5e1;--pr-line2:#e8edf3;--pr-line3:#f4f7fa;--pr-ac:#0d9488;--pr-ac2:#0f766e;--pr-acw:#99f6e4;--pr-acs:#f1faf5;--pr-dg:#be123c;--pr-dgl:#fbd0d7;--pr-dgw:#fff7f8;--pr-wn:#b8730a;--pr-wnw:#fdf8ef;--pr-ok:#0a8f4d}';
    var page = PT ? PT.pageRule(mode, 'A4 portrait', '11mm 11mm 13mm') : '@page{size:A4 portrait;margin:11mm 11mm 13mm}';
    var num = A ? '"صفحة " counter(page) " من " counter(pages)' : '"Page " counter(page) " of " counter(pages)';
    var css = vars + page + '@page{@bottom-center{content:' + num + ';font:700 7pt ' + (A ? "'Tajawal','Cairo'" : "'Plus Jakarta Sans'") + ',sans-serif;color:#94a3b8}}' +
      '*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'body{font-family:' + (A ? "'Tajawal','Cairo',sans-serif" : "'Plus Jakarta Sans','Inter',sans-serif") + ';direction:' + (A ? 'rtl' : 'ltr') + ';color:var(--pr-fg1);background:var(--pr-bg);font-size:9.4pt;line-height:1.65;-webkit-font-smoothing:antialiased}' +
      '.pg-head{position:relative;text-align:center;padding-bottom:7pt;margin-bottom:9pt;border-bottom:1pt solid var(--pr-line2)}' +
      '.pg-brand{position:absolute;top:1pt;inset-inline-end:0;display:inline-flex;align-items:center;gap:3pt;font-size:7.5pt;font-weight:800;color:var(--pr-ac)}' +
      '.pg-code{font-weight:800;color:var(--pr-fg2);letter-spacing:.02em}' +
      '.pg-title{font-size:17pt;font-weight:900;color:var(--pr-fg);line-height:1.2;padding-inline:70pt}' +
      '.pg-sub{font-size:8.5pt;font-weight:600;color:var(--pr-fg3);margin-top:3pt}' +
      '.grid{display:grid;gap:6pt;grid-template-columns:' + (o.cols === 2 ? '1fr 1fr' : '1fr') + ';align-items:stretch}' +
      '.cc{display:grid;grid-row:span ' + (SLOTS.length + 1) + ';grid-template-rows:subgrid;row-gap:0;background:var(--pr-card);border:.75pt solid var(--pr-line2);border-radius:9pt;overflow:hidden;break-inside:avoid;page-break-inside:avoid}' +
      '.sl{padding:4.5pt 9pt 0;min-width:0}.sl:empty{padding:0}.cc-h+.sl{padding-top:6pt}.sl:last-child{padding-bottom:7pt}.sl.s-fs{display:flex;flex-direction:column;gap:4.5pt}.sl.s-tm{align-self:end}' +
      '.cc-h{display:flex;align-items:baseline;gap:6pt;padding:4.5pt 9pt;background:var(--pr-bg2);border-bottom:.75pt solid var(--pr-line2)}' +
      '.cc-n{flex:none;font-size:7.8pt;font-weight:800;color:var(--pr-ac);unicode-bidi:isolate;direction:ltr}' +
      '.cc-t{flex:1;font-size:10.2pt;font-weight:900;color:var(--pr-fg);line-height:1.35}' +
      '.lv{flex:none;font-size:6.8pt;font-weight:800;padding:.6pt 6pt;border-radius:999px;border:.75pt solid currentColor;white-space:nowrap}' +
      '.lv.t1{color:var(--pr-ok)}.lv.t3{color:var(--pr-wn)}.lv.t5{color:var(--pr-dg)}' +
      '.sum{color:var(--pr-fg);font-size:9.4pt}' +
      '.own{font-size:' + (o.ownFirst ? '10.2pt;color:var(--pr-fg)' : '8.8pt;color:var(--pr-fg1)') + ';white-space:pre-line}' +
      '.own i,.ref i{display:block;font-style:normal;font-size:6.8pt;font-weight:800;color:var(--pr-fg3);letter-spacing:.02em}' +
      (o.ownFirst ? '' : '.own{padding:4pt 7pt;border-radius:6pt;background:var(--pr-acs);border:.5pt solid var(--pr-acw)}') +
      '.ref{font-size:8.2pt;color:var(--pr-fg2);padding-top:4pt;border-top:.5pt dashed var(--pr-line2)}' +
      '.f{font-size:9pt;overflow:hidden;padding:3pt 6pt;border-radius:6pt;background:var(--pr-bg2)}.f .cap{display:block;font-size:6.8pt;font-weight:700;color:var(--pr-fg3)}' +
      '.terms{display:flex;flex-wrap:wrap;gap:2.5pt;padding-top:2pt}' +
      '.terms span{font-size:7pt;font-weight:700;color:var(--pr-fg2);border:.5pt solid var(--pr-line);border-radius:999px;padding:.3pt 5pt}' +
      '.ftr{margin-top:9pt;padding-top:5pt;border-top:1pt solid var(--pr-line2);display:flex;justify-content:space-between;align-items:center;gap:10pt;font-size:7.6pt;font-weight:700;color:var(--pr-fg3)}' +
      '.ftr .q{font-size:8.4pt;color:var(--pr-fg2)}.ftr .lg{display:flex;gap:8pt}.ftr .lg span{display:inline-flex;align-items:center;gap:3pt}' +
      '.ftr .lg i{width:5.5pt;height:5.5pt;border-radius:50%;display:inline-block}';
    var card = function (it) {
      var slot = {
        own: it.own ? '<div class="own">' + (o.ownFirst ? '' : '<i>' + esc(L('بكلماتك', 'In your words')) + '</i>') + esc(it.own) + '</div>' : '',
        sum: it.sum ? (o.ownFirst ? '<div class="ref"><i>' + esc(L('خلاصةُ الصفحة — للمقارنة', 'The page’s summary — to compare')) + '</i>' + esc(it.sum) + '</div>' : '<div class="sum">' + esc(it.sum) + '</div>') : '',
        fs: it.formulas || '',
        tm: it.terms && it.terms.length ? '<div class="terms">' + it.terms.map(function (t) { return '<span><bdi>' + esc(t) + '</bdi></span>'; }).join('') + '</div>' : ''
      };
      return '<article class="cc"><div class="cc-h"><span class="cc-n">' + esc(it.n) + '</span><span class="cc-t">' + esc(it.title) + '</span>' +
        (it.lv ? '<span class="lv t' + tone(it.lv) + '">' + esc(levelName(it.lv)) + '</span>' : '') + '</div>' +
        SLOTS.map(function (k) { return '<div class="sl s-' + k + '">' + slot[k] + '</div>'; }).join('') + '</article>';
    };
    var legend = o.legend ? '<span class="lg">' + ['strong', 'shaky', 'weak'].map(function (k) {
      return '<span><i style="background:var(--pr-' + { strong: 'ok', shaky: 'wn', weak: 'dg' }[k] + ')"></i>' + esc(levelName(k)) + '</span>';
    }).join('') + '</span>' : '';
    var doc = '<!doctype html><html lang="' + (A ? 'ar' : 'en') + '" dir="' + (A ? 'rtl' : 'ltr') + '"><head><meta charset="utf-8"><title>' + esc(o.title) + '</title>' +
      '<base href="' + esc(location.href) + '"><link rel="stylesheet" href="' + esc(fontHref) + '">' + mjx + '<style>' + css + '</style></head><body>' +
      '<div class="pg-head"><div class="pg-brand">' + brand(14) + '<span>' + esc(L('الحديقة الرقمية', 'Digital Garden')) + '</span></div>' +
      '<div class="pg-title">' + esc(o.title) + '</div><div class="pg-sub">' + (SUBJ ? '<bdi class="pg-code">' + esc(SUBJ) + '</bdi> · ' : '') + esc(o.sub + ' · ' + date) + '</div></div>' +
      '<div class="grid">' + o.items.map(card).join('') + '</div>' +
      '<div class="ftr"><span class="q">' + esc(o.foot || '') + '</span>' + legend + '</div></body></html>';
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:fixed;inset-inline-start:-10000px;inset-block-start:0;width:210mm;height:297mm;border:0;visibility:hidden';
    document.body.appendChild(f);
    var w = f.contentWindow;
    w.document.open(); w.document.write(doc); w.document.close();
    var go = function () { try { w.focus(); w.print(); } catch (e) {} setTimeout(function () { f.remove(); }, 1500); };
    var ready = w.document.fonts && w.document.fonts.ready;
    (ready ? ready.then(function () { setTimeout(go, 80); }) : setTimeout(go, 500));
  }

  /*@6.STCJ.14*/
  function toNotes(md) {
    var arr = [];
    try { arr = JSON.parse(localStorage.getItem('quick_notes') || '[]'); if (!Array.isArray(arr)) arr = []; } catch (e) {}
    var now = Date.now(), id = 'n' + now + Math.random().toString(36).slice(2, 6), base = siteRoot();
    var page = location.href.indexOf(base) === 0 ? location.href.slice(base.length).split('#')[0].split('?')[0] : location.pathname.replace(/^\//, '');
    arr.unshift({ id: id, body: md, remind_at: null, archived: false, pinned: false, tags: [], created_at: now, updated_at: now,
      origin: { page: page, title: moduleTitle(), title_en: moduleTitle() }, course: SUBJ, module: /^\d+$/.test(MOD) ? Number(MOD) : undefined });
    try { localStorage.setItem('quick_notes', JSON.stringify(arr)); } catch (e) { return false; }
    location.href = base + 'hub/notes.html?adopt=' + encodeURIComponent(id);
    return true;
  }

  window.GardenStudy = {
    key: KEY, review: REVIEW, subject: SUBJ, module: MOD,
    get: get, set: set, total: total, track: track, on: on, off: off,
    deck: deck, match: match, cardState: cardState, grade: grade, level: level, tone: tone, levelName: levelName,
    concepts: concepts, K: K, terms: terms, fold: fold, title: title, num: num, flash: flash, moduleTitle: moduleTitle,
    print: print, toNotes: toNotes, L: L, ar: ar, esc: esc
  };
})();
