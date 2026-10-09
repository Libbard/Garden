(function () {
  'use strict';
  if (window.GardenPaintGL) return;

  var SPECTRA = "const float SW[38] = float[38](1.00116,1.00116,1.00116,1.00116,1.00115,1.00113,1.00109,1.001,1.00087,1.0007,1.0005,1.00031,1.00012,0.999953,0.999822,0.999739,0.99971,0.999732,0.999799,0.9999,1.00002,1.00014,1.00026,1.00036,1.00043,1.00048,1.00051,1.00053,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054); const float SC[38] = float[38](0.970585,0.970592,0.970625,0.970787,0.971369,0.973163,0.97674,0.981588,0.98628,0.989949,0.992493,0.994146,0.995184,0.995757,0.995913,0.995606,0.994598,0.992216,0.986236,0.967943,0.891285,0.536202,0.154108,0.0574575,0.031535,0.0222634,0.0182023,0.0162991,0.0153656,0.0149112,0.0146954,0.0145964,0.014547,0.0145229,0.014512,0.0145067,0.0145045,0.0145038); const float SM[38] = float[38](0.990674,0.990672,0.990663,0.990618,0.990451,0.989871,0.988287,0.984291,0.973935,0.941818,0.81739,0.432473,0.138454,0.0537347,0.0292175,0.0213137,0.020135,0.0241323,0.0372236,0.0760507,0.205375,0.541269,0.815842,0.912818,0.94634,0.959928,0.966261,0.969326,0.970855,0.971605,0.971963,0.972127,0.972209,0.97225,0.972268,0.972277,0.97228,0.972281); const float SY[38] = float[38](0.0210523,0.0210565,0.0210746,0.0211649,0.0215028,0.0226739,0.0258236,0.0334879,0.051907,0.100749,0.23913,0.534804,0.797808,0.91145,0.953798,0.971242,0.979303,0.98338,0.985461,0.986435,0.986738,0.986618,0.986278,0.985861,0.985475,0.985177,0.984972,0.984846,0.984775,0.984738,0.98472,0.984711,0.984707,0.984705,0.984704,0.984703,0.984703,0.984703); const float SR[38] = float[38](0.0315606,0.0315521,0.0315148,0.0313318,0.030673,0.028648,0.024645,0.0192961,0.0142067,0.0102943,0.00761915,0.00589804,0.00482332,0.00422987,0.00405992,0.00435337,0.00534344,0.00769172,0.013597,0.0316975,0.107861,0.463813,0.847055,0.943185,0.968862,0.978031,0.982044,0.983924,0.984845,0.985294,0.985507,0.985605,0.985654,0.985678,0.985688,0.985694,0.985696,0.985697); const float SG[38] = float[38](0.00955607,0.00955816,0.00956732,0.00961291,0.00978371,0.0103786,0.0120026,0.0160978,0.0267062,0.0595555,0.18604,0.57058,0.861468,0.945879,0.970465,0.978414,0.979589,0.975534,0.962289,0.923122,0.793434,0.45927,0.185574,0.0881775,0.054363,0.0406288,0.0342215,0.0311186,0.0295709,0.0288109,0.0284486,0.028282,0.0281988,0.0281582,0.0281399,0.0281309,0.0281271,0.028126); const float SB[38] = float[38](0.979405,0.979401,0.979383,0.979294,0.978963,0.977814,0.974724,0.967198,0.94908,0.90085,0.76315,0.465922,0.201263,0.0877524,0.0457177,0.0284706,0.0205272,0.0165303,0.0145135,0.0136004,0.0133604,0.0135489,0.0139594,0.0144434,0.0148854,0.0152254,0.0154593,0.0156018,0.0156825,0.0157249,0.0157458,0.0157556,0.0157605,0.015763,0.0157641,0.0157646,0.0157648,0.0157649); const float CX[38] = float[38](6.4692e-05,0.00021941,0.00112057,0.00376661,0.0118806,0.0232864,0.0345594,0.0372238,0.0324184,0.0212332,0.010491,0.00329584,0.000507035,0.000948674,0.00627372,0.0168646,0.0286896,0.0426748,0.0562547,0.0694704,0.0830532,0.0861261,0.0904661,0.0850039,0.0709067,0.0506289,0.035474,0.0214682,0.0125165,0.00680458,0.00346457,0.00149761,0.0007697,0.000407368,0.00016901,9.52245e-05,4.9031e-05,1.99961e-05); const float CY[38] = float[38](1.84429e-06,6.20532e-06,3.10096e-05,0.000104748,0.000353641,0.000951471,0.00228226,0.00420733,0.0066888,0.0098884,0.0152495,0.0214183,0.0334229,0.05131,0.0704021,0.0878387,0.0942491,0.0979567,0.0941522,0.086781,0.0788565,0.0635267,0.0537414,0.0426461,0.0316173,0.0208852,0.0138601,0.00810264,0.0046301,0.00249138,0.0012593,0.000541647,0.000277953,0.000147108,6.10327e-05,3.43873e-05,1.7706e-05,7.22097e-06); const float CZ[38] = float[38](0.000305017,0.00103681,0.00531314,0.0179544,0.0570776,0.113652,0.173359,0.196207,0.186082,0.13995,0.0891745,0.0478962,0.0281456,0.0161377,0.0077591,0.00429615,0.00200551,0.000861471,0.000369039,0.000191429,0.000149556,9.23109e-05,6.81349e-05,2.88264e-05,1.57672e-05,3.9406e-06,1.58401e-06,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0);";

  var SPEC = (function () {
    var t = {}; SPECTRA.replace(/(\w+)\[38\] = float\[38\]\(([^)]*)\)/g, function (_, k, v) { t[k] = v.split(',').map(Number); });
    var a = new Float32Array(456);
    for (var i = 0; i < 38; i++) {
      a.set([t.SW[i], t.SC[i], t.SM[i], t.SY[i], t.SR[i], t.SG[i], t.SB[i], 0], i * 8);
      a.set([t.CX[i], t.CY[i], t.CZ[i], 0], 304 + i * 4);
    }
    return a;
  })();

  var COMMON = [
    '#version 300 es',
    'precision highp float;',
    'precision highp int;',
    'precision highp sampler2D;',
    'float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
    'float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);',
    '  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }',
    'float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 17.1; a *= .5; } return s; }',
    'float worley(vec2 p){ vec2 i = floor(p), f = fract(p); float d = 8.;',
    '  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){ vec2 g = vec2(x, y); vec2 o = vec2(hash12(i+g), hash12(i+g+19.7)); d = min(d, length(g + o - f)); } return d; }',
    'float s2l(float c){ return c <= .04045 ? c / 12.92 : pow((c + .055) / 1.055, 2.4); }',
    'float l2s(float c){ return c <= .0031308 ? c * 12.92 : 1.055 * pow(c, 1. / 2.4) - .055; }',
    'vec3 toLin(vec3 c){ c = clamp(c, 0., 1.); return vec3(s2l(c.r), s2l(c.g), s2l(c.b)); }',
    'vec3 toSrgb(vec3 c){ c = clamp(c, 0., 1.); return vec3(l2s(c.r), l2s(c.g), l2s(c.b)); }',
    'uniform vec4 uSpec[114];',
    'void specW(vec3 l, out vec4 A, out vec3 B){',
    '  float w = min(l.r, min(l.g, l.b)); l -= w;',
    '  A = vec4(w, min(l.g, l.b), min(l.r, l.b), min(l.r, l.g));',
    '  B = vec3(max(0., min(l.r - l.b, l.r - l.g)), max(0., min(l.g - l.b, l.g - l.r)), max(0., min(l.b - l.g, l.b - l.r))); }',
    'float specRw(vec4 A, vec3 B, int i){ vec4 s = uSpec[2*i], t = uSpec[2*i+1]; return max(1e-4, A.x*s.x + A.y*s.y + A.z*s.z + A.w*s.w + B.x*t.x + B.y*t.y + B.z*t.z); }',
    'float lumY(vec3 l){ return dot(l, vec3(.2126, .7152, .0722)); }',
    'const mat3 XYZ2RGB = mat3(3.2409699, -0.9692436, 0.0556301, -1.5373832, 1.8759675, -0.2039770, -0.4986108, 0.0415551, 1.0569715);',
    'vec3 kmMix(vec3 a, vec3 b, float t){',
    '  t = clamp(t, 0., 1.); if (t < .002) return a; if (t > .998) return b;',
    '  vec3 la = toLin(a), lb = toLin(b); vec4 Aa, Ab; vec3 Ba, Bb; specW(la, Aa, Ba); specW(lb, Ab, Bb);',
    '  float ca = (1.-t)*(1.-t) * max(lumY(la), .01), cb = t*t * max(lumY(lb), .01), cs = ca + cb;',
    '  vec3 xyz = vec3(0.);',
    '  for (int i = 0; i < 38; i++){',
    '    float ra = specRw(Aa, Ba, i), rb = specRw(Ab, Bb, i);',
    '    float ka = (1.-ra)*(1.-ra)/(2.*ra), kb = (1.-rb)*(1.-rb)/(2.*rb);',
    '    float ks = (ka*ca + kb*cb) / cs;',
    '    float R = 1. + ks - sqrt(ks*ks + 2.*ks);',
    '    xyz += uSpec[76+i].xyz * R; }',
    '  return toSrgb(XYZ2RGB * xyz); }',
    'vec3 glaze(vec3 base, vec3 pig, float amt){',
    '  amt = max(0., amt); if (amt < .0005) return base;',
    '  vec3 lb = toLin(base), lp = toLin(pig); vec3 xyz = vec3(0.); vec4 Ab, Ap; vec3 Bb, Bp; specW(lb, Ab, Bb); specW(lp, Ap, Bp);',
    '  for (int i = 0; i < 38; i++){ float R = specRw(Ab, Bb, i) * pow(specRw(Ap, Bp, i), amt); xyz += uSpec[76+i].xyz * R; }',
    '  return toSrgb(XYZ2RGB * xyz); }',
    'vec3 cover(vec3 base, vec3 c, float t){ t = clamp(t, 0., 1.); return mix(kmMix(base, c, t), c, t * t); }',
    'vec3 lighten(vec3 base, float amt){ return toSrgb(mix(toLin(base), vec3(1.), clamp(amt, 0., 1.))); }',
    'mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }',
    'float chord(vec2 p, vec2 a, vec2 b, float r){',
    '  vec2 ab = b - a; float L = length(ab); if (L < 1e-3 || r <= 0.) return 0.;',
    '  vec2 d = ab / L; vec2 ap = p - a; float t = dot(ap, d); float h2 = r*r - (dot(ap, ap) - t*t);',
    '  if (h2 <= 0.) return 0.; float h = sqrt(h2);',
    '  return max(0., min(L, t + h) - max(0., t - h)); }',
    'float rectExp(vec2 p, vec2 a, vec2 b, vec2 hs){',
    '  vec2 d = b - a; vec2 q = p - a; float lo = 0., hi = 1.;',
    '  for (int k = 0; k < 2; k++){ float dk = k == 0 ? d.x : d.y, qk = k == 0 ? q.x : q.y, h = k == 0 ? hs.x : hs.y;',
    '    if (abs(dk) < 1e-4){ if (abs(qk) > h) return 0.; }',
    '    else { float t0 = (qk - h) / dk, t1 = (qk + h) / dk; lo = max(lo, min(t0, t1)); hi = min(hi, max(t0, t1)); } }',
    '  return max(0., hi - lo) * length(d); }'
  ].join('\n');

  var VS = '#version 300 es\nin vec2 aP; void main(){ gl_Position = vec4(aP * 2. - 1., 0., 1.); }';

  var FS_PAPER = COMMON + '\nuniform int uKind; uniform float uScale; uniform vec2 uOff; out vec4 o;\n' +
    'float fibers(vec2 p){ float f = 0.; for (int k = 0; k < 3; k++){ float a = hash12(vec2(float(k), 7.)) * 6.283; vec2 q = rot(a) * p; f += vnoise(vec2(q.x * .18, q.y * 1.7) + float(k) * 31.); } return f / 3.; }\n' +
    'void main(){ vec2 p = (gl_FragCoord.xy + uOff) / uScale; float h;\n' +
    '  float fine = vnoise(p * .42) * .5 + vnoise(p * .85 + 11.) * .32 + vnoise(p * 1.7 + 5.) * .18;\n' +
    '  float fib = fibers(p * .5);\n' +
    '  if (uKind == 0){ h = .55 + .45 * (fine - .5) + .25 * (fib - .5) + .15 * (fbm(p * .06) - .5); }\n' +
    '  else if (uKind == 1){ h = .5 + 1.15 * (fine - .5) + .45 * (fib - .5) + .2 * (fbm(p * .07) - .5); }\n' +
    '  else if (uKind == 2){ float w = worley(p * .085); float w2 = worley(p * .21 + 3.1); h = .78 - .5 * w - .22 * w2 + .28 * (fine - .5) + .2 * (fib - .5) + .15 * (fbm(p * .05) - .5); }\n' +
    '  else { vec2 q = p * .3; float wx = .5 + .5 * sin(q.x * 3.14159) * (.8 + .2 * vnoise(q * .7)); float wy = .5 + .5 * sin(q.y * 3.14159 + 1.57) * (.8 + .2 * vnoise(q.yx * .7 + 9.));\n' +
    '    float over = step(.5, fract(floor(q.x) * .5 + floor(q.y) * .5)); h = mix(wx, wy, over) * .72 + .2 * fine + .08 * fib; }\n' +
    '  o = vec4(clamp(h, 0., 1.), 0., 0., 1.); }';

  var DAB_HEAD = COMMON + '\n' +
    'uniform sampler2D uPig, uAux, uExp, uPaper, uMask; uniform vec2 uOff, uSize; uniform vec4 uMaskRect; uniform float uUseMask;\n' +
    'layout(location=0) out vec4 oPig; layout(location=1) out vec4 oAux; layout(location=2) out vec4 oExp;\n' +
    'float maskAt(vec2 p){ if (uUseMask < .5) return 1.; vec2 mp = (p - uMaskRect.xy) / uMaskRect.zw; return (mp.x < 0. || mp.y < 0. || mp.x > 1. || mp.y > 1.) ? 0. : texture(uMask, mp).r; }\n';

  var FS_DAB = DAB_HEAD +
    'uniform vec4 uSeg[12], uRP[12], uTA[12], uBox[12]; uniform int uN; uniform float uNib, uLoad, uGrade, uK, uFlow, uQ; uniform vec3 uColor; uniform int uTool;\n' +
    'float cov(float e){ return 1. - exp(-uK * e); }\n' +
    'vec3 glazeU(vec3 base, float amt){\n' +
    '  amt = max(0., amt); if (amt < .0005) return base;\n' +
    '  vec3 lb = toLin(base); vec3 xyz = vec3(0.); vec4 Ab; vec3 Bb; specW(lb, Ab, Bb);\n' +
    '  for (int i = 0; i < 38; i++){ vec4 c = uSpec[76+i]; xyz += c.xyz * (specRw(Ab, Bb, i) * exp2(amt * c.w)); }\n' +
    '  return toSrgb(XYZ2RGB * xyz); }\n' +
    'vec3 kmMixU(vec3 a, float t){\n' +
    '  t = clamp(t, 0., 1.); if (t < .002) return a; if (t > .998) return uColor;\n' +
    '  vec3 la = toLin(a), lb = toLin(uColor); vec4 Aa; vec3 Ba; specW(la, Aa, Ba);\n' +
    '  float ca = (1.-t)*(1.-t) * max(lumY(la), .01), cb = t*t * max(lumY(lb), .01), cs = ca + cb;\n' +
    '  vec3 xyz = vec3(0.);\n' +
    '  for (int i = 0; i < 38; i++){\n' +
    '    float ra = specRw(Aa, Ba, i), rb = uSpec[2*i+1].w;\n' +
    '    float ka = (1.-ra)*(1.-ra)/(2.*ra), kb = (1.-rb)*(1.-rb)/(2.*rb);\n' +
    '    float ks = (ka*ca + kb*cb) / cs;\n' +
    '    float R = 1. + ks - sqrt(ks*ks + 2.*ks);\n' +
    '    xyz += uSpec[76+i].xyz * R; }\n' +
    '  return toSrgb(XYZ2RGB * xyz); }\n' +
    'vec3 coverU(vec3 base, float t){ t = clamp(t, 0., 1.); return mix(kmMixU(base, t), uColor, t * t); }\n' +
    'void seg(vec2 p, float H, float m, vec4 SG, vec4 RP, vec4 TA, inout vec4 pig, inout vec4 aux, inout vec4 ex){\n' +
    '  float uTz = TA.x, uAz = TA.y, uDwell = TA.z, uSeed = TA.w;\n' +
    '  vec2 a = SG.xy, b = SG.zw; vec2 ab = b - a; float L = length(ab); vec2 dir = L > .01 ? ab / L : vec2(cos(uAz), sin(uAz));\n' +
    '  float t = L > .01 ? clamp(dot(p - a, ab) / (L*L), 0., 1.) : 0.;\n' +
    '  float r = mix(RP.x, RP.y, t), pr = mix(RP.z, RP.w, t);\n' +
    '  float elong = (uTool <= 1) ? 1. + 2.4 * uTz : (uTool == 2 || uTool == 9) ? 1. + 1.5 * uTz : 1.;\n' +
    '  mat2 R = rot(-uAz); vec2 sc = vec2(1. / elong, 1.);\n' +
    '  vec2 P = (R * (p - a)) * sc, B = (R * (b - a)) * sc;\n' +
    '  float e, d0 = length(P);\n' +
    '  if (uTool == 6){ mat2 N = rot(-uNib); vec2 hs = vec2(r, max(.7, r * .28)); vec2 Pn = N * (p - a), Bn = N * ab;\n' +
    '    float er = (rectExp(Pn, vec2(0.), Bn, hs * .94 + .5) + rectExp(Pn, vec2(0.), Bn, max(hs * .94 - .5, vec2(.2)))) * .5;\n' +
    '    vec2 ks = vec2(1., hs.x / hs.y); float ee = (chord(Pn * ks, vec2(0.), Bn * ks, hs.x * 1.12 + .5) + chord(Pn * ks, vec2(0.), Bn * ks, max(.3, hs.x * 1.12 - .5))) * .5 / ks.y;\n' +
    '    e = (er + ee) * .5 / (2. * hs.y);\n' +
    '    vec2 lo = abs(Pn) - hs; e += uDwell * clamp(.5 - max(lo.x, lo.y), 0., 1.); }\n' +
    '  else if (uTool == 10){ e = 0.; float wsum = 0.;\n' +
    '    for (int k = 0; k < 8; k++){ float f = .14 + .13 * float(k) + .03 * (hash12(p + float(k)) - .5), w = exp(-f * f * 2.6); e += w * chord(P, vec2(0.), B, r * f) / (2. * r); e += w * uDwell * .25 * smoothstep(r * f + 1., r * f - 1., d0); wsum += w * f; } e /= wsum; }\n' +
    '  else { e = (chord(P, vec2(0.), B, r + .55) + chord(P, vec2(0.), B, max(.3, r - .55))) * .5 / (2. * r);\n' +
    '    e += uDwell * clamp(r + .5 - d0, 0., 1.); }\n' +
    '  if (e <= 0. && uTool != 2) return;\n' +
    '  float e0 = ex.r, e1 = e0 + e * m; float dc = cov(e1) - cov(e0); vec4 exN = vec4(e1, cov(e1), ex.b, 1.);\n' +
    '  vec3 col = pig.rgb; vec2 nrm = vec2(-dir.y, dir.x); float along = dot(p, dir), across = dot(p, nrm);\n' +
    '  if (uTool == 0 || uTool == 1){\n' +
    '    float surf = H + aux.r * .45 + (vnoise(p * .8 + uSeed) - .5) * .07;\n' +
    '    float depth = (uTool == 0 ? .26 + .66 * pow(pr, .9) : .24 + .64 * pow(pr, .85)) * (1. - .3 * uTz);\n' +
    '    float bl = clamp(dot(P, B) / max(dot(B, B), 1e-4), 0., 1.); float dn = min(1., length(P - B * bl) / r);\n' +
    '    float prof = 1. - dn * dn;\n' +
    '    float th = 1. - depth * mix(1., prof, .42); float contact = smoothstep(th - .07, th + .08, surf);\n' +
    '    float core = .88 + .12 * vnoise(vec2(along * .025, across * 1.1) + uSeed * 3.);\n' +
    '    float amt = dc * contact * core * (.45 + .55 * pr) * (.7 + .3 * prof);\n' +
    '    if (uTool == 0){\n' +
    '      float dark = 1. - lumY(toLin(col)); float room = max(0., uGrade - dark);\n' +
    '      float g = min(amt * 1.6, room * 1.4 + .002);\n' +
    '      col = glazeU(col, g * 2.4); aux.a = min(1., aux.a + g * (.5 + .5 * uGrade)); aux.r = min(1., aux.r + amt * .03 * pr);\n' +
    '    } else {\n' +
    '      col = glazeU(col, amt * 1.25); col = kmMixU(col, amt * .1);\n' +
    '      aux.r = min(.85, aux.r + amt * .06 * pr * pr); aux.a = min(.35, aux.a + amt * .03);\n' +
    '    }\n' +
    '  } else if (uTool == 9){\n' +
    '    float surf = H + aux.r * .25 + (vnoise(p * .45 + uSeed) - .5) * .18;\n' +
    '    float th = 1. - (.12 + .62 * pr) * (1. - .3 * uTz); float contact = smoothstep(th - .05, th + .06, surf);\n' +
    '    float amt = dc * contact * (.5 + .5 * pr);\n' +
    '    col = coverU(col, min(1., amt * 1.5)); col = glazeU(col, amt * .45);\n' +
    '    aux.r = min(1., aux.r + amt * .3); aux.g = min(.35, aux.g + amt * .04); aux.a = min(.45, aux.a + amt * .12); pig.a = min(.6, pig.a + amt * .25);\n' +
    '  } else if (uTool == 2){\n' +
    '    float surf = H * .7 + vnoise(p * .32 + uSeed * .3) * .2 + vnoise(p * 1.1) * .1 - aux.r * .15;\n' +
    '    float th = 1. - (.25 + .65 * pr) * (1. - .35 * uTz); float contact = smoothstep(th - .06, th + .06, surf);\n' +
    '    float dust = step(.982, hash12(floor(p * .8) + floor(uSeed * 10.))) * smoothstep(r * 1.6, r * .95, d0) * m;\n' +
    '    float amt = clamp(dc * contact * (.65 + .35 * pr) * 1.25 + dust * .3 * dc, 0., 1.);\n' +
    '    if (amt <= 0.){ ex = exN; return; }\n' +
    '    col = coverU(col, min(1., amt * 1.7));\n' +
    '    aux.r = min(1., aux.r + amt * .1); aux.b = min(1., aux.b + amt * .55); pig.a = min(1., pig.a + amt * .7); aux.a *= 1. - amt * .6;\n' +
    '  } else if (uTool == 3){\n' +
    '    float u = dot(p - (a + ab * t), nrm) / max(r, .5);\n' +
    '    float br = .55 + .45 * vnoise(vec2(u * 9. + uSeed * 3.1, along * .012));\n' +
    '    br *= .8 + .2 * vnoise(vec2(u * 31. + uSeed, 0.));\n' +
    '    float dry = 1. - smoothstep(.12, .5, uLoad);\n' +
    '    float catchTop = mix(1., smoothstep(.4, .75, H + aux.g * .6), dry);\n' +
    '    float amt = dc * br * catchTop * (.6 + .4 * pr) * (.4 + .6 * uLoad);\n' +
    '    vec2 up = clamp(p - dir * r * .45, vec2(0.), uSize - 1.); vec4 upPig = texelFetch(uPig, ivec2(up), 0); vec4 upAux = texelFetch(uAux, ivec2(up), 0);\n' +
    '    float wet = aux.b; vec3 drag = kmMix(col, upPig.rgb, min(1., dc * 2.) * .5 * wet * (1. - ex.g));\n' +
    '    col = coverU(drag, min(1., amt * 4.));\n' +
    '    aux.g = clamp(mix(aux.g, upAux.g, dc * .4 * wet) + amt * .3 * uLoad * br, 0., 1.);\n' +
    '    aux.b = min(1., aux.b + amt * 2.); pig.a = min(1., pig.a + amt * 2.); aux.a *= 1. - amt;\n' +
    '  } else if (uTool == 6){\n' +
    '    float fib = (.93 + .07 * vnoise(p * .55 + uSeed)) * (.88 + .12 * vnoise(vec2(along * .012, across * .25) + uSeed * 2.)) * (.94 + .06 * fbm(p * .04));\n' +
    '    float amt = dc * fib * (.78 + .22 * pr) * uFlow;\n' +
    '    col = glazeU(col, amt * 1.05); exN.b = ex.b + amt;\n' +
    '  } else if (uTool == 7){\n' +
    '    float contact = smoothstep(.04, .2, H + .25 + pr * .3);\n' +
    '    float amt = dc * contact;\n' +
    '    col = glazeU(col, amt * 3.2); col = kmMixU(col, amt * .35); aux.a = min(.3, aux.a + amt * .05);\n' +
    '  } else if (uTool == 8){\n' +
    '    float amt = dc * (.85 + .15 * pr);\n' +
    '    col = coverU(col, min(1., amt * 2.2)); pig.a = min(1., pig.a + amt * .7); aux.a = min(.6, aux.a + amt * .35); aux.g = min(.2, aux.g + amt * .05);\n' +
    '  } else if (uTool == 10){\n' +
    '    float spk = .55 + .45 * step(.35, hash12(floor(p) + floor(uSeed * 977.)));\n' +
    '    float amt = dc * spk * (.25 + .75 * pr) * uFlow;\n' +
    '    col = glazeU(col, amt * .9); col = kmMixU(col, amt * .08);\n' +
    '  } else if (uTool == 4){\n' +
    '    float hold = .55 + .45 * (1. - aux.r);\n' +
    '    float lift = min(1., dc * (.55 + .45 * pr) * hold * (.85 + .15 * smoothstep(.3, .7, H)) * 1.4);\n' +
    '    col = lighten(col, lift); pig.a *= 1. - lift; aux = mix(aux, vec4(aux.r * .7, 0., 0., 0.), lift);\n' +
    '  } else if (uTool == 5){\n' +
    '    float k = min(1., dc * 1.6) * (.45 + .55 * pr);\n' +
    '    vec3 acc = vec3(0.); float n = 0.;\n' +
    '    for (int j = 0; j < 8; j++){ float an = float(j) * .785 + uSeed; vec2 o = vec2(cos(an), sin(an)) * (1.5 + 1.5 * float(j & 1)); acc += texelFetch(uPig, ivec2(clamp(p + o, vec2(0.), uSize - 1.)), 0).rgb; n += 1.; }\n' +
    '    vec3 soft = acc / n;\n' +
    '    vec2 up = clamp(p - dir * r * .55, vec2(0.), uSize - 1.); vec4 upPig = texelFetch(uPig, ivec2(up), 0);\n' +
    '    float loose = .35 + .65 * aux.b;\n' +
    '    col = kmMix(col, soft, k * .55); col = kmMix(col, upPig.rgb, k * .5 * loose);\n' +
    '    aux.r = min(1., aux.r + k * .15); aux.b *= 1. - k * .25;\n' +
    '  }\n' +
    '  pig = vec4(col, pig.a); ex = exN; }\n' +
    'vec4 qz(vec4 v){ return uQ > .5 ? vec4(unpackHalf2x16(packHalf2x16(v.xy)), unpackHalf2x16(packHalf2x16(v.zw))) : floor(clamp(v, 0., 1.) * 255. + .5) / 255.; }\n' +
    'void main(){\n' +
    '  vec2 p = gl_FragCoord.xy + uOff; ivec2 ip = ivec2(p);\n' +
    '  vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0), ex = texelFetch(uExp, ip, 0); float H = texelFetch(uPaper, ip, 0).r;\n' +
    '  oPig = pig; oAux = aux; oExp = ex;\n' +
    '  float m = maskAt(p); if (m <= 0.) return;\n' +
    '  vec2 ix = floor(p);\n' +
    '  for (int i = 0; i < 12; i++){ if (i >= uN) break; vec4 Bx = uBox[i];\n' +
    '    if (ix.x < Bx.x || ix.y < Bx.y || ix.x >= Bx.x + Bx.z || ix.y >= Bx.y + Bx.w) continue;\n' +
    '    seg(p, H, m, uSeg[i], uRP[i], uTA[i], pig, aux, ex);\n' +
    '    if (i + 1 < uN){ pig = qz(pig); aux = qz(aux); ex = qz(ex); } }\n' +
    '  oPig = pig; oAux = aux; oExp = ex; }';

  var FS_RIM = DAB_HEAD +
    'uniform float uAmt; uniform vec3 uColor;\n' +
    'void main(){ vec2 p = gl_FragCoord.xy + uOff; ivec2 ip = ivec2(p);\n' +
    '  vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0), ex = texelFetch(uExp, ip, 0); oPig = pig; oAux = aux; oExp = ex;\n' +
    '  if (ex.g <= .01) return;\n' +
    '  float s = 0.; for (int j = 0; j < 12; j++){ float an = float(j) * .5236; vec2 o = vec2(cos(an), sin(an)); s += texelFetch(uExp, ivec2(clamp(p + o * 3., vec2(0.), uSize - 1.)), 0).g + texelFetch(uExp, ivec2(clamp(p + o * 6.5, vec2(0.), uSize - 1.)), 0).g; }\n' +
    '  s /= 24.; float rim = clamp((ex.g - s) * 2.6, 0., 1.); rim *= .75 + .5 * vnoise(p * .3);\n' +
    '  oPig = vec4(glaze(pig.rgb, uColor, rim * uAmt), pig.a); }';

  var FS_FILL = DAB_HEAD +
    'uniform vec3 uColor; uniform int uTool; uniform float uSeed, uShade, uAmt, uGrade, uUseRef, uDepth, uFinish; uniform vec3 uTint; uniform sampler2D uBlur, uRefT, uLineT, uOrd; uniform vec2 uLight, uWin; uniform float uPasses;\n' +
    'void refStep(vec2 p, float H, inout vec4 pig, inout vec4 aux, float seed, float depth, float fin){\n' +
    '  vec2 hd = rot(.785 + fract(seed * .137) * .5) * p; float hatch = .78 + .22 * vnoise(vec2(hd.x * .06, hd.y * 1.35) + seed);\n' +
    '  vec2 uv = p / uSize; vec3 C = toSrgb(min(vec3(1.), toLin(texture(uRefT, uv).rgb) / uTint));\n' +
    '  float a2 = uAmt; vec3 col0 = pig.rgb;\n' +
    '  if (uTool <= 1){ float contact = smoothstep(.3 - depth, .45 - depth, H + aux.r * .45 + (vnoise(p * .8 + seed) - .5) * .06); a2 *= contact * hatch; aux.r = min(.85, aux.r + a2 * .03); if (uTool == 0){ C = toSrgb(vec3(lumY(toLin(C)))); aux.a = min(1., aux.a + a2 * .4); } }\n' +
    '  else if (uTool == 9 || uTool == 2){ float contact = smoothstep(.3 - depth, .46 - depth, H * .75 + vnoise(p * (uTool == 2 ? .32 : .45) + seed) * .25); a2 *= contact * hatch; pig.a = min(1., pig.a + a2 * .4); aux.r = min(1., aux.r + a2 * .15); }\n' +
    '  else if (uTool == 6){ vec2 sd = rot(-.52) * p; a2 *= .92 + .08 * smoothstep(.3, .7, vnoise(vec2(sd.x * .004, sd.y * .09) + seed)); }\n' +
    '  else if (uTool == 3 || uTool == 8){ vec2 sd = rot(.3) * p; float br = .8 + .2 * vnoise(vec2(sd.x * .02, sd.y * .6) + seed); pig.a = min(1., pig.a + a2 * .8); if (uTool == 3){ aux.g = min(1., aux.g + a2 * .2 * br); aux.b = 1.; } }\n' +
    '  else if (uTool == 11){ float gran = 1.3 - H * .7 + (vnoise(p * .7 + seed) - .5) * .2; a2 *= mix(1., gran, .5) * (.9 + .1 * vnoise(p * .03 + seed)); }\n' +
    '  a2 = mix(a2, 1., fin);\n' +
    '  pig = vec4(toSrgb(mix(toLin(col0), toLin(C), clamp(a2, 0., 1.))), pig.a); }\n' +
    'void main(){ vec2 p = gl_FragCoord.xy + uOff; ivec2 ip = ivec2(p);\n' +
    '  vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0), ex = texelFetch(uExp, ip, 0); float H = texelFetch(uPaper, ip, 0).r;\n' +
    '  oPig = pig; oAux = aux; oExp = ex;\n' +
    '  float m = maskAt(p); if (m <= 0.) return;\n' +
    '  float sh = 1.;\n' +
    '  if (uShade > .5){ vec2 mp = (p - uMaskRect.xy) / uMaskRect.zw; vec2 lp = uLight / uMaskRect.zw;\n' +
    '    float in0 = texture(uBlur, mp).r, lit = texture(uBlur, mp + lp).r, dk = texture(uBlur, mp - lp).r;\n' +
    '    sh = clamp(.62 + .9 * (1. - in0) + 1.1 * (dk - lit), .35, 1.75); }\n' +
    '  vec2 hd = rot(.785 + fract(uSeed * .137) * .5) * p; float hatch = .78 + .22 * vnoise(vec2(hd.x * .06, hd.y * 1.35) + uSeed);\n' +
    '  if (uUseRef > .5){ if (texture(uLineT, p / uSize).r < .3) return;\n' +
    '    if (uUseRef > 1.5){ float o = texelFetch(uOrd, ip, 0).r; if (o < uWin.x || o >= uWin.y) return;\n' +
    '      for (int k = 0; k < 8; k++){ if (float(k) >= uPasses) break; refStep(p, H, pig, aux, float(k) * 7.31 + 1.7, .35 * float(k) / max(1., uPasses - 1.), 0.); } }\n' +
    '    else refStep(p, H, pig, aux, uSeed, uDepth, uFinish);\n' +
    '    oPig = pig; oAux = aux; return;\n' +
    '  }\n' +
    '  vec3 col = pig.rgb; float amt = m * uAmt;\n' +
    '  if (uTool == 0 || uTool == 1){\n' +
    '    float surf = H + aux.r * .45; float th = 1. - .62; float contact = smoothstep(th - .07, th + .09, surf);\n' +
    '    float a2 = amt * contact * hatch * .95 * sh;\n' +
    '    if (uTool == 0){ float dark = 1. - lumY(toLin(col)); float room = max(0., uGrade - dark); float g = min(a2 * 1.4, room * 1.4); col = glaze(col, vec3(.34, .34, .37), g * 2.4); aux.a = min(1., aux.a + g * .7); }\n' +
    '    else { col = glaze(col, uColor, a2 * 1.25); col = kmMix(col, uColor, a2 * .1); aux.r = min(.85, aux.r + a2 * .03); }\n' +
    '  } else if (uTool == 9 || uTool == 2){\n' +
    '    float surf = H * .75 + vnoise(p * (uTool == 2 ? .32 : .45) + uSeed) * .25; float contact = smoothstep(.36, .5, surf);\n' +
    '    float a2 = amt * contact * hatch * sh * .9;\n' +
    '    col = kmMix(col, uColor, a2 * (uTool == 2 ? .75 : .62)); if (uTool == 9) col = glaze(col, uColor, a2 * .45);\n' +
    '    pig.a = min(1., pig.a + a2 * (uTool == 2 ? .7 : .25)); aux.r = min(1., aux.r + a2 * .2); if (uTool == 2) aux.b = min(1., aux.b + a2 * .55);\n' +
    '  } else if (uTool == 6){\n' +
    '    vec2 sd = rot(-.52) * p; float streak = .9 + .1 * smoothstep(.3, .7, vnoise(vec2(sd.x * .004, sd.y * .09) + uSeed));\n' +
    '    float bl = texture(uBlur, (p - uMaskRect.xy) / uMaskRect.zw).r; float rim = clamp((m - bl) * 1.6, 0., 1.);\n' +
    '    col = glaze(col, uColor, amt * streak * (1. + .35 * rim) * min(sh, 1.3));\n' +
    '  } else if (uTool == 3 || uTool == 8){\n' +
    '    vec2 sd = rot(.3) * p; float br = .8 + .2 * vnoise(vec2(sd.x * .02, sd.y * .6) + uSeed);\n' +
    '    vec3 c2 = toSrgb(toLin(uColor) * mix(1., .55, clamp(sh - 1., 0., 1.)) + (1. - toLin(uColor)) * .25 * clamp(1. - sh, 0., 1.));\n' +
    '    col = kmMix(col, c2, amt * .92); pig.a = min(1., pig.a + amt * .9); if (uTool == 3){ aux.g = min(1., aux.g + amt * .25 * br); aux.b = 1.; }\n' +
    '  } else {\n' +
    '    float a2 = amt * sh * (uTool == 10 ? .7 : 1.); col = glaze(col, uColor, a2 * (uTool == 7 ? 3. : 1.));\n' +
    '  }\n' +
    '  oPig = vec4(col, pig.a); oAux = aux; }';

  var FS_WC_ADD = COMMON + '\n' +
    'uniform sampler2D uW, uP, uMask; uniform vec2 uOffS; uniform vec4 uSeg; uniform vec2 uRad, uPress; uniform vec3 uColor; uniform float uLoad, uSeed, uUseMask, uK, uDwell; uniform vec4 uMaskRect;\n' +
    'layout(location=0) out vec4 oW; layout(location=1) out vec4 oP;\n' +
    'void main(){ ivec2 ip = ivec2(gl_FragCoord.xy); vec2 p = (gl_FragCoord.xy) / uK; vec4 w = texelFetch(uW, ip, 0), pg = texelFetch(uP, ip, 0); oW = w; oP = pg;\n' +
    '  vec2 a = uSeg.xy, b = uSeg.zw, ab = b - a; float L = length(ab); float t = L > .01 ? clamp(dot(p - a, ab) / (L*L), 0., 1.) : 0.;\n' +
    '  float rad = mix(uRad.x, uRad.y, t), pr = mix(uPress.x, uPress.y, t); float d = length(p - (a + ab * t));\n' +
    '  float edge = rad * (.86 + .14 * (vnoise(p * .09 + uSeed) - .5) * 2. + .07 * (vnoise(p * .45 + uSeed * 2.) - .5));\n' +
    '  float f = 1. - smoothstep(edge * .78, edge, d);\n' +
    '  if (uUseMask > .5){ vec2 mp = (p - uMaskRect.xy) / uMaskRect.zw; f *= (mp.x < 0. || mp.y < 0. || mp.x > 1. || mp.y > 1.) ? 0. : texture(uMask, mp).r; }\n' +
    '  if (f <= 0.) return;\n' +
    '  float step1 = L > .01 ? min(1., L / max(rad, 1.)) : uDwell;\n' +
    '  float wash = f * (.3 + .45 * uLoad); float pig = f * uLoad * (.35 + .65 * pr) * step1 * .55;\n' +
    '  vec3 col = pg.a > .001 ? kmMix(pg.rgb, uColor, pig / (pg.a + pig)) : uColor;\n' +
    '  vec2 out2 = d > .5 ? (p - (a + ab * t)) / d : vec2(0.);\n' +
    '  float damp = smoothstep(.0, .05, w.r) * (1. - smoothstep(.12, .35, w.r)) * step(.02, pg.a);\n' +
    '  vec2 v = w.gb + out2 * damp * wash * 1.2 * (.6 + .8 * vnoise(p * .2 + uSeed));\n' +
    '  oW = vec4(min(1.3, max(w.r, wash) + wash * .08 * step1), v, 0.); oP = vec4(col, min(2.5, pg.a + pig)); }';

  var FS_WC_STEP = COMMON + '\n' +
    'uniform sampler2D uW, uP, uPaperS; uniform vec2 uSizeS; uniform float uDt, uFinal;\n' +
    'layout(location=0) out vec4 oW; layout(location=1) out vec4 oP;\n' +
    'vec4 W(vec2 q){ return texture(uW, q / uSizeS); } vec4 P(vec2 q){ return texture(uP, q / uSizeS); } float H(vec2 q){ return texture(uPaperS, q / uSizeS).r; }\n' +
    'void main(){ vec2 p = gl_FragCoord.xy; vec4 w = W(p);\n' +
    '  float hl = W(p - vec2(1,0)).r, hr = W(p + vec2(1,0)).r, hd = W(p - vec2(0,1)).r, hu = W(p + vec2(0,1)).r;\n' +
    '  float pl = H(p - vec2(1,0)), prr = H(p + vec2(1,0)), pd = H(p - vec2(0,1)), pu = H(p + vec2(0,1));\n' +
    '  vec2 grad = vec2(hr - hl, hu - hd) * .5 + vec2(prr - pl, pu - pd) * .22;\n' +
    '  vec2 v = w.gb * .88 - grad * 1.5 * uDt * 60.; if (w.r < .02) v = vec2(0.);\n' +
    '  v = clamp(v, -1.1, 1.1);\n' +
    '  vec2 back = p - v; vec4 wa = W(back); vec4 pa = P(back);\n' +
    '  float wet = step(.02, wa.r);\n' +
    '  float nb = (step(.02, hl) + step(.02, hr) + step(.02, hd) + step(.02, hu)) * .25;\n' +
    '  float edge = wet * (1. - nb);\n' +
    '  float evap = (.0035 + .018 * edge + .002 * (1. - H(p))) * uDt * 60.;\n' +
    '  float h = max(0., wa.r - evap);\n' +
    '  vec4 pl4 = P(p - vec2(1,0)), pr4 = P(p + vec2(1,0)), pd4 = P(p - vec2(0,1)), pu4 = P(p + vec2(0,1));\n' +
    '  float diff = .1 * wet * smoothstep(.0, .2, wa.r); float amt = mix(pa.a, (pl4.a + pr4.a + pd4.a + pu4.a) * .25, diff);\n' +
    '  vec3 col = pa.a > .001 ? pa.rgb : (pl4.rgb + pr4.rgb + pd4.rgb + pu4.rgb) * .25;\n' +
    '  float ws = 0.; for (int k = 0; k < 8; k++){ float an = float(k) * .785; vec2 o = vec2(cos(an), sin(an)); ws += W(p + o * 1.5).r + W(p + o * 3.5).r; } ws /= 16.;\n' +
    '  float rim = clamp((h - ws) * 3.5, 0., 1.) * .8 + smoothstep(.1, .0, h) * smoothstep(.0, .012, h) * .4;\n' +
    '  vec2 toEdge = vec2(hl - hr, hd - hu); float flowOut = max(0., dot(toEdge, v)) * 2.;\n' +
    '  float gather = (edge * .02 + flowOut * .008) * uDt * 60.;\n' +
    '  float soak = smoothstep(.0, .05, h);\n' +
    '  float rate = uFinal > .5 ? 1. : mix(1., (.008 + .035 * (1. - clamp(h / .6, 0., 1.))) * uDt * 60. * (1. + 1.4 * rim), soak);\n' +
    '  float dep = amt * clamp(rate, 0., 1.);\n' +
    '  amt = max(0., amt - dep);\n' +
    '  oW = vec4(h, v, dep); oP = vec4(col, min(2.5, amt * (1. + gather))); }';

  var FS_WC_DEP = DAB_HEAD +
    'uniform sampler2D uW, uP; uniform float uDt, uK, uFinal; uniform vec2 uSizeS;\n' +
    'void main(){ vec2 p = gl_FragCoord.xy + uOff; ivec2 ip = ivec2(p);\n' +
    '  vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0), ex = texelFetch(uExp, ip, 0); oPig = pig; oAux = aux; oExp = ex;\n' +
    '  vec2 uv = p * uK / uSizeS; vec4 w = texture(uW, uv), pg = texture(uP, uv); float ph = texelFetch(uPaper, ip, 0).r;\n' +
    '  float dep = w.a; if (dep <= .00005) return;\n' +
    '  float gran = 1.35 - ph * .8 + (vnoise(p * .7) - .5) * .25;\n' +
    '  float g2 = mix(1., gran, .6);\n' +
    '  oPig = vec4(glaze(pig.rgb, pg.rgb, dep * 1.35 * g2), pig.a * (1. - min(1., dep))); }';

  var FS_WC_DRAIN = COMMON + '\nuniform sampler2D uW, uP; uniform float uKeep; layout(location=0) out vec4 oW; layout(location=1) out vec4 oP;\n' +
    'void main(){ ivec2 ip = ivec2(gl_FragCoord.xy); oW = texelFetch(uW, ip, 0) * uKeep; vec4 p = texelFetch(uP, ip, 0); oP = vec4(p.rgb, p.a * uKeep); }';

  var FS_COMP = COMMON + '\n' +
    'uniform sampler2D uPig, uAux, uPaper, uLine, uGuide, uRef, uW, uP; uniform vec2 uDoc, uView; uniform vec3 uView2; uniform float uFlip, uWet, uRelief, uRef1, uGuideA, uLines, uDesk, uPaperOn, uK, uLineSharp, uNear, uCubic; uniform vec3 uTint, uDeskC, uInk; uniform vec2 uSizeS;\n' +
    'out vec4 o;\n' +
    'vec4 cr9(sampler2D t, vec2 uv){ vec2 sz = vec2(textureSize(t, 0)), sp = uv * sz - .5, tc = floor(sp) + .5, f = sp - floor(sp);\n' +
    '  vec2 w0 = f * (-.5 + f * (1. - .5 * f)), w1 = 1. + f * f * (-2.5 + 1.5 * f), w2 = f * (.5 + f * (2. - 1.5 * f)), w3 = f * f * (-.5 + .5 * f);\n' +
    '  vec2 w12 = w1 + w2, a = (tc - 1.) / sz, c = (tc + 2.) / sz, b = (tc + w2 / w12) / sz;\n' +
    '  return clamp((texture(t, vec2(a.x, a.y)) * w0.x + texture(t, vec2(b.x, a.y)) * w12.x + texture(t, vec2(c.x, a.y)) * w3.x) * w0.y\n' +
    '    + (texture(t, vec2(a.x, b.y)) * w0.x + texture(t, b) * w12.x + texture(t, vec2(c.x, b.y)) * w3.x) * w12.y\n' +
    '    + (texture(t, vec2(a.x, c.y)) * w0.x + texture(t, vec2(b.x, c.y)) * w12.x + texture(t, vec2(c.x, c.y)) * w3.x) * w3.y, 0., 1.); }\n' +
    'void main(){ vec2 sp = vec2(gl_FragCoord.x, uFlip > .5 ? uView.y - gl_FragCoord.y : gl_FragCoord.y);\n' +
    '  vec2 q = (sp - uView2.yz) / uView2.x;\n' +
    '  if (q.x < 0. || q.y < 0. || q.x > uDoc.x || q.y > uDoc.y){\n' +
    '    vec2 dq = max(vec2(0.), max(-q, q - uDoc)) * uView2.x; float sh = exp(-length(dq) / 14.) * .35 * smoothstep(-.5, 3., dq.y + 1.);\n' +
    '    o = vec4(uDeskC * (1. - sh), uDesk); return; }\n' +
    '  vec2 uv = q / uDoc; float px = 1. / uView2.x;\n' +
    '  vec4 pig = uNear > .5 ? texelFetch(uPig, ivec2(q), 0) : uCubic > .5 && uView2.x > 1.5 ? cr9(uPig, uv) : texture(uPig, uv), aux = uNear > .5 ? texelFetch(uAux, ivec2(q), 0) : texture(uAux, uv);\n' +
    '  float h = texture(uPaper, uv).r;\n' +
    '  float e = max(px, 1.);\n' +
    '  float hx = texture(uPaper, (q + vec2(e, 0.)) / uDoc).r - texture(uPaper, (q - vec2(e, 0.)) / uDoc).r;\n' +
    '  float hy = texture(uPaper, (q + vec2(0., e)) / uDoc).r - texture(uPaper, (q - vec2(0., e)) / uDoc).r;\n' +
    '  if (uView2.x > 1.6){ float zf = smoothstep(1.6, 4., uView2.x); vec2 fq = q * 2.6; float n1 = vnoise(fq + 3.), n2 = vnoise(fq + vec2(.3, 0.) + 3.), n3 = vnoise(fq + vec2(0., .3) + 3.); hx += (n2 - n1) * .12 * zf; hy += (n3 - n1) * .12 * zf; h += (n1 - .5) * .06 * zf; }\n' +
    '  float ox = texture(uAux, (q + vec2(e, 0.)) / uDoc).g - texture(uAux, (q - vec2(e, 0.)) / uDoc).g;\n' +
    '  float oy = texture(uAux, (q + vec2(0., e)) / uDoc).g - texture(uAux, (q - vec2(0., e)) / uDoc).g;\n' +
    '  vec3 Lt = normalize(vec3(-.5, -.6, .62));\n' +
    '  float flat1 = clamp(pig.a * .85 + aux.r * .5, 0., .92);\n' +
    '  float rel = uRelief * (1. - flat1) / e;\n' +
    '  vec3 Np = normalize(vec3(-hx * rel, -hy * rel, 1.));\n' +
    '  vec3 No = normalize(vec3(-ox * 10. / e, -oy * 10. / e, 1.));\n' +
    '  float lit = mix(1., 1. + .13 * (dot(Np, Lt) / Lt.z - 1.), uPaperOn);\n' +
    '  vec3 col = toLin(pig.rgb);\n' +
    '  if (uWet > .5){ vec2 su = q * uK / uSizeS; vec4 w = texture(uW, su), pg = texture(uP, su); if (pg.a > .0005) col = toLin(glaze(toSrgb(col), pg.rgb, pg.a * .95)); col *= 1. - .07 * smoothstep(.02, .3, w.r); }\n' +
    '  col *= mix(vec3(1.), uTint, uPaperOn) * lit * mix(1., .97 + .06 * h, uPaperOn * (1. - flat1));\n' +
    '  vec3 V = vec3(0., 0., 1.), Hh = normalize(Lt + V);\n' +
    '  float sheen = aux.a * pow(max(dot(normalize(Np + vec3(0., 0., .5)), Hh), 0.), 18.) * .5;\n' +
    '  col += sheen * vec3(.55, .57, .62);\n' +
    '  if (aux.g > .002){ float l2 = .86 + .2 * dot(No, Lt) / Lt.z; float spec = pow(max(dot(No, Hh), 0.), 60.) * .16 * smoothstep(.0, .2, aux.g) * (.5 + .5 * aux.b);\n' +
    '    col = col * mix(1., l2, smoothstep(0., .1, aux.g)) + spec; }\n' +
    '  if (uLines > .5){ vec2 lq = uv; float lv = uCubic > .5 && uLineSharp * uView2.x > 1.5 ? cr9(uLine, lq).r : texture(uLine, lq).r; float ink = 1. - lv;\n' +
    '    float w2 = clamp(.5 / max(uLineSharp * uView2.x, .5), .04, .5); ink = smoothstep(.5 - w2, .5 + w2, ink);\n' +
    '    col = mix(col, col * toLin(uInk), ink); }\n' +
    '  if (uGuideA > 0.){ vec4 g = texture(uGuide, uv); col = mix(col, toLin(g.rgb), g.a * uGuideA); }\n' +
    '  if (uRef1 > 0.){ vec3 rc = toLin(texture(uRef, uv).rgb); col = mix(col, rc, uRef1); }\n' +
    '  o = vec4(toSrgb(col), 1.); }';

  var FS_INIT = '#version 300 es\nprecision highp float; uniform vec4 uV; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1; layout(location=2) out vec4 o2; void main(){ o0 = uV; o1 = vec4(0.); o2 = vec4(0.); }';
  var FS_LOAD = '#version 300 es\nprecision highp float; uniform sampler2D uImg; uniform vec2 uOff, uSize; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1; layout(location=2) out vec4 o2;\n' +
    'void main(){ vec2 p = gl_FragCoord.xy + uOff; vec4 c = texture(uImg, p / uSize); o0 = vec4(mix(vec3(1.), c.rgb, c.a), 0.); o1 = vec4(0.); o2 = vec4(0.); }';
  var FS_BACK = '#version 300 es\nprecision highp float; uniform sampler2D uA, uB, uC; uniform vec2 uOff; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1; layout(location=2) out vec4 o2;\n' +
    'void main(){ ivec2 ip = ivec2(gl_FragCoord.xy - uOff); o0 = texelFetch(uA, ip, 0); o1 = texelFetch(uB, ip, 0); o2 = texelFetch(uC, ip, 0); }';
  var FS_PIGOUT = '#version 300 es\nprecision highp float; uniform sampler2D uPig; out vec4 o; void main(){ o = vec4(texelFetch(uPig, ivec2(gl_FragCoord.xy), 0).rgb, 1.); }';

  var ENC = 'uint pk8(vec4 v){ uvec4 b = uvec4(round(clamp(v, 0., 1.) * 255.)); return b.x | (b.y << 8) | (b.z << 16) | (b.w << 24); }\n' +
    'vec4 uk8(uint u){ return vec4(float(u & 255u), float((u >> 8) & 255u), float((u >> 16) & 255u), float(u >> 24)) / 255.; }\n' +
    'uvec4 enc(vec4 p, vec4 a){ return uH == 1 ? uvec4(packHalf2x16(p.rg), packHalf2x16(p.ba), packHalf2x16(a.rg), packHalf2x16(a.ba)) : uvec4(pk8(p), pk8(a), 0u, 0u); }\n';
  var FS_DELTA = '#version 300 es\nprecision highp float; precision highp int; uniform highp sampler2D uBP, uBA, uCP, uCA; uniform ivec2 uB, uC, uO; uniform int uH, uGrab; layout(location=0) out uvec4 o0; layout(location=1) out uvec4 o1;\n' + ENC +
    'void main(){ ivec2 q = ivec2(gl_FragCoord.xy) - uO; uvec4 c = enc(texelFetch(uCP, uC + q, 0), texelFetch(uCA, uC + q, 0)), w = enc(vec4(1., 1., 1., 0.), vec4(0.));\n' +
    '  if (uGrab == 1){ o0 = c ^ w; o1 = uvec4(0u); return; }\n' +
    '  uvec4 b = enc(texelFetch(uBP, uB + q, 0), texelFetch(uBA, uB + q, 0)); o0 = b ^ c; o1 = b ^ w; }';
  var FS_XOR = '#version 300 es\nprecision highp float; precision highp int; precision highp usampler2D; uniform highp sampler2D uCP, uCA; uniform usampler2D uD; uniform ivec2 uC, uDo; uniform int uH, uMode; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1; layout(location=2) out vec4 o2;\n' + ENC +
    'void main(){ o2 = vec4(0.); ivec2 q = ivec2(gl_FragCoord.xy); uvec4 base = uMode == 1 ? enc(vec4(1., 1., 1., 0.), vec4(0.)) : enc(texelFetch(uCP, uC + q, 0), texelFetch(uCA, uC + q, 0)); uvec4 e = base ^ texelFetch(uD, uDo + q, 0);\n' +
    '  if (uH == 1){ o0 = vec4(unpackHalf2x16(e.x), unpackHalf2x16(e.y)); o1 = vec4(unpackHalf2x16(e.z), unpackHalf2x16(e.w)); } else { o0 = uk8(e.x); o1 = uk8(e.y); } }';
  function rleEnc(a) {
    var n = a.length, cap = (n >> 2) + 64, out = new Uint32Array(cap), o = 0, i = 0;
    var need = function (k) { if (o + k <= cap) return; while (o + k > cap) cap *= 2; var b = new Uint32Array(cap); b.set(out.subarray(0, o)); out = b; };
    while (i < n) {
      var z = i; while (z < n && a[z] === 0) z++;
      var e = z;
      while (e < n) { if (a[e] !== 0) { e++; continue; } var q = e; while (q < n && a[q] === 0 && q - e < 4) q++; if (q - e >= 4 || q === n) break; e = q; }
      need(2 + e - z); out[o++] = z - i; out[o++] = e - z; out.set(a.subarray(z, e), o); o += e - z; i = e;
    }
    return out.slice(0, o);
  }
  function rleDec(z, n) {
    var a = new Uint32Array(n), i = 0, o = 0;
    while (i < z.length) { o += z[i++]; var k = z[i++]; a.set(z.subarray(i, i + k), o); o += k; i += k; }
    return a;
  }

  var SRC = { delta: FS_DELTA, xor: FS_XOR, paper: FS_PAPER, dab: FS_DAB, rim: FS_RIM, fill: FS_FILL, wcAdd: FS_WC_ADD, wcStep: FS_WC_STEP, wcDep: FS_WC_DEP, wcDrain: FS_WC_DRAIN, comp: FS_COMP, init: FS_INIT, load: FS_LOAD, pigout: FS_PIGOUT, back: FS_BACK };
  var TOOLS = { graphite: 0, pencil: 1, pastel: 2, oil: 3, eraser: 4, blend: 5, marker: 6, ink: 7, gel: 8, crayon: 9, airbrush: 10 };
  var KCOV = { graphite: 1.15, pencil: 1.2, pastel: 1.5, oil: 1.6, eraser: 1.4, blend: 1.2, marker: 4.5, ink: 6, gel: 4, crayon: 1.7, airbrush: .55 };
  var DWELL = { graphite: .2, pencil: .2, pastel: .12, oil: .08, eraser: .2, blend: 0, marker: .55, ink: .6, gel: .5, crayon: .12, airbrush: .35, wash: .5 };
  var TILE = 128;

  function hexToRgb(h) { var n = parseInt(String(h || '#000000').slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
  function union(a, b) { if (!a) return b && b.slice(); if (!b) return a.slice(); var x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]); return [x0, y0, Math.max(a[0] + a[2], b[0] + b[2]) - x0, Math.max(a[1] + a[3], b[1] + b[3]) - y0]; }

  var Q_XY = 32, Q_P = 4096, Q_T = 1e5;
  function qpt(p) { return { x: Math.round(p.x * Q_XY) / Q_XY, y: Math.round(p.y * Q_XY) / Q_XY, p: Math.round((p.p == null ? .6 : p.p) * Q_P) / Q_P, tz: Math.round((p.tz || 0) * Q_P) / Q_P, az: p.az == null ? null : Math.round(p.az * Q_P) / Q_P }; }
  function qdt(dt) { return Math.round(dt * Q_T) / Q_T; }
  var BATCH = { graphite: 1, pencil: 1, pastel: 1, eraser: 1, marker: 1, ink: 1, gel: 1, crayon: 1, airbrush: 1 };
  function s2lin(c) { c = Math.min(1, Math.max(0, c)); return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }
  function pigSpec(rgb) {
    var a = new Float32Array(SPEC), l = [s2lin(rgb[0]), s2lin(rgb[1]), s2lin(rgb[2])], w = Math.min(l[0], l[1], l[2]);
    l = [l[0] - w, l[1] - w, l[2] - w];
    var A = [w, Math.min(l[1], l[2]), Math.min(l[0], l[2]), Math.min(l[0], l[1])];
    var B = [Math.max(0, Math.min(l[0] - l[2], l[0] - l[1])), Math.max(0, Math.min(l[1] - l[2], l[1] - l[0])), Math.max(0, Math.min(l[2] - l[1], l[2] - l[0]))];
    for (var i = 0; i < 38; i++) {
      var o = i * 8, R = Math.max(1e-4, A[0] * SPEC[o] + A[1] * SPEC[o + 1] + A[2] * SPEC[o + 2] + A[3] * SPEC[o + 3] + B[0] * SPEC[o + 4] + B[1] * SPEC[o + 5] + B[2] * SPEC[o + 6]);
      a[o + 7] = R; a[304 + i * 4 + 3] = Math.log2(R);
    }
    return a;
  }
  var ATTRS = { preserveDrawingBuffer: true, antialias: false, alpha: false, powerPreference: 'high-performance' };
  var SHARED = null;
  function shared() {
    if (SHARED && !SHARED.gl.isContextLost()) return SHARED;
    var c = document.createElement('canvas'); c.width = c.height = 1;
    var gl = null; try { gl = c.getContext('webgl2', ATTRS); } catch (e) {}
    if (!gl) return (SHARED = null);
    SHARED = { canvas: c, gl: gl, P: {}, Q: {}, owner: null, name: gpuName(gl), maxT: gl.getParameter(gl.MAX_TEXTURE_SIZE) };
    return SHARED;
  }
  function gpuName(gl) {
    try { var x = gl.getExtension('WEBGL_debug_renderer_info'); return String(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { return ''; }
  }

  function Surface(canvas, opts) {
    opts = opts || {};
    var sh = opts.shared ? shared() : null;
    if (sh && sh.owner && !sh.canvas.getClientRects().length) { try { sh.owner.destroy(); } catch (e) { sh.owner = null; } }
    if (sh && sh.owner) sh = null;
    if (sh) { canvas = sh.canvas; sh.owner = this; this.shd = sh; }
    var gl = sh ? sh.gl : canvas.getContext('webgl2', ATTRS);
    if (!gl) throw new Error('webgl2');
    this.gl = gl; this.canvas = canvas;
    var f32 = !!gl.getExtension('EXT_color_buffer_float'), f16 = f32 || !!gl.getExtension('EXT_color_buffer_half_float');
    gl.getExtension('OES_texture_float_linear');
    this.fmt = f16 ? [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT] : [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE];
    this.hdr = f16;
    var maxT = (sh ? sh.maxT : gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 4096;
    this.W = Math.min(opts.W | 0, maxT); this.H = Math.min(opts.H | 0, maxT);
    var q = this.qbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, q);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.P = sh ? sh.P : {}; this.Q = sh ? sh.Q : {}; this.todo = {}; this.par = gl.getExtension('KHR_parallel_shader_compile');
    var self = this;
    this.src = SRC;
    this.prog('comp'); this.prog('init'); this.warm('back');
    var W = this.W, H = this.H, fmt = this.fmt;
    this.pig = this.tex(W, H, fmt, true); this.aux = this.tex(W, H, fmt, true); this.exp = this.tex(W, H, fmt, false);
    this.fbMain = this.fbo([this.pig, this.aux, this.exp]);
    this.S = Math.min(1024, Math.max(W, H));
    this.sPig = this.tex(this.S, this.S, fmt); this.sAux = this.tex(this.S, this.S, fmt); this.sExp = this.tex(this.S, this.S, fmt);
    this.fbScr = this.fbo([this.sPig, this.sAux, this.sExp]);
    this.paperT = this.tex(W, H, [gl.R8, gl.RED, gl.UNSIGNED_BYTE], true); this.fbPaper = this.fbo([this.paperT]);
    this.lineT = this.tex(4, 4, [gl.R8, gl.RED, gl.UNSIGNED_BYTE], true); this.hasLines = false; this.lineSharp = 1;
    this.guideT = this.tex(4, 4, [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE], true); this.guideA = 0;
    this.refT = this.tex(4, 4, [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE], true); this.refMix = 0;
    this.maskT = this.tex(4, 4, [gl.R8, gl.RED, gl.UNSIGNED_BYTE], true); this.blurT = this.tex(4, 4, [gl.R8, gl.RED, gl.UNSIGNED_BYTE], true);
    this.maskRect = [0, 0, 1, 1]; this.useMask = 0;
    this.k = opts.simScale || .5; this.sw = Math.ceil(W * this.k); this.sh = Math.ceil(H * this.k);
    this.wcReady = false;
    this.view = { s: 1, x: 0, y: 0, w: canvas.width, h: canvas.height }; this.full = true; this.part = this.parts = null;
    this.tint = [1, .99, .965]; this.desk = [.13, .15, .19]; this.ink = [.1, .1, .12];
    this.undo = []; this.redo = []; this.rec = null; this.pages = []; this.free = []; this.snapPool = [];
    this.q = []; this.queued = !!opts.queue;
    this.dpages = []; this.dfree = []; this.reads = []; this.toRead = []; this.inked = new Set(); this.lastIn = 0; this.histBytes = 0; this.maxSteps = opts.maxSteps || 400;
    var dm = navigator.deviceMemory || 8; this.histMax = opts.histBytes || (dm <= 2 ? 48e6 : dm <= 4 ? 128e6 : 256e6);
    this.maxSnaps = opts.snaps || (this.W * this.H > 3e6 ? 4 : 6);
    this.maxPages = opts.undoPages || (Math.ceil(Math.ceil(this.W / TILE) * Math.ceil(this.H / TILE) / 64) + 2);
    this.wet = null; this.wc = {}; this.wetT = null; this.dirty = this.full = true; this.expBox = null;
    this.clear(true);
    this.setPaper(opts.paper || 'draw');
    this.log = []; this.logN = 0; this._lg = 0; this.paper0 = this.paperKind;
  }

  Surface.prototype.warm = function (name) {
    if (this.P[name] || this.Q[name]) return;
    var gl = this.gl, p = gl.createProgram(), k = name.split(':'), fs = this.src[k[0]];
    if (k.length > 1) fs = fs.replace('uniform int uTool;', 'const int uTool = ' + k[1] + ';');
    if (k.length > 2) fs = fs.replace('uniform float uSeed, uShade, uAmt, uGrade, uUseRef,', 'const float uUseRef = ' + k[2] + '.; uniform float uSeed, uShade, uAmt, uGrade,');
    p.sh = [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]].map(function (s) {
      var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh); gl.attachShader(p, sh); return sh;
    });
    gl.bindAttribLocation(p, 0, 'aP'); gl.linkProgram(p);
    this.Q[name] = p;
  };
  Surface.prototype.ready = function (name) {
    if (this.P[name]) return true;
    var p = this.Q[name]; if (!p) { this.warm(name); p = this.Q[name]; }
    return !this.par || this.gl.getProgramParameter(p, this.par.COMPLETION_STATUS_KHR);
  };
  Surface.prototype.prime = function (name) {
    var p = this.prog(name), gl = this.gl, sim = /^wc(Add|Step|Drain)$/.test(name);
    if (p.primed) return;
    for (var i = 0; i < 8; i++) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.paperT); }
    this.draw(p, sim ? this.fbWB : this.fbScr, sim ? this.sw : this.S, sim ? this.sh : this.S, [0, 0, 1, 1]);
    gl.flush();
  };
  Surface.prototype.prepare = function (tool, fill) {
    var self = this, names = [];
    if (tool === 'wash') { this.initWC(); names = ['wcAdd', 'wcStep', 'wcDep', 'wcDrain']; }
    else if (TOOLS[tool] != null) names = fill ? ['fill:' + TOOLS[tool] + ':0'] : ['dab:' + TOOLS[tool]].concat(tool === 'marker' ? ['rim'] : []);
    if (this.hasRef && (tool === 'wash' || TOOLS[tool] != null)) names.push('fill:' + (tool === 'wash' ? 11 : TOOLS[tool]) + ':2');
    names.forEach(function (n) { if (!(self.P[n] && self.P[n].primed)) { self.warm(n); self.todo[n] = 1; } });
    if (this._prep || !Object.keys(this.todo).length) return;
    var step = function () {
      self._prep = 0;
      if (self.gl.isContextLost()) return;
      var left = Object.keys(self.todo);
      for (var i = 0; i < left.length; i++) {
        var n = left[i];
        if (self.P[n] && self.P[n].primed) { delete self.todo[n]; continue; }
        if (!self.rec && self.ready(n)) { self.prime(n); delete self.todo[n]; break; }
      }
      if (Object.keys(self.todo).length) self._prep = requestAnimationFrame(step);
    };
    this._prep = requestAnimationFrame(step);
  };
  Surface.prototype.prog = function (name) {
    if (this.P[name]) return this.P[name];
    this.warm(name);
    var gl = this.gl, p = this.Q[name]; delete this.Q[name];
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(name + ': ' + p.sh.map(function (s) { return gl.getShaderInfoLog(s); }).join(' ') + gl.getProgramInfoLog(p));
    p.u = {}; var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var u = gl.getActiveUniform(p, i); p.u[u.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, u.name); }
    if (p.u.uSpec) { gl.useProgram(p); gl.uniform4fv(p.u.uSpec, SPEC); }
    this.P[name] = p;
    return p;
  };
  Surface.prototype.tex = function (w, h, f, linear) {
    var gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, f[0], w, h, 0, f[1], f[2], null);
    var flt = linear ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, flt); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, flt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    t.w = w; t.h = h; return t;
  };
  Surface.prototype.fbo = function (texs) {
    var gl = this.gl, f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    var at = texs.map(function (t, i) { gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0); return gl.COLOR_ATTACHMENT0 + i; });
    gl.drawBuffers(at); f.n = texs.length; f.w = texs[0].w; f.h = texs[0].h; f.tex = texs;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return f;
  };
  Surface.prototype.upload = function (t, src, fmt) {
    var gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt[0], fmt[1], fmt[2], src);
    t.w = src.width || src.naturalWidth; t.h = src.height || src.naturalHeight;
  };
  Surface.prototype.bindTex = function (p, name, t, unit) {
    if (p.u[name] == null) return;
    var gl = this.gl; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(p.u[name], unit);
  };
  Surface.prototype.draw = function (p, fb, vw, vh, rect, setup) {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, vw, vh);
    gl.useProgram(p);
    if (rect) { gl.enable(gl.SCISSOR_TEST); gl.scissor(rect[0], rect[1], rect[2], rect[3]); } else gl.disable(gl.SCISSOR_TEST);
    if (setup) setup(p, gl);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.SCISSOR_TEST);
    p.primed = true;
  };
  Surface.prototype.copyRect = function (from, to, sx, sy, w, h, dx, dy, n) {
    var gl = this.gl;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, from); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, to);
    for (var i = 0; i < n; i++) {
      gl.readBuffer(gl.COLOR_ATTACHMENT0 + i);
      var db = []; for (var k = 0; k < n; k++) db.push(k === i ? gl.COLOR_ATTACHMENT0 + i : gl.NONE);
      gl.drawBuffers(db);
      gl.blitFramebuffer(sx, sy, sx + w, sy + h, dx, dy, dx + w, dy + h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    }
    var all = []; for (var j = 0; j < to.n; j++) all.push(gl.COLOR_ATTACHMENT0 + j);
    gl.drawBuffers(all);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  };
  Surface.prototype.clip = function (r) {
    var x0 = Math.max(0, Math.floor(r[0])), y0 = Math.max(0, Math.floor(r[1]));
    var x1 = Math.min(this.W, Math.ceil(r[0] + r[2])), y1 = Math.min(this.H, Math.ceil(r[1] + r[3]));
    return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
  };

  Surface.prototype.pass = function (name, rect, setup, keepExp) {
    var self = this, gl = this.gl, p = this.prog(name), S = this.S;
    rect = this.clip(rect); if (!rect) return null;
    this.touchTiles(rect);
    for (var ty = rect[1]; ty < rect[1] + rect[3]; ty += S) {
      for (var tx = rect[0]; tx < rect[0] + rect[2]; tx += S) {
        var w = Math.min(S, rect[0] + rect[2] - tx), h = Math.min(S, rect[1] + rect[3] - ty);
        this.draw(p, this.fbScr, S, S, [0, 0, w, h], function (pp, g) {
          self.bindTex(pp, 'uPig', self.pig, 0); self.bindTex(pp, 'uAux', self.aux, 1); self.bindTex(pp, 'uExp', self.exp, 2);
          self.bindTex(pp, 'uPaper', self.paperT, 3); self.bindTex(pp, 'uMask', self.maskT, 4);
          g.uniform2f(pp.u.uOff, tx, ty); g.uniform2f(pp.u.uSize, self.W, self.H);
          if (pp.u.uMaskRect) g.uniform4fv(pp.u.uMaskRect, self.maskRect);
          if (pp.u.uUseMask) g.uniform1f(pp.u.uUseMask, self.useMask);
          setup(pp, g);
        });
        this.back(tx, ty, w, h, keepExp);
      }
    }
    this.addPart(rect);
    this.dirty = true;
    return rect;
  };

  Surface.prototype.back = function (tx, ty, w, h, keepExp) {
    var self = this, gl = this.gl;
    if (keepExp) { gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbMain); gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.NONE]); }
    this.draw(this.prog('back'), this.fbMain, this.W, this.H, [tx, ty, w, h], function (p, g) {
      self.bindTex(p, 'uA', self.sPig, 0); self.bindTex(p, 'uB', self.sAux, 1); self.bindTex(p, 'uC', self.sExp, 2); g.uniform2f(p.u.uOff, tx, ty);
    });
    if (keepExp) { gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbMain); gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
  };
  Surface.prototype.page = function () {
    var gl = this.gl;
    if (this.free.length) return this.free.pop();
    if (this.pages.length >= this.maxPages) return -1;
    var PW = 1024, PH = 1024, fmt = this.fmt;
    var pg = { pig: this.tex(PW, PH, fmt), aux: this.tex(PW, PH, fmt) };
    pg.fb = this.fbo([pg.pig, pg.aux]);
    var idx = this.pages.length; this.pages.push(pg);
    var per = (PW / TILE) * (PH / TILE);
    for (var i = per - 1; i >= 1; i--) this.free.push(idx * per + i);
    return idx * per;
  };
  Surface.prototype.slotAt = function (slot) {
    var per = 64, pg = this.pages[(slot / per) | 0], i = slot % per;
    return { fb: pg.fb, pig: pg.pig, aux: pg.aux, x: (i % 8) * TILE, y: ((i / 8) | 0) * TILE };
  };
  Surface.prototype.dpage = function () {
    if (this.dfree.length) return this.dfree.pop();
    if (this.dpages.length >= this.maxPages) return -1;
    var gl = this.gl, f = [gl.RGBA32UI, gl.RGBA_INTEGER, gl.UNSIGNED_INT], t = this.tex(1024, 1024, f, false), t2 = this.tex(1024, 1024, f, false);
    var pg = { t: t, t2: t2, fb: this.fbo([t, t2]) }, idx = this.dpages.length; this.dpages.push(pg);
    for (var i = 63; i >= 1; i--) this.dfree.push(idx * 64 + i);
    return idx * 64;
  };
  Surface.prototype.dslotAt = function (slot) {
    var pg = this.dpages[(slot / 64) | 0], i = slot % 64;
    return { fb: pg.fb, t: pg.t, t2: pg.t2, x: (i % 8) * TILE, y: ((i / 8) | 0) * TILE };
  };
  Surface.prototype.saveTile = function (tx, ty) {
    var slot = this.page();
    while (slot < 0 && this.undo.length && this.undo[0] !== this.wetRec) { this.dropRec(this.undo.shift()); slot = this.page(); }
    if (slot < 0) return -1;
    var s = this.slotAt(slot), x = tx * TILE, y = ty * TILE, w = Math.min(TILE, this.W - x), h = Math.min(TILE, this.H - y);
    this.copyRect(this.fbMain, s.fb, x, y, w, h, s.x, s.y, 2);
    return slot;
  };
  Surface.prototype.dropRec = function (r) {
    var self = this;
    if (!r) return;
    r.dead = true;
    Object.keys(r.t).forEach(function (k) { if (r.t[k] >= 0) self.free.push(r.t[k]); });
    r.t = {};
    if (r.d) Object.keys(r.d).forEach(function (k) { var d = r.d[k]; if (!d) return; if (d.s != null && !d.rd) self.dfree.push(d.s); if (d.z) self.histBytes -= d.z.byteLength; });
    r.d = null;
    if (r.snap) { this.snapPool.push(r.snap); r.snap = null; while (this.snapPool.length) this.killSnap(this.snapPool.pop()); }
  };
  Surface.prototype.newSnap = function () {
    var gl = this.gl, f = [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE];
    return this.snapPool.pop() || this.fbo([this.tex(this.W, this.H, f), this.tex(this.W, this.H, f)]);
  };
  Surface.prototype.killSnap = function (fb) {
    var gl = this.gl; fb.tex.forEach(function (t) { gl.deleteTexture(t); }); gl.deleteFramebuffer(fb);
  };
  Surface.prototype.snaps = function () { return 0; };
  Surface.prototype.beginSnap = function () {
    if (this.q && this.q.length) this.flush();
    return this.begin();
  };
  Surface.prototype.begin = function () {
    if (this.rec) this.end();
    var self = this;
    this.redo.forEach(function (r) { self.dropRec(r); }); this.redo = [];
    this.rec = { t: {}, box: null };
    return this.rec;
  };
  Surface.prototype.end = function () {
    var r = this.rec; this.rec = null;
    if (!r) return null;
    if (!Object.keys(r.t).length) return null;
    this.undo.push(r);
    this.seal(r);
    this.trim();
    return r;
  };
  Surface.prototype.trim = function () {
    while (this.undo.length > 1 && this.undo[0] !== this.wetRec && (this.undo.length > this.maxSteps || this.histBytes > this.histMax)) this.dropRec(this.undo.shift());
  };
  Surface.prototype.touchTiles = function (rect) {
    var r = this.rec || this.wetRec, ink = this.inked;
    var x0 = (rect[0] / TILE) | 0, y0 = (rect[1] / TILE) | 0, x1 = ((rect[0] + rect[2] - 1) / TILE) | 0, y1 = ((rect[1] + rect[3] - 1) / TILE) | 0;
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      var k = x + ',' + y;
      if (r && !(k in r.t)) { r.t[k] = this.saveTile(x, y); if (!ink.has(k)) (r.blank || (r.blank = {}))[k] = 1; }
      ink.add(k);
    }
    if (r) r.box = union(r.box, rect);
  };

  Surface.prototype.seal = function (r) {
    if (!r || r.d || r.dead || this.wet || r === this.wetRec) return false;
    var self = this, keys = Object.keys(r.t), d = {}, batch = [], bl = r.blank || {};
    var p = this.prog('delta');
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i], slot = r.t[k];
      if (slot < 0) { d[k] = null; continue; }
      if (bl[k]) { var bxy = k.split(','); d[k] = { s: null, w: Math.min(TILE, this.W - bxy[0] * TILE), h: Math.min(TILE, this.H - bxy[1] * TILE), z: Z0, m: 'b' }; continue; }
      var ds = this.dpage();
      if (ds < 0) { this.poll(true); ds = this.dpage(); }
      if (ds < 0) { for (var j = 0; j < i; j++) { var dd = d[keys[j]]; if (dd) self.dfree.push(dd.s); } return false; }
      var xy = k.split(','), x = +xy[0] * TILE, y = +xy[1] * TILE, w = Math.min(TILE, this.W - x), h = Math.min(TILE, this.H - y);
      var s = this.slotAt(slot), o = this.dslotAt(ds);
      this.draw(p, o.fb, 1024, 1024, [o.x, o.y, w, h], function (pp, g) {
        self.bindTex(pp, 'uBP', s.pig, 0); self.bindTex(pp, 'uBA', s.aux, 1); self.bindTex(pp, 'uCP', self.pig, 2); self.bindTex(pp, 'uCA', self.aux, 3);
        g.uniform2i(pp.u.uB, s.x, s.y); g.uniform2i(pp.u.uC, x, y); g.uniform2i(pp.u.uO, o.x, o.y); g.uniform1i(pp.u.uH, self.hdr ? 1 : 0); g.uniform1i(pp.u.uGrab, 0);
      });
      d[k] = { s: ds, w: w, h: h, m: 'x', two: 0 };
      batch.push(k);
    }
    keys.forEach(function (k) { if (r.t[k] >= 0) self.free.push(r.t[k]); });
    r.t = {}; r.d = d; r.blank = null;
    if (batch.length) this.queueRead(r, batch);
    return true;
  };
  var Z0 = new Uint32Array(0);
  Surface.prototype.queueRead = function (r, keys) { this.toRead.push([r, keys.slice()]); this.idleSoon(); };
  Surface.prototype.idleSoon = function () {
    var self = this; if (this._idleT || !this.toRead.length) return;
    this._idleT = setTimeout(function () { self._idleT = 0; self.idleRead(false); }, 250);
  };
  Surface.prototype.idleRead = function (all) {
    if (!all && (this.q.length || (this.rec && this.rec !== this.wetRec) || performance.now() - this.lastIn < 500)) { this.idleSoon(); return; }
    var n = 0;
    while (this.toRead.length && (all || n < 3)) {
      var e = this.toRead[0], r = e[0], take = e[1].splice(0, all ? e[1].length : 3 - n);
      n += take.length;
      if (!e[1].length) this.toRead.shift();
      if (r.dead || !r.d) continue;
      take = take.filter(function (k) { var d = r.d[k]; return d && d.s != null && !d.z; });
      if (take.length) this.readBack(r, take);
    }
    if (this.toRead.length) this.idleSoon();
  };
  Surface.prototype.readBack = function (r, keys) {
    var gl = this.gl, self = this, TB = TILE * TILE * 16;
    for (var i0 = 0; i0 < keys.length; i0 += 16) {
      var part = keys.slice(i0, i0 + 16), pbo = gl.createBuffer(), offs = [], at = 0;
      part.forEach(function (k) { var d = r.d[k]; offs.push(at); at += (d.two ? 2 : 1) * TB; });
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo); gl.bufferData(gl.PIXEL_PACK_BUFFER, at, gl.STREAM_READ);
      part.forEach(function (k, n) {
        var d = r.d[k], o = self.dslotAt(d.s);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, o.fb);
        gl.readBuffer(gl.COLOR_ATTACHMENT0); gl.readPixels(o.x, o.y, d.w, d.h, gl.RGBA_INTEGER, gl.UNSIGNED_INT, offs[n]);
        if (d.two) { gl.readBuffer(gl.COLOR_ATTACHMENT1); gl.readPixels(o.x, o.y, d.w, d.h, gl.RGBA_INTEGER, gl.UNSIGNED_INT, offs[n] + TB); }
      });
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      var sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      this.reads.push({ r: r, keys: part, offs: offs, size: at, pbo: pbo, sync: sync, slots: part.map(function (k) { return r.d[k].s; }) });
    }
    gl.flush();
    if (!this._pollT) this._pollT = setTimeout(function () { self._pollT = 0; self.poll(false); }, 24);
  };
  Surface.prototype.poll = function (force) {
    var gl = this.gl, self = this, TB = TILE * TILE * 16, t0 = performance.now(), more = false, did = 0;
    if (gl.isContextLost()) { this.reads = []; this.toRead = []; return; }
    if (force && this.toRead.length) this.idleRead(true);
    var buf = this._pollBuf || (this._pollBuf = new Uint32Array(TB / 2));
    while (this.reads.length) {
      var b = this.reads[0];
      if (!force && b.i == null) { var st = gl.clientWaitSync(b.sync, 0, 0); if (st === gl.TIMEOUT_EXPIRED || st === gl.WAIT_FAILED) break; }
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, b.pbo);
      for (b.i = b.i || 0; b.i < b.keys.length; b.i++) {
        if (!force && did && performance.now() - t0 > 4) { more = true; break; }
        var n = b.i, k = b.keys[n], d = b.r.d && b.r.d[k];
        if (!d || b.r.dead || d.s !== b.slots[n]) continue;
        var n4 = d.w * d.h * 4, half = d.two ? TB / 4 : 0;
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, b.offs[n], buf, 0, half + n4);
        var zx = rleEnc(buf.subarray(0, n4));
        if (d.two && !d.fx) { var zb = rleEnc(buf.subarray(half, half + n4)); if (zb.byteLength < zx.byteLength) { zx = zb; d.m = 'b'; } }
        d.z = zx; d.two = 0; self.histBytes += zx.byteLength;
        self.dfree.push(d.s); d.s = null; did++;
      }
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      if (more) break;
      this.reads.shift(); gl.deleteBuffer(b.pbo); gl.deleteSync(b.sync);
    }
    this.trim();
    if (this.reads.length && !this._pollT) this._pollT = setTimeout(function () { self._pollT = 0; self.poll(false); }, more ? 0 : 24);
  };
  Surface.prototype.xorRec = function (r) {
    var self = this, gl = this.gl, p = this.prog('xor'), grabs = [];
    Object.keys(r.d).forEach(function (k) {
      var d = r.d[k]; if (!d) return;
      var xy = k.split(','), x = +xy[0] * TILE, y = +xy[1] * TILE, src, sx = 0, sy = 0, mode = d.s != null ? (d.two ? 'x' : d.m) : d.m; self.inked.add(k);
      if (d.s != null && d.two) d.fx = 1;
      var g = -1;
      if (mode === 'b') {
        g = self.dpage();
        if (g < 0) { self.poll(true); g = self.dpage(); }
        if (g >= 0) {
          var go = self.dslotAt(g);
          self.draw(self.prog('delta'), go.fb, 1024, 1024, [go.x, go.y, d.w, d.h], function (pp, gg) {
            self.bindTex(pp, 'uBP', self.pig, 0); self.bindTex(pp, 'uBA', self.aux, 1); self.bindTex(pp, 'uCP', self.pig, 2); self.bindTex(pp, 'uCA', self.aux, 3);
            gg.uniform2i(pp.u.uB, x, y); gg.uniform2i(pp.u.uC, x, y); gg.uniform2i(pp.u.uO, go.x, go.y); gg.uniform1i(pp.u.uH, self.hdr ? 1 : 0); gg.uniform1i(pp.u.uGrab, 1);
          });
        }
      }
      if (d.s != null) { var o = self.dslotAt(d.s); src = o.t; sx = o.x; sy = o.y; }
      else {
        if (!self.dTmp) self.dTmp = self.tex(TILE, TILE, [gl.RGBA32UI, gl.RGBA_INTEGER, gl.UNSIGNED_INT], false);
        gl.bindTexture(gl.TEXTURE_2D, self.dTmp); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, d.w, d.h, gl.RGBA_INTEGER, gl.UNSIGNED_INT, rleDec(d.z, d.w * d.h * 4));
        src = self.dTmp;
      }
      self.draw(p, self.fbScr, self.S, self.S, [0, 0, d.w, d.h], function (pp, gg) {
        self.bindTex(pp, 'uCP', self.pig, 0); self.bindTex(pp, 'uCA', self.aux, 1); self.bindTex(pp, 'uD', src, 2);
        gg.uniform2i(pp.u.uC, x, y); gg.uniform2i(pp.u.uDo, sx, sy); gg.uniform1i(pp.u.uH, self.hdr ? 1 : 0); gg.uniform1i(pp.u.uMode, mode === 'b' ? 1 : 0);
      });
      self.copyRect(self.fbScr, self.fbMain, 0, 0, d.w, d.h, x, y, 2);
      if (mode === 'b' && g >= 0) {
        if (d.s != null) self.dfree.push(d.s);
        if (d.z) { self.histBytes -= d.z.byteLength; d.z = null; }
        d.s = g; d.two = 0; d.m = 'b'; grabs.push(k);
      }
    });
    if (grabs.length) this.queueRead(r, grabs);
    this.dirty = this.full = true;
  };
  Surface.prototype.swapRec = function (r) {
    var self = this, out = {};
    if (r.d) { this.xorRec(r); return; }
    if (r.snap) {
      var cur = this.newSnap();
      this.copyRect(this.fbMain, cur, 0, 0, this.W, this.H, 0, 0, 2);
      this.copyRect(r.snap, this.fbMain, 0, 0, this.W, this.H, 0, 0, 2);
      this.snapPool.push(r.snap); r.snap = cur;
      this.dirty = this.full = true;
      return;
    }
    Object.keys(r.t).forEach(function (k) {
      var slot = r.t[k]; self.inked.add(k); if (slot < 0) { out[k] = -1; return; }
      var xy = k.split(','), x = +xy[0] * TILE, y = +xy[1] * TILE, w = Math.min(TILE, self.W - x), h = Math.min(TILE, self.H - y);
      var cur = self.page();
      while (cur < 0 && self.undo.length) { self.dropRec(self.undo.shift()); cur = self.page(); }
      if (cur >= 0) { var c = self.slotAt(cur); self.copyRect(self.fbMain, c.fb, x, y, w, h, c.x, c.y, 2); }
      var s = self.slotAt(slot);
      self.copyRect(s.fb, self.fbMain, s.x, s.y, w, h, x, y, 2);
      self.free.push(slot);
      out[k] = cur;
    });
    r.t = out;
    this.dirty = this.full = true;
  };
  Surface.prototype.step = function (dir) {
    if (this.q && this.q.length) this.flush();
    if (this.rec) this.end();
    var from = dir < 0 ? this.undo : this.redo, to = dir < 0 ? this.redo : this.undo;
    var r = from.pop(); if (!r) return false;
    if (r === this.wetRec) this.wetRec = null;
    if (this.wet && r.box) this.clearWet(r.box);
    this.swapRec(r); to.push(r);
    return true;
  };
  Surface.prototype.history = function () {
    var n = 0; this.reads.forEach(function (b) { n += b.keys.length; }); this.toRead.forEach(function (e) { n += e[1].length; });
    return { steps: this.undo.length, redo: this.redo.length, bytes: this.histBytes, max: this.histMax, pending: n };
  };
  Surface.prototype.canUndo = function () { if (this.undo.length) return true; for (var i = 0; i < this.q.length; i++) if (this.q[i][0] === 'E') return true; return false; };
  Surface.prototype.canRedo = function () { return this.redo.length > 0; };

  Surface.prototype.clear = function (silent) {
    if (this.q && this.q.length) this.flush();
    var self = this, gl = this.gl;
    if (!silent) { this.beginSnap(); this.touchTiles([0, 0, this.W, this.H]); }
    this.draw(this.prog('init'), this.fbMain, this.W, this.H, null, function (p, g) { g.uniform4f(p.u.uV, 1, 1, 1, 0); });
    if (this.wcReady) [this.fbWA, this.fbWB].forEach(function (fb) { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.wet = null; this.wc = {}; this.wetT = null; this.dirty = this.full = true; this.inked = new Set();
    if (!silent) this.end();
  };

  Surface.prototype.setPaper = function (kind) {
    if (this.q && this.q.length) this.flush();
    var K = { smooth: 0, draw: 1, cold: 2, canvas: 3 }, self = this;
    if (!(kind in K)) kind = 'draw';
    this.paperKind = kind;
    var sc = Math.max(.75, this.W / 2048) * 1.15;
    this.draw(this.prog('paper'), this.fbPaper, this.W, this.H, null, function (p, g) { g.uniform1i(p.u.uKind, K[kind]); g.uniform1f(p.u.uScale, sc); g.uniform2f(p.u.uOff, 0, 0); });
    if (this.wcReady) this.paperSim();
    this.relief = { smooth: 1.6, draw: 2.4, cold: 3.6, canvas: 3.2 }[kind];
    this.tint = { smooth: [1, .995, .985], draw: [1, .99, .965], cold: [1, .985, .955], canvas: [.985, .975, .95] }[kind];
    this.dirty = this.full = true;
  };

  Surface.prototype.setLines = function (src, sharp) {
    if (!src) { this.hasLines = false; this.dirty = this.full = true; return; }
    this.upload(this.lineT, src, [this.gl.R8, this.gl.RED, this.gl.UNSIGNED_BYTE]);
    this.hasLines = true; this.lineSharp = sharp || (this.lineT.w / this.W); this.dirty = this.full = true;
  };
  Surface.prototype.setGuide = function (src, a) {
    if (src) this.upload(this.guideT, src, [this.gl.RGBA8, this.gl.RGBA, this.gl.UNSIGNED_BYTE]);
    this.guideA = src || a ? (a == null ? .5 : a) : 0; this.dirty = this.full = true;
  };
  Surface.prototype.setRef = function (src) { if (src) { this.upload(this.refT, src, [this.gl.RGBA8, this.gl.RGBA, this.gl.UNSIGNED_BYTE]); this.hasRef = true; } };
  Surface.prototype.setRefMix = function (k) { this.refMix = this.hasRef ? Math.max(0, Math.min(1, k)) : 0; this.dirty = this.full = true; };
  Surface.prototype.setMask = function (mask) { this.flush(); this.applyMask(mask); };
  Surface.prototype.applyMask = function (mask) {
    var gl = this.gl;
    if (!mask) { this.useMask = 0; return; }
    if (this.curMask !== mask && mask.r8) {
      gl.bindTexture(gl.TEXTURE_2D, this.maskT); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, mask.w, mask.h, 0, gl.RED, gl.UNSIGNED_BYTE, mask.r8);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4); this.maskT.w = mask.w; this.maskT.h = mask.h;
      this.curMask = mask;
    } else if (this.curMask !== mask) {
      if (!mask.white) {
        var w = document.createElement('canvas'); w.width = mask.w; w.height = mask.h; var x = w.getContext('2d');
        x.drawImage(mask.c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, mask.w, mask.h);
        mask.white = w;
      }
      this.upload(this.maskT, mask.white, [gl.R8, gl.RED, gl.UNSIGNED_BYTE]);
      this.curMask = mask;
    }
    this.maskRect = [mask.x, mask.y, mask.w, mask.h];
    this.useMask = 1;
  };
  Surface.prototype.setBlur = function (mask) {
    if (mask.blur === undefined && mask.mkBlur) { try { mask.blur = mask.mkBlur(); } catch (e) { mask.blur = null; } }
    if (!mask.blur) return false;
    this.upload(this.blurT, mask.blur, [this.gl.R8, this.gl.RED, this.gl.UNSIGNED_BYTE]);
    return true;
  };

  Surface.prototype.stroke = function (tool, hex, r, opt) {
    opt = opt || {};
    var rf = {
      graphite: function (q) { return (.82 + .25 * q.p); },
      pencil: function (q) { return (.82 + .25 * q.p); },
      pastel: function (q) { return (.75 + .4 * q.p); },
      crayon: function (q) { return (.8 + .3 * q.p); },
      oil: function (q) { return .7 + .4 * q.p; },
      wash: function (q) { return .5 + .65 * q.p; },
      eraser: function (q) { return .8 + .3 * q.p; },
      blend: function (q) { return .8 + .4 * q.p; },
      marker: function () { return 1; },
      ink: function (q) { return .7 + .45 * q.p; },
      gel: function (q) { return .85 + .2 * q.p; },
      airbrush: function () { return 1; }
    }[tool] || function () { return 1; };
    var rgb = hexToRgb(hex);
    var s = { tool: tool, rgb: rgb, r: r, rf: rf, seed: opt.seed != null ? opt.seed : Math.random() * 100, load: opt.load == null ? 1 : opt.load, grade: opt.grade || .7,
      mask: !!opt.mask, nib: opt.nib == null ? .6 : opt.nib, flow: opt.flow == null ? 1 : opt.flow, box: null, n: 0,
      mk: opt.maskObj !== undefined ? opt.maskObj : (this.useMask ? this.curMask : null),
      spec: TOOLS[tool] != null ? pigSpec(tool === 'graphite' ? [.34, .34, .37] : rgb) : null };
    this.op(['B', s]);
    return s;
  };

  Surface.prototype.op = function (o) {
    this.lastIn = performance.now();
    if (this.queued && (this.q.length || o[0] === 'D')) { this.q.push(o); return; }
    this.exec(o);
  };
  Surface.prototype.exec = function (o) {
    var s = o[1], gl = this.gl;
    if (o[0] === 'B') {
      this.begin();
      if (this.expBox) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbMain); gl.enable(gl.SCISSOR_TEST);
        var b = this.expBox; gl.scissor(b[0], b[1], b[2], b[3]);
        gl.drawBuffers([gl.NONE, gl.NONE, gl.COLOR_ATTACHMENT2]); gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
        gl.disable(gl.SCISSOR_TEST); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.expBox = null;
      }
      if (s.mk) this.applyMask(s.mk); else this.useMask = 0;
      s.live = true;
      return 64;
    }
    if (o[0] === 'D') return s.tool === 'wash' ? (this.wcDab(s, o[2], o[3], o[4]), 4096) : this.dabs(s, [o]);
    if (o[0] === 'E') { this.endNow(s); return 4096; }
    if (o[0] === 'A') { this.abortNow(s); return 4096; }
    return 0;
  };
  Surface.prototype.pump = function (budget) {
    var q = this.q, used = 0;
    while (q.length && used < budget) {
      var o = q[0];
      if (o[0] !== 'D' || !BATCH[o[1].tool]) { q.shift(); used += this.exec(o); continue; }
      var s = o[1], list = [];
      while (q.length && list.length < 12 && q[0][0] === 'D' && q[0][1] === s) list.push(q.shift());
      used += this.dabs(s, list);
    }
    return q.length;
  };
  Surface.prototype.flush = function () { if (this.q.length) this.pump(Infinity); };
  Surface.prototype.pending = function (s) {
    var out = [];
    for (var i = 0; i < this.q.length; i++) { var o = this.q[i]; if (o[1] === s && o[0] === 'D') out.push(o[3]); }
    return out;
  };

  Surface.prototype.dab = function (s, a, b, dwell) { this.op(['D', s, a, b, dwell || 0]); };

  Surface.prototype.dabs = function (s, list) {
    var self = this, n = 0, seg = this._seg || (this._seg = { s: new Float32Array(48), r: new Float32Array(48), t: new Float32Array(48), b: new Float32Array(48) });
    var ub = null, cost = 0, tid = TOOLS[s.tool];
    for (var i = 0; i < list.length; i++) {
      var a = list[i][2], b = list[i][3], dwell = list[i][4];
      this.nDab = (this.nDab || 0) + 1;
      var ra = Math.max(.5, s.r * s.rf(a)), rb = Math.max(.5, s.r * s.rf(b));
      var tz = b.tz || 0, az = b.az == null ? (s.az || 0) : b.az;
      var elong = (s.tool === 'pencil' || s.tool === 'graphite') ? 1 + 2.4 * tz : (s.tool === 'pastel' || s.tool === 'crayon') ? 1 + 1.5 * tz : 1;
      var pad = Math.max(ra, rb) * elong * (s.tool === 'pastel' ? 1.8 : 1) + 3;
      if (s.tool === 'blend' || s.tool === 'oil') pad += 4;
      var rect = this.clip([Math.min(a.x, b.x) - pad, Math.min(a.y, b.y) - pad, Math.abs(b.x - a.x) + pad * 2, Math.abs(b.y - a.y) + pad * 2]);
      var seed = s.seed + (s.tool === 'airbrush' ? s.n * .013 : 0);
      s.n++; s.drawn = b;
      if (!rect) continue;
      var k = n * 4;
      seg.s[k] = a.x; seg.s[k + 1] = a.y; seg.s[k + 2] = b.x; seg.s[k + 3] = b.y;
      seg.r[k] = ra; seg.r[k + 1] = rb; seg.r[k + 2] = a.p; seg.r[k + 3] = b.p;
      seg.t[k] = tz; seg.t[k + 1] = az; seg.t[k + 2] = dwell || 0; seg.t[k + 3] = seed;
      seg.b[k] = rect[0]; seg.b[k + 1] = rect[1]; seg.b[k + 2] = rect[2]; seg.b[k + 3] = rect[3];
      ub = union(ub, rect); cost += rect[2] * rect[3]; n++;
    }
    if (!n) return 16;
    var done = this.pass('dab:' + tid, ub, function (p, g) {
      if (p._spec !== s.spec) { g.uniform4fv(p.u.uSpec, s.spec); p._spec = s.spec; }
      g.uniform4fv(p.u.uSeg, seg.s); g.uniform4fv(p.u.uRP, seg.r); g.uniform4fv(p.u.uTA, seg.t); g.uniform4fv(p.u.uBox, seg.b);
      g.uniform1i(p.u.uN, n); g.uniform1f(p.u.uQ, self.hdr ? 1 : 0);
      g.uniform1f(p.u.uNib, s.nib); g.uniform3fv(p.u.uColor, s.rgb); if (p.u.uTool) g.uniform1i(p.u.uTool, tid);
      g.uniform1f(p.u.uLoad, s.load); g.uniform1f(p.u.uGrade, s.grade); g.uniform1f(p.u.uK, KCOV[s.tool] || 1); g.uniform1f(p.u.uFlow, s.flow);
    });
    if (done) { s.box = union(s.box, done); this.expBox = union(this.expBox, done); }
    if (s.tool === 'oil') { var a0 = list[0][2], b0 = list[0][3]; this.oilT = 300; s.load = Math.max(.08, s.load - .0012 * Math.hypot(b0.x - a0.x, b0.y - a0.y) / Math.max(4, s.r)); }
    return cost;
  };

  Surface.prototype.abort = function (s) { this.op(['A', s]); };
  Surface.prototype.abortNow = function (s) {
    var r = this.rec; this.rec = null; this.useMask = 0;
    if (s && s.tool === 'wash' && s.box) this.clearWet(s.box);
    if (r && (r.snap || Object.keys(r.t).length)) { this.swapRec(r); this.dropRec(r); }
    if (s) s.live = false;
    this.dirty = this.full = true;
  };

  Surface.prototype.startStroke = function (s, pt) { pt = qpt(pt); s.last = pt; s.ctrl = null; this.dab(s, pt, pt, DWELL[s.tool] || 0); };
  Surface.prototype.feed = function (s, p) {
    p = qpt(p);
    var c = s.ctrl || s.last, L = s.last;
    if (Math.hypot(p.x - c.x, p.y - c.y) < Math.max(.35, s.r * .04)) return false;
    if (!s.ctrl) { s.ctrl = p; return true; }
    var m = { x: (c.x + p.x) / 2, y: (c.y + p.y) / 2, p: (c.p + p.p) / 2, tz: (c.tz + p.tz) / 2, az: p.az };
    var len = Math.hypot(c.x - L.x, c.y - L.y) + Math.hypot(m.x - c.x, m.y - c.y);
    var n = Math.max(1, Math.ceil(len / Math.max(1.2, s.r * .6))), prev = L;
    for (var i = 1; i <= n; i++) {
      var t = i / n, u = 1 - t;
      var q = { x: u * u * L.x + 2 * u * t * c.x + t * t * m.x, y: u * u * L.y + 2 * u * t * c.y + t * t * m.y, p: u * L.p + t * m.p, tz: u * L.tz + t * m.tz, az: m.az };
      this.dab(s, prev, q); prev = q;
    }
    s.last = m; s.ctrl = p;
    return true;
  };
  Surface.prototype.feedEnd = function (s) { if (!s.ctrl) return false; this.dab(s, s.last, s.ctrl); return true; };
  Surface.prototype.dwell = function (s, dt) { dt = qdt(dt); var at = s.ctrl || s.last; if (at) this.dab(s, at, at, dt * (s.tool === 'wash' ? 1.2 : 2.2)); return dt; };
  Surface.prototype.group = function (on) { this.note(['G', on ? 1 : 0]); this._lg = (this._lg || 0) + 1; try { if (on) this.beginSnap(); else this.end(); } finally { this._lg--; } };

  Surface.prototype.endStroke = function (s) { this.op(['E', s]); };
  Surface.prototype.endNow = function (s) {
    if (s) s.live = false;
    if (s && s.tool === 'marker' && s.box) {
      this.pass('rim', [s.box[0] - 6, s.box[1] - 6, s.box[2] + 12, s.box[3] + 12], function (p, g) {
        g.uniform1f(p.u.uAmt, .8 * s.flow); g.uniform3fv(p.u.uColor, s.rgb);
      }, true);
    }
    this.useMask = 0;
    if (s && s.tool === 'wash' && this.wet) { this.wetRec = this.rec; this.rec = null; if (this.wetRec && this.wetRec !== this.undo[this.undo.length - 1]) this.undo.push(this.wetRec); return this.wetRec; }
    return this.end();
  };

  Surface.prototype.fillRegion = function (mask, tool, hex, opt) {
    if (this.q && this.q.length) this.flush();
    opt = opt || {}; if (opt.seed == null) opt.seed = Math.random() * 100;
    var self = this, rgb = hexToRgb(hex);
    if (tool !== 'wash') this.begin();
    this.applyMask(mask);
    var shade = !!opt.shade && this.setBlur(mask);
    var rect = [mask.x, mask.y, mask.w, mask.h];
    if (tool === 'wash') {
      var cx = mask.x + mask.w / 2, cy = mask.y + mask.h / 2, r = Math.hypot(mask.w, mask.h) / 2 + 4;
      var st = this.stroke('wash', hex, r, { load: opt.load == null ? .8 : opt.load, mask: true, seed: opt.seed });
      st.rf = function () { return 1; };
      this.wcDab(st, { x: cx, y: cy, p: .7 }, { x: cx, y: cy, p: .7 }, 1);
      this.useMask = 0;
      this.wetRec = this.rec; this.rec = null; this.undo.push(this.wetRec);
      return rect;
    }
    var L = Math.max(mask.w, mask.h) * .05, seed = opt.seed;
    var ang = opt.light == null ? -2.3 : opt.light;
    this.pass('fill:' + (TOOLS[tool] == null ? 7 : TOOLS[tool]) + ':0', rect, function (p, g) {
      self.bindTex(p, 'uBlur', self.blurT, 5);
      g.uniform3fv(p.u.uColor, rgb); g.uniform1i(p.u.uTool, TOOLS[tool] == null ? 7 : TOOLS[tool]); g.uniform1f(p.u.uSeed, seed);
      g.uniform1f(p.u.uShade, shade ? 1 : 0); g.uniform1f(p.u.uAmt, opt.amt == null ? 1 : opt.amt); g.uniform1f(p.u.uGrade, opt.grade || .7);
      g.uniform2f(p.u.uLight, Math.cos(ang) * L, Math.sin(ang) * L); g.uniform1f(p.u.uUseRef, 0);
    }, true);
    this.useMask = 0;
    this.end();
    return rect;
  };

  var REF_PASSES = { pencil: 6, graphite: 6, crayon: 5, pastel: 5, oil: 3, marker: 2, wash: 3, gel: 2, ink: 1, airbrush: 3 };
  var REF_AMT = { pencil: .62, graphite: .6, crayon: .7, pastel: .72, oil: .85, marker: .8, wash: .75, gel: .85, ink: 1, airbrush: .6 };
  Surface.prototype.refPasses = function (tool) { return REF_PASSES[tool] || 3; };
  Surface.prototype.refPass = function (mask, tool, k, passes) {
    if (this.q && this.q.length) this.flush();
    if (!this.hasRef || !mask) return;
    var self = this, id = tool === 'wash' ? 11 : (TOOLS[tool] == null ? 7 : TOOLS[tool]), amt = REF_AMT[tool] || .7;
    this.applyMask(mask);
    this.pass('fill:' + id + ':1', [mask.x, mask.y, mask.w, mask.h], function (p, g) {
      self.bindTex(p, 'uBlur', self.blurT, 5); self.bindTex(p, 'uRefT', self.refT, 6); self.bindTex(p, 'uLineT', self.lineT, 7);
      g.uniform3fv(p.u.uColor, [0, 0, 0]); g.uniform1i(p.u.uTool, id); g.uniform1f(p.u.uSeed, k * 7.31 + 1.7);
      g.uniform1f(p.u.uShade, 0); g.uniform1f(p.u.uAmt, amt); g.uniform1f(p.u.uGrade, .9); g.uniform1f(p.u.uUseRef, 1);
      g.uniform1f(p.u.uDepth, .35 * k / Math.max(1, passes - 1)); g.uniform1f(p.u.uFinish, 0); g.uniform3fv(p.u.uTint, self.tint);
    }, true);
    this.useMask = 0;
  };

  Surface.prototype.setOrder = function (ord) {
    var gl = this.gl;
    if (!this.ordT) this.ordT = this.tex(this.W, this.H, [gl.R32F, gl.RED, gl.FLOAT], false);
    gl.bindTexture(gl.TEXTURE_2D, this.ordT);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.W, this.H, gl.RED, gl.FLOAT, ord);
    this.hasOrd = true;
  };
  Surface.prototype.refRank = function (tool, w0, w1, rect, passes) {
    if (this.q && this.q.length) this.flush();
    if (!this.hasRef || !this.hasOrd) return null;
    var self = this, id = tool === 'wash' ? 11 : (TOOLS[tool] == null ? 7 : TOOLS[tool]), amt = REF_AMT[tool] || .7;
    this.useMask = 0;
    return this.pass('fill:' + id + ':2', rect, function (p, g) {
      self.bindTex(p, 'uOrd', self.ordT, 5); self.bindTex(p, 'uRefT', self.refT, 6); self.bindTex(p, 'uLineT', self.lineT, 7);
      g.uniform3fv(p.u.uColor, [0, 0, 0]); g.uniform1f(p.u.uAmt, amt); g.uniform2f(p.u.uWin, w0, w1);
      g.uniform1f(p.u.uPasses, passes || REF_PASSES[tool] || 3); g.uniform3fv(p.u.uTint, self.tint);
    }, true);
  };
  Surface.prototype.paintRef = function (tool, opt) {
    if (this.q && this.q.length) this.flush();
    opt = opt || {};
    if (!this.hasRef) return false;
    var self = this, id = tool === 'wash' ? 11 : (TOOLS[tool] == null ? 7 : TOOLS[tool]);
    var passes = opt.passes || REF_PASSES[tool] || 3;
    var amt = opt.amt || REF_AMT[tool] || .7;
    this.beginSnap(); this.useMask = 0;
    for (var k = 0; k < passes; k++) {
      this.pass('fill:' + id + ':1', [0, 0, this.W, this.H], function (p, g) {
        self.bindTex(p, 'uBlur', self.blurT, 5); self.bindTex(p, 'uRefT', self.refT, 6); self.bindTex(p, 'uLineT', self.lineT, 7);
        g.uniform3fv(p.u.uColor, [0, 0, 0]); g.uniform1i(p.u.uTool, id); g.uniform1f(p.u.uSeed, k * 7.31 + 1.7);
        g.uniform1f(p.u.uShade, 0); g.uniform1f(p.u.uAmt, amt); g.uniform1f(p.u.uGrade, .9); g.uniform1f(p.u.uUseRef, 1);
        g.uniform1f(p.u.uDepth, .35 * k / Math.max(1, passes - 1)); g.uniform1f(p.u.uFinish, k === passes - 1 ? (opt.finish || 0) : 0); g.uniform3fv(p.u.uTint, self.tint);
      }, true);
    }
    this.end();
    return true;
  };

  Surface.prototype.initWC = function () {
    if (this.wcReady) return;
    var fmt = this.fmt, sw = this.sw, sh = this.sh;
    this.wW = [this.tex(sw, sh, fmt, true), this.tex(sw, sh, fmt, true)];
    this.wP = [this.tex(sw, sh, fmt, true), this.tex(sw, sh, fmt, true)];
    this.fbWA = this.fbo([this.wW[0], this.wP[0]]); this.fbWB = this.fbo([this.wW[1], this.wP[1]]);
    var gl = this.gl;
    [this.fbWA, this.fbWB].forEach(function (fb) { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); });
    this.paperS = this.tex(sw, sh, [gl.R8, gl.RED, gl.UNSIGNED_BYTE], true); this.fbPaperS = this.fbo([this.paperS]);
    this.wcReady = true;
    this.paperSim();
  };
  Surface.prototype.paperSim = function () {
    var K = { smooth: 0, draw: 1, cold: 2, canvas: 3 }, self = this, sc = Math.max(.75, this.W / 2048) * 1.15;
    this.draw(this.prog('paper'), this.fbPaperS, this.sw, this.sh, null, function (p, g) { g.uniform1i(p.u.uKind, K[self.paperKind]); g.uniform1f(p.u.uScale, sc * self.k); g.uniform2f(p.u.uOff, 0, 0); });
  };

  Surface.prototype.wcDab = function (s, a, b, dwell) {
    this.initWC();
    var self = this, k = this.k, ra = s.r * s.rf(a), rb = s.r * s.rf(b);
    var pad = Math.max(ra, rb) * 1.25 + 3;
    var r = [(Math.min(a.x, b.x) - pad) * k, (Math.min(a.y, b.y) - pad) * k, (Math.abs(b.x - a.x) + pad * 2) * k, (Math.abs(b.y - a.y) + pad * 2) * k];
    var x0 = Math.max(0, Math.floor(r[0])), y0 = Math.max(0, Math.floor(r[1])), x1 = Math.min(this.sw, Math.ceil(r[0] + r[2])), y1 = Math.min(this.sh, Math.ceil(r[1] + r[3]));
    if (x1 <= x0 || y1 <= y0) return;
    var rs = [x0, y0, x1 - x0, y1 - y0], mr = this.maskRect;
    this.draw(this.prog('wcAdd'), this.fbWB, this.sw, this.sh, rs, function (p, g) {
      self.bindTex(p, 'uW', self.wW[0], 0); self.bindTex(p, 'uP', self.wP[0], 1); self.bindTex(p, 'uMask', self.maskT, 2);
      g.uniform4f(p.u.uSeg, a.x, a.y, b.x, b.y); g.uniform2f(p.u.uRad, ra, rb); g.uniform2f(p.u.uPress, a.p, b.p);
      g.uniform3fv(p.u.uColor, s.rgb); g.uniform1f(p.u.uLoad, s.load); g.uniform1f(p.u.uSeed, s.seed); g.uniform1f(p.u.uK, k);
      g.uniform1f(p.u.uDwell, dwell || 0); g.uniform1f(p.u.uUseMask, s.mask ? 1 : 0); g.uniform4fv(p.u.uMaskRect, mr);
    });
    this.copyRect(this.fbWB, this.fbWA, rs[0], rs[1], rs[2], rs[3], rs[0], rs[1], 2);
    var full = [rs[0] / k, rs[1] / k, rs[2] / k, rs[3] / k];
    this.touchTiles(this.clip([full[0] - 32, full[1] - 32, full[2] + 64, full[3] + 64]) || full);
    this.wetMark(full);
    s.box = union(s.box, full);
    s.load = Math.max(.12, s.load - .001 * Math.hypot(b.x - a.x, b.y - a.y) / Math.max(2, ra));
    this.addPart(full); this.dirty = true;
  };

  var WCELL = 128;
  Surface.prototype.wetMark = function (r) {
    var c = this.wc || (this.wc = {}), C = WCELL, pad = 24 / this.k, now = this.simT || 0, nx = Math.ceil(this.W / C), ny = Math.ceil(this.H / C);
    var x0 = Math.max(0, Math.floor((r[0] - pad) / C)), y0 = Math.max(0, Math.floor((r[1] - pad) / C));
    var x1 = Math.min(nx - 1, Math.floor((r[0] + r[2] + pad) / C)), y1 = Math.min(ny - 1, Math.floor((r[1] + r[3] + pad) / C));
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) c[y * nx + x] = now;
    this.wetT = union(this.wetT, [r[0] - pad, r[1] - pad, r[2] + pad * 2, r[3] + pad * 2]);
    this.wetAt = now; this.wetBox();
  };
  Surface.prototype.wetBox = function () {
    var c = this.wc || {}, C = WCELL, nx = Math.ceil(this.W / C), b = null;
    for (var key in c) { var i = +key, x = i % nx, y = (i - x) / nx; b = union(b, [x * C, y * C, C, C]); }
    this.wet = b ? this.clip(b) : null;
    if (!this.wet) this.wetT = null;
  };
  Surface.prototype.wetRuns = function () {
    var c = this.wc || {}, nx = Math.ceil(this.W / WCELL), now = this.simT || 0, dry = this.dryMs || 6500, all = this._dryAll, rows = [], cur = null;
    Object.keys(c).map(Number).sort(function (a, b) { return a - b; }).forEach(function (i) {
      var x = i % nx, y = (i - x) / nx, fin = all || now - c[i] > dry ? 1 : 0;
      if (cur && cur.y0 === y && cur.x1 === x && cur.fin === fin) { cur.x1++; cur.keys.push(i); return; }
      cur = { x0: x, x1: x + 1, y0: y, y1: y + 1, fin: fin, keys: [i] }; rows.push(cur);
    });
    var out = [], last = {};
    rows.forEach(function (r) {
      var id = r.x0 + ',' + r.x1 + ',' + r.fin, q = last[id];
      if (q && q.y1 === r.y0) { q.y1 = r.y1; q.keys = q.keys.concat(r.keys); } else { last[id] = r; out.push(r); }
    });
    out.forEach(function (r) { r.cov = r.keys.length; });
    var hit = true;
    while (hit) {
      hit = false;
      for (var i = 0; i < out.length && !hit; i++) for (var j = i + 1; j < out.length; j++) {
        var a = out[i], b = out[j];
        if (a.fin !== b.fin || a.x0 > b.x1 || b.x0 > a.x1 || a.y0 > b.y1 || b.y0 > a.y1) continue;
        var x0 = Math.min(a.x0, b.x0), y0 = Math.min(a.y0, b.y0), x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1);
        if ((x1 - x0) * (y1 - y0) > (a.cov + b.cov) * 1.5) continue;
        var bad = false;
        for (var y = y0; y < y1 && !bad; y++) for (var x = x0; x < x1; x++) { var key = y * nx + x; if (key in c && (all || now - c[key] > dry ? 1 : 0) !== a.fin) { bad = true; break; } }
        if (bad) continue;
        out[i] = { x0: x0, y0: y0, x1: x1, y1: y1, fin: a.fin, keys: a.keys.concat(b.keys), cov: a.cov + b.cov }; out.splice(j, 1); hit = true; break;
      }
    }
    return out;
  };
  Surface.prototype.tick = function (dt) {
    if (!this.wet) return false;
    var gl = this.gl, self = this, k = this.k, C = WCELL;
    dt = qdt(Math.min(.05, dt || .016)); this.note(['T', Math.round(dt * Q_T)]); this.simT = (this.simT || 0) + dt * 1000;
    var runs = this.wetRuns();
    if (!runs.length) { this.wet = null; return false; }
    this.wcN = runs.length;
    var T = this.wetT || [0, 0, this.W, this.H], tx0 = Math.floor(T[0] * k), ty0 = Math.floor(T[1] * k), tx1 = Math.ceil((T[0] + T[2]) * k), ty1 = Math.ceil((T[1] + T[3]) * k);
    var sim = runs.map(function (r) {
      var x0 = Math.max(tx0, Math.floor(r.x0 * C * k)), y0 = Math.max(ty0, Math.floor(r.y0 * C * k)), x1 = Math.min(self.sw, tx1, Math.ceil(r.x1 * C * k)), y1 = Math.min(self.sh, ty1, Math.ceil(r.y1 * C * k));
      return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
    });
    runs = runs.filter(function (r, i) { if (sim[i]) return true; if (r.fin) r.keys.forEach(function (key) { delete self.wc[key]; }); return false; });
    sim = sim.filter(Boolean);
    if (!runs.length) { this.wetBox(); if (!this.wet) { var w0 = this.wetRec; this.wetRec = null; this.dirty = this.full = true; if (w0 && this.undo[this.undo.length - 1] === w0) { this.seal(w0); this.trim(); } } return !!this.wet; }
    var step = this.prog('wcStep');
    runs.forEach(function (r, i) {
      self.draw(step, self.fbWB, self.sw, self.sh, sim[i], function (p, g) {
        self.bindTex(p, 'uW', self.wW[0], 0); self.bindTex(p, 'uP', self.wP[0], 1); self.bindTex(p, 'uPaperS', self.paperS, 2);
        g.uniform1f(p.u.uDt, dt); g.uniform2f(p.u.uSizeS, self.sw, self.sh); g.uniform1f(p.u.uFinal, r.fin);
      });
    });
    var fb = this.fbWA; this.fbWA = this.fbWB; this.fbWB = fb; this.wW.reverse(); this.wP.reverse();
    runs.forEach(function (r, i) {
      var q = sim[i];
      self.pass('wcDep', [q[0] / k, q[1] / k, q[2] / k, q[3] / k], function (p, g) {
        self.bindTex(p, 'uW', self.wW[0], 5); self.bindTex(p, 'uP', self.wP[0], 6);
        g.uniform1f(p.u.uDt, dt); g.uniform1f(p.u.uK, k); g.uniform2f(p.u.uSizeS, self.sw, self.sh); g.uniform1f(p.u.uFinal, r.fin);
      }, true);
    });
    var gone = 0;
    runs.forEach(function (r, i) {
      if (!r.fin) return;
      var q = sim[i]; gone++;
      gl.enable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0);
      [self.fbWA, self.fbWB].forEach(function (fb) { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.scissor(q[0], q[1], q[2], q[3]); gl.clear(gl.COLOR_BUFFER_BIT); });
      gl.disable(gl.SCISSOR_TEST);
      r.keys.forEach(function (key) { delete self.wc[key]; });
    });
    if (gone) { gl.bindFramebuffer(gl.FRAMEBUFFER, null); this.wetBox(); }
    if (!this.wet) {
      var wr = this.wetRec; this.wetRec = null; this.dirty = this.full = true;
      if (wr && this.undo[this.undo.length - 1] === wr) { this.seal(wr); this.trim(); }
      return false;
    }
    return true;
  };
  Surface.prototype.drain = function (r, keep) {
    if (keep >= 1) return;
    var self = this;
    this.draw(this.prog('wcDrain'), this.fbWB, this.sw, this.sh, r, function (p, g) { self.bindTex(p, 'uW', self.wW[0], 0); self.bindTex(p, 'uP', self.wP[0], 1); g.uniform1f(p.u.uKeep, keep); });
    this.copyRect(this.fbWB, this.fbWA, r[0], r[1], r[2], r[3], r[0], r[1], 2);
  };
  Surface.prototype.dryNow = function () {
    if (this.q && this.q.length) this.flush();
    if (!this.wet) return;
    this._dryAll = true; try { this.tick(.016); } finally { this._dryAll = false; }
  };
  Surface.prototype.clearWet = function (rect) {
    if (!this.wcReady) return;
    var gl = this.gl, k = this.k;
    [this.fbWA, this.fbWB].forEach(function (fb) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.enable(gl.SCISSOR_TEST);
      gl.scissor(Math.floor(rect[0] * k) - 2, Math.floor(rect[1] * k) - 2, Math.ceil(rect[2] * k) + 4, Math.ceil(rect[3] * k) + 4);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.disable(gl.SCISSOR_TEST);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  Surface.prototype.age = function (sec) {
    if (!this.oilT) return false;
    this.oilT = Math.max(0, this.oilT - sec);
    return this.oilT > 0;
  };

  Surface.prototype.resize = function (w, h) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    this.view.w = w; this.view.h = h; this.dirty = this.full = true;
  };
  Surface.prototype.setView = function (s, x, y) { this.view.s = s; this.view.x = x; this.view.y = y; this.dirty = this.full = true; };
  Surface.prototype.setFlat = function (on) { this.flat = !!on; this.dirty = this.full = true; };
  Surface.prototype.setMoving = function (on) { if (this.moving === !!on) return; this.moving = !!on; if (!on && !this.flat) this.dirty = this.full = true; };
  Surface.prototype.setDesk = function (rgb) { this.desk = rgb; this.dirty = this.full = true; };

  Surface.prototype.comp = function (fb, vw, vh, s, x, y, flip, opt) {
    var self = this;
    opt = opt || {};
    this.draw(this.prog('comp'), fb, vw, vh, fb ? null : this.compRect, function (p, g) {
      self.bindTex(p, 'uPig', self.pig, 0); self.bindTex(p, 'uAux', self.aux, 1); self.bindTex(p, 'uPaper', self.paperT, 2);
      self.bindTex(p, 'uLine', self.lineT, 3); self.bindTex(p, 'uGuide', self.guideT, 4); self.bindTex(p, 'uRef', self.refT, 5);
      if (self.wcReady) { self.bindTex(p, 'uW', self.wW[0], 6); self.bindTex(p, 'uP', self.wP[0], 7); }
      g.uniform2f(p.u.uDoc, self.W, self.H); g.uniform2f(p.u.uView, vw, vh); g.uniform3f(p.u.uView2, s, x, y);
      g.uniform1f(p.u.uFlip, flip ? 1 : 0); g.uniform1f(p.u.uWet, self.wet && self.wcReady ? 1 : 0); g.uniform1f(p.u.uRelief, self.relief * (opt.relief == null ? 1 : opt.relief));
      g.uniform1f(p.u.uRef1, opt.ref == null ? self.refMix : opt.ref); g.uniform1f(p.u.uGuideA, opt.guide == null ? self.guideA : opt.guide);
      g.uniform1f(p.u.uLines, (opt.lines == null ? true : opt.lines) && self.hasLines ? 1 : 0); g.uniform1f(p.u.uDesk, opt.desk == null ? 1 : opt.desk);
      g.uniform1f(p.u.uPaperOn, opt.paper == null ? 1 : opt.paper); g.uniform1f(p.u.uK, self.k); g.uniform2f(p.u.uSizeS, self.sw, self.sh);
      g.uniform1f(p.u.uLineSharp, self.lineSharp); g.uniform1f(p.u.uNear, s >= 8 && !opt.smooth ? 1 : 0); g.uniform1f(p.u.uCubic, fb || self.flat || self.moving ? 0 : 1);
      g.uniform3fv(p.u.uTint, self.tint); g.uniform3fv(p.u.uDeskC, self.desk); g.uniform3fv(p.u.uInk, self.ink);
    });
  };
  function mergeRects(list, gap) {
    var r = list.map(function (q) { return [q[0], q[1], q[2], q[3], q[4] || q[2] * q[3]]; }), hit = true;
    while (hit) {
      hit = false;
      for (var i = 0; i < r.length && !hit; i++) for (var j = i + 1; j < r.length; j++) {
        var a = r[i], b = r[j];
        if (a[0] - gap > b[0] + b[2] || b[0] - gap > a[0] + a[2] || a[1] - gap > b[1] + b[3] || b[1] - gap > a[1] + a[3]) continue;
        var u = union(a, b), ua = u[2] * u[3];
        if (ua > (a[4] + b[4]) * 1.3 + gap * gap * 4) continue;
        u[4] = Math.min(ua, a[4] + b[4]); r[i] = u; r.splice(j, 1); hit = true; break;
      }
    }
    return r;
  }
  Surface.prototype.addPart = function (r) {
    this.part = union(this.part, r);
    var p = this.parts || (this.parts = []);
    p.push(r.slice());
    if (p.length >= 64) { p = this.parts = mergeRects(p, 16); if (p.length > 32) this.parts = [this.part.slice()]; }
  };
  Surface.prototype.render = function (budgeted) {
    if (!budgeted && this.q.length) this.flush();
    var v = this.view, P = this.part, list = null;
    if (!this.full && P) {
      var pad = Math.ceil(v.s) + 3, area = 0;
      var scr = function (q) {
        var x0 = Math.max(0, Math.floor(v.x + q[0] * v.s) - pad), x1 = Math.min(v.w, Math.ceil(v.x + (q[0] + q[2]) * v.s) + pad);
        var y0 = Math.max(0, Math.floor(v.y + q[1] * v.s) - pad), y1 = Math.min(v.h, Math.ceil(v.y + (q[1] + q[3]) * v.s) + pad);
        return x1 > x0 && y1 > y0 ? [x0, v.h - y1, x1 - x0, y1 - y0] : null;
      };
      var rs = mergeRects(this.parts && this.parts.length ? this.parts : [P], 16);
      rs.forEach(function (q) { area += q[2] * q[3]; });
      list = (rs.length > 1 && rs.length <= 32 && area < P[2] * P[3] * .8 ? rs : [P]).map(scr).filter(Boolean); this.nParts = [rs.length, Math.round(area / (P[2] * P[3]) * 100)];
      if (!list.length) { this.part = this.parts = null; this.dirty = false; return; }
    }
    this.stat = this.stat || { px: 0, n: 0, full: 0 };
    if (!list) { this.compRect = null; this.comp(null, v.w, v.h, v.s, v.x, v.y, true); this.stat.px += v.w * v.h; this.stat.full++; }
    else for (var i = 0; i < list.length; i++) { this.compRect = list[i]; this.comp(null, v.w, v.h, v.s, v.x, v.y, true); this.stat.px += list[i][2] * list[i][3]; }
    this.compRect = null; this.stat.n++;
    this.part = this.parts = null; this.full = false; this.dirty = false;
  };
  Surface.prototype.timeBegin = function () {
    var gl = this.gl;
    if (this.tq === undefined) this.tq = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    if (!this.tq || this.tqa) return;
    this.tqa = gl.createQuery(); gl.beginQuery(this.tq.TIME_ELAPSED_EXT, this.tqa);
  };
  Surface.prototype.timeEnd = function () {
    var gl = this.gl, x = this.tq, qs = this.tqs || (this.tqs = []), g = this.gpuT || (this.gpuT = []);
    if (!x || !this.tqa) return;
    gl.endQuery(x.TIME_ELAPSED_EXT); qs.push(this.tqa); this.tqa = null;
    var bad = qs.length && gl.getParameter(x.GPU_DISJOINT_EXT);
    while (qs.length && gl.getQueryParameter(qs[0], gl.QUERY_RESULT_AVAILABLE)) {
      var q = qs.shift(), ms = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; gl.deleteQuery(q);
      if (bad) continue;
      g.push(ms); if (g.length > 60) g.shift();
      if (this.gdiag) this.gdiag.push(ms);
      if (this.glab) this.glab.push(ms);
    }
  };
  Surface.prototype.gpuAvg = function () {
    var g = this.gpuT; if (!g || g.length < 20) return null;
    for (var i = 0, s = 0; i < g.length; i++) s += g[i];
    return s / g.length;
  };

  Surface.prototype.exportCanvas = function (opt) {
    if (this.q && this.q.length) this.flush();
    opt = opt || {};
    var gl = this.gl, W = this.W, H = this.H, sc = opt.scale || 1, ow = Math.round(W * sc), oh = Math.round(H * sc);
    var t = this.tex(ow, oh, [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE]), fb = this.fbo([t]);
    if (opt.layer) {
      var self = this;
      this.draw(this.prog('pigout'), fb, ow, oh, null, function (p) { self.bindTex(p, 'uPig', self.pig, 0); });
    } else {
      this.comp(fb, ow, oh, sc, 0, 0, false, { ref: 0, guide: opt.guide || 0, desk: 1, lines: opt.lines !== false, paper: opt.paper === false ? 0 : 1, relief: opt.relief });
    }
    var px = new Uint8Array(ow * oh * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.readPixels(0, 0, ow, oh, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb); gl.deleteTexture(t);
    var c = document.createElement('canvas'); c.width = ow; c.height = oh;
    var x = c.getContext('2d'), id = x.createImageData(ow, oh); id.data.set(px); x.putImageData(id, 0, 0);
    this.dirty = this.full = true;
    return c;
  };

  Surface.prototype.loadPaint = function (img) {
    if (this.q && this.q.length) this.flush();
    var gl = this.gl, self = this, t = this.tex(4, 4, [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE], true);
    this.upload(t, img, [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE]);
    this.pass('load', [0, 0, this.W, this.H], function (p, g) { self.bindTex(p, 'uImg', t, 6); g.uniform2f(p.u.uSize, self.W, self.H); });
    gl.deleteTexture(t);
    this.undo.concat(this.redo).forEach(function (r) { self.dropRec(r); });
    this.undo = []; this.redo = [];
  };

  Surface.prototype.sample = function (x, y) {
    if (this.q && this.q.length) this.flush();
    var gl = this.gl, px = new Uint8Array(4), t = this.tex(1, 1, [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE]), fb = this.fbo([t]), self = this;
    this.comp(fb, 1, 1, 1, -Math.floor(x) - .0, -Math.floor(y) - .0, false, { ref: 0, guide: 0, lines: false, paper: 0 });
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb); gl.deleteTexture(t);
    this.dirty = this.full = true;
    return [px[0], px[1], px[2]];
  };

  function f2h(f) {
    var u = new Uint32Array(f.buffer, f.byteOffset, f.length), o = new Uint16Array(f.length);
    for (var i = 0; i < u.length; i++) {
      var x = u[i], s = (x >>> 16) & 0x8000, e = ((x >>> 23) & 255) - 112, m = x & 0x7fffff;
      if (e <= 0) o[i] = e < -10 ? s : s | ((m | 0x800000) >>> (14 - e));
      else if (e >= 31) o[i] = s | 0x7c00 | (m ? 0x200 : 0);
      else o[i] = s | (e << 10) | (m >>> 13);
    }
    return o;
  }
  function h2f(h) {
    var e = (h >>> 10) & 31, m = h & 1023, s = h & 0x8000 ? -1 : 1;
    return e === 0 ? s * m * 5.960464477539063e-8 : e === 31 ? (m ? NaN : s * Infinity) : s * Math.pow(2, e - 15) * (1 + m / 1024);
  }
  Surface.prototype.readTex = function (att, x, y, w, h) {
    var gl = this.gl, n = w * h * 4, out;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fbMain); gl.readBuffer(gl.COLOR_ATTACHMENT0 + att);
    if (this.hdr) {
      var t = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE), f = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
      if (t === gl.HALF_FLOAT && f === gl.RGBA) { out = new Uint16Array(n); gl.readPixels(x, y, w, h, gl.RGBA, gl.HALF_FLOAT, out); }
      else { var fl = new Float32Array(n); gl.readPixels(x, y, w, h, gl.RGBA, gl.FLOAT, fl); out = f2h(fl); }
    } else { out = new Uint8Array(n); gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, out); }
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    return out;
  };
  Surface.prototype.dump = function (opt) {
    opt = opt || {};
    this.flush(); if (this.wet) this.dryNow(); if (this.rec) this.end(); this.poll(true);
    var W = this.W, H = this.H, hdr = !!this.hdr, pig = this.readTex(0, 0, 0, W, H), aux = this.readTex(1, 0, 0, W, H);
    var one = hdr ? 0x3c00 : 255, B = hdr ? 2 : 1, tiles = [], x, y, i, j;
    for (var ty = 0; ty * TILE < H; ty++) for (var tx = 0; tx * TILE < W; tx++) {
      var x0 = tx * TILE, y0 = ty * TILE, w = Math.min(TILE, W - x0), h = Math.min(TILE, H - y0), used = false;
      for (y = y0; y < y0 + h && !used; y++) for (x = x0; x < x0 + w; x++) {
        i = (y * W + x) * 4;
        if (pig[i] !== one || pig[i + 1] !== one || pig[i + 2] !== one || pig[i + 3] || aux[i] || aux[i + 1] || aux[i + 2] || aux[i + 3]) { used = true; break; }
      }
      if (used) tiles.push([tx, ty, w, h]);
    }
    var size = 4; tiles.forEach(function (t) { size += 8 + t[2] * t[3] * 8 * B; });
    var buf = new ArrayBuffer(size), dv = new DataView(buf), o = 4, Arr = hdr ? Uint16Array : Uint8Array;
    dv.setUint32(0, tiles.length, true);
    tiles.forEach(function (t) {
      dv.setUint16(o, t[0], true); dv.setUint16(o + 2, t[1], true); dv.setUint16(o + 4, t[2], true); dv.setUint16(o + 6, t[3], true); o += 8;
      [pig, aux].forEach(function (src) {
        var dst = new Arr(buf, o, t[2] * t[3] * 4);
        for (j = 0; j < t[3]; j++) { var s0 = ((t[1] * TILE + j) * W + t[0] * TILE) * 4; dst.set(src.subarray(s0, s0 + t[2] * 4), j * t[2] * 4); }
        o += t[2] * t[3] * 4 * B;
      });
    });
    var recs = [];
    for (i = this.undo.length - 1; i >= 0 && recs.length < (opt.maxSteps == null ? 1e9 : opt.maxSteps); i--) { var r = this.undo[i]; if (!r.d) break; recs.unshift(r); }
    var hb = 4; recs.forEach(function (r) { hb += 4; Object.keys(r.d).forEach(function (k) { var d = r.d[k]; hb += 12 + (d && d.z ? d.z.byteLength : 0); }); });
    var hist = new ArrayBuffer(hb), hv = new DataView(hist), p = 4;
    hv.setUint32(0, recs.length, true);
    recs.forEach(function (r) {
      var ks = Object.keys(r.d); hv.setUint32(p, ks.length, true); p += 4;
      ks.forEach(function (k) {
        var d = r.d[k], xy = k.split(',');
        hv.setUint16(p, +xy[0] | (d && d.m === 'b' ? 0x8000 : 0), true); hv.setUint16(p + 2, +xy[1], true); hv.setUint16(p + 4, d ? d.w : 0, true); hv.setUint16(p + 6, d ? d.h : 0, true);
        var n = d && d.z ? d.z.length : 0; hv.setUint32(p + 8, d ? n : 0xffffffff, true); p += 12;
        if (n) { new Uint8Array(hist, p, n * 4).set(new Uint8Array(d.z.buffer, d.z.byteOffset, n * 4)); p += n * 4; }
      });
    });
    return { W: W, H: H, fmt: hdr ? 'h' : 'b', paper: this.paperKind, state: buf, hist: hist, steps: recs.length, tiles: tiles.length };
  };
  Surface.prototype.restore = function (d) {
    if (!d || d.W !== this.W || d.H !== this.H) return false;
    var self = this, gl = this.gl, hdr = !!this.hdr, src = d.fmt === 'h', B = src ? 2 : 1;
    this.flush();
    this.undo.concat(this.redo).forEach(function (r) { self.dropRec(r); }); this.undo = []; this.redo = []; this.rec = null; this.wetRec = null;
    this.clear(true);
    var dv = new DataView(d.state), n = dv.getUint32(0, true), o = 4;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    for (var t = 0; t < n; t++) {
      var tx = dv.getUint16(o, true), ty = dv.getUint16(o + 2, true), w = dv.getUint16(o + 4, true), h = dv.getUint16(o + 6, true); o += 8;
      [this.pig, this.aux].forEach(function (tex) {
        var len = w * h * 4, raw = src ? new Uint16Array(d.state.slice(o, o + len * 2)) : new Uint8Array(d.state, o, len), data = raw, type;
        if (hdr && src) type = gl.HALF_FLOAT;
        else if (!hdr && !src) type = gl.UNSIGNED_BYTE;
        else if (hdr) { var fl = new Float32Array(len); for (var i = 0; i < len; i++) fl[i] = raw[i] / 255; data = f2h(fl); type = gl.HALF_FLOAT; }
        else { data = new Uint8Array(len); for (var k = 0; k < len; k++) data[k] = Math.max(0, Math.min(255, Math.round(h2f(raw[k]) * 255))); type = gl.UNSIGNED_BYTE; }
        gl.bindTexture(gl.TEXTURE_2D, tex); self.inked.add(tx + ',' + ty);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, tx * TILE, ty * TILE, w, h, gl.RGBA, type, data);
        o += len * B;
      });
    }
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    if (d.hist && hdr === src) {
      var hv = new DataView(d.hist), nr = hv.getUint32(0, true), p = 4;
      for (var ri = 0; ri < nr; ri++) {
        var nk = hv.getUint32(p, true), r = { t: {}, d: {}, box: null }; p += 4;
        for (var ki = 0; ki < nk; ki++) {
          var kx0 = hv.getUint16(p, true), kx = kx0 & 0x7fff, km = kx0 & 0x8000 ? 'b' : 'x', kyy = hv.getUint16(p + 2, true), kw = hv.getUint16(p + 4, true), kh = hv.getUint16(p + 6, true), zl = hv.getUint32(p + 8, true); p += 12;
          if (zl === 0xffffffff) { r.d[kx + ',' + kyy] = null; continue; }
          var z = new Uint32Array(d.hist.slice(p, p + zl * 4)); p += zl * 4;
          r.d[kx + ',' + kyy] = { s: null, w: kw, h: kh, z: z, m: km }; this.histBytes += z.byteLength;
          r.box = union(r.box, [kx * TILE, kyy * TILE, kw, kh]);
        }
        this.undo.push(r);
      }
      this.trim();
    }
    this.dirty = this.full = true;
    return true;
  };

  /*@3.PAGJ.1*/
  Surface.prototype.note = function (o) { if (this.log && !this._lg) this.log.push(o); };
  var ENGINE = (function () {
    var t = Object.keys(SRC).sort().map(function (k) { return SRC[k]; }).join('|') + JSON.stringify([KCOV, DWELL, REF_PASSES, REF_AMT, TILE]) +
      ['stroke', 'dabs', 'feed', 'wcDab', 'tick', 'fillRegion', 'refRank', 'paintRef', 'endNow'].map(function (k) { return String(Surface.prototype[k]); }).join('|');
    var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  })();

  function logged(name, mk) {
    var f = Surface.prototype[name];
    Surface.prototype[name] = function () {
      if (!this.log || this._lg) return f.apply(this, arguments);
      this._lg = 1;
      var r; try { r = f.apply(this, arguments); } finally { this._lg = 0; }
      if (!this.log) return r;
      var o = mk.call(this, arguments, r);
      if (o === false) this.log = null; else if (o) this.log.push(o);
      return r;
    };
  }
  var lid = function (s) { return s && s.lid; };
  logged('stroke', function (a, s) {
    var o = a[3] || {}, m = o.maskObj, lab = m ? m.lab : 0;
    if (m && !lab) return false;
    s.lid = ++this.logN;
    return ['B', s.lid, a[0], a[1], a[2], o.load == null ? null : o.load, o.flow == null ? null : o.flow, o.grade == null ? null : o.grade, o.nib == null ? null : o.nib, o.mask ? 1 : 0, lab || 0, s.seed];
  });
  logged('startStroke', function (a) { return lid(a[0]) ? ['S', a[0].lid, qpt(a[1])] : false; });
  logged('feed', function (a, r) { return r === false ? null : lid(a[0]) ? ['F', a[0].lid, qpt(a[1])] : false; });
  logged('feedEnd', function (a, r) { return r ? (lid(a[0]) ? ['Z', a[0].lid] : false) : null; });
  logged('dwell', function (a, dt) { return lid(a[0]) ? ['W', a[0].lid, Math.round(dt * Q_T)] : false; });
  logged('dab', function (a) { return lid(a[0]) ? ['D', a[0].lid, a[1], a[2], a[3] || 0] : false; });
  logged('endStroke', function (a) { return lid(a[0]) ? ['E', a[0].lid] : false; });
  logged('abort', function (a) { return lid(a[0]) ? ['A', a[0].lid] : false; });
  logged('dryNow', function () { return ['Y']; });
  logged('fillRegion', function (a) { var o = a[3] || {}; return a[0] && a[0].lab ? ['K', a[0].lab, a[1], a[2], o.shade ? 1 : 0, o.grade == null ? null : o.grade, o.amt == null ? null : o.amt, o.light == null ? null : o.light, o.load == null ? null : o.load, o.seed] : false; });
  logged('refRank', function (a, r) { return r ? ['R', a[0], a[1], a[2], a[3].slice(0, 4), a[4] || 0] : null; });
  logged('paintRef', function (a, r) { var o = a[1] || {}; return r ? ['P', a[0], o.passes || 0, o.amt || 0, o.finish || 0] : null; });
  logged('step', function (a, r) { return r ? ['U', a[0] < 0 ? -1 : 1] : null; });
  logged('clear', function (a) { return a[0] ? null : ['X']; });
  logged('setPaper', function (a) { return ['Q', this.paperKind]; });
  logged('loadPaint', function (a) { var t = a[0] && a[0].__tag; return t ? ['L', t] : false; });

  Surface.prototype.play = function (o, map, env) {
    var s = map[o[1]];
    switch (o[0]) {
      case 'B': map[o[1]] = this.stroke(o[2], o[3], o[4], { load: o[5] == null ? undefined : o[5], flow: o[6] == null ? undefined : o[6], grade: o[7] == null ? undefined : o[7], nib: o[8] == null ? undefined : o[8], mask: !!o[9], maskObj: o[10] ? env.mask(o[10]) : null, seed: o[11] }); break;
      case 'S': this.startStroke(s, o[2]); break;
      case 'F': this.feed(s, o[2]); break;
      case 'Z': this.feedEnd(s); break;
      case 'W': this.dwell(s, o[2] / Q_T); break;
      case 'D': this.dab(s, o[2], o[3], o[4]); break;
      case 'E': this.endStroke(s); break;
      case 'A': this.abort(s); break;
      case 'T': this.tick(o[1] / Q_T); break;
      case 'Y': this.dryNow(); break;
      case 'K': this.fillRegion(env.mask(o[1]), o[2], o[3], { shade: !!o[4], grade: o[5] == null ? undefined : o[5], amt: o[6] == null ? undefined : o[6], light: o[7] == null ? undefined : o[7], load: o[8] == null ? undefined : o[8], seed: o[9] }); break;
      case 'G': this.group(!!o[1]); break;
      case 'R': this.refRank(o[1], o[2], o[3], o[4], o[5] || undefined); break;
      case 'P': this.paintRef(o[1], { passes: o[2] || undefined, amt: o[3] || undefined, finish: o[4] || undefined }); break;
      case 'U': this.step(o[1]); break;
      case 'X': this.clear(false); break;
      case 'Q': this.setPaper(o[1]); break;
      case 'L': this.loadPaint(env.img(o[1])); break;
    }
  };
  Surface.prototype.replay = function (ops, env) {
    env = env || {};
    var self = this, gl = this.gl, map = {}, i = 0, n = ops.length, qd = this.queued, fence = null;
    var next = function (f) { if (document.hidden) setTimeout(f, 0); else requestAnimationFrame(f); };
    this.queued = false; this.log = []; this.logN = 0;
    return new Promise(function (res, rej) {
      var run = function () {
        if (gl.isContextLost()) { self.queued = qd; rej(new Error('context-lost')); return; }
        if (fence) { var st = gl.clientWaitSync(fence, 0, 0); if (st === gl.TIMEOUT_EXPIRED) { next(run); return; } gl.deleteSync(fence); fence = null; }
        var t0 = performance.now();
        try { while (i < n && performance.now() - t0 < (env.ms || 10)) self.play(ops[i++], map, env); }
        catch (e) { self.queued = qd; rej(e); return; }
        if (env.progress) env.progress(i / n);
        if (i >= n) { self.queued = qd; self.dirty = self.full = true; res(self.log ? self.log.length : 0); return; }
        fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush();
        next(run);
      };
      run();
    });
  };

  var OPC = 'BSFZWDEATYKGRPUXQL';
  function Wr() { this.b = new Uint8Array(1 << 16); this.n = 0; this.dv = null; }
  Wr.prototype.need = function (k) { if (this.n + k <= this.b.length) return; var c = this.b.length; while (this.n + k > c) c *= 2; var b = new Uint8Array(c); b.set(this.b.subarray(0, this.n)); this.b = b; };
  Wr.prototype.u = function (v) { this.need(10); while (v >= 128) { this.b[this.n++] = (v % 128) | 128; v = Math.floor(v / 128); } this.b[this.n++] = v; };
  Wr.prototype.z = function (v) { this.u(v < 0 ? -2 * v - 1 : 2 * v); };
  Wr.prototype.f = function (v) { this.need(9); if (v == null) { this.b[this.n++] = 0; return; } this.b[this.n++] = 1; new DataView(this.b.buffer, this.n, 8).setFloat64(0, v, true); this.n += 8; };
  Wr.prototype.s = function (t) { var e = new TextEncoder().encode(String(t)); this.u(e.length); this.need(e.length); this.b.set(e, this.n); this.n += e.length; };
  function Rd(u8) { this.b = u8; this.n = 0; this.dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); }
  Rd.prototype.u = function () { var v = 0, m = 1, c; do { c = this.b[this.n++]; v += (c & 127) * m; m *= 128; } while (c & 128); return v; };
  Rd.prototype.z = function () { var v = this.u(); return v % 2 ? -(v + 1) / 2 : v / 2; };
  Rd.prototype.f = function () { if (!this.b[this.n++]) return null; var v = this.dv.getFloat64(this.n, true); this.n += 8; return v; };
  Rd.prototype.s = function () { var k = this.u(), t = new TextDecoder().decode(this.b.subarray(this.n, this.n + k)); this.n += k; return t; };
  var AZ0 = 40000;
  function encodeLog(ops) {
    var w = new Wr(), last = {};
    w.u(1); w.u(ops.length);
    var pt = function (id, p) {
      var L = last[id] || (last[id] = [0, 0, 0, 0, 0]);
      var v = [Math.round(p.x * Q_XY), Math.round(p.y * Q_XY), Math.round(p.p * Q_P), Math.round(p.tz * Q_P), p.az == null ? 0 : Math.round(p.az * Q_P) + AZ0];
      for (var k = 0; k < 5; k++) { w.z(v[k] - L[k]); L[k] = v[k]; }
    };
    var raw = function (p) { w.f(p.x); w.f(p.y); w.f(p.p == null ? null : p.p); w.f(p.tz == null ? null : p.tz); w.f(p.az == null ? null : p.az); };
    for (var i = 0; i < ops.length; i++) {
      var o = ops[i], c = o[0]; w.u(OPC.indexOf(c));
      if (c === 'B') { w.u(o[1]); w.s(o[2]); w.s(o[3]); for (var j = 4; j <= 8; j++) w.f(o[j]); w.u(o[9]); w.u(o[10]); w.f(o[11]); }
      else if (c === 'S' || c === 'F') { w.u(o[1]); pt(o[1], o[2]); }
      else if (c === 'W') { w.u(o[1]); w.u(o[2]); }
      else if (c === 'D') { w.u(o[1]); raw(o[2]); raw(o[3]); w.f(o[4]); }
      else if (c === 'Z' || c === 'E' || c === 'A') w.u(o[1]);
      else if (c === 'T') w.u(o[1]);
      else if (c === 'K') { w.u(o[1]); w.s(o[2]); w.s(o[3]); w.u(o[4]); for (var k2 = 5; k2 <= 9; k2++) w.f(o[k2]); }
      else if (c === 'G') w.u(o[1]);
      else if (c === 'R') { w.s(o[1]); w.f(o[2]); w.f(o[3]); for (var k3 = 0; k3 < 4; k3++) w.f(o[4][k3]); w.f(o[5]); }
      else if (c === 'P') { w.s(o[1]); w.f(o[2]); w.f(o[3]); w.f(o[4]); }
      else if (c === 'U') w.z(o[1]);
      else if (c === 'Q' || c === 'L') w.s(o[1]);
    }
    return w.b.slice(0, w.n);
  }
  function decodeLog(buf) {
    var r = new Rd(buf instanceof Uint8Array ? buf : new Uint8Array(buf)), ver = r.u(), n = r.u(), ops = [], last = {};
    if (ver !== 1) throw new Error('recipe-version');
    var pt = function (id) {
      var L = last[id] || (last[id] = [0, 0, 0, 0, 0]);
      for (var k = 0; k < 5; k++) L[k] += r.z();
      return { x: L[0] / Q_XY, y: L[1] / Q_XY, p: L[2] / Q_P, tz: L[3] / Q_P, az: L[4] ? (L[4] - AZ0) / Q_P : null };
    };
    var raw = function () { var p = { x: r.f(), y: r.f() }, q = r.f(), t = r.f(), a = r.f(); if (q != null) p.p = q; if (t != null) p.tz = t; if (a != null) p.az = a; return p; };
    for (var i = 0; i < n; i++) {
      var c = OPC[r.u()], o = [c], id;
      if (c === 'B') { o.push(r.u(), r.s(), r.s()); for (var j = 4; j <= 8; j++) o.push(r.f()); o.push(r.u(), r.u(), r.f()); }
      else if (c === 'S' || c === 'F') { id = r.u(); o.push(id, pt(id)); }
      else if (c === 'W') o.push(r.u(), r.u());
      else if (c === 'D') o.push(r.u(), raw(), raw(), r.f());
      else if (c === 'Z' || c === 'E' || c === 'A' || c === 'T' || c === 'G') o.push(r.u());
      else if (c === 'K') { o.push(r.u(), r.s(), r.s(), r.u()); for (var k2 = 5; k2 <= 9; k2++) o.push(r.f()); }
      else if (c === 'R') { o.push(r.s(), r.f(), r.f(), [r.f(), r.f(), r.f(), r.f()], r.f()); }
      else if (c === 'P') o.push(r.s(), r.f(), r.f(), r.f());
      else if (c === 'U') o.push(r.z());
      else if (c === 'Q' || c === 'L') o.push(r.s());
      else if (c !== 'X' && c !== 'Y') throw new Error('recipe-op');
      ops.push(o);
    }
    return ops;
  }
  Surface.prototype.destroy = function () {
    this.q = [];
    var gl = this.gl;
    if (this.tqa) { try { gl.endQuery(this.tq.TIME_ELAPSED_EXT); gl.deleteQuery(this.tqa); } catch (e) {} this.tqa = null; }
    (this.tqs || []).forEach(function (q) { try { gl.deleteQuery(q); } catch (e) {} }); this.tqs = [];
    if (this._prep) cancelAnimationFrame(this._prep); this._prep = 0; this.todo = {};
    if (this.shd) { this.release(); if (this.shd.owner === this) this.shd.owner = null; this.shd = null; return; }
    var ext = this.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
  };
  Surface.prototype.release = function () {
    var gl = this.gl, self = this, T = [], F = [];
    ['pig', 'aux', 'exp', 'sPig', 'sAux', 'sExp', 'paperT', 'lineT', 'guideT', 'refT', 'maskT', 'blurT', 'ordT', 'paperS'].forEach(function (k) { if (self[k]) T.push(self[k]); });
    ['fbMain', 'fbScr', 'fbPaper', 'fbWA', 'fbWB', 'fbPaperS'].forEach(function (k) { if (self[k]) F.push(self[k]); });
    (this.wW || []).concat(this.wP || []).forEach(function (t) { T.push(t); });
    this.pages.forEach(function (pg) { T.push(pg.pig, pg.aux); F.push(pg.fb); });
    this.dpages.forEach(function (pg) { T.push(pg.t, pg.t2); F.push(pg.fb); }); if (this.dTmp) T.push(this.dTmp);
    this.reads.forEach(function (b) { gl.deleteBuffer(b.pbo); gl.deleteSync(b.sync); }); this.reads = []; this.toRead = []; if (this._pollT) clearTimeout(this._pollT); this._pollT = 0; if (this._idleT) clearTimeout(this._idleT); this._idleT = 0;
    this.undo.concat(this.redo).forEach(function (r) { if (r.snap) self.snapPool.push(r.snap); });
    this.snapPool.forEach(function (fb) { F.push(fb); T.push.apply(T, fb.tex); });
    T.forEach(function (t) { gl.deleteTexture(t); }); F.forEach(function (f) { gl.deleteFramebuffer(f); });
    if (this.vao) gl.deleteVertexArray(this.vao); if (this.qbuf) gl.deleteBuffer(this.qbuf);
    this.pages = []; this.free = []; this.undo = []; this.redo = []; this.snapPool = []; this.dpages = []; this.dfree = []; this.dTmp = null; this.histBytes = 0;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  };

  function bench(vw, vh) {
    vw = Math.max(64, vw | 0); vh = Math.max(64, vh | 0);
    var c = document.createElement('canvas'); c.width = vw; c.height = vh;
    var S = null;
    try { S = new Surface(c, { W: 1024, H: 1024, paper: 'draw' }); } catch (e) { return null; }
    var gl = S.gl, px = new Uint8Array(4);
    var sync = function () { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
    var P = function (x, y) { return { x: x, y: y, p: .6, tz: 0 }; };
    try {
      S.resize(vw, vh); S.setView(Math.min(vw, vh) / 1024, 0, 0);
      var st = S.stroke('pencil', '#3366cc', 4, {}); S.startStroke(st, P(60, 60)); S.dab(st, P(60, 60), P(64, 62)); S.endStroke(st);
      S.render(); sync();
      var n = 120, t0 = performance.now(), a = P(80, 300);
      st = S.stroke('pencil', '#3366cc', 4, {});
      for (var i = 1; i <= n; i++) { var b = P(80 + i * 6, 300 + Math.sin(i * .2) * 60); S.dab(st, a, b); a = b; }
      S.endStroke(st); S.flush(); sync();
      var dab = (performance.now() - t0) / n;
      t0 = performance.now();
      for (var k = 0; k < 3; k++) { S.full = true; S.render(); sync(); }
      return { dab: dab, comp: (performance.now() - t0) / 3, gpu: (function () { try { var x = gl.getExtension('WEBGL_debug_renderer_info'); return String(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : ''); } catch (e) { return ''; } })() };
    } catch (e) { return null; } finally { try { S.destroy(); } catch (e2) {} }
  }

  var WARM = ['comp', 'init', 'paper', 'back', 'load', 'dab:1', 'dab:6', 'wcAdd', 'wcStep', 'wcDep', 'wcDrain', 'rim', 'fill:1:2', 'fill:11:2', 'fill:6:2',
    'dab:0', 'dab:2', 'dab:3', 'dab:4', 'dab:5', 'dab:7', 'dab:8', 'dab:9', 'dab:10', 'fill:7:0', 'fill:1:0', 'fill:6:0', 'pigout'];
  function warmup(first) {
    var sh = shared(); if (!sh || sh.warming) return !!sh;
    var gl = sh.gl, host = Object.create(Surface.prototype), dp = Math.min(2.5, window.devicePixelRatio || 1);
    if (sh.canvas.width < 2) { sh.canvas.width = Math.round(innerWidth * dp); sh.canvas.height = Math.round(innerHeight * dp); }
    host.gl = gl; host.P = sh.P; host.Q = sh.Q; host.src = SRC; host.par = gl.getExtension('KHR_parallel_shader_compile');
    gl.getExtension('EXT_color_buffer_float'); gl.getExtension('EXT_color_buffer_half_float'); gl.getExtension('OES_texture_float_linear');
    var hf = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
    var f = hf ? [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT] : [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE];
    var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    host.vao = gl.createVertexArray(); gl.bindVertexArray(host.vao); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    var t = function (ff) { return Surface.prototype.tex.call(host, 4, 4, ff, false); };
    var fb3 = host.fbo([t(f), t(f), t(f)]), fb2 = host.fbo([t(f), t(f)]), fbR = host.fbo([t([gl.R8, gl.RED, gl.UNSIGNED_BYTE])]), fb8 = host.fbo([t([gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE])]);
    var list = (first && first.length ? first : WARM).filter(function (n, i, a) { return a.indexOf(n) === i; }), at = 0;
    sh.warming = true;
    list.slice(0, 6).forEach(function (n) { host.warm(n); });
    var step = function () {
      if (gl.isContextLost()) return;
      var t0 = performance.now();
      while (at < list.length && performance.now() - t0 < 6) {
        var n = list[at];
        if (!(sh.P[n] && sh.P[n].primed)) {
          if (!host.ready(n)) break;
          var p = host.prog(n), fb = n === 'comp' ? null : n === 'paper' ? fbR : n === 'pigout' ? fb8 : /^wc(Add|Step|Drain)$/.test(n) ? fb2 : fb3;
          for (var i = 0; i < 8; i++) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, fbR.tex[0]); }
          if (!p.primed && !sh.owner) { host.draw(p, fb, 1, 1, [0, 0, 1, 1]); gl.flush(); }
        }
        at++; if (list[at + 5]) host.warm(list[at + 5]);
      }
      if (at < list.length) setTimeout(step, 30); else sh.warm = true;
    };
    setTimeout(step, 0);
    return true;
  }

  window.GardenPaintGL = {
    warmup: warmup,
    gpu: function () { var sh = shared(); return sh ? sh.name : ''; },
    bench: bench,
    supported: function () { return !!shared(); },
    create: function (canvas, opts) { return new Surface(canvas, opts); },
    hexToRgb: hexToRgb,
    encodeLog: encodeLog,
    decodeLog: decodeLog,
    ENGINE: ENGINE,
    TOOLS: TOOLS
  };
})();
