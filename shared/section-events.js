/*@3.SEEJ.1*/
;(function () {
  'use strict';

  function isAr() { return document.documentElement.getAttribute('lang') !== 'en'; }
  function t(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var AR = {
    seats: 'تغيّرت المقاعد', capacity: 'تغيّر سقف الشعبة',
    faculty: 'تغيّر الأستاذ', mode: 'تغيّرت طريقة الحضور',
    'class': 'تغيّر وقت المحاضرة', exam: 'تغيّر موعد اختبار',
    appeared: 'ظهرت في البانر', vanished: 'اختفت من البانر',
    returned: 'عادت للظهور', room: 'تغيّرت القاعة'
  };
  var EN = {
    seats: 'Seats changed', capacity: 'Capacity changed', faculty: 'Instructor changed',
    mode: 'Delivery mode changed', 'class': 'Class time changed', exam: 'Exam moved',
    appeared: 'Appeared in Banner', vanished: 'Disappeared from Banner',
    returned: 'Reappeared', room: 'Room changed'
  };
  function label(kind) { return (isAr() ? AR : EN)[kind] || kind; }

  var DAYS = { sunday: ['الأحد', 'Sun'], monday: ['الإثنين', 'Mon'], tuesday: ['الثلاثاء', 'Tue'],
               wednesday: ['الأربعاء', 'Wed'], thursday: ['الخميس', 'Thu'], friday: ['الجمعة', 'Fri'],
               saturday: ['السبت', 'Sat'] };
  var ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var MEET = { MEXM: ['الميد', 'Midterm'], FEXM: ['الفاينل', 'Final'], CLAS: ['حضوري', 'On campus'], VRTL: ['عن بعد', 'Remote'] };

  function clock(h, m) {
    return (h % 12 || 12) + ':' + m + ' ' + (h < 12 ? t('ص', 'AM') : t('م', 'PM'));
  }
  function hm(v, exam) {
    var s = String(v == null ? '' : v);
    if (s.length < 3 || !/^\d+$/.test(s)) return '';
    var h = parseInt(s.slice(0, -2), 10);
    /*@3.SEEJ.2*/
    if (exam && h >= 1 && h <= 11) h += 12;
    return clock(h, s.slice(-2));
  }
  function day(s) {
    var p = String(s || '').split('/');
    return p.length === 3 ? p[1] + '/' + p[0] : String(s || '');
  }
  function days(ds) {
    return (ds || []).slice().sort(function (a, b) { return ORDER.indexOf(a) - ORDER.indexOf(b); })
      .map(function (d) { return DAYS[d] ? DAYS[d][isAr() ? 0 : 1] : d; }).join(isAr() ? '، ' : ', ');
  }
  function meetTxt(m, exam) {
    if (!m) return '';
    if (exam) return day(m.start_date) + (m.begin ? ' · ' + hm(m.begin, true) : '');
    var a = hm(m.begin), b = hm(m.end);
    return days(m.days) + (a ? ' ' + a + (b ? '–' + b : '') : '');
  }

  function arrow() { return isAr() ? ' ← ' : ' → '; }
  /*@3.SEEJ.3*/
  function row(name, was, now, note) {
    var h = '<span class="gse-diff">' + (name ? '<em>' + esc(name) + '</em> ' : '');
    var hasWas = was !== '' && was != null, hasNow = now !== '' && now != null;
    if (hasWas) h += '<s class="gse-old">' + esc(was) + '</s>';
    if (hasWas && hasNow) h += arrow();
    if (hasNow) h += '<strong class="gse-new">' + esc(now) + '</strong>';
    if (note) h += ' <i>' + esc(note) + '</i>';
    return h + '</span>';
  }
  function num(v) { return (v === null || v === undefined || v === '') ? '—' : String(v); }

  function meetDiff(kind, b, a) {
    var exam = kind === 'exam', types = [];
    b.concat(a).forEach(function (m) { if (m && m.type && types.indexOf(m.type) < 0) types.push(m.type); });
    return types.map(function (ty) {
      var bs = b.filter(function (m) { return m && m.type === ty; }).map(function (m) { return meetTxt(m, exam); });
      var as = a.filter(function (m) { return m && m.type === ty; }).map(function (m) { return meetTxt(m, exam); });
      var gone = bs.filter(function (x) { return as.indexOf(x) < 0; });
      var added = as.filter(function (x) { return bs.indexOf(x) < 0; });
      if (!gone.length && !added.length) return '';
      var l = MEET[ty], name = l ? l[isAr() ? 0 : 1] : ty;
      var note = !added.length ? t('أُزيل', 'removed')
               : (!b.length ? t('أوّلُ نشر', 'first published') : (!gone.length ? t('جديد', 'new') : ''));
      return row(name, gone.join('، '), added.join('، '), note);
    }).join('');
  }

  function rooms(x) {
    var out = [], at = (x && x.at) || {};
    Object.keys(at).forEach(function (k) {
      var v = at[k];
      if (v && v.room) {
        var r = ((v.building ? v.building + ' · ' : '') + v.room);
        if (out.indexOf(r) < 0) out.push(r);
      }
    });
    return out.join('، ');
  }
  function names(v) {
    return (Array.isArray(v) ? v : []).map(function (p) { return (p && p.n) || (p && p.name) || p || ''; })
      .filter(Boolean).join('، ');
  }

  /*@3.SEEJ.4*/
  function detail(e) {
    var b = e && e.before, a = e && e.after, k = e && e.kind;
    if (!e) return '';
    if (k === 'seats') {
      var h = row(t('المتاح', 'Available'), num(b && b.avail), num(a && a.avail));
      if ((b && b.wait) !== (a && a.wait) && (b || a)) h += row(t('الانتظار', 'Waitlist'), num(b && b.wait), num(a && a.wait));
      return h;
    }
    if (k === 'capacity') return row(t('السقف', 'Capacity'), num(b && b.max), num(a && a.max));
    if (k === 'faculty') return row('', names(b) || t('بلا أستاذ', 'none'), names(a) || t('بلا أستاذ', 'none'));
    if (k === 'mode') {
      var md = function (x) { return x ? (x.in_person ? t('حضوريّة', 'on campus') : t('عن بعد', 'remote')) : '—'; };
      return row('', md(b), md(a));
    }
    if (k === 'room') return row('', rooms(b) || t('لم تُعلَن', 'not set'), rooms(a) || t('لم تُعلَن', 'not set'));
    if ((k === 'exam' || k === 'class') && (Array.isArray(b) || Array.isArray(a))) {
      return meetDiff(k, Array.isArray(b) ? b : [], Array.isArray(a) ? a : []);
    }
    return '';
  }

  window.GardenSecEvents = { label: label, detail: detail };
})();
