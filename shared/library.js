(function () {
  'use strict';
  if (window.GardenLibrary) return;

  var SCRIPT = document.currentScript && document.currentScript.src;
  var BASE = new URL('../library/', SCRIPT || location.href).href;
  var F_STICKER = 1, F_COLOR = 2, F_LESSON = 4;
  var AGES = [[0, 'الكلّ', 'All'], [1, 'صغار', 'Kids'], [2, 'ناشئة', 'Teens'], [4, 'كبار', 'Adults']];
  var KINDS = [
    ['sticker', F_STICKER, 'fa-face-smile', 'ملصقات', 'Stickers'],
    ['coloring', F_COLOR, 'fa-palette', 'تلوين', 'Coloring'],
    ['lesson', F_LESSON, 'fa-pencil', 'تعلّمِ الرسم', 'Learn to draw']
  ];
  var PAGE = 72;

  function en() { return (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2) === 'en'; }
  function T(ar, e) { return en() ? e : ar; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[آأإٱ]/g, 'ا')
      .replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
  }
  var cache = { index: null, cats: {}, all: null };
  function getJSON(rel) {
    return fetch(BASE + rel).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function index() { return cache.index ? Promise.resolve(cache.index) : getJSON('index.json').then(function (j) { cache.index = j; return j; }); }
  function expand(row, cat) {
    return { id: row[0], ar: row[1], en: row[2], tags: row[3], ages: row[4], flags: row[5], src: row[6], level: row[7] || 0, vb: row[8] || 72, cat: cat, url: BASE + 'art/' + row[6] + '.svg' };
  }
  function category(id) {
    if (cache.cats[id]) return Promise.resolve(cache.cats[id]);
    return getJSON('cat/' + id + '.json').then(function (j) {
      var items = j.items.map(function (r) { return expand(r, id); });
      cache.cats[id] = items; return items;
    });
  }
  function all() {
    if (cache.all) return Promise.resolve(cache.all);
    return index().then(function (ix) {
      return Promise.all(ix.cats.map(function (c) { return category(c.id); }));
    }).then(function (lists) {
      var out = [];
      lists.forEach(function (l) { l.forEach(function (it) { it.key = norm(it.ar + ' ' + it.en + ' ' + it.tags); out.push(it); }); });
      cache.all = out; return out;
    });
  }
  function svgText(item) {
    return fetch(item.url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); });
  }
  function release() { cache.cats = {}; cache.all = null; cache.index = null; }

  function picture(item, kind) {
    var name = esc(en() ? item.en : item.ar);
    if (kind === 'sticker') return '<span class="glib-pic"><img src="' + item.url + '" alt="" loading="lazy" decoding="async"></span>';
    var vb = '0 0 ' + item.vb + ' ' + item.vb;
    return '<span class="glib-pic"><img class="glib-ref" src="' + item.url + '" alt="" loading="lazy" decoding="async">' +
      '<svg class="glib-out" viewBox="' + vb + '" aria-hidden="true" style="position:absolute;inset:6%;inline-size:88%;block-size:88%"><use href="' + item.url + '#line"/></svg></span>' +
      (name ? '' : '');
  }

  function Picker(opts) {
    this.opts = opts || {};
    this.kind = this.opts.kind || 'sticker';
    this.age = 0; this.cat = null; this.q = ''; this.sel = null; this.shown = 0; this.list = [];
    this.build();
  }

  Picker.prototype.build = function () {
    var self = this;
    var d = document.createElement('dialog');
    d.className = 'gsf glib';
    d.innerHTML =
      '<div class="gsf-grip" aria-hidden="true"></div>' +
      '<form method="dialog" class="gsf-x"><button class="gsf-close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></form>' +
      '<div class="glib-body">' +
        '<div class="glib-top"><h2 class="gsf-title"><i class="fa-solid fa-icons" aria-hidden="true"></i><span class="glib-h"></span></h2>' +
        '<div class="gsf-chips glib-kinds" role="tablist"></div></div>' +
        '<div class="glib-top"><label class="glib-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input class="gsf-in" type="search" autocomplete="off"></label>' +
        '<div class="gsf-chips glib-ages"></div></div>' +
        '<div class="glib-cats" role="tablist"></div>' +
        '<div class="glib-grid" role="listbox"></div>' +
      '</div>' +
      '<div class="gsf-foot glib-foot" hidden><div class="gsf-acts"><div class="glib-sel"></div>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost glib-done"></button>' +
        '<button type="button" class="gsf-btn gsf-btn--ghost glib-learn"></button>' +
        '<button type="button" class="gsf-btn gsf-btn--go glib-self"></button></div></div>' +
      '<p class="glib-credit"></p>';
    this.d = d;
    this.$ = function (s) { return d.querySelector(s); };
    var kinds = this.$('.glib-kinds');
    KINDS.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'gsf-chip'; b.dataset.kind = k[0]; b.setAttribute('role', 'tab');
      b.innerHTML = '<i class="fa-solid ' + k[2] + '" aria-hidden="true"></i> <span></span>';
      b.addEventListener('click', function () { self.setKind(k[0]); });
      kinds.appendChild(b);
    });
    var ages = this.$('.glib-ages');
    AGES.forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'gsf-chip'; b.dataset.age = a[0];
      b.addEventListener('click', function () { self.age = a[0]; self.paintChrome(); self.refresh(); });
      ages.appendChild(b);
    });
    var input = this.$('.glib-search input'), t = 0;
    input.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { self.q = norm(input.value.trim()); self.refresh(); }, 140);
    });
    var grid = this.$('.glib-grid');
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.glib-t'); if (!b) return;
      if (b.dataset.held) { delete b.dataset.held; return; }
      self.choose(self.list[+b.dataset.i]);
    });
    var hold = 0;
    grid.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.glib-t'); if (!b || e.pointerType === 'mouse') return;
      hold = setTimeout(function () { b.classList.add('is-peek'); b.dataset.held = '1'; }, 320);
    });
    var unhold = function () { clearTimeout(hold); grid.querySelectorAll('.is-peek').forEach(function (b) { b.classList.remove('is-peek'); }); };
    grid.addEventListener('pointerup', unhold); grid.addEventListener('pointercancel', unhold); grid.addEventListener('pointerleave', unhold);
    grid.addEventListener('contextmenu', function (e) { if (e.target.closest('.glib-t')) e.preventDefault(); });
    grid.addEventListener('scroll', function () {
      if (grid.scrollTop + grid.clientHeight > grid.scrollHeight - 400) self.more();
    }, { passive: true });
    this.$('.glib-self').addEventListener('click', function () { self.pick(self.kind === 'lesson' ? 'lesson' : 'color-self'); });
    this.$('.glib-done').addEventListener('click', function () { self.pick('color-done'); });
    this.$('.glib-learn').addEventListener('click', function () { self.pick('lesson'); });
    d.addEventListener('close', function () { self.destroy(); });
    document.body.appendChild(d);
    this._onLang = function () { self.paintChrome(); self.paintCats(); self.render(); };
    document.addEventListener('garden:lang', this._onLang);
    this.paintChrome();
  };

  Picker.prototype.paintChrome = function () {
    var self = this, e = en();
    this.d.setAttribute('dir', e ? 'ltr' : 'rtl');
    this.$('.glib-h').textContent = T('المكتبة', 'Library');
    this.$('.gsf-close').setAttribute('aria-label', T('إغلاق', 'Close'));
    this.d.querySelectorAll('.glib-kinds .gsf-chip').forEach(function (b) {
      var k = KINDS.filter(function (x) { return x[0] === b.dataset.kind; })[0];
      b.querySelector('span').textContent = e ? k[4] : k[3];
      b.classList.toggle('on', k[0] === self.kind); b.setAttribute('aria-selected', String(k[0] === self.kind));
    });
    this.d.querySelectorAll('.glib-ages .gsf-chip').forEach(function (b) {
      var a = AGES.filter(function (x) { return String(x[0]) === b.dataset.age; })[0];
      b.textContent = e ? a[2] : a[1]; b.classList.toggle('on', a[0] === self.age);
    });
    var input = this.$('.glib-search input');
    input.placeholder = T('ابحثْ: قطّة، سيارة، قلب، مكتب…', 'Search: cat, car, heart, desk…');
    input.setAttribute('aria-label', T('ابحثْ في المكتبة', 'Search the library'));
    this.$('.glib-self').textContent = this.kind === 'lesson' ? T('ابدأِ الدرس', 'Start lesson') : T('لوّنْه بنفسي', 'Color it myself');
    this.$('.glib-done').textContent = T('أدرجْه ملوّناً', 'Insert colored');
    this.$('.glib-learn').textContent = T('تعلّمْ رسمه', 'Learn to draw it');
    this.$('.glib-credit').textContent = cache.index && cache.index.credit ? (e ? cache.index.credit.en : cache.index.credit.ar) : '';
    this.paintSel();
  };

  Picker.prototype.open = function () {
    var self = this;
    this.d.showModal();
    this.grid('<div class="glib-empty">' + esc(T('تُجلب المكتبة…', 'Loading the library…')) + '</div>');
    return index().then(function (ix) {
      self.ix = ix;
      self.paintChrome();
      self.paintCats();
      return self.refresh();
    }).catch(function () {
      self.grid('<div class="glib-err">' + esc(T('تعذّر جلبُ المكتبة. تحقّقْ من الاتصال ثمّ أعدِ المحاولة.', 'Could not load the library. Check your connection and try again.')) + '</div>');
    });
  };

  Picker.prototype.flag = function () { return KINDS.filter(function (k) { return k[0] === this.kind; }, this)[0][1]; };

  Picker.prototype.paintCats = function () {
    if (!this.ix) return;
    var self = this, f = this.flag(), box = this.$('.glib-cats'), e = en();
    var cats = this.ix.cats.filter(function (c) { return (c.f & f) && c.n[f]; });
    if (!cats.some(function (c) { return c.id === self.cat; })) this.cat = cats.length ? cats[0].id : null;
    box.innerHTML = cats.map(function (c) {
      return '<button type="button" role="tab" class="gsf-chip glib-cat' + (c.id === self.cat ? ' on' : '') + '" data-cat="' + c.id + '" aria-selected="' + (c.id === self.cat) + '">' +
        '<img src="' + BASE + 'art/' + c.icon + '.svg" alt="" loading="lazy">' + esc(e ? c.en : c.ar) + ' <small>' + c.n[f] + '</small></button>';
    }).join('');
    box.querySelectorAll('.glib-cat').forEach(function (b) {
      b.addEventListener('click', function () { self.cat = b.dataset.cat; self.q = ''; self.$('.glib-search input').value = ''; self.paintCats(); self.refresh(); });
    });
  };

  Picker.prototype.setKind = function (k) {
    this.kind = k; this.sel = null;
    this.paintChrome(); this.paintCats(); this.refresh();
  };

  Picker.prototype.refresh = function () {
    var self = this, f = this.flag(), age = this.age, q = this.q;
    var src = q ? all() : (this.cat ? category(this.cat) : Promise.resolve([]));
    this.$('.glib-cats').hidden = !!q;
    return src.then(function (items) {
      var words = q ? q.split(/\s+/) : [];
      self.list = items.filter(function (it) {
        if (!(it.flags & f)) return false;
        if (age && !(it.ages & age)) return false;
        for (var i = 0; i < words.length; i++) if (it.key.indexOf(words[i]) < 0) return false;
        return true;
      });
      if (q) self.list.sort(function (a, b) { return (norm(en() ? a.en : a.ar).indexOf(words[0]) === 0 ? 0 : 1) - (norm(en() ? b.en : b.ar).indexOf(words[0]) === 0 ? 0 : 1); });
      self.render();
    }).catch(function () {
      self.grid('<div class="glib-err">' + esc(T('تعذّر جلبُ هذه الفئة.', 'Could not load this category.')) + '</div>');
    });
  };

  Picker.prototype.grid = function (html) { var g = this.$('.glib-grid'); g.innerHTML = html; g.scrollTop = 0; };

  Picker.prototype.render = function () {
    this.shown = 0;
    if (!this.list.length) {
      this.grid('<div class="glib-empty">' + esc(this.q ? T('لا نتائج. جرّبْ كلمةً أخرى أو اكتبْها بالإنجليزيّة.', 'No results. Try another word, or search in Arabic.') : T('لا عناصرَ هنا بعد.', 'Nothing here yet.')) + '</div>');
      return;
    }
    this.grid('');
    this.more();
  };

  Picker.prototype.more = function () {
    if (this.shown >= this.list.length) return;
    var e = en(), kind = this.kind, html = '', end = Math.min(this.list.length, this.shown + PAGE), sel = this.sel;
    for (var i = this.shown; i < end; i++) {
      var it = this.list[i], name = e ? it.en : it.ar;
      var lv = it.level ? '<span class="glib-lv" aria-hidden="true"><i class="on"></i><i' + (it.level > 1 ? ' class="on"' : '') + '></i><i' + (it.level > 2 ? ' class="on"' : '') + '></i></span>' : '';
      html += '<button type="button" class="glib-t" role="option" data-i="' + i + '" aria-pressed="' + (sel && sel.id === it.id) + '" aria-label="' + esc(name) + '" title="' + esc(name) + '">' +
        picture(it, kind) + lv + '<span class="glib-n">' + esc(name) + '</span></button>';
    }
    this.$('.glib-grid').insertAdjacentHTML('beforeend', html);
    this.shown = end;
  };

  Picker.prototype.choose = function (item) {
    if (!item) return;
    if (this.kind === 'sticker') { this.sel = item; this.pick('sticker'); return; }
    this.sel = item;
    this.$('.glib-grid').querySelectorAll('.glib-t').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('aria-label') === (en() ? item.en : item.ar) && +b.dataset.i >= 0 && this.list[+b.dataset.i] === item)); }, this);
    this.paintSel();
  };

  Picker.prototype.paintSel = function () {
    var foot = this.$('.glib-foot'), it = this.sel;
    foot.hidden = !it || this.kind === 'sticker';
    if (!it) return;
    this.$('.glib-sel').innerHTML = '<img src="' + it.url + '" alt=""><span>' + esc(en() ? it.en : it.ar) + '</span>';
    this.$('.glib-done').hidden = this.kind === 'lesson';
    this.$('.glib-learn').hidden = this.kind === 'lesson' || !(it.flags & F_LESSON);
  };

  Picker.prototype.pick = function (how) {
    var it = this.sel, cb = this.opts.onPick;
    if (!it) return;
    var keep = this.opts.keepOpen;
    if (!keep) this.d.close();
    if (cb) cb(it, how);
  };

  Picker.prototype.destroy = function () {
    document.removeEventListener('garden:lang', this._onLang);
    this.$('.glib-grid').textContent = '';
    this.d.remove();
    if (this.opts.release !== false) release();
  };

  window.GardenLibrary = {
    base: BASE,
    open: function (opts) { var p = new Picker(opts); p.open(); return p; },
    svg: svgText,
    index: index,
    category: category,
    search: function (q) { q = norm(q); return all().then(function (l) { return l.filter(function (i) { return i.key.indexOf(q) >= 0; }); }); },
    release: release,
    FLAGS: { STICKER: F_STICKER, COLOR: F_COLOR, LESSON: F_LESSON }
  };
})();
