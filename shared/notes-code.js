;(function () {
  'use strict';

  var KW = {
    java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record sealed permits yield true false null',
    python: 'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None self match case',
    js: 'await break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return static super switch this throw try typeof var void while with yield async of true false null undefined',
    c: 'auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false NULL include define ifdef ifndef endif pragma',
    sql: 'select from where insert update delete create table drop alter add primary key foreign references join inner left right outer on group by order having limit offset union all as and or not null distinct count sum avg min max between like in values set index view default constraint unique check cascade',
    css: 'important media supports keyframes import charset font-face from to and not only screen print',
    html: ''
  };

  var ALIAS = {
    'javascript': 'js', 'jsx': 'js', 'ts': 'js', 'typescript': 'js', 'node': 'js',
    'py': 'python', 'python3': 'python',
    'c++': 'c', 'cpp': 'c', 'cs': 'c', 'csharp': 'c', 'c#': 'c', 'go': 'c', 'rust': 'c',
    'mysql': 'sql', 'postgres': 'sql', 'sqlite': 'sql',
    'scss': 'css', 'less': 'css',
    'xml': 'html', 'svg': 'html'
  };

  function norm(lang) {
    var l = String(lang || '').trim().toLowerCase();
    if (ALIAS[l]) l = ALIAS[l];
    return KW.hasOwnProperty(l) ? l : '';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function kwSet(lang) {
    var m = {}, parts = (KW[lang] || '').split(' ');
    for (var i = 0; i < parts.length; i++) if (parts[i]) m[parts[i]] = 1;
    return m;
  }

  var CACHE = {};
  function keywords(lang) {
    if (!CACHE[lang]) CACHE[lang] = kwSet(lang);
    return CACHE[lang];
  }

  /*@3.NOCJ2.1*/
  function tokenize(src, lang) {
    var s = String(src == null ? '' : src);
    var kw = keywords(lang);
    var out = '';
    var i = 0, n = s.length;
    var lineComment = (lang === 'python' || lang === 'sql') ? (lang === 'sql' ? '--' : '#') : '//';
    var blockOpen = (lang === 'python') ? null : '/*';
    var blockClose = '*/';

    function push(cls, txt) {
      out += cls ? ('<span class="cd-' + cls + '">' + esc(txt) + '</span>') : esc(txt);
    }

    /*@3.NOCJ2.4*/
    var last = -1;
    while (i < n) {
      if (i === last) { push('', s.charAt(i)); i++; continue; }
      last = i;
      var ch = s.charAt(i);

      if (lineComment && s.substr(i, lineComment.length) === lineComment) {
        var e = s.indexOf('\n', i);
        if (e < 0) e = n;
        push('cm', s.slice(i, e));
        i = e;
        continue;
      }

      if (blockOpen && s.substr(i, 2) === blockOpen) {
        var be = s.indexOf(blockClose, i + 2);
        be = be < 0 ? n : be + 2;
        push('cm', s.slice(i, be));
        i = be;
        continue;
      }

      if (lang === 'python' && (s.substr(i, 3) === '"""' || s.substr(i, 3) === "'''")) {
        var q3 = s.substr(i, 3);
        var te = s.indexOf(q3, i + 3);
        te = te < 0 ? n : te + 3;
        push('st', s.slice(i, te));
        i = te;
        continue;
      }

      if (ch === '"' || ch === "'" || ch === '`') {
        var j = i + 1;
        while (j < n) {
          if (s.charAt(j) === '\\') { j += 2; continue; }
          if (s.charAt(j) === ch) { j++; break; }
          if (s.charAt(j) === '\n' && ch !== '`') { break; }
          j++;
        }
        push('st', s.slice(i, j));
        i = j;
        continue;
      }

      if (/[0-9]/.test(ch) && !/[A-Za-z_$]/.test(s.charAt(i - 1) || ' ')) {
        var k = i;
        while (k < n && /[0-9a-fA-FxXbBoO._]/.test(s.charAt(k))) k++;
        push('nu', s.slice(i, k));
        i = k;
        continue;
      }

      if (/[A-Za-z_$@#]/.test(ch)) {
        var w = i;
        /*@3.NOCJ2.3*/
        if (ch === '@') w++;
        while (w < n && /[A-Za-z0-9_$#]/.test(s.charAt(w))) w++;
        var word = s.slice(i, w);
        var bare = word.charAt(0) === '@' ? word.slice(1) : word;
        var low = (lang === 'sql') ? bare.toLowerCase() : bare;
        if (kw[low] || kw[bare]) push('kw', word);
        else if (s.charAt(w) === '(') push('fn', word);
        else if (/^[A-Z]/.test(word) && lang !== 'sql') push('ty', word);
        else push('', word);
        i = w;
        continue;
      }

      if (/[+\-*/%=<>!&|^~?:]/.test(ch)) {
        var o = i;
        while (o < n && /[+\-*/%=<>!&|^~?:]/.test(s.charAt(o))) o++;
        push('op', s.slice(i, o));
        i = o;
        continue;
      }

      if (/[{}()[\];,.]/.test(ch)) { push('pn', ch); i++; continue; }

      push('', ch);
      i++;
    }
    return out;
  }

  /*@3.NOCJ2.2*/
  function paint(host, src, lang) {
    if (!host) return false;
    var l = norm(lang);
    if (!l) { host.textContent = String(src == null ? '' : src); return false; }
    host.innerHTML = tokenize(src, l);
    return true;
  }

  function languages() {
    return Object.keys(KW).filter(function (k) { return k !== 'html'; });
  }

  window.GardenNotesCode = {
    paint: paint,
    tokenize: tokenize,
    norm: norm,
    languages: languages,
    ALIAS: ALIAS
  };
})();
