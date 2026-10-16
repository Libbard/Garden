;(function () {
  'use strict';

  if (window.GardenPeekStore) return;

  /*@3.PESJ.1*/
  var DB = 'garden-peek', ST = 'snap', P = null;

  function db() {
    if (P) return P;
    P = new Promise(function (ok, no) {
      var rq;
      try { rq = indexedDB.open(DB, 1); } catch (e) { no(e); return; }
      rq.onupgradeneeded = function () { if (!rq.result.objectStoreNames.contains(ST)) rq.result.createObjectStore(ST, { keyPath: 'id' }); };
      rq.onsuccess = function () { ok(rq.result); };
      rq.onerror = function () { no(rq.error); };
    }).catch(function (e) { P = null; throw e; });
    return P;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (ok, no) {
        var t = d.transaction(ST, mode), s = t.objectStore(ST), out = fn(s);
        t.oncomplete = function () { ok(out && out.result !== undefined ? out.result : out); };
        t.onerror = function () { no(t.error); };
        t.onabort = function () { no(t.error); };
      });
    });
  }

  function get(id) {
    if (!id) return Promise.resolve(null);
    return tx('readonly', function (s) { return s.get(String(id)); }).then(function (r) { return r || null; }, function () { return null; });
  }
  function put(id, secs) {
    return tx('readwrite', function (s) { return s.put({ id: String(id), t: Date.now(), secs: secs || {} }); }).then(function () {
      try { localStorage.setItem('garden_peek_t', id + '|' + Date.now()); } catch (e) {}
      return true;
    }, function () { return false; });
  }

  window.GardenPeekStore = { get: get, put: put };
})();
