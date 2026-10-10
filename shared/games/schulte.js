;(function () {
  'use strict';

  var HUES = [262, 199, 38, 152, 340, 18, 280, 172];

  function mount(ctx) {
    var t = ctx.t;
    var lv = ctx.level;
    var n = lv === '4' ? 4 : lv === '6' ? 6 : 5;
    var color = lv === '5c';
    var total = n * n;
    var cells = [];
    for (var i = 1; i <= total; i++) cells.push(i);
    for (var j = cells.length - 1; j > 0; j--) { var k = Math.floor(ctx.rng() * (j + 1)); var x = cells[j]; cells[j] = cells[k]; cells[k] = x; }
    var look = cells.map(function () {
      return color ? { h: HUES[Math.floor(ctx.rng() * HUES.length)], s: .82 + ctx.rng() * .42, r: Math.floor(ctx.rng() * 4) * 90 } : null;
    });

    var next = 1, errors = 0, startAt = 0, acc = 0, running = false, done = false, raf = 0;

    var root = document.createElement('div');
    root.className = 'gsch' + (color ? ' gsch--color' : '');
    root.style.setProperty('--n', n);
    root.innerHTML = '<div class="gsch-grid" role="grid" aria-label="' + t('جدولُ الأرقام', 'Number grid') + '">' +
      cells.map(function (v, i) {
        var st = look[i] ? ' style="--h:' + look[i].h + ';--s:' + look[i].s.toFixed(2) + ';--r:' + look[i].r + 'deg"' : '';
        return '<button type="button" class="gsch-c" data-v="' + v + '"' + st + '><span>' + v + '</span></button>';
      }).join('') + '</div>' +
      '<p class="gsch-tip">' + t('ثبّتْ نظرَك على المركز، ودَعْ الأرقامَ تأتي إلى عينك.', 'Keep your eyes on the centre and let the numbers come to you.') + '</p>';
    ctx.board.appendChild(root);
    var grid = root.querySelector('.gsch-grid');

    function elapsed() { return acc + (running ? performance.now() - startAt : 0); }
    function paint() {
      ctx.status('<span class="gm-stat"><small>' + t('التالي', 'Next') + '</small><b>' + (done ? '✓' : next) + '</b></span>' +
        '<span class="gm-stat"><small>' + t('الوقت', 'Time') + '</small><b id="gsch-time">' + ctx.fmt('time', elapsed()) + '</b></span>' +
        '<span class="gm-stat"><small>' + t('أخطاء', 'Misses') + '</small><b>' + errors + '</b></span>');
    }
    function loop() {
      var el = document.getElementById('gsch-time');
      if (el) el.textContent = ctx.fmt('time', elapsed());
      if (running) raf = requestAnimationFrame(loop);
    }
    function begin() { running = true; startAt = performance.now(); raf = requestAnimationFrame(loop); }

    function hit(btn) {
      if (done) return;
      var v = Number(btn.dataset.v);
      if (v === next) {
        if (!running) begin();
        btn.classList.add('ok');
        btn.disabled = true;
        ctx.sound('tap');
        next++;
        if (next > total) {
          running = false; done = true;
          acc = acc + performance.now() - startAt;
          cancelAnimationFrame(raf);
          paint();
          var secs = acc / 1000;
          ctx.finish({ won: true, score: Math.round(acc), detail: t('أخطاء: ', 'Misses: ') + errors + ' · ' + t('السرعة: ', 'Pace: ') + (secs / total).toFixed(2) + t('ث لكلِّ رقم', 's per number') });
          return;
        }
        paint();
      } else if (v > next) {
        errors++;
        btn.classList.remove('no'); void btn.offsetWidth; btn.classList.add('no');
        ctx.sound('bad'); ctx.haptic(30);
        paint();
      }
    }
    function onDown(e) {
      var b = e.target.closest('.gsch-c');
      if (!b || b.disabled) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      hit(b);
    }
    function onClick(e) {
      if (e.detail !== 0) return;
      var b = e.target.closest('.gsch-c');
      if (b && !b.disabled) hit(b);
    }
    grid.addEventListener('pointerdown', onDown);
    grid.addEventListener('click', onClick);
    paint();

    return {
      destroy: function () { running = false; cancelAnimationFrame(raf); grid.removeEventListener('pointerdown', onDown); grid.removeEventListener('click', onClick); },
      pause: function () {
        if (!running) return;
        acc += performance.now() - startAt; running = false; cancelAnimationFrame(raf);
        root.classList.add('gsch--hide');
      },
      resume: function () {
        root.classList.remove('gsch--hide');
        if (!done && next > 1) begin();
      },
      key: function (e) {
        var dirs = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: n, ArrowUp: -n };
        var rtl = document.documentElement.dir === 'rtl';
        if (rtl) { dirs.ArrowRight = -1; dirs.ArrowLeft = 1; }
        var btns = [].slice.call(grid.querySelectorAll('.gsch-c'));
        var i = btns.indexOf(document.activeElement);
        if (dirs[e.key] != null) {
          var to = i < 0 ? Math.floor(total / 2) : Math.max(0, Math.min(total - 1, i + dirs[e.key]));
          btns[to].focus();
          return true;
        }
        if ((e.key === 'Enter' || e.key === ' ') && i >= 0) { hit(btns[i]); return true; }
        return false;
      },
      lang: function () { paint(); var tip = root.querySelector('.gsch-tip'); if (tip) tip.textContent = t('ثبّتْ نظرَك على المركز، ودَعْ الأرقامَ تأتي إلى عينك.', 'Keep your eyes on the centre and let the numbers come to you.'); }
    };
  }

  function help(ar) {
    return ar
      ? '<ul><li>المسْ الأرقامَ من 1 حتى آخرها بالترتيب.</li><li>يبدأ الوقتُ مع لمستك الأولى.</li><li>حاولْ أن تُبقي عينيك على مركز الجدول وتلتقط الأرقامَ بطرف بصرك — هذا ما يدرّبه التمرين.</li><li>في «الملوّن» تختلف الألوانُ والزوايا لتشتيتك.</li><li>لوحةُ المفاتيح: الأسهمُ للتنقّل و<kbd>Enter</kbd> للاختيار، و<kbd>P</kbd> للإيقاف.</li></ul>'
      : '<ul><li>Tap the numbers from 1 upwards in order.</li><li>The clock starts with your first tap.</li><li>Try to keep your eyes on the centre and catch numbers with your peripheral vision — that is what this trains.</li><li>In “colour”, hues and angles change to distract you.</li><li>Keyboard: arrows to move, <kbd>Enter</kbd> to pick, <kbd>P</kbd> to pause.</li></ul>';
  }

  window.GardenGames.register('schulte', { mount: mount, help: help });
})();
