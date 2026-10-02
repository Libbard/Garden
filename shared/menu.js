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

    cur = { el: el, ret: ret, onClose: o.onClose || null };
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
    close: function () { close(true); },
    item: item,
    sep: sep,
    head: head,
    press: press,
    isOpen: function () { return !!cur; }
  };
})();
