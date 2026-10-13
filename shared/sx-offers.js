/*@3.SXOJ.1*/
;(function () {
  'use strict';

  var host = null, busy = {}, lastRef = 0;
  var REFRESH_MS = 5 * 60 * 1000;

  function isAr() { return document.documentElement.getAttribute('lang') !== 'en'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function X() { return window.GardenSXLink || null; }

  var DAYS = { sunday: ['الأحد', 'Sun'], monday: ['الإثنين', 'Mon'], tuesday: ['الثلاثاء', 'Tue'],
               wednesday: ['الأربعاء', 'Wed'], thursday: ['الخميس', 'Thu'], friday: ['الجمعة', 'Fri'],
               saturday: ['السبت', 'Sat'] };

  function hm(v) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(v || ''));
    if (!m) return '';
    var h = +m[1], ap = h >= 12 ? L('م', 'PM') : L('ص', 'AM');
    h = h % 12 || 12;
    return h + ':' + m[2] + ' ' + ap;
  }
  function day(v) {
    var d = new Date(String(v || '') + 'T12:00:00');
    if (isNaN(d.getTime())) return String(v || '');
    return d.toLocaleDateString(isAr() ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB',
                                { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function span(o) {
    var a = hm(o.start_time), b = hm(o.end_time);
    return a ? (b ? a + ' – ' + b : a) : L('بلا ساعة', 'no time');
  }
  function side(o, kind) {
    var when = kind === 'exam' ? day(o.date) : ((DAYS[o.day] || [o.day, o.day])[isAr() ? 0 : 1]);
    var bits = [when, span(o)];
    if (o.room) bits.push(L('قاعة ', 'Room ') + o.room);
    if (kind === 'lec' && o.attendance) bits.push(o.attendance === 'remote' ? L('عن بُعد', 'remote') : L('حضوري', 'in person'));
    return bits.join(' · ');
  }
  function head(x) {
    if (x.kind === 'exam') {
      var et = x.to.exam_type || x.from.exam_type;
      var n = et === 'final' ? L('النهائيّ', 'final') : (et === 'midterm' ? L('الميد', 'midterm') : L('الاختبار', 'exam'));
      return L('تغيّر موعدُ ' + n + ' في بانر', 'Banner changed the ' + n + ' time');
    }
    return L('تغيّر وقتُ محاضرةٍ في بانر', 'Banner changed a lecture time');
  }

  function render() {
    if (!host) return;
    var S = X();
    var list = (S && S.offers) ? S.offers() : [];
    if (!list.length) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    host.innerHTML = list.map(function (x) {
      var id = esc(x.id);
      var stop = x.kind === 'exam'
        ? L('لا تحدّث اختبارات هذه الشعبة من بانر بعد الآن', 'Stop updating this section’s exams from Banner')
        : L('لا تحدّث محاضرات هذه الشعبة من بانر بعد الآن', 'Stop updating this section’s lectures from Banner');
      return '<div class="sch-icsbar sx-offer" data-id="' + id + '">' +
        '<i class="fa-solid fa-calendar-check" aria-hidden="true"></i>' +
        '<div class="sch-icsbar-t">' +
          '<b>' + esc(head(x)) + ' · <bdi class="sx-offer-code">' + esc(x.code) + '</bdi></b>' +
          '<span class="sx-offer-was">' + esc(L('في جدولك: ', 'Your schedule: ')) + '<s>' + esc(side(x.from, x.kind)) + '</s></span>' +
          '<span class="sx-offer-now">' + esc(L('في بانر الآن: ', 'Banner now: ')) + '<b>' + esc(side(x.to, x.kind)) + '</b></span>' +
          '<label class="sx-offer-stop"><input type="checkbox" data-stop> ' + esc(stop) + '</label>' +
        '</div>' +
        '<div class="sx-offer-acts">' +
          '<button type="button" class="sch-icsbar-go" data-act="yes">' + esc(L('اعتمد الموعد الجديد', 'Use the new time')) + '</button>' +
          '<button type="button" class="sx-offer-keep" data-act="no">' + esc(L('أبقِ موعدي', 'Keep mine')) + '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function onClick(e) {
    var b = e.target.closest && e.target.closest('[data-act]');
    if (!b || !host.contains(b)) return;
    var card = b.closest('.sx-offer');
    var id = card && card.getAttribute('data-id');
    var S = X();
    if (!id || !S || !S.decide || busy[id]) return;
    busy[id] = 1;
    var stop = !!(card.querySelector('[data-stop]') || {}).checked;
    var ok = S.decide(id, b.getAttribute('data-act') === 'yes', stop);
    delete busy[id];
    if (!ok) {
      b.textContent = L('تعذّر الحفظ — مساحةُ التخزين ممتلئة', 'Could not save — storage full');
      return;
    }
    render();
  }

  function refresh(force) {
    var S = X();
    if (!S || !S.refresh) return;
    if (!force && Date.now() - lastRef < REFRESH_MS) return;
    lastRef = Date.now();
    S.refresh().then(render, render);
  }

  function boot() {
    host = document.getElementById('sx-offers');
    if (!host) return;
    host.addEventListener('click', onClick);
    render();
    refresh(true);
    window.addEventListener('garden:scheduleChanged', render);
    window.addEventListener('garden:languageChanged', render);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') refresh(false);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.GardenSXOffers = { render: render, refresh: refresh };
})();
