/*@4.LAPSJ.1*/
(function (global) {
  'use strict';

  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
  var SCRIPT_SRI = 'sha384-8D3Rsfo535FqoC1pHCCQMrNf75UgzyoG/HQm9zOzITRrz3QKzecc2E7JXKGCXoWu';

  /*@4.LAPSJ.6*/
  function workerMain(scope, base) {
    var engine = null;
    scope.onmessage = function (event) {
      var job = event.data;
      if (!job || job.type !== 'run' || !engine) return;
      var started = performance.now();
      var database = new engine.Database();
      var reply = { type: 'done', id: job.id };
      try {
        /*@4.LAPSJ.3*/
        reply.results = database.exec(job.source);
        reply.changes = database.getRowsModified();
        reply.ok = true;
      } catch (error) {
        reply.ok = false;
        reply.error = String(error && error.message ? error.message : error);
      } finally {
        /*@4.LAPSJ.4*/
        try { database.close(); } catch (ignored) { /*@4.LAPSJ.5*/ }
      }
      reply.ms = Math.round(performance.now() - started);
      scope.postMessage(reply);
    };
    scope.initSqlJs({ locateFile: function (file) { return base + file; } })
      .then(function (sql) { engine = sql; scope.postMessage({ type: 'ready' }); },
        function () { scope.postMessage({ type: 'fail' }); });
  }

  var worker = null;
  var booting = null;
  var generation = 0;
  var pending = null;
  var sequence = 0;

  function reset() {
    generation += 1;
    if (worker) { try { worker.terminate(); } catch (ignored) { /*@4.LAPSJ.7*/ } }
    worker = null;
    booting = null;
  }

  function settle(job, outcome) {
    if (pending !== job) return;
    pending = null;
    job.resolve(outcome);
  }

  /*@4.LAPSJ.2*/
  function load() {
    if (booting) return booting;
    var mine = generation;
    booting = fetch(CDN + 'sql-wasm.js', { integrity: SCRIPT_SRI, mode: 'cors', credentials: 'omit' })
      .then(function (response) {
        if (!response.ok) throw new Error('offline');
        return response.text();
      }, function () { throw new Error('offline'); })
      .then(function (script) {
        if (mine !== generation) throw new Error('stopped');
        var body = script + '\n;(' + workerMain.toString() + ')(self, ' + JSON.stringify(CDN) + ');';
        var url = URL.createObjectURL(new Blob([body], { type: 'text/javascript' }));
        var made = new Worker(url);
        worker = made;
        return new Promise(function (resolve, reject) {
          made.onmessage = function (event) {
            var data = event.data || {};
            if (data.type === 'ready') { URL.revokeObjectURL(url); resolve(made); return; }
            if (data.type === 'fail') { reject(new Error('wasm')); return; }
            var job = pending;
            if (data.type === 'done' && job && data.id === job.id) {
              settle(job, data.ok
                ? { ok: true, results: data.results, changes: data.changes, ms: data.ms }
                : { ok: false, error: data.error, ms: data.ms });
            }
          };
          made.onerror = function (event) {
            if (event && event.preventDefault) event.preventDefault();
            var job = pending;
            reset();
            reject(new Error('wasm'));
            if (job) {
              settle(job, { ok: false, crashed: true, error: 'SQLite stopped unexpectedly (out of memory?)',
                ms: Math.round(performance.now() - job.started) });
            }
          };
        });
      });
    booting.catch(function () { if (mine === generation) reset(); });
    return booting;
  }

  /**
   * يُنفّذ نصَّ SQL كاملاً على قاعدةٍ **جديدةٍ في الذاكرة** لكل تشغيل، في عاملٍ مستقلّ.
   * قاعدةٌ جديدةٌ في كل مرّة = نتيجةٌ حتمية: لا يرث التشغيلُ جداولَ سابقةً
   * فيرى الطالبُ «الجدول موجودٌ سلفاً» من عمله هو.
   *
   * @returns {Promise<{ok:boolean, results?:Array, error?:string, ms:number, stopped?:boolean}>}
   */
  function run(source) {
    if (pending) stop();
    var job = { id: ++sequence, started: performance.now() };
    return new Promise(function (resolve, reject) {
      job.resolve = resolve;
      pending = job;
      load().then(function (ready) {
        if (pending !== job) return;
        ready.postMessage({ type: 'run', id: job.id, source: source });
      }, function (error) {
        if (pending !== job) return;
        pending = null;
        reject(error);
      });
    });
  }

  function stop() {
    var job = pending;
    if (!job && !booting) return false;
    reset();
    if (job) settle(job, { ok: false, stopped: true, ms: Math.round(performance.now() - job.started) });
    return true;
  }

  global.GardenSQL = {
    run: run, load: load, stop: stop,
    isReady: function () { return !!worker && !pending; }
  };
})(window);
