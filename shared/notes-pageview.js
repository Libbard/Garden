;(function (g) {
  'use strict';

  function r2(v) { return Math.round(v * 100) / 100; }

  function offs(it) {
    var o = [], s = 0, i, sc = 1, sum = 0;
    if (it.ty === 'card') { for (i = 0; i < it.kids.length; i++) { o.push(s); s += it.units[i] || 0; } return o; }
    if (!it.units) return o;
    sum = (it.lead || 0) + (it.tail || 0) + (it.botIn ? 0 : (it.bot || 0)) + (it.gap || 0);
    for (i = 0; i < it.units.length; i++) sum += it.units[i];
    sc = (it.h > 0 && sum > 0) ? it.h / sum : 1;
    s = (it.lead || 0) * sc;
    for (i = 0; i < it.units.length; i++) { o.push(s); s += it.units[i] * sc; }
    return o;
  }
  function unitAt(o, from) {
    var i;
    for (i = 0; i < o.length; i++) if (Math.abs(o[i] - from) < 0.75) return i;
    return -1;
  }

  /*@3.NOPJ11.1*/
  function spec(pr, prev) {
    if (!pr || !pr.lay || !pr.items) return null;
    var lay = pr.lay, H = lay.H, M = lay.M || 0, list = pr.items, i, j, it, sg, o, k;
    var out = { ver: (prev && prev.ver ? prev.ver : 0) + 1, H: H, M: M, Mb: lay.Mb || 0, count: lay.count, off: pr.off || 0,
                pre: {}, inner: {}, card: {}, cut: {}, S: {}, E: {}, X: {}, parts: {}, starts: [], bands: [] };
    var lastAdd = 0, first = true;
    for (i = 0; i < list.length; i++) {
      it = list[i];
      if (!it || it.id === 'paper:lead') continue;
      sg = lay.segs[it.id];
      if (!sg || !sg.length) continue;
      if (it.ty === 'card') {
        o = offs(it);
        for (k = 0; k < it.kids.length; k++) {
          var kid = it.kids[k], kx = null, jx = 0;
          /*@3.NOPJ11.2*/
          for (j = 0; j < sg.length; j++) if (sg[j].from <= o[k] + 0.75) jx = j;
          var add = sg[jx].add;
          out.S[kid.id] = add; out.E[kid.id] = add;
          out.parts[kid.id] = [{ from: 0, to: r2(it.units[k] || 0), add: add }];
          if (k === 0) { if (!first && add - lastAdd > 0.01) out.pre[kid.id] = r2(add - lastAdd); }
          else {
            for (j = 1; j < sg.length; j++) if (Math.abs(sg[j].from - o[k]) < 0.75) { kx = j; break; }
            if (kx != null) {
              out.pre[kid.id] = r2(sg[kx].add - sg[kx - 1].add);
              if (it.kids.length > 1 && it.head > 0) out.card[kid.id] = { head: r2(it.head), src: it.kids[0].id };
              out.cut[it.kids[k - 1].id] = 1;
            }
          }
        }
        lastAdd = sg[sg.length - 1].add; first = false;
        continue;
      }
      out.S[it.id] = sg[0].add; out.E[it.id] = sg[sg.length - 1].add;
      out.parts[it.id] = sg.map(function (x) { return { from: x.from, to: x.to, add: x.add }; });
      if (!first && sg[0].add - lastAdd > 0.01) out.pre[it.id] = r2(sg[0].add - lastAdd);
      if (sg.length > 1) {
        o = offs(it);
        var inn = [];
        for (j = 1; j < sg.length; j++) {
          k = unitAt(o, sg[j].from);
          if (k <= 0) continue;
          inn.push({ k: k, g: r2(sg[j].add - sg[j - 1].add), hd: it.ty === 'tbl' ? r2(it.head || 0) : 0 });
        }
        if (inn.length) { out.inner[it.id] = inn; out.X[it.id] = r2(inn.reduce(function (a, x) { return a + x.g; }, 0)); }
      }
      lastAdd = sg[sg.length - 1].add; first = false;
    }
    var p, e, ref, item, bot, pb = pageBottoms(pr);
    for (p = 1; p < lay.pages.length; p++) {
      e = null;
      for (j = 0; j < lay.pages[p].length; j++) if (lay.pages[p][j].id !== 'paper:lead') { e = lay.pages[p][j]; break; }
      var edge = p * H, st = { k: p, b: null, c: 0, pb: false, cl: 0 };
      if (e) {
        ref = pr.byId ? pr.byId[e.id] : null;
        item = ref ? ref.item : null;
        if (!item) for (j = 0; j < list.length; j++) if (list[j].id === e.id) { item = list[j]; break; }
        if (item && item.ty === 'card') {
          o = offs(item);
          for (k = item.kids.length - 1; k >= 0; k--) if (e.cut[0] >= o[k] - 0.5) break;
          k = Math.max(0, k);
          st.b = item.kids[k].id; st.c = r2(Math.max(0, e.cut[0] - o[k]));
        } else if (item) { st.b = item.id; st.c = r2(e.cut[0]); }
        if (item) {
          var ix = list.indexOf(item);
          st.pb = !!(e.cut[0] < 0.5 && ix > 0 && list[ix - 1].ty === 'pb');
          if (e.cut[0] > 0.5) st.cl = r2(item.ty === 'card' ? (item.head || 0) : (item.units ? (item.lead || 0) : 0));
        }
      }
      out.starts.push(st);
      bot = pb[p - 1];
      if (bot != null && bot < edge - 0.5) out.bands.push({ k: p, y0: r2(bot), y1: r2(edge + M) });
    }
    out.paperH = r2(lay.paperH || 0);
    out.key = keyOf(out);
    out.at = {};
    for (i = 0; i < out.starts.length; i++) { var s0 = out.starts[i]; if (s0.b) (out.at[s0.b] || (out.at[s0.b] = [])).push(s0); }
    return out;
  }

  function keyOf(sp) {
    var h = 0x811c9dc5, parts = [], id, k;
    function add(str) { var i; for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } }
    for (id in sp.S) if (Object.prototype.hasOwnProperty.call(sp.S, id)) add(id + ':' + sp.S[id] + ';');
    for (id in sp.pre) if (Object.prototype.hasOwnProperty.call(sp.pre, id)) add('p' + id + sp.pre[id]);
    for (id in sp.inner) if (Object.prototype.hasOwnProperty.call(sp.inner, id)) for (k = 0; k < sp.inner[id].length; k++) add('i' + id + sp.inner[id][k].k + ':' + sp.inner[id][k].g);
    for (id in sp.card) if (Object.prototype.hasOwnProperty.call(sp.card, id)) add('c' + id + sp.card[id].head);
    for (id in sp.cut) if (Object.prototype.hasOwnProperty.call(sp.cut, id)) add('x' + id);
    for (k = 0; k < sp.bands.length; k++) add('m' + sp.bands[k].y0 + ':' + sp.bands[k].y1);
    for (k = 0; k < sp.starts.length; k++) add('s' + sp.starts[k].b + ':' + sp.starts[k].c);
    add('n' + sp.count);
    return h.toString(16) + ':' + sp.count;
  }

  /*@3.NOPJ11.3*/
  function startOf(sp, b, c) {
    var l = sp && sp.at ? sp.at[b] : null, i;
    if (!l) return null;
    for (i = 0; i < l.length; i++) if (Math.abs(l[i].c - c) < 1.5) return l[i];
    return null;
  }

  function sgAt(sg, dy) {
    var i;
    for (i = 0; i < sg.length; i++) if (dy < sg[i].to) return sg[i].add;
    return sg[sg.length - 1].add;
  }

  function pageBottoms(pr) {
    var lay = pr.lay, out = [], p, q, e, it, ref, b, cont;
    for (p = 0; p < lay.pages.length; p++) {
      var mx = null;
      for (q = 0; q < lay.pages[p].length; q++) {
        e = lay.pages[p][q];
        if (e.id === 'paper:lead') { mx = Math.max(mx == null ? 0 : mx, e.y + (e.cut[1] - e.cut[0])); continue; }
        ref = pr.byId ? pr.byId[e.id] : null;
        it = ref ? ref.item : null;
        if (!it) { var l = pr.items, j; for (j = 0; j < l.length; j++) if (l[j].id === e.id) { it = l[j]; break; } }
        cont = 0;
        if (it && e.cut[0] > 0.5) cont = (it.ty === 'card') ? (it.head || 0) : (it.units ? (it.lead || 0) : 0);
        b = e.y + cont + (e.cut[1] - e.cut[0]);
        if (it && it.ty === 'pb') continue;
        if (mx == null || b > mx) mx = b;
      }
      out.push(mx);
    }
    return out;
  }

  function sigOf(sp, id) {
    var s = '', a = sp.inner[id], q;
    if (sp.pre[id]) s += 'p' + sp.pre[id];
    if (a) for (q = 0; q < a.length; q++) s += '|' + a[q].k + ':' + a[q].g + ':' + a[q].hd;
    if (sp.card[id]) s += 'c' + sp.card[id].head + sp.card[id].src;
    if (sp.cut[id]) s += 'x';
    return s;
  }

  /*@3.NOPJ11.4*/
  function inkShift(sp, el) {
    if (!sp || !el || !el.b || !sp.parts[el.b]) return 0;
    if (el.sm != null) {
      var st = startOf(sp, el.b, el.sm);
      if (st) return r2(shift(sp, el.b, st.c) - (sp.M || 0) - (st.cl || 0) + (st.pb ? (sp.M || 0) : 0) + (st.c - el.sm));
      return shift(sp, el.b, el.sm);
    }
    return shift(sp, el.b, el.dy);
  }

  function shift(sp, id, dy) {
    var pa = sp && sp.parts[id];
    if (!pa || !pa.length) return 0;
    return sgAt(pa, dy == null ? 0 : dy);
  }

  function extra(sp, id) {
    var a = sp && sp.inner[id], s = 0, q;
    if (a) for (q = 0; q < a.length; q++) s += a[q].g;
    return s;
  }

  var API = { spec: spec, shift: shift, extra: extra, sigOf: sigOf, offs: offs, unitAt: unitAt, startOf: startOf, inkShift: inkShift };
  g.GardenNotesPageView = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
