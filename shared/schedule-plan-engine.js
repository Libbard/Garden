/*@3.SCPEJ.1*/
;(function (root) {
  'use strict';

  var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var GAP = 15;
  var SPACING_TIERS = ['full', 'lite', 'off'];
  var SPACING_OFFSETS = { full: [3, 7], lite: [3], off: [] };
  var MAX_SPD = 10;
  var PRE_EXAM = 30, POST_EXAM = 30, EXAM_LEN = 120, WARM_MIN = 45;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toUTC(s) {
    var p = String(s).split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }
  function fromUTC(t) {
    var d = new Date(t);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }
  function addDays(s, n) { return fromUTC(toUTC(s) + n * 86400000); }
  function diffDays(a, b) { return Math.round((toUTC(b) - toUTC(a)) / 86400000); }
  function dayName(s) { return DAYS[new Date(toUTC(s)).getUTCDay()]; }
  function isDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }
  function hm(s, dflt) {
    var m = /^(\d{1,2}):(\d{2})/.exec(String(s || ''));
    return m ? (+m[1]) * 60 + (+m[2]) : dflt;
  }
  function toHM(min) { min = Math.max(0, Math.min(1439, Math.round(min))); return pad(Math.floor(min / 60)) + ':' + pad(min % 60); }
  function modNum(id) { return parseInt(String(id).replace(/^M/i, ''), 10) || 0; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function num(x, d) { x = Number(x); return isFinite(x) ? x : d; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /*@3.SCPEJ.2*/
  function listOf(v) {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v.charAt(0) === '[') {
      try { var j = JSON.parse(v.replace(/'/g, '"')); return Array.isArray(j) ? j : []; } catch (e) { return []; }
    }
    return v ? [v] : [];
  }
  function dimsOf(t) {
    var d = t && t.difficulty;
    if (d && typeof d === 'object') return d;
    if (typeof d === 'string' && d.charAt(0) === '{') {
      try { return JSON.parse(d.replace(/'/g, '"')) || {}; } catch (e) { return {}; }
    }
    return {};
  }

  /*@3.SCPEJ.3*/
  function moduleWeight(mod, known) {
    var topics = (mod && Array.isArray(mod.topics)) ? mod.topics : [];
    var ex = 0, net = 0, mem = 0, unl = 0, abs = 0, n = 0;
    topics.forEach(function (t) {
      var d = dimsOf(t);
      ex += clamp(num(d.exam_application, 1) / 2, 0, 1);
      net += clamp(num(d.network_effect, 0.5), 0, 1);
      mem += clamp(num(d.memory_load, 1) / 2, 0, 1);
      abs += clamp(num(d.conceptual_abstraction, 1.5) / 3, 0, 1);
      unl += listOf(t.unlocks).length;
      n++;
    });
    var diff = clamp(num(mod && mod.difficulty, 5) / 10, 0, 1);
    var need = 1 - clamp(known == null ? 0 : known, 0, 1);
    var emph = mod && mod.emph != null ? clamp(num(mod.emph, 1) - 0.5, 0, 1) : null;
    var p;
    if (!n) p = 0.45 + 0.25 * diff + 0.3 * need - 0.15;
    else if (emph == null) {
      p = 0.32 * (ex / n) + 0.18 * (net / n) + 0.15 * clamp(unl / Math.max(1, n * 2), 0, 1) + 0.1 * diff + 0.25 * need;
    } else {
      p = 0.22 * (ex / n) + 0.22 * emph + 0.12 * (net / n) + 0.09 * clamp(unl / Math.max(1, n * 2), 0, 1) +
          0.1 * diff + 0.25 * need;
    }
    var a = n ? abs / n : 0.5;
    var mins = mod && num(mod.minutes, 0) > 0 ? num(mod.minutes, 0) : null;
    var eff = mins == null ? null : Math.round(mins * (1 - 0.5 * clamp(known == null ? 0 : known, 0, 1)) * (0.9 + 0.3 * a));
    return { prio: round2(p), mem: n ? round2(mem / n) : 0.5, diff: diff, abs: round2(a), eff: eff };
  }
  function round2(x) { return Math.round(x * 100) / 100; }

  /*@3.SCPEJ.4*/
  function prereqOrder(code, list) {
    var ids = list.map(function (m) { return m.id; });
    var deps = {};
    list.forEach(function (m) {
      var set = {};
      (m.topics || []).forEach(function (t) {
        listOf(t.prerequisites).forEach(function (p) {
          var mm = new RegExp('^' + code + '_(M\\d+)_', 'i').exec(String(p));
          if (mm && mm[1] !== m.id && ids.indexOf(mm[1]) !== -1) set[mm[1]] = 1;
        });
      });
      deps[m.id] = set;
    });
    var out = [], done = {}, guard = 0;
    var left = list.slice().sort(function (a, b) { return modNum(a.id) - modNum(b.id); });
    while (left.length && guard++ < 500) {
      var pick = -1;
      for (var i = 0; i < left.length; i++) {
        var ok = true;
        for (var k in deps[left[i].id]) { if (!done[k]) { ok = false; break; } }
        if (ok) { pick = i; break; }
      }
      if (pick === -1) pick = 0;
      done[left[pick].id] = 1;
      out.push(left.splice(pick, 1)[0]);
    }
    return out;
  }

  /*@3.SCPEJ.5*/
  function normCfg(cfg) {
    var c = clone(cfg || {});
    c.courses = Array.isArray(c.courses) ? c.courses : [];
    c.exam_dates = c.exam_dates || {};
    c.exam_times = c.exam_times || {};
    c.exam_ends = c.exam_ends || {};
    c.modules = c.modules || {};
    c.rest_days = Array.isArray(c.rest_days) ? c.rest_days : [];
    c.sessions_per_day = clamp(parseInt(c.sessions_per_day, 10) || 2, 1, MAX_SPD);
    c.session_minutes = clamp(parseInt(c.session_minutes, 10) || 60, 15, 240);
    c.gap_min = c.gap_min == null ? GAP : clamp(parseInt(c.gap_min, 10) || 0, 0, 120);
    c.pre_exam_min = c.pre_exam_min == null ? PRE_EXAM : clamp(parseInt(c.pre_exam_min, 10) || 0, 0, 240);
    c.post_exam_min = c.post_exam_min == null ? POST_EXAM : clamp(parseInt(c.post_exam_min, 10) || 0, 0, 240);
    if (c.parts_mode !== 'auto') c.parts_mode = clamp(parseInt(c.parts_mode, 10) || 1, 1, 3);
    c.spacing = SPACING_OFFSETS[c.spacing] ? c.spacing : 'off';
    c.review_mode = (c.review_mode === 'always' || c.review_mode === 'off') ? c.review_mode : 'auto';
    c.pace = (c.pace === 'even' || c.pace === 'early') ? c.pace : 'auto';
    c.window = c.window || {};
    c.day_caps = c.day_caps || {};
    c.extra_reviews = Array.isArray(c.extra_reviews) ? c.extra_reviews : [];
    c.avoid_conflicts = c.avoid_conflicts !== false;
    c.max_course_day = parseInt(c.max_course_day, 10) || 0;
    return c;
  }

  function windowOf(cfg, ctx) {
    var s = hm(cfg.window.start_time, 10 * 60);
    var e = hm(cfg.window.end_time, null);
    if (e == null) e = (num(ctx.dayEndHour, 23)) * 60;
    if (e <= s) e = Math.min(24 * 60, s + 8 * 60);
    return { start: s, end: e };
  }

  /*@3.SCPEJ.23*/
  function examBlock(cfg, code) {
    var t = hm(cfg.exam_times[code], null);
    if (t == null) return null;
    var e = hm(cfg.exam_ends[code], null);
    if (e == null || e <= t) e = t + EXAM_LEN;
    return { s: t - cfg.pre_exam_min, e: e + cfg.post_exam_min, start: t, end: e, course: code };
  }
  function blocksOn(cfg, d) {
    var out = [];
    cfg.courses.forEach(function (c) {
      if (cfg.exam_dates[c] !== d) return;
      var b = examBlock(cfg, c);
      if (b) out.push(b);
    });
    return out;
  }

  /*@3.SCPEJ.6*/
  function firstFreeAt(busy, from, len, hardEnd) {
    var t = from, guard = 0;
    while (guard++ < 300) {
      var hit = null;
      for (var i = 0; i < busy.length; i++) {
        if (busy[i].e > t && busy[i].s < t + len) { hit = busy[i]; break; }
      }
      if (!hit) return (t + len <= hardEnd) ? t : null;
      t = hit.e;
      if (t + len > hardEnd) return null;
    }
    return null;
  }

  function makeCtx(ctx) {
    ctx = ctx || {};
    var cache = {};
    return {
      today: ctx.today || fromUTC(Date.now()),
      nowMin: ctx.nowMin == null ? null : ctx.nowMin,
      dayEndHour: ctx.dayEndHour,
      known: ctx.known || function () { return null; },
      mastered: ctx.mastered || function () { return false; },
      risk: ctx.risk || function () { return 0.5; },
      keep: Array.isArray(ctx.keep) ? ctx.keep : [],
      skip: Array.isArray(ctx.skip) ? ctx.skip : [],
      ids: ctx.ids || null,
      busy: function (d) {
        if (cache[d]) return cache[d];
        var out = [];
        try { out = (ctx.busyOn ? ctx.busyOn(d) : []) || []; } catch (e) { out = []; }
        out = out.filter(function (b) { return b && b.s != null && b.e != null && b.e > b.s; })
          .map(function (b) { return { s: b.s, e: b.e }; })
          .sort(function (a, b) { return a.s - b.s; });
        cache[d] = out;
        return out;
      }
    };
  }

  /*@3.SCPEJ.7*/
  function dayStartFor(d, win, X) {
    var s = win.start;
    if (d === X.today && X.nowMin != null) {
      var now = Math.ceil((X.nowMin + 10) / 15) * 15;
      if (now > s) s = now;
    }
    return s;
  }
  function packSlots(cfg, X, d, win, extra) {
    var start = dayStartFor(d, win, X), len = cfg.session_minutes;
    var busy = (cfg.avoid_conflicts ? X.busy(d).slice() : []).concat(blocksOn(cfg, d)).concat(extra || []);
    busy.sort(function (a, b) { return a.s - b.s; });
    var out = [], cur = start, guard = 0;
    while (guard++ < 60) {
      var at = firstFreeAt(busy, cur, len, win.end);
      if (at === null) break;
      out.push({ s: at, e: at + len });
      cur = at + len + cfg.gap_min;
    }
    return out;
  }

  /*@3.SCPEJ.28*/
  function warmSlots(cfg, X, d, win, spans) {
    if (cfg.review_mode === 'off') return [];
    var len = Math.min(WARM_MIN, cfg.session_minutes);
    var start = dayStartFor(d, win, X);
    var busy = (cfg.avoid_conflicts ? X.busy(d).slice() : []).concat(spans);
    var out = [];
    cfg.courses.forEach(function (c) {
      if (cfg.exam_dates[c] !== d) return;
      var b = examBlock(cfg, c);
      if (!b) return;
      var s = b.s - len;
      if (s < start || b.s > win.end + cfg.pre_exam_min) return;
      var clash = busy.concat(blocksOn(cfg, d).filter(function (x) { return x !== b && x.start !== b.start; }))
        .some(function (x) { return x.e > s && x.s < b.s; });
      if (!clash) out.push({ s: s, e: b.s, warm: c });
    });
    return out;
  }

  function keptSpan(s, cfg) {
    var t = hm(s.start_time, null);
    return t == null ? null : { s: t, e: t + (s.minutes || cfg.session_minutes) };
  }

  /*@3.SCPEJ.24*/
  function buildDays(cfg, X, lastExam, keptBy, needOf) {
    var win = windowOf(cfg, X);
    var days = [], slots = [];
    if (!lastExam || cfg.start_date > lastExam) return { days: days, win: win, slots: slots };
    var d = cfg.start_date, guard = 0;
    while (d <= lastExam && guard++ < 400) {
      var over = cfg.day_caps[d];
      var hasOver = over != null && over !== '';
      var rest = cfg.rest_days.indexOf(dayName(d)) !== -1;
      var kept = keptBy[d] || [];
      var spans = kept.map(function (s) { return keptSpan(s, cfg); }).filter(Boolean)
        .map(function (x) { return { s: x.s - cfg.gap_min, e: x.e + cfg.gap_min }; });
      var warm = warmSlots(cfg, X, d, win, spans);
      var all = packSlots(cfg, X, d, win, spans.concat(warm.map(function (w) { return { s: w.s - cfg.gap_min, e: w.e }; })))
        .concat(warm).sort(function (a, b) { return a.s - b.s; });
      var want = hasOver ? clamp(parseInt(over, 10) || 0, 0, MAX_SPD) : (rest ? 0 : cfg.sessions_per_day);
      var free = Math.max(0, want - kept.length);
      var bl = blocksOn(cfg, d).sort(function (a, b) { return a.s - b.s; });
      all.forEach(function (x) {
        var nb = bl.filter(function (b) { return b.s >= x.e; })[0];
        x.only = nb ? nb.course : null;
      });
      var pick = all.slice();
      if (bl.length) {
        var mine = {}, held = [], open = [];
        all.filter(function (x) { return x.warm; }).forEach(function (x) { mine[x.only] = (mine[x.only] || 0) + 1; held.push(x); });
        all.filter(function (x) { return !x.warm && x.only; }).reverse().forEach(function (x) {
          if ((mine[x.only] || 0) < needOf(x.only)) { mine[x.only] = (mine[x.only] || 0) + 1; held.push(x); }
        });
        all.forEach(function (x) { if (held.indexOf(x) === -1) { x.only = null; open.push(x); } });
        pick = held.concat(open);
      }
      pick = pick.slice(0, free).sort(function (a, b) { return a.s - b.s; });
      var day = { date: d, want: want, cap: pick.length + kept.length, fit: all.length + kept.length,
                  rest: rest && !hasOver, blocked: hasOver && !want, kept: kept, slots: [] };
      pick.forEach(function (x) { day.slots.push({ date: d, s: x.s, e: x.e, item: null, day: day, warm: x.warm || null, only: x.only || null }); });
      days.push(day);
      d = addDays(d, 1);
    }
    days.forEach(function (dy) { dy.slots.forEach(function (sl) { sl.idx = slots.length; slots.push(sl); }); });
    return { days: days, win: win, slots: slots };
  }

  /*@3.SCPEJ.8*/
  function partsFor(mod, cfg, known, w) {
    if (cfg.parts_mode !== 'auto') return cfg.parts_mode;
    if (w && w.eff != null) return clamp(Math.ceil(w.eff / (cfg.session_minutes * 1.1)), 1, 3);
    var need = Math.ceil((num(mod.hours, 2) * 60) / cfg.session_minutes);
    if (known != null && known >= 0.6) need--;
    return clamp(need, 1, 3);
  }

  /*@3.SCPEJ.29*/
  function buildUnits(cfg, mods, X, exclude) {
    var units = [], skipped = [];
    cfg.courses.forEach(function (code) {
      var sel = cfg.modules[code] || [];
      var list = (mods[code] || []).filter(function (m) { return sel.indexOf(m.id) !== -1; });
      var risk = clamp(num(X.risk(code), 0.5), 0, 1);
      var mult = 0.85 + 0.3 * risk;
      var open = null;
      prereqOrder(code, list).forEach(function (m, idx) {
        if (X.mastered(code, m.id)) { skipped.push({ course: code, module: m.id }); open = null; return; }
        if (exclude && exclude(code, m.id)) { open = null; return; }
        var known = X.known(code, m.id);
        var w = moduleWeight(m, known);
        var p = partsFor(m, cfg, known, w);
        var v = round2(w.prio * mult);
        if (p === 1 && w.eff != null && open && open.eff + w.eff <= cfg.session_minutes && open.also.length < 2) {
          open.also.push(m.id);
          open.eff += w.eff;
          open.value = round2(open.value + v * 0.9);
          open.prio = Math.max(open.prio, w.prio);
          open.difficulty = Math.max(open.difficulty, num(m.difficulty, 5));
          return;
        }
        for (var i = 1; i <= p; i++) {
          var u = { course: code, module: m.id, part: i, total_parts: p, seq: idx, also: [], eff: w.eff == null ? cfg.session_minutes : Math.round(w.eff / p),
                    difficulty: num(m.difficulty, 5), prio: w.prio, mem: w.mem, kind: 'study', value: v, risk: risk };
          units.push(u);
        }
        open = (p === 1 && w.eff != null) ? units[units.length - 1] : null;
      });
    });
    return { units: units, skipped: skipped };
  }

  function unitKey(u) {
    var k = u.kind || 'study';
    if (k === 'buffer') k += ':' + (u.review || 'final');
    return u.course + '/' + u.module + '/' + k + '/' + (u.part || 1);
  }

  /*@3.SCPEJ.9*/
  function splitKeep(X, from) {
    var kept = [], by = {}, used = {};
    X.keep.forEach(function (s) {
      if (!s || !isDate(s.date)) return;
      var k = unitKey(s);
      if (used[k]) return;
      used[k] = 1;
      (Array.isArray(s.also) ? s.also : []).forEach(function (m) { used[s.course + '/' + m + '/study/1'] = 1; });
      kept.push(s);
      if (s.date >= from) (by[s.date] = by[s.date] || []).push(s);
    });
    return { kept: kept, by: by, used: used };
  }

  function warmOk(it, sl) {
    return !sl.warm || (it.course === sl.warm && it.kind === 'buffer' && (it.review || 'final') === 'final');
  }

  function sameModuleOn(day, code, mid) {
    if (!mid) return false;
    return day.slots.some(function (sl) { return sl.item && sl.item.course === code && sl.item.module === mid; }) ||
      day.kept.some(function (s) { return s.course === code && s.module === mid; });
  }
  function courseStudyOn(day, code) {
    var n = 0;
    day.slots.forEach(function (sl) { if (sl.item && sl.item.course === code && sl.item.kind === 'study') n++; });
    day.kept.forEach(function (s) { if (s.course === code && (s.kind || 'study') === 'study') n++; });
    return n;
  }
  function courseOn(day, code) {
    var n = 0;
    day.slots.forEach(function (sl) { if (sl.item && sl.item.course === code) n++; });
    day.kept.forEach(function (s) { if (s.course === code) n++; });
    return n;
  }

  /*@3.SCPEJ.10*/
  function triage(cfg, items, slots, days, dlOf) {
    var dropped = [];
    function capTo(L, pool) {
      var n = 0, res = {}, warm = {};
      for (var k = 0; k <= L && k < slots.length; k++) {
        var sl = slots[k];
        if (sl.warm) warm[sl.warm] = (warm[sl.warm] || 0) + 1;
        else if (sl.only) res[sl.only] = (res[sl.only] || 0) + 1;
        else n++;
      }
      var have = {}, fin = {};
      pool.forEach(function (u) {
        if (u.kind === 'buffer' && (u.review || 'final') === 'final' && warm[u.course]) fin[u.course] = (fin[u.course] || 0) + 1;
        else have[u.course] = (have[u.course] || 0) + 1;
      });
      Object.keys(warm).forEach(function (c) { n += Math.min(warm[c], fin[c] || 0); });
      Object.keys(res).forEach(function (c) { n += Math.min(res[c], have[c] || 0); });
      return n;
    }
    function remove(it) { items.splice(items.indexOf(it), 1); }
    function shrinkOne(pool, L) {
      var multi = pool.filter(function (u) { return u.kind === 'study' && u.total_parts > 1 && u.part === u.total_parts; });
      if (multi.length) {
        multi.sort(function (a, b) { return a.value - b.value || b.seq - a.seq; });
        var v = multi[0];
        remove(v);
        items.forEach(function (u) {
          if (u.kind === 'study' && u.course === v.course && u.module === v.module) u.total_parts = v.total_parts - 1;
        });
        return { course: v.course, module: v.module, part: v.part, total: v.total_parts, reason: 'shrunk', prio: v.prio };
      }
      var deficit = pool.length - capTo(L, pool);
      var costly = pool.filter(function (u) {
        var rest = pool.filter(function (x) { return x !== u; });
        return rest.length - capTo(L, rest) < deficit;
      });
      var ones = (costly.length ? costly : pool).slice().sort(function (a, b) {
        return a.value - b.value || dlOf[b.course] - dlOf[a.course] || (b.seq || 0) - (a.seq || 0);
      });
      var w = ones[0];
      if (!w) return null;
      remove(w);
      return { course: w.course, module: w.module, part: 1, total: 1, reason: w.kind === 'buffer' ? 'review' : 'no_time', prio: w.prio, also: w.also };
    }
    var Ls = [];
    items.forEach(function (it) { var L = dlOf[it.course]; if (Ls.indexOf(L) === -1) Ls.push(L); });
    Ls.sort(function (a, b) { return a - b; });
    Ls.forEach(function (L) {
      var guard = 0;
      while (guard++ < 500) {
        var pool = items.filter(function (u) { return dlOf[u.course] <= L; });
        if (pool.length <= capTo(L, pool) || !pool.length) break;
        var x = shrinkOne(pool, L);
        if (!x) break;
        if (x.reason !== 'shrunk') dropped.push(x);
      }
    });
    if (cfg.max_course_day > 0) {
      cfg.courses.forEach(function (code) {
        var cap = 0;
        days.forEach(function (d) {
          var room = d.slots.filter(function (sl) { return sl.idx <= dlOf[code] && (!sl.warm || sl.warm === code); }).length;
          cap += Math.max(0, Math.min(room, cfg.max_course_day - courseOn(d, code)));
        });
        var guard = 0;
        while (guard++ < 500) {
          var pool = items.filter(function (u) { return u.course === code; });
          if (pool.length <= cap || !pool.length) break;
          var x = shrinkOne(pool, slots.length - 1);
          if (!x) break;
          if (x.reason !== 'shrunk') dropped.push(x);
        }
      });
    }
    return dropped;
  }

  function autoCourseCap(cfg, date) {
    var n = 0;
    cfg.courses.forEach(function (c) { if ((cfg.exam_dates[c] || '') > date) n++; });
    n = Math.max(1, n);
    return Math.max(1, Math.ceil(cfg.sessions_per_day / Math.min(n, cfg.sessions_per_day)));
  }

  /*@3.SCPEJ.11*/
  function modeOf(ratio) {
    if (ratio >= 1.6) return 'relaxed';
    if (ratio >= 1.15) return 'balanced';
    if (ratio >= 1) return 'tight';
    return 'triage';
  }

  function paceEnd(cfg, mode, exam, start) {
    var last = addDays(exam, -1);
    var early = cfg.pace === 'early' || (cfg.pace === 'auto' && mode === 'relaxed' && (cfg.spacing !== 'off' || cfg.review_mode === 'always'));
    if (early) {
      var span = diffDays(start, last);
      return addDays(start, Math.max(0, Math.floor(span * 0.7)));
    }
    if (cfg.review_mode !== 'off' && (mode === 'relaxed' || mode === 'balanced')) return addDays(exam, -2);
    return last;
  }

  function courseOrder(items, code) {
    return items.filter(function (u) { return u.course === code; }).sort(function (a, b) {
      var ka = a.kind === 'buffer' ? 1 : 0, kb = b.kind === 'buffer' ? 1 : 0;
      return ka - kb || (a.seq || 0) - (b.seq || 0) || (a.part || 1) - (b.part || 1);
    });
  }

  /*@3.SCPEJ.25*/
  function latestSlots(cfg, items, slots, dlOf) {
    var tails = {}, codes = [];
    cfg.courses.forEach(function (c) {
      var list = courseOrder(items, c);
      if (list.length) { tails[c] = list; codes.push(c); }
    });
    var dayMods = {}, dayCnt = {}, taken = [];
    codes.slice().sort(function (a, b) { return dlOf[a] - dlOf[b]; }).forEach(function (c) {
      var t = tails[c][tails[c].length - 1];
      if (t.kind !== 'buffer') return;
      for (var j = dlOf[c]; j >= 0; j--) {
        if (taken[j] || !warmOk(t, slots[j])) continue;
        if (cfg.max_course_day > 0 && courseOn(slots[j].day, c) >= cfg.max_course_day) continue;
        tails[c].pop();
        t.L = j;
        taken[j] = t;
        dayCnt[slots[j].date + '|' + c] = 1;
        return;
      }
    });
    for (var k = slots.length - 1; k >= 0; k--) {
      var sl = slots[k];
      if (taken[k]) continue;
      var cands = codes.filter(function (c) {
        if (!tails[c].length || k > dlOf[c]) return false;
        if (!warmOk(tails[c][tails[c].length - 1], sl)) return false;
        if (cfg.max_course_day > 0 && (dayCnt[sl.date + '|' + c] || 0) + courseOn(sl.day, c) >= cfg.max_course_day) return false;
        return true;
      });
      if (!cands.length) continue;
      var fresh = cands.filter(function (c) {
        var it = tails[c][tails[c].length - 1];
        return !(it.module && dayMods[sl.date + '|' + c + '|' + it.module]);
      });
      if (fresh.length) cands = fresh;
      cands.sort(function (a, b) {
        var ta = tails[a][tails[a].length - 1], tb = tails[b][tails[b].length - 1];
        return (cfg.exam_dates[b] === sl.date) - (cfg.exam_dates[a] === sl.date) || dlOf[b] - dlOf[a] || (tb.kind === 'buffer') - (ta.kind === 'buffer') || tb.value - ta.value || (a < b ? -1 : 1);
      });
      var c = cands[0];
      var it = tails[c].pop();
      it.L = k;
      if (it.module) dayMods[sl.date + '|' + c + '|' + it.module] = 1;
      dayCnt[sl.date + '|' + c] = (dayCnt[sl.date + '|' + c] || 0) + 1;
    }
    var left = [];
    codes.forEach(function (c) { tails[c].forEach(function (u) { left.push(u); }); });
    return left;
  }

  function earliestSlots(cfg, items, slots, dlOf) {
    var heads = {}, codes = [];
    cfg.courses.forEach(function (c) {
      var list = courseOrder(items, c).filter(function (u) { return u.L != null; });
      if (list.length) { heads[c] = list; codes.push(c); }
    });
    for (var k = 0; k < slots.length; k++) {
      var best = null;
      codes.forEach(function (c) {
        if (!heads[c].length || k > dlOf[c]) return;
        if (!best || dlOf[c] < dlOf[best] || (dlOf[c] === dlOf[best] && heads[c][0].value > heads[best][0].value)) best = c;
      });
      if (best) heads[best].shift().E = k;
    }
  }

  /*@3.SCPEJ.12*/
  function setTargets(cfg, items, slots, days, dlOf, mode) {
    var wide = mode === 'relaxed' || mode === 'balanced';
    cfg.courses.forEach(function (c) {
      var list = courseOrder(items, c).filter(function (u) { return u.L != null; });
      list.filter(function (u) { return u.kind === 'buffer'; }).forEach(function (r) { r.target = slots[r.L].date; });
      var us = list.filter(function (u) { return u.kind === 'study'; });
      if (!us.length) return;
      var lastL = 0;
      us.forEach(function (u) { if (u.L > lastL) lastL = u.L; });
      var from = wide ? cfg.start_date : slots[us[0].E != null ? us[0].E : us[0].L].date;
      var to = slots[lastL].date;
      var pe = paceEnd(cfg, mode, cfg.exam_dates[c], cfg.start_date);
      if (pe >= from && pe < to) to = pe;
      var win = days.filter(function (d) {
        return d.date >= from && d.date <= to && d.slots.some(function (sl) { return sl.idx <= dlOf[c]; });
      });
      if (!win.length) win = [slots[us[0].L].day];
      var W = win.length, n = us.length;
      var perday = Math.ceil(n / W);
      us.forEach(function (u, k) {
        var t = win[Math.min(W - 1, Math.floor(k * W / n))].date;
        var Ld = slots[u.L].date;
        u.target = t < Ld ? t : Ld;
        u.perday = perday;
      });
    });
  }

  /*@3.SCPEJ.26*/
  function placeForward(cfg, items, slots, days, dlOf) {
    var owner = [];
    var queues = {}, codes = [];
    items.forEach(function (it) { if (it.L != null) owner[it.L] = it; });
    cfg.courses.forEach(function (c) {
      var list = courseOrder(items, c).filter(function (u) { return u.L != null; });
      if (list.length) { queues[c] = list; codes.push(c); }
    });
    function put(sl, it) { sl.item = it; it.placed = true; it.at = sl.idx; }
    function next(c) {
      var q = queues[c];
      while (q.length && q[0].placed) q.shift();
      return q[0] || null;
    }
    days.forEach(function (day) {
      day.slots.forEach(function (sl) {
        var own = owner[sl.idx];
        if (own && !own.placed) { put(sl, own); return; }
        var cands = [];
        codes.forEach(function (c) {
          var it = next(c);
          if (!it || sl.idx > dlOf[c] || it.target > sl.date || !warmOk(it, sl)) return;
          if (sameModuleOn(day, c, it.module)) return;
          if (cfg.max_course_day > 0 && courseOn(day, c) >= cfg.max_course_day) return;
          if (it.kind === 'study') {
            var lim = Math.max(it.perday || 1, cfg.max_course_day > 0 ? 0 : 1);
            if (courseStudyOn(day, c) >= lim) return;
          }
          cands.push(it);
        });
        if (!cands.length) return;
        cands.sort(function (a, b) {
          return dlOf[a.course] - dlOf[b.course] || (a.target < b.target ? -1 : a.target > b.target ? 1 : 0) ||
            b.value - a.value || (a.course < b.course ? -1 : 1);
        });
        var u = cands[0];
        if (u.difficulty >= 7 && day.slots.some(function (x) { return x.item && x.item.difficulty >= 7; })) {
          var easy = cands.filter(function (x) { return x.difficulty < 7 && dlOf[x.course] === dlOf[u.course]; })[0];
          if (easy) u = easy;
        }
        put(sl, u);
      });
    });
  }

  /*@3.SCPEJ.13*/
  function placeLeftovers(cfg, left, slots, dlOf) {
    var still = [];
    left.forEach(function (u) {
      var hit = null;
      for (var k = 0; k <= dlOf[u.course] && k < slots.length; k++) {
        var sl = slots[k];
        if (sl.item || !warmOk(u, sl) || (sl.only && sl.only !== u.course) || sameModuleOn(sl.day, u.course, u.module)) continue;
        if (cfg.max_course_day > 0 && courseOn(sl.day, u.course) >= cfg.max_course_day) continue;
        hit = sl; break;
      }
      if (hit) { hit.item = u; u.placed = true; u.out_of_order = u.kind === 'study'; }
      else still.push(u);
    });
    return still;
  }

  /*@3.SCPEJ.14*/
  function addPractice(cfg, slots, dlOf) {
    if (cfg.review_mode !== 'auto') return 0;
    var n = 0;
    cfg.courses.forEach(function (c) {
      var ex = cfg.exam_dates[c];
      var hasFinal = slots.some(function (sl) { return sl.item && sl.item.course === c && sl.item.kind === 'buffer'; });
      if (!hasFinal) return;
      var tries = [addDays(ex, -2), addDays(ex, -3)];
      for (var t = 0; t < tries.length; t++) {
        var hit = null;
        for (var k = 0; k <= dlOf[c] && k < slots.length; k++) {
          var sl = slots[k];
          if (sl.date !== tries[t] || sl.item || sl.warm || (sl.only && sl.only !== c)) continue;
          if (sl.day.slots.some(function (x) { return x.item && x.item.course === c && x.item.kind === 'buffer'; })) continue;
          hit = sl; break;
        }
        if (hit) {
          hit.item = { course: c, module: null, part: 1, total_parts: 1, kind: 'buffer', review: 'practice', difficulty: 0, prio: 1, value: 0.2 };
          n++;
          return;
        }
      }
    });
    return n;
  }

  /*@3.SCPEJ.15*/
  function applySpacing(cfg, slots, dlOf, tier) {
    var offsets = SPACING_OFFSETS[tier] || [];
    if (!offsets.length) return { ok: true, n: 0 };
    var finals = [];
    slots.forEach(function (sl) {
      var x = sl.item;
      if (x && x.kind === 'study' && x.part === x.total_parts) finals.push({ x: x, date: sl.date });
    });
    var added = [];
    for (var i = 0; i < finals.length; i++) {
      var f = finals[i];
      for (var o = 0; o < offsets.length; o++) {
        var target = addDays(f.date, offsets[o]);
        var hit = null;
        for (var k = 0; k <= dlOf[f.x.course] && k < slots.length; k++) {
          var sl = slots[k];
          if (sl.date < target || sl.item || sl.warm || (sl.only && sl.only !== f.x.course) || sameModuleOn(sl.day, f.x.course, f.x.module)) continue;
          hit = sl; break;
        }
        if (!hit) {
          added.forEach(function (a) { a.item = null; });
          return { ok: false, n: 0 };
        }
        hit.item = { course: f.x.course, module: f.x.module, part: 1, total_parts: 1, kind: 'spaced',
                     difficulty: Math.max(0, f.x.difficulty - 3), prio: f.x.prio };
        added.push(hit);
      }
    }
    return { ok: true, n: added.length };
  }

  function applyExtraReviews(cfg, slots, dlOf) {
    var placed = 0, failed = 0;
    cfg.extra_reviews.forEach(function (r) {
      var mods = r.modules || [];
      if (!mods.length || !isDate(r.from) || !isDate(r.to)) return;
      var win = slots.filter(function (sl) { return sl.date >= r.from && sl.date <= r.to && sl.idx <= (dlOf[r.course] == null ? -1 : dlOf[r.course]); });
      if (!win.length) { failed += mods.length; return; }
      mods.forEach(function (mid, i) {
        var start = Math.floor(i * win.length / mods.length), hit = null;
        for (var k = 0; k < win.length; k++) {
          var sl = win[(start + k) % win.length];
          if (!sl.item && !sl.warm && !(sl.only && sl.only !== r.course) && !sameModuleOn(sl.day, r.course, mid)) { hit = sl; break; }
        }
        if (!hit) { failed++; return; }
        hit.item = { course: r.course, module: mid, part: 1, total_parts: 1, kind: 'spaced', difficulty: 3, prio: 0.5, custom: true };
        placed++;
      });
    });
    return { placed: placed, failed: failed };
  }

  /*@3.SCPEJ.16*/
  function dayOrder(items, cfg) {
    var study = items.filter(function (x) { return x.kind === 'study'; })
      .sort(function (a, b) { return b.difficulty - a.difficulty || b.prio - a.prio; });
    var out = [], lo = study.length - 1, hi = 0, flip = true;
    while (hi <= lo) {
      out.push(flip ? study[hi++] : study[lo--]);
      flip = !flip;
    }
    var pos = {};
    out.forEach(function (x, i) { (pos[x.course] = pos[x.course] || []).push(i); });
    Object.keys(pos).forEach(function (c) {
      var mine = pos[c].map(function (i) { return out[i]; })
        .sort(function (a, b) { return ((a.seq || 0) - (b.seq || 0)) || (a.part - b.part); });
      pos[c].forEach(function (i, k) { out[i] = mine[k]; });
    });
    var rev = items.filter(function (x) { return x.kind === 'spaced'; });
    var buf = items.filter(function (x) { return x.kind === 'buffer'; }).sort(function (a, b) {
      var ea = cfg.exam_dates[a.course] || '', eb = cfg.exam_dates[b.course] || '';
      return (eb < ea ? -1 : eb > ea ? 1 : 0) || (a.review === 'final') - (b.review === 'final');
    });
    return rev.concat(out).concat(buf);
  }

  /*@3.SCPEJ.27*/
  function arrangeDay(day, cfg, allowed) {
    var its = [];
    day.slots.forEach(function (sl) { if (sl.item) its.push(sl.item); sl.item = null; });
    if (!its.length) return;
    var tight = its.filter(function (it) { return cfg.exam_dates[it.course] === day.date; })
      .sort(function (a, b) {
        var ka = a.kind === 'buffer' ? (a.review === 'final' ? 2 : 1) : 0, kb = b.kind === 'buffer' ? (b.review === 'final' ? 2 : 1) : 0;
        return ka - kb || (a.seq || 0) - (b.seq || 0) || (a.part || 1) - (b.part || 1);
      });
    var rest = its.filter(function (it) { return tight.indexOf(it) === -1; });
    var desc = day.slots.slice().reverse();
    for (var i = tight.length - 1; i >= 0; i--) {
      var it = tight[i];
      var sl = desc.filter(function (x) { return !x.item && allowed(it.course, x) && warmOk(it, x); })[0] ||
               desc.filter(function (x) { return !x.item && allowed(it.course, x); })[0] ||
               desc.filter(function (x) { return !x.item; })[0];
      sl.item = it;
    }
    dayOrder(rest, cfg).forEach(function (it) {
      var sl = day.slots.filter(function (x) { return !x.item && warmOk(it, x); })[0] ||
               day.slots.filter(function (x) { return !x.item; })[0];
      sl.item = it;
    });
  }

  function layTimes(cfg, X, win, sessions, fixed) {
    var byDate = {};
    sessions.forEach(function (s) { (byDate[s.date] = byDate[s.date] || []).push(s); });
    var moved = 0;
    Object.keys(byDate).forEach(function (d) {
      var list = byDate[d];
      var busy = (cfg.avoid_conflicts ? X.busy(d).slice() : []).concat(blocksOn(cfg, d));
      list.concat((fixed || []).filter(function (f) { return f.date === d && list.indexOf(f) === -1; }))
        .forEach(function (s) {
        if ((s.time_locked || list.indexOf(s) === -1) && s.start_time) {
          var t = hm(s.start_time, 0);
          busy.push({ s: t, e: t + (s.minutes || cfg.session_minutes) });
        }
      });
      busy.sort(function (a, b) { return a.s - b.s; });
      var cur = dayStartFor(d, win, X);
      list.filter(function (s) { return !(s.time_locked && s.start_time); })
        .sort(function (a, b) { return a.order - b.order; })
        .forEach(function (s) {
          var len = s.minutes || cfg.session_minutes;
          var at = firstFreeAt(busy, cur, len, Math.max(win.end, cur + len));
          if (at === null) at = cur;
          if (at !== cur) moved++;
          s.start_time = toHM(at);
          busy.push({ s: at, e: at + len });
          busy.sort(function (a, b) { return a.s - b.s; });
          cur = at + len + cfg.gap_min;
        });
    });
    return moved;
  }

  var seq = 0;
  function newId(date, i, X) {
    seq++;
    var tail = X.ids ? X.ids() : Math.random().toString(36).slice(2, 6);
    return 'ip_' + date.replace(/-/g, '') + '_' + i + '_' + tail + seq.toString(36);
  }

  /*@3.SCPEJ.17*/
  function compute(cfgIn, mods, ctxIn, opts) {
    opts = opts || {};
    var cfg = normCfg(cfgIn);
    var X = makeCtx(ctxIn);
    var diag = { per_course: {}, passed: [], advice: [], notes: [], today_no_time: [] };

    cfg.courses = cfg.courses.filter(function (c) {
      var ex = cfg.exam_dates[c];
      if (!isDate(ex)) { diag.notes.push({ k: 'no_exam', course: c }); return false; }
      if (ex < cfg.start_date) { diag.passed.push(c); return false; }
      if (ex === cfg.start_date) {
        var b = examBlock(cfg, c);
        if (!b) { diag.today_no_time.push(c); return false; }
        if (ex === X.today && X.nowMin != null && X.nowMin >= b.start) { diag.passed.push(c); return false; }
      }
      return true;
    });
    var lastExam = '';
    cfg.courses.forEach(function (c) { if (cfg.exam_dates[c] > lastExam) lastExam = cfg.exam_dates[c]; });
    if (!lastExam) {
      diag.reason = 'no_exams';
      return { ok: false, sessions: [], unplaced: [], diagnostics: diag, spacing: 'off' };
    }

    var keep = splitKeep(X, cfg.start_date);
    var skipSet = {};
    X.skip.forEach(function (k) { if (k && k.course) skipSet[k.course + '/' + k.module] = 1; });
    var manual = [];
    var bu = buildUnits(cfg, mods || {}, X, function (code, mid) {
      if (skipSet[code + '/' + mid]) { manual.push({ course: code, module: mid, part: 1, total: 1, reason: 'manual', prio: 0.5 }); return true; }
      return false;
    });
    var units = bu.units.filter(function (u) {
      u.also = u.also.filter(function (m) { return !keep.used[u.course + '/' + m + '/study/1']; });
      return !keep.used[unitKey(u)];
    });
    function needOf(c) {
      var n = cfg.review_mode === 'off' ? 0 : 1;
      units.forEach(function (u) { if (u.course === c) n++; });
      return n;
    }
    var built = buildDays(cfg, X, lastExam, keep.by, needOf);
    var days = built.days, slots = built.slots, win = built.win;
    function allowed(c, sl) {
      if (sl.only && sl.only !== c) return false;
      var D = cfg.exam_dates[c];
      if (sl.date < D) return true;
      if (sl.date > D) return false;
      var b = examBlock(cfg, c);
      return !!b && sl.e <= b.s;
    }
    var dlOf = {};
    cfg.courses.forEach(function (c) {
      var L = -1;
      slots.forEach(function (sl) { if (allowed(c, sl)) L = sl.idx; });
      dlOf[c] = L;
    });

    diag.mastered_skipped = bu.skipped.length;

    /*@3.SCPEJ.22*/
    var reviews = [];
    if (cfg.review_mode !== 'off') {
      cfg.courses.forEach(function (c) {
        var r = { course: c, module: null, part: 1, total_parts: 1, kind: 'buffer', review: 'final', difficulty: 0, prio: 1, seq: 999 };
        if (keep.used[unitKey(r)]) return;
        var mine = units.some(function (u) { return u.course === c; });
        r.value = cfg.review_mode === 'always' ? 2 : round2((mine ? 0.3 : 1) * (0.85 + 0.3 * clamp(num(X.risk(c), 0.5), 0, 1)));
        reviews.push(r);
      });
    }

    var lost = [];
    units = units.filter(function (u) {
      if (dlOf[u.course] >= 0) return true;
      if (u.part === 1) lost.push({ course: u.course, module: u.module, part: 1, total: 1, reason: 'no_time', prio: u.prio, also: u.also });
      return false;
    });
    var missedReview = [];
    reviews = reviews.filter(function (r) {
      if (dlOf[r.course] >= 0) return true;
      missedReview.push(r.course);
      return false;
    });

    var capacity = slots.length;
    var demand = units.length;
    diag.capacity = capacity;
    diag.demand = demand;
    diag.units = units.length + keep.kept.length;
    diag.ratio = demand ? round2(capacity / demand) : 9;
    var worst = demand ? capacity / demand : 9;
    var Ls = [];
    units.forEach(function (u) { if (Ls.indexOf(dlOf[u.course]) === -1) Ls.push(dlOf[u.course]); });
    Ls.forEach(function (L) {
      var need = units.filter(function (u) { return dlOf[u.course] <= L; }).length;
      if (need) worst = Math.min(worst, (L + 1) / need);
    });
    if (lost.length) worst = Math.min(worst, 0.5);
    var mode = modeOf(worst);
    diag.mode = mode;
    diag.window = win;
    diag.days_total = days.length;
    diag.days_open = days.filter(function (d) { return d.cap > 0; }).length;
    diag.days_rest = days.filter(function (d) { return d.rest; }).length;
    diag.days_full = days.filter(function (d) { return !d.rest && d.cap === 0; }).length;
    var near = '';
    cfg.courses.forEach(function (c) { if (!near || cfg.exam_dates[c] < near) near = cfg.exam_dates[c]; });
    diag.urgent = near ? diffDays(cfg.start_date, near) <= 1 : false;

    cfg.courses.forEach(function (code) {
      diag.per_course[code] = {
        exam: cfg.exam_dates[code], exam_time: cfg.exam_times[code] || '', no_time: !examBlock(cfg, code),
        need: units.filter(function (u) { return u.course === code; }).length,
        cap: dlOf[code] + 1, days: diffDays(cfg.start_date, cfg.exam_dates[code])
      };
    });

    var items = units.concat(reviews);
    var dropped = triage(cfg, items, slots, days, dlOf);
    var left = latestSlots(cfg, items, slots, dlOf);
    earliestSlots(cfg, items, slots, dlOf);
    setTargets(cfg, items, slots, days, dlOf, mode);
    placeForward(cfg, items, slots, days, dlOf);
    var conflict = placeLeftovers(cfg, left, slots, dlOf);

    diag.practice = addPractice(cfg, slots, dlOf);
    var chosen = 'off';
    var tierIdx = Math.max(0, SPACING_TIERS.indexOf(cfg.spacing));
    for (var t = tierIdx; t < SPACING_TIERS.length; t++) {
      if (applySpacing(cfg, slots, dlOf, SPACING_TIERS[t]).ok) { chosen = SPACING_TIERS[t]; break; }
    }
    diag.spacing_applied = chosen;
    diag.spacing_wanted = cfg.spacing;
    var xr = applyExtraReviews(cfg, slots, dlOf);
    diag.extra_reviews_placed = xr.placed;
    diag.extra_reviews_failed = xr.failed;
    days.forEach(function (d) { arrangeDay(d, cfg, allowed); });

    /*@3.SCPEJ.18*/
    var sessions = [];
    days.forEach(function (d) {
      var fresh = d.slots.filter(function (sl) { return sl.item; });
      var base = d.kept.length;
      fresh.forEach(function (sl, i) {
        var u = sl.item;
        sessions.push({
          id: newId(d.date, base + i, X),
          date: d.date, order: base + i, course: u.course, module: u.module || null,
          part: u.part || 1, total_parts: u.total_parts || 1, kind: u.kind || 'study',
          review: u.kind === 'buffer' ? (u.review || 'final') : undefined,
          start_time: toHM(sl.s), minutes: sl.e - sl.s, done: false, note: '',
          prio: u.prio != null ? u.prio : 0.5, difficulty: u.difficulty || 0,
          custom: u.custom ? true : undefined, out_of_order: u.out_of_order ? true : undefined,
          also: u.also && u.also.length ? u.also.slice() : undefined
        });
      });
    });
    keep.kept.forEach(function (s) { sessions.push(s); });
    sessions.sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.start_time || '').localeCompare(b.start_time || '') || a.order - b.order;
    });
    diag.moved = 0;
    markKey(sessions);

    var unplaced = manual.concat(lost).concat(dropped.filter(function (x) { return x.reason !== 'review'; }))
      .concat(conflict.filter(function (u) { return u.kind === 'study'; }).map(function (u) {
        return { course: u.course, module: u.module, part: u.part, total: u.total_parts, reason: 'conflict', prio: u.prio, also: u.also };
      }));
    unplaced = expandAlso(unplaced);
    diag.dropped = unplaced.length;
    diag.kept_units = units.length - conflict.length;
    var bufPlaced = [], bufMissed = missedReview.slice();
    cfg.courses.forEach(function (code) {
      var pc = diag.per_course[code];
      pc.placed = sessions.filter(function (s) { return s.course === code && s.kind === 'study'; }).length;
      pc.dropped = unplaced.filter(function (u) { return u.course === code; }).length;
      var fin = sessions.filter(function (s) { return s.course === code && s.kind === 'buffer'; });
      pc.buffer = fin.length > 0;
      if (fin.length) {
        var last = fin[fin.length - 1];
        pc.review_at = { date: last.date, time: last.start_time };
        bufPlaced.push(code);
      } else if (cfg.review_mode !== 'off' && bufMissed.indexOf(code) === -1) bufMissed.push(code);
    });
    diag.buffers = { placed: bufPlaced, missed: cfg.review_mode === 'off' ? [] : bufMissed };

    var auto = unplaced.length - manual.length;
    if (auto > 0 && !opts.noAdvice) diag.advice = buildAdvice(cfgIn, mods, ctxIn, auto);

    return { ok: true, sessions: sessions, unplaced: unplaced, diagnostics: diag, spacing: chosen, cfg: cfg };
  }

  function expandAlso(list) {
    var out = [];
    list.forEach(function (u) {
      var a = u.also;
      delete u.also;
      out.push(u);
      (a || []).forEach(function (m) { out.push({ course: u.course, module: m, part: 1, total: 1, reason: u.reason, prio: u.prio }); });
    });
    return out;
  }

  /*@3.SCPEJ.19*/
  function markKey(sessions) {
    var study = sessions.filter(function (s) { return s.kind === 'study' && s.prio != null; });
    if (study.length < 3) return;
    var ps = study.map(function (s) { return s.prio; }).sort(function (a, b) { return b - a; });
    var cut = ps[Math.max(0, Math.floor(ps.length / 3) - 1)];
    study.forEach(function (s) { if (s.prio >= cut && s.prio >= 0.5) s.key = true; else delete s.key; });
  }

  /*@3.SCPEJ.20*/
  function buildAdvice(cfgIn, mods, ctxIn, base) {
    var cfg = normCfg(cfgIn);
    var cands = [];
    cfg.rest_days.forEach(function (rd) {
      cands.push({ id: 'open:' + rd, k: 'open', day: rd,
        apply: function (c) { c.rest_days = (c.rest_days || []).filter(function (x) { return x !== rd; }); } });
    });
    if (cfg.parts_mode === 'auto' || cfg.parts_mode > 1) {
      cands.push({ id: 'one', k: 'one', apply: function (c) { c.parts_mode = 1; } });
    }
    if (cfg.sessions_per_day < MAX_SPD) {
      var nx = cfg.sessions_per_day + 1, nx2 = Math.min(MAX_SPD, cfg.sessions_per_day + 2);
      cands.push({ id: 'spd:' + nx, k: 'spd', n: nx, apply: function (c) { c.sessions_per_day = nx; } });
      if (nx2 > nx) cands.push({ id: 'spd:' + nx2, k: 'spd', n: nx2, apply: function (c) { c.sessions_per_day = nx2; } });
    }
    if (cfg.session_minutes > 45) {
      var sm = cfg.session_minutes >= 90 ? 60 : 45;
      cands.push({ id: 'min:' + sm, k: 'min', n: sm, apply: function (c) { c.session_minutes = sm; } });
    }
    var we = hm((cfg.window || {}).end_time, null);
    if (we == null || we < 23 * 60) {
      cands.push({ id: 'late', k: 'late', apply: function (c) { c.window = c.window || {}; c.window.end_time = '23:30'; } });
    }
    var ws = hm((cfg.window || {}).start_time, 600);
    if (ws > 8 * 60) {
      cands.push({ id: 'early', k: 'early', apply: function (c) { c.window = c.window || {}; c.window.start_time = '08:00'; } });
    }
    if (cfg.review_mode === 'always') {
      cands.push({ id: 'revauto', k: 'revauto', apply: function (c) { c.review_mode = 'auto'; } });
    }
    var out = [];
    cands.forEach(function (a) {
      var c2 = clone(cfgIn);
      a.apply(c2);
      var r = compute(c2, mods, ctxIn, { noAdvice: true });
      var left = r.unplaced.filter(function (u) { return u.reason !== 'manual'; }).length;
      if (left >= base) return;
      out.push({ id: a.id, k: a.k, day: a.day, n: a.n, gain: base - left, left: left, enough: left === 0, apply: a.apply });
    });
    out.sort(function (x, y) { return (y.enough - x.enough) || (y.gain - x.gain); });
    return out.slice(0, 6);
  }

  /*@3.SCPEJ.21*/
  function relayDay(cfgIn, ctxIn, sessions, date) {
    var cfg = normCfg(cfgIn);
    var X = makeCtx(ctxIn);
    var win = windowOf(cfg, X);
    var list = sessions.filter(function (s) { return s.date === date; });
    list.sort(function (a, b) { return a.order - b.order; });
    list.forEach(function (s, i) { s.order = i; });
    var fixed = list.filter(function (s) { return s.done && s.start_time; });
    var free = list.filter(function (s) { return fixed.indexOf(s) === -1; });
    free.forEach(function (s) { if (!(s.time_locked && s.start_time)) s.start_time = ''; });
    layTimes(cfg, X, win, free, fixed);
    return list;
  }

  function checkMove(cfgIn, s, date) {
    var ex = (cfgIn.exam_dates || {})[s.course];
    if (!isDate(date)) return 'bad_date';
    if (ex && date >= ex) return 'after_exam';
    return '';
  }

  var API = {
    compute: compute,
    relayDay: relayDay,
    checkMove: checkMove,
    moduleWeight: moduleWeight,
    prereqOrder: prereqOrder,
    examBlock: function (cfg, code) { return examBlock(normCfg(cfg), code); },
    addDays: addDays, diffDays: diffDays, dayName: dayName, modNum: modNum,
    MAX_SPD: MAX_SPD,
    _modeOf: modeOf
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.GardenPlanEngine = API;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
