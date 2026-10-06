/*@3.NOSJ2.1*/
;(function () {
  'use strict';

  /*@3.NOSJ2.9*/
  var PUSH_IDLE_MS = 8000;
  var PUSH_MAX_WAIT_MS = 30000;
  var PUSH_LAZY_MS = 60000;
  var QUOTA_LS = '__notesQuotaMax';
  /*@3.NOSJ2.2*/
  var PENDING_LS = '__notesPending';
  /*@3.NOSJ2.16*/
  var PARTS_LS = '__notesParts';

  var timers = {};
  var firstAt = {};
  var inflight = {};
  var lastQuota = null;
  var reconciling = null;

  function S() { return window.GardenNotesStore || null; }
  function P() { return window.GardenNotesParts || null; }

  function partsMode() {
    if (!P()) return false;
    var v = null;
    try { v = localStorage.getItem(PARTS_LS); } catch (e) {}
    return v === '1';
  }
  function setPartsMode(on) { try { localStorage.setItem(PARTS_LS, on ? '1' : '0'); } catch (e) {} }
  function baseGet(id) { return (S() && S().meta) ? S().meta('sb:' + id, null) : Promise.resolve(null); }
  function baseSet(id, b) { return (S() && S().setMeta) ? S().setMeta('sb:' + id, b) : Promise.resolve(false); }
  function baseOfDoc(doc, t) {
    if (!P()) return null;
    var d = doc;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { return null; } }
    return { t: Number(t) || 0, h: P().hashes(P().split(d)) };
  }

  function endpoint() {
    var e = window.GardenEndpoints;
    return (e && e.sync) || '';
  }

  function vaultId() {
    var G = window.GardenSync;
    if (!G || !G.vaultId) return Promise.resolve(null);
    try { return Promise.resolve(G.vaultId()).catch(function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }

  function headers(id, extra) {
    var G = window.GardenSync;
    var h = Object.assign({}, extra || {});
    if (G && G.vaultHeaders) { try { return G.vaultHeaders(id, h); } catch (e) {} }
    return h;
  }

  function base(id) { return endpoint() + '/v1/notes/' + encodeURIComponent(id); }

  function readPending() {
    try {
      var v = JSON.parse(localStorage.getItem(PENDING_LS) || '{}');
      return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
    } catch (e) { return {}; }
  }
  function writePending(o) {
    try {
      if (!o || !Object.keys(o).length) localStorage.removeItem(PENDING_LS);
      else localStorage.setItem(PENDING_LS, JSON.stringify(o));
    } catch (e) {}
  }
  function markPending(id, why) {
    var o = readPending(); o[id] = why || 1; writePending(o);
  }
  function clearPending(id) {
    var o = readPending();
    if (o[id] != null) { delete o[id]; writePending(o); }
  }

  function quotaEvent(code, info) {
    try {
      window.dispatchEvent(new CustomEvent('garden:notesQuota', {
        detail: Object.assign({ code: code }, info || {})
      }));
    } catch (e) {}
  }

  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
    catch (e) {}
  }

  function isQuota(status, body) {
    return status === 413 && body && body.error;
  }
  /*@3.NOSJ2.10*/
  function knownMax() {
    var m = (lastQuota && lastQuota.max > 0) ? Number(lastQuota.max) : 0;
    if (!m) { try { m = Number(localStorage.getItem(QUOTA_LS)) || 0; } catch (e) { m = 0; } }
    return m;
  }
  function rememberMax(m) {
    if (!(m > 0)) return;
    try { localStorage.setItem(QUOTA_LS, String(m)); } catch (e) {}
  }

  function req(method, url, body) {
    return fetch(url, {
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return null; })
        .then(function (j) { return { status: r.status, ok: r.ok, body: j }; });
    });
  }

  function authed(method, url, id, body) {
    return fetch(url, {
      method: method,
      headers: headers(id, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return null; })
        .then(function (j) { return { status: r.status, ok: r.ok, body: j }; });
    });
  }

  /*@3.NOSJ2.11*/
  var again = {};
  function push(noteId) {
    if (!S() || !endpoint()) {
      emit('garden:notesPushFailed', { id: noteId, reason: 'no-endpoint', local: true });
      return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    }
    if (inflight[noteId]) { again[noteId] = 1; return inflight[noteId]; }

    var p = vaultId().then(function (vid) {
      if (!vid) {
        emit('garden:notesPushFailed', { id: noteId, reason: 'no-vault', local: true });
        return { ok: false, reason: 'no-vault' };
      }
      var read = S().getRaw ? S().getRaw(noteId) : S().getDoc(noteId);
      return read.then(function (row) {
        if (!row) return { ok: false, reason: 'no-doc' };
        var raw = (typeof row.raw === 'string') ? row.raw : ((typeof row.doc === 'string') ? row.doc : JSON.stringify(row.doc));
        /*@3.NOSJ2.17*/
        var viaParts = partsMode() ? pushParts(vid, noteId, row, raw) : Promise.resolve(null);
        return viaParts.then(function (pr) { return pr || pushWhole(vid, noteId, row, raw); });
      });
    }).catch(function (e) {
      markPending(noteId, 'error');
      emit('garden:notesPushFailed', { id: noteId, reason: 'error' });
      return { ok: false, reason: String((e && e.message) || e) };
    }).then(function (out) {
      delete inflight[noteId];
      if (again[noteId]) { delete again[noteId]; push(noteId); }
      return out;
    });

    inflight[noteId] = p;
    return p;
  }

  function quotaFail(noteId, body) {
    markPending(noteId, body.error);
    lastQuota = Object.assign({}, lastQuota || {}, body);
    if (body.error === 'note_too_large') rememberMax(body.max);
    quotaEvent(body.error, { id: noteId, bytes: body.bytes, max: body.max, part: body.k });
    emit('garden:notesPushFailed', { id: noteId, reason: body.error, quota: true });
    return { ok: false, reason: body.error, quota: true };
  }

  /*@3.NOSJ2.18*/
  function pushParts(vid, noteId, row, raw) {
    var doc;
    try { doc = JSON.parse(raw); } catch (e) { return Promise.resolve(null); }
    var parts = P().split(doc);
    var maxPart = (lastQuota && lastQuota.max_part) || P().MAX_PART;
    var big = Object.keys(parts).filter(function (k) { return P().byteLen(parts[k]) > maxPart; });
    if (big.length) return Promise.resolve(quotaFail(noteId, { error: 'part_too_large', k: big[0], bytes: P().byteLen(parts[big[0]]), max: maxPart }));
    return baseGet(noteId).then(function (b) {
      var d = P().diff(b && b.h, parts);
      var cs = P().chunks(d);
      var acc = { rejected: [], others: false, t: b ? b.t : 0, sent: 0 };
      var i = 0;
      function next() {
        if (i >= cs.length) return Promise.resolve(null);
        var c = cs[i++];
        if (!Object.keys(c.set).length && !c.del.length) return next();
        acc.sent++;
        return authed('POST', base(vid) + '/' + encodeURIComponent(noteId) + '/parts', vid,
                      { t: row.t, base: b ? b.t : null, set: c.set, del: c.del })
          .then(function (r) {
            if (r.status === 404 && acc.sent === 1) { setPartsMode(false); return { fallback: true }; }
            if (r.status === 413 && r.body && r.body.error) return { quota: r.body };
            if (!r.ok || !r.body) return { http: r.status };
            acc.rejected = acc.rejected.concat(r.body.rejected || []);
            acc.others = acc.others || !!r.body.others;
            acc.t = Number(r.body.t) || acc.t;
            if (r.body.note_bytes != null) lastQuota = Object.assign({}, lastQuota || {}, { note_bytes: r.body.note_bytes });
            return next();
          });
      }
      return next().then(function (bad) {
        if (bad && bad.fallback) return null;
        if (bad && bad.quota) return quotaFail(noteId, bad.quota);
        if (bad && bad.http) {
          markPending(noteId, 'http-' + bad.http);
          emit('garden:notesPushFailed', { id: noteId, reason: 'http-' + bad.http });
          return { ok: false, reason: 'http-' + bad.http };
        }
        clearPending(noteId);
        var nh = P().hashes(parts);
        acc.rejected.forEach(function (k) { if (b && b.h && b.h[k]) nh[k] = b.h[k]; else delete nh[k]; });
        var mixed = acc.rejected.length > 0 || acc.others;
        var nb = { t: mixed ? (b ? b.t : 0) : Math.max(acc.t, b ? b.t : 0), h: nh };
        return baseSet(noteId, nb).then(function () {
          emit('garden:notesPushed', { id: noteId, t: row.t, parts: acc.sent });
          if (!mixed) return S().markClean(noteId, row.t).then(function () { return { ok: true, applied: 1, t: row.t, parts: acc.sent }; });
          return pull(noteId).then(function (pr) { return { ok: true, applied: 1, t: row.t, merged: !!(pr && pr.ok), parts: acc.sent }; });
        });
      });
    });
  }

  function pushWhole(vid, noteId, row, raw) {
    var cap = knownMax(), bytes = row.bytes || 0;
    if (cap > 0 && bytes > cap) {
      markPending(noteId, 'note_too_large');
      quotaEvent('note_too_large', { id: noteId, bytes: bytes, max: cap });
      emit('garden:notesPushFailed', { id: noteId, reason: 'note_too_large', quota: true, skipped: true });
      return { ok: false, reason: 'note_too_large', quota: true, skipped: true };
    }
    return authed('POST', base(vid) + '/' + encodeURIComponent(noteId), vid,
                  { doc: raw, t: row.t })
      .then(function (r) {
        /*@3.NOSJ2.3*/
        if (isQuota(r.status, r.body)) {
          markPending(noteId, r.body.error);
          lastQuota = Object.assign({}, lastQuota || {}, r.body);
          rememberMax(r.body.max);
          quotaEvent(r.body.error, { id: noteId, bytes: r.body.bytes, max: r.body.max });
          emit('garden:notesPushFailed', { id: noteId, reason: r.body.error, quota: true });
          return { ok: false, reason: r.body.error, quota: true };
        }
        if (!r.ok) {
          markPending(noteId, 'http-' + r.status);
          emit('garden:notesPushFailed', { id: noteId, reason: 'http-' + r.status });
          return { ok: false, reason: 'http-' + r.status };
        }
        clearPending(noteId);
        /*@3.NOSJ2.21*/
        if (r.body && r.body.note_bytes != null) lastQuota = Object.assign({}, lastQuota || {}, r.body);
        /*@3.NOSJ2.12*/
        if (r.body && r.body.applied === 0) {
          return pull(noteId).then(function (pr) { return { ok: false, reason: 'stale', pulled: !!(pr && pr.ok) }; });
        }
        return S().markClean(noteId, row.t).then(function () {
          var nb = baseOfDoc(raw, row.t);
          return nb ? baseSet(noteId, nb) : null;
        }).then(function () {
          emit('garden:notesPushed', { id: noteId, t: row.t });
          return { ok: true, applied: r.body && r.body.applied, t: row.t };
        });
      });
  }

  function pull(noteId) {
    if (!S() || !endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    return vaultId().then(function (vid) {
      if (!vid) return { ok: false, reason: 'no-vault' };
      if (!partsMode()) return pullWhole(vid, noteId);
      return baseGet(noteId).then(function (b) {
        if (!b || !b.h) return pullWhole(vid, noteId);
        return pullParts(vid, noteId, b).then(function (r) { return r || pullWhole(vid, noteId); });
      });
    }).catch(function (e) { return { ok: false, reason: String((e && e.message) || e) }; });
  }

  /*@3.NOSJ2.19*/
  function pullParts(vid, noteId, b) {
    return authed('GET', base(vid) + '/' + encodeURIComponent(noteId) + '/parts?since=' + encodeURIComponent(b.t || 0), vid)
      .then(function (r) {
        if (r.status === 404) return { ok: false, reason: 'not-found' };
        if (!r.ok || !r.body || r.body.full || !r.body.parts) return null;
        var rp = r.body.parts, ts = r.body.ts || {}, rt = Number(r.body.t) || 0;
        var read = S().getRaw ? S().getRaw(noteId) : Promise.resolve(null);
        return read.catch(function () { return null; }).then(function (row) {
          var local = {};
          if (row && row.raw) { try { local = P().split(JSON.parse(row.raw)); } catch (e) { return null; } }
          var mine = {};
          if (row && row.dirty) {
            var dl = P().diff(b.h, local);
            Object.keys(dl.set).forEach(function (k) { mine[k] = 1; });
            dl.del.forEach(function (k) { mine[k] = 1; });
          }
          var merged = Object.assign({}, local), lost = false, moved = false, lt = row ? row.t : 0;
          var same = function (k) { return (rp[k] == null ? null : rp[k]) === (local[k] == null ? null : local[k]); };
          Object.keys(rp).forEach(function (k) {
            if (same(k)) return;
            if (mine[k]) {
              if ((ts[k] || rt) > lt) lost = true;
              else return;
            }
            moved = true;
            if (rp[k] == null) delete merged[k]; else merged[k] = rp[k];
          });
          var still = Object.keys(mine).some(function (k) { return !(k in rp) || (!same(k) && !((ts[k] || rt) > lt)); });
          var nb = { t: rt, h: Object.assign({}, b.h) };
          Object.keys(rp).forEach(function (k) { if (rp[k] == null) delete nb.h[k]; else nb.h[k] = P().hash(rp[k]); });
          if (lost) emit('garden:notesConflict', { id: noteId, raw: row.raw, t: row.t, remoteT: rt });
          if (!moved && row) {
            return baseSet(noteId, nb).then(function () {
              return still ? null : S().markClean(noteId, row.t);
            }).then(function () { return { ok: true, t: row.t, none: true }; });
          }
          var doc = P().assemble(merged);
          var t = still ? row.t : Math.max(rt, row ? row.t : 0);
          var again2 = S().getRaw ? S().getRaw(noteId) : Promise.resolve(row);
          return again2.then(function (now) {
            if (row && now && Number(now.t) !== Number(row.t)) return { ok: false, reason: 'busy' };
            return S().putDoc(noteId, doc, t, { clean: !still }).then(function () {
              return baseSet(noteId, nb);
            }).then(function () {
              emit('garden:notesPulled', { id: noteId, t: t, parts: Object.keys(rp).length });
              return { ok: true, t: t, merged: true };
            });
          });
        });
      });
  }

  function pullWhole(vid, noteId) {
    return authed('GET', base(vid) + '/' + encodeURIComponent(noteId), vid)
      .then(function (r) {
        if (r.status === 404) return { ok: false, reason: 'not-found' };
        if (!r.ok || !r.body) return { ok: false, reason: 'http-' + r.status };
        var read = S().getRaw ? S().getRaw(noteId) : Promise.resolve(null);
        return read.catch(function () { return null; }).then(function (row) {
          /*@3.NOSJ2.13*/
          var rem = (typeof r.body.doc === 'string') ? r.body.doc : JSON.stringify(r.body.doc);
          if (row && row.dirty && row.raw && row.raw !== rem) {
            emit('garden:notesConflict', { id: noteId, raw: row.raw, t: row.t, remoteT: r.body.t });
          }
          return S().putDoc(noteId, r.body.doc, r.body.t, { clean: true });
        }).then(function () {
          var nb = baseOfDoc(r.body.doc, r.body.t);
          return nb ? baseSet(noteId, nb) : null;
        }).then(function () {
          emit('garden:notesPulled', { id: noteId, t: r.body.t });
          return { ok: true, t: r.body.t };
        });
      });
  }

  /*@3.NOSJ2.15*/
  function filesOf(ids) {
    var st = S(), out = [];
    if (!st || !st.getDoc || !ids.length) return Promise.resolve(out);
    return Promise.all(ids.map(function (id) {
      return st.getDoc(id).then(function (row) {
        var d = row && row.doc;
        if (!d) return;
        if (d.pdf && d.pdf.h) out.push({ h: d.pdf.h, k: 'pdf', note: id });
        (d.aud || []).forEach(function (a) { if (a && a.i) out.push({ h: a.i, k: 'aud', note: id, up: !!a.aup }); });
      }, function () {});
    })).then(function () { return out; });
  }

  function remove(noteId) {
    if (!S()) return Promise.resolve({ ok: false });
    var files = [];
    return filesOf([noteId]).then(function (fs) { files = fs; baseSet(noteId, null); return S().delDoc(noteId); }).then(function () {
      emit('garden:notesErased', { ids: [noteId], files: files, own: true });
      if (!endpoint()) return { ok: true, remote: false };
      return vaultId().then(function (vid) {
        if (!vid) return { ok: true, remote: false };
        return authed('DELETE', base(vid) + '/' + encodeURIComponent(noteId), vid)
          .then(function (r) {
            if (r.body && r.body.note_bytes != null) lastQuota = Object.assign({}, lastQuota || {}, r.body);
            clearPending(noteId);
            return { ok: true, remote: r.ok };
          })
          .catch(function () { return { ok: true, remote: false }; });
      });
    });
  }

  function schedule(noteId, lazy) {
    var now = Date.now();
    if (firstAt[noteId] == null) firstAt[noteId] = now;
    var wait = lazy ? PUSH_LAZY_MS : Math.min(PUSH_IDLE_MS, Math.max(0, firstAt[noteId] + PUSH_MAX_WAIT_MS - now));
    if (timers[noteId]) clearTimeout(timers[noteId]);
    timers[noteId] = setTimeout(function () {
      delete timers[noteId];
      delete firstAt[noteId];
      push(noteId);
    }, wait);
  }

  function flush() {
    var ids = Object.keys(timers);
    ids.forEach(function (id) {
      clearTimeout(timers[id]);
      delete timers[id];
      delete firstAt[id];
    });
    return Promise.all(ids.map(push));
  }

  /*@3.NOSJ2.6*/
  function chunked(ids, fn) {
    var i = 0;
    function step(acc) {
      if (i >= ids.length) return Promise.resolve(acc);
      var batch = ids.slice(i, i + 5);
      i += 5;
      return Promise.all(batch.map(fn)).then(function (rs) {
        return step(acc.concat(rs));
      });
    }
    return step([]);
  }

  function reconcile(opts) {
    if (reconciling) return reconciling;
    var o = opts || {};
    var st = S();
    if (!st || !endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });

    reconciling = vaultId().then(function (vid) {
      if (!vid) return { ok: false, reason: 'no-vault' };
      return authed('GET', base(vid), vid).then(function (r) {
        if (!r.ok || !r.body) return { ok: false, reason: 'http-' + r.status };
        lastQuota = r.body;
        if (P()) setPartsMode(r.body.parts === 1);
        var remote = r.body.docs || {};
        var live = Array.isArray(o.liveIds) ? o.liveIds : null;
        var tombs = (o.tombs && typeof o.tombs === 'object') ? o.tombs : {};
        var authority = !!o.authority;

        /*@3.NOSJ2.4*/
        return st.manifest().then(function (local) {
          var toPull = [], toPush = [], toDropLocal = [], toDropRemote = [], maybe = [];

          function dead(id) {
            return tombs[id] != null && (!live || live.indexOf(id) === -1);
          }

          Object.keys(remote).forEach(function (id) {
            var l = local[id];
            if (dead(id)) { if (authority) toDropRemote.push(id); return; }
            if (!l) { toPull.push(id); return; }
            /*@3.NOSJ2.20*/
            if (l.dirty) { if (l.t >= remote[id].t) toPush.push(id); else if (partsMode()) maybe.push(id); else toPull.push(id); return; }
            if (remote[id].t > l.t) toPull.push(id);
            else if (l.t > remote[id].t) toPush.push(id);
          });

          Object.keys(local).forEach(function (id) {
            if (remote[id]) return;
            if (dead(id)) { toDropLocal.push(id); return; }
            if (local[id].dirty) { toPush.push(id); return; }
            /*@3.NOSJ2.7*/
            if (live && live.indexOf(id) !== -1) toPush.push(id);
          });

          var failedPulls = 0;
          return Promise.all(maybe.map(function (id) {
            return baseGet(id).then(function (b) { (b && b.h ? toPush : toPull).push(id); });
          })).then(function () {
            return chunked(toPull, function (id) {
              return pull(id).then(function (res) {
                if (!res || !res.ok) failedPulls++;
                return res;
              });
            });
          }).then(function () {
            return chunked(toPush, push);
          }).then(function () {
            return filesOf(toDropLocal).then(function (fs) {
              return Promise.all(toDropLocal.map(function (id) { return st.delDoc(id); })).then(function () {
                if (toDropLocal.length) emit('garden:notesErased', { ids: toDropLocal, files: fs, own: false });
              });
            });
          }).then(function () {
            return Promise.all(toDropRemote.map(function (id) {
              return authed('DELETE', base(vid) + '/' + encodeURIComponent(id), vid)
                .catch(function () { return null; });
            }));
          }).then(function () {
            emit('garden:notesReconciled', {
              pulled: toPull.length, pushed: toPush.length, failedPulls: failedPulls,
              droppedLocal: toDropLocal.length, droppedRemote: toDropRemote.length
            });
            return {
              ok: true, pulled: toPull.length, pushed: toPush.length,
              failedPulls: failedPulls,
              droppedLocal: toDropLocal.length, droppedRemote: toDropRemote.length,
              quota: lastQuota
            };
          });
        });
      });
    }).catch(function (e) {
      return { ok: false, reason: String((e && e.message) || e) };
    }).then(function (out) { reconciling = null; return out; });

    return reconciling;
  }

  function retryPending() {
    var ids = Object.keys(readPending());
    if (!ids.length) return Promise.resolve({ ok: true, retried: 0 });
    return Promise.all(ids.map(push)).then(function () {
      return { ok: true, retried: ids.length };
    });
  }

  window.addEventListener('online', function () { retryPending(); });

  /*@3.NOSJ2.8*/
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { try { flush(); } catch (e) {} }
  });

  /*@3.NOSJ2.5*/
  function shareState(noteId) {
    if (!endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    return vaultId().then(function (vid) {
      if (!vid) return { ok: false, reason: 'no-vault' };
      return authed('GET', base(vid) + '/' + encodeURIComponent(noteId) + '/share', vid)
        .then(function (r) {
          if (!r.ok) return { ok: false, status: r.status, body: r.body };
          return { ok: true, shared: !!(r.body && r.body.shared), sid: r.body && r.body.sid,
                   mode: r.body && r.body.mode, views: r.body && r.body.views,
                   t: r.body && r.body.t };
        });
    });
  }

  function shareSet(noteId, doc, title, mode) {
    if (!endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    return vaultId().then(function (vid) {
      if (!vid) return { ok: false, reason: 'no-vault' };
      return authed('POST', base(vid) + '/' + encodeURIComponent(noteId) + '/share', vid,
        { doc: JSON.stringify(doc), title: title || '', mode: mode === 'copy' ? 'copy' : 'view' })
        .then(function (r) {
          if (r.status === 413) {
            quotaEvent(r.body && r.body.error, r.body || {});
            return { ok: false, status: 413, body: r.body };
          }
          if (!r.ok) return { ok: false, status: r.status, body: r.body };
          return { ok: true, sid: r.body && r.body.sid, mode: r.body && r.body.mode,
                   created: !!(r.body && r.body.created) };
        });
    });
  }

  function shareDrop(noteId) {
    if (!endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    return vaultId().then(function (vid) {
      if (!vid) return { ok: false, reason: 'no-vault' };
      return authed('DELETE', base(vid) + '/' + encodeURIComponent(noteId) + '/share', vid)
        .then(function (r) { return { ok: r.ok, revoked: r.body && r.body.revoked }; });
    });
  }

  function shareList() {
    if (!endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    return vaultId().then(function (vid) {
      if (!vid) return { ok: false, reason: 'no-vault' };
      return authed('GET', base(vid) + '/_shares', vid).then(function (r) {
        if (!r.ok || !r.body || !Array.isArray(r.body.shares)) return { ok: false, status: r.status };
        return { ok: true, shares: r.body.shares };
      });
    })['catch'](function () { return { ok: false, why: 'offline' }; });
  }

  /*@3.NOSJ2.14*/
  function shareFile(sid) {
    if (!endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    return req('GET', endpoint() + '/v1/nshare/' + encodeURIComponent(sid) + '/file')
      .then(function (r) {
        if (!r.ok || !r.body || !r.body.url) return { ok: false, status: r.status, why: (r.body && r.body.error) || '' };
        return { ok: true, url: r.body.url, name: r.body.name || '', bytes: r.body.bytes || 0 };
      }, function () { return { ok: false, why: 'offline' }; });
  }

  function shareImages(sid) {
    if (!endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    return req('GET', endpoint() + '/v1/nshare/' + encodeURIComponent(sid) + '/imgs')
      .then(function (r) {
        if (!r.ok || !r.body || typeof r.body.imgs !== 'object') return { ok: false, status: r.status };
        return { ok: true, imgs: r.body.imgs || {} };
      }, function () { return { ok: false, why: 'offline' }; });
  }

  function shareRead(sid) {
    if (!endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    return req('GET', endpoint() + '/v1/nshare/' + encodeURIComponent(sid))
      .then(function (r) {
        if (!r.ok) return { ok: false, status: r.status };
        var doc = null;
        try { doc = JSON.parse(r.body.doc); } catch (e) {}
        return { ok: true, title: r.body.title || '', doc: doc,
                 mode: r.body.mode || 'view', t: r.body.t || 0 };
      });
  }

  window.GardenNotesSync = {
    push: push,
    shareState: shareState,
    shareSet: shareSet,
    shareDrop: shareDrop,
    shareList: shareList,
    shareRead: shareRead,
    shareFile: shareFile,
    shareImages: shareImages,
    pull: pull,
    remove: remove,
    schedule: schedule,
    flush: flush,
    reconcile: reconcile,
    partsMode: partsMode,
    retryPending: retryPending,
    pending: readPending,
    quota: function () { return lastQuota; },
    _req: req
  };
})();
