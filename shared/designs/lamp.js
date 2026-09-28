/*@6.LAMJ.1*/
(function () {
  'use strict';
  var KEY = 'garden_lamp_on';
  var io = null, units = [], hosts = [], lit = null, pinY = null;
  var L = function (a, e) { return (document.documentElement.lang || 'ar') === 'ar' ? a : e; };

  function collect() {
    var main = document.querySelector('.main-content') || document.querySelector('main');
    if (!main) return;
    units = [];
    Array.prototype.forEach.call(main.children, function (el) {
      if (/^(SCRIPT|TEMPLATE|STYLE)$/.test(el.tagName)) return;
      var inner = el.querySelectorAll(':scope > .module-intro, :scope > .concept-card');
      if (inner.length) Array.prototype.forEach.call(inner, function (x) { units.push(x); });
      else units.push(el);
    });
    units.forEach(function (u) { u.classList.add('lamp-unit'); });
    hosts = units.filter(function (u) { return u.matches('.concept-card, .objectives-card, .professor-card, .vault-section'); });
    hosts.forEach(function (h) {
      if (h.querySelector(':scope > .lamp-btn')) return;
      h.classList.add('lamp-host');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'lamp-btn';
      b.innerHTML = '<i aria-hidden="true"></i>';
      b.addEventListener('click', function (e) { e.stopPropagation(); press(h); });
      h.insertBefore(b, h.firstChild);
    });
    label();
  }
  function label() {
    var on = document.documentElement.classList.contains('lamp-on');
    hosts.forEach(function (h) {
      var b = h.querySelector(':scope > .lamp-btn'); if (!b) return;
      var mine = on && h === lit;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? L('أطفئ وضعَ التركيز', 'Turn focus mode off') : L('وضعُ التركيز: أضِئ ما تقرؤه وحده', 'Focus mode: light only what you read'));
      b.title = b.getAttribute('aria-label');
      if (mine) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }
  function light(u) {
    if (lit === u) return;
    if (lit) lit.classList.remove('is-lit');
    lit = u; if (lit) lit.classList.add('is-lit');
    label();
  }
  function follow() {
    if (io) io.disconnect();
    /*@6.LAMJ.2*/
    io = new IntersectionObserver(function (entries) {
      /*@6.LAMJ.3*/
      if (pinY !== null && Math.abs(window.scrollY - pinY) < 160) return;
      pinY = null;
      entries.forEach(function (en) { if (en.isIntersecting) light(en.target); });
    }, { rootMargin: '-38% 0px -58% 0px' });
    units.forEach(function (u) { io.observe(u); });
  }
  function setOn(on, from) {
    document.documentElement.classList.toggle('lamp-on', on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    if (on) { light(from || lit || units[0]); follow(); }
    else if (io) { io.disconnect(); io = null; }
    label();
  }
  function press(h) {
    var on = document.documentElement.classList.contains('lamp-on');
    if (on && h === lit) { setOn(false); return; }
    pinY = window.scrollY;
    if (on) light(h); else setOn(true, h);
  }
  function onKey(e) { if (e.key === 'Escape' && document.documentElement.classList.contains('lamp-on')) setOn(false); }

  function mount() {
    collect();
    document.addEventListener('keydown', onKey);
    var saved = '0'; try { saved = localStorage.getItem(KEY) || '0'; } catch (e) {}
    if (saved === '1') setOn(true);
  }
  function unmount() {
    setOn(false);
    try { localStorage.setItem(KEY, '0'); } catch (e) {}
    document.removeEventListener('keydown', onKey);
    document.querySelectorAll('.lamp-btn').forEach(function (b) { b.remove(); });
    document.querySelectorAll('.lamp-unit, .lamp-host, .is-lit').forEach(function (u) { u.classList.remove('lamp-unit', 'lamp-host', 'is-lit'); });
    lit = null; units = []; hosts = [];
  }
  window.GardenDesigns = window.GardenDesigns || {};
  window.GardenDesigns['lamp'] = { mount: mount, unmount: unmount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
