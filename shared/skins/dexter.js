;(function () {
  'use strict';
  var H = document.documentElement;
  var on = false, obs = null, spat = null, intro = null, introT = 0, raf = 0, last = 0, lastEl = null, mq = null;
  var HOT = '.dash-course-card, .dash-xam, .dash-level-card, .widget[data-widget="tasks"] .widget-item, .widget[data-widget="semester"], .dash-side-item, .sem-c, .sx-card, .fc-card, .lx-lab, .gp-card, .set-card, .crs-sec';
  var CODE = /\b[A-Z]{2,5}\s?\d{3}[A-Z]?\b/;

  function en() { return H.getAttribute('lang') === 'en'; }
  function reduced() { return !!(mq && mq.matches); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function caseNo() {
    var d = new Date();
    H.style.setProperty('--dx-case-no', '"' + String(d.getFullYear()).slice(2) + '-' + pad(d.getMonth() + 1) + pad(d.getDate()) + '"');
  }

  function label(el) {
    var v = en() ? el.getAttribute('data-en') : el.getAttribute('data-ar');
    if (el.textContent !== v) el.textContent = v;
  }

  function examLabel() {
    var a = document.querySelector('#dash-exam-slot .dash-xam');
    if (!a) return;
    var s = a.querySelector('.dash-xam-s'), t = a.querySelector('.dash-xam-t');
    var m = ((s && s.textContent) || '').match(CODE) || ((t && t.textContent) || '').match(CODE);
    var code = m ? m[0].replace(/\s+/, '') : 'EXAM';
    var lab = a.querySelector(':scope > .dx-xlab');
    if (lab && lab.getAttribute('data-code') === code) {
      lab.querySelectorAll('[data-ar]').forEach(label);
      return;
    }
    if (lab) lab.remove();
    lab = document.createElement('span');
    lab.className = 'dx-xlab';
    lab.setAttribute('aria-hidden', 'true');
    lab.setAttribute('data-code', code);
    var k = document.createElement('span'); k.className = 'dx-k'; k.setAttribute('data-ar', 'رقم القضيّة'); k.setAttribute('data-en', 'Case no.');
    var b = document.createElement('b'); b.textContent = code;
    var bars = document.createElement('i'); bars.className = 'dx-bars';
    var tw = document.createElement('span'); tw.className = 'dx-tw'; tw.textContent = 'SPECIMEN 01 / EXAM';
    var sp = document.createElement('span'); sp.className = 'dx-spec'; sp.setAttribute('data-ar', 'الأولويّة القصوى'); sp.setAttribute('data-en', 'Top priority');
    lab.appendChild(k); lab.appendChild(b); lab.appendChild(bars); lab.appendChild(tw); lab.appendChild(sp);
    lab.querySelectorAll('[data-ar]').forEach(label);
    a.insertBefore(lab, a.firstChild);
  }

  function greeting() {
    var g = document.querySelector('.widget[data-widget="welcome"] .dash-greet');
    if (!g) return;
    var n = g.querySelector('.dash-greet-n');
    if (n && !n.querySelector('.dx-name') && n.childNodes.length === 1 && n.firstChild.nodeType === 3) {
      var txt = n.firstChild.nodeValue, i = txt.search(/[،,]\s*/);
      if (i > 0) {
        var head = txt.slice(0, i), rest = txt.slice(i), sep = rest.match(/^[،,]\s*/)[0];
        if (rest.length > sep.length) {
          var em = document.createElement('em');
          em.className = 'dx-name';
          em.textContent = rest.slice(sep.length);
          n.textContent = '';
          n.appendChild(document.createTextNode(head + sep));
          n.appendChild(em);
        }
      }
    }
    var sub = g.querySelector(':scope > .widget-sub');
    var box = g.querySelector(':scope > .dx-stamps');
    var parts = sub ? sub.textContent.split(/\s+·\s+/).filter(Boolean) : [];
    var key = parts.join('|');
    if (box && box.getAttribute('data-k') === key) return;
    if (box) box.remove();
    if (parts.length < 2) return;
    box = document.createElement('span');
    box.className = 'dx-stamps';
    box.setAttribute('aria-hidden', 'true');
    box.setAttribute('data-k', key);
    parts.slice(0, 2).forEach(function (p, j) {
      var st = document.createElement('span');
      st.className = 'dx-st ' + (j ? 'dx-st--b' : 'dx-st--a');
      st.textContent = p;
      box.appendChild(st);
    });
    sub.parentNode.insertBefore(box, sub.nextSibling);
  }

  function courses() {
    var g = document.getElementById('dash-courses');
    var n = g ? g.querySelectorAll(':scope > .dash-course-card').length : 0;
    if (n) H.style.setProperty('--dx-ncourses', '"' + n + '"'); else H.style.removeProperty('--dx-ncourses');
  }

  function decorate() {
    raf = 0;
    if (!on) return;
    try { examLabel(); } catch (e) {}
    try { greeting(); } catch (e) {}
    try { courses(); } catch (e) {}
  }
  function soon() { if (!raf) raf = requestAnimationFrame(decorate); }

  function spatter(x, y) {
    if (!spat) return;
    var n = 5 + Math.floor(Math.random() * 3), frag = document.createDocumentFragment(), kids = [];
    for (var k = 0; k < n; k++) {
      var d = document.createElement('i'), main = k === 0;
      var ang = Math.random() * Math.PI * 2, dist = main ? 0 : 5 + Math.random() * 15;
      var s = main ? 6 + Math.random() * 2 : 1.4 + Math.random() * 2.6;
      var el = !main && Math.random() < 0.4;
      d.style.left = (x + Math.cos(ang) * dist) + 'px';
      d.style.top = (y + Math.sin(ang) * dist) + 'px';
      d.style.setProperty('--s', (el ? s * 2.2 : s) + 'px');
      d.style.setProperty('--h', s + 'px');
      d.style.setProperty('--a', Math.round(ang * 57.3) + 'deg');
      d.style.setProperty('--d', (main ? 0 : 20 + Math.round(Math.random() * 60)) + 'ms');
      frag.appendChild(d); kids.push(d);
    }
    spat.appendChild(frag);
    setTimeout(function () { kids.forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); }); }, 1700);
  }
  function over(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (reduced() || document.hidden) return;
    var t = e.target && e.target.closest ? e.target.closest(HOT) : null;
    if (!t || t === lastEl) return;
    lastEl = t;
    var now = performance.now();
    if (now - last < 140) return;
    last = now;
    if (spat && spat.childElementCount > 40) return;
    spatter(e.clientX, e.clientY);
  }
  function leave(e) { if (!e.relatedTarget) lastEl = null; }

  function playIntro() {
    if (reduced() || document.hidden) return;
    try { if (sessionStorage.getItem('dx-intro')) return; sessionStorage.setItem('dx-intro', '1'); } catch (e) { return; }
    intro = document.createElement('div');
    intro.className = 'dx-intro';
    intro.setAttribute('aria-hidden', 'true');
    ['dx-dim', 'dx-ring', 'dx-fall', 'dx-splash'].forEach(function (c) { var i = document.createElement('i'); i.className = c; intro.appendChild(i); });
    document.body.appendChild(intro);
    introT = setTimeout(function () { if (intro && intro.parentNode) intro.parentNode.removeChild(intro); intro = null; }, 1500);
  }

  function relabel() { caseNo(); soon(); }

  function mount() {
    if (on) return;
    on = true;
    mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    caseNo();
    spat = document.createElement('div');
    spat.className = 'dx-spat';
    spat.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spat);
    document.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('pointerout', leave, { passive: true });
    document.addEventListener('garden:languageChanged', relabel);
    if (window.MutationObserver) {
      obs = new MutationObserver(function (recs) {
        for (var i = 0; i < recs.length; i++) {
          var t = recs[i].target;
          if (t !== spat && t !== document.body && !(t.closest && t.closest('.dx-spat, .dx-intro'))) { soon(); return; }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    decorate();
    playIntro();
  }

  function unmount() {
    if (!on) return;
    on = false;
    if (obs) obs.disconnect();
    obs = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(introT);
    document.removeEventListener('pointerover', over);
    document.removeEventListener('pointerout', leave);
    document.removeEventListener('garden:languageChanged', relabel);
    [spat, intro].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
    spat = intro = null; lastEl = null;
    document.querySelectorAll('.dx-xlab, .dx-stamps').forEach(function (n) { n.remove(); });
    document.querySelectorAll('.dash-greet-n .dx-name').forEach(function (em) {
      var p = em.parentNode;
      p.replaceChild(document.createTextNode(em.textContent), em);
      p.normalize();
    });
    H.style.removeProperty('--dx-case-no');
    H.style.removeProperty('--dx-ncourses');
  }

  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.dexter = { mount: mount, unmount: unmount };
})();
