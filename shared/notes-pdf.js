;(function () {
  'use strict';

  var BASE = (function () {
    var sc = document.currentScript;
    return sc && sc.src ? sc.src.replace(/notes-pdf\.js(\?.*)?$/, '') : 'shared/';
  })();

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') !== 'en'; }
    catch (e) { return true; }
  }
  function L(a, e) { return isAr() ? a : e; }

  /*@3.NOPJ2.1*/

  var DUAL = '\u0626\u0628\u062A\u062B\u062C\u062D\u062E\u0633\u0634\u0635' +
             '\u0636\u0637\u0638\u0639\u063A\u0641\u0642\u0643\u0644\u0645' +
             '\u0646\u0647\u064A\u067E\u0686\u06A9\u06AF\u06CC';
  var ISO = {
    0x0621: 0xFE80, 0x0622: 0xFE81, 0x0623: 0xFE83, 0x0624: 0xFE85,
    0x0625: 0xFE87, 0x0626: 0xFE89, 0x0627: 0xFE8D, 0x0628: 0xFE8F,
    0x0629: 0xFE93, 0x062A: 0xFE95, 0x062B: 0xFE99, 0x062C: 0xFE9D,
    0x062D: 0xFEA1, 0x062E: 0xFEA5, 0x062F: 0xFEA9, 0x0630: 0xFEAB,
    0x0631: 0xFEAD, 0x0632: 0xFEAF, 0x0633: 0xFEB1, 0x0634: 0xFEB5,
    0x0635: 0xFEB9, 0x0636: 0xFEBD, 0x0637: 0xFEC1, 0x0638: 0xFEC5,
    0x0639: 0xFEC9, 0x063A: 0xFECD, 0x0641: 0xFED1, 0x0642: 0xFED5,
    0x0643: 0xFED9, 0x0644: 0xFEDD, 0x0645: 0xFEE1, 0x0646: 0xFEE5,
    0x0647: 0xFEE9, 0x0648: 0xFEED, 0x0649: 0xFEEF, 0x064A: 0xFEF1,
    0x0671: 0xFB50, 0x067E: 0xFB56, 0x0686: 0xFB7A, 0x0698: 0xFB8A,
    0x06A9: 0xFB8E, 0x06AF: 0xFB92, 0x06CC: 0xFBFC
  };
  var DUALSET = {};
  for (var _d = 0; _d < DUAL.length; _d++) DUALSET[DUAL.charCodeAt(_d)] = 1;
  var LAM = 0x0644;
  var ALEF = { 0x0622: 0xFEF5, 0x0623: 0xFEF7, 0x0625: 0xFEF9, 0x0627: 0xFEFB };

  /*@3.NOPJ2.2*/
  function isFormat(c) {
    return c === 0x0A || c === 0x0D || c === 0x09 || c === 0x00AD ||
           (c >= 0x200B && c <= 0x200F) || (c >= 0x202A && c <= 0x202E) ||
           (c >= 0x2060 && c <= 0x2064) || (c >= 0x2066 && c <= 0x2069) ||
           c === 0xFE0E || c === 0xFE0F || c === 0xFEFF;
  }

  function isMark(c) {
    return (c >= 0x064B && c <= 0x065F) || c === 0x0670 || c === 0x0640 ||
           (c >= 0x06D6 && c <= 0x06ED);
  }
  function isArabicLetter(c) { return ISO[c] != null; }

  function shape(text) {
    var cs = [], i;
    /*@3.NOPJ2.47*/
    for (i = 0; i < text.length; i++) {
      var cc = text.charCodeAt(i);
      if (cc >= 0xD800 && cc <= 0xDBFF && i + 1 < text.length) {
        var lo = text.charCodeAt(i + 1);
        if (lo >= 0xDC00 && lo <= 0xDFFF) {
          cs.push(0x10000 + ((cc - 0xD800) << 10) + (lo - 0xDC00));
          i++;
          continue;
        }
      }
      if (!isFormat(cc)) cs.push(cc);
    }
    var out = [];
    for (i = 0; i < cs.length; i++) {
      var c = cs[i];
      if (isMark(c) || !isArabicLetter(c)) { out.push({ g: c, u: [c] }); continue; }

      var j = i - 1;
      while (j >= 0 && isMark(cs[j])) j--;
      var prevJoins = j >= 0 && DUALSET[cs[j]] === 1;
      var k = i + 1;
      while (k < cs.length && isMark(cs[k])) k++;
      var nextC = k < cs.length ? cs[k] : 0;

      if (c === LAM && ALEF[nextC]) {
        var lig = ALEF[nextC] + (prevJoins ? 1 : 0);
        out.push({ g: lig, u: [LAM, nextC] });
        for (var m = i + 1; m < k; m++) out.push({ g: cs[m], u: [cs[m]] });
        i = k;
        continue;
      }

      var nextJoins = isArabicLetter(nextC);
      var iso = ISO[c], dual = DUALSET[c] === 1;
      var g = iso;
      if (prevJoins && nextJoins && dual) g = iso + 3;
      else if (prevJoins && nextJoins) g = iso + 1;
      else if (prevJoins) g = iso + 1;
      else if (nextJoins && dual) g = iso + 2;
      out.push({ g: g, u: [c] });
    }
    return out;
  }

  /*@3.NOPJ2.3*/

  var FACES = {};

  /*@3.NOPJ2.4*/
  /*@3.NOPJ2.21*/
  var FIDX = null, FBYFAM = {}, FBYID = {};
  /*@3.NOPJ2.46*/
  var FALLBACK = { a: 'cairo-400', b: 'cairo-700' };

  /*@3.NOPJ2.57*/
  var SYMFACES = [
    { id: 'garden-sym-latin-400', r: [[0x0100, 0x036F]] },
    { id: 'garden-sym-greek-400', r: [[0x0370, 0x04FF]] },
    { id: 'garden-sym-indic-400', r: [[0x0900, 0x097F]] },
    { id: 'garden-sym-punct-400', r: [[0x2000, 0x218F]] },
    { id: 'garden-sym-arrow-400', r: [[0x2190, 0x21FF]] },
    { id: 'garden-sym-math-400',  r: [[0x2200, 0x23FF]] },
    { id: 'garden-sym-shape-400', r: [[0x25A0, 0x27BF], [0x27F0, 0x27FF],
                                      [0x2B00, 0x2BFF]] }
  ];

  /*@3.NOPJ2.110*/
  var FONTFAIL = {};
  function fetchTry(url, kind) {
    var tries = 0;
    function again(why) {
      if (tries >= 3) throw new Error(kind + ' ' + why);
      return new Promise(function (k) { setTimeout(k, 250 * tries * tries); }).then(go);
    }
    function go() {
      tries++;
      return fetch(url, { credentials: 'same-origin' }).then(function (r) {
        if (r.ok) return r;
        if (r.status >= 500 || r.status === 408 || r.status === 429) return again(r.status);
        throw new Error(kind + ' ' + r.status);
      }, function (e) { return again((e && e.message) || 'net'); });
    }
    return go();
  }

  function loadIndex() {
    if (FIDX) return Promise.resolve(FIDX);
    return fetchTry(BASE + 'vendor/fonts/pdf/index.json', 'index').then(function (r) {
      return r.json();
    }).then(function (list) {
      FIDX = list || [];
      FBYFAM = {};
      FBYID = {};
      for (var i = 0; i < FIDX.length; i++) {
        var e = FIDX[i];
        FBYID[e.id] = e;
        var key = String(e.family).toLowerCase();
        if (!FBYFAM[key]) FBYFAM[key] = {};
        FBYFAM[key][e.weight] = e;
      }
      return FIDX;
    })['catch'](function () { FIDX = []; FBYFAM = {}; return FIDX; });
  }

  function famList(css) {
    return String(css || '').split(',').map(function (t) {
      return t.trim().replace(/^["']|["']$/g, '').toLowerCase();
    }).filter(Boolean);
  }

  function pickWeight(rec, weight) {
    var w = parseInt(weight, 10) || 400;
    if (rec[900] && w >= 800) return rec[900];
    if (rec[700] && w >= 600) return rec[700];
    if (rec[400]) return rec[400];
    var ks = Object.keys(rec);
    return ks.length ? rec[ks[0]] : null;
  }

  function hasArabic(t) {
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i);
      if ((c >= 0x0600 && c <= 0x06FF) || (c >= 0x0750 && c <= 0x077F) ||
          (c >= 0xFB50 && c <= 0xFEFF)) return true;
    }
    return false;
  }

  function faceIdFor(fam, weight, text) {
    var want = text ? hasArabic(text) : false;
    var list = famList(fam), i, rec, hit;
    var fallback = '';
    for (i = 0; i < list.length; i++) {
      rec = FBYFAM[list[i]];
      if (!rec) continue;
      hit = pickWeight(rec, weight);
      if (!hit) continue;
      if (want && !hit.ar && !hit.icon) { if (!fallback) fallback = hit.id; continue; }
      return hit.id;
    }
    for (i = 0; i < list.length; i++) {
      if (/mono|consolas|courier/.test(list[i]) && FBYFAM['jetbrains mono']) {
        hit = pickWeight(FBYFAM['jetbrains mono'], weight);
        if (hit && !want) return hit.id;
      }
    }
    var base = FBYFAM['cairo'] ? pickWeight(FBYFAM['cairo'], weight) : null;
    if (base) return base.id;
    return fallback || ((parseInt(weight, 10) || 400) >= 600 ? 'cairo-700' : 'cairo-400');
  }

  /*@3.NOPJ2.136*/
  function faceBase(id) {
    var e = FBYID && FBYID[id];
    return (e && e.base) ? e.base : BASE + 'vendor/fonts/pdf/';
  }
  function faceAlt(id) {
    var m = /-(\d+)$/.exec(id || '');
    var w = m ? (parseInt(m[1], 10) || 400) : 400;
    return w >= 600 ? 'cairo-700' : 'cairo-400';
  }
  function loadFace(id) {
    if (FACES[id]) return FACES[id];
    FACES[id] = Promise.all([
      fetchTry(faceBase(id) + id + '.ttf', 'ttf').then(function (r) {
        return r.arrayBuffer();
      }),
      fetchTry(faceBase(id) + id + '.json', 'meta').then(function (r) {
        return r.json();
      })
    ])['catch'](function (eF) {
      delete FACES[id];
      var alt = faceAlt(id);
      FONTFAIL[id] = (eF && eF.message) || 'fail';
      if (id === alt) throw eF;
      return loadFace(alt).then(function (f) {
        var c = {}, kC;
        for (kC in f) if (Object.prototype.hasOwnProperty.call(f, kC)) c[kC] = f[kC];
        c.used = {};
        return c;
      });
    }).then(function (p) {
      if (!Array.isArray(p)) return p;
      var meta = p[1];
      meta.ttf = new Uint8Array(p[0]);
      meta.blank = meta.blank || {};
      /*@3.NOPJ2.27*/
      meta.gid = function (cp) {
        var g = meta.cmap[cp];
        if (g != null) return meta.blank[g] ? 0 : g;
        var b = meta.baseOf[cp];
        if (b != null && meta.cmap[b] != null) {
          var g2 = meta.cmap[b];
          return meta.blank[g2] ? 0 : g2;
        }
        return 0;
      };
      /*@3.NOPJ2.50*/
      meta.sh = meta.sh || {};
      meta.shape = function (cp) {
        var v = meta.sh[cp];
        if (v == null) return null;
        return (typeof v === 'number') ? [v] : v;
      };
      meta.markw = meta.markw || {};
      meta.adv1 = function (gid) {
        var w = meta.adv[gid];
        return w == null ? 500 : w;
      };
      meta.used = {};
      return meta;
    })['catch'](function (e) { delete FACES[id]; throw e; });
    return FACES[id];
  }

  /*@3.NOPJ2.5*/

  function bytes(str) {
    var a = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) a[i] = str.charCodeAt(i) & 0xff;
    return a;
  }
  function concat(list) {
    var n = 0, i;
    for (i = 0; i < list.length; i++) n += list[i].length;
    var out = new Uint8Array(n), at = 0;
    for (i = 0; i < list.length; i++) { out.set(list[i], at); at += list[i].length; }
    return out;
  }
  function deflate(u8) {
    if (typeof CompressionStream !== 'function') return Promise.resolve(null);
    try {
      var cs = new CompressionStream('deflate');
      var w = cs.writable.getWriter();
      w.write(u8); w.close();
      return new Response(cs.readable).arrayBuffer()
        .then(function (b) { return new Uint8Array(b); })
        ['catch'](function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }
  /*@3.NOPJ2.6*/
  function pdfStr(s) {
    var t = String(s).replace(/[\r\n]/g, ' '), out = '';
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i);
      if (c === 92 || c === 40 || c === 41) out += '\\' + t.charAt(i);
      else if (c >= 32 && c < 127) out += t.charAt(i);
      else if (c < 256) out += '\\' + ('000' + c.toString(8)).slice(-3);
      else {
        out += '\\' + ('000' + (c >> 8).toString(8)).slice(-3) +
               '\\' + ('000' + (c & 0xff).toString(8)).slice(-3);
      }
    }
    return '(' + out + ')';
  }
  function utf16be(s) {
    var out = '\\376\\377';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      out += '\\' + ('000' + (c >> 8).toString(8)).slice(-3) +
             '\\' + ('000' + (c & 0xff).toString(8)).slice(-3);
    }
    return '(' + out + ')';
  }
  function hx(n, w) {
    var s = n.toString(16).toUpperCase();
    while (s.length < (w || 4)) s = '0' + s;
    return s;
  }
  function num(v) {
    var r = Math.round(v * 100) / 100;
    return (r === Math.floor(r)) ? String(r) : String(r);
  }

  function Doc() { this.objs = []; }
  Doc.prototype.add = function (body) { this.objs.push(body); return this.objs.length; };
  Doc.prototype.reserve = function () { this.objs.push(null); return this.objs.length; };
  Doc.prototype.set = function (id, body) { this.objs[id - 1] = body; };
  Doc.prototype.build = function (rootId, infoId) {
    var parts = [bytes('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n')];
    var at = parts[0].length, offs = [], i;
    for (i = 0; i < this.objs.length; i++) {
      var b = this.objs[i];
      if (b == null) b = bytes('<< >>');
      if (typeof b === 'string') b = bytes(b);
      var head = bytes((i + 1) + ' 0 obj\n');
      var tail = bytes('\nendobj\n');
      offs.push(at);
      parts.push(head, b, tail);
      at += head.length + b.length + tail.length;
    }
    var xref = at;
    var x = 'xref\n0 ' + (this.objs.length + 1) + '\n0000000000 65535 f \n';
    for (i = 0; i < offs.length; i++) {
      x += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
    }
    x += 'trailer\n<< /Size ' + (this.objs.length + 1) + ' /Root ' + rootId + ' 0 R' +
         (infoId ? (' /Info ' + infoId + ' 0 R') : '') + ' >>\nstartxref\n' + xref + '\n%%EOF\n';
    parts.push(bytes(x));
    return concat(parts);
  };

  /*@3.NOPJ2.7*/

  var PT = 72 / 96;
  var MISSING = {};

  /*@3.NOPJ2.20*/
  var COLC = {}, COLCX = null;

  function solveColor(css) {
    if (!COLCX) {
      var cv = document.createElement('canvas');
      cv.width = 2; cv.height = 1;
      COLCX = cv.getContext('2d', { willReadFrequently: true });
      if (!COLCX) return null;
    }
    var x = COLCX;
    var out = [0, 0, 0], a = 1, k;
    var got = [null, null];
    var beds = ['#ffffff', '#000000'];
    for (k = 0; k < 2; k++) {
      x.globalCompositeOperation = 'source-over';
      x.fillStyle = beds[k];
      x.fillRect(0, 0, 2, 1);
      x.fillStyle = '#000000';
      x.fillStyle = css;
      if (String(x.fillStyle).toLowerCase() === '#000000' && !/^\s*(#000|black|rgba?\(0,\s*0,\s*0)/i.test(css)) {
        /*@3.NOPJ2.28*/
        if (k === 0) return null;
      }
      x.fillRect(0, 0, 2, 1);
      var d = x.getImageData(0, 0, 1, 1).data;
      got[k] = [d[0] / 255, d[1] / 255, d[2] / 255];
    }
    var sum = 0;
    for (k = 0; k < 3; k++) sum += 1 - (got[0][k] - got[1][k]);
    a = Math.max(0, Math.min(1, sum / 3));
    if (a < 0.004) return null;
    for (k = 0; k < 3; k++) out[k] = Math.max(0, Math.min(1, got[1][k] / a));
    return [out[0], out[1], out[2], a];
  }

  function rgbOf(css) {
    var key = String(css || '');
    if (!key) return null;
    if (COLC[key] !== undefined) return COLC[key];
    var res = null;
    var m = key.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      var p = m[1].split(/[,\s\/]+/).filter(function (t) { return t !== ''; })
        .map(function (t) { return parseFloat(t); });
      var al = p.length > 3 ? p[3] : 1;
      if (al > 0.02) res = [p[0] / 255, p[1] / 255, p[2] / 255, al];
    } else if (!/^(transparent|none|)$/i.test(key)) {
      res = solveColor(key);
      if (res && !(res[3] > 0.02)) res = null;
    }
    COLC[key] = res;
    return res;
  }

  var EMO_ANY = /[\u2190-\u21FF\u2300-\u23FF\u2460-\u24FF\u25A0-\u27BF\u2900-\u297F\u2B00-\u2BFF\u3030\u303D\u3297\u3299\uD83C-\uDBFF\uFE0F]/;
  function charRects(node) {
    var out = [], d = node.ownerDocument, s = node.data;
    for (var i = 0; i < s.length; i++) {
      var r = d.createRange();
      r.setStart(node, i); r.setEnd(node, i + 1);
      var b = r.getBoundingClientRect();
      out.push((b.width || b.height) ? b : null);
    }
    return out;
  }

  function harvestText(node, org, runs, emo) {
    var s = node.data;
    if (!s || !/\S/.test(s)) return;
    var d = node.ownerDocument;
    var full = d.createRange();
    full.selectNodeContents(node);
    var boxes = [].slice.call(full.getClientRects()).filter(function (r) {
      return r.width > 0.05 && r.height > 0.05;
    });
    if (!boxes.length) return;

    var el = node.parentElement;
    if (!el) return;
    /*@3.NOPJ2.98*/
    var st = null, tokKey = null;
    if (isTok(el) && el.parentNode) {
      var tc = TOKCS.get(el.parentNode);
      if (!tc) { tc = {}; TOKCS.set(el.parentNode, tc); }
      tokKey = el.className; st = tc[tokKey] || null;
      if (!st) {
        var csT = getComputedStyle(el);
        st = tc[tokKey] = { hid: csT.visibility === 'hidden' || csT.display === 'none' || parseFloat(csT.opacity) < 0.05,
                            col: rgbOf(csT.color) || [0, 0, 0, 1], size: parseFloat(csT.fontSize) || 12, fam: csT.fontFamily, wgt: csT.fontWeight,
                            deco: String(csT.textDecorationLine || csT.textDecoration || ''), dir: csT.direction };
      }
    }
    if (!st) {
      var cs = getComputedStyle(el);
      st = { hid: cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05,
             col: rgbOf(cs.color) || [0, 0, 0, 1], size: parseFloat(cs.fontSize) || 12, fam: cs.fontFamily, wgt: cs.fontWeight,
             deco: String(cs.textDecorationLine || cs.textDecoration || ''), dir: cs.direction };
    }
    if (st.hid) return;
    var col = st.col, size = st.size, famCss = st.fam, wCss = st.wgt, deco = st.deco, dirCss = st.dir;

    /*@3.NOPJ2.94*/
    var band = org.band || null;
    if (band) {
      boxes = boxes.filter(function (r) { return r.bottom > band.top - 0.5 && r.top < band.bottom + 0.5; });
      if (!boxes.length) return;
    }
    /*@3.NOPJ2.106*/
    var clipR = clipRectOf(el);
    if (clipR) {
      boxes = boxes.filter(function (r) { var my = (r.top + r.bottom) / 2; return my > clipR.top + 0.25 && my < clipR.bottom - 0.25; });
      if (!boxes.length) return;
    }
    var hasEmo = !!(emo && EMO_ANY.test(s));
    var i, k;
    /*@3.NOPJ2.100*/
    /*@3.NOPJ2.112*/
    var rmemo = null;
    var rectAt = function (at, len) {
      var key = (len || 1) === 1 ? at : null;
      if (key != null) { if (!rmemo) rmemo = {}; else if (rmemo[key] !== undefined) return rmemo[key]; }
      var rr = d.createRange();
      rr.setStart(node, at); rr.setEnd(node, Math.min(s.length, at + (len || 1)));
      var bb = rr.getBoundingClientRect();
      var out = (bb.width || bb.height) ? bb : null;
      if (key != null) rmemo[key] = out;
      return out;
    };
    /*@3.NOPJ2.101*/
    var lines = [], li, lq;
    for (li = 0; li < boxes.length; li++) {
      var bt = boxes[li].top, hitL = null;
      for (lq = lines.length - 1; lq >= 0 && lq >= lines.length - 3; lq--) { if (Math.abs(lines[lq].top - bt) < 0.6) { hitL = lines[lq]; break; } }
      if (!hitL) { hitL = { top: bt, bottom: boxes[li].bottom, idx: [] }; lines.push(hitL); }
      if (boxes[li].bottom > hitL.bottom) hitL.bottom = boxes[li].bottom;
      hitL.idx.push(li);
    }
    lines.sort(function (a, b) { return a.top - b.top; });
    var boxOf = function (r) {
      if (!r) return -1;
      var cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      var lo = 0, hi = lines.length - 1, ln = null;
      while (lo <= hi) {
        var m = (lo + hi) >> 1, L = lines[m];
        if (cy < L.top - 0.6) hi = m - 1; else if (cy > L.bottom + 0.6) lo = m + 1; else { ln = L; break; }
      }
      if (!ln) return -1;
      /*@3.NOPJ2.8*/
      var best = -1, bestW = Infinity, q, ix = ln.idx;
      for (q = 0; q < ix.length; q++) {
        var bx = boxes[ix[q]];
        if (cx < bx.left - 0.6 || cx > bx.right + 0.6) continue;
        if (bx.width < bestW) { bestW = bx.width; best = ix[q]; }
      }
      return best;
    };
    var ownerAt = function (at) {
      var q, o;
      for (q = at; q < s.length && q < at + 4; q++) { o = boxOf(rectAt(q)); if (o >= 0) return o; }
      return -2;
    };
    var owner = new Array(s.length);
    if (boxes.length === 1) {
      for (i = 0; i < s.length; i++) owner[i] = 0;
    } else {
      var at = 0, cur = ownerAt(0);
      if (cur < 0) cur = 0;
      while (at < s.length) {
        var lo = at + 1, hi = s.length;
        while (lo < hi) {
          var mid = (lo + hi) >> 1, o2 = ownerAt(mid);
          if (o2 === cur || o2 === -2) lo = mid + 1; else hi = mid;
        }
        for (i = at; i < lo; i++) owner[i] = cur;
        at = lo;
        /*@3.NOPJ2.9*/
        if (at < s.length) { cur = ownerAt(at); if (cur < 0) cur = owner[at - 1]; }
      }
    }

    /*@3.NOPJ2.60*/
    if (emo && hasEmo) {
      for (i = 0; i < s.length; i++) {
        var ecp = s.codePointAt(i);
        var wide = ecp > 0xFFFF;
        if (isEmojiCp(ecp)) {
          var eb = rectAt(i, wide ? 2 : 1);
          if (eb && eb.width > 1 && eb.height > 1) {
            emo.push({ cp: ecp,
                       x: eb.left - org.left, y: eb.top - org.top,
                       w: eb.width, h: eb.height, size: size });
          }
        }
        if (wide) i++;
      }
    }

    /*@3.NOPJ2.128*/
    var mjBase = null;
    if (el.nodeName === 'MJX-UTEXT') mjBase = el.getBoundingClientRect().top + (parseFloat(getComputedStyle(el).paddingTop) || 0) - org.top;
    for (k = 0; k < boxes.length; k++) {
      var txt = '';
      for (i = 0; i < owner.length; i++) if (owner[i] === k) txt += s.charAt(i);
      if (!/\S/.test(txt)) continue;
      var box = boxes[k];
      runs.push({
        t: txt,
        face: faceIdFor(famCss, wCss, txt),
        famDbg: famCss, fam: famCss, wgt: wCss,
        x: box.left - org.left,
        yTop: box.top - org.top,
        yBase: mjBase != null ? mjBase : box.bottom - org.top - (box.height - size * 0.78) / 2,
        w: box.width,
        h: box.height,
        size: size, col: col, dir: dirCss,
        under: /underline/.test(deco), strike: /line-through/.test(deco)
      });
    }
  }

  function radsOf(cs, r) {
    var ks = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'];
    return ks.map(function (k) {
      var v = String(cs[k] || '0').split(/\s+/)[0], f = parseFloat(v);
      if (!isFinite(f)) return 0;
      if (/%$/.test(v)) f = f / 100 * Math.min(r.width, r.height);
      return Math.max(0, f);
    });
  }
  function radOne(a) { return (a[0] === a[1] && a[1] === a[2] && a[2] === a[3]) ? a[0] : a; }
  /*@3.NOPJ2.124*/
  function cutRad(b, cutTop, cutBot) {
    if (Array.isArray(b.rad)) {
      var q = b.rad.slice();
      if (cutTop) { q[0] = 0; q[1] = 0; }
      b.rad = q;
      if (b.bw) { var w = b.bw.slice(); if (cutTop) w[0] = 0; if (cutBot && !w[2]) w[2] = Math.max(w[1], w[3]); b.bw = w; }
    } else if (b.rad > b.h / 2) b.rad = 0;
  }
  function roundRect(x, y, w, h, r) {
    if (Array.isArray(r)) return roundRect4(x, y, w, h, r);
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (!r) return num(x) + ' ' + num(y) + ' ' + num(w) + ' ' + num(h) + ' re\n';
    var k = r * 0.5523;
    return num(x + r) + ' ' + num(y) + ' m\n' +
      num(x + w - r) + ' ' + num(y) + ' l\n' +
      num(x + w - r + k) + ' ' + num(y) + ' ' + num(x + w) + ' ' + num(y + r - k) + ' ' + num(x + w) + ' ' + num(y + r) + ' c\n' +
      num(x + w) + ' ' + num(y + h - r) + ' l\n' +
      num(x + w) + ' ' + num(y + h - r + k) + ' ' + num(x + w - r + k) + ' ' + num(y + h) + ' ' + num(x + w - r) + ' ' + num(y + h) + ' c\n' +
      num(x + r) + ' ' + num(y + h) + ' l\n' +
      num(x + r - k) + ' ' + num(y + h) + ' ' + num(x) + ' ' + num(y + h - r + k) + ' ' + num(x) + ' ' + num(y + h - r) + ' c\n' +
      num(x) + ' ' + num(y + r) + ' l\n' +
      num(x) + ' ' + num(y + r - k) + ' ' + num(x + r - k) + ' ' + num(y) + ' ' + num(x + r) + ' ' + num(y) + ' c\n';
  }

  function roundRect4(x, y, w, h, r) {
    var m = Math.min(w / 2, h / 2), K = 0.5523;
    var tl = Math.max(0, Math.min(r[0], m)), tr = Math.max(0, Math.min(r[1], m));
    var br = Math.max(0, Math.min(r[2], m)), bl = Math.max(0, Math.min(r[3], m));
    var T = y + h, R = x + w;
    return num(x + tl) + ' ' + num(T) + ' m\n' +
      num(R - tr) + ' ' + num(T) + ' l\n' +
      (tr ? num(R - tr + tr * K) + ' ' + num(T) + ' ' + num(R) + ' ' + num(T - tr + tr * K) + ' ' + num(R) + ' ' + num(T - tr) + ' c\n' : '') +
      num(R) + ' ' + num(y + br) + ' l\n' +
      (br ? num(R) + ' ' + num(y + br - br * K) + ' ' + num(R - br + br * K) + ' ' + num(y) + ' ' + num(R - br) + ' ' + num(y) + ' c\n' : '') +
      num(x + bl) + ' ' + num(y) + ' l\n' +
      (bl ? num(x + bl - bl * K) + ' ' + num(y) + ' ' + num(x) + ' ' + num(y + bl - bl * K) + ' ' + num(x) + ' ' + num(y + bl) + ' c\n' : '') +
      num(x) + ' ' + num(T - tl) + ' l\n' +
      (tl ? num(x) + ' ' + num(T - tl + tl * K) + ' ' + num(x + tl - tl * K) + ' ' + num(T) + ' ' + num(x + tl) + ' ' + num(T) + ' c\n' : '') +
      'h\n';
  }

  var GRADC = {};
  function gradMean(bgi) {
    var s = String(bgi || '');
    if (!s || s === 'none' || s.indexOf('gradient(') < 0) return null;
    if (GRADC[s] !== undefined) return GRADC[s];
    var m = s.match(/(?:oklab|oklch|rgba?|hsla?|color|lab|lch)\([^)]*\)|#[0-9a-f]{3,8}\b|\btransparent\b/gi) || [];
    var acc = [0, 0, 0, 0], n = 0, i, c;
    for (i = 0; i < m.length; i++) {
      c = /^transparent$/i.test(m[i]) ? [0, 0, 0, 0] : rgbOf(m[i]);
      if (!c) continue;
      acc[0] += c[0] * c[3]; acc[1] += c[1] * c[3]; acc[2] += c[2] * c[3]; acc[3] += c[3]; n++;
    }
    var res = null;
    if (n && acc[3] > 0.02) res = [acc[0] / acc[3], acc[1] / acc[3], acc[2] / acc[3], acc[3] / n];
    GRADC[s] = res;
    return res;
  }

  /*@3.NOPJ2.95*/
  var TOKCS = new WeakMap();
  function isTok(el) { return el.nodeName === 'SPAN' && typeof el.className === 'string' && el.className.indexOf('cd-') === 0; }
  function offBand(r, band) { return !!band && (r.bottom < band.top - 0.5 || r.top > band.bottom + 0.5); }
  var BARE_INLINE = { SPAN: 1, B: 1, I: 1, EM: 1, STRONG: 1, U: 1, S: 1, SUB: 1, SUP: 1, BR: 1, WBR: 1, BDI: 1, BDO: 1 };
  var CLIPS = null;
  function clipRectOf(el) {
    if (!el || !el.closest) return null;
    var c = el.closest('[data-clip]');
    if (!c) return null;
    if (!CLIPS) CLIPS = new WeakMap();
    var r = CLIPS.get(c);
    if (!r) { r = c.getBoundingClientRect(); CLIPS.set(c, r); }
    return r;
  }
  function clampRect(r, c) {
    if (!c) return r;
    var top = Math.max(r.top, c.top), bot = Math.min(r.bottom, c.bottom);
    if (bot - top < 0.5) return null;
    return { left: r.left, right: r.right, top: top, bottom: bot, width: r.width, height: bot - top };
  }
  function harvestBoxes(rootEl, org, boxes) {
    var all = rootEl.querySelectorAll('*'), band = org.band || null;
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (isTok(el)) continue;
      /*@3.NOPJ2.109*/
      if (BARE_INLINE[el.tagName] && !el.className && !el.hasAttribute('style')) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 0.5 || r.height < 0.5) continue;
      if (r.width > 4000 || r.height > 40000) continue;
      if (offBand(r, band)) continue;
      var clipB = el.hasAttribute('data-clip') ? null : clipRectOf(el);
      if (clipB) { r = clampRect(r, clipB); if (!r) continue; }
      var cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (parseFloat(cs.opacity) < 0.05) continue;

      var bg = rgbOf(cs.backgroundColor);
      /*@3.NOPJ2.127*/
      var ruled = cs.getPropertyValue('--ne-ruled').trim() === '1', cue = cs.getPropertyValue('--ne-cue').trim() === '1';
      if ((ruled || cue) && el.parentElement) {
        var pcs = getComputedStyle(el.parentElement);
        if (ruled && pcs.getPropertyValue('--ne-ruled').trim() === '1') ruled = false;
        if (cue && pcs.getPropertyValue('--ne-cue').trim() === '1') cue = false;
      }
      /*@3.NOPJ2.84*/
      if (!bg && !ruled) bg = gradMean(cs.backgroundImage);
      if (ruled) {
        var r0 = el.getBoundingClientRect(), rlh = parseFloat(cs.lineHeight) || 0, rcol = rgbOf(cs.columnRuleColor);
        var rl = r0.left + (parseFloat(cs.paddingLeft) || 0), rw = r0.width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
        var rb = r0.bottom - (parseFloat(cs.paddingBottom) || 0) + 0.5;
        if (rlh > 4 && rcol && rw > 1) {
          for (var ry = r0.top + (parseFloat(cs.paddingTop) || 0) + rlh; ry <= rb; ry += rlh) {
            if (ry - 1 < r.top - 0.5 || ry > r.bottom + 0.5) continue;
            boxes.push({ kind: 'fill', x: rl - org.left, y: ry - 1 - org.top, w: rw, h: 1, col: rcol, rad: 0 });
          }
        }
      }
      if (cs.display === 'inline') {
        var frs = [].slice.call(el.getClientRects()).filter(function (q) { return q.width >= 0.5 && q.height >= 0.5 && !offBand(q, band); });
        if (frs.length > 1) {
          var fbg = rgbOf(cs.backgroundColor) || gradMean(cs.backgroundImage);
          if (!fbg) continue;
          var frad = radOne(radsOf(cs, frs[0]));
          for (var fq = 0; fq < frs.length; fq++) {
            var fr = clipB ? clampRect(frs[fq], clipB) : frs[fq];
            if (!fr) continue;
            boxes.push({ kind: 'fill', x: fr.left - org.left, y: fr.top - org.top, w: fr.width, h: fr.height, col: fbg,
                         rad: cs.boxDecorationBreak === 'clone' || cs.webkitBoxDecorationBreak === 'clone' ? frad : 0 });
          }
          continue;
        }
      }
      var rads = radsOf(cs, r), rad = radOne(rads);
      var anyR = rads[0] > 0.5 || rads[1] > 0.5 || rads[2] > 0.5 || rads[3] > 0.5;
      if (bg) {
        boxes.push({ kind: 'fill', x: r.left - org.left, y: r.top - org.top,
                     w: r.width, h: r.height, col: bg, rad: rad });
      }
      if (cue) {
        var rtlC = cs.direction === 'rtl', cw = parseFloat(rtlC ? cs.paddingRight : cs.paddingLeft) || 0;
        var cbg = rgbOf(cs.getPropertyValue('--ne-cue-bg').trim()), cln = rgbOf(cs.columnRuleColor);
        if (cw > 2) {
          var cx = rtlC ? r.right - cw : r.left, crad = anyR ? (rtlC ? [0, rads[1], rads[2], 0] : [rads[0], 0, 0, rads[3]]) : 0;
          if (cbg) boxes.push({ kind: 'fill', x: cx - org.left, y: r.top - org.top, w: cw, h: r.height, col: cbg, rad: crad });
          if (cln) boxes.push({ kind: 'fill', x: (rtlC ? cx : cx + cw - 1) - org.left, y: r.top - org.top, w: 1, h: r.height, col: cln, rad: 0 });
        }
      }
      var sides = [['Top', 0], ['Right', 1], ['Bottom', 2], ['Left', 3]];
      if (anyR && Array.isArray(rad)) {
        var ringW = [0, 0, 0, 0], ringC = null, ringOk = true, sr;
        for (sr = 0; sr < sides.length; sr++) {
          var nmR = sides[sr][0], bwR = parseFloat(cs['border' + nmR + 'Width']) || 0;
          if (bwR < 0.2 || cs['border' + nmR + 'Style'] === 'none') continue;
          var bcR = rgbOf(cs['border' + nmR + 'Color']);
          if (!bcR) continue;
          if (ringC && (bcR[0] !== ringC[0] || bcR[1] !== ringC[1] || bcR[2] !== ringC[2] || Math.abs(bcR[3] - ringC[3]) > 0.01)) { ringOk = false; break; }
          ringC = bcR; ringW[sr] = bwR;
        }
        if (ringOk) {
          if (ringC) boxes.push({ kind: 'ring', x: r.left - org.left, y: r.top - org.top, w: r.width, h: r.height, col: ringC, rad: rads, bw: ringW });
          continue;
        }
      }
      /*@3.NOPJ2.107*/
      if (anyR && !Array.isArray(rad)) {
        var bwU = parseFloat(cs.borderTopWidth) || 0, bcU = rgbOf(cs.borderTopColor), same = bwU >= 0.2 && !!bcU && cs.borderTopStyle !== 'none', sq;
        for (sq = 1; sq < sides.length && same; sq++) {
          var nmQ = sides[sq][0];
          if (Math.abs((parseFloat(cs['border' + nmQ + 'Width']) || 0) - bwU) > 0.05 || cs['border' + nmQ + 'Style'] !== cs.borderTopStyle) same = false;
          var bcQ = rgbOf(cs['border' + nmQ + 'Color']);
          if (!bcQ || bcQ[0] !== bcU[0] || bcQ[1] !== bcU[1] || bcQ[2] !== bcU[2] || Math.abs(bcQ[3] - bcU[3]) > 0.01) same = false;
        }
        if (same) {
          boxes.push({ kind: 'stroke', x: r.left - org.left, y: r.top - org.top, w: r.width, h: r.height, col: bcU, rad: rad, bw: bwU });
          continue;
        }
      }
      for (var s = 0; s < sides.length; s++) {
        var nm = sides[s][0];
        var bw = parseFloat(cs['border' + nm + 'Width']) || 0;
        if (bw < 0.2) continue;
        if (cs['border' + nm + 'Style'] === 'none') continue;
        var bc = rgbOf(cs['border' + nm + 'Color']);
        if (!bc) continue;
        var bx = r.left - org.left, by = r.top - org.top, bwid = r.width, bhei = r.height;
        if (nm === 'Top') boxes.push({ kind: 'fill', x: bx, y: by, w: bwid, h: bw, col: bc, rad: 0 });
        else if (nm === 'Bottom') boxes.push({ kind: 'fill', x: bx, y: by + bhei - bw, w: bwid, h: bw, col: bc, rad: 0 });
        else if (nm === 'Left') boxes.push({ kind: 'fill', x: bx, y: by, w: bw, h: bhei, col: bc, rad: 0 });
        else boxes.push({ kind: 'fill', x: bx + bwid - bw, y: by, w: bw, h: bhei, col: bc, rad: 0 });
      }
    }
  }

  function harvestLinks(rootEl, org, links, dests) {
    var as = rootEl.querySelectorAll('a[href]');
    var i, r;
    for (i = 0; i < as.length; i++) {
      var href = as[i].getAttribute('href') || '';
      var nl = as[i].getAttribute('data-nl') || '';
      var target = nl || href;
      r = as[i].getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (target.charAt(0) === '#') {
        links.push({ kind: 'goto', to: decodeURIComponent(target.slice(1)),
                     x: r.left - org.left, y: r.top - org.top, w: r.width, h: r.height });
      } else if (/^https:\/\//i.test(href)) {
        var safe = href;
        try { safe = encodeURI(decodeURI(href)); } catch (eU) { safe = encodeURI(href); }
        links.push({ kind: 'uri', uri: safe,
                     x: r.left - org.left, y: r.top - org.top, w: r.width, h: r.height });
      }
    }
    var ided = rootEl.querySelectorAll('[id]');
    for (i = 0; i < ided.length; i++) {
      var id = ided[i].id;
      if (!id || dests[id]) continue;
      r = ided[i].getBoundingClientRect();
      dests[id] = { y: r.top - org.top, x: r.left - org.left };
    }
  }

  function harvestOutline(rootEl, org, marks) {
    var hs = rootEl.querySelectorAll('.ne-b-h');
    for (var i = 0; i < hs.length; i++) {
      var el = hs[i];
      var ed = el.querySelector('[contenteditable], h1, h2, h3, h4, h5, h6') || el;
      var txt = (ed.textContent || '').trim();
      if (!txt) continue;
      var tag = (el.querySelector('h1,h2,h3,h4,h5,h6') || {}).tagName || 'H2';
      var r = el.getBoundingClientRect();
      marks.push({ t: txt.slice(0, 120), lv: parseInt(String(tag).slice(1), 10) || 2,
                   y: r.top - org.top, id: el.id || '' });
    }
  }

  /*@3.NOPJ2.22*/
  var QUOTED = /^"([\s\S]*)"$/;
  var BLANKS = /[\s\u200b]/g;

  /*@3.NOPJ2.37*/
  function pseudoBox(r, cs, es, size, text, org, before, el) {
    var nv = function (v) { var f = parseFloat(v); return isFinite(f) ? f : null; };
    var bl = nv(es.borderLeftWidth) || 0, br = nv(es.borderRightWidth) || 0;
    var bt = nv(es.borderTopWidth) || 0;
    var pw = nv(cs.width), ph = nv(cs.height);
    var w = (pw != null && pw > 0.5) ? pw : Math.min(r.width, size * 1.35 * text.length);
    var h = (ph != null && ph > 0.5) ? ph : r.height;
    var x, y = r.top, pos = cs.position;
    /*@3.NOPJ2.130*/
    if (pos === 'absolute' && el && es.position === 'static' && es.transform === 'none') {
      var cb = el.parentElement, ccs = null;
      while (cb && cb.nodeType === 1) { ccs = getComputedStyle(cb); if (ccs.position !== 'static' || ccs.transform !== 'none') break; cb = cb.parentElement; }
      if (cb && ccs) {
        r = cb.getBoundingClientRect();
        bl = nv(ccs.borderLeftWidth) || 0; br = nv(ccs.borderRightWidth) || 0; bt = nv(ccs.borderTopWidth) || 0;
        if (ph == null || ph <= 0.5) h = el.getBoundingClientRect().height;
      }
    }
    if (pos === 'absolute' || pos === 'fixed') {
      var lf = nv(cs.left), rt = nv(cs.right), tp = nv(cs.top);
      if (rt != null && (cs.direction === 'rtl' || es.direction === 'rtl')) x = r.right - br - rt - (nv(cs.marginRight) || 0) - w;
      else if (lf != null) x = r.left + bl + lf + (nv(cs.marginLeft) || 0);
      else if (rt != null) x = r.right - br - rt - (nv(cs.marginRight) || 0) - w;
      else x = r.left;
      if (tp != null) y = r.top + bt + tp + (nv(cs.marginTop) || 0);
    } else {
      x = (cs.direction === 'rtl' || es.direction === 'rtl') ? (r.right - w) : r.left;
    }
    /*@3.NOPJ2.126*/
    var startEdge = !!(before && text && cs.display === 'inline' && pos !== 'absolute' && pos !== 'fixed' && es.textAlign !== 'center');
    var rtlS = (cs.direction === 'rtl' || es.direction === 'rtl');
    if (startEdge) x = rtlS ? (r.right - br - (nv(es.paddingRight) || 0) - w) : (r.left + bl + (nv(es.paddingLeft) || 0));
    var hug = !!(el && before && text && cs.display === 'inline' && pos !== 'absolute' && pos !== 'fixed' && es.textAlign === 'center');
    if (hug) {
      var tw = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT), tn, ti;
      while ((tn = tw.nextNode())) { ti = tn.data.search(/\S/); if (ti >= 0) break; }
      if (tn) {
        var hr = el.ownerDocument.createRange(); hr.setStart(tn, ti); hr.setEnd(tn, ti + 1);
        var hq = hr.getBoundingClientRect();
        if (hq.width > 0) x = rtlS ? hq.right : hq.left - w;
      }
    }
    var tm = String(cs.transform || '').match(/^matrix\(([^)]+)\)$/);
    if (tm) {
      var tv = tm[1].split(',').map(parseFloat);
      if (tv.length === 6 && isFinite(tv[4]) && isFinite(tv[5])) { x += tv[4]; y += tv[5]; }
    }
    /*@3.NOPJ2.38*/
    var ta = cs.textAlign;
    var align = (ta === 'center') ? 'c' : ((ta === 'right' || ta === 'end') ? 'e' : '');
    if (startEdge || hug) align = hug ? '' : (rtlS ? 'e' : '');
    return { x: x - org.left, y: y - org.top, w: w, h: h, align: align };
  }

  /*@3.NOPJ2.99*/
  var PSEUDO_SEL = new WeakMap();
  function topCommas(s) {
    var out = [], d = 0, a = 0, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      if (c === '(' || c === '[') d++;
      else if (c === ')' || c === ']') d--;
      else if (c === ',' && d === 0) { out.push(s.slice(a, i)); a = i + 1; }
    }
    out.push(s.slice(a));
    return out;
  }
  function pseudoSelectors(d) {
    var hit = PSEUDO_SEL.get(d);
    if (hit) return hit;
    var out = [], seen = {}, i, rules;
    var re = /::?(before|after)\b/;
    function walk(list) {
      var k, r, parts, q, sel;
      for (k = 0; k < list.length; k++) {
        r = list[k];
        if (r.cssRules && r.cssRules.length && !r.selectorText) { walk(r.cssRules); continue; }
        if (!r.selectorText || !re.test(r.selectorText)) continue;
        /*@3.NOPJ2.131*/
        parts = topCommas(r.selectorText);
        for (q = 0; q < parts.length; q++) {
          if (!re.test(parts[q])) continue;
          sel = parts[q].replace(/::?(before|after)\b/g, '').trim();
          if (!sel || seen[sel]) continue;
          try { d.querySelector(sel); } catch (eS) { continue; }
          seen[sel] = 1; out.push(sel);
        }
      }
    }
    for (i = 0; i < d.styleSheets.length; i++) {
      try { rules = d.styleSheets[i].cssRules; } catch (eR) { rules = null; }
      if (rules) walk(rules);
    }
    PSEUDO_SEL.set(d, out);
    return out;
  }
  /*@3.NOPJ2.129*/
  function maskPic(cs, col, pb, imgs, pend) {
    var mk = String(cs.webkitMaskImage || cs.maskImage || '');
    var mm = mk.match(/url\("(data:image\/svg\+xml[^"]*)"\)/) || mk.match(/url\((data:image\/svg\+xml[^)"']*)\)/);
    if (!mm || !imgs || !pend) return false;
    var svg;
    try { svg = decodeURIComponent(mm[1].replace(/^data:image\/svg\+xml(?:;[^,]*)?,/, '')); } catch (eD) { return false; }
    if (!/^\s*<svg[\s>]/.test(svg)) return false;
    var hex = 'rgb(' + Math.round(col[0] * 255) + ',' + Math.round(col[1] * 255) + ',' + Math.round(col[2] * 255) + ')';
    svg = svg.replace(/(['"])(?:black|#000|#000000)\1/gi, '$1' + hex + '$1')
             .replace(/<svg\b/, '<svg width="' + Math.round(pb.w * 4) + '" height="' + Math.round(pb.h * 4) + '" preserveAspectRatio="xMidYMid meet" fill="' + hex + '" fill-opacity="' + col[3] + '"');
    var pic = new Image();
    imgs.push({ el: pic, x: pb.x, y: pb.y, w: pb.w, h: pb.h, clip: null, cy: pb.y, ch: pb.h, alpha: 1 });
    pend.push(new Promise(function (res) {
      var t = setTimeout(res, 4000);
      pic.onload = function () { clearTimeout(t); res(); };
      pic.onerror = function () { clearTimeout(t); res(); };
      pic.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }));
    return true;
  }
  function harvestPseudo(rootEl, org, runs, boxes, imgs, pend) {
    var sels = pseudoSelectors(rootEl.ownerDocument);
    /*@3.NOPJ2.108*/
    var fa = [], rest = [], q;
    for (q = 0; q < sels.length; q++) { if (/\.fa-/.test(sels[q])) fa.push(sels[q]); else rest.push(sels[q]); }
    var all = rest.length ? Array.prototype.slice.call(rootEl.querySelectorAll(rest.join(','))) : [], i, k, band = org.band || null;
    if (fa.length) {
      var faSel = fa.join(','), cand = rootEl.querySelectorAll('[class*="fa-"]');
      for (q = 0; q < cand.length; q++) { try { if (cand[q].matches(faSel)) all.push(cand[q]); } catch (eM) {} }
    }
    var spots = ['::before', '::after'];
    for (i = 0; i < all.length; i++) {
      var el = all[i];
      if (isTok(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (offBand(r, band)) continue;
      var clipP = clipRectOf(el);
      if (clipP && ((r.top + r.bottom) / 2 <= clipP.top + 0.25 || (r.top + r.bottom) / 2 >= clipP.bottom - 0.25)) continue;
      for (k = 0; k < spots.length; k++) {
        var cs;
        try { cs = getComputedStyle(el, spots[k]); } catch (e) { continue; }
        if (!cs || cs.content === 'none' || cs.content === 'normal') continue;
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (parseFloat(cs.opacity) < 0.05) continue;
        var m = String(cs.content).match(QUOTED);
        /*@3.NOPJ2.85*/
        if (boxes && m && m[1] === '' ) {
          var pbg = rgbOf(cs.backgroundColor) || gradMean(cs.backgroundImage);
          if (pbg) {
            var pb = pseudoBox(r, cs, getComputedStyle(el), 0, '', org, k === 0, el);
            if (pb.w >= 0.5 && pb.h >= 0.5 && maskPic(cs, pbg, pb, imgs, pend)) continue;
            if (pb.w >= 0.5 && pb.h >= 0.5) {
              boxes.push({ kind: 'fill', x: pb.x, y: pb.y, w: pb.w, h: pb.h, col: pbg,
                           rad: Math.min(parseFloat(cs.borderTopLeftRadius) || 0, pb.w / 2, pb.h / 2) });
            }
          }
          continue;
        }
        if (!m || !m[1] || !m[1].replace(BLANKS, '')) continue;
        var size = parseFloat(cs.fontSize) || 12;
        var es = getComputedStyle(el);
        var col = rgbOf(cs.color) || rgbOf(es.color) || [0, 0, 0, 1];
        var box = pseudoBox(r, cs, es, size, m[1], org, k === 0, el);
        if (/grid|flex/.test(cs.display) && (cs.justifyItems === 'center' || cs.justifyContent === 'center')) box.align = 'c';
        if (boxes) {
          var tbg = rgbOf(cs.backgroundColor) || gradMean(cs.backgroundImage);
          var trad = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, box.w / 2, box.h / 2);
          if (tbg) boxes.push({ kind: 'fill', x: box.x, y: box.y, w: box.w, h: box.h, col: tbg, rad: trad });
          var tbw = parseFloat(cs.borderTopWidth) || 0, tbc = rgbOf(cs.borderTopColor);
          if (tbw >= 0.2 && tbc && cs.borderTopStyle !== 'none') boxes.push({ kind: 'stroke', x: box.x, y: box.y, w: box.w, h: box.h, col: tbc, rad: trad, bw: tbw });
        }
        runs.push({
          t: m[1],
          face: faceIdFor(cs.fontFamily, cs.fontWeight, m[1]),
          fam: cs.fontFamily, wgt: cs.fontWeight,
          x: box.x,
          yTop: box.y,
          yBase: el.nodeName === 'MJX-C' ? r.top - org.top + (parseFloat(cs.paddingTop) || 0) : box.y + box.h - (box.h - size * 0.78) / 2,
          w: box.w, h: box.h, size: size, col: col, dir: cs.direction,
          align: box.align,
          under: false, strike: false, fit: false, pz: 1
        });
      }
    }
  }

  var IMGFAIL = 0, IMGSKIP = 0;

  /*@3.NOPJ2.42*/
  function radiusOf(cs, r) {
    var v = String(cs.borderTopLeftRadius || '0').split(/\s+/)[0];
    var f = parseFloat(v);
    if (!isFinite(f)) return 0;
    if (/%$/.test(v)) f = f / 100 * Math.min(r.width, r.height);
    return Math.max(0, f);
  }

  /*@3.NOPJ2.102*/
  function clipOf(im) {
    var e = im, hit = null, i;
    for (i = 0; i < 9 && e; i++) {
      var cs = getComputedStyle(e);
      var clips = (i === 0) || (cs.overflow !== 'visible');
      if (clips) {
        var r = e.getBoundingClientRect();
        var rad = radiusOf(cs, r);
        if (!hit) hit = { r: r, rad: rad };
        else {
          var x0 = Math.max(hit.r.left, r.left), y0 = Math.max(hit.r.top, r.top);
          var x1 = Math.min(hit.r.right, r.right), y1 = Math.min(hit.r.bottom, r.bottom);
          hit = { r: { left: x0, top: y0, right: x1, bottom: y1, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) }, rad: Math.max(hit.rad, rad) };
        }
      }
      if (e.hasAttribute && e.hasAttribute('data-bid')) break;
      e = e.parentElement;
    }
    return hit;
  }

  function pctOf(v) {
    if (v == null) return 0.5;
    var f = parseFloat(v);
    if (/left|top/.test(v)) return 0;
    if (/right|bottom/.test(v)) return 1;
    if (/center/.test(v)) return 0.5;
    if (!isFinite(f)) return 0.5;
    return /%$/.test(String(v)) ? f / 100 : 0.5;
  }

  function fitBox(im, cs, box) {
    var f = cs.objectFit || 'fill';
    var nw = im.naturalWidth, nh = im.naturalHeight;
    if (!nw || !nh || f === 'fill') return box;
    var sc;
    if (f === 'cover') sc = Math.max(box.w / nw, box.h / nh);
    else if (f === 'none') sc = 1;
    else sc = Math.min(box.w / nw, box.h / nh);
    if (f === 'scale-down') sc = Math.min(sc, 1);
    var w = nw * sc, h = nh * sc;
    var pos = String(cs.objectPosition || '50% 50%').split(/\s+/);
    return { x: box.x + (box.w - w) * pctOf(pos[0]),
             y: box.y + (box.h - h) * pctOf(pos.length > 1 ? pos[1] : pos[0]),
             w: w, h: h };
  }


  function harvestImages(rootEl, org, imgs, pend) {
    var list = rootEl.querySelectorAll('img');
    for (var i = 0; i < list.length; i++) {
      var im = list[i];
      var r = im.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (!im.complete || !im.naturalWidth) { IMGSKIP++; continue; }
      var cs = getComputedStyle(im);
      var box = { x: r.left - org.left, y: r.top - org.top, w: r.width, h: r.height };
      var draw = fitBox(im, cs, box);
      var cl = clipOf(im);
      var clip = cl ? { x: cl.r.left - org.left, y: cl.r.top - org.top,
                        w: cl.r.width, h: cl.r.height, rad: cl.rad } : null;
      imgs.push({ el: im, x: draw.x, y: draw.y, w: draw.w, h: draw.h,
                  clip: clip, cy: box.y, ch: box.h });
    }
    /*@3.NOPJ2.86*/
    var svgs = rootEl.querySelectorAll('svg');
    for (var q = 0; q < svgs.length; q++) {
      var sv = svgs[q];
      if (sv.closest('svg') !== sv) continue;
      if (sv.closest('.mink') || sv.__vec) continue;
      var rs = sv.getBoundingClientRect();
      if (rs.width < 2 || rs.height < 2) continue;
      var cz = getComputedStyle(sv);
      if (cz.visibility === 'hidden' || cz.display === 'none' || parseFloat(cz.opacity) < 0.05) continue;
      var baked = bakeSvg(sv, rs.width, rs.height);
      if (!baked) continue;
      var pic = new Image();
      var recS = { el: pic, x: rs.left - org.left, y: rs.top - org.top, w: rs.width, h: rs.height,
                   clip: null, cy: rs.top - org.top, ch: rs.height, alpha: 1 };
      imgs.push(recS);
      if (pend) pend.push(new Promise(function (res) {
        var t = setTimeout(res, 4000);
        pic.onload = function () { clearTimeout(t); res(); };
        pic.onerror = function () { clearTimeout(t); res(); };
        pic.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(baked);
      }));
    }
  }

  var SVG_BAKE = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-dasharray',
                  'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'opacity', 'color',
                  'stop-color', 'stop-opacity', 'font-family', 'font-size', 'font-weight',
                  'text-anchor', 'dominant-baseline', 'display', 'visibility'];
  function bakeSvg(live, w, h) {
    var copy;
    try { copy = live.cloneNode(true); } catch (e) { return null; }
    var a = [live].concat([].slice.call(live.querySelectorAll('*')));
    var b = [copy].concat([].slice.call(copy.querySelectorAll('*')));
    if (a.length !== b.length) return null;
    var win = live.ownerDocument.defaultView;
    for (var i = 0; i < a.length; i++) {
      if (String(b[i].tagName).toLowerCase() === 'style') continue;
      var cs = win.getComputedStyle(a[i]), css = '', k, v;
      for (k = 0; k < SVG_BAKE.length; k++) {
        v = cs.getPropertyValue(SVG_BAKE[k]);
        if (v && v !== 'none' || (SVG_BAKE[k] === 'fill' || SVG_BAKE[k] === 'stroke')) css += SVG_BAKE[k] + ':' + v + ';';
      }
      if (css) b[i].setAttribute('style', css);
    }
    var bw = Math.max(1, Math.round(w)), bh = Math.max(1, Math.round(h));
    copy.setAttribute('width', String(bw));
    copy.setAttribute('height', String(bh));
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!copy.getAttribute('viewBox')) copy.setAttribute('viewBox', '0 0 ' + bw + ' ' + bh);
    try { return new XMLSerializer().serializeToString(copy); } catch (e2) { return null; }
  }

  /*@3.NOPJ2.115*/
  var SVG_SKIP = { defs: 1, marker: 1, symbol: 1, style: 1, title: 1, desc: 1, metadata: 1, clippath: 1, mask: 1,
                   pattern: 1, lineargradient: 1, radialgradient: 1, filter: 1, script: 1 };
  var SVG_SHAPE = { path: 1, rect: 1, circle: 1, ellipse: 1, line: 1, polyline: 1, polygon: 1 };
  var VEC_CAP = 60000;
  function pathSegs(d) {
    var toks = String(d || '').match(/[a-df-z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi) || [];
    var out = [], i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0, qx = 0, qy = 0, prev = '', n, a;
    var num = function () { return parseFloat(toks[i++]); };
    var isNum = function () { return i < toks.length && !/^[a-z]$/i.test(toks[i]); };
    while (i < toks.length) {
      if (/^[a-z]$/i.test(toks[i])) cmd = toks[i++];
      else if (!cmd) return null;
      var rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
      if (C === 'Z') { out.push(['Z']); x = sx; y = sy; prev = 'Z'; cmd = ''; continue; }
      if (!isNum()) return null;
      if (C === 'M') {
        x = (rel ? x : 0) + num(); y = (rel ? y : 0) + num(); sx = x; sy = y; out.push(['M', x, y]);
        cmd = rel ? 'l' : 'L'; prev = 'M'; continue;
      }
      if (C === 'L') { x = (rel ? x : 0) + num(); y = (rel ? y : 0) + num(); out.push(['L', x, y]); }
      else if (C === 'H') { x = (rel ? x : 0) + num(); out.push(['L', x, y]); }
      else if (C === 'V') { y = (rel ? y : 0) + num(); out.push(['L', x, y]); }
      else if (C === 'C' || C === 'S') {
        var x1, y1;
        if (C === 'C') { x1 = (rel ? x : 0) + num(); y1 = (rel ? y : 0) + num(); }
        else if (prev === 'C' || prev === 'S') { x1 = 2 * x - cx; y1 = 2 * y - cy; } else { x1 = x; y1 = y; }
        var x2 = (rel ? x : 0) + num(), y2 = (rel ? y : 0) + num(), x3 = (rel ? x : 0) + num(), y3 = (rel ? y : 0) + num();
        out.push(['C', x1, y1, x2, y2, x3, y3]); cx = x2; cy = y2; x = x3; y = y3;
      } else if (C === 'Q' || C === 'T') {
        var qx1, qy1;
        if (C === 'Q') { qx1 = (rel ? x : 0) + num(); qy1 = (rel ? y : 0) + num(); }
        else if (prev === 'Q' || prev === 'T') { qx1 = 2 * x - qx; qy1 = 2 * y - qy; } else { qx1 = x; qy1 = y; }
        var qx3 = (rel ? x : 0) + num(), qy3 = (rel ? y : 0) + num();
        out.push(['C', x + 2 / 3 * (qx1 - x), y + 2 / 3 * (qy1 - y), qx3 + 2 / 3 * (qx1 - qx3), qy3 + 2 / 3 * (qy1 - qy3), qx3, qy3]);
        qx = qx1; qy = qy1; x = qx3; y = qy3;
      } else if (C === 'A') {
        var rx = Math.abs(num()), ry = Math.abs(num()), rot = num(), la = num(), sw = num();
        var ex = (rel ? x : 0) + num(), ey = (rel ? y : 0) + num();
        a = arcSegs(x, y, rx, ry, rot, la, sw, ex, ey);
        for (n = 0; n < a.length; n++) out.push(a[n]);
        x = ex; y = ey;
      } else return null;
      if (out.length > VEC_CAP) return null;
      prev = C;
    }
    return out;
  }
  function arcSegs(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
    if (!rx || !ry || (x1 === x2 && y1 === y2)) return [['L', x2, y2]];
    var p = phi * Math.PI / 180, cp = Math.cos(p), sp = Math.sin(p);
    var dx = (x1 - x2) / 2, dy = (y1 - y2) / 2, x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
    var lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { var sl = Math.sqrt(lam); rx *= sl; ry *= sl; }
    var num0 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p, den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    var co = Math.sqrt(Math.max(0, num0 / den)) * ((fa ? 1 : 0) === (fs ? 1 : 0) ? -1 : 1);
    var cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx;
    var ccx = cp * cxp - sp * cyp + (x1 + x2) / 2, ccy = sp * cxp + cp * cyp + (y1 + y2) / 2;
    var ang = function (ux, uy, vx, vy) { var d0 = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return d0; };
    var t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    var dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!fs && dt > 0) dt -= 2 * Math.PI; else if (fs && dt < 0) dt += 2 * Math.PI;
    var n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2))), dd = dt / n, k = 4 / 3 * Math.tan(dd / 4), out = [], i;
    var pt = function (t) { var ct = Math.cos(t), st = Math.sin(t); return [ccx + rx * ct * cp - ry * st * sp, ccy + rx * ct * sp + ry * st * cp]; };
    var dv = function (t) { var ct = Math.cos(t), st = Math.sin(t); return [-rx * st * cp - ry * ct * sp, -rx * st * sp + ry * ct * cp]; };
    for (i = 0; i < n; i++) {
      var ta = t1 + i * dd, tb = ta + dd, A = pt(ta), Bp = pt(tb), dA = dv(ta), dB = dv(tb);
      out.push(['C', A[0] + k * dA[0], A[1] + k * dA[1], Bp[0] - k * dB[0], Bp[1] - k * dB[1], Bp[0], Bp[1]]);
    }
    out[out.length - 1][5] = x2; out[out.length - 1][6] = y2;
    return out;
  }
  function lenOf(an) { return (an && an.baseVal) ? an.baseVal.value : 0; }
  function shapeSegs(el) {
    var t = String(el.tagName).toLowerCase(), k = 0.5523, out;
    if (t === 'path') return pathSegs(el.getAttribute('d'));
    if (t === 'line') return [['M', lenOf(el.x1), lenOf(el.y1)], ['L', lenOf(el.x2), lenOf(el.y2)]];
    if (t === 'polyline' || t === 'polygon') {
      var pts = el.points, i;
      if (!pts || !pts.numberOfItems) return null;
      out = [];
      for (i = 0; i < pts.numberOfItems; i++) { var p = pts.getItem(i); out.push([i ? 'L' : 'M', p.x, p.y]); }
      if (t === 'polygon') out.push(['Z']);
      return out;
    }
    var cx, cy, rx, ry;
    if (t === 'rect') {
      var x = lenOf(el.x), y = lenOf(el.y), w = lenOf(el.width), h = lenOf(el.height);
      if (!(w > 0) || !(h > 0)) return null;
      rx = lenOf(el.rx); ry = lenOf(el.ry);
      if (!el.hasAttribute('rx') && el.hasAttribute('ry')) rx = ry;
      if (!el.hasAttribute('ry') && el.hasAttribute('rx')) ry = rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!(rx > 0) || !(ry > 0)) return [['M', x, y], ['L', x + w, y], ['L', x + w, y + h], ['L', x, y + h], ['Z']];
      return [['M', x + rx, y], ['L', x + w - rx, y], ['C', x + w - rx + k * rx, y, x + w, y + ry - k * ry, x + w, y + ry],
              ['L', x + w, y + h - ry], ['C', x + w, y + h - ry + k * ry, x + w - rx + k * rx, y + h, x + w - rx, y + h],
              ['L', x + rx, y + h], ['C', x + rx - k * rx, y + h, x, y + h - ry + k * ry, x, y + h - ry],
              ['L', x, y + ry], ['C', x, y + ry - k * ry, x + rx - k * rx, y, x + rx, y], ['Z']];
    }
    if (t === 'circle') { cx = lenOf(el.cx); cy = lenOf(el.cy); rx = ry = lenOf(el.r); }
    else if (t === 'ellipse') { cx = lenOf(el.cx); cy = lenOf(el.cy); rx = lenOf(el.rx); ry = lenOf(el.ry); }
    else return null;
    if (!(rx > 0) || !(ry > 0)) return null;
    return [['M', cx + rx, cy], ['C', cx + rx, cy + k * ry, cx + k * rx, cy + ry, cx, cy + ry],
            ['C', cx - k * rx, cy + ry, cx - rx, cy + k * ry, cx - rx, cy], ['C', cx - rx, cy - k * ry, cx - k * rx, cy - ry, cx, cy - ry],
            ['C', cx + k * rx, cy - ry, cx + rx, cy - k * ry, cx + rx, cy], ['Z']];
  }
  function mul(m, n) {
    return { a: m.a * n.a + m.c * n.b, b: m.b * n.a + m.d * n.b, c: m.a * n.c + m.c * n.d, d: m.b * n.c + m.d * n.d,
             e: m.a * n.e + m.c * n.f + m.e, f: m.b * n.e + m.d * n.f + m.f };
  }
  function segCmds(segs, m, org, box) {
    var cmds = [], i, s, j, X, Y;
    for (i = 0; i < segs.length; i++) {
      s = segs[i];
      if (s[0] === 'Z') { cmds.push(['h']); continue; }
      var c = [s[0] === 'M' ? 'm' : (s[0] === 'L' ? 'l' : 'c')];
      for (j = 1; j < s.length; j += 2) {
        X = m.a * s[j] + m.c * s[j + 1] + m.e - org.left; Y = m.b * s[j] + m.d * s[j + 1] + m.f - org.top;
        c.push(X, Y);
        if (Y < box.y0) box.y0 = Y; if (Y > box.y1) box.y1 = Y;
      }
      cmds.push(c);
    }
    return cmds;
  }
  function dashOf(cs, k) {
    var s = String(cs.strokeDasharray || 'none');
    if (s === 'none') return null;
    var v = s.split(/[\s,]+/).map(parseFloat).filter(function (x) { return isFinite(x) && x >= 0; });
    if (!v.length || v.every(function (x) { return x === 0; })) return null;
    if (v.length % 2) v = v.concat(v);
    var gaps = 0, i;
    for (i = 1; i < v.length; i += 2) gaps += v[i];
    if (!(gaps > 0.01)) return null;
    return v.map(function (x) { return x * k; });
  }
  var CAPN = { butt: 0, round: 1, square: 2 }, JOINN = { miter: 0, round: 1, bevel: 2 };
  function paintOf(cs, alpha, k) {
    var f = rgbOf(cs.fill), s = rgbOf(cs.stroke), w = (parseFloat(cs.strokeWidth) || 0) * k;
    var fo = parseFloat(cs.fillOpacity), so = parseFloat(cs.strokeOpacity);
    if (f) { f = f.slice(); f[3] *= (isFinite(fo) ? fo : 1) * alpha; if (f[3] < 0.02) f = null; }
    if (s) { s = s.slice(); s[3] *= (isFinite(so) ? so : 1) * alpha; if (s[3] < 0.02 || !(w > 0.01)) s = null; }
    return { fill: f, stroke: s, w: w, eo: cs.fillRule === 'evenodd', cap: CAPN[cs.strokeLinecap] || 0, join: JOINN[cs.strokeLinejoin] || 0,
             dash: s ? dashOf(cs, k) : null };
  }
  function unsupported(sv) {
    if (sv.querySelector('foreignObject, image, use, switch')) return true;
    var all = sv.querySelectorAll('*'), i, cs, t;
    for (i = 0; i < all.length; i++) {
      t = String(all[i].tagName).toLowerCase();
      if (SVG_SKIP[t] || all[i].closest('defs')) continue;
      cs = getComputedStyle(all[i]);
      if ((cs.clipPath && cs.clipPath !== 'none') || (cs.mask && cs.mask !== 'none') || (cs.filter && cs.filter !== 'none')) return true;
      if (/url\(/.test(cs.fill) || /url\(/.test(cs.stroke)) return true;
    }
    return false;
  }
  function svgMarker(sv, el, which, m, alpha, org, box, out) {
    var cs = getComputedStyle(el), ref = which === 'start' ? cs.markerStart : (which === 'end' ? cs.markerEnd : 'none');
    var mm = /url\(\s*["']?#([^"')]+)["']?\s*\)/.exec(String(ref || ''));
    if (!mm || !el.getTotalLength) return true;
    var mk = null, ms = sv.querySelectorAll('marker'), i;
    for (i = 0; i < ms.length; i++) if (ms[i].id === mm[1]) { mk = ms[i]; break; }
    if (!mk) return true;
    var L = 0;
    try { L = el.getTotalLength(); } catch (eL) { return true; }
    if (!(L > 0)) return true;
    var st = which === 'start';
    var pA = el.getPointAtLength(st ? 0 : L), pB = el.getPointAtLength(st ? Math.min(L, 0.25) : Math.max(0, L - 0.25));
    var ang = st ? Math.atan2(pB.y - pA.y, pB.x - pA.x) : Math.atan2(pA.y - pB.y, pA.x - pB.x);
    var ori = String(mk.getAttribute('orient') || '0');
    var r = ori === 'auto' ? ang : (ori === 'auto-start-reverse' ? (st ? ang + Math.PI : ang) : (parseFloat(ori) || 0) * Math.PI / 180);
    var sw = parseFloat(cs.strokeWidth) || 1, units = mk.getAttribute('markerUnits') || 'strokeWidth';
    var sc = units === 'strokeWidth' ? sw : 1, vs = 1;
    var vb = (mk.viewBox && mk.viewBox.baseVal && mk.viewBox.baseVal.width > 0) ? mk.viewBox.baseVal : null;
    if (vb) vs = Math.min(lenOf(mk.markerWidth) / vb.width, lenOf(mk.markerHeight) / vb.height);
    var cr = Math.cos(r), sr = Math.sin(r), s2 = sc * vs;
    var mt = mul({ a: cr * s2, b: sr * s2, c: -sr * s2, d: cr * s2, e: pA.x, f: pA.y },
                 { a: 1, b: 0, c: 0, d: 1, e: -lenOf(mk.refX), f: -lenOf(mk.refY) });
    var kids = mk.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon');
    for (i = 0; i < kids.length; i++) {
      var ksegs = shapeSegs(kids[i]);
      if (!ksegs) return false;
      var km = mt, tl = kids[i].transform && kids[i].transform.baseVal ? kids[i].transform.baseVal.consolidate() : null;
      if (tl) { var q = tl.matrix; km = mul(mt, { a: q.a, b: q.b, c: q.c, d: q.d, e: q.e, f: q.f }); }
      var full = mul(m, km), kcs = getComputedStyle(kids[i]);
      var paint = paintOf(kcs, alpha, Math.sqrt(Math.abs(full.a * full.d - full.b * full.c)) || 1);
      if (!paint.fill && !paint.stroke) continue;
      var b0 = { y0: Infinity, y1: -Infinity };
      var cmds = segCmds(ksegs, full, org, b0);
      paint.cmds = cmds; paint.y = b0.y0; paint.h = Math.max(0.5, b0.y1 - b0.y0);
      if (b0.y0 < box.y0) box.y0 = b0.y0; if (b0.y1 > box.y1) box.y1 = b0.y1;
      out.push(paint);
    }
    return true;
  }
  function svgText(node, org, runs, m) {
    var s = node.data;
    if (!s || !/\S/.test(s)) return true;
    var p = node.parentElement;
    if (!p) return true;
    if (Math.abs(m.b) > 1e-3 || Math.abs(m.c) > 1e-3) return false;
    var cs = getComputedStyle(p);
    if (cs.visibility === 'hidden' || cs.display === 'none') return true;
    var col = rgbOf(cs.fill) || rgbOf(cs.color);
    if (!col) return true;
    var k = Math.sqrt(Math.abs(m.a * m.d)) || 1, size = (parseFloat(cs.fontSize) || 12) * k;
    var rg = node.ownerDocument.createRange();
    rg.selectNodeContents(node);
    var rs = [].slice.call(rg.getClientRects()).filter(function (r) { return r.width > 0.05 && r.height > 0.05; });
    if (!rs.length) return true;
    var bx = rs[0], i;
    for (i = 1; i < rs.length; i++) {
      bx = { left: Math.min(bx.left, rs[i].left), right: Math.max(bx.right, rs[i].right), top: Math.min(bx.top, rs[i].top), bottom: Math.max(bx.bottom, rs[i].bottom) };
    }
    var w = bx.right - bx.left, h = bx.bottom - bx.top, t = s.replace(/\s+/g, ' ');
    var lead = /^\s/.test(t), tail = /\s$/.test(t);
    t = t.trim();
    if (!t) return true;
    if (lead || tail) {
      var r2 = node.ownerDocument.createRange(), a0 = s.search(/\S/), a1 = s.replace(/\s+$/, '').length;
      try { r2.setStart(node, a0); r2.setEnd(node, a1); var bb = r2.getBoundingClientRect(); if (bb.width > 0.05) { bx = { left: bb.left, right: bb.right, top: bx.top, bottom: bx.bottom }; w = bb.width; } } catch (eR) {}
    }
    var band = org.band || null;
    if (band && (bx.bottom < band.top - 0.5 || bx.top > band.bottom + 0.5)) return true;
    runs.push({ t: t, face: faceIdFor(cs.fontFamily, cs.fontWeight, t), famDbg: cs.fontFamily, fam: cs.fontFamily, wgt: cs.fontWeight,
                x: bx.left - org.left, yTop: bx.top - org.top, yBase: bx.bottom - org.top - (h - size * 0.78) / 2,
                w: w, h: h, size: size, col: col, dir: cs.direction, under: false, strike: false, svg: 1 });
    return true;
  }
  /*@3.NOPJ2.118*/
  function hostK(sv) {
    var cm = sv.getScreenCTM ? sv.getScreenCTM() : null;
    if (!cm) return 1;
    var det = Math.abs(cm.a * cm.d - cm.b * cm.c), vb = sv.viewBox && sv.viewBox.baseVal, cw = sv.clientWidth, ch = sv.clientHeight;
    if (vb && vb.width > 0 && vb.height > 0 && cw > 0 && ch > 0) {
      var sx = cw / vb.width, sy = ch / vb.height, par = sv.preserveAspectRatio && sv.preserveAspectRatio.baseVal;
      if (par && par.align !== 1) { var s1 = par.meetOrSlice === 2 ? Math.max(sx, sy) : Math.min(sx, sy); sx = s1; sy = s1; }
      det = det / (sx * sy);
    }
    return Math.sqrt(det) || 1;
  }
  function svgVec(sv, org) {
    if (unsupported(sv)) return null;
    var vecs = [], runs = [], box = { y0: Infinity, y1: -Infinity }, ok = true, alphaOf2 = new Map(), hk = null;
    var alphaFor = function (el) {
      if (!el || el === sv.parentNode) return 1;
      if (alphaOf2.has(el)) return alphaOf2.get(el);
      var o = parseFloat(getComputedStyle(el).opacity);
      var a = (isFinite(o) ? o : 1) * (el === sv ? 1 : alphaFor(el.parentElement));
      alphaOf2.set(el, a);
      return a;
    };
    var w = sv.ownerDocument.createTreeWalker(sv, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === 1 && SVG_SKIP[String(n.tagName).toLowerCase()]) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n, cm, m;
    while ((n = w.nextNode()) && ok) {
      if (n.nodeType === 3) {
        var pe = n.parentElement;
        if (!pe || !pe.getScreenCTM || !pe.closest('text')) continue;
        cm = pe.getScreenCTM();
        if (!cm) continue;
        ok = svgText(n, org, runs, cm);
        continue;
      }
      var t = String(n.tagName).toLowerCase();
      if (!SVG_SHAPE[t]) continue;
      var cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      cm = n.getScreenCTM();
      if (!cm) continue;
      m = { a: cm.a, b: cm.b, c: cm.c, d: cm.d, e: cm.e, f: cm.f };
      var segs = shapeSegs(n);
      if (segs === null && t === 'path' && n.getAttribute('d')) { ok = false; break; }
      if (!segs || !segs.length) continue;
      var alpha = alphaFor(n);
      var ns = cs.vectorEffect === 'non-scaling-stroke';
      if (ns && hk === null) hk = hostK(sv);
      var paint = paintOf(cs, alpha, ns ? hk : (Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1));
      if (paint.fill || paint.stroke) {
        var b0 = { y0: Infinity, y1: -Infinity };
        paint.cmds = segCmds(segs, m, org, b0);
        paint.y = b0.y0; paint.h = Math.max(0.5, b0.y1 - b0.y0);
        if (b0.y0 < box.y0) box.y0 = b0.y0; if (b0.y1 > box.y1) box.y1 = b0.y1;
        vecs.push(paint);
      }
      if (t === 'path' || t === 'line' || t === 'polyline' || t === 'polygon') {
        if (!svgMarker(sv, n, 'start', m, alpha, org, box, vecs) || !svgMarker(sv, n, 'end', m, alpha, org, box, vecs)) { ok = false; break; }
      }
      if (vecs.length > VEC_CAP) { ok = false; break; }
    }
    if (!ok) return null;
    return { vecs: vecs, runs: runs };
  }
  /*@3.NOPJ2.116*/
  function harvestSvg(rootEl, org, o) {
    var svgs = rootEl.querySelectorAll('svg'), q;
    for (q = 0; q < svgs.length; q++) {
      var sv = svgs[q];
      if (sv.closest('svg') !== sv || sv.closest('.mink') || sv.__vec) continue;
      var rs = sv.getBoundingClientRect();
      if (rs.width < 2 || rs.height < 2) continue;
      var cz = getComputedStyle(sv);
      if (cz.visibility === 'hidden' || cz.display === 'none' || parseFloat(cz.opacity) < 0.05) continue;
      var got = null;
      try { got = svgVec(sv, org); } catch (eV) { got = null; }
      if (!got) continue;
      sv.__vec = 1;
      var i;
      for (i = 0; i < got.vecs.length; i++) o.vecs.push(got.vecs[i]);
      for (i = 0; i < got.runs.length; i++) o.runs.push(got.runs[i]);
    }
  }

  function alphaOf(img, shownPx) {
    try {
      var cap = Math.max(160, Math.min(2000, Math.round((shownPx || 200) * 3)));
      var big = Math.max(img.naturalWidth, img.naturalHeight) || 1;
      var sc = cap / big;
      var cw = Math.max(1, Math.round(img.naturalWidth * sc));
      var ch = Math.max(1, Math.round(img.naturalHeight * sc));
      if (cw * ch > VEC_MAX_PX) { var kk = Math.sqrt(VEC_MAX_PX / (cw * ch)); cw = Math.max(1, Math.round(cw * kk)); ch = Math.max(1, Math.round(ch * kk)); }
      var cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      var cx = cv.getContext('2d', { willReadFrequently: true });
      cx.clearRect(0, 0, cw, ch);
      cx.drawImage(img, 0, 0, cw, ch);
      var d = cx.getImageData(0, 0, cw, ch).data;
      var rgb = new Uint8Array(cw * ch * 3), al = new Uint8Array(cw * ch), ink = 0;
      for (var i = 0, q = 0; i < cw * ch; i++) {
        rgb[q++] = d[i * 4]; rgb[q++] = d[i * 4 + 1]; rgb[q++] = d[i * 4 + 2];
        al[i] = d[i * 4 + 3];
        if (d[i * 4 + 3] > 8) ink++;
      }
      if (ink < 2) return null;
      return { w: cw, h: ch, rgb: rgb, al: al };
    } catch (e) { return null; }
  }

  /*@3.NOPJ2.76*/
  var VEC_MAX_PX = 4200000;

  function isVector(img) {
    var s = String(img.currentSrc || img.src || '');
    return /^data:image\/svg\+xml/i.test(s) || /\.svg(\?|#|$)/i.test(s);
  }

  function paperOf(img) {
    var e = img, cs, bg;
    for (var g = 0; e && g < 6; g++, e = e.parentElement) {
      try { cs = getComputedStyle(e); } catch (e0) { break; }
      bg = rgbOf(cs.backgroundColor);
      if (bg) {
        return 'rgb(' + Math.round(bg[0] * 255) + ',' + Math.round(bg[1] * 255) +
               ',' + Math.round(bg[2] * 255) + ')';
      }
    }
    return '#fff';
  }

  /*@3.NOPJ2.45*/
  function jpegOf(img, shownPx) {
    try {
      var vec = isVector(img);
      var cap = Math.max(320, Math.min(vec ? 2600 : 1600, Math.round((shownPx || 400) * 3)));
      var big = Math.max(img.naturalWidth, img.naturalHeight);
      var sc = vec ? (cap / big) : Math.min(1, cap / big);
      var cw = Math.max(1, Math.round(img.naturalWidth * sc));
      var ch = Math.max(1, Math.round(img.naturalHeight * sc));
      if (vec && cw * ch > VEC_MAX_PX) {
        var kk = Math.sqrt(VEC_MAX_PX / (cw * ch));
        cw = Math.max(1, Math.round(cw * kk));
        ch = Math.max(1, Math.round(ch * kk));
      }
      var cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      var cx = cv.getContext('2d');
      cx.fillStyle = vec ? paperOf(img) : '#fff';
      cx.fillRect(0, 0, cw, ch);
      cx.drawImage(img, 0, 0, cw, ch);
      if (vec) {
        var px = cx.getImageData(0, 0, cw, ch).data;
        var rgb = new Uint8Array(cw * ch * 3);
        for (var q = 0, w = 0; q < px.length; q += 4) {
          rgb[w++] = px[q]; rgb[w++] = px[q + 1]; rgb[w++] = px[q + 2];
        }
        return { data: rgb, w: cw, h: ch, raw: 1 };
      }
      var url = cv.toDataURL('image/jpeg', 0.82);
      var b64 = url.slice(url.indexOf(',') + 1);
      var raw = atob(b64);
      var u8 = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
      return { data: u8, w: cw, h: ch };
    } catch (e) { return null; }
  }

  /*@3.NOPJ2.10*/

  /*@3.NOPJ2.11*/
  function classOf(cp) {
    if ((cp >= 0x0600 && cp <= 0x08FF) || (cp >= 0xFB50 && cp <= 0xFEFF) ||
        (cp >= 0x0590 && cp <= 0x05FF)) return 'R';
    if ((cp >= 0x0041 && cp <= 0x005A) || (cp >= 0x0061 && cp <= 0x007A) ||
        (cp >= 0x0030 && cp <= 0x0039) || (cp >= 0x00C0 && cp <= 0x024F) ||
        (cp >= 0x0660 && cp <= 0x0669)) return 'L';
    return 'N';
  }

  function orderClusters(gl, rtl) {
    var cl = [], cur = null, i;
    for (i = 0; i < gl.length; i++) {
      var cp = gl[i].u[0];
      if (cur && isMark(cp)) { cur.push(gl[i]); continue; }
      cur = [gl[i]];
      cur.cls = classOf(cp);
      cl.push(cur);
    }
    if (rtl) bidiReverse(cl);
    return cl;
  }

  var MIRROR = { 0x28: 0x29, 0x29: 0x28, 0x5B: 0x5D, 0x5D: 0x5B, 0x7B: 0x7D, 0x7D: 0x7B, 0x3C: 0x3E, 0x3E: 0x3C,
                 0xAB: 0xBB, 0xBB: 0xAB, 0x2039: 0x203A, 0x203A: 0x2039 };
  function bidiReverse(cl) {
    var i, k;
    for (i = 0; i < cl.length; i++) {
      if (cl[i].cls !== 'N') continue;
      var pv = 'R', nx = 'R';
      for (k = i - 1; k >= 0; k--) { if (cl[k].cls !== 'N') { pv = cl[k].cls; break; } }
      for (k = i + 1; k < cl.length; k++) { if (cl[k].cls !== 'N') { nx = cl[k].cls; break; } }
      cl[i].run = (pv === 'L' && nx === 'L') ? 'L' : 'R';
    }
    for (i = 0; i < cl.length; i++) {
      if (!cl[i].run) cl[i].run = cl[i].cls;
      var mc = cl[i].run === 'R' && MIRROR[cl[i][0].g];
      if (mc) { var mcls = cl[i].cls, mrun = cl[i].run; cl[i] = [{ g: mc, u: cl[i][0].u }].concat(cl[i].slice(1)); cl[i].cls = mcls; cl[i].run = mrun; }
    }
    cl.reverse();
    i = 0;
    while (i < cl.length) {
      if (cl[i].run !== 'L') { i++; continue; }
      var j = i;
      while (j + 1 < cl.length && cl[j + 1].run === 'L') j++;
      for (k = 0; k < (j - i + 1) >> 1; k++) {
        var t = cl[i + k]; cl[i + k] = cl[j - k]; cl[j - k] = t;
      }
      i = j + 1;
    }
  }

  /*@3.NOPJ2.26*/
  var LIG_SPLIT = {
    0xFEF5: [0xFEDF, 0xFE82], 0xFEF6: [0xFEE0, 0xFE82],
    0xFEF7: [0xFEDF, 0xFE84], 0xFEF8: [0xFEE0, 0xFE84],
    0xFEF9: [0xFEDF, 0xFE88], 0xFEFA: [0xFEE0, 0xFE88],
    0xFEFB: [0xFEDF, 0xFE8E], 0xFEFC: [0xFEE0, 0xFE8E]
  };

  /*@3.NOPJ2.48*/
  var SYMFA = {
    0x2705: 0xF058, 0x2714: 0xF00C, 0x2713: 0xF00C, 0x2611: 0xF14A,
    0x274C: 0xF057, 0x274E: 0xF057, 0x2715: 0xF00D, 0x2716: 0xF00D, 0x2717: 0xF00D,
    0x2718: 0xF00D, 0x26A0: 0xF071, 0x2757: 0xF071, 0x2755: 0xF071,
    0x2764: 0xF004, 0x2665: 0xF004, 0x2605: 0xF005, 0x2B50: 0xF005,
    0x21A9: 0xF3E5, 0x26A1: 0xF0E7, 0x1F680: 0xF135, 0x1F6AB: 0xF05E,
    0x26D4: 0xF05E, 0x2139: 0xF05A, 0x1F525: 0xF0E7, 0x1F4A1: 0xF0EB
  };
  var SYMFACE = 'fa-solid-900';

  /*@3.NOPJ2.52*/
  var SYMCOL = {
    0x2705: '#2ea043', 0x2714: '#2ea043', 0x2713: '#2ea043', 0x2611: '#2ea043',
    0x274C: '#e5484d', 0x274E: '#e5484d', 0x2715: '#e5484d', 0x2716: '#e5484d', 0x2717: '#e5484d',
    0x2718: '#e5484d', 0x26A0: '#e3a008', 0x2757: '#e5484d', 0x2755: '#e5484d',
    0x2764: '#e5484d', 0x2665: '#e5484d', 0x2605: '#eab308', 0x2B50: '#eab308',
    0x26A1: '#e3a008', 0x1F680: '#ef4444', 0x1F6AB: '#e5484d',
    0x26D4: '#e5484d', 0x2139: '#3b82f6', 0x1F525: '#f97316', 0x1F4A1: '#f59e0b'
  };

  /*@3.NOPJ2.49*/
  function symNeed(runs) {
    var hit = {}, out = [], i, k, q, z;
    for (i = 0; i < runs.length; i++) {
      var t = runs[i].t;
      for (k = 0; k < t.length; k++) {
        var c = t.charCodeAt(k);
        if (c < 0x0100) continue;
        for (q = 0; q < SYMFACES.length; q++) {
          if (hit[SYMFACES[q].id]) continue;
          for (z = 0; z < SYMFACES[q].r.length; z++) {
            if (c >= SYMFACES[q].r[z][0] && c <= SYMFACES[q].r[z][1]) {
              hit[SYMFACES[q].id] = 1;
              out.push(SYMFACES[q].id);
              break;
            }
          }
        }
      }
    }
    return out;
  }

  function symfaIn(runs) {
    for (var i = 0; i < runs.length; i++) {
      var t = runs[i].t, k;
      for (k = 0; k < t.length; k++) {
        var c = t.codePointAt(k);
        if (c > 0xFFFF) k++;
        if (SYMFA[c]) return true;
      }
    }
    return false;
  }

  /*@3.NOPJ2.25*/
  function resolve(cp, faces) {
    for (var i = 0; i < faces.length; i++) {
      if (!faces[i]) continue;
      var g = faces[i].gid(cp);
      if (g) return { f: faces[i], g: g };
    }
    return null;
  }

  function resolveSeq(cp, faces) {
    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];
      if (!f) continue;
      var sq = f.shape ? f.shape(cp) : null;
      if (sq && sq.length) return { f: f, g: sq.slice() };
      var g = f.gid(cp);
      if (g) return { f: f, g: [g] };
    }
    return null;
  }

  function faceChain(run, faceMap) {
    var out = [], seen = {}, k;
    function add(id) {
      if (!id || seen[id] || !faceMap[id]) return;
      seen[id] = 1; out.push(faceMap[id]);
    }
    add(run.face);
    add(FALLBACK.a); add(FALLBACK.b);
    for (k = 0; k < SYMFACES.length; k++) add(SYMFACES[k].id);
    var ks = Object.keys(faceMap);
    for (k = 0; k < ks.length; k++) add(ks[k]);
    return out;
  }

  /*@3.NOPJ2.40*/
  var MEASCV = null, MEASCACHE = {};
  function measureAdv(chars, run) {
    if (!chars || !chars.length || !run || !run.fam) return 0;
    var txt = String.fromCharCode.apply(String, chars);
    var key = run.wgt + '|' + run.fam + '|' + txt;
    if (MEASCACHE[key] != null) return MEASCACHE[key];
    var v = 0;
    try {
      if (!MEASCV) MEASCV = document.createElement('canvas').getContext('2d');
      MEASCV.font = (run.wgt || 400) + ' 1000px ' + run.fam;
      v = MEASCV.measureText(txt).width;
      if (!(v > 0) || v > 4000) v = 0;
    } catch (e) { v = 0; }
    MEASCACHE[key] = v;
    return v;
  }

  /*@3.NOPJ2.55*/
  function isEmojiCp(cp) {
    return (cp >= 0x1F000 && cp <= 0x1FAFF) ||
           (cp >= 0x2600 && cp <= 0x27BF) ||
           (cp >= 0x2B00 && cp <= 0x2BFF) ||
           cp === 0x2139 || cp === 0x2122 || cp === 0x00A9 || cp === 0x00AE ||
           (cp >= 0x2190 && cp <= 0x21FF && false);
  }

  var EMOCACHE = {};

  function emoBits(cp, px) {
    var key = cp + '@' + px;
    if (EMOCACHE[key] !== undefined) return EMOCACHE[key];
    var out = null;
    try {
      var s = Math.max(48, Math.min(192, Math.round((px || 16) * 3)));
      var cv = document.createElement('canvas');
      cv.width = s; cv.height = s;
      var cx = cv.getContext('2d', { willReadFrequently: true });
      cx.clearRect(0, 0, s, s);
      cx.font = Math.round(s * 0.84) + 'px "Segoe UI Emoji","Apple Color Emoji",' +
                '"Noto Color Emoji","Segoe UI Symbol",sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText(String.fromCodePoint(cp), s / 2, s / 2 + s * 0.04);
      var d = cx.getImageData(0, 0, s, s).data;
      var rgb = new Uint8Array(s * s * 3), al = new Uint8Array(s * s);
      var ink = 0, i, q;
      for (i = 0, q = 0; i < s * s; i++) {
        rgb[q++] = d[i * 4]; rgb[q++] = d[i * 4 + 1]; rgb[q++] = d[i * 4 + 2];
        al[i] = d[i * 4 + 3];
        if (d[i * 4 + 3] > 8) ink++;
      }
      if (ink > 4) out = { w: s, h: s, rgb: rgb, al: al };
    } catch (e) { out = null; }
    EMOCACHE[key] = out;
    return out;
  }

  function emoAdv(cps, run) {
    if (!cps || !cps.length || !run || !run.fam) return 0;
    var txt = '', i;
    for (i = 0; i < cps.length; i++) txt += String.fromCodePoint(cps[i]);
    var key = 'E|' + run.wgt + '|' + run.fam + '|' + txt;
    if (MEASCACHE[key] != null) return MEASCACHE[key];
    var v = 0;
    try {
      if (!MEASCV) MEASCV = document.createElement('canvas').getContext('2d');
      MEASCV.font = (run.wgt || 400) + ' 1000px ' + run.fam;
      v = MEASCV.measureText(txt).width;
      if (!(v > 0) || v > 4000) v = 0;
    } catch (e) { v = 0; }
    MEASCACHE[key] = v;
    return v;
  }

  function textOps(run, faceMap) {
    var single = !!(faceMap && faceMap.gid);
    var chain = single ? [faceMap] : faceChain(run, faceMap);
    var primary = chain[0];
    if (!primary) return { segs: [], empty: true };

    var gl = shape(run.t), i, k;
    var rtl = (run.dir === 'rtl');
    for (i = 0; i < run.t.length; i++) {
      var k0 = classOf(run.t.charCodeAt(i));
      if (k0 === 'R') { rtl = true; break; }
      if (k0 === 'L') { rtl = false; break; }
    }
    var cl = orderClusters(gl, rtl);

    /*@3.NOPJ2.29*/
    var items = [], natural = 0;
    for (i = 0; i < cl.length; i++) {
      var seq = cl[i];
      var cp = seq[0].g;
      var hit = resolveSeq(cp, chain);
      var glyphs = null, fUse = null, uni = null, measured = 0;
      if (hit) {
        fUse = hit.f; glyphs = hit.g;
        if (glyphs.length > 1) {
          /*@3.NOPJ2.51*/
          uni = [];
          for (k = 0; k < glyphs.length; k++) uni.push([]);
          /*@3.NOPJ2.134*/
          if (seq[0].u.length === glyphs.length) {
            for (k = 0; k < glyphs.length; k++) uni[k] = [seq[0].u[rtl ? glyphs.length - 1 - k : k]];
          } else uni[0] = seq[0].u;
        }
      } else if (LIG_SPLIT[cp]) {
        /*@3.NOPJ2.39*/
        var pair = LIG_SPLIT[cp];
        var h1 = resolve(pair[0], chain), h2 = resolve(pair[1], chain);
        if (h1 && h2 && h1.f === h2.f) {
          fUse = h1.f;
          glyphs = rtl ? [h2.g, h1.g] : [h1.g, h2.g];
          uni = (seq[0].u.length === 2) ? (rtl ? [[seq[0].u[1]], [seq[0].u[0]]] : [[seq[0].u[0]], [seq[0].u[1]]]) : (rtl ? [[], seq[0].u] : [seq[0].u, []]);
          measured = measureAdv(seq[0].u, run);
        }
      }
      var symCol = null;
      /*@3.NOPJ2.56*/
      /*@3.NOPJ2.125*/
      if (!glyphs && isEmojiCp(cp) && !run.pz) {
        var advE = Math.round(emoAdv(seq[0].u, run));
        if (advE > 0) {
          items.push({ f: primary, g: [], adv: advE, marks: [], col: null });
          natural += advE;
          continue;
        }
      }
      if (!glyphs && SYMFA[cp]) {
        var hs = resolve(SYMFA[cp], chain);
        if (hs) {
          fUse = hs.f;
          glyphs = [hs.g];
          uni = [seq[0].u];
          symCol = run.pz ? null : (SYMCOL[cp] || null);
        }
      }
      if (!glyphs) {
        MISSING[seq[0].u[0]] = (MISSING[seq[0].u[0]] || 0) + 1;
        continue;
      }
      var advB = 0;
      for (k = 0; k < glyphs.length; k++) advB += fUse.adv1(glyphs[k]);
      if (measured > 0) advB = measured;
      for (k = 0; k < glyphs.length; k++) {
        fUse.used[glyphs[k]] = uni ? (uni[k] || []) : ((k === 0) ? seq[0].u : []);
      }
      var marks = [];
      for (k = 1; k < seq.length; k++) {
        var mh = resolve(seq[k].g, [fUse]) || resolve(seq[k].g, chain);
        if (!mh || mh.f !== fUse) {
          MISSING[seq[k].u[0]] = (MISSING[seq[k].u[0]] || 0) + 1;
          continue;
        }
        fUse.used[mh.g] = seq[k].u;
        marks.push({ g: mh.g, w: fUse.markw[mh.g] || 0, adv: fUse.adv1(mh.g) });
      }
      items.push({ f: fUse, g: glyphs, adv: advB, marks: marks, col: symCol });
      natural += advB;
      for (k = 0; k < marks.length; k++) natural += marks[k].adv;
    }
    if (!items.length) return { segs: [], empty: true };

    /*@3.NOPJ2.30*/
    var wantPt = run.w * PT;
    var naturalPt = natural / 1000 * run.size * PT;
    var tz = (run.fit === false || !(naturalPt > 0.5) || !(wantPt > 0.5))
      ? 100 : (wantPt / naturalPt * 100);
    if (tz < 55 || tz > 190) tz = 100;
    var unit = run.size * PT * tz / 100000;
    var lead = 0;
    if (run.align && naturalPt > 0 && wantPt > naturalPt) {
      lead = (wantPt - naturalPt) * (run.align === 'c' ? 0.5 : 1);
    }

    /*@3.NOPJ2.31*/
    var segs = [], cur = null, penX = 0;
    for (i = 0; i < items.length; i++) {
      var it = items[i];
      if (!cur || cur.face !== it.f || cur.col !== (it.col || null)) {
        cur = { face: it.f, col: it.col || null,
                dx: lead + penX * unit, parts: [], open: '' };
        segs.push(cur);
      }
      if (!it.g.length) {
        cur.parts.push('<' + cur.open + '>'); cur.open = '';
        cur.parts.push(String(-it.adv));
        penX += it.adv;
        continue;
      }
      /*@3.NOPJ2.133*/
      var mkT = (it.marks.length && it.g.length === 1 && it.f.mk) ? it.f.mk[it.g[0]] : null;
      if (mkT) {
        if (!rtl) { cur.open += hx(it.g[0]); }
        cur.parts.push('<' + cur.open + '>'); cur.open = '';
        var px = rtl ? 0 : it.adv, sumA = 0, prevM = null, prevXY = null, mq;
        for (mq = 0; mq < it.marks.length; mq++) {
          var mm = it.marks[mq], xy = mkT[mm.g] || null, m2 = prevM != null && it.f.mk2 ? it.f.mk2[prevM] : null;
          if (m2 && m2[mm.g] && prevXY) xy = [prevXY[0] + m2[mm.g][0], prevXY[1] + m2[mm.g][1]];
          if (!xy) xy = [Math.round((it.adv - mm.w) / 2), 0];
          cur.parts.push(String(px - xy[0]));
          if (xy[1]) cur.parts.push('] TJ ' + num(xy[1] / 1000 * run.size * PT) + ' Ts [');
          cur.parts.push('<' + hx(mm.g) + '>');
          if (xy[1]) cur.parts.push('] TJ 0 Ts [');
          px = xy[0] + mm.adv; sumA += mm.adv;
          prevM = mm.g; prevXY = xy;
        }
        if (rtl) { cur.parts.push(String(px)); cur.open = hx(it.g[0]); cur.parts.push('<' + cur.open + '>'); cur.open = ''; cur.parts.push(String(-sumA)); }
        else cur.parts.push(String(px - (it.adv + sumA)));
        penX += it.adv + sumA;
      } else if (it.marks.length) {
        for (k = 0; k < it.g.length; k++) cur.open += hx(it.g[k]);
        penX += it.adv;
        var wide = 0;
        for (k = 0; k < it.marks.length; k++) {
          if (it.marks[k].w > wide) wide = it.marks[k].w;
        }
        var shift = Math.max(0, Math.round((it.adv - wide) / 2));
        cur.parts.push('<' + cur.open + '>'); cur.open = '';
        cur.parts.push(String(it.adv - shift));
        var back = 0;
        for (k = 0; k < it.marks.length; k++) {
          cur.open += hx(it.marks[k].g);
          back += it.marks[k].adv;
        }
        cur.parts.push('<' + cur.open + '>'); cur.open = '';
        cur.parts.push(String(-(it.adv - shift - back)));
        penX += back;
      } else {
        for (k = 0; k < it.g.length; k++) cur.open += hx(it.g[k]);
        penX += it.adv;
      }
    }
    for (i = 0; i < segs.length; i++) {
      if (segs[i].open) { segs[i].parts.push('<' + segs[i].open + '>'); segs[i].open = ''; }
    }
    return { segs: segs, tz: tz, empty: false };
  }

  function alphaName(op) {
    return String(Math.max(1, Math.min(100, Math.round(op * 100))));
  }

  function alphasIn(pages) {
    var seen = { 100: 1 }, p, i;
    for (p = 0; p < pages.length; p++) {
      for (i = 0; i < pages[p].inks.length; i++) {
        var op = pages[p].inks[i].op;
        seen[alphaName(op == null ? 1 : op)] = 1;
      }
      for (i = 0; i < pages[p].boxes.length; i++) {
        seen[alphaName(pages[p].boxes[i].col[3])] = 1;
      }
      for (i = 0; i < pages[p].runs.length; i++) {
        seen[alphaName(pages[p].runs[i].col[3])] = 1;
      }
      var vsets = [pages[p].vecs || []], lq;
      for (lq = 0; lq < (pages[p].layers || []).length; lq++) vsets.push(pages[p].layers[lq].vecs || []);
      for (lq = 0; lq < vsets.length; lq++) {
        for (i = 0; i < vsets[lq].length; i++) {
          if (vsets[lq][i].fill) seen[alphaName(vsets[lq][i].fill[3])] = 1;
          if (vsets[lq][i].stroke) seen[alphaName(vsets[lq][i].stroke[3])] = 1;
        }
      }
    }
    return Object.keys(seen);
  }

  function pageContent(page, faceMap, imgs, pxTop, pageHpx, pageHpt) {
    var imgMap = imgs.imgMap;
    var s = ['q\n'], i;
    /*@3.NOPJ2.82*/
    if (page.bh > 0 && page.bh < pageHpx - 0.5) {
      s.push('-200 ' + num(pageHpt - page.bh * PT) + ' 9000 ' + num(page.bh * PT) + ' re W n\n');
    }
    var lastCol = null, lastAlpha = '100';

    function setAlpha(a) {
      var nm = alphaName(a == null ? 1 : a);
      if (nm === lastAlpha) return;
      lastAlpha = nm;
      s.push('/GA' + nm + ' gs\n');
    }

    function setFill(c) {
      setAlpha(c[3]);
      var key = c[0] + ',' + c[1] + ',' + c[2];
      if (lastCol === key) return;
      lastCol = key;
      s.push(num(c[0]) + ' ' + num(c[1]) + ' ' + num(c[2]) + ' rg\n');
    }
    var lastStroke = null;
    function setStroke(c) {
      setAlpha(c[3]);
      var key = c[0] + ',' + c[1] + ',' + c[2];
      if (lastStroke === key) return;
      lastStroke = key;
      s.push(num(c[0]) + ' ' + num(c[1]) + ' ' + num(c[2]) + ' RG\n');
    }

    /*@3.NOPJ2.92*/
    function emit(bk) {
      var i;
      for (i = 0; i < bk.boxes.length; i++) {
        var b = bk.boxes[i];
        var by = pageHpt - (b.y - pxTop + b.h) * PT;
        if (b.kind === 'stroke') {
          var hw = (b.bw || 1) / 2;
          if (b.w <= b.bw * 2 || b.h <= b.bw * 2) continue;
          setStroke(b.col);
          s.push(num((b.bw || 1) * PT) + ' w 0 J 0 j\n');
          s.push(roundRect((b.x + hw) * PT, by + hw * PT, (b.w - hw * 2) * PT, (b.h - hw * 2) * PT, Math.max(0, (b.rad || 0) - hw) * PT));
          s.push('S\n');
          continue;
        }
        if (b.kind === 'ring') {
          var bw4 = b.bw, rr = b.rad;
          if (!(bw4[0] || bw4[1] || bw4[2] || bw4[3])) continue;
          /*@3.NOPJ2.132*/
          var ex = [bw4[0] ? 0 : 1, bw4[1] ? 0 : 1, bw4[2] ? 0 : 1, bw4[3] ? 0 : 1];
          var ix = b.x + bw4[3] - ex[3], iw = b.w - bw4[1] - bw4[3] + ex[1] + ex[3], ih = b.h - bw4[0] - bw4[2] + ex[0] + ex[2];
          var outer = roundRect4(b.x * PT, by, b.w * PT, b.h * PT, rr.map(function (v) { return v * PT; }));
          var clipR = !!(ex[0] || ex[1] || ex[2] || ex[3]);
          if (clipR) s.push('q\n' + outer + 'W n\n');
          setFill(b.col);
          s.push(outer);
          if (iw > 0.2 && ih > 0.2) {
            var ir = [Math.max(0, rr[0] - Math.max(bw4[3], bw4[0])), Math.max(0, rr[1] - Math.max(bw4[1], bw4[0])),
                      Math.max(0, rr[2] - Math.max(bw4[1], bw4[2])), Math.max(0, rr[3] - Math.max(bw4[3], bw4[2]))];
            if (ex[3] && ex[0]) ir[0] = 0;
            if (ex[1] && ex[0]) ir[1] = 0;
            if (ex[1] && ex[2]) ir[2] = 0;
            if (ex[3] && ex[2]) ir[3] = 0;
            s.push(roundRect4(ix * PT, by + (bw4[2] - ex[2]) * PT, iw * PT, ih * PT, ir.map(function (v) { return v * PT; })));
          }
          s.push('f*\n');
          if (clipR) { s.push('Q\n'); lastCol = null; lastAlpha = null; }
          continue;
        }
        setFill(b.col);
        s.push(roundRect(b.x * PT, by, b.w * PT, b.h * PT, Array.isArray(b.rad) ? b.rad.map(function (v) { return v * PT; }) : (b.rad || 0) * PT));
        s.push('f\n');
      }

      for (i = 0; i < bk.imgs.length; i++) {
        var im = bk.imgs[i];
        var nm = imgMap.get(im.el);
        if (!nm) continue;
        var iy = pageHpt - (im.y - pxTop + im.h) * PT;
        s.push('q\n');
        if (im.clip) {
          s.push(roundRect(im.clip.x * PT, pageHpt - (im.clip.y - pxTop + im.clip.h) * PT,
                           im.clip.w * PT, im.clip.h * PT, (im.clip.rad || 0) * PT));
          s.push('W n\n');
        }
        s.push(num(im.w * PT) + ' 0 0 ' + num(im.h * PT) + ' ' +
               num(im.x * PT) + ' ' + num(iy) + ' cm /' + nm + ' Do Q\n');
      }

      /*@3.NOPJ2.117*/
      for (i = 0; i < (bk.vecs || []).length; i++) {
        var v = bk.vecs[i], ps = '', vc, vq;
        for (vq = 0; vq < v.cmds.length; vq++) {
          vc = v.cmds[vq];
          if (vc[0] === 'h') { ps += 'h\n'; continue; }
          for (var vj = 1; vj + 1 < vc.length; vj += 2) ps += num(vc[vj] * PT) + ' ' + num(pageHpt - (vc[vj + 1] - pxTop) * PT) + ' ';
          ps += vc[0] + '\n';
        }
        if (v.fill) { setFill(v.fill); s.push(ps + (v.eo ? 'f*\n' : 'f\n')); }
        if (v.stroke) {
          setStroke(v.stroke);
          s.push(num(Math.max(0.05, v.w) * PT) + ' w ' + v.cap + ' J ' + v.join + ' j ' +
                 (v.dash ? '[' + v.dash.map(function (x) { return num(x * PT); }).join(' ') + '] 0 d\n' : '[] 0 d\n') + ps + 'S\n');
        }
      }

      /*@3.NOPJ2.66*/
      for (i = 0; i < (bk.emo || []).length; i++) {
        var em = bk.emo[i];
        var enm2 = imgs.emoMap[em.cp];
        if (!enm2) continue;
        var side = Math.min(em.w, em.h);
        var ex = em.x + (em.w - side) / 2;
        var ey = pageHpt - (em.y - pxTop + (em.h - side) / 2 + side) * PT;
        s.push('q\n' + num(side * PT) + ' 0 0 ' + num(side * PT) + ' ' +
               num(ex * PT) + ' ' + num(ey) + ' cm /' + enm2 + ' Do Q\n');
      }

      var lastFace = '', lastSize = 0, lastTz = -1;
      s.push('BT\n');
      for (i = 0; i < bk.runs.length; i++) {
        var r = bk.runs[i];
        var t = textOps(r, faceMap);
        if (t.empty) continue;
        var y = pageHpt - (r.yBase - pxTop) * PT;
        if (Math.abs(lastTz - t.tz) > 0.4) { s.push(num(t.tz) + ' Tz\n'); lastTz = t.tz; }
        setFill(r.col);
        for (var sg = 0; sg < t.segs.length; sg++) {
          var seg = t.segs[sg];
          var fname = 'F_' + seg.face.id.replace(/[^\w]/g, '');
          if (lastFace !== fname || lastSize !== r.size) {
            s.push('/' + fname + ' ' + num(r.size * PT) + ' Tf\n');
            lastFace = fname; lastSize = r.size;
          }
          setFill(seg.col || r.col);
          s.push('1 0 0 1 ' + num(r.x * PT + seg.dx) + ' ' + num(y) +
                 ' Tm [' + seg.parts.join(' ') + '] TJ\n');
        }
      }
      s.push('ET\n');

      for (i = 0; i < bk.runs.length; i++) {
        var u = bk.runs[i];
        if (!u.under && !u.strike) continue;
        setFill(u.col);
        var uy = u.under
          ? pageHpt - (u.yBase - pxTop + u.size * 0.12) * PT
          : pageHpt - (u.yBase - pxTop - u.size * 0.28) * PT;
        s.push(num(u.x * PT) + ' ' + num(uy) + ' ' + num(u.w * PT) + ' ' +
               num(Math.max(0.5, u.size * 0.055 * PT)) + ' re f\n');
      }
    }
    emit(page);
    for (i = 0; i < (page.layers || []).length; i++) {
      var L = page.layers[i];
      s.push('q\n');
      if (L.mat) {
        var cxP = L.cx * PT, cyP = pageHpt - (L.cy - pxTop) * PT;
        var A = L.mat.a, Bm = -L.mat.b, C = -L.mat.c, D = L.mat.d;
        s.push(num(A) + ' ' + num(Bm) + ' ' + num(C) + ' ' + num(D) + ' ' +
               num(cxP - (A * cxP + C * cyP)) + ' ' + num(cyP - (Bm * cxP + D * cyP)) + ' cm\n');
      }
      lastCol = null; lastAlpha = '100';
      emit(L);
      s.push('Q\n');
      lastCol = null; lastAlpha = '100';
    }

    /*@3.NOPJ2.43*/
    var bandOn = false;
    for (i = 0; i < page.inks.length; i++) {
      var k = page.inks[i];
      /*@3.NOPJ2.104*/
      if (!!k.band !== bandOn) { bandOn = !!k.band; s.push(bandOn ? '/GM gs\n' : '/GN gs\n'); lastAlpha = null; }
      setAlpha(k.op);
      if (k.fill) {
        s.push(num(k.col[0]) + ' ' + num(k.col[1]) + ' ' + num(k.col[2]) + ' rg\n');
      } else {
        s.push(num(k.col[0]) + ' ' + num(k.col[1]) + ' ' + num(k.col[2]) + ' RG\n');
        s.push(num(k.w * PT) + ' w ' + (k.cap === 0 ? '0' : '1') + ' J 1 j\n');
      }
      var cm = k.cmds, cc, cq;
      for (var p = 0; p < cm.length; p++) {
        cc = cm[p];
        if (cc[0] === 'h') { s.push('h\n'); continue; }
        var seg = '';
        for (cq = 1; cq + 1 < cc.length; cq += 2) {
          seg += num(cc[cq] * PT) + ' ' + num(pageHpt - (cc[cq + 1] - pxTop) * PT) + ' ';
        }
        s.push(seg + cc[0] + '\n');
      }
      s.push(k.fill ? 'f\n' : 'S\n');
    }
    if (bandOn) s.push('/GN gs\n');
    setAlpha(1);

    s.push('Q\n');
    return s.join('');
  }

  /*@3.NOPJ2.14*/

  /*@3.NOPJ2.96*/
  var CSSTXT = {};
  function cssTexts(hrefs) {
    return Promise.all((hrefs || []).map(function (h) {
      if (CSSTXT[h] != null) return Promise.resolve(CSSTXT[h]);
      return fetch(h, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : null; }).then(function (t) {
        if (t == null) return null;
        var base = h.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
        t = t.replace(/url\((['"]?)(?!data:|https?:|\/)([^'")]+)\1\)/g, function (m0, q, u) { return 'url(' + q + base + u + q + ')'; });
        CSSTXT[h] = t; return t;
      }).catch(function () { return null; });
    }));
  }
  function mount(meta) {
    return cssTexts(meta.css || []).then(function (texts) { return mount2(meta, texts); });
  }
  function mount2(meta, texts) {
    return new Promise(function (res, rej) {
      var ifr = document.createElement('iframe');
      ifr.setAttribute('aria-hidden', 'true');
      ifr.setAttribute('tabindex', '-1');
      ifr.style.cssText = 'position:fixed;inset-block-start:0;inset-inline-start:0;' +
        'inline-size:' + (meta.pageW + 8) + 'px;block-size:600px;opacity:.01;' +
        'pointer-events:none;z-index:-1;border:0';
      document.body.appendChild(ifr);
      var d = ifr.contentDocument;
      var sheets = (meta.css || []).map(function (h, hi) {
        if (texts && texts[hi] != null) return '<style>' + texts[hi].replace(/<\/style/gi, '<\\/style') + '</style>';
        return '<link rel="stylesheet" href="' + h.replace(/"/g, '&quot;') + '">';
      }).join('');
      var pw = meta.pageW;
      /*@3.NOPJ2.77*/
      var PT = window.GardenPrintTheme;
      var mode = meta.printMode || (PT ? PT.readMode() : 'paper');
      var tkey = PT ? PT.resolve(mode) : 'paper';
      var dark = PT ? PT.isDark(mode) : false;
      var pset = PT ? PT.set(mode) : null;
      var page = pset ? pset.bg : '#ffffff';
      var css = (PT ? PT.vars(mode) : '') +
        'html,body{margin:0;padding:0;background:' + page + '}' +
        '.pgi{position:relative;inline-size:' + pw + 'px}' +
        '.pgi .na,.pgi .na-zoom,.pgi .na-page{display:block;block-size:auto;' +
        'min-block-size:0;inline-size:' + pw + 'px;max-inline-size:none;' +
        'overflow:visible;zoom:1}' +
        '.pgi > .na{background:transparent}' +
        '.pgi .na-page{margin:0}' +
        '.pgi .na-sheet{border-color:transparent;border-radius:0;box-shadow:none}' +
        '.pgi .ne-rail,.pgi .ne-wgrip,.pgi .ne-rgrip,.pgi .ne-selhint,.pgi .na-pgbar,' +
        '.pgi .ne-code-bar,.pgi .ne-menu,.pgi .ne-img-ed,.pgi .ne-tex,.pgi .ne-tbl-bar,' +
        '.pgi .ne-cap-ed,.pgi .nc-selbar,.pgi .na-quota{visibility:hidden !important}' +
        '.pgi .ne-tail,.pgi .ne-addbar{visibility:hidden !important}' +
        /*@3.NOPJ2.53*/
        'mjx-assistive-mml{display:none !important}' +
      '.pgi [data-ph]:empty::before{content:"" !important}' +
        /*@3.NOPJ2.78*/
        '.pgi .ne-dgm{border-color:transparent !important;background:transparent !important}' +
        '.pgi .ne-dgm-fix{visibility:hidden !important}' +
        '.pgi *{caret-color:transparent}';
      /*@3.NOPJ2.35*/
      var rootAttr = '';
      var ra = meta.rootAttrs || {}, rk;
      for (rk in ra) {
        if (rk === 'dir' || rk === 'lang' || rk === 'data-theme') continue;
        rootAttr += ' ' + rk + '="' + String(ra[rk]).replace(/"/g, '&quot;') + '"';
      }
      var incss = (meta.inlineCss || []).concat([css]), inl = '', ic;
      for (ic = 0; ic < incss.length; ic++) inl += '<style>' + String(incss[ic]).replace(/<\/style/gi, '<\\/style') + '</style>';
      d.open();
      d.write('<!DOCTYPE html><html dir="' + (meta.dir === 'rtl' ? 'rtl' : 'ltr') +
        '" lang="' + (meta.dir === 'rtl' ? 'ar' : 'en') +
        '" data-theme="' + (tkey === 'paper' ? 'light' : tkey) +
        '" data-print-mode="' + mode + '" data-print-dark="' + (dark ? '1' : '0') + '"' +
        rootAttr + '>' +
        '<head><meta charset="UTF-8">' + sheets + inl + '</head>' +
        '<body><div class="pgi">');
      /*@3.NOPJ2.122*/
      var body = String(meta.html || '').replace('<!--@3.NOPJ2.75-->', ''), at = 0, NB = body.length;
      var feed = function () {
        var t0 = Date.now(), e, c;
        try {
          while (at < NB && Date.now() - t0 < 40) {
            e = Math.min(NB, at + 65536);
            c = body.charCodeAt(e - 1);
            if (e < NB && ((c >= 0xD800 && c <= 0xDBFF) || c === 13)) e++;
            d.write(body.slice(at, e));
            at = e;
          }
        } catch (eW) { done = true; rej(eW); return; }
        step(meta, 'parse', at, NB);
        if (at < NB) { yieldNow(feed); return; }
        body = null;
        d.write('</div></body></html>');
        d.close();
        setTimeout(fin, 60);
        setTimeout(function () { if (!done) { done = true; rej(new Error('mount timeout')); } }, 30000);
      };

      var done = false;
      var fin = function () {
        if (done) return;
        done = true;
        var jobs = [];
        /*@3.NOPJ2.23*/
        var links = d.querySelectorAll('link[rel="stylesheet"]');
        for (var L = 0; L < links.length; L++) {
          if (links[L].sheet) continue;
          (function (lk) {
            jobs.push(new Promise(function (r3) {
              var t2 = setTimeout(r3, 6000);
              var k2 = function () { clearTimeout(t2); r3(); };
              lk.addEventListener('load', k2); lk.addEventListener('error', k2);
            }));
          }(links[L]));
        }
        /*@3.NOPJ2.36*/
        var imgs = [].slice.call(d.images || []);
        for (var i = 0; i < imgs.length; i++) {
          (function (im) {
            var src = im.currentSrc || im.src;
            im.setAttribute('loading', 'eager');
            im.setAttribute('decoding', 'sync');
            var sameOrigin = true;
            try { sameOrigin = (new URL(src, d.baseURI).origin === location.origin); }
            catch (e0) { sameOrigin = true; }
            var wait = function (retry) {
              return new Promise(function (r2) {
                var t = setTimeout(function () { r2(false); }, 9000);
                var ok = function () { clearTimeout(t); r2(true); };
                var bad = function () { clearTimeout(t); r2(false); };
                im.addEventListener('load', ok, { once: true });
                im.addEventListener('error', bad, { once: true });
                if (retry) { im.removeAttribute('crossorigin'); im.src = src; }
                else if (!sameOrigin) { im.crossOrigin = 'anonymous'; im.src = src; }
                else if (im.complete) { clearTimeout(t); r2(true); }
              });
            };
            jobs.push(wait(false).then(function (good) {
              if (good || sameOrigin) return null;
              return wait(true);
            }));
          }(imgs[i]));
        }
        var nJ = jobs.length, nD = 0;
        if (nJ) step(meta, 'assets', 0, nJ);
        jobs = jobs.map(function (j) { return j.then(function (v) { nD++; step(meta, 'assets', nD, nJ); return v; }); });
        Promise.all(jobs).then(function () {
          /*@3.NOPJ2.32*/
          var f2 = (d.fonts && d.fonts.ready) ? d.fonts.ready : Promise.resolve();
          return f2;
        }).then(function () {
          /*@3.NOPJ2.24*/
          return new Promise(function (r4) { setTimeout(r4, 160); });
        }).then(function () { res({ ifr: ifr, doc: d }); },
                function () { res({ ifr: ifr, doc: d }); });
      };
      feed();
    });
  }

  /*@3.NOPJ2.17*/
  function geomOf(d, meta) {
    var page = d.querySelector('.na-page');
    var host = d.querySelector('.pgi');
    var el = page || host;
    var cs = d.defaultView.getComputedStyle(el);
    function pv(name, dflt) {
      var v = parseFloat(cs.getPropertyValue(name));
      return (isFinite(v) && v > 1) ? v : dflt;
    }
    var ph = pv('--na-sheeth', pv('--na-a4h', meta.pageH || 1123));
    var pw = Math.round(el.getBoundingClientRect().width) || (meta.pageW || 794);
    var np = parseInt(page && page.getAttribute('data-pages'), 10);
    if (!(np > 0)) np = 0;
    return { el: el, org: el.getBoundingClientRect(), ph: ph, pw: pw, pages: np };
  }

  /*@3.NOPJ2.88*/
  function clipBand(o, top, bot) {
    var i, it, y0, y1, keep;
    var band = function (list, yOf, hOf, clampIt) {
      var out = [];
      for (i = 0; i < list.length; i++) {
        it = list[i]; y0 = yOf(it); y1 = y0 + hOf(it);
        if (y1 <= top + 0.25 || y0 >= bot - 0.25) continue;
        if (clampIt) clampIt(it, y0, y1);
        out.push(it);
      }
      return out;
    };
    o.boxes = band(o.boxes, function (b) { return b.y; }, function (b) { return b.h; }, function (b, y0, y1) {
      var a = Math.max(y0, top), z = Math.min(y1, bot);
      if (a > y0 + 0.25 || z < y1 - 0.25) { b.y = a; b.h = z - a; cutRad(b, a > y0 + 0.25, z < y1 - 0.25); }
    });
    o.imgs = band(o.imgs, function (b) { return b.cy; }, function (b) { return b.ch; }, function (b) {
      if (!b.clip) b.clip = { x: -1e6, y: top, w: 2e6, h: bot - top, rad: 0 };
      else { var c = b.clip, a = Math.max(c.y, top), z = Math.min(c.y + c.h, bot); c.y = a; c.h = Math.max(0, z - a); }
    });
    o.links = band(o.links, function (b) { return b.y; }, function (b) { return b.h; }, null);
    o.emo = band(o.emo, function (b) { return b.y; }, function (b) { return b.h; }, null);
    o.vecs = band(o.vecs || [], function (b) { return b.y; }, function (b) { return b.h; }, null);
    keep = [];
    for (i = 0; i < o.runs.length; i++) {
      it = o.runs[i];
      var mid = it.yTop + it.h / 2;
      if (mid < top || mid >= bot) continue;
      keep.push(it);
    }
    o.runs = keep;
    keep = [];
    for (i = 0; i < o.marks.length; i++) { it = o.marks[i]; if (it.y >= top && it.y < bot) keep.push(it); }
    o.marks = keep;
    keep = [];
    for (i = 0; i < (o.layers || []).length; i++) { it = o.layers[i]; if (it.y1 > top + 0.25 && it.y0 < bot - 0.25) keep.push(it); }
    o.layers = keep;
    return o;
  }

  var NOSVG = { acceptNode: function (n) { return (n.nodeType === 1 && n.nodeName.toLowerCase() === 'svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } };
  function textStep(f) { f.text = 1; return f; }
  /*@3.NOPJ2.121*/
  var yieldNow = (function () {
    if (typeof MessageChannel !== 'function') return function (f) { setTimeout(f, 0); };
    var ch = new MessageChannel(), q = [];
    ch.port1.onmessage = function () { var f = q.shift(); if (f) f(); };
    return function (f) { q.push(f); ch.port2.postMessage(0); };
  }());
  function harvestInto(d, host, org, o) {
    var st = harvestPlan(d, host, org, o), i;
    for (i = 0; i < st.length; i++) st[i](0);
    return o;
  }
  /*@3.NOPJ2.119*/
  function harvestPlan(d, host, org, o) {
    var slot = [], walker = null;
    return [
      function () {
        /*@3.NOPJ2.89*/
        var frees = [].slice.call(host.querySelectorAll('.ne-root > [data-bid][data-fp]')), fi;
        for (fi = 0; fi < frees.length; fi++) {
          slot.push({ n: frees[fi], p: frees[fi].parentNode, nx: frees[fi].nextSibling });
          frees[fi].parentNode.removeChild(frees[fi]);
        }
      },
      function () { harvestBoxes(host, org, o.boxes); },
      function () { o.vecs = o.vecs || []; harvestSvg(host, org, o); },
      function () { harvestImages(host, org, o.imgs, o.pend); harvestLinks(host, org, o.links, o.dests); harvestOutline(host, org, o.marks); },
      function () { harvestPseudo(host, org, o.runs, o.boxes, o.imgs, o.pend); },
      textStep(function (budget) {
        if (!walker) walker = d.createTreeWalker(host, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, NOSVG);
        var n, k = 0, t0 = budget ? Date.now() : 0;
        while ((n = walker.nextNode())) {
          if (n.nodeType === 3) harvestText(n, org, o.runs, o.emo);
          if (budget && !(++k & 255) && Date.now() - t0 > budget) return false;
        }
        return true;
      }),
      function () {
        var fi;
        o.layers = o.layers || [];
        /*@3.NOPJ2.111*/
        for (fi = 0; fi < slot.length; fi++) {
          var sl0 = slot[fi];
          if (sl0.nx && sl0.nx.parentNode === sl0.p) sl0.p.insertBefore(sl0.n, sl0.nx); else sl0.p.appendChild(sl0.n);
        }
        for (fi = 0; fi < slot.length; fi++) {
          var lay = harvestFree(d, slot[fi].n, org, o);
          if (lay) o.layers.push(lay);
        }
        o.layers.sort(function (a, b) { return a.z - b.z; });
      }
    ];
  }

  /*@3.NOPJ2.90*/
  function harvestFree(d, node, org, o) {
    var cs = getComputedStyle(node);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return null;
    var vr = node.getBoundingClientRect();
    if (vr.width < 0.5 || vr.height < 0.5) return null;
    var tf = node.style.transform, mat = null;
    var m = /^matrix\(([^)]+)\)$/.exec(cs.transform || '');
    if (m) {
      var v = m[1].split(',').map(parseFloat);
      if (v.length === 6 && (Math.abs(v[0] - 1) > 1e-4 || Math.abs(v[1]) > 1e-4 || Math.abs(v[2]) > 1e-4 || Math.abs(v[3] - 1) > 1e-4)) {
        mat = { a: v[0], b: v[1], c: v[2], d: v[3] };
      }
    }
    if (mat) node.style.transform = 'none';
    var br = node.getBoundingClientRect();
    var to = String(cs.transformOrigin || '').split(/\s+/);
    var ox = parseFloat(to[0]); if (!isFinite(ox)) ox = br.width / 2;
    var oy = parseFloat(to[1]); if (!isFinite(oy)) oy = br.height / 2;
    var lay = { boxes: [], imgs: [], runs: [], emo: [], links: [], marks: [], vecs: [], dests: {}, pend: o.pend,
                mat: mat, cx: br.left - org.left + ox, cy: br.top - org.top + oy,
                y0: vr.top - org.top, y1: vr.bottom - org.top, z: parseFloat(cs.zIndex) || 0 };
    harvestBoxes(node, org, lay.boxes);
    harvestSvg(node, org, lay);
    harvestImages(node, org, lay.imgs, o.pend);
    harvestLinks(node, org, lay.links, lay.dests);
    harvestPseudo(node, org, lay.runs, lay.boxes, lay.imgs, o.pend);
    var walker = d.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, NOSVG), n;
    while ((n = walker.nextNode())) { if (n.nodeType === 3) harvestText(n, org, lay.runs, lay.emo); }
    if (mat) node.style.transform = tf;
    return lay;
  }

  function harvest(d, meta) {
    var H = harvestBegin(d, meta), si, st, i;
    for (si = 0; si < H.n; si++) { st = harvestSec(H, si); for (i = 0; i < st.length; i++) st[i](0); }
    return harvestEnd(H);
  }
  /*@3.NOPJ2.120*/
  function harvestAsync(d, meta, onTick) {
    var H = harvestBegin(d, meta), si = 0, st = null, i = 0, BUD = 40;
    return new Promise(function (res, rej) {
      function go() {
        var t0 = Date.now();
        try {
          while (si < H.n) {
            if (!st) { st = harvestSec(H, si); i = 0; }
            while (i < st.length) {
              if (st[i](BUD) !== false) i++;
              if (Date.now() - t0 > BUD) break;
            }
            if (i >= st.length) { st = null; si++; }
            if (Date.now() - t0 > BUD) break;
          }
        } catch (eH) { rej(eH); return; }
        if (onTick) { try { onTick(H.lastY / (H.g.ph || 1)); } catch (eT) {} }
        if (si >= H.n) { try { res(harvestEnd(H)); } catch (eE) { rej(eE); } return; }
        yieldNow(go);
      }
      go();
    });
  }
  function harvestBegin(d, meta) {
    CLIPS = null;
    var host = d.querySelector('.pgi'), g = geomOf(d, meta);
    var H = { d: d, host: host, sheet: d.querySelector('.na-sheet') || host, g: g, org: g.org,
              runs: [], boxes: [], links: [], imgs: [], marks: [], emo: [], pend: [], layers: [], vecs: [], dests: {},
              secs: d.querySelectorAll('.pgw'), lastY: 0 };
    H.n = H.secs.length || 1;
    return H;
  }
  function harvestSec(H, si) {
    var org = H.org, st, o;
    if (!H.secs.length) {
      o = { runs: H.runs, boxes: H.boxes, links: H.links, imgs: H.imgs, marks: H.marks, emo: H.emo, layers: H.layers, vecs: H.vecs, dests: H.dests, pend: H.pend };
      st = harvestPlan(H.d, H.host, org, o);
      st.push(function () { H.runs = o.runs; H.boxes = o.boxes; H.layers = o.layers || []; H.vecs = o.vecs || []; });
    } else {
      var sec = H.secs[si], secR = null;
      o = { runs: [], boxes: [], links: [], imgs: [], marks: [], emo: [], layers: [], vecs: [], dests: H.dests, pend: H.pend };
      st = harvestPlan(H.d, sec, org, o);
      st.unshift(function () { secR = sec.getBoundingClientRect(); org.band = { top: secR.top, bottom: secR.bottom }; });
      st.push(function () {
        org.band = null;
        clipBand(o, secR.top - org.top, secR.bottom - org.top);
        H.runs = H.runs.concat(o.runs); H.boxes = H.boxes.concat(o.boxes); H.links = H.links.concat(o.links);
        H.imgs = H.imgs.concat(o.imgs); H.marks = H.marks.concat(o.marks); H.emo = H.emo.concat(o.emo);
        H.layers = H.layers.concat(o.layers || []); H.vecs = H.vecs.concat(o.vecs || []);
      });
    }
    var q, tx;
    for (q = 0; q < st.length; q++) if (st[q].text) break;
    tx = st[q];
    st[q] = function (bud) { var r = tx(bud), l = o.runs[o.runs.length - 1]; if (l && l.yTop > H.lastY) H.lastY = l.yTop; return r; };
    return st;
  }
  function harvestEnd(H) {
    var host = H.host, org = H.org, g = H.g, runs = H.runs, boxes = H.boxes, links = H.links, imgs = H.imgs,
        emo = H.emo, layers = H.layers, vecs = H.vecs;
    /*@3.NOPJ2.15*/
    var far = host.getBoundingClientRect().height;
    var sr = H.sheet.getBoundingClientRect();
    if (sr.bottom - org.top > far) far = sr.bottom - org.top;
    var q;
    for (q = 0; q < boxes.length; q++) {
      if (boxes[q].y + boxes[q].h > far) far = boxes[q].y + boxes[q].h;
    }
    for (q = 0; q < runs.length; q++) {
      if (runs[q].yTop + runs[q].h > far) far = runs[q].yTop + runs[q].h;
    }
    for (q = 0; q < vecs.length; q++) {
      if (vecs[q].y + vecs[q].h > far) far = vecs[q].y + vecs[q].h;
    }
    /*@3.NOPJ2.91*/
    var allRuns = runs.slice(), allImgs = imgs.slice(), allEmo = emo.slice();
    for (q = 0; q < layers.length; q++) {
      var lk = layers[q].links, lq;
      for (lq = 0; lq < lk.length; lq++) links.push(lk[lq]);
      if (layers[q].y1 > far) far = layers[q].y1;
      allRuns = allRuns.concat(layers[q].runs); allImgs = allImgs.concat(layers[q].imgs); allEmo = allEmo.concat(layers[q].emo);
    }
    return { runs: runs, boxes: boxes, links: links, imgs: imgs, marks: H.marks, layers: layers, vecs: vecs,
             allRuns: allRuns, allImgs: allImgs, allEmo: allEmo,
             emo: emo, dests: H.dests, height: far, sheetH: sr.height, org: org,
             ph: g.ph, pw: g.pw, pages: g.pages, pend: H.pend };
  }

  function sliceRange(pages, range) {
    if (!range) return pages;
    var a = Math.max(1, Math.min(pages.length, range.from | 0));
    var b = Math.max(a, Math.min(pages.length, range.to | 0));
    return pages.slice(a - 1, b);
  }

  /*@3.NOPJ2.93*/
  var MAX_PAGES = 4000;
  function paginate(h, meta) {
    var ph = h.ph || meta.pageH || 1123;
    /*@3.NOPJ2.33*/
    var cuts = (Array.isArray(meta.cuts) && meta.cuts.length > 1) ? meta.cuts : null;
    var need = Math.ceil(h.height / ph - 0.02);
    var n = Math.max(1, h.pages || 0, need);
    n = Math.min(MAX_PAGES, n);
    var pages = [];
    var i;
    if (cuts) {
      n = Math.max(1, Math.min(MAX_PAGES, cuts.length - 1));
      for (i = 0; i < n; i++) {
        var bhC = Math.max(1, cuts[i + 1] - cuts[i]);
        if (i === n - 1) bhC = Math.max(bhC, Math.min(ph, h.height - cuts[i]));
        pages.push({ top: cuts[i], bh: bhC, oi: i, runs: [], boxes: [], imgs: [], inks: [],
                     links: [], emo: [], layers: [], vecs: [] });
      }
    } else {
      for (i = 0; i < n; i++) {
        pages.push({ top: i * ph, oi: i, runs: [], boxes: [], imgs: [], inks: [], links: [],
                     emo: [], layers: [], vecs: [] });
      }
    }
    function bandOf(p) { return pages[p].bh || ph; }
    /*@3.NOPJ2.97*/
    function clampTo(key, it, top, bot) {
      if (key === 'boxes') {
        var a = Math.max(it.y, top), z = Math.min(it.y + it.h, bot);
        if (a <= it.y + 0.25 && z >= it.y + it.h - 0.25) return it;
        var c = {}; for (var k in it) if (Object.prototype.hasOwnProperty.call(it, k)) c[k] = it[k];
        c.y = a; c.h = Math.max(0, z - a); cutRad(c, a > it.y + 0.25, z < it.y + it.h - 0.25); return c;
      }
      if (key === 'imgs') {
        var c2 = {}; for (var k2 in it) if (Object.prototype.hasOwnProperty.call(it, k2)) c2[k2] = it[k2];
        if (!it.clip) c2.clip = { x: -1e6, y: top, w: 2e6, h: bot - top, rad: 0 };
        else { var cl = it.clip, a2 = Math.max(cl.y, top), z2 = Math.min(cl.y + cl.h, bot); c2.clip = { x: cl.x, y: a2, w: cl.w, h: Math.max(0, z2 - a2), rad: cl.rad }; }
        return c2;
      }
      return it;
    }
    function place(list, key, getY, getH) {
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        var y0 = getY(it), y1 = y0 + getH(it);
        if (cuts) {
          for (var q = 0; q < n; q++) {
            if (y0 < pages[q].top + bandOf(q) && y1 > pages[q].top) pages[q][key].push(clampTo(key, it, pages[q].top, pages[q].top + bandOf(q)));
          }
          continue;
        }
        var a = Math.max(0, Math.floor(y0 / ph));
        var b = Math.min(n - 1, Math.floor((y1 - 0.5) / ph));
        for (var p = a; p <= b; p++) pages[p][key].push(it);
      }
    }
    place(h.boxes, 'boxes', function (b) { return b.y; }, function (b) { return b.h; });
    place(h.imgs, 'imgs', function (b) { return Math.min(b.y, b.cy); },
          function (b) { return Math.max(b.h, b.ch) + Math.abs(b.cy - b.y); });
    place(h.links, 'links', function (b) { return b.y; }, function (b) { return b.h; });
    place(h.emo || [], 'emo', function (b) { return b.y; }, function (b) { return b.h; });
    place(h.layers || [], 'layers', function (b) { return b.y0; }, function (b) { return b.y1 - b.y0; });
    place(h.vecs || [], 'vecs', function (b) { return b.y; }, function (b) { return b.h; });
    for (i = 0; i < h.runs.length; i++) {
      var r = h.runs[i];
      var p;
      if (cuts) {
        p = n - 1;
        for (var q2 = 0; q2 < n; q2++) {
          if (r.yBase < pages[q2].top + bandOf(q2)) { p = q2; break; }
        }
      } else {
        p = Math.max(0, Math.min(n - 1, Math.floor(r.yBase / ph)));
      }
      pages[p].runs.push(r);
    }
    return pages;
  }

  /*@3.NOPJ2.73*/
  function trimBlank(pages, inks, meta) {
    var floorN = Math.max(1, (meta && meta.pages) || 0);
    var far = 0, i;
    for (i = 0; i < (inks || []).length; i++) {
      if ((inks[i].y1 || 0) > far) far = inks[i].y1 || 0;
    }
    while (pages.length > floorN) {
      var lp = pages[pages.length - 1];
      if (lp.runs.length || lp.boxes.length || lp.imgs.length ||
          lp.links.length || lp.emo.length || (lp.layers && lp.layers.length) || (lp.vecs && lp.vecs.length)) break;
      if (far > lp.top) break;
      pages.pop();
    }
  }

  /*@3.NOPJ2.18*/
  function hiHexOf(name) {
    var K = window.GardenCanvas;
    if (K && K.hiHexOf) { try { return K.hiHexOf(name); } catch (e) {} }
    return inkHex(name);
  }
  function inkHex(name) {
    var K = window.GardenCanvas;
    if (K && K.TONES && K.TONES[name] && K.TONES[name].light) return K.TONES[name].light;
    if (K && K.hexOf) { try { return K.hexOf(name); } catch (e) {} }
    return '#111827';
  }

  function hexRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) +
                            h.charAt(2) + h.charAt(2);
    var n = parseInt(h, 16);
    if (!isFinite(n)) return [0.07, 0.09, 0.15];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function strokesOf(src) {
    var C = window.GardenInkCodec;
    var shapes = (src && src.shapes) || [];
    /*@3.NOPJ2.83*/
    if (src && Array.isArray(src.els)) return Promise.resolve(shapes.concat(src.els));
    if (!src || !src.ink) return Promise.resolve(shapes.slice());
    if (!C || !C.unpack) return Promise.resolve(shapes.slice());
    return C.unpack(src.ink).then(function (list) {
      return shapes.concat((list || []).map(function (st) {
        return { ty: 'st', c: st.color || 'ink', w: st.w || 2.4, nib: st.nib,
                 o: st.tool === 'hi' ? 0.32 : 1, pts: st.pts || [] };
      }));
    })['catch'](function () { return shapes.slice(); });
  }

  /*@3.NOPJ2.41*/
  function inkCmds(el, box, k) {
    var K = window.GardenCanvas;
    if (!K || !K.inkGeom || !K.inkPaints) return null;
    var geom = K.inkGeom(el, k, function (x, y) {
      return { x: box.x + x * k, y: box.y + y * k };
    });
    if (!geom) return null;
    var cmds = [], cur = null;
    var api = {
      move: function (x, y) { cur = [x, y]; cmds.push(['m', x, y]); },
      line: function (x, y) { cur = [x, y]; cmds.push(['l', x, y]); },
      quad: function (cx, cy, x, y) {
        var x0 = cur ? cur[0] : cx, y0 = cur ? cur[1] : cy;
        cmds.push(['c', x0 + 2 / 3 * (cx - x0), y0 + 2 / 3 * (cy - y0),
                   x + 2 / 3 * (cx - x), y + 2 / 3 * (cy - y), x, y]);
        cur = [x, y];
      },
      close: function () { cmds.push(['h']); },
      circle: function (x, y, r) {
        var c = r * 0.5523;
        cmds.push(['m', x - r, y]);
        cmds.push(['c', x - r, y - c, x - c, y - r, x, y - r]);
        cmds.push(['c', x + c, y - r, x + r, y - c, x + r, y]);
        cmds.push(['c', x + r, y + c, x + c, y + r, x, y + r]);
        cmds.push(['c', x - c, y + r, x - r, y + c, x - r, y]);
        cmds.push(['h']);
        cur = [x - r, y];
      }
    };
    /*@3.NOPJ2.79*/
    var lay = K.inkPaints(geom), out = [], i;
    for (i = 0; i < lay.length; i++) {
      cmds = []; cur = null;
      lay[i].emit(api);
      if (!cmds.length) continue;
      out.push({ cmds: cmds, fill: !!lay[i].fill,
                 w: lay[i].w || 0, op: lay[i].alpha });
    }
    return out;
  }

  /*@3.NOPJ2.103*/
  function bandCmds(e, box, k) {
    var K = window.GardenCanvas, pts = e.pts || [], qs = [], i;
    for (i = 0; i < pts.length; i++) {
      var p0 = pts[i];
      var xx = (p0 && p0.x != null) ? p0.x : (p0 && p0[0]), yy = (p0 && p0.y != null) ? p0.y : (p0 && p0[1]);
      if (xx == null || yy == null) continue;
      qs.push({ x: box.x + xx * k, y: box.y + yy * k });
    }
    if (!qs.length) return null;
    var nibS = (K && K.NIBS && K.NIBS[e.nib] && K.NIBS[e.nib].scale) || (e.nib === 'marker' ? 1.55 : 1);
    var cmds = [['m', qs[0].x, qs[0].y]];
    if (qs.length === 1) cmds.push(['l', qs[0].x + 0.6, qs[0].y]);
    else if (qs.length === 2) cmds.push(['l', qs[1].x, qs[1].y]);
    else {
      var cur = qs[0];
      for (i = 1; i < qs.length - 1; i++) {
        var cx = qs[i].x, cy = qs[i].y, mx = (qs[i].x + qs[i + 1].x) / 2, my = (qs[i].y + qs[i + 1].y) / 2;
        cmds.push(['c', cur.x + 2 / 3 * (cx - cur.x), cur.y + 2 / 3 * (cy - cur.y), mx + 2 / 3 * (cx - mx), my + 2 / 3 * (cy - my), mx, my]);
        cur = { x: mx, y: my };
      }
      cmds.push(['l', qs[qs.length - 1].x, qs[qs.length - 1].y]);
    }
    return [{ cmds: cmds, fill: false, w: Math.max(1, (e.w || 2) * nibS * k), alpha: 1, band: 1 }];
  }
  function inkFrom(src, box, scale) {
    return strokesOf(src).then(function (els) {
      var out = [], i, g, p;
      var k = scale || 1;
      for (i = 0; i < els.length; i++) {
        var e = els[i];
        if (e.ty !== 'st' || !e.pts || !e.pts.length) continue;
        var lay = (e.hi && !e.u) ? bandCmds(e, box, k) : inkCmds(e, box, k);
        if (!lay || !lay.length) continue;
        for (p = 0; p < lay.length; p++) {
          g = lay[p];
          var xs = [], ys = [], c, j;
          for (j = 0; j < g.cmds.length; j++) {
            c = g.cmds[j];
            for (var q = 1; q + 1 < c.length; q += 2) { xs.push(c[q]); ys.push(c[q + 1]); }
          }
          if (!xs.length) continue;
          out.push({ cmds: g.cmds, fill: g.fill, col: hexRgb(g.band ? hiHexOf(e.c) : inkHex(e.c)),
                     w: Math.max(0.4, g.w), op: (g.band ? 1 : g.op), band: !!g.band, cap: g.band ? 0 : 1,
                     y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) });
        }
      }
      return out;
    });
  }

  /*@3.NOPJ2.19*/
  function inkLayers(d, meta, docModel, org) {
    var jobs = [];
    var ov = docModel && docModel.ov;
    if (ov && (ov.ink || ov.els || (ov.shapes && ov.shapes.length))) {
      var host = d.querySelector('.mink');
      var box = null, k = 1;
      /*@3.NOPJ2.80*/
      var bd = meta.board;
      if (bd && bd.w > 0 && bd.h > 0) {
        var shb = d.querySelector('.na-sheet');
        if (shb) {
          var srb = shb.getBoundingClientRect();
          k = srb.width / bd.w;
          box = { x: (srb.left - org.left) - bd.x * k,
                  y: (srb.top - org.top) - bd.y * k };
        }
      } else if (host) {
        var r = host.getBoundingClientRect();
        box = { x: r.left - org.left, y: r.top - org.top };
        k = (meta.inkBox && meta.inkBox.w) ? (r.width / meta.inkBox.w) : 1;
      } else if (meta.inkBox) {
        /*@3.NOPJ2.34*/
        var sh = d.querySelector('.na-sheet');
        if (sh) {
          var sr2 = sh.getBoundingClientRect();
          var rtlDoc = (meta.dir !== 'ltr');
          var left = rtlDoc
            ? (sr2.width - (meta.inkBox.start || 0) - (meta.inkBox.w || sr2.width))
            : (meta.inkBox.start || 0);
          box = { x: (sr2.left - org.left) + left,
                  y: (sr2.top - org.top) + (meta.inkBox.top || 0) };
        }
      }
      if (box) jobs.push(inkFrom(ov, box, k || 1));
    }
    var blocks = d.querySelectorAll('[data-ty="ink"]');
    var byId = {};
    if (docModel && docModel.blocks) {
      for (var q = 0; q < docModel.blocks.length; q++) {
        byId[docModel.blocks[q].id] = docModel.blocks[q];
      }
    }
    for (var i = 0; i < blocks.length; i++) {
      var bid = blocks[i].getAttribute('data-bid');
      var mb = byId[bid];
      if (!mb) continue;
      var host2 = blocks[i].querySelector('img, canvas, svg, .ne-ink') || blocks[i];
      var rr = host2.getBoundingClientRect();
      if (rr.width < 2 || rr.height < 2) continue;
      var sc = (mb.w > 0) ? (rr.width / mb.w) : 1;
      jobs.push(inkFrom(mb, { x: rr.left - org.left, y: rr.top - org.top }, sc));
    }
    if (!jobs.length) return Promise.resolve([]);
    return Promise.all(jobs).then(function (lists) {
      var all = [];
      for (var i = 0; i < lists.length; i++) {
        for (var j = 0; j < lists[i].length; j++) all.push(lists[i][j]);
      }
      return all;
    });
  }

  function encodeImages(h) {
    var imgMap = new Map(), jpegs = [], emoMap = {}, emos = [];
    IMGFAIL = 0;
    /*@3.NOPJ2.67*/
    var big = {}, q, e;
    var emoAll = h.allEmo || h.emo || [], imgAll = h.allImgs || h.imgs || [];
    for (q = 0; q < emoAll.length; q++) {
      e = emoAll[q];
      if (!big[e.cp] || e.h > big[e.cp]) big[e.cp] = e.h;
    }
    var cps = Object.keys(big);
    for (q = 0; q < cps.length; q++) {
      var bits = emoBits(parseInt(cps[q], 10), big[cps[q]]);
      if (!bits) continue;
      var enm = 'Em' + (emos.length + 1);
      emos.push({ nm: enm, b: bits });
      emoMap[cps[q]] = enm;
    }
    for (var i = 0; i < imgAll.length; i++) {
      var rec = imgAll[i];
      if (imgMap.has(rec.el)) continue;
      /*@3.NOPJ2.87*/
      if (rec.alpha) {
        if (!rec.el.complete || !rec.el.naturalWidth) { IMGFAIL++; continue; }
        var ab = alphaOf(rec.el, Math.max(rec.w, rec.h));
        if (!ab) { IMGFAIL++; continue; }
        var anm = 'Em' + (emos.length + 1);
        emos.push({ nm: anm, b: ab });
        imgMap.set(rec.el, anm);
        continue;
      }
      var j = jpegOf(rec.el, Math.max(rec.w, rec.h));
      if (!j) { IMGFAIL++; continue; }
      var nm = 'Im' + (jpegs.length + 1);
      jpegs.push({ nm: nm, j: j });
      imgMap.set(rec.el, nm);
    }
    return { imgMap: imgMap, jpegs: jpegs, emoMap: emoMap, emos: emos };
  }

  function zipEmos(imgs) {
    var jobs = imgs.emos.map(function (e) {
      return Promise.all([deflate(e.b.rgb), deflate(e.b.al)]).then(function (r) {
        e.rgz = r[0]; e.alz = r[1];
      });
    });
    imgs.jpegs.forEach(function (e) {
      if (!e.j || !e.j.raw) return;
      jobs.push(deflate(e.j.data).then(function (z) { if (z) e.j.z = z; }));
    });
    return Promise.all(jobs);
  }

  var PAD1 = new Uint8Array(1);

  /*@3.NOPJ2.69*/
  function u16(d, p) { return (d[p] << 8) | d[p + 1]; }
  function i16(d, p) { var v = u16(d, p); return v > 32767 ? v - 65536 : v; }
  function u32(d, p) {
    return ((d[p] << 24) | (d[p + 1] << 16) | (d[p + 2] << 8) | d[p + 3]) >>> 0;
  }
  function put32(d, p, v) {
    d[p] = (v >>> 24) & 255; d[p + 1] = (v >>> 16) & 255;
    d[p + 2] = (v >>> 8) & 255; d[p + 3] = v & 255;
  }

  function sfntTables(d) {
    var n = u16(d, 4), out = {}, i, p, tag;
    for (i = 0; i < n; i++) {
      p = 12 + i * 16;
      tag = String.fromCharCode(d[p], d[p + 1], d[p + 2], d[p + 3]);
      out[tag] = { off: u32(d, p + 8), len: u32(d, p + 12) };
    }
    return out;
  }

  /*@3.NOPJ2.59*/
  function compClose(d, glyf, loca, gid, want, depth) {
    if (depth > 5) return;
    var a = loca[gid], b = loca[gid + 1];
    if (b - a < 10) return;
    var p = glyf + a;
    if (i16(d, p) >= 0) return;
    p += 10;
    for (;;) {
      var flags = u16(d, p), idx = u16(d, p + 2);
      p += 4;
      p += (flags & 0x0001) ? 4 : 2;
      if (flags & 0x0008) p += 2;
      else if (flags & 0x0040) p += 4;
      else if (flags & 0x0080) p += 8;
      if (!want[idx]) { want[idx] = 1; compClose(d, glyf, loca, idx, want, depth + 1); }
      if (!(flags & 0x0020)) break;
      if (p >= glyf + b) break;
    }
  }

  function subsetGlyf(d, used) {
    try {
      if (u32(d, 0) === 0x4F54544F) return d;
      var t = sfntTables(d);
      if (!t.glyf || !t.loca || !t.head || !t.maxp) return d;
      var nG = u16(d, t.maxp.off + 4);
      var longLoca = i16(d, t.head.off + 50) === 1;
      var loca = new Uint32Array(nG + 1), i;
      for (i = 0; i <= nG; i++) {
        loca[i] = longLoca ? u32(d, t.loca.off + i * 4)
                           : (u16(d, t.loca.off + i * 2) * 2);
      }
      var want = {};
      want[0] = 1;
      for (i in used) if (used.hasOwnProperty(i)) want[i | 0] = 1;
      var keys = Object.keys(want);
      for (i = 0; i < keys.length; i++) {
        compClose(d, t.glyf.off, loca, keys[i] | 0, want, 0);
      }

      var nl = new Uint32Array(nG + 1), body = [], at = 0, g, a, b, ln;
      for (g = 0; g < nG; g++) {
        nl[g] = at;
        if (!want[g]) continue;
        a = loca[g]; b = loca[g + 1];
        ln = b - a;
        if (ln <= 0) continue;
        body.push(d.subarray(t.glyf.off + a, t.glyf.off + b));
        at += ln;
        while (at & 3) { body.push(PAD1); at++; }
      }
      nl[nG] = at;
      if (at >= t.glyf.len) return d;

      var glyfNew = concat(body);
      var locaNew = new Uint8Array((nG + 1) * 4);
      for (i = 0; i <= nG; i++) put32(locaNew, i * 4, nl[i]);

      var tags = Object.keys(t).sort();
      var head = d.subarray(t.head.off, t.head.off + t.head.len).slice();
      head[50] = 0; head[51] = 1;
      put32(head, 8, 0);
      var parts = {};
      for (i = 0; i < tags.length; i++) {
        var tg = tags[i];
        if (tg === 'glyf') parts[tg] = glyfNew;
        else if (tg === 'loca') parts[tg] = locaNew;
        else if (tg === 'head') parts[tg] = head;
        else parts[tg] = d.subarray(t[tg].off, t[tg].off + t[tg].len);
      }

      var nT = tags.length;
      var dirLen = 12 + nT * 16;
      var total = dirLen, offs = {};
      for (i = 0; i < nT; i++) {
        offs[tags[i]] = total;
        total += parts[tags[i]].length;
        while (total & 3) total++;
      }
      var out = new Uint8Array(total);
      out.set(d.subarray(0, 12), 0);
      var sr = 1, es = 0;
      while (sr * 2 <= nT) { sr *= 2; es++; }
      out[4] = (nT >> 8) & 255; out[5] = nT & 255;
      var sr16 = sr * 16;
      out[6] = (sr16 >> 8) & 255; out[7] = sr16 & 255;
      out[8] = (es >> 8) & 255; out[9] = es & 255;
      var rng = nT * 16 - sr16;
      out[10] = (rng >> 8) & 255; out[11] = rng & 255;
      for (i = 0; i < nT; i++) {
        var p2 = 12 + i * 16, tg2 = tags[i], buf = parts[tg2];
        out[p2] = tg2.charCodeAt(0); out[p2 + 1] = tg2.charCodeAt(1);
        out[p2 + 2] = tg2.charCodeAt(2); out[p2 + 3] = tg2.charCodeAt(3);
        var sum = 0, q;
        for (q = 0; q + 3 < buf.length; q += 4) sum = (sum + u32(buf, q)) >>> 0;
        if (q < buf.length) {
          var tail = 0, z;
          for (z = 0; z < 4; z++) tail = ((tail << 8) | (q + z < buf.length ? buf[q + z] : 0)) >>> 0;
          sum = (sum + tail) >>> 0;
        }
        put32(out, p2 + 4, sum);
        put32(out, p2 + 8, offs[tg2]);
        put32(out, p2 + 12, buf.length);
        out.set(buf, offs[tg2]);
      }
      return out;
    } catch (e) {
      return d;
    }
  }

  function assemble(h, pages, meta, faceMap, streams, imgs) {
    var doc = new Doc(), i;
    var pagesId = doc.reserve();
    var pageIds = [];
    for (i = 0; i < pages.length; i++) pageIds.push(doc.reserve());

    var ph = h.ph || meta.pageH || 1123;
    var pw = (h.pw || meta.pageW || 794) * PT, phPt = ph * PT;

    var fontRefs = {};
    /*@3.NOPJ2.54*/
    var faceKeys = Object.keys(faceMap).filter(function (k) {
      return Object.keys(faceMap[k].used || {}).length > 0;
    });
    if (!faceKeys.length) faceKeys = Object.keys(faceMap).slice(0, 1);
    for (i = 0; i < faceKeys.length; i++) {
      var fid = faceKeys[i], f = faceMap[fid], tag = fid.replace(/[^\w]/g, '');
      /*@3.NOPJ2.68*/
      var tt = subsetGlyf(f.ttf, f.used);
      var ff = doc.add(concat([
        bytes('<< /Length ' + tt.length + ' /Length1 ' + tt.length + ' >>\nstream\n'),
        tt, bytes('\nendstream')
      ]));
      var fd = doc.add('<< /Type /FontDescriptor /FontName /GRDN+' + tag +
        ' /Flags 4 /FontBBox [' + f.bbox.join(' ') + '] /ItalicAngle 0 /Ascent ' + f.ascent +
        ' /Descent ' + f.descent + ' /CapHeight 700 /StemV 80 /FontFile2 ' + ff + ' 0 R >>');
      var used = Object.keys(f.used).map(Number).sort(function (a, b) { return a - b; });
      var w = [], bf = [];
      for (var u = 0; u < used.length; u++) {
        var g = used[u];
        w.push(g + ' [' + f.adv1(g) + ']');
        var cps = f.used[g] || [];
        var hexU = '';
        for (var z = 0; z < cps.length; z++) hexU += hx(cps[z]);
        bf.push('<' + hx(g) + '> <' + (hexU || hx(0x20)) + '>');
      }
      var tou = '/CIDInit /ProcSet findresource begin 12 dict begin begincmap\n' +
        '/CMapName /GRDN def /CMapType 2 def\n' +
        '1 begincodespacerange <0000> <FFFF> endcodespacerange\n' +
        (bf.length ? (bf.length + ' beginbfchar\n' + bf.join('\n') + '\nendbfchar\n') : '') +
        'endcmap CMapName currentdict /CMap defineresource pop end end';
      var tu = doc.add('<< /Length ' + tou.length + ' >>\nstream\n' + tou + '\nendstream');
      var cid = doc.add('<< /Type /Font /Subtype /CIDFontType2 /BaseFont /GRDN+' + tag +
        ' /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>' +
        ' /FontDescriptor ' + fd + ' 0 R /DW 500 /W [' + w.join(' ') + ']' +
        ' /CIDToGIDMap /Identity >>');
      fontRefs['F_' + tag] = doc.add('<< /Type /Font /Subtype /Type0 /BaseFont /GRDN+' + tag +
        ' /Encoding /Identity-H /DescendantFonts [' + cid + ' 0 R] /ToUnicode ' + tu + ' 0 R >>');
    }

    var imgRefs = {};
    for (i = 0; i < imgs.jpegs.length; i++) {
      var e = imgs.jpegs[i];
      var buf = e.j.raw ? (e.j.z || e.j.data) : e.j.data;
      var filt = e.j.raw ? (e.j.z ? ' /Filter /FlateDecode' : '') : ' /Filter /DCTDecode';
      imgRefs[e.nm] = doc.add(concat([
        bytes('<< /Type /XObject /Subtype /Image /Width ' + e.j.w + ' /Height ' + e.j.h +
              ' /ColorSpace /DeviceRGB /BitsPerComponent 8' + filt + ' /Length ' +
              buf.length + ' >>\nstream\n'),
        buf, bytes('\nendstream')
      ]));
    }

    /*@3.NOPJ2.58*/
    for (i = 0; i < imgs.emos.length; i++) {
      var eo = imgs.emos[i], eb = eo.b;
      var alBuf = eo.alz || eb.al, rgBuf = eo.rgz || eb.rgb;
      var alF = eo.alz ? ' /Filter /FlateDecode' : '';
      var rgF = eo.rgz ? ' /Filter /FlateDecode' : '';
      var smId = doc.add(concat([
        bytes('<< /Type /XObject /Subtype /Image /Width ' + eb.w + ' /Height ' + eb.h +
              ' /ColorSpace /DeviceGray /BitsPerComponent 8' + alF +
              ' /Length ' + alBuf.length + ' >>\nstream\n'),
        alBuf, bytes('\nendstream')
      ]));
      imgRefs[eo.nm] = doc.add(concat([
        bytes('<< /Type /XObject /Subtype /Image /Width ' + eb.w + ' /Height ' + eb.h +
              ' /ColorSpace /DeviceRGB /BitsPerComponent 8' + rgF +
              ' /SMask ' + smId + ' 0 R /Length ' + rgBuf.length + ' >>\nstream\n'),
        rgBuf, bytes('\nendstream')
      ]));
    }

    var nAll = h.nAll || pages.length;
    var oiMap = h.oiMap || null;
    var destOf = {}, dk = Object.keys(h.dests);
    for (i = 0; i < dk.length; i++) {
      var dd = h.dests[dk[i]];
      var pi = Math.max(0, Math.min(nAll - 1, Math.floor(dd.y / ph)));
      destOf[dk[i]] = { p: pi, y: phPt - (dd.y - pi * ph) * PT };
    }

    var resFont = Object.keys(fontRefs).map(function (n) {
      return '/' + n + ' ' + fontRefs[n] + ' 0 R';
    }).join(' ');
    var resImg = Object.keys(imgRefs).map(function (n) {
      return '/' + n + ' ' + imgRefs[n] + ' 0 R';
    }).join(' ');
    var gsRefs = [];
    gsRefs.push('/GM ' + doc.add('<< /Type /ExtGState /BM /Multiply >>') + ' 0 R');
    gsRefs.push('/GN ' + doc.add('<< /Type /ExtGState /BM /Normal >>') + ' 0 R');
    var alphas = alphasIn(pages);
    for (i = 0; i < alphas.length; i++) {
      var av = parseInt(alphas[i], 10) / 100;
      gsRefs.push('/GA' + alphas[i] + ' ' +
        doc.add('<< /Type /ExtGState /ca ' + num(av) + ' /CA ' + num(av) + ' >>') + ' 0 R');
    }
    var res = '<< /Font << ' + resFont + ' >>' +
      (resImg ? (' /XObject << ' + resImg + ' >>') : '') +
      ' /ExtGState << ' + gsRefs.join(' ') + ' >> >>';

    return Promise.all(streams.map(function (str) {
      var raw = bytes(str);
      return deflate(raw).then(function (z) { return z ? { d: z, f: true } : { d: raw, f: false }; });
    })).then(function (packed) {
      for (var p = 0; p < pages.length; p++) {
        var cs = doc.add(concat([
          bytes('<< /Length ' + packed[p].d.length +
                (packed[p].f ? ' /Filter /FlateDecode' : '') + ' >>\nstream\n'),
          packed[p].d, bytes('\nendstream')
        ]));
        var an = [], pl = pages[p].links;
        for (var k = 0; k < pl.length; k++) {
          var lk = pl[k];
          var y0 = phPt - (lk.y - pages[p].top + lk.h) * PT;
          if (y0 < -40 || y0 > phPt + 40) continue;
          var rect = '[' + num(lk.x * PT) + ' ' + num(y0) + ' ' +
                     num((lk.x + lk.w) * PT) + ' ' + num(y0 + lk.h * PT) + ']';
          if (lk.kind === 'uri') {
            an.push(doc.add('<< /Type /Annot /Subtype /Link /Border [0 0 0] /Rect ' + rect +
              ' /A << /S /URI /URI ' + pdfStr(lk.uri) + ' >> >>'));
          } else {
            var t = destOf[lk.to];
            if (!t) continue;
            /*@3.NOPJ2.71*/
            var tp = oiMap ? oiMap[t.p] : t.p;
            if (tp == null) continue;
            an.push(doc.add('<< /Type /Annot /Subtype /Link /Border [0 0 0] /Rect ' + rect +
              ' /Dest [' + pageIds[tp] + ' 0 R /XYZ 0 ' + num(t.y) + ' null] >>'));
          }
        }
        /*@3.NOPJ2.44*/
        doc.set(pageIds[p], '<< /Type /Page /Parent ' + pagesId +
          ' 0 R /Contents ' + cs + ' 0 R' +
          (an.length ? (' /Annots [' + an.map(function (x) { return x + ' 0 R'; }).join(' ') + ']') : '') +
          ' >>');
      }
      doc.set(pagesId, '<< /Type /Pages /Count ' + pages.length +
        ' /MediaBox [0 0 ' + num(pw) + ' ' + num(phPt) + '] /Resources ' + res +
        ' /Kids [' +
        pageIds.map(function (x) { return x + ' 0 R'; }).join(' ') + '] >>');

      var outlineId = 0;
      var marks = h.marks.slice().sort(function (a, b) { return a.y - b.y; });
      /*@3.NOPJ2.72*/
      marks = marks.filter(function (mk) {
        var pi2 = Math.max(0, Math.min(nAll - 1, Math.floor(mk.y / ph)));
        return !oiMap || oiMap[pi2] != null;
      });
      if (marks.length) {
        outlineId = doc.reserve();
        var itemIds = marks.map(function () { return doc.reserve(); });
        for (var mi = 0; mi < marks.length; mi++) {
          var mk = marks[mi];
          var pAbs = Math.max(0, Math.min(nAll - 1, Math.floor(mk.y / ph)));
          var pIdx = oiMap ? oiMap[pAbs] : pAbs;
          var my = phPt - (mk.y - pAbs * ph) * PT;
          doc.set(itemIds[mi], '<< /Title ' + utf16be(mk.t) + ' /Parent ' + outlineId + ' 0 R' +
            (mi > 0 ? (' /Prev ' + itemIds[mi - 1] + ' 0 R') : '') +
            (mi < marks.length - 1 ? (' /Next ' + itemIds[mi + 1] + ' 0 R') : '') +
            ' /Dest [' + pageIds[pIdx] + ' 0 R /XYZ 0 ' + num(my) + ' null] >>');
        }
        doc.set(outlineId, '<< /Type /Outlines /First ' + itemIds[0] + ' 0 R /Last ' +
          itemIds[itemIds.length - 1] + ' 0 R /Count ' + marks.length + ' >>');
      }

      var info = doc.add('<< /Title ' + utf16be(String(meta.title || 'Note')) +
        ' /Producer ' + pdfStr('Byte Notes') + ' >>');
      var cat = doc.add('<< /Type /Catalog /Pages ' + pagesId + ' 0 R' +
        (outlineId ? (' /Outlines ' + outlineId + ' 0 R /PageMode /UseOutlines') : '') +
        ' /Lang ' + pdfStr(meta.dir === 'rtl' ? 'ar' : 'en') + ' >>');
      return doc.build(cat, info);
    });
  }

  function step(meta, tag, i, n) {
    if (!meta || typeof meta.onStep !== 'function') return;
    try { meta.onStep(tag, i, n); } catch (eS) {}
  }
  function build(meta, docModel) {
    var mounted = null, t0 = Date.now();
    MISSING = {}; IMGFAIL = 0; IMGSKIP = 0; FONTFAIL = {};
    COLC = {};
    return loadIndex().then(function () {
      return mount(meta);
    }).then(function (m) {
      mounted = m;
      /*@3.NOPJ2.123*/
      var nH = (Array.isArray(meta.cuts) && meta.cuts.length > 1) ? meta.cuts.length - 1 : (meta.pages | 0);
      step(meta, 'harvest', 0, nH);
      return harvestAsync(m.doc, meta, function (pg) { step(meta, 'harvest', Math.max(0, Math.min(nH, Math.floor(pg) + 1)), nH); });
    }).then(function (h) {
      var m = mounted;
      /*@3.NOPJ2.70*/
      var all = paginate(h, meta);
      var ph = h.ph || meta.pageH || 1123;
      return Promise.all(h.pend || []).then(function () { return inkLayers(m.doc, meta, docModel, h.org); }).then(function (inks) {
      /*@3.NOPJ2.81*/
      var farInk = 0, gq;
      for (gq = 0; gq < inks.length; gq++) {
        if ((inks[gq].y1 || 0) > farInk) farInk = inks[gq].y1;
      }
      var hasCuts = !!(Array.isArray(meta.cuts) && meta.cuts.length > 1);
      var wantN = hasCuts ? 0 : Math.min(MAX_PAGES, Math.ceil(farInk / ph - 0.02));
      while (all.length < wantN) {
        all.push({ top: all.length * ph, oi: all.length, runs: [], boxes: [], imgs: [],
                   inks: [], links: [], emo: [], vecs: [] });
      }
      if (!hasCuts) trimBlank(all, inks, meta);
      h.nAll = all.length;
      var pages = sliceRange(all, meta.range);
      h.oiMap = {};
      for (var oq = 0; oq < pages.length; oq++) h.oiMap[pages[oq].oi] = oq;
      for (var ii = 0; ii < inks.length; ii++) {
        var yTop = inks[ii].y0, yBot = inks[ii].y1, q;
        for (q = 0; q < h.nAll; q++) {
          var bandQ = all[q].bh || ph;
          if (yTop < all[q].top + bandQ && yBot > all[q].top) {
            var np = h.oiMap[q];
            if (np != null) pages[np].inks.push(inks[ii]);
          }
        }
      }

      var need = {}, runsAll = h.allRuns || h.runs;
      for (var i = 0; i < runsAll.length; i++) need[runsAll[i].face] = 1;
      need[FALLBACK.a] = 1; need[FALLBACK.b] = 1;
      var symIds = symNeed(runsAll);
      for (var sI = 0; sI < symIds.length; sI++) need[symIds[sI]] = 1;
      if (symfaIn(runsAll)) need[SYMFACE] = 1;
      var ids = Object.keys(need);
      if (!ids.length) ids = [FALLBACK.a];
      return Promise.all(ids.map(loadFace)).then(function (list) {
        var faceMap = {};
        for (var k = 0; k < ids.length; k++) { list[k].used = {}; faceMap[ids[k]] = list[k]; }
        var imgs = encodeImages(h);
        return zipEmos(imgs).then(function () {
        var phPt = ph * PT;
        var streams = [];
        /*@3.NOPJ2.113*/
        return (function streamPages(p0) {
          var p = p0, stop = Math.min(pages.length, p0 + 24);
          for (; p < stop; p++) streams.push(pageContent(pages[p], faceMap, imgs, pages[p].top, ph, phPt));
          if (p >= pages.length) return Promise.resolve();
          step(meta, 'pages', p, pages.length);
          return new Promise(function (k) { yieldNow(k); }).then(function () { return streamPages(p); });
        }(0)).then(function () {
          step(meta, 'write', pages.length, pages.length);
          return assemble(h, pages, meta, faceMap, streams, imgs);
        }).then(function (u8) {
          return { bytes: u8, pages: pages.length, ms: Date.now() - t0,
                   runs: h.runs.length, marks: h.marks.length, docH: Math.round(h.height),
                   missing: MISSING, imgFail: IMGFAIL + IMGSKIP,
                   fontFail: Object.keys(FONTFAIL).length,
                   dbg: (function () {
                     var mr = 0, mb = 0, q;
                     for (q = 0; q < h.runs.length; q++) if (h.runs[q].yBase > mr) mr = h.runs[q].yBase;
                     for (q = 0; q < h.boxes.length; q++) if (h.boxes[q].y + h.boxes[q].h > mb) mb = h.boxes[q].y + h.boxes[q].h;
                     var fset = {};
                     for (q = 0; q < h.runs.length; q++) fset[h.runs[q].face] = (fset[h.runs[q].face] || 0) + 1;
                     var fams = {};
                     for (q = 0; q < h.runs.length; q++) fams[h.runs[q].famDbg || '?'] = 1;
                     return { maxRun: Math.round(mr), maxBox: Math.round(mb), ph: h.ph, pw: h.pw,
                              pages: h.pages, idx: FIDX ? FIDX.length : -1, faces: fset,
                              fams: Object.keys(fams) };
                   }()) };
        });
        });
      });
      });
    })['finally'](function () {
      if (mounted && mounted.ifr && mounted.ifr.parentNode) mounted.ifr.remove();
    });
  }

  function saveBlob(url, meta) {
    var a = document.createElement('a');
    var name = String(meta.title || L('ملاحظة', 'Note'))
      .replace(/[\\/:*?"<>|]/g, '-').slice(0, 60).trim() || 'note';
    var rg = meta.range ? ('-p' + meta.range.from + '-' + meta.range.to) : '';
    a.href = url; a.download = name + rg + '.pdf';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 4000);
  }
  function save(meta, docModel) {
    return build(meta, docModel).then(function (r) {
      var blob = new Blob([r.bytes], { type: 'application/pdf' });
      saveBlob(URL.createObjectURL(blob), meta);
      return { size: r.bytes.length, pages: r.pages, ms: r.ms, missing: r.missing, imgFail: r.imgFail };
    });
  }
  /*@3.NOPJ2.105*/
  function printFrame(f) {
    var w = f.contentWindow;
    try { w.focus(); } catch (e0) {}
    w.print();
  }
  function canFrame() {
    if (!navigator.pdfViewerEnabled) return false;
    var ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return false;
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return false;
    return true;
  }
  function print(meta, docModel) {
    return build(meta, docModel).then(function (r) {
      var blob = new Blob([r.bytes], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      var out = { size: r.bytes.length, pages: r.pages, ms: r.ms, missing: r.missing, imgFail: r.imgFail, via: 'file' };
      if (!canFrame()) { saveBlob(url, meta); return out; }
      return new Promise(function (res) {
        var old = document.getElementById('na-print-frame');
        if (old) old.remove();
        var f = document.createElement('iframe');
        f.id = 'na-print-frame';
        f.setAttribute('aria-hidden', 'true');
        f.setAttribute('tabindex', '-1');
        f.setAttribute('title', L('طباعة', 'Print'));
        f.style.cssText = 'position:fixed;inset-block-end:0;inset-inline-end:0;inline-size:2px;block-size:2px;' +
          'opacity:0;border:0;pointer-events:none';
        var done = false, t = setTimeout(function () { fin(false); }, 20000);
        function fin(ok) {
          if (done) return;
          done = true; clearTimeout(t);
          if (!ok) {
            try { f.remove(); } catch (e1) {}
            saveBlob(url, meta);
            res(out);
            return;
          }
          out.via = 'frame';
          setTimeout(function () { try { f.remove(); URL.revokeObjectURL(url); } catch (e2) {} }, 600000);
          res(out);
        }
        f.addEventListener('load', function () {
          setTimeout(function () {
            try { window.GardenNotesPdf.printFrame(f); fin(true); } catch (e3) { fin(false); }
          }, 200);
        });
        f.addEventListener('error', function () { fin(false); });
        f.src = url;
        document.body.appendChild(f);
      });
    });
  }

  /*@3.NOPJ2.16*/
  function visual(text, dir) {
    var cl = orderClusters(shape(text), dir === 'rtl'), i;
    var out = [];
    for (i = 0; i < cl.length; i++) {
      for (var k = 0; k < cl[i].length; k++) out.push(cl[i][k].g);
    }
    return out;
  }

  window.GardenNotesPdf = { build: build, save: save, print: print, printFrame: printFrame, shape: shape, loadFace: loadFace,
                            visual: visual, ops: textOps, classOf: classOf,
                            faceIdFor: faceIdFor, loadIndex: loadIndex,
                            _diag: { mount: mount, harvest: harvest, geom: geomOf, paginate: paginate, inkLayers: inkLayers, pseudoSelectors: pseudoSelectors, harvestPseudo: harvestPseudo, harvestBoxes: harvestBoxes, harvestText: harvestText, svgVec: svgVec } };
})();
