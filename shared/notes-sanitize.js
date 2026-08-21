/*@3.NOSJ3.1*/
;(function () {
  'use strict';

  var B = function () { return window.GardenNotesBlocks; };

  var INLINE_OK = {
    b: 1, strong: 1, i: 1, em: 1, u: 1, s: 1, strike: 1, del: 1,
    code: 1, mark: 1, a: 1, br: 1, span: 1, sub: 1, sup: 1, font: 1
  };

  var BLOCK_MAP = {
    h1: { ty: 'h', lv: 1 }, h2: { ty: 'h', lv: 2 }, h3: { ty: 'h', lv: 3 },
    h4: { ty: 'h', lv: 3 }, h5: { ty: 'h', lv: 3 }, h6: { ty: 'h', lv: 3 },
    p: { ty: 'p' }, div: { ty: 'p' }, section: { ty: 'p' }, article: { ty: 'p' },
    blockquote: { ty: 'quote' }, pre: { ty: 'code' }, hr: { ty: 'hr' },
    ul: { ty: 'ul' }, ol: { ty: 'ol' }, table: { ty: 'tbl' }, img: { ty: 'img' }
  };

  var BLOCK_SEL = 'p,div,section,article,h1,h2,h3,h4,h5,h6,ul,ol,table,pre,blockquote,hr,img';

  function stripDangerous(root) {
    var kill = root.querySelectorAll('script,style,link,meta,iframe,object,embed,form,input,button,svg,noscript,template');
    for (var i = kill.length - 1; i >= 0; i--) kill[i].remove();

    var all = root.querySelectorAll('*');
    for (var j = 0; j < all.length; j++) {
      var el = all[j];
      var attrs = el.attributes;
      for (var k = attrs.length - 1; k >= 0; k--) {
        var name = attrs[k].name.toLowerCase();
        var keep = false;
        if (el.tagName.toLowerCase() === 'a' && name === 'href') keep = true;
        else if (el.tagName.toLowerCase() === 'img' && (name === 'src' || name === 'alt')) keep = true;
        else if (name === 'data-hl') keep = true;
        /*@3.NOSJ3.6*/
        else if (el.tagName.toLowerCase() === 'span' &&
                 (name === 'data-fg' || name === 'data-ff' || name === 'data-fz')) keep = true;
        if (!keep) el.removeAttribute(attrs[k].name);
      }
    }
    return root;
  }

  function cellsOf(tr) {
    return [].slice.call(tr.children).filter(function (c) {
      var t = c.tagName.toLowerCase();
      return t === 'td' || t === 'th';
    });
  }

  function fromTable(el) {
    var trs = [].slice.call(el.querySelectorAll('tr'));
    if (!trs.length) return null;
    var rows = trs.map(function (tr) {
      return cellsOf(tr).map(function (c) { return { rt: B().readRuns(c) }; });
    }).filter(function (r) { return r.length; });
    if (!rows.length) return null;
    var cols = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    rows.forEach(function (r) { while (r.length < cols) r.push({ rt: [] }); });
    return B().blank('tbl', { cols: cols, rows: rows });
  }

  function walk(node, out) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];

      if (n.nodeType === 3) {
        var txt = n.nodeValue;
        if (txt && txt.trim()) out.push(B().blank('p', { rt: [{ s: txt.replace(/\s+/g, ' ') }] }));
        continue;
      }
      if (n.nodeType !== 1) continue;

      var tag = n.tagName.toLowerCase();

      if (INLINE_OK[tag]) {
        var runs = B().readRuns(n);
        if (runs.length) out.push(B().blank('p', { rt: runs }));
        continue;
      }

      var map = BLOCK_MAP[tag];
      if (!map) { walk(n, out); continue; }

      if (map.ty === 'hr') { out.push(B().blank('hr')); continue; }

      if (map.ty === 'img') {
        var url = B().httpsOnly(n.getAttribute('src'));
        if (url) out.push(B().blank('img', { url: url, alt: n.getAttribute('alt') || '' }));
        continue;
      }

      if (map.ty === 'tbl') {
        var t = fromTable(n);
        if (t) out.push(t);
        continue;
      }

      if (map.ty === 'ul' || map.ty === 'ol') {
        var items = [].slice.call(n.children)
          .filter(function (li) { return li.tagName.toLowerCase() === 'li'; })
          .map(function (li) { return { rt: B().readRuns(li) }; })
          .filter(function (it) { return B().runsToText(it.rt).trim(); });
        if (items.length) out.push(B().blank(map.ty, { items: items }));
        continue;
      }

      if (map.ty === 'code') {
        var src = n.textContent || '';
        if (src.trim()) out.push(B().blank('code', { src: src.replace(/\s+$/, ''), lang: '' }));
        continue;
      }

      /*@3.NOSJ3.2*/
      if (n.querySelector(BLOCK_SEL)) { walk(n, out); continue; }

      var rt = B().readRuns(n);
      if (B().runsToText(rt).trim()) {
        out.push(B().blank(map.ty, map.lv ? { rt: rt, lv: map.lv } : { rt: rt }));
      } else {
        walk(n, out);
      }
    }
    return out;
  }

  function fromHtml(html) {
    var doc;
    try { doc = new DOMParser().parseFromString(String(html || ''), 'text/html'); }
    catch (e) { return []; }
    if (!doc || !doc.body) return [];
    stripDangerous(doc.body);
    var blocks = walk(doc.body, []);
    return merge(blocks);
  }

  function merge(blocks) {
    var out = [];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i], last = out[out.length - 1];
      if (b.ty === 'p' && last && last.ty === 'p') {
        var lastTxt = B().runsToText(last.rt);
        if (lastTxt && !/\s$/.test(lastTxt)) last.rt.push({ s: ' ' });
        last.rt = last.rt.concat(b.rt);
        continue;
      }
      out.push(b);
    }
    return out;
  }

  /*@3.NOSJ3.4*/
  function mdRuns(s0) {
    var out = [];
    var re = /(`[^`\n]+`|\*\*[^*\n]+\*\*|~~[^~\n]+~~|\*[^*\n]+\*|__[^_\n]+__|_[^_\n]+_)/g;
    var at = 0, m;
    while ((m = re.exec(s0))) {
      if (m.index > at) out.push({ s: s0.slice(at, m.index) });
      var t = m[0];
      if (t.charAt(0) === '`') out.push({ s: t.slice(1, -1), c: 1 });
      else if (t.slice(0, 2) === '**' || t.slice(0, 2) === '__') out.push({ s: t.slice(2, -2), b: 1 });
      else if (t.slice(0, 2) === '~~') out.push({ s: t.slice(2, -2), st: 1 });
      else out.push({ s: t.slice(1, -1), i: 1 });
      at = m.index + t.length;
    }
    if (at < s0.length) out.push({ s: s0.slice(at) });
    return out.filter(function (r) { return r.s; });
  }

  function fromText(text) {
    var lines = String(text == null ? '' : text).split(/\r?\n/);
    var out = [];
    var buf = [];
    var fence = null;
    function flush() {
      if (!buf.length) return;
      out.push(B().blank('p', { rt: mdRuns(buf.join(' ')) }));
      buf = [];
    }
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (fence) {
        if (/^\s*```/.test(ln)) {
          out.push(B().blank('code', { src: fence.src.join(String.fromCharCode(10)), lang: fence.lang }));
          fence = null;
        } else fence.src.push(ln);
        continue;
      }
      var mf = /^\s*```\s*(\w*)\s*$/.exec(ln);
      if (mf) { flush(); fence = { lang: mf[1] || '', src: [] }; continue; }
      if (!ln.trim()) { flush(); continue; }
      var mh = /^\s*(#{1,3})\s+(.*)$/.exec(ln);
      if (mh) {
        flush();
        out.push(B().blank('h', { lv: Math.min(3, mh[1].length + 1), rt: mdRuns(mh[2]) }));
        continue;
      }
      var mq = /^\s*>\s?(.*)$/.exec(ln);
      if (mq) {
        flush();
        var lastQ = out[out.length - 1];
        if (lastQ && lastQ.ty === 'quote') lastQ.rt = lastQ.rt.concat([{ s: ' ' }], mdRuns(mq[1]));
        else out.push(B().blank('quote', { rt: mdRuns(mq[1]) }));
        continue;
      }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(ln)) { flush(); out.push(B().blank('hr')); continue; }
      var mo = /^\s*\d+[.)]\s+(.*)$/.exec(ln);
      if (mo) {
        flush();
        var lastO = out[out.length - 1];
        if (lastO && lastO.ty === 'ol') lastO.items.push({ rt: mdRuns(mo[1]) });
        else out.push(B().blank('ol', { items: [{ rt: mdRuns(mo[1]) }] }));
        continue;
      }
      var m = /^\s*[-*\u2022]\s+(.*)$/.exec(ln);
      if (m) {
        flush();
        var last = out[out.length - 1];
        if (last && last.ty === 'ul') last.items.push({ rt: mdRuns(m[1]) });
        else out.push(B().blank('ul', { items: [{ rt: mdRuns(m[1]) }] }));
        continue;
      }
      buf.push(ln.trim());
    }
    if (fence) out.push(B().blank('code', { src: fence.src.join(String.fromCharCode(10)), lang: fence.lang }));
    flush();
    return out;
  }

  function fromClipboard(dt) {
    if (!dt) return [];
    /*@3.NOSJ3.3*/
    var files = dt.files;
    if (files && files.length) {
      for (var i = 0; i < files.length; i++) {
        if (/^image\//.test(files[i].type)) return { rejectedImage: true, blocks: [] };
      }
    }
    var items = dt.items;
    if (items) {
      for (var j = 0; j < items.length; j++) {
        if (items[j].kind === 'file' && /^image\//.test(items[j].type)) {
          return { rejectedImage: true, blocks: [] };
        }
      }
    }
    var html = dt.getData('text/html');
    var plain = dt.getData('text/plain');
    /*@3.NOSJ3.5*/
    if (html && html.trim()) {
      if (plain && mdish(plain) && styledSoupOnly(html)) {
        return { blocks: fromText(plain) };
      }
      return { blocks: fromHtml(html) };
    }
    return { blocks: fromText(plain) };
  }

  function mdish(txt) {
    return /`[^`\n]+`|\*\*[^*\n]+\*\*|~~[^~\n]+~~|^#{1,3}\s|^```|^>\s/m.test(String(txt || ''));
  }

  function styledSoupOnly(html) {
    var doc;
    try { doc = new DOMParser().parseFromString(String(html), 'text/html'); }
    catch (e) { return false; }
    if (!doc || !doc.body) return false;
    return !doc.body.querySelector(
      'b,strong,em,i,u,s,del,code,mark,a,h1,h2,h3,h4,h5,h6,li,table,img,blockquote,pre'
    );
  }

  window.GardenNotesSanitize = {
    fromHtml: fromHtml,
    fromText: fromText,
    fromClipboard: fromClipboard,
    stripDangerous: stripDangerous
  };
})();
