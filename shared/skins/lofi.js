;(function () {
  'use strict';
  var D = document, R = D.documentElement;
  var world = null, mo = null, tm = null, clockT = null, on = false;
  var DIG = '٠١٢٣٤٥٦٧٨٩';
  var LIGHTS = [
    [37.8, 45.4, 'y', 3.1], [36.5, 43.5, 'y', 4.2], [24.4, 46.4, 'y', 3.6], [34.0, 37.4, 'y', 5.2], [48.6, 43.1, 'y', 3.9],
    [53.4, 45.7, 'w', 4.6], [60.4, 46.6, 'w', 3.3], [61.8, 48.9, 'y', 5.6], [65.8, 43.0, 'y', 4.1], [60.6, 63.9, 'y', 3.7],
    [76.9, 48.3, 'w', 4.4], [80.3, 44.9, 'y', 3.2], [81.8, 49.1, 'w', 5.1], [88.6, 47.9, 'w', 3.8], [86.5, 67.2, 'w', 4.7],
    [92.4, 62.6, 'y', 3.4], [94.0, 66.2, 'y', 5.4], [95.2, 61.0, 'y', 4.0]
  ];
  var DROPS = [[8, 6, 9], [17, 22, 12], [29, 9, 10], [41, 27, 14], [53, 12, 11], [64, 20, 13], [72, 5, 9.5], [83, 25, 12.5], [93, 14, 10.5]];
  function isEn() { return R.getAttribute('lang') === 'en'; }
  function arn(n) { return String(n).replace(/\d/g, function (d) { return DIG[+d]; }); }
  function num(n) { return isEn() ? String(n) : arn(n); }
  function txt(n) { return n ? (n.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  function mkWorld() {
    if (world) return;
    world = D.createElement('div');
    world.className = 'lo-world';
    world.setAttribute('aria-hidden', 'true');
    var h = '<div class="lo-box"><i class="lo-lamp" style="--x:68.5%;--y:56%"></i>';
    LIGHTS.forEach(function (p, i) {
      h += '<i class="lo-tw" style="--x:' + p[0] + '%;--y:' + p[1] + '%;--c:' + (p[2] === 'w' ? '220,235,255' : '255,206,130') + ';--t:' + p[3] + 's;--d:' + (-(i * 0.73) % p[3]).toFixed(2) + 's"></i>';
    });
    DROPS.forEach(function (p, i) {
      h += '<i class="lo-drop" style="--x:' + p[0] + '%;--y:' + p[1] + '%;--t:' + p[2] + 's;--d:' + (-(i * 1.7) % p[2]).toFixed(2) + 's"></i>';
    });
    world.innerHTML = h + '</div>';
    D.body.insertBefore(world, D.body.firstChild);
  }

  function daysOf(b) {
    var s = txt(b).replace(/[٠-٩]/g, function (d) { return DIG.indexOf(d); });
    if (/^(اليوم|today)$/i.test(s)) return 0;
    if (/^(غداً|غدا|tomorrow)$/i.test(s)) return 1;
    return /^\d+$/.test(s) ? +s : null;
  }
  function cal() {
    var a = D.querySelector('#dash-exam-slot .dash-xam');
    if (!a) return;
    var n = daysOf(a.querySelector('.dash-xam-num b'));
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var key = n + '|' + (isEn() ? 'en' : 'ar') + '|' + t.getTime();
    var old = a.querySelector(':scope > .lo-cal');
    if (old && old.getAttribute('data-k') === key) return;
    if (old) old.parentNode.removeChild(old);
    if (n === null || n < 0 || n > 62) return;
    var e = new Date(t); e.setDate(t.getDate() + n);
    var y = e.getFullYear(), m = e.getMonth();
    var first = new Date(y, m, 1).getDay(), len = new Date(y, m + 1, 0).getDate();
    var mon = '';
    try { mon = new Intl.DateTimeFormat(isEn() ? 'en-GB' : 'ar-SA-u-ca-gregory', { month: 'long' }).format(e); } catch (x) { mon = String(m + 1); }
    var dn = isEn() ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
    var g = '';
    dn.forEach(function (d) { g += '<i class="lo-dn">' + d + '</i>'; });
    for (var k = 0; k < first; k++) g += '<i></i>';
    for (var d = 1; d <= len; d++) {
      var cur = new Date(y, m, d), c = [];
      if (cur < t) c.push('lo-past');
      if (cur.getTime() === t.getTime()) c.push('lo-today');
      if (d === e.getDate()) c.push('lo-exam');
      if (cur.getDay() === 5) c.push('lo-fri');
      g += '<i' + (c.length ? ' class="' + c.join(' ') + '"' : '') + '>' + num(d) + '</i>';
    }
    var el = D.createElement('span');
    el.className = 'lo-cal';
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('data-k', key);
    el.innerHTML = '<span class="lo-cal-h"><b>' + mon + '<i>' + y + '</i></b></span><span class="lo-cal-g">' + g + '</span>';
    a.insertBefore(el, a.firstChild);
  }

  function clockText() {
    var d = new Date(), h = d.getHours() % 12 || 12, mm = d.getMinutes();
    var day = '';
    try { day = new Intl.DateTimeFormat(isEn() ? 'en-GB' : 'ar-SA-u-ca-gregory-nu-arab', { weekday: 'long', day: 'numeric', month: 'long' }).format(d); } catch (x) {}
    return { t: h + ':' + (mm < 10 ? '0' : '') + mm, d: day };
  }
  function clock() {
    var w = D.querySelector('.widget[data-widget="today"]');
    if (!w) return;
    var head = w.querySelector(':scope > .widget-head');
    var c = w.querySelector(':scope > .lo-clock');
    var v = clockText();
    if (!c) {
      c = D.createElement('span');
      c.className = 'lo-clock';
      c.setAttribute('aria-hidden', 'true');
      c.innerHTML = '<b></b><small></small>';
      if (head && head.nextSibling) w.insertBefore(c, head.nextSibling); else w.appendChild(c);
    }
    var b = c.firstChild, s = c.lastChild;
    if (b.textContent !== v.t) b.textContent = v.t;
    if (s.textContent !== v.d) s.textContent = v.d;
  }

  function apply() {
    tm = null;
    if (!on) return;
    try { cal(); } catch (x) {}
    try { clock(); } catch (x) {}
  }
  function soon() { if (on && !tm) tm = setTimeout(apply, 40); }
  function vis() { R.classList.toggle('lo-paused', !!D.hidden); }

  function mount() {
    if (on || !D.body) return;
    on = true;
    mkWorld();
    apply();
    mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var t = list[i].target;
        if (t.nodeType !== 1) t = t.parentNode;
        if (t && t.closest && t.closest('.lo-cal, .lo-clock')) continue;
        soon();
        return;
      }
    });
    ['widgets-grid', 'dash-exam-slot'].forEach(function (id) {
      var n = D.getElementById(id);
      if (n) mo.observe(n, { childList: true, subtree: true, characterData: true });
    });
    clockT = setInterval(function () { if (!D.hidden) apply(); }, 20000);
    D.addEventListener('garden:languageChanged', soon);
    D.addEventListener('visibilitychange', vis);
    vis();
  }
  function unmount() {
    on = false;
    if (mo) mo.disconnect();
    mo = null;
    if (tm) clearTimeout(tm);
    tm = null;
    if (clockT) clearInterval(clockT);
    clockT = null;
    D.removeEventListener('garden:languageChanged', soon);
    D.removeEventListener('visibilitychange', vis);
    R.classList.remove('lo-paused');
    if (world && world.parentNode) world.parentNode.removeChild(world);
    world = null;
    Array.prototype.forEach.call(D.querySelectorAll('.lo-cal, .lo-clock'), function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
  }
  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.lofi = { mount: mount, unmount: unmount };
})();
