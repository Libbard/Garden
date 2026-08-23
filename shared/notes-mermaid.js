(function () {
  'use strict';

  function L(ar, en) {
    var lang = 'ar';
    try { lang = localStorage.getItem('garden_lang') || 'ar'; } catch (e) {}
    return lang === 'en' ? en : ar;
  }

  /*@3.NOMJ4.1*/
  var _lib = null;
  var _seq = 0;

  function baseUrl() {
    var probe = document.querySelector('script[src*="notes-mermaid.js"]') ||
                document.querySelector('script[src*="notes-editor.js"]');
    var src = probe ? (probe.getAttribute('src') || '') : '';
    return { dir: src.replace(/notes-[a-z]+\.js.*$/, ''), v: src.split('?')[1] || '' };
  }

  /*@3.NOMJ4.2*/
  function ensure() {
    if (_lib) return _lib;
    if (window.mermaid) {
      _lib = Promise.resolve(init(window.mermaid));
      return _lib;
    }
    _lib = new Promise(function (res) {
      var b = baseUrl();
      var tag = document.createElement('script');
      tag.src = b.dir + 'vendor/mermaid/mermaid.min.js' + (b.v ? ('?' + b.v) : '');
      tag.onload = function () {
        res(window.mermaid ? init(window.mermaid) : { ok: false, why: 'no-api' });
      };
      tag.onerror = function () { res({ ok: false, why: 'missing' }); };
      document.head.appendChild(tag);
    });
    return _lib;
  }

  /*@3.NOMJ4.3*/
  function themeIsDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; }
    catch (e) { return false; }
  }

  function init(m) {
    try {
      m.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: themeIsDark() ? 'dark' : 'default',
        fontFamily: 'inherit'
      });
      return { ok: true, api: m };
    } catch (e) {
      return { ok: false, why: 'init' };
    }
  }

  function reason(why) {
    if (why === 'missing') {
      return L('محرّكُ المخطّطات غير مثبَّتٍ بعد — الشِفرةُ محفوظةٌ كما هي.',
               'The diagram engine is not installed yet — your code is kept as written.');
    }
    return L('تعذّر تشغيلُ محرّكِ المخطّطات.', 'Could not start the diagram engine.');
  }

  /*@3.NOMJ4.4*/
  function render(host, src) {
    if (!host) return Promise.resolve(false);
    var code = String(src == null ? '' : src).trim();
    host.textContent = '';
    if (!code) return Promise.resolve(false);
    host.setAttribute('data-state', 'busy');
    return ensure().then(function (lib) {
      if (!lib || !lib.ok) {
        host.setAttribute('data-state', 'off');
        host.textContent = reason(lib && lib.why);
        return false;
      }
      var id = 'nmd' + (++_seq);
      return Promise.resolve(lib.api.render(id, code)).then(function (out) {
        var svg = (out && out.svg) || out;
        host.setAttribute('data-state', 'ok');
        host.innerHTML = String(svg);
        var el = host.querySelector('svg');
        if (el) {
          el.removeAttribute('width');
          el.setAttribute('role', 'img');
          if (!el.getAttribute('aria-label')) {
            el.setAttribute('aria-label', L('مخطّط', 'Diagram'));
          }
        }
        return true;
      })['catch'](function (err) {
        /*@3.NOMJ4.5*/
        host.setAttribute('data-state', 'bad');
        host.textContent = L('خطأٌ في وصف المخطّط: ', 'Diagram syntax error: ') +
          String((err && err.message) || err || '').slice(0, 200);
        return false;
      });
    });
  }

  window.GardenNotesMermaid = { ensure: ensure, render: render, isDark: themeIsDark };
})();
