/*@3.NOICJ.1*/
;(function () {
  'use strict';

  var VER = 4;
  /*@3.NOICJ.8*/
  var AZ_Q = 64, TZ_Q = 31;
  var NIBS = ['round', 'fine', 'marker', 'flat', 'pencil', 'chalk'];
  var Q = 8;
  var P_MAX = 63;
  var RDP_EPS = 0.2;

  function rdp(pts, eps) {
    if (pts.length < 3) return pts.slice();
    var keep = new Uint8Array(pts.length);
    keep[0] = 1; keep[pts.length - 1] = 1;
    var stack = [[0, pts.length - 1]];

    while (stack.length) {
      var seg = stack.pop();
      var a = seg[0], b = seg[1];
      if (b - a < 2) continue;
      var ax = pts[a].x, ay = pts[a].y;
      var bx = pts[b].x, by = pts[b].y;
      var dx = bx - ax, dy = by - ay;
      var len2 = dx * dx + dy * dy;
      var best = -1, bestD = -1;

      for (var i = a + 1; i < b; i++) {
        var px = pts[i].x - ax, py = pts[i].y - ay;
        var d;
        if (len2 === 0) {
          d = px * px + py * py;
        } else {
          var t = (px * dx + py * dy) / len2;
          t = t < 0 ? 0 : (t > 1 ? 1 : t);
          var cx = px - t * dx, cy = py - t * dy;
          d = cx * cx + cy * cy;
        }
        if (d > bestD) { bestD = d; best = i; }
      }

      if (bestD > eps * eps) {
        keep[best] = 1;
        stack.push([a, best], [best, b]);
      }
    }

    var out = [];
    for (var j = 0; j < pts.length; j++) if (keep[j]) out.push(pts[j]);
    return out;
  }

  function zig(n) { return (n << 1) ^ (n >> 31); }
  function unzig(n) { return (n >>> 1) ^ -(n & 1); }

  function Writer() { this.b = []; }
  Writer.prototype.u = function (n) {
    n = n >>> 0;
    while (n >= 0x80) { this.b.push((n & 0x7f) | 0x80); n >>>= 7; }
    this.b.push(n);
  };
  Writer.prototype.s = function (n) { this.u(zig(n | 0)); };
  Writer.prototype.raw = function (n) { this.b.push(n & 0xff); };
  Writer.prototype.bytes = function () { return new Uint8Array(this.b); };

  function Reader(u8) { this.a = u8; this.i = 0; }
  Reader.prototype.u = function () {
    var n = 0, shift = 0, byte;
    do {
      byte = this.a[this.i++];
      n |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte >= 0x80 && shift < 35);
    return n >>> 0;
  };
  Reader.prototype.s = function () { return unzig(this.u()); };
  Reader.prototype.raw = function () { return this.a[this.i++]; };
  Reader.prototype.done = function () { return this.i >= this.a.length; };

  var TOOLS = ['pen', 'hi', 'era'];

  function encodeStrokes(strokes) {
    var w = new Writer();
    /*@3.NOICJ.7*/
    /*@3.NOICJ.9*/
    var need = 2, z, hasTilt = [];
    for (z = 0; z < strokes.length; z++) {
      hasTilt[z] = tiltIn(strokes[z]);
      if (hasTilt[z]) need = 4;
      else if (need < 3 && colorIndex(strokes[z].color) === HEX_MARK) need = 3;
    }
    w.raw(need);
    w.u(strokes.length);

    for (var s = 0; s < strokes.length; s++) {
      var st = strokes[s];
      var pts = rdp(st.pts || [], RDP_EPS);
      w.raw(Math.max(0, TOOLS.indexOf(st.tool || 'pen')));
      /*@3.NOICJ.4*/
      w.raw(Math.max(0, NIBS.indexOf(st.nib || 'round')));
      /*@3.NOICJ.10*/
      if (need >= 4) w.raw(hasTilt[s] ? 1 : 0);
      w.u(Math.round((st.w || 2) * 4));
      /*@3.NOICJ.6*/
      var ci = colorIndex(st.color);
      w.u(ci);
      if (ci === HEX_MARK) {
        var hb = hexBytes(st.color);
        w.raw(hb[0]); w.raw(hb[1]); w.raw(hb[2]);
      }
      w.u(pts.length);

      var px = 0, py = 0, pa = 0, pz = 0;
      for (var i = 0; i < pts.length; i++) {
        var qx = Math.round(pts[i].x * Q);
        var qy = Math.round(pts[i].y * Q);
        w.s(qx - px);
        w.s(qy - py);
        px = qx; py = qy;
        /*@3.NOICJ.2*/
        var pr = pts[i].p == null ? 0.5 : pts[i].p;
        w.raw(Math.max(0, Math.min(P_MAX, Math.round(pr * P_MAX))));
      }
      /*@3.NOICJ.12*/
      if (hasTilt[s]) {
        for (i = 0; i < pts.length; i++) {
          var z1 = qz(pts[i].tz), a1 = qa(pts[i].az);
          var dz = z1 - pz, da = turn(a1 - pa);
          var ez = zig(dz), ea = zig(da);
          w.raw(((ez > 14 ? 15 : ez) << 4) | (ea > 14 ? 15 : ea));
          if (ez > 14) w.s(dz);
          if (ea > 14) w.s(da);
          pz = z1; pa = a1;
        }
      }
    }
    return w.bytes();
  }

  function decodeStrokes(u8) {
    var r = new Reader(u8);
    var ver = r.raw();
    /*@3.NOICJ.5*/
    if (ver < 1 || ver > VER) return [];
    var n = r.u();
    var out = [];

    for (var s = 0; s < n; s++) {
      var tool = TOOLS[r.raw()] || 'pen';
      var nib = (ver >= 2) ? (NIBS[r.raw()] || 'round') : 'round';
      /*@3.NOICJ.11*/
      var tilt = (ver >= 4) ? !!r.raw() : false;
      var width = r.u() / 4;
      var cidx = r.u();
      var color;
      if (ver >= 3 && cidx === HEX_MARK) {
        var r8 = r.raw(), g8 = r.raw(), b8 = r.raw();
        color = hexOfBytes(r8, g8, b8);
      } else {
        color = colorName(cidx);
      }
      var cnt = r.u();
      var pts = [];
      var px = 0, py = 0, pa = 0, pz = 0;

      for (var i = 0; i < cnt; i++) {
        px += r.s(); py += r.s();
        var pr = r.raw() / P_MAX;
        pts.push({ x: px / Q, y: py / Q, p: pr });
      }
      /*@3.NOICJ.13*/
      if (tilt) {
        for (i = 0; i < pts.length; i++) {
          var byt = r.raw();
          var hz = byt >> 4, ha = byt & 15;
          pz += (hz === 15) ? r.s() : unzig(hz);
          pa = ((pa + ((ha === 15) ? r.s() : unzig(ha))) % AZ_Q + AZ_Q) % AZ_Q;
          pts[i].tz = Math.max(0, Math.min(1, pz / TZ_Q));
          pts[i].az = (pa / AZ_Q) * Math.PI * 2;
        }
      }
      out.push({ tool: tool, nib: nib, w: width, color: color, pts: pts });
    }
    return out;
  }

  /*@3.NOICJ.14*/
  function qz(v) { return Math.max(0, Math.min(TZ_Q, Math.round((v || 0) * TZ_Q))); }
  function qa(v) {
    var n = Math.round(((v || 0) / (Math.PI * 2)) * AZ_Q) % AZ_Q;
    return n < 0 ? n + AZ_Q : n;
  }

  /*@3.NOICJ.15*/
  function tiltIn(st) {
    var a = (st && st.pts) || [];
    for (var i = 0; i < a.length; i++) if (a[i] && a[i].tz != null) return true;
    return false;
  }

  /*@3.NOICJ.16*/
  function turn(d) {
    var h = AZ_Q >> 1;
    while (d > h) d -= AZ_Q;
    while (d < -h) d += AZ_Q;
    return d;
  }

  var PALETTE = ['ink', 'amber', 'rose', 'violet', 'emerald', 'sky', 'lime', 'orange', 'red', 'pink', 'teal', 'indigo',
                 'yellow', 'brown', 'white', 'black'];
  var HEX_MARK = 63;
  var HEX_RE = /^#[0-9a-fA-F]{6}$/;

  function colorIndex(c) {
    var s = String(c == null ? '' : c);
    if (HEX_RE.test(s)) return HEX_MARK;
    var i = PALETTE.indexOf(s);
    return i < 0 ? 0 : i;
  }
  function colorName(i) { return PALETTE[i] || 'ink'; }

  function hexBytes(c) {
    var s = String(c).slice(1);
    return [parseInt(s.slice(0, 2), 16) & 0xff,
            parseInt(s.slice(2, 4), 16) & 0xff,
            parseInt(s.slice(4, 6), 16) & 0xff];
  }
  function hexOfBytes(a, b, c) {
    function two(n) { var h = (n & 0xff).toString(16); return h.length < 2 ? '0' + h : h; }
    return '#' + two(a) + two(b) + two(c);
  }
  function canCarry(c) {
    var s = String(c == null ? '' : c);
    return HEX_RE.test(s) || PALETTE.indexOf(s) >= 0;
  }

  function toB64(u8) {
    var s = '';
    var CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) {
      s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    }
    return btoa(s);
  }

  function fromB64(b64) {
    var s = atob(b64);
    var u8 = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    return u8;
  }

  function gzipOk() {
    return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
  }

  function gzip(u8) {
    if (!gzipOk()) return Promise.resolve(null);
    try {
      var cs = new CompressionStream('gzip');
      var w = cs.writable.getWriter();
      w.write(u8); w.close();
      return new Response(cs.readable).arrayBuffer()
        .then(function (ab) { return new Uint8Array(ab); })
        .catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  function gunzip(u8) {
    if (!gzipOk()) return Promise.resolve(null);
    try {
      var ds = new DecompressionStream('gzip');
      var w = ds.writable.getWriter();
      w.write(u8); w.close();
      return new Response(ds.readable).arrayBuffer()
        .then(function (ab) { return new Uint8Array(ab); })
        .catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  function pack(strokes) {
    var raw = encodeStrokes(strokes || []);
    /*@3.NOICJ.3*/
    return gzip(raw).then(function (z) {
      if (z && z.length < raw.length) return 'z' + toB64(z);
      return 'r' + toB64(raw);
    });
  }

  function unpack(str) {
    var s = String(str || '');
    if (!s) return Promise.resolve([]);
    var kind = s.charAt(0), body = s.slice(1);
    var u8;
    try { u8 = fromB64(body); } catch (e) { return Promise.resolve([]); }
    if (kind === 'r') return Promise.resolve(decodeStrokes(u8));
    if (kind === 'z') {
      return gunzip(u8).then(function (raw) {
        return raw ? decodeStrokes(raw) : [];
      });
    }
    return Promise.resolve([]);
  }

  function stats(strokes) {
    var pts = 0, kept = 0;
    (strokes || []).forEach(function (s) {
      pts += (s.pts || []).length;
      kept += rdp(s.pts || [], RDP_EPS).length;
    });
    return { strokes: (strokes || []).length, points: pts, afterRdp: kept };
  }

  var GONE_MAX = 3000;

  function fnv(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(36) + s.length.toString(36);
  }

  function body(e) {
    return JSON.stringify(e, function (k, v) {
      return (this === e && (k === 'eid' || k === 'mt' || k === 'id' || k.charAt(0) === '_')) ? undefined : v;
    });
  }

  function idOf(e) {
    if (e.ty === 'st' && e.ts > 0) return 's' + Math.round(e.ts).toString(36);
    if (e.ty === 'st') {
      var p = e.pts || [], a = p[0] || {}, b = p[p.length - 1] || {};
      return 'z' + fnv([e.c, e.w, e.nib, e.hi ? 1 : 0, Math.floor((a.x || 0) / 8), Math.floor((a.y || 0) / 8),
                        Math.floor((b.x || 0) / 8), Math.floor((b.y || 0) / 8)].join('|'));
    }
    return 'h' + fnv(body(e));
  }

  function rnd() { return Math.random().toString(36).slice(2, 8); }

  function ids(els) {
    var seen = {};
    (els || []).forEach(function (e) {
      if (!e) return;
      var had = !!e.eid;
      if (!had) e.eid = idOf(e);
      if (seen[e.eid]) e.eid = e.eid + '.' + (had ? rnd() : seen[e.eid]);
      seen[e.eid] = (seen[e.eid] || 0) + 1;
    });
    return els;
  }

  function goneOf(a, b) {
    var out = {}, k;
    for (k in (a || {})) if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = +a[k] || 0;
    for (k in (b || {})) if (Object.prototype.hasOwnProperty.call(b, k) && !((out[k] || 0) >= (+b[k] || 0))) out[k] = +b[k] || 0;
    return out;
  }

  function trim(g) {
    var ks = Object.keys(g);
    if (ks.length <= GONE_MAX) return g;
    ks.sort(function (x, y) { return g[y] - g[x]; });
    var out = {};
    for (var i = 0; i < GONE_MAX; i++) out[ks[i]] = g[ks[i]];
    return out;
  }

  /*@3.NOICJ.17*/
  function stamp(prev, row, now) {
    var N = ids((row && row.els) || []), pm = prev && prev.map, nm = {};
    var gone = goneOf(prev && prev.gn, row && row.gn), here = {};
    now = now || Date.now();
    if (!pm) {
      pm = {};
      ids((prev && prev.els) || []).forEach(function (e) { if (e) pm[e.eid] = { h: body(e), mt: +e.mt || 0 }; });
    }
    N.forEach(function (e) {
      if (!e) return;
      here[e.eid] = 1;
      var pv = pm[e.eid], h = body(e);
      nm[e.eid] = { h: h };
      if (pv) {
        if (pv.h !== h && !((+e.mt || 0) > pv.mt)) e.mt = now;
        else if (e.mt == null) e.mt = pv.mt;
      } else if (gone[e.eid] != null) {
        if ((+e.mt || 0) <= gone[e.eid]) e.mt = now;
      } else if (e.mt == null) e.mt = now;
      if (gone[e.eid] != null && (+e.mt || 0) > gone[e.eid]) delete gone[e.eid];
      nm[e.eid].mt = +e.mt || 0;
    });
    Object.keys(pm).forEach(function (k) { if (!here[k] && gone[k] == null) gone[k] = now; });
    gone = trim(gone);
    if (Object.keys(gone).length) row.gn = gone; else delete row.gn;
    return nm;
  }

  function fids(bs) {
    (bs || []).forEach(function (b) { if (b && !b.eid && b.id != null) b.eid = 'f' + b.id; });
    return bs || [];
  }

  /*@3.NOICJ.22*/
  function stampFd(prev, row) {
    var pb = fids(prev && prev.fdoc && prev.fdoc.blocks), nb = fids(row && row.fdoc && row.fdoc.blocks);
    if (!pb.length && !nb.length && !(prev && prev.fgn) && !(row && row.fgn)) return row;
    var r = { els: nb, gn: goneOf(prev && prev.fgn, row && row.fgn) };
    stamp({ els: pb }, r);
    if (r.gn) row.fgn = r.gn; else delete row.fgn;
    return row;
  }

  function mergeFd(lf, lg, rf, rg) {
    var L = fids(lf && lf.blocks ? lf.blocks.slice() : []), R = fids(rf && rf.blocks ? rf.blocks.slice() : []);
    var m = mergeEls(L, lg, R, rg), base = rf || lf || { v: 1, fpv: 2 }, out = {}, k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    out.blocks = m.els;
    return { fdoc: m.els.length ? out : null, fgn: m.gn, changed: m.changed, push: m.push };
  }

  function twinSt(a, b) {
    if (!a || !b || a.ty !== 'st' || b.ty !== 'st' || a.c !== b.c) return false;
    var pa = a.pts || [], pb = b.pts || [];
    if (!pa.length || !pb.length) return false;
    var x = pa[0], y = pb[0], u = pa[pa.length - 1], v = pb[pb.length - 1];
    return Math.abs(x.x - y.x) < 0.5 && Math.abs(x.y - y.y) < 0.5 && Math.abs(u.x - v.x) < 0.5 && Math.abs(u.y - v.y) < 0.5;
  }

  function keyOf(els, gn) {
    var a = (els || []).map(function (e) { return e.eid + ':' + (+e.mt || 0); }).sort();
    var g = Object.keys(gn || {}).sort().map(function (k) { return k + ':' + gn[k]; });
    return a.join(',') + '|' + g.join(',');
  }

  /*@3.NOICJ.18*/
  function mergeEls(L, Lg, R, Rg) {
    L = ids((L || []).slice()); R = ids((R || []).slice());
    var gone = goneOf(Lg, Rg), out = [], at = {}, add = 0, seenR = {}, kL = keyOf(L, goneOf(Lg));
    L.forEach(function (e) { at[e.eid] = out.length; out.push(e); });
    R.forEach(function (r) {
      seenR[r.eid] = 1;
      var i = at[r.eid];
      if (i != null) {
        if ((+r.mt || 0) > (+out[i].mt || 0)) { out[i] = r; add++; }
        return;
      }
      if (r.eid.charAt(0) === 'z') {
        for (var k = 0; k < out.length; k++) {
          var o = out[k];
          if (o.eid.charAt(0) !== 'z' || seenR[o.eid] || !twinSt(o, r)) continue;
          if (r.eid < o.eid) { delete at[o.eid]; o.eid = r.eid; at[r.eid] = k; }
          return;
        }
      }
      at[r.eid] = out.length; out.push(r); add++;
    });
    out = out.filter(function (e) { return !(gone[e.eid] != null && gone[e.eid] >= (+e.mt || 0)); });
    gone = trim(gone);
    var k1 = keyOf(out, gone);
    return { els: out, gn: gone, add: add, changed: k1 !== kL, push: k1 !== keyOf(R, goneOf(Rg)) };
  }

  /*@3.NOICJ.19*/
  var PDF = { sk: 'st', kk: 'els' }, OV = { sk: 'ink', kk: 'shapes' };

  function pageEls(d, A) {
    A = A || PDF;
    if (!d) return Promise.resolve([]);
    var un = d[A.sk] ? unpack(d[A.sk]) : Promise.resolve(d.raw || []);
    return un.then(function (strokes) {
      var out = [], i;
      for (i = 0; i < (strokes || []).length; i++) {
        var s = strokes[i];
        var e = { ty: 'st', pts: s.pts, c: s.color || 'ink', w: s.w || 2, nib: s.nib || 'round',
                  o: 1, hi: s.tool === 'hi' ? 1 : 0 };
        if (d.ts && d.ts[i] != null && d.ts[i] >= 0) e.ts = d.ts[i];
        if (d.ei && d.ei[i]) e.eid = d.ei[i];
        if (d.em && d.em[i] != null) e.mt = d.em[i];
        if (d.ta && d.ta[i]) e.ta = d.ta[i];
        out.push(e);
      }
      return out.concat(JSON.parse(JSON.stringify(d[A.kk] || [])));
    });
  }

  function splitEls(els) {
    var st = [], ts = [], ei = [], em = [], ta = [], keep = [], i;
    for (i = 0; i < (els || []).length; i++) {
      var e = els[i];
      if (!e) continue;
      if (e.ty === 'st' && e.pts && e.pts.length) {
        st.push({ tool: e.hi ? 'hi' : 'pen', color: e.c, w: e.w, nib: e.nib, pts: e.pts });
        ts.push(e.ts == null ? -1 : e.ts);
        ei.push(e.eid || '');
        em.push(+e.mt || 0);
        ta.push(e.ta || 0);
      } else keep.push(e);
    }
    return { st: st, ts: ts, ei: ei, em: em, ta: ta, keep: keep };
  }

  function pagePack(els, extra, A) {
    A = A || PDF;
    var parts = splitEls(els), page = {}, k;
    for (k in (extra || {})) if (Object.prototype.hasOwnProperty.call(extra, k)) page[k] = extra[k];
    page[A.kk] = parts.keep;
    if (parts.ts.some(function (t) { return t >= 0; })) page.ts = parts.ts;
    if (parts.ei.some(function (x) { return !!x; })) { page.ei = parts.ei; page.em = parts.em; }
    if (parts.ta.some(function (x) { return !!x; })) page.ta = parts.ta;
    if (!parts.st.length && A === PDF) return Promise.resolve(page);
    return pack(parts.st).then(function (packed) { page[A.sk] = packed; return page; });
  }

  /*@3.NOICJ.20*/
  function mergePages(lp, rp) {
    if (!lp || typeof lp !== 'object') return Promise.resolve(rp);
    if (!rp || typeof rp !== 'object') return Promise.resolve(lp);
    return Promise.all([pageEls(lp), pageEls(rp)]).then(function (two) {
      var L = ids(two[0]), R = ids(two[1]);
      var Lg = goneOf(lp.gn), Rg = goneOf(rp.gn);
      if (lp.x && !lp.gn) R.forEach(function (e) { if ((+e.mt || 0) <= (lp.t || 0)) Lg[e.eid] = lp.t || 0; });
      if (rp.x && !rp.gn) L.forEach(function (e) { if ((+e.mt || 0) <= (rp.t || 0)) Rg[e.eid] = rp.t || 0; });
      var m = mergeEls(L, Lg, R, Rg);
      var fm = mergeFd(lp.fdoc, lp.fgn, rp.fdoc, rp.fgn);
      var extra = { t: Math.max(lp.t || 0, rp.t || 0) };
      if (fm.fdoc) extra.fdoc = fm.fdoc;
      if (Object.keys(fm.fgn).length) extra.fgn = fm.fgn;
      if (Object.keys(m.gn).length) extra.gn = m.gn;
      if (!m.els.length && !extra.fdoc) extra.x = 1;
      return pagePack(m.els, extra);
    });
  }

  /*@3.NOICJ.21*/
  function mergeOv(lo, ro) {
    if (!lo || typeof lo !== 'object') return Promise.resolve(ro);
    if (!ro || typeof ro !== 'object') return Promise.resolve(lo);
    return Promise.all([pageEls(lo, OV), pageEls(ro, OV)]).then(function (two) {
      var m = mergeEls(two[0], lo.gn, two[1], ro.gn), extra = {}, k;
      for (k in ro) {
        if (!Object.prototype.hasOwnProperty.call(ro, k) || /^(ink|shapes|ts|ei|em|ta|gn|raw)$/.test(k)) continue;
        extra[k] = ro[k];
      }
      ['h', 'ch'].forEach(function (f) { if (+lo[f] > +(extra[f] || 0)) extra[f] = lo[f]; });
      if (Object.keys(m.gn).length) extra.gn = m.gn;
      return pagePack(m.els, extra, OV);
    });
  }

  window.GardenInkCodec = {
    mergeOv: mergeOv,
    mergeFd: mergeFd,
    stampFd: stampFd,
    OV: OV,
    stamp: stamp,
    mergeEls: mergeEls,
    mergePages: mergePages,
    pageEls: pageEls,
    pagePack: pagePack,
    splitEls: splitEls,
    ids: ids,
    pack: pack,
    unpack: unpack,
    encodeStrokes: encodeStrokes,
    decodeStrokes: decodeStrokes,
    rdp: rdp,
    stats: stats,
    gzipOk: gzipOk,
    PALETTE: PALETTE,
    canCarry: canCarry,
    HEX_MARK: HEX_MARK,
    NIBS: NIBS,
    VER: VER,
    VER: VER,
    RDP_EPS: RDP_EPS
  };
})();
