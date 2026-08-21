/*@3.NOBJ.1*/
;(function () {
  'use strict';

  var MARKS = { b: 'b', i: 'i', u: 'u', st: 's', c: 'code' };

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
  function httpsOnly(u) {
    var s = String(u == null ? '' : u).trim();
    return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s : '';
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
  var BIDI_RUN = new RegExp('[A-Za-z](?:[^' + AR + '<>&]*[^\\s' + AR + '<>&])?', 'g');

  function isolate(html) {
    var out = '', i = 0;
    while (i <= html.length) {
      var lt = html.indexOf('<', i);
      var amp = html.indexOf('&', i);
      var stop = (lt < 0) ? amp : (amp < 0 ? lt : Math.min(lt, amp));
      var chunk = stop < 0 ? html.slice(i) : html.slice(i, stop);
      out += chunk.replace(BIDI_RUN, function (m) { return '<bdi>' + m + '</bdi>'; });
      if (stop < 0) break;
      var end = html.indexOf(html.charAt(stop) === '<' ? '>' : ';', stop);
      if (end < 0) { out += html.slice(stop); break; }
      out += html.slice(stop, end + 1);
      i = end + 1;
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
        if (r[k]) { open += '<' + MARKS[k] + '>'; close = '</' + MARKS[k] + '>' + close; }
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
      if (r.lk) {
        var href = httpsOnly(r.lk);
        if (href) {
          open += '<a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer nofollow">';
          close = '</a>' + close;
        }
      }
      return open + txt + close;
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
      var tag = n.tagName.toLowerCase();
      var next = Object.assign({}, st);
      if (tag === 'b' || tag === 'strong') next.b = 1;
      else if (tag === 'i' || tag === 'em') next.i = 1;
      else if (tag === 'u') next.u = 1;
      else if (tag === 's' || tag === 'strike' || tag === 'del') next.st = 1;
      else if (tag === 'code') next.c = 1;
      else if (tag === 'mark') next.hl = n.getAttribute('data-hl') || 'amber';
      else if (tag === 'span' && n.hasAttribute('data-fg')) next.fg = n.getAttribute('data-fg') || '';
      else if (tag === 'span' && n.hasAttribute('data-ff')) next.ff = n.getAttribute('data-ff') || '';
      else if (tag === 'span' && n.hasAttribute('data-fz')) next.fz = parseFloat(n.getAttribute('data-fz')) || 0;
      else if (tag === 'a') { var h = httpsOnly(n.getAttribute('href')); if (h) next.lk = h; }
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
           !!a.st === !!b.st && !!a.c === !!b.c &&
           (a.hl || '') === (b.hl || '') && (a.lk || '') === (b.lk || '') &&
           (a.fg || '') === (b.fg || '') && (a.ff || '') === (b.ff || '') &&
           (a.fz || 0) === (b.fz || 0);
  }

  function runsToText(rt) {
    if (!Array.isArray(rt)) return '';
    return rt.map(function (r) { return r.s == null ? '' : r.s; }).join('');
  }

  /*@3.NOBJ.4*/
  function runsToMd(rt) {
    if (!Array.isArray(rt)) return '';
    return rt.map(function (r) {
      var raw = r.s == null ? '' : r.s;
      if (!raw.trim()) return raw;
      var lead = raw.match(/^\s*/)[0];
      var tail = raw.match(/\s*$/)[0];
      var t = raw.slice(lead.length, raw.length - tail.length);
      if (r.c) t = '`' + t + '`';
      if (r.b) t = '**' + t + '**';
      if (r.i) t = '*' + t + '*';
      if (r.st) t = '~~' + t + '~~';
      if (r.hl) t = '==' + t + '==';
      if (r.lk) t = '[' + t + '](' + r.lk + ')';
      return lead + t + tail;
    }).join('').replace(/\n/g, '  \n');
  }

  function blank(ty, extra) {
    var b = { id: uid(), ty: ty || 'p' };
    if (ty === 'h') b.lv = 2;
    if (ty === 'ul' || ty === 'ol') b.items = [{ rt: [] }];
    else if (ty === 'code') { b.lang = ''; b.src = ''; }
    else if (ty === 'tbl') { b.cols = 2; b.st = 'head'; b.rows = [[{ rt: [] }, { rt: [] }], [{ rt: [] }, { rt: [] }]]; }
    else if (ty === 'math') { b.tex = ''; b.display = 1; }
    else if (ty === 'img') { b.url = ''; b.alt = ''; b.cap = 1; b.iw = 100; b.br = 100; b.op = 100; }
    else if (ty === 'ink') { b.w = 0; b.h = 300; b.ink = ''; b.shapes = null; }
    else if (ty === 'gap') { b.h = 40; }
    else if (ty === 'todo') { b.done = 0; b.rt = []; }
    else if (ty !== 'hr') b.rt = [];
    return Object.assign(b, extra || {});
  }

  function normalize(doc) {
    var d = (doc && typeof doc === 'object') ? doc : {};
    var blocks = Array.isArray(d.blocks) ? d.blocks : [];
    var out = [];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (!b || !b.ty) continue;
      if (!b.id) b.id = uid();
      /*@3.NOBJ.7*/
      if (b.ty === 'sticky') { b.ty = 'p'; if (!Array.isArray(b.rt)) b.rt = []; delete b.tone; }
      if (b.ty === 'img') { b.url = httpsOnly(b.url); }
      out.push(b);
    }
    if (!out.length) out.push(blank('p'));
    /*@3.NOBJ.6*/
    var doc2 = {};
    for (var k in d) {
      if (Object.prototype.hasOwnProperty.call(d, k)) doc2[k] = d[k];
    }
    doc2.v = 1;
    doc2.blocks = out;
    return doc2;
  }

  /*@3.NOBJ.3*/
  function isEmptyBlock(b) {
    if (!b) return true;
    if (b.ty === 'hr' || b.ty === 'ink') return false;
    if (b.ty === 'gap') return true;
    if (b.ty === 'img') return !b.url;
    if (b.ty === 'code') return !String(b.src || '').trim();
    if (b.ty === 'math') return !String(b.tex || '').trim();
    if (b.ty === 'ul' || b.ty === 'ol') {
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
        case 'h':     return runsToText(b.rt);
        case 'p':     return runsToText(b.rt);
        case 'quote': return runsToText(b.rt);
        case 'callout': return runsToText(b.rt);
        case 'todo':  return (b.done ? '[x] ' : '[ ] ') + runsToText(b.rt);
        case 'ul':    return (b.items || []).map(function (it) { return '- ' + runsToText(it.rt); }).join('\n');
        case 'ol':    return (b.items || []).map(function (it, i) { return (i + 1) + '. ' + runsToText(it.rt); }).join('\n');
        case 'code':  return b.src || '';
        case 'math':  return b.tex || '';
        case 'tbl':   return (b.rows || []).map(function (r) {
                        return r.map(function (c) { return runsToText(c.rt); }).join(' | '); }).join('\n');
        case 'img':   return b.alt ? '[' + b.alt + ']' : '[image]';
        case 'ink':   return '[drawing]';
        case 'hr':    return '---';
        default:      return '';
      }
    }).filter(function (x) { return x !== ''; }).join('\n\n');
  }

  function toMarkdown(doc) {
    return liveBlocks(doc).map(function (b) {
      switch (b.ty) {
        case 'h':     return new Array((b.lv || 2) + 1).join('#') + ' ' + runsToMd(b.rt);
        case 'p':     return runsToMd(b.rt);
        case 'quote': return '> ' + runsToMd(b.rt);
        case 'callout': return '> **!** ' + runsToMd(b.rt);
        case 'todo':  return '- [' + (b.done ? 'x' : ' ') + '] ' + runsToMd(b.rt);
        case 'ul':    return (b.items || []).map(function (it) { return '- ' + runsToMd(it.rt); }).join('\n');
        case 'ol':    return (b.items || []).map(function (it, i) { return (i + 1) + '. ' + runsToMd(it.rt); }).join('\n');
        case 'code':  return '```' + (b.lang || '') + '\n' + (b.src || '') + '\n```';
        case 'math':  return b.display ? '$$\n' + (b.tex || '') + '\n$$' : '$' + (b.tex || '') + '$';
        case 'tbl':   return tableMd(b);
        case 'img':   return b.url ? '![' + (b.alt || '') + '](' + b.url + ')' : '';
        case 'ink':   return '_[drawing]_';
        case 'hr':    return '---';
        default:      return '';
      }
    }).filter(function (x) { return x !== ''; }).join('\n\n');
  }

  function tableMd(b) {
    var rows = b.rows || [];
    if (!rows.length) return '';
    var head = rows[0].map(function (c) { return runsToMd(c.rt) || ' '; });
    var sep = head.map(function () { return '---'; });
    var body = rows.slice(1).map(function (r) {
      return '| ' + r.map(function (c) { return runsToMd(c.rt) || ' '; }).join(' | ') + ' |';
    });
    return ['| ' + head.join(' | ') + ' |', '| ' + sep.join(' | ') + ' |'].concat(body).join('\n');
  }

  var TONES = ['ink', 'amber', 'rose', 'violet', 'emerald', 'sky',
               'lime', 'orange', 'red', 'pink', 'teal', 'indigo'];

  /*@3.NOBJ.5*/

  /*@3.NOBJ.14*/
  function mdInline(text) {
    var out = [], i = 0, buf = '', s = String(text == null ? '' : text);
    function flush(st) {
      if (!buf) return;
      out.push(Object.assign({ s: buf }, st || {}));
      buf = '';
    }
    var RULES = [
      { open: '`',   key: 'c',  len: 1 },
      { open: '***', keys: ['b', 'i'], len: 3 },
      { open: '**',  key: 'b',  len: 2 },
      { open: '~~',  key: 'st', len: 2 },
      { open: '*',   key: 'i',  len: 1 },
      { open: '_',   key: 'i',  len: 1 }
    ];
    while (i < s.length) {
      var ch = s.charAt(i);
      if (ch === '\\' && i + 1 < s.length) { buf += s.charAt(i + 1); i += 2; continue; }
      if (ch === '[') {
        var close = s.indexOf('](', i);
        if (close > i) {
          var end = s.indexOf(')', close + 2);
          if (end > close) {
            var label = s.slice(i + 1, close);
            var href = httpsOnly(s.slice(close + 2, end).split(' ')[0]);
            if (href) {
              flush();
              var inner = mdInline(label);
              for (var k = 0; k < inner.length; k++) { inner[k].lk = href; out.push(inner[k]); }
              i = end + 1;
              continue;
            }
          }
        }
      }
      var hit = null;
      for (var r = 0; r < RULES.length; r++) {
        var rule = RULES[r];
        if (s.substr(i, rule.len) !== rule.open) continue;
        var stop = s.indexOf(rule.open, i + rule.len);
        if (stop < 0) continue;
        hit = { rule: rule, stop: stop };
        break;
      }
      if (hit) {
        flush();
        var body = s.slice(i + hit.rule.len, hit.stop);
        var style = {};
        if (hit.rule.keys) { for (var q = 0; q < hit.rule.keys.length; q++) style[hit.rule.keys[q]] = 1; }
        else style[hit.rule.key] = 1;
        if (hit.rule.key === 'c') {
          out.push(Object.assign({ s: body }, style));
        } else {
          var kids = mdInline(body);
          for (var d = 0; d < kids.length; d++) out.push(Object.assign(kids[d], style));
        }
        i = hit.stop + hit.rule.len;
        continue;
      }
      buf += ch;
      i++;
    }
    flush();
    return out.filter(function (x) { return x.s; });
  }

  function mdRow(line) {
    var t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return t.split('|').map(function (c) { return { rt: mdInline(c.trim()) }; });
  }

  function looksMarkdown(text) {
    var s = String(text || '');
    if (!s) return false;
    return /(^|\n)#{1,6}\s/.test(s) || /(^|\n)\s*[-*+]\s/.test(s) ||
           /(^|\n)\s*\d+[.)]\s/.test(s) || /(^|\n)\s*>\s/.test(s) ||
           /```/.test(s) || /(^|\n)\s*\|.*\|/.test(s) ||
           /\*\*[^*\n]+\*\*/.test(s) || /(^|\n)\s*(-{3,}|\*{3,})\s*$/.test(s) ||
           /!\[[^\]]*\]\(/.test(s);
  }

  function fromMarkdown(text) {
    var lines = String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n');
    var out = [], i = 0;

    function push(b) { out.push(b); return b; }

    while (i < lines.length) {
      var line = lines[i];
      var t = line.trim();

      if (!t) { i++; continue; }

      var fence = t.match(/^```+\s*([A-Za-z0-9+#._-]*)\s*$/);
      if (fence) {
        var lang = (fence[1] || '').toLowerCase();
        var src = [];
        i++;
        while (i < lines.length && !/^```+\s*$/.test(lines[i].trim())) { src.push(lines[i]); i++; }
        i++;
        push(blank('code', { lang: lang, src: src.join('\n') }));
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { push(blank('hr')); i++; continue; }

      var mth = t.match(/^\$\$(.*)$/);
      if (mth) {
        var tex = [];
        if (/\$\$$/.test(t) && t.length > 3) {
          tex.push(t.slice(2, -2));
          i++;
        } else {
          tex.push(mth[1]); i++;
          while (i < lines.length && !/\$\$\s*$/.test(lines[i])) { tex.push(lines[i]); i++; }
          if (i < lines.length) { tex.push(lines[i].replace(/\$\$\s*$/, '')); i++; }
        }
        push(blank('math', { tex: tex.join('\n').trim(), display: 1 }));
        continue;
      }

      var img = t.match(/^!\[([^\]]*)\]\(([^)\s]+)/);
      if (img) {
        var url = httpsOnly(img[2]);
        if (url) { push(blank('img', { url: url, alt: img[1] || '' })); i++; continue; }
      }

      var head = t.match(/^(#{1,6})\s+(.*)$/);
      if (head) {
        push(blank('h', { lv: Math.min(3, head[1].length), rt: mdInline(head[2]) }));
        i++;
        continue;
      }

      if (/^\|.*\|/.test(t) && i + 1 < lines.length &&
          /^\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1].trim())) {
        var rows = [mdRow(lines[i])];
        i += 2;
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) {
          rows.push(mdRow(lines[i])); i++;
        }
        var cols = 0;
        for (var rr = 0; rr < rows.length; rr++) cols = Math.max(cols, rows[rr].length);
        for (var r2 = 0; r2 < rows.length; r2++) {
          while (rows[r2].length < cols) rows[r2].push({ rt: [] });
        }
        push(blank('tbl', { cols: cols, st: 'head', rows: rows }));
        continue;
      }

      var quote = t.match(/^>\s?(.*)$/);
      if (quote) {
        var qs = [quote[1]];
        i++;
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          qs.push(lines[i].replace(/^\s*>\s?/, '')); i++;
        }
        push(blank('quote', { rt: mdInline(qs.join('\n')) }));
        continue;
      }

      var todo = t.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
      if (todo) {
        push(blank('todo', { done: /[xX]/.test(todo[1]) ? 1 : 0, rt: mdInline(todo[2]) }));
        i++;
        continue;
      }

      var bullet = t.match(/^[-*+]\s+(.*)$/);
      var num = t.match(/^\d+[.)]\s+(.*)$/);
      if (bullet || num) {
        var ty = bullet ? 'ul' : 'ol';
        var items = [];
        while (i < lines.length) {
          var lt = lines[i].trim();
          var lv = Math.floor((lines[i].match(/^\s*/)[0].length) / 2);
          if (lt.match(/^[-*+]\s+\[([ xX])\]\s+/)) break;
          var m2 = ty === 'ul' ? lt.match(/^[-*+]\s+(.*)$/) : lt.match(/^\d+[.)]\s+(.*)$/);
          if (!m2) break;
          var it = { rt: mdInline(m2[1]) };
          if (lv > 0) it.lv = Math.min(5, lv);
          items.push(it);
          i++;
        }
        if (!items.length) { push(blank('p', { rt: mdInline(t) })); i++; continue; }
        push(blank(ty, { items: items }));
        continue;
      }

      var para = [t];
      i++;
      while (i < lines.length && lines[i].trim() &&
             !/^(#{1,6}\s|>|\s*[-*+]\s|\s*\d+[.)]\s|```|\||\$\$|!\[)/.test(lines[i].trim()) &&
             !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())) {
        para.push(lines[i].trim()); i++;
      }
      push(blank('p', { rt: mdInline(para.join('\n')) }));
    }

    if (!out.length) out.push(blank('p'));
    return out;
  }

  var DIRS = ['auto', 'rtl', 'ltr'];
  var ALIGNS = ['start', 'center', 'end', 'justify'];
  var TBL_STYLES = ['head', 'lines', 'stripe', 'plain'];

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
    httpsOnly: httpsOnly,
    normUrl: normUrl,
    esc: esc,
    toText: toText,
    toMarkdown: toMarkdown,
    sameRun: sameMarks,
    MARKS: MARKS
  };
})();
