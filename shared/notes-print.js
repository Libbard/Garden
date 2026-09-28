;(function () {
  'use strict';

  function isAr() {
    try { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
    catch (e) { return true; }
  }
  function L(a, e) { return isAr() ? a : e; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function B() { return window.GardenNotesBlocks; }

  /*@3.NOPJ.2*/
  function S() { return window.GardenNotesSerialize; }

  function styleOf(b) {
    var st = [];
    if (b.dir === 'rtl' || b.dir === 'ltr') st.push('direction:' + b.dir);
    if (b.al) st.push('text-align:' + b.al);
    /*@3.NOPJ.13*/
    if (b.ff) {
      var fc = (B().fontCss && B().fontCss(b.ff)) || b.ff;
      st.push('font-family:&quot;' + String(fc).replace(/["'<>;&]/g, '') + '&quot;,sans-serif');
    }
    return st.length ? ' style="' + st.join(';') + '"' : '';
  }

  function runs(rt) {
    var B2 = B();
    if (!B2) return '';
    if (B2.runsToHtmlBidi) return B2.runsToHtmlBidi(rt);
    return esc(B2.runsToText(rt));
  }

  function cells(row) {
    return row.map(function (c) { return '<td>' + runs(c.rt) + '</td>'; }).join('');
  }

  function inkSvg(b) {
    return S() ? S().inkSvg(b) : Promise.resolve('');
  }

  /*@3.NOPJ.3*/
  function mathHtml(tex) {
    if (!tex) return Promise.resolve('');
    var host = document.createElement('div');
    host.style.cssText = 'position:absolute;inset-block-start:-9999px;inset-inline-start:-9999px';
    host.textContent = '\\[' + tex + '\\]';
    document.body.appendChild(host);
    if (window.GardenMath && GardenMath.typeset) {
      try { GardenMath.typeset(host); } catch (e) {}
    }
    return waitMath(host, 40).then(function () {
      var out = host.innerHTML;
      host.remove();
      return out;
    });
  }
  function waitMath(host, left) {
    if (host.querySelector('mjx-container')) return Promise.resolve();
    if (left <= 0) return Promise.resolve();
    return new Promise(function (res) { setTimeout(res, 60); })
      .then(function () { return waitMath(host, left - 1); });
  }

  /*@3.NOPJ.23*/
  function localData(ref) {
    var S = window.GardenNotesStore;
    if (!S || !S.getImage) return Promise.resolve('');
    return S.getImage(String(ref).slice(11)).then(function (row) {
      if (!row || !row.blob) return '';
      return new Promise(function (res) {
        var fr = new FileReader();
        fr.onload = function () { res(String(fr.result || '')); };
        fr.onerror = function () { res(''); };
        fr.readAsDataURL(row.blob);
      });
    }).catch(function () { return ''; });
  }

  /*@3.NOPJ.24*/
  function imgJob(b) {
    var Bx = B();
    if (!Bx || !Bx.localImg || !Bx.localImg(b.url)) return null;
    return localData(b.url).then(function (u) {
      if (!u) return '';
      var copy = {}, k;
      for (k in b) if (Object.prototype.hasOwnProperty.call(b, k)) copy[k] = b[k];
      copy.url = u;
      copy.__raw = 1;
      return imgHtml(copy);
    });
  }

  /*@3.NOPJ.27*/
  var STK_HEX = { amber: '#f59e0b', lime: '#84cc16', sky: '#38bdf8',
                  pink: '#ec4899', violet: '#a78bfa', slate: '#94a3b8' };
  function stkHtml(b, s) {
    var hex = STK_HEX[b.tone] || STK_HEX.amber;
    var rot = Math.max(-12, Math.min(12, Number(b.rot) || 0));
    return '<div class="stk" style="--stk:' + hex + ';transform:rotate(' + rot + 'deg)"' +
      (s || '') + '>' + runs(b.rt) + '</div>';
  }

  function imgHtml(b) {
    var u = b.__raw ? String(b.url) : (B() ? B().httpsOnly(b.url) : '');
    if (!u) return '';
    var f = ['width:' + (b.iw == null ? 100 : b.iw) + '%'];
    var br = b.br == null ? 100 : b.br;
    if (br !== 100) f.push('filter:brightness(' + (br / 100) + ')');
    var op = b.op == null ? 100 : b.op;
    if (op !== 100) f.push('opacity:' + (op / 100));
    return '<figure class="fg" style="' + f.join(';') + '">' +
      '<img src="' + esc(u) + '" alt="' + esc(b.alt || '') + '" referrerpolicy="no-referrer">' +
      ((b.cap && b.alt) ? '<figcaption>' + esc(b.alt) + '</figcaption>' : '') +
      '</figure>';
  }


  /*@3.NOPJ.18*/
  var CAL_UI = {
    note:      { t: 'var(--pr-lk)', ar: 'ملاحظة', en: 'Note' },
    tip:       { t: 'var(--pr-ok)', ar: 'فائدة',  en: 'Tip' },
    important: { t: 'var(--pr-fg1)', ar: 'مهمّ',    en: 'Important' },
    warning:   { t: 'var(--pr-wn)', ar: 'تحذير',  en: 'Warning' },
    caution:   { t: 'var(--pr-dg)', ar: 'تنبيه',  en: 'Caution' }
  };

  function calHtml(b, s) {
    var k = String(b.cal || 'note').toLowerCase();
    var c = CAL_UI[k] || CAL_UI.note;
    var rt = (b.rt || []).slice();
    if (rt.length && rt[0] && rt[0].cl) rt = rt.slice(1);
    var isar = true;
    try { isar = (localStorage.getItem('garden_lang') || 'ar') === 'ar'; } catch (e) {}
    return '<div class="cal cal-' + k + '"' + s + '>' +
      '<div class="cal-h">' + esc(b.ct || (isar ? c.ar : c.en)) + '</div>' +
      '<div class="cal-b">' + runs(rt) + '</div></div>';
  }

  /*@3.NOPJ.19*/
  function codeHtml(b) {
    var CC = window.GardenNotesCode;
    var mmd = (CC && CC.isMermaid) ? CC.isMermaid(b.lang)
                                   : /^(mermaid|mmd)$/i.test(String(b.lang || '').trim());
    if (mmd) {
      var M = window.GardenNotesMermaid;
      var live = b.id
        ? document.querySelector('[data-bid="' + String(b.id).replace(/"/g, '') + '"] svg[data-nmd]')
        : null;
      var baked = (live && M && typeof M.bake === 'function') ? M.bake(live) : null;
      if (baked) return '<div class="dgm">' + baked.svg + '</div>';
    }
    return '<pre class="cd" dir="ltr">' + esc(b.src || '') + '</pre>';
  }

  function blockHtml(b) {
    var s = styleOf(b);
    var lv = b.lv || 2;
    switch (b.ty) {
      case 'h':       return '<h' + lv + s + '>' + (b.pg > 0 && window.GardenNotesBlocks ? '<span class="pg">' + esc(window.GardenNotesBlocks.pgLead(b)) + '</span>' : '') + runs(b.rt) + '</h' + lv + '>';
      case 'p':       return '<p' + s + '>' + runs(b.rt) + '</p>';
      case 'quote':   return '<blockquote' + s + '>' + runs(b.rt) + '</blockquote>';
      case 'callout': return calHtml(b, s);
      case 'sticky':  return stkHtml(b, s);
      case 'todo':    return '<p class="td"' + s + '><span class="bx">' +
                        (b.done ? '&#10003;' : '&#160;') + '</span>' + runs(b.rt) + '</p>';
      case 'ul':
      case 'ol':      return '<div' + s + '>' + B().listHtml(b, runs) + '</div>';
      case 'code':    return codeHtml(b);
      case 'tbl':     return tblHtml(b, s);
      case 'img':     return imgHtml(b);
      case 'gap':     return '<div style="height:' + Math.round((b.h || 40) * 0.75) + 'pt"></div>';
      case 'hr':      return '<hr>';
      case 'pb':      return '<div style="break-before:page"></div>';
      default:        return '';
    }
  }

  function tblHtml(b, s) {
    var st = b.st || 'head';
    var rows = (b.rows || []).map(function (r, i) {
      if (i === 0 && st === 'head') {
        return '<tr>' + r.map(function (c) { return '<th>' + runs(c.rt) + '</th>'; }).join('') + '</tr>';
      }
      return '<tr>' + cells(r) + '</tr>';
    }).join('');
    return '<table class="tb" data-tst="' + esc(st) + '"' + s + '>' + rows + '</table>';
  }

  function blockJob(b) {
    /*@3.NOPJ.25*/
    if (b.ty === 'img') { var ij = imgJob(b); if (ij) return ij; }
    if (b.ty === 'ink') {
      return inkSvg(b).then(function (sv) {
        return sv ? '<div class="ink">' + sv + '</div>' : '';
      });
    }
    if (b.ty === 'math') {
      return mathHtml(b.tex).then(function (h) {
        if (h) return '<div class="mth" dir="ltr">' + h + '</div>';
        return b.tex ? '<pre class="cd" dir="ltr">' + esc(b.tex) + '</pre>' : '';
      });
    }
    return Promise.resolve(blockHtml(b));
  }

  function buildBody(doc) {
    var blocks = (doc && doc.blocks) || [];
    var jobs = blocks.map(function (b) {
      /*@3.NOPJ.26*/
      if (b.ty === 'img') { var ij2 = imgJob(b); if (ij2) return ij2; }
      if (b.ty === 'ink') {
        return inkSvg(b).then(function (svg) {
          return svg ? '<div class="ink">' + svg + '</div>' : '';
        });
      }
      if (b.ty === 'math') {
        return mathHtml(b.tex).then(function (h) {
          if (h) return '<div class="mth" dir="ltr">' + h + '</div>';
          return b.tex ? '<pre class="cd" dir="ltr">' + esc(b.tex) + '</pre>' : '';
        });
      }
      return Promise.resolve(blockHtml(b));
    });

    var ov = doc && doc.ov;
    if (ov && (ov.ink || (ov.shapes && ov.shapes.length))) {
      jobs.push(inkSvg({ ink: ov.ink, shapes: ov.shapes, w: ov.w, h: ov.h }).then(function (svg) {
        if (!svg) return '';
        return '<div class="ink ovl"><div class="ovl-t">' +
          esc(L('طبقة الرسم فوق الملاحظة', 'Drawing layer over the note')) + '</div>' + svg + '</div>';
      }));
    }

    return Promise.all(jobs).then(function (parts) {
      return parts.filter(function (x) { return x; }).join('\n');
    });
  }

  /*@3.NOPJ.7*/
  var PX_MM = 96 / 25.4;

  function mirrorGeom(m) {
    var land = !!m.land;
    var pw = m.pageW || (land ? 1123 : 794);
    var ph = m.pageH || (land ? 794 : 1123);
    /*@3.NOPJ.40*/
    var pages = Math.max(1, Math.min(4000, m.pages || 1));
    var crop = null;
    if (m.crop && m.crop.h > 0) {
      crop = { y0: Math.max(0, m.crop.y0 || 0) };
      pages = Math.max(1, Math.min(4000, Math.ceil(m.crop.h / ph)));
    }
    /*@3.NOPJ.28*/
    var cuts = (Array.isArray(m.cuts) && m.cuts.length > 1 && !crop) ? m.cuts : null;
    if (cuts) pages = Math.max(1, Math.min(4000, cuts.length - 1));
    var p0 = 0, pn = pages;
    if (m.range) {
      var ra = Math.max(1, Math.min(pages, m.range.from | 0));
      var rb = Math.max(ra, Math.min(pages, m.range.to | 0));
      p0 = ra - 1; pn = rb - ra + 1;
    }
    return { land: land, pw: pw, ph: ph, pages: pages, p0: p0, pn: pn, crop: crop, cuts: cuts };
  }

  /*@3.NOPJ.8*/
  /*@3.NOPJ.37*/
  function bgTile() {
    var page = document.querySelector('.na-page'), sheet = document.querySelector('.na-sheet');
    if (!page || !sheet) return '';
    var kind = page.getAttribute('data-bgp') || 'none';
    if (kind !== 'dot' && kind !== 'grid' && kind !== 'line') return '.pgi .na-sheet{background-image:none !important}';
    var cs, pcs;
    try { cs = getComputedStyle(sheet); pcs = getComputedStyle(page); } catch (e) { return ''; }
    var gap = parseFloat(cs.getPropertyValue('--na-bgg')) || parseFloat(pcs.getPropertyValue('--na-bgg'));
    var g = Math.max(4, Math.round(gap > 0 ? gap : 20));
    var m = String(cs.backgroundImage || '').match(/(?:oklab|oklch|rgba?|hsla?|color|lab|lch)\([^)]*\)/);
    var col = m ? m[0] : 'rgba(0,0,0,.18)';
    var th = (kind === 'line') ? g + 6 : g, K = 3, url = '';
    try {
      var cv = document.createElement('canvas');
      cv.width = g * K; cv.height = th * K;
      var x = cv.getContext('2d');
      x.fillStyle = col;
      x.strokeStyle = col;
      if (kind === 'dot') { x.beginPath(); x.arc(K, K, K, 0, Math.PI * 2); x.fill(); }
      else if (kind === 'grid') { x.fillRect(0, 0, g * K, K); x.fillRect(0, 0, K, th * K); }
      else x.fillRect(0, (th - 1) * K, g * K, K);
      url = cv.toDataURL('image/png');
    } catch (e2) { url = ''; }
    if (!url) return '.pgi .na-sheet{background-image:none !important}';
    return '.pgi .na-sheet{background-image:url("' + url + '") !important;' +
      'background-size:' + g + 'px ' + th + 'px !important;background-repeat:repeat !important}';
  }

  function mirrorCss(g) {
    /*@3.NOPJ.10*/
    return '@page{size:' + g.pw + 'px ' + g.ph + 'px;margin:0}' +
      'html,body{margin:0;padding:0;background:var(--pr-card);-webkit-print-color-adjust:exact;' +
        'print-color-adjust:exact}' +
      '.pgw{position:relative;overflow:hidden;margin:0 auto;' +
        'inline-size:' + g.pw + 'px;' +
        'block-size:' + g.ph + 'px;' +
        'break-after:page;page-break-after:always}' +
      '.pgw:last-of-type{break-after:auto;page-break-after:auto}' +
      '.pgi{position:absolute;inset-inline-start:0;' +
        'inline-size:' + g.pw + 'px}' +
      '.pgi .na,.pgi .na-zoom,.pgi .na-page{display:block;block-size:auto;min-block-size:0;' +
        'inline-size:' + g.pw + 'px;max-inline-size:none;overflow:visible;zoom:1}' +
      '.pgi > .na{background:transparent}' +
      '.pgi .na-page{margin:0}' +
      /*@3.NOPJ.38*/
      '.pgi .na-sheet{border-color:transparent !important;border-radius:0 !important;box-shadow:none !important}' +
      '.pgi .na-sheet::before{display:none !important}' +
      '.pgi .ne-b,.pgi .ne-b *{box-shadow:none !important}' +
      /*@3.NOPJ.45*/
      '.pgi .ne-root[data-card-skin] > .ne-b > .ne-body{background-image:none !important}' +
      /*@3.NOPJ.43*/
      '.pgi .ne-root>.ne-b[data-card][data-pgcut]{border-block-end:1px solid var(--ne-card-line);' +
        'border-end-start-radius:14px;border-end-end-radius:14px}' +
      bgTile() +
      '.pgi .ne-rail,.pgi .ne-wgrip,.pgi .ne-rgrip,.pgi .ne-selhint,.pgi .na-pgbar,' +
        '.pgi .ne-code-bar,.pgi .ne-menu,.pgi .ne-img-ed,.pgi .ne-img-edit,.pgi .ne-tex,.pgi .ne-tbl-bar,' +
        '.pgi .ne-cap-ed,.pgi .nc-selbar{visibility:hidden !important}' +
      '.pgi .ne-img-edit{display:none !important}' +
      'mjx-assistive-mml{display:none !important}' +
      '.pgi [data-ph]:empty::before{content:"" !important;opacity:0 !important}' +
      '.pgi *{caret-color:transparent}' +
      '.mink{position:absolute;pointer-events:none;z-index:9}' +
      '.mink svg{display:block;inline-size:100%;block-size:100%}' +
      '.ldg{padding:24pt;text-align:center;color:var(--pr-fg3);font-size:10pt;font-family:sans-serif}';
  }

  /*@3.NOPJ.6*/
  /*@3.NOPJ.11*/
  /*@3.NOPJ.30*/
  function inkEls(ov) {
    var C = window.GardenInkCodec;
    var shapes = (ov.shapes || []).slice();
    if (Array.isArray(ov.els)) return Promise.resolve(shapes.concat(ov.els));
    if (!ov.ink || !C || !C.unpack) return Promise.resolve(shapes);
    return C.unpack(ov.ink).then(function (strokes) {
      return shapes.concat((strokes || []).map(function (st) {
        return { ty: 'st', c: st.color || 'ink', w: st.w || 2.4, nib: st.nib || 'round',
                 o: st.tool === 'hi' ? 0.32 : 1, pts: st.pts };
      }));
    })['catch'](function () { return shapes; });
  }
  function elRange(el) {
    var lo = Infinity, hi = -Infinity, i, y;
    if (el.ty === 'st') {
      for (i = 0; i < (el.pts || []).length; i++) { y = el.pts[i].y; if (y < lo) lo = y; if (y > hi) hi = y; }
    } else { lo = Math.min(el.y1, el.y2); hi = Math.max(el.y1, el.y2); }
    var mg = (el.w || 2) * 2 + 4;
    return [lo - mg, hi + mg];
  }

  function pageCtx(inner, spans, noInk) {
    var tpl = document.createElement('template');
    tpl.innerHTML = inner;
    var root = tpl.content.querySelector('.ne-root');
    if (!root || !spans || !spans.map) return null;
    /*@3.NOPJ.33*/
    if (noInk) { var mk0 = tpl.content.querySelector('.mink'); if (mk0 && mk0.parentNode) mk0.parentNode.removeChild(mk0); }
    var rTop = spans.rootTop || 0;
    var kids = Array.prototype.slice.call(root.children), i, k, key, sp, list = [];
    for (i = 0; i < kids.length; i++) {
      k = kids[i];
      /*@3.NOPJ.29*/
      key = (k.getAttribute && (k.getAttribute('data-span') || k.getAttribute('data-bid'))) || '';
      sp = key ? spans.map[key] : null;
      root.removeChild(k);
      if (!sp) continue;
      k.style.position = 'absolute';
      k.style.insetBlockStart = sp.t.toFixed(2) + 'px';
      k.style.insetInlineStart = sp.s.toFixed(2) + 'px';
      /*@3.NOPJ.39*/
      if (!sp.free) k.style.inlineSize = sp.w.toFixed(2) + 'px';
      k.style.margin = '0';
      /*@3.NOPJ.32*/
      if (k.getAttribute('data-ty') === 'img') { k.style.maxBlockSize = sp.h.toFixed(2) + 'px'; k.style.overflow = 'hidden'; }
      var va = (typeof sp.va === 'number') ? sp.va : 0, vb = (typeof sp.vb === 'number') ? sp.vb : sp.h;
      list.push({ n: k, a: rTop + sp.t + va, b: rTop + sp.t + vb });
    }
    list.sort(function (x, y) { return x.a - y.a; });
    root.style.position = 'relative';
    root.style.display = 'block';
    root.style.padding = '0';
    root.style.blockSize = Math.ceil(spans.rootH) + 'px';
    var mink = tpl.content.querySelector('.mink');
    if (mink) mink.innerHTML = '';
    return { tpl: tpl, list: list };
  }

  function pageSlice(ctx, spans, ph, yA, yB, ink) {
    var over = ph * 0.25;
    var sy0 = yA - over, sy1 = yB + over;
    var frag = ctx.tpl.content.cloneNode(true);
    var root = frag.querySelector('.ne-root');
    var i, it, nd, heads = [];
    for (i = 0; i < ctx.list.length; i++) {
      it = ctx.list[i];
      if (it.a > sy1) break;
      if (it.b < sy0) continue;
      nd = it.n.cloneNode(true);
      /*@3.NOPJ.46*/
      if (/#h\d+$/.test(nd.getAttribute('data-span') || '')) heads.push(nd);
      else root.appendChild(nd);
    }
    for (i = 0; i < heads.length; i++) {
      root.appendChild(root.ownerDocument.createElement('i')).hidden = true;
      root.appendChild(heads[i]);
    }
    if (heads.length) root.appendChild(root.ownerDocument.createElement('i')).hidden = true;
    /*@3.NOPJ.12*/
    var mink = frag.querySelector('.mink');
    if (mink) {
      var mTop = (spans.sheetTop || 0) + spans.inkTop;
      var a0 = Math.max(sy0, mTop), b0 = Math.min(sy1, mTop + spans.inkH);
      var sv = '';
      if (b0 > a0 + 1 && ink) {
        var la = a0 - mTop, lb = b0 - mTop, sub = [], q, rg;
        for (q = 0; q < ink.els.length; q++) {
          rg = ink.rng[q];
          if (rg[1] < la || rg[0] > lb) continue;
          sub.push(ink.els[q]);
        }
        if (sub.length) sv = ink.K.toSvg(sub, ink.w, ink.h, { hex: S() && S().lightHex });
        if (sv) {
          mink.style.insetBlockStart = (spans.inkTop + la).toFixed(1) + 'px';
          mink.style.blockSize = (lb - la).toFixed(1) + 'px';
          mink.innerHTML = sv;
          var svg = mink.querySelector('svg');
          if (svg) {
            svg.setAttribute('viewBox', '0 ' + la.toFixed(1) + ' ' + ink.w + ' ' + (lb - la).toFixed(1));
            svg.setAttribute('preserveAspectRatio', 'none');
          }
        }
      }
      if (!sv && mink.parentNode) mink.parentNode.removeChild(mink);
    }
    var host = document.createElement('div');
    host.appendChild(frag);
    return host.innerHTML;
  }

  /*@3.NOPJ.44*/
  function markCuts(list, cuts) {
    function pg(y) { var k = 0; while (k < cuts.length - 2 && y >= cuts[k + 1] - 0.5) k++; return k; }
    for (var i = 0; i < list.length - 1; i++) {
      var n = list[i].n, nx = list[i + 1].n;
      if (!n.hasAttribute('data-card') || n.hasAttribute('data-card-end')) continue;
      if (!nx.hasAttribute('data-card')) continue;
      if (nx.hasAttribute('data-card-start') && !/#h\d+$/.test(nx.getAttribute('data-span') || '')) continue;
      if (pg(list[i + 1].a) > pg(list[i].a)) n.setAttribute('data-pgcut', '1');
    }
  }

  function mirrorPages(doc, m) {
    var g = mirrorGeom(m);
    var ov = doc && doc.ov;
    var box = m.inkBox;
    var K = window.GardenCanvas;
    var spans = m.spans && m.spans.map ? m.spans : null;
    var wantInk = !m.noInk && !!(ov && box && K && K.toSvg && (ov.ink || ov.els || (ov.shapes && ov.shapes.length)));
    var job = wantInk ? inkEls(ov) : Promise.resolve(null);
    return job.then(function (els) {
      var inner = String(m.html || '');
      var ctx = spans ? pageCtx(inner, spans, !!m.noInk) : null;
      if (ctx && g.cuts) markCuts(ctx.list, g.cuts);
      var ink = null;
      if (els && els.length && ctx) {
        ink = { K: K, els: els, rng: els.map(elRange), w: box.w, h: box.h };
      }
      var whole = null;
      if (!ctx) {
        /*@3.NOPJ.31*/
        var full = (els && els.length) ? K.toSvg(els, box.w, box.h, { hex: S() && S().lightHex }) : '';
        whole = inner.replace('<!--INKSLOT-->', full);
      }
      var baseY = g.crop ? g.crop.y0 : 0;
      /*@3.NOPJ.41*/
      var yEnd = g.cuts ? g.cuts[g.cuts.length - 1] : (baseY + g.pages * g.ph);
      var yBeg = g.cuts ? g.cuts[0] : baseY;
      var bodyF = ctx ? pageSlice(ctx, spans, g.ph, yBeg - g.ph, yEnd + g.ph, ink) : whole;
      return '<section class="pgw" data-flat="1" style="block-size:' + Math.max(1, Math.round(yEnd)) + 'px"><div class="pgi" style="inset-block-start:0">' + bodyF + '</div></section>';
    });
  }

  /*@3.NOPJ.35*/
  /*@3.NOPJ.42*/
  window.GardenNotesPrint = {
    buildBody: buildBody,
    pagesHtml: mirrorPages,
    mirrorCss: function (m) { return mirrorCss(mirrorGeom(m)); }
  };
})();
