(function () {
  'use strict';
  if (window.GardenMenu) return;

  var PRESS_MS = 480, PRESS_SLOP = 10;
  var cur = null;

  function isAr() { return (document.documentElement.getAttribute('lang') || 'ar').indexOf('ar') === 0; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function item(act, icon, label, o) {
    o = o || {};
    return '<button type="button" role="menuitem" class="gsf-menu-i' + (o.danger ? ' gsf-menu-i--danger' : '') +
      (o.cls ? ' ' + o.cls : '') + '" ' + (o.attr || 'data-act') + '="' + esc(act) + '"' + (o.off ? ' disabled' : '') + '>' +
      '<i class="fa-solid ' + esc(icon) + '" aria-hidden="true"></i><span>' + esc(label) + '</span></button>';
  }
  function sep() { return '<div class="gsf-menu-sep" role="separator"></div>'; }
  function head(label) { return '<div class="gsf-menu-h">' + esc(label) + '</div>'; }

  function buttons() {
    return cur ? Array.prototype.filter.call(cur.el.querySelectorAll('[role="menuitem"]'), function (b) { return !b.disabled; }) : [];
  }

  function close(keepFocus) {
    if (!cur) return;
    var c = cur;
    cur = null;
    c.el.remove();
    document.removeEventListener('pointerdown', away, true);
    document.removeEventListener('keydown', key, true);
    window.removeEventListener('resize', onResize);
    if (!keepFocus && c.ret && c.ret.isConnected && c.ret.focus) {
      try { c.ret.focus({ preventScroll: true }); } catch (e) {}
    }
    if (c.onClose) { try { c.onClose(); } catch (e) {} }
  }

  function away(e) {
    if (!cur) return;
    if (cur.el.contains(e.target)) return;
    close(true);
  }
  function onResize() { close(true); }

  function key(e) {
    if (!cur) return;
    var bs = buttons(), i = bs.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') { close(true); return; }
    /*@3.MENJ.1*/
    if (cur.ownKeys) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!bs.length) return;
      var n = e.key === 'ArrowDown' ? (i + 1) % bs.length : (i <= 0 ? bs.length - 1 : i - 1);
      bs[n].focus();
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      if (bs.length) bs[e.key === 'Home' ? 0 : bs.length - 1].focus();
    }
  }

  function open(x, y, html, onAct, o) {
    o = o || {};
    var ret = document.activeElement;
    close(true);
    var el = document.createElement('div');
    el.className = 'gsf-menu' + (o.cls ? ' ' + o.cls : '');
    if (o.id) el.id = o.id;
    el.setAttribute('role', 'menu');
    el.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    if (o.label) el.setAttribute('aria-label', o.label);
    el.innerHTML = html;
    el.style.insetBlockStart = '0px';
    el.style.left = '0px';
    var within = o.within || (ret && ret.closest ? ret.closest('dialog[open]') : null);
    var host = within && within.tagName === 'DIALOG' ? within : document.body;
    host.appendChild(el);

    var probe = el.getBoundingClientRect();
    var ox = probe.left, oy = probe.top;
    var r = el.getBoundingClientRect();
    var pad = 8;
    var vw = window.innerWidth || document.documentElement.clientWidth;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var box = { l: pad, t: pad, r: vw - pad, b: vh - pad };
    if (host !== document.body) {
      var hr = host.getBoundingClientRect();
      box = { l: Math.max(pad, hr.left + 4), t: Math.max(pad, hr.top + 4), r: Math.min(vw - pad, hr.right - 4), b: Math.min(vh - pad, hr.bottom - 4) };
    }
    var px = o.anchorEnd && isAr() ? x - r.width : x;
    var lx = Math.max(box.l, Math.min(px, box.r - r.width));
    var ty = Math.max(box.t, Math.min(y, box.b - r.height));
    el.style.left = (lx - ox) + 'px';
    el.style.insetBlockStart = (ty - oy) + 'px';
    if (r.height > box.b - box.t) {
      el.style.maxBlockSize = (box.b - box.t) + 'px';
      el.style.overflowY = 'auto';
    }

    var attr = o.attr || 'data-act';
    el.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[' + attr + ']') : null;
      if (!b || b.disabled || !el.contains(b)) return;
      var act = b.getAttribute(attr);
      close(!!o.keepFocus);
      if (onAct) onAct(act, b);
    });

    cur = { el: el, ret: ret, onClose: o.onClose || null, ownKeys: o.keys === false };
    setTimeout(function () {
      if (!cur || cur.el !== el) return;
      document.addEventListener('pointerdown', away, true);
      document.addEventListener('keydown', key, true);
      window.addEventListener('resize', onResize);
    }, 0);
    if (o.focus !== false) {
      var first = buttons()[0];
      if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
    }
    return el;
  }

  function sheetMode(o) {
    if (o && o.sheet != null) return !!o.sheet;
    try { return window.matchMedia('(max-width: 640px), (pointer: coarse) and (max-width: 900px)').matches; } catch (e) { return false; }
  }
  function ricon(m) {
    return m.i ? '<i class="' + (m.brand ? 'fa-brands ' : 'fa-solid ') + esc(m.i) + '" aria-hidden="true"></i>' : '<i aria-hidden="true"></i>';
  }
  function rpanel(model, path, sheet, attr, back, cx) {
    var h = '';
    if (path && back) {
      h += '<div class="gsf-rm-back"><button type="button" class="gsf-rm-bk" data-rm-back="1" aria-label="' + esc(isAr() ? 'رجوع' : 'Back') + '">' +
        '<i class="fa-solid ' + (isAr() ? 'fa-chevron-right' : 'fa-chevron-left') + '" aria-hidden="true"></i></button><b>' + esc(model.t) + '</b></div>';
    } else if (!path && model.head) {
      var hd = model.head;
      h += '<div class="gsf-rm-h"' + (hd.tone ? ' style="--rm-tone:' + esc(hd.tone) + '"' : '') + '><span class="gsf-rm-hi">' + ricon({ i: hd.ico }) + '</span>' +
        '<span class="gsf-rm-ht"><b dir="auto">' + esc(hd.t) + '</b>' + (hd.s ? '<small dir="auto">' + esc(hd.s) + '</small>' : '') + '</span></div>';
    }
    if (!path && model.quick && model.quick.length) {
      h += '<div class="gsf-rm-q" style="--rm-n:' + model.quick.length + '">';
      model.quick.forEach(function (q) {
        h += '<button type="button" role="menuitem" class="gsf-rm-qb" ' + attr + '="' + esc(q.a) + '"' + (q.off ? ' disabled' : '') +
          (q.why ? ' title="' + esc(q.why) + '"' : '') + '>' + ricon(q) + '<span>' + esc(q.t) + '</span></button>';
      });
      h += '</div>';
    }
    (path ? model.sub : model.items || []).forEach(function (m, k) { h += rrow(m, k, path, sheet, attr, cx); });
    return h;
  }
  /*@3.MENJ.3*/
  function rrow(m, k, path, sheet, attr, cx) {
    cx = cx || {};
    if (!m) return '';
    if (m.sep) return '<div class="gsf-menu-sep" role="separator"></div>';
    if (m.raw) return m.raw;
    if (m.h) return '<div class="gsf-menu-h gsf-rm-sec' + (cx.hcls ? ' ' + cx.hcls : '') + '">' + esc(m.h) +
      (m.q ? ' — <span class="gsf-rm-hq" dir="' + (m.qdir || 'auto') + '">' + esc(m.q) + '</span>' : '') + '</div>';
    var tail = m.sub ? '<span class="gsf-rm-ar"><i class="fa-solid ' + (isAr() ? 'fa-chevron-left' : 'fa-chevron-right') + '" aria-hidden="true"></i></span>'
      : m.ok ? '<span class="gsf-rm-kb gsf-rm-ok"><i class="fa-solid fa-check" aria-hidden="true"></i></span>'
      : (m.kb && !sheet) ? '<span class="gsf-rm-kb">' + esc(m.kb) + '</span>' : '';
    return '<button type="button" role="menuitem" class="gsf-menu-i gsf-rm-i' + (m.dz ? ' gsf-menu-i--danger' : '') + (m.eg ? ' gsf-rm-i--eg' : '') +
      (cx.icls ? ' ' + cx.icls : '') + (m.cls ? ' ' + m.cls : '') + '" ' +
      (m.sub ? 'data-rm-sub="' + (path ? path + '.' : '') + k + '" aria-haspopup="menu"' : attr + '="' + esc(m.a) + '"') +
      (m.off ? ' disabled' : '') + (m.why ? ' title="' + esc(m.why) + '"' : '') + '>' + ricon(m) +
      '<span>' + esc(m.t) + (m.eg ? '<em class="gsf-rm-eg">' + esc(m.eg) + '</em>' : '') + '</span>' + tail + '</button>';
  }
  var MARKS = /[\u064B-\u0652\u0670\u0640]/g;
  function fold(t) {
    return String(t || '').toLowerCase().replace(MARKS, '')
      .replace(/[\u0622\u0623\u0625]/g, '\u0627').replace(/\u0649/g, '\u064A').replace(/\u0629/g, '\u0647');
  }
  function leaves(model) {
    var out = [], seen = {};
    function walk(list, trail) {
      (list || []).forEach(function (m) {
        if (!m || m.sep || m.h || m.raw) return;
        if (m.sub) { walk(m.sub, m.t); return; }
        if (m.a == null || seen[m.a]) return;
        seen[m.a] = 1;
        out.push({ m: m, trail: trail });
      });
    }
    walk(model.quick, '');
    walk(model.items, '');
    return out;
  }
  function rnode(model, path) {
    var n = model;
    String(path || '').split('.').forEach(function (k) { if (k !== '') n = (n.items || n.sub || [])[+k] || n; });
    return n;
  }
  /*@3.MENJ.2*/
  function rich(x, y, model, onAct, o) {
    o = o || {};
    var attr = o.attr || 'data-act', sheet = sheetMode(o), cx = { icls: o.icls || '', hcls: o.hcls || '' };
    var el = open(x, y, sheet ? '<div class="gsf-rm-sheet"><div class="gsf-rm-grip" aria-hidden="true"></div><div class="gsf-rm-track"><div class="gsf-rm-p">' + rpanel(model, '', true, attr, false, cx) + '</div></div></div>'
      : rpanel(model, '', false, attr, false, cx), onAct, { cls: 'gsf-rmenu' + (sheet ? ' gsf-rmenu--sheet' : '') + (o.cls ? ' ' + o.cls : ''), id: o.id, attr: attr,
        label: o.label || (model.head && model.head.t) || '', within: o.within, keys: false, onClose: o.onClose, anchorEnd: o.anchorEnd, focus: o.focus, keepFocus: o.keepFocus });
    if (!el) return el;
    var subs = [];
    function shut(from) { while (subs.length > from) { var s = subs.pop(); s.el.remove(); if (s.btn) s.btn.removeAttribute('data-open'); } }
    function panelOf(b) { return b.closest('.gsf-rm-sub, .gsf-rm-p') || el; }
    function focusFirst(p) { var f = p.querySelector('[role^="menuitem"]:not(:disabled)'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } }
    function openSub(b, kb) {
      var path = b.getAttribute('data-rm-sub'), node = rnode(model, path);
      if (sheet) {
        var tr = el.querySelector('.gsf-rm-track'), p = document.createElement('div');
        p.className = 'gsf-rm-p';
        p.innerHTML = rpanel(node, path, true, attr, true, cx);
        tr.appendChild(p);
        var depth = tr.children.length - 1;
        tr.style.transform = 'translateX(' + (isAr() ? depth * 100 : -depth * 100) + '%)';
        focusFirst(p);
        return;
      }
      var lvl = (b.closest('.gsf-rm-sub') ? +b.closest('.gsf-rm-sub').getAttribute('data-lvl') + 1 : 1);
      if (subs[lvl - 1] && subs[lvl - 1].btn === b) { if (kb) focusFirst(subs[lvl - 1].el); return; }
      shut(lvl - 1);
      var s = document.createElement('div');
      s.className = 'gsf-menu gsf-rmenu gsf-rm-sub';
      s.setAttribute('role', 'menu');
      s.setAttribute('data-lvl', String(lvl));
      s.setAttribute('aria-label', node.t || '');
      s.innerHTML = rpanel(node, path, false, attr, false, cx);
      s.style.left = '0px'; s.style.insetBlockStart = '0px';
      el.appendChild(s);
      var pr = s.getBoundingClientRect(), ox = pr.left, oy = pr.top, br = b.getBoundingClientRect(), pb = panelOf(b).getBoundingClientRect();
      var vw = window.innerWidth || 800, vh = window.innerHeight || 600, pad = 8;
      var lx = isAr() ? pb.left - pr.width + 2 : pb.right - 2;
      if (lx < pad || lx + pr.width > vw - pad) lx = isAr() ? pb.right - 2 : pb.left - pr.width + 2;
      lx = Math.max(pad, Math.min(lx, vw - pad - pr.width));
      var ty = Math.max(pad, Math.min(br.top - 5, vh - pad - pr.height));
      s.style.left = (lx - ox) + 'px';
      s.style.insetBlockStart = (ty - oy) + 'px';
      b.setAttribute('data-open', '1');
      subs.push({ el: s, btn: b });
      if (kb) focusFirst(s);
    }
    var hoverT = 0;
    el.addEventListener('mouseover', function (e) {
      if (sheet) return;
      var b = e.target.closest ? e.target.closest('.gsf-rm-i, .gsf-rm-qb') : null;
      if (!b || b.disabled) return;
      var pnl = b.closest('.gsf-rm-sub'), lvl = pnl ? +pnl.getAttribute('data-lvl') : 0;
      clearTimeout(hoverT);
      if (b.hasAttribute('data-rm-sub')) openSub(b, false);
      else hoverT = setTimeout(function () { shut(lvl); }, 120);
    });
    /*@3.MENJ.5*/
    var downBack = false;
    el.addEventListener('pointerdown', function (e) { downBack = e.target === el; });
    el.addEventListener('click', function (e) {
      if (sheet && e.target === el) { if (downBack) GardenMenu.close(); downBack = false; return; }
      var bk = e.target.closest ? e.target.closest('[data-rm-back]') : null;
      if (bk) {
        var tr = el.querySelector('.gsf-rm-track');
        if (tr && tr.children.length > 1) {
          tr.lastElementChild.remove();
          var d = tr.children.length - 1;
          tr.style.transform = d ? 'translateX(' + (isAr() ? d * 100 : -d * 100) + '%)' : '';
          focusFirst(tr.lastElementChild);
        }
        return;
      }
      var b = e.target.closest ? e.target.closest('[data-rm-sub]') : null;
      if (b && !b.disabled) openSub(b, true);
    });
    el.addEventListener('keydown', function (e) {
      var b = document.activeElement;
      if (!b || !el.contains(b)) return;
      var pnl = panelOf(b);
      var bs = Array.prototype.filter.call(pnl.querySelectorAll('[role^="menuitem"]'), function (x) { return !x.disabled && !x.hidden && panelOf(x) === pnl; });
      var i = bs.indexOf(b), fwd = isAr() ? 'ArrowLeft' : 'ArrowRight', bwd = isAr() ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (bs.length) bs[e.key === 'ArrowDown' ? (i + 1) % bs.length : (i <= 0 ? bs.length - 1 : i - 1)].focus();
      } else if ((e.key === fwd || e.key === 'Enter' || e.key === ' ') && b.hasAttribute('data-rm-sub')) {
        e.preventDefault(); openSub(b, true);
      } else if (e.key === bwd) {
        var sp = b.closest('.gsf-rm-sub');
        if (sp) { e.preventDefault(); var lv = +sp.getAttribute('data-lvl'), opener = subs[lv - 1] && subs[lv - 1].btn; shut(lv - 1); if (opener) opener.focus(); }
        else if (sheet) { var bb = el.querySelector('.gsf-rm-p:last-child [data-rm-back]'); if (bb) { e.preventDefault(); bb.click(); } }
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault(); if (bs.length) bs[e.key === 'Home' ? 0 : bs.length - 1].focus();
      } else if (o.filter && !e.ctrlKey && !e.metaKey && !e.altKey &&
                 ((e.key.length === 1 && (e.key !== ' ' || fq)) || (e.key === 'Backspace' && fq))) {
        e.preventDefault();
        refilter(e.key === 'Backspace' ? fq.slice(0, -1) : fq + e.key);
      }
    });
    /*@3.MENJ.4*/
    var fq = '', home = null;
    function refilter(q) {
      var box = sheet ? el.querySelector('.gsf-rm-p') : el;
      if (!box) return;
      shut(0);
      if (sheet) {
        var tr = el.querySelector('.gsf-rm-track');
        while (tr && tr.children.length > 1) tr.lastElementChild.remove();
        if (tr) tr.style.transform = '';
      }
      if (home == null) home = box.innerHTML;
      fq = q;
      if (!q) { box.innerHTML = home; home = null; el.removeAttribute('data-q'); focusFirst(box); return; }
      el.setAttribute('data-q', q);
      var f = fold(q), hits = leaves(model).filter(function (x) { return fold(x.m.t).indexOf(f) >= 0 || fold(x.trail).indexOf(f) >= 0; });
      box.innerHTML = rrow({ h: isAr() ? 'بحث' : 'Search', q: q }, 0, '', sheet, attr, cx) +
        (hits.length ? hits.map(function (x, k) {
          var m = {};
          for (var key in x.m) m[key] = x.m[key];
          if (x.trail && !m.eg) m.eg = x.trail;
          return rrow(m, k, '', sheet, attr, cx);
        }).join('') : '<div class="gsf-rm-none">' + esc(isAr() ? 'لا شيءَ بهذا الاسم' : 'Nothing by that name') + '</div>');
      focusFirst(box);
    }
    if (sheet) {
      el.setAttribute('data-sheet', '1');
      el.style.left = ''; el.style.insetBlockStart = ''; el.style.maxBlockSize = ''; el.style.overflowY = '';
    }
    return el;
  }

  function press(hostEl, sel, fn, o) {
    if (!hostEl || !fn) return function () {};
    o = o || {};
    var st = null, fired = 0;
    function target(e) {
      var t = e.target && e.target.closest ? e.target.closest(sel) : null;
      return t && hostEl.contains(t) ? t : null;
    }
    function down(e) {
      if (e.pointerType === 'mouse' || (e.button && e.button !== 0)) return;
      var t = target(e);
      if (!t) return;
      if (st) clearTimeout(st.tm);
      st = { t: t, x: e.clientX, y: e.clientY, id: e.pointerId, tm: setTimeout(function () {
        var s = st;
        st = null;
        if (!s) return;
        fired = Date.now();
        try { navigator.vibrate && navigator.vibrate(12); } catch (e2) {}
        fn(s.t, s.x, s.y, { touch: true });
      }, o.ms || PRESS_MS) };
    }
    function move(e) {
      if (!st || e.pointerId !== st.id) return;
      if (Math.abs(e.clientX - st.x) > PRESS_SLOP || Math.abs(e.clientY - st.y) > PRESS_SLOP) { clearTimeout(st.tm); st = null; }
    }
    function up(e) { if (st && e.pointerId === st.id) { clearTimeout(st.tm); st = null; } }
    function ctx(e) {
      var t = target(e);
      if (!t) return;
      e.preventDefault();
      if (Date.now() - fired < 900) return;
      fired = Date.now();
      fn(t, e.clientX, e.clientY, { touch: false });
    }
    function click(e) {
      if (Date.now() - fired < 700 && target(e)) { e.preventDefault(); e.stopPropagation(); fired = 0; }
    }
    hostEl.addEventListener('pointerdown', down);
    hostEl.addEventListener('pointermove', move);
    hostEl.addEventListener('pointerup', up);
    hostEl.addEventListener('pointercancel', up);
    hostEl.addEventListener('contextmenu', ctx);
    hostEl.addEventListener('click', click, true);
    return function unbind() {
      hostEl.removeEventListener('pointerdown', down);
      hostEl.removeEventListener('pointermove', move);
      hostEl.removeEventListener('pointerup', up);
      hostEl.removeEventListener('pointercancel', up);
      hostEl.removeEventListener('contextmenu', ctx);
      hostEl.removeEventListener('click', click, true);
    };
  }

  window.GardenMenu = {
    open: open,
    rich: rich,
    close: function () { close(true); },
    item: item,
    sep: sep,
    head: head,
    press: press,
    isOpen: function () { return !!cur; }
  };
})();
