;(function () {
  'use strict';
  var bar = null, timer = null;
  function fmt(lang) {
    var d = new Date(), out = '';
    try {
      var g = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory-nu-arab', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
      var h = new Intl.DateTimeFormat(lang === 'en' ? 'en-u-ca-islamic-umalqura' : 'ar-SA-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long' }).format(d);
      out = g + ' · ' + h.replace(/\s*(هـ|AH)$/, '');
    } catch (e) {}
    var hr = d.getHours();
    var gr = lang === 'en' ? (hr < 12 ? 'Good morning' : 'Good evening') : (hr < 12 ? 'صباح الخير' : 'مساء الخير');
    return gr + ' · ' + out;
  }
  function paint() {
    if (!bar) return;
    var c = bar.querySelector('.hn-c span');
    c.setAttribute('data-ar', fmt('ar'));
    c.setAttribute('data-en', fmt('en'));
    c.textContent = (document.documentElement.getAttribute('lang') === 'en') ? fmt('en') : fmt('ar');
  }
  function key(k, ar, en) {
    return '<span><kbd>' + k + '</kbd><b data-ar="' + ar + '" data-en="' + en + '">' + ar + '</b></span>';
  }
  function mount() {
    if (bar) return;
    bar = document.createElement('div');
    bar.className = 'hn-hints';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<div class="hn-c"><i class="fa-solid fa-moon"></i><span></span></div>' +
      '<div class="hn-k">' + key('Ctrl K', 'ابحث', 'Search') + key('↵', 'افتح', 'Open') + key('Esc', 'رجوع', 'Back') + '</div>';
    document.body.appendChild(bar);
    paint();
    if (document.documentElement.getAttribute('lang') === 'en') {
      Array.prototype.forEach.call(bar.querySelectorAll('b[data-en]'), function (b) { b.textContent = b.getAttribute('data-en'); });
    }
    timer = setInterval(paint, 60000);
    document.addEventListener('garden:languageChanged', paint);
  }
  function unmount() {
    if (timer) clearInterval(timer);
    timer = null;
    document.removeEventListener('garden:languageChanged', paint);
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    bar = null;
  }
  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.hunter = { mount: mount, unmount: unmount };
})();
