(function () {
  'use strict';
  if (window.GardenPaintGL) return;

  var SPECTRA = "const float SW[38] = float[38](1.00116,1.00116,1.00116,1.00116,1.00115,1.00113,1.00109,1.001,1.00087,1.0007,1.0005,1.00031,1.00012,0.999953,0.999822,0.999739,0.99971,0.999732,0.999799,0.9999,1.00002,1.00014,1.00026,1.00036,1.00043,1.00048,1.00051,1.00053,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054); const float SC[38] = float[38](0.970585,0.970592,0.970625,0.970787,0.971369,0.973163,0.97674,0.981588,0.98628,0.989949,0.992493,0.994146,0.995184,0.995757,0.995913,0.995606,0.994598,0.992216,0.986236,0.967943,0.891285,0.536202,0.154108,0.0574575,0.031535,0.0222634,0.0182023,0.0162991,0.0153656,0.0149112,0.0146954,0.0145964,0.014547,0.0145229,0.014512,0.0145067,0.0145045,0.0145038); const float SM[38] = float[38](0.990674,0.990672,0.990663,0.990618,0.990451,0.989871,0.988287,0.984291,0.973935,0.941818,0.81739,0.432473,0.138454,0.0537347,0.0292175,0.0213137,0.020135,0.0241323,0.0372236,0.0760507,0.205375,0.541269,0.815842,0.912818,0.94634,0.959928,0.966261,0.969326,0.970855,0.971605,0.971963,0.972127,0.972209,0.97225,0.972268,0.972277,0.97228,0.972281); const float SY[38] = float[38](0.0210523,0.0210565,0.0210746,0.0211649,0.0215028,0.0226739,0.0258236,0.0334879,0.051907,0.100749,0.23913,0.534804,0.797808,0.91145,0.953798,0.971242,0.979303,0.98338,0.985461,0.986435,0.986738,0.986618,0.986278,0.985861,0.985475,0.985177,0.984972,0.984846,0.984775,0.984738,0.98472,0.984711,0.984707,0.984705,0.984704,0.984703,0.984703,0.984703); const float SR[38] = float[38](0.0315606,0.0315521,0.0315148,0.0313318,0.030673,0.028648,0.024645,0.0192961,0.0142067,0.0102943,0.00761915,0.00589804,0.00482332,0.00422987,0.00405992,0.00435337,0.00534344,0.00769172,0.013597,0.0316975,0.107861,0.463813,0.847055,0.943185,0.968862,0.978031,0.982044,0.983924,0.984845,0.985294,0.985507,0.985605,0.985654,0.985678,0.985688,0.985694,0.985696,0.985697); const float SG[38] = float[38](0.00955607,0.00955816,0.00956732,0.00961291,0.00978371,0.0103786,0.0120026,0.0160978,0.0267062,0.0595555,0.18604,0.57058,0.861468,0.945879,0.970465,0.978414,0.979589,0.975534,0.962289,0.923122,0.793434,0.45927,0.185574,0.0881775,0.054363,0.0406288,0.0342215,0.0311186,0.0295709,0.0288109,0.0284486,0.028282,0.0281988,0.0281582,0.0281399,0.0281309,0.0281271,0.028126); const float SB[38] = float[38](0.979405,0.979401,0.979383,0.979294,0.978963,0.977814,0.974724,0.967198,0.94908,0.90085,0.76315,0.465922,0.201263,0.0877524,0.0457177,0.0284706,0.0205272,0.0165303,0.0145135,0.0136004,0.0133604,0.0135489,0.0139594,0.0144434,0.0148854,0.0152254,0.0154593,0.0156018,0.0156825,0.0157249,0.0157458,0.0157556,0.0157605,0.015763,0.0157641,0.0157646,0.0157648,0.0157649); const float CX[38] = float[38](6.4692e-05,0.00021941,0.00112057,0.00376661,0.0118806,0.0232864,0.0345594,0.0372238,0.0324184,0.0212332,0.010491,0.00329584,0.000507035,0.000948674,0.00627372,0.0168646,0.0286896,0.0426748,0.0562547,0.0694704,0.0830532,0.0861261,0.0904661,0.0850039,0.0709067,0.0506289,0.035474,0.0214682,0.0125165,0.00680458,0.00346457,0.00149761,0.0007697,0.000407368,0.00016901,9.52245e-05,4.9031e-05,1.99961e-05); const float CY[38] = float[38](1.84429e-06,6.20532e-06,3.10096e-05,0.000104748,0.000353641,0.000951471,0.00228226,0.00420733,0.0066888,0.0098884,0.0152495,0.0214183,0.0334229,0.05131,0.0704021,0.0878387,0.0942491,0.0979567,0.0941522,0.086781,0.0788565,0.0635267,0.0537414,0.0426461,0.0316173,0.0208852,0.0138601,0.00810264,0.0046301,0.00249138,0.0012593,0.000541647,0.000277953,0.000147108,6.10327e-05,3.43873e-05,1.7706e-05,7.22097e-06); const float CZ[38] = float[38](0.000305017,0.00103681,0.00531314,0.0179544,0.0570776,0.113652,0.173359,0.196207,0.186082,0.13995,0.0891745,0.0478962,0.0281456,0.0161377,0.0077591,0.00429615,0.00200551,0.000861471,0.000369039,0.000191429,0.000149556,9.23109e-05,6.81349e-05,2.88264e-05,1.57672e-05,3.9406e-06,1.58401e-06,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0);";

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
    SPECTRA,
    'float specR(vec3 l, int i){',
    '  float w = min(l.r, min(l.g, l.b)); l -= w;',
    '  float c = min(l.g, l.b), m = min(l.r, l.b), y = min(l.r, l.g);',
    '  float r = max(0., min(l.r - l.b, l.r - l.g)), g = max(0., min(l.g - l.b, l.g - l.r)), b = max(0., min(l.b - l.g, l.b - l.r));',
    '  return max(1e-4, w*SW[i] + c*SC[i] + m*SM[i] + y*SY[i] + r*SR[i] + g*SG[i] + b*SB[i]); }',
    'float lumY(vec3 l){ return dot(l, vec3(.2126, .7152, .0722)); }',
    'const mat3 XYZ2RGB = mat3(3.2409699, -0.9692436, 0.0556301, -1.5373832, 1.8759675, -0.2039770, -0.4986108, 0.0415551, 1.0569715);',
    'vec3 kmMix(vec3 a, vec3 b, float t){',
    '  t = clamp(t, 0., 1.); if (t < .002) return a; if (t > .998) return b;',
    '  vec3 la = toLin(a), lb = toLin(b);',
    '  float ca = (1.-t)*(1.-t) * max(lumY(la), .01), cb = t*t * max(lumY(lb), .01), cs = ca + cb;',
    '  vec3 xyz = vec3(0.);',
    '  for (int i = 0; i < 38; i++){',
    '    float ra = specR(la, i), rb = specR(lb, i);',
    '    float ka = (1.-ra)*(1.-ra)/(2.*ra), kb = (1.-rb)*(1.-rb)/(2.*rb);',
    '    float ks = (ka*ca + kb*cb) / cs;',
    '    float R = 1. + ks - sqrt(ks*ks + 2.*ks);',
    '    xyz += vec3(CX[i], CY[i], CZ[i]) * R; }',
    '  return toSrgb(XYZ2RGB * xyz); }',
    'vec3 glaze(vec3 base, vec3 pig, float amt){',
    '  amt = max(0., amt); if (amt < .0005) return base;',
    '  vec3 lb = toLin(base), lp = toLin(pig); vec3 xyz = vec3(0.);',
    '  for (int i = 0; i < 38; i++){ float R = specR(lb, i) * pow(specR(lp, i), amt); xyz += vec3(CX[i], CY[i], CZ[i]) * R; }',
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
    'uniform vec4 uSeg; uniform vec2 uRad, uPress; uniform float uTz, uAz, uNib, uDwell; uniform vec3 uColor; uniform int uTool; uniform float uSeed, uLoad, uGrade, uK, uFlow;\n' +
    'float cov(float e){ return 1. - exp(-uK * e); }\n' +
    'void main(){\n' +
    '  vec2 p = gl_FragCoord.xy + uOff; ivec2 ip = ivec2(p);\n' +
    '  vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0), ex = texelFetch(uExp, ip, 0); float H = texelFetch(uPaper, ip, 0).r;\n' +
    '  oPig = pig; oAux = aux; oExp = ex;\n' +
    '  float m = maskAt(p); if (m <= 0.) return;\n' +
    '  vec2 a = uSeg.xy, b = uSeg.zw; vec2 ab = b - a; float L = length(ab); vec2 dir = L > .01 ? ab / L : vec2(cos(uAz), sin(uAz));\n' +
    '  float t = L > .01 ? clamp(dot(p - a, ab) / (L*L), 0., 1.) : 0.;\n' +
    '  float r = mix(uRad.x, uRad.y, t), pr = mix(uPress.x, uPress.y, t);\n' +
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
    '  float e0 = ex.r, e1 = e0 + e * m; float dc = cov(e1) - cov(e0); oExp = vec4(e1, cov(e1), ex.b, 1.);\n' +
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
    '      col = glaze(col, vec3(.34, .34, .37), g * 2.4); aux.a = min(1., aux.a + g * (.5 + .5 * uGrade)); aux.r = min(1., aux.r + amt * .03 * pr);\n' +
    '    } else {\n' +
    '      col = glaze(col, uColor, amt * 1.25); col = kmMix(col, uColor, amt * .1);\n' +
    '      aux.r = min(.85, aux.r + amt * .06 * pr * pr); aux.a = min(.35, aux.a + amt * .03);\n' +
    '    }\n' +
    '  } else if (uTool == 9){\n' +
    '    float surf = H + aux.r * .25 + (vnoise(p * .45 + uSeed) - .5) * .18;\n' +
    '    float th = 1. - (.12 + .62 * pr) * (1. - .3 * uTz); float contact = smoothstep(th - .05, th + .06, surf);\n' +
    '    float amt = dc * contact * (.5 + .5 * pr);\n' +
    '    col = cover(col, uColor, min(1., amt * 1.5)); col = glaze(col, uColor, amt * .45);\n' +
    '    aux.r = min(1., aux.r + amt * .3); aux.g = min(.35, aux.g + amt * .04); aux.a = min(.45, aux.a + amt * .12); pig.a = min(.6, pig.a + amt * .25);\n' +
    '  } else if (uTool == 2){\n' +
    '    float surf = H * .7 + vnoise(p * .32 + uSeed * .3) * .2 + vnoise(p * 1.1) * .1 - aux.r * .15;\n' +
    '    float th = 1. - (.25 + .65 * pr) * (1. - .35 * uTz); float contact = smoothstep(th - .06, th + .06, surf);\n' +
    '    float dust = step(.982, hash12(floor(p * .8) + floor(uSeed * 10.))) * smoothstep(r * 1.6, r * .95, d0) * m;\n' +
    '    float amt = clamp(dc * contact * (.65 + .35 * pr) * 1.25 + dust * .3 * dc, 0., 1.);\n' +
    '    if (amt <= 0.) return;\n' +
    '    col = cover(col, uColor, min(1., amt * 1.7));\n' +
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
    '    col = cover(drag, uColor, min(1., amt * 4.));\n' +
    '    aux.g = clamp(mix(aux.g, upAux.g, dc * .4 * wet) + amt * .3 * uLoad * br, 0., 1.);\n' +
    '    aux.b = min(1., aux.b + amt * 2.); pig.a = min(1., pig.a + amt * 2.); aux.a *= 1. - amt;\n' +
    '  } else if (uTool == 6){\n' +
    '    float fib = (.93 + .07 * vnoise(p * .55 + uSeed)) * (.88 + .12 * vnoise(vec2(along * .012, across * .25) + uSeed * 2.)) * (.94 + .06 * fbm(p * .04));\n' +
    '    float amt = dc * fib * (.78 + .22 * pr) * uFlow;\n' +
    '    col = glaze(col, uColor, amt * 1.05); oExp.b = ex.b + amt;\n' +
    '  } else if (uTool == 7){\n' +
    '    float contact = smoothstep(.04, .2, H + .25 + pr * .3);\n' +
    '    float amt = dc * contact;\n' +
    '    col = glaze(col, uColor, amt * 3.2); col = kmMix(col, uColor, amt * .35); aux.a = min(.3, aux.a + amt * .05);\n' +
    '  } else if (uTool == 8){\n' +
    '    float amt = dc * (.85 + .15 * pr);\n' +
    '    col = cover(col, uColor, min(1., amt * 2.2)); pig.a = min(1., pig.a + amt * .7); aux.a = min(.6, aux.a + amt * .35); aux.g = min(.2, aux.g + amt * .05);\n' +
    '  } else if (uTool == 10){\n' +
    '    float spk = .55 + .45 * step(.35, hash12(floor(p) + floor(uSeed * 977.)));\n' +
    '    float amt = dc * spk * (.25 + .75 * pr) * uFlow;\n' +
    '    col = glaze(col, uColor, amt * .9); col = kmMix(col, uColor, amt * .08);\n' +
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
    '  oPig = vec4(col, pig.a); oAux = aux; }';

  var FS_RIM = DAB_HEAD +
    'uniform float uAmt; uniform vec3 uColor;\n' +
    'void main(){ vec2 p = gl_FragCoord.xy + uOff; ivec2 ip = ivec2(p);\n' +
    '  vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0), ex = texelFetch(uExp, ip, 0); oPig = pig; oAux = aux; oExp = ex;\n' +
    '  if (ex.g <= .01) return;\n' +
    '  float s = 0.; for (int j = 0; j < 12; j++){ float an = float(j) * .5236; vec2 o = vec2(cos(an), sin(an)); s += texelFetch(uExp, ivec2(clamp(p + o * 3., vec2(0.), uSize - 1.)), 0).g + texelFetch(uExp, ivec2(clamp(p + o * 6.5, vec2(0.), uSize - 1.)), 0).g; }\n' +
    '  s /= 24.; float rim = clamp((ex.g - s) * 2.6, 0., 1.); rim *= .75 + .5 * vnoise(p * .3);\n' +
    '  oPig = vec4(glaze(pig.rgb, uColor, rim * uAmt), pig.a); }';

  var FS_FILL = DAB_HEAD +
    'uniform vec3 uColor; uniform int uTool; uniform float uSeed, uShade, uAmt, uGrade, uUseRef, uDepth, uFinish; uniform vec3 uTint; uniform sampler2D uBlur, uRefT, uLineT; uniform vec2 uLight;\n' +
    'void main(){ vec2 p = gl_FragCoord.xy + uOff; ivec2 ip = ivec2(p);\n' +
    '  vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0), ex = texelFetch(uExp, ip, 0); float H = texelFetch(uPaper, ip, 0).r;\n' +
    '  oPig = pig; oAux = aux; oExp = ex;\n' +
    '  float m = maskAt(p); if (m <= 0.) return;\n' +
    '  float sh = 1.;\n' +
    '  if (uShade > .5){ vec2 mp = (p - uMaskRect.xy) / uMaskRect.zw; vec2 lp = uLight / uMaskRect.zw;\n' +
    '    float in0 = texture(uBlur, mp).r, lit = texture(uBlur, mp + lp).r, dk = texture(uBlur, mp - lp).r;\n' +
    '    sh = clamp(.62 + .9 * (1. - in0) + 1.1 * (dk - lit), .35, 1.75); }\n' +
    '  vec2 hd = rot(.785 + fract(uSeed * .137) * .5) * p; float hatch = .78 + .22 * vnoise(vec2(hd.x * .06, hd.y * 1.35) + uSeed);\n' +
    '  if (uUseRef > .5){\n' +
    '    vec2 uv = p / uSize; vec3 C = toSrgb(min(vec3(1.), toLin(texture(uRefT, uv).rgb) / uTint)); if (texture(uLineT, uv).r < .3) return;\n' +
    '    float a2 = uAmt; vec3 col0 = pig.rgb;\n' +
    '    if (uTool <= 1){ float contact = smoothstep(.3 - uDepth, .45 - uDepth, H + aux.r * .45 + (vnoise(p * .8 + uSeed) - .5) * .06); a2 *= contact * hatch; aux.r = min(.85, aux.r + a2 * .03); if (uTool == 0){ C = toSrgb(vec3(lumY(toLin(C)))); aux.a = min(1., aux.a + a2 * .4); } }\n' +
    '    else if (uTool == 9 || uTool == 2){ float contact = smoothstep(.3 - uDepth, .46 - uDepth, H * .75 + vnoise(p * (uTool == 2 ? .32 : .45) + uSeed) * .25); a2 *= contact * hatch; pig.a = min(1., pig.a + a2 * .4); aux.r = min(1., aux.r + a2 * .15); }\n' +
    '    else if (uTool == 6){ vec2 sd = rot(-.52) * p; a2 *= .92 + .08 * smoothstep(.3, .7, vnoise(vec2(sd.x * .004, sd.y * .09) + uSeed)); }\n' +
    '    else if (uTool == 3 || uTool == 8){ vec2 sd = rot(.3) * p; float br = .8 + .2 * vnoise(vec2(sd.x * .02, sd.y * .6) + uSeed); pig.a = min(1., pig.a + a2 * .8); if (uTool == 3){ aux.g = min(1., aux.g + a2 * .2 * br); aux.b = 1.; } }\n' +
    '    else if (uTool == 11){ float gran = 1.3 - H * .7 + (vnoise(p * .7 + uSeed) - .5) * .2; a2 *= mix(1., gran, .5) * (.9 + .1 * vnoise(p * .03 + uSeed)); }\n' +
    '    a2 = mix(a2, 1., uFinish);\n' +
    '    oPig = vec4(toSrgb(mix(toLin(col0), toLin(C), clamp(a2, 0., 1.))), pig.a); oAux = aux; return;\n' +
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
    'uniform sampler2D uPig, uAux, uPaper, uLine, uGuide, uRef, uW, uP; uniform vec2 uDoc, uView; uniform vec3 uView2; uniform float uFlip, uWet, uRelief, uRef1, uGuideA, uLines, uDesk, uPaperOn, uK, uLineSharp, uNear; uniform vec3 uTint, uDeskC, uInk; uniform vec2 uSizeS;\n' +
    'out vec4 o;\n' +
    'void main(){ vec2 sp = vec2(gl_FragCoord.x, uFlip > .5 ? uView.y - gl_FragCoord.y : gl_FragCoord.y);\n' +
    '  vec2 q = (sp - uView2.yz) / uView2.x;\n' +
    '  if (q.x < 0. || q.y < 0. || q.x > uDoc.x || q.y > uDoc.y){\n' +
    '    vec2 dq = max(vec2(0.), max(-q, q - uDoc)) * uView2.x; float sh = exp(-length(dq) / 14.) * .35 * smoothstep(-.5, 3., dq.y + 1.);\n' +
    '    o = vec4(uDeskC * (1. - sh), uDesk); return; }\n' +
    '  vec2 uv = q / uDoc; float px = 1. / uView2.x;\n' +
    '  vec4 pig = uNear > .5 ? texelFetch(uPig, ivec2(q), 0) : texture(uPig, uv), aux = uNear > .5 ? texelFetch(uAux, ivec2(q), 0) : texture(uAux, uv);\n' +
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
    '  if (uLines > .5){ vec2 lq = uv; float lv = texture(uLine, lq).r; float ink = 1. - lv;\n' +
    '    float w2 = clamp(.5 / max(uLineSharp * uView2.x, .5), .04, .5); ink = smoothstep(.5 - w2, .5 + w2, ink);\n' +
    '    col = mix(col, col * toLin(uInk), ink); }\n' +
    '  if (uGuideA > 0.){ vec4 g = texture(uGuide, uv); col = mix(col, toLin(g.rgb), g.a * uGuideA); }\n' +
    '  if (uRef1 > 0.){ vec3 rc = toLin(texture(uRef, uv).rgb); col = mix(col, rc, uRef1); }\n' +
    '  o = vec4(toSrgb(col), 1.); }';

  var FS_INIT = '#version 300 es\nprecision highp float; uniform vec4 uV; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1; layout(location=2) out vec4 o2; void main(){ o0 = uV; o1 = vec4(0.); o2 = vec4(0.); }';
  var FS_LOAD = '#version 300 es\nprecision highp float; uniform sampler2D uImg; uniform vec2 uOff, uSize; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1; layout(location=2) out vec4 o2;\n' +
    'void main(){ vec2 p = gl_FragCoord.xy + uOff; vec4 c = texture(uImg, p / uSize); o0 = vec4(mix(vec3(1.), c.rgb, c.a), 0.); o1 = vec4(0.); o2 = vec4(0.); }';
  var FS_PIGOUT = '#version 300 es\nprecision highp float; uniform sampler2D uPig; out vec4 o; void main(){ o = vec4(texelFetch(uPig, ivec2(gl_FragCoord.xy), 0).rgb, 1.); }';

  var TOOLS = { graphite: 0, pencil: 1, pastel: 2, oil: 3, eraser: 4, blend: 5, marker: 6, ink: 7, gel: 8, crayon: 9, airbrush: 10 };
  var KCOV = { graphite: 1.15, pencil: 1.2, pastel: 1.5, oil: 1.6, eraser: 1.4, blend: 1.2, marker: 4.5, ink: 6, gel: 4, crayon: 1.7, airbrush: .55 };
  var DWELL = { graphite: .2, pencil: .2, pastel: .12, oil: .08, eraser: .2, blend: 0, marker: .55, ink: .6, gel: .5, crayon: .12, airbrush: .35, wash: .5 };
  var TILE = 128;

  function hexToRgb(h) { var n = parseInt(String(h || '#000000').slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
  function union(a, b) { if (!a) return b && b.slice(); if (!b) return a.slice(); var x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]); return [x0, y0, Math.max(a[0] + a[2], b[0] + b[2]) - x0, Math.max(a[1] + a[3], b[1] + b[3]) - y0]; }

  function Surface(canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false, alpha: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('webgl2');
    this.gl = gl; this.canvas = canvas;
    var f32 = !!gl.getExtension('EXT_color_buffer_float'), f16 = f32 || !!gl.getExtension('EXT_color_buffer_half_float');
    gl.getExtension('OES_texture_float_linear');
    this.fmt = f16 ? [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT] : [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE];
    this.hdr = f16;
    var maxT = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
    this.W = Math.min(opts.W | 0, maxT); this.H = Math.min(opts.H | 0, maxT);
    var q = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, q);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.P = {};
    var self = this;
    this.src = { paper: FS_PAPER, dab: FS_DAB, rim: FS_RIM, fill: FS_FILL, wcAdd: FS_WC_ADD, wcStep: FS_WC_STEP, wcDep: FS_WC_DEP, wcDrain: FS_WC_DRAIN, comp: FS_COMP, init: FS_INIT, load: FS_LOAD, pigout: FS_PIGOUT };
    this.prog('comp'); this.prog('dab'); this.prog('init');
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
    this.view = { s: 1, x: 0, y: 0, w: canvas.width, h: canvas.height }; this.full = true; this.part = null;
    this.tint = [1, .99, .965]; this.desk = [.13, .15, .19]; this.ink = [.1, .1, .12];
    this.undo = []; this.redo = []; this.rec = null; this.pages = []; this.free = [];
    this.maxPages = opts.undoPages || (Math.ceil(Math.ceil(this.W / TILE) * Math.ceil(this.H / TILE) / 64) + 2);
    this.wet = null; this.dirty = this.full = true; this.expBox = null;
    this.clear(true);
    this.setPaper(opts.paper || 'draw');
  }

  Surface.prototype.prog = function (name) {
    if (this.P[name]) return this.P[name];
    var gl = this.gl, p = gl.createProgram(), fs = this.src[name];
    [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
      var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(name + ': ' + gl.getShaderInfoLog(sh));
      gl.attachShader(p, sh);
    });
    gl.bindAttribLocation(p, 0, 'aP'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(name + ': ' + gl.getProgramInfoLog(p));
    p.u = {}; var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var u = gl.getActiveUniform(p, i); p.u[u.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, u.name); }
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
        this.copyRect(this.fbScr, this.fbMain, 0, 0, w, h, tx, ty, keepExp ? 2 : 3);
      }
    }
    this.part = union(this.part, rect);
    this.dirty = true;
    return rect;
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
    return { fb: pg.fb, x: (i % 8) * TILE, y: ((i / 8) | 0) * TILE };
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
    Object.keys(r.t).forEach(function (k) { if (r.t[k] >= 0) self.free.push(r.t[k]); });
    if (r.a) Object.keys(r.a).forEach(function (k) { if (r.a[k] >= 0) self.free.push(r.a[k]); });
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
    while (this.undo.length > 60) this.dropRec(this.undo.shift());
    return r;
  };
  Surface.prototype.touchTiles = function (rect) {
    var r = this.rec || this.wetRec; if (!r) return;
    var x0 = (rect[0] / TILE) | 0, y0 = (rect[1] / TILE) | 0, x1 = ((rect[0] + rect[2] - 1) / TILE) | 0, y1 = ((rect[1] + rect[3] - 1) / TILE) | 0;
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      var k = x + ',' + y;
      if (!(k in r.t)) r.t[k] = this.saveTile(x, y);
    }
    r.box = union(r.box, rect);
  };
  Surface.prototype.swapRec = function (r) {
    var self = this, out = {};
    Object.keys(r.t).forEach(function (k) {
      var slot = r.t[k]; if (slot < 0) { out[k] = -1; return; }
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
    if (this.rec) this.end();
    var from = dir < 0 ? this.undo : this.redo, to = dir < 0 ? this.redo : this.undo;
    var r = from.pop(); if (!r) return false;
    if (r === this.wetRec) this.wetRec = null;
    if (this.wet && r.box) this.clearWet(r.box);
    this.swapRec(r); to.push(r);
    return true;
  };
  Surface.prototype.canUndo = function () { return this.undo.length > 0; };
  Surface.prototype.canRedo = function () { return this.redo.length > 0; };

  Surface.prototype.clear = function (silent) {
    var self = this, gl = this.gl;
    if (!silent) { this.begin(); this.touchTiles([0, 0, this.W, this.H]); }
    this.draw(this.prog('init'), this.fbMain, this.W, this.H, null, function (p, g) { g.uniform4f(p.u.uV, 1, 1, 1, 0); });
    if (this.wcReady) [this.fbWA, this.fbWB].forEach(function (fb) { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.wet = null; this.dirty = this.full = true;
    if (!silent) this.end();
  };

  Surface.prototype.setPaper = function (kind) {
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
  Surface.prototype.setMask = function (mask) {
    var gl = this.gl;
    if (!mask) { this.useMask = 0; return; }
    if (this.curMask !== mask) {
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
    if (!mask.blur) return false;
    this.upload(this.blurT, mask.blur, [this.gl.R8, this.gl.RED, this.gl.UNSIGNED_BYTE]);
    return true;
  };

  Surface.prototype.stroke = function (tool, hex, r, opt) {
    opt = opt || {};
    var gl = this.gl;
    this.begin();
    if (this.expBox) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbMain); gl.enable(gl.SCISSOR_TEST);
      var b = this.expBox; gl.scissor(b[0], b[1], b[2], b[3]);
      gl.drawBuffers([gl.NONE, gl.NONE, gl.COLOR_ATTACHMENT2]); gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
      gl.disable(gl.SCISSOR_TEST); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.expBox = null;
    }
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
    return { tool: tool, rgb: hexToRgb(hex), r: r, rf: rf, seed: Math.random() * 100, load: opt.load == null ? 1 : opt.load, grade: opt.grade || .7,
      mask: !!opt.mask, nib: opt.nib == null ? .6 : opt.nib, flow: opt.flow == null ? 1 : opt.flow, box: null, n: 0 };
  };

  Surface.prototype.dab = function (s, a, b, dwell) {
    var self = this;
    this.nDab = (this.nDab || 0) + 1;
    if (s.tool === 'wash') return this.wcDab(s, a, b, dwell);
    var ra = Math.max(.5, s.r * s.rf(a)), rb = Math.max(.5, s.r * s.rf(b));
    var tz = b.tz || 0, az = b.az == null ? (s.az || 0) : b.az;
    var elong = (s.tool === 'pencil' || s.tool === 'graphite') ? 1 + 2.4 * tz : (s.tool === 'pastel' || s.tool === 'crayon') ? 1 + 1.5 * tz : 1;
    var pad = Math.max(ra, rb) * elong * (s.tool === 'pastel' ? 1.8 : 1) + 3;
    if (s.tool === 'blend' || s.tool === 'oil') pad += 4;
    var rect = [Math.min(a.x, b.x) - pad, Math.min(a.y, b.y) - pad, Math.abs(b.x - a.x) + pad * 2, Math.abs(b.y - a.y) + pad * 2];
    var done = this.pass('dab', rect, function (p, g) {
      g.uniform4f(p.u.uSeg, a.x, a.y, b.x, b.y); g.uniform2f(p.u.uRad, ra, rb); g.uniform2f(p.u.uPress, a.p, b.p);
      g.uniform1f(p.u.uTz, tz); g.uniform1f(p.u.uAz, az); g.uniform1f(p.u.uNib, s.nib); g.uniform1f(p.u.uDwell, dwell || 0);
      g.uniform3fv(p.u.uColor, s.rgb); g.uniform1i(p.u.uTool, TOOLS[s.tool]); g.uniform1f(p.u.uSeed, s.seed + (s.tool === 'airbrush' ? s.n * .013 : 0));
      g.uniform1f(p.u.uLoad, s.load); g.uniform1f(p.u.uGrade, s.grade); g.uniform1f(p.u.uK, KCOV[s.tool] || 1); g.uniform1f(p.u.uFlow, s.flow);
    });
    s.n++;
    if (done) { s.box = union(s.box, done); this.expBox = union(this.expBox, done); }
    if (s.tool === 'oil') { this.oilT = 300; s.load = Math.max(.08, s.load - .0012 * Math.hypot(b.x - a.x, b.y - a.y) / Math.max(4, s.r)); }
  };

  Surface.prototype.abort = function (s) {
    var r = this.rec; this.rec = null; this.useMask = 0;
    if (s && s.tool === 'wash' && s.box) this.clearWet(s.box);
    if (r && Object.keys(r.t).length) { this.swapRec(r); this.dropRec(r); }
    this.dirty = this.full = true;
  };

  Surface.prototype.startStroke = function (s, pt) { this.dab(s, pt, pt, DWELL[s.tool] || 0); };

  Surface.prototype.endStroke = function (s) {
    var self = this;
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
    opt = opt || {};
    var self = this, rgb = hexToRgb(hex);
    if (tool !== 'wash') this.begin();
    this.setMask(mask);
    var shade = !!opt.shade && this.setBlur(mask);
    var rect = [mask.x, mask.y, mask.w, mask.h];
    if (tool === 'wash') {
      var cx = mask.x + mask.w / 2, cy = mask.y + mask.h / 2, r = Math.hypot(mask.w, mask.h) / 2 + 4;
      var st = this.stroke('wash', hex, r, { load: opt.load == null ? .8 : opt.load, mask: true });
      st.rf = function () { return 1; };
      this.wcDab(st, { x: cx, y: cy, p: .7 }, { x: cx, y: cy, p: .7 }, 1);
      this.useMask = 0;
      this.wetRec = this.rec; this.rec = null; this.undo.push(this.wetRec);
      return rect;
    }
    var L = Math.max(mask.w, mask.h) * .05;
    var ang = opt.light == null ? -2.3 : opt.light;
    this.pass('fill', rect, function (p, g) {
      self.bindTex(p, 'uBlur', self.blurT, 5);
      g.uniform3fv(p.u.uColor, rgb); g.uniform1i(p.u.uTool, TOOLS[tool] == null ? 7 : TOOLS[tool]); g.uniform1f(p.u.uSeed, Math.random() * 100);
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
    if (!this.hasRef || !mask) return;
    var self = this, id = tool === 'wash' ? 11 : (TOOLS[tool] == null ? 7 : TOOLS[tool]), amt = REF_AMT[tool] || .7;
    this.setMask(mask);
    this.pass('fill', [mask.x, mask.y, mask.w, mask.h], function (p, g) {
      self.bindTex(p, 'uBlur', self.blurT, 5); self.bindTex(p, 'uRefT', self.refT, 6); self.bindTex(p, 'uLineT', self.lineT, 7);
      g.uniform3fv(p.u.uColor, [0, 0, 0]); g.uniform1i(p.u.uTool, id); g.uniform1f(p.u.uSeed, k * 7.31 + 1.7);
      g.uniform1f(p.u.uShade, 0); g.uniform1f(p.u.uAmt, amt); g.uniform1f(p.u.uGrade, .9); g.uniform1f(p.u.uUseRef, 1);
      g.uniform1f(p.u.uDepth, .35 * k / Math.max(1, passes - 1)); g.uniform1f(p.u.uFinish, 0); g.uniform3fv(p.u.uTint, self.tint);
    }, true);
    this.useMask = 0;
    this.dirty = this.full = true;
  };

  Surface.prototype.paintRef = function (tool, opt) {
    opt = opt || {};
    if (!this.hasRef) return false;
    var self = this, id = tool === 'wash' ? 11 : (TOOLS[tool] == null ? 7 : TOOLS[tool]);
    var passes = opt.passes || REF_PASSES[tool] || 3;
    var amt = opt.amt || REF_AMT[tool] || .7;
    this.begin(); this.useMask = 0;
    for (var k = 0; k < passes; k++) {
      this.pass('fill', [0, 0, this.W, this.H], function (p, g) {
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
    this.wet = union(this.wet, full);
    this.wetAt = this.simT || 0;
    s.box = union(s.box, full);
    s.load = Math.max(.12, s.load - .001 * Math.hypot(b.x - a.x, b.y - a.y) / Math.max(2, ra));
    this.dirty = this.full = true;
  };

  Surface.prototype.tick = function (dt) {
    if (!this.wet) return false;
    var gl = this.gl, self = this, k = this.k;
    dt = Math.min(.05, dt || .016); this.simT = (this.simT || 0) + dt * 1000;
    var pad = 24;
    var x0 = Math.max(0, Math.floor(this.wet[0] * k - pad)), y0 = Math.max(0, Math.floor(this.wet[1] * k - pad));
    var x1 = Math.min(this.sw, Math.ceil((this.wet[0] + this.wet[2]) * k + pad)), y1 = Math.min(this.sh, Math.ceil((this.wet[1] + this.wet[3]) * k + pad));
    if (x1 <= x0 || y1 <= y0) { this.wet = null; return false; }
    var r = [x0, y0, x1 - x0, y1 - y0];
    var finalDry = (this.simT || 0) - (this.wetAt || 0) > (this.dryMs || 6500);
    this.draw(this.prog('wcStep'), this.fbWB, this.sw, this.sh, r, function (p, g) {
      self.bindTex(p, 'uW', self.wW[0], 0); self.bindTex(p, 'uP', self.wP[0], 1); self.bindTex(p, 'uPaperS', self.paperS, 2);
      g.uniform1f(p.u.uDt, dt); g.uniform2f(p.u.uSizeS, self.sw, self.sh); g.uniform1f(p.u.uFinal, finalDry ? 1 : 0);
    });
    this.copyRect(this.fbWB, this.fbWA, r[0], r[1], r[2], r[3], r[0], r[1], 2);
    var full = [r[0] / k, r[1] / k, r[2] / k, r[3] / k];
    this.pass('wcDep', full, function (p, g) {
      self.bindTex(p, 'uW', self.wW[0], 5); self.bindTex(p, 'uP', self.wP[0], 6);
      g.uniform1f(p.u.uDt, dt); g.uniform1f(p.u.uK, k); g.uniform2f(p.u.uSizeS, self.sw, self.sh); g.uniform1f(p.u.uFinal, finalDry ? 1 : 0);
    }, true);
    this.drain(r, finalDry ? 0 : 1 - Math.min(.5, dt * 0));
    if (finalDry) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbWA); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbWB); gl.clear(gl.COLOR_BUFFER_BIT); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.wet = null; this.wetRec = null; this.dirty = this.full = true; return false;
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
    if (!this.wet) return;
    this.wetAt = -1e9; this.tick(.016);
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
      g.uniform1f(p.u.uLineSharp, self.lineSharp); g.uniform1f(p.u.uNear, s >= 8 && !opt.smooth ? 1 : 0);
      g.uniform3fv(p.u.uTint, self.tint); g.uniform3fv(p.u.uDeskC, self.desk); g.uniform3fv(p.u.uInk, self.ink);
    });
  };
  Surface.prototype.render = function () {
    var v = this.view, r = null, P = this.part;
    if (!this.full && P && !this.wet) {
      var pad = Math.ceil(v.s) + 3;
      var x0 = Math.max(0, Math.floor(v.x + P[0] * v.s) - pad), x1 = Math.min(v.w, Math.ceil(v.x + (P[0] + P[2]) * v.s) + pad);
      var y0 = Math.max(0, Math.floor(v.y + P[1] * v.s) - pad), y1 = Math.min(v.h, Math.ceil(v.y + (P[1] + P[3]) * v.s) + pad);
      if (x1 <= x0 || y1 <= y0) { this.part = null; this.dirty = false; return; }
      r = [x0, v.h - y1, x1 - x0, y1 - y0];
    }
    this.compRect = r;
    this.comp(null, v.w, v.h, v.s, v.x, v.y, true);
    this.compRect = null;
    this.stat = this.stat || { px: 0, n: 0, full: 0 };
    this.stat.px += r ? r[2] * r[3] : v.w * v.h; this.stat.n++; if (!r) this.stat.full++;
    this.part = null; this.full = false; this.dirty = false;
  };

  Surface.prototype.exportCanvas = function (opt) {
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
    var gl = this.gl, self = this, t = this.tex(4, 4, [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE], true);
    this.upload(t, img, [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE]);
    this.pass('load', [0, 0, this.W, this.H], function (p, g) { self.bindTex(p, 'uImg', t, 6); g.uniform2f(p.u.uSize, self.W, self.H); });
    gl.deleteTexture(t);
    this.undo = []; this.redo = []; this.free = []; this.pages.forEach(function (pg) { gl.deleteFramebuffer(pg.fb); gl.deleteTexture(pg.pig); gl.deleteTexture(pg.aux); }); this.pages = [];
  };

  Surface.prototype.sample = function (x, y) {
    var gl = this.gl, px = new Uint8Array(4), t = this.tex(1, 1, [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE]), fb = this.fbo([t]), self = this;
    this.comp(fb, 1, 1, 1, -Math.floor(x) - .0, -Math.floor(y) - .0, false, { ref: 0, guide: 0, lines: false, paper: 0 });
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb); gl.deleteTexture(t);
    this.dirty = this.full = true;
    return [px[0], px[1], px[2]];
  };

  Surface.prototype.destroy = function () {
    var ext = this.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
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
      S.endStroke(st); sync();
      var dab = (performance.now() - t0) / n;
      t0 = performance.now();
      for (var k = 0; k < 3; k++) { S.full = true; S.render(); sync(); }
      return { dab: dab, comp: (performance.now() - t0) / 3, gpu: (function () { try { var x = gl.getExtension('WEBGL_debug_renderer_info'); return String(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : ''); } catch (e) { return ''; } })() };
    } catch (e) { return null; } finally { try { S.destroy(); } catch (e2) {} }
  }

  window.GardenPaintGL = {
    bench: bench,
    supported: function () { try { var c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch (e) { return false; } },
    create: function (canvas, opts) { return new Surface(canvas, opts); },
    hexToRgb: hexToRgb,
    TOOLS: TOOLS
  };
})();
