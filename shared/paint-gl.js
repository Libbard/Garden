(function () {
  'use strict';
  if (window.GardenPaintGL) return;

  var SPECTRA_GLSL = "const float SW[38] = float[38](1.00116,1.00116,1.00116,1.00116,1.00115,1.00113,1.00109,1.001,1.00087,1.0007,1.0005,1.00031,1.00012,0.999953,0.999822,0.999739,0.99971,0.999732,0.999799,0.9999,1.00002,1.00014,1.00026,1.00036,1.00043,1.00048,1.00051,1.00053,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054); const float SC[38] = float[38](0.970585,0.970592,0.970625,0.970787,0.971369,0.973163,0.97674,0.981588,0.98628,0.989949,0.992493,0.994146,0.995184,0.995757,0.995913,0.995606,0.994598,0.992216,0.986236,0.967943,0.891285,0.536202,0.154108,0.0574575,0.031535,0.0222634,0.0182023,0.0162991,0.0153656,0.0149112,0.0146954,0.0145964,0.014547,0.0145229,0.014512,0.0145067,0.0145045,0.0145038); const float SM[38] = float[38](0.990674,0.990672,0.990663,0.990618,0.990451,0.989871,0.988287,0.984291,0.973935,0.941818,0.81739,0.432473,0.138454,0.0537347,0.0292175,0.0213137,0.020135,0.0241323,0.0372236,0.0760507,0.205375,0.541269,0.815842,0.912818,0.94634,0.959928,0.966261,0.969326,0.970855,0.971605,0.971963,0.972127,0.972209,0.97225,0.972268,0.972277,0.97228,0.972281); const float SY[38] = float[38](0.0210523,0.0210565,0.0210746,0.0211649,0.0215028,0.0226739,0.0258236,0.0334879,0.051907,0.100749,0.23913,0.534804,0.797808,0.91145,0.953798,0.971242,0.979303,0.98338,0.985461,0.986435,0.986738,0.986618,0.986278,0.985861,0.985475,0.985177,0.984972,0.984846,0.984775,0.984738,0.98472,0.984711,0.984707,0.984705,0.984704,0.984703,0.984703,0.984703); const float SR[38] = float[38](0.0315606,0.0315521,0.0315148,0.0313318,0.030673,0.028648,0.024645,0.0192961,0.0142067,0.0102943,0.00761915,0.00589804,0.00482332,0.00422987,0.00405992,0.00435337,0.00534344,0.00769172,0.013597,0.0316975,0.107861,0.463813,0.847055,0.943185,0.968862,0.978031,0.982044,0.983924,0.984845,0.985294,0.985507,0.985605,0.985654,0.985678,0.985688,0.985694,0.985696,0.985697); const float SG[38] = float[38](0.00955607,0.00955816,0.00956732,0.00961291,0.00978371,0.0103786,0.0120026,0.0160978,0.0267062,0.0595555,0.18604,0.57058,0.861468,0.945879,0.970465,0.978414,0.979589,0.975534,0.962289,0.923122,0.793434,0.45927,0.185574,0.0881775,0.054363,0.0406288,0.0342215,0.0311186,0.0295709,0.0288109,0.0284486,0.028282,0.0281988,0.0281582,0.0281399,0.0281309,0.0281271,0.028126); const float SB[38] = float[38](0.979405,0.979401,0.979383,0.979294,0.978963,0.977814,0.974724,0.967198,0.94908,0.90085,0.76315,0.465922,0.201263,0.0877524,0.0457177,0.0284706,0.0205272,0.0165303,0.0145135,0.0136004,0.0133604,0.0135489,0.0139594,0.0144434,0.0148854,0.0152254,0.0154593,0.0156018,0.0156825,0.0157249,0.0157458,0.0157556,0.0157605,0.015763,0.0157641,0.0157646,0.0157648,0.0157649); const float CX[38] = float[38](6.4692e-05,0.00021941,0.00112057,0.00376661,0.0118806,0.0232864,0.0345594,0.0372238,0.0324184,0.0212332,0.010491,0.00329584,0.000507035,0.000948674,0.00627372,0.0168646,0.0286896,0.0426748,0.0562547,0.0694704,0.0830532,0.0861261,0.0904661,0.0850039,0.0709067,0.0506289,0.035474,0.0214682,0.0125165,0.00680458,0.00346457,0.00149761,0.0007697,0.000407368,0.00016901,9.52245e-05,4.9031e-05,1.99961e-05); const float CY[38] = float[38](1.84429e-06,6.20532e-06,3.10096e-05,0.000104748,0.000353641,0.000951471,0.00228226,0.00420733,0.0066888,0.0098884,0.0152495,0.0214183,0.0334229,0.05131,0.0704021,0.0878387,0.0942491,0.0979567,0.0941522,0.086781,0.0788565,0.0635267,0.0537414,0.0426461,0.0316173,0.0208852,0.0138601,0.00810264,0.0046301,0.00249138,0.0012593,0.000541647,0.000277953,0.000147108,6.10327e-05,3.43873e-05,1.7706e-05,7.22097e-06); const float CZ[38] = float[38](0.000305017,0.00103681,0.00531314,0.0179544,0.0570776,0.113652,0.173359,0.196207,0.186082,0.13995,0.0891745,0.0478962,0.0281456,0.0161377,0.0077591,0.00429615,0.00200551,0.000861471,0.000369039,0.000191429,0.000149556,9.23109e-05,6.81349e-05,2.88264e-05,1.57672e-05,3.9406e-06,1.58401e-06,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0);";

  var COMMON = [
    '#version 300 es',
    'precision highp float;',
    'precision highp int;',
    'precision highp sampler2D;',
    'float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
    'float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);',
    '  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }',
    'float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }',
    'float worley(vec2 p){ vec2 i = floor(p), f = fract(p); float d = 8.;',
    '  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){ vec2 g = vec2(x, y); vec2 o = vec2(hash12(i+g), hash12(i+g+19.7)); d = min(d, length(g + o - f)); } return d; }',
    'float s2l(float c){ return c <= .04045 ? c / 12.92 : pow((c + .055) / 1.055, 2.4); }',
    'float l2s(float c){ return c <= .0031308 ? c * 12.92 : 1.055 * pow(c, 1. / 2.4) - .055; }',
    'vec3 toLin(vec3 c){ return vec3(s2l(c.r), s2l(c.g), s2l(c.b)); }',
    'vec3 toSrgb(vec3 c){ c = clamp(c, 0., 1.); return vec3(l2s(c.r), l2s(c.g), l2s(c.b)); }',
    SPECTRA_GLSL,
    'float specR(vec3 l, int i){',
    '  float w = min(l.r, min(l.g, l.b)); l -= w;',
    '  float c = min(l.g, l.b), m = min(l.r, l.b), y = min(l.r, l.g);',
    '  float r = max(0., min(l.r - l.b, l.r - l.g)), g = max(0., min(l.g - l.b, l.g - l.r)), b = max(0., min(l.b - l.g, l.b - l.r));',
    '  return max(1e-4, w*SW[i] + c*SC[i] + m*SM[i] + y*SY[i] + r*SR[i] + g*SG[i] + b*SB[i]); }',
    'float lumY(vec3 l){ return dot(l, vec3(.2126, .7152, .0722)); }',
    
    'vec3 kmMix(vec3 a, vec3 b, float t){',
    '  t = clamp(t, 0., 1.); if (t < .001) return a; if (t > .999) return b;',
    '  vec3 la = toLin(a), lb = toLin(b);',
    '  float ca = (1.-t)*(1.-t) * max(lumY(la), .01), cb = t*t * max(lumY(lb), .01), cs = ca + cb;',
    '  vec3 xyz = vec3(0.);',
    '  for (int i = 0; i < 38; i++){',
    '    float ra = specR(la, i), rb = specR(lb, i);',
    '    float ka = (1.-ra)*(1.-ra)/(2.*ra), kb = (1.-rb)*(1.-rb)/(2.*rb);',
    '    float ks = (ka*ca + kb*cb) / cs;',
    '    float R = 1. + ks - sqrt(ks*ks + 2.*ks);',
    '    xyz += vec3(CX[i], CY[i], CZ[i]) * R; }',
    '  vec3 l = mat3(3.2409699, -0.9692436, 0.0556301, -1.5373832, 1.8759675, -0.2039770, -0.4986108, 0.0415551, 1.0569715) * xyz;',
    '  return toSrgb(l); }',
    
    'vec3 glaze(vec3 base, vec3 pig, float amt){',
    '  amt = max(0., amt); if (amt < .0005) return base;',
    '  vec3 lb = toLin(base), lp = toLin(pig); vec3 xyz = vec3(0.);',
    '  for (int i = 0; i < 38; i++){ float R = specR(lb, i) * pow(specR(lp, i), amt); xyz += vec3(CX[i], CY[i], CZ[i]) * R; }',
    '  vec3 l = mat3(3.2409699, -0.9692436, 0.0556301, -1.5373832, 1.8759675, -0.2039770, -0.4986108, 0.0415551, 1.0569715) * xyz;',
    '  return toSrgb(l); }'
  ].join('\n');

  var VS = '#version 300 es\nin vec2 aP; uniform vec4 uRect; uniform vec2 uSize; out vec2 vUV;\n' +
    'void main(){ vec2 px = uRect.xy + aP * uRect.zw; vUV = px / uSize; gl_Position = vec4(px / uSize * 2. - 1., 0., 1.); }';

  
  var FS_PAPER = COMMON + '\nuniform int uKind; uniform float uScale; out vec4 o;\n' +
    'void main(){ vec2 p = gl_FragCoord.xy / uScale; float h;\n' +
    '  if (uKind == 0){ h = .5 + .5 * (fbm(p * .9) - .5) * .9 + (hash12(floor(p*2.)) - .5) * .12; }\n' +
    '  else if (uKind == 1){ float w = worley(p * .42); float w2 = worley(p * 1.1 + 3.1); h = .6 - .3 * w - .16 * w2 + .22 * (fbm(p * 1.6) - .5) + (hash12(floor(p*2.)) - .5) * .1; }\n' +
    '  else if (uKind == 2){ float w = worley(p * .24); h = .66 - .42 * w + .3 * (fbm(p * .8) - .5) + .16 * (fbm(p * 2.6) - .5); }\n' +
    '  else { vec2 q = p * .55; float wx = .5 + .5 * sin(q.x * 3.14159) * (.8 + .2 * vnoise(q * .7)); float wy = .5 + .5 * sin(q.y * 3.14159 + 1.57) * (.8 + .2 * vnoise(q.yx * .7 + 9.));\n' +
    '    float over = step(.5, fract(floor(q.x) * .5 + floor(q.y) * .5)); h = mix(wx, wy, over) * .75 + .25 * fbm(p * .8); }\n' +
    '  o = vec4(clamp(h, 0., 1.), 0., 0., 1.); }';

  
  var FS_DAB = COMMON + '\n' +
    'uniform sampler2D uPig, uAux, uPaper, uMask, uStk; uniform vec2 uSize; uniform vec4 uSeg; uniform vec2 uRad; uniform vec2 uPress;\n' +
    'uniform vec3 uColor; uniform int uTool; uniform float uSeed, uLoad, uGrade, uTilt, uUseMask; uniform vec4 uMaskRect; uniform vec3 uRes;\n' +
    'layout(location=0) out vec4 oPig; layout(location=1) out vec4 oAux; layout(location=2) out vec4 oStk;\n' +
    'void main(){\n' +
    '  ivec2 ip = ivec2(gl_FragCoord.xy); vec2 p = gl_FragCoord.xy;\n' +
    '  vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0); float ph = texelFetch(uPaper, ip, 0).r; vec4 stk = texelFetch(uStk, ip, 0); oStk = stk;\n' +
    '  vec2 a = uSeg.xy, b = uSeg.zw, ab = b - a; float L = length(ab); vec2 dir = L > .01 ? ab / L : vec2(1., 0.);\n' +
    '  float t = L > .01 ? clamp(dot(p - a, ab) / (L*L), 0., 1.) : 0.;\n' +
    '  float rad = mix(uRad.x, uRad.y, t), pr = mix(uPress.x, uPress.y, t);\n' +
    '  vec2 c = a + ab * t; vec2 rel = p - c; float d = length(rel);\n' +
    '  vec2 nrm = vec2(-dir.y, dir.x); float u = dot(rel, nrm) / max(rad, .5);\n' +
    '  float m = 1.; if (uUseMask > .5){ vec2 mp = (p - uMaskRect.xy) / uMaskRect.zw; m = (mp.x < 0. || mp.y < 0. || mp.x > 1. || mp.y > 1.) ? 0. : texture(uMask, mp).r; }\n' +
    '  float soft = uTool == 3 ? .55 : uTool == 2 ? .35 : .25;\n' +
    '  float f = 1. - smoothstep(rad * (1. - soft), rad, d); f *= m;\n' +
    '  if (f <= 0. && uTool != 2){ oPig = pig; oAux = aux; return; }\n' +
    '  float along = dot(p, dir), across = dot(p, nrm);\n' +
    '  vec3 col = pig.rgb;\n' +
    '  if (uTool == 0 || uTool == 1){\n' +
    '    float tooth = ph * .72 + vnoise(p * 1.9 + uSeed) * .28;\n' +
    '    float he = tooth - aux.r * .6;\n' +
    '    float th = (uTool == 0 ? 1.02 : .98) - pr * (uTool == 0 ? .78 : .72) - uTilt * .12;\n' +
    '    float grain = smoothstep(th - .2, th + .08, he);\n' +
    '    float streak = .8 + .2 * vnoise(vec2(along * .11, across * 2.2) + uSeed);\n' +
    '    float target = f * grain * streak * (.25 + .9 * pr) * (1. - uTilt * .4);\n' +
    '    float dep = max(0., target - stk.r); oStk.r = max(stk.r, target);\n' +
    '    if (uTool == 0){\n' +
    '      float cur = 1. - lumY(toLin(col)); float room = max(0., uGrade - cur);\n' +
    '      float amt = min(dep * .6, room * 2. + .003);\n' +
    '      col = glaze(col, vec3(.43, .43, .46), amt * 2.2); pig.a = min(1., pig.a + amt * 1.4);\n' +
    '      aux.r = min(1., aux.r + dep * .05 * pr);\n' +
    '    } else {\n' +
    '      col = glaze(col, uColor, dep * .8); aux.r = min(1., aux.r + dep * .07 * pr * pr);\n' +
    '    }\n' +
    '  } else if (uTool == 2){\n' +                    
    '    float coarse = ph * .6 + vnoise(p * .45 + uSeed * .3) * .25 + vnoise(p * 1.3) * .15;\n' +
    '    float th = 1. - pr * .8 - aux.r * .4;\n' +
    '    float grain = smoothstep(th - .07, th + .07, coarse);\n' +
    '    float dust = step(.965, hash12(floor(p * .7) + uSeed)) * (1. - smoothstep(rad, rad * 1.6, d)) * m;\n' +
    '    float target = clamp(f * grain * (.55 + .5 * pr) + dust * .5, 0., 1.); float dep = max(0., target - stk.r); oStk.r = max(stk.r, target);\n' +
    '    if (dep <= 0.){ oPig = pig; oAux = aux; return; }\n' +
    '    vec3 km = kmMix(col, uColor, dep * .6); col = mix(km, uColor, dep * .55);\n' +
    '    aux.r = min(1., aux.r + dep * .16); aux.a = min(1., aux.a + dep * .6); pig.a *= 1. - dep * .5;\n' +
    '  } else if (uTool == 3){\n' +                    
    '    float br = .55 + .45 * vnoise(vec2(u * 9. + uSeed * 3.1, along * .012));\n' +
    '    br *= .8 + .2 * vnoise(vec2(u * 31. + uSeed, 0.));\n' +
    '    float dry = smoothstep(.15, .55, uLoad);\n' +
    '    float catchTop = mix(smoothstep(.45, .75, ph + aux.g * .6), 1., dry);\n' +
    '    float dep = f * br * catchTop * (.4 + .6 * pr) * (.25 + .75 * uLoad);\n' +
    '    vec2 up = clamp(p - dir * rad * .45, vec2(0.), uSize - 1.); vec4 upPig = texelFetch(uPig, ivec2(up), 0); vec4 upAux = texelFetch(uAux, ivec2(up), 0);\n' +
    '    float wet = aux.b; vec3 drag = mix(col, upPig.rgb, f * .35 * wet);\n' +
    '    col = kmMix(drag, uColor, dep * .85);\n' +
    '    aux.g = clamp(mix(aux.g, upAux.g, f * .25 * wet) + dep * .22 * uLoad * br, 0., 1.);\n' +
    '    aux.b = min(1., aux.b + dep); pig.a *= 1. - dep * .8;\n' +
    '  } else if (uTool == 6){\n' +
    '    float target = f * (.82 + .18 * pr); float dep = max(0., target - stk.r); oStk.r = max(stk.r, target);\n' +
    '    col = glaze(col, uColor, dep * 1.05);\n' +
    '  } else if (uTool == 4){\n' +                    
    '    float lift = f * (.35 + .5 * pr) * (.75 + .25 * smoothstep(.3, .7, ph));\n' +
    '    col = mix(col, vec3(1.), lift); pig.a *= 1. - lift; aux = mix(aux, vec4(0.), lift);\n' +
    '  } else if (uTool == 5){\n' +                    
    '    vec2 up = clamp(p - dir * rad * .6, vec2(0.), uSize - 1.); vec4 upPig = texelFetch(uPig, ivec2(up), 0);\n' +
    '    float k = f * .38 * (.5 + .5 * pr); col = mix(col, upPig.rgb, k); pig.a = mix(pig.a, upPig.a, k); aux.r *= 1. - k * .2;\n' +
    '  }\n' +
    '  oPig = vec4(col, pig.a); oAux = aux; }';

  
  var FS_WC_ADD = COMMON + '\n' +
    'uniform sampler2D uW, uP, uMask; uniform vec2 uSize; uniform vec4 uSeg; uniform vec2 uRad; uniform vec2 uPress; uniform vec3 uColor; uniform float uLoad, uSeed, uUseMask; uniform vec4 uMaskRect;\n' +
    'layout(location=0) out vec4 oW; layout(location=1) out vec4 oP;\n' +
    'void main(){ ivec2 ip = ivec2(gl_FragCoord.xy); vec2 p = gl_FragCoord.xy; vec4 w = texelFetch(uW, ip, 0), pg = texelFetch(uP, ip, 0);\n' +
    '  vec2 a = uSeg.xy, b = uSeg.zw, ab = b - a; float L = length(ab); float t = L > .01 ? clamp(dot(p - a, ab) / (L*L), 0., 1.) : 0.;\n' +
    '  float rad = mix(uRad.x, uRad.y, t), pr = mix(uPress.x, uPress.y, t); float d = length(p - (a + ab * t));\n' +
    '  float edge = rad * (.84 + .16 * (vnoise(p * .18 + uSeed) - .5) + .1 * (vnoise(p * .9 + uSeed * 2.) - .5));\n' +
    '  float f = 1. - smoothstep(edge * .7, edge, d);\n' +
    '  if (uUseMask > .5){ vec2 mp = (p - uMaskRect.xy) / uMaskRect.zw; f *= (mp.x < 0. || mp.y < 0. || mp.x > 1. || mp.y > 1.) ? 0. : texture(uMask, mp).r; }\n' +
    '  if (f <= 0.){ oW = w; oP = pg; return; }\n' +
    '  float wash = f * (.35 + .4 * uLoad); float pig = f * uLoad * (.5 + .7 * pr);\n' +
    '  vec3 col = pg.a > .001 ? kmMix(pg.rgb, uColor, pig / (pg.a + pig)) : uColor;\n' +
    '  float damp = smoothstep(.0, .05, w.r) * (1. - smoothstep(.12, .35, w.r)) * step(.02, pg.a);\n' +
    '  vec2 out2 = d > .5 ? (p - (a + ab * t)) / d : vec2(0.); float jag = .6 + .8 * vnoise(p * .35 + uSeed);\n' +
    '  vec2 v = w.gb + out2 * damp * wash * 1.6 * jag;\n' +
    '  oW = vec4(min(1.5, max(w.r, wash) + wash * .15), v, 0.); oP = vec4(col, min(2., pg.a + pig)); }';

  var FS_WC_STEP = COMMON + '\n' +
    'uniform sampler2D uW, uP, uPaper; uniform vec2 uSize, uFull; uniform float uDt;\n' +
    'layout(location=0) out vec4 oW; layout(location=1) out vec4 oP;\n' +
    'vec4 W(vec2 q){ return texture(uW, q / uSize); } vec4 P(vec2 q){ return texture(uP, q / uSize); } float H(vec2 q){ return texture(uPaper, q / uSize).r; }\n' +
    'void main(){ vec2 p = gl_FragCoord.xy; vec4 w = W(p);\n' +
    '  float hl = W(p - vec2(1,0)).r, hr = W(p + vec2(1,0)).r, hd = W(p - vec2(0,1)).r, hu = W(p + vec2(0,1)).r;\n' +
    '  float pl = H(p - vec2(1,0)), prr = H(p + vec2(1,0)), pd = H(p - vec2(0,1)), pu = H(p + vec2(0,1));\n' +
    '  vec2 grad = vec2(hr - hl, hu - hd) * .5 + vec2(prr - pl, pu - pd) * .18;\n' +
    '  vec2 v = w.gb * .9 - grad * 1.6 * uDt * 60.; if (w.r < .02) v = vec2(0.);\n' +
    '  v = clamp(v, -1.2, 1.2);\n' +
    '  vec2 back = p - v; vec4 wa = W(back); vec4 pa = P(back);\n' +
    '  float wet = step(.02, wa.r);\n' +
    '  float nb = (step(.02, hl) + step(.02, hr) + step(.02, hd) + step(.02, hu)) * .25;\n' +
    '  float edge = wet * (1. - nb);\n' +
    '  float evap = (.0045 + .02 * edge) * uDt * 60.;\n' +
    '  float h = max(0., wa.r - evap);\n' +
    '  vec4 pl4 = P(p - vec2(1,0)), pr4 = P(p + vec2(1,0)), pd4 = P(p - vec2(0,1)), pu4 = P(p + vec2(0,1));\n' +
    '  float diff = .08 * wet; float amt = mix(pa.a, (pl4.a + pr4.a + pd4.a + pu4.a) * .25, diff);\n' +
    '  vec3 col = pa.a > .001 ? pa.rgb : (pl4.rgb + pr4.rgb + pd4.rgb + pu4.rgb) * .25;\n' +
    '  vec2 toEdge = -vec2(hr - hl, hu - hd); float ring = edge * .02 * uDt * 60.;\n' +
    '  float soak = smoothstep(.0, .06, h);\n' +
    '  float dep = amt * mix(.6, (.01 + .04 * (1. - clamp(h / .6, 0., 1.)) + .03 * (1. - H(p))) * uDt * 60., soak);\n' +
    '  amt = max(0., amt - dep);\n' +
    '  oW = vec4(h, v, min(1., w.a + uDt)); oP = vec4(col, amt * (1. + ring)); }';

  
  var FS_WC_DEP = COMMON + '\n' +
    'uniform sampler2D uPig, uAux, uPaper, uW, uP; uniform vec2 uSize; uniform float uDt;\n' +
    'layout(location=0) out vec4 oPig; layout(location=1) out vec4 oAux; layout(location=2) out vec4 oStk;\n' +
    'void main(){ ivec2 ip = ivec2(gl_FragCoord.xy); vec2 uv = gl_FragCoord.xy / uSize; vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0); oStk = vec4(0.);\n' +
    '  vec4 w = texture(uW, uv), pg = texture(uP, uv); float ph = texelFetch(uPaper, ip, 0).r;\n' +
    '  if (pg.a <= .0005){ oPig = pig; oAux = aux; return; }\n' +
    '  float gran = 1.25 - ph * .7 + (hash12(gl_FragCoord.xy) - .5) * .25;\n' +
    '  float ws = 0.; for (int k = 0; k < 8; k++){ float ang = float(k) * .785; vec2 o = vec2(cos(ang), sin(ang)); ws += texture(uW, uv + o * 3. / uSize).r + texture(uW, uv + o * 7. / uSize).r; } ws /= 16.;\n' +
    '  float rim = clamp((w.r - ws) * 3., 0., 1.) * .7 + smoothstep(.1, .0, w.r) * smoothstep(.0, .015, w.r) * .35;\n' +
    '  float soak = smoothstep(.0, .05, w.r);\n' +
    '  float rate = mix(1., (.012 + .045 * (1. - clamp(w.r / .6, 0., 1.))) * gran * uDt * 60. * (1. + 1.3 * rim), soak);\n' +
    '  float dep = clamp(pg.a * rate * .55, 0., 1.);\n' +
    '  vec3 col = glaze(pig.rgb, pg.rgb, dep * 1.6);\n' +
    '  oPig = vec4(col, pig.a * (1. - dep)); oAux = aux; }';

  
  var FS_COMP = COMMON + '\n' +
    'uniform sampler2D uPig, uAux, uPaper, uW, uP; uniform vec2 uSize; uniform vec3 uTint; uniform float uWet, uRelief;\n' +
    'out vec4 o;\n' +
    'void main(){ ivec2 ip = ivec2(gl_FragCoord.xy); vec2 uv = gl_FragCoord.xy / uSize;\n' +
    '  vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0);\n' +
    '  float h = texelFetch(uPaper, ip, 0).r;\n' +
    '  float hx = texelFetch(uPaper, ip + ivec2(1,0), 0).r - texelFetch(uPaper, ip - ivec2(1,0), 0).r;\n' +
    '  float hy = texelFetch(uPaper, ip + ivec2(0,1), 0).r - texelFetch(uPaper, ip - ivec2(0,1), 0).r;\n' +
    '  float ox = texelFetch(uAux, ip + ivec2(1,0), 0).g - texelFetch(uAux, ip - ivec2(1,0), 0).g;\n' +
    '  float oy = texelFetch(uAux, ip + ivec2(0,1), 0).g - texelFetch(uAux, ip - ivec2(0,1), 0).g;\n' +
    '  vec3 L = normalize(vec3(-.55, .62, .56));\n' +
    '  vec3 Np = normalize(vec3(-hx * uRelief, -hy * uRelief, 1.));\n' +
    '  vec3 No = normalize(vec3(-ox * 9., -oy * 9., 1.));\n' +
    '  float paperLit = .9 + .14 * dot(Np, L);\n' +
    '  vec3 col = pig.rgb;\n' +
    '  if (uWet > .5){ vec4 w = texture(uW, uv), pg = texture(uP, uv); if (pg.a > .0005){ col = glaze(col, pg.rgb, pg.a * .9); } col *= 1. - .06 * smoothstep(.02, .3, w.r); }\n' +
    '  col *= uTint * paperLit;\n' +
    '  vec3 V = vec3(0., 0., 1.), Hh = normalize(L + V);\n' +
    '  float sheen = pig.a * pow(max(dot(Np, Hh), 0.), 22.) * .55;\n' +
    '  col += sheen * vec3(.78, .8, .86);\n' +
    '  if (aux.g > .002){ float lit = .82 + .3 * dot(No, L); float spec = pow(max(dot(No, Hh), 0.), 48.) * .55 * smoothstep(.0, .15, aux.g);\n' +
    '    col = col * mix(1., lit, smoothstep(0., .12, aux.g)) + spec; }\n' +
    '  if (aux.a > .01) col *= 1. - .05 * aux.a * (1. - h);\n' +
    '  o = vec4(clamp(col, 0., 1.), 1.); }';

  var FS_AGE = '#version 300 es\nprecision highp float; uniform sampler2D uPig, uAux, uStk; uniform float uK; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1; layout(location=2) out vec4 o2;\n' +
    'void main(){ ivec2 ip = ivec2(gl_FragCoord.xy); vec4 a = texelFetch(uAux, ip, 0); o0 = texelFetch(uPig, ip, 0); a.b *= uK; o1 = a; o2 = texelFetch(uStk, ip, 0); }';
  
  var FS_IMG = '#version 300 es\nprecision highp float; uniform sampler2D uImg, uAux; uniform vec2 uSize; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1; layout(location=2) out vec4 o2;\n' +
    'void main(){ vec2 uv = gl_FragCoord.xy / uSize; o0 = vec4(texture(uImg, vec2(uv.x, 1. - uv.y)).rgb, 0.); o1 = vec4(0.); o2 = vec4(0.); }';
  var FS_COPY = '#version 300 es\nprecision highp float; uniform sampler2D uT; uniform vec2 uSize; out vec4 o; void main(){ o = texture(uT, gl_FragCoord.xy / uSize); }';
  var FS_INIT = '#version 300 es\nprecision highp float; uniform vec4 uV; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1; layout(location=2) out vec4 o2; void main(){ o0 = uV; o1 = vec4(0.); o2 = vec4(0.); }';
  
  var FS_FILL = COMMON + '\n' +
    'uniform sampler2D uPig, uAux, uMask; uniform vec2 uSize; uniform vec4 uMaskRect; uniform vec3 uColor; uniform int uMode; uniform float uAmt;\n' +
    'layout(location=0) out vec4 oPig; layout(location=1) out vec4 oAux; layout(location=2) out vec4 oStk;\n' +
    'void main(){ ivec2 ip = ivec2(gl_FragCoord.xy); vec4 pig = texelFetch(uPig, ip, 0), aux = texelFetch(uAux, ip, 0); oStk = vec4(0.);\n' +
    '  vec2 mp = (gl_FragCoord.xy - uMaskRect.xy) / uMaskRect.zw; float m = (mp.x < 0. || mp.y < 0. || mp.x > 1. || mp.y > 1.) ? 0. : texture(uMask, mp).r;\n' +
    '  if (m <= 0.){ oPig = pig; oAux = aux; return; }\n' +
    '  vec3 c = uColor;\n' +
    '  if (uMode == 1){ float g = clamp(mp.x * .55 + (1. - mp.y) * .45, 0., 1.); vec3 lo = toSrgb(toLin(c) * .62), hi = toSrgb(mix(toLin(c), vec3(1.), .32));\n' +
    '    c = g < .42 ? mix(hi, c, g / .42) : mix(c, lo, (g - .42) / .58); }\n' +
    '  oPig = vec4(mix(pig.rgb, c, m * uAmt), pig.a * (1. - m)); oAux = vec4(aux.r, aux.g * (1. - m), aux.b, aux.a); }';

  function Surface(canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
    if (!gl) throw new Error('webgl2');
    this.gl = gl; this.canvas = canvas;
    this.half = !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float');
    gl.getExtension('OES_texture_float_linear');
    this.W = opts.W; this.H = opts.H;
    canvas.width = this.W; canvas.height = this.H;
    var q = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, q);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.P = {
      paper: this.prog(FS_PAPER), dab: this.prog(FS_DAB), wcAdd: this.prog(FS_WC_ADD), wcStep: this.prog(FS_WC_STEP),
      wcDep: this.prog(FS_WC_DEP), comp: this.prog(FS_COMP), copy: this.prog(FS_COPY), init: this.prog(FS_INIT), fill: this.prog(FS_FILL),
      age: this.prog(FS_AGE), img: this.prog(FS_IMG)
    };
    var fmt = this.half ? [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT] : [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE];
    this.fmt = fmt;
    this.pig = [this.tex(this.W, this.H, fmt), this.tex(this.W, this.H, fmt)];
    this.aux = [this.tex(this.W, this.H, fmt), this.tex(this.W, this.H, fmt)];
    this.stk = [this.tex(this.W, this.H, fmt), this.tex(this.W, this.H, fmt)];
    this.fbA = this.fbo([this.pig[0], this.aux[0], this.stk[0]]); this.fbB = this.fbo([this.pig[1], this.aux[1], this.stk[1]]);
    this.paperT = this.tex(this.W, this.H, [gl.R8, gl.RED, gl.UNSIGNED_BYTE], true); this.fbPaper = this.fbo([this.paperT]);
    this.k = opts.simScale || 1; this.sw = Math.ceil(this.W * this.k); this.sh = Math.ceil(this.H * this.k);
    this.wW = [this.tex(this.sw, this.sh, fmt, true), this.tex(this.sw, this.sh, fmt, true)];
    this.wP = [this.tex(this.sw, this.sh, fmt, true), this.tex(this.sw, this.sh, fmt, true)];
    this.fbWA = this.fbo([this.wW[0], this.wP[0]]); this.fbWB = this.fbo([this.wW[1], this.wP[1]]);
    this.paperHalf = this.tex(this.sw, this.sh, [gl.R8, gl.RED, gl.UNSIGNED_BYTE], true); this.fbPaperHalf = this.fbo([this.paperHalf]);
    this.maskT = this.tex(4, 4, [gl.R8, gl.RED, gl.UNSIGNED_BYTE], true); this.maskRect = [0, 0, 1, 1]; this.useMask = 0;
    this.tint = [1, .995, .975];
    this.wet = null; this.dirty = true;
    this.clear();
    this.setPaper(opts.paper || 'cold');
  }

  Surface.prototype.prog = function (fs) {
    var gl = this.gl, p = gl.createProgram();
    [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
      var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      gl.attachShader(p, sh);
    });
    gl.bindAttribLocation(p, 0, 'aP'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    p.u = {}; var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var u = gl.getActiveUniform(p, i); p.u[u.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, u.name); }
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
    gl.drawBuffers(at); f.n = texs.length; f.w = texs[0].w; f.h = texs[0].h;
    return f;
  };
  Surface.prototype.bindTex = function (p, name, t, unit) {
    var gl = this.gl; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(p.u[name], unit);
  };
  Surface.prototype.run = function (p, fb, rect, w, h, setup) {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, w, h);
    gl.useProgram(p);
    if (rect) { gl.enable(gl.SCISSOR_TEST); gl.scissor(rect[0], rect[1], rect[2], rect[3]); } else gl.disable(gl.SCISSOR_TEST);
    gl.uniform4f(p.u.uRect, rect ? rect[0] : 0, rect ? rect[1] : 0, rect ? rect[2] : w, rect ? rect[3] : h);
    gl.uniform2f(p.u.uSize, w, h);
    setup && setup(p);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.SCISSOR_TEST);
  };
  Surface.prototype.blit = function (from, to, rect, n) {
    var gl = this.gl;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, from); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, to);
    for (var i = 0; i < n; i++) {
      gl.readBuffer(gl.COLOR_ATTACHMENT0 + i);
      var db = []; for (var k = 0; k < n; k++) db.push(k === i ? gl.COLOR_ATTACHMENT0 + i : gl.NONE);
      gl.drawBuffers(db);
      gl.blitFramebuffer(rect[0], rect[1], rect[0] + rect[2], rect[1] + rect[3], rect[0], rect[1], rect[0] + rect[2], rect[1] + rect[3], gl.COLOR_BUFFER_BIT, gl.NEAREST);
    }
    var all = []; for (var j = 0; j < n; j++) all.push(gl.COLOR_ATTACHMENT0 + j);
    gl.drawBuffers(all);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, from); gl.drawBuffers(all);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  };
  Surface.prototype.clip = function (r, W, H) {
    var x0 = Math.max(0, Math.floor(r[0])), y0 = Math.max(0, Math.floor(r[1]));
    var x1 = Math.min(W, Math.ceil(r[0] + r[2])), y1 = Math.min(H, Math.ceil(r[1] + r[3]));
    return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
  };

  Surface.prototype.clear = function () {
    var self = this;
    [this.fbA, this.fbB].forEach(function (fb) { self.run(self.P.init, fb, null, self.W, self.H, function (p) { self.gl.uniform4f(p.u.uV, 1, 1, 1, 0); }); });
    var gl = this.gl;
    [this.fbWA, this.fbWB].forEach(function (fb) { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); });
    this.wet = null; this.dirty = true;
  };

  Surface.prototype.setPaper = function (kind) {
    var K = { smooth: 0, cold: 1, rough: 2, canvas: 3 }, self = this;
    this.paperKind = kind;
    var sc = Math.max(1, this.W / 1100);
    this.run(this.P.paper, this.fbPaper, null, this.W, this.H, function (p) { self.gl.uniform1i(p.u.uKind, K[kind] || 0); self.gl.uniform1f(p.u.uScale, sc); });
    this.run(this.P.paper, this.fbPaperHalf, null, this.sw, this.sh, function (p) { self.gl.uniform1i(p.u.uKind, K[kind] || 0); self.gl.uniform1f(p.u.uScale, sc * self.k); });
    this.relief = { smooth: 2.2, cold: 3.6, rough: 5, canvas: 4.5 }[kind] || 3;
    this.dirty = true;
  };

  Surface.prototype.setMask = function (mask) {
    var gl = this.gl;
    if (!mask) { this.useMask = 0; return; }
    if (!mask.white) {
      
      var w = document.createElement('canvas'); w.width = mask.w; w.height = mask.h; var x = w.getContext('2d');
      x.drawImage(mask.c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, mask.w, mask.h);
      mask.white = w;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.maskT);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, mask.white);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this.maskRect = [mask.x, this.H - mask.y - mask.h, mask.w, mask.h];
    this.useMask = 1;
  };

  var TOOLS = { graphite: 0, pencil: 1, chalk: 2, oil: 3, eraser: 4, blend: 5, marker: 6 };

  Surface.prototype.dab = function (s, a, b) {
    var gl = this.gl, self = this, H = this.H;
    var ax = a.x, ay = H - a.y, bx = b.x, by = H - b.y;
    var ra = s.r * s.rf(a), rb = s.r * s.rf(b);
    if (s.tool === 'wash') return this.wcDab(s, a, b, ra, rb);
    var pad = Math.max(ra, rb) * (s.tool === 'chalk' ? 1.7 : 1) + 3;
    var rect = this.clip([Math.min(ax, bx) - pad, Math.min(ay, by) - pad, Math.abs(bx - ax) + pad * 2, Math.abs(by - ay) + pad * 2], this.W, this.H);
    if (!rect) return;
    this.run(this.P.dab, this.fbB, rect, this.W, this.H, function (p) {
      self.bindTex(p, 'uPig', self.pig[0], 0); self.bindTex(p, 'uAux', self.aux[0], 1); self.bindTex(p, 'uPaper', self.paperT, 2); self.bindTex(p, 'uMask', self.maskT, 3); self.bindTex(p, 'uStk', self.stk[0], 4);
      gl.uniform4f(p.u.uSeg, ax, ay, bx, by); gl.uniform2f(p.u.uRad, ra, rb); gl.uniform2f(p.u.uPress, a.p, b.p);
      gl.uniform3fv(p.u.uColor, s.rgb); gl.uniform1i(p.u.uTool, TOOLS[s.tool]); gl.uniform1f(p.u.uSeed, s.seed);
      gl.uniform1f(p.u.uLoad, s.load); gl.uniform1f(p.u.uGrade, s.grade || .7); gl.uniform1f(p.u.uTilt, b.tz || 0);
      gl.uniform1f(p.u.uUseMask, s.mask ? 1 : 0); gl.uniform4fv(p.u.uMaskRect, self.maskRect);
    });
    this.blit(this.fbB, this.fbA, rect, 3);
    s.box = s.box ? union(s.box, rect) : rect.slice();
    if (s.tool === 'oil') this.oilT = 300;
    if (s.tool === 'oil') s.load = Math.max(.05, s.load - .0045 * Math.hypot(bx - ax, by - ay) / Math.max(4, s.r));
    this.dirty = true;
  };

  Surface.prototype.wcDab = function (s, a, b, ra, rb) {
    var gl = this.gl, self = this, k = this.k, H = this.H;
    var ax = a.x * k, ay = (H - a.y) * k, bx = b.x * k, by = (H - b.y) * k; ra *= k; rb *= k;
    var pad = Math.max(ra, rb) * 1.2 + 3;
    var rect = this.clip([Math.min(ax, bx) - pad, Math.min(ay, by) - pad, Math.abs(bx - ax) + pad * 2, Math.abs(by - ay) + pad * 2], this.sw, this.sh);
    if (!rect) return;
    var mr = this.maskRect;
    this.run(this.P.wcAdd, this.fbWB, rect, this.sw, this.sh, function (p) {
      self.bindTex(p, 'uW', self.wW[0], 0); self.bindTex(p, 'uP', self.wP[0], 1); self.bindTex(p, 'uMask', self.maskT, 2);
      gl.uniform4f(p.u.uSeg, ax, ay, bx, by); gl.uniform2f(p.u.uRad, ra, rb); gl.uniform2f(p.u.uPress, a.p, b.p);
      gl.uniform3fv(p.u.uColor, s.rgb); gl.uniform1f(p.u.uLoad, s.load); gl.uniform1f(p.u.uSeed, s.seed);
      gl.uniform1f(p.u.uUseMask, s.mask ? 1 : 0); gl.uniform4f(p.u.uMaskRect, mr[0] * k, mr[1] * k, mr[2] * k, mr[3] * k);
    });
    this.blit(this.fbWB, this.fbWA, rect, 2);
    var full = [rect[0] / k, rect[1] / k, rect[2] / k, rect[3] / k];
    this.wet = this.wet ? union(this.wet, full) : full;
    this.wetAt = this.simT || 0;
    s.box = s.box ? union(s.box, full) : full.slice();
    s.load = Math.max(.15, s.load - .0012 * Math.hypot(bx - ax, by - ay) / Math.max(2, ra));
    this.dirty = true;
  };

  function union(a, b) {
    var x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]);
    return [x0, y0, Math.max(a[0] + a[2], b[0] + b[2]) - x0, Math.max(a[1] + a[3], b[1] + b[3]) - y0];
  }

  
  Surface.prototype.tick = function (dt) {
    if (!this.wet) return false;
    var gl = this.gl, self = this, k = this.k;
    dt = Math.min(.05, dt || .016); this.simT = (this.simT || 0) + dt * 1000;
    var pad = 24, r = this.clip([this.wet[0] * k - pad, this.wet[1] * k - pad, this.wet[2] * k + pad * 2, this.wet[3] * k + pad * 2], this.sw, this.sh);
    if (!r) { this.wet = null; return false; }
    this.run(this.P.wcStep, this.fbWB, r, this.sw, this.sh, function (p) {
      self.bindTex(p, 'uW', self.wW[0], 0); self.bindTex(p, 'uP', self.wP[0], 1); self.bindTex(p, 'uPaper', self.paperHalf, 2);
      gl.uniform1f(p.u.uDt, dt); gl.uniform2f(p.u.uFull, self.W, self.H);
    });
    this.blit(this.fbWB, this.fbWA, r, 2);
    var full = this.clip([r[0] / k, r[1] / k, r[2] / k, r[3] / k], this.W, this.H);
    this.run(this.P.wcDep, this.fbB, full, this.W, this.H, function (p) {
      self.bindTex(p, 'uPig', self.pig[0], 0); self.bindTex(p, 'uAux', self.aux[0], 1); self.bindTex(p, 'uPaper', self.paperT, 2);
      self.bindTex(p, 'uW', self.wW[0], 3); self.bindTex(p, 'uP', self.wP[0], 4); gl.uniform1f(p.u.uDt, dt);
    });
    this.blit(this.fbB, this.fbA, full, 2);
    this.dirty = true;
    if ((this.simT || 0) - (this.wetAt || 0) > (this.dryMs || 7000)) {
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbWA); gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
      this.run(this.P.wcDep, this.fbB, full, this.W, this.H, function (p) {
        self.bindTex(p, 'uPig', self.pig[0], 0); self.bindTex(p, 'uAux', self.aux[0], 1); self.bindTex(p, 'uPaper', self.paperT, 2);
        self.bindTex(p, 'uW', self.wW[0], 3); self.bindTex(p, 'uP', self.wP[0], 4); gl.uniform1f(p.u.uDt, dt);
      });
      this.blit(this.fbB, this.fbA, full, 2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbWA); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      this.wet = null; this.dirty = true; return false;
    }
    return true;
  };

  Surface.prototype.age = function (sec) {
    if (!this.oilT) return false;
    var self = this, k = Math.exp(-sec / 90);
    this.run(this.P.age, this.fbB, null, this.W, this.H, function (p) {
      self.bindTex(p, 'uPig', self.pig[0], 0); self.bindTex(p, 'uAux', self.aux[0], 1); self.bindTex(p, 'uStk', self.stk[0], 2); self.gl.uniform1f(p.u.uK, k);
    });
    this.blit(this.fbB, this.fbA, [0, 0, this.W, this.H], 3);
    this.oilT = Math.max(0, this.oilT - sec);
    return this.oilT > 0;
  };

  Surface.prototype.paintImage = function (img) {
    var gl = this.gl, self = this, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.run(this.P.img, this.fbB, null, this.W, this.H, function (p) { self.bindTex(p, 'uImg', t, 0); });
    this.blit(this.fbB, this.fbA, [0, 0, this.W, this.H], 2);
    gl.deleteTexture(t); this.dirty = true;
  };

  Surface.prototype.render = function () {
    var gl = this.gl, self = this;
    this.run(this.P.comp, null, null, this.W, this.H, function (p) {
      self.bindTex(p, 'uPig', self.pig[0], 0); self.bindTex(p, 'uAux', self.aux[0], 1); self.bindTex(p, 'uPaper', self.paperT, 2);
      self.bindTex(p, 'uW', self.wW[0], 3); self.bindTex(p, 'uP', self.wP[0], 4);
      gl.uniform3fv(p.u.uTint, self.tint); gl.uniform1f(p.u.uWet, self.wet ? 1 : 0); gl.uniform1f(p.u.uRelief, self.relief);
    });
    this.dirty = false;
  };

  Surface.prototype.wash = function (mask, hex, load) {
    this.setMask(mask);
    var cx = mask.x + mask.w / 2, cy = mask.y + mask.h / 2, r = Math.hypot(mask.w, mask.h) / 2 + 4;
    var st = this.stroke('wash', hex, r, { load: load == null ? .75 : load, mask: true });
    st.rf = function () { return 1; };
    this.dab(st, { x: cx, y: cy, p: .6 }, { x: cx + .01, y: cy, p: .6 });
    this.useMask = 0;
    return st.box;
  };

  Surface.prototype.clearWet = function (rect) {
    var gl = this.gl, k = this.k;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbWA); gl.enable(gl.SCISSOR_TEST);
    gl.scissor(Math.floor(rect[0] * k), Math.floor(rect[1] * k), Math.ceil(rect[2] * k) + 1, Math.ceil(rect[3] * k) + 1);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.disable(gl.SCISSOR_TEST);
  };

  Surface.prototype.keepPre = function () {
    var gl = this.gl;
    if (!this.fbPre) { this.pre = [this.tex(this.W, this.H, this.fmt), this.tex(this.W, this.H, this.fmt)]; this.fbPre = this.fbo(this.pre); }
    this.blit(this.fbA, this.fbPre, [0, 0, this.W, this.H], 2);
  };

  Surface.prototype.snapPre = function (rect) { return this.snap(rect, this.fbPre); };

  Surface.prototype.fill = function (mask, rgb, mode, amt) {
    var gl = this.gl, self = this;
    this.setMask(mask);
    var rect = [mask.x, this.H - mask.y - mask.h, mask.w, mask.h];
    this.run(this.P.fill, this.fbB, rect, this.W, this.H, function (p) {
      self.bindTex(p, 'uPig', self.pig[0], 0); self.bindTex(p, 'uAux', self.aux[0], 1); self.bindTex(p, 'uMask', self.maskT, 2);
      gl.uniform4fv(p.u.uMaskRect, self.maskRect); gl.uniform3fv(p.u.uColor, rgb); gl.uniform1i(p.u.uMode, mode || 0); gl.uniform1f(p.u.uAmt, amt == null ? 1 : amt);
    });
    this.blit(this.fbB, this.fbA, rect, 2);
    this.useMask = 0; this.dirty = true;
    return rect;
  };

  
  Surface.prototype.snap = function (rect, from) {
    var gl = this.gl, f = this.fmt;
    var t0 = this.tex(rect[2], rect[3], f), t1 = this.tex(rect[2], rect[3], f), fb = this.fbo([t0, t1]);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, from || this.fbA); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fb);
    for (var i = 0; i < 2; i++) {
      gl.readBuffer(gl.COLOR_ATTACHMENT0 + i);
      gl.drawBuffers(i === 0 ? [gl.COLOR_ATTACHMENT0, gl.NONE] : [gl.NONE, gl.COLOR_ATTACHMENT1]);
      gl.blitFramebuffer(rect[0], rect[1], rect[0] + rect[2], rect[1] + rect[3], 0, 0, rect[2], rect[3], gl.COLOR_BUFFER_BIT, gl.NEAREST);
    }
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    return { rect: rect.slice(), fb: fb, tex: [t0, t1], px: rect[2] * rect[3] };
  };
  Surface.prototype.restore = function (sn) {
    var gl = this.gl, r = sn.rect;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sn.fb); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fbA);
    for (var i = 0; i < 2; i++) {
      gl.readBuffer(gl.COLOR_ATTACHMENT0 + i);
      gl.drawBuffers(i === 0 ? [gl.COLOR_ATTACHMENT0, gl.NONE] : [gl.NONE, gl.COLOR_ATTACHMENT1]);
      gl.blitFramebuffer(0, 0, r[2], r[3], r[0], r[1], r[0] + r[2], r[1] + r[3], gl.COLOR_BUFFER_BIT, gl.NEAREST);
    }
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    this.dirty = true;
  };
  Surface.prototype.drop = function (sn) { var gl = this.gl; gl.deleteFramebuffer(sn.fb); sn.tex.forEach(function (t) { gl.deleteTexture(t); }); };

  Surface.prototype.read = function () {
    if (this.dirty) this.render();
    var gl = this.gl, px = new Uint8Array(this.W * this.H * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, this.W, this.H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return px;
  };

  Surface.prototype.destroy = function () {
    var ext = this.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
  };

  function hexToRgb(h) { var n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }

  
  Surface.prototype.stroke = function (tool, hex, r, opt) {
    opt = opt || {};
    var gl = this.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbA); gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbB); gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    var rf = {
      graphite: function (q) { return (.55 + .5 * q.p) * (1 + (q.tz || 0) * 2.2); },
      pencil: function (q) { return (.6 + .5 * q.p) * (1 + (q.tz || 0) * 1.8); },
      chalk: function (q) { return (.7 + .45 * q.p) * (1 + (q.tz || 0) * 1.5); },
      oil: function (q) { return .75 + .35 * q.p; },
      wash: function (q) { return .65 + .55 * q.p; },
      eraser: function (q) { return .8 + .3 * q.p; },
      blend: function (q) { return .8 + .4 * q.p; },
      marker: function (q) { return .85 + .2 * q.p; }
    }[tool] || function () { return 1; };
    return { tool: tool, rgb: hexToRgb(hex || '#000000'), r: r, rf: rf, seed: Math.random() * 100, load: opt.load == null ? 1 : opt.load, grade: opt.grade, mask: !!opt.mask, box: null };
  };

  window.GardenPaintGL = {
    supported: function () { try { var c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch (e) { return false; } },
    create: function (canvas, opts) { return new Surface(canvas, opts); },
    hexToRgb: hexToRgb
  };
})();
