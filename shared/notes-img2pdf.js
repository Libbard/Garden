;(function () {
  'use strict';

  var MAX_ITEMS = 600, MAX_FILE = 60 * 1024 * 1024, MAX_TOTAL = 700 * 1024 * 1024;
  var IMG_EXT = /\.(jpe?g|jfif|png|webp|gif|bmp|avif|heic|heif|tiff?)$/i;
  var PAGE = { a4: [595.28, 841.89], letter: [612, 792] };
  var GRID = { '1': [1, 1], '2v': [1, 2], '2h': [2, 1], '4': [2, 2], '6': [2, 3], '9': [3, 3] };
  var MARGIN = { none: 0, s: 18, m: 36 };
  var KEEP = 'garden_img2pdf';
  var H = null, dlg = null, items = [], seq = 0, busy = 0, built = null;
  var o = { per: '1', size: 'a4', orient: 'auto', margin: 's', flow: '', zip: false, ocr: false, sort: 'name', dir: 1 };

  function L(a, b) { return H.L(a, b); }
  function esc(s) { return H.esc(s); }
  function load() { try { var v = JSON.parse(localStorage.getItem(KEEP) || '{}'); Object.keys(o).forEach(function (k) { if (v[k] !== undefined) o[k] = v[k]; }); } catch (e) {} }
  function keep() { try { localStorage.setItem(KEEP, JSON.stringify(o)); } catch (e) {} }
  function flowRtl() { return o.flow ? o.flow === 'rtl' : H.isAr(); }

  /*@3.NOIJ6.1*/
  function exifOf(file) {
    if (!/jpe?g|jfif/i.test(file.type || file.name)) return Promise.resolve({});
    return file.slice(0, 196608).arrayBuffer().then(function (ab) {
      var v = new DataView(ab), out = {};
      if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return out;
      var p = 2;
      while (p + 4 < v.byteLength) {
        var mk = v.getUint16(p), len = v.getUint16(p + 2);
        if (mk === 0xFFE1 && v.getUint32(p + 4) === 0x45786966) {
          var t = p + 10, le = v.getUint16(t) === 0x4949;
          var u16 = function (q) { return v.getUint16(q, le); }, u32 = function (q) { return v.getUint32(q, le); };
          var ifd = function (off, cb) {
            var n = u16(t + off);
            for (var i = 0; i < n; i++) { var e = t + off + 2 + i * 12; if (e + 12 > v.byteLength) return; cb(u16(e), e); }
          };
          var str = function (e) {
            var c = u32(e + 4), at = c > 4 ? t + u32(e + 8) : e + 8, s = '';
            for (var k = 0; k < c - 1 && at + k < v.byteLength; k++) s += String.fromCharCode(v.getUint8(at + k));
            return s;
          };
          ifd(u32(t + 4), function (tag, e) {
            if (tag === 0x0112) out.or = u16(e + 8);
            else if (tag === 0x0132 && !out.at) out.at = str(e);
            else if (tag === 0x8769) ifd(u32(e + 8), function (tg, e2) { if (tg === 0x9003) out.at = str(e2); });
          });
          if (out.at) {
            var m = /^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/.exec(out.at);
            out.at = m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : 0;
          }
          return out;
        }
        if ((mk & 0xFF00) !== 0xFF00 || mk === 0xFFDA) break;
        p += 2 + len;
      }
      return out;
    })['catch'](function () { return {}; });
  }
  var EXIF_CW = { 3: 180, 6: 90, 8: 270 };

  function thumbOf(it) {
    return createImageBitmap(it.file, { imageOrientation: 'from-image' }).then(function (bmp) {
      it.w = bmp.width; it.h = bmp.height;
      var k = Math.min(1, 220 / Math.max(it.w, it.h)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(it.w * k)); c.height = Math.max(1, Math.round(it.h * k));
      var g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(bmp, 0, 0, c.width, c.height);
      if (bmp.close) bmp.close();
      it.th = c;
    });
  }

  function addFiles(list, why) {
    var fs = [].slice.call(list || []), skipped = 0, big = 0;
    var total = items.reduce(function (a, x) { return a + x.file.size; }, 0);
    fs.forEach(function (f) {
      if (!f || !(IMG_EXT.test(f.name || '') || /^image\//.test(f.type || ''))) { skipped++; return; }
      if (items.length >= MAX_ITEMS || f.size > MAX_FILE || total + f.size > MAX_TOTAL) { big++; return; }
      total += f.size;
      items.push({ id: ++seq, file: f, name: f.webkitRelativePath || f.relPath || f.name || '', size: f.size, mt: f.lastModified || 0, rot: 0, st: 'wait' });
    });
    if (skipped || big) note((skipped ? L('تُرك ' + skipped + ' ممّا ليس صورة. ', skipped + ' non-image files left out. ') : '') +
      (big ? L('وتُرك ' + big + ' فوق الحدّ (‏' + MAX_ITEMS + ' صورة · 60 م.ب للصورة · 700 م.ب للمجموع).', big + ' over the limit (' + MAX_ITEMS + ' images · 60 MB each · 700 MB in all).') : ''));
    else note('');
    sortNow();
    pump();
    paint();
  }
  var pumping = 0;
  function pump() {
    if (pumping >= 2) return;
    var it = items.filter(function (x) { return x.st === 'wait'; })[0];
    if (!it) { if (!pumping) paint(); return; }
    it.st = 'load'; pumping++;
    Promise.all([exifOf(it.file), thumbOf(it)]).then(function (r) {
      it.ex = r[0] || {};
      it.shot = it.ex.at || it.mt;
      it.st = 'ok';
    }, function () { it.st = 'bad'; }).then(function () {
      pumping--;
      if (o.sort === 'shot') sortNow();
      paint();
      pump();
    });
    pump();
  }

  function fromZip(f) {
    note(L('أفتح «' + f.name + '»…', 'Opening “' + f.name + '”…'));
    return needZip().then(function (Z) { return Z.read(f); }).then(function (ents) {
      var out = [];
      Object.keys(ents).forEach(function (n) {
        if (!IMG_EXT.test(n) || /(^|\/)(__MACOSX|\.)/.test(n)) return;
        var ff = new File([ents[n]], n.split('/').pop(), { type: mimeOf(n), lastModified: f.lastModified || Date.now() });
        ff.relPath = n;
        out.push(ff);
      });
      if (!items.length) setTitle(f.name.replace(/\.zip$/i, ''));
      addFiles(out);
    })['catch'](function (e) {
      note(/method/.test(String(e && e.message)) ? L('ضُغط هذا الملفُّ بطريقةٍ لا يقرؤها متصفّحك — أعِدْ ضغطه بـ«ضغط» العاديّ.', 'This zip uses a method your browser cannot read — re-zip it the usual way.')
        : L('تعذّر فتحُ «' + f.name + '» — هل هو ملفُّ zip سليم؟', 'Could not open “' + f.name + '” — is it a valid zip?'), 1);
    });
  }
  function mimeOf(n) {
    var e = (/\.([a-z0-9]+)$/i.exec(n) || [])[1] || '';
    e = e.toLowerCase();
    return { jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', avif: 'image/avif', heic: 'image/heic', heif: 'image/heif', tif: 'image/tiff', tiff: 'image/tiff' }[e] || '';
  }
  var zipP = null;
  function needZip() {
    if (window.GardenZip) return Promise.resolve(window.GardenZip);
    if (!zipP) zipP = new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = H.base + 'zip-lite.js' + H.q;
      s.onload = function () { window.GardenZip ? ok(window.GardenZip) : no(new Error('zip_missing')); };
      s.onerror = function () { zipP = null; no(new Error('zip_load')); };
      document.head.appendChild(s);
    });
    return zipP;
  }
  function take(list) {
    var fs = [].slice.call(list || []), zips = fs.filter(function (f) { return /\.zip$/i.test(f.name || '') || f.type === 'application/zip'; });
    var rest = fs.filter(function (f) { return zips.indexOf(f) < 0; });
    if (rest.length) {
      var p0 = rest[0].webkitRelativePath || '';
      if (p0 && !items.length) setTitle(p0.split('/')[0]);
      addFiles(rest);
    }
    zips.reduce(function (ch, z) { return ch.then(function () { return fromZip(z); }); }, Promise.resolve());
  }
  function walk(entry, path, out) {
    return new Promise(function (ok) {
      if (entry.isFile) { entry.file(function (f) { f.relPath = path + f.name; out.push(f); ok(); }, function () { ok(); }); return; }
      if (!entry.isDirectory) { ok(); return; }
      var rd = entry.createReader(), all = [];
      (function more() {
        rd.readEntries(function (es) {
          if (!es.length) { all.reduce(function (ch, e) { return ch.then(function () { return walk(e, path + entry.name + '/', out); }); }, Promise.resolve()).then(ok); return; }
          all = all.concat([].slice.call(es)); more();
        }, function () { ok(); });
      })();
    });
  }
  function dropped(dt) {
    var its = dt.items ? [].slice.call(dt.items) : [];
    var ents = its.map(function (x) { return x.webkitGetAsEntry ? x.webkitGetAsEntry() : null; }).filter(Boolean);
    if (!ents.length) { take(dt.files); return; }
    var out = [];
    if (ents.length === 1 && ents[0].isDirectory && !items.length) setTitle(ents[0].name);
    ents.reduce(function (ch, e) { return ch.then(function () { return walk(e, '', out); }); }, Promise.resolve()).then(function () { take(out); });
  }

  /*@3.NOIJ6.2*/
  var COLL = (typeof Intl !== 'undefined' && Intl.Collator) ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }) : null;
  function cmpName(a, b) { return COLL ? COLL.compare(a.name, b.name) : (a.name < b.name ? -1 : a.name > b.name ? 1 : 0); }
  function sortNow() {
    if (o.sort === 'manual') return;
    var key = { name: null, shot: 'shot', mt: 'mt', size: 'size' }[o.sort];
    items.sort(function (a, b) {
      var r = key ? ((a[key] || 0) - (b[key] || 0)) : 0;
      if (!r) r = cmpName(a, b);
      return r * o.dir;
    });
  }

  function dispDims(it) {
    var w = it.w || 1, h = it.h || 1;
    return (it.rot % 180) ? [h, w] : [w, h];
  }
  function pagesOf() {
    var ok = items.filter(function (x) { return x.st !== 'bad'; });
    var g = GRID[o.per] || GRID['1'], per = g[0] * g[1], out = [];
    for (var i = 0; i < ok.length; i += per) out.push(ok.slice(i, i + per));
    return out;
  }
  function pageSize(group) {
    var g = GRID[o.per] || GRID['1'];
    if (o.size === 'fit' && g[0] * g[1] === 1 && group[0]) {
      var d = dispDims(group[0]), k = 842 / Math.max(d[0], d[1]);
      return [Math.round(d[0] * k * 100) / 100, Math.round(d[1] * k * 100) / 100];
    }
    var s = PAGE[o.size] || PAGE.a4, land;
    if (o.orient === 'p') land = false;
    else if (o.orient === 'l') land = true;
    else if (o.per === '2h') land = true;
    else if (o.per === '1' && group[0]) { var dd = dispDims(group[0]); land = dd[0] > dd[1] * 1.08; }
    else land = false;
    return land ? [s[1], s[0]] : [s[0], s[1]];
  }
  function cellsOf(W, Hh) {
    var g = GRID[o.per] || GRID['1'], m = MARGIN[o.margin] || 0, gap = g[0] * g[1] > 1 ? (m ? 10 : 4) : 0;
    var cw = (W - 2 * m - gap * (g[0] - 1)) / g[0], ch = (Hh - 2 * m - gap * (g[1] - 1)) / g[1], out = [];
    for (var r = 0; r < g[1]; r++) for (var c = 0; c < g[0]; c++) {
      var cc = flowRtl() ? g[0] - 1 - c : c;
      out.push({ x: m + cc * (cw + gap), y: Hh - m - (r + 1) * ch - r * gap, w: cw, h: ch });
    }
    return out;
  }
  function fit(d, cell) {
    var k = Math.min(cell.w / d[0], cell.h / d[1]), w = d[0] * k, h = d[1] * k;
    return { x: cell.x + (cell.w - w) / 2, y: cell.y + (cell.h - h) / 2, w: w, h: h };
  }

  function paintPrev() {
    var box = dlg && dlg.querySelector('.ip-pages');
    if (!box) return;
    var pgs = pagesOf();
    box.innerHTML = '';
    pgs.slice(0, 40).forEach(function (grp, pi) {
      var ps = pageSize(grp), k = 104 / Math.max(ps[0], ps[1]), c = document.createElement('canvas');
      var r = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(ps[0] * k * r); c.height = Math.round(ps[1] * k * r);
      c.style.inlineSize = Math.round(ps[0] * k) + 'px'; c.style.blockSize = Math.round(ps[1] * k) + 'px';
      var g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      var cells = cellsOf(ps[0], ps[1]), s = k * r;
      grp.forEach(function (it, j) {
        if (!it.th) { var b = fit(dispDims(it), cells[j]); g.fillStyle = '#e5e7eb'; g.fillRect(b.x * s, (ps[1] - b.y - b.h) * s, b.w * s, b.h * s); return; }
        var f = fit(dispDims(it), cells[j]);
        g.save();
        g.translate((f.x + f.w / 2) * s, (ps[1] - f.y - f.h / 2) * s);
        g.rotate(it.rot * Math.PI / 180);
        var dw = (it.rot % 180 ? f.h : f.w) * s, dh = (it.rot % 180 ? f.w : f.h) * s;
        g.drawImage(it.th, -dw / 2, -dh / 2, dw, dh);
        g.restore();
      });
      var fig = document.createElement('figure');
      fig.className = 'ip-pg';
      fig.appendChild(c);
      var cap = document.createElement('figcaption');
      cap.textContent = String(pi + 1);
      fig.appendChild(cap);
      box.appendChild(fig);
    });
    if (pgs.length > 40) { var more = document.createElement('span'); more.className = 'ip-more'; more.textContent = '+' + (pgs.length - 40); box.appendChild(more); }
  }

  function chips(name, list, cur) {
    return '<div class="gsf-chips ip-chips" role="radiogroup" data-g="' + name + '">' + list.map(function (c) {
      return '<button type="button" class="gsf-chip' + (c[0] === cur ? ' on' : '') + '" role="radio" aria-checked="' + (c[0] === cur) + '" data-v="' + c[0] + '">' + (c[2] ? '<i class="fa-solid ' + c[2] + '" aria-hidden="true"></i> ' : '') + esc(c[1]) + '</button>';
    }).join('') + '</div>';
  }
  function optsHtml() {
    var g = GRID[o.per] || GRID['1'];
    return '<div class="ip-lbl">' + esc(L('في الصفحة', 'Per page')) + '</div>' +
      chips('per', [['1', L('صورة', 'One')], ['2v', L('2 فوق بعض', '2 stacked')], ['2h', L('2 جنباً', '2 side by side')], ['4', '4'], ['6', '6'], ['9', '9']], o.per) +
      (g[0] > 1 ? chips('flow', [['rtl', L('من اليمين', 'From the right')], ['ltr', L('من اليسار', 'From the left')]], flowRtl() ? 'rtl' : 'ltr') : '') +
      '<div class="ip-lbl">' + esc(L('المقاس', 'Size')) + '</div>' +
      chips('size', [['a4', 'A4'], ['letter', 'Letter']].concat(o.per === '1' ? [['fit', L('بحجم الصورة', 'Fit each image')]] : []), o.size === 'fit' && o.per !== '1' ? 'a4' : o.size) +
      (o.size === 'fit' && o.per === '1' ? '' : '<div class="ip-lbl">' + esc(L('الاتّجاه', 'Orientation')) + '</div>' +
        chips('orient', [['auto', L('تلقائيّ', 'Auto')], ['p', L('عموديّ', 'Portrait')], ['l', L('أفقيّ', 'Landscape')]], o.orient)) +
      '<div class="ip-lbl">' + esc(L('الهامش', 'Margin')) + '</div>' +
      chips('margin', [['none', L('بلا', 'None')], ['s', L('ضيّق', 'Narrow')], ['m', L('عاديّ', 'Normal')]], o.margin);
  }
  function outHtml() {
    var ocrOk = H.canOcr();
    var opt = function (k, icon, t, s, on, off) {
      return '<button type="button" class="gsf-opt ip-out" data-out="' + k + '" aria-pressed="' + (!!on) + '"' + (off ? ' disabled' : '') + '><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
        '<span class="gsf-opt-t">' + esc(t) + '</span><span class="gsf-opt-s">' + esc(s) + '</span></button>';
    };
    return '<div class="ip-lbl">' + esc(L('الملفُّ الناتج', 'The file')) + '</div><div class="gsf-opts ip-outs">' +
      opt('plain', 'fa-layer-group', L('تجميعٌ فقط', 'Just combine'), L('الصورُ بجودتها كما هي', 'Images at full quality'), !o.zip && !o.ocr) +
      opt('zip', 'fa-compress', L('اضغطِ الصور', 'Compress images'), L('ملفٌّ أخفُّ للمشاركة والرفع', 'A lighter file to share or upload'), o.zip) +
      opt('ocr', 'fa-magnifying-glass', L('اقرأِ النصّ', 'Read the text'),
        ocrOk ? L('بحثٌ ونسخٌ في أيِّ قارئ — يجهز في الخلفيّة ويصلك تنبيه', 'Search and copy in any reader — ready in the background, with a notification')
              : L('يحتاج تفعيلَ المزامنة في الإعدادات', 'Needs sync turned on in Settings'), o.ocr && ocrOk, !ocrOk) + '</div>';
  }
  function trayHtml() {
    if (!items.length) return '<div class="ip-empty">' + esc(L('لا صورَ بعد — أضِفْها من الأزرار أو أسقِطْها هنا.', 'No images yet — add them with the buttons or drop them here.')) + '</div>';
    return items.map(function (it, i) {
      var bad = it.st === 'bad';
      return '<div class="ip-th" role="listitem" data-id="' + it.id + '"' + (bad ? ' data-bad="1"' : '') + ' tabindex="0" aria-label="' + esc((i + 1) + ' · ' + it.name) + '" title="' + esc(it.name) + (bad ? esc(L(' — لا يقرؤها متصفّحك', ' — your browser cannot read it')) : '') + '">' +
        '<span class="ip-th-i" aria-hidden="true"></span><b class="ip-th-n">' + (i + 1) + '</b>' +
        '<span class="ip-th-a"><button type="button" class="ip-ib" data-a="rot" aria-label="' + esc(L('دوِّرْ', 'Rotate')) + '" title="' + esc(L('دوِّرْ', 'Rotate')) + '"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i></button>' +
        '<button type="button" class="ip-ib" data-a="del" aria-label="' + esc(L('احذفْ', 'Remove')) + '" title="' + esc(L('احذفْ', 'Remove')) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></span></div>';
    }).join('');
  }
  function sortHtml() {
    var S = [['name', L('الاسم', 'Name')], ['shot', L('تاريخ الالتقاط', 'Date taken')], ['mt', L('تاريخ التعديل', 'Date modified')], ['size', L('الحجم', 'Size')]];
    if (o.sort === 'manual') S.push(['manual', L('يدويّ', 'Manual')]);
    return '<span class="ip-lbl">' + esc(L('رتِّبْ', 'Sort')) + '</span>' + chips('sort', S, o.sort) +
      '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost ip-dir" data-a="sdir" aria-label="' + esc(o.dir > 0 ? L('تصاعديّ — اضغطْ للعكس', 'Ascending — press to reverse') : L('تنازليّ — اضغطْ للعكس', 'Descending — press to reverse')) + '">' +
      '<i class="fa-solid ' + (o.dir > 0 ? 'fa-arrow-down-short-wide' : 'fa-arrow-down-wide-short') + '" aria-hidden="true"></i> ' + esc(o.dir > 0 ? L('تصاعديّ', 'Ascending') : L('تنازليّ', 'Descending')) + '</button>';
  }

  function paint() {
    if (!dlg) return;
    var pgs = pagesOf(), n = items.filter(function (x) { return x.st !== 'bad'; }).length;
    dlg.querySelector('.ip-sub').textContent = n
      ? L(n + (n === 1 ? ' صورة' : ' صور') + ' · ' + pgs.length + (pgs.length === 1 ? ' صفحة' : ' صفحات'), n + (n === 1 ? ' image' : ' images') + ' · ' + pgs.length + (pgs.length === 1 ? ' page' : ' pages'))
      : L('صورةٌ أو صورٌ أو مجلّدٌ أو ملفُّ zip', 'An image, several, a folder or a zip file');
    var tray = dlg.querySelector('.ip-tray');
    tray.innerHTML = trayHtml();
    items.forEach(function (it) {
      var el = tray.querySelector('[data-id="' + it.id + '"] .ip-th-i');
      if (!el || !it.th) return;
      var c = document.createElement('canvas');
      c.width = it.th.width; c.height = it.th.height;
      c.getContext('2d').drawImage(it.th, 0, 0);
      c.style.transform = it.rot ? 'rotate(' + it.rot + 'deg)' : '';
      el.appendChild(c);
    });
    dlg.querySelector('.ip-sort').innerHTML = sortHtml();
    dlg.querySelector('.ip-opts').innerHTML = optsHtml();
    dlg.querySelector('.ip-outw').innerHTML = outHtml();
    var go = dlg.querySelector('[data-a="go"]');
    var loading = items.some(function (x) { return x.st === 'wait' || x.st === 'load'; });
    go.disabled = !n || loading || !!busy;
    go.innerHTML = '<i class="fa-solid fa-file-pdf" aria-hidden="true"></i> ' + esc(loading ? L('أقرأ الصور…', 'Reading images…') : L('أنشئْ الملفّ', 'Create the file'));
    paintPrev();
  }
  function note(t, bad) {
    var s = dlg && dlg.querySelector('.ip-st');
    if (!s) return;
    s.textContent = t || '';
    if (bad) s.setAttribute('data-bad', '1'); else s.removeAttribute('data-bad');
  }
  function setTitle(t) { var i = dlg && dlg.querySelector('#ip-name'); if (i && !i.value) i.value = String(t || '').slice(0, 80); }

  /*@3.NOIJ6.3*/
  function canvasJpeg(it, cap, q) {
    return createImageBitmap(it.file, { imageOrientation: 'from-image' }).then(function (bmp) {
      var k = cap ? Math.min(1, cap / Math.max(bmp.width, bmp.height)) : 1;
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
      var g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.imageSmoothingQuality = 'high';
      g.drawImage(bmp, 0, 0, c.width, c.height);
      if (bmp.close) bmp.close();
      return new Promise(function (ok, no) { c.toBlob(function (b) { b ? ok(b) : no(new Error('jpeg')); }, 'image/jpeg', q); });
    }).then(function (b) { return b.arrayBuffer(); }).then(function (ab) { return { bytes: ab, jpg: 1, cw: 0 }; });
  }
  function embedSrc(it, cellPt) {
    var isJpg = /jpe?g|jfif/i.test(it.file.type || it.file.name), isPng = /png/i.test(it.file.type || it.file.name);
    var or = (it.ex && it.ex.or) || 1;
    if (o.zip) {
      var cap = Math.max(1000, Math.ceil(Math.max(cellPt.w, cellPt.h) / 72 * 200));
      return canvasJpeg(it, cap, 0.78);
    }
    if (isJpg && (or === 1 || EXIF_CW[or])) return it.file.arrayBuffer().then(function (ab) { return { bytes: ab, jpg: 1, cw: EXIF_CW[or] || 0 }; });
    if (isPng) return it.file.arrayBuffer().then(function (ab) { return { bytes: ab, png: 1, cw: 0 }; });
    return canvasJpeg(it, 0, 0.92);
  }
  function place(P, page, img, f, cwTotal) {
    var ccw = (360 - (cwTotal % 360)) % 360, sw = ccw % 180 !== 0;
    var w = sw ? f.h : f.w, h = sw ? f.w : f.h, x = f.x, y = f.y;
    if (ccw === 90) { x = f.x + f.w; }
    else if (ccw === 180) { x = f.x + f.w; y = f.y + f.h; }
    else if (ccw === 270) { y = f.y + f.h; }
    page.drawImage(img, { x: x, y: y, width: w, height: h, rotate: P.degrees(ccw) });
  }
  function build() {
    return H.needEdit().then(function (E) { return E.lib(); }).then(function (P) {
      return P.PDFDocument.create().then(function (doc) {
        var pgs = pagesOf(), at = 0, total = pgs.reduce(function (a, g) { return a + g.length; }, 0);
        var title = String((dlg.querySelector('#ip-name') || {}).value || '').trim();
        if (title) doc.setTitle(title);
        doc.setCreator('Byte — الحديقة الرقمية');
        return pgs.reduce(function (ch, grp) {
          return ch.then(function () {
            var ps = pageSize(grp), page = doc.addPage(ps), cells = cellsOf(ps[0], ps[1]);
            return grp.reduce(function (c2, it, j) {
              return c2.then(function () {
                note(L('أجهّز الصور: ' + (++at) + ' من ' + total + '…', 'Preparing images: ' + at + ' of ' + total + '…'));
                return embedSrc(it, cells[j]).then(function (s) {
                  return (s.png ? doc.embedPng(s.bytes) : doc.embedJpg(s.bytes))['catch'](function () {
                    return canvasJpeg(it, 0, 0.92).then(function (s2) { s = s2; return doc.embedJpg(s2.bytes); });
                  }).then(function (img) {
                    place(P, page, img, fit(dispDims(it), cells[j]), ((s.cw || 0) + it.rot) % 360);
                  });
                });
              });
            }, Promise.resolve());
          });
        }, Promise.resolve()).then(function () {
          note(L('أكتب الملفّ…', 'Writing the file…'));
          return doc.save({ useObjectStreams: true });
        }).then(function (bytes) { return { bytes: bytes, pages: pgs.length, title: title }; });
      });
    });
  }

  function go() {
    if (busy) return;
    busy = 1; paint();
    var title = String(dlg.querySelector('#ip-name').value || '').trim() || L('صور', 'Images') + ' — ' + new Date().toLocaleDateString(H.isAr() ? 'ar-SA-u-nu-latn' : 'en-GB');
    dlg.querySelector('#ip-name').value = title;
    build().then(function (r) {
      var name = title.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) + '.pdf';
      var file = new File([r.bytes], name, { type: 'application/pdf' });
      built = file;
      note(L('أفتحه في الملاحظات…', 'Opening it in your notes…'));
      return H.born(file, title).then(function (nid) {
        if (o.ocr && H.canOcr()) H.ocr(file, nid, title);
        busy = 0;
        try { dlg.close(); } catch (e) {}
        H.toast(o.ocr && H.canOcr()
          ? L('صُنع «' + title + '» — ' + r.pages + ' صفحة. والنصُّ يُقرأ في الخلفيّة، ويصلك تنبيهٌ حين يصير قابلاً للبحث.', 'Made “' + title + '” — ' + r.pages + ' pages. The text is being read in the background; you will be notified when it is searchable.')
          : L('صُنع «' + title + '» — ' + r.pages + ' صفحة.', 'Made “' + title + '” — ' + r.pages + ' pages.'));
      });
    })['catch'](function (e) {
      busy = 0;
      paint();
      note(L('تعذّر إنشاءُ الملفّ: ', 'Could not create the file: ') + (e && e.message ? e.message : ''), 1);
    });
  }

  /*@3.NOIJ6.4*/
  function wireTray(tray) {
    var drag = null;
    tray.addEventListener('pointerdown', function (e) {
      var th = e.target.closest('.ip-th');
      if (!th || e.target.closest('.ip-ib') || e.button > 0) return;
      drag = { el: th, id: +th.getAttribute('data-id'), x: e.clientX, y: e.clientY, on: false, pid: e.pointerId };
    });
    tray.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.pid) return;
      if (!drag.on) {
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
        drag.on = true;
        try { tray.setPointerCapture(e.pointerId); } catch (e0) {}
        drag.el.setAttribute('data-drag', '1');
      }
      e.preventDefault();
      drag.el.style.transform = 'translate(' + (e.clientX - drag.x) + 'px,' + (e.clientY - drag.y) + 'px)';
      var over = null;
      [].forEach.call(tray.querySelectorAll('.ip-th'), function (t) {
        if (t === drag.el) return;
        var r = t.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) over = t;
        t.removeAttribute('data-over');
      });
      if (over) over.setAttribute('data-over', '1');
      drag.over = over ? +over.getAttribute('data-id') : 0;
    });
    function end() {
      if (!drag) return;
      var d = drag; drag = null;
      if (!d.on) return;
      if (d.over && d.over !== d.id) {
        var from = items.findIndex(function (x) { return x.id === d.id; }), to = items.findIndex(function (x) { return x.id === d.over; });
        var it = items.splice(from, 1)[0];
        items.splice(to, 0, it);
        o.sort = 'manual';
      }
      paint();
    }
    tray.addEventListener('pointerup', end);
    tray.addEventListener('pointercancel', end);
    tray.addEventListener('keydown', function (e) {
      var th = e.target.closest('.ip-th');
      if (!th) return;
      var i = items.findIndex(function (x) { return x.id === +th.getAttribute('data-id'); });
      var fwd = H.isAr() ? 'ArrowLeft' : 'ArrowRight', back = H.isAr() ? 'ArrowRight' : 'ArrowLeft';
      if (e.altKey && (e.key === fwd || e.key === back)) {
        var j = i + (e.key === fwd ? 1 : -1);
        if (j < 0 || j >= items.length) return;
        e.preventDefault();
        var x = items[i]; items[i] = items[j]; items[j] = x;
        o.sort = 'manual';
        paint();
        var n = dlg.querySelector('.ip-th[data-id="' + x.id + '"]');
        if (n) n.focus();
      } else if (e.key === 'Delete') { items.splice(i, 1); paint(); }
      else if (e.key === 'r' || e.key === 'R') { items[i].rot = (items[i].rot + 90) % 360; paint(); }
    });
    tray.addEventListener('click', function (e) {
      var b = e.target.closest('.ip-ib');
      if (!b) return;
      var id = +b.closest('.ip-th').getAttribute('data-id'), i = items.findIndex(function (x) { return x.id === id; });
      if (i < 0) return;
      if (b.getAttribute('data-a') === 'rot') items[i].rot = (items[i].rot + 90) % 360;
      else items.splice(i, 1);
      paint();
    });
  }

  function make() {
    var d = document.createElement('dialog');
    d.id = 'na-img2pdf';
    d.className = 'gsf gsf--flat na-dlg ip';
    d.setAttribute('aria-labelledby', 'ip-t');
    d.setAttribute('data-keep-open', '1');
    d.setAttribute('dir', H.isAr() ? 'rtl' : 'ltr');
    d.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close" type="submit" aria-label="' + esc(L('إغلاق', 'Close')) + '" title="' + esc(L('إغلاق', 'Close')) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
      '<div class="gsf-body"><div class="gsf-head"><h2 class="gsf-title" id="ip-t">' + esc(L('أنشئْ PDF من صور', 'Create a PDF from images')) + '</h2><p class="gsf-sub ip-sub"></p></div>' +
      '<div class="ip-split"><div class="ip-main">' +
        '<div class="ip-add">' +
          '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost" data-a="files"><i class="fa-solid fa-images" aria-hidden="true"></i> ' + esc(L('صور', 'Images')) + '</button>' +
          '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost" data-a="dir"><i class="fa-solid fa-folder-open" aria-hidden="true"></i> ' + esc(L('مجلّد', 'Folder')) + '</button>' +
          '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost" data-a="zip"><i class="fa-solid fa-file-zipper" aria-hidden="true"></i> ' + esc(L('ملفُّ zip', 'Zip file')) + '</button>' +
          '</div>' +
        '<div class="ip-sort"></div>' +
        '<div class="ip-tray" role="list" aria-label="' + esc(L('الصور — اسحبْها لترتيبها · Alt مع السهمين للنقل · R للتدوير', 'Images — drag to reorder · Alt+arrows to move · R to rotate')) + '"></div>' +
        '<div class="ip-lbl">' + esc(L('الصفحاتُ كما ستخرج', 'Pages as they will come out')) + '</div><div class="ip-pages" aria-hidden="true"></div>' +
      '</div><div class="ip-side"><div class="ip-opts"></div>' +
        '<label class="ip-lbl" for="ip-name">' + esc(L('اسمُ الملفّ', 'File name')) + '</label><input class="gsf-in" id="ip-name" type="text" dir="auto" autocomplete="off" maxlength="80">' +
        '<div class="ip-outw"></div></div></div>' +
      '<p class="ip-st" role="status" aria-live="polite"></p></div>' +
      '<div class="gsf-foot"><div class="gsf-acts">' +
        '<button type="button" class="gsf-btn gsf-btn--ghost" data-a="x">' + esc(L('إلغاء', 'Cancel')) + '</button>' +
        '<button type="button" class="gsf-btn gsf-btn--go" data-a="go"></button></div></div>';
    document.body.appendChild(d);
    var pick = function (kind) {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.multiple = true;
      if (kind === 'dir') { inp.webkitdirectory = true; inp.setAttribute('webkitdirectory', ''); }
      else inp.accept = kind === 'zip' ? '.zip,application/zip' : 'image/*,.heic,.heif,.zip';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', function () { var fs = inp.files; inp.remove(); if (fs && fs.length) take(fs); });
      inp.click();
    };
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (b && !b.disabled) {
        var a = b.getAttribute('data-a');
        if (a === 'files' || a === 'zip') pick(a);
        else if (a === 'dir') pick('dir');
        else if (a === 'sdir') { o.dir = -o.dir; if (o.sort === 'manual') { items.reverse(); } else sortNow(); keep(); paint(); }
        else if (a === 'go') go();
        else if (a === 'x' && !busy) d.close();
        return;
      }
      var c = e.target.closest('[data-g] [data-v]');
      if (c) {
        var gname = c.closest('[data-g]').getAttribute('data-g'), v = c.getAttribute('data-v');
        o[gname] = v;
        if (gname === 'sort') sortNow();
        keep(); paint();
        return;
      }
      var op = e.target.closest('[data-out]');
      if (op && !op.disabled) {
        var k = op.getAttribute('data-out');
        if (k === 'plain') { o.zip = false; o.ocr = false; }
        else o[k] = !o[k];
        keep(); paint();
      }
    });
    d.addEventListener('cancel', function (e) { if (busy) e.preventDefault(); });
    d.addEventListener('dragover', function (e) { e.preventDefault(); d.setAttribute('data-drop', '1'); });
    d.addEventListener('dragleave', function (e) { if (e.target === d) d.removeAttribute('data-drop'); });
    d.addEventListener('drop', function (e) { e.preventDefault(); d.removeAttribute('data-drop'); if (e.dataTransfer) dropped(e.dataTransfer); });
    wireTray(d.querySelector('.ip-tray'));
    return d;
  }

  function open(hooks, files) {
    H = hooks;
    load();
    if (dlg && dlg.parentNode) dlg.remove();
    items = []; busy = 0; built = null;
    dlg = make();
    paint();
    try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
    if (files && files.length) take(files);
    return dlg;
  }

  window.GardenImgPdf = { open: open, _items: function () { return items; }, _o: o, _build: build };
})();
