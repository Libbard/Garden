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

  function ensureCSS() {
    if (document.querySelector('link[data-sync-panel]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = ROOT + 'shared/sync-panel.css';
    l.setAttribute('data-sync-panel', '1');
    document.head.appendChild(l);
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
    return L('تعذّر إتمامُ العملية. تحقّق من اتصالك.', 'Could not complete. Check your connection.');
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
    this.busy = false; this.msg = ''; this.err = '';
    this.pair = null; this.pairErr = null; this.tick = null; this.devs = null; this.qr = '';
    this.guard = null;
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
  }

  Panel.prototype.destroy = function () {
    if (this.tick) { clearInterval(this.tick); this.tick = null; }
    if (this._onLang) { document.removeEventListener('garden:languageChanged', this._onLang); this._onLang = null; }
    if (this._onLock) { window.removeEventListener('garden:vaultLocked', this._onLock); this._onLock = null; }
  };

  Panel.prototype.loadGuard = function () {
    var self = this, g = G();
    if (!g || !g.guardState || !linked()) return;
    g.guardState().then(function (s) { self.set({ guard: s }); }).catch(function () {});
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
    var v = this.view;
    if (v === 'auto') v = linked() ? (this.isLocked() ? 'locked' : 'home') : 'pick';

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
      error:   L('تعذّر الاتصال', 'Connection trouble'),
      offline: L('مرتبط', 'Linked'),
      off:     L('على هذا الجهاز فقط', 'This device only'),
      unconfirmed: L('مفتاحُك جاهز — ولم يصل الخادمَ بعد', 'Your key is ready — the server has not seen it yet'),
      locked:  L('حسابُك محميّ — افتحه على هذا الجهاز', 'Your account is protected — unlock it on this device')
    };
    var sub = (st === 'off')
      ? L('عملُك محفوظٌ هنا ولن يتبعك إلى جهازٍ آخر.', 'Your work lives here and will not follow you elsewhere.')
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
      '</div>' + back('pick');
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

    if (this.devs && this.devs.length) {
      h += '<div class="sp-sec"><p class="sp-sec-t">' + esc(L('أجهزتك', 'Your devices')) + '</p>' +
        this.devs.map(function (d) {
          return '<div class="sp-dev"><i class="fa-solid fa-display"></i>' +
            '<span class="sp-dev-n">' + esc(d.name || L('جهاز', 'Device')) +
            '<small>' + esc(ago(Date.parse(d.last_seen))) + '</small></span>' +
            (d.isMe ? '<span class="sp-dev-me">' + esc(L('هذا الجهاز', 'this one')) + '</span>'
                    : '<button type="button" class="sp-x" data-sp="forget" data-v="' + esc(d.device_id) +
                      '" title="' + esc(L('إزالة', 'Remove')) + '"><i class="fa-solid fa-xmark"></i></button>') +
            '</div>';
        }).join('') + '</div>';
    }

    h += '<div class="sp-acts" style="margin-top:1.1rem">' +
      btn('disconnect', 'fa-arrow-right-from-bracket', L('فصلُ هذا الجهاز', 'Disconnect this device'), 'danger wide') + '</div>';
    return h;
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
    var gd = this.guard || {}, g = G();
    var gAvail = gd.google && g.googleAvailable && g.googleAvailable();
    return '<p class="sp-hint">' + esc(L(
      'هذا الجهازُ لم يُثبت هويّتَه بعد. ' + this.doorsText(gd),
      'This device has not proven itself yet. ' + this.doorsText(gd))) + '</p>' +
      (gAvail ? '<div class="sp-gbtn" id="sp-gbtn"></div>' + (gd.pw ? '<div class="sp-or">' + esc(L('أو', 'or')) + '</div>' : '') : '') +
      (gd.pw ? emailPass('current-password') +
        '<div class="sp-acts">' + btn('do-unlock', 'fa-lock-open', L('افتحْ هذا الجهاز', 'Unlock this device'), 'go wide') + '</div>'
             : '') +
      '<p class="sp-warn"><i class="fa-solid fa-circle-info"></i> ' + esc(L(
        'بياناتُك على هذا الجهاز سليمةٌ ولم يُحذف منها شيء. القفلُ يمنع الرفعَ والتنزيلَ فقط.',
        'Your data on this device is intact; nothing was deleted. The lock only stops upload and download.')) + '</p>';
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
    h += '<div class="sp-sec"><p class="sp-sec-t">' + esc(L('الأجهزةُ المفتوحة', 'Unlocked devices')) + '</p>' +
      '<p class="sp-hint">' + esc(L(
        'أجهزةٌ أثبتت هويّتَها وتزامن الآن: ' + (gd.sessions || 0),
        'Devices that proved themselves and now sync: ' + (gd.sessions || 0))) + '</p>' +
      '<div class="sp-acts">' + btn('do-revoke', 'fa-user-slash',
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
      '<div class="sp-acts">' + btn('do-code', 'fa-link', L('اربط', 'Link'), 'go wide') + '</div>' + back('have');
  };

  Panel.prototype.vPaste = function () {
    return '<p class="sp-hint">' + esc(L('ألصق مفتاحك كما هو.', 'Paste your key exactly as it is.')) + '</p>' +
      '<input id="sp-in" class="sp-in sp-in--mono" maxlength="40" autocomplete="off" ' +
        'autocapitalize="characters" spellcheck="false">' +
      '<div class="sp-acts">' + btn('do-paste', 'fa-check', L('استعمل هذا المفتاح', 'Use this key'), 'go wide') + '</div>' + back('have');
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
    g.devices().then(function (d) { if (d && d.length) self.set({ devs: d }); }).catch(function () {});
  };

  /*@3.SYPJ.17*/
  Panel.prototype.mountGoogle = function () {
    var self = this, g = G();
    var box = this.host.querySelector('#sp-gbtn');
    if (!box || !g || !g.googleRender || !(g.googleAvailable && g.googleAvailable())) return;
    /*@3.SYPJ.23*/
    var unlocking = (this.view === 'locked');
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
    this.host.querySelectorAll('[data-sp]').forEach(function (b) {
      b.addEventListener('click', function () { self.act(b.getAttribute('data-sp'), b.getAttribute('data-v')); });
    });
    var inp = this.host.querySelector('#sp-in');
    if (inp) {
      inp.addEventListener('input', function () { inp.value = inp.value.toUpperCase(); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.act(self.view === 'paste' ? 'do-paste' : 'do-code');
      });
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 40);
    }
    var pw = this.host.querySelector('#sp-pw');
    if (pw) pw.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      self.act(self.view === 'vouch' ? 'do-vouch'
             : self.view === 'locked' ? 'do-unlock' : 'do-recover');
    });
    this.mountGoogle();
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
        a === 'key' || a === 'unlink' || a === 'shield' || a === 'disarm') return this.go(a);
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
        self.pair = { pretty: p.pretty, code: p.code, link: p.link, expiresAt: p.expiresAt, qr: '' };
        return g.pairQR ? g.pairQR(p.link, { quiet: 3 }) : null;
      }).then(function (svg) {
        if (svg && self.pair) self.pair.qr = svg;
        self.set({ busy: false, view: 'pair' });
      }).catch(function (e) {
        /*@3.SYPJ.18*/
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
    if (a === 'forget') {
      if (!confirm(L('إزالةُ هذا الجهاز من القائمة لا تنزع منه مفتاحك. للفصل الكامل غيّر مفتاحك.',
                     'Removing this device from the list does not revoke its key. For a full cut, change your key.'))) return;
      g.forgetDevice(v).then(function () { self.loadDevices(); self.set({ msg: L('أُزيل.', 'Removed.') }); }).catch(function () {});
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
      p.then(function () {
        self.set({ view: 'home', busy: false, msg: L('استُعيدت بياناتك.', 'Your data is back.') });
        self.done();
      }).catch(function (e) { self.fail(a === 'do-paste' ? new Error('bad-code') : e); });
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
        self.loadGuard();
        self.set({ busy: false, msg: L('طُردت ' + ((j && j.revoked) || 0) + ' جهازاً.',
                                       'Signed out ' + ((j && j.revoked) || 0) + ' device(s).') });
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
