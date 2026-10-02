(function () {
  'use strict';
  if (window.GardenPdfSnap) return;

  var SCALE = 2, MIN_PX = 12;

  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar').indexOf('ar') === 0; }
  function L(a, e) { return isAr() ? a : e; }

  function shown(el) {
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    var r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return null;
    return { r: r, cs: cs };
  }

  function wrapLines(ctx, text, max) {
    var out = [];
    String(text || '').split(/\n/).forEach(function (para) {
      var words = para.split(/(\s+)/), line = '';
      for (var i = 0; i < words.length; i++) {
        var t = line + words[i];
        if (line && ctx.measureText(t).width > max) { out.push(line.trim()); line = words[i].trim() ? words[i] : ''; }
        else line = t;
      }
      out.push(line.trim());
    });
    return out;
  }

  function compose(page, crop, base) {
    var pr = page.getBoundingClientRect();
    var c = crop || { left: pr.left, top: pr.top, width: pr.width, height: pr.height };
    var x0 = Math.max(c.left, pr.left), y0 = Math.max(c.top, pr.top);
    var x1 = Math.min(c.left + c.width, pr.right), y1 = Math.min(c.top + c.height, pr.bottom);
    var w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    var k = Math.max(SCALE, window.devicePixelRatio || 1);
    var cv = document.createElement('canvas');
    cv.width = Math.round(w * k);
    cv.height = Math.round(h * k);
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.scale(k, k);
    ctx.translate(-x0, -y0);
    var list = page.querySelectorAll('canvas, .gpi-mk');
    for (var i = 0; i < list.length; i++) {
      var el = list[i], s = shown(el);
      if (!s) continue;
      var isCv = el.tagName === 'CANVAS';
      if (isCv && (!el.width || !el.height)) continue;
      ctx.save();
      var op = parseFloat(s.cs.opacity);
      ctx.globalAlpha = isFinite(op) ? op : 1;
      var blend = '', p = el;
      while (p && p !== page) { var mb = getComputedStyle(p).mixBlendMode; if (mb && mb !== 'normal') { blend = mb; break; } p = p.parentElement; }
      if (blend === 'multiply') ctx.globalCompositeOperation = 'multiply';
      if (isCv) {
        var src = (base && base.el === el && base.img) ? base.img : el;
        try { ctx.drawImage(src, s.r.left, s.r.top, s.r.width, s.r.height); } catch (e) {}
      } else {
        var bg = s.cs.backgroundColor;
        if (bg && !/rgba\([^)]*,\s*0\)$/.test(bg) && bg !== 'transparent') {
          ctx.fillStyle = bg;
          ctx.fillRect(s.r.left, s.r.top, s.r.width, s.r.height);
        }
        var bw = parseFloat(s.cs.borderBottomWidth) || 0;
        if (bw > 0 && s.cs.borderBottomStyle !== 'none') {
          ctx.fillStyle = s.cs.borderBottomColor;
          ctx.fillRect(s.r.left, s.r.bottom - bw, s.r.width, bw);
        }
      }
      ctx.restore();
    }
    var fields = page.querySelectorAll('.gpi-fed > *');
    for (var j = 0; j < fields.length; j++) {
      var f = shown(fields[j]);
      if (!f) continue;
      var txt = fields[j].innerText || '';
      if (!txt.trim()) continue;
      ctx.save();
      var fs = parseFloat(f.cs.fontSize) || 14;
      ctx.font = (f.cs.fontWeight || '400') + ' ' + fs + 'px ' + (f.cs.fontFamily || 'sans-serif');
      ctx.fillStyle = f.cs.color || '#111';
      var rtl = f.cs.direction === 'rtl';
      ctx.direction = rtl ? 'rtl' : 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left';
      ctx.textBaseline = 'top';
      var lh = parseFloat(f.cs.lineHeight) || fs * 1.5;
      var padX = parseFloat(f.cs.paddingInlineStart) || 0, padY = parseFloat(f.cs.paddingTop) || 0;
      var lines = wrapLines(ctx, txt, Math.max(20, f.r.width - padX * 2));
      var tx = rtl ? f.r.right - padX : f.r.left + padX;
      for (var n = 0; n < lines.length; n++) ctx.fillText(lines[n], tx, f.r.top + padY + n * lh);
      ctx.restore();
    }
    return cv;
  }

  function sharp(page, pdoc) {
    var cv = page.querySelector('canvas.gpv-cv');
    var n = Number(page.getAttribute('data-p')) || 1;
    if (!cv || !pdoc || !pdoc.getPage) return Promise.resolve(null);
    var want = page.getBoundingClientRect().width * Math.max(SCALE, window.devicePixelRatio || 1);
    if (cv.width >= want * 0.95) return Promise.resolve(null);
    return pdoc.getPage(n).then(function (pg) {
      var vp1 = pg.getViewport({ scale: 1 });
      var vp = pg.getViewport({ scale: Math.min(4, want / vp1.width) });
      var c = document.createElement('canvas');
      c.width = Math.round(vp.width);
      c.height = Math.round(vp.height);
      return pg.render({ canvasContext: c.getContext('2d'), viewport: vp, annotationMode: 0 }).promise.then(function () {
        try { pg.cleanup(); } catch (e) {}
        return { el: cv, img: c };
      });
    })['catch'](function () { return null; });
  }

  function blob(page, crop, pdoc) {
    return sharp(page, pdoc).then(function (base) {
      return new Promise(function (ok, no) {
        try {
          compose(page, crop, base).toBlob(function (b) { if (b) ok(b); else no(new Error('blob')); }, 'image/png');
        } catch (e) { no(e); }
      });
    });
  }

  function copy(blobOrPromise) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.write || typeof ClipboardItem !== 'function') return Promise.reject(new Error('no-clip'));
      var item = new ClipboardItem({ 'image/png': Promise.resolve(blobOrPromise) });
      return navigator.clipboard.write([item]);
    } catch (e) { return Promise.reject(e); }
  }

  function save(b, name) {
    var url = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = url;
    a.download = name || 'page.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  var cur = null;
  function end() {
    if (!cur) return;
    var c = cur;
    cur = null;
    [c.veil, c.box, c.bar].forEach(function (el) { if (el) el.remove(); });
    document.removeEventListener('keydown', c.key, true);
    if (c.scroller) c.scroller.removeEventListener('scroll', c.onScroll, true);
    if (c.onEnd) { try { c.onEnd(); } catch (e) {} }
  }

  function pick(root, o) {
    end();
    o = o || {};
    var rr = root.getBoundingClientRect();
    var veil = document.createElement('div');
    veil.className = 'gps-veil';
    veil.setAttribute('role', 'application');
    veil.setAttribute('aria-label', L('اسحبْ مستطيلاً حول ما تريد نسخه — Esc للخروج', 'Drag a box around what you want to copy — Esc to leave'));
    veil.style.left = rr.left + 'px';
    veil.style.insetBlockStart = rr.top + 'px';
    veil.style.inlineSize = rr.width + 'px';
    veil.style.blockSize = rr.height + 'px';
    var tip = document.createElement('div');
    tip.className = 'gps-tip';
    tip.textContent = L('اسحبْ مستطيلاً حول الرسم أو المعادلة', 'Drag a box around the figure or formula');
    veil.appendChild(tip);
    document.body.appendChild(veil);
    var box = document.createElement('div');
    box.className = 'gps-box';
    box.hidden = true;
    document.body.appendChild(box);
    var st = null;
    cur = { veil: veil, box: box, bar: null, onEnd: o.onEnd, scroller: o.scroller || root,
      key: function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(); } },
      onScroll: function () { if (cur && cur.bar) end(); } };
    document.addEventListener('keydown', cur.key, true);
    cur.scroller.addEventListener('scroll', cur.onScroll, true);

    function pageAt(x, y) {
      veil.style.pointerEvents = 'none';
      var el = document.elementFromPoint(x, y);
      veil.style.pointerEvents = '';
      return el && el.closest ? el.closest('.gpv-page') : null;
    }
    function paint(r) {
      box.hidden = false;
      box.style.left = r.left + 'px';
      box.style.insetBlockStart = r.top + 'px';
      box.style.inlineSize = r.width + 'px';
      box.style.blockSize = r.height + 'px';
    }
    function rectOf(a, b, pg) {
      var pr = pg.getBoundingClientRect();
      var l = Math.max(pr.left, Math.min(a.x, b.x)), t = Math.max(pr.top, Math.min(a.y, b.y));
      var r = Math.min(pr.right, Math.max(a.x, b.x)), bt = Math.min(pr.bottom, Math.max(a.y, b.y));
      return { left: l, top: t, width: Math.max(0, r - l), height: Math.max(0, bt - t) };
    }
    veil.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      var pg = pageAt(e.clientX, e.clientY);
      if (!pg) return;
      e.preventDefault();
      if (cur.bar) { cur.bar.remove(); cur.bar = null; }
      st = { a: { x: e.clientX, y: e.clientY }, pg: pg, id: e.pointerId };
      try { veil.setPointerCapture(e.pointerId); } catch (e2) {}
    });
    veil.addEventListener('pointermove', function (e) {
      if (!st || e.pointerId !== st.id) return;
      paint(rectOf(st.a, { x: e.clientX, y: e.clientY }, st.pg));
    });
    function up(e) {
      if (!st || e.pointerId !== st.id) return;
      var r = rectOf(st.a, { x: e.clientX, y: e.clientY }, st.pg), pg = st.pg;
      st = null;
      if (r.width < MIN_PX || r.height < MIN_PX) { box.hidden = true; return; }
      paint(r);
      tip.hidden = true;
      veil.style.pointerEvents = 'auto';
      if (o.onPick) cur.bar = o.onPick({ page: pg, rect: r, n: Number(pg.getAttribute('data-p')) || 1, box: box });
    }
    veil.addEventListener('pointerup', up);
    veil.addEventListener('wheel', function (e) {
      var sc = o.scroller || root;
      if (sc && sc.scrollBy) { sc.scrollBy(e.deltaX, e.deltaY); e.preventDefault(); }
    }, { passive: false });
    veil.addEventListener('pointercancel', function () { st = null; box.hidden = true; });
    return { end: end };
  }

  function bar(boxEl, html, onAct) {
    var b = document.createElement('div');
    b.className = 'gps-bar';
    b.setAttribute('role', 'toolbar');
    b.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    b.innerHTML = html;
    document.body.appendChild(b);
    var r = boxEl.getBoundingClientRect(), br = b.getBoundingClientRect();
    var vh = window.innerHeight, vw = window.innerWidth;
    var top = r.bottom + 8 + br.height < vh - 8 ? r.bottom + 8 : Math.max(8, r.top - 8 - br.height);
    var left = isAr() ? r.right - br.width : r.left;
    b.style.insetBlockStart = top + 'px';
    b.style.left = Math.max(8, Math.min(left, vw - br.width - 8)) + 'px';
    b.addEventListener('click', function (e) {
      var x = e.target.closest('[data-snap]');
      if (x) onAct(x.getAttribute('data-snap'), x);
    });
    var first = b.querySelector('button');
    if (first) { try { first.focus({ preventScroll: true }); } catch (e) {} }
    return b;
  }

  window.GardenPdfSnap = { compose: compose, blob: blob, sharp: sharp, copy: copy, save: save, pick: pick, bar: bar, end: end,
                           active: function () { return !!cur; } };
})();
