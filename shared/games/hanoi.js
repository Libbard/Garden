;(function () {
  'use strict';

  function init(n) {
    var a = [];
    for (var s = n; s >= 1; s--) a.push(s);
    return [a, [], []];
  }
  function top(peg) { return peg.length ? peg[peg.length - 1] : 0; }
  function isPeg(i) { return typeof i === 'number' && (i | 0) === i && i >= 0 && i <= 2; }
  function canMove(pegs, from, to) {
    if (!isPeg(from) || !isPeg(to) || from === to) return false;
    var a = pegs[from], b = pegs[to];
    if (!a.length) return false;
    return !b.length || top(b) > top(a);
  }
  function applyMove(pegs, from, to) {
    if (!canMove(pegs, from, to)) return null;
    var next = pegs.map(function (p) { return p.slice(); });
    next[to].push(next[from].pop());
    return next;
  }
  function fullOn(pegs, n, i) {
    var p = pegs[i];
    if (p.length !== n) return false;
    for (var k = 0; k < n; k++) if (p[k] !== n - k) return false;
    return true;
  }
  function isWon(pegs, n) { return fullOn(pegs, n, 2); }
  function minMoves(n) { return Math.pow(2, n) - 1; }
  function replay(n, h) {
    if (!Array.isArray(h)) return null;
    var pegs = init(n);
    for (var i = 0; i < h.length; i++) {
      var m = h[i];
      if (!Array.isArray(m) || m.length !== 2) return null;
      pegs = applyMove(pegs, m[0], m[1]);
      if (!pegs) return null;
    }
    return pegs;
  }
  function undo(pegs, h) {
    if (!h.length) return null;
    var m = h[h.length - 1];
    var back = applyMove(pegs, m[1], m[0]);
    return back ? { pegs: back, h: h.slice(0, -1) } : null;
  }

  function mount(ctx) {
    var t = ctx.t;
    var n = Math.max(3, Math.min(7, parseInt(ctx.level, 10) || 3));
    var MIN = minMoves(n);
    var R = n + 2.5, BASE = 0.7, LIFT = 0.15;
    var F = Math.min(0.125, 0.7 / R);

    var pegs = init(n), hist = [], lifted = -1, over = -1, cur = 0, kb = false, done = false;
    var acc = 0, startAt = 0, running = false, timer = 0, msgTimer = 0, ptr = null;

    function el(tag, cls, parent) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (parent) parent.appendChild(e);
      return e;
    }

    var root = el('div', 'ghn' + (ctx.reduced ? ' ghn--still' : ''));
    root.style.setProperty('--h', (R * F).toFixed(4));
    root.style.setProperty('--ar', '1 / ' + (R * F).toFixed(4));
    root.style.setProperty('--sar', (1 / 3).toFixed(5) + ' / ' + F.toFixed(5));
    root.style.setProperty('--row', (100 / R).toFixed(4) + '%');
    root.style.setProperty('--rod', (n + 0.6).toFixed(2));
    var boardEl = el('div', 'ghn-board', root);
    boardEl.setAttribute('role', 'group');
    el('div', 'ghn-base', boardEl).setAttribute('aria-hidden', 'true');
    var pegsWrap = el('div', 'ghn-pegs', boardEl);
    var pegEls = [0, 1, 2].map(function (i) {
      var b = el('button', 'ghn-peg', pegsWrap);
      b.type = 'button';
      b.setAttribute('data-p', String(i));
      return b;
    });
    var discsWrap = el('div', 'ghn-discs', boardEl);
    discsWrap.setAttribute('aria-hidden', 'true');
    var slots = [null];
    for (var s = 1; s <= n; s++) {
      var sl = el('div', 'ghn-slot', discsWrap);
      var dk = el('span', 'ghn-disc', sl);
      var f = (s - 1) / (n - 1);
      dk.style.setProperty('--w', (30 + f * 64).toFixed(2) + '%');
      dk.style.setProperty('--hue', Math.round(6 + f * 262));
      slots.push(sl);
    }
    var labels = el('div', 'ghn-labels', root);
    labels.setAttribute('aria-hidden', 'true');
    var labelEls = [0, 1, 2].map(function (i) {
      var sp = el('span', i === 2 ? 'ghn-goal' : '', labels);
      sp.innerHTML = (i === 2 ? '<i class="fa-solid fa-flag-checkered" aria-hidden="true"></i> ' : '') + (i + 1);
      return sp;
    });
    var msgEl = el('p', 'ghn-msg', root);
    msgEl.setAttribute('aria-live', 'polite');
    ctx.board.appendChild(root);

    var acts = el('div', 'ghn-acts', ctx.controls);
    var undoBtn = el('button', 'gsf-btn ghn-undo', acts);
    undoBtn.type = 'button';

    function elapsed() { return acc + (running ? performance.now() - startAt : 0); }
    function tick() { var e = document.getElementById('ghn-time'); if (e) e.textContent = ctx.fmt('time', elapsed()); }
    function begin() {
      if (running || done) return;
      running = true; startAt = performance.now();
      timer = setInterval(tick, 200);
    }
    function stop() {
      if (!running) return;
      acc += performance.now() - startAt; running = false;
      clearInterval(timer); timer = 0;
    }

    function stat(label, val, id) {
      return '<span class="gm-stat"><small>' + label + '</small><b' + (id ? ' id="' + id + '"' : '') + '>' + val + '</b></span>';
    }
    function paint() {
      ctx.status(stat(t('الحركات', 'Moves'), ctx.fmt('moves', hist.length)) +
        stat(t('الحدُّ الأدنى', 'Minimum'), ctx.fmt('moves', MIN)) +
        stat(t('الوقت', 'Time'), ctx.fmt('time', elapsed()), 'ghn-time'));
    }

    function pegName(i) {
      return [t('العمودُ الأيسر', 'Left peg'), t('العمودُ الأوسط', 'Middle peg'), t('العمودُ الأيمن، الهدف', 'Right peg, the goal')][i];
    }
    function pegLabel(i) {
      var c = pegs[i].length, sep = t('، ', ', ');
      return pegName(i) + ' (' + (i + 1) + ')' + sep + t('الأقراص: ', 'discs: ') + c +
        (c ? sep + t('العلويُّ بحجم ', 'top disc size ') + top(pegs[i]) : '') +
        (lifted === i ? sep + t('قرصُه مرفوع', 'its disc is lifted') : '');
    }

    function render() {
      for (var p = 0; p < 3; p++) {
        for (var k = 0; k < pegs[p].length; k++) {
          var e = slots[pegs[p][k]];
          var up = p === lifted && k === pegs[p].length - 1;
          e.style.setProperty('--p', String(up ? over : p));
          e.style.setProperty('--y', (up ? LIFT : R - BASE - 1 - k).toFixed(3));
          e.classList.toggle('ghn-up', up);
        }
      }
      for (var i = 0; i < 3; i++) {
        pegEls[i].classList.toggle('ghn-cur', kb && i === (lifted >= 0 ? over : cur));
        pegEls[i].setAttribute('aria-label', pegLabel(i));
        labelEls[i].classList.toggle('ghn-on', kb && i === (lifted >= 0 ? over : cur));
      }
      undoBtn.disabled = done || !hist.length;
    }

    function hint() {
      if (done) return t('أحسنت! انتقل البرجُ كلُّه إلى العمود الأيمن.', 'Well done! The whole tower is on the right peg.');
      if (lifted >= 0) return t('ضعْه على عمودٍ آخر، أو المسْ عمودَه ليعودَ مكانَه.', 'Drop it on another peg, or tap its own peg to put it back.');
      if (hist.length && (fullOn(pegs, n, 0) || fullOn(pegs, n, 1))) return t('البرجُ مكتملٌ هنا، لكنّ الهدفَ هو العمودُ الأيمن.', 'The tower is complete here, but the goal is the right peg.');
      return t('المسْ عموداً لترفعَ قرصَه العلويّ، ثمّ المسْ عموداً آخرَ لتضعَه فيه — أو اسحبِ القرص.', 'Tap a peg to lift its top disc, then tap another peg to drop it — or drag the disc.');
    }
    function say(text, bad) {
      clearTimeout(msgTimer); msgTimer = 0;
      msgEl.textContent = text;
      msgEl.classList.toggle('ghn-bad', !!bad);
      if (bad) msgTimer = setTimeout(function () { say(hint()); }, 1800);
    }
    function texts() {
      boardEl.setAttribute('aria-label', t('برجُ هانوي: ثلاثةُ أعمدة', 'Tower of Hanoi: three pegs'));
      undoBtn.innerHTML = '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> <span>' + t('تراجع', 'Undo') + '</span>';
      undoBtn.setAttribute('aria-label', t('تراجعْ عن الحركة الأخيرة', 'Undo the last move'));
    }

    function persist() {
      if (done) return;
      ctx.save({ n: n, h: hist, ms: Math.round(elapsed()) });
    }
    function restore(st) {
      if (!st || st.n !== n) return false;
      var p = replay(n, st.h);
      if (!p || isWon(p, n)) return false;
      pegs = p;
      hist = st.h.map(function (m) { return [m[0], m[1]]; });
      acc = Math.max(0, Number(st.ms) || 0);
      return true;
    }

    function shake(slot) {
      if (ctx.reduced || !slot) return;
      var d = slot.firstChild;
      d.classList.remove('ghn-no'); void d.offsetWidth; d.classList.add('ghn-no');
    }
    function flash(peg) {
      peg.classList.add('ghn-badp');
      setTimeout(function () { peg.classList.remove('ghn-badp'); }, 450);
    }

    function lift(p) {
      if (!pegs[p].length) return false;
      lifted = p; over = p;
      begin();
      ctx.sound('tap'); ctx.haptic(8);
      return true;
    }
    function putBack() { lifted = -1; over = -1; }

    function finishGame() {
      done = true; stop(); ctx.clearSave();
      root.classList.add('ghn--won');
      render(); paint(); say(hint());
      var optimal = hist.length === MIN;
      ctx.finish({ won: true, score: hist.length, detail: optimal ? t('حلٌّ مثاليّ!', 'Perfect solution!') : t('الحدُّ الأدنى: ', 'Minimum: ') + MIN });
    }
    function tryMove(from, to, dragged) {
      var next = applyMove(pegs, from, to);
      if (!next) {
        if (dragged) putBack();
        render();
        shake(slots[top(pegs[from])]); if (isPeg(to)) flash(pegEls[to]);
        ctx.sound('bad'); ctx.haptic(30);
        say(t('لا يوضع قرصٌ على قرصٍ أصغرَ منه.', 'A disc can’t go on a smaller one.'), true);
        return false;
      }
      pegs = next; hist.push([from, to]); putBack();
      ctx.sound('merge'); ctx.haptic(10);
      if (isWon(pegs, n)) { finishGame(); return true; }
      render(); paint(); persist(); say(hint());
      return true;
    }
    function tapPeg(p) {
      if (done) return;
      if (lifted < 0) {
        if (lift(p)) { render(); say(hint()); }
        return;
      }
      if (p === lifted) { putBack(); render(); say(hint()); return; }
      tryMove(lifted, p, false);
    }
    function doUndo() {
      if (done || !hist.length) return;
      cancelDrag(); putBack();
      var r = undo(pegs, hist);
      if (!r) return;
      pegs = r.pegs; hist = r.h;
      ctx.sound('tap');
      render(); paint(); persist(); say(hint());
    }

    function pegAt(x) {
      var r = boardEl.getBoundingClientRect();
      var i = Math.floor((x - r.left) / (r.width / 3));
      return Math.max(0, Math.min(2, i));
    }
    function place(slot, x, y, touch) {
      var r = boardEl.getBoundingClientRect();
      var sw = r.width / 3, sh = r.width * F;
      var dx = x - r.left - sw / 2, dy = y - r.top - sh / 2 - (touch ? sh * 0.9 : 0);
      slot.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    }
    function endDrag(slot) { if (!slot) return; slot.classList.remove('ghn-drag'); slot.style.transform = ''; }
    function cancelDrag() {
      if (!ptr) return;
      var p0 = ptr; ptr = null;
      try { boardEl.releasePointerCapture(p0.id); } catch (er) {}
      if (p0.drag) { endDrag(p0.el); putBack(); render(); say(hint()); }
    }

    function onDown(e) {
      if (done || ptr) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      var p = pegAt(e.clientX);
      var src = lifted >= 0 ? (p === lifted ? lifted : -1) : (pegs[p].length ? p : -1);
      ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, p: p, src: src, drag: false, touch: e.pointerType !== 'mouse', el: null };
      try { boardEl.setPointerCapture(e.pointerId); } catch (er) {}
      if (kb) { kb = false; render(); }
    }
    function onMove(e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      if (!ptr.drag) {
        if (ptr.src < 0) return;
        var dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
        if (dx * dx + dy * dy < 64) return;
        ptr.drag = true;
        if (lifted < 0) lift(ptr.src);
        over = ptr.src;
        ptr.el = slots[top(pegs[ptr.src])];
        ptr.el.classList.add('ghn-drag');
        render(); say(hint());
      }
      place(ptr.el, e.clientX, e.clientY, ptr.touch);
    }
    function onUp(e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      var p0 = ptr; ptr = null;
      if (p0.drag) {
        endDrag(p0.el);
        var to = pegAt(e.clientX);
        if (to === p0.src) { putBack(); render(); say(hint()); return; }
        tryMove(p0.src, to, true);
        return;
      }
      tapPeg(p0.p);
    }
    function onCancel(e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      cancelDrag();
    }
    function onClick(e) {
      if (e.detail !== 0) return;
      var b = e.target.closest ? e.target.closest('.ghn-peg') : null;
      if (b) tapPeg(Number(b.getAttribute('data-p')));
    }
    function onUndoClick() { doUndo(); }
    function onCtx(e) { e.preventDefault(); }

    function choose(i) {
      kb = true; cur = i;
      if (lifted >= 0) over = i;
      render();
      try { pegEls[i].focus({ preventScroll: true }); } catch (er) {}
    }

    if (!restore(ctx.load())) { pegs = init(n); hist = []; acc = 0; }
    texts(); render(); paint(); say(hint());

    boardEl.addEventListener('pointerdown', onDown);
    boardEl.addEventListener('pointermove', onMove);
    boardEl.addEventListener('pointerup', onUp);
    boardEl.addEventListener('pointercancel', onCancel);
    boardEl.addEventListener('lostpointercapture', onCancel);
    boardEl.addEventListener('click', onClick);
    boardEl.addEventListener('contextmenu', onCtx);
    undoBtn.addEventListener('click', onUndoClick);

    return {
      destroy: function () {
        stop(); clearTimeout(msgTimer); ptr = null;
        boardEl.removeEventListener('pointerdown', onDown);
        boardEl.removeEventListener('pointermove', onMove);
        boardEl.removeEventListener('pointerup', onUp);
        boardEl.removeEventListener('pointercancel', onCancel);
        boardEl.removeEventListener('lostpointercapture', onCancel);
        boardEl.removeEventListener('click', onClick);
        boardEl.removeEventListener('contextmenu', onCtx);
        undoBtn.removeEventListener('click', onUndoClick);
      },
      pause: function () {
        cancelDrag();
        if (running) { stop(); persist(); }
      },
      resume: function () {
        if (!done && (hist.length || lifted >= 0)) begin();
        tick();
      },
      key: function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        if (done) return false;
        var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
        var d = { '1': 0, '2': 1, '3': 2 }[k];
        if (d == null && /^Digit[123]$/.test(e.code || '')) d = Number(e.code.slice(5)) - 1;
        if (d == null && /^Numpad[123]$/.test(e.code || '')) d = Number(e.code.slice(6)) - 1;
        if (d != null) { cancelDrag(); choose(d); tapPeg(d); render(); return true; }
        var at = lifted >= 0 ? over : cur;
        if (k === 'ArrowLeft' || k === 'ArrowRight') {
          cancelDrag();
          choose(Math.max(0, Math.min(2, at + (k === 'ArrowRight' ? 1 : -1))));
          return true;
        }
        if (k === ' ' || k === 'Enter' || k === 'ArrowDown' || k === 'ArrowUp') {
          cancelDrag();
          if (k === 'ArrowUp' && lifted >= 0) return true;
          choose(at); tapPeg(at); render();
          return true;
        }
        if (k === 'u' || k === 'z' || k === 'Backspace' || e.code === 'KeyU' || e.code === 'KeyZ') { doUndo(); return true; }
        if (k === 'Escape' && lifted >= 0) { cancelDrag(); putBack(); render(); say(hint()); return true; }
        return false;
      },
      lang: function () { texts(); render(); paint(); say(hint()); }
    };
  }

  function help(ar) {
    return ar
      ? '<ul>' +
          '<li>الهدف: انقلِ البرجَ كلَّه من العمود الأيسر إلى العمود الأيمن (رقم 3).</li>' +
          '<li>حرّكْ قرصاً واحداً في كلِّ مرّة، والقرصَ العلويَّ وحدَه.</li>' +
          '<li>لا يوضع قرصٌ على قرصٍ أصغرَ منه؛ والحركةُ الممنوعة تُرفض ولا تُحسب.</li>' +
          '<li>إعادةُ بناء البرج على العمود الأوّل أو الأوسط لا تُنهي اللعبة — الفوزُ على العمود الأيمن وحدَه.</li>' +
          '<li>أقلُّ عددٍ من الحركات 2ⁿ − 1: سبعٌ لثلاثة أقراص، و127 لسبعة. والتراجعُ يُلغي الحركةَ الأخيرة.</li>' +
          '<li>باللمس أو الفأرة: المسْ عموداً لترفعَ قرصَه العلويّ، ثمّ المسْ العمودَ الذي تضعه فيه (والعمودَ نفسَه ليعود) — أو اسحبِ القرصَ وأفلتْه فوق العمود.</li>' +
          '<li>لوحةُ المفاتيح: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> لرفع قرص العمود ثمّ لوضعه، أو <kbd>←</kbd> <kbd>→</kbd> لاختيار العمود و<kbd>Space</kbd> أو <kbd>Enter</kbd> للرفع والوضع؛ <kbd>Esc</kbd> يعيد القرصَ المرفوع، <kbd>U</kbd> للتراجع، <kbd>P</kbd> للإيقاف.</li>' +
        '</ul>'
      : '<ul>' +
          '<li>Goal: move the whole tower from the left peg to the right peg (number 3).</li>' +
          '<li>Move one disc at a time, and only the top disc.</li>' +
          '<li>A disc can never go on a smaller one; an illegal move is rejected and not counted.</li>' +
          '<li>Rebuilding the tower on the first or middle peg does not end the game — only the right peg wins.</li>' +
          '<li>The fewest moves possible is 2ⁿ − 1: 7 for three discs, 127 for seven. Undo takes back the last move.</li>' +
          '<li>Touch or mouse: tap a peg to lift its top disc, then tap the peg to drop it on (tap the same peg to put it back) — or drag the disc and release it over a peg.</li>' +
          '<li>Keyboard: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> to lift from a peg and then drop on one, or <kbd>←</kbd> <kbd>→</kbd> to choose a peg and <kbd>Space</kbd> or <kbd>Enter</kbd> to lift and drop; <kbd>Esc</kbd> puts a lifted disc back, <kbd>U</kbd> undoes, <kbd>P</kbd> pauses.</li>' +
        '</ul>';
  }

  window.GardenGames.register('hanoi', {
    mount: mount, help: help,
    _t: { init: init, top: top, canMove: canMove, applyMove: applyMove, isWon: isWon, fullOn: fullOn, minMoves: minMoves, replay: replay, undo: undo }
  });
})();
