;(function () {
  'use strict';

  var LEARN_KEY = 'notes_modlearn';
  var MAX_M = 30;

  var AR_ONES = [
    [/^(الاول|الاولي|الاوله|اول|اولي)$/, 1], [/^(الثاني|الثانيه|ثاني|ثانيه)$/, 2], [/^(الثالث|الثالثه|ثالث|ثالثه)$/, 3],
    [/^(الرابع|الرابعه|رابع|رابعه)$/, 4], [/^(الخامس|الخامسه|خامس|خامسه)$/, 5], [/^(السادس|السادسه|سادس|سادسه)$/, 6],
    [/^(السابع|السابعه|سابع|سابعه)$/, 7], [/^(الثامن|الثامنه|ثامن|ثامنه)$/, 8], [/^(التاسع|التاسعه|تاسع|تاسعه)$/, 9],
    [/^(العاشر|العاشره|عاشر|عاشره)$/, 10], [/^(الحادي|الحاديه|حادي|حاديه)$/, 1]
  ];
  var EN_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
    eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15 };

  var KINDS = [
    { k: 'm', en: /^(m|mod|module|modules|unit|ch|chap|chapter)$/, ar: /^(الوحده|وحده|الفصل|فصل)$/ },
    { k: 'w', en: /^(w|wk|week|weeks)$/, ar: /^(الاسبوع|اسبوع)$/ },
    { k: 'l', en: /^(l|lec|lect|lecture|lectures)$/, ar: /^(المحاضره|محاضره)$/ }
  ];
  var STOP = { the: 1, and: 1, for: 1, with: 1, from: 1, into: 1, part: 1, lecture: 1, module: 1, week: 1, chapter: 1, unit: 1,
    intro: 0, slides: 1, notes: 1, course: 1, 'في': 1, 'من': 1, 'الى': 1, 'علي': 1, 'عن': 1, 'مع': 1, 'الوحده': 1, 'المحاضره': 1 };

  function fold(s) {
    var t = String(s == null ? '' : s);
    if (window.GardenPdfText && GardenPdfText.fold) return GardenPdfText.fold(t);
    t = t.replace(/[٠-٩]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x0660 + 48); })
         .replace(/[۰-۹]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x06F0 + 48); })
         .replace(/[ً-ٰٟـ]/g, '')
         .replace(/[آأإٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
    return t.toLowerCase();
  }

  function words(s, code) {
    var t = fold(s);
    if (code) {
      var m = /^([a-z]+)(\d+)$/i.exec(String(code));
      if (m) t = t.replace(new RegExp(m[1].toLowerCase() + '\\s*-?\\s*' + m[2], 'g'), ' ');
    }
    t = t.replace(/\.[a-z0-9]{1,5}$/, ' ')
         .replace(/([a-z؀-ۿ])(\d)/g, '$1 $2').replace(/(\d)([a-z؀-ۿ])/g, '$1 $2')
         .replace(/[^a-z0-9؀-ۿ]+/g, ' ');
    return t.split(' ').filter(Boolean);
  }

  function numAt(w, i) {
    var a = w[i];
    if (a == null) return 0;
    if (/^\d{1,2}$/.test(a)) return +a;
    if (EN_WORDS[a]) return EN_WORDS[a];
    for (var k = 0; k < AR_ONES.length; k++) {
      if (AR_ONES[k][0].test(a)) {
        var n = AR_ONES[k][1];
        if (/^(عشر|عشره)$/.test(w[i + 1] || '')) n += 10;
        return n;
      }
    }
    return 0;
  }

  function fromWords(w) {
    var best = null;
    for (var i = 0; i < w.length; i++) {
      for (var j = 0; j < KINDS.length; j++) {
        var K = KINDS[j];
        if (!(K.en.test(w[i]) || K.ar.test(w[i]))) continue;
        var n = numAt(w, i + 1);
        if (!(n > 0 && n <= MAX_M)) continue;
        if (!best || (K.k === 'm' && best.kind !== 'm')) best = { kind: K.k, n: n };
      }
    }
    return best;
  }

  function fromName(name, code) { return fromWords(words(name, code)); }

  function toks(s) {
    return words(s).filter(function (x) { return x.length >= 3 && !STOP[x] && !/^\d+$/.test(x); });
  }

  function fromTitle(text, titles) {
    var head = toks(String(text || '').slice(0, 600)), set = {};
    head.forEach(function (x) { set[x] = 1; });
    if (!head.length || !titles) return null;
    var best = null, second = 0;
    Object.keys(titles).forEach(function (m) {
      var t = titles[m] || {}, sc = 0;
      [t.en, t.ar].forEach(function (s) {
        var tt = toks(s);
        if (!tt.length) return;
        var hit = tt.filter(function (x) { return set[x]; }).length;
        var v = hit / tt.length;
        if (hit >= Math.min(2, tt.length) && v > sc) sc = v;
      });
      if (!sc) return;
      if (!best || sc > best.score) { second = best ? best.score : second; best = { m: +m, score: sc }; }
      else if (sc > second) second = sc;
    });
    if (!best || best.score < 0.6 || best.score - second < 0.15) return null;
    return best;
  }

  function learnAll() {
    try { var o = JSON.parse(localStorage.getItem(LEARN_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; }
    catch (e) { return {}; }
  }
  function learn(code, hit, m) {
    if (!code || !hit || hit.kind === 'm' || !(+m > 0)) return;
    var o = learnAll();
    o[code] = o[code] || {};
    o[code][hit.kind] = { off: (+m) - hit.n, at: Date.now() };
    try { localStorage.setItem(LEARN_KEY, JSON.stringify(o)); } catch (e) {}
  }
  function learned(code, hit) {
    var o = learnAll(), c = o[code];
    return (c && hit && c[hit.kind] && isFinite(c[hit.kind].off)) ? c[hit.kind].off : null;
  }

  function pick(a) {
    a = a || {};
    var code = a.code || '', count = +a.count > 0 ? +a.count : MAX_M;
    var ok = function (m) { return m > 0 && m <= count; };
    var hn = fromName(a.name || '', code);
    if (hn && hn.kind === 'm' && ok(hn.n)) return { m: hn.n, why: 'name' };
    var ht = a.text ? fromWords(words(String(a.text).slice(0, 300), code)) : null;
    if (ht && ht.kind === 'm' && ok(ht.n)) return { m: ht.n, why: 'text' };
    var tt = a.text ? fromTitle(a.text, a.titles) : null;
    if (tt && ok(tt.m)) return { m: tt.m, why: 'title' };
    var h = hn || ht;
    if (h) {
      var off = learned(code, h);
      if (off != null && ok(h.n + off)) return { m: h.n + off, why: 'learn', hit: h };
      if (ok(h.n)) return { m: h.n, why: 'guess', hit: h };
    }
    return null;
  }

  function hitOf(name, code, text) {
    var h = fromName(name || '', code);
    if (h) return h;
    return text ? fromWords(words(String(text).slice(0, 300), code)) : null;
  }

  function firstText(src) {
    if (!src || !window.GardenPdfView || !GardenPdfView.load) return Promise.resolve('');
    var data = src;
    var p = (typeof Blob !== 'undefined' && src instanceof Blob) ? src.arrayBuffer() : Promise.resolve(src);
    return p.then(function (buf) {
      data = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
      return GardenPdfView.load(data);
    }).then(function (doc) {
      var pdf = doc && doc.getPage ? doc : (doc && (doc.doc || doc.pdf)) || null;
      if (!pdf) return '';
      return pdf.getPage(1).then(function (pg) { return pg.getTextContent(); }).then(function (tc) {
        var s = (tc.items || []).map(function (it) { return it.str || ''; }).join(' ').slice(0, 1200);
        try { if (pdf.destroy) pdf.destroy(); } catch (e) {}
        return s;
      });
    })['catch'](function () { return ''; });
  }

  function label(r, L) {
    if (!r) return '';
    var why = { name: L('من الاسم', 'from name'), text: L('من الصفحة الأولى', 'from page one'),
      title: L('من عنوان الملفّ', 'from the file’s title'), learn: L('ممّا صحّحتَه قبل', 'from your earlier fix'),
      guess: L('تخمين', 'a guess') };
    return why[r.why] || '';
  }

  window.GardenModGuess = { pick: pick, fromName: fromName, fromTitle: fromTitle, hitOf: hitOf, learn: learn,
                            firstText: firstText, label: label, _words: words };
})();
