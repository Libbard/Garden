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

  /*@3.NOMJ4.9*/
  var TOK = {
    bg: '#e01001', bd: '#e01002', tx: '#e01003', ln: '#e01004',
    lb: '#e01005', cl: '#e01006', cb: '#e01007', alt: '#e01008',
    s1: '#e01011', s2: '#e01012', s3: '#e01013', s4: '#e01014',
    s5: '#e01015', s6: '#e01016', s7: '#e01017', s8: '#e01018',
    s9: '#e01019', s10: '#e01020', s11: '#e01021', s12: '#e01022',
    stx: '#e01023'
  };

  var SERIES = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'];

  function seriesVars(prefix, from) {
    var out = {}, i;
    for (i = 0; i < 12; i++) out[prefix + (i + from)] = TOK[SERIES[i]];
    return out;
  }

  function palette() {
    var v = {
      background: 'transparent',
      primaryColor: TOK.bg, primaryBorderColor: TOK.bd, primaryTextColor: TOK.tx,
      secondaryColor: TOK.cl, secondaryBorderColor: TOK.cb, secondaryTextColor: TOK.tx,
      tertiaryColor: TOK.alt, tertiaryBorderColor: TOK.cb, tertiaryTextColor: TOK.tx,
      mainBkg: TOK.bg, nodeBorder: TOK.bd, nodeTextColor: TOK.tx,
      lineColor: TOK.ln, textColor: TOK.tx, titleColor: TOK.tx,
      clusterBkg: TOK.cl, clusterBorder: TOK.cb,
      edgeLabelBackground: TOK.lb, labelBoxBkgColor: TOK.lb, labelBoxBorderColor: TOK.bd,
      labelTextColor: TOK.tx, defaultLinkColor: TOK.ln,
      altBackground: TOK.alt, compositeBackground: TOK.cl, compositeBorder: TOK.cb,
      compositeTitleBackground: TOK.cl,
      classText: TOK.tx, attributeBackgroundColorOdd: TOK.bg,
      attributeBackgroundColorEven: TOK.alt,
      actorBkg: TOK.bg, actorBorder: TOK.bd, actorTextColor: TOK.tx, actorLineColor: TOK.ln,
      signalColor: TOK.ln, signalTextColor: TOK.tx,
      noteBkgColor: TOK.alt, noteBorderColor: TOK.cb, noteTextColor: TOK.tx,
      activationBkgColor: TOK.cl, activationBorderColor: TOK.cb,
      sequenceNumberColor: TOK.lb, loopTextColor: TOK.tx,
      taskBkgColor: TOK.bg, taskBorderColor: TOK.bd, taskTextColor: TOK.tx,
      taskTextOutsideColor: TOK.tx, taskTextDarkColor: TOK.tx, taskTextLightColor: TOK.lb,
      activeTaskBkgColor: TOK.s1, activeTaskBorderColor: TOK.bd,
      doneTaskBkgColor: TOK.alt, doneTaskBorderColor: TOK.cb,
      critBkgColor: TOK.s4, critBorderColor: TOK.s4,
      gridColor: TOK.cb, todayLineColor: TOK.s4,
      sectionBkgColor: TOK.cl, sectionBkgColor2: TOK.alt,
      altSectionBkgColor: TOK.alt,
      stateBkg: TOK.bg, stateBorder: TOK.bd, transitionColor: TOK.ln,
      transitionLabelColor: TOK.tx, stateLabelColor: TOK.tx,
      innerEndBackground: TOK.bd, specialStateColor: TOK.tx,
      errorBkgColor: TOK.s4, errorTextColor: TOK.tx,
      fillType0: TOK.s1, fillType1: TOK.s2, fillType2: TOK.s3, fillType3: TOK.s4,
      fillType4: TOK.s5, fillType5: TOK.s6, fillType6: TOK.s7, fillType7: TOK.s8,
      pieTitleTextColor: TOK.tx, pieSectionTextColor: TOK.stx,
      pieLegendTextColor: TOK.tx, pieStrokeColor: TOK.lb, pieOuterStrokeColor: TOK.lb,
      quadrant1Fill: TOK.cl, quadrant2Fill: TOK.alt, quadrant3Fill: TOK.cl,
      quadrant4Fill: TOK.alt, quadrantTitleFill: TOK.tx,
      quadrantPointFill: TOK.s1, quadrantPointTextFill: TOK.tx,
      quadrantXAxisTextFill: TOK.tx, quadrantYAxisTextFill: TOK.tx,
      quadrantInternalBorderStrokeFill: TOK.cb, quadrantExternalBorderStrokeFill: TOK.cb,
      fontSize: '14px'
    };
    var add = [seriesVars('pie', 1), seriesVars('cScale', 0), seriesVars('git', 0)];
    for (var a = 0; a < add.length; a++) {
      for (var k in add[a]) if (Object.prototype.hasOwnProperty.call(add[a], k)) v[k] = add[a][k];
    }
    for (var c = 0; c < 12; c++) {
      v['cScaleLabel' + c] = TOK.stx;
      v['cScaleInv' + c] = TOK.tx;
    }
    return v;
  }

  var NEUTRAL = palette();

  var TOKEN_RE = /#e010([0-9]{2})|rgba?\(\s*224\s*,\s*16\s*,\s*([0-9]{1,3})\s*(?:,[^)]*)?\)/gi;
  /*@3.NOMJ4.7*/
  var VAR_OF = (function () {
    var m = {};
    for (var k in TOK) if (Object.prototype.hasOwnProperty.call(TOK, k)) {
      m[parseInt(TOK[k].slice(5), 16)] = 'var(--nd-' + k + ')';
    }
    return m;
  })();

  function deToken(text) {
    return String(text == null ? '' : text).replace(TOKEN_RE, function (hit, hx, rg) {
      var n = hx != null ? parseInt(hx, 16) : parseInt(rg, 10);
      return VAR_OF[n] || hit;
    });
  }

  function hasToken(v) {
    if (!v) return false;
    TOKEN_RE.lastIndex = 0;
    var hit = TOKEN_RE.test(v);
    TOKEN_RE.lastIndex = 0;
    return hit;
  }

  /*@3.NOMJ4.10*/
  var HARD = {
    '#f5f5f5': 'alt', 'whitesmoke': 'alt', '#eeeeee': 'alt', '#eee': 'alt',
    '#ffffff': 'bg', '#fff': 'bg', 'white': 'bg',
    '#000000': 'tx', '#000': 'tx', 'black': 'tx',
    '#333333': 'tx', '#333': 'tx', '#003163': 'tx',
    '#666666': 'ln', '#666': 'ln', '#999999': 'ln', '#999': 'ln', 'grey': 'ln', 'gray': 'ln',
    '#d3d3d3': 'cb', 'lightgrey': 'cb', 'lightgray': 'cb',
    'darkseagreen': 's2', '#8fbc8f': 's2', '#fff8dc': 's3', 'cornsilk': 's3',
    '#808080': 'ln', '#a9a9a9': 'ln', 'darkgrey': 'ln', 'darkgray': 'ln'
  };
  var HARD_RE = /#[0-9a-f]{3,6}\b|\b(?:whitesmoke|white|black|grey|gray|lightgrey|lightgray|darkgrey|darkgray|darkseagreen|cornsilk)\b/gi;

  function deHard(text) {
    return String(text == null ? '' : text).replace(HARD_RE, function (hit) {
      var k = HARD[hit.toLowerCase()];
      return k ? ('var(--nd-' + k + ')') : hit;
    });
  }

  var PAINT = ['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color'];

  function deTokenSvg(svg) {
    if (!svg) return;
    var styles = svg.querySelectorAll('style'), i;
    for (i = 0; i < styles.length; i++) {
      styles[i].textContent = deHard(deToken(styles[i].textContent));
    }
    var all = svg.querySelectorAll('*'), j, n, p, val;
    for (i = 0; i < all.length; i++) {
      n = all[i];
      for (j = 0; j < PAINT.length; j++) {
        p = PAINT[j];
        val = n.getAttribute(p);
        if (hasToken(val)) {
          n.removeAttribute(p);
          n.style.setProperty(p, deToken(val));
        } else if (val && HARD[String(val).trim().toLowerCase()]) {
          n.removeAttribute(p);
          n.style.setProperty(p, 'var(--nd-' + HARD[String(val).trim().toLowerCase()] + ')');
        }
      }
      val = n.getAttribute('style');
      if (val) {
        var fixed = deHard(deToken(val));
        if (fixed !== val) n.setAttribute('style', fixed);
      }
    }
  }

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
    if (t === 'light') return false;
    if (t) return true;
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; }
    catch (e) { return false; }
  }

  function init(m) {
    try {
      /*@3.NOMJ4.6*/
      m.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        /*@3.NOMJ4.8*/
        themeVariables: NEUTRAL,
        fontFamily: '"Thmanyah Sans","Tajawal","Segoe UI",system-ui,sans-serif',
        curve: 'basis',
        htmlLabels: false,
        flowchart: { htmlLabels: false, useMaxWidth: true, padding: 14, nodeSpacing: 46, rankSpacing: 54 },
        class: { htmlLabels: false, useMaxWidth: true },
        er: { useMaxWidth: true },
        sequence: { useMaxWidth: true, actorMargin: 46, boxMargin: 12 },
        state: { useMaxWidth: true },
        pie: { useMaxWidth: true, textPosition: 0.62 },
        gantt: { useMaxWidth: true }
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
          deTokenSvg(el);
          el.setAttribute('data-nmd', '1');
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
