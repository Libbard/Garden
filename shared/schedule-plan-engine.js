/*@3.SCPEJ.1*/
;(function (root) {
  'use strict';

  var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var GAP = 15;
  var SPACING_TIERS = ['full', 'lite', 'off'];
  var SPACING_OFFSETS = { full: [3, 7], lite: [3], off: [] };
  var MAX_SPD = 10;

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
    var ex = 0, net = 0, mem = 0, unl = 0, n = 0;
    topics.forEach(function (t) {
      var d = dimsOf(t);
      ex += num(d.exam_application, 1) / 2;
      net += num(d.network_effect, 0.5);
      mem += num(d.memory_load, 1) / 2;
      unl += listOf(t.unlocks).length;
      n++;
    });
    var diff = clamp(num(mod && mod.difficulty, 5) / 10, 0, 1);
    var need = 1 - clamp(known == null ? 0 : known, 0, 1);
    if (!n) return { prio: round2(0.45 + 0.25 * diff + 0.3 * need - 0.15), mem: 0.5, diff: diff };
    var p = 0.32 * (ex / n) + 0.18 * clamp(net / n, 0, 1) + 0.15 * clamp(unl / Math.max(1, n * 2), 0, 1) +
            0.1 * diff + 0.25 * need;
    return { prio: round2(p), mem: round2(mem / n), diff: diff };
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
    c.modules = c.modules || {};
    c.rest_days = Array.isArray(c.rest_days) ? c.rest_days : [];
    c.sessions_per_day = clamp(parseInt(c.sessions_per_day, 10) || 2, 1, MAX_SPD);
    c.session_minutes = clamp(parseInt(c.session_minutes, 10) || 60, 15, 240);
    c.gap_min = c.gap_min == null ? GAP : clamp(parseInt(c.gap_min, 10) || 0, 0, 120);
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
  function dayStartFor(d, win, X, cfg) {
    var s = win.start;
    if (d === X.today && X.nowMin != null) {
      var now = Math.ceil((X.nowMin + 10) / 15) * 15;
      if (now > s) s = now;
    }
    return s;
  }
  function packCount(cfg, X, d, win, extraBusy) {
    var start = dayStartFor(d, win, X, cfg), len = cfg.session_minutes;
    if (win.end - start < len) return 0;
    var busy = cfg.avoid_conflicts ? X.busy(d).slice() : [];
    if (extraBusy) busy = busy.concat(extraBusy).sort(function (a, b) { return a.s - b.s; });
    var n = 0, cur = start, guard = 0;
    while (guard++ < 40) {
      var at = cfg.avoid_conflicts ? firstFreeAt(busy, cur, len, win.end) : (cur + len <= win.end ? cur : null);
      if (at === null) break;
      n++;
      cur = at + len + cfg.gap_min;
    }
    return n;
  }

  function buildDays(cfg, X, lastExam) {
    var win = windowOf(cfg, X);
    var days = [];
    if (!lastExam || cfg.start_date >= lastExam) return { days: days, win: win };
    var d = cfg.start_date, guard = 0;
    while (d < lastExam && guard++ < 400) {
      var over = cfg.day_caps[d];
      var rest = cfg.rest_days.indexOf(dayName(d)) !== -1;
      var fit = packCount(cfg, X, d, win);
      var want = (over != null && over !== '') ? clamp(parseInt(over, 10) || 0, 0, MAX_SPD)
               : (rest ? 0 : cfg.sessions_per_day);
      var cap = Math.min(fit, want);
      days.push({ date: d, cap: cap, fit: fit, rest: rest && over == null, blocked: over === 0 || over === '0',
                  items: [], hard: 0 });
      d = addDays(d, 1);
    }
    return { days: days, win: win };
  }

  /*@3.SCPEJ.8*/
  function partsFor(mod, cfg, known) {
    if (cfg.parts_mode !== 'auto') return cfg.parts_mode;
    var need = Math.ceil((num(mod.hours, 2) * 60) / cfg.session_minutes);
    if (known != null && known >= 0.6) need--;
    return clamp(need, 1, 3);
  }

  function buildUnits(cfg, mods, X) {
    var units = [], skipped = [];
    cfg.courses.forEach(function (code) {
      var sel = cfg.modules[code] || [];
      var list = (mods[code] || []).filter(function (m) { return sel.indexOf(m.id) !== -1; });
      prereqOrder(code, list).forEach(function (m, idx) {
        if (X.mastered(code, m.id)) { skipped.push({ course: code, module: m.id }); return; }
        var known = X.known(code, m.id);
        var w = moduleWeight(m, known);
        var p = partsFor(m, cfg, known);
        for (var i = 1; i <= p; i++) {
          units.push({ course: code, module: m.id, part: i, total_parts: p, seq: idx,
                       difficulty: num(m.difficulty, 5), prio: w.prio, mem: w.mem, kind: 'study' });
        }
      });
    });
    return { units: units, skipped: skipped };
  }

  function unitKey(u) { return u.course + '/' + u.module + '/' + (u.kind || 'study') + '/' + (u.part || 1); }

  /*@3.SCPEJ.9*/
  function applyKeep(days, units, X) {
    var byDate = {};
    days.forEach(function (d) { byDate[d.date] = d; });
    var kept = [];
    var used = {};
    X.keep.forEach(function (s) {
      if (!s || !isDate(s.date)) return;
      var k = unitKey(s);
      if (used[k]) return;
      used[k] = 1;
      kept.push(s);
      var day = byDate[s.date];
      if (day) { day.items.push(s); if (num(s.difficulty, 0) >= 7) day.hard++; }
    });
    var rest = units.filter(function (u) { return !used[unitKey(u)]; });
    return { kept: kept, units: rest };
  }

  function freeOn(day) { return day.cap - day.items.length; }
  function courseOn(day, code) { var n = 0; day.items.forEach(function (x) { if (x.course === code) n++; }); return n; }
  function moduleOn(day, code, mid) {
    return day.items.some(function (x) { return x.course === code && x.module === mid; });
  }

  /*@3.SCPEJ.10*/
  function triage(cfg, days, units, buffersFirst) {
    var dropped = [];
    var exams = cfg.courses.filter(function (c) { return cfg.exam_dates[c]; })
      .map(function (c) { return cfg.exam_dates[c]; }).sort();
    var uniq = exams.filter(function (d, i) { return exams.indexOf(d) === i; });
    function capBefore(D) {
      var n = 0;
      days.forEach(function (d) { if (d.date < D) n += Math.max(0, freeOn(d)); });
      return n;
    }
    function inScope(u, D) { return (cfg.exam_dates[u.course] || '9999') <= D; }
    function shrinkOne(pool) {
      var multi = pool.filter(function (u) { return u.total_parts > 1 && u.part === u.total_parts; });
      if (multi.length) {
        multi.sort(function (a, b) { return a.prio - b.prio || b.seq - a.seq; });
        var v = multi[0];
        units.splice(units.indexOf(v), 1);
        units.forEach(function (u) {
          if (u.course === v.course && u.module === v.module) u.total_parts = v.total_parts - 1;
        });
        return { course: v.course, module: v.module, part: v.part, total: v.total_parts, reason: 'shrunk', prio: v.prio };
      }
      var ones = pool.slice().sort(function (a, b) { return a.prio - b.prio || b.seq - a.seq; });
      var w = ones[0];
      if (!w) return null;
      units.splice(units.indexOf(w), 1);
      return { course: w.course, module: w.module, part: 1, total: 1, reason: 'no_time', prio: w.prio };
    }
    uniq.forEach(function (D) {
      var guard = 0;
      while (guard++ < 500) {
        var pool = units.filter(function (u) { return inScope(u, D); });
        var need = pool.length + buffersFirst.filter(function (b) { return cfg.exam_dates[b] <= D; }).length;
        if (need <= capBefore(D) || !pool.length) break;
        var x = shrinkOne(pool);
        if (!x) break;
        if (x.reason !== 'shrunk') dropped.push(x);
      }
    });
    cfg.courses.forEach(function (code) {
      var ex = cfg.exam_dates[code];
      if (!ex) return;
      var cap = 0;
      days.forEach(function (d) {
        var lim = cfg.max_course_day > 0 ? cfg.max_course_day : cfg.sessions_per_day;
        if (d.date < ex) cap += Math.max(0, Math.min(freeOn(d), lim - courseOn(d, code)));
      });
      if (buffersFirst.indexOf(code) !== -1) cap--;
      var guard = 0;
      while (guard++ < 500) {
        var pool = units.filter(function (u) { return u.course === code; });
        if (pool.length <= cap || !pool.length) break;
        var x = shrinkOne(pool);
        if (!x) break;
        if (x.reason !== 'shrunk') dropped.push(x);
      }
    });
    return dropped;
  }

  function maxPerCourseDay(cfg, date) {
    if (cfg.max_course_day > 0) return cfg.max_course_day;
    var n = 0;
    cfg.courses.forEach(function (c) { if (!date || (cfg.exam_dates[c] || '') > date) n++; });
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

  /*@3.SCPEJ.12*/
  function place(cfg, days, units, mode) {
    var idx = {};
    days.forEach(function (d, i) { idx[d.date] = i; });
    var byCourse = {};
    units.forEach(function (u) { (byCourse[u.course] = byCourse[u.course] || []).push(u); });
    Object.keys(byCourse).forEach(function (code) {
      var list = byCourse[code];
      list.sort(function (a, b) { return a.seq - b.seq || a.part - b.part; });
      var ex = cfg.exam_dates[code];
      var end = paceEnd(cfg, mode, ex, cfg.start_date);
      var avail = days.filter(function (d) { return d.date < ex && d.date <= end && d.cap > 0; });
      if (!avail.length) avail = days.filter(function (d) { return d.date < ex && d.cap > 0; });
      var L = avail.length;
      var perday = Math.ceil(list.length / Math.max(1, L));
      list.forEach(function (u, k) {
        u.target = L ? avail[Math.min(L - 1, Math.floor(k * L / list.length))].date : cfg.start_date;
        u.exam = ex;
        u.perday = perday;
      });
    });
    var lastDate = {}, lastPart = {};
    var unplaced = [];
    var pending = units.slice();
    var deadlines = units.map(function (u) { return u.exam; })
      .filter(function (d, i, a) { return d && a.indexOf(d) === i; }).sort();

    /*@3.SCPEJ.22*/
    var reserve = {};
    if (cfg.review_mode === 'auto' && (mode === 'relaxed' || mode === 'balanced')) {
      cfg.courses.forEach(function (c) {
        var ex = cfg.exam_dates[c];
        var cand = days.filter(function (d) { return d.date < ex && d.cap > 0; });
        if (cand.length) { var ld = cand[cand.length - 1].date; (reserve[ld] = reserve[ld] || []).push(c); }
      });
    }
    function safe(day, u) {
      for (var k = 0; k < deadlines.length; k++) {
        var D = deadlines[k];
        if (D <= day.date || u.exam <= D) continue;
        var free = 0;
        days.forEach(function (d) { if (d.date < D) free += Math.max(0, freeOn(d)); });
        var need = 0;
        pending.forEach(function (p) { if (p !== u && p.exam <= D) need++; });
        if (free - 1 < need) return false;
      }
      return true;
    }
    function ok(day, u, strict) {
      if (!day || day.date >= u.exam) return false;
      if (freeOn(day) <= 0) return false;
      if (moduleOn(day, u.course, u.module)) return false;
      if (strict && courseOn(day, u.course) >= Math.max(maxPerCourseDay(cfg, day.date), cfg.max_course_day > 0 ? 0 : (u.perday || 1))) return false;
      if (reserve[day.date]) {
        var held = reserve[day.date].filter(function (c) { return c !== u.course; }).length;
        if (freeOn(day) - held <= 0) return false;
      }
      if (!safe(day, u)) return false;
      return true;
    }
    function put(day, u) {
      var pi = pending.indexOf(u);
      if (pi !== -1) pending.splice(pi, 1);
      day.items.push(u);
      if (u.difficulty >= 7) day.hard++;
      lastDate[u.course] = day.date;
      lastPart[u.course + '/' + u.module] = day.date;
    }

    var queues = {};
    Object.keys(byCourse).forEach(function (c) { queues[c] = byCourse[c].slice(); });
    var codes = Object.keys(queues);
    function eligible(u, day, late) {
      if (day.date >= u.exam) return false;
      if (late ? u.target >= day.date : u.target > day.date) return false;
      var pp = lastPart[u.course + '/' + u.module];
      return !(u.part > 1 && pp && pp >= day.date);
    }
    function rank(a, b) {
      return (a.exam < b.exam ? -1 : a.exam > b.exam ? 1 : 0) ||
        (a.target < b.target ? -1 : a.target > b.target ? 1 : 0) || (b.prio - a.prio) ||
        (a.course < b.course ? -1 : a.course > b.course ? 1 : 0);
    }
    function fill(day, strict) {
      var guard = 0;
      while (freeOn(day) > 0 && guard++ < 60) {
        var cands = codes.map(function (c) { return queues[c][0]; })
          .filter(function (u) { return u && eligible(u, day, !strict) && ok(day, u, strict); });
        if (!cands.length) return;
        cands.sort(rank);
        var u = cands[0];
        if (u.difficulty >= 7 && day.hard > 0) {
          var easy = cands.filter(function (x) { return x.difficulty < 7 && x.exam === u.exam; })[0];
          if (easy) u = easy;
        }
        put(day, u);
        queues[u.course].shift();
      }
    }
    days.forEach(function (day) {
      fill(day, true);
      if (!(cfg.max_course_day > 0)) fill(day, false);
    });
    codes.forEach(function (c) { queues[c].forEach(function (u) { unplaced.push(u); }); });

    /*@3.SCPEJ.13*/
    var still = [];
    unplaced.forEach(function (u) {
      var pp = lastPart[u.course + '/' + u.module];
      var lo = (u.part > 1 && pp) ? addDays(pp, 1) : cfg.start_date;
      var hit = null;
      for (var i = 0; i < days.length; i++) {
        if (days[i].date < lo) continue;
        if (ok(days[i], u, false)) { hit = days[i]; break; }
      }
      if (hit) { put(hit, u); u.out_of_order = true; }
      else still.push(u);
    });
    return still;
  }

  /*@3.SCPEJ.14*/
  function placeBuffers(cfg, days, mode, forced) {
    var placed = [], missed = [];
    cfg.courses.forEach(function (code) {
      var ex = cfg.exam_dates[code];
      if (!ex) return;
      var cand = days.filter(function (d) { return d.date < ex && d.cap > 0; });
      if (!cand.length) { missed.push(code); return; }
      var want = (mode === 'relaxed' && !forced) ? 2 : 1;
      var got = 0;
      for (var i = cand.length - 1; i >= 0 && got < want && i >= cand.length - 3; i--) {
        var d = cand[i];
        if (freeOn(d) <= 0 || moduleOn(d, code, null)) continue;
        if (d.items.some(function (x) { return x.course === code && x.kind === 'buffer'; })) continue;
        d.items.push({ course: code, module: null, part: 1, total_parts: 1, kind: 'buffer', difficulty: 0, prio: 1 });
        got++;
      }
      if (got) placed.push(code); else missed.push(code);
    });
    return { placed: placed, missed: missed };
  }

  function reserveBuffers(cfg, days) {
    var codes = [];
    cfg.courses.forEach(function (code) {
      var ex = cfg.exam_dates[code];
      if (!ex) return;
      var cand = days.filter(function (d) { return d.date < ex && freeOn(d) > 0; });
      if (!cand.length) return;
      cand[cand.length - 1].items.push({ course: code, module: null, part: 1, total_parts: 1, kind: 'buffer', difficulty: 0, prio: 1 });
      codes.push(code);
    });
    return codes;
  }

  /*@3.SCPEJ.15*/
  function applySpacing(cfg, days, tier) {
    var offsets = SPACING_OFFSETS[tier] || [];
    if (!offsets.length) return { ok: true, n: 0 };
    var finals = [];
    days.forEach(function (d) {
      d.items.forEach(function (x) {
        if (x.kind === 'study' && x.part === x.total_parts) finals.push({ x: x, date: d.date });
      });
    });
    var added = [];
    for (var i = 0; i < finals.length; i++) {
      var f = finals[i], ex = cfg.exam_dates[f.x.course];
      for (var o = 0; o < offsets.length; o++) {
        var target = addDays(f.date, offsets[o]);
        var hit = null;
        for (var k = 0; k < days.length; k++) {
          var d = days[k];
          if (d.date < target) continue;
          if (ex && d.date >= ex) break;
          if (freeOn(d) <= 0 || moduleOn(d, f.x.course, f.x.module)) continue;
          hit = d; break;
        }
        if (!hit) {
          added.forEach(function (a) { a.day.items.splice(a.day.items.indexOf(a.it), 1); });
          return { ok: false, n: 0 };
        }
        var it = { course: f.x.course, module: f.x.module, part: 1, total_parts: 1, kind: 'spaced',
                   difficulty: Math.max(0, f.x.difficulty - 3), prio: f.x.prio };
        hit.items.push(it);
        added.push({ day: hit, it: it });
      }
    }
    return { ok: true, n: added.length };
  }

  function applyExtraReviews(cfg, days) {
    var placed = 0, failed = 0;
    var byDate = {};
    days.forEach(function (d) { byDate[d.date] = d; });
    cfg.extra_reviews.forEach(function (r) {
      var mods = r.modules || [];
      if (!mods.length || !isDate(r.from) || !isDate(r.to)) return;
      var win = days.filter(function (d) { return d.date >= r.from && d.date <= r.to && d.cap > 0; });
      if (!win.length) { failed += mods.length; return; }
      mods.forEach(function (mid, i) {
        var start = Math.floor(i * win.length / mods.length), hit = null;
        for (var k = 0; k < win.length; k++) {
          var d = win[(start + k) % win.length];
          if (freeOn(d) > 0 && !moduleOn(d, r.course, mid)) { hit = d; break; }
        }
        if (!hit) { failed++; return; }
        hit.items.push({ course: r.course, module: mid, part: 1, total_parts: 1, kind: 'spaced', difficulty: 3, prio: 0.5, custom: true });
        placed++;
      });
    });
    return { placed: placed, failed: failed };
  }

  /*@3.SCPEJ.16*/
  function dayOrder(items) {
    var study = items.filter(function (x) { return x.kind === 'study'; })
      .sort(function (a, b) { return b.difficulty - a.difficulty || b.prio - a.prio; });
    var out = [], lo = study.length - 1, hi = 0, flip = true;
    while (hi <= lo) {
      out.push(flip ? study[hi++] : study[lo--]);
      flip = !flip;
    }
    var slots = {};
    out.forEach(function (x, i) { (slots[x.course] = slots[x.course] || []).push(i); });
    Object.keys(slots).forEach(function (c) {
      var pos = slots[c];
      var mine = pos.map(function (i) { return out[i]; })
        .sort(function (a, b) { return (a.seq - b.seq) || (a.part - b.part); });
      pos.forEach(function (i, k) { out[i] = mine[k]; });
    });
    var rev = items.filter(function (x) { return x.kind === 'spaced'; });
    var buf = items.filter(function (x) { return x.kind === 'buffer'; });
    return rev.concat(out).concat(buf);
  }

  function layTimes(cfg, X, win, sessions, fixed) {
    var byDate = {};
    sessions.forEach(function (s) { (byDate[s.date] = byDate[s.date] || []).push(s); });
    var moved = 0;
    Object.keys(byDate).forEach(function (d) {
      var list = byDate[d];
      var busy = cfg.avoid_conflicts ? X.busy(d).slice() : [];
      list.concat((fixed || []).filter(function (f) { return f.date === d && list.indexOf(f) === -1; }))
        .forEach(function (s) {
        if ((s.time_locked || list.indexOf(s) === -1) && s.start_time) {
          var t = hm(s.start_time, 0);
          busy.push({ s: t, e: t + (s.minutes || cfg.session_minutes) });
        }
      });
      busy.sort(function (a, b) { return a.s - b.s; });
      var cur = dayStartFor(d, win, X, cfg);
      list.filter(function (s) { return !(s.time_locked && s.start_time); })
        .sort(function (a, b) { return a.order - b.order; })
        .forEach(function (s) {
          var len = s.minutes || cfg.session_minutes;
          var at = cfg.avoid_conflicts ? firstFreeAt(busy, cur, len, Math.max(win.end, cur + len)) : cur;
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
    var diag = { per_course: {}, passed: [], advice: [], notes: [] };

    cfg.courses = cfg.courses.filter(function (c) {
      var ex = cfg.exam_dates[c];
      if (!isDate(ex)) { diag.notes.push({ k: 'no_exam', course: c }); return false; }
      if (ex < cfg.start_date) { diag.passed.push(c); return false; }
      return true;
    });
    var lastExam = '';
    cfg.courses.forEach(function (c) { if (cfg.exam_dates[c] > lastExam) lastExam = cfg.exam_dates[c]; });
    if (!lastExam) {
      diag.reason = 'no_exams';
      return { ok: false, sessions: [], unplaced: [], diagnostics: diag, spacing: 'off' };
    }

    var built = buildDays(cfg, X, lastExam);
    var days = built.days, win = built.win;
    var bu = buildUnits(cfg, mods || {}, X);
    var keep = applyKeep(days, bu.units, X);
    var skipSet = {};
    X.skip.forEach(function (k) { if (k && k.course) skipSet[k.course + '/' + k.module] = 1; });
    var manual = [];
    var units = keep.units.filter(function (u) {
      if (!skipSet[u.course + '/' + u.module]) return true;
      if (u.part === 1) manual.push({ course: u.course, module: u.module, part: 1, total: 1, reason: 'manual', prio: u.prio });
      return false;
    });
    diag.mastered_skipped = bu.skipped.length;

    var capacity = 0;
    days.forEach(function (d) { capacity += Math.max(0, freeOn(d)); });
    var demand = units.length;
    diag.capacity = capacity;
    diag.demand = demand;
    diag.units = units.length + keep.kept.length;
    diag.ratio = demand ? round2(capacity / demand) : 9;
    var worst = demand ? capacity / demand : 9;
    cfg.courses.map(function (c) { return cfg.exam_dates[c]; }).forEach(function (D) {
      var need = units.filter(function (u) { return (cfg.exam_dates[u.course] || '') <= D; }).length;
      if (!need) return;
      var cap = 0;
      days.forEach(function (d) { if (d.date < D) cap += Math.max(0, freeOn(d)); });
      worst = Math.min(worst, cap / need);
    });
    var mode = modeOf(worst);
    diag.mode = mode;
    diag.window = win;
    diag.days_total = days.length;
    diag.days_open = days.filter(function (d) { return d.cap > 0; }).length;
    diag.days_rest = days.filter(function (d) { return d.rest; }).length;
    diag.days_full = days.filter(function (d) { return !d.rest && d.cap === 0; }).length;

    cfg.courses.forEach(function (code) {
      var ex = cfg.exam_dates[code];
      var cap = 0;
      days.forEach(function (d) { if (d.date < ex) cap += Math.max(0, freeOn(d)); });
      diag.per_course[code] = {
        exam: ex, need: units.filter(function (u) { return u.course === code; }).length,
        cap: cap, days: diffDays(cfg.start_date, ex)
      };
    });

    var forced = cfg.review_mode === 'always' ? reserveBuffers(cfg, days) : [];
    var dropped = triage(cfg, days, units, []);
    var conflict = place(cfg, days, units, mode);

    var buf = { placed: forced.slice(), missed: [] };
    if (cfg.review_mode === 'auto') buf = placeBuffers(cfg, days, mode, false);
    diag.buffers = buf;

    var chosen = 'off';
    var tierIdx = Math.max(0, SPACING_TIERS.indexOf(cfg.spacing));
    for (var t = tierIdx; t < SPACING_TIERS.length; t++) {
      if (applySpacing(cfg, days, SPACING_TIERS[t]).ok) { chosen = SPACING_TIERS[t]; break; }
    }
    diag.spacing_applied = chosen;
    diag.spacing_wanted = cfg.spacing;
    var xr = applyExtraReviews(cfg, days);
    diag.extra_reviews_placed = xr.placed;
    diag.extra_reviews_failed = xr.failed;

    /*@3.SCPEJ.18*/
    var sessions = [];
    var keptIds = {};
    keep.kept.forEach(function (s) { keptIds[s.id] = 1; });
    days.forEach(function (d) {
      var fresh = d.items.filter(function (x) { return !keptIds[x.id]; });
      var keptHere = d.items.filter(function (x) { return keptIds[x.id]; });
      var ordered = dayOrder(fresh);
      var base = keptHere.length;
      keptHere.forEach(function (s) { sessions.push(s); });
      ordered.forEach(function (u, i) {
        sessions.push({
          id: newId(d.date, base + i, X),
          date: d.date, order: base + i, course: u.course, module: u.module || null,
          part: u.part || 1, total_parts: u.total_parts || 1, kind: u.kind || 'study',
          start_time: '', minutes: cfg.session_minutes, done: false, note: '',
          prio: u.prio != null ? u.prio : 0.5, difficulty: u.difficulty || 0,
          custom: u.custom ? true : undefined, out_of_order: u.out_of_order ? true : undefined
        });
      });
    });
    keep.kept.forEach(function (s) {
      if (!days.some(function (d) { return d.date === s.date; })) sessions.push(s);
    });
    sessions.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.order - b.order; });
    var fresh = sessions.filter(function (s) { return !keptIds[s.id]; });
    diag.moved = layTimes(cfg, X, win, fresh, keep.kept);
    markKey(sessions);

    var unplaced = manual.concat(dropped).concat(conflict.map(function (u) {
      return { course: u.course, module: u.module, part: u.part, total: u.total_parts, reason: 'conflict', prio: u.prio };
    }));
    diag.dropped = unplaced.length;
    diag.kept_units = units.length - conflict.length;
    cfg.courses.forEach(function (code) {
      var pc = diag.per_course[code];
      pc.placed = sessions.filter(function (s) { return s.course === code && s.kind === 'study'; }).length;
      pc.dropped = unplaced.filter(function (u) { return u.course === code; }).length;
      pc.buffer = sessions.some(function (s) { return s.course === code && s.kind === 'buffer'; });
    });

    var auto = unplaced.length - manual.length;
    if (auto > 0 && !opts.noAdvice) diag.advice = buildAdvice(cfgIn, mods, ctxIn, auto);

    return { ok: true, sessions: sessions, unplaced: unplaced, diagnostics: diag, spacing: chosen, cfg: cfg };
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
    addDays: addDays, diffDays: diffDays, dayName: dayName, modNum: modNum,
    MAX_SPD: MAX_SPD,
    _modeOf: modeOf
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.GardenPlanEngine = API;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
