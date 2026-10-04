;(function () {
  'use strict';

  var WIP_LS = '__audioWip';
  var RATE_LS = '__audioRate';
  var BPS = 64000;
  var MAX_SEC = 3 * 3600;
  var TICK = 250;
  var BARS = 14;
  var RATES = [1, 1.25, 1.5, 1.75, 2, 0.75];
  var LINK_SLACK_MS = 15000;
  var LEAD_S = 2, END_SLACK = 1500;
  var RETRY = [5000, 20000, 60000];
  var CLOSED = /not_enrolled|no_vault|not_configured|origin|bad_vault|none/;
  var OTHER_TAB_MS = 12000;
  var LOG_LS = '__audioLog';
  var DIAG = /[?&]diag=1/.test(location.search);
  var SRC_LS = '__audioSrc';
  var SRCS = ['mic', 'system', 'both'];
  var EXT_MAX = 250 * 1024 * 1024;
  var EXT_MIME = { m4a: 'audio/x-m4a', m4b: 'audio/x-m4a', mp3: 'audio/mpeg', wav: 'audio/wav',
                   aac: 'audio/aac', amr: 'audio/amr', '3gp': 'audio/3gpp', '3gpp': 'audio/3gpp',
                   ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/opus', webm: 'audio/webm',
                   flac: 'audio/flac', caf: 'audio/x-caf', mp4: 'video/mp4', mov: 'video/quicktime',
                   mkv: 'video/x-matroska' };
  var EXT_ACCEPT = 'audio/*,video/*,.m4a,.m4b,.mp3,.wav,.aac,.amr,.3gp,.3gpp,.ogg,.oga,.opus,.webm,.flac,.caf,.mp4,.mov,.mkv';
  var XS_KEEP = 5;
  var XS_AGE = 24 * 3600 * 1000;
  var FILE_AGE = 7 * 24 * 3600 * 1000;
  var GONE_MS = 15000;

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
  function gdOn() { return !!(window.GardenEndpoints && window.GardenEndpoints.googleClientId); }
  function GDv() {
    var a = A();
    if (window.GardenDrive) return Promise.resolve(window.GardenDrive);
    return a && a.needDrive ? a.needDrive() : Promise.reject(new Error('no-drive'));
  }
  function courseOf() { var a = A(); try { return (a && a.course && a.course()) || ''; } catch (e) { return ''; } }
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

  function why(e, src) {
    var n = (e && (e.name || e.message)) || '';
    var m = (e && e.message) || '';
    if (/no_system_audio/.test(m)) return 'nosys';
    if (/system_audio_unsupported|no_display_media/.test(m)) return 'nosysup';
    if (src && src !== 'mic' && /NotAllowed|Permission|denied|Abort/i.test(n)) return 'cancel';
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
      fail: L('تعذّر بدءُ التسجيل. أعد المحاولة.', 'Could not start recording. Please try again.'),
      nosys: L('لم يصلنا صوتٌ من المشاركة — أعد المحاولة وفعّلْ خيارَ «مشاركة الصوت» في نافذة المتصفّح قبل أن توافق.',
               'No sound came with the share — try again and turn on “Share audio” in the browser window before you confirm.'),
      nosysup: L('متصفّحك لا يشارك صوتَ الجهاز — استعملْ كروم أو إيدج على الحاسب.',
                 'Your browser cannot share device audio — use Chrome or Edge on a computer.'),
      cancel: L('أُلغيت مشاركةُ الصوت، فلم يبدأ التسجيل.', 'Audio sharing was cancelled, so recording did not start.'),
      badfile: L('هذا الملفُّ ليس صيغةَ صوتٍ نعرفها — جرّب m4a أو mp3 أو wav أو تسجيلَ شاشة.',
                 'This file is not an audio format we know — try m4a, mp3, wav or a screen recording.'),
      toobig: L('الملفُّ أكبرُ من الحدّ المسموح (‏250 MB).', 'The file is larger than the allowed limit (250 MB).'),
      readfail: L('تعذّرت قراءةُ الملفّ على هذا الجهاز. أعد المحاولة.', 'The file could not be read on this device. Please try again.')
    }[w] || '';
  }

  function onPhone() {
    var R = RC();
    var os = (R && R.support ? R.support() : {}).os || '';
    return os === 'android' || os === 'ios';
  }
  function xmarks(doc) {
    return (doc && Array.isArray(doc.xs)) ? doc.xs.filter(function (t) { return t > 0 && Date.now() - t < XS_AGE; }) : [];
  }
  function openMark(doc) { var m = xmarks(doc); return m.length ? m[m.length - 1] : 0; }
  function markExt() {
    var t = Date.now();
    withDoc(curId(), function (list, doc) {
      doc.xs = xmarks(doc).concat([t]).slice(-XS_KEEP);
    }).then(function () { render(); });
  }
  function unmarkExt(t) {
    withDoc(curId(), function (list, doc) {
      var m = xmarks(doc).filter(function (x) { return x !== t; });
      if (m.length) doc.xs = m; else delete doc.xs;
    }).then(function () { render(); });
  }
  function clockOf(t) {
    var d = new Date(t);
    var hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
    return new Date().toDateString() === d.toDateString() ? hm : when(t);
  }

  function away() {
    if (!live || live.reviving || live.away || live.src !== 'mic' || !onPhone()) return;
    var was = live.r.paused();
    if (!was && !live.r.hold()) return;
    live.away = { at: Date.now(), was: was };
    note('away', was ? 'held' : 'hold');
  }
  function home() {
    if (!live || !live.away) return;
    var a = live.away;
    live.away = null;
    var ms = Date.now() - a.at;
    note('home', ms);
    if (a.was) return;
    live.r.resume();
    live.gone = { ms: ms, at: a.at, until: Date.now() + GONE_MS };
    saveWip();
    paintStrip(true);
  }

  function sysOk() {
    var R = RC();
    var sup = R && R.support ? R.support() : {};
    return !!(sup.system && sup.systemLikely);
  }
  function pickedSrc() {
    var v = '';
    try { v = localStorage.getItem(SRC_LS) || ''; } catch (e) {}
    return (SRCS.indexOf(v) > 0 && sysOk()) ? v : 'mic';
  }
  function setSrc(v) {
    try { localStorage.setItem(SRC_LS, SRCS.indexOf(v) >= 0 ? v : 'mic'); } catch (e) {}
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
    var src = SRCS.indexOf(o.src) >= 0 ? o.src : pickedSrc();
    if (src !== 'mic' && !sysOk()) return failStart('nosysup');
    var r = new R.Recorder({ bps: BPS, source: src });
    lastErr = '';
    return r.open().then(function () {
      var id = uid('w');
      live = { r: r, id: id, nid: nid, g: o.g || '', k: o.k | 0, bytes: 0, parts: 0, src: src,
               bars: [], hush: 0, hotN: 0, hotUntil: 0, tickN: 0, lost: false, at: Date.now(),
               back: o.back ? Date.now() + 9000 : 0,
               gone: o.away ? { ms: Date.now() - o.away, at: o.away, until: Date.now() + GONE_MS } : null,
               wake: (F() && F().awake) ? F().awake() : null, confirm: '' };
      watchTracks(r, src);
      if (o.back && trail) note('continue', o.k | 0); else trailStart(r, src);
      r.onData = function (blob, i) {
        if (!live || live.r !== r) return;
        var gap = Date.now() - live.at;
        note('data', blob.size + (gap > 7500 ? ' gap=' + gap : ''));
        live.at = Date.now();
        live.bytes += blob.size;
        live.parts = i + 1;
        var D = PD();
        if (D && D.put) {
          D.put('wip_' + id + '_' + i, blob, { name: '' }).then(function (ok) { if (!ok && live) live.lost = true; });
        }
        saveWip();
      };
      r.start();
      /*@3.NOAJ3.6*/
      var Dp = PD();
      if (Dp && Dp.persist) Dp.persist();
      saveWip();
      live.timer = setInterval(tick, TICK);
      shut();
      paintStrip(true);
      paintMic();
      emit('garden:audioRec', { state: 'rec', note: nid });
      return true;
    }, function (e) {
      try { r.release(); } catch (e2) {}
      return failStart(why(e, src));
    });
  }

  function watchTracks(r, src) {
    (r.raw || []).forEach(function (st, idx) {
      var sys = src === 'system' || (src === 'both' && idx === 1);
      st.getAudioTracks().forEach(function (t) {
        t.addEventListener('ended', function () {
          if (!live || live.r !== r) return;
          if (sys) { if (src === 'system') stop(); return; }
          revive();
        });
      });
    });
    if (r.rec) r.rec.addEventListener('error', function () { if (live && live.r === r) revive(); });
  }

  function dead(cur) {
    var rec = cur && cur.r && cur.r.rec;
    if (!rec) return false;
    if (rec.state === 'inactive') return true;
    var mic = (cur.r.raw || [])[0];
    if (!mic || cur.src === 'system') return false;
    var ts = mic.getAudioTracks();
    return ts.length > 0 && ts.every(function (t) { return t.readyState === 'ended'; });
  }

  var trail = null;
  function note(k, v) {
    if (!trail) return;
    trail.e.push([Date.now() - trail.t0, k, v == null ? '' : v]);
    if (trail.e.length > 400) trail.e.splice(1, 1);
    try { localStorage.setItem(LOG_LS, JSON.stringify(trail)); } catch (e) {}
  }
  function trailStart(r, src) {
    trail = { t0: Date.now(), ua: navigator.userAgent, src: src,
              pwa: !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches), e: [] };
    note('start', r.type || '');
    (r.raw || []).forEach(function (st, idx) {
      st.getAudioTracks().forEach(function (t) {
        ['mute', 'unmute', 'ended'].forEach(function (k) {
          t.addEventListener(k, function () { note('track' + idx + ':' + k); });
        });
      });
    });
    if (r.rec) {
      ['pause', 'resume', 'error', 'stop'].forEach(function (k) {
        r.rec.addEventListener(k, function () { note('rec:' + k); });
      });
    }
  }

  var cut = null;
  function revive() {
    if (!live || live.reviving) return;
    live.reviving = 1;
    note('revive', document.visibilityState);
    var cur = endLive();
    var g = cur.g || uid('g');
    var k = cur.k | 0;
    var aw = cur.away ? cur.away.at : (cur.gone ? cur.gone.at : 0);
    paintStrip(true);
    cur.r.stop().then(function (res) {
      if (!res.blob || res.blob.size < 1024) {
        wipDrop(cur.id); clearWip(cur.id);
        return null;
      }
      return finalize({ blob: res.blob, sec: res.sec, t0: res.t0, holds: res.holds, m: res.type,
                        nid: cur.nid, g: g, k: k, last: false, wipId: cur.id });
    }).then(function (it) {
      var nid = (it && nidOf[it.i]) || cur.nid;
      var nk = it ? k + 1 : k;
      emit('garden:audioRec', { state: 'cut', note: nid });
      if (cur.src === 'mic' && document.visibilityState === 'visible') {
        return start({ nid: nid, g: g, k: nk, src: 'mic', back: 1, away: aw }).then(function (ok) {
          if (!ok) { cut = { nid: nid, g: g, k: nk, src: cur.src, it: it, away: aw }; paintStrip(true); }
        });
      }
      cut = { nid: nid, g: g, k: nk, src: cur.src, it: it, away: aw };
      paintStrip(true);
    });
  }

  function cutGo() {
    var c = cut;
    cut = null;
    if (!c) return;
    paintStrip(true);
    start({ nid: c.nid, g: c.g, k: c.k, src: c.src, back: 1, away: c.away });
  }
  function cutEnd() {
    var c = cut;
    cut = null;
    paintStrip(true);
    if (!c || !c.it) return;
    withDoc(c.nid, function (list) {
      list.forEach(function (x) { if (x.i === c.it.i) x.gl = 1; });
    }).then(function () { c.it.gl = 1; askSave(c.it, c.nid); });
  }

  function checkAlive() {
    if (live && !live.reviving && dead(live)) revive();
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
               src: live.src || 'mic', g: live.g || undefined, k: live.g ? live.k : undefined,
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
    if (!live.reviving && dead(live)) { revive(); return; }
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
    if (live.gone && Date.now() >= live.gone.until) { live.gone = null; paintStrip(true); }
    var say = held ? 'held' : (Date.now() < live.hotUntil ? 'hot' :
      (live.gone ? 'gone' : (Date.now() < live.back ? 'back' : (live.hush > 48 ? 'hush' : 'rec'))));
    paintLive(st, say);
  }

  function strip() { return document.getElementById('na-audio'); }
  var stripMode = '';
  var fold = false, foldRO = null;
  function docBox() { return document.getElementById('na-doc-body'); }
  function place() {
    var s = strip(), b = docBox();
    if (!s) return;
    if (stripMode !== 'play' || !b) { s.style.removeProperty('--nau-top'); return; }
    s.style.setProperty('--nau-top', b.offsetTop + 'px');
  }
  function setFold(on) {
    fold = !!on;
    var s = strip();
    if (!s) return;
    if (fold && stripMode === 'play') s.setAttribute('data-fold', '1'); else s.removeAttribute('data-fold');
  }
  /*@3.NOAJ3.3*/
  function bindFold() {
    var s = strip(), b = docBox();
    if (!s || !b || s._fold) return;
    s._fold = 1;
    var away = function (e) {
      if (stripMode !== 'play' || fold) return;
      if (e && e.target && s.contains(e.target)) return;
      setFold(true);
    };
    document.addEventListener('pointerdown', function (e) { if (b.contains(e.target)) away(e); }, true);
    b.addEventListener('wheel', away, { passive: true });
    b.addEventListener('scroll', function () { if (Date.now() - (b._nauUser || 0) < 900) away(); }, { passive: true });
    b.addEventListener('touchmove', function () { b._nauUser = Date.now(); }, { passive: true });
    b.addEventListener('pointerdown', function () { b._nauUser = Date.now(); }, true);
    var hover = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
    s.addEventListener('pointerenter', function () { if (fold && hover && hover.matches) setFold(false); });
    s.addEventListener('focusin', function () { if (fold) setFold(false); });
    s.addEventListener('click', function (e) {
      if (!fold || stripMode !== 'play') return;
      setFold(false);
      if (!e.detail) return;
      e.preventDefault(); e.stopPropagation();
    }, true);
    s.addEventListener('pointerdown', function (e) { if (fold && stripMode === 'play') e.preventDefault(); }, true);
    if (window.ResizeObserver) { foldRO = new ResizeObserver(place); foldRO.observe(b); }
    window.addEventListener('resize', place);
  }

  function mode() {
    if (live) return live.r.paused() ? 'held' : 'rec';
    if (cut) return 'cut';
    if (draft) return 'draft';
    if (pl && au) return linkOn() ? 'link' : 'play';
    return '';
  }

  function paintStrip(force) {
    var s = strip();
    if (!s) return;
    var m = mode();
    s.hidden = !m;
    if (!m) { s.removeAttribute('data-mode'); s.removeAttribute('data-fold'); s.style.removeProperty('--nau-top'); s.innerHTML = ''; stripMode = ''; return; }
    if (!force && m === stripMode) return;
    if (m !== stripMode && m === 'play' && stripMode !== 'link') fold = false;
    stripMode = m;
    bindFold();
    s.setAttribute('data-mode', m);
    s.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    if (m === 'rec' || m === 'held') s.innerHTML = liveHtml(m);
    else if (m === 'draft') s.innerHTML = draftHtml();
    else if (m === 'cut') s.innerHTML = cutHtml();
    else if (m === 'link') s.innerHTML = linkHtml();
    else s.innerHTML = miniHtml();
    if (m === 'rec' || m === 'held') { var st = live.r.stats(); paintLive(st, m === 'held' ? 'held' : 'rec'); }
    if (m === 'play') paintMini();
    if (m === 'link') { paintSeek(s); paintLane(s); }
    setFold(fold);
    place();
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
    var srcI = live && live.src === 'system' ? 'fa-display' : (live && live.src === 'both' ? 'fa-sliders' : '');
    return '<span class="nau-dot" aria-hidden="true"></span>' +
      (srcI ? '<i class="fa-solid ' + srcI + ' nau-srci" aria-hidden="true"></i>' : '') +
      '<span class="nau-clock nau-num" role="timer" aria-live="off">00:00</span>' +
      '<span class="nau-wave" aria-hidden="true">' + bars + '</span>' +
      '<span class="nau-say" aria-live="polite">' +
        '<b data-say="rec">' + T('يسجّل', 'Recording') + '</b>' +
        '<b data-say="held">' + T('متوقّفٌ مؤقّتاً', 'Paused') + '</b>' +
        '<b data-say="hush">' + T('لا نسمع صوتاً', 'No sound') + '</b>' +
        '<b data-say="hot">' + T('الصوتُ عالٍ جدّاً', 'Too loud') + '</b>' +
        '<b data-say="back">' + T('عاد بعد انقطاع', 'Back after a cut') + '</b>' +
        (live && live.gone ? '<b data-say="gone">' + T('فاته ' + short(live.gone.ms / 1000) + ' وأنت خارج الصفحة',
          'Missed ' + short(live.gone.ms / 1000) + ' while away') + '</b>' : '') + '</span>' +
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

  function cutHtml() {
    return '<i class="fa-solid fa-triangle-exclamation nau-warn" aria-hidden="true"></i>' +
      '<span class="nau-draft"><b>' + T('توقّف التسجيل', 'Recording stopped') + '</b> ' +
      T('حين غادرتَ الصفحة — وحُفظ ما سُجّل قبلها.', 'when you left the page — what came before is saved.') + '</span>' +
      '<span class="nau-gap"></span>' +
      '<button type="button" class="gsf-btn gsf-btn--go nau-b" data-au="cut-go">' + T('أكمل التسجيل', 'Continue recording') + '</button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost nau-b" data-au="cut-end">' + T('يكفي، أنهِه', 'That is all, finish') + '</button>';
  }

  /*@3.NOAJ3.2*/
  function tpHtml(stop) {
    var sk = function (d, ic, ar, en) {
      return '<button type="button" class="nau-icb nau-skip" data-au="skip" data-d="' + d + '" aria-label="' + esc(L(ar, en)) +
        '" data-ar-title="' + ar + '" data-en-title="' + en + '"><i class="fa-solid ' + ic + '" aria-hidden="true"></i><b class="nau-num">15</b></button>';
    };
    return '<span class="nau-tp">' +
      (stop ? '<button type="button" class="nau-icb nau-stop" data-au="mini-close" aria-label="' + esc(L('أوقفْ وأخفِ الشريط', 'Stop and hide the bar')) +
        '" data-ar-title="أوقفْ وأخفِ الشريط" data-en-title="Stop and hide the bar"><i class="fa-solid fa-stop" aria-hidden="true"></i></button>' : '') +
      sk(-15, 'fa-rotate-left', 'ارجعْ ‎15 ثانية', 'Back 15 seconds') +
      '<button type="button" class="nau-icb nau-icb--play" data-au="mini-toggle" aria-label="' +
        esc(L('تشغيل أو إيقاف', 'Play or pause')) + '"><i class="fa-solid ' + (pl && pl.on ? 'fa-pause' : 'fa-play') + '" aria-hidden="true"></i></button>' +
      sk(15, 'fa-rotate-right', 'تقدّمْ ‎15 ثانية', 'Forward 15 seconds') + '</span>';
  }
  function trkHtml() {
    return '<span class="nau-t-cur nau-num">' + short(pos()) + '</span>' +
      '<span class="nau-trk"><input class="nau-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="' + esc(L('موضعُ التشغيل', 'Playback position')) + '"><span class="nau-lane" hidden></span></span>' +
      '<span class="nau-t-all nau-num"></span>';
  }
  function miniHtml() {
    return tpHtml(true) +
      '<button type="button" class="nau-mini-name" data-au="list" title="' + esc(L('التسجيلات', 'Recordings')) + '"></button>' +
      '<span class="nau-brk" aria-hidden="true"></span>' + trkHtml() +
      '<button type="button" class="nau-rate nau-num" data-au="rate" aria-label="' + esc(L('سرعةُ التشغيل', 'Playback speed')) + '">' + rate() + '×</button>' +
      '<button type="button" class="nau-icb" data-au="link-on" aria-label="' + esc(L('اربطْ هذا التسجيلَ بالرسم', 'Link this recording to the drawing')) +
      '" data-ar-title="اربطْ هذا التسجيلَ بالرسم" data-en-title="Link this recording to the drawing"><i class="fa-solid fa-link" aria-hidden="true"></i></button>';
  }

  function paintMini() {
    var s = strip();
    if (!s || stripMode !== 'play' || !pl) return;
    var i = s.querySelector('.nau-icb--play > i');
    if (i) i.className = 'fa-solid ' + (pl.on ? 'fa-pause' : 'fa-play');
    var n = s.querySelector('.nau-mini-name');
    if (n && n.textContent !== pl.title) n.textContent = pl.title;
    paintSeek(s);
    paintLane(s);
  }

  function total() {
    if (!pl) return 0;
    if (pl.total > 0) return pl.total / 1000;
    var d = au && au.duration;
    return (isFinite(d) && d > 0 && pl.parts.length === 1) ? d : 0;
  }
  function paintSeek(box) {
    if (!box || !pl) return;
    var t = pos(), tot = total();
    var sk = box.querySelector('.nau-seek');
    if (sk && !sk._drag) sk.value = String(tot > 0 ? Math.round(Math.min(1, t / tot) * 1000) : 0);
    var c = box.querySelector('.nau-t-cur');
    if (c && !(sk && sk._drag)) c.textContent = short(t);
    var al = box.querySelector('.nau-t-all');
    if (al) al.textContent = short(tot);
    var sp = box.querySelector('.nau-rate');
    if (sp) sp.textContent = rate() + '×';
  }

  function onSeekInput(e) {
    var sk = e.target;
    if (!sk || !sk.classList || !sk.classList.contains('nau-seek') || !pl) return;
    sk._drag = 1;
    var box = sk.closest('.nau-player, .nau');
    var c = box && box.querySelector('.nau-t-cur');
    if (c) c.textContent = short(Number(sk.value) / 1000 * total());
  }
  function onSeekChange(e) {
    var sk = e.target;
    if (!sk || !sk.classList || !sk.classList.contains('nau-seek') || !pl) return;
    sk._drag = 0;
    seek(Number(sk.value) / 1000);
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
      if (cont) return start({ nid: at, g: g, k: k + 1, src: p.src }).then(function () { return it; });
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
    if (g.parts.some(function (p) { return gdBusy[p.i]; })) return 'gdup';
    if (g.parts.every(function (p) { return p.gd; })) return 'gd';
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

  /*@3.NOAJ3.4*/
  var gdBusy = Object.create(null);
  function toDrive(parts, nid, name) {
    var n = parts.length;
    return GDv().then(function (GD) {
      var chain = Promise.resolve();
      parts.forEach(function (it, k) {
        chain = chain.then(function () {
          if (it.gd) return null;
          gdBusy[it.i] = 1;
          paintRows();
          return blobOf(it).then(function (blob) {
            if (!blob) throw Object.assign(new Error('gone'), { code: 'gone' });
            var base = fileName(Object.assign({}, it, { nm: name || it.nm }));
            var nm = n > 1 ? base.replace(/(\.[a-z0-9]+)$/i, ' — ' + (k + 1) + '$1') : base;
            return GD.upload(blob, { name: nm, mime: it.m || blob.type || 'audio/webm', sha: it.i, kind: 'aud', course: courseOf() });
          }).then(function (r) {
            delete gdBusy[it.i];
            it.gd = r.id;
            return withDoc(nid, function (list) { list.forEach(function (x) { if (x.i === it.i) x.gd = r.id; }); });
          }, function (e) {
            delete gdBusy[it.i];
            paintRows();
            throw e;
          });
        });
      });
      return chain.then(function () { paintRows(); paintMic(); });
    });
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
    if (/vault_full/.test(w)) return L('مساحتُك عندنا ممتلئةٌ بملفّاتٍ لم تُكمل ثلاثةَ أيّام — احذفْ ما لا تحتاجه من «المزامنة ⇐ ملفّاتُك عندنا» ثمّ أعِدِ المحاولة.', 'Your space with us is full of files under three days old — delete what you do not need in “Sync ⇒ Your files with us”, then try again.');
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
    au.addEventListener('playing', function () { if (pl) pl.renew = 0; });
    au.addEventListener('error', function () {
      if (!pl) return;
      var was = pl.on;
      if (pl.url && !/^blob:/.test(pl.url) && (pl.renew || 0) < 2) {
        pl.renew = (pl.renew || 0) + 1;
        relink(was);
        return;
      }
      pl.on = false; pl.err = 1; paintPlay();
    });
    return au;
  }
  /*@3.NOAJ3.5*/
  var linkExp = Object.create(null);
  function stale() {
    return !!(pl && pl.url && linkExp[pl.url] && Date.now() > linkExp[pl.url] - LINK_SLACK_MS);
  }
  function relink(go) {
    var a = engine(), at = a.currentTime || pl.at || 0;
    return load(pl.idx, at).then(function () {
      if (go && pl) engine().play()['catch'](function () {});
    }, function () { if (pl) { pl.on = false; pl.err = 1; paintPlay(); } });
  }
  function rate() {
    var r = Number(localStorage.getItem(RATE_LS) || 1);
    return RATES.indexOf(r) >= 0 ? r : 1;
  }
  function srcOf(it) {
    return blobOf(it).then(function (b) {
      if (b) return URL.createObjectURL(b);
      if (it.aup && F() && F().link) {
        return F().link(it.i).then(function (l) {
          linkExp[l.url] = Date.now() + (Number(l.expires_in) || 300) * 1000;
          return l.url;
        });
      }
      if (it.gd && gdOn()) {
        return GDv().then(function (GD) { return GD.download(it.gd); }).then(function (bl) {
          var b2 = new Blob([bl], { type: it.m || bl.type || 'audio/webm' });
          mem[it.i] = b2;
          return URL.createObjectURL(b2);
        });
      }
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
      return ready(a).then(function () {
        if (!pl || pl.key !== key) return;
        try { a.currentTime = at > 0 ? at : 0; } catch (e) {}
        pl.at = at > 0 ? at : 0;
      });
    });
  }

  function ready(a) {
    return new Promise(function (ok) {
      var done = false;
      var fin = function () {
        if (done) return;
        done = true;
        a.removeEventListener('loadedmetadata', meta);
        a.removeEventListener('durationchange', dur);
        if (pl) pl.fixing = 0;
        ok();
      };
      var dur = function () { if (isFinite(a.duration) && a.duration > 0) fin(); };
      var meta = function () {
        if (isFinite(a.duration) && a.duration > 0) { fin(); return; }
        if (pl) pl.fixing = 1;
        a.addEventListener('durationchange', dur);
        try { a.currentTime = 1e7; } catch (e) { fin(); }
      };
      if (a.readyState >= 1) meta(); else a.addEventListener('loadedmetadata', meta);
      a.addEventListener('error', fin, { once: true });
      setTimeout(fin, 8000);
    });
  }
  function play(key) {
    var g = groups(items(curDoc())).filter(function (x) { return x.key === key; })[0];
    if (!g) return;
    var a = engine();
    if (pl && pl.key === key) {
      if (!a.paused) { a.pause(); return; }
      if (stale()) relink(true); else a.play()['catch'](function () {});
      return;
    }
    if (!a.paused) a.pause();
    pl = { key: key, parts: g.parts, idx: 0, total: g.ms, title: gTitle(g), on: false, url: '', err: 0 };
    setFold(false);
    paintRows();
    load(0, 0).then(function () {
      if (pl && pl.key === key) engine().play()['catch'](function () {});
    }, function () { if (pl) { pl.err = 1; paintPlay(); } });
  }
  function secIn(it, ts) {
    var s0 = +it.s0 || 0, ms = +it.ms || 0;
    if (!(s0 > 0) || !(ms > 0) || !(ts > 0)) return -1;
    var rel = ts - s0;
    if (rel < 0) return -1;
    var held = 0, hz = Array.isArray(it.hz) ? it.hz : [];
    for (var i = 0; i < hz.length; i++) {
      var h0 = +hz[i][0] || 0, h1 = +hz[i][1] || 0;
      if (!(h1 > h0)) continue;
      if (rel >= h1) held += h1 - h0;
      else if (rel > h0) held += rel - h0;
    }
    var at = rel - held;
    return at <= ms + END_SLACK ? Math.min(at, ms) / 1000 : -1;
  }
  function momentAt(ts) { return momentIn(groups(items(curDoc())), ts); }
  function anchorsOf(g) {
    var a = g && g.parts[0] ? g.parts[0].an : null;
    if (!Array.isArray(a)) return [];
    return a.filter(function (x) { return x && x[1] > 0 && x[0] >= 0; })
      .slice().sort(function (p, q) { return p[1] - q[1]; });
  }
  function secByAn(an, ts) {
    var i, a, b, z = an[an.length - 1];
    if (ts <= an[0][1]) return an[0][0] + (ts - an[0][1]) / 1000;
    if (ts >= z[1]) return z[0] + (ts - z[1]) / 1000;
    for (i = 1; i < an.length; i++) {
      a = an[i - 1]; b = an[i];
      if (ts <= b[1]) return a[0] + (b[1] > a[1] ? (ts - a[1]) / (b[1] - a[1]) : 0) * (b[0] - a[0]);
    }
    return -1;
  }
  function momentIn(gs, ts) {
    var best = null;
    if (!(ts > 0)) return null;
    gs.forEach(function (g) {
      var before = 0, an = anchorsOf(g);
      if (an.length) {
        var sa = secByAn(an, ts), tot = (g.ms || 0) / 1000, rk = an[0][1] - an[0][0] * 1000;
        if (sa >= -END_SLACK / 1000 && sa <= tot + END_SLACK / 1000 && (!best || rk > best.s0)) {
          best = { key: g.key, sec: Math.round(Math.max(0, Math.min(tot, sa)) * 10) / 10, s0: rk, title: gTitle(g) };
        }
        return;
      }
      g.parts.forEach(function (p) {
        var s = secIn(p, ts);
        if (s >= 0 && (!best || p.s0 > best.s0)) {
          best = { key: g.key, sec: Math.round((before + s) * 10) / 10, s0: p.s0, title: gTitle(g) };
        }
        before += (p.ms || 0) / 1000;
      });
    });
    return best ? { key: best.key, sec: best.sec, title: best.title } : null;
  }
  var MARK_GAP_S = 4, MARK_MAX = 60;
  var markSrc = null, marks = [], markSeq = 0, markT = 0, markStale = true, markMemo = { k: '', v: null };
  function setMarks(fn) { markSrc = typeof fn === 'function' ? fn : null; markStale = true; refreshMarks(); }
  function refreshMarks() {
    markStale = true;
    if (!pl || !markSrc) return;
    clearTimeout(markT);
    markT = setTimeout(function () {
      var seq = ++markSeq, got = null;
      markStale = false;
      try { got = markSrc(); } catch (e) { got = null; }
      Promise.resolve(got).then(function (list) {
        if (seq !== markSeq) return;
        marks = Array.isArray(list) ? list.filter(function (m) { return m && m.ts > 0; }) : [];
        markMemo.k = '';
        paintLanes();
      }, function () {});
    }, 250);
  }
  function marksOf(key) {
    var gs = groups(items(curDoc())), g = gs.filter(function (x) { return x.key === key; })[0];
    if (!g) return { list: [], tot: 0 };
    var mk = key + '|' + markSeq + '|' + marks.length + '|' + gs.length + '|' + g.ms;
    if (markMemo.k === mk) return markMemo.v;
    var tot = (g.ms || 0) / 1000, pts = [], out = [], i;
    for (i = 0; i < marks.length; i++) {
      var mo = momentIn(gs, marks[i].ts);
      if (mo && mo.key === key) pts.push({ sec: mo.sec, m: marks[i] });
    }
    pts.sort(function (a, b) { return a.sec - b.sec; });
    var gap = Math.max(MARK_GAP_S, tot / MARK_MAX);
    for (i = 0; i < pts.length; i++) {
      var last = out[out.length - 1];
      if (last && pts[i].sec - last.sec < gap) { last.n++; continue; }
      out.push({ sec: pts[i].sec, n: 1, m: pts[i].m });
    }
    markMemo = { k: mk, v: { list: out, tot: tot } };
    return markMemo.v;
  }
  function nStrokes(n) {
    return n === 2 ? L('ضربتان', '2 strokes') : L(n + (n <= 10 ? ' ضربات' : ' ضربة'), n + ' strokes');
  }
  function paintLane(box) {
    var ln = box && box.querySelector('.nau-lane');
    if (!ln || !pl) return;
    if (markStale) refreshMarks();
    var r = marksOf(pl.key), tot = total() || r.tot;
    var sig = pl.key + '|' + tot + '|' + r.list.map(function (c) { return c.sec + 'x' + c.n; }).join(',') + '|' + isAr();
    if (ln._sig === sig) return;
    ln._sig = sig; ln._cl = r.list;
    ln.hidden = !r.list.length;
    var h = '';
    r.list.forEach(function (c, i) {
      var pct = tot > 0 ? Math.max(0, Math.min(100, c.sec / tot * 100)) : 0;
      var lab = (c.m.lbl ? c.m.lbl + ' · ' : '') + short(c.sec) + (c.n > 1 ? ' · ' + nStrokes(c.n) : '');
      h += '<button type="button" class="nau-pin" data-au="mark" data-i="' + i + '" style="inset-inline-start:' + pct.toFixed(2) +
        '%" title="' + esc(lab) + '" aria-label="' + esc(L('اذهبْ إلى ما رُسم هنا: ', 'Go to what was drawn here: ') + lab) + '">' +
        (c.n > 1 ? '<b class="nau-num">' + c.n + '</b>' : '<i></i>') + '</button>';
    });
    ln.innerHTML = h;
  }
  function paintLanes() {
    var s = strip();
    if (s && (stripMode === 'play' || stripMode === 'link')) paintLane(s);
    if (dlg && dlg.open && pl) {
      var row = dlg.querySelector('.nau-row[data-g="' + cssq(pl.key) + '"] .nau-player');
      if (row) paintLane(row);
    }
  }
  function goMark(b) {
    var ln = b.closest('.nau-lane'), c = ln && ln._cl ? ln._cl[+b.getAttribute('data-i')] : null;
    if (!c || !pl) return;
    if (b.closest('dialog')) shut();
    playAt(pl.key, c.sec);
    if (c.m.go) { try { c.m.go(); } catch (e) {} }
  }
  var linking = null, linkSaid = 0;
  function linkOn() { return !!(linking && pl && linking.key === pl.key); }
  function setLink(on) {
    var an0 = null;
    if (on && pl) {
      var g0 = groups(items(curDoc())).filter(function (x) { return x.key === pl.key; })[0];
      var p00 = g0 && g0.parts[0];
      an0 = (p00 && Array.isArray(p00.an)) ? JSON.parse(JSON.stringify(p00.an)) : null;
    }
    linking = (on && pl) ? { key: pl.key, an0: an0 } : null;
    paintStrip(true);
    if (api.onLink) { try { api.onLink(linkOn()); } catch (e) {} }
  }
  /*@3.NOAJ3.1*/
  function cancelLink() {
    if (!linkOn()) { setLink(false); return; }
    var key = linking.key, an0 = linking.an0;
    withDoc(curId(), function (list) {
      var head = groups(list).filter(function (x) { return x.key === key; })[0];
      var p0 = head && head.parts[0];
      if (!p0) return;
      if (an0 && an0.length) p0.an = an0; else delete p0.an;
    });
    markMemo.k = ''; linkSaid = 0;
    setLink(false);
    paintLanes();
  }
  function anchor(ts) {
    if (!linkOn()) return null;
    if (!(ts > 0)) { linkSaid = Date.now(); paintStrip(true); setTimeout(function () { if (linkOn()) paintStrip(true); }, 2100); return null; }
    var sec = Math.round(pos() * 10) / 10, key = pl.key, n = 0;
    withDoc(curId(), function (list) {
      var head = groups(list).filter(function (x) { return x.key === key; })[0];
      if (!head) return;
      var p0 = head.parts[0], an = Array.isArray(p0.an) ? p0.an.filter(function (x) { return x && x[1] !== ts; }) : [];
      an.push([sec, ts]);
      an.sort(function (a, b) { return a[1] - b[1]; });
      p0.an = an.slice(-24);
      n = p0.an.length;
    });
    markMemo.k = ''; linkSaid = 0;
    paintStrip(true); paintLanes();
    return { sec: sec, n: n };
  }
  function dropAnchor(i) {
    if (!pl) return;
    var key = pl.key;
    withDoc(curId(), function (list) {
      var head = groups(list).filter(function (x) { return x.key === key; })[0];
      var p0 = head && head.parts[0];
      if (!p0 || !Array.isArray(p0.an)) return;
      var srt = p0.an.slice().sort(function (a, b) { return a[0] - b[0]; }), gone = srt[i];
      p0.an = p0.an.filter(function (x) { return x !== gone; });
      if (!p0.an.length) delete p0.an;
    });
    markMemo.k = '';
    paintStrip(true); paintLanes();
  }
  function linkHtml() {
    var g = groups(items(curDoc())).filter(function (x) { return x.key === pl.key; })[0];
    var an = g ? anchorsOf(g).slice().sort(function (a, b) { return a[0] - b[0]; }) : [];
    var miss = linkSaid && Date.now() - linkSaid < 2000;
    var h = tpHtml(false) + trkHtml() + '<span class="nau-brk" aria-hidden="true"></span>' +
      '<span class="nau-link-tag"><i class="fa-solid fa-link" aria-hidden="true"></i>' + T('الربط', 'Linking') + '</span>' +
      '<span class="nau-link-msg" role="status"' + (miss ? ' data-miss="1"' : '') + '>' + (miss
        ? T('لا رسمَ هنا — اضغطْ على خطٍّ مرسوم.', 'No drawing here — press on a drawn line.')
        : T('اسمعْ، ثمّ اضغطِ الرسمَ الذي قيل معه', 'Listen, then press the drawing that was said with it')) + '</span>';
    if (an.length) h += '<span class="nau-ans">';
    an.forEach(function (a, i) {
      h += '<button type="button" class="nau-an nau-num" data-au="an-del" data-i="' + i + '" aria-label="' +
        esc(L('احذفْ مرساة ', 'Remove anchor ') + short(a[0])) + '">' + short(a[0]) + ' <i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
    });
    if (an.length) h += '</span>';
    return h + '<span class="nau-link-acts">' +
      '<button type="button" class="gsf-btn gsf-btn--ghost nau-lb" data-au="link-cancel" aria-label="' +
        esc(L('ألغِ ما ربطتَه الآن وارجعْ إلى التسجيل', 'Undo these links and go back to the recording')) + '">' + T('إلغاء', 'Cancel') + '</button>' +
      '<button type="button" class="gsf-btn nau-lb nau-lb--done" data-au="link-done"><i class="fa-solid fa-check" aria-hidden="true"></i>' + T('تمّ', 'Done') + '</button></span>';
  }
  function playAt(key, sec) {
    var g = groups(items(curDoc())).filter(function (x) { return x.key === key; })[0];
    if (!g) return false;
    var a = engine();
    if (!pl || pl.key !== key) {
      if (!a.paused) a.pause();
      pl = { key: key, parts: g.parts, idx: 0, total: g.ms, title: gTitle(g), on: false, url: '', err: 0 };
      paintRows();
    }
    var t = Math.max(0, (+sec || 0) - LEAD_S), acc = 0, i = 0;
    for (; i < g.parts.length - 1; i++) {
      var len = (g.parts[i].ms || 0) / 1000;
      if (t < acc + len) break;
      acc += len;
    }
    if (pl.url && pl.idx === i && !pl.err && !stale()) {
      try { a.currentTime = t - acc; } catch (e) {}
      pl.at = t - acc;
      paintPlay();
      a.play()['catch'](function () {});
      return true;
    }
    load(i, t - acc).then(function () {
      if (pl && pl.key === key) { paintPlay(); engine().play()['catch'](function () {}); }
    }, function () { if (pl) { pl.err = 1; paintPlay(); } });
    return true;
  }
  function seek(frac) {
    if (!pl) return;
    var t = Math.max(0, Math.min(1, frac)) * (pl.total / 1000);
    var acc = 0;
    for (var i = 0; i < pl.parts.length; i++) {
      var len = (pl.parts[i].ms || 0) / 1000;
      if (t <= acc + len || i === pl.parts.length - 1) {
        var off = t - acc, a = engine(), was = !a.paused;
        if (i === pl.idx && !stale()) { try { a.currentTime = off; } catch (e) {} pl.at = off; paintPlay(true); }
        else load(i, off).then(function () { if (was) engine().play()['catch'](function () {}); });
        return;
      }
      acc += len;
    }
  }
  function jump(d) {
    var tot = total();
    if (!pl || !(tot > 0)) return;
    seek(Math.max(0, Math.min(tot, pos() + d)) / tot);
  }
  function onEnded() {
    if (!pl || pl.fixing) return;
    if (pl.idx < pl.parts.length - 1) {
      load(pl.idx + 1, 0).then(function () { engine().play()['catch'](function () {}); });
      return;
    }
    pl.on = false;
    pl.idx = 0;
    load(0, 0);
    paintPlay();
  }
  function onTime() { if (pl && !pl.fixing) { pl.at = au.currentTime || 0; paintPlay(true); } }
  function stopPlay() {
    if (au) { au.pause(); }
    if (pl && pl.url && /^blob:/.test(pl.url)) { try { URL.revokeObjectURL(pl.url); } catch (e) {} }
    pl = null;
    markStale = true;
    if (linking) { linking = null; if (api.onLink) { try { api.onLink(false); } catch (eL) {} } }
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
      paintSeek(row.querySelector('.nau-player'));
      paintLane(row.querySelector('.nau-player'));
      var pb = row.querySelector('.nau-play > i');
      if (pb) pb.className = 'fa-solid ' + (pl.on ? 'fa-pause' : 'fa-play');
      var er = row.querySelector('.nau-perr');
      if (er) er.hidden = !pl.err;
    }
    if (!light || stripMode === 'play') { paintStrip(); paintMini(); }
    if (stripMode === 'link') {
      var ls = strip(), li = ls && ls.querySelector('.nau-icb--play > i');
      if (ls) { paintSeek(ls); paintLane(ls); }
      if (li) li.className = 'fa-solid ' + (pl && pl.on ? 'fa-pause' : 'fa-play');
    }
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
    d.addEventListener('input', onSeekInput);
    d.addEventListener('change', onSeekChange);
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
    } else if (cut) {
      top += '<p class="nau-livenote">' +
        T('توقّف تسجيلُك حين غادرتَ الصفحة — أكمله أو أنهِه من الشريط أعلى الملاحظة.', 'Your recording stopped when you left the page — continue or finish it from the bar above the note.') + '</p>';
    } else if (importing) {
      top += '<p class="nau-livenote" role="status"><span class="na-opening-spin" aria-hidden="true"></span>' +
        T('يُقرأ الملفّ…', 'Reading the file…') + '</p>';
    } else {
      top += phoneHtml() + srcHtml() +
        '<button type="button" class="gsf-btn gsf-btn--go nau-start" data-au="start">' +
        '<i class="fa-solid fa-microphone" aria-hidden="true"></i>' + T('ابدأ التسجيل', 'Start recording') + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost nau-imp" data-au="import">' +
        '<i class="fa-solid fa-file-import" aria-hidden="true"></i>' + T('أضفْ تسجيلاً من جهازك', 'Add a recording from your device') + '</button>';
    }
    var diag = '';
    if (DIAG) {
      diag = '<button type="button" class="gsf-btn gsf-btn--ghost nau-diag" data-au="diag">' +
        '<i class="fa-solid fa-circle-info" aria-hidden="true"></i>' + T('انسخ تقريرَ آخرِ تسجيل', 'Copy the last recording report') + '</button>';
    }
    dlg.innerHTML = head + top + '<div class="nau-rows" role="list"></div>' + diag + '</div>';
    paintRows();
  }

  function phoneHtml() {
    if (!onPhone()) return '';
    var mk = openMark(curDoc());
    if (mk) {
      return '<div class="gsf-guard nau-ext" role="status"><i class="fa-solid fa-stopwatch" aria-hidden="true"></i><p>' +
        T('بدأتَ تسجيلاً في تطبيقٍ آخر الساعة ' + clockOf(mk) + '. ارسمْ واكتبْ كما تشاء، وحين تنتهي أضفْ ملفَّه من «أضفْ تسجيلاً من جهازك» — نحفظ وقتَ بدئه ليُربط برسمك.',
          'You started a recording in another app at ' + clockOf(mk) + '. Draw and write as you like; when you finish, add its file with “Add a recording from your device” — we keep its start time to link it with your drawing.') +
        '</p><button type="button" class="gsf-btn gsf-btn--ghost" data-au="xunmark" data-t="' + mk + '">' + T('ألغِ', 'Cancel') + '</button></div>';
    }
    return '<div class="gsf-guard nau-warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><p>' +
      '<b>' + T('على الجوّال يتوقّف الميكروفون إن غادرتَ الصفحة أو أطفأتَ الشاشة', 'On a phone the microphone stops if you leave the page or turn the screen off') + '</b> — ' +
      T('النظامُ يمنعه عن المتصفّح في الخلفيّة، فلا يُسجَّل ما يقال حينها. لمحاضرةٍ كاملة: سجّلْ بتطبيق التسجيل في جوّالك واضغطْ هنا حين تبدأ، ثمّ أضفْ ملفَّه بعد المحاضرة — نحفظ وقتَ بدئه ليُربط برسمك.',
        'the system blocks it for browsers in the background, so nothing is recorded meanwhile. For a whole lecture: record with your phone’s recorder app and tap here as you start, then add its file afterwards — we keep its start time to link it with your drawing.') +
      '</p><button type="button" class="gsf-btn gsf-btn--ghost nau-xbtn" data-au="xmark"><i class="fa-solid fa-stopwatch" aria-hidden="true"></i>' +
      T('بدأتُ التسجيلَ في تطبيقٍ آخر', 'I started recording in another app') + '</button></div>';
  }

  function srcHint(v) {
    var R = RC();
    var sup = R && R.support ? R.support() : {};
    var os = sup.os || '';
    if (!sup.system) {
      return (os === 'android' || os === 'ios')
        ? L('على الجوّال والآيباد لا يُلتقط صوتُ الجهاز من المتصفّح — الميكروفونُ وحدَه. ولتسجيلٍ من الجهاز نفسِه: سجّلْه بمسجّل الشاشة ثمّ أضفه من «أضفْ تسجيلاً من جهازك».',
            'On phones and iPads the browser cannot capture device audio — the microphone only. To keep device audio: record it with the screen recorder, then add it with “Add a recording from your device”.')
        : '';
    }
    if (!sup.systemLikely) {
      return L('متصفّحك لا يشارك صوتَ الجهاز — استعملْ كروم أو إيدج.', 'Your browser cannot share device audio — use Chrome or Edge.');
    }
    if (v === 'mic') return '';
    var tail = v === 'both' ? L(' والميكروفونُ يُسجَّل معه.', ' The microphone is recorded with it.') : '';
    if (os === 'mac') {
      return L('ستفتح نافذةُ المشاركة: اخترْ تبويباً وفعّلْ «مشاركة صوت التبويب». وصوتُ الجهاز كلِّه يحتاج ماك 14.2 وكروم 141 فأحدث.',
               'A sharing window opens: pick a tab and turn on “Share tab audio”. Whole-device audio needs macOS 14.2 and Chrome 141 or newer.') + tail;
    }
    if (os === 'linux') {
      return L('ستفتح نافذةُ المشاركة: على لينكس يُلتقط صوتُ تبويبٍ واحد — اخترْه وفعّلْ «مشاركة صوت التبويب».',
               'A sharing window opens: on Linux one tab’s audio is captured — pick it and turn on “Share tab audio”.') + tail;
    }
    return L('ستفتح نافذةُ المشاركة: اخترْ «الشاشة بأكملها» وفعّلْ «مشاركة صوت النظام» — أو اخترْ تبويباً وفعّلْ «مشاركة صوت التبويب».',
             'A sharing window opens: pick “Entire screen” and turn on “Share system audio” — or pick a tab and turn on “Share tab audio”.') + tail;
  }

  function srcHtml() {
    var R = RC();
    var sup = R && R.support ? R.support() : {};
    var v = pickedSrc();
    var hint = srcHint(v);
    if (!sup.system) {
      return hint ? '<p class="nau-hint"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>' + esc(hint) + '</span></p>' : '';
    }
    var off = !sup.systemLikely;
    var chip = function (k, icon, ar, en) {
      var on = v === k;
      return '<button type="button" class="gsf-chip' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-au="src" data-v="' + k + '"' +
        (off && k !== 'mic' ? ' disabled' : '') + '><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' + T(ar, en) + '</button>';
    };
    return '<div class="nau-src"><span class="nau-lab" id="nau-src-l">' + T('ماذا نسجّل؟', 'What should we record?') + '</span>' +
      '<div class="gsf-chips" role="radiogroup" aria-labelledby="nau-src-l">' +
      chip('mic', 'fa-microphone', 'الميكروفون', 'Microphone') +
      chip('system', 'fa-display', 'صوتُ الجهاز', 'Device audio') +
      chip('both', 'fa-sliders', 'كلاهما', 'Both') + '</div>' +
      (hint ? '<p class="nau-hint"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>' + esc(hint) + '</span></p>' : '') +
      '</div>';
  }

  var importing = false;
  function extOf(name) {
    var m = /\.([a-z0-9]{2,4})$/i.exec(String(name || ''));
    return m ? m[1].toLowerCase() : '';
  }
  function judgeMime(file) {
    var f = F();
    var norm = (f && f.normMime) ? f.normMime : function (m) {
      var v = String(m || '').split(';')[0].trim().toLowerCase();
      return /^audio\/|^video\//.test(v) ? v : '';
    };
    return norm(file.type) || norm(EXT_MIME[extOf(file.name)]) || '';
  }
  function durationOf(blob) {
    return new Promise(function (ok) {
      var a = document.createElement('audio');
      var url = URL.createObjectURL(blob);
      var done = false;
      var fin = function (sec) {
        if (done) return;
        done = true;
        try { a.removeAttribute('src'); a.load(); } catch (e) {}
        try { URL.revokeObjectURL(url); } catch (e) {}
        ok(sec > 0 && isFinite(sec) ? Math.round(sec * 1000) : 0);
      };
      a.preload = 'metadata';
      a.muted = true;
      a.addEventListener('loadedmetadata', function () {
        if (isFinite(a.duration) && a.duration > 0) { fin(a.duration); return; }
        a.addEventListener('durationchange', function () {
          if (isFinite(a.duration) && a.duration > 0) fin(a.duration);
        });
        try { a.currentTime = 1e7; } catch (e) { fin(0); }
      });
      a.addEventListener('error', function () { fin(0); });
      setTimeout(function () { fin(0); }, 10000);
      a.src = url;
    });
  }
  function pickImport() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = EXT_ACCEPT;
    inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (inp.parentNode) inp.parentNode.removeChild(inp);
      if (f) importFile(f);
    });
    inp.click();
  }
  function importFile(file, nid0, how0) {
    var nid = nid0 || curId();
    var quiet = !!(how0 && how0.quiet);
    if (!nid || !file) return Promise.resolve(null);
    var mime = judgeMime(file);
    if (quiet && (!mime || file.size > EXT_MAX)) return Promise.reject(new Error(!mime ? 'badfile' : 'toobig'));
    if (!mime) return failStart('badfile').then(function () { return null; });
    if (file.size > EXT_MAX) return failStart('toobig').then(function () { return null; });
    lastErr = '';
    importing = true;
    if (dlg && dlg.open) render();
    var base = String(file.name || '').replace(/\.[a-z0-9]{2,4}$/i, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    return durationOf(file).then(function (ms) {
      var it = { i: uid('aud_'), n: base || 'recording', t: Date.now(), s0: 0, ms: ms, b: file.size,
                 m: mime, lo: 1, x: 1 };
      var mk = nid === curId() ? openMark(curDoc()) : 0;
      var lm = file.lastModified || 0;
      var age = Date.now() - lm;
      var fs = (lm && ms && age > 3000 && age < FILE_AGE) ? lm - ms : 0;
      if (base) it.nm = base;
      var D = PD();
      var put = D && D.put ? D.put(it.i, file, { name: it.n }) : Promise.resolve(false);
      return put.then(function (ok) {
        if (ok) here[it.i] = file.size; else { mem[it.i] = file; it.lo = 0; }
        return withDoc(nid, function (list) { list.push(it); });
      }).then(function (wrote) {
        importing = false;
        if (!wrote) {
          mem[it.i] = file;
          if (quiet) throw new Error('readfail');
          lastErr = 'readfail'; if (dlg && dlg.open) render(); return null;
        }
        nidOf[it.i] = nid;
        if (!quiet) askSave(it, nid, { imp: 1, mk: mk, fs: fs });
        return it;
      });
    })['catch'](function (e) {
      importing = false;
      if (quiet) throw (e && e.message ? e : new Error('readfail'));
      return failStart('readfail').then(function () { return null; });
    });
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
    if (w === 'gd') return '<i class="fa-brands fa-google-drive nau-gd" aria-hidden="true"></i>' + T('في درايفك', 'In your Drive');
    if (w === 'gdup') return '<i class="fa-brands fa-google-drive nau-gd" aria-hidden="true"></i>' + T('يُرفع إلى درايفك…', 'Uploading to your Drive…');
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
        '<span class="nau-trk"><input class="nau-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="' + esc(L('موضعُ التشغيل', 'Playback position')) + '"><span class="nau-lane" hidden></span></span>' +
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
    if (a === 'mark') { goMark(b); return; }
    if (a === 'link-on') { setLink(true); return; }
    if (a === 'link-done') { setLink(false); return; }
    if (a === 'link-cancel') { cancelLink(); return; }
    if (a === 'an-del') { dropAnchor(+b.getAttribute('data-i')); return; }
    var g = key ? groupByKey(key) : null;
    if (a === 'start') { start(); return; }
    if (a === 'src') {
      setSrc(b.getAttribute('data-v'));
      var sh = dlg && dlg.querySelector('.nau-src, .nau-hint');
      if (sh) { var tmp = document.createElement('div'); tmp.innerHTML = srcHtml(); sh.replaceWith(tmp.firstChild); }
      var f0 = dlg && dlg.querySelector('.nau-src [aria-checked="true"]');
      if (f0) try { f0.focus({ preventScroll: true }); } catch (e) {}
      return;
    }
    if (a === 'import') { pickImport(); return; }
    if (a === 'xmark') { markExt(); return; }
    if (a === 'xunmark') { unmarkExt(Number(b.getAttribute('data-t')) || 0); return; }
    if (a === 'when') { if (ask && ask.when) { ask.when.pick = b.getAttribute('data-v'); renderAsk(); } return; }
    if (a === 'diag') {
      var txt = '';
      try { txt = localStorage.getItem(LOG_LS) || ''; } catch (e) {}
      var done = function () { b.lastChild.textContent = L('نُسخ — الصقه لنا', 'Copied — paste it to us'); };
      if (navigator.clipboard && txt) navigator.clipboard.writeText(txt).then(done, function () {});
      return;
    }
    if (a === 'cut-go') { cutGo(); return; }
    if (a === 'cut-end') { cutEnd(); return; }
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
    if (a === 'skip') { jump(+b.getAttribute('data-d') || 0); return; }
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

  /*@3.NOAJ3.7*/
  function eraseRecs(list) {
    var byNote = {}, gone = [], cloudIds = [], keys = {};
    (list || []).forEach(function (x) { if (x && x.nid && x.i) (byNote[x.nid] = byNote[x.nid] || []).push(x.i); });
    return Promise.all(Object.keys(byNote).map(function (nid) {
      var want = byNote[nid];
      return withDoc(nid, function (arr) {
        var ks = {};
        arr.forEach(function (x) { if (x && want.indexOf(x.i) >= 0) ks[x.g || x.i] = 1; });
        for (var k = arr.length - 1; k >= 0; k--) {
          var x = arr[k];
          if (!x || !ks[x.g || x.i]) continue;
          keys[x.g || x.i] = 1; gone.push(x.i);
          if (x.aup) cloudIds.push(x.i);
          arr.splice(k, 1);
        }
      });
    })).then(function () {
      if (pl && keys[pl.key]) stopPlay();
      var D = PD(), f = F();
      gone.forEach(function (id) { delete mem[id]; delete here[id]; if (D && D.drop) D.drop(id); });
      return Promise.all(cloudIds.map(function (id) { return f && f.remove ? f.remove(id)['catch'](function () {}) : null; }));
    }).then(function () {
      if (curDoc()) paintRows();
      return { n: Object.keys(keys).length, parts: gone.length };
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

  function askSave(it, nid, how) {
    var list = nid === curId() ? items(curDoc()) : [it];
    var grp = it.g ? list.filter(function (x) { return x.g === it.g; }) : [it];
    if (!grp.length) grp = [it];
    ask = { it: it, nid: nid, parts: grp, dest: 'here', confirm: false, imp: !!(how && how.imp),
            name: it.nm || ((noteTitle() || L('تسجيل', 'Recording')) + ' — ' + when(grp[0].s0 || it.t)), cloud: null,
            when: (how && (how.mk || how.fs)) ? { mk: how.mk || 0, fs: how.fs || 0, pick: how.mk ? 'mk' : 'fs' } : null };
    var d = mkDialog('nau-dlg--save', 'nau-st');
    d._ask = ask;
    renderAsk();
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
    var inp = d.querySelector('.nau-name');
    if (inp) { try { inp.focus(); inp.select(); } catch (e) {} }
    cloudState().then(function (s) { if (ask && dlg === d) { ask.cloud = s; renderAsk(true); } });
    if (gdOn()) GDv().then(function (GD) { GD.warm(); }, function () {});
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
      return '<button type="button" class="nau-opt' + (v === 'gd' ? ' nau-opt--gd' : '') + '" data-au="dest" data-v="' + v + '" aria-pressed="' + on + '"' + (off ? ' disabled' : '') + '>' +
        '<i class="' + (icon.indexOf('fa-brands') === 0 ? icon : 'fa-solid ' + icon) + '" aria-hidden="true"></i><span><b>' + T(ar, en) + '</b><span>' + T(subAr, subEn) + '</span></span></button>';
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
        whenHtml() +
        (shut0 ? '' :
        '<p class="nau-q">' + T('أين نحفظ نسخةً تفتحها على أجهزتك؟', 'Where should we keep a copy you can open on your devices?') + '</p>' +
        '<div class="nau-opts">' +
        (gdOn() ? opt('gd', 'fa-brands fa-google-drive', 'في درايفي', 'In my Drive',
            'الخيارُ الأفضل لك: يبقى دائماً بجودته كاملة، بلا ضغطٍ ولا حذفٍ حين تمتلئ مساحتُنا — في مجلّد Digital Garden.',
            'The best choice for you: it stays for good at full quality, never squeezed or deleted when our space fills — in the Digital Garden folder.', false) : '') +
        opt('us', 'fa-cloud', 'عندنا', 'With us', usSub[0], usSub[1], usOff) +
        opt('here', 'fa-mobile-screen', 'هذا الجهاز فقط', 'This device only',
            'لا يخرج من جهازك، ولا تجده على جهازك الآخر.', 'It never leaves your device, and you will not find it on your other device.', false) +
        '</div>');
    }
    dlg.innerHTML = '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' + esc(L('إغلاق', 'Close')) +
      '" data-ar-title="إغلاق" data-en-title="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
      '<div class="gsf-body"><div class="gsf-head"><h2 class="gsf-title" id="nau-st">' +
      (ask.imp ? T('أُضيف التسجيل', 'Recording added') : T('انتهى التسجيل', 'Recording finished')) + '</h2></div>' +
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

  function whenHtml() {
    var w = ask && ask.imp ? ask.when : null;
    if (!w) return '';
    var chip = function (k, ar, en) {
      var on = w.pick === k;
      return '<button type="button" class="gsf-chip' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on +
        '" data-au="when" data-v="' + k + '">' + T(ar, en) + '</button>';
    };
    return '<div class="nau-src nau-when"><span class="nau-lab" id="nau-when-l">' +
      T('متى بدأ هذا التسجيل؟ ليُربط برسمك', 'When did this recording start? To link it with your drawing') + '</span>' +
      '<div class="gsf-chips" role="radiogroup" aria-labelledby="nau-when-l">' +
      (w.mk ? chip('mk', 'حين ضغطتَ «بدأتُ» · ' + clockOf(w.mk), 'When you tapped “I started” · ' + clockOf(w.mk)) : '') +
      (w.fs ? chip('fs', 'من وقت الملفّ · ' + clockOf(w.fs), 'From the file’s time · ' + clockOf(w.fs)) : '') +
      chip('no', 'لا أعرف', 'I don’t know') + '</div></div>';
  }
  function startOf(w) {
    if (!w) return null;
    return w.pick === 'mk' ? w.mk : (w.pick === 'fs' ? w.fs : 0);
  }

  function pickDest(v) { if (ask) { ask.dest = v === 'us' ? 'us' : (v === 'gd' ? 'gd' : 'here'); renderAsk(); } }

  function applyAsk(dest) {
    var a = ask;
    ask = null;
    if (!a) return Promise.resolve();
    var inp = dlg && dlg.querySelector('.nau-name');
    var name = ((inp ? inp.value : a.name) || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    var ids = a.parts.map(function (p) { return p.i; });
    var s0 = startOf(a.when);
    return withDoc(a.nid, function (list, doc) {
      list.forEach(function (x) {
        if (ids.indexOf(x.i) < 0) return;
        if (x.i === a.it.i && name) x.nm = name;
        if (x.i === a.it.i && s0 !== null) x.s0 = s0;
        if (dest === 'us') x.vow = 'us';
      });
      if (a.when && a.when.pick === 'mk' && doc) {
        var m = xmarks(doc).filter(function (t) { return t !== a.when.mk; });
        if (m.length) doc.xs = m; else delete doc.xs;
      }
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
    if (dest === 'gd') {
      var a = ask, nm0 = dlg && dlg.querySelector('.nau-name');
      var name = ((nm0 ? nm0.value : a.name) || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      var tokP = window.GardenDrive ? window.GardenDrive.token(true) : GDv().then(function (GD) { return GD.token(true); });
      var p0 = applyAsk('here');
      shut();
      return Promise.all([p0, tokP]).then(function () {
        var src = a.nid === curId() ? items(curDoc()) : a.parts;
        var ids = a.parts.map(function (x) { return x.i; });
        return toDrive(src.filter(function (x) { return ids.indexOf(x.i) >= 0; }), a.nid, name);
      })['catch'](function (e) {
        paintRows();
        var GD = window.GardenDrive;
        var why = GD ? GD.reason(e) : T('تعذّر الحفظُ في درايف.', 'Could not save to Drive.');
        var b = A();
        if (b && b.toast) b.toast(why);
      });
    }
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
    if (s && !s._nau) {
      s._nau = 1;
      s.addEventListener('click', onStrip);
      s.addEventListener('input', onSeekInput);
      s.addEventListener('change', onSeekChange);
    }
    paintMic();
    refreshHere().then(checkDraft);
  }

  window.addEventListener('garden:noteDoc', onNoteDoc);
  document.addEventListener('garden:languageChanged', function () {
    var s = strip();
    if (s && stripMode) paintStrip(true);
  });
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () {
    if (live) note('vis', document.visibilityState + ' rec=' + ((live.r.rec && live.r.rec.state) || '-'));
    if (document.visibilityState === 'hidden') { away(); flush(); }
    else { home(); checkAlive(); }
  });
  window.addEventListener('pageshow', checkAlive);
  document.addEventListener('freeze', function () { if (live) note('freeze'); });
  document.addEventListener('resume', function () { if (live) note('resume'); });
  window.addEventListener('beforeunload', function (e) {
    if (!live) return;
    flush();
    e.preventDefault();
    e.returnValue = '';
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  var api = window.GardenNotesAudio = {
    start: start,
    stop: stop,
    hold: hold,
    discard: discard,
    open: openList,
    play: play,
    seek: seek,
    momentAt: momentAt,
    playAt: playAt,
    setMarks: setMarks,
    linking: linkOn,
    link: setLink,
    anchor: anchor,
    refreshMarks: refreshMarks,
    marks: function () { return pl ? marksOf(pl.key).list.map(function (c) { return { sec: c.sec, n: c.n, lbl: c.m.lbl || '' }; }) : []; },
    state: function () {
      return { live: !!live, paused: !!(live && live.r.paused()), draft: draft ? draft.ptr : null,
               playing: !!(pl && pl.on), mode: mode(), at: pl ? Math.round(pos() * 10) / 10 : 0 };
    },
    groups: function () { return groups(items(curDoc())); },
    importFile: importFile,
    maxBytes: EXT_MAX,
    isMedia: function (f) { return !!judgeMime(f); },
    source: pickedSrc,
    checkDraft: checkDraft,
    local: local,
    eraseRecs: eraseRecs,
    keepCopy: function (it, nid, to) {
      if (!it || !nid) return Promise.resolve();
      if (to === 'gd') return toDrive([it], nid)['catch'](function () {});
      enqueue(it, nid);
      return Promise.resolve();
    },
    refresh: refreshHere
  };
})();
