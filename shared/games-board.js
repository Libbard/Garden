;(function () {
  'use strict';

  var API = (window.GardenEndpoints && (GardenEndpoints.publicData || GardenEndpoints.sync)) || '';
  var KEY = 'garden_games_board';
  var AR_WORD = '[\\u0621-\\u063A\\u0641-\\u064A]+';
  var EN_WORD = '[A-Za-z]+';
  var AR_RE = new RegExp('^' + AR_WORD + '( ' + AR_WORD + '){0,2}$');
  var EN_RE = new RegExp('^' + EN_WORD + '( ' + EN_WORD + '){0,2}$');
  var NAME_MIN = 2, NAME_MAX = 20;
  var PERIODS = ['day', 'week', 'month'];

  var H = window.GardenGames && GardenGames._host;
  if (!H) return;
  var t = H.t, esc = H.esc, num = H.num, tx = H.tx;

  var lastBoard = null;
  var S = { on: null, g: null, lv: null, p: 'day', me: null, dlg: null, seq: 0, leaveArm: 0, editing: false };

  function get() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function put(v) { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) {} }
  function joined() { var s = get(); return !!(s && s.id && s.name); }
  function ident() {
    var s = get();
    if (s && s.id) return s.id;
    try { if (window.GardenRaterId) return GardenRaterId.identity(); } catch (e) {}
    return null;
  }

  function cleanName(raw) { return String(raw == null ? '' : raw).normalize('NFC').replace(/\s+/g, ' ').trim(); }
  function checkName(raw) {
    var n = cleanName(raw);
    if (n.length < NAME_MIN) return 'short';
    if (n.length > NAME_MAX) return 'long';
    if (/[0-9٠-٩۰-۹]/.test(n)) return 'digits';
    if (!AR_RE.test(n) && !EN_RE.test(n)) return (/[؀-ۿ]/.test(n) && /[A-Za-z]/.test(n)) ? 'mixed' : 'chars';
    if (/(.)\1{3,}/.test(n.toLowerCase().replace(/ /g, ''))) return 'repeat';
    return '';
  }
  var WHY = {
    short: ['الاسمُ قصير — حرفان على الأقلّ.', 'Too short — at least 2 letters.'],
    long: ['الاسمُ طويل — عشرون حرفاً على الأكثر.', 'Too long — 20 letters at most.'],
    digits: ['بلا أرقام — حروفٌ فقط.', 'No numbers — letters only.'],
    chars: ['حروفٌ عربيّةٌ أو إنجليزيّةٌ فقط، بلا رموزٍ ولا تشكيل، وثلاثُ كلماتٍ على الأكثر.', 'Arabic or English letters only — no symbols or diacritics, three words at most.'],
    mixed: ['اخترِ العربيّةَ أو الإنجليزيّة، لا الاثنتين في اسمٍ واحد.', 'Use Arabic or English, not both in one name.'],
    repeat: ['حرفٌ مكرّرٌ أكثرَ ممّا ينبغي.', 'A letter repeats too many times.'],
    blocked: ['هذا الاسمُ غيرُ مقبول — اخترْ غيرَه.', 'That name isn’t allowed — please pick another.'],
    taken: ['الاسمُ مأخوذٌ — اخترْ غيرَه.', 'That name is taken — please pick another.'],
    locked: ['عدّل المشرفُ اسمَك، فلا يمكن تغييرُه الآن.', 'A moderator set your name, so it can’t be changed right now.'],
    rate_limited: ['محاولاتٌ كثيرة — انتظرْ قليلاً.', 'Too many tries — wait a little.'],
    board_off: ['لوحةُ الصدارة متوقّفةٌ الآن.', 'The leaderboard is paused right now.'],
    net: ['تعذّر الاتّصال — حاولْ ثانيةً.', 'Couldn’t connect — try again.']
  };
  function why(k) { var w = WHY[k] || WHY.net; return t(w[0], w[1]); }

  function getJSON(path) {
    if (!API) return Promise.reject(new Error('api'));
    return fetch(API + path).then(function (r) { return r.json(); });
  }
  function post(path, body) {
    if (!API) return Promise.reject(new Error('api'));
    var id = ident();
    if (!id) return Promise.reject(new Error('id'));
    var b = {}; for (var k in id) b[k] = id[k]; for (var j in body || {}) b[j] = body[j];
    return fetch(API + path, {
      method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b)
    }).then(function (r) { return r.json().then(function (x) { if (!r.ok && !x.why) x.why = x.error || 'net'; return x; }); });
  }

  function addDays(day, n) { var d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return H.today(d); }
  function range(p) {
    var d = H.today();
    if (p === 'day') return [d, d];
    if (p === 'week') return [addDays(d, -new Date(d + 'T12:00:00').getDay()), d];
    return [d.slice(0, 8) + '01', d];
  }
  function better(g, a, b) { return g.better === 'low' ? a < b : a > b; }
  function localBest(gid, lv, p) {
    var g = H.by[gid], log = H.meta().log || {}, r = range(p), out = null;
    Object.keys(log).forEach(function (day) {
      if (day < r[0] || day > r[1]) return;
      var v = log[day][gid + ':' + lv];
      if (v != null && (out == null || better(g, v.v, out.v))) out = { v: v.v, day: day };
    });
    return out;
  }

  function scoreTxt(g, v) { return num(H.fmt(g.kind, v)); }
  function perName(p) { return p === 'day' ? t('اليوم', 'Today') : p === 'week' ? t('هذا الأسبوع', 'This week') : t('هذا الشهر', 'This month'); }
  function perShort(p) { return p === 'day' ? t('اليوم', 'Today') : p === 'week' ? t('الأسبوع', 'Week') : t('الشهر', 'Month'); }
  function perIcon(p) { return p === 'day' ? 'fa-calendar-day' : p === 'week' ? 'fa-calendar-week' : 'fa-calendar'; }
  function levelName(g, lv) { var l = g.levels.filter(function (x) { return x.id === lv; })[0]; return l ? tx(l) : lv; }

  function hub(el) {
    if (!el) return;
    getJSON('/v1/games/champs').then(function (d) {
      S.on = !!(d && d.on);
      if (!S.on) { el.hidden = true; return; }
      var rows = (d.rows || []).filter(function (r) { return H.by[r.g]; });
      el.innerHTML = '<div class="gm-champs-top"><h2 id="gm-champs-h"><i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + t('أبطالُ اليوم', 'Today’s champions') + '</h2>' +
        '<button type="button" class="gsf-btn" data-act="board"><i class="fa-solid fa-chart-simple" aria-hidden="true"></i> ' + t('لوحةُ الصدارة', 'Leaderboard') + '</button></div>' +
        (rows.length ? '<ul class="gm-champs-list">' + rows.map(function (r) {
          var g = H.by[r.g];
          return '<li><button type="button" class="gm-champ" data-act="board" data-bg="' + esc(r.g) + '" data-blv="' + esc(r.lv) + '" style="--gm-c:var(--gm-' + g.skill + ')">' +
            '<span class="gm-ico"><i class="fa-solid ' + g.icon + '" aria-hidden="true"></i></span>' +
            '<span class="gm-champ-t"><small>' + esc(tx(g.name)) + (g.levels.length > 1 ? ' · ' + esc(levelName(g, r.lv)) : '') + '</small>' +
            '<b><bdi>' + esc(r.name) + '</bdi></b></span>' +
            '<span class="gm-champ-s">' + scoreTxt(g, r.s) + '</span></button></li>';
        }).join('') + '</ul>'
          : '<p class="gm-champs-empty">' + t('لا نتائجَ اليوم بعد — العبْ وكن الأوّل.', 'No scores yet today — play and be the first.') + '</p>');
      el.hidden = false;
    }).catch(function () { el.hidden = true; });
  }

  function dialog() {
    if (S.dlg) return S.dlg;
    var d = document.createElement('dialog');
    d.className = 'gsf gm-lb';
    d.setAttribute('aria-labelledby', 'gm-lb-h');
    d.innerHTML = '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' + esc(t('إغلاق', 'Close')) + '" data-ar-title="إغلاق" data-en-title="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
      '<div class="gsf-body gm-lb-body"><h2 id="gm-lb-h"></h2><div id="gm-lb-top"></div><div id="gm-lb-join" class="gm-lb-join"></div></div>';
    (document.getElementById('gm-root') || document.body).appendChild(d);
    d.addEventListener('click', onClick);
    d.addEventListener('input', onInput);
    d.addEventListener('submit', function (e) { if (e.target.id === 'gm-lb-form') { e.preventDefault(); doJoin(); } });
    S.dlg = d;
    return d;
  }

  function open(o) {
    o = o || {};
    var g = H.by[o.g] || H.by[S.g] || H.list[0];
    S.g = g.id;
    S.lv = (o.lv && g.levels.some(function (l) { return l.id === o.lv; })) ? o.lv : H.lastLevel(g.id);
    S.editing = false;
    var d = dialog();
    drawHead(); drawTop(); drawJoin();
    if (!d.open) { try { d.showModal(); } catch (e) { d.setAttribute('open', ''); } }
    refresh();
  }

  function drawHead() {
    S.dlg.querySelector('#gm-lb-h').innerHTML = '<i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + t('لوحةُ الصدارة', 'Leaderboard');
  }

  function drawTop() {
    var g = H.by[S.g], el = S.dlg.querySelector('#gm-lb-top');
    var h = '<div class="gsf-chips gm-lb-games" role="group" aria-label="' + esc(t('اللعبة', 'Game')) + '">' + H.list.map(function (x) {
      var on = x.id === S.g;
      return '<button type="button" class="gsf-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-lbg="' + x.id + '"><i class="fa-solid ' + x.icon + '" aria-hidden="true"></i> ' + esc(tx(x.name)) + '</button>';
    }).join('') + '</div>';
    if (g.levels.length > 1) h += '<div class="gsf-chips gm-lb-levels" role="group" aria-label="' + esc(t('المستوى', 'Level')) + '">' + g.levels.map(function (l) {
      var on = l.id === S.lv;
      return '<button type="button" class="gsf-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-lblv="' + esc(l.id) + '">' + esc(tx(l)) + '</button>';
    }).join('') + '</div>';
    h += '<h3 class="gm-lb-sub">' + t('أفضلُ نتائجك', 'Your best') + '</h3><div class="gm-lb-mine">' + PERIODS.map(function (p) {
      var b = localBest(g.id, S.lv, p);
      var rk = S.me && S.me.ranks && S.me.ranks[p];
      return '<div class="gm-lb-cell"><small><i class="fa-solid ' + perIcon(p) + '" aria-hidden="true"></i> ' + perShort(p) + '</small>' +
        '<b>' + (b ? scoreTxt(g, b.v) : '—') + '</b>' +
        '<span class="gm-lb-rank">' + (rk && rk.rank ? t('المركز ', 'Rank ') + num(rk.rank) + ' ' + t('من', 'of') + ' ' + num(rk.n) : (S.on && joined() ? '' : '&nbsp;')) + '</span></div>';
    }).join('') + '</div>';
    h += '<div class="gm-lb-board-h"><h3 class="gm-lb-sub">' + t('اللاعبون', 'Players') + '</h3><div class="gsf-chips gm-lb-per" role="group" aria-label="' + esc(t('الفترة', 'Period')) + '">' + PERIODS.map(function (p) {
      var on = p === S.p;
      return '<button type="button" class="gsf-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-lbp="' + p + '">' + perName(p) + '</button>';
    }).join('') + '</div></div><div id="gm-lb-list" class="gm-lb-list" aria-live="polite"><p class="gm-lb-note">' + t('جارٍ التحميل…', 'Loading…') + '</p></div>';
    el.innerHTML = h;
    var cur = el.querySelector('.gm-lb-games .on');
    if (cur && cur.scrollIntoView) try { cur.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {}
  }

  function drawList(d) {
    var el = S.dlg && S.dlg.querySelector('#gm-lb-list'); if (!el) return;
    var g = H.by[S.g];
    if (d === 'err') { el.innerHTML = '<p class="gm-lb-note">' + why('net') + '</p>'; return; }
    if (!d || !d.on) { el.innerHTML = '<p class="gm-lb-note">' + why('board_off') + ' ' + t('نتائجُك أعلاه محفوظةٌ في جهازك.', 'Your scores above are saved on this device.') + '</p>'; return; }
    var mine = joined() ? get().name : null;
    if (!d.rows || !d.rows.length) { el.innerHTML = '<p class="gm-lb-note">' + t('لا نتائجَ في هذه الفترة بعد.', 'No scores in this period yet.') + '</p>'; return; }
    el.innerHTML = '<ol class="gm-lb-rows">' + d.rows.map(function (r, i) {
      var me = mine && r.name === mine;
      return '<li class="' + (me ? 'me' : '') + (i < 3 ? ' top' + (i + 1) : '') + '"><span class="gm-lb-pos">' + num(i + 1) + '</span>' +
        '<span class="gm-lb-name"><bdi>' + esc(r.name) + '</bdi>' + (me ? ' <small>' + t('(أنت)', '(you)') + '</small>' : '') + '</span>' +
        '<span class="gm-lb-score">' + scoreTxt(g, r.s) + '</span></li>';
    }).join('') + '</ol><p class="gm-lb-meta">' + num(d.n) + ' ' + t('لاعباً', 'players') + ' · ' + levelName(g, S.lv) + ' · ' + t('تتحدّث كلَّ نصف دقيقة', 'updates every half minute') + '</p>';
  }

  function drawJoin(msg) {
    var el = S.dlg && S.dlg.querySelector('#gm-lb-join'); if (!el) return;
    if (S.on === false) { el.innerHTML = ''; return; }
    var st = get();
    if (st && st.name && !S.editing) {
      var hidden = S.me && S.me.hidden;
      el.innerHTML = '<p class="gm-lb-as"><i class="fa-solid fa-user-check" aria-hidden="true"></i> ' + t('تظهر باسم ', 'You appear as ') + '<b><bdi>' + esc(st.name) + '</bdi></b>' +
        (hidden ? '<span class="gm-lb-warn"> · ' + t('أوقف المشرفُ ظهورَك في اللوحة.', 'A moderator has hidden you from the board.') + '</span>' : '') + '</p>' +
        '<div class="gsf-acts gm-lb-acts">' +
        (S.me && S.me.locked ? '' : '<button type="button" class="gsf-btn" data-lbact="edit"><i class="fa-solid fa-user-pen" aria-hidden="true"></i> ' + t('غيّرِ الاسم', 'Change name') + '</button>') +
        '<button type="button" class="gsf-btn gsf-btn--danger" data-lbact="leave">' + (S.leaveArm ? t('اضغطْ ثانيةً للتأكيد', 'Tap again to confirm') : t('اخرجْ وامحُ نتائجي', 'Leave and erase my scores')) + '</button></div>' +
        (msg ? '<p class="gm-lb-msg" role="alert">' + esc(msg) + '</p>' : '');
      return;
    }
    el.innerHTML = '<form id="gm-lb-form" class="gm-lb-form" novalidate>' +
      '<label for="gm-lb-name">' + (st && st.name ? t('اسمُك الجديد', 'Your new name') : t('اخترْ اسماً يظهر في اللوحة', 'Pick a name for the board')) + '</label>' +
      '<div class="gm-lb-row"><input id="gm-lb-name" class="gsf-in" type="text" autocomplete="nickname" spellcheck="false" maxlength="' + NAME_MAX + '" value="' + esc(st && st.name ? st.name : '') + '" aria-describedby="gm-lb-hint">' +
      '<button type="submit" class="gsf-btn gsf-btn--go">' + (st && st.name ? t('احفظ', 'Save') : t('انضمّ', 'Join')) + '</button>' +
      (st && st.name ? '<button type="button" class="gsf-btn gsf-btn--ghost" data-lbact="cancel">' + t('إلغاء', 'Cancel') + '</button>' : '') + '</div>' +
      '<p id="gm-lb-hint" class="gm-lb-hint">' + t('حروفٌ عربيّةٌ أو إنجليزيّةٌ فقط (2–20)، بلا أرقامٍ ولا رموز. يُرسَل اسمُك وأفضلُ نتائجك فقط، وتستطيع الخروجَ ومحوَها متى شئت.',
        'Arabic or English letters only (2–20), no numbers or symbols. Only your name and best scores are sent, and you can leave and erase them anytime.') + '</p>' +
      '<p class="gm-lb-msg" role="alert">' + (msg ? esc(msg) : '') + '</p></form>';
  }

  function refresh() {
    var my = ++S.seq;
    var g = S.g, lv = S.lv, p = S.p;
    lastBoard = null;
    getJSON('/v1/games/board?g=' + encodeURIComponent(g) + '&lv=' + encodeURIComponent(lv) + '&p=' + p)
      .then(function (d) {
        if (my !== S.seq) return;
        lastBoard = d;
        var was = S.on; S.on = !!(d && d.on);
        drawList(d);
        if (was !== S.on) drawJoin();
      })
      .catch(function () { if (my === S.seq) drawList('err'); });
    if (joined()) {
      post('/v1/games/me', { g: g, lv: lv }).then(function (m) {
        if (my !== S.seq || !m) return;
        if (m.on && m.joined === false) { put(null); S.me = null; }
        else S.me = m;
        drawTop(); if (lastBoard) drawList(lastBoard); drawJoin();
      }).catch(function () {});
    } else S.me = null;
  }
  function refreshListOnly() {
    lastBoard = null;
    getJSON('/v1/games/board?g=' + encodeURIComponent(S.g) + '&lv=' + encodeURIComponent(S.lv) + '&p=' + S.p)
      .then(function (d) { lastBoard = d; drawList(d); }).catch(function () { drawList('err'); });
  }

  function onInput(e) {
    if (e.target.id !== 'gm-lb-name') return;
    var m = S.dlg.querySelector('#gm-lb-form .gm-lb-msg');
    var w = e.target.value ? checkName(e.target.value) : '';
    if (m) m.textContent = (w && w !== 'short') ? why(w) : '';
  }

  function doJoin() {
    var inp = S.dlg.querySelector('#gm-lb-name'); if (!inp) return;
    var w = checkName(inp.value);
    var m = S.dlg.querySelector('#gm-lb-form .gm-lb-msg');
    if (w) { if (m) m.textContent = why(w); inp.focus(); return; }
    var btn = S.dlg.querySelector('#gm-lb-form [type="submit"]'); if (btn) btn.disabled = true;
    var id = ident();
    post('/v1/games/join', { name: cleanName(inp.value) }).then(function (r) {
      if (btn) btn.disabled = false;
      if (!r || !r.ok) { if (m) m.textContent = why(r && (r.why || r.error)); return; }
      var first = !joined();
      put({ id: id, name: r.name });
      S.editing = false;
      drawJoin();
      if (first) return backfill().then(refresh);
      refresh();
    }).catch(function () { if (btn) btn.disabled = false; if (m) m.textContent = why('net'); });
  }

  function backfill() {
    var items = [], seen = {};
    H.list.forEach(function (g) {
      g.levels.forEach(function (l) {
        PERIODS.forEach(function (p) {
          var b = localBest(g.id, l.id, p);
          var k = g.id + ':' + l.id + ':' + (b && b.day);
          if (b && !seen[k]) { seen[k] = 1; items.push({ g: g.id, lv: l.id, s: b.v, day: b.day }); }
        });
      });
    });
    if (!items.length) return Promise.resolve();
    return post('/v1/games/score', { items: items.slice(0, 60) }).catch(function () {});
  }

  function onClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (d.lbg) { S.g = d.lbg; S.lv = H.lastLevel(d.lbg); drawTop(); refresh(); return; }
    if (d.lblv) { S.lv = d.lblv; drawTop(); refresh(); return; }
    if (d.lbp) { S.p = d.lbp; drawTop(); refreshListOnly(); return; }
    if (d.lbact === 'edit') { S.editing = true; drawJoin(); var i = S.dlg.querySelector('#gm-lb-name'); if (i) { i.focus(); i.select(); } return; }
    if (d.lbact === 'cancel') { S.editing = false; drawJoin(); return; }
    if (d.lbact === 'leave') {
      if (!S.leaveArm) { S.leaveArm = setTimeout(function () { S.leaveArm = 0; drawJoin(); }, 4000); drawJoin(); return; }
      clearTimeout(S.leaveArm); S.leaveArm = 0;
      b.disabled = true;
      post('/v1/games/leave', {}).then(function (r) {
        if (!r || !r.ok) { drawJoin(why('net')); return; }
        put(null); S.me = null; drawJoin(); drawTop(); refresh();
      }).catch(function () { drawJoin(why('net')); });
    }
  }

  function finished(o) {
    var el = o && o.el; if (!el) return;
    var g = H.by[o.g]; if (!g) return;
    var link = '<button type="button" class="gsf-btn gsf-btn--ghost gm-res-lbbtn" data-act="board"><i class="fa-solid fa-chart-simple" aria-hidden="true"></i> ';
    if (!joined()) {
      if (S.on === false) return;
      getJSON('/v1/games/board?g=' + encodeURIComponent(o.g) + '&lv=' + encodeURIComponent(o.lv) + '&p=day').then(function (d) {
        S.on = !!(d && d.on);
        if (!S.on || !el.isConnected) return;
        el.innerHTML = link + t('اظهرْ في لوحة الصدارة', 'Join the leaderboard') + '</button>';
      }).catch(function () {});
      return;
    }
    if (!o.won || o.score == null) { el.innerHTML = link + t('لوحةُ الصدارة', 'Leaderboard') + '</button>'; return; }
    el.innerHTML = '<p class="gm-res-rank">' + t('يُحسب مركزك…', 'Working out your rank…') + '</p>';
    post('/v1/games/score', { g: o.g, lv: o.lv, s: o.score, day: H.today() }).then(function (r) {
      if (!el.isConnected) return;
      if (!r || !r.ok) { el.innerHTML = (r && r.why === 'board_off') ? '' : link + t('لوحةُ الصدارة', 'Leaderboard') + '</button>'; return; }
      if (r.hidden) { el.innerHTML = link + t('لوحةُ الصدارة', 'Leaderboard') + '</button>'; return; }
      var rk = r.ranks || {};
      el.innerHTML = '<p class="gm-res-rank"><i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + PERIODS.filter(function (p) { return rk[p] && rk[p].rank; }).map(function (p) {
        return perName(p) + ' ' + num(rk[p].rank) + ' <small>' + t('من', 'of') + ' ' + num(rk[p].n) + '</small>';
      }).join(' · ') + '</p>' + link + t('لوحةُ الصدارة', 'Leaderboard') + '</button>';
    }).catch(function () { if (el.isConnected) el.innerHTML = ''; });
  }

  function lang() {
    if (!S.dlg) return;
    drawHead(); drawTop(); drawJoin();
    if (lastBoard) drawList(lastBoard); else refreshListOnly();
  }

  GardenGames.board = { hub: hub, open: open, finished: finished, lang: lang, isOpen: function () { return !!(S.dlg && S.dlg.open); } };
  if (GardenGames._boardReady) GardenGames._boardReady();
})();
