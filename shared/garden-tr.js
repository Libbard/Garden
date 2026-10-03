/*@3.GATJ2.1*/
(function () {
  'use strict';
  if (window.GardenTr) return;

  /*@3.GATJ2.2*/
  var MAX_Q = 300;
  var MAX_ALL = 1200;
  var WAIT_MS = 12000;
  var STORE = 'garden_tr_v1';
  var STORE_MAX = 400;

  function E() { return window.GardenEndpoints || {}; }
  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar').indexOf('ar') === 0; }
  function L(a, b) { return isAr() ? a : b; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function squash(s) { return String(s || '').replace(/[​­]/g, '').replace(/\s+/g, ' ').trim(); }

  /*@3.GATJ2.3*/
  function toFor(s) {
    var ar = (s.match(/[؀-ۿ]/g) || []).length;
    var la = (s.match(/[A-Za-z]/g) || []).length;
    return ar > la ? 'en' : 'ar';
  }

  /*@3.GATJ2.4*/
  function parts(text) {
    var s = squash(text), out = [], cur = '', cut = false;
    if (s.length > MAX_ALL) {
      var sp = s.lastIndexOf(' ', MAX_ALL);
      s = s.slice(0, sp > MAX_ALL * 0.6 ? sp : MAX_ALL);
      cut = true;
    }
    var sents = s.match(/[^.!?؟\n]+[.!?؟]*\s*/g) || [s];
    function push(x) { x = x.trim(); if (x) out.push(x); }
    sents.forEach(function (t) {
      if ((cur + t).length <= MAX_Q) { cur += t; return; }
      push(cur); cur = '';
      while (t.length > MAX_Q) {
        var k = t.lastIndexOf(' ', MAX_Q);
        if (k < MAX_Q * 0.5) k = MAX_Q;
        push(t.slice(0, k)); t = t.slice(k);
      }
      cur = t;
    });
    push(cur);
    return { list: out, cut: cut };
  }

  /*@3.GATJ2.5*/
  function load() {
    try { var o = JSON.parse(localStorage.getItem(STORE) || '{}'); return o && typeof o === 'object' ? o : {}; }
    catch (e) { return {}; }
  }
  function memo(k) { var o = load(); return o[k] ? o[k][0] : null; }
  function keep(k, v) {
    try {
      var o = load();
      o[k] = [v, Date.now()];
      var ks = Object.keys(o);
      if (ks.length > STORE_MAX) {
        ks.sort(function (a, b) { return o[a][1] - o[b][1]; })
          .slice(0, ks.length - STORE_MAX).forEach(function (x) { delete o[x]; });
      }
      localStorage.setItem(STORE, JSON.stringify(o));
    } catch (e) {}
  }

  function fail(code) { var e = new Error(code); e.code = code; return e; }

  /*@3.GATJ2.6*/
  function one(q, to) {
    var k = 'g2|' + to + '|' + q;
    var hit = memo(k);
    if (hit != null && typeof hit === 'object') return Promise.resolve(hit);
    var base = E().sync;
    if (!base) return Promise.reject(fail('off'));
    if (navigator.onLine === false) return Promise.reject(fail('offline'));
    var ac = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ac) ac.abort(); }, WAIT_MS);
    return fetch(base + '/v1/tr?to=' + to + '&g=2&q=' + encodeURIComponent(q),
                 { signal: ac ? ac.signal : undefined, credentials: 'omit' })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.ok && j && typeof j.out === 'string') {
            var v = { o: j.out, t: Array.isArray(j.terms) ? j.terms.slice(0, 8) : [] };
            keep(k, v); return v;
          }
          var c = (j && j.error) || ('http_' + r.status);
          throw fail(c === 'daily_cap' ? 'cap' : c === 'month_cap' || c === 'quota' ? 'capm' : c === 'rate_limited' ? 'busy' : 'down');
        });
      }, function () { throw fail(navigator.onLine === false ? 'offline' : 'down'); })
      .then(function (v) { clearTimeout(t); return v; }, function (e) { clearTimeout(t); throw e; });
  }

  /*@3.GATJ2.11*/
  var MARK = /^((?:[-*•●◦▪‣–—·]|\(?[0-9٠-٩]{1,3}[.)\-]|\(?[A-Za-z][.)])\s+)/;
  function lines(raw) {
    var out = [];
    String(raw || '').replace(/\r\n?/g, '\n').replace(/[\u200b\u00ad]/g, '').split('\n').forEach(function (ln) {
      var t = ln.replace(/[ \t\f\v\u00a0]+/g, ' ').trim();
      var last = out[out.length - 1];
      if (!t) { if (last && last.body) out.push({ pre: '', body: '' }); return; }
      var m = t.match(MARK), pre = m ? m[1] : '', body = m ? t.slice(m[1].length) : t;
      if (!pre && last && last.body && !/[.:;!?؟]["'”’)\]]?$/.test(last.body)) { last.body += ' ' + body; return; }
      out.push({ pre: pre, body: body });
    });
    while (out.length && !out[out.length - 1].body) out.pop();
    return out;
  }

  /*@3.GATJ2.7*/
  function text(src, to) {
    var ls = lines(src);
    var all = squash(ls.map(function (x) { return x.body; }).join(' '));
    if (!all) return Promise.reject(fail('empty'));
    to = to || toFor(all);
    var left = MAX_ALL, cut = false, jobs = [];
    ls.forEach(function (x) {
      if (cut) return;
      if (!x.body) { jobs.push({ pre: '', list: [] }); return; }
      var body = x.body;
      if (body.length > left) {
        var sp = body.lastIndexOf(' ', left);
        body = body.slice(0, sp > left * 0.6 ? sp : left);
        cut = true;
      }
      left -= body.length;
      if (body) jobs.push({ pre: x.pre, list: parts(body).list });
    });
    var outL = [], terms = [], seen = {}, j = 0;
    function line() {
      if (j >= jobs.length) {
        while (outL.length && !outL[outL.length - 1]) outL.pop();
        return { out: outL.join('\n'), to: to, cut: cut, terms: terms };
      }
      var jb = jobs[j++], acc = [], i = 0;
      if (!jb.list.length) { outL.push(''); return line(); }
      function next() {
        if (i >= jb.list.length) { outL.push(jb.pre + acc.join(' ')); return line(); }
        return one(jb.list[i++], to).then(function (v) {
          acc.push(typeof v === 'string' ? v : v.o);
          (v && v.t || []).forEach(function (t) {
            if (!t || !t.en || seen[t.en]) return;
            seen[t.en] = 1; terms.push(t);
          });
          return next();
        });
      }
      return next();
    }
    return Promise.resolve().then(line);
  }

  function why(code) {
    if (code === 'offline') return L('لا اتّصال الآن — الترجمةُ تحتاج الشبكة.', 'You are offline — translation needs a connection.');
    if (code === 'cap') return L('بلغت الترجمةُ حدَّها لليوم، وتعود غداً.', 'Translation reached today’s limit. It will be back tomorrow.');
    if (code === 'capm') return L('بلغت الترجمةُ حدَّها لهذا الشهر، وتعود أوّلَ الشهر القادم.', 'Translation reached this month’s limit. It will be back next month.');
    if (code === 'busy') return L('طلباتٌ كثيرةٌ في دقيقة — انتظرْ قليلاً ثمّ أعِدْ.', 'Too many requests this minute — wait a moment and retry.');
    if (code === 'empty') return L('لا نصَّ محدَّداً لترجمته.', 'No selected text to translate.');
    return L('تعذّرت الترجمةُ الآن — أعِدِ المحاولة.', 'Could not translate right now — try again.');
  }

  /*@3.GATJ2.8*/
  var cur = null;

  function close() {
    if (!cur) return;
    var c = cur; cur = null;
    document.removeEventListener('pointerdown', c.down, true);
    document.removeEventListener('pointerup', c.up, true);
    document.removeEventListener('keydown', c.key, true);
    window.removeEventListener('scroll', c.scroll, true);
    window.removeEventListener('resize', c.scroll);
    if (c.el.parentNode) c.el.parentNode.removeChild(c.el);
    if (c.back && c.back.focus) { try { c.back.focus({ preventScroll: true }); } catch (e) {} }
  }

  function btn(cls, icon, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gsf-btn gtr-b' + (cls ? ' ' + cls : '');
    b.innerHTML = '<i class="fa-solid ' + icon + '" aria-hidden="true"></i><span></span>';
    b.lastChild.textContent = label;
    return b;
  }

  function grab() {
    try {
      var s = window.getSelection();
      return (s && s.rangeCount && !s.isCollapsed) ? s.getRangeAt(0).cloneRange() : null;
    } catch (e) { return null; }
  }

  /*@3.GATJ2.9*/
  function place(el, at) {
    var vw = window.innerWidth, vh = window.innerHeight, pad = 8, gap = 8;
    if (vw <= 640) { el.classList.add('gtr--sheet'); el.style.left = el.style.top = ''; return; }
    el.classList.remove('gtr--sheet');
    var r = at || { left: vw / 2, right: vw / 2, top: vh / 3, bottom: vh / 3 };
    var w = el.offsetWidth, h = el.offsetHeight;
    var top = r.bottom + gap;
    if (top + h > vh - pad) top = (r.top - gap - h >= pad) ? r.top - gap - h : Math.max(pad, vh - h - pad);
    var left = (r.left + r.right) / 2 - w / 2;
    left = Math.max(pad, Math.min(left, vw - w - pad));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  function open(src, at, opts) {
    close();
    opts = opts || {};
    var raw = String(src || '');
    src = squash(src);
    var el = document.createElement('div');
    el.className = 'gtr';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', L('ترجمةُ النصِّ المحدَّد', 'Translation of the selected text'));
    el.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    el.innerHTML =
      '<div class="gtr-grip" aria-hidden="true"></div>' +
      '<div class="gtr-src" dir="auto"></div>' +
      '<div class="gtr-out" dir="auto" aria-live="polite"></div>' +
      '<div class="gtr-terms" hidden></div>' +
      '<div class="gtr-cut" hidden></div>' +
      '<div class="gtr-acts"></div>' +
      '<div class="gtr-foot"></div>';
    var srcEl = el.querySelector('.gtr-src'), outEl = el.querySelector('.gtr-out'), termsEl = el.querySelector('.gtr-terms');
    var cutEl = el.querySelector('.gtr-cut'), acts = el.querySelector('.gtr-acts');
    el.querySelector('.gtr-foot').textContent = L('ترجمةٌ آليّة — قد تخطئ في المصطلح.', 'Machine translation — terms may be off.');
    srcEl.textContent = src.length > 140 ? src.slice(0, 140) + '…' : src;

    var bCopy = btn('gsf-btn--go', 'fa-copy', L('نسخ', 'Copy'));
    var bSwap = btn('', 'fa-right-left', '');
    var bX = btn('gtr-x', 'fa-xmark', '');
    bX.setAttribute('aria-label', L('إغلاق', 'Close'));
    bX.setAttribute('data-ar-title', 'إغلاق'); bX.setAttribute('data-en-title', 'Close');
    acts.appendChild(bCopy); acts.appendChild(bSwap); acts.appendChild(bX);

    var to = toFor(src), done = '', gen = 0;
    function swapLabel() {
      bSwap.lastChild.textContent = to === 'ar' ? L('إلى الإنجليزيّة', 'To English') : L('إلى العربيّة', 'To Arabic');
    }
    function run() {
      var my = ++gen;
      done = '';
      el.setAttribute('aria-busy', 'true');
      el.classList.remove('is-err');
      outEl.textContent = L('جارٍ الترجمة…', 'Translating…');
      bCopy.disabled = true;
      swapLabel();
      termsEl.hidden = true;
      text(raw, to).then(function (r) {
        if (my !== gen || cur !== state) return;
        done = r.out;
        outEl.textContent = r.out;
        outEl.setAttribute('lang', r.to);
        /*@3.GATJ2.12*/
        if (r.terms && r.terms.length) {
          termsEl.innerHTML = '<b class="gtr-terms-h">' + esc(L('مصطلحاتٌ من هذه الجملة', 'Terms in this sentence')) + '</b><ul>' +
            r.terms.map(function (t) {
              return '<li><span class="gtr-t-en" dir="ltr" lang="en">' + esc(t.en) + '</span>' +
                '<span class="gtr-t-ar" dir="rtl" lang="ar">' + esc(t.a || t.t) + '</span></li>';
            }).join('') + '</ul>';
          termsEl.hidden = false;
        }
        cutEl.hidden = !r.cut;
        if (r.cut) cutEl.textContent = L('تُرجم أوّلُ ' + MAX_ALL + ' حرفٍ — حدِّدْ ما بعده وترجمْه.',
                                         'Translated the first ' + MAX_ALL + ' characters — select the rest to continue.');
        bCopy.disabled = false;
      }, function (e) {
        if (my !== gen || cur !== state) return;
        el.classList.add('is-err');
        outEl.textContent = why(e && e.code);
      }).then(function () {
        if (my === gen) el.removeAttribute('aria-busy');
        if (cur === state) place(el, at);
      });
    }

    bCopy.addEventListener('click', function () {
      if (!done) return;
      var ok = function () { bCopy.lastChild.textContent = L('نُسخت', 'Copied'); };
      try { navigator.clipboard.writeText(done).then(ok, function () {}); } catch (e) {}
    });
    bSwap.addEventListener('click', function () { to = to === 'ar' ? 'en' : 'ar'; run(); });
    bX.addEventListener('click', close);

    var range = grab(), pinned = false, raf = 0, tap = null;
    function keepIn() {
      var vw = window.innerWidth, vh = window.innerHeight, w = el.offsetWidth, h = el.offsetHeight;
      el.style.left = Math.max(8, Math.min(parseFloat(el.style.left) || 0, vw - w - 8)) + 'px';
      el.style.top = Math.max(8, Math.min(parseFloat(el.style.top) || 0, vh - h - 8)) + 'px';
    }
    function follow() {
      raf = 0;
      if (cur !== state || el.classList.contains('gtr--sheet')) return;
      if (pinned) { keepIn(); return; }
      var r = null;
      try { r = range && range.getBoundingClientRect(); } catch (e) { r = null; }
      if (r && (r.width || r.height) && r.bottom > 0 && r.top < window.innerHeight) at = r;
      place(el, at);
    }
    var grip = el.querySelector('.gtr-grip');
    grip.addEventListener('pointerdown', function (e) {
      if (el.classList.contains('gtr--sheet') || e.button > 0) return;
      e.preventDefault();
      var x0 = e.clientX, y0 = e.clientY, l0 = parseFloat(el.style.left) || 0, t0 = parseFloat(el.style.top) || 0;
      try { grip.setPointerCapture(e.pointerId); } catch (x) {}
      el.classList.add('is-drag');
      function mv(ev) {
        pinned = true;
        el.style.left = (l0 + ev.clientX - x0) + 'px';
        el.style.top = (t0 + ev.clientY - y0) + 'px';
        keepIn();
      }
      function up() {
        el.classList.remove('is-drag');
        grip.removeEventListener('pointermove', mv);
        grip.removeEventListener('pointerup', up);
        grip.removeEventListener('pointercancel', up);
      }
      grip.addEventListener('pointermove', mv);
      grip.addEventListener('pointerup', up);
      grip.addEventListener('pointercancel', up);
    });

    var state = {
      el: el,
      back: opts.back || null,
      down: function (e) { tap = el.contains(e.target) ? null : { x: e.clientX, y: e.clientY, t: Date.now() }; },
      up: function (e) {
        var t = tap; tap = null;
        if (!t || el.contains(e.target)) return;
        if (Math.abs(e.clientX - t.x) + Math.abs(e.clientY - t.y) < 10 && Date.now() - t.t < 600) close();
      },
      key: function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } },
      scroll: function (e) {
        if (e && e.target && e.target.nodeType === 1 && el.contains(e.target)) return;
        if (!raf) raf = requestAnimationFrame(follow);
      }
    };
    cur = state;
    (document.fullscreenElement || document.body).appendChild(el);
    place(el, at);
    setTimeout(function () {
      if (cur !== state) return;
      document.addEventListener('pointerdown', state.down, true);
      document.addEventListener('pointerup', state.up, true);
      document.addEventListener('keydown', state.key, true);
      window.addEventListener('scroll', state.scroll, true);
      window.addEventListener('resize', state.scroll);
    }, 0);
    try { bX.focus({ preventScroll: true }); } catch (e) {}
    run();
    return el;
  }

  /*@3.GATJ2.10*/
  function selRect() {
    try {
      var s = window.getSelection();
      if (!s || !s.rangeCount || s.isCollapsed) return null;
      var r = s.getRangeAt(0).getBoundingClientRect();
      return r && (r.width || r.height) ? r : null;
    } catch (e) { return null; }
  }

  window.GardenTr = { open: open, close: close, text: text, parts: parts, lines: lines, toFor: toFor, selRect: selRect, MAX_Q: MAX_Q };
})();
