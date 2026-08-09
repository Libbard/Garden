/*@3.FAPJ.1*/
(function () {
  'use strict';

  var API = (window.GardenEndpoints && window.GardenEndpoints.publicData) || '';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function isAr() { return document.documentElement.getAttribute('lang') !== 'en'; }
  function t(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  var AR_RE = /[؀-ۿݐ-ݿ]/;
  function hasAr(s) { return AR_RE.test(String(s || '')); }
  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/[ً-ْٰـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /*@3.FAPJ.2*/
  var DATA = null, LOADING = null, WAIT = [];

  function load(cb) {
    if (DATA) { cb && cb(DATA); return; }
    if (cb) WAIT.push(cb);
    if (LOADING) return;
    LOADING = true;
    fetch(API + '/v1/faculty.json', { cache: 'default' })
      .then(function (r) { if (!r.ok) throw new Error('http_' + r.status); return r.json(); })
      .then(function (d) {
        DATA = d; LOADING = false;
        (d.faculty || []).forEach(function (f) {
          f._k = norm(f.name);
          f._e = f.link && f.link.e ? String(f.link.e).toLowerCase() : null;
        });
        WAIT.splice(0).forEach(function (fn) { fn(d); });
      })
      .catch(function () { LOADING = false; WAIT.splice(0).forEach(function (fn) { fn(null); }); });
  }

  function byEmail(email) {
    if (!DATA || !email) return null;
    var e = String(email).toLowerCase();
    return DATA.faculty.filter(function (f) { return f._e === e; })[0] || null;
  }
  function byId(id) {
    if (!DATA || !id) return null;
    return DATA.faculty.filter(function (f) { return f.id === id; })[0] ||
           DATA.faculty.filter(function (f) { return (f.alias || []).indexOf(id) >= 0; })[0] || null;
  }
  /*@3.FAPJ.3*/
  function byBannerName(name) {
    if (!DATA || !name) return null;
    var k = String(name).toLowerCase().replace(/[^a-z]/g, '');
    if (!k) return null;
    return DATA.faculty.filter(function (f) {
      return f.link && f.link.n &&
        String(f.link.n).toLowerCase().replace(/[^a-z]/g, '') === k;
    })[0] || null;
  }

  function tone(v) {
    if (v == null) return 'var(--text-muted)';
    if (v >= 80) return '#10b981';
    if (v >= 60) return '#f59e0b';
    if (v >= 40) return '#f97316';
    return '#ef4444';
  }

  function ring(v, size) {
    var s = size || 54, r = (s / 2) - 5, c = 2 * Math.PI * r;
    var p = v == null ? 0 : Math.max(0, Math.min(100, v));
    var col = tone(v);
    return '<svg class="fc-ring" viewBox="0 0 ' + s + ' ' + s + '" width="' + s + '" height="' + s + '" aria-hidden="true">' +
      '<circle cx="' + (s / 2) + '" cy="' + (s / 2) + '" r="' + r + '" fill="none" stroke="var(--border-color)" stroke-width="4"/>' +
      '<circle cx="' + (s / 2) + '" cy="' + (s / 2) + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="4"' +
        ' stroke-linecap="round" stroke-dasharray="' + (c * p / 100).toFixed(1) + ' ' + c.toFixed(1) + '"' +
        ' transform="rotate(-90 ' + (s / 2) + ' ' + (s / 2) + ')"/>' +
      '<text x="' + (s / 2) + '" y="' + (s / 2) + '" text-anchor="middle" dominant-baseline="central"' +
        ' fill="' + col + '" font-size="' + (s * 0.32).toFixed(0) + '" font-weight="800"' +
        ' font-family="JetBrains Mono, monospace">' + (v == null ? '—' : v) + '</text>' +
    '</svg>';
  }

  function axisBar(w, label, pair) {
    var v = pair ? Math.round(pair[0] * 100) : null;
    var n = pair ? pair[1] : 0;
    return '<div class="fc-ax">' +
      '<div class="fc-ax-h"><span class="fc-ax-l">' + esc(label) + '</span>' +
        '<span class="fc-ax-w">' + Math.round(w * 100) + '٪</span>' +
        '<span class="fc-ax-v" style="color:' + tone(v) + '">' +
          (v == null ? t('لا بيانات', 'no data') : v + '٪') + '</span>' +
        '<span class="fc-ax-n">' + (n ? t('من ' + n, 'of ' + n) : '') + '</span></div>' +
      '<div class="fc-ax-bar"><i style="width:' + (v == null ? 0 : v) + '%;background:' + tone(v) + '"></i></div>' +
    '</div>';
  }

  function nameOf(f) { return (!isAr() && f.en) ? f.en : f.name; }

  /*@3.FAPJ.4*/
  function detailHtml(f, o) {
    o = o || {};
    var W = (DATA && DATA.weights) || [];
    var axes = W.map(function (w) { return axisBar(w.w, t(w.ar, w.en), f.ax && f.ax[w.k]); }).join('');
    var codes = Object.keys(f.courses || {})
      .sort(function (a, b) { return f.courses[b] - f.courses[a]; });
    var ambSet = {};
    (f.amb || []).forEach(function (c) { ambSet[c] = 1; });

    var peers = (DATA.faculty || []).filter(function (x) { return x.n >= 3 && x.rk != null; });
    var below = peers.filter(function (x) { return (x.rk || 0) < (f.rk || 0); }).length;
    var pct = (peers.length > 1 && f.rk != null && f.n >= 3)
      ? Math.round(below * 100 / (peers.length - 1)) : null;

    var head = '<div class="fc-d-head">' + ring(f.idx, 76) +
      '<div class="fc-d-h-t">' +
        '<div class="fc-d-idx" style="color:' + tone(f.idx) + '">' + (f.idx == null ? '—' : f.idx + '٪') + '</div>' +
        '<div class="fc-d-sub">' + t('المؤشّر المركّب · ', 'Composite score · ') +
          t(f.n + ' تقييماً', f.n + ' ratings') + '</div>' +
        (pct != null ? '<div class="fc-d-pct">' +
          t('أعلى من ' + pct + '٪ من الأساتذة المقيَّمين (' + peers.length + ')',
            'Above ' + pct + '% of rated instructors (' + peers.length + ')') + '</div>' : '') +
        (f.n < 3 ? '<div class="fc-warn fc-warn--big">' +
          t('عيّنةٌ صغيرة — اقرأه على أنه انطباعٌ لا حكم.',
            'Small sample — read it as an impression, not a verdict.') + '</div>' : '') +
      '</div></div>';

    /*@3.FAPJ.5*/
    var mail = (f.link && f.link.e)
      ? '<div class="fc-d-mail">' +
          '<button class="fc-go fc-mail-copy" data-copy="' + esc(f.link.e) + '">' +
            '<i class="fa-regular fa-copy"></i>' + t('انسخ البريد', 'Copy email') +
            '<span class="fc-go-n ltr">' + esc(f.link.e) + '</span></button>' +
          '<a class="fc-go" href="mailto:' + esc(f.link.e) + '">' +
            '<i class="fa-regular fa-envelope"></i>' + t('راسله', 'Email') + '</a>' +
        '</div>'
      : '';

    var taught = codes.length
      ? '<div class="fc-d-sec"><h4>' + t('المواد التي قُيِّم فيها', 'Courses rated in') + '</h4>' +
        '<div class="fc-chips">' + codes.map(function (c) {
          return '<a class="fc-chip mono fc-chip--go' + (ambSet[c] ? ' fc-chip--amb' : '') +
            '" href="' + (o.base || '') + 'sections.html?q=' + encodeURIComponent(c) + '">' +
            esc(c) + '<span class="fc-chip-n">' + f.courses[c] + '</span></a>';
        }).join('') + '</div></div>'
      : '';

    var banner = f.link
      ? '<div class="fc-d-sec"><h4>' + t('في كتالوج الشعب', 'In the sections catalog') + '</h4>' +
        '<a class="fc-go" href="' + (o.base || '') + 'sections.html?q=' +
          encodeURIComponent(f.link.n || f.name) + '">' +
          '<i class="fa-solid fa-layer-group"></i>' + t('اعرض شُعبه', 'Show their sections') +
          (f.link.n ? '<span class="fc-go-n ltr">' + esc(f.link.n) + '</span>' : '') + '</a></div>'
      : '<div class="fc-d-sec"><div class="fc-note"><i class="fa-solid fa-circle-info"></i>' +
        t('لم نتمكّن من ربطه بسجلّ بانر بثقةٍ كافية، فلا تُعرض شُعبه هنا.',
          'We could not link them to a Banner record confidently, so their sections are not shown.') +
        '</div></div>';

    var cm = (f.cm || []);
    var comments = cm.length
      ? '<div class="fc-d-sec"><h4>' + t('ما كتبه الطلاب', 'What students wrote') +
        '<span class="fc-d-n">' + cm.length + '</span></h4>' +
        '<div class="fc-cms">' + cm.map(function (c) {
          var tag = c.cs ? c.cs.map(function (x) {
                      return '<span class="fc-cm-tag mono">' + esc(x) + '</span>'; }).join('')
                  : c.c ? '<span class="fc-cm-tag mono">' + esc(c.c) + '</span>'
                  : c.r ? '<span class="fc-cm-tag fc-cm-tag--raw">' + esc(c.r) + '</span>' : '';
          return '<div class="fc-cm">' + tag +
            '<p class="' + (hasAr(c.t) ? '' : 'ltr') + '">' + esc(c.t) + '</p></div>';
        }).join('') + '</div></div>'
      : '<div class="fc-d-sec"><div class="fc-note"><i class="fa-solid fa-comment-slash"></i>' +
        t('لا تعليقاتٍ مكتوبة — الأرقامُ وحدها.', 'No written comments — numbers only.') + '</div></div>';

    /*@3.FAPJ.6*/
    var canRate = !window.GardenFlags || window.GardenFlags.get('ratings.faculty.enabled');

    var acts = '<div class="fc-d-acts">' +
      (canRate ? '<button class="sx-primary fc-rate" data-rate="' + esc(f.id) + '">' +
        '<i class="fa-solid fa-pen-to-square"></i>' + t('قيّم هذا الأستاذ', 'Rate this instructor') +
      '</button>' : '') +
      (o.full ? '<a class="fc-go" href="' + (o.base || '') + 'faculty.html#' +
        encodeURIComponent(f.id) + '"><i class="fa-solid fa-arrow-up-right-from-square"></i>' +
        t('صفحة التقييمات', 'Ratings page') + '</a>' : '') +
    '</div>';

    return head + mail +
      '<div class="fc-d-sec"><h4>' + t('المحاور', 'Axes') + '</h4>' + axes + '</div>' +
      taught + banner + comments + acts;
  }

  /*@3.FAPJ.7*/
  var RATE_Q = [
    { k: 'ov', ar: 'كيف كانت تجربتك عموماً؟', en: 'Overall experience?',
      opts: [['ايجابية', 'Positive', 'ok'], ['سلبية', 'Negative', 'bad']] },
    { k: 'cl', ar: 'كانت طريقة الشرح واضحة', en: 'The explanation was clear',
      opts: [['اتفق', 'Agree', 'ok'], ['لا اتفق', 'Disagree', 'bad']] },
    { k: 'fg', ar: 'تصحيح الدرجات كان عادلاً', en: 'Grading was fair',
      opts: [['اتفق', 'Agree', 'ok'], ['لا اتفق', 'Disagree', 'bad']] },
    { k: 'em', ar: 'سرعة الرد والتجاوب', en: 'Response speed',
      opts: [['دائمًا', 'Always', 'ok'], ['احيانًا', 'Sometimes', 'mid'], ['لم يتم الرد أبدًا', 'Never', 'bad']] },
    { k: 'gt', ar: 'رصد الدرجات في وقته', en: 'Grades posted on time',
      opts: [['نعم', 'Yes', 'ok'], ['احيانًا', 'Sometimes', 'mid'], ['كان متأخر جدًا', 'Very late', 'bad']] }
  ];

  function rateHtml(f, o) {
    o = o || {};
    /*@3.FAPJ.8*/
    var codes = f ? Object.keys(f.courses || {})
      .sort(function (a, b) { return f.courses[b] - f.courses[a]; }) : [];
    var pre = o.course && codes.indexOf(o.course) < 0 ? [o.course] : [];

    var who = f
      ? '<div class="fc-r-who"><i class="fa-solid fa-chalkboard-user"></i>' +
        '<b>' + esc(nameOf(f)) + '</b>' +
        (f.link && f.link.e ? '<span class="fc-go-n ltr">' + esc(f.link.e) + '</span>' : '') +
        '<input type="hidden" id="fc-r-name" value="' + esc(f.name) + '">' +
        '<input type="hidden" id="fc-r-mail" value="' + esc((f.link && f.link.e) || '') + '"></div>'
      : '<div class="fc-f"><label>' + t('اسم الأستاذ', 'Instructor name') + '</label>' +
        '<input class="sx-search fc-in" id="fc-r-who" autocomplete="off" placeholder="' +
        esc(t('اكتب اسمه كما تعرفه', 'Type their name')) + '">' +
        '<div class="fc-sug" id="fc-r-sug" hidden></div></div>';

    var chips = pre.concat(codes).map(function (c) {
      return '<button type="button" class="fc-crs' + (o.course === c ? ' on' : '') +
        '" data-crs="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');

    return '<div class="fc-form">' + who +
      '<div class="fc-f"><label>' + t('المواد (يمكن اختيار أكثر من واحدة)',
        'Courses (you may pick more than one)') + '</label>' +
      (chips ? '<div class="fc-crs-row" id="fc-r-crs">' + chips + '</div>' : '') +
      '<input class="sx-search fc-in" id="fc-r-more" autocomplete="off" placeholder="' +
        esc(t('أو اكتب رمزاً آخر ثم اضغط Enter — CS241', 'or type another code then Enter — CS241')) +
      '"></div>' +
      RATE_Q.map(function (q) {
        return '<div class="fc-q"><div class="fc-q-t">' + esc(t(q.ar, q.en)) + '</div>' +
          '<div class="fc-q-o">' + q.opts.map(function (op) {
            return '<button type="button" class="fc-opt is-' + op[2] + '" data-k="' + q.k +
              '" data-v="' + esc(op[0]) + '">' + esc(t(op[0], op[1])) + '</button>';
          }).join('') + '</div></div>';
      }).join('') +
      '<div class="fc-f"><label>' + t('تعليقك (اختياريّ)', 'Your comment (optional)') + '</label>' +
        '<textarea class="fc-in fc-ta" id="fc-r-cm" rows="3" maxlength="1200" placeholder="' +
        esc(t('ما الذي يجب أن يعرفه زميلُك قبل أن يسجّل معه؟',
              'What should a classmate know before registering?')) + '"></textarea></div>' +
      '<div class="fc-note"><i class="fa-solid fa-shield-halved"></i>' +
        t('لا نحفظ اسمك ولا بريدك — رأيُك وحدَه، ويظهر فوراً.',
          'We store no name or email — only your answer, and it appears immediately.') + '</div>' +
      '<div class="fc-r-foot">' +
        '<button class="sx-primary" id="fc-r-send"><i class="fa-solid fa-paper-plane"></i>' +
          t('أرسل التقييم', 'Send rating') + '</button>' +
        '<span class="fc-r-msg" id="fc-r-msg"></span>' +
      '</div></div>';
  }

  /*@3.FAPJ.9*/
  var vals = {};
  function wire(root, o) {
    o = o || {};
    if (root.__gfWired) return;
    root.__gfWired = true;
    root.addEventListener('click', function (e) {
      var cp = e.target.closest('[data-copy]');
      if (cp) { copyText(cp.getAttribute('data-copy'), cp); return; }
      var crs = e.target.closest('[data-crs]');
      if (crs) { crs.classList.toggle('on'); return; }
      var op = e.target.closest('.fc-opt');
      if (op) {
        var k = op.getAttribute('data-k'), on = op.classList.contains('on');
        $$('.fc-opt[data-k="' + k + '"]', root).forEach(function (x) { x.classList.remove('on'); });
        if (on) delete vals[k];
        else { op.classList.add('on'); vals[k] = op.getAttribute('data-v'); }
        return;
      }
      var sg = e.target.closest('.fc-sug-i');
      if (sg) {
        $('#fc-r-who', root).value = sg.getAttribute('data-nm');
        $('#fc-r-sug', root).hidden = true;
        return;
      }
      if (e.target.closest('#fc-r-send')) send(root, o);
    });
    root.addEventListener('input', function (e) {
      if (e.target.id === 'fc-r-who') suggest(root);
    });
    root.addEventListener('keydown', function (e) {
      /*@3.FAPJ.10*/
      if (e.target.id === 'fc-r-more' && e.key === 'Enter') {
        e.preventDefault();
        var v = e.target.value.trim().toUpperCase().replace(/\s+/g, '');
        if (!v) return;
        var row = $('#fc-r-crs', root);
        if (!row) {
          row = document.createElement('div');
          row.className = 'fc-crs-row'; row.id = 'fc-r-crs';
          e.target.parentNode.insertBefore(row, e.target);
        }
        if (!$('[data-crs="' + v + '"]', row)) {
          row.insertAdjacentHTML('beforeend',
            '<button type="button" class="fc-crs on" data-crs="' + esc(v) + '">' + esc(v) + '</button>');
        }
        e.target.value = '';
      }
    });
  }
  /*@3.FAPJ.11*/
  function copyText(v, btn) {
    function ok() { flash(btn, t('نُسخ ✓', 'Copied ✓')); }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = v;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        var done = document.execCommand('copy');
        document.body.removeChild(ta);
        if (done) ok(); else flash(btn, t('انسخه يدوياً', 'Copy manually'));
      } catch (_) { flash(btn, t('انسخه يدوياً', 'Copy manually')); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).then(ok, fallback);
    } else fallback();
  }

  function flash(el, msg) {
    var old = el.innerHTML;
    el.innerHTML = '<i class="fa-solid fa-check"></i>' + esc(msg);
    setTimeout(function () { el.innerHTML = old; }, 1400);
  }
  function resetVals() { vals = {}; }

  function suggest(root) {
    var box = $('#fc-r-sug', root), inp = $('#fc-r-who', root);
    if (!box || !inp || !DATA) return;
    var q = norm(inp.value);
    if (q.length < 2) { box.hidden = true; return; }
    var hit = DATA.faculty.filter(function (f) {
      return f._k.indexOf(q) >= 0 || String(f.en || '').toLowerCase().indexOf(q) >= 0;
    }).slice(0, 8);
    if (!hit.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = hit.map(function (f) {
      return '<button type="button" class="fc-sug-i" data-nm="' + esc(f.name) + '">' +
        esc(f.name) + (f.en ? '<span class="fc-sug-en ltr">' + esc(f.en) + '</span>' : '') +
        '<span class="fc-sug-n">' + f.n + '</span></button>';
    }).join('');
  }

  function send(root, o) {
    var msg = $('#fc-r-msg', root), btn = $('#fc-r-send', root);
    var nameEl = $('#fc-r-name', root), whoEl = $('#fc-r-who', root);
    var name = nameEl ? nameEl.value : (whoEl ? whoEl.value.trim() : '');
    var mailEl = $('#fc-r-mail', root);
    var email = mailEl ? mailEl.value : '';
    if (!name && !email) {
      msg.className = 'fc-r-msg is-err';
      msg.textContent = t('اكتب اسم الأستاذ أوّلاً', 'Enter the instructor name first');
      return;
    }
    if (!Object.keys(vals).length) {
      msg.className = 'fc-r-msg is-err';
      msg.textContent = t('أجب عن سؤالٍ واحدٍ على الأقلّ', 'Answer at least one question');
      return;
    }
    var courses = $$('.fc-crs.on', root).map(function (x) { return x.getAttribute('data-crs'); });
    var body = { name: name, email: email, courses: courses, comment: $('#fc-r-cm', root).value.trim() };

    /*@3.FAPJ.12*/
    try {
      var vk = window.GardenSync && GardenSync.getKey && GardenSync.getKey();
      if (vk && /^v[0-9a-f]{32}$/.test(vk)) body.vault_id = vk;
    } catch (e) { }
    Object.keys(vals).forEach(function (k) { body[k] = vals[k]; });

    btn.disabled = true;
    msg.className = 'fc-r-msg';
    msg.textContent = t('يُرسَل…', 'Sending…');
    fetch(API + '/v1/faculty/rate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        btn.disabled = false;
        if (!x.ok) {
          msg.className = 'fc-r-msg is-err';
          msg.textContent = x.j && x.j.error === 'rate_limited'
            ? t('أرسلتَ تقييماتٍ كثيرةً اليوم — جرّب لاحقاً.', 'Too many ratings today — try later.')
            : t('تعذّر الإرسال، حاول مرّةً أخرى.', 'Could not send, try again.');
          return;
        }
        msg.className = 'fc-r-msg is-ok';
        msg.textContent = x.j.duplicate
          ? t('هذا التقييم مُسجَّلٌ سلفاً.', 'This rating was already recorded.')
          : t('شكراً — سُجِّل رأيُك.', 'Thanks — your rating is in.');
        DATA = null;                       /*@3.FAPJ.13*/
        resetVals();
        setTimeout(function () { o.onSent && o.onSent(); }, 1100);
      })
      .catch(function () {
        btn.disabled = false;
        msg.className = 'fc-r-msg is-err';
        msg.textContent = t('لا اتصال بالخدمة.', 'Service unreachable.');
      });
  }

  window.GardenFaculty = {
    load: load, byEmail: byEmail, byId: byId, byBannerName: byBannerName,
    detailHtml: detailHtml, rateHtml: rateHtml, wire: wire,
    resetVals: resetVals, nameOf: nameOf, tone: tone, ring: ring,
    data: function () { return DATA; }
  };
})();
