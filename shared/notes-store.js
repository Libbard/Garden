/*@3.NOSJ.1*/
;(function () {
  'use strict';

  var DB_NAME = 'byte-notes';
  var DB_VER = 2;
  var S_DOCS = 'docs';
  var S_META = 'meta';
  /*@3.NOSJ.6*/
  var S_IMGS = 'imgs';
  var MAX_IMG_BYTES = 8 * 1024 * 1024;

  /*@3.NOSJ.10*/
  var MAX_DOC_BYTES = 32 * 1024 * 1024;
  var WARN_DOC_BYTES = 24 * 1024 * 1024;
  var MAX_TOTAL_BYTES = 512 * 1024 * 1024;
  var WARN_TOTAL_BYTES = 400 * 1024 * 1024;

  var dbPromise = null;
  /*@3.NOSJ.2*/
  var idbBroken = false;
  /*@3.NOSJ.13*/
  var pending = null, BLOCK_MS = 15000;

  function open() {
    if (idbBroken) return Promise.reject(new Error('no-idb'));
    if (dbPromise) return dbPromise;
    if (!pending) pending = openReq();
    var tm = 0;
    dbPromise = Promise.race([pending, new Promise(function (res, rej) {
      tm = setTimeout(function () { rej(new Error('idb-blocked')); }, BLOCK_MS);
    })]);
    dbPromise.then(function () { clearTimeout(tm); }, function (e) {
      clearTimeout(tm);
      dbPromise = null;
      if (!(e && e.message === 'idb-blocked')) { idbBroken = true; pending = null; }
    });
    return dbPromise;
  }

  function openReq() {
    return new Promise(function (resolve, reject) {
      if (!self.indexedDB) { reject(new Error('no-idb')); return; }
      var req;
      try { req = self.indexedDB.open(DB_NAME, DB_VER); }
      catch (e) { reject(e); return; }
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(S_DOCS)) {
          var d = db.createObjectStore(S_DOCS, { keyPath: 'id' });
          /*@3.NOSJ.3*/
          d.createIndex('dirty', 'dirty');
        }
        if (!db.objectStoreNames.contains(S_META)) {
          db.createObjectStore(S_META, { keyPath: 'k' });
        }
        if (!db.objectStoreNames.contains(S_IMGS)) {
          db.createObjectStore(S_IMGS, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () {
        var db = req.result;
        /*@3.NOSJ.14*/
        db.onversionchange = function () {
          try { db.close(); } catch (eC) {}
          dbPromise = null; pending = null;
        };
        resolve(db);
      };
      req.onerror = function () { reject(req.error); };
      req.onblocked = function () {};
    });
  }

  function tx(store, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(store, mode);
        var out = fn(t.objectStore(store));
        t.oncomplete = function () {
          resolve(out instanceof IDBRequest ? out.result : out);
        };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  /*@3.NOSJ.5*/
  function byteLen(str) {
    try { return new TextEncoder().encode(str).length; }
    catch (e) { return str.length * 2; }
  }

  function serialize(doc) {
    return (typeof doc === 'string') ? doc : JSON.stringify(doc);
  }

  function parse(raw) {
    if (raw == null) return null;
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function getRow(id) {
    return tx(S_DOCS, 'readonly', function (os) { return os.get(String(id)); })
      .catch(function () { return null; });
  }

  function getDoc(id) {
    return getRow(id).then(function (row) {
      if (!row) return null;
      return { id: row.id, doc: parse(row.raw), t: row.t || 0, bytes: row.bytes || 0 };
    });
  }

  /*@3.NOSJ.12*/
  function getRaw(id) {
    return getRow(id).then(function (row) {
      if (!row) return null;
      return { id: row.id, raw: (typeof row.raw === 'string') ? row.raw : JSON.stringify(row.raw), t: row.t || 0, bytes: row.bytes || 0, dirty: row.dirty ? 1 : 0 };
    });
  }

  function putDoc(id, doc, t, opts) {
    var o = opts || {};
    var raw = serialize(doc);
    var bytes = byteLen(raw);
    if (bytes > MAX_DOC_BYTES) {
      return Promise.reject(mkErr('doc_too_large', { bytes: bytes, max: MAX_DOC_BYTES }));
    }
    var row = {
      id: String(id),
      raw: raw,
      t: Number(t) || Date.now(),
      bytes: bytes,
      dirty: o.clean ? 0 : 1,
      saved_at: Date.now()
    };
    return tx(S_DOCS, 'readwrite', function (os) { return os.put(row); })
      .then(function () {
        if (!o.clean) askPersist();
        return { bytes: bytes, t: row.t };
      });
  }

  /*@3.NOSJ.16*/
  function askPersist() {
    if (askPersist.done) return;
    askPersist.done = 1;
    try {
      var s = navigator.storage;
      if (!s || !s.persist || !s.persisted) return;
      if (/Firefox\//.test(navigator.userAgent || '')) return;
      s.persisted()
        .then(function (yes) { if (!yes) return s.persist(); })
        .catch(function () {});
    } catch (e) {}
  }

  function delDoc(id) {
    return tx(S_DOCS, 'readwrite', function (os) { return os.delete(String(id)); })
      .then(function () { return true; })
      .catch(function () { return false; });
  }

  function allRows() {
    return tx(S_DOCS, 'readonly', function (os) { return os.getAll(); })
      .then(function (r) { return r || []; })
      .catch(function () { return []; });
  }

  function manifest() {
    return allRows().then(function (rows) {
      var out = {};
      for (var i = 0; i < rows.length; i++) {
        out[rows[i].id] = { t: rows[i].t || 0, bytes: rows[i].bytes || 0, dirty: rows[i].dirty ? 1 : 0 };
      }
      return out;
    });
  }

  function dirtyIds() {
    return allRows().then(function (rows) {
      var out = [];
      for (var i = 0; i < rows.length; i++) if (rows[i].dirty) out.push(rows[i].id);
      return out;
    });
  }

  function markClean(id, t) {
    return getRow(id).then(function (row) {
      if (!row) return false;
      /*@3.NOSJ.4*/
      if (t != null && Number(t) !== Number(row.t)) return false;
      row.dirty = 0;
      return tx(S_DOCS, 'readwrite', function (os) { return os.put(row); })
        .then(function () { return true; });
    }).catch(function () { return false; });
  }

  function totalBytes() {
    return allRows().then(function (rows) {
      var n = 0;
      for (var i = 0; i < rows.length; i++) n += rows[i].bytes || 0;
      return n;
    });
  }

  function quota() {
    return totalBytes().then(function (b) {
      return {
        bytes: b,
        max: MAX_TOTAL_BYTES,
        warn: WARN_TOTAL_BYTES,
        pct: Math.min(100, Math.round((b / MAX_TOTAL_BYTES) * 100)),
        state: b >= MAX_TOTAL_BYTES ? 'full' : (b >= WARN_TOTAL_BYTES ? 'warn' : 'ok')
      };
    });
  }

  function docState(bytes) {
    if (bytes >= MAX_DOC_BYTES) return 'full';
    if (bytes >= WARN_DOC_BYTES) return 'warn';
    return 'ok';
  }

  function getMeta(k, fallback) {
    return tx(S_META, 'readonly', function (os) { return os.get(String(k)); })
      .then(function (row) { return row ? row.v : fallback; })
      .catch(function () { return fallback; });
  }

  function setMeta(k, v) {
    return tx(S_META, 'readwrite', function (os) { return os.put({ k: String(k), v: v }); })
      .then(function () { return true; })
      .catch(function () { return false; });
  }

  function mkErr(code, extra) {
    var e = new Error(code);
    e.code = code;
    if (extra) for (var k in extra) e[k] = extra[k];
    return e;
  }

  function available() {
    return open().then(function () { return true; }).catch(function () { return false; });
  }

  /*@3.NOSJ.7*/
  var URLS = {};

  function imgId() {
    var s2 = '';
    var a = new Uint8Array(12);
    if (self.crypto && self.crypto.getRandomValues) self.crypto.getRandomValues(a);
    else for (var i = 0; i < 12; i++) a[i] = (Math.random() * 256) | 0;
    for (var j = 0; j < a.length; j++) s2 += (a[j] + 256).toString(16).slice(1);
    return s2;
  }

  /*@3.NOSJ.8*/
  function putImage(blob, meta) {
    if (!blob || !blob.size) return Promise.reject(mkErr('img_empty'));
    if (blob.size > MAX_IMG_BYTES) {
      return Promise.reject(mkErr('img_too_large', { bytes: blob.size, max: MAX_IMG_BYTES }));
    }
    return sha256(blob).then(function (h) {
      var id = h ? h.slice(0, 24) : imgId();
      return getImage(id).then(function (old) {
        if (old && old.blob && old.bytes === blob.size) return id;
        var row = { id: id, blob: blob, type: blob.type || 'image/png',
                    bytes: blob.size, at: Date.now(), name: (meta && meta.name) || '' };
        return tx(S_IMGS, 'readwrite', function (os) { return os.put(row); })
          .then(function () { return id; });
      });
    }).then(function (id) { sendSoon(id); return id; });
  }

  /*@3.NOSJ.17*/
  function hex(buf) {
    var a = new Uint8Array(buf), s = '';
    for (var i = 0; i < a.length; i++) s += (a[i] + 256).toString(16).slice(1);
    return s;
  }
  function sha256(blob) {
    var C = self.crypto && self.crypto.subtle;
    if (!C || !blob.arrayBuffer) return Promise.resolve('');
    return blob.arrayBuffer().then(function (b) { return C.digest('SHA-256', b); })
      .then(hex, function () { return ''; });
  }

  /*@3.NOSJ.18*/
  var SHRINK_PX = 1600, SHRINK_Q = 0.82;
  var UP_TYPES = /^image\/(webp|jpeg|png|gif)$/;
  function decode(blob) {
    if (self.createImageBitmap) {
      return createImageBitmap(blob).then(function (b) { return { src: b, w: b.width, h: b.height, done: function () { try { b.close(); } catch (e) {} } }; });
    }
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { ok({ src: im, w: im.naturalWidth, h: im.naturalHeight, done: function () { URL.revokeObjectURL(u); } }); };
      im.onerror = function () { URL.revokeObjectURL(u); no(mkErr('img_decode')); };
      im.src = u;
    });
  }
  function toBlob(cv, type, q) {
    if (cv.convertToBlob) return cv.convertToBlob({ type: type, quality: q });
    return new Promise(function (ok) { cv.toBlob(function (b) { ok(b); }, type, q); });
  }
  function shrink(blob) {
    if (/gif/i.test(blob.type || '')) return Promise.resolve(blob);
    return decode(blob).then(function (d) {
      var k = Math.min(1, SHRINK_PX / Math.max(d.w, d.h, 1));
      var w = Math.max(1, Math.round(d.w * k)), h = Math.max(1, Math.round(d.h * k));
      var cv = self.OffscreenCanvas ? new OffscreenCanvas(w, h) : document.createElement('canvas');
      cv.width = w; cv.height = h;
      var g = cv.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(d.src, 0, 0, w, h);
      d.done();
      return toBlob(cv, 'image/webp', SHRINK_Q).then(function (b) {
        if (b && b.type === 'image/webp') return b;
        return toBlob(cv, /png/i.test(blob.type || '') ? 'image/png' : 'image/jpeg', 0.85);
      }).then(function (b) {
        if (!b) return blob;
        if (k === 1 && b.size >= blob.size && UP_TYPES.test(blob.type || '')) return blob;
        return b;
      });
    });
  }

  /*@3.NOSJ.19*/
  var UPQ = [], UPON = {}, upBusy = false;
  function refOf(id) { return 'img_' + id; }
  function sendSoon(id) {
    id = String(id || '');
    if (!/^[0-9a-f]{24}$/.test(id) || UPON[id]) return;
    UPON[id] = 1;
    UPQ.push(id);
    setTimeout(pump, 1500);
  }
  function pump() {
    var F = window.GardenFiles;
    if (upBusy || !UPQ.length) return;
    if (!F || !F.upload || (navigator.onLine === false)) { setTimeout(pump, 30000); return; }
    var id = UPQ.shift();
    upBusy = true;
    var fin = function () { upBusy = false; if (UPQ.length) setTimeout(pump, 400); };
    getImage(id).then(function (row) {
      if (!row || !row.blob || row.up) return null;
      return shrink(row.blob).then(function (small) {
        var mime = F.normMime(small.type) ? small.type : '';
        if (!mime) return null;
        return sha256(small).then(function (h) {
          if (!h) return null;
          return F.upload(small, { refId: refOf(id), name: 'image-' + id.slice(0, 8) + '.' + mime.split('/')[1],
                                   mime: mime, hash: h }).then(function (r) {
            row.up = 1; row.cb = r.bytes || small.size;
            return tx(S_IMGS, 'readwrite', function (os) { return os.put(row); });
          });
        });
      });
    }).then(fin, function (e) {
      var m = String((e && (e.error || e.message)) || '');
      if (!/no_vault|not_found|not_configured|bad_mime|too_large|vault_full|too_many/.test(m)) {
        delete UPON[id];
      }
      fin();
    });
  }
  function ensureUp(id) {
    return getImage(id).then(function (row) { if (row && row.blob && !row.up) sendSoon(id); });
  }

  /*@3.NOSJ.20*/
  var PULL = {};
  function pullImage(id) {
    var F = window.GardenFiles;
    if (!F || !F.fetchBytes) return Promise.resolve(null);
    if (PULL[id]) return PULL[id];
    PULL[id] = F.fetchBytes(refOf(id)).then(function (got) {
      if (!got || !got.blob || !got.blob.size) return null;
      var blob = got.blob.type ? got.blob : new Blob([got.blob], { type: got.mime || 'image/webp' });
      var row = { id: id, blob: blob, type: blob.type, bytes: blob.size, at: Date.now(), name: '', up: 1, far: 1 };
      return tx(S_IMGS, 'readwrite', function (os) { return os.put(row); }).then(function () { return row; });
    }).catch(function () { return null; }).then(function (r) {
      if (!r) delete PULL[id];
      return r;
    });
    return PULL[id];
  }

  function getImage(id) {
    return tx(S_IMGS, 'readonly', function (os) { return os.get(String(id)); })
      .catch(function () { return null; });
  }

  function delImage(id) {
    var u = URLS[id];
    if (u) { try { URL.revokeObjectURL(u); } catch (e) {} delete URLS[id]; }
    return tx(S_IMGS, 'readwrite', function (os) { return os.delete(String(id)); })
      .then(function () { return true; }).catch(function () { return false; });
  }

  /*@3.NOSJ.9*/
  /*@3.NOSJ.11*/
  function imageUrlNow(id) { return URLS[id] || ''; }
  function imageUrl(id) {
    if (URLS[id]) return Promise.resolve(URLS[id]);
    return getImage(id).then(function (row) {
      if (row && row.blob) { if (!row.up) sendSoon(id); return row; }
      return pullImage(String(id));
    }).then(function (row) {
      if (!row || !row.blob) return '';
      if (URLS[id]) return URLS[id];
      var u = URL.createObjectURL(row.blob);
      URLS[id] = u;
      return u;
    }).catch(function () { return ''; });
  }

  /*@3.NOSJ.15*/
  function allImages() {
    return tx(S_IMGS, 'readonly', function (os) { return os.getAll(); })
      .then(function (rows) { return rows || []; });
  }
  function putImageRow(row) {
    if (!row || !row.id || !row.blob) return Promise.reject(mkErr('img_empty'));
    return tx(S_IMGS, 'readwrite', function (os) {
      return os.put({ id: String(row.id), blob: row.blob, type: row.type || row.blob.type || 'image/png',
                      bytes: row.blob.size, at: Number(row.at) || Date.now(), name: row.name || '' });
    }).then(function () { return row.id; });
  }

  function imageBytes() {
    return tx(S_IMGS, 'readonly', function (os) { return os.getAll(); })
      .then(function (rows) {
        var n = 0;
        for (var i = 0; i < (rows || []).length; i++) n += rows[i].bytes || 0;
        return n;
      }).catch(function () { return 0; });
  }

  window.GardenNotesStore = {
    available: available,
    getDoc: getDoc,
    getRaw: getRaw,
    putDoc: putDoc,
    delDoc: delDoc,
    manifest: manifest,
    dirtyIds: dirtyIds,
    markClean: markClean,
    totalBytes: totalBytes,
    quota: quota,
    docState: docState,
    meta: getMeta,
    setMeta: setMeta,
    byteLen: byteLen,
    putImage: putImage,
    getImage: function (id) {
      return getImage(id).then(function (r) { return (r && r.blob) ? r : pullImage(String(id)); });
    },
    delImage: delImage,
    imageUrl: imageUrl,
    imageUrlNow: imageUrlNow,
    imageBytes: imageBytes,
    allImages: allImages,
    putImageRow: putImageRow,
    shrinkImage: shrink,
    ensureImageUp: ensureUp,
    pullImage: pullImage,
    LIMITS: {
      doc: MAX_DOC_BYTES,
      docWarn: WARN_DOC_BYTES,
      total: MAX_TOTAL_BYTES,
      totalWarn: WARN_TOTAL_BYTES,
      img: MAX_IMG_BYTES
    }
  };
})();
