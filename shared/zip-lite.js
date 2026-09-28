/*@3.ZILJ.1*/
;(function () {
  'use strict';

  var CRC = null;
  function crcTable() {
    if (CRC) return CRC;
    CRC = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      CRC[n] = c >>> 0;
    }
    return CRC;
  }
  function crc32(u8) {
    var t = crcTable(), c = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) c = t[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function canDeflate() {
    return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
  }
  function pipe(u8, stream) {
    var w = stream.writable.getWriter();
    w.write(u8); w.close();
    return new Response(stream.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function deflate(u8) { return pipe(u8, new CompressionStream('deflate-raw')); }
  function inflate(u8) { return pipe(u8, new DecompressionStream('deflate-raw')); }

  function toBytes(data) {
    if (data instanceof Uint8Array) return Promise.resolve(data);
    if (typeof data === 'string') return Promise.resolve(new TextEncoder().encode(data));
    if (data && typeof data.arrayBuffer === 'function') {
      return data.arrayBuffer().then(function (b) { return new Uint8Array(b); });
    }
    if (data instanceof ArrayBuffer) return Promise.resolve(new Uint8Array(data));
    return Promise.resolve(new Uint8Array(0));
  }

  function dosTime(d) {
    return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
  }
  function dosDate(d) {
    return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  }

  function make(files) {
    var now = new Date(), tm = dosTime(now), dt = dosDate(now);
    var enc = new TextEncoder();
    var parts = [], central = [], offset = 0;
    var i = 0;
    function next() {
      if (i >= files.length) return finish();
      var f = files[i++];
      return toBytes(f.data).then(function (raw) {
        var want = f.compress !== false && canDeflate() && raw.length > 64;
        return (want ? deflate(raw) : Promise.resolve(raw)).then(function (body) {
          var method = want ? 8 : 0;
          if (want && body.length >= raw.length) { body = raw; method = 0; }
          var name = enc.encode(f.name);
          var crc = crc32(raw);
          var h = new DataView(new ArrayBuffer(30));
          h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true);
          h.setUint16(6, 0x0800, true); h.setUint16(8, method, true);
          h.setUint16(10, tm, true); h.setUint16(12, dt, true);
          h.setUint32(14, crc, true); h.setUint32(18, body.length, true);
          h.setUint32(22, raw.length, true); h.setUint16(26, name.length, true);
          h.setUint16(28, 0, true);
          parts.push(new Uint8Array(h.buffer), name, body);
          var c = new DataView(new ArrayBuffer(46));
          c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
          c.setUint16(8, 0x0800, true); c.setUint16(10, method, true);
          c.setUint16(12, tm, true); c.setUint16(14, dt, true);
          c.setUint32(16, crc, true); c.setUint32(20, body.length, true);
          c.setUint32(24, raw.length, true); c.setUint16(28, name.length, true);
          c.setUint32(42, offset, true);
          central.push(new Uint8Array(c.buffer), name);
          offset += 30 + name.length + body.length;
          return next();
        });
      });
    }
    function finish() {
      var size = 0;
      central.forEach(function (p) { size += p.length; });
      var e = new DataView(new ArrayBuffer(22));
      e.setUint32(0, 0x06054b50, true);
      e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
      e.setUint32(12, size, true); e.setUint32(16, offset, true);
      return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
    }
    return Promise.resolve().then(next);
  }

  function read(blob) {
    return toBytes(blob).then(function (u8) {
      var v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      var eo = -1;
      for (var p = u8.length - 22; p >= Math.max(0, u8.length - 65557); p--) {
        if (v.getUint32(p, true) === 0x06054b50) { eo = p; break; }
      }
      if (eo < 0) throw new Error('not-zip');
      var count = v.getUint16(eo + 10, true), cd = v.getUint32(eo + 16, true);
      var dec = new TextDecoder(), out = {}, jobs = [];
      for (var k = 0; k < count; k++) {
        if (v.getUint32(cd, true) !== 0x02014b50) throw new Error('bad-zip');
        var method = v.getUint16(cd + 10, true);
        var csize = v.getUint32(cd + 20, true);
        var nlen = v.getUint16(cd + 28, true), xlen = v.getUint16(cd + 30, true);
        var clen = v.getUint16(cd + 32, true), loc = v.getUint32(cd + 42, true);
        var name = dec.decode(u8.subarray(cd + 46, cd + 46 + nlen));
        var start = loc + 30 + v.getUint16(loc + 26, true) + v.getUint16(loc + 28, true);
        var body = u8.subarray(start, start + csize);
        jobs.push({ name: name, method: method, body: body });
        cd += 46 + nlen + xlen + clen;
      }
      return jobs.reduce(function (pr, j) {
        return pr.then(function () {
          if (j.method === 0) { out[j.name] = j.body; return; }
          if (j.method !== 8 || !canDeflate()) throw new Error('zip-method');
          return inflate(j.body).then(function (b) { out[j.name] = b; });
        });
      }, Promise.resolve()).then(function () { return out; });
    });
  }

  function text(u8) { return u8 ? new TextDecoder().decode(u8) : ''; }

  window.GardenZip = { make: make, read: read, text: text, crc32: crc32 };
})();
