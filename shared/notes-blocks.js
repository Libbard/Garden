/*@3.NOBJ.1*/
;(function () {
  'use strict';

  var MARKS = { b: 'b', i: 'i', u: 'u', st: 's', c: 'code', sb: 'sub', sp: 'sup' };

  var uidN = 0;
  function uid(p) {
    uidN += 1;
    return (p || 'b') + Date.now().toString(36) + uidN.toString(36);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /*@3.NOBJ.2*/
  /*@3.NOBJ.31*/
  var STICKY_TONES = ['amber', 'lime', 'sky', 'pink', 'violet', 'slate'];
  /*@3.NOBJ.33*/
  var SHAPES = ['sticky', 'rect', 'rrect', 'ell', 'tri', 'diam', 'star', 'hex',
                'arrow', 'line', 'callout', 'check', 'cross', 'plus', 'cloud', 'brace', 'sticker'];
  var SHAPE_TONES = ['ink', 'red', 'sky', 'emerald', 'amber', 'violet',
                     'orange', 'pink', 'teal', 'indigo', 'lime', 'rose', 'black'];

  function httpsOnly(u) {
    var s = String(u == null ? '' : u).trim();
    return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s : '';
  }

  /*@3.NOBJ.27*/
  var LOCAL_RE = /^byte-local:[0-9a-f]{24}$/;
  function localImg(u) {
    var s = String(u == null ? '' : u).trim();
    return LOCAL_RE.test(s) ? s : '';
  }
  function imgSrc(u) {
    return httpsOnly(u) || localImg(u);
  }

  /*@3.NOBJ.47*/
  function dataDims(url) {
    var m = /^data:image\/[a-z0-9.+-]+;base64,/i.exec(url || '');
    if (!m) return null;
    var s;
    var b64 = url.slice(m[0].length, m[0].length + 262144).replace(/[^A-Za-z0-9+/]/g, '');
    try { s = atob(b64.slice(0, b64.length - (b64.length % 4))); }
    catch (eD) { return null; }
    var u = function (i) { return s.charCodeAt(i) & 255; };
    var be16 = function (i) { return (u(i) << 8) | u(i + 1); };
    var le16 = function (i) { return u(i) | (u(i + 1) << 8); };
    var w = 0, h = 0, i;
    if (s.length > 24 && s.slice(1, 4) === 'PNG') { w = (be16(16) << 16) | be16(18); h = (be16(20) << 16) | be16(22); }
    else if (s.slice(0, 3) === 'GIF') { w = le16(6); h = le16(8); }
    else if (s.slice(0, 4) === 'RIFF' && s.slice(8, 12) === 'WEBP') {
      var c = s.slice(12, 16);
      if (c === 'VP8 ') { w = le16(26) & 0x3fff; h = le16(28) & 0x3fff; }
      else if (c === 'VP8L') { var b0 = u(21), b1 = u(22), b2 = u(23), b3 = u(24); w = 1 + (((b1 & 0x3f) << 8) | b0); h = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)); }
      else if (c === 'VP8X') { w = 1 + (u(24) | (u(25) << 8) | (u(26) << 16)); h = 1 + (u(27) | (u(28) << 8) | (u(29) << 16)); }
    } else if (u(0) === 0xff && u(1) === 0xd8) {
      for (i = 2; i + 9 < s.length;) {
        if (u(i) !== 0xff) { i++; continue; }
        var mk = u(i + 1);
        if (mk === 0xff) { i++; continue; }
        if (mk === 0xd8 || mk === 0x01 || (mk >= 0xd0 && mk <= 0xd7)) { i += 2; continue; }
        if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) { h = be16(i + 5); w = be16(i + 7); break; }
        if (mk === 0xda || mk === 0xd9) break;
        i += 2 + be16(i + 2);
      }
    }
    return (w > 0 && h > 0) ? { w: w, h: h } : null;
  }

  /*@3.NOBJ.16*/
  function normUrl(u) {
    var s = String(u == null ? '' : u).trim();
    if (!s) return '';
    if (/^https:\/\//i.test(s)) return httpsOnly(s);
    if (/^http:\/\//i.test(s)) return httpsOnly('https://' + s.slice(7));
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return '';
    return httpsOnly('https://' + s);
  }

  /*@3.NOBJ.11*/
  var AR = '؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿';
  /*@3.NOBJ.49*/
  var BIDI_RUN = new RegExp('(?:[0-9]+(?:[.,][0-9]+)*)?[A-Za-z](?:[^' + AR + '<>&]*[^\\s' + AR + '<>&])?', 'g');

  /*@3.NOBJ.24*/
  var PAIR = { '(': ')', '[': ']', '{': '}',
               '\u00ab': '\u00bb', '\u201c': '\u201d', '\u2039': '\u203a' };
  var SHUT = (function () {
    var m = {}, k;
    for (k in PAIR) if (Object.prototype.hasOwnProperty.call(PAIR, k)) m[PAIR[k]] = k;
    return m;
  })();

  function evenPair(s, open, shut) {
    var d = 0, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      if (c === open) d++;
      else if (c === shut) { d--; if (d < 0) return false; }
    }
    return d === 0;
  }

  /*@3.NOBJ.25*/
  var TAIL_PUNCT = ':;,.!?،؛؟…';

  function pairSpan(txt, a, b) {
    var ch;
    while (b > a + 1) {
      ch = txt.charAt(b - 1);
      /*@3.NOBJ.50*/
      if (ch === ' ' || ch === '\u2013' || ch === '\u2014') { b--; continue; }
      if (TAIL_PUNCT.indexOf(ch) >= 0) { b--; continue; }
      if ((ch === '"' || ch === QUOT_MARK) && (txt.slice(a, b).split(ch).length - 1) % 2) { b--; continue; }
      if (SHUT[ch] && !evenPair(txt.slice(a, b), SHUT[ch], ch)) { b--; continue; }
      if (PAIR[ch] && !evenPair(txt.slice(a, b), ch, PAIR[ch])) { b--; continue; }
      break;
    }
    return [a, b];
  }

  function wrapRuns(txt) {
    BIDI_RUN.lastIndex = 0;
    var out = '', at = 0, m, sp, a, b;
    while ((m = BIDI_RUN.exec(txt)) !== null) {
      sp = pairSpan(txt, m.index, m.index + m[0].length);
      a = sp[0] < at ? at : sp[0];
      b = sp[1];
      var op = txt.charAt(a - 1);
      if (a - 1 >= at && PAIR[op] && txt.slice(a, b).indexOf(PAIR[op]) >= 0 && !evenPair(txt.slice(a, b), op, PAIR[op])) a--;
      if (b <= a) continue;
      out += txt.slice(at, a) + '<bdi>' + txt.slice(a, b) + '</bdi>';
      at = b;
      BIDI_RUN.lastIndex = b;
    }
    return out + txt.slice(at);
  }

  /*@3.NOBJ.45*/
  var ENT_RE = /&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,9});/g;
  var ENT_MARK = '\ufffc';
  var QUOT_MARK = '\ue0f0';
  var ENT_MARK_G = /[\ufffc\ue0f0]/g;

  function wrapText(chunk) {
    if (!chunk) return '';
    if (chunk.indexOf('&') < 0 || chunk.indexOf(ENT_MARK) >= 0 || chunk.indexOf(QUOT_MARK) >= 0) return wrapRuns(chunk);
    var ents = [], k = 0;
    var flat = chunk.replace(ENT_RE, function (e) { ents.push(e); return e === '&quot;' ? QUOT_MARK : ENT_MARK; });
    if (!ents.length) return wrapRuns(chunk);
    return wrapRuns(flat).replace(ENT_MARK_G, function () { return ents[k++]; });
  }

  function isolate(html) {
    var out = '', i = 0, lt, gt;
    while (i < html.length) {
      lt = html.indexOf('<', i);
      if (lt < 0) { out += wrapText(html.slice(i)); break; }
      out += wrapText(html.slice(i, lt));
      gt = html.indexOf('>', lt);
      if (gt < 0) { out += html.slice(lt); break; }
      if (html.slice(lt, lt + 20) === '<span class="ne-im" ') {
        var shut = html.indexOf('</span>', gt);
        if (shut < 0) shut = html.length - 7;
        out += html.slice(lt, shut + 7);
        i = shut + 7;
        continue;
      }
      out += html.slice(lt, gt + 1);
      i = gt + 1;
    }
    return out;
  }

  /*@3.NOBJ.10*/
  function hexVar(name, v) {
    var s = String(v == null ? '' : v).trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(s) ? ' style="' + name + ':' + s + '"' : '';
  }

  function runsToHtml(rt) {
    if (!Array.isArray(rt) || !rt.length) return '';
    return rt.map(function (r) {
      /*@3.NOBJ.8*/
      var txt = esc(r.s == null ? '' : r.s).replace(/\n/g, '<br>');
      if (!txt) return '';
      var open = '', close = '';
      for (var k in MARKS) {
        if (r[k] && !(k === 'c' && r.mth)) { open += '<' + MARKS[k] + '>'; close = '</' + MARKS[k] + '>' + close; }
      }
      if (r.mth) {
        var tx = esc(r.s);
        txt = '<span class="ne-im" contenteditable="false" dir="ltr" data-tex="' + tx + '">\\(' + tx + '\\)</span>';
      }
      /*@3.NOBJ.9*/
      if (r.hl) {
        open += '<mark class="ne-hl" data-hl="' + esc(r.hl) + '"' + hexVar('--ne-hlx', r.hl) + '>';
        close = '</mark>' + close;
      }
      if (r.fg) {
        open += '<span class="ne-fg" data-fg="' + esc(r.fg) + '"' + hexVar('--ne-fgx', r.fg) + '>';
        close = '</span>' + close;
      }
      /*@3.NOBJ.17*/
      if (r.fz) {
        var fzv = Math.max(8, Math.min(96, parseFloat(r.fz) || 0));
        if (fzv) {
          open += '<span class="ne-rz" data-fz="' + fzv + '" style="font-size:' + fzv + 'px">';
          close = '</span>' + close;
        }
      }
      /*@3.NOBJ.15*/
      if (r.ff) {
        var fcss = fontCss(r.ff);
        open += '<span class="ne-rf" data-ff="' + esc(r.ff) + '"' +
                (fcss ? ' style="font-family:&quot;' + esc(fcss) + '&quot;,sans-serif"' : '') + '>';
        close = '</span>' + close;
      }
      /*@3.NOBJ.20*/
      /*@3.NOBJ.26*/
      var body = open + txt + close;
      if (r.lk) {
        var lkv = String(r.lk);
        var lu = (r.lu === 0 || r.lu === '0') ? ' data-lu="0"' : '';
        if (lkv.charAt(0) === '#') {
          return '<a class="ne-xl" href="' + esc(lkv) + '" data-nl="' + esc(lkv) + '"' +
                 lu + '>' + body + '</a>';
        }
        if (/^note:/i.test(lkv) && !/["'<>\s]/.test(lkv)) {
          return '<a class="ne-xl ne-xl--note" href="#" data-nl="' + esc(lkv) + '"' +
                 lu + '>' + body + '</a>';
        }
        var href = httpsOnly(lkv);
        if (href) {
          return '<a href="' + esc(href) + '" target="_blank"' + lu +
                 ' rel="noopener noreferrer nofollow">' + body + '</a>';
        }
      }
      return body;
    }).join('');
  }

  /*@3.NOBJ.12*/
  function runsToHtmlBidi(rt) { return isolate(runsToHtml(rt)); }

  function nodeRuns(node, inherit, out) {
    var st = inherit || {};
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.nodeType === 3) {
        if (n.nodeValue) out.push(Object.assign({}, st, { s: n.nodeValue }));
        continue;
      }
      if (n.nodeType !== 1) continue;
      if (n.classList && n.classList.contains('ne-pg')) continue;
      if (n.classList && n.classList.contains('ne-im')) {
        var tex = n.getAttribute('data-tex') || '';
        if (tex) out.push(Object.assign({}, st, { s: tex, c: 1, mth: 1 }));
        continue;
      }
      var tag = n.tagName.toLowerCase();
      var next = Object.assign({}, st);
      if (tag === 'b' || tag === 'strong') next.b = 1;
      else if (tag === 'i' || tag === 'em') next.i = 1;
      else if (tag === 'u') next.u = 1;
      else if (tag === 's' || tag === 'strike' || tag === 'del') next.st = 1;
      else if (tag === 'code') next.c = 1;
      else if (tag === 'sub') next.sb = 1;
      else if (tag === 'sup') next.sp = 1;
      else if (tag === 'mark') next.hl = n.getAttribute('data-hl') || 'amber';
      else if (tag === 'span' && n.hasAttribute('data-fg')) next.fg = n.getAttribute('data-fg') || '';
      else if (tag === 'span' && n.hasAttribute('data-ff')) next.ff = n.getAttribute('data-ff') || '';
      else if (tag === 'span' && n.hasAttribute('data-fz')) next.fz = parseFloat(n.getAttribute('data-fz')) || 0;
      else if (tag === 'a') {
        /*@3.NOBJ.21*/
        var nl = n.getAttribute('data-nl');
        if (nl) next.lk = nl;
        else { var h = httpsOnly(n.getAttribute('href')); if (h) next.lk = h; }
        if (next.lk && n.getAttribute('data-lu') === '0') next.lu = 0;
      }
      else if (tag === 'br') { out.push(Object.assign({}, st, { s: '\n' })); continue; }
      nodeRuns(n, next, out);
    }
    return out;
  }

  function readRuns(el) {
    var raw = nodeRuns(el, {}, []);
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var r = raw[i], last = out[out.length - 1];
      if (r.s) r.s = r.s.replace(/\u200b/g, '');
      if (!r.s) continue;
      if (last && sameMarks(last, r)) { last.s += r.s; continue; }
      out.push(r);
    }
    return out;
  }

  function sameMarks(a, b) {
    return !!a.b === !!b.b && !!a.i === !!b.i && !!a.u === !!b.u &&
           !!a.st === !!b.st && !!a.c === !!b.c && !!a.mth === !!b.mth &&
           !!a.sb === !!b.sb && !!a.sp === !!b.sp &&
           (a.hl || '') === (b.hl || '') && (a.lk || '') === (b.lk || '') &&
           (a.lu == null ? 1 : a.lu) === (b.lu == null ? 1 : b.lu) &&
           (a.fg || '') === (b.fg || '') && (a.ff || '') === (b.ff || '') &&
           (a.fz || 0) === (b.fz || 0);
  }

  function runsToText(rt) {
    if (!Array.isArray(rt)) return '';
    return rt.map(function (r) { return r.s == null ? '' : r.s; }).join('');
  }

  function runsToMd(rt) {
    var M = window.GardenNotesMd;
    return M ? M.runsToMd(rt) : runsToText(rt);
  }


  /*@3.NOBJ.34*/
  var SHAPE_D = {
    rect:    'M4 10 H96 V90 H4 Z',
    rrect:   'M18 10 H82 A14 14 0 0 1 96 24 V76 A14 14 0 0 1 82 90 H18 A14 14 0 0 1 4 76 V24 A14 14 0 0 1 18 10 Z',
    ell:     'M50 10 A46 40 0 1 1 49.9 10 Z',
    tri:     'M50 8 L96 90 H4 Z',
    diam:    'M50 6 L96 50 L50 94 L4 50 Z',
    star:    'M50 6 L61 38 H95 L67 58 L78 90 L50 70 L22 90 L33 58 L5 38 H39 Z',
    hex:     'M28 10 H72 L96 50 L72 90 H28 L4 50 Z',
    arrow:   'M4 38 H62 V18 L96 50 L62 82 V62 H4 Z',
    line:    'M4 50 H96',
    callout: 'M4 12 H96 V72 H40 L22 92 V72 H4 Z',
    check:   'M10 52 L38 80 L92 20',
    cross:   'M14 14 L86 86 M86 14 L14 86',
    plus:    'M38 10 H62 V38 H90 V62 H62 V90 H38 V62 H10 V38 H38 Z',
    cloud:   'M26 78 A20 20 0 0 1 27 38 A26 26 0 0 1 74 34 A18 18 0 0 1 76 78 Z',
    brace:   'M62 8 A14 14 0 0 0 48 22 V40 A12 12 0 0 1 36 50 A12 12 0 0 1 48 60 V78 A14 14 0 0 0 62 92',
    sticky:  'M6 6 H94 V76 L76 94 H6 Z',
    sticker: 'M50 4 A46 46 0 1 1 49.9 4 Z'
  };
  var SHAPE_OPEN = { line: 1, check: 1, cross: 1, brace: 1 };
  var SHAPE_AR = {
    rect: 'مستطيل', rrect: 'مستطيلٌ مدوّر', ell: 'بيضويّ', tri: 'مثلّث',
    diam: 'معيَّن', star: 'نجمة', hex: 'سداسيّ', arrow: 'سهم', line: 'خطّ',
    callout: 'فقاعةُ كلام', check: 'صحّ', cross: 'خطأ', plus: 'زائد',
    cloud: 'سحابة', brace: 'قوسٌ معقوف', sticky: 'ملصق', sticker: 'ستيكر'
  };
  var SHAPE_EN = {
    rect: 'Rectangle', rrect: 'Rounded box', ell: 'Ellipse', tri: 'Triangle',
    diam: 'Diamond', star: 'Star', hex: 'Hexagon', arrow: 'Arrow', line: 'Line',
    callout: 'Speech bubble', check: 'Check', cross: 'Cross', plus: 'Plus',
    cloud: 'Cloud', brace: 'Brace', sticky: 'Sticky note', sticker: 'Sticker'
  };
  var SHAPE_RATIO = { line: 22, check: 70, brace: 130, callout: 90, arrow: 62 };

  function shapePath(sh) { return SHAPE_D[sh] || SHAPE_D.rect; }
  function shapeOpen(sh) { return !!SHAPE_OPEN[sh]; }
  function shapeName(sh, ar) { return ar ? (SHAPE_AR[sh] || SHAPE_AR.rect) : (SHAPE_EN[sh] || SHAPE_EN.rect); }
  function shapeRatio(sh) { return SHAPE_RATIO[sh] || 100; }

  /*@3.NOBJ.39*/
  /*@3.NOBJ.40*/
  var STICKY_THEMES = ['tape', 'tape2', 'pin', 'pin2', 'pin3', 'none'];
  var STICKERS = [
    { k: 'star', icon: 'fa-star', tone: 'amber', ar: 'نجمة', en: 'Star' },
    { k: 'check', icon: 'fa-check', tone: 'emerald', ar: 'صحّ', en: 'Check' },
    { k: 'xmark', icon: 'fa-xmark', tone: 'red', ar: 'خطأ', en: 'Wrong' },
    { k: 'warn', icon: 'fa-triangle-exclamation', tone: 'orange', ar: 'تنبيه', en: 'Warning' },
    { k: 'bulb', icon: 'fa-lightbulb', tone: 'amber', ar: 'فكرة', en: 'Idea' },
    { k: 'ask', icon: 'fa-circle-question', tone: 'sky', ar: 'سؤال', en: 'Question' },
    { k: 'info', icon: 'fa-circle-info', tone: 'sky', ar: 'معلومة', en: 'Info' },
    { k: 'imp', icon: 'fa-circle-exclamation', tone: 'rose', ar: 'مهمّ', en: 'Important' },
    { k: 'cal', icon: 'fa-calendar-days', tone: 'indigo', ar: 'موعد', en: 'Date' },
    { k: 'clock', icon: 'fa-clock', tone: 'teal', ar: 'وقت', en: 'Time' },
    { k: 'flag', icon: 'fa-flag', tone: 'red', ar: 'علَم', en: 'Flag' },
    { k: 'pin', icon: 'fa-thumbtack', tone: 'pink', ar: 'دبّوس', en: 'Pin' },
    { k: 'bell', icon: 'fa-bell', tone: 'amber', ar: 'تذكير', en: 'Reminder' },
    { k: 'bookmark', icon: 'fa-bookmark', tone: 'violet', ar: 'علامة', en: 'Bookmark' },
    { k: 'book', icon: 'fa-book', tone: 'indigo', ar: 'مذاكرة', en: 'Study' },
    { k: 'pen', icon: 'fa-pen', tone: 'ink', ar: 'قلم', en: 'Pen' },
    { k: 'hi', icon: 'fa-highlighter', tone: 'lime', ar: 'تظليل', en: 'Highlight' },
    { k: 'fire', icon: 'fa-fire', tone: 'orange', ar: 'ساخن', en: 'Hot' },
    { k: 'heart', icon: 'fa-heart', tone: 'rose', ar: 'قلب', en: 'Heart' },
    { k: 'up', icon: 'fa-thumbs-up', tone: 'emerald', ar: 'أعجبني', en: 'Like' },
    { k: 'down', icon: 'fa-thumbs-down', tone: 'red', ar: 'لم يعجبني', en: 'Dislike' },
    { k: 'trophy', icon: 'fa-trophy', tone: 'amber', ar: 'كأس', en: 'Trophy' },
    { k: 'target', icon: 'fa-bullseye', tone: 'red', ar: 'هدف', en: 'Target' },
    { k: 'lock', icon: 'fa-lock', tone: 'ink', ar: 'قفل', en: 'Lock' },
    { k: 'key', icon: 'fa-key', tone: 'amber', ar: 'مفتاح', en: 'Key' },
    { k: 'tag', icon: 'fa-tag', tone: 'teal', ar: 'وسم', en: 'Tag' },
    { k: 'search', icon: 'fa-magnifying-glass', tone: 'sky', ar: 'بحث', en: 'Search' },
    { k: 'brain', icon: 'fa-brain', tone: 'pink', ar: 'حفظ', en: 'Memorize' },
    { k: 'grad', icon: 'fa-graduation-cap', tone: 'indigo', ar: 'تخرّج', en: 'Graduation' },
    { k: 'flask', icon: 'fa-flask', tone: 'violet', ar: 'تجربة', en: 'Experiment' },
    { k: 'calc', icon: 'fa-calculator', tone: 'teal', ar: 'حساب', en: 'Calculate' },
    { k: 'code', icon: 'fa-code', tone: 'ink', ar: 'كود', en: 'Code' },
    { k: 'db', icon: 'fa-database', tone: 'sky', ar: 'بيانات', en: 'Data' },
    { k: 'globe', icon: 'fa-globe', tone: 'emerald', ar: 'عالم', en: 'Globe' },
    { k: 'music', icon: 'fa-music', tone: 'violet', ar: 'موسيقى', en: 'Music' },
    { k: 'camera', icon: 'fa-camera', tone: 'ink', ar: 'كاميرا', en: 'Camera' },
    { k: 'mail', icon: 'fa-envelope', tone: 'sky', ar: 'بريد', en: 'Mail' },
    { k: 'gift', icon: 'fa-gift', tone: 'pink', ar: 'هديّة', en: 'Gift' },
    { k: 'rocket', icon: 'fa-rocket', tone: 'orange', ar: 'انطلاق', en: 'Launch' },
    { k: 'smile', icon: 'fa-face-smile', tone: 'amber', ar: 'ابتسامة', en: 'Smile' }
  ];
  function stickerOf(k) {
    for (var i = 0; i < STICKERS.length; i++) if (STICKERS[i].k === k) return STICKERS[i];
    return null;
  }
  function stickerHtml(b, tone) {
    var st = stickerOf(b && b.sk) || STICKERS[0];
    return '<svg class="ne-shp-svg ne-shp-svg--stk" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" ' +
      'aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + SHAPE_D.sticker + '" fill="currentColor" fill-opacity="0.96" stroke="none"/>' +
      '<foreignObject x="0" y="0" width="100" height="100">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" class="ne-shp-ico"><i class="fa-solid ' + st.icon + '"></i></div>' +
      '</foreignObject></svg>';
  }
  function stickySvg(b, opt) {
    var th = (b && STICKY_THEMES.indexOf(b.th) >= 0) ? b.th : 'tape';
    var sw = (opt && opt.stroke) || 5;
    var deco = '';
    if (th === 'tape') deco = '<rect x="34" y="-3" width="32" height="12" rx="2" fill="#ffffff" fill-opacity="0.55" stroke="none" transform="rotate(-5 50 3)"/>';
    else if (th === 'tape2') deco = '<rect x="-6" y="-2" width="30" height="11" rx="2" fill="#ffffff" fill-opacity="0.55" stroke="none" transform="rotate(-40 9 3)"/>' +
      '<rect x="76" y="-2" width="30" height="11" rx="2" fill="#ffffff" fill-opacity="0.55" stroke="none" transform="rotate(40 91 3)"/>';
    /*@3.NOBJ.41*/
    var pin = '';
    if (th === 'pin' || th === 'pin2' || th === 'pin3') {
      var pc = th === 'pin2' ? '#0ea5e9' : (th === 'pin3' ? '#10b981' : '#ef4444');
      var pd = th === 'pin2' ? '#0369a1' : (th === 'pin3' ? '#047857' : '#b91c1c');
      /*@3.NOBJ.42*/
      var gid = 'stkpin-' + th;
      pin = '<svg class="ne-stk-pin" viewBox="0 0 28 28" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><radialGradient id="' + gid + '" cx="35%" cy="30%" r="70%">' +
        '<stop offset="0" stop-color="#ffffff" stop-opacity=".85"/><stop offset=".25" stop-color="' + pc + '"/><stop offset="1" stop-color="' + pd + '"/></radialGradient></defs>' +
        '<ellipse cx="15" cy="20.5" rx="7.5" ry="3" fill="#000000" fill-opacity=".22"/>' +
        '<path d="M14.5 15 L19 21.5" fill="none" stroke="#6b7280" stroke-width="1.5" stroke-linecap="round"/>' +
        '<path d="M18.2 20.2 L19.6 22.6 L20.6 20.3 Z" fill="#374151"/>' +
        '<ellipse cx="12.5" cy="14.2" rx="4.2" ry="1.6" fill="' + pd + '"/>' +
        '<circle cx="12" cy="9.5" r="7.6" fill="url(#' + gid + ')"/>' +
        '<circle cx="12" cy="9.5" r="7.6" fill="none" stroke="' + pd + '" stroke-opacity=".55" stroke-width=".8"/>' +
        '</svg>';
    }
    return '<svg class="ne-shp-svg" viewBox="0 0 100 100" preserveAspectRatio="none" ' +
      'aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + SHAPE_D.sticky + '" fill="currentColor" fill-opacity="0.92" stroke="currentColor" stroke-width="' + sw + '" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      '<path d="M76 94 V76 H94" fill="none" stroke="#ffffff" stroke-opacity="0.75" stroke-width="' + sw + '" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      deco + '</svg>' + pin;
  }

  /*@3.NOBJ.35*/
  function shapeSvg(b, opt) {
    var o = opt || {};
    var sh = (SHAPES.indexOf(b && b.sh) >= 0) ? b.sh : 'rect';
    if (sh === 'sticker') return stickerHtml(b);
    if (sh === 'sticky') return stickySvg(b, o);
    var open = shapeOpen(sh);
    var fill = (!open && b && b.fill) ? 'currentColor' : 'none';
    var op = (!open && b && b.fill) ? ' fill-opacity="0.92"' : '';
    var sw = o.stroke || 5;
    return '<svg class="ne-shp-svg" viewBox="0 0 100 100" preserveAspectRatio="none" ' +
      'aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + shapePath(sh) + '" fill="' + fill + '"' + op +
      ' stroke="currentColor" stroke-width="' + sw + '" stroke-linejoin="round" ' +
      'stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  }

  function blank(ty, extra) {
    var b = { id: uid(), ty: ty || 'p' };
    if (ty === 'h') b.lv = 2;
    if (ty === 'ul' || ty === 'ol' || ty === 'dl') b.items = [{ rt: [] }];
    else if (ty === 'code') { b.lang = ''; b.src = ''; }
    else if (ty === 'tbl') { b.cols = 2; b.st = 'head'; b.rows = [[{ rt: [] }, { rt: [] }], [{ rt: [] }, { rt: [] }]]; }
    else if (ty === 'math') { b.tex = ''; b.display = 1; }
    else if (ty === 'img') { b.url = ''; b.alt = ''; b.cap = 1; b.iw = 100; b.br = 100; b.op = 100; }
    /*@3.NOBJ.30*/
    else if (ty === 'sticky') { b.sv = 2; b.rt = []; b.tone = 'amber'; b.rot = 0; }
    /*@3.NOBJ.32*/
    else if (ty === 'shape') {
      b.sh = 'rect'; b.rt = []; b.tone = 'ink'; b.fill = 0; b.rot = 0; b.ar = 100;
    }
    else if (ty === 'ink') { b.w = 0; b.h = 300; b.ink = ''; b.shapes = null; }
    else if (ty === 'gap') { b.h = 40; }
    /*@3.NOBJ.44*/
    else if (ty === 'pb') { b.h = 0; }
    else if (ty === 'todo') { b.done = 0; b.rt = []; }
    else if (ty !== 'hr') b.rt = [];
    return Object.assign(b, extra || {});
  }

  /*@3.NOBJ.22*/
  function anchorOf(b) {
    if (!b) return '';
    if (b.anc) return String(b.anc);
    var M = window.GardenNotesMd;
    var t = runsToText(b.rt || []);
    return (M && M.slug) ? M.slug(t) : '';
  }

  /*@3.NOBJ.19*/
  function listHtml(b, runsFn, liAttr) {
    var items = b.items || [];
    var rootOrd = (b.ty === 'ol');
    var out = '', open = [];
    function tagOf(o) { return o ? 'ol' : 'ul'; }
    for (var i = 0; i < items.length; i++) {
      var it = items[i] || {};
      var lv = Math.max(0, Math.min(5, it.lv || 0));
      var ord = (it.o != null) ? !!it.o : rootOrd;
      while (open.length > lv + 1) { out += '</li></' + tagOf(open.pop()) + '>'; }
      if (!open.length) { out += '<' + tagOf(ord) + '>'; open.push(ord); }
      else if (open.length < lv + 1) { out += '<' + tagOf(ord) + '>'; open.push(ord); }
      else {
        out += '</li>';
        if (open[open.length - 1] !== ord) {
          out += '</' + tagOf(open.pop()) + '><' + tagOf(ord) + '>';
          open.push(ord);
        }
      }
      out += '<li' + (liAttr ? liAttr(it, i) : '') + '>' + runsFn(it.rt);
    }
    while (open.length) { out += '</li></' + tagOf(open.pop()) + '>'; }
    return out;
  }

  /*@3.NOBJ.5*/
  function normalize(doc) {
    var d = (doc && typeof doc === 'object') ? doc : {};
    var blocks = Array.isArray(d.blocks) ? d.blocks : [];
    var out = [];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (!b || !b.ty) continue;
      if (!b.id) b.id = uid();
      /*@3.NOBJ.7*/
      /*@3.NOBJ.29*/
      if (b.ty === 'sticky' && b.sv !== 2) {
        b.ty = 'p'; if (!Array.isArray(b.rt)) b.rt = []; delete b.tone;
      }
      if (b.ty === 'sticky') {
        if (!Array.isArray(b.rt)) b.rt = [];
        if (STICKY_TONES.indexOf(b.tone) < 0) b.tone = 'amber';
        b.rot = Math.max(-12, Math.min(12, Math.round(Number(b.rot) || 0)));
      }
      /*@3.NOBJ.36*/
      if (b.ty === 'shape') {
        if (!Array.isArray(b.rt)) b.rt = [];
        if (SHAPES.indexOf(b.sh) < 0) b.sh = 'rect';
        if (SHAPE_TONES.indexOf(b.tone) < 0) b.tone = 'ink';
        b.fill = b.fill ? 1 : 0;
        b.rot = ((Math.round(Number(b.rot) || 0) % 360) + 360) % 360;
        b.ar = Math.max(20, Math.min(400, Math.round(Number(b.ar) || 100)));
      }
      if (b.ty === 'img') {
        /*@3.NOBJ.28*/
        b.url = imgSrc(b.url);
        /*@3.NOBJ.23*/
        if (b.lk != null) { var lkN = normUrl(b.lk); if (lkN) b.lk = lkN; else delete b.lk; }
      }
      out.push(b);
    }
    /*@3.NOBJ.43*/
    var flow = false;
    for (var fi = 0; fi < out.length; fi++) if (!out[fi].fp) { flow = true; break; }
    if (!flow) out.push(blank('p'));
    /*@3.NOBJ.6*/
    var doc2 = {};
    for (var k in d) {
      if (Object.prototype.hasOwnProperty.call(d, k)) doc2[k] = d[k];
    }
    doc2.v = 1;
    doc2.blocks = out;
    return doc2;
  }

  /*@3.NOBJ.46*/
  function pgLead(b) {
    if (!b || !(b.pg > 0)) return '';
    var ar = b.dir === 'rtl' || /[\u0600-\u06FF]/.test(runsToText(b.rt || []));
    return (ar ? 'صفحة ' : 'Page ') + (b.pg | 0) + ': ';
  }

  /*@3.NOBJ.3*/
  function isEmptyBlock(b) {
    if (!b) return true;
    if (b.ty === 'hr' || b.ty === 'ink' || b.ty === 'pb') return false;
    if (b.ty === 'gap') return true;
    if (b.ty === 'img') return !b.url;
    if (b.ty === 'sticky') return !runsToText(b.rt).trim();
    /*@3.NOBJ.37*/
    if (b.ty === 'shape') return false;
    if (b.ty === 'code') return !String(b.src || '').trim();
    if (b.ty === 'math') return !String(b.tex || '').trim();
    if (b.ty === 'ul' || b.ty === 'ol' || b.ty === 'dl') {
      return !(b.items || []).some(function (it) { return runsToText(it.rt).trim(); });
    }
    if (b.ty === 'tbl') {
      return !(b.rows || []).some(function (r) {
        return r.some(function (c) { return runsToText(c.rt).trim(); });
      });
    }
    return !runsToText(b.rt).trim();
  }

  function liveBlocks(doc) {
    return normalize(doc).blocks.filter(function (b) { return !isEmptyBlock(b); });
  }

  function toText(doc) {
    return liveBlocks(doc).map(function (b) {
      switch (b.ty) {
        case 'h':     return pgLead(b) + runsToText(b.rt);
        case 'p':     return runsToText(b.rt);
        case 'quote': return runsToText(b.rt);
        case 'callout': return (b.ct ? b.ct + ': ' : '') + runsToText(b.rt);
        case 'todo':  return (b.done ? '[x] ' : '[ ] ') + runsToText(b.rt);
        case 'dl':    return (b.items || []).map(function (it) {
          return (it.lv ? ': ' : '') + runsToText(it.rt); }).join('\n');
        case 'ul':    return (b.items || []).map(function (it) { return '- ' + runsToText(it.rt); }).join('\n');
        case 'ol':    return (b.items || []).map(function (it, i) { return (i + 1) + '. ' + runsToText(it.rt); }).join('\n');
        case 'code':  return b.src || '';
        case 'math':  return b.tex || '';
        case 'tbl':   return (b.rows || []).map(function (r) {
                        return r.map(function (c) { return runsToText(c.rt); }).join(' | '); }).join('\n');
        case 'img':   return b.alt ? '[' + b.alt + ']' : '[image]';
        case 'sticky': return runsToText(b.rt);
        case 'shape': return runsToText(b.rt);
        case 'ink':   return '[drawing]';
        case 'hr':    return '---';
        case 'pb':    return '';
        default:      return '';
      }
    }).filter(function (x) { return x !== ''; }).join('\n\n');
  }

  function toMarkdown(doc) {
    var M = window.GardenNotesMd;
    return M ? M.toMarkdown(doc) : toText(doc);
  }

  var TONES = ['ink', 'amber', 'rose', 'violet', 'emerald', 'sky',
               'lime', 'orange', 'red', 'pink', 'teal', 'indigo'];


  /*@3.NOBJ.18*/
  function mdInline(text) {
    var M = window.GardenNotesMd;
    return M ? M.inline(text) : [{ s: String(text == null ? '' : text) }];
  }

  function looksMarkdown(text) {
    var M = window.GardenNotesMd;
    return M ? M.looksMarkdown(text) : false;
  }

  function fromMarkdown(text) {
    var M = window.GardenNotesMd;
    if (M) return M.parse(text);
    return [blank('p', { rt: [{ s: String(text == null ? '' : text) }] })];
  }

  var DIRS = ['auto', 'rtl', 'ltr'];
  var ALIGNS = ['start', 'center', 'end', 'justify'];
  /*@3.NOBJ.48*/
  var TBL_STYLES = ['head', 'lines', 'stripe', 'plain', 'cmp'];

  /*@3.NOBJ.13*/
  var FONT_HEAD = [
    { id: 'thmanyah', css: 'Thmanyah Sans', star: 1, ar: 'ثمانية',  en: 'Thmanyah Sans' },
    { id: 'cairo',    css: 'Cairo',         star: 1, ar: 'القاهرة', en: 'Cairo' }
  ];
  var FONT_DEFAULT = 'thmanyah';

  function fontCatalog() {
    var out = FONT_HEAD.slice();
    var seen = { thmanyah: 1, cairo: 1 };
    try {
      var M = window.GardenModuleTheme;
      [(M && M.FONTS) || [], (M && M.FONTS_LAT) || []].forEach(function (list) {
        for (var i = 0; i < list.length; i++) {
          var f = list[i];
          if (!f || !f.id || !f.css || seen[f.id]) continue;
          seen[f.id] = 1;
          out.push(f);
        }
      });
    } catch (e) {}
    return out;
  }

  function fontCss(id) {
    if (!id) return null;
    var all = fontCatalog();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i].css;
    return null;
  }

  window.GardenNotesBlocks = {
    TONES: TONES,
    /*@3.NOBJ.38*/
    SHAPES: SHAPES,
    SHAPE_TONES: SHAPE_TONES,
    STICKERS: STICKERS, STICKY_THEMES: STICKY_THEMES, stickerOf: stickerOf,
    shapeSvg: shapeSvg,
    shapePath: shapePath,
    shapeOpen: shapeOpen,
    shapeName: shapeName,
    shapeRatio: shapeRatio,
    DIRS: DIRS,
    ALIGNS: ALIGNS,
    FONT_DEFAULT: FONT_DEFAULT,
    fontCatalog: fontCatalog,
    fontCss: fontCss,
    fromMarkdown: fromMarkdown,
    looksMarkdown: looksMarkdown,
    mdInline: mdInline,
    TBL_STYLES: TBL_STYLES,
    isEmptyBlock: isEmptyBlock,
    liveBlocks: liveBlocks,
    uid: uid,
    blank: blank,
    normalize: normalize,
    runsToHtml: runsToHtml,
    runsToHtmlBidi: runsToHtmlBidi,
    readRuns: readRuns,
    runsToText: runsToText,
    runsToMd: runsToMd,
    listHtml: listHtml,
    anchorOf: anchorOf,
    STICKY_TONES: STICKY_TONES,
    httpsOnly: httpsOnly,
    localImg: localImg,
    imgSrc: imgSrc,
    dataDims: dataDims,
    normUrl: normUrl,
    esc: esc,
    toText: toText,
    pgLead: pgLead,
    CAPS: { calloutTitle: 1, pageBadge: 1, cardLayout: 1, fmt: 1, recall: 1 },
    toMarkdown: toMarkdown,
    sameRun: sameMarks,
    MARKS: MARKS
  };
})();
