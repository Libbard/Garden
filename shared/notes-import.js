/*@3.NOIJ4.1*/
;(function (G) {
  'use strict';

  function Bk() { return G.GardenNotesBlocks; }
  function Md() { return G.GardenNotesMd; }

  function isEn() {
    try {
      var d = G.document && G.document.documentElement;
      if (d && d.lang) return /^en/i.test(d.lang);
      return (G.localStorage && G.localStorage.getItem('garden_lang')) === 'en';
    } catch (e) { return false; }
  }
  function L(ar, en) { return isEn() ? en : ar; }

  var LETTER = /[\p{L}\p{N}]/gu;
  function letters(s) { return (String(s || '').match(LETTER) || []).length; }
  function prose(rt) { return runsText((rt || []).filter(function (r) { return r && !r.mth; })); }
  function runsText(rt) {
    var s = '';
    for (var i = 0; rt && i < rt.length; i++) s += (rt[i] && rt[i].s) || '';
    return s;
  }
  function blockText(b) {
    var s = runsText(b.rt), i, j;
    for (i = 0; b.items && i < b.items.length; i++) s += ' ' + runsText(b.items[i].rt);
    for (i = 0; b.rows && i < b.rows.length; i++) {
      for (j = 0; j < b.rows[i].length; j++) s += ' ' + runsText(b.rows[i][j] && b.rows[i][j].rt);
    }
    if (b.ty === 'code') s += ' ' + (b.src || '');
    if (b.ty === 'math') s += ' ' + (b.tex || '');
    if (b.ct) s += ' ' + b.ct;
    return s;
  }
  function docLetters(doc) {
    var n = 0, bs = (doc && doc.blocks) || [];
    for (var i = 0; i < bs.length; i++) n += letters(blockText(bs[i]));
    return n;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /*@3.NOIJ4.2*/
  function caps(o) {
    var c = (Bk() && Bk().CAPS) || {};
    var f = (o && o.core) || {};
    return {
      calloutTitle: f.calloutTitle != null ? !!f.calloutTitle : !!c.calloutTitle,
      layout: f.layout != null ? !!f.layout : !!c.cardLayout,
      pageBadge: f.pageBadge != null ? !!f.pageBadge : !!c.pageBadge,
      recall: f.recall != null ? !!f.recall : !!c.recall,
      fmt: f.fmt != null ? !!f.fmt : !!c.fmt
    };
  }

  function splitAt(rt, pos) {
    var a = [], z = [], n = 0;
    for (var i = 0; i < rt.length; i++) {
      var r = rt[i], s = r.s || '', end = n + s.length;
      if (end <= pos) a.push(r);
      else if (n >= pos) z.push(r);
      else {
        a.push(Object.assign({}, r, { s: s.slice(0, pos - n) }));
        z.push(Object.assign({}, r, { s: s.slice(pos - n) }));
      }
      n = end;
    }
    return [a, z];
  }
  function dropLead(rt, n) {
    var z = splitAt(rt, n)[1];
    if (z.length) z[0] = Object.assign({}, z[0], { s: z[0].s.replace(/^\s+/, '') });
    return z.filter(function (r) { return r.s; });
  }

  var CITES = [
    /\s*\[cite(?:_start|_end)?(?::\s*[\d,\s]+)?\]/g,
    /\uE200[^\uE201]*\uE201/g,
    /\u3010[^\u3011]*\u2020[^\u3011]*\u3011/g,
    /:contentReference\[oaicite:\d+\]\{index=\d+\}/g,
    /*@3.NOIJ4.13*/
    /[ \t]*:?chatgpt-content-reference\{index="\d+"\}/g,
    /[ \t]*\(\[[^\]\n]{1,80}\]\(https?:\/\/[^)\s]*[?&]utm_source=chatgpt\.com\)\)/g
  ];
  function stripCites(s, rep) {
    for (var i = 0; i < CITES.length; i++) {
      s = s.replace(CITES[i], function (m) { rep.cites++; rep.removed += letters(m.replace(/\]\([^)\s]*\)/g, ']')); return ''; });
    }
    s = s.replace(/[?&]utm_source=(?:chatgpt\.com|gemini)(?=[)\s#]|$)/g, '').replace(/\?utm_source=(?:chatgpt\.com|gemini)&/g, '?');
    return s;
  }

  /*@3.NOIJ4.3*/
  var CHAT_STRONG = /^(سأقرأ|سأبدأ|سأجهز|سأجهّز|هل ترغب|هل تحب|هل تحبّ|سأشرح|سأكمل|سأنتقل|انتهت المجموعة|انتهيت من|(?:قل|اكتب)\s*[«"“]?\s*اكمل|أيّها تريد|أيها تريد|هل تريد|هل تودّ|هل تود|إن أردتَ?|إذا أردتَ?|إن رغبتَ?|إذا رغبتَ?|يمكنني أيضاً|يمكنني أيضا|أستطيع أيضاً|أستطيع أيضا|If you(?:'d| would)? (?:want|like)|Would you like|Let me know|I can also|Shall I|Want me to|I'll (?:now )?(?:read|start|go|continue)|Let me (?:read|start|go|know))/i;
  var CHAT_WEAK = /^(حسناً|حسنًا|ممتاز|بالتأكيد|بكلّ سرور|بكل سرور|رائع|مرحباً|مرحبًا|مرحبا|أهلاً|أهلًا|أهلا|يسعدني|سؤالٌ ممتاز|سؤال ممتاز|Sure|Great|Certainly|Of course|Absolutely|Hello|Hi|Happy to help|Great question|Here(?:'s| is| are))[\s,.!،:]/i;
  var CHAT_TAIL_AR = /(?:^|[\s،,.])[وف]?(?:هل|أيّهما|أيهما|أيّها|أيها)\s/;
  /*@3.NOIJ4.15*/
  var CHAT_BYE = /^(?:بالتوفيق|حظّاً موفّقاً|حظاً موفقاً|حظا موفقا|وفّقك الله|وفقك الله|Good luck|Best of luck)[\s\S]{0,70}$/i;
  var TAIL_JUNK = /^(?:الحواشي|Footnotes|المصادر(?:\s+والمراجع)?|المراجع|Sources|References)\s*[:：]?\s*$/i;
  var NARRATE = /(?:^|[.؛\s])(?:سأ[\u0600-\u06FF]+|الآن\s|Let me|Widget|The batch|I'll)/;
  var SEG_MARK = '\u2063\u2063';
  var CHAT_TAIL_EN = /\b(?:would you|do you|shall i|should i|want me|which (?:one|would)|let me know)\b/i;

  /*@3.NOIJ4.5*/
  var TURN_U = /^\s*(?:you asked|you said|you wrote|you|user|me|prompt|human|سؤالي|سؤالك|أنت|أنا|المستخدم)\s*[:：]?\s*$/i;
  var TURN_A = /^\s*(?:(gemini|chat\s?gpt|gpt[\w.-]*|claude|copilot|deepseek|grok|perplexity|mistral|le chat|meta ai|qwen|kimi|bard|assistant|ai|model)(?:\s+(?:response|responded|said|answered|answer|reply|replied|wrote))?|response|الردّ|الرد|المساعد)\s*[:：]?\s*$/i;
  var TURN_META = /^\s*(?:(?:message time|timestamp|time|date|exported(?: on| at)?|saved(?: on| at)?|created(?: on| at)?)\s*[:：]\s*\S.{0,60}|(?:from|source|المصدر)\s*[:：]\s*https?:\/\/\S+|(?:powered by|exported (?:with|by|using)|generated by)\s.{0,80}|\*?\(No content\)\*?)\s*$/i;
  var AI_NAME = { gemini: 'Gemini', chatgpt: 'ChatGPT', 'chat gpt': 'ChatGPT', claude: 'Claude', copilot: 'Copilot', deepseek: 'DeepSeek',
                  grok: 'Grok', perplexity: 'Perplexity', mistral: 'Mistral', 'le chat': 'Le Chat', 'meta ai': 'Meta AI', qwen: 'Qwen', kimi: 'Kimi', bard: 'Bard' };

  function allBold(rt) {
    return !!(rt && rt.length) && rt.every(function (x) { return x.b || !String(x.s || '').trim(); });
  }
  function turnOf(b) {
    if (!b || !b.rt || !b.rt.length) return null;
    var t = runsText(b.rt).trim(), m;
    if (!t || t.length > 60) {
      if (b.ty === 'p' && b.rt[0] && b.rt[0].b) {
        var lead = String(b.rt[0].s || '');
        var lm = lead.match(/^\s*(.{1,40}?)\s*[:：]\s*$/);
        if (lm && (TURN_U.test(lm[1]) || TURN_A.test(lm[1]))) {
          m = lm[1].match(TURN_A);
          return { k: TURN_U.test(lm[1]) ? 'u' : 'a', lead: lead.length, name: m && m[1] ? m[1].toLowerCase() : '' };
        }
      }
      return null;
    }
    if (b.ty !== 'h' && !(b.ty === 'p' && allBold(b.rt))) return null;
    if (TURN_U.test(t)) return { k: 'u', lead: 0 };
    m = t.match(TURN_A);
    if (m) return { k: 'a', lead: 0, name: m[1] ? m[1].toLowerCase() : '' };
    return null;
  }

  function thread(blocks, o, rep) {
    var nu = 0, na = 0, i, b, t;
    for (i = 0; i < blocks.length; i++) {
      t = turnOf(blocks[i]);
      if (t && t.k === 'u') nu++; else if (t && t.k === 'a') na++;
    }
    if (!nu || !na) return false;
    var out = [], cur = '', seg = 0;
    for (i = 0; i < blocks.length; i++) {
      b = blocks[i];
      t = turnOf(b);
      if (t) {
        cur = t.k; seg++;
        if (t.k === 'u') rep.asks++;
        else { rep.turns++; if (t.name && !rep.ai) rep.ai = AI_NAME[t.name.replace(/\s+/g, ' ')] || ''; }
        if (!t.lead) { rep.removed += letters(runsText(b.rt)); continue; }
        rep.removed += letters(b.rt[0].s);
        b.rt = dropLead(b.rt, t.lead);
        if (!b.rt.length) continue;
      }
      if ((b.ty === 'p' || b.ty === 'quote') && TURN_META.test(runsText(b.rt))) {
        rep.removed += letters(runsText(b.rt)); rep.meta++;
        continue;
      }
      if (cur === 'u') {
        if (!o.asks) { rep.removed += letters(blockText(b)); continue; }
        b.__q = 1;
        if (b.ty === 'p') b.ty = 'quote';
      }
      b.__s = seg;
      out.push(b);
    }
    blocks.splice.apply(blocks, [0, blocks.length].concat(out));
    return true;
  }

  var ROLES = [
    { k: 'idea', cal: 'note', ic: 'fa-lightbulb',
      re: /^\s*((?:الفكرة(?:\s+(?:الأساسيّة|الأساسية|الرئيسيّة|الرئيسية|الأهمّ|الأهم|المحوريّة|المحورية))?(?:\s+هنا)?)|Key idea|Main idea|Big idea|Core idea)\s*[:：]\s*/i },
    { k: 'pitfall', cal: 'warning', ic: 'fa-triangle-exclamation',
      re: /^\s*(أين يقع اللبس(?:\s+عادةً?)?|خطأ شائع|أخطاء شائعة|لبس شائع|احذر|انتبه|Common (?:mistakes?|pitfalls?|confusions?)|Pitfalls?|Watch out)\s*[:：؟?]\s*/i },
    { k: 'keep', cal: 'important', ic: 'fa-thumbtack',
      re: /^\s*(ما يجب أن يبقى في ذهنك(?:\s*\([^)]{1,60}\))?|تذكّر|تذكر|للتذكّر|للتذكر|Remember|Keep in mind|Key takeaways?)\s*[:：]\s*/i },
    { k: 'exam', cal: 'caution', ic: 'fa-bullseye',
      re: /^\s*(للامتحان|في الامتحان|نصيحةٌ?\s+للامتحان(?:\s*[—–-]\s*[^:：\n]{1,40})?|Exam tip|Exam focus|For the exam)\s*[:：]\s*/i },
    { k: 'extra', cal: 'tip', ic: 'fa-circle-plus',
      re: /^\s*(مثال\s*\(?\s*إضافيّ?[^:：\n]{0,40}|مثال من عندي|Extra example)\s*[:：]\s*/i },
    { k: 'summary', cal: 'important', ic: 'fa-list-check',
      re: /^\s*(الخلاصة|خلاصة القول|باختصار|الملخّص|الملخص|ملخّص|ملخص|In short|Summary|TL;DR|Bottom line)\s*[:：]\s*/i },
    { k: 'define', cal: 'note', ic: 'fa-book-open',
      re: /^\s*(تعريف|التعريف|Definition)\s*[:：]\s*/i },
    { k: 'rule', cal: 'important', ic: 'fa-scale-balanced',
      re: /^\s*(القاعدة|قاعدة|Rule)\s*[:：]\s*/i },
    { k: 'example', cal: 'tip', ic: 'fa-flask',
      re: /^\s*(مثالٌ?\s+محلول(?:\s*(?:[—–-]|\()[^:：\n]{0,40})?|مثال|مثلاً|مثلا|Example|Worked example|For example)\s*[:：]\s*/i }
  ];
  var THREAD = /^\s*(الخيط الرابط|Connecting thread)\s*[:：]/i;
  /*@3.NOIJ4.16*/
  var LABEL_RE = /^\s*(?:\d+[.)]\s*)?(الفكرة(?:\s+(?:الأساسيّة|الأساسية|الرئيسيّة|الرئيسية))?|مثالٌ?\s+محلول|أين يقع اللبس(?:\s+عادةً?)?|نصيحةٌ?\s+للامتحان|للامتحان|تذكّر|تذكر|الخلاصة)(?:\s*\([^)]{1,50}\))?\s*[؟?]?\s*$/;
  var LABEL_ROLE = [[/^الفكرة/, 'idea'], [/^مثال/, 'example'], [/^أين/, 'pitfall'], [/امتحان/, 'exam'], [/^تذك/, 'keep'], [/^الخلاصة/, 'summary']];
  var TERM_LINE = /^\s*([^:：\n]{2,70}?\([A-Za-z][^)\n]*\))\s*[:：]\s*\S/;
  var PAGE_RE = /^\s*(?:صفحة|الصفحة|شريحة|الشريحة|Slide|Page)\s*(\d{1,4})\s*[:：\-–—]\s*/i;
  var STEPS_RE = /خطو|مراحل|مرحلة|كيف|طريقة|آليّة|آلية|\bsteps?\b|\bstages?\b|\bprocess\b|\bhow\b/i;
  var COMPARE_RE = /مقابل|مقارنة|الفرق|الفروق|\bvs\.?\b|versus|compar|difference/i;
  var MERMAID = /^\s*(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(-v2)?|erDiagram|pie|mindmap|timeline|gantt|journey|quadrantChart)\b/;
  var GROUP_TONES = ['sky', 'emerald', 'violet', 'amber', 'rose'];

  /*@3.NOIJ4.8*/
  var PROS_RE = /^\s*(?:✅\s*)?(?:الإيجابيّات|الإيجابيات|الايجابيات|إيجابيّات|إيجابيات|المزايا|مزايا|الميزات|نقاط القوّة|نقاط القوة|Pros|Advantages|Benefits|Strengths)(?=[\s:：(]|$)\s*(?:\([^)]{0,40}\))?\s*[:：]?\s*$/i;
  var CONS_RE = /^\s*(?:❌\s*)?(?:السلبيّات|السلبيات|سلبيّات|سلبيات|العيوب|عيوب|نقاط الضعف|Cons|Disadvantages|Drawbacks|Weaknesses)(?=[\s:：(]|$)\s*(?:\([^)]{0,40}\))?\s*[:：]?\s*$/i;
  var TERM_RE = /^\s*([^:：\n]{2,60}?)\s*\(\s*([A-Za-z][^()\n]{0,60})\)\s*[:：]\s*\S/;
  var WHERE_RE = /^\s*(?:حيث|حيثُ|where)\s*[:：]?\s*$/i;
  var VAR_RE = /^\s*([A-Za-z\u0370-\u03FF][A-Za-z0-9_\u0370-\u03FF'\u2032]{0,8})\s*[:：=—–-]\s*(\S[\s\S]*)$/;
  var ERA_RE = /^\s*(\d{3,4}s?|\d{3,4}\s*[-–]\s*\d{2,4}|(?:عام|سنة|في)\s+\d{3,4}|القرن\s+\S+|(?:the\s+)?\d{1,2}(?:st|nd|rd|th)\s+century)\s*[:：—–-]\s*\S/i;
  var NUM_RE = /(?:^|[\s(])(\d[\d.,٫]*\s*[%٪]|\d[\d,.]{2,})/;
  var Q_RE = /^\s*(?:س\s*\d{0,2}|السؤال|سؤال|Q\s*\d{0,2}|Question)\s*[:：.)-]\s*\S/i;
  var A_RE = /^\s*(?:ج\s*\d{0,2}|الجواب|الإجابة|جواب|A\s*\d{0,2}|Answer)\s*[:：.)-]\s*\S/i;
  var MNEMO_RE = /^\s*(?:للحفظ|احفظها|مفتاح الحفظ|اختصار(?:ٌ|ها)?|Mnemonic|To remember)\s*[:：]\s*((?:[A-Z]\s*[·•.\-\s]\s*){1,7}[A-Z])\s*[—:=–-]\s*(.+)$/;
  function flatList(b) { return (b.items || []).every(function (it) { return !(it.lv > 0); }); }
  function boldHead(rt, n) {
    var p = splitAt(rt, n);
    return p[0].map(function (x) { return Object.assign({}, x, { b: 1 }); }).concat(p[1]);
  }
  /*@3.NOIJ4.29*/
  var REVIEW_RE = /^[^\p{L}\p{N}]{0,4}(?:\d{1,2}\s*[.)\-–]\s*)?(?:بطاق(?:ة|ةُ|ات)\s+(?:ال)?مراجع(?:ة|ةٍ)|Review\s+cards?|Flash\s*cards?|Quick\s+review)(?:\s*[—–\-:(（]\s*[^\n]{0,40})?\s*[:：]?\s*$/iu;
  var QA_Q = /^\s*(?:س\s*\d{0,2}|السؤال|سؤال|Q\s*\d{0,2}|Question)\s*[:：.)-]\s*/i;
  var QA_A = /(^|\s)(ج\s*\d{0,2}|الجواب|الإجابة|جواب|A\s*\d{0,2}|Answer)\s*[:：]\s*/i;
  function qaSplit(rt, lax) {
    var t = runsText(rt), m = t.match(QA_A), cut, lab = 0;
    if (m) { cut = m.index + m[1].length; lab = m[0].length - m[1].length; }
    else if (lax && t.indexOf('\n') > 0 && t.indexOf('\n') < t.length - 1) { cut = t.indexOf('\n'); lab = 1; }
    else return null;
    var p = splitAt(rt, cut), q = p[0], ql = (runsText(q).match(QA_Q) || [''])[0];
    var trim = function (r) { return r.map(function (x, n) { return n === r.length - 1 ? Object.assign({}, x, { s: x.s.replace(/\s+$/, '') }) : x; }).filter(function (x) { return x.s; }); };
    var a = trim(dropLead(p[1], lab));
    q = trim(dropLead(q, ql.length));
    if (!letters(runsText(q)) || !letters(runsText(a))) return null;
    return { q: q, a: a, moved: letters(ql) + letters(t.substr(cut, lab)) };
  }
  function reviewAt(blocks, i, rep) {
    var b = blocks[i];
    if (!b || !b.rt || (b.ty !== 'h' && b.ty !== 'p')) return 0;
    var ht = runsText(b.rt).replace(/\*\*/g, '').trim();
    if (!REVIEW_RE.test(ht) || (b.ty === 'p' && !(b.rt[0] && b.rt[0].b))) return 0;
    var pairs = [], used = 0, j = i + 1, nx = blocks[j], k, s, lax;
    if (nx && (nx.ty === 'ol' || nx.ty === 'ul')) {
      lax = true;
      for (k = 0; k < nx.items.length; k++) {
        var it = nx.items[k];
        if (it.lv > 0 && pairs.length && !pairs[pairs.length - 1].a) { pairs[pairs.length - 1].a = it.rt; continue; }
        if (it.lv > 0) return 0;
        s = qaSplit(it.rt, lax);
        if (s) pairs.push(s);
        else pairs.push({ q: dropLead(it.rt, (runsText(it.rt).match(QA_Q) || [''])[0].length), a: null, moved: 0 });
      }
      used = 1;
    } else {
      while (nx && (nx.ty === 'quote' || nx.ty === 'p') && nx.rt) {
        s = qaSplit(nx.rt, false);
        if (!s) break;
        pairs.push(s); used++; nx = blocks[j + used];
      }
    }
    if (pairs.length < 2 || pairs.some(function (x) { return !x.a; })) return 0;
    var dir = b.dir || (/[؀-ۿ]/.test(ht) ? 'rtl' : 'ltr');
    var head = Bk().blank('h', { lv: 3, fmt: 'recall', dir: dir, rt: [{ s: ht.replace(/^[^\p{L}\p{N}]+/u, '') }] });
    head.__rv = 1;
    if (b.__s) head.__s = b.__s;
    rep.moved += letters(runsText(b.rt)) - letters(runsText(head.rt));
    var out = [head];
    pairs.forEach(function (x) {
      var q = Bk().blank('p', { fmt: 'q', dir: dir, rt: x.q }), a = Bk().blank('p', { fmt: 'ans', dir: dir, rt: x.a });
      q.__rv = a.__rv = 1;
      if (b.__s) q.__s = a.__s = b.__s;
      rep.moved += x.moved || 0;
      out.push(q, a);
    });
    blocks.splice.apply(blocks, [i, 1 + used].concat(out));
    rep.review = (rep.review || 0) + 1;
    return out.length;
  }
  function reviewCards(blocks) {
    for (var i = 0; i < blocks.length; i++) {
      var h = blocks[i];
      if (!h.__rv || h.ty !== 'h') continue;
      var old = h.card, cid = 'v' + Bk().uid(), j = i;
      if (old && blocks[i - 1] && blocks[i - 1].card === old) blocks[i - 1].cardEnd = 1;
      while (j < blocks.length && blocks[j].__rv && (j === i || blocks[j].ty !== 'h')) {
        var x = blocks[j];
        x.card = cid; delete x.cardStart; delete x.cardTitle; delete x.cardEnd; delete x.cardTone;
        j++;
      }
      h.cardStart = 1; h.cardTitle = 1;
      blocks[j - 1].cardEnd = 1;
      if (old && blocks[j] && blocks[j].card === old && !blocks[j].cardStart) blocks[j].cardStart = 1;
      i = j - 1;
    }
  }
  function shapes(blocks, o, rep) {
    var i, b, t, nx, rv;
    rep.shapes = rep.shapes || {};
    var hit = function (k) { rep.shapes[k] = (rep.shapes[k] || 0) + 1; };
    for (i = 0; i < blocks.length; i++) {
      rv = reviewAt(blocks, i, rep);
      if (rv) { hit('review'); i += rv - 1; continue; }
      b = blocks[i]; nx = blocks[i + 1];
      if (b.ty === 'tbl' && b.rows && b.rows.length >= 2) {
        var hd = b.rows[0] || [];
        if (hd.length === 2 && PROS_RE.test(runsText(hd[0] && hd[0].rt)) && CONS_RE.test(runsText(hd[1] && hd[1].rt))) { b.st = 'pc'; hit('pc'); }
        else { b.st = 'cmp'; hit('cmp'); }
        continue;
      }
      if ((b.ty === 'p' || b.ty === 'h') && b.rt && nx && (nx.ty === 'ul' || nx.ty === 'ol')) {
        t = runsText(b.rt);
        var pc = PROS_RE.test(t) ? 'pros' : CONS_RE.test(t) ? 'cons' : '';
        if (pc) {
          if (b.ty === 'h') { b.ty = 'p'; delete b.lv; b.rt = b.rt.map(function (x) { return Object.assign({}, x, { b: 1 }); }); }
          b.fmt = pc; nx.fmt = pc; hit(pc); i++; continue;
        }
      }
      if (b.ty === 'p' && b.rt && b.rt[0] && b.rt[0].b) {
        t = runsText(b.rt);
        var tm = t.match(TERM_RE);
        if (tm && String(b.rt[0].s || '').length >= tm[1].length) { b.fmt = 'term'; hit('term'); continue; }
      }
      if (b.ty === 'math' && nx && nx.ty === 'p' && WHERE_RE.test(runsText(nx.rt)) && blocks[i + 2] && blocks[i + 2].ty === 'ul') {
        var vl = blocks[i + 2], items = [], ok = flatList(vl) && vl.items.length >= 2;
        for (var v = 0; ok && v < vl.items.length; v++) {
          var vt = runsText(vl.items[v].rt), vm = vt.match(VAR_RE);
          if (!vm) { ok = false; break; }
          var cut = vt.indexOf(vm[2]);
          var parts = splitAt(vl.items[v].rt, cut);
          var sym = splitAt(parts[0], vm[1].length + vt.indexOf(vm[1]))[0];
          items.push({ rt: sym.map(function (x) { var y = Object.assign({}, x); delete y.b; return y; }) }, { rt: parts[1], lv: 1 });
        }
        if (ok) {
          vl.ty = 'dl'; vl.items = items; vl.fmt = 'vars'; delete vl.mk; delete vl.mx; delete vl.start;
          hit('vars'); i += 2; continue;
        }
      }
      if (b.ty === 'code' && !b.dgm && nx && nx.ty === 'ol' && (nx.items || []).length >= 2) { nx.fmt = 'codenotes'; hit('codenotes'); i++; continue; }
      if ((b.ty === 'ul' || b.ty === 'ol') && flatList(b) && b.items.length >= 3 && b.items.length <= 12) {
        var eras = b.items.map(function (it) { return runsText(it.rt).match(ERA_RE); });
        if (eras.every(Boolean)) {
          b.items.forEach(function (it, q) { if (!(it.rt[0] && it.rt[0].b)) it.rt = boldHead(it.rt, runsText(it.rt).indexOf(eras[q][1]) + eras[q][1].length); });
          b.fmt = 'timeline'; hit('timeline'); continue;
        }
      }
      if (b.ty === 'ul' && flatList(b) && b.items.length >= 2 && b.items.length <= 8) {
        var nums = b.items.map(function (it) { var s = runsText(it.rt); return s.length <= 160 ? s.match(NUM_RE) : null; });
        var pct = nums.every(function (m) { return m && /[%٪]/.test(m[1]); });
        if (pct) {
          b.items.forEach(function (it, q) {
            var s = runsText(it.rt), at = s.indexOf(nums[q][1]);
            if (at === 0 && !(it.rt[0] && it.rt[0].b)) it.rt = boldHead(it.rt, nums[q][1].length);
          });
          b.fmt = 'nums'; hit('nums'); continue;
        }
      }
      if (b.ty === 'p' && b.rt && nx && nx.ty === 'p' && nx.rt && Q_RE.test(runsText(b.rt)) && A_RE.test(runsText(nx.rt))) {
        b.fmt = 'q'; nx.fmt = 'ans'; hit('qa'); i++; continue;
      }
      if (b.ty === 'p' && b.rt) {
        var mn = runsText(b.rt).match(MNEMO_RE);
        if (mn) {
          var lets = mn[1].replace(/[^A-Z]/g, '').split('');
          var words = mn[2].split(/\s*[·•،,\/|]\s*|\s+[-–]\s+/).map(function (w) { return w.trim(); }).filter(Boolean);
          if (lets.length >= 2 && lets.length === words.length) {
            var lab = runsText(b.rt).slice(0, runsText(b.rt).indexOf(mn[1])).replace(/[:：\s]+$/, '');
            var tbl = Bk().blank('tbl', { st: 'mnemo', dir: 'ltr', cols: lets.length,
              rows: [lets.map(function (x) { return { rt: [{ s: x }] }; }), words.map(function (w) { return { rt: [{ s: w }] }; })] });
            if (b.card) tbl.card = b.card;
            b.rt = [{ s: lab, b: 1 }];
            blocks.splice(i + 1, 0, tbl);
            hit('mnemo'); i++; continue;
          }
        }
      }
    }
  }

  /*@3.NOIJ4.9*/
  function recallCards(blocks, o, rep) {
    var out = [], grp = [], gTitle = '', i, b, titles = {}, en = false, rvIn = false;
    function cardTitle(cid) { return titles[cid] || ''; }
    function flush() {
      var qs = grp.filter(function (x) { return x.cal === 'warning' || x.cal === 'caution'; }), had = rvIn;
      grp = []; rvIn = false;
      if (qs.length < 2 || had) return;
      var cid = 'r' + Bk().uid(), e = en;
      var head = Bk().blank('h', { lv: 3, card: cid, cardStart: 1, cardTitle: 1, fmt: 'recall', dir: e ? 'ltr' : 'rtl',
        rt: [{ s: (e ? 'Self-check' : 'اختبرْ نفسك') + (gTitle ? ' — ' + gTitle : '') }] });
      out.push(head);
      rep.copied += letters(runsText(head.rt));
      qs.forEach(function (c) {
        var ct = cardTitle(c.card) || gTitle;
        var qt = c.cal === 'warning'
          ? (e ? 'Where’s the pitfall in “' + ct + '”?' : 'أين يقع اللبس في «' + ct + '»؟')
          : (e ? 'What does the exam ask about “' + ct + '”?' : 'ماذا يُسأل في الامتحان عن «' + ct + '»؟');
        var q = Bk().blank('p', { card: cid, fmt: c.cal === 'warning' ? 'qp' : 'qe', dir: e ? 'ltr' : 'rtl', rt: [{ s: qt }] });
        var a = Bk().blank('p', { card: cid, fmt: 'ans', dir: c.dir || (e ? 'ltr' : 'rtl'), rt: clone(c.rt) });
        out.push(q, a);
        rep.copied += letters(qt) + letters(runsText(a.rt));
      });
      var tone = qs[qs.length - 1].cardTone;
      if (tone) out.forEach(function (x) { if (x.card === cid) x.cardTone = tone; });
      out[out.length - 1].cardEnd = 1;
      rep.recallCards = (rep.recallCards || 0) + 1;
    }
    var lastS = null;
    for (i = 0; i < blocks.length; i++) {
      b = blocks[i];
      var sg = b.__s || 0;
      if ((b.ty === 'h' && !b.card && b.lv <= 2) || (b.ty === 'h' && b.lv === 1) || (b.cardStart && lastS !== null && sg !== lastS)) {
        flush(); gTitle = b.ty === 'h' ? runsText(b.rt).trim().slice(0, 80) : '';
      }
      if (b.cardStart || !b.card) lastS = sg;
      if (b.cardTitle && b.card) { titles[b.card] = runsText(b.rt).trim().slice(0, 80); if (!gTitle) gTitle = titles[b.card]; }
      if (b.ty === 'callout' && b.rt && b.rt.length) { grp.push(b); en = !/[\u0600-\u06FF]/.test(runsText(b.rt)); }
      if (b.__rv) rvIn = true;
      out.push(b);
    }
    flush();
    blocks.splice.apply(blocks, [0, blocks.length].concat(out));
  }

  function sniff(src) {
    var text = String((src && src.text) || '');
    var name = String((src && src.name) || '');
    var t = text.replace(/^\uFEFF/, '').trim();
    if (/^[\[{]/.test(t)) {
      var o = null;
      try { o = JSON.parse(t); } catch (e) { o = null; }
      if (o && typeof o === 'object') {
        var notes = null;
        if (o.format === 'garden-notes' && o.doc) notes = [{ title: o.title || '', doc: o.doc }];
        else if (o.format === 'garden-notes-bundle' && Array.isArray(o.notes)) {
          notes = o.notes.filter(function (n) { return n && n.doc; })
            .map(function (n) { return { title: n.title || '', doc: n.doc }; });
        } else if (Array.isArray(o.blocks)) notes = [{ title: '', doc: o }];
        if (notes && notes.length) {
          var study = !!o.appearance;
          if (!study) {
            var hits = 0;
            notes.forEach(function (n) {
              ((n.doc && n.doc.blocks) || []).forEach(function (b) {
                if (b && b.ty === 'p' && ROLES.some(function (r) { return r.k !== 'example' && r.re.test(runsText(b.rt)); })) hits++;
              });
            });
            study = hits >= 3;
          }
          return { kind: study ? 'study' : 'garden', name: name, raw: o, notes: notes,
                   course: String(o.course || '').replace(/-/g, ' '), app: o.appearance || null };
        }
      }
      return { kind: 'bad', name: name };
    }
    if (!t) return { kind: 'empty', name: name };
    var Mx = Md();
    var md = /\.(md|markdown)$/i.test(name) || (Mx && Mx.looksMarkdown && Mx.looksMarkdown(t));
    return { kind: (md && !(src && src.pasted)) ? 'md' : 'chat', name: name, text: t };
  }

  function normText(s, rep, o) {
    s = String(s).replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');
    /*@3.NOIJ4.10*/
    s = s.replace(/(\w)\\\[([^\]\n]*?)\\\]/g, '$1[$2]');
    s = s.replace(/^([ \t]*)\\\[[ \t]*\n([\s\S]+?)\n[ \t]*\\\][ \t]*$/gm, function (m, ind, x) { rep.math++; return ind + '$$\n' + x + '\n' + ind + '$$'; });
    s = s.replace(/\\\[[ \t]*([^\n]+?)[ \t]*\\\]/g, function (m, x) { rep.math++; return '$' + x + '$'; });
    s = s.replace(/\\\[\s*([\s\S]+?)\s*\\\]/g, function (m, x) { rep.math++; return '\n$$\n' + x + '\n$$\n'; });
    s = s.replace(/\\\(\s*([\s\S]+?)\s*\\\)/g, function (m, x) { rep.math++; return '$' + x + '$'; });
    /*@3.NOIJ4.11*/
    s = s.replace(/(^|[^$\\])\$ +([^$\n]*?[\\^_{}=<>][^$\n]*?) +\$(?!\$)/g, function (m, a, x) { rep.math++; return a + '$' + x + '$'; });
    s = s.replace(/(^|[^$\\\w])\$(-?\d[^$\n]{0,38}?)\$(?![\d$])/g, function (m, a, x) {
      if (!/^-?\d+(?:[.,]\d+)?$/.test(x) && !/[<>=+\-*/^_\\]/.test(x)) return m;
      return a + '${}' + x + '$';
    });
    /*@3.NOIJ4.12*/
    if (o && o.chatter) {
    s = s.replace(/^[ \t]*\*\*المصطلح[ \t]*\(Term\)[ \t]*[:：][ \t]*\*\*[ \t]*/gm, function (m) { rep.removed += letters(m); rep.stray++; return ''; });
    s = s.replace(/^[A-Z][a-z]{2} \d{1,2}, \d{4} · @\S+[ \t]*$/gm, function (m) { rep.removed += letters(m); rep.meta++; return ''; });
    s = s.replace(/^[ \t]*&#91;embedded content:[^\n]*$/gm, function (m) { rep.removed += letters(m); rep.meta++; return ''; });
    }
    s = s.replace(/^[ \t]*\*\*((?:صفحة|الصفحة|شريحة|الشريحة|Page|Slide)\s*\d+[^*\n]*)\*\*[ \t]*$/gim, function (m, t) {
      rep.pseudoH++; return '### ' + t.trim() + '\n';
    });
    /*@3.NOIJ4.17*/
    if (o && o.chatter && !/^#{1,3}[ \t]*(?:you asked|[\w .-]{2,30}\bresponse)[ \t]*$/im.test(s)) {
      s = s.replace(/\n[ \t]*\n[ \t]*\n+(?=[ \t]*(?:مرحب|أهل|Hi\b|Hello|Hey\b))/g, '\n\n' + SEG_MARK + '\n\n');
    }
    if (o && o.roles) {
      s = s.replace(/(^|\n[ \t]*\n)((?:صفحة|الصفحة|شريحة|الشريحة|Page|Slide)[ \t]*\d{1,4}[ \t]*[:：][^\n]{1,160})(?=\n)/g, function (m, a, t) {
        rep.pseudoH++; return a + '### ' + t.trim();
      });
      s = s.replace(/^- (الفكرة|الشرح|مثالٌ? محلول|أين يقع اللبس(?: عادةً?)?|نصيحةٌ? للامتحان):[ \t]*\n((?:(?:  )[^\n]*\n|[ \t]*\n)+)/gm, function (m, lab, body) {
        return '**' + lab + ':**\n' + body.replace(/^  /gm, '') + '\n';
      });
    }
    s = s.replace(/\n-{3,}[ \t]*\n(?=\s*#{1,6}\s)/g, '\n\n').replace(/\n-{3,}[ \t]*$/g, '\n');
    s = s.replace(/([^\n#\s])[ \t]*(#{1,6}[ \t]+(?:صفحة|الصفحة|شريحة|الشريحة|Page|Slide)[ \t]*\d{1,4}[ \t]*[:：])/gi, function (m, a, h) {
      rep.glued++; return a + '\n\n' + h;
    });
    return s;
  }

  function newRep() {
    return { before: 0, after: 0, removed: 0, moved: 0, runs: 0, cites: 0, stray: 0, chatter: 0,
             callouts: 0, roles: {}, quotes: 0, dl: 0, mermaid: 0, math: 0, pseudoH: 0,
             cards: 0, pages: 0, layouts: {}, recall: 0, dirs: 0, notes: 0,
             asks: 0, turns: 0, ai: '', meta: 0, glued: 0, plain: 0, copied: 0, shapes: {}, recallCards: 0 };
  }

  function tidyRuns(rt, pal, sizes, on, rep) {
    for (var i = 0; rt && i < rt.length; i++) {
      var r = rt[i], hit = 0;
      if (on) {
        if (r.ff) { delete r.ff; hit = 1; }
        if (r.fz && sizes[r.fz]) { delete r.fz; hit = 1; }
        if (r.fg && pal[String(r.fg).toLowerCase()]) { delete r.fg; hit = 1; }
      }
      if (typeof r.s === 'string') {
        var s = stripCites(r.s, rep);
        s = s.replace(/(^|[^*])\*\*(?!\*)/g, function (m, a) { rep.stray++; return a; });
        r.s = s;
      }
      rep.runs += hit;
    }
  }

  function enrich(doc, o, rep, fromText) {
    var C = caps(o), blocks = doc.blocks, i, b, t;
    var pal = {}, sizes = {};
    if (o.app) {
      (o.app.colors || []).forEach(function (c) { pal[String(c).toLowerCase()] = 1; });
      [o.app.body_size, o.app.heading_size, o.app.title_size].forEach(function (z) { if (z) sizes[z] = 1; });
    }
    for (i = 0; i < blocks.length; i++) {
      b = blocks[i];
      if (o.tidy && b.ff) delete b.ff;
      tidyRuns(b.rt, pal, sizes, o.tidy, rep);
      for (var j = 0; b.items && j < b.items.length; j++) tidyRuns(b.items[j].rt, pal, sizes, o.tidy, rep);
      for (var r = 0; b.rows && r < b.rows.length; r++) {
        for (var c = 0; c < b.rows[r].length; c++) tidyRuns(b.rows[r][c] && b.rows[r][c].rt, pal, sizes, o.tidy, rep);
      }
    }

    if (fromText && o.thread !== false) thread(blocks, o, rep);
    /*@3.NOIJ4.18*/
    if (fromText && blocks.some(function (x) { return x.ty === 'p' && runsText(x.rt).trim() === SEG_MARK; })) {
      var sgN = 0;
      for (i = 0; i < blocks.length; i++) {
        if (blocks[i].ty === 'p' && runsText(blocks[i].rt).trim() === SEG_MARK) { blocks.splice(i, 1); i--; sgN++; continue; }
        if (!blocks[i].__s) blocks[i].__s = sgN;
      }
      rep.replies = sgN + 1;
    }
    /*@3.NOIJ4.19*/
    if (o.roles || o.glossary) {
      for (i = 0; i < blocks.length; i++) {
        b = blocks[i];
        if (b.ty !== 'p' || !b.rt) continue;
        var lns = lineRuns(b.rt);
        if (lns.length < 2) continue;
        var cuts = [];
        for (var li = 1; li < lns.length; li++) {
          var lt = runsText(lns[li]);
          if (ROLES.some(function (r) { return r.k !== 'example' && r.re.test(lt); }) || (lns[li][0] && lns[li][0].b && TERM_LINE.test(lt))) cuts.push(li);
        }
        if (!cuts.length) continue;
        var parts2 = [], from = 0;
        cuts.concat([lns.length]).forEach(function (to) {
          var r2 = [];
          for (var q = from; q < to; q++) { if (q > from) r2.push({ s: '\n' }); r2.push.apply(r2, lns[q]); }
          if (runsText(r2).trim()) parts2.push(r2);
          from = to;
        });
        var nbs = parts2.map(function (r2, q) {
          var nb = q ? { ty: 'p' } : b;
          if (q) { if (b.dir) nb.dir = b.dir; if (b.__s) nb.__s = b.__s; }
          nb.rt = r2; return nb;
        });
        blocks.splice.apply(blocks, [i, 1].concat(nbs));
        i += nbs.length - 1;
      }
    }

    if (o.chatter) {
      var segFirst = {}, segLast = {}, sk, junk = {};
      for (i = 0; i < blocks.length; i++) {
        b = blocks[i]; sk = b.__s || 0;
        if ((b.ty === 'h' || b.ty === 'p') && TAIL_JUNK.test(runsText(b.rt).replace(/\*/g, '').trim())) junk[sk] = 1;
        if (b.__q || b.ty === 'hr' || b.ty === 'gap' || junk[sk]) continue;
        if (!(sk in segFirst)) segFirst[sk] = i;
        segLast[sk] = i;
      }
      for (i = blocks.length - 1; i >= 0; i--) {
        b = blocks[i];
        if (b.ty !== 'p' || b.__q || b.card && !fromText) continue;
        t = runsText(b.rt).trim();
        if (!t) continue;
        sk = b.__s || 0;
        if (t.length > 300) {
          var joins = (t.match(/[.؛](?=[\u0600-\u06FFA-Z])/g) || []).length;
          if (i === segFirst[sk] && joins >= 3 && NARRATE.test(t) && t.indexOf('\n') < 0) { rep.chatter++; rep.removed += letters(t); blocks.splice(i, 1); }
          continue;
        }
        var weak = i === segFirst[sk] && t.length <= 260 && CHAT_WEAK.test(t);
        var tail = i === segLast[sk] && segFirst[sk] !== i && /[؟?]\s*$/.test(t) && (CHAT_TAIL_AR.test(t) || CHAT_TAIL_EN.test(t));
        var bye = (i === segLast[sk] || i === segLast[sk] - 1) && CHAT_BYE.test(t);
        var emo = !/[\p{L}\p{N}]/u.test(t) && /\p{Extended_Pictographic}/u.test(t);
        if ((t.length <= 260 && CHAT_STRONG.test(t)) || weak || tail || bye || emo) {
          rep.chatter++; rep.removed += letters(t);
          blocks.splice(i, 1);
        }
      }
      for (i = blocks.length - 1; i > 0; i--) {
        if (blocks[i].ty === 'hr' && blocks[i - 1].ty === 'hr') blocks.splice(i, 1);
      }
      while (blocks.length && (blocks[blocks.length - 1].ty === 'hr' || blocks[blocks.length - 1].ty === 'gap')) blocks.pop();
      while (blocks.length && blocks[0].ty === 'hr') blocks.shift();
    }

    if (o.roles && C.calloutTitle) {
      for (i = 0; i < blocks.length - 1; i++) {
        b = blocks[i];
        var nb2 = blocks[i + 1];
        if (!b.rt || !nb2 || nb2.ty !== 'p' || !nb2.rt || !nb2.rt.length) continue;
        if (!((b.ty === 'h' && (Number(b.lv) || 2) >= 3) || (b.ty === 'p' && allBold(b.rt)))) continue;
        var lt2 = runsText(b.rt).replace(/[:：]\s*$/, '').trim(), lm2 = lt2.match(LABEL_RE);
        if (!lm2) continue;
        var rk = LABEL_ROLE.filter(function (x) { return x[0].test(lm2[1]); })[0], role = rk && ROLES.filter(function (r) { return r.k === rk[1]; })[0];
        if (!role) continue;
        rep.removed += letters((lt2.match(/^\d+[.)]\s*/) || [''])[0]);
        nb2.ty = 'callout'; nb2.cal = role.cal; nb2.ct = lt2.replace(/^\d+[.)]\s*/, '').replace(/\s*[؟?]$/, ''); nb2.ci = role.ic;
        rep.callouts++; rep.roles[role.k] = (rep.roles[role.k] || 0) + 1;
        blocks.splice(i, 1); i--;
      }
    }
    if (o.roles) {
      for (i = 0; i < blocks.length; i++) {
        b = blocks[i];
        var isCal = b.ty === 'callout' && !b.ct;
        if ((b.ty !== 'p' && !isCal) || !b.rt || !b.rt.length) continue;
        t = runsText(b.rt);
        if (!isCal && THREAD.test(t)) { b.ty = 'quote'; rep.quotes++; continue; }
        for (var k = 0; k < ROLES.length; k++) {
          var m = t.match(ROLES[k].re);
          if (!m) continue;
          var rest = t.slice(m[0].length).trim();
          if (!rest && ROLES[k].k === 'example') break;
          /*@3.NOIJ4.21*/
          if (!rest && !isCal && blocks[i + 1] && /^(?:ul|ol|dl|tbl|code|todo)$/.test(blocks[i + 1].ty)) break;
          if (!isCal) { b.ty = 'callout'; b.cal = ROLES[k].cal; }
          if (C.calloutTitle && rest) {
            b.ct = m[1].trim(); b.ci = ROLES[k].ic;
            b.rt = dropLead(b.rt, m[0].length);
          }
          rep.callouts++; rep.roles[ROLES[k].k] = (rep.roles[ROLES[k].k] || 0) + 1;
          break;
        }
      }
    }

    if (o.glossary) {
      for (i = 0; i < blocks.length; i++) {
        b = blocks[i];
        if (b.ty !== 'ul' || !b.items || b.items.length < 2) continue;
        var ok = b.items.every(function (it) {
          var s = runsText(it.rt), mm = s.match(/^(.{2,70}?)\s*[:：]\s+\S/);
          return mm && !(it.lv > 0) && ((it.rt[0] && it.rt[0].b) || /\([A-Za-z]/.test(mm[1]));
        });
        if (!ok) continue;
        var items = [];
        b.items.forEach(function (it) {
          var s = runsText(it.rt), cut = s.search(/[:：]/);
          var parts = splitAt(it.rt, cut), term = parts[0], def = parts[1];
          def = def.map(function (x, q) { return q === 0 ? Object.assign({}, x, { s: x.s.replace(/^[:：]\s*/, '') }) : x; })
                   .filter(function (x) { return x.s; });
          term = term.map(function (x) { return Object.assign({}, x, { b: 1 }); });
          items.push({ rt: term }, { rt: def, lv: 1 });
        });
        b.ty = 'dl'; b.items = items; delete b.mk; delete b.mx; delete b.start;
        rep.dl++;
      }
    }

    /*@3.NOIJ4.20*/
    if (o.glossary) {
      var isTerm = function (x) {
        if (!x || x.ty !== 'p' || !x.rt || !x.rt[0] || !x.rt[0].b || x.card) return null;
        var tt = runsText(x.rt), tm2 = tt.match(TERM_LINE);
        return tm2 && tt.indexOf('\n') < 0 && String(x.rt[0].s).length >= tt.search(/[:：]/) ? tm2 : null;
      };
      for (i = 0; i < blocks.length; i++) {
        var j2 = i;
        while (isTerm(blocks[j2])) j2++;
        if (j2 - i < 3) continue;
        var its = [];
        for (var g2 = i; g2 < j2; g2++) {
          var gt = runsText(blocks[g2].rt), gc = gt.search(/[:：]/);
          var gp = splitAt(blocks[g2].rt, gc);
          var gdef = gp[1].map(function (x, q) { return q === 0 ? Object.assign({}, x, { s: x.s.replace(/^[:：]\s*/, '') }) : x; }).filter(function (x) { return x.s; });
          its.push({ rt: gp[0].map(function (x) { return Object.assign({}, x, { b: 1 }); }) }, { rt: gdef, lv: 1 });
        }
        var dl = Bk().blank('dl', { items: its });
        if (blocks[i].dir) dl.dir = blocks[i].dir;
        if (blocks[i].__s) dl.__s = blocks[i].__s;
        blocks.splice(i, j2 - i, dl);
        rep.dl++;
      }
    }

    for (i = 0; i < blocks.length; i++) {
      b = blocks[i];
      if (b.ty === 'code' && !b.dgm && MERMAID.test(b.src || '')) { b.lang = 'mermaid'; b.dgm = 1; rep.mermaid++; }
      /*@3.NOIJ4.14*/
      else if (o.roles && b.ty === 'code' && /^(?:latex|tex|math|katex)$/i.test(b.lang || '') && (b.src || '').trim()) {
        b.ty = 'math'; b.tex = String(b.src).trim(); delete b.src; delete b.lang; rep.math++;
      }
    }

    if (o.shapes && C.fmt) shapes(blocks, o, rep);

    if (fromText && o.cards !== false && !blocks.some(function (x) { return x.card; })) buildCards(blocks, rep);
    if (rep.review && blocks.some(function (x) { return x.card; })) reviewCards(blocks);

    var cardIds = {}, order = [];
    for (i = 0; i < blocks.length; i++) {
      b = blocks[i];
      if (!b.card) continue;
      if (!cardIds[b.card]) { cardIds[b.card] = []; order.push(b.card); }
      cardIds[b.card].push(b);
    }
    rep.cards += order.length;

    order.forEach(function (id) {
      var cb = cardIds[id], head = cb[0];
      if (C.pageBadge && head.cardTitle && head.rt) {
        var ht = runsText(head.rt), pm = ht.match(PAGE_RE);
        if (pm && ht.slice(pm[0].length).trim()) {
          head.pg = parseInt(pm[1], 10);
          if (!head.dir && /\p{Script=Arabic}/u.test(pm[0])) { head.dir = 'rtl'; rep.dirs++; }
          rep.moved += letters(pm[0]);
          head.rt = unwrapParens(dropLead(head.rt, pm[0].length));
          rep.pages++;
        }
      }
      for (var q = 0; q < cb.length; q++) delete cb[q].cardLayout;
      if (!C.layout) return;
      var title = runsText(head.rt) + ' ' + (cb[1] && cb[1].ty === 'p' ? runsText(cb[1].rt) : '');
      var dls = cb.filter(function (x) { return x.ty === 'dl'; });
      var ols = cb.filter(function (x) { return x.ty === 'ol' && (x.items || []).filter(function (it) { return !(it.lv > 0); }).length >= 3; });
      var tbs = cb.filter(function (x) { return x.ty === 'tbl' && (x.rows || []).length >= 2; });
      var lay = '';
      if (dls.length && dls[0].items.length >= 6) lay = 'glossary';
      else if (tbs.length && COMPARE_RE.test(title)) lay = 'compare';
      else if (ols.length && STEPS_RE.test(title)) lay = 'sequence';
      if (lay) { head.cardLayout = lay; rep.layouts[lay] = (rep.layouts[lay] || 0) + 1; }
    });

    if (o.look !== 'raw') {
      var g = -1, cur = null, lastS = 0;
      for (i = 0; i < blocks.length; i++) {
        b = blocks[i];
        if ((b.ty === 'h' && !b.card && b.lv <= 2) || ((b.__s || 0) !== lastS && b.cardStart)) g++;
        lastS = b.__s || 0;
        if (!b.card) continue;
        if (b.cardStart) cur = o.look === 'group' ? (g < 0 ? 'grey' : GROUP_TONES[g % GROUP_TONES.length]) : 'auto';
        if (cur === 'auto') delete b.cardTone; else b.cardTone = cur;
        delete b.cardColor;
      }
      if (o.look === 'calm') doc.cards = Object.assign({}, doc.cards || {}, { t: ['white', 'grey'], fs: (doc.cards && doc.cards.fs) || 'md' });
      else if (doc.cards) { doc.cards = Object.assign({}, doc.cards); delete doc.cards.t; }
    }

    rep.recall += blocks.filter(function (x) { return x.ty === 'callout' && (x.cal === 'warning' || x.cal === 'caution'); }).length;
    if (o.recall && C.recall) recallCards(blocks, o, rep);
    /*@3.NOIJ4.26*/
    if (o.skin && SKIN_IDS[o.skin]) doc.cards = Object.assign({}, doc.cards || {}, { sk: o.skin });
    else if (o.skin === '' && doc.cards && doc.cards.sk) { doc.cards = Object.assign({}, doc.cards); delete doc.cards.sk; }

    /*@3.NOIJ4.4*/
    for (i = 0; i < blocks.length; i++) {
      b = blocks[i];
      delete b.__s; delete b.__q; delete b.__rv;
      if (b.dir || b.ty === 'code' || b.ty === 'math') continue;
      var ft = (b.ct || '') + prose(b.rt);
      if (!ft && b.items) ft = b.items.map(function (it) { return prose(it.rt); }).join(' ');
      var fm = ft.match(/[A-Za-z\u0600-\u06FF]/);
      if (fm && /[\u0600-\u06FF]/.test(fm[0])) { b.dir = 'rtl'; rep.dirs++; }
    }
    return doc;
  }

  /*@3.NOIJ4.6*/
  function lineRuns(rt) {
    var lines = [[]];
    for (var i = 0; i < rt.length; i++) {
      var parts = String(rt[i].s || '').split('\n');
      for (var k = 0; k < parts.length; k++) {
        if (k) lines.push([]);
        if (parts[k]) lines[lines.length - 1].push(Object.assign({}, rt[i], { s: parts[k] }));
      }
    }
    return lines;
  }
  function headLine(lr, sub) {
    var t = runsText(lr).trim();
    if (!t || !lr.length) return false;
    if (sub) return t.length <= 140 && !!lr[0].b && /[:：]$/.test(t);
    return (t.length <= 140 && allBold(lr) && !/[.؟?!]$/.test(t)) || (t.length <= 200 && PAGE_RE.test(t));
  }
  function pseudoHeads(seg, rep, lv, sub) {
    var out = [];
    for (var i = 0; i < seg.length; i++) {
      var b = seg[i];
      if (b.ty !== 'p' || b.__q || b.fmt || !b.rt || !b.rt.length) { out.push(b); continue; }
      var lines = lineRuns(b.rt), live = lines.filter(function (l) { return runsText(l).trim(); });
      if (!live.some(function (l) { return headLine(l, sub); })) { out.push(b); continue; }
      if (live.length === 1) { out.push(asHead(b, live[0], lv)); rep.pseudoH++; continue; }
      var buf = [], used = false;
      var flush = function () {
        while (buf.length && !runsText(buf[buf.length - 1]).trim()) buf.pop();
        while (buf.length && !runsText(buf[0]).trim()) buf.shift();
        if (!buf.length) return;
        var nb = used ? { ty: 'p' } : b;
        if (used) { if (b.dir) nb.dir = b.dir; if (b.__s) nb.__s = b.__s; }
        var r = [];
        buf.forEach(function (l, k) { if (k) r.push({ s: '\n' }); r.push.apply(r, l); });
        nb.rt = r; used = true;
        out.push(nb); buf = [];
      };
      for (var k = 0; k < lines.length; k++) {
        if (!headLine(lines[k], sub)) { buf.push(lines[k]); continue; }
        flush();
        var h = { ty: 'h' };
        if (b.dir) h.dir = b.dir;
        if (b.__s) h.__s = b.__s;
        out.push(asHead(h, lines[k], lv)); rep.pseudoH++;
      }
      flush();
    }
    return out;
  }
  function asHead(b, rt, lv) {
    b.ty = 'h'; b.lv = lv || 3;
    b.rt = rt.map(function (x) { var y = Object.assign({}, x); delete y.b; return y; }).filter(function (x) { return x.s; });
    var last = b.rt[b.rt.length - 1];
    if (last) last.s = last.s.replace(/\s*[:：]\s*$/, '');
    if (last && !last.s && b.rt.length > 1) b.rt.pop();
    return b;
  }

  function cardLevel(seg) {
    var cnt = {}, pg = {}, lv, i, b, best = 0, cardLv = 0, n = 0;
    for (i = 0; i < seg.length; i++) {
      b = seg[i];
      if (b.ty !== 'h' || b.__q) continue;
      lv = Number(b.lv) || 2; n++;
      cnt[lv] = (cnt[lv] || 0) + 1;
      if (PAGE_RE.test(runsText(b.rt))) pg[lv] = (pg[lv] || 0) + 1;
    }
    for (lv = 1; lv <= 6; lv++) if ((pg[lv] || 0) > best) { best = pg[lv]; cardLv = lv; }
    if (cardLv) return cardLv;
    for (lv = 2; lv <= 6; lv++) if ((cnt[lv] || 0) >= 2 && cnt[lv] > best) { best = cnt[lv]; cardLv = lv; }
    if (cardLv) return cardLv;
    for (lv = 2; lv <= 6; lv++) if (cnt[lv]) return lv;
    return (cnt[1] || 0) >= 2 ? 1 : 0;
  }

  function buildCards(blocks, rep) {
    var out = [], i = 0;
    while (i < blocks.length) {
      var s = blocks[i].__s || 0, seg = [];
      while (i < blocks.length && (blocks[i].__s || 0) === s) seg.push(blocks[i++]);
      var real = seg.some(function (x) { return x.ty === 'h' && !x.__q && (Number(x.lv) || 2) >= 2; });
      if (!real) seg = pseudoHeads(seg, rep, 3, false);
      var cardLv = cardLevel(seg), cur = null, prev = null;
      if (real && cardLv) seg = pseudoHeads(seg, rep, Math.min(cardLv + 1, 6), true);
      var close = function () { if (cur && prev) prev.cardEnd = 1; cur = null; prev = null; };
      for (var k = 0; k < seg.length; k++) {
        var b = seg[k];
        if (b.__q || b.ty === 'hr' || b.ty === 'gap' || b.ty === 'pb') { close(); continue; }
        var lv = b.ty === 'h' ? (Number(b.lv) || 2) : 0;
        var isPg = lv >= 2 && PAGE_RE.test(runsText(b.rt));
        if (lv && !isPg && (!cardLv || lv < cardLv)) { close(); continue; }
        if (lv && (lv === cardLv || isPg)) {
          close(); cur = 'c' + Bk().uid();
          b.cardStart = 1; b.cardTitle = 1; b.card = cur; prev = b;
          continue;
        }
        if (!cur && Bk().isEmptyBlock(b)) continue;
        if (!cur) { cur = 'c' + Bk().uid(); b.cardStart = 1; rep.plain++; }
        b.card = cur; prev = b;
      }
      close();
      for (k = 0; k < seg.length; k++) {
        if (seg[k].cardStart && seg[k].cardTitle && seg[k].cardEnd) {
          delete seg[k].card; delete seg[k].cardStart; delete seg[k].cardTitle; delete seg[k].cardEnd;
        }
      }
      out.push.apply(out, seg);
    }
    for (i = out.length - 2; i > 0; i--) {
      if (out[i].ty === 'hr' && out[i - 1].card && out[i + 1].card) out.splice(i, 1);
    }
    blocks.splice.apply(blocks, [0, blocks.length].concat(out));
  }

  function unwrapParens(rt) {
    var t = runsText(rt).trim();
    if (t.length < 3 || t.charAt(0) !== '(' || t.charAt(t.length - 1) !== ')') return rt;
    var d = 0;
    for (var i = 0; i < t.length; i++) {
      if (t.charAt(i) === '(') d++;
      else if (t.charAt(i) === ')') { d--; if (!d && i < t.length - 1) return rt; }
    }
    if (d) return rt;
    var r = rt.map(function (x) { return Object.assign({}, x); });
    var a = 0; while (a < r.length && !r[a].s.trim()) a++;
    var z = r.length - 1; while (z >= 0 && !r[z].s.trim()) z--;
    r[a].s = r[a].s.replace(/^\s*\(/, '');
    r[z].s = r[z].s.replace(/\)\s*$/, '');
    return r.filter(function (x) { return x.s; });
  }

  var DEF = {
    study: { look: 'calm', roles: true, glossary: true, tidy: true, chatter: true, recall: true, shapes: true },
    md: { look: 'calm', roles: true, glossary: true, tidy: true, chatter: true, recall: true, shapes: true },
    chat: { look: 'calm', roles: true, glossary: true, tidy: true, chatter: true, recall: true, shapes: true },
    garden: { look: 'raw', roles: false, glossary: false, tidy: false, chatter: false, recall: false }
  };
  function defaults(kind) { return Object.assign({}, DEF[kind] || DEF.md); }
  var PLAIN = { look: 'raw', roles: false, glossary: false, tidy: false, chatter: false, recall: false, shapes: false, cards: false, thread: false, asks: true };
  /*@3.NOIJ4.22*/
  var TIDY = { look: 'raw', roles: false, glossary: false, tidy: true, chatter: true, recall: false, shapes: false, cards: false, thread: true, asks: false };
  function modeOpts(kind, mode) { return mode === 'garden' ? defaults(kind) : Object.assign({}, mode === 'tidy' ? TIDY : PLAIN); }
  var AI_TUNED = { ChatGPT: 1, Gemini: 1, Claude: 1, Qwen: 1, DeepSeek: 1, Kimi: 1 };
  /*@3.NOIJ4.23*/
  var APPS = ['ChatGPT', 'Gemini', 'Claude', 'Qwen', 'DeepSeek', 'Kimi'];
  var APP_SIGN = [
    ['ChatGPT', /chatgpt-content-reference|utm_source=chatgpt\.com|:contentReference\[oaicite|chatgpt\.com\/(?:c|share)\//i],
    ['Gemini', /utm_source=gemini|gemini\.google\.com|\[cite(?:_start|_end)?[:\]]/i],
    ['DeepSeek', /chat\.deepseek\.com/i],
    ['Kimi', /kimi\.(?:ai|com)\//i],
    ['Qwen', /qwen\.(?:ai|com)\/|chat\.qwen/i],
    ['Claude', /claude\.ai\/|&#91;embedded content|Widget published|```latex/i]
  ];
  function detectApp(text) {
    var t = String(text || '');
    for (var i = 0; i < APP_SIGN.length; i++) if (APP_SIGN[i][1].test(t)) return APP_SIGN[i][0];
    return '';
  }
  var APP_HINT = {
    ChatGPT: ['تُزال علاماتُ الاستشهاد وتتبّعُ الروابط وقالبُ «المصطلح» المكرَّرُ قبل كلِّ تعريف.',
              'Citation markers (content-reference), link trackers and the “Term:” template are removed.'],
    Gemini: ['تسمياتُه المرقّمة («### 1. الفكرة») تصير تنبيهات، وتُزال خاتمةُ «هل ترغب…؟».',
             'Its numbered labels (“### 1. Key idea”) become callouts and the closing “Would you like…?” goes.'],
    Claude: ['سياجُ ```latex يصير معادلة، ويُزال سردُ الأدوات والتوقيع. ⚠️ ما كتبه في «مستندٍ» جانبيّ لا يصل بالرابط.',
             'A ```latex fence becomes an equation; tool narration and the byline are removed. ⚠️ Anything it wrote into a side “Doc” doesn’t come with the link.'],
    Qwen: ['تسمياتُه بنودَ قائمةٍ تصير تنبيهات، وأسطرُ الأدوار المتلاصقة تُفصل، و\\[…\\] في الجداول تبقى جداول.',
           'Its list-item labels become callouts, packed role lines are split, and \\[…\\] inside tables stays a table.'],
    DeepSeek: ['المعادلاتُ \\( \\) و\\[ \\] المُزاحةُ داخل القوائم تبقى في بنودها.',
               'Indented \\( \\) and \\[ \\] math inside lists stays in its items.'],
    Kimi: ['«بالتوفيق…» والخاتمةُ تُزالان، والتسمياتُ ذاتُ اللواحق («مثال محلول — حالة الفشل») تُقرأ كاملة.',
           '“Good luck…” and the closing go; suffixed labels (“Worked example — failure case”) are read in full.'],
    '': ['يُقرأ آلياً بالقواعد العامّة.', 'Read automatically with the general rules.']
  };

  function cleanTitle(s) {
    return String(s || '').replace(/\s*\uFFFD\s*/g, ' · ').replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  function convert(src, opts) {
    var s = (src && src.kind) ? src : sniff(src);
    var o = Object.assign(defaults(s.kind), opts || {});
    o.app = s.app || null;
    var rep = newRep(), notes = [];
    if (s.kind === 'study' || s.kind === 'garden') {
      s.notes.forEach(function (n) {
        var doc = clone(n.doc);
        rep.before += docLetters(doc);
        enrich(doc, o, rep, false);
        doc = Bk().normalize(doc);
        rep.after += docLetters(doc);
        notes.push({ title: cleanTitle(n.title), doc: doc });
      });
    } else if (s.kind === 'md' || s.kind === 'chat') {
      var Mx = Md();
      var base = { blocks: Mx.parse(String(s.text).replace(/\r\n?/g, '\n')) };
      rep.before = docLetters(base);
      var txt = normText(s.text, rep, o);
      if (o.chatter) txt = stripCites(txt, rep);
      var doc2 = { v: 1, blocks: Mx.parse(txt) };
      enrich(doc2, o, rep, true);
      doc2 = Bk().normalize(doc2);
      rep.after = docLetters(doc2);
      var h1 = doc2.blocks.filter(function (b) { return b.ty === 'h' && b.lv <= 2; })[0];
      var fn = (s.name || '').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      var h1t = h1 ? runsText(h1.rt) : '';
      if (TURN_U.test(h1t) || TURN_A.test(h1t)) h1t = '';
      var t = (rep.turns && fn) ? fn : (h1t || fn);
      notes.push({ title: cleanTitle(t), doc: doc2 });
    } else {
      return { kind: s.kind, notes: [], report: rep, src: s };
    }
    rep.notes = notes.length;
    rep.intact = rep.before === rep.after - rep.copied + rep.removed + rep.moved;
    return { kind: s.kind, notes: notes, report: rep, src: s, opts: o };
  }

  /*@3.NOIJ4.7*/
  var CARD_KEYS = ['card', 'cardStart', 'cardEnd', 'cardTitle', 'cardTone', 'cardColor', 'cardLayout', 'fmt'];
  var DERIVED = { recall: 1, qp: 1, qe: 1 };
  function format(doc, opts) {
    var o = Object.assign(defaults('md'), { look: 'raw' }, opts || {});
    o.app = null;
    var rep = newRep(), d = clone(doc || {}), all = Array.isArray(d.blocks) ? d.blocks : [];
    var lo = 0, hi = all.length - 1, i;
    if (o.ids && o.ids.length > 1) {
      var want = {};
      o.ids.forEach(function (x) { want[x] = 1; });
      lo = -1;
      for (i = 0; i < all.length; i++) if (want[all[i].id]) { if (lo < 0) lo = i; hi = i; }
      if (lo < 0) { lo = 0; hi = all.length - 1; }
    }
    var mid = all.slice(lo, hi + 1), free = [], flow = [], rc = {};
    mid.forEach(function (b) { if (b && DERIVED[b.fmt] && b.card) rc[b.card] = 1; });
    mid.forEach(function (b) {
      if (!b || (b.card && rc[b.card])) return;
      if (b.fp) { free.push(b); return; }
      for (var k = 0; k < CARD_KEYS.length; k++) delete b[CARD_KEYS[k]];
      flow.push(b);
    });
    var sub = { blocks: flow, cards: d.cards };
    rep.before = docLetters(sub);
    enrich(sub, o, rep, true);
    rep.after = docLetters(sub);
    d.blocks = all.slice(0, lo).concat(sub.blocks, free, all.slice(hi + 1));
    if (sub.cards) d.cards = sub.cards;
    d = Bk().normalize(d);
    rep.notes = 1;
    rep.intact = rep.before === rep.after - rep.copied + rep.removed + rep.moved;
    return { kind: 'doc', doc: d, notes: [{ title: '', doc: d }], report: rep, opts: o };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { try { return Number(n).toLocaleString(isEn() ? 'en-US' : 'ar-SA-u-nu-latn'); } catch (e) { return String(n); } }
  function span(ar, en) { return '<span data-ar="' + esc(ar) + '" data-en="' + esc(en) + '">' + esc(L(ar, en)) + '</span>'; }

  var KIND = {
    study: { ar: 'مادّةُ مذاكرةٍ مُعَدّة', en: 'Prepared study material', ic: 'fa-wand-magic-sparkles' },
    garden: { ar: 'ملاحظاتٌ صُدِّرت من هنا', en: 'Notes exported from here', ic: 'fa-file-lines' },
    md: { ar: 'مستندُ ماركداون', en: 'Markdown document', ic: 'fa-hashtag' },
    chat: { ar: 'نصٌّ منسوخ', en: 'Copied text', ic: 'fa-paste' },
    thread: { ar: 'محادثةٌ مصدَّرة', en: 'Exported conversation', ic: 'fa-comments' }
  };

  function statsHtml(res) {
    var r = res.report, h = '';
    function chip(n, ar, en, ok) {
      if (!n && !ok) return;
      h += '<span class="na-imp-st"' + (ok ? ' data-ok' : '') + '><b>' + (ok ? '<i class="fa-solid fa-check" aria-hidden="true"></i> ' : '') + num(n) + '</b> ' + span(ar, en) + '</span>';
    }
    chip(r.cards, 'بطاقة', 'cards');
    chip(r.pages, 'شارةَ صفحة', 'page badges');
    chip(r.callouts, 'فكرةً وتنبيهاً مؤطَّراً', 'framed ideas and cautions');
    chip(r.dl, 'مسرداً', 'glossaries');
    var shN = 0; Object.keys(r.shapes || {}).forEach(function (k) { shN += r.shapes[k]; });
    chip(shN, 'شكلاً خاصّاً (مقارنة · أرقام · تعريف…)', 'special layouts (comparison · figures · terms…)');
    chip(r.recallCards, 'بطاقةَ «اختبرْ نفسك»', '“Self-check” cards');
    chip(r.mermaid, 'مخطّطاً', 'diagrams');
    chip(r.asks, r.asks === 1 ? 'سؤالاً لك أُزيل' : 'أسئلةً لك أُزيلت', r.asks === 1 ? 'question of yours removed' : 'questions of yours removed');
    chip(r.chatter + r.cites + r.meta, 'عبارةً جانبيّةً أُزيلت', 'side remarks removed');
    chip(r.runs, 'تنسيقاً صار يتبع مظهرك', 'styles now follow your theme');
    if (r.intact) chip(r.after - (r.copied || 0) + r.moved, 'حرفاً محفوظاً كما كُتب', 'characters kept as written', true);
    return h;
  }

  function optsHtml(res, C) {
    var o = res.opts, r = res.report, h = '';
    function box(key, on, ar, en, sAr, sEn, off) {
      h += '<label' + (off ? ' data-off' : '') + '><input type="checkbox" data-imp-o="' + key + '"' +
        (on && !off ? ' checked' : '') + (off ? ' disabled' : '') + '><span>' + span(ar, en) +
        (sAr ? '<small data-ar="' + esc(sAr) + '" data-en="' + esc(sEn) + '">' + esc(L(sAr, sEn)) + '</small>' : '') +
        '</span></label>';
    }
    box('cards', o.cards !== false, 'اجعلِ الأقسامَ بطاقات', 'Turn sections into cards',
      'كلُّ عنوانٍ بطاقة، والمقدّمةُ بطاقةٌ أيضاً', 'Every heading a card — the intro too');
    if (r.asks || o.asks) {
      box('asks', !!o.asks, 'أبقِ أسئلتي في المحادثة', 'Keep my questions from the chat',
        'تبقى اقتباساً فاصلاً بين الردود', 'Kept as a quote between replies');
    }
    box('roles', o.roles, 'أطِّرِ الأفكارَ والتنبيهات', 'Frame key ideas and cautions',
      'الفكرة · أين يقع اللبس · تذكّر · للامتحان · الخلاصة', 'Key idea · Common confusion · Remember · For the exam · Summary');
    box('glossary', o.glossary, 'اجمعِ المصطلحاتِ في مسرد', 'Gather terms into a glossary',
      '«مصطلح: تعريف» ⇐ جدولٌ من عمودين', '“Term: definition” ⇒ a two-column table');
    box('shapes', o.shapes, 'أشكالٌ خاصّة', 'Special layouts',
      'مقارنات · إيجابيّات وسلبيّات · أرقام · تعريفات · رموزُ القوانين · خطٌّ زمنيّ', 'Comparisons · pros & cons · figures · terms · formula symbols · timelines');
    box('chatter', o.chatter, 'أزِلِ العباراتِ الجانبيّة', 'Remove side remarks',
      '«سأشرح لك…» · «هل تريد أن…» · أرقامُ المراجع', '“I’ll explain…” · “Would you like…” · reference markers');
    box('tidy', o.tidy, 'وحِّدِ الألوانَ والخطوطَ مع مظهرك', 'Match colours and fonts to your theme',
      'تتبع الثيماتِ الثلاثة وحجمَ خطِّك', 'Follows all three themes and your text size');
    var n = r.recall;
    box('recall', o.recall, 'بطاقةُ «اختبرْ نفسك» آخرَ كلِّ مجموعة', '“Self-check” card after each group',
      C.recall ? 'من «أين يقع اللبس» و«للامتحان» — ' + n : 'تصل مع التحديث القادم' + (n ? ' — ' + n + ' جاهزة' : ''),
      C.recall ? 'From “Common confusion” and “For the exam” — ' + n : 'Arrives with the next update' + (n ? ' — ' + n + ' ready' : ''),
      !C.recall || !n);
    return h;
  }

  function stage(pane) {
    var st = pane.querySelector('.na-imp-pv');
    if (!st) { st = G.document.createElement('div'); st.className = 'na-imp-pv'; pane.appendChild(st); }
    pane.setAttribute('data-imp-step', '1');
    return st;
  }
  function reset(pane) {
    if (!pane) return;
    var st = pane.querySelector('.na-imp-pv');
    if (st) st.parentNode.removeChild(st);
    pane.removeAttribute('data-imp-step');
  }

  function paste(pane, hooks) {
    var st = stage(pane);
    st.innerHTML =
      '<label class="na-imp-lbl" for="na-imp-ta">' + span('الصقْ محادثةً أو نصّاً', 'Paste a conversation or text') + '</label>' +
      '<textarea class="gsf-ta na-imp-ta" id="na-imp-ta" dir="auto" rows="9" data-ar-ph="الصقْ هنا ردَّ المحادثة أو الشرح…" data-en-ph="Paste the reply or explanation here…" placeholder="' +
        esc(L('الصقْ هنا ردَّ المحادثة أو الشرح…', 'Paste the reply or explanation here…')) + '"></textarea>' +
      '<p class="na-pg-hint">' + span('انسخِ الردَّ من صفحة المحادثة — بتحديده، أو بزرّ النسخ تحته — ثمّ الصقه هنا.',
        'Copy the reply from the chat page — select it, or use the copy button under it — then paste it here.') + '</p>' +
      '<p class="na-pg-hint" data-imp-msg role="status" hidden></p>' +
      '<div class="gsf-acts na-imp-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-imp-a="back">' + span('رجوع', 'Back') + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--go" data-imp-a="next"><i class="fa-solid fa-eye" aria-hidden="true"></i> ' + span('معاينة', 'Preview') + '</button>' +
      '</div>';
    var ta = st.querySelector('textarea');
    st.onclick = function (e) {
      var a = e.target.closest('[data-imp-a]');
      if (!a) return;
      if (a.getAttribute('data-imp-a') === 'back') { reset(pane); if (hooks && hooks.onBack) hooks.onBack(); return; }
      var v = ta.value;
      if (!v.trim()) { msg(st, L('لا نصَّ هنا بعد.', 'There’s no text here yet.')); ta.focus(); return; }
      preview(pane, { text: v, name: '', pasted: 1 }, hooks);
    };
    try { ta.focus(); } catch (e) {}
  }

  /*@3.NOIJ4.27*/
  var LINK_AI = { chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude', deepseek: 'DeepSeek', qwen: 'Qwen', kimi: 'Kimi' };
  function linkMd(r) {
    return (r.messages || []).map(function (m) {
      return (m.role === 'user' ? '# you asked' : '# ' + r.platform + ' response') + '\n\n' + m.md;
    }).join('\n\n---\n\n') + '\n';
  }
  function linkTitle(r) {
    var t = String(r.title || '').trim();
    if (!t) {
      var u = (r.messages || []).filter(function (m) { return m.role === 'user'; })[0];
      t = u ? String(u.md).replace(/\s+/g, ' ').trim().slice(0, 60) : '';
    }
    return t || (LINK_AI[r.platform] || 'AI');
  }
  /*@3.NOIJ4.28*/
  function linkErr(code, p) {
    var n = LINK_AI[p] || '';
    var E = {
      unsupported: ['هذا ليس رابطَ مشاركةٍ من ChatGPT أو Gemini أو Claude أو DeepSeek أو Qwen أو Kimi.',
                    'That isn’t a share link from ChatGPT, Gemini, Claude, DeepSeek, Qwen or Kimi.'],
      private: ['المحادثةُ غيرُ عامّة. من «مشاركة» اجعلْها «عامّةً لمن معه الرابط»' + (p === 'claude' ? ' (‏في Claude لا تخترْ «خاصّ»)' : '') + '، ثمّ انسخِ الرابطَ من جديد.',
                'The chat isn’t public. Under “Share”, make it “public to anyone with the link”' + (p === 'claude' ? ' (in Claude, not “Private”)' : '') + ', then copy the link again.'],
      not_found: ['لم نجد المحادثة — ربّما أُلغيت مشاركتُها أو حُذفت، أو الرابطُ ناقص.', 'Chat not found — sharing may have been turned off, it was deleted, or the link is incomplete.'],
      empty: ['المحادثةُ فارغة — لا ردودَ فيها.', 'The chat is empty — there are no replies in it.'],
      blocked: ['رفض ' + (n || 'الموقعُ') + ' القراءةَ الآن. جرّبْ بعد دقيقة، أو انسخِ الردَّ والصقه نصّاً.', (n || 'The site') + ' refused the read just now. Try again in a minute, or copy the reply and paste it as text.'],
      rate_limited: ['قرأتَ روابطَ كثيرةً في وقتٍ قصير — انتظرْ دقيقةً ثمّ أعِد.', 'Too many links in a short time — wait a minute and try again.'],
      off: ['القراءةُ بالرابط غيرُ متاحةٍ الآن. انسخِ الردَّ والصقه نصّاً، أو أعِدِ المحاولةَ لاحقاً.', 'Reading by link isn’t available right now. Copy the reply and paste it as text, or try again later.']
    };
    var e = E[code] || [(n || 'الموقعُ') + ' تأخّر في الردّ. أعِدِ المحاولة.', (n || 'The site') + ' was slow to answer. Try again.'];
    return L(e[0], e[1]);
  }
  function linkFetch(url) {
    var ep = G.GardenEndpoints && G.GardenEndpoints.sync;
    if (!ep || !G.fetch) return Promise.reject({ code: 'off' });
    return G.fetch(ep + '/v1/aishare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url }) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.ok && j && j.ok) return j;
          throw { code: j && j.error ? (j.error === 'not_found' && !j.platform ? 'off' : j.error) : 'off', platform: j && j.platform };
        });
      }, function () { throw { code: 'off' }; });
  }
  function link(pane, hooks) {
    var st = stage(pane);
    st.innerHTML =
      '<label class="na-imp-lbl" for="na-imp-url">' + span('رابطُ المحادثة', 'Chat link') + '</label>' +
      '<input class="gsf-in na-imp-url" id="na-imp-url" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://…">' +
      '<ol class="na-imp-steps">' +
        '<li>' + span('في صفحة المحادثة اضغطْ «مشاركة» ثمّ «انسخ الرابط» — من الحاسوب أو الجوّال أو تطبيق المنصّة.',
          'On the chat page tap “Share”, then “Copy link” — on a computer, a phone or the app.') + '</li>' +
        '<li>' + span('في Claude وحدَه: اخترْ «عامّ — لمن معه الرابط» لا «خاصّ». والبقيّةُ تعطي رابطاً عامّاً مباشرة.',
          'In Claude only: choose “Public — anyone with the link”, not “Private”. The others give a public link directly.') + '</li>' +
        '<li>' + span('الصقِ الرابطَ هنا. ويمكنك إلغاءُ المشاركة بعد الاستيراد.', 'Paste the link here. You can turn sharing off after importing.') + '</li>' +
      '</ol>' +
      '<p class="na-pg-hint na-imp-ais">ChatGPT · Gemini · Claude · DeepSeek · Qwen · Kimi</p>' +
      '<p class="na-pg-hint" data-imp-msg role="status" hidden></p>' +
      '<div class="gsf-acts na-imp-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-imp-a="back">' + span('رجوع', 'Back') + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-imp-a="md"><i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i> ' + span('ملفّ Markdown', 'Markdown file') + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--go" data-imp-a="next"><i class="fa-solid fa-eye" aria-hidden="true"></i> ' + span('اقرأْ وعايِنْ', 'Read and preview') + '</button>' +
      '</div>';
    var inp = st.querySelector('input'), got = null, busy = false;
    function run(act) {
      var raw = inp.value.trim();
      var m = raw.match(/https?:\/\/[^\s<>"'«»]+/i);
      if (!m) { msg(st, raw ? linkErr('unsupported') : L('الصقِ الرابطَ أوّلاً.', 'Paste the link first.')); inp.focus(); return; }
      var url = m[0];
      var go = function (r) {
        got = { url: url, r: r };
        var md = linkMd(r), title = linkTitle(r);
        if (act === 'md') {
          var a = G.document.createElement('a');
          a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
          a.download = title.replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) + '.md';
          G.document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          msg(st, L('حُفظ الملفّ.', 'File saved.'));
          return;
        }
        var miss = (r.notes || []).indexOf('claude_doc_missing') >= 0;
        if (miss && !st.hasAttribute('data-imp-warned')) {
          st.setAttribute('data-imp-warned', '1');
          msg(st, L('كتب Claude جزءاً من الشرح في «مستند» جانبيّ، والمشاركةُ لا تحمله — افتحْ المستندَ وانسخه. اضغطْ «اقرأْ وعايِنْ» مرّةً أخرى لتتابعَ بما وصل.',
            'Claude wrote part of the answer into a side “Doc”, which the share link doesn’t carry — open the Doc and copy it. Press “Read and preview” again to continue with what arrived.'));
          return;
        }
        preview(pane, { text: md, name: title, link: r.platform }, hooks);
      };
      if (got && got.url === url) { go(got.r); return; }
      if (busy) return;
      busy = true; st.setAttribute('aria-busy', 'true');
      msg(st, L('نقرأ المحادثة…', 'Reading the chat…'));
      linkFetch(url).then(function (r) { busy = false; st.removeAttribute('aria-busy'); msg(st, ''); go(r); },
        function (e) { busy = false; st.removeAttribute('aria-busy'); msg(st, linkErr(e && e.code, e && e.platform)); });
    }
    st.onclick = function (e) {
      var a = e.target.closest('[data-imp-a]');
      if (!a) return;
      var k = a.getAttribute('data-imp-a');
      if (k === 'back') { reset(pane); if (hooks && hooks.onBack) hooks.onBack(); return; }
      run(k);
    };
    inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); run('next'); } };
    try { inp.focus(); } catch (e) {}
  }

  function msg(st, t) {
    var m = st.querySelector('[data-imp-msg]');
    if (!m) return;
    m.hidden = !t; m.textContent = t || '';
  }

  var LOOKS = [['calm', 'هادئ', 'Calm'], ['group', 'لونٌ لكلِّ مجموعة', 'A colour per group'], ['raw', 'ألوانُ المصدر', 'Source colours']];
  var SKINS = [['', 'هادئ', 'Calm'], ['herbal', 'عشبي', 'Herbal'], ['cornell', 'كورنيل', 'Cornell'], ['journey', 'الرحلة', 'Journey']];
  var SKIN_IDS = { herbal: 1, cornell: 1, journey: 1 };
  function looksHtml(rawAr, rawEn) {
    return '<div class="na-imp-look"><span class="na-imp-lbl">' + span('الألوان', 'Colours') + '</span>' +
      '<div class="gsf-chips" role="group">' + LOOKS.map(function (t) {
        var ar = t[0] === 'raw' && rawAr ? rawAr : t[1], en = t[0] === 'raw' && rawEn ? rawEn : t[2];
        return '<button type="button" class="gsf-chip" data-imp-look="' + t[0] + '" aria-pressed="false">' + span(ar, en) + '</button>';
      }).join('') + '</div></div>' +
      '<div class="na-imp-look"><span class="na-imp-lbl">' + span('شكلُ الصفحة', 'Page style') + '</span>' +
      '<div class="gsf-chips" role="group">' + SKINS.map(function (t) {
        return '<button type="button" class="gsf-chip" data-imp-skin="' + t[0] + '" aria-pressed="false">' + span(t[1], t[2]) + '</button>';
      }).join('') + '</div></div>';
  }
  function moreHtml(res, C) {
    return '<details class="na-imp-more"><summary>' + span('خياراتٌ متقدّمة', 'Advanced options') + '</summary>' +
      '<div class="na-imp-opt" data-imp-opts>' + optsHtml(res, C) + '</div></details>';
  }

  function wire(st, s, o, C, run, paint, onAct, onMode) {
    var res = run();
    paint(res);
    st.onchange = function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-imp-o');
      if (!k) return;
      o[k] = !!e.target.checked;
      res = run(); paint(res);
    };
    st.onclick = function (e) {
      var md = onMode && e.target.closest('[data-imp-mode]');
      if (md) { onMode(md.getAttribute('data-imp-mode')); res = run(); paint(res); return; }
      var ap = e.target.closest('[data-imp-app]');
      if (ap) { o.__app = ap.getAttribute('data-imp-app'); paint(res); return; }
      var sk = e.target.closest('[data-imp-skin]');
      if (sk) { o.skin = sk.getAttribute('data-imp-skin'); res = run(); paint(res); return; }
      var lk = e.target.closest('[data-imp-look]');
      if (lk) { o.look = lk.getAttribute('data-imp-look'); res = run(); paint(res); return; }
      var a = e.target.closest('[data-imp-a]');
      if (a) onAct(a.getAttribute('data-imp-a'), res);
    };
  }
  function painter(st, o) {
    return function (res) {
      st.querySelector('[data-imp-stats]').innerHTML = statsHtml(res);
      [].forEach.call(st.querySelectorAll('[data-imp-skin]'), function (b) {
        var on = b.getAttribute('data-imp-skin') === (o.skin || '');
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      [].forEach.call(st.querySelectorAll('[data-imp-look]'), function (b) {
        var on = b.getAttribute('data-imp-look') === o.look;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      [].forEach.call(st.querySelectorAll('[data-imp-mode]'), function (b) {
        var on = b.getAttribute('data-imp-mode') === (o.__mode || 'plain');
        b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      var g = st.querySelector('[data-imp-g]');
      if (g) g.hidden = o.__mode !== 'garden';
      var pr = st.querySelector('[data-imp-p]');
      if (pr) {
        pr.hidden = !o.__mode || o.__mode === 'plain';
        var app = o.__app || '';
        [].forEach.call(pr.querySelectorAll('[data-imp-app]'), function (b) {
          var on = b.getAttribute('data-imp-app') === app;
          b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var hn = APP_HINT[app] || APP_HINT[''];
        var ph = pr.querySelector('[data-imp-phint]');
        ph.innerHTML = (app ? '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> ' + span('ملفُّ ' + app + ': ', app + ' profile: ') : '') + span(hn[0], hn[1]);
      }
      [].forEach.call(st.querySelectorAll('[data-imp-o]'), function (b) {
        var k = b.getAttribute('data-imp-o');
        if (!b.disabled) b.checked = k === 'cards' ? o.cards !== false : !!o[k];
      });
    };
  }

  function modeHtml(ai) {
    function opt(k, ic, ar, en, sAr, sEn) {
      return '<button type="button" class="gsf-opt" role="radio" aria-checked="false" data-imp-mode="' + k + '">' +
        '<i class="fa-solid ' + ic + '" aria-hidden="true"></i><span class="gsf-opt-t">' + span(ar, en) + '</span>' +
        '<span class="gsf-opt-s" data-ar="' + esc(sAr) + '" data-en="' + esc(sEn) + '">' + esc(L(sAr, sEn)) + '</span></button>';
    }
    return '<div class="gsf-opts gsf-opts--3 gsf-opts--wrap na-imp-mode" role="radiogroup" aria-label="' + esc(L('طريقةُ الاستيراد', 'How to import')) + '">' +
      opt('plain', 'fa-file-lines', 'كما هو', 'As is', 'حرفاً بحرف', 'Letter for letter') +
      opt('tidy', 'fa-broom', 'مرتَّب', 'Tidied', 'بلا أسئلتي ولا المجاملات ولا المراجع — دون بطاقات', 'Without my questions, pleasantries or references — no cards') +
      opt('garden', 'fa-wand-magic-sparkles', 'Garden كامل', 'Full Garden', 'بطاقاتٌ وتنبيهاتٌ ومسارد', 'Cards, callouts and glossaries') +
      '</div>' +
      /*@3.NOIJ4.24*/
      '<div class="na-imp-app" data-imp-p hidden>' +
        '<span class="na-imp-lbl">' + span('المصدر — يُكتشف وحدَه ويُغيَّر بنقرة', 'Source — detected automatically, change with a tap') + '</span>' +
        '<div class="gsf-chips" role="group">' + APPS.concat(['']).map(function (a) {
          return '<button type="button" class="gsf-chip" data-imp-app="' + a + '" aria-pressed="false">' + (a ? esc(a) : span('غيرُها', 'Other')) + '</button>';
        }).join('') + '</div>' +
        '<p class="na-pg-hint na-imp-ai" data-imp-phint></p>' +
      '</div>' +
      '<div class="na-imp-g" data-imp-g hidden>';
  }

  function preview(pane, src, hooks) {
    var hk = hooks || {};
    var s = sniff(src);
    var st = stage(pane);
    if (s.kind === 'bad' || s.kind === 'empty') {
      st.innerHTML = '<p class="na-pg-hint" data-s="error">' + (s.kind === 'bad'
        ? span('هذا الملفُّ ليس ملاحظاتٍ ولا مادّةَ مذاكرةٍ يمكن قراءتُها.', 'This file isn’t notes or study material that can be read.')
        : span('الملفُّ فارغ.', 'The file is empty.')) + '</p>' +
        '<div class="gsf-acts na-imp-acts"><button type="button" class="gsf-btn gsf-btn--ghost" data-imp-a="back">' + span('رجوع', 'Back') + '</button></div>';
      st.onclick = function (e) { if (e.target.closest('[data-imp-a="back"]')) { reset(pane); if (hk.onBack) hk.onBack(); } };
      return;
    }
    var C = caps(hk);
    var choose = s.kind !== 'garden';
    var o = choose ? modeOpts(s.kind, 'plain') : defaults(s.kind);
    o.__mode = choose ? 'plain' : '';
    o.skin = 'herbal';
    var first = convert(s, Object.assign({}, o, { core: C }));
    var r0 = choose ? convert(s, Object.assign(defaults(s.kind), { core: C })).report : first.report, ai0 = r0.ai;
    /*@3.NOIJ4.25*/
    if (r0.turns && r0.after < 12) {
      st.innerHTML = '<p class="na-pg-hint" data-s="error">' + span('المُصدِّرُ لم يلتقط نصَّ المحادثة — كلُّ ردٍّ فيه «(No content)». شارِكِ المحادثةَ برابطٍ واستوردْها من «رابطُ محادثة ذكاء».',
        'The exporter captured no text — every reply reads “(No content)”. Share the chat as a link and import it from “AI chat link”.') + '</p>' +
        '<div class="gsf-acts na-imp-acts"><button type="button" class="gsf-btn gsf-btn--ghost" data-imp-a="back">' + span('رجوع', 'Back') + '</button></div>';
      st.onclick = function (e) { if (e.target.closest('[data-imp-a="back"]')) { reset(pane); if (hk.onBack) hk.onBack(); } };
      return;
    }
    o.__app = AI_TUNED[ai0] ? ai0 : detectApp(s.text);
    var K = KIND[r0.turns ? 'thread' : s.kind];
    var kindAr = r0.turns && r0.ai ? 'محادثةٌ مع ' + r0.ai : K.ar, kindEn = r0.turns && r0.ai ? 'Conversation with ' + r0.ai : K.en;
    var meta = [];
    if (s.course) meta.push(s.course);
    if (first.notes.length > 1) meta.push(num(first.notes.length) + ' ' + L('ملاحظات', 'notes'));
    if (r0.turns) meta.push(num(r0.turns) + ' ' + L(r0.turns === 1 ? 'ردّ' : 'ردود', r0.turns === 1 ? 'reply' : 'replies'));
    var many = first.notes.length > 1;
    st.innerHTML =
      '<div class="na-imp-src"><span class="na-imp-badge"><i class="fa-solid ' + K.ic + '" aria-hidden="true"></i>' + span(kindAr, kindEn) + '</span>' +
        (meta.length ? '<span>' + esc(meta.join(' · ')) + '</span>' : '') + '</div>' +
      '<p class="na-imp-title" dir="auto"></p>' +
      (choose ? modeHtml(ai0) : '<div>') +
      looksHtml() +
      moreHtml(first, C) +
      '</div>' +
      '<div class="na-imp-stats" data-imp-stats></div>' +
      '<p class="na-pg-hint" data-imp-msg role="status" hidden></p>' +
      '<div class="gsf-acts na-imp-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-imp-a="back">' + span('رجوع', 'Back') + '</button>' +
        (hk.canAppend && !many ? '<button type="button" class="gsf-btn gsf-btn--ghost" data-imp-a="append">' + span('أضِفْ إلى المفتوحة', 'Add to the open note') + '</button>' : '') +
        '<button type="button" class="gsf-btn gsf-btn--go" data-imp-a="new"><i class="fa-solid fa-file-import" aria-hidden="true"></i> ' +
          (many ? span('أنشئ ' + first.notes.length + ' ملاحظات', 'Create ' + first.notes.length + ' notes') : span('أنشئ ملاحظة', 'Create a note')) + '</button>' +
      '</div>';
    st.querySelector('.na-imp-title').textContent = !many ? (first.notes[0].title || '') : (s.name || '');
    var n0 = 0;
    wire(st, s, o, C, function () { return n0++ ? convert(s, Object.assign({}, o, { core: C })) : first; }, painter(st, o), function (act, res) {
      if (act === 'back') { reset(pane); if (hk.onBack) hk.onBack(); return; }
      if (!res.notes.length) { msg(st, L('لا شيءَ للاستيراد.', 'Nothing to import.')); return; }
      if (hk.onDone) hk.onDone(res.notes, act === 'append' ? 'append' : 'new', res.report);
    }, choose ? function (m) {
      var keep = { core: o.core, __app: o.__app, skin: o.skin };
      Object.keys(o).forEach(function (k) { delete o[k]; });
      Object.assign(o, modeOpts(s.kind, m), keep, { __mode: m });
    } : null);
  }

  function formatPanel(host, ctx) {
    var cx = ctx || {};
    var C = caps(cx);
    var o = Object.assign(defaults('md'), { look: 'raw', ids: cx.ids || null, core: C });
    host.innerHTML =
      '<div class="na-imp-pv na-fmt-pv">' +
        (cx.ids ? '<p class="na-imp-src"><span class="na-imp-badge"><i class="fa-solid fa-object-group" aria-hidden="true"></i>' +
          span('المحدَّدُ وحدَه — ' + cx.ids.length + ' كتلة', 'Selection only — ' + cx.ids.length + ' blocks') + '</span></p>' : '') +
        '<div class="na-imp-stats" data-imp-stats></div>' +
        looksHtml('ألوانُ البطاقات أدناه', 'Card colours below') +
        '<div class="na-imp-opt" data-imp-opts></div>' +
        '<div class="gsf-acts na-imp-acts">' +
          '<button type="button" class="gsf-btn gsf-btn--ghost" data-imp-a="back">' + span('إلغاء', 'Cancel') + '</button>' +
          '<button type="button" class="gsf-btn gsf-btn--go" data-imp-a="apply"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ' + span('طبِّقْ على الصفحة', 'Apply to the page') + '</button>' +
        '</div>' +
      '</div>';
    var st = host.firstChild, first = null;
    var run = function () { var r = format(cx.getDoc(), o); if (!first) { first = r; st.querySelector('[data-imp-opts]').innerHTML = optsHtml(r, C); } return r; };
    wire(st, null, o, C, run, painter(st, o), function (act, res) {
      if (act === 'back') { if (cx.onCancel) cx.onCancel(); return; }
      if (act === 'apply' && cx.onApply) cx.onApply(res);
    });
  }

  var api = { sniff: sniff, convert: convert, format: format, preview: preview, paste: paste, link: link, reset: reset,
              formatPanel: formatPanel, defaults: defaults, modeOpts: modeOpts, letters: docLetters, ROLES: ROLES };
  G.GardenNotesImport = api;
  if (typeof module === 'object' && module && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
