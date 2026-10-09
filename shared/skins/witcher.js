;(function () {
  'use strict';
  var D = document, R = D.documentElement;
  var medal = null, sense = null, credit = null, obs = null, raf = 0, mounted = false;
  var HOT = /^(اليوم|غداً|غدا|Today|Tomorrow)$/;

  var MEDAL_SVG = '<svg viewBox="0 -18 200 218" aria-hidden="true" focusable="false"><defs>' +
    '<filter id="wtm-em" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="b"/><feSpecularLighting in="b" surfaceScale="5" specularConstant="1.1" specularExponent="14" lighting-color="#ffffff" result="s"><fePointLight x="55" y="35" z="95"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/><feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k1="0" k2="1" k3=".85" k4="0"/></filter>' +
    '<filter id="wtm-ems" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b"/><feSpecularLighting in="b" surfaceScale="2.4" specularConstant="1" specularExponent="16" lighting-color="#fff" result="s"><fePointLight x="10" y="0" z="60"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/><feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k1="0" k2="1" k3=".8" k4="0"/></filter>' +
    '<filter id="wtm-tar" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed="12"/><feColorMatrix values="0 0 0 0 .02 0 0 0 0 .025 0 0 0 0 .03 2.2 0 0 0 -.95"/></filter>' +
    '<linearGradient id="wtm-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6e9ec"/><stop offset=".3" stop-color="#5a6168"/><stop offset=".52" stop-color="#cfd4d8"/><stop offset=".78" stop-color="#363b40"/><stop offset="1" stop-color="#9aa1a7"/></linearGradient>' +
    '<radialGradient id="wtm-field" cx="40%" cy="34%" r="75%"><stop offset="0" stop-color="#6d767e"/><stop offset=".55" stop-color="#3a4147"/><stop offset="1" stop-color="#16191c"/></radialGradient>' +
    '<linearGradient id="wtm-wolf" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#eef1f3"/><stop offset=".45" stop-color="#a7afb6"/><stop offset="1" stop-color="#5b636a"/></linearGradient>' +
    '<radialGradient id="wtm-amber" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#ffb43c"/><stop offset="1" stop-color="#a2470c"/></radialGradient>' +
    '<clipPath id="wtm-cl"><circle cx="100" cy="100" r="80"/></clipPath>' +
    '<path id="wtm-w" d="M38 92 L42 85 C 55 80, 68 76, 80 71 L 92 62 L 100 56 L 110 20 L 122 52 L 128 48 L 138 26 L 140 58 C 146 62, 150 66, 154 72 L 166 80 L 154 86 L 172 96 L 158 102 L 176 116 L 160 120 L 172 136 L 154 136 L 160 154 L 142 148 L 142 166 L 126 154 L 118 164 L 110 150 L 98 154 L 100 140 L 90 138 L 94 128 L 82 124 L 70 120 L 56 112 L 50 108 L 62 106 L 80 102 L 58 100 L 46 99 L 40 97 Z"/>' +
    '</defs>' +
    '<circle cx="100" cy="-4" r="12" fill="none" stroke="url(#wtm-rim)" stroke-width="6.5" filter="url(#wtm-ems)"/>' +
    '<circle cx="100" cy="100" r="97" fill="url(#wtm-rim)" filter="url(#wtm-em)"/>' +
    '<circle cx="100" cy="100" r="97" fill="none" stroke="#0b0c0d" stroke-width="1.4"/>' +
    '<circle cx="100" cy="100" r="89" fill="none" stroke="#c8cdd2" stroke-width="7.5" stroke-linecap="round" stroke-dasharray="0.01 9.32" filter="url(#wtm-ems)"/>' +
    '<circle cx="100" cy="100" r="82.5" fill="#15181b"/>' +
    '<circle cx="100" cy="100" r="80" fill="url(#wtm-field)"/>' +
    '<circle cx="100" cy="100" r="80" fill="#000" filter="url(#wtm-tar)" opacity=".75" clip-path="url(#wtm-cl)"/>' +
    '<circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>' +
    '<g transform="translate(108 104) scale(.9) translate(-107 -93)">' +
      '<use href="#wtm-w" fill="#08090a" transform="translate(2.5 3.5)" opacity=".75"/>' +
      '<use href="#wtm-w" fill="url(#wtm-wolf)" filter="url(#wtm-em)"/>' +
      '<path d="M104 50 L110 27 L116 49 Z M129 47 L137 30 L136 53 Z" fill="#2a2f34" opacity=".8"/>' +
      '<path d="M78 72 Q 88 67 97 70 M96 92 Q 105 108 96 124 M110 86 Q 121 103 112 121 M124 82 Q 137 100 129 119 M138 80 Q 150 96 144 112 M64 84 Q 72 86 78 92" stroke="#262a2e" stroke-width="1.7" fill="none" stroke-linecap="round" opacity=".75"/>' +
      '<ellipse cx="42" cy="90" rx="4.2" ry="3.4" fill="#16191c"/>' +
      '<path d="M51 99 L54 107 L57 100 Z M61 106 L63 100 L66 106 Z M67 100 L69 105 L71 101 Z" fill="#f2f4f5"/>' +
      '<path d="M58 100.5 L 79 102 L 62 106 L 52 107.5 Z" fill="#0b0c0e" opacity=".85"/>' +
      '<path class="wt-eye" d="M82 80 L90 75 L99 78 L90 81.5 Z" fill="url(#wtm-amber)"/>' +
    '</g></svg>';

  var CAT_SVG = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><defs><radialGradient id="wts-amber" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#ffb43c"/><stop offset="1" stop-color="#a2470c"/></radialGradient></defs>' +
    '<path d="M2 20 C 10 8, 30 8, 38 20 C 30 32, 10 32, 2 20 Z" fill="url(#wts-amber)" stroke="#2a1606" stroke-width="1.4"/>' +
    '<ellipse class="wt-pupil" cx="20" cy="20" rx="2.1" ry="10" fill="#0a0604"/>' +
    '<circle cx="16" cy="15" r="1.8" fill="#fff" opacity=".8"/></svg>';

  function en() { return R.getAttribute('lang') === 'en'; }
  function lab(el) { el.textContent = el.getAttribute(en() ? 'data-en' : 'data-ar') || ''; }
  function relabel(root) {
    if (!root) return;
    if (root.hasAttribute('data-ar')) lab(root);
    Array.prototype.forEach.call(root.querySelectorAll('[data-ar]'), lab);
  }
  function txt(tag, ar, enT, cls) {
    var e = D.createElement(tag);
    if (cls) e.className = cls;
    e.setAttribute('data-ar', ar); e.setAttribute('data-en', enT);
    lab(e);
    return e;
  }
  function host() { return D.querySelector('section[data-view="overview"] > div'); }

  function markTasks() {
    var hot = null;
    Array.prototype.forEach.call(D.querySelectorAll('.widget[data-widget="tasks"] .widget-item'), function (it) {
      var due = it.lastElementChild;
      var t = due ? due.textContent.trim() : '';
      var st = due ? (due.getAttribute('style') || '') : '';
      var h = /st-danger/.test(st) || HOT.test(t);
      if (h) { it.setAttribute('data-wt-hot', ''); if (!hot) hot = it; } else if (it.hasAttribute('data-wt-hot')) it.removeAttribute('data-wt-hot');
    });
    return hot;
  }
  function markCourses() {
    Array.prototype.forEach.call(D.querySelectorAll('.dash-course-card'), function (c) {
      var sm = c.querySelector('.dnx-nm small');
      var m = sm ? /[·•]\s*(\d+)/.exec(sm.textContent) : null;
      if (m) { if (c.getAttribute('data-wt-pw') !== m[1]) c.setAttribute('data-wt-pw', m[1]); } else if (c.hasAttribute('data-wt-pw')) c.removeAttribute('data-wt-pw');
      var f = c.querySelector('.dnx-foot > i');
      var p = f ? parseFloat(f.style.inlineSize || f.style.width || '0') || 0 : 0;
      var r = p >= 67 ? 'gold' : (p >= 34 ? 'silver' : 'bronze');
      if (c.getAttribute('data-wt-rar') !== r) c.setAttribute('data-wt-rar', r);
    });
  }
  function paintMedal(hot) {
    if (!medal) return;
    var b = medal.querySelector('.wt-cap b'), s = medal.querySelector('.wt-cap span');
    if (hot) {
      medal.setAttribute('data-hot', '');
      b.setAttribute('data-ar', 'الميداليّة ترتجف'); b.setAttribute('data-en', 'The medallion hums');
      var nm = hot.querySelector('.widget-item-name'), code = nm ? nm.querySelector('bdi') : null;
      var name = nm ? nm.textContent.replace(code ? code.textContent : '', '').trim() : '';
      var due = hot.lastElementChild ? hot.lastElementChild.textContent.trim() : '';
      s.removeAttribute('data-ar'); s.removeAttribute('data-en');
      s.textContent = name + (due ? ' · ' + due : '');
    } else {
      medal.removeAttribute('data-hot');
      b.setAttribute('data-ar', 'الميداليّة ساكنة'); b.setAttribute('data-en', 'The medallion is still');
      s.setAttribute('data-ar', 'لا عاجلَ في الأفق'); s.setAttribute('data-en', 'Nothing urgent on the horizon');
      lab(s);
    }
    lab(b);
  }
  function apply() {
    raf = 0;
    if (!mounted) return;
    var hot = markTasks();
    markCourses();
    paintMedal(hot);
  }
  function soon() { if (!raf) raf = requestAnimationFrame(apply); }

  function setSenses(v) {
    R.classList.toggle('wt-senses', !!v);
    if (sense) {
      sense.setAttribute('aria-pressed', v ? 'true' : 'false');
      sense.classList.remove('wt-go');
      if (v) { void sense.offsetWidth; sense.classList.add('wt-go'); }
    }
  }
  function modalOpen() {
    var m = D.querySelectorAll('dialog[open], [aria-modal="true"]');
    for (var i = 0; i < m.length; i++) if (m[i].getClientRects().length && getComputedStyle(m[i]).visibility !== 'hidden') return true;
    return false;
  }
  function editable(a) { return !!a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }
  function onKey(e) {
    if (!sense || !sense.isConnected || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (editable(D.activeElement) || modalOpen()) return;
    var k = e.key;
    if (k === 'v' || k === 'V' || k === 'ر') setSenses(!R.classList.contains('wt-senses'));
    else if (k === 'Escape' && R.classList.contains('wt-senses')) setSenses(false);
  }
  function onClick() { setSenses(!R.classList.contains('wt-senses')); }
  function onLang() { relabel(medal); relabel(sense); relabel(credit); soon(); }

  function build(h) {
    medal = D.createElement('div');
    medal.className = 'wt-medal';
    medal.setAttribute('aria-hidden', 'true');
    medal.innerHTML = '<i class="wt-chain"></i><span class="wt-ring"></span><span class="wt-coin">' + MEDAL_SVG + '</span><span class="wt-cap"><b></b><span></span></span>';
    h.appendChild(medal);

    sense = D.createElement('button');
    sense.type = 'button';
    sense.className = 'wt-sense';
    sense.setAttribute('aria-pressed', 'false');
    var pulse = D.createElement('span'); pulse.className = 'wt-pulse'; pulse.setAttribute('aria-hidden', 'true');
    var cat = D.createElement('span'); cat.className = 'wt-cat'; cat.setAttribute('aria-hidden', 'true'); cat.innerHTML = CAT_SVG;
    var t = D.createElement('span');
    t.appendChild(txt('b', 'حواسّ الصيّاد', "Hunter's senses"));
    var sm = D.createElement('small');
    sm.appendChild(txt('span', 'اضغط ', 'Press '));
    var kb = D.createElement('kbd'); kb.textContent = 'V'; sm.appendChild(kb);
    sm.appendChild(txt('span', ' — فلا يتوهّج إلا العاجل', ' — only the urgent glows'));
    t.appendChild(sm);
    sense.appendChild(pulse); sense.appendChild(cat); sense.appendChild(t);
    sense.addEventListener('click', onClick);
    var anchor = D.getElementById('dash-exam-slot');
    if (anchor && anchor.parentNode === h) h.insertBefore(sense, anchor); else h.appendChild(sense);

    credit = D.createElement('p');
    credit.className = 'wt-credit';
    credit.appendChild(txt('span', 'تصوير: ', 'Photos: '));
    ['Cederic Vandenberghe', 'Marek Szturc', 'Little Annabell', 'Philippe Montes'].forEach(function (n, i) {
      if (i) credit.appendChild(D.createTextNode(' · '));
      var b = D.createElement('b'); b.textContent = n; credit.appendChild(b);
    });
    credit.appendChild(D.createTextNode(' — Unsplash'));
    h.appendChild(credit);
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    var h = host();
    if (h) {
      build(h);
      obs = new MutationObserver(soon);
      ['widgets-grid', 'dash-courses'].forEach(function (id) { var n = D.getElementById(id); if (n) obs.observe(n, { childList: true, subtree: true }); });
      D.addEventListener('keydown', onKey);
    }
    D.addEventListener('garden:languageChanged', onLang);
    apply();
  }
  function strip(sel, attr) { Array.prototype.forEach.call(D.querySelectorAll(sel), function (n) { n.removeAttribute(attr); }); }
  function unmount() {
    if (!mounted) return;
    mounted = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (obs) obs.disconnect();
    obs = null;
    D.removeEventListener('keydown', onKey);
    D.removeEventListener('garden:languageChanged', onLang);
    if (sense) sense.removeEventListener('click', onClick);
    [medal, sense, credit].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
    medal = sense = credit = null;
    R.classList.remove('wt-senses');
    strip('[data-wt-hot]', 'data-wt-hot');
    strip('[data-wt-pw]', 'data-wt-pw');
    strip('[data-wt-rar]', 'data-wt-rar');
  }
  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.witcher = { mount: mount, unmount: unmount };
})();
