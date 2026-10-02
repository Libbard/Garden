/*@3.SYPJ.1*/
;(function () {
  'use strict';

  var ROOT = (function () {
    var s = document.currentScript;
    return (s && s.src) ? s.src.replace(/shared\/sync-panel\.js(\?.*)?$/, '')
                        : (location.origin + '/');
  })();

  function isAr() { try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; } catch (e) { return true; } }
  function L(a, e) { return isAr() ? a : e; }
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function G() { return window.GardenSync; }
  function linked() { var g = G(); return !!(g && g.getKey && g.getKey()); }
  /*@3.SYPJ.2*/
  function everSynced() {
    var g = G();
    try { return !!(g && g.lastSync && g.lastSync()); } catch (e) { return false; }
  }

  function lsJSON(k, f) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? f : v; } catch (e) { return f; }
  }
  var _nsMod = null;
  function notesStore() {
    if (window.GardenNotesStore) return Promise.resolve(window.GardenNotesStore);
    if (_nsMod) return _nsMod;
    _nsMod = new Promise(function (k) {
      var sc = document.createElement('script');
      sc.src = ROOT + 'shared/notes-store.js';
      sc.onload = function () { k(window.GardenNotesStore || null); };
      sc.onerror = function () { _nsMod = null; k(null); };
      document.head.appendChild(sc);
    });
    return _nsMod;
  }
  function fileHomes() {
    var idx = lsJSON('notes_index', []), fl = lsJSON('notes_folders', []), byId = {}, out = {};
    if (!Array.isArray(idx) || !idx.length) return Promise.resolve(out);
    (Array.isArray(fl) ? fl : []).forEach(function (f) { if (f && f.id) byId[f.id] = f; });
    var path = function (id) {
      var p = [], cur = byId[id], n = 0;
      while (cur && n++ < 8) { p.unshift(cur.n || L('مجلّد', 'Folder')); cur = (cur.p && cur.p !== cur.id) ? byId[cur.p] : null; }
      return p.join(' / ');
    };
    var put = function (ref, rec) {
      if (ref && !out[ref]) out[ref] = { dir: rec.f ? path(rec.f) : '', course: (rec.o && rec.o.c) || '' };
    };
    return notesStore().then(function (St) {
      if (!St) return out;
      return Promise.all(idx.map(function (rec) {
        if (!rec || !rec.id) return null;
        return St.getDoc(rec.id).then(function (row) {
          var d = row && row.doc;
          if (!d) return;
          if (d.pdf && d.pdf.h) put('pdf_' + String(d.pdf.h).slice(0, 40), rec);
          (Array.isArray(d.aud) ? d.aud : []).forEach(function (it) {
            if (!it) return;
            put(it.i, rec);
            if (it.g) put(String(it.g), rec);
          });
        }, function () {});
      })).then(function () { return out; });
    }).catch(function () { return out; });
  }

  var _gdMod = null;
  function gdOn() { return !!(window.GardenEndpoints && window.GardenEndpoints.googleClientId); }
  function needDrive() {
    if (window.GardenDrive) return Promise.resolve(window.GardenDrive);
    if (_gdMod) return _gdMod;
    _gdMod = new Promise(function (res, rej) {
      var el = document.createElement('script');
      el.src = ROOT + 'shared/drive.js';
      el.onload = function () { if (window.GardenDrive) res(window.GardenDrive); else rej(new Error('no api')); };
      el.onerror = function () { _gdMod = null; rej(new Error('load')); };
      document.head.appendChild(el);
    });
    return _gdMod;
  }

  function ensureCSS() {
    if (document.querySelector('link[data-sync-panel]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = ROOT + 'shared/sync-panel.css';
    l.setAttribute('data-sync-panel', '1');
    document.head.appendChild(l);
  }

  function bytes(n) {
    var u = ['B', 'KB', 'MB', 'GB'], i = 0, v = Number(n) || 0;
    while (v >= 1024 && i < 3) { v /= 1024; i++; }
    return (i === 0 || v >= 100 ? Math.round(v) : v.toFixed(1)) + ' ' + u[i];
  }

  function filesAr(n) {
    if (!n) return 'لا ملفَّ محفوظاً بعد';
    if (n === 1) return 'ملفٌّ واحدٌ محفوظ';
    if (n === 2) return 'ملفّان محفوظان';
    if (n >= 3 && n <= 10) return n + ' ملفّاتٍ محفوظة';
    return n + ' ملفّاً محفوظاً';
  }

  function ago(ts) {
    if (!ts) return L('لم تُزامَن بعد', 'not synced yet');
    var m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return L('الآن', 'just now');
    if (m < 60) return L('قبل ' + m + ' دقيقة', m + 'm ago');
    var h = Math.floor(m / 60);
    if (h < 24) return L('قبل ' + h + ' ساعة', h + 'h ago');
    return L('قبل ' + Math.floor(h / 24) + ' يوم', Math.floor(h / 24) + 'd ago');
  }

  /*@3.SYPJ.3*/
  function errText(e) {
    var m = (e && e.message) || String(e || '');
    if (/no-match/.test(m))              return L('البريدُ أو كلمةُ السر غير صحيحة.', 'Email or password is incorrect.');
    if (/too-many/.test(m))              return L('محاولاتٌ كثيرة. جرّب بعد ساعة.', 'Too many attempts. Try again in an hour.');
    if (/pair-expired|bad-code/.test(m)) return L('الرمزُ غير صحيح أو انتهت مدّتُه.', 'That code is wrong or expired.');
    if (/weak-pass:short/.test(m))       return L('كلمةُ السر قصيرة — ثمانيةُ محارفَ فأكثر.', 'Password too short — 8 characters or more.');
    if (/weak-pass/.test(m))             return L('اختر كلمةَ سرٍّ أصعب.', 'Choose a stronger password.');
    if (/bad-email/.test(m))             return L('البريدُ غير صحيح.', 'That email looks wrong.');
    if (/eid-full/.test(m))              return L('هذا البريدُ مستعملٌ كثيراً. جرّب بريداً آخر.', 'This email is used too often. Try another.');
    if (/gsi-cancelled/.test(m))         return L('أُلغيت العملية.', 'Cancelled.');
    if (/gsi-unavailable/.test(m))       return L('تعذّر فتحُ قوقل الآن.', 'Could not open Google right now.');
    if (/no-vault/.test(m))              return L('لا حسابَ بعد.', 'No account yet.');
    /*@3.SYPJ.20*/
    if (/vault-locked/.test(m))          return L('حسابُك محميّ — أدخل ما فعّلتَ به الحماية.', 'Your account is protected — enter what you protected it with.');
    if (/google-in-use/.test(m))         return L('حسابُ قوقل هذا مرتبطٌ بحسابٍ آخر.', 'That Google account is linked to another account.');
    if (/guard-unavailable/.test(m))     return L('تعذّر الوصولُ إلى خادم الحماية. أعد المحاولة.', 'Could not reach the protection server. Try again.');
    return downWord();
  }

  /*@3.SYPJ.46*/
  /*@3.SYPJ.48*/
  function downWord() {
    if (navigator.onLine === false) {
      return L('لا اتصالَ بالإنترنت عندك الآن. عملُك محفوظٌ في جهازك وسيُرفَع حين يعود الاتصال.',
               'You are offline. Your work is saved on this device and will upload when you are back.');
    }
    var g = G(), q = g && g.quotaBlock && g.quotaBlock();
    if (q) {
      var why = (g.quotaMessage ? g.quotaMessage(q) : '');
      return L('المزامنةُ متوقّفةٌ عند حدٍّ لا عن عطلٍ في الخادم. ',
               'Syncing stopped at a limit, not a server fault. ') + why +
        L(' وبقيّةُ عملك محفوظةٌ في جهازك، ولن تُستأنف المزامنةُ حتى تُعالَج.',
          ' The rest of your work is safe on this device, and syncing will not resume until this is handled.');
    }
    return L('خادمُ المزامنة متوقّفٌ مؤقّتاً للصيانة وسيعود قريباً. عملُك محفوظٌ في جهازك ولم يضِع منه شيء.',
             'The sync server is briefly down for maintenance and will be back soon. Your work is saved on this device and nothing is lost.');
  }

  /*@3.SYPJ.4*/
  function door(v, icon, t, sub, mod) {
    return '<button type="button" class="sp-door' + (mod ? ' sp-door--' + mod : '') + '" data-sp="' + v + '">' +
      '<span class="sp-door-i"><i class="fa-solid ' + icon + '"></i></span>' +
      '<span class="sp-door-t">' + esc(t) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span>' +
      '<i class="fa-solid fa-chevron-left sp-door-c"></i></button>';
  }
  function btn(v, icon, t, mod) {
    var c = 'sp-btn';
    if (mod) mod.split(' ').forEach(function (m) { if (m) c += ' sp-btn--' + m; });
    return '<button type="button" class="' + c + '" data-sp="' + v + '">' +
      (icon ? '<i class="fa-solid ' + icon + '"></i>' : '') + esc(t) + '</button>';
  }
  function back(to, label) {
    return '<button type="button" class="sp-back" data-sp="to-' + to + '">' +
      '<i class="fa-solid fa-chevron-right"></i>' + esc(label || L('رجوع', 'Back')) + '</button>';
  }
  function emailPass(auto) {
    return '<label class="sp-lbl" for="sp-em">' + esc(L('البريد', 'Email')) + '</label>' +
      '<input id="sp-em" class="sp-in" type="email" autocomplete="email" inputmode="email" dir="ltr">' +
      '<label class="sp-lbl" for="sp-pw">' + esc(L('كلمة السر', 'Password')) + '</label>' +
      '<input id="sp-pw" class="sp-in" type="password" autocomplete="' + auto + '" dir="ltr">';
  }

  /*@3.SYPJ.5*/
  function Panel(host, opts) {
    this.host = host;
    this.opts = opts || {};
    this.view = 'auto';
    this.busy = false; this.msg = '';
    /*@3.SYPJ.40*/
    this.err = this.opts.notice ? errText(new Error(this.opts.notice)) : '';
    this.pair = null; this.pairErr = null; this.tick = null; this.devs = null; this.qr = '';
    this.devArmed = false; this.devOrphans = 0;
    this.guard = null; this.guardErr = false;
    host.classList.add('sp');
    /*@3.SYPJ.6*/
    var self = this;
    this._onLang = function () { if (self.host && self.host.isConnected) self.paint(); };
    document.addEventListener('garden:languageChanged', this._onLang);
    /*@3.SYPJ.26*/
    this._onLock = function () { self.loadGuard(); };
    window.addEventListener('garden:vaultLocked', this._onLock);
    this.paint();
    this.loadGuard();
    this.loadDevices();
    this.loadFiles();
  }

  Panel.prototype.destroy = function () {
    if (this.tick) { clearInterval(this.tick); this.tick = null; }
    if (this._onLang) { document.removeEventListener('garden:languageChanged', this._onLang); this._onLang = null; }
    if (this._onLock) { window.removeEventListener('garden:vaultLocked', this._onLock); this._onLock = null; }
  };

  /*@3.SYPJ.27*/
  Panel.prototype.loadGuard = function () {
    var self = this, g = G();
    if (!g || !g.guardState || !linked()) return;
    g.guardState()
      .then(function (s) { self.set({ guard: s, guardErr: false }); })
      .catch(function () { self.set({ guard: null, guardErr: true }); });
  };
  /*@3.SYPJ.34*/
  Panel.prototype.settle = function () {
    var self = this, g = G();
    if (!g || !g.guardState) { this.set({ view: 'home', busy: false }); this.done(); return; }
    return g.guardState().then(function (s) {
      var locked = !!(s && s.armed && !s.unlocked);
      self.set({
        guard: s, guardErr: false, busy: false,
        view: locked ? 'locked' : 'home',
        msg: locked
          ? L('مفتاحُك مقبول — وهذا الحسابُ محميّ. افتحْه على هذا الجهاز لتبدأ المزامنة.',
              'Your key is accepted — and this account is protected. Unlock it on this device to start syncing.')
          : L('استُعيدت بياناتك.', 'Your data is back.'),
      });
      if (!locked) self.done();
    }).catch(function () {
      /*@3.SYPJ.35*/
      self.set({ guard: null, guardErr: true, busy: false, view: 'home',
                 msg: L('قُبل المفتاح — ولم نتحقّق من حالة الحماية بعد.',
                        'The key was accepted — protection state not verified yet.') });
      self.done();
    });
  };

  Panel.prototype.isLocked = function () {
    return !!(this.guard && this.guard.armed && !this.guard.unlocked);
  };
  Panel.prototype.set = function (p) { for (var k in p) this[k] = p[k]; this.paint(); };
  Panel.prototype.go = function (v) { this.set({ view: v, err: '', msg: '', pairErr: null }); };
  Panel.prototype.fail = function (e) { this.set({ busy: false, err: errText(e) }); };
  Panel.prototype.val = function (id) { var e = this.host.querySelector('#' + id); return e ? e.value.trim() : ''; };

  Panel.prototype.paint = function () {
    var g = G();
    if (!g) { this.host.innerHTML = '<p class="sp-hint">' + esc(L('المزامنة غير متاحة هنا.', 'Sync is unavailable here.')) + '</p>'; return; }
    /*@3.SYPJ.30*/
    var v = this.view;
    if (v === 'auto') v = linked() ? (this.isLocked() ? 'locked' : 'home') : 'pick';
    this.cur = v;

    var st = linked() ? ((g.status && g.status()) || 'offline') : 'off';
    /*@3.SYPJ.7*/
    if (linked() && !everSynced() && st !== 'error' && st !== 'loading') st = 'unconfirmed';
    if (this.isLocked()) st = 'locked';
    this.host.setAttribute('data-state', st);

    /*@3.SYPJ.8*/
    var solo = (v === 'pair');
    var body =
        v === 'pick'    ? this.vPick()
      : v === 'have'    ? this.vHave()
      : v === 'pair'    ? this.vPair()
      : v === 'key'     ? this.vKey()
      : v === 'code'    ? this.vCode()
      : v === 'paste'   ? this.vPaste()
      : v === 'recover' ? this.vForm('recover')
      : v === 'vouch'   ? this.vForm('vouch')
      : v === 'unlink'  ? this.vUnlink()
      : v === 'shield'  ? this.vShield()
      : v === 'locked'  ? this.vLocked()
      : v === 'disarm'  ? this.vDisarm()
      : v === 'drive'   ? this.vDrive()
      : v === 'files'   ? this.vFileList()
      :                   this.vHome();

    this.host.innerHTML = (solo ? '' : this.hero(st)) + body + this.msgBox();
    this.bind();
    this.startTick();
  };

  Panel.prototype.hero = function (st) {
    var g = G();
    /*@3.SYPJ.9*/
    var ic = { synced: 'fa-circle-check', loading: 'fa-arrows-rotate', pending: 'fa-cloud-arrow-up',
               error: 'fa-triangle-exclamation', offline: 'fa-cloud', off: 'fa-cloud',
               unconfirmed: 'fa-cloud-arrow-up', locked: 'fa-lock' };
    var ti = {
      synced:  L('كلُّ شيءٍ محفوظ', 'Everything is saved'),
      loading: L('جارٍ الحفظ…', 'Saving…'),
      pending: L('تغييراتٌ لم تُرفع بعد', 'Changes not uploaded yet'),
      /*@3.SYPJ.47*/
      error:   (navigator.onLine === false)
                 ? L('لا اتصالَ بالإنترنت', 'You are offline')
                 : L('الخادمُ متوقّفٌ مؤقّتاً للصيانة', 'Server briefly down for maintenance'),
      offline: L('مرتبط', 'Linked'),
      off:     L('على هذا الجهاز فقط', 'This device only'),
      unconfirmed: L('مفتاحُك جاهز — ولم يصل الخادمَ بعد', 'Your key is ready — the server has not seen it yet'),
      locked:  L('حسابُك محميّ — افتحه على هذا الجهاز', 'Your account is protected — unlock it on this device')
    };
    var sub = (st === 'off')
      ? L('عملُك محفوظٌ هنا ولن يتبعك إلى جهازٍ آخر.', 'Your work lives here and will not follow you elsewhere.')
      : (st === 'error')
      ? downWord()
      : (st === 'unconfirmed')
      ? L('لا تعتمد عليه حتى تنجح مزامنةٌ واحدة — اضغط زرَّ المزامنة بجانبه.',
          'Do not rely on it until one sync succeeds — press the sync button beside it.')
      : (st === 'locked')
      ? L('عملُك على هذا الجهاز سليمٌ ولم يُمَسّ — لكنّه لا يُرفَع ولا ينزل حتى تُثبت أنك أنت.',
          'Your work on this device is intact and untouched — but it will not upload or download until you prove it is you.')
      : L('آخرُ مزامنة: ', 'Last sync: ') + ago(g.lastSync && g.lastSync());
    return '<div class="sp-hero">' +
      '<span class="sp-orb"><i class="fa-solid ' + (ic[st] || ic.offline) + '"></i></span>' +
      '<span class="sp-hero-t"><b>' + esc(ti[st] || ti.offline) + '</b><small>' + esc(sub) + '</small></span>' +
      (linked() ? '<button type="button" class="sp-mini" data-sp="now" title="' +
                  esc(L('زامن الآن', 'Sync now')) + '"><i class="fa-solid fa-rotate"></i></button>' : '') +
      '</div>';
  };

  Panel.prototype.vPick = function () {
    return '<p class="sp-hint">' + esc(L(
      'اربط جهازك ليتبعك عملُك إلى جوّالك، ويعود إليك لو غيّرتَ الجهاز أو مسحتَ المتصفّح.',
      'Link this device so your work follows you to your phone — and comes back if you switch devices or clear your browser.')) + '</p>' +
      '<div class="sp-doors">' +
      door('new', 'fa-wand-magic-sparkles', L('هذا جهازي الأول', 'This is my first device'),
           L('يُنشأ حسابُك في ثانية — بلا بريدٍ ولا كلمة سرّ', 'Created in a second — no email, no password'), 'go') +
      door('have', 'fa-link', L('عندي حسابٌ بالفعل', 'I already have an account'),
           L('من جهازٍ آخر، أو استعادةٌ بعد فقدِه', 'From another device, or restore after losing it')) +
      (this.opts.allowSkip ? door('skip', 'fa-clock-rotate-left', L('لاحقاً', 'Later'),
           L('كلُّ شيءٍ يعمل هنا، وتستطيع الربطَ متى شئت', 'Everything works here; link any time')) : '') +
      '</div>';
  };

  Panel.prototype.vHave = function () {
    return '<div class="sp-doors">' +
      door('code', 'fa-qrcode', L('عندي رمزُ ربطٍ من جهازي الآخر', 'I have a link code'),
           L('افتح الحديقة هناك ⇐ المزامنة ⇐ «اربط جهازاً»', 'Open the Garden there ⇒ Sync ⇒ "Link a device"')) +
      door('recover', 'fa-key', L('أدخل ببريدي وكلمة سرّي', 'Use my email and password'),
           L('إن كنتَ حفظتَ نسخةً من مفتاحك من قبل', 'If you saved a copy of your key before')) +
      door('paste', 'fa-file-lines', L('عندي مفتاحي مكتوباً', 'I have my key written down'),
           L('من ملفِّ الاسترجاع أو الرمز المطبوع', 'From your recovery file or printed code')) +
      '</div>' + back(linked() ? 'auto' : 'pick');
  };

  /*@3.SYPJ.10*/
  Panel.prototype.vHome = function () {
    var g = G();
    var hasRec = g.hasRecovery && g.hasRecovery();
    var gAvail = g.googleAvailable && g.googleAvailable();

    /*@3.SYPJ.11*/
    var h = '<div class="sp-doors sp-doors--2">' +
      door('pair', 'fa-mobile-screen-button', L('اربط جهازاً آخر', 'Link another device'),
           L('رمزٌ يظهر هنا وتمسحه بجوّالك — صالحٌ ثلاثَ دقائق', 'A code appears here; scan it with your phone — valid 3 minutes'), 'go') +
      door('key', 'fa-key', L('مفتاحي ونسخُه', 'My key and its copies'),
           L('انسخه أو نزّله أو اطبعه', 'Copy, download, or print it')) +
      '</div>';

    /*@3.SYPJ.21*/
    var gd = this.guard;
    var armed = !!(gd && gd.armed);
    /*@3.SYPJ.41*/
    if (!gd && !this.guardErr) {
      return h + '<div class="sp-sec"><div class="sp-vouch"><b>' +
        '<i class="fa-solid fa-spinner fa-spin"></i>' +
        esc(L('جارٍ قراءةُ حالةِ الحماية…', 'Reading protection state…')) + '</b><small>' +
        esc(L('لحظةً — لا نقول «مفعَّلةٌ» ولا «مطفأة» قبل أن نعرف.',
              'One moment — we will not say “on” or “off” before we know.')) +
        '</small></div></div>';
    }
    /*@3.SYPJ.28*/
    if (this.guardErr) {
      return h + '<div class="sp-sec"><div class="sp-vouch"><b>' +
        '<i class="fa-solid fa-circle-question"></i>' +
        esc(L('تعذّر قراءةُ حالةِ الحماية', 'Could not read protection state')) + '</b><small>' +
        esc(L('لا نعرف الآن إن كانت مفعَّلةً أم لا، فلا نقول لك أحدَهما. تحقّق من اتصالك وأعد المحاولة — وإن كانت المزامنةُ متوقّفةً فقد يكون حسابُك محميّاً ويحتاج فتحاً على هذا الجهاز.',
              'We do not know right now whether it is on, so we will not claim either. Check your connection and retry — and if sync is stopped, your account may be protected and need unlocking on this device.')) +
        '</small><div class="sp-acts">' +
        btn('guard-retry', 'fa-rotate', L('أعد المحاولة', 'Retry')) +
        btn('locked', 'fa-lock-open', L('افتحْ هذا الجهاز', 'Unlock this device')) +
        '</div></div></div>' +
        '<div class="sp-acts" style="margin-top:1.1rem">' +
        btn('disconnect', 'fa-arrow-right-from-bracket', L('فصلُ هذا الجهاز', 'Disconnect this device'), 'danger wide') +
        '</div>';
    }
    h += '<div class="sp-sec">' + (armed
      ? '<div class="sp-vouch sp-vouch--ok"><b><i class="fa-solid fa-shield-halved"></i>' +
          esc(L('حسابُك محميّ', 'Your account is protected')) + '</b><small>' +
          esc(this.doorsText(gd)) + '</small><small>' +
          esc(L('مفتاحُك وحدَه لم يعد يكفي لفتح بياناتك على جهازٍ جديد — يُطلب معه ما فعّلتَ به الحماية.',
                'Your key alone no longer opens your data on a new device — what you protected it with is required too.')) +
          '</small><div class="sp-acts">' +
          btn('shield', 'fa-sliders', L('إدارةُ الحماية', 'Manage protection')) + '</div></div>'
      /*@3.SYPJ.12*/
      : '<div class="sp-vouch"><b><i class="fa-solid fa-shield-halved"></i>' +
          esc(L('حماية الحساب — مطفأة', 'Account protection — off')) + '</b><small>' +
          esc(L('اليومَ مفتاحُك وحدَه يفتح بياناتك: من يقرؤه في رسالةٍ أو لقطةِ شاشةٍ يقرأ جدولك ودرجاتك. فعّلْ بريداً وكلمةَ سرٍّ أو حسابَ قوقل، فلا تُقبل المزامنةُ بعدها إلا بأحدهما.',
                'Today your key alone opens your data: whoever reads it in a message or a screenshot reads your schedule and grades. Turn on an email and password, or a Google account, and sync will then require one of them.')) +
          '</small>' +
          (hasRec ? '<small>' + esc(L('ولك نسخةٌ محفوظةٌ من مفتاحك أصلاً — وهي طريقُ عودةٍ لا قفلٌ.',
                                      'You already have a saved copy of your key — that is a way back, not a lock.')) + '</small>' : '') +
          (gAvail ? '<div class="sp-gbtn" id="sp-gbtn"></div>' : '') +
          '<div class="sp-acts">' + btn('vouch', 'fa-envelope', L('ببريدٍ وكلمة سرّ', 'With email and password')) +
          (hasRec ? btn('unlink', 'fa-link-slash', L('احذف النسخةَ المحفوظة', 'Delete the saved copy'), 'quiet') : '') +
          '</div></div>');
    h += '</div>';

    /*@3.SYPJ.42*/
    if (this.devs && this.devs.length) {
      var dArmed = !!this.devArmed;
      h += '<div class="sp-sec"><p class="sp-sec-t">' + esc(L('أجهزتك', 'Your devices')) + '</p>' +
        this.devs.map(function (d) {
          var live = dArmed && d.proven;
          return '<div class="sp-dev"><i class="fa-solid fa-display"></i>' +
            '<span class="sp-dev-n">' + esc(d.name || L('جهاز', 'Device')) +
            '<small>' + esc(ago(Date.parse(d.last_seen)) +
              (dArmed ? ' · ' + (live ? L('أثبت هويّتَه', 'proven')
                                      : L('لا إثباتَ له — مقفل', 'not proven — locked')) : '')) +
            '</small></span>' +
            (d.isMe ? '<span class="sp-dev-me">' + esc(L('هذا الجهاز', 'this one')) + '</span>'
                    : '<button type="button" class="sp-x" data-sp="forget" data-v="' + esc(d.device_id) +
                      '" title="' + esc(live ? L('اطردْ هذا الجهاز', 'Sign this device out')
                                             : L('إزالة من القائمة', 'Remove from the list')) +
                      '"><i class="fa-solid fa-xmark"></i></button>') +
            '</div>';
        }).join('');
      h += '<p class="sp-note' + (dArmed ? '' : ' sp-note--warn') + '">' + (dArmed
        ? '<i class="fa-solid fa-shield-halved"></i> ' + esc(L(
            'طردُ جهازٍ من هنا يُبطل إثباتَه فعلاً: تتوقّف مزامنتُه حتى يُفتح من جديد. وبياناتُه المحفوظةُ عليه تبقى كما هي.',
            'Signing a device out from here really revokes its proof: its sync stops until it is unlocked again. Data already on it stays as it is.'))
        /*@3.SYPJ.43*/
        : '<i class="fa-solid fa-triangle-exclamation"></i> ' + esc(L(
            'الحمايةُ مطفأة، فالإزالةُ من هذه القائمة لا تمنع الجهازَ من المزامنة — مفتاحُك وحدَه يكفيه. فعّلِ الحماية أعلاه ليصير الطردُ نافذاً.',
            'Protection is off, so removing a device here does not stop it from syncing — your key alone is enough for it. Turn on protection above to make signing out effective.'))) +
        '</p>';
      /*@3.SYPJ.44*/
      if (dArmed && this.devOrphans > 0) {
        h += '<p class="sp-note"><i class="fa-solid fa-circle-info"></i> ' + esc(L(
          'وثمّ ' + this.devOrphans + ' جلسةً مفتوحةً لا تُنسَب إلى جهازٍ في هذه القائمة، فلا يبلغها الطردُ من هنا — اطردها من «إدارةِ الحماية».',
          'And ' + this.devOrphans + ' open session(s) are not tied to a device in this list, so signing out here does not reach them — use "Manage protection".')) +
          '</p>';
      }
      h += '</div>';
    }

    if (this.files) h += this.vFiles(this.files);
    if (gdOn()) {
      h += '<div class="sp-sec"><p class="sp-sec-t">' + esc(L('قوقل درايف', 'Google Drive')) + '</p><div class="sp-doors">' +
        door('drive', 'fa-cloud', L('درايفي', 'My Drive'), this.drvSub(), 'gd') + '</div></div>';
    }

    h += '<div class="sp-acts" style="margin-top:1.1rem">' +
      btn('disconnect', 'fa-arrow-right-from-bracket', L('فصلُ هذا الجهاز', 'Disconnect this device'), 'danger wide') + '</div>';
    return h;
  };

  Panel.prototype.drvSub = function () {
    var GD = window.GardenDrive;
    if (GD && GD.linked()) return L('موصولٌ على كلِّ أجهزتك', 'Connected on all your devices') + (GD.linkedEmail() ? ' · ' + GD.linkedEmail() : '');
    return L('افتحْ ملفّاتِ PDF من درايفك', 'Open PDF files from your Drive');
  };

  Panel.prototype.loadDrive = function () {
    var self = this;
    if (this.drvBusy) return;
    this.drvBusy = true;
    needDrive().then(function (GD) { return GD.linkStatus(); }).then(function (st) {
      self.drvBusy = false;
      self.drv = st || { unknown: true };
      if (self.view === 'drive') self.paint();
    }, function () {
      self.drvBusy = false;
      self.drv = { unknown: true, why: 'load' };
      if (self.view === 'drive') self.paint();
    });
  };

  /*@3.SYPJ.49*/
  Panel.prototype.vDrive = function () {
    var d = this.drv;
    if (!d) {
      this.loadDrive();
      return '<div class="sp-vouch"><b><i class="fa-solid fa-spinner fa-spin"></i>' +
        esc(L('تُقرأ حالُ درايف…', 'Reading Drive status…')) + '</b></div>' + back('home');
    }
    var GD = window.GardenDrive;
    var head, body, acts = '', warn = '';
    if (d.unknown) {
      head = L('تعذّر قراءةُ حالِ درايف الآن', 'Could not read the Drive status right now');
      body = d.why === 'drive_not_configured'
        ? L('ربطُ درايف لم يُفعَّل على خادمنا بعد. فتحُ ملفٍّ من درايف يعمل على هذا الجهاز بإذنٍ مؤقّت.',
            'Drive linking is not enabled on our server yet. Opening a file from Drive still works on this device with a temporary permission.')
        : L('تحقّقْ من اتّصالك ثمّ أعِدْ المحاولة. فتحُ ملفٍّ من درايف يبقى ممكناً على هذا الجهاز.',
            'Check your connection and retry. Opening a file from Drive still works on this device.');
      acts = btn('drv-retry', 'fa-rotate-right', L('أعِدِ المحاولة', 'Retry'), 'wide');
    } else if (d.linked) {
      head = L('موصولٌ على كلِّ أجهزتك', 'Connected on all your devices');
      body = L('الإذنُ محفوظٌ مشفَّراً في حسابك عندنا، فيفتح جوّالُك ملفّاتِ درايف بلا دخولٍ جديد. لا نرى إلا الملفّاتِ التي تختارها أنت.',
               'The permission is kept encrypted in your account, so your phone opens your Drive files with no new sign-in. We only see the files you pick.');
      acts = btn('drv-off', 'fa-link-slash', L('افصلْ درايف', 'Disconnect Drive'), 'danger wide');
    } else {
      var here = GD && GD.declined();
      head = here ? L('درايف على هذا الجهاز وحدَه', 'Drive on this device only') : L('درايف غيرُ موصول', 'Drive is not connected');
      body = L('حين تفتح ملفّاً من درايف يطلب قوقلُ إذنَك على هذا الجهاز لساعة. اربطْه بحسابك ليجده جوّالُك وأجهزتُك الأخرى.',
               'When you open a file from Drive, Google asks for your permission on this device for an hour. Link it to your account so your phone and other devices find it too.');
      if (!d.armed) {
        warn = '<small class="sp-warn-s"><i class="fa-solid fa-shield-halved"></i> ' +
          esc(L('لحفظ الإذن في حسابك احمِ حسابَك أوّلاً — كي لا يدخلَه أحدٌ سواك.', 'To keep the permission in your account, protect your account first — so nobody but you can get in.')) + '</small>';
        acts = btn('shield', 'fa-shield-halved', L('احمِ حسابي', 'Protect my account'), 'wide');
      } else {
        acts = btn('drv-all', 'fa-cloud', L('اربطْه بكلِّ أجهزتي', 'Link it to all my devices'), 'gd wide');
      }
    }
    return '<div class="sp-vouch sp-vouch--gd"><b><i class="fa-brands fa-google-drive"></i>' + esc(head) + '</b>' +
      (d.linked && d.email ? '<small class="sp-num" dir="ltr">' + esc(d.email) + '</small>' : '') +
      '<small>' + esc(body) + '</small>' + warn + '</div>' +
      '<div class="sp-acts">' + acts + '</div>' + back('home');
  };

  Panel.prototype.vFiles = function (a) {
    var used = Number(a.used) || 0, max = Number(a.max_vault) || 0;
    var n = (a.files || []).filter(notPic).length;
    var pc = max ? Math.min(100, Math.round(used * 100 / max)) : 0;
    return '<div class="sp-sec"><p class="sp-sec-t">' + esc(L('ملفّاتُك عندنا', 'Your files with us')) + '</p>' +
      '<div class="sp-vouch"><b><i class="fa-solid fa-cloud"></i>' +
      '<span class="sp-num">' + esc(bytes(used)) + (max ? ' / ' + esc(bytes(max)) : '') + '</span></b>' +
      (max ? '<div class="sp-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pc +
             '" aria-label="' + esc(L('المساحةُ المستعملة', 'Space used')) + '"><span style="--p:' + pc + '%"></span></div>' : '') +
      '<small>' + esc(L(filesAr(n) + ' — تفتح على أجهزتك كلِّها.',
                        (n === 1 ? '1 file kept' : n + ' files kept') + ' — they open on all your devices.')) + '</small>' +
      '<small>' + esc(vowText()) + '</small>' + picLine(a.files) +
      (n ? '<div class="sp-acts">' + btn('files', 'fa-folder-open', L('استعرضْ ملفّاتي واحذفْ ما لا أحتاجه', 'Review my files and delete what I do not need'), 'wide') + '</div>' : '') +
      '</div></div>';
  };

  function isPic(f) { return /^image\//.test((f && f.mime) || ''); }
  function notPic(f) { return !isPic(f); }
  function picLine(files) {
    var ps = (files || []).filter(isPic);
    if (!ps.length) return '';
    var b = ps.reduce(function (n, f) { return n + (Number(f.stored_bytes) || 0); }, 0);
    var k = ps.length;
    var ar = k === 1 ? 'صورةٌ واحدة' : k === 2 ? 'صورتان' : (k + (k <= 10 ? ' صور' : ' صورة'));
    return '<small class="sp-pics"><i class="fa-solid fa-image"></i> ' +
      esc(L(ar + ' من ملاحظاتك · ', (k === 1 ? '1 image' : k + ' images') + ' from your notes · ')) +
      '<span class="sp-num">' + esc(bytes(b)) + '</span> — ' +
      esc(L('تبقى حتى نهاية الفصل وتصل أجهزتَك كلَّها، والأصلُ باقٍ على الجهاز الذي أُلصقت فيه.',
            'kept until the end of the term and reach all your devices; the original stays on the device it was pasted on.')) +
      '</small>';
  }

  function vowText() {
    return L('نضمن حفظَ الملفِّ ثلاثةَ أيّامٍ على الأقلّ، وبعدها — إذا امتلأت مساحتُك عندنا — نحذف الأقدمَ أوّلاً ليدخل الجديد. ' +
             'أمّا رسمُك وملاحظاتُك فمحفوظةٌ باستمرارٍ ولا تُحذف، والأصلُ باقٍ على جهازك.',
             'We keep each file for at least three days; after that, if your space with us fills up, we remove the oldest first to make room. ' +
             'Your drawings and notes are kept continuously and never deleted, and the original stays on your device.');
  }

  function fileDay(t) {
    try {
      return new Date(t).toLocaleDateString(L('ar', 'en'), { weekday: 'long' });
    } catch (e) { return ''; }
  }

  function fileCount(n) {
    if (n === 1) return L('ملفٌّ واحد', '1 file');
    if (n === 2) return L('ملفّان', '2 files');
    return L(n + (n <= 10 ? ' ملفّات' : ' ملفّاً'), n + ' files');
  }

  Panel.prototype.vFileList = function () {
    var a = this.files, self = this;
    if (!a) {
      this.loadFiles();
      return '<div class="sp-vouch"><b><i class="fa-solid fa-spinner fa-spin"></i>' +
        esc(L('تُقرأ ملفّاتُك…', 'Reading your files…')) + '</b></div>' + back('home');
    }
    var used = Number(a.used) || 0, max = Number(a.max_vault) || 0;
    var keep = (Number(a.keep_days) || 3) * 86400000;
    var pc = max ? Math.min(100, Math.round(used * 100 / max)) : 0;
    var now = Date.now(), arm = this.fArm, mode = this.fSort || 'size';
    var sel = this.fSel || (this.fSel = {});
    var all = (a.files || []).filter(notPic);
    Object.keys(sel).forEach(function (k) {
      if (!all.some(function (f) { return f.ref_id === k; })) delete sel[k];
    });
    var bySize = function (x, y) { return (Number(y.stored_bytes) || 0) - (Number(x.stored_bytes) || 0); };
    var byAge = function (x, y) { return Date.parse(x.created_at) - Date.parse(y.created_at); };
    all.sort(mode === 'old' ? byAge : bySize);

    var h = '<div class="sp-sec"><p class="sp-sec-t">' + esc(L('ملفّاتُك عندنا', 'Your files with us')) + '</p>' +
      '<div class="sp-vouch"><b><i class="fa-solid fa-cloud"></i>' +
      '<span class="sp-num">' + esc(bytes(used)) + (max ? ' / ' + esc(bytes(max)) : '') + '</span></b>' +
      (max ? '<div class="sp-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pc +
             '" aria-label="' + esc(L('المساحةُ المستعملة', 'Space used')) + '"><span style="--p:' + pc + '%"></span></div>' : '') +
      '<small>' + esc(vowText()) + '</small>' + picLine(a.files) + '</div>';
    if (!all.length) {
      return h + '<p class="sp-note">' + esc(L('لا ملفَّ محفوظاً عندنا الآن.', 'No files are kept with us right now.')) + '</p></div>' + back('home');
    }

    function seg(v, icon, t) {
      return '<button type="button" class="sp-seg-b" data-sp="fsort" data-v="' + v + '" aria-pressed="' + (mode === v) + '">' +
        '<i class="fa-solid ' + icon + '"></i>' + esc(t) + '</button>';
    }
    h += '<div class="sp-seg" role="group" aria-label="' + esc(L('ترتيبُ الملفّات', 'Sort files')) + '">' +
      seg('size', 'fa-arrow-down-wide-short', L('الأكبر', 'Largest')) +
      seg('old', 'fa-clock-rotate-left', L('الأقدم', 'Oldest')) +
      seg('dir', 'fa-folder', L('بالمجلّد', 'By folder')) + '</div>';

    var picked = all.filter(function (f) { return sel[f.ref_id]; });
    var pickedB = picked.reduce(function (n, f) { return n + (Number(f.stored_bytes) || 0); }, 0);
    var allOn = picked.length === all.length;
    h += '<div class="sp-fbar">' +
      '<label class="sp-pick"><input type="checkbox" data-sp-chk="all"' + (allOn ? ' checked' : '') +
      ' aria-label="' + esc(L('حدِّدِ الكلّ', 'Select all')) + '">' +
      '<span>' + esc(picked.length
        ? L('حُدِّد ' + picked.length + ' · ', picked.length + ' selected · ')
        : L(filesAr(all.length), all.length + ' files')) +
      (picked.length ? '<span class="sp-num">' + esc(bytes(pickedB)) + '</span>' : '') + '</span></label>' +
      (picked.length
        ? '<button type="button" class="sp-btn sp-btn--danger sp-bulk" data-sp="fbulk">' +
          '<i class="fa-solid fa-trash-can"></i>' +
          esc(this.fBulkArm ? L('اضغطْ ثانيةً لحذف ' + picked.length, 'Press again to delete ' + picked.length)
                            : L('احذفِ المحدَّد', 'Delete selected')) + '</button>'
        : '') + '</div>';

    function row(f) {
      var t = Date.parse(f.created_at) || now;
      var safe = (t + keep) > now || f.pinned;
      var audio = /^(audio|video)\//.test(f.mime || '');
      var on = arm === f.ref_id;
      var tag = safe
        ? '<span class="sp-ftag sp-ftag--safe">' + esc(f.pinned ? L('مثبَّت', 'Pinned')
            : L('محميٌّ حتى ' + fileDay(t + keep), 'Kept until ' + fileDay(t + keep))) + '</span>'
        : '<span class="sp-ftag sp-ftag--next">' + esc(L('يُحذف عند الامتلاء', 'Goes first when full')) + '</span>';
      return '<div class="sp-dev sp-file' + (sel[f.ref_id] ? ' is-on' : '') + '">' +
        '<input type="checkbox" class="sp-chk" data-sp-chk="' + esc(f.ref_id) + '"' + (sel[f.ref_id] ? ' checked' : '') +
        ' aria-label="' + esc(L('حدِّدْ ', 'Select ') + (f.name || '')) + '">' +
        '<i class="fa-solid ' + (audio ? 'fa-microphone' : 'fa-file-lines') + '"></i>' +
        '<span class="sp-dev-n"><span class="sp-file-n" dir="auto">' + esc(f.name || L('ملفّ', 'File')) + '</span>' +
        '<small><span class="sp-num">' + esc(bytes(f.stored_bytes)) + '</span>' +
        (f.course && mode !== 'dir' ? ' · <span class="sp-num">' + esc(f.course) + '</span>' : '') + ' · ' + esc(ago(t)) + '</small>' +
        tag + '</span>' +
        '<button type="button" class="sp-x' + (on ? ' sp-x--arm' : '') + '" data-sp="fdel" data-v="' + esc(f.ref_id) +
        '" aria-label="' + esc((on ? L('تأكيدُ حذف ', 'Confirm deleting ') : L('احذفْ ', 'Delete ')) + (f.name || '')) + '">' +
        (on ? esc(L('مؤكَّد؟', 'Sure?')) : '<i class="fa-solid fa-trash-can"></i>') + '</button></div>';
    }

    if (mode === 'dir') {
      if (!this.fHome && !this.fHomeBusy) {
        this.fHomeBusy = true;
        fileHomes().then(function (m) { self.fHomeBusy = false; self.set({ fHome: m || {} }); },
                            function () { self.fHomeBusy = false; self.set({ fHome: {} }); });
      }
      var dirs = {}, order = [];
      all.forEach(function (f) {
        var k = self.fileDir(f);
        if (!dirs[k]) { dirs[k] = []; order.push(k); }
        dirs[k].push(f);
      });
      order.sort(function (x, y) {
        if (!x) return 1;
        if (!y) return -1;
        var dx = x.charAt(0) === 'd', dy = y.charAt(0) === 'd';
        if (dx !== dy) return dx ? -1 : 1;
        return x.localeCompare(y);
      });
      h += order.map(function (k) {
        var fs = dirs[k].sort(bySize);
        var sum = fs.reduce(function (n, f) { return n + (Number(f.stored_bytes) || 0); }, 0);
        var on = fs.every(function (f) { return sel[f.ref_id]; });
        var nm = k.slice(2), mine = k.charAt(0) === 'd';
        return '<div class="sp-dir"><label class="sp-pick sp-dir-h"><input type="checkbox" data-sp-chk="dir:' + esc(k) + '"' +
          (on ? ' checked' : '') + ' aria-label="' + esc(L('حدِّدْ مجلّدَ ', 'Select folder ') + (nm || L('عامّ', 'General'))) + '">' +
          '<i class="fa-solid ' + (mine ? 'fa-folder' : 'fa-folder-open') + '"></i><b>' +
          (!nm ? esc(L('عامّ', 'General')) : mine ? '<span dir="auto">' + esc(nm) + '</span>' : '<span class="sp-num">' + esc(nm) + '</span>') + '</b>' +
          '<small>' + esc(fileCount(fs.length)) +
          ' · <span class="sp-num">' + esc(bytes(sum)) + '</span></small></label>' +
          fs.map(row).join('') + '</div>';
      }).join('');
    } else {
      h += all.map(row).join('');
    }
    h += '<p class="sp-note"><i class="fa-solid fa-circle-info"></i> ' + esc(L(
      'الحذفُ من هنا يُزيل نسختَنا وحدَها — الملفُّ على جهازك وفي درايفك كما هو.',
      'Deleting here removes only our copy — the file on your device and in your Drive stays as it is.')) + '</p></div>';
    return h + back('home');
  };

  Panel.prototype.fileDir = function (f) {
    var h = this.fHome && this.fHome[f.ref_id];
    if (h && h.dir) return 'd:' + h.dir;
    var c = String((h && h.course) || f.course || '').trim();
    return c ? 'c:' + c : '';
  };

  Panel.prototype.loadFiles = function () {
    var self = this, f = window.GardenFiles;
    if (!f || !f.state || !linked()) return;
    f.state().then(function (a) {
      if (a && a.ok) self.set({ files: a, fHome: null });
    }).catch(function () {});
  };

  Panel.prototype.doorsText = function (gd) {
    if (!gd) return '';
    if (gd.pw && gd.google) return L('بالبريد وكلمةِ السرّ، أو بحساب قوقل — أيُّهما شئت.',
                                     'With your email and password, or your Google account — either one.');
    if (gd.pw)     return L('ببريدك وكلمةِ سرّك.', 'With your email and password.');
    if (gd.google) return L('بحساب قوقل.', 'With your Google account.');
    return '';
  };

  /*@3.SYPJ.22*/
  Panel.prototype.vLocked = function () {
    var g = G();
    /*@3.SYPJ.29*/
    var known = !!this.guard;
    var gd = known ? this.guard : { pw: true, google: true };
    var gAvail = gd.google && g.googleAvailable && g.googleAvailable();
    return '<p class="sp-hint">' + esc(known
      ? L('هذا الجهازُ لم يُثبت هويّتَه بعد. ' + this.doorsText(gd),
          'This device has not proven itself yet. ' + this.doorsText(gd))
      : L('أدخل ما فعّلتَ به الحماية — بريدك وكلمةَ سرّك، أو حسابَ قوقل.',
          'Enter what you protected the account with — your email and password, or your Google account.')) + '</p>' +
      (gAvail ? '<div class="sp-gbtn" id="sp-gbtn"></div>' + (gd.pw ? '<div class="sp-or">' + esc(L('أو', 'or')) + '</div>' : '') : '') +
      (gd.pw ? emailPass('current-password') +
        '<div class="sp-acts">' + btn('do-unlock', 'fa-lock-open', L('افتحْ هذا الجهاز', 'Unlock this device'), 'go wide') + '</div>'
             : '') +
      '<p class="sp-warn"><i class="fa-solid fa-circle-info"></i> ' + esc(L(
        'بياناتُك على هذا الجهاز سليمةٌ ولم يُحذف منها شيء. القفلُ يمنع الرفعَ والتنزيلَ فقط.',
        'Your data on this device is intact; nothing was deleted. The lock only stops upload and download.')) + '</p>' +
      /*@3.SYPJ.33*/
      '<div class="sp-sec"><p class="sp-sec-t">' + esc(L('طرقٌ أخرى', 'Other ways in')) + '</p>' +
      '<div class="sp-doors">' +
      door('code', 'fa-qrcode', L('اربطْه من جهازي المفتوح', 'Link it from my unlocked device'),
           L('افتح الحديقة هناك ⇐ المزامنة ⇐ «اربط جهازاً» — الرمزُ يفتح هذا الجهازَ فوراً',
             'Open the Garden there ⇒ Sync ⇒ "Link a device" — that code unlocks this one at once'), 'go') +
      door('paste', 'fa-file-lines', L('ألصقْ مفتاحاً آخر', 'Paste a different key'),
           L('إن كان هذا ليس حسابَك', 'If this is not your account')) +
      '</div>' +
      '<div class="sp-acts" style="margin-top:0.8rem">' +
      btn('guard-retry', 'fa-rotate', L('حدّثِ الحالة', 'Refresh state'), 'quiet') +
      btn('disconnect', 'fa-arrow-right-from-bracket', L('ألغِ المزامنةَ وابدأ من جديد', 'Cancel sync and start over'), 'danger') +
      '</div></div>';
  };

  Panel.prototype.vShield = function () {
    var gd = this.guard || {}, g = G();
    var gAvail = g.googleAvailable && g.googleAvailable();
    var h = '<div class="sp-sec"><p class="sp-sec-t">' + esc(L('أبوابُ الحماية', 'Protection doors')) + '</p>';
    h += '<div class="sp-dev"><i class="fa-solid ' + (gd.pw ? 'fa-circle-check' : 'fa-circle') + '"></i>' +
      '<span class="sp-dev-n">' + esc(L('بريدٌ وكلمةُ سرّ', 'Email and password')) +
      '<small>' + esc(gd.pw ? L('مفعَّل', 'on') : L('مطفأ', 'off')) + '</small></span></div>';
    h += '<div class="sp-dev"><i class="fa-solid ' + (gd.google ? 'fa-circle-check' : 'fa-circle') + '"></i>' +
      '<span class="sp-dev-n">' + esc(L('حسابُ قوقل', 'Google account')) +
      '<small>' + esc(gd.google ? L('مفعَّل', 'on') : L('مطفأ', 'off')) + '</small></span></div>';
    h += '</div>';

    if (!gd.pw || !gd.google) {
      h += '<div class="sp-vouch"><b><i class="fa-solid fa-plus"></i>' +
        esc(L('أضف باباً ثانياً', 'Add a second door')) + '</b><small>' +
        esc(L('بابان يعنيان أنك تفتح بأيِّهما شئت — فلا يقفلك نسيانُ أحدهما.',
              'Two doors means either one opens it — so forgetting one does not lock you out.')) + '</small>' +
        (!gd.google && gAvail ? '<div class="sp-gbtn" id="sp-gbtn"></div>' : '') +
        (!gd.pw ? '<div class="sp-acts">' + btn('vouch', 'fa-envelope', L('ببريدٍ وكلمة سرّ', 'With email and password')) + '</div>' : '') +
        '</div>';
    }

    /*@3.SYPJ.25*/
    /*@3.SYPJ.36*/
    var list = (gd.list && gd.list.length) ? gd.list : null;
    h += '<div class="sp-sec"><p class="sp-sec-t">' + esc(L('الأجهزةُ المفتوحة', 'Unlocked devices')) + '</p>' +
      '<p class="sp-hint">' + esc(L(
        'هذه أجهزةٌ أثبتت هويّتَها وتزامن الآن. اطردْ أيَّها شئت — يُقفل فوراً ويُطلب منه الإثباتُ من جديد.',
        'These devices proved themselves and sync now. Sign out any of them — it locks at once and must prove itself again.')) + '</p>';
    if (list) {
      h += list.map(function (s) {
        return '<div class="sp-dev"><i class="fa-solid ' +
          (s.method === 'google' ? 'fa-google' : s.method === 'pair' ? 'fa-qrcode' : 'fa-envelope') + '"></i>' +
          '<span class="sp-dev-n">' + esc(s.name || L('جهاز', 'Device')) +
          '<small>' + esc(L('آخرُ نشاط ', 'last active ') + ago(Date.parse(s.last_at))) + '</small></span>' +
          (s.is_me ? '<span class="sp-dev-me">' + esc(L('هذا الجهاز', 'this one')) + '</span>'
                   : '<button type="button" class="sp-x" data-sp="kick" data-v="' + esc(s.sid) +
                     '" title="' + esc(L('اطردْه', 'Sign out')) + '"><i class="fa-solid fa-user-slash"></i></button>') +
          '</div>';
      }).join('');
    } else {
      h += '<p class="sp-hint">' + esc(L('جلساتٌ حيّة: ' + (gd.sessions || 0),
                                         'Live sessions: ' + (gd.sessions || 0))) + '</p>';
    }
    h += '<div class="sp-acts">' + btn('do-revoke', 'fa-user-slash',
        L('اطردْ بقيّةَ الأجهزة', 'Sign out the other devices'), 'quiet') + '</div></div>';

    h += '<div class="sp-acts" style="margin-top:1rem">' +
      btn('disarm', 'fa-ban', L('أطفئِ الحماية', 'Turn protection off'), 'danger wide') + '</div>';
    return h + back('home');
  };

  /*@3.SYPJ.24*/
  Panel.prototype.vDisarm = function () {
    return '<p class="sp-hint">' + esc(L(
      'بعد الإطفاء يعود مفتاحُك وحدَه كافياً لفتح بياناتك على أيِّ جهاز — ومن يقرؤه يقرؤها. بياناتُك لا تُمَسّ، والنسخةُ المحفوظةُ من مفتاحك تبقى كما هي.',
      'After turning it off, your key alone is enough to open your data on any device — and whoever reads it reads them. Your data is untouched, and the saved copy of your key stays as it is.')) + '</p>' +
      '<div class="sp-acts">' +
        btn('do-disarm', 'fa-ban', L('أطفئها', 'Turn it off'), 'danger wide') +
      '</div>' + back('shield');
  };

  /*@3.SYPJ.13*/
  function offlineish(e) {
    var m = (e && e.message) || String(e || '');
    /*@3.SYPJ.14*/
    return !navigator.onLine || /Failed to fetch|NetworkError|Load failed|net::|403|blocked|origin/i.test(m);
  }

  Panel.prototype.vPairFail = function () {
    var off = offlineish(this.pairErr);
    return '<div class="sp-stage">' +
      '<div class="sp-fail">' +
        '<i class="fa-solid fa-plug-circle-xmark" aria-hidden="true"></i>' +
        '<b>' + esc(off ? L('تعذّر الوصولُ إلى خادم المزامنة', 'Could not reach the sync server')
                        : L('تعذّر إنشاءُ رمز الربط', 'Could not create a link code')) + '</b>' +
        '<span>' + esc(off
          ? L('رمزُ الربط يُنشئه الخادمُ لا جهازُك، فلا يظهر بلا اتصال. تحقّق من شبكتك ثم أعد المحاولة — وبقيّةُ الحديقة تعمل كما هي.',
              'The code is minted by the server, not your device, so it cannot appear offline. Check your connection and try again — the rest of the Garden keeps working.')
          : errText(this.pairErr)) + '</span>' +
      '</div>' +
      '<div class="sp-acts">' + btn('pair', 'fa-rotate', L('أعد المحاولة', 'Try again'), 'go wide') + '</div>' +
      '</div>' + back('home');
  };

  Panel.prototype.vPair = function () {
    if (this.pairErr) return this.vPairFail();
    var p = this.pair;
    return '<div class="sp-stage">' +
      '<p class="sp-stage-h">' + esc(L(
        'افتح كاميرا جوّالك وصوّب على الرمز — يفتح الحديقةَ ويربطها فوراً.',
        'Point your phone camera at the code — it opens the Garden and links it instantly.')) + '</p>' +
      '<div class="sp-qr' + (p && p.qr ? '' : ' sp-qr--sk') + '">' +
        (p && p.qr ? p.qr : '<i class="fa-solid fa-spinner fa-spin"></i>') + '</div>' +
      '<div class="sp-or">' + esc(L('أو اكتب الرمز', 'or type the code')) + '</div>' +
      '<div class="sp-code"><code>' + esc(p ? p.pretty : '····-····-····') + '</code>' +
        '<button type="button" class="sp-mini" data-sp="cp-code" title="' + esc(L('نسخ الرمز', 'Copy code')) +
        '"><i class="fa-solid fa-copy"></i></button></div>' +
      this.ttlBar() +
      /*@3.SYPJ.39*/
      (p && p.carriesUnlock
        ? '<p class="sp-warn"><i class="fa-solid fa-shield-halved"></i> ' + esc(L(
            'حسابُك محميّ — وهذا الرمزُ يفتح الجهازَ الجديدَ فوراً بلا بريدٍ ولا قوقل، لأنه صدر من جهازٍ مفتوح. ولذلك لا تشاركه إلا مع جهازك، وهو يموت بعد ثلاث دقائق وقراءةٍ واحدة.',
            'Your account is protected — and this code unlocks the new device at once, with no email and no Google, because it came from an unlocked device. So share it only with your own device; it dies after three minutes and a single read.')) + '</p>'
        : '') +
      '<div class="sp-acts">' +
        btn('cp-link', 'fa-share-nodes', L('انسخ رابطاً أرسله لنفسي', 'Copy a link to send myself')) +
        btn('pair', 'fa-rotate', L('رمزٌ جديد', 'New code')) +
      '</div></div>' + back('home');
  };

  Panel.prototype.ttlBar = function () {
    if (!this.pair) return '';
    var left = Math.max(0, Math.round((this.pair.expiresAt - Date.now()) / 1000));
    var pct = Math.max(0, Math.min(100, (left / 180) * 100));
    return '<div class="sp-ttl' + (left <= 45 ? ' is-low' : '') + '">' +
      '<span class="sp-ttl-bar"><span class="sp-ttl-fill" style="width:' + pct.toFixed(1) + '%"></span></span>' +
      '<span class="sp-ttl-n">' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + '</span></div>';
  };

  Panel.prototype.vKey = function () {
    var g = G();
    var pretty = (g.vaultPretty && g.vaultPretty()) || '';
    return '<div class="sp-key"><code>' + esc(pretty || '—') + '</code></div>' +
      '<p class="sp-hint" style="margin:0.7rem 0 0">' + esc(L(
        'هذا المفتاحُ هو حسابُك. من يملكه يفتح بياناتك، ولا نملك نحن نسخةً منه — فاحفظه في مكانٍ آمن.',
        'This key is your account. Whoever holds it opens your data, and we hold no copy — keep it somewhere safe.')) + '</p>' +
      '<div class="sp-acts">' +
        btn('cp-key', 'fa-copy', L('نسخ', 'Copy')) +
        btn('file', 'fa-download', L('نزّل نسخةً', 'Download')) +
        btn('qr', 'fa-print', L('رمزٌ للطباعة', 'Printable code')) +
      '</div>' +
      (this.qr ? '<div class="sp-stage" style="margin-top:0.9rem"><div class="sp-qr">' + this.qr + '</div></div>' : '') +
      back('home');
  };

  Panel.prototype.vCode = function () {
    return '<p class="sp-hint">' + esc(L('اكتب الرمزَ الظاهرَ على جهازك الآخر.', 'Type the code shown on your other device.')) + '</p>' +
      '<input id="sp-in" class="sp-in sp-in--mono" maxlength="20" autocomplete="one-time-code" ' +
        'autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX">' +
      '<div class="sp-acts">' + btn('do-code', 'fa-link', L('اربط', 'Link'), 'go wide') + '</div>' +
      back(linked() ? 'auto' : 'have');
  };

  Panel.prototype.vPaste = function () {
    return '<p class="sp-hint">' + esc(L('ألصق مفتاحك كما هو.', 'Paste your key exactly as it is.')) + '</p>' +
      '<input id="sp-in" class="sp-in sp-in--mono" maxlength="40" autocomplete="off" ' +
        'autocapitalize="characters" spellcheck="false">' +
      '<div class="sp-acts">' + btn('do-paste', 'fa-check', L('استعمل هذا المفتاح', 'Use this key'), 'go wide') + '</div>' +
      back(linked() ? 'auto' : 'have');
  };

  Panel.prototype.vForm = function (kind) {
    var rec = kind === 'recover';
    var g = G();
    var gAvail = g.googleAvailable && g.googleAvailable();
    return '<p class="sp-hint">' + esc(rec
      ? L('أدخل ما حفظتَ به نسخةَ مفتاحك.', 'Enter what you saved your key copy with.')
      : L('اختر بريداً وكلمةَ سرٍّ تتذكّرهما. تُدخلهما مرّةً الآن، ثم متى احتجتَ العودة.',
          'Pick an email and password you will remember. Enter them once now, then whenever you need to come back.')) + '</p>' +
      (gAvail ? '<div class="sp-gbtn" id="sp-gbtn"></div><div class="sp-or">' + esc(L('أو', 'or')) + '</div>' : '') +
      emailPass(rec ? 'current-password' : 'new-password') +
      (rec ? '' : '<p class="sp-warn"><i class="fa-solid fa-triangle-exclamation"></i> ' + esc(L(
        'احفظ كلمةَ السر — لا نستطيع إعادةَ تعيينها لأننا لا نراها أصلاً.',
        'Remember this password — we cannot reset it because we never see it.')) + '</p>') +
      '<div class="sp-acts">' + btn(rec ? 'do-recover' : 'do-vouch',
        rec ? 'fa-rotate-left' : 'fa-shield-halved',
        rec ? L('استعد بياناتي', 'Restore my data') : L('احفظ', 'Save it'), 'go wide') + '</div>' +
      back(rec ? 'have' : 'home');
  };

  /*@3.SYPJ.15*/
  Panel.prototype.vUnlink = function () {
    return '<p class="sp-hint">' + esc(L(
      'ستُحذف النسخةُ المحفوظةُ من مفتاحك عندنا. بياناتُك ومفتاحُك يبقيان كما هما على هذا الجهاز، وتستطيع الحفظَ ثانيةً بحسابٍ آخر متى شئت.',
      'The saved copy of your key will be deleted. Your data and key stay exactly as they are on this device, and you can save again with another account any time.')) + '</p>' +
      '<div class="sp-acts">' +
        btn('do-unlink', 'fa-link-slash', L('احذف النسخةَ المحفوظة', 'Delete the saved copy'), 'danger wide') +
      '</div>' + back('home');
  };

  Panel.prototype.msgBox = function () {
    if (this.busy) return '<div class="sp-msg sp-msg--busy"><i class="fa-solid fa-spinner fa-spin"></i> ' + esc(L('لحظة…', 'One moment…')) + '</div>';
    if (this.err)  return '<div class="sp-msg sp-msg--err">' + esc(this.err) + '</div>';
    if (this.msg)  return '<div class="sp-msg sp-msg--ok">' + esc(this.msg) + '</div>';
    return '';
  };

  /*@3.SYPJ.16*/
  Panel.prototype.startTick = function () {
    var self = this;
    if (this.tick) { clearInterval(this.tick); this.tick = null; }
    if (!this.pair || this.view !== 'pair') return;
    this.tick = setInterval(function () {
      if (!self.host.isConnected) { clearInterval(self.tick); self.tick = null; return; }
      if (Date.now() >= self.pair.expiresAt) { self.pair = null; self.set({ view: 'home', msg: L('انتهت مدّةُ الرمز.', 'The code expired.') }); return; }
      var w = self.host.querySelector('.sp-ttl');
      if (!w) { clearInterval(self.tick); self.tick = null; return; }
      var left = Math.max(0, Math.round((self.pair.expiresAt - Date.now()) / 1000));
      var f = w.querySelector('.sp-ttl-fill'), n = w.querySelector('.sp-ttl-n');
      if (f) f.style.width = Math.max(0, Math.min(100, (left / 180) * 100)).toFixed(1) + '%';
      if (n) n.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      w.classList.toggle('is-low', left <= 45);
    }, 1000);
  };

  Panel.prototype.loadDevices = function () {
    var self = this, g = G();
    if (!g || !g.devices || !linked()) return;
    g.devices().then(function (d) {
      var list = (d && d.devices) || [];
      self.set({ devs: list, devArmed: !!(d && d.armed), devOrphans: Number((d && d.orphans) || 0) });
    }).catch(function () {});
  };

  /*@3.SYPJ.17*/
  Panel.prototype.mountGoogle = function () {
    var self = this, g = G();
    var box = this.host.querySelector('#sp-gbtn');
    if (!box || !g || !g.googleRender || !(g.googleAvailable && g.googleAvailable())) return;
    /*@3.SYPJ.23*/
    /*@3.SYPJ.31*/
    var unlocking = this.isLocked() || this.cur === 'locked';
    g.googleRender(box, function (err) {
      if (err) return self.fail(err);
      self.loadGuard();
      self.set({ view: 'home', busy: false,
        msg: unlocking ? L('فُتح هذا الجهاز.', 'This device is unlocked.')
                       : L('فُعّلت الحمايةُ بحساب قوقل.', 'Protection is on with your Google account.') });
      self.done();
    }, {
      mode: unlocking ? 'unlock' : 'auto',
      theme: (document.documentElement.getAttribute('data-theme') === 'light' ? 'outline' : 'filled_black'),
    }).catch(function () {});
  };

  Panel.prototype.bind = function () {
    var self = this;
    this.host.querySelectorAll('[data-sp-chk]').forEach(function (c) {
      c.addEventListener('change', function () { self.pick(c.getAttribute('data-sp-chk'), c.checked); });
    });
    this.host.querySelectorAll('[data-sp]').forEach(function (b) {
      b.addEventListener('click', function () { self.act(b.getAttribute('data-sp'), b.getAttribute('data-v')); });
    });
    var inp = this.host.querySelector('#sp-in');
    if (inp) {
      inp.addEventListener('input', function () { inp.value = inp.value.toUpperCase(); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.act(self.cur === 'paste' ? 'do-paste' : 'do-code');
      });
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 40);
    }
    var pw = this.host.querySelector('#sp-pw');
    if (pw) pw.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      /*@3.SYPJ.32*/
      self.act(self.cur === 'vouch' ? 'do-vouch'
             : self.cur === 'locked' ? 'do-unlock' : 'do-recover');
    });
    this.mountGoogle();
  };

  Panel.prototype.pick = function (k, on) {
    var sel = this.fSel || (this.fSel = {}), self = this;
    var fs = (this.files && this.files.files) || [];
    var hit = k === 'all' ? fs
      : k.indexOf('dir:') === 0 ? fs.filter(function (f) { return self.fileDir(f) === k.slice(4); })
      : fs.filter(function (f) { return f.ref_id === k; });
    hit.forEach(function (f) { if (on) sel[f.ref_id] = 1; else delete sel[f.ref_id]; });
    this.fBulkArm = false;
    this.paint();
  };

  Panel.prototype.copy = function (text, okMsg) {
    var self = this;
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(function () { self.set({ msg: okMsg }); }).catch(function () {});
  };

  Panel.prototype.act = function (a, v) {
    var self = this, g = G();
    if (!g) return;

    if (a === 'skip') { if (this.opts.onSkip) this.opts.onSkip(); return; }
    if (a === 'have' || a === 'code' || a === 'recover' || a === 'paste' || a === 'vouch' ||
        a === 'key' || a === 'unlink' || a === 'shield' || a === 'disarm' ||
        a === 'locked') return this.go(a);
    if (a === 'drive') { this.drv = null; return this.go('drive'); }
    if (a === 'files') { this.fArm = null; this.fSel = {}; this.fBulkArm = false; this.loadFiles(); return this.go('files'); }
    if (a === 'fsort') { this.fSort = v || 'size'; this.fBulkArm = false; this.paint(); return; }
    if (a === 'fbulk') {
      var ids = Object.keys(this.fSel || {});
      if (!ids.length || !window.GardenFiles) return;
      if (!this.fBulkArm) {
        this.fBulkArm = true;
        clearTimeout(this.fBulkT);
        this.fBulkT = setTimeout(function () { if (self.fBulkArm) { self.fBulkArm = false; self.paint(); } }, 5000);
        this.paint();
        return;
      }
      clearTimeout(this.fBulkT);
      this.fBulkArm = false;
      var done = 0, bad = 0;
      this.set({ busy: true, err: '', msg: L('يُحذف…', 'Deleting…') });
      ids.reduce(function (chain, id) {
        return chain.then(function () {
          return window.GardenFiles.remove(id).then(function (okd) {
            if (okd) { done++; delete self.fSel[id]; } else bad++;
          }, function () { bad++; }).then(function () {
            self.set({ msg: L('حُذف ' + done + ' من ' + ids.length + '…', 'Deleted ' + done + ' of ' + ids.length + '…') });
          });
        });
      }, Promise.resolve()).then(function () {
        var gone = {};
        ids.forEach(function (id) { if (!self.fSel[id]) gone[id] = 1; });
        self.files = Object.assign({}, self.files, {
          files: (self.files.files || []).filter(function (x) { return !gone[x.ref_id]; }) });
        self.set({ busy: false, msg: bad ? '' : L('حُذفت ' + done + ' من نسخنا.', done + ' of our copies were deleted.'),
                   err: bad ? L('لم يُحذف ' + bad + ' — أعِدِ المحاولة.', bad + ' were not deleted — please try again.') : '' });
        self.loadFiles();
      });
      return;
    }
    if (a === 'fdel') {
      if (!v || !window.GardenFiles) return;
      if (this.fArm !== v) {
        this.fArm = v;
        clearTimeout(this.fArmT);
        this.fArmT = setTimeout(function () { if (self.fArm === v) { self.fArm = null; self.paint(); } }, 5000);
        this.paint();
        return;
      }
      clearTimeout(this.fArmT);
      this.set({ busy: true, err: '', msg: '', fArm: null });
      window.GardenFiles.remove(v).then(function (okd) {
        if (!okd) throw new Error('drop');
        var left = (self.files.files || []).filter(function (x) { return x.ref_id !== v; });
        self.files = Object.assign({}, self.files, { files: left });
        self.set({ busy: false, msg: L('حُذفت نسختُنا من الملفّ.', 'Our copy of the file was deleted.') });
        self.loadFiles();
      }).catch(function () {
        self.set({ busy: false, err: L('لم يقبل الخادمُ الحذفَ الآن — أعِدِ المحاولة.', 'The server did not accept the delete — please try again.') });
      });
      return;
    }
    if (a === 'drv-retry') { this.drv = null; this.paint(); return; }
    if (a === 'drv-all' || a === 'drv-off') {
      this.set({ busy: true, err: '', msg: '' });
      needDrive().then(function (GD) {
        return (a === 'drv-all' ? GD.linkNow() : GD.unlink()).then(function () {
          self.drv = null;
          self.set({ busy: false, msg: a === 'drv-all'
            ? L('رُبط درايف بحسابك — يجده جوّالُك الآن.', 'Drive is linked to your account — your phone finds it now.')
            : L('فُصل درايف. ملفّاتُك هناك لم تُمسّ.', 'Drive is disconnected. Your files there are untouched.') });
        }, function (e) { self.set({ busy: false, err: GD.linkReason(e) }); });
      }, function () { self.set({ busy: false, err: L('تعذّر تحميلُ ربطِ درايف.', 'Could not load Drive.') }); });
      return;
    }
    if (a === 'guard-retry') { this.set({ err: '', msg: '' }); this.loadGuard(); return; }
    if (a && a.indexOf('to-') === 0) return this.go(a.slice(3));

    if (a === 'new') {
      this.set({ busy: true, err: '', msg: '' });
      Promise.resolve().then(function () { return g.adoptVaultSecret(g.newVaultSecret()); })
        .then(function () { self.set({ view: 'home', busy: false }); self.done(); })
        .catch(function (e) { self.fail(e); });
      return;
    }
    if (a === 'now') {
      this.set({ busy: true });
      Promise.resolve(g.syncNow && g.syncNow())
        .then(function () { self.set({ busy: false }); })
        .catch(function () { self.set({ busy: false }); });
      return;
    }
    if (a === 'pair') {
      this.pairErr = null;
      this.set({ busy: true, err: '', msg: '', view: 'pair', pair: null });
      g.startPairing().then(function (p) {
        self.pair = { pretty: p.pretty, code: p.code, link: p.link, expiresAt: p.expiresAt,
                      qr: '', carriesUnlock: !!p.carriesUnlock };
        return g.pairQR ? g.pairQR(p.link, { quiet: 3 }) : null;
      }).then(function (svg) {
        if (svg && self.pair) self.pair.qr = svg;
        self.set({ busy: false, view: 'pair' });
      }).catch(function (e) {
        /*@3.SYPJ.18*/
        /*@3.SYPJ.38*/
        if (/vault-locked/.test((e && e.message) || '')) {
          self.loadGuard();
          self.set({ busy: false, view: 'locked', pair: null, err: '' });
          return;
        }
        self.pairErr = e;
        self.set({ busy: false, view: 'pair', pair: null, err: '' });
      });
      return;
    }
    if (a === 'cp-code') { if (this.pair) this.copy(this.pair.pretty, L('نُسخ الرمز.', 'Code copied.')); return; }
    if (a === 'cp-link') { if (this.pair) this.copy(this.pair.link, L('نُسخ الرابط — أرسله لنفسك وافتحه على الجهاز الآخر.', 'Link copied — send it to yourself and open it on the other device.')); return; }
    if (a === 'cp-key') {
      var c = this.host.querySelector('.sp-key code');
      if (c) this.copy(c.textContent, L('نُسخ المفتاح.', 'Key copied.'));
      return;
    }
    if (a === 'file') {
      if (g.downloadRecoveryFile && g.downloadRecoveryFile()) this.set({ msg: L('نُزّل الملف.', 'File downloaded.') });
      return;
    }
    if (a === 'qr') {
      if (this.qr) return this.set({ qr: '' });
      this.set({ busy: true });
      g.recoveryQR({ quiet: 3 }).then(function (svg) { self.set({ busy: false, qr: svg || '' }); })
        .catch(function (e) { self.fail(e); });
      return;
    }
    /*@3.SYPJ.45*/
    if (a === 'forget') {
      if (!confirm(this.devArmed
        ? L('سيُطرد هذا الجهاز: يفقد إثباتَه وتتوقّف مزامنتُه حتى يُفتح من جديد. وبياناتُه المحفوظةُ عليه تبقى كما هي.',
            'This device will be signed out: it loses its proof and its sync stops until it is unlocked again. Data already on it stays as it is.')
        : L('الحمايةُ مطفأة، فهذه إزالةٌ من القائمة لا طردٌ — الجهازُ يزامن بمفتاحك وحدَه. فعّلِ الحماية ليصير الطردُ نافذاً. أنُزيله من القائمة؟',
            'Protection is off, so this removes it from the list without signing it out — the device syncs with your key alone. Turn on protection to make signing out effective. Remove it from the list?'))) return;
      g.forgetDevice(v).then(function (r) {
        self.loadDevices();
        self.loadGuard();
        self.set({ msg: (r && r.revoked)
          ? L('طُرد الجهاز — توقّفت مزامنتُه.', 'Device signed out — its sync has stopped.')
          : ((r && r.armed)
              ? L('أُزيل من القائمة. ولم تكن له جلسةٌ مفتوحةٌ أصلاً.',
                  'Removed from the list. It had no open session anyway.')
              : L('أُزيل من القائمة — والحمايةُ مطفأةٌ فهو ما زال يزامن بمفتاحك.',
                  'Removed from the list — protection is off, so it still syncs with your key.')) });
      }).catch(function () {});
      return;
    }
    if (a === 'do-unlink') {
      this.set({ busy: true });
      g.forgetRecovery().then(function () {
        self.set({ view: 'home', busy: false, msg: L('حُذفت النسخةُ المحفوظة.', 'The saved copy was deleted.') });
      }).catch(function (e) { self.fail(e); });
      return;
    }
    if (a === 'disconnect') {
      if (!confirm(L('فصلُ هذا الجهاز يوقف المزامنة ويبقي بياناتك المحلية كما هي. تستطيع العودةَ بالمفتاح نفسِه متى شئت. هل أنت متأكّد؟',
                     'Disconnecting stops sync and keeps your local data intact. You can return with the same key any time. Are you sure?'))) return;
      g.disconnect();
      this.set({ view: 'pick', devs: null, pair: null, msg: L('فُصل هذا الجهاز.', 'This device is disconnected.') });
      return;
    }

    if (a === 'do-code' || a === 'do-paste') {
      var val = this.val('sp-in');
      if (!val) return;
      this.set({ busy: true, err: '' });
      var p = (a === 'do-code') ? g.claimPairing(val)
                                : Promise.resolve().then(function () { return g.adoptVaultSecret(val); });
      p.then(function () { return self.settle(); })
       .catch(function (e) { self.fail(a === 'do-paste' ? new Error('bad-code') : e); });
      return;
    }
    if (a === 'do-recover' || a === 'do-vouch' || a === 'do-unlock') {
      var em = this.val('sp-em'), pw = this.val('sp-pw');
      if (!em || !pw) return;
      this.set({ busy: true, err: '' });
      var q = (a === 'do-recover') ? g.openRecovery(em, pw)
            : (a === 'do-unlock')  ? g.unlockPassword(em, pw)
                                   : g.saveRecovery(em, pw);
      q.then(function () {
        self.loadGuard();
        self.set({ view: 'home', busy: false,
          msg: a === 'do-recover' ? L('استُعيدت بياناتك.', 'Your data is back.')
             : a === 'do-unlock'  ? L('فُتح هذا الجهاز.', 'This device is unlocked.')
             : L('فُعّلت الحماية — لا مزامنةَ بعدها إلا ببريدك وكلمةِ سرّك.',
                 'Protection is on — sync now requires your email and password.') });
        self.done();
      }).catch(function (e) { self.fail(e); });
      return;
    }
    if (a === 'do-disarm') {
      this.set({ busy: true, err: '' });
      g.disarmGuard('all').then(function () {
        self.loadGuard();
        self.set({ view: 'home', busy: false, guard: null,
          msg: L('أُطفئت الحماية.', 'Protection is off.') });
      }).catch(function (e) { self.fail(e); });
      return;
    }
    if (a === 'do-revoke') {
      this.set({ busy: true, err: '' });
      g.revokeSessions(false).then(function (j) {
        /*@3.SYPJ.37*/
        self.set({ busy: false, guard: (j && j.state) || self.guard,
                   msg: L('طُردت ' + ((j && j.revoked) || 0) + ' جهازاً.',
                          'Signed out ' + ((j && j.revoked) || 0) + ' device(s).') });
        self.loadGuard();
        self.loadDevices();
      }).catch(function (e) { self.fail(e); });
      return;
    }
    if (a === 'kick') {
      if (!v) return;
      this.set({ busy: true, err: '' });
      g.revokeSession(v).then(function (j) {
        self.set({ busy: false, guard: (j && j.state) || self.guard,
                   msg: ((j && j.revoked) ? L('طُرد الجهاز.', 'Device signed out.')
                                          : L('لم يُعثر عليه — رُبّما طُرد قبلاً.', 'Not found — perhaps already signed out.')) });
        self.loadGuard();
        self.loadDevices();
      }).catch(function (e) { self.fail(e); });
      return;
    }
  };

  Panel.prototype.done = function () {
    this.loadDevices();
    if (this.opts.onLinked) this.opts.onLinked();
    try { window.dispatchEvent(new CustomEvent('garden:syncLinked')); } catch (e) {}
  };

  /*@3.SYPJ.19*/
  var openBox = null;
  window.GardenSyncPanel = {
    mount: function (el, opts) { if (!el) return null; ensureCSS(); return new Panel(el, opts); },
    fileHomes: fileHomes,
    openModal: function (opts) {
      ensureCSS();
      if (openBox) { openBox.remove(); openBox = null; }
      var ov = document.createElement('div');
      ov.className = 'sp-ov';
      ov.innerHTML = '<div class="sp-box" role="dialog" aria-modal="true" aria-label="' +
        esc(L('المزامنة والأجهزة', 'Sync and devices')) + '">' +
        '<div class="sp-box-h"><h3>' + esc(L('المزامنة والأجهزة', 'Sync & devices')) + '</h3>' +
        '<button type="button" class="sp-close" data-sp-close aria-label="' + esc(L('إغلاق', 'Close')) + '">' +
        '<i class="fa-solid fa-xmark"></i></button></div><div data-sp-host></div></div>';
      document.body.appendChild(ov);
      openBox = ov;
      var panel = new Panel(ov.querySelector('[data-sp-host]'), opts || {});
      function close() {
        panel.destroy(); ov.remove();
        if (openBox === ov) openBox = null;
        document.removeEventListener('keydown', onKey);
      }
      function onKey(e) { if (e.key === 'Escape') close(); }
      ov.addEventListener('click', function (e) {
        if (e.target === ov || e.target.closest('[data-sp-close]')) close();
      });
      document.addEventListener('keydown', onKey);
      return panel;
    },
  };
})();
