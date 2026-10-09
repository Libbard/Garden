(function () {
  'use strict';
  if (window.GardenMirsamLab) return;
  function en() { return (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2) === 'en'; }
  function T(ar, e) { return en() ? e : ar; }
  var raf = function () { return new Promise(function (k) { requestAnimationFrame(k); }); };
  var wait = function (ms) { return new Promise(function (k) { setTimeout(k, ms); }); };
  function stats(a) {
    if (!a || !a.length) return null;
    var s = a.slice().sort(function (x, y) { return x - y; }), sum = 0;
    for (var i = 0; i < s.length; i++) sum += s[i];
    return { avg: +(sum / s.length).toFixed(2), med: +s[s.length >> 1].toFixed(1), p95: +s[Math.min(s.length - 1, Math.floor(s.length * .95))].toFixed(1), max: +s[s.length - 1].toFixed(1), n: s.length };
  }

  async function frames(st, ms, each) {
    var S = st.S, gaps = [], last = 0, t0 = performance.now();
    S.glab = []; S.stat = null;
    while (performance.now() - t0 < ms) {
      var now = await raf();
      if (last) gaps.push(now - last);
      last = now;
      if (each) each(performance.now() - t0);
    }
    var g = S.glab || [], sp = S.stat || { px: 0, n: 0 }, gs = stats(gaps);
    S.glab = null;
    return { fps: gs ? +(1000 / gs.avg).toFixed(1) : 0, gap: gs, gpu: stats(g), kpx: sp.n ? Math.round(sp.px / sp.n / 1000) : 0 };
  }

  async function setCap(st, c) { st.dprCap = c; st.layout(); await wait(350); }

  function present(S) { S.full = S.dirty = true; S.timeBegin(); S.render(true); S.timeEnd(); }

  async function undoTo(st, n) {
    var S = st.S; if (S.dryNow) S.dryNow();
    for (var g = 0; g < 20 && S.history().steps > n; g++) { st.step(-1); await raf(); }
    return S.history().steps === n;
  }

  async function scripted(st, tool, ms) {
    var S = st.S, W = st.W, H = st.H, steps0 = S.history().steps, prevTool = st.tool, s = null, fed = 0;
    st.setTool(tool, true);
    var at = function (t) { var u = (t % 1600) / 1600, tri = u < .5 ? u * 2 : 2 - u * 2; return { x: W * (.2 + .6 * tri), y: H * (.3 + .4 * Math.min(1, t / ms)) + Math.sin(t / 90) * W * .01, p: .55 + .3 * Math.sin(t / 160) }; };
    var draw = await frames(st, ms, function (t) {
      if (!s) { s = st.begin(at(0), null, 'pen'); fed = 0; return; }
      for (var ft = fed + 1000 / 120; ft <= t; ft += 1000 / 120) { st.move(s, at(ft)); fed = ft; }
    });
    if (s) st.finish(s, true);
    var dry = tool === 'wash' ? await frames(st, 1500) : null;
    var clean = await undoTo(st, steps0);
    st.setTool(prevTool, true);
    return { draw: draw, dry: dry, clean: clean };
  }

  async function pen(st, say) {
    var r = st.root, moves = 0, samples = 0, raw = 0, pred = 0, types = {}, press = {}, ivs = [], lastT = 0, steps0 = st.S.history().steps, started = 0;
    var mv = function (e) {
      if (!started) return;
      var c = e.getCoalescedEvents ? e.getCoalescedEvents() : []; if (!c.length) c = [e];
      moves++; samples += c.length; types[e.pointerType] = (types[e.pointerType] || 0) + 1;
      if (e.getPredictedEvents) pred += e.getPredictedEvents().length;
      for (var i = 0; i < c.length; i++) { if (e.buttons && lastT && c[i].timeStamp > lastT) ivs.push(c[i].timeStamp - lastT); lastT = e.buttons ? c[i].timeStamp : 0; press[Math.round(c[i].pressure * 100)] = 1; }
    };
    var rw = function () { if (started) raw++; };
    var dn = function () { started = started || performance.now(); };
    r.addEventListener('pointerdown', dn, true); r.addEventListener('pointermove', mv, true); r.addEventListener('pointerrawupdate', rw, true);
    say(T('الآن: ارسمْ دوائرَ متّصلةً بالقلم على الرسمة 6 ثوانٍ (‏تُمحى بعدها).', 'Now: draw continuous circles with the pen on the drawing for 6 seconds (they are erased after).'));
    for (var w = 0; w < 600 && !started; w++) await wait(50);
    var fr = started ? await frames(st, 6000) : null;
    r.removeEventListener('pointerdown', dn, true); r.removeEventListener('pointermove', mv, true); r.removeEventListener('pointerrawupdate', rw, true);
    say(T('ارفعِ القلم…', 'Lift the pen…'));
    for (var u = 0; u < 100 && st.live; u++) await wait(50);
    await wait(200);
    var clean = await undoTo(st, steps0), iv = stats(ivs);
    return { got: !!started, frames: fr, moves: moves, samples: samples, perMove: moves ? +(samples / moves).toFixed(2) : 0, hz: iv ? Math.round(1000 / iv.med) : 0, interval: iv, raw: 'onpointerrawupdate' in window ? raw : 'n/a', predicted: pred, types: types, pressureLevels: Object.keys(press).length, clean: clean };
  }

  async function env(st) {
    var o = { ua: navigator.userAgent, dpr: window.devicePixelRatio, screen: screen.width + 'x' + screen.height, view: innerWidth + 'x' + innerHeight, cores: navigator.hardwareConcurrency, mem: navigator.deviceMemory || null,
      gpu: st.gpu ? st.gpu.renderer : '', timer: !!st.S.tq, tier: st.perf ? st.perf.tier : '', quality: st.quality, cap: st.dprCap, doc: st.W, attrs: st.S.gl.getContextAttributes(), brave: !!(navigator.brave), visible: document.visibilityState };
    try { var b = await navigator.getBattery(); o.battery = { charging: b.charging, level: Math.round(b.level * 100) }; } catch (e) { o.battery = 'n/a'; }
    return o;
  }

  function verdict(R) {
    var v = [], A = R.idle, B1 = R.present, B2 = R.presentLow;
    if (A && A.fps < 40) v.push(T('بلا أيِّ رسم يعرض المتصفّحُ ' + A.fps + ' إطاراً فقط ⇐ سقفٌ من المتصفّح أو ويندوز (‏توفيرُ الطاقة غالباً)، لا من المرسم.', 'With no drawing at all the browser shows only ' + A.fps + ' fps ⇒ a browser/Windows cap (usually power saving), not the studio.'));
    else if (A) v.push(T('ساكناً: ' + A.fps + ' إطاراً — لا سقفَ من المتصفّح.', 'Idle: ' + A.fps + ' fps — no browser cap.'));
    if (B1 && B2 && B2.fps > B1.fps * 1.25) v.push(T('عرضُ اللوح بدقّة الشاشة كاملةً يكلّف المتصفّحَ نفسَه: ' + B1.fps + ' ⇐ ' + B2.fps + ' إطاراً بنصف الدقّة، والبطاقةُ ' + (B1.gpu ? B1.gpu.avg : '?') + 'مل.', 'Presenting the full-resolution canvas costs the browser itself: ' + B1.fps + ' ⇒ ' + B2.fps + ' fps at half resolution; GPU ' + (B1.gpu ? B1.gpu.avg : '?') + 'ms.'));
    var W = R.wash, I = R.ink;
    if (W && I) v.push(T('المائيّ ' + W.draw.fps + ' إطاراً (‏البطاقة ' + (W.draw.gpu ? W.draw.gpu.avg : '?') + 'مل) مقابل الحبر ' + I.draw.fps + ' (‏' + (I.draw.gpu ? I.draw.gpu.avg : '?') + 'مل).', 'Watercolor ' + W.draw.fps + ' fps (GPU ' + (W.draw.gpu ? W.draw.gpu.avg : '?') + 'ms) vs ink ' + I.draw.fps + ' (' + (I.draw.gpu ? I.draw.gpu.avg : '?') + 'ms).'));
    if (R.pen && R.pen.got) v.push(T('القلم: ' + R.pen.hz + ' عيّنةً في الثانية من العتاد، و' + R.pen.perMove + ' عيّنةً لكلِّ حدث.', 'Pen: ' + R.pen.hz + ' samples/s from the hardware, ' + R.pen.perMove + ' samples per event.'));
    return v;
  }

  async function run(st) {
    if (!st || !st.S || st._labRun) return;
    st._labRun = true;
    var box = document.createElement('div'), msg, out, R = { v: 1, at: new Date().toISOString() }, cap0 = st.dprCap;
    box.className = 'mrs-lab'; box.setAttribute('dir', en() ? 'ltr' : 'rtl');
    box.style.cssText = 'position:absolute;z-index:10;inset-block-start:3.6rem;inset-inline-start:50%;transform:translateX(' + (en() ? '-50%' : '50%') + ');inline-size:min(34rem,calc(100% - 2rem));max-block-size:calc(100% - 5rem);overflow:auto;padding:.8rem 1rem;border-radius:12px;background:var(--bg-card,#fff);color:var(--text-primary,#111);box-shadow:0 18px 40px -16px rgba(0,0,0,.55);font-size:.9rem';
    box.innerHTML = '<b></b><p style="margin:.4rem 0"></p><textarea dir="ltr" readonly rows="8" style="display:block;inline-size:100%;box-sizing:border-box;font:11px/1.45 ui-monospace,monospace;margin:.4rem 0;user-select:text;-webkit-user-select:text" hidden></textarea><div style="display:flex;gap:.5rem"><button type="button" data-a="copy" hidden></button><button type="button" data-a="close"></button></div>';
    box.querySelector('b').textContent = T('اختبارُ المرسم المفصّل', 'Studio detailed test');
    msg = box.querySelector('p'); out = box.querySelector('textarea'); box.style.userSelect = 'text';
    var copy = box.querySelector('[data-a="copy"]'), close = box.querySelector('[data-a="close"]');
    copy.textContent = T('انسخِ التقرير', 'Copy report'); close.textContent = T('أغلق', 'Close');
    close.onclick = function () { box.remove(); };
    var done = function () { copy.textContent = T('نُسخ ✓', 'Copied ✓'); };
    var legacy = function () { out.focus(); out.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} if (ok) done(); else copy.textContent = T('حُدِّد النصّ — اضغط Ctrl+C', 'Text selected — press Ctrl+C'); };
    copy.onclick = function () { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out.value).then(done, legacy); else legacy(); };
    st.root.appendChild(box);
    var say = function (t) { msg.textContent = t; };
    try {
      say(T('لا تلمسِ الشاشة — يرسم الاختبارُ خطوطاً ويمحوها (‏نحو 30 ثانية)…', 'Do not touch the screen — the test draws lines and erases them (about 30 seconds)…'));
      R.env = await env(st);
      await wait(600);
      say(T('١/٥ الإطاراتُ ساكناً…', '1/5 idle frames…')); R.idle = await frames(st, 3000);
      say(T('٢/٥ كلفةُ عرض اللوح…', '2/5 canvas present cost…'));
      R.present = await frames(st, 3000, function () { present(st.S); });
      if (cap0 > 1) { await setCap(st, 1); R.presentLow = await frames(st, 3000, function () { present(st.S); }); await setCap(st, cap0); }
      say(T('٣/٥ قلمُ الحبر بخطٍّ مبرمج…', '3/5 scripted ink stroke…')); R.ink = await scripted(st, 'ink', 3000);
      say(T('٤/٥ الألوانُ المائيّة بخطٍّ مبرمج…', '4/5 scripted watercolor stroke…')); R.wash = await scripted(st, 'wash', 3000);
      if (cap0 > 1) { await setCap(st, 1); R.washLow = await scripted(st, 'wash', 3000); await setCap(st, cap0); }
      R.pen = await pen(st, say);
    } catch (e) { R.error = String(e && e.message || e); }
    if (st.dprCap !== cap0) await setCap(st, cap0);
    st._labRun = false;
    R.verdict = verdict(R);
    say(R.verdict.join(' '));
    out.value = JSON.stringify(R);
    out.hidden = false; copy.hidden = false;
    st.kick();
    return R;
  }

  window.GardenMirsamLab = { run: run };
})();
