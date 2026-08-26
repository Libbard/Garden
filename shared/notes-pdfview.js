(function () {
  'use strict';

  var _lib = null;
  var _docs = 0;

  function base() {
    var probe = document.querySelector('script[src*="notes-pdfview.js"]') ||
                document.querySelector('script[src*="notes-editor.js"]') ||
                document.querySelector('script[src*="notes-app.js"]');
    var src = probe ? (probe.getAttribute('src') || '') : '';
    return { dir: src.replace(/notes-[a-z]+\.js.*$/, ''), v: src.split('?')[1] || '' };
  }

  function lib() {
    if (_lib) return _lib;
    var b = base();
    var q = b.v ? ('?' + b.v) : '';
    _lib = import(b.dir + 'vendor/pdfjs/pdf.min.mjs' + q).then(function (m) {
      try { m.GlobalWorkerOptions.workerSrc = b.dir + 'vendor/pdfjs/pdf.worker.min.mjs' + q; }
      catch (e) {}
      return m;
    });
    return _lib;
  }

  function load(src, opts) {
    var o = opts || {};
    return lib().then(function (m) {
      var args = { isEvalSupported: false, disableAutoFetch: false };
      if (typeof src === 'string') args.url = src;
      else args.data = src;
      if (o.password) args.password = o.password;
      var task = m.getDocument(args);
      return task.promise.then(function (doc) {
        _docs++;
        return { m: m, doc: doc, pages: doc.numPages };
      });
    });
  }

  function ratio(cap) {
    var d = window.devicePixelRatio || 1;
    var top = cap || 2.5;
    return d > top ? top : (d < 1 ? 1 : d);
  }

  function View(handle, host, opts) {
    this.h = handle;
    this.host = host;
    this.o = opts || {};
    this.scale = this.o.scale || 1;
    this.slots = [];
    this.live = {};
    this.busy = {};
    this.io = null;
    this.dead = false;
  }

  View.prototype.build = function () {
    var self = this;
    var doc = this.h.doc;
    this.host.innerHTML = '';
    this.wrap = document.createElement('div');
    this.wrap.className = 'gpv';
    this.host.appendChild(this.wrap);

    var jobs = [];
    for (var i = 1; i <= doc.numPages; i++) jobs.push(i);

    return jobs.reduce(function (chain, n) {
      return chain.then(function () {
        if (self.dead) return null;
        return doc.getPage(n).then(function (page) {
          var vp = page.getViewport({ scale: self.scale });
          var el = document.createElement('div');
          el.className = 'gpv-page';
          el.setAttribute('data-p', String(n));
          el.style.inlineSize = Math.round(vp.width) + 'px';
          el.style.blockSize = Math.round(vp.height) + 'px';
          el.style.setProperty('--scale-factor', String(self.scale));
          self.wrap.appendChild(el);
          self.slots.push({ n: n, el: el, page: page, w: vp.width, h: vp.height });
        });
      });
    }, Promise.resolve()).then(function () {
      if (self.dead) return self;
      self.watch();
      return self;
    });
  };

  View.prototype.watch = function () {
    var self = this;
    if (!window.IntersectionObserver) {
      this.slots.forEach(function (s) { self.paint(s); });
      return;
    }
    this.io = new IntersectionObserver(function (ents) {
      for (var i = 0; i < ents.length; i++) {
        var s = self.slotOf(ents[i].target);
        if (!s) continue;
        if (ents[i].isIntersecting) self.paint(s);
        else self.drop(s);
      }
    }, { root: this.o.scroller || null, rootMargin: this.o.margin || '800px 0px' });
    this.slots.forEach(function (s) { self.io.observe(s.el); });
  };

  View.prototype.slotOf = function (el) {
    for (var i = 0; i < this.slots.length; i++) if (this.slots[i].el === el) return this.slots[i];
    return null;
  };

  View.prototype.paint = function (s) {
    var self = this;
    if (this.dead || this.live[s.n] || this.busy[s.n]) return Promise.resolve();
    this.busy[s.n] = 1;
    var vp = s.page.getViewport({ scale: this.scale });
    var r = ratio(this.o.maxRatio);
    var cv = document.createElement('canvas');
    cv.className = 'gpv-cv';
    cv.width = Math.round(vp.width * r);
    cv.height = Math.round(vp.height * r);
    cv.style.inlineSize = Math.round(vp.width) + 'px';
    cv.style.blockSize = Math.round(vp.height) + 'px';
    var ctx = cv.getContext('2d', { alpha: false });
    var task = s.page.render({
      canvasContext: ctx,
      viewport: vp,
      transform: r !== 1 ? [r, 0, 0, r, 0, 0] : null,
      background: '#ffffff'
    });
    s.task = task;
    return task.promise.then(function () {
      if (self.dead) return;
      s.el.appendChild(cv);
      var td = document.createElement('div');
      td.className = 'gpv-text';
      s.el.appendChild(td);
      var tl = new self.h.m.TextLayer({
        textContentSource: s.page.streamTextContent({ includeMarkedContent: false }),
        container: td,
        viewport: vp
      });
      s.text = td;
      return tl.render().then(function () {
        self.live[s.n] = { cv: cv, td: td };
        delete self.busy[s.n];
        if (self.o.onPage) self.o.onPage(s.n);
      });
    }).catch(function () {
      delete self.busy[s.n];
    });
  };

  View.prototype.drop = function (s) {
    var keep = this.o.keep == null ? 4 : this.o.keep;
    var ids = Object.keys(this.live);
    if (ids.length <= keep) return;
    var l = this.live[s.n];
    if (!l) return;
    if (s.task && s.task.cancel) { try { s.task.cancel(); } catch (e) {} }
    if (l.cv && l.cv.parentNode) l.cv.parentNode.removeChild(l.cv);
    if (l.td && l.td.parentNode) l.td.parentNode.removeChild(l.td);
    delete this.live[s.n];
  };

  View.prototype.setScale = function (v) {
    var self = this;
    this.scale = v;
    this.slots.forEach(function (s) {
      var vp = s.page.getViewport({ scale: v });
      s.el.style.inlineSize = Math.round(vp.width) + 'px';
      s.el.style.blockSize = Math.round(vp.height) + 'px';
      s.el.style.setProperty('--scale-factor', String(v));
      var l = self.live[s.n];
      if (l) {
        if (l.cv && l.cv.parentNode) l.cv.parentNode.removeChild(l.cv);
        if (l.td && l.td.parentNode) l.td.parentNode.removeChild(l.td);
        delete self.live[s.n];
      }
    });
  };

  View.prototype.destroy = function () {
    this.dead = true;
    if (this.io) { try { this.io.disconnect(); } catch (e) {} this.io = null; }
    try { this.h.doc.destroy(); } catch (e2) {}
    this.slots = []; this.live = {};
    if (this.host) this.host.innerHTML = '';
  };

  function mount(host, handle, opts) {
    return new View(handle, host, opts).build();
  }

  function fitScale(handle, width) {
    return handle.doc.getPage(1).then(function (p) {
      var vp = p.getViewport({ scale: 1 });
      return width > 0 ? (width / vp.width) : 1;
    });
  }

  window.GardenPdfView = {
    load: load,
    mount: mount,
    fitScale: fitScale,
    ready: function () { return lib(); }
  };
})();
