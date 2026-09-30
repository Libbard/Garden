;(function () {
  'use strict';

  var WIP_LS = '__audioWip';
  var RATE_LS = '__audioRate';
  var BPS = 64000;
  var MAX_SEC = 3 * 3600;
  var TICK = 250;
  var BARS = 14;
  var RATES = [1, 1.25, 1.5, 1.75, 2, 0.75];
  var RETRY = [5000, 20000, 60000];
  var CLOSED = /not_enrolled|no_vault|not_configured|origin|bad_vault|none/;
  var OTHER_TAB_MS = 12000;

  function isAr() {
    return (document.documentElement.lang ||
            localStorage.getItem('garden_lang') || 'ar') === 'ar';
  }
  function L(a, b) { return isAr() ? a : b; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function T(ar, en) {
    return '<span data-ar="' + esc(ar) + '" data-en="' + esc(en) + '">' + esc(L(ar, en)) + '</span>';
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clock(sec) {
    var s = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s % 60);
  }
  function short(sec) {
    var s = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return (h ? h + ':' + pad(m) : String(m)) + ':' + pad(s % 60);
  }
  function size(n) {
    if (!(n > 0)) return '0 KB';
    var u = ['B', 'KB', 'MB', 'GB'], i = 0, v = n;
    while (v >= 1024 && i < 3) { v /= 1024; i++; }
    return (i === 0 || v >= 100 ? Math.round(v) : v.toFixed(1)) + ' ' + u[i];
  }
  function num(s) { return '<span class="nau-num">' + esc(s) + '</span>'; }
  function uid(p) { return p + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }
  function stamp(t) {
    var d = new Date(t || Date.now());
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      '_' + pad(d.getHours()) + pad(d.getMinutes());
  }
  function when(t) {
    var d = new Date(t || Date.now());
    try {
      return d.toLocaleString(isAr() ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB',
        { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return stamp(t).replace('_', ' '); }
  }

  function A() { return window.GardenNotesApp || null; }
  function PD() { return window.GardenPdfDoc || null; }
  function F() { return window.GardenFiles || null; }
  function RC() { return window.GardenAudioRec || null; }
  function St() { return window.GardenNotesStore || null; }
  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (e) {}
  }

  function curId() { var a = A(); return a && a.noteId ? a.noteId() : null; }
  function curDoc() { var a = A(); return a && a.doc ? a.doc() : null; }
  function items(doc) { return (doc && Array.isArray(doc.aud)) ? doc.aud : []; }
  function noteTitle() {
    var t = document.getElementById('na-doc-title');
    return (t && t.value && t.value.trim()) || '';
  }

  function withDoc(nid, fn) {
    if (!nid) return Promise.resolve(false);
    if (nid === curId() && curDoc()) {
      var d = curDoc();
      if (!Array.isArray(d.aud)) d.aud = [];
      fn(d.aud, d);
      try { A().save(false); } catch (e) {}
      paintMic();
      return Promise.resolve(true);
    }
    var S = St();
    if (!S || !S.getDoc) return Promise.resolve(false);
    return S.getDoc(nid).then(function (row) {
      if (!row || !row.doc) return false;
      var doc = row.doc;
      if (!Array.isArray(doc.aud)) doc.aud = [];
      fn(doc.aud, doc);
      return S.putDoc(nid, JSON.stringify(doc), Date.now()).then(function () { return true; });
    })['catch'](function () { return false; });
  }

  var here = Object.create(null);
  var mem = Object.create(null);
  var nidOf = Object.create(null);
  function refreshHere() {
    var D = PD();
    if (!D || !D.list) return Promise.resolve();
    return D.list().then(function (rows) {
      var h = Object.create(null);
      rows.forEach(function (r) { h[r.hash] = r.size || 1; });
      here = h;
    })['catch'](function () {});
  }
  function local(it) { return !!(it && (here[it.i] || mem[it.i])); }
  function blobOf(it) {
    if (mem[it.i]) return Promise.resolve(mem[it.i]);
    var D = PD();
    if (!D || !here[it.i]) return Promise.resolve(null);
    return D.get(it.i).then(function (f) {
      return f ? new Blob([f], { type: it.m || 'audio/webm' }) : null;
    })['catch'](function () { return null; });
  }

  function readWip() {
    try { var o = JSON.parse(localStorage.getItem(WIP_LS) || 'null'); return o && o.id ? o : null; }
    catch (e) { return null; }
  }
  function writeWip(o) { try { localStorage.setItem(WIP_LS, JSON.stringify(o)); } catch (e) {} }
  function clearWip(id) {
    var w = readWip();
    if (!w || !id || w.id === id) { try { localStorage.removeItem(WIP_LS); } catch (e) {} }
  }
  function wipRows(id) {
    var D = PD();
    if (!D || !D.list) return Promise.resolve([]);
    var pre = 'wip_' + id + '_';
    return D.list().then(function (rows) {
      return rows.filter(function (r) { return r.hash.indexOf(pre) === 0; })
        .map(function (r) { return { key: r.hash, i: Number(r.hash.slice(pre.length)) || 0, size: r.size }; })
        .sort(function (a, b) { return a.i - b.i; });
    })['catch'](function () { return []; });
  }
  function wipJoin(ptr) {
    return wipRows(ptr.id).then(function (rows) {
      if (!rows.length) return null;
      return Promise.all(rows.map(function (r) { return PD().get(r.key); })).then(function (parts) {
        var ok = parts.filter(Boolean);
        if (!ok.length) return null;
        return new Blob(ok, { type: ptr.m || 'audio/webm' });
      });
    })['catch'](function () { return null; });
  }
  function wipDrop(id) {
    if (!id) return Promise.resolve();
    return wipRows(id).then(function (rows) {
      return Promise.all(rows.map(function (r) { return PD().drop(r.key); }));
    })['catch'](function () {});
  }

  var live = null;
  var draft = null;
  var lastErr = '';

  function why(e) {
    var n = (e && (e.name || e.message)) || '';
    if (/NotAllowed|Permission|denied/i.test(n)) return 'denied';
    if (/NotFound|DevicesNotFound|Overconstrained/i.test(n)) return 'nomic';
    if (/NotReadable|TrackStart/i.test(n)) return 'busy';
    return 'fail';
  }
  function errText(w) {
    return {
      denied: L('لم يُؤذن للموقع باستعمال الميكروفون — اسمحْ به من إعدادات المتصفّح ثمّ أعد المحاولة.',
                'The site is not allowed to use the microphone — allow it in your browser settings, then try again.'),
      nomic: L('لم نجد ميكروفوناً في هذا الجهاز.', 'No microphone was found on this device.'),
      busy: L('الميكروفونُ مشغولٌ ببرنامجٍ آخر — أغلقه ثمّ أعد المحاولة.',
              'The microphone is busy in another app — close it, then try again.'),
      unsupported: L('هذا المتصفّح لا يدعم التسجيل. جرّب كروم أو إيدج أو سفاري حديثاً.',
                     'This browser cannot record. Try a recent Chrome, Edge or Safari.'),
      insecure: L('التسجيلُ يحتاج اتصالاً آمناً (https).', 'Recording needs a secure (https) connection.'),
      fail: L('تعذّر بدءُ التسجيل. أعد المحاولة.', 'Could not start recording. Please try again.')
    }[w] || '';
  }

  function start(opts) {
    var o = opts || {};
    if (live) return Promise.resolve(false);
    var R = RC();
    var sup = R && R.support ? R.support() : {};
    if (!sup.recorder || !sup.mic) return failStart('unsupported');
    if (sup.secure === false) return failStart('insecure');
    var nid = o.nid || curId();
    if (!nid) return Promise.resolve(false);
    var r = new R.Recorder({ bps: BPS, source: 'mic' });
    lastErr = '';
    return r.open().then(function () {
      var id = uid('w');
      live = { r: r, id: id, nid: nid, g: o.g || '', k: o.k | 0, bytes: 0, parts: 0,
               bars: [], hush: 0, hotN: 0, hotUntil: 0, tickN: 0, lost: false,
               wake: (F() && F().awake) ? F().awake() : null, confirm: '' };
      r.onData = function (blob, i) {
        if (!live || live.r !== r) return;
        live.bytes += blob.size;
        live.parts = i + 1;
        var D = PD();
        if (D && D.put) {
          D.put('wip_' + id + '_' + i, blob, { name: '' }).then(function (ok) { if (!ok && live) live.lost = true; });
        }
        saveWip();
      };
      r.start();
      saveWip();
      live.timer = setInterval(tick, TICK);
      shut();
      paintStrip(true);
      paintMic();
      emit('garden:audioRec', { state: 'rec', note: nid });
      return true;
    }, function (e) {
      try { r.release(); } catch (e2) {}
      return failStart(why(e));
    });
  }
  function failStart(w) {
    lastErr = w;
    if (dlg && dlg.open) render(); else openList();
    return Promise.resolve(false);
  }

  function saveWip() {
    if (!live) return;
    var st = live.r.stats();
    writeWip({ id: live.id, t0: live.r.t0, at: Date.now(), sec: Math.round(st.sec),
               bytes: live.bytes, m: (live.r.type || '').split(';')[0], note: live.nid,
               src: 'mic', g: live.g || undefined, k: live.g ? live.k : undefined,
               n: noteTitle() });
  }

  function hold() {
    if (!live) return;
    if (live.r.paused()) live.r.resume(); else live.r.hold();
    saveWip();
    paintStrip(true);
    emit('garden:audioRec', { state: live.r.paused() ? 'held' : 'rec', note: live.nid });
  }

  function endLive() {
    var cur = live;
    if (!cur) return null;
    clearInterval(cur.timer);
    if (cur.wake) { try { cur.wake(); } catch (e) {} }
    live = null;
    paintMic();
    return cur;
  }

  function stop() {
    var cur = endLive();
    if (!cur) return Promise.resolve(null);
    paintStrip(true);
    return cur.r.stop().then(function (res) {
      emit('garden:audioRec', { state: 'stop', note: cur.nid });
      if (!res.blob || res.blob.size < 1024) {
        wipDrop(cur.id); clearWip(cur.id);
        return null;
      }
      return finalize({ blob: res.blob, sec: res.sec, t0: res.t0, holds: res.holds, m: res.type,
                        nid: cur.nid, g: cur.g, k: cur.k, last: true, wipId: cur.id })
        .then(function (it) { if (it) askSave(it, nidOf[it.i] || cur.nid); return it; });
    });
  }

  function discard() {
    var cur = endLive();
    if (!cur) return Promise.resolve();
    paintStrip(true);
    return cur.r.stop().then(function () {
      emit('garden:audioRec', { state: 'discard', note: cur.nid });
      return wipDrop(cur.id).then(function () { clearWip(cur.id); });
    });
  }

  function finalize(o) {
    var mime = String(o.m || o.blob.type || 'audio/webm').split(';')[0];
    var t0 = o.t0 || Date.now();
    var it = {
      i: uid('aud_'),
      n: 'rec_' + stamp(t0) + '_' + Math.round(o.sec || 0) + 's',
      t: Date.now(),
      s0: t0,
      ms: Math.round((o.sec || 0) * 1000),
      hz: (o.holds || []).map(function (h) { return [Math.max(0, h[0] - t0), Math.max(0, h[1] - t0)]; }),
      b: o.blob.size,
      m: mime,
      lo: 1
    };
    if (o.g) { it.g = o.g; it.k = o.k | 0; if (o.last) it.gl = 1; }
    var D = PD();
    var put = D && D.put ? D.put(it.i, o.blob, { name: it.n }) : Promise.resolve(false);
    return put.then(function (ok) {
      if (ok) here[it.i] = o.blob.size; else { mem[it.i] = o.blob; it.lo = 0; }
      return withDoc(o.nid, function (list) { list.push(it); }).then(function (wrote) {
        if (wrote) return true;
        var here2 = curId();
        if (here2 && here2 !== o.nid) {
          o.nid = here2;
          return withDoc(here2, function (list) { list.push(it); });
        }
        return false;
      });
    }).then(function (wrote) {
      if (!wrote) mem[it.i] = mem[it.i] || o.blob;
      nidOf[it.i] = o.nid;
      if (o.wipId) { return wipDrop(o.wipId).then(function () { clearWip(o.wipId); return it; }); }
      return it;
    });
  }

  function tick() {
    if (!live) return;
    var st = live.r.stats();
    if (st.sec >= MAX_SEC) { stop(); return; }
    live.tickN++;
    var lv = live.r.level();
    var held = live.r.paused();
    var peak = (lv && lv.peak) || 0, rms = (lv && lv.rms) || 0;
    if (!held) {
      live.hush = peak < 0.008 ? live.hush + 1 : 0;
      if (peak > 0.86) { live.hotN++; if (live.hotN >= 3) live.hotUntil = Date.now() + 3000; }
      else live.hotN = 0;
    }
    if (live.tickN % 2 === 0) {
      var db = rms > 0 ? 20 * Math.log10(rms) : -90;
      var v = held ? 0 : Math.max(0, Math.min(1, (db + 55) / 50));
      live.bars.push(v);
      if (live.bars.length > BARS) live.bars.shift();
    }
    var say = held ? 'held' : (Date.now() < live.hotUntil ? 'hot' : (live.hush > 48 ? 'hush' : 'rec'));
    paintLive(st, say);
  }

  function strip() { return document.getElementById('na-audio'); }
  var stripMode = '';

  function mode() {
    if (live) return live.r.paused() ? 'held' : 'rec';
    if (draft) return 'draft';
    if (pl && au && !(dlg && dlg.open) && (pl.on || au.currentTime > 0)) return 'play';
    return '';
  }

  function paintStrip(force) {
    var s = strip();
    if (!s) return;
    var m = mode();
    s.hidden = !m;
    if (!m) { s.removeAttribute('data-mode'); s.innerHTML = ''; stripMode = ''; return; }
    if (!force && m === stripMode) return;
    stripMode = m;
    s.setAttribute('data-mode', m);
    s.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    if (m === 'rec' || m === 'held') s.innerHTML = liveHtml(m);
    else if (m === 'draft') s.innerHTML = draftHtml();
    else s.innerHTML = miniHtml();
    if (m === 'rec' || m === 'held') { var st = live.r.stats(); paintLive(st, m === 'held' ? 'held' : 'rec'); }
    if (m === 'play') paintMini();
  }

  function liveHtml(m) {
    var bars = '';
    for (var i = 0; i < BARS; i++) bars += '<i></i>';
    var held = m === 'held';
    if (live && live.confirm) {
      var dis = live.confirm === 'discard';
      return '<div class="nau-ask" role="group">' +
        '<p>' + (dis
          ? T('يُحذف ما سُجّل الآن نهائيّاً — لا يُحفظ منه شيء.', 'What was recorded will be deleted — nothing is kept.')
          : T('تنهي التسجيل وتحفظه؟', 'Stop and save the recording?')) + '</p>' +
        '<button type="button" class="gsf-btn ' + (dis ? 'gsf-btn--danger' : 'gsf-btn--go') + '" data-au="' + (dis ? 'discard' : 'stop') + '">' +
        (dis ? T('احذف', 'Delete') : T('أنهِ واحفظ', 'Stop & save')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-au="nevermind">' + T('تراجع', 'Cancel') + '</button></div>';
    }
    return '<span class="nau-dot" aria-hidden="true"></span>' +
      '<span class="nau-clock nau-num" role="timer" aria-live="off">00:00</span>' +
      '<span class="nau-wave" aria-hidden="true">' + bars + '</span>' +
      '<span class="nau-say" aria-live="polite">' +
        '<b data-say="rec">' + T('يسجّل', 'Recording') + '</b>' +
        '<b data-say="held">' + T('متوقّفٌ مؤقّتاً', 'Paused') + '</b>' +
        '<b data-say="hush">' + T('لا نسمع صوتاً', 'No sound') + '</b>' +
        '<b data-say="hot">' + T('الصوتُ عالٍ جدّاً', 'Too loud') + '</b></span>' +
      '<span class="nau-size nau-num"></span>' +
      '<span class="nau-gap"></span>' +
      '<button type="button" class="gsf-btn nau-b" data-au="hold" aria-label="' +
        esc(held ? L('تابع التسجيل', 'Resume') : L('إيقافٌ مؤقّت', 'Pause')) + '">' +
        (held ? '<i class="fa-solid fa-circle nau-go" aria-hidden="true"></i>' + T('تابع التسجيل', 'Resume')
              : '<i class="fa-solid fa-pause" aria-hidden="true"></i>' + T('إيقافٌ مؤقّت', 'Pause')) + '</button>' +
      '<button type="button" class="gsf-btn nau-b nau-b--stop" data-au="ask-stop" aria-label="' + esc(L('إنهاء التسجيل', 'Stop recording')) + '">' +
        '<i class="fa-solid fa-stop" aria-hidden="true"></i>' + T('إنهاء', 'Stop') + '</button>' +
      '<button type="button" class="nau-icb" data-au="ask-discard" aria-label="' + esc(L('احذف التسجيل', 'Discard recording')) +
        '" data-ar-title="احذف التسجيل" data-en-title="Discard recording" title="' + esc(L('احذف التسجيل', 'Discard recording')) + '">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
  }

  function paintLive(st, say) {
    var s = strip();
    if (!s || !live || live.confirm) return;
    var c = s.querySelector('.nau-clock');
    if (c) c.textContent = clock(st.sec);
    var z = s.querySelector('.nau-size');
    if (z) z.textContent = size(live.bytes);
    var w = s.querySelector('.nau-say');
    if (w) w.setAttribute('data-now', say);
    var bs = s.querySelectorAll('.nau-wave > i');
    var off = BARS - live.bars.length;
    for (var i = 0; i < bs.length; i++) {
      var v = i >= off ? live.bars[i - off] : 0;
      bs[i].style.setProperty('--v', (Math.round(v * 100) / 100).toString());
    }
  }

  function draftHtml() {
    var p = draft.ptr;
    var other = p.note && p.note !== curId();
    if (draft.confirm) {
      return '<div class="nau-ask" role="group"><p>' +
        T('يُحذف التسجيلُ الذي لم يكتمل نهائيّاً.', 'The unfinished recording will be deleted for good.') + '</p>' +
        '<button type="button" class="gsf-btn gsf-btn--danger" data-au="draft-drop">' + T('احذفه', 'Delete it') + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-au="nevermind">' + T('تراجع', 'Cancel') + '</button></div>';
    }
    return '<i class="fa-solid fa-triangle-exclamation nau-warn" aria-hidden="true"></i>' +
      '<span class="nau-draft"><b>' + T('تسجيلٌ لم يكتمل', 'An unfinished recording') + '</b> ' +
      num(clock(p.sec)) + ' · ' + num(size(draft.bytes)) +
      (other ? ' · ' + T('من ملاحظةٍ أخرى', 'from another note') : '') + '</span>' +
      '<span class="nau-gap"></span>' +
      '<button type="button" class="gsf-btn gsf-btn--go nau-b" data-au="draft-go">' + T('أكمل التسجيل', 'Continue recording') + '</button>' +
      '<button type="button" class="gsf-btn nau-b" data-au="draft-save">' + T('احفظه كما هو', 'Save it as is') + '</button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost nau-b" data-au="draft-ask">' + T('احذفه', 'Delete it') + '</button>';
  }

  function miniHtml() {
    return '<button type="button" class="nau-icb nau-icb--play" data-au="mini-toggle" aria-label="' +
      esc(L('تشغيل أو إيقاف', 'Play or pause')) + '"><i class="fa-solid fa-play" aria-hidden="true"></i></button>' +
      '<button type="button" class="nau-mini-name" data-au="list"></button>' +
      '<span class="nau-mini-t nau-num"></span>' +
      '<span class="nau-gap"></span>' +
      '<button type="button" class="nau-icb" data-au="mini-close" aria-label="' + esc(L('أوقف التشغيل', 'Stop playback')) +
      '" data-ar-title="أوقف التشغيل" data-en-title="Stop playback"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
  }

  function paintMini() {
    var s = strip();
    if (!s || stripMode !== 'play' || !pl) return;
    var i = s.querySelector('.nau-icb--play > i');
    if (i) i.className = 'fa-solid ' + (pl.on ? 'fa-pause' : 'fa-play');
    var n = s.querySelector('.nau-mini-name');
    if (n) n.textContent = pl.title;
    var t = s.querySelector('.nau-mini-t');
    if (t) t.textContent = short(pos()) + ' / ' + short(pl.total / 1000);
  }

  function checkDraft() {
    if (live) { draft = null; return Promise.resolve(); }
    var p = readWip();
    if (!p) { if (draft) { draft = null; paintStrip(true); } return Promise.resolve(); }
    if (Date.now() - (p.at || 0) < OTHER_TAB_MS) {
      setTimeout(checkDraft, OTHER_TAB_MS);
      return Promise.resolve();
    }
    return wipRows(p.id).then(function (rows) {
      var bytes = rows.reduce(function (a, r) { return a + (r.size || 0); }, 0);
      if (!rows.length || bytes < 1024) {
        wipDrop(p.id); clearWip(p.id); draft = null;
      } else {
        draft = { ptr: p, bytes: bytes, confirm: false };
      }
      paintStrip(true);
      if (dlg && dlg.open) render();
    });
  }

  function draftFinish(cont) {
    if (!draft) return Promise.resolve(null);
    var p = draft.ptr;
    draft = null;
    paintStrip(true);
    var nid = p.note || curId();
    var g = p.g || (cont ? uid('g') : '');
    var k = p.g ? (p.k | 0) : 0;
    return wipJoin(p).then(function (blob) {
      if (!blob || blob.size < 1024) { wipDrop(p.id); clearWip(p.id); return null; }
      return finalize({ blob: blob, sec: p.sec, t0: p.t0, holds: [], m: p.m, nid: nid,
                        g: g, k: k, last: !cont, wipId: p.id });
    }).then(function (it) {
      if (!it) return null;
      var at = nidOf[it.i] || nid;
      if (cont) return start({ nid: at, g: g, k: k + 1 }).then(function () { return it; });
      askSave(it, at);
      return it;
    });
  }

  function draftDrop() {
    if (!draft) return Promise.resolve();
    var p = draft.ptr;
    draft = null;
    paintStrip(true);
    return wipDrop(p.id).then(function () { clearWip(p.id); });
  }

  function micBtn() { return document.getElementById('na-mic'); }
  function paintMic() {
    var b = micBtn();
    if (!b) return;
    b.disabled = !curId();
    var n = groups(items(curDoc())).length;
    if (live) b.setAttribute('data-live', '1'); else b.removeAttribute('data-live');
    if (n) b.setAttribute('data-n', String(n)); else b.removeAttribute('data-n');
    var ar = live ? 'يجري التسجيل — التسجيلات' : (n ? 'تسجيلاتُ هذه الملاحظة (' + n + ')' : 'سجّل صوتاً');
    var en = live ? 'Recording — recordings' : (n ? 'Recordings of this note (' + n + ')' : 'Record audio');
    b.setAttribute('aria-label', L(ar, en));
    b.setAttribute('data-ar-title', ar);
    b.setAttribute('data-en-title', en);
    b.title = L(ar, en);
  }

  function groups(list) {
    var map = Object.create(null), out = [];
    list.forEach(function (it) {
      if (!it || !it.i) return;
      var key = it.g || it.i;
      var g = map[key];
      if (!g) { g = map[key] = { key: key, parts: [], t: 0 }; out.push(g); }
      g.parts.push(it);
      g.t = Math.max(g.t, it.t || 0);
    });
    out.forEach(function (g) {
      g.parts.sort(function (a, b) { return (a.k | 0) - (b.k | 0); });
      g.ms = g.parts.reduce(function (a, p) { return a + (p.ms || 0); }, 0);
      g.b = g.parts.reduce(function (a, p) { return a + (p.b || 0); }, 0);
      var named = g.parts.filter(function (p) { return p.nm; }).pop();
      g.nm = named ? named.nm : '';
      g.head = g.parts[g.parts.length - 1];
    });
    out.sort(function (a, b) { return b.t - a.t; });
    return out;
  }
  function gTitle(g) {
    if (g.nm) return g.nm;
    var it = g.parts[0];
    return L('تسجيل ', 'Recording ') + when(it.s0 || it.t);
  }
  function gWhere(g) {
    if (g.parts.every(function (p) { return p.aup; })) return 'us';
    if (g.parts.some(function (p) { return up.busy[p.i]; })) return 'up';
    if (g.parts.some(function (p) { return p.upE; })) return 'err';
    if (g.parts.every(local)) return 'here';
    return 'gone';
  }

  var up = { q: [], busy: Object.create(null), tries: Object.create(null), seen: Object.create(null),
             pct: Object.create(null), running: false };

  function fileName(it) {
    var ext = /ogg/.test(it.m) ? '.ogg' : (/mp4|m4a|aac/.test(it.m) ? '.m4a' : '.webm');
    return (it.nm || it.n || 'recording').replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 80) + ext;
  }

  function enqueue(it, nid) {
    if (!it || it.aup || up.busy[it.i] || up.q.some(function (x) { return x.it.i === it.i; })) return;
    up.q.push({ it: it, nid: nid });
    pump();
  }

  function pump() {
    if (up.running || !up.q.length) return;
    var f = F();
    if (!f || !f.upload) return;
    var job = up.q.shift();
    var it = job.it;
    up.running = true;
    up.busy[it.i] = 1;
    paintRows();
    blobOf(it).then(function (blob) {
      if (!blob) throw Object.assign(new Error('gone'), { error: 'gone' });
      return f.upload(blob, { refId: it.i, name: fileName(it), mime: it.m,
                              join: it.g ? { g: it.g, k: it.k | 0, last: !!it.gl } : undefined });
    }).then(function () {
      delete up.busy[it.i];
      return withDoc(job.nid, function (list) {
        list.forEach(function (x) { if (x.i === it.i) { x.aup = 1; delete x.upE; } });
      }).then(function () {
        it.aup = 1; delete it.upE;
        flashDone(it.i);
      });
    }, function (e) {
      delete up.busy[it.i];
      var w = (e && (e.error || e.message)) || 'fail';
      var n = (up.tries[it.i] = (up.tries[it.i] || 0) + 1);
      var fatal = /not_enrolled|not_configured|bad_mime|too_big|vault_full|gone|locked/.test(w);
      if (!fatal && n <= RETRY.length) {
        setTimeout(function () { enqueue(it, job.nid); }, RETRY[n - 1]);
      } else {
        return withDoc(job.nid, function (list) {
          list.forEach(function (x) { if (x.i === it.i) x.upE = w; });
        }).then(function () { it.upE = w; });
      }
    }).then(function () {
      up.running = false;
      paintRows();
      pump();
    });
  }

  function upErr(w) {
    if (/not_enrolled/.test(w)) return L('الحفظُ عندنا غيرُ مفتوحٍ لحسابك بعد.', 'Keeping files with us is not open for your account yet.');
    if (/vault_full/.test(w)) return L('امتلأت مساحتُك عندنا.', 'Your space with us is full.');
    if (/too_big/.test(w)) return L('التسجيلُ أكبرُ من الحدّ المسموح.', 'The recording is larger than allowed.');
    if (/locked/.test(w)) return L('حسابك مقفل — افتحه من إعدادات المزامنة.', 'Your account is locked — unlock it in sync settings.');
    if (/gone/.test(w)) return L('لم نجد التسجيلَ على هذا الجهاز.', 'The recording is not on this device.');
    return L('توقّفنا بعد ثلاث محاولات.', 'We stopped after three attempts.');
  }

  function scanUploads() {
    var nid = curId();
    items(curDoc()).forEach(function (it) {
      if (it.vow === 'us' && !it.aup && !it.upE && local(it) && !up.seen[it.i]) {
        up.seen[it.i] = 1;
        enqueue(it, nid);
      }
    });
  }

  window.addEventListener('garden:fileProgress', function (e) {
    var d = e.detail || {};
    if (!d.ref_id || !up.busy[d.ref_id]) return;
    if (d.stage === 'upload' && d.of > 0) { up.pct[d.ref_id] = Math.round(d.at * 100 / d.of); paintRows(); }
  });

  var doneAt = Object.create(null);
  function flashDone(id) {
    doneAt[id] = Date.now();
    setTimeout(function () { delete doneAt[id]; paintRows(); }, 3000);
  }

  var au = null;
  var pl = null;

  function engine() {
    if (au) return au;
    au = new Audio();
    au.preload = 'metadata';
    try { au.preservesPitch = true; } catch (e) {}
    au.addEventListener('timeupdate', onTime);
    au.addEventListener('ended', onEnded);
    au.addEventListener('play', function () { if (pl) { pl.on = true; paintPlay(); } });
    au.addEventListener('pause', function () { if (pl) { pl.on = false; paintPlay(); } });
    au.addEventListener('error', function () { if (pl) { pl.on = false; pl.err = 1; paintPlay(); } });
    return au;
  }
  function rate() {
    var r = Number(localStorage.getItem(RATE_LS) || 1);
    return RATES.indexOf(r) >= 0 ? r : 1;
  }
  function srcOf(it) {
    return blobOf(it).then(function (b) {
      if (b) return URL.createObjectURL(b);
      if (it.aup && F() && F().link) return F().link(it.i).then(function (l) { return l.url; });
      throw new Error('gone');
    });
  }
  function pos() {
    if (!pl || !au) return 0;
    var before = 0;
    for (var i = 0; i < pl.idx; i++) before += (pl.parts[i].ms || 0) / 1000;
    return before + (au.currentTime || 0);
  }
  function load(idx, at) {
    var p = pl.parts[idx];
    if (!p) return Promise.reject(new Error('gone'));
    var key = pl.key;
    return srcOf(p).then(function (url) {
      if (!pl || pl.key !== key) return;
      if (pl.url && /^blob:/.test(pl.url)) { try { URL.revokeObjectURL(pl.url); } catch (e) {} }
      pl.url = url;
      pl.idx = idx;
      var a = engine();
      a.src = url;
      a.playbackRate = rate();
      if (at > 0) {
        var set = function () { try { a.currentTime = at; } catch (e) {} a.removeEventListener('loadedmetadata', set); };
        a.addEventListener('loadedmetadata', set);
      }
    });
  }
  function play(key) {
    var g = groups(items(curDoc())).filter(function (x) { return x.key === key; })[0];
    if (!g) return;
    var a = engine();
    if (pl && pl.key === key) {
      if (a.paused) a.play()['catch'](function () {}); else a.pause();
      return;
    }
    if (!a.paused) a.pause();
    pl = { key: key, parts: g.parts, idx: 0, total: g.ms, title: gTitle(g), on: false, url: '', err: 0 };
    paintRows();
    load(0, 0).then(function () {
      if (pl && pl.key === key) engine().play()['catch'](function () {});
    }, function () { if (pl) { pl.err = 1; paintPlay(); } });
  }
  function seek(frac) {
    if (!pl) return;
    var t = Math.max(0, Math.min(1, frac)) * (pl.total / 1000);
    var acc = 0;
    for (var i = 0; i < pl.parts.length; i++) {
      var len = (pl.parts[i].ms || 0) / 1000;
      if (t <= acc + len || i === pl.parts.length - 1) {
        var off = t - acc, a = engine(), was = !a.paused;
        if (i === pl.idx) { try { a.currentTime = off; } catch (e) {} }
        else load(i, off).then(function () { if (was) engine().play()['catch'](function () {}); });
        return;
      }
      acc += len;
    }
  }
  function onEnded() {
    if (!pl) return;
    if (pl.idx < pl.parts.length - 1) {
      load(pl.idx + 1, 0).then(function () { engine().play()['catch'](function () {}); });
      return;
    }
    pl.on = false;
    pl.idx = 0;
    load(0, 0);
    paintPlay();
  }
  function onTime() { paintPlay(true); }
  function stopPlay() {
    if (au) { au.pause(); }
    if (pl && pl.url && /^blob:/.test(pl.url)) { try { URL.revokeObjectURL(pl.url); } catch (e) {} }
    pl = null;
    paintRows();
    paintStrip(true);
  }
  function cycleRate() {
    var r = RATES[(RATES.indexOf(rate()) + 1) % RATES.length];
    try { localStorage.setItem(RATE_LS, String(r)); } catch (e) {}
    if (au) au.playbackRate = r;
    paintPlay();
  }

  function paintPlay(light) {
    if (dlg && dlg.open && pl) {
      var row = dlg.querySelector('.nau-row[data-g="' + cssq(pl.key) + '"]');
      if (!row || !row.querySelector('.nau-seek')) { if (!light) paintRows(); return; }
      var t = pos(), tot = pl.total / 1000;
      var s = row.querySelector('.nau-seek');
      if (s && document.activeElement !== s) s.value = String(tot > 0 ? Math.round(t / tot * 1000) : 0);
      var c = row.querySelector('.nau-t-cur');
      if (c) c.textContent = short(t);
      var pb = row.querySelector('.nau-play > i');
      if (pb) pb.className = 'fa-solid ' + (pl.on ? 'fa-pause' : 'fa-play');
      var sp = row.querySelector('.nau-rate');
      if (sp) sp.textContent = rate() + '×';
      var er = row.querySelector('.nau-perr');
      if (er) er.hidden = !pl.err;
    }
    if (!light || stripMode === 'play') { paintStrip(); paintMini(); }
  }
  function cssq(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  var dlg = null;
  var dlgNote = null;
  var cloud = null;
  var ask = null;

  function shut() { if (dlg && dlg.open) { try { dlg.close(); } catch (e) {} } }

  function mkDialog(cls, labelId) {
    if (dlg && dlg.parentNode) { try { dlg.close(); } catch (e) {} if (dlg && dlg.parentNode) dlg.parentNode.removeChild(dlg); }
    var d = document.createElement('dialog');
    d.className = 'gsf gsf--snug nau-dlg ' + cls;
    d.setAttribute('aria-labelledby', labelId);
    d.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    document.body.appendChild(d);
    d.addEventListener('close', function () {
      var mine = d._ask && d._ask === ask;
      if (mine) { var inp = d.querySelector('.nau-name'); if (inp) ask.name = inp.value; }
      if (d.parentNode) d.parentNode.removeChild(d);
      if (dlg === d) { dlg = null; }
      if (mine) keepAsIs();
      paintStrip(true);
    });
    d.addEventListener('click', onClick);
    d.addEventListener('keydown', onKey);
    dlg = d;
    return d;
  }

  function openList() {
    ask = null;
    var d = mkDialog('nau-dlg--list', 'nau-t');
    dlgNote = curId();
    render();
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
    paintStrip(true);
    refreshHere().then(function () { if (dlg === d) paintRows(); });
    cloudState().then(function () { if (dlg === d && !ask) paintRows(); });
    return d;
  }

  function render() {
    if (!dlg || ask) return;
    var head = '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' + esc(L('إغلاق', 'Close')) +
      '" data-ar-title="إغلاق" data-en-title="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
      '<div class="gsf-body"><div class="gsf-head"><h2 class="gsf-title" id="nau-t">' +
      T('تسجيلاتُ هذه الملاحظة', 'Recordings of this note') + '</h2></div>';
    var top = '';
    if (lastErr) {
      top += '<div class="gsf-guard" role="alert"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><p>' +
        esc(errText(lastErr)) + '</p></div>';
    }
    if (live) {
      top += '<p class="nau-livenote"><span class="nau-dot" aria-hidden="true"></span>' +
        T('يجري التسجيل الآن — تحكّم به من الشريط أعلى الملاحظة.', 'Recording now — control it from the bar above the note.') + '</p>';
    } else if (draft) {
      top += '<p class="nau-livenote">' +
        T('عندك تسجيلٌ لم يكتمل — أكمله أو احفظه من الشريط أعلى الملاحظة.', 'You have an unfinished recording — continue or save it from the bar above the note.') + '</p>';
    } else {
      top += '<button type="button" class="gsf-btn gsf-btn--go nau-start" data-au="start">' +
        '<i class="fa-solid fa-microphone" aria-hidden="true"></i>' + T('ابدأ التسجيل', 'Start recording') + '</button>';
    }
    dlg.innerHTML = head + top + '<div class="nau-rows" role="list"></div></div>';
    paintRows();
  }

  function paintRows() {
    paintMic();
    if (!dlg || ask) return;
    var box = dlg.querySelector('.nau-rows');
    if (!box) return;
    var gs = groups(items(curDoc()));
    if (!gs.length) {
      box.innerHTML = '<p class="nau-empty">' +
        T('لا تسجيلاتٍ بعد. التسجيلُ يُحفظ على جهازك أوّلاً قطعةً كلَّ خمس ثوانٍ، فلا يضيع إن أُغلقت الصفحة.',
          'No recordings yet. Recording is saved on your device first, a piece every five seconds, so nothing is lost if the page closes.') + '</p>';
      return;
    }
    var focusKey = document.activeElement && document.activeElement.closest &&
      document.activeElement.closest('.nau-row') ? document.activeElement.closest('.nau-row').getAttribute('data-g') : '';
    gs.forEach(flagOf);
    box.innerHTML = gs.map(rowHtml).join('');
    if (focusKey) {
      var r = box.querySelector('.nau-row[data-g="' + cssq(focusKey) + '"] [data-au]');
      if (r) try { r.focus({ preventScroll: true }); } catch (e) {}
    }
    if (pl) paintPlay(true);
  }

  function whereText(w, g) {
    if (w === 'us') return '<i class="fa-solid fa-cloud" aria-hidden="true"></i>' + T('عندنا', 'With us');
    if (w === 'here') return '<i class="fa-solid fa-mobile-screen" aria-hidden="true"></i>' + T('هذا الجهاز', 'This device');
    if (w === 'up') {
      var p = 0;
      g.parts.forEach(function (x) { if (up.pct[x.i]) p = up.pct[x.i]; });
      return '<i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>' + T('يُرفع…', 'Uploading…') + (p ? ' ' + num(p + '%') : '');
    }
    if (w === 'err') return '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' + T('لم يُرفع', 'Not uploaded');
    return '<i class="fa-solid fa-laptop" aria-hidden="true"></i>' + T('على جهازٍ آخر', 'On another device');
  }

  function rowHtml(g) {
    var w = gWhere(g);
    var playable = w !== 'gone' || g.parts.every(function (p) { return p.aup; });
    var cur = pl && pl.key === g.key;
    var done = g.parts.some(function (p) { return doneAt[p.i]; });
    var title = gTitle(g);
    var h = '<div class="nau-row' + (cur ? ' is-cur' : '') + '" role="listitem" data-g="' + esc(g.key) + '"' +
      (done ? ' data-done="1"' : '') + '>';
    if (g.edit) {
      h += '<div class="nau-edit"><input class="gsf-in nau-name" type="text" maxlength="80" dir="auto" value="' + esc(title) +
        '" aria-label="' + esc(L('اسمُ التسجيل', 'Recording name')) + '">' +
        '<button type="button" class="gsf-btn gsf-btn--go" data-au="rename-ok">' + T('حفظ', 'Save') + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-au="rename-no">' + T('تراجع', 'Cancel') + '</button></div></div>';
      return h;
    }
    if (g.del) {
      var cloudCopy = g.parts.some(function (p) { return p.aup; });
      h += '<div class="nau-ask nau-ask--row"><p>' +
        (cloudCopy
          ? T('يُحذف «' + title + '» من هذا الجهاز ومن نسختنا.', '«' + title + '» will be deleted from this device and from our copy.')
          : T('يُحذف «' + title + '» نهائيّاً.', '«' + title + '» will be deleted for good.')) + '</p>' +
        '<button type="button" class="gsf-btn gsf-btn--danger" data-au="del-ok">' + T('احذف', 'Delete') + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-au="del-no">' + T('تراجع', 'Cancel') + '</button></div></div>';
      return h;
    }
    h += '<div class="nau-line">' +
      '<button type="button" class="nau-play" data-au="play"' + (playable ? '' : ' disabled') + ' aria-label="' +
        esc((cur && pl.on ? L('إيقافٌ مؤقّت: ', 'Pause: ') : L('تشغيل: ', 'Play: ')) + title) + '">' +
        '<i class="fa-solid ' + (cur && pl.on ? 'fa-pause' : 'fa-play') + '" aria-hidden="true"></i></button>' +
      '<div class="nau-txt"><div class="nau-name-t" dir="auto">' + esc(title) + '</div>' +
        '<div class="nau-meta">' + num(short(g.ms / 1000)) + '<span aria-hidden="true">·</span>' + num(size(g.b)) +
        '<span aria-hidden="true">·</span><span class="nau-where" data-w="' + w + '">' + whereText(w, g) + '</span></div></div>' +
      '<button type="button" class="nau-icb" data-au="rename" aria-label="' + esc(L('أعد التسمية: ', 'Rename: ') + title) +
        '" data-ar-title="أعد التسمية" data-en-title="Rename"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>' +
      '<button type="button" class="nau-icb" data-au="del" aria-label="' + esc(L('احذف: ', 'Delete: ') + title) +
        '" data-ar-title="احذف" data-en-title="Delete"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
      '</div>';
    if (w === 'err') {
      var e = g.parts.filter(function (p) { return p.upE; })[0];
      h += '<div class="nau-uperr"><span>' + esc(upErr(e ? e.upE : '')) + '</span>' +
        (e && /not_enrolled|locked/.test(e.upE) ? '' :
          '<button type="button" class="gsf-btn gsf-btn--ghost" data-au="retry">' + T('أعد المحاولة', 'Try again') + '</button>') + '</div>';
    }
    if (w === 'here' && cloud && cloud.ok && !g.parts.some(function (p) { return p.vow; })) {
      h += '<div class="nau-keep"><button type="button" class="gsf-btn gsf-btn--ghost" data-au="keep">' +
        '<i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>' + T('احفظ نسخةً عندنا', 'Keep a copy with us') + '</button></div>';
    }
    if (!playable) {
      h += '<div class="nau-uperr"><span>' +
        T('التسجيلُ على الجهاز الذي سُجّل فيه، ولم تُحفظ منه نسخةٌ عندنا.', 'The recording is on the device it was made on, and no copy was kept with us.') + '</span></div>';
    }
    if (cur) {
      h += '<div class="nau-player">' +
        '<span class="nau-t-cur nau-num">0:00</span>' +
        '<input class="nau-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="' + esc(L('موضعُ التشغيل', 'Playback position')) + '">' +
        '<span class="nau-t-all nau-num">' + esc(short(g.ms / 1000)) + '</span>' +
        '<button type="button" class="nau-rate nau-num" data-au="rate" aria-label="' + esc(L('سرعةُ التشغيل', 'Playback speed')) + '">' + rate() + '×</button>' +
        '<p class="nau-perr" hidden>' + T('تعذّر تشغيلُ هذا التسجيل.', 'This recording could not be played.') + '</p>' +
        '</div>';
    }
    return h + '</div>';
  }

  var edits = Object.create(null);
  var dels = Object.create(null);
  function flagOf(g) { g.edit = !!edits[g.key]; g.del = !!dels[g.key]; }
  function groupByKey(key) {
    return groups(items(curDoc())).filter(function (x) { return x.key === key; })[0] || null;
  }

  function onClick(e) {
    var b = e.target.closest ? e.target.closest('[data-au]') : null;
    if (!b || b.disabled) return;
    var a = b.getAttribute('data-au');
    var row = b.closest('.nau-row');
    var key = row ? row.getAttribute('data-g') : '';
    act(a, key, b);
  }

  function act(a, key, b) {
    var g = key ? groupByKey(key) : null;
    if (a === 'start') { start(); return; }
    if (a === 'hold') { hold(); return; }
    if (a === 'ask-stop' || a === 'ask-discard') {
      if (live) { live.confirm = a === 'ask-stop' ? 'stop' : 'discard'; paintStrip(true); focusStrip(); }
      return;
    }
    if (a === 'nevermind') {
      if (live) live.confirm = '';
      if (draft) draft.confirm = false;
      paintStrip(true); focusStrip(); return;
    }
    if (a === 'stop') { stop(); return; }
    if (a === 'discard') { discard(); return; }
    if (a === 'draft-go') { draftFinish(true); return; }
    if (a === 'draft-save') { draftFinish(false); return; }
    if (a === 'draft-ask') { if (draft) { draft.confirm = true; paintStrip(true); focusStrip(); } return; }
    if (a === 'draft-drop') { draftDrop(); return; }
    if (a === 'list') { openList(); return; }
    if (a === 'mini-toggle') { if (pl) play(pl.key); return; }
    if (a === 'mini-close') { stopPlay(); return; }
    if (a === 'play' && g) { play(key); return; }
    if (a === 'rate') { cycleRate(); return; }
    if (a === 'rename' && g) { edits[key] = 1; delete dels[key]; paintRowsWith(key); return; }
    if (a === 'rename-no') { delete edits[key]; paintRows(); return; }
    if (a === 'rename-ok' && g) { commitName(g, b); return; }
    if (a === 'del' && g) { dels[key] = 1; delete edits[key]; paintRowsWith(key); return; }
    if (a === 'del-no') { delete dels[key]; paintRows(); return; }
    if (a === 'del-ok' && g) { removeGroup(g); return; }
    if (a === 'retry' && g) {
      withDoc(curId(), function (list) { list.forEach(function (x) { if (x.upE && (x.g || x.i) === key) delete x.upE; }); })
        .then(function () { g.parts.forEach(function (p) { delete up.tries[p.i]; enqueue(p, curId()); }); });
      return;
    }
    if (a === 'keep' && g) { keepWithUs(g); return; }
    if (a === 'dest') { pickDest(b.getAttribute('data-v')); return; }
    if (a === 'save') { saveAsked(); return; }
    if (a === 'save-del') { if (ask) { ask.confirm = true; renderAsk(); } return; }
    if (a === 'save-del-no') { if (ask) { ask.confirm = false; renderAsk(); } return; }
    if (a === 'save-del-ok') { dropAsked(); return; }
  }

  function focusStrip() {
    var s = strip();
    var f = s && s.querySelector('button');
    if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
  }

  function paintRowsWith(key) {
    if (!dlg) return;
    paintRows();
    var box = dlg.querySelector('.nau-rows');
    if (!box) return;
    var r = box.querySelector('.nau-row[data-g="' + cssq(key) + '"]');
    var f = r && (r.querySelector('input') || r.querySelector('button'));
    if (f) { try { f.focus(); if (f.select) f.select(); } catch (e) {} }
  }

  function commitName(g, b) {
    var row = b.closest('.nau-row');
    var inp = row && row.querySelector('.nau-name');
    var v = inp ? inp.value.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
    delete edits[g.key];
    withDoc(curId(), function (list) {
      list.forEach(function (x) {
        if ((x.g || x.i) !== g.key) return;
        if (x === g.head || x.i === g.head.i) { if (v) x.nm = v; else delete x.nm; }
        else delete x.nm;
      });
    }).then(paintRows);
  }

  function removeGroup(g) {
    delete dels[g.key]; delete edits[g.key];
    if (pl && pl.key === g.key) stopPlay();
    var ids = g.parts.map(function (p) { return p.i; });
    var cloudIds = g.parts.filter(function (p) { return p.aup; }).map(function (p) { return p.i; });
    withDoc(curId(), function (list) {
      for (var i = list.length - 1; i >= 0; i--) if (ids.indexOf(list[i].i) >= 0) list.splice(i, 1);
    }).then(function () {
      var D = PD();
      ids.forEach(function (id) {
        delete mem[id]; delete here[id];
        if (D && D.drop) D.drop(id);
      });
      var f = F();
      if (f && f.remove) cloudIds.forEach(function (id) { f.remove(id)['catch'](function () {}); });
      paintRows();
    });
  }

  function cloudState() {
    var f = F();
    if (!f || !f.state) return Promise.resolve({ ok: false, why: 'none' });
    if (cloud && cloud.ok && Date.now() - cloud.at < 60000) return Promise.resolve(cloud);
    return f.state().then(function (s) { cloud = s; cloud.at = Date.now(); return s; },
                          function () { return { ok: false, why: 'offline' }; });
  }

  function keepWithUs(g) {
    cloudState().then(function (s) {
      if (!s.ok) {
        withDoc(curId(), function (list) {
          list.forEach(function (x) { if ((x.g || x.i) === g.key) x.upE = s.why === 'not_enrolled' ? 'not_enrolled' : (s.why || 'fail'); });
        }).then(paintRows);
        return;
      }
      withDoc(curId(), function (list) {
        list.forEach(function (x) { if ((x.g || x.i) === g.key) { x.vow = 'us'; delete x.upE; } });
      }).then(function () {
        g.parts.forEach(function (p) { p.vow = 'us'; enqueue(p, curId()); });
        paintRows();
      });
    });
  }

  function askSave(it, nid) {
    var list = nid === curId() ? items(curDoc()) : [it];
    var grp = it.g ? list.filter(function (x) { return x.g === it.g; }) : [it];
    if (!grp.length) grp = [it];
    ask = { it: it, nid: nid, parts: grp, dest: 'here', confirm: false,
            name: (noteTitle() || L('تسجيل', 'Recording')) + ' — ' + when(grp[0].s0 || it.t), cloud: null };
    var d = mkDialog('nau-dlg--save', 'nau-st');
    d._ask = ask;
    renderAsk();
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
    var inp = d.querySelector('.nau-name');
    if (inp) { try { inp.focus(); inp.select(); } catch (e) {} }
    cloudState().then(function (s) { if (ask && dlg === d) { ask.cloud = s; renderAsk(true); } });
  }

  function renderAsk(keepInput) {
    if (!dlg || !ask) return;
    var cur = dlg.querySelector('.nau-name');
    if (cur) ask.name = cur.value;
    var ms = ask.parts.reduce(function (a, p) { return a + (p.ms || 0); }, 0);
    var b = ask.parts.reduce(function (a, p) { return a + (p.b || 0); }, 0);
    var onDev = ask.parts.every(local);
    var cs = ask.cloud;
    var opt = function (v, icon, ar, en, subAr, subEn, off) {
      var on = ask.dest === v;
      return '<button type="button" class="nau-opt" data-au="dest" data-v="' + v + '" aria-pressed="' + on + '"' + (off ? ' disabled' : '') + '>' +
        '<i class="fa-solid ' + icon + '" aria-hidden="true"></i><span><b>' + T(ar, en) + '</b><span>' + T(subAr, subEn) + '</span></span></button>';
    };
    var shut0 = !!(cs && !cs.ok && CLOSED.test(cs.why || ''));
    var usOff = !cs || !cs.ok;
    var usSub = !cs ? ['نتحقّق…', 'Checking…'] : (cs.ok
      ? ['تبقى حتى نهاية الفصل، ونُنبّهك قبل حذفها بثلاثة أيّام. والأصلُ يبقى على جهازك.',
         'Kept until the end of the term; we warn you three days before removing it. The original stays on your device.']
      : (cs.why === 'locked' ? ['حسابك مقفل — افتحه من إعدادات المزامنة.', 'Your account is locked — unlock it in sync settings.']
                             : ['غيرُ متاحٍ الآن — جرّب لاحقاً من قائمة التسجيلات.', 'Not available right now — try later from the recordings list.']));
    var body;
    if (ask.confirm) {
      body = '<div class="nau-ask nau-ask--row"><p>' + T('يُحذف هذا التسجيلُ نهائيّاً من هذا الجهاز.', 'This recording will be deleted from this device for good.') + '</p>' +
        '<button type="button" class="gsf-btn gsf-btn--danger" data-au="save-del-ok">' + T('احذف', 'Delete') + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-au="save-del-no">' + T('تراجع', 'Cancel') + '</button></div>';
    } else {
      body =
        '<ul class="nau-facts"><li>' + num(clock(ms / 1000)) + '</li><li>' + num(size(b)) + '</li><li>' +
        (onDev ? T('محفوظٌ على هذا الجهاز', 'Saved on this device')
               : T('لم يُحفظ على الجهاز — اختر «عندنا» كي لا يضيع', 'Not saved on the device — choose “With us” so it is not lost')) + '</li></ul>' +
        '<label class="nau-lab">' + T('اسمُ التسجيل', 'Recording name') +
        '<input class="gsf-in nau-name" type="text" maxlength="80" dir="auto" value="' + esc(ask.name) + '"></label>' +
        (shut0 ? '' :
        '<p class="nau-q">' + T('أين نحفظ نسخةً تفتحها على أجهزتك؟', 'Where should we keep a copy you can open on your devices?') + '</p>' +
        '<div class="nau-opts">' +
        opt('us', 'fa-cloud', 'عندنا', 'With us', usSub[0], usSub[1], usOff) +
        opt('here', 'fa-mobile-screen', 'هذا الجهاز فقط', 'This device only',
            'لا يخرج من جهازك، ولا تجده على جهازك الآخر.', 'It never leaves your device, and you will not find it on your other device.', false) +
        '</div>');
    }
    dlg.innerHTML = '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' + esc(L('إغلاق', 'Close')) +
      '" data-ar-title="إغلاق" data-en-title="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
      '<div class="gsf-body"><div class="gsf-head"><h2 class="gsf-title" id="nau-st">' + T('انتهى التسجيل', 'Recording finished') + '</h2></div>' +
      body + '</div>' +
      (ask.confirm ? '' : '<div class="gsf-foot"><div class="gsf-acts nau-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--go" data-au="save">' + T('احفظ', 'Save') + '</button>' +
        '<span class="nau-gap"></span>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost nau-del" data-au="save-del">' + T('احذف التسجيل', 'Delete recording') + '</button></div></div>');
    if (keepInput) {
      var inp = dlg.querySelector('.nau-name');
      if (inp && document.activeElement === document.body) { try { inp.focus(); } catch (e) {} }
    }
  }

  function pickDest(v) { if (ask) { ask.dest = v === 'us' ? 'us' : 'here'; renderAsk(); } }

  function applyAsk(dest) {
    var a = ask;
    ask = null;
    if (!a) return Promise.resolve();
    var inp = dlg && dlg.querySelector('.nau-name');
    var name = ((inp ? inp.value : a.name) || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    var ids = a.parts.map(function (p) { return p.i; });
    return withDoc(a.nid, function (list) {
      list.forEach(function (x) {
        if (ids.indexOf(x.i) < 0) return;
        if (x.i === a.it.i && name) x.nm = name;
        if (dest === 'us') x.vow = 'us';
      });
    }).then(function () {
      if (dest === 'us') {
        var src = a.nid === curId() ? items(curDoc()) : a.parts;
        src.filter(function (x) { return ids.indexOf(x.i) >= 0; })
          .forEach(function (x) { enqueue(x, a.nid); });
      }
      paintRows();
    });
  }

  function saveAsked() {
    var dest = ask ? ask.dest : 'here';
    var p = applyAsk(dest);
    shut();
    return p;
  }
  function keepAsIs() { return applyAsk('here'); }
  function dropAsked() {
    var a = ask;
    ask = null;
    shut();
    if (!a) return;
    var g = { key: a.it.g || a.it.i, parts: a.parts };
    if (a.nid === curId()) removeGroup(groupByKey(g.key) || g);
    else {
      var ids = a.parts.map(function (p) { return p.i; });
      withDoc(a.nid, function (list) {
        for (var i = list.length - 1; i >= 0; i--) if (ids.indexOf(list[i].i) >= 0) list.splice(i, 1);
      }).then(function () { ids.forEach(function (id) { delete mem[id]; if (PD()) PD().drop(id); }); });
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && e.target && e.target.classList && e.target.classList.contains('nau-name')) {
      e.preventDefault();
      if (ask) saveAsked();
      else {
        var ok = e.target.closest('.nau-row') && e.target.closest('.nau-row').querySelector('[data-au="rename-ok"]');
        if (ok) ok.click();
      }
      return;
    }
    if (e.key === 'Escape' && e.target && e.target.classList && e.target.classList.contains('nau-name') && !ask) {
      e.preventDefault(); e.stopPropagation();
      var er = e.target.closest('.nau-row');
      if (er) delete edits[er.getAttribute('data-g')];
      paintRows(); return;
    }
    if ((e.key === ' ' || e.code === 'Space') && pl && !/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.nodeName)) {
      e.preventDefault(); play(pl.key);
    }
  }

  function onStrip(e) {
    var b = e.target.closest ? e.target.closest('[data-au]') : null;
    if (!b || b.disabled) return;
    act(b.getAttribute('data-au'), '', b);
  }

  function flush() {
    if (!live || !live.r || !live.r.rec) return;
    try { if (live.r.rec.state === 'recording') live.r.rec.requestData(); } catch (e) {}
    saveWip();
  }

  function onNoteDoc() {
    if (dlg && dlg.open && !ask && curId() !== dlgNote) shut();
    if (pl && dlgNote && curId() !== dlgNote) stopPlay();
    refreshHere().then(function () {
      paintMic();
      scanUploads();
      paintStrip(true);
    });
  }

  function boot() {
    var b = micBtn();
    if (b && !b._nau) {
      b._nau = 1;
      b.addEventListener('click', function () { openList(); });
    }
    var s = strip();
    if (s && !s._nau) { s._nau = 1; s.addEventListener('click', onStrip); }
    paintMic();
    refreshHere().then(checkDraft);
  }

  window.addEventListener('garden:noteDoc', onNoteDoc);
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('beforeunload', function (e) {
    if (!live) return;
    flush();
    e.preventDefault();
    e.returnValue = '';
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.GardenNotesAudio = {
    start: start,
    stop: stop,
    hold: hold,
    discard: discard,
    open: openList,
    play: play,
    seek: seek,
    state: function () {
      return { live: !!live, paused: !!(live && live.r.paused()), draft: draft ? draft.ptr : null,
               playing: !!(pl && pl.on), mode: mode() };
    },
    groups: function () { return groups(items(curDoc())); },
    checkDraft: checkDraft,
    local: local,
    refresh: refreshHere
  };
})();
