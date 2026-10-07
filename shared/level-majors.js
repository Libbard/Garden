/*@3.LEMJ.1*/
(function () {
  'use strict';

  var self = document.currentScript;
  var BASE = (self && self.src) ? self.src.replace(/shared\/level-majors\.js.*$/, '') : '../';
  var VIEW = 'garden_view_major';
  var ORDER = ['CS', 'IT', 'DS'];
  var LV_AR = { 3: 'الثالث', 4: 'الرابع', 5: 'الخامس', 6: 'السادس', 7: 'السابع', 8: 'الثامن' };
  var m = location.pathname.match(/\/(L([3-8])|others)\/(?:index\.html)?$/);
  if (!m) return;
  var LEVEL = m[2] || null;
  var DATA = null, MAJOR = 'CS', MINE = null;

  function lang() { return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ar'; }
  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bi(ar, en, tag) {
    tag = tag || 'span';
    return '<' + tag + ' data-ar="' + esc(ar) + '" data-en="' + esc(en) + '">' + esc(lang() === 'en' ? en : ar) + '</' + tag + '>';
  }

  function profileMajor() {
    var p = readJSON('student_profile');
    var slug = p && p.program;
    return (slug && DATA.slugs[slug]) || null;
  }
  function pick() {
    var v = null;
    try { v = localStorage.getItem(VIEW); } catch (e) {}
    return ORDER.indexOf(v) >= 0 ? v : (MINE || 'CS');
  }

  function progress(code, total) {
    var done = 0;
    for (var i = 1; i <= total; i++) {
      try { if (parseInt(localStorage.getItem('garden_' + code + '_m' + i + '_quiz'), 10) > 0) done++; } catch (e) {}
    }
    return done;
  }

  function cardHTML(r) {
    var soon = !r.path;
    var code = r.src || r.code;
    var mods = r.modules || 0;
    var color = r.color || 'var(--brand-500)';
    var href = soon ? 'javascript:void(0)' : BASE + r.path + 'index.html';
    var note = soon
      ? bi('قريباً في الحديقة', 'Coming to the garden soon')
      : r.src
        ? bi('المحتوى نفسُه في ' + r.src, 'Same content as ' + r.src)
        : bi(mods + ' وحدة', mods + ' modules');
    var icon = soon ? 'fa-solid fa-hourglass-half' : (r.icon || 'fa-solid fa-book');
    var done = soon || !mods ? 0 : progress(code, mods);
    var pct = mods ? Math.round(done / mods * 100) : 0;
    var desc = r.track
      ? '<div class="subject-card-desc mj-track">' + bi(r.track_ar || r.track, r.track) + '</div>'
      : (r.desc_ar ? '<div class="subject-card-desc">' + bi(r.desc_ar, r.desc_en || r.desc_ar) + '</div>' : '');
    return '<a href="' + esc(href) + '" class="subject-card fade-up visible mj-card' + (soon ? ' locked-card' : '') + '"' +
      ' style="--card-accent:' + esc(color) + '; --card-glow:color-mix(in oklab, ' + esc(color) + ' 12%, transparent);"' +
      ' data-subject-code="' + esc(code) + '" data-total-modules="' + (mods || 13) + '"' +
      (soon ? ' aria-disabled="true" tabindex="-1"' : '') + '>' +
      '<div class="subject-card-header"><div class="subject-card-icon"><i class="' + esc(icon) + '" aria-hidden="true"></i></div>' +
      '<div class="subject-card-titles"><div class="subject-card-code">' + esc(r.code) + '</div>' + bi(r.ar, r.en, 'h2') + '</div></div>' +
      desc +
      '<div class="subject-card-progress"><div class="subject-card-bar"><div class="subject-card-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="subject-card-pct">' + pct + '%</span></div>' +
      '<div class="subject-card-meta"><span><i class="' + (soon ? 'fa-solid fa-seedling' : r.src ? 'fa-solid fa-link' : 'fa-solid fa-boxes-stacked') +
      '" aria-hidden="true"></i> ' + note + '</span></div></a>';
  }

  function sep(ar, en) {
    return '<div class="mj-sep">' + bi(ar, en) + '</div>';
  }

  function renderLevel(grid) {
    grid.querySelectorAll('.mj-card, .mj-sep').forEach(function (n) { n.remove(); });
    var statics = grid.querySelectorAll(':scope > :not(.mj-card):not(.mj-sep)');
    var mine = MAJOR !== 'CS';
    statics.forEach(function (n) { n.hidden = mine; });
    var rows = (DATA.majors[MAJOR].levels[LEVEL] || []);
    if (mine) {
      var core = rows.filter(function (r) { return !r.track; });
      var tracks = {};
      rows.forEach(function (r) { if (r.track) (tracks[r.track] = tracks[r.track] || []).push(r); });
      var html = core.map(cardHTML).join('');
      Object.keys(tracks).forEach(function (t) {
        html += sep((tracks[t][0].track_ar || t) + ' — موادُّ اختيارية', t + ' — electives') + tracks[t].map(cardHTML).join('');
      });
      grid.insertAdjacentHTML('beforeend', html);
    }
    var mods = 0;
    rows.forEach(function (r) { mods += r.modules || 0; });
    var maj = DATA.majors[MAJOR];
    setBi(document.querySelector('.dash-hero-level [data-bilingual]'),
      'المستوى ' + LV_AR[LEVEL] + ' · ' + rows.length + ' مواد · ' + mods + ' وحدة',
      'Level ' + LEVEL + ' · ' + rows.length + ' Subjects · ' + mods + ' Modules');
    setBi(document.querySelector('.dash-hero-sub'),
      'مساحتك الشخصية لإتقان ' + maj.ar + ' — تعلّم، راجع، اختبر',
      'Your personal space to master ' + maj.en + ' — learn, review, test');
    setBi(document.querySelector('.dash-signature [data-bilingual]'),
      'الحديقة الرقمية · المستوى ' + LV_AR[LEVEL] + ' · ' + maj.ar,
      'Digital Garden · Level ' + LEVEL + ' · ' + maj.en);
    overall(grid);
  }

  function renderGeneral() {
    var wanted = {};
    DATA.majors[MAJOR].general.forEach(function (r) { wanted[r.code] = r; });
    document.querySelectorAll('.mj-card').forEach(function (n) { n.remove(); });
    var seen = {};
    document.querySelectorAll('.category-grid > .subject-card[data-subject-code]').forEach(function (c) {
      var code = c.getAttribute('data-subject-code');
      seen[code] = c;
      c.hidden = !wanted[code];
    });
    Object.keys(wanted).forEach(function (code) {
      if (seen[code]) return;
      var prefix = code.replace(/\d.*$/, '');
      var sib = null;
      Object.keys(seen).some(function (k) { if (k.indexOf(prefix) === 0) { sib = seen[k]; return true; } return false; });
      var grid = sib ? sib.parentNode : document.querySelector('.category-grid');
      if (grid) grid.insertAdjacentHTML('beforeend', cardHTML(wanted[code]));
    });
    document.querySelectorAll('.category-section').forEach(function (s) {
      var n = s.querySelectorAll('.category-grid > .subject-card:not([hidden])').length;
      s.hidden = n === 0;
      var cnt = s.querySelector('.category-count');
      if (cnt) cnt.textContent = n;
    });
    var all = DATA.majors[MAJOR].general, mods = 0;
    all.forEach(function (r) { mods += r.modules || 0; });
    setBi(document.querySelector('.dash-hero-level [data-bilingual]'),
      all.length + ' مقررات · ' + mods + ' وحدة · ' + DATA.majors[MAJOR].ar,
      all.length + ' Courses · ' + mods + ' Modules · ' + DATA.majors[MAJOR].en);
  }

  function setBi(el, ar, en) {
    if (!el) return;
    var ta = el.querySelector('template.content-ar'), te = el.querySelector('template.content-en'), t = el.querySelector('.content-target');
    if (ta) ta.innerHTML = esc(ar);
    if (te) te.innerHTML = esc(en);
    if (t) t.textContent = lang() === 'en' ? en : ar;
  }

  function overall(grid) {
    var d = 0, t = 0;
    grid.querySelectorAll('.subject-card:not([hidden]):not(.locked-card)').forEach(function (c) {
      var n = parseInt(c.getAttribute('data-total-modules'), 10) || 13;
      d += progress(c.getAttribute('data-subject-code'), n); t += n;
    });
    var pct = t ? Math.round(d / t * 100) : 0;
    var f = document.getElementById('overall-fill'), p = document.getElementById('overall-pct');
    if (f) f.style.width = pct + '%';
    if (p) p.textContent = pct + '%';
  }

  function switchHTML() {
    return '<div class="mj-switch fade-up visible" role="radiogroup" aria-label="التخصّص" data-ar-title="التخصّص" data-en-title="Major">' +
      ORDER.map(function (k) {
        var d = DATA.majors[k];
        return '<button type="button" role="radio" class="mj-opt" data-major="' + k + '" aria-checked="false">' +
          bi(d.ar, d.en) + (k === MINE ? '<i class="fa-solid fa-user mj-mine" aria-hidden="true"></i>' : '') + '</button>';
      }).join('') + '</div>';
  }

  function apply() {
    document.querySelectorAll('.mj-opt').forEach(function (b) {
      var on = b.getAttribute('data-major') === MAJOR;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.classList.toggle('on', on);
    });
    document.documentElement.setAttribute('data-view-major', MAJOR);
    if (LEVEL) {
      var grid = document.querySelector('.subject-grid');
      if (grid) renderLevel(grid);
    } else {
      renderGeneral();
    }
  }

  function start(data) {
    DATA = data;
    if (!DATA || !DATA.majors) return;
    MINE = profileMajor();
    MAJOR = pick();
    var anchor = document.getElementById('overall-progress') || document.querySelector('.dash-hero');
    if (!anchor) return;
    anchor.insertAdjacentHTML(LEVEL ? 'beforebegin' : 'afterend', switchHTML());
    document.querySelector('.mj-switch').addEventListener('click', function (e) {
      var b = e.target.closest('.mj-opt');
      if (!b) return;
      MAJOR = b.getAttribute('data-major');
      try { localStorage.setItem(VIEW, MAJOR); } catch (x) {}
      apply();
    });
    apply();
  }

  fetch(BASE + 'shared/data/majors.json').then(function (r) { return r.ok ? r.json() : null; }).then(start).catch(function () {});
})();
