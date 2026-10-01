/*@3.DRIJ.1*/
;(function () {
  'use strict';

  var SCOPE = 'https://www.googleapis.com/auth/drive.file';
  var API = 'https://www.googleapis.com/drive/v3';
  var GSI = 'https://accounts.google.com/gsi/client';
  var GAPI = 'https://apis.google.com/js/api.js';
  var SLACK_MS = 60 * 1000;

  function E() { return window.GardenEndpoints || {}; }
  function clientId() { return E().googleClientId || ''; }
  function pickerKey() { return E().googlePickerKeyOn ? (E().googlePickerKey || '') : ''; }
  function appId() { return String(clientId()).split('-')[0] || ''; }
  function apiBase() { return E().sync || ''; }
  function enabled() { return !!clientId(); }

  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar').indexOf('ar') === 0; }
  function L(a, b) { return isAr() ? a : b; }
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function err(code, why) {
    var e = new Error(code);
    e.code = code;
    if (why) e.why = String(why);
    return e;
  }

  var scripts = {};
  function script(src, ready) {
    if (ready()) return Promise.resolve(true);
    if (scripts[src]) return scripts[src];
    scripts[src] = new Promise(function (ok) {
      var el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = function () { ok(ready()); };
      el.onerror = function () { delete scripts[src]; ok(false); };
      document.head.appendChild(el);
      setTimeout(function () { ok(ready()); }, 10000);
    });
    return scripts[src];
  }
  function gsiReady() { return !!(window.google && window.google.accounts && window.google.accounts.oauth2); }
  function pickerReady() { return !!(window.google && window.google.picker && window.gapi); }

  function warm() {
    if (!enabled()) return Promise.resolve(false);
    var a = script(GSI, gsiReady);
    var b = script(GAPI, function () { return !!window.gapi; }).then(function (ok) {
      if (!ok || pickerReady()) return ok;
      return new Promise(function (res) {
        try { window.gapi.load('picker', { callback: function () { res(true); }, onerror: function () { res(false); } }); }
        catch (e) { res(false); }
      });
    });
    return Promise.all([a, b]).then(function (r) { return r[0] && r[1]; });
  }

  var tok = null, exp = 0, client = null;
  var KEEP = 'garden.gd.tok';
  function recall() {
    if (tok) return;
    try {
      var j = JSON.parse(sessionStorage.getItem(KEEP) || 'null');
      if (j && j.t && Number(j.e) > Date.now() + SLACK_MS) { tok = j.t; exp = Number(j.e); }
      else sessionStorage.removeItem(KEEP);
    } catch (e) {}
  }
  function stash() {
    try {
      if (tok) sessionStorage.setItem(KEEP, JSON.stringify({ t: tok, e: exp }));
      else sessionStorage.removeItem(KEEP);
    } catch (e) {}
  }
  function hold(t, sec) { tok = t; exp = Date.now() + (Number(sec) || 3600) * 1000; stash(); }
  function fresh() { recall(); return !!(tok && Date.now() < exp - SLACK_MS); }
  function forget() { tok = null; exp = 0; stash(); }

  var LINK_LS = '__gdLink', ASK_LS = '__gdLinkAsk', LATER_SS = '__gdLinkLater';
  var KNOWN_MS = 10 * 60 * 1000;
  function linkCache() { try { return JSON.parse(localStorage.getItem(LINK_LS) || 'null'); } catch (e) { return null; } }
  function linkRemember(v) {
    try { if (v) localStorage.setItem(LINK_LS, JSON.stringify(v)); else localStorage.removeItem(LINK_LS); } catch (e) {}
  }
  function linked() { var c = linkCache(); return !!(c && c.on); }
  function linkedEmail() { var c = linkCache(); return (c && c.e) || ''; }
  function linkKnown() { var c = linkCache(); return !!(c && (c.on || Date.now() - Number(c.t || 0) < KNOWN_MS)); }
  function linkOff() { linkRemember({ on: 0, t: Date.now() }); }
  function declined() { try { return localStorage.getItem(ASK_LS) === 'no'; } catch (e) { return false; } }
  function declineLink(on) { try { if (on) localStorage.setItem(ASK_LS, 'no'); else localStorage.removeItem(ASK_LS); } catch (e) {} }
  function later() { try { return sessionStorage.getItem(LATER_SS) === '1'; } catch (e) { return false; } }
  function laterSet(on) { try { if (on) sessionStorage.setItem(LATER_SS, '1'); else sessionStorage.removeItem(LATER_SS); } catch (e) {} }

  function G() { return window.GardenSync || null; }
  function vaultOf() {
    var g = G();
    if (!g || !g.vaultId) return Promise.resolve('');
    try { return Promise.resolve(g.vaultId()).then(function (v) { return v || ''; }, function () { return ''; }); }
    catch (e) { return Promise.resolve(''); }
  }
  function api(method, tail, body) {
    if (!apiBase()) return Promise.reject(err('no_endpoint'));
    return vaultOf().then(function (vid) {
      if (!vid) throw err('no_vault');
      var g = G();
      var h = body ? { 'Content-Type': 'application/json' } : {};
      if (g && g.vaultHeaders) { try { h = g.vaultHeaders(vid, h); } catch (e) {} }
      return fetch(apiBase() + '/v1/drive/' + encodeURIComponent(vid) + tail, {
        method: method, headers: h, body: body ? JSON.stringify(body) : undefined
      }).then(function (r) {
        return r.json().catch(function () { return null; }).then(function (j) {
          return { ok: r.ok, status: r.status, j: j || {} };
        });
      });
    });
  }

  function linkStatus() {
    return api('GET', '').then(function (r) {
      if (!r.ok) return { linked: linked(), email: linkedEmail(), armed: false, unknown: true, why: (r.j && r.j.error) || '' };
      if (r.j.linked) linkRemember({ on: 1, e: r.j.email || '', t: Date.now() }); else linkOff();
      return { linked: !!r.j.linked, email: r.j.email || '', armed: !!r.j.armed };
    }, function (e) { return { linked: linked(), email: linkedEmail(), armed: false, unknown: true, why: (e && e.code) || '' }; });
  }

  var linkNet = null;
  function serverToken() {
    if (linkNet) return linkNet;
    linkNet = api('POST', '/token').then(function (r) {
      if (r.ok && r.j.access_token) {
        hold(r.j.access_token, r.j.expires_in);
        if (!linked()) linkRemember({ on: 1, e: linkedEmail(), t: Date.now() });
        return tok;
      }
      if (r.status === 404 || r.status === 410) linkOff();
      throw err(r.status === 410 ? 'link_revoked' : 'link_failed', r.j && r.j.error);
    }).then(function (t) { linkNet = null; return t; }, function (e) { linkNet = null; throw e; });
    return linkNet;
  }

  function activated() {
    var ua = navigator.userActivation;
    return !ua || typeof ua.isActive !== 'boolean' || ua.isActive;
  }

  var tokNet = null;
  function token(interactive) {
    if (fresh()) return Promise.resolve(tok);
    if (!enabled()) return Promise.reject(err('drive_disabled'));
    if (tokNet) return tokNet;
    var ask = linked() || (!interactive && !linkKnown() && !!apiBase());
    var via = ask ? serverToken().then(function (t) { return t; }, function () { return null; }) : Promise.resolve(null);
    tokNet = via.then(function (t0) {
      if (t0) return t0;
      if (!interactive && !activated()) throw err('no_gesture');
      return gisToken();
    }).then(function (t) { tokNet = null; return t; }, function (e) { tokNet = null; throw e; });
    return tokNet;
  }

  function gisToken() {
    return script(GSI, gsiReady).then(function (ok) {
      if (!ok) throw err('gsi_unavailable');
      return new Promise(function (res, rej) {
        if (!client) {
          client = window.google.accounts.oauth2.initTokenClient({ client_id: clientId(), scope: SCOPE, callback: function () {} });
        }
        var done = false;
        client.callback = function (r) {
          if (done) return;
          done = true;
          if (!r || r.error || !r.access_token) {
            rej(err(r && r.error === 'access_denied' ? 'consent_denied' : 'no_token', r && r.error_description));
            return;
          }
          hold(r.access_token, r.expires_in);
          res(tok);
        };
        client.error_callback = function (e) {
          if (done) return;
          done = true;
          var t = (e && e.type) || '';
          rej(err(t === 'popup_closed' ? 'consent_closed' : t === 'popup_failed_to_open' ? 'popup_blocked' : 'no_token', e && e.message));
        };
        try { client.requestAccessToken({ prompt: '' }); }
        catch (e) { done = true; rej(err('no_token', e && e.message)); }
      });
    });
  }

  function requestCode() {
    if (!enabled()) return Promise.reject(err('drive_disabled'));
    return script(GSI, gsiReady).then(function (ok) {
      if (!ok) throw err('gsi_unavailable');
      return new Promise(function (res, rej) {
        var done = false;
        var cc = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId(), scope: SCOPE, ux_mode: 'popup',
          access_type: 'offline', prompt: 'consent',
          callback: function (r) {
            if (done) return;
            done = true;
            if (!r || r.error || !r.code) {
              rej(err(r && r.error === 'access_denied' ? 'consent_denied' : 'no_code', r && r.error_description));
              return;
            }
            res({ code: r.code, redirect: 'postmessage' });
          },
          error_callback: function (e) {
            if (done) return;
            done = true;
            var t = (e && e.type) || '';
            rej(err(t === 'popup_closed' ? 'consent_closed' : t === 'popup_failed_to_open' ? 'popup_blocked' : 'no_code', e && e.message));
          }
        });
        try { cc.requestCode(); } catch (e) { done = true; rej(err('no_code', e && e.message)); }
      });
    });
  }

  function linkWith(code, redirect) {
    return api('POST', '/link', { code: code, redirect: redirect || 'postmessage', keep: true }).then(function (r) {
      if (r.ok && r.j.linked) {
        linkRemember({ on: 1, e: r.j.email || '', t: Date.now() });
        declineLink(false); laterSet(false);
        if (r.j.access_token) hold(r.j.access_token, r.j.expires_in);
        return { ok: true, email: r.j.email || '' };
      }
      if (r.j && r.j.access_token) hold(r.j.access_token, r.j.expires_in);
      throw err((r.j && r.j.error) || ('http_' + r.status));
    });
  }
  function linkNow() { return requestCode().then(function (c) { return linkWith(c.code, c.redirect); }); }

  function unlink() {
    return api('DELETE', '').then(function (r) {
      linkRemember(null); forget();
      return { ok: r.ok, revoked: !!(r.j && r.j.revoked) };
    }, function () { linkRemember(null); forget(); return { ok: false }; });
  }

  function guardArmed() {
    var g = G();
    if (!g) return Promise.resolve(false);
    try { var li = g.lockInfo && g.lockInfo(); if (li && li.armed) return Promise.resolve(true); } catch (e) {}
    return linkStatus().then(function (s) { return !!(s && s.armed); });
  }

  function settingsHref() {
    return (/\/hub\//.test(location.pathname) ? 'settings.html' : 'hub/settings.html') + '#sync-panel-host';
  }

  var askDlg = null;
  function askLink() {
    if (askDlg) return Promise.resolve(null);
    return guardArmed().then(function (armed) {
      return new Promise(function (resolve) {
        var dlg = document.createElement('dialog');
        dlg.className = 'gsf gsf--snug gdl';
        dlg.setAttribute('data-keep-open', '');
        dlg.setAttribute('aria-label', L('درايف على كلِّ أجهزتك', 'Drive on all your devices'));
        dlg.innerHTML =
          '<div class="gsf-body"><div class="gsf-head">' +
            '<h2 class="gsf-title"><i class="fa-brands fa-google-drive" aria-hidden="true"></i> ' +
            esc(L('فُتح من درايف — نحفظ الإذنَ لكلِّ أجهزتك؟', 'Opened from Drive — keep the permission for all your devices?')) + '</h2>' +
            '<p class="gsf-sub">' + esc(L('نحفظه مشفَّراً في حسابك عندنا، فيفتح جوّالُك ملفّاتِ درايف بلا دخولٍ جديد. لا نرى إلا ما تختاره أنت.',
              'We keep it encrypted in your account, so your phone opens your Drive files with no new sign-in. We only see what you pick.')) + '</p></div>' +
            (armed ? '' :
              '<p class="gdl-warn"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> ' +
              esc(L('لحفظه في حسابك احمِ حسابَك أوّلاً — كي لا يدخلَه أحدٌ سواك.', 'To keep it in your account, protect your account first — so nobody but you can get in.')) +
              ' <a href="' + esc(settingsHref()) + '">' + esc(L('احمِ حسابي', 'Protect my account')) + '</a></p>') +
            '<p class="gdl-err" role="alert" hidden></p>' +
          '</div>' +
          '<div class="gsf-foot"><div class="gsf-acts">' +
            '<button type="button" class="gsf-btn gsf-btn--ghost" data-a="later">' + esc(L('لاحقاً', 'Later')) + '</button>' +
            '<button type="button" class="gsf-btn" data-a="here">' + esc(L('هذا الجهاز وحدَه', 'This device only')) + '</button>' +
            '<button type="button" class="gsf-btn gsf-btn--gd" data-a="all"' + (armed ? '' : ' disabled') + '>' +
              '<i class="fa-solid fa-cloud" aria-hidden="true"></i> ' + esc(L('نعم — كلُّ أجهزتي', 'Yes — all my devices')) + '</button>' +
          '</div></div>';
        document.body.appendChild(dlg);
        askDlg = dlg;
        var done = false;
        function finish(v) {
          if (done) return;
          done = true;
          try { dlg.close(); } catch (e1) {}
          if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
          askDlg = null;
          resolve(v);
        }
        dlg.addEventListener('cancel', function (e) { e.preventDefault(); laterSet(true); finish('later'); });
        dlg.addEventListener('click', function (e) {
          var b = e.target.closest ? e.target.closest('[data-a]') : null;
          if (!b || b.disabled) return;
          var a = b.getAttribute('data-a');
          if (a === 'later') { laterSet(true); finish('later'); return; }
          if (a === 'here') { declineLink(true); finish('here'); return; }
          b.disabled = true;
          var was = b.innerHTML;
          b.textContent = L('يُربط…', 'Linking…');
          linkNow().then(function (r) { finish({ linked: true, email: r.email }); }, function (e2) {
            b.disabled = false;
            b.innerHTML = was;
            var p = dlg.querySelector('.gdl-err');
            if (p) { p.hidden = false; p.textContent = linkReason(e2); }
          });
        });
        try { dlg.showModal(); } catch (e2) { dlg.setAttribute('open', ''); }
      });
    });
  }

  function maybeOffer() {
    if (!apiBase() || linked() || declined() || later()) return Promise.resolve(null);
    return vaultOf().then(function (vid) {
      if (!vid) return null;
      return linkStatus().then(function (st) {
        if (!st || st.unknown || st.linked) return null;
        return askLink();
      });
    });
  }

  function linkReason(e) {
    var k = (e && e.code) || '';
    if (k === 'protect_first') return L('احمِ حسابَك أوّلاً ثمّ أعِدِ المحاولة.', 'Protect your account first, then try again.');
    if (k === 'no_vault') return L('لا حسابَ مزامنةٍ على هذا الجهاز بعد — أنشئْه من الإعدادات.', 'No sync account on this device yet — create one in Settings.');
    if (k === 'vault_locked') return L('حسابُك مقفلٌ على هذا الجهاز — افتحْه من الإعدادات ثمّ أعِد.', 'Your account is locked on this device — unlock it in Settings, then retry.');
    if (k === 'no_refresh') return L('لم يعطِ قوقلُ إذناً دائماً هذه المرّة — أعِدْ ووافقْ على الوصولِ الدائم.', 'Google did not grant a lasting permission this time — retry and allow ongoing access.');
    if (k === 'drive_not_configured') return L('درايفُ غيرُ مفعَّلٍ على خادمنا بعد.', 'Drive is not enabled on our server yet.');
    if (k === 'consent_denied' || k === 'consent_closed' || k === 'popup_blocked') return reason(e);
    return L('تعذّر حفظُ الإذن — أعِدِ المحاولة.', 'Could not keep the permission — try again.');
  }

  function reason(e) {
    var k = (e && e.code) || '';
    if (k === 'drive_disabled' || k === 'picker_disabled') return L('ربطُ قوقل درايف غيرُ مفعَّلٍ بعد.', 'Google Drive is not enabled yet.');
    if (k === 'popup_blocked') return L('منع المتصفّحُ نافذةَ قوقل. اضغطْ مرّةً أخرى — أو اسمحْ بالنوافذِ المنبثقةِ لهذا الموقع.', 'The browser blocked the Google window. Tap again — or allow pop-ups for this site.');
    if (k === 'consent_denied' || k === 'consent_closed') return L('لم يُمنح الإذنُ لدرايف — أعِدِ المحاولةَ واسمحْ بالوصول.', 'Drive access was not granted — try again and allow access.');
    if (k === 'no_gesture') return L('يحتاج درايفُ إذنَك على هذا الجهاز — اضغطْ «افتحْ من درايف» ليطلبه قوقل.', 'Drive needs your permission on this device — tap “Open from Drive” so Google can ask.');
    if (k === 'picker_mute') return L('لم تستجبْ نافذةُ درايف على هذا المتصفّح — افتحِ الملفَّ من جهازك.', 'The Drive window did not respond in this browser — open the file from your device.');
    if (k === 'not_found') return L('الملفُّ لم يعد في درايفك — رُبّما حُذف أو نُقل إلى المهملات.', 'The file is no longer in your Drive — it may have been deleted or trashed.');
    if (k === 'forbidden') return L('لا صلاحيّةَ لهذا الملفّ في درايف.', 'No permission for this file in Drive.');
    if (k === 'gsi_unavailable' || k === 'gapi_unavailable' || /^http_/.test(k)) return L('تعذّر الاتّصالُ بقوقل — تحقّقْ من الشبكةِ وأعِدِ المحاولة.', 'Could not reach Google — check the connection and try again.');
    return L('تعذّر الوصولُ إلى درايف.', 'Drive could not be reached.');
  }

  function call(method, url, t) {
    return fetch(url, { method: method, headers: { Authorization: 'Bearer ' + t } }).then(function (r) {
      if (r.status === 401) { forget(); throw err('token_expired'); }
      if (r.status === 403) throw err('forbidden');
      if (r.status === 404) throw err('not_found');
      if (!r.ok) throw err('http_' + r.status);
      return r;
    });
  }
  function authed(fn) {
    return token(false).then(fn)['catch'](function (e) {
      if (!e || e.code !== 'token_expired') throw e;
      return token(false).then(fn);
    });
  }
  function meta(id) {
    return authed(function (t) {
      return call('GET', API + '/files/' + encodeURIComponent(id) + '?fields=id,name,size,mimeType,trashed', t)
        .then(function (r) { return r.json(); });
    });
  }
  function download(id, onProgress) {
    return authed(function (t) {
      return call('GET', API + '/files/' + encodeURIComponent(id) + '?alt=media', t);
    }).then(function (r) {
      var total = Number(r.headers.get('content-length')) || 0;
      if (!r.body || !r.body.getReader || !onProgress) return r.blob();
      var reader = r.body.getReader(), parts = [], got = 0;
      var pump = function () {
        return reader.read().then(function (s) {
          if (s.done) return new Blob(parts, { type: r.headers.get('content-type') || '' });
          parts.push(s.value);
          got += s.value.length;
          try { onProgress(got, total); } catch (e) {}
          return pump();
        });
      };
      return pump();
    });
  }

  function wayOut(shut) {
    var tries = 0;
    var t = setInterval(function () {
      var dlg = document.querySelector('.picker-dialog');
      if (!dlg) { if (++tries > 60) clearInterval(t); return; }
      clearInterval(t);
      if (dlg.getAttribute('data-garden-out')) return;
      dlg.setAttribute('data-garden-out', '1');
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'gdl-x';
      x.setAttribute('aria-label', L('إغلاق', 'Close'));
      x.setAttribute('data-ar-title', 'إغلاق');
      x.setAttribute('data-en-title', 'Close');
      x.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      x.addEventListener('click', shut);
      dlg.appendChild(x);
      var bg = document.querySelector('.picker-dialog-bg');
      if (bg) bg.addEventListener('click', shut);
    }, 50);
    return function () { clearInterval(t); };
  }

  var MUTE_MS = 9000;
  function pick(opts) {
    var o = opts || {};
    if (!enabled()) return Promise.reject(err('picker_disabled'));
    return token(true).then(function (t) {
      return script(GAPI, function () { return !!window.gapi; }).then(function (ok) {
        if (!ok) throw err('gapi_unavailable');
        return new Promise(function (res) {
          if (pickerReady()) { res(); return; }
          try { window.gapi.load('picker', { callback: res, onerror: res }); } catch (e) { res(); }
        });
      }).then(function () {
        if (!pickerReady()) throw err('gapi_unavailable');
        return new Promise(function (res, rej) {
          var P = window.google.picker;
          var mimes = o.mime || 'application/pdf';
          var tree = new P.DocsView(P.ViewId.DOCS);
          tree.setMimeTypes(mimes);
          tree.setIncludeFolders(true);
          tree.setSelectFolderEnabled(false);
          try { tree.setParent('root'); } catch (e0) {}
          try { tree.setLabel(L('درايفي', 'My Drive')); } catch (e0) {}
          var flat = new P.DocsView(P.ViewId.DOCS);
          flat.setMimeTypes(mimes);
          try { flat.setLabel(L('بحثٌ في الكلّ', 'Search everything')); } catch (e0) {}
          var vw = Math.max(320, window.innerWidth || 1024), vh = Math.max(400, window.innerHeight || 768);
          var pk = null, stop = null, seen = false, gone = false, muteT = 0;
          var onKey = function (e) { if (e.key === 'Escape') { e.stopPropagation(); fin(null); } };
          var fin = function (v, bad) {
            if (gone) return;
            gone = true;
            clearTimeout(muteT);
            document.removeEventListener('keydown', onKey, true);
            if (stop) stop();
            try { if (pk) { pk.setVisible(false); pk.dispose(); } } catch (e2) {}
            if (bad) rej(bad); else res(v);
          };
          var b = new P.PickerBuilder()
            .setOAuthToken(t)
            .setAppId(appId())
            .setOrigin(location.protocol + '//' + location.host)
            .setSize(Math.min(vw - 16, 1051), Math.min(vh - 16, 650))
            .setLocale(isAr() ? 'ar' : 'en')
            .addView(tree)
            .addView(flat)
            .setTitle(o.title || L('اخترْ ملفَّ PDF من درايف', 'Pick a PDF from Drive'))
            .setCallback(function (d) {
              seen = true;
              if (!d || !d.action) return;
              if (d.action === P.Action.CANCEL) { fin(null); return; }
              if (d.action !== P.Action.PICKED) return;
              var f = (d.docs || [])[0];
              fin(f ? { id: f.id, name: f.name || '', size: Number(f.sizeBytes) || 0, mime: f.mimeType || '' } : null);
            });
          try {
            if (pickerKey()) b.setDeveloperKey(pickerKey());
            pk = b.build();
            document.addEventListener('keydown', onKey, true);
            stop = wayOut(function () { fin(null); });
            pk.setVisible(true);
            muteT = setTimeout(function () { if (!seen && !document.querySelector('.picker-dialog iframe')) fin(null, err('picker_mute')); }, MUTE_MS);
          } catch (e) {
            fin(null, err('picker_failed', e && e.message));
          }
        });
      });
    });
  }

  window.GardenDrive = {
    enabled: enabled,
    warm: warm,
    token: token,
    forget: forget,
    linked: linked,
    linkedEmail: linkedEmail,
    linkKnown: linkKnown,
    linkStatus: linkStatus,
    linkNow: linkNow,
    unlink: unlink,
    declined: declined,
    declineLink: declineLink,
    askLink: askLink,
    maybeOffer: maybeOffer,
    pick: pick,
    meta: meta,
    download: download,
    reason: reason,
    linkReason: linkReason
  };
})();
