/*@3.ICPJ.1*/
;(function () {
  'use strict';

  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  var host = null;
  var busy = false;

  function termUrl() {
    return String(location.pathname).replace(/[^/]*$/, 'gpa.html') + '#setup';
  }

  /*@3.ICPJ.21*/
  var picks = {};

  /*@3.ICPJ.2*/
  var BB_CAL = 'https://lms.seu.edu.sa/ultra/calendar';
  var STEPS = [
    { i: 'fa-right-to-bracket', ar: 'افتح <a href="' + BB_CAL + '" target="_blank" rel="noopener">تقويمَ البلاك بورد</a> وسجّل دخولك إن طُلب منك.', en: 'Open your <a href="' + BB_CAL + '" target="_blank" rel="noopener">Blackboard calendar</a> and sign in if asked.' },
    { i: 'fa-gear',             ar: 'اضغط أيقونةَ <b>الترس</b> أعلى الصفحة.', en: 'Tap the <b>gear</b> icon at the top of the page.' },
    { i: 'fa-ellipsis',         ar: 'اضغط النقاطَ الثلاث <b>…</b> ثمّ اختر <span class="ltr">Share Calendar</span>.', en: 'Tap the three dots <b>…</b> and choose <span class="ltr">Share Calendar</span>.' },
    { i: 'fa-copy',             ar: 'اضغط <span class="ltr">Copy</span> لنسخ الرابط، ثمّ ارجع إلى هنا والصقه.', en: 'Tap <span class="ltr">Copy</span>, then come back here and paste it.' }
  ];

  function pl(n, one, two, few, many) {
    if (!isAr()) return n === 1 ? one : many;
    if (n === 1) return one;
    if (n === 2) return two;
    return n + ' ' + (n <= 10 ? few : many);
  }
  function nDeadlines(n) {
    return isAr() ? pl(n, 'موعدٌ واحد', 'موعدان', 'مواعيد', 'موعداً') : (n === 1 ? '1 deadline' : n + ' deadlines');
  }

  var KIND_AR = {
    quiz: 'كويز', exam: 'اختبار', midterm: 'نصفي', final: 'نهائي',
    assignment: 'واجب', project: 'مشروع', discussion: 'مناقشة', other: 'عنصر'
  };
  var KIND_EN = {
    quiz: 'Quiz', exam: 'Exam', midterm: 'Midterm', final: 'Final',
    assignment: 'Assignment', project: 'Project', discussion: 'Discussion', other: 'Item'
  };
  function kindName(k) { return isAr() ? (KIND_AR[k] || KIND_AR.other) : (KIND_EN[k] || KIND_EN.other); }

  function ago(ms) {
    if (!ms) return L('لم يتمّ بعد', 'not yet');
    var d = Date.now() - ms;
    if (d < 60000) return L('الآن', 'just now');
    var m = Math.round(d / 60000), h = Math.round(d / 3600e3), dd = Math.round(d / 86400e3);
    if (d < 3600e3) return L('قبل ' + pl(m, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة'), m + ' min ago');
    if (d < 86400e3) return L('قبل ' + pl(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة'), h + ' h ago');
    return L('قبل ' + pl(dd, 'يوم', 'يومين', 'أيّام', 'يوماً'), dd + (dd === 1 ? ' day ago' : ' days ago'));
  }

  /*@3.ICPJ.3*/
  function why(code) {
    var m = {
      bad_url:       L('هذا ليس رابطَ تقويمٍ من البلاك بورد؛ الرابطُ الصحيح ينتهي بـ learn.ics.', 'This is not a Blackboard calendar link — the right one ends in learn.ics.'),
      not_calendar:  L('لم يعد هذا الرابطُ يعمل. انسخ رابطاً جديداً من البلاك بورد، فهو يتغيّر إن ضغطتَ Regenerate Link.', 'This link no longer works. Copy a fresh one from Blackboard — it changes if you press Regenerate Link.'),
      too_large:     L('تقويمُك أكبرُ من أن نقرأه دفعةً واحدة.', 'Your calendar is too large to read in one go.'),
      no_endpoint:   L('التحديثُ غيرُ متاحٍ الآن، وسنعيد المحاولة لاحقاً.', 'Updating is not available right now — we will try again later.'),
      rate_limited:  L('محاولاتٌ كثيرةٌ في وقتٍ قصير؛ انتظر دقيقةً ثمّ أعِد.', 'Too many tries in a short time — wait a minute, then try again.'),
      no_url:        L('لم تربط تقويمك بعد.', 'Your calendar is not connected yet.')
    };
    if (m[code]) return m[code];
    if (/^http_/.test(code || '')) return L('لم يستجب البلاك بورد (' + code.slice(5) + ')، وسنعيد المحاولة.', 'Blackboard did not respond (' + code.slice(5) + ') — we will try again.');
    return L('تعذّر التحديث؛ أعِد المحاولة بعد قليل.', 'Could not update — try again shortly.');
  }

  /*@3.ICPJ.4*/

  function render() {
    if (!host) return;
    var ICS = window.GardenICS;
    if (!ICS) { host.innerHTML = ''; return; }
    var s = ICS.state();
    /*@3.ICPJ.22*/
    var live = {};
    (s.inbox || []).forEach(function (it) { live[it.uid] = 1; });
    Object.keys(picks).forEach(function (k) { if (!live[k]) delete picks[k]; });
    host.innerHTML = s.url ? viewOn(s) : viewOff(s);
    wire();
    batchBar();
  }

  /*@3.ICPJ.5*/
  function viewOff(s) {
    var steps = STEPS.map(function (st, i) {
      return '<li class="ics-step">' +
        '<span class="ics-step-n">' + (i + 1) + '</span>' +
        '<i class="fa-solid ' + st.i + '"></i>' +
        '<span>' + (isAr() ? st.ar : st.en) + '</span>' +
      '</li>';
    }).join('');

    return '' +
    '<div class="set-note"><i class="fa-solid fa-wand-magic-sparkles"></i><div>' +
      '<b>' + L('اربط تقويمَ البلاك بورد مرّةً واحدة.', 'Connect your Blackboard calendar once.') + '</b> ' +
      esc(L('فتظهر كويزاتُك وواجباتُك ومواعيدُ تسليمها في جدولك وصفحاتِ موادّك، وتتحدّث وحدَها.',
            'Your quizzes, assignments and due dates then appear in your schedule and course pages, and stay up to date on their own.')) +
    '</div></div>' +

    '<ol class="ics-steps">' + steps + '</ol>' +

    '<div class="set-row is-stack">' +
      '<div class="set-row-t">' +
        '<div class="set-row-n">' + esc(L('الصق رابطَ تقويمك', 'Paste your calendar link')) + '</div>' +
        '<div class="set-row-h">' + esc(L('رابطٌ خاصٌّ بك يبدأ بـ lms.seu.edu.sa وينتهي بـ learn.ics. لا تشاركه مع أحد، فمن يملكه يرى تقويمك.',
                                          'Your private link — it starts with lms.seu.edu.sa and ends with learn.ics. Keep it to yourself: anyone with it can see your calendar.')) + '</div>' +
      '</div>' +
      '<div class="set-row-c ics-connect">' +
        '<input type="url" class="set-in ltr" id="ics-url" spellcheck="false" autocomplete="off"' +
               ' placeholder="https://lms.seu.edu.sa/webapps/calendar/calendarFeed/…/learn.ics">' +
        '<button class="set-btn set-btn--primary" id="ics-connect">' +
          '<i class="fa-solid fa-link"></i><span>' + esc(L('اربط', 'Connect')) + '</span></button>' +
      '</div>' +
    '</div>' +
    '<p class="ics-msg" id="ics-msg"></p>';
  }

  /*@3.ICPJ.6*/
  function viewOn(s) {
    var okDot = s.last_ok && !s.last_err;
    var out = '';

    out +=
    '<div class="set-state">' +
      '<span class="set-dot' + (okDot ? ' is-on' : '') + '"></span>' +
      '<span class="set-state-t">' + esc(okDot
        ? L('متّصل', 'Connected')
        : (s.last_err ? L('متوقّف', 'Paused') : L('بانتظار أوّل تحديث', 'Waiting for the first update'))) + '</span>' +
      '<span class="set-state-s">' +
        esc(L('آخر تحديث: ', 'Last updated: ') + ago(s.last_ok)) +
        (s.count ? esc(' · ' + nDeadlines(s.count)) : '') +
      '</span>' +
    '</div>';

    if (s.last_err) {
      out += '<div class="set-note" data-kind="warn"><i class="fa-solid fa-triangle-exclamation"></i>' +
             '<div>' + esc(why(s.last_err)) + '</div></div>';
    }

    out +=
    '<div class="set-btns">' +
      '<button class="set-btn" id="ics-sync"><i class="fa-solid fa-rotate"></i><span>' +
        esc(L('حدِّث الآن', 'Update now')) + '</span></button>' +
      '<button class="set-btn" id="ics-guide"><i class="fa-solid fa-circle-question"></i><span>' +
        esc(L('كيف أحصل على الرابط؟', 'How do I get the link?')) + '</span></button>' +
      '<button class="set-btn set-btn--danger" id="ics-off"><i class="fa-solid fa-link-slash"></i><span>' +
        esc(L('افصل', 'Disconnect')) + '</span></button>' +
    '</div>' +
    '<p class="ics-msg" id="ics-msg"></p>' +
    '<ol class="ics-steps" id="ics-steps" hidden>' + STEPS.map(function (st, i) {
      return '<li class="ics-step"><span class="ics-step-n">' + (i + 1) + '</span>' +
             '<i class="fa-solid ' + st.i + '"></i><span>' + (isAr() ? st.ar : st.en) + '</span></li>';
    }).join('') + '</ol>';

    out += inboxView(s);
    out += pastView();
    out += changesView();
    out += teachView(s);
    out += alertsView(s);
    return out;
  }

  /*@3.ICPJ.36*/
  function pageUrl() { return location.origin + location.pathname; }

  function teachView(s) {
    var ICS = window.GardenICS;
    var sum = ICS.bbSummary ? ICS.bbSummary() : { at: 0, items: 0, stale: 0, courses: [] };
    var status = sum.at
      ? L('آخر ربط ' + ago(sum.at) + ': ' + nDeadlines(sum.items) + ' في ' + pl(sum.courses.length, 'مادّةٍ واحدة', 'مادّتين', 'موادّ', 'مادّة') + '.',
          'Last linked ' + ago(sum.at) + ': ' + nDeadlines(sum.items) + ' across ' + sum.courses.length + (sum.courses.length === 1 ? ' course.' : ' courses.'))
      : L('لم تربط بعد، ولا بأس: أغلبُ المواعيد نعرف مادّتها وحدَنا.', 'Not linked yet — that is fine: we work out the course for most deadlines on our own.');
    return '' +
    '<details class="ics-teach"' + (s.inbox && s.inbox.some(function (it) { return !it.foreign; }) ? ' open' : '') + '>' +
      '<summary class="ics-inbox-h"><i class="fa-solid fa-graduation-cap"></i><span>' +
        esc(L('اربط المواد بيقين', 'Link courses with certainty')) + '</span>' +
        '<span class="set-tag">' + esc(L('اختياري', 'Optional')) + '</span>' +
        '<i class="fa-solid fa-chevron-down ics-chev" aria-hidden="true"></i></summary>' +
      '<p class="set-row-h">' + esc(L(
        'رابطُ التقويم لا يذكر اسمَ المادة، لكنّ حسابَك في البلاك بورد يعرفه. افتح صفحةَ المواعيد وأنت مسجَّلُ الدخول، وانسخ كلَّ ما فيها، ثمّ ارجع إلى هنا واضغط «الصق وأكمل الربط». تكفي مرّةٌ في الفصل، وما تربطه يستفيد منه زملاؤك في الشعبة نفسِها.',
        'The calendar link does not name the course, but your Blackboard account does. Open the deadlines page while signed in, copy everything on it, then come back and tap “Paste and link”. Once a term is enough, and classmates in the same section benefit too.')) + '</p>' +
      '<div class="ics-teach-s" id="ics-teach-s">' + esc(status) + '</div>' +
      '<div class="set-btns">' +
        '<a class="set-btn" id="ics-teach-open" href="' + esc(ICS.teachUrl()) + '" target="_blank" rel="noopener">' +
          '<i class="fa-solid fa-up-right-from-square"></i><span>' + esc(L('افتح صفحة المواعيد', 'Open the deadlines page')) + '</span></a>' +
        (navigator.clipboard && navigator.clipboard.readText
          ? '<button class="set-btn" id="ics-teach-clip"><i class="fa-solid fa-paste"></i><span>' +
              esc(L('الصق وأكمل الربط', 'Paste and link')) + '</span></button>'
          : '') +
      '</div>' +
      '<textarea class="set-in ics-paste" id="ics-paste" rows="3" spellcheck="false" placeholder="' +
        esc(L('أو الصق النصَّ هنا بنفسك…', 'Or paste the text here yourself…')) + '"></textarea>' +
      '<div class="set-btns">' +
        '<button class="set-btn" id="ics-teach-go"><i class="fa-solid fa-check"></i><span>' +
          esc(L('اربط', 'Link')) + '</span></button>' +
        '<a class="set-btn ics-bm" id="ics-bm" href="' + esc(ICS.bookmarklet(pageUrl())) + '"' +
          ' title="' + esc(L('اسحبه إلى شريط المفضّلة', 'Drag it to your bookmarks bar')) + '">' +
          '<i class="fa-solid fa-bookmark"></i><span>' + esc(L('اربط من البلاك بورد', 'Link from Blackboard')) + '</span></a>' +
      '</div>' +
      '<p class="set-row-h">' + esc(L(
        'على الحاسوب أسرع: اسحب زرَّ «اربط من البلاك بورد» إلى شريط المفضّلة، ثمّ اضغطه وأنت في البلاك بورد؛ فيعود بك إلى هنا وقد اكتمل الربط.',
        'Faster on a computer: drag “Link from Blackboard” to your bookmarks bar, then click it while you are on Blackboard — it brings you back here with everything linked.')) + '</p>' +
    '</details>';
  }

  /*@3.ICPJ.37*/
  function teachMsg(r) {
    if (!r) return '';
    if (!r.ok) {
      var m = { bad_json: L('هذا ليس نصَّ صفحة المواعيد؛ انسخ الصفحةَ كلَّها ثمّ الصقها.', 'That is not the deadlines page — copy the whole page, then paste it.'),
                bad_shape: L('لم نتعرّف على هذا النصّ؛ انسخ الصفحةَ كما هي دون تعديل.', 'We could not read that — copy the page exactly as it is.'),
                no_items: L('لا مواعيدَ موادَّ فيما لصقته.', 'No course deadlines in what you pasted.'),
                bad_hash: L('تعذّرت قراءةُ ما أرسله زرُّ المفضّلة؛ جرّبه مرّةً أخرى.', 'Could not read what the bookmark sent — try it once more.') };
      return m[r.error] || L('تعذّر الربط؛ جرّب مرّةً أخرى.', 'Linking failed — try again.');
    }
    return L('رُبط ' + nDeadlines(r.items) + ' بموادّها' + (r.stale ? '، وذهب ' + nDeadlines(r.stale) + ' من فصولٍ ماضية إلى بابها' : '') + '.',
             'Linked ' + nDeadlines(r.items) + ' to their courses' + (r.stale ? '; ' + r.stale + ' from past terms moved to their own list' : '') + '.');
  }

  /*@3.ICPJ.7*/
  function inboxView(s) {
    if (!s.inbox.length) {
      return '<div class="ics-empty"><i class="fa-solid fa-circle-check"></i><p>' +
        esc(L('كلُّ مواعيدك مربوطةٌ بموادّها.', 'Every deadline is linked to its course.')) +
        '</p></div>';
    }

    /*@3.ICPJ.23*/
    var groups = window.GardenICS.groupInbox(s.inbox);
    var full = window.GardenICS.myCoursesFull ? window.GardenICS.myCoursesFull() : [];
    var codes = full.map(function (c) { return c.code; });

    var body = groups.map(function (g) {
      var head = g.items.length > 1
        ? L(nDeadlines(g.items.length) + ' متقاربة', g.items.length + ' related deadlines')
        : L('موعدٌ واحد', 'One deadline');
      /*@3.ICPJ.32*/
      var alien = g.foreign && codes.indexOf(g.foreign) < 0 ? g.foreign : '';
      var key = g.items[0].uid;
      /*@3.ICPJ.24*/
      var chosen = picks[key] !== undefined ? picks[key] : '';
      if (chosen && codes.indexOf(chosen) < 0) chosen = '';

      var rows = g.items.map(function (it) {
        return '<li class="ics-item">' +
          '<span class="ics-badge" data-k="' + esc(it.kind) + '">' + esc(kindName(it.kind)) + '</span>' +
          (it.code ? '<span class="ics-item-c ltr">' + esc(it.code) + '</span>' : '') +
          '<span class="ics-item-t" dir="auto">' + esc(it.raw) + '</span>' +
          '<span class="ics-item-d ltr">' + esc(it.date) + '</span>' +
        '</li>';
      }).join('');

      /*@3.ICPJ.33*/
      var opts = ['<option value="">' + esc(L('اختر المادة…', 'Choose a course…')) + '</option>']
        .concat(full.map(function (c) {
          return '<option value="' + esc(c.code) + '"' + (c.code === chosen ? ' selected' : '') + '>' +
            esc(c.name ? c.code + ' — ' + c.name : c.code) + '</option>';
        })).join('');

      if (alien) {
        return '<div class="ics-group is-alien" data-uid="' + esc(key) + '">' +
          '<div class="ics-group-h">' +
            '<span class="ics-group-n">' + esc(head) + '</span>' +
            '<span class="ics-alien-t"><i class="fa-solid fa-circle-question"></i>' +
              esc(L('رمزُها ', 'Course code ')) + '<b class="ltr">' + esc(alien) + '</b>' +
              esc(L('، وليست ضمن موادّ فصلك', ' — not one of your courses this term')) + '</span>' +
          '</div>' +
          '<ul class="ics-items">' + rows + '</ul>' +
          '<p class="set-row-h">' + esc(L(
            'غالباً مادّةٌ حذفتَها من فصلك أو لم تُضِفها بعد، وما زالت في البلاك بورد. أضِفها إلى فصلك لتصلك مواعيدُها، أو أخفِها فلا نسألك عنها ثانيةً.',
            'Most likely a course you removed from your term or have not added yet, while Blackboard still lists it. Add it to your term to get its deadlines, or hide it and we will not ask again.')) + '</p>' +
          '<div class="ics-group-a">' +
            '<a class="set-btn set-btn--primary ics-add" href="' + esc(termUrl()) + '">' +
              '<i class="fa-solid fa-plus"></i><span>' + esc(L('أضِفها إلى فصلي', 'Add it to my term')) + '</span></a>' +
            '<button class="set-btn ics-no"><i class="fa-solid fa-eye-slash"></i><span>' +
              esc(L('أخفِ هذه المادة', 'Hide this course')) + '</span></button>' +
          '</div>' +
        '</div>';
      }

      return '<div class="ics-group" data-uid="' + esc(key) + '"' +
          (picks[key] ? ' data-picked="1"' : '') + '>' +
        '<div class="ics-group-h">' +
          '<span class="ics-group-n">' + esc(head) + '</span>' +
        '</div>' +
        '<ul class="ics-items">' + rows + '</ul>' +
        '<div class="ics-group-a">' +
          '<select class="set-in ics-pick">' + opts + '</select>' +
          '<button class="set-btn set-btn--primary ics-ok"><i class="fa-solid fa-check"></i><span>' +
            esc(L('اربط', 'Link')) + '</span></button>' +
          '<button class="set-btn ics-no"><i class="fa-solid fa-trash-can"></i><span>' +
            esc(L('أزِل من جدولي', 'Remove from my schedule')) + '</span></button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="ics-inbox">' +
      '<div class="ics-inbox-h"><i class="fa-solid fa-inbox"></i>' +
        '<span>' + esc(L('مواعيد لم نعرف مادّتها', 'Deadlines without a course')) + '</span>' +
        '<span class="ics-count">' + s.inbox.length + '</span></div>' +
      '<p class="set-row-h">' + esc(L(
        'أضفناها إلى جدولك، وستصلك تذكيراتُها كالمعتاد. اختر مادّةَ أيٍّ منها إن شئت، فيُربط ما يشبهه بعده تلقائيّاً.',
        'They are already in your schedule and you will still be reminded. Choose a course for any of them if you like — similar ones will follow automatically.')) + '</p>' +
      body +
      /*@3.ICPJ.25*/
      '<div class="ics-batch" id="ics-batch" hidden>' +
        '<span class="ics-batch-t"><i class="fa-solid fa-layer-group"></i>' +
          esc(L('اخترتَ موادَّ لأكثر من مجموعة', 'You chose courses for several groups')) + '</span>' +
        '<button class="set-btn" id="ics-batch-clear">' +
          '<i class="fa-solid fa-eraser"></i><span>' + esc(L('امسح الاختيارات', 'Clear')) + '</span></button>' +
        '<button class="set-btn set-btn--primary" id="ics-batch-go">' +
          '<i class="fa-solid fa-check-double"></i><span>' + esc(L('اربطها كلَّها', 'Assign them all')) +
          ' <b class="ics-batch-n" id="ics-batch-n"></b></span></button>' +
      '</div>' +
    '</div>';
  }

  var pastOpen = false;
  function pastView() {
    var ICS = window.GardenICS;
    var list = ICS.pastList ? ICS.pastList() : [];
    if (!list.length) return '';
    var groups = {}, order = [];
    list.forEach(function (it) {
      var k = it.code || '';
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(it);
    });
    var body = order.map(function (k) {
      var rows = groups[k].map(function (it) {
        return '<li class="ics-item ics-past-row" data-past="' + esc(it.uid) + '">' +
          '<span class="ics-badge" data-k="' + esc(it.kind) + '">' + esc(kindName(it.kind)) + '</span>' +
          '<span class="ics-item-t" dir="auto">' + esc(it.title) + '</span>' +
          '<span class="ics-item-d ltr">' + esc(it.date) + '</span>' +
          '<span class="ics-past-a">' +
            '<button class="set-btn ics-past-add" aria-label="' + esc(L('أضِف إلى جدولي', 'Add to my schedule')) + '"' +
              ' data-ar-title="أضِف إلى جدولي" data-en-title="Add to my schedule" title="' + esc(L('أضِف إلى جدولي', 'Add to my schedule')) + '">' +
              '<i class="fa-solid fa-plus"></i></button>' +
            '<button class="set-btn ics-past-del" aria-label="' + esc(L('احذف', 'Delete')) + '"' +
              ' data-ar-title="احذف" data-en-title="Delete" title="' + esc(L('احذف', 'Delete')) + '">' +
              '<i class="fa-solid fa-trash-can"></i></button>' +
          '</span>' +
        '</li>';
      }).join('');
      return '<div class="ics-group ics-past-g" data-pastg="' + esc(k) + '">' +
        '<div class="ics-group-h">' +
          (k ? '<span class="ics-item-c ltr">' + esc(k) + '</span>' : '<span class="ics-group-n">' + esc(L('مادّةٌ غيرُ معروفة', 'Unknown course')) + '</span>') +
          '<span class="ics-count">' + groups[k].length + '</span>' +
          '<button class="set-btn ics-past-delall"><i class="fa-solid fa-trash-can"></i><span>' +
            esc(L('احذفها كلَّها', 'Delete all')) + '</span></button>' +
        '</div>' +
        '<ul class="ics-items">' + rows + '</ul>' +
      '</div>';
    }).join('');
    return '<details class="ics-inbox ics-past" id="ics-past"' + (pastOpen ? ' open' : '') + '>' +
      '<summary class="ics-inbox-h"><i class="fa-solid fa-clock-rotate-left"></i>' +
        '<span>' + esc(L('أحداثٌ من فصولٍ ماضية', 'Events from past terms')) + '</span>' +
        '<span class="ics-count">' + list.length + '</span>' +
        '<i class="fa-solid fa-chevron-down ics-chev" aria-hidden="true"></i></summary>' +
      '<p class="set-row-h">' + esc(L(
        'مواعيدُ من فصولٍ سابقة ما زالت في البلاك بورد. أبقيناها خارجَ جدولك؛ أضِف منها ما تريد، أو احذفه.',
        'Deadlines from earlier terms that Blackboard still lists. We kept them out of your schedule — add any you want, or delete them.')) + '</p>' +
      body +
    '</details>';
  }

  /*@3.ICPJ.41*/
  function changesView() {
    var ICS = window.GardenICS;
    var list = ICS.changes ? ICS.changes() : [];
    var gone = ICS.deletedCount ? ICS.deletedCount() : 0;
    if (!list.length && !gone) return '';
    function when(o) { return [o.date || '', o.allday ? '' : (o.time || '')].filter(Boolean).join(' '); }
    var rows = list.map(function (c) {
      var mine = c.mine || {}, news = c.news || {};
      var said = [], iso = function (s) { return '\u2068' + s + '\u2069'; };
      if (news.date || news.time) said.push(iso(when({ date: news.date || mine.date, time: news.time || mine.time })));
      if (news.title) said.push('«' + iso(news.title) + '»');
      if (!said.length) said.push(L('تفاصيلَ أخرى', 'other details'));
      return '<div class="ics-group" data-news="' + esc(c.uid) + '">' +
        '<ul class="ics-items"><li class="ics-item">' +
          (c.code ? '<span class="ics-item-c ltr">' + esc(c.code) + '</span>' : '') +
          '<span class="ics-item-t" dir="auto">' + esc(mine.title || '') + '</span>' +
          '<span class="ics-item-d ltr">' + esc(when(mine)) + '</span>' +
        '</li></ul>' +
        '<p class="set-row-h">' + esc(L('البلاك بورد صار يقول: ', 'Blackboard now says: ')) +
          '<b>' + esc(said.join(' · ')) + '</b></p>' +
        '<div class="ics-group-a">' +
          '<button class="set-btn ics-news-ok"><i class="fa-solid fa-rotate-left"></i><span>' +
            esc(L('اعتمد ما يقوله البلاك بورد', 'Use what Blackboard says')) + '</span></button>' +
          '<button class="set-btn ics-news-keep"><i class="fa-solid fa-check"></i><span>' +
            esc(L('أبقِ تصحيحي', 'Keep my correction')) + '</span></button>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="ics-inbox">' +
      (list.length ?
        '<div class="ics-inbox-h"><i class="fa-solid fa-circle-exclamation"></i>' +
          '<span>' + esc(L('البلاك بورد غيّر ما صحّحتَه', 'Blackboard changed what you corrected')) + '</span>' +
          '<span class="ics-count">' + list.length + '</span></div>' +
        '<p class="set-row-h">' + esc(L(
          'عدّلتَ هذه بنفسك فأبقيناها كما كتبتَها، ثمّ غيّرها الأستاذُ في البلاك بورد. اختر ما يبقى في جدولك.',
          'You edited these, so we kept them as you wrote them — then the instructor changed them on Blackboard. Choose what stays in your schedule.')) + '</p>' +
        rows : '') +
      (gone ?
        '<div class="set-btns">' +
          '<span class="set-row-h">' + esc(L(nDeadlines(gone) + ' حذفتَها من جدولك، فلا تعود مع التحديث.',
                                             nDeadlines(gone) + ' you deleted from your schedule will not come back on update.')) + '</span>' +
          '<button class="set-btn" id="ics-restore"><i class="fa-solid fa-rotate-left"></i><span>' +
            esc(L('أعِدها', 'Bring them back')) + '</span></button>' +
        '</div>' : '') +
    '</div>';
  }

  /*@3.ICPJ.10*/
  function alertsView(s) {
    return '' +
    '<div class="set-row">' +
      '<div class="set-row-t">' +
        '<div class="set-row-n">' + esc(L('ذكّرني قبل الموعد', 'Remind me before it is due')) + '</div>' +
        '<div class="set-row-h">' + esc(L('كم يوماً قبل موعد التسليم يصلك التذكير.',
                                          'How many days before the deadline you are reminded.')) + '</div>' +
      '</div>' +
      '<div class="set-row-c">' +
        '<div class="set-step">' +
          '<button id="ics-lead-m" aria-label="' + esc(L('أنقص', 'Less')) + '">−</button>' +
          '<span class="set-step-v" id="ics-lead-v">' + s.lead_days + '</span>' +
          '<button id="ics-lead-p" aria-label="' + esc(L('زد', 'More')) + '">+</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="set-row">' +
      '<div class="set-row-t">' +
        '<div class="set-row-n">' + esc(L('حدِّث تلقائيّاً', 'Update automatically')) + '</div>' +
        '<div class="set-row-h">' + esc(L('نحدّث مواعيدك بهدوءٍ حين تفتح الموقع، مرّةً كلَّ ساعتين على الأكثر.',
                                          'We quietly refresh your deadlines when you open the site, at most once every two hours.')) + '</div>' +
      '</div>' +
      '<div class="set-row-c"><div class="set-seg" id="ics-auto">' +
        '<button data-v="1"' + (s.auto ? ' class="is-on"' : '') + '>' + esc(L('نعم', 'Yes')) + '</button>' +
        '<button data-v="0"' + (!s.auto ? ' class="is-on"' : '') + '>' + esc(L('لا', 'No')) + '</button>' +
      '</div></div>' +
    '</div>' +

    /*@3.ICPJ.11*/
    '<div class="set-row is-stack">' +
      '<div class="set-row-t">' +
        '<div class="set-row-n">' + esc(L('ذكّرني حتى والموقع مغلق', 'Remind me even when the site is closed')) +
          '<span class="set-tag">' + esc(L('اختياري', 'Optional')) + '</span></div>' +
        '<div class="set-row-h">' + esc(L(
          'لنرسل إليك التذكيرَ والموقعُ مغلق، نحفظ رابطَ تقويمك على خادمنا ونقرؤه عدّةَ مرّاتٍ في اليوم، ولا نستعمله لغير ذلك. ومن دون هذا يعمل كلُّ شيءٍ حين تفتح الموقع، عدا التذكيرَ والموقعُ مغلق.',
          'To remind you while the site is closed, we keep your calendar link on our server and read it a few times a day — for nothing else. Without this, everything still works when you open the site, except reminders while it is closed.')) + '</div>' +
      '</div>' +
      '<div class="set-row-c">' +
        (s.on_server
          ? '<button class="set-btn set-btn--danger" id="ics-unreg"><i class="fa-solid fa-server"></i><span>' +
              esc(L('أوقِف التذكير واحذف رابطي من الخادم', 'Stop and delete my link from the server')) + '</span></button>'
          : '<button class="set-btn" id="ics-reg"><i class="fa-solid fa-bell"></i><span>' +
              esc(L('فعِّل التذكير', 'Turn on reminders')) + '</span></button>') +
      '</div>' +
    '</div>';
  }

  /*@3.ICPJ.12*/

  function msg(text, kind) {
    var el = $('ics-msg');
    if (!el) return;
    el.textContent = text || '';
    el.setAttribute('data-kind', kind || '');
  }

  /*@3.ICPJ.26*/
  function batchBar() {
    if (!host) return;
    var bar = $('ics-batch');
    if (!bar) return;
    var n = 0;
    host.querySelectorAll('.ics-group').forEach(function (g) {
      var on = !!picks[g.getAttribute('data-uid')];
      if (on) n++;
      if (on) g.setAttribute('data-picked', '1'); else g.removeAttribute('data-picked');
    });
    bar.hidden = n < 2;
    var nEl = $('ics-batch-n');
    if (nEl) nEl.textContent = n < 2 ? '' : String(n);
    /*@3.ICPJ.27*/
    host.querySelectorAll('.ics-ok').forEach(function (b) {
      b.classList.toggle('set-btn--primary', n < 2);
    });
  }

  function work(on) {
    busy = on;
    host.querySelectorAll('button').forEach(function (b) { b.disabled = on; });
  }

  function doSync() {
    if (busy) return;
    work(true);
    msg(L('نحدّث مواعيدك…', 'Updating your deadlines…'), '');
    window.GardenICS.sync().then(function (r) {
      work(false);
      if (!r.ok) { msg(why(r.error), 'bad'); render(); return; }
      var bits = [];
      if (r.added)   bits.push(L('جديد: ' + r.added, r.added + ' new'));
      if (r.updated) bits.push(L('تغيّر: ' + r.updated, r.updated + ' changed'));
      if (r.pending) bits.push(L('بلا مادّة: ' + r.pending, r.pending + ' without a course'));
      if (r.past)    bits.push(L('من فصولٍ ماضية: ' + r.past, r.past + ' from past terms'));
      /*@3.ICPJ.13*/
      if (!bits.length) bits.push(L('لا جديد؛ مواعيدُك كلُّها محدَّثة.', 'Nothing new — your deadlines are up to date.'));
      if (r.touched) bits.push(L('أبقينا تعديلَك على ' + nDeadlines(r.touched), 'kept your edits on ' + nDeadlines(r.touched)));
      if (r.changed) bits.push(L('غيّر الأستاذُ ' + nDeadlines(r.changed) + ' بعد تعديلك، انظر أدناه', r.changed + ' changed on Blackboard after your edit — see below'));
      /*@3.ICPJ.28*/
      if (r.blocked) bits.push(L('تعذّرت إضافةُ ' + nDeadlines(r.blocked) + '؛ أعِد المحاولة',
                                 r.blocked + ' could not be added — try again'));
      msg((teachPrefix ? teachPrefix + ' ' : '') + bits.join(' · '), r.blocked ? 'bad' : 'ok');
      teachPrefix = '';
      render();
      if (window.GardenSchedule && GardenSchedule.reload) GardenSchedule.reload();
    });
  }

  function wire() {
    var ICS = window.GardenICS;

    var con = $('ics-connect');
    if (con) con.addEventListener('click', function () {
      var v = ($('ics-url').value || '').trim();
      if (!ICS.setUrl(v)) { msg(why('bad_url'), 'bad'); return; }
      doSync();
    });
    var inp = $('ics-url');
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); con.click(); } });

    var sy = $('ics-sync'); if (sy) sy.addEventListener('click', doSync);

    var gd = $('ics-guide');
    if (gd) gd.addEventListener('click', function () {
      var st = $('ics-steps'); if (st) st.hidden = !st.hidden;
    });

    var off = $('ics-off');
    if (off) off.addEventListener('click', function () {
      /*@3.ICPJ.14*/
      var wipe = confirm(L(
        'سنفصل تقويمك ونحذف رابطك من خادمنا.\n\nاضغط «موافق» لحذف المواعيد التي أضفناها أيضاً، أو «إلغاء» لإبقائها في جدولك.',
        'We will disconnect your calendar and delete your link from our server.\n\nOK also removes the deadlines we added; Cancel keeps them in your schedule.'));
      work(true);
      ICS.disconnect(wipe).then(function () {
        work(false); render();
        if (window.GardenSchedule && GardenSchedule.reload) GardenSchedule.reload();
      });
    });

    var lm = $('ics-lead-m'), lp = $('ics-lead-p');
    function lead(d) {
      var v = ICS.setLead(ICS.state().lead_days + d);
      $('ics-lead-v').textContent = v;
      if (ICS.state().on_server) ICS.register();
    }
    if (lm) lm.addEventListener('click', function () { lead(-1); });
    if (lp) lp.addEventListener('click', function () { lead(1); });

    var au = $('ics-auto');
    if (au) au.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      ICS.setAuto(b.getAttribute('data-v') === '1');
      au.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
    });

    var reg = $('ics-reg');
    if (reg) reg.addEventListener('click', function () {
      work(true);
      msg(L('نفعّل التذكير…', 'Turning on reminders…'), '');
      /*@3.ICPJ.19*/
      ICS.register().then(function (ok) {
        work(false);
        var text;
        if (ok === true) {
          text = L('تمّ؛ سنذكّرك قبل كلِّ موعدٍ حتى والموقعُ مغلق.',
                   'Done — we will remind you before each deadline, even when the site is closed.');
        } else if (ok === 'no-vault') {
          text = L('شغّل المزامنةَ أوّلاً من الإعدادات، فبها يعرف خادمُنا إلى أيِّ أجهزتك يرسل التذكير، ثمّ ارجع إلى هنا.',
                   'Turn on sync in Settings first — that is how our server knows which of your devices to remind — then come back here.');
        } else {
          text = L('تعذّر التفعيل؛ تأكّد أن الرابط يعمل ثمّ جرّب ثانيةً.',
                   'Could not turn it on — check the link works, then try again.');
        }
        msg(text, ok === true ? 'ok' : 'bad');
        render();
      });
    });

    var un = $('ics-unreg');
    if (un) un.addEventListener('click', function () {
      work(true);
      ICS.unregister().then(function () {
        var s = ICS.state(); s.on_server = false; ICS.save();
        work(false);
        msg(L('حُذف رابطك من خادمنا، وتبقى مواعيدُك تتحدّث حين تفتح الموقع.',
              'Your link was deleted from our server. Your deadlines still update when you open the site.'), 'ok');
        render();
      });
    });

    host.querySelectorAll('.ics-group').forEach(function (g) {
      var key = g.getAttribute('data-uid');
      var pick = g.querySelector('.ics-pick');
      if (!pick) {
        var noAlien = g.querySelector('.ics-no');
        if (noAlien) {
          noAlien.addEventListener('click', function () {
            if (ICS.ignoreBand) ICS.ignoreBand(key); else ICS.skip(key);
            doSync();
          });
        }
        return;
      }
      /*@3.ICPJ.29*/
      pick.addEventListener('change', function () {
        if (pick.value) picks[key] = pick.value; else delete picks[key];
        batchBar();
      });
      g.querySelector('.ics-ok').addEventListener('click', function () {
        var code = pick.value;
        if (!code) { msg(L('اختر المادة أوّلاً.', 'Choose a course first.'), 'bad'); return; }
        delete picks[key];
        ICS.assign(key, code, true);
        doSync();
      });
      /*@3.ICPJ.15*/
      g.querySelector('.ics-no').addEventListener('click', function () {
        /*@3.ICPJ.30*/
        delete picks[key];
        if (ICS.ignoreBand) { ICS.ignoreBand(key); }
        else {
          var mine = null;
          ICS.groupInbox(ICS.state().inbox).forEach(function (x) {
            if (x.items[0] && x.items[0].uid === key) mine = x;
          });
          (mine ? mine.items : [{ uid: key }]).forEach(function (it) { ICS.skip(it.uid); });
        }
        doSync();
      });
    });

    host.querySelectorAll('[data-news]').forEach(function (g) {
      var uid = g.getAttribute('data-news');
      g.querySelector('.ics-news-ok').addEventListener('click', function () { ICS.acceptNews(uid); doSync(); });
      g.querySelector('.ics-news-keep').addEventListener('click', function () { ICS.keepMine(uid); render(); });
    });
    var rst = $('ics-restore');
    if (rst) rst.addEventListener('click', function () { ICS.restoreDeleted(); doSync(); });

    var pst = $('ics-past');
    if (pst) pst.addEventListener('toggle', function () { pastOpen = pst.open; });
    host.querySelectorAll('[data-past]').forEach(function (row) {
      var uid = row.getAttribute('data-past');
      row.querySelector('.ics-past-add').addEventListener('click', function () {
        ICS.keepPast(uid);
        pastOpen = true;
        doSync();
      });
      row.querySelector('.ics-past-del').addEventListener('click', function () {
        ICS.dropPast(uid);
        pastOpen = true;
        render();
      });
    });
    host.querySelectorAll('[data-pastg]').forEach(function (g) {
      g.querySelector('.ics-past-delall').addEventListener('click', function () {
        var ids = [];
        g.querySelectorAll('[data-past]').forEach(function (r) { ids.push(r.getAttribute('data-past')); });
        ICS.dropPast(ids);
        pastOpen = true;
        render();
      });
    });

    /*@3.ICPJ.38*/
    function teachNow(text) {
      var ta = $('ics-paste');
      var r = ICS.teach(text);
      msg(teachMsg(r), r && r.ok ? 'ok' : 'bad');
      if (r && r.ok) { if (ta) ta.value = ''; teachPrefix = teachMsg(r); doSync(); }
    }
    var tgo = $('ics-teach-go');
    if (tgo) tgo.addEventListener('click', function () {
      var ta = $('ics-paste');
      teachNow(ta ? ta.value : '');
    });
    var tclip = $('ics-teach-clip');
    if (tclip) tclip.addEventListener('click', function () {
      navigator.clipboard.readText().then(function (txt) {
        var ta = $('ics-paste');
        if (ta) ta.value = txt || '';
        teachNow(txt || '');
      }).catch(function () {
        var ta = $('ics-paste');
        if (ta) ta.focus();
        msg(L('لم يسمح المتصفّح بقراءة ما نسخته؛ الصقه في المربّع بالضغط المطوّل، ثمّ اضغط «اربط».',
              'Your browser did not allow reading what you copied — long-press the box to paste, then tap Link.'), 'bad');
      });
    });
    var tpaste = $('ics-paste');
    if (tpaste) tpaste.addEventListener('paste', function () {
      setTimeout(function () {
        if (/"results"\s*:\s*\[/.test(tpaste.value)) teachNow(tpaste.value);
      }, 0);
    });

    /*@3.ICPJ.31*/
    var bgo = $('ics-batch-go');
    if (bgo) bgo.addEventListener('click', function () {
      if (busy) return;
      var pairs = [];
      host.querySelectorAll('.ics-group').forEach(function (g) {
        var k = g.getAttribute('data-uid');
        if (picks[k]) pairs.push([k, picks[k]]);
      });
      if (pairs.length < 2) return;
      pairs.forEach(function (pr) { ICS.assign(pr[0], pr[1], true); });
      picks = {};
      doSync();
    });
    var bcl = $('ics-batch-clear');
    if (bcl) bcl.addEventListener('click', function () {
      picks = {};
      host.querySelectorAll('.ics-pick').forEach(function (el) { el.value = ''; });
      batchBar();
    });
  }

  /*@3.ICPJ.16*/


  /*@3.ICPJ.34*/
  var bar = null;

  var barNow = {}, barShut = false;

  function renderBar() {
    if (!bar) return;
    var ICS = window.GardenICS;
    var s = ICS && ICS.state ? ICS.state() : null;
    var all = (s && s.url && s.inbox) ? s.inbox : [];
    var ack = (s && s.bar_ack) || {};
    var list = barShut ? [] : all.filter(function (it) { return !ack[it.uid] || barNow[it.uid]; });
    if (!list.length) {
      if (taught) {
        bar.hidden = false;
        bar.innerHTML = '<i class="fa-solid fa-graduation-cap"></i><div class="sch-icsbar-t"><b>' +
          esc(teachMsg(taught)) + '</b></div>';
        return;
      }
      bar.hidden = true; bar.innerHTML = ''; return;
    }
    var fresh = list.filter(function (it) { return !barNow[it.uid]; }).map(function (it) { barNow[it.uid] = 1; return it.uid; });
    if (fresh.length && ICS.ackBar) ICS.ackBar(fresh);
    var alien = list.filter(function (it) { return it.foreign; }).length;
    var mine = list.length - alien;
    /*@3.ICPJ.40*/
    var head = mine
      ? L(mine === 1 ? 'موعدٌ جديدٌ من البلاك بورد لم نعرف مادّتَه'
                     : (mine === 2 ? 'موعدان جديدان من البلاك بورد لم نعرف مادّتَهما'
                                   : nDeadlines(mine) + ' جديدة من البلاك بورد لم نعرف موادَّها'),
          (mine === 1 ? 'A new Blackboard deadline' : mine + ' new Blackboard deadlines') + ' without a course')
      : L(alien === 1 ? 'موعدٌ من البلاك بورد لمادّةٍ ليست في فصلك' : nDeadlines(alien) + ' من البلاك بورد لموادَّ ليست في فصلك',
          (alien === 1 ? 'A Blackboard deadline' : alien + ' Blackboard deadlines') + ' for a course not in your term');
    var sub = mine
      ? L((mine === 1 ? 'أضفناه إلى جدولك وسيصلك تذكيرُه في وقته.' : 'أضفناها إلى جدولك وستصلك تذكيراتُها في وقتها.') +
            ' اختر المادة إن شئت.',
          (mine === 1 ? 'It is in your schedule and you will be reminded on time.' : 'They are in your schedule and you will be reminded on time.') +
            ' Choose the course if you like.')
      : L('لم نُضِفه إلى جدولك؛ أضِف المادة إلى فصلك أو أخفِها.', 'We did not add it to your schedule — add the course to your term, or hide it.');
    bar.hidden = false;
    bar.innerHTML =
      '<i class="fa-solid fa-inbox"></i>' +
      '<div class="sch-icsbar-t"><b>' + esc(head) + '</b><span>' + esc(sub) + '</span></div>' +
      '<button type="button" class="sch-icsbar-go" id="ics-bar-go">' +
        esc(mine ? L('اختر المادة', 'Choose course') : L('اعرضها', 'Show me')) + '</button>' +
      '<button type="button" class="sch-icsbar-x" id="ics-bar-x" aria-label="' + esc(L('حسناً', 'Got it')) + '"' +
        ' data-ar-title="حسناً" data-en-title="Got it" title="' + esc(L('حسناً', 'Got it')) + '">' +
        '<i class="fa-solid fa-xmark"></i></button>';
    var go = $('ics-bar-go');
    if (go) {
      go.addEventListener('click', function () {
        var b = $('btn-settings');
        if (b) b.click();
        setTimeout(function () {
          var card = $('ics-card');
          if (card && card.scrollIntoView) card.scrollIntoView({ block: 'start' });
        }, 380);
      });
    }
    var x = $('ics-bar-x');
    if (x) x.addEventListener('click', function () { barShut = true; renderBar(); });
  }

  function paint() { render(); renderBar(); }

  window.GardenICSPanel = {
    mount: function (el) { host = el; render(); },
    mountBar: function (el) { bar = el; renderBar(); },
    refresh: paint
  };

  /*@3.ICPJ.17*/
  document.addEventListener('garden:languageChanged', paint);
  /*@3.ICPJ.18*/
  window.addEventListener('ics:sync', renderBar);
  /*@3.ICPJ.20*/
  window.addEventListener('garden:syncCompleted', function () { paint(); });

  /*@3.ICPJ.39*/
  var taught = null;
  var teachPrefix = '';
  function fromHash() {
    var ICS = window.GardenICS;
    if (!ICS || !ICS.teachFromHash) return false;
    var r = ICS.teachFromHash(location.hash);
    if (!r) return false;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    taught = r;
    if (r.ok) ICS.sync().then(function () { renderBar(); if (host) render(); });
    return true;
  }

  /*@3.ICPJ.35*/
  (function () {
    function selfMount() {
      var el = $('ics-bar');
      if (el) { bar = el; }
      if (!fromHash() && /bbteach=/.test(location.hash)) {
        var tries = 0, tm = setInterval(function () { if (fromHash() || ++tries > 40) clearInterval(tm); }, 250);
      }
      renderBar();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', selfMount);
    } else { selfMount(); }
  })();
})();
