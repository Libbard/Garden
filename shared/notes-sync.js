/*@3.NOSJ2.1*/
;(function () {
  'use strict';

  var PUSH_DEBOUNCE_MS = 2000;
  /*@3.NOSJ2.2*/
  var PENDING_LS = '__notesPending';

  var timers = {};
  var inflight = {};
  var lastQuota = null;
  var reconciling = null;

  function S() { return window.GardenNotesStore || null; }

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

  function push(noteId) {
    if (!S() || !endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    if (inflight[noteId]) return inflight[noteId];

    var p = vaultId().then(function (vid) {
      if (!vid) return { ok: false, reason: 'no-vault' };
      return S().getDoc(noteId).then(function (row) {
        if (!row) return { ok: false, reason: 'no-doc' };
        var raw = (typeof row.doc === 'string') ? row.doc : JSON.stringify(row.doc);
        return authed('POST', base(vid) + '/' + encodeURIComponent(noteId), vid,
                      { doc: raw, t: row.t })
          .then(function (r) {
            /*@3.NOSJ2.3*/
            if (isQuota(r.status, r.body)) {
              markPending(noteId, r.body.error);
              lastQuota = r.body;
              quotaEvent(r.body.error, { id: noteId, bytes: r.body.bytes, max: r.body.max });
              return { ok: false, reason: r.body.error, quota: true };
            }
            if (!r.ok) { markPending(noteId, 'http-' + r.status); return { ok: false, reason: 'http-' + r.status }; }
            clearPending(noteId);
            if (r.body && r.body.note_bytes != null) lastQuota = r.body;
            return S().markClean(noteId, row.t).then(function () {
              emit('garden:notesPushed', { id: noteId, t: row.t });
              return { ok: true, applied: r.body && r.body.applied, t: row.t };
            });
          });
      });
    }).catch(function (e) {
      markPending(noteId, 'error');
      return { ok: false, reason: String((e && e.message) || e) };
    }).then(function (out) { delete inflight[noteId]; return out; });

    inflight[noteId] = p;
    return p;
  }

  function pull(noteId) {
    if (!S() || !endpoint()) return Promise.resolve({ ok: false, reason: 'no-endpoint' });
    return vaultId().then(function (vid) {
      if (!vid) return { ok: false, reason: 'no-vault' };
      return authed('GET', base(vid) + '/' + encodeURIComponent(noteId), vid)
        .then(function (r) {
          if (r.status === 404) return { ok: false, reason: 'not-found' };
          if (!r.ok || !r.body) return { ok: false, reason: 'http-' + r.status };
          return S().putDoc(noteId, r.body.doc, r.body.t, { clean: true })
            .then(function () {
              emit('garden:notesPulled', { id: noteId, t: r.body.t });
              return { ok: true, t: r.body.t };
            });
        });
    }).catch(function (e) { return { ok: false, reason: String((e && e.message) || e) }; });
  }

  function remove(noteId) {
    if (!S()) return Promise.resolve({ ok: false });
    return S().delDoc(noteId).then(function () {
      if (!endpoint()) return { ok: true, remote: false };
      return vaultId().then(function (vid) {
        if (!vid) return { ok: true, remote: false };
        return authed('DELETE', base(vid) + '/' + encodeURIComponent(noteId), vid)
          .then(function (r) {
            if (r.body && r.body.note_bytes != null) lastQuota = r.body;
            clearPending(noteId);
            return { ok: true, remote: r.ok };
          })
          .catch(function () { return { ok: true, remote: false }; });
      });
    });
  }

  function schedule(noteId) {
    if (timers[noteId]) clearTimeout(timers[noteId]);
    timers[noteId] = setTimeout(function () {
      delete timers[noteId];
      push(noteId);
    }, PUSH_DEBOUNCE_MS);
  }

  function flush() {
    var ids = Object.keys(timers);
    ids.forEach(function (id) { clearTimeout(timers[id]); delete timers[id]; });
    return Promise.all(ids.map(push));
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
        var remote = r.body.docs || {};
        var live = o.liveIds || null;

        /*@3.NOSJ2.4*/
        return st.manifest().then(function (local) {
          var toPull = [], toPush = [], toDropLocal = [], toDropRemote = [];

          Object.keys(remote).forEach(function (id) {
            if (live && live.indexOf(id) === -1) { toDropRemote.push(id); return; }
            var l = local[id];
            if (!l) { toPull.push(id); return; }
            if (l.dirty) { if (l.t >= remote[id].t) toPush.push(id); else toPull.push(id); return; }
            if (remote[id].t > l.t) toPull.push(id);
          });

          Object.keys(local).forEach(function (id) {
            if (remote[id]) return;
            if (live && live.indexOf(id) === -1) { toDropLocal.push(id); return; }
            if (local[id].dirty) toPush.push(id);
            else if (live) toDropLocal.push(id);
          });

          var work = []
            .concat(toPull.map(function (id) { return pull(id); }))
            .concat(toPush.map(function (id) { return push(id); }))
            .concat(toDropLocal.map(function (id) { return st.delDoc(id); }))
            .concat(toDropRemote.map(function (id) {
              return authed('DELETE', base(vid) + '/' + encodeURIComponent(id), vid)
                .catch(function () { return null; });
            }));

          return Promise.all(work).then(function () {
            emit('garden:notesReconciled', {
              pulled: toPull.length, pushed: toPush.length,
              droppedLocal: toDropLocal.length, droppedRemote: toDropRemote.length
            });
            return {
              ok: true, pulled: toPull.length, pushed: toPush.length,
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
    shareRead: shareRead,
    pull: pull,
    remove: remove,
    schedule: schedule,
    flush: flush,
    reconcile: reconcile,
    retryPending: retryPending,
    pending: readPending,
    quota: function () { return lastQuota; },
    _req: req
  };
})();
