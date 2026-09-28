;(function () {
  'use strict';

  var MAX = 300;

  function strip(list, key) {
    var out = [], i;
    for (i = 0; i < list.length; i++) {
      var e = list[i];
      if (e instanceof Array) {
        var keep = [], j;
        for (j = 0; j < e.length; j++) if (e[j] !== key) keep.push(e[j]);
        if (keep.length) out.push(keep.length === 1 ? keep[0] : keep);
      } else if (e !== key) out.push(e);
    }
    return out;
  }

  /*@3.NOHJ.1*/
  function History() {
    this.u = [];
    this.r = [];
    this.s = {};
    this.onChange = null;
    this.tx = 0;
    this.buf = null;
    /*@3.NOHJ.3*/
    this.busy = false;
  }

  History.prototype.begin = function () {
    if (!this.tx) this.buf = [];
    this.tx++;
  };

  History.prototype.end = function () {
    if (!this.tx) return;
    this.tx--;
    if (this.tx) return;
    var b = this.buf;
    this.buf = null;
    if (!b || !b.length) return;
    this.u.push(b.length === 1 ? b[0] : b);
    if (this.u.length > MAX) this.u.shift();
    this.r.length = 0;
    this.emit();
  };

  /*@3.NOHJ.5*/
  History.prototype.merge = function (n) {
    if (this.tx || !(n > 1) || this.u.length < n) return false;
    var g = [], i, e;
    for (i = this.u.length - n; i < this.u.length; i++) {
      e = this.u[i];
      if (Array.isArray(e)) g = g.concat(e); else g.push(e);
    }
    this.u.length -= n;
    this.u.push(g);
    this.emit();
    return true;
  };

  History.prototype.register = function (key, api) {
    if (!key || !api) return;
    this.s[key] = api;
  };

  History.prototype.unregister = function (key) {
    delete this.s[key];
    this.forget(key);
  };

  History.prototype.forget = function (key) {
    this.u = strip(this.u, key);
    this.r = strip(this.r, key);
    this.emit();
  };

  History.prototype.reset = function () {
    this.u.length = 0;
    this.r.length = 0;
    this.emit();
  };

  History.prototype.note = function (key) {
    if (this.busy || !key) return;
    if (this.tx) { this.buf.push(key); return; }
    this.u.push(key);
    if (this.u.length > MAX) this.u.shift();
    this.r.length = 0;
    this.emit();
  };

  History.prototype.canUndo = function () { return this.u.length > 0; };
  History.prototype.canRedo = function () { return this.r.length > 0; };

  History.prototype.step = function (from, to, meth) {
    if (this.busy) return false;
    var ok = false;
    this.busy = true;
    try {
      while (from.length) {
        var key = from.pop();
        var keys = (key instanceof Array) ? key.slice() : [key];
        /*@3.NOHJ.4*/
        if (meth === 'undo') keys.reverse();
        var done = false, j;
        for (j = 0; j < keys.length; j++) {
          var surf = this.s[keys[j]];
          /*@3.NOHJ.2*/
          if (!surf || typeof surf[meth] !== 'function') continue;
          try { if (surf[meth]() !== false) done = true; } catch (e) {}
        }
        if (done) { to.push(key); ok = true; break; }
      }
    } finally { this.busy = false; }
    this.emit();
    return ok;
  };

  History.prototype.undo = function () { return this.step(this.u, this.r, 'undo'); };
  History.prototype.redo = function () { return this.step(this.r, this.u, 'redo'); };

  History.prototype.emit = function () {
    if (this.onChange) { try { this.onChange(this); } catch (e) {} }
  };

  window.GardenNotesHistory = {
    create: function () { return new History(); }
  };
})();
