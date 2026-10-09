;(function () {
  'use strict';
  var on = false, grid = null, date = null, ro = null, mo = null, raf = 0, timer = null, watched = [];

  function isEn() { return document.documentElement.getAttribute('lang') === 'en'; }
  function fmt(loc, opt, d) {
    try { return new Intl.DateTimeFormat(loc, opt).format(d); } catch (e) { return ''; }
  }
  function parts(en) {
    var d = new Date();
    var g = en ? 'en-GB' : 'ar-SA-u-ca-gregory-nu-arab';
    var h = en ? 'en-u-ca-islamic-umalqura' : 'ar-SA-u-ca-islamic-umalqura-nu-arab';
    var n = fmt(g, { day: 'numeric' }, d) || String(d.getDate());
    var w = fmt(g, { weekday: 'long' }, d);
    var m = fmt(g, { month: 'long' }, d);
    var hj = fmt(h, { day: 'numeric', month: 'long', year: 'numeric' }, d).replace(/\s*(هـ|AH)$/, '');
    return { n: n, t: w + (en ? ', ' : '، ') + m, s: hj };
  }
  function paintDate() {
    if (!date) return;
    var a = parts(false), e = parts(true), en = isEn();
    var b = date.querySelector('b'), t = date.querySelector('.pl-date-t > span'), s = date.querySelector('.pl-date-t > small');
    b.setAttribute('data-ar', a.n); b.setAttribute('data-en', e.n);
    t.setAttribute('data-ar', a.t); t.setAttribute('data-en', e.t);
    s.setAttribute('data-ar', a.s); s.setAttribute('data-en', e.s);
    b.textContent = en ? e.n : a.n;
    t.textContent = en ? e.t : a.t;
    s.textContent = en ? e.s : a.s;
  }

  function items() {
    var out = [];
    if (!grid) return out;
    Array.prototype.forEach.call(grid.children, function (c) {
      if (c.id === 'widgets-grid' || c.id === 'dash-exam-slot') Array.prototype.forEach.call(c.children, function (k) { out.push(k); });
      else out.push(c);
    });
    return out;
  }
  function snap() {
    raf = 0;
    if (!grid || !grid.isConnected) return;
    var cs = getComputedStyle(grid);
    var L = parseFloat(cs.getPropertyValue('--pl-line')) || 32;
    var live = cs.getPropertyValue('--pl-snap').trim() === '1' && cs.display === 'grid';
    items().forEach(function (el) {
      if (!live) { el.style.removeProperty('grid-row-end'); return; }
      var h = el.offsetHeight;
      if (!h) { el.style.removeProperty('grid-row-end'); return; }
      var gap = parseFloat(getComputedStyle(el).getPropertyValue('--pl-after'));
      if (isNaN(gap)) gap = 1;
      var n = Math.max(1, Math.ceil((h - 1) / L) + gap);
      if (el.style.getPropertyValue('grid-row-end') !== 'span ' + n) el.style.setProperty('grid-row-end', 'span ' + n);
    });
  }
  function later() { if (!raf) raf = requestAnimationFrame(snap); }
  function watch() {
    if (!ro) return;
    watched.forEach(function (el) { ro.unobserve(el); });
    watched = items();
    watched.forEach(function (el) { ro.observe(el); });
    if (mo) {
      mo.disconnect();
      mo.observe(grid, { childList: true });
      ['widgets-grid', 'dash-exam-slot'].forEach(function (id) {
        var x = document.getElementById(id);
        if (x) mo.observe(x, { childList: true, attributes: true, attributeFilter: ['hidden'] });
      });
    }
    later();
  }
  function bind() {
    grid = document.querySelector('section[data-view="overview"] > div');
    if (!grid) return;
    if (!date || !date.isConnected) {
      date = document.createElement('div');
      date.className = 'pl-date';
      date.innerHTML = '<b></b><span class="pl-date-t"><span></span><small></small></span>';
      grid.insertBefore(date, grid.firstChild);
      paintDate();
    }
    grid.setAttribute('data-pl-snap', '');
    if (window.ResizeObserver) ro = new ResizeObserver(later);
    if (window.MutationObserver) mo = new MutationObserver(watch);
    snap();
    watch();
  }
  function onLang() { paintDate(); later(); }
  function mount() {
    if (on) return;
    on = true;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
    else bind();
    document.addEventListener('garden:languageChanged', onLang);
    window.addEventListener('resize', later);
    timer = setInterval(paintDate, 60000);
  }
  function unmount() {
    if (!on) return;
    on = false;
    document.removeEventListener('DOMContentLoaded', bind);
    document.removeEventListener('garden:languageChanged', onLang);
    window.removeEventListener('resize', later);
    if (timer) clearInterval(timer);
    timer = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (ro) ro.disconnect();
    if (mo) mo.disconnect();
    ro = mo = null;
    watched = [];
    if (grid) {
      items().forEach(function (el) { el.style.removeProperty('grid-row-end'); });
      grid.removeAttribute('data-pl-snap');
    }
    if (date && date.parentNode) date.parentNode.removeChild(date);
    date = null;
    grid = null;
  }
  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.planner = { mount: mount, unmount: unmount };
})();
