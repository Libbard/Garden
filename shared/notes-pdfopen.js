;(function () {
  'use strict';

  var MAX_PAGES = 9000;
  var SOFT_BYTES = 150 * 1024 * 1024;
  var HARD_BYTES = 500 * 1024 * 1024;

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(a, b) { return isAr() ? a : b; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function size(n) {
    var u = ['B', 'KB', 'MB', 'GB'], i = 0, v = Number(n) || 0;
    while (v >= 1024 && i < 3) { v /= 1024; i++; }
    return (i ? v.toFixed(1) : String(Math.round(v))) + ' ' + u[i];
  }

  function num(txt) {
    return '<span class="npo-num">' + esc(txt) + '</span>';
  }

  function pickFile() {
    return new Promise(function (ok) {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'application/pdf,.pdf';
      inp.className = 'npo-file';
      document.body.appendChild(inp);
      var done = false;
      function fin(f) {
        if (done) return;
        done = true;
        if (inp.parentNode) inp.parentNode.removeChild(inp);
        ok(f || null);
      }
      inp.addEventListener('change', function () { fin(inp.files && inp.files[0]); });
      inp.addEventListener('cancel', function () { fin(null); });
      /*@3.NOPJ5.2*/
      window.addEventListener('focus', function () {
        setTimeout(function () { if (!inp.files || !inp.files.length) fin(null); }, 600);
      }, { once: true });
      inp.click();
    });
  }

  function parse(file, pass) {
    var V = window.GardenPdfView;
    if (!V) return Promise.reject(new Error('no-view'));
    var url = URL.createObjectURL(file);
    return V.load(url, pass ? { password: pass } : null).then(function (h) {
      return { handle: h, url: url, pages: h.pages };
    }, function (e) {
      try { URL.revokeObjectURL(url); } catch (e2) {}
      throw e;
    });
  }

  /*@3.NOPJ5.14*/
  function locked(e) {
    return !!(e && (e.name === 'PasswordException' || e.code === 1 || e.code === 2));
  }

  function askPass(name, again) {
    return new Promise(function (done) {
      var dlg = document.createElement('dialog');
      dlg.className = 'gsf gsf--snug npo-lock';
      dlg.setAttribute('data-keep-open', '');
      dlg.innerHTML =
        '<div class="gsf-body"><div class="gsf-head">' +
        '<h2 class="gsf-title">' +
        esc(L('هذا الملفُّ محميٌّ بكلمةِ مرور', 'This file is password protected')) + '</h2>' +
        '<p class="gsf-sub">' +
        esc(again
          ? L('كلمةُ المرورِ غيرُ صحيحة — جرّبْ مرّةً أخرى.',
              'That password is not right — try again.')
          : L('اكتبْ كلمةَ مرورِ الملفِّ ليُفتَح. لا تُحفَظ ولا تُرسَل إلى أحد.',
              'Type the file password to open it. It is never stored or sent anywhere.')) +
        '</p>' + (name ? '<p class="gsf-sub"><span class="gsf-code">' + esc(name) + '</span></p>' : '') +
        '<input type="password" class="gsf-in npo-pw" autocomplete="off" ' +
        'aria-label="' + esc(L('كلمةُ مرورِ الملفّ', 'File password')) + '">' +
        '</div></div>' +
        '<div class="gsf-foot"><div class="gsf-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-a="no">' +
        esc(L('إلغاء', 'Cancel')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--go" data-a="go">' +
        esc(L('افتحْ', 'Open')) + '</button>' +
        '</div></div>';
      document.body.appendChild(dlg);
      var inp = dlg.querySelector('.npo-pw');
      function shut(v) {
        try { dlg.close(); } catch (e) {}
        if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
        done(v);
      }
      dlg.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-a]') : null;
        if (!b) return;
        shut(b.getAttribute('data-a') === 'go' ? (inp.value || '') : null);
      });
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); shut(null); });
      if (inp) {
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); shut(inp.value || ''); }
        });
      }
      try { dlg.showModal(); } catch (e2) { shut(null); }
      if (inp) { try { inp.focus(); } catch (e3) {} }
    });
  }

  /*@3.NOPJ5.15*/
  function unlock(file, tries) {
    var left = tries == null ? 4 : tries;
    var name = (file && file.name) || '';
    var step = function (pass, again) {
      return parse(file, pass).catch(function (e) {
        if (!locked(e) || left-- <= 0) throw e;
        return askPass(name, again).then(function (v) {
          if (v === null) { var q = new Error('cancelled'); q.cancelled = true; throw q; }
          return step(v, true);
        });
      });
    };
    return step('', false);
  }

  function drop(pre) {
    if (!pre) return;
    if (pre.handle && pre.handle.doc) { try { pre.handle.doc.destroy(); } catch (e) {} }
    if (pre.url) { try { URL.revokeObjectURL(pre.url); } catch (e2) {} }
  }

  function spec(r, file, pages) {
    return { h: r.hash, n: (file && file.name) || '', sz: r.size, pg: pages };
  }

  /*@3.NOPJ5.9*/
  function weigh(file) {
    var n = (file && file.size) || 0;
    if (n > HARD_BYTES) return { ok: false, heavy: true, size: n };
    return { ok: true, heavy: n > SOFT_BYTES, size: n };
  }

  function adopt(file, onProgress) {
    var D = window.GardenPdfDoc;
    if (!D) return Promise.reject(new Error('no-doc'));
    var w = weigh(file);
    if (!w.ok) {
      var big = new Error('too-large');
      big.bytes = w.size;
      return Promise.reject(big);
    }
    return D.hash(file, onProgress).then(function (r) {
      return unlock(file).then(function (pre) {
        if (pre.pages > MAX_PAGES) {
          drop(pre);
          var e = new Error('too-many-pages');
          e.pages = pre.pages;
          throw e;
        }
        return D.has(r.hash).then(function (had) {
          if (had) return { spec: spec(r, file, pre.pages), pre: pre, stored: true };
          return D.put(r.hash, file, { name: file.name || '' }).then(function (okd) {
            return { spec: spec(r, file, pre.pages), pre: pre, stored: !!okd };
          });
        });
      });
    });
  }

  function open(host, want, o) {
    o = o || {};
    var st = { dead: false, view: null, url: null, h: null, scale: 1, zm: 'page', page: 1, total: 0,
               find: null,
               mode: (o.mode === 2 || o.mode === 4) ? o.mode : 1,
               order: o.order === 'col' ? 'col' : 'row',
               side: o.side === 'rtl' ? 'rtl' : (o.side === 'ltr' ? 'ltr' : ''),
               flow: o.flow === 'page' ? 'page' : 'cont' };
    var sp = want || {};

    host.innerHTML = '';
    var root = document.createElement('div');
    root.className = 'npo';
    var stage = document.createElement('div');
    stage.className = 'npo-stage';
    root.appendChild(stage);
    host.appendChild(root);

    function scroller() { return o.scroller || host; }

    function card(icon, title, body, acts) {
      stage.innerHTML =
        '<div class="npo-card">' +
        '<i class="fa-solid ' + esc(icon) + ' npo-card-i" aria-hidden="true"></i>' +
        '<p class="npo-card-t" dir="auto">' + title + '</p>' +
        (body ? '<p class="npo-card-b">' + body + '</p>' : '') +
        (acts || '') + '</div>';
    }

    function busy(msg) {
      stage.innerHTML =
        '<div class="na-opening" role="status">' +
        '<span class="na-opening-spin" aria-hidden="true"></span>' +
        '<p class="npo-msg">' + esc(msg) + '</p></div>';
    }

    function step(pct) {
      var p = stage.querySelector('.npo-msg');
      if (p) p.textContent = L('تُقرأ بصمةُ الملفّ… ', 'Reading the file fingerprint… ') + pct + '%';
    }

    /*@3.NOPJ5.10*/
    function keepNote(why) {
      if (why === 'insecure') {
        return L('لن يُحفَظ هذا الملفُّ على هذا الجهاز لأن الصفحةَ مفتوحةٌ باتّصالٍ غيرِ آمنٍ (‏http). ' +
                 'افتحِ الموقعَ بعنوانه الرسميِّ ليبقى الملفُّ محفوظاً.',
                 'This file will not be kept on this device because the page is open over an ' +
                 'insecure connection (http). Open the site at its official address to keep it.');
      }
      return L('تعذّر حفظُ الملفِّ على هذا الجهاز — المتصفّحُ لا يسمح بالتخزين هنا. ' +
               'سيُطلَب منك اختيارُه في كلِّ مرّة.',
               'The file could not be kept on this device — the browser is blocking storage here. ' +
               'You will be asked to pick it every time.');
    }

    function ask(note) {
      card('fa-file-lines',
        esc(sp.n || L('ملفُّ PDF', 'PDF file')),
        (note ? esc(note) + '<br>' : '') +
        esc(L('هذا الملفُّ ليس على هذا الجهاز — اخترْه من جهازك ليُفتح.',
              'This file is not on this device — pick it to open it.')) +
        (sp.sz ? '<br>' + num(size(sp.sz)) +
          (sp.pg ? ' · ' + num(String(sp.pg)) + ' ' + esc(L('صفحة', 'pages')) : '') : ''),
        (sp.gd && o.drive
          ? '<div class="npo-acts"><button type="button" class="gsf-btn gsf-btn--gd npo-drive">' +
            '<i class="fa-brands fa-google-drive" aria-hidden="true"></i> ' +
            esc(L('افتحْ من درايف', 'Open from Drive')) + '</button>' +
            '<button type="button" class="gsf-btn gsf-btn--ghost npo-pick">' +
            '<i class="fa-solid fa-file-import" aria-hidden="true"></i> ' +
            esc(L('اخترْه من جهازي', 'Pick it from my device')) + '</button></div>'
          : '<button type="button" class="gsf-btn gsf-btn--go npo-pick">' +
            '<i class="fa-solid fa-file-import" aria-hidden="true"></i> ' +
            esc(L('اخترِ الملفّ', 'Choose the file')) + '</button>'));
      var b = stage.querySelector('.npo-pick');
      if (b) b.addEventListener('click', take);
      var gdB = stage.querySelector('.npo-drive');
      if (gdB) gdB.addEventListener('click', fromDrive);
      if (!note && window.GardenPdfDoc) {
        window.GardenPdfDoc.available().then(function (a) {
          if (st.dead || a.ok) return;
          var el = stage.querySelector('.npo-card-b');
          if (el) {
            el.insertAdjacentHTML('beforeend',
              '<span class="npo-warnline"><i class="fa-solid fa-triangle-exclamation" ' +
              'aria-hidden="true"></i> ' + esc(keepNote(a.why)) + '</span>');
          }
        });
      }
    }

    function fail(msg) {
      card('fa-triangle-exclamation', esc(msg), '',
        '<button type="button" class="gsf-btn npo-pick">' +
        '<i class="fa-solid fa-file-import" aria-hidden="true"></i> ' +
        esc(L('اخترْ ملفاً آخر', 'Pick another file')) + '</button>');
      var b = stage.querySelector('.npo-pick');
      if (b) b.addEventListener('click', take);
    }

    function tooMany(n) {
      return L('هذا الملفُّ ' + n + ' صفحةً، والحدُّ المدعوم ' + MAX_PAGES + '.',
               'This file has ' + n + ' pages; the supported limit is ' + MAX_PAGES + '.');
    }

    function broken() {
      return L('تعذّر فتحُ هذا الملفّ — قد يكون تالفاً.',
               'Could not open this file — it may be damaged.');
    }

    function sealed() {
      return L('هذا الملفُّ محميٌّ بكلمةِ مرور، ولم تُقبَل الكلمةُ التي أُدخلت.',
               'This file is password protected, and the password entered was not accepted.');
    }

    /*@3.NOPJ5.1*/
    function warn(got, file, pre) {
      var dlg = document.createElement('dialog');
      dlg.className = 'gsf gsf--snug npo-warn';
      dlg.setAttribute('data-keep-open', '');
      dlg.innerHTML =
        '<div class="gsf-body">' +
        '<div class="gsf-head"><h2 class="gsf-title">' +
        esc(L('هذا ليس الملفَّ نفسَه', 'This is not the same file')) + '</h2>' +
        '<p class="gsf-sub">' +
        esc(L('بصمةُ الملفِّ الذي اخترتَه تخالف بصمةَ الملفِّ المرتبطِ بهذه الوثيقة. ' +
              'قد يكون ملفاً آخر، أو النسخةَ نفسَها وقد عُدِّلت.',
              'The fingerprint of the file you picked differs from the one bound to this ' +
              'document. It may be a different file, or the same one after an edit.')) +
        '</p><p class="gsf-sub npo-hashes">' +
        esc(L('المرتبطة: ', 'Bound: ')) + '<span class="gsf-code">' +
        esc(String(sp.h || '').slice(0, 12)) + '</span><br>' +
        esc(L('المختارة: ', 'Picked: ')) + '<span class="gsf-code">' +
        esc(String(got.hash || '').slice(0, 12)) + '</span>' +
        '</p></div></div>' +
        '<div class="gsf-foot"><div class="gsf-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-a="no">' +
        esc(L('ملفٌّ آخر — ألغِ', 'Different file — cancel')) + '</button>' +
        '<button type="button" class="gsf-btn" data-a="once">' +
        esc(L('افتحه هذه المرّة فقط', 'Open it just this once')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--go" data-a="link">' +
        esc(L('هو نفسه وقد حُدِّث — اربطْ به', 'Same file, updated — bind to it')) + '</button>' +
        '</div></div>';
      document.body.appendChild(dlg);
      function close(a) {
        try { dlg.close(); } catch (e) {}
        if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
        if (st.dead) { drop(pre); return; }
        if (a === 'no') { drop(pre); ask(); return; }
        if (a === 'link' && o.onRelink) {
          sp = spec(got, file, pre.pages);
          if (st.gdNext) sp.gd = st.gdNext;
          o.onRelink(sp, (want && want.h) || null);
          show(file, pre, got.hash);
          return;
        }
        show(file, pre);
      }
      dlg.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-a]') : null;
        if (b) close(b.getAttribute('data-a'));
      });
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); close('no'); });
      try { dlg.showModal(); } catch (e2) { close('once'); }
    }

    function fromDrive() {
      busy(L('يُجلب من درايف…', 'Fetching from Drive…'));
      o.drive(sp, function (pct) {
        var p = stage.querySelector('.npo-msg');
        if (p) p.textContent = L('يُجلب من درايف… ', 'Fetching from Drive… ') + pct + '%';
      }, true).then(function (file) {
        if (st.dead) return;
        if (!file) { ask(); return; }
        useFile(file, sp.gd);
      }, function (e) {
        if (st.dead) return;
        ask(o.driveWhy ? o.driveWhy(e) : '');
      });
    }

    function take() {
      pickFile().then(function (file) {
        if (!file || st.dead) return;
        useFile(file, null);
      });
    }

    function useFile(file, gd) {
      st.gdNext = gd || null;
      (function () {
        var D = window.GardenPdfDoc;
        if (!D) { fail(broken()); return; }
        busy(L('تُقرأ بصمةُ الملفّ…', 'Reading the file fingerprint…'));
        D.hash(file, function (at, of) {
          if (of) step(Math.round(at * 100 / of));
        }).then(function (r) {
          if (st.dead) return null;
          return unlock(file).then(function (pre) {
            if (st.dead) { drop(pre); return null; }
            if (pre.pages > MAX_PAGES) { drop(pre); fail(tooMany(pre.pages)); return null; }
            D.put(r.hash, file, { name: file.name || '' });
            if (sp.h && r.hash !== sp.h) { warn(r, file, pre); return null; }
            if (!sp.h && o.onRelink) {
              sp = spec(r, file, pre.pages);
              if (st.gdNext) sp.gd = st.gdNext;
              o.onRelink(sp, null);
            }
            show(file, pre, r.hash);
            return null;
          });
        })['catch'](function (e) {
          if (st.dead) return;
          if (e && e.cancelled) { ask(); return; }
          fail(locked(e) ? sealed() : broken());
        });
      }());
    }

    function show(file, pre, hh) {
      busy(L('يُفتح الملفّ…', 'Opening the file…'));
      var p = pre ? Promise.resolve(pre) : unlock(file);
      p.then(function (h) {
        if (st.dead) { drop(h); return; }
        if (h.pages > MAX_PAGES) { drop(h); fail(tooMany(h.pages)); return; }
        st.url = h.url;
        st.h = h.handle;
        st.total = h.pages;
        build();
        if (hh && window.GardenPdfCloud) {
          window.GardenPdfCloud.offer({
            h: hh, name: sp.n || (file && file.name) || '',
            getFile: function () {
              return file ? Promise.resolve(file) : window.GardenPdfDoc.get(hh);
            }
          });
        }
      }, function (e) {
        if (st.dead) return;
        if (e && e.cancelled) { ask(); return; }
        fail(locked(e) ? sealed() : broken());
      });
    }

    function build() {
      stage.innerHTML = '';
      settle(function () {
        if (st.dead) return;
        var V = window.GardenPdfView;
        /*@3.NOPJ5.3*/
        /*@3.NOPJ5.7*/
        var want = (o.pos && o.pos.z) || 'page';
        var kz = (o.pos && o.pos.k > 0) ? o.pos.k : 0;
        var pw = (o.pos && o.pos.w > 0) ? o.pos.w : 0, rw = room();
        st.zm = (want === 'page' || want === 'fit') ? want : '';
        if (!st.zm && kz && pw && rw && Math.abs(rw - pw) / pw > 0.15) { st.zm = kz > 1 ? 'fit' : 'page'; kz = 0; }
        var seed = st.zm ? V.fitScale(st.h, room(), st.mode, tall(), st.zm === 'page')
                         : V.fitScale(st.h, room(), st.mode, tall(), false).then(function (fw) {
                             if (!(fw > 0)) return want > 0 ? want : 1;
                             st.uzRoom = room();
                             if (kz) { st.uz = kz; return fw * kz; }
                             if (want > 0 && want <= fw * 1.02) { st.uz = want / fw; return want; }
                             st.zm = 'fit'; st.uz = 1;
                             return fw;
                           });
        seed.then(function (n) {
          if (st.dead) return null;
          st.scale = clamp(n);
          makeInk();
          return V.mount(stage, st.h, {
            scroller: scroller(),
            scale: st.scale,
            mode: st.mode,
            order: st.order,
            flow: st.flow,
            side: st.side || guessSide(),
            stamp: o.stamp || null,
            onAsk: o.onAsk || null,
            /*@3.NOPJ5.20*/
            onLayer: function (n, el, geo) {
              if (st.ink) st.ink.layer(n, el, geo);
              if (o.onLayer) o.onLayer(n, el, geo);
            },
            offLayer: function (n, el) {
              if (st.ink) st.ink.off(n);
              if (o.offLayer) o.offLayer(n, el);
            },
            onText: function (n, td) { if (st.find) st.find.paint(n, td); },
            /*@3.NOPJ5.29*/
            annots: function (n, list) {
              var A = window.GardenPdfAnnot;
              if (!A || !list || !list.length) return false;
              var got = A.harvest(list);
              if (!got.mine) return false;
              if (st.ink && got.els.length && !o.marks) st.ink.absorb(n, got.els);
              return true;
            },
            onPinch: function (n) {
              /*@3.NOPJ5.18*/
              /*@3.NOPJ5.27*/
              if (st.fitT) { clearTimeout(st.fitT); st.fitT = 0; }
              st.tapBack = null;
              st.zm = ''; st.scale = n;
              save();
              noteUz(n, true);
              if (o.onZoom) o.onZoom(n, '');
            },
            onView: function (p) { st.page = p; tell(); },
            /*@3.NOPJ5.25*/
            onTapZoom: tapZoom
          });
        }).then(function (v) {
          if (!v) return;
          if (st.dead) { try { v.destroy(); } catch (e) {} return; }
          st.view = v;
          if (st.ink) st.ink.setView(v);
          var pos = o.pos || null;
          if (pos && (pos.p > 1 || pos.f)) v.goTo(pos.p || 1, pos.f || 0);
          makeFind();
          watch();
          tell();
          if (o.onReady) o.onReady({ pages: st.total, spec: sp, scale: st.scale, zoom: st.zm });
        });
      });
    }

    /*@3.NOPJ5.5*/
    function settle(go) {
      var tries = 0;
      var tick = function () {
        if (st.dead) return;
        if (room() > 200 || ++tries > 10) { go(); return; }
        st.settleT = setTimeout(tick, 40);
      };
      tick();
    }

    /*@3.NOPJ5.34*/
    function clamp(n, fit) {
      if (!(n > 0)) return 1;
      var lo = fit ? 0.1 : 0.25;
      return n < lo ? lo : (n > 4 ? 4 : n);
    }

    function room() {
      if (o.room) {
        var r = o.room();
        if (r > 40) return r;
      }
      var s = scroller();
      var w = (s && s.clientWidth) || 0;
      if (!w) return 0;
      var cs = getComputedStyle(s);
      return Math.max(0, w - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0));
    }

    function tell() {
      if (o.onPage) o.onPage(st.page, st.total);
    }

    function watch() {
      var s = scroller();
      st.onScroll = function () {
        if (st.posT) clearTimeout(st.posT);
        st.posT = setTimeout(save, 500);
      };
      (s === document.scrollingElement || s === document.body ? window : s)
        .addEventListener('scroll', st.onScroll, { passive: true });
      if (window.ResizeObserver) {
        st.ro = new ResizeObserver(function () {
          if (!st.view) return;
          /*@3.NOPJ5.32*/
          var t = tall(), w = room();
          if (t === st.lastTall && w === st.lastRoom) return;
          /*@3.NOPJ5.37*/
          if (w === st.lastRoom && o.holdFit && o.holdFit()) { st.lastTall = t; return; }
          st.lastTall = t; st.lastRoom = w;
          if (st.fitT) clearTimeout(st.fitT);
          st.fitT = setTimeout(st.zm ? refit : rescale, 180);
        });
        try { st.ro.observe(host); } catch (e) {}
        try { st.ro.observe(s); } catch (e2) {}
        var dk = o.dockEl && o.dockEl();
        if (dk) { try { st.ro.observe(dk); } catch (e3) {} }
      }
    }

    /*@3.NOPJ5.4*/
    function save() {
      if (st.dead || !st.view || !o.onPos) return;
      var w = st.view.where();
      o.onPos({ p: w.p, f: Math.round(w.f * 1000) / 1000,
                z: st.zm || st.scale, k: st.zm ? 0 : (st.uz > 0 ? Math.round(st.uz * 1000) / 1000 : 0),
                w: st.zm ? 0 : Math.round(st.uzRoom || room()),
                m: st.mode, r: st.order, fl: st.flow,
                sd: st.side || '' });
    }

    function destroy() {
      st.dead = true;
      unhook();
      if (window.GardenPdfCloud) { try { window.GardenPdfCloud.forget(); } catch (e8) {} }
      if (st.posT) { clearTimeout(st.posT); st.posT = 0; }
      if (st.fitT) { clearTimeout(st.fitT); st.fitT = 0; }
      if (st.settleT) { clearTimeout(st.settleT); st.settleT = 0; }
      if (st.onScroll) {
        var s = scroller();
        (s === document.scrollingElement || s === document.body ? window : s)
          .removeEventListener('scroll', st.onScroll);
        st.onScroll = null;
      }
      if (st.ro) { try { st.ro.disconnect(); } catch (e) {} st.ro = null; }
      if (st.ink) {
        try { st.ink.flushAll(); } catch (e6) {}
        try { st.ink.destroy(); } catch (e7) {}
        st.ink = null;
      }
      if (st.find) { try { st.find.destroy(); } catch (e0) {} st.find = null; }
      if (st.view) { try { st.view.destroy(); } catch (e2) {} st.view = null; }
      else if (st.h && st.h.doc) { try { st.h.doc.destroy(); } catch (e3) {} }
      st.h = null;
      if (st.url) { try { URL.revokeObjectURL(st.url); } catch (e4) {} st.url = null; }
      var d = document.querySelector('dialog.npo-warn');
      if (d) { try { d.close(); } catch (e5) {} if (d.parentNode) d.parentNode.removeChild(d); }
    }

    var US_WAIT = [4000, 8000, 15000, 30000];
    var usN = 0;
    function fromUs(quiet) {
      var C = window.GardenPdfCloud;
      if (!C || !(C.restoreX || C.restore)) { ask(); return; }
      if (st.usT) { clearTimeout(st.usT); st.usT = 0; }
      if (!quiet) busy(L('يُجلب من نسختك عندنا…', 'Fetching your copy kept with us…'));
      var got = C.restoreX ? C.restoreX(sp.h, sp.n, function (at, of) {
        var p = stage.querySelector('.npo-msg');
        if (p && of) {
          p.textContent = L('يُجلب من نسختك عندنا… ', 'Fetching your copy kept with us… ') +
                          Math.round(at * 100 / of) + '%';
        }
      }) : C.restore(sp.h, sp.n).then(function (f) { return { file: f, why: f ? '' : 'none' }; });
      got.then(function (r) {
        if (st.dead) return;
        if (r.file) { unhook(); show(r.file, null, sp.h); return; }
        if (!/^(pending|offline|fail|locked|rate_limited)$/.test(r.why)) { unhook(); ask(); return; }
        wait(r.why);
      });
    }

    function wait(why) {
      var pend = why === 'pending';
      var head = pend ? L('الملفُّ في طريقه إلى نسختك عندنا', 'The file is on its way to your copy with us')
        : (why === 'locked' ? L('مزامنتُك مقفلة', 'Your sync is locked')
                            : L('تعذّر جلبُ الملفِّ الآن', 'Could not fetch the file right now'));
      var body = pend
        ? L('إن كنتَ ترفعه من جهازٍ آخر فسيُفتح هنا وحدَه حين يكتمل رفعُه — ابقَ على هذه الصفحة.',
            'If you are uploading it from another device, it will open here by itself once the upload finishes — stay on this page.')
        : (why === 'locked'
          ? L('افتحها من إعدادات المزامنة، ثمّ عُد إلى هنا فيُجلب الملفّ.',
              'Unlock it in sync settings, then come back here and the file will be fetched.')
          : L('نعيد المحاولة وحدَنا حين يعود الاتّصال.', 'We will try again by ourselves when the connection is back.'));
      card(pend ? 'fa-cloud-arrow-down' : 'fa-triangle-exclamation', esc(sp.n || head),
        (sp.n ? '<b>' + esc(head) + '</b><br>' : '') + esc(body) +
        '<span class="npo-waitline" role="status"><span class="na-opening-spin" aria-hidden="true"></span>' +
        esc(L('ننتظر…', 'Waiting…')) + '</span>',
        '<div class="npo-acts"><button type="button" class="gsf-btn gsf-btn--go npo-again">' +
        '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> ' +
        esc(L('جرّب الآن', 'Try now')) + '</button>' +
        (sp.gd && o.drive ? '<button type="button" class="gsf-btn gsf-btn--gd npo-drive">' +
          '<i class="fa-brands fa-google-drive" aria-hidden="true"></i> ' +
          esc(L('افتحْ من درايف', 'Open from Drive')) + '</button>' : '') +
        '<button type="button" class="gsf-btn gsf-btn--ghost npo-pick">' +
        '<i class="fa-solid fa-file-import" aria-hidden="true"></i> ' +
        esc(L('اخترْه من جهازك', 'Pick it from your device')) + '</button></div>');
      var a = stage.querySelector('.npo-again');
      if (a) a.addEventListener('click', function () { usN = 0; fromUs(); });
      var b = stage.querySelector('.npo-pick');
      if (b) b.addEventListener('click', function () { unhook(); take(); });
      var gw = stage.querySelector('.npo-drive');
      if (gw) gw.addEventListener('click', function () { unhook(); if (st.usT) { clearTimeout(st.usT); st.usT = 0; } fromDrive(); });
      hook();
      var ms = US_WAIT[Math.min(usN, US_WAIT.length - 1)];
      usN++;
      if (usN > 40) return;
      st.usT = setTimeout(function () {
        st.usT = 0;
        if (st.dead) return;
        if (document.visibilityState === 'hidden') { st.usLate = 1; return; }
        fromUs(true);
      }, ms);
    }

    function kick(e) {
      if (st.dead) { unhook(); return; }
      if (document.visibilityState === 'hidden' || !stage.querySelector('.npo-again')) return;
      if (st.usLate || !st.usT || (e && e.type === 'online')) { st.usLate = 0; usN = 0; fromUs(true); }
    }
    function hook() {
      if (st.usHook) return;
      st.usHook = kick;
      window.addEventListener('online', kick);
      document.addEventListener('visibilitychange', kick);
    }
    function unhook() {
      if (st.usT) { clearTimeout(st.usT); st.usT = 0; }
      if (!st.usHook) return;
      window.removeEventListener('online', st.usHook);
      document.removeEventListener('visibilitychange', st.usHook);
      st.usHook = null;
    }

    if (o.pre) show(null, o.pre, sp.h || '');
    else if (!sp.h || !window.GardenPdfDoc) ask();
    else {
      busy(L('يُفتح الملفّ…', 'Opening the file…'));
      window.GardenPdfDoc.get(sp.h).then(function (f) {
        if (st.dead) return;
        if (f) show(f, null, sp.h);
        else missing();
      }, function () { if (!st.dead) missing(); });
    }

    function missing() {
      if (!(sp.gd && o.drive && o.driveAuto && o.driveAuto())) { fromUs(); return; }
      busy(L('يُجلب من درايف…', 'Fetching from Drive…'));
      o.drive(sp, function (pct) {
        var p = stage.querySelector('.npo-msg');
        if (p) p.textContent = L('يُجلب من درايف… ', 'Fetching from Drive… ') + pct + '%';
      }).then(function (file) {
        if (st.dead) return;
        if (file) useFile(file, sp.gd); else fromUs();
      }, function () { if (!st.dead) fromUs(); });
    }

    /*@3.NOPJ5.6*/
    function apply(n, at) {
      if (st.dead || !st.view || !(n > 0)) return st.scale;
      st.scale = clamp(n, at && at.fit);
      st.view.setScale(st.scale, at || null);
      save();
      if (!st.zm && !(at && at.uz)) noteUz(st.scale, false);
      if (o.onZoom) o.onZoom(st.scale, st.zm);
      return st.scale;
    }

    /*@3.NOPJ5.31*/
    function fitW() {
      if (st.dead || !st.h) return Promise.resolve(0);
      return window.GardenPdfView
        .fitScale(st.h, room(), st.mode, tall(), false, st.view ? st.view.grid() : null);
    }

    function noteUz(n, snap) {
      var gen = (st.uzGen = (st.uzGen || 0) + 1);
      st.uzRoom = room();
      return fitW().then(function (fw) {
        if (st.dead || gen !== st.uzGen || !(fw > 0) || st.zm) return;
        st.uz = n / fw;
        if (snap && Math.abs(st.uz - 1) < 0.06) {
          st.zm = 'fit'; st.uz = 1;
          apply(fw, { keep: 1 });
          return;
        }
        save();
      });
    }

    function rescale() {
      if (st.dead || !st.view || st.zm || !(st.uz > 0)) return;
      var w = room();
      if (!(w > 0) || w === st.uzRoom) return;
      var was = st.uzRoom;
      st.uzRoom = w;
      if (was > 0 && Math.abs(w - was) / was > 0.15) {
        st.zm = st.uz > 1 ? 'fit' : 'page';
        refit();
        return;
      }
      var uz = st.uz;
      fitW().then(function (fw) {
        if (st.dead || st.zm || !(fw > 0) || uz !== st.uz) return;
        apply(fw * uz, { fit: 1, uz: 1 });
      });
    }

    /*@3.NOPJ5.11*/
    function refit(mode, snap) {
      if (st.dead || !st.view) return Promise.resolve(st.scale);
      if (mode === 'page' || mode === 'fit') st.zm = mode;
      else if (!st.zm) st.zm = 'page';
      /*@3.NOPJ5.28*/
      return window.GardenPdfView
        .fitScale(st.h, room(), st.mode, tall(), st.zm === 'page', st.view.grid())
        .then(function (n) { return apply(n, { fit: 1, snap: snap ? 1 : 0 }); });
    }

    /*@3.NOPJ5.22*/
    function tall() {
      var s = scroller();
      var h = (s && s.clientHeight) || 0;
      if (!h) return 0;
      var vv = window.visualViewport;
      if (vv && s.getBoundingClientRect) {
        var top = s.getBoundingClientRect().top;
        var seen = vv.height - Math.max(0, top - (vv.offsetTop || 0));
        if (seen > 80 && seen < h) h = seen;
      }
      var cs = getComputedStyle(s);
      /*@3.NOPJ5.30*/
      return Math.max(0, h - (parseFloat(cs.paddingTop) || 0) -
        (parseFloat(cs.paddingBottom) || 0) - 14);
    }

    /*@3.NOPJ5.12*/
    function guessSide() {
      if (st.side) return st.side;
      try {
        return (localStorage.getItem('garden_lang') || 'ar') === 'ar' ? 'rtl' : 'ltr';
      } catch (e) { return 'rtl'; }
    }

    function setSide(v) {
      st.side = v === 'rtl' ? 'rtl' : 'ltr';
      if (st.view) st.view.setSide(st.side);
      save();
      if (o.onView) o.onView(st.mode, st.order, st.flow, st.side);
      return st.side;
    }

    /*@3.NOPJ5.21*/
    function makeInk() {
      var K = window.GardenPdfInk;
      if (!K || st.ink) return null;
      st.ink = K.create({
        id: sp.h || '',
        ns: o.noteId || '',
        solo: o.soloInk || null,
        view: st.view,
        seed: o.marks || null,
        t0: Date.now(),
        onState: function (s2) { if (o.onInk) o.onInk(s2); },
        onZoom: function (z) { setScale(z); },
        onFit: function () { refit('page'); },
        onExpand: function (on) { if (o.onExpand) o.onExpand(on); },
        onDirty: function (n, why) { if (o.onInkDirty) o.onInkDirty(n, why); },
        onField: function (on, bar) { return o.onInkField ? o.onInkField(on, bar) : false; },
        onClosePen: function () { if (o.onInkClose) o.onInkClose(); },
        onShapeBox: function (n, x, y, w, h, W, stage) { return o.onShapeBox ? o.onShapeBox(n, x, y, w, h, W, stage) : false; },
        onFileMenu: function (x, y) { if (o.onFileMenu) o.onFileMenu(x, y); },
        hearAt: function (x, y) { return o.hearAt ? o.hearAt(x, y) : null; },
        /*@3.NOPJ5.23*/
        onGesture: function (phase, g) { if (o.onInkGesture) o.onInkGesture(phase, g); }
      });
      return st.ink;
    }

    /*@3.NOPJ5.13*/
    function makeFind() {
      var F = window.GardenPdfFind;
      if (!F || !st.h || st.find) return;
      st.find = F.create({
        handle: st.h,
        view: st.view,
        onState: function (s2) { if (o.onFind) o.onFind(s2); }
      });
      st.find.scan(st.page);
    }

    /*@3.NOPJ5.8*/
    function setView(mode, order) {
      var was = st.mode + st.order;
      var wasMode = st.mode;
      st.mode = (mode === 2 || mode === 4) ? mode : 1;
      st.order = order === 'col' ? 'col' : 'row';
      if (!st.view) return st.mode;
      /*@3.NOPJ5.36*/
      if (wasMode === 1 || !(st.anchorP > 0)) st.anchorP = st.page || 1;
      var anchorP = st.anchorP;
      st.view.setView(st.mode, st.order);
      /*@3.NOPJ5.19*/
      if (was !== st.mode + st.order) {
        /*@3.NOPJ5.38*/
        var seqV = (st.navSeq = (st.navSeq || 0) + 1);
        if (anchorP > 0) st.view.goTo(anchorP, 0);
        if (st.mode === 1) st.anchorP = 0;
        refit('page', 0).then(function () {
          if (st.dead || !st.view || st.navSeq !== seqV || !(anchorP > 0)) return;
          st.view.goTo(anchorP, 0);
        });
      }
      else if (st.zm) refit(); else save();
      if (o.onView) o.onView(st.mode, st.order, st.flow, st.side);
      return st.mode;
    }

    /*@3.NOPJ5.16*/
    function setFlow(f) {
      var was = st.flow;
      st.flow = f === 'page' ? 'page' : 'cont';
      if (st.view) st.view.setFlow(st.flow);
      if (st.flow === 'page' && was !== 'page') refit('page');
      save();
      if (o.onView) o.onView(st.mode, st.order, st.flow, st.side);
      return st.flow;
    }

    function step(dir) {
      if (!st.view) return st.page;
      st.navSeq = (st.navSeq || 0) + 1;
      return st.view.step(dir > 0 ? 1 : -1);
    }

    function setScale(n, at) {
      st.zm = '';
      st.tapBack = null;
      return apply(n, at || null);
    }

    /*@3.NOPJ5.24*/
    /*@3.NOPJ5.33*/
    function tapZoom(cx, cy) {
      if (st.dead || !st.view) return st.scale;
      st.navSeq = (st.navSeq || 0) + 1;
      var back = st.tapBack;
      var cur = st.scale || 1;
      var here = st.view.where();
      if (back && Math.abs(cur - back.to) < 0.02) {
        st.tapBack = null;
        /*@3.NOPJ5.35*/
        var g0 = (cx != null && st.view.grip) ? st.view.grip(cx, cy) : null;
        return refit('page', 1).then(function (n) {
          if (st.dead || !st.view) return n;
          if (g0 && st.view.regrip) { st.view.regrip(g0); st.view.sync(); }
          else st.view.goTo(here.p, here.f);
          return n;
        });
      }
      var want = Math.min(4, Math.max(cur * 2, 1.15));
      st.tapBack = { to: want };
      st.zm = '';
      return apply(want, { cx: cx, cy: cy });
    }

    return {
      destroy: destroy,
      view: function () { return st.view; },
      ready: function () { return !!st.view; },
      page: function () { return st.page; },
      pages: function () { return st.total; },
      scale: function () { return st.scale; },
      zoomMode: function () { return st.zm; },
      isFit: function () { return !!st.zm; },
      side: function () { return st.side || guessSide(); },
      selectPage: function (n) { return st.view ? st.view.selectPage(n) : false; },
      setSide: setSide,
      find: function () { return st.find; },
      ink: function () { return st.ink; },
      draw: function (on) {
        if (!st.ink) return false;
        return st.ink.arm(on === undefined ? !st.ink.armed : !!on);
      },
      drawing: function () { return !!(st.ink && st.ink.armed); },
      goTo: function (n, f) { st.navSeq = (st.navSeq || 0) + 1; if (st.view) st.view.goTo(n, f || 0); return st.page; },
      step: step,
      mode: function () { return st.mode; },
      order: function () { return st.order; },
      flow: function () { return st.flow; },
      setView: setView,
      setFlow: setFlow,
      refit: function (m) { return refit(m, 1); },
      setScale: setScale,
      spec: function () { return sp; },
      pick: take
    };
  }

  window.GardenPdfOpen = {
    unlock: unlock,
    MAX_PAGES: MAX_PAGES,
    SOFT_BYTES: SOFT_BYTES,
    HARD_BYTES: HARD_BYTES,
    size: size,
    weigh: weigh,
    pickFile: pickFile,
    adopt: adopt,
    parse: parse,
    drop: drop,
    open: open
  };
})();
