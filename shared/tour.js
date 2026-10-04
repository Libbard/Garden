(() => {
  const root = document.documentElement;
  const THEMES = ['dark', 'dim', 'light'];
  const state = {
    lang: root.lang === 'en' ? 'en' : 'ar',
    theme: THEMES.includes(root.dataset.theme) ? root.dataset.theme : 'dark',
    atlas: null, filter: 'all', query: ''
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const EN_SHOTS = new Set((document.body.dataset.enShots || '').split(' ').filter(Boolean));
  const shotSrc = id => `shared/tour-media/journey/${id}-${state.theme === 'light' ? 'light' : 'dark'}${state.lang === 'en' && EN_SHOTS.has(id) ? '-en' : ''}.webp`;
  const swapShots = () => document.querySelectorAll('img[data-shot]').forEach(img => { const s = shotSrc(img.dataset.shot); if (!img.src.endsWith(s)) img.src = s; });
  const T = (ar, en) => state.lang === 'ar' ? ar : en;
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  function localize() {
    root.lang = state.lang; root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.title = T('رحلة الطالب في الحديقة الرقمية', 'The student journey · Digital Garden');
    document.querySelectorAll('[data-ar][data-en]').forEach(n => { n.textContent = n.dataset[state.lang]; });
    document.querySelectorAll('[data-ar-alt]').forEach(n => { n.alt = n.dataset[state.lang + 'Alt']; });
    document.querySelectorAll('[data-ar-placeholder]').forEach(n => { n.placeholder = n.dataset[state.lang + 'Placeholder']; });
    document.querySelectorAll('[data-ar-title]').forEach(n => { n.setAttribute('aria-label', n.dataset[state.lang + 'Title']); });
    const lb = document.getElementById('lang-switch');
    lb.textContent = state.lang === 'ar' ? 'EN' : 'ع';
    swapShots();
    document.querySelectorAll('.stage').forEach(s => s._beat && paintHots(s, s._beat));
    renderAtlas();
  }

  function applyTheme() {
    root.dataset.theme = state.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = state.theme === 'light' ? '#f6f8f4' : state.theme === 'dim' ? '#17191e' : '#10151c';
    swapShots();
  }

  function paintHots(stage, beat) {
    const box = stage.querySelector('.stage-hots');
    let hots = [];
    try { hots = JSON.parse((state.lang === 'en' && beat.dataset.hotEn) || beat.dataset.hot || '[]'); } catch (x) {}
    box.replaceChildren(...hots.flatMap((h, i) => {
      const pin = make('span', 'hot', String(i + 1));
      pin.style.left = h.x + '%'; pin.style.top = h.y + '%';
      const out = [pin];
      const label = h[state.lang];
      if (label) {
        const tip = make('span', 'hot-tip', label);
        tip.style.left = Math.min(86, Math.max(14, h.x)) + '%'; tip.style.top = h.y + '%';
        out.push(tip);
      }
      return out;
    }));
  }

  function activate(chapter, beat) {
    const stage = chapter.querySelector('.stage');
    if (!stage || stage._beat === beat) return;
    stage._beat = beat;
    chapter.querySelectorAll('.beat').forEach(b => b.classList.toggle('is-on', b === beat));
    const img = stage.querySelector('.stage-img');
    const view = stage.querySelector('.stage-view');
    const url = stage.querySelector('.stage-url');
    const swap = () => {
      img.dataset.shot = beat.dataset.shot;
      img.width = +beat.dataset.w; img.height = +beat.dataset.h;
      view.style.aspectRatio = `${beat.dataset.w}/${beat.dataset.h}`;
      img.src = shotSrc(beat.dataset.shot);
      url.textContent = 'libbard.github.io/Garden/' + (beat.dataset.url || '');
      paintHots(stage, beat);
    };
    if (reduce.matches || img.dataset.shot === beat.dataset.shot) { swap(); return; }
    img.classList.add('is-fading');
    const done = () => { img.classList.remove('is-fading'); };
    setTimeout(() => {
      swap();
      if (img.complete) requestAnimationFrame(done); else img.addEventListener('load', done, { once: true });
    }, 180);
  }

  function initStages() {
    const wide = matchMedia('(min-width: 1000px)');
    const chapters = [...document.querySelectorAll('.chapter')];
    const io = new IntersectionObserver(entries => {
      if (!wide.matches) return;
      entries.forEach(en => {
        if (en.isIntersecting) activate(en.target.closest('.chapter'), en.target);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    chapters.forEach(ch => {
      const beats = [...ch.querySelectorAll('.beat')];
      beats.forEach(b => {
        io.observe(b);
        b.addEventListener('click', e => { if (wide.matches && !e.target.closest('a')) activate(ch, b); });
      });
      if (beats[0]) activate(ch, beats[0]);
    });
    const preload = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        preload.unobserve(en.target);
        if (!wide.matches) return;
        en.target.querySelectorAll('.beat').forEach(b => { const i = new Image(); i.decoding = 'async'; i.src = shotSrc(b.dataset.shot); });
      });
    }, { rootMargin: '600px 0px' });
    chapters.forEach(ch => preload.observe(ch));
  }

  function initNav() {
    const links = [...document.querySelectorAll('.topnav a')];
    const targets = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.toggle('is-here', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-30% 0px -65% 0px' });
    targets.forEach(t => io.observe(t));
    let ticking = false;
    const fill = document.getElementById('progress-fill');
    addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const max = root.scrollHeight - innerHeight;
        fill.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
        if (scrollY < innerHeight * .6) links.forEach(l => l.classList.remove('is-here'));
        ticking = false;
      });
    }, { passive: true });
  }

  function renderAtlas() {
    const grid = document.getElementById('atlas-grid');
    if (!state.atlas) return;
    const cats = [{ id: 'all', ar: 'الكلّ', en: 'All' }, ...state.atlas.categories];
    document.getElementById('atlas-filters').replaceChildren(...cats.map(c => {
      const b = make('button', state.filter === c.id ? 'is-on' : '', c[state.lang]);
      b.type = 'button'; b.setAttribute('aria-pressed', String(state.filter === c.id));
      b.addEventListener('click', () => { state.filter = c.id; renderAtlas(); });
      return b;
    }));
    const q = state.query.trim().toLocaleLowerCase();
    const list = state.atlas.features.filter(f => (state.filter === 'all' || f.category === state.filter) &&
      (!q || `${f.ar} ${f.en} ${f.desc_ar} ${f.desc_en}`.toLocaleLowerCase().includes(q)));
    document.getElementById('atlas-count').textContent = `${list.length} / ${state.atlas.features.length}`;
    if (!list.length) { grid.replaceChildren(make('p', 'atlas-empty', T('لا ميزةَ بهذا الاسم.', 'No feature by that name.'))); return; }
    grid.replaceChildren(...list.map(f => {
      const card = make('article', 'atlas-card');
      const cat = state.atlas.categories.find(c => c.id === f.category);
      const a = make('a', '', T('افتحها', 'Open it'));
      a.href = f.href;
      card.append(make('span', 'atlas-tag', cat ? cat[state.lang] : ''), make('h3', '', f[state.lang]), make('p', '', f['desc_' + state.lang]), a);
      return card;
    }));
  }

  function initTry() {
    const run = document.getElementById('try-ai-run');
    const out = document.getElementById('try-ai-output');
    const sample = 'https://ai.libbard.cc/ai/p2/CS231/ar/auto/56ffbd1396d19b00/1.json';
    run.addEventListener('click', async () => {
      run.disabled = true;
      out.replaceChildren(make('p', 'ai-hint', T('يصل الشرح…', 'Loading the explanation…')));
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 9000);
      try {
        const r = await fetch(sample, { mode: 'cors', credentials: 'omit', signal: ctl.signal });
        if (!r.ok) throw new Error('status');
        const j = await r.json();
        if (typeof j.text !== 'string' || j.text.trim().length < 80) throw new Error('empty');
        out.replaceChildren(...j.text.trim().split(/\n\s*\n/).map(p => make('p', '', p.replace(/\*\*/g, '').trim())));
      } catch (x) {
        out.replaceChildren(make('p', 'ai-hint', T('لم يصل الشرحُ الآن. افتحِ الوحدةَ وجرّبه هناك.', 'The explanation did not arrive. Open the module and try it there.')));
      } finally { clearTimeout(timer); run.disabled = false; }
    });

    const paper = document.getElementById('try-paper');
    const canvas = document.getElementById('try-ink');
    const ctx = canvas.getContext('2d');
    const tools = [...document.querySelectorAll('[data-try-tool]')];
    let mode = 'pen', cur = null;
    const strokes = [];
    const pt = e => { const r = canvas.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)), p: e.pressure || .5 }; };
    const ink = () => getComputedStyle(root).getPropertyValue('--accent').trim() || '#b5a6e8';
    function paint(s) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = s.mode === 'highlight' ? '#eabf32' : ink();
      ctx.globalAlpha = s.mode === 'highlight' ? .38 : .95;
      ctx.lineWidth = s.mode === 'highlight' ? 18 : 3;
      ctx.beginPath();
      s.pts.forEach((q, i) => i ? ctx.lineTo(q.x * w, q.y * h) : ctx.moveTo(q.x * w, q.y * h));
      if (s.pts.length === 1) ctx.lineTo(s.pts[0].x * w + .1, s.pts[0].y * h + .1);
      ctx.stroke(); ctx.restore();
    }
    function redraw() {
      const d = Math.min(2, devicePixelRatio || 1), w = paper.clientWidth, h = paper.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      strokes.forEach(paint); if (cur) paint(cur);
    }
    tools.forEach(b => b.addEventListener('click', () => { mode = b.dataset.tryTool; tools.forEach(t => t.classList.toggle('is-on', t === b)); }));
    document.querySelector('[data-try-act="undo"]').addEventListener('click', () => { strokes.pop(); redraw(); });
    document.querySelector('[data-try-act="clear"]').addEventListener('click', () => { strokes.length = 0; redraw(); });
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      const p = pt(e);
      if (mode === 'erase') {
        const i = strokes.findLastIndex(s => s.pts.some(q => Math.hypot((q.x - p.x) * canvas.clientWidth, (q.y - p.y) * canvas.clientHeight) < 16));
        if (i >= 0) strokes.splice(i, 1);
        redraw(); return;
      }
      cur = { mode, pts: [p] }; canvas.setPointerCapture(e.pointerId); redraw();
    });
    canvas.addEventListener('pointermove', e => { if (!cur) return; (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).forEach(c => cur.pts.push(pt(c))); redraw(); });
    const end = () => { if (!cur) return; strokes.push(cur); cur = null; redraw(); };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    new ResizeObserver(redraw).observe(paper);
  }

  document.getElementById('theme-switch').addEventListener('click', () => {
    state.theme = THEMES[(THEMES.indexOf(state.theme) + 1) % THEMES.length];
    try { localStorage.setItem('garden_theme', state.theme); } catch (x) {}
    applyTheme();
  });
  const film = document.getElementById('film');
  if (film) {
    const v = document.getElementById('film-video');
    const close = () => { v.pause(); if (film.open) film.close(); };
    document.getElementById('film-open').addEventListener('click', () => {
      const en = state.lang === 'en' && v.dataset.enSrc;
      const src = en ? v.dataset.enSrc : v.dataset.arSrc;
      if (v.getAttribute('src') !== src) { v.poster = en ? v.dataset.enPoster : v.dataset.arPoster; v.src = src; }
      film.showModal();
      v.play().catch(() => {});
    });
    document.getElementById('film-close').addEventListener('click', close);
    film.addEventListener('click', e => { if (e.target === film) close(); });
    film.addEventListener('close', () => v.pause());
  }

  document.getElementById('lang-switch').addEventListener('click', () => {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem('garden_lang', state.lang); } catch (x) {}
    localize();
  });
  document.getElementById('atlas-search').addEventListener('input', e => { state.query = e.target.value; renderAtlas(); });
  addEventListener('storage', e => {
    if (e.key === 'garden_theme' && THEMES.includes(e.newValue)) { state.theme = e.newValue; applyTheme(); }
    if (e.key === 'garden_lang' && (e.newValue === 'ar' || e.newValue === 'en')) { state.lang = e.newValue; localize(); }
  });
  fetch('shared/data/tour-features.json').then(r => r.ok ? r.json() : Promise.reject()).then(j => { state.atlas = j; renderAtlas(); })
    .catch(() => { document.getElementById('atlas-count').textContent = T('تعذّر تحميلُ الأطلس', 'Atlas unavailable'); });

  applyTheme();
  if (state.lang !== 'ar') localize();
  initStages(); initNav(); initTry();
})();
