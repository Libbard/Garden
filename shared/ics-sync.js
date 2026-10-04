/*@3.ICSJ.1*/
;(function () {
  'use strict';

  var LS_KEY = 'garden_ics';
  var VERSION = 2;

  /*@3.ICSJ.2*/
  /*@3.ICSJ.86*/
  var FRESH_MS = 2 * 60 * 60 * 1000;

  /*@3.ICSJ.3*/
  var FEED_RE = /^https:\/\/lms\.seu\.edu\.sa\/webapps\/calendar\/calendarFeed\/[0-9a-fA-F]{16,64}\/learn\.ics$/;

  /*@3.ICSJ.4*/

  function blank() {
    return {
      v: VERSION,
      url: '',              /*@3.ICSJ.5*/
      on_server: false,     /*@3.ICSJ.6*/
      auto: true,           /*@3.ICSJ.7*/
      lead_days: 2,         /*@3.ICSJ.8*/
      last_try: 0,
      last_ok: 0,
      last_err: '',
      stamp: '',            /*@3.ICSJ.9*/
      links: {},            /*@3.ICSJ.10*/
      uid_map: {},          /*@3.ICSJ.11*/
      ranges: [],           /*@3.ICSJ.12*/
      inbox: [],            /*@3.ICSJ.13*/
      skip: {},             /*@3.ICSJ.14*/
      /*@3.ICSJ.87*/
      skip_bands: [],
      props: [],
      /*@3.ICSJ.95*/
      bb: { courses: {}, items: {}, cl: {}, term: '', at: 0 },
      past: {},
      past_keep: {},
      bar_ack: {},
      over: {},
      over_sig: '',
      count: 0              /*@3.ICSJ.15*/
    };
  }

  var state = null;

  /*@3.ICSJ.68*/
  var RUN_KEY = 'garden_ics_run';
  var RUN_FIELDS = ['stamp', 'last_try', 'last_ok', 'last_err', 'count', 'inbox', 'props'];

  function isRun(k) { return RUN_FIELDS.indexOf(k) > -1; }

  var lastDur = '';

  function load() {
    if (state) return state;
    var raw = null, run = null;
    try { raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) {}
    try { run = JSON.parse(localStorage.getItem(RUN_KEY) || 'null'); } catch (e) {}
    if (!raw || typeof raw !== 'object') raw = {};
    if (run && typeof run === 'object') {
      RUN_FIELDS.forEach(function (k) { if (run[k] !== undefined) raw[k] = run[k]; });
    }
    state = repair(raw);
    lastDur = '';
    return state;
  }

  /*@3.ICSJ.16*/
  function repair(s) {
    var d = blank();
    if (!s || typeof s !== 'object') return d;
    Object.keys(d).forEach(function (k) { if (s[k] === undefined) s[k] = d[k]; });
    if (typeof s.url !== 'string' || !FEED_RE.test(s.url)) s.url = '';
    if (!s.links || typeof s.links !== 'object') s.links = {};
    if (!s.uid_map || typeof s.uid_map !== 'object') s.uid_map = {};
    if (!s.skip || typeof s.skip !== 'object') s.skip = {};
    if (!s.over || typeof s.over !== 'object' || Array.isArray(s.over)) s.over = {};
    if (typeof s.over_sig !== 'string') s.over_sig = '';
    if (!Array.isArray(s.ranges)) s.ranges = [];
    if (!Array.isArray(s.inbox)) s.inbox = [];
    if (!Array.isArray(s.skip_bands)) s.skip_bands = [];
    if (!Array.isArray(s.props)) s.props = [];
    if (!s.bb || typeof s.bb !== 'object' || Array.isArray(s.bb)) s.bb = { courses: {}, items: {}, term: '', at: 0 };
    if (!s.bb.courses || typeof s.bb.courses !== 'object') s.bb.courses = {};
    if (!s.bb.items || typeof s.bb.items !== 'object') s.bb.items = {};
    if (!s.bb.cl || typeof s.bb.cl !== 'object') s.bb.cl = {};
    if (typeof s.bb.term !== 'string') s.bb.term = '';
    if (typeof s.bb.at !== 'number') s.bb.at = 0;
    ['past', 'past_keep', 'bar_ack'].forEach(function (k) {
      if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {};
    });
    if (typeof s.lead_days !== 'number' || s.lead_days < 0 || s.lead_days > 14) s.lead_days = 2;
    s.v = VERSION;
    return s;
  }

  /*@3.ICSJ.69*/
  function save() {
    if (!state) return false;
    var dur = {}, run = {};
    Object.keys(state).forEach(function (k) {
      if (isRun(k)) run[k] = state[k]; else dur[k] = state[k];
    });
    try {
      /*@3.ICSJ.70*/
      var js = JSON.stringify(dur);
      if (js !== lastDur) { localStorage.setItem(LS_KEY, js); lastDur = js; }
      localStorage.setItem(RUN_KEY, JSON.stringify(run));
      return true;
    } catch (e) { return false; }
  }

  /*@3.ICSJ.71*/
  try {
    window.addEventListener('garden:syncCompleted', function () {
      state = null; lastDur = '';
    });
  } catch (e) {}

  /*@3.ICSJ.18*/

  /*@3.ICSJ.19*/
  function unfold(text) {
    return String(text || '')
      .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      .replace(/\n[ \t]/g, '');
  }

  function unescapeVal(v) {
    return String(v || '')
      .replace(/\\n/gi, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\')
      .trim();
  }

  /*@3.ICSJ.20*/
  function parseDT(val, tzid) {
    var m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(val || '').trim());
    if (!m) return null;
    var Y = +m[1], Mo = +m[2], D = +m[3];
    var H = m[4] === undefined ? null : +m[4];
    var Mi = m[5] === undefined ? 0 : +m[5];
    var dateOnly = (H === null);
    if (dateOnly) return { date: pad4(Y) + '-' + pad2(Mo) + '-' + pad2(D), time: '', all_day: true };

    var ms;
    if (m[7] === 'Z') ms = Date.UTC(Y, Mo - 1, D, H, Mi, 0);
    else if (/riyadh|\+03/i.test(tzid || '')) ms = Date.UTC(Y, Mo - 1, D, H, Mi, 0) - 3 * 3600e3;
    else if (tzid) ms = Date.UTC(Y, Mo - 1, D, H, Mi, 0) - 3 * 3600e3;  /*@3.ICSJ.21*/
    else return { date: pad4(Y) + '-' + pad2(Mo) + '-' + pad2(D), time: pad2(H) + ':' + pad2(Mi), all_day: false };

    var d = new Date(ms);
    return {
      date: d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()),
      time: pad2(d.getHours()) + ':' + pad2(d.getMinutes()),
      all_day: false
    };
  }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function pad4(n) { return String(n).padStart(4, '0'); }

  var SEEN_PROPS = {};

  function parseICS(text) {
    var lines = unfold(text).split('\n');
    var out = [], cur = null, i, line, colon, left, val, name, params, semi, tzid;
    SEEN_PROPS = {};

    for (i = 0; i < lines.length; i++) {
      line = lines[i];
      if (!line) continue;
      if (line.indexOf('BEGIN:VEVENT') === 0) {
        cur = { uid: '', summary: '', dtstart: null, dtend: null, status: '', extra: '' };
        continue;
      }
      if (line.indexOf('END:VEVENT') === 0) {
        if (cur && cur.uid && cur.dtstart) out.push(cur);
        cur = null; continue;
      }
      if (!cur) continue;

      colon = line.indexOf(':');
      if (colon < 0) continue;
      left = line.slice(0, colon);
      val  = line.slice(colon + 1);
      semi = left.indexOf(';');
      name = (semi < 0 ? left : left.slice(0, semi)).toUpperCase();
      params = semi < 0 ? '' : left.slice(semi + 1);
      tzid = /TZID=([^;]+)/i.exec(params);
      tzid = tzid ? tzid[1] : '';

      SEEN_PROPS[name] = (SEEN_PROPS[name] || 0) + 1;

      if (name === 'UID') cur.uid = unescapeVal(val);
      else if (name === 'SUMMARY') cur.summary = unescapeVal(val);
      else if (name === 'STATUS') cur.status = unescapeVal(val).toUpperCase();
      else if (name === 'DTSTART') cur.dtstart = parseDT(val, tzid);
      else if (name === 'DTEND') cur.dtend = parseDT(val, tzid);
      /*@3.ICSJ.88*/
      else if (EXTRA_RE.test(name)) cur.extra += ' ' + unescapeVal(val);
    }
    return out.filter(function (e) { return e.status !== 'CANCELLED'; });
  }

  /*@3.ICSJ.22*/

  /*@3.ICSJ.23*/
  var KINDS = [
    { k: 'midterm',    re: /\bmid[\s\-_]?term\b|نصفي|النصفي/i },
    /*@3.ICSJ.24*/
    { k: 'final',      re: /\bfinal\s*(exam|test)\b|(?:[اإ]ختبار|امتحان)\s+(?:[ء-ي]+\s+)?(?:ال)?نهائي/i },
    { k: 'project',    re: /\bproject\b|مشروع/i },
    { k: 'assignment', re: /\bassign(ment)?\b|\bhomework\b|\bhw\s*\d|واجب/i },
    { k: 'quiz',       re: /\bquiz(zes)?\b|كويز|اختبار\s*قصير/i },
    { k: 'discussion', re: /\bdiscussion\b|\bforum\b|\bblog\b|مناقشة/i },
    { k: 'exam',       re: /\bexam\b|\btest\b|اختبار/i }
  ];

  var EXTRA_RE = /^(DESCRIPTION|CATEGORIES|LOCATION|URL|COMMENT|X-ALT-DESC|X-WR-CALNAME)$/;

  /*@3.ICSJ.25*/
  var CODE_RE = /(?:^|[^A-Za-z0-9])([A-Za-z]{2,4})[\s_-]?(\d{3})(?![0-9])/;
  var CODE_G  = /(?:^|[^A-Za-z0-9])[A-Za-z]{2,4}[\s_-]?\d{3}(?![0-9])/g;

  /*@3.ICSJ.89*/
  function codeIn(text) {
    var hits = String(text || '').match(CODE_G) || [];
    var uniq = [], i, c;
    for (i = 0; i < hits.length; i++) {
      c = hits[i].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (uniq.indexOf(c) < 0) uniq.push(c);
    }
    return uniq.length === 1 ? uniq[0] : null;
  }

  function readSummary(sum, extra) {
    var s = String(sum || '').trim();
    var kind = 'other', i;
    for (i = 0; i < KINDS.length; i++) { if (KINDS[i].re.test(s)) { kind = KINDS[i].k; break; } }

    /*@3.ICSJ.26*/
    var code = null;
    var cm = CODE_RE.exec(s);
    if (cm) code = (cm[1] + cm[2]).toUpperCase();
    if (!code && extra) code = codeIn(extra);

    /*@3.ICSJ.27*/
    var topic = s.replace(CODE_G, ' ')
                 .split(/[_–\-–—:]/).slice(1).join(' ').trim();
    if (!topic) topic = s.replace(/^\s*(quiz|assignment|exam|test|midterm|final|project|discussion)\s*\d*\s*/i, '').trim();

    var num = /(\d{1,2})/.exec(s.replace(CODE_G, ' '));
    return { kind: kind, code: code, topic: topic, num: num ? +num[1] : null, raw: s };
  }

  /*@3.ICSJ.28*/
  function itemNo(uid) {
    var m = /GradableItem[-_]+(\d{3,})/i.exec(String(uid || ''));
    return m ? +m[1] : null;
  }

  /*@3.ICSJ.29*/
  var CLUSTER_GAP = 12;
  /*@3.ICSJ.94*/
  var CLUSTER_MARGIN = 6;

  /*@3.ICSJ.75*/
  function groupInbox(list) {
    var withNo = (list || []).filter(function (x) { return x && x.no !== null && x.no !== undefined; })
                     .sort(function (a, b) { return a.no - b.no; });
    var loose = (list || []).filter(function (x) { return x && (x.no === null || x.no === undefined); });
    var out = [], cur = null;
    withNo.forEach(function (it) {
      var code = it.code || '';
      /*@3.ICSJ.76*/
      var wall = !cur || (it.no - cur.hi > CLUSTER_GAP) || (code && cur.code && code !== cur.code);
      if (wall) {
        cur = { lo: it.no, hi: it.no, code: code, items: [it], guess: '', score: 0, foreign: it.foreign || '' };
        out.push(cur);
      } else {
        cur.hi = it.no; cur.items.push(it);
        if (code && !cur.code) cur.code = code;
        if (it.foreign && !cur.foreign) cur.foreign = it.foreign;
      }
      /*@3.ICSJ.77*/
      if (it.guess && (it.score || 0) > cur.score) { cur.guess = it.guess; cur.score = it.score || 0; }
    });
    loose.forEach(function (it) {
      out.push({ lo: null, hi: null, code: it.code || '', items: [it],
                 guess: it.guess || '', score: it.score || 0, foreign: it.foreign || '' });
    });
    return out;
  }

  /*@3.ICSJ.78*/
  function cluster(items) {
    return groupInbox(items).filter(function (g) { return g.lo !== null; })
                            .map(function (g) { return { lo: g.lo, hi: g.hi }; });
  }

  var FAM_MIN = 2;
  var FAM_WEAK = { family: 1, elim: 1, cluster: 1 };

  function famOf(ev) {
    var t = String(ev.raw || '').replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); });
    t = norm(t.replace(CODE_G, ' '));
    var m = /(\d{1,3})/.exec(t);
    var stem = t.replace(/[0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (stem.replace(/[^a-z؀-ۿ]/g, '').length < 4) return null;
    return { key: ev.kind + '|' + stem, no: m ? +m[1] : null, time: (ev.dtstart && ev.dtstart.time) || '' };
  }

  function famAdd(fams, ev, code) {
    var f = famOf(ev);
    if (!f || !code) return;
    var F = fams[f.key] || (fams[f.key] = {});
    var e = F[code] || (F[code] = { n: 0, nos: {}, times: {} });
    e.n++;
    if (f.no !== null) e.nos[f.no] = 1;
    if (f.time) e.times[f.time] = 1;
  }

  function famTrusted(s, ev, r) {
    if (r.why === 'cluster' || r.why === 'topic') return false;
    if (r.why !== 'bb') return true;
    var br = s.bb.items[bbKey(ev.uid)];
    return !(br && FAM_WEAK[br.src]);
  }

  /*@3.ICSJ.128*/
  function familyPick(fams, ev, codes, waiting) {
    var f = famOf(ev);
    if (!f || f.no === null) return null;
    var F = fams[f.key];
    if (!F) return null;
    var cs = Object.keys(F);
    var left = cs.filter(function (c) { return !F[c].nos[f.no] && (!f.time || F[c].times[f.time]); });
    if (left.length !== 1 || codes.indexOf(left[0]) < 0) return null;
    if (F[left[0]].n < FAM_MIN) return null;
    if (cs.length > 1 && waiting && waiting[f.key] > 1) return null;
    return left[0];
  }

  /*@3.ICSJ.79*/
  function addRange(s, lo, hi, code) {
    var list = (s.ranges || []).filter(function (r) {
      return r && typeof r.lo === 'number' && typeof r.hi === 'number' && r.code && r.lo <= r.hi;
    });
    var grew = true;
    while (grew) {
      grew = false;
      list = list.filter(function (r) {
        if (r.code !== code || r.hi < lo - 1 || r.lo > hi + 1) return true;
        lo = Math.min(lo, r.lo); hi = Math.max(hi, r.hi); grew = true;
        return false;
      });
    }
    /*@3.ICSJ.80*/
    var out = [];
    list.forEach(function (r) {
      if (r.hi < lo || r.lo > hi) { out.push(r); return; }
      if (r.lo < lo) out.push({ lo: r.lo, hi: lo - 1, code: r.code });
      if (r.hi > hi) out.push({ lo: hi + 1, hi: r.hi, code: r.code });
    });
    out.push({ lo: lo, hi: hi, code: code });
    s.ranges = out;
  }

  /*@3.ICSJ.30*/

  /*@3.ICSJ.31*/

  var idx = null, idxLoading = null;

  function loadIndex() {
    if (idx) return Promise.resolve(idx);
    if (idxLoading) return idxLoading;
    var root = (location.pathname.indexOf('/hub/') > -1 || location.pathname.indexOf('/labs/') > -1) ? '../' : '';
    idxLoading = fetch(root + 'shared/data/search_index.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var list = (j && j.entries) || [];
        idx = list.filter(function (e) { return e && e.code && (e.t === 'module' || e.t === 'concept'); })
                  .map(function (e) { return { code: e.code, en: norm(e.en), ar: norm(e.ar) }; });
        return idx;
      })
      .catch(function () { idx = []; return idx; });
    return idxLoading;
  }

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[^a-z0-9؀-ۿ ]+/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  /*@3.ICSJ.32*/
  var STOP = (' and the of to in for a an is are on with introduction intro basic basics ' +
              'chapter unit lesson part week من في إلى على عن مقدمة الفصل الوحدة ' +
              'quiz quizzes assignment assignments homework exam exams test tests ' +
              'midterm final project discussion forum blog due submission ' +
              'كويز واجب واجبات اختبار مشروع مناقشة تسليم ').split(' ');

  function words(s) {
    return norm(s).split(' ').filter(function (w) { return w.length > 2 && STOP.indexOf(w) < 0; });
  }

  /*@3.ICSJ.33*/
  function guessCourse(topic, codes) {
    var w = words(topic);
    if (!w.length || !idx || !idx.length) return null;
    var score = {}, i, e, hit, j;
    for (i = 0; i < idx.length; i++) {
      e = idx[i];
      if (codes.indexOf(e.code) < 0) continue;      /*@3.ICSJ.34*/
      hit = 0;
      for (j = 0; j < w.length; j++) if (e.en.indexOf(w[j]) > -1 || e.ar.indexOf(w[j]) > -1) hit++;
      if (!hit) continue;
      /*@3.ICSJ.35*/
      var v = hit / w.length;
      if (!score[e.code] || score[e.code] < v) score[e.code] = v;
    }
    var best = null, second = 0;
    Object.keys(score).forEach(function (c) {
      if (!best || score[c] > score[best]) { second = best ? score[best] : 0; best = c; }
      else if (score[c] > second) second = score[c];
    });
    if (!best) return null;
    return { code: best, score: score[best], gap: score[best] - second };
  }

  /*@3.ICSJ.36*/
  var GUESS_MIN = 0.6;    /*@3.ICSJ.37*/
  var GUESS_GAP = 0.25;   /*@3.ICSJ.38*/

  function resolve(ev, codes) {
    var s = load();
    var mine = s.over[ev.uid] && s.over[ev.uid].f ? s.over[ev.uid].f.code : '';
    if (mine && codes.indexOf(mine) > -1) return { code: mine, why: 'user', sure: true };
    /*@3.ICSJ.39*/
    if (s.uid_map[ev.uid] && codes.indexOf(s.uid_map[ev.uid]) > -1) {
      return { code: s.uid_map[ev.uid], why: 'saved', sure: true };
    }
    /*@3.ICSJ.99*/
    var bk = bbKey(ev.uid), br = bk && s.bb && s.bb.items ? s.bb.items[bk] : null;
    if (br && bbTrust(ev.uid, br)) {
      if (codes.indexOf(br.code) > -1) return { code: br.code, why: 'bb', sure: true };
      if (br.term && s.bb.term && br.term < s.bb.term) {
        return { code: null, why: 'stale', foreign: br.code, term: br.term, sure: false, score: 0 };
      }
      return { code: null, why: 'foreign', foreign: br.code, sure: false, score: 0 };
    }
    /*@3.ICSJ.41*/
    /*@3.ICSJ.81*/
    if (ev.code && codes.indexOf(ev.code) > -1) return { code: ev.code, why: 'code', sure: true };
    /*@3.ICSJ.90*/
    if (ev.code) return { code: null, why: 'foreign', foreign: ev.code, sure: false, score: 0 };
    /*@3.ICSJ.107*/
    var nm = nameAnchor(ev, codes);
    if (nm) return { code: nm, why: 'name', sure: true };
    /*@3.ICSJ.40*/
    if (ev.no !== null) {
      var best = null, tie = false, runner = null;
      for (var i = 0; i < s.ranges.length; i++) {
        var r = s.ranges[i];
        if (!r || codes.indexOf(r.code) < 0) continue;
        var d = ev.no < r.lo ? r.lo - ev.no : (ev.no > r.hi ? ev.no - r.hi : 0);
        if (d > CLUSTER_GAP) continue;
        if (!best || d < best.d) {
          if (best && best.code !== r.code) runner = best;
          best = { d: d, code: r.code }; tie = false;
        } else if (r.code !== best.code && (!runner || d < runner.d)) {
          runner = { d: d, code: r.code };
          if (d === best.d) tie = true;
        }
      }
      /*@3.ICSJ.93*/
      if (best && best.d > 0 && runner && (runner.d - best.d) < CLUSTER_MARGIN) tie = true;
      /*@3.ICSJ.82*/
      if (best && !tie) return { code: best.code, why: 'cluster', sure: true };
    }
    /*@3.ICSJ.42*/
    var g = guessCourse(ev.topic, codes);
    if (g && g.score >= GUESS_MIN && g.gap >= GUESS_GAP) {
      return { code: g.code, why: 'topic', sure: true, score: g.score };
    }
    return { code: g ? g.code : null, why: g ? 'weak' : 'none', sure: false, score: g ? g.score : 0 };
  }

  /*@3.ICSJ.43*/

  function api() {
    var E = window.GardenEndpoints || {};
    return String(E.sync || '').replace(/\/+$/, '');
  }

  function fetchFeed(url) {
    var base = api();
    if (!base) return Promise.reject(new Error('no_endpoint'));
    if (!FEED_RE.test(url)) return Promise.reject(new Error('bad_url'));
    return fetch(base + '/v1/ics/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || ('http_' + r.status));
        return j;
      });
    });
  }

  /*@3.ICSJ.44*/

  /*@3.ICSJ.45*/
  function snapOf(rec) {
    /*@3.ICSJ.110*/
    var due = String(rec.due || '');
    return [rec.date || due.slice(0, 10), rec.time || rec.start_time || due.slice(11, 16), rec.title || ''].join('|');
  }

  function termStart() {
    var w = null;
    try { w = window.GardenData && GardenData.termWindow ? GardenData.termWindow() : null; } catch (e) {}
    var a = w && w.start;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a || '')) return '';
    var t = new Date(), today = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
    return a <= today ? a : '';
  }

  function pastPut(s, uid, o) {
    var cur = s.past[uid];
    if (cur && cur.t === o.t && cur.d === o.d && cur.h === o.h && cur.c === o.c && cur.k === o.k && !!cur.g === !!o.g) return;
    s.past[uid] = o;
  }

  function pastList() {
    var s = load();
    return Object.keys(s.past).filter(function (u) { return s.past[u] && !s.skip[u] && !s.past_keep[u]; })
      .map(function (u) { var o = s.past[u]; return { uid: u, title: o.t, kind: o.k, date: o.d, time: o.h, code: o.c || '', gone: !!o.g }; })
      .sort(function (a, b) {
        if (!a.code !== !b.code) return a.code ? -1 : 1;
        return (a.code < b.code ? -1 : a.code > b.code ? 1 : 0) || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
      });
  }

  function pastEv(uid, o) {
    var head = readSummary(o.t);
    return { uid: uid, raw: o.t, kind: o.k || head.kind, code: head.code, topic: head.topic, num: head.num,
             no: itemNo(uid), dtstart: { date: o.d, time: o.h || '' }, dtend: null };
  }

  function keepPast(uid) {
    var s = load(), o = s.past[uid];
    if (!o) return false;
    s.past_keep[uid] = 1;
    if (s.skip[uid]) s.skip[uid] = 0;
    s.past[uid] = 0;
    if (o.g) {
      var codes = myCourses();
      applyOne(pastEv(uid, o), o.c && codes.indexOf(o.c) > -1 ? o.c : null);
      announceWrites();
    }
    save();
    return true;
  }

  function dropPast(uids) {
    var s = load();
    (Array.isArray(uids) ? uids : [uids]).forEach(function (u) {
      if (!s.past[u]) return;
      s.skip[u] = 1;
      s.past[u] = 0;
    });
    save();
    return true;
  }

  function ackBar(uids) {
    var s = load(), n = 0;
    (uids || []).forEach(function (u) { if (!s.bar_ack[u]) { s.bar_ack[u] = 1; n++; } });
    if (n) save();
    return n;
  }

  function myCourses() {
    var sem = null;
    try { sem = JSON.parse(localStorage.getItem('my_semester') || 'null'); } catch (e) {}
    var list = (sem && sem.courses ? sem.courses : []).filter(Boolean)
      .map(function (c) { return c.code; }).filter(Boolean);
    return list;
  }

  /*@3.ICSJ.96*/
  var BB_API = 'https://lms.seu.edu.sa/learn/api/public/v1/calendars/items';
  var BB_WINDOW_D = 111;
  var CAL_RE = /^([A-Za-z]{2,5})-?(\d{3})-(\d{4,6})-(\d{6})(?:\D|$)/;

  function parseCalName(name) {
    var m = CAL_RE.exec(String(name || '').trim());
    if (!m) return null;
    return { code: (m[1] + m[2]).toUpperCase(), crn: m[3], term: m[4] };
  }

  function bbKey(uid) {
    var m = /(_\d+_1)$/.exec(String(uid || ''));
    return m ? m[1] : '';
  }

  /*@3.ICSJ.97*/
  function bbTrust(uid, rec) {
    if (!rec) return false;
    var grad = /GradableItem/i.test(String(uid || ''));
    if (rec.t === 'GradebookColumn') return grad;
    return !grad;
  }

  function isoDay(ms) { return new Date(ms).toISOString().slice(0, 10) + 'T00:00:00.000Z'; }

  function teachWindows(now) {
    var d = 86400e3, a = now - 14 * d;
    return [[a, a + BB_WINDOW_D * d], [a + BB_WINDOW_D * d, a + 2 * BB_WINDOW_D * d]];
  }
  function teachUrl(now, which) {
    var w = teachWindows(now || Date.now())[which || 0];
    return BB_API + '?limit=200&since=' + isoDay(w[0]) + '&until=' + isoDay(w[1]);
  }

  /*@3.ICSJ.98*/
  function teach(input) {
    var s = load();
    var list = input;
    if (typeof list === 'string') {
      try { list = JSON.parse(list.trim()); } catch (e) { return { ok: false, error: 'bad_json' }; }
    }
    if (list && typeof list === 'object' && !Array.isArray(list) && Array.isArray(list.results)) list = list.results;
    if (!Array.isArray(list)) return { ok: false, error: 'bad_shape' };

    var n = 0, other = 0, courses = {}, terms = {}, shared = [];
    list.forEach(function (it) {
      if (!it) return;
      var rec = Array.isArray(it)
        ? { id: it[0], calendarName: it[1], calendarId: it[2] || '', type: it[3] || 'GradebookColumn' }
        : it;
      var id = String(rec.id || '');
      if (!/^_\d+_1$/.test(id)) return;
      var c = parseCalName(rec.calendarName);
      if (!c) { other++; return; }
      var pk = String(rec.calendarId || '');
      s.bb.items[id] = { code: c.code, crn: c.crn, term: c.term, pk: pk, t: String(rec.type || '') };
      if (pk) s.bb.courses[pk] = { code: c.code, crn: c.crn, term: c.term, name: String(rec.calendarName || '').slice(0, 120) };
      courses[c.code + '/' + c.crn] = 1;
      terms[c.term] = (terms[c.term] || 0) + 1;
      shared.push([id, String(rec.calendarName || '').slice(0, 120), pk, String(rec.type || '')]);
      n++;
    });
    if (!n) return { ok: false, error: 'no_items', other: other };
    var top = s.bb.term || '';
    Object.keys(terms).forEach(function (k) { if (k > top) top = k; });
    s.bb.term = top;
    s.bb.at = Date.now();
    s.stamp = '';
    save();
    /*@3.ICSJ.106*/
    try { shareTeach(shared); } catch (e) {}
    var stale = 0;
    Object.keys(s.bb.items).forEach(function (k) { if (s.bb.items[k].term < top) stale++; });
    return { ok: true, items: n, courses: Object.keys(courses).length, term: top,
             other: other, stale: stale, total: Object.keys(s.bb.items).length };
  }

  function bbSummary() {
    var s = load(), b = s.bb || {};
    var cur = 0, stale = 0, cs = {};
    Object.keys(b.items || {}).forEach(function (k) {
      var r = b.items[k];
      if (r.term && b.term && r.term < b.term) stale++; else { cur++; cs[r.code] = 1; }
    });
    return { at: b.at || 0, term: b.term || '', items: cur, stale: stale, courses: Object.keys(cs).sort() };
  }

  /*@3.ICSJ.100*/
  function bookmarklet(target) {
    var src = "(function(){" +
      "if(location.hostname!=='lms.seu.edu.sa'){alert('افتح البلاك بورد أولاً ثم اضغط هذا الرابط');return;}" +
      "var A='" + BB_API + "?limit=200',d=864e5,a=Date.now()-14*d," +
      "W=[[a,a+" + BB_WINDOW_D + "*d],[a+" + BB_WINDOW_D + "*d,a+" + (2 * BB_WINDOW_D) + "*d]]" +
      ".map(function(x){return x.map(function(m){return new Date(m).toISOString().slice(0,10)+'T00:00:00.000Z'})});" +
      "Promise.all(W.map(function(x){return fetch(A+'&since='+x[0]+'&until='+x[1],{credentials:'include'})" +
      ".then(function(r){return r.json()}).then(function(j){return (j&&j.results)||[]})}))" +
      ".then(function(rs){var o=[];rs.forEach(function(l){l.forEach(function(i){o.push([i.id,i.calendarName||'',i.calendarId||'',i.type||''])})});" +
      "var b=btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');" +
      "location.href='" + String(target || '') + "#bbteach='+b;})" +
      ".catch(function(e){alert('تعذّر الجلب: '+e)});" +
      "})()";
    return 'javascript:' + encodeURIComponent(src);
  }

  /*@3.ICSJ.101*/
  function teachFromHash(hash) {
    var m = /[#&]bbteach=([A-Za-z0-9_-]+)/.exec(String(hash || ''));
    if (!m) return null;
    var b = m[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    var json;
    try { json = decodeURIComponent(escape(atob(b))); } catch (e) { return { ok: false, error: 'bad_hash' }; }
    return teach(json);
  }

  /*@3.ICSJ.102*/
  function withTimeout(p, ms) {
    return new Promise(function (ok, no) {
      var t = setTimeout(function () { no(new Error('timeout')); }, ms);
      var clr = function () { try { clearTimeout(t); } catch (e) {} };
      p.then(function (v) { clr(); ok(v); }, function (e) { clr(); no(e); });
    });
  }

  function askMap(events) {
    var s = load();
    var base = api();
    var items = [];
    (events || []).forEach(function (ev) {
      var k = bbKey(ev.uid);
      if (k) items.push([k, String(ev.raw || '').slice(0, 120), /GradableItem/i.test(ev.uid) ? 'g' : 'o']);
    });
    if (!base || !items.length) return Promise.resolve(null);
    return withTimeout(fetch(base + '/v1/ics/map', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.slice(0, 400) })
    }).then(function (r) { return r.ok ? r.json() : null; }), 6000).then(function (j) {
      if (!j || !j.ok) return null;
      var got = 0;
      Object.keys(j.map || {}).forEach(function (id) {
        var m = j.map[id];
        if (!m || !m.code) return;
        var cur = s.bb.items[id];
        /*@3.ICSJ.103*/
        if (cur && cur.src === 'teach') return;
        s.bb.items[id] = { code: String(m.code).toUpperCase(), crn: m.crn || '', term: m.term || '',
                           pk: '', t: m.kind === 'o' ? 'Course' : 'GradebookColumn', src: m.src || 'server' };
        got++;
      });
      s.bb.cl = j.cl && typeof j.cl === 'object' ? j.cl : {};
      if (j.term && String(j.term) > String(s.bb.term || '')) s.bb.term = String(j.term);
      save();
      return got;
    }).catch(function () { return null; });
  }

  /*@3.ICSJ.104*/
  function shareTeach(list) {
    var base = api();
    if (!base || !list || !list.length) return Promise.resolve(false);
    var items = list.slice(0, 400).map(function (it) {
      return Array.isArray(it) ? it.slice(0, 4)
        : [it.id, it.calendarName || '', it.calendarId || '', it.type || ''];
    });
    return fetch(base + '/v1/ics/teach', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items })
    }).then(function (r) { return r.ok; }, function () { return false; });
  }

  /*@3.ICSJ.105*/
  var nameCache = null;
  function courseNames(codes) {
    if (nameCache && nameCache.key === codes.join(',')) return nameCache.list;
    var list = [];
    codes.forEach(function (code) {
      var names = [];
      try {
        var G = window.GardenData;
        if (G && G.courseInfo) { var i = G.courseInfo(code); if (i) { names.push(i.name_en); names.push(i.name_ar); } }
        if (G && G.courseTitle) names.push(G.courseTitle(code));
      } catch (e) {}
      names = names.map(norm).filter(function (n) {
        return n && n !== norm(code) && n.length >= 8 && n.split(' ').length >= 2;
      });
      if (names.length) list.push({ code: code, names: names });
    });
    nameCache = { key: codes.join(','), list: list };
    return list;
  }
  function nameAnchor(ev, codes) {
    var title = norm(ev.raw);
    if (!title) return null;
    var hits = [];
    courseNames(codes).forEach(function (c) {
      for (var i = 0; i < c.names.length; i++) {
        if (title.indexOf(c.names[i]) > -1) { hits.push(c.code); return; }
      }
    });
    return hits.length === 1 ? hits[0] : null;
  }

  function myCoursesFull() {
    var sem = null;
    try { sem = JSON.parse(localStorage.getItem('my_semester') || 'null'); } catch (e) {}
    return (sem && sem.courses ? sem.courses : []).filter(function (c) { return c && c.code; })
      .map(function (c) {
        var nm = '';
        try {
          if (window.GardenData && GardenData.courseTitle) nm = GardenData.courseTitle(c.code) || '';
        } catch (e) {}
        if (!nm || nm === c.code) nm = c.name_ar || c.name_en || c.name || '';
        return { code: c.code, name: nm === c.code ? '' : nm };
      });
  }

  /*@3.ICSJ.91*/
  function bandSkipped(s, ev) {
    var list = s.skip_bands || [], i, b;
    for (i = 0; i < list.length; i++) {
      b = list[i];
      if (!b) continue;
      if (b.code && ev.code && ev.code === b.code) return true;
      if (!b.code && typeof b.lo === 'number' && ev.no !== null
          && ev.no >= b.lo && ev.no <= b.hi) return true;
    }
    return false;
  }

  function ignoreBand(uid) {
    var s = load(), g = null;
    groupInbox(s.inbox).forEach(function (x) {
      for (var i = 0; i < x.items.length; i++) if (x.items[i].uid === uid) { g = x; return; }
    });
    if (!g) return skip(uid);
    var code = g.foreign || g.code || '';
    s.skip_bands.push(code ? { code: code } : { lo: g.lo, hi: g.hi, code: '' });
    g.items.forEach(function (it) { s.skip[it.uid] = 1; });
    save();
    return true;
  }

  function clearIgnored() {
    var s = load();
    s.skip_bands = []; s.skip = {};
    save();
    return true;
  }

  /*@3.ICSJ.73*/
  function schedRaw(create) {
    var d = null;
    try { d = JSON.parse(localStorage.getItem('weekly_schedule') || 'null'); } catch (e) { d = null; }
    if (!d || typeof d !== 'object') {
      if (!create) return null;
      d = { version: 2, settings: {}, lectures: [], study_blocks: [], exams: [],
            general_events: [], week_overrides: {}, archived: {} };
    }
    if (!Array.isArray(d.exams)) d.exams = [];
    return d;
  }
  /*@3.ICSJ.127*/
  function bannerExam(code, kind) {
    var sch = schedRaw();
    var list = (sch && sch.exams) || [];
    for (var i = 0; i < list.length; i++) {
      var x = list[i];
      if (x && x.sx_crn && x.course_code === code && x.exam_type === kind) return x;
    }
    return null;
  }
  function schedWrite(s) {
    s.updated_at = new Date().toISOString();
    try {
      localStorage.setItem('weekly_schedule', JSON.stringify(s));
      localStorage.setItem('__syncT_weekly_schedule', String(Date.now()));
      wrote = true;
      return true;
    } catch (e) { return false; }
  }

  /*@3.ICSJ.111*/
  var wrote = false;
  function announceWrites() {
    if (!wrote) return false;
    wrote = false;
    try {
      if (window.GardenScheduleRules && GardenScheduleRules.announce) GardenScheduleRules.announce('ics');
      else window.dispatchEvent(new CustomEvent('garden:scheduleChanged', { detail: { from: 'ics' } }));
    } catch (e) {}
    return true;
  }

  /*@3.ICSJ.112*/
  var TASK_TYPE = { quiz: 'quiz', exam: 'exam', midterm: 'midterm', final: 'final',
                    assignment: 'assignment', project: 'project', discussion: 'discussion' };

  function findTask(id) {
    var list = (window.GardenData && GardenData.tasks) ? (GardenData.tasks() || []) : [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i];
    return null;
  }

  function applyPending(ev) {
    if (!window.GardenData || !GardenData.upsertTask) return 'blocked';
    var link = load().links[ev.uid];
    if (link && link.store !== 'task') return false;
    return applyOne(ev, null);
  }

  function dropPending(uid) {
    var s = load();
    var link = s.links[uid];
    if (link && link.store === 'task') removeLink(uid);
  }

  var EXAMISH = { quiz: 1, exam: 1, midterm: 1, final: 1 };

  /*@3.ICSJ.116*/
  var FIELDS = {
    exam: ['date', 'time', 'end', 'allday', 'title', 'code', 'kind'],
    date: ['date', 'time', 'title', 'code', 'kind'],
    task: ['date', 'time', 'title', 'code', 'kind']
  };
  var DATE_T = { assignment: 1, project: 1, discussion: 1 };

  function readRec(store, rec, code) {
    if (!rec) return null;
    if (store === 'exam') {
      return { date: rec.date || '', time: rec.start_time || '', end: rec.end_time || '',
               allday: !!rec.all_day, title: rec.notes || '', code: rec.course_code || '',
               kind: rec.exam_type || 'exam' };
    }
    if (store === 'date') {
      return { date: rec.date || '', time: rec.time || '', title: rec.title || '',
               code: code || '', kind: rec.type || 'assignment' };
    }
    var due = String(rec.due || '');
    return { date: due.slice(0, 10), time: due.slice(11, 16), title: rec.title || '',
             code: rec.course || '', kind: rec.type || 'other' };
  }

  /*@3.ICSJ.48*/
  function bbCanon(ev, code) {
    var w = ev.dtstart, e = ev.dtend;
    var deadline = !e || (e.date === w.date && e.time === w.time);
    return { date: w.date, time: w.time || '', end: deadline ? '' : ((e && e.time) || ''),
             allday: deadline, title: ev.raw, code: code || '', kind: ev.kind };
  }

  function locate(link) {
    if (!link) return null;
    var i, list;
    if (link.store === 'exam') {
      var sch = schedRaw();
      list = (sch && sch.exams) || [];
      for (i = 0; i < list.length; i++) if (list[i] && list[i].id === link.id) return list[i];
      return null;
    }
    if (link.store === 'date') {
      if (!window.GardenData || !GardenData.courseMeta || !link.code) return null;
      list = GardenData.courseMeta(link.code).dates || [];
      for (i = 0; i < list.length; i++) if (list[i] && list[i].id === link.id) return list[i];
      return null;
    }
    if (link.store === 'task') return findTask(link.id);
    return null;
  }

  function dropRec(link) {
    if (link.store === 'exam') {
      var sch = schedRaw();
      if (sch && Array.isArray(sch.exams)) {
        var n = sch.exams.length;
        sch.exams = sch.exams.filter(function (e) { return !e || e.id !== link.id; });
        if (sch.exams.length !== n) schedWrite(sch);
      }
    } else if (link.store === 'date' && window.GardenData && GardenData.courseMeta) {
      var meta = GardenData.courseMeta(link.code);
      var m = meta.dates.length;
      meta.dates = meta.dates.filter(function (d) { return !d || d.id !== link.id; });
      if (meta.dates.length !== m) GardenData.saveCourseMeta(link.code, meta);
    } else if (link.store === 'task' && window.GardenData && GardenData.deleteTask) {
      GardenData.deleteTask(link.id); wrote = true;
    }
  }

  /*@3.ICSJ.117*/
  function capture(s, uid, link, rec) {
    var store = link.store;
    var now = readRec(store, rec, link.code);
    var ov = s.over[uid] || null;
    var fields = FIELDS[store] || [];
    if (!link.w) {
      /*@3.ICSJ.118*/
      if (!link.snap || link.snap === snapOf(rec)) { link.w = now; return ov; }
      ov = ov || (s.over[uid] = { f: {}, t: 0 });
      fields.forEach(function (k) { if (k !== 'code' || now[k]) ov.f[k] = now[k]; });
      ov.t = Date.now();
      link.w = now;
      return ov;
    }
    var bbv = link.bb || {};
    fields.forEach(function (k) {
      if (now[k] === link.w[k]) return;
      ov = ov || (s.over[uid] = { f: {}, t: 0 });
      if (!ov.f) ov.f = {};
      /*@3.ICSJ.119*/
      if (bbv[k] !== undefined && now[k] === bbv[k]) ov.f[k] = null;
      else if (k !== 'code' || now[k]) ov.f[k] = now[k];
      ov.t = Date.now();
    });
    return ov;
  }

  /*@3.ICSJ.46*/
  function writeRec(store, base, fin, uid) {
    var r = base ? JSON.parse(JSON.stringify(base)) : {};
    if (store === 'exam') {
      r.course_code = fin.code;
      r.date = fin.date;
      r.start_time = fin.allday ? '' : (fin.time || '');
      r.end_time = fin.allday ? '' : (fin.end || '');
      r.exam_type = (fin.kind === 'quiz' || fin.kind === 'midterm' || fin.kind === 'final') ? fin.kind : 'exam';
      if (r.room === undefined) r.room = '';
      r.notes = fin.title;
      r.all_day = !!fin.allday;        /*@3.ICSJ.49*/
      if (r.completed_at === undefined) r.completed_at = null;
      r.ics_uid = uid;
    } else if (store === 'date') {
      /*@3.ICSJ.50*/
      r.title = fin.title;
      r.date = fin.date;
      r.time = fin.time || '';
      r.type = DATE_T[fin.kind] ? fin.kind : 'assignment';
      if (r.done === undefined) r.done = false;
      if (r.note === undefined) r.note = '';
    } else {
      r.title = fin.title;
      r.course = fin.code || null;
      r.type = TASK_TYPE[fin.kind] || fin.kind || 'other';
      r.due = fin.date + (fin.time ? 'T' + fin.time : '');
      if (r.done === undefined) r.done = false;
      if (r.note === undefined) r.note = '';
      r.origin = { type: 'ics', uid: uid, pending: !fin.code };
    }
    return r;
  }

  /*@3.ICSJ.113*/
  function carryInto(store, r, from) {
    var fr = from.rec || {};
    var done = from.store === 'exam' ? !!fr.completed_at : !!fr.done;
    var note = from.store === 'exam' ? '' : (fr.note || '');
    if (store === 'exam') {
      if (done && !r.completed_at) r.completed_at = fr.completed_at || new Date().toISOString();
      if (fr.room && !r.room) r.room = fr.room;
    } else {
      /*@3.ICSJ.51*/
      if (done) r.done = true;
      if (note && !r.note) r.note = note;
      if (from.store === 'exam' && fr.room && store === 'date' && !r.location) r.location = fr.room;
    }
  }

  function same(a, b) {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; }
  }

  function putRec(store, rec, code) {
    var i;
    if (store === 'exam') {
      var sch = schedRaw(true);
      if (!sch) return null;
      for (i = 0; i < sch.exams.length; i++) if (sch.exams[i] && sch.exams[i].id === rec.id) break;
      if (i < sch.exams.length) {
        if (same(sch.exams[i], rec)) return rec;
        sch.exams[i] = rec;
      } else sch.exams.push(rec);
      /*@3.ICSJ.74*/
      return schedWrite(sch) ? rec : null;
    }
    if (store === 'date') {
      if (!window.GardenData || !GardenData.courseMeta) return null;
      var meta = GardenData.courseMeta(code);
      for (i = 0; i < meta.dates.length; i++) if (meta.dates[i] && meta.dates[i].id === rec.id) break;
      if (i < meta.dates.length) {
        if (same(meta.dates[i], rec)) return rec;
        meta.dates[i] = rec;
      } else meta.dates.push(rec);
      GardenData.saveCourseMeta(code, meta);
      return rec;
    }
    if (!window.GardenData || !GardenData.upsertTask) return null;
    var was = findTask(rec.id);
    if (was && same(was, rec)) return was;
    var out = GardenData.upsertTask(rec);
    wrote = true;
    return out || rec;
  }

  function hasFields(ov) {
    return !!(ov && ov.f && Object.keys(ov.f).some(function (k) { return ov.f[k] !== null; }));
  }

  function applyOne(ev, code) {
    var s = load();
    var uid = ev.uid;
    var link = s.links[uid] || null;
    var cur = link ? locate(link) : null;
    var ov = (link && cur) ? capture(s, uid, link, cur) : (s.over[uid] || null);

    var bb = bbCanon(ev, code);
    var mine = (ov && ov.f) || {};
    var fin = {};
    Object.keys(bb).forEach(function (k) { fin[k] = bb[k]; });
    /*@3.ICSJ.126*/
    Object.keys(mine).forEach(function (k) { if (k !== 'code' && mine[k] !== null) fin[k] = mine[k]; });
    fin.code = code || mine.code || '';

    /*@3.ICSJ.120*/
    if (ov && link && link.bb) {
      Object.keys(mine).forEach(function (k) {
        if (k === 'code' || mine[k] === null || link.bb[k] === undefined) return;
        if (bb[k] !== link.bb[k] && bb[k] !== mine[k]) (ov.news = ov.news || {})[k] = bb[k];
      });
    }

    var store = code ? (EXAMISH[fin.kind] ? 'exam' : 'date') : 'task';
    if (store === 'exam' && (fin.kind === 'midterm' || fin.kind === 'final') && bannerExam(fin.code, fin.kind)) {
      if (link && cur) dropRec(link);
      delete s.links[uid];
      return 'banner';
    }

    /*@3.ICSJ.47*/
    var from = null;
    if (link && cur && (link.store !== store || (store === 'date' && link.code !== fin.code))) {
      from = { store: link.store, rec: cur };
      dropRec(link);
      cur = null;
    }

    var id = (link && link.store === store && (cur || !from)) ? link.id
           : (store === 'exam' ? 'exam_ics_' : (store === 'date' ? 'ics_' : 'ics_p_')) + hash(uid);
    var rec = writeRec(store, cur, fin, uid);
    rec.id = id;
    if (from) carryInto(store, rec, from);

    var put = putRec(store, rec, fin.code);
    if (!put) return 'blocked';
    s.links[uid] = { store: store, id: id, code: store === 'task' ? '' : fin.code,
                     snap: snapOf(put), w: readRec(store, put, fin.code), bb: bb };
    if (ov && !hasFields(ov) && !(ov.news && Object.keys(ov.news).length)) delete s.over[uid];
    return hasFields(ov) ? 'touched' : true;
  }

  /*@3.ICSJ.52*/
  function hash(s) {
    var h = 5381, i;
    for (i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function removeLink(uid) {
    var s = load();
    var link = s.links[uid];
    if (!link) return false;
    if (link.store === 'exam') {
      var sch = schedRaw();
      if (sch && Array.isArray(sch.exams)) {
        var before = sch.exams.length;
        sch.exams = sch.exams.filter(function (e) { return !e || e.id !== link.id; });
        if (sch.exams.length !== before) schedWrite(sch);
      }
    } else if (link.store === 'date' && window.GardenData && GardenData.courseMeta) {
      var meta = GardenData.courseMeta(link.code);
      var n = meta.dates.length;
      meta.dates = meta.dates.filter(function (d) { return !d || d.id !== link.id; });
      if (meta.dates.length !== n) GardenData.saveCourseMeta(link.code, meta);
    } else if (link.store === 'task') {
      if (window.GardenData && GardenData.deleteTask) { GardenData.deleteTask(link.id); wrote = true; }
    }
    delete s.links[uid];
    return true;
  }

  /*@3.ICSJ.53*/

  /*@3.ICSJ.54*/
  function sync(opts) {
    opts = opts || {};
    var s = load();
    if (!s.url) return Promise.resolve({ ok: false, error: 'no_url' });

    s.last_try = Date.now(); save();

    return Promise.all([fetchFeed(s.url), loadIndex()]).then(function (r) {
      var body = r[0] && r[0].ics;
      if (!body) throw new Error('empty');

      var stamp = hash(body);
      var events = parseICS(body).map(function (e) {
        var head = readSummary(e.summary, e.extra);
        return {
          uid: e.uid, raw: e.summary, kind: head.kind, code: head.code,
          topic: head.topic, num: head.num, no: itemNo(e.uid),
          dtstart: e.dtstart, dtend: e.dtend
        };
      }).filter(function (e) { return e.dtstart && e.dtstart.date; });

      s.count = events.length;
      /*@3.ICSJ.108*/
      return askMap(events).then(function () { return finish(events, stamp); });
    }).catch(function (e) {
      s.last_err = String((e && e.message) || e || 'error');
      save();
      emit('ics:sync', { ok: false, error: s.last_err });
      return { ok: false, error: s.last_err };
    });

    function finish(events, stamp) {
      s.props = Object.keys(SEEN_PROPS).sort();

      /*@3.ICSJ.55*/
      var same = (stamp === s.stamp);
      s.stamp = stamp;

      var codes = myCourses();
      var rep = { ok: true, added: 0, updated: 0, touched: 0, pending: 0, gone: 0,
                  blocked: 0, ignored: 0, foreign: 0, stale: 0, named: 0, elim: 0, past: 0, unchanged: same, total: events.length };
      var seen = {}, inbox = [], fams = {}, tw = termStart();

      /*@3.ICSJ.125*/
      events.forEach(function (ev) {
        var L = s.links[ev.uid], cur = L ? locate(L) : null;
        if (cur) capture(s, ev.uid, L, cur);
      });

      events.forEach(function (ev) {
        seen[ev.uid] = 1;
        /*@3.ICSJ.92*/
        /*@3.ICSJ.114*/
        if (s.skip[ev.uid] || bandSkipped(s, ev)) { rep.ignored++; dropPending(ev.uid); return; }

        var r2 = resolve(ev, codes);
        var kept = !!s.past_keep[ev.uid];
        if (!kept && !s.over[ev.uid] && (r2.why === 'stale' || (tw && ev.dtstart.date < tw))) {
          rep.ignored++; rep.past++;
          if (r2.why === 'stale') rep.stale++;
          pastPut(s, ev.uid, { t: ev.raw, k: ev.kind, d: ev.dtstart.date, h: ev.dtstart.time || '',
                               c: r2.foreign || r2.code || ev.code || '' });
          if (s.links[ev.uid]) removeLink(ev.uid);
          return;
        }
        if (s.past[ev.uid]) s.past[ev.uid] = 0;
        if (kept && (!r2.sure || !r2.code)) {
          var ko = applyOne(ev, null);
          if (ko === true) rep.added++;
          return;
        }
        if (r2.why === 'stale') { rep.ignored++; rep.stale++; dropPending(ev.uid); return; }
        if (r2.sure && r2.code && famTrusted(s, ev, r2)) famAdd(fams, ev, r2.code);
        else if (r2.why === 'foreign') famAdd(fams, ev, r2.foreign);
        if (!r2.sure || !r2.code) {
          rep.pending++;
          var shown = false;
          if (r2.why === 'foreign') { rep.foreign++; dropPending(ev.uid); }
          else { shown = applyPending(ev); if (shown === 'touched') rep.touched++; }
          inbox.push({
            uid: ev.uid, raw: ev.raw, kind: ev.kind, no: ev.no,
            date: ev.dtstart.date, time: ev.dtstart.time,
            /*@3.ICSJ.84*/
            code: ev.code || '',
            foreign: r2.why === 'foreign' ? r2.foreign : '',
            guess: r2.code || '', score: Math.round((r2.score || 0) * 100), why: r2.why,
            shown: shown === true || shown === 'touched'
          });
          return;
        }
        if (r2.why === 'name') rep.named++;
        var had = !!s.links[ev.uid];
        var out = applyOne(ev, r2.code);
        if (out === 'touched') rep.touched++;
        else if (out === true) { if (had) rep.updated++; else rep.added++; }
        else if (out === 'banner') rep.banner = (rep.banner || 0) + 1;
        /*@3.ICSJ.85*/
        else rep.blocked++;
      });

      /*@3.ICSJ.109*/
      if (inbox.length) {
        var evBy = {}, famDone = {}, waiting = {};
        events.forEach(function (ev) { evBy[ev.uid] = ev; });
        inbox.forEach(function (it) {
          var wf = evBy[it.uid] && famOf(evBy[it.uid]);
          if (wf) waiting[wf.key] = (waiting[wf.key] || 0) + 1;
        });
        inbox.forEach(function (it) {
          var ev = evBy[it.uid];
          if (!ev || it.foreign || it.why === 'stale') return;
          var fc = familyPick(fams, ev, codes, waiting);
          if (!fc) return;
          var fo = applyOne(ev, fc);
          if (fo !== true && fo !== 'touched' && fo !== 'banner') return;
          var fk = bbKey(ev.uid);
          if (fk) s.bb.items[fk] = { code: fc, crn: '', term: s.bb.term || '', pk: '',
                                     t: /GradableItem/i.test(ev.uid) ? 'GradebookColumn' : 'Course', src: 'family' };
          famDone[it.uid] = 1;
          rep.pending--; rep.family = (rep.family || 0) + 1;
          if (fo === true) rep.added++;
        });
        inbox = inbox.filter(function (it) { return !famDone[it.uid]; });
      }

      var pend = inbox.filter(function (it) { return !it.foreign && it.why !== 'stale'; });
      if (pend.length && codes.length) {
        var linked = {};
        /*@3.ICSJ.115*/
        Object.keys(s.links).forEach(function (u) { var L = s.links[u]; if (L && L.code && seen[u]) linked[L.code] = 1; });
        var missing = codes.filter(function (c) { return !linked[c]; });
        var sigs = {}, allCl = true;
        pend.forEach(function (it) {
          var c = s.bb.cl[bbKey(it.uid)];
          if (!c || !(c.n >= 2)) { allCl = false; return; }
          sigs[c.sig] = 1;
        });
        if (missing.length === 1 && allCl && Object.keys(sigs).length === 1) {
          var byUid = {};
          events.forEach(function (ev) { byUid[ev.uid] = ev; });
          pend.forEach(function (it) {
            var ev = byUid[it.uid];
            if (!ev) return;
            s.bb.items[bbKey(ev.uid)] = { code: missing[0], crn: '', term: s.bb.term || '', pk: '',
                                         t: /GradableItem/i.test(ev.uid) ? 'GradebookColumn' : 'Course', src: 'elim' };
            var o = applyOne(ev, missing[0]);
            if (o === true) { rep.added++; rep.elim++; rep.pending--; }
          });
          inbox = inbox.filter(function (it) { return !(s.bb.items[bbKey(it.uid)] && s.bb.items[bbKey(it.uid)].src === 'elim'); });
        }
      }

      /*@3.ICSJ.56*/
      if (tw) Object.keys(s.links).forEach(function (uid) {
        if (seen[uid] || s.past_keep[uid] || s.over[uid]) return;
        var Lk = s.links[uid], b = Lk.bb || {}, sp = String(Lk.snap || '').split('|');
        var d = b.date || sp[0] || '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d >= tw) return;
        pastPut(s, uid, { t: b.title || sp.slice(2).join('|') || '', k: b.kind || '', d: d,
                          h: b.time || sp[1] || '', c: Lk.code || b.code || '', g: 1 });
        removeLink(uid);
        rep.past++;
      });
      Object.keys(s.links).forEach(function (uid) { if (!seen[uid]) rep.gone++; });
      rep.changed = changes().filter(function (c) { return seen[c.uid]; }).length;
      rep.deleted = deletedCount();

      s.inbox = inbox;
      s.last_ok = Date.now();
      s.last_err = '';
      save();
      announceWrites();
      try { pushOver(); } catch (e) {}
      emit('ics:sync', rep);
      return rep;
    }
  }

  /*@3.ICSJ.121*/
  function uidOf(store, id) {
    var s = load();
    var keys = Object.keys(s.links);
    for (var i = 0; i < keys.length; i++) {
      var L = s.links[keys[i]];
      if (L && L.store === store && L.id === id) return keys[i];
    }
    return '';
  }

  function userDeleted(store, id) {
    var uid = uidOf(store, id);
    if (!uid) return '';
    var s = load();
    s.skip[uid] = 2;
    save();
    try { pushOver(); } catch (e) {}
    return uid;
  }

  /*@3.ICSJ.122*/
  function relink(oldStore, oldId, newStore, newId, code) {
    var uid = uidOf(oldStore, oldId);
    if (!uid) return '';
    var s = load(), L = s.links[uid];
    L.store = newStore; L.id = newId; L.code = newStore === 'task' ? '' : (code || L.code);
    save();
    return uid;
  }

  function linkOf(store, id) {
    var uid = uidOf(store, id);
    if (!uid) return null;
    var s = load(), ov = s.over[uid] || null;
    return { uid: uid, edited: hasFields(ov),
             news: ov && ov.news && Object.keys(ov.news).length ? ov.news : null };
  }

  function revert(uid) {
    var s = load();
    if (!s.over[uid]) return false;
    delete s.over[uid];
    s.stamp = '';
    save();
    return true;
  }

  /*@3.ICSJ.123*/
  function acceptNews(uid) {
    var s = load(), ov = s.over[uid];
    if (!ov || !ov.news) return false;
    Object.keys(ov.news).forEach(function (k) { if (ov.f) ov.f[k] = null; });
    delete ov.news;
    if (!hasFields(ov)) delete s.over[uid];
    s.stamp = '';
    save();
    return true;
  }

  function keepMine(uid) {
    var s = load(), ov = s.over[uid];
    if (!ov || !ov.news) return false;
    delete ov.news;
    save();
    return true;
  }

  function changes() {
    var s = load(), out = [];
    Object.keys(s.over).forEach(function (uid) {
      var ov = s.over[uid], L = s.links[uid];
      if (!ov || !ov.news || !Object.keys(ov.news).length || !L || s.skip[uid]) return;
      out.push({ uid: uid, store: L.store, id: L.id, code: L.code || '',
                 mine: L.w || {}, news: ov.news });
    });
    return out;
  }

  function deletedCount() {
    var s = load();
    return Object.keys(s.skip).filter(function (u) { return s.skip[u] === 2; }).length;
  }

  function restoreDeleted() {
    var s = load(), n = 0;
    Object.keys(s.skip).forEach(function (u) { if (s.skip[u] === 2) { s.skip[u] = 0; n++; } });
    if (n) { s.stamp = ''; save(); }
    return n;
  }

  /*@3.ICSJ.124*/
  function riyadhMs(date, time) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ''));
    if (!m) return 0;
    var t = /^(\d{2}):(\d{2})/.exec(String(time || '')) || [0, '23', '59'];
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]) - 3 * 3600e3;
  }

  function overPayload() {
    var s = load(), hide = [], at = {}, n = 0;
    Object.keys(s.skip).forEach(function (u) { if (s.skip[u] === 2 && hide.length < 500) hide.push(u); });
    Object.keys(s.over).forEach(function (u) {
      var ov = s.over[u], L = s.links[u];
      if (!ov || !ov.f || !L || !L.w || n >= 500) return;
      if (ov.f.date == null && ov.f.time == null && ov.f.allday == null) return;
      var ms = riyadhMs(L.w.date, L.w.allday ? '' : L.w.time);
      if (ms) { at[u] = ms; n++; }
    });
    hide.sort();
    return { hide: hide, at: at };
  }

  function pushOver() {
    var s = load();
    var base = api();
    if (!base || !s.url || !s.on_server) return Promise.resolve(false);
    var body = overPayload();
    var sig = hash(JSON.stringify(body));
    if (sig === s.over_sig) return Promise.resolve(true);
    return vaultId().then(function (vid) {
      if (!vid) return false;
      return fetch(base + '/v1/ics/over', {
        method: 'POST',
        headers: vh({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ vault_id: vid, hide: body.hide, at: body.at })
      }).then(function (r) {
        if (r.ok) { load().over_sig = sig; save(); }
        return r.ok;
      }, function () { return false; });
    });
  }

  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) {}
  }

  /*@3.ICSJ.57*/

  /*@3.ICSJ.58*/
  function assign(uid, code, alsoCluster) {
    var s = load();
    if (!code) return false;
    s.uid_map[uid] = code;
    if (alsoCluster !== false) {
      var no = itemNo(uid);
      if (no !== null) {
        /*@3.ICSJ.83*/
        var g = null;
        groupInbox(s.inbox).forEach(function (x) {
          if (x.lo !== null && no >= x.lo && no <= x.hi) g = x;
        });
        addRange(s, g ? g.lo : no, g ? g.hi : no, code);
      }
    }
    save();
    return true;
  }

  function skip(uid) { var s = load(); s.skip[uid] = 1; save(); return true; }

  function unskip(uid) { var s = load(); if (s.skip[uid]) s.skip[uid] = 0; save(); return true; }

  /*@3.ICSJ.59*/
  function disconnect(alsoWipe) {
    var s = load();
    var url = s.url;
    if (alsoWipe) Object.keys(s.links).forEach(removeLink);
    s.url = ''; s.on_server = false; s.stamp = ''; s.inbox = []; s.last_ok = 0; s.last_err = '';
    save();
    announceWrites();
    var base = api();
    if (!base || !url) return Promise.resolve(true);
    return unregister().then(function () { return true; }, function () { return true; });
  }

  /*@3.ICSJ.60*/

  /*@3.ICSJ.72*/
  function vh(extra) {
    var S = window.GardenSync;
    if (S && S.vaultHeaders) return S.vaultHeaders(null, extra || {});
    return Object.assign({}, extra || {});
  }

  /*@3.ICSJ.61*/
  function register(pushId) {
    var s = load();
    var base = api();
    if (!base || !s.url) return Promise.resolve(false);
    return vaultId().then(function (vid) {
      if (!vid) return 'no-vault';
      return fetch(base + '/v1/ics/feed', {
        method: 'POST',
        headers: vh({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          vault_id: vid, url: s.url,
          push_id: pushId || vid, lead_days: s.lead_days
        })
      }).then(function (r) { return r.ok; }, function () { return false; });
    }).then(function (ok) {
      s.on_server = ok === true;
      if (s.on_server) s.over_sig = '';
      save();
      if (s.on_server) { try { pushOver(); } catch (e) {} }
      return ok;
    });
  }

  function unregister() {
    var base = api();
    if (!base) return Promise.resolve(false);
    return vaultId().then(function (vid) {
      if (!vid) return false;
      return fetch(base + '/v1/ics/feed?vault_id=' + encodeURIComponent(vid),
                   { method: 'DELETE', headers: vh() })
        .then(function (r) { return r.ok; }, function () { return false; });
    });
  }

  /*@3.ICSJ.67*/
  var VAULT_RE = /^v[0-9a-f]{32}$/;

  function vaultId() {
    try {
      if (window.GardenSync && GardenSync.vaultDocId) {
        return Promise.resolve(GardenSync.vaultDocId()).then(function (v) {
          return VAULT_RE.test(String(v || '')) ? String(v) : '';
        }, function () { return ''; });
      }
      var k = (window.GardenSync && GardenSync.getKey && GardenSync.getKey()) || '';
      return Promise.resolve(VAULT_RE.test(k) ? k : '');
    } catch (e) { return Promise.resolve(''); }
  }

  /*@3.ICSJ.62*/

  /*@3.ICSJ.63*/
  function bootSync() {
    var s = load();
    try { pushOver(); } catch (e) {}
    if (!s.url || !s.auto) return;
    if (Date.now() - s.last_ok < FRESH_MS) return;
    sync({ quiet: true });
  }

  window.GardenICS = {
    KEY: LS_KEY,
    FEED_RE: FEED_RE,
    state: load,
    save: save,
    setUrl: function (u) {
      var s = load();
      if (!FEED_RE.test(u || '')) return false;
      if (s.url !== u) { s.stamp = ''; s.inbox = []; }
      s.url = u; save(); return true;
    },
    setLead: function (n) { var s = load(); s.lead_days = Math.max(0, Math.min(14, n | 0)); save(); return s.lead_days; },
    setAuto: function (b) { var s = load(); s.auto = !!b; save(); return s.auto; },
    sync: sync,
    bootSync: bootSync,
    register: register,
    unregister: unregister,
    disconnect: disconnect,
    assign: assign,
    skip: skip,
    unskip: unskip,
    removeLink: removeLink,
    userDeleted: userDeleted,
    relink: relink,
    linkOf: linkOf,
    revert: revert,
    acceptNews: acceptNews,
    keepMine: keepMine,
    changes: changes,
    deletedCount: deletedCount,
    restoreDeleted: restoreDeleted,
    pushOver: pushOver,
    _overPayload: overPayload,
    myCourses: myCourses,
    myCoursesFull: myCoursesFull,
    teach: teach,
    pastList: pastList,
    keepPast: keepPast,
    dropPast: dropPast,
    ackBar: ackBar,
    askMap: askMap,
    _nameAnchor: nameAnchor,
    teachUrl: teachUrl,
    teachFromHash: teachFromHash,
    bookmarklet: bookmarklet,
    bbSummary: bbSummary,
    _parseCalName: parseCalName,
    _bbKey: bbKey,
    _teachWindows: teachWindows,
    ignoreBand: ignoreBand,
    clearIgnored: clearIgnored,
    pending: function () { return (load().inbox || []).length; },
    props: function () { return (load().props || []).slice(); },
    _bandSkipped: bandSkipped,
    /*@3.ICSJ.64*/
    _parse: parseICS,
    _read: readSummary,
    groupInbox: groupInbox,
    _itemNo: itemNo,
    _cluster: cluster,
    _guess: guessCourse,
    _loadIndex: loadIndex,
    /*@3.ICSJ.65*/
    _setIndex: function (list) {
      idx = (list || []).filter(function (e) { return e && e.code && (e.t === 'module' || e.t === 'concept'); })
        .map(function (e) { return { code: e.code, en: norm(e.en), ar: norm(e.ar) }; });
      return idx.length;
    },
    _resolve: resolve,
    /*@3.ICSJ.66*/
    _applyOne: applyOne,
    _applyPending: applyPending,
    _load: load,
    _snap: snapOf
  };

})();
