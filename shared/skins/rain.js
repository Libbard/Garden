;(function () {
  'use strict';
  var R = document.documentElement;
  var on = false, cv = null, ctx = null, sky = null, credit = null, amo = null, gmo = null, gtm = 0, rtm = 0, raf = 0, running = false, last = 0, acc = 0;
  var photo = null, ready = false, SHADE = null, DOT = null, rmq = null;
  var W = 0, H = 0, D = 1, HW = 0, HH = 0, LW = 0;
  var sets = [null, null], dryLeft = 0, wasClear = false;
  var beads = [], movers = [], droplets = null, dctx = null, linger = null, lctx = null, trail = null, tctx = null;
  var spawnAcc = 0, stampAcc = 0, soloT = 0, mood = 0, full = true, nd = 0, fadeT = 0, trails = [];
  var TS = 80, TX = 1, TY = 1, tiles = new Uint8Array(1);
  var st = { tasks: 0, cards: 0, home: false, user: null };
  var rnd = Math.random;

  function isEn() { return R.getAttribute('lang') === 'en'; }
  function isLight() { return R.getAttribute('data-theme') === 'light'; }
  var soft = null;
  function gpu() {
    if (soft !== null) return !soft;
    var v = null;
    try { v = sessionStorage.getItem('rain_gpu'); } catch (e) {}
    if (v === '1' || v === '0') { soft = v === '0'; return !soft; }
    var ok = true;
    try {
      var c = document.createElement('canvas'), gl = c.getContext('webgl', { failIfMajorPerformanceCaveat: true }) || null;
      if (!gl) ok = false;
      else {
        var ex = gl.getExtension('WEBGL_debug_renderer_info');
        var r = ex ? String(gl.getParameter(ex.UNMASKED_RENDERER_WEBGL) || '') : '';
        if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(r)) ok = false;
        var lo = gl.getExtension('WEBGL_lose_context');
        if (lo) lo.loseContext();
      }
    } catch (e) { ok = true; }
    soft = !ok;
    try { sessionStorage.setItem('rain_gpu', ok ? '1' : '0'); } catch (e) {}
    return ok;
  }
  function rm() { return !!(rmq && rmq.matches) || !gpu(); }
  function small() { return window.matchMedia('(max-width: 1024px)').matches; }
  function wanted() { return on && !R.hasAttribute('data-bg') && !(document.body && document.body.hasAttribute('data-notes-app')); }
  function clear() { return st.user ? st.user === 'clear' : isLight(); }
  function intensity() {
    if (clear()) return 0;
    if (!st.home) return 0.2;
    return Math.min(1, (st.tasks * 2 + st.cards) / 18);
  }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }

  function cover(c, filter) {
    var x = c.getContext('2d');
    var tall = c.height > c.width * 1.2, z = tall ? 1.45 : 1, fx = tall ? 0.32 : 0.5, fy = tall ? 0.5 : 0.62;
    var s = z * Math.max(c.width / photo.width, c.height / photo.height);
    var dw = photo.width * s, dh = photo.height * s;
    x.filter = filter || 'none';
    x.drawImage(photo, (c.width - dw) * fx, (c.height - dh) * fy, dw, dh);
    x.filter = 'none';
    return x;
  }
  function layer(sc, blur, tone) {
    var c = mk(W * sc, H * sc);
    var hasF = typeof c.getContext('2d').filter === 'string';
    var x = cover(c, (hasF && blur ? 'blur(' + (blur * D * sc).toFixed(2) + 'px) ' : '') + tone);
    if (!hasF && blur * sc > 1) {
      var k = Math.max(2, blur * sc / 1.6), s = mk(c.width / k, c.height / k);
      s.getContext('2d').drawImage(c, 0, 0, s.width, s.height);
      x.drawImage(s, 0, 0, c.width, c.height);
    }
    return [c, x];
  }
  function grade(c, x, m, kind) {
    var w = c.width, h = c.height, g;
    x.save();
    if (m === 0) {
      x.globalCompositeOperation = 'multiply';
      x.fillStyle = kind === 'sharp' ? 'rgb(205,215,240)' : 'rgb(150,170,215)';
      x.fillRect(0, 0, w, h);
    } else {
      x.globalCompositeOperation = 'screen';
      g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,150,118,.62)'); g.addColorStop(0.28, 'rgba(246,160,150,.38)');
      g.addColorStop(0.55, 'rgba(150,128,205,.16)'); g.addColorStop(0.85, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'soft-light';
      x.fillStyle = 'rgba(255,196,160,.55)'; x.fillRect(0, 0, w, h);
    }
    x.globalCompositeOperation = 'source-over';
    if (kind !== 'sharp') {
      var v = x.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.25, w / 2, h * 0.5, Math.max(w, h) * 0.78);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, m === 0 ? 'rgba(2,3,10,.6)' : 'rgba(30,14,30,.3)');
      x.fillStyle = v; x.fillRect(0, 0, w, h);
    }
    if (kind === 'fog') {
      x.globalCompositeOperation = 'screen';
      x.fillStyle = m === 0 ? 'rgba(48,64,96,.22)' : 'rgba(120,100,120,.16)'; x.fillRect(0, 0, w, h);
    }
    if (kind === 'sharp') {
      x.globalCompositeOperation = 'screen';
      x.fillStyle = m === 0 ? 'rgba(40,58,92,.5)' : 'rgba(120,90,110,.3)'; x.fillRect(0, 0, w, h);
    }
    x.restore();
  }
  function getSet(m) {
    if (sets[m]) return sets[m];
    var s = { m: m }, r;
    r = layer(0.5, 0, m === 0 ? 'saturate(1.6) brightness(1.45) contrast(1.12)' : 'saturate(1.25) brightness(1.2)');
    s.sharp = r[0]; grade(r[0], r[1], m, 'sharp');
    r = layer(0.5, 1.4, m === 0 ? 'brightness(.8) saturate(1.25)' : 'brightness(.95) saturate(1.1)');
    s.base = r[0]; grade(r[0], r[1], m, 'base');
    r = layer(0.25, 16, m === 0 ? 'brightness(.7) saturate(1.35)' : 'brightness(.9) saturate(1.1)');
    s.fog = r[0]; grade(r[0], r[1], m, 'fog');
    s.fogA = m === 0 ? 0.97 : 0.1;
    var b = mk(W, H), bx = b.getContext('2d');
    bx.imageSmoothingQuality = 'high';
    bx.drawImage(s.base, 0, 0, W, H);
    bx.globalAlpha = s.fogA; bx.drawImage(s.fog, 0, 0, W, H); bx.globalAlpha = 1;
    s.bg = b;
    sets[m] = s;
    return s;
  }

  function buildShade() {
    var n = 128, c = mk(n, n), x = c.getContext('2d'), h = n / 2, g;
    g = x.createRadialGradient(h, h * 1.05, 0, h, h, h);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.62, 'rgba(0,0,0,0)');
    g.addColorStop(0.8, 'rgba(0,0,0,.14)'); g.addColorStop(0.9, 'rgba(0,0,0,.5)');
    g.addColorStop(0.95, 'rgba(0,0,0,.32)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, n, n);
    x.save(); x.translate(h, h * 1.5); x.scale(1, 0.42);
    g = x.createRadialGradient(0, 0, 0, 0, 0, h * 0.6);
    g.addColorStop(0, 'rgba(255,255,255,.38)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, h * 0.6, 0, 7); x.fill(); x.restore();
    g = x.createRadialGradient(h * 0.74, h * 0.58, 0, h * 0.74, h * 0.58, h * 0.17);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.45, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, n, n);
    x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = n * 0.022; x.lineCap = 'round';
    x.beginPath(); x.arc(h, h, h * 0.8, Math.PI * 1.1, Math.PI * 1.42); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.2)';
    x.beginPath(); x.arc(h, h, h * 0.8, Math.PI * 0.2, Math.PI * 0.45); x.stroke();
    return c;
  }
  function buildDot() {
    var n = 32, c = mk(n, n), x = c.getContext('2d'), h = n / 2, g;
    g = x.createRadialGradient(h, h, 0, h, h, h);
    g.addColorStop(0, 'rgba(200,215,240,.28)'); g.addColorStop(0.55, 'rgba(160,180,215,.12)');
    g.addColorStop(0.78, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, n, n);
    g = x.createRadialGradient(h * 0.8, h * 0.7, 0, h * 0.8, h * 0.7, h * 0.3);
    g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, n, n);
    return c;
  }

  function lens(c, d, src, alpha) {
    var r = d.r, sc = src.width / W;
    var stretch = d.mv ? Math.min(0.6, 0.14 + d.vy * 0.14 / D) : (d.sy || 0);
    var rx = r * (1 - stretch * 0.2), ry = r * (1 + stretch), cx = d.x, cy = d.y - (ry - r) * 0.7;
    var Rr = r * 4.4;
    c.globalAlpha = alpha;
    c.save();
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); c.clip();
    c.translate(cx, cy); c.scale(-1, -1);
    c.drawImage(src, (cx - Rr) * sc, (cy - Rr * 1.25) * sc, Rr * 2 * sc, Rr * 2 * sc, -rx * 1.08, -ry * 1.08, rx * 2.16, ry * 2.16);
    c.restore();
    c.drawImage(SHADE, cx - rx * 1.1, cy - ry * 1.1, rx * 2.2, ry * 2.2);
    c.globalAlpha = 1;
  }
  function markRect(x, y, w, h) {
    if (full) return;
    var x0 = Math.max(0, Math.floor(x / TS)), y0 = Math.max(0, Math.floor(y / TS));
    var x1 = Math.min(TX - 1, Math.floor((x + w) / TS)), y1 = Math.min(TY - 1, Math.floor((y + h) / TS));
    for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) { if (!tiles[ty * TX + tx]) { tiles[ty * TX + tx] = 1; nd++; } }
  }
  function mark(x, y, r) { markRect(x - 1.5 * r - 3, y - 2.5 * r - 3, 3 * r + 6, 4 * r + 6); }
  function stamp(c, x, y, r, src, sy) {
    if (c === dctx) mark(x, y, r);
    if (r < 1.5 * D) { c.drawImage(DOT, x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4); return; }
    lens(c, { x: x, y: y, r: r, mv: false, sy: sy }, src, 0.95);
  }
  function erase(x, y, r) {
    mark(x, y, r);
    dctx.globalCompositeOperation = 'destination-out';
    dctx.beginPath(); dctx.arc(x, y, r, 0, 7); dctx.fill();
    dctx.globalCompositeOperation = 'source-over';
  }
  function rCap() { return 22 * D; }
  function slideR() { return 8 * D; }
  function addBead(x, y, r, src) {
    for (var i = 0; i < beads.length; i++) {
      var b = beads[i], dx = b.x - x, dy = b.y - y, rr = (b.r + r) * 0.72;
      if (dx * dx + dy * dy < rr * rr) {
        erase(b.x, b.y - b.r * 0.1, b.r * 1.16);
        var a1 = b.r * b.r, a2 = r * r;
        b.x = (b.x * a1 + x * a2) / (a1 + a2); b.y = (b.y * a1 + y * a2) / (a1 + a2);
        b.r = Math.min(rCap(), Math.sqrt(a1 + a2)); b.sy = 0.05 + rnd() * 0.12;
        stamp(dctx, b.x, b.y, b.r, src, b.sy);
        return;
      }
    }
    var nb = { x: x, y: y, r: r, sy: rnd() * 0.14 };
    beads.push(nb); stamp(dctx, x, y, r, src, nb.sy);
  }
  function rainR() { var u = rnd(); return (u < 0.62 ? 1.5 + 2.4 * rnd() : 3 + 8.5 * Math.pow(rnd(), 1.5)) * D; }
  function spawnMover(x, y, r) { var tb = { b: [x, y, x, y], t: 0 }; trails.push(tb); movers.push({ x: x, y: y, r: r, mv: true, vy: 0.25 * D, drift: (rnd() - 0.5) * 0.2 * D, ty: y, tb: tb }); }
  function areaK() { return (W * H) / (1440 * 900 * D * D) * (small() ? 0.75 : 1); }

  function step(dt, set) {
    var I = intensity(), k = areaK(), i, j, b, d;
    spawnAcc += (I > 0 ? 6 + 70 * I : 0) * dt / 60 * k;
    while (spawnAcc >= 1) { spawnAcc--; addBead(rnd() * W, rnd() * H, rainR(), set.sharp); }
    stampAcc += 300 * I * dt / 60 * k;
    while (stampAcc >= 1) { stampAcc--; stamp(dctx, rnd() * W, rnd() * H, (0.5 + 1.1 * rnd()) * D, set.sharp); }
    var cl = clear();
    if (cl && !wasClear) dryLeft = 160;
    wasClear = cl;
    if (cl) {
      if (beads.length) { beads.length = 0; }
      if (dryLeft > 0) {
        dryLeft -= dt; full = true;
        if (dryLeft <= 0) dctx.clearRect(0, 0, W, H);
        else { dctx.globalCompositeOperation = 'destination-out'; dctx.fillStyle = 'rgba(0,0,0,' + (0.03 * dt) + ')'; dctx.fillRect(0, 0, W, H); dctx.globalCompositeOperation = 'source-over'; }
      }
      soloT += dt;
      if (soloT > 260 && movers.length < 2) { soloT = 0; spawnMover(rnd() * W, rnd() * H * 0.3, (7.5 + rnd() * 3) * D); }
    }
    var sR = slideR();
    for (i = beads.length - 1; i >= 0; i--) {
      b = beads[i];
      if (b.r > sR && rnd() < (0.0012 + (b.r - sR) / D * 0.0012) * dt) {
        beads.splice(i, 1); erase(b.x, b.y - b.r * 0.1, b.r * 1.18); spawnMover(b.x, b.y, b.r);
      }
    }
    for (i = 0; i < movers.length; i++) mark(movers[i].x, movers[i].y, movers[i].r);
    for (i = movers.length - 1; i >= 0; i--) {
      d = movers[i];
      var vmax = (1.2 + (d.r / D - 6) * 0.34) * D;
      d.vy = Math.min(vmax, d.vy + 0.03 * (d.r / (9 * D)) * dt * D);
      if (rnd() < 0.012 * dt) d.vy *= 0.25;
      if (rnd() < 0.03 * dt) d.drift = (rnd() - 0.5) * 0.5 * D;
      d.y += d.vy * dt; d.x += d.drift * dt * (d.vy / vmax) + (rnd() - 0.5) * 0.25 * D * dt;
      erase(d.x, d.y, d.r * 1.08);
      var ex0 = d.x / 2, ey0 = (d.y - d.r * 0.3) / 2, erx = d.r * 0.37, ery = d.r * 0.55;
      tctx.save(); tctx.beginPath(); tctx.ellipse(ex0, ey0, erx, ery, 0, 0, 7); tctx.clip();
      tctx.globalAlpha = 0.9;
      var bx = Math.max(0, Math.floor(ex0 - erx - 1)), by = Math.max(0, Math.floor(ey0 - ery - 1)), bw = Math.min(HW - bx, Math.ceil(erx * 2 + 2)), bh = Math.min(HH - by, Math.ceil(ery * 2 + 2));
      if (bw > 0 && bh > 0) tctx.drawImage(set.base, bx, by, bw, bh, bx, by, bw, bh);
      tctx.restore();
      if (d.tb) { var q = d.tb.b; q[0] = Math.min(q[0], d.x - d.r); q[1] = Math.min(q[1], d.y - d.r * 1.5); q[2] = Math.max(q[2], d.x + d.r); q[3] = Math.max(q[3], d.y + d.r); d.tb.t = 0; }
      for (j = beads.length - 1; j >= 0; j--) {
        b = beads[j];
        var dx = b.x - d.x, dy = b.y - d.y, rr = d.r * 1.05 + b.r * 0.7;
        if (dx > -rr && dx < rr && dy > -rr && dy < rr && dx * dx + dy * dy < rr * rr) {
          erase(b.x, b.y - b.r * 0.1, b.r * 1.18);
          d.r = Math.min(rCap(), Math.sqrt(d.r * d.r + b.r * b.r * 0.85)); d.vy += 0.25 * D * (b.r / d.r);
          beads.splice(j, 1);
        }
      }
      for (j = movers.length - 1; j >= 0; j--) {
        b = movers[j]; if (b === d) continue;
        var ex = b.x - d.x, ey = b.y - d.y, er = (d.r + b.r) * 0.8;
        if (ex * ex + ey * ey < er * er) { d.r = Math.min(rCap(), Math.sqrt(d.r * d.r + b.r * b.r)); movers.splice(j, 1); if (j < i) i--; }
      }
      if (d.y - d.ty > d.r * 0.8) {
        var tr = d.r * (0.14 + rnd() * 0.26), tx = d.x + (rnd() - 0.5) * d.r * 0.5;
        if (tr > 1.5 * D && rnd() < 0.35) addBead(tx, d.ty, tr * 1.15, set.sharp); else stamp(dctx, tx, d.ty, Math.max(0.6 * D, tr), set.sharp);
        d.ty = d.y; d.r *= 0.987;
      }
      if (d.r < sR * 0.5) { movers.splice(i, 1); addBead(d.x, d.y, d.r, set.sharp); continue; }
      if (d.y - d.r * 2 > H) movers.splice(i, 1);
    }
    fadeT += dt;
    if (fadeT >= 8) {
      tctx.globalCompositeOperation = 'destination-out';
      tctx.fillStyle = 'rgba(0,0,0,' + (0.004 * fadeT) + ')'; tctx.fillRect(0, 0, HW, HH);
      tctx.globalCompositeOperation = 'source-over';
      for (i = trails.length - 1; i >= 0; i--) {
        var tr0 = trails[i];
        tr0.t += fadeT;
        if (tr0.t > 300) { trails.splice(i, 1); continue; }
        if (mood < 1) markRect(tr0.b[0] - 4, tr0.b[1] - 4, tr0.b[2] - tr0.b[0] + 8, tr0.b[3] - tr0.b[1] + 8);
      }
      fadeT = 0;
    }
  }

  function ensureLinger() {
    if (linger) return;
    linger = mk(W, H); lctx = linger.getContext('2d');
    var s1 = getSet(1), area = (W * H) / (D * D), i, k, t;
    for (i = 0; i < area / 1500; i++) stamp(lctx, rnd() * W, rnd() * H, (0.5 + rnd()) * D, s1.sharp);
    for (i = 0; i < area / 16000; i++) stamp(lctx, rnd() * W, rnd() * H, (2 + 6.5 * Math.pow(rnd(), 1.5)) * D, s1.sharp, rnd() * 0.15);
    for (k = 0; k < 6; k++) {
      var x = rnd() * W, y0 = rnd() * H * 0.35, len = H * (0.3 + rnd() * 0.5);
      for (t = 0; t < len; t += 14 * D) stamp(lctx, x + Math.sin(t / (60 * D)) * 6 * D, y0 + t, (0.7 + rnd() * 1.4) * D, s1.sharp);
    }
  }

  function render() {
    var s0 = mood < 1 ? getSet(0) : null, s1 = mood > 0 ? getSet(1) : null, cur = mood < 0.5 ? (s0 || s1) : (s1 || s0);
    var fogA = 0.97 - 0.87 * mood, list = [], i, tx, ty, a;
    if (!full && !nd) return;
    if (full) list.push(0, 0, W, H);
    else {
      for (ty = 0; ty < TY; ty++) {
        a = -1;
        for (tx = 0; tx <= TX; tx++) {
          var on1 = tx < TX && tiles[ty * TX + tx];
          if (on1 && a < 0) a = tx;
          else if (!on1 && a >= 0) { list.push(a * TS, ty * TS, Math.min(W, tx * TS) - a * TS, Math.min(H, (ty + 1) * TS) - ty * TS); a = -1; }
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    for (i = 0; i < list.length; i += 4) {
      var x = list[i], y = list[i + 1], w = list[i + 2], h = list[i + 3];
      var hx = x >> 1, hy = y >> 1, hw = Math.min(HW - hx, (w + 1) >> 1), hh = Math.min(HH - hy, (h + 1) >> 1);
      if (w <= 0 || h <= 0) continue;
      ctx.globalAlpha = 1;
      if (s0) ctx.drawImage(s0.bg, x, y, w, h, x, y, w, h);
      if (s1) { ctx.globalAlpha = mood; ctx.drawImage(s1.bg, x, y, w, h, x, y, w, h); ctx.globalAlpha = 1; }
      if (fogA > 0.2 && hw > 0 && hh > 0) {
        ctx.globalAlpha = fogA; ctx.drawImage(trail, hx, hy, hw, hh, hx * 2, hy * 2, hw * 2, hh * 2);
      }
      ctx.globalAlpha = 1; ctx.drawImage(droplets, x, y, w, h, x, y, w, h);
      if (mood > 0 && linger) { ctx.globalAlpha = mood; ctx.drawImage(linger, x, y, w, h, x, y, w, h); ctx.globalAlpha = 1; }
    }
    for (i = 0; i < movers.length; i++) lens(ctx, movers[i], cur.sharp, 1);
    full = false; nd = 0; tiles.fill(0);
  }

  function populate() {
    var set = getSet(mood < 0.5 ? 0 : 1), area = (W * H) / (D * D), i, warm;
    full = true; nd = 0; trails = [];
    beads = []; movers = []; wasClear = clear(); dryLeft = 0;
    dctx.clearRect(0, 0, W, H); tctx.clearRect(0, 0, HW, HH);
    if (mood > 0 || isLight()) ensureLinger();
    if (clear()) return;
    var k = small() ? 0.75 : 1;
    for (i = 0; i < area / 260 * k; i++) stamp(dctx, rnd() * W, rnd() * H, (0.45 + 1.05 * Math.pow(rnd(), 1.4)) * D, set.sharp);
    for (i = 0; i < area / 900 * k; i++) addBead(rnd() * W, rnd() * H, rainR() * (rnd() < 0.5 ? 0.75 : 1), set.sharp);
    warm = rm() ? 320 : 220;
    for (i = 0; i < warm; i++) step(1, set);
  }

  function resize() {
    if (!cv || !photo) return;
    D = Math.min(small() ? 1.25 : 1.5, window.devicePixelRatio || 1);
    W = Math.round(innerWidth * D); H = Math.round(innerHeight * D);
    HW = Math.max(1, W >> 1); HH = Math.max(1, H >> 1); LW = innerWidth;
    cv.width = W; cv.height = H;
    TX = Math.ceil(W / TS); TY = Math.ceil(H / TS); tiles = new Uint8Array(TX * TY);
    sets = [null, null]; linger = null;
    droplets = mk(W, H); dctx = droplets.getContext('2d');
    trail = mk(HW, HH); tctx = trail.getContext('2d');
    mood = isLight() ? 1 : 0;
    populate(); full = true; render();
  }

  function frame(t) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    var gap = t - (last || t - 16.7);
    var fps = 30;
    acc += gap; last = t;
    if (acc < 1000 / fps - 2) return;
    var dt = Math.min(3, Math.max(0.25, acc / 16.7)); acc = 0;
    var target = isLight() ? 1 : 0;
    if (mood !== target) {
      if (target === 1) ensureLinger();
      mood += (target > mood ? 1 : -1) * Math.min(Math.abs(target - mood), 0.02 * dt);
      if (Math.abs(mood - target) < 0.002) { mood = target; if (target === 1) sets[0] = null; else sets[1] = null; }
      full = true;
    }
    step(dt, getSet(mood < 0.5 ? 0 : 1));
    render();
  }
  function start() {
    if (running || !ready || !wanted() || rm() || document.hidden) return;
    running = true; last = 0; acc = 0; raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  function sync() {
    if (!on) return;
    var want = wanted();
    if (cv) cv.classList.toggle('rn-on', want && ready);
    if (!want) { stop(); return; }
    if (!cv) build();
    else if (ready) {
      if (rm()) { mood = isLight() ? 1 : 0; populate(); render(); }
      else start();
    }
    paintSky();
  }

  function build() {
    cv = document.createElement('canvas');
    cv.className = 'rn-glass';
    cv.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(cv, document.body.firstChild);
    ctx = cv.getContext('2d', { alpha: false });
    var l = document.querySelector('link[data-garden-skin="skins/rain"]');
    var href = l ? l.href : (location.href);
    var u;
    try { u = new URL('img/rain/Lfh0wUAJXpA' + (small() ? '-m' : '') + '.webp', l ? href : new URL('shared/skins/', href)).href; } catch (e) { u = ''; }
    if (!u) return;
    photo = new Image();
    photo.decoding = 'async';
    photo.onload = function () {
      if (!on || !cv) return;
      SHADE = buildShade(); DOT = buildDot();
      ready = true;
      resize();
      cv.classList.toggle('rn-on', wanted());
      start();
    };
    photo.src = u;
  }

  function onResize() {
    clearTimeout(rtm);
    rtm = setTimeout(function () {
      if (!ready || !cv) return;
      if (Math.abs(innerWidth - LW) > 2 || Math.abs(innerHeight * D - H) > 120 * D) { var was = running; stop(); resize(); if (was || !rm()) start(); }
    }, 180);
  }
  function onVis() { if (document.hidden) stop(); else start(); }
  function onRm() { stop(); sync(); }

  function txt(n) { return n ? (n.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function read() {
    var tw = document.querySelector('.widget[data-widget="tasks"]'), dw = document.querySelector('.widget[data-widget="due"]');
    var t = 0, c = 0;
    if (tw) {
      t = tw.querySelectorAll('.widget-list > .widget-item').length;
      var more = txt(tw.querySelector('.dash-today-cnt')).replace(/[٠-٩]/g, function (x) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(x); }).match(/(\d+)/);
      if (more) t += +more[1];
    }
    if (dw) {
      var b = txt(dw.querySelector('.dash-due-count b')).replace(/[٠-٩]/g, function (x) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(x); });
      if (/^\d+$/.test(b)) c = +b;
    }
    st.tasks = t; st.cards = c;
  }
  function wTasks(n, en) {
    if (en) return n === 1 ? '1 task' : n + ' tasks';
    return n === 1 ? 'مهمّةٌ واحدة' : n === 2 ? 'مهمّتان' : n <= 10 ? n + ' مهامّ' : n + ' مهمّة';
  }
  function wCards(n, en) {
    if (en) return n === 1 ? '1 due card' : n + ' due cards';
    return n === 1 ? 'بطاقةٌ واحدةٌ مستحقّة' : n === 2 ? 'بطاقتان مستحقّتان' : n <= 10 ? n + ' بطاقاتٍ مستحقّة' : n + ' بطاقةً مستحقّة';
  }
  function owed(en) {
    var p = [];
    if (st.tasks) p.push(wTasks(st.tasks, en));
    if (st.cards) p.push(wCards(st.cards, en));
    return p.join(en ? ' and ' : ' و');
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function paintSky() {
    if (!sky) return;
    read();
    var en = isEn(), I = intensity(), cl = clear(), o = owed(en);
    var lvl = cl ? 0 : I >= 0.85 ? 5 : I >= 0.6 ? 4 : I >= 0.35 ? 3 : I > 0.1 ? 2 : I > 0 ? 1 : 0;
    var gs = sky.querySelectorAll('.rn-gauge i');
    for (var i = 0; i < gs.length; i++) gs[i].classList.toggle('on', i < lvl);
    var t, s, b;
    if (cl) {
      t = en ? 'The sky has cleared' : 'صفا الجوّ';
      s = o ? (en ? 'The glass is clear for now. Still due: ' : 'الزجاجُ صافٍ الآن، وما زال عليك ') + '<em>' + esc(o) + '</em>.' : (en ? 'Nothing is due right now. A few drops linger on the glass.' : 'لا شيءَ مستحقٌّ الآن. بقيت قطراتٌ قليلةٌ على الزجاج.');
      b = en ? 'Bring back the rain' : 'أعِد المطر';
    } else if (o) {
      t = lvl >= 4 ? (en ? 'Pouring on your glass' : 'تمطر بغزارة على زجاجك') : lvl >= 2 ? (en ? 'Rain on your glass' : 'تمطر على زجاجك') : (en ? 'A light drizzle' : 'رذاذٌ خفيف');
      s = (en ? 'The rain is what you owe: ' : 'المطرُ هنا هو ما عليك: ') + '<em>' + esc(o) + '</em>' + (en ? '. Finish them and the glass clears.' : '. أنجِزها ويصفو الزجاج.');
      b = en ? 'Show me clear skies' : 'أرِني الصفاء';
    } else {
      t = en ? 'The rain has stopped' : 'توقّف المطر';
      s = en ? 'Nothing is due right now. The last drops are sliding off the glass.' : 'لا شيءَ مستحقٌّ الآن. آخرُ القطرات تنزلق عن الزجاج.';
      b = en ? 'Show me clear skies' : 'أرِني الصفاء';
    }
    sky.classList.toggle('is-clear', cl);
    if (credit) { var cs = credit.querySelector('span'); cs.textContent = cs.getAttribute(en ? 'data-en' : 'data-ar'); }
    sky.querySelector('.rn-sky-h').textContent = t;
    sky.querySelector('.rn-sky-s').innerHTML = s;
    var btn = sky.querySelector('.rn-sky-b');
    btn.setAttribute('aria-pressed', cl ? 'true' : 'false');
    btn.querySelector('i').className = cl ? 'fa-solid fa-droplet' : 'fa-solid fa-sun';
    btn.querySelector('span').textContent = b;
  }
  function onSky() {
    st.user = clear() ? 'rain' : 'clear';
    if (st.user === (isLight() ? 'clear' : 'rain')) st.user = null;
    try { if (st.user) sessionStorage.setItem('rain_sky', st.user); else sessionStorage.removeItem('rain_sky'); } catch (e) {}
    if (ready && rm()) { populate(); render(); }
    if (ready && !clear() && !beads.length && !rm()) { var set = getSet(mood < 0.5 ? 0 : 1); for (var i = 0; i < 24; i++) addBead(rnd() * W, rnd() * H, rainR(), set.sharp); }
    paintSky();
  }
  function mountSky() {
    var host = document.querySelector('[data-view="overview"] > div');
    if (!host || sky) return;
    st.home = true;
    sky = document.createElement('div');
    sky.className = 'rn-sky';
    sky.innerHTML = '<span class="rn-gauge" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>' +
      '<span class="rn-sky-t"><b class="rn-sky-h"></b><small class="rn-sky-s"></small></span>' +
      '<button type="button" class="rn-sky-b" aria-pressed="false"><i class="fa-solid fa-sun" aria-hidden="true"></i><span></span></button>';
    var after = document.getElementById('dash-exam-slot');
    if (after && after.parentNode === host) host.insertBefore(sky, after.nextSibling); else host.appendChild(sky);
    sky.querySelector('.rn-sky-b').addEventListener('click', onSky);
    credit = document.createElement('p');
    credit.className = 'rn-credit';
    credit.innerHTML = '<span data-ar="تصوير:" data-en="Photo:"></span> <a href="https://unsplash.com/@peemaglama?utm_source=digital_garden&amp;utm_medium=referral" target="_blank" rel="noopener">Pema G. Lama</a> · <a href="https://unsplash.com/?utm_source=digital_garden&amp;utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>';
    host.appendChild(credit);
    var g = document.getElementById('widgets-grid');
    if (g && window.MutationObserver) {
      gmo = new MutationObserver(function () { clearTimeout(gtm); gtm = setTimeout(paintSky, 250); });
      gmo.observe(g, { childList: true, subtree: true });
    }
    paintSky();
  }

  function mount() {
    if (on) return;
    on = true;
    try { var u = sessionStorage.getItem('rain_sky'); st.user = u === 'clear' || u === 'rain' ? u : null; } catch (e) { st.user = null; }
    rmq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (rmq && rmq.addEventListener) rmq.addEventListener('change', onRm);
    mountSky();
    if (wanted()) build();
    if (window.MutationObserver) {
      amo = new MutationObserver(sync);
      amo.observe(R, { attributes: true, attributeFilter: ['data-theme', 'data-bg', 'data-mod-theme'] });
    }
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', start);
    document.addEventListener('garden:languageChanged', paintSky);
  }
  function unmount() {
    if (!on) return;
    on = false;
    stop();
    clearTimeout(rtm); clearTimeout(gtm);
    if (amo) amo.disconnect(); amo = null;
    if (gmo) gmo.disconnect(); gmo = null;
    if (rmq && rmq.removeEventListener) rmq.removeEventListener('change', onRm);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('pagehide', stop);
    window.removeEventListener('pageshow', start);
    document.removeEventListener('garden:languageChanged', paintSky);
    if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
    if (sky && sky.parentNode) sky.parentNode.removeChild(sky);
    if (credit && credit.parentNode) credit.parentNode.removeChild(credit);
    if (photo) photo.onload = null;
    cv = ctx = sky = credit = photo = null;
    ready = false; st.home = false;
    sets = [null, null]; beads = []; movers = [];
    droplets = dctx = linger = lctx = trail = tctx = null;
  }
  window.GardenSkins = window.GardenSkins || {};
  window.GardenSkins.rain = { mount: mount, unmount: unmount };
})();
