/*@4.LAPPJ.1*/
(function (global) {
  'use strict';

  var VERSION = 'v0.28.0';
  var CDN = 'https://cdn.jsdelivr.net/pyodide/' + VERSION + '/full/';
  var LOADER_SRI = 'sha384-aD6ek5pFVnSSMGK0qubk9ZJdMYGjPs8F6jdJaDJiyZbTcH9jLWR4LJNJ7yY430qI';
  var OUTPUT_LINES = 5000;

  /*@4.LAPPJ.2*/
  function studentTraceback(message) {
    var lines = String(message).split('\n');
    var first = -1;
    for (var i = 0; i < lines.length; i += 1) {
      if (lines[i].indexOf('File "<exec>"') !== -1) { first = i; break; }
    }
    if (first === -1) return message.trim();
    var kept = lines.slice(first).filter(function (line) { return line.trim().length; });
    kept.unshift('Traceback (most recent call last):');
    return kept.join('\n');
  }

  /*@4.LAPPJ.3*/
  var PACKAGES = {
    numpy: 'numpy', pandas: 'pandas', scipy: 'scipy', sympy: 'sympy',
    matplotlib: 'matplotlib', networkx: 'networkx', regex: 'regex',
    PIL: 'pillow', bs4: 'beautifulsoup4', sklearn: 'scikit-learn',
    lxml: 'lxml', yaml: 'pyyaml', dateutil: 'python-dateutil',
    pytz: 'pytz', six: 'six', attr: 'attrs',
    /*@4.LAPPJ.7*/
    nltk: 'nltk', Crypto: 'pycryptodome', cryptography: 'cryptography', statsmodels: 'statsmodels',
    /*@4.LAPPJ.12*/
    sqlite3: 'sqlite3'
  };
  var FROM_PYPI = { seaborn: 'seaborn' };

  /*@4.LAPPJ.4*/
  function neededPackages(source) {
    var clean = String(source)
      .replace(/#[^\n]*/g, ' ')
      .replace(/"""[\s\S]*?"""/g, ' ')
      .replace(/'''[\s\S]*?'''/g, ' ');
    var wanted = {};
    var pattern = /^[ \t]*(?:import|from)[ \t]+([A-Za-z_][\w.]*)/gm;
    var hit;
    while ((hit = pattern.exec(clean))) {
      var root = hit[1].split('.')[0];
      if (PACKAGES[root]) wanted[PACKAGES[root]] = true;
      if (FROM_PYPI[root]) { wanted['pypi:' + FROM_PYPI[root]] = true; wanted.matplotlib = true; wanted.pandas = true; wanted.scipy = true; }
    }
    return Object.keys(wanted);
  }

  /*@4.LAPPJ.9*/
  function workerMain(scope, indexURL, outputLines) {
    var PLOT_SETUP = [
      'import os', "os.environ['MPLBACKEND'] = 'AGG'", 'import matplotlib', "matplotlib.use('AGG')",
      'import matplotlib.pyplot as _garden_plt', "_garden_plt.close('all')",
      '_garden_plt.show = lambda *a, **k: None'
    ].join('\n');
    var PLOT_COLLECT = [
      'import io as _gio, base64 as _gb64, matplotlib.pyplot as _gplt',
      '_garden_figs = []',
      'for _n in _gplt.get_fignums()[:6]:',
      '    _buf = _gio.BytesIO()',
      "    _gplt.figure(_n).savefig(_buf, format='png', dpi=100, bbox_inches='tight')",
      '    _garden_figs.append(_gb64.b64encode(_buf.getvalue()).decode())',
      "_gplt.close('all')",
      "' '.join(_garden_figs)"
    ].join('\n');
    var py = null;

    function collectPlots() {
      try {
        var joined = String(py.runPython(PLOT_COLLECT) || '');
        return joined ? joined.split(' ') : [];
      } catch (error) { return []; }
    }

    function prepare(job) {
      var wanted = job.packages || [];
      if (!wanted.length) return Promise.resolve(wanted);
      var pypi = wanted.filter(function (name) { return name.indexOf('pypi:') === 0; }).map(function (name) { return name.slice(5); });
      var local = wanted.filter(function (name) { return name.indexOf('pypi:') !== 0; });
      if (pypi.length) local.push('micropip');
      scope.postMessage({ type: 'progress', id: job.id, stage: 'packages',
        packages: local.filter(function (n) { return n !== 'micropip'; }).concat(pypi) });
      /*@4.LAPPJ.5*/
      return py.loadPackage(local).then(function () {
        if (!pypi.length) return wanted;
        return py.runPythonAsync('import micropip\nawait micropip.install(' + JSON.stringify(pypi) + ')')
          .then(function () { return wanted; }, function () { return wanted; });
      }, function () { return wanted; });
    }

    function execute(job, wanted) {
      var started = performance.now();
      var sent = 0;
      var cut = false;
      var emit = function (text, kind) {
        if (cut) return;
        if (sent >= outputLines) { cut = true; scope.postMessage({ type: 'cut', id: job.id }); return; }
        sent += 1;
        scope.postMessage({ type: 'out', id: job.id, text: text, kind: kind });
      };
      var lines = String(job.stdin || '').split('\n');
      var at = 0;
      py.setStdout({ batched: function (text) { emit(text); } });
      py.setStderr({ batched: function (text) { emit(text, 'err'); } });
      py.setStdin({ stdin: function () { return at < lines.length ? lines[at++] : null; } });
      /*@4.LAPPJ.8*/
      var plots = wanted.indexOf('matplotlib') !== -1;
      if (plots) {
        try { py.runPython(PLOT_SETUP); } catch (ignored) { plots = false; }
      }
      var namespace = py.globals.get('dict')();
      scope.postMessage({ type: 'progress', id: job.id, stage: 'run' });
      var reply = { type: 'done', id: job.id, ok: true };
      try {
        py.runPython(job.source, { globals: namespace });
      } catch (error) {
        reply.ok = false;
        reply.error = String(error && error.message ? error.message : error);
      } finally {
        try { namespace.destroy(); } catch (ignored) { /*@4.LAPPJ.6*/ }
      }
      reply.images = plots ? collectPlots() : [];
      reply.ms = Math.round(performance.now() - started);
      scope.postMessage(reply);
    }

    scope.onmessage = function (event) {
      var job = event.data;
      if (!job || job.type !== 'run' || !py) return;
      prepare(job).then(function (wanted) { execute(job, wanted); });
    };
    scope.loadPyodide({ indexURL: indexURL }).then(function (runtime) {
      py = runtime;
      scope.postMessage({ type: 'ready' });
    }, function () { scope.postMessage({ type: 'fail' }); });
  }

  var worker = null;
  var booting = null;
  var generation = 0;
  var pending = null;
  var sequence = 0;

  function reset() {
    generation += 1;
    if (worker) { try { worker.terminate(); } catch (ignored) { /*@4.LAPPJ.10*/ } }
    worker = null;
    booting = null;
  }

  function settle(job, outcome) {
    if (pending !== job) return;
    pending = null;
    job.resolve(outcome);
  }

  function route(data) {
    var job = pending;
    if (!job || data.id !== job.id) return;
    if (data.type === 'progress') { if (job.onProgress) job.onProgress(data.stage, data.packages); return; }
    if (data.type === 'out') { job.out.push({ text: data.text, kind: data.kind }); return; }
    if (data.type === 'cut') { job.cut = true; return; }
    if (data.type === 'done') {
      settle(job, {
        ok: data.ok, out: job.out, cut: job.cut, images: data.images || [], ms: data.ms,
        error: data.ok ? undefined : studentTraceback(data.error)
      });
    }
  }

  function load(onProgress) {
    if (booting) return booting;
    var mine = generation;
    if (onProgress) onProgress('script');
    booting = fetch(CDN + 'pyodide.js', { integrity: LOADER_SRI, mode: 'cors', credentials: 'omit' })
      .then(function (response) {
        if (!response.ok) throw new Error('offline');
        return response.text();
      }, function () { throw new Error('offline'); })
      .then(function (loader) {
        if (mine !== generation) throw new Error('stopped');
        if (onProgress) onProgress('runtime');
        var body = loader + '\n;(' + workerMain.toString() + ')(self, ' + JSON.stringify(CDN) + ', ' + OUTPUT_LINES + ');';
        var url = URL.createObjectURL(new Blob([body], { type: 'text/javascript' }));
        var made = new Worker(url);
        worker = made;
        return new Promise(function (resolve, reject) {
          made.onmessage = function (event) {
            var data = event.data || {};
            if (data.type === 'ready') { URL.revokeObjectURL(url); resolve(made); return; }
            if (data.type === 'fail') { reject(new Error('wasm')); return; }
            route(data);
          };
          made.onerror = function (event) {
            if (event && event.preventDefault) event.preventDefault();
            var job = pending;
            reset();
            reject(new Error('wasm'));
            if (job) {
              settle(job, { ok: false, out: job.out, cut: job.cut, images: [], crashed: true,
                ms: Math.round(performance.now() - job.started) });
            }
          };
        });
      });
    booting.catch(function () { if (mine === generation) reset(); });
    return booting;
  }

  /**
   * يُنفّذ برنامجاً كاملاً في عاملٍ مستقلّ ويلتقط stdout/stderr.
   *
   * 🔴 **مساحةُ أسماءٍ جديدةٌ لكل تشغيل**: بدونها يرث التشغيلُ متغيّراتِ
   *    ما قبله، فيعمل كودٌ ناقصٌ عند الطالب ويفشل عند غيره — وهو أسوأُ
   *    أنواع الخطأ لأنه يُعلّم الخطأ.
   *
   * @param {string} source
   * @param {string} stdin ما يقرؤه `input()`
   */
  function run(source, stdin, onProgress) {
    if (pending) stop();
    var job = { id: ++sequence, out: [], cut: false, started: performance.now(), onProgress: onProgress };
    return new Promise(function (resolve, reject) {
      job.resolve = resolve;
      pending = job;
      load(onProgress).then(function (ready) {
        if (pending !== job) return;
        ready.postMessage({ type: 'run', id: job.id, source: source, stdin: stdin || '', packages: neededPackages(source) });
      }, function (error) {
        if (pending !== job) return;
        pending = null;
        reject(error);
      });
    });
  }

  /*@4.LAPPJ.11*/
  function stop() {
    var job = pending;
    if (!job && !booting) return null;
    reset();
    if (!job) return { ok: false, stopped: true, out: [], images: [] };
    var outcome = { ok: false, stopped: true, out: job.out, cut: job.cut, images: [],
      ms: Math.round(performance.now() - job.started) };
    settle(job, outcome);
    return outcome;
  }

  global.GardenPython = {
    run: run, load: load, stop: stop, version: VERSION,
    isReady: function () { return !!worker && !pending; }
  };
})(window);
