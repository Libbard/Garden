;(function () {
  'use strict';

  var _fontHref = (function () {
    var sc = document.currentScript;
    return sc && sc.src
      ? sc.src.replace(/notes-print\.js(\?.*)?$/, 'vendor/fonts/garden/garden-core.css')
      : '';
  })();

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

  function mjxStyles() {
    var st = document.getElementById('MJX-CHTML-styles');
    return st ? '<style>' + st.textContent + '</style>' : '';
  }

  function imgHtml(b) {
    var u = B() ? B().httpsOnly(b.url) : '';
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

  function blockHtml(b) {
    var s = styleOf(b);
    var lv = b.lv || 2;
    switch (b.ty) {
      case 'h':       return '<h' + lv + s + '>' + runs(b.rt) + '</h' + lv + '>';
      case 'p':       return '<p' + s + '>' + runs(b.rt) + '</p>';
      case 'quote':   return '<blockquote' + s + '>' + runs(b.rt) + '</blockquote>';
      case 'callout': return '<div class="cal"' + s + '>' + runs(b.rt) + '</div>';
      case 'todo':    return '<p class="td"' + s + '><span class="bx">' +
                        (b.done ? '&#10003;' : '&#160;') + '</span>' + runs(b.rt) + '</p>';
      case 'ul':
      case 'ol':      return '<div' + s + '>' + B().listHtml(b, runs) + '</div>';
      case 'code':    return '<pre class="cd" dir="ltr">' + esc(b.src || '') + '</pre>';
      case 'tbl':     return tblHtml(b, s);
      case 'img':     return imgHtml(b);
      case 'gap':     return '<div style="height:' + Math.round((b.h || 40) * 0.75) + 'pt"></div>';
      case 'hr':      return '<hr>';
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

  var MARGIN_MM = 10;

  function buildBody(doc) {
    var blocks = (doc && doc.blocks) || [];
    var jobs = blocks.map(function (b) {
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

  /*@3.NOPJ.5*/
  function css(land, g) {
    var isA = isAr();
    return '@page{size:A4 ' + (land ? 'landscape' : 'portrait') + ';margin:' + MARGIN_MM + 'mm}' +
      (g ? ('.pgw{break-after:page;page-break-after:always}' +
            '.pgw:last-of-type{break-after:auto;page-break-after:auto}' +
            '.pg{position:relative;overflow:hidden;margin:0 auto;' +
              'width:' + Math.floor(g.sheetW * g.k) + 'px;' +
              'height:' + Math.floor(g.pageH * g.k) + 'px}' +
            '.slice{position:absolute;top:0;left:0;' +
              'transform-origin:0 0;width:' + g.sheetW + 'px}' +
            '.sh{position:relative;width:' + g.sheetW + 'px;' +
              'height:' + (g.pageH * g.pages) + 'px}' +
            '.b{position:absolute}' +
            '.b>*{margin:0}' +
            '.b>*+*{margin-block-start:5pt}' +
            '.ovl{position:absolute;top:0;left:0;' +
              'transform-origin:0 0;pointer-events:none}' +
            '.ft{display:flex;justify-content:space-between;gap:8pt;' +
              'font-size:7.5pt;line-height:1.4;color:#9ca3af;padding-block-start:3pt;' +
              'margin:0 auto;width:' + Math.floor(g.sheetW * g.k) + 'px}' +
            '.ft span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}') : '') +
      '*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'body{font-family:' + (isA ? "'Tajawal','Cairo',sans-serif" : "'Plus Jakarta Sans',sans-serif") + ';' +
        'direction:' + (isA ? 'rtl' : 'ltr') + ';color:#1f2937;background:#fff;' +
        'font-size:11pt;line-height:1.85;-webkit-font-smoothing:antialiased}' +
      (g && g.fs ? ('.sh{font-size:' + g.fs + 'px;line-height:' + g.lh + 'px}') : '') +
      '.hd{border-bottom:1pt solid #e5e7eb;padding-bottom:7pt;margin-bottom:12pt}' +
      '.hd h1{font-size:19pt;font-weight:800;color:#111827;line-height:1.35}' +
      '.hd .sub{font-size:8.5pt;color:#9ca3af;margin-top:2pt}' +
      'h1,h2,h3{margin:12pt 0 5pt;line-height:1.4;break-after:avoid}' +
      'h1{font-size:16pt}h2{font-size:13.5pt}h3{font-size:11.5pt}' +
      'p{margin:0 0 6pt}ul,ol{margin:0 0 6pt;padding-inline-start:16pt}li{margin-bottom:2pt}' +
      'blockquote{margin:0 0 7pt;padding-inline-start:9pt;border-inline-start:2pt solid #d1d5db;color:#4b5563}' +
      '.cal{margin:0 0 7pt;padding:6pt 8pt;background:#f9fafb;border:.5pt solid #e5e7eb;border-radius:4pt}' +
      '.td .bx{display:inline-block;width:8pt;height:8pt;border:.8pt solid #9ca3af;' +
        'border-radius:2pt;margin-inline-end:5pt;text-align:center;line-height:8pt;font-size:7pt}' +
      '.cd{font-family:ui-monospace,Consolas,monospace;font-size:9pt;line-height:1.6;' +
        'background:#f6f7f9;border:.5pt solid #e5e7eb;border-radius:4pt;padding:6pt 8pt;' +
        'margin:0 0 7pt;white-space:pre-wrap;word-break:break-word;break-inside:avoid}' +
      '.tb{width:100%;border-collapse:collapse;margin:0 0 8pt;font-size:10pt;break-inside:avoid}' +
      '.tb td,.tb th{border:.5pt solid #d1d5db;padding:4pt 6pt;text-align:start}' +
      '.tb th{background:#f3f4f6;font-weight:700}' +
      '.tb[data-tst="lines"] td,.tb[data-tst="lines"] th{border-inline:0}' +
      '.tb[data-tst="plain"] td,.tb[data-tst="plain"] th{border:0}' +
      '.fg{margin:0 auto 8pt;break-inside:avoid}' +
      '.fg img{max-width:100%;display:block;border-radius:4pt}' +
      '.fg figcaption{font-size:8.5pt;color:#6b7280;text-align:center;margin-top:3pt}' +
      '.ink{margin:0 0 8pt;break-inside:avoid}' +
      '.ink svg{max-width:100%;height:auto;display:block}' +
      '.ovl{border-top:.5pt dashed #e5e7eb;padding-top:6pt;margin-top:10pt}' +
      '.ovl-t{font-size:8pt;color:#9ca3af;margin-bottom:4pt}' +
      '.mth{margin:0 0 8pt;text-align:center;break-inside:avoid}' +
      'mark{background:#fef3c7;color:inherit}' +
      'code{font-family:ui-monospace,Consolas,monospace;font-size:.92em;' +
        'background:#f3f4f6;border-radius:3pt;padding:.5pt 2.5pt;unicode-bidi:isolate;direction:ltr}' +
      'a{color:#4338ca;text-decoration:none}hr{border:0;border-top:.5pt solid #e5e7eb;margin:9pt 0}' +
      '.ldg{padding:24pt;text-align:center;color:#9ca3af;font-size:10pt}';
  }


  /*@3.NOPJ.7*/
  var PX_MM = 96 / 25.4;

  function mirrorGeom(m) {
    var land = !!m.land;
    var pw = m.pageW || (land ? 1123 : 794);
    var ph = m.pageH || (land ? 794 : 1123);
    var pages = Math.max(1, Math.min(200, m.pages || 1));
    var crop = null;
    if (m.crop && m.crop.h > 0) {
      crop = { y0: Math.max(0, m.crop.y0 || 0) };
      pages = Math.max(1, Math.min(200, Math.ceil(m.crop.h / ph)));
    }
    return { land: land, pw: pw, ph: ph, pages: pages, crop: crop };
  }

  /*@3.NOPJ.8*/
  function mirrorCss(g) {
    /*@3.NOPJ.10*/
    return '@page{size:' + g.pw + 'px ' + g.ph + 'px;margin:0}' +
      'html,body{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;' +
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
      '.pgi .na-sheet{border-color:transparent;border-radius:0;box-shadow:none}' +
      '.pgi .ne-rail,.pgi .ne-wgrip,.pgi .ne-rgrip,.pgi .ne-selhint,.pgi .na-pgbar,' +
        '.pgi .ne-code-bar,.pgi .ne-menu,.pgi .ne-img-ed,.pgi .ne-tex,.pgi .ne-tbl-bar,' +
        '.pgi .ne-cap-ed,.pgi .nc-selbar{visibility:hidden !important}' +
      '.pgi [data-ph]::before{content:"" !important;opacity:0 !important}' +
      '.pgi *{caret-color:transparent}' +
      '.mink{position:absolute;pointer-events:none;z-index:9}' +
      '.mink svg{display:block;inline-size:100%;block-size:100%}' +
      '.ldg{padding:24pt;text-align:center;color:#9ca3af;font-size:10pt;font-family:sans-serif}';
  }

  /*@3.NOPJ.6*/
  /*@3.NOPJ.11*/
  function pruneSlice(tpl, spans, idx, ph, baseY) {
    var over = ph * 0.25;
    var b0y = baseY || 0;
    var sy0 = b0y + idx * ph - over, sy1 = b0y + (idx + 1) * ph + over;
    var rTop = (spans && spans.rootTop) || 0;
    var frag = tpl.content.cloneNode(true);
    var root = frag.querySelector('.ne-root');
    if (root && spans && spans.map) {
      root.style.position = 'relative';
      root.style.display = 'block';
      root.style.padding = '0';
      root.style.blockSize = Math.ceil(spans.rootH) + 'px';
      var kids = Array.prototype.slice.call(root.children), i;
      for (i = 0; i < kids.length; i++) {
        var k = kids[i];
        var bid = k.getAttribute && k.getAttribute('data-bid');
        var sp = bid ? spans.map[bid] : null;
        if (!sp) continue;
        if (rTop + sp.t + sp.h < sy0 || rTop + sp.t > sy1) { root.removeChild(k); continue; }
        k.style.position = 'absolute';
        k.style.insetBlockStart = sp.t.toFixed(2) + 'px';
        k.style.insetInlineStart = sp.s.toFixed(2) + 'px';
        k.style.inlineSize = sp.w.toFixed(2) + 'px';
        k.style.margin = '0';
      }
    }
    /*@3.NOPJ.12*/
    var mink = frag.querySelector('.mink');
    if (mink && spans && typeof spans.inkTop === 'number' && spans.inkH > 0) {
      var mTop = (spans.sheetTop || 0) + spans.inkTop;
      var a0 = Math.max(sy0, mTop), b0 = Math.min(sy1, mTop + spans.inkH);
      if (b0 <= a0 + 1) {
        if (mink.parentNode) mink.parentNode.removeChild(mink);
      } else {
        var la = a0 - mTop, lb = b0 - mTop;
        mink.style.insetBlockStart = (spans.inkTop + la).toFixed(1) + 'px';
        mink.style.blockSize = (lb - la).toFixed(1) + 'px';
        var sv = mink.querySelector('svg');
        if (sv) {
          var vb = String(sv.getAttribute('viewBox') || '').split(/\s+/);
          var vw = parseFloat(vb[2]) || 794;
          sv.setAttribute('viewBox', '0 ' + la.toFixed(1) + ' ' + vw + ' ' + (lb - la).toFixed(1));
          sv.setAttribute('preserveAspectRatio', 'none');
        }
      }
    }
    var host = document.createElement('div');
    host.appendChild(frag);
    return host.innerHTML;
  }

  function mirrorPages(doc, m) {
    var g = mirrorGeom(m);
    var ov = doc && doc.ov;
    var box = m.inkBox;
    var job = (ov && box && (ov.ink || (ov.shapes && ov.shapes.length)))
      ? inkSvg({ ink: ov.ink, shapes: ov.shapes, w: box.w, h: box.h })
      : Promise.resolve('');
    return job.then(function (sv) {
      var inner = String(m.html || '').replace('<!--INKSLOT-->', sv || '');
      var out = '', i;
      var spans = m.spans && m.spans.map ? m.spans : null;
      var tpl = null;
      if (spans) {
        tpl = document.createElement('template');
        tpl.innerHTML = inner;
        if (!tpl.content.querySelector('.ne-root')) { tpl = null; }
      }
      var baseY = g.crop ? g.crop.y0 : 0;
      for (i = 0; i < g.pages; i++) {
        var body = inner;
        if (tpl) body = pruneSlice(tpl, spans, i, g.ph, baseY);
        out += '<section class="pgw"><div class="pgi" style="inset-block-start:' +
          (-(baseY + i * g.ph)) + 'px">' + body + '</div></section>';
      }
      return out;
    });
  }

  /*@3.NOPJ.9*/
  function waitPaint(win) {
    var imgs = win.document.images || [];
    var jobs = [], i;
    for (i = 0; i < imgs.length; i++) {
      if (imgs[i].complete) continue;
      jobs.push(new Promise(function (res) {
        var t = setTimeout(res, 4000);
        var done = function () { clearTimeout(t); res(); };
        imgs[i].addEventListener('load', done);
        imgs[i].addEventListener('error', done);
      }));
    }
    if (win.document.fonts && win.document.fonts.ready) jobs.push(win.document.fonts.ready);
    return Promise.all(jobs);
  }

  function printMirror(doc, m) {
    var g = mirrorGeom(m);
    var isA = m.dir === 'rtl';
    var win = window.open('', '_blank');
    if (!win) {
      alert(L('مانع النوافذ منع الطباعة — اسمح بالنوافذ لهذا الموقع ثمّ أعد المحاولة.',
              'A popup blocker stopped printing — allow popups for this site and try again.'));
      return;
    }
    var sheets = (m.css || []).map(function (h) {
      return '<link rel="stylesheet" href="' + esc(h) + '">';
    }).join('');
    win.document.write('<!DOCTYPE html><html dir="' + (isA ? 'rtl' : 'ltr') +
      '" lang="' + (isA ? 'ar' : 'en') + '" data-theme="light"><head><meta charset="UTF-8">' +
      '<title>' + esc(m.title || L('ملاحظة', 'Note')) + '</title>' + sheets +
      '<style>' + mirrorCss(g) + '</style>' + mjxStyles() + '</head><body>' +
      '<p class="ldg">' + esc(L('يُجهَّز للطباعة…', 'Preparing to print…')) + '</p>' +
      '</body></html>');
    win.document.close();

    mirrorPages(doc, m).then(function (html) {
      if (win.closed) return;
      win.document.body.innerHTML = html;
      return waitPaint(win);
    }).then(function () {
      if (win.closed) return;
      setTimeout(function () { try { win.focus(); win.print(); } catch (e) {} }, 320);
    })['catch'](function () {
      if (!win.closed) {
        win.document.body.innerHTML =
          '<p class="ldg">' + esc(L('تعذّر تجهيز الطباعة.', 'Could not prepare the printout.')) + '</p>';
      }
    });
  }

  /*@3.NOPJ.1*/
  function print(doc, meta) {
    var m = meta || {};
    if (m.html) { printMirror(doc, m); return; }
    var isA = isAr();
    var g = null;
    var win = window.open('', '_blank');
    if (!win) {
      alert(L('مانع النوافذ منع الطباعة — اسمح بالنوافذ لهذا الموقع ثمّ أعد المحاولة.',
              'A popup blocker stopped printing — allow popups for this site and try again.'));
      return;
    }
    win.document.write('<!DOCTYPE html><html dir="' + (isA ? 'rtl' : 'ltr') +
      '" lang="' + (isA ? 'ar' : 'en') + '"><head><meta charset="UTF-8">' +
      '<title>' + esc(m.title || L('ملاحظة', 'Note')) + '</title>' +
      (_fontHref ? '<link rel="stylesheet" href="' + esc(_fontHref) + '">' : '') +
      '<style>' + css(m.land, g) + '</style>' + mjxStyles() + '</head><body>' +
      '<p class="ldg">' + esc(L('يُجهَّز للطباعة…', 'Preparing to print…')) + '</p>' +
      '</body></html>');
    win.document.close();

    var made = buildBody(doc);
    made.then(function (html) {
      if (win.closed) return;
      if (g) {
        win.document.body.innerHTML = html;
      } else {
        var sub = [m.course, new Date().toLocaleDateString(isA ? 'ar-SA' : 'en-GB')]
          .filter(function (x) { return x; }).join(' · ');
        win.document.body.innerHTML =
          '<header class="hd"><h1>' + esc(m.title || L('بلا عنوان', 'Untitled')) + '</h1>' +
          (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</header>' + html;
      }
      var go = function () {
        setTimeout(function () { try { win.focus(); win.print(); } catch (e) {} }, 260);
      };
      if (win.document.fonts && win.document.fonts.ready) win.document.fonts.ready.then(go, go);
      else setTimeout(go, 700);
    })['catch'](function () {
      if (!win.closed) {
        win.document.body.innerHTML =
          '<p class="ldg">' + esc(L('تعذّر تجهيز الطباعة.', 'Could not prepare the printout.')) + '</p>';
      }
    });
  }

  window.GardenNotesPrint = { print: print, buildBody: buildBody };
})();
