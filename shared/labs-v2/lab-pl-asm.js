/*@4.LAPAJ.1*/
(function (global) {
  'use strict';

  var TRACE_CAP = 400;

  function msg(ar, en) { return { ar: ar, en: en }; }
  function fail(line, ar, en) { var e = new Error(en); e.line = line; e.ar = ar; e.en = en; return e; }

  /*@4.LAPAJ.2*/
  function stripComment(text, marks) {
    var out = '', quote = null;
    for (var i = 0; i < text.length; i += 1) {
      var ch = text.charAt(i);
      if (quote) {
        out += ch;
        if (ch === '\\') { out += text.charAt(i + 1); i += 1; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === '\'') {
        if (ch === '\'' && /[0-9A-Za-z_]/.test(text.charAt(i - 1) || '') ) { out += ch; continue; }
        quote = ch; out += ch; continue;
      }
      for (var m = 0; m < marks.length; m += 1) {
        if (text.substr(i, marks[m].length) === marks[m]) return out;
      }
      out += ch;
    }
    return out;
  }

  function splitArgs(text) {
    var parts = [], depth = 0, cur = '', quote = null;
    for (var i = 0; i < text.length; i += 1) {
      var ch = text.charAt(i);
      if (quote) {
        cur += ch;
        if (ch === '\\') { cur += text.charAt(i + 1); i += 1; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || (ch === '\'' && !/[0-9A-Za-z_]/.test(text.charAt(i - 1) || ''))) { quote = ch; cur += ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') depth += 1;
      if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
      if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim().length || parts.length) parts.push(cur.trim());
    return parts;
  }

  /*@4.LAPAJ.3*/
  function unescapeString(body) {
    var out = [];
    var enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
    var plain = '';
    function flush() {
      if (!plain) return;
      var bytes = enc ? enc.encode(plain) : Buffer.from(plain, 'utf8');
      for (var k = 0; k < bytes.length; k += 1) out.push(bytes[k]);
      plain = '';
    }
    for (var i = 0; i < body.length; i += 1) {
      var ch = body.charAt(i);
      if (ch !== '\\') { plain += ch; continue; }
      var n = body.charAt(i + 1);
      i += 1;
      var simple = { n: 10, t: 9, r: 13, '0': 0, '\\': 92, '"': 34, '\'': 39, a: 7, b: 8, f: 12, v: 11, e: 27 };
      if (n === 'x') {
        var hex = (body.substr(i + 1).match(/^[0-9A-Fa-f]{1,2}/) || [''])[0];
        flush(); out.push(parseInt(hex || '0', 16)); i += hex.length;
      } else if (/[0-7]/.test(n) && /[0-7]/.test(body.charAt(i + 1))) {
        var oct = (body.substr(i).match(/^[0-7]{1,3}/) || ['0'])[0];
        flush(); out.push(parseInt(oct, 8) & 255); i += oct.length - 1;
      } else if (simple[n] !== undefined) { flush(); out.push(simple[n]); }
      else plain += n;
    }
    flush();
    return out;
  }

  function decodeBytes(bytes) {
    try {
      if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
      return Buffer.from(bytes).toString('utf8');
    } catch (e) { return String.fromCharCode.apply(null, bytes); }
  }

  /*@4.LAPAJ.4*/
  function Memory() { this.pages = new Map(); }
  Memory.prototype.page = function (addr, create) {
    var key = Math.floor(addr / 4096);
    var p = this.pages.get(key);
    if (!p && create) { p = new Uint8Array(4096); this.pages.set(key, p); }
    return p;
  };
  Memory.prototype.getByte = function (addr) {
    var p = this.page(addr, false);
    return p ? p[addr % 4096] : 0;
  };
  Memory.prototype.setByte = function (addr, value) { this.page(addr, true)[addr % 4096] = value & 255; };
  Memory.prototype.readBig = function (addr, size) {
    var v = 0n;
    for (var i = size - 1; i >= 0; i -= 1) v = (v << 8n) | BigInt(this.getByte(addr + i));
    return v;
  };
  Memory.prototype.writeBig = function (addr, size, value) {
    var v = BigInt.asUintN(size * 8, value);
    for (var i = 0; i < size; i += 1) { this.setByte(addr + i, Number(v & 255n)); v >>= 8n; }
  };
  Memory.prototype.read = function (addr, size) {
    var v = 0;
    for (var i = size - 1; i >= 0; i -= 1) v = v * 256 + this.getByte(addr + i);
    return v;
  };
  Memory.prototype.write = function (addr, size, value) {
    var v = value >>> 0;
    for (var i = 0; i < size; i += 1) { this.setByte(addr + i, v & 255); v = Math.floor(v / 256); }
  };
  Memory.prototype.cstring = function (addr, limit) {
    var bytes = [];
    for (var i = 0; i < (limit || 65536); i += 1) {
      var b = this.getByte(addr + i);
      if (!b) break;
      bytes.push(b);
    }
    return bytes;
  };
  Memory.prototype.load = function (addr, bytes) { for (var i = 0; i < bytes.length; i += 1) this.setByte(addr + i, bytes[i]); };

  /*@4.LAPAJ.5*/
  function evalExpr(text, lookup, line) {
    var src = String(text).trim();
    var pos = 0;
    function peek() { while (src.charAt(pos) === ' ' || src.charAt(pos) === '\t') pos += 1; return src.charAt(pos); }
    function primary() {
      var ch = peek();
      if (ch === '(') { pos += 1; var v = sum(); if (peek() === ')') pos += 1; return v; }
      if (ch === '-') { pos += 1; return -primary(); }
      if (ch === '+') { pos += 1; return primary(); }
      if (ch === '~') { pos += 1; return ~primary(); }
      if (ch === '\'') {
        var close = src.indexOf('\'', pos + 1);
        var body = src.slice(pos + 1, close < 0 ? src.length : close);
        pos = close < 0 ? src.length : close + 1;
        var bytes = unescapeString(body);
        var v2 = 0;
        for (var b = bytes.length - 1; b >= 0; b -= 1) v2 = v2 * 256 + bytes[b];
        return v2;
      }
      var m = src.slice(pos).match(/^(0[xX][0-9A-Fa-f]+|0[bB][01]+|[0-9][0-9A-Fa-f]*[hH](?![0-9A-Za-z_])|[0-9]+|[A-Za-z_.$@?][A-Za-z0-9_.$@?]*)/);
      if (!m) throw fail(line, 'تعبيرٌ لا يُفهم: ' + text, 'Cannot read expression: ' + text);
      pos += m[0].length;
      var tok = m[0];
      if (/^0[xX]/.test(tok)) return parseInt(tok, 16);
      if (/^0[bB]/.test(tok)) return parseInt(tok.slice(2), 2);
      if (/^[0-9][0-9A-Fa-f]*[hH]$/.test(tok)) return parseInt(tok.slice(0, -1), 16);
      if (/^[0-9]+$/.test(tok)) return parseInt(tok, 10);
      var got = lookup(tok);
      if (got === undefined || got === null) throw fail(line, 'اسمٌ غيرُ معرَّف: ' + tok, 'Undefined symbol: ' + tok);
      return got;
    }
    function product() {
      var v = primary();
      for (;;) {
        var ch = peek();
        if (ch === '*') { pos += 1; v *= primary(); }
        else if (ch === '/') { pos += 1; v = Math.trunc(v / primary()); }
        else if (ch === '%') { pos += 1; v %= primary(); }
        else return v;
      }
    }
    function sum() {
      var v = product();
      for (;;) {
        var ch = peek();
        if (ch === '+') { pos += 1; v += product(); }
        else if (ch === '-') { pos += 1; v -= product(); }
        else if (ch === '<' && src.charAt(pos + 1) === '<') { pos += 2; v = v * Math.pow(2, product()); }
        else if (ch === '>' && src.charAt(pos + 1) === '>') { pos += 2; v = Math.floor(v / Math.pow(2, product())); }
        else if (ch === '|') { pos += 1; v |= product(); }
        else if (ch === '&') { pos += 1; v &= product(); }
        else return v;
      }
    }
    var value = sum();
    if (peek()) throw fail(line, 'تعبيرٌ لا يُفهم: ' + text, 'Cannot read expression: ' + text);
    return value;
  }

  /*@4.LAPAJ.6*/
  function Libc(mem, io, readArg, setRet) {
    this.mem = mem; this.io = io; this.readArg = readArg; this.setRet = setRet;
    this.heap = 0x600000; this.seed = 1;
  }
  Libc.prototype.format = function (fmtBytes, nextArg, width) {
    var fmt = decodeBytes(fmtBytes);
    var out = '';
    var self = this;
    var re = /%([-+ 0#]*)(\d+|\*)?(?:\.(\d+|\*))?(hh|h|ll|l|z|j|t|L)?([diuxXoscpfeEgG%])/g;
    var last = 0, m;
    while ((m = re.exec(fmt))) {
      out += fmt.slice(last, m.index);
      last = re.lastIndex;
      var flags = m[1] || '', w = m[2], prec = m[3], len = m[4] || '', conv = m[5];
      if (conv === '%') { out += '%'; continue; }
      if (w === '*') w = String(Number(nextArg(4, true)));
      if (prec === '*') prec = String(Number(nextArg(4, true)));
      var s;
      var big = len === 'l' || len === 'll' || len === 'z' || len === 'j' || len === 't';
      var size = big ? width : 4;
      if (conv === 'd' || conv === 'i') s = BigInt.asIntN(size * 8, BigInt(nextArg(size, true))).toString();
      else if (conv === 'u') s = BigInt.asUintN(size * 8, BigInt(nextArg(size, false))).toString();
      else if (conv === 'x' || conv === 'X') { s = BigInt.asUintN(size * 8, BigInt(nextArg(size, false))).toString(16); if (conv === 'X') s = s.toUpperCase(); if (flags.indexOf('#') >= 0 && s !== '0') s = '0x' + s; }
      else if (conv === 'o') s = BigInt.asUintN(size * 8, BigInt(nextArg(size, false))).toString(8);
      else if (conv === 'c') s = decodeBytes([Number(BigInt.asUintN(8, BigInt(nextArg(4, false))))]);
      else if (conv === 's') { s = decodeBytes(self.mem.cstring(Number(nextArg(width, false)))); if (prec !== undefined) s = s.slice(0, Number(prec)); }
      else if (conv === 'p') s = '0x' + BigInt.asUintN(width * 8, BigInt(nextArg(width, false))).toString(16);
      else { s = '?'; self.io.warn = msg('الأعدادُ العشريّة (%' + conv + ') لا يحاكيها المختبر — اطبعْ أعداداً صحيحة.', 'Floating point (%' + conv + ') is not simulated — print integers instead.'); }
      if ((conv === 'd' || conv === 'i') && flags.indexOf('+') >= 0 && s.charAt(0) !== '-') s = '+' + s;
      if (prec !== undefined && /[diuxXo]/.test(conv)) { var neg = s.charAt(0) === '-'; var digits = neg ? s.slice(1) : s; while (digits.length < Number(prec)) digits = '0' + digits; s = (neg ? '-' : '') + digits; }
      if (w && s.length < Number(w)) {
        var pad = Number(w) - s.length;
        if (flags.indexOf('-') >= 0) s = s + ' '.repeat(pad);
        else if (flags.indexOf('0') >= 0 && /[diuxXo]/.test(conv)) { var sign = /^[-+]/.test(s) ? s.charAt(0) : ''; s = sign + '0'.repeat(pad) + s.slice(sign.length); }
        else s = ' '.repeat(pad) + s;
      }
      out += s;
    }
    out += fmt.slice(last);
    return out;
  };
  Libc.prototype.call = function (name, width) {
    var self = this, io = this.io, mem = this.mem;
    var argIndex = 0;
    function arg(i) { return self.readArg(i); }
    function nextArg() { var v = arg(argIndex); argIndex += 1; return v; }
    switch (name) {
      case 'printf': {
        argIndex = 1;
        var text = this.format(mem.cstring(Number(arg(0))), function () { return nextArg(); }, width);
        io.write(text);
        this.setRet(BigInt(text.length));
        return true;
      }
      case 'puts': { io.write(decodeBytes(mem.cstring(Number(arg(0)))) + '\n'); this.setRet(1n); return true; }
      case 'putchar': { io.write(decodeBytes([Number(BigInt.asUintN(8, BigInt(arg(0))))])); this.setRet(BigInt(arg(0))); return true; }
      case 'scanf': {
        var f = decodeBytes(mem.cstring(Number(arg(0))));
        var specs = f.match(/%(\d*)(l{0,2}|h{0,2})([dicsu])/g) || [];
        var count = 0;
        for (var i = 0; i < specs.length; i += 1) {
          var target = Number(arg(i + 1));
          var conv = specs[i].slice(-1), isLong = /l/.test(specs[i]);
          if (conv === 'c') { var ch = io.readChar(); if (ch === null) break; mem.writeBig(target, 1, BigInt(ch)); count += 1; continue; }
          var tok = io.readToken();
          if (tok === null) { if (!count) { this.setRet(-1n); io.needInput = true; return true; } break; }
          var widthCap = Number((specs[i].match(/^%(\d*)/) || [])[1] || 0);
          if (widthCap) tok = tok.slice(0, widthCap);
          if (conv === 's') { var bytes = unescapeString(tok); bytes.push(0); mem.load(target, bytes); }
          else { var n = parseInt(tok, 10); if (isNaN(n)) break; mem.writeBig(target, isLong ? width : 4, BigInt(n)); }
          count += 1;
        }
        this.setRet(BigInt(count));
        return true;
      }
      case 'getchar': { var c = io.readChar(); this.setRet(c === null ? -1n : BigInt(c)); return true; }
      case 'exit': io.exitCode = Number(BigInt.asIntN(32, BigInt(arg(0)))); io.halted = true; return true;
      case 'malloc': case 'calloc': {
        var size = Number(arg(0)) * (name === 'calloc' ? Number(arg(1)) : 1);
        var at = this.heap; this.heap += Math.max(16, Math.ceil(size / 16) * 16);
        for (var z = 0; z < size; z += 1) mem.setByte(at + z, 0);
        this.setRet(BigInt(at));
        return true;
      }
      case 'free': this.setRet(0n); return true;
      case 'strlen': this.setRet(BigInt(mem.cstring(Number(arg(0))).length)); return true;
      case 'atoi': case 'atol': this.setRet(BigInt(parseInt(decodeBytes(mem.cstring(Number(arg(0)))), 10) || 0)); return true;
      case 'abs': case 'labs': { var a = BigInt.asIntN(name === 'abs' ? 32 : 64, BigInt(arg(0))); this.setRet(a < 0n ? -a : a); return true; }
      case 'srand': this.seed = Number(arg(0)) >>> 0; this.setRet(0n); return true;
      case 'rand': this.seed = (Math.imul(this.seed, 1103515245) + 12345) >>> 0; this.setRet(BigInt((this.seed >>> 16) & 0x7fff)); return true;
      case 'time': this.setRet(1700000000n); return true;
      default: return false;
    }
  };

  /*@4.LAPAJ.7*/
  function makeIO(input) {
    var text = String(input || '');
    var bytes = Array.from(typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(text) : Buffer.from(text, 'utf8'));
    var io = { out: '', bytesOut: [], pos: 0, exitCode: 0, halted: false, needInput: false, warn: null };
    io.write = function (s) { io.out += s; };
    io.writeBytes = function (bs) { io.out += decodeBytes(bs); };
    io.readChar = function () { return io.pos < bytes.length ? bytes[io.pos++] : null; };
    io.readBytes = function (n) { var take = bytes.slice(io.pos, io.pos + n); io.pos += take.length; return take; };
    io.readToken = function () {
      while (io.pos < bytes.length && /\s/.test(String.fromCharCode(bytes[io.pos]))) io.pos += 1;
      if (io.pos >= bytes.length) return null;
      var start = io.pos;
      while (io.pos < bytes.length && !/\s/.test(String.fromCharCode(bytes[io.pos]))) io.pos += 1;
      return decodeBytes(bytes.slice(start, io.pos));
    };
    io.numbers = function () { return text.split(/[\s,]+/).filter(Boolean).map(Number).filter(function (n) { return !isNaN(n); }); };
    return io;
  }

  /*@4.LAPAJ.8*/
  var LMC_OPS = {
    ADD: 100, SUB: 200, STA: 300, STO: 300, STORE: 300, LDA: 500, LOAD: 500,
    BRA: 600, BR: 600, BRZ: 700, BRP: 800, INP: 901, IN: 901, INPUT: 901,
    OUT: 902, OUTPUT: 902, OTC: 922, HLT: 0, COB: 0, HALT: 0, DAT: -1
  };
  var LMC_NOARG = { INP: 1, IN: 1, INPUT: 1, OUT: 1, OUTPUT: 1, OTC: 1, HLT: 1, COB: 1, HALT: 1 };

  function lmcAssemble(source) {
    var lines = String(source).split('\n');
    var items = [], labels = {}, errors = [], addr = 0;
    lines.forEach(function (raw, i) {
      var text = stripComment(raw, [';', '//', '#']).trim();
      if (!text) return;
      var tokens = text.split(/\s+/);
      if (/^\d{1,2}$/.test(tokens[0]) && tokens.length > 1) { addr = parseInt(tokens[0], 10); tokens.shift(); }
      var label = null;
      if (tokens.length && !(tokens[0].toUpperCase() in LMC_OPS) && !/^-?\d+$/.test(tokens[0])) {
        label = tokens.shift().replace(/:$/, '');
      } else if (tokens.length && /:$/.test(tokens[0])) label = tokens.shift().replace(/:$/, '');
      if (label) {
        var key = label.toUpperCase();
        if (labels[key] !== undefined) { errors.push({ line: i + 1, ar: 'العلامةُ ' + label + ' معرَّفةٌ مرّتين', en: 'Label ' + label + ' is defined twice' }); return; }
        labels[key] = addr;
      }
      if (!tokens.length) return;
      var op = tokens[0].toUpperCase();
      if (/^\d{3}$/.test(op) && tokens.length === 1) { items.push({ line: i + 1, addr: addr, raw: parseInt(op, 10), text: text }); addr += 1; return; }
      if (!(op in LMC_OPS)) { errors.push({ line: i + 1, ar: 'تعليمةٌ لا يعرفها LMC: ' + tokens[0], en: 'LMC does not know: ' + tokens[0] }); return; }
      if (addr > 99) { errors.push({ line: i + 1, ar: 'البرنامجُ تجاوز الصناديقَ المئة (00–99)', en: 'The program is past the 100 mailboxes (00–99)' }); return; }
      items.push({ line: i + 1, addr: addr, op: op, arg: tokens[1], extra: tokens.length > 2 ? tokens.slice(2).join(' ') : '', text: text });
      addr += 1;
    });
    var memory = new Array(100).fill(0), lineOf = {}, textOf = {};
    items.forEach(function (it) {
      lineOf[it.addr] = it.line; textOf[it.addr] = it.text;
      if (it.raw !== undefined) { memory[it.addr] = it.raw; return; }
      if (it.extra) { errors.push({ line: it.line, ar: 'كلامٌ زائدٌ بعد التعليمة: ' + it.extra, en: 'Extra text after the instruction: ' + it.extra }); return; }
      if (it.op === 'DAT') {
        var v = it.arg === undefined ? 0 : parseInt(it.arg, 10);
        if (isNaN(v)) { var lv = labels[String(it.arg).toUpperCase()]; if (lv === undefined) { errors.push({ line: it.line, ar: 'DAT تحتاج عدداً: ' + it.arg, en: 'DAT needs a number: ' + it.arg }); return; } v = lv; }
        if (v < -999 || v > 999) { errors.push({ line: it.line, ar: 'الصندوقُ يتّسع من ‎-999 إلى 999', en: 'A mailbox holds -999 to 999' }); return; }
        memory[it.addr] = v;
        return;
      }
      var base = LMC_OPS[it.op];
      if (LMC_NOARG[it.op]) {
        if (it.arg !== undefined) { errors.push({ line: it.line, ar: it.op + ' لا تأخذ معاملاً', en: it.op + ' takes no operand' }); return; }
        memory[it.addr] = base;
        return;
      }
      if (it.arg === undefined) { errors.push({ line: it.line, ar: it.op + ' تحتاج عنوانَ صندوقٍ أو علامة', en: it.op + ' needs a mailbox address or label' }); return; }
      var target = /^\d{1,2}$/.test(it.arg) ? parseInt(it.arg, 10) : labels[it.arg.toUpperCase()];
      if (target === undefined) { errors.push({ line: it.line, ar: 'علامةٌ غيرُ معرَّفة: ' + it.arg, en: 'Undefined label: ' + it.arg }); return; }
      memory[it.addr] = base + target;
    });
    if (errors.length) return { ok: false, errors: errors };
    return { ok: true, isa: 'lmc', memory: memory, labels: labels, lineOf: lineOf, textOf: textOf, start: 0 };
  }

  var LMC_NAMES = { 1: 'ADD', 2: 'SUB', 3: 'STA', 5: 'LDA', 6: 'BRA', 7: 'BRZ', 8: 'BRP' };
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function lmcRun(program, options) {
    var o = options || {};
    var maxSteps = o.maxSteps || 20000;
    var mem = program.memory.slice();
    var io = makeIO(o.input);
    var queue = io.numbers(), qi = 0;
    var st = { acc: 0, pc: program.start || 0, neg: false, steps: 0, output: [], line: '', trace: [], error: null, halted: false };
    function out(s) { st.line += s; }
    function flushLine() { if (st.line.length) { st.output.push(st.line); st.line = ''; } }
    while (!st.halted) {
      if (st.steps >= maxSteps) { st.error = { kind: 'steps', ar: 'تجاوز البرنامجُ ' + maxSteps + ' خطوة — غالباً حلقةٌ لا تنتهي (هل نسيتَ HLT؟).', en: 'Over ' + maxSteps + ' steps — probably an endless loop (forgot HLT?).' }; break; }
      if (st.pc < 0 || st.pc > 99) { st.error = { kind: 'pc', ar: 'عدّادُ البرنامج خرج من الصناديق: ' + st.pc, en: 'The program counter left the mailboxes: ' + st.pc }; break; }
      var at = st.pc, word = mem[at], before = { acc: st.acc, pc: at };
      var line = program.lineOf[at];
      st.pc += 1; st.steps += 1;
      var changes = [], memWrite = null, said = null;
      if (word === 0) { st.halted = true; }
      else if (word === 901) {
        if (qi >= queue.length) { st.error = { kind: 'input', ar: 'طلب البرنامجُ إدخالاً (INP) ولا مزيدَ في لوح «المدخلات».', en: 'The program asked for input (INP) and the Input panel is empty.' }; st.pc = at; break; }
        st.acc = Math.max(-999, Math.min(999, queue[qi])); qi += 1; st.neg = st.acc < 0;
      } else if (word === 902) { flushLine(); st.output.push(String(st.acc)); said = String(st.acc); }
      else if (word === 922) { out(String.fromCharCode(st.acc)); said = String.fromCharCode(st.acc); }
      else {
        var op = Math.floor(word / 100), xx = word % 100, name = LMC_NAMES[op];
        if (!name) { st.error = { kind: 'opcode', ar: 'الصندوق ' + pad2(at) + ' فيه ' + word + ' — ليس تعليمة (هل وصل التنفيذُ إلى بيانات؟).', en: 'Mailbox ' + pad2(at) + ' holds ' + word + ' — not an instruction (did execution run into data?).' }; break; }
        if (op === 1) { st.acc += mem[xx]; }
        else if (op === 2) { st.acc -= mem[xx]; }
        else if (op === 3) { mem[xx] = st.acc; memWrite = { at: pad2(xx), value: st.acc }; }
        else if (op === 5) { st.acc = mem[xx]; }
        else if (op === 6) { st.pc = xx; }
        else if (op === 7) { if (st.acc === 0) st.pc = xx; }
        else if (op === 8) { if (st.acc >= 0) st.pc = xx; }
        if (op === 1 || op === 2) {
          if (st.acc > 999 || st.acc < -999) {
            st.error = { kind: 'overflow', ar: 'تجاوز المركمُ حدودَه (' + st.acc + ') — الصندوقُ يتّسع من ‎-999 إلى 999.', en: 'The accumulator overflowed (' + st.acc + ') — a mailbox holds -999 to 999.' };
          }
        }
      }
      if (st.acc !== before.acc) changes.push({ k: 'ACC', from: before.acc, to: st.acc });
      if (st.trace.length < TRACE_CAP) st.trace.push({ line: line, addr: pad2(at), text: program.textOf[at] || String(word), changes: changes, mem: memWrite, jump: st.pc !== at + 1 && !st.halted ? pad2(st.pc) : null, out: said });
      if (st.error) break;
    }
    flushLine();
    return { output: st.output.join('\n'), error: st.error, steps: st.steps, trace: st.trace, regs: [{ k: 'ACC', v: String(st.acc) }, { k: 'PC', v: pad2(st.pc) }], memory: mem, exitCode: 0 };
  }

  /*@4.LAPAJ.9*/
  var X86_REGS = {};
  (function () {
    var q = ['rax', 'rcx', 'rdx', 'rbx', 'rsp', 'rbp', 'rsi', 'rdi'];
    var d = ['eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi'];
    var w = ['ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di'];
    var b = ['al', 'cl', 'dl', 'bl', 'spl', 'bpl', 'sil', 'dil'];
    for (var i = 0; i < 8; i += 1) {
      X86_REGS[q[i]] = { r: i, size: 8 }; X86_REGS[d[i]] = { r: i, size: 4 };
      X86_REGS[w[i]] = { r: i, size: 2 }; X86_REGS[b[i]] = { r: i, size: 1 };
    }
    ['ah', 'ch', 'dh', 'bh'].forEach(function (n, k) { X86_REGS[n] = { r: k, size: 1, high: true }; });
    for (var j = 8; j < 16; j += 1) {
      X86_REGS['r' + j] = { r: j, size: 8 }; X86_REGS['r' + j + 'd'] = { r: j, size: 4 };
      X86_REGS['r' + j + 'w'] = { r: j, size: 2 }; X86_REGS['r' + j + 'b'] = { r: j, size: 1 };
    }
  })();
  var X86_NAMES = ['rax', 'rcx', 'rdx', 'rbx', 'rsp', 'rbp', 'rsi', 'rdi', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'];
  var X86_CONDS = { o: 1, no: 1, b: 1, c: 1, nae: 1, ae: 1, nb: 1, nc: 1, e: 1, z: 1, ne: 1, nz: 1, be: 1, na: 1, a: 1, nbe: 1, s: 1, ns: 1, p: 1, pe: 1, np: 1, po: 1, l: 1, nge: 1, ge: 1, nl: 1, le: 1, ng: 1, g: 1, nle: 1 };
  var X86_BASE = {
    mov: 1, movabs: 1, movzx: 1, movsx: 1, movsxd: 1, lea: 1, add: 1, adc: 1, sub: 1, sbb: 1, imul: 1, mul: 1, idiv: 1, div: 1,
    inc: 1, dec: 1, neg: 1, not: 1, and: 1, or: 1, xor: 1, shl: 1, sal: 1, shr: 1, sar: 1, rol: 1, ror: 1, cmp: 1, test: 1,
    jmp: 1, call: 1, ret: 1, push: 1, pop: 1, leave: 1, nop: 1, syscall: 1, int: 1, xchg: 1, hlt: 1, enter: 1,
    cqo: 1, cqto: 1, cdq: 1, cltd: 1, cdqe: 1, cltq: 1, cwd: 1, cbw: 1, cwtl: 1, cwde: 1, endbr64: 1
  };
  var DATA_DIRS = { db: 1, dw: 2, dd: 4, dq: 8, '.byte': 1, '.word': 2, '.short': 2, '.hword': 2, '.value': 2, '.long': 4, '.int': 4, '.quad': 8 };
  var STR_DIRS = { '.string': 1, '.asciz': 1, '.ascii': 0 };
  var SPACE_DIRS = { '.zero': 1, '.space': 1, '.skip': 1, resb: 1, resw: 2, resd: 4, resq: 8 };
  var IGNORED = /^(\.(globl|global|type|size|file|ident|align|p2align|balign|cfi_\w+|loc|weak|hidden|section\.note\S*|addrsig\S*|code64|att_syntax|text\.unlikely)|global|extern|default|bits|cpu|align|\.extern)$/i;

  function x86Split(mn) {
    var m = mn.toLowerCase();
    if (X86_BASE[m]) return { op: m, size: 0 };
    if (/^j/.test(m) && X86_CONDS[m.slice(1)]) return { op: 'jcc', cc: m.slice(1), size: 0 };
    if (/^set/.test(m) && X86_CONDS[m.slice(3)]) return { op: 'setcc', cc: m.slice(3), size: 1 };
    if (/^cmov/.test(m) && X86_CONDS[m.slice(4)]) return { op: 'cmovcc', cc: m.slice(4), size: 0 };
    if (/^cmov/.test(m) && X86_CONDS[m.slice(4, -1)] && /[wlq]$/.test(m)) return { op: 'cmovcc', cc: m.slice(4, -1), size: { w: 2, l: 4, q: 8 }[m.slice(-1)] };
    var mz = m.match(/^mov([zs])([bwl])([wlq])$/);
    if (mz) return { op: mz[1] === 'z' ? 'movzx' : 'movsx', from: { b: 1, w: 2, l: 4 }[mz[2]], size: { w: 2, l: 4, q: 8 }[mz[3]] };
    var suf = m.slice(-1), base = m.slice(0, -1);
    if (/[bwlq]/.test(suf) && X86_BASE[base]) return { op: base, size: { b: 1, w: 2, l: 4, q: 8 }[suf] };
    return null;
  }

  /*@4.LAPAJ.10*/
  function x86Assemble(source) {
    var lines = String(source).split('\n');
    var bare = String(source).replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/'(?:\\.|[^'\\])*'/g, "''");
    var intel = /^\s*\.intel_syntax/m.test(bare) || (!/%[a-z]/i.test(bare) && !/^\s*\.att_syntax/m.test(bare));
    var stmts = [], errors = [];
    lines.forEach(function (raw, i) {
      var whole = stripComment(raw, intel ? [';', '#', '//'] : ['#', '//']).replace(/\/\*.*?\*\//g, '').trim();
      (intel ? [whole] : splitStatements(whole)).forEach(function (piece) {
        statement(piece.trim(), i);
      });
    });
    function statement(text, i) {
      while (text) {
        var lm = text.match(/^([A-Za-z_.$@?][\w.$@?]*)\s*:(?!:)/);
        if (!lm) break;
        stmts.push({ line: i + 1, label: lm[1] });
        text = text.slice(lm[0].length).trim();
      }
      if (!text) return;
      var parts = text.match(/^(\S+)\s*(.*)$/);
      var head = parts[1], rest = parts[2];
      var second = (rest.match(/^(\S+)/) || [])[1];
      if (second && !x86Split(head) && !/^\./.test(head) && (DATA_DIRS[second.toLowerCase()] || SPACE_DIRS[second.toLowerCase()] || /^equ$/i.test(second))) {
        stmts.push({ line: i + 1, label: head, nasm: true });
        var r2 = rest.match(/^(\S+)\s*(.*)$/);
        head = r2[1]; rest = r2[2];
      }
      stmts.push({ line: i + 1, head: head, rest: rest, text: text });
    }

    var DATA_BASE = 0x404000;
    var CODE_BASE = 0x401000;
    var symbols = {}, equs = {}, code = [], data = [];
    var section = 'text', dataAddr = DATA_BASE;
    var pendingLabels = [];

    function sizeOfData(st) {
      var d = st.head.toLowerCase();
      if (STR_DIRS[d] !== undefined) {
        return splitArgs(st.rest).reduce(function (n, s) { var mm = s.match(/^"(.*)"$/); return n + (mm ? unescapeString(mm[1]).length : 0) + STR_DIRS[d]; }, 0);
      }
      if (DATA_DIRS[d]) {
        return splitArgs(st.rest).reduce(function (n, s) { var mm = s.match(/^"(.*)"$|^'(.{2,})'$/); return n + (mm ? unescapeString(mm[1] || mm[2]).length : DATA_DIRS[d]); }, 0);
      }
      if (SPACE_DIRS[d]) return SPACE_DIRS[d] * evalExpr(splitArgs(st.rest)[0] || '0', function (n) { return equs[n]; }, st.line);
      return 0;
    }

    function flushLabels() {
      pendingLabels.forEach(function (l) { symbols[l.label] = section === 'text' ? CODE_BASE + code.length * 16 : dataAddr; });
      pendingLabels = [];
    }
    stmts.forEach(function (st) {
      try {
        if (st.label !== undefined) { pendingLabels.push(st); return; }
        var d = st.head.toLowerCase();
        if (/^\.?(intel_syntax|att_syntax)$/.test(d)) return;
        if (d === '.text' || (d === 'section' && /^\.?text/.test(st.rest)) || (d === '.section' && /^\.text/.test(st.rest))) { flushLabels(); section = 'text'; return; }
        if (d === '.data' || d === '.bss' || d === '.rodata' || d === 'section' || d === '.section') { flushLabels(); section = 'data'; return; }
        if (/^equ$/i.test(d) || d === '.equ' || d === '.set') {
          var name, expr;
          if (d === '.equ' || d === '.set') { var a = splitArgs(st.rest); name = a[0]; expr = a[1]; }
          else { name = pendingLabels.length ? pendingLabels.pop().label : null; expr = st.rest; }
          var here = dataAddr;
          equs[name] = evalExpr(expr, function (n) { return n === '$' || n === '.' ? here : (equs[n] !== undefined ? equs[n] : symbols[n]); }, st.line);
          return;
        }
        if (IGNORED.test(d)) { return; }
        var isData = DATA_DIRS[d] || STR_DIRS[d] !== undefined || SPACE_DIRS[d];
        if (isData) {
          if (d === '.align' || d === '.p2align') return;
          pendingLabels.forEach(function (l) { symbols[l.label] = dataAddr; }); pendingLabels = [];
          data.push({ st: st, addr: dataAddr });
          dataAddr += sizeOfData(st);
          return;
        }
        pendingLabels.forEach(function (l) { symbols[l.label] = CODE_BASE + code.length * 16; }); pendingLabels = [];
        code.push(st);
      } catch (e) { errors.push({ line: e.line || st.line, ar: e.ar || e.message, en: e.en || e.message }); }
    });
    pendingLabels.forEach(function (l) { symbols[l.label] = section === 'text' ? CODE_BASE + code.length * 16 : dataAddr; });

    function lookup(here) { return function (n) { return n === '$' || n === '.' ? here : (equs[n] !== undefined ? equs[n] : symbols[n]); }; }
    var mem = new Memory();
    data.forEach(function (it) {
      try {
        var d = it.st.head.toLowerCase(), at = it.addr;
        if (STR_DIRS[d] !== undefined) {
          splitArgs(it.st.rest).forEach(function (s) {
            var mm = s.match(/^"(.*)"$/);
            if (!mm) throw fail(it.st.line, d + ' تحتاج نصّاً بين علامتي تنصيص', d + ' needs a quoted string');
            var bytes = unescapeString(mm[1]); if (STR_DIRS[d]) bytes.push(0);
            mem.load(at, bytes); at += bytes.length;
          });
        } else if (DATA_DIRS[d]) {
          var sz = DATA_DIRS[d];
          splitArgs(it.st.rest).forEach(function (s) {
            var mm = s.match(/^"(.*)"$|^'(.{2,})'$/);
            if (mm) { var bytes = unescapeString(mm[1] || mm[2]); mem.load(at, bytes); at += bytes.length; return; }
            var exactD = bigLiteral(s);
            mem.writeBig(at, sz, exactD !== null ? exactD : BigInt(Math.trunc(evalExpr(s, lookup(at), it.st.line)))); at += sz;
          });
        }
      } catch (e) { errors.push({ line: e.line || it.st.line, ar: e.ar || e.message, en: e.en || e.message }); }
    });

    var program = [];
    code.forEach(function (st, idx) {
      try { program.push(x86Parse(st, intel, lookup(CODE_BASE + idx * 16), symbols, equs)); }
      catch (e) { errors.push({ line: e.line || st.line, ar: e.ar || e.message, en: e.en || e.message }); }
    });
    if (!code.length && !errors.length) errors.push({ line: 1, ar: 'لا تعليماتٍ في البرنامج — اكتب تحت ‎.text أو main:', en: 'No instructions — write them under .text or main:' });
    if (errors.length) return { ok: false, errors: errors };
    var entry = symbols.main !== undefined ? symbols.main : symbols._start !== undefined ? symbols._start : CODE_BASE;
    return { ok: true, isa: 'x86', code: program, mem: mem, symbols: symbols, entry: (entry - CODE_BASE) / 16, intel: intel, codeBase: CODE_BASE, dataEnd: dataAddr };
  }

  function splitStatements(text) {
    var out = [], cur = '', quote = null;
    for (var i = 0; i < text.length; i += 1) {
      var ch = text.charAt(i);
      if (quote) {
        cur += ch;
        if (ch === '\\') { cur += text.charAt(i + 1); i += 1; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"') { quote = ch; cur += ch; continue; }
      if (ch === ';') { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out;
  }
  function bigLiteral(text) {
    var t = String(text).trim();
    var m = t.match(/^([-+]?)(0[xX][0-9A-Fa-f]+|\d+)$/);
    if (!m) return null;
    var v = BigInt(m[2]);
    return m[1] === '-' ? -v : v;
  }
  /*@4.LAPAJ.11*/
  function x86Operand(text, intel, look, line) {
    var t = text.trim();
    var sizeHint = 0;
    if (intel) {
      var pm = t.match(/^(byte|word|dword|qword)\s*(ptr\s*)?/i);
      if (pm) { sizeHint = { byte: 1, word: 2, dword: 4, qword: 8 }[pm[1].toLowerCase()]; t = t.slice(pm[0].length).trim(); }
      var reg = X86_REGS[t.toLowerCase()];
      if (reg) return { kind: 'reg', reg: reg, name: t.toLowerCase() };
      var bm = t.match(/^(?:[a-z]s:)?\[(.*)\]$/i);
      if (bm) {
        var inner = bm[1].replace(/^rel\s+/i, '').replace(/\s+/g, '');
        var op = { kind: 'mem', base: null, index: null, scale: 1, disp: 0, size: sizeHint };
        var terms = inner.match(/[+-]?[^+-]+/g) || [];
        var dispText = '';
        terms.forEach(function (term) {
          var sign = term.charAt(0) === '-' ? '-' : '+';
          var body = term.replace(/^[+-]/, '');
          var mul = body.match(/^(\w+)\*(\d)$|^(\d)\*(\w+)$/);
          if (mul) { op.index = X86_REGS[(mul[1] || mul[4]).toLowerCase()]; op.scale = Number(mul[2] || mul[3]); return; }
          var r = X86_REGS[body.toLowerCase()];
          if (body.toLowerCase() === 'rip') return;
          if (r) { if (!op.base) op.base = r; else op.index = r; return; }
          dispText += sign + body;
        });
        if (dispText) op.disp = evalExpr(dispText, look, line);
        return op;
      }
      var om = t.match(/^offset\s+(.*)$/i);
      if (om) t = om[1];
      var exactI = bigLiteral(t);
      return { kind: 'imm', value: exactI !== null ? exactI : BigInt(Math.trunc(evalExpr(t, look, line))), size: sizeHint };
    }
    if (t.charAt(0) === '*') return Object.assign(x86Operand(t.slice(1), false, look, line), { indirect: true });
    if (t.charAt(0) === '%') {
      var rr = X86_REGS[t.slice(1).toLowerCase()];
      if (!rr) throw fail(line, 'مسجّلٌ غيرُ معروف: ' + t, 'Unknown register: ' + t);
      return { kind: 'reg', reg: rr, name: t.slice(1).toLowerCase() };
    }
    if (t.charAt(0) === '$') { var exactA = bigLiteral(t.slice(1)); return { kind: 'imm', value: exactA !== null ? exactA : BigInt(Math.trunc(evalExpr(t.slice(1), look, line))) }; }
    var mm = t.match(/^(.*?)\(([^)]*)\)$/);
    var res = { kind: 'mem', base: null, index: null, scale: 1, disp: 0, size: 0 };
    if (mm) {
      var parts = mm[2].split(',').map(function (s) { return s.trim(); });
      if (parts[0]) {
        if (parts[0].toLowerCase() === '%rip') res.rip = true;
        else { res.base = X86_REGS[parts[0].replace('%', '').toLowerCase()]; if (!res.base) throw fail(line, 'مسجّلٌ غيرُ معروف: ' + parts[0], 'Unknown register: ' + parts[0]); }
      }
      if (parts[1]) { res.index = X86_REGS[parts[1].replace('%', '').toLowerCase()]; if (!res.index) throw fail(line, 'مسجّلٌ غيرُ معروف: ' + parts[1], 'Unknown register: ' + parts[1]); }
      if (parts[2]) res.scale = Number(parts[2]);
      if (mm[1].trim()) res.disp = evalExpr(mm[1], look, line);
      return res;
    }
    res.disp = evalExpr(t, look, line);
    res.bare = true;
    return res;
  }

  function x86Parse(st, intel, look, symbols, equs) {
    var info = x86Split(st.head);
    if (!info) throw fail(st.line, 'تعليمةٌ غيرُ مدعومة: ' + st.head, 'Unsupported instruction: ' + st.head);
    var args = st.rest ? splitArgs(st.rest) : [];
    var isBranch = info.op === 'jmp' || info.op === 'jcc' || info.op === 'call';
    var ops;
    if (isBranch && args.length === 1) {
      var a = args[0].trim();
      var star = a.charAt(0) === '*';
      var bareName = a.replace(/^\*/, '');
      if (!star && /^[A-Za-z_.$@?][\w.$@?]*(@PLT)?$/i.test(bareName) && !X86_REGS[bareName.toLowerCase()]) {
        var name = bareName.replace(/@PLT$/i, '');
        ops = [{ kind: 'target', name: name, addr: symbols[name] }];
      } else {
        var o = x86Operand(a, intel, look, st.line);
        o.indirect = true;
        ops = [o];
      }
    } else {
      ops = args.map(function (s) { return x86Operand(s, intel, look, st.line); });
      if (!intel && info.op !== 'enter') ops.reverse();
    }
    var ins = { op: info.op, cc: info.cc, size: info.size, from: info.from, ops: ops, line: st.line, text: st.text };
    if (!ins.size) {
      var regOp = ops.filter(function (x) { return x.kind === 'reg'; })[0];
      var memOp = ops.filter(function (x) { return x.kind === 'mem' && x.size; })[0];
      if (info.op === 'movzx' || info.op === 'movsx' || info.op === 'movsxd') {
        ins.size = ops[0] && ops[0].kind === 'reg' ? ops[0].reg.size : 8;
        if (!ins.from) ins.from = ops[1] && ops[1].kind === 'reg' ? ops[1].reg.size : (ops[1] && ops[1].size) || (info.op === 'movsxd' ? 4 : 1);
      } else if (/^(push|pop|call|ret|jmp|jcc|leave|enter)$/.test(info.op)) ins.size = 8;
      else if (/^(shl|sal|shr|sar|rol|ror)$/.test(info.op) && ops[0]) ins.size = ops[0].kind === 'reg' ? ops[0].reg.size : (ops[0].size || 0);
      else if (regOp) ins.size = regOp.reg.size;
      else if (memOp) ins.size = memOp.size;
      if (info.op === 'movsxd' && !ins.from) ins.from = 4;
    }
    if (info.op === 'movsxd' || info.op === 'cltq' || info.op === 'cdqe') ins.op = info.op === 'movsxd' ? 'movsx' : ins.op;
    var needsSize = /^(mov|add|adc|sub|sbb|and|or|xor|cmp|test|inc|dec|neg|not|mul|imul|idiv|div|shl|sal|shr|sar|rol|ror|movzx|movsx|cmovcc)$/.test(ins.op);
    if (needsSize && !ins.size) throw fail(st.line, 'حجمُ العمليّة مبهم — أضِف لاحقةً (movq/movl/movb) أو QWORD PTR', 'Operand size is ambiguous — add a suffix (movq/movl/movb) or QWORD PTR');
    return ins;
  }

  /*@4.LAPAJ.12*/
  function x86Run(program, options) {
    var o = options || {};
    var maxSteps = o.maxSteps || 500000;
    var mem = program.mem;
    var regs = []; for (var i = 0; i < 16; i += 1) regs.push(0n);
    var STACK_TOP = 0x7ffff000, SENTINEL = 0xdead0000;
    var flags = { CF: 0, ZF: 0, SF: 0, OF: 0 };
    var io = makeIO(o.input);
    var trace = [], steps = 0, error = null, pc = program.entry;
    regs[4] = BigInt(STACK_TOP);
    regs[4] -= 8n; mem.writeBig(Number(regs[4]), 8, BigInt(SENTINEL));
    var step = null;
    function mask(size) { return (1n << BigInt(size * 8)) - 1n; }
    function getReg(r) {
      var v = regs[r.r];
      if (r.high) return (v >> 8n) & 255n;
      return v & mask(r.size);
    }
    function setReg(r, val) {
      var old = regs[r.r], v = BigInt.asUintN(r.size * 8, val);
      if (r.high) regs[r.r] = (old & ~0xff00n) | (v << 8n);
      else if (r.size === 8) regs[r.r] = v;
      else if (r.size === 4) regs[r.r] = v;
      else regs[r.r] = (old & ~mask(r.size)) | v;
      regs[r.r] = BigInt.asUintN(64, regs[r.r]);
      if (step && old !== regs[r.r]) step.regs[X86_NAMES[r.r]] = regs[r.r];
    }
    function addr(op, ins) {
      var a = BigInt(Math.trunc(op.disp || 0));
      if (op.base) a += regs[op.base.r] & mask(op.base.size);
      if (op.index) a += (regs[op.index.r] & mask(op.index.size)) * BigInt(op.scale || 1);
      return Number(BigInt.asUintN(64, a));
    }
    function read(op, size, ins) {
      if (op.kind === 'reg') return getReg(op.reg);
      if (op.kind === 'imm') return BigInt.asUintN(size * 8, op.value);
      var at = addr(op, ins);
      if (at < 0x1000) throw fail(ins.line, 'قراءةٌ من عنوانٍ غيرِ صالح 0x' + at.toString(16) + ' (مؤشّرٌ صفريّ؟)', 'Read from an invalid address 0x' + at.toString(16) + ' (null pointer?)');
      return mem.readBig(at, size);
    }
    function write(op, size, val, ins) {
      if (op.kind === 'reg') { setReg(op.reg.size === size || op.reg.high ? op.reg : Object.assign({}, op.reg, { size: size }), val); return; }
      if (op.kind === 'imm') throw fail(ins.line, 'لا يُكتب في قيمةٍ ثابتة — الوجهةُ يجب أن تكون مسجّلاً أو ذاكرة', 'Cannot write to an immediate — the destination must be a register or memory');
      var at = addr(op, ins);
      if (at < 0x1000) throw fail(ins.line, 'كتابةٌ في عنوانٍ غيرِ صالح 0x' + at.toString(16), 'Write to an invalid address 0x' + at.toString(16));
      mem.writeBig(at, size, val);
      if (step && step.mem.length < 4) step.mem.push({ at: '0x' + at.toString(16), size: size, value: BigInt.asUintN(size * 8, val) });
    }
    function signed(v, size) { return BigInt.asIntN(size * 8, v); }
    function setZS(r, size) { flags.ZF = r === 0n ? 1 : 0; flags.SF = (r >> BigInt(size * 8 - 1)) & 1n ? 1 : 0; }
    function arith(kind, a, b, size, carryIn) {
      var m = mask(size), sb = 1n << BigInt(size * 8 - 1), r;
      if (kind === 'add') { var full = a + b + (carryIn || 0n); r = full & m; flags.CF = full > m ? 1 : 0; flags.OF = ((a ^ r) & (b ^ r) & sb) ? 1 : 0; }
      else { var sub = a - b - (carryIn || 0n); r = BigInt.asUintN(size * 8, sub); flags.CF = a < b + (carryIn || 0n) ? 1 : 0; flags.OF = ((a ^ b) & (a ^ r) & sb) ? 1 : 0; }
      setZS(r, size);
      return r;
    }
    function cond(cc) {
      switch (cc) {
        case 'o': return flags.OF; case 'no': return !flags.OF;
        case 'b': case 'c': case 'nae': return flags.CF; case 'ae': case 'nb': case 'nc': return !flags.CF;
        case 'e': case 'z': return flags.ZF; case 'ne': case 'nz': return !flags.ZF;
        case 'be': case 'na': return flags.CF || flags.ZF; case 'a': case 'nbe': return !flags.CF && !flags.ZF;
        case 's': return flags.SF; case 'ns': return !flags.SF;
        case 'l': case 'nge': return flags.SF !== flags.OF; case 'ge': case 'nl': return flags.SF === flags.OF;
        case 'le': case 'ng': return flags.ZF || flags.SF !== flags.OF; case 'g': case 'nle': return !flags.ZF && flags.SF === flags.OF;
        default: return false;
      }
    }
    function push(v) { regs[4] = BigInt.asUintN(64, regs[4] - 8n); if (step) step.regs.rsp = regs[4]; mem.writeBig(Number(regs[4]), 8, v); }
    function pop() { var v = mem.readBig(Number(regs[4]), 8); regs[4] = BigInt.asUintN(64, regs[4] + 8n); if (step) step.regs.rsp = regs[4]; return v; }
    function codeIndex(target, ins) {
      var n = Number(target);
      if (n === SENTINEL) return -1;
      var idx = (n - program.codeBase) / 16;
      if (idx < 0 || idx >= program.code.length || idx !== Math.floor(idx)) throw fail(ins.line, 'قفزةٌ إلى عنوانٍ ليس تعليمة: 0x' + n.toString(16), 'Jump to an address that is not an instruction: 0x' + n.toString(16));
      return idx;
    }
    var ARG_REGS = [7, 6, 2, 1, 8, 9];
    function clobber() { [1, 2, 6, 7, 8, 9, 10, 11].forEach(function (k) { regs[k] = 0xbad0c0deba5eba11n; }); }
    var libc = new Libc(mem, io, function (i) { return i < 6 ? regs[ARG_REGS[i]] : mem.readBig(Number(regs[4]) + (i - 6) * 8, 8); }, function (v) { setReg({ r: 0, size: 8 }, v); });
    var exited = false;
    try {
      while (!exited) {
        if (steps >= maxSteps) { error = { kind: 'steps', ar: 'تجاوز البرنامجُ ' + maxSteps + ' تعليمة — غالباً حلقةٌ لا تنتهي.', en: 'Over ' + maxSteps + ' instructions — probably an endless loop.' }; break; }
        if (pc < 0 || pc >= program.code.length) { error = { kind: 'pc', ar: 'وصل التنفيذُ إلى نهاية الكود بلا ret ولا exit.', en: 'Execution ran off the end of the code without ret or exit.' }; break; }
        var ins = program.code[pc];
        var flagsBefore = flags.CF + '' + flags.ZF + flags.SF + flags.OF;
        var outBefore = io.out.length;
        step = trace.length < TRACE_CAP ? { line: ins.line, text: ins.text, regs: {}, mem: [] } : null;
        var next = pc + 1, s = ins.size, ops = ins.ops;
        steps += 1;
        switch (ins.op) {
          case 'nop': case 'endbr64': break;
          case 'mov': case 'movabs': write(ops[0], s, read(ops[1], s, ins), ins); break;
          case 'movzx': write(ops[0], s, read(ops[1], ins.from, ins), ins); break;
          case 'movsx': write(ops[0], s, BigInt.asUintN(s * 8, signed(read(ops[1], ins.from, ins), ins.from)), ins); break;
          case 'cltq': case 'cdqe': setReg({ r: 0, size: 8 }, BigInt.asUintN(64, signed(regs[0] & mask(4), 4))); break;
          case 'cwtl': case 'cwde': setReg({ r: 0, size: 4 }, BigInt.asUintN(32, signed(regs[0] & mask(2), 2))); break;
          case 'cbw': setReg({ r: 0, size: 2 }, BigInt.asUintN(16, signed(regs[0] & mask(1), 1))); break;
          case 'cqo': case 'cqto': setReg({ r: 2, size: 8 }, signed(regs[0], 8) < 0n ? mask(8) : 0n); break;
          case 'cdq': case 'cltd': setReg({ r: 2, size: 4 }, signed(regs[0] & mask(4), 4) < 0n ? mask(4) : 0n); break;
          case 'cwd': setReg({ r: 2, size: 2 }, signed(regs[0] & mask(2), 2) < 0n ? mask(2) : 0n); break;
          case 'lea': {
            var target = ops[1];
            if (target.kind !== 'mem') throw fail(ins.line, 'lea تحتاج عنواناً في الذاكرة', 'lea needs a memory operand');
            write(ops[0], s || 8, BigInt(addr(target, ins)), ins);
            break;
          }
          case 'add': write(ops[0], s, arith('add', read(ops[0], s, ins), read(ops[1], s, ins), s), ins); break;
          case 'adc': write(ops[0], s, arith('add', read(ops[0], s, ins), read(ops[1], s, ins), s, BigInt(flags.CF)), ins); break;
          case 'sub': write(ops[0], s, arith('sub', read(ops[0], s, ins), read(ops[1], s, ins), s), ins); break;
          case 'sbb': write(ops[0], s, arith('sub', read(ops[0], s, ins), read(ops[1], s, ins), s, BigInt(flags.CF)), ins); break;
          case 'cmp': arith('sub', read(ops[0], s, ins), read(ops[1], s, ins), s); break;
          case 'inc': case 'dec': {
            var keep = flags.CF;
            write(ops[0], s, arith(ins.op === 'inc' ? 'add' : 'sub', read(ops[0], s, ins), 1n, s), ins);
            flags.CF = keep;
            break;
          }
          case 'neg': {
            var nv = read(ops[0], s, ins);
            var nr = arith('sub', 0n, nv, s);
            flags.CF = nv !== 0n ? 1 : 0;
            write(ops[0], s, nr, ins);
            break;
          }
          case 'not': write(ops[0], s, ~read(ops[0], s, ins), ins); break;
          case 'and': case 'or': case 'xor': case 'test': {
            var x = read(ops[0], s, ins), y = read(ops[1], s, ins);
            var lr = ins.op === 'or' ? (x | y) : ins.op === 'xor' ? (x ^ y) : (x & y);
            flags.CF = 0; flags.OF = 0; setZS(lr, s);
            if (ins.op !== 'test') write(ops[0], s, lr, ins);
            break;
          }
          case 'shl': case 'sal': case 'shr': case 'sar': case 'rol': case 'ror': {
            var cnt = ops.length > 1 ? Number(read(ops[1], 1, ins) & (s === 8 ? 63n : 31n)) : 1;
            if (!cnt) break;
            var v0 = read(ops[0], s, ins), bits = BigInt(s * 8), cn = BigInt(cnt), res;
            if (ins.op === 'shl' || ins.op === 'sal') { res = (v0 << cn) & mask(s); flags.CF = Number((v0 >> (bits - cn)) & 1n); }
            else if (ins.op === 'shr') { res = v0 >> cn; flags.CF = Number((v0 >> (cn - 1n)) & 1n); }
            else if (ins.op === 'sar') { res = BigInt.asUintN(s * 8, signed(v0, s) >> cn); flags.CF = Number((signed(v0, s) >> (cn - 1n)) & 1n); }
            else if (ins.op === 'rol') { var rc = cn % bits; res = ((v0 << rc) | (v0 >> (bits - rc))) & mask(s); flags.CF = Number(res & 1n); }
            else { var rr2 = cn % bits; res = ((v0 >> rr2) | (v0 << (bits - rr2))) & mask(s); flags.CF = Number((res >> (bits - 1n)) & 1n); }
            if (ins.op !== 'rol' && ins.op !== 'ror') setZS(res, s);
            write(ops[0], s, res, ins);
            break;
          }
          case 'imul': {
            if (ops.length === 1) {
              var prod = signed(regs[0] & mask(s), s) * signed(read(ops[0], s, ins), s);
              if (s === 1) setReg({ r: 0, size: 2 }, BigInt.asUintN(16, prod));
              else { setReg({ r: 0, size: s }, BigInt.asUintN(s * 8, prod)); setReg({ r: 2, size: s }, BigInt.asUintN(s * 8, prod >> BigInt(s * 8))); }
              flags.CF = flags.OF = (BigInt.asIntN(s * 8, prod) !== prod) ? 1 : 0;
            } else {
              var lhs = ops.length === 3 ? read(ops[1], s, ins) : read(ops[0], s, ins);
              var rhs = ops.length === 3 ? read(ops[2], s, ins) : read(ops[1], s, ins);
              var p2 = signed(lhs, s) * signed(rhs, s);
              flags.CF = flags.OF = (BigInt.asIntN(s * 8, p2) !== p2) ? 1 : 0;
              write(ops[0], s, BigInt.asUintN(s * 8, p2), ins);
            }
            break;
          }
          case 'mul': {
            var up = (regs[0] & mask(s)) * read(ops[0], s, ins);
            if (s === 1) setReg({ r: 0, size: 2 }, up & mask(2));
            else { setReg({ r: 0, size: s }, up & mask(s)); setReg({ r: 2, size: s }, up >> BigInt(s * 8)); }
            flags.CF = flags.OF = (up >> BigInt(s * 8)) ? 1 : 0;
            break;
          }
          case 'idiv': case 'div': {
            var dv = read(ops[0], s, ins);
            if (dv === 0n) throw fail(ins.line, 'قسمةٌ على صفر — المعالجُ يرفع استثناء ‎#DE', 'Division by zero — the CPU raises #DE');
            var bitsN = BigInt(s * 8), num;
            if (s === 1) num = regs[0] & mask(2);
            else num = ((regs[2] & mask(s)) << bitsN) | (regs[0] & mask(s));
            var q, rem;
            if (ins.op === 'idiv') {
              var sn = BigInt.asIntN(s * 16, num), sd = signed(dv, s);
              q = sn / sd; rem = sn % sd;
              if (q !== BigInt.asIntN(s * 8, q)) throw fail(ins.line, 'ناتجُ القسمة أكبرُ من المسجّل — هل نسيتَ cqo/cdq قبل idiv؟', 'Quotient overflows the register — did you forget cqo/cdq before idiv?');
            } else {
              q = num / dv; rem = num % dv;
              if (q > mask(s)) throw fail(ins.line, 'ناتجُ القسمة أكبرُ من المسجّل — صفّرْ rdx قبل div', 'Quotient overflows the register — zero rdx before div');
            }
            if (s === 1) setReg({ r: 0, size: 2 }, (BigInt.asUintN(8, rem) << 8n) | BigInt.asUintN(8, q));
            else { setReg({ r: 0, size: s }, BigInt.asUintN(s * 8, q)); setReg({ r: 2, size: s }, BigInt.asUintN(s * 8, rem)); }
            break;
          }
          case 'xchg': { var xa = read(ops[0], s, ins), xb = read(ops[1], s, ins); write(ops[0], s, xb, ins); write(ops[1], s, xa, ins); break; }
          case 'setcc': write(ops[0], 1, cond(ins.cc) ? 1n : 0n, ins); break;
          case 'cmovcc': if (cond(ins.cc)) write(ops[0], s, read(ops[1], s, ins), ins); break;
          case 'push': push(ops[0].kind === 'imm' ? BigInt.asUintN(64, ops[0].value) : read(ops[0], ops[0].kind === 'reg' ? ops[0].reg.size : 8, ins)); break;
          case 'pop': write(ops[0], 8, pop(), ins); break;
          case 'leave': regs[4] = regs[5]; if (step) step.regs.rsp = regs[4]; setReg({ r: 5, size: 8 }, pop()); break;
          case 'enter': push(regs[5]); setReg({ r: 5, size: 8 }, regs[4]); regs[4] -= read(ops[0], 2, ins); if (step) step.regs.rsp = regs[4]; break;
          case 'jmp': case 'jcc': case 'call': {
            var taken = ins.op !== 'jcc' || cond(ins.cc);
            if (!taken) break;
            var t0 = ops[0];
            if (t0.kind === 'target') {
              if (t0.addr === undefined) {
                if (ins.op === 'call') {
                  if (!libc.call(t0.name, 8)) throw fail(ins.line, 'الدالّةُ ' + t0.name + ' غيرُ معرّفة — المختبرُ يحاكي printf وputs وputchar وscanf وexit وmalloc وstrlen وatoi', 'Function ' + t0.name + ' is undefined — the lab simulates printf, puts, putchar, scanf, exit, malloc, strlen, atoi');
                  clobber();
                  if (io.needInput) { error = { kind: 'input', ar: 'طلب scanf إدخالاً ولا مزيدَ في لوح «المدخلات».', en: 'scanf asked for input and the Input panel is empty.' }; exited = true; }
                  if (io.halted) exited = true;
                  break;
                }
                if (ins.op === 'jmp' && libc.call(t0.name, 8)) {
                  clobber();
                  if (io.halted) { exited = true; break; }
                  var tailBack = pop(), tailIdx = codeIndex(tailBack, ins);
                  if (tailIdx < 0) { io.exitCode = Number(signed(regs[0] & mask(4), 4)); exited = true; } else next = tailIdx;
                  break;
                }
                throw fail(ins.line, 'علامةٌ غيرُ معرّفة: ' + t0.name, 'Undefined label: ' + t0.name);
              }
              if (ins.op === 'call') push(BigInt(program.codeBase + next * 16));
              next = codeIndex(t0.addr, ins);
            } else {
              var dest = t0.kind === 'reg' ? getReg(t0.reg) : read(t0, 8, ins);
              if (ins.op === 'call') push(BigInt(program.codeBase + next * 16));
              next = codeIndex(dest, ins);
            }
            break;
          }
          case 'ret': {
            var back = pop();
            if (ops[0]) { regs[4] += read(ops[0], 2, ins); }
            var bi = codeIndex(back, ins);
            if (bi < 0) { io.exitCode = Number(signed(regs[0] & mask(4), 4)); exited = true; }
            else next = bi;
            break;
          }
          case 'syscall': {
            var nr = Number(regs[0]);
            if (nr === 1) { var buf = Number(regs[6]), len = Number(regs[2]), bytes = []; for (var k = 0; k < len; k += 1) bytes.push(mem.getByte(buf + k)); io.writeBytes(bytes); setReg({ r: 0, size: 8 }, BigInt(len)); }
            else if (nr === 0) { var rb = io.readBytes(Number(regs[2])); mem.load(Number(regs[6]), rb); setReg({ r: 0, size: 8 }, BigInt(rb.length)); if (!rb.length && o.input === '') { error = { kind: 'input', ar: 'طلب البرنامجُ قراءةً ولوحُ «المدخلات» فارغ.', en: 'The program read input and the Input panel is empty.' }; exited = true; } }
            else if (nr === 60 || nr === 231) { io.exitCode = Number(signed(regs[7] & mask(4), 4)); exited = true; }
            else throw fail(ins.line, 'نداءُ نظامٍ غيرُ مدعوم: rax=' + nr + ' (المدعوم: 0 read · 1 write · 60 exit)', 'Unsupported syscall: rax=' + nr + ' (supported: 0 read · 1 write · 60 exit)');
            break;
          }
          case 'int': {
            var vec = Number(read(ops[0], 1, ins)), n32 = Number(regs[0] & mask(4));
            if (vec !== 0x80) throw fail(ins.line, 'المقاطعةُ الوحيدةُ المدعومة int $0x80', 'Only int $0x80 is supported');
            if (n32 === 4) { var b2 = Number(regs[1] & mask(4)), l2 = Number(regs[2] & mask(4)), bs = []; for (var z = 0; z < l2; z += 1) bs.push(mem.getByte(b2 + z)); io.writeBytes(bs); setReg({ r: 0, size: 8 }, BigInt(l2)); }
            else if (n32 === 1) { io.exitCode = Number(signed(regs[3] & mask(4), 4)); exited = true; }
            else if (n32 === 3) { var rb2 = io.readBytes(Number(regs[2] & mask(4))); mem.load(Number(regs[1] & mask(4)), rb2); setReg({ r: 0, size: 8 }, BigInt(rb2.length)); }
            else throw fail(ins.line, 'نداءُ نظامٍ غيرُ مدعوم: eax=' + n32, 'Unsupported syscall: eax=' + n32);
            break;
          }
          case 'hlt': exited = true; break;
          default: throw fail(ins.line, 'تعليمةٌ غيرُ مدعومة: ' + ins.op, 'Unsupported instruction: ' + ins.op);
        }
        if (step) {
          var changes = Object.keys(step.regs).map(function (k) { return { k: k, to: step.regs[k] }; });
          var fNow = flags.CF + '' + flags.ZF + flags.SF + flags.OF;
          trace.push({ line: ins.line, text: ins.text, changes: changes, flags: fNow !== flagsBefore ? 'CF=' + flags.CF + ' ZF=' + flags.ZF + ' SF=' + flags.SF + ' OF=' + flags.OF : null, mem: step.mem, jump: next !== pc + 1 && !exited ? true : null, out: io.out.length > outBefore ? io.out.slice(outBefore) : null });
        }
        pc = next;
      }
    } catch (e) {
      error = { kind: 'runtime', line: e.line, ar: e.ar || e.message, en: e.en || e.message };
    }
    var shown = X86_NAMES.map(function (n, i2) { return { k: n, v: regs[i2] }; }).filter(function (r) { return r.v !== 0n || r.k === 'rax'; });
    return { output: io.out, error: error, steps: steps, trace: trace, regs: shown.map(function (r) { return { k: r.k, v: fmtBig(r.v) }; }), flags: flags, exitCode: io.exitCode, warn: io.warn };
  }

  function fmtBig(v) {
    var s = BigInt.asIntN(64, v);
    if (s >= -4096n && s <= 0xffffn) return s.toString();
    return '0x' + BigInt.asUintN(64, v).toString(16);
  }

  /*@4.LAPAJ.13*/
  var ARM_CONDS = ['EQ', 'NE', 'CS', 'HS', 'CC', 'LO', 'MI', 'PL', 'VS', 'VC', 'HI', 'LS', 'GE', 'LT', 'GT', 'LE', 'AL'];
  var ARM_DP = { MOV: 1, MVN: 1, ADD: 2, ADC: 2, SUB: 2, SBC: 2, RSB: 2, AND: 2, ORR: 2, EOR: 2, BIC: 2, MUL: 2, LSL: 2, LSR: 2, ASR: 2, ROR: 2, CMP: 3, CMN: 3, TST: 3, TEQ: 3 };
  var ARM_BASES = ['STMFD', 'LDMFD', 'STMDB', 'LDMIA', 'LDRSB', 'LDRSH', 'LDRB', 'STRB', 'LDRH', 'STRH', 'PUSH', 'SDIV', 'UDIV', 'LDR', 'STR', 'POP', 'MLA', 'MOV', 'MVN', 'ADD', 'ADC', 'SUB', 'SBC', 'RSB', 'AND', 'ORR', 'EOR', 'BIC', 'MUL', 'LSL', 'LSR', 'ASR', 'ROR', 'CMP', 'CMN', 'TST', 'TEQ', 'ADR', 'SVC', 'SWI', 'NOP', 'BLX', 'BX', 'BL', 'B'];
  var ARM_REGS = { sp: 13, lr: 14, pc: 15, fp: 11, ip: 12, sl: 10, sb: 9 };
  function armReg(t) {
    var s = String(t).trim().toLowerCase();
    if (ARM_REGS[s] !== undefined) return ARM_REGS[s];
    var m = s.match(/^r(\d{1,2})$/);
    if (m && Number(m[1]) < 16) return Number(m[1]);
    return null;
  }
  function armSplit(mn) {
    var m = mn.toUpperCase().replace(/\.W$/, '');
    for (var i = 0; i < ARM_BASES.length; i += 1) {
      var b = ARM_BASES[i];
      if (m.indexOf(b) !== 0) continue;
      var rest = m.slice(b.length), s = false, cc = 'AL';
      var canS = ARM_DP[b] !== undefined || b === 'MLA';
      if (rest === '') return { op: b, cc: cc, s: s };
      if (canS && rest === 'S') return { op: b, cc: cc, s: true };
      if (ARM_CONDS.indexOf(rest) >= 0) return { op: b, cc: rest, s: false };
      if (canS && rest.length === 3 && rest.charAt(0) === 'S' && ARM_CONDS.indexOf(rest.slice(1)) >= 0) return { op: b, cc: rest.slice(1), s: true };
      if (canS && rest.length === 3 && rest.charAt(2) === 'S' && ARM_CONDS.indexOf(rest.slice(0, 2)) >= 0) return { op: b, cc: rest.slice(0, 2), s: true };
    }
    return null;
  }

  function armAssemble(source) {
    var lines = String(source).split('\n');
    var stmts = [], errors = [];
    lines.forEach(function (raw, i) {
      var text = stripComment(raw, ['@', '//', ';']).replace(/\/\*.*?\*\//g, '').trim();
      while (text) {
        var lm = text.match(/^([A-Za-z_.$][\w.$]*)\s*:/);
        if (!lm) break;
        stmts.push({ line: i + 1, label: lm[1] });
        text = text.slice(lm[0].length).trim();
      }
      if (!text) return;
      var p = text.match(/^(\S+)\s*(.*)$/);
      stmts.push({ line: i + 1, head: p[1], rest: p[2], text: text });
    });
    var DATA_BASE = 0x20000, CODE_BASE = 0x10000;
    var symbols = {}, equs = {}, code = [], data = [], dataAddr = DATA_BASE, pending = [], armSection = 'text';
    function flushArm() {
      pending.forEach(function (l) { symbols[l] = armSection === 'text' ? CODE_BASE + code.length * 4 : dataAddr; });
      pending = [];
    }
    var ARM_DATA = { '.word': 4, '.long': 4, '.int': 4, '.hword': 2, '.short': 2, '.byte': 1 };
    stmts.forEach(function (st) {
      try {
        if (st.label !== undefined) { pending.push(st.label); return; }
        var d = st.head.toLowerCase();
        if (d === '.text' || d === '.data' || d === '.bss' || d === '.section' || d === '.rodata') {
          flushArm();
          armSection = d === '.text' || (d === '.section' && /text/.test(st.rest)) ? 'text' : 'data';
          return;
        }
        if (d === '.equ' || d === '.set') { var a = splitArgs(st.rest); equs[a[0]] = evalExpr(a[1], function (n) { return n === '.' ? dataAddr : equs[n] !== undefined ? equs[n] : symbols[n]; }, st.line); return; }
        if (/^\.(global|globl|type|size|syntax|arm|thumb|cpu|fpu|arch|file|ident|func|endfunc|fnstart|fnend|eabi_attribute|ltorg|pool)$/.test(d)) return;
        if (d === '.align' || d === '.balign' || d === '.p2align') { dataAddr = Math.ceil(dataAddr / 4) * 4; return; }
        if (ARM_DATA[d] || STR_DIRS[d] !== undefined || d === '.space' || d === '.skip' || d === '.zero') {
          pending.forEach(function (l) { symbols[l] = dataAddr; }); pending = [];
          var size;
          if (ARM_DATA[d]) size = ARM_DATA[d] * splitArgs(st.rest).length;
          else if (STR_DIRS[d] !== undefined) size = splitArgs(st.rest).reduce(function (n, s) { var mm = s.match(/^"(.*)"$/); return n + (mm ? unescapeString(mm[1]).length : 0) + STR_DIRS[d]; }, 0);
          else size = evalExpr(splitArgs(st.rest)[0], function (n) { return equs[n]; }, st.line);
          if (!(size >= 0)) throw fail(st.line, 'حجمٌ سالبٌ أو غيرُ معرَّف في ' + d, 'Negative or undefined size in ' + d);
          data.push({ st: st, addr: dataAddr }); dataAddr += size;
          return;
        }
        if (/^\./.test(d)) return;
        pending.forEach(function (l) { symbols[l] = CODE_BASE + code.length * 4; }); pending = [];
        code.push(st);
      } catch (e) { errors.push({ line: e.line || st.line, ar: e.ar || e.message, en: e.en || e.message }); }
    });
    flushArm();
    var mem = new Memory();
    function look(n) { return equs[n] !== undefined ? equs[n] : symbols[n]; }
    data.forEach(function (it) {
      try {
        var d = it.st.head.toLowerCase(), at = it.addr;
        if (ARM_DATA[d]) splitArgs(it.st.rest).forEach(function (s) { mem.write(at, ARM_DATA[d], evalExpr(s, look, it.st.line) >>> 0); at += ARM_DATA[d]; });
        else if (STR_DIRS[d] !== undefined) splitArgs(it.st.rest).forEach(function (s) { var mm = s.match(/^"(.*)"$/); if (!mm) throw fail(it.st.line, d + ' تحتاج نصّاً بين علامتي تنصيص', d + ' needs a quoted string'); var bs = unescapeString(mm[1]); if (STR_DIRS[d]) bs.push(0); mem.load(at, bs); at += bs.length; });
      } catch (e) { errors.push({ line: e.line || it.st.line, ar: e.ar || e.message, en: e.en || e.message }); }
    });
    var program = [];
    code.forEach(function (st) {
      try { program.push(armParse(st, look, symbols)); }
      catch (e) { errors.push({ line: e.line || st.line, ar: e.ar || e.message, en: e.en || e.message }); }
    });
    if (!code.length && !errors.length) errors.push({ line: 1, ar: 'لا تعليماتٍ في البرنامج — اكتب تحت ‎.text أو main:', en: 'No instructions — write them under .text or main:' });
    if (errors.length) return { ok: false, errors: errors };
    var entry = symbols.main !== undefined ? symbols.main : symbols._start !== undefined ? symbols._start : CODE_BASE;
    return { ok: true, isa: 'arm', code: program, mem: mem, symbols: symbols, entry: (entry - CODE_BASE) / 4, codeBase: CODE_BASE };
  }

  function armImm(t, look, line) {
    var s = t.trim().replace(/^#/, '');
    return evalExpr(s, look, line) | 0;
  }
  function armOp2(parts, look, line) {
    var first = parts[0].trim();
    if (first.charAt(0) === '#') return { imm: armImm(first, look, line) };
    var r = armReg(first);
    if (r === null) {
      if (/^-?(0x)?[0-9a-f]+$/i.test(first)) return { imm: armImm(first, look, line) };
      throw fail(line, 'معاملٌ لا يُفهم: ' + first, 'Cannot read operand: ' + first);
    }
    var op = { reg: r };
    if (parts[1]) {
      var sm = parts[1].trim().match(/^(lsl|lsr|asr|ror)\s+(.+)$/i);
      if (!sm) throw fail(line, 'إزاحةٌ لا تُفهم: ' + parts[1], 'Cannot read shift: ' + parts[1]);
      op.shift = sm[1].toUpperCase();
      var amt = sm[2].trim();
      if (amt.charAt(0) === '#') op.amount = armImm(amt, look, line); else op.amountReg = armReg(amt);
    }
    return op;
  }
  function armParse(st, look, symbols) {
    var info = armSplit(st.head);
    if (!info) throw fail(st.line, 'تعليمةٌ غيرُ مدعومة: ' + st.head, 'Unsupported instruction: ' + st.head);
    var args = st.rest ? splitArgs(st.rest) : [];
    var ins = { op: info.op, cc: info.cc, s: info.s, line: st.line, text: st.text };
    var reg = function (t) { var r = armReg(t); if (r === null) throw fail(st.line, 'مسجّلٌ غيرُ معروف: ' + t, 'Unknown register: ' + t); return r; };
    var op = info.op;
    if (op === 'B' || op === 'BL') {
      var name = (args[0] || '').trim();
      ins.target = symbols[name]; ins.name = name;
      if (ins.target === undefined && op === 'B') throw fail(st.line, 'علامةٌ غيرُ معرّفة: ' + name, 'Undefined label: ' + name);
    } else if (op === 'BX' || op === 'BLX') ins.rm = reg(args[0]);
    else if (op === 'PUSH' || op === 'POP' || op === 'STMFD' || op === 'LDMFD' || op === 'STMDB' || op === 'LDMIA') {
      var listText = op === 'PUSH' || op === 'POP' ? args.join(',') : args.slice(1).join(',');
      if (op !== 'PUSH' && op !== 'POP') { ins.base = reg(args[0].replace('!', '')); ins.wb = /!/.test(args[0]); }
      var lm = listText.match(/\{([^}]*)\}/);
      if (!lm) throw fail(st.line, 'قائمةُ المسجّلات تُكتب بين { }', 'The register list goes inside { }');
      var list = [];
      lm[1].split(',').forEach(function (part) {
        var rg = part.trim().split('-');
        if (rg.length === 2) { for (var k = reg(rg[0]); k <= reg(rg[1]); k += 1) list.push(k); }
        else if (part.trim()) list.push(reg(part));
      });
      ins.list = list.sort(function (a, b) { return a - b; });
      if (op === 'STMFD' || op === 'STMDB') ins.op = 'PUSHB';
      if (op === 'LDMFD' || op === 'LDMIA') ins.op = 'POPB';
    } else if (/^(LDR|STR)/.test(op)) {
      ins.rd = reg(args[0]);
      ins.width = /B$/.test(op) ? 1 : /H$/.test(op) ? 2 : 4;
      ins.signedLoad = /^LDRS/.test(op);
      var addrText = args.slice(1).join(',').trim();
      if (addrText.charAt(0) === '=') { ins.literal = evalExpr(addrText.slice(1), look, st.line) >>> 0; }
      else {
        var mm = addrText.match(/^\[([^\]]*)\](!?)\s*(?:,\s*(.*))?$/);
        if (!mm) {
          if (symbols[addrText] !== undefined) { ins.labelAddr = symbols[addrText]; }
          else throw fail(st.line, 'عنوانٌ لا يُفهم: ' + addrText + ' — يُكتب [r1] أو [r1, #4] أو =label', 'Cannot read address: ' + addrText + ' — write [r1], [r1, #4] or =label');
        } else {
          var inner = splitArgs(mm[1]);
          ins.rn = reg(inner[0]);
          if (inner[1]) {
            var off = inner[1].trim();
            if (off.charAt(0) === '#') ins.offImm = armImm(off, look, st.line);
            else { var neg = off.charAt(0) === '-'; ins.offReg = reg(off.replace(/^[-+]/, '')); ins.offNeg = neg; if (inner[2]) { var sh = inner[2].trim().match(/^lsl\s+#(\d+)$/i); ins.offShift = sh ? Number(sh[1]) : 0; } }
          }
          ins.pre = true; ins.wb = mm[2] === '!';
          if (mm[3]) {
            ins.pre = false; ins.wb = true;
            var post = splitArgs(mm[3]);
            if (armReg(post[0].replace(/^[-+]/, '')) !== null) {
              ins.offNeg = post[0].trim().charAt(0) === '-'; ins.offReg = reg(post[0].trim().replace(/^[-+]/, ''));
              var psh = (post[1] || '').trim().match(/^lsl\s+#(\d+)$/i); ins.offShift = psh ? Number(psh[1]) : 0;
            } else ins.offImm = armImm(mm[3], look, st.line);
          }
        }
      }
    } else if (op === 'ADR') { ins.rd = reg(args[0]); ins.literal = evalExpr(args[1], look, st.line) >>> 0; }
    else if (op === 'SVC' || op === 'SWI') { ins.imm = args[0] ? armImm(args[0], look, st.line) : 0; }
    else if (op === 'NOP') { }
    else if (op === 'MLA') { ins.rd = reg(args[0]); ins.rn = reg(args[1]); ins.rm = reg(args[2]); ins.ra = reg(args[3]); }
    else if (op === 'SDIV' || op === 'UDIV') { ins.rd = reg(args[0]); ins.rn = reg(args[1]); ins.rm = reg(args[2]); }
    else {
      var kind = ARM_DP[op];
      if (kind === 1) { ins.rd = reg(args[0]); ins.op2 = armOp2(args.slice(1), look, st.line); }
      else if (kind === 3) { ins.rn = reg(args[0]); ins.op2 = armOp2(args.slice(1), look, st.line); }
      else {
        ins.rd = reg(args[0]);
        if (args.length === 2) { ins.rn = ins.rd; ins.op2 = armOp2(args.slice(1), look, st.line); }
        else { ins.rn = reg(args[1]); ins.op2 = armOp2(args.slice(2), look, st.line); }
      }
    }
    return ins;
  }

  /*@4.LAPAJ.14*/
  function armRun(program, options) {
    var o = options || {};
    var maxSteps = o.maxSteps || 500000;
    var mem = program.mem;
    var r = new Array(16).fill(0);
    var F = { N: 0, Z: 0, C: 0, V: 0 };
    var SENTINEL = 0xdead0000, STACK_TOP = 0x7fff0000;
    r[13] = STACK_TOP; r[14] = SENTINEL;
    var io = makeIO(o.input);
    var trace = [], steps = 0, error = null, pc = program.entry, exited = false, step = null;
    var NAMES = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'fp', 'ip', 'sp', 'lr', 'pc'];
    function set(i, v) { var nv = v >>> 0; if (step && r[i] !== nv) step.regs[NAMES[i]] = nv; r[i] = nv; }
    function get(i, insPc) { return i === 15 ? (program.codeBase + insPc * 4 + 8) >>> 0 : r[i]; }
    function cond(cc) {
      switch (cc) {
        case 'EQ': return F.Z; case 'NE': return !F.Z; case 'CS': case 'HS': return F.C; case 'CC': case 'LO': return !F.C;
        case 'MI': return F.N; case 'PL': return !F.N; case 'VS': return F.V; case 'VC': return !F.V;
        case 'HI': return F.C && !F.Z; case 'LS': return !F.C || F.Z; case 'GE': return F.N === F.V; case 'LT': return F.N !== F.V;
        case 'GT': return !F.Z && F.N === F.V; case 'LE': return F.Z || F.N !== F.V; default: return true;
      }
    }
    function shiftVal(v, kind, n) {
      n = n & 255;
      if (!n) return { v: v >>> 0, c: F.C };
      if (kind === 'LSL') return n >= 32 ? { v: 0, c: n === 32 ? v & 1 : 0 } : { v: (v << n) >>> 0, c: (v >>> (32 - n)) & 1 };
      if (kind === 'LSR') return n >= 32 ? { v: 0, c: n === 32 ? (v >>> 31) & 1 : 0 } : { v: v >>> n, c: (v >>> (n - 1)) & 1 };
      if (kind === 'ASR') return n >= 32 ? { v: (v | 0) < 0 ? 0xffffffff : 0, c: (v >>> 31) & 1 } : { v: ((v | 0) >> n) >>> 0, c: ((v | 0) >> (n - 1)) & 1 };
      var k = n % 32; var rv = k ? ((v >>> k) | (v << (32 - k))) >>> 0 : v >>> 0; return { v: rv, c: (rv >>> 31) & 1 };
    }
    function op2(o2, insPc) {
      if (o2.imm !== undefined) return { v: o2.imm >>> 0, c: F.C };
      var v = get(o2.reg, insPc);
      if (!o2.shift) return { v: v, c: F.C };
      return shiftVal(v, o2.shift, o2.amount !== undefined ? o2.amount : get(o2.amountReg, insPc) & 255);
    }
    function nz(v) { F.N = (v >>> 31) & 1; F.Z = v === 0 ? 1 : 0; }
    function addF(a, b, c) { var s = a + b + c; var res = s >>> 0; F.C = s > 0xffffffff ? 1 : 0; F.V = ((~(a ^ b) & (a ^ res)) >>> 31) & 1; nz(res); return res; }
    function push(v) { r[13] = (r[13] - 4) >>> 0; mem.write(r[13], 4, v); if (step) step.regs.sp = r[13]; }
    function idx(target, ins) {
      if ((target >>> 0) === SENTINEL) return -1;
      var i = ((target & ~1) - program.codeBase) / 4;
      if (i < 0 || i >= program.code.length || i !== Math.floor(i)) throw fail(ins.line, 'قفزةٌ إلى عنوانٍ ليس تعليمة: 0x' + (target >>> 0).toString(16), 'Jump to an address that is not an instruction: 0x' + (target >>> 0).toString(16));
      return i;
    }
    var libc = new Libc(mem, io, function (i) { return BigInt(i < 4 ? r[i] : mem.read(r[13] + (i - 4) * 4, 4)); }, function (v) { set(0, Number(BigInt.asUintN(32, v))); });
    try {
      while (!exited) {
        if (steps >= maxSteps) { error = { kind: 'steps', ar: 'تجاوز البرنامجُ ' + maxSteps + ' تعليمة — غالباً حلقةٌ لا تنتهي.', en: 'Over ' + maxSteps + ' instructions — probably an endless loop.' }; break; }
        if (pc < 0 || pc >= program.code.length) { error = { kind: 'pc', ar: 'وصل التنفيذُ إلى نهاية الكود بلا BX lr ولا exit.', en: 'Execution ran off the end of the code without BX lr or exit.' }; break; }
        var ins = program.code[pc], next = pc + 1;
        var fb = '' + F.N + F.Z + F.C + F.V, outBefore = io.out.length;
        step = trace.length < TRACE_CAP ? { regs: {}, mem: [] } : null;
        steps += 1;
        if (cond(ins.cc)) {
          var op = ins.op;
          if (ARM_DP[op]) {
            var o2 = op2(ins.op2, pc), a = ARM_DP[op] === 1 ? 0 : get(ins.rn, pc), res, setFlags = ins.s || ARM_DP[op] === 3;
            switch (op) {
              case 'MOV': res = o2.v; if (setFlags) { nz(res); F.C = o2.c; } break;
              case 'MVN': res = (~o2.v) >>> 0; if (setFlags) { nz(res); F.C = o2.c; } break;
              case 'ADD': case 'CMN': res = setFlags ? addF(a, o2.v, 0) : (a + o2.v) >>> 0; break;
              case 'ADC': res = setFlags ? addF(a, o2.v, F.C) : (a + o2.v + F.C) >>> 0; break;
              case 'SUB': case 'CMP': res = setFlags ? addF(a, (~o2.v) >>> 0, 1) : (a - o2.v) >>> 0; break;
              case 'SBC': res = setFlags ? addF(a, (~o2.v) >>> 0, F.C) : (a - o2.v - (1 - F.C)) >>> 0; break;
              case 'RSB': res = setFlags ? addF(o2.v, (~a) >>> 0, 1) : (o2.v - a) >>> 0; break;
              case 'AND': case 'TST': res = (a & o2.v) >>> 0; if (setFlags) { nz(res); F.C = o2.c; } break;
              case 'ORR': res = (a | o2.v) >>> 0; if (setFlags) { nz(res); F.C = o2.c; } break;
              case 'EOR': case 'TEQ': res = (a ^ o2.v) >>> 0; if (setFlags) { nz(res); F.C = o2.c; } break;
              case 'BIC': res = (a & ~o2.v) >>> 0; if (setFlags) { nz(res); F.C = o2.c; } break;
              case 'MUL': res = Math.imul(a, o2.v) >>> 0; if (setFlags) nz(res); break;
              case 'LSL': case 'LSR': case 'ASR': case 'ROR': { var sv = shiftVal(a, op, o2.v); res = sv.v; if (setFlags) { nz(res); F.C = sv.c; } break; }
            }
            if (ARM_DP[op] !== 3) {
              if (ins.rd === 15) { next = idx(res, ins); if (next < 0) { io.exitCode = r[0] | 0; exited = true; } }
              else set(ins.rd, res);
            }
          } else if (op === 'MLA') set(ins.rd, (Math.imul(r[ins.rn], r[ins.rm]) + r[ins.ra]) >>> 0);
          else if (op === 'SDIV' || op === 'UDIV') {
            var den = r[ins.rm];
            if (den === 0) set(ins.rd, 0);
            else set(ins.rd, op === 'SDIV' ? (Math.trunc((r[ins.rn] | 0) / (den | 0)) >>> 0) : Math.floor(r[ins.rn] / den) >>> 0);
          } else if (op === 'B' || op === 'BL') {
            if (ins.target === undefined) {
              if (!libc.call(ins.name, 4)) throw fail(ins.line, 'الدالّةُ ' + ins.name + ' غيرُ معرّفة — المختبرُ يحاكي printf وputs وputchar وscanf وexit وmalloc', 'Function ' + ins.name + ' is undefined — the lab simulates printf, puts, putchar, scanf, exit, malloc');
              set(14, (program.codeBase + next * 4) >>> 0);
              r[1] = r[2] = r[3] = r[12] = 0xbad0c0de;
              if (io.needInput) { error = { kind: 'input', ar: 'طلب scanf إدخالاً ولا مزيدَ في لوح «المدخلات».', en: 'scanf asked for input and the Input panel is empty.' }; exited = true; }
              if (io.halted) exited = true;
            } else {
              if (op === 'BL') set(14, (program.codeBase + next * 4) >>> 0);
              next = idx(ins.target, ins);
            }
          } else if (op === 'BX' || op === 'BLX') {
            var dest = r[ins.rm];
            if (op === 'BLX') set(14, (program.codeBase + next * 4) >>> 0);
            next = idx(dest, ins);
            if (next < 0) { io.exitCode = r[0] | 0; exited = true; }
          } else if (op === 'PUSH' || op === 'PUSHB') {
            var base = op === 'PUSH' ? 13 : ins.base, sp = r[base] - 4 * ins.list.length;
            ins.list.forEach(function (k, j) { mem.write(sp + 4 * j, 4, k === 15 ? get(15, pc) : r[k]); });
            if (op === 'PUSH' || ins.wb) set(base, sp);
          } else if (op === 'POP' || op === 'POPB') {
            var b2 = op === 'POP' ? 13 : ins.base, at = r[b2];
            var vals = ins.list.map(function (k, j) { return mem.read(at + 4 * j, 4); });
            if (op === 'POP' || ins.wb) set(b2, at + 4 * ins.list.length);
            ins.list.forEach(function (k, j) {
              if (k === 15) { next = idx(vals[j], ins); if (next < 0) { io.exitCode = r[0] | 0; exited = true; } }
              else set(k, vals[j]);
            });
          } else if (/^(LDR|STR)/.test(op)) {
            if (ins.literal !== undefined) set(ins.rd, ins.literal);
            else {
              var addr;
              if (ins.labelAddr !== undefined) addr = ins.labelAddr;
              else {
                var off = ins.offImm !== undefined ? ins.offImm : ins.offReg !== undefined ? ((r[ins.offReg] << (ins.offShift || 0)) * (ins.offNeg ? -1 : 1)) : 0;
                var baseV = get(ins.rn, pc);
                addr = (ins.pre ? baseV + off : baseV) >>> 0;
                if (ins.wb) set(ins.rn, (baseV + off) >>> 0);
              }
              if (addr < 0x1000) throw fail(ins.line, 'وصولٌ إلى عنوانٍ غيرِ صالح 0x' + addr.toString(16) + ' (مؤشّرٌ صفريّ؟)', 'Access to an invalid address 0x' + addr.toString(16) + ' (null pointer?)');
              if (/^LDR/.test(op)) {
                var lv = mem.read(addr, ins.width);
                if (ins.signedLoad) lv = ins.width === 1 ? (lv << 24 >> 24) >>> 0 : (lv << 16 >> 16) >>> 0;
                if (ins.rd === 15) { next = idx(lv, ins); if (next < 0) { io.exitCode = r[0] | 0; exited = true; } } else set(ins.rd, lv);
              } else {
                mem.write(addr, ins.width, r[ins.rd]);
                if (step && step.mem.length < 4) step.mem.push({ at: '0x' + addr.toString(16), size: ins.width, value: r[ins.rd] & (ins.width === 4 ? 0xffffffff : (1 << (ins.width * 8)) - 1) });
              }
            }
          } else if (op === 'ADR') set(ins.rd, ins.literal);
          else if (op === 'SVC' || op === 'SWI') {
            var call = r[7];
            if (call === 4) { var bytes = []; for (var k = 0; k < r[2]; k += 1) bytes.push(mem.getByte(r[1] + k)); io.writeBytes(bytes); set(0, r[2]); }
            else if (call === 3) { var rb = io.readBytes(r[2]); mem.load(r[1], rb); set(0, rb.length); }
            else if (call === 1) { io.exitCode = r[0] | 0; exited = true; }
            else throw fail(ins.line, 'نداءُ نظامٍ غيرُ مدعوم: r7=' + call + ' (المدعوم: 1 exit · 3 read · 4 write)', 'Unsupported syscall: r7=' + call + ' (supported: 1 exit · 3 read · 4 write)');
          }
        }
        if (step && trace.length < TRACE_CAP) {
          var fn = '' + F.N + F.Z + F.C + F.V;
          trace.push({ line: ins.line, text: ins.text, changes: Object.keys(step.regs).map(function (k) { return { k: k, to: step.regs[k] }; }), flags: fn !== fb ? 'N=' + F.N + ' Z=' + F.Z + ' C=' + F.C + ' V=' + F.V : null, mem: step.mem, jump: next !== pc + 1 && !exited ? true : null, skipped: !cond(ins.cc) || undefined, out: io.out.length > outBefore ? io.out.slice(outBefore) : null });
        }
        pc = next;
      }
    } catch (e) { error = { kind: 'runtime', line: e.line, ar: e.ar || e.message, en: e.en || e.message }; }
    var regs = NAMES.slice(0, 15).map(function (n, i) { return { k: n, v: r[i] }; }).filter(function (x) { return x.v !== 0 && x.k !== 'lr' || x.k === 'r0'; })
      .map(function (x) { var s = x.v | 0; return { k: x.k, v: (s >= -4096 && s <= 0xffff) ? String(s) : '0x' + (x.v >>> 0).toString(16) }; });
    return { output: io.out, error: error, steps: steps, trace: trace, regs: regs, flags: F, exitCode: io.exitCode, warn: io.warn };
  }

  /*@4.LAPAJ.15*/
  function detect(source) {
    var s = String(source);
    if (/%(r[a-z0-9]+|e[a-d]x|[re]?[sb]p|[re]?[sd]i)\b/i.test(s) || /^\s*(section|global|extern)\s/im.test(s) || /\b(rax|rbx|rcx|rdx|rsi|rdi|rsp|rbp|eax|ebx|ecx|edx)\b/i.test(s) || /^\s*\.intel_syntax/m.test(s)) return 'x86';
    if (/\b(r1[0-5]|r[0-9]|lr|pc)\b\s*,/i.test(s) || /\b(BX\s+lr|PUSH\s*\{|POP\s*\{|SVC|LDR\s+r\d)/i.test(s)) return 'arm';
    if (/^\s*(\d{1,2}\s+)?(\w+\s+)?(LDA|STA|STO|INP|BRZ|BRP|BRA|HLT|COB|DAT)\b/im.test(s)) return 'lmc';
    return null;
  }

  var ISAS = {
    lmc: { assemble: lmcAssemble, run: lmcRun },
    x86: { assemble: x86Assemble, run: x86Run },
    arm: { assemble: armAssemble, run: armRun }
  };

  function assemble(isa, source) {
    var engine = ISAS[isa];
    if (!engine) return { ok: false, errors: [{ line: 1, ar: 'معمارٌ غيرُ معروف: ' + isa, en: 'Unknown architecture: ' + isa }] };
    try { return engine.assemble(source); }
    catch (e) { return { ok: false, errors: [{ line: e.line || 1, ar: e.ar || e.message, en: e.en || e.message }] }; }
  }
  function run(program, options) {
    var res = ISAS[program.isa].run(program, options);
    res.isa = program.isa;
    return res;
  }
  function runSource(isa, source, options) {
    var built = assemble(isa, source);
    if (!built.ok) return { ok: false, errors: built.errors };
    var res = run(built, options);
    res.ok = true;
    return res;
  }

  var api = { assemble: assemble, run: run, runSource: runSource, detect: detect, isas: Object.keys(ISAS), TRACE_CAP: TRACE_CAP };
  global.GardenASM = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
