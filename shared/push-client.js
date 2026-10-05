/*@3.PUCJ.1*/
;(function () {
  'use strict';

  /*@3.PUCJ.2*/
  var ENDPOINT = String((window.GardenEndpoints && window.GardenEndpoints.push) || '')
    .replace(/\/+$/, '');

  var DEVICE_LS = 'garden_push_device';
  var STATE_LS = 'garden_push_state';   /*@3.PUCJ.3*/
  var KEY_LS = 'garden_push_serverkey'; /*@3.PUCJ.4*/
  var MAX_WAKES = 100;                  /*@3.PUCJ.34*/

  /*@3.PUCJ.5*/

  function vaultId() {
    try {
      var k = localStorage.getItem('garden_sync_key');
      if (k && /^[A-Za-z0-9_-]{8,64}$/.test(k)) return k;
    } catch (e) {}
    return deviceId();          /*@3.PUCJ.6*/
  }

  function deviceId() {
    var id = null;
    try { id = localStorage.getItem(DEVICE_LS); } catch (e) {}
    if (id && /^[A-Za-z0-9_-]{8,64}$/.test(id)) return id;
    var b = new Uint8Array(16);
    (self.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.fill(0);
    id = 'd' + Array.prototype.map.call(b, function (x) {
      return x.toString(16).padStart(2, '0');
    }).join('');
    try { localStorage.setItem(DEVICE_LS, id); } catch (e) {}
    return id;
  }

  /*@3.PUCJ.7*/

  function urlB64ToU8(s) {
    var pad = '='.repeat((4 - s.length % 4) % 4);
    var b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(b64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function post(path, body) {
    if (!ENDPOINT) return Promise.reject(new Error('no-endpoint'));
    return fetch(ENDPOINT + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      /*@3.PUCJ.8*/
      return r.json().catch(function () { return null; }).then(function (j) {
        if (r.ok) return j || {};
        var e = new Error((j && j.error) || ('http-' + r.status));
        e.status = r.status;
        e.body = j;
        throw e;
      });
    });
  }

  /*@3.PUCJ.9*/
  var serverKey = null;

  function cachedKey() {
    try {
      var k = localStorage.getItem(KEY_LS);
      return validKey(k) ? k : null;
    } catch (e) { return null; }
  }

  function validKey(k) {
    /*@3.PUCJ.10*/
    return typeof k === 'string' && /^B[A-Za-z0-9_-]{85,87}$/.test(k);
  }

  function fetchKey() {
    if (serverKey) return Promise.resolve(serverKey);
    if (!ENDPOINT) return Promise.reject(new Error('no-endpoint'));
    return fetch(ENDPOINT + '/v1/key', { method: 'GET' })
      .then(function (r) {
        if (!r.ok) throw new Error('key-http-' + r.status);
        return r.json();
      })
      .then(function (j) {
        var k = String((j && j.publicKey) || '');
        if (!validKey(k)) throw new Error('key-invalid');
        serverKey = k;
        try { localStorage.setItem(KEY_LS, k); } catch (e) {}
        return k;
      })
      .catch(function (e) {
        /*@3.PUCJ.11*/
        var c = cachedKey();
        if (c) { serverKey = c; return c; }
        throw e;
      });
  }

  function swReg() {
    if (!('serviceWorker' in navigator)) return Promise.reject(new Error('no-sw'));
    /*@3.PUCJ.12*/
    return Promise.race([
      navigator.serviceWorker.ready,
      new Promise(function (_, rej) {
        setTimeout(function () { rej(new Error('sw-timeout')); }, 5000);
      })
    ]);
  }

  function supported() {
    return ('serviceWorker' in navigator) && ('PushManager' in window) && !!ENDPOINT;
  }

  /*@3.PUCJ.13*/
  function pushMeta(o) {
    try {
      if (self.ReminderDB && ReminderDB.setMeta) ReminderDB.setMeta('push', o);
    } catch (e) {}
  }

  /*@3.PUCJ.14*/

  /*@3.PUCJ.38*/
  var ERR_LS = 'garden_push_err';
  function noteErr(why) {
    try {
      if (why) localStorage.setItem(ERR_LS, JSON.stringify({ why: String(why).slice(0, 200), at: Date.now() }));
      else localStorage.removeItem(ERR_LS);
    } catch (e) {}
  }
  function lastError() {
    try { return JSON.parse(localStorage.getItem(ERR_LS) || 'null'); } catch (e) { return null; }
  }

  function subscribe() {
    if (!supported()) return Promise.resolve({ ok: false, reason: 'unsupported' });
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return Promise.resolve({ ok: false, reason: 'not-granted' });
    }

    return Promise.all([swReg(), fetchKey()]).then(function (r) {
      var reg = r[0], key = r[1];
      return reg.pushManager.getSubscription().then(function (existing) {
        if (existing) {
          /*@3.PUCJ.15*/
          var cur = existing.options && existing.options.applicationServerKey;
          if (cur && !sameKey(cur, key)) {
            return existing.unsubscribe().then(function () { return fresh(reg, key); });
          }
          return existing;
        }
        return fresh(reg, key);
      });
    }).then(function (sub) {
      var j = sub.toJSON();
      /*@3.PUCJ.16*/
      pushMeta({
        endpoint: ENDPOINT,
        vault: vaultId(),
        device: deviceId(),
        key: serverKey || cachedKey() || ''
      });
      return post('/v1/subscribe', {
        vault_id: vaultId(),
        device_id: deviceId(),
        subscription: { endpoint: j.endpoint, keys: j.keys }
      }).then(function () {
        migrateFrom();
        /*@3.PUCJ.17*/
        try {
          if (window.GardenWatch && window.GardenWatch.ready()) {
            window.GardenWatch.refreshPush();
          }
        } catch (e) {}
        noteErr(null);
        return { ok: true };
      });
    }).catch(function (e) {
      var why = String(e && e.message || e);
      noteErr(why);
      return { ok: false, reason: why };
    });
  }

  /*@3.PUCJ.39*/
  var EP_LS = 'garden_push_ep';
  function migrateFrom() {
    var prev = null;
    try { prev = localStorage.getItem(EP_LS); } catch (e) {}
    var legacy = String((window.GardenEndpoints && window.GardenEndpoints.pushLegacy) || '').replace(/\/+$/, '');
    if (!prev && legacy && legacy !== ENDPOINT) prev = legacy;
    try { localStorage.setItem(EP_LS, ENDPOINT); } catch (e) {}
    if (!prev || prev === ENDPOINT) return;
    try { localStorage.removeItem(STATE_LS); } catch (e) {}
    try {
      fetch(prev + '/v1/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault_id: vaultId(), device_id: deviceId() })
      }).catch(function () {});
    } catch (e) {}
  }

  function fresh(reg, key) {
    /*@3.PUCJ.18*/
    window.GardenEv('notif_enable', {});
    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToU8(key)
    });
  }

  function sameKey(bufOrStr, b64) {
    try {
      var a = new Uint8Array(bufOrStr);
      var b = urlB64ToU8(b64);
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    } catch (e) { return true; }   /*@3.PUCJ.19*/
  }

  function unsubscribe() {
    var done = post('/v1/unsubscribe', { vault_id: vaultId(), device_id: deviceId() })
      .catch(function () {});
    return swReg().then(function (reg) {
      return reg.pushManager.getSubscription();
    }).then(function (s) {
      return s ? s.unsubscribe() : null;
    }).catch(function () {}).then(function () {
      try { localStorage.removeItem(STATE_LS); } catch (e) {}
      return done;
    });
  }

  /*@3.PUCJ.20*/

  /*@3.PUCJ.21*/

  /*@3.PUCJ.22*/
  var REUPLOAD_MS = 2 * 60 * 60 * 1000;

  function lastUpload() {
    try {
      var o = JSON.parse(localStorage.getItem(STATE_LS) || 'null');
      return (o && typeof o === 'object') ? o : null;
    } catch (e) { return null; }
  }

  /*@3.PUCJ.23*/
  function remPayload(items) {
    var now = Date.now();
    var out = [];
    (items || []).forEach(function (i) {
      if (!i || typeof i.fireAt !== 'number' || i.fireAt <= now) return;
      if (!i.id || !i.title) return;
      var url = String((i.data && i.data.url) || i.url || '');
      if (/[:\\]/.test(url) || url.indexOf('//') === 0) url = '';
      var id = String(i.id).replace(/[^A-Za-z0-9:._-]/g, '_').slice(0, 64);
      out.push({
        id: id,
        /*@3.PUCJ.37*/
        at: Math.floor(i.fireAt / 60000) * 60000,
        title: String(i.title).slice(0, 120),
        body: String(i.body || '').slice(0, 240),
        url: url.replace(/^\/+/, '')
      });
    });
    return out.sort(function (a, b) { return a.at - b.at; }).slice(0, MAX_WAKES);
  }

  function syncWakes(items) {
    if (!supported()) return Promise.resolve({ ok: false, reason: 'unsupported' });
    var rems = remPayload(items);
    /*@3.PUCJ.27*/
    var sig = vaultId() + '|' + rems.map(function (r) {
      return r.id + '@' + r.at + '#' + r.title.length + ':' + r.body.length;
    }).join(',');
    var last = lastUpload();
    if (last && last.sig === sig && (Date.now() - (last.at || 0)) < REUPLOAD_MS) {
      return Promise.resolve({ ok: true, skipped: true });
    }

    return post('/v1/reminders', { vault_id: vaultId(), device_id: deviceId(), reminders: rems })
      .then(function (r) {
        /*@3.PUCJ.28*/
        try {
          localStorage.setItem(STATE_LS, JSON.stringify({ sig: sig, at: Date.now() }));
        } catch (e) {}
        return { ok: true, accepted: r && r.accepted };
      })
      .catch(function (e) {
        try { localStorage.removeItem(STATE_LS); } catch (e2) {}
        return { ok: false, reason: String(e && e.message || e) };
      });
  }

  /*@3.PUCJ.29*/
  function serverTest() {
    if (!supported()) return Promise.resolve({ ok: false, reason: 'unsupported' });
    /*@3.PUCJ.30*/
    return subscribe().then(function (s) {
      if (!s.ok) return { ok: false, reason: s.reason, stage: 'subscribe' };
      return post('/v1/test', { vault_id: vaultId(), device_id: deviceId() })
        .then(function (r) {
          return { ok: !!(r && r.ok), devices: r && r.devices, reason: r && r.error,
                   fireAt: (r && r.fire_at) || Date.now() };
        })
        /*@3.PUCJ.31*/
        .catch(function (e) {
          return {
            ok: false,
            reason: String(e && e.message || e),
            retryAfter: (e && e.body && e.body.retry_after) || 0
          };
        });
    });
  }

  /*@3.PUCJ.36*/
  function explain(why) {
    var ar = (document.documentElement.lang || 'ar').toLowerCase().indexOf('en') !== 0;
    var t = function (a, e) { return ar ? a : e; };
    why = String(why || '');
    if (/Registration failed|push service|AbortError/i.test(why)) {
      return t('متصفّحُ هذا الجهاز لم يستطع التسجيلَ لدى خدمة الدفع — والعطلُ خارج موقعنا.\n'
             + 'الأسبابُ بترتيب الاحتمال:\n'
             + '١) Brave: خدمةُ الدفع مُعطَّلةٌ فيه افتراضيّاً. افتح brave://settings/privacy '
             + 'وفعّل «Use Google services for push messaging» ثمّ أعِد تشغيل المتصفّح.\n'
             + '٢) إضافةٌ مانعةٌ للإعلانات تحجب googleapis.com.\n'
             + '٣) جدارُ حمايةٍ أو VPN يحجب fcmregistrations.googleapis.com.\n'
             + 'جرّبْ نافذةَ تصفّحٍ خفيٍّ بلا إضافاتٍ لتتأكّد. وأجهزتُك المشترِكةُ الأخرى لا يمسّها هذا.',
               'This device’s browser could not register with the push service — the fault is outside our site.\n'
             + 'Most likely causes:\n'
             + '1) Brave: push messaging is off by default. Open brave://settings/privacy, enable '
             + '"Use Google services for push messaging", then restart the browser.\n'
             + '2) An ad blocker blocking googleapis.com.\n'
             + '3) A firewall or VPN blocking fcmregistrations.googleapis.com.\n'
             + 'Try an incognito window without extensions to confirm. Your other subscribed devices are not affected.');
    }
    if (why === 'device_not_subscribed') {
      return t('هذا الجهازُ ليس مشترِكاً في خزنتك، فالخادمُ لا يقبل منه طلباً. فعّلِ التنبيهاتِ عليه أوّلاً — وإن رفض متصفّحُه التسجيلَ فجرّبْ من جهازٍ مشترِكٍ كجوّالك.',
               'This device is not subscribed to your vault, so the server will not accept its requests. Turn reminders on here first, or test from a subscribed device such as your phone.');
    }
    if (why === 'not-granted') {
      return t('لا إذنَ بالإشعارات على هذا الجهاز — اسمحْ بها من إعدادات المتصفّح.',
               'Notification permission is missing on this device. Allow it in browser settings.');
    }
    if (why === 'no_devices') {
      return t('لا جهازَ مشترِكٌ في هذه الخزنة بعد. فعّلِ التنبيهاتِ في هذا الجهاز أوّلاً ثمّ أعِد المحاولة.',
               'No subscribed devices in this vault yet. Turn reminders on here first, then retry.');
    }
    if (why === 'sw-timeout' || why === 'no-sw') {
      return t('عاملُ الخدمة لم يجهز بعد — أعِد تحميلَ الصفحة ثمّ جرّب.',
               'The service worker is not ready yet. Reload the page and try again.');
    }
    return '';
  }

  /*@3.PUCJ.32*/
  /*@3.PUCJ.40*/
  function migrationPending() {
    var cur = null;
    try { cur = localStorage.getItem(EP_LS); } catch (e) {}
    if (cur === ENDPOINT || !supported()) return Promise.resolve(false);
    if (!('Notification' in window) || Notification.permission !== 'granted') return Promise.resolve(false);
    return swReg().then(function (reg) { return reg.pushManager.getSubscription(); })
      .then(function (s) { return !!s; }, function () { return false; });
  }
  function migrate() {
    return migrationPending().then(function (yes) {
      return yes ? subscribe().then(function (r) { return !!(r && r.ok); }) : false;
    });
  }
  function rawStatus() {
    return post('/v1/status', { vault_id: vaultId(), device_id: deviceId() });
  }
  function status() {
    return rawStatus().catch(function (e) {
      var why = String(e && e.message || e);
      if (why !== 'device_not_subscribed') return { ok: false, reason: why };
      return migrate().then(function (moved) {
        if (!moved) return { ok: false, reason: why };
        return rawStatus();
      }).catch(function (e2) { return { ok: false, reason: String(e2 && e2.message || e2) }; });
    });
  }
  setTimeout(function () { try { migrate().catch(function () {}); } catch (e) {} }, 3000);

  /*@3.PUCJ.35*/
  function awaitShown(sinceMs, opts) {
    var o = opts || {};
    var every = o.every || 6000;
    var limit = o.limit || 100000;
    var t0 = Date.now();
    var since = Number(sinceMs) || t0;
    function verdictOf(r) {
      var me = null;
      ((r && r.devices_list) || []).forEach(function (x) { if (x.self) me = x; });
      if (!me) return null;
      if (me.last_shown_at && me.last_shown_at >= since - 1000) return { verdict: 'shown', at: me.last_shown_at };
      if (me.last_ok_at && me.last_ok_at >= since - 1000) return { verdict: 'accepted', at: me.last_ok_at, pending: true };
      return null;
    }
    return new Promise(function (resolve) {
      var lastAccepted = null;
      function tick() {
        status().then(function (r) {
          var v = r && r.ok ? verdictOf(r) : null;
          if (v && v.verdict === 'shown') { resolve(v); return; }
          if (v && v.verdict === 'accepted') lastAccepted = v;
          if (Date.now() - t0 >= limit) {
            resolve(lastAccepted ? { verdict: 'accepted', at: lastAccepted.at }
                                 : { verdict: 'silent', at: null });
            return;
          }
          setTimeout(tick, every);
        }, function () { setTimeout(tick, every); });
      }
      tick();
    });
  }

  window.GardenPush = {
    supported: supported,
    status: status,
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    syncWakes: syncWakes,
    serverTest: serverTest,
    awaitShown: awaitShown,
    explain: explain,
    lastError: lastError,
    vaultId: vaultId,
    deviceId: deviceId,
    /*@3.PUCJ.33*/
    publicKey: function () { return serverKey || cachedKey(); },
    fetchKey: fetchKey
  };
})();
