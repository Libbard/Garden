(function () {
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
  function crcOf(u8, crc) {
    var t = crcTable(), c = (crc === undefined ? 0 : crc) ^ 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) c = t[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  var enc = new TextEncoder();

  function dosTime(d) {
    return { t: ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF,
             d: (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF };
  }

  /*@3.NOBJ3.1*/
  function Zip() { this.parts = []; this.dir = []; this.off = 0; this.when = dosTime(new Date()); }
  Zip.prototype.add = function (path, data) {
    var self = this;
    var bytes = (typeof data === 'string') ? enc.encode(data) : data;
    var get = (bytes instanceof Uint8Array) ? Promise.resolve(bytes)
      : (data && data.arrayBuffer ? data.arrayBuffer().then(function (b) { return new Uint8Array(b); }) : Promise.resolve(new Uint8Array(0)));
    return get.then(function (u8) {
      var name = enc.encode(path), crc = crcOf(u8), size = u8.length;
      if (self.off + size > 0xFFFFFFF0) throw new Error('zip_too_big');
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, self.when.t, true); h.setUint16(12, self.when.d, true);
      h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      self.dir.push({ name: name, crc: crc, size: size, off: self.off });
      self.parts.push(new Uint8Array(h.buffer), name, (data instanceof Blob) ? data : u8);
      self.off += 30 + name.length + size;
      return size;
    });
  };
  Zip.prototype.blob = function () {
    var cd = [], len = 0, self = this;
    this.dir.forEach(function (e) {
      var h = new DataView(new ArrayBuffer(46));
      h.setUint32(0, 0x02014b50, true); h.setUint16(4, 20, true); h.setUint16(6, 20, true); h.setUint16(8, 0x0800, true);
      h.setUint16(10, 0, true); h.setUint16(12, self.when.t, true); h.setUint16(14, self.when.d, true);
      h.setUint32(16, e.crc, true); h.setUint32(20, e.size, true); h.setUint32(24, e.size, true);
      h.setUint16(28, e.name.length, true); h.setUint32(42, e.off, true);
      cd.push(new Uint8Array(h.buffer), e.name);
      len += 46 + e.name.length;
    });
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, this.dir.length, true); end.setUint16(10, this.dir.length, true);
    end.setUint32(12, len, true); end.setUint32(16, this.off, true);
    return new Blob(this.parts.concat(cd, [new Uint8Array(end.buffer)]), { type: 'application/zip' });
  };

  function safe(s, max) {
    var n = String(s == null ? '' : s).replace(/[\\/:*?"<>|]+/g, ' ').replace(/[\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim();
    return (n || 'note').slice(0, max || 60);
  }
  function extOf(type, name) {
    var m = /\.([a-z0-9]{2,5})$/i.exec(name || '');
    if (m) return m[1].toLowerCase();
    var t = String(type || '');
    if (/pdf/.test(t)) return 'pdf';
    if (/png/.test(t)) return 'png';
    if (/jpe?g/.test(t)) return 'jpg';
    if (/webp/.test(t)) return 'webp';
    if (/gif/.test(t)) return 'gif';
    if (/svg/.test(t)) return 'svg';
    if (/webm/.test(t)) return 'webm';
    if (/ogg|opus/.test(t)) return 'ogg';
    if (/mp4|m4a|aac/.test(t)) return 'm4a';
    if (/mpeg|mp3/.test(t)) return 'mp3';
    return 'bin';
  }

  var KEEP_LS = /^(garden_|notes_|quick_notes$|course_meta_|my_tasks$|weekly_schedule$|my_semester$|semester_archive$|dashboard_prefs$|student_profile$|gpa_)/;
  /*@3.NOBJ3.2*/
  var SKIP_LS = /token|auth|secret|session|password|vault_key|_cred|refresh/i;

  function lsDump() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || !KEEP_LS.test(k) || SKIP_LS.test(k)) continue;
        out[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return out;
  }

  function readme(at, c) {
    return [
      'نسخةٌ كاملة من ملاحظاتك في الحديقة الرقميّة — ' + at,
      '',
      'readable/   ملاحظاتُك نصّاً (Markdown) تُقرأ بأيِّ برنامج',
      'files/      ملفّاتُ PDF وتسجيلاتُك الصوتيّة بأسمائها',
      'images/     الصورُ الملصقة في ملاحظاتك',
      'data/       البياناتُ كما يحفظها الموقع — بها تُستعاد النسخةُ كاملةً في الحديقة',
      'manifest.json  الفهرس: كلُّ ملفٍّ هنا وإلى أيِّ ملاحظةٍ ينتمي',
      '',
      'الملاحظات: ' + c.notes + ' · ملفّات: ' + c.files + ' · صور: ' + c.images,
      '',
      '— English —',
      'A full copy of your notes from the Digital Garden — ' + at,
      'readable/ = your notes as Markdown · files/ = PDFs and recordings · images/ = pasted images',
      'data/ = the raw data the site keeps, used to restore this copy into the Garden',
      ''
    ].join('\n');
  }

  function build(onStep) {
    var St = window.GardenNotesStore, PD = window.GardenPdfDoc, Ink = window.GardenPdfInk, Sz = window.GardenNotesSerialize;
    var zip = new Zip(), at = new Date(), stamp = at.toISOString().slice(0, 10);
    var root = 'garden-notes-' + stamp + '/';
    var man = { format: 'garden-backup', v: 1, at: at.toISOString(), notes: [], files: [], images: [], ink: 0, local: 0 };
    var step = function (k, i, n) { if (onStep) { try { onStep(k, i, n); } catch (e) {} } };
    var idx = [];
    try { idx = JSON.parse(localStorage.getItem('notes_index') || '[]') || []; } catch (e0) { idx = []; }
    var byId = {};
    idx.forEach(function (r) { if (r && r.id) byId[r.id] = r; });
    var folders = {};
    try { (JSON.parse(localStorage.getItem('notes_folders') || '[]') || []).forEach(function (f) { if (f && f.id) folders[f.id] = f; }); } catch (e1) {}
    function folderPath(fid) {
      var out = [], g = 0;
      while (fid && folders[fid] && g++ < 12) { out.unshift(safe(folders[fid].n || folders[fid].name || 'folder', 40)); fid = folders[fid].p || folders[fid].parent || ''; }
      return out.join('/');
    }
    var used = {};
    function uniq(path) {
      var p = path, k = 2;
      while (used[p]) { p = path.replace(/(\.[a-z0-9]+)?$/i, ' (' + (k++) + ')$1'); }
      used[p] = 1;
      return p;
    }

    var chain = Promise.resolve();
    var local = lsDump();
    man.local = Object.keys(local).length;
    chain = chain.then(function () { return zip.add(root + 'data/local-storage.json', JSON.stringify(local)); });

    chain = chain.then(function () { return St && St.manifest ? St.manifest() : {}; }).then(function (m) {
      var ids = Object.keys(m || {});
      return ids.reduce(function (c, id, i) {
        return c.then(function () {
          step('notes', i + 1, ids.length);
          return St.getRaw(id).then(function (row) {
            if (!row) return null;
            var rec = byId[id] || {};
            man.notes.push({ id: id, t: rec.t || '', k: rec.k || 'rich', f: rec.f || null, bytes: row.bytes || 0, deleted: rec.d ? 1 : 0 });
            return zip.add(root + 'data/notes/' + id + '.json', row.raw).then(function () {
              if (rec.d || !Sz || !Sz.render) return null;
              var doc = null;
              try { doc = JSON.parse(row.raw); } catch (e2) { return null; }
              if (!doc || doc.kind === 'board') return null;
              return Sz.render('md', doc, {}).then(function (md) {
                var head = '# ' + (rec.t || '') + '\n\n';
                var dir = folderPath(rec.f);
                var name = uniq(root + 'readable/' + (dir ? dir + '/' : '') + safe(rec.t || id) + '.md');
                return zip.add(name, head + (md || ''));
              }, function () { return null; });
            });
          });
        });
      }, Promise.resolve());
    });

    chain = chain.then(function () { return Ink && Ink.inkDump ? Ink.inkDump() : []; }).then(function (rows) {
      man.ink = rows.length;
      step('ink', 1, 1);
      return rows.length ? zip.add(root + 'data/pdf-ink.json', JSON.stringify(rows)) : null;
    });

    chain = chain.then(function () { return St && St.allImages ? St.allImages() : []; }).then(function (rows) {
      return rows.reduce(function (c, r, i) {
        return c.then(function () {
          step('images', i + 1, rows.length);
          if (!r || !r.blob) return null;
          var path = 'images/' + safe(r.id, 80) + '.' + extOf(r.type || r.blob.type, r.name);
          man.images.push({ id: r.id, path: path, type: r.type || r.blob.type || '', bytes: r.blob.size, name: r.name || '' });
          return zip.add(root + path, r.blob);
        });
      }, Promise.resolve());
    });

    chain = chain.then(function () { return PD && PD.list ? PD.list() : []; }).then(function (list) {
      list = (list || []).filter(function (x) { return x && x.hash && !/^wip_/.test(x.hash); });
      return list.reduce(function (c, x, i) {
        return c.then(function () {
          step('files', i + 1, list.length);
          return PD.get(x.hash).then(function (blob) {
            if (!blob) return null;
            var aud = /^aud_/.test(x.hash);
            var base = safe((x.name || x.hash).replace(/\.[a-z0-9]{2,5}$/i, ''), 70);
            var path = uniq('files/' + base + '.' + extOf(blob.type || (aud ? 'audio/webm' : 'application/pdf'), x.name));
            man.files.push({ hash: x.hash, path: path, kind: aud ? 'audio' : 'pdf', bytes: blob.size, name: x.name || '' });
            return zip.add(root + path, blob);
          }, function () { return null; });
        });
      }, Promise.resolve());
    });

    return chain.then(function () {
      var c = { notes: man.notes.length, files: man.files.length, images: man.images.length };
      return zip.add(root + 'README.txt', readme(at.toISOString().slice(0, 16).replace('T', ' '), c)).then(function () {
        return zip.add(root + 'manifest.json', JSON.stringify(man, null, 1));
      }).then(function () {
        step('done', 1, 1);
        return { blob: zip.blob(), name: 'garden-notes-' + stamp + '.zip', counts: c, bytes: zip.off };
      });
    });
  }

  function save(res) {
    if (window.showSaveFilePicker) {
      return window.showSaveFilePicker({ suggestedName: res.name, types: [{ description: 'ZIP', accept: { 'application/zip': ['.zip'] } }] })
        .then(function (h) { return h.createWritable(); })
        .then(function (w) { return w.write(res.blob).then(function () { return w.close(); }); })
        .then(function () { return 'saved'; }, function (e) {
          if (e && e.name === 'AbortError') return 'cancel';
          return linkSave(res);
        });
    }
    return Promise.resolve(linkSave(res));
  }
  function linkSave(res) {
    var url = URL.createObjectURL(res.blob);
    var a = document.createElement('a');
    a.href = url; a.download = res.name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    return 'saved';
  }

  var dec = new TextDecoder();
  function readZip(file) {
    var tail = Math.min(file.size, 65557);
    if (file.size < 22) return Promise.reject(new Error('not_zip'));
    return file.slice(file.size - tail).arrayBuffer().then(function (buf) {
      var dv = new DataView(buf), at = -1;
      for (var i = buf.byteLength - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { at = i; break; }
      if (at < 0) throw new Error('not_zip');
      var len = dv.getUint32(at + 12, true), off = dv.getUint32(at + 16, true);
      if (off + len > file.size) throw new Error('not_zip');
      return file.slice(off, off + len).arrayBuffer();
    }).then(function (cd) {
      var dv = new DataView(cd), p = 0, out = {};
      while (p + 46 <= cd.byteLength && dv.getUint32(p, true) === 0x02014b50) {
        var nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
        var name = dec.decode(new Uint8Array(cd, p + 46, nl));
        out[name] = { method: dv.getUint16(p + 10, true), crc: dv.getUint32(p + 16, true), csize: dv.getUint32(p + 20, true),
                      size: dv.getUint32(p + 24, true), off: dv.getUint32(p + 42, true) };
        p += 46 + nl + xl + cl;
      }
      return out;
    });
  }
  function entryBlob(file, e, type) {
    return file.slice(e.off, e.off + 30).arrayBuffer().then(function (b) {
      var dv = new DataView(b);
      if (b.byteLength < 30 || dv.getUint32(0, true) !== 0x04034b50) throw new Error('bad_entry');
      var start = e.off + 30 + dv.getUint16(26, true) + dv.getUint16(28, true);
      var raw = file.slice(start, start + e.csize);
      if (e.method === 0) return new Blob([raw], { type: type || '' });
      if (e.method === 8 && window.DecompressionStream) {
        return new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob()
          .then(function (x) { return new Blob([x], { type: type || '' }); });
      }
      throw new Error('zip_method');
    });
  }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function jsonOf(s, f) { try { var v = JSON.parse(s); return v == null ? f : v; } catch (e) { return f; } }

  function plan(file, H) {
    return readZip(file).then(function (ents) {
      var mk = Object.keys(ents).filter(function (n) { return /(^|\/)manifest\.json$/.test(n); })
        .sort(function (a, b) { return a.length - b.length; })[0];
      if (!mk) throw new Error('not_backup');
      var root = mk.slice(0, mk.length - 'manifest.json'.length);
      var txt = function (p) { var e = ents[root + p]; return e ? entryBlob(file, e).then(function (b) { return b.text(); }) : Promise.resolve(''); };
      return Promise.all([txt('manifest.json'), txt('data/local-storage.json')]).then(function (r) {
        var man = jsonOf(r[0], null);
        if (!man || man.format !== 'garden-backup') throw new Error('not_backup');
        var ls = jsonOf(r[1], {}) || {};
        var P = { file: file, ents: ents, root: root, man: man, ls: ls, notes: [], add: 0, newer: 0, keep: 0, gone: 0,
                  folders: [], files: [], images: [], ink: 0, keys: [], bytes: 0 };
        var bIdx = {}, loc = {}, tomb = H.tombs() || {}, open = H.openId ? H.openId() : '';
        arr(jsonOf(ls.notes_index, [])).forEach(function (x) { if (x && x.id) bIdx[x.id] = x; });
        H.idxRead().forEach(function (x) { if (x && x.id) loc[x.id] = x; });
        arr(man.notes).forEach(function (n) {
          if (!n || !n.id || !ents[root + 'data/notes/' + n.id + '.json']) return;
          var b = bIdx[n.id] || { id: n.id, t: n.t || '', k: n.k || 'rich', o: {}, g: [], c: null, f: n.f || null, p: 0, a: 0,
                                  d: n.deleted ? 1 : 0, ca: Date.parse(man.at) || 0, updated_at: Date.parse(man.at) || 0, sz: 0 };
          var l = loc[n.id], bt = +b.updated_at || 0;
          if (!l) {
            if (tomb[n.id] > bt) { P.gone++; return; }
            P.add++; P.notes.push(b);
          } else if (bt > (+l.updated_at || 0) && n.id !== open) { P.newer++; P.notes.push(b); }
          else P.keep++;
        });
        var lf = {};
        H.foldersRead().forEach(function (f) { if (f && f.id) lf[f.id] = f; });
        arr(jsonOf(ls.notes_folders, [])).forEach(function (f) {
          if (!f || !f.id) return;
          if (!lf[f.id] || (+f.updated_at || 0) > (+lf[f.id].updated_at || 0)) P.folders.push(f);
        });
        var skip = /^(notes_index|notes_folders)$|^__tomb_/;
        Object.keys(ls).forEach(function (k) {
          if (skip.test(k) || SKIP_LS.test(k) || !KEEP_LS.test(k)) return;
          var has = null;
          try { has = localStorage.getItem(k); } catch (e) {}
          if (has == null) P.keys.push(k);
        });
        var PD = window.GardenPdfDoc, St = window.GardenNotesStore, Ink = window.GardenPdfInk;
        var inkP = (man.ink && Ink && Ink.inkRestore && Ink.inkRows && ents[root + 'data/pdf-ink.json'])
          ? Promise.all([txt('data/pdf-ink.json'), Ink.inkRows()]).then(function (q) {
              var have = {};
              arr(q[1]).forEach(function (x) { if (x && x.k) have[x.k] = 1; });
              P.inkRows = arr(jsonOf(q[0], [])).filter(function (x) { return x && x.k && x.v && !have[x.k]; });
              P.ink = P.inkRows.length;
            }, function () {})
          : Promise.resolve();
        var haveImg = St && St.allImages ? St.allImages().then(function (rows) { var m = {}; rows.forEach(function (x) { if (x && x.id) m[x.id] = 1; }); return m; }, function () { return {}; }) : Promise.resolve({});
        return inkP.then(function () { return haveImg; }).then(function (hi) {
          arr(man.images).forEach(function (x) { if (x && x.id && !hi[x.id] && ents[root + x.path]) { P.images.push(x); P.bytes += x.bytes || 0; } });
          return arr(man.files).reduce(function (c, x) {
            return c.then(function () {
              if (!x || !x.hash || !ents[root + x.path]) return;
              return Promise.resolve(PD && PD.has ? PD.has(x.hash) : false).then(function (h) {
                if (!h) { P.files.push(x); P.bytes += x.bytes || 0; }
              }, function () {});
            });
          }, Promise.resolve());
        }).then(function () { return P; });
      });
    });
  }

  function apply(P, H, onStep) {
    var step = function (k, i, n) { if (onStep) { try { onStep(k, i, n); } catch (e) {} } };
    var PD = window.GardenPdfDoc, St = window.GardenNotesStore, Ink = window.GardenPdfInk;
    var got = { notes: 0, files: 0, images: 0, ink: 0, keys: 0, folders: 0, bad: 0 };
    var blob = function (p, type) { var e = P.ents[P.root + p]; return e ? entryBlob(P.file, e, type) : Promise.reject(new Error('bad_entry')); };
    P.folders.forEach(function (f) { H.folderPut(f); got.folders++; });
    var chain = P.notes.reduce(function (c, rec, i) {
      return c.then(function () {
        step('notes', i + 1, P.notes.length);
        return blob('data/notes/' + rec.id + '.json').then(function (b) { return b.text(); }).then(function (raw) {
          if (!jsonOf(raw, null)) throw new Error('bad_note');
          return H.restoreNote(rec, raw);
        }).then(function () { got.notes++; }, function () { got.bad++; });
      });
    }, Promise.resolve());
    chain = chain.then(function () {
      return P.files.reduce(function (c, x, i) {
        return c.then(function () {
          step('files', i + 1, P.files.length);
          return blob(x.path, x.kind === 'audio' ? 'audio/webm' : 'application/pdf').then(function (b) {
            return PD.put(x.hash, b, { name: x.name || '' });
          }).then(function (ok) { if (ok) got.files++; else got.bad++; }, function () { got.bad++; });
        });
      }, Promise.resolve());
    });
    chain = chain.then(function () {
      return P.images.reduce(function (c, x, i) {
        return c.then(function () {
          step('images', i + 1, P.images.length);
          return blob(x.path, x.type || 'image/png').then(function (b) {
            return St.putImageRow({ id: x.id, blob: b, type: x.type, name: x.name || '' });
          }).then(function () { got.images++; }, function () { got.bad++; });
        });
      }, Promise.resolve());
    });
    chain = chain.then(function () {
      if (!P.ink || !P.inkRows || !Ink || !Ink.inkRestore) return;
      step('ink', 1, 1);
      return Ink.inkRestore(P.inkRows).then(function (n) { got.ink = n || 0; }, function () { got.bad++; });
    });
    return chain.then(function () {
      P.keys.forEach(function (k) {
        try { if (localStorage.getItem(k) == null) { localStorage.setItem(k, P.ls[k]); got.keys++; } } catch (e) {}
      });
      step('done', 1, 1);
      if (H.done) { try { H.done(got); } catch (e) {} }
      return got;
    });
  }

  window.GardenNotesBackup = { build: build, save: save, Zip: Zip, crc: crcOf, readZip: readZip, entryBlob: entryBlob, plan: plan, apply: apply };
})();
