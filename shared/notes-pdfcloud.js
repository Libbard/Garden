;(function () {
  'use strict';

  var SEEN_LS = '__filesOffer';

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
  function size(n) {
    if (!(n > 0)) return '';
    var u = ['B', 'KB', 'MB', 'GB'], i = 0, v = n;
    while (v >= 1024 && i < 3) { v /= 1024; i++; }
    return (i === 0 || v >= 100 ? Math.round(v) : v.toFixed(1)) + ' ' + u[i];
  }
  function num(s) { return '<span class="npc-num">' + esc(s) + '</span>'; }
  function day(t) {
    var d = new Date(t);
    if (!d.getTime()) return '';
    return d.getDate() + '/' + (d.getMonth() + 1);
  }

  function refIdOf(h) { return 'pdf_' + String(h || '').slice(0, 40); }
  function F() { return window.GardenFiles || null; }
  function btn() { return document.getElementById('na-cloud'); }
  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (e) {}
  }

  function seen() {
    try { return JSON.parse(localStorage.getItem(SEEN_LS) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function markSeen(h) {
    try {
      var o = seen(); o[refIdOf(h)] = 1;
      localStorage.setItem(SEEN_LS, JSON.stringify(o));
    } catch (e) {}
  }

  function restoreX(h, name, onProgress) {
    var f = F();
    if (!f || !h) return Promise.resolve({ file: null, why: 'none' });
    return f.fetchBytes(refIdOf(h), onProgress).then(function (got) {
      if (!got || !got.blob || !got.blob.size) return { file: null, why: 'fail' };
      var file = new File([got.blob], got.name || name || 'file.pdf',
                          { type: got.mime || 'application/pdf' });
      var D = window.GardenPdfDoc;
      if (!D || !D.put) return { file: file, why: '' };
      return D.put(h, file, { name: file.name }).then(function () { return { file: file, why: '' }; },
                                                     function () { return { file: file, why: '' }; });
    })['catch'](function (e) {
      var m = String((e && e.message) || '');
      if (/no_vault/.test(m)) return { file: null, why: 'no_vault' };
      if (/not_found/.test(m)) {
        return f.state().then(function (s) {
          return { file: null, why: s.ok ? 'pending' : (s.why || 'fail') };
        }, function () { return { file: null, why: 'offline' }; });
      }
      if (/locked|vault-locked/.test(m)) return { file: null, why: 'locked' };
      if (!navigator.onLine || e instanceof TypeError) return { file: null, why: 'offline' };
      return { file: null, why: 'fail' };
    });
  }

  function restore(h, name, onProgress) {
    return restoreX(h, name, onProgress).then(function (r) { return r.file; });
  }

  var slimBusy = Object.create(null);

  function slimOk() {
    var c = navigator.connection;
    if (c && (c.saveData || /(^|-)2g$/.test(String(c.effectiveType || '')))) return false;
    return true;
  }

  function slimPlan(row) {
    if (!row || Number(row.squeeze) !== 1) return null;
    var want = Number(row.stored_bytes) || 0, orig = Number(row.orig_bytes) || 0;
    if (!(want > 0) || !(orig > want)) return null;
    return { want: want, orig: orig };
  }

  function slim(h, name, plan) {
    var f = F();
    var D = window.GardenPdfDoc;
    if (!f || !D || !D.stat || !h || !plan || slimBusy[h] || !slimOk()) return Promise.resolve(false);
    slimBusy[h] = 1;
    var was = 0;
    return D.stat(h).then(function (s) {
      if (!s || !(s.size > plan.want)) return false;
      was = s.size;
      return f.fetchBytes(refIdOf(h)).then(function (got) {
        if (!got || !got.blob || got.blob.size !== plan.want) return false;
        if (cur && cur.h === h) return false;
        var file = new File([got.blob], got.name || name || 'file.pdf', { type: 'application/pdf' });
        return D.put(h, file, { name: file.name, sq: 1 }).then(function (ok) {
          if (!ok) return false;
          emit('garden:fileSlimmed', { h: h, ref_id: refIdOf(h), from: was, to: plan.want });
          return true;
        });
      });
    })['catch'](function () { return false; }).then(function (r) { delete slimBusy[h]; return r; });
  }

  var cur = null;
  var dlg = null;
  function shown() { return !!(dlg && dlg.open); }
  var busy = false;
  var prog = 0;
  var ac = null;
  var doneT = 0;

  function paint() {
    var b = btn();
    if (!b) return;
    var on = !!(cur && (cur.ok || cur.drive));
    b.hidden = !on;
    if (!on) {
      ['data-home', 'data-busy', 'data-new'].forEach(function (k) { b.removeAttribute(k); });
      return;
    }
    var us = !!cur.row, gd = !!cur.gd;
    b.setAttribute('data-home', gd ? 'drive' : (us ? 'us' : 'here'));
    if (busy) b.setAttribute('data-busy', '1'); else b.removeAttribute('data-busy');
    if (cur.nu && !us && !gd) b.setAttribute('data-new', '1'); else b.removeAttribute('data-new');
    var i = b.querySelector('i');
    if (i) i.className = gd ? 'fa-brands fa-google-drive' : ('fa-solid ' + (us ? 'fa-cloud' : 'fa-cloud-arrow-up'));
    var ar = busy ? 'يُرفع الملفّ…' : (gd ? 'نسخةُ الملفّ في درايفك' : (us ? 'نسخةُ الملفّ محفوظةٌ عندنا' : 'أين نحفظ الملفّ؟'));
    var en = busy ? 'Uploading the file…' : (gd ? 'A copy of the file is in your Drive' : (us ? 'A copy of the file is kept with us' : 'Where should we keep the file?'));
    b.setAttribute('aria-label', L(ar, en));
    b.setAttribute('data-ar-title', ar);
    b.setAttribute('data-en-title', en);
    b.title = L(ar, en);
  }

  function flash() {
    var b = btn();
    if (!b) return;
    clearTimeout(doneT);
    b.setAttribute('data-done', '1');
    doneT = setTimeout(function () {
      var c = btn();
      if (c) c.removeAttribute('data-done');
    }, 3000);
  }

  function shut() {
    if (shown()) { try { dlg.close(); } catch (e) {} }
  }

  function open() {
    if (shown()) return dlg;
    if (dlg && dlg.parentNode) dlg.parentNode.removeChild(dlg);
    dlg = null;
    var d = document.createElement('dialog');
    d.className = 'gsf gsf--snug npc';
    d.setAttribute('aria-labelledby', 'npc-t');
    d.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    d.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" aria-label="' +
      esc(L('إغلاق', 'Close')) + '" data-ar-title="إغلاق" data-en-title="Close">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
      '<div class="gsf-body"><div class="gsf-head">' +
      '<h2 class="gsf-title" id="npc-t"></h2>' +
      '<p class="gsf-sub npc-file" dir="auto"></p></div>' +
      '<div class="npc-main" aria-live="polite"></div></div>' +
      '<div class="gsf-foot"><div class="gsf-acts"></div></div>';
    document.body.appendChild(d);
    d.addEventListener('close', function () {
      if (d.parentNode) d.parentNode.removeChild(d);
      if (dlg === d) dlg = null;
    });
    d.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-a]') : null;
      if (b && !b.disabled) act(b.getAttribute('data-a'));
    });
    dlg = d;
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
    return d;
  }

  function view(state, title, main, acts) {
    if (!dlg) return null;
    dlg.setAttribute('data-state', state);
    dlg.querySelector('#npc-t').textContent = title;
    dlg.querySelector('.npc-file').textContent = (cur && cur.name) || '';
    dlg.querySelector('.npc-main').innerHTML = main;
    var foot = dlg.querySelector('.gsf-foot');
    foot.querySelector('.gsf-acts').innerHTML = acts || '';
    foot.hidden = !acts;
    return dlg;
  }

  function button(a, label, mod, icon) {
    return '<button type="button" class="gsf-btn' + (mod ? ' gsf-btn--' + mod : '') +
      '" data-a="' + a + '">' +
      (icon ? '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' : '') +
      '<span>' + esc(label) + '</span></button>';
  }

  function vow() {
    return '<p class="npc-vow"><b>' +
      esc(L('نضمن حفظَ الملفِّ ثلاثةَ أيّامٍ على الأقلّ.',
            'We keep the file for at least three days.')) + '</b> ' +
      esc(L('وبعدها — إذا امتلأت مساحتُنا — نحذف الأقدمَ أوّلاً. أمّا رسمُك وملاحظاتُك ' +
            'فمحفوظةٌ باستمرارٍ ولا تُحذف؛ الأصلُ وحدَه قد يُحذف من عندنا، وتختاره من جهازك متى شئت.',
            'After that, if our space fills up, we remove the oldest first. Your drawings and ' +
            'notes are kept continuously and never deleted — only the original may go from our ' +
            'side, and you can pick it from your device any time.')) + '</p>';
  }

  function wait() {
    view('wait', L('نسخةُ هذا الملفّ', 'This file’s copy'),
      '<p class="npc-wait"><i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>' +
      esc(L('نسأل عنه…', 'Checking…')) + '</p>');
  }

  /*@3.NOPJ12.1*/
  var BIG_US = 40 * 1024 * 1024;
  function where() {
    var c = String((cur && cur.course) || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    /*@3.NOPJ12.2*/
    return 'Digital Garden / ' + (c || 'General') + ' / PDF';
  }
  function opt(a, icon, title, sub, mod, chip, off) {
    return '<button type="button" class="npc-opt' + (mod ? ' npc-opt--' + mod : '') + '" data-a="' + a + '"' + (off ? ' disabled' : '') + '>' +
      '<i class="' + icon + '" aria-hidden="true"></i><span class="npc-opt-t"><b>' + esc(title) + '</b>' +
      (sub ? '<small>' + sub + '</small>' : '') + '</span>' + (chip ? '<em class="npc-chip">' + esc(chip) + '</em>' : '') + '</button>';
  }
  function driveOpt() {
    if (!cur || !cur.drive) return '';
    return opt('drive', 'fa-brands fa-google-drive', L('في درايفي', 'In my Drive'),
      esc(L('يبقى دائماً، بلا ضغطٍ ولا حذف، ويفتح على كلِّ أجهزتك.', 'It stays for good, never squeezed or deleted, and opens on all your devices.')) +
      ' <span class="npc-path" dir="ltr">' + esc(where()) + '</span>', 'gd', L('ننصح به', 'Recommended'));
  }
  function usOpt(a, title) {
    var big = cur && cur.size > BIG_US;
    var shut = !(cur && cur.ok);
    var sub = shut ? esc(L('حفظُ الملفّاتِ عندنا لم يُفتح لحسابك بعد.', 'Keeping files with us is not open to your account yet.'))
      : (big ? esc(L('أكبرُ من ‎40 م.ب — مكانُه درايف.', 'Over 40 MB — Drive is the place for it.'))
             : esc(L('نضمنه ثلاثةَ أيّام، ثمّ يُحذف الأقدمُ حين تمتلئ مساحتُنا.', 'We keep it three days; after that the oldest goes when our space fills.')));
    return opt(a, 'fa-solid fa-cloud', title, sub, '', '', shut || big);
  }
  function sayHere() {
    view('here', L('أين نحفظ هذا الملفّ؟', 'Where should we keep this file?'),
      '<div class="npc-opts">' + driveOpt() +
      usOpt('keep', L('عندكم', 'With you')) +
      opt('later', 'fa-solid fa-laptop', L('على هذا الجهاز وحدَه', 'On this device only'),
        esc(L('رسمُك يُزامَن، والملفُّ لا يُرفع.', 'Your drawings sync; the file is not uploaded.'))) + '</div>' +
      (cur && cur.ok ? vow() : ''));
  }

  function sayGd() {
    var link = 'https://drive.google.com/file/d/' + encodeURIComponent(cur.gd) + '/view';
    view('drive', L('نسخةٌ في درايفك', 'A copy is in your Drive'),
      '<p>' + esc(L('يفتح هذا الملفُّ على أجهزتك جميعاً من درايفك — باقٍ بلا ضغطٍ ولا حذف.',
                    'This file opens on all your devices from your Drive — kept for good, never squeezed or deleted.')) + '</p>' +
      '<p class="npc-path" dir="ltr">' + esc(where()) + '</p>',
      '<a class="gsf-btn gsf-btn--ghost" href="' + esc(link) + '" target="_blank" rel="noopener"><i class="fa-brands fa-google-drive" aria-hidden="true"></i><span>' +
        esc(L('افتحْه في درايف', 'Open it in Drive')) + '</span></a>');
  }

  function sayHave(hit) {
    var n = hit && Number(hit.stored_bytes) || 0;
    view('have', L('أين نحفظ هذا الملفّ؟', 'Where should we keep this file?'),
      '<div class="npc-opts">' + driveOpt() +
      opt('link', 'fa-solid fa-link', L('عندكم — موجودٌ سلفاً', 'With you — already there'),
        esc(L('اربطْه بحسابك فيفتح على أجهزتك بلا رفع', 'Link it to your account and it opens on your devices, no upload')) + (n ? ' · ' + num(size(n)) : '')) +
      opt('later', 'fa-solid fa-laptop', L('على هذا الجهاز وحدَه', 'On this device only'),
        esc(L('رسمُك يُزامَن، والملفُّ لا يُرفع.', 'Your drawings sync; the file is not uploaded.'))) + '</div>' + vow());
  }

  function sayUp() {
    var pc = Math.round(prog * 100);
    var d = view('up', busy === 'gd' ? L('يُرفع إلى درايفك', 'Uploading to your Drive') : L('يُرفع الملفّ', 'Uploading the file'),
      '<div class="npc-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
      pc + '"><span style="--p:' + pc + '%"></span></div>' +
      '<p><b class="npc-pc">' + num(pc + '%') + '</b> · ' +
      esc(L('واصِلْ عملَك — أغلقْ هذه النافذةَ إن شئت، والرفعُ يكمل.',
            'Keep working — close this window if you like; the upload carries on.')) + '</p>',
      button('cancel', L('ألغِ الرفع', 'Cancel upload'), 'ghost'));
    return d;
  }

  function tick() {
    if (!shown() || !busy || dlg.getAttribute('data-state') !== 'up') return;
    var pc = Math.round(prog * 100);
    var m = dlg.querySelector('.npc-meter');
    if (m) {
      m.setAttribute('aria-valuenow', String(pc));
      m.firstChild.style.setProperty('--p', pc + '%');
    }
    var t = dlg.querySelector('.npc-pc .npc-num');
    if (t) t.textContent = pc + '%';
  }

  function sayUs(row) {
    var bytes = Number(row.stored_bytes) || 0;
    var orig = Number(row.squeeze) === 1 ? Number(row.orig_bytes) || 0 : 0;
    var facts = [];
    if (bytes) {
      facts.push(num(size(bytes)) + (orig > bytes
        ? ' ' + esc(L('مضغوطٌ من ', 'squeezed from ')) + num(size(orig)) : ''));
    }
    if (row.created_at) facts.push(esc(L('منذ ', 'since ')) + num(day(row.created_at)));
    view('us', L('نسخةٌ محفوظةٌ عندنا', 'A copy is kept with us'),
      '<p>' + esc(L('يفتح هذا الملفُّ على أجهزتك جميعاً — وإن غاب عن جهازٍ جلبناه له.',
                    'This file opens on all your devices — if one lacks it, we fetch it there.')) + '</p>' +
      (facts.length ? '<ul class="npc-facts">' + facts.map(function (x) {
        return '<li>' + x + '</li>';
      }).join('') + '</ul>' : ''),
      button('drop', L('احذفِ النسخة', 'Delete the copy'), 'danger', 'fa-trash'));
  }

  function askDrop() {
    view('drop', L('تُحذف النسخةُ من عندنا؟', 'Delete the copy kept with us?'),
      '<p>' + esc(L('يبقى الملفُّ على هذا الجهاز ورسمُك كما هو — لكنه لن يفتح على أجهزتك الأخرى.',
                    'The file stays on this device and your drawings are untouched — it just will ' +
                    'not open on your other devices.')) + '</p>',
      button('back', L('تراجعْ', 'Keep it'), 'ghost') +
      button('yes', L('احذفْ', 'Delete'), 'danger'));
  }

  function bad(why, title) {
    view('bad', title || L('لم تُحفظِ النسخة', 'The copy was not saved'),
      '<p class="npc-bad"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ' +
      esc(why) + '</p>',
      button('retry', L('أعِدِ المحاولة', 'Try again'), 'ghost', 'fa-rotate'));
  }

  function big(e, file) {
    if (e.error === 'big_exhausted') {
      bad(L('حجمُ الملفِّ ' + size(e.bytes) + ' — وقد استعملتَ خانةَ الفصل الكبيرة (‏حتى ' + size(e.big_max) + ') هذا الفصل.',
            'The file is ' + size(e.bytes) + ' — and you have used this term’s large slot (up to ' + size(e.big_max) + ').'));
      return;
    }
    if (e.error === 'too_large' && e.big_max && e.bytes <= e.big_max) {
      if (!(e.big_left > 0)) {
        bad(L('حجمُ الملفِّ ' + size(e.bytes) + ' — وقد استعملتَ خانةَ الفصل الكبيرة هذا الفصل.',
              'The file is ' + size(e.bytes) + ' — and you have used this term’s large slot.'));
        return;
      }
      cur.over = file;
      cur.overBig = 1;
      view('big', L('الملفُّ أكبرُ من الحدّ', 'The file is over the limit'),
        '<p>' + esc(L('حجمُه ', 'It is ')) + num(size(e.bytes)) + esc(L(' والحدُّ ', ' and the limit is ')) + num(size(e.max)) + '.</p><p>' +
        esc(L('ولك في كلِّ فصلٍ ملفٌّ واحدٌ حتى ' + size(e.big_max) + ' — بقي لك ' + e.big_left + '. يُحفظ كما هو بلا ضغط.',
              'Each term you may upload one file up to ' + size(e.big_max) + ' — ' + e.big_left + ' left. It is kept as it is, uncompressed.')) + '</p>',
        button('later', L('ليس الآن', 'Not now'), 'ghost') +
        button('over', L('ارفعْه بخانة الفصل', 'Use the term’s slot'), 'go'));
      return;
    }
    cur.overBig = 0;
    if (e.error === 'too_large' && !e.over_max) {
      bad(L('حجمُ الملفِّ ' + size(e.bytes) + ' ويتجاوز الحدَّ الأقصى ' + size(e.max) + '.',
            'The file is ' + size(e.bytes) + ', over the hard limit of ' + size(e.max) + '.'));
      return;
    }
    if (e.error === 'over_exhausted' || !(e.over_left > 0)) {
      bad(L('حجمُ الملفِّ ' + size(e.bytes) + ' والحدُّ ' + size(e.max) +
            ' · وقد استنفدتَ تجاوزاتِ هذا الفصل.',
            'The file is ' + size(e.bytes) + ' and the limit is ' + size(e.max) +
            ' · you have used all of this term’s exceptions.'));
      return;
    }
    cur.over = file;
    view('big', L('الملفُّ أكبرُ من الحدّ', 'The file is over the limit'),
      '<p>' + esc(L('حجمُه ', 'It is ')) + num(size(e.bytes)) + esc(L(' والحدُّ ', ' and the limit is ')) +
      num(size(e.max)) + '.</p><p>' +
      esc(L('ولك في كلِّ فصلٍ ' + e.over_of + ' ملفّاتٍ حتى ' + size(e.over_max) +
            '، بقي لك ' + e.over_left + '.',
            'Each term you may upload ' + e.over_of + ' files up to ' + size(e.over_max) +
            '; ' + e.over_left + ' left.')) + '</p>',
      button('later', L('ليس الآن', 'Not now'), 'ghost') +
      button('over', L('ارفعْه واحسبْها', 'Use one and upload'), 'go'));
  }

  function excuse(why) {
    if (why === 'no_vault') {
      return L('فعّلِ المزامنةَ أوّلاً — من ⚙ الإعدادات ← المزامنة. عندها يُحفظ الملفُّ عندنا ويفتح على بقيّةِ أجهزتك.',
               'Turn sync on first — Settings ⚙ → Sync. Then the file is kept with us and opens on your other devices.');
    }
    if (why === 'locked') {
      return L('خزنتُك مقفلةٌ على هذا الجهاز. افتحْها من المزامنةِ ثمَّ أعِدْ المحاولة.',
               'Your vault is locked on this device. Unlock it from Sync, then try again.');
    }
    if (why === 'not_enrolled') {
      return L('حفظُ الملفّاتِ عندنا ما زال في التجربةِ ولم يُفتح لحسابك بعد. ورسمُك وملاحظاتُك تُزامَن كالمعتاد.',
               'Keeping files with us is still in testing and is not open to your account yet. Your drawings and notes sync as usual.');
    }
    if (why === 'not_configured') {
      return L('خدمةُ الملفّاتِ متوقّفةٌ الآن عندنا — لا عندك. جرّبْ بعد قليل.',
               'Our file service is down right now — not yours. Try again shortly.');
    }
    if (why === 'rate_limited') {
      return L('محاولاتٌ كثيرةٌ في وقتٍ قصير. انتظرْ دقيقةً ثمَّ أعِدْ المحاولة.',
               'Too many attempts in a short time. Wait a minute, then try again.');
    }
    if (why === 'offline') {
      return L('لا اتّصالَ بالشبكةِ الآن. الملفُّ ورسمُك محفوظان على هذا الجهاز.',
               'You are offline. The file and your drawings are safe on this device.');
    }
    return L('تعذّر الوصولُ إلى خدمةِ الملفّات', 'The file service could not be reached') +
           (why ? ' (' + why + ')' : '') + '.';
  }

  function reason(e) {
    var k = (e && (e.error || e.message)) || '';
    if (k === 'too_many_files') {
      return L('بلغتَ عددَ الملفّاتِ المسموحِ في حسابك.',
               'You have reached the file count limit on your account.');
    }
    if (k === 'hash_mismatch') {
      return L('ما وصلنا يخالف ما أُرسل — أعِدْ المحاولة.',
               'What arrived differs from what was sent — please try again.');
    }
    if (k === 'not_found') return excuse('not_enrolled');
    if (k === 'files_not_configured') return excuse('not_configured');
    if (k === 'no_vault') return excuse('no_vault');
    if (k === 'bad_mime') {
      return L('هذه الصيغةُ لا نقبلها بعد' + (e && e.mime ? ' (' + e.mime + ')' : '') + '.',
               'We do not accept this format yet' + (e && e.mime ? ' (' + e.mime + ')' : '') + '.');
    }
    if (k === 'vault_full') {
      return L('مساحتُك عندنا ممتلئةٌ بملفّاتٍ لم تُكمل ثلاثةَ أيّام — احذفْ ما لا تحتاجه من «المزامنة ⇐ ملفّاتُك عندنا» ثمّ أعِدِ المحاولة.',
               'Your space with us is full of files under three days old — delete what you do not need in “Sync ⇒ Your files with us”, then try again.');
    }
    if (k === 'not_uploaded') {
      return L('انقطع الرفعُ قبل أن يصل شيء — أعِدْ المحاولة.',
               'The upload stopped before anything arrived — please try again.');
    }
    if (k === 'rate_limited') return excuse('rate_limited');
    if (/^put_/.test(k)) {
      return L('انقطع الاتّصالُ أثناء الرفع — أعِدْ المحاولة.',
               'The connection dropped during upload — please try again.');
    }
    return L('تعذّر الرفع.', 'Upload failed.');
  }

  function askHave(h, then) {
    var f = F();
    if (!f || !f.have || !h) { then(null); return; }
    f.have(h).then(function (r) { then(r && r.hit ? r : null); }, function () { then(null); });
  }

  function ask() {
    if (!cur) return false;
    open();
    var mine = cur;
    mine.nu = false;
    markSeen(mine.h);
    paint();
    if (busy) { sayUp(); return true; }
    if (mine.gd) { sayGd(); return true; }
    var f = F();
    if (!f) { if (mine.drive) sayHere(); else bad(excuse(''), L('نسخةُ هذا الملفّ', 'This file’s copy')); return true; }
    wait();
    f.state().then(function (a) {
      if (mine !== cur || !shown()) return;
      if (!a.ok) { if (mine.drive) { mine.ok = false; sayHere(); return; } bad(excuse(a.why), L('نسخةُ هذا الملفّ', 'This file’s copy')); return; }
      mine.ok = true;
      var row = (a.files || []).filter(function (x) { return x.ref_id === refIdOf(mine.h); })[0];
      mine.row = row || null;
      mine.slim = slimPlan(row);
      paint();
      if (row) { sayUs(row); return; }
      askHave(mine.h, function (hit) {
        if (mine !== cur || !shown()) return;
        if (hit) sayHave(hit); else sayHere();
      });
    })['catch'](function (e) {
      if (mine !== cur || !shown()) return;
      if (mine.drive) { mine.ok = false; sayHere(); return; }
      bad(reason(e));
    });
    return true;
  }

  function toDrive() {
    var mine = cur;
    if (!mine || !mine.drive) return;
    grab().then(function (file) {
      if (mine !== cur) return;
      if (!file) { bad(L('تعذّرت قراءةُ الملفِّ من هذا الجهاز.', 'The file could not be read from this device.')); return; }
      busy = 'gd'; prog = 0;
      paint();
      sayUp();
      return Promise.resolve(mine.drive()).then(function (GD) {
        return GD.token(true).then(function () {
          return GD.upload(file, { name: mine.name || file.name || 'file.pdf', mime: 'application/pdf', sha: mine.h,
            kind: 'pdf', course: mine.course, onProgress: function (at, of) { prog = of ? at / of : 0; tick(); } });
        }).then(function (r) {
          busy = false;
          mine.gd = r.id;
          emit('garden:fileDrive', { h: mine.h, id: r.id, name: r.name });
          if (mine.onDrive) { try { mine.onDrive(r.id); } catch (e0) {} }
          if (mine !== cur) return;
          paint();
          flash();
          if (shown()) sayGd();
        }, function (e) {
          busy = false;
          if (mine !== cur) return;
          paint();
          if (!shown()) open();
          bad(GD.reason(e), L('لم يُحفظ في درايف', 'It was not saved to Drive'));
        });
      });
    });
  }

  function grab() {
    if (!cur || !cur.getFile) return Promise.resolve(null);
    try { return Promise.resolve(cur.getFile())['catch'](function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }

  function keep(over) {
    var mine = cur;
    grab().then(function (file) {
      if (mine !== cur) return;
      if (!file) {
        bad(L('تعذّرت قراءةُ الملفِّ من هذا الجهاز.', 'The file could not be read from this device.'));
        return;
      }
      run(file, over);
    });
  }

  function run(file, over) {
    var mine = cur;
    var h = mine.h;
    var refId = refIdOf(h);
    busy = true; prog = 0;
    paint();
    sayUp();
    ac = window.AbortController ? new AbortController() : null;
    function on(e) {
      var d = e.detail || {};
      if (d.ref_id !== refId) return;
      if (d.stage === 'upload' && d.of) prog = Math.max(0, Math.min(1, d.at / d.of));
      if (d.stage === 'deduped' || d.stage === 'commit') prog = 1;
      tick();
    }
    window.addEventListener('garden:fileProgress', on);
    F().upload(file, { refId: refId, name: mine.name || file.name || 'file.pdf',
                       mime: 'application/pdf',
                       over: !!over && !mine.overBig, big: !!over && !!mine.overBig, signal: ac ? ac.signal : null })
      .then(function (r) {
        window.removeEventListener('garden:fileProgress', on);
        busy = false;
        markSeen(h);
        emit('garden:fileUploaded', { ref_id: refId, h: h, bytes: r.bytes, to: 'us' });
        var row = { ref_id: refId, stored_bytes: r.bytes, orig_bytes: r.bytes,
                    squeeze: 0, created_at: new Date().toISOString() };
        mine.row = row;
        if (mine !== cur) return;
        paint();
        flash();
        if (shown()) sayUs(row);
      }, function (e) {
        window.removeEventListener('garden:fileProgress', on);
        busy = false;
        if (mine !== cur) return;
        paint();
        var gone = e && /aborted/.test(e.message || '');
        if (!shown()) {
          if (gone) return;
          open();
        }
        if (e && (e.error === 'too_large' || e.error === 'over_exhausted' || e.error === 'big_exhausted')) { big(e, file); return; }
        if (gone) { sayHere(); return; }
        bad(reason(e));
      });
  }

  function drop() {
    var f = F();
    var mine = cur;
    if (!f || !mine) { shut(); return; }
    wait();
    f.remove(refIdOf(mine.h)).then(function (okd) {
      if (!okd) throw new Error('drop_failed');
      emit('garden:fileDropped', { ref_id: refIdOf(mine.h), h: mine.h });
      mine.row = null;
      mine.slim = null;
      if (mine !== cur) return;
      paint();
      if (shown()) sayHere();
    })['catch'](function (e) {
      if (mine !== cur || !shown()) return;
      bad(e && e.message === 'drop_failed'
            ? L('لم يقبل الخادمُ الحذفَ الآن — أعِدِ المحاولة.', 'The server did not accept the delete — please try again.')
            : reason(e),
          L('لم تُحذفِ النسخة', 'The copy was not deleted'));
    });
  }

  function act(a) {
    if (a === 'later') { shut(); return; }
    if (a === 'drive') { toDrive(); return; }
    if (a === 'keep' || a === 'link') { keep(false); return; }
    if (a === 'over') {
      var f0 = cur && cur.over;
      if (f0) run(f0, true); else keep(true);
      return;
    }
    if (a === 'cancel') { if (ac) { try { ac.abort(); } catch (e) {} } return; }
    if (a === 'drop') { askDrop(); return; }
    if (a === 'back') { if (cur && cur.row) sayUs(cur.row); else ask(); return; }
    if (a === 'yes') { drop(); return; }
    if (a === 'retry') { ask(); }
  }

  function offer(o) {
    var f = F();
    if (!o || !o.h) return;
    var mine = cur = { h: o.h, name: o.name || '', getFile: o.getFile || null,
                       ok: false, row: null, nu: false, slim: null,
                       gd: o.gd || null, drive: o.drive || null, course: o.course || '', size: o.size || 0, onDrive: o.onDrive || null };
    busy = false;
    prog = 0;
    paint();
    if (!f) return;
    f.state().then(function (a) {
      if (mine !== cur || !a.ok) return;
      mine.ok = true;
      var row = (a.files || []).filter(function (x) { return x.ref_id === refIdOf(mine.h); })[0];
      if (row) { mine.row = row; mine.slim = slimPlan(row); markSeen(mine.h); }
      else if (!seen()[refIdOf(mine.h)]) mine.nu = true;
      paint();
    })['catch'](function () {});
  }

  function forget() {
    var was = cur;
    shut();
    cur = null;
    busy = false;
    prog = 0;
    clearTimeout(doneT);
    var b = btn();
    if (b) b.removeAttribute('data-done');
    paint();
    if (was && was.slim) {
      setTimeout(function () { slim(was.h, was.name, was.slim); }, 1500);
    }
  }

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#na-cloud') : null;
    if (b && !b.hidden) ask();
  });

  window.addEventListener('garden:fileStored', function (e) {
    var d = (e && e.detail) || {};
    if (!cur || busy || d.ref_id !== refIdOf(cur.h)) return;
    if (!cur.row) {
      cur.row = { ref_id: d.ref_id, stored_bytes: d.bytes || 0, orig_bytes: d.bytes || 0,
                  squeeze: 0, created_at: new Date().toISOString() };
    }
    cur.ok = true;
    cur.nu = false;
    markSeen(cur.h);
    paint();
  });
  window.addEventListener('garden:fileRemoved', function (e) {
    var d = (e && e.detail) || {};
    if (!cur || d.ref_id !== refIdOf(cur.h) || !cur.row) return;
    cur.row = null;
    cur.slim = null;
    paint();
    if (shown() && !busy) sayHere();
  });

  var OCR_META = 'pdfocr:';
  var OCR_E = 2;
  var OCRQ = {};
  function ocr(h) {
    if (!/^[0-9a-f]{64}$/.test(String(h || ''))) return Promise.resolve(null);
    if (OCRQ[h]) return OCRQ[h];
    var S = window.GardenNotesStore, f = F();
    var p = (S && S.meta ? S.meta(OCR_META + h, null) : Promise.resolve(null)).then(function (c) {
      /*@3.NOPJ12.3*/
      if (c && c.v === 1 && ((c.e || 1) >= OCR_E || (c._at && Date.now() - c._at < 864e5))) return { state: 'ready', data: c };
      if (!f || !f.ocrState) return null;
      return f.ocrState(refIdOf(h)).then(function (r) {
        if (!r || r.ocr === 'none') return null;
        if (r.ocr !== 'ready' || !r.url) return { state: 'pending' };
        if (typeof DecompressionStream !== 'function') return null;
        return fetch(r.url).then(function (res) {
          if (!res.ok || !res.body) throw new Error('ocr_' + res.status);
          return new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).json();
        }).then(function (d) {
          if (!d || d.v !== 1 || typeof d.p !== 'object') return null;
          d._at = Date.now();
          if (S && S.setMeta) S.setMeta(OCR_META + h, d);
          return { state: 'ready', data: d };
        });
      });
    })['catch'](function () { return null; }).then(function (r) {
      if (!r || r.state !== 'ready') delete OCRQ[h];
      return r;
    });
    OCRQ[h] = p;
    return p;
  }

  window.GardenPdfCloud = {
    refIdOf: refIdOf,
    reason: reason,
    restore: restore,
    restoreX: restoreX,
    offer: offer,
    forget: forget,
    ask: ask,
    close: shut,
    busy: function () { return busy; },
    slim: slim,
    slimPlan: slimPlan,
    ocr: ocr
  };
})();
