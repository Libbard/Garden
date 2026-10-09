;(function () {
  'use strict';
  var lead = null, mo = null, tm = null, host = null;
  var DIG = '٠١٢٣٤٥٦٧٨٩';
  var DW_AR = { 2: 'يومان', 3: 'ثلاثةُ أيّام', 4: 'أربعةُ أيّام', 5: 'خمسةُ أيّام', 6: 'ستّةُ أيّام', 7: 'سبعةُ أيّام', 8: 'ثمانيةُ أيّام', 9: 'تسعةُ أيّام', 10: 'عشرةُ أيّام' };
  var DW_EN = { 2: 'Two days', 3: 'Three days', 4: 'Four days', 5: 'Five days', 6: 'Six days', 7: 'Seven days', 8: 'Eight days', 9: 'Nine days', 10: 'Ten days' };
  function arn(n) { return String(n).replace(/\d/g, function (d) { return DIG[+d]; }); }
  function isEn() { return document.documentElement.getAttribute('lang') === 'en'; }
  function q(s, r) { return (r || document).querySelector(s); }
  function txt(n) { return n ? (n.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function parseDays(s) {
    s = (s || '').trim();
    if (!s) return null;
    if (/^(اليوم|today)$/i.test(s)) return 0;
    if (/^(غداً|غدا|tomorrow)$/i.test(s)) return 1;
    var late = /متأخر|late/i.test(s);
    var m = s.replace(/[٠-٩]/g, function (d) { return DIG.indexOf(d); }).match(/\d+/);
    var n = m ? +m[0] : (/يومين|يومان/.test(s) ? 2 : (/يوم|day/i.test(s) ? 1 : null));
    if (n === null) return null;
    return late ? -n : n;
  }
  function whenAr(d) {
    if (d === 0) return 'اليوم';
    if (d === 1) return 'غداً';
    if (d === 2) return 'بعد يومين';
    if (d > 2 && d <= 10) return 'بعد ' + arn(d) + ' أيّام';
    return 'بعد ' + arn(d) + ' يوماً';
  }
  function whenEn(d) {
    if (d === 0) return 'today';
    if (d === 1) return 'tomorrow';
    return 'in ' + d + ' days';
  }
  function read() {
    var r = { name: '', exam: null, tasks: 0, tdays: null, due: 0, dueOk: false };
    var g = txt(q('.widget[data-widget="welcome"] .dash-greet-n'));
    var cut = g.split(/،\s*|,\s*/);
    if (cut.length > 1) r.name = cut.slice(1).join(' ').trim();
    var x = q('#dash-exam-slot:not([hidden]) .dash-xam');
    if (x) {
      var b = txt(q('.dash-xam-num b', x));
      var d = /^\d+$/.test(b) ? +b : parseDays(b);
      if (d !== null && d >= 0) r.exam = { d: d, fin: /نهائ|final/i.test(txt(q('.dash-xam-t', x))), href: x.getAttribute('href') || 'hub/schedule.html' };
    }
    var tw = q('.widget[data-widget="tasks"]');
    if (tw) {
      var items = tw.querySelectorAll('.widget-list > .widget-item');
      var more = txt(q('.dash-today-cnt', tw)).match(/\+\s*(\d+)/);
      r.tasks = items.length + (more ? +more[1] : 0);
      if (items.length) {
        var lab = items[0].lastElementChild;
        r.tdays = parseDays(txt(lab));
      }
    }
    var dw = q('.widget[data-widget="due"]');
    if (dw) {
      var c = txt(q('.dash-due-count b', dw));
      if (/^\d+$/.test(c)) r.due = +c;
      r.dueOk = !!q('.widget-empty', dw) || r.due > 0;
    }
    return r;
  }
  function A(label, attrs) { return { l: label, a: attrs }; }
  function model(r, en) {
    var h = new Date().getHours(), out = [], cl = [];
    var greet = en ? (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') : (h < 12 ? 'صباح الخير' : 'مساء الخير');
    out.push(greet + (r.name ? (en ? ', ' : '، ') + r.name : '') + '. ');
    if (r.exam) {
      var d = r.exam.d, link = { href: r.exam.href };
      var kAr = r.exam.fin ? 'الاختبارات النهائيّة' : 'الاختبارات النصفيّة';
      var kEn = r.exam.fin ? 'finals' : 'midterms';
      if (en) cl.push(d >= 2 ? [A(DW_EN[d] || (d + ' days'), link), ' until ' + kEn] : [kEn + ' ', A(d ? 'tomorrow' : 'today', link)]);
      else cl.push(d >= 2 ? ['أمامك ', A(DW_AR[d] || (arn(d) + ' يوماً'), link), ' على ' + kAr] : [kAr + ' ', A(d ? 'غداً' : 'اليوم', link)]);
    }
    if (r.tasks > 0) {
      var n = r.tasks, td = r.tdays, act = { act: 'tasks-open' };
      if (en) {
        var we = td === null ? '' : td < 0 ? ' overdue' : ' due ' + whenEn(td);
        cl.push(n === 1 ? [A('a task', act), we || ' coming up'] : [A(n + ' tasks', act), td === null ? ' coming up' : ' with the next' + (td < 0 ? ' overdue' : ' due ' + whenEn(td))]);
      } else {
        var wa = td === null ? null : td < 0 ? 'متأخّرة' : whenAr(td);
        if (n === 1) cl.push([A('مهمّةٌ', act), wa === null ? ' قادمة' : td < 0 ? ' متأخّرة' : ' تستحقّ ' + wa]);
        else if (n === 2) cl.push([A('مهمّتان', act), wa === null ? ' قادمتان' : ' أقربُهما ' + wa]);
        else cl.push([A(arn(n) + (n <= 10 ? ' مهامّ' : ' مهمّة'), act), wa === null ? ' قادمة' : ' أقربُها ' + wa]);
      }
    }
    if (r.due > 0) {
      var m = r.due, da = { act: 'due-open' };
      if (en) cl.push([A(m === 1 ? 'one card' : m + ' cards', da), ' waiting for review']);
      else cl.push(m === 1 ? [A('بطاقةٌ', da), ' تنتظر مراجعتك'] : m === 2 ? [A('بطاقتان', da), ' تنتظران مراجعتك'] : [A(arn(m) + (m <= 10 ? ' بطاقات' : ' بطاقة'), da), ' تنتظر مراجعتك']);
    }
    if (!cl.length) {
      out.push(en ? 'A quiet day — nothing is waiting for you.' : 'يومُك هادئ؛ لا شيءَ ينتظرك الآن.');
      return out;
    }
    if (!en && !r.exam) cl[0].unshift('أمامك ');
    if (en) {
      var f = cl[0][0];
      if (typeof f === 'string') cl[0][0] = f.charAt(0).toUpperCase() + f.slice(1);
      else f.l = f.l.charAt(0).toUpperCase() + f.l.slice(1);
    }
    cl.forEach(function (c, i) {
      if (i) out.push(en ? (cl.length === 2 ? ' and ' : (i === cl.length - 1 ? ', and ' : ', ')) : '، و');
      out = out.concat(c);
    });
    out.push('.');
    return out;
  }
  function paint() {
    tm = null;
    if (!lead) return;
    var en = isEn(), parts = model(read(), en);
    var frag = document.createDocumentFragment();
    parts.forEach(function (p) {
      if (typeof p === 'string') { frag.appendChild(document.createTextNode(p)); return; }
      var e;
      if (p.a.href) { e = document.createElement('a'); e.href = p.a.href; }
      else { e = document.createElement('span'); e.setAttribute('role', 'button'); e.tabIndex = 0; e.setAttribute('data-act', p.a.act); }
      e.className = 'qt-l';
      e.textContent = p.l;
      frag.appendChild(e);
    });
    lead.textContent = '';
    lead.appendChild(frag);
    lead.setAttribute('lang', en ? 'en' : 'ar');
    if (host && lead.parentNode !== host) host.insertBefore(lead, host.firstChild);
  }
  function key(e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('role') === 'button') { e.preventDefault(); e.target.click(); }
  }
  function soon() { if (!tm) tm = setTimeout(paint, 60); }
  function mount() {
    if (lead) return;
    var sec = q('section[data-view="overview"]');
    host = sec && sec.firstElementChild;
    if (!host) return;
    lead = document.createElement('p');
    lead.className = 'qt-lead';
    lead.setAttribute('aria-live', 'polite');
    lead.addEventListener('keydown', key);
    host.insertBefore(lead, host.firstChild);
    paint();
    mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) { if (!lead || !lead.contains(list[i].target)) { soon(); return; } }
    });
    ['widgets-grid', 'dash-exam-slot'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) mo.observe(n, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
    });
    document.addEventListener('garden:languageChanged', soon);
  }
  function unmount() {
    if (mo) mo.disconnect();
    mo = null;
    if (tm) clearTimeout(tm);
    tm = null;
    document.removeEventListener('garden:languageChanged', soon);
    if (lead && lead.parentNode) lead.parentNode.removeChild(lead);
    lead = null; host = null;
  }
  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.quiet = { mount: mount, unmount: unmount };
})();
